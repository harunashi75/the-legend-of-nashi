// Décors de la nature de l'île en pixel art, dans la facture des bâtiments, des portails et des Tréfonds : grille de
// gros pixels (1 pixel d'art = 2 pixels d'écran), aplats de 4 à 5 tons, lumière en haut à gauche, grain et contour
// sombre. Arbres (feuillus, arbres anciens, pins, arbres d'automne, arbres lumineux, arbres tordus du marais,
// palmiers, bois mort), buissons, fleurs, champignons, roseaux, nénuphars, feuilles mortes, dunes, plantes
// magiques, cristaux, cactus, rochers, pics et ruines.
// Chaque espèce a trois variantes, et certaines une version par région (buisson roux en automne, amanite en forêt,
// fleurs lumineuses en forêt enchantée…) : PIXEL_DECOR_VARIANTS['nom'] ou ['nom@région'] ; world-look.js choisit la
// variante d'une case. PIXEL_DECOR[nom] reçoit la première variante (mêmes tailles qu'avant : 68 × 80, arbres
// 132 × 156). Les sprites sont déjà modelés et cernés (canaanPolished : world-look.js ne les repolit pas).
(() => {
  'use strict';
  if (typeof document === 'undefined' || typeof PIXEL_DECOR === 'undefined') return;
  const { brush, outline, polish, mix, hashGrid: hash, bez, branch, bayer, makeCanvas } = CANAAN_PIXEL_KIT;
  const probe = brush(2, 2);
  if (!probe.g?.getImageData) return;

  // ---------------------------------------------------------------- Formes
  // Ombre de contact tramée (transparente : pas de contour autour).
  function shadow(k, cx, cy, rx, ry) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (d > 1 || bayer(x, y) < d * 0.8) continue;
        k.g.fillStyle = 'rgba(16,26,14,.38)';
        k.g.fillRect(cx + x, cy + y, 1, 1);
      }
  }
  function disc(k, cx, cy, r, col) {
    if (r <= 0) return k.px(cx, cy, col);
    k.disc(Math.round(cx), Math.round(cy), Math.round(r), col);
  }
  function ellipse(k, cx, cy, rx, ry, col) {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(cx - w, cy + y, w * 2 + 1, 1, col);
    }
  }
  // Couronne de feuillage : grappes rondes en quatre tons, éclairées en haut à gauche, feuilles qui débordent au
  // pourtour, texture de feuilles, fruits ou fleurs (P[4]).
  function crown(k, cx, cy, rx, ry, P, seed, n = 16, fruit = 0) {
    const spots = [];
    for (let i = 0; i < n; i++) {
      const a = hash(i, seed) * Math.PI * 2,
        d = Math.sqrt(hash(seed, i + 9));
      spots.push([
        cx + Math.cos(a) * rx * d * 0.74,
        cy + Math.sin(a) * ry * d * 0.74,
        Math.max(3, Math.round(Math.min(rx, ry) * (0.36 + hash(i, i + seed) * 0.26)))
      ]);
    }
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of spots) disc(k, x + 1, y + 2, r + 1, P[0]);
    for (const [x, y, r] of spots) disc(k, x, y, r, P[1]);
    for (const [x, y, r] of spots) if (y < cy + ry * 0.35) disc(k, x - 1, y - 1, r - 2, P[2]);
    for (const [x, y, r] of spots) if (y < cy + ry * 0.05) disc(k, x - 2, y - 2, r - 4, P[3]);
    // Feuilles au pourtour.
    for (let i = 0; i < 34; i++) {
      const a = hash(i, seed + 3) * Math.PI * 2,
        d = 0.86 + hash(seed + 3, i) * 0.22,
        x = Math.round(cx + Math.cos(a) * rx * d),
        y = Math.round(cy + Math.sin(a) * ry * d);
      k.rect(x, y, 2, 1, Math.sin(a) < -0.2 ? P[2] : P[1]);
      k.px(x + (i & 1), y + 1, P[0]);
    }
    // Texture : petites feuilles plus sombres dans la masse.
    const img = k.g.getImageData(0, 0, k.w, k.h),
      dd = img.data;
    for (let y = Math.max(0, Math.floor(cy - ry - 2)); y < Math.min(k.h, cy + ry + 3); y++)
      for (let x = Math.max(0, Math.floor(cx - rx - 2)); x < Math.min(k.w, cx + rx + 3); x++) {
        const o = (y * k.w + x) * 4;
        if (dd[o + 3] < 200) continue;
        const h2 = hash(x * 3 + seed, y * 5);
        if (h2 > 0.9) for (let q = 0; q < 3; q++) dd[o + q] *= 0.8;
        else if (h2 < 0.04 && y < cy) for (let q = 0; q < 3; q++) dd[o + q] = Math.min(255, dd[o + q] * 1.18);
      }
    k.g.putImageData(img, 0, 0);
    for (let i = 0; i < fruit; i++) {
      const a = hash(i, seed + 5) * Math.PI * 2,
        d = Math.sqrt(hash(seed + 5, i)) * 0.8,
        x = Math.round(cx + Math.cos(a) * rx * d),
        y = Math.round(cy + Math.sin(a) * ry * d);
      k.rect(x, y, 2, 2, P[4]);
      k.px(x, y, mix(P[4], '#ffffff', 0.5));
    }
  }
  // Tronc : écorce en trois tons, lignes d'écorce, pied évasé et racines.
  function trunk(k, x, top, bot, w, B, seed, lean = 0) {
    for (let y = top; y <= bot; y++) {
      const t = (y - top) / Math.max(1, bot - top),
        flare = y > bot - 5 ? (y - (bot - 5)) * 0.9 : 0,
        ww = Math.round(w + flare * 2),
        xx = Math.round(x + lean * (1 - t) - ww / 2);
      k.rect(xx, y, ww, 1, B[1]);
      k.rect(xx, y, 1, 1, B[0]);
      k.rect(xx + ww - 2, y, 2, 1, B[2]);
      if (hash(y, seed) > 0.72 && ww > 3) k.px(xx + 1 + Math.floor(hash(seed, y) * (ww - 2)), y, B[3]);
    }
    k.rect(x - w / 2 - 4, bot, 3, 1, B[2]);
    k.rect(x + w / 2 + 1, bot, 3, 1, B[2]);
  }
  const ramp = (a, b, c, d) => [a, b, c, d];

  // ---------------------------------------------------------------- Arbres (grille 64 × 76, pied à y = 66)
  const BARK = ramp('#9a7650', '#6e5038', '#4a3424', '#2e2014');
  const TREES = {
    tree: (k, v) => {
      shadow(k, 32, 67, 22, 4);
      trunk(k, 32, 36, 66, 7, BARK, 11 + v, v - 1);
      branch(k, bez([32, 44], [24, 38], [18, 30], 8), 2, BARK);
      branch(k, bez([33, 42], [40, 36], [46, 28], 8), 2, BARK);
      const P = [
        ['#1c4a2e', '#2e6a3e', '#4a8c4c', '#86c062', '#f6c5e2'],
        ['#1e4c28', '#326e34', '#509046', '#90c45e', '#e8483a'],
        ['#1a442c', '#2a643c', '#468648', '#7cba5c', '#fff4d0']
      ][v];
      crown(k, 32 + (v - 1) * 2, 26, 24 - v, 20 + (v === 2 ? 2 : 0), P, 3 + v * 7, 16, v === 0 ? 0 : 7);
    },
    bigtree: (k, v) => {
      shadow(k, 32, 68, 26, 5);
      trunk(k, 32, 34, 67, 13, ramp('#7a6048', '#4f3a2a', '#36261a', '#22160e'), 21 + v);
      for (const [x0, x1] of [
        [22, 12],
        [42, 52]
      ])
        branch(
          k,
          bez([x0 + 3, 66], [x0, 63], [x1, 68], 6),
          3,
          ramp('#7a6048', '#4f3a2a', '#36261a', '#22160e')
        );
      // Mousse sur le tronc.
      for (let y = 50; y < 66; y += 3) k.rect(27, y, 2 + (y % 2), 1, '#5a8a48');
      crown(
        k,
        32,
        22,
        31,
        21,
        ['#123622', '#1d4a30', '#2e6a40', '#5a9a58', '#d8f0a0'],
        11 + v * 5,
        22,
        v === 1 ? 6 : 0
      );
    },
    pine: (k, v, snow) => {
      shadow(k, 32, 67, 16, 4);
      trunk(k, 32, 50, 66, 5, ramp('#8a6a50', '#5a4130', '#3e2c1e', '#261a10'), 31 + v);
      const tones = snow
          ? ['#5a7a76', '#8aa8a4', '#c5d8d4', '#ffffff']
          : [
              ['#123a2c', '#1e4e3c', '#2f6e54', '#5a9a74'],
              ['#163c30', '#21503e', '#34735a', '#62a07a'],
              ['#10342a', '#1a4838', '#2a6650', '#529268']
            ][v],
        tiers = 4 + (v === 1 ? 1 : 0);
      for (let j = 0; j < tiers; j++) {
        const y0 = 4 + j * (46 / tiers),
          half = 7 + j * (16 / tiers) * 1.6,
          hgt = 14;
        for (let row = 0; row < hgt; row++) {
          const w = Math.round((half * (row + 2)) / (hgt + 1)) + ((row + j) % 4 === 0 ? 1 : 0);
          k.rect(32 - w, y0 + row, w * 2, 1, tones[1]);
          k.rect(32 - w, y0 + row, Math.max(1, Math.round(w * 0.6)), 1, tones[2]);
          k.rect(32 + w - 2, y0 + row, 2, 1, tones[0]);
          if (row === hgt - 1) {
            for (let x = -w; x < w; x += 3) k.px(32 + x + 1, y0 + row + 1, tones[0]);
          }
        }
        k.rect(32 - Math.round(half * 0.4), y0 + 5, 3, 1, tones[3]);
        if (snow)
          for (let x = -half * 0.6; x < half * 0.3; x += 2) k.px(32 + x, y0 + 8 + ((x * 3) & 1), '#ffffff');
      }
    },
    autumn: (k, v, pal, seed) => {
      shadow(k, 32, 67, 22, 4);
      trunk(k, 32, 38, 66, 7, ramp('#8a6648', '#5e4330', '#3e2c1e', '#2a1c12'), seed + v, v - 1);
      branch(k, bez([32, 46], [26, 40], [20, 34], 8), 2, BARK);
      branch(k, bez([33, 44], [38, 38], [44, 32], 8), 2, BARK);
      crown(k, 32 + (v - 1) * 2, 27, 24 - v, 19, pal, seed + v * 7, 15);
      // Feuilles tombées au pied.
      for (let i = 0; i < 9; i++)
        k.rect(
          14 + Math.floor(hash(i, seed + v) * 36),
          64 + Math.floor(hash(seed, i + v) * 5),
          2,
          1,
          pal[1 + (i % 3)]
        );
    },
    glowtree: (k, v) => {
      shadow(k, 32, 67, 22, 4);
      trunk(k, 32, 38, 66, 7, ramp('#d8daf2', '#a8aad0', '#7a7ca8', '#54567e'), 41 + v, v - 1);
      branch(k, bez([32, 46], [24, 40], [18, 32], 8), 2, ramp('#d8daf2', '#a8aad0', '#7a7ca8', '#54567e'));
      crown(k, 32, 26, 24, 20, ['#1e6a6a', '#2e8f8a', '#4fc0b0', '#9ff4e4', '#f6d8ff'], 17 + v * 5, 16, 9);
      // Lianes lumineuses qui pendent.
      for (const x of [14, 22, 44, 50].slice(v, v + 3)) {
        for (let y = 38; y < 46 + (x % 5); y++) k.px(x, y, '#7ff0dc');
        k.px(x, 46 + (x % 5), '#f6d8ff');
      }
    },
    twisted: (k, v) => {
      shadow(k, 32, 67, 18, 4);
      const B = ramp('#7a6e60', '#4a4038', '#342c26', '#221c18');
      branch(k, bez([32, 66], [24 + v * 3, 48], [32, 28], 14), 6, B);
      for (const [a, b, c] of [
        [
          [30, 40],
          [18, 34],
          [10, 22]
        ],
        [
          [32, 34],
          [42, 28],
          [50, 16]
        ],
        [
          [31, 30],
          [28, 20],
          [34, 10]
        ]
      ])
        branch(k, bez(a, b, c, 10), 3, B);
      const P = ['#2e3e2a', '#4f6b4a', '#6a8a5a', '#8aa870'];
      crown(k, 14, 20, 10, 6, P, 21 + v, 7);
      crown(k, 48, 15, 10, 6, P, 22 + v, 7);
      crown(k, 33, 9, 8, 5, P, 23 + v, 6);
      // Mousse pendante.
      for (const [x, y, l] of [
        [10, 25, 13],
        [16, 26, 9],
        [44, 20, 14],
        [52, 19, 10],
        [30, 13, 9],
        [36, 13, 12]
      ]) {
        for (let i = 0; i < l; i++) k.px(x + (i % 4 === 3 ? 1 : 0), y + i, i % 3 ? '#7a8a5a' : '#9aaa70');
      }
    },
    palm: (k, v) => {
      shadow(k, 34, 67, 16, 4);
      const pts = bez([32, 66], [30 + v * 3, 42], [36 + v * 2, 20], 24);
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        k.rect(x - 3, y, 6, 2, i % 3 === 0 ? '#5a4024' : '#8a6438');
        k.px(x - 3, y, '#b08850');
        k.px(x + 2, y, '#4a3420');
      }
      const [tx, ty] = pts[pts.length - 1];
      for (let j = 0; j < 7; j++) {
        const a = -Math.PI * 1.05 + (j / 6) * Math.PI * 1.1,
          len = 22 + (j % 2) * 3;
        for (let t = 0; t < len; t++) {
          const x = tx + Math.cos(a) * t,
            y = ty + Math.sin(a) * t * 0.55 + (t * t) / 38;
          k.rect(x, y, 2, 2, t % 4 === 0 ? '#2e6a3e' : '#43834d');
          k.px(x, y - 1, '#7ab860');
          if (t > 4 && t % 3 === 0) k.px(x, y + 2, '#2a5a34');
        }
      }
      for (const [dx, dy] of [
        [-2, 2],
        [2, 3],
        [0, 4]
      ]) {
        disc(k, tx + dx, ty + dy, 2, '#7a4a20');
        k.px(tx + dx - 1, ty + dy - 1, '#b07a3a');
      }
    },
    deadwood: (k, v) => {
      shadow(k, 32, 67, 14, 3);
      const B = ramp('#c8b8a0', '#9a8a74', '#6e6050', '#4a4036');
      branch(k, bez([32, 66], [30 - v * 2, 50], [33, 32], 12), 5, B);
      const arms = [
        [
          [32, 46],
          [22, 40],
          [16, 30]
        ],
        [
          [33, 40],
          [42, 36],
          [48, 26]
        ],
        [
          [32, 34],
          [30, 26],
          [34, 18]
        ],
        [
          [16, 30],
          [12, 28],
          [10, 24]
        ],
        [
          [48, 26],
          [52, 24],
          [54, 18]
        ]
      ];
      arms.slice(0, 3 + v).forEach((a, i) => branch(k, bez(a[0], a[1], a[2], 8), i < 3 ? 2 : 1, B));
      k.rect(24, 65, 16, 2, B[2]);
      if (v === 2) {
        k.rect(18, 64, 6, 2, '#a89a80');
        k.px(17, 63, '#e8e0c8');
      }
    }
  };
  // Arbre aux feuilles d'or (terre du sud-ouest) : tronc clair d'écorce argentée marquée de sombre (comme un
  // bouleau), couronne haute et ronde en quatre tons de miel, petites feuilles qui scintillent (P[4]).
  TREES.golden = (k, v) => {
    const BIRCH = ramp('#efe6d2', '#cfc2a6', '#9a8a70', '#4a3e30');
    shadow(k, 32, 67, 21, 4);
    trunk(k, 32, 34, 66, 6, BIRCH, 41 + v, v - 1);
    // Marques sombres de l'écorce, en travers.
    for (let y = 38; y < 62; y += 5 + (y % 3)) k.rect(30 + ((y * 7) % 3), y, 3, 1, BIRCH[3]);
    branch(k, bez([32, 42], [25, 36], [19, 28], 8), 2, BIRCH);
    branch(k, bez([33, 40], [40, 34], [45, 27], 8), 2, BIRCH);
    const P = [
      ['#7a5410', '#b8861c', '#e6b832', '#ffe878', '#fffbe0'],
      ['#7e4a12', '#c07a1e', '#eaa834', '#ffd870', '#fff4c8'],
      ['#6e5a14', '#a8921e', '#dcc236', '#fff08a', '#ffffff']
    ][v];
    crown(k, 32 + (v - 1) * 2, 25, 23 - v, 21, P, 151 + v * 9, 17, 9);
  };
  const AUTUMN = {
    autumn_red: [['#5a1a16', '#8d2a22', '#c4402e', '#ee7a50'], 61],
    autumn_orange: [['#6a3412', '#a8561e', '#d8802c', '#f8b45a'], 71],
    autumn_gold: [['#6a4a12', '#a8801e', '#dcb236', '#fbe27a'], 81]
  };

  // ---------------------------------------------------------------- Petits décors (grille 32 × 38, pied à y = 33)
  const SMALL = {
    bush: (k, v, z) => {
      const P = {
        3: ['#5a2a12', '#a8561e', '#d8802c', '#f8b45a', '#c4402e'],
        5: ['#12504c', '#1e7a70', '#3aa898', '#8ae8d8', '#f6d8ff'],
        2: ['#2a3a24', '#40583a', '#5e7a4e', '#8aa070', '#c8a060'],
        6: ['#4a4a14', '#7a7a24', '#a8a238', '#dcd060', '#ffe070']
      }[z] || ['#1c4a2a', '#2e6a3a', '#4a8c48', '#86c062', ['#e8483a', '#fff4d0', '#f6c5e2'][v]];
      shadow(k, 16, 34, 12, 2);
      crown(k, 16, 27, 12 - v, 7, P, 91 + v * 3 + z * 11, 9, v === 1 ? 0 : 5);
    },
    flower: (k, v, z) => {
      const cols =
          z === 5
            ? [
                ['#7ff0dc', '#c99bff', '#ffffff'],
                ['#c99bff', '#e0c8ff', '#7ff0dc'],
                ['#9ff4e4', '#f6d8ff', '#c99bff']
              ][v]
            : [
                ['#f6c5e2', '#ffffff', '#f8d96a'],
                ['#e8483a', '#f8a040', '#fff4d0'],
                ['#9ab0ff', '#d3b4ee', '#ffffff']
              ][v],
        G = z === 5 ? ['#1e6a5a', '#2e8a70', '#4fc0a0'] : ['#2e5a2a', '#467b46', '#6aa552'];
      // Terre du sud-ouest : boutons d'or, marguerites et soucis.
      if (z === 6)
        cols.splice(
          0,
          3,
          ...[
            ['#ffd84a', '#fff4c8', '#f0a83a'],
            ['#ffffff', '#ffd84a', '#fff4c8'],
            ['#f0a83a', '#ffd84a', '#e8483a']
          ][v]
        );
      shadow(k, 16, 34, 11, 2);
      for (let i = 0; i < 9; i++) {
        const x = 6 + Math.floor(hash(i, v + z) * 20),
          h = 4 + Math.floor(hash(v, i) * 6);
        k.rect(x, 33 - h, 1, h, G[1]);
        k.rect(x - 1, 33 - Math.floor(h / 2), 2, 1, G[2]);
        k.px(x + 1, 33 - Math.floor(h / 3), G[0]);
      }
      for (let i = 0; i < 6; i++) {
        const x = 6 + Math.floor(hash(i + 20, v + z) * 20),
          y = 22 + Math.floor(hash(v + 3, i) * 8),
          c = cols[i % 2];
        k.rect(x, y - 2, 1, 6, G[1]);
        k.rect(x - 1, y - 1, 3, 1, c);
        k.rect(x, y - 2, 1, 3, c);
        k.px(x, y - 1, cols[2]);
      }
    },
    mushroom: (k, v, z) => {
      const caps =
        z === 1
          ? ['#e8483a', '#b02a24', '#ffffff']
          : z === 2
            ? ['#a8784a', '#7a5432', '#e8d8b0']
            : z === 5
              ? ['#d883a9', '#a75c8a', '#fff0ff']
              : ['#d8a050', '#a87830', '#fff4d0'];
      shadow(k, 16, 34, 11, 2);
      const list = [
        [
          [16, 15, 7],
          [8, 8, 4]
        ],
        [
          [14, 18, 8],
          [23, 9, 4],
          [7, 7, 3]
        ],
        [[16, 12, 9]]
      ][v];
      for (const [x, h, r] of list) {
        const top = 33 - h;
        k.rect(x - 1, top, 3, h, '#e8d9bb');
        k.px(x - 1, top + 1, '#fff8e8');
        k.rect(x + 1, top, 1, h, '#b8a888');
        for (let y = -Math.ceil(r * 0.6); y <= 0; y++) {
          const w = Math.round(r * Math.sqrt(Math.max(0, 1 - (y * y) / (r * r * 0.36 + 0.01))));
          k.rect(x - w, top + y, w * 2 + 1, 1, y < -r * 0.3 ? caps[0] : caps[1]);
        }
        k.rect(x - r + 1, top + 1, r * 2 - 1, 1, '#6a4a3a');
        if (z !== 2)
          for (let i = 0; i < 3; i++)
            k.px(
              x - r + 2 + Math.floor(hash(i, x) * (r * 2 - 3)),
              top - 1 - Math.floor(hash(x, i) * r * 0.4),
              caps[2]
            );
      }
    },
    reed: (k, v, z) => {
      for (let i = 0; i < 7; i++) {
        const x = 5 + i * 3 + Math.floor(hash(i, v) * 2),
          h = 14 + Math.floor(hash(v, i) * 12),
          bend = hash(i + v, 7) > 0.6 ? 1 : 0;
        for (let y = 0; y < h; y++) k.px(x + (y > h * 0.7 ? bend : 0), 33 - y, i % 2 ? '#6e9a5e' : '#8ab46a');
        if (i % 2 === 0) {
          k.rect(x - 1 + bend, 33 - h - 5, 3, 6, '#7a4a28');
          k.px(x - 1 + bend, 33 - h - 5, '#a06a3a');
          k.px(x + bend, 33 - h - 7, '#8ab46a');
        }
      }
      k.g.fillStyle = 'rgba(40,70,80,.35)';
      k.g.fillRect(4, 33, 24, 2);
    },
    // Touffe de blé mûr (terre du sud-ouest) : tiges dorées, épis barbus qui penchent, une tige verte au pied.
    wheat: (k, v) => {
      shadow(k, 16, 34, 11, 2);
      const T = ['#a07c2a', '#c8a040', '#e8c860', '#fff0a0'];
      for (let i = 0; i < 9; i++) {
        const x = 5 + i * 2.6 + Math.floor(hash(i, v + 3) * 2),
          h = 17 + Math.floor(hash(v + 5, i) * 9),
          lean = hash(i, v + 11) > 0.5 ? 1 : -1;
        for (let y = 0; y < h; y++)
          k.px(Math.round(x + (y > h * 0.6 ? lean : 0)), 33 - y, i % 3 ? T[1] : T[0]);
        // Épi : grains en quinconce, barbes claires au-dessus.
        const ex = Math.round(x + lean),
          ey = 33 - h;
        for (let j = 0; j < 6; j++) {
          k.px(ex - (j & 1), ey - j, T[2]);
          k.px(ex + 1 - (j & 1), ey - j, j % 2 ? T[1] : T[3]);
        }
        k.px(ex - 1, ey - 7, T[3]);
        k.px(ex + 1, ey - 8, T[3]);
      }
      k.rect(9, 30, 1, 4, '#6e7e2e');
      k.rect(21, 29, 1, 5, '#7a8a34');
    },
    lilypad: (k, v) => {
      for (const [x, y, r] of [
        [
          [11, 28, 6],
          [22, 31, 4]
        ],
        [
          [15, 29, 7],
          [6, 33, 3],
          [25, 27, 3]
        ],
        [
          [10, 30, 5],
          [21, 28, 5]
        ]
      ][v]) {
        ellipse(k, x, y, r, Math.ceil(r * 0.55), '#3f8a4a');
        ellipse(k, x - 1, y - 1, r - 1, Math.max(1, Math.ceil(r * 0.4)), '#5aa75c');
        k.g.clearRect(x, y - Math.ceil(r * 0.55), 1, Math.ceil(r * 0.55) + 1);
        k.px(x - 2, y - 1, '#8ad07a');
      }
      if (v !== 1) {
        const [x, y] = v === 0 ? [11, 26] : [21, 26];
        k.rect(x - 2, y - 1, 5, 2, '#f4c6dc');
        k.rect(x - 1, y - 3, 3, 2, '#f8e0ec');
        k.px(x, y - 1, '#f8d96a');
      }
    },
    leafpile: (k, v) => {
      const L = ['#d9542f', '#e98a2c', '#efc145', '#a8432a', '#c46a32'];
      shadow(k, 16, 34, 12, 2);
      ellipse(k, 16, 31, 11 - v, 3, '#8a3a1e');
      for (let i = 0; i < 40; i++) {
        const a = hash(i, v + 5) * Math.PI * 2,
          d = Math.sqrt(hash(v + 5, i)),
          x = Math.round(16 + Math.cos(a) * (11 - v) * d),
          y = Math.round(31 - Math.abs(Math.sin(a)) * 4 * d - (1 - d) * 3);
        k.rect(x, y, 2, 1, L[i % L.length]);
        if (i % 5 === 0) k.px(x + 1, y - 1, '#fbe27a');
      }
    },
    dune: (k, v) => {
      const S = ['#f4dcaa', '#e0c088', '#c49a5e', '#a07a44'];
      for (let y = -6; y <= 0; y++) {
        const w = Math.round((13 - v) * Math.sqrt(1 - (y * y) / 36));
        for (let x = -w; x <= w; x++) {
          const t = (x + w) / (2 * w + 1);
          k.px(16 + x, 33 + y, y < -4 ? S[0] : t < 0.45 ? S[1] : S[2]);
        }
      }
      for (let i = 0; i < 3; i++) k.rect(8 + i * 5, 30 + (i % 2), 6, 1, S[0]);
      if (v === 1)
        for (const x of [9, 11, 13]) {
          k.rect(x, 24, 1, 4, '#a89a5a');
          k.px(x + 1, 23, '#c8b870');
        }
      if (v === 2) {
        k.rect(20, 25, 3, 2, '#e8e0c8');
        k.px(23, 26, '#c8c0a8');
      }
    },
    magicplant: (k, v) => {
      const cols = [
        ['#3c9a80', '#7ff0dc', '#c99bff'],
        ['#3c8a9a', '#9ff4e4', '#f6d8ff'],
        ['#4a7aa0', '#c99bff', '#7ff0dc']
      ][v];
      shadow(k, 16, 34, 10, 2);
      for (let i = 0; i < 5; i++) {
        const x0 = 8 + i * 4,
          h = 10 + Math.floor(hash(i, v) * 10),
          dir = i < 2 ? -1 : i > 2 ? 1 : 0,
          pts = bez([x0, 33], [x0 + dir * 2, 33 - h * 0.6], [x0 + dir * 5, 33 - h], 10);
        for (const [x, y] of pts) k.px(x, y, cols[0]);
        const [ex, ey] = pts[pts.length - 1];
        disc(k, ex, ey, 2, cols[1 + (i % 2)]);
        k.px(ex - 1, ey - 1, '#ffffff');
        k.px(x0 - 1, 33 - Math.floor(h / 2), cols[0]);
      }
    },
    crystal: (k, v) => {
      const R = [
        ['#e8fffa', '#9ce2e6', '#5e9fb8', '#3a6a88'],
        ['#f6eaff', '#c99bff', '#8a62c8', '#5a3a8a'],
        ['#e8fffa', '#7ff0dc', '#3aa898', '#1e6a6a']
      ][v];
      shadow(k, 16, 34, 10, 2);
      for (const [x, h, lean] of [
        [16, 24, 0],
        [10, 14, -4],
        [22, 16, 4],
        [13, 9, -1],
        [20, 8, 2]
      ]) {
        for (let i = 0; i < h; i++) {
          const w = Math.max(1, Math.round(3 * Math.min(1, (h - i) / 5))),
            xx = x + Math.round((lean * i) / h);
          k.rect(xx - w + 1, 33 - i, w, 1, R[1]);
          k.rect(xx + 1, 33 - i, w, 1, R[2]);
          k.px(xx + w, 33 - i, R[3]);
          if (i > 1 && i < h - 2) k.px(xx, 33 - i, R[0]);
        }
      }
      ellipse(k, 16, 33, 9, 2, '#6a7478');
    },
    cactus: (k, v) => {
      const G = ['#6ab07a', '#438b5e', '#2f6e46', '#1e4c30'];
      shadow(k, 16, 34, 10, 2);
      const col = (x, top, bot, w) => {
        for (let y = top; y <= bot; y++) {
          const r = y < top + 2 ? w - 1 : w;
          k.rect(x - r, y, r * 2, 1, G[1]);
          k.px(x - r, y, G[0]);
          k.px(x + r - 1, y, G[2]);
          if (y % 3 === 0) k.px(x, y, G[2]);
          if (y % 4 === 1) k.px(x - r - 1, y, '#fff4d0');
        }
      };
      if (v === 2) {
        // Cactus-tonneau en touffe.
        for (const [x, r] of [
          [12, 5],
          [20, 4],
          [16, 3]
        ]) {
          ellipse(k, x, 30, r, r + 1, G[1]);
          for (let i = -r + 1; i < r; i += 2) k.rect(x + i, 26, 1, 8, G[2]);
          k.px(x - r + 1, 28, G[0]);
          k.rect(x - 1, 24 - (r > 4 ? 1 : 0), 2, 2, '#f48ab8');
        }
        return;
      }
      col(16, 6, 33, 3);
      k.rect(15, 4, 3, 2, '#f48ab8');
      col(9, 14, 22, 2);
      k.rect(9, 22, 6, 3, G[1]);
      if (v === 0) {
        col(24, 10, 18, 2);
        k.rect(18, 18, 6, 3, G[1]);
      }
    },
    rock: (k, v) => {
      const R = ['#c4ccc4', '#98a29c', '#6e7a78', '#4a5458', '#323a3e'];
      shadow(k, 16, 34, 13, 2);
      const blob = (cx, cy, rx, ry, seed) => {
        for (let y = -ry; y <= ry * 0.4; y++)
          for (let x = -rx; x <= rx; x++) {
            const nx = x / rx,
              ny = y / ry,
              j = (hash((x >> 1) + seed, y >> 1) - 0.5) * 0.25,
              d = nx * nx + ny * ny;
            if (d > 1 + j) continue;
            const facet = (hash((x + rx) >> 2, (y + ry) >> 2) - 0.5) * 0.4,
              lit = -0.5 * nx - 0.7 * ny + 0.4 * Math.sqrt(Math.max(0, 1 - d)) + facet;
            k.px(cx + x, cy + y, lit > 0.75 ? R[0] : lit > 0.4 ? R[1] : lit > 0.05 ? R[2] : R[3]);
          }
      };
      if (v === 0) {
        blob(14, 29, 10, 8, 1);
        blob(24, 31, 5, 4, 2);
      } else if (v === 1) {
        blob(16, 28, 12, 10, 3);
      } else {
        blob(11, 30, 7, 6, 4);
        blob(21, 29, 7, 7, 5);
        blob(16, 32, 4, 3, 6);
      }
      for (let i = 0; i < 6; i++)
        k.px(8 + Math.floor(hash(i, v) * 16), 22 + Math.floor(hash(v, i) * 6), i % 2 ? '#8aa868' : '#c8c070');
    },
    ruin: (k, v) => {
      const S = ['#f0d8a8', '#d4b484', '#b8935e', '#8a6a40', '#5e4428'];
      shadow(k, 16, 34, 13, 2);
      const block = (x, y, w, h) => {
        k.rect(x, y, w, h, S[2]);
        k.rect(x, y, w, 1, S[0]);
        k.rect(x, y, 1, h, S[1]);
        k.rect(x + w - 1, y, 1, h, S[3]);
        k.rect(x, y + h - 1, w, 1, S[3]);
      };
      if (v === 2) {
        // Pan de mur.
        for (let row = 0; row < 4; row++)
          for (let c = 0; c < 3 - (row > 2 ? 1 : 0); c++)
            block(5 + c * 8 + (row % 2) * 3, 28 - row * 5, 8, 5);
        block(22, 30, 6, 4);
        return;
      }
      // Colonne brisée, chapiteau tombé.
      const h = v === 0 ? 24 : 16;
      for (let i = 0; i < 8; i++)
        k.rect(11 + i, 33 - h, 1, h, i < 2 ? S[0] : i < 5 ? S[1] : i < 7 ? S[2] : S[3]);
      for (let i = 13; i < 18; i += 2) k.rect(i, 35 - h, 1, h - 4, S[2]);
      for (let x = 11; x < 19; x++) k.rect(x, 33 - h - Math.floor(hash(x, v) * 3), 1, 3, S[1]);
      block(9, 30, 12, 3);
      block(21, 29, 8, 5);
      if (v === 1) block(3, 30, 6, 4);
      for (let i = 0; i < 4; i++) k.px(12 + i * 2, 33 - h + 6 + i * 3, '#8aa060');
    },
    lava: (k, v) => {
      ellipse(k, 16, 29, 12, 5, '#5a2a1e');
      ellipse(k, 16, 29, 10, 4, '#a33d2c');
      ellipse(k, 15, 28, 7, 2, '#e88737');
      k.rect(12, 28, 4, 1, '#f6c36b');
    }
  };
  SMALL.peak = (k, v) => {
    const R = ['#c4ccc4', '#98a29c', '#6e7a78', '#4a5458'];
    shadow(k, 16, 34, 12, 2);
    for (let y = 0; y < 28; y++) {
      const w = Math.round(2 + (y / 28) * 10 + (hash(y >> 2, v) - 0.5) * 2);
      for (let x = -w; x <= w; x++) {
        const t = (x + w) / (2 * w + 1);
        k.px(16 + x, 6 + y, t < 0.3 ? R[0] : t < 0.6 ? R[1] : t < 0.85 ? R[2] : R[3]);
      }
    }
  };

  // ---------------------------------------------------------------- Cuisson
  // Peint au pinceau sur la grille d'art (w × h), modelé, cerné, puis agrandi × 2 sans flou.
  function bake(w, h, fn, seed) {
    const k = brush(w, h);
    fn(k);
    polish(k.cv, 1, seed);
    outline(k);
    // Marge de 2 pixels de chaque côté, comme les anciens décors cernés : pieds et tailles inchangés.
    const cv = makeCanvas(w * 2 + 4, h * 2 + 4),
      g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(k.cv, 2, 2, w * 2, h * 2);
    cv.canaanPolished = true;
    return cv;
  }
  const VARIANTS = {};
  const tree = (name, fn) =>
    (VARIANTS[name] = [0, 1, 2].map(v => bake(64, 76, k => fn(k, v), name.length * 7 + v)));
  tree('tree', TREES.tree);
  tree('bigtree', TREES.bigtree);
  tree('pine', TREES.pine);
  tree('snowpine', (k, v) => TREES.pine(k, v, true));
  tree('glowtree', TREES.glowtree);
  tree('twisted', TREES.twisted);
  tree('palm', TREES.palm);
  tree('deadwood', TREES.deadwood);
  tree('goldtree', TREES.golden);
  for (const [name, [pal, seed]] of Object.entries(AUTUMN))
    tree(name, (k, v) => TREES.autumn(k, v, pal, seed));
  for (const [name, fn] of Object.entries(SMALL)) {
    VARIANTS[name] = [0, 1, 2].map(v => bake(32, 38, k => fn(k, v, 0), name.length * 5 + v));
    // Versions par région (indice des ZONES) pour les décors qui changent de couleur.
    const zones = { bush: [2, 3, 5, 6], flower: [5, 6], mushroom: [1, 2, 5] }[name] || [];
    for (const z of zones)
      VARIANTS[name + '@' + z] = [0, 1, 2].map(v => bake(32, 38, k => fn(k, v, z), z * 13 + v));
  }
  for (const [name, list] of Object.entries(VARIANTS)) if (!name.includes('@')) PIXEL_DECOR[name] = list[0];
  window.PIXEL_DECOR_VARIANTS = VARIANTS;
})();
