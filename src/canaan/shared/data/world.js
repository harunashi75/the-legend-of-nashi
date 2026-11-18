// @ts-check
// Monde : règles des donjons et raids, monstres ordinaires, boss de monde et leur délai de réapparition.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';
import { DUNGEONS } from './dungeons/index.js';

// Donjons et raids : règles de chaque instance (fiches de shared/data/dungeons/). La position (x, y) est fixée par la
// génération de l'île. Trois boss par donjon, six par raid (le dernier est `boss`), plus des boss cachés (`secrets`)
// derrière des passages secrets.
export const INSTANCE_DEFS = deepFreeze(
  DUNGEONS.map(d => {
    const { name, biome, ...rest } = d.rules;
    return { name, biome, x: 0, y: 0, ...rest };
  })
);
// Liste modifiable pour une partie : la génération de l'île y place chaque portail.
export function createInstances() {
  return JSON.parse(JSON.stringify(INSTANCE_DEFS));
}
export const MOB_TYPES = deepFreeze([
  { name: 'Slime', color: '#5eff8a', hp: 40 },
  { name: 'Loup', color: '#9c8061', hp: 65 },
  { name: 'Squelette', color: '#d4d4c9', hp: 90 },
  { name: 'Spectre', color: '#a998f2', hp: 85 },
  { name: 'Araignée', color: '#8b6d8f', hp: 75 },
  { name: 'Golem', color: '#91a2b4', hp: 170 },
  { name: 'Scorpion', color: '#e0b367', hp: 110 },
  { name: 'Élémentaire', color: '#ff8752', hp: 135 },
  { name: 'Dragonnet', color: '#e86c80', hp: 190 },
  { name: 'Gobelin', color: '#83bb67', hp: 85 },
  { name: 'Pilleur', color: '#c09a81', hp: 110 },
  { name: 'Sanglier', color: '#7975a8', hp: 65 },
  { name: 'Ours', color: '#d38ac2', hp: 100 },
  { name: 'Yéti', color: '#d4f1f5', hp: 165 },
  { name: 'Troll', color: '#f19955', hp: 135 },
  { name: 'Gardien astral', color: '#7acbe6', hp: 210 },
  { name: 'Chauve-souris', color: '#8b78a8', hp: 48 },
  { name: 'Bandit', color: '#bd7658', hp: 105 },
  { name: 'Mante des roseaux', color: '#8bb66b', hp: 92 },
  { name: 'Corbeau spectral', color: '#6d719e', hp: 120 },
  { name: 'Basilic', color: '#6dba72', hp: 180 },
  { name: 'Drake des dunes', color: '#d6a05b', hp: 225 },
  { name: 'Araignée venimeuse', color: '#b46c9d', hp: 115 },
  { name: 'Ent corrompu', color: '#668d4b', hp: 240 },
  { name: 'Chevalier déchu', color: '#737d9f', hp: 260 },
  { name: 'Wisp', color: '#8fe8ed', hp: 72 },
  { name: 'Molosse infernal', color: '#e36d4f', hp: 195 },
  { name: 'Fée sauvage', color: '#e99bda', hp: 88 },
  { name: 'Minotaure', color: '#b98b67', hp: 290 },
  { name: 'Serpent des glaces', color: '#9bdde8', hp: 160 },
  { name: 'Drake astral', color: '#9c86ff', hp: 310 },
  // Les Tréfonds, sous l'île (underground.js) : quatre créatures par biome, à la taille du héros qui les croise.
  { name: 'Ver des boues', color: '#8a6440', hp: 120, under: 0 },
  { name: 'Taupe-garou', color: '#6a4e3a', hp: 150, under: 0 },
  { name: 'Scarabée foreur', color: '#4a6a7a', hp: 110, under: 0 },
  { name: 'Gobelin des mines', color: '#8aa05a', hp: 95, under: 0 },
  { name: 'Sentinelle de pierre', color: '#8a8478', hp: 210, under: 1 },
  { name: 'Spectre minier', color: '#7ab8e0', hp: 100, under: 1 },
  { name: 'Squelette nain', color: '#d8ccb0', hp: 115, under: 1 },
  { name: 'Gargouille', color: '#6a6e7a', hp: 140, under: 1 },
  { name: 'Goule', color: '#a8b49a', hp: 160, under: 2 },
  { name: 'Âme errante', color: '#9ae8c0', hp: 85, under: 2 },
  { name: 'Chevalier des tombes', color: '#5a5e6e', hp: 240, under: 2 },
  { name: 'Corbeau des tombes', color: '#4a4258', hp: 90, under: 2 },
  { name: 'Myconide', color: '#c8604a', hp: 150, under: 3 },
  { name: 'Limace des fanges', color: '#6a7a3a', hp: 130, under: 3 },
  { name: 'Mille-pattes géant', color: '#9a4a2a', hp: 125, under: 3 },
  { name: 'Moustique des fanges', color: '#5a6a4a', hp: 70, under: 3 }
]);
// Huit boss mondiaux persistants répartis dans les six biomes, au niveau de leur zone ; position fixée par la
// génération de l'île. Leurs PV et dégâts viennent de leur niveau (shared/rules/stats.js).
export const WORLD_BOSS_DEFS = deepFreeze([
  { id: 'fenrir', name: 'Fenrir, Croc Ancien', biome: 0, level: 10, hp: 1050, color: '#82c6d9' },
  {
    id: 'nocturne',
    name: 'Nocturne, Gardien du Crépuscule',
    biome: 1,
    level: 20,
    hp: 2750,
    color: '#b28aff'
  },
  { id: 'leviathan', name: 'Léviathan des Brumes', biome: 2, level: 30, hp: 1750, color: '#5dd8dc' },
  { id: 'golem', name: 'Golem des Étoiles', biome: 3, level: 36, hp: 3450, color: '#bb93ff' },
  { id: 'colosse', name: 'Colosse des Cimes Éternelles', biome: 3, level: 40, hp: 3950, color: '#d2e9f5' },
  { id: 'ifrit', name: 'Ifrit, Cœur de Braise', biome: 4, level: 45, hp: 2450, color: '#f58c48' },
  { id: 'seraph', name: 'Séraphin Déchu', biome: 4, level: 50, hp: 5200, color: '#ff6d92' },
  { id: 'chronos', name: 'Chronos, Dévoreur du Continuum', biome: 5, level: 60, hp: 6100, color: '#72e6f4' }
]);
export const BOSS_RESPAWN_MS = 3 * 60 * 1000;
