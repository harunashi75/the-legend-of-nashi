// @ts-check
// L’Aiguille du Continuum : raid (six boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'continuum',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'L’Aiguille du Continuum',
    biome: 4,
    boss: 'Le Dévoreur Stellaire',
    bosses: [
      'L’Horloger Fou',
      'Le Gardien des Rouages',
      'Le Sablier Vivant',
      'La Tisseuse du Temps',
      'L’Écho des Âges',
      'Le Dévoreur Stellaire'
    ],
    secrets: ['Le Paradoxe Errant', 'L’Enfant d’Avant le Temps'],
    color: '#ff7fa7',
    raid: true,
    level: 49,
    mobLevel: 51,
    rarity: 'Épique',
    dropLevel: 52
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'void',
    accent: { width: 0 },
    hazard: { style: 'stars', pools: 0 },
    wallProps: [],
    floorProps: ['gear', 'hourglass', 'crystal', 'pillar', 'crystal', 'gear'],
    centerpiece: 'orrery',
    gate: 'barrier'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      { name: 'Rouage animé', look: 'golem', pal: ['#b08a3a', '#6e5420', '#e0c070', '#7de0ff', '#c8f7ff'] },
      { name: 'Ombre astrale', look: 'spirit', pal: ['#ed8bc1', '#8a4a7a', '#ffc0e4', '#9fd8ff', '#ffffff'] }
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
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'arcane', a: '#343954', b: '#22263a', c: '#4c5478', glow: '#7de0ff' },
    accent: { style: 'runes', a: '#4a4220', b: '#2e2812', c: '#7de0ff' },
    wall: { style: 'brick', top: '#0b0c18', face: '#40405e', dark: '#2a2a40', light: '#5e5e86' },
    hazard: { a: '#05040f', b: '#1a1238', c: '#9fd8ff' },
    light: { dark: 0.46, tint: '10,6,30' },
    flame: ['#3a8ad8', '#7ad0ff', '#e0f8ff'],
    rune: '#ff7fa7',
    banner: ['#262a40', '#7de0ff'],
    pillar: ['#8a7034', '#54421c', '#c0a050'],
    particles: 'sparks'
  }
};
