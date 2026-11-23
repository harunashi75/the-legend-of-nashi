// Extension 1 — la Vallée des Héros : pixel art de ses lieux et de ses montures, avec le kit commun
// (client/art/pixel-kit.js : même pinceau, même contour d'encre, même modelé et même grille de gros pixels de 2 que les
// bâtiments, les portails et les créatures du jeu). Rien n'est dessiné ici à chaque image : chaque sprite est peint une
// fois, gardé, puis posé par vallee.js et valerion.js.
// - Montures de la vallée : licorne, pégase, lion, griffon, bélier, coq et aigle, avec les outils de mount-art.js.
// - Statues des héros (huit poses), statue de l'Aurore (marbre et or), statues de l'arène de Valérion.
// - Écurie des Héros, moulin (tour et ailes), clôtures, auge, bottes de foin, pont de pierre, dalles de l'arène.
(() => {
  'use strict';
  const { brush, outline, polish, makeCanvas, hashGrid: hash } = CANAAN_PIXEL_KIT;
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
  const P = s => s.split(',').map(p => p.trim().split(/\s+/).map(Number));

  // ---------------------------------------------------------------- Montures de la vallée
  // Repère et outils : scripts/mount-art.js (profil tourné vers la droite, (0, 0) au sol sous la selle).
  const {
    define,
    horse,
    quad,
    bird,
    feline,
    ell,
    shape,
    twin,
    twinPoly,
    eyeSide,
    eyesFront,
    TAILS,
    tailDown,
    CAT,
    HOOF
  } = CANAAN_MOUNT_ART.tools;
  define('unicorn', horse({ horn: true }));
  define('pegasus', horse({ wings: true }));
  define(
    'lion',
    quad({
      ...CAT,
      ...feline({ maned: true }),
      tail: TAILS.thin,
      tailBack: tailDown(M => M.coat[1], 2, 12)
    })
  );
  // Griffon : corps de lion, tête, ailes et serres d'aigle.
  define(
    'griffon',
    quad({
      ...CAT,
      hgt: 16,
      chest: [7, 7],
      wide: 9,
      wings: 'feather',
      faceDy: -2,
      tail: TAILS.thin,
      tailBack: tailDown(M => M.coat[1], 2, 12),
      deco(k, M, cy) {
        for (let i = 0; i < 5; i++) k.rect(7 + i * 2, cy - 3 + (i % 2) * 3, 3, 4, M.mane[i % 2]);
      },
      head(k, M, o, x, y) {
        shape(k, x, y, '-8 1, -2 -6, 2 -12, 8 -12, 7 -3, 5 6, -1 9, -6 7', M.mane[0]);
        for (const [a, b] of [[-4, 0], [-1, -4], [1, 2], [3, -2], [-2, 5], [2, 6]]) k.rect(x + a, y + b, 3, 2, M.mane[1]); // prettier-ignore
        shape(k, x, y, '1 -14, -3 -19, 5 -15', M.mane[1]);
        ell(k, x + 6, y - 11, 5, 4, M.mane[0]);
        shape(k, x, y, '10 -14, 15 -13, 17 -9, 15 -6, 14 -9, 10 -8', '#f0b830');
        k.rect(x + 10, y - 10, 4, 1, '#a8701a');
        eyeSide(k, x + 8, y - 13, M.eye);
      },
      face(k, M, y) {
        twinPoly(k, [[-5, y - 3], [-7, y - 10], [-2, y - 5]], M.mane[1]); // prettier-ignore
        ell(k, 0, y, 6, 6, M.mane[0]);
        ell(k, 0, y + 8, 6, 4, M.mane[0]);
        for (const x of [-4, 0, 3]) k.rect(x, y + 8, 2, 3, M.mane[1]);
        k.poly([[-2, y], [3, y], [2, y + 4], [0.5, y + 7], [-1, y + 4]], '#f0b830'); // prettier-ignore
        eyesFront(k, -5, y - 2, M.eye);
      },
      nape(k, M, y) {
        twinPoly(k, [[-5, y - 2], [-7, y - 9], [-2, y - 4]], M.mane[1]); // prettier-ignore
        ell(k, 0, y, 6, 6, M.mane[0]);
        for (const x of [-4, 0, 3]) k.rect(x, y + 1, 2, 3, M.mane[1]);
      }
    })
  );
  // Corne enroulée du bélier.
  function horn(k, x, y, M) {
    k.disc(x, y, 5, M.mane[1]);
    k.disc(x, y, 4, M.mane[0]);
    k.disc(x + 1, y + 1, 2, M.mane[1]);
    k.px(x + 1, y + 1, M.mane[0]);
  }
  define(
    'ram',
    quad({
      hgt: 15,
      len: 8,
      rump: [7, 7],
      belly: [11, 7],
      chest: [7, 7],
      wide: 10,
      foot: 'hoof',
      faceDy: -4,
      tail: TAILS.short,
      tailBack: (k, M, o, cy) => ell(k, 0, cy, 3, 4, M.coat[0]),
      // Toison bouclée.
      deco(k, M, cy) {
        for (let i = 0; i < 26; i++) {
          const x = -14 + Math.floor(hash(i, 3) * 28),
            y = -6 + Math.floor(hash(i, 8) * 12);
          k.rect(x, cy + y, 3, 1, M.coat[2]);
          k.px(x + 2, cy + y - 1, M.coat[0]);
        }
      },
      sides(k, M, cy, half) {
        for (let i = 0; i < 12; i++)
          k.rect(
            -half + 2 + Math.floor(hash(i, 4) * (half * 2 - 5)),
            cy - 5 + Math.floor(hash(i, 6) * 10),
            3,
            1,
            M.coat[2]
          );
      },
      head(k, M, o, x, y) {
        const face = '#5a4a3e';
        ell(k, x, y - 2, 6, 7, M.coat[1]);
        shape(k, x, y, '2 -11, 8 -12, 15 -5, 14 -1, 8 -2, 3 -4', face);
        k.rect(x + 13, y - 4, 2, 2, HOOF);
        k.rect(x + 3, y - 12, 6, 3, M.coat[0]);
        eyeSide(k, x + 9, y - 9, '#e8c050');
        horn(k, x + 2, y - 7, M);
      },
      face(k, M, y) {
        for (const x of [-8, 7]) horn(k, x, y - 1, M);
        shape(k, 0, y, '-5 -4, 6 -4, 4 4, 3 8, -2 8, -3 4', '#5a4a3e');
        k.rect(-4, y - 7, 9, 4, M.coat[0]);
        twin(k, -2, y + 5, 1, 2, HOOF);
        eyesFront(k, -4, y - 1, '#e8c050');
      },
      nape(k, M, y) {
        for (const x of [-8, 7]) horn(k, x, y, M);
        ell(k, 0, y, 6, 5, M.coat[0]);
      }
    })
  );
  // Coq : crête dentelée, barbillon, queue en faucille.
  define(
    'rooster',
    bird({
      neck: 12,
      tail: 'hook',
      crest(k, M, x, y, view) {
        if (view === 'side') {
          shape(k, x, y, '-5 3, -5 -2, -3 0, -1 -4, 1 0, 3 -3, 4 3', M.crest);
          shape(k, x, y, '4 6, 7 6, 6 11, 4 10', M.crest);
        } else {
          k.rect(0, y - 4, 2, 5, M.crest);
          k.rect(-1, y - 1, 4, 2, M.crest);
        }
      }
    })
  );
  define('eagle', bird({ neck: 8, wings: true, hooked: true, headCol: M => M.mane[0], crest() {} }));

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
