// @ts-check
// Histoire « Les Échos de l'Aurore » : six chapitres (un par zone), 30 quêtes (12 principales, 18 secondaires), puis
// l'Interlude des Tréfonds (quests-interlude.js, 16 quêtes à tout niveau).
// Chaque quête : PNJ, lieu (site), objectifs (chacun avec sa mécanique), dialogues évolutifs et récompense.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';
import { INTERLUDE_NPCS, INTERLUDE_QUESTS, INTERLUDE_SITES } from './quests-interlude.js';
import { CONTRACT_RANKS, GUILD_CONTRACTS, GUILD_MASTER } from './guild.js';

export const STORY_TITLE = 'Les Échos de l’Aurore';
export const STORY_INTRO =
  'Autrefois, le Cœur de l’Aurore protégeait l’île. Pour le sauver d’une Ombre venue de la mer, les anciens l’ont endormi et ont caché ses six étoiles dans six sanctuaires. Des siècles plus tard, une petite lumière tombe près du Camp de l’Aurore. Ton but : retrouver les six étoiles et réveiller le Cœur, avant qu’une femme voilée, Vesper, ne les éteigne.';
// under : chapitre des Tréfonds, à côté de l'histoire de la surface, au niveau du héros. intro : en tête du journal.
export const CHAPTERS = deepFreeze([
  {
    n: 'I',
    title: 'La Première Étincelle',
    zone: 0,
    levels: [1, 10],
    intro:
      'Une petite lumière tombe près du camp. Le vieil Orven sait ce qu’elle est : une étincelle du Cœur de l’Aurore, et le début de la quête des six étoiles.'
  },
  {
    n: 'II',
    title: 'La Forêt qui chante',
    zone: 1,
    levels: [10, 20],
    intro:
      'Première étoile : la Forêt ancienne. L’arbre gardien l’a recueillie, mais une femme voilée paie des gobelins pour le saigner.'
  },
  {
    n: 'III',
    title: 'Les Lanternes du Marais',
    zone: 2,
    levels: [20, 30],
    intro:
      'Deuxième étoile : le marais. Les lanternes éteintes cachent le chemin du Sanctuaire des Reflets, et ses miroirs savent qui est Vesper.'
  },
  {
    n: 'IV',
    title: 'Les Couleurs du Passé',
    zone: 3,
    levels: [30, 40],
    intro:
      'Troisième étoile : la Forêt automnale. Un village oublié la garde, et les archives des saisons disent pourquoi le Cœur s’est endormi.'
  },
  {
    n: 'V',
    title: 'La Cité des Étoiles',
    zone: 4,
    levels: [40, 50],
    intro:
      'Quatrième et cinquième étoiles : le désert. Sous le sable, une machine des anciens sait comment réveiller le Cœur.'
  },
  {
    n: 'VI',
    title: 'Le Réveil de l’Aurore',
    zone: 5,
    levels: [50, 60],
    intro:
      'Les étoiles réunies, Lumi mène au sanctuaire central. Le Cœur peut se réveiller… si Vesper ne l’éteint pas avant.'
  },
  {
    n: 'Interlude',
    title: 'Les Voix d’en bas',
    under: true,
    intro: 'Sous l’île, la pierre chante depuis que l’étoile est tombée. Durgrim ne dort plus.'
  }
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
  q30: { zone: 5, polar: [96, 86], r: 6 },
  ...INTERLUDE_SITES
});
// PNJ des quêtes : nom, lieu, position par rapport au lieu (en cases), apparence (looks.js) et répliques libres.
export const QUEST_NPCS = deepFreeze({
  liora: {
    name: 'Liora',
    site: 'q1',
    camp: [2, 3],
    look: { sex: 'f', race: 'elfe', hair: '#f0e0a0', outfit: 'or' }
  },
  orven: {
    name: 'Orven',
    site: 'q2',
    at: [-3, 0],
    look: { sex: 'm', race: 'humain', hair: '#e8e8e0', outfit: 'nuit' },
    tool: 'staff'
  },
  milo: {
    name: 'Milo',
    site: 'q3',
    at: [-5, 3],
    look: { sex: 'm', race: 'humain', hair: '#c88a3a', outfit: 'cuir' },
    tool: 'staff'
  },
  bastian: {
    name: 'Bastian',
    site: 'q4',
    at: [-4, -3],
    look: { sex: 'm', race: 'orc', hair: '#3a2a20', outfit: 'cuir' }
  },
  eloi: {
    name: 'Éloi',
    site: 'q5',
    at: [-4, 1],
    look: { sex: 'm', race: 'humain', hair: '#d8d8d0', outfit: 'foret' },
    tool: 'rod'
  },
  sylva: {
    name: 'Sylva',
    site: 'q6',
    at: [-4, 2],
    look: { sex: 'f', race: 'elfe', hair: '#6aa04a', outfit: 'foret' },
    tool: 'staff'
  },
  aelor: {
    name: 'Aelor',
    site: 'q7',
    at: [-5, 3],
    look: { sex: 'm', race: 'elfe', hair: '#c8b070', outfit: 'or' },
    tool: 'staff'
  },
  nima: {
    name: 'Nima',
    site: 'q8',
    at: [0, 9],
    look: { sex: 'f', race: 'humain', hair: '#2a2030', outfit: 'nuit' }
  },
  brin: { name: 'Brin', site: 'q9', at: [-5, 4], look: { sex: 'm', race: 'minotaure', outfit: 'cuir' } },
  theon: {
    name: 'Théon',
    site: 'q10',
    at: [-3, 3],
    look: { sex: 'm', race: 'humain', hair: '#7d5140', outfit: 'rose' }
  },
  maeline: {
    name: 'Maëline',
    site: 'q11',
    at: [-4, 3],
    look: { sex: 'f', race: 'humain', hair: '#a84a3a', outfit: 'glace' },
    tool: 'staff'
  },
  neris: {
    name: 'Néris',
    site: 'q12',
    at: [0, 4],
    look: { sex: 'f', race: 'elfe', hair: '#c8d8f0', outfit: 'glace' }
  },
  goran: {
    name: 'Goran',
    site: 'q13',
    at: [-4, 3],
    look: { sex: 'm', race: 'orc', hair: '#5a4030', outfit: 'cuir' }
  },
  esprit: {
    name: 'Esprit amical',
    site: 'q14',
    at: [0, -3],
    ghost: true,
    look: { sex: 'm', race: 'humain', hair: '#c8e8f0', outfit: 'glace' }
  },
  pipo: {
    name: 'Pipo',
    site: 'q15',
    at: [-5, 3],
    look: { sex: 'm', race: 'humain', hair: '#f0c040', outfit: 'foret' },
    child: true
  },
  erable: {
    name: 'Érable',
    site: 'q16',
    at: [0, 6],
    look: { sex: 'f', race: 'humain', hair: '#c8642a', outfit: 'rose' },
    tool: 'staff'
  },
  solenne: {
    name: 'Solenne',
    site: 'q17',
    at: [-4, 3],
    look: { sex: 'f', race: 'elfe', hair: '#e8b860', outfit: 'or' }
  },
  flavio: {
    name: 'Flavio',
    site: 'q18',
    at: [-5, 3],
    look: { sex: 'm', race: 'humain', hair: '#5a3020', outfit: 'cuir' },
    child: true
  },
  odel: { name: 'Odel', site: 'q19', at: [-4, 3], look: { sex: 'm', race: 'minotaure', outfit: 'cuir' } },
  voyageurs: {
    name: 'Trois voyageurs',
    site: 'q20',
    at: [-4, 4],
    look: { sex: 'm', race: 'orc', hair: '#3a2a20', outfit: 'foret' },
    tool: 'spear'
  },
  sahir: {
    name: 'Sahir',
    site: 'q21',
    at: [-2, 5],
    look: { sex: 'm', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' },
    tool: 'staff'
  },
  asteria: {
    name: 'Astéria',
    site: 'q22',
    at: [-4, 3],
    look: { sex: 'f', race: 'elfe', hair: '#d8e8ff', outfit: 'nuit' },
    tool: 'staff'
  },
  zafir: {
    name: 'Zafir',
    site: 'q23',
    at: [-5, 3],
    look: { sex: 'm', race: 'humain', skin: '#c08a5a', hair: '#2a2020', outfit: 'rose' }
  },
  noura: {
    name: 'Noura',
    site: 'q24',
    at: [-5, 3],
    look: { sex: 'f', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' }
  },
  amira: {
    name: 'Amira',
    site: 'q25',
    at: [-5, 3],
    look: { sex: 'f', race: 'humain', skin: '#c08a5a', hair: '#3a2420', outfit: 'foret' },
    tool: 'basket'
  },
  lumi: { name: 'Lumi', site: 'q26', at: [0, 4], spirit: true, look: { sex: 'f', race: 'elfe' } },
  auralis: {
    name: 'Auralis',
    site: 'q27',
    at: [0, 5],
    ghost: true,
    look: { sex: 'm', race: 'elfe', hair: '#fff0c0', outfit: 'or' },
    tool: 'staff'
  },
  lyss: {
    name: 'Lyss',
    site: 'q28',
    at: [-6, 3],
    look: { sex: 'f', race: 'elfe', hair: '#b080f0', outfit: 'nuit' }
  },
  pyria: {
    name: 'Pyria',
    site: 'q29',
    at: [-4, 3],
    look: { sex: 'f', race: 'humain', hair: '#e05a2a', outfit: 'cuir' }
  },
  elya: {
    name: 'Élya',
    site: 'q30',
    at: [-5, 3],
    look: { sex: 'f', race: 'elfe', hair: '#c8e0ff', outfit: 'glace' }
  },
  // Sœur d'Auralis : visible seulement quand on décide de son sort (quête 27).
  vesper: {
    name: 'Vesper',
    site: 'q27',
    at: [3, 5],
    when: { quest: 27, step: 3 },
    ghost: true,
    look: { sex: 'f', race: 'elfe', hair: '#2a1a3e', outfit: 'nuit' },
    tool: 'staff'
  },
  // Garde de Durgrim, sans quête : il goûte la bière de Dorn (quête 40).
  dwalin: { name: 'Garde Dwalin', site: 'q40', dwarfName: 'Garde Dwalin' },
  ...INTERLUDE_NPCS,
  // Collectionneuse des coquillages chantants (sans quête) : au camp, elle récompense chaque palier.
  nacre: {
    name: 'Madame Nacre',
    site: 'q1',
    camp: [-3, 4],
    collector: true,
    look: { sex: 'f', race: 'humain', hair: '#f4d8e8', outfit: 'glace' },
    tool: 'basket'
  },
  // Maîtresse de la guilde (guild.js) : elle affiche les contrats et reçoit les avis de la guilde. Elle se tient dans
  // la maison de guilde du camp ; elle n'est pas posée comme les autres personnages.
  guilde: {
    name: GUILD_MASTER,
    guild: true,
    look: { sex: 'f', race: 'humain', hair: '#7a4a2a', outfit: 'cuir' }
  }
});
// Objectifs : k = mécanique. Terrain (scripts/quest-field.js) : kill (vaincre n créatures), loot (n objets lâchés par
// des créatures), pick (n objets du lieu : ramasser, allumer, libérer ; ambush : des ennemis surgissent), wave (défendre
// un point), escort (accompagner quelqu'un), chase (rattraper n fuyards), race (course chronométrée), hunt (champion
// nommé), talk (parler à quelqu'un), work (n récoltes d'un métier), clear (terminer un donjon), sky (revoir le ciel).
// Propres à un lieu (scripts/quests.js) : trail (suivre des traces), collect (objets cachés), spot (point précis), timing
// (E au bon moment), reach (atteindre un point), clues (indices), choice (réponse ou choix moral), search (bonne cachette),
// catch (feuille au vent), defense (les six cristaux), puzzle (énigme partagée) et guardian (gardien, voir GUARDIANS).
// world : changements du monde quand l'étape est finie. Chacun garde sa progression ; les combats comptent pour tout le
// groupe proche.
// Les anciennes quêtes secondaires sont des contrats de la guilde (CONTRACT_RANKS) : rejouables, au niveau du héros.
/** @type {Record<number, string>} */
const RANK_OF = CONTRACT_RANKS;
/** @type {(q: any) => any} */
const asContract = q => (RANK_OF[q.id] ? { ...q, contract: RANK_OF[q.id], scaled: true } : q);
export const QUESTS = deepFreeze(
  [
    // ---------------------------------------------------------------- Chapitre I
    {
      id: 1,
      chapter: 0,
      main: true,
      title: 'La lumière tombée du ciel',
      npc: 'liora',
      site: 'q1',
      level: 2,
      summary:
        'Cette nuit, une lumière est tombée juste à l’est du Camp de l’Aurore. Liora l’a vue, et elle a peur d’aller voir seule.',
      steps: [
        { k: 'trail', text: 'Suivre les traces lumineuses depuis le camp' },
        {
          k: 'pick',
          n: 4,
          spread: [2, 5],
          icon: '✨',
          item: 'Éclat d’étoile',
          label: 'Ramasser l’éclat',
          text: 'Ramasser les éclats tombés autour du cristal'
        },
        {
          k: 'wave',
          waves: [2, 3],
          mobs: ['Slime'],
          what: 'le cristal',
          art: 'crystal',
          at: [0, 1],
          label: 'Rendre ses éclats au cristal',
          text: 'Protéger le cristal des slimes attirés par sa lumière'
        }
      ],
      reward: { gold: 60, flags: ['lumi'], text: 'Lumi devient ta compagne de voyage' },
      talk: {
        offer: [
          'Tu l’as vue, toi aussi ? Une lumière est tombée cette nuit, juste à l’est du camp !',
          'Elle a laissé des traces qui brillent dans l’herbe. Suis-les, s’il te plaît, et dis-moi ce que c’est. Moi, je n’ose pas y aller seule.'
        ],
        active: 'Les traces partent vers l’est du camp. Suis-les jusqu’au bout : la lumière doit être là.',
        ready:
          'Elle te suit ? C’est une petite créature de lumière… Lumi, c’est ça ? Le vieil Orven, aux Ruines de la Couronne, saura ce qu’elle est. Va le voir avec elle.',
        after: 'Va voir Orven aux Ruines de la Couronne. Il connaît toutes les vieilles histoires de lumière.'
      }
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
      summary:
        'Orven reconnaît Lumi : une étincelle du Cœur de l’Aurore. Sa vieille carte montre où dorment les six étoiles du Cœur, mais une femme voilée a lâché les loups dessus.',
      steps: [
        {
          k: 'loot',
          n: 5,
          mobs: ['Loup', 'Sanglier'],
          icon: '🗺️',
          item: 'Fragment de carte',
          text: 'Reprendre les fragments de carte aux loups et aux sangliers'
        },
        {
          k: 'pick',
          n: 3,
          at: [
            [-4, -3],
            [4, -2],
            [1, 4]
          ],
          icon: '✦',
          item: 'Sceau d’ombre',
          label: 'Arracher le sceau',
          ambush: ['Loup', 2],
          text: 'Arracher les trois sceaux d’ombre plantés dans les ruines'
        },
        { k: 'guardian', text: 'Vaincre Ronce-Moussue, l’écho des ruines (E sur le sceau)' }
      ],
      reward: { gold: 90, flags: ['starmap'], text: 'Carte des sanctuaires dans le journal' },
      talk: {
        offer: [
          'Par ma barbe… Cette lumière vient du Cœur de l’Aurore ! Le Cœur protégeait l’île, autrefois. Les anciens l’ont endormi et ont caché ses six étoiles dans six sanctuaires. Ma carte les montre.',
          'Hier soir, une femme voilée a sifflé, et les loups ont mis ma carte en pièces. Reprends les morceaux aux loups et aux sangliers, puis arrache les sceaux noirs qu’elle a plantés dans mes ruines.'
        ],
        active:
          'Les morceaux de ma carte sont dans la gueule des loups et des sangliers des plaines. Les sceaux noirs sont ici, dans les ruines.',
        ready:
          'La carte est entière ! Regarde : six étoiles, six sanctuaires. Si on les retrouve toutes et qu’on les ramène au Cœur, il se réveillera, et l’île sera de nouveau protégée. La première dort dans la Forêt ancienne : va voir Sylva, la gardienne des chants. Et méfie-toi de la femme voilée : elle cherche les étoiles, elle aussi.',
        after:
          'La première étoile est dans la Forêt ancienne. Sylva t’y attend. Trouve les étoiles avant la femme voilée.'
      },
      verse: 'Une étincelle tombe où nul ne l’attend, et la plaine se souvient du premier chant.',
      memory:
        'Sur le dernier sceau, un nom gravé à l’envers : Vesper. Orven a pâli en le lisant, et n’a rien voulu en dire.'
    },
    {
      id: 3,
      chapter: 0,
      main: false,
      title: 'Le mouton aux grandes ambitions',
      npc: 'milo',
      site: 'q3',
      level: 4,
      summary:
        'Milo, berger des Plaines verdoyantes : Pompon, son mouton, s’est encore sauvé pour monter au sommet de la colline, et les loups rôdent. Il faut le rattraper, chasser les loups et l’accompagner là-haut, sinon il recommencera cette nuit.',
      steps: [
        {
          k: 'chase',
          n: 1,
          art: 'sheep',
          who: 'Pompon',
          label: 'Attraper Pompon',
          text: 'Rattraper Pompon, qui court dans tous les sens'
        },
        { k: 'kill', n: 6, mobs: ['Loup'], what: 'Loup vaincu', text: 'Éloigner les loups de la colline' },
        {
          k: 'escort',
          art: 'sheep',
          who: 'Pompon',
          from: [-4, 3],
          to: [3, -4],
          ambush: [['Loup', 2]],
          label: 'Emmener Pompon',
          text: 'Accompagner Pompon jusqu’au drapeau du sommet',
          world: ['sommet']
        }
      ],
      reward: { gold: 70, item: 'Rare', text: 'Équipement Rare de ton niveau' },
      talk: {
        offer: [
          'Pompon veut monter au sommet de la colline. Il en rêve, je te jure ! Alors il saute la barrière toutes les nuits.',
          'Rattrape-le, chasse les loups, puis monte là-haut avec lui. Juste une fois. Pour qu’il voie.'
        ],
        active:
          'Rattrape Pompon, chasse les loups de la colline, puis monte avec lui jusqu’au drapeau. Têtu comme un mouton, je te dis !',
        ready:
          'Il est en haut ! Regarde-le, il est si fier. Merci de ta patience : la guilde aura ton paiement, et moi ma nuit de sommeil.',
        after:
          'Pompon regarde le coucher de soleil du haut de la colline. Il recommencera, j’en suis sûr : je repasserai par la guilde.'
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
      summary:
        'Bastian, chasseur de trésors des Plaines verdoyantes : les sangliers ont encore mâchonné les pages de sa vieille chanson de marin. Elle dit qu’un coffre dort là où se croisent les ombres de trois chênes. Il faut reprendre les pages, creuser au bon endroit et chasser le vieux sanglier qui dort dessus.',
      steps: [
        {
          k: 'loot',
          n: 4,
          mobs: ['Sanglier'],
          icon: '📜',
          item: 'Page de chanson mâchonnée',
          text: 'Reprendre aux sangliers les pages de la chanson'
        },
        { k: 'spot', at: [2, 1], text: 'Trouver où se croisent les ombres des trois arbres et creuser (E)' },
        {
          k: 'hunt',
          mob: 'Sanglier',
          title: 'Dent-de-Cale, le gardien du coffre',
          at: [2, 2],
          icon: '🐗',
          label: 'Ouvrir le coffre',
          text: 'Vaincre le vieux sanglier qui dormait sur le coffre'
        }
      ],
      reward: { gold: 40, item: 'Rare', text: 'Le coffre secret (équipement Rare de ton niveau)' },
      talk: {
        offer: [
          'Ils disent que mon trésor n’existe pas. Pfff. La vieille chanson dit : « Là où trois ombres se tiennent la main, dort le coffre du marin. »',
          'La preuve ? Un sanglier l’a mangée. Enfin, presque toute. Retrouve les pages, suis l’ombre des trois chênes, et creuse !'
        ],
        active:
          'Reprends les pages aux sangliers, puis regarde les ombres des trois chênes : elles se croisent juste au-dessus du coffre.',
        ready:
          'Un coffre ! Encore un ! La chanson a plus de couplets que je ne croyais. Garde ce qu’il contient, moi je veux juste voir leur tête au camp.',
        after:
          'Chaque couplet de la chanson cache un coffre. Je dépose une demande à la guilde dès que je trouve le suivant.'
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
      summary:
        'Éloi, vieux pêcheur des Plaines verdoyantes : le poisson doré de son étang ne mord qu’au poisson frais, et seulement quand une onde brille d’or. Il lui faut trois poissons pour l’appât, puis quelqu’un qui sache ferrer au bon moment.',
      steps: [
        {
          k: 'work',
          job: 'fish',
          n: 3,
          text: 'Pêcher trois poissons pour l’appât, dans n’importe quelle eau'
        },
        {
          k: 'timing',
          text: 'Observer les ondulations de l’étang et pêcher le poisson doré (E au bon remous)'
        }
      ],
      reward: {
        gold: 50,
        fishXp: 120,
        recipe: 'dore',
        goldenFish: 2,
        text: 'Expérience de pêche, recette « Poisson doré en croûte de sel »'
      },
      talk: {
        offer: [
          'Le poisson doré ne mord pas au ver. Il lui faut du poisson frais. Trois prises, pêchées de ta main.',
          'Ensuite, regarde mon étang : quand une onde brille d’or, il est dessous. Approche-toi de ce remous et ferre (E) pendant qu’il brille !'
        ],
        active:
          'Trois poissons pour l’appât, pêchés n’importe où. Ensuite, regarde mon étang : quand un remous brille d’or, approche-toi et ferre (E).',
        ready:
          'Tu l’as eu ! Il y en a toujours un autre dans cet étang, tu sais. C’est pour ça que je reviens chaque matin.',
        after: 'Le poisson doré revient toujours. Quand il se montre, je fais passer le mot à la guilde.'
      }
    },
    // ---------------------------------------------------------------- Chapitre II
    {
      id: 6,
      chapter: 1,
      main: true,
      title: 'La mélodie des anciens',
      npc: 'sylva',
      site: 'q6',
      requires: 2,
      level: 12,
      summary:
        'Le Sanctuaire des Murmures, où dormait la première étoile, ne s’ouvre qu’à la mélodie des anciens. Mais des araignées étouffent la forêt sous leurs toiles.',
      steps: [
        {
          k: 'kill',
          n: 8,
          mobs: ['Araignée'],
          what: 'Araignée vaincue',
          text: 'Chasser les araignées de la forêt'
        },
        {
          k: 'pick',
          n: 4,
          spread: [4, 9],
          art: 'cocoon',
          icon: '🕸️',
          item: 'Cocon déchiré',
          label: 'Déchirer le cocon',
          ambush: ['Araignée', 1],
          text: 'Libérer les oiseaux chanteurs pris dans les cocons'
        },
        { k: 'collect', n: 4, text: 'Retrouver les quatre pierres musicales dans la forêt' },
        { k: 'puzzle', text: 'Jouer la mélodie des anciens sur le cercle de pierres' }
      ],
      reward: { gold: 120, flags: ['sanct_murmures'], text: 'Accès au Sanctuaire des Murmures' },
      talk: {
        offer: [
          'Orven t’envoie ? Alors tu cherches la première étoile. Elle dormait dans le Sanctuaire des Murmures, et le sanctuaire ne s’ouvre qu’à la mélodie des anciens.',
          'Mais les araignées ont tout envahi, comme si quelqu’un le leur avait demandé. Chasse-les, libère les oiseaux chanteurs pris dans leurs cocons, retrouve les quatre pierres musicales, puis joue au cercle : la plus grave, la plus aiguë, puis les deux du milieu, de la plus grave à la plus aiguë.'
        ],
        active:
          'Grave, aiguë, puis les deux du milieu de la plus grave à la plus aiguë. Écoute bien chaque pierre.',
        ready:
          'Le sanctuaire s’ouvre ! Mais l’autel est vide… L’étoile n’est plus là. Les arbres murmurent un nom : Aelor. Il veille sur l’arbre gardien aux racines d’or. Si quelqu’un sait où l’étoile est partie, c’est lui.',
        after:
          'L’étoile a quitté le sanctuaire. Va voir Aelor, près de l’arbre gardien aux racines d’or, dans la Forêt ancienne.'
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
      summary:
        'L’arbre gardien a recueilli la première étoile. Il dépérit : des gobelins le saignent la nuit et vendent sa sève d’or à la femme voilée.',
      steps: [
        {
          k: 'loot',
          n: 6,
          mobs: ['Gobelin'],
          icon: '🏺',
          item: 'Fiole de sève d’or',
          text: 'Reprendre la sève d’or aux gobelins'
        },
        {
          k: 'wave',
          waves: [3, 4, 5],
          mobs: ['Gobelin', 'Ours'],
          what: 'l’arbre gardien',
          icon: '🌳',
          art: 'roots',
          at: [2, 0],
          label: 'Verser la sève aux racines',
          text: 'Défendre l’arbre gardien pendant qu’il boit sa sève',
          world: ['goldtree']
        },
        { k: 'guardian', text: 'Vaincre Sylvenoir, l’écho de la forêt (E sur le sceau)' },
        { k: 'reach', at: [2, -1], text: 'Écouter l’arbre gardien' }
      ],
      reward: {
        gold: 160,
        flags: ['blessing', 'star1'],
        text: 'Bénédiction des racines d’or (cosmétique) et première étoile'
      },
      talk: {
        offer: [
          'La première étoile ? Elle s’est réfugiée dans l’arbre gardien, quand le sanctuaire s’est tu. Mais l’arbre dépérit : les gobelins percent son écorce et vendent sa sève à une femme voilée.',
          'Reprends la sève aux gobelins et verse-la à ses racines. Ils reviendront la chercher : tiens bon le temps qu’il la boive. Quand il aura repris des forces, il te confiera l’étoile.'
        ],
        active:
          'Les gobelins rôdent partout dans la Forêt ancienne. La sève brille dans leurs fioles, tu ne peux pas la manquer.',
        ready:
          'Il t’a parlé, et il t’a confié l’étoile. Une sur six ! La femme voilée s’appelle Vesper, dit l’arbre, et elle veut éteindre les étoiles. La deuxième dort dans le marais, au Sanctuaire des Reflets. Maëline y entretient les lanternes : elle te montrera le chemin.',
        after:
          'Une étoile sur six. La suivante dort au Sanctuaire des Reflets, dans le Marais brumeux. Va voir Maëline et ses lanternes.'
      },
      verse: 'La racine écoute, la feuille répond, l’or coule en silence sous les troncs profonds.',
      memory:
        'L’arbre gardien : « Petite étincelle, te voilà revenue. Une autre est venue avant toi, la voilée. Elle chantait, jadis. Maintenant elle cherche les étoiles pour les éteindre. Trouve-les avant elle. »'
    },
    {
      id: 8,
      chapter: 1,
      main: false,
      title: 'Le chemin des lucioles',
      npc: 'nima',
      site: 'q8',
      level: 13,
      summary:
        'Nima, de la Forêt ancienne : les fées ont encore retourné les panneaux du bosquet, et les voyageurs s’y perdent. Seules les lucioles connaissent le vrai chemin : il faut en attraper trois et les suivre jusqu’à la pierre de passage.',
      steps: [
        {
          k: 'chase',
          n: 3,
          art: 'firefly',
          who: 'Luciole farceuse',
          label: 'Attraper la luciole',
          at: [0, 10],
          text: 'Attraper trois lucioles farceuses devant le bosquet'
        },
        {
          k: 'reach',
          at: [0, -8],
          text: 'Traverser le labyrinthe en suivant les lucioles (pas les panneaux)'
        }
      ],
      reward: {
        gold: 90,
        flags: ['shortcut'],
        text: 'Raccourci forestier : une pierre de passage vers le Camp de l’Aurore'
      },
      talk: {
        offer: [
          'Ce bosquet est un labyrinthe. Les panneaux ? Une farce des fées : ils mentent tous.',
          'Attrape trois lucioles et elles t’aideront. Suis-les jusqu’à la vieille pierre de passage, de l’autre côté.'
        ],
        active:
          'Attrape trois lucioles devant le bosquet, puis suis-les. Surtout, ne lis pas les panneaux : les fées les ont retournés.',
        ready:
          'Te voilà de l’autre côté ! La pierre de passage te ramène au camp quand tu veux (E). Les fées vont encore bouder.',
        after:
          'Les fées retournent les panneaux tous les quelques jours. Si le bosquet se remet à mentir, je préviendrai la guilde.'
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
      summary:
        'Brin, voyageur de la Forêt ancienne : ses provisions disparaissent chaque nuit, et il ne voit que de toutes petites empreintes. Il faut suivre la piste, attraper le voleur et décider de son sort.',
      steps: [
        { k: 'trail', text: 'Suivre les petites empreintes (elles n’apparaissent que de près)' },
        {
          k: 'chase',
          n: 1,
          art: 'thief',
          who: 'Le voleur',
          label: 'Attraper le voleur',
          at: [5, -4],
          text: 'Rattraper le voleur avant qu’il ne disparaisse'
        },
        { k: 'choice', text: 'Décider du sort du petit voleur' }
      ],
      reward: { gold: 110, item: 'Rare', text: 'Or et équipement Rare de ton niveau' },
      talk: {
        offer: [
          'On me vole mes provisions ! Des pommes, du fromage, même mes biscuits au miel.',
          'Je ne vois jamais personne. Mais il y a de toutes petites empreintes… Tu veux bien enquêter ?'
        ],
        active:
          'Les empreintes partent de mon sac. Regarde par terre, de près : elles n’apparaissent qu’à quelques pas.',
        ask: 'Un… caméléon-renard ? Avec les joues pleines de mon miel ? Dis-moi, toi qui l’as attrapé : j’en fais quoi ?',
        ready: 'Bon, c’est décidé. Merci d’avoir tiré ça au clair : la guilde te paiera pour moi.',
        after: 'Le petit voleur vient manger dans ma main maintenant. On est amis.',
        afterChoice: [
          'Le petit voleur vient manger dans ma main maintenant. On est amis.',
          'Il travaille pour payer ses dettes : il garde mon sac. Je n’ai jamais eu de meilleur gardien.'
        ]
      },
      choices: ['Lui laisser un biscuit chaque soir', 'L’engager comme gardien du sac']
    },
    {
      id: 10,
      chapter: 1,
      main: false,
      title: 'Le peintre des ombres',
      npc: 'theon',
      site: 'q10',
      level: 17,
      summary:
        'Théon, peintre de la Forêt ancienne : d’un endroit précis, l’ombre de son vieil arbre prend la forme d’un oiseau. Pour la peindre, il lui faut des herbes pour ses couleurs, des poils de chauve-souris pour ses pinceaux, et quelqu’un pour retrouver le bon endroit.',
      steps: [
        { k: 'work', job: 'herb', n: 3, text: 'Cueillir trois herbes pour les pigments' },
        {
          k: 'loot',
          n: 5,
          mobs: ['Chauve-souris'],
          icon: '🖌️',
          item: 'Touffe de poils fins',
          text: 'Prendre des poils de chauve-souris pour les pinceaux'
        },
        {
          k: 'spot',
          at: [-1, -3],
          text: 'Trouver le point d’observation où l’ombre de l’arbre devient un oiseau (E)'
        }
      ],
      reward: { gold: 90, item: 'Rare', text: 'Équipement Rare de ton niveau' },
      talk: {
        offer: [
          'Un jour, d’un endroit précis, l’ombre de ce vieil arbre est devenue un oiseau. Un oiseau parfait !',
          'Il me faut des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Et l’endroit : « au nord de l’arbre, un pas à l’ouest ». Appelle-moi (E) quand tu y es.'
        ],
        active:
          'Des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Puis l’endroit : au nord de l’arbre, un pas à l’ouest. Appelle-moi (E) quand tu y es.',
        ready:
          'Le voilà, mon oiseau d’ombre ! Il change avec les saisons, alors je le repeins souvent. Merci, l’ami.',
        after:
          'L’ombre de l’arbre change avec la lumière. Quand mes couleurs s’épuisent, je repasse par la guilde.'
      }
    },
    // ---------------------------------------------------------------- Chapitre III
    {
      id: 11,
      chapter: 2,
      main: true,
      title: 'Les lanternes perdues',
      npc: 'maeline',
      site: 'q11',
      requires: 7,
      level: 22,
      summary:
        'Les lanternes de Maëline guidaient les voyageurs jusqu’au Sanctuaire des Reflets, où dort la deuxième étoile. Elles se sont toutes éteintes en une nuit.',
      steps: [
        {
          k: 'loot',
          n: 6,
          mobs: ['Wisp'],
          icon: '🔥',
          item: 'Flamme volée',
          text: 'Reprendre les flammes volées par les feux follets'
        },
        {
          k: 'pick',
          n: 4,
          at: [
            [-3, -2],
            [-1, -3],
            [1, -3],
            [3, -2]
          ],
          art: 'lantern',
          keep: true,
          icon: '🏮',
          item: 'Lanterne rallumée',
          label: 'Rallumer la lanterne',
          ambush: ['Wisp', 1],
          text: 'Rallumer les quatre lanternes'
        },
        {
          k: 'wave',
          waves: [3, 4, 5],
          mobs: ['Wisp', 'Mante des roseaux', 'Araignée venimeuse'],
          what: 'les lanternes',
          icon: '🏮',
          art: 'lantern',
          at: [0, 1],
          label: 'Lever la grande lanterne',
          text: 'Défendre les lanternes jusqu’à l’aube',
          world: ['lanterns', 'sanct_reflets']
        }
      ],
      reward: { gold: 200, flags: ['sanct_reflets'], text: 'Passage vers le Sanctuaire des Reflets' },
      talk: {
        offer: [
          'Tu cherches le Sanctuaire des Reflets ? Mes lanternes en montraient le chemin. Elles se sont toutes éteintes la même nuit, et trois voyageurs ne sont pas rentrés.',
          'Les feux follets ont avalé leurs flammes. Reprends-les-leur, rallume les quatre lanternes, et défends-les jusqu’à l’aube : le marais n’aime pas la lumière.'
        ],
        active: 'Une flamme avalée par un feu follet ne s’éteint pas. Il faut seulement la lui reprendre.',
        ready:
          'Elles brillent toutes ! J’ai vu des silhouettes au visage voilé s’enfuir : Vesper n’est plus seule. Et regarde, les lanternes tracent le chemin du Sanctuaire des Reflets. Néris garde ses vieux miroirs : elle t’attend là-bas.',
        after: 'Le chemin du Sanctuaire des Reflets est éclairé. Néris t’attend près des vieux miroirs.'
      },
      memory:
        'Dans la boue, une broche en forme de voile. Vesper n’est plus seule : des gens la suivent et se font appeler la Confrérie du Voile.'
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
      summary:
        'Les miroirs du Sanctuaire des Reflets montraient le passé. Les Voilés les ont brisés pour cacher la vérité sur Vesper. La deuxième étoile est derrière eux.',
      steps: [
        {
          k: 'pick',
          n: 4,
          spread: [4, 9],
          icon: '🪞',
          item: 'Éclat de miroir',
          label: 'Ramasser l’éclat',
          ambush: ['Basilic', 1],
          text: 'Retrouver les éclats des miroirs brisés'
        },
        {
          k: 'pick',
          n: 4,
          at: [
            [-3, -1],
            [-1, -1],
            [1, -1],
            [3, -1]
          ],
          art: 'frame',
          keep: true,
          icon: '🪞',
          item: 'Miroir réparé',
          label: 'Réparer le miroir',
          panels: [
            'Le premier miroir : les anciens chantent autour du Cœur de l’Aurore. Deux voix mènent le chœur, un frère et une sœur. Auralis et Vesper.',
            'Le deuxième miroir : une ombre immense monte de la mer. Elle se nourrit de lumière. Vesper est la seule à ne pas reculer : elle écoute.',
            'Le troisième miroir : le Cœur se brise en six étoiles pour échapper à l’Ombre. Vesper hurle. On ne l’a pas prévenue.',
            'Le dernier miroir : six sanctuaires s’allument sur l’île. Vesper est restée du mauvais côté de la mer, seule avec l’Ombre.'
          ],
          text: 'Remettre les éclats dans leurs cadres et regarder'
        },
        {
          k: 'hunt',
          mob: 'Spectre',
          title: 'Le Reflet menteur',
          at: [0, 2],
          icon: '🪞',
          label: 'Regarder ton reflet',
          text: 'Affronter le reflet qui ne te ressemble pas'
        },
        { k: 'guardian', text: 'Vaincre Miroitombe, l’écho des reflets (E sur le sceau)' }
      ],
      reward: { gold: 240, flags: ['star2'], text: 'Deuxième étoile et un souvenir dans le journal' },
      talk: {
        offer: [
          'Ces miroirs se souvenaient de tout. Une nuit, des hommes voilés les ont brisés, un par un. Ils ne voulaient pas qu’on voie ce qu’ils montrent : l’histoire de Vesper.',
          'Retrouve les éclats et remets-les dans leurs cadres. Quand les miroirs seront entiers, le sanctuaire te rendra la deuxième étoile. Méfie-toi : un miroir brisé a parfois un reflet qui ne te ressemble pas.'
        ],
        active: 'Les basilics adorent ce qui brille. Méfie-toi quand tu ramasses un éclat.',
        ready:
          'Alors c’était ça… Vesper chantait avec les anciens. Ils ont endormi le Cœur pour le sauver, et ils l’ont oubliée au large. Elle croit qu’on l’a trahie. Voici la deuxième étoile : deux sur six. La troisième dort dans la Forêt automnale, où Érable garde un village oublié.',
        after:
          'Deux étoiles sur six. La troisième est dans la Forêt automnale : Érable t’y attend, dans les ruines du village aux feuilles dorées.'
      },
      verse: 'L’eau garde un visage que l’eau n’a pas pris ; qui regarde longtemps s’y trouve, et sourit.',
      memory:
        'Le miroir des souvenirs : les anciens vivaient en paix autour du Cœur de l’Aurore, guidés par deux chanteurs, Auralis et sa sœur Vesper. Une ombre est venue de la mer. Ils ont brisé le Cœur en six étoiles pour le sauver. Vesper, restée au large, a entendu le silence tomber. Elle n’a jamais su que c’était un sacrifice. Elle a cru à une trahison.'
    },
    {
      id: 13,
      chapter: 2,
      main: false,
      title: 'Le pont qui ne tient jamais',
      npc: 'goran',
      site: 'q13',
      level: 23,
      summary:
        'Goran, bâtisseur du Marais brumeux : les bêtes du marais rongent encore son pont. Il lui faut des planches échouées, des tendons de mante pour les cordes, et quelqu’un pour tenir les bêtes à distance pendant qu’il cloue.',
      steps: [
        {
          k: 'pick',
          n: 6,
          spread: [6, 11],
          art: 'plank',
          icon: '🪵',
          item: 'Planche solide',
          label: 'Ramasser la planche',
          text: 'Ramasser des planches échouées autour de l’étang'
        },
        {
          k: 'loot',
          n: 5,
          mobs: ['Mante des roseaux'],
          icon: '🧵',
          item: 'Tendon de mante',
          text: 'Prendre des tendons de mante pour les cordes'
        },
        {
          k: 'wave',
          waves: [3, 4],
          mobs: ['Mante des roseaux', 'Basilic'],
          what: 'le pont',
          icon: '🔨',
          art: 'barrel',
          at: [-4, 1],
          label: 'Commencer les travaux',
          text: 'Défendre le pont pendant que Goran cloue',
          world: ['bridge']
        }
      ],
      reward: { gold: 160, flags: ['bridge'], text: 'Le pont restauré pour toujours' },
      talk: {
        offer: [
          'Mon pont ? Une catastrophe. Onze fois que je le reconstruis. Onze fois !',
          'Cette fois, on fait ça bien : de vraies planches, de vraies cordes. Et toi, avec ton arme, entre les bêtes et moi pendant que je cloue.'
        ],
        active:
          'Des planches bien droites autour de l’étang, des tendons de mante pour les cordes. Ensuite, reste entre les bêtes et moi pendant que je cloue.',
        ready: 'Il tient ! Encore une fois ! Les mantes finiront par se lasser avant moi. Merci, l’ami.',
        after: 'Le Pont qui Tient tient… jusqu’à la prochaine mante affamée. Je laisserai un mot à la guilde.'
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
      summary:
        'Un esprit amical erre dans le Marais brumeux. Il oublie son nom à chaque nouvelle lune, et sans nom il ne peut pas faire sa tournée. Il faut interroger les habitants et les objets du marais, lui rendre son nom et l’accompagner.',
      steps: [
        { k: 'clues', n: 4, text: 'Interroger les habitants et examiner les objets du marais (4 indices)' },
        { k: 'choice', text: 'Rendre son nom à l’esprit' },
        {
          k: 'escort',
          art: 'ghost',
          who: 'Ilian',
          from: [0, -2],
          to: [0, 12],
          ambush: [
            ['Wisp', 2],
            ['Wisp', 3]
          ],
          label: 'Accompagner Ilian',
          text: 'Accompagner Ilian pour sa dernière tournée'
        }
      ],
      reward: { gold: 150, item: 'Épique', text: 'Équipement Épique de ton niveau' },
      talk: {
        offer: [
          'Bouuh… pardon. Je ne voulais pas te faire peur. J’ai oublié mon nom, tu sais. Ça arrive, quand on est mort depuis longtemps.',
          'Les gens d’ici et les objets du marais se souviennent peut-être de moi. Tu veux bien chercher ?'
        ],
        active:
          'Une lanterne, une barque, un vieux chapeau… et les habitants. Quelqu’un se souvient forcément.',
        ask: 'Alors… tu sais qui j’étais ?',
        ready:
          'Ilian le lanternier. Oui, c’était moi. Merci d’avoir fait la tournée avec moi. À la prochaine lune, je l’aurai sans doute encore oublié…',
        after:
          'Je m’appelle… Ilian, je crois. À chaque nouvelle lune, ça m’échappe encore. Si je l’oublie, la guilde saura où me trouver.'
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
      summary:
        'Pipo, enfant du Marais brumeux : Gobe-Tout, le vieux basilic de l’étang, a encore avalé la clé du coffre de l’îlot. Il faut attirer le basilic en chassant les siens, le vaincre pour reprendre la clé, puis traverser sur les nénuphars qui coulent.',
      steps: [
        {
          k: 'kill',
          n: 6,
          mobs: ['Basilic'],
          what: 'Basilic vaincu',
          text: 'Attirer le vieux basilic en chassant les siens'
        },
        {
          k: 'hunt',
          mob: 'Basilic',
          title: 'Gobe-Tout, le basilic glouton',
          at: [-5, -2],
          icon: '🗝️',
          label: 'Appeler Gobe-Tout',
          text: 'Vaincre Gobe-Tout et récupérer la clé'
        },
        {
          k: 'reach',
          at: [4, 0],
          text: 'Traverser l’étang sur les nénuphars sans t’arrêter et ouvrir le coffre de l’îlot'
        }
      ],
      reward: { gold: 120, item: 'Épique', text: 'Le coffre caché (équipement Épique de ton niveau)' },
      talk: {
        offer: [
          'Il y a un coffre sur l’îlot ! J’avais la clé, mais Gobe-Tout l’a gobée. Il gobe tout. C’est pour ça qu’il s’appelle comme ça.',
          'Après, saute de nénuphar en nénuphar sans t’arrêter. Si tu tombes, l’eau te ramène sur la rive. Promis, je ne rirai pas !'
        ],
        active:
          'Chasse les basilics pour faire sortir Gobe-Tout, reprends-lui la clé, puis saute de nénuphar en nénuphar sans t’arrêter !',
        ready:
          'Tu l’as fait ! Hi hi, tu sens le basilic. Gobe-Tout avale tout ce qui brille, alors il y aura sûrement une prochaine fois.',
        after: 'Je m’entraîne à sauter. Et Gobe-Tout a déjà avalé ma nouvelle clé…'
      }
    },
    // ---------------------------------------------------------------- Chapitre IV
    {
      id: 16,
      chapter: 3,
      main: true,
      title: 'Le village des feuilles dorées',
      npc: 'erable',
      site: 'q16',
      requires: 12,
      level: 32,
      summary:
        'La troisième étoile dort sous les feuilles d’un village oublié de la Forêt automnale. La Confrérie du Voile pille ses ruines pour la trouver avant toi.',
      steps: [
        { k: 'collect', n: 4, text: 'Toucher les quatre feuilles dorées pour voir les souvenirs du village' },
        {
          k: 'kill',
          n: 8,
          mobs: ['Pilleur', 'Bandit'],
          what: 'Voilé mis en fuite',
          text: 'Chasser les pilleurs et les bandits de la Confrérie'
        },
        {
          k: 'loot',
          n: 4,
          mobs: ['Pilleur', 'Bandit'],
          icon: '🎒',
          item: 'Objet du village',
          text: 'Reprendre ce qu’ils ont volé au village'
        },
        {
          k: 'pick',
          n: 4,
          at: [
            [-4, -2],
            [4, -2],
            [-4, 2],
            [4, 2]
          ],
          art: 'house',
          keep: true,
          icon: '🏚️',
          item: 'Maison rendue à elle-même',
          label: 'Rendre l’objet à la maison',
          text: 'Rendre à chaque maison ce qui lui appartient',
          world: ['sanct_saisons']
        }
      ],
      reward: {
        gold: 280,
        flags: ['star3', 'sanct_saisons'],
        text: 'Troisième étoile et accès à la Bibliothèque des Saisons'
      },
      talk: {
        offer: [
          'Ici vivait un village, avant l’Ombre. Ses maisons sont tombées, mais les feuilles dorées se souviennent de tout, et la troisième étoile dort sous elles.',
          'Les Voilés fouillent les ruines et emportent les souvenirs des maisons. Touche les feuilles pour voir le village, chasse les pilleurs, reprends ce qu’ils ont volé et rends-le à chaque maison. Quand le village se souviendra de lui-même, l’étoile se lèvera.'
        ],
        active:
          'Les pilleurs de la Confrérie rôdent dans toute la Forêt automnale. Ils cherchent l’étoile sans savoir qu’elle est sous leurs pieds.',
        ready:
          'Le village se souvient… et l’étoile se lève des feuilles ! Trois sur six. Mais une question demeure : pourquoi les anciens ont-ils endormi le Cœur, et comment le réveiller ? Solenne garde la fresque des saisons, près des grands érables. Elle le sait peut-être.',
        after:
          'Trois étoiles sur six. Solenne garde la fresque des saisons : elle sait pourquoi le Cœur s’est endormi.'
      },
      memory:
        'Les feuilles dorées : un village heureux, une forge, un four, une cloche et une harpe. Quand l’ombre vint, les villageois partirent vers les sanctuaires… en laissant tout derrière eux.'
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
      summary:
        'La fresque des saisons raconte pourquoi les anciens ont endormi le Cœur. Elle est en morceaux, et les esprits des saisons la gardent.',
      steps: [
        { k: 'collect', n: 4, text: 'Retrouver les quatre fragments de la fresque' },
        {
          k: 'wave',
          waves: [3, 3, 4, 4],
          seasons: ['Fée sauvage', 'Élémentaire', 'Corbeau spectral', 'Serpent des glaces'],
          mobs: ['Corbeau spectral'],
          what: 'la fresque',
          icon: '🍂',
          art: 'pillar',
          at: [0, 0],
          label: 'Assembler la fresque',
          text: 'Tenir tête aux quatre saisons, l’une après l’autre',
          world: ['archives']
        },
        { k: 'guardian', text: 'Vaincre Fanegrise, l’écho de l’automne (E sur le sceau)' }
      ],
      reward: {
        gold: 320,
        flags: ['archives'],
        text: 'Accès aux archives anciennes (un souvenir dans le journal)'
      },
      talk: {
        offer: [
          'La fresque des saisons dit pourquoi le Cœur s’est endormi. Elle est en quatre morceaux : rassemble-les et repose-les au centre du cercle.',
          'Les esprits du printemps, de l’été, de l’automne et de l’hiver viendront voir qui ose. Ils ne sont pas méchants : ils ont peur. Tiens bon.'
        ],
        active: 'Les fragments sont au nord, à l’est, au sud et à l’ouest. Comme les saisons.',
        ready:
          'Les archives parlent : « Le Cœur fut endormi pour que l’Ombre ne le dévore pas. » Mais personne n’a écrit comment le réveiller… sauf une main, dans la marge : « Moi, je m’en souviens. » Vesper. Les anciens ont laissé une machine sous le désert, dans la Cité des Étoiles : elle saura. Sahir connaît le chemin.',
        after:
          'Pour savoir comment réveiller le Cœur, il faut la machine de la Cité des Étoiles, sous le Désert oublié. Sahir connaît les obélisques qui en gardent l’entrée.'
      },
      verse: 'Quatre saisons tournent autour d’un seul nom ; la feuille qui tombe est encore une chanson.',
      memory:
        'Les archives des saisons : l’Ombre se nourrissait de lumière. Pour l’affamer, les anciens endormirent le Cœur et cachèrent ses six étoiles. Quand l’Ombre disparut, plus personne ne se souvenait comment le réveiller. Dans la marge, une autre main a écrit : « Moi, je m’en souviens. »'
    },
    {
      id: 18,
      chapter: 3,
      main: false,
      title: 'Le concours des feuilles',
      npc: 'flavio',
      site: 'q18',
      level: 33,
      summary:
        'Flavio, de la Forêt automnale, organise un concours à chaque saison et cherche des concurrents : une course à travers les érables, puis la feuille dorée à attraper au vol.',
      steps: [
        { k: 'race', n: 6, spread: [6, 11], text: 'Courir la boucle du concours avant la fin du temps' },
        { k: 'catch', text: 'Attraper la feuille dorée dans le vent (E quand elle est sur toi)' }
      ],
      reward: { gold: 220, item: 'Épique', text: 'Équipement Épique de ton niveau' },
      talk: {
        offer: [
          'Le grand concours d’automne ! Première épreuve : la boucle des érables. Six fanions, et le temps file.',
          'Deuxième épreuve : une feuille dorée danse dans le vent. Ne la poursuis pas, devine où elle va. E quand elle passe sur toi !'
        ],
        active:
          'Touche les six fanions avant la fin du temps. Pour la feuille, ne la poursuis pas : devine où le vent l’emmène, et E quand elle passe sur toi.',
        ready:
          'Champion ! Garde la feuille, elle ne fanera jamais. Reviens au prochain concours : je compte bien te battre.',
        after: 'Le prochain concours approche. Je l’annoncerai au tableau de la guilde.'
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
      summary:
        'Odel, meunier de la Forêt automnale : les trolls lui ont encore volé ses engrenages pour s’en faire des colliers. Depuis, son moulin tourne à l’envers, le grain s’entasse au grenier, et une grosse bête y a fait son nid.',
      steps: [
        {
          k: 'loot',
          n: 3,
          chance: 0.5,
          mobs: ['Troll'],
          icon: '⚙️',
          item: 'Engrenage',
          text: 'Reprendre les engrenages aux trolls'
        },
        {
          k: 'pick',
          n: 3,
          at: [
            [-2, 0],
            [0, 0],
            [2, 0]
          ],
          art: 'gear',
          keep: true,
          icon: '⚙️',
          item: 'Engrenage remonté',
          label: 'Remonter l’engrenage',
          text: 'Remonter les engrenages du moulin',
          world: ['grenier']
        },
        {
          k: 'hunt',
          mob: 'Corbeau spectral',
          title: 'Scrr-Scrr, la terreur du grenier',
          at: [4, 2],
          icon: '🪶',
          label: 'Ouvrir le grenier',
          text: 'Déloger ce qui fait « scrr-scrr » dans le grenier'
        }
      ],
      reward: {
        gold: 300,
        flags: ['grenier'],
        item: 'Épique',
        text: 'Or et le coffre du grenier (équipement Épique)'
      },
      talk: {
        offer: [
          'Les trolls m’ont pris trois engrenages. Des colliers ! Ils en font des colliers ! Et mon moulin tourne à l’envers.',
          'Reprends-les, remonte-les. Et tant que tu y es… quelque chose fait « scrr-scrr » dans mon grenier. Je préfère ne pas savoir.'
        ],
        active:
          'Reprends mes engrenages aux trolls, remonte-les dans le moulin, puis chasse la bête qui mange mon grain au grenier.',
        ready:
          'Il tourne dans le bon sens, et le grenier est calme. Les trolls finiront par revenir, ils adorent ce qui brille. Merci !',
        after:
          'Ma farine est fine comme de la poussière d’étoile. Si les trolls reviennent, la guilde le saura.'
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
      summary:
        'Trois voyageurs campent dans la Forêt automnale : un renard magique leur vole leurs provisions, et ils ne sont jamais d’accord sur l’endroit où il se cache. Il faut écouter leurs témoignages, trouver la cachette et rattraper le renard.',
      steps: [
        { k: 'clues', n: 3, text: 'Écouter les trois témoignages' },
        { k: 'search', text: 'Fouiller la bonne cachette (E)' },
        {
          k: 'chase',
          n: 1,
          art: 'fox',
          who: 'Malice',
          label: 'Attraper le renard',
          at: [-4, -2],
          text: 'Rattraper le renard magique'
        }
      ],
      reward: { gold: 260, item: 'Épique', text: 'La cachette secrète du renard (équipement Épique)' },
      talk: {
        offer: [
          'Un renard qui brille ! Il a filé avec nos provisions. Chacun de nous l’a vu, mais pas au même endroit…',
          'Écoute-nous tous les trois, compare, et trouve sa cachette. Attention, l’un de nous se trompe souvent.'
        ],
        active: 'Deux de nos témoignages sont vrais. Le troisième… c’est Gaspard, il voit mal.',
        ready:
          'La cachette ! Et nos provisions… Ce renard est malin : il trouvera une autre cachette, c’est sûr.',
        after: 'Malice, le renard, change de cachette à chaque lune. On laisse toujours un mot à la guilde.'
      },
      witnesses: true
    },
    // ---------------------------------------------------------------- Chapitre V
    {
      id: 21,
      chapter: 4,
      main: true,
      title: 'La cité sous les sables',
      npc: 'sahir',
      site: 'q21',
      requires: 17,
      level: 42,
      summary:
        'Trois obélisques gardent l’entrée de la Cité des Étoiles, où dorment la quatrième étoile et la machine des anciens. Les morts de la cité en barrent la route.',
      steps: [
        {
          k: 'kill',
          n: 10,
          mobs: ['Squelette'],
          what: 'Veilleur renvoyé au sable',
          text: 'Renvoyer au sable les veilleurs de la cité'
        },
        {
          k: 'pick',
          n: 3,
          at: [
            [-5, 0],
            [5, 0],
            [0, 5]
          ],
          art: 'obelisk',
          keep: true,
          icon: '🗿',
          item: 'Obélisque dégagé',
          label: 'Dégager l’obélisque',
          ambush: ['Squelette', 2],
          text: 'Dégager les trois obélisques ensevelis'
        },
        {
          k: 'hunt',
          mob: 'Chevalier déchu',
          title: 'Rakhem, le gardien sans visage',
          at: [0, 1],
          icon: '✦',
          label: 'Poser la main sur l’étoile gravée',
          text: 'Vaincre le gardien qui barre l’escalier',
          world: ['cite', 'sanct_etoiles']
        }
      ],
      reward: {
        gold: 380,
        flags: ['star4', 'sanct_etoiles'],
        text: 'Quatrième étoile et accès à la Cité des Étoiles'
      },
      talk: {
        offer: [
          'La Cité des Étoiles ? Trois obélisques en gardent l’entrée, sous le sable. La quatrième étoile y dort, et la machine des anciens aussi.',
          'Mais les morts se sont relevés depuis le passage de la Confrérie. Renvoie-les au sable, dégage les trois obélisques et vaincs le gardien de l’escalier.'
        ],
        active:
          'Les squelettes ne sont pas cruels. Ils obéissent à un ordre vieux de mille ans : « Ne laissez entrer personne. »',
        ready:
          'Le sable s’effondre… un escalier ! La Cité des Étoiles, et sa lumière : la quatrième étoile ! Quatre sur six. En bas, Astéria étudie la vieille machine. Elle a besoin de toi pour la faire parler.',
        after:
          'Quatre étoiles sur six. Descends dans la Cité des Étoiles : Astéria t’y attend avec la machine des anciens.'
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
      summary:
        'Sous la Cité des Étoiles, une machine des anciens sait comment réveiller le Cœur. Il lui faut du verre solaire, et quelqu’un pour la défendre quand elle s’éveille.',
      steps: [
        {
          k: 'loot',
          n: 4,
          mobs: ['Drake des dunes'],
          icon: '🔶',
          item: 'Écaille de verre solaire',
          text: 'Prendre des écailles de verre aux drakes des dunes'
        },
        {
          k: 'pick',
          n: 3,
          at: [
            [-2, 3],
            [0, 3],
            [2, 3]
          ],
          art: 'lever',
          keep: true,
          icon: '⚙️',
          item: 'Anneau lancé',
          label: 'Lancer l’anneau',
          ambush: ['Scorpion', 2],
          text: 'Lancer les trois anneaux de la machine'
        },
        {
          k: 'wave',
          waves: [3, 4, 5],
          mobs: ['Scorpion', 'Squelette', 'Minotaure'],
          what: 'la machine',
          icon: '⚙️',
          art: 'barrel',
          at: [0, 4],
          label: 'Allumer la machine',
          text: 'Défendre la machine pendant qu’elle chauffe',
          world: ['machine']
        },
        { k: 'guardian', text: 'Vaincre Sablamort, l’écho des dunes (E sur le sceau)' }
      ],
      reward: {
        gold: 460,
        flags: ['star5'],
        item: 'Épique',
        text: 'Cinquième étoile et la salle du trésor (équipement Épique)'
      },
      talk: {
        offer: [
          'Cette machine a été faite pour une seule chose : dire comment réveiller le Cœur. Trois anneaux, six symboles chacun. Quand ils tournent ensemble, elle parle.',
          'Il lui faut du verre solaire, et les drakes des dunes le portent sur le dos. Une fois lancée, elle fera du bruit. Beaucoup de bruit. Tout le désert viendra : il faudra la défendre.'
        ],
        active: 'Les drakes des dunes muent souvent. Ceux qui muent sont de mauvaise humeur.',
        ready:
          'Elle parle : « Réunissez les six étoiles dans le sanctuaire central, et qu’une étincelle du Cœur chante avec elles. » Une étincelle du Cœur… c’est Lumi ! La cinquième étoile était dans la machine : cinq sur six. Lumi connaît le chemin du sanctuaire central, dans la Forêt enchantée. Et Vesper aussi, maintenant : elle écoutait derrière un pilier.',
        after:
          'Cinq étoiles sur six. Suis Lumi dans la Forêt enchantée, jusqu’au Sanctuaire des Six Lumières. Vesper y va aussi.'
      },
      verse: 'Le sable a tout bu, sauf l’étoile et le soir ; marche, voyageur, la nuit n’est pas le noir.',
      memory:
        'La machine de l’Aurore : pour réveiller le Cœur, il faut réunir les six étoiles dans le sanctuaire central, puis qu’une étincelle du Cœur lui-même chante avec elles. Derrière un pilier, une femme voilée écoutait. Elle est partie sans se battre.'
    },
    {
      id: 23,
      chapter: 4,
      main: false,
      title: 'Le marchand qui vendait du vent',
      npc: 'zafir',
      site: 'q23',
      level: 43,
      summary:
        'Zafir, marchand du Désert oublié, vend du vent en bouteille. Ses tourbillons se sont échappés, les drakes des dunes les avalent, et il veut offrir une bouteille de brise à Amira, à l’oasis, pour se faire pardonner une vieille dette.',
      steps: [
        {
          k: 'chase',
          n: 4,
          art: 'whirl',
          who: 'Tourbillon',
          label: 'Mettre en bouteille',
          text: 'Remettre quatre tourbillons en bouteille'
        },
        {
          k: 'kill',
          n: 6,
          mobs: ['Drake des dunes'],
          what: 'Drake mis en fuite',
          text: 'Éloigner les drakes qui respirent la marchandise'
        },
        {
          k: 'talk',
          npc: 'amira',
          lines: [
            'Une bouteille de brise, de la part de Zafir ? Il me doit de l’argent depuis trois ans, et il m’envoie du vent.',
            'Oh… mais c’est du vrai. Il sent la mer. Dis-lui que nous sommes quittes. Et que… non, rien. Dis-lui juste merci.'
          ],
          text: 'Livrer une bouteille de brise à Amira, à l’oasis'
        }
      ],
      reward: { gold: 330, item: 'Épique', text: 'Équipement Épique de ton niveau' },
      talk: {
        offer: [
          'Du vent du nord, du sud, de l’est, de l’ouest ! Tu ne me crois pas ? Regarde-le courir, il s’est échappé !',
          'Rattrape mes tourbillons, éloigne les drakes qui les respirent, et porte une bouteille à Amira. Discrètement. C’est un cadeau.'
        ],
        active:
          'Remets mes tourbillons en bouteille, chasse les drakes qui les avalent, puis porte une bouteille de brise à Amira, à l’oasis. Discrètement : c’est un cadeau.',
        ready:
          'Elle a souri ? Elle a SOURI ? Je lui en enverrai une autre à la prochaine lune. Merci, l’ami du vent.',
        after: 'Chaque lune, j’envoie une bouteille à Amira. Et chaque lune, mes tourbillons s’échappent.'
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
      summary:
        'Noura, prêtresse du Désert oublié : le sable a encore dérangé les miroirs du petit temple, et sa porte ne s’ouvre qu’au rayon du soleil. Il faut orienter les miroirs, puis calmer Néfer, la gardienne, que la lumière réveille.',
      steps: [
        { k: 'puzzle', text: 'Orienter les miroirs pour diriger le rayon solaire sur la porte' },
        {
          k: 'hunt',
          mob: 'Squelette',
          title: 'Néfer, la gardienne du rayon',
          at: [2, -2],
          icon: '☀️',
          label: 'Franchir la porte',
          text: 'Vaincre la gardienne du temple'
        }
      ],
      reward: { gold: 360, item: 'Épique', text: 'Le coffre du temple (équipement Épique)' },
      talk: {
        offer: [
          'Ce temple garde un coffre depuis mille ans. Sa porte attend un rayon de soleil.',
          'Quatre miroirs, un rayon. Tourne-les (E), et suis la lumière jusqu’au soleil gravé sur la porte. Puis salue Néfer. Elle déteste être réveillée.'
        ],
        active:
          'Tourne les miroirs (E) et suis le rayon depuis la pierre solaire jusqu’au soleil de la porte. Puis calme Néfer : elle déteste être réveillée.',
        ready:
          'La porte est ouverte et Néfer dort de nouveau. Les tempêtes déplacent les miroirs à chaque saison : reviens quand la guilde t’enverra.',
        after: 'Je prie ici chaque matin. Quand une tempête dérange les miroirs, j’écris à la guilde.'
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
      summary:
        'Amira, de l’oasis du Désert oublié : les scorpions ont encore fait leurs nids dans l’aqueduc, l’eau n’arrive plus et les porteurs n’osent plus sortir. Il faut chasser les scorpions, détruire les nids et escorter un porteur jusqu’au bassin.',
      steps: [
        {
          k: 'kill',
          n: 10,
          mobs: ['Scorpion'],
          what: 'Scorpion vaincu',
          text: 'Chasser les scorpions de l’oasis'
        },
        {
          k: 'pick',
          n: 4,
          spread: [4, 8],
          art: 'nest',
          icon: '🦂',
          item: 'Nid détruit',
          label: 'Détruire le nid',
          ambush: ['Scorpion', 2],
          text: 'Détruire les nids qui bouchent l’aqueduc'
        },
        {
          k: 'escort',
          art: 'person',
          look: { sex: 'm', race: 'humain', skin: '#a8724a', hair: '#1a1418', outfit: 'or' },
          who: 'Porteur d’eau',
          from: [-5, -3],
          to: [2, 1],
          ambush: [
            ['Scorpion', 2],
            ['Drake des dunes', 1]
          ],
          label: 'Accompagner le porteur',
          text: 'Escorter le porteur d’eau jusqu’au bassin',
          world: ['oasis']
        }
      ],
      reward: { gold: 380, recipe: 'tajine', text: 'Recette « Tajine de l’oasis » et oasis restaurée' },
      talk: {
        offer: [
          'L’eau n’arrive plus. Les scorpions ont fait leurs nids dans les conduits, et mes porteurs refusent de sortir.',
          'Nettoie l’aqueduc, puis accompagne le dernier porteur courageux jusqu’au bassin. Une seule jarre suffira : l’eau appelle l’eau.'
        ],
        active: 'Un nid détruit, c’est une colère réveillée. Garde ton arme en main.',
        ready:
          'L’eau chante dans le bassin ! Les scorpions reviendront avec la saison sèche, mais aujourd’hui l’oasis respire. Merci, l’ami de l’eau.',
        after:
          'Les palmiers reverdissent. À la saison sèche, les scorpions reviennent toujours : la guilde le saura.'
      }
    },
    // ---------------------------------------------------------------- Chapitre VI
    {
      id: 26,
      chapter: 5,
      main: true,
      title: 'Le sanctuaire des six lumières',
      npc: 'lumi',
      site: 'q26',
      requires: 22,
      level: 52,
      summary:
        'Lumi te mène au Sanctuaire des Six Lumières. Trois épreuves attendent avant qu’on puisse poser les étoiles sur l’autel et ouvrir la Chambre de l’Aurore.',
      steps: [
        {
          k: 'race',
          n: 6,
          spread: [5, 10],
          text: 'Épreuve du souffle : courir avec la lumière avant qu’elle s’éteigne'
        },
        {
          k: 'wave',
          waves: [4, 5, 5],
          mobs: ['Gardien astral', 'Fée sauvage'],
          what: 'la flamme du sanctuaire',
          icon: '🔥',
          art: 'crystal',
          at: [0, 1],
          label: 'Allumer la flamme',
          text: 'Épreuve du courage : garder la flamme du sanctuaire'
        },
        {
          k: 'pick',
          n: 6,
          spread: [4, 9],
          art: 'crystal',
          icon: '✨',
          item: 'Lumière retrouvée',
          label: 'Recueillir la lumière',
          text: 'Épreuve de la lumière : recueillir les six lumières égarées'
        },
        { k: 'spot', at: [0, -1], text: 'Placer les étoiles sur l’autel (E)' }
      ],
      reward: { gold: 520, flags: ['sanct_lumieres'], text: 'Accès à la Chambre de l’Aurore' },
      talk: {
        offer: [
          '✨ C’est ici. Le Sanctuaire des Six Lumières… je m’en souviens. Si tu poses les étoiles sur l’autel, la Chambre de l’Aurore s’ouvrira, et le Cœur sera derrière.',
          '✨ Mais les anciens ont laissé trois épreuves : courir avec la lumière, garder la flamme, et recueillir les lumières égarées. Je reste près de toi.'
        ],
        active:
          '✨ Trois épreuves, puis l’autel. Je brille plus fort quand tu es près de moi. Tu l’avais remarqué ?',
        ready:
          '✨ Les étoiles brillent ensemble ! La Chambre de l’Aurore est ouverte. Auralis, le gardien du Cœur, nous y attend… et Vesper arrive.',
        after: '✨ La Chambre de l’Aurore est ouverte. Auralis nous attend. Vite, avant Vesper !'
      }
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
      summary:
        'Dans la Chambre de l’Aurore, Auralis, le dernier gardien, attend pour réveiller le Cœur. Sa sœur Vesper arrive en même temps que toi, et l’Ombre avec elle.',
      steps: [
        { k: 'spot', at: [-4, 0], text: 'Lire la fresque du gardien (E)' },
        {
          k: 'defense',
          text: 'Protéger les six cristaux (E sur l’autel pour commencer)'
        },
        { k: 'guardian', text: 'Vaincre l’Ombre, le cœur des échos (E sur le sceau)' },
        { k: 'choice', npc: 'vesper', text: 'Décider du sort de Vesper' },
        { k: 'collect', n: 6, text: 'Réunir la lumière des six cristaux' }
      ],
      reward: {
        gold: 900,
        flags: ['star6', 'sanct_aurore', 'title', 'aurora'],
        text: 'Titre « Gardien de l’Aurore », aura lumineuse, sixième étoile et la Chambre de l’Aurore pour toujours'
      },
      talk: {
        offer: [
          'Je suis Auralis, le gardien du Cœur. Je suis resté ici quand tout le monde est parti, même quand ma sœur Vesper a cessé de chanter.',
          'Elle arrive, et l’Ombre avec elle. Lis ma fresque, puis défends les six cristaux pendant que le Cœur s’éveille. Si l’Ombre les brise tous, il se rendormira pour toujours.'
        ],
        active: 'Tiens bon. Tant qu’il reste des cristaux, le Cœur peut se réveiller.',
        ask: 'L’Ombre m’a tenu compagnie quand vous m’avez laissée. Elle n’était pas mauvaise, au début. Elle avait faim, et moi aussi. Je suis fatiguée, gardien. Que fais-tu de moi ?',
        ready:
          'Le Cœur s’éveille… Et Lumi… regarde-la. Elle était une étincelle du Cœur depuis le début. Elle pouvait rentrer. Elle a choisi de rester avec toi. Gardien de l’Aurore.',
        after: 'L’île respire à nouveau. Les six sanctuaires brillent. Merci, Gardien.',
        afterChoice: [
          'Ma sœur a repris sa place dans le chœur. Elle chante faux. C’est le plus beau son que j’aie entendu depuis mille ans.',
          'Ma sœur a repris la mer. Elle écrira, dit-elle. Je lui ai laissé une étoile allumée, au cas où.'
        ]
      },
      choices: ['Reviens chanter avec nous', 'Pars en paix, et ne reviens pas'],
      verse: 'Cœur, réveille-toi : nous chantons à nouveau, l’aube a gardé ta place au bord de l’eau.',
      memory:
        'Le Cœur de l’Aurore se réveille. Les six sanctuaires retrouvent leur lumière, et Lumi révèle la vérité : elle était une étincelle du Cœur, tombée du ciel pour trouver quelqu’un capable de le réveiller. Ce quelqu’un, c’était toi. Quant à Vesper, elle a entendu son nom dans la Ballade. Personne ne l’avait effacé de la musique.'
    },
    {
      id: 28,
      chapter: 5,
      main: false,
      title: 'Le monde à l’envers',
      npc: 'lyss',
      site: 'q28',
      level: 53,
      summary:
        'Lyss, de la Forêt enchantée : deux clairières se reflètent l’une l’autre, et les fées sauvages brouillent encore le reflet. Il faut les calmer, puis actionner les leviers pour ouvrir un passage jusqu’au coffre de l’autre clairière.',
      steps: [
        {
          k: 'kill',
          n: 6,
          mobs: ['Fée sauvage'],
          what: 'Fée calmée',
          text: 'Calmer les fées qui brouillent le reflet'
        },
        {
          k: 'puzzle',
          text: 'Actionner les leviers pour ouvrir un passage dans l’autre clairière'
        }
      ],
      reward: { gold: 500, item: 'Légendaire', text: 'Le coffre enchanté (équipement Légendaire)' },
      talk: {
        offer: [
          'Regarde : deux clairières jumelles. Mais le miroir est capricieux : la gauche devient la droite. Et les fées s’amusent à le rider.',
          'Calme-les, puis abaisse les leviers (E) ici, et les rochers de l’autre clairière bougeront. Ouvre-toi un chemin jusqu’au coffre.'
        ],
        active:
          'Deux leviers abaissés, un seul levé. Regarde quels rochers bougent de l’autre côté du miroir.',
        ready:
          'Tu as traversé le miroir ! Le reflet remplit le coffre à chaque pleine lune. Reviens quand les fées recommenceront.',
        after: 'Parfois, je me demande quelle clairière est la vraie. Les fées, elles, s’en moquent.'
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
      summary:
        'Pyria, de la Forêt enchantée, élève un jeune dragon, Braise, qui a peur du vide. Les grands drakes viennent se moquer de lui. Il faut lui donner du courage avec des pêches étoilées, chasser les moqueurs et courir devant lui pour lui montrer comment prendre son élan.',
      steps: [
        {
          k: 'pick',
          n: 5,
          spread: [5, 10],
          icon: '🍑',
          item: 'Pêche étoilée',
          label: 'Cueillir la pêche',
          text: 'Cueillir des pêches étoilées pour Braise'
        },
        {
          k: 'wave',
          waves: [2, 3],
          mobs: ['Drake astral'],
          what: 'Braise',
          icon: '🐉',
          art: 'horn',
          at: [-3, 1],
          label: 'Sonner le cor',
          text: 'Protéger Braise des drakes qui se moquent de lui'
        },
        {
          k: 'race',
          n: 6,
          spread: [5, 10],
          text: 'Courir devant Braise pour lui montrer comment prendre son élan',
          world: ['pyria']
        }
      ],
      reward: {
        gold: 540,
        item: 'Épique',
        flags: ['pyria'],
        text: 'Équipement Épique de ton niveau et Pyria s’installe dans la forêt'
      },
      talk: {
        offer: [
          'Braise a peur du vide. Les grands drakes le savent, et ils viennent rire de lui tous les soirs.',
          'Donne-lui des pêches, fais taire les moqueurs, puis cours devant lui. Aussi vite que tu peux. Il te suivra, j’en suis sûre.'
        ],
        active:
          'Il aime les pêches bien mûres. Et il aime bien tes bottes, mais ne le laisse pas les manger.',
        ready:
          'IL VOLE ! Braise vole ! Il oublie parfois comment faire, alors on recommencera. Merci, il t’adore.',
        after: 'Braise fait des loopings, quand il n’a pas peur. Les jours de vent, il faut tout recommencer.'
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
      summary:
        'Élya, de la Forêt enchantée : les ents corrompus cachent encore le ciel au lac aux mille étoiles. Il faut les apaiser, puis marcher sur les pierres du lac dans l’ordre où s’allument les étoiles du reflet.',
      steps: [
        {
          k: 'kill',
          n: 6,
          mobs: ['Ent corrompu'],
          what: 'Ent apaisé',
          text: 'Apaiser les ents corrompus autour du lac'
        },
        { k: 'puzzle', text: 'Marcher sur les pierres du lac dans l’ordre de la constellation reflétée' }
      ],
      reward: {
        gold: 600,
        jewel: true,
        text: 'Un bijou Légendaire avec des statistiques secondaires aléatoires'
      },
      talk: {
        offer: [
          'Regarde le reflet : une constellation, le Cerf des neiges. Ses étoiles s’allument l’une après l’autre. Enfin, quand les ents ne lui cachent pas le ciel.',
          'Apaise-les, puis marche sur les pierres du lac dans le même ordre. Une erreur, et le reflet s’efface : il faudra recommencer.'
        ],
        active: 'Regarde le reflet : l’étoile qui s’allume en premier, puis la suivante…',
        ready:
          'Le lac t’a reconnu. Chaque nuit claire, il recommence sa constellation. Reviens quand les ents la cacheront de nouveau.',
        after: 'Les nuits claires, le lac brille pour toi. Les ents, eux, n’aiment pas la lumière.'
      }
    },
    ...INTERLUDE_QUESTS
  ]
    .map(asContract)
    .concat(GUILD_CONTRACTS)
);
// Changements du monde visibles par tous (monde.quetes.flags), et ceux des anciennes énigmes résolues.
export const WORLD_FLAGS = Object.freeze([
  ...new Set([
    ...SANCTUARIES.map(s => 'sanct_' + s.id),
    'shortcut',
    ...QUESTS.flatMap(q => /** @type {any[]} */ ([...q.steps]).flatMap(s => s.world || []))
  ])
]);
export const LEGACY_SOLVED = deepFreeze({
  q3: 'sommet',
  q7: 'goldtree',
  q11: 'lanterns',
  q13: 'bridge',
  q17: 'archives',
  q19: 'grenier',
  q21: 'cite',
  q22: 'machine',
  q25: 'oasis',
  q29: 'pyria'
});
// Les quatre voix de l'Interlude (drapeaux, dans l'ordre des biomes).
export const VOICES = deepFreeze([
  { flag: 'voice1', name: 'La voix de l’argile' },
  { flag: 'voice2', name: 'La voix du fer' },
  { flag: 'voice3', name: 'La voix des oubliés' },
  { flag: 'voice4', name: 'La voix de la mousse' }
]);
export const QUEST_IDS = Object.freeze(QUESTS.map(q => q.id));
// Indices de l'esprit (quête 14) : où les trouver (relatif au lieu) et ce qu'ils apprennent.
export const GHOST_CLUES = deepFreeze([
  {
    id: 'lanterne',
    at: [-3, -1],
    what: 'Une vieille lanterne gravée : « I. — Que la lumière guide les égarés. »'
  },
  {
    id: 'barque',
    at: [3, 2],
    what: 'Une barque échouée. Sur le banc : « Au lanternier, pour ses tournées du soir. »'
  },
  {
    id: 'vieille',
    at: [4, -3],
    who: 'Vieille Odette',
    what: 'Vieille Odette : « Il allumait les lanternes chaque soir, en sifflant. Un garçon gentil. »'
  },
  {
    id: 'pecheur',
    at: [-4, 3],
    who: 'Pêcheur Tom',
    what: 'Pêcheur Tom : « Son prénom commençait comme une île… I-quelque chose. Ilian ? »'
  }
]);
// Quête 16 : souvenirs des feuilles et objets à rendre à leur maison.
export const VILLAGE_MEMORIES = deepFreeze([
  {
    id: 'f1',
    at: [-4, -4],
    what: 'Une feuille dorée : le forgeron battait le fer, et l’enclume chantait dans la maison du puits.'
  },
  {
    id: 'f2',
    at: [4, -4],
    what: 'Une feuille dorée : la boulangère sonnait la cloche quand le pain sortait du four.'
  },
  {
    id: 'f3',
    at: [-5, 3],
    what: 'Une feuille dorée : dans la maison au jardin, une mère berçait son enfant.'
  },
  {
    id: 'f4',
    at: [5, 3],
    what: 'Une feuille dorée : le soir, du haut de la petite tour, la harpe jouait pour tout le village.'
  }
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
  {
    id: 't1',
    at: [-2, 4],
    who: 'Hector',
    what: 'Hector : « Il s’est caché près d’une grosse citrouille, j’en suis sûr. »'
  },
  {
    id: 't2',
    at: [0, 4],
    who: 'Mila',
    what: 'Mila : « Il déteste l’eau. Il ne va jamais près du ruisseau. »'
  },
  {
    id: 't3',
    at: [2, 4],
    who: 'Gaspard',
    what: 'Gaspard : « Moi je l’ai vu sous le pont du ruisseau ! Enfin… je crois. »'
  }
]);

// ---------------------------------------------------------------- Au fil de l'aventure (hors des quêtes)
// Gardiens : un par chapitre, Interlude compris, au bout de sa quête principale. Le sceau du lieu (E) les appelle ; vaincus,
// ils laissent un Cœur d'Aurore (PV max). Un héros qui a fini la quête sans les avoir vaincus peut les défier.
// moves : slam (cercle sous un héros), rain (un cercle sur chaque héros proche), nova (onde autour du gardien),
// blink (disparaît et réapparaît ailleurs dans le lieu) ; adds : renforts à 66 % et 33 % de PV.
export const GUARDIANS = deepFreeze({
  2: {
    name: 'Ronce-Moussue',
    title: 'l’écho des ruines',
    look: 'treant',
    pal: ['#5e7a3a', '#3a4e22', '#8aa85a', '#c8e060', '#e8ff9a'],
    opts: { thorns: true },
    color: '#7aa04a',
    scale: 2.6,
    moves: ['slam'],
    adds: 'Slime',
    intro: 'Les pierres tremblent… Une masse de mousse et de ronces se lève des ruines !',
    defeat: 'Ronce-Moussue s’effrite en pétales. Une douce chaleur reste dans l’air.'
  },
  7: {
    name: 'Sylvenoir',
    title: 'l’écho de la forêt',
    look: 'treant',
    pal: ['#3a2c1e', '#22180e', '#5e4a34', '#6a4aa0', '#c8a0ff'],
    opts: { corrupt: true },
    color: '#6a4aa0',
    scale: 2.9,
    moves: ['slam', 'nova'],
    adds: 'Araignée',
    intro: 'L’ombre de l’arbre gardien se décolle du sol et prend vie !',
    defeat: 'Sylvenoir se dissout dans les racines d’or. L’arbre gardien soupire de soulagement.'
  },
  12: {
    name: 'Miroitombe',
    title: 'l’écho des reflets',
    look: 'ghost',
    pal: ['#8ab0d8', '#4a6a9a', '#d8ecff', '#ffffff', '#bfe8ff'],
    opts: { hands: true, crown: true },
    color: '#8ab0d8',
    scale: 2.8,
    moves: ['rain', 'blink'],
    adds: 'Wisp',
    intro: 'Un reflet sort du dernier miroir… et il ne te ressemble pas du tout !',
    defeat: 'Miroitombe éclate en mille éclats de lumière, qui retournent sagement dans les miroirs.'
  },
  17: {
    name: 'Fanegrise',
    title: 'l’écho de l’automne',
    look: 'horror',
    pal: ['#8a5a2a', '#5a3416', '#c8843a', '#ffd36b', '#fff0a0'],
    opts: { style: 'maw' },
    color: '#c8843a',
    scale: 3,
    moves: ['nova', 'rain'],
    adds: 'Corbeau spectral',
    intro: 'Les feuilles mortes tourbillonnent et forment une silhouette immense !',
    defeat: 'Fanegrise retombe en une pluie de feuilles dorées. Le vent sent bon la cannelle.'
  },
  22: {
    name: 'Sablamort',
    title: 'l’écho des dunes',
    look: 'scorpion',
    pal: ['#c8984e', '#8a6430', '#ecc888', '#e05a3a', '#fff09a'],
    opts: { elite: true },
    color: '#d6a05b',
    scale: 3.2,
    moves: ['slam', 'nova', 'blink'],
    adds: 'Scorpion',
    intro: 'Le sable s’ouvre sous la machine : une carapace géante en surgit !',
    defeat: 'Sablamort s’enfonce dans le sable pour toujours. Les anneaux de la machine brillent plus fort.'
  },
  27: {
    name: 'L’Ombre',
    title: 'le cœur des échos',
    look: 'horror',
    pal: ['#2a1a3e', '#140c22', '#4a2e6a', '#c84aff', '#ffb0ff'],
    opts: { style: 'void' },
    color: '#6a3aa0',
    scale: 3.6,
    moves: ['slam', 'rain', 'nova', 'blink'],
    adds: 'Spectre',
    intro: 'Toute la lumière de la chambre vacille. L’Ombre elle-même vient reprendre le Cœur !',
    defeat: 'L’Ombre se déchire comme un rideau de nuit. Derrière elle, l’aube se lève.'
  },
  36: {
    name: 'Karn-Duram',
    title: 'l’écho du deuil',
    look: 'golem',
    pal: ['#5a626c', '#2a3038', '#8a949e', '#7ac8ff', '#e0f4ff'],
    opts: { style: 'statue', crown: true },
    color: '#7ac8ff',
    scale: 3.1,
    moves: ['slam', 'rain', 'nova'],
    adds: 'Squelette nain',
    intro: 'La faille gémit. Le chagrin de Khaz-Ombral se lève, plus grand qu’une tour !',
    defeat: 'Karn-Duram pose un genou à terre, lâche la porte qu’il tenait depuis mille ans, et s’endort.'
  }
});
// Coquillages chantants : un caché près de chaque lieu de quête de la surface (30). Les voir demande d'être tout près ; la Loupe
// d'Orven (fin du troc) les fait briller de loin. Madame Nacre récompense chaque palier.
export const SHELLS = deepFreeze(
  Object.keys(QUEST_SITES)
    .filter(site => !Object.hasOwn(INTERLUDE_SITES, site))
    .map(site => ({ id: 'c_' + site, site }))
);
export const SHELL_LORE =
  'Quand le Cœur de l’Aurore s’est brisé, son chant s’est caché dans des coquillages, partout sur l’île. Pose-les contre ton oreille : ils fredonnent encore.';
export const SHELL_REWARDS = deepFreeze([
  { n: 5, gold: 150, item: 'Rare', text: 'Équipement Rare de ton niveau' },
  { n: 10, gold: 300, item: 'Épique', text: 'Équipement Épique de ton niveau' },
  { n: 15, gold: 400, heart: 'heart_s15', text: 'Un Cœur d’Aurore (+3 % de PV max)' },
  { n: 20, gold: 600, item: 'Épique', text: 'Équipement Épique de ton niveau' },
  { n: 25, gold: 800, heart: 'heart_s25', text: 'Un Cœur d’Aurore (+3 % de PV max)' },
  { n: 30, gold: 1200, item: 'Légendaire', text: 'Équipement Légendaire de ton niveau' }
]);
// Cœurs d'Aurore : sept gardiens et deux paliers de coquillages ; chacun donne HEART_BONUS de PV max.
export const HEART_FLAGS = Object.freeze([
  ...Object.keys(GUARDIANS).map(id => 'heart_q' + id),
  ...SHELL_REWARDS.filter(r => r.heart).map(r => /** @type {string} */ (r.heart))
]);
export const HEART_BONUS = 0.03;
// Le grand troc : treize échanges d'un bout à l'autre de l'île, avec les habitants. Chacun donne un objet contre
// celui du précédent ; hint dit à qui porter l'objet reçu. Le dernier (Orven) donne la Loupe d'Orven.
export const TRADE_CHAIN = deepFreeze([
  {
    npc: 'milo',
    gives: { id: 'laine', name: 'Pelote de laine', icon: '🧶' },
    line: 'Tu vois cette pelote ? Pompon perd sa laine partout depuis qu’il se prend pour un aventurier. Prends-la, moi j’en ai des sacs entiers !',
    desc: 'Une pelote toute douce, tricotée par le vent et par Pompon.',
    hint: 'Un vieux pêcheur, près d’un étang des Plaines verdoyantes, se plaint que ses lignes cassent.'
  },
  {
    npc: 'eloi',
    gives: { id: 'botte', name: 'Vieille botte', icon: '🥾' },
    line: 'De la laine de mouton ? Parfaite pour mes mouches de pêche ! En échange… j’ai pêché ça ce matin. Quarante ans de métier, et je sors une botte.',
    desc: 'Une botte trempée. Un petit poisson y habitait encore.',
    hint: 'Brin, dans la Forêt ancienne, répète qu’il a froid aux sabots la nuit.'
  },
  {
    npc: 'brin',
    gives: { id: 'miel', name: 'Pot de miel', icon: '🍯' },
    line: 'Une botte ! Une seule, mais quelle botte ! Mon sabot gauche te remercie. Prends ce miel : le petit voleur m’en apporte tous les matins, maintenant.',
    desc: 'Du miel doré de la forêt. Ça colle partout, même aux pensées.',
    hint: 'Sylva, la gardienne des chants de la Forêt ancienne, a la voix toute cassée.'
  },
  {
    npc: 'sylva',
    gives: { id: 'flute', name: 'Flûte de roseau', icon: '🎶' },
    line: 'Du miel de la forêt… Ma voix ! Elle revient ! La-la-laaa. Prends ma vieille flûte : je n’en ai plus besoin, j’ai retrouvé ma voix.',
    desc: 'Une flûte taillée dans un roseau. Elle joue faux, mais avec cœur.',
    hint: 'Au Marais brumeux, le petit Pipo rêve de faire de la musique.'
  },
  {
    npc: 'pipo',
    gives: { id: 'grenouille', name: 'Grenouille porte-bonheur', icon: '🐸' },
    line: 'Une flûte ! Pour moi ?! Pi-pi-piii ! Tiens, je te donne mon ami Crôa. Il porte bonheur… sauf aux moustiques.',
    desc: 'Crôa, une grenouille verte qui adore les moustiques. Elle te regarde avec confiance.',
    hint: 'Goran se fait dévorer par les moustiques sur son pont, au Marais brumeux.'
  },
  {
    npc: 'goran',
    gives: { id: 'lanterne', name: 'Lanterne de poche', icon: '🏮' },
    line: 'Une grenouille qui mange les moustiques ? Crôa, tu es engagé ! Prends ma lanterne de poche : avec mon pont, je ne me perds plus dans le noir.',
    desc: 'Une petite lanterne qui ne s’éteint jamais, même sous la pluie du marais.',
    hint: 'Odel, le meunier de la Forêt automnale, n’ose plus monter dans son grenier sombre.'
  },
  {
    npc: 'odel',
    gives: { id: 'farine', name: 'Sac de farine fine', icon: '🌾' },
    line: 'Une lanterne ! Je vais enfin voir ce qui fait « scrr-scrr » dans mon grenier. Prends ce sac de farine, la plus fine de l’île.',
    desc: 'Une farine si fine qu’elle s’envole quand on la regarde.',
    hint: 'Flavio, dans la Forêt automnale, veut cuire un gâteau pour le concours des feuilles.'
  },
  {
    npc: 'flavio',
    gives: { id: 'girouette', name: 'Girouette en cuivre', icon: '🌬️' },
    line: 'De la farine fine ! Mon gâteau va gagner, c’est sûr. Tiens, ma girouette de champion : elle tourne même quand il n’y a pas de vent.',
    desc: 'Une petite girouette en cuivre. Elle tourne toute seule, sans raison.',
    hint: 'Zafir, le marchand du Désert oublié, achète tout ce qui parle du vent.'
  },
  {
    npc: 'zafir',
    gives: { id: 'brise', name: 'Bouteille de brise fraîche', icon: '🍶' },
    line: 'Une girouette qui tourne sans vent ? C’est… du vent pur ! Marché conclu. Prends cette bouteille de brise fraîche, ma meilleure cuvée.',
    desc: 'Quand on la débouche, une brise de montagne s’en échappe en chantant.',
    hint: 'Amira, à l’oasis du Désert oublié, étouffe sous la chaleur.'
  },
  {
    npc: 'amira',
    gives: { id: 'dattes', name: 'Dattes dorées', icon: '🌴' },
    line: 'Une brise fraîche, en plein désert ! Ahhh… Merci. Prends ces dattes dorées, les plus sucrées de l’oasis.',
    desc: 'Des dattes qui brillent comme de l’or. Un dragon ferait n’importe quoi pour elles.',
    hint: 'Pyria, dans la Forêt enchantée, dit que son jeune dragon adore le sucre.'
  },
  {
    npc: 'pyria',
    gives: { id: 'ecaille', name: 'Écaille de Braise', icon: '🐉' },
    line: 'Des dattes dorées ?! Braise, regarde ! … Il a tout mangé. Il est si content qu’il a perdu une écaille. Prends-la, c’est un cadeau.',
    desc: 'Une écaille chaude qui brille comme une braise. Elle ne refroidit jamais.',
    hint: 'Élya, au lac aux mille étoiles de la Forêt enchantée, taille tout ce qui brille.'
  },
  {
    npc: 'elya',
    gives: { id: 'lentille', name: 'Lentille d’étoile', icon: '🔮' },
    line: 'Une écaille de dragon… Elle brille comme une étoile. J’en ferai un bijou. Prends cette lentille d’étoile : elle voit ce qui est caché.',
    desc: 'Une lentille taillée dans une étoile tombée. À travers elle, la nuit est claire.',
    hint: 'Orven, aux Ruines de la Couronne, a toujours rêvé de mieux lire sa carte.'
  },
  {
    npc: 'orven',
    gives: { id: 'loupe', name: 'Loupe d’Orven', icon: '🔎' },
    line: 'Une lentille d’étoile ! Avec ça, je lirais les plus petits signes de ma carte… Non, prends plutôt ma vieille loupe, montée avec ta lentille. Elle te servira mieux qu’à moi.',
    desc: 'Avec elle, les coquillages chantants brillent de loin, et ta boussole les trouve.',
    hint: 'Le grand troc est terminé. La Loupe d’Orven fait briller les coquillages chantants de loin.'
  }
]);
// Dernier échange : en plus de la loupe.
export const TRADE_FINAL = deepFreeze({
  gold: 800,
  item: 'Légendaire',
  text: 'Équipement Légendaire de ton niveau'
});
