// @ts-check
// Règles des classes : emplacements de talents selon le niveau, état de classe valide (sauvegardes, réseau),
// compétences offensives et élément d'une compétence.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import {
  CLASSES,
  CLASS_IDS,
  TALENT_SLOT_LEVELS,
  TALENTS_PER_CLASS,
  UTILITY_SKILLS
} from '../data/classes.js';

// Emplacements de talents ouverts : un aux niveaux 1, 10, 20, 30 et 40.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function talentSlotsAt(level) {
  const lv = Math.max(0, Number(level) || 0);
  return TALENT_SLOT_LEVELS.filter(step => lv >= step).length;
}
/**
 * @param {unknown} id
 * @returns {typeof CLASSES[number] | null}
 */
export function classById(id) {
  return CLASSES.find(c => c.id === id) || null;
}
// État de classe valide : classe connue (ou aucune), talents de 0 à 9, différents, pas plus que d'emplacements.
/**
 * @param {any} raw état lu d'une sauvegarde ou du réseau (non fiable)
 * @param {number} level niveau du héros
 * @returns {{ id: string | null, talents: number[] }}
 */
export function sanitizeClasse(raw, level) {
  const id = raw && CLASS_IDS.includes(raw.id) ? raw.id : null,
    /** @type {number[]} */ talents = [];
  if (id && Array.isArray(raw.talents))
    for (const t of raw.talents)
      if (
        Number.isInteger(t) &&
        t >= 0 &&
        t < TALENTS_PER_CLASS &&
        !talents.includes(t) &&
        talents.length < talentSlotsAt(level)
      )
        talents.push(t);
  return { id, talents };
}
// Arme liée d'une classe (famille d'arme), ou null : la classe la reçoit en la choisissant et n'en manie pas d'autre.
/**
 * @param {unknown} classId
 * @returns {string | null}
 */
export function boundWeaponOf(classId) {
  const c = classById(classId);
  return c && 'weapon' in c && typeof c.weapon === 'string' ? c.weapon : null;
}
// Une compétence d'arme est offensive si elle inflige des dégâts (les postures et ruées ne comptent pas).
/**
 * @param {string} type famille d'arme
 * @param {unknown} index compétence 0 à 3
 * @returns {boolean}
 */
export function isOffensiveSkill(type, index) {
  return (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index <= 3 &&
    !UTILITY_SKILLS.includes(type + ':' + index)
  );
}
// Élément d'une compétence d'arme pour une classe (null sans classe).
/**
 * @param {unknown} classId
 * @param {number} index
 * @returns {string | null}
 */
export function skillElement(classId, index) {
  const c = classById(classId);
  return c ? c.elements[Math.max(0, Math.min(3, index | 0))] : null;
}
// Effet sur la durée qui ne s'accumule pas : une nouvelle application garde la plus forte valeur par seconde et
// repousse la fin ; jamais deux effets du même héros et du même type sur une cible.
/**
 * @param {{ dps: number, until: number } | null | undefined} current effet déjà posé
 * @param {number} dps
 * @param {number} until fin (en ticks)
 * @returns {{ dps: number, until: number }}
 */
export function refreshDot(current, dps, until) {
  if (!current || !(current.until > 0)) return { dps, until };
  return { dps: Math.max(current.dps, dps), until: Math.max(current.until, until) };
}
