// Apparence des héros : sexe, race, peau, coiffure, couleurs des cheveux et des yeux, tenue, et l'apparence portée
// (transmogrification, shared/data/skins.js ; vide : la tenue de création).
// Purement visuel (aucun effet en combat). Module partagé pur : le jeu, le réseau et les tests l'utilisent.
// Une apparence est un petit objet de chaînes ; toute valeur inconnue est remplacée par celle par défaut.
import { SKIN_IDS } from './skins.js';

export const LOOK_SEXES = Object.freeze([
  { id: 'f', name: 'Femme' },
  { id: 'm', name: 'Homme' }
]);
// Chaque race a ses teintes de peau (ou de pelage) ; la première est celle par défaut.
export const LOOK_RACES = Object.freeze([
  { id: 'humain', name: 'Humain', skins: ['#f0c7a0', '#e8b48a', '#c98e62', '#a86c45', '#7a4a2e', '#4e2f1e'] },
  { id: 'orc', name: 'Orc', skins: ['#6f9a4a', '#58803a', '#86a85a', '#7b8a4e', '#5f7a64', '#8a6f4a'] },
  { id: 'elfe', name: 'Elfe', skins: ['#f6dcc8', '#e9c9a8', '#c9a0d8', '#a8b8e0', '#8a7aa8', '#5a5070'] },
  { id: 'minotaure', name: 'Minotaure', skins: ['#8a5a3a', '#6a4028', '#b07a4a', '#3a2a24', '#d8c8b0', '#9a8a7a'] }
]);
export const LOOK_HAIR_STYLES = Object.freeze([
  { id: 'court', name: 'Court' },
  { id: 'long', name: 'Long' },
  { id: 'queue', name: 'Queue de cheval' },
  { id: 'tresses', name: 'Tresses' },
  { id: 'crete', name: 'Crête' },
  { id: 'rase', name: 'Rasé' }
]);
export const LOOK_HAIR_COLORS = Object.freeze(['#7d5140', '#2a1f1a', '#c9a24a', '#e8d9a8', '#a8442a', '#e8e8e0', '#6a8ad8', '#3a7a4a']);
export const LOOK_EYE_COLORS = Object.freeze(['#202938', '#5a3a22', '#2a7ab8', '#3a9a4a', '#c8a020', '#c83a3a']);
// Tenues : armure (sombre, moyen, clair), cape (sombre, moyen, clair) et liseré.
export const LOOK_OUTFITS = Object.freeze([
  { id: 'acier', name: 'Acier et pourpre', armor: ['#3e526e', '#4b617e', '#7a93aa'], cape: ['#292d53', '#4b447e', '#6a62a0'], trim: '#b9a66d' },
  { id: 'cramoisi', name: 'Cramoisi', armor: ['#5a2626', '#7e3434', '#b05a4a'], cape: ['#3a1414', '#6a2020', '#9a3a2a'], trim: '#e0b860' },
  { id: 'foret', name: 'Forêt', armor: ['#3a4a2a', '#4e6a36', '#7a9a52'], cape: ['#2a3a22', '#3e5a2e', '#5e7e3e'], trim: '#c8a868' },
  { id: 'nuit', name: 'Nuit', armor: ['#1e1e28', '#2e2e3e', '#4e4e66'], cape: ['#14141c', '#22222e', '#3a3a50'], trim: '#8a8aa8' },
  { id: 'or', name: 'Or royal', armor: ['#7a5a1e', '#a8802a', '#e0c060'], cape: ['#1e2a5a', '#2e4084', '#4a62b0'], trim: '#fff0b0' },
  { id: 'glace', name: 'Glace', armor: ['#5a7a8a', '#7aa0b0', '#c0dce6'], cape: ['#2a4a6a', '#3e6a90', '#6a9ac0'], trim: '#e8f4f8' },
  { id: 'cuir', name: 'Cuir de voyage', armor: ['#4a3222', '#6a4a30', '#8e6a48'], cape: ['#3a2a1e', '#5a4030', '#7a5a42'], trim: '#a8885a' },
  { id: 'rose', name: 'Rose des vents', armor: ['#6a3a5a', '#8e4e7a', '#c07aa8'], cape: ['#3a2a4a', '#5a3e6e', '#7e5a94'], trim: '#f0c8e0' }
]);

const pick = (list, value, fallback) => (list.includes(value) ? value : fallback);
const ids = list => list.map(x => x.id);

// Apparence par défaut : celle du héros d'avant la création de personnage (humain, acier et pourpre).
export function defaultLook() {
  return { sex: 'm', race: 'humain', skin: '#f0c7a0', hairStyle: 'court', hair: '#7d5140', eyes: '#202938', outfit: 'acier' };
}
// Apparence vérifiée : chaque champ doit être une valeur connue (peau : une teinte de sa race).
export function sanitizeLook(raw) {
  const base = defaultLook();
  if (!raw || typeof raw !== 'object') return base;
  const race = LOOK_RACES.find(r => r.id === raw.race) || LOOK_RACES[0];
  return {
    sex: pick(ids(LOOK_SEXES), raw.sex, base.sex),
    race: race.id,
    skin: pick(race.skins, typeof raw.skin === 'string' ? raw.skin.toLowerCase() : '', race.skins[0]),
    hairStyle: pick(ids(LOOK_HAIR_STYLES), raw.hairStyle, base.hairStyle),
    hair: pick(LOOK_HAIR_COLORS, typeof raw.hair === 'string' ? raw.hair.toLowerCase() : '', base.hair),
    eyes: pick(LOOK_EYE_COLORS, typeof raw.eyes === 'string' ? raw.eyes.toLowerCase() : '', base.eyes),
    outfit: pick(ids(LOOK_OUTFITS), raw.outfit, base.outfit),
    // Apparence portée : seulement quand il y en a une.
    ...(SKIN_IDS.includes(raw.wear) ? { wear: raw.wear } : {})
  };
}
// Apparence au hasard (rng : fonction qui renvoie un nombre dans [0, 1)).
export function randomLook(rng = Math.random) {
  const one = list => list[Math.floor(rng() * list.length) % list.length];
  const race = one(LOOK_RACES);
  return sanitizeLook({
    sex: one(LOOK_SEXES).id,
    race: race.id,
    skin: one(race.skins),
    hairStyle: one(LOOK_HAIR_STYLES).id,
    hair: one(LOOK_HAIR_COLORS),
    eyes: one(LOOK_EYE_COLORS),
    outfit: one(LOOK_OUTFITS).id
  });
}
// Forme compacte pour le réseau et le cache des sprites : « m|humain|#f0c7a0|court|#7d5140|#202938|acier », suivie de
// « |dragon » quand une apparence est portée.
const ORDER = ['sex', 'race', 'skin', 'hairStyle', 'hair', 'eyes', 'outfit', 'wear'];
export function encodeLook(look) {
  const clean = sanitizeLook(look);
  return ORDER.filter(key => key !== 'wear' || clean.wear)
    .map(key => clean[key])
    .join('|');
}
export function decodeLook(text) {
  if (typeof text !== 'string' || text.length > 120) return defaultLook();
  const parts = text.split('|');
  return sanitizeLook(Object.fromEntries(ORDER.map((key, i) => [key, parts[i]])));
}
export function lookOutfit(id) {
  return LOOK_OUTFITS.find(o => o.id === id) || LOOK_OUTFITS[0];
}
