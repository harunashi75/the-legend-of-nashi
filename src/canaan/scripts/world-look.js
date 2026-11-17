// Rendu de l'île au niveau des donjons : textures détaillées des biomes, transitions douces entre terrains,
// falaises en relief, eau animée, décors avec volume et contour, et ambiance lumineuse propre à chaque biome.
(() => {
  'use strict';
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function rect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  // Palettes [base, sombre, clair, détail] des tuiles de l'île.
  const PAL = {
    0: ['#1d5a86', '#16466c', '#3a7fae', '#7cc0dc'],
    1: ['#4f8a42', '#3d7234', '#6aa552', '#9cc46a'],
    2: ['#a88a62', '#8a6e4a', '#c4a67a', '#6e5a40'],
    3: ['#d8bb80', '#c4a266', '#ead296', '#b08a50'],
    4: ['#6e767c', '#545b62', '#8e979a', '#3e444a'],
    5: ['#33603a', '#264a2c', '#467a46', '#6a5a32'],
    10: ['#6aa04a', '#528838', '#8cc060', '#b8d878'],
    11: ['#3e6a58', '#2e5244', '#557e68', '#6a6a3a'],
    15: ['#3f8a86', '#2f6e6c', '#5fa8a0', '#a8e0d0'],
    16: ['#9a5a2a', '#7a4220', '#c07a34', '#e8b040'],
    17: ['#2e6e72', '#22545a', '#40908a', '#9ff0e0'],
    18: ['#3a3e9a', '#2a2c78', '#5a60c8', '#c8d0ff']
  };
  const WATER = new Set([0, 15, 18]);
  // Ordre de recouvrement des bords : un terrain plus haut déborde sur son voisin.
  const PRIORITY = { 0: 0, 15: 1, 18: 1, 3: 2, 2: 3, 11: 4, 16: 5, 1: 6, 10: 6, 5: 7, 17: 7 };
  const h = (x, y, k = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  // Petit motif répété sur toute la case (et recopié de l'autre côté pour l'eau qui défile).
  function scatter(g, n, seed, fn, wrap = false) {
    for (let k = 0; k < n; k++) {
      const x = Math.floor(h(k, seed, 1) * 48),
        y = Math.floor(h(seed, k, 2) * 48);
      fn(x, y, k);
      if (wrap && x > 36) fn(x - 48, y, k);
    }
  }
  function paintTile(g, t, v) {
    const p = PAL[t],
      s = t * 13 + v * 7;
    rect(g, 0, 0, 48, 48, p[0]);
    // Marbrure douce commune à tous les sols.
    g.globalAlpha = 0.35;
    scatter(
      g,
      7,
      s + 1,
      (x, y, k) => rect(g, x - 4, y - 3, 10 + (k % 3) * 4, 7, k % 2 ? p[1] : p[2]),
      WATER.has(t)
    );
    g.globalAlpha = 1;
    if (t === 1 || t === 10 || t === 5 || t === 17) {
      // Herbes : touffes de brins sombres et clairs.
      scatter(g, t === 5 ? 18 : 30, s + 2, (x, y, k) => {
        rect(g, x, y, 1, 3, p[1]);
        rect(g, x + 1, y - 1, 1, 3, k % 3 ? p[2] : p[3]);
        rect(g, x + 2, y + 1, 1, 2, p[1]);
      });
      if (t === 1 && v === 2)
        scatter(g, 3, s + 3, (x, y, k) => {
          rect(g, x, y, 3, 3, ['#ffffff', '#f8d96a', '#f6c5e2'][k]);
          rect(g, x + 1, y + 1, 1, 1, '#e6a33e');
        });
      if (t === 5) scatter(g, 10, s + 4, (x, y, k) => rect(g, x, y, 3, 2, k % 2 ? p[3] : '#8a6a3a'));
      if (t === 17) scatter(g, 6, s + 5, (x, y, k) => rect(g, x, y, 2, 2, k % 2 ? p[3] : '#d4b4ff'));
    } else if (t === 2) {
      scatter(g, 40, s + 2, (x, y, k) => rect(g, x, y, 1, 1, k % 2 ? p[1] : p[2]));
      scatter(g, 8, s + 3, (x, y) => {
        rect(g, x, y + 2, 5, 1, p[3]);
        rect(g, x, y, 5, 2, p[2]);
      });
      rect(g, 6 + v * 5, 18, 12, 1, p[1]);
      rect(g, 26 - v * 3, 34, 14, 1, p[1]);
    } else if (t === 3) {
      scatter(g, 50, s + 2, (x, y, k) => rect(g, x, y, 1, 1, k % 2 ? p[1] : p[2]));
      for (let k = 0; k < 2; k++) {
        const y = 12 + k * 20 + v * 3;
        g.strokeStyle = p[2];
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(2, y);
        g.quadraticCurveTo(24, y - 6, 46, y);
        g.stroke();
        g.strokeStyle = p[3];
        g.globalAlpha = 0.5;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(2, y + 2);
        g.quadraticCurveTo(24, y - 4, 46, y + 2);
        g.stroke();
        g.globalAlpha = 1;
      }
    } else if (t === 4) {
      scatter(g, 5, s + 2, (x, y, k) => {
        rect(g, x - 5, y - 3, 12, 7, k % 2 ? p[1] : p[2]);
        rect(g, x - 5, y - 3, 12, 1, p[2]);
      });
      rect(g, 8 + v * 4, 14, 10, 1, p[3]);
      rect(g, 17 + v * 4, 14, 1, 8, p[3]);
      rect(g, 28, 32 - v * 2, 12, 1, p[3]);
    } else if (t === 11) {
      scatter(g, 3, s + 2, (x, y) => {
        rect(g, x - 5, y - 2, 12, 5, '#26443a');
        rect(g, x - 3, y - 2, 4, 1, '#7aa494');
      });
      scatter(g, 14, s + 3, (x, y) => {
        rect(g, x, y, 1, 4, '#5e8a54');
        rect(g, x + 2, y + 1, 1, 3, '#7aa464');
      });
    } else if (t === 16) {
      scatter(g, 30, s + 2, (x, y, k) => {
        rect(g, x, y, 4, 3, ['#d9542f', '#e98a2c', '#efc145', '#a8432a'][k % 4]);
        rect(g, x + 1, y + 1, 2, 1, '#6a3a1a');
      });
    } else if (WATER.has(t)) {
      scatter(
        g,
        8,
        s + 2,
        (x, y, k) => {
          rect(g, x, y, 9, 2, k % 2 ? p[2] : p[3]);
          rect(g, x + 2, y + 2, 6, 1, p[1]);
        },
        true
      );
      if (t === 15)
        scatter(g, 4, s + 3, (x, y) => {
          rect(g, x, y, 1, 5, '#6e9a5a');
          rect(g, x + 2, y + 1, 1, 4, '#8ab46a');
        });
    }
  }
  // Textures des tuiles : bandes 4 × 48 px, au même format que PIXEL_TERRAIN.
  function buildTerrain() {
    for (const key of Object.keys(PAL)) {
      const t = Number(key),
        strip = canvas(192, 48),
        g = strip.getContext('2d');
      for (let v = 0; v < 4; v++) {
        const tile = canvas(48, 48);
        paintTile(tile.getContext('2d'), t, v);
        g.drawImage(tile, v * 48, 0);
      }
      // Mer : voile bleu profond peint une fois dans la texture (il était repeint sur chaque case à chaque image).
      if (t === 0) {
        g.fillStyle = 'rgba(17,92,144,.18)';
        g.fillRect(0, 0, 192, 48);
      }
      PIXEL_TERRAIN[t] = strip;
    }
  }
  // Bords dentelés : la texture du terrain voisin déborde de 5 à 12 px sur la case.
  const FRINGE = {};
  function fringe(t, dir) {
    const key = t + ':' + dir;
    if (FRINGE[key]) return FRINGE[key];
    const c = canvas(48, 48),
      g = c.getContext('2d');
    // Masque peint à part puis appliqué d'un coup (destination-in effacerait tout hors du dernier bloc).
    const mask = canvas(48, 48),
      mg = mask.getContext('2d');
    mg.fillStyle = '#000';
    for (let k = 0; k < 48; k += 3) {
      const depth = 4 + Math.floor(h(k, t, dir) * 6) + Math.floor(Math.sin(k * 0.3 + t) * 2 + 2);
      if (dir === 0) mg.fillRect(k, 0, 3, depth);
      else if (dir === 2) mg.fillRect(k, 48 - depth, 3, depth);
      else if (dir === 3) mg.fillRect(0, k, depth, 3);
      else mg.fillRect(48 - depth, k, depth, 3);
    }
    g.drawImage(PIXEL_TERRAIN[t], 0, 0, 48, 48, 0, 0, 48, 48);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mask, 0, 0);
    FRINGE[key] = c;
    return c;
  }
  // Bords des chemins : au lieu d'un carré, le terrain voisin mord sur la route en vagues douces (les vagues se
  // raccordent d'une case à l'autre), les angles extérieurs sont arrondis et les angles intérieurs s'arrondissent sur
  // l'herbe. Les formes sont calculées par blocs de 2 pixels (style pixel) et gardées en cache.
  const ROAD_EDGE = {};
  const ROUND = 24,
    FILLET = 22;
  function maskedTile(key, t, v, inside, band) {
    if (ROAD_EDGE[key]) return ROAD_EDGE[key];
    const c = canvas(48, 48),
      g = c.getContext('2d');
    // Le masque est peint à part, puis appliqué d'un coup (destination-in effacerait tout hors du dernier bloc).
    const mask = canvas(48, 48),
      mg = mask.getContext('2d');
    mg.fillStyle = '#000';
    for (let by = 0; by < 48; by += 2) for (let bx = 0; bx < 48; bx += 2) if (inside(bx + 1, by + 1)) mg.fillRect(bx, by, 2, 2);
    g.drawImage(PIXEL_TERRAIN[t], v * 48, 0, 48, 48, 0, 0, 48, 48);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mask, 0, 0);
    g.globalCompositeOperation = 'source-over';
    if (band) {
      g.fillStyle = 'rgba(40,24,10,.26)';
      for (let by = 0; by < 48; by += 2) for (let bx = 0; bx < 48; bx += 2) if (band(bx + 1, by + 1)) g.fillRect(bx, by, 2, 2);
    }
    ROAD_EDGE[key] = c;
    return c;
  }
  // Profondeur de la morsure le long d'un bord (k de 0 à 48) : la même aux deux bouts, variée au milieu.
  const BITE = [0, 3, 5, -1];
  const bite = (k, dir, v) => Math.max(1, 5 + 2.5 * Math.sin((4 * Math.PI * k) / 48 + dir * 1.7) + BITE[v] * Math.sin((Math.PI * k) / 48));
  // Repère d'un bord : k le long du bord, a la distance au bord.
  const along = (dir, px, py) => (dir === 0 || dir === 2 ? [px, dir === 0 ? py : 48 - py] : [py, dir === 3 ? px : 48 - px]);
  // Un bout du bord s'efface en douceur (taper) là où un angle intérieur arrondi prend le relais sur la case voisine.
  const ease = (k, a, b) => {
    let f = 1;
    if (a) f = Math.min(f, Math.max(0, (k - 2) / (FILLET - 2)));
    if (b) f = Math.min(f, Math.max(0, (46 - k) / (FILLET - 2)));
    return f * f * (3 - 2 * f);
  };
  function roadSide(t, dir, v, a0, b0) {
    const depth = k => bite(k, dir, v) * ease(k, a0, b0);
    return maskedTile('s' + t + ':' + dir + ':' + v + ':' + a0 + b0, t, v, (px, py) => {
      const [k, a] = along(dir, px, py);
      return a < depth(k);
    }, (px, py) => {
      const [k, a] = along(dir, px, py),
        d = depth(k);
      return d > 0.5 && a >= d && a < d + 2;
    });
  }
  // Coin : 0 haut-gauche, 1 haut-droite, 2 bas-droite, 3 bas-gauche.
  const cornerXY = (corner, px, py) => [corner === 1 || corner === 2 ? 48 - px : px, corner >= 2 ? 48 - py : py];
  function roadCorner(t, corner, v) {
    return maskedTile('c' + t + ':' + corner + ':' + v, t, v, (px, py) => {
      const [cx, cy] = cornerXY(corner, px, py);
      return cx < ROUND && cy < ROUND && Math.hypot(cx - ROUND, cy - ROUND) > ROUND;
    }, (px, py) => {
      const [cx, cy] = cornerXY(corner, px, py),
        d = Math.hypot(cx - ROUND, cy - ROUND);
      return cx < ROUND && cy < ROUND && d <= ROUND && d > ROUND - 2;
    });
  }
  function roadFillet(corner, v) {
    return maskedTile('f' + corner + ':' + v, 2, v, (px, py) => {
      const [cx, cy] = cornerXY(corner, px, py);
      return cx < FILLET && cy < FILLET && Math.hypot(cx - FILLET, cy - FILLET) > FILLET;
    });
  }
  const isRoad = (x, y) => tileAt(x, y) === 2 && !BRIDGE_TILES.has(y * MAPW + x);
  // Terrains qui arrondissent les chemins : la terre ferme et l'eau peu profonde du marais (pas la mer ni la roche).
  const softEdge = n => n !== 2 && n !== 4 && (!WATER.has(n) || n === 15) && PIXEL_TERRAIN[n] && PRIORITY[n] !== undefined;
  const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  // Coins : les deux côtés qui les bordent, et la case en diagonale.
  const CORNERS = [[3, 0, -1, -1], [0, 1, 1, -1], [1, 2, 1, 1], [2, 3, -1, 1]];
  function roadEdges(out, x, y, v) {
    const around = SIDES.map(([dx, dy]) => tileAt(x + dx, y + dy)),
      soft = SIDES.map(([dx, dy], i) => softEdge(around[i]) && !BRIDGE_TILES.has((y + dy) * MAPW + x + dx));
    for (let dir = 0; dir < 4; dir++) {
      if (!soft[dir]) continue;
      // Les deux bouts du bord (gauche/droite, ou haut/bas) : la route continue-t-elle en tournant derrière l'herbe ?
      const [dx, dy] = SIDES[dir],
        ends = dir % 2 === 0 ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]],
        [a0, b0] = ends.map(([sx, sy]) => {
          const next = tileAt(x + sx, y + sy);
          // Route qui tourne derrière l'herbe, ou bord qui arrive sur l'eau, un pont ou la roche : la morsure s'efface.
          return (isRoad(x + sx, y + sy) && isRoad(x + sx + dx, y + sy + dy)) || (!isRoad(x + sx, y + sy) && !softEdge(next)) || BRIDGE_TILES.has((y + sy) * MAPW + x + sx) ? 1 : 0;
        });
      out.push(roadSide(around[dir], dir, (v + dir) & 3, a0, b0));
    }
    CORNERS.forEach(([a, b], corner) => {
      if (soft[a] && soft[b]) out.push(roadCorner(around[a], corner, v));
    });
  }
  // Angle intérieur d'un chemin, vu depuis la case d'herbe : la route s'y arrondit.
  function roadFillets(out, x, y, v) {
    CORNERS.forEach(([a, b, dx, dy], corner) => {
      const [ax, ay] = SIDES[a],
        [bx, by] = SIDES[b];
      if (isRoad(x + ax, y + ay) && isRoad(x + bx, y + by) && isRoad(x + dx, y + dy)) out.push(roadFillet(corner, v));
    });
  }
  // Bords d'une case (débords des voisins, bords arrondis des chemins) : calculés une fois, gardés pour toute l'île
  // (le calcul à chaque image créait des milliers de petits tableaux par seconde, d'où des à-coups du ramasse-miettes).
  const NO_EDGES = [];
  let edgeCache = null,
    edgeFor = null,
    edgeBridges = -1;
  function edgesOf(x, y, t, v) {
    if (edgeFor !== game.world.tiles || edgeBridges !== BRIDGE_TILES.size) {
      edgeCache = new Array(MAPW * MAPH);
      edgeFor = game.world.tiles;
      edgeBridges = BRIDGE_TILES.size;
    }
    const k = y * MAPW + x;
    let list = edgeCache[k];
    if (list) return list;
    const out = [],
      mine = PRIORITY[t];
    if (t === 2 && !BRIDGE_TILES.has(k)) roadEdges(out, x, y, v);
    else if (mine !== undefined) {
      for (let dir = 0; dir < 4; dir++) {
        const [dx, dy] = SIDES[dir],
          n = tileAt(x + dx, y + dy),
          pn = PRIORITY[n];
        // La route ne déborde pas en dents : ses bords arrondis sont dessinés sur ses propres cases.
        if (n !== 2 && pn !== undefined && pn > mine && PIXEL_TERRAIN[n]) out.push(fringe(n, dir));
      }
      if (softEdge(t) && !CANAAN_ROADS.active()) roadFillets(out, x, y, v);
    }
    list = out.length ? out : NO_EDGES;
    edgeCache[k] = list;
    return list;
  }
  // Falaise : face rocheuse sous le bord inférieur d'une montagne.
  let cliffFace = null;
  function cliff() {
    if (cliffFace) return cliffFace;
    cliffFace = [0, 1].map(v => {
      const c = canvas(48, 48),
        g = c.getContext('2d'),
        p = PAL[4];
      rect(g, 0, 0, 48, 48, '#5a6268');
      for (let k = 0; k < 7; k++) {
        const y = 10 + k * 5 + Math.floor(h(k, v, 2) * 3),
          x = Math.floor(h(v, k, 4) * 30);
        rect(g, x, y, 10 + h(k, v) * 16, 3, k % 2 ? p[3] : p[2]);
      }
      for (let k = 0; k < 4; k++) rect(g, 6 + k * 12 + v * 3, 12, 1, 30, '#454c52');
      rect(g, 0, 0, 48, 9, p[0]);
      rect(g, 0, 8, 48, 2, p[2]);
      g.globalAlpha = 0.45;
      rect(g, 0, 42, 48, 6, '#1a1e22');
      g.globalAlpha = 1;
      return c;
    });
    return cliffFace;
  }
  // Eau qui défile : chaque texture est recopiée deux fois côte à côte (96 × 48), pour qu'une seule copie suffise
  // par case et par image, quel que soit le décalage.
  const ROLLS = new Map();
  function drawScrolled(c, img, sx, X, Y, off) {
    off = ((Math.floor(off) % 48) + 48) % 48;
    let rolls = ROLLS.get(img);
    if (!rolls) ROLLS.set(img, (rolls = []));
    const v = (sx / 48) | 0;
    let roll = rolls[v];
    if (roll === undefined) {
      roll = canvas(96, 48);
      const g = roll.getContext('2d');
      if (g?.drawImage) {
        g.drawImage(img, sx, 0, 48, 48, 0, 0, 48, 48);
        g.drawImage(img, sx, 0, 48, 48, 48, 0, 48, 48);
      } else roll = null;
      rolls[v] = roll;
    }
    if (roll) return void c.drawImage(roll, off, 0, 48, 48, X, Y, 48, 48);
    c.drawImage(img, sx + off, 0, 48 - off, 48, X, Y, 48 - off, 48);
    if (off) c.drawImage(img, sx, 0, off, 48, X + 48 - off, Y, off, 48);
  }
  // Vent léger : rafales lentes qui traversent l'île d'ouest en est, et frémissement des feuilles.
  // Valeur d'environ 0 (calme) à 1,3 (rafale) au point (px, py) du monde.
  function windAt(px, py) {
    const gust = 0.5 + 0.5 * Math.sin(time * 0.006 - px * 0.0035 + py * 0.0012),
      flutter = Math.sin(time * 0.045 + px * 0.031 + py * 0.017) * 0.3 + Math.sin(time * 0.11 + px * 0.07 + py * 0.05) * 0.12;
    return gust * (0.65 + flutter) + 0.12 * Math.sin(time * 0.02 + px * 0.05);
  }
  // Souplesse de chaque décor dans le vent (les rochers, cristaux et champignons ne bougent pas).
  const SWAY = {
    tree: 1,
    bigtree: 0.65,
    pine: 0.6,
    snowpine: 0.6,
    palm: 1.25,
    autumn_red: 1,
    autumn_orange: 1,
    autumn_gold: 1,
    glowtree: 0.9,
    twisted: 0.45,
    deadwood: 0.15,
    bush: 1.5,
    flower: 1.9,
    reed: 2.3,
    magicplant: 1.7,
    cactus: 0.08
  };
  // Feuilles emportées et souffles de vent, au-dessus du monde extérieur ; couleur selon le biome.
  const WIND_LEAVES = [
    ['#7fb85a', '#5a9a44', '#a8d070'],
    ['#4f8a3a', '#2e6a3e', '#86c062'],
    ['#6a7a3a', '#8a9a52', '#4f6b4a'],
    ['#d9542f', '#e98a2c', '#efc145'],
    ['#e0c890', '#c9a673', '#f0dca8'],
    ['#9ff4e4', '#c99bff', '#4fc0b0']
  ];
  function drawWindLayer(c) {
    if (game.world.instance || !canaanDisplay.particles || canaanInHouse(P.x / TS, P.y / TS)) return;
    const zone = Math.max(0, ZONES.indexOf(regionAt(Math.floor(P.x / TS), Math.floor(P.y / TS)))),
      colors = WIND_LEAVES[zone] || WIND_LEAVES[0],
      strength = windAt(P.x, P.y);
    c.save();
    // Feuilles : elles filent vers l'est en tournoyant, plus vite pendant les rafales.
    for (let k = 0; k < 22; k++) {
      const a = Math.sin(k * 91.7) * 43758.5453,
        sx = a - Math.floor(a),
        b = Math.sin(k * 37.3 + 4) * 24634.6345,
        sy = b - Math.floor(b),
        speed = 0.6 + sx * 0.9;
      const x = ((sx * (W + 240) + time * speed * (0.7 + strength)) % (W + 240)) - 120,
        y = ((sy * H + time * 0.25 * speed) % (H + 60)) - 30 + Math.sin(time * 0.035 + k * 2.1) * 16,
        spin = Math.sin(time * 0.09 + k);
      c.globalAlpha = 0.55 + 0.3 * Math.abs(spin);
      c.fillStyle = colors[k % 3];
      c.fillRect(Math.round(camX + x), Math.round(camY + y), Math.max(1, Math.round(5 * Math.abs(spin))) + 1, 3);
    }
    // Souffles : traits pâles et fugaces, visibles surtout pendant les rafales.
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const a = Math.sin(k * 12.9 + 1) * 15731.743,
        sy = a - Math.floor(a),
        life = (time * 0.004 + k * 0.37) % 1,
        x = camX - 160 + life * (W + 320),
        y = camY + sy * H + Math.sin(life * 6.28 + k) * 10,
        len = 70 + sy * 70;
      c.globalAlpha = Math.sin(life * Math.PI) * 0.16 * Math.max(0, strength - 0.25);
      if (c.globalAlpha < 0.01) continue;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + len * 0.5, y - 6 - sy * 6, x + len, y + Math.sin(time * 0.02 + k) * 4);
      c.stroke();
    }
    c.restore();
  }
  const GLOWING = { glowtree: '#6fe0cc', magicplant: '#c99bff', crystal: '#9ce2e6', mushroom: '#d883a9', elftree: '#bfffee', elfwillow: '#d8ffb0' };
  // Dessin d'une case de l'île : sol, débords des voisins, falaise, détails animés et décor.
  // Sol d'une case : texture (ou falaise), bords, ombre au pied d'une falaise. L'eau, animée, est à part (water).
  // Case de roche : face de falaise au bord inférieur d'un massif, dessus éclairé ailleurs.
  function drawRock(c, x, y, X, Y, v) {
    const below = tileAt(x, y + 1);
    if (below !== 4) return void c.drawImage(cliff()[v & 1], X, Y);
    c.drawImage(PIXEL_TERRAIN[4], v * 48, 0, 48, 48, X, Y, TS, TS);
    c.fillStyle = PAL[4][2];
    if (tileAt(x, y - 1) !== 4) c.fillRect(X, Y, TS, 4);
    if (tileAt(x - 1, y) !== 4) c.fillRect(X, Y, 4, TS);
    c.fillStyle = PAL[4][3];
    if (tileAt(x + 1, y) !== 4) c.fillRect(X + TS - 4, Y, 4, TS);
  }
  // inChunk : peinte dans un bloc de sol où l'eau animée est dessinée dessous (transitions organiques, world-blend.js).
  function paintBase(c, x, y, t, X, Y, v, water, inChunk = false) {
    // Palissade et emprises de la cité : le sol de leur biome (les troncs sont un décor, la cité dessine le reste).
    if (t === CANAAN_WOOD_TILE) t = CANAAN_WOOD_GROUND.get(y * MAPW + x) ?? 1;
    const tex = PIXEL_TERRAIN[t] || PIXEL_TERRAIN[1],
      smooth = inChunk && !water && CANAAN_BLEND.active() && !BRIDGE_TILES.has(y * MAPW + x);
    let road = null,
      blend = null;
    if (t === 4) {
      const rock = inChunk && CANAAN_BLEND.active() && CANAAN_BLEND.rock(x, y, v, g => drawRock(g, x, y, 0, 0, v));
      if (rock) c.drawImage(rock, X, Y);
      else drawRock(c, x, y, X, Y, v);
    } else if (water) drawScrolled(c, tex, v * 48, X, Y, time * (t === 0 ? 0.12 : 0.08) + y * 11);
    else if (t === 2 && (road = CANAAN_ROADS.tile(x, y, v))) c.drawImage(road, X, Y);
    else if (smooth && (blend = CANAAN_BLEND.tile(x, y, v))) c.drawImage(blend, X, Y);
    else if (!(smooth && WATER.has(t))) c.drawImage(tex, v * 48, 0, 48, 48, X, Y, TS, TS);
    // Débords des terrains voisins plus hauts ; les chemins ont des bords arrondis (images gardées par case).
    // Les routes calculées (world-roads.js) peignent elles-mêmes leurs bords, et débordent sur les cases voisines.
    if (!road && !smooth) {
      const edges = edgesOf(x, y, t, v);
      for (let i = 0; i < edges.length; i++) c.drawImage(edges[i], X, Y);
    }
    if (softEdge(t) && CANAAN_ROADS.active()) {
      const over = CANAAN_ROADS.overlay(x, y, v);
      if (over) c.drawImage(over, X, Y);
    }
    // Ombre portée au pied d'une falaise.
    if (t !== 4 && tileAt(x, y - 1) === 4) {
      c.globalAlpha = 0.3;
      c.fillStyle = '#10161a';
      c.fillRect(X, Y, TS, 10);
      c.globalAlpha = 1;
    }
  }
  // Décor d'une case : arbres, buissons et herbes qui ploient dans le vent, lueurs.
  function paintDecor(c, x, y, X, Y, d) {
    const sprite = PIXEL_DECOR[d],
      bend = SWAY[d] ? SWAY[d] * (0.03 * windAt(X, Y) + 0.03 * Math.sin(time * 0.05 + x * 1.7 + y * 0.9)) : 0,
      // Ancrage par le pied : milieu de la case, bas du dessin au bas de la case (les grands arbres débordent vers le haut).
      sx = sprite ? X + 24 - Math.round(sprite.width / 2) : X - 10,
      sy = sprite ? Y + 52 - sprite.height : Y - 28;
    // Le haut glisse, le pied reste en place.
    if (bend) {
      const base = Y + 40;
      c.save();
      c.translate(0, base);
      c.transform(1, 0, -bend * (sprite && sprite.height > 100 ? 0.6 : 1), 1, 0, 0);
      if (sprite) c.drawImage(sprite, sx, sy - base, sprite.width, sprite.height);
      else drawBiomeDecor(c, d, X, Y - base, x, y);
      c.restore();
    } else if (sprite) c.drawImage(sprite, sx, sy, sprite.width, sprite.height);
    else drawBiomeDecor(c, d, X, Y, x, y);
    if (GLOWING[d] && (x + y) % 2 === 0) canaanLight(X + 24, Y + 10, d === 'glowtree' ? 120 : 70, GLOWING[d]);
  }
  // Dessin complet d'une case (dans une maison, où le reste du monde passe dans le noir).
  function drawWorldTile(c, x, y, t, d) {
    // Maison : pièce intérieure (parquet, murs) et sol de la chaumière ; le reste dans le noir quand on y est.
    if (CANAAN_HOUSE.drawTile(c, x, y, t)) return;
    const X = x * TS,
      Y = y * TS,
      v = (x * 7 + y * 13) & 3;
    paintBase(c, x, y, t, X, Y, v, WATER.has(t));
    drawCoastDetail(c, x, y, t);
    if (d) paintDecor(c, x, y, X, Y, d);
  }
  // Bruit périodique (se raccorde sur lui-même tous les P pixels) : base des motifs sans couture.
  function pnoise(P, x, y, cells, k) {
    const lattice = (a, b) => h(((a % cells) + cells) % cells, ((b % cells) + cells) % cells, k),
      fx = (x / P) * cells,
      fy = (y / P) * cells,
      xi = Math.floor(fx),
      yi = Math.floor(fy),
      u = (fx - xi) * (fx - xi) * (3 - 2 * (fx - xi)),
      v = (fy - yi) * (fy - yi) * (3 - 2 * (fy - yi)),
      a = lattice(xi, yi),
      b = lattice(xi + 1, yi),
      c = lattice(xi, yi + 1),
      e = lattice(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  }
  // Eau continue : pour chaque eau, un fond marbré et une couche de reflets, peints une fois en motifs sans couture de
  // 256 px (blocs de 2 px), ancrés sur le monde. Le fond dérive lentement, les reflets plus vite et en biais : plus
  // aucune case visible, et un seul remplissage par suite de cases d'eau d'une rangée.
  const WATER_LOOK = {
    0: { tones: ['#123f63', '#17507c', '#1d5f8e', '#2b74a6'], glint: ['#7cc0dc', '#b9e4f0'], speed: 1 },
    15: { tones: ['#2a6662', '#317470', '#3a827c', '#4c968c'], glint: ['#a8e0d0', '#d6f4ea'], speed: 0.7 },
    18: { tones: ['#25286e', '#2d3184', '#363c9a', '#4a52b6'], glint: ['#c8d0ff', '#ffffff'], speed: 0.6 }
  };
  const WATER_PATTERNS = {};
  function waterPatterns(c, t) {
    if (WATER_PATTERNS[t] !== undefined) return WATER_PATTERNS[t];
    WATER_PATTERNS[t] = null;
    const look = WATER_LOOK[t],
      P = 256;
    if (!look || !c.createPattern || typeof DOMMatrix === 'undefined') return null;
    const base = canvas(P, P),
      glint = canvas(P, P),
      bg = base.getContext('2d'),
      gg = glint.getContext('2d'),
      img = bg?.createImageData?.(P, P),
      d = img?.data;
    if (!d || d.length !== P * P * 4 || !gg) return null;
    const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)),
      tones = look.tones.map(rgb);
    for (let y = 0; y < P; y += 2)
      for (let x = 0; x < P; x += 2) {
        // Marbrure : grandes ondulations étirées à l'horizontale, en quatre tons avec un léger tramage.
        const n = pnoise(P, x, y * 1.6, 4, 71 + t) * 0.55 + pnoise(P, x, y, 8, 72 + t) * 0.3 + pnoise(P, x, y, 32, 73 + t) * 0.15,
          dither = ((x >> 1) + (y >> 1)) & 1 ? 0.025 : -0.025,
          k = Math.max(0, Math.min(3, Math.floor((n + dither - 0.28) * 7))),
          col = tones[k];
        for (let q = 0; q < 4; q++) {
          const o = ((y + (q >> 1)) * P + x + (q & 1)) * 4;
          d[o] = col[0];
          d[o + 1] = col[1];
          d[o + 2] = col[2];
          d[o + 3] = 255;
        }
      }
    bg.putImageData(img, 0, 0);
    // Reflets : petits traits clairs soulignés d'une ombre, posés sur une grille décalée (se raccorde sur 256 px).
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < 16; i++) {
        if (h(i, j, 74 + t) > 0.55) continue;
        const x = (i * 16 + Math.floor(h(j, i, 75) * 12)) % P,
          y = (j * 16 + Math.floor(h(i, j, 76) * 12)) % P,
          w = 4 + Math.floor(h(i, j, 77) * 4) * 2;
        gg.fillStyle = look.tones[0];
        gg.fillRect(x + 2, y + 2, w - 2, 2);
        gg.fillStyle = look.glint[h(i, j, 78) > 0.7 ? 1 : 0];
        gg.fillRect(x, y, w, 2);
        if (x + w > P) gg.fillRect(x - P, y, w, 2);
      }
    WATER_PATTERNS[t] = { base: c.createPattern(base, 'repeat'), glint: c.createPattern(glint, 'repeat'), speed: look.speed };
    return WATER_PATTERNS[t];
  }
  // Pose l'eau t sur le rectangle (monde) donné ; faux si le motif est indisponible (rendu d'avant).
  const WATER_M = typeof DOMMatrix !== 'undefined' ? new DOMMatrix() : null;
  function fillWater(c, t, X, Y, w, hgt) {
    const pat = waterPatterns(c, t);
    if (!pat) return false;
    const k = pat.speed;
    WATER_M.e = Math.round(time * 0.05 * k);
    WATER_M.f = Math.round(Math.sin(time * 0.004) * 6);
    pat.base.setTransform(WATER_M);
    c.fillStyle = pat.base;
    c.fillRect(X, Y, w, hgt);
    WATER_M.e = Math.round(time * 0.16 * k);
    WATER_M.f = Math.round(time * 0.03 * k);
    pat.glint.setTransform(WATER_M);
    c.globalAlpha = 0.55 + 0.25 * Math.sin(time * 0.02);
    c.fillStyle = pat.glint;
    c.fillRect(X, Y, w, hgt);
    c.globalAlpha = 1;
    return true;
  }
  // Motif de nuances (384 px, bruit périodique par blocs de 4 px) : taches claires et sombres très douces.
  let MACRO;
  function macroPattern(g) {
    if (MACRO !== undefined) return MACRO;
    MACRO = null;
    const P = 384,
      cv = canvas(P, P),
      mg = cv.getContext('2d');
    if (!mg?.createImageData || !g.createPattern) return MACRO;
    const img = mg.createImageData(P, P),
      d = img?.data,
      noise = (x, y, cells, k) => pnoise(P, x, y, cells, k);
    // Sans vrai canevas (tests sans écran) : pas de nuances.
    if (!d || d.length !== P * P * 4) return MACRO;
    for (let y = 0; y < P; y += 4)
      for (let x = 0; x < P; x += 4) {
        const n = noise(x, y, 4, 61) * 0.6 + noise(x, y, 8, 62) * 0.3 + noise(x, y, 16, 63) * 0.1;
        const light = n > 0.5,
          a = Math.round(255 * Math.min(0.16, Math.abs(n - 0.5) * (light ? 0.42 : 0.6)));
        for (let k = 0; k < 16; k++) {
          const o = ((y + (k >> 2)) * P + x + (k & 3)) * 4;
          d[o] = light ? 255 : 12;
          d[o + 1] = light ? 246 : 22;
          d[o + 2] = light ? 214 : 14;
          d[o + 3] = a;
        }
      }
    mg.putImageData(img, 0, 0);
    MACRO = g.createPattern(cv, 'repeat');
    return MACRO;
  }
  // Sol de l'île par blocs de 16 × 16 cases : tout ce qui ne bouge pas (textures, bords arrondis, falaises, détails
  // fixes des biomes) est peint une fois dans un bloc gardé ; chaque image ne dessine que les blocs visibles, puis
  // l'eau, les détails animés et le décor. Une trentaine de blocs restent en mémoire (les plus anciens sont oubliés).
  const CH = 16,
    KEEP = 48;
  let chunks = new Map(),
    chunkFor = null,
    chunkBridges = -1;
  function chunkAt(cx, cy) {
    // Dans un bâtiment, CANAAN_HOUSE.drawTile peint le dehors en noir : un bloc construit à ce moment-là resterait
    // noir dans le cache (sol noir en ressortant). Aucun bloc n'est donc préparé à l'intérieur.
    if (canaanInHouse(P.x / TS, P.y / TS)) return null;
    if (chunkFor !== game.world.overworld || chunkBridges !== BRIDGE_TILES.size) {
      chunks = new Map();
      chunkFor = game.world.overworld;
      chunkBridges = BRIDGE_TILES.size;
    }
    const id = cy * 64 + cx;
    let img = chunks.get(id);
    if (img) {
      chunks.delete(id);
      chunks.set(id, img);
      return img;
    }
    img = canvas(CH * TS, CH * TS);
    const g = img.getContext('2d');
    if (!g?.translate) return null;
    g.imageSmoothingEnabled = false;
    g.translate(-cx * CH * TS, -cy * CH * TS);
    const tiles = game.world.tiles,
      blendOn = CANAAN_BLEND.active(),
      houses = new Set();
    for (let y = cy * CH; y < Math.min(MAPH, (cy + 1) * CH); y++)
      for (let x = cx * CH; x < Math.min(MAPW, (cx + 1) * CH); x++) {
        const t = tiles[y][x];
        if (CANAAN_HOUSE.drawTile(g, x, y, t)) {
          houses.add(y * MAPW + x);
          continue;
        }
        if ((WATER.has(t) && !blendOn) || (blendOn && BRIDGE_TILES.has(y * MAPW + x))) continue;
        paintBase(g, x, y, t, x * TS, y * TS, (x * 7 + y * 13) & 3, false, true);
      }
    // Grandes nuances de lumière, continues sur toute l'île (motif sans couture ancré à l'origine du monde) : elles
    // effacent la régularité des textures case par case. source-atop : seulement sur ce qui est déjà peint.
    const macro = macroPattern(g);
    if (macro) {
      g.save();
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = macro;
      g.fillRect(cx * CH * TS, cy * CH * TS, CH * TS, CH * TS);
      g.restore();
    }
    // Détails fixes ensuite (ombres du sous-bois, touffes…) : ils débordent sur les cases voisines, y compris celles
    // des blocs voisins (bordure de deux cases), sans jamais être recouverts ni coupés au bord du bloc.
    for (let y = Math.max(0, cy * CH - 2); y < Math.min(MAPH, (cy + 1) * CH + 2); y++)
      for (let x = Math.max(0, cx * CH - 2); x < Math.min(MAPW, (cx + 1) * CH + 2); x++)
        if (!houses.has(y * MAPW + x)) drawCoastDetail(g, x, y, tiles[y][x], 1);
    chunks.set(id, img);
    if (chunks.size > KEEP) chunks.delete(chunks.keys().next().value);
    return img;
  }
  // Blocs voisins préparés d'avance, un à la fois, quand le navigateur a du temps libre : en marchant, le bloc qui
  // entre à l'écran est déjà prêt (pas d'à-coup au passage d'un bloc à l'autre).
  let ahead = null,
    aheadQueued = false;
  function prepareAhead(deadline) {
    aheadQueued = false;
    if (!ahead || game.world.instance || canaanInHouse(P.x / TS, P.y / TS)) return;
    const { cx0, cx1, cy0, cy1 } = ahead,
      // Du plus proche du centre au plus loin.
      mx = (cx0 + cx1) / 2,
      my = (cy0 + cy1) / 2,
      todo = [];
    for (let cy = Math.max(0, cy0 - 1); cy <= Math.min(Math.floor((MAPH - 1) / CH), cy1 + 1); cy++)
      for (let cx = Math.max(0, cx0 - 1); cx <= Math.min(Math.floor((MAPW - 1) / CH), cx1 + 1); cx++)
        if (!chunks.has(cy * 64 + cx)) todo.push([Math.hypot(cx - mx, cy - my), cx, cy]);
    if (!todo.length) return;
    todo.sort((a, b) => a[0] - b[0]);
    // Les routes du bloc (et de sa bordure) sont d'abord peintes par petites tranches, sans jamais tenir une image.
    const [, cx, cy] = todo[0],
      end = performance.now() + Math.max(2, Math.min(5, (deadline?.timeRemaining?.() ?? 5) - 1));
    if (
      CANAAN_ROADS.warm(cx * CH - 1, cy * CH - 1, (cx + 1) * CH + 1, (cy + 1) * CH + 1, end) &&
      CANAAN_BLEND.warm(cx * CH, cy * CH, (cx + 1) * CH, (cy + 1) * CH, end)
    )
      chunkAt(cx, cy);
    queueAhead();
  }
  function queueAhead() {
    if (aheadQueued) return;
    aheadQueued = true;
    if (typeof requestIdleCallback === 'function') requestIdleCallback(prepareAhead, { timeout: 500 });
    else setTimeout(prepareAhead, 16);
  }
  function drawWorldGround(c, x0, x1, y0, y1) {
    const tiles = game.world.tiles,
      deco = game.world.decor;
    // Dans une maison : dessin case par case (le dehors passe dans le noir).
    if (canaanInHouse(P.x / TS, P.y / TS)) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) drawWorldTile(c, x, y, tiles[y][x], deco[y][x]);
      return;
    }
    // Transitions organiques : l'eau animée (et ses reflets) est peinte d'abord, sous les blocs de sol, sur les cases
    // d'eau et sur les cases de terre qui la bordent ; les blocs laissent voir l'eau là où elle déborde.
    const under = CANAAN_BLEND.active() && !!chunkAt(Math.floor(x0 / CH), Math.floor(y0 / CH));
    if (under) {
      // Suites de cases d'une même eau sur chaque rangée : un seul remplissage par suite.
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; ) {
          const w = CANAAN_BLEND.waterUnder(x, y);
          if (w < 0) {
            x++;
            continue;
          }
          let end = x + 1;
          while (end < x1 && CANAAN_BLEND.waterUnder(end, y) === w) end++;
          if (!fillWater(c, w, x * TS, y * TS, (end - x) * TS, TS))
            for (let k = x; k < end; k++) drawScrolled(c, PIXEL_TERRAIN[w], ((k * 7 + y * 13) & 3) * 48, k * TS, y * TS, time * (w === 0 ? 0.12 : 0.08) + y * 11);
          x = end;
        }
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (WATER.has(tiles[y][x]) && !BRIDGE_TILES.has(y * MAPW + x)) drawCoastLive(c, x, y, 1);
    }
    const m = c.getTransform?.(),
      snapX = m ? m.e : 0,
      snapY = m ? m.f : 0;
    let ok = true;
    for (let cy = Math.floor(y0 / CH); cy <= Math.floor((y1 - 1) / CH) && ok; cy++)
      for (let cx = Math.floor(x0 / CH); cx <= Math.floor((x1 - 1) / CH); cx++) {
        const img = chunkAt(cx, cy);
        if (!img) {
          ok = false;
          break;
        }
        // Calé sur un pixel entier de l'écran : la caméra glisse au sous-pixel, et un bloc posé entre deux pixels
        // laissait un liseré sombre à la jonction avec son voisin.
        c.drawImage(img, Math.round(cx * CH * TS + snapX) - snapX, Math.round(cy * CH * TS + snapY) - snapY);
      }
    ahead = { cx0: Math.floor(x0 / CH), cx1: Math.floor((x1 - 1) / CH), cy0: Math.floor(y0 / CH), cy1: Math.floor((y1 - 1) / CH) };
    if (ok) queueAhead();
    // Sans canevas (tests sans écran) : dessin case par case.
    if (!ok) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) drawWorldTile(c, x, y, tiles[y][x], deco[y][x]);
      return;
    }
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const t = tiles[y][x],
          d = deco[y][x],
          X = x * TS,
          Y = y * TS;
        if (under) drawCoastLive(c, x, y, 2);
        else {
          if (WATER.has(t)) paintBase(c, x, y, t, X, Y, (x * 7 + y * 13) & 3, true);
          drawCoastDetail(c, x, y, t, 2);
        }
      }
    // Décor ensuite, rangée par rangée, avec une marge : les grands arbres dont le pied est hors de l'écran dépassent
    // dedans (pas d'apparition brusque au bord).
    for (let y = y0; y < Math.min(MAPH, y1 + 3); y++)
      for (let x = Math.max(0, x0 - 2); x < Math.min(MAPW, x1 + 2); x++) {
        const d = deco[y][x];
        if (d) paintDecor(c, x, y, x * TS, y * TS, d);
      }
  }
  // Ambiance de chaque biome, adoucie d'un biome à l'autre : pénombre, teinte et particules.
  const AMBIENCES = [
    { dark: 0, tint: [0, 0, 0], particles: 'dust', color: '#fff6c0' },
    { dark: 0.3, tint: [6, 22, 10], particles: 'motes', color: '#d8f0a0' },
    { dark: 0.32, tint: [18, 30, 28], particles: 'mist', color: '#d6e4e0' },
    { dark: 0.1, tint: [44, 16, 0], particles: 'leaves', color: '#e98a2c' },
    { dark: 0.06, tint: [70, 34, 0], particles: 'dust', color: '#f0d8a0' },
    { dark: 0.55, tint: [8, 10, 42], particles: 'sparks', color: '#b2ffec', heroLight: 260 }
  ];
  const current = { dark: 0, tint: [0, 0, 0], particles: 'dust', color: '#fff6c0' };
  // Intérieur de la maison : lumière chaude et douce, quelques grains de poussière.
  const INDOOR = { dark: 0.14, tint: '30,16,4', particles: 'dust', color: '#ffe8b0', heroLight: 360 };
  function worldAmbience() {
    if (canaanInHouse(P.x / TS, P.y / TS)) return INDOOR;
    const zone = ZONES.indexOf(regionAt(Math.floor(P.x / TS), Math.floor(P.y / TS))),
      target = AMBIENCES[Math.max(0, zone)],
      k = 0.03;
    current.dark += (target.dark - current.dark) * k;
    current.tint = current.tint.map((v, i) => v + (target.tint[i] - v) * k);
    current.particles = target.particles;
    current.color = target.color;
    return {
      dark: current.dark,
      tint: current.tint.map(Math.round).join(','),
      particles: current.particles,
      color: current.color,
      heroLight: target.heroLight || 330
    };
  }
  // Décors : volume, grain et contour, une seule fois au chargement.
  function polishDecor() {
    for (const [name, sprite] of Object.entries(PIXEL_DECOR)) {
      canaanPolish(sprite, 2, name.length);
      PIXEL_DECOR[name] = canaanOutline(sprite, 2);
    }
  }
  // Eau peu profonde des marais : ronds dans l'eau, jambes immergées et éclaboussures en marchant.
  let ripples = [];
  function wading(x, y) {
    if (game.world.instance) return false;
    const tx = Math.floor(x / TS),
      ty = Math.floor(y / TS);
    return tileAt(tx, ty) === 15 && !BRIDGE_TILES.has(ty * MAPW + tx);
  }
  function drawWaterRipples(c) {
    ripples = ripples.filter(r => time - r.t < 54);
    c.save();
    for (const r of ripples) {
      const age = time - r.t,
        rad = (6 + age * 0.55) * r.s;
      c.globalAlpha = (1 - age / 54) * 0.55;
      c.strokeStyle = '#d4f2e8';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(r.x, r.y, rad, rad * 0.42, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
  function drawWade(c, who, x, footY, width, moving, size) {
    if (!wading(x, footY)) return;
    if (time - (who._rippleT ?? -99) > (moving ? 10 : 36) && ripples.length < 80) {
      ripples.push({ x, y: footY, t: time, s: size });
      who._rippleT = time;
    }
    const rx = width * 0.36,
      ry = 5 * size,
      wave = Math.sin(time * 0.15 + x * 0.05) * 1.5;
    c.save();
    // Ligne d'eau : le bas des jambes disparaît sous une surface translucide.
    c.globalAlpha = 0.78;
    c.fillStyle = '#3f8a86';
    c.beginPath();
    c.ellipse(x, footY - 2 * size, rx, ry + 3 * size, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.strokeStyle = '#bfe8dc';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, footY - 4 * size + wave, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();
    if (moving) {
      c.fillStyle = '#e0f6ee';
      for (let k = 0; k < 4; k++) {
        const t = (time * 0.9 + k * 7 + x) % 16,
          side = k % 2 ? 1 : -1;
        c.globalAlpha = 0.8 * (1 - t / 16);
        c.fillRect(
          x + side * (rx * 0.6 + t * 0.8),
          footY - 6 * size - Math.sin((t / 16) * Math.PI) * 12 * size,
          3,
          3
        );
      }
    }
    c.restore();
  }
  // ---------------------------------------------------------------- Devant / derrière
  // Après les personnages, chaque objet haut (arbre, bâtiment, grand objet du camp) dont le pied est plus bas que celui
  // d'un personnage qui le chevauche est redessiné par-dessus : le personnage passe derrière. Si c'est un héros qui est
  // caché, l'objet devient à moitié transparent (on se voit toujours).
  const TALL = new Set([...CANAAN_BIG_TREES, 'cactus', 'crystal', 'ruin', 'mushroom', 'rock', 'peak', 'palisade', 'palisade2', 'palisade3']);
  function occlusionEntities() {
    const out = [];
    for (const h of game.heroes || []) if (h.player && !h.away) out.push({ x: h.player.x, foot: h.player.y + 14, hero: true });
    for (const m of game.world.mobs || []) if (!m.dead) out.push({ x: m.x, foot: m.y + 14 });
    for (const n of game.world.npcs || []) if (n.type !== 'portal' && n.type !== 'arena' && canaanHere(n)) out.push({ x: n.x, foot: n.y + 14 });
    for (const a of CANAAN_LIFE.animals()) if (!a.dead && canaanHere(a)) out.push({ x: a.x, foot: a.y });
    for (const v of CANAAN_LIFE.villagers()) out.push({ x: v.x, foot: v.y + 12 });
    for (const n of Object.values(CANAAN_QUESTS.npcs())) if (Number.isFinite(n.x)) out.push({ x: n.x, foot: n.y + 12 });
    return out.filter(e => Math.abs(e.x - camX - W / 2) < W / 2 + 100 && Math.abs(e.foot - camY - H / 2) < H / 2 + 150);
  }
  function drawCanaanOcclusion(c) {
    if (game.world.instance || canaanUnder() || canaanInHouse(P.x / TS, P.y / TS)) return;
    const ents = occlusionEntities();
    if (!ents.length) return;
    const list = [];
    const x0 = Math.max(0, Math.floor(camX / TS) - 3),
      x1 = Math.min(MAPW, Math.ceil((camX + W) / TS) + 3),
      y0 = Math.max(0, Math.floor(camY / TS) - 1),
      y1 = Math.min(MAPH, Math.ceil((camY + H) / TS) + 4),
      deco = game.world.decor;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d = deco[y][x],
          sprite = d && TALL.has(d) && PIXEL_DECOR[d];
        if (!sprite) continue;
        const X = x * TS,
          Y = y * TS;
        list.push({ x0: X + 24 - sprite.width / 2 + 8, x1: X + 24 + sprite.width / 2 - 8, y0: Y + 52 - sprite.height, base: Y + 42, draw: g => paintDecor(g, x, y, X, Y, d) });
      }
    list.push(...CANAAN_HOUSE.occluders(), ...canaanCampLife.occluders(), ...CANAAN_PORTAL_ART.occluders(), ...CANAAN_CITY.occluders());
    // Les objets redessinés n'allument pas une seconde fois leurs lumières.
    const light = window.canaanLight;
    window.canaanLight = () => {};
    try {
      drawOccluders(c, list, ents);
    } finally {
      window.canaanLight = light;
    }
  }
  // L'objet n'est redessiné qu'autour de chaque personnage caché derrière lui (découpe), pour ne jamais recouvrir un
  // personnage passé devant : opaque pour un monstre ou un habitant, à moitié transparent pour un héros.
  function drawOccluders(c, list, ents) {
    for (const o of list) {
      const hid = ents.filter(e => e.foot < o.base && e.x + 14 > o.x0 && e.x - 14 < o.x1 && e.foot > o.y0 && e.foot - 60 < o.base);
      if (!hid.length) continue;
      for (const hero of [false, true]) {
        const part = hid.filter(e => !!e.hero === hero);
        if (!part.length) continue;
        c.save();
        c.beginPath();
        for (const e of part) c.rect(e.x - 30, e.foot - 96, 60, 100);
        c.clip();
        c.globalAlpha = hero ? 0.45 : 1;
        o.draw(c);
        c.restore();
      }
    }
  }
  buildTerrain();
  polishDecor();
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, { drawCanaanOcclusion, drawWorldTile, drawWorldGround, worldAmbience, drawWaterRipples, drawWade, windAt, drawWindLayer });
})();
