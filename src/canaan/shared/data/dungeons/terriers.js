// @ts-check
// La Cave des Terriers Abandonnés : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'terriers',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Cave des Terriers Abandonnés',
    biome: 0,
    boss: 'Gardien des Os',
    bosses: ['Grignotte, Reine des Rats', 'Le Fossoyeur Bossu', 'Gardien des Os'],
    secrets: ['Le Rat-Roi aux Mille Queues'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['braziers', 'search', 'levers'],
    mechanics: [
      ['charge', 'adds'],
      ['slam', 'pools'],
      ['nova', 'rain', 'adds']
    ],
    secretMechanics: [['charge', 'spread', 'adds']],
    color: '#a3c7ff',
    level: 7,
    mobLevel: 9,
    rarity: 'Rare',
    dropLevel: 10
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'cave',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 2 },
    wallProps: ['torch', 'roots', 'beam', 'roots'],
    floorProps: ['bones', 'mushroom', 'burrow', 'crate', 'rubble', 'bones', 'mushroom'],
    centerpiece: 'bonethrone',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: null,
    secret: 'wall',
    dark: 1,
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Osselet',
        look: 'skeleton',
        pal: ['#ddd6be', '#8f8670', '#fff8e0', '#6a5a40', '#7fd0ff'],
        small: true,
        hold: 'club',
        off: null
      },
      { name: 'Rat des terriers', look: 'rat', pal: ['#7a5d44', '#4b3828', '#a3846a', '#e6a7a7', '#ff5040'] }
    ],
    bosses: [
      { look: 'rat', pal: ['#8a6a50', '#4e3a2a', '#b89878', '#e6a7a7', '#ff5040'], elite: true, crown: true },
      {
        look: 'humanoid',
        pal: ['#5a4a3a', '#2e241a', '#80705a', '#c9a46e', '#a3c7ff'],
        build: 'stocky',
        head: 'hood',
        hold: 'shovel',
        off: 'lantern',
        hoodColor: '#3a2e22'
      },
      {
        look: 'skeleton',
        pal: ['#ece5cc', '#9a917a', '#fffbe8', '#5a6a8a', '#8fd8ff'],
        crown: true,
        hold: 'greatsword',
        off: 'shield',
        elite: true
      }
    ],
    secrets: [
      {
        look: 'rat',
        pal: ['#4a3a30', '#2a1e16', '#7a6050', '#d0a040', '#ffd040'],
        elite: true,
        crown: true,
        tails: true
      }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'dirt', a: '#5b4733', b: '#3e2f21', c: '#7d6449' },
    accent: { style: 'gravel', a: '#54412f', b: '#3a2c1f', c: '#7a6450' },
    wall: { style: 'rock', top: '#17110c', face: '#4d3b2b', dark: '#2e231a', light: '#6d5640' },
    hazard: { a: '#1d3640', b: '#2c5563', c: '#7fb3c0' },
    light: { dark: 0.66, tint: '20,12,4' },
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#a3c7ff',
    banner: ['#6b4a2e', '#c9a46e'],
    pillar: ['#5b4836', '#3b2d21', '#7d6650'],
    particles: 'dust'
  }
};
