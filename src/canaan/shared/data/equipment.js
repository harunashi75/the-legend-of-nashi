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
// Qualité à part des armes de l'Invocateur et du Berserker (Grimoire, Grande hache) : jamais tirée, jamais vendue,
// elle grandit avec le héros. Hors de GEAR_RARITIES : elle ne compte pas dans le rang des qualités.
export const BOUND_RARITY = Object.freeze({ name: 'Relique', color: '#b8f040', mult: 1.3 });
// Il n'y a plus d'armes au butin ni chez les marchands : chaque classe a la sienne (shared/data/classes.js, weapon),
// au niveau du héros. Les compétences : [icône, nom, résumé, recharge (s), mana, puissance, explication].
// puissance : dégâts totaux sur une cible, en multiple de la Puissance d'attaque (0 = pas de dégâts directs) ;
// l'info-bulle l'affiche en dégâts estimés. Les attaques de base font 75 % (clic gauche) et 160 % (clic droit).
// bound : la classe de l'arme ; form : jeu de compétences d'une forme (le félin du Druide), sans objet.
export const WEAPON_DEFINITIONS = {
  // Druide : bâton de nature, sorts à distance et soins.
  wildstaff: {
    name: 'Bâton sylvestre',
    icon: '⟦w_wildstaff⟧',
    role: 'Nature : lianes, spores, fleur de vie et racines géantes.',
    bound: 'druide',
    sp: [
      [
        '🌿',
        'Fouet de ronces',
        'Ligne · 240 % · ralentit 40 % 2 s',
        4,
        10,
        2.4,
        'Une liane hérissée d’épines fouette tout ce qui est aligné devant toi (6 cases) et ralentit les ennemis touchés de 40 % pendant 2 s.'
      ],
      [
        '🌸',
        'Floraison',
        'Fleur de vie 8 s sous la souris · soigne 3 % PV/s',
        14,
        18,
        0,
        'Une fleur de vie éclot là où tu vises pendant 8 s : chaque seconde, les héros à moins de 3 cases récupèrent 3 % de leurs PV max (24 % en tout).'
      ],
      [
        '🍄',
        'Spores toxiques',
        'Nuage 5 s sous la souris · 70 %/s · ralentit',
        10,
        18,
        3.5,
        'Un nuage de spores s’élève là où tu vises pendant 5 s : chaque seconde, les ennemis dedans subissent 70 % de dégâts de nature et sont ralentis de 20 %.'
      ],
      [
        '🌳',
        'Courroux de la forêt',
        '3 vagues de racines · 170 % chacune (510 %) · immobilise',
        14,
        26,
        5.1,
        'Trois vagues de racines géantes jaillissent du sol devant toi, de plus en plus loin : 170 % chacune, et les monstres touchés (pas les boss) sont immobilisés 1,5 s.'
      ]
    ]
  },
  // Forme féline du Druide : ses compétences pendant la transformation (aucun objet ne porte ce type).
  feline: {
    name: 'Griffes du félin',
    icon: '⟦w_feline⟧',
    role: 'Forme féline : griffures, bonds et morsures qui font saigner.',
    bound: 'druide',
    form: true,
    sp: [
      [
        '🐾',
        'Lacération',
        'Cône · 2 griffures de 120 % · saignement 5 s',
        4,
        10,
        2.4,
        'Deux coups de griffes devant toi. Le second fait saigner : 30 % de ta Puissance par seconde pendant 5 s (150 % en tout).'
      ],
      [
        '🐆',
        'Bond du prédateur',
        'Bond vers la souris · 220 % autour · étourdit 1 s',
        9,
        14,
        2.2,
        'Tu bondis jusqu’à la souris (5 cases au plus) et retombes toutes griffes dehors : 220 % aux ennemis autour de toi ; les monstres (pas les boss) sont étourdis 1 s.'
      ],
      [
        '🌀',
        'Rugissement sauvage',
        'Soigne 8 % PV · attaques de base +30 % de vitesse 6 s',
        16,
        14,
        0,
        'Tu rugis : tu récupères 8 % de tes PV max et, pendant 6 s, tes attaques de base sont 30 % plus rapides et font +15 % de dégâts.'
      ],
      [
        '🩸',
        'Morsure féroce',
        'Cône · 450 %, ou 650 % sur une cible qui saigne',
        12,
        22,
        4.5,
        'Une morsure à la gorge devant toi. Contre une cible qui saigne, elle inflige 650 %.'
      ]
    ]
  },
  // Paladin : masse et bouclier.
  aegis: {
    name: 'Masse et égide',
    icon: '⟦w_aegis⟧',
    role: 'Masse sacrée et bouclier : frappes qui soignent, charge, rempart et marteau du jugement.',
    bound: 'paladin',
    sp: [
      [
        '✨',
        'Frappe du croisé',
        'Cône · 280 % · te soigne de 3 % PV',
        5,
        12,
        2.8,
        'Un coup de masse sacré devant toi ; tu récupères 3 % de tes PV max.'
      ],
      [
        '🛡️',
        'Charge du bouclier',
        'Ruée de 5 cases · 220 % · étourdit 1,2 s (boss : affaibli)',
        10,
        16,
        2.2,
        'Tu fonces bouclier en avant vers la souris : 220 % à tout ce qui se trouve sur ton chemin. Les monstres touchés sont étourdis 1,2 s ; un boss est affaibli (−5 % de dégâts) 4 s.'
      ],
      [
        '🏰',
        'Rempart sacré',
        '−35 % de dégâts reçus 6 s · bouclier de groupe 12 %',
        20,
        20,
        0,
        'Tu lèves ton égide : pendant 6 s, tu subis 35 % de dégâts en moins, et toi et tes alliés à moins de 6 cases gagnez un bouclier de 12 % de vos PV max.'
      ],
      [
        '⚖️',
        'Marteau du Jugement',
        'Zone sous la souris · 500 % · sol consacré 5 s',
        15,
        26,
        5,
        'Un marteau de lumière s’abat là où tu vises : 500 % aux ennemis à moins de 2,5 cases, puis le sol reste consacré 5 s (50 % par seconde aux ennemis, 3 % des PV max par seconde aux héros dedans).'
      ]
    ]
  },
  // Assassin : dagues jumelles.
  dualdagger: {
    name: 'Dagues jumelles',
    icon: '⟦w_dualdagger⟧',
    role: 'Saignement : fais saigner, disparais dans l’ombre, puis consume les saignements.',
    bound: 'assassin',
    sp: [
      [
        '🩸',
        'Entaille',
        '2 coups · 120 % chacun · saignement 5 s',
        5,
        11,
        2.4,
        '2 coups devant toi. Le second fait saigner : 35 % de ta Puissance par seconde pendant 5 s (175 % en tout).'
      ],
      [
        '🌑',
        'Pas de l’ombre',
        'Téléportation dans le dos · prochain coup +60 % et critique',
        10,
        12,
        0,
        'Tu disparais et réapparais dans le dos de l’ennemi le plus proche de la souris (6 cases au plus ; sinon vers la souris). Ton prochain coup, dans les 4 s, fait +60 % de dégâts et est critique.'
      ],
      [
        '🗡️',
        'Éventail de lames',
        '5 dagues en éventail · 90 % chacune · saignement',
        8,
        14,
        0.9,
        'Tu lances 5 dagues en éventail vers la souris : 90 % au premier ennemi touché par chacune, et chaque dague fait saigner (20 % de ta Puissance par seconde pendant 4 s).'
      ],
      [
        '💀',
        'Mille coupures',
        '5 coups · 85 % (425 %) · consume les saignements',
        13,
        24,
        4.25,
        '5 coups en cône. Chaque saignement touché explose aussitôt : il inflige d’un coup 150 % de ce qu’il lui restait à faire.'
      ]
    ]
  },
  // Élémentaliste : bâton des éléments (feu, glace, foudre, feu).
  staff: {
    name: 'Bâton élémentaire',
    icon: '⟦w_staff⟧',
    role: 'Éléments : boule de feu, nova de givre, chaîne d’éclairs et météore.',
    bound: 'elementaliste',
    sp: [
      [
        '🔥',
        'Boule de feu',
        'Projectile · 260 % · explose',
        3,
        10,
        2.6,
        'Une boule de feu file vers la souris et explose au premier ennemi touché : 260 % à la cible, la moitié aux ennemis à moins de 1,5 case.'
      ],
      [
        '❄️',
        'Nova de givre',
        'Cercle de 3 cases · 190 % · gèle 1,5 s',
        10,
        18,
        1.9,
        'Une explosion de givre autour de toi : 190 % aux ennemis à moins de 3 cases. Les monstres sont gelés 1,5 s ; un boss est ralenti.'
      ],
      [
        '⚡',
        'Chaîne d’éclairs',
        'Éclair · 260 % · rebondit 4 fois',
        7,
        16,
        2.6,
        'Un éclair frappe l’ennemi le plus proche de la souris (9 cases au plus) puis rebondit sur 4 autres ennemis, en perdant 15 % à chaque rebond.'
      ],
      [
        '☄️',
        'Météore',
        'Zone sous la souris · 600 % · sol brûlant 4 s',
        16,
        28,
        6,
        'Un météore tombe du ciel là où tu vises : 0,8 s plus tard, 600 % aux ennemis à moins de 2,5 cases, puis le sol brûle 4 s (40 % par seconde).'
      ]
    ]
  },
  // Barde : luth. Notes magiques à distance, soins de groupe et symphonie qui frappe et soigne ; Puissance magique.
  lute: {
    name: 'Luth',
    icon: '⟦w_lute⟧',
    role: 'Musique : notes à distance, soins de groupe et symphonie qui frappe et soigne.',
    bound: 'barde',
    sp: [
      [
        '🎵',
        'Note éclatante',
        'Projectile magique · 240 % · soigne 4 % PV',
        4,
        10,
        2.4,
        'Une note vibrante file vers la souris : 240 % au premier ennemi touché. L’allié le plus blessé à moins de 8 cases (toi compris) récupère 4 % de ses PV max.'
      ],
      [
        '💢',
        'Accord dissonant',
        'Cercle autour de toi · 190 % · repousse',
        8,
        16,
        1.9,
        'Un accord violent frappe tous les ennemis autour de toi et repousse les monstres (pas les boss).'
      ],
      [
        '💗',
        'Chant de guérison',
        'Soigne le groupe de 12 % PV, puis 2 %/s pendant 5 s',
        14,
        20,
        0,
        'Toi et tes alliés à moins de 6 cases récupérez 12 % de vos PV max, puis 2 % par seconde pendant 5 s.'
      ],
      [
        '🎶',
        'Symphonie',
        'Zone sous la souris · 5 ondes de 100 % (500 %) · soigne',
        15,
        26,
        5,
        'Une symphonie résonne là où tu vises : 5 ondes en 2 s, 100 % chacune aux ennemis à moins de 3 cases. Chaque onde soigne de 2 % de leurs PV max les héros dans la zone.'
      ]
    ]
  },
  // Chasseur : arc long.
  bow: {
    name: 'Arc long',
    icon: '⟦w_bow⟧',
    role: 'Distance : flèches perçantes, marque de proie, volées et faucon spectral.',
    bound: 'chasseur',
    sp: [
      [
        '🏹',
        'Tir perçant',
        'Flèche qui traverse · 300 %',
        4,
        10,
        3,
        'Une flèche lourde file vers la souris et traverse tous les ennemis sur sa ligne (14 cases).'
      ],
      [
        '🎯',
        'Marque du chasseur',
        'Marque 12 s · +15 % de dégâts reçus',
        12,
        10,
        0,
        'Tu marques l’ennemi le plus proche de la souris pendant 12 s : il subit 15 % de dégâts en plus, de toi et de ton groupe, et tes flèches lui font encore +20 %.'
      ],
      [
        '🌧️',
        'Volée de flèches',
        'Zone sous la souris · 4 salves de 90 % (360 %)',
        11,
        20,
        3.6,
        'Une pluie de flèches tombe là où tu vises : 4 salves en 2 s sur tous les ennemis de la zone.'
      ],
      [
        '🦅',
        'Assaut du faucon',
        'Faucon spectral · 5 serres de 100 % (500 %)',
        15,
        24,
        5,
        'Un faucon spectral fond sur l’ennemi le plus proche de la souris et le lacère 5 fois en 2 s (100 % par serre). Si la cible meurt, il passe à l’ennemi le plus proche.'
      ]
    ]
  },
  // Guerrier : épées jumelles.
  dualsword: {
    name: 'Épées jumelles',
    icon: '⟦w_dualsword⟧',
    role: 'Combos : rafales, tempête d’acier, charge et exécution croisée.',
    bound: 'guerrier',
    sp: [
      [
        '⚔️',
        'Rafale de lames',
        '4 coups rapides · 80 % chacun (320 %)',
        5,
        12,
        3.2,
        '4 coups en cône devant toi en moins d’une demi-seconde. Active le combo pendant 4 s.'
      ],
      [
        '🌪️',
        'Tempête d’acier',
        '6 tours autour de toi · 60 % chacun (360 %)',
        10,
        18,
        3.6,
        'Tu tournoies 1,5 s, lames tendues : 6 frappes de 60 % sur tous les ennemis autour de toi. Tu peux te déplacer pendant la tempête. Active le combo pendant 4 s.'
      ],
      [
        '💨',
        'Charge héroïque',
        'Bond de 5 cases · 200 % sur la trajectoire · +20 Rage',
        10,
        0,
        2,
        'Tu charges vers la souris en traversant les ennemis : 200 % à tous ceux sur ton chemin, et tu gagnes 20 de Rage.'
      ],
      [
        '✖️',
        'Exécution croisée',
        'Cône · 500 % (600 % en combo) · ×1,5 sous 35 %',
        13,
        26,
        5,
        'Deux lames se croisent devant toi : 500 %, ou 600 % si le combo est actif (Rafale ou Tempête dans les 4 s). Contre une cible sous 35 % de ses PV, les dégâts sont multipliés par 1,5.'
      ]
    ]
  },
  // Invocateur (Relique) : ses quatre compétences sont des invocations ; leur puissance est celle d'un coup de la
  // créature (ou d'une seconde de zone).
  grimoire: {
    name: 'Grimoire',
    icon: '⟦w_grimoire⟧',
    role: 'Invocations : lève des morts-vivants qui empoisonnent tes ennemis.',
    bound: 'invocateur',
    sp: [
      [
        '💀',
        'Squelette putride',
        'Invocation · sans limite · 30 s · 60 % par coup',
        4,
        14,
        0.6,
        'Un squelette sort de terre près de toi et attaque tes ennemis pendant 30 s (60 % de ta Puissance magique toutes les 1,2 s). Aucune limite : chaque lancer lève un squelette de plus.'
      ],
      [
        '🐦‍⬛',
        'Nuée de corbeaux',
        '4 corbeaux nécrosés · 8 s · 45 % par coup de bec',
        10,
        20,
        0.45,
        '4 corbeaux nécrosés fondent sur la souris en volant par-dessus les obstacles, puis harcèlent tes ennemis pendant 8 s (45 % toutes les 0,6 s).'
      ],
      [
        '🪦',
        'Totem de peste',
        'Totem 10 s sous la souris · 50 %/s en zone · rats pestiférés',
        16,
        22,
        0.5,
        'Un totem d’os se dresse là où tu vises pendant 10 s : chaque seconde, il souffle la peste sur les ennemis à moins de 3 cases (50 %). Toutes les 2,5 s, un rat pestiféré sort de terre à ses pieds : il mord les ennemis (35 % toutes les 0,6 s) puis éclate au bout de 6 s en un nuage toxique (90 % autour de lui). Tes invocations proches du totem frappent 25 % plus vite.'
      ],
      [
        '🧟',
        'Abomination',
        'Invocation · 1 au maximum · 15 s · 160 % en zone',
        28,
        32,
        1.6,
        'Une abomination recousue se lève pendant 15 s : toutes les 1,6 s, elle écrase les ennemis autour d’elle (160 %, rayon 2 cases).'
      ]
    ]
  },
  // Berserker (Relique) : hache à deux mains ; ses coûts en mana sont payés en PV (voir class-talents.js).
  greataxe: {
    name: 'Grande hache',
    icon: '⟦w_greataxe⟧',
    role: 'Hache à deux mains : larges coups, bond écrasant et hurlement de rage, payés avec ton sang.',
    bound: 'berserker',
    sp: [
      [
        '🪓',
        'Fendoir',
        'Grand cône · 300 %',
        5,
        10,
        3,
        'Un coup de hache très large devant toi, qui fend le sol et touche tous les ennemis du cône.'
      ],
      [
        '🩸',
        'Bond du boucher',
        'Bond vers la souris · 240 % autour de toi · étourdit 1 s',
        11,
        14,
        2.4,
        'Tu bondis jusqu’à la souris (4 cases au plus) et t’écrases au sol : 240 % aux ennemis autour du point d’arrivée, et les monstres (pas les boss) sont étourdis 1 s.'
      ],
      [
        '💢',
        'Hurlement sanguinaire',
        'Rage 6 s : dégâts +25 % · affaiblit autour de toi',
        16,
        8,
        0,
        'Tu hurles : pendant 6 s, tes coups infligent 25 % de dégâts en plus, mais tu subis 15 % de dégâts en plus. Les ennemis à moins de 4 cases sont affaiblis pendant 4 s.'
      ],
      [
        '💀',
        'Châtiment du sang',
        'Cône · 450 %, ou 700 % sous 30 % de tes PV',
        14,
        24,
        4.5,
        'Un coup terrible devant toi. Si tes PV sont sous 30 % de leur maximum, il inflige 700 %.'
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
// Familles qui se trouvent sur les monstres et chez les marchands : aucune, chaque classe a son arme.
/** @type {readonly string[]} */
export const CRAFT_WEAPONS = Object.freeze([]);
// Armes magiques : leurs coups utilisent la Puissance magique.
export const MAGIC_WEAPONS = Object.freeze(['wildstaff', 'staff', 'lute', 'grimoire']);

// ---------------------------------------------------------------- Montée en qualité des armes de classe
// Essences lâchées par les boss (une par boss vaincu et par héros, plus au coffre final) : celles des donjons, des
// raids et du dernier raid en mode héroïque. Elles se gardent dans hero.essences et ne prennent pas de place.
export const WEAPON_ESSENCES = Object.freeze({
  shard: Object.freeze({
    name: 'Éclat des profondeurs',
    icon: '💎',
    color: '#58a8ff',
    source: 'Boss de donjon'
  }),
  seal: Object.freeze({
    name: 'Sceau des conquérants',
    icon: '🏆',
    color: '#bc80ff',
    source: 'Boss de raid'
  }),
  aurora: Object.freeze({
    name: 'Fragment d’Aurore',
    icon: '🌅',
    color: '#ff983d',
    source: 'Boss du Jugement de Célestia en héroïque'
  })
});
// Qualités de l'arme de classe (rang dans GEAR_RARITIES) : Commun au départ, Peu commun d'office au niveau 10 ;
// chaque marche suivante demande un niveau, des essences et de l'or.
export const CLASS_WEAPON_FREE = Object.freeze({ level: 10, tier: 1 });
/** @type {ReadonlyArray<Readonly<{ tier: number, level: number, essence: string, count: number, gold: number }>>} */
export const CLASS_WEAPON_UPGRADES = Object.freeze([
  Object.freeze({ tier: 2, level: 15, essence: 'shard', count: 8, gold: 400 }),
  Object.freeze({ tier: 3, level: 40, essence: 'seal', count: 10, gold: 1500 }),
  Object.freeze({ tier: 4, level: 58, essence: 'aurora', count: 10, gold: 4000 }),
  Object.freeze({ tier: 5, level: 60, essence: 'aurora', count: 25, gold: 10000 })
]);
// Essences gagnées par boss vaincu (chaque héros) et au coffre final, selon l'instance.
export const ESSENCE_DROPS = Object.freeze({
  dungeon: Object.freeze({ boss: { shard: 1 }, chest: { shard: 2 } }),
  raid: Object.freeze({ boss: { seal: 1 }, chest: { seal: 2 } }),
  raidHeroic: Object.freeze({ boss: { seal: 1, aurora: 1 }, chest: { seal: 2, aurora: 3 } })
});

// Emplacements actifs. L'ancienne arme de réserve (weapon2) n'existe plus : elle n'est lue que dans les anciennes
// sauvegardes (remboursée en or). Deux bagues : la seconde (ring2) porte un objet d'emplacement « ring » et compte comme la première.
export const ACTIVE_GEAR_SLOTS = Object.freeze([
  'helm',
  'shoulders',
  'armor',
  'gloves',
  'boots',
  'neck',
  'ring',
  'ring2',
  'weapon'
]);
// Emplacement d'objet que reçoit chaque emplacement porté : l'arme de réserve prend une arme, la seconde bague une bague.
/** @type {Readonly<Record<string, string>>} */
export const SECOND_SLOT_OF = Object.freeze({ weapon2: 'weapon', ring2: 'ring' });
/** @param {string} slot emplacement porté @returns {string} emplacement des objets qu'il reçoit */
export const itemSlotOf = slot => SECOND_SLOT_OF[slot] || slot;
// Bijoux : icône affichée à la place de celle d'une arme.
export const JEWEL_SLOTS = Object.freeze(['neck', 'ring']);
/** @type {Readonly<Record<string, string>>} */
export const JEWEL_ICON = Object.freeze({
  neck: '⟦slot_neck⟧',
  ring: '⟦slot_ring⟧'
});
// Chances de chaque qualité au tirage libre, en pourcentage, de Commun à Mythique. Légendaire et Mythique ne se
// tirent jamais au hasard : ils ne viennent que du dernier raid (mode héroïque) et du dernier boss de l'Arène.
export const RARITY_WEIGHTS = Object.freeze([45, 32, 20, 3, 0, 0]);
// Anciennes qualités supprimées (sauvegardes) : Héroïque devient Épique, Céleste devient Mythique.
/** @type {Readonly<Record<string, string>>} */
export const LEGACY_RARITY = Object.freeze({ Héroïque: 'Épique', Céleste: 'Mythique' });
// Butin de prestige : chance, par objet du coffre, d'une qualité supérieure (dernier raid en héroïque, Arène).
// Un seul tirage par objet : les chances s'additionnent, de la plus rare à la plus courante.
/** @type {Readonly<Record<string, ReadonlyArray<readonly [string, number]>>>} */
export const PRESTIGE_DROPS = Object.freeze({
  raidHeroic: [
    ['Mythique', 0.11],
    ['Légendaire', 0.21]
  ],
  arenaFinal: [['Légendaire', 0.21]],
  // Donjons des Tréfonds : Peu commun, ou Rare à 31 %.
  underground: [['Rare', 0.31]]
});
