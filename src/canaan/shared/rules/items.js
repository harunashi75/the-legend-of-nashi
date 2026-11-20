// @ts-check
// Règles des objets : qualité, niveau, tirage, type d'arme, icônes, artéfacts.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
// Chaque fonction reçoit ses données en paramètres ; aucune ne lit l'état d'une partie.
import {
  ACTIVE_GEAR_SLOTS,
  BOUND_RARITY,
  GEAR_RARITIES,
  LEGACY_RARITY,
  JEWEL_ICON,
  JEWEL_SLOTS,
  RARITY_WEIGHTS,
  WEAPON_TYPES
} from '../data/equipment.js';
import { GEAR_NAMES, RELIC_NAMES, WEAPON_NAMES } from '../data/item-names.js';
import { MAX_LEVEL } from '../data/stats.js';
import { clampItemLevel, clampLevel, secondaryRange } from './stats.js';
/** @typedef {import('../types.js').Item} Item */

// Qualité d'un objet ; une qualité absente ou inconnue vaut Commun.
/**
 * @param {Item | null | undefined} item
 */
export function rarityInfo(item) {
  const name = LEGACY_RARITY[item?.rarity ?? ''] || item?.rarity;
  if (name === BOUND_RARITY.name) return BOUND_RARITY;
  return GEAR_RARITIES.find(r => r.name === name) || GEAR_RARITIES[0];
}
// Tirage libre d'une qualité ; rng renvoie un nombre dans [0, 1[.
/**
 * @param {() => number} rng
 */
export function rollRarity(rng) {
  let r = rng() * 100;
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    r -= RARITY_WEIGHTS[i];
    if (r < 0) return GEAR_RARITIES[i];
  }
  return GEAR_RARITIES[2];
}
// Une arme sans famille connue devient une épée.
/**
 * @param {Item | null | undefined} item modifié sur place
 */
export function ensureWeaponType(item) {
  if (item && item.slot === 'weapon' && !Object.hasOwn(WEAPON_TYPES, item.weaponType ?? ''))
    item.weaponType = 'sword';
}
// Niveau d'un objet (1 à 63) ; 0 pour un emplacement vide.
/**
 * @param {Item | null | undefined} item
 * @returns {number}
 */
export function itemLevel(item) {
  return item ? clampItemLevel(item.level) : 0;
}
// Niveau requis pour équiper un objet : son niveau, sans dépasser le niveau maximal du personnage (une pièce de
// niveau 63 se porte dès le niveau 60) ; 0 pour un emplacement vide.
/**
 * @param {Item | null | undefined} item
 * @returns {number}
 */
export function requiredLevel(item) {
  return item ? Math.min(itemLevel(item), MAX_LEVEL) : 0;
}
// Nom affiché d'un objet (pas d'amélioration : c'est le nom du drop).
/**
 * @param {Item | null | undefined} item
 * @returns {string}
 */
export function gearDisplayName(item) {
  return item?.name || '';
}
/**
 * @param {Item | null | undefined} item
 * @returns {string}
 */
export function weaponIcon(item) {
  if (item?.slot === 'weapon') return WEAPON_TYPES[item.weaponType ?? '']?.icon || '⚔️';
  return item?.slot && JEWEL_SLOTS.includes(item.slot) ? JEWEL_ICON[item.slot] : '';
}
// Variante d'artéfact (0 à 2) stable pour un même identifiant.
/**
 * @param {Item} item
 * @returns {number} variante 0 à 2
 */
export function stableArtifact(item) {
  let h = 0;
  for (const c of String(item.id || item.name || 'artefact')) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return (h >>> 0) % 3;
}
/**
 * @param {(Item & { artifactVariant?: number }) | null | undefined} item modifié sur place
 */
export function ensureArtifact(item) {
  if (item?.slot !== 'artifact') return;
  const v = item.artifactVariant;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 2)
    item.artifactVariant = stableArtifact(item);
}
// Nom officiel d'un objet d'après sa qualité et sa famille (armes) ou son emplacement (autres pièces, variante
// d'artéfact). Seul le nom change : identité, niveau et statistiques restent ceux du drop.
/**
 * @param {Item & { artifactVariant?: number }} item modifié sur place
 * @returns {Item} le même objet
 */
export function applyItemName(item) {
  if (!item?.slot) return item;
  const rarity = rarityInfo(item).name;
  if (item.slot === 'weapon' && rarity === BOUND_RARITY.name) {
    item.name = relicName(item.weaponType ?? '', item.level);
    return item;
  }
  if (item.slot === 'weapon') {
    ensureWeaponType(item);
    item.name = WEAPON_NAMES[rarity][item.weaponType ?? 'sword'];
  } else {
    const entry = GEAR_NAMES[rarity];
    if (item.slot === 'artifact') {
      ensureArtifact(item);
      item.name = entry.artifact[item.artifactVariant ?? 0];
    } else if (entry[item.slot]) item.name = entry[item.slot];
  }
  return item;
}

// ---------------------------------------------------------------- Armes liées (qualité Relique)
// Nom d'une arme liée selon son niveau (palier de RELIC_NAMES).
/**
 * @param {string} type famille d'arme
 * @param {unknown} level
 * @returns {string}
 */
export function relicName(type, level) {
  const tiers = RELIC_NAMES[type];
  if (!tiers) return 'Relique';
  const lv = clampLevel(level);
  let name = tiers[0][1];
  for (const [from, label] of tiers) if (lv >= from) name = label;
  return name;
}
// Un objet lié à une classe (le Grimoire) : il ne quitte jamais l'emplacement de l'arme.
/**
 * @param {(Item & { bound?: string }) | null | undefined} item
 * @returns {boolean}
 */
export function isBoundItem(item) {
  return !!item && typeof item.bound === 'string' && item.bound.length > 0;
}
// Arme liée d'une classe au niveau du héros : identité fixe, Relique, et deux secondaires fixes (Maîtrise et
// Célérité, aux deux tiers de leur plage) qui grandissent avec elle.
/**
 * @param {string} classId classe propriétaire
 * @param {string} type famille d'arme
 * @param {unknown} level niveau du héros
 * @returns {Item & { bound: string }}
 */
export function makeBoundWeapon(classId, type, level) {
  const lv = clampLevel(level),
    [lo, hi] = secondaryRange(lv, BOUND_RARITY.name),
    value = Math.round(lo + (hi - lo) * 0.66);
  return {
    id: 'lie-' + classId,
    slot: 'weapon',
    weaponType: type,
    rarity: BOUND_RARITY.name,
    level: lv,
    bound: classId,
    name: relicName(type, lv),
    sec: { mastery: value, haste: value }
  };
}
