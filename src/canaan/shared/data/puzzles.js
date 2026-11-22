// @ts-check
// Énigmes des quêtes (« Les Échos de l’Aurore ») : constellation, leviers des miroirs et rayon des miroirs, en cases
// relatives au lieu de la quête. Les règles sont dans shared/rules/puzzles.js ; les lieux, objets et dessins dans
// scripts/quests.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

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
// Rayon des miroirs : quête 24 (pierre solaire → porte du temple).
export const PUZZLE_BEAMS = deepFreeze({
  q24: { sun: [-4, 2], dir: [1, 0], target: [2, -4], key: 'm', bound: [6, 5] }
});
