// @ts-check
// La Fosse d’Expiation : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'fosse',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Fosse d’Expiation',
    biome: 3,
    boss: 'Le Bourreau de l’Expiation',
    bosses: ['Le Gardien des Chaînes', 'La Pleureuse des Abysses', 'Le Bourreau de l’Expiation'],
    secrets: ['Celui-qui-Rampe-au-Fond'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['memory', 'guardian', 'runes'],
    mechanics: [
      ['pull', 'slam', 'cross'],
      ['donut', 'spread', 'adds'],
      ['charge', 'safe', 'soak', 'berserk']
    ],
    secretMechanics: [['pools', 'pull', 'nova']],
    color: '#e88aff',
    level: 37,
    mobLevel: 39,
    rarity: 'Rare',
    dropLevel: 40
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'pit',
    accent: { width: 0 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['chains', 'sconce', 'chains', 'skulls'],
    floorProps: ['bonepile', 'cage', 'spikes', 'rack', 'brazier', 'bones'],
    centerpiece: 'block',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: 'spikes',
    secret: 'statue',
    dark: 1.35,
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Âme damnée',
        look: 'soul',
        pal: ['#8a6ab0', '#4a3a68', '#c4a8ec', '#e88aff', '#f4d0ff'],
        chains: true,
        wail: true
      },
      {
        name: 'Geôlier de la Fosse',
        look: 'humanoid',
        pal: ['#5a4a4a', '#352a2a', '#7c6a6a', '#8a2a2a', '#ff4a4a'],
        build: 'stocky',
        head: 'hood',
        face: 'mask',
        hold: 'flail',
        off: 'chain'
      }
    ],
    bosses: [
      {
        look: 'knight',
        pal: ['#3a3a40', '#1e1e22', '#5e5e66', '#e88aff', '#f4d0ff'],
        chains: true,
        hold: 'flail',
        off: 'chain'
      },
      { look: 'ghost', pal: ['#6a5070', '#3a2840', '#a080b0', '#e88aff', '#ffffff'], hands: true },
      {
        look: 'humanoid',
        pal: ['#4a3438', '#2a1c20', '#6e5056', '#c03040', '#ff5050'],
        build: 'big',
        head: 'cowl',
        face: 'shadow',
        bare: true,
        skin: '#b8907a',
        hold: 'greataxe',
        kilt: '#2a1a1a',
        barefoot: true
      }
    ],
    secrets: [
      { look: 'horror', pal: ['#1e1420', '#0c080e', '#3e2a42', '#e88aff', '#ffd0ff'], style: 'tentacle' }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'flagstone', a: '#3a2c34', b: '#271d23', c: '#56424c' },
    accent: { style: 'grate', a: '#2a2228', b: '#18121a', c: '#9a3ad8' },
    wall: { style: 'rock', top: '#0a0709', face: '#33262c', dark: '#1f171b', light: '#4d3a42' },
    hazard: { a: '#040206', b: '#120a16', c: '#3a2048' },
    light: { dark: 0.68, tint: '16,4,20' },
    flame: ['#8a2ad8', '#c47aff', '#f4d0ff'],
    rune: '#e88aff',
    banner: ['#2a1420', '#e88aff'],
    pillar: ['#4a3a42', '#2a2026', '#6a5560'],
    particles: 'motes'
  }
};
