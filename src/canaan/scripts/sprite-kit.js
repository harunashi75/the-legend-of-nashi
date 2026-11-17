// Kit graphique commun : sprites détaillés des créatures et des boss (contour, aura, gros format),
// lumières dynamiques, particules d'ambiance et barre de boss, pour le monde comme pour les instances.
(() => {
  'use strict';
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function rect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  // Contour sombre autour d'un sprite : renvoie une toile agrandie de `pad` pixels de chaque côté.
  function canaanOutline(src, pad = 1, color = 'rgba(14,10,22,.85)') {
    const w = src.width + pad * 2,
      h = src.height + pad * 2,
      sil = canvas(w, h),
      sg = sil.getContext('2d');
    for (const [dx, dy] of [
      [0, pad],
      [pad * 2, pad],
      [pad, 0],
      [pad, pad * 2]
    ])
      sg.drawImage(src, dx, dy);
    sg.globalCompositeOperation = 'source-in';
    rect(sg, 0, 0, w, h, color);
    const out = canvas(w, h),
      o = out.getContext('2d');
    o.drawImage(sil, 0, 0);
    o.drawImage(src, pad, pad);
    return out;
  }
  // Volume et grain : éclaircit les bords exposés en haut, assombrit les bas, varie légèrement chaque bloc.
  function canaanPolish(src, block = 2, seed = 0) {
    const w = src.width,
      h = src.height,
      g = src.getContext('2d'),
      img = g.getImageData(0, 0, w, h),
      d = img.data;
    if (!d || d.length !== w * h * 4) return src;
    const alpha = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4;
        if (d[k + 3] < 200) continue;
        let f = 1 + (hashKit(Math.floor(x / block), Math.floor(y / block), seed) - 0.5) * 0.16;
        if (alpha(x, y - 2) < 100) f += 0.22;
        else if (alpha(x, y + 2) < 100) f -= 0.22;
        if (alpha(x - 2, y) < 100) f += 0.08;
        else if (alpha(x + 2, y) < 100) f -= 0.1;
        out[k] = d[k] * f;
        out[k + 1] = d[k + 1] * f;
        out[k + 2] = d[k + 2] * f;
      }
    d.set(out);
    g.putImageData(img, 0, 0);
    return src;
  }
  function hashKit(x, y, s = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 71.3) * 43758.5453;
    return n - Math.floor(n);
  }

  // ---------------------------------------------------------------- Silhouettes
  const FLAGS = [
    'crown',
    'halo',
    'hood',
    'wings6',
    'nowings',
    'bare',
    'horns',
    'leafy',
    'heavy',
    'tusks',
    'deer',
    'mane',
    'raven'
  ];
  const ACTORS = {};
  function actor(look, pal, opts = {}) {
    const key = look + pal.join() + FLAGS.filter(f => opts[f]).join('');
    if (ACTORS[key]) return ACTORS[key];
    const cv = canvas(32, 40),
      g = cv.getContext('2d'),
      r = (x, y, w, h, col) => rect(g, x, y, w, h, col),
      [m, dk, lt, ac, ey] = pal;
    if (look === 'skeleton') {
      r(11, 26, 3, 9, m);
      r(18, 26, 3, 9, m);
      r(10, 34, 5, 2, dk);
      r(17, 34, 5, 2, dk);
      r(10, 24, 12, 3, m);
      r(15, 14, 2, 10, m);
      for (let k = 0; k < 4; k++) r(11, 15 + k * 2, 10, 1, k % 2 ? lt : m);
      r(7, 15, 3, 10, m);
      r(22, 15, 3, 10, m);
      r(6, 25, 4, 2, lt);
      r(22, 25, 4, 2, lt);
      r(11, 4, 10, 9, lt);
      r(12, 12, 8, 2, m);
      r(13, 7, 2, 2, ey);
      r(18, 7, 2, 2, ey);
      r(15, 10, 2, 1, dk);
      r(2, 15, 6, 10, ac);
      r(3, 16, 4, 8, dk);
      r(26, 6, 2, 18, lt);
      r(24, 22, 6, 2, ac);
    } else if (look === 'golem') {
      r(8, 27, 6, 9, dk);
      r(18, 27, 6, 9, dk);
      r(6, 12, 20, 16, m);
      r(6, 12, 20, 3, lt);
      r(6, 25, 20, 3, dk);
      r(12, 4, 8, 8, m);
      r(12, 4, 8, 2, lt);
      r(13, 7, 6, 2, ey);
      r(1, 13, 6, 14, m);
      r(25, 13, 6, 14, m);
      r(0, 26, 8, 5, dk);
      r(24, 26, 8, 5, dk);
      r(4, 10, 6, 4, lt);
      r(22, 10, 6, 4, lt);
      r(10, 15, 2, 7, ac);
      r(14, 19, 6, 2, ac);
      r(21, 14, 2, 8, ac);
      r(14, 15, 4, 4, ey);
      if (opts.leafy) {
        r(3, 5, 9, 6, '#4a8a3a');
        r(20, 3, 10, 7, '#5a9a44');
        r(11, 0, 10, 5, '#3e7a32');
        r(6, 4, 3, 2, '#8adc5a');
        r(23, 3, 3, 2, '#8adc5a');
      }
    } else if (look === 'robed') {
      for (let k = 0; k < 20; k++) {
        const half = Math.round(5 + k * 0.45);
        r(16 - half, 16 + k, half * 2, 1, m);
      }
      r(15, 18, 2, 18, dk);
      r(8, 34, 16, 2, ac);
      r(11, 22, 10, 2, ac);
      r(11, 4, 10, 12, m);
      r(10, 7, 12, 9, m);
      r(13, 8, 6, 6, '#0a0610');
      r(13, 10, 2, 1, ey);
      r(17, 10, 2, 1, ey);
      r(7, 16, 4, 9, m);
      r(21, 16, 4, 9, m);
      r(7, 24, 3, 2, lt);
      r(22, 24, 3, 2, lt);
      r(26, 6, 2, 30, dk);
      r(24, 2, 6, 6, ac);
      r(25, 3, 4, 4, ey);
    } else if (look === 'knight') {
      r(11, 26, 4, 9, dk);
      r(17, 26, 4, 9, dk);
      r(10, 33, 6, 3, '#1c1a22');
      r(16, 33, 6, 3, '#1c1a22');
      r(9, 14, 14, 13, m);
      r(10, 15, 5, 4, lt);
      r(9, 24, 14, 2, ac);
      r(13, 18, 6, 10, ac);
      r(5, 13, 6, 5, lt);
      r(21, 13, 6, 5, lt);
      r(6, 17, 4, 8, m);
      r(22, 17, 4, 8, m);
      if (opts.hood) {
        r(10, 2, 12, 13, dk);
        r(12, 5, 8, 7, '#0b0a10');
      } else {
        r(11, 3, 10, 11, m);
        r(12, 3, 8, 2, lt);
        r(12, 8, 8, 2, '#0b0a10');
        r(14, 0, 4, 4, ac);
      }
      r(13, 8, 2, 2, ey);
      r(17, 8, 2, 2, ey);
      r(1, 15, 7, 11, dk);
      r(3, 18, 3, 4, ac);
      r(26, 4, 2, 20, lt);
      r(24, 22, 6, 2, ac);
    } else if (look === 'dragon') {
      r(0, 26, 8, 3, m);
      r(2, 23, 4, 3, m);
      r(8, 8, 3, 13, dk);
      r(11, 6, 3, 14, dk);
      r(14, 9, 3, 11, dk);
      g.globalAlpha = 0.8;
      r(9, 10, 9, 9, ac);
      g.globalAlpha = 1;
      r(7, 20, 17, 10, m);
      r(9, 26, 13, 4, lt);
      r(9, 29, 4, 7, dk);
      r(19, 29, 4, 7, dk);
      r(8, 35, 6, 1, ac);
      r(18, 35, 6, 1, ac);
      r(20, 12, 6, 10, m);
      r(22, 6, 10, 7, m);
      r(24, 12, 8, 2, dk);
      r(28, 8, 2, 2, ey);
      r(23, 3, 2, 4, lt);
      r(27, 2, 2, 4, lt);
      for (let k = 0; k < 4; k++) r(10 + k * 4, 18, 2, 2, lt);
    } else if (look === 'brute') {
      r(9, 27, 5, 9, dk);
      r(18, 27, 5, 9, dk);
      r(7, 13, 18, 15, m);
      r(10, 19, 12, 6, lt);
      r(7, 25, 18, 3, '#2a1a14');
      r(2, 14, 6, 13, m);
      r(24, 14, 6, 13, m);
      r(11, 3, 10, 11, opts.bare ? m : '#1a1214');
      if (opts.bare) {
        r(11, 3, 10, 2, lt);
        r(13, 10, 6, 4, lt);
        r(14, 12, 4, 1, dk);
      }
      if (opts.horns) {
        r(7, 2, 5, 3, '#e8dcc0');
        r(6, 0, 2, 3, '#e8dcc0');
        r(20, 2, 5, 3, '#e8dcc0');
        r(24, 0, 2, 3, '#e8dcc0');
      }
      r(13, 8, 2, 2, ey);
      r(17, 8, 2, 2, ey);
      r(27, 4, 2, 28, '#5a3a24');
      r(28, 4, 4, 11, lt);
      r(31, 4, 1, 11, '#ffffff');
      r(3, 26, 2, 7, ac);
      r(5, 30, 3, 2, ac);
    } else if (look === 'horror') {
      for (let k = 0; k < 6; k++) {
        r(3 + k * 5, 26, 3, 10 - (k % 2) * 3, dk);
        r(3 + k * 5, 34 - (k % 2) * 3, 3, 2, ac);
      }
      r(6, 8, 20, 20, m);
      r(4, 12, 24, 12, m);
      r(8, 6, 16, 24, m);
      r(9, 8, 6, 3, lt);
      r(10, 11, 12, 10, '#f4ecff');
      r(13, 13, 6, 6, ac);
      r(15, 14, 2, 4, '#000');
      r(7, 9, 2, 2, ey);
      r(23, 8, 2, 2, ey);
      r(25, 20, 2, 2, ey);
      r(6, 22, 2, 2, ey);
      r(12, 25, 8, 2, '#0a0410');
    } else if (look === 'angel') {
      const wing = (y, h) => {
        r(1, y, 7, h, lt);
        r(0, y + 4, 4, h - 6, lt);
        r(24, y, 7, h, lt);
        r(28, y + 4, 4, h - 6, lt);
        r(3, y + 2, 1, h - 4, dk);
        r(28, y + 2, 1, h - 4, dk);
      };
      if (opts.wings6) wing(2, 12);
      wing(10, 18);
      if (opts.wings6) {
        r(2, 26, 6, 8, lt);
        r(24, 26, 6, 8, lt);
      }
      for (let k = 0; k < 20; k++) {
        const half = Math.round(4 + k * 0.4);
        r(16 - half, 15 + k, half * 2, 1, m);
      }
      r(9, 33, 14, 2, ac);
      r(12, 20, 8, 2, ac);
      r(13, 5, 6, 8, '#f4e0c8');
      r(12, 4, 8, 3, ac);
      r(14, 8, 1, 1, ey);
      r(17, 8, 1, 1, ey);
      r(11, 1, 10, 2, ac);
      r(26, 6, 2, 22, ey);
      r(24, 26, 6, 2, ac);
    } else if (look === 'beast') {
      r(0, 28, 7, 2, ac);
      r(6, 24, 18, 9, m);
      r(8, 22, 14, 3, m);
      r(9, 30, 12, 3, lt);
      r(22, 24, 7, 7, m);
      r(28, 27, 3, 3, lt);
      r(30, 27, 2, 2, ac);
      r(25, 26, 2, 2, ey);
      r(22, 21, 3, 3, lt);
      r(8, 32, 3, 4, dk);
      r(19, 32, 3, 4, dk);
    } else if (look === 'imp') {
      if (!opts.nowings) {
        r(4, 12, 7, 8, dk);
        r(21, 12, 7, 8, dk);
      }
      r(11, 18, 10, 11, m);
      r(13, 22, 6, 5, lt);
      r(12, 29, 3, 7, dk);
      r(17, 29, 3, 7, dk);
      r(11, 10, 10, 9, m);
      r(10, 7, 2, 4, ac);
      r(20, 7, 2, 4, ac);
      r(13, 13, 2, 2, ey);
      r(17, 13, 2, 2, ey);
      r(14, 17, 4, 1, '#200');
      r(8, 19, 3, 6, m);
      r(21, 19, 3, 6, m);
      r(21, 26, 6, 2, m);
      r(26, 25, 2, 2, ac);
      r(24, 12, 2, 13, '#5a3a24');
      r(22, 10, 6, 3, lt);
    } else if (look === 'slime') {
      r(6, 24, 20, 12, m);
      r(8, 20, 16, 6, m);
      r(11, 17, 10, 4, m);
      r(6, 34, 20, 2, dk);
      r(9, 21, 6, 3, lt);
      r(10, 22, 3, 2, '#ffffff');
      r(12, 27, 3, 3, '#ffffff');
      r(18, 27, 3, 3, '#ffffff');
      r(13, 28, 2, 2, ey);
      r(19, 28, 2, 2, ey);
      r(14, 32, 5, 1, dk);
    } else if (look === 'quad') {
      // Quadrupède de profil : loup, sanglier (défenses), ours (massif) ou cerf (bois).
      if (opts.heavy) {
        r(4, 16, 22, 13, m);
        r(5, 15, 18, 3, dk);
        r(8, 25, 15, 4, lt);
        r(6, 28, 4, 8, dk);
        r(11, 28, 4, 8, m);
        r(18, 28, 4, 8, dk);
        r(23, 28, 4, 8, m);
        r(21, 12, 9, 10, m);
        r(28, 16, 4, 4, lt);
        r(31, 16, 1, 2, '#1a1418');
        r(21, 10, 3, 3, m);
        r(27, 10, 3, 3, m);
        r(25, 14, 2, 2, ey);
      } else {
        r(1, 20, 6, 3, opts.deer ? '#ffffff' : m);
        r(0, 18, 3, 3, lt);
        r(6, 19, 18, 9, m);
        r(7, 18, 16, 2, dk);
        r(9, 25, 13, 3, lt);
        const leg = opts.deer ? 2 : 3;
        r(8, 27, leg, 9, dk);
        r(12, 27, leg, 9, m);
        r(19, 27, leg, 9, dk);
        r(22, 27, leg, 9, m);
        r(21, 13, 7, 9, m);
        r(27, 17, 5, 4, m);
        r(31, 17, 1, 2, '#1a1418');
        r(25, 15, 2, 2, ey);
        r(21, 9, 3, 5, m);
        r(25, 10, 3, 4, dk);
        if (!opts.deer) r(19, 14, 4, 8, dk);
        if (opts.tusks) {
          r(29, 20, 3, 2, ac);
          r(8, 16, 14, 2, dk);
        }
        if (opts.deer) {
          r(22, 3, 1, 7, ac);
          r(20, 5, 3, 1, ac);
          r(26, 3, 1, 7, ac);
          r(26, 5, 3, 1, ac);
        }
        if (opts.mane) {
          r(17, 11, 7, 12, lt);
          r(19, 9, 4, 3, lt);
        }
      }
    } else if (look === 'spider') {
      for (let k = 0; k < 4; k++) {
        r(2, 14 + k * 4, 9, 2, dk);
        r(0, 16 + k * 4, 3, 6, dk);
        r(22, 14 + k * 4, 9, 2, dk);
        r(29, 16 + k * 4, 3, 6, dk);
      }
      r(8, 18, 16, 13, m);
      r(9, 19, 8, 3, lt);
      r(13, 23, 6, 6, ac);
      r(11, 12, 10, 8, m);
      r(12, 14, 2, 2, ey);
      r(15, 13, 2, 2, ey);
      r(18, 14, 2, 2, ey);
      r(13, 20, 2, 3, lt);
      r(17, 20, 2, 3, lt);
    } else if (look === 'scorpion') {
      r(3, 24, 4, 4, m);
      r(2, 18, 4, 7, m);
      r(3, 12, 4, 7, m);
      r(6, 8, 5, 5, m);
      r(10, 9, 4, 3, ac);
      r(7, 24, 16, 8, m);
      r(8, 24, 14, 2, lt);
      for (let k = 0; k < 3; k++) r(10 + k * 4, 26, 1, 6, dk);
      for (let k = 0; k < 4; k++) r(8 + k * 4, 31, 2, 5, dk);
      r(22, 23, 6, 7, m);
      r(25, 25, 2, 2, ey);
      r(27, 19, 4, 4, lt);
      r(27, 28, 4, 4, lt);
      r(30, 18, 2, 3, m);
      r(30, 31, 2, 3, m);
    } else if (look === 'flyer') {
      if (opts.raven) {
        r(6, 12, 12, 7, dk);
        r(4, 16, 8, 4, dk);
        r(10, 14, 13, 10, m);
        r(11, 15, 8, 2, lt);
        r(20, 10, 7, 7, m);
        r(27, 13, 4, 2, ac);
        r(23, 12, 2, 2, ey);
        r(5, 21, 7, 3, dk);
        r(14, 24, 2, 5, ac);
        r(18, 24, 2, 5, ac);
      } else {
        r(1, 14, 12, 4, dk);
        r(3, 18, 8, 4, dk);
        r(0, 11, 4, 4, dk);
        r(19, 14, 12, 4, dk);
        r(21, 18, 8, 4, dk);
        r(28, 11, 4, 4, dk);
        r(4, 15, 7, 1, lt);
        r(21, 15, 7, 1, lt);
        r(12, 13, 8, 11, m);
        r(13, 9, 6, 6, m);
        r(13, 6, 2, 3, m);
        r(17, 6, 2, 3, m);
        r(14, 11, 1, 1, ey);
        r(17, 11, 1, 1, ey);
        r(14, 24, 1, 3, lt);
        r(17, 24, 1, 3, lt);
      }
    } else if (look === 'mantis') {
      g.globalAlpha = 0.6;
      r(19, 18, 7, 13, ac);
      g.globalAlpha = 1;
      r(13, 23, 7, 11, m);
      for (let k = 0; k < 3; k++) r(13, 25 + k * 3, 7, 1, dk);
      r(15, 15, 3, 9, m);
      r(13, 9, 7, 6, m);
      r(12, 9, 2, 3, ey);
      r(19, 9, 2, 3, ey);
      r(10, 15, 5, 2, lt);
      r(9, 15, 2, 8, lt);
      r(18, 15, 5, 2, lt);
      r(22, 15, 2, 8, lt);
      r(11, 31, 2, 5, dk);
      r(20, 31, 2, 5, dk);
      r(15, 5, 1, 4, dk);
      r(17, 5, 1, 4, dk);
    } else if (look === 'rogue') {
      r(11, 26, 4, 9, dk);
      r(17, 26, 4, 9, dk);
      r(10, 33, 6, 3, '#2a1e18');
      r(16, 33, 6, 3, '#2a1e18');
      r(8, 13, 4, 16, dk);
      r(20, 13, 4, 16, dk);
      r(10, 14, 12, 13, m);
      r(11, 15, 4, 4, lt);
      r(10, 23, 12, 2, '#3a2a1c');
      r(15, 23, 2, 2, ac);
      r(7, 16, 3, 9, m);
      r(22, 16, 3, 9, m);
      r(7, 24, 3, 2, '#d4a780');
      r(22, 24, 3, 2, '#d4a780');
      r(10, 3, 12, 11, dk);
      r(13, 7, 6, 6, '#d4a780');
      r(12, 10, 8, 3, ac);
      r(14, 8, 1, 1, '#201418');
      r(17, 8, 1, 1, '#201418');
      r(25, 17, 2, 9, lt);
      r(24, 24, 4, 1, ac);
      r(4, 21, 4, 6, '#6a4a30');
    } else {
      g.globalAlpha = 0.85;
      for (let k = 0; k < 22; k++) {
        const half = Math.max(2, Math.round(8 - k * 0.25));
        r(16 - half + Math.round(Math.sin(k * 0.6) * 1.5), 12 + k, half * 2, 1, m);
      }
      r(6, 14, 4, 9, m);
      r(22, 14, 4, 9, m);
      r(11, 4, 10, 9, lt);
      r(13, 8, 2, 3, ey);
      r(17, 8, 2, 3, ey);
      r(15, 12, 2, 2, dk);
      r(8, 31, 3, 4, lt);
      r(21, 31, 3, 4, lt);
      g.globalAlpha = 1;
    }
    if (opts.crown) {
      r(11, 1, 10, 2, '#ffd36d');
      r(11, 0, 2, 1, '#ffd36d');
      r(15, 0, 2, 1, '#ffd36d');
      r(19, 0, 2, 1, '#ffd36d');
      r(12, 1, 8, 1, '#fff2a8');
    }
    // Contour sombre d'un pixel : la silhouette reste lisible sur les sols clairs (marbre, nuages).
    const out = canvas(34, 42),
      o = out.getContext('2d');
    rect(o, 7, 37, 20, 3, 'rgba(0,0,0,.35)');
    const sil = canvas(34, 42),
      sg = sil.getContext('2d');
    for (const [dx, dy] of [
      [0, 1],
      [2, 1],
      [1, 0],
      [1, 2]
    ])
      sg.drawImage(cv, dx, dy);
    sg.globalCompositeOperation = 'source-in';
    rect(sg, 0, 0, 34, 42, 'rgba(14,10,22,.85)');
    o.drawImage(sil, 0, 0);
    o.drawImage(cv, 1, 1);
    ACTORS[key] = out;
    return out;
  }
  // Apparence des créatures du monde, d'après leur nom ; palettes : [principale, sombre, claire, accent, yeux].
  const WORLD_LOOKS = [
    // Créatures des Tréfonds (sous l'île) : avant les noms plus courts qu'elles contiennent (Squelette, Spectre…).
    [/Ver des boues/, 'horror', ['#8a6440', '#5a3e26', '#b08a5e', '#e0c080', '#ffcf40']],
    [/Taupe-garou/, 'quad', ['#5a4434', '#3a2a20', '#7e6450', '#f0b0a0', '#ff8a3a'], { heavy: true }],
    [/Scarabée foreur/, 'scorpion', ['#3a5a6a', '#20343e', '#6a8a9a', '#c8a040', '#ff6a3a']],
    [/Gobelin des mines/, 'imp', ['#8aa05a', '#5a6e34', '#b0c880', '#6a5a4a', '#ffd23f'], { nowings: true }],
    [/Sentinelle de pierre/, 'golem', ['#8a8478', '#5a564e', '#b8b2a4', '#7ad0ff', '#e0f8ff']],
    [/Spectre minier/, 'spirit', ['#7ab8e0', '#3a6a90', '#d0ecff', '#ffd36d', '#ffffff']],
    [/Squelette nain/, 'skeleton', ['#d8ccb0', '#8a8068', '#f8f0d8', '#7a5a3a', '#7fd0ff']],
    [/Gargouille/, 'imp', ['#6a6e7a', '#3e424c', '#9aa0ac', '#c84a4a', '#ff6a4a']],
    [/Goule/, 'brute', ['#a8b49a', '#6a7a5e', '#d0dcc0', '#4a3a2a', '#ff4a4a'], { bare: true }],
    [/Âme errante/, 'spirit', ['#9ae8c0', '#4aa880', '#e0fff0', '#ffffff', '#ffffff']],
    [/Chevalier des tombes/, 'knight', ['#5a5e6e', '#34384a', '#8a8ea0', '#6ad0a0', '#7affc0']],
    [/Corbeau des tombes/, 'flyer', ['#3a3448', '#1e1a2a', '#6a6080', '#c8c060', '#7affc0'], { raven: true }],
    [/Myconide/, 'golem', ['#c8604a', '#8a3a2a', '#f0a080', '#f8e8c8', '#fff0a0'], { leafy: true }],
    [/Limace des fanges/, 'slime', ['#6a7a3a', '#3e4a20', '#9aaa5a', '#c8e060', '#1a2010']],
    [/Mille-pattes/, 'scorpion', ['#9a4a2a', '#5a2a16', '#c87a4a', '#f0c040', '#ffef60']],
    [/Moustique des fanges/, 'flyer', ['#5a6a4a', '#34402a', '#8a9a6a', '#c84a4a', '#ff4a4a']],
    [/Slime/, 'slime', ['#5edc7a', '#2e8a48', '#a8f5b8', '#ffffff', '#1a3020']],
    [/Loup/, 'quad', ['#8c7a68', '#5a4a3c', '#b8a690', '#e8dcc8', '#ffcf40']],
    [/Molosse/, 'quad', ['#a83a24', '#5a1a10', '#e0603a', '#ffd36b', '#fff0a0'], { mane: true }],
    [/Sanglier/, 'quad', ['#6e5444', '#46342a', '#957664', '#f4ecd8', '#ff5a3a'], { tusks: true }],
    [/Ours/, 'quad', ['#6e4a32', '#46301e', '#8e6a4c', '#d8c0a0', '#2a1a10'], { heavy: true }],
    [/Araignée venimeuse/, 'spider', ['#6a3a6e', '#3a1e40', '#9a6aa0', '#8ae04a', '#ff4a4a']],
    [/Araignée/, 'spider', ['#4a3a34', '#2a1e1a', '#6e5a50', '#c84a3a', '#ff6a4a']],
    [/Gobelin/, 'imp', ['#7aa65a', '#4a6e34', '#a4cc80', '#8a5a3a', '#ffd23f'], { nowings: true }],
    [/Mante/, 'mantis', ['#7ab65a', '#4a7a34', '#a8e080', '#c8f0a0', '#ff4a4a']],
    [/Basilic/, 'dragon', ['#4e8e54', '#2e5a34', '#7cbc7c', '#e8d060', '#ffef60']],
    [/Serpent des glaces/, 'dragon', ['#8ad0e0', '#4a8aa0', '#d0f4ff', '#ffffff', '#3ad0ff']],
    [/Drake des dunes/, 'dragon', ['#c8984e', '#8a6430', '#ecc888', '#e05a3a', '#fff09a']],
    [/Drake astral/, 'dragon', ['#7a68d8', '#4a3a90', '#b0a0ff', '#ffd36d', '#ffffff']],
    [/Dragonnet/, 'dragon', ['#d86a7a', '#8a3a4a', '#ffa0b0', '#ffd36d', '#fff09a']],
    [/Wisp/, 'spirit', ['#8fe8ed', '#4aa8b0', '#e0ffff', '#ffffff', '#ffffff']],
    [/Élémentaire/, 'spirit', ['#ff8752', '#b4401a', '#ffc08a', '#ffd36b', '#fff6c0']],
    [/Spectre/, 'spirit', ['#a998f2', '#5a4aa0', '#dcd4ff', '#ffffff', '#ffffff']],
    [/Bandit/, 'rogue', ['#7a4a3a', '#3e2a24', '#a06a54', '#c84a3a', '#ffffff']],
    [/Pilleur/, 'rogue', ['#6e6a4a', '#3e3a2a', '#948e6a', '#d4a44a', '#ffffff']],
    [/Corbeau/, 'flyer', ['#4a4e7a', '#2a2c4a', '#7a80b0', '#e0c060', '#9fe8ff'], { raven: true }],
    [/Chauve-souris/, 'flyer', ['#5a4a6e', '#34283e', '#8a789e', '#e0a0c0', '#ff4a4a']],
    [/Troll/, 'brute', ['#6e8e5a', '#46603a', '#94b47a', '#c8a060', '#ffcf40'], { bare: true }],
    [/Yéti/, 'brute', ['#e0eef2', '#9ab4c0', '#ffffff', '#7ad0ff', '#3a8aff'], { bare: true }],
    [
      /Minotaure/,
      'brute',
      ['#8a5e40', '#5a3a26', '#b08060', '#e8dcc0', '#ff4a3a'],
      { bare: true, horns: true }
    ],
    [/Scorpion/, 'scorpion', ['#c49a5a', '#8a6a3a', '#e8c48a', '#e04a3a', '#2a1a10']],
    [/Squelette/, 'skeleton', ['#ddd6be', '#8f8670', '#fff8e0', '#6a5a40', '#ff6a4a']],
    [/Fée/, 'angel', ['#e99bda', '#a85a9a', '#ffd8f4', '#9fe8ff', '#ffffff']],
    [/Gardien astral/, 'golem', ['#5a7ab0', '#34507a', '#9ab8e8', '#7acbe6', '#e0f8ff']],
    [/Ent corrompu/, 'golem', ['#5e4a34', '#3a2c1e', '#86704e', '#8adc5a', '#c8ff60'], { leafy: true }],
    [/Golem/, 'golem', ['#91a2b4', '#5a6a7a', '#c8d4e0', '#7ad0ff', '#e0f8ff']],
    [/Chevalier/, 'knight', ['#737d9f', '#454e6e', '#a8b2d0', '#c84a5a', '#ff6a6a']]
  ];
  const WORLD_BOSS_LOOKS = {
    fenrir: ['quad', ['#9ad0e0', '#5a8aa0', '#e0f6ff', '#ffffff', '#3ad0ff'], { mane: true }],
    nocturne: ['flyer', ['#5a3a8a', '#2e1a50', '#9a7ad8', '#ffd36d', '#ffcf40']],
    leviathan: ['dragon', ['#3aa8b0', '#1e6a74', '#7ae0e4', '#e0f8ff', '#ffef60']],
    golem: ['golem', ['#6a4ab0', '#3a2870', '#a888ff', '#ffd36d', '#ffffff'], { halo: true }],
    colosse: ['golem', ['#c8dcea', '#7a96aa', '#ffffff', '#7ad8ff', '#3ad0ff'], { crown: true }],
    ifrit: ['brute', ['#e8642a', '#9c3010', '#ffa05a', '#ffd36b', '#fff6a0'], { bare: true, horns: true }],
    seraph: ['angel', ['#d0507a', '#7a2040', '#ff9ab8', '#2a1020', '#ffd0e0'], { wings6: true }],
    chronos: ['horror', ['#2a5a7a', '#123048', '#5ab0d0', '#72e6f4', '#e0ffff']]
  };
  function shade(hex, f) {
    const n = parseInt(String(hex).slice(1, 7), 16) || 0x888888,
      c = v => Math.max(0, Math.min(255, Math.round(v * f)));
    return (
      '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('')
    );
  }
  // Fixe une seule fois l'apparence d'une créature du monde.
  function resolveLook(m) {
    if (m.look) return;
    if (m.worldBoss && WORLD_BOSS_LOOKS[m.worldBossId]) {
      const [look, pal, opts] = WORLD_BOSS_LOOKS[m.worldBossId];
      Object.assign(m, { look, pal, lookOpts: opts || {} });
      return;
    }
    const found = WORLD_LOOKS.find(([re]) => re.test(m.t || ''));
    if (found) {
      Object.assign(m, { look: found[1], pal: found[2], lookOpts: found[3] || {} });
      return;
    }
    const col = m.mobColor || m.bossColor || '#8b9a86';
    Object.assign(m, {
      look: 'rogue',
      pal: [col, shade(col, 0.6), shade(col, 1.3), '#e0c060', '#ffffff'],
      lookOpts: {}
    });
  }
  // Image d'une créature au repos (bestiaire du panneau des succès) : même apparence qu'en jeu.
  function actorPortrait(m) {
    resolveLook(m);
    return actor(m.look, m.pal, m.lookOpts || {});
  }
  // Dessine n'importe quel monstre : normal, élite, boss mondial ou boss d'instance.
  function drawCanaanActor(c, m) {
    resolveLook(m);
    const opts = m.lookOpts || {},
      spr = actor(m.look, m.pal, opts),
      big = m.boss || m.worldBoss,
      scale = m.boss ? m.scale || 3.3 : m.worldBoss ? 3.6 : m.elite ? 1.95 : 1.5,
      floats = m.look === 'spirit' || m.look === 'angel' || m.look === 'horror' || m.look === 'flyer',
      bob = floats ? Math.sin(time * 0.08 + m.x) * (big ? 6 : 3) : 0,
      w = 34 * scale,
      h = 42 * scale;
    c.save();
    if (big) {
      const aura = m.bossColor || m.mobColor || m.pal[3];
      c.globalAlpha = 0.25 + Math.sin(time * 0.08) * 0.1;
      c.fillStyle = aura;
      c.beginPath();
      c.ellipse(m.x, m.y + 8, w * 0.48, w * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      canaanLight(m.x, m.y - h * 0.4, 210, m.pal[4]);
    } else if (m.elite) {
      // Élite : anneau doré et étincelles en orbite.
      c.strokeStyle = '#ffd36d';
      c.lineWidth = 3;
      c.globalAlpha = 0.55 + Math.sin(time * 0.1 + m.x) * 0.2;
      c.beginPath();
      c.ellipse(m.x, m.y + 6, w * 0.42, w * 0.16, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#fff2a8';
      for (let k = 0; k < 3; k++) {
        const a = time * 0.05 + (k * Math.PI * 2) / 3;
        c.fillRect(m.x + Math.cos(a) * w * 0.42 - 2, m.y + 6 + Math.sin(a) * w * 0.16 - 2, 4, 4);
      }
      c.globalAlpha = 1;
      canaanLight(m.x, m.y - h * 0.4, 90, '#ffd36d');
    }
    if (opts.halo) {
      c.strokeStyle = m.pal[3];
      c.lineWidth = big ? 5 : 2;
      c.globalAlpha = 0.8;
      c.beginPath();
      c.ellipse(m.x, m.y - h * 0.88 + bob, w * 0.26, w * 0.08, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    drawAnimated(c, m, spr, scale, w, h, bob, floats);
    c.restore();
    drawWade(c, m, m.x, m.y + h * 0.08, w, m._walking, scale / 1.5);
  }
  // Silhouette blanche d'un sprite, pour le clignotement quand le monstre est touché.
  const WHITE = new WeakMap();
  function whiteOf(spr) {
    let wcv = WHITE.get(spr);
    if (wcv) return wcv;
    wcv = canvas(spr.width, spr.height);
    const g = wcv.getContext('2d');
    g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-in';
    rect(g, 0, 0, spr.width, spr.height, '#ffffff');
    WHITE.set(spr, wcv);
    return wcv;
  }
  // Animations : orientation, pas alternés et rebond en marche, élan et trace de coup à l'attaque,
  // clignotement blanc sous les coups. Tout est déduit de l'état du monstre, sans changer la simulation.
  const LEGLESS = new Set(['slime', 'spirit', 'horror', 'flyer', 'angel']);
  function drawAnimated(c, m, spr, scale, w, h, bob, floats) {
    const lx = m._lastX ?? m.x,
      ly = m._lastY ?? m.y,
      dx = m.x - lx,
      dy = m.y - ly,
      moved = Math.hypot(dx, dy);
    m._lastX = m.x;
    m._lastY = m.y;
    if (moved > 0.01 && moved < 40) {
      m._moveT = time;
      m._phase = (m._phase || 0) + moved;
    }
    if (Math.abs(dx) > 0.02 && moved < 40) m._face = dx > 0 ? 1 : -1;
    m._walking = time - (m._moveT ?? -99) < 6;
    if (m.cd > (m._cdSeen ?? m.cd) + 0.3) m._atk = time;
    m._cdSeen = m.cd;
    if (m.hp < (m._hpSeen ?? m.hp)) m._hit = time;
    m._hpSeen = m.hp;
    const phase = (m._phase || 0) * (0.22 / (scale / 1.5)),
      walk = m._walking,
      atk = Math.min(1, (time - (m._atk ?? -99)) / 16),
      lunge = atk < 1 ? Math.sin(atk * Math.PI) : 0,
      // Élan de l'attaque vers le héros visé (pas vers un héros caché par le Voile d'ombre).
      toward = m.targetHero
        ? Math.atan2(m.targetHero.player.y - m.y, m.targetHero.player.x - m.x)
        : m.facingAngle || 0,
      reach = lunge * 9 * (scale / 1.5),
      ox = Math.cos(toward) * reach,
      oy = Math.sin(toward) * reach * 0.6,
      hop = walk && !floats ? Math.abs(Math.sin(phase)) * 2 * (scale / 1.5) : 0,
      x0 = Math.round(m.x - w / 2 + ox),
      y0 = Math.round(m.y - h * 0.9 + bob + oy - hop),
      footX = m.x + ox,
      footY = m.y + h * 0.1 + oy;
    c.imageSmoothingEnabled = false;
    c.save();
    // Retournement horizontal selon la direction (les profils regardent à droite par défaut).
    if ((m._face || 1) < 0) {
      c.translate(footX, 0);
      c.scale(-1, 1);
      c.translate(-footX, 0);
    }
    // Slime : écrasement et étirement ; volants : battement rapide ; attaque : léger gonflement.
    let sx = 1,
      sy = 1;
    if (m.look === 'slime') {
      const k = Math.sin(phase * 1.4 + time * (walk ? 0 : 0.05));
      sx = 1 + k * 0.08;
      sy = 1 - k * 0.1;
    } else if (m.look === 'flyer') sy = 1 + Math.sin(time * 0.5 + m.x) * 0.08;
    if (lunge) {
      sx *= 1 + lunge * 0.08;
      sy *= 1 + lunge * 0.05;
    }
    if (sx !== 1 || sy !== 1) {
      c.translate(footX, footY);
      c.scale(sx, sy);
      c.translate(-footX, -footY);
    }
    const legged = walk && !LEGLESS.has(m.look),
      split = 29,
      dh = h * (split / 42);
    if (legged) {
      // Jambes en deux moitiés levées tour à tour, puis le torse par-dessus.
      const step = Math.sin(phase) * 1.4 * (scale / 1.5),
        legH = h - dh;
      c.drawImage(spr, 0, split, 17, 42 - split, x0, Math.round(y0 + dh - Math.max(0, step)), w / 2, legH);
      c.drawImage(
        spr,
        17,
        split,
        17,
        42 - split,
        x0 + w / 2,
        Math.round(y0 + dh - Math.max(0, -step)),
        w / 2,
        legH
      );
      c.drawImage(spr, 0, 0, 34, split, x0, y0, w, dh);
    } else c.drawImage(spr, x0, y0, Math.round(w), Math.round(h));
    const flash = time - (m._hit ?? -99);
    if (flash < 7) {
      c.globalAlpha = 0.75 * (1 - flash / 7);
      c.drawImage(whiteOf(spr), x0, y0, Math.round(w), Math.round(h));
      c.globalAlpha = 1;
    }
    c.restore();
    // Trace du coup, devant le monstre et vers le héros.
    if (atk < 0.7) {
      const r = 20 * (scale / 1.5),
        cx = m.x + Math.cos(toward) * r * 0.6,
        cy = m.y - h * 0.4 + Math.sin(toward) * r * 0.4,
        sweep = -0.9 + atk * 2.6;
      c.save();
      c.globalAlpha = 0.85 * (1 - atk / 0.7);
      c.strokeStyle = m.boss || m.worldBoss ? m.pal[4] : '#fff4dc';
      c.lineWidth = Math.max(2, 3 * (scale / 1.5));
      c.lineCap = 'round';
      c.beginPath();
      c.arc(cx, cy, r, toward + sweep - 0.7, toward + sweep);
      c.stroke();
      c.restore();
    }
  }

  // ---------------------------------------------------------------- Lumière et particules
  let lights = [],
    lightCanvas = null;
  function canaanLight(x, y, r, col) {
    lights.push({ x, y, r, col });
  }
  function resetCanaanLights() {
    lights = [];
  }
  function hexAlpha(hex, a) {
    const n = parseInt(String(hex).slice(1, 7), 16) || 0;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  // Halos précalculés : un disque dégradé blanc (pour percer l'obscurité) et un par couleur (lueurs).
  const PUFFS = {};
  function puff(col) {
    const key = col || 'hole';
    if (PUFFS[key]) return PUFFS[key];
    const c = canvas(128, 128),
      g = c.getContext('2d'),
      grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    grad.addColorStop(0, col ? hexAlpha(col, 1) : 'rgba(0,0,0,1)');
    grad.addColorStop(col ? 1 : 1, col ? hexAlpha(col, 0) : 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    PUFFS[key] = c;
    return c;
  }
  const MAX_LIGHTS = 32;
  // Ambiance : { dark (0–1), tint 'r,g,b', particles, color }. Obscurité percée par le héros et les lumières.
  function drawCanaanLighting(c, amb) {
    // Seules les lumières visibles les plus proches du héros comptent.
    const visible = lights
      .filter(l => Math.abs(l.x - camX - W / 2) < W / 2 + l.r && Math.abs(l.y - camY - H / 2) < H / 2 + l.r)
      .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))
      .slice(0, MAX_LIGHTS);
    if (amb.dark > 0.02) {
      if (!lightCanvas) lightCanvas = canvas(W, H);
      if (lightCanvas.width !== W || lightCanvas.height !== H) {
        lightCanvas.width = W;
        lightCanvas.height = H;
      }
      const g = lightCanvas.getContext('2d'),
        hole = puff(null);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(' + amb.tint + ',' + amb.dark + ')';
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-out';
      const hero = amb.heroLight || 330;
      g.drawImage(hole, P.x - camX - hero, P.y - 20 - camY - hero, hero * 2, hero * 2);
      for (const l of visible) g.drawImage(hole, l.x - camX - l.r, l.y - camY - l.r, l.r * 2, l.r * 2);
      g.globalCompositeOperation = 'source-over';
      c.drawImage(lightCanvas, camX, camY);
    }
    // Halo coloré des flammes, cristaux et boss, plus visible dans l'obscurité (lueurs désactivables).
    if (canaanDisplay.glow) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.08 + amb.dark * 0.14;
      for (const l of visible) {
        if (!l.col) continue;
        const r = l.r * 0.6;
        c.drawImage(puff(l.col), l.x - r, l.y - r, r * 2, r * 2);
      }
      c.restore();
    }
    if (amb.particles && canaanDisplay.particles) drawParticles(c, amb.particles, amb.color);
  }
  function drawParticles(c, kind, col) {
    c.save();
    c.fillStyle = col;
    const n = kind === 'mist' ? 14 : 36;
    for (let k = 0; k < n; k++) {
      const sx = hashKit(k, 1, 7),
        sy = hashKit(k, 2, 7),
        sp = 0.2 + hashKit(k, 3, 7) * 0.5;
      let x = sx * W,
        y = sy * H;
      if (kind === 'embers') y = H - ((sy * H + time * sp * 2) % H);
      else if (kind === 'feathers' || kind === 'leaves') {
        y = (sy * H + time * sp) % H;
        x += Math.sin(time * 0.02 + k) * 20;
      } else if (kind === 'mist') x = ((sx * W + time * sp * 0.6) % (W + 300)) - 150;
      else {
        x += Math.sin(time * 0.01 + k) * 30;
        y += Math.cos(time * 0.013 + k) * 20;
      }
      if (kind === 'mist') {
        c.globalAlpha = 0.06 + 0.05 * Math.sin(time * 0.01 + k);
        c.fillRect(camX + x, camY + y, 160 + sx * 140, 26 + sy * 20);
        continue;
      }
      c.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(time * 0.03 + k));
      if (kind === 'leaves') c.fillStyle = ['#d9542f', '#e98a2c', '#efc145'][k % 3];
      const s = kind === 'feathers' || kind === 'leaves' ? 4 : kind === 'embers' ? 3 : 2;
      c.fillRect(camX + x, camY + y, s, kind === 'feathers' || kind === 'leaves' ? 3 : s);
    }
    c.restore();
  }
  // Barre de boss en haut de l'écran : boss d'instance (progression du raid) ou boss mondial proche.
  function drawCanaanBossFrame(c) {
    const boss = game.world.monsters
      .filter(m => (game.world.instance ? m.boss : m.worldBoss) && m.hp > 0)
      .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    if (!boss || (Math.hypot(boss.x - P.x, boss.y - P.y) > 640 && boss.hp >= boss.mhp)) return;
    const arena = !!game.world.instance?.arena,
      d = game.world.instance && !arena ? instances[game.world.instance.index] : null,
      count = d ? (d.bosses || [d.boss]).length : 0,
      edge = d ? d.color : boss.bossColor || '#ffd36d',
      w = Math.min(520, W - 40),
      x = (W - w) / 2,
      y = 160,
      ratio = Math.max(0, boss.hp / boss.mhp),
      mode = instanceDifficulty();
    c.save();
    c.fillStyle = 'rgba(8,8,14,.82)';
    c.fillRect(x - 4, y - 24, w + 8, 46);
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.strokeRect(x - 4, y - 24, w + 8, 46);
    c.font = 'bold 14px system-ui,sans-serif';
    c.textAlign = 'left';
    c.fillStyle = '#ffe9b0';
    c.fillText((d || arena ? '☠ ' : '⭐ ') + boss.t, x + 4, y - 6);
    c.textAlign = 'right';
    c.fillStyle = '#c8c0d8';
    const label = arena
      ? CANAAN_ARENA.frameLabel(boss)
      : !d
        ? 'Boss mondial'
        : boss.secretBoss !== undefined
          ? 'Boss caché'
          : count > 1
            ? 'Boss ' + ((boss.bossStage || 0) + 1) + '/' + count
            : 'Boss';
    c.fillText(label + (mode ? ' · ' + mode.label : ''), x + w - 4, y - 6);
    c.fillStyle = '#2a1418';
    c.fillRect(x, y, w, 14);
    c.fillStyle = ratio > 0.3 ? '#c8303a' : '#ff6a3c';
    c.fillRect(x, y, w * ratio, 14);
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.fillRect(x, y, w * ratio, 4);
    c.font = 'bold 11px system-ui,sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#fff';
    c.fillText(
      Math.ceil(boss.hp) + ' / ' + boss.mhp + ' · ' + Math.round(ratio * 100) + ' %',
      x + w / 2,
      y + 11
    );
    // Bonus du boss et malus infligés par les héros, sous la barre.
    if (window.CANAAN_BUFF_BAR) CANAAN_BUFF_BAR.drawMonster(c, boss, x - 4, y + 28, w + 8);
    c.restore();
  }
  // Coffres : bois cerclé de fer et mousse pour les coffres cachés, or et gemme pour le coffre de boss.
  const CHESTS = {};
  function canaanChestSprite(kind) {
    if (CHESTS[kind]) return CHESTS[kind];
    const boss = kind === 'boss',
      cv = canvas(24, 20),
      g = cv.getContext('2d'),
      r = (x, y, w, h, col) => rect(g, x, y, w, h, col),
      wood = boss ? '#5a1a2a' : '#7a5232',
      woodLight = boss ? '#8a2a40' : '#a07040',
      woodDark = boss ? '#3a0e1a' : '#5a3a20',
      band = boss ? '#d4aa3a' : '#4a4a52',
      bandLight = boss ? '#fff0a8' : '#8a8a94';
    r(2, 9, 20, 10, wood);
    r(2, 12, 20, 1, woodDark);
    r(2, 15, 20, 1, woodDark);
    r(2, 18, 20, 1, woodDark);
    r(4, 2, 16, 1, wood);
    r(2, 3, 20, 6, wood);
    r(3, 3, 18, 1, woodLight);
    r(2, 6, 20, 1, woodLight);
    r(2, 9, 20, 1, '#2a160a');
    for (const x of [5, 17]) {
      r(x, 2, 2, 17, band);
      r(x, 2, 1, 17, bandLight);
    }
    r(2, 3, 1, 16, band);
    r(21, 3, 1, 16, band);
    r(10, 7, 4, 5, boss ? '#fff0a8' : '#d4aa3a');
    r(10, 7, 4, 1, '#fff6c8');
    r(11, 9, 2, 2, '#2a1a0a');
    if (boss) {
      r(11, 3, 2, 2, '#7de0ff');
      r(11, 3, 1, 1, '#ffffff');
      r(7, 13, 2, 2, '#ffd36d');
      r(15, 13, 2, 2, '#ffd36d');
    } else {
      r(2, 17, 6, 2, '#4a7a3a');
      r(3, 16, 3, 1, '#6a9a52');
      r(15, 2, 5, 1, '#5a8a44');
      r(19, 18, 3, 1, '#4a7a3a');
    }
    canaanPolish(cv, 1, boss ? 3 : 1);
    CHESTS[kind] = canaanOutline(cv, 1);
    return CHESTS[kind];
  }
  // Dessine un coffre au sol, avec son éclat et sa lueur ; le coffre de boss est surmonté d'un rayon de lumière.
  function drawCanaanChest(c, x, y, boss, seed = 0) {
    const spr = canaanChestSprite(boss ? 'boss' : 'secret'),
      s = boss ? 2.6 : 2,
      w = spr.width * s,
      h = spr.height * s;
    c.save();
    c.fillStyle = 'rgba(10,8,6,.35)';
    c.beginPath();
    c.ellipse(x, y + h * 0.42, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
    c.fill();
    if (boss) {
      c.globalAlpha = 0.18 + Math.sin(time * 0.05) * 0.06;
      c.fillStyle = '#fff0a8';
      c.fillRect(x - w * 0.3, y - 260, w * 0.6, 260);
      c.globalAlpha = 1;
    }
    c.imageSmoothingEnabled = false;
    c.drawImage(spr, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
    // Éclat qui passe sur le couvercle de temps en temps.
    const cycle = (time + seed * 37) % (boss ? 70 : 150);
    if (cycle < 18) {
      const k = Math.sin((cycle / 18) * Math.PI),
        sx = x - w * 0.3 + (cycle / 18) * w * 0.6,
        sy = y - h * 0.28;
      c.globalAlpha = k;
      c.fillStyle = '#ffffff';
      c.fillRect(sx - 1, sy - 5 * k, 2, 10 * k);
      c.fillRect(sx - 5 * k, sy - 1, 10 * k, 2);
      c.globalAlpha = 1;
    }
    c.restore();
    canaanLight(x, y - h * 0.2, boss ? 200 : 80, boss ? '#fff0a8' : '#ffd36b');
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    canaanOutline,
    canaanPolish,
    canaanActorSprite: actor,
    canaanActorPortrait: actorPortrait,
    drawCanaanActor,
    canaanLight,
    resetCanaanLights,
    drawCanaanLighting,
    drawCanaanBossFrame,
    drawCanaanChest
  });
})();
