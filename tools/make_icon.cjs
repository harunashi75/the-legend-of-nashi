#!/usr/bin/env node
// Icône du jeu (build/icon.png, 512 × 512) : une épée dorée sur un écu vert, en pixel art.
//
// Dessinée sur une grille de 32 × 32 pixels d'art, dans la facture du kit de pixel art du jeu (client/art/pixel-kit.js) :
// aplats de quelques tons par matière, lumière venue d'en haut à gauche, contour d'un pixel d'encre #2a1810, puis
// agrandie 16 fois sans flou. electron-builder en tire les icônes de Windows (.ico) et de Linux.
//
//   node tools/make_icon.cjs            # écrit build/icon.png
// Pour une autre icône, remplacer simplement build/icon.png (PNG carré de 512 × 512 au moins).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const N = 32,
  SCALE = 16,
  INK = [0x2a, 0x18, 0x10, 255];
const grid = Array.from({ length: N }, () => Array(N).fill(null));
const hexc = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).concat(255);
const px = (x, y, col) => {
  if (x >= 0 && x < N && y >= 0 && y < N) grid[y][x] = hexc(col);
};
// Arrondi au pair le plus proche sur les demi-entiers (comme la première version de l'outil) : même icône.
const roundEven = v => {
  const r = Math.round(v);
  return Math.abs(v % 1) === 0.5 && r % 2 ? r - 1 : r;
};

// Écu : vert, bord doré, éclairé en haut à gauche.
const GREEN = ['#9ad868', '#6eb048', '#4a8a34', '#2e6224'];
const GOLD = ['#fff4b0', '#f0d060', '#c8a038', '#8a6a1e'];
for (let y = 4; y < 29; y++) {
  // Largeur : droite en haut, puis se resserre en pointe.
  const half = y < 16 ? 11 : Math.max(0, roundEven(11 * (1 - ((y - 16) / 13) ** 1.6)));
  for (let x = 16 - half; x < 16 + half; x++) {
    const rim =
      x === 16 - half ||
      x === 16 + half - 1 ||
      y === 4 ||
      (y > 16 && (x - (16 - half) < 1 || 16 + half - 1 - x < 1));
    const lit = -(x - 16) / 11 - (y - 12) / 16;
    const t = lit > 0.6 ? 0 : lit > 0 ? 1 : lit > -0.6 ? 2 : 3;
    px(x, y, rim ? GOLD[Math.min(3, t + 1)] : GREEN[t]);
  }
}
// Croix dorée sur l'écu.
for (let y = 8; y < 24; y++) (px(15, y, GOLD[1]), px(16, y, GOLD[2]));
for (let x = 9; x < 23; x++) (px(x, 13, GOLD[1]), px(x, 14, GOLD[2]));

// Épée en diagonale (de bas à gauche vers haut à droite) : lame d'acier, garde et pommeau dorés.
const STEEL = ['#ffffff', '#dfe8f0', '#aab6c4', '#6e7c8c'];
for (let i = 0; i < 19; i++) {
  const x = 9 + i,
    y = 22 - i;
  (px(x, y, STEEL[1]), px(x + 1, y, STEEL[2]), px(x, y - 1, i > 2 ? STEEL[0] : STEEL[1]));
}
(px(28, 2, STEEL[1]), px(29, 2, STEEL[2]), px(29, 1, STEEL[1]));
for (let d = -3; d < 4; d++) (px(8 + d, 22 + d, GOLD[1]), px(9 + d, 22 + d, GOLD[2])); // garde
for (let i = 1; i < 5; i++) (px(8 - i, 23 + i, '#8e5a30'), px(9 - i, 23 + i, '#663c1e')); // poignée
(px(3, 28, GOLD[0]), px(4, 28, GOLD[1]), px(3, 29, GOLD[2]), px(4, 29, GOLD[3])); // pommeau

// Contour d'un pixel d'encre autour de toutes les formes (comme outline du kit).
const edge = [];
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++)
    if (
      !grid[y][x] &&
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ].some(([dx, dy]) => grid[y + dy]?.[x + dx])
    )
      edge.push([x, y]);
for (const [x, y] of edge) grid[y][x] = INK;

// PNG RGBA agrandi sans flou (chaque ligne précédée de son filtre 0).
const W = N * SCALE;
const raw = Buffer.alloc((W * 4 + 1) * W);
for (let y = 0; y < W; y++)
  for (let x = 0; x < W; x++) {
    const c = grid[Math.floor(y / SCALE)][Math.floor(x / SCALE)] || [0, 0, 0, 0];
    raw.set(c, y * (W * 4 + 1) + 1 + x * 4);
  }
const chunk = (type, data) => {
  const len = Buffer.alloc(4),
    crc = Buffer.alloc(4),
    body = Buffer.concat([Buffer.from(type), data]);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([len, body, crc]);
};
const header = Buffer.alloc(13);
header.writeUInt32BE(W, 0);
header.writeUInt32BE(W, 4);
header.set([8, 6, 0, 0, 0], 8); // 8 bits, RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);
const out = path.join(__dirname, '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('Icône écrite : build/icon.png');
