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
  const LAND = {
    1: '#5f9a4c',
    2: '#c8a26a',
    3: '#e4cb8e',
    4: '#8d969c',
    5: '#2f6b40',
    9: '#3a3846',
    10: '#9cc06e',
    11: '#4c7f5c',
    15: '#4f9a8e',
    16: '#c27a3a',
    17: '#3f8f88',
    18: '#5a62c8',
    // Palissade de troncs et emprises de la cité elfique.
    37: '#6a4a2e'
  };
  // Décors vus d'en haut : couleur de la touffe, de son reflet, et sa taille (en pixels de l'image de fond).
  const TREES = {
    tree: ['#2c6a34', '#5aa04a', 3],
    bigtree: ['#245a2e', '#4e9440', 4],
    pine: ['#1e4e30', '#3e7a4a', 3],
    bush: ['#3a7a36', '#6ab050', 2],
    twisted: ['#3e5a3a', '#6a8a5a', 3],
    autumn_red: ['#a8341e', '#e05a32', 3],
    autumn_orange: ['#c0601a', '#f0902a', 3],
    autumn_gold: ['#c09a20', '#f0d050', 3],
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
  function paintIsland() {
    const cv = newCanvas(),
      tiles = game.world.overworld || game.world.tiles,
      deco = game.world.overdecor || game.world.decor,
      flat = new Uint8Array(MAPW * MAPH),
      tile = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? 0 : flat[y * MAPW + x]),
      water = t => t === 0 || t === undefined;
    // L'île à plat, une fois ; les pièces des maisons (hors de l'île) comptent comme de la mer.
    for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) flat[y * MAPW + x] = tiles[y][x] || 0;
    for (const r of typeof CANAAN_ROOMS !== 'undefined' ? CANAAN_ROOMS.filter(r => !r.under) : [])
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          if (x >= 0 && y >= 0 && x < MAPW && y < MAPH) flat[y * MAPW + x] = 0;
    const g = pixels(cv, (px, w) => {
      const deep = shades('#1d5f96', 0.96, 1.04),
        shallow = shades('#3584bd', 0.96, 1.04),
        foam = shades('#a8dcef')[3],
        plank = [shades('#6e4a2c')[3], shades('#a87a4c')[3]];
      for (let y = 0; y < MAPH; y++)
        for (let x = 0; x < MAPW; x++) {
          const t = tile(x, y),
            X = x * PX,
            Y = y * PX;
          if (water(t)) {
            // Eau : plus claire près des rives, écume sur le bord qui touche la terre.
            let near = false;
            for (let r = 1; r <= 2 && !near; r++)
              for (let i = 0; i < 4 && !near; i++) near = !water(tile(x + DX4[i] * r, y + DY4[i] * r));
            fillTile(px, w, X, Y, near ? shallow : deep);
            for (let i = 0; i < 4; i++)
              if (!water(tile(x + DX4[i], y + DY4[i]))) edgeLine(px, w, X, Y, DX4[i], DY4[i], foam);
            continue;
          }
          const sh = shades(LAND[t] || '#5f9a4c');
          if (t === 2 && BRIDGE_TILES.has(y * MAPW + x)) {
            for (let j = 0; j < PX; j++) for (let i = 0; i < PX; i++) px[(Y + j) * w + X + i] = plank[j & 1];
            continue;
          }
          fillTile(px, w, X, Y, sh);
          // Relief : la roche s'éclaire en haut et s'assombrit au pied (falaise).
          if (t === 4) {
            if (tile(x, y - 1) !== 4) edgeLine(px, w, X, Y, 0, -1, shades(LAND[4], 1.25, 1.25)[0]);
            if (tile(x, y + 1) !== 4) edgeLine(px, w, X, Y, 0, 1, shades(LAND[4], 0.6, 0.6)[0]);
          }
          // Routes : bord plus sombre contre le terrain voisin.
          if (t === 2)
            for (let i = 0; i < 4; i++)
              if (tile(x + DX4[i], y + DY4[i]) !== 2)
                edgeLine(px, w, X, Y, DX4[i], DY4[i], shades(LAND[2], 0.78, 0.78)[0]);
          // Arbres, rochers et plantes vus d'en haut.
          const tree = TREES[deco[y]?.[x]];
          if (tree) {
            const [dark, light, size] = tree,
              ox = X + ((PX - size) >> 1),
              oy = Y + ((PX - size) >> 1),
              col = shades(dark, 1, 1)[0];
            for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) px[(oy + j) * w + ox + i] = col;
            px[oy * w + ox] = shades(light, 1, 1)[0];
          }
        }
    });
    // Bâtiments : toit de leur couleur, faîte clair, contour sombre.
    g.imageSmoothingEnabled = false;
    for (const b of houses) {
      if (canaanRoomAt(b.x, b.y)) continue;
      const X = b.x * PX,
        Y = b.y * PX,
        w = b.w * PX,
        h = b.h * PX;
      g.fillStyle = '#22160e';
      g.fillRect(X - 1, Y - 1, w + 2, h + 2);
      g.fillStyle = ROOF[b.style] || '#a8603a';
      g.fillRect(X, Y, w, h);
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.fillRect(X, Y + Math.floor(h / 2) - 1, w, 2);
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(X, Y + h - 2, w, 2);
    }
    // Ferme du camp : champs, enclos, jardin, grange…
    for (const it of window.CANAAN_CAMP_LIFE ? CANAAN_CAMP_LIFE.items() : []) {
      const X = it.x * PX,
        Y = it.y * PX,
        w = it.w * PX,
        h = it.h * PX;
      if (it.kind === 'field') {
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
    return cv;
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
        c.font = 'bold 12px system-ui,sans-serif';
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
  function label(c, text, x, y, size = 11, color = '#fff4d2') {
    c.save();
    c.font = 'bold ' + size + 'px system-ui,sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 3;
    c.strokeStyle = '#102438';
    c.strokeText(text, x, y);
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.restore();
  }
  // Tous les repères d'une vue : v = { x0, y0, scale, w, h, mini }.
  function markers(c, v) {
    const S = (tx, ty) => [(tx - v.x0) * v.scale, (ty - v.y0) * v.scale],
      seen = (sx, sy, m = 20) => sx > -m && sy > -m && sx < v.w + m && sy < v.h + m,
      names = !v.mini && v.scale >= 4,
      k = v.mini ? 0.85 : 1;
    const put = (kind, tx, ty, extra, name) => {
      const [sx, sy] = S(tx, ty);
      if (!seen(sx, sy)) return null;
      icon(c, kind, sx, sy, k, extra);
      if (name && names) label(c, name, sx, sy + 16, 11);
      return [sx, sy];
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
      for (const chest of CANAAN_RUBIS.revealedChests()) put('chest', chest.x, chest.y, {}, null);
      if (v.mini)
        for (const m of game.world.monsters)
          if (m.hp > 0) put(m.worldBoss ? 'bossmob' : 'mob', m.x / TS, m.y / TS, { elite: m.elite }, null);
      if (!v.mini && v.scale <= 3)
        CANAAN_UNDER.BIOMES.forEach(b => {
          const a = (b.angle * Math.PI) / 180,
            [sx, sy] = S(200 + Math.cos(a) * 80, 200 + Math.sin(a) * 80);
          label(c, b.name, sx, sy, 13, '#fff4d2');
        });
    } else {
      for (const p of PIXEL_PLACES) put(p.type === 'camp' ? 'refuge' : p.type, p.x, p.y, {}, p.name);
      // Entrées des Tréfonds.
      for (const e of CANAAN_UNDER.ENTRANCES) put('stairs', e.x, e.y, {}, e.name);
      if (!v.mini && v.scale >= 8)
        for (const b of houses)
          if (b.name && !b.place && !canaanRoomAt(b.x, b.y))
            label(c, b.name, ...S(b.x + b.w / 2, b.y - 0.3), 10, '#f6e2b1');
      for (const n of game.world.npcs)
        if (n.type === 'shop' && (v.mini || v.scale >= 6)) put('shop', n.x / TS, n.y / TS, {}, null);
      for (const b of WORLD_BOSSES) put('boss', b.x, b.y, {}, b.name);
      put('arena', CANAAN_ARENA_PORTAL.x, CANAAN_ARENA_PORTAL.y, {}, CANAAN_ARENA_NAME);
      instances.forEach((d, i) => {
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
      if (window.CANAAN_CITY_PLAN)
        put('city', CANAAN_CITY_PLAN.center.x, CANAAN_CITY_PLAN.center.y, {}, CANAAN_CITY_PLAN.name);
      for (const chest of CANAAN_RUBIS.revealedChests()) put('chest', chest.x, chest.y, {}, null);
      // Personnages des quêtes : « ! » quête à prendre, « ? » quête à rendre.
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
      // Monstres proches, sur la mini-carte seulement.
      if (v.mini)
        for (const m of game.world.monsters) {
          if (m.hp <= 0) continue;
          put(m.worldBoss ? 'bossmob' : 'mob', m.x / TS, m.y / TS, { elite: m.elite }, null);
        }
      // Objectif de la quête suivie ; sur la mini-carte, une flèche au bord s'il est plus loin.
      const tr = CANAAN_QUESTS.target(game.hero);
      if (tr) {
        const [sx, sy] = S(tr.x / TS, tr.y / TS);
        if (seen(sx, sy, -6)) icon(c, 'target', sx, sy, k);
        else if (v.mini) {
          const cx = v.w / 2,
            cy = v.h / 2,
            a = Math.atan2(sy - cy, sx - cx),
            r = v.w / 2 - 12;
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
    }
    // Noms des biomes sur la vue d'ensemble de l'île, par-dessus les repères.
    if (!game.world.instance && game.world.layer !== 'under' && !v.mini && v.scale <= 3)
      for (const z of ZONES) {
        const [sx, sy] = S(z.x, z.y);
        label(c, z.name, sx, sy, 13, '#fff4d2');
      }
    // Alliés du groupe, puis le héros.
    for (const h of game.heroes) {
      if (h === game.hero || h.away) continue;
      const at = put('ally', h.player.x / TS, h.player.y / TS, { color: h.color }, null);
      if (at && !v.mini) label(c, h.name || 'Allié', at[0], at[1] - 12, 10, '#bfe8ff');
    }
    const me = heroSpot(),
      [mx, my] = S(me.x, me.y);
    icon(c, 'me', mx, my, v.mini ? 1 : 1.15, { angle: facing });
  }

  // ---------------------------------------------------------------- Grande carte (M)
  function fitView() {
    if (game.world.instance) {
      ensureBase();
      const b = box || instanceBox(),
        span = Math.max(b.x1 - b.x0, b.y1 - b.y0);
      return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, scale: BIG / span };
    }
    return { cx: 200, cy: 200, scale: BIG / (game.world.layer === 'under' ? 330 : 360) };
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
    c.fillStyle = game.world.instance || game.world.layer === 'under' ? '#08080e' : '#1d5f96';
    c.fillRect(0, 0, BIG, BIG);
    c.imageSmoothingEnabled = v.scale < PX;
    c.drawImage(b, x0 * PX, y0 * PX, (BIG / v.scale) * PX, (BIG / v.scale) * PX, 0, 0, BIG, BIG);
    markers(c, { x0, y0, scale: v.scale, w: BIG, h: BIG, mini: false });
    // Échelle et zoom en bas à gauche.
    const zoom = document.getElementById('mapZoomLevel');
    if (zoom)
      zoom.textContent = view.fitted
        ? 'Vue d’ensemble'
        : '×' + Math.round((v.scale / fitView().scale) * 10) / 10;
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
  // À l'ouverture : image de fond à jour, vue d'ensemble de l'île ou de l'instance.
  function open() {
    ensureBase();
    view.place = null;
    view.fitted = true;
    view.follow = false;
    const el = document.getElementById('bigMap');
    attach(el);
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
    c.save();
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = game.world.instance || game.world.layer === 'under' ? '#08080e' : '#1d5f96';
    c.fillRect(0, 0, S, S);
    c.imageSmoothingEnabled = scale < PX;
    c.drawImage(b, x0 * PX, y0 * PX, span * PX, span * PX, 0, 0, S, S);
    markers(c, { x0, y0, scale, w: S, h: S, mini: true });
    // Ombre intérieure du verre.
    const g = c.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    c.restore();
    // Anneau de laiton et le nord.
    c.strokeStyle = '#22160e';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#c9a45a';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#22160e';
    c.beginPath();
    c.arc(S / 2, 10, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c9a45a';
    c.beginPath();
    c.arc(S / 2, 10, 6.5, 0, Math.PI * 2);
    c.fill();
    label(c, 'N', S / 2, 10.5, 9, '#22160e');
    // La grande carte ouverte suit aussi (héros, monstres, alliés).
    if (miniFrame % 6 === 0 && document.getElementById('bigMap')) drawBigMap();
  }
  // Molette sur la mini-carte : trois niveaux de zoom.
  const mini = document.getElementById('minimap');
  if (mini?.addEventListener)
    mini.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        miniStep = Math.max(0, Math.min(MINI.length - 1, miniStep + (e.deltaY < 0 ? 1 : -1)));
        miniFrame = 2;
        drawMinimap();
      },
      { passive: false }
    );

  window.CANAAN_MAP = Object.freeze({
    open,
    zoom: d => zoom(d),
    center,
    fit,
    view: () => ({ ...view, scale: currentView().scale }),
    miniZoom: () => MINI[miniStep],
    base: () => ensureBase(true)
  });
  Object.assign(window, { drawBigMap, drawMinimap });
})();
