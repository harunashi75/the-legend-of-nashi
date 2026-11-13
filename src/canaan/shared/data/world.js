// Monde : donjons et raids, monstres ordinaires, boss de monde et leur délai de réapparition.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Donjons et raids : biome d'accueil ; la position (x, y) est fixée par la génération de l'île.
export const INSTANCE_DEFS = deepFreeze([
  {
    name: 'La Cave des Terriers Abandonnés',
    biome: 0,
    x: 0,
    y: 0,
    boss: 'Gardien des Os',
    bosses: ['Gardien des Os'],
    color: '#a3c7ff',
    level: 7,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 9,
    // Récompense garantie du coffre de boss.
    rarity: 'Rare',
    dropLevel: 10
  },
  {
    name: 'La Mine Oubliée du Mithril',
    biome: 1,
    x: 0,
    y: 0,
    boss: 'Golem de Mithril',
    bosses: ['Golem de Mithril'],
    color: '#67d8ee',
    level: 13,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 15,
    // Récompense garantie du coffre de boss.
    rarity: 'Rare',
    dropLevel: 16
  },
  {
    name: 'Le Sanctuaire de l’Éclipse',
    biome: 1,
    x: 0,
    y: 0,
    boss: 'Oracle de l’Éclipse',
    bosses: ['Oracle de l’Éclipse'],
    color: '#ff9955',
    level: 18,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 20,
    // Récompense garantie du coffre de boss.
    rarity: 'Épique',
    dropLevel: 21
  },
  {
    name: 'La Citadelle des Pénitents',
    biome: 2,
    x: 0,
    y: 0,
    boss: 'Le Grand Inquisiteur',
    bosses: ['Le Grand Inquisiteur'],
    color: '#b79cff',
    level: 25,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 27,
    // Récompense garantie du coffre de boss.
    rarity: 'Épique',
    dropLevel: 28
  },
  {
    name: 'La Forge d’Écaille-Ardente',
    biome: 3,
    x: 0,
    y: 0,
    boss: 'Pyrrhax, Wyrm d’Écaille-Ardente',
    bosses: ['Pyrrhax, Wyrm d’Écaille-Ardente'],
    color: '#6bdfa2',
    level: 32,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 34,
    // Récompense garantie du coffre de boss.
    rarity: 'Épique',
    dropLevel: 35
  },
  {
    name: 'La Fosse d’Expiation',
    biome: 3,
    x: 0,
    y: 0,
    boss: 'Le Bourreau de l’Expiation',
    bosses: ['Le Bourreau de l’Expiation'],
    color: '#e88aff',
    level: 37,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 39,
    // Récompense garantie du coffre de boss.
    rarity: 'Épique',
    dropLevel: 40
  },
  {
    name: 'Le Bastion du Roi Sanglant',
    biome: 4,
    x: 0,
    y: 0,
    boss: 'Le Roi Sanglant',
    bosses: ['Sire Écorcheur', 'La Comtesse Écarlate', 'Le Roi Sanglant'],
    color: '#ffd36d',
    raid: true,
    level: 44,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 46,
    // Récompense garantie du coffre de boss.
    rarity: 'Héroïque',
    dropLevel: 47
  },
  {
    name: 'L’Aiguille du Continuum',
    biome: 4,
    x: 0,
    y: 0,
    boss: 'Le Dévoreur Stellaire',
    bosses: ['Le Gardien des Rouages', 'La Tisseuse du Temps', 'Le Dévoreur Stellaire'],
    color: '#ff7fa7',
    raid: true,
    level: 49,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 51,
    // Récompense garantie du coffre de boss.
    rarity: 'Héroïque',
    dropLevel: 52
  },
  {
    name: 'Le Thronos du Séraphin Divin',
    biome: 5,
    x: 0,
    y: 0,
    boss: 'Le Séraphin Divin',
    bosses: ['L’Archonte Radieux', 'La Sentinelle Auréolée', 'Le Séraphin Divin'],
    color: '#c4a0ff',
    raid: true,
    level: 54,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 56,
    // Récompense garantie du coffre de boss.
    rarity: 'Légendaire',
    dropLevel: 57
  },
  {
    name: 'Le Jugement de Célestia',
    subtitle: 'Raid 4 · Raid final',
    biome: 5,
    x: 0,
    y: 0,
    boss: 'L’Avatar du Jugement',
    bosses: ['Le Héraut de Célestia', 'La Balance Éternelle', 'L’Avatar du Jugement'],
    color: '#fff0a8',
    raid: true,
    level: 58,
    mobLevel: 60,
    // La difficulté choisie au portail fixe la qualité du butin, garanti, et la puissance des ennemis.
    difficulties: {
      normal: { label: 'Normal', icon: '⚔️', level: 58, mobLevel: 60, rarity: 'Mythique', dropLevel: 60, hp: 1, damage: 1 },
      heroic: {
        label: 'Héroïque',
        icon: '🔥',
        level: 60,
        mobLevel: 60,
        rarity: 'Céleste',
        dropLevel: 60,
        hp: 1.65,
        damage: 1.4
      }
    }
  }
]);
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
  { name: 'Drake astral', color: '#9c86ff', hp: 310 }
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
