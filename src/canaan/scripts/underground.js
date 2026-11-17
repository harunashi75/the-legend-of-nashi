// Les Tréfonds de Canaan : un monde souterrain sous toute l'île, aux mêmes coordonnées (une case des Tréfonds est
// juste sous la case de l'île). Quatre biomes en couronne autour de la Forteresse naine de Durgrim, creusée sous le
// massif central : les Galeries d'Argile (terre, rivières de boue, vieilles mines), la Cité Engloutie de
// Khaz-Ombral (bâtiments nains abandonnés), la Nécropole des Oubliés (cimetières, arbres morts, mausolées) et
// Fangeval, le Marais Fongique (boue, champignons géants, lacs troubles).
// Six entrées à la surface (une par biome de l'île) ; tout le groupe descend et remonte ensemble (touche E).
// Les créatures, élites et boss des Tréfonds ont le niveau du héros qui les croise ; quatre donjons sans niveau
// requis (world.js, scaled) donnent du Peu commun ou du Rare du niveau de chaque héros.
// La carte (game.world.underworld / underdecor) est générée de façon déterministe chez chacun, après l'île.
(() => {
  'use strict';
  const T = Object.freeze({
    FLOOR: 40,
    PATH: 41,
    MUD: 42,
    RIVER: 43,
    WALL: 44,
    STONE: 45,
    GRAVE: 46,
    MOSS: 47,
    LAKE: 48,
    CHASM: 49
  });
  const OPEN = t => t !== undefined && !SOLID.includes(t);
  const WET = new Set([T.RIVER, T.LAKE, T.CHASM]);
  const C = Object.freeze({ x: 200, y: 200 });
  const FORT_R = 15;
  const RAD = Math.PI / 180;
  const K = () => CANAAN_TILE_KIT;
  const R = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const polar = (deg, r) => ({
    x: Math.round(C.x + Math.cos(deg * RAD) * r),
    y: Math.round(C.y + Math.sin(deg * RAD) * r)
  });

  // ---------------------------------------------------------------- Les quatre biomes et la forteresse
  // floors : palette de chaque sol (paintFloor des donjons) ; wall : paroi ; th : objets des donjons réutilisés.
  const BIOMES = [
    {
      name: 'Galeries d’Argile',
      angle: 165,
      floor: T.FLOOR,
      desc: 'Galeries de terre battue, rivières de boue, racines et vieilles mines abandonnées par les nains.',
      floors: {
        [T.FLOOR]: { style: 'dirt', a: '#5e4632', b: '#3e2e20', c: '#84664a' },
        [T.PATH]: { style: 'gravel', a: '#6e5640', b: '#4e3c2a', c: '#8e7458' },
        [T.STONE]: { style: 'stone', a: '#5a5048', b: '#3e3630', c: '#786c60' }
      },
      wall: { style: 'rock', top: '#140e0a', face: '#4e3a2a', dark: '#2e2218', light: '#70543e' },
      mud: { a: '#4a3420', b: '#5e4428', c: '#7a5a36' },
      river: { a: '#24160a', b: '#4a2e14', c: '#b08850' },
      lake: { a: '#14262a', b: '#22404a', c: '#5a8a94' },
      amb: { dark: 0.66, tint: [22, 12, 4], particles: 'dust', color: '#e0c090' },
      map: '#6a5038',
      mapPath: '#8a7050',
      th: {
        pillar: ['#5e4430', '#3b2a1d', '#80614a'],
        flame: ['#e5822e', '#f9c640', '#fff6c5'],
        rune: '#e0a060',
        banner: ['#4a3420', '#e0a060']
      },
      wallProps: ['lantern', 'beam', 'roots', 'torch'],
      decor: [
        0.13,
        [
          'stalag',
          'stalag2',
          'k:rubble',
          'k:bones',
          'beam',
          'roots',
          'k:crate',
          'k:minecart',
          'k:ore',
          'stalag',
          'shrooms',
          'k:pickaxe',
          'lanternpost'
        ]
      ],
      structures: ['shack', 'shack', 'shack', 'minehead', 'minehead']
    },
    {
      name: 'Cité Engloutie de Khaz-Ombral',
      angle: 255,
      floor: T.STONE,
      desc: 'Une ancienne cité naine abandonnée : rues dallées, maisons effondrées, statues sans tête et lacs noirs.',
      floors: {
        [T.STONE]: { style: 'flagstone', a: '#4a5058', b: '#33383e', c: '#6a727c' },
        [T.FLOOR]: { style: 'gravel', a: '#44464a', b: '#2e3034', c: '#62656a' },
        [T.PATH]: { style: 'tiles', a: '#5a6068', b: '#40454c', c: '#7c848e' }
      },
      wall: { style: 'brick', top: '#0c1016', face: '#454c56', dark: '#2a3038', light: '#68707c' },
      mud: { a: '#2e343a', b: '#3e464e', c: '#5a646e' },
      river: { a: '#0e2a3a', b: '#1e4a60', c: '#6ab0d0' },
      lake: { a: '#0e2a3a', b: '#1e4a60', c: '#6ab0d0' },
      amb: { dark: 0.6, tint: [4, 12, 22], particles: 'motes', color: '#a8d8ff' },
      map: '#4e555e',
      mapPath: '#6e7680',
      th: {
        pillar: ['#5a626c', '#3a4048', '#7e8894'],
        flame: ['#3a8ad8', '#7ac8ff', '#e0f4ff'],
        rune: '#8ac8e8',
        banner: ['#1e3a5a', '#c9a24a']
      },
      wallProps: ['sconce', 'banner', 'chains', 'sconce'],
      decor: [
        0.12,
        [
          'brokenpillar',
          'k:rubble',
          'k:statue',
          'ruinwall',
          'k:rubble',
          'k:candles',
          'k:pillar',
          'k:crate',
          'k:bones',
          'stalag2'
        ]
      ],
      structures: [
        'ruinhouse',
        'ruinhouse',
        'ruinhouse',
        'ruinhouse',
        'ruinhouse',
        'ruinhouse',
        'ruintower',
        'ruintower'
      ]
    },
    {
      name: 'Nécropole des Oubliés',
      angle: 345,
      floor: T.GRAVE,
      desc: 'Cimetières sans fin, arbres morts, mausolées et brumes vertes où rôdent goules et âmes errantes.',
      floors: {
        [T.GRAVE]: { style: 'dirt', a: '#3a3c34', b: '#26281f', c: '#55584a' },
        [T.PATH]: { style: 'flagstone', a: '#4a4a46', b: '#33332f', c: '#66665e' },
        [T.STONE]: { style: 'flagstone', a: '#46463f', b: '#302f2a', c: '#62625a' },
        [T.FLOOR]: { style: 'gravel', a: '#3e3e38', b: '#2a2a24', c: '#58584e' }
      },
      wall: { style: 'brick', top: '#08090a', face: '#3a3c3a', dark: '#222422', light: '#5a5c58' },
      mud: { a: '#2a2c24', b: '#3a3c30', c: '#4e5244' },
      river: { a: '#1a2420', b: '#28362e', c: '#5a7a68' },
      lake: { a: '#101a16', b: '#1e2e26', c: '#5a8a70' },
      amb: { dark: 0.72, tint: [4, 14, 10], particles: 'mist', color: '#c0e8d0' },
      map: '#40443a',
      mapPath: '#5e5e56',
      th: {
        pillar: ['#4a4c48', '#2c2e2a', '#6c6e68'],
        flame: ['#3ad87a', '#8affb0', '#e0fff0'],
        rune: '#a8f0c0',
        banner: ['#1a2a22', '#a8f0c0']
      },
      wallProps: ['skulls', 'sconce', 'chains', 'skulls'],
      decor: [
        0.11,
        [
          'deadtree',
          'tomb',
          'grave',
          'cross',
          'k:bones',
          'k:bonepile',
          'candles2',
          'deadtree',
          'grave',
          'k:skullpile',
          'tomb'
        ]
      ],
      structures: ['mausoleum', 'mausoleum', 'mausoleum', 'crypt', 'crypt', 'crypt']
    },
    {
      name: 'Fangeval, le Marais Fongique',
      angle: 75,
      floor: T.MOSS,
      desc: 'Un marais de boue tiède sous la roche : champignons géants luisants, spores, lacs troubles et mille-pattes.',
      floors: {
        [T.MOSS]: { style: 'dirt', a: '#3e4a2e', b: '#2a3420', c: '#5e6e40' },
        [T.PATH]: { style: 'gravel', a: '#4a3a46', b: '#322630', c: '#6a5664' },
        [T.FLOOR]: { style: 'dirt', a: '#4a3e30', b: '#32281e', c: '#6a5a44' },
        [T.STONE]: { style: 'stone', a: '#4a4450', b: '#322e38', c: '#686070' }
      },
      wall: { style: 'rock', top: '#0c0a10', face: '#3e3446', dark: '#241e2a', light: '#5e5068' },
      mud: { a: '#3a4220', b: '#4e5a28', c: '#6e7a3a' },
      river: { a: '#161c08', b: '#34401a', c: '#a8b850' },
      lake: { a: '#1e2e1a', b: '#34502a', c: '#88b060' },
      amb: { dark: 0.64, tint: [16, 4, 20], particles: 'motes', color: '#ff9ae8' },
      map: '#465236',
      mapPath: '#665470',
      th: {
        pillar: ['#4e4258', '#302838', '#6e6080'],
        flame: ['#d84ac0', '#ff8ae8', '#ffe0f8'],
        rune: '#e870c0',
        banner: ['#3a1a34', '#e870c0']
      },
      wallProps: ['roots', 'lantern', 'roots', 'roots'],
      decor: [
        0.16,
        [
          'giantshroom',
          'shrooms',
          'shrooms',
          'mudreeds',
          'k:crystal',
          'giantshroom',
          'roots',
          'shrooms',
          'mudreeds',
          'k:bones'
        ]
      ],
      structures: ['mycohut', 'mycohut', 'mycohut', 'mycohut']
    }
  ];
  // La Forteresse de Durgrim (biome 4 de la carte des biomes) : dalles chaudes, braseros, nains.
  const FORT = {
    name: 'Forteresse de Durgrim',
    floors: {
      [T.STONE]: { style: 'flagstone', a: '#6a5a48', b: '#4a3e30', c: '#8a7660' },
      [T.PATH]: { style: 'tiles', a: '#7a6650', b: '#56473a', c: '#9a8468' },
      [T.FLOOR]: { style: 'flagstone', a: '#6a5a48', b: '#4a3e30', c: '#8a7660' }
    },
    wall: { style: 'brick', top: '#1a120c', face: '#5e4a36', dark: '#3a2e22', light: '#86705a' },
    amb: { dark: 0.4, tint: [30, 16, 4], particles: 'embers', color: '#ffd08a' },
    map: '#8a7660',
    mapPath: '#a8926e',
    th: {
      pillar: ['#7a6650', '#4e4030', '#a08a70'],
      flame: ['#e5522e', '#f9a640', '#fff1b5'],
      rune: '#ffc65a',
      banner: ['#7a1a14', '#ffd36d']
    },
    wallProps: ['torch', 'banner', 'torch', 'banner']
  };
  const themeOf = b => (b === 4 ? FORT : BIOMES[b] || BIOMES[0]);

  // Boss mondiaux des Tréfonds (un par biome), au niveau du groupe quand ils apparaissent.
  const BOSSES = [
    {
      id: 'u_gorgrath',
      name: 'Gorgrath, le Ver-Roi des Boues',
      biome: 0,
      look: 'horror',
      pal: ['#9a6a3a', '#5a3a1e', '#c8965a', '#ffd36d', '#ffef60'],
      opts: { heavy: true },
      color: '#c8904a'
    },
    {
      id: 'u_gardien',
      name: 'Le Gardien d’Argent de Khaz-Ombral',
      biome: 1,
      look: 'golem',
      pal: ['#b8c0cc', '#6a7480', '#e8eef4', '#8ac8e8', '#ffffff'],
      opts: { crown: true },
      color: '#8ac8e8'
    },
    {
      id: 'u_morvane',
      name: 'Morvane, la Reine-Liche',
      biome: 2,
      look: 'robed',
      pal: ['#3a3e4a', '#1e2028', '#6a7088', '#7affb0', '#d8fff0'],
      opts: { crown: true },
      color: '#7affb0'
    },
    {
      id: 'u_sporemere',
      name: 'Sporemère, la Myconide Ancestrale',
      biome: 3,
      look: 'golem',
      pal: ['#d04a7a', '#7a2048', '#f08ab0', '#f8e8c8', '#fff0a0'],
      opts: { leafy: true, crown: true },
      color: '#e870c0'
    }
  ];
  // Entrées : une par biome de l'île (ordre des ZONES), posées près de la route à la génération.
  const ENTRY_NAMES = [
    'Gouffre des Plaines',
    'Puits des Racines',
    'Grotte des Brumes',
    'Crevasse Rousse',
    'Escalier des Sables',
    'Faille Étoilée'
  ];
  const ENTRANCES = ENTRY_NAMES.map((name, i) => ({ id: i, name, x: 0, y: 0 }));
  const CHESTS = Array.from({ length: 16 }, (_, i) => ({ id: 'under_' + i, x: 0, y: 0, layer: 'under' }));

  // ---------------------------------------------------------------- Génération
  let BMAP = new Uint8Array(MAPW * MAPH);
  const bridges = new Map();
  const structures = [];
  const buckets = new Map();
  const lights = [];
  let nodes = [],
    spots = [],
    fauna = { ground: [], fliers: [] },
    dwarves = [],
    lairs = [],
    hubs = [];
  const tiles = () => game.world.underworld;
  const deco = () => game.world.underdecor;
  const at = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? T.WALL : tiles()[y][x]);
  const set = (x, y, t) => {
    if (x > 2 && y > 2 && x < MAPW - 3 && y < MAPH - 3) tiles()[y][x] = t;
  };
  const biomeAt = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? 0 : BMAP[(y | 0) * MAPW + (x | 0)]);
  function sectorOf(x, y) {
    const a = Math.atan2(y - C.y, x - C.x) / RAD + (field(x, y, 37, 791) - 0.5) * 40,
      rel = (((a - (BIOMES[0].angle - 45)) % 360) + 360) % 360;
    return Math.min(3, Math.floor(rel / 90));
  }
  const radius = (x, y) => {
    const a = Math.atan2(y - C.y, x - C.x);
    return 152 + 8 * Math.sin(3 * a + 0.7) + 5 * Math.cos(5 * a) + (field(x, y, 21, 792) - 0.5) * 12;
  };
  const floorOf = (x, y) => (biomeAt(x, y) === 4 ? T.STONE : BIOMES[biomeAt(x, y)].floor);
  // Couloir sinueux de a à b : creuse la roche ; sur l'eau ou un gouffre, un pont.
  function tunnel(a, b, width, road) {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 9)),
      pts = [[a.x, a.y]];
    for (let k = 1; k < n; k++) {
      const t = k / n,
        jx = (field(a.x * 3 + k, b.y, 3, 793) - 0.5) * 9,
        jy = (field(b.x, a.y * 3 + k, 3, 794) - 0.5) * 9;
      pts.push([a.x + (b.x - a.x) * t + jx, a.y + (b.y - a.y) * t + jy]);
    }
    pts.push([b.x, b.y]);
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1],
        [x1, y1] = pts[k],
        steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let s = 0; s <= steps; s++) {
        const fx = x0 + ((x1 - x0) * s) / steps,
          fy = y0 + ((y1 - y0) * s) / steps;
        for (let y = Math.floor(fy - width); y <= Math.ceil(fy + width); y++)
          for (let x = Math.floor(fx - width); x <= Math.ceil(fx + width); x++) {
            if (Math.hypot(x - fx, y - fy) > width) continue;
            const t = at(x, y);
            if (WET.has(t) || bridges.has(y * MAPW + x)) {
              if (!bridges.has(y * MAPW + x)) bridges.set(y * MAPW + x, t);
              set(x, y, T.PATH);
            } else if (road) set(x, y, T.PATH);
            else if (!OPEN(t)) set(x, y, floorOf(x, y));
            if (deco()[y]) deco()[y][x] = null;
          }
      }
    }
  }
  function clear(cx, cy, r, tile) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) > r + 0.3) continue;
        bridges.delete(y * MAPW + x);
        set(x, y, tile ?? floorOf(x, y));
        if (deco()[y]) deco()[y][x] = null;
      }
  }
  const hashU = (x, y, k) => hash(x, y, 900 + k);
  function addStructure(kind, tx, ty, biome) {
    const S = STRUCT[kind],
      s = { kind, tx, ty, biome, w: S.w, h: S.h, seed: tx * 7 + ty * 13 };
    // Emprise au sol (pixels) : le bas du bâtiment bloque ; on passe derrière le toit.
    s.box = [(tx - S.w / 2) * TS + 6, (ty - S.foot) * TS, (tx + S.w / 2) * TS - 6, (ty + 0.6) * TS];
    structures.push(s);
    for (let y = Math.floor(ty - S.h); y <= ty + 1; y++)
      for (let x = Math.floor(tx - S.w / 2 - 1); x <= Math.ceil(tx + S.w / 2 + 1); x++)
        if (deco()[y]) deco()[y][x] = null;
    const key = Math.floor(tx / 8) + ',' + Math.floor(ty / 8);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s);
    return s;
  }
  // Cases libres pour un bâtiment : sol praticable sur tout le rectangle, loin des lieux importants.
  function roomFor(tx, ty, w, h, keep) {
    for (let y = ty - h; y <= ty + 1; y++)
      for (let x = tx - Math.ceil(w / 2) - 1; x <= tx + Math.ceil(w / 2) + 1; x++)
        if (!OPEN(at(x, y)) || at(x, y) === T.PATH || at(x, y) === T.MUD) return false;
    return !keep.some(([x, y, r]) => Math.hypot(x - tx, y - ty) < r);
  }
  function build() {
    game.world.underworld = Array.from({ length: MAPH }, () => Array(MAPW).fill(T.WALL));
    game.world.underdecor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    BMAP = new Uint8Array(MAPW * MAPH);
    bridges.clear();
    structures.length = 0;
    lights.length = 0;
    buckets.clear();
    // 1. Biomes et cavernes : la roche est creusée là où le bruit dépasse un seuil propre au biome.
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const d = Math.hypot(x - C.x, y - C.y),
          b = d < FORT_R + 4 ? 4 : sectorOf(x, y);
        BMAP[y * MAPW + x] = b;
        if (d >= radius(x, y) || b === 4) continue;
        const n = 0.55 * field(x, y, 10, 801) + 0.3 * field(x, y, 4, 802) + 0.15 * field(x, y, 24, 803),
          th = [0.52, 0.47, 0.5, 0.49][b];
        let t = n > th ? BIOMES[b].floor : T.WALL;
        if (t !== T.WALL) {
          if (b === 1 && field(x, y, 7, 880) > 0.62) t = T.FLOOR;
          if (b === 3 && field(x, y, 6, 850) > 0.6) t = T.MUD;
          if (b === 0 && field(x, y, 6, 851) > 0.76) t = T.MUD;
          if (
            (b === 1 && field(x, y, 15, 861) > 0.75) ||
            (b === 3 && field(x, y, 16, 863) > 0.69) ||
            (b === 0 && field(x, y, 17, 860) > 0.77) ||
            (b === 2 && field(x, y, 14, 862) > 0.83)
          )
            t = T.LAKE;
          if ((b === 2 && field(x, y, 12, 870) > 0.82) || (b === 1 && field(x, y, 13, 871) > 0.87))
            t = T.CHASM;
        }
        // Rivières de boue des Galeries et de Fangeval : un ruban qui traverse tout, ses berges creusées.
        if (b === 0 || b === 3) {
          const band = Math.abs(field(x, y, 34, 840 + b) - 0.5);
          if (band < 0.021) t = T.RIVER;
          else if (band < 0.05 && t === T.WALL) t = BIOMES[b].floor;
        }
        tiles()[y][x] = t;
      }
    // 2. Forteresse de Durgrim : place dallée, rempart circulaire et quatre portes vers les biomes.
    for (let y = C.y - FORT_R - 4; y <= C.y + FORT_R + 4; y++)
      for (let x = C.x - FORT_R - 4; x <= C.x + FORT_R + 4; x++) {
        const d = Math.hypot(x - C.x, y - C.y);
        if (d < FORT_R + 0.5) set(x, y, T.STONE);
        else if (d < FORT_R + 2.6) {
          const a = (((Math.atan2(y - C.y, x - C.x) / RAD) % 360) + 360) % 360,
            gate = BIOMES.some(b => Math.abs(((a - b.angle + 540) % 360) - 180) < 8);
          set(x, y, gate ? T.PATH : T.WALL);
        }
      }
    // 3. Lieux : centre de chaque biome, portail de son donjon, repaire de son boss.
    hubs = BIOMES.map(b => polar(b.angle, 80));
    lairs = BOSSES.map(b => ({ ...polar(BIOMES[b.biome].angle - 26, 124), boss: b }));
    const portals = instances.map((d, i) => ({ d, i })).filter(v => v.d.under);
    portals.forEach(({ d }, k) => {
      const p = polar(BIOMES[k].angle + 24, 112);
      d.x = p.x;
      d.y = p.y;
    });
    // 4. Routes : des portes de la forteresse aux centres des biomes, puis vers portails et repaires.
    BIOMES.forEach((b, k) => {
      const gate = polar(b.angle, FORT_R + 3);
      tunnel(polar(b.angle, FORT_R - 2), gate, 1.2, true);
      tunnel(gate, hubs[k], 1.4, true);
      tunnel(hubs[k], portals[k].d, 1.2, true);
      tunnel(hubs[k], lairs[k], 1.6, false);
      // Un passage entre biomes voisins, à mi-chemin.
      tunnel(hubs[k], polar(b.angle + 45, 98), 1.3, false);
      tunnel(polar(b.angle + 45, 98), hubs[(k + 1) % 4], 1.3, false);
    });
    // 5. Entrées depuis l'île : même case qu'à la surface, reliée au réseau le plus proche.
    placeEntrances();
    for (const e of ENTRANCES) {
      clear(e.x, e.y, 3);
      const near = [...hubs, ...BIOMES.map(b => polar(b.angle + 45, 98))].sort(
        (a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)
      )[0];
      tunnel(e, near, 1.4, false);
    }
    for (const { d } of portals) clear(d.x, d.y, 3.2, T.STONE);
    for (const l of lairs) clear(l.x, l.y, 7.5);
    for (const h of hubs) clear(h.x, h.y, 4);
    // 6. Seules les cases accessibles depuis la forteresse restent ouvertes.
    const seen = new Uint8Array(MAPW * MAPH),
      queue = [C.y * MAPW + C.x];
    seen[queue[0]] = 1;
    for (let h = 0; h < queue.length; h++) {
      const k = queue[h],
        x = k % MAPW,
        y = (k - x) / MAPW;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nk = (y + dy) * MAPW + x + dx;
        if (!seen[nk] && OPEN(at(x + dx, y + dy))) {
          seen[nk] = 1;
          queue.push(nk);
        }
      }
    }
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const t = tiles()[y][x];
        if (OPEN(t) && !seen[y * MAPW + x]) tiles()[y][x] = T.WALL;
        // Eau et gouffres isolés dans la roche : de la roche.
        if (
          WET.has(t) &&
          ![
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([dx, dy]) => seen[(y + dy) * MAPW + x + dx])
        )
          tiles()[y][x] = T.WALL;
      }
    // 7. Bâtiments, cimetières, décor, lumières, gisements, bancs de poissons, faune et coffres.
    const keep = [
      [C.x, C.y, FORT_R + 6],
      ...ENTRANCES.map(e => [e.x, e.y, 6]),
      ...portals.map(({ d }) => [d.x, d.y, 6]),
      ...lairs.map(l => [l.x, l.y, 9]),
      ...hubs.map(h => [h.x, h.y, 5])
    ];
    fortress();
    placeStructures(keep);
    cemeteries(keep);
    decorate(keep);
    placeChests(keep);
    findNodes(keep);
    findSpots();
    placeFauna(keep);
    placeDwarves();
    for (const { d, i } of portals) {
      const npc = game.world.npcs.find(n => n.type === 'portal' && n.instance === i);
      if (npc) Object.assign(npc, { x: d.x * TS, y: d.y * TS, layer: 'under' });
    }
    // Pièces des bâtiments de la forteresse (house.js), creusées dans la roche du nord de la carte.
    if (window.CANAAN_HOUSE) CANAAN_HOUSE.stampUnder();
  }
  // Entrées à la surface : terre ferme accessible depuis le camp, près de la route, loin des autres lieux.
  function placeEntrances() {
    const W2 = CANAAN_WORLD_TOOLS,
      camp = villages[0],
      surface = game.world.tiles;
    game.world.tiles = game.world.overworld;
    try {
      const reach = W2.reachableFrom(camp.x, camp.y),
        taken = W2.taken(),
        ok = (x, y) =>
          W2.walkableLand(x, y) &&
          reach[y * MAPW + x] === 1 &&
          !isSafe(x, y) &&
          !canaanRoomAt(x, y) &&
          canaanQuestWalk((x + 0.5) * TS, (y + 0.5) * TS) === null &&
          game.world.overworld[y][x] !== 2 &&
          !taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 7) &&
          !game.world.npcs.some(n => Math.hypot(n.x / TS - x, n.y / TS - y) < 6);
      ENTRANCES.forEach((e, i) => {
        const target = W2.polar(ZONES[i].angle + 14, 100),
          spot = W2.nearestSpot(target.x, target.y, i, ok);
        e.x = spot.x;
        e.y = spot.y;
        taken.push([e.x, e.y]);
        W2.clearArea(e.x, e.y, 2);
      });
    } finally {
      game.world.tiles = surface;
    }
    // Les entrées sont des PNJ d'interaction (touche E) : descendre à la surface, remonter dans les Tréfonds.
    for (let i = game.world.npcs.length - 1; i >= 0; i--)
      if (game.world.npcs[i].type === 'descend' || game.world.npcs[i].type === 'ascend')
        game.world.npcs.splice(i, 1);
    for (const e of ENTRANCES) {
      game.world.npcs.push({
        x: (e.x + 0.5) * TS,
        y: (e.y + 0.5) * TS,
        name: e.name,
        type: 'descend',
        entrance: e.id
      });
      game.world.npcs.push({
        x: (e.x + 0.5) * TS,
        y: (e.y + 0.5) * TS,
        name: e.name,
        type: 'ascend',
        entrance: e.id,
        layer: 'under'
      });
    }
  }
  // Bâtiments de la forteresse (positions relatives au centre, en cases).
  const FORT_PLAN = [
    { kind: 'dwarfhall', dx: 0, dy: -8 },
    { kind: 'forge', dx: -9, dy: -2 },
    { kind: 'tavern', dx: 9, dy: -2 },
    { kind: 'vault', dx: -7, dy: 8 },
    { kind: 'stall', dx: 7, dy: 8 },
    { kind: 'dwarfhouse', dx: -12, dy: 4 },
    { kind: 'dwarfhouse', dx: 12, dy: 4 },
    { kind: 'kingstatue', dx: 0, dy: 1 }
  ];
  function fortress() {
    for (const f of FORT_PLAN) addStructure(f.kind, C.x + f.dx, C.y + f.dy, 4);
    for (const [dx, dy] of [
      [-3, 1],
      [3, 1],
      [-4, -5],
      [4, -5],
      [-3, 11],
      [3, 11]
    ])
      deco()[C.y + dy][C.x + dx] = 'k:brazier';
    // Torches et bannières sur le rempart (faces tournées vers la place).
    for (let y = C.y - FORT_R - 3; y <= C.y + FORT_R + 3; y++)
      for (let x = C.x - FORT_R - 3; x <= C.x + FORT_R + 3; x++)
        if (
          at(x, y) === T.WALL &&
          OPEN(at(x, y + 1)) &&
          Math.hypot(x - C.x, y - C.y) < FORT_R + 3 &&
          hashU(x, y, 1) < 0.35
        )
          deco()[y][x] = 'w:' + FORT.wallProps[Math.floor(hashU(x, y, 2) * 4)];
  }
  function placeStructures(keep) {
    BIOMES.forEach((b, bi) => {
      let placed = 0;
      for (let tries = 0; tries < 1400 && placed < b.structures.length; tries++) {
        const a = b.angle - 40 + hashU(tries, bi, 3) * 80,
          r = 40 + hashU(bi, tries, 4) * 100,
          p = polar(a, r),
          kind = b.structures[placed],
          S = STRUCT[kind];
        if (
          biomeAt(p.x, p.y) !== bi ||
          !roomFor(p.x, p.y, S.w, S.h, keep) ||
          structures.some(s => Math.hypot(s.tx - p.x, s.ty - p.y) < 9)
        )
          continue;
        addStructure(kind, p.x, p.y, bi);
        keep.push([p.x, p.y, 4]);
        placed++;
      }
    });
  }
  // Nécropole : carrés de tombes alignées, avec une grille de fer sur le haut.
  function cemeteries(keep) {
    let made = 0;
    for (let tries = 0; tries < 900 && made < 7; tries++) {
      const p = polar(BIOMES[2].angle - 40 + hashU(tries, 5, 5) * 80, 45 + hashU(5, tries, 6) * 95);
      if (biomeAt(p.x, p.y) !== 2 || !roomFor(p.x, p.y, 9, 6, keep)) continue;
      for (let y = p.y - 5; y <= p.y + 1; y++)
        for (let x = p.x - 5; x <= p.x + 5; x++)
          if (OPEN(at(x, y)) && at(x, y) !== T.PATH) set(x, y, T.GRAVE);
      for (let x = p.x - 5; x <= p.x + 5; x++)
        if (OPEN(at(x, p.y - 5))) deco()[p.y - 5][x] = x === p.x ? null : 'fence';
      for (let y = p.y - 3; y <= p.y + 1; y += 2)
        for (let x = p.x - 4; x <= p.x + 4; x += 2)
          if (OPEN(at(x, y)))
            deco()[y][x] = hashU(x, y, 7) < 0.6 ? 'tomb' : hashU(x, y, 8) < 0.5 ? 'cross' : 'grave';
      deco()[p.y - 4][p.x - 5] = 'deadtree';
      keep.push([p.x, p.y - 2, 6]);
      made++;
    }
  }
  const SOLID_DECOR = new Set([
    'stalag',
    'deadtree',
    'tomb',
    'cross',
    'fence',
    'giantshroom',
    'ruinwall',
    'brokenpillar',
    'lanternpost',
    'k:statue',
    'k:pillar',
    'k:brazier',
    'k:minecart',
    'k:anvil',
    'k:cage'
  ]);
  function decorate(keep) {
    for (let y = 4; y < MAPH - 4; y++)
      for (let x = 4; x < MAPW - 4; x++) {
        const t = at(x, y),
          b = biomeAt(x, y);
        if (b === 4) continue;
        // Objets sur les parois (lanternes, appliques, crânes, racines), côté sol.
        if (t === T.WALL) {
          if (OPEN(at(x, y + 1)) && at(x, y + 1) !== T.PATH && hashU(x, y, 9) < 0.07)
            deco()[y][x] = 'w:' + BIOMES[b].wallProps[Math.floor(hashU(x, y, 10) * 4)];
          continue;
        }
        if (
          !OPEN(t) ||
          t === T.PATH ||
          deco()[y][x] ||
          keep.some(([kx, ky, r]) => Math.hypot(kx - x, ky - y) < r)
        )
          continue;
        const [density, list] = BIOMES[b].decor;
        if (hashU(x, y, 11) > density) continue;
        let d = list[Math.floor(hashU(x, y, 12) * list.length)];
        // Un objet qui bloque ne se pose ni au bord d'un chemin ni dans un passage étroit.
        const around = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1]
        ];
        if (
          SOLID_DECOR.has(d) &&
          (around.filter(([dx, dy]) => OPEN(at(x + dx, y + dy))).length < 8 ||
            around.some(([dx, dy]) => at(x + dx, y + dy) === T.PATH))
        )
          d = b === 3 ? 'shrooms' : b === 2 ? 'grave' : 'stalag2';
        if (t === T.MUD) d = b === 3 ? (hashU(x, y, 13) < 0.5 ? 'mudreeds' : null) : null;
        deco()[y][x] = d;
      }
    // Lumières fixes : lanternes, braseros, champignons et cristaux (dessinées avec leur objet).
  }
  function placeChests(keep) {
    let k = 0;
    BIOMES.forEach((b, bi) => {
      for (let n = 0, tries = 0; n < 4 && tries < 600; tries++) {
        const p = polar(b.angle - 42 + hashU(tries, bi, 14) * 84, 40 + hashU(bi, tries, 15) * 105);
        if (
          biomeAt(p.x, p.y) !== bi ||
          !OPEN(at(p.x, p.y)) ||
          at(p.x, p.y) === T.PATH ||
          at(p.x, p.y) === T.MUD ||
          deco()[p.y][p.x]
        )
          continue;
        if (
          keep.some(([x, y, r]) => Math.hypot(x - p.x, y - p.y) < r) ||
          CHESTS.some(c => c.x && Math.hypot(c.x - p.x, c.y - p.y) < 12)
        )
          continue;
        Object.assign(CHESTS[k++], { x: p.x, y: p.y });
        n++;
      }
    });
  }
  // Gisements : le minerai de chaque biome (souvent) ou un métal de l'île ; une herbe propre à chaque biome.
  const ORE_OF = ['fer_noir', 'quartz', 'obsidienne', 'geode'],
    METAL_OF = ['fer', 'argent', 'or', 'mithril'],
    HERB_OF = ['racine', 'lichen', 'pavot', 'champignon'];
  function findNodes(keep) {
    nodes = [];
    for (let ty = 5; ty < MAPH - 5; ty += 3)
      for (let tx = 5; tx < MAPW - 5; tx += 3) {
        const t = at(tx, ty),
          b = biomeAt(tx, ty);
        if (
          b === 4 ||
          !OPEN(t) ||
          t === T.PATH ||
          t === T.MUD ||
          bridges.has(ty * MAPW + tx) ||
          deco()[ty][tx]
        )
          continue;
        if (keep.some(([x, y, r]) => Math.hypot(x - tx, y - ty) < r) || structureAt(tx, ty, 2)) continue;
        const rocky = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([dx, dy]) => at(tx + dx, ty + dy) === T.WALL),
          roll = hashU(tx, ty, 16);
        let kind = null;
        if (roll < (rocky ? 0.24 : 0.04)) kind = 'ore';
        else if (roll > 0.955) kind = 'herb';
        if (!kind || nodes.some(n => Math.hypot(n.tx - tx, n.ty - ty) < (kind === 'ore' ? 6 : 5))) continue;
        const id = kind === 'herb' ? HERB_OF[b] : hashU(tx, ty, 17) < 0.68 ? ORE_OF[b] : METAL_OF[b];
        nodes.push({ tx, ty, x: (tx + 0.5) * TS, y: (ty + 0.5) * TS, kind, id, zone: 6 + b, layer: 'under' });
      }
  }
  // Bancs de poissons des lacs souterrains, au bord d'une rive praticable.
  const FISH_TABLES = [
    [
      ['aveugle', 60],
      ['carpe', 25],
      ['anguille', 15]
    ],
    [
      ['lanterne', 40],
      ['murene', 30],
      ['aveugle', 30]
    ],
    [
      ['aveugle', 50],
      ['murene', 50]
    ],
    [
      ['fangeux', 50],
      ['murene', 25],
      ['lanterne', 25]
    ]
  ];
  function findSpots() {
    spots = [];
    for (let ty = 4; ty < MAPH - 4; ty += 2)
      for (let tx = 4; tx < MAPW - 4; tx += 2) {
        if (at(tx, ty) !== T.LAKE || hashU(tx, ty, 18) > 0.55) continue;
        const shore = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1]
        ].some(([dx, dy]) => OPEN(at(tx + dx, ty + dy)));
        if (!shore || spots.some(s => Math.hypot(s.tx - tx, s.ty - ty) < 6)) continue;
        const b = biomeAt(tx, ty) % 4;
        spots.push({
          tx,
          ty,
          x: (tx + 0.5) * TS,
          y: (ty + 0.5) * TS,
          kind: 'lake',
          zone: 6 + b,
          table: FISH_TABLES[b],
          layer: 'under'
        });
      }
  }
  // Faune : animaux chassables (taupes, salamandres, crapauds) et insectes (lucioles, chauves-souris, spores…).
  const FAUNA = [
    {
      ground: [['taupe', 26]],
      fliers: [
        ['luciole', 26],
        ['chauve', 18]
      ]
    },
    {
      ground: [
        ['salamandre', 22],
        ['taupe', 6]
      ],
      fliers: [
        ['luciole', 18],
        ['chauve', 14]
      ]
    },
    {
      ground: [['salamandre', 12]],
      fliers: [
        ['mouche', 30],
        ['chauve', 22]
      ]
    },
    {
      ground: [
        ['crapaud', 34],
        ['taupe', 10]
      ],
      fliers: [
        ['spore', 54],
        ['papillon', 18, true]
      ]
    }
  ];
  function placeFauna(keep) {
    fauna = { ground: [], fliers: [] };
    BIOMES.forEach((b, bi) => {
      const spot = (wet, salt) => {
        for (let tries = 0; tries < 300; tries++) {
          const p = polar(b.angle - 44 + hashU(tries, salt, 19) * 88, 30 + hashU(salt, tries, 20) * 118);
          if (
            biomeAt(p.x, p.y) !== bi ||
            !OPEN(at(p.x, p.y)) ||
            keep.some(([x, y, r]) => Math.hypot(x - p.x, y - p.y) < r * 0.6)
          )
            continue;
          if (
            wet &&
            ![
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1]
            ].some(([dx, dy]) => at(p.x + dx, p.y + dy) === T.MUD || at(p.x + dx, p.y + dy) === T.LAKE) &&
            tries < 200
          )
            continue;
          return { x: (p.x + 0.5) * TS, y: (p.y + 0.5) * TS };
        }
        return null;
      };
      let salt = bi * 1000;
      for (const [kind, count] of FAUNA[bi].ground)
        for (let k = 0; k < count; k++) {
          const p = spot(kind === 'crapaud', salt++);
          if (p) fauna.ground.push({ kind, ...p, layer: 'under' });
        }
      for (const [kind, count, glow] of FAUNA[bi].fliers)
        for (let k = 0; k < count; k++) {
          const p = spot(false, salt++);
          if (p)
            fauna.fliers.push({
              kind,
              ...p,
              glow: !!glow || kind === 'luciole' || kind === 'spore',
              seed: hashU(k, salt, 21) * 1000,
              layer: 'under'
            });
        }
    });
  }
  function structureAt(tx, ty, margin = 0) {
    for (let by = Math.floor(ty / 8) - 1; by <= Math.floor(ty / 8) + 1; by++)
      for (let bx = Math.floor(tx / 8) - 1; bx <= Math.floor(tx / 8) + 1; bx++)
        for (const s of buckets.get(bx + ',' + by) || [])
          if (Math.abs(s.tx - tx) <= s.w / 2 + margin && ty >= s.ty - s.h - margin && ty <= s.ty + 1 + margin)
            return s;
    return null;
  }

  // ---------------------------------------------------------------- Nains des cavernes
  // look : barbe, casque, tunique, peau ; tool : outil tenu.
  const DWARF_PLAN = [
    {
      name: 'Roi Thrain Barbe-de-Fer',
      dx: 0,
      dy: -5,
      role: 'roi',
      beard: '#e8e0d0',
      helm: '#e0b030',
      tunic: '#7a1a20',
      tool: 'none',
      crown: true,
      lines: [
        'Bienvenue à Durgrim, voyageur de la surface. Mon peuple garde ces profondeurs depuis mille ans.',
        'Khaz-Ombral était notre plus belle cité… jusqu’à ce que la pierre se réveille. Ne t’y aventure pas sans arme.',
        'Morvane, la Reine-Liche, règne sur la Nécropole. Les nôtres qui y sont tombés ne reposent plus en paix.',
        'Quatre donjons se cachent dans les Tréfonds. Ils s’adaptent à la force de qui y entre : aucun n’est trop tôt pour toi.'
      ]
    },
    {
      name: 'Hilda Fonte-Rune',
      dx: -9,
      dy: 1,
      role: 'forgeronne',
      beard: '#c8642a',
      helm: '#6a4a2a',
      tunic: '#4a3a2a',
      tool: 'hammer',
      fem: true,
      lines: [
        'Ma forge vaut bien celle du Camp de l’Aurore : fabrique tes enchantements ici (panneau P, onglet Enchantement).',
        'Le fer noir des Galeries chante sous le marteau. Les marchands le paient très cher.',
        'Un bon nain ne sort jamais sans sa pioche. Toi, tu sors sans ? Étrange peuple, celui de la surface.'
      ]
    },
    {
      name: 'Dorn le Tavernier',
      dx: 9,
      dy: 1,
      role: 'tavernier',
      beard: '#4a2e1e',
      helm: '#8a8e96',
      tunic: '#5a3a1e',
      tool: 'mug',
      lines: [
        'L’âtre de ma taverne est toujours chaud : cuisine tes prises ici, comme à La Marmite dorée.',
        'Le poisson aveugle des lacs noirs ? Délicieux en papillote. Fais-moi confiance.',
        'Une chope de bière de champignon ? Non ? Tant pis pour toi.'
      ]
    },
    {
      name: 'Borin le Marchand',
      dx: 7,
      dy: 10,
      role: 'marchand',
      beard: '#d8a040',
      helm: '#8a8e96',
      tunic: '#2a4a6a',
      tool: 'none',
      type: 'shop',
      lines: []
    },
    {
      name: 'Gimra la Banquière',
      dx: -7,
      dy: 10,
      role: 'banquière',
      beard: '#8a8a8a',
      helm: '#c09030',
      tunic: '#3a2a5a',
      tool: 'none',
      type: 'bank',
      fem: true,
      lines: []
    },
    {
      name: 'Garde Balin',
      dx: -2,
      dy: FORT_R - 1,
      role: 'garde',
      beard: '#7a4a2a',
      helm: '#8a8e96',
      tunic: '#5a2a2a',
      tool: 'axe',
      lines: [
        'Halte ! Ah, un ami de la surface. Passe, mais garde ta lanterne allumée.',
        'Au sud, la Nécropole. Au nord, Khaz-Ombral. Ne confonds pas, l’un est plus sinistre que l’autre.'
      ]
    },
    {
      name: 'Garde Dwalin',
      dx: 2,
      dy: -FORT_R + 2,
      role: 'garde',
      beard: '#2a1f1a',
      helm: '#8a8e96',
      tunic: '#5a2a2a',
      tool: 'axe',
      lines: [
        'Les gargouilles de Khaz-Ombral ne dorment jamais. Moi non plus, d’ailleurs.',
        'Un ver gros comme une maison creuse les Galeries d’Argile. Gorgrath, qu’on l’appelle.'
      ]
    },
    {
      name: 'Mineur Gloin',
      dx: -4,
      dy: 5,
      role: 'mineur',
      beard: '#a8442a',
      helm: '#c8a040',
      tunic: '#4a4a3a',
      tool: 'pick',
      roam: 3,
      lines: [
        'Il y a de l’obsidienne dans la Nécropole… si tu oses creuser entre les tombes.',
        'Les géodes de Fangeval brillent comme des étoiles. Elles valent une fortune !'
      ]
    },
    {
      name: 'Ancienne Brunhild',
      dx: 4,
      dy: 5,
      role: 'ancienne',
      beard: '#e8e8e0',
      helm: '#5a3a5a',
      tunic: '#3a2e3a',
      tool: 'staff',
      fem: true,
      roam: 2,
      lines: [
        'Ma grand-mère disait que l’île de là-haut repose sur le dos des Tréfonds.',
        'Écoute les âmes errantes : elles pleurent les noms qu’on a oubliés.'
      ]
    },
    {
      name: 'Petit Fili',
      dx: 2,
      dy: 3,
      role: 'enfant',
      beard: null,
      helm: '#3a6a8a',
      tunic: '#6a8a3a',
      tool: 'none',
      scale: 0.8,
      roam: 4,
      lines: [
        'Tu viens vraiment de là-haut ? C’est vrai que le plafond est bleu ?',
        'Un jour, j’irai voir le soleil. Il paraît qu’il brûle les yeux !'
      ]
    }
  ];
  // Habitants des bâtiments de Durgrim : room (pièce), lx/ly (cases dans la pièce).
  const DWARF_HOMES = [
    {
      room: 'dur_hall',
      lx: 6.5,
      ly: 3.6,
      name: 'Conseillère Dagny',
      role: 'conseillère',
      beard: '#d8a040',
      helm: '#c09030',
      tunic: '#3a2a5a',
      tool: 'staff',
      fem: true,
      lines: [
        'Le Roi tient conseil sur la place, mais c’est ici que se décide l’avenir de Durgrim.',
        'Ces piliers portent les noms des vingt rois. Le vingt-et-unième attend encore le sien.'
      ]
    },
    {
      room: 'dur_hall',
      lx: 10.5,
      ly: 3.6,
      name: 'Garde royal Hrolf',
      role: 'garde',
      beard: '#4a2e1e',
      helm: '#e0b030',
      tunic: '#7a1a20',
      tool: 'axe',
      lines: ['Personne ne s’assied sur le trône de pierre. Personne.']
    },
    {
      room: 'dur_forge',
      lx: 5.5,
      ly: 4.6,
      name: 'Sigrun la Forgeronne',
      role: 'forgeronne',
      beard: '#e8a040',
      helm: '#5a5e66',
      tunic: '#5a3a2a',
      tool: 'hammer',
      fem: true,
      lines: [
        'Le fer se plie à qui sait l’écouter. Le reste n’est que du bruit.',
        'Hilda t’enchantera tes armes dehors, à la grande forge. Ici, on forge les haches de la garde.'
      ]
    },
    {
      room: 'dur_forge',
      lx: 9.5,
      ly: 4.6,
      name: 'Apprenti Kili',
      role: 'apprenti',
      beard: '#a8442a',
      helm: '#6a4a2a',
      tunic: '#4a4a3a',
      tool: 'hammer',
      lines: ['Trois cents coups de marteau par lame. J’en suis à deux cent douze… je crois.']
    },
    {
      room: 'dur_taverne',
      lx: 5.5,
      ly: 2.6,
      name: 'Helga la Brasseuse',
      role: 'brasseuse',
      beard: '#f0c060',
      helm: '#8a5a2a',
      tunic: '#2a5a3a',
      tool: 'mug',
      fem: true,
      lines: [
        'Bière de champignon, hydromel de mousse ou eau de roche ? Choisis bien, la surface.',
        'Dorn dit que c’est sa taverne. Moi, je dis que c’est ma bière.'
      ]
    },
    {
      room: 'dur_taverne',
      lx: 3.4,
      ly: 5.4,
      name: 'Oin le Buveur',
      role: 'buveur',
      beard: '#c8642a',
      helm: '#8a8e96',
      tunic: '#5a3a1e',
      tool: 'mug',
      lines: ['Hic ! Les gargouilles… elles m’ont souri. Je le jure sur ma barbe.']
    },
    {
      room: 'dur_taverne',
      lx: 10.4,
      ly: 5.4,
      name: 'Frida Chope-Pleine',
      role: 'buveuse',
      beard: '#4a2e1e',
      helm: '#6a4a2a',
      tunic: '#6a2a3a',
      tool: 'mug',
      fem: true,
      lines: ['Une naine qui boit plus que Oin ? C’est moi. Et je chante mieux, aussi.']
    },
    {
      room: 'dur_coffre',
      lx: 5.5,
      ly: 6.2,
      name: 'Gardien Thror',
      role: 'garde',
      beard: '#8a8a8a',
      helm: '#c09030',
      tunic: '#2a2a3a',
      tool: 'axe',
      lines: ['L’or de Durgrim dort ici. Gimra compte, moi je garde. Chacun son métier.']
    },
    {
      room: 'dur_maison1',
      lx: 7.5,
      ly: 4.4,
      name: 'Ylva Pied-de-Roc',
      role: 'mère',
      beard: '#c8642a',
      helm: '#5a3a5a',
      tunic: '#4a6a3a',
      tool: 'none',
      fem: true,
      lines: [
        'Essuie tes bottes, voyageur ! La boue des Galeries, ça ne part jamais.',
        'Mon mari est mineur. Il rentre quand la lanterne s’éteint.'
      ]
    },
    {
      room: 'dur_maison1',
      lx: 3.5,
      ly: 6.4,
      name: 'Petite Asa',
      role: 'enfant',
      beard: null,
      helm: '#8a3a5a',
      tunic: '#c8784a',
      tool: 'none',
      scale: 0.8,
      fem: true,
      lines: ['Quand je serai grande, j’aurai les plus longues tresses de Durgrim !']
    },
    {
      room: 'dur_maison2',
      lx: 7.5,
      ly: 4.6,
      name: 'Bombur Marteau-d’Or',
      role: 'père',
      beard: '#e0b040',
      helm: '#8a8e96',
      tunic: '#2a4a6a',
      tool: 'none',
      lines: ['Ma famille forge des marteaux depuis six générations. Le mien est accroché là-haut.']
    },
    {
      room: 'dur_maison2',
      lx: 2.5,
      ly: 5.4,
      name: 'Grand-mère Astrid',
      role: 'ancienne',
      beard: '#e8e8e0',
      helm: '#5a3a5a',
      tunic: '#3a2e3a',
      tool: 'staff',
      fem: true,
      lines: [
        'Assieds-toi, petit. Je vais te raconter la Grande Chute de Khaz-Ombral.',
        'Les tresses d’une naine racontent sa vie : une par victoire, une par deuil.'
      ]
    }
  ];
  // Éclaireurs postés au centre de chaque biome.
  const SCOUTS = [
    [
      'Éclaireur Nori',
      [
        'Les Galeries d’Argile : terre, boue et vieilles mines. Attention aux taupes-garous.',
        'La Mine Effondrée de Durgrim est au bout de la route. Grumbar y hante encore ses galeries.'
      ]
    ],
    [
      'Éclaireuse Dísa',
      [
        'Khaz-Ombral, notre cité perdue. Les sentinelles de pierre gardent encore ses rues.',
        'Les Halls Engloutis abritent le Roi Ombral. Il ne reconnaît plus les siens.'
      ]
    ],
    [
      'Éclaireur Óin',
      [
        'La Nécropole des Oubliés… Restez sur les dalles, les tombes ont faim.',
        'La Crypte des Mille Tombes : le Fossoyeur Éternel y creuse sans fin.'
      ]
    ],
    [
      'Éclaireuse Thyra',
      [
        'Fangeval : la boue est tiède et les champignons brillent. Les spores, elles, piquent.',
        'Les Tréfonds Fongiques cachent la Reine des Spores. Brûle-la, si tu peux.'
      ]
    ]
  ];
  function placeDwarves() {
    for (let i = game.world.npcs.length - 1; i >= 0; i--)
      if (game.world.npcs[i].dwarf) game.world.npcs.splice(i, 1);
    dwarves = [];
    const add = (d, x, y) => {
      const v = {
        ...d,
        x,
        y,
        hx: x,
        hy: y,
        tx: x,
        ty: y,
        step: 0,
        face: 1,
        wait: Math.floor(hashU(x, y, 22) * 200),
        bubble: null,
        line: 0,
        skin: ['#f0c7a0', '#e8b48a', '#c98e62'][Math.floor(hashU(x, y, 23) * 3)]
      };
      dwarves.push(v);
      game.world.npcs.push({
        x,
        y,
        name: d.name,
        type: d.type || 'dwarf',
        layer: 'under',
        dwarf: v,
        village: FORT.name
      });
    };
    for (const d of DWARF_PLAN) add(d, (C.x + d.dx + 0.5) * TS, (C.y + d.dy + 0.5) * TS);
    // Nains qui vivent dans les bâtiments de la forteresse (pièces de house.js, cases de la pièce).
    for (const d of DWARF_HOMES) {
      const room = typeof CANAAN_ROOMS !== 'undefined' && CANAAN_ROOMS.find(r => r.id === d.room);
      if (room) add(d, (room.x + d.lx) * TS, (room.y + d.ly) * TS);
    }
    SCOUTS.forEach(([name, lines], k) =>
      add(
        {
          name,
          role: 'éclaireur',
          beard: ['#c8642a', '#d8a040', '#4a2e1e', '#e8e0d0'][k],
          helm: '#6a4a2a',
          tunic: '#3a4a2a',
          tool: 'lantern',
          fem: k % 2 === 1,
          lines
        },
        (hubs[k].x + 1.5) * TS,
        (hubs[k].y + 0.5) * TS
      )
    );
  }
  // Une réplique du nain, en bulle au-dessus de lui.
  function talk(npc) {
    const v = npc.dwarf;
    if (!v || !v.lines.length) return false;
    v.bubble = { text: v.lines[v.line % v.lines.length], until: time + 300 };
    v.line++;
    v.face = P.x < v.x ? -1 : 1;
    return true;
  }
  function stepDwarves() {
    for (const v of dwarves) {
      if (Math.abs(v.x - P.x) > W || Math.abs(v.y - P.y) > H) continue;
      if (v.bubble && v.bubble.until < time) v.bubble = null;
      const roam = v.roam || 0.6;
      if (v.wait > 0) {
        v.wait--;
        continue;
      }
      const dx = v.tx - v.x,
        dy = v.ty - v.y,
        d = Math.hypot(dx, dy);
      if (d < 2) {
        v.wait = 120 + Math.floor(Math.random() * 260);
        v.tx = v.hx + (Math.random() - 0.5) * roam * TS * 2;
        v.ty = v.hy + (Math.random() - 0.5) * roam * TS * 2;
        if (!canWalk(v.tx, v.ty)) [v.tx, v.ty] = [v.hx, v.hy];
        continue;
      }
      const sp = 0.45;
      const nx = v.x + (dx / d) * sp,
        ny = v.y + (dy / d) * sp;
      if (canWalk(nx, ny)) {
        v.x = nx;
        v.y = ny;
        v.step++;
        v.face = dx < 0 ? -1 : 1;
      } else v.wait = 60;
      const npc = game.world.npcs.find(n => n.dwarf === v);
      if (npc) {
        npc.x = v.x;
        npc.y = v.y;
      }
    }
  }
  const DWARF_SPRITES = new Map();
  function dwarfSprite(v, frame) {
    const key = v.name + frame;
    if (DWARF_SPRITES.has(key)) return DWARF_SPRITES.get(key);
    const cv = K().canvas(16 * 3 + 6, 19 * 3 + 6),
      g = cv.getContext('2d'),
      r = (x, y, w, h, col) => {
        g.fillStyle = col;
        g.fillRect(3 + x * 3, 3 + y * 3, w * 3, h * 3);
      },
      skin = v.skin,
      beard = v.beard,
      boot = '#3a2a1e',
      pants = '#4a3a2e',
      metal = '#b8c0c8',
      wood = '#7a5232';
    // Jambes (pas alternés), bottes ; les naines portent une jupe longue bordée d'or.
    if (v.fem) {
      r(frame ? 4 : 5, 17, 3, 2, boot);
      r(frame ? 10 : 9, 17, 3, 2, boot);
      r(3, 13, 10, 4, v.tunic);
      r(2, 15, 12, 2, v.tunic);
      r(2, 16, 12, 1, '#e0b040');
    } else {
      r(4, 14, 3, 3, pants);
      r(9, 14, 3, 3, pants);
      r(frame ? 3 : 4, 17, 4, 2, boot);
      r(frame ? 10 : 9, 17, 4, 2, boot);
    }
    // Tunique trapue, ceinture et boucle.
    r(3, 8, 10, 7, v.tunic);
    r(2, 9, 12, 5, v.tunic);
    r(3, 12, 10, 1, '#2a1e14');
    r(7, 12, 2, 1, '#e0b040');
    // Bras et mains.
    r(0, 9, 2, 4, v.tunic);
    r(14, 9, 2, 4, v.tunic);
    r(0, 13, 2, 1, skin);
    r(14, 13, 2, 1, skin);
    // Tête, yeux, nez.
    r(4, 3, 8, 5, skin);
    r(5, 5, 2, 1, '#1a1418');
    r(9, 5, 2, 1, '#1a1418');
    r(7, 6, 2, 1, '#c98e62');
    // Naines : pas de barbe, mais de longues tresses (couleur de cheveux : beard) à anneaux d'or, cils, joues et lèvres.
    if (v.fem) {
      const hair = beard || '#8a5a2a';
      r(3, 3, 1, 4, hair);
      r(12, 3, 1, 4, hair);
      r(4, 3, 8, 1, hair);
      r(2, 5, 2, 9, hair);
      r(12, 5, 2, 9, hair);
      r(2, 8, 2, 1, '#e0b040');
      r(12, 8, 2, 1, '#e0b040');
      r(2, 12, 2, 1, '#e0b040');
      r(12, 12, 2, 1, '#e0b040');
      r(5, 4, 2, 1, '#1a1418');
      r(9, 4, 2, 1, '#1a1418');
      r(4, 6, 1, 1, '#f0a0a0');
      r(11, 6, 1, 1, '#f0a0a0');
      r(7, 7, 2, 1, '#c8505a');
      r(6, 8, 4, 1, '#e0b040');
    }
    // Barbe des nains (sauf les enfants) : longue, tressée, avec moustache.
    else if (beard) {
      r(4, 6, 8, 2, beard);
      r(3, 7, 10, 3, beard);
      r(4, 10, 8, 2, beard);
      r(6, 12, 4, 2, beard);
      r(5, 6, 6, 1, beard);
      r(7, 14, 2, 1, beard);
      r(6, 13, 1, 1, '#e0b040');
      r(9, 13, 1, 1, '#e0b040');
    }
    // Casque (ou couronne).
    r(3, 1, 10, 3, v.helm);
    r(2, 3, 12, 1, '#2a2420');
    r(7, 0, 2, 1, v.helm);
    if (v.crown) {
      r(3, 0, 1, 1, '#ffe080');
      r(6, 0, 1, 1, '#ffe080');
      r(9, 0, 1, 1, '#ffe080');
      r(12, 0, 1, 1, '#ffe080');
      r(7, 2, 2, 1, '#e04040');
    } else if (v.role === 'garde') {
      r(1, 1, 2, 2, '#e8dcc0');
      r(13, 1, 2, 2, '#e8dcc0');
    }
    // Outil.
    if (v.tool === 'pick') {
      r(14, 4, 1, 10, wood);
      r(11, 3, 6, 1, metal);
      r(11, 4, 1, 1, metal);
    } else if (v.tool === 'axe') {
      r(14, 3, 1, 11, wood);
      r(15, 3, 1, 4, metal);
      r(12, 3, 2, 3, metal);
    } else if (v.tool === 'hammer') {
      r(14, 6, 1, 8, wood);
      r(13, 4, 3, 2, '#5a5e66');
    } else if (v.tool === 'staff') {
      r(15, 1, 1, 15, wood);
      r(14, 0, 3, 2, '#9ad8ff');
    } else if (v.tool === 'lantern') {
      r(0, 13, 2, 1, '#2a2420');
      r(-0.3, 14, 2.6, 3, '#ffd36d');
    } else if (v.tool === 'mug') {
      r(14, 11, 2, 3, '#c8a060');
      r(14, 11, 2, 1, '#fff6d8');
    }
    const out = canaanOutline(cv, 2);
    DWARF_SPRITES.set(key, out);
    return out;
  }
  function drawDwarves(c) {
    c.save();
    c.imageSmoothingEnabled = false;
    for (const v of dwarves) {
      if (Math.abs(v.x - P.x) > W || Math.abs(v.y - P.y) > H) continue;
      const moving = v.wait <= 0 && Math.hypot(v.tx - v.x, v.ty - v.y) > 2,
        spr = dwarfSprite(v, moving ? Math.floor(v.step / 8) % 2 : 0),
        s = (v.scale || 1) * 0.9;
      c.globalAlpha = 0.32;
      c.fillStyle = '#0a0806';
      c.beginPath();
      c.ellipse(v.x, v.y + 16, 16 * s, 5 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.save();
      c.translate(Math.round(v.x), Math.round(v.y + 18));
      if (v.face < 0) c.scale(-1, 1);
      c.drawImage(
        spr,
        Math.round((-spr.width * s) / 2),
        Math.round(-spr.height * s),
        Math.round(spr.width * s),
        Math.round(spr.height * s)
      );
      c.restore();
      if (v.tool === 'lantern') canaanLight(v.x - 18, v.y - 4, 120, '#ffd36d');
      const near = Math.hypot(P.x - v.x, P.y - v.y);
      if (near < 190) {
        c.font = 'bold 11px sans-serif';
        c.textAlign = 'center';
        c.lineWidth = 3;
        c.strokeStyle = '#120c07';
        c.fillStyle = v.type ? '#ffe08a' : '#f6e2b1';
        const label = v.name + (v.role && !v.type ? '' : '');
        c.strokeText(label, v.x, v.y - 48 * s);
        c.fillText(label, v.x, v.y - 48 * s);
        if (near < 95) {
          c.font = '12px sans-serif';
          c.fillStyle = '#fff';
          const hint = v.type === 'shop' ? '[E] Commercer' : v.type === 'bank' ? '[E] Banque' : '[E] Parler';
          c.strokeText(hint, v.x, v.y - 62 * s);
          c.fillText(hint, v.x, v.y - 62 * s);
        }
      }
      if (v.bubble) bubble(c, v.x, v.y - 70 * s, v.bubble.text);
    }
    c.restore();
  }
  function bubble(c, x, y, text) {
    c.save();
    c.font = '12px sans-serif';
    // Traduite entière avant d'être coupée en lignes (une ligne seule ne serait pas reconnue).
    const words = translateText(text).split(' '),
      lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (c.measureText(t).width > 230 && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    const w = Math.max(...lines.map(l => c.measureText(l).width)) + 18,
      h = lines.length * 15 + 12;
    c.fillStyle = 'rgba(28,20,12,.92)';
    c.strokeStyle = '#e8c878';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect?.(x - w / 2, y - h, w, h, 6);
    if (!c.roundRect) c.rect(x - w / 2, y - h, w, h);
    c.fill();
    c.stroke();
    c.fillStyle = '#fff4d8';
    c.textAlign = 'center';
    lines.forEach((l, k) => c.fillText(l, x, y - h + 18 + k * 15));
    c.restore();
  }

  // ---------------------------------------------------------------- Bâtiments (dessin et emprise)
  // w, h : largeur et hauteur (cases) ; foot : profondeur du pied qui bloque (cases).
  const STRUCT = {
    shack: { w: 3, h: 3, foot: 1.2 },
    minehead: { w: 3, h: 4, foot: 1 },
    ruinhouse: { w: 4, h: 3, foot: 1.3 },
    ruintower: { w: 3, h: 5, foot: 1.4 },
    mausoleum: { w: 4, h: 4, foot: 1.5 },
    crypt: { w: 3, h: 3, foot: 1.2 },
    mycohut: { w: 3, h: 3, foot: 1.1 },
    dwarfhall: { w: 7, h: 5, foot: 2 },
    forge: { w: 4, h: 4, foot: 1.6 },
    tavern: { w: 5, h: 4, foot: 1.6 },
    vault: { w: 4, h: 3, foot: 1.4 },
    stall: { w: 3, h: 2, foot: 0.8 },
    dwarfhouse: { w: 3, h: 3, foot: 1.3 },
    kingstatue: { w: 2, h: 4, foot: 0.9 }
  };
  // Une façade de pierre : murs, pierres claires et sombres, joints.
  function stoneWall(c, x, y, w, h, wall, seed) {
    R(c, x, y, w, h, wall.face);
    for (let row = 0; row * 10 < h; row++)
      for (let k = (row % 2) * -9; k < w; k += 18) {
        R(c, x + k, y + row * 10, 1.5, 10, wall.dark);
        if (hash(k, row, seed) > 0.6) R(c, x + k + 3, y + row * 10 + 2, 12, 2, wall.light);
      }
    for (let row = 1; row * 10 < h; row++) R(c, x, y + row * 10, w, 1.5, wall.dark);
  }
  function door(c, x, y, w, h, col = '#120c08') {
    R(c, x - 3, y - 3, w + 6, h + 3, '#2a2420');
    R(c, x, y, w, h, col);
    R(c, x, y, w, 4, 'rgba(0,0,0,.4)');
  }
  // Bâtiments de la forteresse peints par dwarf-art.js (pixels de 2), avec leurs feux, fumées et lueurs animés.
  function drawFortArt(c, s, cx, by, flameCols) {
    const img = CANAAN_DWARF_ART.art(s.kind);
    if (!img) return false;
    const u = CANAAN_DWARF_ART.U,
      x0 = Math.round(cx - (img.width * u) / 2),
      y0 = Math.round(by + 4 - img.height * u),
      at = (ax, ay) => [x0 + ax * u, y0 + ay * u],
      smokeAt = (ax, ay) => {
        const [sx, sy] = at(ax, ay);
        for (let k = 0; k < 3; k++) {
          c.globalAlpha = 0.25 - k * 0.07;
          c.fillStyle = '#c8c0b0';
          c.beginPath();
          c.arc(
            sx + Math.sin(time * 0.02 + k) * 4,
            sy - 10 - k * 14 - ((time * 0.3) % 14),
            6 + k * 2,
            0,
            Math.PI * 2
          );
          c.fill();
        }
        c.globalAlpha = 1;
      };
    c.imageSmoothingEnabled = false;
    c.drawImage(img, x0, y0, img.width * u, img.height * u);
    const W = img.width;
    if (s.kind === 'dwarfhall')
      for (const ax of [22, W - 22]) {
        const [fx, fy] = at(ax, 64);
        K().flame(c, fx, fy, 1, flameCols, ax < W / 2 ? -1 : 1);
        canaanLight(fx, fy - 8, 200, flameCols[1]);
      }
    else if (s.kind === 'forge') {
      const [hx, hy] = at(18, 78),
        [ax, ay] = at(36, 76),
        glow = 0.7 + Math.sin(time * 0.15) * 0.3;
      // Feu du foyer, découpé à la forme de l'arc.
      c.save();
      c.beginPath();
      c.rect(hx, ay, 72, 64);
      c.arc(ax, ay, 36, Math.PI, 0);
      c.clip();
      c.globalAlpha = glow;
      c.fillStyle = '#ff6a1f';
      c.fillRect(hx, hy + 16, 72, 48);
      c.fillStyle = '#ffd36b';
      c.fillRect(hx + 14, hy + 30, 44, 34);
      c.restore();
      canaanLight(hx + 36, hy + 30, 240, '#ff8a3c');
      if (hash(Math.floor(time / 12), 1, 2) > 0.7)
        for (let k = 0; k < 4; k++)
          R(c, hx + 10 + Math.random() * 50, hy - Math.random() * 30, 2, 2, '#ffd36b');
      smokeAt(W - 20, 2);
    } else if (s.kind === 'tavern') {
      for (const [ax, ay] of [
        [29, 56],
        [W - 29, 56],
        [27, 88],
        [W - 27, 88]
      ]) {
        const [lx, ly] = at(ax, ay);
        canaanLight(lx, ly, 100, '#ffb84a');
      }
    } else if (s.kind === 'dwarfhouse') {
      const [wx, wy] = at(20, 64),
        [lx, ly] = at(W - 23, 67);
      canaanLight(wx, wy, 90, '#ffb84a');
      canaanLight(lx, ly, 70, '#ffd36d');
      smokeAt(W - 22, 2);
    } else if (s.kind === 'kingstatue') canaanLight(cx, by - 40, 60, '#ffd36d');
    return true;
  }
  function drawStructure(c, s) {
    const cx = (s.tx + 0.5) * TS,
      by = (s.ty + 1) * TS - 4,
      th = themeOf(s.biome),
      wall = th.wall,
      S = STRUCT[s.kind],
      w = S.w * TS,
      left = cx - w / 2,
      flameCols = th.th.flame;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.32)';
    c.beginPath();
    c.ellipse(cx, by, w * 0.55, 14, 0, 0, Math.PI * 2);
    c.fill();
    if (
      s.biome === 4 &&
      window.CANAAN_DWARF_ART &&
      CANAAN_DWARF_ART.has(s.kind) &&
      drawFortArt(c, s, cx, by, flameCols)
    ) {
      c.restore();
      return;
    }
    switch (s.kind) {
      case 'shack': {
        // Cabane de mineur effondrée : planches, toit crevé, poutre tombée.
        R(c, left + 6, by - 92, w - 12, 92, '#5a3e26');
        for (let k = 0; k < w - 12; k += 12) R(c, left + 6 + k, by - 92, 2, 92, '#3a2816');
        door(c, cx - 14, by - 46, 28, 46, '#0e0a06');
        c.fillStyle = '#3a2816';
        c.beginPath();
        c.moveTo(left - 4, by - 88);
        c.lineTo(cx + 8, by - 128);
        c.lineTo(left + w + 4, by - 96);
        c.lineTo(left + w - 20, by - 82);
        c.fill();
        R(c, cx + 10, by - 124, 22, 30, '#14100a');
        R(c, left + 10, by - 60, 16, 12, '#ffd36d33');
        R(c, cx + 30, by - 30, 50, 8, '#6a4a2c');
        break;
      }
      case 'minehead': {
        // Puits de mine abandonné : chevalement de bois, roue, rails qui plongent.
        R(c, cx - 40, by - 30, 80, 30, '#2a1e14');
        R(c, cx - 30, by - 24, 60, 22, '#060404');
        for (const sx of [-34, 30]) R(c, cx + sx, by - 170, 6, 145, '#6a4a2c');
        R(c, cx - 40, by - 170, 82, 8, '#5a3e26');
        c.strokeStyle = '#3a2816';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(cx - 34, by - 30);
        c.lineTo(cx + 30, by - 160);
        c.moveTo(cx + 34, by - 30);
        c.lineTo(cx - 30, by - 160);
        c.stroke();
        c.beginPath();
        c.arc(cx, by - 182, 18, 0, Math.PI * 2);
        c.strokeStyle = '#8a8e96';
        c.lineWidth = 4;
        c.stroke();
        R(c, cx - 1, by - 182, 2, 160, '#2a2420');
        R(c, cx - 26, by - 6, 52, 3, '#a8a2a0');
        break;
      }
      case 'ruinhouse': {
        // Maison naine abandonnée : murs de pierre écroulés d'un côté, porte noire, fenêtre, poutres.
        const hgt = 104,
          cut = 20 + hash(s.tx, s.ty, 3) * 30;
        // Mur écroulé en biseau d'un côté : la façade est découpée avant d'être peinte.
        c.save();
        c.beginPath();
        c.moveTo(left + 6, by);
        c.lineTo(left + 6, by - hgt);
        c.lineTo(left + w - 6 - cut * 2, by - hgt);
        c.lineTo(left + w - 6, by - hgt + cut * 1.6);
        c.lineTo(left + w - 6, by);
        c.clip();
        stoneWall(c, left + 6, by - hgt, w - 12, hgt, wall, s.seed);
        c.restore();
        R(c, left + 2, by - hgt - 8, w - cut * 2 - 6, 10, wall.light);
        door(c, cx - 16, by - 58, 32, 58);
        R(c, cx - 16, by - 64, 32, 6, th.th.pillar[2]);
        R(c, left + 18, by - 80, 16, 16, '#0a0c10');
        R(c, left + 18, by - 73, 16, 2, wall.dark);
        R(c, left + w - 30, by - 84, 10, 40, '#4a3a2a');
        for (let k = 0; k < 6; k++)
          R(c, left + hash(k, s.tx, 5) * w, by - 10 + hash(s.ty, k, 6) * 10, 10, 6, wall.light);
        break;
      }
      case 'ruintower': {
        // Tour effondrée : fût de pierre brisé en biseau, meurtrières, éboulis au pied.
        const hgt = 200;
        // Fût brisé en biseau : la tour est découpée avant d'être peinte.
        c.save();
        c.beginPath();
        c.moveTo(cx - 50, by);
        c.lineTo(cx - 50, by - hgt + 40);
        c.lineTo(cx - 10, by - hgt + 60);
        c.lineTo(cx + 50, by - hgt + 100);
        c.lineTo(cx + 50, by);
        c.clip();
        stoneWall(c, cx - 50, by - hgt + 40, 100, hgt - 40, wall, s.seed);
        c.restore();
        R(c, cx - 4, by - 120, 8, 22, '#0a0c10');
        R(c, cx - 30, by - 70, 6, 16, '#0a0c10');
        door(c, cx - 14, by - 52, 28, 52);
        for (let k = 0; k < 8; k++)
          R(c, cx - 60 + hash(k, 1, s.seed) * 120, by - 12 + hash(k, 2, s.seed) * 10, 12, 8, wall.light);
        break;
      }
      case 'mausoleum': {
        // Mausolée : socle, colonnes, fronton, porte de fer, cierges verts.
        R(c, left, by - 18, w, 18, wall.dark);
        R(c, left + 8, by - 110, w - 16, 92, wall.face);
        for (const k of [0, 1, 2, 3]) {
          const px = left + 14 + (k * (w - 40)) / 3;
          R(c, px, by - 110, 12, 92, th.th.pillar[0]);
          R(c, px, by - 110, 3, 92, th.th.pillar[2]);
        }
        c.fillStyle = wall.light;
        c.beginPath();
        c.moveTo(left - 2, by - 108);
        c.lineTo(cx, by - 150);
        c.lineTo(left + w + 2, by - 108);
        c.fill();
        c.fillStyle = wall.dark;
        c.beginPath();
        c.moveTo(left + 14, by - 112);
        c.lineTo(cx, by - 140);
        c.lineTo(left + w - 14, by - 112);
        c.fill();
        door(c, cx - 15, by - 70, 30, 52, '#1a2420');
        for (let k = 0; k < 4; k++) R(c, cx - 12 + k * 7, by - 70, 2, 52, '#4a5a52');
        R(c, cx - 4, by - 132, 8, 14, th.th.rune);
        for (const sx of [-1, 1]) {
          R(c, cx + sx * 34 - 2, by - 30, 4, 12, '#e8e0c8');
          K().flame(c, cx + sx * 34, by - 30, 0.55, flameCols, s.seed + sx);
          canaanLight(cx + sx * 34, by - 36, 110, flameCols[1]);
        }
        break;
      }
      case 'crypt': {
        // Petite crypte : toit à deux pans, croix, escalier qui descend dans le noir.
        R(c, left + 10, by - 70, w - 20, 70, wall.face);
        c.fillStyle = wall.dark;
        c.beginPath();
        c.moveTo(left + 2, by - 66);
        c.lineTo(cx, by - 104);
        c.lineTo(left + w - 2, by - 66);
        c.fill();
        R(c, cx - 3, by - 126, 6, 26, wall.light);
        R(c, cx - 11, by - 118, 22, 5, wall.light);
        door(c, cx - 14, by - 44, 28, 44, '#060807');
        for (let k = 0; k < 3; k++) R(c, cx - 12 + k * 2, by - 14 + k * 4, 24 - k * 4, 3, wall.dark);
        break;
      }
      case 'mycohut': {
        // Hutte envahie par les champignons : murs de terre, chapeaux géants luisants sur le toit.
        R(c, left + 10, by - 70, w - 20, 70, '#4a3e30');
        door(c, cx - 12, by - 42, 24, 42, '#0c0a08');
        for (const [dx, dy, r, col] of [
          [-30, -86, 34, '#c8508a'],
          [28, -96, 26, '#5ac8b8'],
          [0, -112, 22, '#d870d0']
        ]) {
          R(c, cx + dx - 4, by + dy, 8, -dy - 40, '#e8dcc0');
          c.fillStyle = col;
          c.beginPath();
          c.ellipse(cx + dx, by + dy, r, r * 0.5, 0, Math.PI, 0);
          c.fill();
          for (let k = 0; k < 4; k++)
            R(c, cx + dx - r * 0.6 + k * r * 0.35, by + dy - r * 0.3, 4, 4, '#fff0f8');
          canaanLight(cx + dx, by + dy, 90, col);
        }
        break;
      }
      case 'dwarfhall': {
        // Grand hall du roi : façade monumentale, colonnes, grande porte, bannières rouges et or.
        R(c, left - 6, by - 20, w + 12, 20, wall.dark);
        stoneWall(c, left, by - 200, w, 182, wall, s.seed);
        c.fillStyle = wall.light;
        c.beginPath();
        c.moveTo(left - 14, by - 196);
        c.lineTo(cx, by - 250);
        c.lineTo(left + w + 14, by - 196);
        c.fill();
        c.fillStyle = wall.dark;
        c.beginPath();
        c.moveTo(left + 20, by - 200);
        c.lineTo(cx, by - 236);
        c.lineTo(left + w - 20, by - 200);
        c.fill();
        R(c, cx - 14, by - 228, 28, 22, '#e0b040');
        R(c, cx - 8, by - 222, 16, 10, '#7a1a14');
        for (const k of [-3, -2, 2, 3]) {
          const px = cx + k * 46 - 10;
          R(c, px, by - 196, 20, 178, th.th.pillar[0]);
          R(c, px, by - 196, 5, 178, th.th.pillar[2]);
          R(c, px - 4, by - 200, 28, 8, th.th.pillar[2]);
        }
        door(c, cx - 34, by - 110, 68, 92, '#2a1608');
        R(c, cx - 2, by - 110, 4, 92, '#120804');
        R(c, cx - 26, by - 66, 8, 8, '#e0b040');
        R(c, cx + 18, by - 66, 8, 8, '#e0b040');
        for (const sx of [-1, 1]) {
          R(c, cx + sx * 70 - 12, by - 180, 24, 70, th.th.banner[0]);
          R(c, cx + sx * 70 - 12, by - 180, 24, 6, th.th.banner[1]);
          R(c, cx + sx * 70 - 4, by - 160, 8, 20, th.th.banner[1]);
          R(c, cx + sx * 112 - 2, by - 120, 4, 20, '#4a3324');
          K().flame(c, cx + sx * 112, by - 122, 1, flameCols, sx);
          canaanLight(cx + sx * 112, by - 130, 200, flameCols[1]);
        }
        break;
      }
      case 'forge': {
        // Forge naine : grand foyer rougeoyant, cheminée, enclume, soufflet.
        stoneWall(c, left + 4, by - 120, w - 8, 120, wall, s.seed);
        R(c, cx + 30, by - 190, 30, 80, wall.dark);
        R(c, cx + 30, by - 196, 30, 8, wall.light);
        const glow = 0.7 + Math.sin(time * 0.15) * 0.3;
        R(c, cx - 50, by - 80, 70, 56, '#1a0c06');
        c.globalAlpha = glow;
        R(c, cx - 44, by - 62, 58, 38, '#ff6a1f');
        R(c, cx - 36, by - 50, 42, 22, '#ffd36b');
        c.globalAlpha = 1;
        canaanLight(cx - 15, by - 50, 240, '#ff8a3c');
        R(c, cx + 18, by - 34, 34, 12, '#4a4e56');
        R(c, cx + 24, by - 22, 22, 18, '#3a3e46');
        R(c, cx + 14, by - 38, 44, 6, '#6a6e78');
        if (hash(Math.floor(time / 12), 1, 2) > 0.7)
          for (let k = 0; k < 4; k++)
            R(c, cx - 30 + Math.random() * 40, by - 100 - Math.random() * 40, 2, 2, '#ffd36b');
        break;
      }
      case 'tavern': {
        // Taverne de Dorn : murs de pierre, toit de bardeaux, enseigne à la chope, fenêtres chaudes, âtre.
        stoneWall(c, left + 4, by - 110, w - 8, 110, wall, s.seed);
        c.fillStyle = '#5a2e1e';
        c.beginPath();
        c.moveTo(left - 8, by - 106);
        c.lineTo(cx, by - 160);
        c.lineTo(left + w + 8, by - 106);
        c.fill();
        for (let k = 0; k < 4; k++) R(c, left + 4 + k * 14, by - 116 - k * 10, w - 8 - k * 28, 3, '#3a1e14');
        door(c, cx - 16, by - 60, 32, 60, '#3a2010');
        for (const sx of [-1, 1]) {
          R(c, cx + sx * 54 - 14, by - 82, 28, 22, '#ffb84a');
          R(c, cx + sx * 54 - 1, by - 82, 2, 22, '#5a3a20');
          canaanLight(cx + sx * 54, by - 70, 120, '#ffb84a');
        }
        R(c, left + w - 30, by - 104, 4, 24, '#4a3324');
        R(c, left + w - 44, by - 82, 32, 22, '#7a5232');
        R(c, left + w - 34, by - 78, 12, 14, '#e0b040');
        break;
      }
      case 'vault': {
        // Coffre-fort de Gimra : pierre sombre, porte ronde de fer à rivets.
        stoneWall(c, left + 4, by - 100, w - 8, 100, wall, s.seed);
        R(c, left, by - 108, w, 10, wall.light);
        c.fillStyle = '#5a5e66';
        c.beginPath();
        c.arc(cx, by - 44, 32, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#8a8e96';
        c.beginPath();
        c.arc(cx, by - 44, 24, 0, Math.PI * 2);
        c.fill();
        for (let k = 0; k < 8; k++)
          R(c, cx + Math.cos(k * 0.785) * 28 - 2, by - 44 + Math.sin(k * 0.785) * 28 - 2, 4, 4, '#3a3e46');
        R(c, cx - 3, by - 60, 6, 32, '#3a3e46');
        R(c, cx - 16, by - 47, 32, 6, '#3a3e46');
        break;
      }
      case 'stall': {
        // Étal du marchand : comptoir, auvent rayé, caisses et lingots.
        R(c, left + 6, by - 40, w - 12, 36, '#6a4a2c');
        R(c, left + 6, by - 44, w - 12, 6, '#8a6a40');
        for (const sx of [left + 8, left + w - 14]) R(c, sx, by - 110, 6, 72, '#4a3324');
        for (let k = 0; k < 6; k++)
          R(c, left + k * (w / 6), by - 118, w / 6, 22, k % 2 ? '#e0b040' : '#2a4a6a');
        R(c, left + 20, by - 56, 18, 10, '#e0b040');
        R(c, left + 44, by - 54, 14, 8, '#b8c0c8');
        R(c, left + w - 44, by - 60, 22, 16, '#7a5232');
        break;
      }
      case 'dwarfhouse': {
        // Maison naine : porte ronde, toit de pierre, cheminée qui fume, lanterne.
        stoneWall(c, left + 6, by - 84, w - 12, 84, wall, s.seed);
        c.fillStyle = wall.dark;
        c.beginPath();
        c.moveTo(left - 4, by - 80);
        c.lineTo(cx, by - 122);
        c.lineTo(left + w + 4, by - 80);
        c.fill();
        R(c, cx + 18, by - 128, 14, 34, wall.dark);
        c.fillStyle = '#3a2010';
        c.beginPath();
        c.arc(cx, by - 30, 16, Math.PI, 0);
        c.fill();
        R(c, cx - 16, by - 30, 32, 30, '#3a2010');
        R(c, cx + 8, by - 18, 4, 4, '#e0b040');
        R(c, left + 14, by - 64, 14, 14, '#ffb84a');
        canaanLight(left + 21, by - 57, 90, '#ffb84a');
        for (let k = 0; k < 3; k++) {
          c.globalAlpha = 0.25 - k * 0.07;
          c.fillStyle = '#c8c0b0';
          c.beginPath();
          c.arc(
            cx + 25 + Math.sin(time * 0.02 + k) * 4,
            by - 140 - k * 14 - ((time * 0.3) % 14),
            6 + k * 2,
            0,
            Math.PI * 2
          );
          c.fill();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'kingstatue': {
        // Statue du premier roi de Durgrim : socle, nain de pierre à la hache, runes dorées.
        R(c, cx - 34, by - 30, 68, 30, wall.dark);
        R(c, cx - 30, by - 34, 60, 6, wall.light);
        R(c, cx - 8, by - 26, 16, 6, '#e0b040');
        const st = '#9a948a',
          sd = '#6a645c';
        R(c, cx - 22, by - 120, 44, 86, st);
        R(c, cx - 26, by - 106, 52, 50, st);
        R(c, cx - 18, by - 150, 36, 32, st);
        R(c, cx - 22, by - 160, 44, 14, sd);
        R(c, cx - 24, by - 128, 48, 40, '#b0aaa0');
        R(c, cx - 16, by - 88, 32, 18, '#b0aaa0');
        R(c, cx + 28, by - 170, 6, 130, sd);
        R(c, cx + 20, by - 172, 24, 18, st);
        R(c, cx - 10, by - 140, 4, 4, '#2a2420');
        R(c, cx + 6, by - 140, 4, 4, '#2a2420');
        break;
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Décor (dessin)
  function drawDecor(c, d, x, y, b) {
    const X = x * TS,
      Y = y * TS,
      cx = X + 24,
      by = Y + 40,
      th = themeOf(b),
      seed = x * 5 + y * 3,
      wall = th.wall;
    if (d.startsWith('k:')) {
      const kind = d.slice(2) === 'skullpile' ? 'bonepile' : d.slice(2);
      return K().floorProp(
        c,
        { x, y, kind },
        { ...th.th, wall, floor: th.floors[T.FLOOR] || th.floors[T.STONE], hazard: {} }
      );
    }
    if (d.startsWith('w:'))
      return K().wallProp(c, { x, y, kind: d.slice(2), wall: true }, { ...th.th, wall });
    switch (d) {
      case 'stalag':
      case 'stalag2': {
        const big = d === 'stalag',
          h = big ? 58 + hash(x, y, 2) * 30 : 22 + hash(x, y, 3) * 14;
        for (const [dx, k] of big
          ? [
              [0, 1],
              [-14, 0.55],
              [13, 0.4]
            ]
          : [
              [-6, 1],
              [7, 0.7]
            ]) {
          const hh = h * k,
            ww = (big ? 22 : 12) * Math.max(0.6, k);
          for (let s = 0; s < 5; s++)
            R(
              c,
              cx + dx - (ww * (5 - s)) / 10,
              by - (hh * (s + 1)) / 5,
              (ww * (5 - s)) / 5,
              hh / 5 + 1,
              s % 2 ? wall.face : wall.light
            );
          R(c, cx + dx - ww / 2, by - 3, ww, 3, wall.dark);
        }
        break;
      }
      case 'beam': {
        R(c, cx - 22, by - 64, 6, 64, '#6a4a2c');
        R(c, cx + 16, by - 64, 6, 64, '#6a4a2c');
        R(c, cx - 26, by - 70, 52, 8, '#5a3e26');
        R(c, cx - 22, by - 64, 2, 64, '#8a6a40');
        break;
      }
      case 'lanternpost': {
        R(c, cx - 3, by - 70, 6, 70, '#3a2a1e');
        R(c, cx - 3, by - 70, 18, 4, '#3a2a1e');
        R(c, cx + 8, by - 66, 10, 14, '#ffd36d');
        R(c, cx + 8, by - 66, 10, 3, '#2a2420');
        canaanLight(cx + 13, by - 58, 170, '#ffc860');
        break;
      }
      case 'roots': {
        c.strokeStyle = '#4a3020';
        c.lineWidth = 4;
        for (let k = 0; k < 4; k++) {
          c.beginPath();
          c.moveTo(cx - 18 + k * 12, by - 6);
          c.quadraticCurveTo(
            cx - 10 + k * 8 + hash(k, x, y) * 14,
            by - 22,
            cx - 20 + k * 14,
            by - 34 - hash(x, k, 4) * 12
          );
          c.stroke();
        }
        break;
      }
      case 'deadtree': {
        // Arbre mort : tronc tordu gris-brun, branches nues crochues.
        R(c, cx - 7, by - 70, 14, 70, '#4a4238');
        R(c, cx - 7, by - 70, 4, 70, '#6a6054');
        R(c, cx - 14, by - 6, 28, 6, '#3a3228');
        c.strokeStyle = '#4a4238';
        c.lineCap = 'round';
        for (const [a, l, w] of [
          [-2.3, 40, 6],
          [-0.8, 46, 6],
          [-1.6, 34, 5],
          [-2.8, 26, 4],
          [-0.3, 28, 4]
        ]) {
          const sx = cx,
            sy = by - 60 - hash(a * 10, x, y) * 10,
            ex = sx + Math.cos(a) * l,
            ey = sy + Math.sin(a) * l;
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(sx, sy);
          c.lineTo(ex, ey);
          c.lineTo(ex + Math.cos(a + 0.8) * l * 0.35, ey + Math.sin(a + 0.8) * l * 0.35);
          c.stroke();
        }
        break;
      }
      case 'tomb': {
        // Pierre tombale arrondie, fissure, mousse et nom effacé.
        const st = hash(x, y, 5) < 0.5 ? '#7a7c74' : '#6a6c66';
        R(c, cx - 14, by - 40, 28, 40, st);
        c.fillStyle = st;
        c.beginPath();
        c.arc(cx, by - 40, 14, Math.PI, 0);
        c.fill();
        R(c, cx - 14, by - 40, 4, 40, '#8a8c84');
        R(c, cx - 8, by - 38, 16, 2, '#4a4c46');
        R(c, cx - 6, by - 32, 12, 2, '#4a4c46');
        R(c, cx + 3, by - 26, 2, 12, '#3a3c36');
        R(c, cx - 14, by - 8, 28, 8, '#4a6a3a');
        R(c, cx - 18, by - 2, 36, 4, '#2a2c26');
        break;
      }
      case 'cross': {
        const st = '#6e6a62';
        R(c, cx - 4, by - 56, 8, 56, st);
        R(c, cx - 16, by - 44, 32, 8, st);
        R(c, cx - 4, by - 56, 3, 56, '#8a867c');
        R(c, cx - 12, by - 4, 24, 4, '#2a2c26');
        break;
      }
      case 'grave': {
        c.fillStyle = '#3a3428';
        c.beginPath();
        c.ellipse(cx, by - 6, 20, 9, 0, 0, Math.PI * 2);
        c.fill();
        R(c, cx - 4, by - 26, 8, 18, '#6a6058');
        R(c, cx - 10, by - 22, 20, 5, '#6a6058');
        break;
      }
      case 'fence': {
        R(c, X, by - 34, TS, 4, '#2a2c30');
        R(c, X, by - 16, TS, 4, '#2a2c30');
        for (let k = 4; k < TS; k += 10) {
          R(c, X + k, by - 44, 4, 44, '#34363c');
          R(c, X + k - 1, by - 48, 6, 4, '#4a4c54');
        }
        break;
      }
      case 'candles2': {
        for (const [dx, h] of [
          [-10, 14],
          [0, 20],
          [9, 11]
        ]) {
          R(c, cx + dx - 2, by - h, 4, h, '#e8e0c8');
          K().flame(c, cx + dx, by - h, 0.45, th.th.flame, seed + dx);
        }
        canaanLight(cx, by - 20, 90, th.th.flame[1]);
        break;
      }
      case 'giantshroom': {
        // Champignon géant luisant : pied pâle, chapeau coloré tacheté, lueur.
        const cols = [
            ['#c8508a', '#ff9ad0'],
            ['#4ab8a8', '#a8fff0'],
            ['#9a5ad8', '#e0b8ff']
          ][Math.floor(hash(x, y, 6) * 3)],
          h = 56 + hash(x, y, 7) * 26,
          r = 26 + hash(x, y, 8) * 12;
        R(c, cx - 7, by - h, 14, h, '#e8dcc0');
        R(c, cx - 7, by - h, 4, h, '#fff4e0');
        c.fillStyle = cols[0];
        c.beginPath();
        c.ellipse(cx, by - h, r, r * 0.55, 0, Math.PI, 0);
        c.fill();
        R(c, cx - r, by - h - 2, r * 2, 5, cols[0]);
        for (let k = 0; k < 5; k++)
          R(c, cx - r * 0.7 + k * r * 0.33, by - h - r * 0.35 + (k % 2) * 6, 5, 5, cols[1]);
        canaanLight(cx, by - h, 130, cols[1]);
        break;
      }
      case 'shrooms': {
        for (const [dx, h, col] of [
          [-10, 12, '#c8508a'],
          [2, 18, '#4ab8a8'],
          [11, 9, '#d8a040']
        ]) {
          R(c, cx + dx - 2, by - h, 4, h, '#e8dcc0');
          c.fillStyle = col;
          c.beginPath();
          c.ellipse(cx + dx, by - h, 7, 4, 0, Math.PI, 0);
          c.fill();
        }
        if (hash(x, y, 9) < 0.4) canaanLight(cx, by - 12, 60, '#a8fff0');
        break;
      }
      case 'mudreeds': {
        for (let k = 0; k < 5; k++) {
          const h = 18 + hash(k, x, y) * 18;
          R(c, cx - 14 + k * 7, by - h, 3, h, '#6a7a3a');
          R(c, cx - 15 + k * 7, by - h - 6, 5, 7, '#8a5a3a');
        }
        break;
      }
      case 'ruinwall': {
        stoneWall(c, X - 8, by - 50 + hash(x, y, 4) * 16, TS + 16, 50 - hash(x, y, 4) * 16, wall, seed);
        R(c, X - 10, by - 4, TS + 20, 6, wall.dark);
        break;
      }
      case 'brokenpillar': {
        const [pc, pd, pl] = th.th.pillar,
          h = 30 + hash(x, y, 5) * 30;
        R(c, cx - 20, by - 8, 40, 10, pd);
        R(c, cx - 15, by - h, 30, h - 6, pc);
        R(c, cx - 15, by - h, 5, h - 6, pl);
        R(c, cx - 15, by - h - 4, 22, 6, pl);
        R(c, cx + 12, by - 6, 18, 10, pc);
        break;
      }
    }
  }

  // ---------------------------------------------------------------- Sols (dessin)
  const ART = new Map();
  const mk = fn =>
    [0, 1, 2, 3].map(v => {
      const cv = K().canvas(48, 48),
        g = cv.getContext('2d');
      fn(g, v);
      return cv;
    });
  function paintMud(g, m, v) {
    K().rect(g, 0, 0, 48, 48, m.a);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = m.b;
      g.beginPath();
      g.ellipse(
        hash(k, v, 31) * 48,
        hash(v, k, 32) * 48,
        6 + hash(k, k, v) * 6,
        3 + hash(v, v, k) * 3,
        0,
        0,
        Math.PI * 2
      );
      g.fill();
    }
    K().specks(g, 12, [m.c], v + 60, 2);
  }
  function paintFlow(g, m, v) {
    K().rect(g, 0, 0, 48, 48, m.a);
    for (let k = 0; k < 8; k++) {
      const x = hash(k, v, 41) * 48,
        y = 3 + k * 6;
      for (const dx of [0, -48]) {
        K().rect(g, x + dx, y, 12, 2, k % 2 ? m.c : m.b);
        K().rect(g, x + dx + 14, y + 1, 5, 1, m.b);
      }
    }
  }
  function artOf(b, t) {
    const key = b + ':' + t;
    if (ART.has(key)) return ART.get(key);
    const th = themeOf(b),
      bio = b === 4 ? BIOMES[0] : BIOMES[b];
    let art;
    if (t === 'face') art = mk((g, v) => K().paintFace(g, th.wall, v));
    else if (t === 'top') {
      const cv = K().canvas(48, 48),
        g = cv.getContext('2d');
      K().rect(g, 0, 0, 48, 48, th.wall.top);
      K().specks(g, 10, [th.wall.dark], 77 + b);
      art = [cv];
    } else if (t === T.MUD) art = mk((g, v) => paintMud(g, bio.mud, v));
    else if (t === T.RIVER) art = mk((g, v) => paintFlow(g, bio.river, v));
    else if (t === T.LAKE) art = mk((g, v) => paintFlow(g, bio.lake, v));
    else if (t === T.CHASM)
      art = mk((g, v) => K().paintHazard(g, { style: 'chasm', a: '#030304', b: '#0c0c10', c: '#22222a' }, v));
    else {
      const p = th.floors[t] || th.floors[bio.floor] || th.floors[T.STONE] || Object.values(th.floors)[0];
      art = mk((g, v) => K().paintFloor(g, p, v, p.style));
    }
    ART.set(key, art);
    return art;
  }
  function scrolled(c, img, x, y, off) {
    off = ((Math.floor(off) % 48) + 48) % 48;
    if (!off) return c.drawImage(img, x, y);
    c.drawImage(img, off, 0, 48 - off, 48, x, y, 48 - off, 48);
    c.drawImage(img, 0, 0, off, 48, x + 48 - off, y, off, 48);
  }
  function drawLiquid(c, t, b, x, y, X, Y, v) {
    const art = artOf(b, t)[v],
      speed = t === T.RIVER ? 0.35 : t === T.LAKE ? 0.08 : 0.02;
    if (t === T.CHASM) c.drawImage(art, X, Y);
    else scrolled(c, art, X, Y, time * speed + y * 9);
    const above = at(x, y - 1);
    if (OPEN(above) && above !== T.MUD) {
      const deep = t === T.CHASM;
      c.fillStyle = deep ? themeOf(b).wall.dark : themeOf(b).wall.face;
      c.fillRect(X, Y, TS, deep ? 14 : 6);
      if (deep) {
        c.globalAlpha = 0.5;
        c.fillStyle = '#000';
        c.fillRect(X, Y + 14, TS, 6);
        c.globalAlpha = 1;
      }
    }
    // Bulles qui crèvent à la surface de la boue, reflets sur les lacs.
    if (t === T.RIVER || t === T.LAKE) {
      const tw = hash(x, y, Math.floor(time / 24));
      if (tw > 0.86) {
        c.fillStyle = BIOMES[b % 4][t === T.RIVER ? 'river' : 'lake'].c;
        c.fillRect(X + tw * 36, Y + ((tw * 977) % 36), 4, 3);
      }
    }
  }
  function drawGround(c, x0, x1, y0, y1) {
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        // Pièce d'un bâtiment nain (house.js) : son sol et ses murs ; le reste dans le noir quand on y est.
        if (window.CANAAN_HOUSE && CANAAN_HOUSE.drawTile(c, x, y, at(x, y))) continue;
        const t = at(x, y),
          b = biomeAt(x, y),
          X = x * TS,
          Y = y * TS,
          v = (x * 7 + y * 13) & 3;
        if (t === T.WALL) {
          const th = themeOf(b),
            below = at(x, y + 1);
          if (OPEN(below) || WET.has(below)) {
            c.drawImage(artOf(b, 'face')[v], X, Y);
            continue;
          }
          const open = n => OPEN(n) || WET.has(n),
            near = [
              at(x - 1, y),
              at(x + 1, y),
              at(x, y - 1),
              at(x - 1, y + 1),
              at(x + 1, y + 1),
              at(x, y + 2)
            ];
          if (!near.some(open)) {
            c.drawImage(artOf(b, 'top')[0], X, Y);
            c.globalAlpha = 0.6;
            c.fillStyle = '#000';
            c.fillRect(X, Y, TS, TS);
            c.globalAlpha = 1;
            continue;
          }
          c.fillStyle = th.wall.dark;
          c.fillRect(X, Y, TS, TS);
          c.globalAlpha = 0.5;
          c.drawImage(artOf(b, 'top')[0], X, Y);
          c.globalAlpha = 1;
          c.fillStyle = th.wall.light;
          if (open(near[0])) c.fillRect(X, Y, 4, TS);
          if (open(near[1])) c.fillRect(X + TS - 4, Y, 4, TS);
          if (open(near[2])) c.fillRect(X, Y, TS, 4);
          continue;
        }
        if (WET.has(t)) {
          drawLiquid(c, t, b, x, y, X, Y, v);
          continue;
        }
        const under = bridges.get(y * MAPW + x);
        if (under !== undefined) {
          drawLiquid(c, under, b, x, y, X, Y, v);
          // Pont de planches, dans le sens du passage.
          const across = !OPEN(at(x - 1, y)) || !OPEN(at(x + 1, y)) || WET.has(at(x - 1, y));
          c.fillStyle = '#6a4a2c';
          if (across) for (let k = 2; k < 48; k += 9) c.fillRect(X + k, Y, 7, 48);
          else for (let k = 2; k < 48; k += 9) c.fillRect(X, Y + k, 48, 7);
          c.fillStyle = '#4a3420';
          if (across) {
            c.fillRect(X, Y + 4, 48, 3);
            c.fillRect(X, Y + 41, 48, 3);
          } else {
            c.fillRect(X + 4, Y, 3, 48);
            c.fillRect(X + 41, Y, 3, 48);
          }
          continue;
        }
        c.drawImage(artOf(b, t)[v], X, Y);
        if (t === T.MUD && hash(x, y, Math.floor(time / 30)) > 0.9) {
          c.strokeStyle = BIOMES[b % 4].mud.c;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(
            X + 10 + hash(y, x, 3) * 28,
            Y + 10 + hash(x, y, 4) * 28,
            3 + (time % 30) / 8,
            0,
            Math.PI * 2
          );
          c.stroke();
        }
        if (at(x, y - 1) === T.WALL) c.drawImage(K().shadowTile(), X, Y);
      }
  }

  // ---------------------------------------------------------------- Entrées (dessin, île et Tréfonds)
  function drawHole(c, e, x, y) {
    // À la surface : trou béant cerclé de rochers, cadre de bois, échelle et lanterne.
    c.save();
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath();
    c.ellipse(x, y + 8, 46, 20, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4a4a4e';
    c.beginPath();
    c.ellipse(x, y, 40, 22, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#050404';
    c.beginPath();
    c.ellipse(x, y, 31, 15, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      R(c, x + Math.cos(a) * 36 - 6, y + Math.sin(a) * 19 - 5, 12, 9, k % 2 ? '#6a6a6e' : '#8a8a8e');
    }
    for (const sx of [-26, 22]) R(c, x + sx, y - 54, 5, 50, '#6a4a2c');
    R(c, x - 30, y - 58, 60, 7, '#5a3e26');
    R(c, x - 6, y - 51, 2, 40, '#c8b890');
    R(c, x + 4, y - 51, 2, 40, '#c8b890');
    for (let k = 0; k < 4; k++) R(c, x - 6, y - 46 + k * 10, 12, 2, '#a89060');
    R(c, x + 22, y - 50, 10, 12, '#ffd36d');
    canaanLight(x + 27, y - 44, 120, '#ffc860');
    c.restore();
  }
  function drawShaft(c, e, x, y) {
    // Dans les Tréfonds : rai de lumière du jour qui tombe du trou, échelle de corde, éboulis.
    c.save();
    const g = c.createLinearGradient(x, y - 260, x, y + 20);
    g.addColorStop(0, 'rgba(255,248,220,0.55)');
    g.addColorStop(1, 'rgba(255,248,220,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x - 22, y - 260);
    c.lineTo(x + 22, y - 260);
    c.lineTo(x + 46, y + 18);
    c.lineTo(x - 46, y + 18);
    c.fill();
    canaanLight(x, y - 10, 230, '#fff2c8');
    R(c, x - 7, y - 200, 2, 196, '#a89060');
    R(c, x + 5, y - 200, 2, 196, '#a89060');
    for (let k = 0; k < 18; k++) R(c, x - 7, y - 196 + k * 11, 14, 2, '#c8b890');
    for (let k = 0; k < 7; k++)
      R(c, x - 40 + hash(k, e.id, 3) * 80, y + 4 + hash(e.id, k, 4) * 12, 10, 7, '#7a7470');
    c.restore();
  }
  function drawLabel(c, x, y, text, sub) {
    c.save();
    c.textAlign = 'center';
    c.font = 'bold 13px Palatino Linotype, Georgia, serif';
    c.lineWidth = 3;
    c.strokeStyle = '#120c07';
    c.fillStyle = '#ffe8a8';
    c.strokeText(text, x, y);
    c.fillText(text, x, y);
    if (sub) {
      c.font = 'bold 12px system-ui';
      c.fillStyle = '#fff';
      c.strokeText(sub, x, y + 16);
      c.fillText(sub, x, y + 16);
    }
    c.restore();
  }
  const inView = (x, y, m = 200) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
  // Entrées vues de l'île (appelé par la boucle de rendu, à la surface).
  function drawSurface(c) {
    for (const e of ENTRANCES) {
      const x = (e.x + 0.5) * TS,
        y = (e.y + 0.5) * TS;
      if (!inView(x, y)) continue;
      drawHole(c, e, x, y);
      if (Math.hypot(P.x - x, P.y - y) < 170)
        drawLabel(
          c,
          x,
          y - 76,
          '✦ ' + e.name.toUpperCase() + ' ✦',
          Math.hypot(P.x - x, P.y - y) < 95 ? '[E] Descendre dans les Tréfonds' : null
        );
    }
  }

  // ---------------------------------------------------------------- Rendu des Tréfonds
  function draw(c) {
    const x0 = Math.max(0, Math.floor(camX / TS) - 2),
      x1 = Math.min(MAPW, Math.ceil((camX + W) / TS) + 3),
      y0 = Math.max(0, Math.floor(camY / TS) - 2),
      y1 = Math.min(MAPH, Math.ceil((camY + H) / TS) + 4);
    stepDwarves();
    c.save();
    // Décor, ligne par ligne, puis bâtiments, portails des donjons, entrées, nains et faune.
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const d = deco()[y]?.[x];
        if (d) drawDecor(c, d, x, y, biomeAt(x, y));
      }
    for (const s of structures
      .filter(s => inView((s.tx + 0.5) * TS, s.ty * TS, 320))
      .sort((a, b) => a.ty - b.ty))
      drawStructure(c, s);
    instances.forEach((d, i) => {
      if (!d.under) return;
      const x = d.x * TS,
        y = d.y * TS;
      if (inView(x, y)) drawDungeonEntrance(c, i, x, y);
    });
    for (const e of ENTRANCES) {
      const x = (e.x + 0.5) * TS,
        y = (e.y + 0.5) * TS;
      if (!inView(x, y, 300)) continue;
      drawShaft(c, e, x, y);
      if (Math.hypot(P.x - x, P.y - y) < 170)
        drawLabel(
          c,
          x,
          y - 70,
          '✦ ' + e.name.toUpperCase() + ' ✦',
          Math.hypot(P.x - x, P.y - y) < 95 ? '[E] Remonter à la surface' : null
        );
    }
    for (const l of lairs) {
      const x = l.x * TS,
        y = l.y * TS;
      if (!inView(x, y, 100)) continue;
      // Repaire : cercle de runes au sol, de la couleur du boss.
      c.strokeStyle = l.boss.color;
      c.globalAlpha = 0.35 + Math.sin(time * 0.05) * 0.1;
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(x, y, 5 * TS, 2.4 * TS, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    drawDwarves(c);
    c.restore();
  }

  // ---------------------------------------------------------------- Règles : couche, voyage, monstres, boss
  // Les caches de l'île (gisements, bancs, animaux) se calculent à la surface, avant de descendre.
  function prepareSurface() {
    CANAAN_GATHER.prepare();
    CANAAN_PROF.prepare();
    CANAAN_LIFE.prepare();
  }
  function setLayer(layer) {
    if (layer === 'under') {
      if (game.world.layer !== 'under') prepareSurface();
      game.world.layer = 'under';
      if (!game.world.instance) {
        game.world.tiles = game.world.underworld;
        game.world.decor = game.world.underdecor;
      }
    } else {
      game.world.layer = 'surface';
      if (!game.world.instance) {
        game.world.tiles = game.world.overworld;
        game.world.decor = game.world.overdecor;
      }
    }
  }
  // L'hôte mène tout le groupe par une entrée : vers le bas (descend) ou vers le haut (ascend).
  function travel(entrance, down) {
    const e = ENTRANCES[entrance];
    if (!e || game.world.instance) return false;
    if (game.mode === 'guest') {
      toast('Seul l’hôte peut mener le groupe dans les Tréfonds ou à la surface.');
      return false;
    }
    closePanels();
    setLayer(down ? 'under' : 'surface');
    game.world.monsters = [];
    game.world.projectiles = [];
    game.world.drops = [];
    placeGroup((e.x + 0.5) * TS, (e.y + 2.1) * TS);
    spawnMonsters(12);
    spawnWorldBosses();
    toast(
      down
        ? '🏮 Les Tréfonds de Canaan · ' + zoneName(e.x, e.y)
        : '🌅 Retour à la surface · ' + currentZoneName()
    );
    if (down)
      chat(
        'Système',
        'Tu descends dans les Tréfonds : créatures, élites et boss y ont ton niveau. Remonte par n’importe quelle entrée (touche E).'
      );
    saveGame();
    CanaanStages.restartMusic();
    return true;
  }
  function use(npc) {
    if (npc.type === 'descend') return travel(npc.entrance, true);
    if (npc.type === 'ascend') return travel(npc.entrance, false);
    return false;
  }
  const hostLevel = () => Math.max(1, ...game.heroes.filter(h => !h.away).map(h => clampLevel(h.level)));
  // Créatures autour de l'hôte : celles du biome, au niveau du héros (élites : 7 %).
  function spawn(count) {
    const cx = P.x / TS,
      cy = P.y / TS,
      lv = clampLevel(game.hero.level);
    for (let i = 0; i < count; i++) {
      let x,
        y,
        tries = 0;
      do {
        const a = Math.random() * Math.PI * 2,
          r = 12 + Math.random() * 18;
        x = Math.round(cx + Math.cos(a) * r);
        y = Math.round(cy + Math.sin(a) * r);
        tries++;
      } while (
        (!OPEN(at(x, y)) ||
          safe(x, y) ||
          biomeAt(x, y) === 4 ||
          ENTRANCES.some(e => Math.hypot(e.x - x, e.y - y) < 4) ||
          game.world.monsters.some(m => Math.hypot(m.x / TS - x, m.y / TS - y) < 3.5)) &&
        tries < 80
      );
      if (tries >= 80) continue;
      const list = MOB_TYPES.filter(t => t.under === biomeAt(x, y));
      if (!list.length) continue;
      const type = list[Math.floor(Math.random() * list.length)],
        elite = Math.random() < 0.07,
        level = clampLevel(lv + Math.round(Math.random() * 2 - 1)),
        hp = mobHealth(level, elite, type.hp);
      game.world.monsters.push({
        x: (x + 0.5) * TS,
        y: (y + 0.5) * TS,
        hp,
        mhp: hp,
        level,
        t: type.name,
        r: elite ? 19 : 16,
        cd: 0,
        g: Math.round((8 + level * 1.6) * (elite ? 3 : 1)),
        mobColor: type.color,
        elite,
        under: true,
        _levelHp: true
      });
    }
  }
  function spawnBosses() {
    const lv = hostLevel();
    for (const l of lairs) {
      const b = l.boss;
      if (
        (game.world.worldBossTimers[b.id] || 0) > Date.now() ||
        game.world.monsters.some(m => m.worldBossId === b.id)
      )
        continue;
      game.world.monsters.push({
        x: (l.x + 0.5) * TS,
        y: (l.y + 0.5) * TS,
        hp: 1000,
        mhp: 1000,
        t: b.name,
        r: 29,
        cd: 0,
        g: 120 + lv * 20,
        level: lv,
        bossLevel: lv,
        bossColor: b.color,
        worldBoss: true,
        worldBossId: b.id,
        look: b.look,
        pal: b.pal,
        lookOpts: b.opts,
        under: true
      });
    }
    game.world.monsters.forEach(scaleBossHp);
  }
  const safe = (tx, ty) => Math.hypot(tx - C.x, ty - C.y) < FORT_R + 3 || canaanInHouse(tx, ty);
  function blocked(px, py) {
    const tx = Math.floor(px / TS),
      ty = Math.floor(py / TS),
      d = deco()?.[ty]?.[tx];
    if (d && SOLID_DECOR.has(d)) {
      const cx = (tx + 0.5) * TS,
        cy = (ty + 0.5) * TS;
      if (Math.abs(px - cx) < 15 && py > cy - 4 && py < cy + 22) return true;
    }
    for (let by = Math.floor(ty / 8) - 1; by <= Math.floor(ty / 8) + 1; by++)
      for (let bx = Math.floor(tx / 8) - 1; bx <= Math.floor(tx / 8) + 1; bx++)
        for (const s of buckets.get(bx + ',' + by) || [])
          if (px > s.box[0] && px < s.box[2] && py > s.box[1] && py < s.box[3]) return true;
    return false;
  }
  function zoneName(tx, ty) {
    const b = biomeAt(tx, ty);
    return b === 4 ? FORT.name : BIOMES[b].name;
  }
  // Zone des métiers et de la chasse : 6 à 9 (Galeries, Cité, Nécropole, Fangeval).
  const zoneId = (tx, ty) => 6 + (biomeAt(tx, ty) % 4);
  const spawnPoint = () => ({ x: (C.x + 0.5) * TS, y: (C.y + 5.5) * TS });
  const forgeSpot = () => ({ x: (C.x - 9 + 0.5) * TS, y: (C.y - 2 + 1.6) * TS });
  const nearStove = (x, y) =>
    !game.world.instance && Math.hypot(x - (C.x + 9.5) * TS, y - (C.y - 0.4) * TS) < TS * 3.2;
  // Ambiance : pénombre et teinte du biome, adoucies d'un biome à l'autre.
  const cur = { dark: 0.6, tint: [10, 8, 6], particles: 'dust', color: '#e0c090' };
  function ambience() {
    const b = biomeAt(P.x / TS, P.y / TS),
      target = themeOf(b).amb,
      k = 0.03;
    cur.dark += (target.dark - cur.dark) * k;
    cur.tint = cur.tint.map((v, i) => v + (target.tint[i] - v) * k);
    cur.particles = target.particles;
    cur.color = target.color;
    return {
      dark: cur.dark,
      tint: cur.tint.map(Math.round).join(','),
      particles: cur.particles,
      color: cur.color,
      heroLight: 300
    };
  }
  // Musique : une pièce par biome (audio.js).
  const themeKey = () =>
    ['galeries', 'ombral', 'necropole', 'fangeval', 'durgrim'][biomeAt(P.x / TS, P.y / TS)];

  // ---------------------------------------------------------------- Carte (mini-carte et touche M)
  function mapColor(t, x, y) {
    const b = biomeAt(x, y),
      th = themeOf(b);
    if (bridges.has(y * MAPW + x)) return '#8a6a40';
    if (t === T.PATH) return th.mapPath;
    if (t === T.MUD) return b === 3 ? '#4e5a28' : '#5e4428';
    if (t === T.RIVER) return (BIOMES[b % 4].river || BIOMES[0].river).b;
    if (t === T.LAKE) return (BIOMES[b % 4].lake || BIOMES[0].lake).b;
    if (t === T.CHASM) return '#020203';
    return th.map;
  }
  function markers() {
    const out = [{ kind: 'camp', x: C.x, y: C.y, name: FORT.name }];
    for (const e of ENTRANCES) out.push({ kind: 'stairs', x: e.x, y: e.y, name: e.name });
    instances.forEach((d, i) => d.under && out.push({ kind: 'portal', x: d.x, y: d.y, name: d.name, i }));
    for (const l of lairs) out.push({ kind: 'boss', x: l.x, y: l.y, name: l.boss.name });
    out.push({ kind: 'shop', x: C.x + 7, y: C.y + 10, name: null });
    return out;
  }
  function mapPanel() {
    const lv = clampLevel(game.hero.level),
      list = BIOMES.map((b, k) => {
        const d = instances.find(x => x.under && x.biome === 6 + k),
          boss = BOSSES[k];
        return (
          '<section class="island-section"><h4>' +
          (k + 1) +
          '. ' +
          safeGearText(b.name) +
          '</h4><div class="muted">' +
          safeGearText(b.desc) +
          '</div>' +
          (d
            ? '<div class="entry"><span class="map-dungeon">🔴 Donjon</span> · ' +
              safeGearText(d.name) +
              ' <b class="map-ilvl">à ton niveau</b></div>'
            : '') +
          '<div class="entry">⭐ Boss : ' +
          safeGearText(boss.name) +
          '</div></section>'
        );
      }).join('');
    return (
      '<h2>🗺️ Les Tréfonds de Canaan</h2><p class="muted">🏰 Forteresse de Durgrim (zone sûre) · 🔴 Donjons · ⭐ Boss · ⛏️ Entrées vers la surface · ⚪ Vous — créatures et boss à ton niveau (' +
      lv +
      ')</p><div class="map-instance-layout"><div>' +
      '<div class="map-tools"><button data-action="mapZoom" data-step="-1" title="Dézoomer">➖</button><button data-action="mapZoom" data-step="1" title="Zoomer">➕</button><button data-action="mapCenter">🎯 Me centrer</button><button data-action="mapFit">🗺️ Vue d’ensemble</button><span id="mapZoomLevel" class="muted"></span></div>' +
      '<canvas id="bigMap" width="800" height="800"></canvas></div><div class="map-instance-list"><h3>🧭 Quatre biomes sous l’île</h3>' +
      list +
      '</div></div>'
    );
  }

  build();
  window.CANAAN_UNDER = Object.freeze({
    T,
    BIOMES,
    BOSSES,
    ENTRANCES,
    FORT,
    build,
    biomeAt,
    zoneId,
    zoneName,
    safe,
    blocked,
    setLayer,
    travel,
    use,
    talk,
    spawn,
    spawnBosses,
    spawnPoint,
    forgeSpot,
    nearStove,
    chests: () => CHESTS,
    nodes: () => nodes,
    spots: () => spots,
    fauna: () => fauna,
    dwarves: () => dwarves,
    structures: () => structures,
    lairs: () => lairs,
    drawGround,
    draw,
    drawSurface,
    ambience,
    themeKey,
    mapColor,
    markers,
    mapPanel,
    audit() {
      // Contrôle : forteresse, entrées, portails, repaires et coffres accessibles depuis la forteresse.
      const seen = new Uint8Array(MAPW * MAPH),
        q = [C.y * MAPW + C.x];
      seen[q[0]] = 1;
      for (let h = 0; h < q.length; h++) {
        const k = q[h],
          x = k % MAPW,
          y = (k - x) / MAPW;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const nk = (y + dy) * MAPW + x + dx;
          if (!seen[nk] && OPEN(at(x + dx, y + dy))) {
            seen[nk] = 1;
            q.push(nk);
          }
        }
      }
      const places = [
        ...ENTRANCES.map(e => ['entrée', e.name, e.x, e.y]),
        ...instances.filter(d => d.under).map(d => ['portail', d.name, d.x, d.y]),
        ...lairs.map(l => ['repaire', l.boss.name, l.x, l.y]),
        ...CHESTS.map(c => ['coffre', c.id, c.x, c.y])
      ];
      return {
        unreachable: places.filter(([, , x, y]) => !seen[y * MAPW + x]).map(([k, n]) => k + ' ' + n),
        open: seen.reduce((n, v) => n + v, 0)
      };
    }
  });
})();
