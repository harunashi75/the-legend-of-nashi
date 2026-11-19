// Transitions de terrain de l'île, au même rendu que les routes (world-roads.js) : plus aucun escalier de cases.
// Chaque niveau de terrain (eau, sable, herbe du marais, feuilles d'automne, herbe, sous-bois) forme un champ lissé
// (B-spline quadratique) à partir des cases voisines ; en chaque bloc de 2 px, le niveau le plus haut dont le champ
// dépasse un seuil bousculé par un bruit fractal l'emporte. Les limites ondulent donc librement de part et d'autre
// des bords de cases : rivages, lisières, mares et esplanades deviennent organiques.
// - Relief : le terrain le plus haut a un talus éclairé en haut à gauche et projette son ombre sur le terrain d'en bas.
// - Eau : l'eau animée est dessinée sous le sol (drawWorldGround) ; ici, les pixels d'eau restent transparents, avec
//   un liseré d'écume, et la terre qui les borde est plus sombre (berge humide).
// Seules les cases de bord sont calculées (les autres gardent leur texture), à l'avance quand le navigateur a du temps
// libre, et gardées dans un cache ; sans canevas (tests), l'ancien rendu (débords dentelés) sert.
(() => {
  'use strict';
  const S = 48,
    B = 24;
  const LX = -0.6,
    LY = -0.8;
  // Niveau de chaque terrain qui se fond dans ses voisins ; toutes les eaux sont au même niveau (0). La roche (4) n'a
  // pas de niveau : sous elle, on peint le sol qui l'entoure, puis la paroi par-dessus (rockAt, plus bas).
  const LEVEL = { 0: 0, 15: 0, 18: 0, 3: 1, 11: 2, 16: 3, 51: 3, 1: 4, 10: 4, 50: 4, 5: 5, 17: 5 };
  const WATER = new Set([0, 15, 18]);
  const OTHER = 99;
  // Teinte de chaque eau quand elle déborde sur une case de l'autre eau.
  const WATER_TINT = { 0: [26, 80, 122], 15: [60, 132, 128], 18: [56, 60, 150] }; // roche, route, bâtiment : compte comme « plus haut » pour tous les niveaux
  const kit = () => window.CANAAN_GROUND_KIT;
  const bridge = (x, y) => BRIDGE_TILES.has(y * MAPW + x);
  // Palissade et emprises de la cité elfique : elles se fondent comme le sol de leur biome (les troncs sont un décor).
  const groundAt = (x, y) => {
    const t = tileAt(x, y);
    if (t === ROCK) return rockGround(x, y);
    return t === CANAAN_WOOD_TILE ? (CANAAN_WOOD_GROUND.get(y * MAPW + x) ?? 1) : t;
  };
  // ---------------------------------------------------------------- Roche : parois comme celles des Tréfonds
  // Une case de roche est d'abord peinte comme le sol le plus présent autour d'elle ; la paroi est posée par-dessus,
  // bloc de 2 px par bloc : forme lissée (B-spline des cases de roche, seuil bousculé par un bruit), face de falaise
  // en strates au bas de chaque massif (rebord éclairé, pied dans l'ombre, pied qui ondule), dessus de pierre
  // craquelée et moussue cerné d'encre, ombre portée sur le sol en bas à droite.
  const ROCK = 4;
  const RP = {
    top: [122, 128, 128],
    topDark: [88, 94, 98],
    topLight: [156, 162, 158],
    moss: [128, 136, 62],
    face: [104, 110, 116],
    dark: [62, 68, 76],
    light: [152, 160, 164],
    ink: [34, 38, 44]
  };
  let groundFor = null,
    groundMemo = null;
  function rockGround(x, y) {
    if (groundFor !== game.world.tiles) {
      groundFor = game.world.tiles;
      groundMemo = new Int16Array(MAPW * MAPH).fill(-1);
    }
    const k = y * MAPW + x;
    if (groundMemo[k] >= 0) return groundMemo[k];
    const count = {};
    let best = 1,
      most = 0;
    for (let j = -2; j <= 2; j++)
      for (let i = -2; i <= 2; i++) {
        let u = tileAt(x + i, y + j);
        if (u === CANAAN_WOOD_TILE) u = CANAAN_WOOD_GROUND.get((y + j) * MAPW + x + i) ?? 1;
        if (LEVEL[u] === undefined || WATER.has(u)) continue;
        count[u] = (count[u] || 0) + 1;
        if (count[u] > most) {
          most = count[u];
          best = u;
        }
      }
    groundMemo[k] = best;
    return best;
  }
  const isRockTile = (x, y) => tileAt(x, y) === ROCK;
  // Champ de roche au bloc (gx, gy) (blocs de 2 px du monde) : valeur, pente (par pixel) et seuil.
  const rk = { f: 0, gx: 0, gy: 0, thr: 0.5 };
  function rockField(gx, gy) {
    const K = kit(),
      { Q, DQ } = K,
      tx = Math.floor(gx / B),
      ty = Math.floor(gy / B),
      bx = gx - tx * B,
      by = gy - ty * B;
    let f = 0,
      fx = 0,
      fy = 0;
    for (let j = -1; j <= 1; j++) {
      const qy = Q[by * 5 + j + 2],
        dqy = DQ[by * 5 + j + 2];
      for (let i = -1; i <= 1; i++) {
        if (!isRockTile(tx + i, ty + j)) continue;
        const qx = Q[bx * 5 + i + 2];
        f += qx * qy;
        fx += DQ[bx * 5 + i + 2] * qy;
        fy += qx * dqy;
      }
    }
    rk.f = f;
    rk.gx = fx / S;
    rk.gy = fy / S;
    if (f < 0.01) {
      rk.thr = 0.5;
      return false;
    }
    const wx = gx * 2 + 1,
      wy = gy * 2 + 1;
    rk.thr = 0.5 + (K.fbm(wx / 34, wy / 34, 231) - 0.5) * 0.34 + (K.vnoise(wx / 7, wy / 7, 232) - 0.5) * 0.1;
    return f > rk.thr;
  }
  // Hauteur de la face (en blocs), qui varie le long de la paroi.
  const faceH = gx => 20 + Math.floor(kit().vnoise(gx / 9, 0.5, 233) * 9);
  // Voronoï (cellules de cell px) : distance au joint (e) et centre de la cellule la plus proche.
  const vor = { e: 0, cx: 0, cy: 0, id: 0 };
  function voronoi(x, y, cell, seed) {
    const K = kit(),
      gx = Math.floor(x / cell),
      gy = Math.floor(y / cell);
    let d1 = 1e9,
      d2 = 1e9;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = (gx + i + 0.15 + K.ih(gx + i, gy + j, seed) * 0.7) * cell,
          cy = (gy + j + 0.15 + K.ih(gx + i, gy + j, seed + 1) * 0.7) * cell,
          d = Math.hypot(x - cx, y - cy);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          vor.cx = cx;
          vor.cy = cy;
          vor.id = K.ih(gx + i, gy + j, seed + 2);
        } else if (d < d2) d2 = d;
      }
    vor.e = (d2 - d1) / 2;
    return vor;
  }
  const col = [0, 0, 0];
  const setC = c => ((col[0] = c[0]), (col[1] = c[1]), (col[2] = c[2]));
  const mixC = (c, t) => {
    col[0] += (c[0] - col[0]) * t;
    col[1] += (c[1] - col[1]) * t;
    col[2] += (c[2] - col[2]) * t;
  };
  const mulC = m => ((col[0] *= m), (col[1] *= m), (col[2] *= m));
  // Face de falaise : u blocs au-dessus du pied, h blocs de haut ; strates qui ondulent, fissures, éclats clairs.
  function faceColor(wx, u, h) {
    const K = kit(),
      st = u + (K.fbm(wx / 70, 0.5, 113) - 0.5) * 10,
      band = Math.floor(st / 4);
    setC(RP.face);
    mixC(band & 1 ? RP.dark : RP.light, 0.2 + 0.2 * K.ih(band, 0, 114));
    const n = K.vnoise(wx / 10, st / 2, 115);
    if (n > 0.7) mixC(RP.light, (n - 0.7) * 1.6);
    else if (n < 0.25) mulC(0.86);
    const cr = Math.floor(wx / 26);
    if (K.ih(cr, band >> 1, 116) > 0.62 && Math.abs((wx % 26) - 13 - (u & 1)) < 1.5) mulC(0.62);
    if (st % 4 < 0.7) mulC(0.86);
    // Rebord éclairé en haut, pied dans l'ombre.
    mulC(0.8 + 0.32 * Math.min(1, u / h));
    if (u >= h - 1) mixC(RP.light, 0.55);
    if (u < 3) mulC(0.62 + u * 0.1);
  }
  // Dessus de la roche : masses craquelées, taches de mousse, quelques cailloux ; d : distance au bord, L : lumière.
  function topColor(wx, wy, d, L) {
    const K = kit(),
      n = K.fbm(wx / 22, wy / 22, 241),
      v = voronoi(wx + (n - 0.5) * 24, wy + (K.fbm(wx / 22, wy / 22, 246) - 0.5) * 24, 44, 245);
    // Blocs de pierre bombés : chaque masse est éclairée en haut à gauche, sombre en bas à droite, joints creusés.
    setC(RP.top);
    mixC(v.id > 0.5 ? RP.topLight : RP.topDark, Math.abs(v.id - 0.5) * 0.7);
    mixC(n > 0.5 ? RP.topLight : RP.topDark, Math.abs(n - 0.5) * 0.9);
    const ox = (wx - v.cx) / 17,
      oy = (wy - v.cy) / 22,
      // > 0 du côté de la lumière (haut gauche), < 0 à l'opposé.
      toLight = Math.max(-1, Math.min(1, ox * LX + oy * LY));
    mulC(1 + 0.24 * toLight);
    if (v.e < 1.3) {
      mixC(RP.dark, 0.75);
      mulC(0.88);
    } else if (v.e < 3.2) mulC(toLight > 0 ? 1.18 : 0.84);
    if (Math.abs(K.vnoise(wx / 14, wy / 14, 242) - 0.5) < 0.02) mulC(0.78);
    const m = K.fbm(wx / 40, wy / 40, 243);
    if (m > 0.6) mixC(RP.moss, Math.min(0.5, (m - 0.6) * 3));
    if (K.ih(wx >> 3, wy >> 3, 244) > 0.97 && ((wx >> 1) & 3) < 2 && ((wy >> 1) & 3) < 2)
      mixC(RP.topLight, 0.6);
    if (d < 7 && L < 0) mulC(1 + 0.4 * -L * (1 - d / 7));
    else if (d < 6 && L > 0) mulC(1 - 0.18 * L * (1 - d / 6));
  }
  // Paroi au bloc (gx, gy) : couleur dans col et vrai, ou faux et ombre portée (multiplicateur) dans rk.shade.
  // below(k) : roche k blocs plus bas (mémo de la case en cours).
  function rockAt(gx, gy, below) {
    const rock = rockField(gx, gy),
      rf = rk.f,
      gl = Math.hypot(rk.gx, rk.gy),
      L = gl > 0.0015 ? (rk.gx * LX + rk.gy * LY) / gl : 0,
      d = gl > 0.0015 ? (rf - rk.thr) / gl : rock ? 60 : -60;
    if (!rock) {
      rk.shade = rf > 0.01 && d > -14 ? 1 - (0.16 + 0.22 * Math.max(0, L)) * (1 + d / 14) : 1;
      return false;
    }
    const H = faceH(gx);
    let k = 1;
    while (k <= H + 2 && below(k)) k++;
    const wx = gx * 2 + 1,
      wy = gy * 2 + 1;
    if (k <= H) faceColor(wx, k - 1, H);
    else if (d < 2.2 || k === H + 1) setC(RP.ink);
    else {
      topColor(wx, wy, d, L);
      if (k === H + 2) mulC(1.25);
    }
    return true;
  }
  function levelAt(x, y) {
    if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return 0;
    if (bridge(x, y)) return 0;
    const l = LEVEL[groundAt(x, y)];
    return l === undefined ? OTHER : l;
  }
  // Eau à dessiner sous une case (la sienne, ou celle d'une voisine si la case borde l'eau) ; -1 : aucune.
  let underFor = null,
    underBridges = -1,
    under = null;
  function waterUnder(x, y) {
    if (underFor !== game.world.tiles || underBridges !== BRIDGE_TILES.size) {
      under = new Int8Array(MAPW * MAPH).fill(-2);
      underFor = game.world.tiles;
      underBridges = BRIDGE_TILES.size;
    }
    const k = y * MAPW + x;
    if (under[k] !== -2) return under[k];
    let w = -1;
    const t = groundAt(x, y);
    if (WATER.has(t) && !bridge(x, y)) w = t;
    // Pont, route ou terre au bord de l'eau : l'eau des cases voisines passe dessous.
    else if (LEVEL[t] !== undefined || bridge(x, y) || t === 2)
      for (let j = -1; j <= 1 && w < 0; j++)
        for (let i = -1; i <= 1 && w < 0; i++) {
          const n = groundAt(x + i, y + j);
          if (WATER.has(n) && !bridge(x + i, y + j)) w = n;
        }
    under[k] = w;
    return w;
  }
  // Une case de bord : ses voisins n'ont pas tous son niveau.
  function paint(tx, ty, v) {
    const K = kit();
    if (!K?.active()) return null;
    const lv = new Int16Array(9),
      own = levelAt(tx, ty);
    if (own === OTHER || own === undefined) return null;
    const levels = new Set([own]),
      // Sur une case d'eau, une route voisine compte comme de l'eau : c'est la route qui dessine son propre bord.
      wetHere = own === 0 && !bridge(tx, ty),
      lvl = (x, y) => (wetHere && groundAt(x, y) === 2 && !bridge(x, y) ? 0 : levelAt(x, y));
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const l = lvl(tx + i, ty + j);
        lv[(j + 1) * 3 + i + 1] = l;
        if (l !== OTHER) levels.add(l);
      }
    // Mer et eau peu profonde (marais, lacs) côte à côte : limite organique par une teinte translucide sur l'eau animée.
    const ownT = WATER.has(groundAt(tx, ty)) && !bridge(tx, ty) ? groundAt(tx, ty) : -1;
    let shallowT = -1,
      seaNear = false;
    const wocc = new Float32Array(9);
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const u = groundAt(tx + i, ty + j),
          isW = WATER.has(u) && !bridge(tx + i, ty + j);
        if (isW && u !== 0) shallowT = u;
        if (isW && u === 0) seaNear = true;
        wocc[(j + 1) * 3 + i + 1] = isW ? (u === 0 ? 0 : 1) : ownT === 0 ? 0 : 1;
      }
    const mixed = ownT >= 0 && shallowT >= 0 && seaNear;
    let nearRock = false;
    for (let j = -1; j <= 1 && !nearRock; j++)
      for (let i = -1; i <= 1 && !nearRock; i++) nearRock = isRockTile(tx + i, ty + j);
    if (levels.size < 2 && !mixed && !nearRock) return null;
    // Roche sous chaque bloc de la case, jusqu'à 26 blocs plus bas (hauteur des faces) : calculée une fois.
    const RH = B + 26,
      rockMemo = nearRock ? new Int8Array(B * RH).fill(-1) : null;
    let curBx = 0,
      curBy = 0;
    const below = k => {
      const m = (curBy + k) * B + curBx;
      if (rockMemo[m] < 0) {
        const keep = { ...rk };
        rockMemo[m] = rockField(tx * B + curBx, ty * B + curBy + k) ? 1 : 0;
        Object.assign(rk, keep);
      }
      return rockMemo[m] === 1;
    };
    const order = [...levels].sort((a, b) => a - b),
      n = order.length;
    // Terrain qui représente chaque niveau : le plus présent autour (la case elle-même d'abord).
    const kind = order.map(l => {
      const t = groundAt(tx, ty);
      if (LEVEL[t] === l) return t;
      const count = {};
      let best = -1,
        most = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const u = groundAt(tx + i, ty + j);
          if (LEVEL[u] !== l || bridge(tx + i, ty + j)) continue;
          count[u] = (count[u] || 0) + 1;
          if (count[u] > most) {
            most = count[u];
            best = u;
          }
        }
      return best < 0 ? (l === 0 ? 0 : 1) : best;
    });
    const tex = kind.map(t => (WATER.has(t) ? null : K.terrainData(t) || K.terrainData(1)));
    // Présence de chaque niveau (au-dessus du plus bas) dans les 3 × 3 cases.
    const occ = [];
    for (let k = 1; k < n; k++) occ.push(lv.map(l => (l >= order[k] ? 1 : 0)));
    const c = document.createElement('canvas');
    c.width = c.height = S;
    // Image perdue par Chromium (mémoire graphique saturée) : tout le cache est repeint.
    c.addEventListener?.('contextlost', () => (cacheFor = null));
    const g = c.getContext('2d'),
      img = g.createImageData(S, S),
      out = img.data,
      f = new Float32Array(n),
      gx = new Float32Array(n),
      gy = new Float32Array(n),
      Q = K.Q,
      DQ = K.DQ,
      { fbm, vnoise, smooth, ih } = K;
    for (let by = 0; by < B; by++)
      for (let bx = 0; bx < B; bx++) {
        const wx = tx * S + bx * 2 + 1,
          wy = ty * S + by * 2 + 1,
          thr = 0.5 + (fbm(wx / 38, wy / 38, 201) - 0.5) * 0.4 + (vnoise(wx / 8, wy / 8, 202) - 0.5) * 0.08;
        let win = 0;
        for (let k = 1; k < n; k++) {
          const o = occ[k - 1];
          let a = 0,
            ax = 0,
            ay = 0;
          // Seules les cases voisines immédiates comptent (le support de la B-spline fait 1,5 case).
          for (let j = 0; j < 3; j++) {
            const qy = Q[by * 5 + j + 1],
              dqy = DQ[by * 5 + j + 1];
            for (let i = 0; i < 3; i++) {
              if (!o[j * 3 + i]) continue;
              const qx = Q[bx * 5 + i + 1];
              a += qx * qy;
              ax += DQ[bx * 5 + i + 1] * qy;
              ay += qx * dqy;
            }
          }
          f[k] = a;
          gx[k] = ax / S;
          gy[k] = ay / S;
          if (a > thr) win = k;
        }
        // Distance au bord (en pixels) et direction vers l'intérieur, pour le niveau gagnant et celui du dessus.
        const dist = k => {
          const gl = Math.hypot(gx[k], gy[k]);
          return gl > 0.0015 ? (f[k] - thr) / gl : f[k] > thr ? 60 : -60;
        };
        const lit = k => {
          const gl = Math.hypot(gx[k], gy[k]);
          return gl > 0.0015 ? (gx[k] * LX + gy[k] * LY) / gl : 0;
        };
        let r = 0,
          gr = 0,
          b = 0,
          a = 255,
          shade = 1;
        if (!tex[win]) {
          // Eau : transparente (l'eau animée est dessous), liseré d'écume contre la rive.
          a = 0;
          if (mixed) {
            let w = 0;
            for (let j = 0; j < 3; j++)
              for (let i = 0; i < 3; i++) if (wocc[j * 3 + i]) w += Q[bx * 5 + i + 1] * Q[by * 5 + j + 1];
            const shallow = w > thr;
            if (shallow !== (ownT !== 0)) {
              const tint = shallow ? WATER_TINT[shallowT] : WATER_TINT[0];
              r = tint[0];
              gr = tint[1];
              b = tint[2];
              a = 200;
            }
          }
          if (n > 1) {
            const d = dist(1);
            if (d > -3.5) {
              r = 232;
              gr = 246;
              b = 240;
              a = Math.round(255 * 0.42 * (1 + d / 3.5));
              if (ih(wx >> 1, wy >> 1, 203) > 0.75) a = Math.round(a * 0.4);
            }
          }
        } else {
          if (win > 0) {
            const d = dist(win);
            if (d < 5) {
              if (!tex[win - 1]) shade *= 0.74 + 0.26 * smooth(0, 5, d);
              else shade *= 1 - 0.2 * lit(win) * (1 - d / 5);
            }
          }
          if (win + 1 < n) {
            const d = dist(win + 1),
              l = lit(win + 1);
            if (d > -6 && l > 0) shade *= 1 - 0.26 * l * (1 + d / 6);
          }
        }
        // Paroi de roche par-dessus, ou son ombre sur le sol.
        if (nearRock) {
          curBx = bx;
          curBy = by;
          if (rockAt(tx * B + bx, ty * B + by, below)) {
            for (let q = 0; q < 4; q++) {
              const o = ((by * 2 + (q >> 1)) * S + bx * 2 + (q & 1)) * 4;
              out[o] = col[0];
              out[o + 1] = col[1];
              out[o + 2] = col[2];
              out[o + 3] = 255;
            }
            continue;
          }
          shade *= rk.shade;
          if (!tex[win]) {
            r *= rk.shade;
            gr *= rk.shade;
            b *= rk.shade;
          }
        }
        for (let q = 0; q < 4; q++) {
          const px = bx * 2 + (q & 1),
            py = by * 2 + (q >> 1),
            o = (py * S + px) * 4;
          if (tex[win]) {
            const s = (py * 192 + v * S + px) * 4,
              t = tex[win];
            out[o] = t[s] * shade;
            out[o + 1] = t[s + 1] * shade;
            out[o + 2] = t[s + 2] * shade;
            out[o + 3] = 255;
          } else {
            out[o] = r;
            out[o + 1] = gr;
            out[o + 2] = b;
            out[o + 3] = a;
          }
        }
      }
    g.putImageData(img, 0, 0);
    return c;
  }
  // Cache des cases peintes (null : case sans bord, texture ordinaire), vidé quand l'île change.
  const KEEP = 3200;
  let cache = new Map(),
    cacheFor = null,
    cacheBridges = -1;
  function fresh() {
    if (cacheFor !== game.world.tiles || cacheBridges !== BRIDGE_TILES.size) {
      cache = new Map();
      cacheFor = game.world.tiles;
      cacheBridges = BRIDGE_TILES.size;
    }
  }
  function tile(x, y, v) {
    fresh();
    const id = y * 4096 + x;
    if (cache.has(id)) {
      const img = cache.get(id);
      cache.delete(id);
      cache.set(id, img);
      return img;
    }
    const img = paint(x, y, v);
    cache.set(id, img);
    if (cache.size > KEEP) cache.delete(cache.keys().next().value);
    return img;
  }
  // Préparation d'avance (temps libre) : vrai quand toutes les cases du rectangle sont prêtes.
  function warm(x0, y0, x1, y1, deadline) {
    if (!active()) return true;
    fresh();
    for (let y = Math.max(0, y0); y < Math.min(MAPH, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(MAPW, x1); x++) {
        if (cache.has(y * 4096 + x)) continue;
        if (performance.now() > deadline) return false;
        tile(x, y, (x * 7 + y * 13) & 3);
      }
    return true;
  }
  const active = () => !!kit()?.active();
  window.CANAAN_BLEND = Object.freeze({ tile, warm, waterUnder, active });
})();
