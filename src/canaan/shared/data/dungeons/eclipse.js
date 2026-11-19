// @ts-check
// Le Sanctuaire de l’Éclipse : donjon (trois boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'eclipse',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Le Sanctuaire de l’Éclipse',
    biome: 1,
    boss: 'Oracle de l’Éclipse',
    bosses: ['L’Acolyte du Crépuscule', 'Le Gardien Solaire', 'Oracle de l’Éclipse'],
    secrets: ['L’Ombre de l’Astre Mort'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['memory', 'mirrors', 'toggles'],
    mechanics: [
      ['spread', 'blink', 'rain'],
      ['beam', 'nova'],
      ['safe', 'cross', 'adds']
    ],
    secretMechanics: [['donut', 'beam', 'blink']],
    color: '#ff9955',
    level: 18,
    mobLevel: 20,
    rarity: 'Rare',
    dropLevel: 21
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 0 },
    hazard: { style: 'void', pools: 0 },
    wallProps: ['sconce', 'banner', 'sconce'],
    floorProps: ['pillar', 'brazier', 'statue', 'candles', 'candles'],
    centerpiece: 'altar',
    decal: 'eclipse',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; falling : éboulements ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: 'pulse',
    secret: 'statue',
    dark: 1.45,
    gate: 'barrier'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Acolyte de l’Éclipse',
        look: 'caster',
        pal: ['#3b2d55', '#22193a', '#5d4a80', '#e0b04a', '#ffb347'],
        hold: 'censer',
        off: 'book'
      },
      {
        name: 'Ombre éclipsée',
        look: 'ghost',
        pal: ['#6a4f9a', '#3a2a5a', '#a58ad8', '#ffd36d', '#ffe9a0'],
        eclipse: true
      }
    ],
    bosses: [
      {
        look: 'caster',
        pal: ['#3a2a5a', '#1e1530', '#6a5090', '#ff9955', '#ffcc88'],
        hold: 'staff',
        off: 'book',
        cape: '#1a1424'
      },
      { look: 'golem', pal: ['#c89a40', '#7a5a22', '#f0d080', '#ffcc55', '#fff0b0'], style: 'sun' },
      {
        look: 'humanoid',
        pal: ['#1e1530', '#0f0a1c', '#4a3670', '#ffcc55', '#ffdd88'],
        robe: true,
        face: 'blind',
        hair: '#e8e0f0',
        hold: 'orb',
        head: 'halo'
      }
    ],
    secrets: [{ look: 'horror', pal: ['#120a1c', '#06040c', '#3a2a5a', '#ff7a3a', '#ffb080'], style: 'void' }]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'tiles', a: '#2f2a3d', b: '#211d2c', c: '#4a4360' },
    accent: { style: 'runes', a: '#3a2f22', b: '#271f16', c: '#e0b04a' },
    wall: { style: 'brick', top: '#0d0b14', face: '#3a3350', dark: '#262036', light: '#5a5078' },
    hazard: { a: '#0b0614', b: '#1c1030', c: '#7a4ab0' },
    light: { dark: 0.6, tint: '12,4,24' },
    flame: ['#7a3ad8', '#b47aff', '#f0e0ff'],
    rune: '#ff9955',
    banner: ['#2a1e40', '#e0b04a'],
    pillar: ['#4a4262', '#2a2438', '#6e6490'],
    particles: 'motes'
  }
};
