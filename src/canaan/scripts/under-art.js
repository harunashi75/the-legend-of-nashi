// Décors des Tréfonds en pixel art, dans la facture des décors de l'île et des portails (portal-art.js) : grille de
// gros pixels (1 pixel d'art = 2 pixels d'écran), aplats de 3 à 5 tons pris dans la palette du biome, modelé (lumière
// en haut à gauche), grain et contour sombre ; chaque décor est peint une fois par biome et par variante, puis
// gardé. Flammes et lueurs restent vivantes (dessinées à chaque image).
// Stalagmites, poutres de mine, lanternes, racines, arbres morts, tombes, croix, tertres, grilles, bougies,
// champignons géants, roseaux, pans de murs et colonnes brisées ; objets (cristaux, os, éboulis, caisses, wagonnets,
// minerai, pioche, statue, chandelles, colonne, tas de crânes, brasero) ; objets accrochés aux parois (torche,
// applique, lanterne, bannière, chaînes, crânes, racines, étai).
(() => {
  'use strict';
  const U = 2;
  const { brush, outline, polish, mix, hashGrid: hash, bez, branch } = CANAAN_PIXEL_KIT;
  const WOOD = ['#d8a066', '#b47c46', '#8e5a30', '#663c1e', '#42260f'],
    IRON = ['#9aa0aa', '#767c88', '#565c68', '#3c4048', '#24272c'],
    BONE = ['#fffaf0', '#ece4cc', '#cbc2a6', '#958b72'],
    BARK = ['#9a9084', '#76695c', '#554a40', '#3a322a'];
  // Rampe [reflet, clair, base, ombre, profond] tirée de trois couleurs.
  const ramp = (light, base, dark) => [
    mix(light, '#ffffff', 0.25),
    light,
    base,
    dark,
    mix(dark, '#000000', 0.45)
  ];

  // ---------------------------------------------------------------- Formes
  // Cône de pierre (stalagmite) : flanc gauche éclairé, anneaux de calcaire, base élargie.
  function cone(k, cx, yb, hw, h, R) {
    for (let i = 0; i < h; i++) {
      const t = i / h,
        w = Math.max(0.6, hw * Math.pow(1 - t, 1.15)),
        y = yb - i,
        ring = i % 6 === 5;
      for (let x = Math.floor(-w); x <= Math.ceil(w); x++) {
        if (Math.abs(x) > w + 0.3) continue;
        const u = (x + w) / (2 * w + 0.01);
        k.px(cx + x, y, ring ? R[3] : u < 0.28 ? R[1] : u < 0.7 ? R[2] : R[3]);
      }
      if (w > 1.5 && hash(i, cx) > 0.8) k.px(cx - Math.floor(w * 0.5), y, R[0]);
    }
    k.rect(cx - hw - 1, yb, hw * 2 + 3, 1, R[3]);
  }
  function disc(k, cx, cy, rx, ry, col) {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(cx - w, cy + y, w * 2 + 1, 1, col);
    }
  }
  // Rocher arrondi éclairé en haut à gauche.
  function stone(k, cx, cy, rx, ry, R) {
    for (let y = -ry; y <= ry * 0.5; y++)
      for (let x = -rx; x <= rx; x++) {
        const nx = x / rx,
          ny = y / ry,
          d = nx * nx + ny * ny;
        if (d > 1) continue;
        const lit = -0.5 * nx - 0.7 * ny + 0.5 * Math.sqrt(1 - d);
        k.px(cx + x, cy + y, lit > 0.7 ? R[0] : lit > 0.4 ? R[1] : lit > 0.1 ? R[2] : R[3]);
      }
  }
  function skull(k, x, y) {
    k.rect(x - 2, y - 3, 5, 4, BONE[1]);
    k.rect(x - 2, y - 3, 5, 1, BONE[0]);
    k.rect(x - 1, y + 1, 3, 1, BONE[2]);
    k.px(x - 1, y - 1, '#1a1410');
    k.px(x + 1, y - 1, '#1a1410');
  }
  function bone(k, x, y, len, vertical) {
    if (vertical) {
      k.rect(x, y, 1, len, BONE[1]);
      k.rect(x - 1, y, 3, 1, BONE[0]);
      k.rect(x - 1, y + len - 1, 3, 1, BONE[2]);
    } else {
      k.rect(x, y, len, 1, BONE[1]);
      k.rect(x, y - 1, 1, 3, BONE[0]);
      k.rect(x + len - 1, y - 1, 1, 3, BONE[2]);
    }
  }
  function candle(k, x, yb, h) {
    k.rect(x, yb - h, 2, h, BONE[1]);
    k.px(x, yb - h, BONE[0]);
    k.px(x + 1, yb - h + 2, BONE[2]);
  }

  // ---------------------------------------------------------------- Modèles (taille en pixels d'art, pied en bas)
  // Chaque modèle : [largeur, hauteur, dessin(k, th, v, fx)] ; fx.flame(x, y, s), fx.light(x, y, r, col).
  const ART = {
    stalag: [
      34,
      52,
      (k, t, v) => {
        cone(k, 17, 49, 7, 34 + v * 5, t.S);
        cone(k, 9, 49, 4, 16 + v * 3, t.S);
        cone(k, 26, 49, 4, 12 + v * 2, t.S);
      }
    ],
    stalag2: [
      22,
      26,
      (k, t, v) => {
        cone(k, 8, 23, 4, 14 + v * 2, t.S);
        cone(k, 15, 23, 3, 9 + v, t.S);
      }
    ],
    beam: [
      30,
      40,
      (k, t, v) => {
        for (const x of [4, 23]) {
          k.rect(x, 6, 4, 34, WOOD[2]);
          k.rect(x, 6, 1, 34, WOOD[1]);
          k.rect(x + 3, 6, 1, 34, WOOD[3]);
          for (let y = 10; y < 38; y += 7) k.px(x + 2, y, WOOD[4]);
        }
        k.rect(1, 2, 28, 5, WOOD[2]);
        k.rect(1, 2, 28, 1, WOOD[0]);
        k.rect(1, 6, 28, 1, WOOD[4]);
        for (const x of [5, 24]) k.rect(x, 3, 2, 2, IRON[1]);
        k.line(8, 7, 4, 12, WOOD[3], 1);
        k.line(22, 7, 26, 12, WOOD[3], 1);
        if (v === 2) for (let i = 0; i < 6; i++) k.px(9 + i * 2, 8 + (i % 2), '#d8d4cc');
      }
    ],
    lanternpost: [
      22,
      42,
      (k, t, v, fx) => {
        k.rect(5, 4, 3, 38, WOOD[3]);
        k.rect(5, 4, 1, 38, WOOD[2]);
        k.rect(5, 4, 12, 2, WOOD[3]);
        k.rect(14, 6, 1, 3, IRON[3]);
        k.rect(11, 9, 7, 9, IRON[2]);
        k.rect(12, 10, 5, 7, '#ffd36d');
        k.rect(13, 11, 3, 4, '#fff6c5');
        k.rect(11, 9, 7, 1, IRON[1]);
        k.rect(3, 39, 7, 3, WOOD[3]);
        fx.light(14, 13, 170, '#ffc860');
        fx.glow(14, 13, '#ffd36d');
      }
    ],
    roots: [
      30,
      30,
      (k, t, v) => {
        const R = ['#8a6040', '#6a4a30', '#4a3020', '#2e1e14'];
        for (let i = 0; i < 4; i++) {
          const x0 = 5 + i * 6 + (v === 1 ? 1 : 0),
            pts = bez(
              [x0, 28],
              [x0 + (hash(i, v) - 0.5) * 12, 18],
              [x0 - 4 + hash(v, i) * 10, 6 + hash(i, i + v) * 6],
              10
            );
          branch(k, pts, 3 - (i % 2), R);
        }
        k.rect(2, 27, 26, 2, R[2]);
      }
    ],
    deadtree: [
      44,
      62,
      (k, t, v) => {
        branch(k, bez([22, 60], [20 + v, 40], [23, 20], 14), 6, BARK);
        const arms = [
          [
            [22, 30],
            [12, 22],
            [6, 10]
          ],
          [
            [23, 26],
            [32, 18],
            [38, 6]
          ],
          [
            [22, 38],
            [30, 34],
            [36, 28]
          ],
          [
            [21, 22],
            [18, 12],
            [20, 4]
          ],
          [
            [22, 44],
            [14, 40],
            [8, 36]
          ]
        ];
        arms.forEach((a, i) => branch(k, bez(a[0], a[1], a[2], 10), i < 2 ? 3 : 2, BARK));
        for (const [x, y] of [
          [6, 10],
          [38, 6],
          [20, 4]
        ]) {
          k.px(x - 1, y - 1, BARK[2]);
          k.px(x + 1, y - 2, BARK[2]);
        }
        k.rect(14, 59, 16, 2, BARK[3]);
        k.rect(12, 60, 5, 1, BARK[2]);
        k.rect(28, 60, 5, 1, BARK[2]);
      }
    ],
    tomb: [
      20,
      26,
      (k, t, v) => {
        const R = v === 1 ? ramp('#a8aaa2', '#8a8c84', '#5a5c56') : ramp('#9a9890', '#7a7a72', '#4e4e48');
        k.rect(3, 9, 14, 15, R[2]);
        disc(k, 10, 9, 7, 6, R[2]);
        k.rect(3, 9, 2, 15, R[1]);
        k.rect(4, 4, 3, 2, R[0]);
        k.rect(6, 9, 8, 1, R[3]);
        k.rect(7, 12, 6, 1, R[3]);
        k.rect(8, 15, 4, 1, R[3]);
        if (v !== 1) k.line(13, 4, 11, 12, R[4], 1);
        k.rect(2, 21, 16, 3, '#4a6a3a');
        k.rect(4, 20, 3, 1, '#6a8a4a');
        k.rect(1, 23, 18, 2, '#2a2c26');
      }
    ],
    cross: [
      20,
      32,
      (k, t, v) => {
        const R = ramp('#9a968c', '#7a766c', '#4e4a44');
        k.rect(8, 3, 4, 26, R[2]);
        k.rect(3, 9, 14, 4, R[2]);
        k.rect(8, 3, 1, 26, R[1]);
        k.rect(3, 9, 14, 1, R[1]);
        k.rect(11, 13, 1, 16, R[3]);
        k.px(9, 6, R[0]);
        disc(k, 10, 29, 7, 2, '#3a3428');
      }
    ],
    grave: [
      24,
      20,
      (k, t, v) => {
        disc(k, 12, 15, 10, 4, '#4a3c2c');
        disc(k, 11, 14, 8, 3, '#5e4c36');
        for (let i = 0; i < 5; i++) k.px(5 + i * 3, 13 + (i % 2), '#7a6448');
        k.rect(10, 3, 3, 11, WOOD[3]);
        k.rect(7, 6, 9, 2, WOOD[3]);
        k.rect(10, 3, 1, 11, WOOD[2]);
      }
    ],
    fence: [
      26,
      28,
      (k, t, v) => {
        k.rect(0, 9, 26, 2, IRON[3]);
        k.rect(0, 19, 26, 2, IRON[3]);
        k.rect(0, 9, 26, 1, IRON[2]);
        for (let x = 1; x < 26; x += 5) {
          k.rect(x, 5, 2, 22, IRON[2]);
          k.px(x, 5, IRON[1]);
          k.rect(x, 3, 2, 2, IRON[1]);
          k.px(x, 2, IRON[0]);
        }
      }
    ],
    candles2: [
      20,
      18,
      (k, t, v, fx) => {
        stone(k, 10, 15, 8, 3, t.S);
        for (const [x, h] of [
          [4, 7],
          [9, 10],
          [14, 6]
        ]) {
          candle(k, x, 14, h);
          fx.flame(x + 1, 14 - h, 0.45);
        }
        fx.light(10, 6, 90, t.flame[1]);
      }
    ],
    giantshroom: [
      40,
      56,
      (k, t, v, fx) => {
        const caps = [
            ramp('#ff9ad0', '#c8508a', '#7a2a58'),
            ramp('#a8fff0', '#3aa898', '#1e5e58'),
            ramp('#e0b8ff', '#8a50c8', '#4a2a78')
          ][v],
          stemR = ['#fffaf0', '#f0e4c8', '#d4c4a0', '#9a8a6a'],
          h = 38 + v * 4;
        for (let y = 54 - h + 8; y < 54; y++) {
          const w = 3 + (y > 48 ? 1 : 0);
          k.rect(20 - w, y, w * 2, 1, stemR[2]);
          k.rect(20 - w, y, 2, 1, stemR[1]);
          k.px(20 + w - 1, y, stemR[3]);
        }
        k.rect(16, 54 - h + 18, 8, 2, stemR[1]);
        const cy = 54 - h + 8;
        for (let y = -11; y <= 2; y++)
          for (let x = -18; x <= 18; x++) {
            const nx = x / 18,
              ny = y / 11;
            if (nx * nx + ny * ny > 1 || y > 2) continue;
            const lit = -0.45 * nx - 0.75 * ny;
            k.px(20 + x, cy + y, lit > 0.55 ? caps[1] : lit > 0.05 ? caps[2] : caps[3]);
          }
        for (let x = -16; x <= 16; x += 2) k.px(20 + x, cy + 3, caps[4]);
        for (const [sx, sy, r] of [
          [-9, -5, 2],
          [3, -8, 2],
          [10, -3, 1],
          [-2, -2, 1],
          [-13, -1, 1]
        ]) {
          disc(k, 20 + sx, cy + sy, r, r, caps[0]);
        }
        fx.light(20, cy, 140, caps[1]);
        fx.glow(20, cy - 2, caps[1]);
      }
    ],
    shrooms: [
      22,
      16,
      (k, t, v, fx) => {
        const cols = [
          ['#ff9ad0', '#c8508a'],
          ['#a8fff0', '#3aa898'],
          ['#ffe08a', '#c89a30']
        ];
        for (const [x, h, c] of [
          [5, 6, 0],
          [11, 9, 1],
          [16, 5, 2]
        ]) {
          k.rect(x, 15 - h, 2, h, BONE[1]);
          k.rect(x - 2, 15 - h - 2, 6, 2, cols[(c + v) % 3][1]);
          k.rect(x - 1, 15 - h - 3, 4, 1, cols[(c + v) % 3][0]);
        }
        if (v === 1) fx.light(11, 6, 60, '#a8fff0');
      }
    ],
    mudreeds: [
      26,
      32,
      (k, t, v) => {
        for (let i = 0; i < 6; i++) {
          const x = 3 + i * 4,
            h = 16 + Math.floor(hash(i, v) * 10);
          k.rect(x, 31 - h, 1, h, i % 2 ? '#6a7a3a' : '#7e8e48');
          if (i % 2 === 0) {
            k.rect(x - 1, 31 - h - 4, 3, 5, '#7a4a28');
            k.px(x - 1, 31 - h - 4, '#9a6a3a');
          }
        }
        k.line(2, 26, 7, 22, '#8a9a50', 1);
        k.line(22, 27, 18, 21, '#8a9a50', 1);
      }
    ],
    ruinwall: [
      32,
      34,
      (k, t, v) => {
        const R = t.S;
        for (let row = 0; row < 5; row++) {
          const y = 30 - (row + 1) * 5,
            off = row % 2 ? 4 : 0,
            maxX = 32 - Math.floor(hash(row, v) * 10) * (row > 2 ? 1 : 0);
          for (let x = -off; x < maxX; x += 8) {
            if (row === 4 && hash(x, v + 3) > 0.5) continue;
            const x0 = Math.max(0, x),
              x1 = Math.min(maxX, x + 7),
              c = hash(x + row * 7, v) > 0.6 ? R[1] : R[2];
            k.rect(x0, y, x1 - x0, 4, c);
            k.rect(x0, y, x1 - x0, 1, R[0]);
            k.rect(x0, y + 4, x1 - x0, 1, R[3]);
          }
        }
        for (const [x, y] of [
          [3, 31],
          [26, 31],
          [12, 32]
        ])
          stone(k, x, y, 3, 2, R);
      }
    ],
    brokenpillar: [
      34,
      42,
      (k, t, v) => {
        const R = t.P,
          h = 22 + v * 6;
        k.rect(5, 37, 20, 4, R[3]);
        k.rect(5, 37, 20, 1, R[1]);
        for (let i = 0; i < 14; i++) {
          const u = i / 13,
            c = u < 0.2 ? R[0] : u < 0.5 ? R[1] : u < 0.8 ? R[2] : R[3];
          k.rect(8 + i, 37 - h, 1, h, c);
        }
        for (let i = 10; i < 21; i += 3) k.rect(i, 39 - h, 1, h - 4, R[2]);
        for (let x = 8; x < 22; x++) k.rect(x, 37 - h - Math.floor(hash(x, v) * 4), 1, 4, R[1]);
        k.rect(24, 34, 9, 6, R[2]);
        k.rect(24, 34, 9, 1, R[0]);
        k.rect(24, 39, 9, 1, R[3]);
      }
    ],
    // ------------------------------------------------ Objets
    crystal: [
      24,
      30,
      (k, t, v, fx) => {
        const c = t.rune,
          R = [mix(c, '#ffffff', 0.7), mix(c, '#ffffff', 0.3), c, mix(c, '#000000', 0.4)];
        for (const [x, h, lean] of [
          [11, 22, 0],
          [6, 13, -3],
          [16, 15, 3],
          [9, 8, -1]
        ])
          for (let i = 0; i < h; i++) {
            const w = Math.max(1, Math.round(3 * Math.min(1, (h - i) / 5))),
              xx = x + Math.round((lean * i) / h);
            k.rect(xx - w + 1, 28 - i, w, 1, R[1]);
            k.rect(xx + 1, 28 - i, w, 1, R[2]);
            if (i > 1 && i < h - 2) k.px(xx, 28 - i, R[0]);
            k.px(xx + w, 28 - i, R[3]);
          }
        stone(k, 12, 28, 10, 3, t.S);
        fx.light(12, 14, 110, c);
        fx.glow(12, 16, c);
      }
    ],
    bones: [
      26,
      12,
      (k, t, v) => {
        bone(k, 3, 8, 9);
        bone(k, 14, 6, 8);
        bone(k, 10, 3, 6, true);
        skull(k, 20, 9);
      }
    ],
    rubble: [
      28,
      16,
      (k, t, v) => {
        stone(k, 9, 13, 7, 5, t.S);
        stone(k, 19, 14, 6, 4, t.S);
        stone(k, 14, 9, 4, 3, t.S);
        stone(k, 24, 14, 3, 2, t.S);
        stone(k, 3, 14, 2, 2, t.S);
      }
    ],
    crate: [
      22,
      22,
      (k, t, v) => {
        k.rect(2, 4, 18, 17, WOOD[2]);
        k.rect(2, 4, 18, 2, WOOD[1]);
        k.rect(2, 4, 2, 17, WOOD[1]);
        k.rect(18, 4, 2, 17, WOOD[3]);
        k.rect(2, 19, 18, 2, WOOD[3]);
        for (let y = 9; y < 19; y += 5) k.rect(4, y, 14, 1, WOOD[3]);
        k.line(4, 18, 17, 6, WOOD[1], 1);
        for (const [x, y] of [
          [3, 5],
          [18, 5],
          [3, 19],
          [18, 19]
        ])
          k.px(x, y, IRON[1]);
      }
    ],
    minecart: [
      30,
      22,
      (k, t, v) => {
        k.rect(0, 20, 30, 1, IRON[1]);
        k.poly(
          [
            [3, 6],
            [27, 6],
            [24, 17],
            [6, 17]
          ],
          IRON[2]
        );
        k.rect(3, 6, 24, 2, IRON[1]);
        k.rect(5, 15, 20, 2, IRON[3]);
        for (const x of [9, 21]) {
          disc(k, x, 18, 2, 2, IRON[4]);
          k.px(x, 18, IRON[1]);
        }
        const ore = v === 1 ? ['#9fe8ff', '#4aa8d0'] : ['#ffd36d', '#c88a2a'];
        for (const [x, y] of [
          [8, 4],
          [12, 3],
          [16, 4],
          [20, 3],
          [11, 5],
          [18, 5]
        ]) {
          k.rect(x, y, 3, 2, '#6a6058');
          k.px(x + 1, y, ore[hash(x, y) > 0.5 ? 0 : 1]);
        }
      }
    ],
    ore: [
      24,
      18,
      (k, t, v, fx) => {
        stone(k, 12, 15, 10, 8, t.S);
        const ore = [
          ['#ffd36d', '#c88a2a'],
          ['#9fe8ff', '#3a8ac8'],
          ['#ff9a6a', '#a8402a']
        ][v];
        for (const [x, y] of [
          [7, 10],
          [12, 8],
          [16, 12],
          [10, 13],
          [15, 9]
        ]) {
          k.rect(x, y, 2, 2, ore[1]);
          k.px(x, y, ore[0]);
        }
        fx.glint(12, 10, ore[0]);
      }
    ],
    pickaxe: [
      24,
      24,
      (k, t, v) => {
        stone(k, 12, 21, 9, 6, t.S);
        k.line(10, 18, 17, 4, WOOD[2], 2);
        k.line(10, 18, 17, 4, WOOD[1], 1);
        k.poly(
          [
            [12, 3],
            [22, 7],
            [20, 8],
            [16, 6],
            [13, 5]
          ],
          IRON[2]
        );
        k.line(12, 3, 22, 7, IRON[0]);
      }
    ],
    statue: [
      26,
      48,
      (k, t, v) => {
        const R = t.P;
        k.rect(3, 38, 20, 9, R[2]);
        k.rect(3, 38, 20, 1, R[0]);
        k.rect(3, 46, 20, 1, R[3]);
        k.rect(5, 40, 16, 1, t.rune);
        k.poly(
          [
            [6, 38],
            [8, 16],
            [18, 16],
            [20, 38]
          ],
          R[1]
        );
        k.rect(8, 16, 3, 22, R[0]);
        k.poly(
          [
            [9, 16],
            [17, 16],
            [15, 30],
            [13, 33],
            [11, 30]
          ],
          R[0]
        );
        for (let y = 18; y < 30; y += 3) k.rect(12, y, 2, 1, R[2]);
        // Tête brisée : cou et cassure.
        k.rect(10, 12, 6, 4, R[2]);
        for (let x = 10; x < 16; x++) k.px(x, 12 - (x % 2), R[1]);
        k.rect(18, 20, 4, 14, R[2]);
        k.rect(20, 14, 1, 6, WOOD[3]);
        stone(k, 22, 45, 3, 2, R);
      }
    ],
    candles: [
      24,
      20,
      (k, t, v, fx) => {
        stone(k, 12, 17, 10, 3, t.S);
        for (const [x, h] of [
          [4, 6],
          [8, 10],
          [13, 13],
          [18, 7]
        ]) {
          candle(k, x, 16, h);
          fx.flame(x + 1, 16 - h, 0.4);
        }
        fx.light(12, 6, 100, t.flame[1]);
      }
    ],
    pillar: [
      22,
      54,
      (k, t, v) => {
        const R = t.P;
        k.rect(2, 4, 18, 4, R[1]);
        k.rect(2, 4, 18, 1, R[0]);
        k.rect(4, 8, 14, 2, R[2]);
        for (let i = 0; i < 12; i++) {
          const u = i / 11,
            c = u < 0.2 ? R[0] : u < 0.5 ? R[1] : u < 0.8 ? R[2] : R[3];
          k.rect(5 + i, 10, 1, 36, c);
        }
        for (let i = 7; i < 16; i += 3) k.rect(i, 12, 1, 32, R[2]);
        k.rect(4, 46, 14, 2, R[2]);
        k.rect(2, 48, 18, 5, R[1]);
        k.rect(2, 48, 18, 1, R[0]);
        k.rect(5, 26, 12, 1, t.rune);
      }
    ],
    bonepile: [
      28,
      20,
      (k, t, v) => {
        disc(k, 14, 16, 12, 3, BONE[3]);
        bone(k, 4, 15, 10);
        bone(k, 15, 16, 9);
        for (const [x, y] of [
          [8, 14],
          [14, 13],
          [20, 14],
          [11, 10],
          [17, 9],
          [14, 6]
        ])
          skull(k, x, y);
      }
    ],
    brazier: [
      22,
      30,
      (k, t, v, fx) => {
        k.rect(10, 12, 3, 16, IRON[2]);
        k.rect(10, 12, 1, 16, IRON[1]);
        k.line(6, 28, 11, 20, IRON[3], 1);
        k.line(16, 28, 11, 20, IRON[3], 1);
        k.rect(3, 6, 17, 6, IRON[2]);
        k.rect(3, 6, 17, 1, IRON[0]);
        k.rect(5, 11, 13, 1, IRON[3]);
        k.rect(5, 5, 13, 2, '#e5822e');
        fx.flame(11, 6, 1.4);
        fx.light(11, 0, 170, t.flame[1]);
      }
    ],
    // ------------------------------------------------ Parois (centrés sur la face de la roche)
    'w:torch': [
      14,
      22,
      (k, t, v, fx) => {
        k.rect(4, 14, 6, 3, IRON[2]);
        k.rect(6, 6, 2, 10, WOOD[2]);
        k.rect(5, 5, 4, 3, '#4a3020');
        fx.flame(7, 5, 0.9);
        fx.light(7, 2, 150, t.flame[1]);
      }
    ],
    'w:sconce': [
      16,
      20,
      (k, t, v, fx) => {
        const R = t.P;
        k.poly(
          [
            [2, 8],
            [14, 8],
            [11, 15],
            [5, 15]
          ],
          R[1]
        );
        k.rect(2, 8, 12, 1, R[0]);
        k.rect(7, 15, 2, 4, R[2]);
        fx.flame(8, 8, 0.8);
        fx.light(8, 4, 140, t.flame[1]);
      }
    ],
    'w:lantern': [
      14,
      24,
      (k, t, v, fx) => {
        k.rect(6, 0, 1, 7, IRON[3]);
        k.rect(3, 7, 8, 10, IRON[2]);
        k.rect(4, 8, 6, 8, '#ffd36d');
        k.rect(5, 9, 4, 4, '#fff6c5');
        k.rect(3, 7, 8, 1, IRON[1]);
        k.rect(4, 17, 6, 2, IRON[3]);
        fx.light(7, 12, 150, '#ffc860');
        fx.glow(7, 12, '#ffd36d');
      }
    ],
    'w:banner': [
      16,
      30,
      (k, t, v) => {
        const [a, b] = t.banner;
        k.rect(1, 1, 14, 2, WOOD[3]);
        k.rect(2, 3, 12, 20, a);
        k.rect(2, 3, 1, 20, mix(a, '#ffffff', 0.2));
        k.rect(13, 3, 1, 20, mix(a, '#000000', 0.3));
        for (let i = 0; i < 12; i++) k.rect(2 + i, 23, 1, Math.max(0, 4 - Math.abs(i - 5.5)), a);
        k.rect(7, 7, 2, 12, b);
        k.rect(5, 9, 6, 2, b);
        k.rect(6, 15, 4, 1, b);
      }
    ],
    'w:chains': [
      16,
      28,
      (k, t, v) => {
        for (const [x, len] of [
          [4, 22],
          [11, 16]
        ]) {
          for (let y = 0; y < len; y += 3) {
            k.rect(x, y, 2, 2, IRON[1]);
            k.px(x, y + 2, IRON[3]);
          }
          k.rect(x - 1, len, 4, 3, IRON[2]);
        }
      }
    ],
    'w:skulls': [
      22,
      14,
      (k, t, v) => {
        k.rect(1, 4, 20, 9, '#1a1612');
        for (const x of [5, 11, 17]) skull(k, x, 9);
      }
    ],
    'w:roots': [
      24,
      26,
      (k, t, v) => {
        const R = ['#8a6040', '#6a4a30', '#4a3020', '#2e1e14'];
        for (let i = 0; i < 4; i++) {
          const x = 4 + i * 5;
          branch(
            k,
            bez(
              [x, 0],
              [x + (hash(i, v) - 0.5) * 8, 10],
              [x + (hash(v, i) - 0.5) * 6, 14 + hash(i, i) * 10],
              8
            ),
            2,
            R
          );
        }
      }
    ],
    'w:beam': [
      28,
      28,
      (k, t, v) => {
        for (const x of [3, 21]) {
          k.rect(x, 4, 4, 24, WOOD[2]);
          k.rect(x, 4, 1, 24, WOOD[1]);
        }
        k.rect(1, 1, 26, 4, WOOD[2]);
        k.rect(1, 1, 26, 1, WOOD[0]);
      }
    ]
  };
  const ALIAS = { skullpile: 'bonepile', 'k:skullpile': 'bonepile' };
  // Couleurs d'un biome pour les décors : pierre de ses parois, colonnes, flammes, runes, bannières.
  function tones(th) {
    const w = th.wall,
      p = th.th.pillar;
    return {
      S: ramp(w.light, w.face, w.dark),
      P: ramp(p[2], p[0], p[1]),
      flame: th.th.flame || ['#e5822e', '#f9c640', '#fff6c5'],
      rune: th.th.rune || '#ffd36d',
      banner: th.th.banner || ['#4a3420', '#e0a060']
    };
  }
  const CACHE = new Map();
  function sprite(kind, b, v, th) {
    const key = kind + ':' + b + ':' + v;
    if (CACHE.has(key)) return CACHE.get(key);
    let out = null;
    const def = ART[kind];
    if (def && typeof document !== 'undefined') {
      const [w, h, fn] = def,
        k = brush(w + 2, h + 2);
      if (k.g?.getImageData) {
        const fx = [];
        const e = {
          flame: (x, y, s) => fx.push(['flame', x + 1, y + 1, s]),
          light: (x, y, r, col) => fx.push(['light', x + 1, y + 1, r, col]),
          glow: (x, y, col) => fx.push(['glow', x + 1, y + 1, col]),
          glint: (x, y, col) => fx.push(['glint', x + 1, y + 1, col])
        };
        k.g.translate(1, 1);
        fn(k, tones(th), v, e);
        k.g.setTransform(1, 0, 0, 1, 0, 0);
        polish(k.cv, 1, b * 7 + v);
        outline(k);
        out = { cv: k.cv, w: w + 2, h: h + 2, fx, wall: kind.startsWith('w:') };
      }
    }
    CACHE.set(key, out);
    return out;
  }
  function flame(c, x, y, s, cols, seed) {
    const q = U * s,
      f = Math.round(Math.sin(time * 0.23 + seed) * 1.2) * U,
      l = Math.round(Math.sin(time * 0.31 + seed * 2)) * U,
      R = (a, b, w, h, col) => {
        c.fillStyle = col;
        c.fillRect(Math.round(a), Math.round(b), Math.max(U, Math.round(w)), Math.max(U, Math.round(h)));
      };
    R(x - 3 * q, y - 3 * q, 6 * q, 3 * q, cols[0]);
    R(x - 2 * q, y - 6 * q + l, 4 * q, 4 * q, cols[0]);
    R(x - 1.5 * q, y - 7 * q + f, 3 * q, 5 * q, cols[1]);
    R(x - 0.5 * q, y - 9 * q + f, q, 3 * q, cols[1]);
    R(x - q, y - 4 * q, 2 * q, 3 * q, cols[2]);
  }
  // Dessine le décor d au pied de la case (x, y) ; faux si ce décor n'a pas de modèle (ancien dessin en secours).
  function draw(c, d, x, y, b, th) {
    let kind = d.startsWith('k:') ? d.slice(2) : d;
    kind = ALIAS[kind] || ALIAS[d] || kind;
    if (!ART[kind]) return false;
    const v = Math.floor(hash(x * 3 + 1, y * 5 + 2) * 3),
      S = sprite(kind, b, v, th);
    if (!S) return false;
    const X = x * TS,
      Y = y * TS,
      // Pied du décor au bas de la case (comme l'ancien dessin) ; objet de paroi centré sur la face de la roche.
      x0 = Math.round(X + 24 - (S.w * U) / 2),
      y0 = S.wall ? Math.round(Y + 26 - (S.h * U) / 2) : Math.round(Y + 42 - S.h * U),
      flip = !S.wall && hash(x, y * 7) > 0.5 && kind !== 'fence';
    c.save();
    c.imageSmoothingEnabled = false;
    if (flip) {
      c.translate(x0 * 2 + S.w * U, 0);
      c.scale(-1, 1);
    }
    c.drawImage(S.cv, x0, y0, S.w * U, S.h * U);
    c.restore();
    const cols = tones(th).flame;
    for (const f of S.fx) {
      const fx = flip ? x0 + (S.w - f[1]) * U : x0 + f[1] * U,
        fy = y0 + f[2] * U;
      if (f[0] === 'flame') flame(c, fx, fy, f[3], cols, x * 3 + y + f[1]);
      else if (f[0] === 'light') canaanLight(fx, fy, f[3], f[4]);
      else if (f[0] === 'glow' || f[0] === 'glint') {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (f[0] === 'glow' ? 0.18 : 0.3) + 0.08 * Math.sin(time * 0.05 + x + y);
        c.fillStyle = f[3];
        const r = f[0] === 'glow' ? 10 : 4;
        c.fillRect(fx - r, fy - r / 2, r * 2, r);
        c.fillRect(fx - r / 2, fy - r, r, r * 2);
        c.restore();
      }
    }
    return true;
  }
  // ---------------------------------------------------------------- Entrée des Tréfonds vue de l'île
  // Gouffre bordé de rochers et de l'herbe de la région, treuil de bois et sa corde, échelle qui plonge dans le noir,
  // lanterne (lueur vivante). zone : indice de la région de l'île.
  const GRASS = [
    ['#b4e27a', '#7cbc52', '#4e8c38'],
    ['#8cc45c', '#5a9a3e', '#3a7430'],
    ['#9cbc78', '#6e9454', '#4a6c3c'],
    ['#d8a040', '#b07a2c', '#7a5420'],
    ['#fbe2b4', '#ecc88e', '#d2a86c'],
    ['#8ae0c8', '#4eb4a0', '#2e8a80']
  ];
  const HOLES = new Map();
  function holeSprite(zone) {
    if (HOLES.has(zone)) return HOLES.get(zone);
    let out = null;
    if (typeof document !== 'undefined') {
      const w = 84,
        h = 64,
        k = brush(w, h),
        G = GRASS[zone] || GRASS[0],
        R = ramp('#a8a49a', '#7e7a72', '#55514c'),
        cx = 42,
        cy = 44;
      if (k.g?.getImageData) {
        // Bouche : anneaux de plus en plus sombres, paroi éclairée au fond (côté opposé à la lumière).
        disc(k, cx, cy, 30, 13, R[3]);
        disc(k, cx, cy, 26, 11, '#3a2e24');
        disc(k, cx, cy + 1, 23, 9, '#22180f');
        disc(k, cx, cy + 2, 19, 7, '#0e0a07');
        disc(k, cx, cy + 3, 14, 5, '#030202');
        for (let x = -22; x <= 22; x += 3) k.px(cx + x, cy - 7 + Math.round(Math.abs(x) / 8), '#4e3e2e');
        // Échelle qui descend dans le noir.
        for (const sx of [-4, 4]) k.rect(cx + sx, cy - 6, 1, 12, '#c8b080');
        for (let i = 0; i < 4; i++) k.rect(cx - 4, cy - 4 + i * 3, 9, 1, i < 2 ? '#a89060' : '#5a4a30');
        // Rochers en couronne, herbe sur le dessus.
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2,
            rx = cx + Math.cos(a) * 29,
            ry = cy + Math.sin(a) * 12,
            r = 3 + Math.floor(hash(i, zone) * 3);
          if (Math.sin(a) < -0.2) stone(k, rx, ry, r + 1, r, R);
        }
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2,
            rx = cx + Math.cos(a) * 29,
            ry = cy + Math.sin(a) * 12,
            r = 3 + Math.floor(hash(i, zone) * 3);
          if (Math.sin(a) >= -0.2) stone(k, rx, ry, r + 1, r, R);
          if (hash(zone, i) > 0.45) {
            k.rect(rx - 2, ry - r - 1, 5, 1, G[1]);
            k.px(rx - 1, ry - r - 2, G[0]);
            k.px(rx + 1, ry - r - 2, G[2]);
          }
        }
        // Treuil : deux montants, traverse, tambour de corde, manivelle ; corde qui plonge.
        for (const sx of [-24, 22]) {
          k.rect(cx + sx, 8, 3, cy - 10, WOOD[2]);
          k.rect(cx + sx, 8, 1, cy - 10, WOOD[1]);
          k.rect(cx + sx + 2, 8, 1, cy - 10, WOOD[3]);
        }
        k.rect(cx - 27, 5, 54, 4, WOOD[2]);
        k.rect(cx - 27, 5, 54, 1, WOOD[0]);
        k.rect(cx - 27, 8, 54, 1, WOOD[4]);
        k.rect(cx - 10, 14, 20, 6, WOOD[3]);
        for (let x = cx - 9; x < cx + 10; x += 2) k.px(x, 15 + (x & 1), '#c8b080');
        k.rect(cx - 10, 14, 20, 1, WOOD[1]);
        k.rect(cx - 22, 16, 12, 1, IRON[2]);
        k.rect(cx + 10, 16, 12, 1, IRON[2]);
        k.rect(cx + 23, 14, 1, 6, IRON[1]);
        k.rect(cx + 23, 19, 4, 1, IRON[1]);
        k.rect(cx + 2, 20, 1, cy - 18, '#c8b080');
        // Lanterne au montant de gauche.
        k.rect(cx - 30, 14, 4, 1, IRON[3]);
        k.rect(cx - 31, 15, 1, 3, IRON[3]);
        k.rect(cx - 34, 18, 7, 8, IRON[2]);
        k.rect(cx - 33, 19, 5, 6, '#ffd36d');
        k.rect(cx - 32, 20, 3, 3, '#fff6c5');
        polish(k.cv, 1, 90 + zone);
        outline(k);
        out = { cv: k.cv, w, h, lamp: [cx - 30, 22] };
      }
    }
    HOLES.set(zone, out);
    return out;
  }
  // Dessine l'entrée posée au point (x, y) de l'île (milieu de la bouche) ; faux sans canevas.
  function hole(c, x, y, zone) {
    const S = holeSprite(zone);
    if (!S) return false;
    const x0 = Math.round(x - 42 * U),
      y0 = Math.round(y - 44 * U);
    c.save();
    c.fillStyle = 'rgba(10,14,8,.28)';
    c.beginPath();
    c.ellipse(x, y + 8, 70, 26, 0, 0, Math.PI * 2);
    c.fill();
    c.imageSmoothingEnabled = false;
    c.drawImage(S.cv, x0, y0, S.w * U, S.h * U);
    c.restore();
    canaanLight(x0 + S.lamp[0] * U, y0 + S.lamp[1] * U, 130, '#ffc860');
    return true;
  }
  window.CANAAN_UNDER_ART = Object.freeze({ draw, hole, has: kind => !!ART[kind] });
})();
