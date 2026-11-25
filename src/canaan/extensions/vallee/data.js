// Extension 1 — la Vallée des Héros : données (zone, créatures, Valérion, montures).
// Ce fichier et tout le dossier extensions/vallee/ ne sont assemblés que par node tools/build.cjs --extensions (npm
// start, npm run build:dev) : le build de sortie ne contient rien de la vallée, dont la terre reste fermée et
// couverte de brume (scripts/extensions.js). Les traductions anglaises de l'extension sont dans i18n.js.
// Déclaré avant la génération de l'île : la zone de la vallée prend ici son nom et ses créatures.
(() => {
  'use strict';
  // Montures de la vallée (mêmes champs que shared/data/mounts.js) : chevaux et bêtes de légende de l'Écurie des Héros
  // (shop : 'ecurie'), et deux montures qui se gagnent : auprès des Échos et de Valérion.
  const MOUNTS = [
    {
      id: 'plaines',
      name: 'Destrier des Plaines',
      rarity: 'Rare',
      species: 'horse',
      shop: 'ecurie',
      price: 5000,
      coat: ['#b8804e', '#94603a', '#6e4428', '#462a16'],
      mane: ['#4a3020', '#2a1a10'],
      sock: '#efe2c4',
      blanket: '#3a6ab0',
      desc: 'Un cheval brun, solide et docile, né dans les pâturages de la vallée.'
    },
    {
      id: 'argent',
      name: 'Coursier d’Argent',
      rarity: 'Rare',
      species: 'horse',
      shop: 'ecurie',
      price: 8000,
      coat: ['#eef1f5', '#c6ccd6', '#98a2b2', '#646e80'],
      mane: ['#ffffff', '#cdd3dc'],
      sock: '#5a6474',
      blanket: '#2e7a8a',
      desc: 'Robe gris argenté, crins presque blancs : il file comme un reflet de lune.'
    },
    {
      id: 'crepuscule',
      name: 'Destrier du Crépuscule',
      rarity: 'Épique',
      species: 'horse',
      shop: 'ecurie',
      price: 20000,
      coat: ['#4a3c5e', '#30263e', '#201a2c', '#120e1a'],
      mane: ['#9a62e8', '#5a2ea0'],
      sock: '#241c30',
      blanket: '#6a2a9a',
      glow: '#b98aff',
      desc: 'Noir comme la nuit qui tombe, aux reflets violets ; ses sabots laissent des étincelles mauves.'
    },
    {
      id: 'aurore',
      name: 'Coursier de l’Aurore',
      rarity: 'Épique',
      species: 'horse',
      shop: 'ecurie',
      price: 35000,
      coat: ['#fff0a8', '#f4cc58', '#d29c30', '#946418'],
      mane: ['#fffbe8', '#ffd860'],
      sock: '#fff6d0',
      blanket: '#c8202a',
      glow: '#ffe07a',
      desc: 'Doré et lumineux : on dit qu’il est né du premier rayon de l’aube.'
    },
    {
      id: 'belier',
      name: 'Bélier aux Cornes d’Or',
      species: 'ram',
      rarity: 'Rare',
      shop: 'ecurie',
      price: 9000,
      coat: ['#fffaf0', '#e8dcc4', '#c4b496', '#8a7a5e'],
      mane: ['#ffe68a', '#c8962a'],
      sock: '#4a4038',
      blanket: '#a8323a',
      desc: 'Il gravit les collines de la vallée en ligne droite, murs et clôtures compris.'
    },
    {
      id: 'coq',
      name: 'Grand Coq des Moissons',
      species: 'rooster',
      rarity: 'Rare',
      shop: 'ecurie',
      price: 10000,
      coat: ['#f0a848', '#c8702a', '#8a441a', '#4a220e'],
      mane: ['#2a8a7a', '#1a4a6a'],
      sock: '#f0c040',
      crest: '#e03a3a',
      blanket: '#f4ead2',
      desc: 'Réveille la vallée entière à l’aube, et le reste du monde au passage.'
    },
    {
      id: 'lion',
      name: 'Lion des Moissons',
      species: 'lion',
      rarity: 'Épique',
      shop: 'ecurie',
      price: 28000,
      coat: ['#ffe8a8', '#eec878', '#b88c44', '#6a4816'],
      mane: ['#b8602a', '#7a3812'],
      sock: '#f4e0a8',
      eye: '#8a5a10',
      blanket: '#8a1e2a',
      desc: 'Sa crinière a la couleur des blés mûrs. Les Fauves s’écartent sur son passage.'
    },
    {
      id: 'aigle',
      name: 'Aigle Royal des Cimes',
      species: 'eagle',
      rarity: 'Épique',
      shop: 'ecurie',
      price: 32000,
      coat: ['#a8743a', '#7a5026', '#543414', '#2e1c0a'],
      mane: ['#fff6e0', '#d8c8a0'],
      wing: ['#c8945a', '#8a5e30', '#5e3c1c', '#321e0c'],
      sock: '#f0b030',
      eye: '#c86a10',
      blanket: '#2a4a8a',
      desc: 'Il préfère voler, mais il court pour te faire plaisir.'
    },
    {
      id: 'licorne',
      name: 'Licorne d’Ivoire',
      species: 'unicorn',
      rarity: 'Épique',
      shop: 'ecurie',
      price: 45000,
      coat: ['#ffffff', '#f0ecf6', '#ccc4dc', '#968eb0'],
      mane: ['#ffc8e8', '#c89af0'],
      sock: '#f8e0a0',
      blanket: '#7a4ab8',
      glow: '#ffd8f4',
      desc: 'Elle n’approche que les cœurs sincères. Trente secondes de silence, et elle est là.'
    },
    {
      id: 'griffon',
      name: 'Griffon des Cimes',
      species: 'griffon',
      rarity: 'Légendaire',
      shop: 'ecurie',
      price: 80000,
      coat: ['#e8b868', '#c08c40', '#8e6228', '#543814'],
      mane: ['#fffaf0', '#dcd0bc'],
      wing: ['#f4ead4', '#cbb48a', '#927a52', '#564428'],
      sock: '#f0b830',
      eye: '#d87a10',
      blanket: '#1e4a7a',
      desc: 'Serres d’aigle, pattes de lion, et la fierté des deux.'
    },
    {
      id: 'pegase',
      name: 'Pégase des Nuées',
      species: 'pegasus',
      rarity: 'Légendaire',
      shop: 'ecurie',
      price: 100000,
      coat: ['#ffffff', '#e4eefa', '#b4c8e0', '#7a92b4'],
      mane: ['#fff6c8', '#f0cc68'],
      wing: ['#ffffff', '#e6f0fc', '#b8cce4', '#7c94b8'],
      sock: '#f0d890',
      blanket: '#3a7ac8',
      glow: '#e0f0ff',
      desc: 'Ses sabots effleurent à peine l’herbe dorée ; le reste du temps, il attend le vent.'
    },
    {
      id: 'spectre',
      name: 'Destrier des Échos',
      species: 'horse',
      rarity: 'Légendaire',
      drop: { sources: ['mob:Écho de champion', 'mob:Écho de héros'], chance: 0.004 },
      source: 'Échos de héros, Vallée des Héros',
      alpha: 0.72,
      coat: ['#e8fffa', '#a8e8e0', '#6ab8c0', '#3a7a8c'],
      mane: ['#ffffff', '#9af0ff'],
      sock: '#ffffff',
      blanket: '#c8a040',
      glow: '#9af0ff',
      desc: 'La monture d’un héros tombé. Elle cherche encore son cavalier ; peut-être que c’est toi.'
    },
    {
      id: 'solaire',
      name: 'Dragon de l’Aurore',
      species: 'dragon',
      rarity: 'Mythique',
      drop: { sources: ['valerion'], chance: 0.04 },
      source: 'Valérion, le Dernier Champion',
      coat: ['#fff2a8', '#f0c050', '#c08a28', '#7a5210'],
      mane: ['#fffbe8', '#f0583a'],
      sock: '#fff6d0',
      blanket: '#b8202a',
      glow: '#ffe07a',
      desc: 'Né du dernier rayon que Valérion tenait dans sa main. Il ne suit que les dignes.'
    }
  ];
  canaanDefineExtension('vallee', {
    zone: {
      name: 'Vallée des Héros',
      t: 50,
      mobs: ['Fauve des Moissons', 'Écho de héros', 'Aigle des Cimes'],
      // Habitats de ses créatures (scripts/mob-lairs.js) : nom et habillage du territoire (voir THEMES).
      lairs: {
        'Fauve des Moissons': {
          name: 'Tanière des fauves',
          center: 'lair_den_prowler',
          features: ['lair_ribcage', 'lair_bones'],
          scatter: [
            ['lair_bones', 2],
            ['rock', 2],
            ['wheat', 2]
          ],
          density: 0.12
        },
        'Écho de héros': {
          name: 'Champ des échos',
          features: ['lair_statue', 'lair_statue', 'lair_banner'],
          scatter: [
            ['lair_statue', 2],
            ['ruin', 2],
            ['lair_grave', 1]
          ],
          density: 0.14
        },
        'Aigle des Cimes': {
          name: 'Aire des aigles',
          center: 'lair_nest_eagle',
          scatter: [
            ['rock', 3],
            ['lair_bones', 1]
          ],
          density: 0.12
        }
      },
      description:
        'Champs de blé, arbres aux feuilles d’or, ruisseaux et statues des anciens héros. Zone de niveau 60.'
    },
    // Créatures de la vallée (niveau 60), dessinées par client/art/creature-art.js.
    mobs: [
      {
        name: 'Fauve des Moissons',
        color: '#e0a840',
        hp: 150,
        elite: 'Fauve à crinière d’or',
        look: 'wolf',
        pal: ['#d8a446', '#9a6a22', '#f8dc8a', '#c8502a', '#ffe060']
      },
      {
        name: 'Écho de héros',
        color: '#e8dca8',
        hp: 190,
        elite: 'Écho de champion',
        look: 'knight',
        pal: ['#e8e0c0', '#9a9070', '#fff8e0', '#e0b040', '#9af0ff'],
        opts: { spectral: true, cape: '#c8a040' }
      },
      {
        name: 'Aigle des Cimes',
        color: '#a8743a',
        hp: 120,
        elite: 'Aigle royal',
        look: 'raven',
        pal: ['#8a5a2a', '#5a3818', '#f4ecd8', '#f0b030', '#ffd040']
      }
    ],
    // Boss mondial de la vallée : ancien champion en armure dorée, à la grande hallebarde (valerion.js).
    worldBosses: [
      {
        id: 'valerion',
        ext: 'vallee',
        name: 'Valérion, le Dernier Champion',
        biome: 6,
        level: 60,
        hp: 180670,
        color: '#ffd86a',
        look: 'knight',
        pal: ['#e8c050', '#9a7020', '#fff2a8', '#c8202a', '#fff6d0'],
        // Armure dorée (métal, jambières, solerets), cape pourpre, couronne et grande hallebarde.
        opts: {
          hold: 'halberd',
          cape: '#b8202a',
          crown: true,
          elite: true,
          metal: ['#fff0a0', '#e8c050', '#b88a28', '#7a5a14'],
          legs: '#b88a28',
          boots: '#7a5a14'
        }
      }
    ],
    mounts: MOUNTS,
    // Marchand de montures de la vallée (mounts.js) : l'Écurie des Héros, tenue par Garance.
    mountShops: {
      ecurie: {
        title: 'Écurie des Héros — Garance',
        source: 'Écurie des Héros, Vallée des Héros (sud-ouest de l’île)',
        far: 'Parle à Garance, à l’Écurie des Héros, pour acheter une monture.',
        quote:
          '« Chaque bête ici a porté un héros. Choisis la tienne : elle te suivra partout dans le monde ouvert. » Touche de la monture : {touche}.'
      }
    }
  });
})();
