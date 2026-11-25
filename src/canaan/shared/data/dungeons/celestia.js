// @ts-check
// Le Jugement de Célestia : raid (six boss).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'celestia',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'Le Jugement de Célestia',
    biome: 5,
    boss: 'L’Avatar du Jugement',
    bosses: [
      'Le Porte-Étoile',
      'Le Héraut de Célestia',
      'L’Astrolabe Vivant',
      'La Balance Éternelle',
      'Le Juge des Constellations',
      'L’Avatar du Jugement'
    ],
    secrets: ['La Comète Écarlate', 'Le Témoin du Premier Jour'],
    // Énigme de la porte de chaque boss, aile par aile (braziers, levers, runes, guardian, mirrors, memory,
    // toggles, search, ambush), et mécaniques de chaque boss puis de chaque boss caché (scripts/boss-mechanics.js).
    wings: ['runes', 'mirrors', 'memory', 'toggles', 'guardian', 'ambush'],
    mechanics: [
      ['rain', 'spread', 'adds'],
      ['charge', 'cross', 'soak'],
      ['beam', 'totems', 'donut'],
      ['safe', 'soak', 'spread'],
      ['cross', 'pull', 'pools', 'nova'],
      ['beam', 'safe', 'donut', 'rain', 'adds', 'berserk']
    ],
    secretMechanics: [
      ['charge', 'rain', 'pools'],
      ['safe', 'beam', 'blink']
    ],
    color: '#fff0a8',
    raid: true,
    level: 58,
    mobLevel: 60,
    // La difficulté choisie au portail fixe la qualité du butin, garanti, et la puissance des ennemis.
    difficulties: {
      normal: {
        label: 'Normal',
        icon: '⟦mode_normal⟧',
        level: 58,
        mobLevel: 60,
        rarity: 'Épique',
        dropLevel: 60,
        hp: 1,
        damage: 1
      },
      heroic: {
        label: 'Héroïque',
        icon: '⟦mode_heroic⟧',
        level: 60,
        mobLevel: 60,
        rarity: 'Épique',
        // Butin de prestige : 21 % de Légendaire, 11 % de Mythique (voir PRESTIGE_DROPS).
        prestige: 'raidHeroic',
        dropLevel: 60,
        hp: 1.65,
        damage: 1.4
      }
    }
  },
  // Plan : shape (cave : galeries ; hall : salles taillées ; pit : salles au bord des fosses ; void : îlots au-dessus
  // du vide), accent (largeur des allées), hazard (style du danger, mares par salle, lumière émise), wallProps et
  // floorProps (objets contre les murs et au sol), centerpiece (pièce maîtresse des salles de boss), decal (marques
  // au sol), gate (portcullis : herse ; barrier : barrière magique).
  layout: {
    shape: 'void',
    accent: { width: 0 },
    hazard: { style: 'stars', pools: 0 },
    wallProps: [],
    floorProps: ['pillarlight', 'orb', 'pillar', 'crystal', 'statue'],
    centerpiece: 'scales',
    // Pièges (spikes, jets, pulse : bandes qui s'arment en rythme ; spores : vesses ;
    // null : aucun), déclencheur des passages secrets (wall : fissure vue de près ; torch : torche d'une autre couleur ;
    // statue : statue de travers) et obscurité (1 : celle du thème).
    trap: null,
    secret: 'statue',
    dark: 1.1,
    gate: 'barrier'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Juge céleste',
        look: 'angel',
        pal: ['#fff0a8', '#c4aa50', '#ffffff', '#9fd8ff', '#ffffff'],
        blind: true
      },
      {
        name: 'Héraut stellaire',
        look: 'wisp',
        pal: ['#9fd8ff', '#4a7ab0', '#e0f4ff', '#fff0a8', '#ffffff'],
        star: true
      }
    ],
    bosses: [
      {
        look: 'caster',
        pal: ['#fff8d8', '#c8b070', '#ffffff', '#fff0a8', '#ffffff'],
        head: 'halo',
        face: 'human',
        hold: 'staff',
        off: 'orb'
      },
      { look: 'angel', pal: ['#c8d8ff', '#7a8ac0', '#ffffff', '#9fd8ff', '#e0f4ff'], armor: true },
      { look: 'astrolabe', pal: ['#2a2e60', '#1a1c40', '#4a50a0', '#fff0a8', '#ffffff'] },
      { look: 'scales', pal: ['#d4aa3a', '#8a6a1a', '#fff0a8', '#9fd8ff', '#ffffff'] },
      {
        look: 'humanoid',
        pal: ['#1a1c40', '#0c0e24', '#3a3e80', '#fff0a8', '#ffffff'],
        robe: true,
        face: 'blind',
        head: 'mitre',
        hold: 'scales',
        cape: '#1a1a4a'
      },
      {
        look: 'angel',
        pal: ['#fff8d8', '#c8b070', '#ffffff', '#fff0a8', '#ffffff'],
        wings6: true,
        crown: true,
        armor: true,
        hold: 'greatsword'
      }
    ],
    secrets: [
      { look: 'dragon', pal: ['#c8303a', '#7a1018', '#ff7060', '#fff0a8', '#ffffff'], stars: true },
      { look: 'wisp', pal: ['#ffffff', '#d8d4f0', '#ffffff', '#fff0a8', '#9fd8ff'], elite: true }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules.
  palette: {
    floor: { style: 'starstone', a: '#1c2148', b: '#121633', c: '#fff0a8' },
    accent: { style: 'runes', a: '#2a2a5a', b: '#1a1a40', c: '#fff0a8' },
    wall: { style: 'marble', top: '#06061a', face: '#2a2e60', dark: '#1a1c40', light: '#4a50a0' },
    hazard: { a: '#020208', b: '#14123a', c: '#fff0a8' },
    light: { dark: 0.38, tint: '4,6,30' },
    flame: ['#d4aa3a', '#fff0a8', '#ffffff'],
    rune: '#fff0a8',
    banner: ['#1a1c40', '#fff0a8'],
    pillar: ['#d8d4f0', '#9a96c0', '#ffffff'],
    particles: 'sparks'
  }
};
