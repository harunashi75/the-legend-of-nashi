// @ts-check
// Énigmes des quêtes (« Les Échos de l’Aurore ») : séquences, symboles, scènes, réponses, constellation, leviers des
// miroirs, bassin du bateau, aqueduc de l'oasis et rayons des miroirs, en cases relatives au lieu de la quête.
// Les règles des énigmes sont dans shared/rules/puzzles.js ; les lieux, objets et dessins dans scripts/quests.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// ---------------------------------------------------------------- Lieux et énigmes
export const PUZZLE_ORDER_Q1 = deepFreeze(['soleil', 'pluie', 'vent', 'lune']);
export const PUZZLE_SYMBOLS_Q2 = deepFreeze(['étoile', 'lune', 'flamme']);
export const PUZZLE_SCENES_Q12 = deepFreeze([
  ['☀️', 'La paix', 'Les anciens chantent autour du Cœur de l’Aurore.'],
  ['🌑', 'La menace', 'Une ombre immense monte de la mer.'],
  ['✦', 'Le sacrifice', 'Le Cœur se brise en six étoiles.'],
  ['🕯️', 'L’espoir', 'Six sanctuaires s’allument sur l’île.'],
  ['🏃', 'La fuite', 'Les anciens s’enfuient et abandonnent l’île.']
]);
// ---------------------------------------------------------------- Chapitres IV à VI : lieux et énigmes
export const PUZZLE_VILLAGE_OBJS = deepFreeze([
  ['enclume', '⚒️'],
  ['cloche', '🔔'],
  ['berceau', '🧺'],
  ['harpe', '🎵']
]);
export const PUZZLE_HOUSES = deepFreeze(['puits', 'four', 'jardin', 'tour']);
export const PUZZLE_SEASONS = deepFreeze([
  ['🌸', 'Printemps'],
  ['☀️', 'Été'],
  ['🍂', 'Automne'],
  ['❄️', 'Hiver']
]);
export const PUZZLE_GEARS = deepFreeze(['vide', 'petit', 'grand']);
// Lieux de la fin de l'histoire : la clé de leur solution.
export const PUZZLE_ANSWER = deepFreeze({
  q17: [3, 0, 1, 2],
  q19: [2, 1, 2],
  q21: [1, 3, 0],
  q25: [1, 0, 1],
  q29: [0, 1, 2, 3]
});
// Constellation du lac (quête 30) : pierres dans l'ordre où leurs étoiles s'allument.
export const PUZZLE_CONSTELLATION = deepFreeze([
  [-2, -1],
  [0, -2],
  [1, 0],
  [0, 1],
  [2, 1]
]);
// Leviers du monde à l'envers (quête 28) : chaque levier bascule des rochers de l'autre clairière (inversés).
export const PUZZLE_MIRROR_LEVERS = deepFreeze([
  [
    [4, 1],
    [4, -2],
    [3, 0],
    [5, 1]
  ],
  [
    [4, 1],
    [5, 2],
    [5, 0]
  ],
  [
    [5, -2],
    [3, 1],
    [4, 2],
    [5, 1]
  ]
]);
// Bassin du bateau (quête 23) : x de -3 à 2, y de -2 à 1 ; rochers ; quai en bas à droite.
export const PUZZLE_BASIN = deepFreeze({
  x0: -3,
  x1: 2,
  y0: -2,
  y1: 1,
  rocks: [
    [-1, -2],
    [1, -1],
    [-2, 1],
    [0, 1]
  ],
  dock: [2, 1],
  start: [-3, -2]
});
export const PUZZLE_AQUEDUCT = deepFreeze({
  src: [-5, -3],
  a: [-3, -3],
  leakA: [-3, 0],
  b: [0, -3],
  leakB: [0, -5],
  c: [0, 0],
  leakC: [-2, 2],
  basin: [3, 2]
});
// Rayon des miroirs : quête 7 (pierre solaire → arbre gardien) et quête 24 (→ porte du temple).
export const PUZZLE_BEAMS = deepFreeze({
  q7: { sun: [-4, -2], dir: [1, 0], target: [2, -2], key: 'm', bound: [6, 5] },
  q24: { sun: [-4, 2], dir: [1, 0], target: [2, -4], key: 'm', bound: [6, 5] }
});
