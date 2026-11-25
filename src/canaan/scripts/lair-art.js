// Décors des habitats des créatures (mob-lairs.js), dans la facture de nature-art.js : grille de gros pixels (1 pixel
// d'art = 2 pixels d'écran), aplats de 4 tons, lumière en haut à gauche, grain et contour sombre, trois variantes.
// Ils se posent dans la grille de décor de l'île comme les arbres et les rochers (même dessin, même profondeur, même
// balancement au vent) :
// - pièces posées au sol : tanières, tentes, totems, nids, ossements, toiles, cocons, tombes, statues pétrifiées… ;
// - arbres envahis : un arbre de l'île (feuillu, ancien, pin, tordu, d'automne…) couvert de toiles d'araignée, de
//   toiles venimeuses, de chauves-souris pendues ou de corbeaux perchés, dessiné par-dessus l'arbre d'origine.
// Les noms et leurs traits (arbre qui bloque, objet haut, lueur, balancement) sont déclarés même sans canevas (tests) :
// world-look.js les lit (CANAAN_LAIR_DECOR), les sprites n'existent qu'avec un canevas.
(() => {
  'use strict';
  // Arbres de l'île qu'un habitat peut envahir.
  const BASE_TREES = [
    'tree',
    'bigtree',
    'pine',
    'snowpine',
    'twisted',
    'palm',
    'deadwood',
    'autumn_red',
    'autumn_orange',
    'autumn_gold',
    'goldtree',
    'glowtree'
  ];
  const DRESSINGS = ['web', 'venom', 'bats', 'crows'];
  // Grandes pièces (grille 64 × 76, pied à y = 66) : elles bloquent et passent devant les personnages comme un arbre.
  const BIG = [
    'lair_den_wolf',
    'lair_den_bear',
    'lair_den_troll',
    'lair_den_bat',
    'lair_den_prowler',
    'lair_tent_goblin',
    'lair_tent_bandit',
    'lair_tent_raider',
    'lair_totem',
    'lair_gallows',
    'lair_wagon',
    'lair_nest_drake',
    'lair_nest_astral',
    'lair_nest_eagle',
    'lair_monolith',
    'lair_blighttree'
  ];
  // Petites pièces hautes : les personnages passent derrière.
  const TALL_SMALL = [
    'lair_cocoon',
    'lair_grave',
    'lair_statue',
    'lair_runestone_wisp',
    'lair_runestone_astral',
    'lair_hornskull',
    'lair_banner',
    'lair_crates',
    'lair_stakes',
    'lair_ootheca',
    'lair_hive',
    'lair_cauldron'
  ];
  const GLOW = {
    lair_fire: '#ffb060',
    lair_cauldron: '#ffb060',
    lair_runestone_wisp: '#9ae8ff',
    lair_runestone_astral: '#b8a8ff',
    lair_glowshroom_fairy: '#ff9ae0',
    lair_glowshroom_wisp: '#7ad8ff',
    lair_monolith: '#b8a8ff',
    lair_nest_astral: '#b8d8ff',
    lair_blightpool: '#c07ad0',
    lair_blighttree: '#b060d0',
    lair_slime: '#8af0a0'
  };
  const dressed = (dress, base) => 'lair_' + dress + '_' + base;
  const trees = {};
  for (const dress of DRESSINGS) for (const base of BASE_TREES) trees[dressed(dress, base)] = base;
  for (const name of [...Object.keys(trees), ...BIG]) CANAAN_BIG_TREES.add(name);
  window.CANAAN_LAIR_DECOR = Object.freeze({
    BASE_TREES,
    dressed,
    // Arbre envahi → arbre d'origine (balancement, variante).
    trees,
    tall: [...BIG, ...TALL_SMALL],
    glow: GLOW,
    sway: { lair_blighttree: 0.35, lair_banner: 1.2, lair_ootheca: 1.3 }
  });

  if (typeof document === 'undefined' || typeof PIXEL_DECOR === 'undefined') return;
  const { brush, outline, polish, mix, hashGrid: hash, bez, branch, bayer, makeCanvas } = CANAAN_PIXEL_KIT;
  if (!brush(2, 2).g?.getImageData) return;

  // ---------------------------------------------------------------- Formes
  function shadow(k, cx, cy, rx, ry) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (d > 1 || bayer(x, y) < d * 0.8) continue;
        k.g.fillStyle = 'rgba(16,26,14,.38)';
        k.g.fillRect(cx + x, cy + y, 1, 1);
      }
  }
  function ell(k, cx, cy, rx, ry, col) {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1, col);
    }
  }
  // Bloc de pierre éclairé en haut à gauche (même modelé que les rochers de l'île) ; R : 4 tons, du clair au sombre.
  function blob(k, cx, cy, rx, ry, R, seed, flat = 0.4) {
    for (let y = -ry; y <= ry * flat; y++)
      for (let x = -rx; x <= rx; x++) {
        const nx = x / rx,
          ny = y / ry,
          j = (hash((x >> 1) + seed, y >> 1) - 0.5) * 0.25,
          d = nx * nx + ny * ny;
        if (d > 1 + j) continue;
        const facet = (hash((x + rx) >> 2, (y + ry + seed) >> 2) - 0.5) * 0.4,
          lit = -0.5 * nx - 0.7 * ny + 0.4 * Math.sqrt(Math.max(0, 1 - d)) + facet;
        k.px(cx + x, cy + y, lit > 0.75 ? R[0] : lit > 0.4 ? R[1] : lit > 0.05 ? R[2] : R[3]);
      }
  }
  // Os : trait clair aux bouts renflés.
  function bone(k, x0, y0, x1, y1) {
    k.line(x0, y0, x1, y1, '#e8dfc6');
    k.line(x0, y0 + 1, x1, y1 + 1, '#b8ac90');
    for (const [x, y] of [
      [x0, y0],
      [x1, y1]
    ]) {
      k.rect(x - 1, y - 1, 2, 2, '#f4eedc');
      k.px(x + 1, y, '#e8dfc6');
    }
  }
  function skull(k, x, y, s = 1) {
    ell(k, x, y, 3 * s, 2.5 * s, '#e8dfc6');
    k.rect(x - 2 * s, y - 2 * s, 3 * s, 1, '#f8f2e2');
    k.rect(x - 2 * s, y, s + 0.5, s + 0.5, '#2a1810');
    k.rect(x + s, y, s + 0.5, s + 0.5, '#2a1810');
    k.rect(x - s, y + 2 * s, 3 * s, 1, '#b8ac90');
  }
  function crow(k, x, y, f = 1) {
    ell(k, x, y, 3, 2, '#1e1e2a');
    k.rect(x - 1, y - 1, 3, 1, '#3a3a52');
    k.disc(x + 3 * f, y - 2, 1, '#1e1e2a');
    k.px(x + 5 * f, y - 2, '#d8a828');
    k.px(x + 3 * f, y - 3, '#8a8aa0');
    k.rect(f > 0 ? x - 5 : x + 3, y, 3, 1, '#1e1e2a');
    k.px(x, y + 2, '#c8a020');
  }
  function bat(k, x, y) {
    k.rect(x, y, 3, 4, '#2a2030');
    k.px(x + 1, y - 1, '#2a2030');
    k.rect(x - 1, y + 1, 1, 2, '#3e3248');
    k.rect(x + 3, y + 1, 1, 2, '#3e3248');
    k.px(x, y + 3, '#ff6a5a');
    k.px(x + 2, y + 3, '#ff6a5a');
  }
  function ring(k, cx, cy, r, t, col) {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y);
        if (d <= r + 0.3 && d >= r - t) k.px(cx + x, cy + y, col);
      }
  }
  function grassTuft(k, x, y, col = '#5a8a42') {
    k.rect(x, y - 2, 1, 2, col);
    k.px(x - 1, y - 1, col);
    k.px(x + 1, y - 3, mix(col, '#ffffff', 0.25));
  }
  // Toile tendue (après le contour : fils fins, sans encre). a : ancrages, c : centre, rings : tours de spirale.
  function web(k, c, anchors, rings, col = 'rgba(244,244,248,0.78)') {
    for (const a of anchors) k.line(c[0], c[1], a[0], a[1], col);
    for (let r = 1; r <= rings; r++) {
      const t = r / (rings + 1),
        pts = anchors.map(a => [c[0] + (a[0] - c[0]) * t, c[1] + (a[1] - c[1]) * t]);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i],
          q = pts[(i + 1) % pts.length];
        // Fil qui ploie légèrement entre deux rayons.
        const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 1];
        k.line(p[0], p[1], m[0], m[1], col);
        k.line(m[0], m[1], q[0], q[1], col);
      }
    }
  }

  // ---------------------------------------------------------------- Grandes pièces (64 × 76)
  const STONE = {
    wolf: ['#c4ccc4', '#98a29c', '#6e7a78', '#4a5458'],
    bear: ['#c8b494', '#9a8466', '#6e5c46', '#4a3c2e'],
    troll: ['#a0ac94', '#76846c', '#55604e', '#383f34'],
    bat: ['#8e9290', '#686c6c', '#4a4e50', '#2e3234'],
    prowler: ['#ecd49c', '#c8aa6a', '#987c48', '#6a5430']
  };
  function den(k, R, v, seed) {
    shadow(k, 32, 67, 29, 5);
    blob(k, 32 + (v - 1) * 2, 54, 25, 24, R, seed, 0.5);
    blob(k, 13, 60, 9, 9, R, seed + 3);
    blob(k, 52 - v, 61, 9, 8, R, seed + 5);
    if (v === 2) blob(k, 44, 40, 9, 8, R, seed + 7);
    // Entrée de la tanière : une gueule sombre, des pierres plus claires autour.
    ell(k, 32, 61, 10, 8, '#1c130d');
    ell(k, 32, 63, 7, 6, '#0b0705');
    k.rect(22, 66, 21, 1, '#0b0705');
    for (const [x, y] of [
      [22, 56],
      [26, 53],
      [31, 52],
      [37, 53],
      [41, 56]
    ])
      k.rect(x, y, 3, 2, R[0]);
    // Mousse et herbes sur le dessus.
    for (let i = 0; i < 22; i++) {
      const x = 12 + Math.floor(hash(i, seed) * 40),
        y = 32 + Math.floor(hash(seed, i) * 14);
      k.rect(x, y, 2, 1, i % 3 ? '#5a7a42' : '#7a9a52');
    }
    for (const x of [10, 18, 46, 55]) grassTuft(k, x, 66);
  }
  const HIDE = {
    goblin: ['#b8a070', '#8e7650', '#6a5638', '#4a3a26', '#7a8a3a'],
    bandit: ['#a8a090', '#7e7868', '#5a564a', '#3e3a32', '#8a5a3a'],
    raider: ['#c86048', '#9a4434', '#6e3026', '#4a2018', '#d8b060']
  };
  function tent(k, P, v) {
    shadow(k, 32, 67, 27, 4);
    // Mâts croisés qui dépassent du sommet.
    k.line(25, 10, 33, 24, '#6a4a2e', 2);
    k.line(39, 10, 31, 24, '#5a3e26', 2);
    k.poly(
      [
        [7, 66],
        [32, 20],
        [57, 66]
      ],
      P[1]
    );
    k.poly(
      [
        [7, 66],
        [32, 20],
        [20, 66]
      ],
      P[0]
    );
    k.poly(
      [
        [45, 66],
        [32, 20],
        [57, 66]
      ],
      P[2]
    );
    // Coutures des peaux, pièces rapiécées, ourlet.
    for (const x of [14, 26, 38, 50]) k.line(32, 22, x, 66, P[3]);
    for (const [x, y, w] of [
      [16, 52, 6],
      [40, 44, 5],
      [22 + v * 4, 36, 4]
    ]) {
      k.rect(x, y, w, w - 1, P[4]);
      for (let i = 0; i < w; i += 2) k.px(x + i, y - 1, P[3]);
    }
    k.rect(7, 65, 50, 1, P[3]);
    // Entrée ouverte et pan relevé.
    k.poly(
      [
        [26, 66],
        [32, 42],
        [38, 66]
      ],
      '#160e09'
    );
    k.poly(
      [
        [32, 42],
        [38, 66],
        [42, 66]
      ],
      P[0]
    );
    // Cordes et piquets.
    k.line(7, 66, 2, 60, '#c8b08a');
    k.line(57, 66, 62, 60, '#c8b08a');
    k.rect(1, 60, 2, 4, '#5a3e26');
    k.rect(61, 60, 2, 4, '#5a3e26');
  }
  function totem(k, v) {
    shadow(k, 32, 67, 11, 3);
    const W = ['#a8784a', '#7e5634', '#5a3c24', '#3e2818'];
    k.rect(28, 18, 9, 49, W[1]);
    k.rect(28, 18, 2, 49, W[0]);
    k.rect(35, 18, 2, 49, W[2]);
    // Visages taillés et peints.
    for (const y of [32, 48]) {
      k.rect(28, y - 4, 9, 1, W[3]);
      k.rect(29, y, 2, 2, '#1a100a');
      k.rect(34, y, 2, 2, '#1a100a');
      k.rect(30, y + 4, 5, 2, '#1a100a');
      k.rect(28, y + 2, 9, 1, '#b83a2a');
    }
    // Planche en travers, ossements pendus, plumes.
    k.rect(20, 23, 25, 3, W[2]);
    k.rect(20, 23, 25, 1, W[0]);
    for (const x of [21, 43]) {
      k.line(x, 26, x, 32, '#c8b08a');
      bone(k, x - 1, 33, x + 1, 37);
    }
    for (const [x, c] of [
      [24, '#e8e0d0'],
      [40, '#b83a2a']
    ])
      for (let i = 0; i < 7; i++) k.px(x + (i % 2), 27 + i, c);
    // Crâne cornu au sommet.
    skull(k, 32, 14, 2);
    k.line(26, 12, 22, 4 + v, '#d8ccb0', 2);
    k.line(38, 12, 42, 4 + v, '#d8ccb0', 2);
  }
  function gallows(k, v) {
    shadow(k, 32, 67, 22, 4);
    const W = ['#8a6a4a', '#5e4430', '#40301e', '#2a1e12'];
    k.rect(14, 10, 6, 57, W[1]);
    k.rect(14, 10, 2, 57, W[0]);
    k.rect(14, 8, 36, 5, W[1]);
    k.rect(14, 8, 36, 1, W[0]);
    k.rect(14, 12, 36, 1, W[2]);
    k.line(20, 26, 32, 13, W[2], 2);
    k.line(44, 13, 44, 30, '#c4ac84');
    ring(k, 44, 33, 3, 1, '#c4ac84');
    // Corbeaux perchés sur la poutre.
    crow(k, 28, 5, 1);
    crow(k, 39 + v, 5, -1);
    if (v !== 1) crow(k, 48, 5, -1);
    // Tas de pierres au pied.
    blob(k, 17, 64, 8, 5, STONE.wolf, 3 + v);
    bone(k, 34, 63, 42, 61);
    skull(k, 47, 62);
  }
  function wagon(k, v) {
    shadow(k, 32, 67, 29, 4);
    const W = ['#b08458', '#8a6440', '#5e4430', '#3e2c1e'];
    // Caisse renversée sur le flanc, planches et ferrures.
    k.poly(
      [
        [6, 58],
        [42, 46],
        [48, 62],
        [12, 66]
      ],
      W[1]
    );
    for (let i = 0; i < 5; i++) k.line(7 + i * 1.2, 58 + i * 1.6, 43 + i * 1.2, 46 + i * 3.2, W[2]);
    k.line(6, 58, 42, 46, W[0], 2);
    k.line(20, 54, 22, 62, '#6a6a70', 2);
    k.line(34, 50, 36, 60, '#6a6a70', 2);
    // Roue dressée contre la caisse.
    ring(k, 47, 44, 11, 2, W[2]);
    ring(k, 47, 44, 9, 1, W[1]);
    for (let a = 0; a < 8; a++)
      k.line(47, 44, 47 + Math.cos(a * 0.785) * 9, 44 + Math.sin(a * 0.785) * 9, W[1]);
    k.disc(47, 44, 2, W[3]);
    // Sacs éventrés et pommes.
    ell(k, 18 + v * 2, 63, 6, 4, '#c8a878');
    k.rect(14 + v * 2, 61, 8, 1, '#e0c898');
    for (const x of [27, 30, 52]) k.rect(x, 64, 2, 2, '#c83a2a');
  }
  function nest(k, eggs, v, onRock) {
    shadow(k, 32, 67, 28, 5);
    const y = onRock ? 46 : 58;
    if (onRock) {
      blob(k, 32, 64, 26, 18, STONE.wolf, 11 + v, 0.3);
      blob(k, 12, 64, 8, 7, STONE.wolf, 13 + v);
    }
    // Couronne de branchages entrecroisés.
    ell(k, 32, y, 25, 9, '#5a3e24');
    ell(k, 32, y - 1, 19, 6, '#2e2014');
    for (let i = 0; i < 46; i++) {
      const a = hash(i, v + 31) * Math.PI * 2,
        r = 0.78 + hash(v, i + 3) * 0.3,
        x = 32 + Math.cos(a) * 24 * r,
        yy = y + Math.sin(a) * 8.5 * r;
      k.line(x - 3, yy - (i % 3) + 1, x + 3, yy + (i % 3) - 1, i % 4 ? '#8a6440' : '#b08458');
    }
    // Œufs.
    for (const [ex, ey] of [[25, y - 4], [33, y - 6], [40, y - 3], ...(v === 2 ? [[29, y - 1]] : [])]) {
      ell(k, ex, ey, 4, 5, eggs[1]);
      ell(k, ex - 1, ey - 1, 3, 3, eggs[0]);
      k.rect(ex - 2, ey - 3, 2, 2, '#ffffff');
      k.px(ex + 2, ey + 1, eggs[2]);
      k.px(ex, ey + 2, eggs[2]);
    }
    bone(k, 6, y + 6, 13, y + 8);
    skull(k, 54, y + 7);
  }
  function monolith(k, v) {
    shadow(k, 32, 67, 16, 4);
    const S = ['#a8a8c8', '#7a7a9a', '#565674', '#3a3a52'];
    k.poly(
      [
        [22, 66],
        [24, 16],
        [32, 6 + v],
        [40, 14],
        [43, 66]
      ],
      S[1]
    );
    k.poly(
      [
        [22, 66],
        [24, 16],
        [32, 6 + v],
        [28, 66]
      ],
      S[0]
    );
    k.poly(
      [
        [38, 66],
        [40, 14],
        [43, 66]
      ],
      S[2]
    );
    // Runes lumineuses.
    for (let i = 0; i < 4; i++) {
      const y = 20 + i * 11;
      k.rect(31, y, 2, 7, '#d8ccff');
      k.rect(29, y + 2 + (i % 2) * 2, 6, 1, '#b8a8ff');
      k.px(30 + (i % 3), y + 6, '#ffffff');
    }
    // Éclats qui flottent autour.
    for (const [x, y] of [
      [12, 30 + v * 2],
      [52, 24],
      [48, 46 - v]
    ]) {
      k.poly(
        [
          [x, y - 4],
          [x + 2, y],
          [x, y + 4],
          [x - 2, y]
        ],
        '#c8b8ff'
      );
      k.px(x, y - 2, '#ffffff');
    }
    blob(k, 20, 65, 6, 4, S, 41 + v);
    blob(k, 46, 65, 5, 3, S, 43 + v);
  }
  function blighttree(k, v) {
    shadow(k, 32, 67, 22, 4);
    const B = ['#5a4660', '#3e2e46', '#2a1e30', '#1a121e'];
    branch(k, bez([32, 66], [26 + v * 3, 46], [33, 26], 14), 7, B);
    for (const [a, b, c] of [
      [
        [31, 44],
        [18, 38],
        [8, 26 + v]
      ],
      [
        [33, 38],
        [44, 32],
        [54, 20]
      ],
      [
        [32, 30],
        [28, 18],
        [34, 8]
      ],
      [
        [30, 36],
        [22, 26],
        [20, 14]
      ]
    ])
      branch(k, bez(a, b, c, 10), 3, B);
    // Rares grappes de feuilles malades.
    const P = ['#3a1e4a', '#5e2e72', '#8a4a9e', '#b878cc'];
    for (const [x, y, r] of [
      [10, 24, 5],
      [52, 18, 6],
      [34, 9, 5],
      [20, 13, 4]
    ]) {
      k.disc(x + 1, y + 1, r, P[0]);
      k.disc(x, y, r - 1, P[1]);
      k.disc(x - 1, y - 1, r - 3, P[2]);
      k.px(x - 2, y - 2, P[3]);
    }
    // Veines et sève lumineuses, sève qui coule.
    for (let y = 36; y < 64; y += 5) k.px(30 + ((y * 3) % 5), y, '#d08aff');
    for (const [x, y, l] of [
      [9, 29, 6],
      [53, 24, 8],
      [35, 14, 5]
    ])
      for (let i = 0; i < l; i++) k.px(x, y + i, i === l - 1 ? '#e8b0ff' : '#9a4ac8');
    // Ronces au pied.
    for (const [a, b] of [
      [18, 64],
      [44, 65]
    ]) {
      k.line(a - 6, b, a, b - 6, '#3a1a3a', 2);
      k.line(a, b - 6, a + 6, b - 1, '#3a1a3a', 2);
      k.px(a, b - 7, '#c84ac8');
    }
  }

  // ---------------------------------------------------------------- Petites pièces (32 × 38, pied à y = 34)
  const SMALL = {
    lair_bones: (k, v) => {
      shadow(k, 16, 34, 11, 2);
      bone(k, 5 + v, 31, 14, 29 + v);
      bone(k, 17, 34, 26 - v, 32);
      if (v !== 1) bone(k, 9, 34, 12, 27);
      skull(k, 20 + (v === 2 ? -8 : 0), 29);
    },
    lair_ribcage: (k, v) => {
      shadow(k, 16, 34, 14, 3);
      // Colonne et côtes d'une grande bête, blanchies.
      k.line(3, 32, 27, 30 - v, '#d8ccb0', 2);
      for (let i = 0; i < 5; i++) {
        const x = 8 + i * 4;
        branch(k, bez([x, 31 - i * 0.3], [x - 3 - v, 22], [x + 1, 17 + i]), 2, [
          '#f4eedc',
          '#e0d6bc',
          '#b8ac90',
          '#9a8e74'
        ]);
      }
      ell(k, 28, 28, 3, 3, '#e8dfc6');
      k.rect(27, 27, 1, 1, '#2a1810');
      k.line(30, 26, 31, 21, '#d8ccb0');
    },
    lair_cocoon: (k, v) => {
      shadow(k, 16, 34, 7, 2);
      const lean = v - 1;
      for (let y = 10; y < 33; y++) {
        const t = (y - 10) / 23,
          w = Math.round(Math.sin(t * Math.PI) * 6 + 1),
          x = 16 + lean * t * 3;
        k.rect(x - w, y, w * 2, 1, '#d8d2c0');
        k.rect(x - w, y, Math.max(1, w - 1), 1, '#f0ece0');
        k.px(x + w - 1, y, '#a8a290');
        if ((y + v) % 3 === 0) k.rect(x - w + 1, y, w * 2 - 2, 1, '#bcb6a4');
      }
      // Une main qui dépasse.
      if (v === 2) {
        k.rect(20, 18, 3, 2, '#c89a7a');
        k.px(23, 17, '#c89a7a');
      }
    },
    lair_eggsac: (k, v) => {
      shadow(k, 16, 34, 9, 2);
      for (const [x, y] of [[12, 30], [17, 31], [21, 29], [15, 26], [19, 25], ...(v ? [[10, 26]] : [])]) {
        k.disc(x, y, 3, '#d8ccb0');
        k.disc(x - 1, y - 1, 2, '#f0e8d0');
        k.px(x - 1, y - 2, '#ffffff');
        k.px(x + 1, y + 1, '#8a7a5a');
      }
    },
    lair_groundweb: (k, v) => {
      // Touffes d'herbe et petit caillou où la toile, tendue au ras du sol, s'accroche.
      for (const [x, y] of [
        [3, 31],
        [29, 30],
        [8 + v, 22],
        [25 - v, 21],
        [15, 34]
      ])
        grassTuft(k, x, y, '#4e7a3a');
      blob(k, 27, 32, 2, 2, STONE.wolf, v);
      // Une proie emmaillotée prise dans la toile.
      if (v === 1) {
        ell(k, 19, 27, 2, 3, '#d8d2c0');
        k.px(18, 25, '#f0ece0');
      }
    },
    lair_mud: (k, v) => {
      ell(k, 16, 30, 14, 5, '#3e2a1a');
      ell(k, 16, 29, 12, 4, '#5a3e26');
      ell(k, 13 + v, 28, 6, 1, '#7a5a3a');
      k.rect(20, 30, 4, 1, '#8a6a48');
      // Empreintes de sabots tout autour.
      for (const [x, y] of [
        [3, 26],
        [27, 25],
        [6, 35 - v],
        [26, 34]
      ]) {
        k.px(x, y, '#3e2a1a');
        k.px(x + 2, y, '#3e2a1a');
      }
    },
    lair_rooted: (k, v) => {
      // Terre retournée par les groins : mottes, racines arrachées.
      for (let i = 0; i < 9; i++) {
        const x = 4 + Math.floor(hash(i, v + 5) * 24),
          y = 26 + Math.floor(hash(v + 5, i) * 8),
          r = 1 + (i % 3);
        k.disc(x, y, r, i % 2 ? '#6e4c30' : '#5a3e26');
        k.px(x - 1, y - r, '#8e6a48');
      }
      k.line(8, 27, 14, 23, '#c8a878');
      k.line(18, 25, 24, 21 + v, '#c8a878');
      grassTuft(k, 22, 33);
    },
    lair_slime: (k, v) => {
      ell(k, 16, 30, 13, 5, '#2e8a48');
      ell(k, 15, 29, 11, 4, '#4ec070');
      ell(k, 12, 28, 5, 1, '#a8f5b8');
      for (const [x, y, r] of [
        [20 - v, 27, 2],
        [9, 31, 1],
        [23, 31, 1]
      ]) {
        k.disc(x, y, r, '#8ae8a0');
        k.px(x - 1, y - r, '#ffffff');
      }
      if (v === 1) ell(k, 26, 24, 3, 3, '#4ec070');
    },
    lair_fire: (k, v) => {
      shadow(k, 16, 34, 11, 2);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        blob(
          k,
          Math.round(16 + Math.cos(a) * 10),
          Math.round(31 + Math.sin(a) * 3.5),
          2,
          2,
          STONE.wolf,
          i + v
        );
      }
      k.line(9, 32, 22, 27, '#5a3a22', 2);
      k.line(10, 27, 23, 32, '#4a3018', 2);
      k.poly(
        [
          [11, 31],
          [14, 20],
          [16, 24],
          [18, 15 + v],
          [21, 31]
        ],
        '#ff8a2a'
      );
      k.poly(
        [
          [13, 31],
          [16, 23],
          [19, 31]
        ],
        '#ffe07a'
      );
      k.px(12, 17, '#ffb04a');
      k.px(22, 19, '#ffb04a');
    },
    lair_crates: (k, v) => {
      shadow(k, 16, 34, 13, 2);
      const crate = (x, y, s) => {
        k.rect(x, y, s, s, '#a8784a');
        k.rect(x, y, s, 1, '#d0a06a');
        k.rect(x, y, 1, s, '#c08a58');
        k.rect(x + s - 1, y, 1, s, '#6a4a2e');
        k.rect(x, y + s - 1, s, 1, '#6a4a2e');
        k.line(x + 1, y + 1, x + s - 2, y + s - 2, '#7a5634');
      };
      crate(3, 21, 12);
      crate(14 + v, 25, 9);
      if (v !== 2) crate(6, 12, 8);
      ell(k, 26, 30, 4, 4, '#c8a878');
      k.rect(24, 26, 4, 1, '#a88858');
    },
    lair_stakes: (k, v) => {
      shadow(k, 16, 34, 14, 2);
      for (let i = 0; i < 5; i++) {
        const x = 4 + i * 6,
          top = 8 + ((i + v) % 3) * 4;
        k.poly(
          [
            [x - 2, 34],
            [x, top],
            [x + 2, 34]
          ],
          '#8a6440'
        );
        k.line(x - 1, 33, x - 1, top + 3, '#b08458');
        k.px(x, top, '#e8dcc0');
      }
      k.line(2, 24, 30, 22, '#c4ac84');
    },
    lair_grave: (k, v) => {
      shadow(k, 16, 34, 9, 2);
      ell(k, 16, 33, 9, 2, '#8a6a48');
      const S = ['#b4b4b8', '#8e8e94', '#68686e', '#48484e'];
      if (v === 1) {
        // Croix de pierre.
        k.rect(14, 10, 5, 23, S[1]);
        k.rect(9, 15, 15, 4, S[1]);
        k.rect(14, 10, 1, 23, S[0]);
        k.rect(9, 15, 15, 1, S[0]);
      } else {
        const tilt = v === 2 ? 2 : 0;
        k.poly(
          [
            [9 + tilt, 33],
            [9, 16],
            [12, 12],
            [20, 12],
            [23, 16],
            [23 + tilt, 33]
          ],
          S[1]
        );
        k.rect(10, 16, 2, 17, S[0]);
        k.rect(21, 16, 2, 17, S[2]);
        k.rect(15, 17, 2, 8, S[3]);
        k.rect(13, 19, 6, 2, S[3]);
        k.line(19, 13, 17, 20, S[3]);
      }
      for (let i = 0; i < 4; i++) k.px(10 + i * 3, 31 - (i % 2), '#6a8a4a');
    },
    lair_burrow: (k, v) => {
      ell(k, 16, 30, 13, 5, '#b8945e');
      ell(k, 15, 28, 11, 4, '#e0c088');
      ell(k, 12, 27, 5, 1, '#f4dcaa');
      ell(k, 17 + v, 30, 5, 3, '#2a1a10');
      ell(k, 17 + v, 31, 3, 2, '#120a06');
      for (const [x, y] of [
        [3, 33],
        [27, 34],
        [6, 25]
      ])
        k.rect(x, y, 2, 1, '#8a6a40');
    },
    lair_hornskull: (k, v) => {
      shadow(k, 16, 34, 6, 2);
      k.rect(15, 12, 3, 22, '#7a5232');
      k.rect(15, 12, 1, 22, '#a8784a');
      // Crâne de taureau aux grandes cornes.
      ell(k, 16, 11, 5, 4, '#e8dfc6');
      k.rect(14, 15, 5, 3, '#d8ccb0');
      k.rect(13, 10, 2, 2, '#2a1810');
      k.rect(18, 10, 2, 2, '#2a1810');
      branch(k, bez([12, 9], [4, 9], [3 + v, 1]), 2, ['#f0e6cc', '#d8ccb0', '#a89c80', '#8a7e64']);
      branch(k, bez([20, 9], [28, 9], [29 - v, 1]), 2, ['#f0e6cc', '#d8ccb0', '#a89c80', '#8a7e64']);
      // Chiffon rouge noué au pieu.
      k.rect(14, 21, 5, 2, '#a83a2a');
      k.line(18, 23, 20, 28, '#a83a2a');
    },
    lair_runestone_wisp: (k, v) => runestone(k, v, '#9ae8ff', ['#8a9a98', '#6a7a78', '#4e5c5a', '#343e3c']),
    lair_runestone_astral: (k, v) => runestone(k, v, '#c8b8ff', ['#a0a0bc', '#7a7a98', '#585874', '#3c3c54']),
    lair_glowshroom_fairy: (k, v) => glowshroom(k, v, ['#ff9ae0', '#d860b0', '#ffd8f4']),
    lair_glowshroom_wisp: (k, v) => glowshroom(k, v, ['#7ad8ff', '#3a98c8', '#d8f4ff']),
    lair_thorns: (k, v) => {
      for (const [a, b, c] of [
        [
          [4, 34],
          [6, 20],
          [14, 16 + v]
        ],
        [
          [28, 34],
          [26, 18],
          [16, 12]
        ],
        [
          [12, 34],
          [18, 26],
          [26, 24]
        ]
      ]) {
        branch(k, bez(a, b, c), 2, ['#6a3a6a', '#4a2a4a', '#2e1a2e', '#1a101a']);
        for (let i = 2; i < 9; i += 3) {
          const p = bez(a, b, c)[i];
          k.px(p[0] + 2, p[1] - 1, '#c84ac8');
          k.px(p[0] - 2, p[1] + 1, '#8a3a8a');
        }
      }
    },
    lair_blightpool: (k, v) => {
      ell(k, 16, 30, 13, 5, '#3e1e4a');
      ell(k, 15, 29, 11, 4, '#6a2e86');
      ell(k, 12, 28, 5, 1, '#c07ad0');
      for (const [x, y] of [
        [20 - v, 28],
        [9, 31]
      ]) {
        k.disc(x, y, 1, '#e0a8ff');
        k.px(x, y - 2, '#ffffff');
      }
    },
    lair_ootheca: (k, v) => {
      // Roseaux où pendent les oothèques mousseuses des mantes.
      for (const [x, h] of [
        [8, 26],
        [15, 32],
        [22, 28],
        [27, 22]
      ]) {
        k.rect(x, 34 - h, 1, h, '#6a7a3a');
        k.rect(x - 1, 34 - h, 3, 5, '#7a5232');
      }
      for (const [x, y] of [
        [15, 18 + v],
        [22, 22],
        [8, 24 - v]
      ]) {
        ell(k, x + 2, y, 3, 4, '#c8a870');
        k.rect(x, y - 2, 4, 1, '#e8cc90');
        k.rect(x, y + 1, 4, 1, '#a8885a');
      }
    },
    lair_hive: (k, v) => {
      shadow(k, 16, 34, 10, 2);
      // Souche et ruche de paille.
      k.rect(8, 23, 16, 11, '#6e4c30');
      k.rect(8, 23, 3, 11, '#8e6a48');
      k.rect(21, 23, 3, 11, '#4a3220');
      ell(k, 16, 23, 8, 2, '#b8945e');
      ell(k, 16, 23, 4, 1, '#8a6a42');
      ell(k, 16, 15, 7, 8, '#d8a84a');
      for (let y = 9; y < 22; y += 3) k.rect(10, y, 13, 1, '#a8741e');
      k.rect(12, 9, 3, 6, '#f0cc70');
      k.rect(14, 19, 4, 2, '#2a1a0a');
      for (const [x, y] of [
        [4 + v, 10],
        [27, 14],
        [25 - v, 6]
      ]) {
        k.px(x, y, '#ffd84a');
        k.px(x + 1, y, '#1a1a1a');
      }
    },
    lair_cauldron: (k, v) => {
      shadow(k, 16, 34, 12, 2);
      for (const x of [6, 26]) blob(k, x, 33, 3, 3, STONE.troll, x + v);
      k.poly(
        [
          [12, 34],
          [16, 27],
          [20, 34]
        ],
        '#ff8a2a'
      );
      ell(k, 16, 22, 10, 8, '#2a2a30');
      ell(k, 13, 19, 4, 4, '#4a4a54');
      ell(k, 16, 15, 9, 2, '#5a7a2a');
      ell(k, 16, 15, 7, 1, '#8ac84a');
      k.disc(13 + v, 14, 1, '#c8f0a0');
      bone(k, 19, 15, 24, 8);
    },
    lair_banner: (k, v) => {
      shadow(k, 16, 34, 5, 2);
      k.rect(14, 2, 2, 32, '#5a3e26');
      k.rect(14, 2, 1, 32, '#8a6440');
      k.rect(16, 4, 12, 14, '#a83a2a');
      k.rect(16, 4, 12, 2, '#c85a3a');
      for (let x = 16; x < 28; x += 3) k.rect(x, 18, 2, 1 + ((x + v) % 3), '#a83a2a');
      skull(k, 22, 10);
      k.rect(12, 1, 6, 2, '#c8a040');
    },
    lair_statue: (k, v) => {
      shadow(k, 16, 34, 9, 2);
      const S = ['#c0c0b8', '#9a9a92', '#76766e', '#54544e'];
      ell(k, 16, 32, 8, 2, S[2]);
      // Aventurier pétrifié : jambes, buste, tête, bras ; pose selon la variante.
      k.rect(12, 22, 3, 10, S[1]);
      k.rect(17, 22, 3, 10, S[2]);
      k.rect(11, 12, 10, 11, S[1]);
      k.rect(11, 12, 3, 11, S[0]);
      k.disc(16, 8, 3, S[1]);
      k.px(15, 7, S[0]);
      if (v === 0) {
        // Épée brandie.
        k.rect(20, 6, 2, 8, S[1]);
        k.rect(21, 0, 1, 8, S[0]);
        k.rect(8, 14, 3, 7, S[2]);
      } else if (v === 1) {
        // Bouclier levé devant le visage.
        ell(k, 9, 13, 4, 6, S[2]);
        k.px(8, 11, S[0]);
        k.rect(21, 14, 2, 8, S[1]);
      } else {
        // Bras levés, en fuite.
        k.line(11, 13, 6, 4, S[1], 2);
        k.line(20, 13, 25, 5, S[2], 2);
      }
      // Fissures et mousse.
      k.line(13, 15, 17, 21, S[3]);
      for (const [x, y] of [
        [12, 31],
        [19, 30],
        [11, 24]
      ])
        k.px(x, y, '#6a8a4a');
    }
  };
  function runestone(k, v, glow, S) {
    shadow(k, 16, 34, 8, 2);
    k.poly(
      [
        [9, 34],
        [10, 9],
        [15, 3 + v],
        [21, 8],
        [23, 34]
      ],
      S[1]
    );
    k.poly(
      [
        [9, 34],
        [10, 9],
        [15, 3 + v],
        [13, 34]
      ],
      S[0]
    );
    k.rect(21, 10, 2, 24, S[2]);
    k.rect(15, 11, 2, 12, glow);
    k.rect(13, 14 + v, 6, 1, glow);
    k.px(14, 20, glow);
    k.px(18, 20, glow);
    k.px(16, 11, '#ffffff');
    for (const x of [10, 12, 20]) k.px(x, 32, '#6a8a5a');
  }
  function glowshroom(k, v, C) {
    for (const [x, y, r] of [
      [10, 33, 4],
      [20, 32, 5],
      [15 + v, 26 - v, 3]
    ]) {
      k.rect(x - 1, y - r - 2, 2, r + 2, '#e8e0c8');
      ell(k, x, y - r - 3, r + 1, Math.max(1, Math.round(r * 0.6)), C[1]);
      ell(k, x - 1, y - r - 4, r, Math.max(1, Math.round(r * 0.4)), C[0]);
      k.px(x - 2, y - r - 4, C[2]);
      k.px(x + 1, y - r - 3, C[2]);
    }
  }

  // ---------------------------------------------------------------- Arbres envahis
  // Dessus de l'arbre d'origine : sa couronne est trouvée dans sa silhouette (pixels opaques au-dessus du tronc).
  function crownOf(src) {
    const g = src.getContext('2d'),
      d = g.getImageData(0, 0, src.width, src.height).data,
      W = src.width;
    let x0 = W,
      x1 = 0,
      y0 = src.height,
      y1 = 0;
    // En pixels d'art (l'arbre est agrandi × 2 avec une marge de 2).
    for (let y = 0; y < 46; y++)
      for (let x = 0; x < 64; x++) {
        const o = ((y * 2 + 3) * W + x * 2 + 3) * 4;
        if (d[o + 3] < 128) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    if (x1 < x0) return { cx: 32, cy: 26, rx: 20, ry: 16, bottom: 40 };
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2, bottom: y1 };
  }
  const OVERLAY = {
    // Toiles tendues dans la couronne et jusqu'au sol, cocons pendus aux branches.
    web(k, c, v, after, tint = 'rgba(244,244,248,0.6)', sac = ['#d8d2c0', '#f0ece0']) {
      if (after) {
        const L = c.cx - c.rx * 0.85,
          Rr = c.cx + c.rx * 0.85;
        web(
          k,
          [c.cx - c.rx * 0.3, c.cy + c.ry * 0.1],
          [
            [L, c.cy - c.ry * 0.5],
            [c.cx - c.rx * 0.2, c.cy - c.ry * 0.9],
            [c.cx + c.rx * 0.2, c.cy - c.ry * 0.3],
            [c.cx, c.bottom + 4],
            [L + 2, c.bottom + 2]
          ],
          3,
          tint
        );
        web(
          k,
          [c.cx + c.rx * 0.45, c.cy + c.ry * 0.35],
          [
            [Rr, c.cy - c.ry * 0.2],
            [c.cx + c.rx * 0.2, c.cy - c.ry * 0.1],
            [c.cx + 4, c.bottom + 6],
            [Rr, c.bottom + 2]
          ],
          2 + v,
          tint
        );
        // Longs fils jusqu'au sol.
        k.line(L + 1, c.bottom, L - 6, 66, tint);
        k.line(Rr - 1, c.bottom, Rr + 6, 66, tint);
        k.line(c.cx + 8, c.bottom + 4, c.cx + 14, 66, tint);
        k.line(c.cx + c.rx * 0.6, c.bottom - 2, c.cx + c.rx * 0.6, c.bottom + 10, tint);
        return;
      }
      // Cocon pendu sous la couronne.
      const x = Math.round(c.cx + c.rx * (v === 1 ? -0.55 : 0.6)),
        y = Math.round(c.bottom + 10);
      for (let i = -6; i <= 6; i++) {
        const w = Math.round(Math.cos((i / 7) * (Math.PI / 2)) * 3) + 1;
        k.rect(x - w, y + i, w * 2, 1, sac[0]);
        k.rect(x - w, y + i, w, 1, sac[1]);
      }
    },
    venom(k, c, v, after) {
      OVERLAY.web(k, c, v, after, 'rgba(200,240,150,0.72)', ['#b8c88a', '#d8e8a8']);
      if (!after) for (const [x, y] of [[c.cx - c.rx * 0.4, c.bottom + 3]]) k.rect(x, y, 1, 2, '#9ae04a');
    },
    // Chauves-souris pendues sous les branches.
    bats(k, c, v, after) {
      if (after) return;
      const n = 4 + v;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n,
          x = Math.round(c.cx - c.rx * 0.8 + t * c.rx * 1.6),
          y = Math.round(c.bottom - 2 + Math.sin(t * Math.PI) * 4 + (i % 2) * 2);
        bat(k, x, y);
      }
    },
    // Corbeaux perchés sur la couronne.
    crows(k, c, v, after) {
      if (after) return;
      crow(k, Math.round(c.cx - c.rx * 0.45), Math.round(c.cy - c.ry * 0.75), 1);
      crow(k, Math.round(c.cx + c.rx * 0.4), Math.round(c.cy - c.ry * 0.95), -1);
      if (v !== 1) crow(k, Math.round(c.cx + c.rx * 0.7), Math.round(c.cy - c.ry * 0.1), -1);
    }
  };
  function dressTree(dress, base, v) {
    const src = window.PIXEL_DECOR_VARIANTS[base]?.[v] || PIXEL_DECOR[base];
    if (!src) return null;
    const c = crownOf(src),
      solid = brush(64, 76),
      thin = brush(64, 76);
    OVERLAY[dress](solid, c, v, false);
    outline(solid);
    OVERLAY[dress](thin, c, v, true);
    const cv = makeCanvas(src.width, src.height),
      g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(src, 0, 0);
    g.drawImage(thin.cv, 2, 2, 128, 152);
    g.drawImage(solid.cv, 2, 2, 128, 152);
    cv.canaanPolished = true;
    return cv;
  }

  // ---------------------------------------------------------------- Cuisson
  // Peint au pinceau, modelé, cerné ; after : fils et voiles peints ensuite, sans encre ; agrandi × 2 sans flou.
  function bake(w, h, fn, seed, after) {
    const k = brush(w, h);
    fn(k);
    polish(k.cv, 1, seed);
    outline(k);
    after?.(k);
    const cv = makeCanvas(w * 2 + 4, h * 2 + 4),
      g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(k.cv, 2, 2, w * 2, h * 2);
    cv.canaanPolished = true;
    return cv;
  }
  const V = window.PIXEL_DECOR_VARIANTS;
  const big = (name, fn) => (V[name] = [0, 1, 2].map(v => bake(64, 76, k => fn(k, v), name.length * 11 + v)));
  for (const [key, R] of Object.entries(STONE))
    big('lair_den_' + key, (k, v) => den(k, R, v, key.length * 7 + v));
  for (const [key, P] of Object.entries(HIDE)) big('lair_tent_' + key, (k, v) => tent(k, P, v));
  big('lair_totem', totem);
  big('lair_gallows', gallows);
  big('lair_wagon', wagon);
  big('lair_nest_drake', (k, v) => nest(k, ['#f0c070', '#d89040', '#8a4a1a'], v, false));
  big('lair_nest_astral', (k, v) => nest(k, ['#d8e8ff', '#8ab0f0', '#ffffff'], v, false));
  big('lair_nest_eagle', (k, v) => nest(k, ['#f8f4ec', '#d8d0c0', '#8a7a6a'], v, true));
  big('lair_monolith', monolith);
  big('lair_blighttree', blighttree);
  for (const [name, fn] of Object.entries(SMALL))
    V[name] = [0, 1, 2].map(v =>
      bake(
        32,
        38,
        k => fn(k, v),
        name.length * 5 + v,
        // Toiles au sol : une grande toile tendue entre les brindilles, par-dessus.
        name === 'lair_groundweb'
          ? k =>
              web(
                k,
                [16, 27],
                [
                  [3, 28],
                  [8 + v, 20],
                  [16, 18],
                  [25 - v, 19],
                  [29, 27],
                  [24, 33],
                  [8, 33]
                ],
                3,
                'rgba(240,240,246,0.62)'
              )
          : name === 'lair_eggsac' || name === 'lair_cocoon'
            ? k => {
                k.line(16, 0, 16 + (v - 1) * 3, 12, 'rgba(244,244,248,0.8)');
                k.line(6, 34, 13, 24, 'rgba(244,244,248,0.6)');
                k.line(27, 34, 19, 25, 'rgba(244,244,248,0.6)');
              }
            : null
      )
    );
  // Arbres envahis : peints à la première vue (il y a beaucoup de combinaisons, peu sont sur l'île).
  for (const [name, base] of Object.entries(trees)) {
    const dress = name.slice(5, name.length - base.length - 1);
    let list = null;
    Object.defineProperty(V, name, {
      enumerable: true,
      configurable: true,
      get: () => (list ??= [0, 1, 2].map(v => dressTree(dress, base, v)).filter(Boolean))
    });
    Object.defineProperty(PIXEL_DECOR, name, {
      enumerable: true,
      configurable: true,
      get: () => V[name][0]
    });
  }
  for (const name of [...BIG, ...Object.keys(SMALL)]) PIXEL_DECOR[name] = V[name][0];
})();
