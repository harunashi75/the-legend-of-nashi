// Art des créatures : une silhouette propre à chaque espèce (loup, sanglier, ours, rat, araignée, troll, spectre,
// tréant…), peinte au pinceau du kit commun sur une grille de 32 × 40 pixels d'art, profil tourné vers la droite,
// pieds au sol à la ligne 36. Les humanoïdes (bandits, chevaliers, prêtres, sorcières…) partagent un corps mais
// chacun porte sa coiffe, son visage, sa tenue et son arme. Chaque espèce sait aussi se peindre en élite (plus
// massive, balafrée, cuirassée ou couronnée selon l'espèce). Le sprite rendu fait 34 × 42 : ombre au sol, contour
// sombre d'un pixel, modelé.
// Palettes : [principale, sombre, claire, accent, yeux]. Les options (`opts`) précisent la variante d'une espèce.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js) sous CANAAN_CREATURE_ART.
import { brush, makeCanvas, polish, shade, tint, mix, noise } from './pixel-kit.js';

const INK = '#1a1418',
  WHITE = '#ffffff',
  BONE = '#efe6cc',
  PINK = '#e2a0a0',
  CLAW = '#ece0c4',
  BLOOD = '#b02a2a',
  IRON = ['#c8ccd4', '#8a909c', '#5a606c', '#363a44'],
  GOLD = ['#fff2a8', '#ffd36d', '#c8962e', '#7a5418'],
  WOOD = ['#a8784a', '#7a5432', '#4e3420'],
  SKIN = '#e8c0a0';

// ---------------------------------------------------------------- Outils de forme
// Liste de points écrite d'un trait : pts('7 19, 3 22, 0 28') donne xy(7, 19, 3, 22, 0, 28).
const pts = text => text.split(',').map(p => p.trim().split(/\s+/).map(Number));
// Liste de points calculés : xy(x0, y0, x1, y1, …) donne [[x0, y0], [x1, y1], …].
const xy = (...v) => v.flatMap((n, i) => (i % 2 ? [] : [[n, v[i + 1]]]));
// Ellipse pleine (rayons rx, ry) sans anticrénelage.
function ell(k, cx, cy, rx, ry, col) {
  k.g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))));
    k.g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
  }
}
// Trait épais le long d'une suite de points (disques de rayon décroissant de r0 à r1) : cous, queues, tentacules.
function tube(k, pts, r0, r1, col) {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i],
      [x1, y1] = pts[i + 1],
      steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s++) {
      const t = (i + s / steps) / n;
      k.disc(
        x0 + ((x1 - x0) * s) / steps,
        y0 + ((y1 - y0) * s) / steps,
        Math.max(0, Math.round(r0 + (r1 - r0) * t)),
        col
      );
    }
  }
}
// Transparence le temps d'un dessin (ailes membraneuses, spectres, flammes).
function ghost(k, a, fn) {
  const before = k.g.globalAlpha;
  k.g.globalAlpha = a;
  fn();
  k.g.globalAlpha = before;
}
// Patte articulée : hanche, genou, pied.
function limb(k, pts, t, col) {
  for (let i = 0; i < pts.length - 1; i++) k.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, t);
}
// Œil : pupille sombre et point de lumière, ou simple lueur pour les yeux luisants.
function eye(k, x, y, col, glow) {
  if (glow) {
    k.rect(x, y, 2, 2, col);
    ghost(k, 0.35, () => k.rect(x - 1, y - 1, 4, 4, col));
    k.rect(x, y, 2, 2, col);
  } else {
    k.rect(x, y, 2, 2, col);
    k.px(x + 1, y, WHITE);
  }
}
// Couronne posée sur une tête (x, y : coin haut gauche, largeur w).
function crown(k, x, y, w = 8) {
  k.rect(x, y + 2, w, 2, GOLD[1]);
  for (let i = 0; i < w; i += 3) k.rect(x + i, y, 2, 2, GOLD[1]);
  k.rect(x, y + 2, w, 1, GOLD[0]);
  k.px(x + Math.floor(w / 2), y + 3, '#d0304a');
}
// Balafre d'élite sur l'œil.
function scar(k, x, y) {
  k.line(x, y, x + 3, y + 4, '#f0d8c8');
}
// Collier à pointes d'élite.
function collar(k, x, y, w) {
  k.rect(x, y, w, 2, IRON[3]);
  for (let i = 1; i < w; i += 3) k.px(x + i, y - 1, IRON[0]);
}
// Petites taches de pelage ou d'écailles, stables d'un dessin à l'autre.
function speckle(k, x, y, w, h, col, n, seed = 1) {
  for (let i = 0; i < n; i++) {
    const a = noise(i, seed, 1),
      b = noise(i, seed, 2);
    k.px(x + Math.floor(a * w), y + Math.floor(b * h), col);
  }
}

// ---------------------------------------------------------------- Bêtes
const SPECIES = {};
// Déclare une espèce : dessin, et réglages d'animation (legs : pas alternés ; float : flotte et ondule).
function species(name, draw, meta = {}) {
  SPECIES[name] = { draw, legs: meta.legs !== false, float: !!meta.float };
}

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

// ---------------------------------------------------------------- Humanoïdes
// Corps commun des humanoïdes, de face. Chaque personnage choisit sa carrure (`build`), sa peau, son visage
// (`face`), sa coiffe (`head`), sa tenue (`robe`, `cape`, `armor`), son arme (`hold`) et ce qu'il porte à l'autre
// main (`off`). Palette : [tenue, ombre de la tenue, liseré, métal ou accent, yeux].
const BUILDS = {
  thin: { hw: 5, hy: 4, hh: 9, sy: 13, wy: 25, arm: 2 },
  normal: { hw: 6, hy: 4, hh: 9, sy: 13, wy: 25, arm: 3 },
  stocky: { hw: 7, hy: 7, hh: 8, sy: 15, wy: 27, arm: 3 },
  big: { hw: 8, hy: 2, hh: 8, sy: 10, wy: 25, arm: 4 },
  small: { hw: 5, hy: 9, hh: 10, sy: 19, wy: 29, arm: 2 },
  dwarf: { hw: 7, hy: 9, hh: 8, sy: 17, wy: 29, arm: 3 }
};
function person(k, pal, s) {
  const [m, dk, lt, ac] = pal,
    B = BUILDS[s.build] || BUILDS.normal,
    cx = 16,
    hw = B.hw,
    skin = s.skin || SKIN,
    hx = cx - 4,
    hw2 = 8,
    hy = B.hy,
    hh = B.hh,
    sy = B.sy,
    wy = B.wy,
    rh = { x: cx + hw + 1, y: wy - 1 },
    lh = { x: cx - hw - 3, y: wy - 1 },
    metal = s.metal || IRON;
  // Cape et objets dans le dos.
  if (s.cape) {
    k.poly(xy(cx - hw, sy, cx + hw, sy, cx + hw + 3, 35, cx - hw - 3, 35), s.cape);
    k.rect(cx - hw - 3, 34, hw * 2 + 6, 1, shade(s.cape, 0.7));
  }
  if (s.wings) wingsBack(k, s.wings, sy);
  // Jambes ou robe.
  if (s.robe) {
    k.poly(xy(cx - hw, wy - 4, cx + hw, wy - 4, cx + hw + 3, 36, cx - hw - 3, 36), m);
    k.rect(cx - 1, wy - 2, 2, 36 - wy + 2, dk);
    k.rect(cx - hw - 3, 34, hw * 2 + 6, 2, s.trim || ac);
    if (s.tatters) for (let x = cx - hw - 3; x < cx + hw + 3; x += 3) k.rect(x + 1, 35, 1, 1, dk);
  } else {
    const lw = Math.max(3, hw - 2),
      leg = s.legs || dk;
    k.rect(cx - lw - 1, wy, lw, 36 - wy, leg);
    k.rect(cx + 1, wy, lw, 36 - wy, leg);
    if (s.hooves) {
      k.rect(cx - lw - 1, 34, lw, 2, INK);
      k.rect(cx + 1, 34, lw, 2, INK);
    } else if (!s.barefoot) {
      k.rect(cx - lw - 2, 33, lw + 1, 3, s.boots || '#2a1e18');
      k.rect(cx + 1, 33, lw + 1, 3, s.boots || '#2a1e18');
    }
    if (s.kilt)
      k.poly(xy(cx - hw, wy - 1, cx + hw, wy - 1, cx + hw + 1, wy + 5, cx - hw - 1, wy + 5), s.kilt);
  }
  // Torse.
  const ty = sy,
    belly = s.belly ? 2 : 0;
  k.rect(cx - hw, ty, hw * 2, wy - ty, s.bare ? skin : m);
  if (belly) ell(k, cx, wy - 4, hw + 1, 4, s.bare ? skin : m);
  if (s.bare) {
    k.rect(cx - 3, ty + 3, 2, 1, shade(skin, 0.8));
    k.rect(cx + 1, ty + 3, 2, 1, shade(skin, 0.8));
    k.rect(cx - hw, wy - 2, hw * 2, 2, s.belt || dk);
  } else {
    k.rect(cx - hw, ty, 3, wy - ty, lt);
    k.rect(cx - hw, wy - 3, hw * 2, 2, s.belt || dk);
    k.px(cx, wy - 3, ac);
  }
  if (s.ribs)
    for (let y = ty + 2; y < wy - 3; y += 2) k.rect(cx - hw + 1, y, hw * 2 - 2, 1, shade(skin, 0.7));
  if (s.armor) {
    // Cuirasse : plastron et épaulières de métal.
    k.rect(cx - hw + 1, ty + 1, hw * 2 - 2, wy - ty - 4, metal[1]);
    k.rect(cx - hw + 1, ty + 1, 3, wy - ty - 4, metal[0]);
    k.rect(cx - 1, ty + 2, 2, wy - ty - 6, s.armor === true ? ac : s.armor);
    k.rect(cx - hw - 3, ty - 1, 5, 4, metal[0]);
    k.rect(cx + hw - 2, ty - 1, 5, 4, metal[1]);
    k.rect(cx - hw - 3, ty + 2, 5, 1, metal[2]);
    k.rect(cx + hw - 2, ty + 2, 5, 1, metal[2]);
  }
  if (s.collar)
    k.poly(
      xy(
        cx - hw - 1,
        ty - 4,
        cx - 2,
        ty + 2,
        cx + 2,
        ty + 2,
        cx + hw + 1,
        ty - 4,
        cx + hw,
        ty + 1,
        cx - hw,
        ty + 1
      ),
      s.collar
    );
  if (s.chains)
    for (let i = 0; i < hw * 2; i += 2)
      k.px(cx - hw + i, ty + 3 + Math.round(i / 2), i % 4 ? metal[0] : metal[2]);
  // Bras.
  const aw = B.arm,
    sleeve = s.bare || s.armsBare ? skin : m;
  k.rect(cx - hw - aw, ty, aw, wy - ty - 1, sleeve);
  k.rect(cx + hw, ty, aw, wy - ty - 1, sleeve);
  if (s.longArms) {
    k.rect(cx - hw - aw, wy - 1, aw, 6, sleeve);
    k.rect(cx + hw, wy - 1, aw, 6, sleeve);
    lh.y = wy + 5;
    rh.y = wy + 5;
  }
  const hand = s.gloves || (s.claws ? skin : skin);
  k.rect(lh.x + 3 - aw, lh.y - 1, aw, 2, hand);
  k.rect(rh.x - 1, rh.y - 1, aw, 2, hand);
  if (s.claws) {
    for (const x of [lh.x + 3 - aw, lh.x + 4 - aw]) k.rect(x, lh.y + 1, 1, 2, CLAW);
    for (const x of [rh.x - 1, rh.x]) k.rect(x, rh.y + 1, 1, 2, CLAW);
  }
  // Tête et visage.
  head(k, pal, s, { cx, hx, hw: hw2, hy, hh, skin, metal });
  // Arme et main gauche, devant le corps.
  if (s.off) item(k, s.off, lh.x + 1, lh.y, pal, metal, -1);
  if (s.hold) item(k, s.hold, rh.x, rh.y, pal, metal, 1);
}
// Ailes dans le dos d'un humanoïde : plumes (ange), noires (déchu), membrane (démon), papillon.
function wingsBack(k, kind, sy) {
  const col =
      kind === 'dark' ? '#2a2230' : kind === 'demon' ? '#5a1e24' : kind === 'gold' ? '#fff0c0' : '#f4f0ff',
    edge =
      kind === 'dark' ? '#4a3e58' : kind === 'demon' ? '#8a2e30' : kind === 'gold' ? '#e0b858' : '#c8c0e8';
  for (const side of [-1, 1]) {
    const f = x => (side < 0 ? 32 - x : x);
    if (kind === 'demon') {
      k.poly(xy(f(20), sy, f(30), sy - 8, f(32), sy + 4, f(28), sy + 2, f(27), sy + 9, f(22), sy + 8), col);
      k.line(f(20), sy, f(30), sy - 8, edge);
    } else {
      k.poly(
        xy(f(20), sy + 1, f(28), sy - 6, f(32), sy - 2, f(31), sy + 10, f(27), sy + 18, f(22), sy + 12),
        col
      );
      for (let i = 0; i < 3; i++) k.line(f(23 + i * 2), sy + 3, f(25 + i * 2), sy + 12 + i * 2, edge);
    }
  }
}
function head(k, pal, s, { cx, hx, hw, hy, hh, skin, metal }) {
  const [, dk, , ac, ey] = pal,
    face = s.face || 'human',
    hd = s.head;
  // Cheveux longs derrière la tête.
  if (s.hair) k.rect(hx - 1, hy + 2, hw + 2, hh + 3, s.hair);
  if (hd === 'hood' || hd === 'cowl' || hd === 'veil') {
    const hc = s.hoodColor || (hd === 'veil' ? '#f0ece4' : dk);
    k.rect(hx - 2, hy - 1, hw + 4, hh + 4, hc);
    if (hd === 'cowl') k.poly(xy(hx - 1, hy, cx, hy - 10, hx + hw + 1, hy), hc);
    else k.poly(xy(hx - 2, hy + 1, cx, hy - 3, hx + hw + 2, hy + 1), hc);
    if (hd === 'veil') k.rect(hx - 1, hy - 1, hw + 2, 2, s.veilBand || '#2a2230');
  }
  // Visage.
  const fx = hx + 1,
    fy = hy + 1,
    fw = hw - 2,
    fh = hh - 2;
  if (face === 'skull') {
    k.rect(hx, hy, hw, hh - 2, BONE);
    k.rect(hx + 1, hy + hh - 2, hw - 2, 2, BONE);
    k.rect(hx + 1, hy + 3, 2, 2, INK);
    k.rect(hx + hw - 3, hy + 3, 2, 2, INK);
    k.px(hx + 2, hy + 4, ey);
    k.px(hx + hw - 2, hy + 4, ey);
    k.px(cx - 1, hy + 6, INK);
    for (let x = hx + 2; x < hx + hw - 2; x += 2) k.px(x, hy + hh - 1, '#8a8068');
  } else if (face === 'shadow') {
    k.rect(fx, fy, fw, fh, '#0a0610');
    eye(k, fx + 1, fy + 2, ey, true);
    eye(k, fx + fw - 3, fy + 2, ey, true);
  } else if (face === 'helm') {
    k.rect(hx, hy, hw, hh, metal[1]);
    k.rect(hx, hy, hw, 2, metal[0]);
    k.rect(hx + 1, hy + 4, hw - 2, 2, INK);
    k.px(hx + 2, hy + 4, ey);
    k.px(hx + hw - 3, hy + 4, ey);
    for (let y = hy + 7; y < hy + hh; y += 2) k.px(cx - 1, y, INK);
  } else if (face === 'bull') {
    k.rect(hx - 1, hy, hw + 2, hh, skin);
    k.rect(hx + 1, hy + hh - 4, hw - 2, 4, shade(skin, 1.25));
    k.px(hx + 2, hy + hh - 3, INK);
    k.px(hx + hw - 3, hy + hh - 3, INK);
    k.rect(hx + 2, hy + hh, hw - 4, 1, GOLD[1]);
    eye(k, hx, hy + 3, ey, true);
    eye(k, hx + hw - 2, hy + 3, ey, true);
    k.poly(xy(hx - 1, hy + 2, hx - 6, hy - 1, hx - 5, hy - 5, hx - 3, hy - 1, hx, hy), CLAW);
    k.poly(
      xy(hx + hw + 1, hy + 2, hx + hw + 6, hy - 1, hx + hw + 5, hy - 5, hx + hw + 3, hy - 1, hx + hw, hy),
      CLAW
    );
    k.rect(hx - 3, hy + 2, 2, 2, skin);
    k.rect(hx + hw + 1, hy + 2, 2, 2, skin);
  } else {
    // Visage de chair (humain, pâle, gobelin, troll…).
    const col = face === 'pale' ? '#e8e4f0' : skin;
    k.rect(fx, fy, fw, fh, col);
    if (!hd || hd === 'bare' || hd === 'hair' || hd === 'crown' || hd === 'halo')
      k.rect(hx, hy + 1, hw, hh - 2, col);
    if (face === 'mask') {
      k.rect(fx, fy + 1, fw, 4, '#2a2024');
      k.px(fx + 1, fy + 2, ey);
      k.px(fx + fw - 2, fy + 2, ey);
    } else if (face === 'blind') {
      k.rect(fx, fy + 2, fw, 2, s.band || ac);
    } else {
      k.px(fx + 1, fy + 2, face === 'pale' ? '#e02040' : ey);
      k.px(fx + fw - 2, fy + 2, face === 'pale' ? '#e02040' : ey);
    }
    if (face === 'goblin' || face === 'troll') {
      // Nez crochu, grandes oreilles, crocs.
      k.rect(cx, fy + 3, 2, 3, shade(skin, 0.8));
      if (face === 'goblin') {
        k.poly(xy(hx, hy + 3, hx - 6, hy + 1, hx, hy + 6), skin);
        k.poly(xy(hx + hw, hy + 3, hx + hw + 6, hy + 1, hx + hw, hy + 6), skin);
      }
      k.rect(fx + 1, fy + fh - 1, fw - 2, 1, INK);
      k.px(fx + 1, fy + fh - 2, WHITE);
      k.px(fx + fw - 2, fy + fh - 2, WHITE);
    } else if (face === 'pale') {
      k.rect(fx + 2, fy + fh - 2, fw - 4, 1, '#6a1020');
      k.px(fx + 2, fy + fh - 1, WHITE);
      k.px(fx + fw - 3, fy + fh - 1, WHITE);
    } else if (face !== 'mask') k.rect(cx - 1, fy + fh - 2, 2, 1, shade(col, 0.7));
  }
  if (s.beard) {
    k.poly(
      xy(
        hx - 1,
        hy + hh - 4,
        hx + hw + 1,
        hy + hh - 4,
        hx + hw,
        hy + hh + 4,
        cx,
        hy + hh + 7,
        hx,
        hy + hh + 4
      ),
      s.beard
    );
    k.rect(cx - 2, hy + hh - 3, 4, 1, shade(s.beard, 0.7));
  }
  if (s.tusks) {
    k.rect(hx + 1, hy + hh - 3, 1, 3, BONE);
    k.rect(hx + hw - 2, hy + hh - 3, 1, 3, BONE);
  }
  // Coiffes.
  if (hd === 'bandana') {
    k.rect(hx, hy, hw, 3, ac);
    k.rect(hx, hy + hh - 4, hw, 3, ac);
    k.poly(xy(hx, hy + 1, hx - 4, hy + 4, hx - 2, hy + 1), ac);
  } else if (hd === 'hat') {
    k.rect(hx - 4, hy + 1, hw + 8, 2, s.hatColor || dk);
    k.rect(hx, hy - 3, hw, 4, s.hatColor || dk);
    k.rect(hx, hy, hw, 1, ac);
  } else if (hd === 'witch') {
    const hc = s.hatColor || dk;
    k.rect(hx - 4, hy + 1, hw + 8, 2, hc);
    k.poly(xy(hx, hy + 1, cx + 2, hy - 11, cx + 7, hy - 9, hx + hw, hy + 1), hc);
    k.rect(hx, hy - 1, hw, 2, ac);
  } else if (hd === 'mitre') {
    k.poly(xy(hx, hy + 1, cx, hy - 9, hx + hw, hy + 1), s.hatColor || WHITE);
    k.rect(cx - 1, hy - 7, 2, 8, GOLD[1]);
    k.rect(hx, hy, hw, 1, GOLD[1]);
  } else if (hd === 'crown') crown(k, hx, hy - 3, hw);
  else if (hd === 'helm' || hd === 'horned' || hd === 'miner') {
    k.rect(hx - 1, hy - 1, hw + 2, 4, metal[1]);
    k.rect(hx - 1, hy - 1, hw + 2, 1, metal[0]);
    k.rect(cx - 1, hy - 1, 2, 7, metal[2]);
    if (hd === 'horned') {
      k.poly(xy(hx - 1, hy + 1, hx - 5, hy - 2, hx - 5, hy - 6, hx - 2, hy - 2), CLAW);
      k.poly(xy(hx + hw + 1, hy + 1, hx + hw + 5, hy - 2, hx + hw + 5, hy - 6, hx + hw + 2, hy - 2), CLAW);
    }
    if (hd === 'miner') {
      k.rect(cx - 2, hy - 3, 4, 3, GOLD[1]);
      k.px(cx, hy - 3, WHITE);
      ghost(k, 0.3, () => k.disc(cx, hy - 2, 4, GOLD[0]));
    }
  } else if (hd === 'halo') {
    k.rect(hx, hy - 4, hw, 1, GOLD[0]);
    k.rect(hx - 1, hy - 3, 1, 1, GOLD[0]);
    k.rect(hx + hw, hy - 3, 1, 1, GOLD[0]);
  } else if (hd === 'antlers') {
    k.line(hx + 1, hy, hx - 3, hy - 7, WOOD[1]);
    k.line(hx - 1, hy - 3, hx - 4, hy - 3, WOOD[1]);
    k.line(hx + hw - 2, hy, hx + hw + 2, hy - 7, WOOD[1]);
    k.line(hx + hw, hy - 3, hx + hw + 3, hy - 3, WOOD[1]);
  } else if (hd === 'horns') {
    k.poly(xy(hx, hy + 1, hx - 2, hy - 4, hx + 2, hy), s.hornColor || CLAW);
    k.poly(xy(hx + hw, hy + 1, hx + hw + 2, hy - 4, hx + hw - 2, hy), s.hornColor || CLAW);
  } else if (hd === 'goggles') {
    k.rect(hx, hy + 2, hw, 2, '#5a3a24');
    k.disc(hx + 2, hy + 3, 1, '#9fe8ff');
    k.disc(hx + hw - 2, hy + 3, 1, '#9fe8ff');
    k.rect(hx, hy - 1, hw, 2, s.hair || '#f0f0f0');
  }
  if (s.crown && hd !== 'crown') crown(k, hx, hy - (hd === 'hood' ? 6 : 3), hw);
}
// Objets tenus en main : (x, y) est la main, `dir` 1 à droite et -1 à gauche.
function item(k, kind, x, y, pal, metal, dir) {
  const [, , , ac] = pal;
  switch (kind) {
    case 'sword':
      k.rect(x + 1, y - 15, 2, 15, metal[0]);
      k.rect(x + 1, y - 15, 1, 15, WHITE);
      k.rect(x - 1, y - 1, 6, 2, ac);
      k.rect(x + 1, y + 1, 2, 3, WOOD[2]);
      break;
    case 'greatsword':
      k.rect(x, y - 22, 3, 22, metal[0]);
      k.rect(x, y - 22, 1, 22, WHITE);
      k.rect(x - 2, y - 1, 7, 2, ac);
      k.rect(x + 1, y + 1, 2, 4, WOOD[2]);
      break;
    case 'dagger':
      k.rect(x + 1, y - 6, 1, 6, metal[0]);
      k.rect(x, y - 1, 3, 1, ac);
      break;
    case 'axe':
    case 'greataxe': {
      const big = kind === 'greataxe',
        top = y - (big ? 22 : 15);
      k.rect(x + 1, top, 2, y - top + 4, WOOD[1]);
      k.poly(
        xy(
          x + 3,
          top + 1,
          x + 3 + (big ? 7 : 5) * dir,
          top - 2,
          x + 3 + (big ? 7 : 5) * dir,
          top + (big ? 10 : 7),
          x + 3,
          top + (big ? 7 : 5)
        ),
        metal[0]
      );
      if (big) k.poly(xy(x, top + 1, x - 5, top - 1, x - 5, top + 8, x, top + 6), metal[1]);
      break;
    }
    case 'halberd':
    case 'spear':
      k.rect(x + 1, y - 24, 1, 30, WOOD[1]);
      k.poly(xy(x, y - 24, x + 1, y - 29, x + 3, y - 24), metal[0]);
      if (kind === 'halberd')
        k.poly(xy(x + 2, y - 23, x + 6, y - 25, x + 6, y - 18, x + 2, y - 20), metal[0]);
      break;
    case 'staff':
      k.rect(x + 1, y - 20, 2, 27, WOOD[1]);
      k.disc(x + 2, y - 22, 2, ac);
      k.px(x + 1, y - 23, WHITE);
      ghost(k, 0.3, () => k.disc(x + 2, y - 22, 4, ac));
      break;
    case 'scythe':
      k.rect(x + 1, y - 20, 1, 27, WOOD[2]);
      k.poly(xy(x + 1, y - 20, x - 9, y - 19, x - 12, y - 14, x - 6, y - 17, x + 1, y - 17), metal[0]);
      break;
    case 'shovel':
      k.rect(x + 1, y - 16, 1, 20, WOOD[1]);
      k.rect(x - 1, y - 18, 5, 2, WOOD[2]);
      k.poly(xy(x - 1, y + 3, x + 4, y + 3, x + 4, y + 8, x + 1, y + 10, x - 1, y + 8), metal[1]);
      break;
    case 'pickaxe':
      k.rect(x + 1, y - 12, 2, 16, WOOD[1]);
      k.poly(xy(x - 5, y - 11, x + 2, y - 15, x + 9, y - 11, x + 2, y - 13), metal[0]);
      break;
    case 'hammer':
      k.rect(x + 1, y - 12, 2, 16, WOOD[1]);
      k.rect(x - 3, y - 17, 10, 6, metal[1]);
      k.rect(x - 3, y - 17, 10, 2, metal[0]);
      break;
    case 'club':
      k.poly(xy(x, y + 2, x - 1, y - 12, x + 2, y - 15, x + 5, y - 12, x + 3, y + 2), WOOD[1]);
      k.px(x + 1, y - 10, WOOD[0]);
      for (const [px, py] of xy(x - 1, y - 9, x + 4, y - 11, x + 2, y - 15)) k.px(px, py, CLAW);
      break;
    case 'whip':
      k.rect(x + 1, y - 2, 2, 4, WOOD[2]);
      k.line(x + 2, y + 2, x + 5, y + 8, '#5a3a24');
      k.line(x + 5, y + 8, x + 2, y + 11, '#5a3a24');
      k.line(x + 2, y + 11, x + 6, y + 12, '#5a3a24');
      break;
    case 'crossbow':
      k.rect(x - 1, y - 3, 7, 2, WOOD[1]);
      k.line(x + 5, y - 7, x + 5, y + 2, WOOD[2]);
      k.line(x + 5, y - 7, x, y - 2, '#d8d0c0');
      break;
    case 'bow':
      k.line(x + 2, y - 10, x + 4, y - 5, WOOD[1]);
      k.line(x + 4, y - 5, x + 4, y + 3, WOOD[1]);
      k.line(x + 4, y + 3, x + 2, y + 8, WOOD[1]);
      k.line(x + 2, y - 10, x + 2, y + 8, '#e8e0d0');
      break;
    case 'book':
      k.rect(x - 2, y - 2, 6, 5, ac);
      k.rect(x - 1, y - 1, 4, 3, BONE);
      break;
    case 'lantern':
      k.rect(x, y, 1, 3, IRON[3]);
      k.rect(x - 2, y + 3, 5, 5, IRON[2]);
      k.rect(x - 1, y + 4, 3, 3, GOLD[0]);
      ghost(k, 0.3, () => k.disc(x, y + 5, 5, GOLD[1]));
      break;
    case 'censer':
      k.line(x + 1, y, x + 1, y + 5, GOLD[2]);
      k.disc(x + 1, y + 7, 2, GOLD[1]);
      ghost(k, 0.4, () => {
        k.disc(x + 3, y + 3, 2, '#d8d0e8');
        k.disc(x + 5, y, 2, '#d8d0e8');
      });
      break;
    case 'scales':
      k.rect(x + 1, y - 14, 1, 16, GOLD[2]);
      k.rect(x - 5, y - 14, 13, 1, GOLD[1]);
      k.line(x - 5, y - 14, x - 6, y - 9, GOLD[2]);
      k.line(x + 7, y - 14, x + 8, y - 9, GOLD[2]);
      k.rect(x - 8, y - 9, 5, 1, GOLD[1]);
      k.rect(x + 6, y - 9, 5, 1, GOLD[1]);
      break;
    case 'shield':
      k.poly(xy(x - 4, y - 9, x + 3, y - 9, x + 3, y, x - 0.5, y + 4, x - 4, y), metal[1]);
      k.rect(x - 3, y - 8, 5, 2, ac);
      k.rect(x - 1, y - 6, 1, 8, ac);
      break;
    case 'towershield':
      k.rect(x - 5, y - 13, 8, 18, metal[1]);
      k.rect(x - 5, y - 13, 8, 2, metal[0]);
      k.rect(x - 2, y - 9, 2, 10, ac);
      break;
    case 'chain':
      for (let i = 0; i < 6; i++) k.px(x + (i % 2), y + 1 + i * 2, metal[0]);
      k.disc(x + 1, y + 14, 2, metal[2]);
      break;
    case 'cleaver':
      k.rect(x + 1, y - 2, 2, 5, WOOD[2]);
      k.rect(x - 1, y - 11, 7, 9, metal[0]);
      k.rect(x - 1, y - 4, 7, 1, BLOOD);
      break;
    case 'torch':
      k.rect(x + 1, y - 8, 2, 12, WOOD[1]);
      k.poly(xy(x - 1, y - 8, x + 2, y - 15, x + 5, y - 8), '#ff8a2a');
      k.poly(xy(x + 1, y - 8, x + 2, y - 12, x + 3, y - 8), '#ffe07a');
      break;
    case 'wrench':
      k.rect(x + 1, y - 12, 2, 15, metal[1]);
      k.rect(x - 1, y - 15, 6, 4, metal[1]);
      k.rect(x + 1, y - 14, 2, 3, IRON[3]);
      break;
    case 'orb':
      k.disc(x + 1, y - 2, 3, ac);
      k.px(x, y - 3, WHITE);
      ghost(k, 0.3, () => k.disc(x + 1, y - 2, 5, ac));
      break;
    case 'flail':
      k.rect(x + 1, y - 6, 2, 9, WOOD[1]);
      k.line(x + 2, y - 6, x + 6, y - 11, metal[0]);
      k.disc(x + 7, y - 12, 2, metal[1]);
      k.px(x + 9, y - 12, metal[0]);
      k.px(x + 7, y - 15, metal[0]);
      break;
  }
}
// Déclare un humanoïde : réglages par défaut de l'espèce, que les options d'une créature précisent.
function humanoid(name, base, meta) {
  species(
    name,
    (k, pal, o) => {
      const s = elite(name, { ...base, ...o }, o.elite);
      if (s.spectral) ghost(k, 0.72, () => person(k, pal, s));
      else person(k, pal, s);
    },
    meta
  );
}
// Variante d'élite d'un humanoïde : plus massif, cuirassé ou couronné selon ce qu'il porte déjà.
function elite(name, s, on) {
  if (!on) return s;
  const e = { ...s };
  if (e.build === 'thin') e.build = 'normal';
  else if (e.build === 'normal' || !e.build) e.build = 'stocky';
  if (!e.armor && !e.robe) e.armor = true;
  if (!e.cape) e.cape = '#7a1a24';
  return e;
}
humanoid('humanoid', {});
// Bandit : capuche, foulard sur le visage, deux dagues.
humanoid('bandit', {
  build: 'thin',
  head: 'hood',
  face: 'mask',
  hold: 'dagger',
  off: 'dagger',
  belt: '#3a2a1c'
});
// Pilleur : chapeau à larges bords, hache et sac, barbe.
humanoid('raider', { head: 'hat', hold: 'axe', beard: '#5a3a24', belt: '#3a2a1c' });
// Gobelin : petit, grosse tête, oreilles pointues, nez crochu.
humanoid('goblin', {
  build: 'small',
  face: 'goblin',
  skin: '#7aa65a',
  barefoot: true,
  kilt: '#6a4a30',
  hold: 'dagger'
});
// Troll : grand, voûté, longs bras, crocs, gourdin.
humanoid('troll', {
  build: 'big',
  face: 'troll',
  skin: '#6e8e5a',
  bare: true,
  longArms: true,
  tusks: true,
  kilt: '#5a4430',
  barefoot: true,
  hold: 'club'
});
// Minotaure : tête de taureau aux grandes cornes, torse nu, sabots, hache à deux mains.
humanoid('minotaur', {
  build: 'big',
  face: 'bull',
  skin: '#8a5e40',
  bare: true,
  hooves: true,
  kilt: '#5a3a24',
  hold: 'greataxe',
  belly: false
});
// Goule : chair grise, côtes saillantes, griffes, voûtée.
humanoid('ghoul', {
  build: 'thin',
  face: 'troll',
  skin: '#a8b49a',
  bare: true,
  ribs: true,
  claws: true,
  longArms: true,
  barefoot: true,
  kilt: '#4a3a2a'
});
// Ogre geôlier : ventre, masque de cuir, chaînes, couperet.
humanoid('ogre', {
  build: 'big',
  face: 'mask',
  skin: '#c89070',
  bare: true,
  belly: true,
  chains: true,
  hold: 'cleaver',
  off: 'chain',
  kilt: '#4a3428',
  barefoot: true
});
// Nain : trapu, grande barbe, casque, marteau.
humanoid('dwarf', { build: 'dwarf', head: 'helm', beard: '#c87a3a', hold: 'hammer', armor: true });
// Chevalier : armure, heaume, épée et bouclier, cape.
humanoid('knight', {
  face: 'helm',
  armor: true,
  hold: 'sword',
  off: 'shield',
  legs: IRON[2],
  boots: IRON[3],
  armsBare: false
});
// Prêtre ou mage en robe : capuche, bâton.
humanoid('caster', { robe: true, head: 'hood', face: 'shadow', hold: 'staff' });
// Squelette : os nus, orbites luisantes (le corps est peint à part, voir plus bas).
// Vampire : visage pâle, col haut, cape.
humanoid('vampire', {
  build: 'thin',
  robe: true,
  face: 'pale',
  hair: '#1a1018',
  collar: '#2a0a12',
  cape: '#1a0a10'
});
// Sorcière : chapeau pointu, cheveux, balai ou bâton.
humanoid('witch', { robe: true, head: 'witch', hair: '#3a2a3a', hold: 'staff' });
// Pénitent : cagoule pointue, dos nu, fouet.
humanoid('penitent', {
  build: 'thin',
  head: 'cowl',
  face: 'shadow',
  bare: true,
  ribs: true,
  skin: '#d8b8a0',
  kilt: '#5a4a3a',
  barefoot: true,
  hold: 'whip'
});
// Yéti : grand corps de fourrure blanche hirsute, visage bleuté, petites cornes, grands pieds.
species('yeti', (k, [m, dk, lt, ac, ey], o) => {
  k.rect(8, 30, 6, 6, m);
  k.rect(18, 30, 6, 6, m);
  k.rect(6, 34, 8, 2, dk);
  k.rect(18, 34, 8, 2, dk);
  ell(k, 16, 21, 10, 10, m);
  for (let x = 6; x < 27; x += 2) k.rect(x, 30 + (x % 4 ? 1 : 0), 1, 2, m);
  k.rect(1, 13, 6, 17, m);
  k.rect(25, 13, 6, 17, m);
  for (let y = 15; y < 30; y += 3) {
    k.px(0, y, m);
    k.px(31, y, m);
  }
  k.rect(1, 29, 6, 3, ac);
  k.rect(25, 29, 6, 3, ac);
  speckle(k, 7, 12, 18, 18, lt, 14, 13);
  k.rect(12, 9, 9, 8, ac);
  k.rect(13, 14, 7, 2, INK);
  k.px(14, 14, WHITE);
  k.px(18, 14, WHITE);
  eye(k, 13, 11, ey, true);
  eye(k, 18, 11, ey, true);
  ell(k, 16, 7, 6, 3, m);
  k.poly(pts('10 6, 7 1, 11 4'), dk);
  k.poly(pts('22 6, 25 1, 21 4'), dk);
  if (o.elite) {
    k.poly(pts('9 5, 4 -1, 6 4'), ac);
    k.poly(pts('23 5, 28 -1, 26 4'), ac);
    for (const [x, y] of pts('3 12, 28 12, 16 2')) k.poly(xy(x - 1, y, x, y - 4, x + 2, y), '#d0f4ff');
  }
});
// Kobold : petit reptile à museau de chien, cornes courtes, queue, casque de mineur et pioche.
species('kobold', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('10 28, 3 31, 1 35, 5 33, 11 31'), m);
  k.rect(11, 29, 3, 7, dk);
  k.rect(17, 29, 3, 7, dk);
  k.rect(10, 34, 4, 2, CLAW);
  k.rect(17, 34, 4, 2, CLAW);
  ell(k, 15, 24, 5, 6, m);
  k.rect(13, 23, 5, 6, lt);
  k.rect(10, 27, 11, 2, '#5a3a24');
  k.rect(9, 20, 2, 7, m);
  // Tête à museau
  ell(k, 15, 14, 5, 5, m);
  k.poly(pts('18 12, 26 14, 26 17, 18 18'), m);
  k.rect(24, 13, 2, 1, INK);
  k.line(19, 17, 25, 17, dk);
  k.px(21, 18, WHITE);
  eye(k, 17, 12, ey, true);
  k.poly(pts('12 10, 9 5, 13 9'), CLAW);
  if (o.head !== 'crown') {
    k.rect(10, 8, 10, 3, IRON[1]);
    k.rect(14, 6, 3, 3, GOLD[1]);
    ghost(k, 0.3, () => k.disc(15, 7, 4, GOLD[0]));
  } else crown(k, 11, 6, 8);
  item(k, o.hold || 'pickaxe', 21, 25, [m, dk, lt, ac], IRON, 1);
  k.rect(20, 23, 3, 3, m);
  if (o.elite) {
    k.rect(12, 21, 7, 4, IRON[1]);
    k.rect(12, 21, 7, 1, IRON[0]);
  }
});
// Diablotin : petit démon rouge aux ailes de chauve-souris, cornes, queue en pointe de flèche, fourche.
species('imp', (k, [m, dk, lt, ac, ey], o) => {
  if (!o.nowings) {
    k.poly(pts('12 18, 3 9, 1 18, 5 16, 6 22'), dk);
    k.poly(pts('20 18, 29 9, 31 18, 27 16, 26 22'), dk);
  }
  k.line(12, 28, 6, 32, m);
  k.line(6, 32, 3, 28, m);
  k.poly(pts('1 27, 5 27, 3 24'), m);
  k.rect(12, 28, 3, 8, dk);
  k.rect(17, 28, 3, 8, dk);
  k.rect(11, 34, 4, 2, INK);
  k.rect(17, 34, 4, 2, INK);
  ell(k, 16, 24, 5, 6, m);
  k.rect(14, 23, 4, 4, lt);
  k.disc(16, 14, 5, m);
  k.poly(pts('11 12, 9 5, 13 10'), ac);
  k.poly(pts('21 12, 23 5, 19 10'), ac);
  eye(k, 13, 13, ey, true);
  eye(k, 17, 13, ey, true);
  k.rect(14, 17, 4, 1, INK);
  k.px(14, 16, WHITE);
  k.px(17, 16, WHITE);
  // Fourche
  k.rect(24, 10, 1, 22, WOOD[2]);
  k.rect(22, 9, 5, 1, IRON[1]);
  for (const x of [22, 24, 26]) k.rect(x, 6, 1, 3, IRON[0]);
  k.rect(20, 21, 5, 3, m);
  if (o.elite) {
    ghost(k, 0.5, () => k.disc(16, 9, 3, '#ff8a2a'));
    k.poly(pts('14 9, 16 3, 18 9'), '#ffd36b');
    k.poly(pts('11 11, 7 2, 12 8'), ac);
    k.poly(pts('21 11, 25 2, 20 8'), ac);
  }
});
// Gargouille : statue ailée accroupie, cornes, ailes repliées, griffes sur le socle.
species('gargoyle', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('10 12, 2 4, 0 14, 4 22, 10 24'), dk);
  k.poly(pts('22 12, 30 4, 32 14, 28 22, 22 24'), dk);
  k.line(10, 13, 2, 5, m);
  k.line(22, 13, 30, 5, m);
  k.rect(6, 33, 20, 3, shade(m, 0.8));
  ell(k, 16, 25, 8, 8, m);
  k.rect(8, 28, 5, 6, m);
  k.rect(19, 28, 5, 6, m);
  for (const x of [8, 10, 12, 19, 21, 23]) k.px(x, 33, CLAW);
  k.rect(11, 20, 3, 9, lt);
  k.rect(18, 20, 3, 9, lt);
  k.rect(11, 9, 10, 9, m);
  k.rect(13, 15, 6, 3, dk);
  k.px(14, 15, WHITE);
  k.px(17, 15, WHITE);
  eye(k, 12, 11, ey, true);
  eye(k, 18, 11, ey, true);
  k.poly(pts('11 9, 8 3, 13 8'), ac);
  k.poly(pts('21 9, 24 3, 19 8'), ac);
  speckle(k, 8, 18, 16, 14, dk, 10, 17);
  if (o.elite) for (const [x, y] of pts('7 22, 24 19, 14 26')) k.line(x, y, x + 2, y + 3, ac);
});

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

// ---------------------------------------------------------------- Rendu
const CACHE = new Map(),
  NOT_FLAGS = new Set(['elite', 'look', 'pal', 'name']);
// Sprite d'une créature (34 × 42) : ombre au sol, contour sombre d'un pixel, puis le dessin modelé (haut éclairé,
// bas dans l'ombre). Gardé en cache par espèce, palette et options.
export function creatureSprite(look, pal, opts = {}) {
  const name = SPECIES[look] ? look : ALIASES[look] || 'wolf',
    flags = Object.keys(opts)
      .filter(f => opts[f] && !NOT_FLAGS.has(f))
      .sort(),
    key =
      name + '|' + pal.join() + '|' + flags.map(f => f + '=' + opts[f]).join() + (opts.elite ? '|elite' : '');
  if (CACHE.has(key)) return CACHE.get(key);
  const k = brush(32, 40);
  SPECIES[name].draw(k, pal, opts);
  polish(k.cv, 2, look.length);
  const src = k.g.getImageData(0, 0, 32, 40).data,
    out = makeCanvas(34, 42),
    og = out.getContext('2d'),
    img = og.getImageData(0, 0, 34, 42),
    d = img.data,
    alpha = (x, y) => (x < 0 || y < 0 || x >= 32 || y >= 40 ? 0 : src[(y * 32 + x) * 4 + 3]);
  // Ombre portée au sol.
  for (let y = 37; y < 40; y++) for (let x = 7; x < 27; x++) d[(y * 34 + x) * 4 + 3] = 90;
  for (let y = 0; y < 42; y++)
    for (let x = 0; x < 34; x++) {
      const sx = x - 1,
        sy = y - 1,
        i = (y * 34 + x) * 4,
        a = alpha(sx, sy);
      if (a > 0) {
        const j = (sy * 32 + sx) * 4,
          f = a / 255,
          below = d[i + 3] / 255;
        for (let c = 0; c < 3; c++) d[i + c] = src[j + c] * f + d[i + c] * (1 - f);
        d[i + 3] = Math.round((f + below * (1 - f)) * 255);
      } else if (
        alpha(sx - 1, sy) > 128 ||
        alpha(sx + 1, sy) > 128 ||
        alpha(sx, sy - 1) > 128 ||
        alpha(sx, sy + 1) > 128
      ) {
        d[i] = 14;
        d[i + 1] = 10;
        d[i + 2] = 22;
        d[i + 3] = 217;
      }
    }
  og.putImageData(img, 0, 0);
  CACHE.set(key, out);
  return out;
}
// Anciennes silhouettes génériques : chaque nom reste valable et mène à l'espèce la plus proche.
const ALIASES = {
  quad: 'wolf',
  beast: 'rat',
  flyer: 'bat',
  robed: 'caster',
  rogue: 'bandit',
  brute: 'ogre',
  spirit: 'ghost'
};
export const creatureFloats = look => !!SPECIES[SPECIES[look] ? look : ALIASES[look]]?.float;
export const creatureLegs = look => SPECIES[SPECIES[look] ? look : ALIASES[look]]?.legs !== false;
export const CREATURE_SPECIES = () => Object.keys(SPECIES);
// Nom unique pour les scripts classiques (pont).
export const CANAAN_CREATURE_ART = Object.freeze({
  creatureSprite,
  creatureFloats,
  creatureLegs,
  CREATURE_SPECIES
});
