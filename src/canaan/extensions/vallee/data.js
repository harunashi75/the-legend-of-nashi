// Extension 1 — la Vallée des Héros : données (zone, créatures, Valérion, montures, touche de la monture).
// Ce fichier et tout le dossier extensions/vallee/ ne sont assemblés que par node tools/build.cjs --extensions (npm
// start, npm run build:dev) : le build de sortie ne contient rien de la vallée, dont la terre reste fermée et
// couverte de brume (scripts/extensions.js). Les traductions anglaises de l'extension sont dans i18n.js.
// Déclaré avant la génération de l'île : la zone de la vallée prend ici son nom et ses créatures.
(() => {
  'use strict';
  // Montures de l'Écurie des Héros : achetées une fois par personnage, avec l'or du jeu. speed : bonus de vitesse
  // (%), coat : robe [clair, base, ombre, profond], mane : crins [clair, sombre], sock : balzanes, glow : lueur.
  const MOUNTS = [
    {
      id: 'plaines',
      name: 'Destrier des Plaines',
      rarity: 'Rare',
      price: 5000,
      speed: 40,
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
      price: 8000,
      speed: 50,
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
      price: 20000,
      speed: 65,
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
      price: 35000,
      speed: 75,
      coat: ['#fff0a8', '#f4cc58', '#d29c30', '#946418'],
      mane: ['#fffbe8', '#ffd860'],
      sock: '#fff6d0',
      blanket: '#c8202a',
      glow: '#ffe07a',
      desc: 'Doré et lumineux : on dit qu’il est né du premier rayon de l’aube.'
    }
  ];
  canaanDefineExtension('vallee', {
    zone: {
      name: 'Vallée des Héros',
      t: 50,
      mobs: ['Fauve des Moissons', 'Écho de héros', 'Aigle des Cimes'],
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
    // Touche de la monture (Paramètres → Clavier) : H par défaut, V étant la garde-robe.
    keys: [['mount', 'Monture', ['h'], 'Déplacement']]
  });
})();
