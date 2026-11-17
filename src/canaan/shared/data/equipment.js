// @ts-check
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
    'name': 'Légendaire',
    'color': '#ff983d',
    'mult': 1.5
  },
  {
    'name': 'Mythique',
    'color': '#45e1db',
    'mult': 1.7
  }
];
// Compétences d'armes : [icône, nom, résumé, recharge (s), mana, puissance, explication].
// puissance : dégâts totaux sur une cible, en multiple de la Puissance d'attaque (0 = pas de dégâts directs) ;
// l'info-bulle l'affiche en dégâts estimés. Les attaques de base font 75 % (clic gauche) et 160 % (clic droit).
export const WEAPON_DEFINITIONS = {
  sword: {
    name: 'Épée',
    icon: '⟦w_sword⟧',
    role: 'Polyvalente : frappes sûres, parade et riposte qui soigne.',
    sp: [
      [
        '🗡️',
        'Frappe précise',
        'Cône court · 260 %',
        4,
        8,
        2.6,
        'Un coup puissant devant toi qui touche tous les ennemis du cône.'
      ],
      [
        '🌀',
        'Tourbillon',
        'Cercle autour de toi · 180 %',
        7,
        14,
        1.8,
        'Tu tournoies et frappes tous les ennemis autour de toi.'
      ],
      [
        '🛡️',
        'Parade',
        '−40 % de dégâts reçus 2,5 s · prépare la Riposte',
        12,
        12,
        0,
        'Pendant 2,5 s, tu subis 40 % de dégâts en moins. Pendant 4 s, ta Riposte héroïque est renforcée.'
      ],
      [
        '💚',
        'Riposte héroïque',
        'Cône · 450 % (600 % après Parade) · vol de vie 20 %',
        11,
        22,
        4.5,
        'Un coup dévastateur devant toi. Après une Parade, il inflige 600 %. Tu récupères 20 % des dégâts infligés en PV.'
      ]
    ]
  },
  dualsword: {
    name: 'Épées doubles',
    icon: '⟦w_dualsword⟧',
    role: 'Rapide : enchaîne les coups et accélère tes attaques.',
    sp: [
      [
        '⚡',
        'Rafale de lames',
        '4 coups rapides · 75 % chacun (300 %)',
        5,
        12,
        3,
        '4 coups en cône devant toi en moins d’une demi-seconde. Active le combo pendant 4 s.'
      ],
      [
        '🌪️',
        'Danse des lames',
        '3 tours · 70 % chacun (210 %)',
        9,
        18,
        2.1,
        '3 frappes circulaires autour de toi. Active le combo pendant 4 s.'
      ],
      [
        '🔥',
        'Élan offensif',
        'Attaques de base 30 % plus rapides et +15 % de dégâts, 6 s',
        14,
        14,
        0,
        'Pendant 6 s, tes attaques de base sont 30 % plus rapides et tous tes coups font +15 % de dégâts. Tu subis 10 % de dégâts en plus.'
      ],
      [
        '💥',
        'Assaut final',
        '6 frappes · 80 % (480 %), dernier coup ×2 en combo',
        13,
        24,
        4.8,
        '6 frappes en cône. Si le combo est actif (Rafale ou Danse lancée dans les 4 s), la dernière frappe fait double dégâts (560 % au total).'
      ]
    ]
  },
  axe: {
    name: 'Hache',
    icon: '⟦w_axe⟧',
    role: 'Brutale : gros coups lents et exécution des cibles blessées.',
    sp: [
      ['🪓', 'Frappe écrasante', 'Cône · 320 %', 5, 12, 3.2, 'Un coup lourd devant toi.'],
      [
        '🌋',
        'Fendoir',
        'Large cône de 120° · 220 %',
        8,
        16,
        2.2,
        'Un grand coup de taille qui touche tous les ennemis devant toi.'
      ],
      [
        '🔥',
        'Rage du berserker',
        '+25 % de dégâts pendant 8 s',
        16,
        16,
        0,
        'Pendant 8 s, tous tes coups (attaques de base comprises) font +25 % de dégâts. Tu subis 15 % de dégâts en plus.'
      ],
      [
        '💀',
        'Exécution',
        'Cône · 500 %, ou 750 % sous 30 % de PV',
        13,
        24,
        5,
        'Un coup fatal devant toi. Contre une cible sous 30 % de ses PV, il inflige 750 %.'
      ]
    ]
  },
  mace: {
    name: 'Masse',
    icon: '⟦w_mace⟧',
    role: 'Contrôle : brise l’armure, ralentit et étourdit.',
    sp: [
      [
        '🔨',
        'Coup fracassant',
        'Cône · 260 % · armure brisée 6 s',
        6,
        12,
        2.6,
        'Brise l’armure des ennemis touchés : ils subissent 10 % de dégâts en plus pendant 6 s (de toi et de ton groupe).'
      ],
      [
        '💢',
        'Onde de choc',
        'Cercle · 180 % · ralentit 3 s',
        10,
        18,
        1.8,
        'Frappe le sol : tous les ennemis autour de toi sont touchés et ralentis pendant 3 s.'
      ],
      [
        '✋',
        'Coup d’interruption',
        'Cône · 200 % · étourdit 1,5 s (boss : affaibli)',
        11,
        16,
        2,
        'Étourdit les monstres touchés pendant 1,5 s. Un boss n’est pas étourdi mais affaibli : il inflige 5 % de dégâts en moins pendant 4 s.'
      ],
      [
        '💥',
        'Briseur de rempart',
        'Cône · 460 %, ou 600 % sur armure brisée',
        14,
        24,
        4.6,
        'Un coup massif devant toi. Contre une cible à l’armure brisée (Coup fracassant), il inflige 600 %.'
      ]
    ]
  },
  spear: {
    name: 'Lance',
    icon: '⟦w_spear⟧',
    role: 'Portée : frappe de loin en ligne et repousse.',
    sp: [
      [
        '🔱',
        'Estoc perforant',
        'Ligne longue · 270 %',
        5,
        12,
        2.7,
        'Un coup en ligne droite qui traverse tous les ennemis alignés devant toi.'
      ],
      [
        '🌙',
        'Balayage du lancier',
        'Demi-cercle · 190 % · repousse',
        8,
        16,
        1.9,
        'Un balayage devant toi qui repousse les monstres (pas les boss).'
      ],
      [
        '💨',
        'Charge du lancier',
        'Bond en avant · 240 % sur la trajectoire',
        10,
        18,
        2.4,
        'Tu bondis vers la souris et frappes tous les ennemis sur ton chemin et devant toi.'
      ],
      [
        '🎯',
        'Percée parfaite',
        'Cône étroit · 460 %, ou 600 % à portée idéale',
        13,
        24,
        4.6,
        'Un estoc puissant. Contre une cible entre 3 et 5 cases de toi (ni collée, ni trop loin), il inflige 600 %.'
      ]
    ]
  },
  dualdagger: {
    name: 'Dagues doubles',
    icon: '⟦w_dualdagger⟧',
    role: 'Saignement : fais saigner, puis consume les saignements.',
    sp: [
      [
        '🩸',
        'Entaille rapide',
        '2 coups · 120 % chacun · saignement 5 s',
        5,
        11,
        2.4,
        '2 coups devant toi. Le second fait saigner : 35 % de ta Puissance par seconde pendant 5 s (175 % en tout).'
      ],
      [
        '🌀',
        'Lames tournoyantes',
        'Cercle · 180 % · saignements +3 s',
        8,
        16,
        1.8,
        'Frappe tous les ennemis autour de toi et prolonge de 3 s leurs saignements.'
      ],
      [
        '💨',
        'Pas de l’ombre',
        'Bond arrière · prochain coup +60 %',
        10,
        12,
        0,
        'Tu bondis en arrière (dos à la souris). Ton prochain coup, dans les 4 s, fait +60 % de dégâts.'
      ],
      [
        '🩸',
        'Mille coupures',
        '5 coups · 85 % (425 %) · consume les saignements',
        13,
        24,
        4.25,
        '5 coups en cône. Chaque saignement touché explose aussitôt : il inflige d’un coup 150 % de ce qu’il lui restait à faire.'
      ]
    ]
  },
  bow: {
    name: 'Arc',
    icon: '⟦w_bow⟧',
    role: 'Distance : tirs puissants, zone au sol et repli.',
    sp: [
      [
        '🏹',
        'Tir puissant',
        'Flèche · 280 % (360 % après un Repli)',
        4,
        10,
        2.8,
        'Une flèche puissante vers la souris. Juste après un Repli tactique (5 s), elle inflige 360 %.'
      ],
      [
        '🌧️',
        'Pluie de flèches',
        'Zone sous la souris · 4 salves de 90 % (360 %)',
        11,
        20,
        3.6,
        'Une pluie de flèches tombe là où tu vises : 4 salves en 2 s sur tous les ennemis de la zone.'
      ],
      [
        '🕸️',
        'Tir entravant',
        'Flèche · 200 % · ralentit 4 s (boss : marqué)',
        9,
        14,
        2,
        'Une flèche qui ralentit les monstres sur sa ligne pendant 4 s. Un boss est marqué : son prochain coup reçu fait +30 % de dégâts.'
      ],
      [
        '💨',
        'Repli tactique',
        'Bond arrière · tir 240 % · renforce le Tir puissant',
        10,
        16,
        2.4,
        'Tu bondis en arrière et tires une flèche (240 %). Ton prochain Tir puissant dans les 5 s inflige 360 %.'
      ]
    ]
  },
  shield: {
    name: 'Égide sacrée',
    icon: '⟦w_shield⟧',
    role: 'Protection : zone sacrée qui soigne le groupe et serment défensif.',
    sp: [
      [
        '🌀',
        'Tempête d’égide',
        'Cercle · 4 frappes de 65 % (260 %)',
        9,
        18,
        2.6,
        'Ton bouclier tourne autour de toi et frappe 4 fois tous les ennemis proches.'
      ],
      [
        '☀️',
        'Sol consacré',
        'Zone 6 s · 60 %/s aux ennemis · soigne 3 % PV/s',
        17,
        24,
        3.6,
        'Consacre le sol pendant 6 s : chaque seconde, les ennemis dedans subissent 60 % de dégâts sacrés et chaque héros du groupe dedans récupère 3 % de ses PV max.'
      ],
      [
        '🛡️',
        'Lancer du rempart',
        'Ligne longue · 290 %',
        7,
        14,
        2.9,
        'Tu lances ton bouclier en ligne droite : il traverse et frappe tous les ennemis alignés.'
      ],
      [
        '✨',
        'Serment du gardien',
        '−35 % de dégâts reçus 6 s · soigne 15 % PV',
        22,
        26,
        0,
        'Pendant 6 s, tu subis 35 % de dégâts en moins, et tu récupères aussitôt 15 % de tes PV max.'
      ]
    ]
  },
  staff: {
    name: 'Bâton arcanique',
    icon: '⟦w_staff⟧',
    role: 'Arcanes : accumule des charges, puis libère-les avec la Surcharge.',
    sp: [
      [
        '🔮',
        'Projectile arcanique',
        'Projectile magique · 220 % · +1 charge',
        3,
        10,
        2.2,
        'Un projectile magique vers la souris. Donne 1 charge arcanique (3 au maximum, affichées sur la barre et sous ton héros).'
      ],
      [
        '💠',
        'Onde magique',
        'Cercle magique · 190 % · +1 charge si touche',
        8,
        18,
        1.9,
        'Une onde autour de toi qui frappe tous les ennemis proches. Donne 1 charge si elle touche au moins un ennemi.'
      ],
      [
        '✨',
        'Concentration',
        'Prochaine compétence +40 % · +1 charge',
        12,
        12,
        0,
        'Ta prochaine compétence offensive (dans les 8 s) fait +40 % de dégâts. Les attaques de base ne la consomment pas. Donne 1 charge.'
      ],
      [
        '🌌',
        'Surcharge arcanique',
        'Zone sous la souris · 320 % +140 % par charge (max 740 %)',
        12,
        26,
        3.2,
        'Explosion là où tu vises : 320 %, plus 140 % par charge consommée (740 % avec 3 charges). Consomme toutes les charges.'
      ]
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
export const ACTIVE_GEAR_SLOTS = Object.freeze([
  'helm',
  'shoulders',
  'armor',
  'gloves',
  'boots',
  'neck',
  'ring',
  'artifact',
  'weapon'
]);
// Bijoux et artéfact : icône affichée à la place de celle d'une arme.
export const JEWEL_SLOTS = Object.freeze(['neck', 'ring', 'artifact']);
/** @type {Readonly<Record<string, string>>} */
export const JEWEL_ICON = Object.freeze({
  neck: '⟦slot_neck⟧',
  ring: '⟦slot_ring⟧',
  artifact: '⟦slot_artifact⟧'
});
// Chances de chaque qualité au tirage libre, en pourcentage, de Commun à Mythique. Légendaire et Mythique ne se
// tirent jamais au hasard : ils ne viennent que du dernier raid (mode héroïque) et du dernier boss de l'Arène.
export const RARITY_WEIGHTS = Object.freeze([45, 32, 20, 3, 0, 0]);
// Anciennes qualités supprimées (sauvegardes) : Héroïque devient Épique, Céleste devient Mythique.
/** @type {Readonly<Record<string, string>>} */
export const LEGACY_RARITY = Object.freeze({ Héroïque: 'Épique', Céleste: 'Mythique' });
// Butin de prestige : chance, par objet du coffre, d'une qualité supérieure (dernier raid en héroïque, Arène).
/** @type {Readonly<Record<string, ReadonlyArray<readonly [string, number]>>>} */
export const PRESTIGE_DROPS = Object.freeze({
  raidHeroic: [
    ['Mythique', 0.01],
    ['Légendaire', 0.05]
  ],
  arenaFinal: [['Légendaire', 0.05]],
  // Donjons des Tréfonds : Peu commun, ou Rare une fois sur trois environ.
  underground: [['Rare', 0.3]]
});
