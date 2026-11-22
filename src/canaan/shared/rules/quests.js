// @ts-check
// Règles des quêtes : récompenses d'XP, disponibilité, et état d'un héros vérifié (sauvegardes, réseau).
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import {
  QUESTS,
  SANCTUARIES,
  HEART_FLAGS,
  HEART_BONUS,
  SHELLS,
  SHELL_REWARDS,
  TRADE_CHAIN
} from '../data/quests.js';
import { clampLevel, xpToNext } from './stats.js';

/**
 * Une étape : sa mécanique (k), son texte et les réglages propres à cette mécanique (voir shared/data/quests.js).
 * @typedef {{ k: string, text: string, n?: number, world?: readonly string[], [key: string]: any }} QuestStep
 * @typedef {{ gold?: number, item?: string, flags?: readonly string[], text: string, [key: string]: any }} QuestReward
 * @typedef {{ id: number, chapter: number, main: boolean, scaled?: boolean, title: string, npc: string, site: string,
 *   level: number, requires?: number | readonly number[], steps: readonly QuestStep[], reward: QuestReward,
 *   [key: string]: any }} Quest
 */
/**
 * État des quêtes d'un héros (sauvegardé dans heros.*.quetes).
 * @typedef {object} QuestState
 * @property {Record<number, { step: number, got: string[], n: number }>} active quêtes en cours : étape, objets trouvés
 *   et compte de l'étape (créatures vaincues, objets lâchés…)
 * @property {Record<number, number>} done quêtes terminées
 * @property {Record<string, boolean>} flags drapeaux d'histoire
 * @property {Record<number, number>} choices choix narratifs
 * @property {number | null} track quête suivie
 * @property {number} troc échanges du grand troc déjà faits (0 à TRADE_CHAIN.length)
 * @property {string[]} shells coquillages chantants trouvés
 * @property {number} paid paliers de coquillages déjà récompensés
 * @property {number} v version des étapes (QUEST_VERSION)
 */

// Version des étapes : une quête en cours d'une version plus ancienne reprend à sa première étape (les quêtes finies et
// leurs récompenses ne changent pas).
export const QUEST_VERSION = 2;
/** @type {readonly Quest[]} */
const ALL = /** @type {any} */ (QUESTS);
/** @type {(id: number) => Quest | null} */
export const questById = id => ALL.find(q => q.id === id) || null;
// Niveau d'une quête pour un héros : le sien pour une quête à tout niveau (Interlude), sinon le niveau conseillé.
/** @type {(quest: Quest | null | undefined, heroLevel?: number) => number} */
export const questLevel = (quest, heroLevel = 1) => clampLevel(quest?.scaled ? heroLevel : quest?.level);
// XP d'une quête : une part de son niveau (80 % pour une principale, 45 % pour une secondaire).
// Un bon coup de pouce, jamais nécessaire pour monter jusqu'au niveau 60.
/**
 * @param {Quest | null | undefined} quest
 * @param {number} [heroLevel] niveau du héros (quêtes à tout niveau)
 * @returns {number}
 */
export function questXp(quest, heroLevel = 1) {
  const level = Math.min(59, questLevel(quest, heroLevel));
  return Math.round(xpToNext(level) * (quest?.main ? 0.8 : 0.45));
}
// Or d'une quête : celui de sa récompense ; à tout niveau, il suit le héros comme celui des quêtes de la surface.
/** @type {(quest: Quest | null | undefined, heroLevel?: number) => number} */
export const questGold = (quest, heroLevel = 1) =>
  quest?.scaled
    ? Math.round((quest.main ? 50 : 35) + (quest.main ? 9 : 7) * questLevel(quest, heroLevel))
    : quest?.reward.gold || 0;
// Drapeaux d'histoire connus (récompenses et lieux débloqués).
const FLAGS = new Set([
  ...ALL.flatMap(q => q.reward.flags || []),
  ...SANCTUARIES.map(s => 'visit_' + s.id),
  ...HEART_FLAGS
]);
const SHELL_IDS = new Set(SHELLS.map(s => s.id));
// État de quêtes d'un héros, vérifié : quêtes actives (étape et données), terminées, drapeaux,
// choix narratifs, quête suivie.
/**
 * @param {any} raw état lu d'une sauvegarde ou du réseau (non fiable : chaque champ est vérifié)
 * @returns {QuestState}
 */
export function sanitizeQuests(raw) {
  const r = raw && typeof raw === 'object' ? raw : {},
    /** @type {QuestState} */ out = {
      active: {},
      done: {},
      flags: {},
      choices: {},
      track: null,
      troc: 0,
      shells: [],
      paid: 0,
      v: QUEST_VERSION
    };
  if (r.done && typeof r.done === 'object')
    for (const [k, v] of Object.entries(r.done))
      if (questById(Number(k))) out.done[Number(k)] = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 1;
  if (r.active && typeof r.active === 'object')
    for (const [k, v] of Object.entries(r.active)) {
      const q = questById(Number(k));
      if (!q || out.done[q.id] || !v || typeof v !== 'object') continue;
      const step =
          r.v === QUEST_VERSION ? Math.max(0, Math.min(q.steps.length, Math.floor(Number(v.step) || 0))) : 0,
        n = r.v === QUEST_VERSION ? Math.max(0, Math.min(99, Math.floor(Number(v.n) || 0))) : 0,
        got =
          r.v === QUEST_VERSION && Array.isArray(v.got)
            ? [
                ...new Set(
                  v.got.filter(/** @param {unknown} x */ x => typeof x === 'string' && x.length <= 24)
                )
              ].slice(0, 12)
            : [];
      out.active[q.id] = { step, got, n };
    }
  if (r.flags && typeof r.flags === 'object')
    for (const k of Object.keys(r.flags)) if (FLAGS.has(k) && r.flags[k]) out.flags[k] = true;
  if (r.choices && typeof r.choices === 'object')
    for (const [k, v] of Object.entries(r.choices))
      if (questById(Number(k)) && Number.isInteger(v) && v >= 0 && v < 8) out.choices[Number(k)] = v;
  if (questById(Number(r.track)) && (out.active[Number(r.track)] || false)) out.track = Number(r.track);
  if (Number.isInteger(r.troc)) out.troc = Math.max(0, Math.min(TRADE_CHAIN.length, r.troc));
  if (Array.isArray(r.shells))
    out.shells = [
      ...new Set(r.shells.filter(/** @param {unknown} x */ x => typeof x === 'string' && SHELL_IDS.has(x)))
    ];
  if (Number.isInteger(r.paid)) out.paid = Math.max(0, Math.min(SHELL_REWARDS.length, r.paid));
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
  return !missingQuest(state, quest);
}
// Quête à finir avant celle-ci (la première qui manque), ou null.
/** @type {(state: QuestState, quest: Quest | null | undefined) => Quest | null} */
export function missingQuest(state, quest) {
  const need = quest?.requires === undefined ? [] : [quest.requires].flat();
  const id = need.find(id => !state.done[/** @type {number} */ (id)]);
  return id === undefined ? null : questById(/** @type {number} */ (id));
}
// Toutes les étapes faites : il reste à revenir voir le PNJ.
/** @type {(state: QuestState, quest: Quest) => boolean} */
export const questReady = (state, quest) =>
  !!state.active[quest.id] && state.active[quest.id].step >= quest.steps.length;
// Nombre d'étoiles du Cœur retrouvées (drapeaux star1…star6).
/** @type {(state: QuestState) => number} */
export const starCount = state => [1, 2, 3, 4, 5, 6].filter(n => state.flags['star' + n]).length;
// Cœurs d'Aurore réunis (gardiens vaincus, paliers de coquillages) et bonus de PV max qu'ils donnent (fraction).
/** @type {(state: QuestState) => number} */
export const heartCount = state => HEART_FLAGS.filter(f => state.flags[f]).length;
/** @type {(state: QuestState) => number} */
export const heartBonus = state => heartCount(state) * HEART_BONUS;
// Paliers de coquillages atteints mais pas encore récompensés.
/** @type {(state: QuestState) => typeof SHELL_REWARDS[number][]} */
export const shellRewardsDue = state =>
  SHELL_REWARDS.slice(state.paid).filter(r => state.shells.length >= r.n);
// Objet du grand troc tenu par le héros (le dernier reçu), ou null.
/** @type {(state: QuestState) => typeof TRADE_CHAIN[number]['gives'] | null} */
export const tradeItem = state => (state.troc > 0 ? TRADE_CHAIN[state.troc - 1].gives : null);
