// @ts-check
// La Citadelle des Pénitents : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'penitents',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Citadelle des Pénitents',
    biome: 2,
    boss: 'Le Grand Inquisiteur',
    bosses: ['Le Geôlier Flagellant', 'La Mère Supérieure', 'Le Grand Inquisiteur'],
    secrets: ['Le Pénitent Oublié'],
    color: '#b79cff',
    level: 25,
    mobLevel: 27,
    rarity: 'Rare',
    dropLevel: 28
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'chasm', pools: 0 },
    wallProps: ['torch', 'banner', 'chains', 'banner'],
    floorProps: ['pillar', 'candles', 'cage', 'statue', 'brazier', 'candles'],
    centerpiece: 'altar',
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Pénitent flagellant',
        look: 'penitent',
        pal: ['#6b5a48', '#463a2e', '#8f7b64', '#a03030', '#ff6040']
      },
      {
        name: 'Chevalier spectral',
        look: 'knight',
        pal: ['#8d9ac4', '#56608a', '#c9d3f0', '#ab94ee', '#d6ccff'],
        spectral: true
      }
    ],
    bosses: [
      {
        look: 'ogre',
        pal: ['#5a5560', '#33303a', '#807a8a', '#b79cff', '#e2d4ff'],
        hold: 'whip',
        off: 'chain'
      },
      {
        look: 'caster',
        pal: ['#e8e4f0', '#a8a0b8', '#ffffff', '#5a161a', '#b79cff'],
        head: 'veil',
        face: 'human',
        hold: 'censer',
        off: 'book'
      },
      {
        look: 'humanoid',
        pal: ['#4a4458', '#2a2636', '#7c7490', '#b79cff', '#e2d4ff'],
        robe: true,
        head: 'mitre',
        hatColor: '#a82a2a',
        hold: 'flail',
        off: 'book',
        cape: '#6a1a1a'
      }
    ],
    secrets: [
      {
        look: 'skeleton',
        pal: ['#8a8494', '#4a4652', '#b8b2c4', '#b79cff', '#e2d4ff'],
        head: 'hood',
        hold: 'whip',
        off: null,
        rags: '#5a4a3a'
      }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'flagstone', a: '#56565c', b: '#3c3c42', c: '#77777e' },
    accent: { style: 'carpet', a: '#6e1c22', b: '#521418', c: '#c9a24a' },
    wall: { style: 'brick', top: '#111115', face: '#4b4a52', dark: '#303036', light: '#6c6b74' },
    hazard: { a: '#050506', b: '#101014', c: '#26262c' },
    light: { dark: 0.54, tint: '10,8,16' },
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#b79cff',
    banner: ['#5a161a', '#d6ccff'],
    pillar: ['#5c5b63', '#3a3a40', '#807f88'],
    particles: 'dust'
  }
};
