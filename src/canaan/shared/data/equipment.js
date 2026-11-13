// Catalogues des objets : qualités, armes et compétences. Chaque objet a un niveau fixe (1 à 60), voir data/stats.js.
// Pas d'artisanat : un objet garde les statistiques de son drop (monstres, boss, donjons, raids).
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
export const GEAR_RARITIES = [
  {
    'name': 'Commun',
    'color': '#aeb4c0',
    'mult': 1
  },
  {
    'name': 'Peu commun',
    'color': '#53d986',
    'mult': 1.1
  },
  {
    'name': 'Rare',
    'color': '#58a8ff',
    'mult': 1.2
  },
  {
    'name': 'Épique',
    'color': '#bc80ff',
    'mult': 1.3
  },
  {
    'name': 'Héroïque',
    'color': '#ffdc65',
    'mult': 1.4
  },
  {
    'name': 'Légendaire',
    'color': '#ff983d',
    'mult': 1.5
  },
  {
    'name': 'Mythique',
    'color': '#45e1db',
    'mult': 1.7
  },
  {
    'name': 'Céleste',
    'color': '#ff4deb',
    'mult': 1.85
  }
];
export const WEAPON_DEFINITIONS = {
  sword: {
    name: 'Épée',
    icon: '⚔️',
    sp: [
      ['🗡️', 'Frappe précise', 'Coup frontal rapide · 120 %', 3, 8],
      ['🌀', 'Tourbillon', 'Zone circulaire · 85 %', 7, 14],
      ['🛡️', 'Parade', 'Réduit les dégâts reçus de 40 % pendant 2 s', 12, 14],
      ['💚', 'Riposte héroïque', '220 % (280 % après parade) · vol de vie 15 % des dégâts réels', 12, 23]
    ]
  },
  dualsword: {
    name: 'Épées doubles',
    icon: '⚔️',
    sp: [
      ['⚡', 'Rafale de lames', '4 coups rapides · 45 % chacun', 6, 13],
      ['🌪️', 'Danse des lames', '3 frappes circulaires · 55 % chacune', 9, 20],
      ['🔥', 'Élan offensif', 'Vitesse d’attaque +20 %, défense -10 %, 5 s', 14, 16],
      ['💥', 'Assaut final', '6 frappes · 45 %, dernier coup renforcé en combo', 13, 26]
    ]
  },
  axe: {
    name: 'Hache',
    icon: '🪓',
    sp: [
      ['🪓', 'Frappe écrasante', 'Coup frontal · 170 %', 5, 12],
      ['🌋', 'Fendoir', 'Cône de 120° · 125 %', 8, 17],
      ['🔥', 'Rage du berserker', 'Dégâts +20 %, défense -15 %, 6 s', 16, 18],
      ['💀', 'Exécution', '240 %, ou 320 % sous 30 % PV', 14, 26]
    ]
  },
  mace: {
    name: 'Masse',
    icon: '🔨',
    sp: [
      ['🔨', 'Coup fracassant', '130 % · bris d’armure 10 %, 6 s', 6, 13],
      ['💢', 'Onde de choc', 'Zone · 90 % et ralentissement 25 %, 3 s', 10, 19],
      ['✋', 'Coup d’interruption', '100 % · interrompt ou affaiblit un boss', 11, 17],
      ['💥', 'Briseur de rempart', '210 %, ou 260 % contre armure brisée', 14, 25]
    ]
  },
  spear: {
    name: 'Lance',
    icon: '🔱',
    sp: [
      ['🔱', 'Estoc perforant', 'Ligne traversante · 135 %', 5, 12],
      ['🌙', 'Balayage du lancier', 'Arc de 180° · 95 % et repoussement', 8, 17],
      ['💨', 'Charge du lancier', 'Bond en avant et dégâts sur la trajectoire · 115 %', 11, 19],
      ['🎯', 'Percée parfaite', '220 %, ou 275 % à portée optimale', 13, 25]
    ]
  },
  dualdagger: {
    name: 'Dagues doubles',
    icon: '🗡️',
    sp: [
      ['🩸', 'Entaille rapide', '2 frappes · 65 %, saignement 5 s', 5, 11],
      ['🌀', 'Lames tournoyantes', 'Zone · 90 % et prolonge les saignements', 8, 16],
      ['💨', 'Pas de l’ombre', 'Esquive directionnelle, prochain coup +25 %', 11, 15],
      ['🩸', 'Mille coupures', '5 frappes · 45 %, consume les saignements', 13, 24]
    ]
  },
  bow: {
    name: 'Arc',
    icon: '🏹',
    sp: [
      ['🏹', 'Tir chargé', 'Projectile · 100–190 % selon charge', 4, 11],
      ['🌧️', 'Pluie de flèches', '4 impacts en zone · 40 % chacun', 11, 21],
      ['🕸️', 'Tir entravant', '80 % · ralentit, ou marque un boss', 9, 15],
      ['💨', 'Repli tactique', 'Bond arrière et tir · 110 %, accélère le prochain tir', 11, 17]
    ]
  },
  shield: {
    name: 'Égide sacrée',
    icon: '🛡️',
    sp: [
      ['🌀', 'Tempête d’égide', 'Tourbillon de bouclier · 4 frappes de zone à 40 %', 9, 18],
      ['☀️', 'Sol consacré', 'Zone sacrée 6 s : dégâts sur la durée et soins périodiques', 17, 26],
      ['🛡️', 'Lancer du rempart', 'Bouclier projeté en ligne droite · 155 % et retour visuel', 7, 15],
      [
        '✨',
        'Serment du gardien',
        'Réduit les dégâts reçus de 35 % pendant 5 s et soigne 12 % des PV max',
        23,
        28
      ]
    ]
  },
  staff: {
    name: 'Bâton arcanique',
    icon: '🪄',
    sp: [
      ['🔮', 'Projectile arcanique', '120 % magique · +1 charge', 3, 11],
      ['💠', 'Onde magique', 'Zone · 100 % magique · +1 charge si touche', 8, 19],
      ['✨', 'Concentration', 'Prochain sort +30 % · +1 charge', 12, 14],
      ['🌌', 'Surcharge arcanique', '170 % +55 % par charge consommée (max 3)', 13, 27]
    ]
  }
};

export const WEAPON_TYPES = Object.fromEntries(
  Object.entries(WEAPON_DEFINITIONS).map(([key, { name, icon }]) => [key, { name, icon }])
);
export const WEAPON_SPELLS = Object.fromEntries(
  Object.entries(WEAPON_DEFINITIONS).map(([key, value]) => [key, value.sp])
);
export const CRAFT_WEAPONS = Object.keys(WEAPON_DEFINITIONS);


// Emplacements actifs : l'arme de réserve (weapon2) est équipée mais ne compte ni dans l'iLvl moyen ni dans les statistiques.
export const ACTIVE_GEAR_SLOTS = Object.freeze(['helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring', 'artifact', 'weapon']);
// Bijoux et artéfact : icône affichée à la place de celle d'une arme.
export const JEWEL_SLOTS = Object.freeze(['neck', 'ring', 'artifact']);
export const JEWEL_ICON = Object.freeze({ neck: '📿', ring: '💍', artifact: '🔮' });
// Chances de chaque qualité au tirage libre, en pourcentage, de Commun à Céleste.
export const RARITY_WEIGHTS = Object.freeze([45, 32, 19, 3, 0.78, 0.2, 0.018, 0.002]);
