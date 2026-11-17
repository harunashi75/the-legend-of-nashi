// @ts-check
// Arène des Épreuves : douze vagues, multiplicateurs, préparation du coopératif et les douze boss.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
export const ARENA_WAVES = 12;
// Multiplicateurs du document de conception, vague 1 à 12.
export const ARENA_HP_MULT = Object.freeze([1, 1.2, 1.4, 1.6, 1.9, 2.2, 2.5, 2.9, 3.3, 3.8, 4.3, 5]);
export const ARENA_DMG_MULT = Object.freeze([1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 2, 2.1, 2.3, 2.5]);
// Préparation du coopératif : PV et dégâts des boss selon le nombre de joueurs (1 à 4).
export const ARENA_GROUP = Object.freeze([
  null,
  { hp: 1, dmg: 1 },
  { hp: 1.7, dmg: 1 },
  { hp: 2.4, dmg: 1.05 },
  { hp: 3.1, dmg: 1.1 }
]);
// Boss de référence : PV et coup de base, avant les multiplicateurs de vague.
// PV relevés avec les nouvelles attaques et compétences (≈ 2× plus de dégâts) : les combats gardent leur durée.
export const ARENA_BASE = Object.freeze({ hp: 15000, hit: 62 });
// Cadence : les boss enchaînent leurs attaques de plus en plus vite (vague 1 : ×1, vague 12 : ×0,76 d'intervalle).
// Les annonces au sol gardent leur durée : chaque attaque reste lisible et esquivable.
/** @type {(wave: number) => number} */
export const arenaTempo = wave => 1 - 0.022 * (wave - 1);
export const ARENA_TIERS = Object.freeze([
  'Épreuves des champions',
  'Épreuves des vétérans',
  'Épreuves des maîtres',
  'Épreuves légendaires'
]);
export const ARENA_TIMING = Object.freeze({ first: 5, next: 10, recovery: 0.2 });
export const ARENA_COLORS = Object.freeze({
  phys: '#ff5a3a',
  fire: '#ff8a2a',
  poison: '#7ad84a',
  storm: '#7ac8ff',
  astral: '#9f8aff',
  crystal: '#c890ff',
  void: '#b050ff',
  holy: '#ffd36d',
  shadow: '#a070d0'
});

// ---------------------------------------------------------------- Les douze boss
// moves : [nom du mouvement, paramètres] joués en rotation ; une phase commence sous son seuil de PV.
export const ARENA_BOSSES = Object.freeze([
  {
    name: 'Gorath, le Gardien de Fer',
    look: 'knight',
    pal: ['#8a9098', '#4a4e56', '#cdd2da', '#ff8a3a', '#ffb060'],
    opts: { crown: true },
    scale: 3.4,
    speed: 1.45,
    color: ARENA_COLORS.phys,
    phases: [{ hp: 1, gap: 4, moves: [['charge'], ['slam'], ['shockwave']] }]
  },
  {
    name: 'Fenrath, Croc des Ombres',
    look: 'quad',
    pal: ['#3a3248', '#1c1826', '#6a5a88', '#c050ff', '#e080ff'],
    opts: { mane: true },
    scale: 3.2,
    speed: 1.95,
    color: ARENA_COLORS.shadow,
    bleed: true,
    phases: [{ hp: 1, gap: 3.1, moves: [['pounce'], ['backstab'], ['pounce'], ['frenzy']] }]
  },
  {
    name: 'Tharok, le Colosse de Pierre',
    look: 'golem',
    pal: ['#8a7a68', '#54483c', '#b8a890', '#ffb040', '#ffd070'],
    opts: {},
    scale: 3.9,
    speed: 1.15,
    color: ARENA_COLORS.phys,
    phases: [
      {
        hp: 1,
        gap: 4,
        moves: [
          ['quake', { n: 5 }],
          ['rocks', { n: 3 }],
          ['slam', { r: 190 }]
        ]
      },
      {
        hp: 0.5,
        gap: 3,
        speed: 1.25,
        label: 'Le colosse se fissure : sa colère fait trembler l’arène !',
        moves: [
          ['quake', { n: 7 }],
          ['rocks', { n: 4 }],
          ['rain', { n: 9, r: 85 }],
          ['slam', { r: 210 }]
        ]
      }
    ]
  },
  {
    name: 'Morgana, la Sorcière des Brumes',
    look: 'robed',
    pal: ['#3a6a5a', '#1e3a32', '#6aa890', '#b0ff70', '#d0ffa0'],
    opts: { halo: true },
    scale: 3.2,
    speed: 1.3,
    color: ARENA_COLORS.poison,
    caster: true,
    phases: [{ hp: 1, gap: 3.3, moves: [['poison'], ['volley', { n: 7 }], ['curse'], ['poison'], ['mist']] }]
  },
  {
    name: 'Valdris, le Chevalier Déchu',
    look: 'knight',
    pal: ['#3a4058', '#1e2232', '#6a7090', '#7ad0ff', '#b0e8ff'],
    opts: { hood: true },
    scale: 3.4,
    speed: 1.65,
    color: ARENA_COLORS.storm,
    phases: [
      { hp: 1, gap: 2.9, moves: [['combo'], ['parry'], ['charge', { len: 320 }], ['combo'], ['parry']] }
    ]
  },
  {
    name: 'Hydrass, l’Hydre Écarlate',
    look: 'dragon',
    pal: ['#b02838', '#6a1018', '#e05868', '#ffb040', '#ffe080'],
    opts: {},
    scale: 3.9,
    speed: 1.05,
    color: ARENA_COLORS.fire,
    heads: 3,
    phases: [{ hp: 1, gap: 3.4, moves: [['breath3'], ['spit'], ['breathRoll'], ['spit']] }]
  },
  {
    name: 'Zephiron, Seigneur des Tempêtes',
    look: 'angel',
    pal: ['#4a6ab0', '#24366a', '#8ab0f0', '#fff060', '#ffffff'],
    opts: { wings6: true },
    scale: 3.6,
    speed: 1.5,
    color: ARENA_COLORS.storm,
    caster: true,
    phases: [
      {
        hp: 1,
        gap: 3,
        moves: [
          ['lightning', { n: 6 }],
          ['fields'],
          ['gust'],
          ['lightning', { n: 7 }],
          ['sweep', { beams: 2 }]
        ]
      }
    ]
  },
  {
    name: 'Kael’Thor, l’Exécuteur Astral',
    look: 'brute',
    pal: ['#2a2a5a', '#14143a', '#5a5aa0', '#9fd8ff', '#e0f4ff'],
    opts: { horns: true },
    scale: 3.8,
    speed: 1.5,
    color: ARENA_COLORS.astral,
    phases: [
      {
        hp: 1,
        gap: 2.9,
        moves: [['cones'], ['mark'], ['cones'], ['execute'], ['rain', { n: 10, r: 85, magic: true }]]
      }
    ]
  },
  {
    name: 'Ametheon, le Titan de Cristal',
    look: 'golem',
    pal: ['#b080e0', '#6a40a0', '#e0c0ff', '#80f0ff', '#ffffff'],
    opts: { halo: true },
    scale: 4,
    speed: 1,
    color: ARENA_COLORS.crystal,
    phases: [
      { hp: 1, gap: 3.3, moves: [['crystal'], ['beams', { n: 3 }], ['shards'], ['beams', { n: 3 }]] },
      {
        hp: 0.5,
        gap: 2.9,
        label: 'Le titan se couvre de prismes !',
        moves: [['crystal'], ['sweep', { beams: 4 }], ['shards'], ['beams', { n: 5 }]]
      }
    ]
  },
  {
    name: 'Ignaroth, le Dragon des Cendres',
    look: 'dragon',
    pal: ['#4a4040', '#2a2222', '#7a6a68', '#ff6a1f', '#ffd36b'],
    opts: {},
    scale: 4.2,
    speed: 1.1,
    color: ARENA_COLORS.fire,
    phases: [
      { hp: 1, gap: 3, moves: [['breath'], ['meteors', { n: 6 }], ['slam', { r: 210 }], ['breath']] },
      {
        hp: 0.6,
        gap: 2.6,
        label: 'Ignaroth embrase le ciel : les cendres pleuvent !',
        moves: [['meteors', { n: 9 }], ['breath'], ['firestorm'], ['meteors', { n: 7 }]]
      }
    ]
  },
  {
    name: 'Nihil, l’Avatar du Néant',
    look: 'horror',
    pal: ['#1a1028', '#0a0612', '#4a2a6a', '#c050ff', '#ffffff'],
    opts: {},
    scale: 3.8,
    speed: 1.3,
    color: ARENA_COLORS.void,
    caster: true,
    phases: [
      { hp: 1, gap: 2.8, moves: [['blink'], ['spiral'], ['voidzone'], ['blink'], ['clones', { n: 2 }]] },
      {
        hp: 0.5,
        gap: 2.4,
        label: 'Le Néant se dédouble…',
        moves: [['clones', { n: 3 }], ['blink'], ['spiral'], ['voidzone'], ['blink']]
      }
    ]
  },
  {
    name: 'Aurelion, le Souverain des Épreuves',
    look: 'angel',
    pal: ['#f0d080', '#a08030', '#fff8d8', '#ffffff', '#fff0a8'],
    opts: { wings6: true, crown: true },
    scale: 4.3,
    speed: 1.6,
    color: ARENA_COLORS.holy,
    phases: [
      {
        hp: 1,
        gap: 2.8,
        label: 'Phase 1 : l’épée',
        moves: [['combo'], ['charge'], ['slam', { r: 200 }], ['combo']]
      },
      {
        hp: 0.66,
        gap: 2.7,
        label: 'Phase 2 : la magie céleste',
        moves: [
          ['beams', { n: 3 }],
          ['rain', { n: 10, r: 90, magic: true }],
          ['volley', { n: 9, holy: true }],
          ['mark']
        ]
      },
      {
        hp: 0.33,
        gap: 2.1,
        speed: 1.2,
        label: 'Phase 3 : le jugement du Souverain',
        moves: [
          ['combo'],
          ['rain', { n: 12, r: 85, magic: true }],
          ['charge'],
          ['sweep', { beams: 3 }],
          ['mark'],
          ['slam', { r: 220 }]
        ]
      }
    ]
  }
]);
