// Économie : récompenses par source et prix des agrandissements du sac. Plus de matériaux de forge : la puissance
// vient des objets lâchés par les monstres, les boss, les donjons et les raids.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Récompenses hors instance : un objet garanti, de la qualité donnée et du niveau du monstre, du boss ou de la zone.
export const SOURCE_REWARDS = deepFreeze({
  // Ennemis ordinaires des donjons et raids : rien, pour ne pas remplir le sac (le coffre du boss fait le butin).
  instanceMob: {
    source: 'normal',
    rarity: null
  },
  normal: {
    source: 'normal',
    rarity: 'Commun'
  },
  // Monstres (élites comprises) : Commun ; le marchand vend du Peu commun. Coffres secrets (ouverts avec une clé
  // des secrets) : Épique.
  elite: {
    source: 'normal',
    rarity: 'Commun'
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
// Prix des neuf agrandissements du sac (10 places chacun).
export const BAG_PRICES = Object.freeze([250, 500, 900, 1500, 2400, 3600, 5200, 7200, 9500]);
