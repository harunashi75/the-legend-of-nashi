// @ts-check
// Catalogue des Rubis : six familles de huit, emplacements et compétences sans dégâts.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
export const RUBIS_FAMILIES = Object.freeze([
  {
    name: 'Runes offensives',
    short: 'Offensive',
    icon: '⟦fam_offense⟧',
    color: '#d8413a',
    light: '#ff9c86',
    dark: '#6a1218'
  },
  {
    name: 'Runes défensives',
    short: 'Défensive',
    icon: '⟦fam_defense⟧',
    color: '#3b78d0',
    light: '#a4caff',
    dark: '#122a5a'
  },
  {
    name: 'Runes de soutien',
    short: 'Soutien',
    icon: '⟦fam_support⟧',
    color: '#36b464',
    light: '#a8f2bc',
    dark: '#0e4424'
  },
  {
    name: 'Runes d’armes',
    short: 'Arme',
    icon: '⟦fam_weapon⟧',
    color: '#e09a2a',
    light: '#ffd890',
    dark: '#5a3608'
  },
  {
    name: 'Runes utilitaires',
    short: 'Utilitaire',
    icon: '⟦fam_utility⟧',
    color: '#2ab4b0',
    light: '#a0f2ec',
    dark: '#0a4442'
  },
  {
    name: 'Runes spéciales',
    short: 'Spéciale',
    icon: '⟦fam_special⟧',
    color: '#a85ae0',
    light: '#e2b8ff',
    dark: '#3a1260'
  }
]);
// [identifiant, famille, nom, icône, effet]. L'ordre donne le numéro (01 à 48).
const LIST = [
  ['berserker', 0, 'Berserker', '⟦rubis_berserker⟧', '+15 % de dégâts lorsque tes PV sont sous 30 %.'],
  [
    'duelliste',
    0,
    'Duelliste',
    '⟦rubis_duelliste⟧',
    '+8 % de dégâts si un seul ennemi se trouve à moins de 5 cases.'
  ],
  ['chasseur', 0, 'Chasseur', '⟦rubis_chasseur⟧', '+12 % de dégâts contre les mobs élites.'],
  ['briseur', 0, 'Briseur', '⟦rubis_briseur⟧', 'Les attaques ignorent 8 % de la défense ennemie.'],
  [
    'carnage',
    0,
    'Carnage',
    '⟦rubis_carnage⟧',
    'Chaque élimination augmente les dégâts de 3 % pendant 8 s, cumulable 3 fois.'
  ],
  [
    'precision',
    0,
    'Précision mortelle',
    '⟦rubis_precision⟧',
    'Les coups critiques infligent 12 % de dégâts supplémentaires.'
  ],
  [
    'acharnement',
    0,
    'Acharnement',
    '⟦rubis_acharnement⟧',
    'Frapper 4 fois la même cible augmente les dégâts contre elle de 10 % pendant 5 s.'
  ],
  [
    'dernier_souffle',
    0,
    'Dernier souffle',
    '⟦rubis_dernier_souffle⟧',
    '+15 % de dégâts contre les ennemis sous 20 % de PV.'
  ],
  ['colosse', 1, 'Colosse', '⟦rubis_colosse⟧', '+10 % de PV maximum, mais −5 % de vitesse de déplacement.'],
  [
    'gardien',
    1,
    'Gardien',
    '⟦rubis_gardien⟧',
    'Après un coup reçu, −10 % de dégâts subis pendant 3 s. Recharge : 20 s.'
  ],
  [
    'rempart',
    1,
    'Rempart',
    '⟦rubis_rempart⟧',
    'Sous 40 % de PV, gagne un bouclier de 15 % des PV max pendant 5 s. Recharge : 45 s.'
  ],
  ['peau_de_pierre', 1, 'Peau de pierre', '⟦rubis_peau_de_pierre⟧', '−6 % de dégâts physiques reçus.'],
  ['volonte', 1, 'Volonté de fer', '⟦rubis_volonte⟧', 'Les dégâts critiques reçus sont réduits de 20 %.'],
  [
    'forteresse',
    1,
    'Forteresse',
    '⟦rubis_forteresse⟧',
    'Rester immobile pendant 2 s accorde −12 % de dégâts reçus jusqu’au déplacement.'
  ],
  [
    'resilience',
    1,
    'Résilience',
    '⟦rubis_resilience⟧',
    'Après avoir perdu 25 % des PV max en 3 s, récupère 8 % des PV max sur 5 s. Recharge : 30 s.'
  ],
  [
    'second_souffle',
    1,
    'Second souffle',
    '⟦rubis_second_souffle⟧',
    'Une fois par combat, survivre à un coup fatal avec 10 % des PV max.'
  ],
  ['guerisseur', 2, 'Guérisseur', '⟦rubis_guerisseur⟧', '+8 % de soins prodigués.'],
  [
    'regeneration',
    2,
    'Régénération',
    '⟦rubis_regeneration⟧',
    'Récupère 1 % des PV max toutes les 5 s hors combat.'
  ],
  ['arcane', 2, 'Arcane', '⟦rubis_arcane⟧', 'Les compétences consomment 10 % de mana en moins.'],
  ['faucheur', 2, 'Faucheur', '⟦rubis_faucheur⟧', 'Chaque élimination restaure 5 % des PV max.'],
  ['meditation', 2, 'Méditation', '⟦rubis_meditation⟧', 'Récupère 3 % du mana maximum toutes les 5 s.'],
  [
    'benediction',
    2,
    'Bénédiction',
    '⟦rubis_benediction⟧',
    'Après avoir reçu un soin, gagne +5 % de dégâts pendant 6 s.'
  ],
  ['source_vitale', 2, 'Source vitale', '⟦rubis_source_vitale⟧', 'Les soins reçus sont augmentés de 10 %.'],
  [
    'communion',
    2,
    'Communion',
    '⟦rubis_communion⟧',
    'Soigner un allié restaure également 3 % de tes PV max. Recharge : 8 s.'
  ],
  [
    'tempete',
    3,
    'Tempête',
    '⟦rubis_tempete⟧',
    'Les coups critiques ont 15 % de chance de déclencher un éclair infligeant 35 % des dégâts du coup.'
  ],
  [
    'echo',
    3,
    'Écho',
    '⟦rubis_echo⟧',
    'Les compétences offensives ont 10 % de chance de répéter 30 % de leurs dégâts.'
  ],
  [
    'vampire',
    3,
    'Vampire',
    '⟦rubis_vampire⟧',
    'Les coups critiques rendent 3 % des dégâts réellement infligés en PV.'
  ],
  [
    'onde',
    3,
    'Onde de choc',
    '⟦rubis_onde⟧',
    'Toutes les 8 attaques réussies, une onde inflige 40 % des dégâts d’attaque aux ennemis proches.'
  ],
  [
    'lame_ardente',
    3,
    'Lame ardente',
    '⟦rubis_lame_ardente⟧',
    'Les attaques ont 15 % de chance d’infliger une brûlure de 12 % des dégâts du coup sur 4 s.'
  ],
  [
    'gel',
    3,
    'Gel mordant',
    '⟦rubis_gel⟧',
    'Les attaques ont 12 % de chance de ralentir l’ennemi de 25 % pendant 3 s.'
  ],
  [
    'acceleration',
    3,
    'Accélération',
    '⟦rubis_acceleration⟧',
    'Utiliser une compétence augmente la vitesse d’attaque de 10 % pendant 4 s. Recharge : 10 s.'
  ],
  [
    'resonance',
    3,
    'Résonance',
    '⟦rubis_resonance⟧',
    'Toutes les 5 compétences offensives, la prochaine inflige +20 % de dégâts.'
  ],
  ['voyageur', 4, 'Voyageur', '⟦rubis_voyageur⟧', '+10 % de vitesse de déplacement hors combat.'],
  ['sprinteur', 4, 'Sprinteur', '⟦rubis_sprinteur⟧', 'Après une esquive, +20 % de vitesse pendant 2 s.'],
  ['endurance', 4, 'Endurance', '⟦rubis_endurance⟧', 'Réduit le temps de recharge de l’esquive de 15 %.'],
  [
    'recuperation',
    4,
    'Récupération',
    '⟦rubis_recuperation⟧',
    'Après une élimination, réduit de 1 s la recharge de la dernière compétence utilisée. Recharge : 5 s.'
  ],
  [
    'prospecteur',
    4,
    'Prospecteur',
    '⟦rubis_prospecteur⟧',
    '15 % de chances qu’un monstre ordinaire lâche un objet Peu commun au lieu d’un Commun.'
  ],
  ['tresorier', 4, 'Trésorier', '⟦rubis_tresorier⟧', '+15 % d’or obtenu sur les monstres.'],
  [
    'explorateur',
    4,
    'Explorateur',
    '⟦rubis_explorateur⟧',
    'Révèle les coffres secrets à moins de 12 cases sur la mini-carte.'
  ],
  [
    'elan',
    4,
    'Élan',
    '⟦rubis_elan⟧',
    'Après 5 s de déplacement continu hors combat, gagne +15 % de vitesse jusqu’à l’arrêt.'
  ],
  [
    'phenix',
    5,
    'Phénix',
    '⟦rubis_phenix⟧',
    'Une fois par combat, survivre à un coup fatal avec 20 % des PV max et repousser les ennemis proches.'
  ],
  ['pacte', 5, 'Pacte de sang', '⟦rubis_pacte⟧', '+18 % de dégâts, mais les PV max sont réduits de 12 %.'],
  [
    'miroir',
    5,
    'Miroir',
    '⟦rubis_miroir⟧',
    '15 % des dégâts directs reçus sont renvoyés à l’attaquant, plafonnés à 5 % de ses PV max par coup.'
  ],
  [
    'eclipse',
    5,
    'Éclipse',
    '⟦rubis_eclipse⟧',
    'Après 3 coups critiques, la prochaine compétence offensive inflige +25 % de dégâts.'
  ],
  [
    'ame_liee',
    5,
    'Âme liée',
    '⟦rubis_ame_liee⟧',
    'Lorsque tu soignes un allié, il reçoit un bouclier de 8 % de ses PV max pendant 5 s. Recharge : 15 s par allié.'
  ],
  [
    'chaos',
    5,
    'Chaos',
    '⟦rubis_chaos⟧',
    'Chaque compétence offensive a 20 % de chance d’infliger +30 % de dégâts ou −10 % de dégâts, à chances égales.'
  ],
  [
    'symbiose',
    5,
    'Symbiose',
    '⟦rubis_symbiose⟧',
    'Récupérer du mana grâce à un effet rend aussi 20 % de ce mana en PV, plafonnés à 3 % des PV max.'
  ],
  [
    'transcendance',
    5,
    'Transcendance',
    '⟦rubis_transcendance⟧',
    'Toutes les 30 s en combat, la prochaine compétence coûte 0 mana et inflige +15 % si elle est offensive.'
  ]
];
// Effets de groupe : ils ne se déclenchent qu'en coopération (soins prodigués à un allié).
export const RUBIS_GROUP_ONLY = new Set(['communion', 'ame_liee']);
export const RUBIS_CATALOG = Object.freeze(
  LIST.map(([id, family, name, icon, desc], i) => Object.freeze({ id, n: i + 1, family, name, icon, desc }))
);
export const RUBIS_SLOTS = 6;
// Compétences sans dégâts : postures, renforcements, esquives et soins.
export const RUBIS_UTILITY_SKILLS = new Set([
  'sword:2',
  'dualsword:2',
  'axe:2',
  'dualdagger:2',
  'staff:2',
  'shield:3',
  'lute:2'
]);
