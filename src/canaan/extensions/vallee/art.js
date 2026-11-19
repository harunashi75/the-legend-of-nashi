// Extension 1 — la Vallée des Héros : pixel art de ses lieux et de ses montures, avec le kit commun
// (client/art/pixel-kit.js : même pinceau, même contour d'encre, même modelé et même grille de gros pixels de 2 que les
// bâtiments, les portails et les créatures du jeu). Rien n'est dessiné ici à chaque image : chaque sprite est peint une
// fois, gardé, puis posé par vallee.js, mounts.js et valerion.js.
// - Chevaux : profil (quatre images de galop, une à l'arrêt, une tête baissée qui broute), de face et de dos ; avec ou
//   sans selle ; la monture montée est coupée en deux calques (dessous / devant le cavalier).
// - Statues des héros (huit poses), statue de l'Aurore (marbre et or), statues de l'arène de Valérion.
// - Écurie des Héros, moulin (tour et ailes), clôtures, auge, bottes de foin, pont de pierre, dalles de l'arène.
(() => {
  'use strict';
  const { brush, outline, polish, tint, makeCanvas, hashGrid: hash } = CANAAN_PIXEL_KIT;
  const U = 2;
  const cache = new Map();
  // Peint une fois sur la grille d'art (w × h), modelé et cerné, puis agrandi × 2 sans flou ; null sans canevas.
  function bake(key, w, h, fn, { shine = true, ink = true } = {}) {
    if (cache.has(key)) return cache.get(key);
    let out = null;
    if (typeof document !== 'undefined') {
      const k = brush(w, h);
      if (k.g && k.g.getImageData) {
        fn(k);
        if (shine) polish(k.cv, 1, key.length * 7);
        if (ink) outline(k);
        out = makeCanvas(w * U, h * U);
        const g = out.getContext('2d');
        if (g) {
          g.imageSmoothingEnabled = false;
          g.drawImage(k.cv, 0, 0, w * U, h * U);
        }
      }
    }
    cache.set(key, out);
    return out;
  }
  const ell = (k, cx, cy, rx, ry, col) => {
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1, col);
    }
  };
  const P = s => s.split(',').map(p => p.trim().split(/\s+/).map(Number));

  // ---------------------------------------------------------------- Chevaux
  // Grille d'art du profil : 46 × 38, sabots à la ligne 36, tourné vers la droite ; dos (selle) vers x = 21, y = 12.
  const SIDE_W = 46,
    SIDE_H = 38,
    GROUND = 36;
  // Pattes : [attache x, attache y] et, pour chaque image, [décalage du sabot, hauteur levée, pli du genou].
  const LEGS = {
    // arrière lointaine, arrière proche, avant lointaine, avant proche
    attach: [
      [13, 23],
      [16, 24],
      [29, 23],
      [32, 24]
    ],
    stand: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    gallop: [
      [
        [-5, 1, -1],
        [-3, 0, -1],
        [5, 2, 2],
        [7, 3, 2]
      ],
      [
        [-2, 4, 2],
        [1, 2, 1],
        [2, 0, 0],
        [4, 1, 1]
      ],
      [
        [3, 3, 2],
        [5, 5, 2],
        [-3, 2, -2],
        [-1, 0, -1]
      ],
      [
        [0, 1, 0],
        [-2, 0, -1],
        [0, 4, 3],
        [3, 3, 2]
      ]
    ]
  };
  function leg(k, ax, ay, dx, lift, bend, col, sock, hoof) {
    const hx = ax + dx,
      hy = GROUND - lift,
      kx = Math.round((ax + hx) / 2 + bend),
      ky = Math.round(ay + (hy - ay) * 0.48);
    k.line(ax, ay, kx, ky, col, 2);
    k.line(kx, ky, hx, hy - 2, col, 2);
    k.rect(hx - 1, hy - 4, 3, 3, sock);
    k.rect(hx - 1, hy - 1, 3, 2, hoof);
  }
  // Profil complet. o : { frame (0-3, -1 à l'arrêt), saddle, graze, swish (queue), blanket }.
  function horseSide(k, M, o) {
    const [lt, base, sh, deep] = M.coat,
      [mLt, mDk] = M.mane,
      hoof = '#2a1c14',
      far = tint(base, 0.78),
      pose = o.frame < 0 ? LEGS.stand : LEGS.gallop[o.frame],
      bob = o.frame === 1 || o.frame === 3 ? -1 : 0;
    // Queue : crins qui tombent et ondulent.
    const sw = o.swish || 0;
    k.poly(
      P(`11 ${15 + bob}, 7 ${17 + bob}, ${4 + sw} 26, ${3 + sw} 31, ${6 + sw} 30, 9 23, 12 ${19 + bob}`),
      mDk
    );
    k.line(9, 17 + bob, 5 + sw, 28, mLt);
    // Pattes du côté lointain, plus sombres.
    for (const i of [0, 2])
      leg(k, LEGS.attach[i][0], LEGS.attach[i][1] + bob, ...pose[i], far, tint(M.sock, 0.8), hoof);
    // Corps : croupe, ventre, poitrail.
    ell(k, 13, 17 + bob, 6, 6, base);
    ell(k, 21, 19 + bob, 11, 6, base);
    ell(k, 30, 18 + bob, 5, 6, base);
    k.rect(11, 22 + bob, 22, 2, sh);
    k.rect(14, 13 + bob, 14, 2, lt);
    // Encolure et tête (relevée, ou baissée pour brouter).
    if (o.graze) {
      k.poly(P(`28 ${14 + bob}, 33 13, 38 22, 39 29, 35 30, 33 22, 30 ${22 + bob}`), base);
      k.poly(P('35 27, 40 26, 43 31, 42 34, 38 34, 35 31'), base);
      k.rect(41, 32, 2, 1, deep);
      k.px(39, 28, '#1a1410');
      k.poly(P('34 27, 35 24, 37 26'), sh);
      for (let i = 0; i < 6; i++) k.line(30 + i, 13 + i * 2, 29 + i, 15 + i * 2, i % 2 ? mDk : mLt);
    } else {
      k.poly(
        P(
          `27 ${14 + bob}, 31 ${6 + bob}, 35 ${3 + bob}, 38 ${5 + bob}, 35 ${13 + bob}, 33 ${20 + bob}, 28 ${21 + bob}`
        ),
        base
      );
      k.poly(
        P(
          `34 ${3 + bob}, 37 ${1 + bob}, 41 ${4 + bob}, 44 ${9 + bob}, 43 ${11 + bob}, 39 ${11 + bob}, 35 ${8 + bob}`
        ),
        base
      );
      k.rect(37, 2 + bob, 3, 1, lt);
      k.rect(41, 10 + bob, 3, 1, deep);
      k.px(43, 8 + bob, '#1a1410');
      k.px(38, 5 + bob, '#1a1410');
      k.px(37, 5 + bob, '#ffffff');
      // Oreilles.
      k.poly(P(`34 ${3 + bob}, 35 ${-1 + bob + 1}, 37 ${2 + bob}`), sh);
      // Crinière et toupet.
      for (let i = 0; i < 7; i++) k.line(29 + i, 10 + bob - i, 27 + i, 14 + bob - i, i % 2 ? mDk : mLt);
      k.line(37, 2 + bob, 39, 4 + bob, mLt);
    }
    // Pattes du côté proche.
    for (const i of [1, 3])
      leg(k, LEGS.attach[i][0], LEGS.attach[i][1] + bob, ...pose[i], base, M.sock, hoof);
    // Selle : tapis, selle de cuir à liseré d'or, sangle, étrier ; bride et rênes.
    if (o.saddle) {
      const blanket = M.blanket || '#3a6ab0';
      k.rect(15, 12 + bob, 13, 7, blanket);
      k.rect(15, 18 + bob, 13, 1, '#e8c860');
      k.rect(17, 10 + bob, 9, 4, '#6a3e1e');
      k.rect(17, 10 + bob, 9, 1, '#9a6236');
      k.rect(25, 9 + bob, 2, 2, '#9a6236');
      k.rect(16, 9 + bob, 2, 2, '#6a3e1e');
      k.rect(21, 14 + bob, 1, 8, '#4a2a14');
      if (!o.graze) {
        k.line(43, 9 + bob, 37, 5 + bob, '#4a2a14');
        k.line(37, 6 + bob, 26, 11 + bob, '#5a3418');
      }
    }
  }
  // Calque « devant » du profil monté : le flanc sous la selle, la selle et l'étrier (ils cachent les jambes du
  // cavalier) ; la botte du cavalier dans l'étrier est dessinée par mounts.js.
  function horseSideFront(k, M, o) {
    const [lt, base, sh] = M.coat,
      bob = o.frame === 1 || o.frame === 3 ? -1 : 0,
      blanket = M.blanket || '#3a6ab0';
    ell(k, 21, 19 + bob, 7, 4, base);
    k.rect(14, 22 + bob, 15, 1, sh);
    k.rect(15, 15 + bob, 13, 4, blanket);
    k.rect(15, 18 + bob, 13, 1, '#e8c860');
    k.rect(18, 13 + bob, 7, 4, '#6a3e1e');
    k.rect(18, 13 + bob, 7, 1, '#9a6236');
    k.rect(20, 17 + bob, 3, 5, '#5a3418');
    // Botte du cavalier dans l'étrier doré.
    k.rect(19, 19 + bob, 4, 3, '#2a1c14');
    k.rect(19, 19 + bob, 1, 3, '#4a3424');
    k.rect(18, 22 + bob, 6, 2, '#c8a040');
    k.px(16, 16 + bob, lt);
  }
  // Face (vers le bas de l'écran) : 26 × 38. under : corps et pattes ; over : encolure, tête et poitrail.
  function horseFront(k, M, o, part) {
    const [lt, base, sh, deep] = M.coat,
      [mLt, mDk] = M.mane,
      step = o.frame % 2,
      hoof = '#2a1c14';
    if (part === 'under') {
      // Pattes arrière, dans l'ombre, puis le corps et les pattes avant.
      k.rect(8, 24, 2, 11, tint(base, 0.7));
      k.rect(16, 24, 2, 11, tint(base, 0.7));
      ell(k, 13, 19, 9, 7, base);
      k.rect(5, 22, 16, 2, sh);
      for (const [x, up] of [
        [9, step ? 2 : 0],
        [15, step ? 0 : 2]
      ]) {
        k.rect(x, 24, 3, 11 - up, base);
        k.rect(x, 31 - up, 3, 3, M.sock);
        k.rect(x, 34 - up, 3, 2, hoof);
      }
      if (o.saddle) {
        k.rect(2, 13, 4, 7, M.blanket || '#3a6ab0');
        k.rect(20, 13, 4, 7, M.blanket || '#3a6ab0');
        k.rect(2, 19, 4, 1, '#e8c860');
        k.rect(20, 19, 4, 1, '#e8c860');
        k.rect(4, 12, 18, 3, '#6a3e1e');
      }
      return;
    }
    // Encolure, tête longue, liste blanche, oreilles, toupet, naseaux.
    k.rect(10, 9, 6, 9, base);
    k.rect(9, 15, 8, 5, base);
    k.poly(P('9 1, 17 1, 16 12, 14 15, 12 15, 10 12'), base);
    k.rect(12, 2, 2, 11, lt);
    k.poly(P('8 2, 9 -1, 11 1'), sh);
    k.poly(P('18 2, 17 -1, 15 1'), sh);
    k.rect(11, 0, 4, 2, mDk);
    k.px(12, 0, mLt);
    k.px(9, 5, '#1a1410');
    k.px(16, 5, '#1a1410');
    k.rect(11, 13, 1, 1, deep);
    k.rect(14, 13, 1, 1, deep);
    for (let y = 8; y < 16; y += 2) {
      k.px(9, y, y % 4 ? mDk : mLt);
      k.px(16, y, y % 4 ? mLt : mDk);
    }
    if (o.saddle) {
      k.line(10, 12, 7, 15, '#4a2a14');
      k.line(16, 12, 19, 15, '#4a2a14');
    }
  }
  // Dos (vers le haut de l'écran) : 26 × 38. under : encolure et oreilles (derrière le cavalier) ; over : croupe et queue.
  function horseBack(k, M, o, part) {
    const [lt, base, sh] = M.coat,
      [mLt, mDk] = M.mane,
      step = o.frame % 2,
      hoof = '#2a1c14';
    if (part === 'under') {
      k.rect(10, 3, 6, 10, base);
      k.poly(P('9 4, 10 0, 12 3'), sh);
      k.poly(P('17 4, 16 0, 14 3'), sh);
      for (let y = 3; y < 12; y += 2) k.rect(12, y, 2, 2, y % 4 ? mDk : mLt);
      ell(k, 13, 15, 8, 5, base);
      if (o.saddle) k.rect(5, 11, 16, 6, M.blanket || '#3a6ab0');
      return;
    }
    for (const [x, up] of [
      [8, step ? 2 : 0],
      [15, step ? 0 : 2]
    ]) {
      k.rect(x, 24, 3, 11 - up, base);
      k.rect(x, 31 - up, 3, 3, M.sock);
      k.rect(x, 34 - up, 3, 2, hoof);
    }
    ell(k, 13, 21, 9, 6, base);
    k.rect(6, 17, 14, 2, lt);
    k.rect(5, 25, 16, 2, sh);
    k.rect(12, 16, 2, 2, sh);
    // Queue au milieu de la croupe.
    const sw = o.swish || 0;
    k.poly(P(`11 18, 15 18, ${15 + sw} 30, ${13 + sw} 33, ${11 + sw} 30`), mDk);
    k.line(13, 19, 13 + sw, 30, mLt);
  }
  // Sprites d'une monture : side(frame, …), front/back(part, frame) ; cachés par clé.
  const HORSE = {
    side: (M, frame, o = {}) =>
      bake(
        'hs|' + M.id + '|' + frame + '|' + (o.saddle ? 1 : 0) + (o.graze ? 1 : 0) + '|' + (o.swish || 0),
        SIDE_W,
        SIDE_H,
        k => horseSide(k, M, { frame, ...o })
      ),
    sideFront: (M, frame) =>
      bake('hsf|' + M.id + '|' + frame, SIDE_W, SIDE_H, k => horseSideFront(k, M, { frame })),
    front: (M, part, frame, saddle = true) =>
      bake('hf|' + M.id + '|' + part + '|' + (frame % 2) + '|' + (saddle ? 1 : 0), 26, 38, k =>
        horseFront(k, M, { frame, saddle }, part)
      ),
    back: (M, part, frame, saddle = true, swish = 0) =>
      bake('hb|' + M.id + '|' + part + '|' + (frame % 2) + '|' + (saddle ? 1 : 0) + '|' + swish, 26, 38, k =>
        horseBack(k, M, { frame, saddle, swish }, part)
      ),
    // Point d'ancrage (en pixels d'écran) : centre de la selle et ligne des sabots.
    SIDE: { w: SIDE_W * U, h: SIDE_H * U, saddleX: 21 * U, ground: GROUND * U },
    FRONT: { w: 26 * U, h: 38 * U, cx: 13 * U, ground: 36 * U }
  };

  // ---------------------------------------------------------------- Statues
  const STONE = ['#ece6d6', '#cbc3b1', '#a39b8b', '#746d60'];
  const MARBLE = ['#ffffff', '#ece8e0', '#c8c2b6', '#948e84'];
  const GOLD = ['#fff0a0', '#e8c050', '#b88a28', '#7a5a14'];
  // Socle commun : dalles de pierre, corniche, plaque dorée gravée.
  function plinth(k, w, top, h, R, plaque = true) {
    k.rect(1, top, w - 2, 3, R[1]);
    k.rect(1, top, w - 2, 1, R[0]);
    k.rect(3, top + 3, w - 6, h - 3, R[2]);
    for (let y = top + 6; y < top + h; y += 4)
      for (let x = 3 + ((y / 4) % 2 ? 0 : 3); x < w - 3; x += 6) k.rect(x, y, 1, 3, R[3]);
    k.rect(3, top + 3, 1, h - 3, R[1]);
    if (plaque) {
      const pw = Math.round(w * 0.4),
        px = Math.round((w - pw) / 2);
      k.rect(px, top + 5, pw, 4, GOLD[1]);
      k.rect(px, top + 5, pw, 1, GOLD[0]);
      for (let x = px + 1; x < px + pw - 1; x += 2) k.px(x, top + 7, GOLD[3]);
    }
  }
  // Héros de pierre (huit poses) : jambes, cape, torse, tête, bras et arme. R : tons de la pierre.
  function figure(k, pose, R, cx = 12, base = 32) {
    const [lt, md, sh, dk] = R;
    // Cape, jambes, torse, ceinture, tête et chevelure.
    k.poly(
      P(`${cx - 5} ${base - 19}, ${cx + 5} ${base - 19}, ${cx + 7} ${base - 1}, ${cx - 7} ${base - 1}`),
      sh
    );
    k.rect(cx - 3, base - 9, 2, 9, md);
    k.rect(cx + 1, base - 9, 2, 9, sh);
    k.rect(cx - 4, base - 20, 8, 12, md);
    k.rect(cx - 4, base - 20, 3, 12, lt);
    k.rect(cx - 4, base - 11, 8, 1, dk);
    k.disc(cx, base - 24, 3, md);
    k.rect(cx - 2, base - 27, 4, 2, lt);
    const arm = (x0, y0, x1, y1) => k.line(x0, y0, x1, y1, md, 2);
    switch (pose % 8) {
      case 0: // épée levée vers le ciel
        arm(cx + 3, base - 19, cx + 6, base - 27);
        k.rect(cx + 6, base - 39, 2, 12, lt);
        k.rect(cx + 4, base - 28, 6, 1, dk);
        arm(cx - 4, base - 19, cx - 6, base - 11);
        break;
      case 1: // lance dressée
        k.rect(cx + 6, base - 38, 1, 38, sh);
        k.poly(P(`${cx + 5} ${base - 38}, ${cx + 6} ${base - 43}, ${cx + 8} ${base - 38}`), lt);
        arm(cx + 3, base - 18, cx + 6, base - 16);
        arm(cx - 4, base - 19, cx - 5, base - 11);
        break;
      case 2: // arc tendu
        for (let i = 0; i < 13; i++)
          k.px(cx - 8 + Math.round(Math.sin((i / 12) * Math.PI) * -2), base - 26 + i, md);
        k.line(cx - 8, base - 26, cx - 8, base - 14, lt);
        arm(cx - 4, base - 19, cx - 8, base - 20);
        arm(cx + 3, base - 19, cx - 1, base - 20);
        break;
      case 3: // bâton de mage à l'orbe
        k.rect(cx - 7, base - 34, 1, 34, sh);
        k.disc(cx - 7, base - 35, 2, lt);
        arm(cx - 4, base - 19, cx - 7, base - 22);
        arm(cx + 3, base - 19, cx + 5, base - 12);
        break;
      case 4: // grande hache sur l'épaule
        k.line(cx + 4, base - 10, cx + 8, base - 30, sh, 1);
        k.poly(
          P(
            `${cx + 6} ${base - 32}, ${cx + 12} ${base - 34}, ${cx + 12} ${base - 25}, ${cx + 7} ${base - 27}`
          ),
          lt
        );
        arm(cx + 3, base - 19, cx + 6, base - 22);
        arm(cx - 4, base - 19, cx - 5, base - 11);
        break;
      case 5: // bouclier rond et épée baissée
        k.disc(cx - 4, base - 15, 5, md);
        k.disc(cx - 4, base - 15, 3, lt);
        k.px(cx - 4, base - 15, dk);
        k.rect(cx + 5, base - 14, 1, 11, lt);
        arm(cx + 3, base - 19, cx + 5, base - 14);
        break;
      case 6: // luth contre la poitrine
        k.disc(cx - 1, base - 13, 3, sh);
        k.line(cx, base - 15, cx + 6, base - 24, md, 1);
        arm(cx + 3, base - 19, cx + 2, base - 13);
        arm(cx - 4, base - 19, cx - 3, base - 14);
        break;
      default: // deux dagues croisées
        arm(cx + 3, base - 19, cx + 1, base - 15);
        arm(cx - 4, base - 19, cx - 2, base - 15);
        k.line(cx - 3, base - 20, cx + 3, base - 12, lt);
        k.line(cx + 3, base - 20, cx - 3, base - 12, lt);
    }
  }
  // Statue d'un héros de l'Allée des Légendes : 26 × 52, socle de 14 ; mousse et lichen selon la statue.
  const statue = (pose, special = false) =>
    bake('st|' + pose + '|' + (special ? 1 : 0), 26, 54, k => {
      const R = special ? MARBLE : STONE;
      plinth(k, 26, 38, 15, special ? MARBLE : STONE);
      if (special) {
        k.rect(1, 38, 24, 1, GOLD[1]);
        k.rect(3, 52, 20, 1, GOLD[2]);
      }
      figure(k, special ? 0 : pose, R, 13, 38);
      if (special) {
        // Soleil levé au-dessus de l'épée : disque d'or et rayons.
        k.disc(20, 4, 3, GOLD[1]);
        k.disc(20, 4, 1, GOLD[0]);
        for (const [dx, dy] of [
          [0, -1],
          [1, 0],
          [-1, 0],
          [1, 1],
          [-1, 1]
        ])
          k.px(20 + dx * 5, 4 + dy * 5, GOLD[1]);
      } else
        for (let i = 0; i < 7; i++) {
          const x = 2 + Math.floor(hash(pose, i) * 22),
            y = 20 + Math.floor(hash(i, pose + 3) * 30);
          k.rect(x, y, 2, 1, i % 2 ? '#6e8a4a' : '#8aa858');
        }
    });
  // Statue de l'arène de Valérion : champion de pierre qui lève un disque solaire (éteint ou allumé), 32 × 62.
  const arenaStatue = (lit = false) =>
    bake('ast|' + (lit ? 1 : 0), 32, 64, k => {
      plinth(k, 32, 46, 17, STONE, false);
      k.rect(10, 50, 12, 5, lit ? GOLD[1] : STONE[3]);
      k.rect(11, 51, 10, 3, lit ? GOLD[0] : STONE[2]);
      figure(k, 5, STONE, 16, 46);
      // Bras levés et disque solaire au-dessus de la tête.
      k.line(12, 27, 9, 17, STONE[1], 2);
      k.line(20, 27, 23, 17, STONE[1], 2);
      k.disc(16, 11, 7, lit ? GOLD[1] : STONE[2]);
      k.disc(16, 11, 5, lit ? GOLD[0] : STONE[1]);
      k.disc(16, 11, 2, lit ? '#ffffff' : STONE[2]);
      for (let a = 0; a < 8; a++) {
        const x = 16 + Math.round(Math.cos((a * Math.PI) / 4) * 9),
          y = 11 + Math.round(Math.sin((a * Math.PI) / 4) * 9);
        k.rect(x, y, 1, 1, lit ? GOLD[1] : STONE[2]);
      }
      if (lit) {
        k.px(14, 20, '#fff6a0');
        k.px(18, 20, '#fff6a0');
      }
    });

  // ---------------------------------------------------------------- Écurie des Héros
  // Grange de bois au grand toit rouge, vue de face : 168 × 118 (sur 7 cases de large). Fondations de pierre, murs
  // de planches, pignon et porte du fenil pleine de foin, grande porte à deux battants ouverts sur la paille,
  // fenêtres à volets, enseigne au fer à cheval doré, lanterne.
  const WOOD = ['#c8945a', '#a87444', '#86582e', '#5e3c1e'];
  const ROOF = ['#d0644a', '#b04a36', '#8a3626', '#5e2418'];
  function planks(k, x0, y0, x1, y1, R = WOOD) {
    for (let x = x0; x < x1; x += 4) {
      const t = Math.floor(hash(x, y0) * 3);
      k.rect(x, y0, 4, y1 - y0, R[t === 0 ? 0 : t === 1 ? 1 : 2]);
      k.rect(x + 3, y0, 1, y1 - y0, R[3]);
      if (hash(y0, x) > 0.6) k.px(x + 1, y0 + 2 + Math.floor(hash(x, x) * (y1 - y0 - 4)), R[3]);
    }
  }
  const stable = () =>
    bake('stable', 168, 120, k => {
      // Fondations.
      k.rect(6, 104, 156, 14, '#9a9488');
      for (let y = 104; y < 118; y += 4)
        for (let x = 6 + ((y / 4) % 2 ? 0 : 5); x < 160; x += 10) k.rect(x, y, 1, 4, '#6a655c');
      k.rect(6, 104, 156, 1, '#c8c2b4');
      // Murs de planches et pignon.
      planks(k, 10, 56, 158, 104);
      k.poly(P('16 60, 84 16, 152 60'), WOOD[1]);
      planks(k, 20, 30, 148, 58);
      // Toit à deux pans en bardeaux (chevron).
      const roof = (pts, cx) => CANAAN_PIXEL_KIT.shingles(k, P(pts), ROOF, { w: 7, h: 6, cx });
      roof('2 62, 84 6, 84 16, 14 66', 40);
      roof('84 6, 166 62, 154 66, 84 16', 128);
      k.rect(80, 4, 8, 4, ROOF[3]);
      // Fenil : porte ouverte pleine de foin, poutre et poulie.
      k.rect(70, 32, 28, 22, '#3a2414');
      k.rect(72, 40, 24, 14, '#e8c860');
      for (let x = 73; x < 95; x += 3) k.rect(x, 38 + (x % 2), 2, 3, '#f4dc80');
      k.rect(68, 30, 32, 2, WOOD[3]);
      k.rect(82, 22, 4, 9, WOOD[2]);
      k.disc(84, 28, 2, '#5a5a5a');
      // Grande porte : battants ouverts (croix blanches), paille et pénombre.
      k.rect(58, 66, 52, 38, '#2a1a10');
      k.rect(60, 88, 48, 16, '#c8a040');
      for (let x = 61; x < 107; x += 4) k.rect(x, 86 + (x % 3), 2, 3, '#e8c860');
      k.rect(64, 72, 10, 10, '#3a2a1c');
      for (const x0 of [44, 110]) {
        k.rect(x0, 66, 14, 38, WOOD[1]);
        k.rect(x0, 66, 14, 2, '#e8dcc0');
        k.rect(x0, 102, 14, 2, '#e8dcc0');
        k.line(x0, 68, x0 + 13, 101, '#e8dcc0');
        k.line(x0 + 13, 68, x0, 101, '#e8dcc0');
      }
      k.rect(56, 64, 56, 3, WOOD[3]);
      // Enseigne au fer à cheval.
      k.rect(72, 56, 24, 8, WOOD[2]);
      k.rect(72, 56, 24, 1, WOOD[0]);
      k.disc(84, 60, 3, GOLD[1]);
      k.disc(84, 59, 1, WOOD[2]);
      k.rect(83, 60, 3, 3, WOOD[2]);
      // Fenêtres à volets verts et lumière chaude.
      for (const x0 of [20, 126]) {
        k.rect(x0, 70, 18, 14, '#3a2414');
        k.rect(x0 + 2, 72, 14, 10, '#ffd88a');
        k.rect(x0 + 8, 72, 2, 10, '#5a3a1e');
        k.rect(x0 + 2, 76, 14, 1, '#5a3a1e');
        k.rect(x0 - 5, 70, 5, 14, '#4a7a4a');
        k.rect(x0 + 18, 70, 5, 14, '#4a7a4a');
      }
      // Angles blanchis à la chaux.
      k.rect(10, 56, 3, 48, '#e8dcc0');
      k.rect(155, 56, 3, 48, '#e8dcc0');
      // Bottes de foin et auge devant.
      for (const [x, y] of [
        [12, 96],
        [24, 98]
      ]) {
        k.rect(x, y, 14, 9, '#e0bc50');
        k.rect(x, y, 14, 2, '#f4dc80');
        k.rect(x + 4, y, 1, 9, '#a8842a');
        k.rect(x + 9, y, 1, 9, '#a8842a');
      }
      k.rect(128, 98, 28, 8, WOOD[2]);
      k.rect(130, 99, 24, 3, '#4a8ac8');
      k.rect(131, 99, 10, 1, '#9ad0f0');
    });
  // Lanterne accrochée (éclairée par vallee.js).
  const lantern = () =>
    bake('lantern', 8, 14, k => {
      k.rect(3, 0, 2, 3, '#3a2a1c');
      k.rect(1, 3, 6, 9, '#3a2a1c');
      k.rect(2, 4, 4, 7, '#ffd870');
      k.rect(3, 5, 1, 4, '#fff6c0');
      k.rect(0, 12, 8, 2, '#3a2a1c');
    });

  // ---------------------------------------------------------------- Moulin
  // Tour de pierre effilée, toit conique de bardeaux, porte et lucarne : 44 × 84. Ailes peintes à part (moulin à vent :
  // quatre ailes à claire-voie tendues de toile), tournées par vallee.js.
  const mill = () =>
    bake('mill', 44, 84, k => {
      k.poly(P('10 82, 14 24, 30 24, 34 82'), '#d8d0bc');
      for (let y = 28; y < 82; y += 5)
        for (let x = 10 + ((y / 5) % 2 ? 0 : 3); x < 34; x += 6) {
          const half = 2 + (y - 24) * (6 / 58);
          if (Math.abs(x - 22) < 10 + half - 4) k.rect(x, y, 1, 4, '#a8a090');
        }
      k.rect(11, 80, 22, 3, '#8a8478');
      CANAAN_PIXEL_KIT.shingles(k, P('8 28, 22 4, 36 28'), ROOF, { w: 5, h: 5, cx: 18 });
      k.rect(18, 66, 8, 16, '#4a2e18');
      k.rect(19, 67, 6, 15, '#6a4224');
      k.rect(23, 74, 1, 1, '#e8c050');
      k.rect(19, 44, 6, 7, '#3a2414');
      k.rect(20, 45, 4, 5, '#ffd88a');
      k.disc(22, 22, 3, '#5a3a1e');
      k.disc(22, 22, 1, '#9a7a4a');
    });
  // Une aile (axe vers le haut) : longeron, barreaux et toile ; 12 × 40, moyeu en bas au centre.
  const sail = () =>
    bake(
      'sail',
      12,
      40,
      k => {
        k.rect(5, 0, 2, 40, '#6a4224');
        k.rect(1, 2, 10, 28, '#f2e8d0');
        for (let y = 2; y < 30; y += 4) k.rect(1, y, 10, 1, '#8a6038');
        k.rect(1, 2, 1, 28, '#8a6038');
        k.rect(10, 2, 1, 28, '#8a6038');
      },
      { shine: false }
    );

  // ---------------------------------------------------------------- Clôtures, pont de pierre, dalles
  // Poteau de clôture (8 × 20) et lisse horizontale (24 × 12) en bois.
  const post = () =>
    bake('post', 5, 12, k => {
      k.rect(1, 0, 3, 12, WOOD[1]);
      k.rect(1, 0, 1, 12, WOOD[0]);
      k.rect(1, 0, 3, 1, WOOD[0]);
    });
  const rail = () =>
    bake('rail', 24, 8, k => {
      k.rect(0, 1, 24, 2, WOOD[1]);
      k.rect(0, 1, 24, 1, WOOD[0]);
      k.rect(0, 5, 24, 2, WOOD[2]);
      k.rect(0, 5, 24, 1, WOOD[1]);
    });
  // Case de pont de pierre (24 × 24 d'art = une case) selon son sens : dalles en quinconce, parapets sur les côtés.
  const bridge = (axis, v) =>
    bake(
      'br|' + axis + '|' + v,
      24,
      24,
      k => {
        const S = ['#d8d0bc', '#c2b9a4', '#a69c88', '#7a7264'];
        k.rect(0, 0, 24, 24, S[1]);
        for (let y = 0; y < 24; y += 6)
          for (let x = (y / 6) % 2 ? 0 : 4; x < 24; x += 8) {
            k.rect(x, y, 7, 5, S[(Math.floor(hash(x + v, y) * 3) % 3) + (hash(y, x + v) > 0.8 ? 1 : 0)]);
            k.rect(x, y, 7, 1, S[0]);
          }
        if (axis === 'h') {
          k.rect(0, 0, 24, 4, S[2]);
          k.rect(0, 0, 24, 1, S[0]);
          k.rect(0, 20, 24, 4, S[2]);
          k.rect(0, 23, 24, 1, S[3]);
        } else {
          k.rect(0, 0, 4, 24, S[2]);
          k.rect(0, 0, 1, 24, S[0]);
          k.rect(20, 0, 4, 24, S[2]);
          k.rect(23, 0, 1, 24, S[3]);
        }
      },
      { ink: false }
    );
  // Dalle de l'Allée des Légendes (une case) : grandes pierres claires, joints, brins d'herbe.
  const slab = v =>
    bake(
      'slab|' + v,
      24,
      24,
      k => {
        const S = ['#efe6cc', '#ddd2b4', '#c4b898', '#9a8e72'];
        k.rect(0, 0, 24, 24, S[3]);
        for (const [x, y, w, h] of [
          [0, 0, 11, 11],
          [12, 0, 12, 7],
          [12, 8, 12, 15],
          [0, 12, 11, 12]
        ]) {
          k.rect(x, y, w, h, S[1 + (Math.floor(hash(x + v * 3, y) * 2) % 2)]);
          k.rect(x, y, w, 1, S[0]);
        }
        if (v === 1) k.rect(11, 10, 1, 3, '#7a9a4a');
      },
      { ink: false }
    );

  window.CANAAN_VALLEY_ART = Object.freeze({
    U,
    HORSE,
    statue,
    arenaStatue,
    stable,
    lantern,
    mill,
    sail,
    post,
    rail,
    bridge,
    slab,
    GOLD
  });
})();
