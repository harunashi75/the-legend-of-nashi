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
    'Chaque coup subi forge une plaque de fer (5 au plus, 6 s) : −{n} % de dégâts subis par plaque. À 5 plaques, ton prochain coup libère une onde de choc ({m} % de ton Attaque autour de toi) et brise les plaques.',
    [3, 3.5, 4, 4.5, 5],
    [200, 240, 280, 330, 400]
  ],
  [
    'croc_ombres',
    2,
    'Croc des Ombres',
    '⟦artefact_croc_ombres⟧',
    '#8a50c8',
    '#d8b0ff',
    'Chance critique +{n} points ; tes critiques déchirent ({m} % du coup en saignement sur 4 s), et achever un ennemi qui saigne te rend 4 % de tes PV maximum.',
    [10, 11, 12, 14, 16],
    [40, 46, 52, 58, 65]
  ],
  [
    'pierre_colosse',
    3,
    'Pierre du Colosse',
    '⟦artefact_pierre_colosse⟧',
    '#9a8a70',
    '#e2d4b8',
    'PV maximum +{n} % ; toutes les 8 s, ta peau de pierre réduit de {m} % le prochain coup reçu.',
    [20, 22, 25, 28, 32],
    [50, 55, 60, 65, 70]
  ],
  [
    'fiole_brumes',
    4,
    'Fiole des Brumes',
    '⟦artefact_fiole_brumes⟧',
    '#4aa85a',
    '#a8f2bc',
    'Soins reçus +{n} % ; sous 35 % de PV, une brume guérisseuse te rend {m} % de tes PV maximum en 5 s (recharge 45 s).',
    [25, 28, 32, 36, 40],
    [25, 28, 32, 36, 40]
  ],
  [
    'ecu_dechu',
    5,
    'Écu du Déchu',
    '⟦artefact_ecu_dechu⟧',
    '#4a7ab8',
    '#a4caff',
    '{n} % de chances de parer un coup (aucun dégât) et de riposter ({m} % de ton Attaque) ; ta compétence suivante fait +30 %.',
    [15, 17, 19, 21, 24],
    [150, 175, 200, 230, 260]
  ],
  [
    'ecaille_ecarlate',
    6,
    'Écaille Écarlate',
    '⟦artefact_ecaille_ecarlate⟧',
    '#d8413a',
    '#ff9c86',
    'Tes compétences réveillent l’Hydre : trois têtes de feu crachent sur ta cible et les ennemis proches ({n} % des dégâts chacune). Tes coups brûlent ({m} % des dégâts en 4 s).',
    [25, 29, 33, 38, 44],
    [10, 12, 14, 17, 20]
  ],
  [
    'oeil_tempetes',
    7,
    'Œil des Tempêtes',
    '⟦artefact_oeil_tempetes⟧',
    '#3a9ad8',
    '#a8e0ff',
    'Tous les 5 coups, la foudre tombe sur ta cible et rebondit sur 3 ennemis proches : {n} % de ton Attaque, et ils sont ralentis de {m} % pendant 2 s.',
    [120, 140, 160, 185, 220],
    [20, 22, 25, 28, 30]
  ],
  [
    'sceau_executeur',
    8,
    'Sceau de l’Exécuteur',
    '⟦artefact_sceau_executeur⟧',
    '#7a6ae0',
    '#c8bcff',
    '+{n} % de dégâts contre les ennemis sous 35 % de leurs PV ; achever un ennemi réduit toutes tes recharges de {m} s.',
    [30, 34, 38, 43, 50],
    [1, 1.5, 2, 2.5, 3]
  ],
  [
    'prisme_cristal',
    9,
    'Prisme de Cristal',
    '⟦artefact_prisme_cristal⟧',
    '#b070e0',
    '#e8c8ff',
    'Toutes les 15 s, un bouclier de cristal absorbe {n} % de tes PV maximum ; quand il se brise, il éclate ({m} % de ton Attaque autour de toi).',
    [12, 14, 16, 18, 21],
    [150, 175, 200, 230, 260]
  ],
  [
    'coeur_cendres',
    10,
    'Cœur de Cendres',
    '⟦artefact_coeur_cendres⟧',
    '#e0702a',
    '#ffc890',
    'Compétences +{n} % de dégâts et recharges −{m} % ; tes compétences offensives embrasent le sol sous leur cible (30 % de ton Attaque par seconde pendant 3 s).',
    [16, 18, 21, 24, 28],
    [10, 12, 14, 16, 18]
  ],
  [
    'voile_neant',
    11,
    'Voile du Néant',
    '⟦artefact_voile_neant⟧',
    '#9a40e0',
    '#e0a8ff',
    'Recharge de la roulade −{n} % ; chaque roulade laisse un écho du Néant qui explose 1 s plus tard ({m} % de ton Attaque autour de lui) et te donne +25 % de dégâts pendant 3 s.',
    [35, 38, 41, 45, 50],
    [150, 180, 210, 250, 300]
  ],
  [
    'couronne_souverain',
    12,
    'Couronne du Souverain',
    '⟦artefact_couronne_souverain⟧',
    '#e0b030',
    '#ffe8a0',
    'Attaque, Défense et PV maximum +{n} % ; une fois toutes les 90 s, un coup fatal te rend {m} % de tes PV et 2 s d’invulnérabilité.',
    [10, 11, 12, 14, 16],
    [30, 35, 40, 45, 50]
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
  // Nombres à la française (virgule décimale) : « −4,5 % ».
  const fr = /** @param {number | undefined} v */ v => (v === undefined ? '' : String(v).replace('.', ','));
  return a.desc.replace('{n}', fr(a.n[k])).replace('{m}', fr(a.m[k]));
}
