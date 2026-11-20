// @ts-check
// Économie : récompenses par source et prix des agrandissements du sac. Plus de matériaux de forge : la puissance
// vient des objets lâchés par les monstres, les boss, les donjons et les raids.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Récompenses hors instance, au niveau du monstre, du boss ou de la zone. rarity : qualité garantie. chance et
// rarities : butin tiré (chance d'un objet, puis qualité selon les poids, en pourcentages).
export const SOURCE_REWARDS = deepFreeze({
  // Ennemis ordinaires des donjons et raids : rien, pour ne pas remplir le sac (le coffre du boss fait le butin).
  instanceMob: {
    source: 'normal',
    rarity: null
  },
  // Monstre ordinaire : un objet 38 % du temps, surtout Commun.
  normal: {
    source: 'normal',
    chance: 0.38,
    rarities: [
      ['Commun', 80],
      ['Peu commun', 17],
      ['Rare', 3]
    ]
  },
  // Élite : un objet à coup sûr, de meilleure qualité. Coffres secrets (ouverts avec une clé des secrets) : Épique.
  elite: {
    source: 'normal',
    chance: 1,
    rarities: [
      ['Commun', 60],
      ['Peu commun', 30],
      ['Rare', 9],
      ['Épique', 1]
    ]
  },
  worldBoss: { source: 'world', rarity: 'Rare' },
  secretChest: {
    source: 'hidden',
    rarity: 'Épique'
  }
});
// Anciens matériaux de forge (minerai, bois, essence, noyau) : supprimés. Les stocks des anciennes sauvegardes sont
// convertis en or au chargement, à ce prix par unité.
export const LEGACY_MATERIAL_GOLD = Object.freeze({ ore: 10, wood: 10, essence: 50, core: 200 });
// Sac : BAG_BASE places au départ, BAG_STEP de plus par agrandissement. Prix des neuf agrandissements : bas au
// début pour le confort, puis de plus en plus chers, pour que les derniers restent un objectif au niveau 60.
export const BAG_BASE = 20;
export const BAG_STEP = 10;
export const BAG_PRICES = Object.freeze([400, 900, 1700, 3000, 5000, 8000, 12500, 19000, 28000]);
// Or lâché au sol par un monstre de l'île ou des Tréfonds : base + parNiveau × niveau, multiplié pour une élite.
export const MOB_GOLD = Object.freeze({ base: 10, perLevel: 3, elite: 3.5 });
// Bourse d'or d'un boss mondial, selon son niveau : de base + parNiveau × niveau à 1,5 fois plus (bornes comprises).
export const WORLD_BOSS_GOLD = Object.freeze({ base: 150, perLevel: 20, spread: 1.5 });
// Bourse d'or du coffre de fin d'instance, pour chaque héros (bornes comprises). Difficulté héroïque : ×heroic.
export const INSTANCE_CHEST_GOLD = deepFreeze({ dungeon: [400, 600], raid: [1000, 1500], heroic: 1.5 });
