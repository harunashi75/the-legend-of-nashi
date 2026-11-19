// @ts-check
// La Mine Oubliée du Mithril : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'mine',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Mine Oubliée du Mithril',
    biome: 1,
    boss: 'Golem de Mithril',
    bosses: ['Le Contremaître Kobold Grisch', 'L’Araignée des Galeries', 'Golem de Mithril'],
    secrets: ['Le Mineur Sans Visage'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['mirrors', 'ambush', 'toggles'],
    mechanics: [
      ['slam', 'charge', 'adds'],
      ['pools', 'spread', 'blink'],
      ['cross', 'nova', 'totems']
    ],
    secretMechanics: [['blink', 'safe', 'slam']],
    color: '#67d8ee',
    level: 13,
    mobLevel: 15,
    rarity: 'Rare',
    dropLevel: 16
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 0 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['lantern', 'mithril', 'beam', 'mithril'],
    floorProps: ['minecart', 'crate', 'ore', 'pickaxe', 'rubble', 'ore'],
    centerpiece: 'mithrilcluster',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; falling : éboulements ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: 'falling',
    secret: 'torch',
    dark: 1.1,
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Mineur maudit',
        look: 'humanoid',
        pal: ['#6b7a8c', '#3d4652', '#93a3b5', '#c9a24a', '#9fe8ff'],
        build: 'stocky',
        head: 'miner',
        skin: '#9aa48c',
        hold: 'pickaxe',
        armsBare: true
      },
      {
        name: 'Kobold des galeries',
        look: 'kobold',
        pal: ['#a67c4f', '#6e5033', '#c9a074', '#e0d060', '#ffd23f']
      }
    ],
    bosses: [
      {
        look: 'kobold',
        pal: ['#8a7a5a', '#4e4430', '#b0a07a', '#c9a24a', '#9fe8ff'],
        head: 'crown',
        hold: 'whip',
        elite: true
      },
      {
        look: 'spider',
        pal: ['#3d4652', '#22282e', '#6a7a8c', '#9fe8ff', '#c8f7ff'],
        hairy: true,
        elite: true
      },
      { look: 'golem', pal: ['#9fb6c9', '#5c6f80', '#e3f2ff', '#7de0ff', '#c8f7ff'], style: 'metal' }
    ],
    secrets: [
      {
        look: 'humanoid',
        pal: ['#2a2e36', '#14161a', '#4a5260', '#ffcf6a', '#ffffff'],
        head: 'miner',
        face: 'shadow',
        hold: 'pickaxe',
        off: 'lantern',
        cape: '#14161a'
      }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'stone', a: '#4a4a52', b: '#34343b', c: '#686872' },
    accent: { style: 'rails', a: '#4a4a52', b: '#5e4430', c: '#a7aab4' },
    wall: { style: 'rock', top: '#101218', face: '#3d434d', dark: '#262a32', light: '#5d6673' },
    hazard: { a: '#06070a', b: '#12141a', c: '#2a2e38' },
    light: { dark: 0.62, tint: '6,10,20' },
    flame: ['#e5822e', '#f9c640', '#fff6c5'],
    rune: '#67d8ee',
    banner: ['#3d4652', '#9fe8ff'],
    pillar: ['#5e4430', '#3b2a1d', '#80614a'],
    particles: 'dust'
  }
};
