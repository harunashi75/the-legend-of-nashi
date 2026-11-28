// Dessin des meubles des pièces intérieures (pixel art) : lits, tables, cuisinières, étagères, tapis, rideaux…, et
// les petits motifs qu'ils partagent (feu, vue par une fenêtre). Leurs métadonnées (nom, couche, taille) sont dans
// shared/data/house.js. scripts/house/render.js appelle CANAAN_HOUSE_FURNITURE.create(outils) une fois.
(() => {
  'use strict';
  function create(scene) {
    const { R } = scene;

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
    // Dessin de chaque meuble ; ses métadonnées (nom, couche, taille…) sont dans shared/data/house.js.
    const FURNITURE_ART = {
      lit: {
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
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 16, W - 12, 6, '#8a5a34');
          R(g, x + 6, y + 23, W - 12, 6, '#7a4e2c');
          R(g, x + 6, y + 16, W - 12, 2, '#b07a48');
          R(g, x + 10, y + 29, 5, 16, '#5a3a22');
          R(g, x + W - 15, y + 29, 5, 16, '#5a3a22');
        }
      },
      armoire: {
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
        draw(g, x, y, W, H) {
          R(g, x + 3, y - 40, W - 6, H + 36, '#5a3a22');
          const colors = ['#a8442a', '#3e5a9a', '#4f8a42', '#c9a24a', '#7a4a8a', '#2e6a72'];
          for (let row = 0; row < 3; row++) {
            const ry = y - 34 + row * 24;
            R(g, x + 6, ry, W - 12, 20, '#2a1a10');
            for (let k = 0; k < 9; k++)
              R(
                g,
                x + 8 + k * 9,
                ry + 3 + ((k * 7 + row) % 4),
                7,
                17 - ((k * 7 + row) % 4),
                colors[(k + row * 2) % colors.length]
              );
            R(g, x + 4, ry + 20, W - 8, 3, '#7a5230');
          }
        }
      },
      coffre: {
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
        draw(g, x, y, W, H) {
          R(g, x + 2, y - 40, W - 4, H + 38, '#7a7a80');
          for (let k = 0; k < 6; k++) R(g, x + 2 + (k % 2) * 20, y - 36 + k * 14, W - 4, 2, '#5a5a62');
          R(g, x + 16, y - 8, W - 32, 46, '#1a1414');
          fire(g, x + 22, y + 10, W - 44, 26);
          R(g, x + 22, y + 34, W - 44, 4, '#5a3a22');
          R(g, x - 2, y - 14, W + 4, 6, '#5a3a22');
          R(g, x + 10, y - 24, 6, 10, '#c9a24a');
          R(g, x + W - 18, y - 22, 8, 8, '#e8e0d0');
        }
      },
      tonneau: {
        draw(g, x, y, W, H) {
          R(g, x + 10, y + 4, W - 20, 40, '#8a5a34');
          R(g, x + 8, y + 10, W - 16, 28, '#8a5a34');
          R(g, x + 8, y + 12, W - 16, 3, '#4a4a52');
          R(g, x + 8, y + 32, W - 16, 3, '#4a4a52');
          R(g, x + 14, y + 4, 4, 40, '#a8743e');
        }
      },
      plante: {
        draw(g, x, y, W, H) {
          const sway = Math.sin(time * 0.03 + x) * 1.5;
          R(g, x + 14, y + 28, W - 28, 16, '#a8603a');
          R(g, x + 12, y + 26, W - 24, 4, '#c8784a');
          g.fillStyle = '#3e7a3e';
          for (const [dx, dy, r] of [
            [0, -6, 12],
            [-9, 4, 9],
            [9, 4, 9],
            [-5, -18, 8],
            [6, -16, 8]
          ]) {
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
      tapis: {
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 4, W - 8, H - 8, '#9a3434');
          R(g, x + 9, y + 9, W - 18, H - 18, '#c9a24a');
          R(g, x + 12, y + 12, W - 24, H - 24, '#b04a4a');
          R(g, x + W / 2 - 10, y + H / 2 - 10, 20, 20, '#c9a24a');
          R(g, x + W / 2 - 5, y + H / 2 - 5, 10, 10, '#7a2424');
        }
      },
      tapis_rond: {
        draw(g, x, y, W, H) {
          for (const [r, col] of [
            [0, '#3e5a9a'],
            [7, '#d8e0f0'],
            [11, '#5a7ac0'],
            [22, '#d8e0f0'],
            [26, '#3e5a9a']
          ]) {
            g.fillStyle = col;
            g.beginPath();
            g.ellipse(x + W / 2, y + H / 2, W / 2 - 4 - r, H / 2 - 8 - r * 0.8, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
      },
      tapis_long: {
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
      mouton: {
        draw(g, x, y, W) {
          R(g, x + 10, y + 18, W - 20, 16, '#f0ece4');
          for (const [dx, dy] of [
            [12, 15],
            [20, 13],
            [28, 15]
          ])
            R(g, x + dx, y + dy, 8, 6, '#ffffff');
          R(g, x + W - 14, y + 16, 9, 10, '#3a3030');
          R(g, x + W - 11, y + 19, 2, 2, '#ffffff');
          for (const dx of [12, 18, 26, 32]) R(g, x + dx, y + 34, 3, 7, '#3a3030');
          R(g, x + 8, y + 42, W - 16, 3, '#00000033');
        }
      },
      figurine: {
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
        draw(g, x, y, W) {
          R(g, x + 16, y + 10, W - 32, 32, '#9ad0f0');
          R(g, x + 18, y + 12, 4, 26, '#e8f8ff');
          R(g, x + 20, y + 2, W - 40, 10, '#9ad0f0');
          R(g, x + 19, y - 2, W - 38, 5, '#8a5a34');
          g.globalAlpha = 0.6;
          for (let k = 0; k < 3; k++)
            R(g, x + 20 + ((time * 0.4 + k * 6) % 10), y + 16 + k * 8, 6, 2, '#ffffff');
          g.globalAlpha = 1;
        }
      },
      dragon: {
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
      fenetre: {
        draw(g, x, y, W, H) {
          R(g, x + 5, y + 12, W - 10, 62, '#5a3a22');
          view(g, x + 9, y + 16, W - 18, 54);
          R(g, x + W / 2 - 1, y + 16, 2, 54, '#5a3a22');
          R(g, x + 9, y + 40, W - 18, 2, '#5a3a22');
          R(g, x + 3, y + 72, W - 6, 5, '#8a5a34');
        }
      },
      grande_fenetre: {
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
        draw(g, x, y, W, H) {
          R(g, x + 9, y + 22, W - 18, 36, '#c9a24a');
          R(g, x + 12, y + 25, W - 24, 30, '#e8d8a0');
          R(g, x + 12, y + 40, W - 24, 15, '#6aa552');
          R(g, x + 12, y + 25, W - 24, 15, '#9ad0f0');
          R(g, x + 26, y + 30, 5, 5, '#fff2a0');
          R(g, x + 16, y + 36, 6, 8, '#3e7a3e');
        }
      },
      grand_tableau: {
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
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 52, W - 8, 5, '#7a5230');
          R(g, x + 10, y + 57, 4, 8, '#5a3a22');
          R(g, x + W - 14, y + 57, 4, 8, '#5a3a22');
          R(g, x + 10, y + 38, 10, 14, '#c8784a');
          R(g, x + 12, y + 30, 6, 8, '#4f8a42');
          for (let k = 0; k < 5; k++)
            R(
              g,
              x + 30 + k * 6,
              y + 36 + (k % 2) * 3,
              5,
              16 - (k % 2) * 3,
              ['#a8442a', '#3e5a9a', '#4f8a42', '#c9a24a', '#7a4a8a'][k]
            );
          R(g, x + W - 26, y + 42, 12, 10, '#e8e0d0');
          R(g, x + W - 24, y + 40, 8, 3, '#d8d0c0');
        }
      },
      trophee: {
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
          for (let k = 0; k < 4; k++)
            R(g, x + 44 + k * 3, y + 2 - k * 2, 8, 3, k % 2 ? '#f0d070' : '#d8b048');
          for (const [dx, col] of [
            [78, '#c84a5a'],
            [88, '#4a7ad8'],
            [98, '#5ab04a']
          ]) {
            R(g, x + dx, y - 4, 7, 10, col);
            R(g, x + dx + 2, y - 8, 3, 4, '#e8e0d0');
            R(g, x + dx + 1, y - 2, 2, 3, '#ffffff88');
          }
          R(g, x + 112, y - 2, 22, 8, '#8a5aa8');
          R(g, x + 112, y - 2, 22, 2, '#aa7ac8');
        }
      },
      presentoir: {
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
        draw(g, x, y, W, H) {
          for (const [dx, dy] of [
            [4, 18],
            [20, 16],
            [12, 6]
          ]) {
            R(g, x + dx, y + dy + 4, 22, 22, '#c8b088');
            R(g, x + dx + 2, y + dy, 18, 6, '#b09870');
            R(g, x + dx + 8, y + dy - 3, 6, 4, '#8a7050');
            R(g, x + dx + 4, y + dy + 10, 14, 2, '#a89068');
          }
        }
      },
      casseroles: {
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 18, W - 12, 4, '#5a3a22');
          for (const [dx, r, col] of [
            [14, 9, '#b8783a'],
            [38, 11, '#a0a0a8'],
            [64, 8, '#c8884a']
          ]) {
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
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 16, W - 8, 3, '#5a3a22');
          R(g, x + 10, y + 19, 2, 8, '#c8b088');
          R(g, x + 6, y + 27, 10, 18, '#a8483a');
          R(g, x + 8, y + 29, 4, 12, '#c8685a');
          R(g, x + 22, y + 19, 2, 6, '#c8b088');
          for (let k = 0; k < 4; k++)
            R(g, x + 18 + k * 3, y + 25, 3, 20 - k * 2, k % 2 ? '#5a8a3a' : '#6aa04a');
          R(g, x + 34, y + 19, 2, 6, '#c8b088');
          for (let k = 0; k < 3; k++) R(g, x + 31, y + 25 + k * 7, 8, 7, '#f0ecd8');
        }
      },
      trone: {
        draw(g, x, y, W, H) {
          // Dossier haut en branches d'argent, feuille d'or, coussin de velours.
          R(g, x + 8, y - 40, W - 16, 64, '#e8e4f0');
          R(g, x + 12, y - 36, W - 24, 56, '#7a4aa8');
          R(g, x + 14, y - 34, 4, 50, '#9a6ac8');
          R(g, x + W / 2 - 6, y - 52, 12, 14, '#f0d060');
          R(g, x + W / 2 - 3, y - 58, 6, 8, '#fff4b0');
          for (const dx of [6, W - 10]) R(g, x + dx, y - 48, 4, 74, '#c8ccd8');
          R(g, x + 4, y + 18, W - 8, 10, '#c8ccd8');
          R(g, x + 6, y + 14, W - 12, 6, '#9a6ac8');
          R(g, x + 6, y + 28, 6, 16, '#a8acb8');
          R(g, x + W - 12, y + 28, 6, 16, '#a8acb8');
        }
      },
      harpe: {
        draw(g, x, y, W, H) {
          R(g, x + 10, y + 38, W - 18, 6, '#8a5a34');
          R(g, x + 10, y - 20, 5, 60, '#c8a038');
          R(g, x + 10, y - 22, 26, 5, '#f0d060');
          R(g, x + 32, y - 18, 5, 12, '#f0d060');
          for (let k = 0; k < 6; k++) R(g, x + 16 + k * 3, y - 16 + k * 3, 1, 52 - k * 4, '#fff6d8');
          R(g, x + 30, y - 6, 4, 46, '#c8a038');
        }
      },
      telescope: {
        draw(g, x, y, W, H) {
          for (const [ax, bx] of [
            [12, 22],
            [36, 26],
            [24, 24]
          ]) {
            g.strokeStyle = '#6a4426';
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(x + ax, y + 44);
            g.lineTo(x + bx, y + 12);
            g.stroke();
          }
          g.save();
          g.translate(x + 24, y + 6);
          g.rotate(-0.6);
          R(g, -18, -5, 38, 10, '#c8a038');
          R(g, -18, -5, 38, 3, '#f0d060');
          R(g, 18, -7, 6, 14, '#8a6a1e');
          R(g, -22, -3, 5, 6, '#3a3036');
          g.restore();
        }
      },
      autel: {
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 14, W - 8, 30, '#e8e4dc');
          R(g, x + 4, y + 14, W - 8, 5, '#ffffff');
          R(g, x + 8, y + 22, W - 16, 18, '#cfc8bc');
          for (let k = 0; k < 4; k++) R(g, x + 14 + k * 20, y + 26, 8, 10, '#bfc8e8');
          // Croissant de lune d'argent qui luit.
          g.fillStyle = '#eef4ff';
          g.beginPath();
          g.arc(x + W / 2, y - 6, 16, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#cfc8bc';
          g.beginPath();
          g.arc(x + W / 2 + 7, y - 10, 14, 0, Math.PI * 2);
          g.fill();
          R(g, x + W / 2 - 22, y + 6, 6, 8, '#fff4b0');
          R(g, x + W / 2 + 16, y + 6, 6, 8, '#fff4b0');
        }
      },
      metier: {
        draw(g, x, y, W, H) {
          for (const dx of [6, W - 12]) R(g, x + dx, y - 14, 6, 58, '#8a5a34');
          R(g, x + 6, y - 14, W - 12, 6, '#a87444');
          R(g, x + 6, y + 30, W - 12, 6, '#a87444');
          // Étoffe en cours : bandes vert et or, fils tendus.
          R(g, x + 14, y - 6, W - 28, 34, '#3a8a5a');
          for (let k = 0; k < 5; k++) R(g, x + 14, y - 2 + k * 7, W - 28, 2, k % 2 ? '#f0d060' : '#8ad8a8');
          for (let k = 0; k < 10; k++) R(g, x + 16 + k * 7, y - 8, 1, 38, '#fff6d8');
          R(g, x + 12, y + 18, W - 24, 4, '#6a4426');
        }
      },
      mannequin: {
        draw(g, x, y, W, H) {
          R(g, x + 22, y + 22, 4, 20, '#6a4426');
          R(g, x + 14, y + 40, 20, 4, '#6a4426');
          R(g, x + 12, y - 16, 24, 40, '#2e7a5a');
          R(g, x + 10, y - 2, 28, 26, '#3a9a6a');
          R(g, x + 12, y - 16, 24, 4, '#f0d060');
          R(g, x + 22, y - 22, 4, 6, '#6a4426');
          for (let k = 0; k < 3; k++) R(g, x + 16 + k * 6, y + 2, 2, 20, '#5ab88a');
        }
      },
      rack_armes: {
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 22, W - 8, 4, '#6a4426');
          R(g, x + 4, y + 70, W - 8, 4, '#6a4426');
          // Épée, lance et arc accrochés.
          R(g, x + 12, y + 18, 3, 54, '#dfe8f0');
          R(g, x + 8, y + 64, 11, 3, '#c8a038');
          R(g, x + 23, y + 10, 2, 66, '#8a5a34');
          R(g, x + 21, y + 6, 6, 8, '#dfe8f0');
          g.strokeStyle = '#8a5a34';
          g.lineWidth = 3;
          g.beginPath();
          g.arc(x + 36, y + 46, 18, -1.3, 1.3);
          g.stroke();
          R(g, x + 36, y + 29, 1, 34, '#fff6d8');
        }
      },
      banniere_elfe: {
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 14, W - 12, 4, '#c8a038');
          R(g, x + 10, y + 18, W - 20, 48, '#2e6a4a');
          g.fillStyle = '#2e6a4a';
          g.beginPath();
          g.moveTo(x + 10, y + 66);
          g.lineTo(x + W / 2, y + 78);
          g.lineTo(x + W - 10, y + 66);
          g.fill();
          // Feuille d'or brodée.
          g.fillStyle = '#f0d060';
          g.beginPath();
          g.ellipse(x + W / 2, y + 42, 7, 14, 0, 0, Math.PI * 2);
          g.fill();
          R(g, x + W / 2 - 1, y + 28, 2, 28, '#c8a038');
        }
      },
      // Tableau des contrats de la guilde : panneau de liège encadré, avis épinglés, planche gravée en haut.
      tableau_contrats: {
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 10, W - 8, 72, '#2e1c10');
          R(g, x + 7, y + 13, W - 14, 66, '#6a4428');
          R(g, x + 10, y + 26, W - 20, 50, '#b8875a');
          R(g, x + 10, y + 26, W - 20, 3, '#cfa070');
          // Planche du haut.
          R(g, x + 24, y + 13, W - 48, 11, '#8a5e38');
          R(g, x + 30, y + 17, W - 60, 3, '#3a2414');
          // Trois avis.
          const notes = [
            ['#f4ead0', 18, 32, -1],
            ['#fbf3df', W / 2 - 15, 30, 0],
            ['#efe2c0', W - 50, 33, 1]
          ];
          for (const [col, nx, ny, tilt] of notes) {
            R(g, x + nx, y + ny + tilt, 30, 38, '#00000033');
            R(g, x + nx - 1, y + ny - 1, 30, 38, col);
            for (let k = 0; k < 5; k++) R(g, x + nx + 4, y + ny + 8 + k * 5, 20 - (k % 2) * 6, 2, '#8a7a60');
            R(g, x + nx + 12, y + ny - 3, 5, 5, '#c83a2a');
            R(g, x + nx + 13, y + ny - 2, 2, 2, '#ff8a6a');
          }
          // Le sceau rouge de la guilde sur l'avis du milieu.
          R(g, x + W / 2 + 4, y + 58, 8, 8, '#a82a20');
        }
      },
      banniere_guilde: {
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 14, W - 12, 4, '#d8b040');
          R(g, x + 10, y + 18, W - 20, 50, '#3c4c8c');
          R(g, x + 10, y + 18, W - 20, 4, '#5a6cb0');
          g.fillStyle = '#3c4c8c';
          g.beginPath();
          g.moveTo(x + 10, y + 68);
          g.lineTo(x + W / 2, y + 80);
          g.lineTo(x + W - 10, y + 68);
          g.fill();
          // Écu d'or.
          R(g, x + W / 2 - 8, y + 30, 16, 14, '#d8b040');
          R(g, x + W / 2 - 6, y + 32, 12, 11, '#2e3c6c');
          R(g, x + W / 2 - 5, y + 44, 10, 3, '#d8b040');
          R(g, x + W / 2 - 2, y + 47, 4, 3, '#d8b040');
          R(g, x + W / 2 - 1, y + 33, 2, 9, '#eef2f8');
        }
      },
      banniere_naine: {
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 14, W - 12, 4, '#5a5e66');
          R(g, x + 10, y + 18, W - 20, 52, '#7a1a20');
          R(g, x + 10, y + 18, W - 20, 4, '#a82a30');
          R(g, x + 10, y + 66, W - 20, 6, '#e0b040');
          // Marteau croisé d'une hache, runes dorées.
          R(g, x + W / 2 - 1, y + 28, 3, 30, '#e0b040');
          R(g, x + W / 2 - 8, y + 28, 17, 6, '#e0b040');
          for (let k = 0; k < 3; k++) R(g, x + 14 + k * 8, y + 60, 4, 3, '#e0b040');
        }
      },
      enclume: {
        draw(g, x, y, W, H) {
          R(g, x + 14, y + 30, W - 28, 14, '#5a3a22');
          R(g, x + 18, y + 22, W - 36, 10, '#3a3a40');
          R(g, x + 6, y + 12, W - 12, 12, '#4a4a52');
          R(g, x + 6, y + 12, W - 12, 3, '#8a8e96');
          R(g, x + 2, y + 14, 8, 6, '#4a4a52');
          R(g, x + 26, y + 4, 4, 10, '#6a4426');
          R(g, x + 22, y + 2, 12, 5, '#5a5e66');
        }
      },
      lingots: {
        draw(g, x, y, W, H) {
          const bar = (bx, by) => {
            R(g, bx, by, 14, 7, '#c8a038');
            R(g, bx + 1, by, 12, 2, '#fff4b0');
            R(g, bx + 1, by + 5, 12, 2, '#8a6a1e');
          };
          for (let k = 0; k < 3; k++) bar(x + 6 + k * 13, y + 36);
          for (let k = 0; k < 2; k++) bar(x + 12 + k * 13, y + 29);
          bar(x + 18, y + 22);
          R(g, x + 30, y + 16, 3, 3, '#ffffff');
        }
      },
      foin: {
        draw(g, x, y, W, H) {
          R(g, x + 4, y + 14, W - 8, 30, '#d8b050');
          R(g, x + 4, y + 14, W - 8, 5, '#f0d078');
          for (let k = 0; k < 8; k++) R(g, x + 6 + k * 5, y + 20 + (k % 3) * 4, 2, 6, '#b08a34');
          for (const dy of [20, 34]) R(g, x + 4, y + dy, W - 8, 2, '#8a5a34');
          for (let k = 0; k < 5; k++) R(g, x + 6 + k * 8, y + 10 + (k % 2) * 2, 2, 5, '#f0d078');
        }
      },
      nichoir_poules: {
        draw(g, x, y, W, H) {
          R(g, x + 2, y - 8, W - 4, 50, '#8a5a34');
          for (let k = 0; k < 3; k++) {
            const bx = x + 6 + k * 29;
            R(g, bx, y - 2, 25, 18, '#5a3a22');
            R(g, bx + 2, y + 6, 21, 10, '#d8b050');
            // Poule qui couve, crête rouge.
            R(g, bx + 6, y + 1, 13, 9, '#f4f0e8');
            R(g, bx + 16, y - 2, 5, 5, '#f4f0e8');
            R(g, bx + 17, y - 4, 3, 2, '#e04040');
            R(g, bx + 21, y, 2, 2, '#f0a030');
            R(g, bx + 2, y + 22, 21, 16, '#5a3a22');
            R(g, bx + 5, y + 30, 6, 5, '#fff6e8');
            R(g, bx + 13, y + 31, 6, 5, '#f4e0c8');
          }
        }
      },
      statue_elfe: {
        draw(g, x, y, W, H) {
          R(g, x + 8, y + 32, W - 16, 12, '#cfc8bc');
          R(g, x + 8, y + 32, W - 16, 3, '#ffffff');
          g.fillStyle = '#ece8e0';
          g.beginPath();
          g.moveTo(x + 14, y + 32);
          g.lineTo(x + W - 14, y + 32);
          g.lineTo(x + W - 18, y - 6);
          g.lineTo(x + 18, y - 6);
          g.fill();
          R(g, x + 18, y - 6, 3, 38, '#ffffff');
          R(g, x + 19, y - 22, 10, 14, '#ece8e0');
          R(g, x + 17, y - 22, 3, 18, '#cfc8bc');
          R(g, x + 28, y - 4, 10, 4, '#ece8e0');
          g.fillStyle = '#bfffee';
          g.beginPath();
          g.arc(x + 38, y - 10, 6, 0, Math.PI * 2);
          g.fill();
          R(g, x + 36, y - 13, 2, 2, '#ffffff');
        }
      },
      pilier_nain: {
        draw(g, x, y, W, H) {
          R(g, x + 6, y + 34, W - 12, 10, '#5a5048');
          R(g, x + 10, y - 50, W - 20, 86, '#786c60');
          R(g, x + 10, y - 50, 6, 86, '#9a8e80');
          R(g, x + W - 16, y - 50, 6, 86, '#5a5048');
          R(g, x + 6, y - 58, W - 12, 10, '#5a5048');
          for (let k = 0; k < 4; k++) R(g, x + 20, y - 38 + k * 18, 8, 3, '#ffb060');
          R(g, x + 18, y - 10, 12, 10, '#ffd36d');
          R(g, x + 21, y - 8, 6, 6, '#fff4b0');
        }
      }
    };

    return Object.freeze({
      FURNITURE_ART
    });
  }
  window.CANAAN_HOUSE_FURNITURE = Object.freeze({ create });
})();
