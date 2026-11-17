// @ts-check
// Règles économiques : qualité du butin par source, prix de vente et de la boutique.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { GEAR_RARITIES } from '../data/equipment.js';
import { rarityInfo } from './items.js';

// Qualité d'un butin hors instance selon sa source.
/**
 * @param {string} source
 */
export function lootRarity(source) {
  if (source === 'dungeon' || source === 'tier') return GEAR_RARITIES[2];
  return GEAR_RARITIES[1];
}
// Or rendu pour les anciens matériaux de forge d'une sauvegarde (minerai, bois, essence, noyau), qui n'existent plus.
/**
 * @param {any} materials anciens matériaux lus d'une sauvegarde (non fiable)
 * @param {Readonly<Record<string, number>>} prices
 * @returns {number}
 */
export function legacyMaterialGold(materials, prices) {
  if (!materials || typeof materials !== 'object') return 0;
  let gold = 0;
  for (const [key, price] of Object.entries(prices)) {
    // Valeurs invalides (texte, infini, négatif) ignorées ; quantité plafonnée à un million.
    const n = Math.floor(Number(materials[key]));
    if (Number.isFinite(n) && n > 0) gold += Math.min(n, 1e6) * price;
  }
  return gold;
}
// Prix de vente au marchand : selon le niveau de l'objet et le multiplicateur de qualité (5 or au minimum).
/**
 * @param {import('../types.js').Item | null | undefined} item
 * @param {unknown} level
 * @returns {number}
 */
export function sellValue(item, level) {
  return Math.max(5, Math.round((6 + 7 * Math.max(1, Number(level) || 1)) * rarityInfo(item).mult));
}
// Prix de l'équipement vert du marchand, selon le niveau du héros.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function shopPriceAt(level) {
  return 60 + Math.round(Math.max(1, Number(level) || 1) * 9);
}
