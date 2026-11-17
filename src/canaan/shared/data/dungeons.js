// Donjons, raids et Arène : structure de chaque instance (forme du plan, dangers, décors posés, type de porte),
// créatures qui la peuplent (nom, silhouette, palette), et constantes de l'exploration. Leur apparence (couleurs des
// sols et des murs, lumière, flammes, runes, bannières, particules) est dans scripts/dungeons.js ; leurs règles
// (niveaux, récompenses) dans shared/data/world.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Structure de chaque instance, dans l'ordre de INSTANCE_DEFS : shape (cave : galeries ; hall : salles taillées ;
// pit : salles au bord des fosses ; void : îlots au-dessus du vide),
// hazard (style du danger, nombre de mares par salle, lumière qu'il émet), accent (largeur des allées),
// wallProps et floorProps (objets posés contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss),
// decal (marques au sol), gate (herse ou barrière magique).
export const DUNGEON_LAYOUTS = deepFreeze([
  {
    key: 'terriers',
    shape: 'cave',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 2 },
    wallProps: ['torch', 'roots', 'beam', 'roots'],
    floorProps: ['bones', 'mushroom', 'burrow', 'crate', 'rubble', 'bones', 'mushroom'],
    centerpiece: 'bonethrone',
    gate: 'portcullis'
  },
  {
    key: 'mine',
    shape: 'hall',
    accent: { width: 0 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['lantern', 'mithril', 'beam', 'mithril'],
    floorProps: ['minecart', 'crate', 'ore', 'pickaxe', 'rubble', 'ore'],
    centerpiece: 'mithrilcluster',
    gate: 'portcullis'
  },
  {
    key: 'eclipse',
    shape: 'hall',
    accent: { width: 0 },
    hazard: { style: 'void', pools: 0 },
    wallProps: ['sconce', 'banner', 'sconce'],
    floorProps: ['pillar', 'brazier', 'statue', 'candles', 'candles'],
    centerpiece: 'altar',
    decal: 'eclipse',
    gate: 'barrier'
  },
  {
    key: 'penitents',
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'chasm', pools: 0 },
    wallProps: ['torch', 'banner', 'chains', 'banner'],
    floorProps: ['pillar', 'candles', 'cage', 'statue', 'brazier', 'candles'],
    centerpiece: 'altar',
    gate: 'portcullis'
  },
  {
    key: 'forge',
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'lava', pools: 3, glow: '#ff6a1f' },
    wallProps: ['furnace', 'chains', 'torch', 'chains'],
    floorProps: ['anvil', 'rack', 'brazier', 'ingots', 'dragonskull', 'ingots'],
    centerpiece: 'greatforge',
    gate: 'portcullis'
  },
  {
    key: 'fosse',
    shape: 'pit',
    accent: { width: 0 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['chains', 'sconce', 'chains', 'skulls'],
    floorProps: ['bonepile', 'cage', 'spikes', 'rack', 'brazier', 'bones'],
    centerpiece: 'block',
    gate: 'portcullis'
  },
  {
    key: 'bastion',
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'blood', pools: 2 },
    wallProps: ['banner', 'torch', 'skulls', 'torch'],
    floorProps: ['pillar', 'brazier', 'pike', 'statue', 'candles'],
    centerpiece: 'throne',
    gate: 'portcullis'
  },
  {
    key: 'continuum',
    shape: 'void',
    accent: { width: 0 },
    hazard: { style: 'stars', pools: 0 },
    wallProps: [],
    floorProps: ['gear', 'hourglass', 'crystal', 'pillar', 'crystal', 'gear'],
    centerpiece: 'orrery',
    gate: 'barrier'
  },
  {
    key: 'seraphin',
    shape: 'void',
    accent: { width: 1 },
    hazard: { style: 'clouds', pools: 0 },
    wallProps: [],
    floorProps: ['pillar', 'angelstatue', 'brazier', 'feathers', 'pillar'],
    centerpiece: 'throne',
    gate: 'barrier'
  },
  {
    key: 'celestia',
    shape: 'void',
    accent: { width: 0 },
    hazard: { style: 'stars', pools: 0 },
    wallProps: [],
    floorProps: ['pillarlight', 'orb', 'pillar', 'crystal', 'statue'],
    centerpiece: 'scales',
    gate: 'barrier'
  },
  {
    key: 'durgrim',
    shape: 'cave',
    accent: { width: 0 },
    hazard: { style: 'water', pools: 3 },
    wallProps: ['lantern', 'beam', 'roots', 'beam'],
    floorProps: ['minecart', 'crate', 'ore', 'pickaxe', 'rubble', 'bones', 'ore'],
    centerpiece: 'mithrilcluster',
    gate: 'portcullis'
  },
  {
    key: 'ombral',
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 2 },
    wallProps: ['sconce', 'banner', 'chains', 'banner'],
    floorProps: ['pillar', 'statue', 'rubble', 'candles', 'brazier', 'statue'],
    centerpiece: 'throne',
    gate: 'portcullis'
  },
  {
    key: 'mille_tombes',
    shape: 'pit',
    accent: { width: 1 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['skulls', 'sconce', 'chains', 'skulls'],
    floorProps: ['bonepile', 'candles', 'bones', 'cage', 'statue', 'candles'],
    centerpiece: 'altar',
    gate: 'portcullis'
  },
  {
    key: 'fongique',
    shape: 'cave',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 3 },
    wallProps: ['roots', 'lantern', 'roots', 'roots'],
    floorProps: ['mushroom', 'crystal', 'mushroom', 'bones', 'rubble', 'mushroom'],
    centerpiece: 'mithrilcluster',
    gate: 'barrier'
  }
]);
// Arène des Épreuves : colisée de sable chaud.
export const DUNGEON_ARENA_LAYOUT = deepFreeze({
  key: 'arene',
  shape: 'hall',
  accent: { width: 0 },
  hazard: { style: 'chasm', pools: 0 },
  wallProps: ['banner', 'torch'],
  floorProps: [],
  centerpiece: null,
  gate: 'portcullis'
});
// Créatures de chaque instance : monstres (nom, silhouette, palette [principale, sombre, claire, accent, yeux]),
// boss de chaque étape et boss secrets.
export const DUNGEON_ACTORS = deepFreeze([
  {
    mobs: [
      { name: 'Osselet', look: 'skeleton', pal: ['#ddd6be', '#8f8670', '#fff8e0', '#6a5a40', '#7fd0ff'] },
      {
        name: 'Rat des terriers',
        look: 'beast',
        pal: ['#7a5d44', '#4b3828', '#a3846a', '#e6a7a7', '#ff5040']
      }
    ],
    bosses: [
      { look: 'beast', pal: ['#8a6a50', '#4e3a2a', '#b89878', '#e6a7a7', '#ff5040'], crown: true },
      { look: 'robed', pal: ['#5a4a3a', '#2e241a', '#80705a', '#c9a46e', '#a3c7ff'], hood: true },
      { look: 'skeleton', pal: ['#ece5cc', '#9a917a', '#fffbe8', '#5a6a8a', '#8fd8ff'], crown: true }
    ],
    secrets: [
      {
        look: 'beast',
        pal: ['#4a3a30', '#2a1e16', '#7a6050', '#d0a040', '#ffd040'],
        horns: true,
        crown: true
      }
    ]
  },
  {
    mobs: [
      {
        name: 'Mineur maudit',
        look: 'brute',
        pal: ['#6b7a8c', '#3d4652', '#93a3b5', '#c9a24a', '#9fe8ff']
      },
      {
        name: 'Kobold des galeries',
        look: 'imp',
        pal: ['#a67c4f', '#6e5033', '#c9a074', '#e0d060', '#ffd23f']
      }
    ],
    bosses: [
      {
        look: 'imp',
        pal: ['#8a7a5a', '#4e4430', '#b0a07a', '#c9a24a', '#9fe8ff'],
        nowings: true,
        crown: true
      },
      { look: 'spider', pal: ['#3d4652', '#22282e', '#6a7a8c', '#9fe8ff', '#c8f7ff'] },
      { look: 'golem', pal: ['#9fb6c9', '#5c6f80', '#e3f2ff', '#7de0ff', '#c8f7ff'] }
    ],
    secrets: [{ look: 'robed', pal: ['#2a2e36', '#14161a', '#4a5260', '#ffcf6a', '#ffffff'], hood: true }]
  },
  {
    mobs: [
      {
        name: 'Acolyte de l’Éclipse',
        look: 'robed',
        pal: ['#3b2d55', '#22193a', '#5d4a80', '#e0b04a', '#ffb347']
      },
      {
        name: 'Ombre éclipsée',
        look: 'spirit',
        pal: ['#6a4f9a', '#3a2a5a', '#a58ad8', '#ffd36d', '#ffe9a0']
      }
    ],
    bosses: [
      { look: 'robed', pal: ['#3a2a5a', '#1e1530', '#6a5090', '#ff9955', '#ffcc88'], hood: true },
      { look: 'golem', pal: ['#c89a40', '#7a5a22', '#f0d080', '#ffcc55', '#fff0b0'], halo: true },
      { look: 'robed', pal: ['#1e1530', '#0f0a1c', '#4a3670', '#ffcc55', '#ffdd88'], halo: true }
    ],
    secrets: [{ look: 'spirit', pal: ['#120a1c', '#06040c', '#3a2a5a', '#ff7a3a', '#ffb080'] }]
  },
  {
    mobs: [
      {
        name: 'Pénitent flagellant',
        look: 'robed',
        pal: ['#6b5a48', '#463a2e', '#8f7b64', '#a03030', '#ff6040']
      },
      {
        name: 'Chevalier spectral',
        look: 'knight',
        pal: ['#8d9ac4', '#56608a', '#c9d3f0', '#ab94ee', '#d6ccff']
      }
    ],
    bosses: [
      { look: 'brute', pal: ['#5a5560', '#33303a', '#807a8a', '#b79cff', '#e2d4ff'], hood: true },
      { look: 'robed', pal: ['#e8e4f0', '#a8a0b8', '#ffffff', '#5a161a', '#b79cff'], hood: true },
      { look: 'knight', pal: ['#4a4458', '#2a2636', '#7c7490', '#b79cff', '#e2d4ff'], hood: true }
    ],
    secrets: [{ look: 'skeleton', pal: ['#8a8494', '#4a4652', '#b8b2c4', '#b79cff', '#e2d4ff'], hood: true }]
  },
  {
    mobs: [
      {
        name: 'Diablotin des forges',
        look: 'imp',
        pal: ['#e2652a', '#9c3a14', '#ffa05a', '#ffd36b', '#fff0a0']
      },
      {
        name: 'Dragonnet ardent',
        look: 'dragon',
        pal: ['#c4462a', '#7c2412', '#f08050', '#ffcf5a', '#fff09a']
      }
    ],
    bosses: [
      { look: 'brute', pal: ['#7a4a30', '#4a2a18', '#a87050', '#ff8a3c', '#ffd36b'], heavy: true },
      { look: 'golem', pal: ['#3a2a26', '#1e1412', '#5a3d33', '#ff6a1f', '#ffd36b'] },
      { look: 'dragon', pal: ['#d0401c', '#7a1e0c', '#ff8a4a', '#ffd36b', '#fff6b0'] }
    ],
    secrets: [{ look: 'scorpion', pal: ['#1e1a22', '#0c0a10', '#3e3446', '#ff6a1f', '#ffd36b'] }]
  },
  {
    mobs: [
      { name: 'Âme damnée', look: 'spirit', pal: ['#8a6ab0', '#4a3a68', '#c4a8ec', '#e88aff', '#f4d0ff'] },
      {
        name: 'Geôlier de la Fosse',
        look: 'brute',
        pal: ['#5a4a4a', '#352a2a', '#7c6a6a', '#8a2a2a', '#ff4a4a']
      }
    ],
    bosses: [
      { look: 'knight', pal: ['#3a3a40', '#1e1e22', '#5e5e66', '#e88aff', '#f4d0ff'], heavy: true },
      { look: 'spirit', pal: ['#6a5070', '#3a2840', '#a080b0', '#e88aff', '#ffffff'] },
      { look: 'brute', pal: ['#4a3438', '#2a1c20', '#6e5056', '#c03040', '#ff5050'] }
    ],
    secrets: [{ look: 'horror', pal: ['#1e1420', '#0c080e', '#3e2a42', '#e88aff', '#ffd0ff'] }]
  },
  {
    mobs: [
      {
        name: 'Garde sanglant',
        look: 'knight',
        pal: ['#7a2a2a', '#4a1616', '#a84a44', '#d4a44a', '#ffcc66']
      },
      {
        name: 'Vampire écarlate',
        look: 'robed',
        pal: ['#5a1420', '#330a12', '#8a2a36', '#e0c060', '#ff3040']
      }
    ],
    bosses: [
      { look: 'quad', pal: ['#5a2020', '#300e0e', '#8a3a34', '#d4a44a', '#ff6040'] },
      { look: 'knight', pal: ['#6a1c1c', '#3a0e0e', '#9a3a34', '#c0c0c8', '#ff6040'] },
      { look: 'robed', pal: ['#4a0a16', '#24040a', '#7a1a2a', '#d4a44a', '#ff3050'], hood: true },
      { look: 'robed', pal: ['#8a1428', '#4a0a16', '#c03a50', '#ffd36d', '#ff3050'], crown: true },
      { look: 'brute', pal: ['#7a1a1a', '#420a0a', '#b03a34', '#ffd36d', '#ff8060'], heavy: true },
      { look: 'knight', pal: ['#9a1a1a', '#550c0c', '#d04040', '#ffd36d', '#ffee88'], crown: true }
    ],
    secrets: [
      { look: 'rogue', pal: ['#2a1a1a', '#140a0a', '#4a2a2a', '#c8303a', '#ff5050'] },
      { look: 'spirit', pal: ['#f4f0f0', '#c8b8b8', '#ffffff', '#c8303a', '#ffd0d0'] }
    ]
  },
  {
    mobs: [
      { name: 'Rouage animé', look: 'golem', pal: ['#b08a3a', '#6e5420', '#e0c070', '#7de0ff', '#c8f7ff'] },
      {
        name: 'Ombre astrale',
        look: 'spirit',
        pal: ['#ed8bc1', '#8a4a7a', '#ffc0e4', '#9fd8ff', '#ffffff']
      }
    ],
    bosses: [
      { look: 'imp', pal: ['#a07a3a', '#5a4220', '#d0aa60', '#7de0ff', '#d0faff'], nowings: true },
      { look: 'golem', pal: ['#c09a40', '#705a22', '#f0d080', '#7de0ff', '#d0faff'] },
      { look: 'golem', pal: ['#e8d0a0', '#a08a60', '#fff4d8', '#ff7fa7', '#ffd0e0'], halo: true },
      { look: 'robed', pal: ['#3a4a9a', '#1e2860', '#6a7ad8', '#ffd36d', '#9fe8ff'], halo: true },
      { look: 'spirit', pal: ['#5a6ac8', '#2a3470', '#9aa8ff', '#7de0ff', '#ffffff'] },
      { look: 'horror', pal: ['#2a1a4a', '#140a2a', '#5a3a8a', '#ff7fa7', '#ffd0e0'] }
    ],
    secrets: [
      { look: 'flyer', pal: ['#7a5ad8', '#3a2a70', '#b8a0ff', '#7de0ff', '#ffffff'] },
      { look: 'spirit', pal: ['#fff0d8', '#c8b090', '#ffffff', '#ff7fa7', '#7de0ff'] }
    ]
  },
  {
    mobs: [
      {
        name: 'Séraphin corrompu',
        look: 'angel',
        pal: ['#c4a0ff', '#7a5ab0', '#efe0ff', '#ffd36d', '#ffffff']
      },
      {
        name: 'Sentinelle solaire',
        look: 'golem',
        pal: ['#e8c860', '#a8862a', '#fff0a8', '#ffffff', '#ffffff']
      }
    ],
    bosses: [
      { look: 'angel', pal: ['#ffe8d0', '#c8a888', '#ffffff', '#ffd36d', '#fff6c0'] },
      { look: 'angel', pal: ['#f0e6c8', '#b8a878', '#ffffff', '#ffd36d', '#fff6c0'] },
      { look: 'golem', pal: ['#d4aa3a', '#8a6a1a', '#fff0a8', '#ffffff', '#fff6c0'], halo: true },
      { look: 'golem', pal: ['#f4f0e4', '#c4baa0', '#ffffff', '#ffd36d', '#ffe680'], halo: true },
      { look: 'robed', pal: ['#f8f4ec', '#c8c0b0', '#ffffff', '#c4a0ff', '#fff6c0'], halo: true },
      { look: 'angel', pal: ['#ffffff', '#d8cfa8', '#ffffff', '#ffcf40', '#fff0a0'], wings6: true }
    ],
    secrets: [
      { look: 'angel', pal: ['#3a3040', '#1a141e', '#6a5a72', '#c4a0ff', '#ff5070'] },
      { look: 'angel', pal: ['#c8e0ff', '#7a90c0', '#ffffff', '#c4a0ff', '#ffffff'], wings6: true }
    ]
  },
  {
    mobs: [
      { name: 'Juge céleste', look: 'angel', pal: ['#fff0a8', '#c4aa50', '#ffffff', '#9fd8ff', '#ffffff'] },
      {
        name: 'Héraut stellaire',
        look: 'spirit',
        pal: ['#9fd8ff', '#4a7ab0', '#e0f4ff', '#fff0a8', '#ffffff']
      }
    ],
    bosses: [
      { look: 'spirit', pal: ['#fff8d8', '#c8b070', '#ffffff', '#fff0a8', '#ffffff'] },
      { look: 'angel', pal: ['#c8d8ff', '#7a8ac0', '#ffffff', '#9fd8ff', '#e0f4ff'] },
      { look: 'golem', pal: ['#2a2e60', '#1a1c40', '#4a50a0', '#fff0a8', '#ffffff'], halo: true },
      { look: 'golem', pal: ['#d4aa3a', '#8a6a1a', '#fff0a8', '#9fd8ff', '#ffffff'], halo: true },
      { look: 'robed', pal: ['#1a1c40', '#0c0e24', '#3a3e80', '#fff0a8', '#ffffff'], crown: true },
      { look: 'angel', pal: ['#fff8d8', '#c8b070', '#ffffff', '#fff0a8', '#ffffff'], wings6: true }
    ],
    secrets: [
      { look: 'dragon', pal: ['#c8303a', '#7a1018', '#ff7060', '#fff0a8', '#ffffff'] },
      { look: 'spirit', pal: ['#ffffff', '#d8d4f0', '#ffffff', '#fff0a8', '#9fd8ff'] }
    ]
  },
  {
    mobs: [
      {
        name: 'Mineur maudit',
        look: 'skeleton',
        pal: ['#c8b898', '#7a6a50', '#ece0c0', '#8a5a2a', '#ffb040']
      },
      {
        name: 'Taupe des galeries',
        look: 'beast',
        pal: ['#5a4434', '#3a2a20', '#7e6450', '#f0b0a0', '#ff8a3a']
      }
    ],
    bosses: [
      { look: 'brute', pal: ['#7a6048', '#4a3a2a', '#a0866a', '#e0a060', '#ffd080'], tusks: true },
      { look: 'golem', pal: ['#5e5a5a', '#3a3636', '#86807a', '#e0a060', '#ffd080'] },
      { look: 'brute', pal: ['#6a5040', '#40302a', '#927060', '#e0a060', '#ffd080'], horns: true }
    ],
    secrets: [{ look: 'skeleton', pal: ['#c8b8a0', '#806e58', '#ece0c8', '#e0a060', '#ffd080'], crown: true }]
  },
  {
    mobs: [
      {
        name: 'Garde de pierre',
        look: 'golem',
        pal: ['#7a8088', '#4e545c', '#a8b0b8', '#8ac8e8', '#e0f8ff']
      },
      {
        name: 'Esprit d’Ombral',
        look: 'spirit',
        pal: ['#6aa8d8', '#3a6a98', '#c8e8ff', '#ffd36d', '#ffffff']
      }
    ],
    bosses: [
      { look: 'robed', pal: ['#3a4a5a', '#1e2834', '#5a6e84', '#8ac8e8', '#d8f0ff'], hood: true },
      { look: 'golem', pal: ['#2a3038', '#14181e', '#4a5260', '#8ac8e8', '#d8f0ff'], heavy: true },
      { look: 'knight', pal: ['#4a5a6e', '#2a3444', '#7a8ca4', '#c9a24a', '#8ad8ff'], crown: true }
    ],
    secrets: [{ look: 'spirit', pal: ['#4a7a8a', '#2a4a54', '#7ab0c0', '#8ac8e8', '#ffffff'], crown: true }]
  },
  {
    mobs: [
      {
        name: 'Goule des cryptes',
        look: 'brute',
        pal: ['#9aa890', '#5e6e54', '#c4d0b8', '#4a3a2a', '#7affb0']
      },
      {
        name: 'Âme sans repos',
        look: 'spirit',
        pal: ['#8ad8b0', '#3a8a68', '#d8fff0', '#ffffff', '#ffffff']
      }
    ],
    bosses: [
      { look: 'rogue', pal: ['#4a4a40', '#2a2a22', '#6e6e60', '#a8f0c0', '#d8fff0'] },
      { look: 'spirit', pal: ['#2a2e2a', '#141614', '#4a524a', '#a8f0c0', '#ffffff'] },
      { look: 'robed', pal: ['#3a3e3a', '#1e221e', '#5e665e', '#7affb0', '#d8fff0'], hood: true }
    ],
    secrets: [{ look: 'skeleton', pal: ['#b8c0b0', '#6e7868', '#e0e8d8', '#7affb0', '#d8fff0'], crown: true }]
  },
  {
    mobs: [
      {
        name: 'Porte-spores',
        look: 'golem',
        pal: ['#c8604a', '#8a3a2a', '#f0a080', '#f8e8c8', '#fff0a0'],
        leafy: true
      },
      {
        name: 'Larve des fanges',
        look: 'slime',
        pal: ['#8a9a4a', '#4e5a26', '#b8c870', '#e870c0', '#1a2010']
      }
    ],
    bosses: [
      { look: 'golem', pal: ['#c8604a', '#8a3a2a', '#f0a080', '#f8e8c8', '#fff0a0'], leafy: true },
      { look: 'slime', pal: ['#8a9a4a', '#4e5a26', '#b8c870', '#e870c0', '#1a2010'] },
      { look: 'horror', pal: ['#b0407a', '#6a2048', '#e080b0', '#f8e8c8', '#ffe0f8'] }
    ],
    secrets: [{ look: 'horror', pal: ['#4a5a26', '#2a3414', '#7a8a40', '#e870c0', '#ffe0f8'], leafy: true }]
  }
]);
// Le héros entre toujours sur cette case (enterInstance).
export const DUNGEON_ENTRY = deepFreeze({ x: 120, y: 133 });
// Piste de l'Arène : centre et rayon en cases ; le héros entre par l'antichambre au sud (DUNGEON_ENTRY).
export const DUNGEON_ARENA = deepFreeze({ cx: 120, cy: 111, r: 12.6, gateY: 125 });
// Objets posés au sol qui bloquent le passage ; les autres sont décoratifs.
export const DUNGEON_SOLID_PROPS = deepFreeze([
  'pillar',
  'statue',
  'angelstatue',
  'brazier',
  'anvil',
  'minecart',
  'cage',
  'rack',
  'gear',
  'hourglass',
  'pillarlight',
  'dragonskull'
]);
// Chance d'équipement de chaque boss, pour chaque héros.
export const DUNGEON_BOSS_DROP_CHANCE = 0.3;
