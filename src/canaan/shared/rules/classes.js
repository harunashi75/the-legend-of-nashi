// Règles des classes : emplacements de talents selon le niveau, état de classe valide (sauvegardes, réseau),
// compétences offensives et élément d'une compétence.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { CLASSES, CLASS_IDS, TALENT_SLOT_LEVELS, TALENTS_PER_CLASS, UTILITY_SKILLS } from '../data/classes.js';

// Emplacements de talents ouverts : un aux niveaux 1, 10, 20, 30 et 40.
export function talentSlotsAt(level) {
  const lv = Math.max(0, Number(level) || 0);
  return TALENT_SLOT_LEVELS.filter(step => lv >= step).length;
}
export function classById(id) {
  return CLASSES.find(c => c.id === id) || null;
}
// État de classe valide : classe connue (ou aucune), talents de 0 à 9, différents, pas plus que d'emplacements.
export function sanitizeClasse(raw, level) {
  const id = raw && CLASS_IDS.includes(raw.id) ? raw.id : null,
    talents = [];
  if (id && Array.isArray(raw.talents))
    for (const t of raw.talents)
      if (Number.isInteger(t) && t >= 0 && t < TALENTS_PER_CLASS && !talents.includes(t) && talents.length < talentSlotsAt(level)) talents.push(t);
  return { id, talents };
}
// Une compétence d'arme est offensive si elle inflige des dégâts (les postures et ruées ne comptent pas).
export function isOffensiveSkill(type, index) {
  return Number.isInteger(index) && index >= 0 && index <= 3 && !UTILITY_SKILLS.includes(type + ':' + index);
}
// Élément d'une compétence d'arme pour une classe (null sans classe).
export function skillElement(classId, index) {
  const c = classById(classId);
  return c ? c.elements[Math.max(0, Math.min(3, index | 0))] : null;
}
// Effet sur la durée qui ne s'accumule pas : une nouvelle application garde la plus forte valeur par seconde et
// repousse la fin ; jamais deux effets du même héros et du même type sur une cible.
export function refreshDot(current, dps, until) {
  if (!current || !(current.until > 0)) return { dps, until };
  return { dps: Math.max(current.dps, dps), until: Math.max(current.until, until) };
}
