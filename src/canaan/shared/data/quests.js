// Histoire « Les Échos de l'Aurore » : six chapitres (un par zone), 30 quêtes (12 principales, 18 secondaires).
// Chaque quête : PNJ, lieu (site), objectifs (chacun avec sa mécanique), dialogues évolutifs et récompense.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

export const STORY_TITLE = 'Les Échos de l’Aurore';
export const STORY_INTRO =
  'Autrefois, six sanctuaires reliés au Cœur de l’Aurore protégeaient l’île. Un jour, les anciens ont dispersé son énergie pour la sauver. Des siècles plus tard, une petite lumière tombe près du Camp de l’Aurore…';
export const CHAPTERS = deepFreeze([
  { n: 'I', title: 'La Première Étincelle', zone: 0, levels: [1, 10] },
  { n: 'II', title: 'La Forêt qui chante', zone: 1, levels: [10, 20] },
  { n: 'III', title: 'Les Lanternes du Marais', zone: 2, levels: [20, 30] },
  { n: 'IV', title: 'Les Couleurs du Passé', zone: 3, levels: [30, 40] },
  { n: 'V', title: 'La Cité des Étoiles', zone: 4, levels: [40, 50] },
  { n: 'VI', title: 'Le Réveil de l’Aurore', zone: 5, levels: [50, 60] }
]);
// Les six sanctuaires de la carte d'Orven ; ils se rallument au fil de l'histoire (étoiles retrouvées).
export const SANCTUARIES = deepFreeze([
  {
    id: 'murmures',
    name: 'Sanctuaire des Murmures',
    zone: 1,
    quest: 6,
    star: 'star1',
    lore: 'Sur l’autel, des mots gravés en spirale : « Ici dormait la première étoile, celle qui écoute. Quand la forêt chantera de nouveau, elle reviendra vers le Cœur. »'
  },
  {
    id: 'reflets',
    name: 'Sanctuaire des Reflets',
    zone: 2,
    quest: 11,
    star: 'star2',
    lore: 'Un bassin immobile reflète un ciel qui n’existe plus. Une inscription : « La deuxième étoile se souvient de tout. Le reflet ne ment qu’à ceux qui ne regardent pas. »'
  },
  {
    id: 'saisons',
    name: 'Bibliothèque des Saisons',
    zone: 3,
    quest: 16,
    star: 'star3',
    lore: 'Des étagères de pierre couvertes de feuilles dorées qui ne tombent jamais. Sur le pupitre : « La troisième étoile garde le temps. Elle se souvient de chaque automne. »'
  },
  {
    id: 'etoiles',
    name: 'Cité des Étoiles',
    zone: 4,
    quest: 21,
    star: 'star4',
    lore: 'Sous les sables, une salle voûtée constellée de cristaux. Une carte du ciel gravée au plafond : « La quatrième étoile guidait les voyageurs du désert. »'
  },
  {
    id: 'lumieres',
    name: 'Sanctuaire des Six Lumières',
    zone: 5,
    quest: 26,
    star: 'star5',
    lore: 'Six alcôves en cercle autour d’un autel de cristal. « Quand les six lumières se tiendront ensemble, la Chambre de l’Aurore s’ouvrira. »'
  },
  {
    id: 'aurore',
    name: 'Chambre de l’Aurore',
    zone: 5,
    quest: 27,
    star: 'star6',
    lore: 'Le Cœur de l’Aurore bat doucement au centre de la chambre, entouré de six étoiles. Sa lumière se répand sur toute l’île.'
  }
]);
// Lieux des quêtes : zone, position (angle et rayon autour du centre de l'île, ou près d'un lieu connu) et rayon dégagé.
export const QUEST_SITES = deepFreeze({
  q1: { zone: 0, camp: [15, 8], r: 4 },
  q2: { zone: 0, place: 'Ruines de la Couronne', offset: [0, 5], r: 5 },
  q3: { zone: 0, polar: [176, 141], r: 6 },
  q4: { zone: 0, polar: [154, 103], r: 6 },
  q5: { zone: 0, polar: [190, 122], r: 5 },
  q6: { zone: 1, polar: [214, 118], r: 6 },
  q7: { zone: 1, polar: [241, 104], r: 6 },
  q8: { zone: 1, polar: [207, 142], r: 9 },
  q9: { zone: 1, polar: [233, 137], r: 7 },
  q10: { zone: 1, polar: [224, 93], r: 5 },
  q11: { zone: 2, polar: [272, 121], r: 6 },
  q12: { zone: 2, polar: [293, 110], r: 5 },
  q13: { zone: 2, polar: [261, 141], r: 6 },
  q14: { zone: 2, polar: [309, 126], r: 6 },
  q15: { zone: 2, polar: [281, 94], r: 6 },
  q16: { zone: 3, polar: [350, 118], r: 7 },
  q17: { zone: 3, polar: [326, 112], r: 6 },
  q18: { zone: 3, polar: [362, 128], r: 6 },
  q19: { zone: 3, polar: [340, 96], r: 5 },
  q20: { zone: 3, polar: [318, 140], r: 6 },
  q21: { zone: 4, polar: [40, 112], r: 7 },
  q22: { zone: 4, polar: [70, 98], r: 5 },
  q23: { zone: 4, polar: [30, 100], r: 6 },
  q24: { zone: 4, polar: [60, 150], r: 6 },
  q25: { zone: 4, polar: [36, 152], r: 6 },
  q26: { zone: 5, polar: [105, 100], r: 6 },
  q27: { zone: 5, polar: [112, 122], r: 7 },
  q28: { zone: 5, polar: [88, 112], r: 7 },
  q29: { zone: 5, polar: [124, 136], r: 6 },
  q30: { zone: 5, polar: [96, 86], r: 6 }
});
// PNJ des quêtes : nom, lieu, position par rapport au lieu (en cases), apparence (looks.js) et répliques libres.
export const QUEST_NPCS = deepFreeze({
  liora: { name: 'Liora', site: 'q1', camp: [2, 3], look: { sex: 'f', race: 'elfe', hair: '#f0e0a0', outfit: 'or' } },
  orven: { name: 'Orven', site: 'q2', at: [-3, 0], look: { sex: 'm', race: 'humain', hair: '#e8e8e0', outfit: 'nuit' }, tool: 'staff' },
  milo: { name: 'Milo', site: 'q3', at: [-5, 3], look: { sex: 'm', race: 'humain', hair: '#c88a3a', outfit: 'cuir' }, tool: 'staff' },
  bastian: { name: 'Bastian', site: 'q4', at: [-4, -3], look: { sex: 'm', race: 'orc', hair: '#3a2a20', outfit: 'cuir' } },
  eloi: { name: 'Éloi', site: 'q5', at: [-4, 1], look: { sex: 'm', race: 'humain', hair: '#d8d8d0', outfit: 'foret' }, tool: 'rod' },
  sylva: { name: 'Sylva', site: 'q6', at: [-4, 2], look: { sex: 'f', race: 'elfe', hair: '#6aa04a', outfit: 'foret' }, tool: 'staff' },
  aelor: { name: 'Aelor', site: 'q7', at: [-5, 3], look: { sex: 'm', race: 'elfe', hair: '#c8b070', outfit: 'or' }, tool: 'staff' },
  nima: { name: 'Nima', site: 'q8', at: [0, 9], look: { sex: 'f', race: 'humain', hair: '#2a2030', outfit: 'nuit' } },
  brin: { name: 'Brin', site: 'q9', at: [-5, 4], look: { sex: 'm', race: 'minotaure', outfit: 'cuir' } },
  theon: { name: 'Théon', site: 'q10', at: [-3, 3], look: { sex: 'm', race: 'humain', hair: '#7d5140', outfit: 'rose' } },
  maeline: { name: 'Maëline', site: 'q11', at: [-4, 3], look: { sex: 'f', race: 'humain', hair: '#a84a3a', outfit: 'glace' }, tool: 'staff' },
  neris: { name: 'Néris', site: 'q12', at: [0, 4], look: { sex: 'f', race: 'elfe', hair: '#c8d8f0', outfit: 'glace' } },
  goran: { name: 'Goran', site: 'q13', at: [-4, 3], look: { sex: 'm', race: 'orc', hair: '#5a4030', outfit: 'cuir' } },
  esprit: { name: 'Esprit amical', site: 'q14', at: [0, -3], ghost: true, look: { sex: 'm', race: 'humain', hair: '#c8e8f0', outfit: 'glace' } },
  pipo: { name: 'Pipo', site: 'q15', at: [-5, 3], look: { sex: 'm', race: 'humain', hair: '#f0c040', outfit: 'foret' }, child: true },
  erable: { name: 'Érable', site: 'q16', at: [0, 6], look: { sex: 'f', race: 'humain', hair: '#c8642a', outfit: 'rose' }, tool: 'staff' },
  solenne: { name: 'Solenne', site: 'q17', at: [-4, 3], look: { sex: 'f', race: 'elfe', hair: '#e8b860', outfit: 'or' } },
  flavio: { name: 'Flavio', site: 'q18', at: [-5, 3], look: { sex: 'm', race: 'humain', hair: '#5a3020', outfit: 'cuir' }, child: true },
  odel: { name: 'Odel', site: 'q19', at: [-4, 3], look: { sex: 'm', race: 'minotaure', outfit: 'cuir' } },
  voyageurs: { name: 'Trois voyageurs', site: 'q20', at: [-4, 4], look: { sex: 'm', race: 'orc', hair: '#3a2a20', outfit: 'foret' }, tool: 'spear' },
  sahir: { name: 'Sahir', site: 'q21', at: [-2, 5], look: { sex: 'm', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' }, tool: 'staff' },
  asteria: { name: 'Astéria', site: 'q22', at: [-4, 3], look: { sex: 'f', race: 'elfe', hair: '#d8e8ff', outfit: 'nuit' }, tool: 'staff' },
  zafir: { name: 'Zafir', site: 'q23', at: [-5, 3], look: { sex: 'm', race: 'humain', skin: '#c08a5a', hair: '#2a2020', outfit: 'rose' } },
  noura: { name: 'Noura', site: 'q24', at: [-5, 3], look: { sex: 'f', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' } },
  amira: { name: 'Amira', site: 'q25', at: [-5, 3], look: { sex: 'f', race: 'humain', skin: '#c08a5a', hair: '#3a2420', outfit: 'foret' }, tool: 'basket' },
  lumi: { name: 'Lumi', site: 'q26', at: [0, 4], spirit: true, look: { sex: 'f', race: 'elfe' } },
  auralis: { name: 'Auralis', site: 'q27', at: [0, 5], ghost: true, look: { sex: 'm', race: 'elfe', hair: '#fff0c0', outfit: 'or' }, tool: 'staff' },
  lyss: { name: 'Lyss', site: 'q28', at: [-6, 3], look: { sex: 'f', race: 'elfe', hair: '#b080f0', outfit: 'nuit' } },
  pyria: { name: 'Pyria', site: 'q29', at: [-4, 3], look: { sex: 'f', race: 'humain', hair: '#e05a2a', outfit: 'cuir' } },
  elya: { name: 'Élya', site: 'q30', at: [-5, 3], look: { sex: 'f', race: 'elfe', hair: '#c8e0ff', outfit: 'glace' } }
});
// Objectifs : k = mécanique (trail : suivre des traces ; puzzle : énigme partagée du lieu ; collect : objets cachés ;
// spot : point précis puis E ; timing : E au bon moment ; reach : atteindre un point ; clues : indices à réunir ;
// choice : réponse à donner). Les énigmes « puzzle » se résolvent à plusieurs ; chacun garde sa progression.
export const QUESTS = deepFreeze([
  {
    id: 1,
    chapter: 0,
    main: true,
    title: 'La lumière tombée du ciel',
    npc: 'liora',
    site: 'q1',
    level: 2,
    summary: 'Cette nuit, une lumière est tombée près du Camp de l’Aurore. Liora l’a vue filer derrière les collines.',
    steps: [
      { k: 'trail', text: 'Suivre les traces lumineuses depuis le camp' },
      { k: 'puzzle', text: 'Résoudre l’énigme des quatre pierres' }
    ],
    reward: { gold: 60, flags: ['lumi'], text: 'Lumi devient ta compagne de voyage' },
    talk: {
      offer: [
        'Tu l’as vue, toi aussi ? Une étoile est tombée cette nuit, juste derrière le camp !',
        'Elle a laissé des traces qui brillent dans l’herbe. Je n’ose pas les suivre seule… Tu veux bien aller voir ?'
      ],
      active: 'Les traces partent vers l’est du camp. Elles brillent encore, dépêche-toi !',
      ready: 'Oh ! Elle… elle te suit ? C’est une petite créature de lumière ! Elle s’appelle Lumi ? Quel joli nom.',
      after: 'Lumi brille un peu plus chaque jour. Orven, aux Ruines de la Couronne, voudra sûrement la voir.'
    },
    hint: 'Gravé sur la stèle : « Le soleil se lève, la pluie le suit ; le vent chasse les nuages, et la lune ferme la nuit. »'
  },
  {
    id: 2,
    chapter: 0,
    main: true,
    title: 'La carte aux six étoiles',
    npc: 'orven',
    site: 'q2',
    requires: 1,
    level: 5,
    summary: 'Orven, le vieil érudit des ruines, possède une carte usée où brillent six étoiles. Elle réagit à la présence de Lumi.',
    steps: [
      { k: 'collect', n: 3, text: 'Retrouver les trois symboles cachés dans les ruines' },
      { k: 'puzzle', text: 'Reconstituer la disposition des symboles sur les socles' }
    ],
    reward: { gold: 90, flags: ['starmap'], text: 'Carte des sanctuaires dans le journal' },
    talk: {
      offer: [
        'Par ma barbe… cette lueur ! Elle a fait briller ma vieille carte. Regarde : six étoiles, six sanctuaires.',
        'Trois symboles sont cachés dans ces ruines. Retrouve-les, puis pose-les sur les socles comme sur la carte : l’étoile au nord, la lune à l’ouest, la flamme à l’est.'
      ],
      active: 'L’étoile au nord, la lune à l’ouest, la flamme à l’est. Les symboles brillent quand on s’en approche.',
      ready: 'La carte s’éclaire ! Six sanctuaires… le premier dort dans la Forêt ancienne. Garde-la, elle sera mieux dans ton journal.',
      after: 'Le Cœur de l’Aurore… on n’en parlait que dans les berceuses. Va voir Sylva, dans la Forêt ancienne.'
    }
  },
  {
    id: 3,
    chapter: 0,
    main: false,
    title: 'Le mouton aux grandes ambitions',
    npc: 'milo',
    site: 'q3',
    level: 4,
    summary: 'Pompon, le mouton de Milo, rêve de voir le monde du haut de la colline. Mais les barrières l’envoient toujours ailleurs.',
    steps: [{ k: 'puzzle', text: 'Ouvrir et fermer les barrières pour guider Pompon jusqu’au sommet' }],
    reward: { gold: 70, deco: 'mouton', text: 'Décoration « Petit mouton »' },
    talk: {
      offer: [
        'Pompon veut monter au sommet de la colline. Il en rêve, je te jure ! Mais il suit toujours le chemin ouvert…',
        'Ouvre et ferme les barrières (E), puis siffle-le avec le sifflet près de l’enclos. À toi de jouer, berger !'
      ],
      active: 'Pompon va toujours tout droit tant qu’on ne lui ferme pas le chemin. Têtu comme un mouton.',
      ready: 'IL EST EN HAUT ! Regarde-le, il est si fier ! Tiens, ma sœur a sculpté ce petit mouton : il est pour toi.',
      after: 'Depuis, Pompon regarde le coucher de soleil tous les soirs. Il a l’air d’un philosophe.'
    }
  },
  {
    id: 4,
    chapter: 0,
    main: false,
    title: 'Le trésor qui n’existe pas',
    npc: 'bastian',
    site: 'q4',
    level: 6,
    summary: 'Bastian jure qu’un trésor est enterré « là où les ombres de trois arbres se rejoignent ». Tout le camp se moque de lui.',
    steps: [
      { k: 'spot', at: [2, 1], text: 'Trouver où se croisent les ombres des trois arbres et creuser (E)' }
    ],
    reward: { gold: 40, item: 'Rare', text: 'Le coffre secret (équipement Rare de ton niveau)' },
    talk: {
      offer: [
        'Ils disent que mon trésor n’existe pas. Pfff. La vieille chanson dit : « Là où trois ombres se tiennent la main, dort le coffre du marin. »',
        'Les trois vieux chênes sont là. Suis leurs ombres, et creuse où elles se croisent !'
      ],
      active: 'Regarde bien les ombres des chênes : elles pointent toutes vers le même endroit.',
      ready: 'UN COFFRE ! Je le savais ! Garde ce qu’il contient, moi je veux juste voir leur tête au camp.',
      after: 'Ils ne rient plus du tout, au camp. Je cherche déjà la suite de la chanson…'
    }
  },
  {
    id: 5,
    chapter: 0,
    main: false,
    title: 'Le poisson du vieux pêcheur',
    npc: 'eloi',
    site: 'q5',
    level: 7,
    summary: 'Depuis quarante ans, Éloi poursuit un poisson doré qui ne se montre qu’à ceux qui savent lire l’eau.',
    steps: [{ k: 'timing', text: 'Observer les ondulations de l’étang et pêcher le poisson doré (E au bon remous)' }],
    reward: { gold: 50, fishXp: 120, recipe: 'dore', goldenFish: 2, text: 'Expérience de pêche, recette « Poisson doré en croûte de sel »' },
    talk: {
      offer: [
        'Tu vois ces remous ? Quatre sont des carpes. Le cinquième… c’est lui. Le poisson doré.',
        'Quand une onde brille d’or, il est dessous. Approche-toi de ce remous et ferre (E) pendant qu’il brille !'
      ],
      active: 'Patience. Regarde les remous jusqu’à ce que l’un d’eux se mette à briller d’or.',
      ready: 'Quarante ans… et tu l’as eu du premier coup. Tiens, la recette de ma grand-mère. Elle disait qu’il porte bonheur.',
      after: 'Je reviens chaque matin, juste pour regarder l’étang. Il est plus beau maintenant que je sais.'
    }
  },
  {
    id: 6,
    chapter: 1,
    main: true,
    title: 'La mélodie des anciens',
    npc: 'sylva',
    site: 'q6',
    requires: 2,
    level: 12,
    summary: 'Sylva, la gardienne des chants, entend la forêt fredonner depuis l’arrivée de Lumi. Un passage secret attend une mélodie.',
    steps: [
      { k: 'collect', n: 4, text: 'Retrouver les quatre pierres musicales dans la forêt' },
      { k: 'puzzle', text: 'Jouer la mélodie des anciens sur le cercle de pierres' }
    ],
    reward: { gold: 120, flags: ['sanct_murmures'], text: 'Accès au Sanctuaire des Murmures' },
    talk: {
      offer: [
        'La forêt chante, ce matin. Elle ne l’avait pas fait depuis des siècles. C’est ta petite lumière qui la réveille.',
        'Quatre pierres musicales sont perdues dans les sous-bois. Rapporte leur son au cercle, puis joue la mélodie : la plus grave, la plus aiguë, puis les deux du milieu, de la plus grave à la plus aiguë.'
      ],
      active: 'Grave, aiguë, puis les deux du milieu de la plus grave à la plus aiguë. Écoute bien chaque pierre.',
      ready: 'Le passage s’ouvre… Le Sanctuaire des Murmures ! Personne n’y est entré depuis l’époque des anciens.',
      after: 'Les arbres murmurent un nom : Aelor. Il veille sur le vieil arbre aux racines d’or.'
    }
  },
  {
    id: 7,
    chapter: 1,
    main: true,
    title: 'Le gardien aux racines d’or',
    npc: 'aelor',
    site: 'q7',
    requires: 6,
    level: 16,
    summary: 'L’arbre gardien de la forêt dort depuis des siècles. Aelor pense qu’un rayon de soleil pourrait le réveiller.',
    steps: [
      { k: 'puzzle', text: 'Orienter les miroirs pour diriger la lumière du soleil vers l’arbre gardien' },
      { k: 'reach', at: [2, -1], text: 'Écouter l’arbre gardien' }
    ],
    reward: { gold: 160, flags: ['blessing', 'star1'], text: 'Bénédiction des racines d’or (cosmétique) et première étoile' },
    talk: {
      offer: [
        'L’arbre gardien dort. Ses racines d’or brillaient jadis comme le soleil… Il lui faut la lumière.',
        'Les anciens ont laissé trois miroirs. Tourne-les (E) pour conduire le rayon de la pierre solaire jusqu’à l’arbre.'
      ],
      active: 'Chaque miroir renvoie la lumière d’un quart de tour. Suis le rayon des yeux.',
      ready: 'Il t’a parlé… Le Cœur de l’Aurore. Et cette étoile qui flotte près de Lumi : la première des six. Que la forêt te bénisse.',
      after: 'L’arbre gardien chante doucement chaque nuit. Va vers le marais : Maëline cherche de l’aide pour ses lanternes.'
    },
    memory: 'L’arbre gardien : « Petite étincelle, te voilà revenue. Le Cœur de l’Aurore attend. Six étoiles, six sanctuaires… Rassemble-les. »'
  },
  {
    id: 8,
    chapter: 1,
    main: false,
    title: 'Le chemin des lucioles',
    npc: 'nima',
    site: 'q8',
    level: 13,
    summary: 'Les panneaux du bosquet mentent, dit Nima. Seules les lucioles connaissent le vrai chemin.',
    steps: [{ k: 'reach', at: [0, -8], text: 'Traverser le labyrinthe en suivant les lucioles (pas les panneaux)' }],
    reward: { gold: 90, flags: ['shortcut'], text: 'Raccourci forestier : une pierre de passage vers le Camp de l’Aurore' },
    talk: {
      offer: [
        'Ce bosquet est un labyrinthe. Les panneaux ? Une farce des fées : ils mentent tous.',
        'Suis les lucioles. Elles connaissent le chemin vers la vieille pierre de passage, de l’autre côté.'
      ],
      active: 'Ne lis pas les panneaux. Regarde les lucioles.',
      ready: 'Tu as réveillé la pierre de passage ! Elle te ramènera au camp, et du camp jusqu’ici (E).',
      after: 'Les fées sont vexées : leur farce ne marche plus. Tant mieux.'
    }
  },
  {
    id: 9,
    chapter: 1,
    main: false,
    title: 'Le voleur invisible',
    npc: 'brin',
    site: 'q9',
    level: 15,
    summary: 'Chaque nuit, les provisions de Brin disparaissent. Pas de trace de pas… ou presque.',
    steps: [
      { k: 'trail', text: 'Suivre les petites empreintes (elles n’apparaissent que de près)' },
      { k: 'spot', at: [5, -4], text: 'Démasquer le voleur camouflé (E)' }
    ],
    reward: { gold: 110, deco: 'figurine', text: 'Or et figurine « Le petit voleur »' },
    talk: {
      offer: [
        'On me vole mes provisions ! Des pommes, du fromage, même mes biscuits au miel.',
        'Je ne vois jamais personne. Mais il y a de toutes petites empreintes… Tu veux bien enquêter ?'
      ],
      active: 'Les empreintes partent de mon sac. Regarde par terre, de près.',
      ready: 'Un… caméléon-renard ? Il avait juste faim ? Bon. Je lui laisserai un biscuit. Prends cette figurine, il a posé pour le sculpteur !',
      after: 'Le petit voleur vient manger dans ma main maintenant. On est amis.'
    }
  },
  {
    id: 10,
    chapter: 1,
    main: false,
    title: 'Le peintre des ombres',
    npc: 'theon',
    site: 'q10',
    level: 17,
    summary: 'Théon veut peindre l’ombre d’un arbre qui prend la forme d’un oiseau, mais il ne retrouve plus l’endroit d’où il l’avait vue.',
    steps: [{ k: 'spot', at: [-1, -3], text: 'Trouver le point d’observation où l’ombre de l’arbre devient un oiseau (E)' }],
    reward: { gold: 90, deco: 'tableau', text: 'Tableau décoratif « L’oiseau d’ombre »' },
    talk: {
      offer: [
        'Un jour, d’un endroit précis, l’ombre de ce vieil arbre est devenue un oiseau. Un oiseau parfait !',
        'Je me souviens seulement : « au nord de l’arbre, un pas à l’ouest ». Trouve l’endroit et appelle-moi (E).'
      ],
      active: 'Au nord de l’arbre, un pas à l’ouest… L’ombre change quand on se déplace.',
      ready: 'Le voilà ! Mon oiseau d’ombre ! Je l’ai peint deux fois : un tableau pour moi, un pour toi.',
      after: 'Je peins maintenant toutes les ombres de la forêt. Elles ont toutes une histoire.'
    }
  },
  {
    id: 11,
    chapter: 2,
    main: true,
    title: 'Les lanternes perdues',
    npc: 'maeline',
    site: 'q11',
    requires: 7,
    level: 22,
    summary: 'Le réseau de lanternes qui guidait les voyageurs dans le marais s’est éteint. Maëline n’a plus que des vannes rouillées.',
    steps: [{ k: 'puzzle', text: 'Manipuler les vannes pour rallumer les quatre lanternes du marais' }],
    reward: { gold: 200, flags: ['sanct_reflets'], text: 'Passage vers le Sanctuaire des Reflets' },
    talk: {
      offer: [
        'Les lanternes du marais brûlent au gaz des tourbières, guidé par trois vannes. Plus aucune ne s’allume.',
        'Chaque vanne a trois positions. Trouve le bon réglage pour que les quatre lanternes brillent en même temps !'
      ],
      active: 'Une lanterne allumée peut s’éteindre si tu changes la mauvaise vanne. Observe lesquelles réagissent.',
      ready: 'Elles brillent toutes ! Et regarde… les lanternes éclairent un chemin vers le Sanctuaire des Reflets.',
      after: 'Les voyageurs ne se perdent plus. Néris t’attend près des vieux miroirs, au nord.'
    }
  },
  {
    id: 12,
    chapter: 2,
    main: true,
    title: 'Le miroir des souvenirs',
    npc: 'neris',
    site: 'q12',
    requires: 11,
    level: 26,
    summary: 'Dans la salle des reflets, les miroirs montrent le passé… dans le désordre. Néris pense qu’ils cachent la vérité sur le Cœur.',
    steps: [{ k: 'puzzle', text: 'Remettre les quatre reflets dans l’ordre de l’histoire' }],
    reward: { gold: 240, flags: ['star2'], text: 'Deuxième étoile et un souvenir dans le journal' },
    talk: {
      offer: [
        'Ces miroirs se souviennent. Mais ils mélangent tout : certains reflets mentent sur l’ordre des choses.',
        'Tourne chaque miroir (E) pour choisir son reflet, de gauche à droite : du plus ancien au plus récent.'
      ],
      active: 'D’abord la paix, puis la menace, puis le sacrifice, et enfin l’espoir.',
      ready: 'Alors c’était ça… Ils n’ont pas perdu le Cœur. Ils l’ont caché, pour le protéger. Et voici la deuxième étoile.',
      after: 'L’Ombre approchait, et les anciens ont choisi de disperser la lumière. Je comprends enfin leurs chants.'
    },
    memory: 'Le miroir des souvenirs : les anciens vivaient en paix autour du Cœur de l’Aurore. Une ombre est venue de la mer. Plutôt que de laisser le Cœur tomber, ils l’ont brisé en six étoiles, confiées aux six sanctuaires. Les lumières se sont éteintes… mais pas pour toujours.'
  },
  {
    id: 13,
    chapter: 2,
    main: false,
    title: 'Le pont qui ne tient jamais',
    npc: 'goran',
    site: 'q13',
    level: 23,
    summary: 'Le pont de Goran s’effondre dès qu’on pose le pied dessus. Il manque surtout un bon plan.',
    steps: [{ k: 'puzzle', text: 'Poser les planches de la bonne longueur à chaque emplacement du pont' }],
    reward: { gold: 160, flags: ['bridge'], text: 'Le pont restauré pour toujours' },
    talk: {
      offer: [
        'Mon pont ? Une catastrophe. J’ai des planches courtes, moyennes et longues, et je les mets toujours au mauvais endroit.',
        'Les poteaux te disent l’écart : poteaux bas, planche courte ; poteaux hauts, planche longue. Change les planches (E).'
      ],
      active: 'Regarde la hauteur des poteaux de chaque côté de l’emplacement.',
      ready: 'Il tient ! Il tient vraiment ! Je vais l’appeler… le Pont qui Tient. Merci, l’ami !',
      after: 'Le Pont qui Tient tient toujours. Je traverse dix fois par jour, juste pour le plaisir.'
    }
  },
  {
    id: 14,
    chapter: 2,
    main: false,
    title: 'Le fantôme qui avait oublié son nom',
    npc: 'esprit',
    site: 'q14',
    level: 25,
    summary: 'Un esprit amical erre dans le marais. Il a oublié son nom, et sans nom, il ne peut pas partir en paix.',
    steps: [
      { k: 'clues', n: 4, text: 'Interroger les habitants et examiner les objets du marais (4 indices)' },
      { k: 'choice', text: 'Rendre son nom à l’esprit' }
    ],
    reward: { gold: 150, deco: 'lanterne', text: 'Lanterne décorative « Lueur d’Ilian »' },
    talk: {
      offer: [
        'Bouuh… pardon. Je ne voulais pas te faire peur. J’ai oublié mon nom, tu sais. Ça arrive, quand on est mort depuis longtemps.',
        'Les gens d’ici et les objets du marais se souviennent peut-être de moi. Tu veux bien chercher ?'
      ],
      active: 'Une lanterne, une barque, un vieux chapeau… et les habitants. Quelqu’un se souvient forcément.',
      ready: 'Ilian… Ilian le lanternier. Oui. C’était moi. Merci. Garde ma lanterne : elle éclairera ta maison.',
      after: 'Une douce lumière flotte parfois sur l’eau, là où Ilian allumait ses lanternes.'
    },
    choices: ['Orrin le passeur', 'Ilian le lanternier', 'Barnabé le pêcheur', 'Silas le chapelier'],
    answer: 1
  },
  {
    id: 15,
    chapter: 2,
    main: false,
    title: 'La traversée des nénuphars',
    npc: 'pipo',
    site: 'q15',
    level: 27,
    summary: 'Pipo a vu un coffre sur l’îlot de l’étang. Le seul chemin : des nénuphars qui coulent quand on s’y attarde.',
    steps: [{ k: 'reach', at: [4, 0], text: 'Traverser l’étang sur les nénuphars sans t’arrêter et ouvrir le coffre de l’îlot' }],
    reward: { gold: 120, item: 'Épique', text: 'Le coffre caché (équipement Épique de ton niveau)' },
    talk: {
      offer: [
        'Il y a un coffre sur l’îlot ! Mais les nénuphars coulent si on reste dessus. Moi je suis trop petit pour sauter.',
        'Saute de l’un à l’autre sans t’arrêter. Si tu tombes, l’eau te ramène sur la rive. Promis, je ne rirai pas !'
      ],
      active: 'Ne reste pas plus de deux secondes sur un nénuphar !',
      ready: 'Tu l’as fait ! Hi hi, tu étais tout mouillé la première fois. Le trésor est à toi !',
      after: 'Je m’entraîne à sauter. Un jour, j’y arriverai aussi.'
    }
  },
  {
    id: 16,
    chapter: 3,
    main: true,
    title: 'Le village des feuilles dorées',
    npc: 'erable',
    site: 'q16',
    requires: 12,
    level: 32,
    summary: 'Les ruines d’un village oublié dorment sous les feuilles d’automne. Érable dit que les feuilles dorées gardent ses souvenirs.',
    steps: [
      { k: 'collect', n: 4, text: 'Toucher les quatre feuilles dorées pour voir les souvenirs du village' },
      { k: 'puzzle', text: 'Replacer les quatre objets dans leurs maisons d’origine (porter : E)' }
    ],
    reward: { gold: 280, flags: ['star3', 'sanct_saisons'], text: 'Troisième étoile et accès à la Bibliothèque des Saisons' },
    talk: {
      offer: [
        'Ici vivait un village, avant. Ses maisons sont tombées, mais les feuilles dorées se souviennent de tout.',
        'Touche-les, regarde leurs souvenirs, puis rends à chaque maison ce qui lui appartient. Prends un objet (E) et pose-le devant sa maison (E).'
      ],
      active: 'Chaque feuille montre une maison et ce qu’on y faisait. Écoute-les bien.',
      ready: 'Le village se souvient de lui-même… Et regarde : une étoile se lève des feuilles. La Bibliothèque des Saisons s’ouvre !',
      after: 'Solenne garde les fresques des quatre saisons, près des grands érables à l’ouest.'
    },
    memory: 'Les feuilles dorées : un village heureux, une forge, un four, une cloche et une harpe. Quand l’ombre vint, les villageois partirent vers les sanctuaires… en laissant tout derrière eux.'
  },
  {
    id: 17,
    chapter: 3,
    main: true,
    title: 'Le secret des quatre saisons',
    npc: 'solenne',
    site: 'q17',
    requires: 16,
    level: 36,
    summary: 'Une fresque brisée raconte pourquoi les anciens ont endormi le Cœur. Ses quatre fragments sont dispersés.',
    steps: [
      { k: 'collect', n: 4, text: 'Retrouver les quatre fragments de la fresque' },
      { k: 'puzzle', text: 'Régler le mécanisme des saisons (chaque pilier sur la saison que montre son fragment)' }
    ],
    reward: { gold: 320, flags: ['archives'], text: 'Accès aux archives anciennes (un souvenir dans le journal)' },
    talk: {
      offer: [
        'La fresque des saisons est en morceaux. Chaque fragment montre une saison et le pilier qui lui revient.',
        'Rassemble-les, puis tourne les piliers (E) comme le montrent les fragments. Le mécanisme ouvrira les archives.'
      ],
      active: 'Lis bien chaque fragment : il dit quel pilier porte quelle saison.',
      ready: 'Les archives… « Le Cœur fut endormi pour qu’il ne soit pas dévoré. Il rêve, et attend. » Tout prend sens.',
      after: 'Le désert garde la Cité des Étoiles. Sahir connaît les obélisques.'
    },
    memory: 'Les archives des saisons : l’Ombre se nourrissait de lumière. Pour l’affamer, les anciens endormirent le Cœur et cachèrent ses six étoiles. Quand l’Ombre disparut, plus personne ne se souvenait comment le réveiller.'
  },
  {
    id: 18,
    chapter: 3,
    main: false,
    title: 'Le concours des feuilles',
    npc: 'flavio',
    site: 'q18',
    level: 33,
    summary: 'Flavio organise un concours : attraper la feuille dorée que le vent fait tourbillonner sans jamais la laisser tomber.',
    steps: [{ k: 'catch', text: 'Attraper la feuille dorée dans le vent (E quand elle est sur toi)' }],
    reward: { gold: 220, deco: 'feuille', text: 'Décoration « Feuille éternelle »' },
    talk: {
      offer: [
        'Le grand concours d’automne ! Une feuille dorée danse dans le vent. Qui l’attrape gagne.',
        'Ne la poursuis pas : regarde la girouette, devine où le vent va l’emporter, et attends-la. E quand elle passe sur toi !'
      ],
      active: 'La girouette montre le vent. La feuille tourne toujours dans le même sens.',
      ready: 'Tu l’as eue ! Elle ne fanera jamais, tu sais. Garde-la, c’est le prix du champion.',
      after: 'L’an prochain, je te bats. Je m’entraîne déjà.'
    }
  },
  {
    id: 19,
    chapter: 3,
    main: false,
    title: 'Le moulin qui tournait à l’envers',
    npc: 'odel',
    site: 'q19',
    level: 35,
    summary: 'Le moulin d’Odel tourne à l’envers et moud la farine… en grain. Trois engrenages ont été mal remontés.',
    steps: [{ k: 'puzzle', text: 'Repositionner les trois engrenages (la taille dépend de l’écart entre les axes)' }],
    reward: { gold: 300, flags: ['grenier'], item: 'Épique', text: 'Or et le coffre du grenier (équipement Épique)' },
    talk: {
      offer: [
        'Mon moulin tourne à l’envers depuis que mon neveu l’a « réparé ». Trois engrenages, trois erreurs.',
        'Grand écart entre les axes, grand engrenage ; petit écart, petit. Change-les (E), et que la roue tourne dans le bon sens !'
      ],
      active: 'Regarde l’écart entre les axes avant de choisir un engrenage.',
      ready: 'Elle tourne dans le bon sens ! Monte au grenier, ce qu’il y a dans le coffre est pour toi.',
      after: 'Ma farine n’a jamais été aussi fine. Reviens goûter mon pain.'
    }
  },
  {
    id: 20,
    chapter: 3,
    main: false,
    title: 'Le renard et les trois voyageurs',
    npc: 'voyageurs',
    site: 'q20',
    level: 37,
    summary: 'Trois voyageurs ont vu un renard magique, mais ne sont d’accord sur rien. Lequel dit vrai ?',
    steps: [
      { k: 'clues', n: 3, text: 'Écouter les trois témoignages' },
      { k: 'search', text: 'Fouiller la bonne cachette (E)' }
    ],
    reward: { gold: 260, item: 'Épique', text: 'La cachette secrète du renard (équipement Épique)' },
    talk: {
      offer: [
        'Un renard qui brille ! Il a filé avec nos provisions. Chacun de nous l’a vu, mais pas au même endroit…',
        'Écoute-nous tous les trois, compare, et trouve sa cachette. Attention, l’un de nous se trompe souvent.'
      ],
      active: 'Deux de nos témoignages sont vrais. Le troisième… c’est Gaspard, il voit mal.',
      ready: 'Sa cachette ! Et nos provisions… et un trésor qu’il avait amassé. Prends-le, tu l’as bien mérité.',
      after: 'Le renard vient nous voir le soir. On l’a appelé Malice.'
    },
    witnesses: true
  },
  {
    id: 21,
    chapter: 4,
    main: true,
    title: 'La cité sous les sables',
    npc: 'sahir',
    site: 'q21',
    requires: 17,
    level: 42,
    summary: 'Trois obélisques veillent sur le désert. Alignés sur les étoiles, ils révéleraient une cité enfouie.',
    steps: [
      { k: 'collect', n: 3, text: 'Retrouver les trois obélisques ensevelis (E pour les dégager)' },
      { k: 'puzzle', text: 'Tourner les obélisques pour que leurs faisceaux se rejoignent sur l’étoile du centre' }
    ],
    reward: { gold: 380, flags: ['star4', 'sanct_etoiles'], text: 'Quatrième étoile et accès à la Cité des Étoiles' },
    talk: {
      offer: [
        'La nuit, trois obélisques chantent sous le sable. Mon grand-père disait qu’ils montrent l’entrée de la cité des étoiles.',
        'Dégage-les, puis tourne-les (E) : leurs faisceaux doivent se croiser sur l’étoile gravée au centre.'
      ],
      active: 'Chaque obélisque projette un faisceau. Ils doivent tous viser l’étoile du centre.',
      ready: 'Le sable s’effondre… un escalier ! La Cité des Étoiles. Et cette lumière… une quatrième étoile !',
      after: 'Astéria étudie la vieille machine, sous la cité. Elle a besoin de toi.'
    }
  },
  {
    id: 22,
    chapter: 4,
    main: true,
    title: 'La machine de l’Aurore',
    npc: 'asteria',
    site: 'q22',
    requires: 21,
    level: 47,
    summary: 'Une machine des anciens dort sous le désert : trois anneaux qui représentent les sanctuaires.',
    steps: [{ k: 'puzzle', text: 'Synchroniser les trois anneaux (tourner un anneau entraîne le suivant)' }],
    reward: { gold: 460, flags: ['star5'], item: 'Épique', text: 'Cinquième étoile et la salle du trésor (équipement Épique)' },
    talk: {
      offer: [
        'Trois anneaux, six symboles chacun. Quand ils sont alignés, la machine montre comment réveiller le Cœur.',
        'Mais attention : tourner un anneau (E) entraîne le suivant d’un cran. Commence par le bon bout !'
      ],
      active: 'Le dernier anneau ne bouge que seul. Le premier entraîne le deuxième, le deuxième entraîne le troisième.',
      ready: 'La machine s’illumine : « Six étoiles réunies, une étincelle du Cœur, et le chant des anciens. » Une étincelle… Lumi ?',
      after: 'Lumi t’attend dans la Forêt enchantée. Elle sait où se trouve le sanctuaire central.'
    },
    memory: 'La machine de l’Aurore : pour réveiller le Cœur, il faut réunir les six étoiles dans le sanctuaire central, puis qu’une étincelle du Cœur lui-même chante avec elles.'
  },
  {
    id: 23,
    chapter: 4,
    main: false,
    title: 'Le marchand qui vendait du vent',
    npc: 'zafir',
    site: 'q23',
    level: 43,
    summary: 'Zafir vend du vent en bouteille. Pour le prouver, il faut faire glisser son bateau miniature jusqu’au quai.',
    steps: [{ k: 'puzzle', text: 'Souffler avec les bonnes bouteilles pour amener le bateau au quai' }],
    reward: { gold: 330, deco: 'bouteille', text: 'Décoration « Bouteille de vent »' },
    talk: {
      offer: [
        'Du vent du nord, du sud, de l’est, de l’ouest ! Tu ne me crois pas ? Regarde mon bassin.',
        'Débouche une bouteille (E) et le bateau file jusqu’au premier obstacle. Amène-le au quai.'
      ],
      active: 'Le bateau ne s’arrête que contre un rocher ou un bord. Réfléchis avant de souffler.',
      ready: 'Au quai ! Tu vois bien que je vends du vrai vent. Tiens, une bouteille offerte par la maison.',
      after: 'Les affaires marchent. Le vent d’est se vend très bien en ce moment.'
    }
  },
  {
    id: 24,
    chapter: 4,
    main: false,
    title: 'Le temple des miroirs',
    npc: 'noura',
    site: 'q24',
    level: 46,
    summary: 'La porte d’un petit temple ne s’ouvre qu’à la lumière du soleil. Des miroirs anciens sont encore là.',
    steps: [{ k: 'puzzle', text: 'Orienter les miroirs pour diriger le rayon solaire sur la porte' }],
    reward: { gold: 360, item: 'Épique', text: 'Le coffre du temple (équipement Épique)' },
    talk: {
      offer: [
        'Ce temple garde un coffre depuis mille ans. Sa porte attend un rayon de soleil.',
        'Quatre miroirs, un rayon. Tourne-les (E), et suis la lumière jusqu’au soleil gravé sur la porte.'
      ],
      active: 'Certains miroirs ne servent à rien. Suis le rayon depuis la pierre solaire.',
      ready: 'La porte s’ouvre ! Le coffre est à toi, voyageur de lumière.',
      after: 'Je viens prier ici chaque matin. Le rayon touche toujours la porte.'
    }
  },
  {
    id: 25,
    chapter: 4,
    main: false,
    title: 'Le secret de l’oasis',
    npc: 'amira',
    site: 'q25',
    level: 48,
    summary: 'L’oasis d’Amira s’assèche. Le vieil aqueduc a trois portes, et l’eau part toujours dans le sable.',
    steps: [{ k: 'puzzle', text: 'Ouvrir et fermer les portes de l’aqueduc pour remplir le bassin (sans inonder le sable)' }],
    reward: { gold: 380, recipe: 'tajine', text: 'Recette « Tajine de l’oasis » et oasis restaurée' },
    talk: {
      offer: [
        'L’eau coule dans l’aqueduc, mais elle finit dans le sable. Le bassin de l’oasis reste vide.',
        'Trois portes (E) dirigent l’eau. Elle doit aller au bassin, et nulle part ailleurs.'
      ],
      active: 'Une porte ouverte laisse passer l’eau vers sa branche. Suis le courant des yeux.',
      ready: 'L’eau chante dans le bassin ! L’oasis va refleurir. Tiens, la recette de ma mère : elle demande une eau pure.',
      after: 'Les palmiers ont déjà de nouvelles palmes. Merci, l’ami de l’eau.'
    }
  },
  {
    id: 26,
    chapter: 5,
    main: true,
    title: 'Le sanctuaire des six lumières',
    npc: 'lumi',
    site: 'q26',
    requires: 22,
    level: 52,
    summary: 'Lumi te guide jusqu’au sanctuaire central. Quatre épreuves attendent, faites de tout ce que tu as appris.',
    steps: [
      { k: 'trials', n: 4, text: 'Réussir les quatre épreuves du savoir (E sur chaque stèle)' },
      { k: 'spot', at: [0, -1], text: 'Placer les étoiles sur l’autel (E)' }
    ],
    reward: { gold: 520, flags: ['sanct_lumieres'], text: 'Accès à la Chambre de l’Aurore' },
    talk: {
      offer: [
        '✨ Tu entends ? C’est ici. Le sanctuaire des six lumières… je m’en souviens, je crois.',
        '✨ Quatre stèles vont te poser des questions sur notre voyage. Puis pose les étoiles sur l’autel. Je reste près de toi.'
      ],
      active: '✨ Souviens-toi de tout : les ruines, la forêt, le marais… les réponses sont dans ton journal.',
      ready: '✨ Les étoiles brillent ensemble ! La Chambre de l’Aurore est ouverte. Auralis nous attend.',
      after: '✨ Je me sens… plus chaude. Comme si je rentrais chez moi.'
    },
    trials: [
      { q: 'Sur la carte d’Orven, quel symbole était au nord ?', a: ['La lune', 'L’étoile', 'La flamme'], ok: 1 },
      { q: 'Quelle note ouvrait la mélodie des anciens ?', a: ['La plus aiguë', 'La plus grave', 'Celle du milieu'], ok: 1 },
      { q: 'Pourquoi les anciens ont-ils dispersé le Cœur ?', a: ['Pour le protéger de l’Ombre', 'Pour le vendre', 'Par erreur'], ok: 0 },
      { q: 'Combien d’étoiles composent le Cœur ?', a: ['Quatre', 'Cinq', 'Six'], ok: 2 }
    ]
  },
  {
    id: 27,
    chapter: 5,
    main: true,
    title: 'Le Cœur de l’Aurore',
    npc: 'auralis',
    site: 'q27',
    requires: 26,
    level: 58,
    summary: 'Auralis, le dernier gardien, attend dans la Chambre de l’Aurore. L’Ombre a laissé des échos qui ne veulent pas que le Cœur se réveille.',
    steps: [
      { k: 'spot', at: [-4, 0], text: 'Lire la fresque du gardien (E)' },
      { k: 'defense', text: 'Protéger les six cristaux contre les manifestations (E sur l’autel pour commencer)' },
      { k: 'collect', n: 6, text: 'Réunir la lumière des six cristaux' }
    ],
    reward: { gold: 900, flags: ['star6', 'sanct_aurore', 'title', 'aurora'], text: 'Titre « Gardien de l’Aurore », aura lumineuse, sixième étoile et la Chambre de l’Aurore pour toujours' },
    talk: {
      offer: [
        'Je suis Auralis. J’étais le gardien du Cœur… et je suis resté, même quand tout le monde est parti.',
        'Les échos de l’Ombre rôdent encore. Lis ma fresque, puis défends les six cristaux pendant que le Cœur s’éveille.'
      ],
      active: 'Tiens bon. Tant qu’il reste des cristaux, le Cœur peut se réveiller.',
      ready: 'Le Cœur s’éveille… Et Lumi… regarde-la. Elle était une étincelle du Cœur depuis le début. Elle t’a choisi. Gardien de l’Aurore.',
      after: 'L’île respire à nouveau. Les six sanctuaires brillent. Merci, Gardien.'
    },
    memory: 'Le Cœur de l’Aurore se réveille. Les six sanctuaires retrouvent leur lumière, et Lumi révèle la vérité : elle était une étincelle du Cœur, tombée du ciel pour trouver quelqu’un capable de le réveiller. Ce quelqu’un, c’était toi.'
  },
  {
    id: 28,
    chapter: 5,
    main: false,
    title: 'Le monde à l’envers',
    npc: 'lyss',
    site: 'q28',
    level: 53,
    summary: 'Deux clairières se reflètent l’une l’autre. Ce qu’on change dans la première change la seconde… à l’envers.',
    steps: [{ k: 'puzzle', text: 'Actionner les leviers de la première clairière pour ouvrir un passage dans la seconde' }],
    reward: { gold: 500, item: 'Légendaire', text: 'Le coffre enchanté (équipement Légendaire)' },
    talk: {
      offer: [
        'Regarde : deux clairières jumelles. Mais le miroir est capricieux : la gauche devient la droite.',
        'Abaisse les leviers (E) ici, et les rochers de l’autre clairière bougeront. Ouvre-toi un chemin jusqu’au coffre.'
      ],
      active: 'Deux leviers abaissés, un seul levé. Regarde quels rochers bougent de l’autre côté du miroir.',
      ready: 'Tu as traversé le miroir ! Le coffre enchanté est à toi.',
      after: 'Parfois, je me demande quelle clairière est la vraie.'
    }
  },
  {
    id: 29,
    chapter: 5,
    main: false,
    title: 'Le dragon qui avait peur de voler',
    npc: 'pyria',
    site: 'q29',
    level: 55,
    summary: 'Pyria élève un jeune dragon qui n’ose pas voler. Il lui faut un parcours d’entraînement, marche après marche.',
    steps: [{ k: 'puzzle', text: 'Construire le parcours : chaque perchoir un cran plus haut que le précédent, puis appeler le dragon' }],
    reward: { gold: 540, deco: 'dragon', flags: ['pyria'], text: 'Décoration « Petit dragon » et Pyria s’installe dans la forêt' },
    talk: {
      offer: [
        'Braise a peur du vide. Il ne sautera que si chaque perchoir est juste un peu plus haut que le précédent.',
        'Règle les quatre perchoirs (E), du plus bas au plus haut, une marche à la fois. Puis appelle-le avec le cor.'
      ],
      active: 'Pas deux perchoirs à la même hauteur, et jamais deux marches d’un coup.',
      ready: 'IL VOLE ! Braise vole ! On va rester dans la forêt, il adore les cristaux. Tiens, une petite statue de lui.',
      after: 'Braise fait des loopings maintenant. Il est insupportable. Je l’adore.'
    }
  },
  {
    id: 30,
    chapter: 5,
    main: false,
    title: 'Le lac aux mille étoiles',
    npc: 'elya',
    site: 'q30',
    level: 57,
    summary: 'Le lac reflète une constellation. Élya dit qu’il faut marcher sur ses étoiles, dans l’ordre où elles s’allument.',
    steps: [{ k: 'puzzle', text: 'Marcher sur les pierres du lac dans l’ordre de la constellation reflétée' }],
    reward: { gold: 600, jewel: true, text: 'Un bijou Légendaire avec des statistiques secondaires aléatoires' },
    talk: {
      offer: [
        'Regarde le reflet : une constellation, le Cerf des neiges. Ses étoiles s’allument l’une après l’autre.',
        'Marche sur les pierres du lac dans le même ordre. Une erreur, et le reflet s’efface : il faudra recommencer.'
      ],
      active: 'Regarde le reflet : l’étoile qui s’allume en premier, puis la suivante…',
      ready: 'Le lac t’a reconnu. Ce bijou a été taillé dans une étoile tombée. Il est à toi.',
      after: 'Les nuits claires, le lac brille encore pour toi.'
    }
  }
]);
export const QUEST_IDS = Object.freeze(QUESTS.map(q => q.id));
// Indices de l'esprit (quête 14) : où les trouver (relatif au lieu) et ce qu'ils apprennent.
export const GHOST_CLUES = deepFreeze([
  { id: 'lanterne', at: [-3, -1], what: 'Une vieille lanterne gravée : « I. — Que la lumière guide les égarés. »' },
  { id: 'barque', at: [3, 2], what: 'Une barque échouée. Sur le banc : « Au lanternier, pour ses tournées du soir. »' },
  { id: 'vieille', at: [4, -3], who: 'Vieille Odette', what: 'Vieille Odette : « Il allumait les lanternes chaque soir, en sifflant. Un garçon gentil. »' },
  { id: 'pecheur', at: [-4, 3], who: 'Pêcheur Tom', what: 'Pêcheur Tom : « Son prénom commençait comme une île… I-quelque chose. Ilian ? »' }
]);
// Quête 16 : souvenirs des feuilles et objets à rendre à leur maison.
export const VILLAGE_MEMORIES = deepFreeze([
  { id: 'f1', at: [-4, -4], what: 'Une feuille dorée : le forgeron battait le fer, et l’enclume chantait dans la maison du puits.' },
  { id: 'f2', at: [4, -4], what: 'Une feuille dorée : la boulangère sonnait la cloche quand le pain sortait du four.' },
  { id: 'f3', at: [-5, 3], what: 'Une feuille dorée : dans la maison au jardin, une mère berçait son enfant.' },
  { id: 'f4', at: [5, 3], what: 'Une feuille dorée : le soir, du haut de la petite tour, la harpe jouait pour tout le village.' }
]);
// Quête 17 : chaque fragment de la fresque donne la saison d'un pilier.
export const FRESCO = deepFreeze([
  { id: 'fr1', at: [-6, -4], what: 'Fragment : « Au nord dort l’hiver, sous la neige. »' },
  { id: 'fr2', at: [6, -3], what: 'Fragment : « À l’est se lève le printemps. »' },
  { id: 'fr3', at: [5, 5], what: 'Fragment : « Au sud brûle l’été. »' },
  { id: 'fr4', at: [-5, 5], what: 'Fragment : « À l’ouest tombe l’automne. »' }
]);
// Quête 20 : témoignages (le troisième se trompe) et cachettes possibles.
export const TRAVELERS = deepFreeze([
  { id: 't1', at: [-2, 4], who: 'Hector', what: 'Hector : « Il s’est caché près d’une grosse citrouille, j’en suis sûr. »' },
  { id: 't2', at: [0, 4], who: 'Mila', what: 'Mila : « Il déteste l’eau. Il ne va jamais près du ruisseau. »' },
  { id: 't3', at: [2, 4], who: 'Gaspard', what: 'Gaspard : « Moi je l’ai vu sous le pont du ruisseau ! Enfin… je crois. »' }
]);
