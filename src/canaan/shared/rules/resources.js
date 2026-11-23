// @ts-check
// Règles des ressources de classe (shared/data/classes.js, RESOURCES) : maximum, coût des compétences,
// régénération et gains en combat. Les compétences sont décrites en points de mana (shared/data/equipment.js) :
// chaque ressource convertit ce prix à sa façon. La ressource vit dans player.mp / player.mmp (sauvegardes, réseau).
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { CLASSES, RESOURCES } from '../data/classes.js';
import { MAX_LEVEL } from '../data/stats.js';
import { clampLevel } from './stats.js';

/** @typedef {keyof typeof RESOURCES} ResourceKind */

export const RESOURCE_RULES = Object.freeze({
  // Mana : 250 au niveau 1, +5 par niveau (545 au niveau 60) ; les coûts montent de 1 % par niveau, un peu moins
  // vite que le maximum. Régénération : 2 % du maximum par seconde, 1 % en combat.
  mana: Object.freeze({ base: 250, perLevel: 5, costPerLevel: 0.01, regen: 0.02, regenCombat: 0.01 }),
  // Énergie : 100, rechargée de 12 par seconde, en combat comme ailleurs ; une compétence coûte le double de son
  // prix en mana.
  energy: Object.freeze({ max: 100, costFactor: 2, regen: 12 }),
  // Ferveur (Paladin) : monte quand il frappe (attaque de base) et surtout quand il est frappé, un peu à chaque
  // seconde de combat ; retombe hors combat.
  fervor: Object.freeze({
    max: 100,
    costFactor: 2,
    combat: 2,
    decay: 8,
    basic: 6,
    hurt: 3,
    hurtPerHp: 150,
    hurtMax: 20
  }),
  // Rythme (Barde) : chaque attaque de base est une note qui le fait monter ; retombe hors combat.
  rhythm: Object.freeze({ max: 100, costFactor: 2, combat: 3, decay: 8, basic: 8 }),
  // PV (Berserker) : chaque point de mana coûte 0,6 % des PV max au niveau 1, jusqu'à 1 % au niveau 60.
  blood: Object.freeze({ perMana: 0.006, perManaMax: 0.01 })
});
// Délai minimal entre deux gains d'attaque de base (une attaque de zone ne compte qu'une fois).
export const RESOURCE_BASIC_GAP = 0.3;

/**
 * @param {unknown} classId
 * @returns {ResourceKind}
 */
export function classResource(classId) {
  const kind = CLASSES.find(c => c.id === classId)?.resource;
  return kind && kind in RESOURCES ? /** @type {ResourceKind} */ (kind) : 'mana';
}
// Ressource qui part de zéro et se gagne en combat (Ferveur, Rythme).
/** @param {ResourceKind} kind */
export const resourceBuildsUp = kind => kind === 'fervor' || kind === 'rhythm';

// Maximum de la ressource ; 0 pour le Berserker, qui n'a pas de barre.
/**
 * @param {ResourceKind} kind
 * @param {unknown} level
 * @returns {number}
 */
export function resourceMax(kind, level) {
  if (kind === 'blood') return 0;
  if (kind === 'mana') {
    const r = RESOURCE_RULES.mana;
    return r.base + r.perLevel * (clampLevel(level) - 1);
  }
  return RESOURCE_RULES[kind].max;
}
// Coût d'une compétence dans sa ressource, d'après son prix en mana. Le Berserker garde le prix en mana : bloodCost
// le convertit en PV.
/**
 * @param {ResourceKind} kind
 * @param {number} mana
 * @param {unknown} level
 * @returns {number}
 */
export function resourceCost(kind, mana, level) {
  const m = Math.max(0, Number(mana) || 0);
  if (!m || kind === 'blood') return m;
  if (kind === 'mana')
    return Math.round(m * (1 + RESOURCE_RULES.mana.costPerLevel * (clampLevel(level) - 1)));
  return Math.round(m * RESOURCE_RULES[kind].costFactor);
}
// Variation par seconde (négative quand la ressource retombe hors combat).
/**
 * @param {ResourceKind} kind
 * @param {number} max
 * @param {boolean} fighting
 * @returns {number}
 */
export function resourceRegen(kind, max, fighting) {
  switch (kind) {
    case 'mana':
      return max * (fighting ? RESOURCE_RULES.mana.regenCombat : RESOURCE_RULES.mana.regen);
    case 'energy':
      return RESOURCE_RULES.energy.regen;
    case 'fervor':
    case 'rhythm':
      return fighting ? RESOURCE_RULES[kind].combat : -RESOURCE_RULES[kind].decay;
    default:
      return 0;
  }
}
// Gain d'un événement de combat : attaque de base qui touche (basic) ou coup reçu (hurt, avec ses dégâts).
/**
 * @param {ResourceKind} kind
 * @param {'basic' | 'hurt'} event
 * @param {{ damage?: number, maxHp?: number }} [info]
 * @returns {number}
 */
export function resourceGain(kind, event, info = {}) {
  if (kind === 'fervor') {
    const r = RESOURCE_RULES.fervor;
    if (event === 'basic') return r.basic;
    const share = info.maxHp ? Math.max(0, Number(info.damage) || 0) / info.maxHp : 0;
    return Math.min(r.hurtMax, r.hurt + r.hurtPerHp * share);
  }
  if (kind === 'rhythm' && event === 'basic') return RESOURCE_RULES.rhythm.basic;
  return 0;
}
// Part des PV max que coûte un point de mana au Berserker : elle monte avec le niveau.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function bloodPerMana(level) {
  const r = RESOURCE_RULES.blood;
  return r.perMana + ((r.perManaMax - r.perMana) * (clampLevel(level) - 1)) / (MAX_LEVEL - 1);
}
// Prix en PV d'une compétence du Berserker (au moins 1 PV pour une compétence payante).
/**
 * @param {number} maxHp
 * @param {number} mana
 * @param {unknown} level
 * @returns {number}
 */
export function resourceBloodCost(maxHp, mana, level) {
  return mana > 0 ? Math.max(1, Math.ceil(maxHp * mana * bloodPerMana(level))) : 0;
}
