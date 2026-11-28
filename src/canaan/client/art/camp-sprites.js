// @ts-check
// Sprites des objets du Camp de l'Aurore (pixel art sur une grille de 2 pixels, aplats francs et contour net) :
// grange, silo, poulailler, foin, charrette, pommier, forge, salon de coiffure, fontaine, étal, panneaux, clôtures…
// Chaque sprite est dessiné une fois, au premier usage, puis gardé. Utilisés par scripts/camp/render.js et ground.js.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).
import { makeCanvas, outlineSprite } from './pixel-kit.js';

// Sprite pré-dessiné sur une grille de 2 pixels, avec le grain et le contour des décors du jeu.
const CACHE = new Map();
function sprite(name, w, h, paint) {
  let s = CACHE.get(name);
  if (s) return s;
  const cv = makeCanvas(w * 2, h * 2);
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
  const R = (x, y, ww, hh, col) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x) * 2, Math.round(y) * 2, Math.round(ww) * 2, Math.round(hh) * 2);
  };
  // Disque et ellipse pleins, case par case.
  const E = (ex, ey, rx, ry, col) => {
    for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
      for (let x = Math.floor(ex - rx); x <= ex + rx; x++)
        if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 <= 1) R(x, y, 1, 1, col);
  };
  const D = (dx, dy, r, col) => E(dx, dy, r, r, col);
  // Trait en escalier.
  const L = (x0, y0, x1, y1, col, wd = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) R(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, wd, wd, col);
  };
  paint(R, D, E, L);
  // Aplats francs, comme les maisons du camp (building-art.js) : pas de grain, un contour net.
  s = outlineSprite(cv, 2);
  CACHE.set(name, s);
  return s;
}
// Grange rouge : toit de bardeaux, pignon en planches avec la porte du fenil, grande porte à croix blanches.
const barnSprite = () =>
  sprite('grange', 120, 140, (R, D, E, L) => {
    const top = 10;
    // Toit : trapèze de bardeaux, plus clair à gauche, plus sombre à droite.
    for (let y = 6; y <= 82; y++) {
      const t = (y - 6) / 76,
        xl = Math.round(22 - 22 * t),
        xr = Math.round(98 + 22 * t),
        band = Math.floor((y - 6) / 5),
        first = (y - 6) % 5 === 0,
        last = (y - 6) % 5 === 4;
      R(xl, y + top, xr - xl, 1, first ? '#a85a40' : last ? '#552a1e' : band % 2 ? '#7a3a2a' : '#8a4432');
      R(xl, y + top, 4, 1, '#b8684a');
      R(xr - 5, y + top, 5, 1, '#4a2418');
      if (!first && !last) for (let x = xl + ((band * 7) % 9); x < xr; x += 9) R(x, y + top, 1, 1, '#5a2a1e');
    }
    R(22, 4 + top, 76, 3, '#4a2418');
    R(22, 4 + top, 76, 1, '#7a3a2a');
    // Pignon en planches rouges, bordé de blanc.
    for (let y = 16; y <= 82; y++) {
      const half = Math.round(((y - 16) / 66) * 30);
      R(60 - half, y + top, half * 2, 1, '#b03a2c');
      R(60 - half, y + top, Math.min(half, 6), 1, '#c8503c');
      for (let x = 60 - half + 3; x < 60 + half; x += 5) R(x, y + top, 1, 1, '#8a2a20');
      R(60 - half - 2, y + top, 2, 1, '#ece4d4');
      R(60 + half, y + top, 2, 1, '#b8ae9c');
    }
    // Porte du fenil, foin qui dépasse.
    R(49, 42 + top, 22, 24, '#ece4d4');
    R(51, 44 + top, 18, 20, '#3a1a12');
    R(51, 56 + top, 18, 8, '#e8c050');
    for (let k = 0; k < 6; k++) R(52 + k * 3, 53 + top + (k % 2), 1, 4, '#f6dc7a');
    R(50, 64 + top, 20, 2, '#b8ae9c');
    R(59, 30 + top, 2, 8, '#ece4d4');
    R(56, 33 + top, 8, 2, '#ece4d4');
    // Avant-toit.
    R(0, 82 + top, 120, 3, '#3a1a12');
    // Mur de façade en planches.
    for (let x = 4; x < 116; x++)
      R(
        x,
        85 + top,
        1,
        40,
        x < 12 ? '#c4503c' : x > 106 ? '#7a2a22' : (x - 4) % 5 === 0 ? '#7a2a22' : '#a8382c'
      );
    R(4, 85 + top, 112, 2, '#5a1e16');
    R(4, 85 + top, 4, 40, '#ece4d4');
    R(7, 85 + top, 1, 40, '#b8ae9c');
    R(112, 85 + top, 4, 40, '#c8beac');
    R(115, 85 + top, 1, 40, '#9a9282');
    // Fenêtres éclairées.
    for (const wx of [14, 90]) {
      R(wx, 94 + top, 16, 14, '#ece4d4');
      R(wx + 2, 96 + top, 12, 10, '#f0c860');
      R(wx + 2, 96 + top, 12, 3, '#ffe49a');
      R(wx + 7, 96 + top, 2, 10, '#ece4d4');
      R(wx + 2, 100 + top, 12, 2, '#ece4d4');
      R(wx - 1, 108 + top, 18, 2, '#b8ae9c');
    }
    // Grande porte à deux battants, croix blanches.
    R(42, 92 + top, 36, 34, '#ece4d4');
    R(44, 94 + top, 32, 32, '#6a2e20');
    R(44, 94 + top, 3, 32, '#8a4030');
    R(59, 94 + top, 2, 32, '#ece4d4');
    L(45, 95 + top, 58, 124 + top, '#ece4d4', 2);
    L(58, 95 + top, 45, 124 + top, '#ece4d4', 2);
    L(62, 95 + top, 75, 124 + top, '#ece4d4', 2);
    L(75, 95 + top, 62, 124 + top, '#ece4d4', 2);
    R(56, 108 + top, 2, 3, '#2a1a10');
    R(62, 108 + top, 2, 3, '#2a1a10');
    // Soubassement de pierres.
    for (let x = 2; x < 118; x += 6) {
      R(x, 125 + top, 6, 4, x % 12 ? '#8a8a84' : '#9e9a90');
      R(x, 125 + top, 6, 1, '#c4c0b4');
      R(x + 5, 126 + top, 1, 3, '#5e5e5a');
    }
    // Girouette en coq sur le faîte.
    R(59, top - 6, 2, 11, '#3a3a40');
    R(55, top - 8, 9, 4, '#4a4a52');
    R(62, top - 10, 3, 3, '#4a4a52');
    R(63, top - 11, 2, 1, '#c84a3a');
    R(53, top - 10, 3, 3, '#4a4a52');
  });
const siloSprite = () =>
  sprite('silo', 44, 112, (R, D, E, L) => {
    for (let y = 24; y < 108; y++)
      for (let x = 4; x < 40; x++) R(x, y, 1, 1, x < 11 ? '#d8d4ca' : x < 31 ? '#b4b0a6' : '#86827a');
    for (let y = 34; y < 108; y += 14) {
      R(4, y, 36, 1, '#6e6a62');
      R(4, y + 1, 36, 1, '#e4e0d8');
    }
    for (let y = 6; y < 26; y++)
      for (let x = 2; x < 42; x++) {
        const dx = (x + 0.5 - 22) / 20,
          dy = (y + 0.5 - 26) / 20;
        if (dx * dx + dy * dy <= 1) R(x, y, 1, 1, x < 12 ? '#c8503c' : x < 32 ? '#a83a2c' : '#7a2a22');
      }
    R(2, 24, 40, 2, '#5a1e16');
    R(20, 3, 4, 4, '#7a2a22');
    // Échelle et petite porte.
    R(33, 30, 1, 76, '#5a4a3a');
    R(37, 30, 1, 76, '#5a4a3a');
    for (let y = 32; y < 106; y += 5) R(33, y, 5, 1, '#7a6a58');
    R(14, 92, 12, 16, '#5a3a26');
    R(14, 92, 12, 2, '#7a5236');
    R(15, 99, 2, 2, '#c8a040');
  });
const coopSprite = () =>
  sprite('poulailler', 50, 56, (R, D, E, L) => {
    for (let y = 26; y < 52; y++)
      R(4, y, 42, 1, (y - 26) % 5 === 0 ? '#7a5634' : y < 30 ? '#d0a066' : '#b8864e');
    R(4, 26, 4, 26, '#d8aa70');
    R(42, 26, 4, 26, '#8a6438');
    for (let y = 6; y < 28; y++) {
      const t = (y - 6) / 22,
        xl = Math.round(12 - 12 * t),
        xr = Math.round(38 + 12 * t);
      R(xl, y, xr - xl, 1, (y - 6) % 4 === 0 ? '#c8603c' : (y - 6) % 4 === 3 ? '#6e2a1c' : '#a8442c');
      R(xr - 4, y, 4, 1, '#7a2a1e');
    }
    R(10, 4, 30, 3, '#6e2a1c');
    // Trou d'entrée, rampe à barreaux et nichoir de paille.
    R(20, 36, 10, 14, '#2a1a10');
    R(21, 34, 8, 2, '#2a1a10');
    L(24, 50, 34, 55, '#9a7448', 3);
    for (let k = 0; k < 3; k++) R(26 + k * 3, 51 + k, 1, 2, '#5e4430');
    R(9, 32, 8, 6, '#ece4d4');
    R(10, 33, 6, 4, '#3a2a1a');
    R(10, 35, 6, 2, '#e8c050');
    R(36, 31, 6, 7, '#f4f0e8');
    R(40, 29, 3, 3, '#f4f0e8');
    R(41, 28, 2, 1, '#e03a2a');
    R(43, 30, 1, 1, '#f0b030');
  });
// Bottes de foin rondes : la face coupée avec sa spirale, trois tons, et le lien de ficelle.
const hayBale = (R, D, x, y, r) => {
  D(x, y, r, '#b08a2e');
  D(x - 1, y - 1, r - 1, '#e2b84e');
  D(x - 2, y - 2, r - 4, '#f2d070');
  for (let k = 3; k < r; k += 3)
    for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * Math.PI * 2;
      if ((a + k) % 3)
        R(Math.round(x + Math.cos(ang) * k), Math.round(y + Math.sin(ang) * k), 1, 1, '#c89a38');
    }
  R(x - r + 1, y - 1, r * 2 - 2, 1, '#8a6a2a');
};
const haySprite = () =>
  sprite('foin', 72, 40, (R, D) => {
    hayBale(R, D, 13, 28, 11);
    hayBale(R, D, 36, 28, 11);
    hayBale(R, D, 59, 28, 11);
    hayBale(R, D, 24, 13, 10);
    hayBale(R, D, 47, 13, 10);
    for (let k = 0; k < 9; k++) R(4 + k * 7, 38, 3, 1, '#e8c860');
  });
const cartSprite = () =>
  sprite('charrette', 54, 40, (R, D, E, L) => {
    L(0, 22, 10, 18, '#6e4c32', 2);
    R(8, 12, 40, 14, '#8a6440');
    for (let y = 12; y < 26; y += 4) R(8, y, 40, 1, '#5e4430');
    R(8, 12, 40, 2, '#b08858');
    R(8, 12, 3, 14, '#a07850');
    R(45, 12, 3, 14, '#5e4430');
    // Chargement : courges et foin.
    D(18, 9, 5, '#d8701e');
    D(17, 8, 3, '#f09a3a');
    R(17, 3, 2, 3, '#5a7a2a');
    D(30, 9, 6, '#e8c050');
    D(29, 8, 4, '#f6dc7a');
    D(41, 9, 5, '#c8601a');
    D(40, 8, 3, '#e88a3a');
    for (const wx of [16, 40]) {
      D(wx, 29, 8, '#4e3422');
      D(wx, 29, 6, '#8a6440');
      D(wx - 1, 28, 4, '#a07850');
      L(wx - 6, 29, wx + 6, 29, '#4e3422');
      L(wx, 23, wx, 35, '#4e3422');
      D(wx, 29, 2, '#3a3a40');
    }
  });
const appleSprite = variant =>
  sprite('pommier' + variant, 46, 56, (R, D, E, L) => {
    // Tronc et racines.
    R(19, 32, 8, 22, '#6e4c32');
    R(19, 32, 2, 22, '#8a6440');
    R(25, 32, 2, 22, '#4a3220');
    R(15, 51, 6, 3, '#5a3e28');
    R(25, 51, 6, 3, '#4a3220');
    L(23, 36, 14, 26, '#6e4c32', 2);
    L(23, 34, 31, 25, '#5a3e28', 2);
    // Feuillage : masses sombres, moyennes puis reflets.
    for (const [x, y, r] of [
      [23, 20, 17],
      [12, 24, 10],
      [34, 24, 10],
      [23, 30, 10]
    ])
      D(x, y, r, '#3a7230');
    for (const [x, y, r] of [
      [23, 18, 15],
      [13, 21, 8],
      [32, 21, 8],
      [22, 27, 8]
    ])
      D(x, y, r, '#529a3a');
    for (const [x, y, r] of [
      [18, 12, 6],
      [28, 11, 4],
      [11, 18, 3]
    ])
      D(x, y, r, '#78c050');
    let h = variant * 13 + 5;
    const rnd = () => {
      h = (h * 9301 + 49297) % 233280;
      return h / 233280;
    };
    for (let k = 0; k < 40; k++) R(6 + rnd() * 34, 5 + rnd() * 30, 1, 1, rnd() < 0.5 ? '#2e5e26' : '#8ad060');
    // Pommes rouges.
    for (let k = 0; k < 11; k++) {
      const a = rnd() * Math.PI * 2,
        d = 3 + rnd() * 12,
        x = Math.round(23 + Math.cos(a) * d * 1.1),
        y = Math.round(20 + Math.sin(a) * d * 0.9);
      R(x, y, 3, 3, '#c8281e');
      R(x, y, 2, 2, '#e84a3a');
      R(x, y, 1, 1, '#ff9a8a');
      R(x + 1, y - 1, 1, 1, '#4a3220');
    }
  });
const crateSprite = () =>
  sprite('cagette', 24, 22, (R, D) => {
    R(1, 8, 22, 13, '#a87c4c');
    R(1, 8, 22, 2, '#c89a64');
    R(1, 14, 22, 1, '#7a5634');
    R(1, 8, 2, 13, '#c89a64');
    R(21, 8, 2, 13, '#6e4c32');
    for (let k = 0; k < 6; k++) {
      const x = 3 + k * 3,
        y = 4 + (k % 2);
      D(x + 1, y + 2, 2, '#c8281e');
      R(x, y + 1, 1, 1, '#ff8a7a');
    }
  });
const basketSprite = () =>
  sprite('panier', 22, 20, (R, D, E, L) => {
    E(11, 7, 9, 4, '#7a5634');
    for (let y = 7; y < 18; y++) R(2 + (y - 7) / 4, y, 18 - (y - 7) / 2, 1, y % 2 ? '#c8964e' : '#a87838');
    for (let x = 4; x < 19; x += 3) R(x, 8, 1, 9, '#8a6030');
    for (const [x, y] of [
      [6, 4],
      [10, 3],
      [14, 4],
      [8, 6],
      [12, 6]
    ]) {
      D(x, y, 2, '#c8281e');
      R(x - 1, y - 1, 1, 1, '#ff8a7a');
    }
    L(3, 7, 11, 0, '#8a6030');
    L(11, 0, 19, 7, '#8a6030');
  });
// Bûche vue par le bout : écorce, bois clair, cernes.
const logEnd = (R, D, x, y, r) => {
  D(x, y, r, '#5a3e28');
  D(x, y, r - 1, '#c9a06c');
  D(x - 0.5, y - 0.5, r - 2, '#e0bc88');
  D(x, y, Math.max(1, r - 3.5), '#c9a06c');
  R(x, y, 1, 1, '#8a6440');
};
const logsSprite = () =>
  sprite('buches', 50, 30, (R, D) => {
    R(4, 10, 42, 18, '#6e4c32');
    R(4, 10, 42, 2, '#9a7248');
    for (const [x, y] of [
      [9, 23],
      [19, 23],
      [29, 23],
      [39, 23],
      [14, 15],
      [24, 15],
      [34, 15],
      [19, 7],
      [29, 7]
    ])
      logEnd(R, D, x, y, 5);
  });
const woodpileSprite = () =>
  sprite('tas-de-bois', 74, 40, (R, D) => {
    // Abri de planches au-dessus du bois coupé.
    R(2, 4, 70, 5, '#5a3e28');
    R(2, 4, 70, 2, '#8a6440');
    R(3, 9, 3, 30, '#4e3627');
    R(68, 9, 3, 30, '#3e2a1e');
    for (let row = 0; row < 3; row++)
      for (let k = 0; k < 7; k++) {
        const x = 10 + k * 9 + (row % 2) * 4,
          y = 34 - row * 8;
        if (x > 64) continue;
        logEnd(R, D, x, y, 4.5);
      }
  });
const chopSprite = () =>
  sprite('billot', 26, 30, (R, D, E, L) => {
    R(4, 14, 18, 14, '#6e4c32');
    R(4, 14, 4, 14, '#8a6440');
    R(18, 14, 4, 14, '#4a3220');
    E(13, 14, 9, 4, '#c9a06c');
    E(12.5, 13.5, 7, 3, '#e0bc88');
    E(13, 14, 3, 1.5, '#b8905f');
    // Hache plantée.
    L(13, 13, 22, 1, '#8a6440', 2);
    R(9, 9, 6, 5, '#8a8a92');
    R(9, 9, 6, 1, '#c4c4cc');
    R(14, 10, 1, 4, '#5a5a62');
    for (const [x, y] of [
      [1, 26],
      [24, 25],
      [3, 29]
    ])
      R(x, y, 3, 2, '#c9a06c');
  });
// Forge : fourneau de pierre à la gueule rougeoyante, cheminée, soufflet de cuir, enclume et marteau.
const forgeSprite = () =>
  sprite('forge', 100, 78, (R, D, E, L) => {
    // Cheminée et fourneau.
    R(10, 2, 18, 30, '#6a6a72');
    R(10, 2, 18, 3, '#8a8a92');
    R(26, 2, 2, 30, '#4a4a52');
    R(4, 28, 44, 42, '#7a7a82');
    for (let y = 30; y < 70; y += 8)
      for (let x = 4 + ((y / 8) % 2) * 6; x < 46; x += 12) R(x, y, 11, 7, '#86868e');
    R(4, 28, 44, 3, '#9a9aa2');
    R(46, 28, 2, 42, '#56565e');
    // Gueule du fourneau (le feu s'anime par-dessus).
    R(14, 46, 24, 20, '#2a1a14');
    E(26, 46, 12, 6, '#2a1a14');
    // Soufflet.
    R(50, 52, 14, 8, '#7a4a2a');
    R(50, 52, 14, 2, '#a06a3a');
    L(64, 56, 72, 54, '#5a3a22', 2);
    // Enclume sur son billot.
    R(70, 58, 16, 14, '#6e4c32');
    R(70, 58, 4, 14, '#8a6440');
    R(66, 50, 26, 6, '#4a4e58');
    R(64, 50, 6, 3, '#4a4e58');
    R(72, 56, 14, 3, '#3a3e48');
    R(66, 50, 26, 2, '#7a7e88');
    // Marteau posé.
    L(80, 49, 90, 42, '#8a6440', 2);
    R(86, 38, 8, 5, '#5a5e68');
    R(86, 38, 8, 1, '#9a9ea8');
    // Seau d'eau et outils.
    R(92, 62, 7, 9, '#5a6070');
    R(92, 62, 7, 2, '#58a8e0');
  });
// Salon de coiffure (3 cases sur 2) : auvent rayé, enseigne de barbier (4 images : ses rayures tournent), fauteuil
// de cuir rouge sur son pied chromé, coiffeuse au miroir ovale (flacons, peigne, ciseaux), tapis rond devant.
const barberSprite = frame =>
  sprite('barbier' + frame, 72, 80, (R, D, E, L) => {
    // Tapis rond, sur la rangée du bas.
    E(38, 66, 30, 9, '#c8a050');
    E(38, 66, 28, 8, '#8a2a3a');
    E(38, 66, 20, 5, '#a8404e');
    E(38, 66, 8, 2, '#e0b860');
    // Plancher sous le mobilier.
    R(10, 50, 62, 6, '#8a6440');
    R(10, 50, 62, 1, '#b08a5a');
    for (let x = 18; x < 72; x += 10) R(x, 51, 1, 5, '#6a4a2e');
    // Poteaux de l'auvent.
    R(12, 10, 3, 42, '#6a4a2e');
    R(12, 10, 1, 42, '#9a7048');
    R(68, 10, 3, 42, '#6a4a2e');
    R(68, 10, 1, 42, '#9a7048');
    // Coiffeuse : meuble à tiroirs, miroir ovale dans son cadre doré.
    R(48, 36, 18, 15, '#7a4a2a');
    R(48, 36, 18, 2, '#a06a3a');
    R(64, 38, 2, 13, '#5a3420');
    R(50, 41, 14, 4, '#6a3e22');
    R(50, 46, 14, 4, '#6a3e22');
    R(56, 42, 2, 1, '#e0b860');
    R(56, 47, 2, 1, '#e0b860');
    E(57, 23, 8, 11, '#c8a050');
    E(57, 23, 7, 10, '#8a6a30');
    E(57, 23, 6, 9, '#bfe0f0');
    L(53, 19, 58, 15, '#ffffff', 1);
    L(54, 24, 60, 18, '#e8f6ff', 1);
    R(55, 33, 4, 3, '#8a6a30');
    // Flacons, peigne et ciseaux sur la coiffeuse.
    R(49, 31, 2, 5, '#5ab0e0');
    R(49, 30, 2, 1, '#e0e0e0');
    R(52, 32, 2, 4, '#e07ab0');
    R(52, 31, 2, 1, '#e0e0e0');
    R(60, 34, 5, 1, '#3a2a1e');
    for (let x = 61; x < 65; x += 2) R(x, 35, 1, 1, '#3a2a1e');
    D(46, 34, 1, '#b8c0c8');
    L(47, 34, 47, 30, '#d8e0e8', 1);
    // Fauteuil de barbier : pied chromé, repose-pieds, assise et dossier de cuir rouge, appuie-tête.
    R(26, 52, 14, 2, '#8a929a');
    R(31, 44, 4, 8, '#b8c0c8');
    R(31, 44, 1, 8, '#e8eef4');
    R(27, 44, 12, 2, '#8a929a');
    R(23, 36, 20, 7, '#a8322a');
    R(23, 36, 20, 2, '#d0564a');
    R(25, 20, 16, 17, '#a8322a');
    R(26, 21, 3, 15, '#d0564a');
    R(38, 21, 3, 15, '#7a2018');
    R(29, 15, 8, 5, '#a8322a');
    R(30, 15, 6, 1, '#d0564a');
    R(21, 32, 4, 3, '#b8c0c8');
    R(41, 32, 4, 3, '#b8c0c8');
    R(21, 32, 4, 1, '#e8eef4');
    R(41, 32, 4, 1, '#e8eef4');
    // Auvent rayé rouge et blanc, bord festonné.
    for (let x = 9; x < 74; x++) {
      const band = Math.floor((x - 9) / 6) % 2 ? '#f4ecdc' : '#c8382e';
      R(x, 3, 1, 9, band);
      if ((x - 9) % 6 < 4) R(x, 12, 1, 2, band);
    }
    R(9, 3, 65, 1, '#ffffff66');
    R(9, 2, 65, 1, '#7a2018');
    // Enseigne de barbier : socle et chapeaux de laiton, cylindre de verre aux rayures qui tournent.
    R(2, 50, 8, 4, '#a8802a');
    R(2, 50, 8, 1, '#e0c060');
    R(4, 46, 4, 4, '#a8802a');
    R(3, 14, 6, 32, '#f4f4f0');
    for (let y = 14; y < 46; y++)
      for (let x = 3; x < 9; x++) {
        const k = (((y + x - frame * 2) % 12) + 12) % 12;
        if (k < 3) R(x, y, 1, 1, '#c8382e');
        else if (k >= 6 && k < 9) R(x, y, 1, 1, '#3a5ab0');
      }
    R(3, 14, 1, 32, '#ffffff88');
    R(8, 14, 1, 32, '#00000022');
    R(2, 11, 8, 3, '#a8802a');
    R(2, 11, 8, 1, '#e0c060');
    D(6, 9, 2, '#e0c060');
  });
const fountainSprite = () =>
  sprite('fontaine', 76, 64, (R, D, E) => {
    // Margelle de pierre en ellipse, puis le flanc en blocs, puis l'eau sombre (l'eau vive se dessine par-dessus).
    E(38, 30, 36, 21, '#5e5e5a');
    for (let x = 2; x < 74; x++) {
      const dx = (x + 0.5 - 38) / 36;
      if (dx * dx > 1) continue;
      const yy = Math.round(30 + Math.sqrt(1 - dx * dx) * 21);
      const block = Math.floor((x - 2) / 8) + Math.floor(yy / 6);
      R(x, yy - 1, 1, 12, x < 14 ? '#b0aca0' : x > 60 ? '#6e6e68' : block % 2 ? '#8a8a84' : '#9e9a90');
      if ((x - 2) % 8 === 0) R(x, yy - 1, 1, 12, '#5e5e5a');
      R(x, yy + 4, 1, 1, '#6e6e68');
      R(x, yy + 10, 1, 1, '#4a4a46');
    }
    E(38, 30, 36, 21, '#a8a49a');
    E(37.5, 29.5, 35, 20, '#c4c0b4');
    E(38, 30, 33, 18, '#8a8a84');
    E(38, 30.5, 30, 16, '#1e5a7e');
    E(38, 31, 30, 15, '#2f7aa8');
  });
const pillarSprite = () =>
  sprite('fontaine-colonne', 30, 46, (R, D, E) => {
    R(11, 18, 8, 26, '#9e9a90');
    R(11, 18, 2, 26, '#c4c0b4');
    R(17, 18, 2, 26, '#6e6e68');
    R(9, 40, 12, 5, '#8a8a84');
    R(9, 40, 12, 1, '#c4c0b4');
    E(15, 16, 13, 5, '#6e6e68');
    E(15, 15, 13, 5, '#b0aca0');
    E(15, 15, 11, 3.5, '#2f7aa8');
    E(15, 14.5, 9, 2.5, '#5aa8d0');
    R(13, 4, 4, 11, '#9e9a90');
    R(13, 4, 1, 11, '#c4c0b4');
    D(15, 4, 3, '#b0aca0');
    R(14, 2, 2, 2, '#d8d4ca');
  });
// Jardinière de bois débordant de fleurs.
const planterSprite = v =>
  sprite('jardiniere' + v, 22, 22, (R, D) => {
    R(2, 12, 18, 9, '#9a6a40');
    R(2, 12, 18, 2, '#c89058');
    R(2, 19, 18, 2, '#6a4426');
    for (const x of [5, 10, 15]) R(x, 14, 1, 5, '#7a5230');
    const cols = [
      ['#f06a8a', '#ffe070'],
      ['#9a7ae0', '#ffffff'],
      ['#ff9a4a', '#ffd0e0']
    ][v % 3];
    for (const [x, y, r] of [
      [5, 9, 3],
      [11, 7, 4],
      [17, 9, 3],
      [8, 5, 2],
      [14, 4, 2]
    ])
      D(x, y, r, '#4e8a3a');
    for (const [x, y, r] of [
      [5, 8, 2],
      [11, 6, 3],
      [17, 8, 2]
    ])
      D(x - 1, y - 1, r - 1, '#74b04e');
    for (const [x, y, k] of [
      [4, 7, 0],
      [7, 4, 1],
      [11, 5, 0],
      [14, 3, 1],
      [17, 7, 0],
      [9, 9, 1],
      [13, 9, 0]
    ]) {
      R(x, y, 2, 2, cols[k]);
      R(x, y, 1, 1, '#ffffff');
    }
  });
// Étal du marché : comptoir de planches, auvent rayé sur deux perches, cageots de fruits et de légumes.
const stallSprite = () =>
  sprite('etal-marche', 72, 52, R => {
    R(4, 4, 2, 44, '#6a4426');
    R(66, 4, 2, 44, '#6a4426');
    for (let x = 0; x < 72; x += 8) {
      R(x, 2, 8, 10, (x / 8) % 2 ? '#fff4dc' : '#d8483a');
      R(x + 2, 12, 4, 2, (x / 8) % 2 ? '#fff4dc' : '#d8483a');
    }
    R(0, 2, 72, 1, '#ffffff');
    R(6, 30, 60, 6, '#b47c46');
    R(6, 30, 60, 1, '#d8a066');
    R(8, 36, 56, 12, '#8e5a30');
    for (let x = 10; x < 64; x += 6) R(x, 36, 1, 12, '#663c1e');
    const crates = [
      ['#e0503c', '#f07a5a'],
      ['#ffd060', '#fff0a0'],
      ['#7ad070', '#a8e890'],
      ['#c88ae8', '#e8b8ff']
    ];
    crates.forEach(([a, b], k) => {
      const x = 9 + k * 14;
      R(x, 24, 12, 6, '#a8703e');
      for (let i = 0; i < 4; i++) {
        R(x + 1 + i * 3, 21 + (i % 2), 3, 3, a);
        R(x + 1 + i * 3, 21 + (i % 2), 1, 1, b);
      }
    });
  });
// Panneau d'affichage : cadre de bois, petit toit, avis épinglés.
const boardSprite = () =>
  sprite('panneau-avis', 50, 50, R => {
    R(6, 14, 3, 34, '#6a4426');
    R(41, 14, 3, 34, '#6a4426');
    R(2, 8, 46, 6, '#86321f');
    R(2, 8, 46, 2, '#b84a32');
    R(5, 14, 40, 24, '#8e5a30');
    R(7, 16, 36, 20, '#c89a64');
    for (const [x, y, w, h, col] of /** @type {[number, number, number, number, string][]} */ ([
      [9, 17, 10, 12, '#fff6e4'],
      [21, 18, 9, 8, '#f6e0a0'],
      [32, 17, 9, 13, '#fff6e4'],
      [20, 28, 11, 7, '#e8f0ff']
    ])) {
      R(x, y, w, h, col);
      R(x + 1, y + 3, w - 2, 1, '#9a8a70');
      R(x + 1, y + 5, w - 3, 1, '#9a8a70');
      R(x + Math.floor(w / 2), y, 1, 1, '#d8483a');
    }
  });
// Poteau indicateur à trois flèches.
const signpostSprite = () =>
  sprite('poteau-indicateur', 44, 56, R => {
    R(20, 6, 4, 48, '#6a4426');
    R(20, 6, 1, 48, '#9a6a40');
    for (const [x, y, w, dir, col] of /** @type {[number, number, number, number, string][]} */ ([
      [22, 8, 20, 1, '#c89058'],
      [2, 18, 20, -1, '#b47c46'],
      [22, 28, 18, 1, '#c89058']
    ])) {
      R(x - (dir < 0 ? 0 : 0), y, w, 7, col);
      R(x, y, w, 1, '#e0b078');
      if (dir > 0) {
        R(x + w, y + 1, 2, 5, col);
        R(x + w + 2, y + 2, 1, 3, col);
      } else {
        R(x - 2, y + 1, 2, 5, col);
        R(x - 3, y + 2, 1, 3, col);
      }
      R(x + 3, y + 3, w - 6, 1, '#5a3a20');
    }
  });
const benchSprite = () =>
  sprite('banc-jardin', 50, 26, R => {
    R(4, 2, 42, 4, '#8a6440');
    R(4, 2, 42, 1, '#b08858');
    R(4, 8, 42, 3, '#7a5634');
    R(2, 12, 46, 5, '#a07850');
    R(2, 12, 46, 1, '#c89a64');
    R(2, 16, 46, 1, '#5e4430');
    for (const x of [5, 42]) {
      R(x, 2, 3, 22, '#5e4430');
      R(x, 2, 1, 22, '#7a5634');
    }
  });
const birdbathSprite = () =>
  sprite('bain-oiseaux', 24, 34, (R, D, E) => {
    R(9, 14, 6, 16, '#9e9a90');
    R(9, 14, 2, 16, '#c4c0b4');
    R(13, 14, 2, 16, '#6e6e68');
    E(12, 31, 8, 3, '#8a8a84');
    E(12, 12, 11, 4, '#6e6e68');
    E(12, 11, 11, 4, '#b0aca0');
    E(12, 11, 9, 2.5, '#2f7aa8');
    E(11.5, 10.5, 6, 1.5, '#7ac0e0');
    // Petit oiseau sur le rebord.
    R(17, 5, 5, 4, '#7a5a3a');
    R(20, 3, 3, 3, '#7a5a3a');
    R(22, 4, 2, 1, '#f0b030');
    R(21, 4, 1, 1, '#1a1418');
    R(17, 6, 3, 2, '#c87a4a');
    R(15, 6, 2, 1, '#5a3e28');
  });
const springSprite = () =>
  sprite('source', 40, 26, (R, D) => {
    for (const [x, y, r, k] of [
      [9, 16, 8, 0],
      [30, 15, 9, 1],
      [20, 9, 8, 2],
      [33, 21, 5, 3],
      [6, 22, 5, 4]
    ]) {
      D(x, y, r, '#5e5e5a');
      D(x - 1, y - 1, r - 1, k % 2 ? '#8a8a84' : '#9e9a90');
      D(x - 2, y - 2, r - 4, '#c4c0b4');
      D(x + 1, y - r + 2, 2, '#4f8a3a');
      R(x - 2, y - r + 1, 3, 1, '#6aa84a');
    }
    R(16, 16, 8, 10, '#2f7aa8');
    R(17, 16, 2, 10, '#9fd4ea');
  });
const troughSprite = () =>
  sprite('abreuvoir', 26, 16, R => {
    R(1, 3, 24, 10, '#6e4c32');
    R(1, 3, 24, 2, '#9a7248');
    R(3, 5, 20, 4, '#2f7aa8');
    R(3, 5, 20, 1, '#7ac0e0');
    R(3, 13, 3, 3, '#4e3627');
    R(20, 13, 3, 3, '#4e3627');
  });
const archSprite = () =>
  sprite('arche', 52, 60, (R, D) => {
    for (const x of [3, 45]) {
      R(x, 12, 4, 48, '#ece6d8');
      R(x, 12, 1, 48, '#ffffff');
      R(x + 3, 12, 1, 48, '#9a9282');
    }
    for (let k = 0; k <= 20; k++) {
      const a = Math.PI + (k / 20) * Math.PI,
        x = 26 + Math.cos(a) * 21,
        y = 16 + Math.sin(a) * 13;
      D(x, y, 4, '#3e7a2e');
      D(x - 0.5, y - 0.5, 3, '#5a9a3a');
    }
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI + (k / 12) * Math.PI + 0.1,
        x = 26 + Math.cos(a) * 21,
        y = 16 + Math.sin(a) * 13;
      R(x - 1, y - 1, 3, 3, k % 3 ? '#e04a6a' : '#f6a0b8');
      R(x - 1, y - 1, 1, 1, '#ffd0dc');
    }
    for (let y = 20; y < 56; y += 6) {
      D(5, y, 3, '#4a8a36');
      D(47, y + 3, 3, '#4a8a36');
      R(4, y - 1, 2, 2, '#e04a6a');
      R(46, y + 2, 2, 2, '#f6a0b8');
    }
  });
const scarecrowSprite = () =>
  sprite('epouvantail', 30, 52, (R, D, E, L) => {
    R(14, 12, 3, 40, '#6e4c32');
    R(14, 12, 1, 40, '#8a6440');
    R(2, 20, 26, 3, '#7a5634');
    // Chemise rapiécée, bras de paille.
    R(8, 20, 15, 16, '#4a6ab0');
    R(8, 20, 4, 16, '#6a8ad0');
    R(19, 20, 4, 16, '#34508a');
    R(10, 27, 4, 4, '#c84a3a');
    R(17, 31, 4, 3, '#e8c050');
    for (const x of [0, 26]) for (let k = 0; k < 3; k++) R(x + k, 21 + k, 1, 3, '#e8c860');
    // Tête de toile et chapeau.
    D(15, 13, 6, '#d8c090');
    D(14, 12, 4, '#ecd8a8');
    R(12, 12, 2, 2, '#2a1a10');
    R(17, 12, 2, 2, '#2a1a10');
    R(13, 16, 5, 1, '#8a5a30');
    R(4, 6, 22, 3, '#6e5030');
    R(9, 0, 12, 7, '#8a6438');
    R(9, 0, 3, 7, '#a07850');
    R(9, 4, 12, 2, '#c84a3a');
    for (let k = 0; k < 4; k++) R(10 + k * 3, 19, 1, 3, '#e8c860');
  });
const fenceSprite = garden =>
  sprite(garden ? 'cloture-blanche' : 'cloture', 24, 22, R => {
    const [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'];
    if (garden) {
      // Piquets blancs pointus, reliés par une traverse.
      for (let x = 0; x < 24; x += 6) {
        R(x + 1, 4, 4, 18, m);
        R(x + 1, 4, 1, 18, l);
        R(x + 4, 4, 1, 18, d);
        R(x + 2, 2, 2, 2, m);
      }
      R(0, 9, 24, 2, d);
      R(0, 16, 24, 2, d);
    } else {
      R(0, 6, 24, 4, m);
      R(0, 6, 24, 1, l);
      R(0, 9, 24, 1, d);
      R(0, 14, 24, 4, m);
      R(0, 14, 24, 1, l);
      R(0, 17, 24, 1, d);
      R(1, 2, 5, 20, m);
      R(1, 2, 2, 20, l);
      R(5, 2, 1, 20, d);
      R(1, 2, 5, 1, l);
    }
  });
const fencePost = garden =>
  sprite(garden ? 'piquet-blanc' : 'piquet', 8, 26, R => {
    const [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'];
    R(1, 2, 6, 24, m);
    R(1, 2, 2, 24, l);
    R(6, 2, 1, 24, d);
    R(2, 0, 4, 2, m);
  });
// Barrière de l'enclos, deux battants fermés avec leur écharpe en diagonale.
const gateSprite = () =>
  sprite('barriere', 48, 24, (R, D, E, L) => {
    for (const x0 of [2, 25]) {
      for (const y of [6, 13]) {
        R(x0 + 1, y, 19, 4, '#9a7048');
        R(x0 + 1, y, 19, 1, '#c09060');
        R(x0 + 1, y + 3, 19, 1, '#5e4430');
      }
      R(x0 + 1, 4, 3, 18, '#a07850');
      R(x0 + 17, 4, 3, 18, '#5e4430');
      L(x0 + 3, 19, x0 + 17, 6, '#c09060', 2);
    }
    R(23, 10, 2, 5, '#3a3a40');
    for (const x of [0, 45]) {
      R(x, 0, 4, 24, '#8a6440');
      R(x, 0, 1, 24, '#b08858');
    }
  });

export const CANAAN_CAMP_SPRITES = Object.freeze({
  sprite,
  barnSprite,
  siloSprite,
  coopSprite,
  haySprite,
  cartSprite,
  appleSprite,
  crateSprite,
  basketSprite,
  logsSprite,
  woodpileSprite,
  chopSprite,
  forgeSprite,
  barberSprite,
  fountainSprite,
  pillarSprite,
  planterSprite,
  stallSprite,
  boardSprite,
  signpostSprite,
  benchSprite,
  birdbathSprite,
  springSprite,
  troughSprite,
  archSprite,
  scarecrowSprite,
  fenceSprite,
  fencePost,
  gateSprite
});
