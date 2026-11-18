// @ts-check
// Donjons, raids et Arène : vues par catégorie des fiches de shared/data/dungeons/ (une fiche par instance, dans
// l'ordre de INSTANCE_DEFS), et constantes de l'exploration. Pour modifier ou ajouter un donjon : sa fiche dans
// shared/data/dungeons/, et la liste shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';
import { DUNGEONS, DUNGEON_ARENA_SHEET as ARENA } from './dungeons/index.js';

export { DUNGEONS, DUNGEON_ARENA_SHEET } from './dungeons/index.js';
// Structure de chaque instance (forme du plan, dangers, décors posés, type de porte), avec sa clé.
export const DUNGEON_LAYOUTS = deepFreeze(DUNGEONS.map(d => ({ key: d.key, ...d.layout })));
// Arène des Épreuves : colisée de sable chaud.
export const DUNGEON_ARENA_LAYOUT = deepFreeze({ key: ARENA.key, ...ARENA.layout });
// Créatures de chaque instance : monstres, boss de chaque étape et boss secrets.
export const DUNGEON_ACTORS = deepFreeze(DUNGEONS.map(d => d.actors));
// Apparence de chaque instance (sols, murs, lumière, flammes, runes, bannières, piliers, particules), avec sa clé.
export const DUNGEON_PALETTES = deepFreeze(DUNGEONS.map(d => ({ key: d.key, ...d.palette })));
export const DUNGEON_ARENA_PALETTE = deepFreeze({ key: ARENA.key, ...ARENA.palette });
// Le héros entre toujours sur cette case (enterInstance).
export const DUNGEON_ENTRY = deepFreeze({ x: 120, y: 133 });
// Piste de l'Arène : centre et rayon en cases ; le héros entre par l'antichambre au sud (DUNGEON_ENTRY).
export const DUNGEON_ARENA = deepFreeze({ cx: 120, cy: 111, r: 12.6, gateY: 125 });
// Objets posés au sol qui bloquent le passage ; les autres sont décoratifs.
export const DUNGEON_SOLID_PROPS = deepFreeze([
  'pillar',
  'statue',
  'angelstatue',
  'brazier',
  'anvil',
  'minecart',
  'cage',
  'rack',
  'gear',
  'hourglass',
  'pillarlight',
  'dragonskull'
]);
// Chance d'équipement de chaque boss, pour chaque héros.
export const DUNGEON_BOSS_DROP_CHANCE = 0.61;
