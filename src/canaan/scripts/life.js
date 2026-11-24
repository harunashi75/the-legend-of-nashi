// Vie du monde : animaux propres à chaque biome qui se promènent (et fuient le héros), et habitants qui flânent
// au camp, dans les bâtiments (house.js), aux refuges, aux ruines et aux tours, avec une bulle de dialogue quand on
// passe près d'eux ; on ne voit que ceux de l'endroit où l'on est (dehors, ou la pièce où l'on est entré).
// Tout est décoratif et calculé chez chaque joueur : rien n'est sauvegardé ni envoyé sur le réseau.
(() => {
  'use strict';
  // ---------------------------------------------------------------- Hasard reproductible
  function seeded(n) {
    let h = n >>> 0;
    return () => {
      h += 0x6d2b79f5;
      let r = Math.imul(h ^ (h >>> 15), 1 | h);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const walkable = (x, y) => canWalk(x, y);
  const tileOf = (x, y) => game.world.overworld?.[Math.floor(y / TS)]?.[Math.floor(x / TS)];
  const WATERY = new Set([15, 18]);

  // ---------------------------------------------------------------- Sprites des animaux (de profil, vers la droite)
  // Chaque dessin reçoit R(x, y, l, h, couleur) sur une grille agrandie 2 fois, et le pas de marche (0 ou 1).
  const ART = {
    // Crabe des sables, vu de dessus : carapace, pinces levées, pattes qui alternent à chaque pas.
    crabe: {
      w: 15,
      h: 10,
      pal: [
        ['#d8582e', '#9e3a1c', '#f08a52'],
        ['#c8743a', '#8a4a22', '#e8a060']
      ],
      draw(R, f, [m, d, l]) {
        for (const [x, y] of f
          ? [
              [1, 4],
              [2, 7],
              [11, 3],
              [12, 6]
            ]
          : [
              [1, 5],
              [2, 8],
              [11, 4],
              [12, 7]
            ])
          R(x, y, 2, 1, d);
        R(4, 3, 7, 6, m);
        R(3, 4, 9, 4, m);
        R(5, 3, 4, 2, l);
        R(4, 8, 7, 1, d);
        R(0, f ? 0 : 1, 3, 3, m);
        R(12, f ? 1 : 0, 3, 3, m);
        R(0, f ? 0 : 1, 1, 1, l);
        R(14, f ? 1 : 0, 1, 1, l);
        R(2, 2, 2, 2, d);
        R(11, 2, 2, 2, d);
        R(6, 1, 1, 2, d);
        R(8, 1, 1, 2, d);
        R(6, 0, 1, 1, '#1a1418');
        R(8, 0, 1, 1, '#1a1418');
      }
    },
    // Chat du camp, de profil : queue en l'air, oreilles pointues.
    chat: {
      w: 14,
      h: 10,
      pal: [
        ['#e89a4a', '#b86a2a', '#f8c890'],
        ['#4a4a52', '#2a2a30', '#7a7a84']
      ],
      draw(R, f, [m, d, l]) {
        R(2, 4, 8, 4, m);
        R(3, 4, 6, 1, l);
        R(9, 2, 4, 4, m);
        R(9, 1, 1, 1, m);
        R(12, 1, 1, 1, m);
        R(11, 3, 1, 1, '#1a1418');
        R(13, 4, 1, 1, '#f0a0a0');
        R(0, f ? 1 : 2, 1, 3, d);
        R(1, 3, 1, 2, m);
        R(3, 8, 1, 2, d);
        R(f ? 7 : 6, 8, 1, 2, d);
        R(9, 8, 1, 2, d);
        R(4, 5, 4, 1, d);
      }
    },
    // Chien du camp : oreilles tombantes, queue qui remue.
    chien: {
      w: 16,
      h: 12,
      pal: [['#c8945a', '#8e5a30', '#ecc890']],
      draw(R, f, [m, d, l]) {
        R(2, 4, 10, 5, m);
        R(3, 4, 8, 1, l);
        R(11, 1, 5, 5, m);
        R(11, 1, 2, 4, d);
        R(14, 3, 1, 1, '#1a1418');
        R(15, 5, 1, 1, '#1a1418');
        R(0, f ? 2 : 3, 2, 2, m);
        R(3, 9, 2, 3, d);
        R(f ? 8 : 7, 9, 2, 3, d);
        R(10, 9, 2, 3, d);
        R(5, 6, 4, 1, d);
        R(12, 6, 3, 1, '#d8483a');
      }
    },
    lapin: {
      w: 13,
      h: 11,
      pal: [
        ['#9a8068', '#6e5a48', '#c8b49a'],
        ['#d8d0c4', '#a8a098', '#ffffff']
      ],
      draw(R, f, [m, d, l]) {
        R(2, 5, 8, 5, m);
        R(3, 9, 6, 1, d);
        R(1, 6, 2, 2, '#ffffff');
        R(8, 3, 4, 4, m);
        R(9, 0, 1, 4, m);
        R(11, 0, 1, 4, d);
        R(10, 4, 1, 1, '#1a1418');
        R(12, 5, 1, 1, '#e88a8a');
        R(4, 6, 4, 2, l);
        R(3, 10, 2, 1, d);
        R(f ? 8 : 7, 10, 2, 1, d);
      }
    },
    mouton: {
      w: 17,
      h: 13,
      pal: [['#f0ece4', '#c8c0b4', '#ffffff']],
      draw(R, f, [m, d, l]) {
        R(2, 3, 12, 7, m);
        R(1, 4, 14, 5, m);
        for (const [x, y] of [
          [3, 2],
          [7, 2],
          [11, 2],
          [2, 8],
          [6, 9],
          [10, 9]
        ])
          R(x, y, 3, 2, l);
        R(2, 9, 12, 1, d);
        R(13, 3, 4, 5, '#3a3030');
        R(14, 4, 1, 1, '#f0f0f0');
        R(12, 3, 2, 2, m);
        R(3, 10, 2, f ? 3 : 2, '#3a3030');
        R(6, 10, 2, f ? 2 : 3, '#3a3030');
        R(10, 10, 2, f ? 3 : 2, '#3a3030');
        R(12, 10, 2, f ? 2 : 3, '#3a3030');
      }
    },
    poule: {
      w: 10,
      h: 11,
      pal: [
        ['#f4f0e8', '#c8c0b0', '#ffffff'],
        ['#a8643a', '#7a4628', '#c8844a']
      ],
      draw(R, f, [m, d, l]) {
        R(1, 4, 7, 5, m);
        R(0, 3, 3, 3, d);
        R(6, 1, 3, 4, m);
        R(7, 0, 2, 1, '#e03a2a');
        R(9, 3, 1, 1, '#f0b030');
        R(8, 2, 1, 1, '#1a1418');
        R(8, 4, 1, 1, '#e03a2a');
        R(2, 5, 4, 2, l);
        R(3, 9, 1, 2, '#f0b030');
        R(f ? 6 : 5, 9, 1, 2, '#f0b030');
      }
    },
    cerf: {
      w: 19,
      h: 19,
      pal: [
        ['#a07850', '#704e30', '#c8a07a'],
        ['#9ad8ff', '#5a9ad0', '#e0f8ff']
      ],
      draw(R, f, [m, d, l], opts) {
        R(2, 8, 12, 6, m);
        R(3, 7, 10, 2, d);
        R(4, 12, 8, 2, l);
        R(1, 8, 2, 2, '#ffffff');
        R(12, 4, 3, 6, m);
        R(13, 2, 5, 4, m);
        R(17, 3, 2, 2, d);
        R(18, 3, 1, 1, '#1a1418');
        R(15, 3, 1, 1, '#1a1418');
        R(13, 0, 1, 3, opts.glow ? '#ffffff' : '#d8c8a0');
        R(11, 0, 3, 1, opts.glow ? '#ffffff' : '#d8c8a0');
        R(15, 0, 1, 2, opts.glow ? '#ffffff' : '#d8c8a0');
        R(3, 14, 2, 5, d);
        R(f ? 6 : 5, 14, 2, 5, m);
        R(10, 14, 2, 5, d);
        R(f ? 12 : 13, 14, 2, 5, m);
        if (opts.glow)
          for (const [x, y] of [
            [5, 9],
            [9, 10],
            [7, 8]
          ])
            R(x, y, 1, 1, '#ffffff');
      }
    },
    renard: {
      w: 17,
      h: 10,
      pal: [['#d8742a', '#a04e1a', '#f0a050']],
      draw(R, f, [m, d, l]) {
        R(0, 3, 5, 3, m);
        R(0, 4, 2, 2, '#f8f0e0');
        R(4, 3, 9, 4, m);
        R(5, 6, 6, 1, '#f8f0e0');
        R(12, 1, 4, 4, m);
        R(12, 0, 1, 2, d);
        R(15, 0, 1, 2, d);
        R(15, 3, 2, 2, '#f8f0e0');
        R(16, 3, 1, 1, '#1a1418');
        R(14, 2, 1, 1, '#1a1418');
        R(5, 7, 1, 3, '#2a1a14');
        R(f ? 8 : 7, 7, 1, 3, '#2a1a14');
        R(10, 7, 1, 3, '#2a1a14');
        R(f ? 12 : 11, 7, 1, 3, '#2a1a14');
      }
    },
    // Faisan : longue queue rayée, tête verte à joue rouge, collier blanc.
    faisan: {
      w: 18,
      h: 11,
      pal: [['#b0602a', '#7a3e1a', '#d8904a']],
      draw(R, f, [m, d, l]) {
        R(0, 3, 6, 2, d);
        R(1, 4, 6, 1, l);
        R(5, 4, 7, 4, m);
        R(6, 5, 5, 1, l);
        R(7, 7, 4, 1, d);
        R(11, 2, 3, 4, '#2a6a3a');
        R(12, 1, 3, 2, '#2a6a3a');
        R(13, 2, 2, 2, '#d8302a');
        R(11, 5, 3, 1, '#f4f0e0');
        R(15, 2, 2, 1, '#e0b040');
        R(14, 2, 1, 1, '#1a1418');
        R(7, 8, 1, 3, '#8a6a3a');
        R(f ? 10 : 9, 8, 1, 3, '#8a6a3a');
      }
    },
    // Canard colvert : tête verte, collier blanc, poitrine brune, bec jaune.
    canard: {
      w: 14,
      h: 10,
      pal: [['#c8c0b0', '#8a8478', '#e8e0d0']],
      draw(R, f, [m, d, l]) {
        R(1, 4, 9, 4, m);
        R(0, 4, 2, 2, d);
        R(2, 7, 7, 1, d);
        R(3, 5, 5, 1, l);
        R(7, 4, 3, 3, '#8a5a3a');
        R(8, 1, 4, 4, '#2a7a4a');
        R(8, 4, 3, 1, '#f4f0e0');
        R(12, 2, 2, 2, '#e8b020');
        R(10, 2, 1, 1, '#1a1418');
        R(4, 8, 1, 2, '#e89020');
        R(f ? 7 : 6, 8, 1, 2, '#e89020');
      }
    },
    // Chèvre des sables : pelage clair, cornes recourbées, barbichette.
    chevre: {
      w: 16,
      h: 13,
      pal: [['#e0c8a0', '#b09870', '#f4e4c4']],
      draw(R, f, [m, d, l]) {
        R(2, 4, 10, 5, m);
        R(3, 5, 8, 1, l);
        R(1, 4, 2, 2, d);
        R(11, 2, 4, 4, m);
        R(11, 0, 2, 3, '#7a6a5a');
        R(10, 0, 1, 2, '#7a6a5a');
        R(14, 3, 1, 1, '#1a1418');
        R(13, 6, 2, 2, d);
        R(3, 9, 1, 4, d);
        R(f ? 6 : 5, 9, 1, 4, d);
        R(9, 9, 1, 4, d);
        R(f ? 11 : 10, 9, 1, 4, d);
      }
    },
    ecureuil: {
      w: 10,
      h: 10,
      pal: [['#b0582a', '#7a3a1a', '#d8804a']],
      draw(R, f, [m, d, l]) {
        R(0, 1, 3, 7, m);
        R(1, 0, 3, 2, l);
        R(3, 5, 4, 3, m);
        R(6, 3, 3, 3, m);
        R(8, 4, 1, 1, '#1a1418');
        R(7, 2, 1, 1, d);
        R(4, 6, 2, 1, '#f0d8b0');
        R(3, 8, 1, 2, d);
        R(f ? 6 : 5, 8, 1, 2, d);
      }
    },
    grenouille: {
      w: 9,
      h: 6,
      pal: [['#4a9a3a', '#2e6a2a', '#7ac85a']],
      draw(R, f, [m, d, l]) {
        R(1, 2, 6, 3, m);
        R(5, 1, 2, 1, m);
        R(6, 1, 1, 1, '#1a1418');
        R(2, 4, 4, 1, l);
        R(0, f ? 3 : 4, 2, 2, d);
        R(6, 4, 2, 2, d);
      }
    },
    heron: {
      w: 11,
      h: 19,
      pal: [['#9aaab8', '#6a7a8a', '#d8e0e8']],
      draw(R, f, [m, d, l]) {
        R(1, 6, 7, 5, m);
        R(0, 7, 2, 3, d);
        R(2, 7, 4, 2, l);
        R(6, 2, 2, 5, l);
        R(6, 0, 3, 3, l);
        R(8, 1, 3, 1, '#e0b030');
        R(7, 1, 1, 1, '#1a1418');
        R(5, 0, 2, 1, '#2a2a34');
        R(3, 11, 1, 8, '#c8a050');
        R(f ? 6 : 5, 11, 1, 8, '#c8a050');
      }
    },
    // Tortue de mer, de profil : carapace bombée à écailles, nageoires qui rament sur le sable, tête ronde.
    tortue_mer: {
      w: 21,
      h: 11,
      pal: [
        ['#4a7a52', '#2e5238', '#78a870'],
        ['#6a7a42', '#46542a', '#98a860']
      ],
      draw(R, f, [m, d, l]) {
        R(4, 2, 12, 5, m);
        R(6, 1, 8, 1, m);
        R(3, 4, 14, 3, m);
        R(6, 2, 3, 2, l);
        R(10, 2, 3, 2, l);
        R(13, 3, 2, 2, l);
        R(5, 4, 2, 2, d);
        R(8, 4, 3, 2, d);
        R(12, 5, 2, 1, d);
        R(3, 7, 14, 1, '#d8c890');
        R(16, 4, 4, 3, '#8ab07a');
        R(18, 4, 1, 1, '#1a1418');
        R(19, 6, 1, 1, '#5a7a4a');
        R(f ? 12 : 13, 7, 4, 2, '#7aa06a');
        R(f ? 4 : 3, 7, 3, 2, '#7aa06a');
        R(1, 6, 3, 1, '#7aa06a');
      }
    },
    tortue: {
      w: 13,
      h: 7,
      pal: [['#5a7a3a', '#3a5228', '#8aa858']],
      draw(R, f, [m, d, l]) {
        R(2, 1, 8, 4, m);
        R(3, 0, 6, 1, m);
        R(4, 1, 2, 2, d);
        R(7, 2, 2, 2, d);
        R(10, 2, 3, 2, '#8a9a5a');
        R(11, 2, 1, 1, '#1a1418');
        R(2, 5, 2, 2, '#8a9a5a');
        R(f ? 8 : 7, 5, 2, 2, '#8a9a5a');
      }
    },
    herisson: {
      w: 11,
      h: 7,
      pal: [['#6a4a30', '#3e2a1a', '#a08060']],
      draw(R, f, [m, d, l]) {
        R(1, 1, 7, 5, m);
        for (let k = 0; k < 4; k++) R(1 + k * 2, 0, 1, 2, d);
        R(1, 2, 1, 1, l);
        R(5, 2, 1, 1, l);
        R(7, 3, 3, 3, '#d8b890');
        R(10, 4, 1, 1, '#1a1418');
        R(8, 3, 1, 1, '#1a1418');
        R(2, 6, 1, 1, d);
        R(f ? 6 : 5, 6, 1, 1, d);
      }
    },
    lezard: {
      w: 13,
      h: 5,
      pal: [['#c8a060', '#8a6a3a', '#e8c888']],
      draw(R, f, [m, d, l]) {
        R(0, 2, 4, 1, m);
        R(3, 1, 6, 2, m);
        R(4, 1, 4, 1, l);
        R(9, 1, 3, 2, m);
        R(11, 1, 1, 1, '#1a1418');
        R(4, f ? 3 : 4, 1, 1, d);
        R(7, f ? 4 : 3, 1, 1, d);
      }
    },
    // Animaux des Tréfonds.
    taupe: {
      w: 14,
      h: 8,
      pal: [['#4a3a34', '#2e2420', '#6e5a50']],
      draw(R, f, [m, d, l]) {
        R(1, 2, 10, 5, m);
        R(0, 3, 12, 3, m);
        R(2, 2, 7, 1, l);
        R(11, 3, 2, 3, '#e8a0a0');
        R(13, 4, 1, 1, '#f0b0b0');
        R(10, 3, 1, 1, '#1a1418');
        R(1, 7, 3, 1, '#e8c8b0');
        R(f ? 8 : 7, 7, 3, 1, '#e8c8b0');
        R(0, 5, 1, 2, d);
      }
    },
    salamandre: {
      w: 15,
      h: 5,
      pal: [['#e8702a', '#a8401a', '#ffb060']],
      draw(R, f, [m, d, l]) {
        R(0, 3, 4, 1, m);
        R(3, 2, 7, 2, m);
        R(4, 2, 1, 1, '#1a1418');
        R(6, 2, 1, 1, '#1a1418');
        R(8, 2, 1, 1, '#1a1418');
        R(10, 1, 4, 3, m);
        R(11, 1, 2, 1, l);
        R(13, 2, 1, 1, '#1a1418');
        R(4, f ? 4 : 3, 1, 1, d);
        R(9, f ? 3 : 4, 1, 1, d);
      }
    },
    crapaud: {
      w: 11,
      h: 8,
      pal: [['#6a7a3a', '#46522a', '#9aaa5a']],
      draw(R, f, [m, d, l]) {
        R(1, 2, 9, 5, m);
        R(2, 1, 3, 2, m);
        R(7, 1, 3, 2, m);
        R(3, 1, 1, 1, '#f0d040');
        R(8, 1, 1, 1, '#f0d040');
        R(2, 5, 7, 1, '#c8c890');
        R(3, 3, 1, 1, d);
        R(6, 4, 1, 1, d);
        R(0, f ? 6 : 7, 3, 1, d);
        R(8, f ? 7 : 6, 3, 1, d);
      }
    },
    fennec: {
      w: 13,
      h: 11,
      pal: [['#e8c890', '#b8985a', '#fff0d0']],
      draw(R, f, [m, d, l]) {
        R(0, 4, 3, 3, m);
        R(0, 5, 1, 1, '#3a2a1a');
        R(3, 5, 6, 3, m);
        R(9, 3, 3, 3, m);
        R(8, 0, 2, 4, m);
        R(11, 0, 2, 4, m);
        R(9, 1, 1, 2, '#f0a8a0');
        R(12, 4, 1, 1, '#1a1418');
        R(10, 4, 1, 1, '#1a1418');
        R(4, 7, 4, 1, l);
        R(4, 8, 1, 3, d);
        R(f ? 8 : 7, 8, 1, 3, d);
      }
    },
    // Animaux de la ferme du Camp de l'Aurore (camp-life.js) : vache (noire et blanche ou rousse) et cochon.
    vache: {
      w: 20,
      h: 15,
      pal: [
        ['#f4f0e8', '#c8c0b4', '#ffffff', '#2a2224'],
        ['#b07a4e', '#7e5232', '#d0a070', '#f2ebe0']
      ],
      draw(R, f, [m, d, l, s]) {
        R(2, 4, 13, 7, m);
        R(3, 3, 11, 1, m);
        R(3, 4, 10, 2, l);
        R(3, 10, 11, 1, d);
        R(4, 5, 3, 3, s);
        R(9, 4, 3, 2, s);
        R(11, 7, 3, 3, s);
        R(6, 8, 2, 2, s);
        R(15, 3, 4, 5, m);
        R(15, 3, 2, 2, s);
        R(18, 6, 2, 3, '#e8a8a0');
        R(19, 7, 1, 1, '#9a5a5a');
        R(16, 4, 1, 1, '#1a1418');
        R(15, 1, 1, 2, '#e8e0c8');
        R(18, 1, 1, 2, '#e8e0c8');
        R(14, 3, 1, 2, d);
        R(1, 4, 1, 5, d);
        R(0, 8, 1, 2, '#2a2224');
        R(7, 11, 3, 1, '#f0b0b0');
        R(3, 11, 2, f ? 4 : 3, d);
        R(5, 11, 2, f ? 3 : 4, m);
        R(11, 11, 2, f ? 4 : 3, d);
        R(13, 11, 2, f ? 3 : 4, m);
        R(3, f ? 14 : 13, 2, 1, '#2a2224');
        R(13, f ? 13 : 14, 2, 1, '#2a2224');
      }
    },
    cochon: {
      w: 15,
      h: 11,
      pal: [['#f0a8a0', '#c87a74', '#ffc8c0']],
      draw(R, f, [m, d, l]) {
        R(2, 3, 10, 6, m);
        R(1, 4, 12, 4, m);
        R(3, 4, 6, 2, l);
        R(2, 8, 10, 1, d);
        R(11, 3, 3, 5, m);
        R(13, 5, 2, 2, '#d8807a');
        R(14, 5, 1, 1, '#7a3a3a');
        R(12, 4, 1, 1, '#1a1418');
        R(11, 2, 2, 2, d);
        R(0, 3, 1, 2, d);
        R(1, 2, 1, 1, d);
        R(3, 9, 2, f ? 2 : 1, d);
        R(5, 9, 2, f ? 1 : 2, m);
        R(9, 9, 2, f ? 2 : 1, d);
        R(11, 9, 2, f ? 1 : 2, m);
      }
    },
    chameau: {
      w: 22,
      h: 20,
      pal: [['#c89a5a', '#9a7038', '#e0b878']],
      draw(R, f, [m, d, l]) {
        R(3, 8, 13, 5, m);
        R(5, 5, 4, 4, m);
        R(10, 6, 4, 3, m);
        R(6, 5, 2, 1, l);
        R(15, 4, 3, 6, m);
        R(16, 2, 5, 3, m);
        R(20, 3, 2, 2, d);
        R(18, 2, 1, 1, '#1a1418');
        R(2, 9, 2, 3, d);
        R(4, 12, 10, 1, d);
        R(4, 13, 2, 7, d);
        R(f ? 8 : 7, 13, 2, 7, m);
        R(12, 13, 2, 7, d);
        R(f ? 14 : 15, 13, 2, 7, m);
      }
    }
  };
  const sprites = new Map();
  function sprite(kind, variant, frame, opts) {
    const key = kind + variant + frame + (opts.glow ? 'g' : '');
    let spr = sprites.get(key);
    if (spr) return spr;
    const art = ART[kind],
      cv = document.createElement('canvas');
    cv.width = art.w * 2 + 4;
    cv.height = art.h * 2 + 4;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(2, 2);
    g.scale(2, 2);
    const R = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    art.draw(R, frame, art.pal[variant % art.pal.length], opts);
    spr = canaanOutline(cv, 2);
    sprites.set(key, spr);
    return spr;
  }

  // ---------------------------------------------------------------- Peuplement par biome
  // Espèces : vitesse (pixels par pas), rayon de promenade (cases), distance de fuite, déplacement par bonds.
  const SPECIES = {
    lapin: { speed: 1.1, roam: 4, shy: 150, hop: true },
    mouton: { speed: 0.35, roam: 3, shy: 0, herd: 3 },
    poule: { speed: 0.5, roam: 3, shy: 60 },
    cerf: { speed: 0.6, roam: 6, shy: 210 },
    renard: { speed: 0.9, roam: 6, shy: 170 },
    ecureuil: { speed: 1.2, roam: 3, shy: 120, hop: true },
    grenouille: { speed: 0.9, roam: 2, shy: 90, hop: true, water: true },
    heron: { speed: 0.3, roam: 3, shy: 200, water: true, still: 0.7 },
    tortue: { speed: 0.15, roam: 2, shy: 0, water: true },
    herisson: { speed: 0.3, roam: 3, shy: 0 },
    lezard: { speed: 1.4, roam: 3, shy: 120, dart: true },
    taupe: { speed: 0.5, roam: 3, shy: 110 },
    salamandre: { speed: 1.2, roam: 3, shy: 120, dart: true },
    crapaud: { speed: 0.8, roam: 2, shy: 90, hop: true },
    faisan: { speed: 0.7, roam: 5, shy: 160 },
    canard: { speed: 0.5, roam: 3, shy: 130, water: true },
    chevre: { speed: 0.45, roam: 5, shy: 110, herd: 2 },
    fennec: { speed: 0.9, roam: 5, shy: 160 },
    chameau: { speed: 0.3, roam: 5, shy: 0, herd: 3 },
    vache: { speed: 0.25, roam: 2, shy: 0 },
    cochon: { speed: 0.4, roam: 2, shy: 0 },
    chat: { speed: 0.5, roam: 3, shy: 0, still: 0.5 },
    chien: { speed: 0.7, roam: 4, shy: 0 },
    crabe: { speed: 0.45, roam: 0, shy: 120, coast: true },
    tortue_mer: { speed: 0.3, roam: 0, shy: 0, coast: true, rest: true }
  };
  // Crabes : ils longent les plages de toute l'île, de côté, en suivant le rivage (chemin des cases de terre qui
  // bordent la mer, dans l'ordre du tour de l'île). Un trou dans la plage (roche, rivière, camp) les fait demi-tourner.
  let coastPath = null;
  function coastOf() {
    if (coastPath) return coastPath;
    coastPath = [];
    const tiles = game.world.overworld,
      cx = MAPW / 2,
      cy = MAPH / 2,
      sea = (x, y) => tiles[y]?.[x] === 0 && !BRIDGE_TILES.has(y * MAPW + x);
    for (let a = 0; a < 1440; a++) {
      const ang = (a / 1440) * Math.PI * 2,
        dx = Math.cos(ang),
        dy = Math.sin(ang);
      let best = null;
      for (let r = 120; r < 190; r += 0.5) {
        const tx = Math.round(cx + dx * r),
          ty = Math.round(cy + dy * r);
        if (tx < 2 || ty < 2 || tx >= MAPW - 2 || ty >= MAPH - 2) break;
        const x = (tx + 0.5) * TS,
          y = (ty + 0.5) * TS;
        if (
          !sea(tx, ty) &&
          walkable(x, y) &&
          !isSafe(tx, ty) &&
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([u, v]) => sea(tx + u, ty + v))
        )
          best = { x, y };
      }
      if (
        best &&
        !(coastPath.length && Math.hypot(coastPath.at(-1).x - best.x, coastPath.at(-1).y - best.y) < 6)
      )
        coastPath.push(best);
    }
    return coastPath;
  }
  function stepCrab(a) {
    const path = coastOf();
    if (path.length < 2) return;
    const r = a.rng;
    for (const hero of game.heroes) {
      const p = hero.player;
      if (!p.dead && Math.hypot(p.x - a.x, p.y - a.y) < a.sp.shy && a.flee <= 0) {
        // Il détale le long de la plage, à l'opposé du héros.
        const ahead = path[(Math.floor(a.i) + a.dir + path.length) % path.length];
        if (Math.hypot(ahead.x - p.x, ahead.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y)) a.dir = -a.dir;
        a.flee = 90;
        a.wait = 0;
      }
    }
    if (a.wait > 0) {
      a.wait--;
      a.moving = false;
      return;
    }
    if (a.flee <= 0 && r() < (a.sp.rest ? 0.0025 : 0.004)) {
      // Les tortues font des siestes au soleil, puis repartent.
      a.wait = Math.floor((a.sp.rest ? 120 : 60) + r() * (a.sp.rest ? 300 : 240));
      if (r() < 0.3) a.dir = -a.dir;
      return;
    }
    const k = Math.floor(a.i),
      from = path[(k + path.length) % path.length],
      to = path[(k + a.dir + path.length) % path.length];
    // Trou dans la plage : demi-tour.
    if (Math.hypot(to.x - from.x, to.y - from.y) > TS * 2.6) {
      a.dir = -a.dir;
      return;
    }
    const seg = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y) / TS);
    a.i += ((a.dir * a.sp.speed * (a.flee > 0 ? 3 : 1)) / (TS * seg)) * 2.2;
    if (a.flee > 0) a.flee--;
    a.i = (a.i + path.length) % path.length;
    const j = Math.floor(a.i),
      t = a.i - j,
      p0 = path[j],
      p1 = path[(j + 1) % path.length];
    if (Math.hypot(p1.x - p0.x, p1.y - p0.y) > TS * 2.6) return;
    a.x = p0.x + (p1.x - p0.x) * t + Math.sin(a.seed + a.i * 0.7) * 6;
    a.y = p0.y + (p1.y - p0.y) * t + Math.cos(a.seed + a.i * 0.5) * 4;
    a.moving = true;
    a.step += 2;
  }
  // Biomes (ordre des ZONES) : [espèce, nombre, variante, options] ; puis insectes volants.
  const FAUNA = [
    {
      ground: [
        ['lapin', 32, 0],
        ['mouton', 10, 0],
        ['cerf', 12, 0],
        ['renard', 6, 0]
      ],
      fliers: [['papillon', 36]]
    },
    {
      ground: [
        ['cerf', 24, 0],
        ['renard', 16, 0],
        ['ecureuil', 28, 0],
        ['lapin', 12, 0],
        ['faisan', 14, 0]
      ],
      fliers: [
        ['papillon', 12],
        ['luciole', 28]
      ]
    },
    {
      ground: [
        ['grenouille', 44, 0],
        ['heron', 18, 0],
        ['tortue', 18, 0],
        ['canard', 22, 0]
      ],
      fliers: [['libellule', 40]]
    },
    {
      ground: [
        ['renard', 18, 0],
        ['herisson', 20, 0],
        ['cerf', 16, 0],
        ['ecureuil', 20, 0],
        ['faisan', 14, 0]
      ],
      fliers: [['papillon', 16]]
    },
    {
      ground: [
        ['lezard', 36, 0],
        ['fennec', 18, 0],
        ['chameau', 6, 0],
        ['chevre', 10, 0]
      ],
      fliers: []
    },
    {
      ground: [
        ['cerf', 18, 1, { glow: true }],
        ['lapin', 20, 1, { glow: true }],
        ['ecureuil', 8, 0]
      ],
      fliers: [
        ['luciole', 52],
        ['papillon', 24, true]
      ]
    },
    // Terre du sud-ouest (Extension 1) : lapins et faisans dans les blés, cerfs et moutons dans l'herbe dorée.
    {
      ground: [
        ['lapin', 18, 0],
        ['faisan', 12, 0],
        ['cerf', 10, 0],
        ['mouton', 8, 0]
      ],
      fliers: [['papillon', 30]]
    }
  ];
  // Animaux de compagnie du camp (chats, chien) : ils se promènent dans le camp, hors de l'enclos.
  const PETS = new Set(['chat', 'chien']);
  const animals = [],
    fliers = [];
  let peopled = false;
  function populate() {
    peopled = true;
    const rng = seeded(4242);
    for (let zone = 0; zone < ZONES.length; zone++) {
      const z = ZONES[zone],
        fauna = FAUNA[zone];
      // Points de la région : tirés au hasard autour du centre du biome, sur un sol qui convient.
      const spot = water => {
        for (let tries = 0; tries < 400; tries++) {
          const a = rng() * Math.PI * 2,
            r = 6 + rng() * 70,
            tx = Math.round(z.x + Math.cos(a) * r),
            ty = Math.round(z.y + Math.sin(a) * r);
          if (
            tx < 3 ||
            ty < 3 ||
            tx >= MAPW - 3 ||
            ty >= MAPH - 3 ||
            regionAt(tx, ty) !== z ||
            isSafe(tx, ty)
          )
            continue;
          const x = (tx + 0.5) * TS,
            y = (ty + 0.5) * TS;
          if (!walkable(x, y)) continue;
          const wet =
            WATERY.has(tileOf(x, y)) ||
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1]
            ].some(([dx, dy]) => WATERY.has(tileOf(x + dx * TS, y + dy * TS)));
          if (water && !wet && tries < 300) continue;
          return { x, y };
        }
        return null;
      };
      for (const [kind, count, variant, opts = {}] of fauna.ground) {
        const sp = SPECIES[kind];
        for (let k = 0; k < count; k++) {
          const at = spot(!!sp.water);
          if (!at) continue;
          // Troupeaux : quelques bêtes ensemble.
          for (let h = 0; h < (sp.herd || 1); h++) {
            const x = at.x + (h ? (rng() - 0.5) * TS * 2 : 0),
              y = at.y + (h ? (rng() - 0.5) * TS * 2 : 0);
            if (!walkable(x, y)) continue;
            animals.push({
              kind,
              sp,
              variant,
              opts,
              x,
              y,
              hx: x,
              hy: y,
              tx: x,
              ty: y,
              wait: Math.floor(rng() * 200),
              dir: rng() < 0.5 ? 1 : -1,
              step: 0,
              flee: 0,
              rng: seeded(animals.length * 977 + 13)
            });
          }
        }
      }
      for (const [kind, count, glow] of fauna.fliers)
        for (let k = 0; k < count; k++) {
          const at = spot(kind === 'libellule');
          if (at)
            fliers.push({ kind, x: at.x, y: at.y, seed: rng() * 1000, glow: !!glow || kind === 'luciole' });
        }
    }
    // Crabes des plages, répartis tout autour de l'île.
    {
      const path = coastOf();
      // Tortues de mer, plus rares, qui se traînent lentement le long des plages.
      for (let k = 0; path.length > 40 && k < 32; k++) {
        const i = Math.floor(((k + 0.5) / 32) * path.length + rng() * 8) % path.length,
          p = path[i];
        animals.push({
          kind: 'tortue_mer',
          sp: SPECIES.tortue_mer,
          variant: k % 4 === 0 ? 1 : 0,
          opts: {},
          x: p.x,
          y: p.y,
          hx: p.x,
          hy: p.y,
          tx: p.x,
          ty: p.y,
          i,
          seed: rng() * 10,
          wait: Math.floor(rng() * 120),
          dir: rng() < 0.5 ? 1 : -1,
          step: 0,
          flee: 0,
          rng: seeded(k * 197 + 31)
        });
      }
      for (let k = 0; path.length > 40 && k < 36; k++) {
        const i = Math.floor((k / 36) * path.length + rng() * 8) % path.length,
          p = path[i];
        animals.push({
          kind: 'crabe',
          sp: SPECIES.crabe,
          variant: k % 3 === 0 ? 1 : 0,
          opts: {},
          x: p.x,
          y: p.y,
          hx: p.x,
          hy: p.y,
          tx: p.x,
          ty: p.y,
          i,
          seed: rng() * 10,
          wait: Math.floor(rng() * 200),
          dir: rng() < 0.5 ? 1 : -1,
          step: 0,
          flee: 0,
          rng: seeded(k * 131 + 17)
        });
      }
    }
    // Poules du Camp de l'Aurore.
    for (let k = 0; k < 4; k++) {
      const x = (CANAAN_CAMP.x - 3 + k * 1.6) * TS,
        y = (CANAAN_CAMP.y + 4.5) * TS;
      if (walkable(x, y))
        animals.push({
          kind: 'poule',
          sp: SPECIES.poule,
          variant: k % 2,
          opts: {},
          x,
          y,
          hx: x,
          hy: y,
          tx: x,
          ty: y,
          wait: k * 40,
          dir: 1,
          step: 0,
          flee: 0,
          rng: seeded(k + 99)
        });
    }
    // Ferme du camp (camp-life.js) : bêtes de l'enclos et poules du poulailler, qui restent chez elles ;
    // papillons du jardin et des champs, libellules au-dessus du ruisseau et de la mare.
    canaanCampLife.animals().forEach((f, k) => {
      if (walkable(f.x, f.y))
        animals.push({
          kind: f.kind,
          sp: { ...SPECIES[f.kind], roam: f.roam },
          variant: f.variant || 0,
          opts: {},
          x: f.x,
          y: f.y,
          hx: f.x,
          hy: f.y,
          tx: f.x,
          ty: f.y,
          wait: k * 37,
          dir: k % 2 ? -1 : 1,
          step: 0,
          flee: 0,
          farm: !PETS.has(f.kind),
          pet: PETS.has(f.kind),
          rng: seeded(k * 53 + 7)
        });
    });
    for (const f of canaanCampLife.fliers())
      fliers.push({ kind: f.kind, x: f.x, y: f.y, seed: f.seed, glow: false });
    // Faune des Tréfonds (underground.js) : sur leur propre carte, marquée layer: 'under'.
    const under = CANAAN_UNDER.fauna();
    under.ground.forEach((f, k) =>
      animals.push({
        kind: f.kind,
        sp: SPECIES[f.kind],
        variant: 0,
        opts: {},
        x: f.x,
        y: f.y,
        hx: f.x,
        hy: f.y,
        tx: f.x,
        ty: f.y,
        wait: k * 23,
        dir: 1,
        step: 0,
        flee: 0,
        layer: 'under',
        rng: seeded(k * 71 + 5)
      })
    );
    for (const f of under.fliers) fliers.push({ ...f });
  }
  const near = (x, y, margin) =>
    Math.abs(x - camX - W / 2) < W / 2 + margin && Math.abs(y - camY - H / 2) < H / 2 + margin;
  function stepAnimal(a) {
    if (a.dead) return;
    if (a.sp.coast) return stepCrab(a);
    const sp = a.sp,
      r = a.rng;
    // Fuite : un héros trop proche fait détaler les bêtes craintives.
    if (sp.shy) {
      for (const hero of game.heroes) {
        const p = hero.player,
          d = Math.hypot(p.x - a.x, p.y - a.y);
        if (d < sp.shy && !p.dead) {
          const k = (TS * (sp.roam + 2)) / Math.max(1, d);
          a.tx = a.x + (a.x - p.x) * k * 0.5;
          a.ty = a.y + (a.y - p.y) * k * 0.5;
          a.flee = 70;
          a.wait = 0;
          break;
        }
      }
    }
    const dx = a.tx - a.x,
      dy = a.ty - a.y,
      dist = Math.hypot(dx, dy);
    if (a.wait > 0) {
      a.wait--;
      a.moving = false;
      return;
    }
    if (dist < 3) {
      // Arrivé : une pause (brouter, renifler), puis un nouveau but autour de chez soi.
      a.moving = false;
      a.wait = Math.floor((sp.still ? 240 : 40) + r() * (sp.still ? 420 : 170));
      if (sp.dart && r() < 0.5) a.wait = Math.floor(20 + r() * 60);
      const ang = r() * Math.PI * 2,
        rad = r() * sp.roam * TS;
      a.tx = a.hx + Math.cos(ang) * rad;
      a.ty = a.hy + Math.sin(ang) * rad;
      return;
    }
    const speed = sp.speed * (a.flee > 0 ? 2.6 : 1) * (sp.dart ? 1.6 : 1),
      nx = a.x + (dx / dist) * Math.min(speed, dist),
      ny = a.y + (dy / dist) * Math.min(speed, dist);
    if (a.flee > 0) a.flee--;
    // Chacun reste sur un sol qui lui convient (les bêtes d'eau ne s'éloignent pas du bord).
    const ok = walkable(nx, ny) && (a.kind === 'poule' || a.farm || a.pet || !isSafe(nx / TS, ny / TS));
    if (!ok || Math.hypot(nx - a.hx, ny - a.hy) > (sp.roam + 4) * TS) {
      a.tx = a.x;
      a.ty = a.y;
      a.flee = 0;
      return;
    }
    if (Math.abs(dx) > 0.3) a.dir = dx > 0 ? 1 : -1;
    a.x = nx;
    a.y = ny;
    a.moving = true;
    a.step += speed;
  }
  function drawAnimals(c) {
    // Pas d'animaux dans les bâtiments.
    if (game.world.instance || canaanInHouse(P.x / TS, P.y / TS)) return;
    if (!peopled) populate();
    c.save();
    c.imageSmoothingEnabled = false;
    for (const a of animals) {
      if (a.dead || !canaanHere(a) || !near(a.x, a.y, 260)) continue;
      const frame = a.moving ? Math.floor(a.step / 6) % 2 : 0,
        spr = sprite(a.kind, a.variant, frame, a.opts),
        hop = a.sp.hop && a.moving ? -Math.abs(Math.sin(a.step * 0.35)) * 6 : 0;
      if (!near(a.x, a.y, 60)) continue;
      // Ombre au sol, puis l'animal tourné dans son sens de marche.
      c.globalAlpha = 0.28;
      c.fillStyle = '#0a1418';
      c.beginPath();
      c.ellipse(a.x, a.y + 2, spr.width * 0.32, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.save();
      c.translate(Math.round(a.x), Math.round(a.y + hop));
      if (a.dir < 0) c.scale(-1, 1);
      c.drawImage(spr, -Math.round(spr.width / 2), -spr.height + 3);
      c.restore();
      if (a.opts.glow) canaanLight(a.x, a.y - 14, 60, '#9ad8ff');
    }
    // Insectes : papillons, libellules et lucioles qui virevoltent autour de leur coin.
    for (const f of fliers) {
      if (!canaanHere(f) || !near(f.x, f.y, 120)) continue;
      const t = time * 0.02 + f.seed,
        x = f.x + Math.sin(t * 0.7) * 40 + Math.sin(t * 2.3) * 10,
        y = f.y - 20 + Math.cos(t * 0.9) * 26 + Math.sin(t * 3.1) * 6;
      if (f.kind === 'chauve') {
        // Chauve-souris : silhouette aux ailes qui battent, vol en huit.
        const flap = Math.sin(time * 0.6 + f.seed) > 0 ? 1 : 0;
        c.globalAlpha = 0.95;
        c.fillStyle = '#2a2230';
        c.fillRect(Math.round(x - 2), Math.round(y - 1), 4, 3);
        c.fillRect(Math.round(x - 8), Math.round(y - 3 + flap * 3), 6, 2);
        c.fillRect(Math.round(x + 2), Math.round(y - 3 + flap * 3), 6, 2);
        c.fillStyle = '#ff6a5a';
        c.fillRect(Math.round(x - 1), Math.round(y - 1), 1, 1);
        c.fillRect(Math.round(x + 1), Math.round(y - 1), 1, 1);
      } else if (f.kind === 'mouche') {
        c.globalAlpha = 0.8;
        c.fillStyle = '#1a1c18';
        for (let k = 0; k < 3; k++)
          c.fillRect(
            Math.round(x + Math.sin(t * 7 + k * 2) * 6),
            Math.round(y + Math.cos(t * 6 + k) * 5),
            2,
            2
          );
      } else if (f.kind === 'spore') {
        // Spore luisante qui monte lentement et retombe.
        const rise = ((time * 0.3 + f.seed * 37) % 120) / 120,
          sx = f.x + Math.sin(t * 0.5) * 30,
          sy = f.y - rise * 90;
        c.globalAlpha = 0.25 + (1 - rise) * 0.6;
        c.fillStyle = f.seed % 2 > 1 ? '#a8fff0' : '#ff9ae8';
        c.fillRect(Math.round(sx), Math.round(sy), 3, 3);
        if (rise < 0.4) canaanLight(sx, sy, 26, c.fillStyle);
      } else if (f.kind === 'luciole') {
        const on = 0.5 + 0.5 * Math.sin(t * 3 + f.seed);
        c.globalAlpha = 0.35 + on * 0.65;
        c.fillStyle = '#e8ff9a';
        c.fillRect(Math.round(x), Math.round(y), 3, 3);
        if (on > 0.6) canaanLight(x, y, 34, '#e8ff9a');
      } else if (f.kind === 'libellule') {
        c.globalAlpha = 0.9;
        c.fillStyle = '#3a8ad0';
        c.fillRect(Math.round(x), Math.round(y), 8, 2);
        c.fillStyle = '#d8f0ffaa';
        const flap = Math.sin(time * 1.3 + f.seed) > 0 ? 1 : 0;
        c.fillRect(Math.round(x + 2), Math.round(y - 2 - flap), 3, 2);
        c.fillRect(Math.round(x + 2), Math.round(y + 2 + flap), 3, 2);
      } else {
        const colors = f.glow
            ? ['#c99bff', '#9ff4e4', '#ffd8f8']
            : ['#f0c040', '#ffffff', '#e86a9a', '#7ab0f0'],
          col = colors[Math.floor(f.seed) % colors.length],
          flap = Math.abs(Math.sin(time * 0.5 + f.seed)) * 3;
        c.globalAlpha = 0.95;
        c.fillStyle = col;
        c.fillRect(Math.round(x - 1 - flap), Math.round(y), 2 + Math.round(flap), 3);
        c.fillRect(Math.round(x + 1), Math.round(y), 2 + Math.round(flap), 3);
        c.fillStyle = '#2a2020';
        c.fillRect(Math.round(x), Math.round(y), 1, 3);
        if (f.glow) canaanLight(x, y, 30, col);
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Habitants
  // Rôles : outil tenu, tenues possibles, vitesse et répliques.
  const ROLES = {
    garde: {
      tool: 'spear',
      outfits: ['acier', 'cramoisi'],
      speed: 0.35,
      roam: 1.5,
      lines: [
        'Halte ! Ah, c’est toi. Rien à signaler.',
        'Les loups rôdent à la lisière des plaines. Garde ton arme prête.',
        'On raconte qu’un boss mondial erre dans le désert…',
        'Je monte la garde depuis l’aube. Encore trois heures…',
        'Si tu croises des squelettes, vise la tête.'
      ]
    },
    villageois: {
      tool: 'basket',
      outfits: ['cuir', 'foret', 'rose'],
      speed: 0.45,
      roam: 4,
      lines: [
        'Le marchand a reçu de nouvelles marchandises, va voir son échoppe !',
        'Le feu de camp, ça réchauffe le cœur après une longue route.',
        'La Marmite dorée sent bon toute la journée. On y cuisine ses prises.',
        'Tu reviens des ruines ? Raconte-moi tout !',
        'Ma grand-mère disait que l’Aube s’est brisée en mille éclats.',
        'Le meilleur équipement, c’est celui qu’on arrache aux boss des donjons !',
        'J’ai cueilli des baies ce matin. Elles sont délicieuses !'
      ]
    },
    enfant: {
      tool: 'none',
      outfits: ['rose', 'foret', 'glace'],
      speed: 0.9,
      roam: 4,
      scale: 0.72,
      lines: [
        'Tu as vu ? J’ai attrapé un papillon !',
        'Quand je serai grand, je serai un héros comme toi !',
        'Chut… je joue à cache-cache avec les lapins.',
        'Est-ce que les dragons existent vraiment ?',
        'Tu me montres ton épée ? S’il te plaît !'
      ]
    },
    ancien: {
      tool: 'staff',
      outfits: ['nuit', 'cuir'],
      speed: 0.2,
      roam: 2,
      lines: [
        'De mon temps, les donjons étaient bien plus sombres…',
        'Ne va pas au Bastion du Roi Sanglant sans tes amis.',
        'Le vent tourne… il va se passer quelque chose.',
        'Repose-toi près du feu, tes jambes te remercieront.',
        'Chaque héros commence par une épée émoussée, tu sais.'
      ]
    },
    voyageur: {
      tool: 'staff',
      outfits: ['cuir', 'foret', 'or'],
      speed: 0.4,
      roam: 5,
      lines: [
        'J’arrive de la Forêt enchantée : les arbres y brillent la nuit !',
        'Le désert est traître, emporte de l’eau.',
        'Avec des amis, les raids paraissent moins longs (touche G).',
        'Les aventuriers s’échangent leur butin, tu savais ? (touche J)',
        'Je cherche une carte des oasis. Tu en aurais une ?'
      ]
    },
    pecheur: {
      tool: 'rod',
      outfits: ['cuir', 'glace'],
      speed: 0.25,
      roam: 2,
      lines: [
        'Ça ne mord pas beaucoup aujourd’hui…',
        'Le plus gros poisson que j’ai vu ? Grand comme ton épée !',
        'Les grenouilles chantent, la pluie n’est pas loin.',
        'Chut, tu vas faire fuir les poissons.'
      ]
    },
    cuisinier: {
      tool: 'none',
      outfits: ['cuir', 'rose', 'or'],
      speed: 0.3,
      roam: 1.2,
      lines: [
        'Approche-toi d’une cuisinière avec tes prises : je te prête mes fourneaux !',
        'Une soupe de gardons, et la journée commence bien.',
        'Le secret d’un bon ragoût ? Du gibier frais et de la patience.',
        'Plus tu cuisines, mieux tu cuisines. Ouvre ton carnet (touche P) !',
        'Un repas de qualité légendaire… je n’en ai vu qu’un dans ma vie.'
      ]
    },
    ermite: {
      tool: 'staff',
      outfits: ['nuit', 'rose'],
      speed: 0.2,
      roam: 2.5,
      lines: [
        'Ces pierres se souviennent de l’Aube d’avant…',
        'Les squelettes ne dorment jamais vraiment.',
        'Écoute… on entend encore les anciens murmurer.',
        'Les artéfacts de l’Arène renferment une vieille magie.'
      ]
    },
    // Kaelor, capitaine du Souffle du Dragon, sur le quai de l'Aurore (un seul, posé à part dans settle).
    capitaine: {
      tool: 'none',
      outfits: ['cramoisi'],
      speed: 0.25,
      roam: 1.2,
      lines: [
        'Je suis Kaelor, capitaine du Souffle du Dragon.',
        'Le Souffle du Dragon n’attend que le bon vent pour lever l’ancre.',
        'Cette figure de proue n’est pas qu’une sculpture. Certains soirs, ses yeux brûlent pour de vrai.',
        'Au-delà des brumes de l’ouest, le ciel s’assombrit. Les anciens parlent d’une éclipse…',
        'Quand le moment viendra, j’aurai besoin d’un équipage courageux. Tiens-toi prêt.'
      ]
    },
    eclaireuse: {
      tool: 'spear',
      outfits: ['foret', 'glace', 'nuit'],
      speed: 0.35,
      roam: 2,
      lines: [
        'D’ici, on voit loin. Les brumes cachent bien des choses.',
        'J’ai repéré des coffres cachés… mais c’est un secret.',
        'Un portail s’est ouvert au loin, je l’ai vu briller.',
        'Les monstres sont plus forts à mesure qu’on s’éloigne du camp.'
      ]
    }
  };
  // Une réplique propre au biome, ajoutée à celles des habitants des refuges et des tours.
  const BIOME_LINES = [
    'Les plaines sont douces, mais les sangliers ont mauvais caractère.',
    'Dans la Forêt ancienne, les araignées tissent des toiles géantes.',
    'Le marais avale les imprudents. Reste sur les pontons.',
    'Les feuilles d’automne cachent parfois des pièces d’or…',
    'La nuit, le sable chante sous le vent.',
    'Les fées sauvages ne sont pas aussi gentilles qu’elles en ont l’air.'
  ];
  // Prénoms des habitants : chacun tiré une seule fois (aucun doublon), et aucun n'est déjà porté par un PNJ nommé
  // (quêtes, guilde, Durgrim, Sylvaëlle, statues des légendes).
  const NAMES = {
    f: [
      'Mira',
      'Sacha',
      'Lorna',
      'Isaure',
      'Yuna',
      'Brune',
      'Talia',
      'Nora',
      'Zélie',
      'Anouk',
      'Ondine',
      'Capucine',
      'Margaux',
      'Léonie',
      'Rosalie',
      'Agathe',
      'Clémence',
      'Ninon',
      'Apolline',
      'Héloïse',
      'Romane',
      'Suzon',
      'Violette',
      'Albane',
      'Bérénice',
      'Coline',
      'Faustine',
      'Gisèle',
      'Eugénie',
      'Philippine',
      'Clotilde',
      'Mahaut'
    ],
    m: [
      'Tobin',
      'Rurik',
      'Corentin',
      'Hugo',
      'Basile',
      'Fenwick',
      'Anselme',
      'Clovis',
      'Désiré',
      'Edmond',
      'Gauvain',
      'Lazare',
      'Octave',
      'Paulin',
      'Quentin',
      'Valentin',
      'Tancrède',
      'Ulysse',
      'Cyprien',
      'Firmin',
      'Léandre',
      'Joachim',
      'Aubin',
      'Bertrand',
      'Colin',
      'Damien',
      'Évrard',
      'Fulbert',
      'Gérald',
      'Hippolyte',
      'Jasper',
      'Lucien'
    ]
  };
  const TITLES = {
    cuisinier: 'Cuisinier',
    garde: 'Garde',
    ancien: 'Vieux',
    enfant: 'Petit',
    pecheur: 'Pêcheur',
    ermite: 'Ermite',
    eclaireuse: 'Éclaireuse'
  };
  const villagers = [];
  let settled = false;
  function settle() {
    settled = true;
    const rng = seeded(777);
    const free = { f: [...NAMES.f], m: [...NAMES.m] };
    const add = (role, tx, ty, extra = [], exact = false) => {
      const r = ROLES[role],
        look = randomLook(rng);
      look.outfit = r.outfits[Math.floor(rng() * r.outfits.length)];
      if (role === 'eclaireuse') look.sex = 'f';
      const pool = free[look.sex],
        first = pool.length
          ? pool.splice(Math.floor(rng() * pool.length), 1)[0]
          : NAMES[look.sex][Math.floor(rng() * NAMES[look.sex].length)],
        title = TITLES[role]
          ? (role === 'enfant'
              ? look.sex === 'f'
                ? 'Petite'
                : 'Petit'
              : role === 'ancien'
                ? look.sex === 'f'
                  ? 'Vieille'
                  : 'Vieux'
                : role === 'cuisinier' && look.sex === 'f'
                  ? 'Cuisinière'
                  : TITLES[role]) + ' '
          : '';
      // Une case libre près du point demandé.
      for (let k = 0; k < 30; k++) {
        const spread = exact ? 1 : 4,
          x = (tx + 0.5 + (k ? (rng() - 0.5) * spread : 0)) * TS,
          y = (ty + 0.5 + (k ? (rng() - 0.5) * spread : 0)) * TS;
        if (!walkable(x, y)) continue;
        villagers.push({
          role: r,
          name: title + first,
          look: sanitizeLook(look),
          lines: [...r.lines, ...extra],
          x,
          y,
          hx: x,
          hy: y,
          tx: x,
          ty: y,
          vx: 0,
          vy: 0,
          wait: Math.floor(rng() * 200),
          face: 0,
          step: 0,
          line: Math.floor(rng() * r.lines.length),
          bubble: null,
          rng: seeded(villagers.length * 131 + 7)
        });
        return;
      }
    };
    // Camp de l'Aurore : quelques habitants dehors, autour du feu ; les autres sont chez eux (bâtiments).
    const cx = CANAAN_CAMP.x,
      cy = CANAAN_CAMP.y;
    add('garde', cx - 5, cy + 5);
    add('villageois', cx + 3, cy + 2);
    add('enfant', cx, cy + 3);
    add('voyageur', cx + 4, cy - 2);
    // Kaelor, capitaine du Souffle du Dragon : sur le quai, devant son navire (camp-life.js), en manteau de capitaine.
    const ship = CANAAN_CAMP_LIFE.ship();
    if (ship) {
      const n = villagers.length;
      add('capitaine', Math.floor(ship.x / TS) - 2, Math.floor(ship.y / TS) + 1, [], true);
      const v = villagers[n];
      if (v) {
        v.name = 'Capitaine Kaelor';
        v.line = v.lines.length - 1; // sa première réplique : il se présente.
        v.look = sanitizeLook({
          sex: 'm',
          race: 'humain',
          skin: '#c98e62',
          hairStyle: 'queue',
          hair: '#2a1f1a',
          eyes: '#202938',
          outfit: 'cramoisi',
          wear: 'pirate'
        });
      }
    }
    // Habitants des bâtiments (échoppe, cuisine, demeures, refuges) ; devant chaque refuge, un pêcheur ou un voyageur.
    const zoneOf = p => canaanSurfaceZoneAt(p.x, p.y);
    for (const r of CANAAN_HOUSE.residents()) {
      const extra = r.place ? [BIOME_LINES[zoneOf(r.place)]] : [];
      if (r.role) {
        add(r.role, r.tx, r.ty, extra, r.inside);
        continue;
      }
      const p = r.place,
        wet = [
          [3, 0],
          [-3, 0],
          [0, 3],
          [0, -3]
        ].some(
          ([dx, dy]) =>
            WATERY.has(tileOf((p.x + dx) * TS, (p.y + dy) * TS)) ||
            tileOf((p.x + dx) * TS, (p.y + dy) * TS) === 0
        );
      add(wet || zoneOf(p) === 2 ? 'pecheur' : 'voyageur', r.tx + 2, r.ty, extra);
    }
    // Ruines et tours de l'île.
    for (const p of PIXEL_PLACES) {
      const zone = zoneOf(p),
        extra = [BIOME_LINES[zone]];
      if (p.type === 'camp') continue;
      if (p.type === 'tower') {
        add('garde', p.x - 1, p.y + 2, extra);
        add('eclaireuse', p.x + 2, p.y + 1, extra);
      } else add('ermite', p.x, p.y + 2, extra);
    }
  }
  const TALK = 120;
  function stepVillager(v) {
    const r = v.role,
      rng = v.rng;
    // Le héros proche : l'habitant s'arrête, se tourne vers lui et parle.
    const hero = game.heroes
      .filter(h => !h.player.dead)
      .sort(
        (a, b) =>
          Math.hypot(a.player.x - v.x, a.player.y - v.y) - Math.hypot(b.player.x - v.x, b.player.y - v.y)
      )[0];
    const d = hero ? Math.hypot(hero.player.x - v.x, hero.player.y - v.y) : 1e9;
    v.vx = v.vy = 0;
    if (d < TALK) {
      const dx = hero.player.x - v.x,
        dy = hero.player.y - v.y;
      v.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
      if (!v.bubble || (!v.bubble.near && time - v.bubble.at > 60)) say(v, true);
      else if (time - v.bubble.at > 420) say(v, true);
      return;
    }
    if (v.bubble?.near) v.bubble = null;
    if (v.wait > 0) {
      v.wait--;
      return;
    }
    const dx = v.tx - v.x,
      dy = v.ty - v.y,
      dist = Math.hypot(dx, dy);
    if (dist < 2) {
      v.wait = Math.floor(120 + rng() * 360);
      const a = rng() * Math.PI * 2,
        rad = rng() * r.roam * TS;
      v.tx = v.hx + Math.cos(a) * rad;
      v.ty = v.hy + Math.sin(a) * rad;
      return;
    }
    const sp = Math.min(r.speed, dist),
      nx = v.x + (dx / dist) * sp,
      ny = v.y + (dy / dist) * sp;
    if (!walkable(nx, ny)) {
      v.tx = v.x;
      v.ty = v.y;
      return;
    }
    v.vx = (dx / dist) * sp;
    v.vy = (dy / dist) * sp;
    v.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
    v.x = nx;
    v.y = ny;
    v.step += sp;
  }
  function say(v, nearby) {
    v.line = (v.line + 1) % v.lines.length;
    v.bubble = { text: v.lines[v.line], at: time, near: nearby };
    CANAAN_SOUND.voice(v.name, v.bubble.text, v.x, v.y, v.look?.sex === 'f' ? 'f' : 'm');
  }
  // De temps en temps, un habitant visible parle tout seul (un peu de vie même de loin).
  let chatter = 0;
  function drawVillagers(c) {
    if (game.world.instance || canaanUnder()) return;
    if (!settled) settle();
    c.save();
    c.imageSmoothingEnabled = false;
    const here = canaanRoomAt(P.x / TS, P.y / TS);
    for (const v of villagers) {
      if (!near(v.x, v.y, 80) || canaanRoomAt(v.x / TS, v.y / TS) !== here) continue;
      const moving = Math.hypot(v.vx, v.vy) > 0.05,
        frame = moving ? Math.floor(v.step / 7) % 4 : 0,
        spr = canaanHeroSprite(v.look, v.face, frame, { tool: v.role.tool }),
        s = (v.role.scale || 1) * lookRace(v.look.race).scale;
      c.globalAlpha = 0.3;
      c.fillStyle = '#0a1418';
      c.beginPath();
      c.ellipse(v.x, v.y + 17 * s, 15 * s, 5 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      // Une apparence portée (Kaelor et son manteau de capitaine) a de la place autour : même taille que le héros.
      const px = spr.padX || 0,
        py = spr.padY || 0;
      c.drawImage(
        spr,
        Math.round(v.x - (26 + px) * s),
        Math.round(v.y + 18 - (60 + py) * s),
        Math.round(spr.width * s),
        Math.round(spr.height * s)
      );
      // Nom au-dessus, quand le héros est proche.
      if (Math.hypot(P.x - v.x, P.y - v.y) < TALK * 1.6)
        drawCanaanName(c, translateText(v.name), v.x, v.y - 48 * s);
    }
    c.restore();
  }
  // Bulles de dialogue, au-dessus de tout (même dans l'obscurité).
  // La phrase est traduite entière avant d'être coupée en lignes (une ligne seule ne serait pas reconnue).
  function wrap(c, text, max) {
    const words = translateText(text).split(' '),
      lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > max && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawBubbles(c) {
    if (game.world.instance || canaanUnder() || !settled) return;
    c.save();
    c.font = canaanFont(12, '');
    c.textAlign = 'center';
    const here = canaanRoomAt(P.x / TS, P.y / TS);
    for (const v of villagers) {
      const b = v.bubble;
      if (!b || !near(v.x, v.y, 40) || canaanRoomAt(v.x / TS, v.y / TS) !== here) continue;
      const age = time - b.at,
        life = b.near ? 1e9 : 260;
      if (age > life) {
        v.bubble = null;
        continue;
      }
      const alpha = Math.min(1, age / 10, (life - age) / 20),
        lines = wrap(c, b.text, 190),
        w = Math.min(214, Math.max(...lines.map(l => c.measureText(l).width)) + 20),
        h = lines.length * 15 + 12,
        s = v.role.scale || 1,
        x = Math.round(v.x - w / 2),
        y = Math.round(v.y - 48 * s - 16 - h - 8);
      c.globalAlpha = alpha * 0.95;
      c.fillStyle = '#fbf3df';
      c.strokeStyle = '#3a2a1e';
      c.lineWidth = 2;
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, h, 7);
      else c.rect(x, y, w, h);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(v.x - 6, y + h - 1);
      c.lineTo(v.x, y + h + 8);
      c.lineTo(v.x + 6, y + h - 1);
      c.fill();
      c.globalAlpha = alpha;
      c.fillStyle = '#2a1e14';
      lines.forEach((l, i) => c.fillText(l, v.x, y + 19 + i * 15));
    }
    c.restore();
  }
  // Pas de simulation : animaux et habitants proches de l'écran avancent à chaque pas du jeu.
  let last = null;
  function update() {
    if (!started || game.world.instance) return;
    if (!peopled) populate();
    if (!settled) settle();
    const ticks = last === null ? 1 : Math.max(0, Math.min(5, time - last));
    last = time;
    for (let k = 0; k < ticks; k++) {
      for (const a of animals) if (canaanHere(a) && near(a.x, a.y, 500)) stepAnimal(a);
      // Un animal chassé revient une minute plus tard, chez lui.
      for (const a of animals)
        if (a.dead && time - a.dead > 3600) {
          a.dead = 0;
          a.x = a.tx = a.hx;
          a.y = a.ty = a.hy;
          if (a.sp.coast) a.i = coastOf().findIndex(p => p.x === a.hx && p.y === a.hy);
          a.flee = 0;
        }
      if (!canaanUnder()) for (const v of villagers) if (near(v.x, v.y, 400)) stepVillager(v);
    }
    huntCheck();
    if (ticks && --chatter <= 0 && !canaanUnder()) {
      chatter = 600 + Math.floor(Math.random() * 600);
      const here = canaanRoomAt(P.x / TS, P.y / TS),
        idle = villagers.filter(
          v => near(v.x, v.y, -40) && !v.bubble && canaanRoomAt(v.x / TS, v.y / TS) === here
        );
      if (idle.length) say(idle[Math.floor(Math.random() * idle.length)], false);
    }
  }
  // Chasse : au début d'une attaque du héros de ce joueur, le premier gibier touché (arc ou bâton : en ligne droite
  // vers le viseur ; arme de mêlée : devant soi, à portée) tombe, et l'hôte donne la viande.
  let lastAtk = 0;
  function huntCheck() {
    const atk = P.atk || 0,
      start = atk > lastAtk + 0.1 && atk > 0.2;
    lastAtk = atk;
    if (!start || P.dead || game.world.instance) return null;
    const type = game.hero.equipment?.weapon?.weaponType || 'sword',
      ranged = type === 'bow' || type === 'staff',
      a = Math.atan2(mouseWorldY - P.y, mouseWorldX - P.x),
      cos = Math.cos(a),
      sin = Math.sin(a);
    let best = null,
      bd = 1e9;
    for (const an of animals) {
      if (an.dead || !canaanHere(an) || !CANAAN_PROF.huntable(an.kind, !!an.opts.glow)) continue;
      const dx = an.x - P.x,
        dy = an.y - 10 - P.y,
        d = Math.hypot(dx, dy);
      if (ranged) {
        const along = dx * cos + dy * sin;
        if (d > 460 || along < 0 || Math.abs(-dx * sin + dy * cos) > 28) continue;
      } else {
        const range = type === 'spear' ? 200 : 165,
          diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a));
        if (d > range || Math.abs(diff) > (type === 'spear' ? 0.4 : 1.1)) continue;
      }
      if (d < bd) {
        bd = d;
        best = an;
      }
    }
    if (!best) return null;
    best.dead = time || 1;
    burst(best.x, best.y - 8, best.opts.glow ? '#9ad8ff' : '#e8dcc0', 10);
    CANAAN_PROF.hunted(best.kind, !!best.opts.glow);
    return best;
  }
  window.CANAAN_LIFE = Object.freeze({
    update,
    huntCheck,
    // Image d'un animal (collection du carnet de chasse).
    icon: (kind, variant = 0, glow = false) => sprite(kind, variant, 0, glow ? { glow: true } : {}),
    drawAnimals,
    drawVillagers,
    drawBubbles,
    animals: () => animals,
    // Animaux de l'île placés à la surface (avant de descendre dans les Tréfonds).
    prepare: () => {
      if (!peopled) populate();
      if (!settled) settle();
    },
    fliers: () => fliers,
    villagers: () => villagers
  });
})();
