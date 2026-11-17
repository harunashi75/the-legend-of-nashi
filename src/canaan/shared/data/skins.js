// Apparences (transmogrification) : des tenues complètes, purement visuelles, qu'on trouve en jouant et qu'on porte
// par-dessus son équipement. Une apparence est un ensemble : corps (robe, armure, salopette…), coiffe, dos (cape,
// ailes, carquois…), épaulières et effets vivants. Plus la qualité est haute, plus la tenue est travaillée : une
// tenue Mythique a des ailes, une aura et des particules ; une Commune est un simple habit.
// Module partagé pur (shared/data) : aucune dépendance au navigateur.
import { deepFreeze } from '../freeze.js';

// rarity : indice dans GEAR_RARITIES (0 Commun … 5 Mythique). main / cape : [sombre, moyen, clair].
export const SKINS = deepFreeze([
  // Communes : habits de tous les jours.
  { id: 'fermier', name: 'Habit de fermier', rarity: 0, body: 'overalls', head: 'strawhat', back: null, main: ['#2e4a7a', '#3e5e96', '#5a7ab4'], cape: ['#8a3a2a', '#b04a36', '#d06a4e'], trim: '#e8c860', accent: '#c84a3a' },
  { id: 'villageois', name: 'Tunique de villageois', rarity: 0, body: 'tunic', head: null, back: null, main: ['#3a5a2e', '#4e7a3e', '#6e9a56'], cape: ['#5a4030', '#7a5a42', '#9a7a5a'], trim: '#a8885a', accent: '#c8a868' },
  { id: 'pecheur', name: 'Ciré de pêcheur', rarity: 0, body: 'coat', head: 'rainhat', back: null, main: ['#a88a1e', '#d0aa2a', '#f0d050'], cape: ['#a88a1e', '#d0aa2a', '#f0d050'], trim: '#5a4a2a', accent: '#3a6a9a' },
  { id: 'cuisinier', name: 'Tablier de cuisinier', rarity: 0, body: 'tunic', head: 'chefhat', back: null, main: ['#c8c8c0', '#e8e8e0', '#ffffff'], cape: ['#c8c8c0', '#e8e8e0', '#ffffff'], trim: '#c84a3a', accent: '#c84a3a' },
  { id: 'bucheron', name: 'Chemise de bûcheron', rarity: 0, body: 'tunic', head: 'bandana', back: 'backpack', main: ['#7a1e1e', '#a82a2a', '#d04a3a'], cape: ['#4a3422', '#6a4a30', '#8e6a48'], trim: '#2a2020', accent: '#2a2020' },
  // Peu communes : tenues de métier.
  { id: 'rodeur', name: 'Cuir de rôdeur', rarity: 1, body: 'leather', head: 'hood', back: 'quiver', main: ['#3a4a2a', '#4e6236', '#6e8a4e'], cape: ['#2a3a22', '#3e5a2e', '#5e7e3e'], trim: '#a8885a', accent: '#8a6a48' },
  { id: 'apprenti', name: 'Robe d’apprenti mage', rarity: 1, body: 'robe', head: 'wizard', back: null, main: ['#2a3a7a', '#3a4e9a', '#5a70c0'], cape: ['#2a3a7a', '#3a4e9a', '#5a70c0'], trim: '#e0c060', accent: '#e0c060' },
  { id: 'marin', name: 'Vareuse de marin', rarity: 1, body: 'tunic', head: 'tricorne', back: null, main: ['#e8e8f0', '#f4f4f8', '#ffffff'], cape: ['#1e2a5a', '#2e4084', '#4a62b0'], trim: '#2e4084', accent: '#c83a3a', stripes: true },
  { id: 'moine', name: 'Robe de moine', rarity: 1, body: 'robe', head: null, back: null, main: ['#a85a1e', '#d0782a', '#f09a4a'], cape: ['#a85a1e', '#d0782a', '#f09a4a'], trim: '#6a3a14', accent: '#6a3a14' },
  { id: 'garde', name: 'Armure de garde du camp', rarity: 1, body: 'plate', head: 'helm', back: 'cape', main: ['#5a6270', '#7a8494', '#a8b2c0'], cape: ['#3a4a6a', '#4e6290', '#6a80b0'], trim: '#c8a868', accent: '#4e6290' },
  // Rares : tenues d'aventurier aguerri.
  { id: 'chevalier', name: 'Armure de chevalier', rarity: 2, body: 'plate', head: 'helm', plume: true, back: 'longcape', shoulders: 'plate', main: ['#6a7488', '#8e98ac', '#c8d0dc'], cape: ['#6a1414', '#9a2020', '#c83a2a'], trim: '#e0c060', accent: '#c83a2a' },
  { id: 'mage', name: 'Robe de mage de bataille', rarity: 2, body: 'robe', head: 'wizard', back: 'longcape', shoulders: 'gold', main: ['#3a1e5a', '#5a2e84', '#8a4ec0'], cape: ['#1e1440', '#2e1e5e', '#4a3488'], trim: '#e0c060', accent: '#7de0ff' },
  { id: 'druide', name: 'Parure de druide', rarity: 2, body: 'leather', head: 'leafhood', back: 'leafcape', main: ['#4a3a22', '#6a5230', '#8e7048'], cape: ['#2e5a22', '#3e7a2e', '#5e9e3e'], trim: '#9ad868', accent: '#e85a8a' },
  { id: 'pirate', name: 'Manteau de capitaine pirate', rarity: 2, body: 'coat', head: 'tricorne', back: 'cape', main: ['#6a1414', '#9a2020', '#c83a2a'], cape: ['#1a1414', '#2a2020', '#3e3030'], trim: '#e0c060', accent: '#e0c060' },
  { id: 'samourai', name: 'Armure de samouraï', rarity: 2, body: 'kimono', head: 'kabuto', back: null, shoulders: 'plate', main: ['#6a1414', '#9a2020', '#c83a2a'], cape: ['#1a1a20', '#2a2a32', '#3e3e4a'], trim: '#e0c060', accent: '#1a1a20' },
  // Épiques : tenues de héros, avec un premier effet.
  { id: 'paladin', name: 'Harnois de paladin', rarity: 3, body: 'plate', head: 'winghelm', back: 'longcape', shoulders: 'gold', main: ['#c8c4b8', '#e8e4d8', '#ffffff'], cape: ['#c8c0a8', '#e8e0c8', '#fffaf0'], trim: '#e8b830', accent: '#e8b830', fx: ['sparkle'], glow: '#ffe890' },
  { id: 'necro', name: 'Robe de nécromancien', rarity: 3, body: 'robe', head: 'skullhood', back: 'longcape', shoulders: 'skull', main: ['#1a1a22', '#26262e', '#3a3a46'], cape: ['#14101a', '#201828', '#2e2238'], trim: '#7affb0', accent: '#7affb0', fx: ['shadow'], glow: '#7affb0' },
  { id: 'givre', name: 'Armure du chevalier de givre', rarity: 3, body: 'plate', head: 'icecrown', back: 'longcape', shoulders: 'spiked', main: ['#5a8aa8', '#7ab0d0', '#c8ecff'], cape: ['#2a4a7a', '#3e6aa8', '#6a9ad8'], trim: '#e8f8ff', accent: '#9ae8ff', fx: ['frost'], glow: '#bfefff' },
  { id: 'ninja', name: 'Tenue de ninja des ombres', rarity: 3, body: 'leather', head: 'mask', back: 'scarf', main: ['#14141c', '#1e1e28', '#2e2e3e'], cape: ['#6a1414', '#9a2020', '#c83a2a'], trim: '#4e4e66', accent: '#c83a2a', fx: ['shadow'], glow: '#6a5aa8' },
  { id: 'fleurs', name: 'Robe de la sorcière des fleurs', rarity: 3, body: 'gown', head: 'flowercrown', back: 'fairywings', main: ['#c05a8a', '#e07aaa', '#f8a8cc'], cape: ['#9ae8c8', '#c8fff0', '#ffffff'], trim: '#fff0a8', accent: '#9ad868', fx: ['petals'], glow: '#ffc8e8' },
  // Légendaires : ailes, flammes et auréoles.
  { id: 'dragon', name: 'Armure du chevalier-dragon', rarity: 4, body: 'plate', head: 'hornhelm', back: 'dragonwings', shoulders: 'spiked', main: ['#6a1414', '#9a2020', '#d03a2a'], cape: ['#5a1010', '#8a1e1a', '#c8402a'], trim: '#ffb040', accent: '#ffd36d', fx: ['embers'], glow: '#ff8a3c' },
  { id: 'seraphin', name: 'Vêtements du séraphin', rarity: 4, body: 'robe', head: 'halo', back: 'angelwings', shoulders: 'gold', main: ['#e8e0c8', '#fff8e8', '#ffffff'], cape: ['#d8d0c0', '#f4f0e8', '#ffffff'], trim: '#e8b830', accent: '#e8b830', fx: ['sparkle', 'halo'], glow: '#fff0a8' },
  { id: 'demon', name: 'Armure du seigneur démon', rarity: 4, body: 'plate', head: 'horns', back: 'batwings', shoulders: 'spiked', main: ['#1a1014', '#2a181e', '#4a2a32'], cape: ['#3a0a14', '#5a1020', '#8a1e30'], trim: '#c8303a', accent: '#ff5050', fx: ['embers'], glow: '#c84aff', ember: '#c84aff', eyes: '#ff3030' },
  { id: 'phenix', name: 'Robe du phénix', rarity: 4, body: 'robe', head: 'circlet', back: 'flamecape', shoulders: 'gold', main: ['#a82a14', '#d84a1e', '#ff8a3c'], cape: ['#d84a1e', '#ff8a3c', '#ffd36d'], trim: '#ffd36d', accent: '#fff0a0', fx: ['embers'], glow: '#ffa040' },
  // Mythiques : tenues de légende, aura et particules permanentes.
  { id: 'celeste', name: 'Armure de l’empereur céleste', rarity: 5, body: 'plate', head: 'crown', back: 'angelwings', cape: ['#1a2a6a', '#2a3e9a', '#4a62d0'], shoulders: 'gold', main: ['#c89a2a', '#f0c040', '#fff0a0'], trim: '#ffffff', accent: '#7ab8ff', fx: ['aura', 'stars', 'halo'], glow: '#9fd8ff', wings6: true },
  { id: 'dragondor', name: 'Armure du dragon d’or ancestral', rarity: 5, body: 'plate', head: 'dragoncrown', back: 'dragonwings', shoulders: 'spiked', main: ['#a87a1e', '#e0aa2a', '#fff0a0'], cape: ['#8a5a14', '#c8902a', '#f0c860'], trim: '#ffffff', accent: '#ff5030', fx: ['aura', 'embers'], glow: '#ffd36d', ember: '#ffd36d', eyes: '#ff8a30', big: true },
  { id: 'neant', name: 'Robe du souverain du néant', rarity: 5, body: 'robe', head: 'hood', back: 'batwings', big: true, shoulders: 'skull', main: ['#140a24', '#20103a', '#3a1e6a'], cape: ['#1a0a30', '#3a1a6a', '#6a3ab0'], trim: '#c84aff', accent: '#ff7fe8', fx: ['aura', 'stars', 'shadow'], glow: '#b84aff', eyes: '#ff7fe8' },
  { id: 'aurore', name: 'Parure du gardien de l’aurore', rarity: 5, body: 'gown', head: 'halo', back: 'fairywings', shoulders: 'gold', main: ['#2a8a8a', '#3ab8a8', '#8ae8d8'], cape: ['#ff9ad8', '#c8a8ff', '#9ae8ff'], trim: '#fff0a8', accent: '#ff9ad8', fx: ['aura', 'sparkle', 'petals', 'halo'], glow: '#9affe8', big: true },
  // Cité elfique de Sylvaëlle : tenues vendues par la Tisseuse (price, en or), jamais tirées au butin.
  { id: 'elfe_rodeur', name: 'Tenue du rôdeur sylvestre', rarity: 2, shop: 3000, body: 'leather', head: 'leafhood', back: 'quiver', shoulders: 'gold', main: ['#2e5a3a', '#3e7a4e', '#6aaa6e'], cape: ['#2e6a3a', '#3e8a4a', '#6ab86a'], trim: '#e8c860', accent: '#e8c860' },
  { id: 'elfe_mage', name: 'Robe de mage de Sylvaëlle', rarity: 3, shop: 8000, body: 'gown', head: 'circlet', back: 'longcape', shoulders: 'gold', main: ['#c8d8d0', '#e8f4ee', '#ffffff'], cape: ['#2a8a7a', '#3ab8a0', '#8ae8d0'], trim: '#e8c860', accent: '#5ac8a0', fx: ['sparkle'], glow: '#9affe0' },
  { id: 'elfe_gardien', name: 'Armure du gardien elfe', rarity: 4, shop: 20000, body: 'plate', head: 'winghelm', back: 'angelwings', shoulders: 'gold', main: ['#b8963a', '#e0bc52', '#fff0a0'], cape: ['#3e8a4a', '#9ad8a0', '#e8fff0'], trim: '#ffffff', accent: '#5ac8a0', fx: ['sparkle', 'petals'], glow: '#d8ffb0' },
  { id: 'elfe_reine', name: 'Parure de la reine des elfes', rarity: 5, shop: 50000, body: 'gown', head: 'crown', back: 'fairywings', big: true, shoulders: 'gold', main: ['#e8e4d8', '#fffaf0', '#ffffff'], cape: ['#9affe0', '#c8fff0', '#ffffff'], trim: '#f0c040', accent: '#5ac8a0', fx: ['aura', 'sparkle', 'petals', 'halo'], glow: '#c8fff0' }
]);
export const SKIN_IDS = Object.freeze(SKINS.map(s => s.id));
export function skinById(id) {
  return SKINS.find(s => s.id === id) || null;
}
// Chance qu'une source donne une apparence, puis poids de chaque qualité (Commun … Mythique).
export const SKIN_DROPS = deepFreeze({
  normal: { chance: 0.004, weights: [80, 20, 0, 0, 0, 0] },
  elite: { chance: 0.02, weights: [45, 40, 15, 0, 0, 0] },
  dungeon: { chance: 0.06, weights: [0, 30, 50, 18, 2, 0] },
  raid: { chance: 0.08, weights: [0, 0, 35, 45, 18, 2] },
  secretBoss: { chance: 0.18, weights: [0, 0, 20, 45, 28, 7] },
  worldBoss: { chance: 0.1, weights: [0, 10, 40, 35, 13, 2] },
  secretChest: { chance: 0.12, weights: [0, 0, 25, 40, 25, 10] },
  arenaBoss: { chance: 0.05, weights: [0, 0, 30, 40, 24, 6] }
});
// Une apparence déjà possédée est revendue d'office, selon sa qualité.
export const SKIN_DUPLICATE_GOLD = Object.freeze([60, 120, 300, 700, 1600, 4000]);
