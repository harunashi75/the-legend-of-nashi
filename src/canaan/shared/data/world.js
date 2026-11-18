// @ts-check
// Monde : donjons et raids, monstres ordinaires, boss de monde et leur délai de réapparition.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Donjons et raids : biome d'accueil ; la position (x, y) est fixée par la génération de l'île. Trois boss par
// donjon, six par raid (le dernier est `boss`), plus des boss cachés (`secrets`) derrière des passages secrets.
export const INSTANCE_DEFS = deepFreeze([
  {
    name: 'La Cave des Terriers Abandonnés',
    biome: 0,
    x: 0,
    y: 0,
    boss: 'Gardien des Os',
    bosses: ['Grignotte, Reine des Rats', 'Le Fossoyeur Bossu', 'Gardien des Os'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Rat-Roi aux Mille Queues'],
    color: '#a3c7ff',
    level: 7,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 9,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 10
  },
  {
    name: 'La Mine Oubliée du Mithril',
    biome: 1,
    x: 0,
    y: 0,
    boss: 'Golem de Mithril',
    bosses: ['Le Contremaître Kobold Grisch', 'L’Araignée des Galeries', 'Golem de Mithril'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Mineur Sans Visage'],
    color: '#67d8ee',
    level: 13,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 15,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 16
  },
  {
    name: 'Le Sanctuaire de l’Éclipse',
    biome: 1,
    x: 0,
    y: 0,
    boss: 'Oracle de l’Éclipse',
    bosses: ['L’Acolyte du Crépuscule', 'Le Gardien Solaire', 'Oracle de l’Éclipse'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['L’Ombre de l’Astre Mort'],
    color: '#ff9955',
    level: 18,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 20,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 21
  },
  {
    name: 'La Citadelle des Pénitents',
    biome: 2,
    x: 0,
    y: 0,
    boss: 'Le Grand Inquisiteur',
    bosses: ['Le Geôlier Flagellant', 'La Mère Supérieure', 'Le Grand Inquisiteur'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Pénitent Oublié'],
    color: '#b79cff',
    level: 25,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 27,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 28
  },
  {
    name: 'La Forge d’Écaille-Ardente',
    biome: 3,
    x: 0,
    y: 0,
    boss: 'Pyrrhax, Wyrm d’Écaille-Ardente',
    bosses: ['Maître-Forgeron Kraag', 'L’Élémentaire de Scories', 'Pyrrhax, Wyrm d’Écaille-Ardente'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['La Salamandre d’Obsidienne'],
    color: '#6bdfa2',
    level: 32,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 34,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 35
  },
  {
    name: 'La Fosse d’Expiation',
    biome: 3,
    x: 0,
    y: 0,
    boss: 'Le Bourreau de l’Expiation',
    bosses: ['Le Gardien des Chaînes', 'La Pleureuse des Abysses', 'Le Bourreau de l’Expiation'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Celui-qui-Rampe-au-Fond'],
    color: '#e88aff',
    level: 37,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 39,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Rare',
    dropLevel: 40
  },
  {
    name: 'Le Bastion du Roi Sanglant',
    biome: 4,
    x: 0,
    y: 0,
    boss: 'Le Roi Sanglant',
    bosses: [
      'Le Maître-Chien Ravageur',
      'Sire Écorcheur',
      'Le Chapelain Sanguin',
      'La Comtesse Écarlate',
      'Le Champion du Sang',
      'Le Roi Sanglant'
    ],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Bourreau Masqué', 'La Dame Blanche du Bastion'],
    color: '#ffd36d',
    raid: true,
    level: 44,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 46,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Épique',
    dropLevel: 47
  },
  {
    name: 'L’Aiguille du Continuum',
    biome: 4,
    x: 0,
    y: 0,
    boss: 'Le Dévoreur Stellaire',
    bosses: [
      'L’Horloger Fou',
      'Le Gardien des Rouages',
      'Le Sablier Vivant',
      'La Tisseuse du Temps',
      'L’Écho des Âges',
      'Le Dévoreur Stellaire'
    ],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Paradoxe Errant', 'L’Enfant d’Avant le Temps'],
    color: '#ff7fa7',
    raid: true,
    level: 49,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 51,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Épique',
    dropLevel: 52
  },
  {
    name: 'Le Thronos du Séraphin Divin',
    biome: 5,
    x: 0,
    y: 0,
    boss: 'Le Séraphin Divin',
    bosses: [
      'Le Chérubin Vigilant',
      'L’Archonte Radieux',
      'Le Trône Ailé',
      'La Sentinelle Auréolée',
      'La Voix du Chœur',
      'Le Séraphin Divin'
    ],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['L’Ange Déchu Sans Nom', 'Le Gardien du Septième Ciel'],
    color: '#c4a0ff',
    raid: true,
    level: 54,
    // Niveau des ennemis de l'instance (boss : +1 en donjon, +2 en raid).
    mobLevel: 56,
    // Qualité du butin des boss (61 % de chance par boss et par héros).
    rarity: 'Épique',
    dropLevel: 57
  },
  {
    name: 'Le Jugement de Célestia',
    biome: 5,
    x: 0,
    y: 0,
    boss: 'L’Avatar du Jugement',
    bosses: [
      'Le Porte-Étoile',
      'Le Héraut de Célestia',
      'L’Astrolabe Vivant',
      'La Balance Éternelle',
      'Le Juge des Constellations',
      'L’Avatar du Jugement'
    ],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['La Comète Écarlate', 'Le Témoin du Premier Jour'],
    color: '#fff0a8',
    raid: true,
    level: 58,
    mobLevel: 60,
    // La difficulté choisie au portail fixe la qualité du butin, garanti, et la puissance des ennemis.
    difficulties: {
      normal: {
        label: 'Normal',
        icon: '⟦mode_normal⟧',
        level: 58,
        mobLevel: 60,
        rarity: 'Épique',
        dropLevel: 60,
        hp: 1,
        damage: 1
      },
      heroic: {
        label: 'Héroïque',
        icon: '⟦mode_heroic⟧',
        level: 60,
        mobLevel: 60,
        rarity: 'Épique',
        // Butin de prestige : 21 % de Légendaire, 11 % de Mythique (voir PRESTIGE_DROPS).
        prestige: 'raidHeroic',
        dropLevel: 60,
        hp: 1.65,
        damage: 1.4
      }
    }
  },
  // Donjons des Tréfonds (sous l'île, underground.js) : aucun niveau requis ; ennemis au niveau du groupe et
  // butin du niveau de chaque héros : Peu commun, 31 % de chances de Rare (PRESTIGE_DROPS.underground).
  {
    name: 'La Mine Effondrée de Durgrim',
    biome: 6,
    x: 0,
    y: 0,
    boss: 'Grumbar, le Contremaître Maudit',
    bosses: ['Le Chef d’Équipe Brisepierre', 'La Foreuse Possédée', 'Grumbar, le Contremaître Maudit'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Nain Emmuré'],
    color: '#e0a060',
    level: 1,
    mobLevel: 1,
    rarity: 'Peu commun',
    prestige: 'underground',
    dropLevel: 1,
    under: true,
    scaled: true
  },
  {
    name: 'Les Halls Engloutis de Khaz-Ombral',
    biome: 7,
    x: 0,
    y: 0,
    boss: 'Ombral, le Roi sous la Pierre',
    bosses: ['Le Héraut des Profondeurs', 'La Garde de Pierre Noire', 'Ombral, le Roi sous la Pierre'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Prince Noyé'],
    color: '#8ac8e8',
    level: 1,
    mobLevel: 1,
    rarity: 'Peu commun',
    prestige: 'underground',
    dropLevel: 1,
    under: true,
    scaled: true
  },
  {
    name: 'La Crypte des Mille Tombes',
    biome: 8,
    x: 0,
    y: 0,
    boss: 'Le Fossoyeur Éternel',
    bosses: ['Le Pilleur de Tombes', 'La Veuve des Cryptes', 'Le Fossoyeur Éternel'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Mille-et-Unième Mort'],
    color: '#a8f0c0',
    level: 1,
    mobLevel: 1,
    rarity: 'Peu commun',
    prestige: 'underground',
    dropLevel: 1,
    under: true,
    scaled: true
  },
  {
    name: 'Les Tréfonds Fongiques',
    biome: 9,
    x: 0,
    y: 0,
    boss: 'La Reine des Spores',
    bosses: ['Le Champignon Hurleur', 'Le Mycélium Vivant', 'La Reine des Spores'],
    // Boss cachés derrière les passages secrets : chacun donne une clé des secrets à chaque héros.
    secrets: ['Le Cœur de Moisissure'],
    color: '#e870c0',
    level: 1,
    mobLevel: 1,
    rarity: 'Peu commun',
    prestige: 'underground',
    dropLevel: 1,
    under: true,
    scaled: true
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
