// @ts-check
// La Mine Effondrée de Durgrim : donjon des Tréfonds (sous l’île).
// Fiche complète de l'instance : règles, plan, créatures et apparence. Le moteur commun (plans, énigmes, portes,
// boss) est dans scripts/dungeons/dungeons.js et le dessin dans scripts/dungeons/render.js ; l'ordre des instances
// est fixé par shared/data/dungeons/index.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'durgrim',
  // Règles : nom, biome d'accueil, boss de chaque étape (le dernier est `boss`), boss cachés derrière les passages
  // secrets (chacun donne une clé des secrets à chaque héros), couleur, niveau requis, niveau des ennemis (boss : +1
  // en donjon, +2 en raid), qualité et niveau du butin des boss.
  rules: {
    name: 'La Mine Effondrée de Durgrim',
    biome: 6,
    boss: 'Grumbar, le Contremaître Maudit',
    bosses: ['Le Chef d’Équipe Brisepierre', 'La Foreuse Possédée', 'Grumbar, le Contremaître Maudit'],
    secrets: ['Le Nain Emmuré'],
    color: '#e0a060',
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
    accent: { width: 0 },
    hazard: { style: 'water', pools: 3 },
    wallProps: ['lantern', 'beam', 'roots', 'beam'],
    floorProps: ['minecart', 'crate', 'ore', 'pickaxe', 'rubble', 'bones', 'ore'],
    centerpiece: 'mithrilcluster',
    gate: 'portcullis'
  },
  // Créatures : monstres (nom, silhouette, palette), puis l'apparence de chaque boss et de chaque boss secret, dans
  // l'ordre de rules.bosses et rules.secrets. Palettes : [principale, sombre, claire, accent, yeux].
  actors: {
    mobs: [
      {
        name: 'Mineur nain maudit',
        look: 'skeleton',
        pal: ['#c8b898', '#7a6a50', '#ece0c0', '#8a5a2a', '#ffb040'],
        head: 'miner',
        beard: '#b8ac90',
        hold: 'pickaxe',
        off: 'lantern'
      },
      {
        name: 'Taupe des galeries',
        look: 'mole',
        pal: ['#5a4434', '#3a2a20', '#7e6450', '#f0b0a0', '#ff8a3a']
      }
    ],
    bosses: [
      {
        look: 'dwarf',
        pal: ['#7a6048', '#4a3a2a', '#a0866a', '#e0a060', '#ffd080'],
        hold: 'pickaxe',
        face: 'shadow'
      },
      { look: 'drill', pal: ['#5e5a5a', '#3a3636', '#86807a', '#e0a060', '#ffd080'] },
      {
        look: 'dwarf',
        pal: ['#6a5040', '#40302a', '#927060', '#e0a060', '#ffd080'],
        head: 'horned',
        hold: 'greataxe',
        cape: '#3a2a20',
        elite: true
      }
    ],
    secrets: [
      {
        look: 'skeleton',
        pal: ['#c8b8a0', '#806e58', '#ece0c8', '#e0a060', '#ffd080'],
        head: 'helm',
        beard: '#c8bca0',
        hold: 'hammer',
        off: null,
        rags: '#4a4038'
      }
    ]
  },
  // Apparence : sol, allées, murs, couleurs du danger, lumière, flammes, runes, bannières, piliers, particules,
  // entrance (entrée sur l'île dessinée comme celle de cette instance).
  palette: {
    entrance: 'mine',
    floor: { style: 'dirt', a: '#5e4632', b: '#3e2e20', c: '#84664a' },
    accent: { style: 'rails', a: '#5e4632', b: '#5a3e28', c: '#a8a2a0' },
    wall: { style: 'rock', top: '#140e0a', face: '#4e3a2a', dark: '#2e2218', light: '#70543e' },
    hazard: { a: '#3a2a1a', b: '#5a4026', c: '#8a6a44' },
    light: { dark: 0.7, tint: '22,12,4' },
    flame: ['#e5822e', '#f9c640', '#fff6c5'],
    rune: '#e0a060',
    banner: ['#4a3420', '#e0a060'],
    pillar: ['#5e4430', '#3b2a1d', '#80614a'],
    particles: 'dust'
  }
};
