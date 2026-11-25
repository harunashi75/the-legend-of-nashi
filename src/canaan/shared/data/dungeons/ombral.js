// @ts-check
// Les Halls Engloutis de Khaz-Ombral : donjon des Tréfonds (sous l’île).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'ombral',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Les Halls Engloutis de Khaz-Ombral',
    biome: 7,
    boss: 'Ombral, le Roi sous la Pierre',
    bosses: ['Le Héraut des Profondeurs', 'La Garde de Pierre Noire', 'Ombral, le Roi sous la Pierre'],
    secrets: ['Le Prince Noyé'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['levers', 'mirrors', 'guardian'],
    mechanics: [
      ['spread', 'pools'],
      ['totems', 'slam', 'cross'],
      ['safe', 'pull', 'nova', 'adds']
    ],
    secretMechanics: [['donut', 'pools', 'blink']],
    color: '#8ac8e8',
    // Tréfonds (underground.js) : aucun niveau requis ; ennemis au niveau du groupe et butin du niveau de chaque
    // héros : Peu commun, 31 % de chances de Rare (PRESTIGE_DROPS.underground).
    level: 1,
    mobLevel: 1,
    rarity: 'Peu commun',
    prestige: 'underground',
    dropLevel: 1,
    under: true,
    scaled: true
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 2 },
    wallProps: ['sconce', 'banner', 'chains', 'banner'],
    floorProps: ['pillar', 'statue', 'rubble', 'candles', 'brazier', 'statue'],
    centerpiece: 'throne',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: 'spikes',
    secret: 'statue',
    dark: 1.3,
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Garde de pierre',
        look: 'golem',
        pal: ['#7a8088', '#4e545c', '#a8b0b8', '#8ac8e8', '#e0f8ff'],
        style: 'statue'
      },
      {
        name: 'Esprit d’Ombral',
        look: 'ghost',
        pal: ['#6aa8d8', '#3a6a98', '#c8e8ff', '#ffd36d', '#ffffff'],
        weed: true
      }
    ],
    bosses: [
      {
        look: 'caster',
        pal: ['#3a4a5a', '#1e2834', '#5a6e84', '#8ac8e8', '#d8f0ff'],
        hold: 'spear',
        weed: true
      },
      {
        look: 'golem',
        pal: ['#2a3038', '#14181e', '#4a5260', '#8ac8e8', '#d8f0ff'],
        style: 'statue',
        elite: true
      },
      {
        look: 'dwarf',
        pal: ['#4a5a6e', '#2a3444', '#7a8ca4', '#c9a24a', '#8ad8ff'],
        head: 'crown',
        beard: '#d8d8e0',
        hold: 'greataxe',
        cape: '#1a2a4a'
      }
    ],
    secrets: [
      { look: 'ghost', pal: ['#4a7a8a', '#2a4a54', '#7ab0c0', '#8ac8e8', '#ffffff'], crown: true, weed: true }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules,
  // entrance (entrée sur l'île dessinée comme celle de cette instance).
  palette: {
    entrance: 'penitents',
    floor: { style: 'flagstone', a: '#4a5058', b: '#33383e', c: '#6a727c' },
    accent: { style: 'carpet', a: '#2a4a6a', b: '#1a3450', c: '#c9a24a' },
    wall: { style: 'brick', top: '#0c1016', face: '#454c56', dark: '#2a3038', light: '#68707c' },
    hazard: { a: '#0e2a3a', b: '#1e4a60', c: '#6ab0d0' },
    light: { dark: 0.6, tint: '4,12,22' },
    flame: ['#3a8ad8', '#7ac8ff', '#e0f4ff'],
    rune: '#8ac8e8',
    banner: ['#1e3a5a', '#c9a24a'],
    pillar: ['#5a626c', '#3a4048', '#7e8894'],
    particles: 'motes'
  }
};
