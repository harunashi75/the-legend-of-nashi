// @ts-check
// Textures et cases en pixel art des donjons et des raids : sols, faces et dessus des murs, dangers (braises, eau,
// gouffres…), motifs du chemin principal, à la palette de chaque instance. Peintes une fois par instance et gardées.
// scripts/dungeons/render.js appelle CANAAN_DUNGEON_TILES.create(thèmes) une fois.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).
import { makeCanvas } from './pixel-kit.js';

function create(scene) {
  // hash, field : bruit reproductible de l'île (mêmes textures chez tous).
  const { THEMES, hash, field } = scene;

  // ---------------------------------------------------------------- Textures des cases
  // Toile vierge (kit de pixel art), aussi prêtée au décor des donjons.
  const canvas = makeCanvas;
  const ART = [];
  function rect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function specks(g, n, cols, seed, size = 3) {
    for (let k = 0; k < n; k++) {
      const x = Math.floor(hash(k, seed, 3) * 16) * 3,
        y = Math.floor(hash(seed, k, 5) * 16) * 3;
      g.globalAlpha = 0.25 + hash(k, seed, 9) * 0.5;
      rect(g, x, y, size * (k % 3 === 0 ? 2 : 1), size - 1, cols[k % cols.length]);
    }
    g.globalAlpha = 1;
  }
  function paintFloor(g, p, v, style) {
    rect(g, 0, 0, 48, 48, p.a);
    const s = v * 31 + 7;
    if (style === 'dirt' || style === 'gravel') {
      specks(g, 46, [p.b, p.c, p.b], s);
      for (let k = 0; k < (style === 'gravel' ? 9 : 3); k++) {
        const x = 4 + hash(k, s, 1) * 38,
          y = 4 + hash(s, k, 2) * 38;
        rect(g, x, y + 2, 6, 2, p.b);
        rect(g, x, y, 6, 3, p.c);
      }
    } else if (style === 'stone') {
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.45;
        rect(
          g,
          hash(k, s, 4) * 36,
          hash(s, k, 6) * 36,
          9 + hash(k, s) * 9,
          6 + hash(s, k) * 8,
          k % 2 ? p.b : p.c
        );
      }
      g.globalAlpha = 1;
      specks(g, 26, [p.b, p.c], s);
      rect(g, 6 + v * 7, 30, 14, 1, p.b);
      rect(g, 19 + v * 7, 31, 1, 6, p.b);
    } else if (style === 'tiles' || style === 'marble' || style === 'basalt' || style === 'arcane') {
      for (let ty = 0; ty < 2; ty++)
        for (let tx = 0; tx < 2; tx++) {
          const shade = hash(tx + v * 2, ty, 11);
          g.globalAlpha = 0.18;
          rect(g, tx * 24, ty * 24, 24, 24, shade > 0.5 ? p.c : p.b);
          g.globalAlpha = 1;
        }
      if (style === 'marble') {
        g.strokeStyle = p.b;
        g.globalAlpha = 0.55;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, 10 + v * 6);
        g.lineTo(18, 20 + v * 3);
        g.lineTo(34, 14 + v * 5);
        g.lineTo(48, 26 - v * 2);
        g.stroke();
        g.globalAlpha = 1;
        rect(g, 0, 0, 48, 1, p.c);
        rect(g, 0, 0, 1, 48, p.c);
        rect(g, 23, 23, 2, 2, p.c);
      } else {
        rect(g, 0, 23, 48, 2, p.b);
        rect(g, 23, 0, 2, 48, p.b);
        rect(g, 0, 0, 48, 1, p.b);
        rect(g, 0, 0, 1, 48, p.b);
        rect(g, 1, 1, 22, 1, p.c);
        rect(g, 25, 25, 22, 1, p.c);
      }
      if (style === 'basalt' && v === 3) {
        rect(g, 6, 12, 10, 1, '#ff7a2a');
        rect(g, 15, 12, 1, 7, '#ff7a2a');
        rect(g, 15, 18, 12, 1, '#ffb14a');
      }
      if (style === 'arcane' && v % 2 === 0) {
        g.globalAlpha = 0.7;
        rect(g, 8, 11, 8, 1, p.glow);
        rect(g, 32, 35, 8, 1, p.glow);
        rect(g, 11, 8, 1, 7, p.glow);
        rect(g, 36, 32, 1, 7, p.glow);
        g.globalAlpha = 1;
      }
      if (style === 'tiles' && v === 3) {
        rect(g, 4, 6, 9, 1, p.b);
        rect(g, 12, 6, 1, 8, p.b);
      }
    } else if (style === 'flagstone') {
      for (let row = 0; row < 3; row++) {
        let x = -((v * 7 + row * 11) % 18);
        while (x < 48) {
          const w = 15 + Math.floor(hash(x, row, v) * 10);
          g.globalAlpha = 0.25;
          rect(g, x, row * 16, w, 16, hash(row, x, v + 3) > 0.5 ? p.c : p.b);
          g.globalAlpha = 1;
          rect(g, x, row * 16, 2, 16, p.b);
          rect(g, x + 2, row * 16 + 1, w - 3, 1, p.c);
          x += w;
        }
        rect(g, 0, row * 16, 48, 2, p.b);
      }
    } else if (style === 'planks' || style === 'logs') {
      // Plancher (intérieurs) : lames ou rondins, arête claire, joint sombre, raccords cloués et nœuds.
      const n = style === 'logs' ? 3 : 4,
        hgt = 48 / n;
      for (let row = 0; row < n; row++) {
        const y = row * hgt,
          seam = 4 + Math.floor(hash(row, v, 17) * 38);
        g.globalAlpha = 0.25;
        rect(g, 0, y, 48, hgt, hash(row, v, 13) > 0.5 ? p.c : p.b);
        g.globalAlpha = 1;
        rect(g, 0, y, 48, 1, p.c);
        rect(g, 0, y + hgt - 2, 48, 2, p.b);
        rect(g, seam, y, 2, hgt - 2, p.b);
        rect(g, seam + 2, y + 1, 1, hgt - 3, p.c);
        rect(g, seam - 4, y + hgt / 2 - 1, 2, 2, p.b);
        rect(g, seam + 5, y + hgt / 2 - 1, 2, 2, p.b);
        if (hash(v, row, 19) > 0.55) {
          const kx = 6 + hash(row, v, 21) * 32;
          rect(g, kx, y + hgt / 2 - 2, 6, 3, p.b);
          rect(g, kx + 1, y + hgt / 2 - 1, 3, 1, p.c);
        }
      }
      specks(g, 12, [p.b, p.c], s, 2);
    } else if (style === 'starstone') {
      specks(g, 18, [p.b], s, 4);
      for (let k = 0; k < 7; k++) {
        g.globalAlpha = 0.35 + hash(k, s) * 0.6;
        rect(g, hash(k, s, 2) * 47, hash(s, k, 8) * 47, 1, 1, p.c);
      }
      if (v === 0) {
        g.globalAlpha = 0.25;
        g.strokeStyle = p.c;
        g.beginPath();
        g.moveTo(8 + v * 3, 10);
        g.lineTo(22, 18 + v * 2);
        g.lineTo(36 - v * 2, 12);
        g.stroke();
        g.globalAlpha = 1;
      }
      rect(g, 0, 0, 48, 1, '#2e3670');
      rect(g, 0, 0, 1, 48, '#2e3670');
    }
  }
  function paintFace(g, w, v) {
    rect(g, 0, 0, 48, 48, w.face);
    if (w.style === 'brick') {
      for (let row = 0; row < 4; row++) {
        const y = 10 + row * 10,
          off = row % 2 ? 0 : 8;
        rect(g, 0, y, 48, 2, w.dark);
        for (let x = -off; x < 48; x += 16) {
          rect(g, x, y, 2, 10, w.dark);
          rect(g, x + 2, y + 2, 12, 1, w.light);
          if (hash(x, row, v) > 0.7) {
            g.globalAlpha = 0.3;
            rect(g, x + 3, y + 3, 11, 6, w.dark);
            g.globalAlpha = 1;
          }
        }
      }
    } else if (w.style === 'marble') {
      rect(g, 4, 12, 40, 32, w.light);
      rect(g, 6, 14, 36, 28, w.face);
      rect(g, 0, 10, 48, 2, '#d4aa3a');
      rect(g, 22, 18, 4, 20, w.dark);
    } else {
      for (let k = 0; k < 7; k++) {
        const y = 10 + k * 5 + Math.floor(hash(k, v, 2) * 3),
          x = Math.floor(hash(v, k, 4) * 30);
        rect(g, x, y, 10 + hash(k, v) * 16, 3, k % 2 ? w.dark : w.light);
      }
      specks(g, 16, [w.dark, w.light], v + 50);
    }
    // Couronnement du mur et pied ombré.
    rect(g, 0, 0, 48, 10, w.top);
    rect(g, 0, 9, 48, 2, w.light);
    g.globalAlpha = 0.45;
    rect(g, 0, 43, 48, 5, '#000');
    g.globalAlpha = 1;
  }
  function paintHazard(g, h, v) {
    rect(g, 0, 0, 48, 48, h.a);
    const wrap = (x, y, w, hh, col) => {
      rect(g, x, y, w, hh, col);
      if (x + w > 48) rect(g, x - 48, y, w, hh, col);
    };
    if (h.style === 'water') {
      for (let k = 0; k < 7; k++) wrap(hash(k, v, 1) * 48, 4 + k * 6, 9, 2, k % 2 ? h.c : h.b);
    } else if (h.style === 'lava') {
      for (let k = 0; k < 9; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 5) * 46, 8 + hash(k, k) * 10, 3, h.b);
      for (let k = 0; k < 5; k++) wrap(hash(k, v, 7) * 48, hash(v, k, 9) * 46, 4, 2, h.c);
      g.globalAlpha = 0.5;
      for (let k = 0; k < 3; k++) wrap(hash(k, v, 11) * 48, hash(v, k, 13) * 44, 10, 5, '#5a1806');
      g.globalAlpha = 1;
    } else if (h.style === 'stars' || h.style === 'void') {
      g.globalAlpha = 0.35;
      for (let k = 0; k < 4; k++) wrap(hash(k, v, 2) * 48, hash(v, k, 4) * 40, 16, 8, h.b);
      g.globalAlpha = 1;
      for (let k = 0; k < 9; k++)
        wrap(hash(k, v, 6) * 48, hash(v, k, 8) * 48, k % 4 ? 1 : 2, k % 4 ? 1 : 2, h.c);
    } else if (h.style === 'clouds') {
      for (let k = 0; k < 6; k++) {
        const x = hash(k, v, 1) * 48,
          y = hash(v, k, 2) * 44,
          r = 6 + hash(k, v) * 7;
        for (const dx of [0, -48]) {
          g.fillStyle = k % 2 ? h.b : h.c;
          g.globalAlpha = 0.6;
          g.beginPath();
          g.arc(x + dx, y, r, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
    } else if (h.style === 'blood') {
      for (let k = 0; k < 5; k++) wrap(hash(k, v, 1) * 48, hash(v, k, 2) * 46, 7, 2, h.b);
      for (let k = 0; k < 3; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 4) * 46, 3, 1, h.c);
    } else {
      specks(g, 10, [h.b, h.c], v + 90, 2);
    }
  }
  // ---------------------------------------------------------------- Cases en pixel art
  // Même facture que les bâtiments, les routes et le sol de l'île : gros pixels de 3 px (16 × 16 par case), aplats de
  // 3 à 4 tons, joints sombres, reflet en haut à gauche de chaque dalle ou pierre, pied des murs ombré.
  const PXU = 3;
  const toRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixHex = (a, b, t) => {
    const A = toRgb(a),
      B = toRgb(b);
    return (
      '#' +
      A.map((v, k) =>
        Math.round(v + (B[k] - v) * t)
          .toString(16)
          .padStart(2, '0')
      ).join('')
    );
  };
  function pxDot(g, x, y, col, w = 1, h = 1) {
    g.fillStyle = col;
    g.fillRect(x * PXU, y * PXU, w * PXU, h * PXU);
  }
  // Dalle : aplat, reflet en haut et à gauche, ombre en bas et à droite, quelques grains et parfois une fissure.
  function pxSlab(g, x, y, w, h, base, p, seed) {
    pxDot(g, x, y, base, w, h);
    pxDot(g, x, y, mixHex(base, '#ffffff', 0.14), w, 1);
    pxDot(g, x, y, mixHex(base, '#ffffff', 0.08), 1, h);
    pxDot(g, x, y + h - 1, mixHex(base, p.b, 0.45), w, 1);
    pxDot(g, x + w - 1, y, mixHex(base, p.b, 0.3), 1, h);
    if (hash(seed, x, y) > 0.55)
      pxDot(
        g,
        x + 1 + Math.floor(hash(x, seed, y) * (w - 2)),
        y + 1 + Math.floor(hash(y, x, seed) * (h - 2)),
        mixHex(base, p.b, 0.5)
      );
    if (hash(x, y, seed + 7) > 0.86 && w > 4) {
      const cx = x + 2 + Math.floor(hash(seed, y, 3) * (w - 4));
      pxDot(g, cx, y + 1, mixHex(base, p.b, 0.7));
      pxDot(g, cx + 1, y + 2, mixHex(base, p.b, 0.7));
    }
  }
  function slabTone(p, k) {
    return [p.a, mixHex(p.a, p.c, 0.35), mixHex(p.a, p.b, 0.3), p.a][Math.floor(k * 4)];
  }
  function pxFloor(g, p, v, style) {
    const joint = mixHex(p.b, '#000000', 0.25),
      seed = v * 31 + 7;
    pxDot(g, 0, 0, joint, 16, 16);
    if (style === 'dirt' || style === 'gravel') {
      // Terre battue : taches de tons par bruit doux, cailloux éclairés en haut.
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const n = field(x / 5 + v * 3, y / 5, 2.2, 91) + (hash(x, y, seed) - 0.5) * 0.18;
          pxDot(g, x, y, n > 0.62 ? mixHex(p.a, p.c, 0.45) : n < 0.36 ? mixHex(p.a, p.b, 0.4) : p.a);
        }
      for (let k = 0; k < (style === 'gravel' ? 6 : 3); k++) {
        const x = 1 + Math.floor(hash(k, seed, 1) * 13),
          y = 1 + Math.floor(hash(seed, k, 2) * 13);
        pxDot(g, x, y + 1, mixHex(p.b, '#000000', 0.2), 2, 1);
        pxDot(g, x, y, p.c, 2, 1);
      }
      return;
    }
    if (style === 'planks' || style === 'logs') {
      for (let row = 0; row < 4; row++) {
        const seam = 2 + Math.floor(hash(row, v, 17) * 12);
        pxSlab(g, 0, row * 4, seam, 3, slabTone(p, hash(row, v, 3)), p, seed + row);
        pxSlab(g, seam + 1, row * 4, 15 - seam, 3, slabTone(p, hash(row, v, 5)), p, seed + row + 9);
      }
      return;
    }
    if (style === 'flagstone' || style === 'stone') {
      // Dalles irrégulières en rangées décalées.
      const rows = style === 'stone' ? [5, 5, 6] : [8, 8];
      let y = 0;
      rows.forEach((hgt, row) => {
        let x = -Math.floor(hash(row, v, 23) * 5);
        while (x < 16) {
          const w = (style === 'stone' ? 4 : 5) + Math.floor(hash(x + 9, row, v) * 5),
            x0 = Math.max(0, x),
            x1 = Math.min(16, x + w);
          if (x1 - x0 > 1)
            pxSlab(g, x0, y, x1 - x0 - 1, hgt - 1, slabTone(p, hash(x, row, v + 3)), p, seed + x * 3 + row);
          x += w;
        }
        y += hgt;
      });
      return;
    }
    // Carreaux carrés (temples, marbre, basalte, arcanes, pierre d'étoiles).
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++)
        pxSlab(g, tx * 8, ty * 8, 7, 7, slabTone(p, hash(tx + v * 2, ty, 11)), p, seed + tx * 5 + ty);
    if (style === 'marble') {
      for (let k = 0; k < 6; k++) pxDot(g, 2 + k * 2, 3 + ((k * 3 + v) % 4), mixHex(p.a, p.b, 0.5));
      pxDot(g, 7, 7, p.c, 2, 2);
    }
    if (style === 'basalt' && v === 3) {
      pxDot(g, 2, 4, '#ff7a2a', 3, 1);
      pxDot(g, 4, 5, '#ffb14a', 1, 2);
      pxDot(g, 5, 6, '#ff7a2a', 3, 1);
    }
    if (style === 'arcane' && v % 2 === 0) {
      pxDot(g, 3, 3, p.glow, 2, 1);
      pxDot(g, 3, 3, p.glow, 1, 2);
      pxDot(g, 11, 11, p.glow, 2, 1);
      pxDot(g, 12, 11, p.glow, 1, 2);
    }
    if (style === 'starstone')
      for (let k = 0; k < 4; k++)
        pxDot(g, Math.floor(hash(k, seed, 2) * 15), Math.floor(hash(seed, k, 8) * 15), p.c);
  }
  // Chemin principal : tapis à motif, rails, dalles runiques ou grille au-dessus des braises.
  function pxAccent(g, p, floor, v) {
    if (p.style === 'gravel') return pxFloor(g, p, v, 'gravel');
    if (p.style === 'rails') return pxFloor(g, floor, v, floor.style);
    if (p.style === 'carpet') {
      pxDot(g, 0, 0, p.a, 16, 16);
      for (let k = 0; k < 16; k += 4) pxDot(g, k, 0, mixHex(p.a, p.b, 0.4), 2, 16);
      for (const [x, y] of [
        [7, 2],
        [6, 3],
        [8, 3],
        [5, 4],
        [9, 4],
        [6, 5],
        [8, 5],
        [7, 6]
      ])
        pxDot(g, x, y, p.c);
      for (const [x, y] of [
        [7, 10],
        [6, 11],
        [8, 11],
        [7, 12]
      ])
        pxDot(g, x, y, p.b);
      return;
    }
    if (p.style === 'grate') {
      pxDot(g, 0, 0, '#3a1206', 16, 16);
      for (let k = 0; k < 16; k += 3) {
        pxDot(g, k, 0, p.a, 1, 16);
        pxDot(g, 0, k, p.a, 16, 1);
      }
      if (v % 2) pxDot(g, 4, 4, p.c);
      return;
    }
    // Dalle runique : carreau sombre et glyphe lumineux en pixels.
    pxDot(g, 0, 0, mixHex(p.b, '#000000', 0.3), 16, 16);
    pxSlab(g, 0, 0, 15, 15, p.a, p, v + 3);
    const glyphs = [
      [
        [7, 3],
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 7],
        [7, 8],
        [7, 9],
        [7, 10],
        [7, 11],
        [5, 5],
        [9, 5],
        [4, 7],
        [10, 7],
        [5, 9],
        [9, 9]
      ],
      [
        [7, 3],
        [6, 5],
        [8, 5],
        [5, 7],
        [9, 7],
        [4, 9],
        [10, 9],
        [4, 11],
        [5, 11],
        [6, 11],
        [7, 11],
        [8, 11],
        [9, 11],
        [10, 11]
      ],
      [
        [4, 7],
        [5, 7],
        [6, 7],
        [7, 7],
        [8, 7],
        [9, 7],
        [10, 7],
        [5, 4],
        [6, 5],
        [8, 9],
        [9, 10]
      ],
      [
        [6, 6],
        [7, 6],
        [8, 6],
        [6, 7],
        [8, 7],
        [6, 8],
        [7, 8],
        [8, 8]
      ]
    ];
    for (const [x, y] of glyphs[v]) pxDot(g, x, y, p.c);
  }
  // Face d'un mur : couronnement clair cerné d'encre, pierres ou briques, pied ombré.
  function pxFace(g, w, v) {
    const joint = mixHex(w.dark, '#000000', 0.3),
      seed = v * 17 + 3;
    pxDot(g, 0, 0, joint, 16, 16);
    if (w.style === 'brick') {
      for (let row = 0; row < 3; row++) {
        const y = 4 + row * 3,
          off = row % 2 ? 0 : 3;
        for (let x = -off; x < 16; x += 6) {
          const x0 = Math.max(0, x),
            x1 = Math.min(16, x + 5);
          if (x1 > x0)
            pxSlab(
              g,
              x0,
              y,
              x1 - x0,
              2,
              [w.face, mixHex(w.face, w.light, 0.3), mixHex(w.face, w.dark, 0.3), w.face][
                Math.floor(hash(x, row, v) * 4)
              ],
              { b: w.dark },
              seed + x + row
            );
        }
      }
    } else if (w.style === 'marble') {
      pxDot(g, 0, 3, '#d4aa3a', 16, 1);
      pxSlab(g, 1, 4, 6, 9, w.face, { b: w.dark }, seed);
      pxSlab(g, 9, 4, 6, 9, w.face, { b: w.dark }, seed + 5);
      pxDot(g, 7, 5, w.dark, 2, 7);
    } else {
      // Roche : blocs de tailles variées aux coins arrondis.
      let y = 4;
      for (let row = 0; y < 13; row++) {
        const hgt = 2 + Math.floor(hash(row, v, 4) * 2);
        let x = -Math.floor(hash(v, row, 9) * 3);
        while (x < 16) {
          const bw = 3 + Math.floor(hash(x + 5, row, v) * 4),
            x0 = Math.max(0, x),
            x1 = Math.min(16, x + bw),
            h = Math.min(hgt, 13 - y);
          if (x1 - x0 > 1 && h > 0) {
            pxSlab(
              g,
              x0,
              y,
              x1 - x0 - 1,
              h,
              [w.face, mixHex(w.face, w.light, 0.35), mixHex(w.face, w.dark, 0.35)][
                Math.floor(hash(x, row, v + 1) * 3)
              ],
              { b: w.dark },
              seed + x * 7 + row
            );
            pxDot(g, x0, y, joint);
            pxDot(g, x1 - 2, y + h - 1, joint);
          }
          x += bw;
        }
        y += hgt + 0;
      }
    }
    // Couronnement : liseré d'encre, arête claire, puis pied ombré.
    pxDot(g, 0, 0, mixHex(w.top, '#000000', 0.3), 16, 1);
    pxDot(g, 0, 1, w.light, 16, 1);
    pxDot(g, 0, 2, mixHex(w.light, w.face, 0.5), 16, 1);
    pxDot(g, 0, 3, joint, 16, 1);
    pxDot(g, 0, 13, mixHex(w.dark, '#000000', 0.35), 16, 1);
    pxDot(g, 0, 14, mixHex(w.dark, '#000000', 0.5), 16, 2);
  }
  // Dessus des murs : aplat sombre tramé.
  function pxTop(g, w) {
    pxDot(g, 0, 0, w.top, 16, 16);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) if ((x + y * 3) % 7 === 0 && hash(x, y, 77) > 0.4) pxDot(g, x, y, w.dark);
  }
  function themeArt(i) {
    if (ART[i]) return ART[i];
    const th = THEMES[i],
      mk = fn =>
        [0, 1, 2, 3].map(v => {
          const c = canvas(48, 48),
            g = c.getContext('2d');
          fn(g, v);
          return c;
        });
    const art = {
      floor: mk((g, v) => pxFloor(g, th.floor, v, th.floor.style)),
      accent: mk((g, v) => pxAccent(g, th.accent, th.floor, v)),
      face: mk((g, v) => pxFace(g, th.wall, v)),
      hazard: mk((g, v) => paintHazard(g, th.hazard, v))
    };
    const top = canvas(48, 48);
    pxTop(top.getContext('2d'), th.wall);
    art.top = top;
    ART[i] = art;
    return art;
  }
  const shadowTile = (() => {
    let c = null;
    return () => {
      if (c) return c;
      c = canvas(48, 48);
      const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')),
        grad = g.createLinearGradient(0, 0, 0, 18);
      grad.addColorStop(0, 'rgba(0,0,0,.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 48, 18);
      return c;
    };
  })();
  function drawScrolled(c, img, x, y, off) {
    off = ((Math.floor(off) % 48) + 48) % 48;
    if (!off) return c.drawImage(img, x, y);
    c.drawImage(img, off, 0, 48 - off, 48, x, y, 48 - off, 48);
    c.drawImage(img, 0, 0, off, 48, x + 48 - off, y, off, 48);
  }

  return Object.freeze({
    canvas,
    rect,
    specks,
    paintFloor,
    paintFace,
    paintHazard,
    toRgb,
    mixHex,
    themeArt,
    shadowTile,
    drawScrolled
  });
}
export const CANAAN_DUNGEON_TILES = Object.freeze({ create });
