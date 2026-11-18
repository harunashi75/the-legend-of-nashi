// @ts-check
// Le Bastion du Roi Sanglant : raid (six boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'bastion',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Le Bastion du Roi Sanglant',
    biome: 4,
    boss: 'Le Roi Sanglant',
    bosses: [
      'Le Maître-Chien Ravageur',
      'Sire Écorcheur',
      'Le Chapelain Sanguin',
      'La Comtesse Écarlate',
      'Le Champion du Sang',
      'Le Roi Sanglant'
    ],
    secrets: ['Le Bourreau Masqué', 'La Dame Blanche du Bastion'],
    color: '#ffd36d',
    raid: true,
    level: 44,
    mobLevel: 46,
    rarity: 'Épique',
    dropLevel: 47
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'hall',
    accent: { width: 1 },
    hazard: { style: 'blood', pools: 2 },
    wallProps: ['banner', 'torch', 'skulls', 'torch'],
    floorProps: ['pillar', 'brazier', 'pike', 'statue', 'candles'],
    centerpiece: 'throne',
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Garde sanglant',
        look: 'knight',
        pal: ['#7a2a2a', '#4a1616', '#a84a44', '#d4a44a', '#ffcc66']
      },
      {
        name: 'Vampire écarlate',
        look: 'robed',
        pal: ['#5a1420', '#330a12', '#8a2a36', '#e0c060', '#ff3040']
      }
    ],
    bosses: [
      { look: 'quad', pal: ['#5a2020', '#300e0e', '#8a3a34', '#d4a44a', '#ff6040'] },
      { look: 'knight', pal: ['#6a1c1c', '#3a0e0e', '#9a3a34', '#c0c0c8', '#ff6040'] },
      { look: 'robed', pal: ['#4a0a16', '#24040a', '#7a1a2a', '#d4a44a', '#ff3050'], hood: true },
      { look: 'robed', pal: ['#8a1428', '#4a0a16', '#c03a50', '#ffd36d', '#ff3050'], crown: true },
      { look: 'brute', pal: ['#7a1a1a', '#420a0a', '#b03a34', '#ffd36d', '#ff8060'], heavy: true },
      { look: 'knight', pal: ['#9a1a1a', '#550c0c', '#d04040', '#ffd36d', '#ffee88'], crown: true }
    ],
    secrets: [
      { look: 'rogue', pal: ['#2a1a1a', '#140a0a', '#4a2a2a', '#c8303a', '#ff5050'] },
      { look: 'spirit', pal: ['#f4f0f0', '#c8b8b8', '#ffffff', '#c8303a', '#ffd0d0'] }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'flagstone', a: '#4a2a2a', b: '#331c1c', c: '#6a3c3a' },
    accent: { style: 'carpet', a: '#8a1420', b: '#5e0c16', c: '#d4a44a' },
    wall: { style: 'brick', top: '#120707', face: '#4a2626', dark: '#2e1616', light: '#6e3a36' },
    hazard: { a: '#4a060c', b: '#7a1018', c: '#c8303a' },
    light: { dark: 0.52, tint: '30,4,4' },
    flame: ['#c4221a', '#f46a32', '#ffd3a0'],
    rune: '#ffd36d',
    banner: ['#7a0e18', '#d4a44a'],
    pillar: ['#5a3030', '#341a1a', '#7e4844'],
    particles: 'embers'
  }
};
