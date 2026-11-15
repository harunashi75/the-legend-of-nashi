// Règles des objets : qualité, niveau, tirage, type d'arme, icônes, artéfacts.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
// Chaque fonction reçoit ses données en paramètres ; aucune ne lit l'état d'une partie.
import {
  ACTIVE_GEAR_SLOTS,
  GEAR_RARITIES,
  LEGACY_RARITY,
  JEWEL_ICON,
  JEWEL_SLOTS,
  RARITY_WEIGHTS,
  WEAPON_TYPES
} from '../data/equipment.js';

// Qualité d'un objet ; une qualité absente ou inconnue vaut Commun.
export function rarityInfo(item) {
  const name = LEGACY_RARITY[item?.rarity] || item?.rarity;
  return GEAR_RARITIES.find(r => r.name === name) || GEAR_RARITIES[0];
}
// Tirage libre d'une qualité ; rng renvoie un nombre dans [0, 1[.
export function rollRarity(rng) {
  let r = rng() * 100;
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    r -= RARITY_WEIGHTS[i];
    if (r < 0) return GEAR_RARITIES[i];
  }
  return GEAR_RARITIES[2];
}
// Une arme sans famille connue devient une épée.
export function ensureWeaponType(item) {
  if (item && item.slot === 'weapon' && !Object.hasOwn(WEAPON_TYPES, item.weaponType)) item.weaponType = 'sword';
}
// Niveau d'un objet (1 à 60) ; 0 pour un emplacement vide.
export function itemLevel(item) {
  return item ? Math.max(1, Math.min(60, Math.round(Number(item.level) || 1))) : 0;
}
// Nom affiché d'un objet (pas d'amélioration : c'est le nom du drop).
export function gearDisplayName(item) {
  return item?.name || '';
}
export function weaponIcon(item) {
  if (item?.slot === 'weapon') return WEAPON_TYPES[item.weaponType]?.icon || '⚔️';
  return JEWEL_SLOTS.includes(item?.slot) ? JEWEL_ICON[item.slot] : '';
}
// Variante d'artéfact (0 à 2) stable pour un même identifiant.
export function stableArtifact(item) {
  let h = 0;
  for (const c of String(item.id || item.name || 'artefact')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return (h >>> 0) % 3;
}
export function ensureArtifact(item) {
  if (item?.slot !== 'artifact') return;
  if (!Number.isInteger(item.artifactVariant) || item.artifactVariant < 0 || item.artifactVariant > 2)
    item.artifactVariant = stableArtifact(item);
}
