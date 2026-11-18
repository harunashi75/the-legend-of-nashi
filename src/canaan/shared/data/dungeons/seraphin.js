// @ts-check
// Le Thronos du Séraphin Divin : raid (six boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'seraphin',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Le Thronos du Séraphin Divin',
    biome: 5,
    boss: 'Le Séraphin Divin',
    bosses: [
      'Le Chérubin Vigilant',
      'L’Archonte Radieux',
      'Le Trône Ailé',
      'La Sentinelle Auréolée',
      'La Voix du Chœur',
      'Le Séraphin Divin'
    ],
    secrets: ['L’Ange Déchu Sans Nom', 'Le Gardien du Septième Ciel'],
    color: '#c4a0ff',
    raid: true,
    level: 54,
    mobLevel: 56,
    rarity: 'Épique',
    dropLevel: 57
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'void',
    accent: { width: 1 },
    hazard: { style: 'clouds', pools: 0 },
    wallProps: [],
    floorProps: ['pillar', 'angelstatue', 'brazier', 'feathers', 'pillar'],
    centerpiece: 'throne',
    gate: 'barrier'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
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
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'marble', a: '#e4ddd0', b: '#c4bba8', c: '#d4aa3a' },
    accent: { style: 'carpet', a: '#d4aa3a', b: '#a8822a', c: '#fff4c0' },
    wall: { style: 'marble', top: '#cfc6b4', face: '#e8e0d0', dark: '#b8ae98', light: '#fffaf0' },
    hazard: { a: '#9fb8e0', b: '#c8d8f4', c: '#ffffff' },
    light: { dark: 0.16, tint: '40,24,60' },
    flame: ['#f0b030', '#ffe070', '#ffffff'],
    rune: '#c4a0ff',
    banner: ['#f4f0e4', '#d4aa3a'],
    pillar: ['#efe8da', '#c8bea8', '#ffffff'],
    particles: 'feathers'
  }
};
