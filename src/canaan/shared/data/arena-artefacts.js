// @ts-check
// Artéfacts de l'Arène des Épreuves : un par boss (vague 1 à 12), quatre emplacements sous le héros (fiche C).
// Chaque boss vaincu donne son artéfact ; un doublon le fait monter de rang (1 à 5), ce qui renforce son effet.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export const ARTEFACT_SLOTS = 4;
export const ARTEFACT_MAX_RANK = 5;
// Or donné à la place d'un artéfact déjà au rang maximum : selon la vague du boss.
/** @type {(wave: number) => number} */
export const artefactMaxedGold = wave => 300 + 100 * wave;
// Anciens objets remboursés au chargement d'une sauvegarde d'avant les artéfacts de l'Arène : chaque Rune possédée.
export const LEGACY_RUNE_GOLD = 300;

// [identifiant, vague du boss, nom, icône, couleur, clair, effet, valeurs n par rang, valeurs m par rang]
// L'effet est un modèle : {n} et {m} prennent la valeur du rang de l'artéfact.
/** @type {ReadonlyArray<readonly [string, number, string, string, string, string, string, number[], number[]]>} */
const LIST = [
  [
    'coeur_fer',
    1,
    'Cœur de Fer',
    '⟦artefact_coeur_fer⟧',
    '#8a9098',
    '#d6dbe2',
    'Dégâts reçus −{n} %.',
    [15, 17, 19, 21, 24],
    []
  ],
  [
    'croc_ombres',
    2,
    'Croc des Ombres',
    '⟦artefact_croc_ombres⟧',
    '#8a50c8',
    '#d8b0ff',
    'Chance critique +{n} points ; tes coups critiques font saigner ({m} % du coup en 4 s).',
    [12, 13, 15, 17, 19],
    [30, 34, 38, 43, 48]
  ],
  [
    'pierre_colosse',
    3,
    'Pierre du Colosse',
    '⟦artefact_pierre_colosse⟧',
    '#9a8a70',
    '#e2d4b8',
    'PV maximum +{n} %.',
    [25, 28, 32, 36, 40],
    []
  ],
  [
    'fiole_brumes',
    4,
    'Fiole des Brumes',
    '⟦artefact_fiole_brumes⟧',
    '#4aa85a',
    '#a8f2bc',
    'Soins reçus +{n} % ; hors combat, tu récupères {m} % de tes PV maximum par seconde.',
    [30, 34, 38, 43, 48],
    [3, 3, 4, 4, 5]
  ],
  [
    'ecu_dechu',
    5,
    'Écu du Déchu',
    '⟦artefact_ecu_dechu⟧',
    '#4a7ab8',
    '#a4caff',
    '{n} % de chances de parer un coup (aucun dégât) et de riposter ({m} % de ton Attaque).',
    [15, 17, 19, 21, 24],
    [100, 115, 130, 150, 170]
  ],
  [
    'ecaille_ecarlate',
    6,
    'Écaille Écarlate',
    '⟦artefact_ecaille_ecarlate⟧',
    '#d8413a',
    '#ff9c86',
    'Tes coups enflamment l’ennemi : {n} % des dégâts infligés en brûlure sur 4 s.',
    [20, 23, 26, 29, 32],
    []
  ],
  [
    'oeil_tempetes',
    7,
    'Œil des Tempêtes',
    '⟦artefact_oeil_tempetes⟧',
    '#3a9ad8',
    '#a8e0ff',
    '{n} % de chances qu’un coup lance un éclair en chaîne : {m} % des dégâts sur la cible et deux ennemis proches.',
    [20, 22, 25, 28, 30],
    [50, 55, 60, 68, 75]
  ],
  [
    'sceau_executeur',
    8,
    'Sceau de l’Exécuteur',
    '⟦artefact_sceau_executeur⟧',
    '#7a6ae0',
    '#c8bcff',
    '+{n} % de dégâts contre les ennemis sous 35 % de leurs PV.',
    [40, 45, 50, 56, 64],
    []
  ],
  [
    'prisme_cristal',
    9,
    'Prisme de Cristal',
    '⟦artefact_prisme_cristal⟧',
    '#b070e0',
    '#e8c8ff',
    'Toutes les 20 s, un bouclier absorbe {n} % de tes PV maximum.',
    [15, 17, 19, 21, 24],
    []
  ],
  [
    'coeur_cendres',
    10,
    'Cœur de Cendres',
    '⟦artefact_coeur_cendres⟧',
    '#e0702a',
    '#ffc890',
    'Compétences +{n} % de dégâts ; leurs recharges −{m} %.',
    [20, 23, 26, 29, 32],
    [15, 16, 17, 18, 20]
  ],
  [
    'voile_neant',
    11,
    'Voile du Néant',
    '⟦artefact_voile_neant⟧',
    '#9a40e0',
    '#e0a8ff',
    'Recharge de la roulade −{n} % ; après une roulade, +{m} % de dégâts pendant 3 s.',
    [40, 42, 45, 48, 50],
    [30, 34, 38, 43, 48]
  ],
  [
    'couronne_souverain',
    12,
    'Couronne du Souverain',
    '⟦artefact_couronne_souverain⟧',
    '#e0b030',
    '#ffe8a0',
    'Attaque, Défense et PV maximum +{n} % ; une fois toutes les 90 s, un coup fatal te laisse à 20 % de tes PV.',
    [10, 11, 12, 14, 16],
    []
  ]
];

/**
 * @typedef {object} Artefact
 * @property {string} id
 * @property {number} wave vague du boss qui le donne (1 à 12)
 * @property {string} name
 * @property {string} icon repère d'icône ⟦…⟧
 * @property {string} color
 * @property {string} light
 * @property {string} desc modèle de l'effet ({n}, {m})
 * @property {ReadonlyArray<number>} n valeur principale par rang (indice 0 : rang 1)
 * @property {ReadonlyArray<number>} m valeur secondaire par rang (vide si aucune)
 */
/** @type {ReadonlyArray<Readonly<Artefact>>} */
export const ARTEFACTS = Object.freeze(
  LIST.map(([id, wave, name, icon, color, light, desc, n, m]) =>
    Object.freeze({ id, wave, name, icon, color, light, desc, n: Object.freeze(n), m: Object.freeze(m) })
  )
);
// Rang borné de 1 à ARTEFACT_MAX_RANK (0 : non possédé).
/** @type {(rank: unknown) => number} */
export const artefactRank = rank => Math.max(0, Math.min(ARTEFACT_MAX_RANK, Math.floor(Number(rank) || 0)));
// Effet d'un artéfact à un rang : le modèle rempli avec ses valeurs.
/**
 * @param {Readonly<Artefact>} a
 * @param {number} rank
 * @returns {string}
 */
export function artefactText(a, rank) {
  const k = Math.max(1, Math.min(ARTEFACT_MAX_RANK, rank || 1)) - 1;
  return a.desc.replace('{n}', String(a.n[k])).replace('{m}', String(a.m[k] ?? ''));
}
