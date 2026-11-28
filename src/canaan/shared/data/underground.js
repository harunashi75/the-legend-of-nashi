// @ts-check
// Les Tréfonds de Canaan (scripts/underground/underground.js) : cases, biomes (palettes, décor, bâtiments), forteresse
// de Durgrim, boss, entrées, gisements, poissons, faune, nains et emprise des bâtiments. Le dessin est dans
// scripts/underground/render.js, la génération et les règles dans scripts/underground/underground.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Cases des Tréfonds (numéros des tuiles de game.world.underworld).
const T = Object.freeze({
  FLOOR: 40,
  PATH: 41,
  MUD: 42,
  RIVER: 43,
  WALL: 44,
  STONE: 45,
  GRAVE: 46,
  MOSS: 47,
  LAKE: 48,
  CHASM: 49
});
// Rayon de la forteresse de Durgrim (cases).
const FORT_R = 15;
// floors : palette de chaque sol (paintFloor des donjons) ; wall : paroi ; th : objets des donjons réutilisés.
const BIOMES = [
  {
    name: 'Galeries d’Argile',
    angle: 165,
    floor: T.FLOOR,
    desc: 'Galeries de terre battue, rivières de boue, racines et vieilles mines abandonnées par les nains.',
    floors: {
      [T.FLOOR]: { style: 'dirt', a: '#5e4632', b: '#3e2e20', c: '#84664a' },
      [T.PATH]: { style: 'gravel', a: '#6e5640', b: '#4e3c2a', c: '#8e7458' },
      [T.STONE]: { style: 'stone', a: '#5a5048', b: '#3e3630', c: '#786c60' }
    },
    wall: { style: 'rock', top: '#140e0a', face: '#4e3a2a', dark: '#2e2218', light: '#70543e' },
    mud: { a: '#4a3420', b: '#5e4428', c: '#7a5a36' },
    river: { a: '#24160a', b: '#4a2e14', c: '#b08850' },
    lake: { a: '#14262a', b: '#22404a', c: '#5a8a94' },
    amb: { dark: 0.54, tint: [22, 12, 4], particles: 'dust', color: '#e0c090' },
    map: '#6a5038',
    mapPath: '#8a7050',
    th: {
      pillar: ['#5e4430', '#3b2a1d', '#80614a'],
      flame: ['#e5822e', '#f9c640', '#fff6c5'],
      rune: '#e0a060',
      banner: ['#4a3420', '#e0a060']
    },
    wallProps: ['lantern', 'beam', 'roots', 'torch'],
    decor: [
      0.13,
      [
        'stalag',
        'stalag2',
        'k:rubble',
        'k:bones',
        'beam',
        'roots',
        'k:crate',
        'k:minecart',
        'k:ore',
        'stalag',
        'shrooms',
        'k:pickaxe',
        'lanternpost'
      ]
    ],
    structures: ['shack', 'shack', 'shack', 'minehead', 'minehead']
  },
  {
    name: 'Cité Engloutie de Khaz-Ombral',
    angle: 255,
    floor: T.STONE,
    desc: 'Une ancienne cité naine abandonnée : rues dallées, maisons effondrées, statues sans tête et lacs noirs.',
    floors: {
      [T.STONE]: { style: 'flagstone', a: '#4a5058', b: '#33383e', c: '#6a727c' },
      [T.FLOOR]: { style: 'gravel', a: '#44464a', b: '#2e3034', c: '#62656a' },
      [T.PATH]: { style: 'tiles', a: '#5a6068', b: '#40454c', c: '#7c848e' }
    },
    wall: { style: 'brick', top: '#0c1016', face: '#454c56', dark: '#2a3038', light: '#68707c' },
    mud: { a: '#2e343a', b: '#3e464e', c: '#5a646e' },
    river: { a: '#0e2a3a', b: '#1e4a60', c: '#6ab0d0' },
    lake: { a: '#0e2a3a', b: '#1e4a60', c: '#6ab0d0' },
    amb: { dark: 0.5, tint: [4, 12, 22], particles: 'motes', color: '#a8d8ff' },
    map: '#4e555e',
    mapPath: '#6e7680',
    th: {
      pillar: ['#5a626c', '#3a4048', '#7e8894'],
      flame: ['#3a8ad8', '#7ac8ff', '#e0f4ff'],
      rune: '#8ac8e8',
      banner: ['#1e3a5a', '#c9a24a']
    },
    wallProps: ['sconce', 'banner', 'chains', 'sconce'],
    decor: [
      0.12,
      [
        'brokenpillar',
        'k:rubble',
        'k:statue',
        'ruinwall',
        'k:rubble',
        'k:candles',
        'k:pillar',
        'k:crate',
        'k:bones',
        'stalag2'
      ]
    ],
    structures: [
      'ruinhouse',
      'ruinhouse',
      'ruinhouse',
      'ruinhouse',
      'ruinhouse',
      'ruinhouse',
      'ruintower',
      'ruintower'
    ]
  },
  {
    name: 'Nécropole des Oubliés',
    angle: 345,
    floor: T.GRAVE,
    desc: 'Cimetières sans fin, arbres morts, mausolées et brumes vertes où rôdent goules et âmes errantes.',
    floors: {
      [T.GRAVE]: { style: 'dirt', a: '#3a3c34', b: '#26281f', c: '#55584a' },
      [T.PATH]: { style: 'flagstone', a: '#4a4a46', b: '#33332f', c: '#66665e' },
      [T.STONE]: { style: 'flagstone', a: '#46463f', b: '#302f2a', c: '#62625a' },
      [T.FLOOR]: { style: 'gravel', a: '#3e3e38', b: '#2a2a24', c: '#58584e' }
    },
    wall: { style: 'brick', top: '#08090a', face: '#3a3c3a', dark: '#222422', light: '#5a5c58' },
    mud: { a: '#2a2c24', b: '#3a3c30', c: '#4e5244' },
    river: { a: '#1a2420', b: '#28362e', c: '#5a7a68' },
    lake: { a: '#101a16', b: '#1e2e26', c: '#5a8a70' },
    amb: { dark: 0.6, tint: [4, 14, 10], particles: 'mist', color: '#c0e8d0' },
    map: '#40443a',
    mapPath: '#5e5e56',
    th: {
      pillar: ['#4a4c48', '#2c2e2a', '#6c6e68'],
      flame: ['#3ad87a', '#8affb0', '#e0fff0'],
      rune: '#a8f0c0',
      banner: ['#1a2a22', '#a8f0c0']
    },
    wallProps: ['skulls', 'sconce', 'chains', 'skulls'],
    decor: [
      0.11,
      [
        'deadtree',
        'tomb',
        'grave',
        'cross',
        'k:bones',
        'k:bonepile',
        'candles2',
        'deadtree',
        'grave',
        'k:skullpile',
        'tomb'
      ]
    ],
    structures: ['mausoleum', 'mausoleum', 'mausoleum', 'crypt', 'crypt', 'crypt']
  },
  {
    name: 'Fangeval, le Marais Fongique',
    angle: 75,
    floor: T.MOSS,
    desc: 'Un marais de boue tiède sous la roche : champignons géants luisants, spores, lacs troubles et mille-pattes.',
    floors: {
      [T.MOSS]: { style: 'dirt', a: '#3e4a2e', b: '#2a3420', c: '#5e6e40' },
      [T.PATH]: { style: 'gravel', a: '#4a3a46', b: '#322630', c: '#6a5664' },
      [T.FLOOR]: { style: 'dirt', a: '#4a3e30', b: '#32281e', c: '#6a5a44' },
      [T.STONE]: { style: 'stone', a: '#4a4450', b: '#322e38', c: '#686070' }
    },
    wall: { style: 'rock', top: '#0c0a10', face: '#3e3446', dark: '#241e2a', light: '#5e5068' },
    mud: { a: '#3a4220', b: '#4e5a28', c: '#6e7a3a' },
    river: { a: '#161c08', b: '#34401a', c: '#a8b850' },
    lake: { a: '#1e2e1a', b: '#34502a', c: '#88b060' },
    amb: { dark: 0.52, tint: [16, 4, 20], particles: 'motes', color: '#ff9ae8' },
    map: '#465236',
    mapPath: '#665470',
    th: {
      pillar: ['#4e4258', '#302838', '#6e6080'],
      flame: ['#d84ac0', '#ff8ae8', '#ffe0f8'],
      rune: '#e870c0',
      banner: ['#3a1a34', '#e870c0']
    },
    wallProps: ['roots', 'lantern', 'roots', 'roots'],
    decor: [
      0.16,
      [
        'giantshroom',
        'shrooms',
        'shrooms',
        'mudreeds',
        'k:crystal',
        'giantshroom',
        'roots',
        'shrooms',
        'mudreeds',
        'k:bones'
      ]
    ],
    structures: ['mycohut', 'mycohut', 'mycohut', 'mycohut']
  }
];
// La Forteresse de Durgrim (biome 4 de la carte des biomes) : dalles chaudes, braseros, nains.
const FORT = {
  name: 'Forteresse de Durgrim',
  floors: {
    [T.STONE]: { style: 'tiles', a: '#6a5a48', b: '#4a3e30', c: '#8a7660' },
    [T.PATH]: { style: 'flagstone', a: '#7a6650', b: '#56473a', c: '#9a8468' },
    [T.FLOOR]: { style: 'flagstone', a: '#6a5a48', b: '#4a3e30', c: '#8a7660' }
  },
  wall: { style: 'brick', top: '#1a120c', face: '#5e4a36', dark: '#3a2e22', light: '#86705a' },
  amb: { dark: 0.32, tint: [30, 16, 4], particles: 'embers', color: '#ffd08a' },
  map: '#8a7660',
  mapPath: '#a8926e',
  th: {
    pillar: ['#7a6650', '#4e4030', '#a08a70'],
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#ffc65a',
    banner: ['#7a1a14', '#ffd36d']
  },
  wallProps: ['torch', 'banner', 'torch', 'banner']
};
// Boss mondiaux des Tréfonds (un par biome), au niveau du groupe quand ils apparaissent.
const BOSSES = [
  {
    id: 'u_gorgrath',
    name: 'Gorgrath, le Ver-Roi des Boues',
    biome: 0,
    look: 'worm',
    pal: ['#9a6a3a', '#5a3a1e', '#c8965a', '#ffd36d', '#ffef60'],
    opts: { elite: true, crown: true },
    color: '#c8904a'
  },
  {
    id: 'u_gardien',
    name: 'Le Gardien d’Argent de Khaz-Ombral',
    biome: 1,
    look: 'golem',
    pal: ['#b8c0cc', '#6a7480', '#e8eef4', '#8ac8e8', '#ffffff'],
    opts: { style: 'metal', crown: true },
    color: '#8ac8e8'
  },
  {
    id: 'u_morvane',
    name: 'Morvane, la Reine-Liche',
    biome: 2,
    look: 'humanoid',
    pal: ['#3a3e4a', '#1e2028', '#6a7088', '#7affb0', '#d8fff0'],
    opts: { robe: true, face: 'skull', head: 'crown', hold: 'staff', off: 'orb', cape: '#1e2028' },
    color: '#7affb0'
  },
  {
    id: 'u_sporemere',
    name: 'Sporemère, la Myconide Ancestrale',
    biome: 3,
    look: 'mushroom',
    pal: ['#d04a7a', '#7a2048', '#f08ab0', '#f8e8c8', '#fff0a0'],
    opts: { crown: true, sacs: true, elite: true },
    color: '#e870c0'
  }
];
// Entrées : une par biome de l'île (ordre des ZONES), posées près de la route à la génération.
const ENTRY_NAMES = [
  'Gouffre des Plaines',
  'Puits des Racines',
  'Grotte des Brumes',
  'Crevasse Rousse',
  'Escalier des Sables',
  'Faille Étoilée'
];
// Bâtiments de la forteresse (positions relatives au centre, en cases).
const FORT_PLAN = [
  { kind: 'dwarfhall', dx: 0, dy: -8 },
  { kind: 'forge', dx: -9, dy: -2 },
  { kind: 'tavern', dx: 9, dy: -2 },
  { kind: 'vault', dx: -7, dy: 8 },
  { kind: 'stall', dx: 7, dy: 8 },
  { kind: 'dwarfhouse', dx: -12, dy: 4 },
  { kind: 'dwarfhouse', dx: 12, dy: 4 },
  { kind: 'kingstatue', dx: 0, dy: 1 }
];
const SOLID_DECOR = new Set([
  'stalag',
  'deadtree',
  'tomb',
  'cross',
  'fence',
  'giantshroom',
  'ruinwall',
  'brokenpillar',
  'lanternpost',
  'k:statue',
  'k:pillar',
  'k:brazier',
  'k:minecart',
  'k:anvil',
  'k:cage'
]);
// Gisements : le minerai de chaque biome (souvent) ou un métal de l'île ; une herbe propre à chaque biome.
const ORE_OF = ['fer_noir', 'quartz', 'obsidienne', 'geode'],
  METAL_OF = ['fer', 'argent', 'or', 'mithril'],
  HERB_OF = ['racine', 'lichen', 'pavot', 'champignon'];
// Bancs de poissons des lacs souterrains, au bord d'une rive praticable.
const FISH_TABLES = [
  [
    ['aveugle', 60],
    ['carpe', 25],
    ['anguille', 15]
  ],
  [
    ['lanterne', 40],
    ['murene', 30],
    ['aveugle', 30]
  ],
  [
    ['aveugle', 50],
    ['murene', 50]
  ],
  [
    ['fangeux', 50],
    ['murene', 25],
    ['lanterne', 25]
  ]
];
// Faune : animaux chassables (taupes, salamandres, crapauds) et insectes (lucioles, chauves-souris, spores…).
const FAUNA = [
  {
    ground: [['taupe', 26]],
    fliers: [
      ['luciole', 26],
      ['chauve', 18]
    ]
  },
  {
    ground: [
      ['salamandre', 22],
      ['taupe', 6]
    ],
    fliers: [
      ['luciole', 18],
      ['chauve', 14]
    ]
  },
  {
    ground: [['salamandre', 12]],
    fliers: [
      ['mouche', 30],
      ['chauve', 22]
    ]
  },
  {
    ground: [
      ['crapaud', 34],
      ['taupe', 10]
    ],
    fliers: [
      ['spore', 54],
      ['papillon', 18, true]
    ]
  }
];
// look : barbe, casque, tunique, peau ; tool : outil tenu.
const DWARF_PLAN = [
  {
    name: 'Roi Thrain Barbe-de-Fer',
    dx: 0,
    dy: -5,
    role: 'roi',
    beard: '#e8e0d0',
    helm: '#e0b030',
    tunic: '#7a1a20',
    tool: 'none',
    crown: true,
    lines: [
      'Bienvenue à Durgrim, voyageur de la surface. Mon peuple garde ces profondeurs depuis mille ans.',
      'Khaz-Ombral était notre plus belle cité… jusqu’à ce que la pierre se réveille. Ne t’y aventure pas sans arme.',
      'Morvane, la Reine-Liche, règne sur la Nécropole. Les nôtres qui y sont tombés ne reposent plus en paix.',
      'Quatre donjons se cachent dans les Tréfonds. Ils s’adaptent à la force de qui y entre : aucun n’est trop tôt pour toi.'
    ]
  },
  {
    name: 'Hilda Fonte-Rune',
    dx: -9,
    dy: 1,
    role: 'forgeronne',
    beard: '#c8642a',
    helm: '#6a4a2a',
    tunic: '#4a3a2a',
    tool: 'hammer',
    fem: true,
    lines: [
      'Ma forge vaut bien celle du Camp de l’Aurore : fabrique tes enchantements ici (panneau P, onglet Enchantement).',
      'Le fer noir des Galeries chante sous le marteau. Les marchands le paient très cher.',
      'Un bon nain ne sort jamais sans sa pioche. Toi, tu sors sans ? Étrange peuple, celui de la surface.'
    ]
  },
  {
    name: 'Dorn le Tavernier',
    dx: 9,
    dy: 1,
    role: 'tavernier',
    beard: '#4a2e1e',
    helm: '#8a8e96',
    tunic: '#5a3a1e',
    tool: 'mug',
    lines: [
      'L’âtre de ma taverne est toujours chaud : cuisine tes prises ici, comme à La Marmite dorée.',
      'Le poisson aveugle des lacs noirs ? Délicieux en papillote. Fais-moi confiance.',
      'Une chope de bière de champignon ? Non ? Tant pis pour toi.'
    ]
  },
  {
    name: 'Borin le Marchand',
    dx: 7,
    dy: 10,
    role: 'marchand',
    beard: '#d8a040',
    helm: '#8a8e96',
    tunic: '#2a4a6a',
    tool: 'none',
    type: 'shop',
    lines: []
  },
  {
    name: 'Gimra la Banquière',
    dx: -7,
    dy: 10,
    role: 'banquière',
    beard: '#8a8a8a',
    helm: '#c09030',
    tunic: '#3a2a5a',
    tool: 'none',
    type: 'bank',
    fem: true,
    lines: []
  },
  {
    name: 'Garde Balin',
    dx: -2,
    dy: FORT_R - 1,
    role: 'garde',
    beard: '#7a4a2a',
    helm: '#8a8e96',
    tunic: '#5a2a2a',
    tool: 'axe',
    lines: [
      'Halte ! Ah, un ami de la surface. Passe, mais garde ta lanterne allumée.',
      'Au sud, la Nécropole. Au nord, Khaz-Ombral. Ne confonds pas, l’un est plus sinistre que l’autre.'
    ]
  },
  {
    name: 'Garde Dwalin',
    dx: 2,
    dy: -FORT_R + 2,
    role: 'garde',
    beard: '#2a1f1a',
    helm: '#8a8e96',
    tunic: '#5a2a2a',
    tool: 'axe',
    lines: [
      'Les gargouilles de Khaz-Ombral ne dorment jamais. Moi non plus, d’ailleurs.',
      'Un ver gros comme une maison creuse les Galeries d’Argile. Gorgrath, qu’on l’appelle.'
    ]
  },
  {
    name: 'Mineur Gloin',
    dx: -4,
    dy: 5,
    role: 'mineur',
    beard: '#a8442a',
    helm: '#c8a040',
    tunic: '#4a4a3a',
    tool: 'pick',
    roam: 3,
    lines: [
      'Il y a de l’obsidienne dans la Nécropole… si tu oses creuser entre les tombes.',
      'Les géodes de Fangeval brillent comme des étoiles. Elles valent une fortune !'
    ]
  },
  {
    name: 'Ancienne Brunhild',
    dx: 4,
    dy: 5,
    role: 'ancienne',
    beard: '#e8e8e0',
    helm: '#5a3a5a',
    tunic: '#3a2e3a',
    tool: 'staff',
    fem: true,
    roam: 2,
    lines: [
      'Ma grand-mère disait que l’île de là-haut repose sur le dos des Tréfonds.',
      'Écoute les âmes errantes : elles pleurent les noms qu’on a oubliés.'
    ]
  },
  {
    name: 'Petit Fili',
    dx: 2,
    dy: 3,
    role: 'enfant',
    beard: null,
    helm: '#3a6a8a',
    tunic: '#6a8a3a',
    tool: 'none',
    scale: 0.8,
    roam: 4,
    lines: [
      'Tu viens vraiment de là-haut ? C’est vrai que le plafond est bleu ?',
      'Un jour, j’irai voir le soleil. Il paraît qu’il brûle les yeux !'
    ]
  }
];
// Habitants des bâtiments de Durgrim : room (pièce), lx/ly (cases dans la pièce).
const DWARF_HOMES = [
  {
    room: 'dur_hall',
    lx: 6.5,
    ly: 3.6,
    name: 'Conseillère Dagny',
    role: 'conseillère',
    beard: '#d8a040',
    helm: '#c09030',
    tunic: '#3a2a5a',
    tool: 'staff',
    fem: true,
    lines: [
      'Le Roi tient conseil sur la place, mais c’est ici que se décide l’avenir de Durgrim.',
      'Ces piliers portent les noms des vingt rois. Le vingt-et-unième attend encore le sien.'
    ]
  },
  {
    room: 'dur_hall',
    lx: 10.5,
    ly: 3.6,
    name: 'Garde royal Hrolf',
    role: 'garde',
    beard: '#4a2e1e',
    helm: '#e0b030',
    tunic: '#7a1a20',
    tool: 'axe',
    lines: ['Personne ne s’assied sur le trône de pierre. Personne.']
  },
  {
    room: 'dur_forge',
    lx: 5.5,
    ly: 4.6,
    name: 'Sigrun la Forgeronne',
    role: 'forgeronne',
    beard: '#e8a040',
    helm: '#5a5e66',
    tunic: '#5a3a2a',
    tool: 'hammer',
    fem: true,
    lines: [
      'Le fer se plie à qui sait l’écouter. Le reste n’est que du bruit.',
      'Hilda t’enchantera tes armes dehors, à la grande forge. Ici, on forge les haches de la garde.'
    ]
  },
  {
    room: 'dur_forge',
    lx: 9.5,
    ly: 4.6,
    name: 'Apprenti Kili',
    role: 'apprenti',
    beard: '#a8442a',
    helm: '#6a4a2a',
    tunic: '#4a4a3a',
    tool: 'hammer',
    lines: ['Trois cents coups de marteau par lame. J’en suis à deux cent douze… je crois.']
  },
  {
    room: 'dur_taverne',
    lx: 5.5,
    ly: 2.6,
    name: 'Helga la Brasseuse',
    role: 'brasseuse',
    beard: '#f0c060',
    helm: '#8a5a2a',
    tunic: '#2a5a3a',
    tool: 'mug',
    fem: true,
    lines: [
      'Bière de champignon, hydromel de mousse ou eau de roche ? Choisis bien, la surface.',
      'Dorn dit que c’est sa taverne. Moi, je dis que c’est ma bière.'
    ]
  },
  {
    room: 'dur_taverne',
    lx: 3.4,
    ly: 5.4,
    name: 'Ulfar le Buveur',
    role: 'buveur',
    beard: '#c8642a',
    helm: '#8a8e96',
    tunic: '#5a3a1e',
    tool: 'mug',
    lines: ['Hic ! Les gargouilles… elles m’ont souri. Je le jure sur ma barbe.']
  },
  {
    room: 'dur_taverne',
    lx: 10.4,
    ly: 5.4,
    name: 'Frida Chope-Pleine',
    role: 'buveuse',
    beard: '#4a2e1e',
    helm: '#6a4a2a',
    tunic: '#6a2a3a',
    tool: 'mug',
    fem: true,
    lines: ['Une naine qui boit plus qu’Ulfar ? C’est moi. Et je chante mieux, aussi.']
  },
  {
    room: 'dur_coffre',
    lx: 5.5,
    ly: 6.2,
    name: 'Gardien Thror',
    role: 'garde',
    beard: '#8a8a8a',
    helm: '#c09030',
    tunic: '#2a2a3a',
    tool: 'axe',
    lines: ['L’or de Durgrim dort ici. Gimra compte, moi je garde. Chacun son métier.']
  },
  {
    room: 'dur_maison1',
    lx: 7.5,
    ly: 4.4,
    name: 'Ylva Pied-de-Roc',
    role: 'mère',
    beard: '#c8642a',
    helm: '#5a3a5a',
    tunic: '#4a6a3a',
    tool: 'none',
    fem: true,
    lines: [
      'Essuie tes bottes, voyageur ! La boue des Galeries, ça ne part jamais.',
      'Mon mari est mineur. Il rentre quand la lanterne s’éteint.'
    ]
  },
  {
    room: 'dur_maison1',
    lx: 3.5,
    ly: 6.4,
    name: 'Petite Asa',
    role: 'enfant',
    beard: null,
    helm: '#8a3a5a',
    tunic: '#c8784a',
    tool: 'none',
    scale: 0.8,
    fem: true,
    lines: ['Quand je serai grande, j’aurai les plus longues tresses de Durgrim !']
  },
  {
    room: 'dur_maison2',
    lx: 7.5,
    ly: 4.6,
    name: 'Bombur Marteau-d’Or',
    role: 'père',
    beard: '#e0b040',
    helm: '#8a8e96',
    tunic: '#2a4a6a',
    tool: 'none',
    lines: ['Ma famille forge des marteaux depuis six générations. Le mien est accroché là-haut.']
  },
  {
    room: 'dur_maison2',
    lx: 2.5,
    ly: 5.4,
    name: 'Grand-mère Astrid',
    role: 'ancienne',
    beard: '#e8e8e0',
    helm: '#5a3a5a',
    tunic: '#3a2e3a',
    tool: 'staff',
    fem: true,
    lines: [
      'Assieds-toi, petit. Je vais te raconter la Grande Chute de Khaz-Ombral.',
      'Les tresses d’une naine racontent sa vie : une par victoire, une par deuil.'
    ]
  }
];
// Éclaireurs postés au centre de chaque biome.
const SCOUTS = [
  [
    'Éclaireur Nori',
    [
      'Les Galeries d’Argile : terre, boue et vieilles mines. Attention aux taupes-garous.',
      'La Mine Effondrée de Durgrim est au bout de la route. Grumbar y hante encore ses galeries.'
    ]
  ],
  [
    'Éclaireuse Dísa',
    [
      'Khaz-Ombral, notre cité perdue. Les sentinelles de pierre gardent encore ses rues.',
      'Les Halls Engloutis abritent le Roi Ombral. Il ne reconnaît plus les siens.'
    ]
  ],
  [
    'Éclaireur Óin',
    [
      'La Nécropole des Oubliés… Restez sur les dalles, les tombes ont faim.',
      'La Crypte des Mille Tombes : le Fossoyeur Éternel y creuse sans fin.'
    ]
  ],
  [
    'Éclaireuse Thyra',
    [
      'Fangeval : la boue est tiède et les champignons brillent. Les spores, elles, piquent.',
      'Les Tréfonds Fongiques cachent la Reine des Spores. Brûle-la, si tu peux.'
    ]
  ]
];
// w, h : largeur et hauteur (cases) ; foot : profondeur du pied qui bloque (cases).
const STRUCT = {
  shack: { w: 3, h: 3, foot: 1.2 },
  minehead: { w: 3, h: 4, foot: 1 },
  ruinhouse: { w: 4, h: 3, foot: 1.3 },
  ruintower: { w: 3, h: 5, foot: 1.4 },
  mausoleum: { w: 4, h: 4, foot: 1.5 },
  crypt: { w: 3, h: 3, foot: 1.2 },
  mycohut: { w: 3, h: 3, foot: 1.1 },
  dwarfhall: { w: 7, h: 5, foot: 2 },
  forge: { w: 4, h: 4, foot: 1.6 },
  tavern: { w: 5, h: 4, foot: 1.6 },
  vault: { w: 4, h: 3, foot: 1.4 },
  stall: { w: 3, h: 2, foot: 0.8 },
  dwarfhouse: { w: 3, h: 3, foot: 1.3 },
  kingstatue: { w: 2, h: 4, foot: 0.9 }
};

export const UNDER_DATA = deepFreeze({
  T,
  FORT_R,
  BIOMES,
  FORT,
  BOSSES,
  ENTRY_NAMES,
  FORT_PLAN,
  SOLID_DECOR,
  ORE_OF,
  METAL_OF,
  HERB_OF,
  FISH_TABLES,
  FAUNA,
  DWARF_PLAN,
  DWARF_HOMES,
  SCOUTS,
  STRUCT
});
