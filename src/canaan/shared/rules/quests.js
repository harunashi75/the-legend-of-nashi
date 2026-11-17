// @ts-check
// Règles des quêtes : récompenses d'XP, disponibilité, et état d'un héros vérifié (sauvegardes, réseau).
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { QUESTS, SANCTUARIES } from '../data/quests.js';
import { clampLevel, xpToNext } from './stats.js';

/** @typedef {typeof QUESTS[number]} Quest */
/**
 * État des quêtes d'un héros (sauvegardé dans heros.*.quetes).
 * @typedef {object} QuestState
 * @property {Record<number, { step: number, got: string[] }>} active quêtes en cours : étape et objets trouvés
 * @property {Record<number, number>} done quêtes terminées
 * @property {Record<string, boolean>} flags drapeaux d'histoire
 * @property {Record<number, number>} choices choix narratifs
 * @property {number | null} track quête suivie
 */

/** @type {(id: number) => Quest | null} */
export const questById = id => QUESTS.find(q => q.id === id) || null;
// XP d'une quête : une part du niveau recommandé (60 % pour une principale, 35 % pour une secondaire).
// Un bon coup de pouce, jamais nécessaire pour monter jusqu'au niveau 60.
/**
 * @param {Quest | null | undefined} quest
 * @returns {number}
 */
export function questXp(quest) {
  const level = Math.min(59, clampLevel(quest?.level));
  return Math.round(xpToNext(level) * (quest?.main ? 0.6 : 0.35));
}
// Drapeaux d'histoire connus (récompenses et lieux débloqués).
const FLAGS = new Set([
  ...QUESTS.flatMap(q => q.reward.flags || []),
  ...SANCTUARIES.map(s => 'visit_' + s.id)
]);
// État de quêtes d'un héros, vérifié : quêtes actives (étape et données), terminées, drapeaux,
// choix narratifs, quête suivie.
/**
 * @param {any} raw état lu d'une sauvegarde ou du réseau (non fiable : chaque champ est vérifié)
 * @returns {QuestState}
 */
export function sanitizeQuests(raw) {
  const r = raw && typeof raw === 'object' ? raw : {},
    /** @type {QuestState} */ out = { active: {}, done: {}, flags: {}, choices: {}, track: null };
  if (r.done && typeof r.done === 'object')
    for (const [k, v] of Object.entries(r.done))
      if (questById(Number(k))) out.done[Number(k)] = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 1;
  if (r.active && typeof r.active === 'object')
    for (const [k, v] of Object.entries(r.active)) {
      const q = questById(Number(k));
      if (!q || out.done[q.id] || !v || typeof v !== 'object') continue;
      const step = Math.max(0, Math.min(q.steps.length, Math.floor(Number(v.step) || 0))),
        got = Array.isArray(v.got)
          ? [
              ...new Set(v.got.filter(/** @param {unknown} x */ x => typeof x === 'string' && x.length <= 24))
            ].slice(0, 12)
          : [];
      out.active[q.id] = { step, got };
    }
  if (r.flags && typeof r.flags === 'object')
    for (const k of Object.keys(r.flags)) if (FLAGS.has(k) && r.flags[k]) out.flags[k] = true;
  if (r.choices && typeof r.choices === 'object')
    for (const [k, v] of Object.entries(r.choices))
      if (questById(Number(k)) && Number.isInteger(v) && v >= 0 && v < 8) out.choices[Number(k)] = v;
  if (questById(Number(r.track)) && (out.active[Number(r.track)] || false)) out.track = Number(r.track);
  return out;
}
// Une quête peut commencer : pas déjà active ni terminée, et (principale) la précédente de l'histoire est faite.
/**
 * @param {QuestState} state
 * @param {Quest | null | undefined} quest
 * @returns {boolean}
 */
export function canStart(state, quest) {
  if (!quest || state.active[quest.id] || state.done[quest.id]) return false;
  return !quest.requires || !!state.done[quest.requires];
}
// Toutes les étapes faites : il reste à revenir voir le PNJ.
/** @type {(state: QuestState, quest: Quest) => boolean} */
export const questReady = (state, quest) =>
  !!state.active[quest.id] && state.active[quest.id].step >= quest.steps.length;
// Nombre d'étoiles du Cœur retrouvées (drapeaux star1…star6).
/** @type {(state: QuestState) => number} */
export const starCount = state => [1, 2, 3, 4, 5, 6].filter(n => state.flags['star' + n]).length;
