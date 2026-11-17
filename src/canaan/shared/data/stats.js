// @ts-check
// Statistiques et progression : niveaux du personnage (1 à 60), statistiques des équipements et zones de niveau.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

export const MAX_LEVEL = 60;
// Trois statistiques principales, données par chaque équipement classique (pas l'artéfact).
export const PRIMARY_STATS = deepFreeze({
  attack: {
    icon: '⟦st_attack⟧',
    name: 'Attaque',
    desc: 'Augmente les dégâts des attaques et compétences offensives.'
  },
  defense: { icon: '⟦st_defense⟧', name: 'Défense', desc: 'Réduit les dégâts reçus.' },
  vitality: { icon: '⟦st_vitality⟧', name: 'Vitalité', desc: 'Augmente les PV maximum.' }
});
/** @type {readonly string[]} */
export const PRIMARY_KEYS = Object.freeze(Object.keys(PRIMARY_STATS));
// Six statistiques secondaires : deux différentes par équipement, tirées au hasard.
export const SECONDARY_STATS = deepFreeze({
  power: { icon: '⟦st_power⟧', name: 'Puissance', desc: 'Augmente tous les dégâts infligés.' },
  crit: { icon: '⟦st_crit⟧', name: 'Critique', desc: 'Augmente les chances de coup critique.' },
  haste: {
    icon: '⟦st_haste⟧',
    name: 'Célérité',
    desc: 'Augmente la vitesse d’attaque et réduit les temps de recharge.'
  },
  mastery: {
    icon: '⟦st_mastery⟧',
    name: 'Maîtrise',
    desc: 'Augmente les dégâts des compétences offensives.'
  },
  healing: { icon: '⟦st_healing⟧', name: 'Soin', desc: 'Augmente les soins effectués.' },
  resist: { icon: '⟦st_resist⟧', name: 'Résistance', desc: 'Réduit les dégâts reçus.' }
});
/** @type {readonly string[]} */
export const SECONDARY_KEYS = Object.freeze(Object.keys(SECONDARY_STATS));
// Force d'une qualité à niveau égal : une meilleure qualité donne plus de points principaux et secondaires.
/** @type {Readonly<Record<string, number>>} */
export const QUALITY_FACTOR = Object.freeze({
  Commun: 1,
  'Peu commun': 1.12,
  Rare: 1.27,
  Épique: 1.45,
  Légendaire: 1.87,
  Mythique: 2.1
});
// Part de chaque statistique principale selon l'emplacement [Attaque, Défense, Vitalité].
/** @type {Readonly<Record<string, readonly number[]>>} */
export const SLOT_PROFILE = deepFreeze({
  weapon: [1, 0.62, 0.75],
  armor: [0.55, 1, 0.9],
  helm: [0.5, 0.85, 0.85],
  shoulders: [0.6, 0.85, 0.7],
  gloves: [0.85, 0.6, 0.6],
  boots: [0.55, 0.7, 0.85],
  neck: [0.75, 0.5, 0.8],
  ring: [0.8, 0.55, 0.65]
});
// Niveaux des monstres de chaque zone, dans l'ordre des biomes (Plaines verdoyantes → Forêt enchantée).
/** @type {ReadonlyArray<readonly [number, number]>} */
export const ZONE_LEVELS = deepFreeze([
  [1, 10],
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50],
  [50, 60]
]);
// Courbe d'XP : multiplicateur par tranche de 10 niveaux (1–10 très rapide … 51–60 plus exigeant).
export const XP_BRACKETS = Object.freeze([1, 1.15, 1.35, 1.6, 1.9, 2.3]);
