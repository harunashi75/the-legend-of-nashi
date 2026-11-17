// @ts-check
// Métiers : pêche, cuisine, chasse, minage, cueillette et enchanteur. Niveaux (1 à 40), qualités débloquées,
// catalogues (poissons, gibier, viandes, recettes, minerais, herbes, enchantements) et tables de pêche.
// Les règles sont dans shared/rules/professions.js ; les bancs, filons, dessins et fenêtres dans scripts/.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Les six métiers d'un héros.
export const PROF_SKILLS = Object.freeze([
  'fishing',
  'cooking',
  'hunting',
  'mining',
  'herbalism',
  'enchanting'
]);
// ---------------------------------------------------------------- Données
export const PROF_MAX_LEVEL = 40;
// Niveau requis pour chaque qualité (Commun, Peu commun, Rare, Épique, Légendaire, Mythique).
export const PROF_QUALITY_LEVEL = deepFreeze([1, 6, 12, 20, 28, 35]);
export const PROF_QUALITY_MULT = deepFreeze([1, 1.3, 1.75, 2.3, 3.2, 4.5]);
export const PROF_BUFF_PCT = deepFreeze([5, 7, 9, 12, 15, 19]);
// Anciennes qualités (huit, avec Héroïque et Céleste) converties une seule fois vers les six actuelles.
export const PROF_OLD_QUALITY = deepFreeze([0, 1, 2, 3, 3, 4, 5, 5]);
// Poissons : nom, icône, recette, couleurs du dessin de la collection, où le trouver et petite bio.
export const PROF_FISH = deepFreeze({
  // Poisson doré : seulement par la quête « Le poisson du vieux pêcheur » (aucun banc).
  dore: {
    name: 'Poisson doré',
    icon: '⟦fish_dore⟧',
    recipe: 'dore',
    colors: ['#f0c030', '#b88410', '#fff0a0'],
    where: 'L’étang d’Éloi (quête « Le poisson du vieux pêcheur »)',
    bio: 'Le poisson que le vieil Éloi a poursuivi pendant quarante ans. Il ne se montre qu’à ceux qui savent lire les remous.'
  },
  gardon: {
    name: 'Gardon',
    icon: '⟦fish_gardon⟧',
    recipe: 'soupe',
    colors: ['#c8ccd0', '#8a9098', '#eef2f4'],
    where: 'Lacs des Plaines et de la Forêt ancienne',
    bio: 'Petit poisson argenté des lacs tranquilles. Il se promène en bande et adore les miettes de pain que les enfants du camp lui lancent.'
  },
  truite: {
    name: 'Truite',
    icon: '⟦fish_truite⟧',
    recipe: 'grillade',
    colors: ['#8a9a6a', '#5a6a42', '#d8c8a0'],
    where: 'Lacs des forêts et lacs scintillants',
    bio: 'Rapide et tachetée, elle file dans les eaux fraîches. Les anciens disent qu’une truite qui saute annonce la pluie.'
  },
  carpe: {
    name: 'Carpe',
    icon: '⟦fish_carpe⟧',
    recipe: 'mijote',
    colors: ['#c8a040', '#8a6a20', '#f0d080'],
    where: 'Lacs des Plaines, du Marais et de la Forêt automnale',
    bio: 'Placide et gourmande, elle peut vivre plus vieille que le plus vieux des gardes. On raconte qu’une carpe dorée exauce un vœu… mais personne ne l’a jamais vue.'
  },
  silure: {
    name: 'Silure des oasis',
    icon: '⟦fish_silure⟧',
    recipe: 'epices',
    colors: ['#6a5a4a', '#3e3228', '#a8987a'],
    where: 'Oasis du Désert oublié',
    bio: 'Moustachu et un brin grognon, il dort au fond des oasis pendant la chaleur du jour. Les caravaniers le saluent avec respect.'
  },
  saumon: {
    name: 'Saumon',
    icon: '⟦fish_saumon⟧',
    recipe: 'fume',
    colors: ['#e8908a', '#a85a5a', '#f8d0c8'],
    where: 'En mer, tout autour de l’île',
    bio: 'Voyageur infatigable, il traverse la mer entière pour revenir là où il est né. Sa chair rose fait la fierté des fumoirs.'
  },
  thon: {
    name: 'Thon',
    icon: '⟦fish_thon⟧',
    recipe: 'ragout',
    colors: ['#3a5a8a', '#22385a', '#c8d8e8'],
    where: 'En mer, tout autour de l’île',
    bio: 'Puissant nageur de la haute mer, il file plus vite qu’un cheval au galop. Il faut des bras solides pour le remonter !'
  },
  espadon: {
    name: 'Espadon',
    icon: '⟦fish_espadon⟧',
    recipe: 'brochette',
    colors: ['#4a6a9a', '#2a4268', '#d8e4f0'],
    where: 'En mer (rare)',
    bio: 'Le seigneur des vagues, armé d’une épée naturelle. Les pêcheurs le surnomment « le chevalier des mers ».'
  },
  perche: {
    name: 'Perche',
    icon: '⟦fish_perche⟧',
    recipe: 'meuniere',
    colors: ['#9ab05a', '#5a6a2a', '#e8d890'],
    where: 'Lacs des Plaines verdoyantes',
    bio: 'Rayée de vert et de noir, la nageoire hérissée : elle chasse en bande au bord des roseaux.'
  },
  brochet: {
    name: 'Brochet',
    icon: '⟦fish_brochet⟧',
    recipe: 'quenelles',
    colors: ['#6a8a5a', '#3a5a32', '#d0d8a0'],
    where: 'Lacs de la Forêt ancienne et de la Forêt automnale',
    bio: 'Le loup des lacs : il guette, immobile, puis jaillit comme une flèche. Gare à ses dents !'
  },
  anguille: {
    name: 'Anguille',
    icon: '⟦fish_anguille⟧',
    recipe: 'fumee',
    colors: ['#5a5a3a', '#32321e', '#a8a070'],
    where: 'Lacs du Marais brumeux',
    bio: 'Glissante comme la brume, elle se faufile dans la vase. On dit qu’elle traverse les prés les nuits de pluie.'
  },
  merou: {
    name: 'Mérou',
    icon: '⟦fish_merou⟧',
    recipe: 'merou',
    colors: ['#a86a4a', '#6a3e28', '#e8c0a0'],
    where: 'En mer, tout autour de l’île',
    bio: 'Gros, placide et curieux, il vient regarder les pêcheurs de ses yeux ronds avant de mordre.'
  },
  raie: {
    name: 'Raie',
    icon: '⟦fish_raie⟧',
    recipe: 'raie',
    colors: ['#7a8aa0', '#4a5a70', '#d8e0ea'],
    where: 'En mer (rare)',
    bio: 'Elle vole sous les vagues comme un grand oiseau plat. Les marins disent qu’elle porte chance.'
  },
  lune: {
    name: 'Poisson-lune astral',
    icon: '⟦fish_lune⟧',
    recipe: 'astral',
    colors: ['#c8b0ff', '#8a6ad8', '#fff0ff'],
    where: 'Lacs scintillants de la Forêt enchantée',
    bio: 'Il brille doucement sous la surface. Certains pensent qu’il est tombé du ciel le jour où l’Aube s’est brisée.'
  },
  // Poissons des lacs souterrains (les Tréfonds).
  aveugle: {
    name: 'Poisson aveugle',
    icon: '⟦fish_aveugle⟧',
    recipe: 'papillote',
    colors: ['#e8d8d0', '#b0a098', '#fff8f4'],
    where: 'Lacs noirs des Galeries d’Argile et de la Nécropole (Tréfonds)',
    bio: 'Pâle comme la craie et sans yeux, il se repère aux remous. Les nains disent qu’il entend battre le cœur des pêcheurs.'
  },
  lanterne: {
    name: 'Poisson-lanterne',
    icon: '⟦fish_lanterne⟧',
    recipe: 'lanterne',
    colors: ['#3a4a6a', '#1e2a40', '#ffe070'],
    where: 'Lacs de Khaz-Ombral et de Fangeval (Tréfonds)',
    bio: 'Une petite lumière pend au bout de sa nageoire. Dans le noir des Tréfonds, c’est lui qui trouve les pêcheurs.'
  },
  murene: {
    name: 'Murène des grottes',
    icon: '⟦fish_murene⟧',
    recipe: 'murene',
    colors: ['#5a6a3a', '#34401e', '#c8d080'],
    where: 'Lacs souterrains (Tréfonds)',
    bio: 'Elle se cache entre les roches immergées et mord tout ce qui passe. Même les nains la pêchent avec des gants.'
  },
  fangeux: {
    name: 'Silure fangeux',
    icon: '⟦fish_fangeux⟧',
    recipe: 'fangeux',
    colors: ['#5a5034', '#3a3420', '#a89a6a'],
    where: 'Lacs troubles de Fangeval (Tréfonds)',
    bio: 'Il vit dans la boue tiède et mange les spores qui tombent des champignons. Son goût est… surprenant.'
  }
});
// Gibier : animaux du monde qu'on peut chasser (zones : biomes où ils vivent), viande obtenue et petite bio.
export const PROF_GAME = deepFreeze({
  lapin: {
    name: 'Lièvre',
    meat: 'lievre',
    zones: [0, 1, 5],
    where: 'Plaines et Forêt ancienne',
    bio: 'Vif et méfiant, il détale au moindre bruit. Approche-toi doucement… ou vise de loin avec un arc !'
  },
  cerf: {
    name: 'Cerf',
    meat: 'venaison',
    zones: [0, 1, 3, 5],
    where: 'Plaines et forêts',
    bio: 'Majestueux roi des forêts, il sent le chasseur de loin. Ses bois tombent chaque hiver et repoussent au printemps.'
  },
  mouton: {
    name: 'Mouton sauvage',
    meat: 'gigot',
    zones: [0],
    where: 'Troupeaux des Plaines',
    bio: 'Il broute paisiblement en troupeau et ne se méfie de rien. Un peu trop, peut-être.'
  },
  grenouille: {
    name: 'Grenouille',
    meat: 'cuisses',
    zones: [2],
    where: 'Bord de l’eau du Marais',
    bio: 'Elle chante tout le soir dans le marais. Ses cuisses sautées sont un mets de choix au Camp de l’Aurore.'
  },
  faisan: {
    name: 'Faisan',
    meat: 'faisan',
    zones: [1, 3],
    where: 'Forêt ancienne et Forêt automnale',
    bio: 'Superbe et bruyant, il s’envole dans un grand fracas d’ailes quand on le surprend dans les fougères.'
  },
  canard: {
    name: 'Canard colvert',
    meat: 'canard',
    zones: [2],
    where: 'Bord de l’eau du Marais',
    bio: 'Il barbote toute la journée entre les roseaux et cancane au moindre bruit.'
  },
  chevre: {
    name: 'Chèvre des sables',
    meat: 'chevre',
    zones: [4],
    where: 'Désert oublié',
    bio: 'Elle grimpe sur les dunes et les rochers brûlants, et broute ce que personne d’autre ne veut.'
  },
  lezard: {
    name: 'Lézard des dunes',
    meat: 'lezard',
    zones: [4],
    where: 'Désert oublié',
    bio: 'Il file entre les pierres chaudes plus vite qu’on ne cligne des yeux. Grillé, il paraît que c’est délicieux.'
  },
  astral: {
    name: 'Bête astrale',
    meat: 'astrale',
    zones: [5],
    where: 'Forêt enchantée (cerfs et lièvres lumineux)',
    bio: 'Cerfs et lièvres baignés de lumière d’étoiles. On dit que leur chair garde un peu de la magie du ciel.'
  },
  crabe: {
    name: 'Crabe des sables',
    meat: 'crabe',
    zones: [0, 1, 2, 3, 4, 5],
    where: 'Plages de toute l’île',
    bio: 'Il fait le tour de l’île en marchant de côté, toujours au bord des vagues, et file à la moindre ombre. Sa chair est douce et sucrée.'
  },
  // Gibier des Tréfonds (zones 6 à 9 : Galeries, Cité Engloutie, Nécropole, Fangeval).
  taupe: {
    name: 'Taupe des cavernes',
    meat: 'taupe',
    zones: [6, 7, 9],
    where: 'Galeries d’Argile et Fangeval (Tréfonds)',
    bio: 'Grosse comme un chien, aveugle et têtue, elle creuse sans cesse. Les nains en font un ragoût réputé.'
  },
  salamandre: {
    name: 'Salamandre des ruines',
    meat: 'salamandre',
    zones: [7, 8],
    where: 'Cité Engloutie et Nécropole (Tréfonds)',
    bio: 'Elle file entre les pierres froides, sa peau brille d’un orange de braise. On dit qu’elle ne craint pas le feu.'
  },
  crapaud: {
    name: 'Crapaud des fanges',
    meat: 'cuisses',
    zones: [9],
    where: 'Boue de Fangeval (Tréfonds)',
    bio: 'Gros, verruqueux et bruyant, il coasse toute la nuit éternelle des Tréfonds. Ses cuisses valent celles des grenouilles.'
  }
});
export const PROF_MEAT = deepFreeze({
  lievre: { name: 'Viande de lièvre', icon: '⟦meat_lievre⟧' },
  venaison: { name: 'Venaison', icon: '⟦meat_venaison⟧' },
  gigot: { name: 'Gigot', icon: '⟦meat_gigot⟧' },
  cuisses: { name: 'Cuisses de grenouille', icon: '⟦meat_cuisses⟧' },
  astrale: { name: 'Chair astrale', icon: '⟦meat_astrale⟧' },
  faisan: { name: 'Viande de faisan', icon: '⟦meat_faisan⟧' },
  canard: { name: 'Magret de canard', icon: '⟦meat_canard⟧' },
  chevre: { name: 'Viande de chèvre', icon: '⟦meat_chevre⟧' },
  lezard: { name: 'Queue de lézard', icon: '⟦meat_lezard⟧' },
  taupe: { name: 'Viande de taupe', icon: '⟦meat_taupe⟧' },
  salamandre: { name: 'Queue de salamandre', icon: '⟦meat_salamandre⟧' },
  crabe: { name: 'Chair de crabe', icon: '⟦meat_crabe⟧' }
});
// Recettes : effet du repas. kind : heal / mana (tout de suite), hot / regen (sur la durée), buff (bonus).
export const PROF_RECIPES = deepFreeze({
  soupe: { name: 'Soupe de gardon', fish: 'gardon', kind: 'heal' },
  grillade: { name: 'Truite grillée', fish: 'truite', kind: 'mana' },
  mijote: { name: 'Carpe mijotée', fish: 'carpe', kind: 'hot', seconds: 5 },
  epices: { name: 'Silure aux épices', fish: 'silure', kind: 'buff', stat: 'speed', seconds: 120 },
  fume: { name: 'Saumon fumé', fish: 'saumon', kind: 'buff', stat: 'damage', seconds: 60 },
  ragout: { name: 'Ragoût de thon', fish: 'thon', kind: 'buff', stat: 'armor', seconds: 60 },
  brochette: { name: 'Brochette d’espadon', fish: 'espadon', kind: 'buff', stat: 'feast', seconds: 120 },
  astral: { name: 'Festin astral', fish: 'lune', kind: 'regen', seconds: 10 },
  civet: { name: 'Civet de lièvre', fish: 'lievre', kind: 'both' },
  roti: { name: 'Rôti de venaison', fish: 'venaison', kind: 'buff', stat: 'warrior', seconds: 120 },
  gigot: { name: 'Gigot aux herbes', fish: 'gigot', kind: 'hot', seconds: 8 },
  cuisses: {
    name: 'Cuisses de grenouille sautées',
    fish: 'cuisses',
    kind: 'buff',
    stat: 'speed',
    seconds: 180
  },
  banquet: { name: 'Banquet céleste', fish: 'astrale', kind: 'regen', seconds: 15 },
  meuniere: { name: 'Perche meunière', fish: 'perche', kind: 'heal' },
  quenelles: { name: 'Quenelles de brochet', fish: 'brochet', kind: 'buff', stat: 'damage', seconds: 90 },
  fumee: { name: 'Anguille fumée', fish: 'anguille', kind: 'hot', seconds: 6 },
  merou: { name: 'Mérou grillé', fish: 'merou', kind: 'buff', stat: 'armor', seconds: 90 },
  raie: { name: 'Raie aux câpres', fish: 'raie', kind: 'both' },
  faisan: { name: 'Faisan rôti', fish: 'faisan', kind: 'buff', stat: 'speed', seconds: 120 },
  magret: { name: 'Magret de canard', fish: 'canard', kind: 'both' },
  chevre: { name: 'Ragoût de chèvre', fish: 'chevre', kind: 'hot', seconds: 8 },
  lezard: { name: 'Brochette de lézard', fish: 'lezard', kind: 'buff', stat: 'damage', seconds: 60 },
  crabe: { name: 'Crabe farci', fish: 'crabe', kind: 'buff', stat: 'armor', seconds: 120 },
  // Infusions des herbes de la cueillette.
  infmenthe: { name: 'Infusion de menthe', fish: 'menthe', kind: 'mana' },
  tisane: { name: 'Tisane de sauge', fish: 'sauge', kind: 'heal' },
  bouillon: { name: 'Bouillon des brumes', fish: 'mousse', kind: 'hot', seconds: 6 },
  soupeortie: { name: 'Soupe d’ortie', fish: 'ortie', kind: 'buff', stat: 'armor', seconds: 120 },
  aloes: { name: 'Jus d’aloès', fish: 'aloes', kind: 'regen', seconds: 8 },
  nectar: { name: 'Nectar de lys étoilé', fish: 'lys', kind: 'regen', seconds: 12 },
  // Recette de la grand-mère d'Éloi : apprise en terminant sa quête.
  dore: {
    name: 'Poisson doré en croûte de sel',
    fish: 'dore',
    kind: 'buff',
    stat: 'feast',
    seconds: 240,
    quest: 5
  },
  // Recette d'Amira : apprise en rendant son eau à l'oasis.
  tajine: { name: 'Tajine de l’oasis', fish: 'silure', kind: 'both', quest: 25 },
  // Recettes des Tréfonds (taverne de Dorn, Forteresse de Durgrim, ou n'importe quelle cuisinière).
  papillote: { name: 'Papillote de poisson aveugle', fish: 'aveugle', kind: 'heal' },
  lanterne: {
    name: 'Poisson-lanterne flambé',
    fish: 'lanterne',
    kind: 'buff',
    stat: 'damage',
    seconds: 90
  },
  murene: { name: 'Murène en ragoût', fish: 'murene', kind: 'both' },
  fangeux: { name: 'Silure fangeux fumé', fish: 'fangeux', kind: 'hot', seconds: 7 },
  taupe: { name: 'Ragoût de taupe des nains', fish: 'taupe', kind: 'buff', stat: 'armor', seconds: 120 },
  salamandre: { name: 'Salamandre grillée', fish: 'salamandre', kind: 'buff', stat: 'speed', seconds: 120 },
  racine: { name: 'Décoction de racine de pierre', fish: 'racine', kind: 'both' },
  lichen: { name: 'Thé de lichen', fish: 'lichen', kind: 'mana' },
  pavot: { name: 'Infusion de pavot funèbre', fish: 'pavot', kind: 'hot', seconds: 8 },
  champignon: {
    name: 'Velouté de champignons luisants',
    fish: 'champignon',
    kind: 'buff',
    stat: 'feast',
    seconds: 120
  }
});
// Espèces selon l'eau : mer, lac scintillant, ou lac d'un biome (ordre des ZONES).
export const PROF_FISH_TABLES = deepFreeze({
  sea: [
    ['saumon', 35],
    ['thon', 30],
    ['merou', 20],
    ['espadon', 8],
    ['raie', 7]
  ],
  glow: [
    ['lune', 60],
    ['truite', 40]
  ],
  lake: [
    [
      ['gardon', 45],
      ['carpe', 30],
      ['perche', 25]
    ],
    [
      ['truite', 45],
      ['gardon', 30],
      ['brochet', 25]
    ],
    [
      ['carpe', 40],
      ['anguille', 35],
      ['gardon', 25]
    ],
    [
      ['carpe', 40],
      ['truite', 40],
      ['brochet', 20]
    ],
    [
      ['silure', 80],
      ['carpe', 20]
    ],
    [
      ['truite', 50],
      ['gardon', 30],
      ['lune', 20]
    ]
  ]
});
// Un métal par biome (ordre des ZONES) ; son rang donne la force de l'enchantement.
export const PROF_ORES = deepFreeze({
  cuivre: {
    name: 'Minerai de cuivre',
    metal: 'cuivre',
    tier: 0,
    zone: 0,
    color: '#d07a3a',
    icon: '⟦ore_cuivre⟧'
  },
  etain: {
    name: 'Minerai d’étain',
    metal: 'étain',
    tier: 1,
    zone: 1,
    color: '#b8c4c8',
    icon: '⟦ore_etain⟧'
  },
  fer: { name: 'Minerai de fer', metal: 'fer', tier: 2, zone: 2, color: '#8a6a5a', icon: '⟦ore_fer⟧' },
  argent: {
    name: 'Minerai d’argent',
    metal: 'argent',
    tier: 3,
    zone: 3,
    color: '#e8eef4',
    icon: '⟦ore_argent⟧'
  },
  or: { name: 'Pépite d’or', metal: 'or', tier: 4, zone: 4, color: '#f0c040', icon: '⟦ore_or⟧' },
  mithril: {
    name: 'Minerai de mithril',
    metal: 'mithril',
    tier: 5,
    zone: 5,
    color: '#7ae8f0',
    icon: '⟦ore_mithril⟧'
  },
  // Minerais rares des Tréfonds (zones 6 à 9) : ils ne font pas d'enchantement, mais se vendent très cher (value).
  fer_noir: {
    name: 'Minerai de fer noir',
    metal: 'fer noir',
    tier: 3,
    zone: 6,
    color: '#5a5e6e',
    icon: '⟦ore_fer_noir⟧',
    value: 3,
    rare: true
  },
  quartz: {
    name: 'Quartz ancien',
    metal: 'quartz',
    tier: 3,
    zone: 7,
    color: '#e8e0f8',
    icon: '⟦ore_quartz⟧',
    value: 3,
    rare: true
  },
  obsidienne: {
    name: 'Obsidienne funèbre',
    metal: 'obsidienne',
    tier: 4,
    zone: 8,
    color: '#3a2a4a',
    icon: '⟦ore_obsidienne⟧',
    value: 4,
    rare: true
  },
  geode: {
    name: 'Géode luisante',
    metal: 'géode',
    tier: 4,
    zone: 9,
    color: '#e870c0',
    icon: '⟦ore_geode⟧',
    value: 5,
    rare: true
  }
});
export const PROF_HERBS = deepFreeze({
  menthe: {
    name: 'Menthe sauvage',
    zone: 0,
    color: '#7ad87a',
    icon: '⟦herb_menthe⟧',
    where: 'Plaines verdoyantes'
  },
  sauge: {
    name: 'Sauge des bois',
    zone: 1,
    color: '#9ab8a0',
    icon: '⟦herb_sauge⟧',
    where: 'Forêt ancienne'
  },
  mousse: {
    name: 'Mousse des brumes',
    zone: 2,
    color: '#6ab0a0',
    icon: '⟦herb_mousse⟧',
    where: 'Marais brumeux'
  },
  ortie: {
    name: 'Ortie rousse',
    zone: 3,
    color: '#d8803a',
    icon: '⟦herb_ortie⟧',
    where: 'Forêt automnale'
  },
  aloes: {
    name: 'Aloès des sables',
    zone: 4,
    color: '#a8c860',
    icon: '⟦herb_aloes⟧',
    where: 'Désert oublié'
  },
  lys: { name: 'Lys étoilé', zone: 5, color: '#c8a8ff', icon: '⟦herb_lys⟧', where: 'Forêt enchantée' },
  // Herbes des Tréfonds.
  racine: {
    name: 'Racine de pierre',
    zone: 6,
    color: '#a87a4a',
    icon: '⟦herb_racine⟧',
    where: 'Galeries d’Argile (Tréfonds)'
  },
  lichen: {
    name: 'Lichen des ruines',
    zone: 7,
    color: '#8ac8b0',
    icon: '⟦herb_lichen⟧',
    where: 'Cité Engloutie (Tréfonds)'
  },
  pavot: {
    name: 'Pavot funèbre',
    zone: 8,
    color: '#a8f0c0',
    icon: '⟦herb_pavot⟧',
    where: 'Nécropole des Oubliés (Tréfonds)'
  },
  champignon: {
    name: 'Champignon luisant',
    zone: 9,
    color: '#e870c0',
    icon: '⟦herb_champignon⟧',
    where: 'Fangeval (Tréfonds)'
  }
});
// Enchantements : une statistique secondaire chacun.
export const PROF_ENCHANTS = deepFreeze({
  power: { name: 'Enchantement de Puissance', icon: '⟦ench_power⟧' },
  crit: { name: 'Enchantement de Critique', icon: '⟦ench_crit⟧' },
  haste: { name: 'Enchantement de Célérité', icon: '⟦ench_haste⟧' },
  mastery: { name: 'Enchantement de Maîtrise', icon: '⟦ench_mastery⟧' },
  healing: { name: 'Enchantement de Soin', icon: '⟦ench_healing⟧' },
  resist: { name: 'Enchantement de Résistance', icon: '⟦ench_resist⟧' }
});
// Métaux d'enchantement, rang 0 à 5 (les minerais des Tréfonds n'en sont pas).
export const PROF_METALS = deepFreeze(['cuivre', 'etain', 'fer', 'argent', 'or', 'mithril']);
// Force d'un enchantement selon le métal (part de la base de l'objet, comme une secondaire : 16 % à 40 %) et
// niveau d'enchanteur requis pour le forger. Le niveau d'enchanteur de celui qui pose l'enchantement le renforce
// aussi de 1 % par niveau (jusqu'à +40 %).
export const PROF_ENCH_MULT = deepFreeze([0.16, 0.2, 0.24, 0.28, 0.33, 0.4]);
export const PROF_ENCH_LEVEL = deepFreeze([1, 6, 12, 20, 28, 35]);
export const PROF_ORES_PER_ENCHANT = 3;
