// @ts-check
// Les Tréfonds Fongiques : donjon des Tréfonds (sous l’île).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'fongique',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Les Tréfonds Fongiques',
    biome: 9,
    boss: 'La Reine des Spores',
    bosses: ['Le Champignon Hurleur', 'Le Mycélium Vivant', 'La Reine des Spores'],
    secrets: ['Le Cœur de Moisissure'],
    color: '#e870c0',
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
    shape: 'cave',
    accent: { width: 1 },
    hazard: { style: 'water', pools: 3 },
    wallProps: ['roots', 'lantern', 'roots', 'roots'],
    floorProps: ['mushroom', 'crystal', 'mushroom', 'bones', 'rubble', 'mushroom'],
    centerpiece: 'mithrilcluster',
    gate: 'barrier'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Porte-spores',
        look: 'mushroom',
        pal: ['#c8604a', '#8a3a2a', '#f0a080', '#f8e8c8', '#fff0a0'],
        sacs: true
      },
      { name: 'Larve des fanges', look: 'grub', pal: ['#8a9a4a', '#4e5a26', '#b8c870', '#e870c0', '#1a2010'] }
    ],
    bosses: [
      { look: 'mushroom', pal: ['#c8604a', '#8a3a2a', '#f0a080', '#f8e8c8', '#fff0a0'], howl: true },
      { look: 'slime', pal: ['#8a9a4a', '#4e5a26', '#b8c870', '#e870c0', '#1a2010'], shrooms: true },
      {
        look: 'mushroom',
        pal: ['#b0407a', '#6a2048', '#e080b0', '#f8e8c8', '#ffe0f8'],
        crown: true,
        elite: true
      }
    ],
    secrets: [
      { look: 'horror', pal: ['#4a5a26', '#2a3414', '#7a8a40', '#e870c0', '#ffe0f8'], style: 'heart' }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules,
  // entrance (entrée sur l'île dessinée comme celle de cette instance).
  palette: {
    entrance: 'terriers',
    floor: { style: 'dirt', a: '#3e4a2e', b: '#2a3420', c: '#5e6e40' },
    accent: { style: 'gravel', a: '#4a3a46', b: '#322630', c: '#6a5664' },
    wall: { style: 'rock', top: '#0c0a10', face: '#3e3446', dark: '#241e2a', light: '#5e5068' },
    hazard: { a: '#2e3818', b: '#4a5a24', c: '#a8c060' },
    light: { dark: 0.66, tint: '16,4,20' },
    flame: ['#d84ac0', '#ff8ae8', '#ffe0f8'],
    rune: '#e870c0',
    banner: ['#3a1a34', '#e870c0'],
    pillar: ['#4e4258', '#302838', '#6e6080'],
    particles: 'motes'
  }
};
