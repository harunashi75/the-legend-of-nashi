// Donjons et raids : plan, textures, décor, éclairage, ennemis et boss de chaque instance, fidèles à son nom.
// Un donjon a un boss ; un raid en a trois, séparés par des herses qui s'ouvrent à la mort du boss précédent.
(() => {
  'use strict';
  const WALL = 9,
    GATE = 19,
    FLOOR = 20,
    ACCENT = 21,
    HAZARD = 22;
  // Le héros entre toujours sur cette case (enterInstance).
  const ENTRY = { x: 120, y: 133 };
  const WALKABLE = t => t === FLOOR || t === ACCENT;

  // Thèmes, dans l'ordre de `instances`. Palettes d'acteurs : [principale, sombre, claire, accent, yeux].
  const THEMES = [
    {
      key: 'terriers',
      shape: 'cave',
      floor: { style: 'dirt', a: '#5b4733', b: '#3e2f21', c: '#7d6449' },
      accent: { style: 'gravel', a: '#54412f', b: '#3a2c1f', c: '#7a6450', width: 1 },
      wall: { style: 'rock', top: '#17110c', face: '#4d3b2b', dark: '#2e231a', light: '#6d5640' },
      hazard: { style: 'water', a: '#1d3640', b: '#2c5563', c: '#7fb3c0', pools: 2 },
      light: { dark: 0.66, tint: '20,12,4' },
      flame: ['#e5522e', '#f9a640', '#fff1b5'],
      rune: '#a3c7ff',
      banner: ['#6b4a2e', '#c9a46e'],
      pillar: ['#5b4836', '#3b2d21', '#7d6650'],
      wallProps: ['torch', 'roots', 'beam', 'roots'],
      floorProps: ['bones', 'mushroom', 'burrow', 'crate', 'rubble', 'bones', 'mushroom'],
      centerpiece: 'bonethrone',
      gate: 'portcullis',
      particles: 'dust',
      mobs: [
        { name: 'Osselet', look: 'skeleton', pal: ['#ddd6be', '#8f8670', '#fff8e0', '#6a5a40', '#7fd0ff'] },
        {
          name: 'Rat des terriers',
          look: 'beast',
          pal: ['#7a5d44', '#4b3828', '#a3846a', '#e6a7a7', '#ff5040']
        }
      ],
      bosses: [
        { look: 'skeleton', pal: ['#ece5cc', '#9a917a', '#fffbe8', '#5a6a8a', '#8fd8ff'], crown: true }
      ]
    },
    {
      key: 'mine',
      shape: 'hall',
      floor: { style: 'stone', a: '#4a4a52', b: '#34343b', c: '#686872' },
      accent: { style: 'rails', a: '#4a4a52', b: '#5e4430', c: '#a7aab4', width: 0 },
      wall: { style: 'rock', top: '#101218', face: '#3d434d', dark: '#262a32', light: '#5d6673' },
      hazard: { style: 'chasm', a: '#06070a', b: '#12141a', c: '#2a2e38', pools: 1 },
      light: { dark: 0.62, tint: '6,10,20' },
      flame: ['#e5822e', '#f9c640', '#fff6c5'],
      rune: '#67d8ee',
      banner: ['#3d4652', '#9fe8ff'],
      pillar: ['#5e4430', '#3b2a1d', '#80614a'],
      wallProps: ['lantern', 'mithril', 'beam', 'mithril'],
      floorProps: ['minecart', 'crate', 'ore', 'pickaxe', 'rubble', 'ore'],
      centerpiece: 'mithrilcluster',
      gate: 'portcullis',
      particles: 'dust',
      mobs: [
        {
          name: 'Mineur maudit',
          look: 'brute',
          pal: ['#6b7a8c', '#3d4652', '#93a3b5', '#c9a24a', '#9fe8ff']
        },
        {
          name: 'Kobold des galeries',
          look: 'imp',
          pal: ['#a67c4f', '#6e5033', '#c9a074', '#e0d060', '#ffd23f']
        }
      ],
      bosses: [{ look: 'golem', pal: ['#9fb6c9', '#5c6f80', '#e3f2ff', '#7de0ff', '#c8f7ff'] }]
    },
    {
      key: 'eclipse',
      shape: 'hall',
      floor: { style: 'tiles', a: '#2f2a3d', b: '#211d2c', c: '#4a4360' },
      accent: { style: 'runes', a: '#3a2f22', b: '#271f16', c: '#e0b04a', width: 0 },
      wall: { style: 'brick', top: '#0d0b14', face: '#3a3350', dark: '#262036', light: '#5a5078' },
      hazard: { style: 'void', a: '#0b0614', b: '#1c1030', c: '#7a4ab0', pools: 0 },
      light: { dark: 0.6, tint: '12,4,24' },
      flame: ['#7a3ad8', '#b47aff', '#f0e0ff'],
      rune: '#ff9955',
      banner: ['#2a1e40', '#e0b04a'],
      pillar: ['#4a4262', '#2a2438', '#6e6490'],
      wallProps: ['sconce', 'banner', 'sconce'],
      floorProps: ['pillar', 'brazier', 'statue', 'candles', 'candles'],
      centerpiece: 'altar',
      decal: 'eclipse',
      gate: 'barrier',
      particles: 'motes',
      mobs: [
        {
          name: 'Acolyte de l’Éclipse',
          look: 'robed',
          pal: ['#3b2d55', '#22193a', '#5d4a80', '#e0b04a', '#ffb347']
        },
        {
          name: 'Ombre éclipsée',
          look: 'spirit',
          pal: ['#6a4f9a', '#3a2a5a', '#a58ad8', '#ffd36d', '#ffe9a0']
        }
      ],
      bosses: [{ look: 'robed', pal: ['#1e1530', '#0f0a1c', '#4a3670', '#ffcc55', '#ffdd88'], halo: true }]
    },
    {
      key: 'penitents',
      shape: 'hall',
      floor: { style: 'flagstone', a: '#56565c', b: '#3c3c42', c: '#77777e' },
      accent: { style: 'carpet', a: '#6e1c22', b: '#521418', c: '#c9a24a', width: 1 },
      wall: { style: 'brick', top: '#111115', face: '#4b4a52', dark: '#303036', light: '#6c6b74' },
      hazard: { style: 'chasm', a: '#050506', b: '#101014', c: '#26262c', pools: 0 },
      light: { dark: 0.54, tint: '10,8,16' },
      flame: ['#e5522e', '#f9a640', '#fff1b5'],
      rune: '#b79cff',
      banner: ['#5a161a', '#d6ccff'],
      pillar: ['#5c5b63', '#3a3a40', '#807f88'],
      wallProps: ['torch', 'banner', 'chains', 'banner'],
      floorProps: ['pillar', 'candles', 'cage', 'statue', 'brazier', 'candles'],
      centerpiece: 'altar',
      gate: 'portcullis',
      particles: 'dust',
      mobs: [
        {
          name: 'Pénitent flagellant',
          look: 'robed',
          pal: ['#6b5a48', '#463a2e', '#8f7b64', '#a03030', '#ff6040']
        },
        {
          name: 'Chevalier spectral',
          look: 'knight',
          pal: ['#8d9ac4', '#56608a', '#c9d3f0', '#ab94ee', '#d6ccff']
        }
      ],
      bosses: [{ look: 'knight', pal: ['#4a4458', '#2a2636', '#7c7490', '#b79cff', '#e2d4ff'], hood: true }]
    },
    {
      key: 'forge',
      shape: 'hall',
      floor: { style: 'basalt', a: '#3a2a26', b: '#261a17', c: '#5a3d33' },
      accent: { style: 'grate', a: '#2e2e33', b: '#1c1c20', c: '#ff8a3c', width: 1 },
      wall: { style: 'rock', top: '#120806', face: '#3d2620', dark: '#25150f', light: '#5e3a2c' },
      hazard: { style: 'lava', a: '#b8360f', b: '#ff6a1f', c: '#ffd36b', pools: 3, glow: '#ff6a1f' },
      light: { dark: 0.44, tint: '30,6,0' },
      flame: ['#e5522e', '#f9a640', '#fff1b5'],
      rune: '#ff7a2a',
      banner: ['#3a1408', '#ff8a3c'],
      pillar: ['#4a302a', '#2a1a16', '#6e4a3c'],
      wallProps: ['furnace', 'chains', 'torch', 'chains'],
      floorProps: ['anvil', 'rack', 'brazier', 'ingots', 'dragonskull', 'ingots'],
      centerpiece: 'greatforge',
      gate: 'portcullis',
      particles: 'embers',
      mobs: [
        {
          name: 'Diablotin des forges',
          look: 'imp',
          pal: ['#e2652a', '#9c3a14', '#ffa05a', '#ffd36b', '#fff0a0']
        },
        {
          name: 'Dragonnet ardent',
          look: 'dragon',
          pal: ['#c4462a', '#7c2412', '#f08050', '#ffcf5a', '#fff09a']
        }
      ],
      bosses: [{ look: 'dragon', pal: ['#d0401c', '#7a1e0c', '#ff8a4a', '#ffd36b', '#fff6b0'] }]
    },
    {
      key: 'fosse',
      shape: 'pit',
      floor: { style: 'flagstone', a: '#3a2c34', b: '#271d23', c: '#56424c' },
      accent: { style: 'grate', a: '#2a2228', b: '#18121a', c: '#9a3ad8', width: 0 },
      wall: { style: 'rock', top: '#0a0709', face: '#33262c', dark: '#1f171b', light: '#4d3a42' },
      hazard: { style: 'chasm', a: '#040206', b: '#120a16', c: '#3a2048', pools: 1 },
      light: { dark: 0.68, tint: '16,4,20' },
      flame: ['#8a2ad8', '#c47aff', '#f4d0ff'],
      rune: '#e88aff',
      banner: ['#2a1420', '#e88aff'],
      pillar: ['#4a3a42', '#2a2026', '#6a5560'],
      wallProps: ['chains', 'sconce', 'chains', 'skulls'],
      floorProps: ['bonepile', 'cage', 'spikes', 'rack', 'brazier', 'bones'],
      centerpiece: 'block',
      gate: 'portcullis',
      particles: 'motes',
      mobs: [
        { name: 'Âme damnée', look: 'spirit', pal: ['#8a6ab0', '#4a3a68', '#c4a8ec', '#e88aff', '#f4d0ff'] },
        {
          name: 'Geôlier de la Fosse',
          look: 'brute',
          pal: ['#5a4a4a', '#352a2a', '#7c6a6a', '#8a2a2a', '#ff4a4a']
        }
      ],
      bosses: [{ look: 'brute', pal: ['#4a3438', '#2a1c20', '#6e5056', '#c03040', '#ff5050'] }]
    },
    {
      key: 'bastion',
      shape: 'hall',
      floor: { style: 'flagstone', a: '#4a2a2a', b: '#331c1c', c: '#6a3c3a' },
      accent: { style: 'carpet', a: '#8a1420', b: '#5e0c16', c: '#d4a44a', width: 1 },
      wall: { style: 'brick', top: '#120707', face: '#4a2626', dark: '#2e1616', light: '#6e3a36' },
      hazard: { style: 'blood', a: '#4a060c', b: '#7a1018', c: '#c8303a', pools: 2 },
      light: { dark: 0.52, tint: '30,4,4' },
      flame: ['#c4221a', '#f46a32', '#ffd3a0'],
      rune: '#ffd36d',
      banner: ['#7a0e18', '#d4a44a'],
      pillar: ['#5a3030', '#341a1a', '#7e4844'],
      wallProps: ['banner', 'torch', 'skulls', 'torch'],
      floorProps: ['pillar', 'brazier', 'pike', 'statue', 'candles'],
      centerpiece: 'throne',
      gate: 'portcullis',
      particles: 'embers',
      mobs: [
        {
          name: 'Garde sanglant',
          look: 'knight',
          pal: ['#7a2a2a', '#4a1616', '#a84a44', '#d4a44a', '#ffcc66']
        },
        {
          name: 'Vampire écarlate',
          look: 'robed',
          pal: ['#5a1420', '#330a12', '#8a2a36', '#e0c060', '#ff3040']
        }
      ],
      bosses: [
        { look: 'knight', pal: ['#6a1c1c', '#3a0e0e', '#9a3a34', '#c0c0c8', '#ff6040'] },
        { look: 'robed', pal: ['#8a1428', '#4a0a16', '#c03a50', '#ffd36d', '#ff3050'], crown: true },
        { look: 'knight', pal: ['#9a1a1a', '#550c0c', '#d04040', '#ffd36d', '#ffee88'], crown: true }
      ]
    },
    {
      key: 'continuum',
      shape: 'void',
      floor: { style: 'arcane', a: '#343954', b: '#22263a', c: '#4c5478', glow: '#7de0ff' },
      accent: { style: 'runes', a: '#4a4220', b: '#2e2812', c: '#7de0ff', width: 0 },
      wall: { style: 'brick', top: '#0b0c18', face: '#40405e', dark: '#2a2a40', light: '#5e5e86' },
      hazard: { style: 'stars', a: '#05040f', b: '#1a1238', c: '#9fd8ff', pools: 0 },
      light: { dark: 0.46, tint: '10,6,30' },
      flame: ['#3a8ad8', '#7ad0ff', '#e0f8ff'],
      rune: '#ff7fa7',
      banner: ['#262a40', '#7de0ff'],
      pillar: ['#8a7034', '#54421c', '#c0a050'],
      wallProps: [],
      floorProps: ['gear', 'hourglass', 'crystal', 'pillar', 'crystal', 'gear'],
      centerpiece: 'orrery',
      gate: 'barrier',
      particles: 'sparks',
      mobs: [
        { name: 'Rouage animé', look: 'golem', pal: ['#b08a3a', '#6e5420', '#e0c070', '#7de0ff', '#c8f7ff'] },
        {
          name: 'Ombre astrale',
          look: 'spirit',
          pal: ['#ed8bc1', '#8a4a7a', '#ffc0e4', '#9fd8ff', '#ffffff']
        }
      ],
      bosses: [
        { look: 'golem', pal: ['#c09a40', '#705a22', '#f0d080', '#7de0ff', '#d0faff'] },
        { look: 'robed', pal: ['#3a4a9a', '#1e2860', '#6a7ad8', '#ffd36d', '#9fe8ff'], halo: true },
        { look: 'horror', pal: ['#2a1a4a', '#140a2a', '#5a3a8a', '#ff7fa7', '#ffd0e0'] }
      ]
    },
    {
      key: 'seraphin',
      shape: 'void',
      floor: { style: 'marble', a: '#e4ddd0', b: '#c4bba8', c: '#d4aa3a' },
      accent: { style: 'carpet', a: '#d4aa3a', b: '#a8822a', c: '#fff4c0', width: 1 },
      wall: { style: 'marble', top: '#cfc6b4', face: '#e8e0d0', dark: '#b8ae98', light: '#fffaf0' },
      hazard: { style: 'clouds', a: '#9fb8e0', b: '#c8d8f4', c: '#ffffff', pools: 0 },
      light: { dark: 0.16, tint: '40,24,60' },
      flame: ['#f0b030', '#ffe070', '#ffffff'],
      rune: '#c4a0ff',
      banner: ['#f4f0e4', '#d4aa3a'],
      pillar: ['#efe8da', '#c8bea8', '#ffffff'],
      wallProps: [],
      floorProps: ['pillar', 'angelstatue', 'brazier', 'feathers', 'pillar'],
      centerpiece: 'throne',
      gate: 'barrier',
      particles: 'feathers',
      mobs: [
        {
          name: 'Séraphin corrompu',
          look: 'angel',
          pal: ['#c4a0ff', '#7a5ab0', '#efe0ff', '#ffd36d', '#ffffff']
        },
        {
          name: 'Sentinelle solaire',
          look: 'golem',
          pal: ['#e8c860', '#a8862a', '#fff0a8', '#ffffff', '#ffffff']
        }
      ],
      bosses: [
        { look: 'angel', pal: ['#f0e6c8', '#b8a878', '#ffffff', '#ffd36d', '#fff6c0'] },
        { look: 'golem', pal: ['#f4f0e4', '#c4baa0', '#ffffff', '#ffd36d', '#ffe680'], halo: true },
        { look: 'angel', pal: ['#ffffff', '#d8cfa8', '#ffffff', '#ffcf40', '#fff0a0'], wings6: true }
      ]
    },
    {
      key: 'celestia',
      shape: 'void',
      floor: { style: 'starstone', a: '#1c2148', b: '#121633', c: '#fff0a8' },
      accent: { style: 'runes', a: '#2a2a5a', b: '#1a1a40', c: '#fff0a8', width: 0 },
      wall: { style: 'marble', top: '#06061a', face: '#2a2e60', dark: '#1a1c40', light: '#4a50a0' },
      hazard: { style: 'stars', a: '#020208', b: '#14123a', c: '#fff0a8', pools: 0 },
      light: { dark: 0.38, tint: '4,6,30' },
      flame: ['#d4aa3a', '#fff0a8', '#ffffff'],
      rune: '#fff0a8',
      banner: ['#1a1c40', '#fff0a8'],
      pillar: ['#d8d4f0', '#9a96c0', '#ffffff'],
      wallProps: [],
      floorProps: ['pillarlight', 'orb', 'pillar', 'crystal', 'statue'],
      centerpiece: 'scales',
      gate: 'barrier',
      particles: 'sparks',
      mobs: [
        { name: 'Juge céleste', look: 'angel', pal: ['#fff0a8', '#c4aa50', '#ffffff', '#9fd8ff', '#ffffff'] },
        {
          name: 'Héraut stellaire',
          look: 'spirit',
          pal: ['#9fd8ff', '#4a7ab0', '#e0f4ff', '#fff0a8', '#ffffff']
        }
      ],
      bosses: [
        { look: 'angel', pal: ['#c8d8ff', '#7a8ac0', '#ffffff', '#9fd8ff', '#e0f4ff'] },
        { look: 'golem', pal: ['#d4aa3a', '#8a6a1a', '#fff0a8', '#9fd8ff', '#ffffff'], halo: true },
        { look: 'angel', pal: ['#fff8d8', '#c8b070', '#ffffff', '#fff0a8', '#ffffff'], wings6: true }
      ]
    }
  ];
  // Arène des Épreuves : colisée de sable chaud, gradins de grès, bannières pourpres et or.
  THEMES.arena = {
    key: 'arene',
    shape: 'hall',
    floor: { style: 'dirt', a: '#c2a272', b: '#a5865a', c: '#dcc095' },
    accent: { style: 'gravel', a: '#9a7c52', b: '#7a6040', c: '#b8986a', width: 0 },
    wall: { style: 'brick', top: '#24180e', face: '#9a7a54', dark: '#5a4430', light: '#c8a676' },
    hazard: { style: 'chasm', a: '#050506', b: '#101014', c: '#26262c', pools: 0 },
    light: { dark: 0.16, tint: '34,18,6' },
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#ffc65a',
    banner: ['#7a1424', '#ffd36d'],
    pillar: ['#d4bc94', '#8e7658', '#f2e4c4'],
    wallProps: ['banner', 'torch'],
    floorProps: [],
    centerpiece: null,
    gate: 'portcullis',
    particles: 'embers',
    mobs: [],
    bosses: []
  };
  // Piste : centre et rayon en cases ; le héros entre par l'antichambre au sud (ENTRY).
  const ARENA = Object.freeze({ cx: 120, cy: 111, r: 12.6, gateY: 125 });
  // Objets posés au sol qui bloquent le passage ; les autres sont décoratifs.
  const SOLID_PROPS = new Set([
    'pillar',
    'statue',
    'angelstatue',
    'brazier',
    'anvil',
    'minecart',
    'cage',
    'rack',
    'gear',
    'hourglass',
    'pillarlight',
    'dragonskull'
  ]);

  // ---------------------------------------------------------------- Plans
  function seeded(i) {
    let s = (i + 1) * 9973 + 17;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }
  const PLANS = [];
  const bounds = r => ({
    x0: r.cx - (r.w - 1) / 2,
    x1: r.cx + (r.w - 1) / 2,
    y0: r.cy - (r.h - 1) / 2,
    y1: r.cy + (r.h - 1) / 2
  });
  const STEP = { N: [0, -1], E: [1, 0], W: [-1, 0], S: [0, 1] };
  const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
  function corridorPoints(a, b, dir) {
    if (dir === 'N' || dir === 'S') {
      const my = Math.round((a.cy + b.cy) / 2);
      return [
        [a.cx, a.cy],
        [a.cx, my],
        [b.cx, my],
        [b.cx, b.cy]
      ];
    }
    const mx = Math.round((a.cx + b.cx) / 2);
    return [
      [a.cx, a.cy],
      [mx, a.cy],
      [mx, b.cy],
      [b.cx, b.cy]
    ];
  }
  function eachPathCell(points, fn) {
    for (let k = 1; k < points.length; k++) {
      let [x, y] = points[k - 1];
      const [tx, ty] = points[k];
      fn(x, y);
      while (x !== tx || y !== ty) {
        x += Math.sign(tx - x);
        y += Math.sign(ty - y);
        fn(x, y);
      }
    }
  }
  function overlaps(r, rooms, margin) {
    const b = bounds(r);
    return rooms.some(o => {
      const c = bounds(o);
      return b.x0 - margin <= c.x1 && b.x1 + margin >= c.x0 && b.y0 - margin <= c.y1 && b.y1 + margin >= c.y0;
    });
  }
  function placeRoom(room, prev, rooms, rnd) {
    const order = rnd() < 0.5 ? ['N', 'E', 'W'] : rnd() < 0.5 ? ['E', 'N', 'W'] : ['W', 'N', 'E'];
    if (prev.dir) order.sort((a, b) => (a === OPPOSITE[prev.dir]) - (b === OPPOSITE[prev.dir]));
    for (let attempt = 0; attempt < 3; attempt++)
      for (const dir of order) {
        const len = 4 + Math.floor(rnd() * 4) + attempt * 3,
          side = Math.round((rnd() * 2 - 1) * 2),
          [sx, sy] = STEP[dir];
        room.cx = prev.cx + sx * ((prev.w - 1) / 2 + len + (room.w - 1) / 2) + (sy ? side : 0);
        room.cy = prev.cy + sy * ((prev.h - 1) / 2 + len + (room.h - 1) / 2) + (sx ? side : 0);
        const b = bounds(room);
        if (b.x0 < 8 || b.y0 < 8 || b.x1 > MAPW - 8 || b.y1 > ENTRY.y - 6) continue;
        if (overlaps(room, rooms, 4)) continue;
        const others = rooms.filter(o => o !== prev);
        let clash = false;
        eachPathCell(corridorPoints(prev, room, dir), (x, y) => {
          if (others.some(o => overlaps({ cx: x, cy: y, w: 3, h: 3 }, [o], 1))) clash = true;
        });
        if (clash) continue;
        room.dir = dir;
        return;
      }
    // Repli : plein nord, loin de tout.
    room.cx = prev.cx;
    room.cy = prev.cy - ((prev.h - 1) / 2 + 12 + (room.h - 1) / 2);
    room.dir = 'N';
  }
  function planDungeon(i) {
    if (PLANS[i]) return PLANS[i];
    const d = instances[i],
      th = THEMES[i],
      rnd = seeded(i),
      seq = d.raid
        ? ['entry', 'trash', 'boss', 'trash', 'trash', 'boss', 'trash', 'boss']
        : ['entry', 'trash', 'trash', 'trash', 'boss'],
      rooms = [];
    let stage = 0;
    seq.forEach((kind, k) => {
      const final = k === seq.length - 1;
      let w = 11,
        h = 9;
      if (kind === 'trash') {
        w = 11 + 2 * Math.floor(rnd() * 3);
        h = 9 + 2 * Math.floor(rnd() * 3);
      } else if (kind === 'boss') {
        w = d.raid && final ? 27 : d.raid ? 23 : 21;
        h = d.raid && final ? 21 : 17;
      }
      const room = { kind, w, h, stage: kind === 'boss' ? stage++ : -1 };
      if (!k) {
        room.cx = ENTRY.x;
        room.cy = ENTRY.y - 2;
      } else placeRoom(room, rooms[k - 1], rooms, rnd);
      rooms.push(room);
    });
    const links = rooms.slice(1).map((room, k) => ({
      from: k,
      to: k + 1,
      dir: room.dir,
      points: corridorPoints(rooms[k], room, room.dir)
    }));
    // Herses : à la sortie de chaque salle de boss qui n'est pas la dernière.
    const gates = [];
    for (const link of links) {
      const a = rooms[link.from];
      if (a.kind !== 'boss') continue;
      const b = bounds(a),
        cells = [];
      // Toute la ligne du mur côté sortie ; seules les cases du couloir deviendront herse.
      if (link.dir === 'N') for (let x = b.x0 - 1; x <= b.x1 + 1; x++) cells.push([x, b.y0 - 1]);
      if (link.dir === 'E') for (let y = b.y0 - 1; y <= b.y1 + 1; y++) cells.push([b.x1 + 1, y]);
      if (link.dir === 'W') for (let y = b.y0 - 1; y <= b.y1 + 1; y++) cells.push([b.x0 - 1, y]);
      gates[a.stage] = { cells, dir: link.dir };
    }
    for (const room of rooms) {
      room.doors = links
        .filter(l => l.from === rooms.indexOf(room) || l.to === rooms.indexOf(room))
        .map(l => (l.from === rooms.indexOf(room) ? l.dir : OPPOSITE[l.dir]));
    }
    const plan = {
      index: i,
      theme: th,
      rooms,
      links,
      gates,
      bossCount: stage,
      props: [],
      decals: [],
      lights: [],
      trash: []
    };
    plan.grid = carve(plan, i, rnd);
    PLANS[i] = plan;
    return plan;
  }
  function carve(plan, i, rnd) {
    const th = plan.theme,
      grid = Array.from({ length: MAPH }, () => Array(MAPW).fill(th.shape === 'void' ? HAZARD : WALL)),
      inMap = (x, y) => x > 2 && y > 2 && x < MAPW - 3 && y < MAPH - 3,
      set = (x, y, t) => inMap(x, y) && (grid[y][x] = t),
      solid = new Set();
    plan.solid = solid;
    // Salles selon la forme du thème.
    for (const room of plan.rooms) {
      const b = bounds(room),
        rx = (room.w - 1) / 2,
        ry = (room.h - 1) / 2;
      for (let y = b.y0; y <= b.y1; y++)
        for (let x = b.x0; x <= b.x1; x++) {
          const dx = (x - room.cx) / (rx + 0.5),
            dy = (y - room.cy) / (ry + 0.5),
            e = dx * dx + dy * dy,
            cross = Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1;
          let inside = true;
          if (th.shape === 'cave') inside = e < 0.72 + field(x, y, 3.2, i + 40) * 0.42 || (cross && e < 1.05);
          else if (th.shape === 'pit') inside = e < 1.02 || (cross && e < 1.3);
          else if (th.shape === 'void') {
            const cut = Math.floor(Math.min(room.w, room.h) / 4);
            inside = Math.min(x - b.x0, b.x1 - x) + Math.min(y - b.y0, b.y1 - y) >= cut;
          }
          if (inside) set(x, y, FLOOR);
        }
    }
    // Couloirs (ponts au-dessus du vide pour les thèmes célestes).
    const cw = 1;
    for (const link of plan.links)
      eachPathCell(link.points, (x, y) => {
        for (let oy = -cw; oy <= cw; oy++)
          for (let ox = -cw; ox <= cw; ox++) {
            const jag =
              th.shape === 'cave' && Math.abs(ox) + Math.abs(oy) === 2 && hash(x + ox, y + oy, i) < 0.4;
            if (!jag && grid[y + oy]?.[x + ox] !== FLOOR) set(x + ox, y + oy, FLOOR);
          }
      });
    // Dangers : mares, coulées, gouffres ou sang, toujours hors du passage central.
    for (const room of plan.rooms) {
      if (room.kind === 'entry') continue;
      const b = bounds(room),
        count = th.hazard.pools + (room.kind === 'boss' && th.hazard.pools ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const px = b.x0 + 2 + Math.floor(rnd() * (room.w - 4)),
          py = b.y0 + 2 + Math.floor(rnd() * (room.h - 4)),
          rad = 1.2 + rnd() * 1.4;
        let placed = 0;
        for (let y = Math.floor(py - rad); y <= py + rad; y++)
          for (let x = Math.floor(px - rad); x <= px + rad; x++) {
            if (Math.hypot(x - px, y - py) > rad) continue;
            if (Math.abs(x - room.cx) <= 2 || Math.abs(y - room.cy) <= 2) continue;
            if (grid[y]?.[x] !== FLOOR) continue;
            set(x, y, HAZARD);
            placed++;
          }
        if (placed && th.hazard.glow)
          plan.lights.push({ x: px + 0.5, y: py + 0.5, r: 150, col: th.hazard.glow });
      }
      // La Fosse : un anneau de gouffre autour de l'arène, franchi par quatre passerelles.
      if (th.shape === 'pit' && room.kind === 'boss') {
        const rx = (room.w - 1) / 2,
          ry = (room.h - 1) / 2;
        for (let y = b.y0; y <= b.y1; y++)
          for (let x = b.x0; x <= b.x1; x++) {
            const dx = (x - room.cx) / rx,
              dy = (y - room.cy) / ry,
              e = Math.sqrt(dx * dx + dy * dy);
            if (e > 0.62 && e < 0.8 && Math.abs(x - room.cx) > 1 && Math.abs(y - room.cy) > 1)
              set(x, y, HAZARD);
          }
      }
    }
    // Tapis, rails, runes ou passerelles le long du chemin principal.
    for (const link of plan.links)
      eachPathCell(link.points, (x, y) => {
        const aw = th.accent.width;
        for (let oy = -aw; oy <= aw; oy++)
          for (let ox = -aw; ox <= aw; ox++)
            if (grid[y + oy]?.[x + ox] === FLOOR) set(x + ox, y + oy, ACCENT);
      });
    decorate(plan, grid, rnd, solid, set);
    // Herses fermées.
    plan.gates.forEach(g => {
      g.cells = g.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
      g.under = g.cells.map(([x, y]) => grid[y][x]);
      g.cells.forEach(([x, y]) => set(x, y, GATE));
    });
    return grid;
  }
  function decorate(plan, grid, rnd, solid, set) {
    const th = plan.theme,
      free = (x, y) =>
        grid[y]?.[x] === FLOOR && !plan.props.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2);
    const addProp = (x, y, kind, extra = {}) => {
      plan.props.push({ x, y, kind, ...extra });
      if (SOLID_PROPS.has(kind)) {
        set(x, y, WALL);
        solid.add(y * MAPW + x);
      }
    };
    let trashLeft = plan.rooms.filter(r => r.kind === 'trash').length;
    const trashTotal = 4 + plan.index * 2;
    let trashPlaced = 0;
    plan.rooms.forEach((room, k) => {
      const b = bounds(room);
      // Torches, bannières et veines de mithril sur le mur du fond.
      if (th.wallProps.length)
        for (let x = b.x0 + 1, n = k; x <= b.x1 - 1; x += 3) {
          if (Math.abs(x - room.cx) <= 2) continue;
          for (let y = b.y0 - 1; y <= room.cy; y++) {
            if (grid[y][x] === WALL && WALKABLE(grid[y + 1]?.[x]) && !solid.has(y * MAPW + x)) {
              const kind = th.wallProps[n++ % th.wallProps.length];
              plan.props.push({ x, y, kind, wall: true });
              break;
            }
            if (WALKABLE(grid[y][x])) break;
          }
        }
      // Colonnes des grandes salles, symétriques, hors des portes.
      if (
        (th.shape === 'hall' || th.shape === 'void') &&
        room.w >= 13 &&
        room.h >= 11 &&
        room.kind !== 'entry'
      ) {
        const kind = th.floorProps.includes('pillarlight') && room.kind === 'boss' ? 'pillarlight' : 'pillar';
        for (let y = b.y0 + 3; y <= b.y1 - 3; y += 4)
          if (Math.abs(y - room.cy) > 2)
            for (const x of [b.x0 + 3, b.x1 - 3]) if (free(x, y) && grid[y][x] === FLOOR) addProp(x, y, kind);
      }
      if (room.kind === 'entry') {
        plan.decals.push({ x: ENTRY.x, y: ENTRY.y, kind: 'portal' });
        plan.title = { x: room.cx, y: b.y0 - 0.6 };
        return;
      }
      // Objets au sol, hors de la croix centrale où passent le joueur et les monstres.
      const count = Math.floor((room.w * room.h) / (room.kind === 'boss' ? 34 : 24));
      for (let n = 0, tries = 0; n < count && tries < 80; tries++) {
        const x = b.x0 + 1 + Math.floor(rnd() * (room.w - 2)),
          y = b.y0 + 1 + Math.floor(rnd() * (room.h - 2));
        if (Math.abs(x - room.cx) <= 2 || Math.abs(y - room.cy) <= 2 || !free(x, y)) continue;
        if (room.kind === 'boss' && Math.hypot(x - room.cx, y - room.cy) < 5) continue;
        addProp(x, y, th.floorProps[Math.floor(rnd() * th.floorProps.length)]);
        n++;
      }
      if (th.hazard.style === 'blood' || th.key === 'fosse')
        for (let n = 0; n < 3; n++)
          plan.decals.push({
            x: b.x0 + 1 + rnd() * (room.w - 2),
            y: b.y0 + 1 + rnd() * (room.h - 2),
            kind: 'splat'
          });
      if (room.kind === 'boss') {
        // Pièce maîtresse sur un côté sans porte, de préférence face à l'entrée.
        const entry = room.doors[0],
          sides = [OPPOSITE[entry], 'N', 'E', 'W', 'S'].filter(s => !room.doors.includes(s)),
          side = sides[0] || 'N',
          [sx, sy] = STEP[side],
          px = room.cx + sx * ((room.w - 1) / 2 - 2),
          py = room.cy + sy * ((room.h - 1) / 2 - 2);
        plan.props.push({ x: px, y: py, kind: th.centerpiece, center: true });
        for (let o = -1; o <= 1; o++) {
          const cx = px + (sy ? o : 0),
            cy = py + (sx ? o : 0);
          if (grid[cy][cx] !== HAZARD) {
            set(cx, cy, WALL);
            solid.add(cy * MAPW + cx);
          }
        }
        plan.decals.push({ x: room.cx, y: room.cy, kind: th.decal || 'runecircle', boss: room.stage });
        room.boss = { x: room.cx + sx * 2, y: room.cy + sy * 2 };
        room.chest = { x: room.cx + 0.5, y: room.cy + 0.5 };
        // Gardes du boss dans les raids.
        if (instances[plan.index].raid)
          for (const o of [-3, 3])
            plan.trash.push({
              x: room.boss.x + (sy ? o : -sx * 2),
              y: room.boss.y + (sx ? o : -sy * 2),
              type: o < 0 ? 0 : 1
            });
        return;
      }
      // Groupes d'ennemis répartis dans les salles de passage.
      const share = Math.round((trashTotal - trashPlaced) / trashLeft--);
      for (let n = 0, tries = 0; n < share && tries < 60; tries++) {
        const a = rnd() * Math.PI * 2,
          rr = 1.5 + rnd() * Math.min(room.w, room.h) * 0.28,
          x = Math.round(room.cx + Math.cos(a) * rr),
          y = Math.round(room.cy + Math.sin(a) * rr);
        if (!WALKABLE(grid[y]?.[x]) || plan.trash.some(t => t.x === x && t.y === y)) continue;
        plan.trash.push({ x, y, type: trashPlaced % 2 });
        trashPlaced++;
        n++;
      }
    });
  }
  // Grille de l'instance : murs, sols, dangers et herses fermées.
  function makeDungeon(index) {
    const plan = planFor(index);
    return plan.grid.map(row => row.slice());
  }
  function planFor(index) {
    if (index === 'arena') return planArena();
    return instances[index] ? planDungeon(index) : null;
  }
  // Plan du colisée, au même format que celui d'un donjon : le rendu des instances le dessine tel quel.
  function planArena() {
    if (PLANS.arena) return PLANS.arena;
    const th = THEMES.arena,
      { cx, cy, r, gateY } = ARENA,
      grid = Array.from({ length: MAPH }, () => Array(MAPW).fill(WALL)),
      solid = new Set(),
      plan = {
        index: 'arena',
        arena: true,
        theme: th,
        rooms: [],
        links: [],
        gates: [],
        bossCount: 12,
        props: [],
        decals: [],
        lights: [],
        trash: [],
        solid
      };
    for (let y = cy - 14; y <= cy + 14; y++)
      for (let x = cx - 14; x <= cx + 14; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) grid[y][x] = d > r - 1.1 ? ACCENT : FLOOR;
      }
    for (let y = cy + 11; y <= ENTRY.y - 3; y++) for (let x = cx - 2; x <= cx + 2; x++) grid[y][x] = FLOOR;
    for (let y = ENTRY.y - 3; y <= ENTRY.y + 3; y++)
      for (let x = cx - 5; x <= cx + 5; x++) grid[y][x] = FLOOR;
    const solidProp = (x, y, kind) => {
      plan.props.push({ x, y, kind });
      grid[y][x] = WALL;
      solid.add(y * MAPW + x);
    };
    // Bannières et torches sur le mur de la piste, côté nord.
    let n = 0;
    for (let x = cx - 11; x <= cx + 11; x += 2) {
      if (Math.abs(x - cx) <= 1) continue;
      for (let y = cy - 15; y < cy; y++)
        if (grid[y][x] === WALL && grid[y + 1][x] !== WALL) {
          plan.props.push({ x, y, kind: th.wallProps[n++ % 2], wall: true });
          break;
        }
    }
    // Loge d'honneur : deux statues ; quatre braseros sur les diagonales ; râteliers dans l'antichambre.
    solidProp(cx - 3, cy - 11, 'statue');
    solidProp(cx + 3, cy - 11, 'statue');
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ])
      solidProp(cx + sx * 8, cy + sy * 8, 'brazier');
    solidProp(cx - 5, ENTRY.y - 3, 'rack');
    solidProp(cx + 5, ENTRY.y - 3, 'rack');
    plan.props.push({ x: cx - 5, y: ENTRY.y + 2, kind: 'crate' });
    plan.decals.push({ x: ENTRY.x, y: ENTRY.y, kind: 'portal' });
    plan.decals.push({ x: cx, y: cy, kind: 'runecircle' });
    plan.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 520, col: '#ffe2b0' });
    plan.title = { x: cx, y: ENTRY.y - 4.4 };
    // Herse de la piste : ouverte entre les vagues, fermée pendant les combats (canaan-arena).
    const cells = [];
    for (let x = cx - 2; x <= cx + 2; x++) cells.push([x, gateY]);
    plan.gates.push({ cells, under: cells.map(() => FLOOR), dir: 'N' });
    plan.grid = grid;
    PLANS.arena = plan;
    return plan;
  }
  // Géométrie de la piste pour canaan-arena : centre et rayon en pixels, cases de la herse.
  function arenaLayout() {
    const plan = planArena();
    return {
      x: (ARENA.cx + 0.5) * TS,
      y: (ARENA.cy + 0.5) * TS,
      r: ARENA.r * TS,
      gate: plan.gates[0].cells.map(([x, y]) => [x, y]),
      entry: { x: ENTRY.x * TS, y: ENTRY.y * TS }
    };
  }
  // Gradins du colisée : rangées de grès et public animé, sur l'anneau de murs autour de la piste.
  const CROWD = ['#7a1424', '#2a4a7a', '#c8a050', '#3a6a3a', '#6a3a7a', '#a85a2a', '#d8d0c0', '#4a4a52'];
  function drawArenaStands(c) {
    const { cx, cy, r } = ARENA,
      cheer = CANAAN_ARENA.cheer();
    for (let y = cy - 20; y <= cy + 15; y++)
      for (let x = cx - 20; x <= cx + 20; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < r + 0.6 || d > r + 7 || game.world.tiles[y]?.[x] !== WALL) continue;
        if (game.world.tiles[y + 1]?.[x] !== WALL) continue;
        const X = x * TS,
          Y = y * TS;
        if (X < camX - TS || X > camX + W || Y < camY - TS || Y > camY + H) continue;
        const band = Math.floor(d - r);
        R(c, X, Y, TS, TS, band % 2 ? '#7a6248' : '#8a7052');
        R(c, X, Y, TS, 4, band % 2 ? '#a08462' : '#b0946e');
        R(c, X, Y + 26, TS, 3, '#5a4632');
        if (band > 5) continue;
        for (let k = 0; k < 3; k++) {
          const hsh = hash(x, y, k);
          if (hsh < 0.18) continue;
          const px = X + 6 + k * 14,
            jump =
              cheer > 0 && hash(x, k, y) < 0.7 ? Math.abs(Math.sin(time * 0.35 + hsh * 9)) * 6 * cheer : 0,
            py = Y + 6 + (hsh > 0.6 ? 18 : 0) - jump;
          R(c, px, py + 7, 10, 9, CROWD[Math.floor(hsh * 97) % CROWD.length]);
          R(c, px + 2, py, 6, 7, hsh > 0.5 ? '#e0b48a' : '#a87a5a');
          if (jump > 2) R(c, px - 2, py + 2, 2, 6, '#e0b48a');
        }
      }
  }

  // ---------------------------------------------------------------- Ennemis et boss
  function spawnInstanceBoss(i) {
    const d = instances[i],
      th = THEMES[i],
      plan = planFor(i),
      down = game.world.instance?.index === i ? game.world.instance.bossesDown || 0 : 0,
      names = d.bosses || [d.boss];
    plan.rooms
      .filter(r => r.kind === 'boss' && r.stage >= down)
      .forEach(r => {
        const look = th.bosses[r.stage] || th.bosses[0],
          final = r.stage === plan.bossCount - 1;
        game.world.monsters.push({
          x: (r.boss.x + 0.5) * TS,
          y: (r.boss.y + 0.5) * TS,
          hp: 260 + i * 220,
          mhp: 260 + i * 220,
          t: names[r.stage] || d.boss,
          r: d.raid ? 36 : 26,
          cd: 0,
          g: 90 + i * 60,
          boss: true,
          bossStage: r.stage,
          finalBoss: final,
          look: look.look,
          pal: look.pal,
          lookOpts: look,
          mobColor: d.color,
          scale: d.raid ? (final ? 4.1 : 3.5) : 3.3
        });
      });
    if (!down)
      for (const spot of plan.trash) {
        const type = th.mobs[spot.type];
        game.world.monsters.push({
          x: (spot.x + 0.5) * TS,
          y: (spot.y + 0.5) * TS,
          hp: 60 + i * 22,
          mhp: 60 + i * 22,
          t: type.name,
          mobColor: type.pal[0],
          look: type.look,
          pal: type.pal,
          r: 13,
          cd: 0,
          g: 12 + i * 5
        });
      }
    // Ennemis au niveau de l'instance (boss un peu plus haut) ; la difficulté et le nombre de héros du groupe
    // multiplient leurs PV (canaanSetupMob, scaleBossHp).
    for (const mob of game.world.monsters) {
      canaanMobLevel(mob);
      canaanSetupMob(mob);
    }
    game.world.monsters.forEach(scaleBossHp);
  }
  // Mort d'un boss d'instance : ouvre la herse suivante ou termine l'instance. Renvoie true au dernier boss.
  function onInstanceBossDown(m) {
    if (!game.world.instance) return false;
    const plan = planFor(game.world.instance.index),
      total = plan ? plan.bossCount : 1;
    game.world.instance.bossesDown = (game.world.instance.bossesDown || 0) + 1;
    if (game.world.instance.bossesDown >= total) return true;
    const gate = plan.gates[game.world.instance.bossesDown - 1];
    if (gate)
      gate.cells.forEach(([x, y], k) => {
        if (game.world.tiles[y][x] === GATE) game.world.tiles[y][x] = gate.under[k];
        burst((x + 0.5) * TS, (y + 0.5) * TS, THEMES[game.world.instance.index].rune, 10);
      });
    toast(
      '⚔️ ' +
        m.t +
        ' vaincu (' +
        game.world.instance.bossesDown +
        '/' +
        total +
        ') — ' +
        (THEMES[game.world.instance.index].gate === 'barrier' ? 'la barrière se dissipe.' : 'la herse se lève.')
    );
    return false;
  }
  function dungeonChestSpot(index) {
    const plan = planFor(index),
      room = plan?.rooms.filter(r => r.kind === 'boss').pop();
    return room ? room.chest : { x: ENTRY.x, y: ENTRY.y - 6 };
  }

  // ---------------------------------------------------------------- Textures des cases
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  const ART = [];
  function rect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function specks(g, n, cols, seed, size = 3) {
    for (let k = 0; k < n; k++) {
      const x = Math.floor(hash(k, seed, 3) * 16) * 3,
        y = Math.floor(hash(seed, k, 5) * 16) * 3;
      g.globalAlpha = 0.25 + hash(k, seed, 9) * 0.5;
      rect(g, x, y, size * (k % 3 === 0 ? 2 : 1), size - 1, cols[k % cols.length]);
    }
    g.globalAlpha = 1;
  }
  function paintFloor(g, p, v, style) {
    rect(g, 0, 0, 48, 48, p.a);
    const s = v * 31 + 7;
    if (style === 'dirt' || style === 'gravel') {
      specks(g, 46, [p.b, p.c, p.b], s);
      for (let k = 0; k < (style === 'gravel' ? 9 : 3); k++) {
        const x = 4 + hash(k, s, 1) * 38,
          y = 4 + hash(s, k, 2) * 38;
        rect(g, x, y + 2, 6, 2, p.b);
        rect(g, x, y, 6, 3, p.c);
      }
    } else if (style === 'stone') {
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.45;
        rect(
          g,
          hash(k, s, 4) * 36,
          hash(s, k, 6) * 36,
          9 + hash(k, s) * 9,
          6 + hash(s, k) * 8,
          k % 2 ? p.b : p.c
        );
      }
      g.globalAlpha = 1;
      specks(g, 26, [p.b, p.c], s);
      rect(g, 6 + v * 7, 30, 14, 1, p.b);
      rect(g, 19 + v * 7, 31, 1, 6, p.b);
    } else if (style === 'tiles' || style === 'marble' || style === 'basalt' || style === 'arcane') {
      for (let ty = 0; ty < 2; ty++)
        for (let tx = 0; tx < 2; tx++) {
          const shade = hash(tx + v * 2, ty, 11);
          g.globalAlpha = 0.18;
          rect(g, tx * 24, ty * 24, 24, 24, shade > 0.5 ? p.c : p.b);
          g.globalAlpha = 1;
        }
      if (style === 'marble') {
        g.strokeStyle = p.b;
        g.globalAlpha = 0.55;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, 10 + v * 6);
        g.lineTo(18, 20 + v * 3);
        g.lineTo(34, 14 + v * 5);
        g.lineTo(48, 26 - v * 2);
        g.stroke();
        g.globalAlpha = 1;
        rect(g, 0, 0, 48, 1, p.c);
        rect(g, 0, 0, 1, 48, p.c);
        rect(g, 23, 23, 2, 2, p.c);
      } else {
        rect(g, 0, 23, 48, 2, p.b);
        rect(g, 23, 0, 2, 48, p.b);
        rect(g, 0, 0, 48, 1, p.b);
        rect(g, 0, 0, 1, 48, p.b);
        rect(g, 1, 1, 22, 1, p.c);
        rect(g, 25, 25, 22, 1, p.c);
      }
      if (style === 'basalt' && v === 3) {
        rect(g, 6, 12, 10, 1, '#ff7a2a');
        rect(g, 15, 12, 1, 7, '#ff7a2a');
        rect(g, 15, 18, 12, 1, '#ffb14a');
      }
      if (style === 'arcane' && v % 2 === 0) {
        g.globalAlpha = 0.7;
        rect(g, 8, 11, 8, 1, p.glow);
        rect(g, 32, 35, 8, 1, p.glow);
        rect(g, 11, 8, 1, 7, p.glow);
        rect(g, 36, 32, 1, 7, p.glow);
        g.globalAlpha = 1;
      }
      if (style === 'tiles' && v === 3) {
        rect(g, 4, 6, 9, 1, p.b);
        rect(g, 12, 6, 1, 8, p.b);
      }
    } else if (style === 'flagstone') {
      for (let row = 0; row < 3; row++) {
        let x = -((v * 7 + row * 11) % 18);
        while (x < 48) {
          const w = 15 + Math.floor(hash(x, row, v) * 10);
          g.globalAlpha = 0.25;
          rect(g, x, row * 16, w, 16, hash(row, x, v + 3) > 0.5 ? p.c : p.b);
          g.globalAlpha = 1;
          rect(g, x, row * 16, 2, 16, p.b);
          rect(g, x + 2, row * 16 + 1, w - 3, 1, p.c);
          x += w;
        }
        rect(g, 0, row * 16, 48, 2, p.b);
      }
    } else if (style === 'planks' || style === 'logs') {
      // Plancher (intérieurs) : lames ou rondins, arête claire, joint sombre, raccords cloués et nœuds.
      const n = style === 'logs' ? 3 : 4,
        hgt = 48 / n;
      for (let row = 0; row < n; row++) {
        const y = row * hgt,
          seam = 4 + Math.floor(hash(row, v, 17) * 38);
        g.globalAlpha = 0.25;
        rect(g, 0, y, 48, hgt, hash(row, v, 13) > 0.5 ? p.c : p.b);
        g.globalAlpha = 1;
        rect(g, 0, y, 48, 1, p.c);
        rect(g, 0, y + hgt - 2, 48, 2, p.b);
        rect(g, seam, y, 2, hgt - 2, p.b);
        rect(g, seam + 2, y + 1, 1, hgt - 3, p.c);
        rect(g, seam - 4, y + hgt / 2 - 1, 2, 2, p.b);
        rect(g, seam + 5, y + hgt / 2 - 1, 2, 2, p.b);
        if (hash(v, row, 19) > 0.55) {
          const kx = 6 + hash(row, v, 21) * 32;
          rect(g, kx, y + hgt / 2 - 2, 6, 3, p.b);
          rect(g, kx + 1, y + hgt / 2 - 1, 3, 1, p.c);
        }
      }
      specks(g, 12, [p.b, p.c], s, 2);
    } else if (style === 'starstone') {
      specks(g, 18, [p.b], s, 4);
      for (let k = 0; k < 7; k++) {
        g.globalAlpha = 0.35 + hash(k, s) * 0.6;
        rect(g, hash(k, s, 2) * 47, hash(s, k, 8) * 47, 1, 1, p.c);
      }
      if (v === 0) {
        g.globalAlpha = 0.25;
        g.strokeStyle = p.c;
        g.beginPath();
        g.moveTo(8 + v * 3, 10);
        g.lineTo(22, 18 + v * 2);
        g.lineTo(36 - v * 2, 12);
        g.stroke();
        g.globalAlpha = 1;
      }
      rect(g, 0, 0, 48, 1, '#2e3670');
      rect(g, 0, 0, 1, 48, '#2e3670');
    }
  }
  function paintAccent(g, p, floor, v) {
    const style = p.style;
    if (style === 'gravel') return paintFloor(g, p, v, 'gravel');
    if (style === 'rails') return paintFloor(g, floor, v, floor.style);
    if (style === 'carpet') {
      rect(g, 0, 0, 48, 48, p.a);
      g.globalAlpha = 0.5;
      for (let k = 0; k < 2; k++) {
        g.fillStyle = p.b;
        g.beginPath();
        g.moveTo(24, k * 24 + 4);
        g.lineTo(34, k * 24 + 12);
        g.lineTo(24, k * 24 + 20);
        g.lineTo(14, k * 24 + 12);
        g.fill();
      }
      g.globalAlpha = 0.28;
      rect(g, 22, 10, 4, 4, p.c);
      rect(g, 22, 34, 4, 4, p.c);
      g.globalAlpha = 1;
      return;
    }
    if (style === 'grate') {
      rect(g, 0, 0, 48, 48, p.c);
      g.globalAlpha = 0.55;
      rect(g, 0, 0, 48, 48, '#200800');
      g.globalAlpha = 1;
      for (let k = 0; k < 48; k += 8) {
        rect(g, k, 0, 3, 48, p.a);
        rect(g, 0, k, 48, 3, p.a);
      }
      rect(g, 0, 0, 48, 2, p.b);
      return;
    }
    // Runes : dalles sombres gravées d'un glyphe lumineux.
    rect(g, 0, 0, 48, 48, p.a);
    rect(g, 0, 0, 48, 2, p.b);
    rect(g, 0, 0, 2, 48, p.b);
    rect(g, 3, 3, 42, 1, p.b);
    g.strokeStyle = p.c;
    g.globalAlpha = 0.75;
    g.lineWidth = 2;
    g.beginPath();
    if (v === 0) {
      g.arc(24, 24, 9, 0, Math.PI * 2);
      g.moveTo(24, 12);
      g.lineTo(24, 36);
    } else if (v === 1) {
      g.moveTo(15, 32);
      g.lineTo(24, 14);
      g.lineTo(33, 32);
      g.closePath();
    } else if (v === 2) {
      g.moveTo(14, 24);
      g.lineTo(34, 24);
      g.moveTo(18, 16);
      g.lineTo(30, 32);
    } else {
      g.arc(24, 24, 5, 0, Math.PI * 2);
    }
    g.stroke();
    g.globalAlpha = 1;
  }
  function paintFace(g, w, v) {
    rect(g, 0, 0, 48, 48, w.face);
    if (w.style === 'brick') {
      for (let row = 0; row < 4; row++) {
        const y = 10 + row * 10,
          off = row % 2 ? 0 : 8;
        rect(g, 0, y, 48, 2, w.dark);
        for (let x = -off; x < 48; x += 16) {
          rect(g, x, y, 2, 10, w.dark);
          rect(g, x + 2, y + 2, 12, 1, w.light);
          if (hash(x, row, v) > 0.7) {
            g.globalAlpha = 0.3;
            rect(g, x + 3, y + 3, 11, 6, w.dark);
            g.globalAlpha = 1;
          }
        }
      }
    } else if (w.style === 'marble') {
      rect(g, 4, 12, 40, 32, w.light);
      rect(g, 6, 14, 36, 28, w.face);
      rect(g, 0, 10, 48, 2, '#d4aa3a');
      rect(g, 22, 18, 4, 20, w.dark);
    } else {
      for (let k = 0; k < 7; k++) {
        const y = 10 + k * 5 + Math.floor(hash(k, v, 2) * 3),
          x = Math.floor(hash(v, k, 4) * 30);
        rect(g, x, y, 10 + hash(k, v) * 16, 3, k % 2 ? w.dark : w.light);
      }
      specks(g, 16, [w.dark, w.light], v + 50);
    }
    // Couronnement du mur et pied ombré.
    rect(g, 0, 0, 48, 10, w.top);
    rect(g, 0, 9, 48, 2, w.light);
    g.globalAlpha = 0.45;
    rect(g, 0, 43, 48, 5, '#000');
    g.globalAlpha = 1;
  }
  function paintHazard(g, h, v) {
    rect(g, 0, 0, 48, 48, h.a);
    const wrap = (x, y, w, hh, col) => {
      rect(g, x, y, w, hh, col);
      if (x + w > 48) rect(g, x - 48, y, w, hh, col);
    };
    if (h.style === 'water') {
      for (let k = 0; k < 7; k++) wrap(hash(k, v, 1) * 48, 4 + k * 6, 9, 2, k % 2 ? h.c : h.b);
    } else if (h.style === 'lava') {
      for (let k = 0; k < 9; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 5) * 46, 8 + hash(k, k) * 10, 3, h.b);
      for (let k = 0; k < 5; k++) wrap(hash(k, v, 7) * 48, hash(v, k, 9) * 46, 4, 2, h.c);
      g.globalAlpha = 0.5;
      for (let k = 0; k < 3; k++) wrap(hash(k, v, 11) * 48, hash(v, k, 13) * 44, 10, 5, '#5a1806');
      g.globalAlpha = 1;
    } else if (h.style === 'stars' || h.style === 'void') {
      g.globalAlpha = 0.35;
      for (let k = 0; k < 4; k++) wrap(hash(k, v, 2) * 48, hash(v, k, 4) * 40, 16, 8, h.b);
      g.globalAlpha = 1;
      for (let k = 0; k < 9; k++)
        wrap(hash(k, v, 6) * 48, hash(v, k, 8) * 48, k % 4 ? 1 : 2, k % 4 ? 1 : 2, h.c);
    } else if (h.style === 'clouds') {
      for (let k = 0; k < 6; k++) {
        const x = hash(k, v, 1) * 48,
          y = hash(v, k, 2) * 44,
          r = 6 + hash(k, v) * 7;
        for (const dx of [0, -48]) {
          g.fillStyle = k % 2 ? h.b : h.c;
          g.globalAlpha = 0.6;
          g.beginPath();
          g.arc(x + dx, y, r, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
    } else if (h.style === 'blood') {
      for (let k = 0; k < 5; k++) wrap(hash(k, v, 1) * 48, hash(v, k, 2) * 46, 7, 2, h.b);
      for (let k = 0; k < 3; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 4) * 46, 3, 1, h.c);
    } else {
      specks(g, 10, [h.b, h.c], v + 90, 2);
    }
  }
  function themeArt(i) {
    if (ART[i]) return ART[i];
    const th = THEMES[i],
      mk = fn =>
        [0, 1, 2, 3].map(v => {
          const c = canvas(48, 48),
            g = c.getContext('2d');
          fn(g, v);
          return c;
        });
    const art = {
      floor: mk((g, v) => paintFloor(g, th.floor, v, th.floor.style)),
      accent: mk((g, v) => paintAccent(g, th.accent, th.floor, v)),
      face: mk((g, v) => paintFace(g, th.wall, v)),
      hazard: mk((g, v) => paintHazard(g, th.hazard, v))
    };
    const top = canvas(48, 48),
      tg = top.getContext('2d');
    rect(tg, 0, 0, 48, 48, th.wall.top);
    specks(tg, 10, [th.wall.dark], 77);
    art.top = top;
    ART[i] = art;
    return art;
  }
  const shadowTile = (() => {
    let c = null;
    return () => {
      if (c) return c;
      c = canvas(48, 48);
      const g = c.getContext('2d'),
        grad = g.createLinearGradient(0, 0, 0, 18);
      grad.addColorStop(0, 'rgba(0,0,0,.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 48, 18);
      return c;
    };
  })();
  function drawScrolled(c, img, x, y, off) {
    off = ((Math.floor(off) % 48) + 48) % 48;
    if (!off) return c.drawImage(img, x, y);
    c.drawImage(img, off, 0, 48 - off, 48, x, y, 48 - off, 48);
    c.drawImage(img, 0, 0, off, 48, x + 48 - off, y, off, 48);
  }
  // Dessin d'une case d'instance, appelé par la boucle de rendu à la place des tuiles du monde.
  function drawDungeonTile(c, x, y, t) {
    const i = game.world.instance.index,
      th = THEMES[i],
      art = themeArt(i),
      plan = planFor(i),
      X = x * TS,
      Y = y * TS,
      v = (x * 7 + y * 13) & 3,
      at = (xx, yy) => (plan.solid.has(yy * MAPW + xx) ? FLOOR : tileAt(xx, yy));
    if (t === WALL && !plan.solid.has(y * MAPW + x)) {
      const below = at(x, y + 1);
      if (WALKABLE(below) || below === GATE || below === HAZARD) {
        c.drawImage(art.face[v], X, Y);
        return;
      }
      const open = n => WALKABLE(n) || n === HAZARD || n === GATE,
        near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x - 1, y + 1), at(x + 1, y + 1), at(x, y + 2)];
      if (!near.some(open)) {
        // Roche pleine, loin des salles : presque noire.
        c.drawImage(art.top, X, Y);
        c.globalAlpha = 0.55;
        c.fillStyle = '#000';
        c.fillRect(X, Y, TS, TS);
        c.globalAlpha = 1;
        return;
      }
      // Sommet du mur au bord d'une salle : pierre visible et arête claire côté sol.
      c.fillStyle = th.wall.dark;
      c.fillRect(X, Y, TS, TS);
      c.globalAlpha = 0.5;
      c.drawImage(art.top, X, Y);
      c.globalAlpha = 1;
      c.fillStyle = th.wall.light;
      if (open(near[0])) c.fillRect(X, Y, 4, TS);
      if (open(near[1])) c.fillRect(X + TS - 4, Y, 4, TS);
      if (open(near[2])) c.fillRect(X, Y, TS, 4);
      return;
    }
    if (t === HAZARD) {
      const h = th.hazard,
        speed = h.style === 'lava' ? 0.12 : h.style === 'water' ? 0.25 : h.style === 'clouds' ? 0.18 : 0.03;
      drawScrolled(c, art.hazard[v], X, Y, time * speed + y * 9);
      if (h.style === 'lava' || h.style === 'stars') {
        const tw = hash(x, y, Math.floor(time / 20));
        if (tw > 0.85) {
          c.fillStyle = h.c;
          c.fillRect(X + tw * 40, Y + ((tw * 977) % 40), 3, 3);
        }
      }
      // Rebord : falaise sous un sol (gouffre, vide) ou margelle de pierre (liquides).
      const above = at(x, y - 1);
      if (WALKABLE(above) || above === GATE) {
        const deep = h.style === 'chasm' || h.style === 'void' || h.style === 'stars' || h.style === 'clouds';
        c.fillStyle = deep ? th.floor.b : th.wall.dark;
        c.fillRect(X, Y, TS, deep ? 14 : 5);
        if (deep) {
          c.globalAlpha = 0.5;
          c.fillStyle = '#000';
          c.fillRect(X, Y + 14, TS, 6);
          c.globalAlpha = 1;
        }
      }
      return;
    }
    // Sols, chemins et herses (dessinées ensuite par le décor).
    const accent =
      t === ACCENT ||
      (t === GATE &&
        plan.gates.some(g => g.cells.some(([gx, gy], k) => gx === x && gy === y && g.under[k] === ACCENT)));
    c.drawImage(accent ? art.accent[v] : art.floor[v], X, Y);
    if (accent) {
      const ac = th.accent,
        same = (xx, yy) => {
          const n = tileAt(xx, yy);
          return n === ACCENT || n === GATE;
        };
      if (ac.style === 'rails') {
        const horizontal = same(x - 1, y) || same(x + 1, y),
          vertical = same(x, y - 1) || same(x, y + 1);
        c.fillStyle = ac.b;
        if (vertical || !horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + 8, Y + k, 32, 5);
        if (horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + k, Y + 8, 5, 32);
        c.fillStyle = ac.c;
        if (vertical || !horizontal) {
          c.fillRect(X + 12, Y, 3, 48);
          c.fillRect(X + 33, Y, 3, 48);
        }
        if (horizontal) {
          c.fillRect(X, Y + 12, 48, 3);
          c.fillRect(X, Y + 33, 48, 3);
        }
      } else if (ac.style === 'carpet') {
        c.fillStyle = ac.c;
        if (!same(x - 1, y)) c.fillRect(X, Y, 4, TS);
        if (!same(x + 1, y)) c.fillRect(X + TS - 4, Y, 4, TS);
        if (!same(x, y - 1)) c.fillRect(X, Y, TS, 4);
        if (!same(x, y + 1)) c.fillRect(X, Y + TS - 4, TS, 4);
      }
    }
    const up = at(x, y - 1);
    if (up === WALL) c.drawImage(shadowTile(), X, Y);
  }

  // ---------------------------------------------------------------- Décor
  function R(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function flame(c, x, y, s, cols, seed = 0) {
    const f = Math.round(Math.sin(time * 0.23 + seed) * 2 * s),
      l = Math.round(Math.sin(time * 0.31 + seed * 2) * s);
    R(c, x - 5 * s, y - 8 * s + l, 10 * s, 9 * s, cols[0]);
    R(c, x - 3.5 * s, y - 14 * s + f, 7 * s, 9 * s, cols[1]);
    R(c, x - 2 * s, y - 18 * s + f, 4 * s, 6 * s, cols[1]);
    R(c, x - 2 * s, y - 7 * s, 4 * s, 6 * s, cols[2]);
  }
  function drawWallProp(c, p, th) {
    const X = p.x * TS,
      Y = p.y * TS,
      cx = X + 24,
      seed = p.x * 3 + p.y;
    switch (p.kind) {
      case 'torch':
      case 'sconce':
        R(c, cx - 2, Y + 24, 4, 14, '#4a3324');
        R(c, cx - 6, Y + 20, 12, 5, p.kind === 'sconce' ? th.pillar[1] : '#6f5137');
        flame(c, cx, Y + 20, 1, th.flame, seed);
        canaanLight(cx, Y + 30, 190, th.flame[1]);
        break;
      case 'lantern':
        R(c, cx - 1, Y + 6, 2, 14, '#2a2a2e');
        R(c, cx - 7, Y + 20, 14, 16, '#3a3a40');
        R(c, cx - 5, Y + 22, 10, 12, '#ffcf6a');
        R(c, cx - 2, Y + 25, 4, 6, '#fff6c5');
        canaanLight(cx, Y + 32, 170, '#ffcf6a');
        break;
      case 'banner':
        R(c, X + 8, Y + 10, 32, 3, '#3a2a1c');
        R(c, X + 11, Y + 13, 26, 28, th.banner[0]);
        R(c, X + 11, Y + 41, 8, 5, th.banner[0]);
        R(c, X + 29, Y + 41, 8, 5, th.banner[0]);
        R(c, X + 20, Y + 18, 8, 12, th.banner[1]);
        R(c, X + 17, Y + 22, 14, 4, th.banner[1]);
        R(c, X + 11, Y + 13, 26, 2, th.banner[1]);
        break;
      case 'roots':
        for (let k = 0; k < 4; k++) {
          const rx = X + 6 + k * 11,
            len = 14 + ((seed + k * 7) % 20);
          R(c, rx, Y + 10, 3, len, '#3b2a1a');
          R(c, rx + 2, Y + 10 + len - 6, 3, 6, '#2e2014');
        }
        break;
      case 'beam':
        R(c, X + 4, Y + 8, 7, 40, '#5e4430');
        R(c, X + 37, Y + 8, 7, 40, '#5e4430');
        R(c, X + 2, Y + 8, 44, 7, '#7a5a3e');
        R(c, X + 2, Y + 8, 44, 2, '#9a7a56');
        break;
      case 'mithril': {
        const glow = 0.6 + Math.sin(time * 0.05 + seed) * 0.25;
        c.globalAlpha = glow;
        R(c, X + 12, Y + 22, 6, 10, '#7de0ff');
        R(c, X + 20, Y + 16, 5, 16, '#c8f7ff');
        R(c, X + 27, Y + 24, 7, 8, '#7de0ff');
        R(c, X + 21, Y + 18, 2, 6, '#ffffff');
        c.globalAlpha = 1;
        canaanLight(cx, Y + 30, 120, '#7de0ff');
        break;
      }
      case 'chains':
        for (const ox of [12, 32])
          for (let k = 0; k < 5; k++) R(c, X + ox + (k % 2), Y + 10 + k * 6, 4 - (k % 2) * 2, 5, '#6a6a72');
        R(c, X + 10, Y + 40, 8, 4, '#4a4a52');
        R(c, X + 30, Y + 40, 8, 4, '#4a4a52');
        break;
      case 'skulls':
        R(c, X + 6, Y + 18, 36, 20, '#1a1214');
        for (const ox of [10, 22, 34]) {
          R(c, X + ox - 3, Y + 24, 8, 7, '#d8d0b8');
          R(c, X + ox - 2, Y + 26, 2, 2, '#1a1214');
          R(c, X + ox + 2, Y + 26, 2, 2, '#1a1214');
        }
        break;
      case 'furnace': {
        R(c, X + 4, Y + 12, 40, 36, '#2a1a14');
        R(c, X + 10, Y + 22, 28, 26, '#140806');
        const f = 0.75 + Math.sin(time * 0.12 + seed) * 0.2;
        c.globalAlpha = f;
        R(c, X + 12, Y + 30, 24, 18, '#e5522e');
        R(c, X + 16, Y + 34, 16, 14, '#f9a640');
        R(c, X + 20, Y + 38, 8, 10, '#fff1b5');
        c.globalAlpha = 1;
        canaanLight(cx, Y + 42, 230, '#ff7a2a');
        break;
      }
    }
  }
  function drawFloorProp(c, p, th) {
    const cx = p.x * TS + 24,
      by = p.y * TS + 40,
      seed = p.x * 5 + p.y * 3;
    const [pc, pd, pl] = th.pillar;
    switch (p.kind) {
      case 'pillar':
        R(c, cx - 22, by - 8, 44, 10, pd);
        R(c, cx - 17, by - 70, 34, 64, pc);
        R(c, cx - 17, by - 70, 6, 64, pl);
        R(c, cx + 9, by - 70, 8, 64, pd);
        R(c, cx - 22, by - 80, 44, 12, pl);
        R(c, cx - 20, by - 70, 40, 3, pd);
        break;
      case 'pillarlight': {
        R(c, cx - 20, by - 8, 40, 10, pd);
        const a = 0.35 + Math.sin(time * 0.04 + seed) * 0.12;
        c.globalAlpha = a;
        R(c, cx - 12, by - 130, 24, 124, th.flame[1]);
        R(c, cx - 5, by - 130, 10, 124, '#ffffff');
        c.globalAlpha = 1;
        canaanLight(cx, by - 30, 180, th.flame[1]);
        break;
      }
      case 'statue':
      case 'angelstatue':
        R(c, cx - 20, by - 12, 40, 14, pd);
        R(c, cx - 16, by - 16, 32, 6, pl);
        R(c, cx - 10, by - 60, 20, 46, pc);
        R(c, cx - 7, by - 74, 14, 14, pc);
        R(c, cx - 7, by - 74, 4, 14, pl);
        R(c, cx - 14, by - 54, 6, 24, pc);
        R(c, cx + 8, by - 54, 6, 24, pd);
        if (p.kind === 'angelstatue') {
          R(c, cx - 30, by - 66, 16, 34, pl);
          R(c, cx + 14, by - 66, 16, 34, pl);
          R(c, cx - 8, by - 80, 16, 3, '#d4aa3a');
        }
        break;
      case 'brazier':
        R(c, cx - 14, by - 4, 4, 8, '#2a2a2e');
        R(c, cx + 10, by - 4, 4, 8, '#2a2a2e');
        R(c, cx - 4, by - 12, 8, 14, '#3a3a40');
        R(c, cx - 18, by - 22, 36, 10, '#4a4a52');
        R(c, cx - 18, by - 22, 36, 3, '#6a6a72');
        flame(c, cx, by - 22, 1.6, th.flame, seed);
        canaanLight(cx, by - 30, 220, th.flame[1]);
        break;
      case 'candles':
        for (let k = 0; k < 4; k++) {
          const x = cx - 16 + k * 10,
            h = 10 + ((seed + k * 5) % 10);
          R(c, x, by - h, 5, h, '#e8dcc0');
          flame(c, x + 2.5, by - h, 0.45, th.flame, seed + k);
        }
        canaanLight(cx, by - 10, 100, th.flame[1]);
        break;
      case 'bones':
        R(c, cx - 16, by - 4, 18, 4, '#d8d0b8');
        R(c, cx - 18, by - 6, 4, 8, '#e8e0c8');
        R(c, cx + 2, by - 6, 4, 8, '#e8e0c8');
        R(c, cx + 6, by - 12, 10, 8, '#e0d8c0');
        R(c, cx + 8, by - 10, 2, 2, '#2a2420');
        R(c, cx + 12, by - 10, 2, 2, '#2a2420');
        break;
      case 'bonepile':
        for (let k = 0; k < 6; k++) {
          const x = cx - 20 + (k % 3) * 14,
            y = by - 10 - Math.floor(k / 3) * 9;
          R(c, x, y, 12, 9, k % 2 ? '#d8d0b8' : '#c8bea4');
          R(c, x + 2, y + 3, 2, 2, '#2a2420');
          R(c, x + 7, y + 3, 2, 2, '#2a2420');
        }
        break;
      case 'mushroom': {
        const g = 0.7 + Math.sin(time * 0.04 + seed) * 0.25;
        for (let k = 0; k < 3; k++) {
          const x = cx - 14 + k * 12,
            h = 8 + k * 4;
          R(c, x + 2, by - h, 4, h, '#e8dcc0');
          c.globalAlpha = g;
          R(c, x - 3, by - h - 6, 14, 6, '#4fd8c0');
          R(c, x - 1, by - h - 8, 10, 3, '#9ff8e8');
          c.globalAlpha = 1;
        }
        canaanLight(cx, by - 10, 90, '#4fd8c0');
        break;
      }
      case 'burrow':
        R(c, cx - 20, by - 12, 40, 16, '#7a6248');
        R(c, cx - 16, by - 10, 32, 12, '#120c08');
        R(c, cx - 12, by - 12, 24, 3, '#2a1e14');
        break;
      case 'crate':
        R(c, cx - 20, by - 22, 22, 22, '#7a5536');
        R(c, cx - 20, by - 22, 22, 3, '#a37a4d');
        R(c, cx - 20, by - 12, 22, 2, '#5d4330');
        R(c, cx + 4, by - 26, 16, 26, '#6a4a30');
        R(c, cx + 4, by - 26, 16, 3, '#8a6a46');
        R(c, cx + 4, by - 18, 16, 2, '#3e3a3a');
        R(c, cx + 4, by - 8, 16, 2, '#3e3a3a');
        break;
      case 'rubble':
        R(c, cx - 18, by - 8, 14, 10, th.wall.face);
        R(c, cx - 2, by - 12, 16, 14, th.wall.light);
        R(c, cx + 10, by - 6, 10, 8, th.wall.dark);
        break;
      case 'minecart':
        R(c, cx - 22, by - 26, 44, 22, '#4a4a52');
        R(c, cx - 22, by - 26, 44, 3, '#7a7a84');
        R(c, cx - 18, by - 32, 36, 8, '#5a5a62');
        R(c, cx - 12, by - 36, 8, 6, '#9fb6c9');
        R(c, cx + 2, by - 38, 8, 8, '#7de0ff');
        R(c, cx - 16, by - 4, 8, 8, '#1c1c20');
        R(c, cx + 8, by - 4, 8, 8, '#1c1c20');
        canaanLight(cx, by - 30, 70, '#7de0ff');
        break;
      case 'ore':
        R(c, cx - 18, by - 12, 36, 14, '#4a4a52');
        R(c, cx - 12, by - 18, 22, 8, '#5d6673');
        R(c, cx - 8, by - 16, 4, 4, '#7de0ff');
        R(c, cx + 4, by - 10, 4, 4, '#c8f7ff');
        R(c, cx - 14, by - 6, 3, 3, '#7de0ff');
        break;
      case 'pickaxe':
        R(c, cx - 2, by - 30, 4, 30, '#6a4a30');
        R(c, cx - 14, by - 32, 28, 5, '#8a8a94');
        R(c, cx - 16, by - 30, 4, 4, '#c0c0c8');
        R(c, cx + 12, by - 30, 4, 4, '#c0c0c8');
        break;
      case 'cage':
        R(c, cx - 18, by - 48, 36, 4, '#3a3a40');
        R(c, cx - 18, by - 4, 36, 4, '#3a3a40');
        for (let k = 0; k < 5; k++) R(c, cx - 18 + k * 8, by - 46, 3, 44, '#4a4a52');
        R(c, cx - 8, by - 12, 14, 8, '#d8d0b8');
        R(c, cx - 1, by - 66, 2, 18, '#4a4a52');
        break;
      case 'spikes':
        for (let k = 0; k < 4; k++) {
          c.fillStyle = '#8a8a94';
          c.beginPath();
          c.moveTo(cx - 18 + k * 11, by);
          c.lineTo(cx - 13 + k * 11, by - 16);
          c.lineTo(cx - 8 + k * 11, by);
          c.fill();
        }
        R(c, cx - 20, by - 2, 40, 4, '#3a3a40');
        break;
      case 'rack':
        R(c, cx - 22, by - 34, 4, 34, '#5e4430');
        R(c, cx + 18, by - 34, 4, 34, '#5e4430');
        R(c, cx - 22, by - 34, 44, 4, '#7a5a3e');
        for (let k = 0; k < 3; k++) {
          R(c, cx - 12 + k * 11, by - 44, 3, 40, '#c0c0c8');
          R(c, cx - 15 + k * 11, by - 12, 9, 3, '#8a6a46');
        }
        break;
      case 'anvil':
        R(c, cx - 12, by - 14, 24, 16, '#5e4430');
        R(c, cx - 8, by - 22, 16, 8, '#2a2a2e');
        R(c, cx - 20, by - 30, 40, 9, '#3a3a40');
        R(c, cx - 20, by - 30, 40, 2, '#6a6a72');
        R(c, cx + 20, by - 28, 6, 5, '#3a3a40');
        R(c, cx - 2, by - 44, 4, 14, '#6a4a30');
        R(c, cx - 8, by - 46, 16, 6, '#6a6a72');
        break;
      case 'ingots': {
        const g = 0.65 + Math.sin(time * 0.06 + seed) * 0.25;
        c.globalAlpha = g;
        for (let k = 0; k < 3; k++) R(c, cx - 16 + k * 11, by - 8, 10, 6, '#ff9a3c');
        R(c, cx - 10, by - 14, 10, 6, '#ffd36b');
        R(c, cx + 1, by - 14, 10, 6, '#ffb14a');
        c.globalAlpha = 1;
        canaanLight(cx, by - 10, 80, '#ff8a3c');
        break;
      }
      case 'dragonskull':
        R(c, cx - 22, by - 24, 44, 22, '#d8d0b8');
        R(c, cx - 18, by - 4, 36, 6, '#c8bea4');
        R(c, cx - 14, by - 18, 8, 7, '#1a1214');
        R(c, cx + 6, by - 18, 8, 7, '#1a1214');
        R(c, cx - 30, by - 36, 8, 18, '#e8e0c8');
        R(c, cx + 22, by - 36, 8, 18, '#e8e0c8');
        for (let k = 0; k < 4; k++) R(c, cx - 14 + k * 8, by - 4, 3, 6, '#fff8e0');
        break;
      case 'pike':
        R(c, cx - 2, by - 56, 4, 56, '#5e4430');
        R(c, cx - 8, by - 66, 16, 13, '#d8d0b8');
        R(c, cx - 5, by - 61, 3, 3, '#1a1214');
        R(c, cx + 2, by - 61, 3, 3, '#1a1214');
        R(c, cx - 6, by - 52, 12, 3, '#8a1420');
        break;
      case 'gear': {
        const a = time * 0.02 * (seed % 2 ? 1 : -1);
        c.save();
        c.translate(cx, by - 30);
        c.rotate(a);
        c.fillStyle = pc;
        for (let k = 0; k < 8; k++) {
          c.rotate(Math.PI / 4);
          c.fillRect(-4, -28, 8, 10);
        }
        c.beginPath();
        c.arc(0, 0, 21, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = pd;
        c.beginPath();
        c.arc(0, 0, 9, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = pl;
        c.fillRect(-2, -20, 4, 10);
        c.restore();
        break;
      }
      case 'hourglass': {
        R(c, cx - 16, by - 6, 32, 6, pc);
        R(c, cx - 16, by - 58, 32, 6, pc);
        R(c, cx - 14, by - 52, 3, 46, pd);
        R(c, cx + 11, by - 52, 3, 46, pd);
        c.globalAlpha = 0.45;
        R(c, cx - 10, by - 52, 20, 46, '#bfe8ff');
        c.globalAlpha = 1;
        const sand = (time * 0.2) % 20;
        R(c, cx - 8, by - 50, 16, 18 - sand * 0.8, '#e0c070');
        R(c, cx - 1, by - 32, 2, 18, '#e0c070');
        R(c, cx - 8, by - 6 - sand, 16, sand, '#e0c070');
        break;
      }
      case 'crystal': {
        const bob = Math.sin(time * 0.05 + seed) * 4;
        c.globalAlpha = 0.85;
        c.fillStyle = th.flame[1];
        c.beginPath();
        c.moveTo(cx, by - 54 + bob);
        c.lineTo(cx + 10, by - 34 + bob);
        c.lineTo(cx, by - 14 + bob);
        c.lineTo(cx - 10, by - 34 + bob);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(cx - 2, by - 46 + bob, 3, 14);
        c.globalAlpha = 0.3;
        R(c, cx - 12, by - 2, 24, 4, '#000');
        c.globalAlpha = 1;
        canaanLight(cx, by - 34, 140, th.flame[1]);
        break;
      }
      case 'orb': {
        const bob = Math.sin(time * 0.04 + seed) * 5;
        c.globalAlpha = 0.9;
        c.fillStyle = th.flame[1];
        c.beginPath();
        c.arc(cx, by - 40 + bob, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(cx - 3, by - 43 + bob, 4, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
        canaanLight(cx, by - 40, 150, th.flame[1]);
        break;
      }
      case 'feathers':
        for (let k = 0; k < 4; k++) {
          const x = cx - 16 + k * 10,
            y = by - 6 - (k % 2) * 6;
          R(c, x, y, 9, 3, '#ffffff');
          R(c, x + 3, y - 2, 2, 7, '#e8dcc0');
        }
        break;
    }
  }
  function drawCenterpiece(c, p, th) {
    const cx = p.x * TS + 24,
      by = p.y * TS + 44,
      [pc, pd, pl] = th.pillar;
    switch (p.kind) {
      case 'bonethrone':
        R(c, cx - 40, by - 20, 80, 22, '#c8bea4');
        R(c, cx - 30, by - 90, 60, 72, '#d8d0b8');
        for (let k = 0; k < 5; k++) {
          R(c, cx - 34 + k * 14, by - 104, 12, 12, '#e8e0c8');
          R(c, cx - 31 + k * 14, by - 100, 2, 3, '#1a1214');
          R(c, cx - 26 + k * 14, by - 100, 2, 3, '#1a1214');
        }
        R(c, cx - 20, by - 70, 40, 40, '#9a917a');
        R(c, cx - 48, by - 50, 14, 50, '#d8d0b8');
        R(c, cx + 34, by - 50, 14, 50, '#d8d0b8');
        break;
      case 'mithrilcluster': {
        const g = 0.75 + Math.sin(time * 0.04) * 0.2;
        c.globalAlpha = g;
        const shard = (x, h, w, col) => {
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(cx + x - w, by);
          c.lineTo(cx + x, by - h);
          c.lineTo(cx + x + w, by);
          c.fill();
        };
        shard(-30, 60, 14, '#5cb8e0');
        shard(28, 70, 14, '#5cb8e0');
        shard(-8, 110, 20, '#7de0ff');
        shard(12, 84, 16, '#c8f7ff');
        c.globalAlpha = 1;
        R(c, cx - 50, by - 6, 100, 10, '#3d434d');
        canaanLight(cx, by - 50, 260, '#7de0ff');
        break;
      }
      case 'altar': {
        R(c, cx - 44, by - 30, 88, 32, pd);
        R(c, cx - 48, by - 36, 96, 8, pl);
        R(c, cx - 30, by - 28, 60, 22, pc);
        flame(c, cx - 34, by - 36, 0.8, th.flame, 1);
        flame(c, cx + 34, by - 36, 0.8, th.flame, 2);
        // Disque d'éclipse : un soleil masqué par la lune.
        const y = by - 90 + Math.sin(time * 0.03) * 3;
        c.fillStyle = '#ffcc55';
        c.globalAlpha = 0.35;
        c.beginPath();
        c.arc(cx, y, 34, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
        c.beginPath();
        c.arc(cx, y, 24, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#120a1c';
        c.beginPath();
        c.arc(cx + 8, y - 3, 22, 0, Math.PI * 2);
        c.fill();
        canaanLight(cx, y, 260, th.flame[1]);
        break;
      }
      case 'greatforge': {
        R(c, cx - 56, by - 80, 112, 84, '#2a1a14');
        R(c, cx - 56, by - 80, 112, 8, '#4a302a');
        R(c, cx - 36, by - 56, 72, 60, '#140806');
        const f = 0.75 + Math.sin(time * 0.1) * 0.2;
        c.globalAlpha = f;
        R(c, cx - 32, by - 34, 64, 38, '#e5522e');
        R(c, cx - 22, by - 26, 44, 30, '#f9a640');
        R(c, cx - 10, by - 18, 20, 22, '#fff1b5');
        c.globalAlpha = 1;
        R(c, cx - 20, by - 116, 40, 38, '#3a2a26');
        canaanLight(cx, by - 20, 320, '#ff6a1f');
        break;
      }
      case 'block':
        R(c, cx - 30, by - 26, 60, 28, '#3a2a26');
        R(c, cx - 30, by - 26, 60, 4, '#5a4038');
        R(c, cx - 12, by - 30, 24, 6, '#6a1a1a');
        for (const ox of [-38, 34])
          for (let k = 0; k < 8; k++) R(c, cx + ox + (k % 2), by - 100 + k * 9, 4, 7, '#6a6a72');
        R(c, cx - 44, by - 108, 88, 8, '#2a2026');
        break;
      case 'throne': {
        const gold = th.key === 'seraphin';
        R(c, cx - 50, by - 12, 100, 14, gold ? '#d4aa3a' : '#3a1414');
        R(c, cx - 30, by - 110, 60, 100, gold ? '#fff4d8' : '#5a1010');
        R(c, cx - 30, by - 110, 60, 6, gold ? '#d4aa3a' : '#d4a44a');
        R(c, cx - 22, by - 100, 44, 70, gold ? '#d4aa3a' : '#8a1420');
        R(c, cx - 42, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
        R(c, cx + 28, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
        for (let k = 0; k < 3; k++) R(c, cx - 22 + k * 18, by - 124, 8, 14, gold ? '#ffe680' : '#d4a44a');
        if (gold) {
          R(c, cx - 70, by - 96, 26, 60, '#ffffff');
          R(c, cx + 44, by - 96, 26, 60, '#ffffff');
          canaanLight(cx, by - 60, 240, '#ffe680');
        }
        break;
      }
      case 'orrery': {
        R(c, cx - 10, by - 50, 20, 52, pc);
        R(c, cx - 26, by - 6, 52, 8, pd);
        c.strokeStyle = pl;
        c.lineWidth = 3;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.ellipse(cx, by - 80, 30 + k * 16, 10 + k * 6, 0, 0, Math.PI * 2);
          c.stroke();
          const a = time * (0.02 + k * 0.012) + k * 2;
          c.fillStyle = ['#7de0ff', '#ff7fa7', '#ffd36d'][k];
          c.beginPath();
          c.arc(cx + Math.cos(a) * (30 + k * 16), by - 80 + Math.sin(a) * (10 + k * 6), 7, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = '#fff6c0';
        c.beginPath();
        c.arc(cx, by - 80, 12, 0, Math.PI * 2);
        c.fill();
        canaanLight(cx, by - 80, 240, '#9fd8ff');
        break;
      }
      case 'scales': {
        R(c, cx - 30, by - 8, 60, 10, '#8a6a1a');
        R(c, cx - 5, by - 120, 10, 114, '#d4aa3a');
        const tilt = Math.sin(time * 0.02) * 8;
        c.save();
        c.translate(cx, by - 116);
        c.rotate((tilt * Math.PI) / 180);
        R(c, -70, -3, 140, 6, '#ffe680');
        c.restore();
        for (const s of [-1, 1]) {
          const px = cx + s * 66,
            py = by - 116 + s * tilt * 1.1;
          R(c, px - 1, py, 2, 36, '#d4aa3a');
          R(c, px - 22, py + 36, 44, 6, '#ffe680');
          R(c, px - 16, py + 42, 32, 4, '#d4aa3a');
        }
        R(c, cx - 10, by - 132, 20, 14, '#fff0a8');
        canaanLight(cx, by - 80, 280, '#fff0a8');
        break;
      }
    }
  }
  function drawDecal(c, dcl, th) {
    const x = dcl.x * TS + 24,
      y = dcl.y * TS + 24;
    if (dcl.kind === 'portal') {
      const r = 34 + Math.sin(time * 0.05) * 3;
      c.save();
      c.globalAlpha = 0.85;
      c.strokeStyle = th.rune;
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.35;
      c.fillStyle = th.rune;
      c.beginPath();
      c.ellipse(x, y, r * 0.8, r * 0.42, 0, 0, Math.PI * 2);
      c.fill();
      for (let k = 0; k < 6; k++) {
        const a = time * 0.04 + k;
        c.globalAlpha = 0.8;
        c.fillRect(x + Math.cos(a) * r - 2, y + Math.sin(a) * r * 0.55 - 2, 4, 4);
      }
      c.restore();
      canaanLight(x, y, 170, th.rune);
    } else if (dcl.kind === 'runecircle' || dcl.kind === 'eclipse') {
      const r = 110;
      c.save();
      c.globalAlpha = 0.5;
      c.strokeStyle = th.rune;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y, r * 0.78, r * 0.47, 0, 0, Math.PI * 2);
      c.stroke();
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + time * 0.004;
        c.fillStyle = th.rune;
        c.fillRect(x + Math.cos(a) * r * 0.89 - 3, y + Math.sin(a) * r * 0.535 - 3, 6, 6);
      }
      if (dcl.kind === 'eclipse') {
        c.globalAlpha = 0.55;
        c.fillStyle = '#e0b04a';
        c.beginPath();
        c.ellipse(x, y, 52, 31, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#120a1c';
        c.beginPath();
        c.ellipse(x + 14, y - 4, 48, 29, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    } else if (dcl.kind === 'splat') {
      c.save();
      c.globalAlpha = 0.5;
      c.fillStyle = th.hazard.style === 'blood' ? '#5a0a10' : '#2a1030';
      c.beginPath();
      c.ellipse(x, y, 16, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(x + 12, y - 2, 10, 4);
      c.fillRect(x - 20, y + 4, 6, 3);
      c.restore();
    }
  }
  function drawGate(c, g, th) {
    const xs = g.cells.map(cl => cl[0]),
      ys = g.cells.map(cl => cl[1]),
      X = Math.min(...xs) * TS,
      Y = Math.min(...ys) * TS,
      w = (Math.max(...xs) - Math.min(...xs) + 1) * TS,
      h = (Math.max(...ys) - Math.min(...ys) + 1) * TS;
    if (th.gate === 'barrier') {
      const a = 0.45 + Math.sin(time * 0.08) * 0.15;
      c.save();
      c.globalAlpha = a;
      c.fillStyle = th.rune;
      c.fillRect(X, Y, w, h);
      c.globalAlpha = 0.9;
      c.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) {
        const t = (time * 0.6 + k * 23) % 48;
        if (w > h) c.fillRect(X + ((k * 29 + time) % w), Y + t, 3, 6);
        else c.fillRect(X + t, Y + ((k * 29 + time) % h), 6, 3);
      }
      c.restore();
      canaanLight(X + w / 2, Y + h / 2, 160, th.rune);
      return;
    }
    // Herse de fer.
    c.fillStyle = '#1c1c20';
    c.fillRect(X, Y, w, h);
    c.fillStyle = '#5a5a62';
    if (w >= h) {
      for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y, 5, h);
      for (let y = Y + 8; y < Y + h; y += 16) c.fillRect(X, y, w, 4);
    } else {
      for (let y = Y + 4; y < Y + h; y += 12) c.fillRect(X, y, w, 5);
      for (let x = X + 8; x < X + w; x += 16) c.fillRect(x, Y, 4, h);
    }
    c.fillStyle = '#8a8a94';
    if (w >= h) for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y + h - 6, 5, 6);
  }
  // Décor de l'instance : sols spéciaux, objets, pièce maîtresse, herses et titre.
  function drawDungeonDecor(c) {
    if (!game.world.instance) return;
    const i = game.world.instance.index,
      th = THEMES[i],
      plan = planFor(i),
      view = (x, y, m = 3) =>
        x * TS > camX - m * TS &&
        x * TS < camX + W + m * TS &&
        y * TS > camY - m * TS &&
        y * TS < camY + H + m * TS;
    for (const l of plan.lights)
      if (view(l.x, l.y))
        canaanLight(l.x * TS, l.y * TS, l.r * (0.9 + Math.sin(time * 0.06 + l.x) * 0.1), l.col);
    c.save();
    if (plan.arena) drawArenaStands(c);
    for (const dcl of plan.decals) if (view(dcl.x, dcl.y, 4)) drawDecal(c, dcl, th);
    for (const p of plan.props)
      if (view(p.x, p.y, 4)) {
        if (p.wall) drawWallProp(c, p, th);
        else if (p.center) drawCenterpiece(c, p, th);
        else drawFloorProp(c, p, th);
      }
    for (const g of plan.gates) if (g && game.world.tiles[g.cells[0][1]][g.cells[0][0]] === GATE) drawGate(c, g, th);
    const d = instances[i],
      mode = instanceDifficulty();
    if (plan.title && view(plan.title.x, plan.title.y, 6)) {
      c.textAlign = 'center';
      c.font = 'bold 18px monospace';
      c.lineWidth = 4;
      c.strokeStyle = '#0b0a10';
      const name = plan.arena ? CANAAN_ARENA_NAME : d.name,
        title = '✦ ' + name.toUpperCase() + (mode ? ' · ' + mode.icon + ' ' + mode.label : '') + ' ✦';
      c.strokeText(title, plan.title.x * TS + 24, plan.title.y * TS);
      c.fillStyle = th.rune;
      c.fillText(title, plan.title.x * TS + 24, plan.title.y * TS);
    }
    c.textAlign = 'center';
    c.font = 'bold 13px monospace';
    c.fillStyle = '#fff2cb';
    c.fillText('↟ SORTIE [E] ↟', instanceEntrance.x, instanceEntrance.y + 62);
    c.restore();
  }

  // ---------------------------------------------------------------- Entrées sur l'île
  // Ouverture du portail : un tourbillon de la couleur du thème.
  function membrane(c, x, y, rx, ry, col) {
    c.save();
    c.fillStyle = '#07060c';
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.55;
    const g = c.createRadialGradient(x, y, 2, x, y, Math.max(rx, ry));
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.strokeStyle = col;
    c.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a = time * 0.04 + k * 2.1;
      c.beginPath();
      c.ellipse(x, y, rx * (0.35 + k * 0.2), ry * (0.35 + k * 0.2), 0, a, a + 2.2);
      c.stroke();
    }
    c.restore();
    canaanLight(x, y, 170, col);
  }
  function drawDungeonEntrance(c, i, x, y) {
    const th = THEMES[i],
      d = instances[i],
      w = th.wall,
      [pc, pd, pl] = th.pillar,
      oy = y - 34;
    c.save();
    c.fillStyle = 'rgba(8,10,16,.4)';
    c.beginPath();
    c.ellipse(x, y + 26, 84, 22, 0, 0, Math.PI * 2);
    c.fill();
    switch (th.key) {
      case 'arene': {
        // Façade de colisée : deux étages d'arcades en grès, grande arche centrale, braseros et bannières.
        const sand = '#c8a878',
          sandDark = '#8a6a4a',
          sandLight = '#ecd2a2';
        c.fillStyle = sandDark;
        c.beginPath();
        c.ellipse(x, y + 8, 104, 116, 0, Math.PI, 0);
        c.fill();
        c.fillStyle = sand;
        c.beginPath();
        c.ellipse(x, y + 8, 98, 110, 0, Math.PI, 0);
        c.fill();
        R(c, x - 104, y + 2, 208, 10, sandDark);
        R(c, x - 98, y - 50, 196, 5, sandLight);
        R(c, x - 76, y - 92, 152, 4, sandLight);
        // Arcades sombres sur deux étages.
        for (let k = -3; k <= 3; k++) {
          if (Math.abs(k) <= 1) continue;
          const ax = x + k * 25;
          R(c, ax - 8, y - 38, 16, 38, '#2a1a10');
          c.fillStyle = '#2a1a10';
          c.beginPath();
          c.arc(ax, y - 38, 8, Math.PI, 0);
          c.fill();
          R(c, ax - 8, y - 38, 2, 38, sandLight);
        }
        for (let k = -2; k <= 2; k++) {
          const ax = x + k * 27;
          R(c, ax - 6, y - 84, 12, 26, '#3a2414');
          c.fillStyle = '#3a2414';
          c.beginPath();
          c.arc(ax, y - 84, 6, Math.PI, 0);
          c.fill();
        }
        // Grande arche centrale : portail pourpre et or.
        R(c, x - 36, y - 62, 72, 66, sandDark);
        c.fillStyle = sandLight;
        c.beginPath();
        c.arc(x, y - 30, 36, Math.PI, 0);
        c.fill();
        membrane(c, x, y - 16, 28, 40, th.rune);
        R(c, x - 4, y - 72, 8, 8, '#ffd36d');
        R(c, x - 2, y - 70, 4, 4, '#fff6c5');
        // Épées croisées et laurier au fronton.
        c.save();
        c.translate(x, y - 108);
        for (const s of [-1, 1]) {
          c.save();
          c.rotate(s * 0.7);
          R(c, -2, -22, 4, 34, '#dfe6ee');
          R(c, -2, -22, 1, 34, '#ffffff');
          R(c, -7, 8, 14, 3, '#d4aa3a');
          R(c, -2, 11, 4, 8, '#6a4a2a');
          c.restore();
        }
        c.restore();
        for (const s of [-1, 1])
          for (let k = 0; k < 5; k++) R(c, x + s * (14 + k * 5), y - 100 + k * 4, 5, 3, '#6aa04a');
        // Bannières et braseros de part et d'autre.
        for (const s of [-1, 1]) {
          const bx = x + s * 52;
          R(c, bx - 9, y - 58, 18, 3, '#3a2a1c');
          R(c, bx - 7, y - 55, 14, 30, th.banner[0]);
          R(c, bx - 7, y - 25, 5, 5, th.banner[0]);
          R(c, bx + 2, y - 25, 5, 5, th.banner[0]);
          R(c, bx - 2, y - 50, 4, 12, th.banner[1]);
          R(c, bx - 5, y - 46, 10, 3, th.banner[1]);
          const fx = x + s * 86;
          R(c, fx - 3, y - 18, 6, 30, '#3a3a40');
          R(c, fx - 12, y - 24, 24, 8, '#4a4a52');
          R(c, fx - 12, y - 24, 24, 2, '#6a6a72');
          flame(c, fx, y - 24, 1.3, th.flame, s + 3);
          canaanLight(fx, y - 34, 170, th.flame[1]);
        }
        break;
      }
      case 'terriers': {
        // Butte de terre et de roche, bouche de grotte, racines et torches.
        c.fillStyle = '#5b4733';
        c.beginPath();
        c.ellipse(x, y + 4, 86, 70, 0, Math.PI, 0);
        c.fill();
        c.fillStyle = '#7d6449';
        c.beginPath();
        c.ellipse(x - 10, y - 20, 60, 42, 0, Math.PI, 0);
        c.fill();
        R(c, x - 70, y - 4, 26, 18, w.light);
        R(c, x + 44, y - 10, 30, 22, w.face);
        R(c, x + 50, y - 14, 18, 6, w.light);
        membrane(c, x, oy + 14, 30, 36, th.rune);
        for (let k = 0; k < 5; k++)
          R(c, x - 30 + k * 14, y - 64 + (k % 2) * 6, 3, 14 + (k % 3) * 6, '#3b2a1a');
        flame(c, x - 52, y - 30, 1, th.flame, 1);
        flame(c, x + 52, y - 30, 1, th.flame, 2);
        R(c, x - 54, y - 30, 4, 34, '#4a3324');
        R(c, x + 50, y - 30, 4, 34, '#4a3324');
        canaanLight(x - 52, y - 40, 150, th.flame[1]);
        canaanLight(x + 52, y - 40, 150, th.flame[1]);
        break;
      }
      case 'mine': {
        c.fillStyle = w.face;
        c.beginPath();
        c.moveTo(x - 92, y + 12);
        c.lineTo(x - 50, y - 70);
        c.lineTo(x + 10, y - 92);
        c.lineTo(x + 70, y - 60);
        c.lineTo(x + 94, y + 12);
        c.fill();
        R(c, x - 40, y - 74, 30, 10, w.light);
        R(c, x + 30, y - 60, 24, 8, w.light);
        membrane(c, x, oy + 10, 30, 40, th.rune);
        R(c, x - 40, y - 82, 12, 96, '#6a4a30');
        R(c, x + 28, y - 82, 12, 96, '#6a4a30');
        R(c, x - 48, y - 92, 96, 14, '#8a6a46');
        R(c, x - 48, y - 92, 96, 3, '#b08a5e');
        for (let k = 0; k < 4; k++) R(c, x - 26, y + 6 + k * 9, 52, 4, '#5e4430');
        R(c, x - 18, y + 4, 4, 40, '#a7aab4');
        R(c, x + 14, y + 4, 4, 40, '#a7aab4');
        R(c, x + 50, y - 6, 34, 20, '#4a4a52');
        R(c, x + 54, y - 12, 10, 8, '#7de0ff');
        R(c, x + 66, y - 14, 10, 10, '#c8f7ff');
        R(c, x - 62, y - 70, 2, 14, '#2a2a2e');
        R(c, x - 68, y - 56, 14, 16, '#ffcf6a');
        canaanLight(x - 61, y - 48, 150, '#ffcf6a');
        canaanLight(x + 64, y - 10, 90, '#7de0ff');
        break;
      }
      case 'eclipse':
      case 'seraphin':
      case 'penitents':
      case 'bastion': {
        // Portail bâti : marches, deux tours ou colonnes, linteau et ornements du thème.
        const tower = th.key === 'penitents' || th.key === 'bastion';
        R(c, x - 70, y + 4, 140, 10, pd);
        R(c, x - 60, y - 2, 120, 8, pl);
        for (const s of [-1, 1]) {
          const tx = x + s * 52;
          if (tower) {
            R(c, tx - 20, y - 104, 40, 108, w.face);
            R(c, tx - 20, y - 104, 8, 108, w.light);
            for (let k = 0; k < 3; k++) R(c, tx - 20 + k * 15, y - 114, 10, 10, w.face);
            for (let k = 0; k < 5; k++) R(c, tx - 20, y - 90 + k * 18, 40, 2, w.dark);
            R(c, tx - 4, y - 80, 8, 14, '#ffcf6a');
            canaanLight(tx, y - 72, 90, '#ffcf6a');
          } else {
            R(c, tx - 12, y - 96, 24, 98, pc);
            R(c, tx - 12, y - 96, 6, 98, pl);
            R(c, tx + 6, y - 96, 6, 98, pd);
            R(c, tx - 16, y - 104, 32, 10, pl);
          }
        }
        R(c, x - 40, y - 92, 80, 92, tower ? w.dark : pd);
        membrane(c, x, oy, 30, 44, th.rune);
        if (tower) {
          // Herse à demi levée et bannières.
          c.fillStyle = '#2a2a30';
          for (let k = 0; k < 6; k++) c.fillRect(x - 30 + k * 12, y - 84, 4, 22);
          c.fillRect(x - 32, y - 66, 64, 4);
          for (const s of [-1, 1]) {
            R(c, x + s * 52 - 10, y - 66, 20, 34, th.banner[0]);
            R(c, x + s * 52 - 4, y - 58, 8, 12, th.banner[1]);
          }
          R(c, x - 46, y - 100, 92, 10, w.face);
          if (th.key === 'bastion')
            for (const s of [-1, 1]) {
              R(c, x + s * 86 - 2, y - 60, 4, 66, '#5e4430');
              R(c, x + s * 86 - 8, y - 72, 16, 13, '#d8d0b8');
              R(c, x + s * 86 - 5, y - 67, 3, 3, '#1a1214');
              R(c, x + s * 86 + 2, y - 67, 3, 3, '#1a1214');
            }
        } else {
          c.fillStyle = pl;
          c.beginPath();
          c.moveTo(x - 72, y - 102);
          c.lineTo(x, y - 136);
          c.lineTo(x + 72, y - 102);
          c.fill();
          R(c, x - 72, y - 104, 144, 6, pd);
          if (th.key === 'eclipse') {
            c.fillStyle = '#ffcc55';
            c.beginPath();
            c.arc(x, y - 116, 12, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#120a1c';
            c.beginPath();
            c.arc(x + 5, y - 118, 11, 0, Math.PI * 2);
            c.fill();
          } else {
            for (const s of [-1, 1]) {
              R(c, x + s * 30 - 14, y - 128, 28, 8, '#ffffff');
              R(c, x + s * 38 - 10, y - 120, 20, 6, '#ffffff');
            }
            R(c, x - 6, y - 128, 12, 12, '#d4aa3a');
          }
          flame(c, x - 84, y - 8, 1.2, th.flame, 3);
          flame(c, x + 84, y - 8, 1.2, th.flame, 4);
          R(c, x - 92, y - 8, 16, 12, '#4a4a52');
          R(c, x + 76, y - 8, 16, 12, '#4a4a52');
          canaanLight(x - 84, y - 20, 140, th.flame[1]);
          canaanLight(x + 84, y - 20, 140, th.flame[1]);
        }
        break;
      }
      case 'forge': {
        c.fillStyle = w.face;
        c.beginPath();
        c.moveTo(x - 94, y + 12);
        c.lineTo(x - 44, y - 84);
        c.lineTo(x + 40, y - 96);
        c.lineTo(x + 94, y + 12);
        c.fill();
        R(c, x + 24, y - 132, 26, 44, w.dark);
        for (let k = 0; k < 3; k++) {
          c.fillStyle = 'rgba(120,110,110,' + (0.35 - k * 0.1) + ')';
          c.beginPath();
          c.arc(
            x + 37 + Math.sin(time * 0.02 + k) * 6,
            y - 144 - k * 16 - ((time * 0.3) % 16),
            9 + k * 3,
            0,
            Math.PI * 2
          );
          c.fill();
        }
        R(c, x - 40, y - 86, 80, 96, '#140806');
        membrane(c, x, oy, 30, 42, th.hazard.b);
        R(c, x - 44, y - 90, 88, 8, '#4a302a');
        for (const s of [-1, 1]) {
          c.fillStyle = th.hazard.a;
          c.fillRect(x + s * 52 - 6, y - 40, 12, 56);
          c.fillStyle = th.hazard.c;
          c.fillRect(x + s * 52 - 2, y - 40 + ((time * 0.5) % 50), 4, 6);
          canaanLight(x + s * 52, y - 10, 140, th.hazard.b);
        }
        R(c, x + 60, y - 14, 30, 10, '#3a3a40');
        R(c, x + 68, y - 4, 14, 14, '#2a2a2e');
        break;
      }
      case 'fosse': {
        // Puits sombre cerclé de pierre : des chaînes plongent dans une lueur violette.
        c.fillStyle = pd;
        c.beginPath();
        c.ellipse(x, y - 6, 72, 34, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = pc;
        c.beginPath();
        c.ellipse(x, y - 10, 64, 28, 0, 0, Math.PI * 2);
        c.fill();
        membrane(c, x, y - 10, 52, 21, th.rune);
        for (const s of [-1, 1]) {
          R(c, x + s * 66 - 4, y - 92, 8, 90, '#3a3a40');
          R(c, x + s * 66 - 12, y - 96, 24, 6, '#4a4a52');
          for (let k = 0; k < 7; k++) R(c, x + s * 40 + (k % 2), y - 90 + k * 10, 4, 8, '#6a6a72');
        }
        R(c, x - 70, y - 98, 140, 6, '#2a2026');
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          c.fillStyle = '#8a8a94';
          c.beginPath();
          c.moveTo(x + Math.cos(a) * 80 - 5, y - 6 + Math.sin(a) * 38);
          c.lineTo(x + Math.cos(a) * 80, y - 22 + Math.sin(a) * 38);
          c.lineTo(x + Math.cos(a) * 80 + 5, y - 6 + Math.sin(a) * 38);
          c.fill();
        }
        break;
      }
      default: {
        // Anneau flottant (Continuum) ou porte d'étoiles (Célestia).
        const bob = Math.sin(time * 0.04 + i) * 4;
        c.fillStyle = th.floor.b;
        c.beginPath();
        c.ellipse(x, y + 6, 70, 20, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = th.floor.a;
        c.beginPath();
        c.ellipse(x, y + 2, 62, 16, 0, 0, Math.PI * 2);
        c.fill();
        membrane(c, x, oy + bob, 36, 50, th.rune);
        c.strokeStyle = pl;
        c.lineWidth = 9;
        c.beginPath();
        c.ellipse(x, oy + bob, 42, 56, 0, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = pc;
        c.lineWidth = 3;
        c.stroke();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + time * 0.01;
          R(
            c,
            x + Math.cos(a) * 42 - 4,
            oy + bob + Math.sin(a) * 56 - 4,
            8,
            8,
            th.key === 'celestia' ? '#fff0a8' : '#7de0ff'
          );
        }
        if (th.key === 'celestia') {
          for (const s of [-1, 1]) {
            c.globalAlpha = 0.4;
            R(c, x + s * 74 - 8, y - 120, 16, 124, '#fff0a8');
            c.globalAlpha = 1;
            canaanLight(x + s * 74, y - 50, 150, '#fff0a8');
          }
          R(c, x - 3, oy - 78 + bob, 6, 20, '#d4aa3a');
          R(c, x - 26, oy - 78 + bob, 52, 4, '#ffe680');
        } else
          for (const s of [-1, 1]) {
            const gx = x + s * 70,
              gy = y - 70;
            c.save();
            c.translate(gx, gy);
            c.rotate(time * 0.02 * s);
            c.fillStyle = pc;
            for (let k = 0; k < 8; k++) {
              c.rotate(Math.PI / 4);
              c.fillRect(-3, -20, 6, 8);
            }
            c.beginPath();
            c.arc(0, 0, 14, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = pd;
            c.beginPath();
            c.arc(0, 0, 6, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
      }
    }
    c.font = 'bold 12px system-ui';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#101522';
    const label = i === 'arena' ? '✦ ARÈNE ✦' : d.raid ? '✦ RAID ✦' : '✦ DONJON ✦';
    c.strokeText(label, x, y - 146);
    c.fillStyle = th.rune;
    c.fillText(label, x, y - 146);
    c.restore();
  }
  // Ambiance de l'instance pour l'éclairage commun (canaan-sprite-kit).
  function dungeonAmbience() {
    const th = THEMES[game.world.instance.index],
      col = { dust: '#d8c8a8', embers: '#ffb14a', motes: th.rune, sparks: th.hazard.c, feathers: '#ffffff' }[
        th.particles
      ];
    return { dark: th.light.dark, tint: th.light.tint, particles: th.particles, color: col };
  }
  function dungeonMinimapColor(t) {
    if (!game.world.instance) return BIOME_COLORS[t];
    const th = THEMES[game.world.instance.index];
    if (t === FLOOR) return th.floor.c;
    if (t === ACCENT) return th.accent.c;
    if (t === HAZARD) return th.shape === 'void' ? '#0c0c1c' : th.hazard.b;
    if (t === GATE) return th.rune;
    return '#08080e';
  }
  // Vérification : chaque boss, coffre et ennemi accessible depuis l'entrée une fois les herses levées,
  // et aucun boss suivant accessible tant que la première herse est fermée.
  function auditDungeon(i) {
    const plan = planFor(i),
      grid = plan.grid,
      reach = openGates => {
        const seen = new Set([ENTRY.y * MAPW + ENTRY.x]),
          queue = [[ENTRY.x, ENTRY.y]];
        while (queue.length) {
          const [x, y] = queue.pop();
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ]) {
            const nx = x + dx,
              ny = y + dy,
              id = ny * MAPW + nx,
              t = grid[ny]?.[nx];
            if (seen.has(id) || !(WALKABLE(t) || (openGates && t === GATE))) continue;
            seen.add(id);
            queue.push([nx, ny]);
          }
        }
        return seen;
      },
      open = reach(true),
      closed = reach(false),
      bosses = plan.rooms.filter(r => r.kind === 'boss');
    return {
      bosses: bosses.length,
      gates: plan.gates.filter(Boolean).length,
      reachable:
        bosses.every(r => open.has(r.boss.y * MAPW + r.boss.x)) &&
        plan.trash.every(t => open.has(t.y * MAPW + t.x)),
      sealed: bosses.slice(1).every(r => !closed.has(r.boss.y * MAPW + r.boss.x)),
      trash: plan.trash.length,
      props: plan.props.length,
      theme: plan.theme.key
    };
  }
  // Invité en ligne : ouvre les herses des boss déjà vaincus chez l'hôte (dans l'ordre, sans effet).
  function openDungeonGates(index, count) {
    const plan = planFor(index);
    if (!plan) return 0;
    let opened = 0;
    plan.gates.slice(0, Math.max(0, count)).forEach(gate => {
      if (!gate) return;
      gate.cells.forEach(([x, y], k) => {
        if (game.world.tiles[y]?.[x] === GATE) {
          game.world.tiles[y][x] = gate.under[k];
          opened++;
        }
      });
    });
    return opened;
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    makeDungeon,
    openDungeonGates,
    spawnInstanceBoss,
    onInstanceBossDown,
    dungeonChestSpot,
    drawDungeonTile,
    drawDungeonDecor,
    dungeonAmbience,
    drawDungeonEntrance,
    dungeonMinimapColor,
    arenaLayout,
    CANAAN_DUNGEON_AUDIT: auditDungeon,
    // Monstres d'une instance (renforts appelés par les boss, boss-mechanics.js).
    CANAAN_DUNGEON_MOBS: i => THEMES[i].mobs,
    // Pinceaux partagés avec les intérieurs des bâtiments et le camp (house.js, world-settlements.js) : mêmes
    // textures de sol et de mur, même flamme, même ombre au pied des murs que dans les donjons et les raids.
    CANAAN_TILE_KIT: Object.freeze({ canvas, rect, specks, paintFloor, paintFace, flame, shadowTile })
  });
})();
