// Routes de l'île : rendu continu, calculé pixel par pixel (par blocs de 2 px, style pixel art) en coordonnées du
// monde, donc sans aucune couture d'une case à l'autre.
// - Forme : les cases de route forment un champ lissé (B-spline quadratique) ; le bord est la ligne de niveau 0,5,
//   bousculée par un bruit fractal. La pente du champ donne une vraie distance au bord (en pixels) et sa direction :
//   talus éclairés d'un côté et ombrés de l'autre, ombre portée de l'herbe, occlusion le long des bords, brins d'herbe
//   qui débordent sur la chaussée.
// - Un second champ, plus large (B-spline cubique), trace des lignes qui suivent la route : ornières et bandes d'herbe.
// - Chaque région a sa chaussée : terre battue des Plaines (ornières, cailloux, flaques qui reflètent le ciel), sous-bois
//   moussu de la Forêt ancienne, boue et flaques du Marais, feuilles mortes de la Forêt automnale, dalles de grès à
//   moitié ensablées du Désert, dalles d'ardoise aux joints lumineux de la Forêt enchantée, pavés du Camp de l'Aurore et
//   esplanades de dalles en cercles autour des portails.
// Les cases sont peintes à la demande (et gardées dans un petit cache) ; sans canevas (tests), le rendu d'avant sert.
(() => {
  'use strict';
  const S = 48,
    B = 24; // blocs de 2 px par côté
  // Lumière venue d'en haut à gauche, comme sur les décors et les personnages.
  const LX = -0.6,
    LY = -0.8;
  const SOFT = new Set([1, 3, 5, 10, 11, 15, 16, 17]);
  const isRoad = (x, y) => tileAt(x, y) === 2 && !BRIDGE_TILES.has(y * MAPW + x);
  // Eau (mer, marais, lacs) hors des ponts : la route s'y arrête en bord organique, l'eau animée passe dessous.
  const WET = new Set([0, 15, 18]);
  const isWet = (x, y) => WET.has(tileAt(x, y)) && !BRIDGE_TILES.has(y * MAPW + x);
  const isHard = (x, y) => !isRoad(x, y) && !SOFT.has(tileAt(x, y)) && !isWet(x, y);
  // Bruit : hachage entier, bruit de valeur lissé et somme fractale.
  function ih(x, y, s) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      xf = x - xi,
      yf = y - yi,
      u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf),
      a = ih(xi, yi, s),
      b = ih(xi + 1, yi, s),
      c = ih(xi, yi + 1, s),
      d = ih(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.57 + vnoise(x * 2.03, y * 2.03, s + 7) * 0.29 + vnoise(x * 4.1, y * 4.1, s + 13) * 0.14;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  // Poids des B-splines (valeur et dérivée) pour chaque bloc de la case et chaque case voisine (-2 à +2).
  const Q = new Float32Array(B * 5),
    DQ = new Float32Array(B * 5),
    C = new Float32Array(B * 5),
    DC = new Float32Array(B * 5);
  for (let b = 0; b < B; b++)
    for (let i = 0; i < 5; i++) {
      const u = (b * 2 + 1) / S - (i - 2 + 0.5),
        a = Math.abs(u),
        sg = u < 0 ? -1 : 1,
        k = b * 5 + i;
      if (a < 0.5) {
        Q[k] = 0.75 - u * u;
        DQ[k] = -2 * u;
      } else if (a < 1.5) {
        Q[k] = 0.5 * (1.5 - a) ** 2;
        DQ[k] = -(1.5 - a) * sg;
      }
      if (a < 1) {
        C[k] = (4 - 6 * a * a + 3 * a * a * a) / 6;
        DC[k] = ((-12 * a + 9 * a * a) / 6) * sg;
      } else if (a < 2) {
        C[k] = (2 - a) ** 3 / 6;
        DC[k] = (-3 * (2 - a) ** 2 / 6) * sg;
      }
    }
  // Pixels des textures de terrain (sous la route, hors de la chaussée), lus une fois par terrain.
  const TERRAIN_DATA = {};
  function terrainData(t) {
    if (TERRAIN_DATA[t] !== undefined) return TERRAIN_DATA[t];
    const strip = PIXEL_TERRAIN[t];
    let data = null;
    try {
      data = strip?.getContext('2d')?.getImageData(0, 0, 192, 48)?.data || null;
    } catch (e) {
      data = null;
    }
    TERRAIN_DATA[t] = data;
    return data;
  }
  // Voronoï : cellule la plus proche (centre, identifiant) et distance au joint.
  const vor = { e: 0, id: 0, cx: 0, cy: 0, r: 0 };
  function voronoi(x, y, cell, s) {
    const gx = Math.floor(x / cell),
      gy = Math.floor(y / cell);
    let d1 = 1e9,
      d2 = 1e9;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = gx + i,
          cy = gy + j,
          px = (cx + 0.18 + 0.64 * ih(cx, cy, s)) * cell,
          py = (cy + 0.18 + 0.64 * ih(cx, cy, s + 1)) * cell,
          dd = (px - x) * (px - x) + (py - y) * (py - y);
        if (dd < d1) {
          d2 = d1;
          d1 = dd;
          vor.id = ih(cx, cy, s + 2);
          vor.cx = px;
          vor.cy = py;
        } else if (dd < d2) d2 = dd;
      }
    d1 = Math.sqrt(d1);
    vor.r = d1;
    vor.e = (Math.sqrt(d2) - d1) / 2;
    return vor;
  }
  // Lieu pavé : la place du camp (dalles en cercles) ; les portails se posent directement sur le sol de leur biome.
  let placesFor = null,
    plazas = [];
  function places() {
    if (placesFor === game.world.tiles) return plazas;
    placesFor = game.world.tiles;
    plazas = [];
    plazas.push({ x: (CANAAN_CAMP.x + 0.5) * S, y: (CANAAN_CAMP.y + 0.5) * S, r: 3.3 * S });
    // Place de la cité elfique : anneaux de marbre (zone 6 : marbre et joints dorés).
    if (window.CANAAN_CITY_PLAN) plazas.push({ x: (CANAAN_CITY_PLAN.center.x + 0.5) * S, y: (CANAAN_CITY_PLAN.center.y + 0.5) * S, r: 5.2 * S, zone: 6 });
    return plazas;
  }
  const CAMP = () => ({ x: (CANAAN_CAMP.x + 0.5) * S, y: (CANAAN_CAMP.y + 0.5) * S, r: (CANAAN_CAMP.r + 5) * S });
  // Chaussée de chaque région (indice des ZONES) : couleurs [sombre, moyen, clair].
  const DIRT = [
    [[132, 102, 70], [170, 138, 98], [200, 172, 128]],
    [[104, 82, 58], [136, 108, 76], [164, 136, 98]],
    [[78, 66, 48], [104, 88, 64], [132, 114, 84]],
    [[124, 90, 62], [158, 120, 84], [188, 150, 106]]
  ];
  const LEAVES = [[217, 84, 47], [233, 138, 44], [239, 193, 69], [168, 67, 42], [196, 112, 52]];
  const STONES = [[152, 146, 138], [128, 122, 116], [168, 158, 142], [140, 126, 108], [118, 112, 104]];
  const SLABS = [[214, 182, 128], [198, 164, 110], [226, 196, 140], [188, 152, 100]];
  const SLATES = [[78, 86, 104], [66, 74, 92], [92, 98, 116], [74, 78, 100], [84, 80, 104]];
  const col = [0, 0, 0];
  const set = (c, k = 1) => {
    col[0] = c[0] * k;
    col[1] = c[1] * k;
    col[2] = c[2] * k;
  };
  const mix = (c, t) => {
    col[0] += (c[0] - col[0]) * t;
    col[1] += (c[1] - col[1]) * t;
    col[2] += (c[2] - col[2]) * t;
  };
  const mul = k => {
    col[0] *= k;
    col[1] *= k;
    col[2] *= k;
  };
  // Petit caillou arrondi (4 px), éclairé en haut à gauche ; 0 si aucun ici.
  // Petit caillou arrondi (cellules de 8 px), éclairé en haut à gauche, ombre portée en bas à droite ; 0 si aucun ici.
  function pebble(wx, wy, chance, s) {
    const cx = wx >> 3,
      cy = wy >> 3;
    if (ih(cx, cy, s) > chance) return 0;
    const ox = 2 + Math.floor(ih(cx, cy, s + 1) * 2) * 2,
      oy = 2 + Math.floor(ih(cx, cy, s + 2) * 2) * 2,
      lx = (wx & 7) - ox,
      ly = (wy & 7) - oy,
      big = ih(cx, cy, s + 3) > 0.5 ? 2 : 1;
    if (lx >= 0 && ly >= 0 && lx <= big * 2 && ly <= big * 2 - (big - 1) * 2) return lx + ly < big * 2 ? 1.25 : 0.85;
    if (lx >= 1 && ly >= 1 && lx <= big * 2 + 2 && ly <= big * 2 + 1) return -1;
    return 0;
  }
  // Flaque : eau sombre qui reflète le ciel, bord de boue humide, reflet en biais. Renvoie vrai si la flaque est peinte.
  function puddle(wx, wy, d, level, s) {
    const p = fbm(wx / 46, wy / 46, s);
    if (d < 8 || p < level) return false;
    const deep = clamp((p - level) / 0.06, 0, 1);
    if (deep < 0.22) {
      mul(0.7);
      return false;
    }
    // Ciel reflété : plus clair vers le haut de la flaque, nuages étirés, bord vaseux.
    set([46, 62, 76]);
    mix([118, 156, 184], 0.25 + 0.45 * smooth(0.25, 1, deep) * fbm(wx / 90, wy / 14, s + 3));
    const glint = vnoise(wx / 5, wy / 2.5, s + 5);
    if (deep > 0.55 && glint > 0.82) mix([236, 246, 252], 0.65);
    if (deep < 0.36) mix([66, 56, 42], 0.55);
    return true;
  }
  // Ornières : deux lignes du champ large, à pas de roue d'une charrette.
  function ruts(F, g, d, lit) {
    if (d < 6 || g < 1e-4) return;
    for (const level of [0.78]) {
      const r = (F - level) / g;
      if (Math.abs(r) < 2.6) {
        mul(0.74 + 0.08 * (Math.abs(r) / 2.6));
        if (r * lit > 1.2) mul(1.28);
      }
    }
  }
  function shadeDirt(zone, wx, wy, d, F, gF, lit) {
    const pal = DIRT[zone] || DIRT[0],
      n = fbm(wx / 34, wy / 34, 11 + zone);
    set(pal[1]);
    if (n < 0.5) mix(pal[0], (0.5 - n) * 1.6);
    else mix(pal[2], (n - 0.5) * 1.6);
    // Terre tassée au milieu, plus claire ; grain fin.
    if (F > 0.9) mix(pal[2], 0.18);
    ruts(F, gF, d, lit);
    // Bande d'herbe entre les ornières, en touffes.
    if (zone === 0 && F > 0.95 && fbm(wx / 16, wy / 16, 51) + (ih(wx >> 1, wy >> 1, 53) - 0.5) * 0.18 > 0.54) {
      set([86, 134, 62]);
      const blade = ih(wx >> 1, (wy >> 1) + (wx % 3), 52);
      if (blade > 0.62) set([122, 170, 84]);
      else if (blade < 0.2) set([64, 104, 50]);
      return;
    }
    if (zone === 1 && fbm(wx / 20, wy / 20, 31) > 0.62) mix([82, 110, 54], 0.62);
    if (zone === 1 && ih(wx >> 1, wy, 33) > 0.985) set([70, 52, 34]);
    if (puddle(wx, wy, d, zone === 2 ? 0.6 : 0.73, 21 + zone)) return;
    if (zone === 3 && fbm(wx / 26, wy / 26, 41) > 0.42 && ih(wx >> 1, wy >> 1, 43) > 0.86) {
      set(LEAVES[Math.floor(ih(wx >> 1, wy >> 1, 44) * LEAVES.length)]);
      return;
    }
    if (zone === 2 && ih(wx >> 1, wy >> 1, 61) > 0.97) set([62, 52, 38]);
    const p = pebble(wx, wy, zone === 2 ? 0.03 : 0.07, 71);
    if (p < 0) mul(0.78);
    else if (p) {
      set(zone === 1 ? [128, 132, 120] : [158, 148, 132]);
      mul(p);
    }
  }
  // Pavés du camp : pierres rondes, joints de terre et de mousse, bordure de gros pavés.
  function shadeCobble(wx, wy, d) {
    const kerb = d < 6,
      v = voronoi(wx, wy, kerb ? 15 : 10, kerb ? 81 : 82);
    if (v.e < (kerb ? 1.3 : 1.1)) {
      set([84, 74, 60]);
      if (fbm(wx / 18, wy / 18, 83) > 0.6) set([80, 112, 58]);
      return;
    }
    set(STONES[Math.floor(v.id * STONES.length)], kerb ? 0.86 : 1);
    const lx = (wx - v.cx) / 6,
      ly = (wy - v.cy) / 6;
    mul(1 + 0.16 * clamp(lx * LX + ly * LY, -1, 1));
    mul(0.84 + 0.16 * Math.min(1, v.e / 3));
    if (v.id > 0.82 && fbm(wx / 6, wy / 6, 84) > 0.62) mix([94, 126, 66], 0.5);
  }
  // Esplanade d'un portail : dalles en anneaux autour d'un médaillon central.
  function shadePlaza(wx, wy, p, zone) {
    const dx = wx - p.x,
      dy = wy - p.y,
      r = Math.hypot(dx, dy),
      tone = zone === 6 ? MARBLE : zone === 4 ? SLABS : zone === 5 ? SLATES : STONES;
    if (r < 13) {
      set(tone[2]);
      if (Math.abs(r - 8) < 1.2) set([96, 86, 72]);
      else if (r < 4) set(zone === 5 ? [150, 236, 220] : [230, 196, 120]);
      mul(1 + 0.12 * clamp((dx * LX + dy * LY) / 13, -1, 1));
      return;
    }
    const ring = Math.floor((r - 13) / 12),
      ringR = r - 13 - ring * 12,
      count = Math.max(8, Math.round((2 * Math.PI * (13 + ring * 12 + 6)) / 14)),
      a = (Math.atan2(dy, dx) / (2 * Math.PI) + 1 + (ring % 2) * (0.5 / count)) % 1,
      seg = Math.floor(a * count),
      along = (a * count - seg) * ((2 * Math.PI * r) / count);
    if (ringR < 1.4 || along < 1.4) {
      set([86, 78, 66]);
      if (zone === 5) mix([110, 240, 215], 0.55);
      return;
    }
    const id = ih(ring, seg, 91);
    set(tone[Math.floor(id * tone.length)]);
    mul(1 + 0.14 * clamp(((ringR - 6) / 6) * ((dx / r) * LX + (dy / r) * LY), -1, 1));
    mul(0.86 + 0.14 * Math.min(1, Math.min(ringR, along) / 3));
  }
  // Désert : dalles de grès posées en rangées décalées, fissurées, à moitié recouvertes par le sable.
  function shadeSlabs(wx, wy, d) {
    const row = Math.floor(wy / 14),
      off = ih(row, 0, 101) * 18,
      col0 = Math.floor((wx + off) / 18),
      lx = wx + off - col0 * 18,
      ly = wy - row * 14,
      id = ih(col0, row, 102);
    const drift = fbm(wx / 30, wy / 30, 103) + (1 - clamp(d / 16, 0, 1)) * 0.4;
    if (lx < 1.5 || ly < 1.5) set([150, 118, 76]);
    else {
      set(SLABS[Math.floor(id * SLABS.length)]);
      mul(1 + 0.1 * clamp(((lx - 9) / 9) * LX + ((ly - 7) / 7) * LY, -1, 1));
      if (lx > 16 || ly > 12) mul(0.82);
      if (id > 0.72) {
        const ang = id * 40,
          cx = Math.cos(ang),
          cy = Math.sin(ang);
        if (Math.abs((lx - 9) * cy - (ly - 7) * cx) < 0.8 && Math.abs((lx - 9) * cx + (ly - 7) * cy) < 6) mul(0.66);
      }
    }
    if (drift > 0.6) {
      const k = smooth(0.6, 0.7, drift);
      const sand = (wy + Math.round(Math.sin(wx / 9) * 3)) % 7 < 2 ? [206, 176, 118] : [218, 189, 130];
      mix(sand, k);
    }
  }
  // Forêt enchantée : dalles d'ardoise, joints de lumière turquoise ou violette, runes gravées sur quelques dalles.
  function shadeSlate(wx, wy, d) {
    const v = voronoi(wx, wy, 13, 111),
      glow = smooth(0.56, 0.74, fbm(wx / 60, wy / 60, 112)),
      hue = fbm(wx / 120, wy / 120, 113) > 0.5 ? [120, 244, 220] : [196, 150, 255];
    if (v.e < 1.1) {
      set([34, 38, 54]);
      mix(hue, 0.85 * glow);
      return;
    }
    set(SLATES[Math.floor(v.id * SLATES.length)]);
    const lx = (wx - v.cx) / 7,
      ly = (wy - v.cy) / 7;
    mul(1 + 0.18 * clamp(lx * LX + ly * LY, -1, 1));
    mul(0.8 + 0.2 * Math.min(1, v.e / 3));
    if (v.e < 2.2) mix(hue, 0.12 * glow);
    if (v.id > 0.94 && v.r < 4.5) {
      const ax = Math.abs(wx - v.cx),
        ay = Math.abs(wy - v.cy);
      if (ax < 1 || ay < 1 || Math.abs(ax - ay) < 1) mix(hue, 0.8);
    }
    if (d > 3 && ih(wx >> 1, wy >> 1, 114) > 0.992) set([230, 255, 248]);
  }
  // Cité elfique : dalles de marbre clair en rangées décalées, joints dorés, quelques feuilles de jade incrustées.
  const MARBLE = [[238, 232, 216], [226, 220, 202], [246, 242, 230], [216, 210, 192], [232, 226, 212]];
  function shadeMarble(wx, wy, d) {
    const row = Math.floor(wy / 14),
      off = ih(row, 0, 131) * 20,
      col0 = Math.floor((wx + off) / 20),
      lx = wx + off - col0 * 20,
      ly = wy - row * 14,
      id = ih(col0, row, 132);
    if (lx < 1.5 || ly < 1.5) {
      set([196, 164, 86]);
      return;
    }
    set(MARBLE[Math.floor(id * MARBLE.length)]);
    mul(1 + 0.08 * clamp(((lx - 10) / 10) * LX + ((ly - 7) / 7) * LY, -1, 1));
    if (lx > 18 || ly > 12) mul(0.9);
    // Veinure légère.
    if (Math.abs(Math.sin((wx + wy * 0.6) / 7 + id * 9)) < 0.05) mul(0.9);
    // Feuille de jade sur une dalle sur six.
    if (id > 0.83) {
      const ax = Math.abs(lx - 10),
        ay = Math.abs(ly - 7);
      if (ax + ay * 1.6 < 4.5 && ax < 3.5) set(ay < 1 ? [150, 230, 190] : [86, 180, 140]);
    }
    if (d > 3 && ih(wx >> 1, wy >> 1, 133) > 0.996) set([255, 246, 210]);
  }
  // Couleur de la chaussée en un point (avant éclairage).
  function surface(wx, wy, d, F, gF, lit) {
    const camp = CAMP(),
      jitter = (fbm(wx / 40, wy / 40, 121) - 0.5) * 70 + (ih(wx >> 2, wy >> 2, 122) - 0.5) * 18,
      zone = Math.max(0, ZONES.indexOf(regionAt((wx + jitter) / S, (wy - jitter) / S)));
    // Esplanade : bord rond et net (léger bruit doux), bordure de pierres taillées.
    for (const p of places()) {
      const r = Math.hypot(wx - p.x, wy - p.y),
        edge = p.r + (fbm(wx / 60, wy / 60, 123) - 0.5) * 14;
      const pz = p.zone ?? (p.zone = Math.max(0, ZONES.indexOf(regionAt(p.x / S, p.y / S))));
      if (r < edge - 7) return shadePlaza(wx, wy, p, pz), 0.4;
      if (r < edge) {
        const seg = Math.floor((Math.atan2(wy - p.y, wx - p.x) / (2 * Math.PI) + 1) * Math.round(p.r / 7)),
          joint = ((Math.atan2(wy - p.y, wx - p.x) / (2 * Math.PI) + 1) * Math.round(p.r / 7)) % 1;
        set(pz === 6 ? MARBLE[seg % MARBLE.length] : pz === 5 ? SLATES[seg % SLATES.length] : pz === 4 ? SLABS[seg % SLABS.length] : STONES[seg % STONES.length], 0.8);
        if (joint < 0.06 || r > edge - 1.5) mul(0.6);
        else if (r < edge - 5.5) mul(1.18);
        return 0.4;
      }
    }
    if (Math.hypot(wx - camp.x, wy - camp.y) < camp.r + jitter * 1.2) return shadeCobble(wx, wy, d), 0.45;
    if (canaanInCity(wx / S, wy / S)) return shadeMarble(wx, wy, d), 0.4;
    if (zone === 4) return shadeSlabs(wx, wy, d), 0.5;
    if (zone === 5) return shadeSlate(wx, wy, d), 0.55;
    shadeDirt(zone, wx, wy, d, F, gF, lit);
    return 1;
  }
  // Terrain le plus présent autour d'une case (sous la route), à défaut de mieux.
  function dominant(tx, ty) {
    const count = {};
    let best = 1,
      most = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const t = tileAt(tx + i, ty + j);
        if (!SOFT.has(t) || isRoad(tx + i, ty + j)) continue;
        count[t] = (count[t] || 0) + 1;
        if (count[t] > most) {
          most = count[t];
          best = t;
        }
      }
    return best;
  }
  // Peinture d'une case : route (avec le terrain voisin hors de la chaussée) ou recouvrement d'une case voisine.
  let probe;
  function active() {
    if (probe === undefined) {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext?.('2d');
      probe = !!(g && typeof g.putImageData === 'function' && g.createImageData?.(2, 2)?.data?.length === 16 && terrainData(1)?.length === 192 * 48 * 4);
    }
    return probe;
  }
  function paint(tx, ty, v, road) {
    if (!active()) return null;
    const occ = new Float32Array(25),
      occ2 = new Float32Array(25);
    let any = false;
    for (let j = -2; j <= 2; j++)
      for (let i = -2; i <= 2; i++) {
        const r = isRoad(tx + i, ty + j) ? 1 : 0;
        occ2[(j + 2) * 5 + i + 2] = r;
        occ[(j + 2) * 5 + i + 2] = r || (road && Math.abs(i) <= 1 && Math.abs(j) <= 1 && isHard(tx + i, ty + j)) ? 1 : 0;
        if (r && Math.abs(i) <= 1 && Math.abs(j) <= 1) any = true;
      }
    if (!any) return null;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d'),
      img = g.createImageData(S, S),
      out = img.data,
      base = dominant(tx, ty);
    let drawn = false;
    for (let by = 0; by < B; by++)
      for (let bx = 0; bx < B; bx++) {
        let f = 0,
          fx = 0,
          fy = 0,
          F = 0,
          Fx = 0,
          Fy = 0;
        for (let j = 0; j < 5; j++) {
          const qy = Q[by * 5 + j],
            dqy = DQ[by * 5 + j],
            cy = C[by * 5 + j],
            dcy = DC[by * 5 + j];
          for (let i = 0; i < 5; i++) {
            const o = occ[j * 5 + i],
              o2 = occ2[j * 5 + i];
            if (o) {
              f += Q[bx * 5 + i] * qy;
              fx += DQ[bx * 5 + i] * qy;
              fy += Q[bx * 5 + i] * dqy;
            }
            if (o2) {
              F += C[bx * 5 + i] * cy;
              Fx += DC[bx * 5 + i] * cy;
              Fy += C[bx * 5 + i] * dcy;
            }
          }
        }
        const wx = tx * S + bx * 2 + 1,
          wy = ty * S + by * 2 + 1,
          thr = 0.5 + (fbm(wx / 40, wy / 40, 3) - 0.5) * 0.42 + (vnoise(wx / 9, wy / 9, 4) - 0.5) * 0.07,
          g1 = Math.hypot(fx, fy) / S,
          d = g1 > 0.0015 ? clamp((f - thr) / g1, -60, 60) : f > thr ? 60 : -60,
          gnx = g1 > 0.0015 ? fx / S / g1 : 0,
          gny = g1 > 0.0015 ? fy / S / g1 : 0,
          lit = gnx * LX + gny * LY,
          gF = Math.hypot(Fx, Fy) / S;
        // Hors de la chaussée : le terrain (sur une case de route) ou rien (sur une case voisine), avec un liseré
        // sombre du côté de l'ombre et clair du côté de la lumière.
        let rim = 1,
          alpha = 255,
          onRoad = d >= 0;
        // Brins d'herbe qui débordent sur la chaussée.
        if (onRoad && d < 4 && ih(wx >> 1, wy >> 1, 9) < (1 - d / 4) * 0.75) onRoad = false;
        let shade = 1;
        if (onRoad) {
          const sunk = surface(wx, wy, d, F, gF, lit);
          // Talus éclairé ou dans l'ombre, occlusion le long des bords, ombre portée de l'herbe.
          if (d < 7) shade *= 1 + 0.3 * sunk * lit * (1 - d / 7);
          shade *= 1 - 0.2 * sunk * (1 - smooth(0, 8, d));
          const cast = clamp(-(d + 6 * lit) / 3, 0, 1);
          shade *= 1 - 0.28 * cast;
        } else if (d > -4) {
          rim = lit < 0 ? 1 - 0.32 * (1 + Math.max(-4, d) / 4) * (0.5 - lit * 0.5) : 1 + 0.22 * lit * smooth(-2.5, 0, d);
          if (d >= 0) rim = 1;
        }
        // Terrain voisin sous la route : celui vers lequel pointe le bord, sinon le plus présent autour.
        let tex = null,
          hole = false;
        if (!onRoad) {
          if (road) {
            const sx = Math.floor((wx - gnx * (Math.max(0, d) + 14)) / S),
              sy = Math.floor((wy - gny * (Math.max(0, d) + 14)) / S),
              t = tileAt(sx, sy);
            // Côté eau : trou transparent (l'eau animée est dessous), liseré d'écume contre le pavé.
            if (isWet(sx, sy)) {
              hole = true;
              alpha = d > -3.5 ? Math.round(255 * 0.45 * (1 + Math.max(-3.5, d) / 3.5)) : 0;
            } else tex = terrainData(SOFT.has(t) && !isRoad(sx, sy) ? t : base) || terrainData(1);
          } else if (rim === 1 && d < 0) continue;
          else if (d >= 0) continue;
          else alpha = Math.round(255 * Math.abs(rim - 1));
        }
        drawn = true;
        for (let k = 0; k < 4; k++) {
          const px = bx * 2 + (k & 1),
            py = by * 2 + (k >> 1),
            o = (py * S + px) * 4;
          if (onRoad) {
            const grain = 1 + (ih(wx + (k & 1), wy + (k >> 1), 7) - 0.5) * 0.07;
            out[o] = col[0] * shade * grain;
            out[o + 1] = col[1] * shade * grain;
            out[o + 2] = col[2] * shade * grain;
            out[o + 3] = 255;
          } else if (hole) {
            out[o] = 232;
            out[o + 1] = 246;
            out[o + 2] = 240;
            out[o + 3] = alpha;
          } else if (tex) {
            const s = (py * 192 + v * S + px) * 4;
            out[o] = tex[s] * rim;
            out[o + 1] = tex[s + 1] * rim;
            out[o + 2] = tex[s + 2] * rim;
            out[o + 3] = 255;
          } else {
            const light = rim > 1;
            out[o] = light ? 255 : 30;
            out[o + 1] = light ? 246 : 22;
            out[o + 2] = light ? 210 : 12;
            out[o + 3] = alpha;
          }
        }
      }
    if (!drawn) return null;
    g.putImageData(img, 0, 0);
    return c;
  }
  // Cache des cases peintes (les plus anciennes sont oubliées), vidé quand l'île change.
  const KEEP = 1600;
  let cache = new Map(),
    keep = new Map(),
    cacheFor = null,
    cacheBridges = -1;
  function cached(tx, ty, v, road) {
    if (cacheFor !== game.world.tiles || cacheBridges !== BRIDGE_TILES.size) {
      cache = new Map();
      keep = new Map();
      cacheFor = game.world.tiles;
      cacheBridges = BRIDGE_TILES.size;
    }
    const id = ty * 4096 + tx;
    // L'eau du marais est redessinée à chaque image : ses bords de route sont gardés pour de bon (jamais recalculés
    // au milieu d'une image).
    if (keep.has(id)) return keep.get(id);
    if (cache.has(id)) {
      const img = cache.get(id);
      cache.delete(id);
      cache.set(id, img);
      return img;
    }
    const img = paint(tx, ty, v, road);
    if (tileAt(tx, ty) === 15) return keep.set(id, img), img;
    cache.set(id, img);
    if (cache.size > KEEP) cache.delete(cache.keys().next().value);
    return img;
  }
  // Préparation d'avance (temps libre du navigateur) : peint les cases de route et leurs voisines d'un rectangle,
  // jusqu'à l'heure limite ; vrai quand tout est prêt (le bloc de sol se construit alors sans calcul de route).
  const nearRoad = (x, y) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isRoad(x + i, y + j)) return true;
    return false;
  };
  function warm(x0, y0, x1, y1, deadline) {
    if (!active()) return true;
    if (cacheFor !== game.world.tiles || cacheBridges !== BRIDGE_TILES.size) cached(-9, -9, 0, false);
    for (let y = Math.max(0, y0); y < Math.min(MAPH, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(MAPW, x1); x++) {
        const road = isRoad(x, y);
        if (cache.has(y * 4096 + x) || keep.has(y * 4096 + x) || !(road || (SOFT.has(tileAt(x, y)) && nearRoad(x, y)))) continue;
        if (performance.now() > deadline) return false;
        cached(x, y, (x * 7 + y * 13) & 3, road);
      }
    return true;
  }
  // Case de route entière (null : rendu d'avant) ; recouvrement d'une case de terrain voisine (null : rien à peindre).
  const tile = (x, y, v) => (isRoad(x, y) ? cached(x, y, v, true) : null);
  const overlay = (x, y, v) => (SOFT.has(tileAt(x, y)) && !isRoad(x, y) ? cached(x, y, v, false) : null);
  window.CANAAN_ROADS = Object.freeze({ tile, overlay, active, warm });
  // Outils partagés avec les transitions de terrain (world-blend.js).
  window.CANAAN_GROUND_KIT = Object.freeze({ ih, vnoise, fbm, clamp, smooth, terrainData, Q, DQ, active });
})();
