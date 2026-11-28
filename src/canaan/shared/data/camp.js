// @ts-check
// Plan du Camp de l'Aurore (camp-life.js) : ruisseau, mare, chemins, objets posés, quai et zones calmes, en cases
// comptées depuis le feu du camp. Le dessin est dans scripts/camp/render.js, la pose dans scripts/camp/camp-life.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Ruisseau : ligne médiane de la source à la mare.
const STREAM = [
  [-19, -15],
  [-18, -11],
  [-16, -7],
  [-15, -3],
  [-16, 1],
  [-17, 5],
  [-17, 9],
  [-19, 12],
  [-20, 14]
];
const POND = { at: [-20, 14], r: 2.5 };
// Chemins de terre : allée de la ferme, allée du verger, sentier du jardin et cour de la ferme.
const PATHS = [
  [0, 4, 1, 19],
  // L'allée du verger descend jusqu'à la plage, où commence le quai.
  [-32, 5, -12, 6],
  [-6, -13, -5, -8],
  [2, 10, 8, 11],
  // Allée de la forge jusqu'au centre du camp.
  [-5, -3, -2, -2],
  // Sentier de la Ménagerie, depuis l'allée du jardin.
  [-11, -11, -7, -10]
];
// Objets : genre, case du coin haut-gauche, taille en cases ; block : toutes les cases bloquent.
// Places de rechange de la forge autour du camp (cases depuis le camp), des plus proches aux plus lointaines.
const FORGE_SPOTS = [];
for (let dy = -12; dy <= 12; dy += 2) for (let dx = -26; dx <= 26; dx += 2) FORGE_SPOTS.push([dx, dy]);
FORGE_SPOTS.sort(
  (a, b) => Math.abs(a[0] - 9) + Math.abs(a[1] - 1) - (Math.abs(b[0] - 9) + Math.abs(b[1] - 1))
);
// Salon de coiffure en plein air (barber.js) : sur la pelouse au nord-est de la fontaine, entre la route de la forge
// et l'allée de la Demeure, ou à la place libre la plus proche (jamais sur un chemin).
const BARBER_SPOTS = [];
for (let dy = -10; dy <= 10; dy += 1) for (let dx = -24; dx <= 24; dx += 1) BARBER_SPOTS.push([dx, dy]);
BARBER_SPOTS.sort(
  (a, b) => Math.abs(a[0] - 3) + Math.abs(a[1] + 4) - (Math.abs(b[0] - 3) + Math.abs(b[1] + 4))
);
const PROPS = [
  { kind: 'barn', x: 2, y: 6, w: 5, h: 4, block: true },
  { kind: 'silo', x: 7, y: 8, w: 2, h: 2, block: true },
  { kind: 'coop', x: -3, y: 7, w: 2, h: 2, block: true },
  { kind: 'pen', x: -12, y: 8, w: 8, h: 6 },
  { kind: 'trough', x: -7, y: 9, w: 1, h: 1, block: true },
  { kind: 'mud', x: -11, y: 12, w: 2, h: 1 },
  { kind: 'hay', x: 6, y: 12, w: 3, h: 1, block: true },
  { kind: 'cart', x: 3, y: 12, w: 2, h: 1, block: true },
  { kind: 'field', crop: 'wheat', x: -13, y: 15, w: 6, h: 5 },
  { kind: 'scarecrow', x: -10, y: 17, w: 1, h: 1, block: true, on: 'field' },
  { kind: 'field', crop: 'veg', x: -6, y: 15, w: 6, h: 5 },
  { kind: 'field', crop: 'fruit', x: 2, y: 15, w: 7, h: 5 },
  { kind: 'lantern', x: -1, y: 13, w: 1, h: 1, block: true },
  { kind: 'lantern', x: 2, y: 13, w: 1, h: 1, block: true },
  { kind: 'lantern', x: -1, y: 4, w: 1, h: 1, block: true },
  { kind: 'apple', x: -27, y: 2, w: 1, h: 1, block: true },
  { kind: 'apple', x: -24, y: 2, w: 1, h: 1, block: true },
  { kind: 'apple', x: -21, y: 2, w: 1, h: 1, block: true },
  { kind: 'apple', x: -27, y: 9, w: 1, h: 1, block: true },
  { kind: 'apple', x: -24, y: 9, w: 1, h: 1, block: true },
  { kind: 'apple', x: -21, y: 9, w: 1, h: 1, block: true },
  { kind: 'crates', x: -29, y: 7, w: 1, h: 2, block: true },
  { kind: 'basket', x: -23, y: 7, w: 1, h: 1, block: true },
  { kind: 'logs', x: -26, y: 12, w: 2, h: 1, block: true },
  { kind: 'woodpile', x: -6, y: 2, w: 3, h: 1, block: true },
  { kind: 'chop', x: -3, y: 2, w: 1, h: 1, block: true },
  // Forge du camp : là seulement se fabriquent les enchantements (canaan-gathering).
  { kind: 'forge', x: -6, y: -5, w: 3, h: 2, block: true, alt: FORGE_SPOTS },
  // Salon de coiffure : auvent, enseigne, fauteuil et coiffeuse sur la rangée du haut (qui bloque), tapis sur celle
  // du bas, où se tient la coiffeuse.
  { kind: 'barber', x: 3, y: -4, w: 3, h: 2, alt: BARBER_SPOTS },
  // Fontaine au centre du camp, sur les pavés de la place (là où était le feu de camp).
  { kind: 'fountain', x: -1, y: -1, w: 3, h: 3, block: true, onRoad: true },
  // Ménagerie (mounts.js) : enclos des montures à vendre et roulotte d'Oriane, à l'ouest de la Maison de la Guilde
  // (posée par house.js là où était le jardin).
  { kind: 'pen', mounts: true, x: -16, y: -16, w: 9, h: 4 },
  { kind: 'wagon', x: -15, y: -10, w: 4, h: 2, block: true },
  // Embellissements du camp (posés seulement s'ils trouvent leur place) : jardinières fleuries, étal du marché,
  // panneau d'affichage, poteau indicateur, bancs autour de la fontaine. Jamais sur les rangées du point d'apparition
  // (2 à 4 cases sous le centre), où l'on arrive et repart.
  ...[
    [-4, -9],
    [3, -9],
    [4, -7],
    [10, -6],
    [-13, -4],
    [-8, -5],
    [-13, 5],
    [-8, 5],
    [3, -4],
    [-9, -9]
  ].map(([x, y]) => ({ kind: 'planter', x, y, w: 1, h: 1, block: true, optional: true })),
  {
    kind: 'stall',
    x: 6,
    y: -5,
    w: 3,
    h: 1,
    block: true,
    optional: true,
    alt: [
      [11, -4],
      [5, -3],
      [-12, -1],
      [6, 4]
    ]
  },
  {
    kind: 'board',
    x: -9,
    y: 0,
    w: 2,
    h: 1,
    block: true,
    optional: true,
    alt: [
      [-10, -2],
      [6, 0],
      [-9, 2],
      [7, -2]
    ]
  },
  {
    kind: 'signpost',
    x: 5,
    y: 1,
    w: 1,
    h: 1,
    block: true,
    optional: true,
    alt: [
      [8, 1],
      [-7, 1]
    ]
  },
  {
    kind: 'bench',
    x: -9,
    y: -6,
    w: 2,
    h: 1,
    block: true,
    optional: true,
    alt: [
      [-9, -4],
      [-1, -6]
    ]
  },
  {
    kind: 'bench',
    x: -1,
    y: -4,
    w: 2,
    h: 1,
    block: true,
    optional: true,
    alt: [
      [-1, -3],
      [-8, -2]
    ]
  }
];
// Quai : planches sur pilotis, de la plage droit vers le large (cases depuis le camp) ; le navire draconique est
// amarré le long de son bord nord. Il commence sur la plage (sa dernière case pose sur le sable) ; lanternes et
// caisses sur le bord sud. On passe derrière les lanternes comme derrière un arbre (elles ne bloquent pas).
const PIER = { x0: -44, x1: -32, y: 5, h: 2 };
const PIER_PROPS = [
  { kind: 'crates', x: -34, y: 6, w: 1, h: 1, block: true },
  { kind: 'lantern', x: -38, y: 6, w: 1, h: 1 },
  { kind: 'lantern', x: -43, y: 6, w: 1, h: 1 }
];
// Zones de la ferme où aucun monstre n'apparaît (cases depuis le camp).
const CALM = [
  [-46, 0, -28, 8],
  [-15, 3, 9, 20],
  [-28, 0, -19, 13],
  [-9, -20, 3, -13],
  [-22, -16, -14, 16],
  [-17, -17, -6, -8]
];

export const CAMP_PLAN = deepFreeze({ STREAM, POND, PATHS, PROPS, PIER, PIER_PROPS, CALM });
