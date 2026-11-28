// @ts-check
// Art des créatures : bêtes, arthropodes, volants et formes molles (loup, sanglier, ours, araignée, chauve-souris,
// slime…). Chaque espèce s'inscrit au registre de la famille (species) ; le rendu est dans client/art/creature-art.js.
// Module ES (src/canaan/client/).
import { shade, mix } from '../pixel-kit.js';
import {
  INK,
  WHITE,
  BONE,
  PINK,
  CLAW,
  BLOOD,
  IRON,
  GOLD,
  WOOD,
  SKIN,
  pts,
  xy,
  ell,
  tube,
  ghost,
  limb,
  eye,
  crown,
  scar,
  collar,
  speckle,
  registry
} from './kit.js';

// Bêtes, arthropodes, volants et formes molles : registre de la famille, rassemblé par client/art/creature-art.js.
const { list: BEASTS, species } = registry();
export { BEASTS };

// Loup : corps élancé, long museau, oreilles dressées, queue touffue tombante. Élite : loup alpha à crinière.
species('wolf', (k, [m, dk, lt, ac, ey], o) => {
  // Queue
  k.poly(pts('7 19, 3 22, 0 28, 1 30, 4 27, 8 22'), m);
  k.poly(pts('1 27, 0 29, 2 30, 3 28'), lt);
  // Pattes arrière
  ell(k, 9, 24, 4, 4, m);
  limb(k, pts('8 26, 6 31, 7 35'), 2, dk);
  limb(k, pts('11 26, 10 31, 11 35'), 2, m);
  // Corps
  ell(k, 14, 22, 9, 4, m);
  k.rect(8, 18, 13, 2, dk);
  k.rect(10, 25, 9, 2, lt);
  // Poitrail et pattes avant
  ell(k, 20, 22, 4, 5, m);
  limb(k, pts('19 25, 19 35'), 2, dk);
  limb(k, pts('22 25, 22 35'), 2, m);
  k.rect(5, 35, 3, 1, dk);
  k.rect(10, 35, 3, 1, m);
  k.rect(18, 35, 3, 1, dk);
  k.rect(21, 35, 3, 1, m);
  // Cou et tête
  k.poly(pts('18 18, 23 12, 27 13, 24 22, 19 23'), m);
  ell(k, 24, 15, 3, 3, m);
  k.poly(pts('25 14, 31 16, 31 18, 25 19'), m);
  k.rect(26, 18, 5, 1, lt);
  k.rect(30, 15, 2, 2, INK);
  k.line(27, 18, 30, 18, dk);
  // Oreilles pointues
  k.poly(pts('21 13, 22 7, 25 12'), dk);
  k.poly(pts('24 12, 26 7, 27 13'), m);
  k.px(26, 10, lt);
  // Collerette claire
  k.poly(pts('19 17, 23 19, 23 25, 19 26'), lt);
  eye(k, 25, 14, ey, o.elite);
  if (o.elite) {
    // Loup alpha : crinière hérissée, balafre, cicatrices sur le flanc.
    for (let i = 0; i < 6; i++) k.poly(xy(12 + i * 2, 19, 13 + i * 2, 14 - (i % 2) * 2, 15 + i * 2, 19), lt);
    k.poly(pts('18 17, 19 10, 22 16'), lt);
    k.poly(pts('18 18, 23 18, 24 27, 18 28'), lt);
    k.rect(25, 18, 1, 2, '#c83a3a');
    k.rect(27, 18, 1, 2, '#c83a3a');
    scar(k, 24, 12);
    k.line(12, 20, 15, 23, '#d8c8b8');
  }
});

// Sanglier : tonneau sur pattes courtes, crête de soies, groin rose, défenses courbes. Élite : caparaçon et longues
// défenses.
species('boar', (k, [m, dk, lt, ac, ey], o) => {
  // Queue en tire-bouchon
  k.px(3, 22, dk);
  k.px(2, 23, dk);
  k.px(3, 24, dk);
  k.px(2, 25, dk);
  // Pattes
  k.rect(7, 30, 3, 5, dk);
  k.rect(11, 30, 3, 5, m);
  k.rect(19, 30, 3, 5, dk);
  k.rect(23, 30, 3, 5, m);
  for (const x of [7, 11, 19, 23]) k.rect(x, 35, 3, 1, INK);
  // Corps en tonneau, garrot haut
  ell(k, 14, 25, 11, 6, m);
  ell(k, 19, 21, 6, 5, m);
  k.rect(7, 29, 15, 2, lt);
  // Crête de soies
  for (let x = 5; x < 24; x += 2)
    k.line(
      x,
      21 - Math.round(Math.sin((x - 5) / 6) * 4),
      x + 1,
      15 - Math.round(Math.sin((x - 5) / 6) * 4),
      dk
    );
  speckle(k, 6, 22, 16, 7, dk, 10);
  // Tête en coin, basse
  k.poly(pts('21 18, 27 20, 30 24, 30 29, 24 30, 20 26'), m);
  k.rect(29, 24, 3, 5, PINK);
  k.px(30, 25, INK);
  k.px(30, 27, INK);
  k.line(25, 29, 29, 29, dk);
  // Défenses
  const tusk = o.elite ? 4 : 3;
  k.line(27, 28, 29, 28 - tusk, ac, 1);
  k.line(28, 28, 30, 28 - tusk, ac, 1);
  // Oreille et œil
  k.poly(pts('21 18, 23 14, 25 19'), dk);
  eye(k, 25, 21, ey, o.elite);
  if (o.elite) {
    // Caparaçon de fer sur le dos, cicatrices.
    k.poly(pts('8 19, 20 16, 22 22, 8 24'), IRON[2]);
    k.rect(9, 19, 11, 1, IRON[0]);
    for (const x of [10, 14, 18]) k.px(x, 21, IRON[0]);
    scar(k, 24, 19);
  }
});

// Ours : masse et bosse d'épaules, tête ronde, petites oreilles rondes, gros pattes griffues. Élite : vieux grizzli
// au dos argenté et aux griffes immenses.
species('bear', (k, [m, dk, lt, ac, ey], o) => {
  // Pattes épaisses
  k.rect(4, 28, 5, 8, dk);
  k.rect(10, 28, 5, 8, m);
  k.rect(18, 28, 5, 8, dk);
  k.rect(23, 28, 5, 8, m);
  // Corps massif et bosse
  ell(k, 13, 23, 11, 7, m);
  ell(k, 17, 18, 6, 4, m);
  k.rect(6, 27, 16, 2, dk);
  speckle(k, 4, 18, 18, 9, lt, 8, 3);
  // Tête ronde et museau
  ell(k, 24, 19, 5, 5, m);
  k.rect(19, 21, 3, 6, dk);
  ell(k, 29, 21, 3, 2, mix(lt, '#e8d4b0', 0.5));
  k.rect(31, 20, 2, 2, INK);
  k.line(27, 23, 30, 23, dk);
  k.disc(21, 14, 2, m);
  k.px(21, 14, dk);
  k.disc(25, 14, 2, dk);
  eye(k, 25, 17, INK);
  // Griffes
  const c = o.elite ? 2 : 1;
  for (const x of [23, 25, 27]) k.rect(x, 36 - c, 1, c, CLAW);
  for (const x of [18, 20, 22]) k.rect(x, 36 - c, 1, c, CLAW);
  if (o.elite) {
    k.poly(pts('6 18, 20 13, 23 17, 8 21'), lt);
    scar(k, 25, 16);
    k.line(9, 22, 12, 26, '#e8d0c0');
    k.line(11, 22, 14, 26, '#e8d0c0');
  }
});

// Molosse : chien musculeux au poitrail large, cornes, crinière et queue de flammes, collier à pointes.
species('hound', (k, [m, dk, lt, ac, ey], o) => {
  // Queue de flammes
  k.poly(pts('6 20, 1 14, 3 19, 0 17, 4 23, 7 23'), ac);
  k.poly(pts('5 20, 3 18, 5 22'), lt);
  ell(k, 9, 23, 4, 4, m);
  limb(k, pts('8 26, 6 31, 7 35'), 3, dk);
  limb(k, pts('11 26, 11 35'), 2, m);
  ell(k, 13, 23, 7, 4, m);
  k.rect(8, 25, 8, 1, dk);
  // Poitrail
  ell(k, 20, 21, 6, 6, m);
  k.rect(17, 23, 6, 3, dk);
  k.rect(18, 26, 3, 9, dk);
  k.rect(22, 26, 3, 9, m);
  for (const x of [5, 10, 17, 21]) k.rect(x, 35, 4, 1, INK);
  // Tête carrée
  k.rect(21, 12, 8, 8, m);
  k.rect(26, 15, 6, 5, m);
  k.rect(26, 19, 6, 2, dk);
  k.px(31, 15, INK);
  k.px(27, 19, WHITE);
  k.px(30, 19, WHITE);
  // Cornes
  k.line(22, 12, 19, 7, CLAW, 2);
  k.line(19, 7, 18, 4, CLAW);
  // Crinière de flammes
  for (let i = 0; i < 5; i++)
    k.poly(xy(12 + i * 2, 19, 14 + i * 2, 11 - (i % 2) * 3, 16 + i * 2, 19), i % 2 ? ac : lt);
  collar(k, 19, 20, 7);
  eye(k, 26, 14, ey, true);
  if (o.elite) {
    k.line(25, 12, 24, 6, CLAW, 2);
    k.poly(pts('16 18, 18 6, 21 15'), ac);
    scar(k, 24, 13);
  }
});

// Rat : corps en goutte, museau pointu, grandes oreilles rondes, moustaches, longue queue rose.
species('rat', (k, [m, dk, lt, ac, ey], o) => {
  if (o.tails) for (let i = 0; i < 5; i++) k.line(5, 29, 0, 22 + i * 3, ac, 1);
  k.line(5, 30, 1, 33, ac, 1);
  k.line(1, 33, 1, 35, ac, 1);
  k.line(1, 35, 4, 36, ac, 1);
  ell(k, 13, 29, 9, 5, m);
  k.rect(7, 32, 12, 2, lt);
  k.poly(pts('19 25, 30 30, 19 33'), m);
  k.rect(29, 29, 2, 2, ac);
  k.px(27, 31, WHITE);
  k.disc(19, 23, 3, m);
  k.disc(19, 23, 2, ac);
  eye(k, 23, 27, ey, o.elite);
  k.line(27, 29, 31, 27, lt);
  k.line(27, 30, 31, 31, lt);
  for (const x of [8, 12, 18, 22]) k.rect(x, 33, 2, 3, ac);
  if (o.crown) crown(k, 16, 17, 6);
  k.rect(6, 25, 12, 1, dk);
  if (o.elite) {
    // Rat-garou : échine hérissée et collier de clous.
    for (let x = 6; x < 18; x += 2) k.line(x, 25, x + 1, 21, dk);
    collar(k, 17, 27, 4);
    scar(k, 21, 25);
  }
});

// Taupe des galeries : boule de velours, nez en étoile rose, pattes-pelles géantes.
species('mole', (k, [m, dk, lt, ac, ey], o) => {
  ell(k, 15, 28, 11, 7, m);
  k.rect(6, 32, 18, 2, dk);
  speckle(k, 6, 22, 18, 8, lt, 10, 4);
  k.poly(pts('23 26, 28 27, 29 30, 24 31'), m);
  // Nez en étoile
  k.rect(29, 27, 2, 3, PINK);
  for (const [x, y] of pts('31 26, 31 30, 32 28, 28 26')) k.px(x, y, PINK);
  k.px(25, 27, ey);
  // Pattes-pelles
  k.poly(pts('20 31, 27 32, 29 36, 19 36'), PINK);
  for (const x of [21, 24, 27]) k.rect(x, 35, 2, 1, CLAW);
  k.rect(6, 33, 4, 3, PINK);
  if (o.elite) {
    k.rect(10, 20, 10, 3, IRON[2]);
    k.rect(11, 18, 3, 3, '#ffd36d');
    k.px(12, 17, '#fff2a8');
  }
});

// Taupe-garou : taupe dressée et voûtée, griffes immenses, nez en étoile, petits yeux brûlants.
species('molebeast', (k, [m, dk, lt, ac, ey], o) => {
  k.rect(10, 30, 4, 6, dk);
  k.rect(17, 30, 4, 6, dk);
  ell(k, 15, 23, 8, 9, m);
  ell(k, 16, 26, 5, 5, lt);
  ell(k, 21, 13, 5, 5, m);
  k.rect(25, 12, 3, 4, ac);
  for (const [x, y] of pts('28 11, 28 16, 29 13, 26 10')) k.px(x, y, ac);
  eye(k, 22, 11, ey, true);
  // Bras et griffes
  k.poly(pts('19 18, 26 22, 28 27, 22 26'), m);
  k.poly(pts('24 24, 31 26, 31 30, 25 29'), ac);
  for (const y of [26, 28, 30]) k.line(30, y, 32, y + 1, CLAW);
  k.poly(pts('10 18, 5 24, 7 28, 12 24'), m);
  k.poly(pts('4 25, 8 27, 6 31, 2 29'), ac);
  k.line(2, 29, 1, 32, CLAW);
  k.line(4, 30, 3, 33, CLAW);
  for (const x of [9, 16]) k.rect(x, 35, 6, 1, CLAW);
  if (o.elite) {
    for (let x = 9; x < 20; x += 2) k.line(x, 15, x - 1, 10, dk);
    scar(k, 20, 9);
  }
});

// Basilic : long lézard bas sur six pattes, crête frangée, regard pétrifiant, langue fourchue.
species('basilisk', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('8 26, 0 31, 0 33, 9 30'), m);
  ell(k, 15, 28, 9, 4, m);
  k.rect(8, 30, 15, 2, lt);
  for (const x of [8, 14, 20]) {
    limb(k, xy(x, 30, x - 2, 33, x - 1, 35), 2, dk);
    k.rect(x - 3, 35, 3, 1, CLAW);
  }
  // Crête dorsale
  for (let x = 6; x < 24; x += 3) k.poly(xy(x, 25, x + 1, 21, x + 3, 25), ac);
  // Tête
  k.poly(pts('22 24, 28 24, 32 27, 31 30, 23 30'), m);
  k.line(25, 29, 31, 29, dk);
  k.line(32, 28, 32, 28, BLOOD);
  k.px(32, 30, BLOOD);
  // Collerette
  k.poly(pts('21 21, 24 17, 25 22'), ac);
  k.poly(pts('23 21, 27 18, 27 23'), ac);
  eye(k, 26, 25, ey, true);
  speckle(k, 7, 25, 16, 5, dk, 12, 5);
  if (o.elite) {
    k.poly(pts('20 22, 22 14, 24 22'), ac);
    k.poly(pts('24 22, 28 15, 28 23'), ac);
    for (let x = 7; x < 22; x += 3) k.px(x + 1, 22, '#ffffff');
  }
});

// Drake des dunes : grand lézard dressé sur ses pattes arrière, sans ailes, cornes et collerette, flanc rayé.
species('drake', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('9 22, 0 26, 0 28, 9 27'), m);
  ell(k, 10, 26, 5, 5, m);
  limb(k, pts('9 29, 7 33, 9 35'), 3, dk);
  k.rect(7, 35, 5, 1, CLAW);
  ell(k, 16, 23, 7, 5, m);
  k.rect(11, 26, 10, 2, lt);
  for (const x of [11, 14, 17]) k.line(x, 19, x - 1, 24, dk);
  limb(k, pts('18 27, 19 31, 18 35'), 3, m);
  k.rect(17, 35, 5, 1, CLAW);
  // Cou dressé
  tube(k, pts('19 21, 22 16, 23 12'), 3, 2, m);
  k.poly(pts('21 9, 28 9, 31 12, 30 14, 22 14'), m);
  k.line(25, 13, 30, 13, dk);
  k.line(22, 9, 18, 5, ac, 2);
  k.line(23, 8, 21, 4, ac);
  k.poly(pts('19 11, 16 10, 18 16, 21 14'), ac);
  eye(k, 25, 10, ey, o.elite);
  // Bras griffus
  limb(k, pts('22 19, 26 21, 27 23'), 2, m);
  k.px(28, 23, CLAW);
  if (o.elite) {
    for (let x = 8; x < 20; x += 3) k.poly(xy(x, 19, x + 1, 14, x + 3, 19), ac);
    scar(k, 25, 8);
  }
});

// Dragon : ailes déployées, cou en S, cornes, ventre à plaques. `young` : dragonnet trapu à grosse tête ;
// `stars` : ailes étoilées ; `heads` : hydre à trois têtes.
species('dragon', (k, [m, dk, lt, ac, ey], o) => {
  const young = !!o.young,
    skin = mix(dk, ac, 0.45);
  // Aile arrière
  ghost(k, 0.9, () => {
    if (young) k.poly(pts('10 20, 4 10, 8 12, 11 8, 13 13, 16 19'), skin);
    else k.poly(pts('9 21, 1 4, 6 8, 9 3, 12 9, 16 6, 17 19'), skin);
  });
  if (!young) {
    k.line(9, 20, 1, 4, dk);
    k.line(11, 19, 9, 3, dk);
    k.line(14, 19, 16, 6, dk);
  }
  if (o.stars) for (const [x, y] of pts('5 9, 10 7, 13 12, 8 14')) k.px(x, y, WHITE);
  // Queue
  k.poly(pts('8 27, 2 30, 0 34, 3 33, 9 31'), m);
  k.poly(pts('0 34, 0 31, 2 33'), ac);
  // Corps
  ell(k, 13, 27, young ? 7 : 8, young ? 6 : 6, m);
  for (let i = 0; i < 4; i++) k.rect(10 + i * 3, 28 + (i % 2), 2, 4, lt);
  limb(k, pts('9 31, 8 35'), 3, dk);
  limb(k, pts('17 31, 18 35'), 3, m);
  k.rect(6, 35, 4, 1, CLAW);
  k.rect(17, 35, 4, 1, CLAW);
  if (o.heads) {
    // Hydre : trois cous et trois têtes.
    for (const [hx, hy, nx] of pts('5 7 9, 16 3 14, 26 10 19')) {
      tube(k, xy(nx, 24, nx + (hx - nx) / 2, (24 + hy) / 2 + 2, hx, hy + 3), 2, 2, m);
      k.poly(xy(hx - 2, hy, hx + 4, hy + 1, hx + 6, hy + 3, hx - 1, hy + 5), m);
      k.line(hx, hy + 4, hx + 5, hy + 3, dk);
      k.px(hx + 1, hy + 1, ey);
      k.line(hx - 2, hy, hx - 4, hy - 2, ac);
    }
    return;
  }
  // Cou et tête
  if (young) {
    ell(k, 21, 18, 6, 5, m);
    k.poly(pts('24 17, 31 19, 30 22, 24 22'), m);
    k.line(25, 22, 30, 21, dk);
    k.px(29, 18, INK);
    k.line(18, 14, 16, 10, CLAW, 2);
    k.line(21, 13, 21, 9, CLAW);
    eye(k, 22, 16, ey, o.elite);
  } else {
    tube(k, pts('17 24, 21 18, 22 13'), 3, 2, m);
    for (let y = 16; y < 24; y += 3) k.rect(20, y, 3, 1, lt);
    k.poly(pts('20 8, 27 8, 31 11, 30 14, 21 14'), m);
    k.line(24, 13, 30, 13, dk);
    k.px(30, 10, INK);
    k.line(21, 8, 17, 3, CLAW, 2);
    k.line(23, 8, 22, 3, CLAW);
    eye(k, 24, 9, ey, o.elite);
  }
  // Aile avant
  ghost(k, 0.9, () => {
    if (young) k.poly(pts('13 21, 16 13, 19 15, 20 22'), mix(m, ac, 0.5));
    else k.poly(pts('12 23, 20 6, 23 11, 26 9, 24 22'), mix(m, ac, 0.5));
  });
  if (!young) {
    k.line(14, 22, 20, 6, dk);
    k.line(20, 6, 23, 11, dk);
  }
  if (o.elite) {
    for (let x = 6; x < 17; x += 3) k.poly(xy(x, 22, x + 1, 18, x + 3, 22), dk);
    collar(k, 18, 19, 5);
  }
});

// Serpent : anneaux enroulés au sol, buste dressé, capuchon. `fins` : nageoires du serpent de mer ; `ice` : pointes
// de givre.
species('serpent', (k, [m, dk, lt, ac, ey], o) => {
  ell(k, 15, 33, 13, 3, dk);
  ell(k, 15, 32, 12, 3, m);
  ell(k, 14, 29, 9, 3, dk);
  ell(k, 14, 28, 8, 2, m);
  for (let x = 6; x < 25; x += 4) k.rect(x, 33, 2, 1, lt);
  tube(k, pts('18 27, 22 22, 21 17, 18 13, 20 9'), 3, 2, m);
  for (let y = 12; y < 26; y += 3) k.rect(21, y, 2, 1, lt);
  // Capuchon et tête
  k.poly(pts('16 8, 20 4, 24 8, 24 14, 20 12, 16 14'), o.fins ? ac : m);
  k.poly(pts('19 5, 26 5, 30 8, 26 10, 19 9'), m);
  k.line(24, 9, 29, 8, dk);
  k.line(30, 9, 31, 11, BLOOD);
  k.px(32, 11, BLOOD);
  k.px(30, 11, BLOOD);
  eye(k, 22, 6, ey, true);
  if (o.ice)
    for (const [x, y] of pts('8 27, 13 26, 18 29, 23 30')) k.poly(xy(x, y, x + 1, y - 4, x + 2, y), ac);
  if (o.fins) {
    k.poly(pts('14 16, 9 12, 10 18, 16 20'), ac);
    k.poly(pts('24 20, 29 17, 28 22, 24 23'), ac);
  }
  if (o.elite) {
    k.poly(pts('17 6, 17 0, 20 4'), ac);
    k.poly(pts('22 4, 23 0, 25 5'), ac);
  }
});

// ---------------------------------------------------------------- Arthropodes
// Araignée : gros abdomen marqué à l'arrière, huit pattes coudées, grappe d'yeux, chélicères. `hairy` : mygale
// velue ; `venom` : pattes longues, rayures et goutte de venin.
species('spider', (k, [m, dk, lt, ac, ey], o) => {
  const lift = o.venom ? 3 : 0,
    back = [xy(16, 25, 9, 15 - lift, 3, 35), xy(17, 26, 13, 14 - lift, 8, 35)],
    front = [xy(19, 26, 21, 13 - lift, 25, 35), xy(20, 27, 27, 15 - lift, 31, 35)];
  // Pattes du côté caché (sombres)
  back.forEach(p => limb(k, [p[0], [p[1][0] + 4, p[1][1] + 3], [p[2][0] + 5, p[2][1]]], 1, dk));
  front.forEach(p => limb(k, [p[0], [p[1][0] - 4, p[1][1] + 3], [p[2][0] - 5, p[2][1]]], 1, dk));
  ell(k, 10, 25, 7, 6, m);
  ell(k, 9, 22, 4, 2, lt);
  if (o.venom) for (let i = 0; i < 3; i++) k.rect(4 + i * 4, 19, 2, 10, ac);
  else k.poly(pts('9 22, 12 25, 9 28, 6 25'), ac);
  ell(k, 21, 26, 5, 4, m);
  // Pattes du côté visible
  for (const p of [...back, ...front]) {
    limb(k, p, 2, m);
    k.px(p[1][0], p[1][1], lt);
  }
  if (o.hairy)
    for (const p of [...back, ...front]) k.px((p[1][0] + p[2][0]) >> 1, (p[1][1] + p[2][1]) >> 1, lt);
  if (o.clock) {
    k.disc(10, 24, 4, GOLD[1]);
    k.disc(10, 24, 3, BONE);
    k.line(10, 24, 10, 21, INK);
    k.line(10, 24, 12, 25, INK);
  }
  // Yeux et crocs
  for (const [x, y] of pts('23 23, 25 23, 24 25, 26 25')) k.px(x, y, ey);
  k.rect(25, 28, 2, 3, ac);
  k.px(27, 30, ac);
  if (o.venom) ghost(k, 0.8, () => k.rect(26, 31, 1, 3, ac));
  if (o.elite) {
    // Reine : abdomen énorme et crâne peint.
    ell(k, 9, 22, 6, 4, dk);
    k.rect(7, 21, 4, 3, BONE);
    k.px(8, 22, INK);
    k.px(10, 22, INK);
  }
});

// Scorpion : corps plat segmenté, queue en arc au-dessus du dos et dard, grosses pinces devant.
species('scorpion', (k, [m, dk, lt, ac, ey], o) => {
  for (let i = 0; i < 4; i++) limb(k, xy(9 + i * 4, 31, 7 + i * 4, 33, 8 + i * 4, 36), 1, dk);
  ell(k, 14, 30, 9, 4, m);
  k.rect(7, 28, 14, 1, lt);
  for (let x = 9; x < 21; x += 3) k.line(x, 27, x, 33, dk);
  // Queue articulée
  const tail = pts('6 28, 3 23, 3 18, 6 13, 10 10, 15 10');
  tail.forEach(([x, y], i) => k.disc(x, y, i < 3 ? 3 : 2, i % 2 ? dk : m));
  k.poly(pts('16 9, 20 12, 17 15'), ac);
  k.px(19, 14, WHITE);
  // Pince
  limb(k, pts('21 29, 25 26'), 2, m);
  k.poly(pts('25 23, 31 22, 32 25, 28 25, 32 27, 26 29'), m);
  k.rect(27, 23, 3, 1, lt);
  k.rect(22, 30, 4, 2, m);
  eye(k, 21, 27, ey, o.elite);
  if (o.elite) {
    k.poly(pts('14 8, 16 3, 17 8'), ac);
    for (let x = 10; x < 20; x += 3) k.px(x, 26, IRON[0]);
  }
});

// Scarabée foreur : dôme brillant de la carapace, foret torsadé au front, pattes coudées.
species(
  'beetle',
  (k, [m, dk, lt, ac, ey], o) => {
    for (let i = 0; i < 3; i++) limb(k, xy(10 + i * 6, 31, 8 + i * 6, 33, 9 + i * 6, 36), 2, dk);
    ell(k, 14, 27, 10, 7, m);
    k.line(14, 20, 16, 33, dk);
    k.poly(pts('7 23, 12 21, 10 26'), lt);
    ell(k, 24, 29, 4, 3, dk);
    // Foret
    k.poly(pts('26 26, 32 28, 26 31'), ac);
    for (const x of [27, 29]) k.line(x, 27, x + 1, 30, shade(ac, 0.6));
    eye(k, 24, 27, ey, true);
    if (o.elite) {
      k.poly(pts('22 25, 25 18, 27 25'), ac);
      speckle(k, 6, 22, 14, 8, lt, 8, 7);
    }
  },
  { legs: false }
);

// Mille-pattes géant : corps annelé dressé en S, une paire de pattes par anneau, mandibules et longues antennes.
species('centipede', (k, [m, dk, lt, ac, ey], o) => {
  const seg = pts('3 32, 7 32, 11 31, 15 30, 19 28, 22 24, 24 20, 25 16');
  seg.forEach(([x, y], i) => {
    limb(k, xy(x, y + 1, x - 2, y + 4, x - 1, Math.min(36, y + 6)), 1, ac);
    limb(k, xy(x, y + 1, x + 2, y + 4, x + 3, Math.min(36, y + 6)), 1, ac);
  });
  seg.forEach(([x, y], i) => {
    k.disc(x, y, 3, i % 2 ? dk : m);
    k.px(x - 1, y - 2, lt);
  });
  k.disc(27, 13, 3, m);
  k.line(29, 15, 31, 17, ac, 1);
  k.line(29, 16, 30, 18, ac, 1);
  k.line(27, 10, 31, 4, dk);
  k.line(26, 10, 24, 3, dk);
  eye(k, 28, 12, ey, o.elite);
  if (o.elite) seg.forEach(([x, y]) => k.px(x, y - 3, IRON[0]));
});

// Mante : dressée et fine, tête triangulaire aux gros yeux, pattes ravisseuses repliées, ailes translucides.
species('mantis', (k, [m, dk, lt, ac, ey], o) => {
  ghost(k, 0.55, () => k.poly(pts('17 16, 6 28, 10 31, 19 22'), ac));
  k.poly(pts('15 20, 9 30, 12 32, 17 22'), m);
  for (let i = 0; i < 3; i++) k.line(11 + i, 29 - i * 2, 13 + i, 30 - i * 2, dk);
  k.rect(16, 13, 3, 10, m);
  limb(k, pts('16 22, 12 28, 12 35'), 1, dk);
  limb(k, pts('18 22, 21 28, 22 35'), 1, dk);
  limb(k, pts('15 24, 7 29, 6 35'), 1, dk);
  // Pattes ravisseuses
  limb(k, pts('18 14, 23 18, 22 11'), 2, lt);
  for (const y of [13, 15, 17]) k.px(21, y, CLAW);
  // Tête
  k.poly(pts('14 7, 22 7, 18 13'), m);
  eye(k, 13, 7, ey, true);
  eye(k, 21, 7, ey, true);
  k.line(16, 7, 13, 1, dk);
  k.line(19, 7, 22, 1, dk);
  if (o.elite) {
    limb(k, pts('16 15, 26 15, 27 9'), 2, lt);
    k.poly(pts('14 5, 16 2, 17 6'), ac);
  }
});

// Moustique des fanges : abdomen rayé gorgé de sang, trompe en avant, pattes longues pendantes, ailes de verre.
species(
  'mosquito',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.5, () => {
      ell(k, 12, 12, 7, 3, '#dceeff');
      ell(k, 18, 11, 5, 2, '#dceeff');
    });
    for (let i = 0; i < 3; i++) limb(k, xy(14 + i * 2, 21, 10 + i * 5, 26, 9 + i * 6, 33), 1, dk);
    k.poly(pts('6 18, 14 17, 15 22, 7 24'), ac);
    for (let x = 7; x < 14; x += 2) k.line(x, 18, x, 23, dk);
    ell(k, 18, 18, 4, 3, m);
    k.disc(23, 16, 2, m);
    k.line(24, 17, 31, 21, dk);
    eye(k, 23, 15, ey, true);
    k.line(23, 14, 27, 9, dk);
    if (o.elite) {
      ell(k, 9, 21, 4, 3, BLOOD);
      k.px(8, 20, '#ff8080');
    }
  },
  { legs: false, float: true }
);

// ---------------------------------------------------------------- Volants
// Chauve-souris : ailes membraneuses ouvertes et leurs doigts, grandes oreilles, crocs, pattes repliées.
species(
  'bat',
  (k, [m, dk, lt, ac, ey], o) => {
    const wing = side => {
      const f = x => (side < 0 ? 31 - x : x);
      k.poly(xy(f(13), 14, f(6), 9, f(0), 12, f(1), 22, f(4), 19, f(7), 23, f(10), 19, f(13), 22), dk);
      k.line(f(13), 15, f(1), 12, m);
      k.line(f(8), 11, f(4), 19, m);
      k.line(f(10), 13, f(9), 20, m);
    };
    wing(1);
    wing(-1);
    ell(k, 16, 18, 4, 5, m);
    k.rect(14, 19, 5, 3, lt);
    k.disc(16, 12, 3, m);
    k.poly(pts('13 11, 12 5, 15 9'), m);
    k.poly(pts('17 9, 20 5, 19 11'), m);
    k.px(13, 7, ac);
    k.px(19, 7, ac);
    eye(k, 14, 11, ey, true);
    eye(k, 17, 11, ey, true);
    k.px(15, 14, WHITE);
    k.px(17, 14, WHITE);
    k.rect(14, 23, 1, 3, dk);
    k.rect(18, 23, 1, 3, dk);
    if (o.elite) {
      k.poly(pts('0 12, 0 6, 3 10'), dk);
      k.poly(pts('31 12, 31 6, 28 10'), dk);
      k.px(16, 18, ac);
      scar(k, 13, 9);
    }
  },
  { legs: false, float: true }
);

// Corbeau : oiseau de profil, bec fort, queue en éventail, aile repliée aux plumes marquées. `spectral` : traînées
// fantomatiques et yeux luisants.
species('raven', (k, [m, dk, lt, ac, ey], o) => {
  if (o.spectral)
    ghost(k, 0.35, () => {
      k.poly(pts('8 22, 0 18, 2 24, 0 30, 9 27'), lt);
      k.poly(pts('10 26, 3 34, 12 31'), lt);
    });
  k.poly(pts('9 22, 2 26, 3 29, 10 26'), dk);
  ell(k, 14, 22, 7, 6, m);
  k.disc(21, 14, 4, m);
  k.poly(pts('24 13, 31 15, 24 17'), ac);
  k.line(25, 15, 30, 15, shade(ac, 0.6));
  eye(k, 21, 12, ey, o.spectral || o.elite);
  // Aile repliée
  k.poly(pts('10 18, 19 18, 17 26, 6 28'), dk);
  for (let i = 0; i < 4; i++) k.line(9 + i * 2, 21, 7 + i * 2, 27, m);
  k.rect(14, 18, 4, 2, lt);
  // Pattes
  k.line(14, 28, 13, 34, ac);
  k.line(17, 28, 18, 34, ac);
  k.rect(11, 34, 4, 1, ac);
  k.rect(17, 34, 4, 1, ac);
  if (o.elite) {
    k.poly(pts('18 11, 16 6, 20 10'), dk);
    k.poly(pts('20 10, 20 5, 22 10'), dk);
    collar(k, 18, 18, 5);
  }
});

// Hibou : grand corps rond de face, aigrettes, yeux immenses, ailes à demi ouvertes, croissant de lune au plastron.
species(
  'owl',
  (k, [m, dk, lt, ac, ey], o) => {
    k.poly(pts('8 14, 0 20, 1 30, 8 26'), dk);
    k.poly(pts('24 14, 32 20, 31 30, 24 26'), dk);
    for (let i = 0; i < 3; i++) {
      k.line(2 + i * 2, 22, 4 + i * 2, 28, m);
      k.line(29 - i * 2, 22, 27 - i * 2, 28, m);
    }
    ell(k, 16, 22, 9, 12, m);
    ell(k, 16, 25, 6, 7, lt);
    for (let y = 21; y < 31; y += 3) for (let x = 12; x < 21; x += 3) k.px(x, y, dk);
    k.poly(pts('8 9, 9 3, 12 8'), m);
    k.poly(pts('24 9, 23 3, 20 8'), m);
    k.disc(12, 13, 3, lt);
    k.disc(20, 13, 3, lt);
    k.disc(12, 13, 2, ey);
    k.disc(20, 13, 2, ey);
    k.rect(12, 13, 1, 1, INK);
    k.rect(20, 13, 1, 1, INK);
    k.poly(pts('15 15, 17 15, 16 18'), ac);
    // Croissant de lune
    k.disc(16, 27, 3, ac);
    k.disc(17, 26, 3, lt);
    k.rect(12, 34, 3, 2, ac);
    k.rect(18, 34, 3, 2, ac);
    if (o.elite) crown(k, 12, 2);
  },
  { legs: false, float: true }
);

// Feu follet : orbe lumineux à la flamme montante, petit visage, étincelles. `star` : esprit en étoile.
species(
  'wisp',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.35, () => k.disc(16, 22, 9, m));
    if (o.star) {
      k.poly(pts('16 10, 19 18, 27 18, 21 23, 23 31, 16 26, 9 31, 11 23, 5 18, 13 18'), m);
      k.poly(pts('16 14, 18 19, 22 20, 19 23, 20 27, 16 24, 12 27, 13 23, 10 20, 14 19'), lt);
    } else {
      k.poly(pts('10 22, 13 10, 15 15, 17 7, 19 14, 22 11, 22 22'), m);
      k.disc(16, 23, 6, m);
      k.disc(16, 23, 4, lt);
      k.poly(pts('14 18, 16 12, 18 18'), lt);
    }
    k.rect(14, 22, 1, 2, INK);
    k.rect(18, 22, 1, 2, INK);
    for (const [x, y] of pts('5 15, 27 13, 8 31, 25 29')) k.px(x, y, ac);
    if (o.elite) {
      ghost(k, 0.5, () => k.disc(16, 22, 12, ac));
      k.disc(16, 23, 2, WHITE);
    }
  },
  { legs: false, float: true }
);

// Fée sauvage : petite silhouette aux grandes ailes de papillon, couronne de fleurs, robe de pétales, oreilles
// pointues et baguette scintillante.
species(
  'fairy',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.75, () => {
      k.poly(pts('15 16, 5 6, 2 12, 6 18'), lt);
      k.poly(pts('15 18, 4 20, 6 27, 12 24'), m);
      k.poly(pts('17 16, 27 6, 30 12, 26 18'), lt);
      k.poly(pts('17 18, 28 20, 26 27, 20 24'), m);
    });
    k.disc(6, 12, 1, ac);
    k.disc(26, 12, 1, ac);
    // Robe de pétales
    k.poly(pts('13 20, 19 20, 22 29, 10 29'), m);
    k.poly(pts('10 29, 12 26, 14 30, 16 26, 18 30, 20 26, 22 29'), dk);
    k.rect(14, 29, 1, 4, SKIN);
    k.rect(17, 29, 1, 4, SKIN);
    k.rect(13, 16, 6, 5, m);
    k.line(19, 17, 24, 14, SKIN);
    k.line(24, 14, 26, 10, WOOD[0]);
    k.px(26, 9, WHITE);
    k.px(27, 8, ac);
    // Tête
    k.disc(16, 12, 3, SKIN);
    k.poly(pts('19 11, 23 9, 19 13'), SKIN);
    k.rect(13, 8, 7, 2, ac);
    k.px(14, 7, lt);
    k.px(17, 7, '#ffffff');
    k.px(19, 8, lt);
    k.px(15, 12, ey);
    k.px(17, 12, ey);
    if (o.elite) {
      ghost(k, 0.6, () => {
        k.poly(pts('15 14, 3 0, 0 8'), ac);
        k.poly(pts('17 14, 29 0, 32 8'), ac);
      });
      crown(k, 12, 4, 8);
    }
  },
  { legs: false, float: true }
);

// ---------------------------------------------------------------- Formes molles
// Slime : dôme luisant, bulles à l'intérieur, visage, coulure. `shrooms` : chapeaux de champignons sur le dos.
species(
  'slime',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.88, () => {
      ell(k, 16, 29, 11, 7, m);
      ell(k, 16, 24, 7, 5, m);
    });
    k.rect(6, 34, 20, 2, dk);
    k.rect(24, 33, 2, 3, m);
    ghost(k, 0.7, () => {
      k.disc(11, 30, 1, lt);
      k.disc(20, 32, 1, lt);
      k.px(14, 26, lt);
    });
    k.rect(10, 22, 4, 2, lt);
    k.px(10, 22, WHITE);
    k.rect(12, 27, 3, 3, WHITE);
    k.rect(18, 27, 3, 3, WHITE);
    k.rect(13, 28, 2, 2, ey);
    k.rect(19, 28, 2, 2, ey);
    k.line(15, 31, 18, 31, dk);
    if (o.shrooms)
      for (const [x, y, c] of [
        [10, 18, ac],
        [19, 16, lt],
        [24, 22, ac]
      ]) {
        k.rect(x + 1, y + 2, 2, 3, BONE);
        ell(k, x + 2, y + 1, 3, 2, c);
        k.px(x + 1, y, WHITE);
      }
    if (o.elite) {
      // Slime royal : plus grand, couronne dorée qui flotte dans le dôme.
      ghost(k, 0.4, () => ell(k, 16, 26, 14, 10, m));
      crown(k, 12, 15);
    }
  },
  { legs: false }
);

// Limace : corps long et bas, manteau sur le dos, cornes oculaires, traînée de bave luisante.
species(
  'slug',
  (k, [m, dk, lt, ac, ey], o) => {
    ghost(k, 0.5, () => k.rect(0, 34, 18, 2, ac));
    k.poly(pts('2 35, 6 30, 20 28, 27 27, 29 31, 27 35'), m);
    ell(k, 13, 29, 7, 3, dk);
    speckle(k, 7, 27, 12, 4, lt, 6, 9);
    k.rect(4, 34, 22, 1, lt);
    k.line(25, 27, 26, 20, m);
    k.line(28, 27, 30, 21, m);
    k.disc(26, 19, 1, ey);
    k.disc(30, 20, 1, ey);
    if (o.elite) {
      k.poly(pts('9 27, 10 22, 12 26, 14 21, 16 26, 17 23, 18 27'), ac);
    }
  },
  { legs: false }
);

// Ver des boues : anneaux sortant d'une butte de terre, gueule ronde garnie de dents.
species(
  'worm',
  (k, [m, dk, lt, ac, ey], o) => {
    ell(k, 16, 34, 13, 3, dk);
    speckle(k, 4, 32, 24, 4, lt, 8, 11);
    tube(k, pts('14 34, 12 26, 14 18, 19 12'), 5, 4, m);
    for (const [x, y] of pts('13 31, 12 27, 13 23, 15 19, 17 15')) k.rect(x - 4, y, 9, 1, dk);
    k.disc(20, 11, 5, m);
    k.disc(22, 11, 3, INK);
    for (const [x, y] of pts('20 9, 22 8, 24 9, 25 11, 24 13, 22 14, 20 13')) k.px(x, y, BONE);
    k.disc(22, 11, 1, BLOOD);
    if (o.crown) crown(k, 16, 3, 8);
    if (o.elite)
      for (const [x, y] of pts('9 22, 9 28, 17 24, 18 29')) k.poly(xy(x, y, x - 2, y + 1, x, y + 2), ac);
  },
  { legs: false }
);

// Larve des fanges : grosse larve pâle en C, anneaux, tête brune, petites pattes avant.
species(
  'grub',
  (k, [m, dk, lt, ac, ey], o) => {
    const seg = pts('6 30, 8 25, 12 22, 17 22, 21 24, 24 28');
    seg.forEach(([x, y], i) => k.disc(x, y, 5 - (i === 0 ? 1 : 0), i % 2 ? m : lt));
    seg.forEach(([x, y]) => k.px(x - 1, y - 4, WHITE));
    k.disc(26, 31, 3, ac);
    k.px(27, 33, INK);
    k.px(28, 33, INK);
    eye(k, 26, 30, ey, true);
    for (const x of [21, 24]) k.line(x, 30, x, 35, ac);
    if (o.elite) seg.forEach(([x, y]) => k.px(x, y + 3, dk));
  },
  { legs: false }
);
