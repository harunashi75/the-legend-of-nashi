// Bâtiments où l'on entre : E devant une porte fait passer dans une pièce intérieure (posée dans un coin d'océan
// de la carte, invisible de l'extérieur), avec ses meubles et un ou deux habitants (life.js).
// - Camp de l'Aurore : l'Échoppe de Lira (le marchand, derrière son comptoir), La Marmite dorée (cuisinières où
//   cuisiner ses prises) et deux demeures ; d'autres habitants restent dehors, autour du feu.
// - Refuges de l'île : cabanes en rondins (ou en terre crue dans le désert) avec cheminée ou cuisinière.
// - Maison du joueur : chaumière à l'ouest du camp, pièce vide ; H y ouvre le mode décoration (lits, tables, chaises,
//   cuisinière, plantes, tapis, fenêtres avec vue, rideaux…), R tourne le meuble en main ou celui visé.
// Les meubles de la maison appartiennent à l'aventure (sauvegarde de l'hôte : monde.maison) ; un invité peut entrer
// et décorer, l'hôte vérifie chaque meuble posé, tourné ou retiré et renvoie la maison à tous.
(() => {
  'use strict';
  const MAX_ITEMS = 150;
  const FLOOR_TILE = 30,
    WALL_TILE = 31,
    OUTSIDE_TILE = 32;
  const R = (g, x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  function fire(g, x, y, w, h) {
    const f = Math.sin(time * 0.3) * 2;
    R(g, x, y + h * 0.4, w, h * 0.6, '#e0502a');
    R(g, x + w * 0.15, y + h * 0.2 - f, w * 0.7, h * 0.6, '#f08a2a');
    R(g, x + w * 0.3, y + h * 0.05 + f, w * 0.4, h * 0.5, '#ffd36b');
    R(g, x + w * 0.42, y + h * 0.3 - f, w * 0.16, h * 0.3, '#fff6c0');
  }
  // Vue par une fenêtre : ciel, nuages qui passent, collines et un arbre.
  function view(g, x, y, w, h) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#6ab0e8');
    sky.addColorStop(1, '#c8e8f8');
    g.fillStyle = sky;
    g.fillRect(x, y, w, h);
    R(g, x + w - 14, y + 5, 8, 8, '#fff2a0');
    const drift = (time * 0.15) % (w + 40);
    R(g, x - 20 + drift, y + 10, 18, 5, '#ffffff');
    R(g, x - 14 + drift, y + 7, 10, 4, '#ffffff');
    R(g, x + ((drift + w / 2) % (w + 40)) - 20, y + 20, 14, 4, '#f0f6ff');
    g.fillStyle = '#6aa552';
    g.beginPath();
    g.ellipse(x + w * 0.3, y + h, w * 0.6, h * 0.35, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#4f8a42';
    g.beginPath();
    g.ellipse(x + w * 0.85, y + h, w * 0.5, h * 0.25, 0, Math.PI, 0);
    g.fill();
    R(g, x + w * 0.62, y + h * 0.55, 3, h * 0.3, '#654b35');
    g.fillStyle = '#2e6a3e';
    g.beginPath();
    g.arc(x + w * 0.62 + 1.5, y + h * 0.52, 8, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  // Catalogue : nom, catégorie, couche (sol, tapis, mur, rideau), taille en cases et dessin.
  // Un meuble « au fond » se pose contre le mur du fond ; les meubles du sol bloquent le passage.
  const CATALOG = {
    lit: {
      name: 'Lit',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 2,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 3, y + 2, W - 6, 14, '#5a3a22');
        R(g, x + 5, y + 4, W - 10, 10, '#7a5230');
        R(g, x + 5, y + 14, W - 10, H - 20, '#f0ece4');
        R(g, x + 9, y + 18, W - 18, 12, '#ffffff');
        R(g, x + 5, y + 36, W - 10, H - 44, '#b04a4a');
        for (let k = 0; k < 4; k++) R(g, x + 5, y + 40 + k * 12, W - 10, 2, '#8a3434');
        R(g, x + 3, y + H - 8, W - 6, 6, '#5a3a22');
      }
    },
    lit_double: {
      name: 'Grand lit',
      cat: 'meubles',
      layer: 'floor',
      w: 2,
      h: 2,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 3, y + 2, W - 6, 16, '#4a2e1a');
        R(g, x + 6, y + 5, W - 12, 10, '#6a4428');
        R(g, x + 5, y + 16, W - 10, H - 22, '#f0ece4');
        R(g, x + 10, y + 20, W / 2 - 14, 12, '#ffffff');
        R(g, x + W / 2 + 4, y + 20, W / 2 - 14, 12, '#ffffff');
        R(g, x + 5, y + 38, W - 10, H - 46, '#3e5a9a');
        R(g, x + 5, y + 38, W - 10, 4, '#5a7ac0');
        for (let k = 0; k < 3; k++) R(g, x + 12 + k * 26, y + 50, 10, 10, '#d8c060');
        R(g, x + 3, y + H - 8, W - 6, 6, '#4a2e1a');
      }
    },
    table: {
      name: 'Table',
      cat: 'meubles',
      layer: 'floor',
      w: 2,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 8, y + 26, 5, 20, '#5a3a22');
        R(g, x + W - 13, y + 26, 5, 20, '#5a3a22');
        R(g, x + 3, y + 8, W - 6, 22, '#8a5a34');
        R(g, x + 3, y + 8, W - 6, 4, '#b07a48');
        R(g, x + 3, y + 28, W - 6, 4, '#5a3a22');
        R(g, x + 20, y + 12, 14, 8, '#e8e0d0');
        R(g, x + 22, y + 13, 10, 4, '#c8a050');
        R(g, x + W - 30, y + 4, 4, 12, '#f0e8c0');
        R(g, x + W - 29, y + 1 - (time % 20 < 10 ? 1 : 0), 2, 4, '#ffd36b');
      }
    },
    table_ronde: {
      name: 'Table ronde',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + W / 2 - 3, y + 26, 6, 18, '#5a3a22');
        g.fillStyle = '#8a5a34';
        g.beginPath();
        g.ellipse(x + W / 2, y + 22, W / 2 - 4, 13, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#b07a48';
        g.beginPath();
        g.ellipse(x + W / 2, y + 20, W / 2 - 8, 9, 0, 0, Math.PI * 2);
        g.fill();
        R(g, x + W / 2 - 4, y + 8, 8, 10, '#6a8ad0');
        R(g, x + W / 2 - 6, y + 2, 4, 6, '#e05a7a');
        R(g, x + W / 2 + 2, y + 3, 4, 5, '#f0c040');
      }
    },
    chaise: {
      name: 'Chaise',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      // Quatre orientations dessinées à la main : de face, de profil (gauche, droite) et de dos.
      turn: 'self',
      draw(g, x, y, W, H, r = 0) {
        if (r === 3) {
          g.save();
          g.translate(x * 2 + W, 0);
          g.scale(-1, 1);
          this.draw(g, x, y, W, H, 1);
          g.restore();
          return;
        }
        if (r === 0) {
          R(g, x + 13, y + 2, 4, 26, '#6a4428');
          R(g, x + W - 17, y + 2, 4, 26, '#6a4428');
          R(g, x + 13, y + 4, W - 26, 4, '#8a5a34');
          R(g, x + 13, y + 12, W - 26, 3, '#8a5a34');
          R(g, x + 11, y + 24, W - 22, 8, '#8a5a34');
          R(g, x + 11, y + 24, W - 22, 2, '#b07a48');
          R(g, x + 13, y + 32, 3, 13, '#5a3a22');
          R(g, x + W - 16, y + 32, 3, 13, '#5a3a22');
        } else if (r === 2) {
          // De dos : l'assise, puis le dossier devant elle.
          R(g, x + 13, y + 32, 3, 13, '#5a3a22');
          R(g, x + W - 16, y + 32, 3, 13, '#5a3a22');
          R(g, x + 11, y + 20, W - 22, 8, '#8a5a34');
          R(g, x + 11, y + 20, W - 22, 2, '#b07a48');
          R(g, x + 13, y + 8, 4, 30, '#6a4428');
          R(g, x + W - 17, y + 8, 4, 30, '#6a4428');
          R(g, x + 13, y + 10, W - 26, 5, '#8a5a34');
          R(g, x + 13, y + 10, W - 26, 1, '#b07a48');
          R(g, x + 13, y + 19, W - 26, 4, '#7a4e2c');
        } else {
          // De profil, tournée vers la gauche : dossier à droite.
          R(g, x + 12, y + 31, 3, 14, '#5a3a22');
          R(g, x + 31, y + 31, 3, 14, '#5a3a22');
          R(g, x + 10, y + 24, 26, 8, '#8a5a34');
          R(g, x + 10, y + 24, 26, 2, '#b07a48');
          R(g, x + 31, y + 2, 5, 30, '#6a4428');
          R(g, x + 32, y + 3, 2, 26, '#8a5a34');
        }
      }
    },
    banc: {
      name: 'Banc',
      cat: 'meubles',
      layer: 'floor',
      w: 2,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 6, y + 16, W - 12, 6, '#8a5a34');
        R(g, x + 6, y + 23, W - 12, 6, '#7a4e2c');
        R(g, x + 6, y + 16, W - 12, 2, '#b07a48');
        R(g, x + 10, y + 29, 5, 16, '#5a3a22');
        R(g, x + W - 15, y + 29, 5, 16, '#5a3a22');
      }
    },
    armoire: {
      name: 'Armoire',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + 4, y - 34, W - 8, H + 30, '#5a3a22');
        R(g, x + 7, y - 30, W / 2 - 8, H + 18, '#7a5230');
        R(g, x + W / 2 + 1, y - 30, W / 2 - 8, H + 18, '#7a5230');
        R(g, x + W / 2 - 4, y - 4, 2, 6, '#e0c060');
        R(g, x + W / 2 + 2, y - 4, 2, 6, '#e0c060');
        R(g, x + 2, y - 38, W - 4, 5, '#4a2e1a');
      }
    },
    bibliotheque: {
      name: 'Bibliothèque',
      cat: 'meubles',
      layer: 'floor',
      w: 2,
      h: 1,
      back: true,
      draw(g, x, y, W, H) {
        R(g, x + 3, y - 40, W - 6, H + 36, '#5a3a22');
        const colors = ['#a8442a', '#3e5a9a', '#4f8a42', '#c9a24a', '#7a4a8a', '#2e6a72'];
        for (let row = 0; row < 3; row++) {
          const ry = y - 34 + row * 24;
          R(g, x + 6, ry, W - 12, 20, '#2a1a10');
          for (let k = 0; k < 9; k++) R(g, x + 8 + k * 9, ry + 3 + ((k * 7 + row) % 4), 7, 17 - ((k * 7 + row) % 4), colors[(k + row * 2) % colors.length]);
          R(g, x + 4, ry + 20, W - 8, 3, '#7a5230');
        }
      }
    },
    coffre: {
      name: 'Coffre',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 6, y + 14, W - 12, 28, '#7a4e2c');
        R(g, x + 6, y + 10, W - 12, 10, '#8a5a34');
        R(g, x + 6, y + 10, W - 12, 2, '#b07a48');
        R(g, x + 10, y + 10, 4, 32, '#5a5a62');
        R(g, x + W - 14, y + 10, 4, 32, '#5a5a62');
        R(g, x + W / 2 - 3, y + 20, 6, 7, '#e0c060');
      }
    },
    commode: {
      name: 'Commode',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + 4, y + 2, W - 8, 42, '#6a4428');
        for (let k = 0; k < 3; k++) {
          R(g, x + 7, y + 6 + k * 13, W - 14, 10, '#8a5a34');
          R(g, x + W / 2 - 3, y + 10 + k * 13, 6, 2, '#e0c060');
        }
        R(g, x + 2, y, W - 4, 4, '#4a2e1a');
        R(g, x + W / 2 - 4, y - 10, 8, 10, '#e8e0d0');
      }
    },
    cuisiniere: {
      name: 'Cuisinière',
      cat: 'cuisine',
      layer: 'floor',
      w: 1,
      h: 1,
      fire: true,
      draw(g, x, y, W, H) {
        R(g, x + W - 14, y - 30, 6, 34, '#2a2a30');
        R(g, x + 4, y + 4, W - 8, 40, '#2e2e36');
        R(g, x + 4, y + 4, W - 8, 4, '#5a5a66');
        R(g, x + 9, y + 18, W - 18, 18, '#18181e');
        fire(g, x + 12, y + 22, W - 24, 12);
        R(g, x + 9, y - 6, 18, 10, '#6a6a74');
        R(g, x + 9, y - 6, 18, 2, '#9a9aa4');
        const s = (time * 0.4) % 20;
        g.globalAlpha = 0.5 * (1 - s / 20);
        R(g, x + 14, y - 10 - s, 4, 4, '#ffffff');
        R(g, x + 20, y - 14 - ((s + 8) % 20), 3, 3, '#ffffff');
        g.globalAlpha = 1;
      }
    },
    cheminee: {
      name: 'Cheminée',
      cat: 'cuisine',
      layer: 'floor',
      w: 2,
      h: 1,
      back: true,
      fire: true,
      draw(g, x, y, W, H) {
        R(g, x + 2, y - 40, W - 4, H + 38, '#7a7a80');
        for (let k = 0; k < 6; k++) R(g, x + 2 + ((k % 2) * 20), y - 36 + k * 14, W - 4, 2, '#5a5a62');
        R(g, x + 16, y - 8, W - 32, 46, '#1a1414');
        fire(g, x + 22, y + 10, W - 44, 26);
        R(g, x + 22, y + 34, W - 44, 4, '#5a3a22');
        R(g, x - 2, y - 14, W + 4, 6, '#5a3a22');
        R(g, x + 10, y - 24, 6, 10, '#c9a24a');
        R(g, x + W - 18, y - 22, 8, 8, '#e8e0d0');
      }
    },
    tonneau: {
      name: 'Tonneau',
      cat: 'cuisine',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + 10, y + 4, W - 20, 40, '#8a5a34');
        R(g, x + 8, y + 10, W - 16, 28, '#8a5a34');
        R(g, x + 8, y + 12, W - 16, 3, '#4a4a52');
        R(g, x + 8, y + 32, W - 16, 3, '#4a4a52');
        R(g, x + 14, y + 4, 4, 40, '#a8743e');
      }
    },
    plante: {
      name: 'Grande plante',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        const sway = Math.sin(time * 0.03 + x) * 1.5;
        R(g, x + 14, y + 28, W - 28, 16, '#a8603a');
        R(g, x + 12, y + 26, W - 24, 4, '#c8784a');
        g.fillStyle = '#3e7a3e';
        for (const [dx, dy, r] of [[0, -6, 12], [-9, 4, 9], [9, 4, 9], [-5, -18, 8], [6, -16, 8]]) {
          g.beginPath();
          g.arc(x + W / 2 + dx + sway, y + 14 + dy, r, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#6ab052';
        g.beginPath();
        g.arc(x + W / 2 - 3 + sway, y + 6, 5, 0, Math.PI * 2);
        g.fill();
      }
    },
    pot_fleurs: {
      name: 'Pot de fleurs',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + 16, y + 30, W - 32, 14, '#c8784a');
        R(g, x + 14, y + 28, W - 28, 4, '#e0905a');
        R(g, x + 20, y + 16, 2, 14, '#4f8a42');
        R(g, x + 26, y + 14, 2, 16, '#4f8a42');
        R(g, x + 30, y + 18, 2, 12, '#4f8a42');
        R(g, x + 17, y + 12, 8, 6, '#e05a7a');
        R(g, x + 24, y + 9, 7, 6, '#f0c040');
        R(g, x + 28, y + 14, 7, 6, '#9a7ae0');
      }
    },
    lampe: {
      name: 'Lampe',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      light: '#ffd890',
      draw(g, x, y, W, H) {
        R(g, x + 16, y + 40, W - 32, 5, '#3a2a1e');
        R(g, x + W / 2 - 2, y - 6, 4, 46, '#3a2a1e');
        R(g, x + 12, y - 20, W - 24, 16, '#f0d8a0');
        R(g, x + 10, y - 6, W - 20, 3, '#c8a868');
        g.globalAlpha = 0.25;
        R(g, x + 6, y - 4, W - 12, 20, '#fff0b0');
        g.globalAlpha = 1;
      }
    },
    aquarium: {
      name: 'Aquarium',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        R(g, x + 4, y + 30, W - 8, 14, '#5a3a22');
        R(g, x + 4, y + 2, W - 8, 30, '#9ad8f0');
        R(g, x + 4, y + 2, W - 8, 4, '#c8f0ff');
        R(g, x + 6, y + 26, W - 12, 4, '#d8c890');
        R(g, x + 10, y + 16, 2, 10, '#4f8a42');
        const f = Math.sin(time * 0.05) * 12;
        R(g, x + W / 2 - 3 + f, y + 14, 7, 4, '#f08a2a');
        R(g, x + W / 2 - 5 + f * (f > 0 ? 1 : 1), y + 14, 2, 4, '#f0b040');
        R(g, x + W / 2 + 2 - f * 0.6, y + 21, 5, 3, '#e0e040');
        g.globalAlpha = 0.6;
        R(g, x + 30, y + 22 - ((time * 0.3) % 18), 2, 2, '#ffffff');
        g.globalAlpha = 1;
      }
    },
    // Tapis : sous les meubles, on marche dessus.
    tapis: {
      name: 'Tapis rouge',
      cat: 'tapis',
      layer: 'rug',
      w: 2,
      h: 2,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 4, y + 4, W - 8, H - 8, '#9a3434');
        R(g, x + 9, y + 9, W - 18, H - 18, '#c9a24a');
        R(g, x + 12, y + 12, W - 24, H - 24, '#b04a4a');
        R(g, x + W / 2 - 10, y + H / 2 - 10, 20, 20, '#c9a24a');
        R(g, x + W / 2 - 5, y + H / 2 - 5, 10, 10, '#7a2424');
      }
    },
    tapis_rond: {
      name: 'Tapis rond',
      cat: 'tapis',
      layer: 'rug',
      w: 2,
      h: 2,
      draw(g, x, y, W, H) {
        for (const [r, col] of [[0, '#3e5a9a'], [7, '#d8e0f0'], [11, '#5a7ac0'], [22, '#d8e0f0'], [26, '#3e5a9a']]) {
          g.fillStyle = col;
          g.beginPath();
          g.ellipse(x + W / 2, y + H / 2, W / 2 - 4 - r, H / 2 - 8 - r * 0.8, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
    tapis_long: {
      name: 'Tapis long',
      cat: 'tapis',
      layer: 'rug',
      w: 3,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 8, y + 8, W - 16, H - 16, '#4f7a42');
        R(g, x + 12, y + 12, W - 24, H - 24, '#c9a24a');
        R(g, x + 15, y + 15, W - 30, H - 30, '#5a8a4a');
        for (let k = 0; k < 6; k++) {
          R(g, x + 3, y + 10 + k * 5, 5, 2, '#e8d8a0');
          R(g, x + W - 8, y + 10 + k * 5, 5, 2, '#e8d8a0');
        }
      }
    },
    // Décorations gagnées dans les quêtes (quest : quête qui la débloque pour le héros qui la pose).
    mouton: {
      name: 'Petit mouton',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 3,
      draw(g, x, y, W) {
        R(g, x + 10, y + 18, W - 20, 16, '#f0ece4');
        for (const [dx, dy] of [[12, 15], [20, 13], [28, 15]]) R(g, x + dx, y + dy, 8, 6, '#ffffff');
        R(g, x + W - 14, y + 16, 9, 10, '#3a3030');
        R(g, x + W - 11, y + 19, 2, 2, '#ffffff');
        for (const dx of [12, 18, 26, 32]) R(g, x + dx, y + 34, 3, 7, '#3a3030');
        R(g, x + 8, y + 42, W - 16, 3, '#00000033');
      }
    },
    figurine: {
      name: 'Le petit voleur',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 9,
      draw(g, x, y, W) {
        R(g, x + 12, y + 32, W - 24, 10, '#8a7a62');
        R(g, x + 10, y + 30, W - 20, 4, '#a8987a');
        R(g, x + 14, y + 18, 18, 12, '#8ac06a');
        R(g, x + 28, y + 10, 10, 10, '#9ad07a');
        R(g, x + 34, y + 13, 2, 2, '#1a1418');
        R(g, x + 6, y + 18, 10, 4, '#e08a3a');
      }
    },
    lanterne: {
      name: 'Lueur d’Ilian',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 14,
      light: '#bfe8ff',
      draw(g, x, y, W) {
        R(g, x + W / 2 - 2, y + 2, 4, 40, '#3a3430');
        R(g, x + 14, y - 12, W - 28, 16, '#bfe8ff');
        R(g, x + 12, y - 14, W - 24, 4, '#2a2420');
        R(g, x + 16, y + 40, W - 32, 4, '#2a2420');
        g.globalAlpha = 0.25 + 0.1 * Math.sin(time * 0.05);
        R(g, x + 8, y - 16, W - 16, 26, '#e8f8ff');
        g.globalAlpha = 1;
      }
    },
    tableau: {
      name: 'L’oiseau d’ombre',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      quest: 10,
      draw(g, x, y, W) {
        R(g, x + 4, y + 18, W - 8, 44, '#8a6a3a');
        R(g, x + 8, y + 22, W - 16, 36, '#e8dcc0');
        g.fillStyle = '#2a3440';
        g.beginPath();
        g.moveTo(x + 10, y + 36);
        g.quadraticCurveTo(x + 18, y + 28, x + W / 2, y + 40);
        g.quadraticCurveTo(x + W - 18, y + 28, x + W - 10, y + 36);
        g.lineTo(x + W / 2 + 2, y + 50);
        g.lineTo(x + W / 2 - 2, y + 50);
        g.closePath();
        g.fill();
      }
    },
    feuille: {
      name: 'Feuille éternelle',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 18,
      light: '#ffd84a',
      draw(g, x, y, W) {
        R(g, x + 14, y + 32, W - 28, 10, '#6a4a2a');
        R(g, x + 12, y + 30, W - 24, 4, '#8a6a3a');
        R(g, x + W / 2 - 1, y + 14, 2, 18, '#5a3a20');
        g.fillStyle = '#f0b030';
        g.beginPath();
        g.moveTo(x + W / 2, y - 2);
        g.quadraticCurveTo(x + W - 10, y + 6, x + W / 2, y + 18);
        g.quadraticCurveTo(x + 10, y + 6, x + W / 2, y - 2);
        g.fill();
        R(g, x + W / 2 - 1, y + 2, 2, 14, '#c88010');
      }
    },
    bouteille: {
      name: 'Bouteille de vent',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 23,
      draw(g, x, y, W) {
        R(g, x + 16, y + 10, W - 32, 32, '#9ad0f0');
        R(g, x + 18, y + 12, 4, 26, '#e8f8ff');
        R(g, x + 20, y + 2, W - 40, 10, '#9ad0f0');
        R(g, x + 19, y - 2, W - 38, 5, '#8a5a34');
        g.globalAlpha = 0.6;
        for (let k = 0; k < 3; k++) R(g, x + 20 + ((time * 0.4 + k * 6) % 10), y + 16 + k * 8, 6, 2, '#ffffff');
        g.globalAlpha = 1;
      }
    },
    dragon: {
      name: 'Petit dragon',
      cat: 'deco',
      layer: 'floor',
      w: 1,
      h: 1,
      quest: 29,
      draw(g, x, y, W) {
        R(g, x + 10, y + 34, W - 20, 8, '#8a8a84');
        R(g, x + 12, y + 18, 20, 14, '#c83a2a');
        R(g, x + 14, y + 26, 16, 4, '#f0c060');
        R(g, x + 28, y + 8, 12, 12, '#c83a2a');
        R(g, x + 35, y + 11, 2, 2, '#1a1418');
        R(g, x + 30, y + 4, 3, 5, '#f0c060');
        R(g, x + 6, y + 22, 8, 4, '#c83a2a');
        g.fillStyle = '#a82a1a';
        g.beginPath();
        g.moveTo(x + 18, y + 18);
        g.lineTo(x + 8, y + 2);
        g.lineTo(x + 24, y + 18);
        g.fill();
      }
    },
    // Décoration murale : sur le mur du fond.
    fenetre: {
      name: 'Fenêtre',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      light: '#e8f4ff',
      draw(g, x, y, W, H) {
        R(g, x + 5, y + 12, W - 10, 62, '#5a3a22');
        view(g, x + 9, y + 16, W - 18, 54);
        R(g, x + W / 2 - 1, y + 16, 2, 54, '#5a3a22');
        R(g, x + 9, y + 40, W - 18, 2, '#5a3a22');
        R(g, x + 3, y + 72, W - 6, 5, '#8a5a34');
      }
    },
    grande_fenetre: {
      name: 'Grande fenêtre',
      cat: 'murs',
      layer: 'wall',
      w: 2,
      h: 2,
      light: '#e8f4ff',
      draw(g, x, y, W, H) {
        R(g, x + 5, y + 10, W - 10, 66, '#5a3a22');
        view(g, x + 9, y + 14, W - 18, 58);
        for (const fx of [W / 3, (2 * W) / 3]) R(g, x + fx - 1, y + 14, 2, 58, '#5a3a22');
        R(g, x + 9, y + 38, W - 18, 2, '#5a3a22');
        R(g, x + 3, y + 74, W - 6, 5, '#8a5a34');
        R(g, x + 14, y + 66, 12, 8, '#c8784a');
        R(g, x + 15, y + 61, 4, 5, '#e05a7a');
        R(g, x + 20, y + 60, 4, 5, '#f0c040');
      }
    },
    cadre: {
      name: 'Cadre',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 9, y + 22, W - 18, 36, '#c9a24a');
        R(g, x + 12, y + 25, W - 24, 30, '#e8d8a0');
        R(g, x + 12, y + 40, W - 24, 15, '#6aa552');
        R(g, x + 12, y + 25, W - 24, 15, '#9ad0f0');
        R(g, x + 26, y + 30, 5, 5, '#fff2a0');
        R(g, x + 16, y + 36, 6, 8, '#3e7a3e');
      }
    },
    tableau: {
      name: 'Grand tableau',
      cat: 'murs',
      layer: 'wall',
      w: 2,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 8, y + 16, W - 16, 48, '#8a6a2a');
        R(g, x + 12, y + 20, W - 24, 40, '#2a3a5a');
        g.fillStyle = '#f0e0a0';
        g.beginPath();
        g.arc(x + W - 30, y + 32, 6, 0, Math.PI * 2);
        g.fill();
        R(g, x + 12, y + 46, W - 24, 14, '#3e5a3e');
        for (let k = 0; k < 6; k++) R(g, x + 16 + k * 11, y + 24 + ((k * 5) % 9), 1, 1, '#ffffff');
        R(g, x + 30, y + 38, 8, 8, '#7a5a3a');
        R(g, x + 28, y + 34, 12, 4, '#a8442a');
      }
    },
    horloge: {
      name: 'Horloge',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 14, y + 12, W - 28, 64, '#5a3a22');
        g.fillStyle = '#f0e8d0';
        g.beginPath();
        g.arc(x + W / 2, y + 26, 9, 0, Math.PI * 2);
        g.fill();
        const a = (time / 60) * ((Math.PI * 2) / 60);
        g.strokeStyle = '#2a1a10';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + W / 2, y + 26);
        g.lineTo(x + W / 2 + Math.sin(a) * 7, y + 26 - Math.cos(a) * 7);
        g.moveTo(x + W / 2, y + 26);
        g.lineTo(x + W / 2 + Math.sin(a / 12) * 4, y + 26 - Math.cos(a / 12) * 4);
        g.stroke();
        R(g, x + 17, y + 40, W - 34, 32, '#2a1a10');
        const swing = Math.sin(time * 0.08) * 5;
        R(g, x + W / 2 - 1 + swing * 0.4, y + 40, 2, 22, '#c9a24a');
        R(g, x + W / 2 - 4 + swing, y + 60, 8, 8, '#e0c060');
      }
    },
    etagere: {
      name: 'Étagère',
      cat: 'murs',
      layer: 'wall',
      w: 2,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 4, y + 52, W - 8, 5, '#7a5230');
        R(g, x + 10, y + 57, 4, 8, '#5a3a22');
        R(g, x + W - 14, y + 57, 4, 8, '#5a3a22');
        R(g, x + 10, y + 38, 10, 14, '#c8784a');
        R(g, x + 12, y + 30, 6, 8, '#4f8a42');
        for (let k = 0; k < 5; k++) R(g, x + 30 + k * 6, y + 36 + (k % 2) * 3, 5, 16 - (k % 2) * 3, ['#a8442a', '#3e5a9a', '#4f8a42', '#c9a24a', '#7a4a8a'][k]);
        R(g, x + W - 26, y + 42, 12, 10, '#e8e0d0');
        R(g, x + W - 24, y + 40, 8, 3, '#d8d0c0');
      }
    },
    trophee: {
      name: 'Trophée de chasse',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 12, y + 30, W - 24, 26, '#7a5230');
        R(g, x + 15, y + 33, W - 30, 20, '#8a6440');
        R(g, x + W / 2 - 5, y + 34, 10, 14, '#a07850');
        R(g, x + W / 2 - 2, y + 44, 4, 4, '#2a1a14');
        for (const s of [-1, 1]) {
          R(g, x + W / 2 + s * 6 - (s < 0 ? 2 : 0), y + 18, 2, 16, '#e8dcc0');
          R(g, x + W / 2 + s * 11 - (s < 0 ? 2 : 0), y + 14, 2, 10, '#e8dcc0');
          R(g, x + W / 2 + s * 6 - (s < 0 ? 5 : 0), y + 22, 7, 2, '#e8dcc0');
        }
      }
    },
    miroir: {
      name: 'Miroir',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        g.fillStyle = '#c9a24a';
        g.beginPath();
        g.ellipse(x + W / 2, y + 42, 14, 22, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#b8d0e0';
        g.beginPath();
        g.ellipse(x + W / 2, y + 42, 11, 19, 0, 0, Math.PI * 2);
        g.fill();
        R(g, x + W / 2 - 6, y + 30, 3, 14, '#ffffffaa');
      }
    },
    rideaux: {
      name: 'Rideaux rouges',
      cat: 'murs',
      layer: 'curtain',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x - 4, y + 8, W + 8, 3, '#c9a24a');
        for (const s of [0, 1]) {
          const cx = s ? x + W - 10 : x - 4;
          R(g, cx, y + 10, 14, 68, '#a8343a');
          R(g, cx + (s ? 0 : 10), y + 10, 4, 68, '#7a2028');
          R(g, cx + 4, y + 40, 6, 4, '#c9a24a');
        }
      }
    },
    rideaux_bleus: {
      name: 'Rideaux bleus',
      cat: 'murs',
      layer: 'curtain',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x - 4, y + 8, W + 8, 3, '#8a8a94');
        for (const s of [0, 1]) {
          const cx = s ? x + W - 10 : x - 4;
          R(g, cx, y + 10, 14, 68, '#3e5a9a');
          R(g, cx + (s ? 0 : 10), y + 10, 4, 68, '#2a3e6a');
          R(g, cx + 4, y + 40, 6, 4, '#d8e0f0');
        }
      }
    },
    comptoir: {
      name: 'Comptoir',
      cat: 'meubles',
      layer: 'floor',
      w: 3,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 2, y + 12, W - 4, 34, '#6a4428');
        for (let k = 0; k < 3; k++) {
          R(g, x + 8 + k * 46, y + 20, 34, 20, '#7a5230');
          R(g, x + 8 + k * 46, y + 20, 34, 2, '#5a3a22');
        }
        R(g, x, y + 6, W, 9, '#a87a48');
        R(g, x, y + 6, W, 2, '#c8945a');
        // Balance, pièces d'or, fioles et rouleau de tissu posés dessus.
        R(g, x + 16, y - 10, 2, 16, '#8a7a5a');
        R(g, x + 8, y - 10, 18, 2, '#8a7a5a');
        R(g, x + 6, y - 6, 6, 3, '#c9a24a');
        R(g, x + 22, y - 5, 6, 3, '#c9a24a');
        for (let k = 0; k < 4; k++) R(g, x + 44 + k * 3, y + 2 - k * 2, 8, 3, k % 2 ? '#f0d070' : '#d8b048');
        for (const [dx, col] of [[78, '#c84a5a'], [88, '#4a7ad8'], [98, '#5ab04a']]) {
          R(g, x + dx, y - 4, 7, 10, col);
          R(g, x + dx + 2, y - 8, 3, 4, '#e8e0d0');
          R(g, x + dx + 1, y - 2, 2, 3, '#ffffff88');
        }
        R(g, x + 112, y - 2, 22, 8, '#8a5aa8');
        R(g, x + 112, y - 2, 22, 2, '#aa7ac8');
      }
    },
    presentoir: {
      name: 'Présentoir à potions',
      cat: 'meubles',
      layer: 'floor',
      w: 2,
      h: 1,
      back: true,
      draw(g, x, y, W, H) {
        R(g, x + 3, y - 40, W - 6, H + 36, '#6a4428');
        const cols = ['#c84a5a', '#4a7ad8', '#5ab04a', '#d8a83a', '#9a5ad0'];
        for (let row = 0; row < 3; row++) {
          const ry = y - 34 + row * 24;
          R(g, x + 6, ry, W - 12, 20, '#3a2414');
          for (let k = 0; k < 7; k++) {
            const col = cols[(k + row * 2) % cols.length],
              bx = x + 9 + k * 12;
            R(g, bx, ry + 8, 8, 12, col);
            R(g, bx + 2, ry + 4, 4, 4, '#e8e0d0');
            R(g, bx + 1, ry + 10, 2, 4, '#ffffff77');
          }
          R(g, x + 4, ry + 20, W - 8, 3, '#8a5a34');
        }
      }
    },
    caisse: {
      name: 'Caisse de marchandises',
      cat: 'meubles',
      layer: 'floor',
      w: 1,
      h: 1,
      turn: true,
      draw(g, x, y, W, H) {
        R(g, x + 6, y + 12, W - 12, 32, '#a07444');
        R(g, x + 6, y + 12, W - 12, 3, '#c8945a');
        R(g, x + 6, y + 26, W - 12, 3, '#7a5230');
        R(g, x + 6, y + 12, 3, 32, '#7a5230');
        R(g, x + W - 9, y + 12, 3, 32, '#7a5230');
        R(g, x + 12, y + 4, 10, 10, '#d84a3a');
        R(g, x + 22, y + 6, 9, 8, '#e8c040');
        R(g, x + 15, y + 3, 2, 3, '#4a8a3a');
      }
    },
    marmite: {
      name: 'Grande marmite',
      cat: 'cuisine',
      layer: 'floor',
      w: 1,
      h: 1,
      fire: true,
      draw(g, x, y, W, H) {
        R(g, x + 8, y + 2, 3, 40, '#3a3a40');
        R(g, x + W - 11, y + 2, 3, 40, '#3a3a40');
        R(g, x + 8, y + 2, W - 16, 3, '#3a3a40');
        fire(g, x + 14, y + 34, W - 28, 10);
        R(g, x + 10, y + 14, W - 20, 22, '#2a2a30');
        R(g, x + 8, y + 12, W - 16, 5, '#4a4a52');
        R(g, x + 12, y + 13, W - 24, 3, '#c8783a');
        // Bouillon qui fait des bulles et de la vapeur.
        const b = Math.floor(time / 9) % 3;
        R(g, x + 15 + b * 5, y + 13, 3, 2, '#f0a860');
        const s = (time * 0.35) % 24;
        g.globalAlpha = 0.5 * (1 - s / 24);
        R(g, x + 18, y + 6 - s, 4, 4, '#ffffff');
        R(g, x + 26, y + 2 - ((s + 10) % 24), 3, 3, '#ffffff');
        g.globalAlpha = 1;
      }
    },
    sacs: {
      name: 'Sacs de grain',
      cat: 'cuisine',
      layer: 'floor',
      w: 1,
      h: 1,
      draw(g, x, y, W, H) {
        for (const [dx, dy] of [[4, 18], [20, 16], [12, 6]]) {
          R(g, x + dx, y + dy + 4, 22, 22, '#c8b088');
          R(g, x + dx + 2, y + dy, 18, 6, '#b09870');
          R(g, x + dx + 8, y + dy - 3, 6, 4, '#8a7050');
          R(g, x + dx + 4, y + dy + 10, 14, 2, '#a89068');
        }
      }
    },
    casseroles: {
      name: 'Casseroles suspendues',
      cat: 'murs',
      layer: 'wall',
      w: 2,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 6, y + 18, W - 12, 4, '#5a3a22');
        for (const [dx, r, col] of [[14, 9, '#b8783a'], [38, 11, '#a0a0a8'], [64, 8, '#c8884a']]) {
          R(g, x + dx, y + 22, 2, 10, '#3a3a40');
          R(g, x + dx - r + 1, y + 32, r * 2, r * 2 - 4, col);
          R(g, x + dx - r + 3, y + 34, 4, r - 2, '#ffffff44');
        }
        R(g, x + 26, y + 22, 2, 26, '#8a6a4a');
        R(g, x + 23, y + 46, 8, 5, '#8a6a4a');
        R(g, x + 52, y + 22, 2, 22, '#8a6a4a');
        R(g, x + 50, y + 42, 6, 8, '#8a6a4a');
      }
    },
    herbes: {
      name: 'Herbes et jambons',
      cat: 'murs',
      layer: 'wall',
      w: 1,
      h: 2,
      draw(g, x, y, W, H) {
        R(g, x + 4, y + 16, W - 8, 3, '#5a3a22');
        R(g, x + 10, y + 19, 2, 8, '#c8b088');
        R(g, x + 6, y + 27, 10, 18, '#a8483a');
        R(g, x + 8, y + 29, 4, 12, '#c8685a');
        R(g, x + 22, y + 19, 2, 6, '#c8b088');
        for (let k = 0; k < 4; k++) R(g, x + 18 + k * 3, y + 25, 3, 20 - k * 2, k % 2 ? '#5a8a3a' : '#6aa04a');
        R(g, x + 34, y + 19, 2, 6, '#c8b088');
        for (let k = 0; k < 3; k++) R(g, x + 31, y + 25 + k * 7, 8, 7, '#f0ecd8');
      }
    },
  };
  const CATS = [
    ['meubles', '🛏️ Meubles'],
    ['cuisine', '🍳 Cuisine'],
    ['deco', '🪴 Déco'],
    ['murs', '🖼️ Murs'],
    ['tapis', '🟥 Tapis']
  ];
  const onWall = c => c.layer === 'wall' || c.layer === 'curtain';
  // Orientation : les meubles « turn » tournent d'un quart de tour (4 positions, la place au sol pivote) ;
  // les autres se retournent en miroir (2 positions).
  const turns = c => (c.turn ? 4 : 2);
  const dims = (c, r = 0) => (c.turn === true && r % 2 ? { w: c.h, h: c.w } : { w: c.w, h: c.h });

  // ---------------------------------------------------------------- Pièces intérieures
  // Chaque pièce (CANAAN_ROOMS, game-core) : mur du fond sur 2 rangées, sol de 1 à w-2 en x et de 2 à h-2 en y,
  // murs latéraux, mur du bas avec la porte au milieu.
  const geo = room => ({ floor: { x0: 1, x1: room.w - 2, y0: 2, y1: room.h - 2 }, door: { x: Math.floor(room.w / 2), y: room.h - 2 } });
  const ROOM = Object.fromEntries(CANAAN_ROOMS.map(r => [r.id, r]));
  const HOME = ROOM.maison;
  // Pièces de l'île seulement : en donjon, les mêmes coordonnées désignent la carte de l'instance.
  const roomAt = (x, y) => {
    if (game.world.instance) return null;
    for (const r of CANAAN_ROOMS) {
      const lx = Math.floor(x / TS) - r.x,
        ly = Math.floor(y / TS) - r.y;
      if (lx >= 0 && ly >= 0 && lx < r.w && ly < r.h) return r;
    }
    return null;
  };
  const inside = (x, y) => !!roomAt(x, y);
  const inHome = (x, y) => roomAt(x, y) === HOME;
  const px = (room, lx) => (room.x + lx) * TS,
    py = (room, ly) => (room.y + ly) * TS;
  // Ambiance de chaque intérieur, peinte avec les pinceaux des donjons (CANAAN_TILE_KIT) : sol (planches, dalles,
  // rondins, pierres plates), mur du fond (papier peint, pierre blanchie, rondins, terre crue), lambris, arêtes.
  const DESERT = new Set(['oasis', 'dunes']);
  const WOOD_EDGE = { top: '#3a2416', dark: '#24160c', light: '#7a5634' };
  const INTERIOR = Object.fromEntries(
    Object.entries({
      home: { floor: { style: 'planks', a: '#8a5a34', b: '#5e3c22', c: '#aa7a48' }, wall: { style: 'paper', face: '#dcc89e', dark: '#b8a276', light: '#efe2c0', top: '#4a2e1a' }, wains: ['#7a5230', '#553620', '#9a6c42'], edge: WOOD_EDGE },
      shop: { floor: { style: 'planks', a: '#a07444', b: '#74502e', c: '#c0905c' }, wall: { style: 'paper', face: '#a8bc94', dark: '#879c74', light: '#c4d4b0', top: '#3e2a18' }, wains: ['#6a4428', '#4a2e1a', '#8a5e38'], edge: WOOD_EDGE },
      kitchen: { floor: { style: 'flagstone', a: '#b8b0a0', b: '#8e8678', c: '#d4ccbc' }, wall: { style: 'brick', face: '#e8e2d4', dark: '#b8b0a0', light: '#fbf8f0', top: '#5a5248' }, wains: ['#d8dee6', '#8a94a4', '#ffffff'], edge: { top: '#4a443c', dark: '#2a2620', light: '#8a8478' }, faience: true },
      aubepines: { floor: { style: 'planks', a: '#94603a', b: '#683e22', c: '#b47c4c' }, wall: { style: 'paper', face: '#e6c2b6', dark: '#c8a094', light: '#f6dcd2', top: '#4a2e1a' }, wains: ['#7a5230', '#553620', '#9a6c42'], edge: WOOD_EDGE },
      puits: { floor: { style: 'planks', a: '#7e5634', b: '#563820', c: '#9c7048' }, wall: { style: 'paper', face: '#b8c8e0', dark: '#94a6c2', light: '#d6e2f2', top: '#2e2438' }, wains: ['#5a4a6a', '#3e3048', '#7a6890'], edge: { top: '#2e2438', dark: '#1a1420', light: '#6a5a80' } },
      refuge: { floor: { style: 'logs', a: '#7a5636', b: '#523820', c: '#9a7248' }, wall: { style: 'logs', face: '#8a6440', dark: '#74522f', light: '#b08458', top: '#3a2414' }, wains: ['#5a3c24', '#3a2414', '#7a5634'], edge: WOOD_EDGE },
      // Refuges du marais (pilotis), de l'automne (bardeaux roux) et de la Forêt enchantée (pierre lilas).
      pilotis: { floor: { style: 'planks', a: '#6a6440', b: '#46422a', c: '#8a8458' }, wall: { style: 'logs', face: '#6a6a48', dark: '#545436', light: '#8a8a62', top: '#2e2e1c' }, wains: ['#4a4a30', '#30301e', '#6a6a48'], edge: { top: '#2e2e1c', dark: '#1a1a10', light: '#6a6a48' } },
      rousses: { floor: { style: 'planks', a: '#9a5a30', b: '#6a3a1c', c: '#ba7a48' }, wall: { style: 'paper', face: '#e8b878', dark: '#c89058', light: '#f8d4a0', top: '#5a2e18' }, wains: ['#8a4a24', '#5a2e14', '#aa6a3a'], edge: WOOD_EDGE },
      cristaux: { floor: { style: 'flagstone', a: '#b8a8d8', b: '#8a7aac', c: '#d8ccf0' }, wall: { style: 'brick', face: '#c8b8e8', dark: '#9a88c0', light: '#e8dcff', top: '#3a2a58' }, wains: ['#7a6aa8', '#4a3a78', '#a898d8'], edge: { top: '#3a2a58', dark: '#20163a', light: '#8a7ab8' } },
      adobe: { floor: { style: 'flagstone', a: '#dcb884', b: '#b8945e', c: '#f0d4a4' }, wall: { style: 'adobe', face: '#e8c890', dark: '#c8a46c', light: '#f8e4b8', top: '#8a5a34' }, wains: ['#c07a44', '#8a5230', '#e09a5a'], edge: { top: '#8a6440', dark: '#5a3c22', light: '#c8a070' } }
    }).map(([id, spec]) => [id, { id, ...spec }])
  );
  const interiorOf = room => (DESERT.has(room.id) ? INTERIOR.adobe : INTERIOR[room.id] || INTERIOR[room.kind] || INTERIOR.home);

  // Meubles fixes des bâtiments du jeu [objet, x, y, orientation] (coordonnées de la pièce), et habitants à l'intérieur
  // [rôle, x, y] ; le marchand Lira (progression-economy.js) se tient derrière le comptoir de l'échoppe.
  const CABIN = [['lit', 1, 2], ['coffre', 2, 2], ['cheminee', 4, 2], ['tonneau', 8, 2], ['sacs', 9, 2], ['trophee', 2, 0], ['fenetre', 7, 0], ['herbes', 9, 0], ['tapis', 3, 4], ['table', 3, 5], ['chaise', 2, 5, 3], ['chaise', 5, 5, 1], ['banc', 7, 6], ['lampe', 9, 5]];
  const ADOBE = [['lit', 1, 2], ['pot_fleurs', 2, 2], ['cuisiniere', 4, 2], ['marmite', 5, 2], ['tonneau', 8, 2], ['sacs', 9, 2], ['fenetre', 2, 0], ['herbes', 7, 0], ['cadre', 9, 0], ['tapis_rond', 3, 4], ['table_ronde', 4, 5], ['chaise', 3, 5, 3], ['chaise', 5, 5, 1], ['plante', 9, 7], ['lampe', 1, 6]];
  const FURNISH = {
    echoppe: [['presentoir', 1, 2], ['presentoir', 10, 2], ['etagere', 5, 0], ['fenetre', 3, 0], ['fenetre', 8, 0], ['horloge', 9, 0], ['comptoir', 5, 4], ['pot_fleurs', 4, 2], ['caisse', 8, 2], ['tonneau', 1, 6], ['sacs', 2, 7], ['caisse', 11, 6], ['coffre', 10, 7], ['tapis_long', 5, 6], ['lampe', 11, 4]],
    marmite: [['cheminee', 1, 2], ['cuisiniere', 4, 2], ['cuisiniere', 5, 2], ['marmite', 7, 2], ['tonneau', 10, 2], ['tonneau', 11, 2], ['sacs', 11, 3], ['casseroles', 4, 0], ['herbes', 7, 0], ['fenetre', 9, 0], ['herbes', 11, 0], ['table', 3, 5], ['chaise', 2, 5, 3], ['chaise', 5, 5, 1], ['table', 8, 5], ['chaise', 7, 5, 3], ['chaise', 10, 5, 1], ['pot_fleurs', 1, 7], ['lampe', 11, 7]],
    aubepines: [['lit', 1, 2], ['commode', 2, 2], ['bibliotheque', 6, 2], ['armoire', 9, 2], ['fenetre', 3, 0], ['rideaux', 3, 0], ['cadre', 5, 0], ['horloge', 8, 0], ['tapis_rond', 3, 4], ['table_ronde', 4, 5], ['chaise', 3, 5, 3], ['chaise', 5, 5, 1], ['plante', 1, 7], ['pot_fleurs', 9, 7], ['lampe', 9, 5]],
    puits: [['lit_double', 1, 2], ['commode', 3, 2], ['cuisiniere', 8, 2], ['tonneau', 9, 2], ['grande_fenetre', 4, 0], ['rideaux_bleus', 4, 0], ['rideaux_bleus', 5, 0], ['tableau', 6, 0], ['tapis', 5, 4], ['table', 5, 5], ['chaise', 4, 5, 3], ['chaise', 7, 5, 1], ['coffre', 1, 6], ['plante', 9, 7], ['aquarium', 1, 7]],
    chene: CABIN,
    clairieres: CABIN,
    oasis: ADOBE,
    dunes: ADOBE,
    pilotis: [['lit', 1, 2], ['tonneau', 2, 2], ['cheminee', 4, 2], ['aquarium', 8, 2], ['sacs', 9, 2], ['fenetre', 2, 0], ['herbes', 7, 0], ['trophee', 9, 0], ['tapis', 3, 4], ['table', 3, 5], ['chaise', 2, 5, 3], ['chaise', 5, 5, 1], ['banc', 7, 6], ['lampe', 9, 5]],
    rousses: [['lit', 1, 2], ['commode', 2, 2], ['cheminee', 4, 2], ['tonneau', 8, 2], ['sacs', 9, 2], ['fenetre', 7, 0], ['cadre', 2, 0], ['herbes', 9, 0], ['tapis_rond', 3, 4], ['table_ronde', 4, 5], ['chaise', 3, 5, 3], ['chaise', 5, 5, 1], ['plante', 9, 7], ['lampe', 1, 6]],
    cristaux: [['lit', 1, 2], ['bibliotheque', 3, 2], ['cuisiniere', 6, 2], ['marmite', 7, 2], ['armoire', 9, 2], ['fenetre', 5, 0], ['cadre', 2, 0], ['horloge', 8, 0], ['tapis', 3, 4], ['table', 3, 5], ['chaise', 2, 5, 3], ['chaise', 5, 5, 1], ['plante', 9, 7], ['lampe', 9, 5]]
  };
  const RESIDENTS = {
    echoppe: [['villageois', 2.5, 4.5]],
    marmite: [['cuisinier', 6, 3.7], ['villageois', 9, 6.6]],
    aubepines: [['ancien', 6.5, 4.6], ['enfant', 2.5, 6.4]],
    puits: [['villageois', 3.5, 4.6]],
    chene: [['villageois', 6.5, 4.6]],
    clairieres: [['villageois', 6.5, 4.6]],
    oasis: [['voyageur', 6.5, 4.6]],
    dunes: [['voyageur', 6.5, 4.6]],
    pilotis: [['pecheur', 6.5, 4.6]],
    rousses: [['villageois', 6.5, 4.6]],
    cristaux: [['ermite', 6.5, 4.6]]
  };

  // ---------------------------------------------------------------- Meubles : règles (vérifiées par l'hôte)
  // La maison du joueur se décore ; les autres pièces gardent leurs meubles.
  let items = [],
    version = 0;
  const FIXED = {};
  const itemsOf = room => (!room ? [] : room === HOME ? items : FIXED[room.id] || []);
  const cover = (it, lx, ly) => {
    const c = CATALOG[it.k],
      d = dims(c, it.r),
      y0 = onWall(c) ? 0 : it.y;
    return lx >= it.x && lx < it.x + d.w && ly >= y0 && ly < y0 + d.h;
  };
  function valid(k, x, y, list = items, r = 0, room = HOME, limit = MAX_ITEMS) {
    const c = CATALOG[k];
    if (!c || !Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(r) || r < 0 || r >= turns(c)) return false;
    const { floor: F, door: D } = geo(room),
      d = dims(c, r),
      wall = onWall(c);
    if (wall) y = 0;
    if (x < F.x0 || x + d.w - 1 > F.x1) return false;
    if (!wall) {
      if (y < F.y0 || y + d.h - 1 > F.y1) return false;
      if (c.back && y !== F.y0) return false;
      // Le passage devant la porte reste libre.
      if (c.layer === 'floor' && x <= D.x && x + d.w > D.x && y <= D.y && y + d.h > D.y) return false;
    }
    if (list.length >= limit) return false;
    return !list.some(it => {
      const o = CATALOG[it.k];
      if (o.layer !== c.layer) return false;
      const od = dims(o, it.r),
        oy = onWall(o) ? 0 : it.y;
      return x < it.x + od.w && it.x < x + d.w && y < oy + od.h && oy < y + d.h;
    });
  }
  for (const [id, list] of Object.entries(FURNISH)) {
    const out = [];
    for (const [k, x, y, r = 0] of list) if (valid(k, x, y, out, r, ROOM[id], 999)) out.push({ k, x, y: onWall(CATALOG[k]) ? 0 : y, r });
    FIXED[id] = out;
  }
  // Passage bloqué : meubles des pièces, et dehors les objets du camp (feu, souches, banc, torches).
  function blocked(wx, wy) {
    const room = roomAt(wx, wy);
    if (!room) return canaanCampBlocked(wx, wy);
    const lx = Math.floor(wx / TS) - room.x,
      ly = Math.floor(wy / TS) - room.y;
    return itemsOf(room).some(it => CATALOG[it.k].layer === 'floor' && cover(it, lx, ly));
  }
  canaanHouseBlocked = blocked;
  // Le meuble visible le plus haut sur une case (rideau, mur, sol, tapis).
  const ORDER = ['curtain', 'wall', 'floor', 'rug'];
  function topAt(lx, ly, list = items) {
    let best = null;
    for (const it of list) if (cover(it, lx, ly) && (!best || ORDER.indexOf(CATALOG[it.k].layer) < ORDER.indexOf(CATALOG[best.k].layer))) best = it;
    return best;
  }
  function changed() {
    version++;
    saveGame();
  }
  function place(hero, k, x, y, r = 0) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const c = CATALOG[k];
    if (!c) return false;
    // Décoration de quête : seulement pour un héros qui l'a gagnée.
    if (c.quest && !CANAAN_QUESTS.hasDeco(hero, k)) {
      if (hero === game.hero) toast('🔒 Récompense de quête : termine « ' + questById(c.quest).title + ' ».');
      return false;
    }
    if (onWall(c)) y = 0;
    if (!valid(k, x, y, items, r)) return false;
    items.push({ k, x, y, r });
    changed();
    return true;
  }
  function remove(hero, x, y) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const it = topAt(x, y);
    if (!it) return false;
    items.splice(items.indexOf(it), 1);
    changed();
    return it;
  }
  // Tourner un meuble posé : quart de tour suivant (ou miroir), s'il a encore la place.
  function rotate(hero, x, y) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const it = topAt(x, y);
    if (!it) return false;
    const c = CATALOG[it.k],
      others = items.filter(o => o !== it);
    for (let step = 1; step < turns(c); step++) {
      const r = ((it.r || 0) + step) % turns(c);
      if (valid(it.k, it.x, it.y, others, r)) {
        it.r = r;
        changed();
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- Bâtiments sur l'île
  // Camp de l'Aurore : échoppe, cuisine et deux demeures autour du feu (décalages en cases depuis le camp) ;
  // maison du joueur à l'ouest du camp, loin des portails ; chaque refuge devient une cabane où l'on entre.
  const VILLAGE = [
    { room: 'marmite', style: 'auberge', w: 5, h: 3, dx: -2, dy: -11, sign: 'bol' },
    { room: 'echoppe', style: 'echoppe', w: 5, h: 3, dx: 5, dy: -9, sign: 'or' },
    { room: 'aubepines', style: 'demeure', w: 4, h: 3, dx: -12, dy: -7 },
    { room: 'puits', style: 'demeure_bleue', w: 4, h: 3, dx: -12, dy: 2 }
  ];
  const REFUGES = {
    'Refuge du Vieux Chêne': 'chene',
    'Refuge des Clairières': 'clairieres',
    'Refuge de l’Oasis': 'oasis',
    'Camp des Dunes': 'dunes',
    'Refuge des Pilotis': 'pilotis',
    'Refuge des Feuilles Rousses': 'rousses',
    'Refuge des Cristaux': 'cristaux'
  };
  let buildings = [];
  const homeB = () => buildings.find(b => b.room === HOME);
  const groundOk = (x, y) => {
    const t = game.world.overworld[y]?.[x];
    return t !== undefined && !SOLID.includes(t) && t !== 15 && t !== 30;
  };
  // Emplacement de la maison : herbe des Plaines à l'ouest du camp, loin des portails, de l'Arène et des lieux.
  function findHome() {
    const tiles = game.world.overworld,
      ok = (x, y) => [1, 2, 10].includes(tiles[y]?.[x]),
      tx = CANAAN_CAMP.x - 24,
      ty = CANAAN_CAMP.y - 5;
    for (let r = 0; r < 40; r++)
      for (let k = 0; k < Math.max(1, r * 6); k++) {
        const a = (k / Math.max(1, r * 6)) * Math.PI * 2,
          fx = Math.round(tx + Math.cos(a) * r) - 2,
          fy = Math.round(ty + Math.sin(a) * r) - 1;
        let good = regionAt(fx + 2, fy + 1) === ZONES[0];
        for (let y = fy - 1; y <= fy + 5 && good; y++) for (let x = fx - 1; x <= fx + 4 && good; x++) good = ok(x, y);
        if (!good || Math.hypot(fx + 2 - CANAAN_CAMP.x, fy + 1 - CANAAN_CAMP.y) < CANAAN_CAMP.r + 6) continue;
        if (instances.some(d => Math.hypot(d.x - fx - 2, d.y - fy - 1) < 32)) continue;
        if (Math.hypot(CANAAN_ARENA_PORTAL.x - fx - 2, CANAAN_ARENA_PORTAL.y - fy - 1) < 16) continue;
        if (PIXEL_PLACES.some(p => Math.hypot(p.x - fx - 2, p.y - fy - 1) < 10)) continue;
        return { x: fx, y: fy };
      }
    return { x: CANAAN_CAMP.x - 26, y: CANAAN_CAMP.y - 6 };
  }
  // Cabane d'un refuge : juste au nord du lieu (sa porte donne sur lui), sinon à côté, sur la terre ferme.
  function findCabin(p) {
    for (const [dx, dy] of [[-2, -4], [-1, -4], [-3, -4], [-2, -5], [-2, -3], [-4, -2], [1, -2], [-2, 1]]) {
      const fx = p.x + dx,
        fy = p.y + dy;
      let good = groundOk(fx + 2, fy + 3) && groundOk(fx + 1, fy + 3);
      for (let y = fy; y < fy + 3 && good; y++) for (let x = fx; x < fx + 4 && good; x++) good = groundOk(x, y);
      if (good) return { x: fx, y: fy };
    }
    return { x: p.x - 2, y: p.y - 4 };
  }
  function stamp() {
    const tiles = game.world.overworld,
      deco = game.world.overdecor;
    for (const room of CANAAN_ROOMS) {
      const { floor: F } = geo(room);
      for (let ly = 0; ly < room.h; ly++)
        for (let lx = 0; lx < room.w; lx++) {
          const floor = lx >= F.x0 && lx <= F.x1 && ly >= F.y0 && ly <= F.y1;
          tiles[room.y + ly][room.x + lx] = floor ? FLOOR_TILE : WALL_TILE;
          deco[room.y + ly][room.x + lx] = null;
        }
    }
    buildings = [];
    const home = findHome();
    for (const v of VILLAGE) buildings.push({ room: ROOM[v.room], style: v.style, w: v.w, h: v.h, x: CANAAN_CAMP.x + v.dx, y: CANAAN_CAMP.y + v.dy, sign: v.sign, label: ROOM[v.room].name, village: true });
    buildings.push({ room: HOME, style: 'chaume', w: 4, h: 3, x: home.x, y: home.y, label: '🏠 Ta maison' });
    // Chaque refuge prend l'architecture de son biome.
    const BIOME_STYLE = ['chaume', 'foret', 'marais', 'automne', 'desert', 'enchantee'];
    for (const p of PIXEL_PLACES) {
      const id = REFUGES[p.name];
      if (!id) continue;
      const at = findCabin(p),
        zone = Math.max(0, ZONES.indexOf(regionAt(at.x + 2, at.y + 1)));
      buildings.push({ room: ROOM[id], style: BIOME_STYLE[zone], w: 4, h: 3, x: at.x, y: at.y, label: p.name, place: p });
    }
    // Emprise au sol (pleine) et décor dégagé autour.
    for (const b of buildings) {
      for (let y = b.y - 1; y <= b.y + b.h + 1; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) if (deco[y]) deco[y][x] = null;
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) tiles[y][x] = OUTSIDE_TILE;
    }
    // Puis un sentier de terre de chaque porte jusqu'au chemin le plus proche (ou au sentier d'un bâtiment déjà relié).
    for (const b of buildings) connect(b, tiles, deco);
  }
  // Sentier : recherche du plus court chemin sur la terre ferme (ni eau, ni roche, ni bâtiment), en partant vers le
  // bas depuis la porte ; chaque virage coûte un peu, pour des sentiers droits. Tracé de deux cases de large.
  function connect(b, tiles, deco) {
    const sx = Math.floor(b.x + b.w / 2 - 0.5),
      sy = b.y + b.h,
      RAD = 70,
      N = RAD * 2 + 1,
      ox = sx - RAD,
      oy = sy - RAD,
      land = (x, y) => {
        const t = tiles[y]?.[x];
        return t !== undefined && !SOLID.includes(t) && t !== 15 && t < 30;
      };
    if (!land(sx, sy)) return false;
    const DX = [0, 1, 0, -1],
      DY = [1, 0, -1, 0],
      cost = new Int32Array(N * N * 4).fill(1e9),
      prev = new Int32Array(N * N * 4).fill(-1),
      buckets = [];
    const push = (state, c) => {
      (buckets[c] ||= []).push(state);
    };
    const start = ((sy - oy) * N + (sx - ox)) * 4;
    cost[start] = 0;
    push(start, 0);
    let goal = -1;
    for (let c = 0; c < buckets.length && goal < 0; c++) {
      const list = buckets[c];
      if (!list) continue;
      for (let i = 0; i < list.length && goal < 0; i++) {
        const st = list[i];
        if (cost[st] !== c) continue;
        const cell = st >> 2,
          dir = st & 3,
          x = (cell % N) + ox,
          y = Math.floor(cell / N) + oy;
        // Un chemin existant (hors de la marche devant la porte) : arrivé.
        if (c > 0 && tiles[y][x] === 2 && !(y === sy && (x === sx || x === sx + 1))) {
          goal = st;
          break;
        }
        for (let d = 0; d < 4; d++) {
          if (d === (dir + 2) % 4) continue;
          const nx = x + DX[d],
            ny = y + DY[d];
          if (nx < ox || ny < oy || nx >= ox + N || ny >= oy + N || !land(nx, ny)) continue;
          const ns = (((ny - oy) * N + (nx - ox)) << 2) | d,
            nc = c + 2 + (d === dir ? 0 : 3);
          if (nc < cost[ns]) {
            cost[ns] = nc;
            prev[ns] = st;
            push(ns, nc);
          }
        }
      }
    }
    const paint = (x, y) => {
      for (const [ax, ay] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]])
        if (land(ax, ay)) {
          tiles[ay][ax] = 2;
          if (deco[ay]) deco[ay][ax] = null;
        }
    };
    paint(sx, sy);
    if (goal < 0) return false;
    for (let st = goal; st >= 0; st = prev[st]) {
      const cell = st >> 2;
      paint((cell % N) + ox, Math.floor(cell / N) + oy);
    }
    return true;
  }
  stamp();
  // Une île régénérée (même graine) retrouve ses bâtiments.
  window.canaanAfterWorld = stamp;
  // Points de passage : devant la porte d'un bâtiment, et juste devant la porte intérieure de sa pièce.
  const outsideDoor = (b = homeB()) => ({ x: (b.x + b.w / 2) * TS, y: (b.y + b.h) * TS + 10 });
  const insideDoor = (room = HOME) => {
    const D = geo(room).door;
    return { x: px(room, D.x) + TS / 2, y: py(room, D.y) + TS / 2 };
  };
  const nearestDoor = (x, y) => {
    let best = null,
      bd = 90;
    for (const b of buildings) {
      const d = outsideDoor(b),
        dist = Math.hypot(x - d.x, y - d.y);
      if (dist < bd) {
        bd = dist;
        best = b;
      }
    }
    return best;
  };
  // Porte : entrer depuis l'extérieur, ou sortir depuis l'intérieur (chacun pour soi).
  function door(hero) {
    if (!hero || hero.player.dead || game.world.instance) return false;
    const p = hero.player,
      room = roomAt(p.x, p.y);
    let to;
    if (room) {
      const d = insideDoor(room),
        b = buildings.find(b => b.room === room);
      if (!b || Math.hypot(p.x - d.x, p.y - d.y) > 90) return false;
      to = outsideDoor(b);
      to.y += 14;
    } else {
      const b = nearestDoor(p.x, p.y);
      if (!b) return false;
      to = insideDoor(b.room);
    }
    p.x = to.x;
    p.y = to.y;
    p.vx = p.vy = 0;
    const now = roomAt(p.x, p.y);
    if (hero === game.hero) {
      camX = now ? (now.x + now.w / 2) * TS - W / 2 : p.x - W / 2;
      camY = now ? (now.y + now.h / 2 + 0.6) * TS - H / 2 : p.y - H / 2;
      if (now === HOME) toast('🏠 Bienvenue chez toi ! Appuie sur H pour décorer.');
      else if (now) toast('🚪 ' + now.name);
      if (now !== HOME && editing) toggle();
    } else canaanLootNotice(hero, now === HOME ? '🏠 Tu entres dans la maison (H pour décorer).' : now ? '🚪 ' + now.name : '🚪 Tu sors.');
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'house-door') return door(hero);
    if (action.op === 'house-place') return place(hero, action.k, action.x, action.y, action.r || 0);
    if (action.op === 'house-remove') return !!remove(hero, action.x, action.y);
    if (action.op === 'house-rotate') return rotate(hero, action.x, action.y);
    return false;
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  function sanitize(raw) {
    const out = [];
    for (const it of Array.isArray(raw?.items) ? raw.items : []) {
      const r = Number.isInteger(it?.r) ? it.r : 0;
      if (it && Object.hasOwn(CATALOG, it.k) && valid(it.k, it.x, it.y, out, r)) out.push({ k: it.k, x: it.x, y: onWall(CATALOG[it.k]) ? 0 : it.y, r });
    }
    return out;
  }
  const layout = () => ({ items: items.map(it => ({ ...it })) });
  function load(raw) {
    items = sanitize(raw);
    version++;
  }
  // Maison envoyée aux invités : quand elle change, et toutes les 5 secondes pour un invité qui arrive.
  let sent = -1,
    sentAt = -1e9;
  function netView() {
    if (version === sent && time - sentAt < 300) return undefined;
    sent = version;
    sentAt = time;
    return { v: version, items: items.map(it => [it.k, it.x, it.y, it.r || 0]) };
  }
  function applyRemote(view) {
    if (!view || !Array.isArray(view.items)) return;
    items = sanitize({ items: view.items.map(a => (Array.isArray(a) ? { k: a[0], x: a[1], y: a[2], r: a[3] || 0 } : null)) });
  }
  const guest = () => game.mode === 'guest';
  // Touche E : porte d'un bâtiment ou porte intérieure. Renvoie vrai si E a servi.
  function interact() {
    if (game.world.instance) return false;
    const room = roomAt(P.x, P.y);
    if (room) {
      const d = insideDoor(room);
      if (Math.hypot(P.x - d.x, P.y - d.y) > 90) return false;
    } else if (!nearestDoor(P.x, P.y)) return false;
    if (guest()) CANAAN_NET.requestAction({ op: 'house-door' });
    else door(game.hero);
    return true;
  }
  // Cuisiner : près d'une cuisinière, d'une marmite ou d'une cheminée (dans n'importe quel bâtiment).
  function nearStove(x, y) {
    if (game.world.instance) return false;
    // Tréfonds : l'âtre de la taverne naine.
    if (game.world.layer === 'under') return CANAAN_UNDER.nearStove(x, y);
    const room = roomAt(x, y);
    return itemsOf(room).some(it => {
      const c = CATALOG[it.k];
      if (!c.fire) return false;
      const d = dims(c, it.r);
      return Math.hypot(px(room, it.x + d.w / 2) - x, py(room, it.y + d.h / 2) - y) < 1.9 * TS + (d.w - 1) * TS * 0.5;
    });
  }

  // ---------------------------------------------------------------- Dessin : intérieurs
  // Pièce où se trouve le joueur (recalculée une fois par image).
  let curAt = -1,
    cur = null;
  const current = () => {
    if (curAt !== time) {
      curAt = time;
      cur = game.world.instance ? null : roomAt(P.x, P.y);
    }
    return cur;
  };
  function drawTile(c, x, y, t) {
    const here = current();
    if (here && !(x >= here.x && y >= here.y && x < here.x + here.w && y < here.y + here.h)) {
      // Dans un bâtiment, le reste du monde est dans le noir.
      R(c, x * TS, y * TS, TS, TS, '#0b0806');
      return true;
    }
    if (t === OUTSIDE_TILE) {
      const ground = PIXEL_TERRAIN[regionAt(x, y).t] || PIXEL_TERRAIN[1];
      c.drawImage(ground, ((x * 7 + y * 13) & 3) * 48, 0, 48, 48, x * TS, y * TS, TS, TS);
      return true;
    }
    if (t !== FLOOR_TILE && t !== WALL_TILE) return false;
    const room = roomAt(x * TS + 1, y * TS + 1);
    if (!room) return false;
    const X = x * TS,
      Y = y * TS,
      lx = x - room.x,
      ly = y - room.y,
      v = (x * 7 + y * 13) & 3,
      I = interiorOf(room),
      { floor: F, door: D } = geo(room),
      onFloor = (ax, ay) => ax >= F.x0 && ax <= F.x1 && ay >= F.y0 && ay <= F.y1;
    if (t === FLOOR_TILE) {
      // Sol peint au pinceau des donjons ; ombre au pied du mur du fond et le long des murs latéraux.
      c.drawImage(floorTex(I, v), X, Y);
      if (ly === F.y0) c.drawImage(CANAAN_TILE_KIT.shadowTile(), X, Y);
      c.globalAlpha = 0.3;
      if (lx === F.x0) R(c, X, Y, 6, TS, '#000000');
      if (lx === F.x1) R(c, X + TS - 6, Y, 6, TS, '#000000');
      c.globalAlpha = 1;
      return true;
    }
    // Mur du fond (deux rangées) : face éclairée, couronnement, cimaise, lambris et plinthe.
    if (ly <= 1 && lx >= F.x0 && lx <= F.x1) {
      c.drawImage(wallTex(I, v), 0, ly * TS, 48, 48, X, Y, TS, TS);
      return true;
    }
    // Autres murs : sommet sombre comme dans les donjons, arête claire du côté du sol.
    c.drawImage(edgeTex(I, v), X, Y);
    const E = I.edge.light;
    if (onFloor(lx + 1, ly) || (ly <= 1 && lx + 1 === F.x0)) R(c, X + TS - 4, Y, 4, TS, E);
    if (onFloor(lx - 1, ly) || (ly <= 1 && lx - 1 === F.x1)) R(c, X, Y, 4, TS, E);
    if (onFloor(lx, ly - 1)) R(c, X, Y, TS, 4, E);
    if (ly === room.h - 1 && lx === D.x) {
      // Porte de sortie : chambranle en trois tons, linteau, battant en planches ferrées.
      R(c, X + 3, Y - 12, 42, 60, OUT);
      R(c, X + 5, Y - 10, 38, 7, '#8a6440');
      R(c, X + 5, Y - 10, 38, 2, '#b08a5e');
      R(c, X + 5, Y - 3, 7, 51, '#7a5634');
      R(c, X + 5, Y - 3, 2, 51, '#a07a50');
      R(c, X + 36, Y - 3, 7, 51, '#4a3020');
      R(c, X + 12, Y - 3, 24, 51, '#8a5a34');
      for (const dx of [6, 12, 18]) R(c, X + 12 + dx, Y - 3, 1, 51, '#5e3c22');
      R(c, X + 12, Y - 3, 24, 2, '#a87444');
      R(c, X + 12, Y + 6, 24, 3, '#3a3a40');
      R(c, X + 12, Y + 30, 24, 3, '#3a3a40');
      R(c, X + 29, Y + 18, 4, 4, '#e0c060');
      R(c, X + 29, Y + 18, 2, 2, '#fff2a0');
    }
    return true;
  }
  // ---------------------------------------------------------------- Textures des intérieurs (pinceaux des donjons)
  const TEX = new Map();
  const tex = (key, make) => {
    let t = TEX.get(key);
    if (!t) TEX.set(key, (t = make()));
    return t;
  };
  function floorTex(I, v) {
    return tex(I.id + ':sol:' + v, () => {
      const K = CANAAN_TILE_KIT,
        cv = K.canvas(48, 48);
      K.paintFloor(cv.getContext('2d'), I.floor, v, I.floor.style);
      return cv;
    });
  }
  function edgeTex(I, v) {
    return tex(I.id + ':arete:' + v, () => {
      const K = CANAAN_TILE_KIT,
        cv = K.canvas(48, 48),
        g = cv.getContext('2d');
      K.rect(g, 0, 0, 48, 48, I.edge.top);
      K.specks(g, 12, [I.edge.dark, I.edge.light], 77 + v);
      return cv;
    });
  }
  // Mur du fond : 48 × 96 (deux rangées), peint comme une face de mur de donjon.
  function wallTex(I, v) {
    return tex(I.id + ':mur:' + v, () => {
      const K = CANAAN_TILE_KIT,
        cv = K.canvas(48, 96),
        g = cv.getContext('2d'),
        r = (x, y, w, h, col) => K.rect(g, x, y, w, h, col),
        w = I.wall,
        [wa, wd, wl] = I.wains,
        hsh = (a, b) => rnd(a + v * 13, b + 7);
      r(0, 0, 48, 96, w.face);
      if (w.style === 'paper') {
        // Papier peint rayé à petits motifs.
        for (let x = 0; x < 48; x += 12) {
          g.globalAlpha = 0.35;
          r(x + 4, 10, 4, 48, w.dark);
          g.globalAlpha = 1;
          for (let y = 16; y < 56; y += 12) {
            r(x + 10, y + ((x / 12) % 2) * 6, 2, 2, w.light);
            r(x + 9, y + 1 + ((x / 12) % 2) * 6, 4, 1, w.light);
          }
        }
        K.specks(g, 8, [w.dark, w.light], 60 + v, 2);
      } else if (w.style === 'brick') {
        // Pierre blanchie à la chaux.
        for (let row = 0; row < 6; row++) {
          const y = 10 + row * 8,
            off = row % 2 ? 0 : 8;
          r(0, y, 48, 1, w.dark);
          for (let x = -off; x < 48; x += 16) {
            r(x, y, 1, 8, w.dark);
            r(x + 1, y + 1, 14, 1, w.light);
            if (hsh(x, row) > 0.75) {
              g.globalAlpha = 0.25;
              r(x + 2, y + 2, 13, 5, w.dark);
              g.globalAlpha = 1;
            }
          }
        }
      } else if (w.style === 'logs') {
        // Rondins empilés jusqu'au sol, nœuds et calfeutrage.
        for (let k = 0; k < 8; k++) {
          const y = 10 + k * 11;
          r(0, y, 48, 11, k % 2 ? w.face : w.dark);
          r(0, y, 48, 2, w.light);
          r(0, y + 10, 48, 1, I.edge.dark);
          if (hsh(k, 3) > 0.5) r(6 + hsh(3, k) * 32, y + 4, 5, 3, I.edge.dark);
        }
      } else {
        // Terre crue lissée, fissures, frise peinte.
        K.specks(g, 14, [w.dark, w.light], 40 + v, 2);
        for (let k = 0; k < 3; k++) {
          const x = 4 + hsh(k, 1) * 36,
            y = 14 + hsh(1, k) * 30;
          r(x, y, 5, 1, w.dark);
          r(x + 4, y + 1, 1, 4, w.dark);
        }
        r(0, 44, 48, 3, wd);
        for (let x = 0; x < 48; x += 8) {
          r(x + 2, 47, 4, 2, wl);
          r(x + 3, 49, 2, 2, wl);
        }
      }
      // Couronnement du mur.
      r(0, 0, 48, 10, w.top);
      r(0, 9, 48, 2, w.light);
      if (w.style !== 'logs') {
        // Cimaise, puis lambris à panneaux biseautés (ou carreaux de faïence en cuisine).
        r(0, 56, 48, 4, wd);
        r(0, 56, 48, 1, wl);
        r(0, 60, 48, 30, wa);
        if (I.faience)
          for (let ty = 0; ty < 3; ty++)
            for (let tx = 0; tx < 4; tx++) {
              const X = tx * 12,
                Y = 60 + ty * 10;
              r(X, Y, 12, 10, '#e8eef4');
              r(X, Y, 12, 1, '#ffffff');
              r(X + 11, Y, 1, 10, '#a8b4c4');
              r(X + 4, Y + 3, 4, 4, (tx + ty) % 2 ? '#3a64a8' : '#5a8ac8');
            }
        else {
          r(4, 64, 40, 22, wl);
          r(5, 65, 39, 21, wa);
          r(43, 64, 1, 22, wd);
          r(4, 85, 40, 1, wd);
          r(8, 68, 32, 1, wd);
        }
      }
      // Plinthe et pied du mur dans l'ombre.
      r(0, 88, 48, 8, wd);
      r(0, 88, 48, 1, wl);
      g.globalAlpha = 0.45;
      r(0, 91, 48, 5, '#000000');
      g.globalAlpha = 1;
      return cv;
    });
  }
  // ---------------------------------------------------------------- Meubles : rendus comme les objets des donjons
  // Chaque meuble est peint à part : lumière à gauche, ombre à droite, contour sombre et ombre au sol.
  // Les meubles animés (feu, vapeur, horloge, fenêtres, plantes…) sont repeints toutes les deux images.
  const ANIM = new Set(Object.keys(CATALOG).filter(k => /time|fire\(|view\(/.test(String(CATALOG[k].draw))));
  const SPRITES = new Map(),
    PADX = 24,
    PADT = 72,
    PADB = 16;
  function paintItem(g, cat, r, X, Y) {
    const d = dims(cat, r),
      W0 = cat.w * TS,
      H0 = cat.h * TS;
    if (cat.turn === 'self' || !r) cat.draw(g, X, Y, W0, H0, r);
    else if (cat.turn) {
      // Quart de tour autour du centre de sa place au sol.
      g.save();
      g.translate(X + (d.w * TS) / 2, Y + (d.h * TS) / 2);
      g.rotate((r * Math.PI) / 2);
      cat.draw(g, -W0 / 2, -H0 / 2, W0, H0, 0);
      g.restore();
    } else {
      // Miroir gauche-droite.
      g.save();
      g.translate(X * 2 + W0, 0);
      g.scale(-1, 1);
      cat.draw(g, X, Y, W0, H0, 0);
      g.restore();
    }
  }
  function itemSprite(it) {
    const cat = CATALOG[it.k],
      r = it.r || 0,
      d = dims(cat, r),
      w = d.w * TS,
      h = d.h * TS,
      frame = ANIM.has(it.k) ? Math.floor(time / 2) : 0,
      key = it.k + ':' + r;
    let e = SPRITES.get(key);
    if (e && e.frame === frame) return e;
    const W2 = w + PADX * 2,
      H2 = h + PADT + PADB;
    if (!e) {
      e = { a: CANAAN_TILE_KIT.canvas(W2, H2), b: CANAAN_TILE_KIT.canvas(W2, H2), frame: -1 };
      SPRITES.set(key, e);
    }
    const a = e.a.getContext('2d'),
      b = e.b.getContext('2d');
    a.clearRect(0, 0, W2, H2);
    a.imageSmoothingEnabled = false;
    paintItem(a, cat, r, PADX, PADT);
    if (cat.layer !== 'rug') {
      // Volume : reflet à gauche, ombre à droite, seulement sur les pixels de l'objet.
      a.globalCompositeOperation = 'source-atop';
      a.globalAlpha = 0.14;
      a.fillStyle = '#ffffff';
      a.fillRect(0, 0, PADX + Math.round(w * 0.2), H2);
      a.globalAlpha = 0.22;
      a.fillStyle = '#000000';
      a.fillRect(PADX + Math.round(w * 0.72), 0, W2, H2);
      a.globalAlpha = 1;
      a.globalCompositeOperation = 'source-over';
      // Silhouette sombre pour le contour.
      b.clearRect(0, 0, W2, H2);
      b.drawImage(e.a, 0, 0);
      b.globalCompositeOperation = 'source-in';
      b.fillStyle = OUT;
      b.fillRect(0, 0, W2, H2);
      b.globalCompositeOperation = 'source-over';
    }
    e.frame = frame;
    return e;
  }
  function drawItem(c, room, it, alpha = 1) {
    const cat = CATALOG[it.k],
      wall = onWall(cat),
      r = it.r || 0,
      d = dims(cat, r),
      X = px(room, it.x),
      Y = py(room, wall ? 0 : it.y),
      w = d.w * TS,
      h = d.h * TS;
    let e = null;
    try {
      e = itemSprite(it);
    } catch {
      e = null;
    }
    c.globalAlpha = alpha;
    if (!e) paintItem(c, cat, r, X, Y);
    else {
      if (cat.layer === 'floor') {
        // Ombre au sol, comme sous les objets des donjons.
        c.globalAlpha = 0.3 * alpha;
        c.fillStyle = '#0a0806';
        c.beginPath();
        c.ellipse(X + w / 2, Y + h - 5, w / 2 - 3, 6, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = alpha;
      }
      if (cat.layer !== 'rug') for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) c.drawImage(e.b, X - PADX + dx, Y - PADT + dy);
      c.drawImage(e.a, X - PADX, Y - PADT);
    }
    c.globalAlpha = 1;
    if (alpha === 1 && (cat.light || cat.fire)) canaanLight(X + w / 2, Y + (wall ? 50 : 10), cat.fire ? 130 : cat.light === '#e8f4ff' ? 110 : 120, cat.fire ? '#ffa850' : cat.light);
  }
  function drawRoom(c) {
    const room = current();
    if (!room) return;
    const list = itemsOf(room),
      { floor: F } = geo(room);
    c.save();
    c.imageSmoothingEnabled = false;
    for (const layer of ['rug', 'wall', 'curtain', 'floor']) for (const it of list) if (CATALOG[it.k].layer === layer) drawItem(c, room, it);
    // Mode décoration : grille, aperçu vert (possible) ou rouge (impossible), case visée en mode retrait.
    if (editing && room === HOME) {
      c.globalAlpha = 0.12;
      c.strokeStyle = '#ffffff';
      for (let lx = F.x0; lx <= F.x1 + 1; lx++) {
        c.beginPath();
        c.moveTo(px(room, lx), py(room, 0));
        c.lineTo(px(room, lx), py(room, F.y1 + 1));
        c.stroke();
      }
      for (let ly = F.y0; ly <= F.y1 + 1; ly++) {
        c.beginPath();
        c.moveTo(px(room, F.x0), py(room, ly));
        c.lineTo(px(room, F.x1 + 1), py(room, ly));
        c.stroke();
      }
      c.globalAlpha = 1;
      const at = aimed();
      if (ui.selected) {
        const cat = CATALOG[ui.selected],
          wall = onWall(cat),
          d = dims(cat, ui.rot),
          ok = valid(ui.selected, at.x, wall ? 0 : at.y, items, ui.rot);
        drawItem(c, room, { k: ui.selected, x: at.x, y: wall ? 0 : at.y, r: ui.rot }, 0.65);
        c.strokeStyle = ok ? '#73ffa8' : '#ff5a5a';
        c.lineWidth = 2;
        c.strokeRect(px(room, at.x) + 1, py(room, wall ? 0 : at.y) + 1, d.w * TS - 2, d.h * TS - 2);
      } else {
        const it = topAt(at.x, at.y);
        if (it) {
          const cat = CATALOG[it.k],
            d = dims(cat, it.r);
          c.strokeStyle = ui.tool === 'remove' ? '#ff5a5a' : '#ffd36d';
          c.lineWidth = 2;
          c.strokeRect(px(room, it.x) + 1, py(room, onWall(cat) ? 0 : it.y) + 1, d.w * TS - 2, d.h * TS - 2);
        }
      }
    }
    const d = insideDoor(room);
    if (Math.hypot(P.x - d.x, P.y - d.y) < 90) label(c, '[E] Sortir', d.x, d.y + 30, '#fff2cb');
    c.restore();
  }
  function label(c, text, x, y, col = '#f6e2b1') {
    c.font = 'bold 12px system-ui';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#101b20';
    c.fillStyle = col;
    c.strokeText(text, x, y);
    c.fillText(text, x, y);
  }

  // ---------------------------------------------------------------- Dessin : façades en pixel art
  // Même facture que l'île, les donjons et les raids : volumes en blocs de pixels, contour sombre, lumière venant du
  // haut à gauche (reflets à gauche, ombres à droite et sous le toit), textures tirées au hasard mais fixes.
  // Chaque style suit son biome : colombages et chaume des Plaines, rondins moussus de la Forêt ancienne, cabane sur
  // pilotis du marais, bardeaux roux de l'automne, terre crue à toit plat du désert, pierre lilas et cristaux de la
  // Forêt enchantée. Les bâtiments du camp ont chacun leur caractère (échoppe, auberge, demeures).
  const OUT = '#22160e';
  const LOOKS = {
    chaume: { wall: 'timber', face: ['#f2e6ca', '#e2d2b0', '#c9b690'], beam: ['#6e4628', '#4a2e1a'], roof: 'thatch', tones: ['#e6c062', '#d0a64a', '#b28a38', '#86662a'], ground: 'plaines', chimney: 'stone', flowers: '#e05a7a' },
    echoppe: { wall: 'timber', face: ['#f4e4c0', '#e4d0a6', '#c9b48a'], beam: ['#5e3c22', '#3c2614'], roof: 'tiles', tones: ['#de6c4e', '#c2543c', '#9e402e', '#70281e'], ground: 'plaines', awning: true, crates: true },
    auberge: { wall: 'stone', face: ['#cac4b4', '#b0aa9a', '#8e887a'], beam: ['#5e3c22', '#3c2614'], roof: 'slate', tones: ['#7a8aaa', '#627294', '#4c5a7c', '#343e5a'], ground: 'plaines', chimney: 'brick', barrels: true },
    demeure: { wall: 'timber', face: ['#f6ecd8', '#e6dac2', '#cdbea2'], beam: ['#7e4c2c', '#56321c'], roof: 'tiles', tones: ['#cc7a50', '#ae623e', '#8c4c30', '#64341e'], ground: 'plaines', chimney: 'brick', flowers: '#f0c040' },
    demeure_bleue: { wall: 'timber', face: ['#eee8f2', '#ddd5e4', '#c2b8cc'], beam: ['#5e4c6c', '#3e3048'], roof: 'slate', tones: ['#6496bc', '#4e7ea2', '#3c6686', '#2a4a66'], ground: 'plaines', chimney: 'stone', flowers: '#9a7ae0' },
    foret: { wall: 'logs', face: ['#946a42', '#7a5634', '#5c3e24'], beam: ['#4e3420', '#33210f'], roof: 'shingles', tones: ['#806040', '#6a4e32', '#543c26', '#38281a'], ground: 'foret', chimney: 'stone', moss: true, wood: true },
    marais: { wall: 'planks', face: ['#7a6446', '#64503a', '#4a3a28'], beam: ['#3e2e1e', '#2a1e12'], roof: 'reeds', tones: ['#b0a262', '#968850', '#7a6e40', '#585030'], ground: 'marais', stilts: true },
    automne: { wall: 'timber', face: ['#f0dcc0', '#dcc4a4', '#c0a684'], beam: ['#6a3e22', '#462614'], roof: 'shingles', tones: ['#d8803c', '#be662e', '#9e5024', '#723818'], ground: 'automne', chimney: 'stone', leaves: true },
    desert: { wall: 'adobe', face: ['#ecc690', '#d8ae76', '#ba905c'], beam: ['#7a4e2c', '#54321a'], roof: 'flat', tones: ['#f2d6a2', '#dcbc88', '#c2a06c', '#946e44'], ground: 'desert', awning: 'toile' },
    enchantee: { wall: 'stone', face: ['#bdb4d8', '#a198bc', '#81789c'], beam: ['#4a3a6a', '#2e2448'], roof: 'shingles', tones: ['#8a64c4', '#7250a8', '#5a3e8a', '#3e2a64'], ground: 'enchantee', chimney: 'stone', glow: true }
  };
  const visible = (x, y, m) => Math.abs(x - camX - W / 2) < W / 2 + m && Math.abs(y - camY - H / 2) < H / 2 + m;
  // Tirage fixe par position (textures qui ne scintillent pas).
  const rnd = (a, b) => {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const pick = (list, a, b) => list[Math.floor(rnd(a, b) * list.length)];
  function smoke(c, x, y) {
    for (let k = 0; k < 5; k++) {
      const s = (time * 0.4 + k * 20) % 100;
      c.globalAlpha = 0.5 * (1 - s / 100);
      const sz = 6 + Math.floor(s / 25) * 2;
      R(c, x + Math.sin((s + k * 30) * 0.06) * 7 + s * 0.25 - sz / 2, y - s * 0.9 - sz / 2, sz, sz, '#e4e4e4');
    }
    c.globalAlpha = 1;
  }
  // Façade : enduit et colombages, pierres taillées, rondins, planches ou terre crue.
  function drawWall(c, L, X, top, Wd, bot, seed) {
    const [f0, f1, f2] = L.face,
      [b0, b1] = L.beam,
      h = bot - top;
    R(c, X + 2, top - 2, Wd - 4, h + 4, OUT);
    R(c, X + 4, top, Wd - 8, h, f0);
    if (L.wall === 'timber') {
      // Enduit taché, poutres sombres, croix de Saint-André sur les côtés.
      for (let k = 0; k < 18; k++) R(c, X + 8 + rnd(seed, k) * (Wd - 20), top + 4 + rnd(k, seed) * (h - 12), 4, 2, f1);
      R(c, X + 4, top, Wd - 8, 5, b0);
      R(c, X + 4, top + 34, Wd - 8, 4, b0);
      R(c, X + 4, top + 34, Wd - 8, 1, f1);
      for (const fx of [4, Wd - 10]) R(c, X + fx, top, 6, h, b0);
      for (const s of [0, 1]) {
        const bx = s ? X + Wd - 26 : X + 10;
        for (let k = 0; k < 8; k++) {
          R(c, bx + k * 2, top + 6 + k * 3.5, 3, 4, b0);
          R(c, bx + 14 - k * 2, top + 6 + k * 3.5, 3, 4, b0);
        }
      }
    } else if (L.wall === 'stone') {
      // Pierres de taille irrégulières, joints sombres, quelques pierres claires.
      for (let row = 0; row * 12 < h; row++) {
        let x = X + 4 - (row % 2) * 10;
        while (x < X + Wd - 4) {
          const w = 14 + Math.floor(rnd(x, row + seed) * 12),
            x0 = Math.max(X + 4, x),
            x1 = Math.min(X + Wd - 4, x + w);
          R(c, x0, top + row * 12, x1 - x0 - 1, 11, pick([f0, f0, f1, f2], x, row * 7 + seed));
          R(c, x0, top + row * 12, x1 - x0 - 1, 1, '#ffffff22');
          x += w;
        }
      }
    } else if (L.wall === 'logs') {
      // Rondins empilés : dessus clair, nœuds, bouts ronds qui dépassent aux angles.
      for (let k = 0; top + k * 10 < bot; k++) {
        const y = top + k * 10;
        R(c, X + 4, y, Wd - 8, 10, k % 2 ? f0 : f1);
        R(c, X + 4, y + 1, Wd - 8, 2, '#b08458');
        R(c, X + 4, y + 9, Wd - 8, 1, b1);
        R(c, X + 14 + rnd(k, seed) * (Wd - 40), y + 4, 4, 3, f2);
        for (const ex of [X - 2, X + Wd - 6]) {
          R(c, ex - 1, y, 10, 10, OUT);
          R(c, ex, y + 1, 8, 8, '#c8a070');
          R(c, ex + 2, y + 3, 4, 4, '#a07a50');
        }
      }
    } else if (L.wall === 'planks') {
      // Planches verticales usées et sombres, traces d'humidité en bas.
      for (let x = X + 4, k = 0; x < X + Wd - 4; x += 12, k++) {
        R(c, x, top, Math.min(11, X + Wd - 4 - x), h, pick([f0, f1, f0], k, seed));
        R(c, x + 11, top, 1, h, b1);
        R(c, x + 2, top + 4 + rnd(k, seed) * 20, 2, 2, b1);
      }
      c.globalAlpha = 0.35;
      R(c, X + 4, bot - 16, Wd - 8, 16, '#3a4a2a');
      c.globalAlpha = 1;
    } else {
      // Terre crue lissée, fissures et coins arrondis.
      for (let k = 0; k < 10; k++) {
        const cx = X + 14 + rnd(k, seed) * (Wd - 30),
          cy = top + 10 + rnd(seed, k) * (h - 20);
        R(c, cx, cy, 6, 1, f2);
        R(c, cx + 5, cy + 1, 1, 4, f2);
      }
      R(c, X + 4, top, Wd - 8, 3, f1);
    }
    // Volume : reflet sur l'arête gauche, ombre sur la droite, ombre portée du toit en haut.
    c.globalAlpha = 0.18;
    R(c, X + 4, top, 3, h, '#ffffff');
    c.globalAlpha = 0.28;
    R(c, X + Wd - 14, top, 10, h, '#000000');
    R(c, X + 4, top, Wd - 8, 8, '#000000');
    c.globalAlpha = 1;
  }
  // Soubassement de pierres (ou pilotis du marais).
  function drawBase(c, L, X, Wd, bot, seed) {
    if (L.stilts) return;
    const stones = L.ground === 'desert' ? ['#b89a70', '#a2865e', '#c8aa80'] : L.ground === 'enchantee' ? ['#8a84a4', '#746e90', '#9e98b8'] : ['#8e8a84', '#76726c', '#a4a09a'];
    R(c, X + 2, bot - 10, Wd - 4, 12, OUT);
    for (let x = X + 4; x < X + Wd - 4; ) {
      const w = 12 + Math.floor(rnd(x, seed) * 10),
        x1 = Math.min(X + Wd - 4, x + w);
      R(c, x, bot - 9, x1 - x - 1, 9, pick(stones, x, seed + 3));
      R(c, x, bot - 9, x1 - x - 1, 2, '#ffffff33');
      x += w;
    }
  }
  function drawStilts(c, L, X, Wd, bot, lift, mid) {
    for (const px of [X + 6, X + Wd / 3, X + (Wd * 2) / 3 - 6, X + Wd - 14]) {
      R(c, px - 1, bot - 2, 10, lift + 4, OUT);
      R(c, px, bot - 2, 8, lift + 2, L.beam[0]);
      R(c, px, bot - 2, 2, lift + 2, '#7a6446');
    }
    R(c, X - 2, bot - 4, Wd + 4, 8, OUT);
    R(c, X, bot - 3, Wd, 6, L.face[1]);
    for (let x = X; x < X + Wd; x += 14) R(c, x, bot - 3, 1, 6, L.beam[1]);
    // Échelle jusqu'au ponton.
    R(c, mid - 15, bot, 30, lift + 2, OUT);
    for (let k = 0; k < 3; k++) R(c, mid - 13, bot + 2 + k * 5, 26, 3, L.face[0]);
    // Eau qui clapote au pied des pilotis.
    c.globalAlpha = 0.5;
    R(c, X - 6, bot + lift - 2, Wd + 12, 4, '#4a7a6a');
    R(c, X + ((time * 0.3) % Wd), bot + lift - 2, 10, 2, '#cfe8e0');
    c.globalAlpha = 1;
  }
  // Toit à quatre pans en escalier de pixels : pan avant texturé, croupes plus sombres sur les côtés, faîtage.
  function drawRoof(c, L, X, Wd, top, eave, seed) {
    const T = L.tones,
      rx = X - 12,
      rw = Wd + 24,
      H = eave - top,
      ridge = top + Math.round(H * 0.28),
      STEP = 6;
    if (L.roof === 'flat') return drawFlatRoof(c, L, X, Wd, top, eave, seed);
    const rows = [];
    for (let y = top; y < eave; y += STEP) {
      const t = (y - top) / H,
        inset = Math.round(((1 - t) * 34) / 2) * 2;
      rows.push({ y, x0: rx + inset, x1: rx + rw - inset, hip: Math.round(inset * 0.6 + 6), back: y < ridge });
    }
    for (const r of rows) R(c, r.x0 - 2, r.y - 2, r.x1 - r.x0 + 4, STEP + 4, OUT);
    rows.forEach((r, i) => {
      const w = r.x1 - r.x0;
      if (r.back) {
        R(c, r.x0, r.y, w, STEP, T[0]);
        R(c, r.x0, r.y + STEP - 1, w, 1, T[1]);
      } else {
        R(c, r.x0, r.y, w, STEP, T[1]);
        // Texture du pan avant.
        if (L.roof === 'thatch' || L.roof === 'reeds') {
          for (let x = r.x0 + (i % 2) * 2; x < r.x1 - 1; x += 4) R(c, x, r.y + (rnd(x, i) < 0.5 ? 1 : 0), 1, STEP - 1, rnd(i, x) < 0.5 ? T[2] : T[0]);
        } else {
          const tile = L.roof === 'tiles' ? 12 : L.roof === 'slate' ? 10 : 9;
          for (let x = r.x0 + (i % 2 ? tile / 2 : 0); x < r.x1; x += tile) {
            R(c, Math.max(r.x0, x), r.y, 1, STEP, T[2]);
            if (rnd(x, i + seed) < 0.22) R(c, Math.max(r.x0, x + 1), r.y, Math.min(tile - 1, r.x1 - x - 1), STEP - 1, rnd(i, x) < 0.5 ? T[0] : T[2]);
          }
          R(c, r.x0, r.y + STEP - 1, w, 1, T[2]);
          if (L.roof === 'tiles') R(c, r.x0, r.y, w, 1, T[0]);
        }
        // Croupes : les côtés du toit, à l'ombre à droite.
        R(c, r.x0, r.y, r.hip, STEP, T[2]);
        R(c, r.x1 - r.hip, r.y, r.hip, STEP, T[3]);
        R(c, r.x0 + r.hip, r.y, 1, STEP, T[3]);
        R(c, r.x1 - r.hip - 1, r.y, 1, STEP, T[3]);
      }
    });
    // Faîtage.
    const rr = rows.find(r => !r.back) || rows[0];
    R(c, rr.x0 + rr.hip - 2, ridge - 3, rr.x1 - rr.x0 - rr.hip * 2 + 4, 5, T[3]);
    R(c, rr.x0 + rr.hip - 2, ridge - 3, rr.x1 - rr.x0 - rr.hip * 2 + 4, 1, T[0]);
    // Avant-toit et frange (chaume, roseaux).
    R(c, rx, eave - 3, rw, 3, T[3]);
    if (L.roof === 'thatch' || L.roof === 'reeds')
      for (let x = rx; x < rx + rw; x += 4) R(c, x, eave - 2, 3, 3 + Math.floor(rnd(x, seed) * (L.roof === 'reeds' ? 7 : 4)), T[2]);
    // Mousse, feuilles mortes ou éclats de magie sur le toit.
    if (L.moss || L.leaves || L.glow)
      for (let k = 0; k < 14; k++) {
        const r = rows[Math.floor(rnd(k, seed) * rows.length)],
          x = r.x0 + 6 + rnd(seed, k) * (r.x1 - r.x0 - 16);
        if (L.moss) {
          R(c, x, r.y + 1, 8, 4, '#4e7434');
          R(c, x + 2, r.y, 4, 2, '#6e9a48');
        } else if (L.leaves) R(c, x, r.y + 2, 3, 3, pick(['#e8a040', '#c84a2a', '#f0c040'], k, seed));
        else {
          c.globalAlpha = 0.5 + Math.sin(time * 0.08 + k) * 0.4;
          R(c, x, r.y + 2, 3, 3, pick(['#9af0ff', '#ff9af0', '#ffffff'], k, seed));
          c.globalAlpha = 1;
        }
      }
  }
  // Toit plat du désert : terrasse bordée d'un parapet (tapis et jarres), tour carrée coiffée d'un dôme blanchi,
  // poutres (vigas) qui dépassent sous le parapet.
  function drawFlatRoof(c, L, X, Wd, top, eave, seed) {
    const T = L.tones,
      [f0, f1, f2] = L.face,
      y0 = top + 34;
    // Terrasse.
    R(c, X - 2, y0 - 2, Wd + 4, eave - y0 + 4, OUT);
    R(c, X, y0, Wd, eave - y0, T[1]);
    R(c, X, y0, Wd, 2, T[0]);
    R(c, X + 7, y0 + 7, Wd - 14, eave - y0 - 16, T[2]);
    R(c, X + 7, y0 + 7, Wd - 14, 2, T[3]);
    for (let k = 0; k < 5; k++) R(c, X + 76 + rnd(k, seed) * (Wd - 100), y0 + 12 + rnd(seed, k) * 12, 6, 1, T[3]);
    // Tapis étendu et jarres.
    const tx = X + Wd - 96;
    R(c, tx - 1, y0 + 11, 46, 18, OUT);
    R(c, tx, y0 + 12, 44, 16, '#a8343a');
    R(c, tx + 3, y0 + 15, 38, 10, '#c8584a');
    R(c, tx + 3, y0 + 15, 38, 1, '#e0c060');
    R(c, tx + 3, y0 + 24, 38, 1, '#e0c060');
    for (let k = 0; k < 4; k++) R(c, tx + 8 + k * 9, y0 + 18, 4, 4, '#3a4a8a');
    for (const [jx, jh] of [[X + Wd - 40, 16], [X + Wd - 24, 12]]) {
      R(c, jx - 1, eave - 10 - jh, 12, jh + 2, OUT);
      R(c, jx, eave - 9 - jh, 10, jh, '#c8783a');
      R(c, jx + 2, eave - 12 - jh, 6, 4, '#a8602c');
      R(c, jx + 2, eave - 7 - jh, 2, jh - 6, '#e09a5a');
    }
    // Parapet avant et poutres.
    R(c, X - 2, eave - 9, Wd + 4, 11, OUT);
    R(c, X, eave - 8, Wd, 8, f1);
    R(c, X, eave - 8, Wd, 2, f0);
    for (let x = X + 14; x < X + Wd - 10; x += 26) {
      R(c, x - 1, eave + 2, 8, 6, OUT);
      R(c, x, eave + 3, 6, 4, L.beam[0]);
    }
    // Tour carrée à gauche, plus haute que la terrasse.
    const tx0 = X + 10,
      tw = 58,
      ty0 = top - 12;
    R(c, tx0 - 2, ty0 - 2, tw + 4, eave - ty0 + 2, OUT);
    R(c, tx0, ty0, tw, eave - ty0 - 2, f0);
    R(c, tx0, ty0, 3, eave - ty0 - 2, '#fff2d8');
    R(c, tx0 + tw - 9, ty0, 9, eave - ty0 - 2, f2);
    for (let k = 0; k < 6; k++) R(c, tx0 + 8 + rnd(k, seed + 9) * 36, ty0 + 10 + rnd(seed + 9, k) * 30, 5, 1, f2);
    // Créneaux de la tour.
    for (let k = 0; k < 4; k++) {
      R(c, tx0 + k * 16 - 1, ty0 - 9, 11, 10, OUT);
      R(c, tx0 + k * 16, ty0 - 8, 9, 8, f0);
      R(c, tx0 + k * 16, ty0 - 8, 9, 2, '#fff2d8');
    }
    // Fenêtre en arc éclairée.
    const wx = tx0 + tw / 2 - 6;
    R(c, wx - 2, ty0 + 14, 16, 22, OUT);
    R(c, wx, ty0 + 16, 12, 18, '#ffd890');
    R(c, wx, ty0 + 14, 12, 3, OUT);
    R(c, wx + 2, ty0 + 13, 8, 2, OUT);
    R(c, wx + 5, ty0 + 16, 2, 18, L.beam[0]);
    canaanLight(wx + 6, ty0 + 24, 60, '#ffd890');
    // Ombre de la tour sur la terrasse.
    c.globalAlpha = 0.25;
    R(c, tx0 + tw, y0 + 2, 18, eave - y0 - 10, '#000000');
    c.globalAlpha = 1;
    // Dôme blanchi à la chaux, pointe dorée.
    const dx = tx0 + tw / 2,
      dy = ty0 - 8,
      HW = [6, 11, 15, 18, 20, 22, 23];
    HW.forEach((hw, k) => R(c, dx - hw - 2, dy - 28 + k * 4 - 2, hw * 2 + 4, 8, OUT));
    HW.forEach((hw, k) => {
      R(c, dx - hw, dy - 28 + k * 4, hw * 2, 4, '#f6eedc');
      R(c, dx - hw, dy - 28 + k * 4, Math.max(3, hw / 2), 4, '#ffffff');
      R(c, dx + hw - Math.max(4, hw / 2.5), dy - 28 + k * 4, Math.max(4, hw / 2.5), 4, '#d8c8a8');
    });
    R(c, dx - 2, dy - 38, 4, 10, '#c9a24a');
    R(c, dx - 3, dy - 42, 6, 5, '#f0d070');
  }
  function windowAt(c, L, x, y, round) {
    const [b0, b1] = L.beam;
    R(c, x - 4, y - 4, 30, 28, OUT);
    R(c, x - 3, y - 3, 28, 26, b0);
    R(c, x, y, 22, 20, '#ffd890');
    R(c, x, y, 22, 5, '#fff0c0');
    R(c, x + 14, y + 6, 6, 12, '#f0c070');
    if (round) {
      // Fenêtre en arc du désert : moucharabieh de bois.
      R(c, x - 3, y - 3, 5, 5, L.face[0]);
      R(c, x + 20, y - 3, 5, 5, L.face[0]);
      for (let k = 0; k < 4; k++) R(c, x + 2 + k * 5, y, 1, 20, b1);
      for (let k = 0; k < 3; k++) R(c, x, y + 4 + k * 6, 22, 1, b1);
    } else {
      R(c, x + 10, y, 2, 20, b0);
      R(c, x, y + 9, 22, 2, b0);
      // Volets ouverts.
      for (const sx of [x - 12, x + 25]) {
        R(c, sx - 1, y - 3, 11, 26, OUT);
        R(c, sx, y - 2, 9, 24, b0);
        for (let k = 0; k < 4; k++) R(c, sx + 1, y + k * 6, 7, 1, b1);
      }
    }
    R(c, x - 5, y + 21, 32, 4, b1);
    if (L.flowers) {
      R(c, x - 4, y + 23, 30, 6, '#8a5a34');
      R(c, x - 4, y + 23, 30, 1, '#a87444');
      for (let k = 0; k < 6; k++) R(c, x - 3 + k * 5, y + 17 + (k % 2), 4, 4, k % 2 ? L.flowers : '#ffffff');
      R(c, x - 3, y + 20, 28, 3, '#4f8a42');
    }
  }
  function doorAt(c, L, mid, bot) {
    const [b0, b1] = L.beam,
      top = bot - 52;
    R(c, mid - 21, top - 6, 42, 58, OUT);
    R(c, mid - 19, top - 4, 38, 56, b1);
    // Arc de la porte.
    R(c, mid - 15, top + 2, 30, 48, '#8a5a34');
    R(c, mid - 11, top - 1, 22, 3, '#8a5a34');
    R(c, mid - 15, top + 2, 30, 2, '#a87444');
    for (const dx of [-8, 0, 8]) R(c, mid + dx - 1, top + 2, 1, 48, '#5e3c22');
    R(c, mid - 15, top + 12, 30, 3, '#3a3a40');
    R(c, mid - 15, top + 36, 30, 3, '#3a3a40');
    R(c, mid + 8, top + 24, 4, 4, '#e0c060');
    R(c, mid + 8, top + 24, 2, 2, '#fff2a0');
    // Marche de pierre.
    R(c, mid - 25, bot - 1, 50, 7, OUT);
    R(c, mid - 24, bot, 48, 5, '#9a9aa0');
    R(c, mid - 24, bot, 48, 2, '#c4c4ca');
    // Lanterne à côté de la porte.
    const lx = mid - 30,
      ly = top + 4;
    R(c, lx - 1, ly - 1, 8, 13, OUT);
    R(c, lx, ly, 6, 11, '#ffcf6a');
    R(c, lx + 1, ly + 1, 4, 3, '#fff2b0');
    canaanLight(lx + 3, ly + 6, 80, '#ffcf6a');
  }
  // Pignon au-dessus de la porte : petit toit avancé avec un œil-de-bœuf, pour donner du relief.
  function gableAt(c, L, mid, eave) {
    if (L.roof === 'flat') return;
    const rows = 7;
    for (let k = 0; k < rows; k++) R(c, mid - (8 + k * 4) - 3, eave - 30 + k * 4 - 2, (8 + k * 4) * 2 + 6, 6, OUT);
    for (let k = 0; k < rows; k++) {
      const hw = 8 + k * 4,
        y = eave - 30 + k * 4;
      R(c, mid - hw + 3, y, hw * 2 - 6, 4, L.wall === 'logs' ? L.face[k % 2] : L.wall === 'stone' ? L.face[1] : L.wall === 'planks' ? L.face[1] : L.face[0]);
      R(c, mid - hw, y, 4, 4, L.tones[2]);
      R(c, mid + hw - 4, y, 4, 4, L.tones[3]);
    }
    R(c, mid - 5, eave - 18, 10, 10, OUT);
    R(c, mid - 4, eave - 17, 8, 8, '#ffd890');
    R(c, mid - 1, eave - 17, 2, 8, L.beam[0]);
  }
  function chimneyAt(c, L, x, top) {
    const brick = L.chimney === 'brick';
    R(c, x - 2, top - 16, 22, 36, OUT);
    R(c, x, top - 14, 18, 32, brick ? '#9a5a44' : '#8a8680');
    for (let k = 0; k < 4; k++) {
      R(c, x, top - 14 + k * 8 + 7, 18, 1, brick ? '#6a3a2c' : '#64605a');
      R(c, x + (k % 2 ? 4 : 11), top - 14 + k * 8, 1, 7, brick ? '#6a3a2c' : '#64605a');
    }
    R(c, x, top - 14, 3, 32, '#ffffff22');
    R(c, x - 3, top - 19, 24, 6, OUT);
    R(c, x - 2, top - 18, 22, 4, '#5a5a62');
    smoke(c, x + 9, top - 22);
  }
  function signAt(c, x, y, kind) {
    R(c, x, y, 20, 3, '#3a2a1e');
    R(c, x + 3, y + 3, 2, 6, '#3a2a1e');
    R(c, x + 15, y + 3, 2, 6, '#3a2a1e');
    R(c, x - 3, y + 8, 26, 24, OUT);
    R(c, x - 2, y + 9, 24, 22, '#7a5230');
    R(c, x, y + 11, 20, 18, '#b08250');
    if (kind === 'or') {
      R(c, x + 5, y + 16, 10, 10, '#c8a050');
      R(c, x + 7, y + 14, 6, 3, '#8a6a30');
      R(c, x + 8, y + 19, 4, 4, '#ffe080');
    } else {
      R(c, x + 3, y + 20, 14, 6, '#e8e0d0');
      R(c, x + 5, y + 26, 10, 2, '#c8c0b0');
      R(c, x + 4, y + 19, 12, 2, '#e08a3a');
      R(c, x + 7, y + 13, 2, 4, '#ffffff');
      R(c, x + 11, y + 12, 2, 4, '#ffffff');
    }
  }
  // Abords : ce qui pousse ou traîne au pied de la maison, selon le biome.
  function groundAt(c, L, X, Wd, bot, seed) {
    const spots = [X - 16, X + Wd + 4];
    for (const [i, x] of spots.entries()) {
      const y = bot - 4;
      switch (L.ground) {
        case 'plaines':
          R(c, x - 1, y - 13, 18, 15, OUT);
          R(c, x, y - 12, 16, 13, '#4f8a42');
          R(c, x + 2, y - 12, 8, 4, '#6aa852');
          R(c, x + 3, y - 9, 3, 3, i ? '#f0c040' : '#e05a7a');
          R(c, x + 10, y - 6, 3, 3, '#ffffff');
          break;
        case 'foret':
          R(c, x + 2, y - 8, 4, 8, '#e8dcc0');
          R(c, x - 1, y - 14, 11, 7, OUT);
          R(c, x, y - 13, 9, 5, '#c83a2a');
          R(c, x + 2, y - 12, 2, 2, '#ffffff');
          R(c, x + 10, y - 10, 2, 10, '#3e6a2e');
          R(c, x + 12, y - 12, 5, 2, '#4e8a3a');
          R(c, x + 8, y - 8, 4, 2, '#4e8a3a');
          break;
        case 'marais':
          for (let k = 0; k < 4; k++) R(c, x + k * 4, y - 14 + (k % 2) * 4, 2, 14 - (k % 2) * 4, '#6a8a3a');
          R(c, x + 2, y - 18, 3, 6, '#6a4a2a');
          break;
        case 'automne':
          R(c, x - 1, y - 12, 18, 13, OUT);
          R(c, x, y - 11, 16, 11, '#e07a28');
          R(c, x + 5, y - 11, 1, 11, '#b05a1a');
          R(c, x + 10, y - 11, 1, 11, '#b05a1a');
          R(c, x + 7, y - 15, 3, 4, '#4e6a2a');
          break;
        case 'desert':
          R(c, x - 1, y - 21, 16, 22, OUT);
          R(c, x, y - 20, 14, 20, '#c8783a');
          R(c, x + 3, y - 24, 8, 5, '#a8602c');
          R(c, x + 2, y - 16, 3, 12, '#e09a5a');
          break;
        default: {
          const p = 0.6 + Math.sin(time * 0.06 + i) * 0.3;
          R(c, x + 2, y - 18, 7, 18, OUT);
          R(c, x + 3, y - 17, 5, 17, '#9ae0ff');
          R(c, x + 3, y - 17, 2, 17, '#e0f8ff');
          R(c, x + 9, y - 10, 5, 10, '#c89aff');
          canaanLight(x + 6, y - 10, 60 * p, '#9ae0ff');
        }
      }
    }
  }
  function drawBuilding(c, b) {
    const L = LOOKS[b.style] || LOOKS.chaume,
      X = b.x * TS,
      Y = b.y * TS,
      Wd = b.w * TS,
      Hd = b.h * TS,
      base = Y + Hd,
      mid = X + Wd / 2,
      seed = b.x * 31 + b.y,
      lift = L.stilts ? 16 : 0,
      bot = base - 6 - lift,
      top = bot - 66,
      roofTop = Y - 34,
      eave = top + 10;
    if (!visible(mid, Y + Hd / 2, 300)) return;
    c.save();
    c.imageSmoothingEnabled = false;
    // Ombre portée vers le bas et la droite.
    c.globalAlpha = 0.28;
    R(c, X, base - 8, Wd + 14, 12, '#0a0e12');
    R(c, X + Wd, top + 16, 12, base - top - 16, '#0a0e12');
    c.globalAlpha = 1;
    if (L.stilts) drawStilts(c, L, X, Wd, bot, lift, mid);
    drawWall(c, L, X, top, Wd, bot, seed);
    drawBase(c, L, X, Wd, bot, seed);
    doorAt(c, L, mid, bot);
    const wy = top + 16;
    windowAt(c, L, mid - 21 - 22 - 26, wy, L.wall === 'adobe');
    windowAt(c, L, mid + 21 + 26, wy, L.wall === 'adobe');
    canaanLight(mid - 58, wy + 10, 70, '#ffd890');
    canaanLight(mid + 58, wy + 10, 70, '#ffd890');
    // Auvent : rayé rouge et crème à l'échoppe, toile tendue sur perches dans le désert.
    if (L.awning === true) {
      R(c, mid - 30, top - 2, 60, 16, OUT);
      for (let k = 0; k < 6; k++) R(c, mid - 29 + k * 10, top - 1, 10, 12, k % 2 ? '#f2e2c0' : '#c4553f');
      for (let k = 0; k < 6; k++) R(c, mid - 29 + k * 10, top + 11, 10, 3, k % 2 ? '#d9c7a1' : '#9f4434');
    } else if (L.awning) {
      R(c, mid - 34, top + 2, 68, 12, OUT);
      R(c, mid - 33, top + 3, 66, 10, '#3a7a9a');
      for (let k = 0; k < 4; k++) R(c, mid - 33 + k * 18, top + 3, 8, 10, '#e8dcc0');
      R(c, mid - 33, top + 12, 3, 30, L.beam[0]);
      R(c, mid + 30, top + 12, 3, 30, L.beam[0]);
    }
    drawRoof(c, L, X, Wd, roofTop, eave, seed);
    if (L.roof !== 'flat') gableAt(c, L, mid, eave);
    if (L.chimney) chimneyAt(c, L, X + Wd - 56, roofTop + 4);
    // Enseigne en potence, à l'angle gauche de la façade.
    if (b.sign) {
      R(c, X - 22, top + 2, 28, 3, '#3a2a1e');
      signAt(c, X - 22, top + 2, b.sign);
    }
    // Détails propres à chaque lieu.
    if (L.crates)
      for (const [dx, dy] of [[Wd - 4, 0], [Wd + 14, 6]]) {
        R(c, X + dx - 1, base - 31 + dy, 24, 24, OUT);
        R(c, X + dx, base - 30 + dy, 22, 22, '#a07444');
        R(c, X + dx, base - 30 + dy, 22, 3, '#c8945a');
        R(c, X + dx + 2, base - 30 + dy, 2, 22, '#7a5230');
        R(c, X + dx + 18, base - 30 + dy, 2, 22, '#7a5230');
        R(c, X + dx + 4, base - 36 + dy, 8, 6, '#d84a3a');
        R(c, X + dx + 12, base - 35 + dy, 6, 5, '#e8c040');
      }
    if (L.barrels)
      for (const dx of [-26, -4]) {
        R(c, X + dx - 1, base - 33, 24, 30, OUT);
        R(c, X + dx, base - 32, 22, 28, '#8a5a34');
        R(c, X + dx, base - 28, 22, 3, '#4a4a52');
        R(c, X + dx, base - 14, 22, 3, '#4a4a52');
        R(c, X + dx + 4, base - 32, 4, 28, '#a8743e');
        R(c, X + dx + 16, base - 32, 4, 28, '#6a4226');
      }
    if (L.wood)
      for (let k = 0; k < 3; k++)
        for (let j = 0; j < 3 - k; j++) {
          R(c, X + Wd + j * 10 + k * 5 - 1, base - 13 - k * 9, 11, 10, OUT);
          R(c, X + Wd + j * 10 + k * 5, base - 12 - k * 9, 9, 8, '#7a5638');
          R(c, X + Wd + j * 10 + k * 5 + 2, base - 10 - k * 9, 5, 4, '#c8a070');
        }
    if (!L.crates && !L.barrels && !L.wood) groundAt(c, L, X, Wd, base, seed);
    // Nom du lieu (de près pour les demeures) et invitation à entrer.
    const near = Math.hypot(P.x - mid, P.y - base) < 320,
      ly = roofTop - (L.roof === 'flat' ? 64 : L.chimney ? 32 : 14);
    if (b.place || b.sign || b.room === HOME || near) label(c, b.place ? b.place.name : b.label, mid, ly);
    const d = outsideDoor(b);
    if (Math.hypot(P.x - d.x, P.y - d.y) < 90) label(c, '[E] Entrer', d.x, top - 8, '#fff2cb');
    c.restore();
  }
  function draw(c) {
    if (game.world.instance) return;
    if (!current()) for (const b of buildings) drawBuilding(c, b);
    drawRoom(c);
  }

  // ---------------------------------------------------------------- Mode décoration (touche H)
  let editing = false;
  const ui = { cat: 'meubles', selected: null, tool: 'move', rot: 0 };
  // Case visée par la souris (coordonnées de la pièce), bornée au sol ou au mur.
  function aimed() {
    const cat = ui.selected ? CATALOG[ui.selected] : null,
      d = cat ? dims(cat, ui.rot) : { w: 1, h: 1 },
      lx = Math.floor(mouseWorldX / TS) - HOME.x - Math.floor((d.w - 1) / 2),
      ly = Math.floor(mouseWorldY / TS) - HOME.y - (cat && !onWall(cat) ? Math.floor((d.h - 1) / 2) : 0);
    return { x: lx, y: ly };
  }
  const previews = new Map();
  function preview(k) {
    if (previews.has(k)) return previews.get(k);
    let url = '';
    try {
      const cat = CATALOG[k],
        w = cat.w * TS,
        h = cat.h * TS + 44,
        cv = document.createElement('canvas');
      cv.width = w + 16;
      cv.height = h;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      if (onWall(cat)) {
        R(g, 8, 0, w, cat.h * TS, '#d8c49a');
        cat.draw(g, 8, 0, w, cat.h * TS, 0);
      } else cat.draw(g, 8, 40, w, cat.h * TS, 0);
      url = cv.toDataURL();
    } catch {
      url = '';
    }
    previews.set(k, url);
    return url;
  }
  const esc = text => safeGearText(text);
  function renderBar() {
    let bar = document.getElementById('housingBar');
    if (!editing) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'housingBar';
      document.body.appendChild(bar);
    }
    const list = Object.entries(CATALOG).filter(([, c]) => c.cat === ui.cat);
    bar.innerHTML =
      '<div class="house-head"><b>🏠 Décorer ta maison</b><span>Clic gauche : poser · clic sur un meuble : le déplacer · R : tourner · clic droit ou Échap : annuler · H : terminer</span></div>' +
      '<div class="house-tabs">' +
      CATS.map(([id, text]) => '<button type="button" class="' + (ui.cat === id ? 'on' : '') + '" data-action="houseCat" data-cat="' + id + '">' + text + '</button>').join('') +
      '<button type="button" class="house-tool" data-action="houseRotate">⟳ Tourner (R)</button>' +
      '<button type="button" class="house-tool' + (ui.tool === 'remove' ? ' on' : '') + '" data-action="houseTool" data-tool="' + (ui.tool === 'remove' ? 'move' : 'remove') + '">🗑 Retirer</button>' +
      '<span class="house-count">' + items.length + ' / ' + MAX_ITEMS + ' objets</span></div>' +
      '<div class="house-items">' +
      list
        .map(([k, c]) => {
          const url = preview(k),
            locked = c.quest && !CANAAN_QUESTS.hasDeco(game.hero, k);
          return (
            '<button type="button" class="house-item' + (ui.selected === k ? ' on' : '') + (locked ? ' locked' : '') + '" data-action="houseSelect" data-item="' + k + '"' +
            (locked ? ' title="Récompense de quête : ' + esc(questById(c.quest).title) + '"' : '') + '>' +
            (url ? '<img src="' + url + '" alt="">' : '') + '<span>' + (locked ? '🔒 ' : '') + esc(c.name) + '</span></button>'
          );
        })
        .join('') +
      '</div>';
  }
  function toggle() {
    if (!started) return false;
    if (!editing && (!inHome(P.x, P.y) || game.world.instance)) {
      toast('🏠 Entre dans ta maison (chaumière à l’ouest du Camp de l’Aurore) pour la décorer.');
      return false;
    }
    editing = !editing;
    ui.selected = null;
    ui.tool = 'move';
    ui.rot = 0;
    renderBar();
    return true;
  }
  function act(action) {
    const done = guest() ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    renderBar();
    return done;
  }
  // Tourner : le meuble en main (aperçu), sinon celui sous la souris.
  function turn() {
    if (!editing) return false;
    if (ui.selected) {
      ui.rot = (ui.rot + 1) % turns(CATALOG[ui.selected]);
      return true;
    }
    const at = aimed();
    if (!topAt(at.x, at.y)) {
      toast('🏠 Prends un meuble ou vise-en un pour le tourner (R).');
      return false;
    }
    act({ op: 'house-rotate', x: at.x, y: at.y });
    return true;
  }
  // Clic dans le monde en mode décoration : poser, déplacer ou retirer. Renvoie vrai si le clic est pris.
  function click(button) {
    if (!editing) return false;
    if (!inHome(P.x, P.y)) {
      toggle();
      return false;
    }
    if (button === 2) {
      ui.selected = null;
      renderBar();
      return true;
    }
    const at = aimed();
    if (ui.selected) {
      const cat = CATALOG[ui.selected],
        y = onWall(cat) ? 0 : at.y;
      if (!valid(ui.selected, at.x, y, items, ui.rot)) {
        toast('🏠 Impossible de poser ici.');
        return true;
      }
      act({ op: 'house-place', k: ui.selected, x: at.x, y, r: ui.rot });
      if (ui.moving) {
        ui.selected = null;
        ui.moving = false;
      }
      return true;
    }
    const it = topAt(at.x, at.y);
    if (!it) return true;
    act({ op: 'house-remove', x: at.x, y: at.y });
    // Déplacer : le meuble repris suit la souris, dans le même sens, jusqu'au prochain clic.
    if (ui.tool !== 'remove') {
      ui.selected = it.k;
      ui.rot = it.r || 0;
      ui.moving = true;
    }
    renderBar();
    return true;
  }
  // Échap annule le meuble en main avant de mettre le jeu en pause ; R tourne le meuble.
  addEventListener(
    'keydown',
    e => {
      if (!editing || e.target?.tagName === 'INPUT') return;
      if (e.key === 'Escape' && ui.selected) {
        ui.selected = null;
        ui.moving = false;
        renderBar();
      } else if (e.key === 'r' || e.key === 'R') turn();
      else return;
      e.stopImmediatePropagation();
      e.preventDefault();
    },
    true
  );
  // Sortie de la maison : le mode décoration se ferme.
  setInterval(() => {
    if (editing && (!started || !inHome(P.x, P.y))) toggle();
  }, 300);
  const actions = {
    cat(id) {
      if (CATS.some(([c]) => c === id)) ui.cat = id;
      renderBar();
    },
    select(k) {
      if (!CATALOG[k]) return;
      ui.selected = ui.selected === k ? null : k;
      ui.moving = false;
      ui.tool = 'move';
      ui.rot = 0;
      renderBar();
    },
    tool(t) {
      ui.tool = t === 'remove' ? 'remove' : 'move';
      ui.selected = null;
      renderBar();
    },
    rotate: turn
  };
  // Habitants des bâtiments (life.js) : [rôle, x, y] en cases du monde, avec le lieu d'un refuge.
  function residents() {
    const out = [];
    for (const b of buildings)
      for (const [role, lx, ly] of RESIDENTS[b.room.id] || []) out.push({ role, tx: b.room.x + lx - 0.5, ty: b.room.y + ly - 0.5, place: b.place || null, inside: true });
    for (const b of buildings) if (b.place) out.push({ role: null, tx: b.place.x, ty: b.place.y + 1, place: b.place, inside: false });
    return out;
  }
  window.CANAAN_HOUSE = Object.freeze({
    CATALOG,
    room: HOME,
    roomAt,
    outside: () => ({ x: homeB().x, y: homeB().y }),
    buildings: () => buildings.map(b => ({ id: b.room.id, name: b.room.name, kind: b.room.kind, style: b.style, x: b.x, y: b.y, w: b.w, h: b.h, door: outsideDoor(b), inside: insideDoor(b.room) })),
    outsideDoor: id => outsideDoor(id ? buildings.find(b => b.room.id === id) : homeB()),
    insideDoor: id => insideDoor(id ? ROOM[id] : HOME),
    inside,
    valid,
    blocked,
    place,
    remove,
    rotate,
    door,
    handle,
    items: () => items.map(it => ({ ...it })),
    roomItems: id => itemsOf(ROOM[id]).map(it => ({ ...it })),
    // Aperçu d'une façade (tests et outils) : style de LOOKS, posée sur la case (tx, ty).
    drawFacade: (c, style, tx, ty) => drawBuilding(c, { style, x: tx, y: ty, w: 4, h: 3, room: ROOM.chene, label: style }),
    styles: () => Object.keys(LOOKS),
    residents,
    layout,
    load,
    sanitize,
    netView,
    applyRemote,
    interact,
    nearStove,
    drawTile,
    draw,
    click,
    toggle,
    editing: () => editing,
    actions,
    hasFire: () => itemsOf(current()).some(it => CATALOG[it.k].fire)
  });
  window.toggleHousing = toggle;
})();
