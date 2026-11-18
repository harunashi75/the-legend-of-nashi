// @ts-check
// La Crypte des Mille Tombes : donjon des Tréfonds (sous l’île).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'mille_tombes',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Crypte des Mille Tombes',
    biome: 8,
    boss: 'Le Fossoyeur Éternel',
    bosses: ['Le Pilleur de Tombes', 'La Veuve des Cryptes', 'Le Fossoyeur Éternel'],
    secrets: ['Le Mille-et-Unième Mort'],
    color: '#a8f0c0',
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
    shape: 'pit',
    accent: { width: 1 },
    hazard: { style: 'chasm', pools: 1 },
    wallProps: ['skulls', 'sconce', 'chains', 'skulls'],
    floorProps: ['bonepile', 'candles', 'bones', 'cage', 'statue', 'candles'],
    centerpiece: 'altar',
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Goule des cryptes',
        look: 'brute',
        pal: ['#9aa890', '#5e6e54', '#c4d0b8', '#4a3a2a', '#7affb0']
      },
      { name: 'Âme sans repos', look: 'spirit', pal: ['#8ad8b0', '#3a8a68', '#d8fff0', '#ffffff', '#ffffff'] }
    ],
    bosses: [
      { look: 'rogue', pal: ['#4a4a40', '#2a2a22', '#6e6e60', '#a8f0c0', '#d8fff0'] },
      { look: 'spirit', pal: ['#2a2e2a', '#141614', '#4a524a', '#a8f0c0', '#ffffff'] },
      { look: 'robed', pal: ['#3a3e3a', '#1e221e', '#5e665e', '#7affb0', '#d8fff0'], hood: true }
    ],
    secrets: [{ look: 'skeleton', pal: ['#b8c0b0', '#6e7868', '#e0e8d8', '#7affb0', '#d8fff0'], crown: true }]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules,
  // entrance (entrée sur l'île dessinée comme celle de cette instance).
  palette: {
    entrance: 'fosse',
    floor: { style: 'flagstone', a: '#3c3a36', b: '#282624', c: '#58544e' },
    accent: { style: 'gravel', a: '#34322e', b: '#22201e', c: '#4e4a44' },
    wall: { style: 'brick', top: '#08090a', face: '#3a3c3a', dark: '#222422', light: '#5a5c58' },
    hazard: { a: '#030404', b: '#0c100e', c: '#1e2a24' },
    light: { dark: 0.72, tint: '4,14,10' },
    flame: ['#3ad87a', '#8affb0', '#e0fff0'],
    rune: '#a8f0c0',
    banner: ['#1a2a22', '#a8f0c0'],
    pillar: ['#4a4c48', '#2c2e2a', '#6c6e68'],
    particles: 'motes'
  }
};
