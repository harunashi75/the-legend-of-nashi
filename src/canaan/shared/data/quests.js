// @ts-check
// Histoire « Les Échos de l'Aurore » : six chapitres (un par zone), 30 quêtes (12 principales, 18 secondaires), puis
// l'Interlude des Tréfonds (quests-interlude.js, 16 quêtes à tout niveau).
// Chaque quête : PNJ, lieu (site), objectifs (chacun avec sa mécanique), dialogues évolutifs et récompense.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';
import { INTERLUDE_NPCS, INTERLUDE_QUESTS, INTERLUDE_SITES } from './quests-interlude.js';
import { CONTRACT_RANKS, GUILD_CONTRACTS, GUILD_MASTER } from './guild.js';
import CHAPTER_I_QUESTS from './quests/chapitre-1.js';
import CHAPTER_II_QUESTS from './quests/chapitre-2.js';
import CHAPTER_III_QUESTS from './quests/chapitre-3.js';
import CHAPTER_IV_QUESTS from './quests/chapitre-4.js';
import CHAPTER_V_QUESTS from './quests/chapitre-5.js';
import CHAPTER_VI_QUESTS from './quests/chapitre-6.js';

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
    ...CHAPTER_I_QUESTS,
    ...CHAPTER_II_QUESTS,
    ...CHAPTER_III_QUESTS,
    ...CHAPTER_IV_QUESTS,
    ...CHAPTER_V_QUESTS,
    ...CHAPTER_VI_QUESTS,
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
// Genres d'une quête, d'après ses étapes (journal : dans l'ordre, sans répétition).
export const QUEST_KINDS = Object.freeze({
  kill: 'Chasse',
  loot: 'Butin',
  pick: 'Collecte',
  collect: 'Collecte',
  wave: 'Défense',
  defense: 'Défense',
  escort: 'Escorte',
  chase: 'Poursuite',
  race: 'Course',
  hunt: 'Champion',
  guardian: 'Gardien',
  talk: 'Messager',
  work: 'Métier',
  timing: 'Métier',
  clear: 'Donjon',
  sky: 'Exploration',
  reach: 'Exploration',
  trail: 'Exploration',
  spot: 'Exploration',
  clues: 'Enquête',
  search: 'Enquête',
  choice: 'Choix',
  catch: 'Adresse',
  puzzle: 'Énigme'
});
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
    who: 'Barnabé',
    what: 'Barnabé : « Il s’est caché près d’une grosse citrouille, j’en suis sûr. »'
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
