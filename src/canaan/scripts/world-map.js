// Cartes : la grande carte (touche M), qu'on zoome à la molette ou aux boutons et qu'on fait glisser à la souris, et la
// mini-carte ronde qui suit le héros de près (molette pour la zoomer). Sur l'île comme en donjon ou en raid.
// Une image de fond est peinte une fois (4 pixels par case : relief, eaux, arbres, routes, ponts, bâtiments, ferme),
// puis chaque carte en montre une partie à son échelle, avec par-dessus des repères dessinés à taille fixe : camp,
// portails, Arène, boss, refuges, quêtes, coffres révélés, alliés, monstres proches (et tous les monstres en donjon).
(() => {
  'use strict';
  const PX = 4;
  const BIG = 800;
  const STEPS = [2, 3, 4, 6, 8, 12, 16];
  const MINI = [3, 5, 8];
  let base = null,
    baseFor = null,
    baseAt = -1e9;
  // Vue de la grande carte : échelle (pixels par case) et centre (en cases) ; follow : centrée sur le héros.
  const view = { step: 0, cx: 200, cy: 200, follow: false, fitted: true, place: null };
  let miniStep = 1;
  let facing = 0;

  // ---------------------------------------------------------------- Couleurs
  const rgb = hex => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
  // Sols de l'île : la teinte de base de chaque tuile, la même que le rendu du jeu (world-look.js).
  const LAND = {
    1: '#4f8a42',
    2: '#a88a62',
    3: '#d8bb80',
    4: '#6e767c',
    5: '#33603a',
    9: '#3a3846',
    10: '#6aa04a',
    11: '#3e6a58',
    15: '#3f8a86',
    16: '#9a5a2a',
    17: '#2e6e72',
    18: '#3a3e9a',
    // Terre du sud-ouest (Extension 1) : herbe dorée et blé.
    50: '#8a9a3e',
    51: '#c8a040',
    // Palissade de troncs et emprises de la cité elfique.
    37: '#6a4a2e'
  };
  // Mer, du pied de la plage au large (en cases depuis la terre) : le turquoise des hauts-fonds, puis le bleu nuit.
  const SEA = [
    [0, '#58c2ba'],
    [2, '#3a9cb4'],
    [4, '#24739e'],
    [8, '#185586'],
    [16, '#0e3462']
  ];
  // Fond des cartes autour de l'île : le bleu du large.
  const OCEAN = '#0e3462';
  // Encre des contours et des noms, parchemin des noms : ceux du thème de l'interface.
  const INK = '#1a120b';
  const PARCHMENT = '#f6e2b1';
  const SERIF = "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif";
  const TREES = {
    tree: ['#2c6a34', '#5aa04a', 3],
    bigtree: ['#245a2e', '#4e9440', 4],
    pine: ['#1e4e30', '#3e7a4a', 3],
    bush: ['#3a7a36', '#6ab050', 2],
    twisted: ['#3e5a3a', '#6a8a5a', 3],
    autumn_red: ['#a8341e', '#e05a32', 3],
    autumn_orange: ['#c0601a', '#f0902a', 3],
    autumn_gold: ['#c09a20', '#f0d050', 3],
    goldtree: ['#c8a028', '#fae070', 3],
    wheat: ['#b88a30', '#f0d070', 1],
    leafpile: ['#b0501e', '#e0802a', 2],
    palm: ['#3a8a3a', '#7ac05a', 3],
    cactus: ['#3a7a3a', '#6aa85a', 2],
    glowtree: ['#3aa89a', '#a8f4e8', 3],
    crystal: ['#7ac8e0', '#e0fbff', 2],
    magicplant: ['#8a5ac8', '#d0a8ff', 2],
    mushroom: ['#b8403a', '#f0d0c0', 1],
    flower: ['#e070a0', '#fff0a0', 1],
    reed: ['#7a8a4a', '#a8b870', 1],
    lilypad: ['#4a9a3a', '#88d070', 1],
    rock: ['#7a7a7e', '#b4b4b8', 2],
    peak: ['#9aa0a6', '#e8ecef', 3],
    ruin: ['#b09a70', '#e0cca0', 2],
    deadwood: ['#7a5a3a', '#a8865a', 1],
    dune: ['#d0b070', '#f0dca8', 2]
  };
  const ROOF = {
    chaume: '#d8b04a',
    auberge: '#4a5a9a',
    echoppe: '#c04a34',
    demeure: '#b0603a',
    demeure_bleue: '#4a6aa8',
    foret: '#6a4a2a',
    marais: '#8a8a4a',
    automne: '#b0502a',
    desert: '#d8a860',
    enchantee: '#8a5ac8'
  };
  const FARM = {
    barn: '#b03a2c',
    silo: '#d0ccc4',
    coop: '#a8442c',
    hay: '#e8c050',
    cart: '#8a6440',
    trough: '#5a9ac8',
    fountain: '#7ac0e0',
    woodpile: '#7a5634',
    logs: '#9a7248',
    bench: '#8a6440',
    birdbath: '#c4c0b4',
    crates: '#c8964e',
    basket: '#c8964e',
    chop: '#9a7248',
    scarecrow: '#4a6ab0',
    lantern: '#ffd36b'
  };
  const hashOf = (x, y, k) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  // ---------------------------------------------------------------- Image de fond
  // Peinte d'un coup, rapidement (couleurs précalculées, écriture directe des pixels), puis gardée :
  // sur l'île, refaite seulement si l'île change ; en donjon, quand une herse s'ouvre.
  let under = null,
    island = null,
    houses = [],
    gates = -1,
    knownAt = '',
    box = null,
    checkAt = 0;
  function gateCount() {
    let n = 0;
    const tiles = game.world.tiles;
    for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) if (tiles[y]?.[x] === 19) n++;
    return n;
  }
  function ensureBase(force) {
    const key = game.world.tiles,
      inst = !!game.world.instance;
    let stale = !base || baseFor !== key || force;
    if (!stale && !inst && baseAt !== BRIDGE_TILES.size) stale = true;
    // En donjon, une herse ouverte change le plan : vérifié deux fois par seconde, sur le cadre de l'instance seulement.
    // Le brouillard aussi : une salle visitée, un passage ouvert agrandissent le plan connu.
    if (!stale && inst && time - checkAt > 30) {
      checkAt = time;
      stale = gateCount() !== gates || CANAAN_DUNGEON_EXPLORE.knownKey() !== knownAt;
    }
    if (!stale) return base;
    // Les Tréfonds : leur image est peinte une fois et gardée.
    if (!inst && game.world.layer === 'under') {
      under ||= paintUnder();
      base = under;
      baseFor = key;
      return base;
    }
    // L'île est gardée à part : au retour d'un donjon, elle resert telle quelle.
    if (!inst && island && island.key === key && island.bridges === BRIDGE_TILES.size && !force) {
      base = island.image;
      baseFor = key;
      baseAt = BRIDGE_TILES.size;
      return base;
    }
    if (inst) {
      box = instanceBox();
      base = paintInstance();
      gates = gateCount();
      knownAt = CANAAN_DUNGEON_EXPLORE.knownKey();
    } else {
      houses = CANAAN_HOUSE.buildings();
      base = paintIsland();
      baseAt = BRIDGE_TILES.size;
      island = { key, bridges: baseAt, image: base };
    }
    baseFor = key;
    return base;
  }
  function newCanvas() {
    const cv = document.createElement('canvas');
    cv.width = MAPW * PX;
    cv.height = MAPH * PX;
    return cv;
  }
  // Bruit fixe (huit nuances) et nuances précalculées de chaque couleur, au format des pixels (ABGR).
  const NOISE = new Uint8Array(256);
  for (let i = 0, h = 12345; i < 256; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    NOISE[i] = (h >>> 16) & 7;
  }
  const SHADES = new Map();
  function shades(hex, lo = 0.92, hi = 1.06) {
    const key = hex + lo + hi;
    let out = SHADES.get(key);
    if (out) return out;
    const [r, g, b] = rgb(hex);
    out = new Uint32Array(8);
    for (let q = 0; q < 8; q++) {
      const k = lo + ((hi - lo) * q) / 7;
      out[q] =
        ((255 << 24) |
          (Math.min(255, Math.round(b * k)) << 16) |
          (Math.min(255, Math.round(g * k)) << 8) |
          Math.min(255, Math.round(r * k))) >>>
        0;
    }
    SHADES.set(key, out);
    return out;
  }
  // Peint l'image : paint(px) reçoit les pixels (Uint32Array) et la largeur.
  // area : seulement ce rectangle du canevas (coordonnées des pixels de paint relatives à son coin).
  function pixels(cv, paint, area = { x: 0, y: 0, w: cv.width, h: cv.height }) {
    const g = cv.getContext('2d'),
      img = g.createImageData?.(area.w, area.h);
    // Sans pixels (canevas factice des tests sans écran) : rien à peindre.
    if (!img?.data?.buffer) return g;
    paint(new Uint32Array(img.data.buffer), area.w);
    g.putImageData(img, area.x, area.y);
    return g;
  }
  // Une case : ses PX × PX pixels dans les nuances données.
  function fillTile(px, w, X, Y, sh) {
    for (let j = 0; j < PX; j++) {
      const row = (Y + j) * w + X,
        n = ((Y + j) * 13) & 255;
      for (let i = 0; i < PX; i++) px[row + i] = sh[NOISE[(n + (X + i) * 7) & 255]];
    }
  }
  function edgeLine(px, w, X, Y, dx, dy, col) {
    for (let k = 0; k < PX; k++)
      px[(dy ? Y + (dy > 0 ? PX - 1 : 0) : Y + k) * w + (dx ? X + (dx > 0 ? PX - 1 : 0) : X + k)] = col;
  }
  const DX4 = [0, 1, 0, -1],
    DY4 = [-1, 0, 1, 0];
  // Distance (en cases, chanfrein 8 voisins) de chaque case de mer à la terre la plus proche.
  function seaDistance(isWater) {
    const d = new Float32Array(MAPW * MAPH),
      relax = (i, j, w) => {
        if (d[j] + w < d[i]) d[i] = d[j] + w;
      };
    for (let i = 0; i < d.length; i++) d[i] = isWater(i) ? Infinity : 0;
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++) {
        const i = y * MAPW + x;
        if (x > 0) relax(i, i - 1, 1);
        if (y > 0) {
          relax(i, i - MAPW, 1);
          if (x > 0) relax(i, i - MAPW - 1, 1.41);
          if (x < MAPW - 1) relax(i, i - MAPW + 1, 1.41);
        }
      }
    for (let y = MAPH - 1; y >= 0; y--)
      for (let x = MAPW - 1; x >= 0; x--) {
        const i = y * MAPW + x;
        if (x < MAPW - 1) relax(i, i + 1, 1);
        if (y < MAPH - 1) {
          relax(i, i + MAPW, 1);
          if (x < MAPW - 1) relax(i, i + MAPW + 1, 1.41);
          if (x > 0) relax(i, i + MAPW - 1, 1.41);
        }
      }
    return d;
  }
  // Teinte de la mer à une distance de la côte (par demi-case), entre les paliers de SEA.
  const SEA_HEX = [];
  function seaHex(dist) {
    const q = Math.min(32, Math.round(dist * 2));
    if (SEA_HEX[q]) return SEA_HEX[q];
    const d = q / 2;
    let k = 0;
    while (k < SEA.length - 2 && SEA[k + 1][0] < d) k++;
    const [d0, h0] = SEA[k],
      [d1, h1] = SEA[k + 1],
      t = Math.max(0, Math.min(1, (d - d0) / (d1 - d0))),
      a = rgb(h0),
      b = rgb(h1),
      hex =
        '#' +
        a
          .map((v, i) =>
            Math.round(v + (b[i] - v) * t)
              .toString(16)
              .padStart(2, '0')
          )
          .join('');
    return (SEA_HEX[q] = hex);
  }
  // Touffe d'arbre ou rocher vu d'en haut, par taille : pixels pleins (les coins sont arrondis).
  const BLOB = {
    1: [[0, 0]],
    2: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ],
    3: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2]
    ],
    4: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3]
    ]
  };
  function paintIsland() {
    const cv = newCanvas(),
      tiles = game.world.overworld || game.world.tiles,
      deco = game.world.overdecor || game.world.decor,
      flat = new Uint8Array(MAPW * MAPH),
      tile = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? 0 : flat[y * MAPW + x]),
      water = t => t === 0 || t === undefined,
      kit = window.CANAAN_GROUND_KIT,
      zoneOf = (x, y) => (typeof regionAt === 'function' ? regionAt(x, y) : null),
      // Places pavées : celle du camp autour de la fontaine, celle de la cité elfique en marbre.
      plazas = [];
    if (typeof CANAAN_CAMP !== 'undefined')
      plazas.push({ x: CANAAN_CAMP.x + 0.5, y: CANAAN_CAMP.y + 0.5, r: 3.3, hex: '#9c968a' });
    if (window.CANAAN_CITY_PLAN)
      plazas.push({
        x: CANAAN_CITY_PLAN.center.x + 0.5,
        y: CANAAN_CITY_PLAN.center.y + 0.5,
        r: 5.2,
        hex: '#d6d0c2'
      });
    // L'île à plat, une fois ; les pièces des maisons (hors de l'île) comptent comme de la mer.
    for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) flat[y * MAPW + x] = tiles[y][x] || 0;
    for (const r of typeof CANAAN_ROOMS !== 'undefined' ? CANAAN_ROOMS.filter(r => !r.under) : [])
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          if (x >= 0 && y >= 0 && x < MAPW && y < MAPH) flat[y * MAPW + x] = 0;
    const depth = seaDistance(i => flat[i] === 0 && !BRIDGE_TILES.has(i));
    const g = pixels(cv, (px, w) => {
      const foam = shades('#cfeef0')[3],
        glint = shades('#7cc0dc')[3],
        plank = [shades('#6e4a2c')[3], shades('#a87a4c')[3]],
        roadEdge = shades('#6e5a40', 1, 1)[0],
        cliffTop = shades(LAND[4], 1.25, 1.25)[0],
        cliffFoot = shades(LAND[4], 0.6, 0.6)[0],
        border = new Map();
      for (let y = 0; y < MAPH; y++)
        for (let x = 0; x < MAPW; x++) {
          const t = tile(x, y),
            X = x * PX,
            Y = y * PX;
          if (t === 0 && BRIDGE_TILES.has(y * MAPW + x)) {
            for (let j = 0; j < PX; j++) for (let i = 0; i < PX; i++) px[(Y + j) * w + X + i] = plank[j & 1];
            continue;
          }
          if (water(t)) {
            // Mer : turquoise au pied de la plage, bleu nuit au large ; écume contre la terre, reflets épars au large.
            const d = depth[y * MAPW + x];
            fillTile(px, w, X, Y, shades(seaHex(d), 0.97, 1.03));
            if (d > 5 && hashOf(x, y, 3) < 0.05) {
              const gx = X + ((hashOf(x, y, 4) * 3) | 0),
                gy = Y + ((hashOf(x, y, 5) * PX) | 0);
              px[gy * w + gx] = glint;
              px[gy * w + gx + 1] = glint;
            }
            for (let i = 0; i < 4; i++)
              if (!water(tile(x + DX4[i], y + DY4[i]))) edgeLine(px, w, X, Y, DX4[i], DY4[i], foam);
            continue;
          }
          if (t === 2 && BRIDGE_TILES.has(y * MAPW + x)) {
            for (let j = 0; j < PX; j++) for (let i = 0; i < PX; i++) px[(Y + j) * w + X + i] = plank[j & 1];
            continue;
          }
          // Relief doux : un bruit large éclaire ou assombrit le sol, comme les vallons du jeu.
          const hex = LAND[t] || LAND[1],
            rel = kit ? kit.fbm(x / 13, y / 13, 7) : 0.5,
            q = Math.max(0, Math.min(4, Math.round((rel - 0.25) * 8))),
            lo = 0.86 + q * 0.045;
          const plaza = plazas.find(p => (x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 < p.r * p.r);
          if (plaza && t !== 4) {
            // Pavés : pierres de 2 pixels, joints sombres en quinconce.
            const stone = shades(plaza.hex, 0.88, 1.1),
              joint = shades(plaza.hex, 0.7, 0.7)[0];
            for (let j = 0; j < PX; j++)
              for (let i = 0; i < PX; i++)
                px[(Y + j) * w + X + i] =
                  (j & 1) === 0 && ((i + (j & 2)) & 3) === 0
                    ? joint
                    : stone[NOISE[(X + i + (Y + j) * 5) & 255]];
            continue;
          }
          fillTile(px, w, X, Y, shades(hex, t === 2 ? 0.95 : lo, t === 2 ? 1.05 : lo + 0.12));
          // Falaises : la roche s'éclaire en haut et s'assombrit au pied.
          if (t === 4) {
            if (tile(x, y - 1) !== 4) edgeLine(px, w, X, Y, 0, -1, cliffTop);
            if (tile(x, y + 1) !== 4) edgeLine(px, w, X, Y, 0, 1, cliffFoot);
          }
          // Routes : bord plus sombre contre le terrain voisin.
          if (t === 2)
            for (let i = 0; i < 4; i++) {
              const n = tile(x + DX4[i], y + DY4[i]);
              if (n !== 2 && !water(n)) edgeLine(px, w, X, Y, DX4[i], DY4[i], roadEdge);
            }
          // Frontière entre deux biomes : un pointillé sombre, comme sur les cartes anciennes.
          const zone = zoneOf(x, y);
          if (zone && t !== 2) {
            let ink = border.get(hex);
            if (!ink) border.set(hex, (ink = shades(hex, 0.55, 0.55)[0]));
            if (!water(tile(x + 1, y)) && zoneOf(x + 1, y) !== zone)
              for (let j = 0; j < PX; j += 2) px[(Y + j + (y & 1)) * w + X + PX - 1] = ink;
            if (!water(tile(x, y + 1)) && zoneOf(x, y + 1) !== zone)
              for (let i = 0; i < PX; i += 2) px[(Y + PX - 1) * w + X + i + (x & 1)] = ink;
          }
        }
      // Arbres, rochers et plantes vus d'en haut, après le sol : leur ombre déborde sur la case voisine,
      // et les forêts se lisent comme des massifs.
      for (let y = 0; y < MAPH; y++)
        for (let x = 0; x < MAPW; x++) {
          const tree = TREES[deco[y]?.[x]],
            t = tile(x, y);
          if (!tree || water(t)) continue;
          const [dark, light, size] = tree,
            ox = x * PX + ((PX - size) >> 1),
            oy = y * PX + ((PX - size) >> 1),
            shade = shades(LAND[t] || LAND[1], 0.62, 0.62)[0],
            body = shades(dark, 1, 1)[0],
            top = shades(light, 1, 1)[0],
            blob = BLOB[size] || BLOB[2];
          if (size > 1)
            for (const [i, j] of blob) {
              const sx = ox + i + 1,
                sy = oy + j + 1;
              if (sx < w && sy < MAPH * PX) px[sy * w + sx] = shade;
            }
          for (const [i, j] of blob) px[(oy + j) * w + ox + i] = body;
          px[(oy + (size > 2 ? 1 : 0)) * w + ox + (size > 2 ? 1 : 0)] = top;
          if (size > 3) px[oy * w + ox + 1] = top;
        }
    });
    // Bâtiments, vus de trois quarts comme dans le jeu : ombre portée, mur clair et sa porte, toit à pignon et faîte.
    g.imageSmoothingEnabled = false;
    for (const b of houses) {
      if (canaanRoomAt(b.x, b.y)) continue;
      const X = b.x * PX,
        Y = b.y * PX,
        w = b.w * PX,
        h = b.h * PX,
        roof = ROOF[b.style] || '#a8603a',
        wallH = Math.max(3, Math.round(h * 0.34)),
        roofH = h - wallH;
      g.fillStyle = 'rgba(10,8,4,.38)';
      g.fillRect(X + 2, Y + 2, w + 1, h + 1);
      g.fillStyle = INK;
      g.fillRect(X - 1, Y - 1, w + 2, h + 2);
      g.fillStyle = '#e4d3a8';
      g.fillRect(X, Y + roofH, w, wallH);
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(X, Y + roofH, w, 1);
      g.fillStyle = '#4a2e1a';
      g.fillRect(X + Math.floor(w / 2) - 1, Y + h - Math.min(3, wallH - 1), 2, Math.min(3, wallH - 1));
      g.fillStyle = roof;
      g.fillRect(X, Y, w, roofH);
      // Pan éclairé en haut, pan à l'ombre en bas, faîte clair entre les deux, avant-toit sombre.
      g.fillStyle = 'rgba(255,240,210,.22)';
      g.fillRect(X, Y, w, Math.floor(roofH / 2));
      g.fillStyle = 'rgba(255,250,230,.55)';
      g.fillRect(X, Y + Math.floor(roofH / 2) - 1, w, 1);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(X, Y + roofH - 1, w, 1);
    }
    // Ferme du camp : champs, enclos, jardin, grange…
    for (const it of window.CANAAN_CAMP_LIFE ? CANAAN_CAMP_LIFE.items() : []) {
      const X = it.x * PX,
        Y = it.y * PX,
        w = it.w * PX,
        h = it.h * PX;
      if (it.kind === 'field') {
        g.fillStyle = INK;
        g.fillRect(X - 1, Y - 1, w + 2, h + 2);
        for (let r = 0; r < h; r += 2) {
          g.fillStyle =
            it.crop === 'wheat'
              ? r % 4
                ? '#c89a3a'
                : '#e8c860'
              : r % 4
                ? '#6b4a2e'
                : it.crop === 'veg'
                  ? '#5aa03a'
                  : '#c84a4a';
          g.fillRect(X, Y + r, w, 2);
        }
      } else if (it.kind === 'pen' || it.kind === 'garden') {
        g.strokeStyle = it.kind === 'pen' ? '#7a5634' : '#f0ece0';
        g.lineWidth = 1;
        g.strokeRect(X + 1.5, Y + 1.5, w - 3, h - 3);
      } else if (FARM[it.kind]) {
        g.fillStyle = '#22160e';
        g.fillRect(X - 1, Y - 1, w + 2, h + 2);
        g.fillStyle = FARM[it.kind];
        g.fillRect(X, Y, w, h);
      } else if (it.kind === 'apple') {
        g.fillStyle = '#2c6a34';
        g.fillRect(X - 1, Y - 2, 6, 5);
        g.fillStyle = '#d83a2a';
        g.fillRect(X + 1, Y - 1, 1, 1);
        g.fillRect(X + 3, Y + 1, 1, 1);
      }
    }
    // Extensions : leurs lieux vus d'en haut (bâtiments, statues, arène), puis le nuage des terres fermées.
    for (const id of CANAAN_EXT.list()) CANAAN_EXT.mapPaint(id, g, PX);
    paintClouds(g);
    return cv;
  }
  // ---------------------------------------------------------------- Nuage des terres fermées
  // Terre d'une extension absente de ce build : un grand nuage blanc la recouvre. Il est fait de grosses volutes
  // rondes posées sur toute la terre (et un peu au-delà, sur la mer) ; chaque pixel prend la volute la plus haute et
  // s'éclaire selon sa pente (lumière en haut à gauche, ombre bleutée en bas à droite), en gros pixels de 2, avec un
  // liseré gris-bleu sur le pourtour : un nuage de dessin animé, bosselé, qui déborde du rivage.
  function paintClouds(g) {
    const lands = CANAAN_EXT_LANDS.filter(l => !canaanExtension(l.ext));
    if (!lands.length || !g.getImageData) return;
    const L = [-0.48, -0.62, 0.62],
      M = 8,
      COLORS = [
        [255, 255, 255],
        [240, 244, 250],
        [214, 223, 236],
        [184, 197, 218]
      ],
      RIM = [112, 128, 160];
    for (const land of lands) {
      const tx0 = Math.max(0, land.box.x0 - M),
        ty0 = Math.max(0, land.box.y0 - M),
        tx1 = Math.min(MAPW - 1, land.box.x1 + M),
        ty1 = Math.min(MAPH - 1, land.box.y1 + M),
        cw = tx1 - tx0 + 1,
        ch = ty1 - ty0 + 1;
      // Volutes : une grille décalée au hasard, gardée seulement près de la terre fermée.
      const near = (x, y, r) => {
        for (let j = -r; j <= r; j += 2)
          for (let i = -r; i <= r; i += 2)
            if (canaanExtLand(Math.round(x + i), Math.round(y + j)) === land) return true;
        return false;
      };
      const puffs = [];
      for (let gy = ty0; gy <= ty1; gy += 5)
        for (let gx = tx0 + ((gy / 5) % 2 ? 2.5 : 0); gx <= tx1; gx += 5) {
          const x = gx + (hashOf(gx, gy, 81) - 0.5) * 3,
            y = gy + (hashOf(gx, gy, 82) - 0.5) * 3;
          if (!near(x, y, 2)) continue;
          puffs.push({ x, y, r: 4.2 + hashOf(gx, gy, 83) * 3.6, z: hashOf(gx, gy, 84) * 2 });
        }
      // Volute la plus haute en un point : sa hauteur et sa normale (null hors du nuage).
      const top = (fx, fy) => {
        let best = null;
        for (const p of puffs) {
          const dx = fx - p.x,
            dy = fy - p.y,
            q = p.r * p.r - dx * dx - dy * dy;
          if (q <= 0) continue;
          const z = Math.sqrt(q) + p.z;
          if (!best || z > best.z) best = { z, nx: dx / p.r, ny: dy / p.r, nz: Math.sqrt(q) / p.r, p };
        }
        return best;
      };
      const X0 = tx0 * PX,
        Y0 = ty0 * PX,
        W2 = cw * PX,
        H2 = ch * PX,
        img = g.getImageData(X0, Y0, W2, H2),
        data = img.data,
        put = (bx, by, col) => {
          for (let j = 0; j < 2; j++)
            for (let i = 0; i < 2; i++) {
              const o = ((by + j) * W2 + bx + i) * 4;
              if (o < 0 || o + 3 >= data.length) continue;
              data[o] = col[0];
              data[o + 1] = col[1];
              data[o + 2] = col[2];
              data[o + 3] = 255;
            }
        };
      const cols = W2 >> 1,
        rows = H2 >> 1,
        cover = new Array(cols * rows);
      for (let by = 0; by < rows; by++)
        for (let bx = 0; bx < cols; bx++)
          cover[by * cols + bx] = top(tx0 + (bx * 2 + 1) / PX, ty0 + (by * 2 + 1) / PX);
      for (let by = 0; by < rows; by++)
        for (let bx = 0; bx < cols; bx++) {
          const t = cover[by * cols + bx];
          if (!t) continue;
          const out = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([i, j]) => !cover[(by + j) * cols + bx + i] || bx + i < 0 || bx + i >= cols);
          if (out) {
            put(bx * 2, by * 2, RIM);
            continue;
          }
          // Lumière de la volute ; un trait d'ombre là où une volute passe devant une autre plus basse.
          const lum = t.nx * L[0] + t.ny * L[1] + t.nz * L[2],
            below = cover[(by + 1) * cols + bx],
            seam = below && below.p !== t.p && below.z < t.z - 0.8;
          put(bx * 2, by * 2, COLORS[seam ? 3 : lum > 0.78 ? 0 : lum > 0.5 ? 1 : lum > 0.22 ? 2 : 3]);
        }
      g.putImageData(img, X0, Y0);
    }
  }
  // Donjon ou raid : sols du thème, murs sombres soulignés le long des salles, herses et dangers.
  // Seul le cadre des salles connues (box, avec sa marge) est peint : au-delà, tout est mur, de la couleur unie du fond
  // des cartes (#08080e), qui reste donc transparent. Peindre toute l'île figeait l'entrée et chaque salle découverte.
  function paintInstance() {
    const cv = newCanvas(),
      tiles = game.world.tiles,
      known = CANAAN_DUNGEON_EXPLORE.known,
      bx0 = Math.max(0, box.x0),
      by0 = Math.max(0, box.y0),
      bx1 = Math.min(MAPW, box.x1),
      by1 = Math.min(MAPH, box.y1),
      // Brouillard : seules les salles visitées (et les couloirs qui en partent) sont dessinées.
      open = (t, x, y) => t !== undefined && (!SOLID.includes(t) || t === 19) && known(x, y);
    if (bx1 <= bx0 || by1 <= by0) return cv;
    pixels(
      cv,
      (px, w) => {
        const wall = shades('#08080e', 1, 1),
          edge = shades('#5a5468', 0.85, 1.15),
          floors = new Map();
        for (let y = by0; y < by1; y++)
          for (let x = bx0; x < bx1; x++) {
            const t = tiles[y][x],
              X = (x - bx0) * PX,
              Y = (y - by0) * PX;
            if (!open(t, x, y)) {
              let rim = false;
              for (let i = 0; i < 4 && !rim; i++)
                rim = open(tiles[y + DY4[i]]?.[x + DX4[i]], x + DX4[i], y + DY4[i]);
              fillTile(px, w, X, Y, rim ? edge : wall);
              continue;
            }
            let sh = floors.get(t);
            if (!sh) floors.set(t, (sh = shades(dungeonMinimapColor(t), 0.9, 1.08)));
            fillTile(px, w, X, Y, sh);
          }
      },
      { x: bx0 * PX, y: by0 * PX, w: (bx1 - bx0) * PX, h: (by1 - by0) * PX }
    );
    return cv;
  }
  // Tréfonds : sols et chemins de chaque biome, eau et boue, roche soulignée le long des galeries.
  function paintUnder() {
    const cv = newCanvas(),
      tiles = game.world.underworld,
      U = CANAAN_UNDER.T,
      wet = t => t === U.RIVER || t === U.LAKE || t === U.CHASM,
      open = t => t !== undefined && (!SOLID.includes(t) || wet(t));
    pixels(cv, (px, w) => {
      const rock = shades('#0a0808', 1, 1),
        edge = shades('#4a4038', 0.85, 1.15),
        cols = new Map();
      for (let y = 0; y < MAPH; y++)
        for (let x = 0; x < MAPW; x++) {
          const t = tiles[y][x],
            X = x * PX,
            Y = y * PX;
          if (!open(t, x, y)) {
            let rim = false;
            for (let i = 0; i < 4 && !rim; i++)
              rim = open(tiles[y + DY4[i]]?.[x + DX4[i]], x + DX4[i], y + DY4[i]);
            fillTile(px, w, X, Y, rim ? edge : rock);
            continue;
          }
          const hex = CANAAN_UNDER.mapColor(t, x, y);
          let sh = cols.get(hex);
          if (!sh) cols.set(hex, (sh = shades(hex, 0.9, 1.08)));
          fillTile(px, w, X, Y, sh);
        }
    });
    return cv;
  }
  // Cadre d'une instance : les cases praticables déjà connues et leurs abords.
  function instanceBox() {
    let x0 = MAPW,
      y0 = MAPH,
      x1 = 0,
      y1 = 0;
    const tiles = game.world.tiles;
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++)
        if ((!SOLID.includes(tiles[y][x]) || tiles[y][x] === 19) && CANAAN_DUNGEON_EXPLORE.known(x, y)) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    return x1 < x0
      ? { x0: 0, y0: 0, x1: MAPW, y1: MAPH }
      : { x0: x0 - 3, y0: y0 - 3, x1: x1 + 4, y1: y1 + 4 };
  }

  // ---------------------------------------------------------------- Où est le héros
  function heroSpot() {
    let x = P.x / TS,
      y = P.y / TS;
    // Dans une pièce (maison, échoppe, refuge) : la carte montre le bâtiment, dehors.
    const room = !game.world.instance && canaanRoomAt(x, y);
    if (room) {
      const b = houses.find(b => b.id === room.id);
      if (b) return { x: b.door.x / TS, y: b.door.y / TS };
    }
    return { x, y };
  }

  // ---------------------------------------------------------------- Repères
  function icon(c, kind, x, y, s = 1, extra = {}) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    c.scale(s, s);
    const R = (rx, ry, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(rx, ry, w, h);
    };
    switch (kind) {
      case 'camp':
        R(-8, -2, 16, 9, '#22160e');
        R(-7, -1, 14, 7, '#e8d8a8');
        c.fillStyle = '#22160e';
        c.beginPath();
        c.moveTo(-10, 0);
        c.lineTo(0, -11);
        c.lineTo(10, 0);
        c.fill();
        c.fillStyle = '#c4553f';
        c.beginPath();
        c.moveTo(-7, -1);
        c.lineTo(0, -8);
        c.lineTo(7, -1);
        c.fill();
        R(-2, 1, 4, 5, '#ffb347');
        break;
      case 'city':
        // Cité elfique : arbre aux feuilles dorées sur un écusson de jade.
        R(-9, -9, 18, 18, '#22160e');
        R(-8, -8, 16, 16, '#2e8a6a');
        R(-8, -8, 16, 3, '#5ac8a0');
        R(-1, 0, 3, 6, '#6a4a2e');
        c.fillStyle = '#f0d060';
        c.beginPath();
        c.arc(0, -2, 5, 0, Math.PI * 2);
        c.fill();
        R(-2, -5, 2, 2, '#fff4b0');
        break;
      case 'portal':
        R(-7, -7, 14, 14, '#22160e');
        R(-6, -6, 12, 12, extra.raid ? '#8a4ac8' : '#c83a44');
        R(-6, -6, 12, 3, extra.raid ? '#c08aff' : '#ff7a80');
        c.fillStyle = '#1a0a20';
        c.beginPath();
        c.ellipse(0, 1, 3.5, 4.5, 0, 0, Math.PI * 2);
        c.fill();
        R(-1, -2, 2, 2, '#ffffff');
        break;
      case 'arena':
        c.rotate(Math.PI / 4);
        R(-6, -6, 12, 12, '#22160e');
        R(-5, -5, 10, 10, '#ffb347');
        R(-5, -5, 10, 3, '#ffe0a0');
        break;
      case 'boss':
        c.fillStyle = '#22160e';
        c.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5,
            r = k % 2 ? 4.5 : 10;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.fill();
        c.fillStyle = '#ffe15d';
        c.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5,
            r = k % 2 ? 3 : 8;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.fill();
        break;
      case 'refuge':
        R(-6, -2, 12, 8, '#22160e');
        R(-5, -1, 10, 6, '#b08858');
        c.fillStyle = '#22160e';
        c.beginPath();
        c.moveTo(-8, -1);
        c.lineTo(0, -9);
        c.lineTo(8, -1);
        c.fill();
        c.fillStyle = '#8a3a2a';
        c.beginPath();
        c.moveTo(-6, -2);
        c.lineTo(0, -7);
        c.lineTo(6, -2);
        c.fill();
        R(-1, 1, 3, 4, '#4a2a18');
        break;
      case 'stairs':
        // Entrée des Tréfonds : trou cerclé de pierre et échelle.
        R(-8, -6, 16, 12, '#22160e');
        R(-7, -5, 14, 10, '#8a8a8e');
        R(-5, -3, 10, 6, '#050404');
        R(-3, -9, 2, 12, '#c8b890');
        R(2, -9, 2, 12, '#c8b890');
        R(-3, -6, 7, 1, '#c8b890');
        R(-3, -2, 7, 1, '#c8b890');
        break;
      case 'ruins':
        for (const dx of [-6, 2]) {
          R(dx - 1, -8, 6, 15, '#22160e');
          R(dx, -7, 4, 13, '#b4b0a6');
          R(dx, -7, 1, 13, '#e0dcd0');
        }
        R(-7, -9, 14, 3, '#22160e');
        R(-6, -8, 12, 1, '#d0ccc0');
        break;
      case 'tower':
        R(-5, -10, 10, 18, '#22160e');
        R(-4, -9, 8, 16, '#8a929a');
        R(-4, -9, 2, 16, '#b4bcc2');
        for (const dx of [-5, -1, 3]) R(dx, -12, 2, 3, '#22160e');
        R(-1, -5, 2, 3, '#ffd36b');
        break;
      case 'chest':
        R(-6, -5, 12, 10, '#22160e');
        R(-5, -4, 10, 8, '#a8642e');
        R(-5, -4, 10, 2, '#d89a50');
        R(-5, -1, 10, 1, '#ffd36d');
        R(-1, -1, 2, 3, '#ffd36d');
        break;
      case 'shop':
        c.fillStyle = '#22160e';
        c.beginPath();
        c.arc(0, 0, 7, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#f0c040';
        c.beginPath();
        c.arc(0, 0, 5.5, 0, Math.PI * 2);
        c.fill();
        R(-1, -3, 2, 6, '#a8781a');
        break;
      case 'quest': {
        const mark = extra.mark,
          col = mark === '?' ? '#ffd84a' : extra.main ? '#ffd84a' : '#fff0a0';
        c.fillStyle = '#22160e';
        c.beginPath();
        c.arc(0, 0, 8, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = mark === '…' ? '#5a5a66' : '#3a2a10';
        c.beginPath();
        c.arc(0, 0, 6.5, 0, Math.PI * 2);
        c.fill();
        c.font = 'bold 12px ' + SERIF;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = mark === '…' ? '#c8c0b0' : col;
        c.fillText(mark, 0, 1);
        break;
      }
      case 'target': {
        const pulse = 1 + Math.sin(time * 0.12) * 0.15;
        c.strokeStyle = '#22160e';
        c.lineWidth = 5;
        c.beginPath();
        c.arc(0, 0, 9 * pulse, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = '#ffd84a';
        c.lineWidth = 2.5;
        c.stroke();
        R(-1.5, -1.5, 3, 3, '#ffd84a');
        break;
      }
      case 'mob':
        R(-3, -3, 6, 6, '#22160e');
        R(-2, -2, 4, 4, extra.elite ? '#ffa040' : '#ff5c5c');
        R(-2, -2, 2, 1, extra.elite ? '#ffd0a0' : '#ffb0b0');
        break;
      case 'bossmob':
        c.fillStyle = '#22160e';
        c.beginPath();
        c.arc(0, 0, 8, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#e8384a';
        c.beginPath();
        c.arc(0, 0, 6.5, 0, Math.PI * 2);
        c.fill();
        R(-3, -2, 2, 2, '#22160e');
        R(1, -2, 2, 2, '#22160e');
        R(-2, 2, 4, 1, '#22160e');
        R(-6, -9, 12, 3, '#ffd84a');
        R(-6, -11, 2, 2, '#ffd84a');
        R(-1, -11, 2, 2, '#ffd84a');
        R(4, -11, 2, 2, '#ffd84a');
        break;
      case 'ally':
        c.fillStyle = '#22160e';
        c.beginPath();
        c.arc(0, 0, 5.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = extra.color || '#7ad0ff';
        c.beginPath();
        c.arc(0, 0, 4, 0, Math.PI * 2);
        c.fill();
        break;
      case 'me':
        // Le héros : un halo qui respire, puis une flèche blanche tournée dans son sens de marche.
        c.fillStyle = 'rgba(255,255,255,' + (0.18 + Math.sin(time * 0.1) * 0.08) + ')';
        c.beginPath();
        c.arc(0, 0, 13, 0, Math.PI * 2);
        c.fill();
        c.rotate(extra.angle || 0);
        c.fillStyle = '#22160e';
        c.beginPath();
        c.moveTo(10, 0);
        c.lineTo(-7, -7.5);
        c.lineTo(-3.5, 0);
        c.lineTo(-7, 7.5);
        c.closePath();
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(7.5, 0);
        c.lineTo(-5, -5);
        c.lineTo(-2, 0);
        c.lineTo(-5, 5);
        c.closePath();
        c.fill();
        break;
    }
    c.restore();
  }
  // Nom posé sur la carte : police à empattements du thème, cerné d'encre. region : nom de région, en italique doré.
  function label(c, text, x, y, size = 11, color = PARCHMENT, region = false) {
    c.save();
    c.font = (region ? 'italic bold ' : 'bold ') + size + 'px ' + SERIF;
    if ('letterSpacing' in c) c.letterSpacing = region ? '1.5px' : '0px';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = region ? 4 : 3;
    c.strokeStyle = INK;
    c.strokeText(text, x, y);
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.restore();
  }
  // Rose des vents, dans le coin de la grande carte : quatre branches dorées, le nord marqué.
  function compass(c, x, y, r) {
    c.save();
    c.translate(x, y);
    c.globalAlpha = 0.92;
    c.fillStyle = 'rgba(26,18,11,.55)';
    c.beginPath();
    c.arc(0, 0, r + 6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#7a5a2a';
    c.lineWidth = 2;
    c.stroke();
    for (let k = 0; k < 8; k++) {
      const long = k % 2 === 0,
        a = (k * Math.PI) / 4 - Math.PI / 2,
        len = long ? r : r * 0.5,
        side = long ? r * 0.2 : r * 0.14;
      for (const half of [1, -1]) {
        c.fillStyle = half > 0 ? (long ? '#f6dc98' : '#b8a483') : long ? '#a07a3a' : '#6a5434';
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        c.lineTo(Math.cos(a + (half * Math.PI) / 2) * side, Math.sin(a + (half * Math.PI) / 2) * side);
        c.fill();
      }
    }
    c.fillStyle = '#c4553f';
    c.beginPath();
    c.arc(0, 0, 2.5, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    label(c, 'N', 0, -r - 12, 12, '#f6dc98');
    c.restore();
  }
  // Tous les repères d'une vue : v = { x0, y0, scale, w, h, mini }.
  function markers(c, v) {
    const S = (tx, ty) => [(tx - v.x0) * v.scale, (ty - v.y0) * v.scale],
      seen = (sx, sy, m = 20) => sx > -m && sy > -m && sx < v.w + m && sy < v.h + m,
      names = !v.mini && v.scale >= 4,
      k = v.mini ? 0.85 : 1.2;
    const put = (kind, tx, ty, extra, name) => {
      const [sx, sy] = S(tx, ty);
      if (!seen(sx, sy)) return null;
      icon(c, kind, sx, sy, k, extra);
      if (name && names) label(c, name, sx, sy + 20, 14);
      return [sx, sy];
    };
    // Personnages des quêtes : « ! » quête à prendre, « ? » quête à rendre (sur la couche du groupe).
    const questGivers = () => {
      for (const npc of Object.values(CANAAN_QUESTS.npcs())) {
        const mode = CANAAN_QUESTS.npcMode(game.hero, npc),
          mark = mode === 'offer' ? '!' : mode === 'ready' ? '?' : '';
        if (mark)
          put(
            'quest',
            npc.x / TS,
            npc.y / TS,
            { mark, main: npc.quest?.main },
            names && v.scale >= 6 ? npc.def.name : null
          );
      }
    };
    // Objectif de la quête suivie ; sur la mini-carte, une flèche au bord s'il est plus loin.
    const questGoal = () => {
      const tr = CANAAN_QUESTS.target(game.hero);
      if (tr && !tr.area) {
        const [sx, sy] = S(tr.x / TS, tr.y / TS);
        if (seen(sx, sy, -6)) icon(c, 'target', sx, sy, k);
        else if (v.mini) {
          const cx = v.w / 2,
            cy = v.h / 2,
            a = Math.atan2(sy - cy, sx - cx),
            r = (v.r || v.w / 2) - 10;
          c.save();
          c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          c.rotate(a);
          c.fillStyle = '#22160e';
          c.beginPath();
          c.moveTo(9, 0);
          c.lineTo(-6, -7);
          c.lineTo(-6, 7);
          c.fill();
          c.fillStyle = '#ffd84a';
          c.beginPath();
          c.moveTo(6, 0);
          c.lineTo(-4, -5);
          c.lineTo(-4, 5);
          c.fill();
          c.restore();
        }
      }
    };
    if (game.world.instance) {
      for (const m of game.world.monsters) {
        if (m.hp <= 0 || m.hidden || !CANAAN_DUNGEON_EXPLORE.known(m.x / TS, m.y / TS)) continue;
        put(m.boss ? 'bossmob' : 'mob', m.x / TS, m.y / TS, { elite: m.elite }, m.boss && names ? m.t : null);
      }
    } else if (game.world.layer === 'under') {
      // Tréfonds : forteresse, entrées, portails des donjons, repaires des boss, marchand ; monstres sur la mini-carte.
      for (const mk of CANAAN_UNDER.markers()) {
        const at = put(mk.kind, mk.x, mk.y, {}, mk.name);
        if (at && mk.i !== undefined && view.place === mk.i && !v.mini) {
          c.strokeStyle = '#ffffff';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(at[0], at[1], 15 + Math.sin(time * 0.15) * 2, 0, Math.PI * 2);
          c.stroke();
        }
      }
      questGivers();
      if (v.mini)
        for (const m of game.world.monsters)
          if (m.hp > 0) put(m.worldBoss ? 'bossmob' : 'mob', m.x / TS, m.y / TS, { elite: m.elite }, null);
      if (!v.mini && v.scale <= 3)
        CANAAN_UNDER.BIOMES.forEach(b => {
          const a = (b.angle * Math.PI) / 180,
            [sx, sy] = S(200 + Math.cos(a) * 80, 200 + Math.sin(a) * 80);
          label(c, b.name, sx, sy, 19, '#f6dc98', true);
        });
    } else {
      for (const p of PIXEL_PLACES) put(p.type === 'camp' ? 'refuge' : p.type, p.x, p.y, {}, p.name);
      // Entrées des Tréfonds.
      for (const e of CANAAN_UNDER.ENTRANCES) put('stairs', e.x, e.y, {}, e.name);
      if (!v.mini && v.scale >= 8)
        for (const b of houses)
          if (b.name && !b.place && !canaanRoomAt(b.x, b.y))
            label(c, b.name, ...S(b.x + b.w / 2, b.y - 0.4), 13, '#e8d6a8');
      // Marchands : la porte des bâtiments qui en ont un (Échoppe de Lira), à tous les zooms ; un marchand rangé
      // dans une pièce intérieure (coin d'océan de la carte) n'est pas montré là où est sa pièce.
      for (const s of CANAAN_GUIDE.shops()) put('shop', s.x / TS, s.y / TS, {}, s.name);
      for (const n of game.world.npcs)
        if (n.type === 'shop' && !canaanRoomAt(n.x, n.y) && (v.mini || v.scale >= 6))
          put('shop', n.x / TS, n.y / TS, {}, null);
      for (const b of WORLD_BOSSES) put('boss', b.x, b.y, {}, b.name);
      put('arena', CANAAN_ARENA_PORTAL.x, CANAAN_ARENA_PORTAL.y, {}, CANAAN_ARENA_NAME);
      instances.forEach((d, i) => {
        // Les portails des donjons souterrains sont sur la carte des Tréfonds.
        if (d.under) return;
        const at = put('portal', d.x, d.y, { raid: d.raid }, d.name);
        if (at && view.place === i && !v.mini) {
          c.strokeStyle = '#ffffff';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(at[0], at[1], 15 + Math.sin(time * 0.15) * 2, 0, Math.PI * 2);
          c.stroke();
        }
      });
      for (const camp of villages) put('camp', camp.x, camp.y, {}, camp.name);
      // Lieux des extensions présentes (écurie, arène…).
      for (const mk of CANAAN_EXT.markers()) put(mk.kind, mk.x, mk.y, mk.extra || {}, mk.name);
      if (window.CANAAN_CITY_PLAN)
        put('city', CANAAN_CITY_PLAN.center.x, CANAAN_CITY_PLAN.center.y, {}, CANAAN_CITY_PLAN.name);
      questGivers();
      // Monstres proches, sur la mini-carte seulement.
      if (v.mini)
        for (const m of game.world.monsters) {
          if (m.hp <= 0) continue;
          put(m.worldBoss ? 'bossmob' : 'mob', m.x / TS, m.y / TS, { elite: m.elite }, null);
        }
    }
    if (!game.world.instance) questGoal();
    // Noms des biomes sur la vue d'ensemble de l'île, par-dessus les repères.
    if (!game.world.instance && game.world.layer !== 'under' && !v.mini && v.scale <= 3)
      for (const z of ZONES) {
        const [sx, sy] = S(z.x, z.y);
        label(c, z.name, sx, sy, 20, '#f6dc98', true);
      }
    // Alliés du groupe, puis le héros.
    for (const h of game.heroes) {
      if (h === game.hero || h.away) continue;
      const at = put('ally', h.player.x / TS, h.player.y / TS, { color: h.color }, null);
      if (at && !v.mini) label(c, h.name || 'Allié', at[0], at[1] - 15, 13, '#bfe8ff');
    }
    const me = heroSpot(),
      [mx, my] = S(me.x, me.y);
    icon(c, 'me', mx, my, v.mini ? 1 : 1.35, { angle: facing });
  }

  // ---------------------------------------------------------------- Grande carte (M)
  function fitView() {
    if (game.world.instance) {
      ensureBase();
      const b = box || instanceBox(),
        span = Math.max(b.x1 - b.x0, b.y1 - b.y0);
      return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, scale: BIG / span };
    }
    // Île : un peu plus large que l'île elle-même, pour voir aussi la terre du sud-ouest (Extension 1).
    return { cx: 200, cy: 200, scale: BIG / (game.world.layer === 'under' ? 330 : 384) };
  }
  function currentView() {
    const fit = fitView();
    if (view.fitted) return fit;
    const me = heroSpot();
    const scale = Math.max(fit.scale, STEPS[view.step]);
    if (view.follow) {
      view.cx = me.x;
      view.cy = me.y;
    }
    return { cx: view.cx, cy: view.cy, scale };
  }
  function drawBigMap(highlight) {
    const el = document.getElementById('bigMap');
    if (!el) return;
    if (el.width !== BIG || el.height !== BIG) {
      el.width = BIG;
      el.height = BIG;
    }
    // Survol d'une instance dans la liste : drawBigMap(i) l'entoure, drawBigMap(null) l'efface.
    if (arguments.length) view.place = highlight;
    const c = el.getContext('2d'),
      b = ensureBase(),
      v = currentView(),
      x0 = v.cx - BIG / v.scale / 2,
      y0 = v.cy - BIG / v.scale / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, BIG, BIG);
    c.fillStyle = game.world.instance || game.world.layer === 'under' ? '#08080e' : OCEAN;
    c.fillRect(0, 0, BIG, BIG);
    c.imageSmoothingEnabled = v.scale < PX;
    c.drawImage(b, x0 * PX, y0 * PX, (BIG / v.scale) * PX, (BIG / v.scale) * PX, 0, 0, BIG, BIG);
    markers(c, { x0, y0, scale: v.scale, w: BIG, h: BIG, mini: false });
    // Bords assombris, comme un vieux papier, et rose des vents dans le coin.
    const vg = c.createRadialGradient(BIG / 2, BIG / 2, BIG * 0.42, BIG / 2, BIG / 2, BIG * 0.72);
    vg.addColorStop(0, 'rgba(10,6,2,0)');
    vg.addColorStop(1, 'rgba(10,6,2,.42)');
    c.fillStyle = vg;
    c.fillRect(0, 0, BIG, BIG);
    compass(c, BIG - 58, BIG - 62, 30);
    // Niveau de zoom, entre les boutons ＋ et －.
    const zoom = document.getElementById('mapZoomLevel');
    if (zoom) zoom.textContent = view.fitted ? '×1' : '×' + Math.round((v.scale / fitView().scale) * 10) / 10;
  }
  // Zoom d'un cran, autour d'un point de la carte (en pixels du canevas) ou du centre.
  function zoom(dir, at = null) {
    const before = currentView(),
      fit = fitView();
    let step = view.fitted ? STEPS.findIndex(s => s > fit.scale) - 1 : view.step;
    step = Math.max(-1, Math.min(STEPS.length - 1, step + dir));
    if (step < 0 || STEPS[step] <= fit.scale) {
      view.fitted = true;
      view.follow = false;
      drawBigMap();
      return;
    }
    // Le point sous la souris reste sous la souris.
    const px = at ? at.x : BIG / 2,
      py = at ? at.y : BIG / 2,
      tx = before.cx + (px - BIG / 2) / before.scale,
      ty = before.cy + (py - BIG / 2) / before.scale;
    view.step = step;
    view.fitted = false;
    if (at) view.follow = false;
    const scale = STEPS[step];
    if (!view.follow) {
      view.cx = tx - (px - BIG / 2) / scale;
      view.cy = ty - (py - BIG / 2) / scale;
    }
    drawBigMap();
  }
  function center() {
    view.fitted = false;
    view.follow = true;
    if (STEPS[view.step] < 6) view.step = STEPS.findIndex(s => s >= 6);
    drawBigMap();
  }
  function fit() {
    view.fitted = true;
    view.follow = false;
    drawBigMap();
  }
  // Molette, glisser-déposer et double-clic sur le canevas de la grande carte.
  function attach(el) {
    if (!el || el.dataset.mapReady) return;
    el.dataset.mapReady = '1';
    const toCanvas = e => {
      const r = el.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * BIG,
        y: ((e.clientY - r.top) / r.height) * BIG,
        k: BIG / r.width
      };
    };
    el.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        zoom(e.deltaY < 0 ? 1 : -1, toCanvas(e));
      },
      { passive: false }
    );
    el.addEventListener('dblclick', e => zoom(1, toCanvas(e)));
    let drag = null;
    el.addEventListener('pointerdown', e => {
      if (view.fitted) return;
      drag = { ...toCanvas(e), cx: view.cx, cy: view.cy };
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = toCanvas(e),
        scale = STEPS[view.step];
      view.follow = false;
      view.cx = drag.cx - (p.x - drag.x) / scale;
      view.cy = drag.cy - (p.y - drag.y) / scale;
      drawBigMap();
    });
    const stop = () => {
      drag = null;
      el.classList.remove('dragging');
    };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }
  // Un lieu choisi dans la liste : la carte se rapproche et se centre dessus (en cases).
  function focus(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    view.fitted = false;
    view.follow = false;
    view.step = Math.max(view.step, STEPS.indexOf(6));
    view.cx = x;
    view.cy = y;
    drawBigMap();
  }
  // Cadre de la grande carte : le canevas, ses boutons posés dessus et l'aide en bas.
  function frame() {
    return (
      '<div class="map-frame"><canvas id="bigMap" width="' +
      BIG +
      '" height="' +
      BIG +
      '"></canvas>' +
      '<div class="map-tools map-tools-top"><button data-action="mapCenter" title="Me centrer">🎯 Me centrer</button>' +
      '<button data-action="mapFit" title="Vue d’ensemble">🗺️ Vue d’ensemble</button></div>' +
      '<div class="map-tools map-tools-zoom"><button data-action="mapZoom" data-step="1" title="Zoomer">＋</button>' +
      '<span id="mapZoomLevel"></span>' +
      '<button data-action="mapZoom" data-step="-1" title="Dézoomer">－</button></div>' +
      '</div><div class="map-hint">Molette : zoom · glisser : déplacer · double-clic : zoomer ici</div>'
    );
  }
  // Légende : les repères tels qu'ils sont dessinés sur la carte. keys : [[repère, texte, options], …].
  function legend(keys) {
    return (
      '<section class="map-legend"><h3>Légende</h3><div class="map-legend-grid">' +
      keys
        .map(
          ([kind, text, extra]) =>
            '<div class="map-key"><canvas width="30" height="30" data-map-icon="' +
            kind +
            '"' +
            (extra ? " data-map-extra='" + JSON.stringify(extra) + "'" : '') +
            '></canvas><span>' +
            text +
            '</span></div>'
        )
        .join('') +
      '</div></section>'
    );
  }
  function drawLegend() {
    for (const cv of document.querySelectorAll?.('canvas[data-map-icon]') || []) {
      const c = cv.getContext?.('2d');
      if (!c) continue;
      let extra = {};
      try {
        extra = JSON.parse(cv.dataset.mapExtra || '{}');
      } catch {}
      c.clearRect(0, 0, cv.width, cv.height);
      icon(
        c,
        cv.dataset.mapIcon,
        cv.width / 2,
        cv.height / 2 + (cv.dataset.mapIcon === 'camp' ? 2 : 0),
        1,
        extra
      );
    }
  }
  // À l'ouverture : image de fond à jour, vue d'ensemble de l'île ou de l'instance.
  function open() {
    ensureBase();
    view.place = null;
    view.fitted = true;
    view.follow = false;
    const el = document.getElementById('bigMap');
    attach(el);
    drawLegend();
    drawBigMap();
  }

  // ---------------------------------------------------------------- Mini-carte ronde
  let miniFrame = 0;
  function drawMinimap() {
    // Sens de marche du héros (la flèche garde le dernier).
    const vx = P.vx || game.hero?.intent?.dx || 0,
      vy = P.vy || game.hero?.intent?.dy || 0;
    if (Math.abs(vx) + Math.abs(vy) > 0.05) facing = Math.atan2(vy, vx);
    if (++miniFrame % 3 !== 0) return;
    const el = document.getElementById('mmc');
    if (!el) return;
    const c = el.getContext('2d'),
      S = el.width,
      b = ensureBase(),
      scale = MINI[miniStep],
      me = heroSpot(),
      span = S / scale,
      x0 = me.x - span / 2,
      y0 = me.y - span / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, S, S);
    const O = S / 2,
      R = O - 9;
    c.save();
    c.beginPath();
    c.arc(O, O, R, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = game.world.instance || game.world.layer === 'under' ? '#08080e' : OCEAN;
    c.fillRect(0, 0, S, S);
    c.imageSmoothingEnabled = scale < PX;
    c.drawImage(b, x0 * PX, y0 * PX, span * PX, span * PX, 0, 0, S, S);
    markers(c, { x0, y0, scale, w: S, h: S, mini: true, r: R });
    // Ombre intérieure du verre, et un reflet en haut à gauche.
    const g = c.createRadialGradient(O, O, R * 0.55, O, O, R);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(8,4,0,.5)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    const gl = c.createLinearGradient(0, 0, S * 0.6, S * 0.6);
    gl.addColorStop(0, 'rgba(255,248,220,.14)');
    gl.addColorStop(1, 'rgba(255,248,220,0)');
    c.fillStyle = gl;
    c.beginPath();
    c.ellipse(O - R * 0.28, O - R * 0.42, R * 0.62, R * 0.34, -0.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // Anneau de laiton, comme les cadres de l'interface : bord d'encre, bande dorée en relief, liseré intérieur.
    c.lineWidth = 10;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(O, O, R + 4, 0, Math.PI * 2);
    c.stroke();
    const ring = c.createLinearGradient(0, 0, 0, S);
    ring.addColorStop(0, '#f6dc98');
    ring.addColorStop(0.45, '#c9a45a');
    ring.addColorStop(1, '#7a5a2a');
    c.lineWidth = 5;
    c.strokeStyle = ring;
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(255,240,200,.45)';
    c.beginPath();
    c.arc(O, O, R + 6.5, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.7)';
    c.beginPath();
    c.arc(O, O, R, 0, Math.PI * 2);
    c.stroke();
    // Points cardinaux : losanges dorés à l'est, au sud et à l'ouest ; le nord, une gemme rouge marquée N.
    for (const a of [0, Math.PI / 2, Math.PI]) {
      c.save();
      c.translate(O + Math.cos(a) * (R + 4), O + Math.sin(a) * (R + 4));
      c.rotate(Math.PI / 4);
      c.fillStyle = INK;
      c.fillRect(-4, -4, 8, 8);
      c.fillStyle = '#f6dc98';
      c.fillRect(-2.5, -2.5, 5, 5);
      c.restore();
    }
    c.fillStyle = INK;
    c.beginPath();
    c.arc(O, 9, 9, 0, Math.PI * 2);
    c.fill();
    const gem = c.createRadialGradient(O - 2, 7, 1, O, 9, 8);
    gem.addColorStop(0, '#ff9a7a');
    gem.addColorStop(1, '#a8302a');
    c.fillStyle = gem;
    c.beginPath();
    c.arc(O, 9, 7, 0, Math.PI * 2);
    c.fill();
    label(c, 'N', O, 9.5, 10, '#fff4d2');
    // La grande carte ouverte suit aussi (héros, monstres, alliés).
    if (miniFrame % 6 === 0 && document.getElementById('bigMap')) drawBigMap();
  }
  // Zoom de la mini-carte : trois niveaux, à la molette ou aux boutons ＋ et － posés sur l'anneau.
  function miniZoomBy(dir) {
    miniStep = Math.max(0, Math.min(MINI.length - 1, miniStep + dir));
    miniFrame = 2;
    drawMinimap();
  }
  const mini = document.getElementById('minimap');
  if (mini?.addEventListener) {
    mini.addEventListener('click', e => {
      const step = Number(e.target?.closest?.('[data-mini-step]')?.dataset.miniStep);
      if (!step) return;
      e.stopPropagation();
      miniZoomBy(step);
    });
    mini.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        miniZoomBy(e.deltaY < 0 ? 1 : -1);
      },
      { passive: false }
    );
  }

  window.CANAAN_MAP = Object.freeze({
    open,
    zoom: d => zoom(d),
    center,
    fit,
    view: () => ({ ...view, scale: currentView().scale }),
    miniZoom: () => MINI[miniStep],
    miniZoomBy,
    focus,
    groundColor: t => LAND[t] || LAND[1],
    frame,
    legend,
    base: () => ensureBase(true)
  });
  Object.assign(window, { drawBigMap, drawMinimap });
})();
