// Art de Sylvaëlle, la cité elfique, dans la facture des bâtiments (building-art.js) : écailles de feuilles, branches
// torsadées, mousse, cristaux, contour sombre, gros pixels (1 pixel d'art = 2 pixels d'écran). Le Grand Arbre Ylvarë
// (tronc tressé, racines, visage sculpté dans l'écorce, couronne de feuilles), la fontaine-arbre de la place, les arbres
// elfiques (bouleau d'argent, cerisier en fleurs, cyprès, saule lumineux), les jardins (massifs, statues, nichoirs,
// vasque, bancs, topiaires, arches fleuries, étangs) et les animaux (cerf blanc, licorne, renard sylvestre, paon blanc,
// cygne, lapin, chouette, colibri). Tout est peint une fois et gardé.
(() => {
  'use strict';
  const { makeCanvas, noise, painter } = CANAAN_PIXEL_KIT;
  // Toile en pixels d'art, contourée ; null sans canevas (tests).
  const paint = painter();
  const BARK = ['#b8906a', '#8a6444', '#64462c', '#44301c', '#2c1e10'];
  const LEAF = ['#c4ec90', '#8cca62', '#5ea44a', '#3e7a36', '#264c22'];
  const DEEP = ['#8ac868', '#5e9a48', '#447a38', '#2e5a2a', '#1c3a1a'];
  const MOSS = ['#a8d878', '#6aa84a', '#3e7a36'];
  const FLOWERS = ['#b08aff', '#f6a0d8', '#ffffff', '#fff0a0', '#6aa8ff', '#ff8aa8'];
  // Touffe de feuilles festonnée (polygone), remplie d'écailles de feuilles.
  function cluster(k, kit, cx, cy, r, ramp, seed, squash = 0.85, sz = 6) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2,
        rr = r * (1 + 0.1 * Math.sin(a * 6 + seed) + 0.06 * Math.sin(a * 11 + seed * 2));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
    }
    kit.shingles(k, pts, ramp, { leaf: true, w: sz, h: sz, cx: cx - r * 0.5 });
  }
  // Couronne d'arbre arrondie : touffes du fond (teinte sombre), branches qui montent du tronc, touffes de devant en
  // petites feuilles ; la silhouette descend sur les côtés (pas de champignon).
  function crown(k, kit, ramp, back, top, bark, seed) {
    const dark = [ramp[1], ramp[2], ramp[3], ramp[4], ramp[4]];
    [
      [18, 34, 11],
      [46, 34, 11],
      [32, 20, 14]
    ].forEach(([x, y, r], i) => cluster(k, kit, x, y, r, dark, seed + i, 0.9, 4));
    for (const [bx, by] of [
      [16, 30],
      [48, 28],
      [26, 14],
      [40, 16]
    ])
      kit.branch(k, kit.bez([32, top], [32 + (bx - 32) * 0.3, (top + by) / 2], [bx, by]), 2, bark);
    [
      [14, 28, 10],
      [50, 26, 10],
      [24, 14, 11],
      [42, 14, 11],
      [32, 30, 11],
      [20, 42, 7],
      [44, 42, 7],
      [32, 8, 9]
    ].forEach(([x, y, r], i) => cluster(k, kit, x, y, r, ramp, seed * 3 + i * 5, 0.9, 4));
  }
  // Tronc ou racine épaisse : disques le long d'un tracé, modelés (clair à gauche), rainures d'écorce.
  function limb(k, pts, t0, t1, ramp = BARK) {
    const n = pts.length;
    pts.forEach(([x, y], i) => {
      const r = t0 + ((t1 - t0) * i) / Math.max(1, n - 1);
      for (let yy = -r; yy <= r; yy++)
        for (let xx = -r; xx <= r; xx++) {
          if (xx * xx + yy * yy > r * r) continue;
          const u = xx / Math.max(1, r),
            groove = Math.abs(Math.sin((x + xx) * 0.9 + (y + yy) * 0.25)) < 0.12;
          k.px(
            x + xx,
            y + yy,
            groove ? ramp[3] : u < -0.45 ? ramp[0] : u < 0.25 ? ramp[1] : u < 0.7 ? ramp[2] : ramp[3]
          );
        }
    });
  }
  // Lierre qui pend, fleuri.
  function hang(k, x, y, len, seed) {
    for (let i = 0; i < len; i++) {
      const xx = x + Math.round(Math.sin((i + seed) * 0.5));
      k.px(xx, y + i, i % 3 ? LEAF[2] : LEAF[1]);
      if (i % 4 === 2) k.px(xx + 1, y + i, FLOWERS[(i + seed) % 3]);
    }
  }
  // ---------------------------------------------------------------- Grand Arbre Ylvarë (170 × 200 pixels d'art)
  // Tronc tressé de trois brins, racines noueuses et moussues, sourcils et nez d'écorce (les yeux et la bouche
  // s'animent à part : face), grande couronne en touffes de feuilles avec feuilles d'or et lierre qui pend.
  const TREE = { w: 170, h: 200, cx: 85, eyeY: 120, mouthY: 142 };
  function tree() {
    return paint('tree', TREE.w, TREE.h, (k, kit) => {
      const cx = TREE.cx,
        bk = [BARK[0], BARK[1], BARK[2], BARK[3]];
      // Couronne du fond (sombre) et maîtresses branches qui y montent.
      const back = [
          [40, 62, 30],
          [130, 60, 30],
          [85, 34, 34],
          [62, 88, 26],
          [110, 88, 26]
        ],
        front = [
          [28, 80, 22],
          [142, 78, 22],
          [56, 50, 26],
          [114, 48, 26],
          [85, 60, 24],
          [85, 18, 20],
          [44, 96, 14],
          [126, 96, 14]
        ];
      back.forEach(([x, y, r], i) => cluster(k, kit, x, y, r, DEEP, i * 3, 0.85, 5));
      for (const [bx, by] of [
        [34, 70],
        [136, 68],
        [60, 40],
        [110, 38],
        [85, 22]
      ]) {
        const pts = kit.bez([cx + (bx - cx) * 0.15, 104], [cx + (bx - cx) * 0.5, 90], [bx, by], 20);
        limb(k, pts, 6, 2, BARK);
      }
      // Tronc tressé : trois brins qui s'enroulent l'un sur l'autre, sillons sombres entre eux, large pied évasé.
      for (let y = 198; y >= 92; y--) {
        const t = (198 - y) / 106,
          hw = 17 + 22 * Math.pow(1 - t, 3),
          strands = [0, 1, 2].map(i => {
            const a = t * 7 + (i * Math.PI * 2) / 3;
            return { i, c: cx + Math.sin(a) * hw * 0.58, d: Math.cos(a), sw: hw * 0.52 };
          });
        for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
          let best = null;
          for (const s of strands) if (Math.abs(x - s.c) < s.sw && (!best || s.d > best.d)) best = s;
          if (!best) {
            k.px(x, y, BARK[4]);
            continue;
          }
          const u = (x - best.c) / best.sw;
          let tone = Math.abs(u) > 0.86 ? 4 : u < -0.45 ? 0 : u < 0.15 ? 1 : u < 0.6 ? 2 : 3;
          if (best.d < -0.2 && tone < 4) tone++;
          if (tone < 3 && noise(best.i, Math.round((x - best.c) * 0.6), Math.floor(y / 6)) < 0.14) tone++;
          k.px(x, y, BARK[tone]);
        }
      }
      // Couronne de devant (petites feuilles), feuilles d'or, lierre qui pend.
      front.forEach(([x, y, r], i) => cluster(k, kit, x, y, r, LEAF, i * 5 + 1, 0.85, 5));
      for (let i = 0; i < 80; i++) {
        const x = 14 + noise(i, 2) * 142,
          y = 6 + noise(2, i) * 100;
        k.rect(x, y, 2, 2, i % 3 ? '#f0d060' : '#fff4b0');
      }
      for (const [x, len] of [
        [22, 22],
        [44, 18],
        [126, 20],
        [150, 14],
        [64, 14],
        [106, 16]
      ])
        hang(k, x, 96, len, x);
      // Racines noueuses qui s'étalent sur le sol, moussues.
      for (const [dx, len, up] of [
        [-1, 50, 8],
        [1, 52, 6],
        [-1, 34, 3],
        [1, 36, 10],
        [-0.35, 22, 0],
        [0.4, 24, 0]
      ]) {
        const pts = [];
        for (let i = 0; i <= len; i += 2)
          pts.push([cx + dx * (14 + i), 192 + Math.sqrt(i) * 0.7 - up * (1 - i / len)]);
        limb(k, pts, 7, 2, BARK);
        for (let i = 4; i < len; i += 7)
          k.rect(cx + dx * (14 + i) - 2, 187 + Math.sqrt(i) * 0.7 - up * (1 - i / len), 5, 2, MOSS[i % 3]);
      }
      // Visage sculpté dans l'écorce : orbites creuses, sourcils noueux, nez en nœud, bouche creuse, barbe de mousse.
      const ey = TREE.eyeY,
        my = TREE.mouthY;
      for (const s of [-1, 1]) {
        k.disc(cx + s * 9, ey, 6, BARK[3]);
        k.disc(cx + s * 9, ey + 1, 4, BARK[4]);
        kit.branch(k, kit.bez([cx + s * 20, ey - 1], [cx + s * 12, ey - 13], [cx + s * 3, ey - 7]), 4, bk);
        k.rect(cx + s * 9 - 4, ey + 7, 8, 1, BARK[3]);
        k.rect(cx + s * 13 - 2, ey + 10, 4, 3, BARK[0]);
      }
      k.poly(
        [
          [cx - 2, ey - 5],
          [cx + 2, ey - 5],
          [cx + 5, ey + 12],
          [cx - 5, ey + 12]
        ],
        BARK[1]
      );
      k.rect(cx - 2, ey - 4, 1, 14, BARK[0]);
      k.rect(cx + 3, ey + 2, 1, 9, BARK[2]);
      k.rect(cx - 6, ey + 12, 12, 2, BARK[3]);
      k.px(cx - 3, ey + 12, BARK[4]);
      k.px(cx + 2, ey + 12, BARK[4]);
      k.rect(cx - 9, my - 5, 18, 2, BARK[0]);
      for (let y = -3; y <= 3; y++) {
        const hw = Math.round(8 * Math.sqrt(1 - (y * y) / 12));
        k.rect(cx - hw, my + y, hw * 2, 1, y < 0 ? BARK[4] : BARK[3]);
      }
      for (let i = 0; i < 14; i++)
        k.rect(cx - 13 + i * 2, my + 4 + (i % 3), 2, 5 + ((i * 3) % 7), MOSS[i % 3]);
      // Champignons au pied.
      for (const [x, col] of [
        [cx - 34, '#e85a48'],
        [cx + 38, '#f0a040'],
        [cx - 50, '#e85a48'],
        [cx + 52, '#c8a8ff']
      ]) {
        k.rect(x, 191, 2, 4, '#fff1d8');
        k.rect(x - 2, 188, 6, 3, col);
        k.px(x, 188, '#ffffff');
      }
    });
  }
  // Yeux qui clignent (lueur d'ambre) et bouche qui parle, au-dessus du dessin de l'arbre (u : pixels d'écran par pixel
  // d'art ; X, Y : pied du tronc).
  function face(c, X, Y, u, talk) {
    const ox = X - TREE.cx * u,
      oy = Y - TREE.h * u,
      R = (x, y, w, h, col) => {
        c.fillStyle = col;
        c.fillRect(Math.round(ox + x * u), Math.round(oy + y * u), Math.ceil(w * u), Math.ceil(h * u));
      },
      blink = Math.floor(time / 6) % 70 < 2,
      mouth = talk ? 2 + Math.abs(Math.round(Math.sin(time * 0.35) * 3)) : 0;
    for (const s of [-1, 1]) {
      const ex = TREE.cx + s * 9 - 3;
      if (blink) R(ex, TREE.eyeY, 6, 1, '#2a1a0e');
      else {
        R(ex + 1, TREE.eyeY - 2, 4, 4, '#ffd36d');
        R(ex + 2, TREE.eyeY - 1, 2, 2, '#fff6c0');
      }
    }
    if (mouth) R(TREE.cx - 4, TREE.mouthY - 1, 8, mouth, '#1a0c06');
    if (!blink) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.3 + 0.15 * Math.sin(time * 0.05);
      for (const s of [-1, 1]) R(TREE.cx + s * 9 - 4, TREE.eyeY - 3, 8, 6, '#ffb040');
      c.restore();
    }
  }
  // ---------------------------------------------------------------- Fontaine-arbre de la place (90 × 84)
  // Vasque de pierres moussues, arbre tressé au centre dont les racines débordent, deux filets d'eau (animés à part).
  const FOUNT = { w: 90, h: 84, cx: 45, waterY: 66 };
  function fountain() {
    return paint('fountain', FOUNT.w, FOUNT.h, (k, kit) => {
      const cx = FOUNT.cx,
        wy = FOUNT.waterY;
      // Rebord du fond, eau, tronc, rebord de devant.
      for (let a = Math.PI; a <= Math.PI * 2; a += 0.08)
        k.disc(cx + Math.cos(a) * 40, wy + Math.sin(a) * 14, 4, a % 0.3 < 0.15 ? '#9a968a' : '#b4b0a4');
      k.g.fillStyle = '#3a8a9a';
      for (let y = -12; y <= 12; y++) {
        const hw = Math.round(36 * Math.sqrt(1 - (y * y) / 144));
        k.rect(cx - hw, wy + y, hw * 2, 1, y < -6 ? '#5ab0b8' : '#3a8a9a');
      }
      cluster(k, kit, cx - 6, 14, 14, LEAF, 4, 0.85, 4);
      cluster(k, kit, cx + 10, 18, 12, LEAF, 9, 0.85, 4);
      for (let s = 0; s < 2; s++) {
        const pts = [];
        for (let y = wy + 2; y >= 18; y -= 2)
          pts.push([cx + Math.sin((wy - y) * 0.12 + s * 3) * 4 + (s ? 3 : -3), y]);
        limb(k, pts, 7, 4, BARK);
      }
      for (const [dx, len] of [
        [-1, 30],
        [1, 28],
        [-0.5, 16],
        [0.6, 18]
      ]) {
        const pts = [];
        for (let i = 0; i <= len; i += 2) pts.push([cx + dx * (4 + i), wy + 2 + Math.min(10, i * 0.5)]);
        limb(k, pts, 4, 2, BARK);
      }
      for (let a = 0; a <= Math.PI; a += 0.08)
        k.disc(cx + Math.cos(a) * 40, wy + Math.sin(a) * 14, 4, a % 0.3 < 0.15 ? '#a8a498' : '#c8c4b8');
      for (let a = 0.2; a < Math.PI; a += 0.5)
        k.rect(cx + Math.cos(a) * 40 - 3, wy + Math.sin(a) * 14 - 3, 5, 2, MOSS[Math.floor(a * 3) % 3]);
      for (const x of [4, 76])
        for (let j = 0; j < 5; j++) k.line(x + 4, 80, x + j * 2, 70 - (j % 2) * 3, j % 2 ? LEAF[2] : LEAF[1]);
      hang(k, cx - 18, 22, 14, 1);
      hang(k, cx + 20, 24, 12, 5);
    });
  }
  // Filets d'eau qui tombent des branches et rides sur l'eau.
  function fountainFx(c, X, Y) {
    const u = 2,
      ox = X - FOUNT.cx * u,
      oy = Y - FOUNT.h * u;
    c.save();
    for (const [sx, sy] of [
      [FOUNT.cx - 12, 26],
      [FOUNT.cx + 14, 28]
    ])
      for (let i = 0; i < 6; i++) {
        const ph = (time * 0.05 + i / 6) % 1,
          y = sy + ph * (FOUNT.waterY - sy - 2);
        c.globalAlpha = 0.85;
        c.fillStyle = i % 2 ? '#e8ffff' : '#9ae8f0';
        c.fillRect(Math.round(ox + (sx + Math.sin(i) * 0.8) * u), Math.round(oy + y * u), u * 2, u * 3);
      }
    c.globalAlpha = 0.5;
    c.strokeStyle = '#e8ffff';
    c.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const r = ((time * 0.3 + i * 20) % 40) + 4;
      c.beginPath();
      c.ellipse(ox + FOUNT.cx * u, oy + (FOUNT.waterY + 2) * u, r, r * 0.35, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
  // ---------------------------------------------------------------- Arbres elfiques (64 × 76, agrandis × 2)
  function elfTree(kind) {
    const small = paint('tree:' + kind, 64, 76, (k, kit) => {
      if (kind === 'elftree') {
        const pale = ['#f4f2ec', '#d8d4c8', '#aea89a', '#7a7468', '#4a463e'];
        const pts = [];
        for (let y = 74; y >= 40; y -= 2) pts.push([32 + Math.sin(y * 0.12) * 3, y]);
        limb(k, pts, 5, 3, pale);
        for (let y = 40; y < 74; y += 7) k.rect(30 + Math.sin(y * 0.12) * 3, y, 3, 1, '#3a3630');
        const jade = ['#e0fff4', '#a0ecd0', '#5ec4a4', '#3a8a7a', '#24585a'];
        crown(k, kit, jade, null, 44, [pale[0], pale[1], pale[2], pale[3]], 1);
        for (let i = 0; i < 16; i++) k.px(8 + noise(i, 1) * 48, 4 + noise(1, i) * 40, '#f0d060');
        // Lanterne de cristal suspendue à une branche.
        k.rect(51, 44, 1, 5, '#c8ccd8');
        k.rect(49, 49, 5, 6, '#bfffee');
        k.px(50, 50, '#ffffff');
      } else if (kind === 'blossom') {
        const pts = [];
        for (let y = 74; y >= 34; y -= 2) pts.push([32 + Math.sin(y * 0.09) * 5, y]);
        limb(k, pts, 5, 3, BARK);
        const pink = ['#fff0f8', '#ffc8e0', '#f08ab8', '#c05a8a', '#803a60'];
        crown(k, kit, pink, null, 46, [BARK[0], BARK[1], BARK[2], BARK[3]], 2);
        for (let i = 0; i < 18; i++) k.px(6 + noise(i, 3) * 52, 4 + noise(3, i) * 40, '#ffffff');
        for (let i = 0; i < 6; i++) k.px(14 + noise(i, 9) * 36, 66 + noise(9, i) * 8, '#ffc8e0');
      } else if (kind === 'elfcypress') {
        const pts = [];
        for (let y = 74; y >= 58; y -= 2) pts.push([32, y]);
        limb(k, pts, 4, 3, ['#e8e4dc', '#c0b8aa', '#8a8276', '#5a544a', '#3a362e']);
        const flame = [];
        for (let i = 0; i <= 24; i++) {
          const t = i / 24,
            y = 62 - t * 60,
            w = 11 * Math.sin(Math.PI * Math.pow(t, 0.7)) + 1;
          flame.push([32 - w, y]);
        }
        for (let i = 24; i >= 0; i--) {
          const t = i / 24,
            y = 62 - t * 60,
            w = 11 * Math.sin(Math.PI * Math.pow(t, 0.7)) + 1;
          flame.push([32 + w + Math.sin(t * 9) * 1.5, y]);
        }
        kit.shingles(k, flame, DEEP, { leaf: true, w: 5, h: 5, cx: 28 });
        kit.branch(
          k,
          [
            [33, 60],
            [30, 44],
            [34, 28],
            [31, 12]
          ],
          2,
          ['#e8e4dc', '#c0b8aa', '#8a8276']
        );
      } else {
        // Saule lumineux : dôme et longues tiges qui retombent.
        const pts = [];
        for (let y = 74; y >= 34; y -= 2) pts.push([32 + Math.sin(y * 0.1) * 3, y]);
        limb(k, pts, 6, 3, BARK);
        const willow = ['#e8ffc0', '#b8e888', '#86c860', '#5aa448', '#3a7a36'];
        cluster(k, kit, 32, 26, 22, willow, 3, 0.7);
        for (let x = 12; x < 54; x += 3) {
          const len = 18 + Math.round(noise(x, 4) * 22);
          for (let i = 0; i < len; i++)
            k.px(
              x + Math.round(Math.sin(i * 0.3 + x) * 1),
              32 + i,
              i % 4 === 0 ? willow[0] : willow[2 + (i % 2)]
            );
          if (x % 9 === 0) k.px(x, 32 + len, '#fff4b0');
        }
      }
    });
    if (!small) return null;
    const big = makeCanvas(128, 152),
      g = big.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(small, 0, 0, 128, 152);
    return big;
  }
  // Inscrit les arbres elfiques parmi les décors de l'île (dessinés et éclairés par world-look.js).
  function registerTrees() {
    if (typeof PIXEL_DECOR === 'undefined') return;
    for (const kind of ['elftree', 'blossom', 'elfcypress', 'elfwillow']) {
      const s = elfTree(kind);
      if (s) PIXEL_DECOR[kind] = s;
    }
  }
  // ---------------------------------------------------------------- Jardins
  const PROP_SIZE = {
    flowerbed: [48, 22],
    statue: [24, 50],
    stagstatue: [44, 40],
    birdhouses: [44, 44],
    birdbath: [22, 26],
    bench: [44, 22],
    topiary: [22, 32],
    arch: [56, 60],
    pond: [120, 72]
  };
  function prop(kind) {
    const [w, h] = PROP_SIZE[kind] || [24, 24];
    return paint('prop:' + kind, w, h, (k, kit) => {
      const stone = ['#ffffff', '#ece8e0', '#cfc8bc', '#a8a094'];
      if (kind === 'flowerbed') {
        k.rect(1, 8, 46, 13, '#7a4e2c');
        k.rect(1, 8, 46, 2, '#a8784a');
        k.rect(3, 10, 42, 9, '#5a3a22');
        for (let i = 0; i < 40; i++) {
          const x = 4 + (i % 13) * 3 + ((i / 13) | 0),
            y = 10 + ((i / 13) | 0) * 3 - (i % 2) * 2;
          k.px(x, y + 2, LEAF[2]);
          k.rect(x - 1, y, 2, 2, FLOWERS[(i * 7) % FLOWERS.length]);
        }
      } else if (kind === 'statue') {
        k.rect(4, 40, 16, 10, stone[2]);
        k.rect(4, 40, 16, 2, stone[0]);
        k.rect(7, 36, 10, 4, stone[1]);
        // Elfe drapée, le bras levé tenant un globe de lumière ; longs cheveux, oreilles pointues, plis de la robe.
        k.poly(
          [
            [5, 37],
            [19, 37],
            [16, 21],
            [8, 21]
          ],
          stone[1]
        );
        k.poly(
          [
            [5, 37],
            [9, 37],
            [10, 21],
            [8, 21]
          ],
          stone[0]
        );
        k.poly(
          [
            [15, 37],
            [19, 37],
            [16, 21],
            [14, 21]
          ],
          stone[2]
        );
        for (const x of [9, 12, 15]) k.rect(x, 27, 1, 9, stone[2]);
        k.rect(8, 20, 8, 2, stone[2]);
        k.rect(9, 14, 6, 7, stone[1]);
        k.rect(9, 14, 2, 7, stone[0]);
        k.line(14, 15, 18, 8, stone[1], 2);
        k.line(10, 16, 13, 19, stone[2], 2);
        k.disc(12, 10, 3, stone[1]);
        k.rect(10, 9, 2, 2, stone[0]);
        k.rect(8, 8, 2, 12, stone[2]);
        k.rect(15, 8, 1, 9, stone[2]);
        k.rect(9, 6, 6, 2, stone[2]);
        k.px(7, 9, stone[1]);
        k.px(16, 9, stone[1]);
        k.disc(19, 5, 3, '#bfffee');
        k.rect(18, 4, 2, 1, '#ffffff');
        for (const x of [4, 18]) k.rect(x, 38, 3, 2, MOSS[1]);
        for (let y = 40; y < 50; y += 3) k.px(5 + (y % 2) * 12, y, MOSS[2]);
      } else if (kind === 'stagstatue') {
        k.rect(4, 32, 36, 8, stone[2]);
        k.rect(4, 32, 36, 2, stone[0]);
        k.rect(10, 18, 20, 9, stone[1]);
        k.rect(10, 18, 20, 2, stone[0]);
        for (const lx of [11, 15, 25, 28]) k.rect(lx, 27, 2, 5, stone[2]);
        k.rect(27, 10, 5, 10, stone[1]);
        k.rect(29, 6, 8, 6, stone[0]);
        for (const [x, y] of [
          [30, 4],
          [29, 2],
          [28, 0],
          [32, 3],
          [33, 1],
          [35, 2]
        ])
          k.px(x, y, stone[2]);
        k.rect(4, 30, 4, 2, MOSS[1]);
      } else if (kind === 'birdhouses') {
        for (const [x, top, col] of [
          [8, 10, '#c8784a'],
          [22, 2, '#7a9a5a'],
          [36, 14, '#c8a050']
        ]) {
          k.rect(x - 1, top + 10, 2, 44 - top - 10, '#6a4426');
          k.rect(x - 5, top + 4, 10, 8, col);
          k.poly(
            [
              [x - 7, top + 5],
              [x, top - 1],
              [x + 7, top + 5]
            ],
            '#8a5a34'
          );
          k.disc(x, top + 8, 1.5, '#2a1a10');
        }
      } else if (kind === 'birdbath') {
        k.rect(8, 12, 6, 12, stone[2]);
        k.rect(5, 22, 12, 4, stone[1]);
        k.rect(1, 6, 20, 6, stone[1]);
        k.rect(1, 6, 20, 1, stone[0]);
        k.rect(3, 7, 16, 3, '#8ad8e8');
        k.rect(4, 7, 4, 1, '#e8ffff');
      } else if (kind === 'bench') {
        k.rect(4, 8, 36, 3, '#a8784a');
        k.rect(4, 12, 36, 3, '#8a5e38');
        k.rect(4, 16, 36, 2, '#6a4426');
        for (const x of [5, 37]) {
          k.rect(x, 16, 2, 6, '#5a3a22');
          kit.branch(k, kit.bez([x, 16], [x - 3, 8], [x + 1, 4]), 2, [BARK[0], BARK[1], BARK[2]]);
        }
        k.px(6, 4, LEAF[1]);
        k.px(38, 4, LEAF[1]);
      } else if (kind === 'topiary') {
        k.rect(6, 24, 10, 8, '#b8784a');
        k.rect(6, 24, 10, 2, '#d8986a');
        k.rect(10, 18, 2, 6, BARK[2]);
        cluster(k, kit, 11, 11, 9, LEAF, 2, 1);
        k.px(8, 7, FLOWERS[1]);
        k.px(14, 10, FLOWERS[0]);
      } else if (kind === 'arch') {
        for (const x of [4, 50]) k.rect(x, 20, 3, 40, '#6a4426');
        const pts = [];
        for (let a = 0; a <= 20; a++)
          pts.push([28 - Math.cos((a / 20) * Math.PI) * 24, 22 - Math.sin((a / 20) * Math.PI) * 18]);
        kit.branch(k, pts, 3, [BARK[0], BARK[1], BARK[2]]);
        for (let i = 0; i < 40; i++) {
          const a = noise(i, 6) * Math.PI,
            r = 24 + (noise(6, i) - 0.5) * 6;
          k.rect(
            28 - Math.cos(a) * r,
            22 - Math.sin(a) * r * 0.75,
            2,
            2,
            i % 3 ? LEAF[1 + (i % 2)] : FLOWERS[i % FLOWERS.length]
          );
        }
        for (const x of [4, 50]) hang(k, x + 1, 22, 26, x);
      } else if (kind === 'pond') {
        // Margelle de pierres moussues ; l'eau, les nénuphars et les rides sont dessinés à part.
        for (let a = 0; a < Math.PI * 2; a += 0.06) {
          const x = 60 + Math.cos(a) * 56,
            y = 38 + Math.sin(a) * 30;
          k.disc(x, y, 4, Math.sin(a * 5) > 0 ? '#a8a498' : '#c4c0b4');
          if (Math.sin(a * 7) > 0.7) k.rect(x - 2, y - 4, 4, 2, MOSS[Math.floor(a * 2) % 3]);
        }
        for (const [x, y] of [
          [14, 20],
          [104, 22],
          [20, 56],
          [100, 58]
        ])
          for (let j = 0; j < 4; j++)
            k.rect(x + j * 2, y - 10 - (j % 2) * 3, 1, 10 + (j % 2) * 3, j % 2 ? '#5aa448' : '#3e7a36');
      }
    });
  }
  // Eau d'un étang (sous la margelle) : animée, avec reflets, nénuphars fleuris et rides.
  function pondWater(c, X, Y, w, h) {
    c.save();
    c.fillStyle = '#2e7a8a';
    c.beginPath();
    c.ellipse(X, Y, w, h, 0, 0, Math.PI * 2);
    c.fill();
    c.clip();
    c.fillStyle = '#4aa0b0';
    for (let i = 0; i < 6; i++)
      c.fillRect(
        Math.round(X - w + ((i * 37 + time * 0.3) % (w * 2))),
        Math.round(Y - h + i * (h / 3)),
        18,
        2
      );
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 4; i++)
      c.fillRect(
        Math.round(X - w * 0.6 + i * 28),
        Math.round(Y - h * 0.5 + (i % 2) * 10 + Math.sin(time * 0.05 + i) * 2),
        6,
        2
      );
    for (const [dx, dy, f] of [
      [-0.5, 0.2, 0],
      [0.3, -0.3, 1],
      [0.55, 0.35, 2],
      [-0.15, -0.45, 3]
    ]) {
      const x = X + dx * w,
        y = Y + dy * h;
      c.fillStyle = '#4e9a3a';
      c.beginPath();
      c.ellipse(x, y, 9, 5, 0, 0.3, Math.PI * 2 - 0.3);
      c.fill();
      if (f % 2 === 0) {
        c.fillStyle = f ? '#ffffff' : '#f6a0d8';
        c.fillRect(Math.round(x - 2), Math.round(y - 3), 5, 4);
        c.fillStyle = '#fff0a0';
        c.fillRect(Math.round(x), Math.round(y - 2), 2, 2);
      }
    }
    c.restore();
  }
  // ---------------------------------------------------------------- Animaux elfiques
  function animal(kind, face, step) {
    const leg = step ? 1 : 0,
      flip = face === 3,
      size = {
        stag: [26, 26],
        unicorn: [26, 26],
        fox: [20, 13],
        peacock: [16, 18],
        peacockFan: [28, 22],
        swan: [16, 12],
        rabbit: [10, 9],
        owl: [10, 12]
      }[kind] || [12, 12];
    return paint('animal:' + kind + face + step, size[0], size[1], k => {
      const R = (x, y, w, h, col) => k.rect(flip ? size[0] - x - w : x, y, w, h, col);
      if (kind === 'stag' || kind === 'unicorn') {
        const body = kind === 'stag' ? ['#ffffff', '#ece8e0', '#c8c0b0'] : ['#ffffff', '#f4f0ff', '#d8d0e8'];
        R(5, 12, 14, 7, body[1]);
        R(5, 12, 14, 2, body[0]);
        R(5, 17, 14, 2, body[2]);
        for (const [lx, o] of [
          [6, leg],
          [9, -leg],
          [15, leg],
          [18, -leg]
        ])
          R(lx, 19, 2, 6 + o, body[2]);
        R(17, 6, 4, 8, body[1]);
        R(19, 4, 6, 5, body[0]);
        R(23, 6, 2, 2, '#3a3040');
        R(21, 5, 1, 1, '#1a1a20');
        if (kind === 'stag') {
          for (const [x, y] of [
            [19, 3],
            [18, 1],
            [17, 0],
            [20, 1],
            [21, 0],
            [22, 2],
            [23, 1]
          ])
            R(x, y, 1, 1, '#f0d060');
          R(3, 12, 3, 2, '#ffffff');
        } else {
          R(23, 1, 1, 3, '#f0d060');
          R(24, 0, 1, 2, '#fff4b0');
          ['#f6a0d0', '#c8a8ff', '#9affe0', '#fff0a0'].forEach((col, i) => R(16 - i, 5 + i * 2, 3, 2, col));
          ['#f6a0d0', '#c8a8ff', '#9affe0'].forEach((col, i) => R(2 - i, 12 + i * 2, 4, 2, col));
        }
      } else if (kind === 'fox') {
        // Renard sylvestre : pelage vert-gris, ventre crème, queue à pointe de feuille lumineuse.
        R(5, 5, 10, 5, '#7aa88a');
        R(5, 8, 10, 2, '#e8e0c8');
        for (const [lx, o] of [
          [6, leg],
          [8, -leg],
          [12, leg],
          [14, -leg]
        ])
          R(lx, 10, 1, 3 + o, '#4a6a54');
        R(14, 2, 5, 4, '#7aa88a');
        R(14, 0, 1, 2, '#4a6a54');
        R(17, 0, 1, 2, '#4a6a54');
        R(18, 3, 2, 2, '#e8e0c8');
        R(16, 3, 1, 1, '#1a1a1a');
        R(0, 3, 6, 3, '#7aa88a');
        R(0, 2, 3, 2, '#9affb0');
        R(0, 3, 1, 1, '#e8ffe0');
      } else if (kind === 'peacock' || kind === 'peacockFan') {
        const fan = kind === 'peacockFan';
        if (fan) {
          for (let i = 0; i < 9; i++) {
            const a = Math.PI + (i / 8) * Math.PI;
            for (let r = 2; r < 11; r++)
              R(10 + Math.cos(a) * r, 14 + Math.sin(a) * r, 1, 1, r > 8 ? '#ffffff' : '#ece8e0');
            R(10 + Math.cos(a) * 9, 14 + Math.sin(a) * 9, 2, 2, '#5ac8c8');
          }
        } else for (let i = 0; i < 8; i++) R(1 + i, 10 + (i % 2), 1, 4, '#ece8e0');
        const ox = fan ? 6 : 6;
        R(ox, 10, 6, 5, '#ffffff');
        R(ox + 4, 4, 2, 7, '#ffffff');
        R(ox + 5, 2, 3, 3, '#ffffff');
        R(ox + 8, 3, 1, 1, '#c8a038');
        R(ox + 6, 3, 1, 1, '#2a2a2a');
        R(ox + 5, 0, 1, 2, '#5ac8c8');
        R(ox + 7, 0, 1, 2, '#5ac8c8');
        R(ox + 1, 15, 1, 3, '#c8a038');
        R(ox + 4, 15, 1, 3, '#c8a038');
      } else if (kind === 'swan') {
        R(1, 6, 11, 5, '#ffffff');
        R(1, 9, 11, 2, '#e8e8f0');
        R(10, 1, 2, 7, '#ffffff');
        R(10, 0, 4, 2, '#ffffff');
        R(14, 1, 2, 1, '#f08a3a');
        R(12, 0, 1, 1, '#1a1a1a');
        R(3, 5, 5, 2, '#f4f4f8');
      } else if (kind === 'rabbit') {
        R(1, 4, 7, 4, '#f4f0e8');
        R(6, 1, 3, 4, '#f4f0e8');
        R(6, 0, 1, 2, '#ffc8d0');
        R(8, 0, 1, 2, '#ffc8d0');
        R(8, 3, 1, 1, '#2a2020');
        R(0, 5, 2, 2, '#ffffff');
        R(2, 8, 2, 1, '#d8d0c0');
        R(6, 8, 2, 1, '#d8d0c0');
      } else {
        R(1, 2, 8, 9, '#8a6a48');
        R(2, 5, 6, 6, '#e8d8b8');
        R(1, 1, 2, 2, '#6a4a30');
        R(7, 1, 2, 2, '#6a4a30');
        R(2, 3, 3, 3, '#ffd36d');
        R(5, 3, 3, 3, '#ffd36d');
        R(3, 4, 1, 1, '#1a1010');
        R(6, 4, 1, 1, '#1a1010');
        R(4, 6, 2, 1, '#c8a038');
      }
    });
  }
  registerTrees();
  window.CANAAN_ELVEN_ART = Object.freeze({
    TREE,
    FOUNT,
    PROP_SIZE,
    tree,
    face,
    fountain,
    fountainFx,
    prop,
    pondWater,
    animal,
    registerTrees
  });
})();
