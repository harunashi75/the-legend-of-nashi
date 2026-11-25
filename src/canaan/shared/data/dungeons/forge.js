// @ts-check
// La Forge d’Écaille-Ardente : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'forge',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Forge d’Écaille-Ardente',
    biome: 3,
    boss: 'Pyrrhax, Wyrm d’Écaille-Ardente',
    bosses: ['Maître-Forgeron Kraag', 'L’Élémentaire de Scories', 'Pyrrhax, Wyrm d’Écaille-Ardente'],
    secrets: ['La Salamandre d’Obsidienne'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['braziers', 'toggles', 'guardian'],
    mechanics: [
      ['slam', 'charge', 'soak'],
      ['pools', 'nova', 'adds'],
      ['beam', 'rain', 'safe', 'totems']
    ],
    secretMechanics: [['charge', 'pools', 'donut']],
    color: '#6bdfa2',
    level: 32,
    mobLevel: 34,
    rarity: 'Rare',
    dropLevel: 35
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'lava', pools: 3, glow: '#ff6a1f' },
    wallProps: ['furnace', 'chains', 'torch', 'chains'],
    floorProps: ['anvil', 'rack', 'brazier', 'ingots', 'dragonskull', 'ingots'],
    centerpiece: 'greatforge',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: 'jets',
    secret: 'torch',
    dark: 1,
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Diablotin des forges',
        look: 'imp',
        pal: ['#e2652a', '#9c3a14', '#ffa05a', '#ffd36b', '#fff0a0']
      },
      {
        name: 'Dragonnet ardent',
        look: 'dragon',
        pal: ['#c4462a', '#7c2412', '#f08050', '#ffcf5a', '#fff09a'],
        young: true
      }
    ],
    bosses: [
      {
        look: 'humanoid',
        pal: ['#7a4a30', '#4a2a18', '#a87050', '#ff8a3c', '#ffd36b'],
        build: 'big',
        bare: true,
        skin: '#a87a5a',
        beard: '#3a2418',
        head: 'bandana',
        hold: 'hammer',
        kilt: '#4a3020',
        barefoot: false
      },
      { look: 'elemental', pal: ['#3a2a26', '#1e1412', '#5a3d33', '#ff6a1f', '#ffd36b'], rock: true },
      { look: 'dragon', pal: ['#d0401c', '#7a1e0c', '#ff8a4a', '#ffd36b', '#fff6b0'], elite: true }
    ],
    secrets: [{ look: 'basilisk', pal: ['#1e1a22', '#0c0a10', '#3e3446', '#ff6a1f', '#ffd36b'], elite: true }]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'basalt', a: '#3a2a26', b: '#261a17', c: '#5a3d33' },
    accent: { style: 'grate', a: '#2e2e33', b: '#1c1c20', c: '#ff8a3c' },
    wall: { style: 'rock', top: '#120806', face: '#3d2620', dark: '#25150f', light: '#5e3a2c' },
    hazard: { a: '#b8360f', b: '#ff6a1f', c: '#ffd36b' },
    light: { dark: 0.44, tint: '30,6,0' },
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#ff7a2a',
    banner: ['#3a1408', '#ff8a3c'],
    pillar: ['#4a302a', '#2a1a16', '#6e4a3c'],
    particles: 'embers'
  }
};
