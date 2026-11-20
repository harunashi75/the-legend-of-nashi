// @ts-check
// Monde : règles des donjons et raids, monstres ordinaires, boss de monde et leur délai de réapparition.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';
import { DUNGEONS } from './dungeons/index.js';

// Donjons et raids : règles de chaque instance (fiches de shared/data/dungeons/). La position (x, y) est fixée par la
// génération de l'île. Trois boss par donjon, six par raid (le dernier est `boss`), plus des boss cachés (`secrets`)
// derrière des passages secrets.
export const INSTANCE_DEFS = deepFreeze(
  DUNGEONS.map(d => {
    const { name, biome, ...rest } = d.rules;
    return { name, biome, x: 0, y: 0, ...rest };
  })
);
// Liste modifiable pour une partie : la génération de l'île y place chaque portail.
export function createInstances() {
  return JSON.parse(JSON.stringify(INSTANCE_DEFS));
}
// Monstres du monde : nom, couleur (carte, barre), PV de base, apparence (`look` : espèce dessinée par
// client/art/creature-art.js, `pal` : [principale, sombre, claire, accent, yeux], `opts` : variante de l'espèce) et
// nom de leur version d'élite, plus grande et marquée (balafres, crinière, cuirasse, couronne…).
export const MOB_TYPES = deepFreeze([
  {
    name: 'Slime',
    color: '#5eff8a',
    hp: 40,
    elite: 'Slime royal',
    look: 'slime',
    pal: ['#5edc7a', '#2e8a48', '#a8f5b8', '#ffffff', '#1a3020']
  },
  {
    name: 'Loup',
    color: '#9c8061',
    hp: 65,
    elite: 'Loup alpha',
    look: 'wolf',
    pal: ['#8c7a68', '#5a4a3c', '#b8a690', '#e8dcc8', '#ffcf40']
  },
  {
    name: 'Squelette',
    color: '#d4d4c9',
    hp: 90,
    elite: 'Squelette champion',
    look: 'skeleton',
    pal: ['#ddd6be', '#8f8670', '#fff8e0', '#6a5a40', '#ff6a4a'],
    opts: { off: 'shield', hold: 'sword', rags: '#a8784a' }
  },
  {
    name: 'Spectre',
    color: '#a998f2',
    hp: 85,
    elite: 'Spectre hurleur',
    look: 'ghost',
    pal: ['#a998f2', '#5a4aa0', '#dcd4ff', '#ffffff', '#ffffff']
  },
  {
    name: 'Araignée',
    color: '#8b6d8f',
    hp: 75,
    elite: 'Mygale matriarche',
    look: 'spider',
    pal: ['#4a3a34', '#2a1e1a', '#6e5a50', '#c84a3a', '#ff6a4a'],
    opts: { hairy: true }
  },
  {
    name: 'Golem',
    color: '#91a2b4',
    hp: 170,
    elite: 'Golem ancien',
    look: 'golem',
    pal: ['#91a2b4', '#5a6a7a', '#c8d4e0', '#7ad0ff', '#e0f8ff']
  },
  {
    name: 'Scorpion',
    color: '#e0b367',
    hp: 110,
    elite: 'Scorpion empereur',
    look: 'scorpion',
    pal: ['#c49a5a', '#8a6a3a', '#e8c48a', '#e04a3a', '#2a1a10']
  },
  {
    name: 'Élémentaire',
    color: '#ff8752',
    hp: 135,
    elite: 'Élémentaire ardent',
    look: 'elemental',
    pal: ['#ff8752', '#b4401a', '#ffc08a', '#ffe07a', '#fff6c0']
  },
  {
    name: 'Dragonnet',
    color: '#e86c80',
    hp: 190,
    elite: 'Dragonnet colérique',
    look: 'dragon',
    pal: ['#d86a7a', '#8a3a4a', '#ffa0b0', '#ffd36d', '#fff09a'],
    opts: { young: true }
  },
  {
    name: 'Gobelin',
    color: '#83bb67',
    hp: 85,
    elite: 'Chef gobelin',
    look: 'goblin',
    pal: ['#7a5a3a', '#4a3424', '#a4cc80', '#8a5a3a', '#ffd23f']
  },
  {
    name: 'Pilleur',
    color: '#c09a81',
    hp: 110,
    elite: 'Capitaine pilleur',
    look: 'raider',
    pal: ['#6e6a4a', '#3e3a2a', '#948e6a', '#d4a44a', '#201418']
  },
  {
    name: 'Sanglier',
    color: '#7975a8',
    hp: 65,
    elite: 'Vieux solitaire',
    look: 'boar',
    pal: ['#6e5444', '#46342a', '#957664', '#f4ecd8', '#ff5a3a']
  },
  {
    name: 'Ours',
    color: '#d38ac2',
    hp: 100,
    elite: 'Grizzli balafré',
    look: 'bear',
    pal: ['#6e4a32', '#46301e', '#8e6a4c', '#d8c0a0', '#2a1a10']
  },
  {
    name: 'Yéti',
    color: '#d4f1f5',
    hp: 165,
    elite: 'Yéti ancestral',
    look: 'yeti',
    pal: ['#e0eef2', '#9ab4c0', '#ffffff', '#7a9ab0', '#3a8aff']
  },
  {
    name: 'Troll',
    color: '#f19955',
    hp: 135,
    elite: 'Troll des cavernes',
    look: 'troll',
    pal: ['#6e8e5a', '#46603a', '#94b47a', '#c8a060', '#ffcf40']
  },
  {
    name: 'Gardien astral',
    color: '#7acbe6',
    hp: 210,
    elite: 'Gardien astral majeur',
    look: 'golem',
    pal: ['#5a7ab0', '#34507a', '#9ab8e8', '#7acbe6', '#e0f8ff'],
    opts: { style: 'astral' }
  },
  {
    name: 'Chauve-souris',
    color: '#8b78a8',
    hp: 48,
    elite: 'Chauve-souris vampire',
    look: 'bat',
    pal: ['#5a4a6e', '#34283e', '#8a789e', '#e0a0c0', '#ff4a4a']
  },
  {
    name: 'Bandit',
    color: '#bd7658',
    hp: 105,
    elite: 'Chef bandit',
    look: 'bandit',
    pal: ['#7a4a3a', '#3e2a24', '#a06a54', '#c84a3a', '#ffffff']
  },
  {
    name: 'Mante des roseaux',
    color: '#8bb66b',
    hp: 92,
    elite: 'Mante tranchante',
    look: 'mantis',
    pal: ['#7ab65a', '#4a7a34', '#a8e080', '#c8f0a0', '#ff4a4a']
  },
  {
    name: 'Corbeau spectral',
    color: '#6d719e',
    hp: 120,
    elite: 'Corbeau de mauvais augure',
    look: 'raven',
    pal: ['#4a4e7a', '#2a2c4a', '#7a80b0', '#e0c060', '#9fe8ff'],
    opts: { spectral: true }
  },
  {
    name: 'Basilic',
    color: '#6dba72',
    hp: 180,
    elite: 'Basilic ancien',
    look: 'basilisk',
    pal: ['#4e8e54', '#2e5a34', '#7cbc7c', '#e8d060', '#ffef60']
  },
  {
    name: 'Drake des dunes',
    color: '#d6a05b',
    hp: 225,
    elite: 'Drake à crête',
    look: 'drake',
    pal: ['#c8984e', '#8a6430', '#ecc888', '#e05a3a', '#fff09a']
  },
  {
    name: 'Araignée venimeuse',
    color: '#b46c9d',
    hp: 115,
    elite: 'Veuve des marais',
    look: 'spider',
    pal: ['#6a3a6e', '#3a1e40', '#9a6aa0', '#8ae04a', '#ff4a4a'],
    opts: { venom: true }
  },
  {
    name: 'Ent corrompu',
    color: '#668d4b',
    hp: 240,
    elite: 'Ent millénaire',
    look: 'treant',
    pal: ['#5e4a34', '#3a2c1e', '#86704e', '#c050ff', '#c8ff60'],
    opts: { corrupt: true }
  },
  {
    name: 'Chevalier déchu',
    color: '#737d9f',
    hp: 260,
    elite: 'Seigneur déchu',
    look: 'knight',
    pal: ['#737d9f', '#454e6e', '#a8b2d0', '#c84a5a', '#ff6a6a'],
    opts: { cape: '#2a2238', hold: 'greatsword', off: null }
  },
  {
    name: 'Wisp',
    color: '#8fe8ed',
    hp: 72,
    elite: 'Feu follet ardent',
    look: 'wisp',
    pal: ['#8fe8ed', '#4aa8b0', '#e0ffff', '#ffffff', '#ffffff']
  },
  {
    name: 'Molosse infernal',
    color: '#e36d4f',
    hp: 195,
    elite: 'Molosse des enfers',
    look: 'hound',
    pal: ['#a83a24', '#5a1a10', '#e0603a', '#ffd36b', '#fff0a0']
  },
  {
    name: 'Fée sauvage',
    color: '#e99bda',
    hp: 88,
    elite: 'Reine des fées',
    look: 'fairy',
    pal: ['#e99bda', '#a85a9a', '#ffd8f4', '#9fe8ff', '#4a2a6a']
  },
  {
    name: 'Minotaure',
    color: '#b98b67',
    hp: 290,
    elite: 'Minotaure ancien',
    look: 'minotaur',
    pal: ['#8a5e40', '#5a3a26', '#b08060', '#e8dcc0', '#ff4a3a']
  },
  {
    name: 'Serpent des glaces',
    color: '#9bdde8',
    hp: 160,
    elite: 'Serpent du givre',
    look: 'serpent',
    pal: ['#8ad0e0', '#4a8aa0', '#d0f4ff', '#ffffff', '#3ad0ff'],
    opts: { ice: true }
  },
  {
    name: 'Drake astral',
    color: '#9c86ff',
    hp: 310,
    elite: 'Drake céleste',
    look: 'dragon',
    pal: ['#7a68d8', '#4a3a90', '#b0a0ff', '#ffd36d', '#ffffff'],
    opts: { stars: true }
  },
  // Les Tréfonds, sous l'île (underground.js) : quatre créatures par biome, à la taille du héros qui les croise.
  {
    name: 'Ver des boues',
    color: '#8a6440',
    hp: 120,
    under: 0,
    elite: 'Ver dévoreur',
    look: 'worm',
    pal: ['#8a6440', '#5a3e26', '#b08a5e', '#e0c080', '#ffcf40']
  },
  {
    name: 'Taupe-garou',
    color: '#6a4e3a',
    hp: 150,
    under: 0,
    elite: 'Taupe-garou alpha',
    look: 'molebeast',
    pal: ['#5a4434', '#3a2a20', '#7e6450', '#f0b0a0', '#ff8a3a']
  },
  {
    name: 'Scarabée foreur',
    color: '#4a6a7a',
    hp: 110,
    under: 0,
    elite: 'Scarabée cuirassé',
    look: 'beetle',
    pal: ['#3a5a6a', '#20343e', '#6a8a9a', '#c8a040', '#ff6a3a']
  },
  {
    name: 'Gobelin des mines',
    color: '#8aa05a',
    hp: 95,
    under: 0,
    elite: 'Contremaître gobelin',
    look: 'goblin',
    pal: ['#6a5a4a', '#3e3428', '#b0c880', '#6a5a4a', '#ffd23f'],
    opts: { head: 'miner', hold: 'pickaxe', skin: '#8aa05a' }
  },
  {
    name: 'Sentinelle de pierre',
    color: '#8a8478',
    hp: 210,
    under: 1,
    elite: 'Sentinelle runique',
    look: 'golem',
    pal: ['#8a8478', '#5a564e', '#b8b2a4', '#7ad0ff', '#e0f8ff'],
    opts: { style: 'statue' }
  },
  {
    name: 'Spectre minier',
    color: '#7ab8e0',
    hp: 100,
    under: 1,
    elite: 'Contremaître spectral',
    look: 'ghost',
    pal: ['#7ab8e0', '#3a6a90', '#d0ecff', '#ffd36d', '#ffffff'],
    opts: { miner: true }
  },
  {
    name: 'Squelette nain',
    color: '#d8ccb0',
    hp: 115,
    under: 1,
    elite: 'Thane squelette',
    look: 'skeleton',
    pal: ['#d8ccb0', '#8a8068', '#f8f0d8', '#7a5a3a', '#7fd0ff'],
    opts: { head: 'helm', beard: '#c8bca0', hold: 'axe', off: 'shield' }
  },
  {
    name: 'Gargouille',
    color: '#6a6e7a',
    hp: 140,
    under: 1,
    elite: 'Gargouille ancienne',
    look: 'gargoyle',
    pal: ['#6a6e7a', '#3e424c', '#9aa0ac', '#c84a4a', '#ff6a4a']
  },
  {
    name: 'Goule',
    color: '#a8b49a',
    hp: 160,
    under: 2,
    elite: 'Goule vorace',
    look: 'ghoul',
    pal: ['#a8b49a', '#6a7a5e', '#d0dcc0', '#4a3a2a', '#ff4a4a']
  },
  {
    name: 'Âme errante',
    color: '#9ae8c0',
    hp: 85,
    under: 2,
    elite: 'Âme tourmentée',
    look: 'soul',
    pal: ['#9ae8c0', '#4aa880', '#e0fff0', '#ffffff', '#ffffff']
  },
  {
    name: 'Chevalier des tombes',
    color: '#5a5e6e',
    hp: 240,
    under: 2,
    elite: 'Seigneur des tombes',
    look: 'knight',
    pal: ['#5a5e6e', '#34384a', '#8a8ea0', '#6ad0a0', '#7affc0'],
    opts: { face: 'skull', head: 'helm', hold: 'greatsword', off: null, cape: '#24282e' }
  },
  {
    name: 'Corbeau des tombes',
    color: '#4a4258',
    hp: 90,
    under: 2,
    elite: 'Corbeau charognard',
    look: 'raven',
    pal: ['#3a3448', '#1e1a2a', '#6a6080', '#c8c060', '#7affc0']
  },
  {
    name: 'Myconide',
    color: '#c8604a',
    hp: 150,
    under: 3,
    elite: 'Myconide ancien',
    look: 'mushroom',
    pal: ['#c8604a', '#8a3a2a', '#f8e8c8', '#e8d8b8', '#fff0a0']
  },
  {
    name: 'Limace des fanges',
    color: '#6a7a3a',
    hp: 130,
    under: 3,
    elite: 'Limace géante',
    look: 'slug',
    pal: ['#6a7a3a', '#3e4a20', '#9aaa5a', '#c8e060', '#1a2010']
  },
  {
    name: 'Mille-pattes géant',
    color: '#9a4a2a',
    hp: 125,
    under: 3,
    elite: 'Mille-pattes royal',
    look: 'centipede',
    pal: ['#9a4a2a', '#5a2a16', '#c87a4a', '#f0c040', '#ffef60']
  },
  {
    name: 'Moustique des fanges',
    color: '#5a6a4a',
    hp: 70,
    under: 3,
    elite: 'Moustique gorgé',
    look: 'mosquito',
    pal: ['#5a6a4a', '#34402a', '#8a9a6a', '#c84a4a', '#ff4a4a']
  }
]);
// Nom affiché d'un monstre : celui de son espèce, ou de son élite.
/**
 * @param {{ t?: string, elite?: boolean }} m
 * @returns {string}
 */
export function mobTitle(m) {
  const name = m.t || '';
  if (!m.elite) return name;
  return MOB_TYPES.find(t => t.name === name)?.elite || name;
}
// Huit boss mondiaux persistants répartis dans les six biomes, au niveau de leur zone ; position fixée par la
// génération de l'île. Leurs PV et dégâts viennent de leur niveau (shared/rules/stats.js). Apparence : comme les
// monstres (`look`, `pal`, `opts`).
export const WORLD_BOSS_DEFS = deepFreeze([
  {
    id: 'fenrir',
    name: 'Fenrir, Croc Ancien',
    biome: 0,
    level: 10,
    hp: 1050,
    color: '#82c6d9',
    look: 'wolf',
    pal: ['#9ad0e0', '#5a8aa0', '#e0f6ff', '#ffffff', '#3ad0ff'],
    opts: { elite: true }
  },
  {
    id: 'nocturne',
    name: 'Nocturne, Gardien du Crépuscule',
    biome: 1,
    level: 20,
    hp: 2750,
    color: '#b28aff',
    look: 'owl',
    pal: ['#5a3a8a', '#2e1a50', '#9a7ad8', '#ffd36d', '#ffcf40']
  },
  {
    id: 'leviathan',
    name: 'Léviathan des Brumes',
    biome: 2,
    level: 30,
    hp: 1750,
    color: '#5dd8dc',
    look: 'serpent',
    pal: ['#3aa8b0', '#1e6a74', '#7ae0e4', '#e0f8ff', '#ffef60'],
    opts: { fins: true, elite: true }
  },
  {
    id: 'golem',
    name: 'Golem des Étoiles',
    biome: 3,
    level: 36,
    hp: 3450,
    color: '#bb93ff',
    look: 'golem',
    pal: ['#6a4ab0', '#3a2870', '#a888ff', '#ffd36d', '#ffffff'],
    opts: { style: 'astral', halo: true }
  },
  {
    id: 'colosse',
    name: 'Colosse des Cimes Éternelles',
    biome: 3,
    level: 40,
    hp: 3950,
    color: '#d2e9f5',
    look: 'golem',
    pal: ['#c8dcea', '#7a96aa', '#ffffff', '#7ad8ff', '#3ad0ff'],
    opts: { style: 'ice', crown: true }
  },
  {
    id: 'ifrit',
    name: 'Ifrit, Cœur de Braise',
    biome: 4,
    level: 45,
    hp: 2450,
    color: '#f58c48',
    look: 'ifrit',
    pal: ['#e8642a', '#9c3010', '#ffa05a', '#ffd36b', '#fff6a0']
  },
  {
    id: 'seraph',
    name: 'Séraphin Déchu',
    biome: 4,
    level: 50,
    hp: 5200,
    color: '#ff6d92',
    look: 'angel',
    pal: ['#d0507a', '#7a2040', '#ff9ab8', '#2a1020', '#ffd0e0'],
    opts: { wings6: true, dark: true, hold: 'greatsword' }
  },
  {
    id: 'chronos',
    name: 'Chronos, Dévoreur du Continuum',
    biome: 5,
    level: 60,
    hp: 6100,
    color: '#72e6f4',
    look: 'horror',
    pal: ['#2a5a7a', '#123048', '#5ab0d0', '#72e6f4', '#e0ffff'],
    opts: { style: 'clock' }
  }
]);
export const BOSS_RESPAWN_MS = 12 * 60 * 1000;
