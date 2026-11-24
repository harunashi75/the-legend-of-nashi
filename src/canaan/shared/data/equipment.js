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
// puissance : coefficient de base utilisé pour l'estimation de l'info-bulle (0 = pas de dégâts).
// L'estimation précise si le coefficient vaut par coup, pour la cible principale ou pour une série de coups.
// Les attaques de base font 75 % (clic gauche) et 160 % (clic droit).
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
        'Dégâts de nature en ligne · ralentissement',
        4,
        10,
        2.4,
        'Frappe les ennemis sur une ligne de 6 cases dans la direction visée. Inflige à chacun des dégâts de nature égaux à 240 % de ta Puissance magique et le ralentit de 40 % pendant 2 s.'
      ],
      [
        '🌸',
        'Floraison',
        'Zone de soin · 3 % des PV max par seconde',
        14,
        18,
        0,
        'Fais éclore une fleur au point visé pendant 8 s. Chaque seconde, les membres du groupe à moins de 3 cases de la fleur récupèrent 3 % de leurs PV max.'
      ],
      [
        '🍄',
        'Spores toxiques',
        'Nuage de nature · dégâts sur 5 s · ralentissement',
        10,
        18,
        3.5,
        'Crée un nuage de 2,5 cases de rayon au point visé pendant 5 s. Chaque seconde, les ennemis dans le nuage subissent des dégâts de nature égaux à 70 % de ta Puissance magique et sont ralentis de 20 %.'
      ],
      [
        '🌳',
        'Courroux de la forêt',
        '3 vagues de dégâts de nature · immobilisation',
        14,
        26,
        5.1,
        'Trois vagues de racines jaillissent de plus en plus loin dans la direction visée. Chaque vague inflige des dégâts de nature égaux à 170 % de ta Puissance magique. Les monstres touchés sont immobilisés 1,5 s. Les boss sont ralentis de 40 % à la place.'
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
        '2 griffures · saignement sur 5 s',
        4,
        10,
        2.4,
        'Griffe deux fois en cône dans la direction visée. Chaque griffure inflige des dégâts égaux à 120 % de ta Puissance. La seconde fait saigner la cible et lui inflige 30 % de ta Puissance en dégâts par seconde pendant 5 s.'
      ],
      [
        '🐆',
        'Bond du prédateur',
        'Bond de 5 cases au plus · dégâts à l’arrivée',
        9,
        14,
        2.2,
        'Bondis jusqu’à 5 cases vers le point visé. À l’arrivée, tu infliges l’équivalent de 220 % de ta Puissance en dégâts aux ennemis à moins de 1,8 case. Les monstres touchés sont étourdis 1 s. Les boss infligent 5 % de dégâts en moins pendant 4 s à la place.'
      ],
      [
        '🌀',
        'Rugissement sauvage',
        'Soin personnel · renforce les attaques de base',
        16,
        14,
        0,
        'Récupère 8 % de tes PV max en soin de base. Pendant 6 s, tes attaques de base infligent 15 % de dégâts en plus et leur délai est réduit de 30 %.'
      ],
      [
        '🩸',
        'Morsure féroce',
        'Dégâts en cône · plus forte sur une cible qui saigne',
        12,
        22,
        4.5,
        'Mords les ennemis en cône dans la direction visée. La morsure leur inflige des dégâts égaux à 450 % de ta Puissance, ou 650 % si la cible saigne.'
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
        'Dégâts sacrés en cône · soin personnel',
        5,
        12,
        2.8,
        'Frappe les ennemis en cône dans la direction visée et inflige des dégâts sacrés égaux à 280 % de ta Puissance à chacun. Tu récupères 3 % de tes PV max.'
      ],
      [
        '🛡️',
        'Charge du bouclier',
        'Ruée de 5 cases · dégâts sacrés · étourdissement',
        10,
        16,
        2.2,
        'Charge jusqu’à 5 cases dans la direction visée. Les ennemis sur ta trajectoire subissent des dégâts sacrés égaux à 220 % de ta Puissance. Les monstres touchés sont étourdis 1,2 s. Les boss infligent 5 % de dégâts en moins pendant 4 s à la place.'
      ],
      [
        '🏰',
        'Rempart sacré',
        'Réduit les dégâts reçus · bouclier de groupe',
        20,
        20,
        0,
        'Tu subis 35 % de dégâts en moins pendant 6 s. Toi et tes alliés à moins de 6 cases gagnez chacun un bouclier qui absorbe l’équivalent de 12 % de vos PV max pendant 6 s.'
      ],
      [
        '⚖️',
        'Marteau du Jugement',
        'Impact sacré · sol qui blesse et soigne',
        15,
        26,
        5,
        'Un marteau frappe au point visé. Il inflige des dégâts sacrés égaux à 500 % de ta Puissance aux ennemis à moins de 2,5 cases. Pendant 5 s, le sol inflige 50 % de ta Puissance en dégâts sacrés par seconde aux ennemis et rend aux alliés dans la zone 3 % de leurs PV max par seconde.'
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
        '2 coups de dague · saignement sur 5 s',
        5,
        11,
        2.4,
        'Entaille deux fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 120 % de ta Puissance. Le second fait saigner la cible et lui inflige 35 % de ta Puissance en dégâts par seconde pendant 5 s.'
      ],
      [
        '🌑',
        'Pas de l’ombre',
        'Téléportation · prochain coup critique et renforcé',
        10,
        12,
        0,
        'Téléporte-toi derrière l’ennemi le plus proche du point visé parmi ceux à 6 cases ou moins de toi. Si tu ne peux pas te téléporter, fais une ruée de 5 cases dans la direction visée. Ton prochain coup dans les 4 s est critique et inflige 60 % de dégâts en plus.'
      ],
      [
        '🗡️',
        'Éventail de lames',
        '5 dagues en éventail · saignement sur 4 s',
        8,
        14,
        0.9,
        'Lance 5 dagues en éventail dans la direction visée. Chaque dague inflige des dégâts égaux à 90 % de ta Puissance au premier ennemi touché et lui inflige un saignement de 20 % de ta Puissance par seconde pendant 4 s.'
      ],
      [
        '💀',
        'Mille coupures',
        '5 coups en cône · consume les saignements d’arme',
        13,
        24,
        4.25,
        'Frappe 5 fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 85 % de ta Puissance. Un saignement d’arme sur une cible touchée est consumé et inflige aussitôt 150 % des dégâts qu’il lui restait à infliger.'
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
        'Projectile de feu · explosion à l’impact',
        3,
        10,
        2.6,
        'Lance une boule de feu dans la direction visée. Elle inflige des dégâts de feu égaux à 260 % de ta Puissance magique au premier ennemi touché et à 130 % aux autres ennemis à moins de 1,5 case de l’impact.'
      ],
      [
        '❄️',
        'Nova de givre',
        'Dégâts de glace autour de toi · gel',
        10,
        18,
        1.9,
        'Inflige des dégâts de glace égaux à 190 % de ta Puissance magique aux ennemis à moins de 3 cases de toi. Les monstres sont gelés 1,5 s. Les boss sont ralentis de 40 % à la place.'
      ],
      [
        '⚡',
        'Chaîne d’éclairs',
        'Dégâts de foudre · jusqu’à 4 rebonds',
        7,
        16,
        2.6,
        'Frappe l’ennemi le plus proche du point visé parmi ceux à 9 cases ou moins de toi. Le premier éclair inflige des dégâts de foudre égaux à 260 % de ta Puissance magique. Il peut rebondir sur 4 autres ennemis et perd 15 % de ses dégâts à chaque rebond.'
      ],
      [
        '☄️',
        'Météore',
        'Impact de feu · sol brûlant sur 4 s',
        16,
        28,
        6,
        'Après 0,8 s, un météore frappe au point visé. Il inflige des dégâts de feu égaux à 600 % de ta Puissance magique aux ennemis à moins de 2,5 cases. Le sol brûle ensuite pendant 4 s et inflige 40 % de ta Puissance magique en dégâts de feu par seconde aux ennemis dans la zone brûlante.'
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
        'Projectile d’harmonie · soin d’un allié',
        4,
        10,
        2.4,
        'Lance une note dans la direction visée. Elle inflige des dégâts d’harmonie égaux à 240 % de ta Puissance magique au premier ennemi touché. Au lancement, le membre du groupe le plus blessé dans un rayon de 8 cases récupère 4 % de ses PV max. Tu peux recevoir ce soin.'
      ],
      [
        '💢',
        'Accord dissonant',
        'Dégâts d’harmonie autour de toi · repoussement',
        8,
        16,
        1.9,
        'Inflige aux ennemis proches des dégâts d’harmonie égaux à 190 % de ta Puissance magique et repousse les monstres. Les boss subissent les dégâts mais restent en place.'
      ],
      [
        '💗',
        'Chant de guérison',
        'Soin de groupe immédiat puis sur 5 s',
        14,
        20,
        0,
        'Toi et tes alliés à moins de 6 cases récupérez 12 % de vos PV max immédiatement, puis 2 % de vos PV max à chaque pulsation du chant pendant 5 s.'
      ],
      [
        '🎶',
        'Symphonie',
        '5 ondes · dégâts et soins de zone',
        15,
        26,
        5,
        'Fais résonner 5 ondes autour du point visé dans un rayon de 3 cases. Chaque onde inflige des dégâts d’harmonie égaux à 100 % de ta Puissance magique à chaque ennemi dans la zone et rend à chaque allié dans la zone 2 % de ses PV max.'
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
        'Flèche qui traverse les ennemis · portée de 14 cases',
        4,
        10,
        3,
        'Décoche une flèche dans la direction visée jusqu’à 14 cases. Elle traverse les ennemis et inflige à chacun des dégâts égaux à 300 % de ta Puissance.'
      ],
      [
        '🎯',
        'Marque du chasseur',
        'Marque de 12 s · augmente les dégâts reçus par la cible',
        12,
        10,
        0,
        'Marque pendant 12 s l’ennemi le plus proche du point visé parmi ceux à 14 cases ou moins de toi. La cible subit 15 % de dégâts en plus de tout le groupe. Tes flèches lui infligent 20 % de dégâts supplémentaires.'
      ],
      [
        '🌧️',
        'Volée de flèches',
        '4 salves de dégâts de zone',
        11,
        20,
        3.6,
        'Tire 4 salves au point visé, espacées de 0,5 s. Chaque salve inflige des dégâts égaux à 90 % de ta Puissance à chaque ennemi dans la zone.'
      ],
      [
        '🦅',
        'Assaut du faucon',
        'Faucon spectral · 5 coups de serre',
        15,
        24,
        5,
        'Ton faucon attaque l’ennemi le plus proche du point visé parmi ceux à 14 cases ou moins de toi. Chaque coup de serre inflige des dégâts égaux à 100 % de ta Puissance. Si la cible tombe, le faucon cherche un autre ennemi à portée pour les coups restants.'
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
        '4 coups en cône · active le combo',
        5,
        12,
        3.2,
        'Frappe 4 fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 80 % de ta Puissance. Active pendant 4 s le combo qui renforce Exécution croisée.'
      ],
      [
        '🌪️',
        'Tempête d’acier',
        '6 frappes autour de toi · active le combo',
        10,
        18,
        3.6,
        'Tournoie 1,5 s et touche les ennemis proches 6 fois. Chaque frappe inflige des dégâts égaux à 60 % de ta Puissance. Tu peux te déplacer pendant la tempête. Active pendant 4 s le combo qui renforce Exécution croisée.'
      ],
      [
        '💨',
        'Charge héroïque',
        'Ruée de 5 cases · dégâts sur le trajet · +20 Rage',
        10,
        0,
        2,
        'Charge jusqu’à 5 cases dans la direction visée. Inflige des dégâts égaux à 200 % de ta Puissance à chaque ennemi sur ta trajectoire et te donne 20 points de Rage.'
      ],
      [
        '✖️',
        'Exécution croisée',
        'Dégâts en cône · renforcée par le combo',
        13,
        26,
        5,
        'Frappe les ennemis en cône dans la direction visée. Les dégâts valent 500 % de ta Puissance, ou 600 % si le combo de Rafale de lames ou de Tempête d’acier est actif. Les dégâts sont multipliés par 1,5 si la cible a moins de 35 % de ses PV max.'
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
        'Invocation de 30 s · dégâts de poison par coup',
        4,
        14,
        0.6,
        'Lève un squelette près de toi pendant 30 s. Il attaque toutes les 1,2 s et chaque coup inflige des dégâts de poison égaux à 60 % de ta Puissance magique. Chaque lancer ajoute un squelette sans limite de nombre.'
      ],
      [
        '🐦‍⬛',
        'Nuée de corbeaux',
        '4 invocations de 8 s · dégâts de poison par bec',
        10,
        20,
        0.45,
        'Envoie 4 corbeaux vers le point visé par-dessus les obstacles. Ils chassent pendant 8 s. Chaque corbeau attaque toutes les 0,6 s et inflige des dégâts de poison égaux à 45 % de ta Puissance magique par coup de bec.'
      ],
      [
        '🪦',
        'Totem de peste',
        'Totem de 10 s · poison de zone · invoque des rats',
        16,
        22,
        0.5,
        'Au point visé (portée 8 cases), pose un totem pour 10 s. Il inflige chaque seconde 50 % de ta Puissance magique en dégâts de poison aux ennemis à 3 cases. Toutes les 2,5 s, un rat apparaît. Ses dégâts de poison valent 35 % de ta Puissance magique par morsure (0,6 s) et 90 % à son explosion (après 6 s). Un seul totem, qui accélère les attaques des invocations proches de 25 %.'
      ],
      [
        '🧟',
        'Abomination',
        'Invocation de 15 s · dégâts de poison de zone',
        28,
        32,
        1.6,
        'Lève une abomination pendant 15 s. Toutes les 1,6 s, elle écrase les ennemis dans un rayon de 2 cases autour d’elle et leur inflige des dégâts de poison égaux à 160 % de ta Puissance magique. Tu peux avoir une seule abomination à la fois.'
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
        'Dégâts dans un large cône',
        5,
        10,
        3,
        'Frappe tous les ennemis dans un large cône dans la direction visée et inflige à chacun des dégâts égaux à 300 % de ta Puissance.'
      ],
      [
        '🩸',
        'Bond du boucher',
        'Bond d’environ 4 cases · dégâts à l’arrivée',
        11,
        14,
        2.4,
        'Bondis d’environ 4 cases au plus vers le point visé. À l’arrivée, tu infliges l’équivalent de 240 % de ta Puissance en dégâts aux ennemis proches. Les monstres touchés sont étourdis 1 s. Les boss infligent 5 % de dégâts en moins pendant 4 s à la place.'
      ],
      [
        '💢',
        'Hurlement sanguinaire',
        'Plus de dégâts infligés et reçus · affaiblit les ennemis',
        16,
        8,
        0,
        'Pendant 6 s, tes coups infligent 25 % de dégâts en plus et tu subis 15 % de dégâts en plus. Les ennemis à moins de 4 cases de toi infligent 5 % de dégâts en moins pendant 4 s.'
      ],
      [
        '💀',
        'Châtiment du sang',
        'Dégâts en cône · renforcé par Hurlement sanguinaire',
        14,
        24,
        4.5,
        'Frappe les ennemis en cône dans la direction visée. Les dégâts de base valent 450 % de ta Puissance, ou 600 % pendant Hurlement sanguinaire avant ses autres bonus de dégâts.'
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
