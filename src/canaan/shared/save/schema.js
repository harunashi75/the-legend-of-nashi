// Format des sauvegardes (schéma 10) : validation, aventure neuve, résumé pour le menu, importation du schéma 9.
// Module partagé pur (shared/save) : aucun stockage ni fichier ; le jeu et l'application de bureau l'utilisent.
import { ACTIVE_GEAR_SLOTS } from '../data/equipment.js';
import { sanitizeLook } from '../data/looks.js';
import { levelFromIlvl } from '../rules/stats.js';
import { CLASS_IDS } from '../data/classes.js';

export const SAVE_SCHEMA = 10;
export const SLOT_COUNT = 3;
// Champs d'un héros, repris du schéma 9 ; la conversion 9 → 10 les déplace sous heros.hote.
export const HERO_FIELDS = Object.freeze([
  'player',
  'kills',
  'inventory',
  'equipment',
  'materials',
  'bagLevel',
  'ways',
  'rubis',
  'arena'
]);
// Emplacements sauvegardés : les emplacements actifs et l'arme de réserve.
export const SAVED_GEAR_SLOTS = Object.freeze([...ACTIVE_GEAR_SLOTS, 'weapon2']);

export function isValidSlot(slot) {
  return Number.isInteger(slot) && slot >= 1 && slot <= SLOT_COUNT;
}
// Une sauvegarde est valide si elle est au schéma courant et contient le héros de l'hôte.
export function isValidSave(data) {
  return !!data && data.schema === SAVE_SCHEMA && !!data.heros?.hote && typeof data.heros.hote === 'object';
}
// Nom d'aventure ou pseudo : sans caractère de contrôle ni chevron, 32 caractères au plus.
export function cleanAdventureName(name, slot) {
  const text = String(name ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, 32);
  return text || 'Aventure ' + slot;
}
// Classe choisie à la création (shared/data/classes.js), ou aucune (choisie en jeu).
const knownClass = id => (CLASS_IDS.includes(id) ? id : null);
// Héros neuf : équipement de départ dans le sac, sa classe sans talent, aucun Rubis.
export function freshHero({ spawn, baseMana, look, classe = null }) {
  return {
    // Apparence choisie à la création (voir shared/data/looks.js).
    look: sanitizeLook(look),
    player: { x: spawn.x, y: spawn.y, hp: 100, mp: baseMana, gold: 0 },
    // Niveau du personnage (1 à 60) et expérience.
    level: 1,
    exp: 0,
    kills: 0,
    inventory: [
      { id: 'sword1', name: 'Épée de recrue', slot: 'weapon', level: 1, rarity: 'Commun' },
      { id: 'armor1', name: 'Tunique du voyageur', slot: 'armor', level: 1, rarity: 'Commun' }
    ],
    equipment: Object.fromEntries(SAVED_GEAR_SLOTS.map(slot => [slot, null])),
    bagLevel: 0,
    // Classe et talents équipés (5 au plus, selon le niveau).
    classe: { id: knownClass(classe), talents: [] },
    rubis: { owned: {}, equipped: [null, null, null, null, null, null] },
    arena: { best: 0, attempts: 0, completed: false, lastBoss: '' },
    // Métiers : pêche et cuisine au niveau 1, sans poisson ni repas.
    prof: {
      fishing: { level: 1, exp: 0 },
      cooking: { level: 1, exp: 0 },
      hunting: { level: 1, exp: 0 },
      fish: {},
      meat: {},
      meals: {},
      codex: {}
    }
  };
}
// Aventure neuve : un monde vierge, le héros de l'hôte, aucun invité.
export function freshSave({ nom, slot, version, now, spawn, baseMana, look, classe = null }) {
  return {
    schema: SAVE_SCHEMA,
    version,
    nom: cleanAdventureName(nom, slot),
    created: now,
    updated: now,
    resume: { level: 1, gold: 0, classe: knownClass(classe) },
    monde: { openedChests: [], worldBossTimers: {} },
    heros: { hote: freshHero({ spawn, baseMana, look, classe }), invites: {} }
  };
}
// Résumé d'un slot pour le menu : vide, illisible, ou aventure (nom, niveau, classe, or, pseudos des invités).
export function summarizeSave(raw, slot) {
  if (raw === null || raw === undefined) return { slot, state: 'vide' };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { slot, state: 'illisible' };
  }
  if (!isValidSave(data)) return { slot, state: 'illisible' };
  const guests =
    data.heros.invites && typeof data.heros.invites === 'object' ? Object.values(data.heros.invites) : [];
  return {
    slot,
    state: 'aventure',
    nom: cleanAdventureName(data.nom, slot),
    updated: Number(data.updated) || 0,
    // Ancienne aventure : l'iLvl moyen du résumé devient un niveau.
    level: Number.isFinite(Number(data.resume?.level))
      ? Math.max(1, Math.round(Number(data.resume.level)))
      : levelFromIlvl(data.resume?.ilvl),
    gold: Math.max(0, Math.floor(Number(data.resume?.gold) || 0)),
    classe: knownClass(data.resume?.classe),
    invites: guests.map(guest => cleanAdventureName(guest?.pseudo, '?'))
  };
}
// Importation unique de l'ancienne partie du navigateur : schéma 9 → schéma 10, héros de l'hôte, aucun invité.
export function convertLegacySave(data, { version, now }) {
  const hote = {};
  for (const key of HERO_FIELDS) if (data[key] !== undefined) hote[key] = data[key];
  // Le héros importé prendra au chargement le niveau de sa meilleure pièce ; le résumé l'annonce déjà.
  const best = Math.max(0, ...ACTIVE_GEAR_SLOTS.map(slot => Number(data.equipment?.[slot]?.ilvl) || 0));
  return {
    schema: SAVE_SCHEMA,
    version,
    nom: 'Aventure importée',
    created: now,
    updated: now,
    resume: {
      level: levelFromIlvl(best || 1),
      gold: Math.max(0, Math.floor(Number(data.player?.gold) || 0))
    },
    monde: { openedChests: data.openedChests || [], worldBossTimers: data.worldBossTimers || {} },
    heros: { hote, invites: {} }
  };
}
