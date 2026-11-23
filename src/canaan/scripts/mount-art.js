// Montures : pixel art de toutes les montures du jeu, avec le kit commun (client/art/pixel-kit.js : même pinceau, même
// contour d'encre, même modelé et même grille de gros pixels de 2 que les bâtiments et les créatures). Rien n'est peint
// à chaque image : chaque pose est peinte une fois, gardée, puis posée par mounts.js.
// Une espèce (define) est un objet { seat, side, front, back, hover, bounce, stand } :
//   side(k, M, o)         profil tourné vers la droite · o : { frame (0-3, -1 à l'arrêt), saddle, graze, swish, flap }
//   front / back(k, M, o, part)  vers le bas / le haut de l'écran, en deux calques : 'under' (sous le cavalier) et
//                         'over' (devant lui)
//   seat                  hauteur de la selle au-dessus du sol · hover : hauteur de vol · bounce : bonds [4 images]
//   stand                 le cavalier se tient debout dessus (tapis) : aucun calque devant ses jambes
//   soft, veil(k, M)      il s'y enfonce (nuage) : veil peint les volutes de devant · thin : fine (balai)
// Repère des dessins : (0, 0) est au sol, sous le milieu de la selle ; x vers l'avant, y négatif vers le haut.
// Espèces communes : cheval (et ses variantes), quadrupèdes (quad : cerf, loup, ours…), oiseaux coureurs (bird),
// tortue, rainette, scarabée, araignée, tapis, balai, nuage. Une extension en définit d'autres avec les mêmes outils.
(() => {
  'use strict';
  const { brush, outline, polish, tint, makeCanvas, hashGrid: hash } = CANAAN_PIXEL_KIT;
  const U = 2;
  // Toiles (en pixels d'art) : profil 72 × 60, face et dos 56 × 60 ; sol à la ligne 56.
  const SIDE = { w: 72, h: 60, x: 30, ground: 56 },
    FRONT = { w: 56, h: 60, x: 28, ground: 56 };
  const cache = new Map();
  // Peint une fois dans le repère du sol, modelé et cerné, puis agrandi × 2 sans flou ; null sans canevas.
  function bake(key, box, fn, ink = true) {
    if (cache.has(key)) return cache.get(key);
    let out = null;
    if (typeof document !== 'undefined') {
      const k = brush(box.w, box.h);
      if (k.g && k.g.getImageData && k.g.translate) {
        k.g.translate(box.x, box.ground);
        fn(k);
        k.g.setTransform?.(1, 0, 0, 1, 0, 0);
        polish(k.cv, 1, key.length * 7);
        if (ink) outline(k);
        out = makeCanvas(box.w * U, box.h * U);
        const g = out.getContext('2d');
        if (g) {
          g.imageSmoothingEnabled = false;
          g.drawImage(k.cv, 0, 0, box.w * U, box.h * U);
        }
      }
    }
    cache.set(key, out);
    return out;
  }
  // ---------------------------------------------------------------- Outils de dessin
  const P = s => s.split(',').map(p => p.trim().split(/\s+/).map(Number));
  const move = (pts, x, y) => pts.map(([a, b]) => [a + x, b + y]);
  function ell(k, cx, cy, rx, ry, col) {
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1, col);
    }
  }
  // Polygone décalé en (x, y).
  const shape = (k, x, y, text, col) => k.poly(move(P(text), x, y), col);
  // Rectangle et son reflet de l'autre côté de l'axe (vues de face et de dos ; l'axe est la colonne x = 0).
  function twin(k, x, y, w, h, col) {
    k.rect(x, y, w, h, col);
    k.rect(-x - w + 1, y, w, h, col);
  }
  const twinPoly = (k, pts, col) => {
    k.poly(pts, col);
    k.poly(
      pts.map(([x, y]) => [1 - x, y]),
      col
    );
  };
  const bobOf = frame => (frame === 1 || frame === 3 ? -1 : 0);
  const HOOF = '#2a1c14',
    LEATHER = ['#9a6236', '#6a3e1e', '#4a2a14'],
    GOLD = '#e8c860';
  // Selle de profil : tapis à liseré d'or, selle de cuir, sangle.
  function saddleSide(k, M, y, bob = 0, strap = 8) {
    const t = y + bob;
    k.rect(-6, t + 2, 13, 7, M.blanket);
    k.rect(-6, t + 8, 13, 1, GOLD);
    k.rect(-4, t, 9, 4, LEATHER[1]);
    k.rect(-4, t, 9, 1, LEATHER[0]);
    k.rect(4, t - 1, 2, 2, LEATHER[0]);
    k.rect(-5, t - 1, 2, 2, LEATHER[1]);
    if (strap) k.rect(0, t + 4, 1, strap, LEATHER[2]);
  }
  // Pans du tapis de selle, de face et de dos.
  function saddleFront(k, M, y, half) {
    twin(k, half - 3, y + 1, 4, 7, M.blanket);
    twin(k, half - 3, y + 7, 4, 1, GOLD);
    k.rect(-half + 1, y - 1, half * 2 - 1, 3, LEATHER[1]);
  }

  // ---------------------------------------------------------------- Pattes
  // Par patte (arrière lointaine, arrière proche, avant lointaine, avant proche) : [avance, hauteur levée, pli].
  const STAND = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    GALLOP = [
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
    ];
  // Une patte : cuisse, jambe, puis le pied ('hoof' sabot, 'paw' grosse patte, 'claw' serres).
  function leg(k, ax, ay, [dx, lift, bend], col, sock, { thick = 2, foot = 'hoof', stride = 1 } = {}) {
    const hx = ax + Math.round(dx * stride),
      hy = -Math.round(lift * stride),
      kx = Math.round((ax + hx) / 2 + bend * stride),
      ky = Math.round(ay + (hy - ay) * 0.48);
    k.line(ax, ay, kx, ky, col, thick);
    k.line(kx, ky, hx, hy - 2, col, thick);
    if (foot === 'hoof') {
      k.rect(hx - 1, hy - 4, thick + 1, 3, sock);
      k.rect(hx - 1, hy - 1, thick + 1, 2, HOOF);
    } else if (foot === 'claw') {
      k.rect(hx, hy - 3, thick, 3, sock);
      k.rect(hx - 2, hy, thick + 5, 1, sock);
      k.px(hx + thick + 3, hy, HOOF);
    } else {
      k.rect(hx - 1, hy - 2, thick + 2, 3, sock);
      k.px(hx + thick, hy, HOOF);
    }
  }

  // ---------------------------------------------------------------- Ailes
  // Aile déployée depuis son attache, vers la gauche (dir 1) ou la droite (-1). pose 0-3 : battement. R : [clair, base,
  // ombre, profond] ; bat : membrane de dragon au lieu de plumes.
  function wing(k, x, y, pose, R, { bat = false, dir = 1, size = 1 } = {}) {
    const up = [9, 15, 18, 13][pose] * size,
      reach = [21, 20, 17, 21][pose] * size,
      at = list => list.map(([a, b]) => [x - a * dir + (dir < 0 ? 1 : 0), y + b]);
    if (bat) {
      k.poly(
        at([
          [-2, 1],
          [5, -up],
          [reach, -up + 1],
          [reach - 2, -up * 0.35],
          [reach * 0.72, -up * 0.5],
          [reach * 0.55, -1],
          [reach * 0.34, -up * 0.28],
          [3, 4]
        ]),
        R[1]
      );
      for (const [a, b] of [
        [reach, -up + 1],
        [reach * 0.72, -up * 0.5],
        [reach * 0.55, -1]
      ])
        k.line(...at([[5, -up]])[0], ...at([[a, b]])[0], R[3]);
      k.line(...at([[0, 0]])[0], ...at([[5, -up]])[0], R[0], 2);
      k.line(...at([[5, -up]])[0], ...at([[reach, -up + 1]])[0], R[0]);
      return;
    }
    // Trois rangs de plumes : rémiges sombres, couvertures, duvet clair.
    k.poly(
      at([
        [-2, 2],
        [4, -up],
        [reach, -up - 1],
        [reach + 1, -up * 0.6],
        [reach - 3, -up * 0.3],
        [reach * 0.7, 0],
        [reach * 0.4, 4],
        [2, 6]
      ]),
      R[2]
    );
    k.poly(
      at([
        [-2, 1],
        [4, -up],
        [reach - 1, -up],
        [reach * 0.8, -up * 0.5],
        [reach * 0.5, -1],
        [3, 4]
      ]),
      R[1]
    );
    k.poly(
      at([
        [-1, 0],
        [4, -up],
        [reach * 0.7, -up],
        [reach * 0.45, -up * 0.45],
        [2, 1]
      ]),
      R[0]
    );
    for (let i = 1; i < 5; i++)
      k.line(
        ...at([[reach * (0.3 + i * 0.14), -up * (0.72 - i * 0.02)]])[0],
        ...at([[reach * (0.36 + i * 0.15), -up * 0.5 + (5 - i) * 1.6]])[0],
        R[3]
      );
  }
  const FLAPS = [0, 1, 2, 1];

  // ---------------------------------------------------------------- Cheval
  // Peint sur sa grille d'origine (46 × 38, sabots à la ligne 36, selle en x = 21, y = 10). V : variante —
  // { wings, horn, fire } (ailes de plumes, corne, crins de flammes).
  function horseSide(k, M, o, V) {
    const [lt, base, sh, deep] = M.coat,
      [mLt, mDk] = M.mane,
      far = tint(base, 0.78),
      pose = o.frame < 0 ? STAND : GALLOP[o.frame],
      bob = bobOf(o.frame),
      sw = o.swish || 0,
      attach = [
        [-8, -13],
        [-5, -12],
        [8, -13],
        [11, -12]
      ];
    const flap = o.frame < 0 ? 0 : FLAPS[o.flap || 0];
    if (V.wings)
      wing(
        k,
        -1,
        -24 + bob,
        flap,
        M.wing.map(c => tint(c, 0.82)),
        { dir: 1, size: 0.9 }
      );
    k.g.save?.();
    k.g.translate(-21, -36);
    // Queue : crins qui tombent et ondulent, ou flammes.
    if (V.fire) flames(k, 8, 18 + bob, -1, M, sw);
    else {
      k.poly(
        P(`11 ${15 + bob}, 7 ${17 + bob}, ${4 + sw} 26, ${3 + sw} 31, ${6 + sw} 30, 9 23, 12 ${19 + bob}`),
        mDk
      );
      k.line(9, 17 + bob, 5 + sw, 28, mLt);
    }
    k.g.translate(21, 36);
    for (const i of [0, 2]) leg(k, attach[i][0], attach[i][1] + bob, pose[i], far, tint(M.sock, 0.8));
    k.g.translate(-21, -36);
    // Corps : croupe, ventre, poitrail.
    ell(k, 13, 17 + bob, 6, 6, base);
    ell(k, 21, 19 + bob, 11, 6, base);
    ell(k, 30, 18 + bob, 5, 6, base);
    k.rect(11, 22 + bob, 22, 2, sh);
    k.rect(14, 13 + bob, 14, 2, lt);
    if (o.graze) {
      k.poly(P(`28 ${14 + bob}, 33 13, 38 22, 39 29, 35 30, 33 22, 30 ${22 + bob}`), base);
      k.poly(P('35 27, 40 26, 43 31, 42 34, 38 34, 35 31'), base);
      k.rect(41, 32, 2, 1, deep);
      k.px(39, 28, '#1a1410');
      k.poly(P('34 27, 35 24, 37 26'), sh);
      if (V.horn) k.line(41, 26, 45, 21, '#ffe9a0', 1);
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
      k.px(38, 5 + bob, V.fire ? '#ffd25a' : '#1a1410');
      k.px(37, 5 + bob, V.fire ? '#ff7a2a' : '#ffffff');
      k.poly(P(`34 ${3 + bob}, 35 ${bob}, 37 ${2 + bob}`), sh);
      if (V.fire) for (let i = 0; i < 4; i++) flames(k, 28 + i * 2, 11 + bob - i * 3, 0, M, (sw + i) % 2);
      for (let i = 0; i < 7; i++) k.line(29 + i, 10 + bob - i, 27 + i, 14 + bob - i, i % 2 ? mDk : mLt);
      k.line(37, 2 + bob, 39, 4 + bob, mLt);
      if (V.horn) {
        k.line(39, 2 + bob, 45, -7 + bob, '#ffe9a0', 2);
        for (let i = 0; i < 3; i++) k.px(41 + i * 2, bob - 1 - i * 3, '#c89a3a');
        k.px(46, -8 + bob, '#ffffff');
      }
    }
    k.g.translate(21, 36);
    for (const i of [1, 3]) leg(k, attach[i][0], attach[i][1] + bob, pose[i], base, M.sock);
    if (o.saddle) {
      saddleSide(k, M, -26, bob);
      if (!o.graze) {
        k.line(22, -27 + bob, 16, -31 + bob, LEATHER[2]);
        k.line(16, -30 + bob, 5, -25 + bob, '#5a3418');
      }
    }
    if (V.wings) wing(k, -4, -21 + bob, flap, M.wing, { dir: 1 });
    k.g.restore?.();
  }
  // Petites flammes (crins du Cauchemar) : dir -1 vers l'arrière, 0 vers le haut.
  function flames(k, x, y, dir, M, v) {
    if (dir) {
      shape(k, x, y, `4 -3, -2 -4, -7 ${-1 + v}, -4 1, -9 ${6 + v}, -3 5, -5 ${11 - v}, 1 6, 4 3`, M.mane[1]);
      shape(k, x, y, `3 -2, -2 -2, -4 ${1 + v}, -2 3, -4 ${6 + v}, 1 4`, M.mane[0]);
    } else {
      shape(k, x, y, `-3 3, -2 ${-4 - v}, 0 -1, 2 ${-6 + v}, 4 2`, M.mane[1]);
      shape(k, x, y, `-1 2, 0 -1, 1 ${-3 + v}, 2 2`, M.mane[0]);
    }
  }
  function horseFront(k, M, o, part, V) {
    const [lt, base, sh, deep] = M.coat,
      [mLt, mDk] = M.mane,
      step = Math.max(0, o.frame) % 2;
    k.g.save?.();
    if (part === 'under') {
      if (V.wings)
        for (const dir of [1, -1]) wing(k, -5 * dir, -22, FLAPS[o.flap || 0], M.wing, { dir, size: 0.9 });
      twin(k, 4, -12, 2, 11, tint(base, 0.7));
      ell(k, 0, -17, 9, 7, base);
      k.rect(-8, -14, 17, 2, sh);
      for (const [x, up] of [
        [-5, step ? 2 : 0],
        [3, step ? 0 : 2]
      ]) {
        k.rect(x, -12, 3, 11 - up, base);
        k.rect(x, -5 - up, 3, 3, M.sock);
        k.rect(x, -2 - up, 3, 2, HOOF);
      }
      if (o.saddle) saddleFront(k, M, -23, 11);
    } else {
      // Tête basse : elle ne cache pas le visage du cavalier.
      k.g.translate(0, 8);
      k.rect(-3, -25, 7, 8, base);
      k.rect(-4, -20, 9, 3, base);
      k.poly(P('-4 -33, 5 -33, 4 -23, 2 -20, -1 -20, -3 -23'), base);
      k.rect(-1, -32, 2, 10, lt);
      twinPoly(k, P('-5 -32, -4 -36, -2 -33'), sh);
      k.rect(-2, -35, 5, 2, mDk);
      k.px(-1, -35, mLt);
      if (V.fire) flames(k, 0, -35, 0, M, step);
      twin(k, -4, -29, 1, 1, V.fire ? '#ffd25a' : '#1a1410');
      twin(k, -2, -22, 1, 1, deep);
      if (V.horn) {
        k.px(0, -40, '#ffffff');
        k.rect(0, -39, 2, 6, '#ffe9a0');
        k.px(0, -37, '#c89a3a');
        k.px(1, -35, '#c89a3a');
      }
      for (let y = -27; y < -19; y += 2) twin(k, -4, y, 1, 1, y % 4 ? mDk : mLt);
      if (o.saddle) twinPoly(k, P('-3 -23, -7 -20, -6 -19, -2 -22'), LEATHER[2]);
    }
    k.g.restore?.();
  }
  function horseBack(k, M, o, part, V) {
    const [lt, base, sh] = M.coat,
      [mLt, mDk] = M.mane,
      step = Math.max(0, o.frame) % 2,
      sw = o.swish || 0;
    if (part === 'under') {
      if (V.wings)
        for (const dir of [1, -1]) wing(k, -5 * dir, -22, FLAPS[o.flap || 0], M.wing, { dir, size: 0.9 });
      k.rect(-3, -33, 7, 10, base);
      twinPoly(k, P('-4 -32, -3 -36, -1 -33'), sh);
      if (V.horn) k.rect(0, -41, 1, 8, '#ffe9a0');
      for (let y = -33; y < -24; y += 2) k.rect(0, y, 2, 2, y % 4 ? mDk : mLt);
      if (V.fire) flames(k, 0, -33, 0, M, step);
      ell(k, 0, -21, 8, 5, base);
      if (o.saddle) k.rect(-8, -25, 17, 6, M.blanket);
      return;
    }
    for (const [x, up] of [
      [-5, step ? 2 : 0],
      [3, step ? 0 : 2]
    ]) {
      k.rect(x, -12, 3, 11 - up, base);
      k.rect(x, -5 - up, 3, 3, M.sock);
      k.rect(x, -2 - up, 3, 2, HOOF);
    }
    ell(k, 0, -15, 9, 6, base);
    k.rect(-6, -19, 13, 2, lt);
    k.rect(-8, -11, 17, 2, sh);
    if (V.fire) {
      shape(k, 0, -18, `-3 0, 4 0, ${5 + sw} 8, 2 6, ${1 + sw} 16, -2 7, ${-4 + sw} 9`, mDk);
      shape(k, 0, -18, `-1 1, 2 1, ${2 + sw} 7, ${sw} 10`, mLt);
      return;
    }
    k.poly(P(`-2 -18, 3 -18, ${3 + sw} -6, ${sw} -3, ${-2 + sw} -6`), mDk);
    k.line(0, -17, sw, -6, mLt);
  }
  const horse = (V = {}) => ({
    seat: 26,
    side: (k, M, o) => horseSide(k, M, o, V),
    front: (k, M, o, part) => horseFront(k, M, o, part, V),
    back: (k, M, o, part) => horseBack(k, M, o, part, V)
  });

  // ---------------------------------------------------------------- Quadrupèdes
  // q : { hgt (milieu du corps), len (demi-longueur), rump, belly, chest (rayons [x, y]), wide (demi-largeur de face),
  //   thick, foot, stride, head(k, M, o, x, y) tête de profil (x, y : haut du poitrail), face(k, M, y) et nape(k, M, y)
  //   de face et de dos, tail(k, M, o, x, y), tailBack, deco(k, M, cy) motifs du flanc, sides(k, M, cy, half) motifs de
  //   face et de dos, wings }
  function quad(q) {
    const cy = -q.hgt,
      seat = q.hgt + q.belly[1] + (q.seatUp ?? 2),
      feet = { thick: q.thick || 2, foot: q.foot || 'paw', stride: q.stride || 1 };
    const wingsOf = M => M.wing || M.coat;
    return {
      seat,
      side(k, M, o) {
        const [lt, base, sh] = M.coat,
          pose = o.frame < 0 ? STAND : GALLOP[o.frame],
          bob = bobOf(o.frame),
          far = tint(base, 0.76),
          flap = o.frame < 0 ? 0 : FLAPS[o.flap || 0],
          R = wingsOf(M),
          t = feet.thick;
        const attach = [
          [-q.len, cy + 3],
          [-q.len + 3, cy + 4],
          [q.len - 2, cy + 3],
          [q.len + 1, cy + 4]
        ];
        if (q.wings)
          wing(
            k,
            -1,
            -seat + 3 + bob,
            flap,
            R.map(c => tint(c, 0.8)),
            { bat: q.wings === 'bat', size: 0.9 }
          );
        q.tail?.(k, M, o, -q.len - q.rump[0] + 2, cy + bob);
        for (const i of [0, 2])
          leg(k, attach[i][0], attach[i][1] + bob, pose[i], far, tint(M.sock, 0.78), feet);
        ell(k, -q.len, cy + bob, q.rump[0], q.rump[1], base);
        ell(k, 0, cy + 1 + bob, q.len + 3, q.belly[1], base);
        ell(k, q.len, cy + bob, q.chest[0], q.chest[1], base);
        k.rect(-q.len - 2, cy + q.belly[1] - 1 + bob, q.len * 2 + 4, 2, q.under ? q.under(M) : sh);
        k.rect(-q.len + 1, cy - q.belly[1] + 1 + bob, q.len * 2 - 2, 2, lt);
        q.deco?.(k, M, cy + bob);
        q.head(k, M, o, q.len + 2, cy - 3 + bob);
        for (const i of [1, 3]) leg(k, attach[i][0], attach[i][1] + bob, pose[i], base, M.sock, feet);
        // Cuisse et épaule, par-dessus les pattes proches.
        ell(k, -q.len + 2, cy + 2 + bob, t + 1, t + 2, base);
        ell(k, q.len, cy + 2 + bob, t + 1, t + 2, base);
        if (o.saddle) saddleSide(k, M, -seat, bob, q.belly[1] + 5);
        q.near?.(k, M, cy + bob);
        if (q.wings) wing(k, -5, -seat + 5 + bob, flap, R, { bat: q.wings === 'bat' });
      },
      front(k, M, o, part) {
        const [, base, sh] = M.coat,
          step = Math.max(0, o.frame) % 2,
          half = q.wide,
          t = feet.thick + 1;
        if (part === 'under') {
          if (q.wings)
            for (const dir of [1, -1])
              wing(k, -4 * dir, -seat + 4, FLAPS[o.flap || 0], wingsOf(M), {
                dir,
                bat: q.wings === 'bat',
                size: 0.95
              });
          twin(k, half - 5, cy + 3, t - 1, q.hgt - 5, tint(base, 0.68));
          ell(k, 0, cy, half, q.belly[1] + 1, base);
          k.rect(-half + 2, cy + q.belly[1] - 1, half * 2 - 3, 2, sh);
          q.sides?.(k, M, cy, half);
          for (const [x, up] of [
            [-half + 2, step ? 2 : 0],
            [half - 1 - t, step ? 0 : 2]
          ]) {
            k.rect(x, cy + 3, t, q.hgt - 4 - up, base);
            k.rect(
              x - (feet.foot === 'hoof' ? 0 : 1),
              -3 - up,
              t + (feet.foot === 'hoof' ? 0 : 2),
              3,
              M.sock
            );
            if (feet.foot === 'hoof') k.rect(x, -1 - up, t, 1, HOOF);
          }
          if (o.saddle) saddleFront(k, M, -seat + 2, half + 1);
        } else {
          ell(k, 0, cy + 1, Math.round(half * 0.62), q.belly[1], base);
          q.face(k, M, cy + (q.faceDy ?? -3), o);
        }
      },
      back(k, M, o, part) {
        const [lt, base, sh] = M.coat,
          step = Math.max(0, o.frame) % 2,
          half = q.wide,
          t = feet.thick + 1;
        if (part === 'under') {
          if (q.wings)
            for (const dir of [1, -1])
              wing(k, -4 * dir, -seat + 4, FLAPS[o.flap || 0], wingsOf(M), {
                dir,
                bat: q.wings === 'bat',
                size: 0.95
              });
          q.nape(k, M, cy - q.belly[1] - 4, o);
          ell(k, 0, cy - 3, half - 1, q.belly[1] - 1, base);
          if (o.saddle) k.rect(-half + 1, -seat + 1, half * 2 - 1, 6, M.blanket);
          return;
        }
        for (const [x, up] of [
          [-half + 2, step ? 2 : 0],
          [half - 1 - t, step ? 0 : 2]
        ]) {
          k.rect(x, cy + 4, t, q.hgt - 5 - up, base);
          k.rect(x - (feet.foot === 'hoof' ? 0 : 1), -3 - up, t + (feet.foot === 'hoof' ? 0 : 2), 3, M.sock);
          if (feet.foot === 'hoof') k.rect(x, -1 - up, t, 1, HOOF);
        }
        ell(k, 0, cy + 2, half, q.belly[1], base);
        k.rect(-half + 3, cy - q.belly[1] + 3, half * 2 - 5, 2, lt);
        k.rect(-half + 2, cy + q.belly[1], half * 2 - 3, 2, sh);
        q.sides?.(k, M, cy + 2, half);
        q.tailBack?.(k, M, o, cy);
      }
    };
  }
  // Yeux : pupille et reflet (profil) ; deux yeux (face).
  const eyeSide = (k, x, y, col = '#1a1410') => {
    k.rect(x, y, 2, 2, col);
    k.px(x, y, '#ffffff');
  };
  const eyesFront = (k, x, y, col = '#1a1410') => {
    twin(k, x, y, 2, 2, col);
    twin(k, x + 1, y, 1, 1, '#ffffff');
  };
  // Queues communes.
  const TAILS = {
    short: (k, M, o, x, y) => shape(k, x, y, '2 -3, -2 -5, -4 -2, -2 1, 2 1', M.mane[0]),
    bushy(k, M, o, x, y) {
      const s = o.swish || 0;
      shape(k, x, y, `3 -4, -3 ${-7 + s}, -10 ${-6 + s}, -13 ${-1 + s}, -9 ${2 + s}, -3 2, 3 0`, M.coat[1]);
      shape(k, x, y, `-8 ${-5 + s}, -11 ${-5 + s}, -13 ${-1 + s}, -10 ${1 + s}, -8 ${-1 + s}`, M.mane[0]);
    },
    thin(k, M, o, x, y) {
      const s = o.swish || 0;
      k.line(x + 2, y - 2, x - 5, y + 2 + s, M.coat[1], 2);
      k.line(x - 5, y + 2 + s, x - 8, y - 4 + s, M.coat[1], 2);
      k.rect(x - 9, y - 7 + s, 3, 4, M.stripe || M.mane[1]);
    },
    curl(k, M, o, x, y) {
      k.line(x + 2, y - 2, x - 2, y - 4, M.coat[2]);
      k.line(x - 2, y - 4, x - 3, y - 1 + (o.swish || 0), M.coat[2]);
    }
  };
  const tailDown =
    (col, w = 3, len = 11) =>
    (k, M, o, cy) => {
      const s = o.swish || 0;
      k.poly(
        [
          [-1, cy - 3],
          [2, cy - 3],
          [w + s - 1, cy + len - 2],
          [s, cy + len],
          [-w + s + 1, cy + len - 2]
        ],
        col(M)
      );
    };

  // Canidés : loup et renard (ears : hauteur des oreilles, snout : longueur du museau).
  const canine = ({ ears, snout }) => ({
    head(k, M, o, x, y) {
      const [lt, base, sh] = M.coat;
      shape(k, x, y, '-8 -2, -3 -8, 4 -10, 7 -4, 4 5, -2 9, -7 6', base);
      shape(k, x, y, '-3 2, 3 -2, 5 1, 2 7, -2 9', M.mane[0]);
      shape(k, x, y, `2 -11, 3 ${-13 - ears}, 6 -11`, sh);
      ell(k, x + 6, y - 8, 5, 4, base);
      shape(k, x, y, `6 -11, 8 ${-13 - ears}, 10 -10`, base);
      shape(k, x, y, `7 -11, 8 ${-11 - ears}, 9 -10`, M.mane[1]);
      k.rect(x + 9, y - 8, snout, 4, lt);
      k.rect(x + 9, y - 5, snout - 1, 2, M.mane[0]);
      k.rect(x + 8 + snout, y - 8, 2, 2, '#1a1410');
      eyeSide(k, x + 7, y - 9, M.eye || '#2a1c10');
    },
    face(k, M, y) {
      const [lt, base, sh] = M.coat;
      twinPoly(k, [[-6, y - 2], [-5, y - 8 - ears], [-1, y - 5]], sh); // prettier-ignore
      ell(k, 0, y, 6, 5, base);
      twin(k, -6, y + 1, 4, 4, M.mane[0]);
      k.rect(-2, y + 1, 5, 5, lt);
      k.rect(-1, y + 4, 3, 2, M.mane[0]);
      k.rect(-1, y + 2, 3, 2, '#1a1410');
      eyesFront(k, -4, y - 1, M.eye || '#2a1c10');
      ell(k, 0, y + 8, 4, 2, M.mane[0]);
    },
    nape(k, M, y) {
      twinPoly(k, [[-6, y - 1], [-5, y - 7 - ears], [-1, y - 4]], M.coat[2]); // prettier-ignore
      ell(k, 0, y, 6, 5, M.coat[1]);
    }
  });
  const WOLF = canine({ ears: 1, snout: 5 }),
    FOX = canine({ ears: 3, snout: 5 });
  // Bois du cerf (profil, face).
  function antlerSide(k, x, y, col) {
    k.line(x, y, x - 2, y - 8, col, 2);
    k.line(x - 2, y - 8, x + 1, y - 14, col);
    k.line(x - 2, y - 7, x - 6, y - 12, col);
    k.line(x - 1, y - 4, x + 4, y - 9, col);
    k.line(x - 4, y - 10, x - 4, y - 14, col);
  }
  function antlersFront(k, y, col) {
    for (const d of [-1, 1]) {
      const at = x => (d < 0 ? x : 1 - x);
      k.line(at(-3), y, at(-8), y - 6, col);
      k.line(at(-8), y - 6, at(-11), y - 13, col);
      k.line(at(-8), y - 6, at(-6), y - 12, col);
      k.line(at(-5), y - 3, at(-11), y - 5, col);
      k.line(at(-10), y - 10, at(-14), y - 12, col);
    }
  }

  const SPECIES = Object.create(null);
  function define(id, sp) {
    if (!/^[a-z]+$/.test(id) || SPECIES[id]) throw new Error('Espèce de monture invalide : ' + id);
    SPECIES[id] = Object.freeze(sp);
  }
  define('horse', horse());
  define('nightmare', horse({ fire: true }));
  define(
    'stag',
    quad({
      hgt: 18,
      len: 9,
      rump: [6, 6],
      belly: [11, 6],
      chest: [5, 6],
      wide: 8,
      foot: 'hoof',
      faceDy: -3,
      tail: TAILS.short,
      tailBack: tailDown(M => M.mane[0], 2, 5),
      deco(k, M, cy) {
        for (const [x, y] of [
          [-11, -2],
          [-8, -4],
          [-9, 0],
          [-13, 1],
          [8, -3],
          [10, 0]
        ])
          // prettier-ignore
          k.rect(x, cy + y, 2, 1, M.mane[0]);
      },
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat,
          horn = '#e8d4a8';
        antlerSide(k, x + 4, y - 15, tint(horn, 0.75));
        shape(k, x, y, '-7 -1, -1 -9, 3 -15, 8 -13, 6 -5, 3 6, -3 8', base);
        shape(k, x, y, '0 -1, 5 -8, 6 -3, 3 6, -1 8', M.mane[1]);
        shape(k, x, y, '1 1, 4 -5, 5 -2, 2 5', M.mane[0]);
        shape(k, x, y, '3 -16, 8 -18, 11 -15, 16 -11, 15 -8, 9 -9, 5 -11', base);
        k.rect(x + 7, y - 17, 3, 1, lt);
        k.rect(x + 14, y - 11, 2, 3, HOOF);
        shape(k, x, y, '4 -16, -1 -18, 1 -14', sh);
        eyeSide(k, x + 8, y - 15);
        antlerSide(k, x + 7, y - 17, horn);
      },
      face(k, M, y) {
        const [lt, base, sh] = M.coat;
        antlersFront(k, y - 4, '#e8d4a8');
        twinPoly(k, [[-3, y - 3], [-9, y - 5], [-5, y]], sh); // prettier-ignore
        shape(k, 0, y, '-4 -5, 5 -5, 4 3, 2 7, -1 7, -3 3', base);
        k.rect(-1, y - 4, 3, 8, lt);
        k.rect(-1, y + 5, 3, 2, HOOF);
        eyesFront(k, -4, y - 1);
        shape(k, 0, y, '-4 8, 5 8, 3 14, -2 14', M.mane[0]);
      },
      nape(k, M, y) {
        antlersFront(k, y - 4, '#e8d4a8');
        twinPoly(k, [[-3, y - 3], [-9, y - 5], [-5, y]], M.coat[2]); // prettier-ignore
        k.rect(-3, y - 5, 7, 12, M.coat[1]);
      }
    })
  );
  const dog = { hgt: 14, len: 9, rump: [5, 5], belly: [11, 5], chest: [6, 7], wide: 8, thick: 2 };
  define(
    'wolf',
    quad({
      ...dog,
      ...WOLF,
      thick: 3,
      faceDy: -5,
      tail: TAILS.bushy,
      tailBack: tailDown(M => M.mane[1], 4, 11),
      under: M => M.mane[0]
    })
  );
  define(
    'fox',
    quad({
      ...dog,
      ...FOX,
      faceDy: -5,
      under: M => M.mane[0],
      // Trois queues d'aurore qui ondulent.
      tail(k, M, o, x, y) {
        const s = o.swish || 0;
        for (const [i, col] of [M.coat[2], M.mane[1], M.coat[1]].entries()) {
          const up = [-17, -10, -3][i] + (i % 2 ? -s : s);
          shape(
            k,
            x,
            y,
            `4 -3, -3 ${up - 1}, -11 ${up - 5}, -17 ${up - 1}, -12 ${up + 5}, -4 ${up + 8}, 4 1`,
            col
          );
          shape(k, x, y, `-11 ${up - 4}, -17 ${up - 1}, -12 ${up + 4}, -9 ${up}`, M.mane[0]);
        }
      },
      tailBack(k, M, o, cy) {
        const s = o.swish || 0;
        for (const [dx, col] of [
          [-9, M.coat[2]],
          [9, M.mane[1]],
          [0, M.coat[1]]
        ]) {
          // prettier-ignore
          shape(k, 0, cy, `-2 0, 3 0, ${dx + 5 + s} -9, ${dx + 2 + s} -17, ${dx - 4 + s} -10`, col);
          shape(k, 0, cy, `${dx + 4 + s} -11, ${dx + 2 + s} -17, ${dx - 2 + s} -12`, M.mane[0]);
        }
      }
    })
  );
  define(
    'boar',
    quad({
      hgt: 13,
      len: 8,
      rump: [6, 6],
      belly: [10, 6],
      chest: [7, 7],
      wide: 9,
      foot: 'hoof',
      stride: 0.7,
      faceDy: 0,
      tail: TAILS.curl,
      tailBack: tailDown(M => M.coat[2], 1, 4),
      deco(k, M, cy) {
        for (let x = -11; x < 12; x += 2) k.rect(x, cy - 7 - (x % 4 ? 1 : 0), 2, 4, M.mane[x % 4 ? 0 : 1]);
      },
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat;
        ell(k, x + 4, y + 3, 6, 6, base);
        shape(k, x, y, '1 -3, 0 -8, 5 -5', sh);
        shape(k, x, y, '7 -1, 14 3, 14 7, 7 9', base);
        k.rect(x + 7, y - 1, 3, 1, lt);
        k.rect(x + 13, y + 2, 3, 5, '#d89a8a');
        k.rect(x + 14, y + 4, 1, 1, HOOF);
        k.line(x + 10, y + 8, x + 13, y + 1, '#fff6dc', 2);
        eyeSide(k, x + 6, y);
        for (let i = 0; i < 4; i++) k.rect(x - 3 + i * 2, y - 6 + (i % 2), 2, 3, M.mane[i % 2]);
      },
      face(k, M, y) {
        const [, base, sh] = M.coat;
        twinPoly(k, [[-7, y - 2], [-7, y - 8], [-3, y - 5]], sh); // prettier-ignore
        ell(k, 0, y, 7, 6, base);
        for (let x = -3; x < 4; x += 2) k.rect(x, y - 9, 2, 4, M.mane[x % 4 ? 0 : 1]);
        k.rect(-3, y + 1, 7, 5, '#d89a8a');
        twin(k, -2, y + 3, 1, 2, HOOF);
        twin(k, -6, y, 2, 6, '#fff6dc');
        eyesFront(k, -5, y - 3);
      },
      nape(k, M, y) {
        twinPoly(k, [[-7, y], [-7, y - 6], [-3, y - 3]], M.coat[2]); // prettier-ignore
        ell(k, 0, y + 3, 7, 5, M.coat[1]);
        for (let x = -3; x < 4; x += 2) k.rect(x, y - 4, 2, 4, M.mane[x % 4 ? 0 : 1]);
      }
    })
  );
  define(
    'bear',
    quad({
      hgt: 14,
      len: 9,
      rump: [8, 8],
      belly: [12, 7],
      chest: [7, 8],
      wide: 11,
      thick: 4,
      stride: 0.7,
      faceDy: -3,
      tail: (k, M, o, x, y) => ell(k, x + 1, y - 2, 2, 2, M.coat[0]),
      tailBack: (k, M, o, cy) => ell(k, 0, cy - 1, 2, 2, M.coat[0]),
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat;
        ell(k, x + 1, y + 1, 7, 7, base);
        ell(k, x + 1, y - 10, 2, 3, sh);
        ell(k, x + 6, y - 3, 7, 7, base);
        ell(k, x + 5, y - 11, 3, 3, base);
        ell(k, x + 5, y - 11, 1, 1, M.mane[0]);
        ell(k, x + 13, y, 4, 3, M.mane[0]);
        k.rect(x + 10, y + 2, 6, 1, M.mane[1]);
        k.rect(x + 15, y - 2, 3, 2, HOOF);
        k.rect(x + 5, y - 8, 4, 1, lt);
        k.rect(x + 1, y - 2, 1, 4, sh);
        eyeSide(k, x + 9, y - 5);
      },
      face(k, M, y) {
        const [, base, sh] = M.coat;
        twinPoly(k, [[-8, y - 3], [-8, y - 8], [-4, y - 8], [-3, y - 4]], sh); // prettier-ignore
        ell(k, 0, y, 8, 7, base);
        ell(k, 0, y + 3, 4, 3, M.mane[0]);
        k.rect(-1, y, 3, 2, HOOF);
        k.rect(0, y + 2, 1, 3, M.mane[1]);
        eyesFront(k, -5, y - 2);
      },
      nape(k, M, y) {
        twinPoly(k, [[-8, y - 2], [-8, y - 6], [-4, y - 6], [-3, y - 2]], M.coat[2]); // prettier-ignore
        ell(k, 0, y + 1, 8, 6, M.coat[1]);
      }
    })
  );
  define(
    'camel',
    quad({
      hgt: 19,
      len: 9,
      rump: [6, 6],
      belly: [11, 6],
      chest: [6, 6],
      wide: 8,
      foot: 'paw',
      faceDy: -5,
      tail: TAILS.thin,
      tailBack: tailDown(M => M.mane[1], 2, 9),
      // Deux bosses, devant et derrière la selle.
      deco(k, M, cy) {
        for (const x of [-10, 9]) {
          shape(k, x, cy, '-5 -3, -3 -11, 0 -13, 3 -11, 5 -3', M.coat[1]);
          shape(k, x, cy, '-3 -9, 0 -13, 3 -11, 1 -8', M.mane[0]);
        }
      },
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat;
        shape(k, x, y, '-4 2, 1 -1, 5 3, 8 -2, 8 -14, 12 -14, 12 -2, 9 6, 3 9, -3 8', base);
        shape(k, x, y, '4 5, 8 2, 11 -4, 11 0, 8 7, 4 9', M.mane[0]);
        shape(k, x, y, '7 -18, 13 -19, 19 -15, 19 -11, 13 -11, 8 -13', base);
        k.rect(x + 9, y - 19, 4, 2, M.mane[0]);
        k.rect(x + 10, y - 18, 4, 1, lt);
        shape(k, x, y, '7 -17, 5 -20, 9 -18', sh);
        k.rect(x + 18, y - 13, 1, 1, HOOF);
        k.rect(x + 15, y - 11, 4, 1, M.coat[3]);
        eyeSide(k, x + 12, y - 16);
      },
      face(k, M, y) {
        const [lt, base, sh] = M.coat;
        twinPoly(k, [[-4, y - 4], [-8, y - 6], [-5, y - 1]], sh); // prettier-ignore
        k.rect(-2, y + 2, 5, 13, base);
        shape(k, 0, y, '-4 -5, 5 -5, 4 2, 4 6, -3 6, -3 2', base);
        k.rect(-3, y - 8, 7, 4, M.mane[0]);
        k.rect(-1, y - 3, 3, 5, lt);
        twin(k, -2, y + 3, 1, 1, HOOF);
        k.rect(-2, y + 5, 5, 1, M.coat[3]);
        eyesFront(k, -4, y - 2);
      },
      nape(k, M, y) {
        k.rect(-2, y - 8, 5, 14, M.coat[1]);
        k.rect(-3, y - 10, 7, 4, M.mane[0]);
        shape(k, 0, y, '-5 4, -2 -3, 3 -3, 6 4', M.mane[1]);
      }
    })
  );
  // Félins : tigre (et, pour une extension, tout félin à crinière).
  const feline = ({ maned = false } = {}) => ({
    head(k, M, o, x, y) {
      const [lt, base, sh] = M.coat,
        muzzle = maned ? lt : M.mane[0];
      if (maned) {
        ell(k, x, y - 3, 10, 10, M.mane[1]);
        ell(k, x + 1, y - 4, 8, 8, M.mane[0]);
        for (let i = 0; i < 7; i++) {
          const a = 1.2 + i * 0.6;
          k.line(
            x + Math.cos(a) * 5,
            y - 3 + Math.sin(a) * 5,
            x + Math.cos(a) * 9,
            y - 3 + Math.sin(a) * 9,
            M.mane[1]
          );
        }
      } else {
        shape(k, x, y, '-6 -2, 1 -8, 6 -5, 4 4, -2 7', base);
        shape(k, x, y, '-1 2, 4 -1, 4 3, 0 7', M.mane[0]);
      }
      ell(k, x + 3, y - 11, 2, 2, sh);
      ell(k, x + 7, y - 6, 6, 5, base);
      ell(k, x + 7, y - 11, 2, 2, base);
      k.px(x + 7, y - 11, muzzle);
      k.rect(x + 10, y - 6, 5, 4, muzzle);
      k.rect(x + 13, y - 6, 2, 1, '#c85a5a');
      k.rect(x + 11, y - 2, 4, 1, M.mane[1]);
      k.rect(x + 6, y - 10, 4, 1, lt);
      eyeSide(k, x + 9, y - 8, M.eye || '#2a6a2a');
      if (M.stripe)
        for (const [a, b, h] of [
          [3, -8, 4],
          [5, -11, 3],
          [1, -5, 5],
          [8, -3, 2]
        ])
          // prettier-ignore
          k.rect(x + a, y + b, 1, h, M.stripe);
    },
    face(k, M, y) {
      const [lt, base, sh] = M.coat,
        muzzle = maned ? lt : M.mane[0];
      if (maned) {
        ell(k, 0, y, 10, 9, M.mane[1]);
        ell(k, 0, y, 8, 8, M.mane[0]);
      }
      twinPoly(k, [[-7, y - 4], [-6, y - 8], [-2, y - 6]], sh); // prettier-ignore
      ell(k, 0, y, 7, 6, base);
      k.rect(-1, y - 5, 3, 2, lt);
      ell(k, 0, y + 3, 4, 2, muzzle);
      k.rect(-1, y + 1, 3, 2, '#c85a5a');
      eyesFront(k, -5, y - 2, M.eye || '#2a6a2a');
      if (M.stripe) {
        twin(k, -2, y - 6, 1, 3, M.stripe);
        twin(k, -7, y, 3, 1, M.stripe);
        twin(k, -6, y + 2, 2, 1, M.stripe);
        k.rect(0, y - 6, 1, 4, M.stripe);
      }
    },
    nape(k, M, y) {
      if (maned) ell(k, 0, y + 1, 10, 9, M.mane[1]);
      twinPoly(k, [[-7, y - 2], [-6, y - 7], [-2, y - 4]], M.coat[2]); // prettier-ignore
      ell(k, 0, y, maned ? 8 : 7, maned ? 7 : 6, maned ? M.mane[0] : M.coat[1]);
      if (M.stripe) for (const x of [-4, 0, 4]) k.rect(x, y - 5, 1, 5, M.stripe);
    }
  });
  const CAT = {
    hgt: 14,
    len: 10,
    rump: [6, 6],
    belly: [12, 5],
    chest: [6, 6],
    wide: 8,
    thick: 3,
    faceDy: -3
  };
  define(
    'tiger',
    quad({
      ...CAT,
      ...feline(),
      tail: TAILS.thin,
      tailBack: tailDown(M => M.coat[1], 2, 12),
      under: M => M.mane[0],
      deco(k, M, cy) {
        for (const [x, y, h] of [
          [-14, -3, 6],
          [-11, -5, 5],
          [-11, 2, 3],
          [-8, -5, 7],
          [8, -5, 6],
          [11, -4, 5],
          [-5, 2, 4],
          [6, 2, 4]
        ])
          // prettier-ignore
          k.line(x, cy + y, x + 1, cy + y + h, M.stripe);
      },
      sides(k, M, cy, half) {
        for (const y of [-3, 0, 3]) twin(k, -half + 1, cy + y, 3, 1, M.stripe);
      }
    })
  );
  define(
    'lizard',
    quad({
      hgt: 12,
      len: 9,
      rump: [5, 5],
      belly: [11, 5],
      chest: [6, 5],
      wide: 8,
      thick: 3,
      foot: 'claw',
      faceDy: -4,
      under: M => M.sock,
      tail(k, M, o, x, y) {
        const s = o.swish || 0;
        shape(k, x, y, `4 -4, -4 -3, -10 ${3 + s}, -15 ${4 + s}, -10 ${7 + s}, -3 4, 4 4`, M.coat[1]);
        for (let i = 0; i < 4; i++) k.rect(x - 9 + i * 4, y - 3 + (3 - i), 2, 5, M.coat[2]);
      },
      tailBack(k, M, o, cy) {
        const s = o.swish || 0;
        k.poly([[-3, cy], [4, cy], [4 + s, cy + 7], [1 + s * 2, cy + 12], [-1 + s, cy + 7]], M.coat[2]); // prettier-ignore
      },
      deco(k, M, cy) {
        for (let x = -12; x < 13; x += 4) {
          shape(k, x, cy - 5, '0 1, 1 -4, 4 1', M.mane[0]);
          k.rect(x + 1, cy - 1, 2, 3, M.coat[2]);
        }
      },
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat;
        shape(k, x, y, '-6 -1, 0 -6, 5 -7, 6 0, 2 6, -4 7', base);
        shape(k, x, y, '1 -9, 8 -10, 16 -5, 16 -2, 8 -1, 3 -2', base);
        k.rect(x + 8, y - 3, 8, 2, M.sock);
        k.rect(x + 5, y - 9, 6, 1, lt);
        k.rect(x + 15, y - 5, 1, 1, HOOF);
        for (const [a, b] of [[-4, -3], [-1, -7], [2, -10]]) shape(k, x + a, y + b, '0 2, 1 -5, 5 1', M.mane[0]); // prettier-ignore
        eyeSide(k, x + 8, y - 8, '#a8442a');
        shape(k, x, y, '-2 3, 3 1, 5 3, 1 7', M.mane[1]);
        k.rect(x + 1, y - 2, 2, 1, sh);
      },
      face(k, M, y) {
        const [lt, base] = M.coat;
        for (const x of [-4, 0, 4]) k.poly([[x - 1, y - 4], [x + 0.5, y - 10], [x + 2, y - 4]], M.mane[0]); // prettier-ignore
        twinPoly(k, [[-5, y + 2], [-9, y + 1], [-7, y + 7], [-4, y + 6]], M.mane[1]); // prettier-ignore
        shape(k, 0, y, '-6 -4, 7 -4, 6 3, 3 7, -2 7, -5 3', base);
        k.rect(-2, y - 4, 5, 2, lt);
        k.rect(-3, y + 4, 7, 2, M.sock);
        twin(k, -2, y + 3, 1, 1, HOOF);
        eyesFront(k, -6, y - 2, '#a8442a');
      },
      nape(k, M, y) {
        ell(k, 0, y + 1, 6, 5, M.coat[1]);
        for (const x of [-4, 0, 4]) k.poly([[x - 1, y - 2], [x + 0.5, y - 9], [x + 2, y - 2]], M.mane[0]); // prettier-ignore
      }
    })
  );
  define(
    'dragon',
    quad({
      hgt: 16,
      len: 10,
      rump: [7, 7],
      belly: [12, 6],
      chest: [7, 8],
      wide: 9,
      thick: 3,
      foot: 'claw',
      wings: 'bat',
      faceDy: -1,
      under: M => M.mane[0],
      tail(k, M, o, x, y) {
        const s = o.swish || 0;
        shape(
          k,
          x,
          y,
          `5 -5, -3 -3, -8 ${4 + s}, -12 ${2 + s}, -13 ${-3 + s}, -14 ${5 + s}, -8 ${9 + s}, 0 5, 5 4`,
          M.coat[1]
        );
        shape(k, x - 13, y + s, '-2 -2, 1 -9, 4 -2, 1 0', M.mane[1]);
        for (let i = 0; i < 3; i++) shape(k, x - 5 + i * 4, y - 3 + (i ? 0 : 3), '0 1, 1 -3, 3 1', M.mane[1]);
      },
      tailBack(k, M, o, cy) {
        const s = o.swish || 0;
        k.poly([[-4, cy - 1], [5, cy - 1], [4 + s, cy + 8], [1 + s * 2, cy + 15], [-2 + s, cy + 8]], M.coat[2]); // prettier-ignore
        for (let i = 0; i < 3; i++) k.rect(s * (i > 1 ? 1 : 0), cy + i * 4, 2, 2, M.mane[1]);
      },
      head(k, M, o, x, y) {
        const [lt, base, sh] = M.coat;
        shape(k, x, y, '-7 0, -1 -7, 3 -15, 9 -15, 9 -8, 6 2, 1 9, -5 8', base);
        shape(k, x, y, '2 0, 7 -9, 9 -8, 7 1, 2 9, -1 9', M.mane[0]);
        for (let i = 0; i < 4; i++) k.rect(x + 3 + (i > 1 ? 1 : 0), y + 4 - i * 3, 4, 1, M.mane[1]);
        for (const [a, b] of [[-5, -4], [-1, -9], [1, -14]]) shape(k, x + a, y + b, '0 2, -2 -3, 4 -1', M.mane[1]); // prettier-ignore
        k.line(x + 5, y - 18, x - 3, y - 22, M.sock, 2);
        shape(k, x, y, '3 -18, 9 -21, 19 -16, 20 -12, 13 -10, 6 -11', base);
        k.rect(x + 8, y - 20, 4, 1, lt);
        k.rect(x + 11, y - 12, 8, 1, M.coat[3]);
        k.rect(x + 18, y - 15, 1, 1, HOOF);
        for (const a of [13, 16]) k.px(x + a, y - 11, '#ffffff');
        k.line(x + 8, y - 20, x, y - 25, M.sock, 2);
        eyeSide(k, x + 10, y - 17, '#ffd040');
        k.px(x + 11, y - 17, HOOF);
        k.rect(x + 2, y - 3, 1, 2, sh);
      },
      face(k, M, y) {
        const [lt, base, sh] = M.coat;
        for (const d of [-1, 1]) {
          const at = v => (d < 0 ? v : 1 - v);
          k.line(at(-4), y - 5, at(-7), y - 13, M.sock, 2);
        }
        k.rect(-3, y + 4, 7, 10, M.mane[0]);
        for (let i = 0; i < 3; i++) k.rect(-3, y + 6 + i * 3, 7, 1, M.mane[1]);
        shape(k, 0, y, '-6 -5, 7 -5, 6 1, 4 7, -3 7, -5 1', base);
        k.rect(-1, y - 5, 3, 6, lt);
        twin(k, -2, y + 4, 1, 2, HOOF);
        k.rect(-3, y + 6, 7, 1, sh);
        eyesFront(k, -5, y - 2, '#ffd040');
        twinPoly(k, [[-6, y - 1], [-10, y - 2], [-6, y + 3]], M.mane[1]); // prettier-ignore
      },
      nape(k, M, y) {
        for (const d of [-1, 1]) {
          const at = v => (d < 0 ? v : 1 - v);
          k.line(at(-4), y - 5, at(-7), y - 13, M.sock, 2);
        }
        ell(k, 0, y, 6, 6, M.coat[1]);
        for (let i = 0; i < 3; i++) shape(k, 0, y - 4 + i * 4, '-1 2, 0.5 -3, 2 2', M.mane[1]);
      }
    })
  );

  // ---------------------------------------------------------------- Oiseaux coureurs
  // b : { crest(k, M, x, y, view) huppe ou casque, beak : couleur du bec, tail : 'plume' | 'fan' | 'hook', neck :
  // longueur du cou, wings : grandes ailes déployées }
  function bird(b) {
    const neck = b.neck || 12,
      cy = -19,
      seat = 27;
    const RUN = [
      [[-5, 0], [6, 4]], // prettier-ignore
      [[0, 0], [2, 7]], // prettier-ignore
      [[6, 4], [-5, 0]], // prettier-ignore
      [[2, 7], [0, 0]] // prettier-ignore
    ];
    function foot(k, ax, ay, [dx, lift], col) {
      const hx = ax + dx,
        hy = -lift;
      k.line(ax, ay, ax - 2 + Math.round(dx / 2), ay + Math.round((hy - ay) * 0.5), col, 3);
      k.line(ax - 2 + Math.round(dx / 2), ay + Math.round((hy - ay) * 0.5), hx, hy - 1, col, 2);
      k.rect(hx - 2, hy, 8, 1, col);
      k.rect(hx - 2, hy - 1, 5, 1, col);
      k.px(hx + 5, hy, HOOF);
    }
    return {
      seat,
      side(k, M, o) {
        const [lt, base, sh, deep] = M.coat,
          bob = bobOf(o.frame),
          y = cy + bob,
          s = o.swish || 0,
          run = o.frame < 0 ? [[-1, 0], [2, 0]] : RUN[o.frame], // prettier-ignore
          flap = o.frame < 0 ? 0 : FLAPS[o.flap || 0],
          R = M.wing || M.coat;
        if (b.wings)
          wing(
            k,
            0,
            y - 4,
            flap,
            R.map(c => tint(c, 0.8)),
            { size: 0.9 }
          );
        // Queue.
        if (b.tail === 'hook')
          for (let i = 0; i < 4; i++)
            shape(
              k,
              -11,
              y,
              `3 -2, -2 ${-12 + i * 3 + s}, -9 ${-12 + i * 4 + s}, -11 ${-5 + i * 4}, -6 ${-7 + i * 3 + s}, 2 3`,
              M.mane[i % 2]
            );
        else {
          shape(k, -11, y, `3 -4, -9 ${-7 + s}, -14 ${-2 + s}, -9 ${2 + s}, -11 ${6 + s}, 3 4`, deep);
          shape(k, -11, y, `3 -3, -8 ${-5 + s}, -10 ${-1 + s}, 3 2`, sh);
        }
        foot(k, -2, y + 6, run[0], tint(M.sock, 0.75));
        ell(k, -2, y, 12, 8, base);
        ell(k, 6, y - 1, 6, 6, base);
        k.rect(-9, y + 5, 14, 2, sh);
        // Cou et tête.
        shape(k, 8, y, `-5 2, 0 ${-neck}, 5 ${-neck}, 5 -2, 1 5`, b.baldNeck ? M.mane[0] : base);
        if (b.baldNeck) shape(k, 8, y, `3 -8, 5 ${-neck}, 5 -2, 2 4`, M.mane[1]);
        ell(k, 12, y - neck - 2, 5, 4, b.headCol ? b.headCol(M) : base);
        shape(
          k,
          15,
          y - neck - 2,
          `0 -2, ${b.hooked ? '6 -1, 7 4, 5 4, 4 2' : '8 1, 7 2'}, 0 3`,
          M.beak || '#f0b040'
        );
        b.crest?.(k, M, 12, y - neck - 5, 'side', s);
        eyeSide(k, 13, y - neck - 4, M.eye || '#1a1410');
        // Aile repliée sur le flanc.
        if (!b.wings) {
          shape(k, -2, y, '7 -4, 8 1, 2 5, -8 6, -14 3, -8 0, -4 -4', sh);
          shape(k, -2, y, '6 -4, 6 0, -2 2, -8 1, -4 -4', lt);
          for (let i = 0; i < 3; i++) k.line(-10 + i * 3, y + 4, -6 + i * 3, y + 1, deep);
        }
        foot(k, 2, y + 6, run[1], M.sock);
        ell(k, 2, y + 5, 4, 4, sh);
        if (o.saddle) saddleSide(k, M, -seat, bob, 12);
        if (b.wings) wing(k, -5, y - 3, flap, R);
      },
      front(k, M, o, part) {
        const [lt, base, sh] = M.coat,
          step = Math.max(0, o.frame) % 2;
        if (part === 'under') {
          if (b.wings)
            for (const dir of [1, -1])
              wing(k, -5 * dir, cy - 4, FLAPS[o.flap || 0], M.wing || M.coat, { dir, size: 0.95 });
          if (b.tail === 'hook') twinPoly(k, [[0, cy - 2], [-9, cy - 14], [-12, cy - 6], [-4, cy]], M.mane[1]); // prettier-ignore
          for (const [x, up] of [
            [-5, step ? 3 : 0],
            [4, step ? 0 : 3]
          ]) {
            // prettier-ignore
            k.rect(x, cy + 6, 2, 12 - up, M.sock);
            k.rect(x - 2, -2 - up, 6, 2, M.sock);
          }
          ell(k, 0, cy, 10, 9, base);
          ell(k, 0, cy + 3, 6, 5, lt);
          twin(k, -11, cy - 3, 3, 9, sh);
          if (o.saddle) saddleFront(k, M, -seat + 3, 11);
        } else {
          const y = cy - Math.round(neck * 0.6);
          k.rect(-2, y, 5, 11, b.baldNeck ? M.mane[0] : base);
          ell(k, 0, y, 5, 4, b.headCol ? b.headCol(M) : base);
          k.poly([[-2, y], [3, y], [1, y + (b.hooked ? 6 : 5)]], M.beak || '#f0b040'); // prettier-ignore
          b.crest?.(k, M, 0, y - 3, 'front', 0);
          eyesFront(k, -4, y - 2, M.eye || '#1a1410');
        }
      },
      back(k, M, o, part) {
        const [, base, sh, deep] = M.coat,
          step = Math.max(0, o.frame) % 2,
          s = o.swish || 0;
        if (part === 'under') {
          if (b.wings)
            for (const dir of [1, -1])
              wing(k, -5 * dir, cy - 4, FLAPS[o.flap || 0], M.wing || M.coat, { dir, size: 0.95 });
          const y = cy - neck;
          k.rect(-2, y, 5, neck, b.baldNeck ? M.mane[0] : base);
          ell(k, 0, y, 5, 4, b.headCol ? b.headCol(M) : base);
          b.crest?.(k, M, 0, y - 3, 'front', 0);
          ell(k, 0, cy - 2, 9, 6, base);
          if (o.saddle) k.rect(-8, -seat + 2, 17, 6, M.blanket);
          return;
        }
        for (const [x, up] of [
          [-5, step ? 3 : 0],
          [4, step ? 0 : 3]
        ]) {
          // prettier-ignore
          k.rect(x, cy + 6, 2, 12 - up, M.sock);
          k.rect(x - 2, -2 - up, 6, 2, M.sock);
        }
        ell(k, 0, cy + 2, 10, 7, base);
        if (b.tail === 'hook')
          for (const dx of [-7, 0, 7])
            shape(
              k,
              0,
              cy,
              `-2 3, 3 3, ${dx + 4 + s} -8, ${dx + s} -13, ${dx - 4 + s} -7`,
              M.mane[dx ? 1 : 0]
            );
        else {
          shape(k, 0, cy, `-4 1, 5 1, ${7 + s} 11, ${s} 13, ${-6 + s} 11`, deep);
          shape(k, 0, cy, `-2 1, 3 1, ${3 + s} 9, ${-2 + s} 9`, sh);
        }
      }
    };
  }
  define(
    'bird',
    bird({
      neck: 14,
      baldNeck: true,
      headCol: M => M.mane[0],
      // Casque d'os.
      crest(k, M, x, y, view) {
        if (view === 'side') shape(k, x, y, '-4 2, -3 -6, 1 -6, 4 1', M.crest);
        else k.poly([[-3, y + 1], [-1, y - 6], [2, y - 6], [4, y + 1]], M.crest); // prettier-ignore
      }
    })
  );

  // ---------------------------------------------------------------- Tortue
  function shell(k, M, cx, cy, rx, ry) {
    const [sLt, sDk] = M.mane;
    // Dôme : demi-ellipse, écailles et jardin de mousse.
    for (let y = -ry; y <= 0; y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.rect(cx - hw, cy + y, hw * 2 + 1, 1, y < -ry * 0.55 ? sLt : sDk);
    }
    for (let i = -2; i <= 2; i++) {
      const x = cx + Math.round(i * rx * 0.4);
      k.line(x, cy, Math.round(cx + i * rx * 0.2), cy - ry + 2, tint(sDk, 0.7));
    }
    k.rect(cx - Math.round(rx * 0.85), cy - Math.round(ry * 0.45), Math.round(rx * 1.7), 1, tint(sDk, 0.7));
    k.rect(cx - rx - 1, cy, rx * 2 + 3, 2, tint(sLt, 0.9));
    for (let i = 0; i < 16; i++) {
      const a = hash(i, 5) * Math.PI,
        r = 0.5 + hash(i, 9) * 0.45;
      k.rect(
        Math.round(cx - Math.cos(a) * rx * r),
        Math.round(cy - Math.sin(a) * ry * r),
        3,
        2,
        i % 3 ? M.sock : tint(M.sock, 0.75)
      );
    }
    // Champignon et fleur.
    k.rect(cx - Math.round(rx * 0.75), cy - Math.round(ry * 0.9), 2, 4, '#f4ead0');
    k.rect(cx - Math.round(rx * 0.75) - 2, cy - Math.round(ry * 0.9) - 2, 6, 2, '#d8402e');
    k.px(cx - Math.round(rx * 0.75), cy - Math.round(ry * 0.9) - 2, '#ffffff');
    k.rect(cx + Math.round(rx * 0.7), cy - Math.round(ry * 0.8) - 2, 2, 2, '#ffd36b');
    k.rect(cx + Math.round(rx * 0.7) - 1, cy - Math.round(ry * 0.8) - 1, 4, 1, '#f4a0c8');
  }
  define('turtle', {
    seat: 23,
    side(k, M, o) {
      const [lt, base, sh] = M.coat,
        bob = bobOf(o.frame),
        pose = o.frame < 0 ? STAND : GALLOP[o.frame],
        put = (x, i, col) => {
          const [dx, up] = pose[i];
          k.rect(x + Math.round(dx * 0.6), -9 - Math.round(up * 0.6), 6, 10, col);
          k.rect(x + Math.round(dx * 0.6), -1 - Math.round(up * 0.6), 7, 1, HOOF);
        };
      shape(k, -17, -7 + bob, '4 -3, -5 2, 4 3', base);
      put(-12, 0, tint(base, 0.75));
      put(6, 2, tint(base, 0.75));
      // Cou et tête.
      shape(k, 12, -8 + bob, '-2 -4, 5 -9, 9 -7, 6 3, -2 5', base);
      ell(k, 21, -17 + bob, 5, 4, base);
      k.rect(18, -20 + bob, 5, 1, lt);
      k.rect(23, -15 + bob, 4, 2, sh);
      eyeSide(k, 22, -18 + bob);
      ell(k, 0, -7 + bob, 14, 3, M.mane[0]);
      shell(k, M, 0, -8 + bob, 17, 13);
      put(-13, 1, base);
      put(8, 3, base);
      if (o.saddle) saddleSide(k, M, -23, bob, 6);
    },
    front(k, M, o, part) {
      const [lt, base, sh] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        for (const [x, up] of [[-14, step ? 2 : 0], [9, step ? 0 : 2]]) k.rect(x, -9 - up, 6, 9, base); // prettier-ignore
        ell(k, 0, -7, 13, 4, M.mane[0]);
        shell(k, M, 0, -8, 15, 13);
        if (o.saddle) saddleFront(k, M, -21, 9);
      } else {
        ell(k, 0, -8, 5, 5, sh);
        ell(k, 0, -11, 6, 5, base);
        k.rect(-2, -15, 5, 1, lt);
        k.rect(-3, -8, 7, 1, sh);
        eyesFront(k, -5, -13);
      }
    },
    back(k, M, o, part) {
      const [, base] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        ell(k, 0, -21, 5, 4, base);
        ell(k, 0, -14, 13, 7, M.mane[1]);
        if (o.saddle) k.rect(-8, -22, 17, 6, M.blanket);
        return;
      }
      for (const [x, up] of [[-14, step ? 2 : 0], [9, step ? 0 : 2]]) k.rect(x, -9 - up, 6, 9, base); // prettier-ignore
      k.poly([[-2, -8], [3, -8], [1, -1]], base); // prettier-ignore
      shell(k, M, 0, -7, 15, 9);
    }
  });

  // ---------------------------------------------------------------- Rainette
  define('frog', {
    seat: 21,
    bounce: [0, -9, -12, -5],
    side(k, M, o) {
      const [lt, base, sh] = M.coat,
        air = o.frame === 1 || o.frame === 2;
      // Patte arrière : pliée au sol, tendue en l'air.
      const hind = (dx, col) => {
        if (air) {
          k.line(-8 + dx, -8, -17 + dx, -3, col, 4);
          k.line(-17 + dx, -3, -23 + dx, 0, col, 2);
          k.rect(-27 + dx, 0, 6, 2, M.sock);
        } else {
          ell(k, -9 + dx, -7, 7, 5, col);
          k.rect(-15 + dx, -2, 13, 2, col);
          k.rect(-5 + dx, -1, 7, 2, M.sock);
        }
      };
      hind(2, tint(base, 0.72));
      k.rect(12, -9, 3, air ? 6 : 8, tint(base, 0.72));
      ell(k, 0, -10, 15, 9, base);
      ell(k, 9, -13, 10, 8, base);
      ell(k, 8, -6, 10, 4, M.mane[0]);
      k.rect(8, -8, 11, 1, sh);
      for (const [x, y] of [[-9, -15], [-4, -18], [-12, -11], [3, -19]]) ell(k, x, y, 2, 1, sh); // prettier-ignore
      // Œil globuleux.
      ell(k, 15, -20, 4, 4, base);
      ell(k, 16, -20, 3, 3, '#ffe060');
      k.rect(16, -21, 2, 3, '#1a1410');
      k.px(18, -14, HOOF);
      k.rect(4, -20, 6, 1, lt);
      hind(0, base);
      if (!air) ell(k, -9, -8, 5, 3, lt);
      k.rect(9, -8, 4, air ? 5 : 7, base);
      k.rect(8, air ? -4 : -1, 8, 2, M.sock);
      if (o.saddle) saddleSide(k, M, -21, 0, 8);
    },
    front(k, M, o, part) {
      const [lt, base, sh] = M.coat,
        air = o.frame === 1 || o.frame === 2;
      if (part === 'under') {
        twinPoly(k, [[-8, -12], [-17, -9], [-17, -2], [-9, -2]], sh); // prettier-ignore
        twin(k, -18, -2, 8, 2, M.sock);
        ell(k, 0, -10, 13, 9, base);
        if (o.saddle) saddleFront(k, M, -20, 10);
      } else {
        ell(k, 0, -9, 11, 7, base);
        ell(k, 0, -5, 9, 4, M.mane[0]);
        k.rect(-9, -8, 19, 1, sh);
        twin(k, -2, -11, 1, 1, HOOF);
        k.rect(-3, -15, 7, 1, lt);
        for (const x of [-8, 8]) {
          ell(k, x, -16, 4, 4, base);
          ell(k, x, -16, 3, 3, '#ffe060');
          k.rect(x - 1, -17, 2, 3, '#1a1410');
        }
        twin(k, -9, -4, 3, air ? 2 : 4, base);
        twin(k, -11, air ? -2 : 0, 6, 1, M.sock);
      }
    },
    back(k, M, o, part) {
      const [lt, base, sh] = M.coat;
      if (part === 'under') {
        for (const x of [-8, 8]) ell(k, x, -21, 4, 4, base);
        ell(k, 0, -15, 11, 6, base);
        if (o.saddle) k.rect(-8, -20, 17, 6, M.blanket);
        return;
      }
      ell(k, 0, -9, 13, 8, base);
      k.rect(-5, -15, 11, 2, lt);
      for (const [x, y] of [[-6, -10], [5, -8], [-1, -6]]) ell(k, x, y, 2, 1, sh); // prettier-ignore
      twinPoly(k, [[-8, -9], [-17, -9], [-18, -2], [-8, -1]], base); // prettier-ignore
      twin(k, -19, -2, 8, 2, M.sock);
    }
  });

  // ---------------------------------------------------------------- Scarabée et araignée
  // Patte articulée d'insecte : hanche, genou levé, pointe au sol.
  function bugLeg(k, x, y, kx, ky, fx, fy, col, t = 2) {
    k.line(x, y, kx, ky, col, t);
    k.line(kx, ky, fx, fy, col, t);
  }
  define('beetle', {
    seat: 24,
    side(k, M, o) {
      const [lt, base, sh, deep] = M.coat,
        bob = bobOf(o.frame),
        f = o.frame < 0 ? 0 : o.frame,
        ph = i => (o.frame < 0 ? 0 : [3, 0, -3, 0][(f + i * 2) % 4]),
        up = i => (o.frame < 0 ? 0 : [0, 3, 0, 0][(f + i * 2) % 4]);
      for (let i = 0; i < 3; i++)
        bugLeg(
          k,
          -8 + i * 9,
          -9 + bob,
          -6 + i * 10 + ph(i + 1),
          -13,
          -7 + i * 12 + ph(i + 1),
          -1 - up(i + 1),
          deep
        );
      // Tête et grande corne.
      ell(k, 17, -12 + bob, 5, 5, sh);
      k.line(19, -15 + bob, 25, -18 + bob, M.mane[1], 3);
      k.line(25, -18 + bob, 26, -26 + bob, M.mane[0], 2);
      k.line(14, -17 + bob, 19, -23 + bob, M.mane[1], 2);
      eyeSide(k, 18, -13 + bob, '#1a1410');
      k.line(20, -9 + bob, 25, -6 + bob, deep);
      // Élytres bombés, reflets changeants.
      ell(k, -2, -13 + bob, 17, 10, base);
      ell(k, -5, -16 + bob, 11, 5, lt);
      ell(k, -8, -18 + bob, 5, 2, '#e0fff4');
      k.rect(-16, -8 + bob, 28, 2, sh);
      k.line(9, -22 + bob, 12, -6 + bob, M.mane[0], 2);
      for (let i = 0; i < 4; i++) k.rect(-14 + i * 6, -6 + bob, 4, 1, M.mane[1]);
      for (let i = 0; i < 3; i++)
        bugLeg(k, -10 + i * 9, -7 + bob, -11 + i * 10 + ph(i), -10, -14 + i * 13 + ph(i), -up(i), M.sock, 3);
      if (o.saddle) saddleSide(k, M, -24, bob, 8);
    },
    front(k, M, o, part) {
      const [lt, base, sh, deep] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        for (let i = 0; i < 3; i++)
          for (const d of [-1, 1]) {
            const m = (i + (d > 0 ? 1 : 0)) % 2 ? step * 2 : 0;
            bugLeg(k, d * 8, -9, d * (13 + i), -13 + i * 2, d * (15 + i), -6 + i * 3 - m, deep);
          }
        ell(k, 0, -13, 13, 10, base);
        ell(k, -3, -18, 7, 3, lt);
        k.rect(0, -23, 1, 12, M.mane[0]);
        if (o.saddle) saddleFront(k, M, -22, 11);
      } else {
        ell(k, 0, -8, 8, 5, sh);
        k.rect(-1, -20, 3, 11, M.mane[1]);
        twin(k, -4, -22, 3, 3, M.mane[0]);
        k.rect(-1, -20, 3, 2, M.mane[0]);
        k.rect(-6, -10, 13, 1, M.mane[0]);
        eyesFront(k, -6, -8);
        twin(k, -3, -4, 2, 3, M.mane[1]);
      }
    },
    back(k, M, o, part) {
      const [lt, base, sh, deep] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        k.rect(0, -33, 2, 10, M.mane[0]);
        ell(k, 0, -17, 10, 6, sh);
        if (o.saddle) k.rect(-8, -23, 17, 6, M.blanket);
        return;
      }
      for (let i = 0; i < 3; i++)
        for (const d of [-1, 1]) {
          const m = (i + (d > 0 ? 1 : 0)) % 2 ? step * 2 : 0;
          bugLeg(k, d * 8, -8, d * (13 + i), -12 + i * 2, d * (15 + i), -5 + i * 2 - m, deep);
        }
      ell(k, 0, -10, 13, 9, base);
      ell(k, -5, -14, 5, 3, lt);
      k.rect(0, -18, 1, 17, M.mane[0]);
      k.rect(-8, -4, 17, 1, M.mane[1]);
    }
  });
  define('spider', {
    seat: 22,
    side(k, M, o) {
      const [lt, base, sh, deep] = M.coat,
        bob = bobOf(o.frame),
        f = o.frame < 0 ? 0 : o.frame,
        ph = i => (o.frame < 0 ? 0 : [3, 1, -3, -1][(f + i) % 4]),
        up = i => (o.frame < 0 ? 0 : [0, 3, 0, 0][(f + i) % 4]);
      const legs = (col, shift, k0) => {
        for (let i = 0; i < 4; i++) {
          const d = [-1.5, -0.6, 0.6, 1.5][i];
          bugLeg(
            k,
            4 + i * 2,
            -11 + bob,
            Math.round(5 + d * 10 + shift),
            -21 + Math.abs(d) * 2,
            Math.round(6 + d * 15 + shift + ph(i + k0)),
            -up(i + k0),
            col
          );
        }
      };
      legs(deep, 2, 2);
      // Abdomen rayé, céphalothorax.
      ell(k, -10, -14 + bob, 12, 10, base);
      ell(k, -12, -18 + bob, 7, 4, lt);
      shape(k, -10, -14 + bob, '-4 -6, 0 -1, 4 -6, 3 0, 6 5, 0 2, -6 5, -3 0', M.mane[0]);
      k.rect(-18, -8 + bob, 14, 2, sh);
      ell(k, 7, -12 + bob, 9, 6, base);
      k.rect(2, -17 + bob, 8, 1, lt);
      for (const [x, y] of [[14, -15], [12, -17], [15, -12]]) k.rect(x, y + bob, 2, 2, M.eye); // prettier-ignore
      k.line(15, -8 + bob, 17, -4 + bob, M.mane[0], 2);
      legs(sh, 0, 0);
      for (let i = 0; i < 4; i++)
        k.rect(Math.round(4 + [-1.5, -0.6, 0.6, 1.5][i] * 10), -19, 3, 2, M.mane[1]);
      if (o.saddle) saddleSide(k, M, -22, bob, 4);
    },
    front(k, M, o, part) {
      const [lt, base, sh, deep] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        for (let i = 0; i < 4; i++)
          for (const d of [-1, 1]) {
            const m = (i + (d > 0 ? 1 : 0)) % 2 ? step * 2 : 0;
            bugLeg(
              k,
              d * 6,
              -11,
              d * (12 + i),
              -21 + i * 3,
              d * (19 - i),
              -10 + i * 3 - m,
              i % 2 ? sh : deep
            );
          }
        ell(k, 0, -15, 11, 9, base);
        ell(k, 0, -20, 6, 3, lt);
        if (o.saddle) saddleFront(k, M, -21, 9);
      } else {
        ell(k, 0, -9, 7, 6, base);
        k.rect(-3, -14, 7, 1, lt);
        twin(k, -2, -11, 2, 3, M.eye);
        twin(k, -5, -12, 2, 2, M.eye);
        twin(k, -3, -14, 1, 1, M.eye);
        twin(k, -3, -5, 2, 4, M.mane[0]);
      }
    },
    back(k, M, o, part) {
      const [lt, base, sh, deep] = M.coat,
        step = Math.max(0, o.frame) % 2;
      if (part === 'under') {
        ell(k, 0, -17, 7, 5, base);
        if (o.saddle) k.rect(-7, -21, 15, 6, M.blanket);
        return;
      }
      for (let i = 0; i < 4; i++)
        for (const d of [-1, 1]) {
          const m = (i + (d > 0 ? 1 : 0)) % 2 ? step * 2 : 0;
          bugLeg(k, d * 7, -11, d * (12 + i), -19 + i * 3, d * (19 - i), -9 + i * 3 - m, i % 2 ? sh : deep);
        }
      ell(k, 0, -10, 11, 9, base);
      ell(k, -3, -14, 5, 3, lt);
      shape(k, 0, -10, '-4 -6, 0 -1, 5 -6, 3 0, 6 5, 0 2, -5 5, -2 0', M.mane[0]);
    }
  });

  // ---------------------------------------------------------------- Objets enchantés et nuage
  // Tapis : une bande tissée qui ondule, frangée aux deux bouts.
  define('carpet', {
    seat: 9,
    hover: 8,
    stand: true,
    side(k, M, o) {
      const f = o.frame < 0 ? o.swish || 0 : o.frame,
        wave = x => Math.round(Math.sin(x * 0.22 + f * 1.57) * 1.6);
      for (let x = -22; x <= 22; x++) {
        const y = -9 + wave(x),
          edge = Math.abs(x) > 18;
        k.rect(x, y - 4, 1, 9, edge ? M.mane[1] : M.coat[1]);
        k.rect(x, y - 4, 1, 1, M.mane[0]);
        k.rect(x, y + 3, 1, 1, M.mane[0]);
        k.rect(x, y + 4, 1, 2, M.coat[3]);
        if (!edge) {
          const m = ((x + 48) % 12) - 6;
          if (Math.abs(m) < 5) {
            k.rect(x, y - 2 + Math.floor(Math.abs(m) / 2), 1, 5 - Math.floor(Math.abs(m) / 2) * 2, M.sock);
            if (Math.abs(m) < 2) k.rect(x, y - 1, 1, 3, M.mane[0]);
          }
        }
      }
      for (const x of [-25, 23])
        for (let i = 0; i < 5; i++) k.rect(x, -13 + wave(x) + i * 2, 3, 1, M.mane[0]);
      k.rect(22, -15 + wave(22), 4, 2, M.mane[0]);
    },
    front(k, M, o, part) {
      if (part === 'over') return;
      const f = o.frame < 0 ? o.swish || 0 : o.frame;
      for (let y = -22; y <= 2; y++) {
        const s = Math.round(Math.sin(y * 0.4 + f * 1.57)),
          edge = y < -20 || y > 0,
          hw = 13 + Math.round((y + 22) / 10);
        k.rect(-hw + s, y, hw * 2 + 1, 1, edge ? M.mane[1] : M.coat[1]);
        k.rect(-hw + s, y, 2, 1, M.mane[0]);
        k.rect(hw - 1 + s, y, 2, 1, M.mane[0]);
        if (!edge) {
          const m = ((y + 40) % 10) - 5,
            w = 6 - Math.abs(m);
          if (w > 0) {
            k.rect(-w + s, y, w * 2 + 1, 1, M.sock);
            if (w > 4) k.rect(-2 + s, y, 5, 1, M.mane[0]);
          }
        }
      }
      for (let i = 0; i < 8; i++) {
        k.rect(-14 + i * 4, 3, 1, 2, M.mane[0]);
        k.rect(-12 + i * 3, -25, 1, 2, M.mane[0]);
      }
    },
    back(k, M, o, part) {
      SPECIES.carpet.front(k, M, o, part);
    }
  });
  define('broom', {
    seat: 18,
    hover: 8,
    thin: true,
    side(k, M, o) {
      const s = o.swish || 0;
      // Manche noueux, lien violet, brins.
      k.line(-8, -15, 26, -19, M.coat[1], 3);
      k.line(-8, -16, 26, -20, M.coat[0]);
      for (const x of [3, 13, 21]) k.rect(x, -18 - Math.round(x / 9), 2, 3, M.coat[2]);
      k.rect(26, -20, 2, 3, M.coat[2]);
      shape(k, -8, -14, `1 -5, -8 -8, -20 ${-7 + s}, -22 ${0 + s}, -20 ${6 + s}, -8 7, 1 4`, M.mane[1]);
      shape(k, -8, -14, `0 -4, -8 -6, -19 ${-5 + s}, -19 ${1 + s}, -6 2`, M.mane[0]);
      for (let i = 0; i < 5; i++) k.line(-10, -16 + i * 2, -28, -20 + i * 3 + s, M.coat[2]);
      k.rect(-9, -19, 3, 10, M.sock);
      k.rect(-9, -15, 3, 1, GOLD);
      k.rect(-5, -19, 10, 3, M.blanket);
      k.rect(-5, -17, 10, 1, GOLD);
      // Lanterne pendue à l'avant.
      k.rect(23, -16, 1, 3, HOOF);
      k.rect(21, -13, 5, 6, HOOF);
      k.rect(22, -12, 3, 4, M.glow || '#ffd870');
    },
    front(k, M, o, part) {
      if (part === 'under') {
        shape(k, 0, -20, '-4 2, 5 2, 9 -8, -8 -8', M.mane[1]);
        for (let i = 0; i < 5; i++) k.line(-3 + i * 2, -19, -7 + i * 4, -29, M.mane[0]);
        return;
      }
      k.rect(-1, -13, 3, 8, M.coat[1]);
      k.rect(-1, -13, 1, 8, M.coat[0]);
      ell(k, 0, -6, 2, 2, M.coat[2]);
      k.rect(-2, -3, 5, 6, HOOF);
      k.rect(-1, -2, 3, 4, M.glow || '#ffd870');
    },
    back(k, M, o, part) {
      if (part === 'under') {
        k.rect(-1, -32, 3, 12, M.coat[1]);
        return;
      }
      const s = o.swish || 0;
      k.rect(-3, -18, 7, 4, M.sock);
      shape(k, 0, -14, `-3 0, 4 0, ${9 + s} 11, ${s} 14, ${-8 + s} 11`, M.mane[1]);
      for (let i = 0; i < 5; i++) k.line(-3 + i * 2, -14, -7 + i * 4 + s, -2, M.mane[0]);
    }
  });
  const PUFFS = [[-14, -7, 7, 5], [14, -7, 7, 5], [-7, -11, 8, 6], [8, -11, 8, 6], [0, -8, 11, 7]]; // prettier-ignore
  function cloudBody(k, M) {
    for (const [x, y, rx, ry] of PUFFS) ell(k, x, y + 2, rx, ry, M.coat[2]);
    for (const [x, y, rx, ry] of PUFFS) ell(k, x, y, rx, ry, M.coat[1]);
    for (const [x, y, rx, ry] of PUFFS) ell(k, x - 1, y - 2, rx - 3, ry - 3, M.coat[0]);
    ell(k, -10, -3, 3, 1, M.mane[1]);
    ell(k, 8, -2, 4, 1, M.mane[1]);
  }
  function cloudFront(k, M) {
    for (const [x, y, rx, ry] of [
      [-9, -5, 6, 4],
      [9, -5, 6, 4],
      [0, -4, 8, 4]
    ]) {
      // prettier-ignore
      ell(k, x, y + 1, rx, ry, M.coat[2]);
      ell(k, x, y, rx, ry, M.coat[1]);
      ell(k, x - 1, y - 1, rx - 3, ry - 2, M.coat[0]);
    }
  }
  // Petite frimousse du nuage : yeux, joues, sourire.
  function cloudFace(k, x, y, M) {
    k.rect(x - 4, y, 2, 2, '#4a5a78');
    k.rect(x + 3, y, 2, 2, '#4a5a78');
    k.rect(x - 1, y + 2, 3, 1, '#4a5a78');
    k.rect(x - 6, y + 2, 2, 1, M.mane[1]);
    k.rect(x + 5, y + 2, 2, 1, M.mane[1]);
  }
  define('cloud', {
    seat: 14,
    hover: 7,
    soft: true,
    side(k, M) {
      cloudBody(k, M);
      cloudFace(k, 12, -6, M);
    },
    veil(k, M) {
      cloudFront(k, M);
      cloudFace(k, 12, -6, M);
    },
    front(k, M, o, part) {
      if (part === 'under') cloudBody(k, M);
      else {
        cloudFront(k, M);
        cloudFace(k, 0, -6, M);
      }
    },
    back(k, M, o, part) {
      if (part === 'under') cloudBody(k, M);
      else cloudFront(k, M);
    }
  });

  // ---------------------------------------------------------------- Sprites
  const speciesOf = M => SPECIES[M.species] || SPECIES.horse;
  const keyOf = (M, o) =>
    M.id +
    '|' +
    (o.frame ?? -1) +
    (o.saddle ? 's' : '') +
    (o.graze ? 'g' : '') +
    '|' +
    (o.swish || 0) +
    '|' +
    (o.flap || 0);
  function side(M, o = {}) {
    const f = { frame: -1, ...o };
    return bake('s|' + keyOf(M, f), SIDE, k => speciesOf(M).side(k, M, f));
  }
  // Calque devant le cavalier, de profil : le flanc sous la selle (découpé dans le sprite lui-même), puis sa botte dans
  // l'étrier ; sur un nuage, les volutes de devant ; rien sur un tapis.
  function sideOver(M, o = {}) {
    const sp = speciesOf(M);
    if (sp.stand) return null;
    const f = { frame: -1, saddle: true, ...o };
    // Volutes de devant, sans contour : elles se fondent dans le nuage.
    if (sp.soft) return bake('so|' + M.id, SIDE, k => sp.veil(k, M), false);
    const key = 'so|' + keyOf(M, f);
    if (cache.has(key)) return cache.get(key);
    const base = side(M, f);
    let out = null;
    if (base) {
      out = makeCanvas(base.width, base.height);
      const g = out.getContext('2d');
      if (g) {
        g.imageSmoothingEnabled = false;
        const bob = sp.bounce ? 0 : bobOf(f.frame),
          top = (SIDE.ground - sp.seat + 3 + bob) * U,
          x0 = (SIDE.x - 8) * U,
          h = (sp.thin ? 4 : 17) * U;
        g.drawImage(base, x0, top, 17 * U, h, x0, top, 17 * U, h);
        const R = (x, y, w, hh, col) => {
          g.fillStyle = col;
          g.fillRect((SIDE.x + x) * U, (SIDE.ground - sp.seat + y + bob) * U, w * U, hh * U);
        };
        if (!sp.thin) {
          R(-3, 8, 6, 5, '#2a1810');
          R(-2, 6, 4, 3, '#5a3418');
          R(-2, 9, 5, 3, '#3a281c');
          R(-2, 9, 1, 3, '#5a4434');
          R(-3, 12, 7, 1, '#c8a040');
        }
      }
    }
    cache.set(key, out);
    return out;
  }
  const front = (M, part, o = {}) => {
    const f = { frame: 0, saddle: true, ...o };
    const ink = !(part === 'over' && speciesOf(M).soft);
    return bake('f|' + part + '|' + keyOf(M, f), FRONT, k => speciesOf(M).front(k, M, f, part), ink);
  };
  const back = (M, part, o = {}) => {
    const f = { frame: 0, saddle: true, ...o };
    const ink = !(part === 'over' && speciesOf(M).soft);
    return bake('b|' + part + '|' + keyOf(M, f), FRONT, k => speciesOf(M).back(k, M, f, part), ink);
  };
  // Vignette d'une monture pour les fenêtres : son profil, recadré au plus juste (adresse data:, '' sans canevas).
  const thumbs = new Map();
  function thumb(M, saddle = false) {
    const key = M.id + (saddle ? '|s' : '');
    if (thumbs.has(key)) return thumbs.get(key);
    let url = '';
    const spr = side(M, { saddle });
    try {
      const d = spr?.getContext('2d').getImageData(0, 0, spr.width, spr.height).data;
      if (d && d.length === spr.width * spr.height * 4) {
        let x0 = spr.width,
          y0 = spr.height,
          x1 = 0,
          y1 = 0;
        for (let y = 0; y < spr.height; y += U)
          for (let x = 0; x < spr.width; x += U)
            if (d[(y * spr.width + x) * 4 + 3]) {
              x0 = Math.min(x0, x);
              y0 = Math.min(y0, y);
              x1 = Math.max(x1, x + U);
              y1 = Math.max(y1, y + U);
            }
        const cv = makeCanvas(x1 - x0, y1 - y0);
        cv.getContext('2d').drawImage(spr, -x0, -y0);
        url = cv.toDataURL();
      }
    } catch {
      url = '';
    }
    thumbs.set(key, url);
    return url;
  }

  // ---------------------------------------------------------------- Ménagerie du camp
  // Roulotte de la dresseuse : caisse de bois peinte, toit bombé rayé, volet ouvert sur le comptoir, roues à rayons,
  // marches, lanterne et enseigne en fer à cheval. 104 × 96 (sur quatre cases de large).
  const WAGON = { w: 104, h: 96, x: 52, ground: 92 };
  const wagon = () =>
    bake('wagon', WAGON, k => {
      const W = ['#5ab0a8', '#3a8a84', '#2a6a66', '#1a4a48'],
        wood = ['#c8945a', '#a87444', '#86582e', '#5e3c1e'];
      // Essieu, timon et marches.
      k.rect(-40, -20, 80, 4, wood[3]);
      k.rect(38, -17, 13, 3, wood[2]);
      k.rect(48, -20, 3, 8, wood[3]);
      // Caisse à planches verticales.
      k.rect(-40, -66, 80, 47, W[1]);
      for (let x = -40; x < 40; x += 6) {
        k.rect(x, -66, 5, 47, hash(x, 3) > 0.6 ? W[0] : W[1]);
        k.rect(x + 5, -66, 1, 47, W[2]);
      }
      k.rect(-40, -24, 80, 5, W[2]);
      k.rect(-40, -20, 80, 2, W[3]);
      for (let x = -36; x < 40; x += 12) {
        k.rect(x, -23, 5, 3, GOLD);
        k.px(x + 2, -22, '#b8323a');
      }
      // Toit bombé rayé, lambrequin à festons.
      for (let x = -45; x <= 45; x++) {
        const y = -82 + Math.round((x * x) / 190),
          stripe = Math.floor((x + 45) / 8) % 2;
        k.rect(x, y, 1, -65 - y, stripe ? '#f4ead2' : '#c8404a');
        k.rect(x, y, 1, 2, stripe ? '#ffffff' : '#e86a6a');
        k.rect(x, -67, 1, 5 - Math.abs(((x + 45) % 8) - 4) / 2, stripe ? '#e0d0b0' : '#a02c38');
      }
      k.rect(-46, -69, 92, 1, GOLD);
      // Cheminée.
      k.rect(-30, -90, 7, 12, '#6a6a72');
      k.rect(-32, -92, 11, 3, '#4a4a52');
      // Comptoir : volet relevé, intérieur chaud, brides, seaux et grelots.
      k.rect(-30, -56, 40, 25, '#2e1c12');
      k.rect(-28, -54, 36, 21, '#5a3418');
      k.rect(-28, -54, 36, 5, '#3e2410');
      for (const [x, col] of [
        [-24, '#8a4a2a'],
        [-16, '#3a6ab0'],
        [-7, '#b8323a'],
        [2, '#4a8a4a']
      ]) {
        // prettier-ignore
        k.rect(x, -54, 1, 5, wood[0]);
        k.rect(x - 2, -50, 5, 7, col);
        k.rect(x - 2, -50, 5, 1, GOLD);
      }
      k.rect(-33, -33, 46, 4, wood[0]);
      k.rect(-33, -30, 46, 2, wood[2]);
      k.rect(-26, -38, 8, 5, '#b88a50');
      k.rect(-25, -40, 6, 2, '#f08a3a');
      k.rect(-2, -37, 6, 4, '#8a8a94');
      // Porte, lucarne et marches.
      k.rect(18, -58, 17, 39, wood[2]);
      k.rect(20, -56, 13, 37, wood[1]);
      k.disc(26, -47, 4, '#3a2414');
      k.disc(26, -47, 3, '#ffd88a');
      k.rect(26, -50, 1, 7, wood[3]);
      k.rect(30, -36, 2, 2, GOLD);
      k.rect(18, -19, 18, 5, wood[0]);
      k.rect(16, -13, 22, 5, wood[1]);
      k.rect(14, -7, 26, 6, wood[0]);
      // Roues à rayons.
      for (const x of [-27, 5]) {
        k.disc(x, -11, 11, wood[3]);
        k.disc(x, -11, 8, '#3a2414');
        for (let a = 0; a < 8; a++)
          k.line(
            x,
            -11,
            x + Math.round(Math.cos((a * Math.PI) / 4) * 8),
            -11 + Math.round(Math.sin((a * Math.PI) / 4) * 8),
            wood[1]
          );
        k.disc(x, -11, 3, GOLD);
        k.disc(x, -11, 1, '#b8323a');
      }
      // Fer à cheval doré au-dessus de la porte.
      k.disc(26, -63, 3, GOLD);
      k.disc(26, -62, 1, W[1]);
      k.rect(25, -62, 3, 3, W[1]);
    });

  window.CANAAN_MOUNT_ART = Object.freeze({
    U,
    SIDE: Object.freeze({ x: SIDE.x * U, ground: SIDE.ground * U }),
    FRONT: Object.freeze({ x: FRONT.x * U, ground: FRONT.ground * U }),
    speciesOf,
    species: () => Object.keys(SPECIES),
    side,
    sideOver,
    front,
    back,
    thumb,
    wagon,
    // Outils pour les espèces d'une extension.
    tools: Object.freeze({
      define,
      horse,
      quad,
      bird,
      feline,
      canine,
      wing,
      ell,
      shape,
      twin,
      twinPoly,
      leg,
      eyeSide,
      eyesFront,
      TAILS,
      tailDown,
      CAT,
      HOOF,
      tint
    })
  });
})();
