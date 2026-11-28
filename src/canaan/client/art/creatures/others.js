// Art des créatures : morts-vivants et esprits, créatures célestes, constructions et êtres de pierre, végétaux et
// champignons, feu et horreurs. Le rendu est dans client/art/creature-art.js.
// Module ES (src/canaan/client/).
import { shade, tint } from '../pixel-kit.js';
import {
  INK,
  WHITE,
  BONE,
  CLAW,
  BLOOD,
  IRON,
  GOLD,
  pts,
  xy,
  ell,
  tube,
  ghost,
  limb,
  eye,
  crown,
  speckle,
  registry
} from './kit.js';
import { item } from './humanoids.js';

// Morts-vivants, célestes, constructions, végétaux, feu et horreurs : registre de la famille, rassemblé par client/art/creature-art.js.
const { list: OTHERS, species } = registry();
export { OTHERS };

// ---------------------------------------------------------------- Morts-vivants et esprits
// Squelette : os nus, crâne aux orbites luisantes, côtes. Options : `hold`, `off` (armes), `head` (helm, crown,
// miner), `beard` (os de barbe naine), `small` (osselet).
species('skeleton', (k, pal, o) => {
  const [m, dk, lt, ac, ey] = pal,
    small = !!o.small,
    oy = small ? 6 : 0,
    bone = o.bone || m;
  // Jambes et bassin
  k.rect(12, 26 + oy, 2, 10 - oy, bone);
  k.rect(18, 26 + oy, 2, 10 - oy, bone);
  k.rect(11, 30 + oy / 2, 3, 1, dk);
  k.rect(18, 30 + oy / 2, 3, 1, dk);
  k.rect(10, 34, 5, 2, bone);
  k.rect(17, 34, 5, 2, bone);
  k.rect(11, 24 + oy, 10, 3, bone);
  // Colonne et côtes
  k.rect(15, 14 + oy, 2, 10, bone);
  for (let i = 0; i < 4; i++) k.rect(11, 15 + oy + i * 2, 10, 1, i % 2 ? dk : bone);
  // Bras
  k.rect(9, 14 + oy, 2, 6, bone);
  k.rect(21, 14 + oy, 2, 6, bone);
  k.rect(8, 20 + oy, 2, 6, bone);
  k.rect(22, 20 + oy, 2, 6, bone);
  // Crâne
  k.rect(11, 4 + oy, 10, 8, lt);
  k.rect(12, 12 + oy, 8, 2, bone);
  k.rect(12, 7 + oy, 3, 3, INK);
  k.rect(17, 7 + oy, 3, 3, INK);
  k.px(13, 8 + oy, ey);
  k.px(18, 8 + oy, ey);
  k.px(16, 10 + oy, INK);
  for (let x = 13; x < 20; x += 2) k.px(x, 13 + oy, INK);
  if (o.beard) k.poly(xy(11, 12 + oy, 21, 12 + oy, 19, 19 + oy, 16, 21 + oy, 13, 19 + oy), o.beard);
  if (o.rags) {
    k.poly(xy(10, 14 + oy, 22, 14 + oy, 21, 22 + oy, 18, 20 + oy, 15, 23 + oy, 12, 20 + oy), o.rags);
  }
  const hd = o.head;
  if (hd === 'helm' || hd === 'miner') {
    k.rect(10, 2 + oy, 12, 4, IRON[1]);
    k.rect(10, 2 + oy, 12, 1, IRON[0]);
    if (hd === 'miner') {
      k.rect(14, 0 + oy, 4, 3, GOLD[1]);
      ghost(k, 0.3, () => k.disc(16, 1 + oy, 4, GOLD[0]));
    }
  } else if (hd === 'crown' || o.crown) crown(k, 11, 1 + oy, 10);
  else if (hd === 'hood') {
    k.rect(10, 2 + oy, 12, 4, ac);
    k.rect(9, 4 + oy, 2, 9, ac);
    k.rect(21, 4 + oy, 2, 9, ac);
  }
  const p = [m, dk, lt, ac, ey];
  item(k, o.off === undefined ? 'shield' : o.off, 6, 25 + oy, p, IRON, -1);
  item(k, o.hold === undefined ? 'sword' : o.hold, 23, 25 + oy, p, IRON, 1);
  if (o.elite) {
    ghost(k, 0.5, () => {
      k.disc(13, 8 + oy, 2, ey);
      k.disc(18, 8 + oy, 2, ey);
    });
    k.rect(9, 13 + oy, 4, 3, IRON[1]);
    k.rect(19, 13 + oy, 4, 3, IRON[1]);
    k.px(10, 12 + oy, IRON[0]);
    k.px(21, 12 + oy, IRON[0]);
  }
});
// Spectre : drap fantomatique à la traîne effilochée, bras tendus, orbites creuses. Options : `chains`, `veil`,
// `miner` (casque et lanterne), `crown`, `weed` (algues du noyé), `small`, `wail` (bouche hurlante), `hands` (mains
// sur le visage).
species(
  'ghost',
  (k, [m, dk, lt, ac, ey], o) => {
    const s = o.small ? 4 : 0;
    ghost(k, 0.85, () => {
      for (let i = 0; i < 22 - s; i++) {
        const half = Math.max(2, Math.round(8 - i * 0.28 - s / 2));
        k.rect(16 - half + Math.round(Math.sin(i * 0.6) * 1.5), 12 + s + i, half * 2, 1, m);
      }
      k.disc(16, 11 + s, 7 - s / 2, m);
      // Bras
      k.poly(xy(10, 15 + s, 3, 20 + s, 4, 23 + s, 11, 20 + s), m);
      k.poly(xy(22, 15 + s, 29, 20 + s, 28, 23 + s, 21, 20 + s), m);
    });
    k.rect(11, 7 + s, 8, 3, lt);
    ghost(k, 0.5, () => {
      for (let y = 26; y < 36; y += 3) k.px(13 + (y % 2) * 5, y, lt);
    });
    if (o.veil) {
      ghost(k, 0.85, () =>
        k.poly(xy(8, 10 + s, 16, 2 + s, 24, 10 + s, 26, 30, 6, 30), o.veil === true ? WHITE : o.veil)
      );
      k.rect(10, 5 + s, 12, 2, ac);
    }
    if (o.hands) {
      k.rect(11, 10 + s, 4, 4, lt);
      k.rect(17, 10 + s, 4, 4, lt);
      ghost(k, 0.8, () => {
        k.rect(12, 14 + s, 1, 4, ey);
        k.rect(19, 14 + s, 1, 4, ey);
      });
    } else {
      k.rect(12, 10 + s, 3, 3, INK);
      k.rect(17, 10 + s, 3, 3, INK);
      k.px(13, 11 + s, ey);
      k.px(18, 11 + s, ey);
      if (o.wail) k.rect(14, 14 + s, 4, 5, INK);
      else k.rect(15, 15 + s, 2, 2, INK);
    }
    if (o.chains) {
      for (let i = 0; i < 8; i++) k.px(6 + i * 2, 20 + i, i % 2 ? IRON[0] : IRON[2]);
      k.rect(2, 22, 3, 3, IRON[2]);
      k.rect(26, 22, 3, 3, IRON[2]);
    }
    if (o.miner) {
      k.rect(10, 3 + s, 12, 3, IRON[1]);
      k.rect(14, 1 + s, 4, 3, GOLD[1]);
      ghost(k, 0.3, () => k.disc(16, 2 + s, 5, GOLD[0]));
      item(k, 'pickaxe', 27, 23, [m, dk, lt, ac], IRON, 1);
    }
    if (o.weed) for (const [x, y] of pts('9 14, 22 12, 12 24, 20 28')) k.line(x, y, x + 1, y + 6, '#3a7a5a');
    if (o.crown) crown(k, 12, 2 + s, 8);
    if (o.eclipse) {
      k.disc(16, 2, 4, ac);
      k.disc(17, 2, 3, INK);
    }
    if (o.elite) {
      ghost(k, 0.4, () => k.disc(16, 18, 13, ac));
      for (let i = 0; i < 6; i++) k.px(4 + i * 5, 30 + (i % 2) * 3, ac);
    }
  },
  { legs: false, float: true }
);
// Âme : flamme spectrale en forme de larme, visage douloureux. `wail` : bouche ouverte.
species(
  'soul',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.4, () => k.disc(16, 22, 10, m));
    ghost(k, 0.85, () => {
      k.poly(pts('9 24, 12 12, 14 15, 16 6, 19 14, 21 11, 23 24, 20 32, 12 32'), m);
    });
    k.disc(16, 24, 5, lt);
    k.rect(13, 22, 2, 2, INK);
    k.rect(18, 22, 2, 2, INK);
    k.rect(15, 26, 3, o.wail ? 4 : 1, INK);
    ghost(k, 0.6, () => k.poly(pts('12 32, 16 37, 20 32'), m));
    if (o.chains) for (let i = 0; i < 6; i++) k.px(9 + i * 3, 30 - (i % 2), IRON[0]);
    if (o.elite) ghost(k, 0.5, () => k.disc(16, 20, 13, ac));
  },
  { legs: false, float: true }
);

// ---------------------------------------------------------------- Créatures célestes
// Ange : ailes de plumes, robe, auréole. Options : `wings6` (six ailes), `dark` (ailes noires, auréole brisée),
// `child` (chérubin joufflu), `blind` (bandeau de juge et balance), `armor` (archonte à la lance), `storm` (éclairs).
species(
  'angel',
  (k, pal, o) => {
    const [m, dk, lt, ac, ey] = pal,
      child = !!o.child,
      oy = child ? 8 : 0,
      plume = o.dark ? '#2a2230' : lt,
      edge = o.dark ? '#4a3e58' : dk;
    const wing = (y, h, spread) => {
      for (const side of [-1, 1]) {
        const f = x => (side < 0 ? 32 - x : x);
        k.poly(
          xy(
            f(19),
            y + 2,
            f(26 + spread),
            y - 2,
            f(32),
            y + 1,
            f(31),
            y + h - 4,
            f(26),
            y + h,
            f(21),
            y + h - 3
          ),
          plume
        );
        for (let i = 0; i < 3; i++) k.line(f(22 + i * 3), y + 3, f(23 + i * 3), y + h - 3 - i, edge);
      }
    };
    if (o.wings6) wing(oy + 1, 10, 0);
    wing(oy + 9, child ? 10 : 17, 1);
    if (o.wings6) wing(oy + 22, 8, -1);
    // Robe
    const top = 15 + oy;
    for (let i = 0; i < 36 - top; i++) {
      const half = Math.round((child ? 4 : 4) + i * (child ? 0.3 : 0.4));
      k.rect(16 - half, top + i, half * 2, 1, m);
    }
    k.rect(15, top + 2, 2, 36 - top - 2, dk);
    k.rect(9, 34, 14, 2, ac);
    k.rect(12, top + 5, 8, 2, ac);
    if (o.armor) {
      k.rect(11, top, 10, 7, IRON[0]);
      k.rect(11, top, 10, 1, WHITE);
      k.rect(8, top - 1, 4, 3, IRON[0]);
      k.rect(20, top - 1, 4, 3, IRON[0]);
    }
    // Tête
    const skin = o.dark ? '#c8b8c8' : '#f4e0c8';
    k.rect(13, 5 + oy, 6, child ? 9 : 8, skin);
    if (child) k.rect(12, 7 + oy, 8, 6, skin);
    k.rect(12, 4 + oy, 8, 3, o.hair || ac);
    if (o.blind) k.rect(12, 8 + oy, 8, 2, '#f0ece4');
    else {
      k.px(14, 8 + oy, ey);
      k.px(17, 8 + oy, ey);
    }
    // Auréole
    if (o.dark) {
      k.rect(11, 1 + oy, 4, 1, '#8a7a5a');
      k.rect(17, 0 + oy, 4, 1, '#8a7a5a');
    } else {
      k.rect(11, 1 + oy, 10, 1, GOLD[0]);
      k.px(10, 2 + oy, GOLD[0]);
      k.px(21, 2 + oy, GOLD[0]);
    }
    // Ce qu'il tient
    const hold = o.hold || (o.blind ? 'scales' : o.armor ? 'spear' : child ? 'bow' : 'sword');
    item(k, hold, 23, top + 10, pal, o.dark ? IRON : [WHITE, '#e0e8f0', '#a0a8b8', '#6a7080'], 1);
    k.rect(21, top + 7, 3, 4, m);
    if (o.storm)
      for (const [x, y] of pts('3 6, 28 4, 5 30')) {
        k.line(x, y, x + 2, y + 3, '#fff060');
        k.line(x + 2, y + 3, x, y + 6, '#fff060');
      }
    if (o.elite) crown(k, 12, oy, 8);
  },
  { legs: false, float: true }
);

// ---------------------------------------------------------------- Constructions et êtres de pierre
// Golem : corps de blocs (l'auréole `halo` est tracée par sprite-kit.js au-dessus de la tête). Styles (`style`) : rock (rochers moussus), crystal (cristaux), astral (pièces flottantes
// et étoiles), ice (géant de glace), metal (plaques rivetées), sun (tête en disque solaire), statue (guerrier taillé à
// l'écu et au heaume), lava (scories et magma).
species(
  'golem',
  (k, [m, dk, lt, ac, ey], o) => {
    const st = o.style || 'rock',
      floaty = st === 'astral';
    const gap = floaty ? 2 : 0;
    // Jambes
    k.rect(8, 27 + gap, 6, 9 - gap, dk);
    k.rect(18, 27 + gap, 6, 9 - gap, dk);
    k.rect(7, 34, 8, 2, shade(dk, 0.8));
    k.rect(17, 34, 8, 2, shade(dk, 0.8));
    // Torse
    if (st === 'statue') {
      k.rect(8, 12, 16, 15, m);
      k.rect(8, 12, 16, 2, lt);
      k.rect(14, 15, 4, 10, dk);
    } else {
      k.rect(6, 12, 20, 15, m);
      k.rect(6, 12, 20, 3, lt);
      k.rect(6, 24, 20, 3, dk);
    }
    // Bras
    k.rect(1 - gap, 13, 6, 14, m);
    k.rect(25 + gap, 13, 6, 14, m);
    k.rect(0 - gap, 26, 8, 5, dk);
    k.rect(24 + gap, 26, 8, 5, dk);
    k.rect(4, 10, 6, 4, lt);
    k.rect(22, 10, 6, 4, lt);
    // Tête
    if (st === 'sun') {
      for (let a = 0; a < 8; a++) {
        const r = (a * Math.PI) / 4;
        k.line(16 + Math.cos(r) * 5, 6 + Math.sin(r) * 5, 16 + Math.cos(r) * 8, 6 + Math.sin(r) * 8, ac);
      }
      k.disc(16, 6, 5, GOLD[1]);
      k.disc(16, 6, 3, GOLD[0]);
      eye(k, 13, 5, ey, true);
      eye(k, 17, 5, ey, true);
    } else if (st === 'statue') {
      k.rect(11, 2, 10, 10, m);
      k.rect(10, 1, 12, 4, lt);
      k.rect(12, 6, 8, 2, INK);
      k.px(13, 6, ey);
      k.px(18, 6, ey);
      k.rect(15, 0, 2, 3, ac);
    } else {
      k.rect(12, 4 - gap, 8, 8, m);
      k.rect(12, 4 - gap, 8, 2, lt);
      k.rect(13, 7 - gap, 6, 2, INK);
      k.px(14, 7 - gap, ey);
      k.px(17, 7 - gap, ey);
    }
    // Détails selon le style
    if (st === 'rock') {
      speckle(k, 6, 13, 20, 12, dk, 14, 19);
      k.line(10, 15, 12, 21, dk);
      k.line(20, 14, 18, 20, dk);
      k.rect(14, 16, 4, 4, ac);
      if (o.leafy) {
        k.rect(3, 6, 9, 5, '#4a8a3a');
        k.rect(20, 4, 10, 6, '#5a9a44');
        k.rect(11, 1, 10, 4, '#3e7a32');
        k.px(6, 5, '#8adc5a');
        k.px(24, 4, '#8adc5a');
      }
    } else if (st === 'crystal' || st === 'ice') {
      for (const [x, y, h] of pts('4 10 7, 8 9 5, 24 10 8, 27 11 5, 15 4 6'))
        k.poly(xy(x - 2, y, x, y - h, x + 2, y), ac);
      for (const [x, y] of pts('4 6, 24 5')) k.px(x, y, WHITE);
      k.poly(pts('12 15, 16 13, 20 15, 16 23'), ac);
      k.px(15, 15, WHITE);
      if (st === 'ice') for (let x = 7; x < 26; x += 3) k.rect(x, 27, 1, 2, '#e0f8ff');
    } else if (st === 'astral') {
      for (const [x, y] of pts('9 16, 22 19, 13 23, 19 14, 3 20, 28 18')) k.px(x, y, WHITE);
      k.disc(16, 19, 3, ac);
      k.px(16, 19, WHITE);
      ghost(k, 0.4, () => k.disc(16, 19, 6, ac));
    } else if (st === 'metal') {
      for (const [x, y] of pts('8 14, 23 14, 8 23, 23 23, 3 15, 28 15')) k.px(x, y, lt);
      k.rect(12, 16, 8, 6, shade(m, 1.15));
      k.rect(13, 17, 6, 1, WHITE);
      k.rect(15, 19, 2, 2, ac);
      if (o.gear) {
        k.disc(16, 19, 4, GOLD[2]);
        k.disc(16, 19, 2, ac);
        for (const [x, y] of pts('16 14, 21 19, 16 24, 11 19')) k.rect(x - 1, y - 1, 2, 2, GOLD[2]);
      }
    } else if (st === 'statue') {
      item(k, 'towershield', 4, 26, [m, dk, lt, ac], [lt, m, dk, INK], -1);
      item(k, 'sword', 26, 26, [m, dk, lt, ac], [lt, m, dk, INK], 1);
      k.line(10, 18, 12, 24, dk);
      k.px(20, 20, ac);
    } else if (st === 'sun') {
      k.disc(16, 19, 4, GOLD[1]);
      k.disc(16, 19, 2, WHITE);
    } else if (st === 'lava') {
      for (const [x0, y0, x1, y1] of pts('9 14 12 22, 20 13 17 21, 12 22 20 22, 3 16 4 24, 27 15 28 24'))
        k.line(x0, y0, x1, y1, ac);
      k.rect(14, 16, 4, 4, '#ffe07a');
      ghost(k, 0.4, () => k.disc(16, 18, 6, ac));
    }
    if (o.crown) crown(k, 12, 0, 8);
    if (o.elite) {
      for (const [x, y] of pts('5 9, 26 9, 16 2')) k.poly(xy(x - 2, y + 1, x, y - 4, x + 2, y + 1), ac);
      k.rect(6, 22, 20, 1, ac);
    }
  },
  { float: false }
);
// Rouage animé : grande roue dentée à l'œil unique, sur deux pattes de métal.
species(
  'gear',
  (k, [m, dk, lt, ac, ey], o) => {
    limb(k, pts('11 26, 8 31, 10 35'), 2, dk);
    limb(k, pts('21 26, 24 31, 22 35'), 2, dk);
    k.rect(7, 35, 5, 1, dk);
    k.rect(21, 35, 5, 1, dk);
    for (let a = 0; a < 10; a++) {
      const r = (a * Math.PI) / 5;
      k.rect(Math.round(16 + Math.cos(r) * 11) - 2, Math.round(18 + Math.sin(r) * 11) - 2, 4, 4, m);
    }
    k.disc(16, 18, 10, m);
    k.disc(16, 18, 8, lt);
    k.disc(16, 18, 6, m);
    for (let a = 0; a < 6; a++) {
      const r = (a * Math.PI) / 3;
      k.line(16, 18, 16 + Math.cos(r) * 7, 18 + Math.sin(r) * 7, dk);
    }
    k.disc(16, 18, 3, INK);
    k.disc(16, 18, 2, ey);
    k.px(15, 17, WHITE);
    if (o.elite) {
      k.disc(25, 9, 4, ac);
      k.disc(25, 9, 2, dk);
    }
  },
  { legs: true }
);
// Sablier vivant : verre et sable qui coule, cadre de bronze, bras de sable.
species(
  'hourglass',
  (k, [m, dk, lt, ac, ey], o) => {
    k.rect(6, 4, 20, 3, m);
    k.rect(6, 32, 20, 3, m);
    k.rect(7, 4, 2, 31, dk);
    k.rect(23, 4, 2, 31, dk);
    ghost(k, 0.55, () => {
      k.poly(pts('9 7, 23 7, 17 19, 15 19'), '#dceeff');
      k.poly(pts('15 20, 17 20, 23 32, 9 32'), '#dceeff');
    });
    k.poly(pts('11 9, 21 9, 17 15, 15 15'), ac);
    k.rect(15, 15, 2, 12, ac);
    k.poly(pts('11 32, 16 26, 21 32'), ac);
    eye(k, 12, 11, ey, true);
    eye(k, 18, 11, ey, true);
    ghost(k, 0.8, () => {
      k.poly(pts('6 18, 1 14, 0 20, 5 22'), ac);
      k.poly(pts('26 18, 31 14, 32 20, 27 22'), ac);
    });
    if (o.crown || o.elite) crown(k, 12, 0, 8);
    if (o.elite) for (const y of [6, 33]) for (const x of [6, 25]) k.disc(x, y, 1, GOLD[0]);
  },
  { legs: false, float: true }
);
// Balance éternelle : fléau doré géant porté par un pilier à visage, plateaux suspendus.
species(
  'scales',
  (k, [m, dk, lt, ac, ey], o) => {
    k.rect(10, 33, 12, 3, dk);
    k.rect(14, 8, 4, 26, m);
    k.rect(14, 8, 1, 26, lt);
    k.rect(1, 8, 30, 2, GOLD[1]);
    k.disc(16, 6, 3, GOLD[0]);
    for (const x of [3, 28]) {
      k.line(x, 10, x - 2, 20, GOLD[2]);
      k.line(x, 10, x + 2, 20, GOLD[2]);
      k.rect(x - 4, 20, 9, 2, GOLD[1]);
    }
    k.disc(2, 18, 2, ac);
    k.rect(27, 17, 3, 3, '#e8e8ff');
    k.rect(13, 14, 6, 6, m);
    eye(k, 14, 15, ey, true);
    k.rect(15, 18, 2, 1, INK);
    if (o.elite) {
      crown(k, 12, 0, 8);
      ghost(k, 0.4, () => k.disc(16, 16, 8, ac));
    }
  },
  { legs: false, float: true }
);
// Astrolabe vivant : anneaux d'orbite croisés autour d'un cœur-étoile.
species(
  'astrolabe',
  (k, [m, dk, lt, ac, ey], o) => {
    const ring = (rx, ry, col) => {
      for (let a = 0; a < 64; a++) {
        const r = (a * Math.PI) / 32;
        k.px(16 + Math.cos(r) * rx, 18 + Math.sin(r) * ry, col);
      }
    };
    ring(13, 5, m);
    ring(5, 13, lt);
    ring(11, 11, GOLD[1]);
    ring(12, 12, GOLD[2]);
    k.disc(16, 18, 4, ac);
    k.disc(16, 18, 2, WHITE);
    for (const [x, y] of pts('3 18, 29 18, 16 5, 16 31')) k.disc(x, y, 1, ey);
    k.rect(15, 31, 2, 4, dk);
    k.rect(11, 34, 10, 2, dk);
    if (o.elite) {
      ring(14, 3, ac);
      for (const [x, y] of pts('2 6, 30 6, 2 30, 30 30')) k.px(x, y, WHITE);
    }
  },
  { legs: false, float: true }
);
// Foreuse possédée : chariot de mine à foret géant, roues, œil de feu dans la cabine.
species(
  'drill',
  (k, [m, dk, lt, ac, ey], o) => {
    k.disc(9, 32, 3, IRON[3]);
    k.disc(21, 32, 3, IRON[3]);
    k.px(9, 32, IRON[0]);
    k.px(21, 32, IRON[0]);
    k.rect(3, 19, 22, 11, m);
    k.rect(3, 19, 22, 2, lt);
    k.rect(5, 23, 18, 1, dk);
    k.rect(6, 12, 10, 8, dk);
    k.rect(8, 14, 6, 4, INK);
    eye(k, 10, 15, ey, true);
    k.poly(pts('25 18, 32 24, 25 30'), ac);
    for (const x of [26, 28, 30]) k.line(x, 19 + (x - 25), x + 1, 29 - (x - 25), shade(ac, 0.6));
    k.rect(1, 14, 3, 7, IRON[2]);
    ghost(k, 0.4, () => {
      k.disc(2, 10, 2, '#a8a0a0');
      k.disc(4, 6, 3, '#a8a0a0');
    });
    if (o.elite) for (const x of [6, 11, 16, 21]) k.poly(xy(x, 19, x + 2, 15, x + 4, 19), IRON[0]);
  },
  { legs: false }
);

// ---------------------------------------------------------------- Végétaux et champignons
// Tréant : tronc à visage creusé, bras-branches, racines pour pieds, frondaison. `corrupt` : bois sombre et lueurs
// violettes ; `thorns` : ronces.
species('treant', (k, [m, dk, lt, ac, ey], o) => {
  const leaf = o.corrupt
    ? ['#4a2a5a', '#6a3a7a', '#9a5ac8']
    : o.thorns
      ? ['#4a6a2a', '#6a8a3a', '#a8c860']
      : ['#3e7a32', '#5a9a44', '#8adc5a'];
  // Frondaison
  ell(k, 16, 7, 12, 6, leaf[0]);
  ell(k, 10, 6, 6, 4, leaf[1]);
  ell(k, 22, 5, 6, 4, leaf[1]);
  speckle(k, 5, 2, 22, 9, leaf[2], 12, 23);
  // Racines
  for (const [x0, x1] of pts('10 4, 13 10, 19 22, 22 28')) k.line(x0, 31, x1, 36, dk, 2);
  // Tronc
  k.poly(pts('10 10, 22 10, 24 33, 8 33'), m);
  for (const x of [11, 15, 19]) k.line(x, 12, x + 1, 32, dk);
  k.rect(10, 10, 3, 22, lt);
  // Visage
  k.rect(12, 15, 3, 3, INK);
  k.rect(18, 15, 3, 3, INK);
  k.px(13, 16, ey);
  k.px(19, 16, ey);
  k.rect(13, 21, 7, 3, INK);
  // Bras-branches
  k.line(10, 15, 3, 13, m, 2);
  k.line(3, 13, 1, 9, m);
  k.line(4, 13, 3, 20, m);
  k.line(22, 15, 29, 18, m, 2);
  k.line(29, 18, 31, 14, m);
  k.line(29, 18, 31, 23, m);
  for (const [x, y] of pts('1 8, 31 13, 3 21')) k.disc(x, y, 1, leaf[1]);
  if (o.corrupt) {
    ghost(k, 0.5, () => {
      k.disc(13, 16, 2, ac);
      k.disc(19, 16, 2, ac);
    });
    for (const [x, y] of pts('14 27, 20 12, 9 24')) k.px(x, y, ac);
  }
  if (o.thorns)
    for (const [x, y] of pts('8 18, 24 22, 9 28, 23 14, 5 14, 27 17'))
      k.poly(xy(x, y, x + 1, y - 2, x + 2, y), '#d8c8a0');
  if (o.crown) crown(k, 12, 0, 8);
  if (o.elite) for (const [x, y] of pts('7 3, 24 2, 16 0')) k.disc(x, y, 1, ac);
});
// Myconide : grand chapeau tacheté, pied trapu à visage, petits bras, nuage de spores. `howl` : bouche hurlante ;
// `sacs` : sacs de spores ; `crown` : chapeau couronné.
species('mushroom', (k, [m, dk, lt, ac, ey], o) => {
  k.rect(11, 31, 4, 5, ac);
  k.rect(17, 31, 4, 5, ac);
  k.poly(pts('10 15, 22 15, 23 32, 9 32'), ac);
  k.rect(9, 15, 3, 16, tint(ac, 1.1));
  k.rect(5, 19, 4, 3, ac);
  k.rect(23, 19, 4, 3, ac);
  k.rect(4, 21, 2, 4, ac);
  k.rect(26, 21, 2, 4, ac);
  // Chapeau
  ell(k, 16, 11, 14, 7, m);
  k.rect(2, 13, 28, 3, dk);
  for (let x = 4; x < 29; x += 3) k.px(x, 15, shade(dk, 0.7));
  for (const [x, y, r] of pts('9 7 2, 19 6 2, 24 10 1, 13 11 1, 5 11 1')) k.disc(x, y, r, lt);
  // Visage
  k.px(13, 20, INK);
  k.px(18, 20, INK);
  eye(k, 12, 19, ey, o.elite);
  eye(k, 18, 19, ey, o.elite);
  if (o.howl) k.rect(14, 23, 4, 5, INK);
  else k.rect(14, 24, 4, 1, shade(ac, 0.6));
  if (o.sacs)
    for (const [x, y] of pts('6 27, 25 26')) {
      k.disc(x, y, 3, lt);
      k.px(x - 1, y - 1, WHITE);
    }
  ghost(k, 0.6, () => {
    for (const [x, y] of pts('3 4, 28 3, 1 18, 30 22, 16 1')) k.px(x, y, lt);
  });
  if (o.crown) crown(k, 12, 1, 8);
  if (o.elite) {
    ell(k, 26, 4, 4, 2, m);
    k.px(25, 3, lt);
    k.rect(25, 6, 2, 3, ac);
  }
});

// ---------------------------------------------------------------- Feu
// Élémentaire de feu : corps de flammes sans jambes, cœur incandescent, bras de braise. `rock` : scories et magma.
species(
  'elemental',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.35, () => k.disc(16, 20, 12, m));
    k.poly(pts('8 30, 6 18, 10 21, 11 9, 14 14, 16 3, 19 13, 22 8, 23 20, 27 16, 25 30, 16 36'), m);
    k.poly(pts('10 29, 11 20, 14 22, 16 10, 19 21, 22 19, 22 29, 16 33'), lt);
    k.poly(pts('13 28, 16 18, 19 28, 16 31'), ac);
    if (o.rock)
      for (const [x, y, r] of pts('8 19 2, 23 17 3, 16 29 3, 16 8 2')) {
        k.disc(x, y, r, dk);
        k.px(x - 1, y - r + 1, shade(dk, 1.6));
      }
    k.rect(12, 14, 3, 2, INK);
    k.rect(18, 14, 3, 2, INK);
    k.px(13, 14, ey);
    k.px(19, 14, ey);
    k.poly(pts('7 20, 1 16, 2 21, 6 24'), m);
    k.poly(pts('25 20, 31 16, 30 21, 26 24'), m);
    if (o.elite) for (const [x, y] of pts('4 8, 27 6, 3 28, 29 30')) k.disc(x, y, 1, ac);
  },
  { legs: false, float: true }
);
// Ifrit : torse de djinn musculeux, cornes, chevelure de feu, bas du corps en tourbillon de flammes.
species(
  'ifrit',
  (k, [m, dk, lt, ac, ey], o) => {
    // Tourbillon
    k.poly(pts('9 24, 23 24, 20 30, 16 36, 17 31, 12 33, 14 28'), ac);
    k.poly(pts('11 24, 21 24, 18 29, 14 29'), lt);
    // Torse
    k.poly(pts('6 11, 26 11, 23 25, 9 25'), m);
    k.rect(12, 14, 3, 2, shade(m, 0.8));
    k.rect(17, 14, 3, 2, shade(m, 0.8));
    k.rect(13, 18, 6, 1, shade(m, 0.8));
    k.rect(13, 21, 6, 1, shade(m, 0.8));
    k.rect(10, 23, 12, 2, GOLD[1]);
    // Bras croisés
    k.rect(2, 11, 5, 10, m);
    k.rect(25, 11, 5, 10, m);
    k.rect(2, 19, 5, 2, GOLD[1]);
    k.rect(25, 19, 5, 2, GOLD[1]);
    k.disc(3, 23, 2, ac);
    k.disc(28, 23, 2, ac);
    // Tête
    k.rect(12, 3, 8, 8, m);
    eye(k, 13, 6, ey, true);
    eye(k, 17, 6, ey, true);
    k.rect(14, 9, 4, 1, INK);
    k.poly(pts('12 4, 8 -1, 9 4'), CLAW);
    k.poly(pts('20 4, 24 -1, 23 4'), CLAW);
    k.poly(pts('12 3, 14 -2, 16 2, 18 -3, 20 3'), ac);
    if (o.elite) crown(k, 12, 0, 8);
  },
  { legs: false, float: true }
);

// ---------------------------------------------------------------- Horreurs
// Horreur : masse sans forme d'homme. Styles : eye (œil géant à tentacules), maw (gueule béante dentée), tentacle
// (pieuvre rampante), heart (cœur palpitant de moisissure, veines), void (ombre aux nombreux yeux), clock (œil à
// aiguilles d'horloge du Continuum).
species(
  'horror',
  (k, [m, dk, lt, ac, ey], o) => {
    const st = o.style || 'eye';
    // Tentacules
    const tent = st === 'heart' ? 0 : st === 'tentacle' ? 8 : 6;
    for (let i = 0; i < tent; i++) {
      const x = 3 + i * (26 / Math.max(1, tent - 1));
      tube(k, xy(16 + (x - 16) * 0.4, 24, x, 30, x + (i % 2 ? 2 : -2), 35), 2, 1, i % 2 ? dk : m);
      k.px(x + (i % 2 ? 2 : -2), 35, ac);
    }
    if (st === 'eye' || st === 'clock') {
      k.disc(16, 17, 11, m);
      k.disc(16, 17, 7, '#f4ecff');
      k.disc(16, 17, 4, ac);
      k.disc(16, 17, 2, INK);
      k.px(14, 15, WHITE);
      for (const [x, y] of pts('7 9, 26 10, 5 22, 27 23')) eye(k, x, y, ey, true);
      if (st === 'clock') {
        k.line(16, 17, 16, 9, GOLD[1]);
        k.line(16, 17, 22, 19, GOLD[1]);
        for (let a = 0; a < 12; a++) {
          const r = (a * Math.PI) / 6;
          k.px(16 + Math.cos(r) * 9, 17 + Math.sin(r) * 9, GOLD[0]);
        }
      }
    } else if (st === 'maw') {
      ell(k, 16, 17, 12, 11, m);
      ell(k, 16, 19, 8, 7, INK);
      for (let a = 0; a < 14; a++) {
        const r = (a * Math.PI) / 7;
        k.px(16 + Math.cos(r) * 7, 19 + Math.sin(r) * 6, BONE);
      }
      ell(k, 16, 21, 4, 3, BLOOD);
      for (const [x, y] of pts('8 7, 24 7, 16 5')) eye(k, x, y, ey, true);
    } else if (st === 'tentacle') {
      ell(k, 16, 16, 10, 10, m);
      k.disc(12, 12, 3, lt);
      eye(k, 11, 16, ey, true);
      eye(k, 19, 16, ey, true);
      k.rect(13, 22, 6, 2, INK);
    } else if (st === 'heart') {
      ell(k, 16, 20, 11, 12, m);
      k.disc(11, 13, 5, m);
      k.disc(21, 13, 5, m);
      for (const [x0, y0, x1, y1] of pts('8 14 12 26, 24 14 19 27, 16 10 16 30, 10 22 22 20'))
        k.line(x0, y0, x1, y1, ac);
      k.rect(13, 3, 3, 6, dk);
      k.rect(18, 2, 3, 7, dk);
      speckle(k, 6, 9, 20, 20, lt, 14, 29);
      eye(k, 15, 19, ey, true);
    } else {
      ghost(k, 0.85, () => {
        ell(k, 16, 18, 13, 14, m);
        k.poly(pts('4 18, 0 8, 7 12'), m);
        k.poly(pts('28 18, 32 6, 25 12'), m);
      });
      for (const [x, y] of pts('10 12, 20 10, 15 18, 8 22, 23 21, 17 27')) eye(k, x, y, ey, true);
    }
    if (o.stars) for (const [x, y] of pts('4 5, 27 4, 2 14, 30 15')) k.px(x, y, WHITE);
    if (o.crown) crown(k, 12, 2, 8);
    if (o.elite) {
      ghost(k, 0.35, () => k.disc(16, 18, 15, ac));
      for (const [x, y] of pts('9 4, 16 2, 23 4')) k.poly(xy(x - 2, y + 4, x, y - 2, x + 2, y + 4), ac);
    }
  },
  { legs: false, float: true }
);
