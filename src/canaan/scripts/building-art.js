// Bâtiments en pixel art « cosy » : chaque bâtiment est dessiné sur une grille de gros pixels (1 pixel d'art =
// 2 pixels d'écran, comme les animaux et les décors), en aplats francs de 3 à 5 tons par matière, puis cerné d'un
// contour sombre et agrandi sans flou. Grands toits à pignon en tuiles rangées, colombages, fenêtres rondes à
// croisillons, auvents rayés, porches de planches, cheminées de pierre, lierre et mousse ; un modèle par bâtiment,
// accordé à son biome. Le module rend une image (à la taille des pixels d'art) et la liste des effets animés.
(() => {
  'use strict';
  const U = 2;
  const INK = '#2a1810';
  // Rampes de couleurs : [reflet, clair, base, ombre, profond].
  const RAMP = {
    roofRed: ['#f4a070', '#e0704a', '#b84a32', '#86321f', '#561e14'],
    roofSlate: ['#a0b8dc', '#7690c0', '#56709e', '#3c5078', '#26324e'],
    roofMoss: ['#a4d872', '#74b04e', '#4e8a3a', '#34662a', '#20421c'],
    roofPurple: ['#e2a0f0', '#bc74d8', '#9450b8', '#6a3590', '#44205e'],
    roofThatch: ['#f6dc8a', '#e2bc62', '#c09642', '#94702c', '#62481c'],
    roofBrown: ['#d8905a', '#b86c3c', '#94502c', '#6a3620', '#442214'],
    roofTeal: ['#9ae0d8', '#5ab8b0', '#3a908c', '#286a68', '#184444'],
    plaster: ['#fff6e4', '#f6e4c6', '#e0c8a4', '#bea482'],
    peach: ['#ffc890', '#f4a066', '#d07a44', '#a0562c'],
    sand: ['#fbe2b4', '#ecc88e', '#d2a86c', '#a8804c'],
    wood: ['#d8a066', '#b47c46', '#8e5a30', '#663c1e', '#42260f'],
    darkwood: ['#9a6a40', '#764a2a', '#54321a', '#38200f'],
    logs: ['#c08a54', '#9c6a3c', '#784c28', '#523218'],
    stone: ['#d4d0c6', '#b2aea4', '#8e8a82', '#6a6760', '#4a4844'],
    brick: ['#d8806a', '#b45e4a', '#8e4436', '#622c22'],
    purpleStone: ['#c4b8dc', '#a296c0', '#7e74a0', '#5c5480', '#3e3860'],
    glass: ['#e0fbff', '#8ee0f8', '#56b4e4', '#2e7ab4'],
    leaf: ['#9ad868', '#6eb048', '#4a8a34', '#2e6224'],
    autumnLeaf: ['#f6c25a', '#ea8a36', '#c85a26', '#8e3a1a'],
    cloth: ['#fff4dc', '#e8d4b0'],
    red: ['#f06a5a', '#c84838', '#8e2c22'],
    green: ['#8ad470', '#56a648', '#2e7034'],
    blue: ['#7ab4f0', '#4a84cc', '#2c5a98'],
    // Cité elfique : pierre blanche, feuillages, or et jade.
    elfStone: ['#ffffff', '#f2eee2', '#dcd4c0', '#b4ac98', '#8a8270'],
    elfLeaf: ['#c8f0a0', '#8ad070', '#5aa850', '#3a7a3c', '#24502a'],
    elfGold: ['#fff4b0', '#f0d060', '#c8a038', '#8a6a1e'],
    jade: ['#b0f0d8', '#6ad0b0', '#3aa088', '#24705e', '#164a40']
  };
  // ---------------------------------------------------------------- Pinceau sur la grille de pixels d'art
  function brush(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    const k = {
      cv,
      g,
      w,
      h,
      rect(x, y, rw, rh, col) {
        if (rw <= 0 || rh <= 0) return;
        g.fillStyle = col;
        g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
      },
      px(x, y, col) {
        g.fillStyle = col;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      },
      // Polygone plein (balayage par lignes, sans anticrénelage).
      poly(pts, col) {
        let y0 = Infinity,
          y1 = -Infinity;
        for (const [, y] of pts) {
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
        g.fillStyle = col;
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const xs = [];
          for (let i = 0; i < pts.length; i++) {
            const [ax, ay] = pts[i],
              [bx, by] = pts[(i + 1) % pts.length];
            if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
          }
          xs.sort((a, b) => a - b);
          for (let i = 0; i + 1 < xs.length; i += 2) g.fillRect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]), 1);
        }
      },
      line(x0, y0, x1, y1, col, t = 1) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        g.fillStyle = col;
        for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t);
      },
      disc(cx, cy, r, col) {
        g.fillStyle = col;
        for (let y = -r; y <= r; y++) {
          const hw = Math.round(Math.sqrt(r * r - y * y));
          g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
        }
      }
    };
    return k;
  }
  // Contour sombre d'un pixel autour de toutes les formes (pixels transparents qui touchent une forme).
  function outline(k) {
    const img = k.g.getImageData(0, 0, k.w, k.h),
      d = img.data,
      w = k.w,
      h = k.h,
      a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]),
      out = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if (a(x, y) < 128 && (a(x - 1, y) > 128 || a(x + 1, y) > 128 || a(x, y - 1) > 128 || a(x, y + 1) > 128)) out.push(y * w + x);
    for (const i of out) {
      d[i * 4] = 42;
      d[i * 4 + 1] = 24;
      d[i * 4 + 2] = 16;
      d[i * 4 + 3] = 255;
    }
    k.g.putImageData(img, 0, 0);
  }
  const hash = (a, b) => {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // ---------------------------------------------------------------- Éléments
  // Pan de toit : quadrilatère (bord d'égout A→B, profondeur vers le haut), tuiles en rangées parallèles à la pente,
  // décalées d'une demi-tuile, bas arrondi, reflet en haut de chaque rangée.
  function roofPlane(k, A, B, depth, ramp, light, tileW = 6, rowH = 4) {
    const sx = B[0] - A[0],
      sy = B[1] - A[1],
      len = Math.hypot(sx, sy),
      x0 = Math.floor(Math.min(A[0], B[0])) - 1,
      x1 = Math.ceil(Math.max(A[0], B[0])) + 1,
      y0 = Math.floor(Math.min(A[1], B[1]) - depth) - 1,
      y1 = Math.ceil(Math.max(A[1], B[1])) + 1,
      tone = light ? 1 : 2;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5,
          py = y + 0.5;
        // p = A + a·s + b·(0, -depth)
        const a = (px - A[0]) / sx;
        if (!(a >= 0 && a <= 1)) continue;
        const b = (A[1] + a * sy - py) / depth;
        if (!(b >= 0 && b <= 1)) continue;
        const along = a * len,
          up = b * depth,
          row = Math.floor(up / rowH),
          rv = up - row * rowH,
          ca = (along + (row % 2) * (tileW / 2)) % tileW;
        let col = ramp[tone];
        if (rv < 1) col = ramp[tone + 1];
        else if (rv >= rowH - 1) col = ramp[tone - 1];
        if (ca < 1 && rv > 1) col = ramp[tone + 1];
        else if (rv < 2 && (ca < 1.5 || ca > tileW - 1.5)) col = ramp[tone + 1];
        if (b > 0.94) col = ramp[tone + 2];
        k.px(x, y, col);
      }
  }
  // Toit vu de face, rangées horizontales (toit à long pan) : rectangle incliné en trapèze.
  function roofFlat(k, x, y, w, h, ramp, tileW = 6, rowH = 4, inset = 0) {
    for (let r = 0; r * rowH < h; r++) {
      const yy = y + h - (r + 1) * rowH,
        ins = Math.round((inset * r * rowH) / h),
        xa = x + ins,
        xb = x + w - ins;
      // Croupes aux deux bouts, symétriques : la gauche au soleil, la droite à l'ombre ; les tuiles (joints et rangs)
      // continuent jusqu'au bord, seule leur teinte change.
      const hip = Math.max(3, Math.round((xb - xa) * 0.1));
      for (const [x0, x1, base, joint] of [
        [xa, xa + hip, ramp[0], ramp[1]],
        [xa + hip, xb - hip, ramp[1], ramp[2]],
        [xb - hip, xb, ramp[2], ramp[3]]
      ]) {
        k.rect(x0, yy, x1 - x0, rowH, base);
        k.rect(x0, yy + rowH - 1, x1 - x0, 1, ramp[3]);
        k.rect(x0, yy, x1 - x0, 1, x0 === xa + hip ? ramp[0] : base);
        for (let tx = xa + (r % 2) * (tileW / 2); tx < xb; tx += tileW) if (tx >= x0 && tx < x1) k.rect(tx, yy + 1, 1, rowH - 2, joint);
      }
      // Arêtes des croupes.
      k.rect(xa + hip, yy, 1, rowH - 1, ramp[2]);
      k.rect(xb - hip - 1, yy, 1, rowH - 1, ramp[0]);
    }
    // Faîtage clair au sommet.
    {
      const ins = Math.round((inset * (Math.ceil(h / rowH) - 1) * rowH) / h);
      k.rect(x + ins, y + h - Math.ceil(h / rowH) * rowH - 1, w - ins * 2, 2, ramp[3]);
      k.rect(x + ins + 1, y + h - Math.ceil(h / rowH) * rowH - 1, w - ins * 2 - 2, 1, ramp[0]);
    }
  }
  function wallPlaster(k, x, y, w, h, ramp, timber) {
    k.rect(x, y, w, h, ramp[1]);
    k.rect(x, y, 2, h, ramp[0]);
    k.rect(x + w - 3, y, 3, h, ramp[2]);
    k.rect(x, y, w, 2, ramp[3]);
    for (let i = 0; i < 9; i++) k.rect(x + 4 + hash(i, x) * (w - 10), y + 4 + hash(x, i) * (h - 8), 2, 1, ramp[2]);
    if (timber) {
      k.rect(x, y, 3, h, timber[1]);
      k.rect(x + w - 3, y, 3, h, timber[2]);
      k.rect(x, y + h - 3, w, 3, timber[1]);
      k.rect(x, y, w, 3, timber[2]);
    }
  }
  function wallPlanks(k, x, y, w, h, ramp, horizontal) {
    k.rect(x, y, w, h, ramp[1]);
    if (horizontal) {
      for (let yy = y; yy < y + h; yy += 4) {
        k.rect(x, yy, w, 1, ramp[0]);
        k.rect(x, yy + 3, w, 1, ramp[3]);
        k.rect(x + Math.floor(hash(yy, x) * (w - 6)), yy + 1, 1, 2, ramp[3]);
      }
    } else {
      for (let xx = x; xx < x + w; xx += 5) {
        k.rect(xx, y, 1, h, ramp[0]);
        k.rect(xx + 4, y, 1, h, ramp[3]);
        k.px(xx + 2, y + 3 + Math.floor(hash(xx, y) * (h - 6)), ramp[3]);
      }
    }
    k.rect(x + w - 3, y, 3, h, ramp[2]);
  }
  function wallStone(k, x, y, w, h, ramp) {
    k.rect(x, y, w, h, ramp[3]);
    for (let r = 0, yy = y; yy < y + h; r++, yy += 5) {
      let xx = x - (r % 2) * 4;
      while (xx < x + w) {
        const sw = 6 + Math.floor(hash(xx, r) * 5),
          a = Math.max(x, xx),
          b = Math.min(x + w, xx + sw - 1),
          hh = Math.min(4, y + h - yy);
        if (b > a) {
          k.rect(a, yy, b - a, hh, ramp[hash(r, xx) < 0.3 ? 2 : 1]);
          k.rect(a, yy, b - a, 1, ramp[0]);
        }
        xx += sw;
      }
    }
    k.rect(x + w - 3, y, 3, h, ramp[3]);
  }
  function wallLogs(k, x, y, w, h, ramp) {
    for (let yy = y; yy < y + h; yy += 5) {
      k.rect(x, yy, w, 5, ramp[1]);
      k.rect(x, yy, w, 1, ramp[0]);
      k.rect(x, yy + 4, w, 1, ramp[3]);
      k.px(x + 6 + Math.floor(hash(yy, w) * (w - 12)), yy + 2, ramp[3]);
      for (const ex of [x - 3, x + w - 1]) {
        k.rect(ex, yy, 4, 5, ramp[0]);
        k.rect(ex + 1, yy + 1, 2, 3, ramp[2]);
      }
    }
  }
  function windowRect(k, x, y, w, h, frame, shutters) {
    k.rect(x - 1, y - 1, w + 2, h + 2, frame[2]);
    k.rect(x, y, w, h, RAMP.glass[2]);
    k.rect(x, y, w, Math.ceil(h / 2), RAMP.glass[1]);
    k.rect(x + 1, y + 1, 2, 2, RAMP.glass[0]);
    k.rect(x + Math.floor(w / 2), y, 1, h, frame[1]);
    k.rect(x, y + Math.floor(h / 2), w, 1, frame[1]);
    k.rect(x - 2, y + h + 1, w + 4, 2, frame[1]);
    if (shutters)
      for (const sx of [x - 5, x + w + 1]) {
        k.rect(sx, y - 1, 4, h + 2, shutters[1]);
        k.rect(sx, y - 1, 4, 1, shutters[0]);
        for (let yy = y + 1; yy < y + h; yy += 3) k.rect(sx + 1, yy, 2, 1, shutters[2]);
      }
  }
  function windowRound(k, cx, cy, r, frame) {
    k.disc(cx, cy, r + 1, frame[2]);
    k.disc(cx, cy, r, RAMP.glass[2]);
    k.disc(cx - 1, cy - 1, r - 1, RAMP.glass[1]);
    k.rect(cx - r, cy, r * 2 + 1, 1, frame[1]);
    k.rect(cx, cy - r, 1, r * 2 + 1, frame[1]);
    k.px(cx - r + 1, cy - r + 2, RAMP.glass[0]);
  }
  function windowArch(k, x, y, w, h, frame) {
    k.rect(x - 1, y + 2, w + 2, h - 1, frame[2]);
    k.disc(x + w / 2 - 0.5, y + 3, w / 2 + 0.5, frame[2]);
    k.rect(x, y + 3, w, h - 3, RAMP.glass[2]);
    k.disc(x + w / 2 - 0.5, y + 3, w / 2 - 0.5, RAMP.glass[1]);
    k.rect(x, y + 3, w, Math.floor(h / 3), RAMP.glass[1]);
    k.rect(x + Math.floor(w / 2), y, 1, h, frame[1]);
    k.rect(x - 1, y + h, w + 2, 2, frame[1]);
  }
  function door(k, cx, bot, w, h, ramp, style) {
    const x = Math.round(cx - w / 2);
    k.rect(x - 2, bot - h - 2, w + 4, h + 2, ramp[3]);
    if (style === 'arch') k.disc(cx - 0.5, bot - h + w / 2 - 1, w / 2 + 1, ramp[3]);
    k.rect(x, bot - h, w, h, ramp[1]);
    if (style === 'arch') k.disc(cx - 0.5, bot - h + w / 2 - 1, w / 2 - 0.5, ramp[1]);
    for (let xx = x + 3; xx < x + w; xx += 4) k.rect(xx, bot - h + (style === 'arch' ? 1 : 0), 1, h, ramp[2]);
    k.rect(x, bot - h, 1, h, ramp[0]);
    if (style === 'double') {
      k.rect(Math.round(cx), bot - h, 1, h, ramp[3]);
      k.rect(x + 2, bot - h + 3, w - 4, Math.floor(h / 3), RAMP.glass[2]);
      k.rect(x + 2, bot - h + 3, w - 4, 2, RAMP.glass[1]);
      k.rect(Math.round(cx), bot - h + 3, 1, Math.floor(h / 3), ramp[3]);
    } else {
      k.rect(x, bot - h + 4, w, 1, ramp[3]);
      k.rect(x, bot - 5, w, 1, ramp[3]);
    }
    k.rect(Math.round(cx) + Math.floor(w / 2) - 3, bot - Math.floor(h / 2), 2, 2, '#f0d070');
    // Marche.
    k.rect(x - 3, bot, w + 6, 3, RAMP.stone[1]);
    k.rect(x - 3, bot, w + 6, 1, RAMP.stone[0]);
  }
  function awning(k, x, y, w, a, b) {
    for (let i = 0; i < w; i += 4) {
      const col = (i / 4) % 2 ? b : a;
      k.rect(x + i, y, Math.min(4, w - i), 5, col);
      k.rect(x + i + 1, y + 5, Math.min(2, w - i - 1), 1, col);
    }
    k.rect(x, y, w, 1, '#ffffff');
  }
  function chimney(k, x, y, h, ramp) {
    k.rect(x, y, 10, h, ramp[2]);
    for (let yy = y + 1; yy < y + h; yy += 4) {
      k.rect(x, yy, 10, 1, ramp[3]);
      k.rect(x + ((yy / 4) % 2 ? 3 : 7), yy - 3, 1, 3, ramp[3]);
    }
    k.rect(x, y, 2, h, ramp[1]);
    k.rect(x - 1, y - 3, 12, 3, ramp[1]);
    k.rect(x - 1, y - 3, 12, 1, ramp[0]);
    k.rect(x + 2, y - 2, 6, 1, ramp[4] || ramp[3]);
  }
  function flowerBox(k, x, y, w, cols) {
    k.rect(x, y, w, 3, RAMP.wood[2]);
    k.rect(x, y, w, 1, RAMP.wood[1]);
    for (let i = 0; i < w; i += 2) {
      k.px(x + i, y - 1, RAMP.green[1]);
      if (i % 4 === 0) k.px(x + i + 1, y - 2, cols[(i / 4) % cols.length]);
    }
  }
  function mailbox(k, x, bot) {
    k.rect(x + 2, bot - 9, 2, 9, RAMP.darkwood[1]);
    k.rect(x, bot - 14, 7, 5, RAMP.blue[1]);
    k.rect(x, bot - 14, 7, 1, RAMP.blue[0]);
    k.rect(x + 6, bot - 16, 1, 3, RAMP.red[1]);
    k.rect(x + 5, bot - 16, 2, 1, RAMP.red[0]);
  }
  function fence(k, x0, x1, bot, ramp = RAMP.wood) {
    k.rect(x0, bot - 7, x1 - x0, 2, ramp[2]);
    k.rect(x0, bot - 4, x1 - x0, 2, ramp[2]);
    for (let x = x0; x < x1; x += 5) {
      k.rect(x, bot - 9, 2, 9, ramp[1]);
      k.px(x, bot - 9, ramp[0]);
    }
  }
  function bush(k, cx, bot, r, ramp, flowers) {
    k.disc(cx, bot - r, r, ramp[2]);
    k.disc(cx - 1, bot - r - 1, r - 1, ramp[1]);
    k.disc(cx - 2, bot - r - 2, Math.max(1, r - 3), ramp[0]);
    if (flowers) for (let i = 0; i < 5; i++) k.px(cx - r + 1 + hash(i, cx) * (r * 2 - 2), bot - r * 2 + 1 + hash(cx, i) * r * 1.4, flowers[i % flowers.length]);
  }
  function barrel(k, x, bot) {
    k.rect(x, bot - 10, 8, 10, RAMP.wood[2]);
    k.rect(x + 1, bot - 10, 2, 10, RAMP.wood[1]);
    k.rect(x, bot - 8, 8, 1, '#5a5a62');
    k.rect(x, bot - 3, 8, 1, '#5a5a62');
    k.rect(x, bot - 10, 8, 1, RAMP.wood[0]);
  }
  function crate(k, x, bot, s = 8) {
    k.rect(x, bot - s, s, s, RAMP.wood[1]);
    k.rect(x, bot - s, s, 1, RAMP.wood[0]);
    k.line(x, bot - s, x + s - 1, bot - 1, RAMP.wood[3]);
    k.rect(x + s - 1, bot - s, 1, s, RAMP.wood[3]);
  }
  function lantern(k, x, bot, fx, toWorld) {
    k.rect(x, bot - 18, 1, 18, RAMP.darkwood[2]);
    k.rect(x - 2, bot - 22, 5, 5, '#ffd06a');
    k.rect(x - 2, bot - 22, 5, 1, RAMP.darkwood[2]);
    k.px(x - 1, bot - 21, '#fff4c0');
    const [wx, wy] = toWorld(x, bot - 20);
    fx.push([0, wx, wy, 70, '#ffcf6a']);
  }
  function vines(k, x, y, len, seed) {
    let cx = x;
    for (let i = 0; i < len; i++) {
      cx += Math.round(Math.sin((i + seed) * 0.7));
      k.px(cx, y + i, RAMP.leaf[2]);
      if (i % 3 === 0) {
        k.px(cx + 1, y + i, RAMP.leaf[1]);
        k.px(cx - 1, y + i + 1, RAMP.leaf[0]);
      }
    }
  }
  function mossPatch(k, x, y, w, seed) {
    for (let i = 0; i < w; i++) {
      const hgt = 1 + Math.floor(hash(i + seed, seed) * 3);
      k.rect(x + i, y - hgt + 1, 1, hgt, RAMP.roofMoss[hash(seed, i) < 0.5 ? 1 : 2]);
      if (hash(i, seed + 3) > 0.8) k.px(x + i, y - hgt, RAMP.roofMoss[0]);
    }
  }
  function shroom(k, x, bot, col) {
    k.rect(x + 1, bot - 3, 2, 3, '#f4ead0');
    k.rect(x, bot - 5, 4, 2, col);
    k.px(x + 1, bot - 5, '#ffffff');
  }
  // ---------------------------------------------------------------- Maison à pignon (base de la plupart des modèles)
  // o : x, w (largeur des murs), wallH, gableH, depth (profondeur du toit), ov (débord), roof, wall (fonction),
  //     gable (fonction), bot (bas des murs).
  // ---------------------------------------------------------------- Style elfique (organique)
  // Bardeaux, feuilles, branches torsadées, fenêtres de cristal, portes en arc à pentures de fer, paniers de fleurs.
  const ELF = {
    woodShingle: ['#f2cc94', '#d8a868', '#b8884c', '#8a6234', '#5a3e20'],
    leafShingle: ['#c4ec90', '#8cca62', '#5ea44a', '#3e7a36', '#264c22'],
    mossShingle: ['#a8d878', '#78b058', '#548a42', '#3a6632', '#244222'],
    silverShingle: ['#eef4ff', '#c4d0e4', '#9cacc8', '#6e7c9c', '#4a5674'],
    stucco: ['#fffaf0', '#f2e6ca', '#dccaa4', '#b8a27c'],
    bark: ['#b08458', '#80583a', '#5a3c24', '#3a2614'],
    plank: ['#d8a470', '#b8844e', '#94643a', '#6a4426', '#46301c'],
    iron: '#3a3036',
    crystal: ['#e8fffc', '#9af0f0', '#58c8e0', '#3a8ab8', '#2a5a8a'],
    flowers: ['#b08aff', '#8a6ae8', '#f6a0d8', '#ffffff', '#6aa8ff']
  };
  // Courbe de Bézier quadratique (liste de points).
  function bez(a, c, b, n = 12) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    return out;
  }
  // Lignes d'un polygone : pour chaque rangée, les segments [x0, x1) à remplir.
  function spans(pts) {
    let y0 = Infinity,
      y1 = -Infinity;
    for (const [, y] of pts) {
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    const rows = [];
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i],
          [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) rows.push([y, Math.round(xs[i]), Math.round(xs[i + 1])]);
    }
    return rows;
  }
  // Toit en écailles dans un polygone : bardeaux de bois arrondis (leaf : feuilles pointues à nervure), rangées
  // décalées, éclairage de gauche, reflet en haut de chaque écaille, variations par écaille.
  function shingles(k, pts, ramp, o = {}) {
    const sw = o.w || 7,
      sh = o.h || 6,
      leaf = !!o.leaf,
      rows = spans(pts);
    if (!rows.length) return;
    const minX = Math.min(...rows.map(r => r[1])),
      maxX = Math.max(...rows.map(r => r[2])),
      minY = rows[0][0],
      cx = o.cx ?? (minX + maxX) / 2,
      half = Math.max(1, (maxX - minX) / 2),
      step = sh - 1;
    for (const [y, xa, xb] of rows)
      for (let x = xa; x < xb; x++) {
        const ry = y - minY,
          row = Math.floor(ry / step),
          ly = ry - row * step,
          off = (row % 2) * Math.floor(sw / 2),
          rx = x - minX + off + 64 * sw,
          col = Math.floor(rx / sw),
          lx = rx - col * sw,
          v = hash(col, row + 7);
        const lit = -(x - cx) / half + (v - 0.5) * 0.6 - (ry / 120) * 0.2,
          t = lit > 0.55 ? 0 : lit > -0.1 ? 1 : lit > -0.7 ? 2 : 3,
          dark = n => ramp[Math.min(ramp.length - 1, t + n)],
          mid = (sw - 1) / 2,
          d = Math.abs(lx - mid),
          // Écaille de bois : bas arrondi ; feuille : large en haut, pointue en bas.
          hw = leaf ? (mid + 0.6) * Math.sqrt(Math.max(0, 1 - Math.pow(ly / step, 2.4))) : ly < step - 3 ? mid + 0.6 : (mid + 0.6) * Math.sqrt(Math.max(0, 1 - Math.pow((ly - (step - 4)) / 3.2, 2)));
        let c = ramp[t];
        if (d > hw) c = dark(2);
        else if (d > hw - 1) c = dark(1);
        else if (ly <= 1 && lx <= mid) c = ramp[Math.max(0, t - 1)];
        else if (leaf && Math.round(mid) === lx && ly > 0 && ly < step - 2) c = dark(1);
        else if (!leaf && lx > mid + 1 && ly > 1) c = ramp[Math.min(ramp.length - 1, t + (ly > step - 4 ? 1 : 0))];
        k.px(x, y, c);
      }
  }
  // Branche torsadée le long d'un tracé : épaisseur t, modelé (clair à gauche, sombre à droite), nœuds.
  function branch(k, pts, t, ramp = ELF.bark) {
    let dist = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1],
        [bx, by] = pts[i],
        n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
      for (let s = 0; s <= n; s++, dist++) {
        const x = ax + ((bx - ax) * s) / n,
          y = ay + ((by - ay) * s) / n,
          w = Math.max(1, Math.round(t * (0.85 + 0.15 * Math.sin(dist * 0.4))));
        k.rect(x - w / 2, y, w, 1, ramp[1]);
        k.px(x - w / 2, y, ramp[0]);
        if (w > 2) k.px(x + w / 2 - 1, y, ramp[2]);
        if (dist % 9 === 4 && w > 2) k.px(x, y, ramp[3]);
      }
    }
  }
  // Fenêtre de cristal en arc : cadre de bois, verre bleu-turquoise en losanges, lueur.
  function crystalWindow(k, e, x, y, w, h) {
    k.rect(x - 2, y + 2, w + 4, h, ELF.bark[1]);
    k.disc(x + w / 2 - 0.5, y + 3, w / 2 + 1.5, ELF.bark[1]);
    k.rect(x, y + 3, w, h - 2, ELF.crystal[2]);
    k.disc(x + w / 2 - 0.5, y + 3, w / 2 - 0.5, ELF.crystal[1]);
    k.rect(x, y + 3, w, Math.floor(h / 3), ELF.crystal[1]);
    // Plombs en losanges, dans le verre seulement.
    for (let yy = y + 4; yy < y + h + 1; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy) % 4 === 0 || (xx - yy + 400) % 4 === 0) k.px(xx, yy, ELF.crystal[3]);
    k.rect(x + 1, y + 3, 2, 2, ELF.crystal[0]);
    k.rect(x - 3, y + h + 1, w + 6, 2, ELF.bark[0]);
    e.window(x, y + 3, w, h - 2);
  }
  // Porte en arc de planches, pentures de fer recourbées, anneau, marche de pierre.
  function archDoor(k, cx, bot, w, h, ramp = ELF.plank) {
    const x = Math.round(cx - w / 2);
    k.rect(x - 2, bot - h + w / 2, w + 4, h - w / 2, ELF.bark[2]);
    k.disc(cx - 0.5, bot - h + w / 2, w / 2 + 2, ELF.bark[2]);
    k.rect(x, bot - h + w / 2, w, h - w / 2, ramp[1]);
    k.disc(cx - 0.5, bot - h + w / 2, w / 2, ramp[1]);
    for (let xx = x + 3; xx < x + w - 1; xx += 4) k.rect(xx, bot - h + 2, 1, h - 2, ramp[3]);
    k.rect(x, bot - h + w / 2, 1, h - w / 2, ramp[0]);
    for (const yy of [bot - h + w / 2 + 3, bot - 6]) {
      k.rect(x + 1, yy, w - 4, 2, ELF.iron);
      k.px(x + w - 3, yy - 1, ELF.iron);
      k.px(x + w - 2, yy, ELF.iron);
    }
    k.disc(cx + w / 4, bot - h / 2.2, 1.5, '#c8a038');
    k.rect(x - 4, bot, w + 8, 3, RAMP.stone[1]);
    k.rect(x - 4, bot, w + 8, 1, RAMP.stone[0]);
  }
  // Panier de fleurs suspendu : chaîne, pot, grappe de fleurs et lierre qui retombe.
  function flowerBasket(k, x, y) {
    k.rect(x, y - 6, 1, 6, ELF.iron);
    k.rect(x - 4, y, 9, 4, '#8a5a34');
    k.rect(x - 4, y, 9, 1, '#b07a48');
    for (let i = 0; i < 14; i++) k.px(x - 5 + hash(i, x) * 11, y - 3 + hash(x, i) * 4, ELF.flowers[i % 5]);
    for (const vx of [x - 4, x + 4]) for (let i = 0; i < 7; i++) k.px(vx + (i % 2), y + 4 + i, i % 3 ? '#4e8a3a' : '#8ad070');
  }
  // Lierre fleuri qui grimpe (fleurs violettes).
  function vineBloom(k, x, y, len, seed) {
    vines(k, x, y, len, seed);
    for (let i = 3; i < len; i += 5) k.px(x + Math.round(Math.sin((i + seed) * 0.7)) + (i % 2 ? 1 : -1), y + i, ELF.flowers[(i + seed) % 3]);
  }
  // Chouette perchée.
  function owlPerch(k, x, y) {
    k.rect(x - 3, y - 8, 7, 8, '#8a7a68');
    k.rect(x - 2, y - 5, 5, 5, '#d8ccb8');
    k.rect(x - 3, y - 10, 2, 2, '#6a5a4a');
    k.rect(x + 2, y - 10, 2, 2, '#6a5a4a');
    k.px(x - 2, y - 7, '#ffd36d');
    k.px(x + 2, y - 7, '#ffd36d');
    k.px(x, y - 5, '#c8a038');
  }
  // Mur de crépi crème avec colombages de branches.
  function elfStucco(k, x, y, w, h, beams = []) {
    k.rect(x, y, w, h, ELF.stucco[1]);
    k.rect(x, y, 2, h, ELF.stucco[0]);
    k.rect(x + w - 3, y, 3, h, ELF.stucco[2]);
    for (let i = 0; i < 8; i++) k.rect(x + 3 + hash(i, x + y) * (w - 8), y + 3 + hash(x, i) * (h - 6), 2, 1, ELF.stucco[2]);
    for (const b of beams) branch(k, b, 3);
  }
  // Socle de pierres moussues.
  function mossBase(k, x, y, w) {
    k.rect(x, y, w, 6, RAMP.stone[2]);
    for (let xx = x; xx < x + w; xx += 6) {
      k.rect(xx + 1, y + 1, 4, 4, hash(xx, y) > 0.5 ? RAMP.stone[1] : RAMP.stone[2]);
      k.px(xx + 1, y + 1, RAMP.stone[0]);
    }
    for (let xx = x; xx < x + w; xx += 3) if (hash(xx, y, 3) > 0.5) k.rect(xx, y - 1, 2, 2, hash(xx, 1) > 0.5 ? '#5aa448' : '#3e7a36');
  }
  // Feuillage au pied (fougères et buissons).
  function ferns(k, x, bot, n, seed) {
    for (let i = 0; i < n; i++) {
      const fx = x + i * 5 + Math.round(hash(i, seed) * 3);
      for (let j = 0; j < 5; j++) {
        k.line(fx, bot, fx - 3 + j * 1.5, bot - 5 - (j % 2) * 2, j % 2 ? '#5aa448' : '#86c860');
      }
    }
  }

  function gableHouse(k, o) {
    const { x, w, wallH, gableH, depth, ov = 4, roof, bot } = o,
      top = bot - wallH,
      cx = x + w / 2,
      apex = top - gableH;
    // Pans du toit (derrière le pignon), puis le faîtage.
    roofPlane(k, [x - ov, top + 3], [cx, apex - 2], depth, roof, true, o.tileW, o.rowH);
    roofPlane(k, [cx, apex - 2], [x + w + ov, top + 3], depth, roof, false, o.tileW, o.rowH);
    k.rect(Math.round(cx) - 1, apex - 2 - depth, 3, depth + 1, roof[3]);
    k.rect(Math.round(cx) - 1, apex - 2 - depth, 1, depth + 1, roof[1]);
    // Mur de face et pignon.
    o.wall(k, x, top, w, wallH);
    k.poly([[x, top + 1], [cx, apex], [x + w, top + 1]], o.gableRamp[1]);
    if (o.gable) o.gable(k, x, top, w, cx, apex);
    // Planches de rive le long du pignon.
    for (const [ax, ay, bx, by] of [[x - ov, top + 3, cx, apex - 2], [cx, apex - 2, x + w + ov, top + 3]]) {
      k.line(ax, ay, bx, by, o.trim[2], 2);
      k.line(ax, ay - 1, bx, by - 1, o.trim[1]);
    }
    return { top, apex, cx, roofTop: apex - 2 - depth };
  }
  // ---------------------------------------------------------------- Modèles
  // Chaque modèle reçoit le pinceau, la largeur en pixels d'art, le bas des murs et les outils d'effets.
  const MODELS = {
    // Ta maison : chaumière des Plaines, murs pêche, pignon à colombages, fenêtre ronde, auvent vert, boîte aux lettres.
    maison(k, W, bot, e) {
      const x = 10,
        w = W - 20;
      const r = gableHouse(k, {
        x, w, bot, wallH: 30, gableH: 22, depth: 26, roof: RAMP.roofRed, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, wx, wy, ww, wh) => wallPlaster(k2, wx, wy, ww, wh, RAMP.peach, RAMP.darkwood),
        gable: (k2, gx, gy, gw, cx, apex) => {
          k2.rect(gx + 2, gy - 2, gw - 4, 3, RAMP.darkwood[1]);
          k2.line(cx - 12, gy - 2, cx, apex + 4, RAMP.darkwood[1]);
          k2.line(cx + 12, gy - 2, cx, apex + 4, RAMP.darkwood[1]);
          windowRound(k2, cx, gy - 9, 4, RAMP.darkwood);
        }
      });
      chimney(k, x + w - 18, r.roofTop + 8, 20, RAMP.stone);
      e.smoke(x + w - 13, r.roofTop + 4);
      windowRect(k, x + 8, bot - 22, 10, 9, RAMP.darkwood);
      flowerBox(k, x + 6, bot - 11, 14, ['#f06a8a', '#ffe070', '#ffffff']);
      door(k, W / 2, bot, 12, 18, RAMP.wood, 'double');
      awning(k, W / 2 - 9, bot - 23, 18, '#7ad070', '#ffffff');
      windowRect(k, x + w - 18, bot - 22, 10, 9, RAMP.darkwood);
      flowerBox(k, x + w - 20, bot - 11, 14, ['#f06a8a', '#ffe070', '#ffffff']);
      mailbox(k, x - 9, bot + 2);
      fence(k, x + w + 2, x + w + 16, bot + 1);
      bush(k, x + w + 8, bot - 6, 5, RAMP.leaf, ['#f06a8a', '#ffffff']);
      e.window(x + 8, bot - 22, 10, 9);
      e.window(x + w - 18, bot - 22, 10, 9);
      return r.roofTop - 10;
    },
    // La Marmite dorée : grande auberge, rez de pierre, étage à colombages, deux pignons, enseigne au bol.
    marmite(k, W, bot, e) {
      const x = 6,
        w = W - 12;
      wallStone(k, x, bot - 22, w, 22, RAMP.stone);
      const r = gableHouse(k, {
        x: x + 4, w: w - 8, bot: bot - 22, wallH: 24, gableH: 22, depth: 24, roof: RAMP.roofSlate, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, wx, wy, ww, wh) => wallPlaster(k2, wx, wy, ww, wh, RAMP.plaster, RAMP.darkwood),
        gable: (k2, gx, gy, gw, cx) => windowRound(k2, cx, gy - 9, 4, RAMP.darkwood)
      });
      k.rect(x, bot - 24, w, 3, RAMP.darkwood[1]);
      k.rect(x, bot - 24, w, 1, RAMP.darkwood[0]);
      for (const wx of [x + 10, x + w / 2 - 5, x + w - 20]) {
        windowRect(k, wx, bot - 42, 10, 9, RAMP.darkwood, RAMP.blue);
        e.window(wx, bot - 42, 10, 9);
      }
      windowRect(k, x + 10, bot - 17, 10, 9, RAMP.darkwood);
      windowRect(k, x + w - 20, bot - 17, 10, 9, RAMP.darkwood);
      e.window(x + 10, bot - 17, 10, 9);
      e.window(x + w - 20, bot - 17, 10, 9);
      door(k, W / 2, bot, 12, 18, RAMP.wood, 'arch');
      chimney(k, x + w - 22, r.roofTop + 8, 22, RAMP.brick);
      e.smoke(x + w - 17, r.roofTop + 4);
      e.sign(x - 6, bot - 30, 'bol');
      barrel(k, x - 6, bot + 1);
      barrel(k, x + w - 1, bot + 1);
      barrel(k, x + w + 7, bot - 2);
      lantern(k, x + w / 2 - 12, bot - 2, e.fx, e.toWorld);
      return r.roofTop - 10;
    },
    // Échoppe de Lira : boutique à long pan, grande vitrine, auvent rayé rouge, étal de fruits et caisses.
    echoppe(k, W, bot, e) {
      const x = 8,
        w = W - 16,
        top = bot - 32;
      roofFlat(k, x - 6, top - 30, w + 12, 32, RAMP.roofRed, 6, 4, 6);
      wallPlanks(k, x, top, w, 32, RAMP.wood, true);
      k.rect(x, top, w, 3, RAMP.darkwood[1]);
      // Pignon de façade au-dessus de la porte.
      k.poly([[W / 2 - 18, top + 1], [W / 2, top - 16], [W / 2 + 18, top + 1]], RAMP.plaster[1]);
      k.line(W / 2 - 20, top + 2, W / 2, top - 17, RAMP.darkwood[2], 2);
      k.line(W / 2, top - 17, W / 2 + 20, top + 2, RAMP.darkwood[2], 2);
      windowRound(k, W / 2, top - 6, 3, RAMP.darkwood);
      // Vitrine.
      k.rect(x + 6, bot - 22, 22, 13, RAMP.darkwood[2]);
      k.rect(x + 7, bot - 21, 20, 11, RAMP.glass[2]);
      k.rect(x + 7, bot - 21, 20, 5, RAMP.glass[1]);
      for (let i = 0; i < 4; i++) k.rect(x + 9 + i * 5, bot - 14, 3, 3, ['#f06a5a', '#ffd060', '#7ad070', '#c88ae8'][i]);
      e.window(x + 7, bot - 21, 20, 11);
      awning(k, x + 4, bot - 28, 26, '#e0503c', '#fff4dc');
      door(k, W / 2, bot, 12, 18, RAMP.wood, 'double');
      windowRect(k, x + w - 20, bot - 21, 12, 9, RAMP.darkwood);
      e.window(x + w - 20, bot - 21, 12, 9);
      // Étal.
      k.rect(x + w + 2, bot - 9, 18, 3, RAMP.wood[1]);
      k.rect(x + w + 3, bot - 6, 2, 6, RAMP.wood[2]);
      k.rect(x + w + 17, bot - 6, 2, 6, RAMP.wood[2]);
      for (let i = 0; i < 6; i++) k.disc(x + w + 5 + i * 3, bot - 11, 1, ['#f06a5a', '#ffd060', '#7ad070'][i % 3]);
      crate(k, x - 10, bot + 1);
      crate(k, x - 6, bot - 7, 7);
      e.sign(x - 4, bot - 34, 'or');
      return top - 40;
    },
    // Demeure des Aubépines : maison blanche à colombages, toit d'ardoise, haie d'aubépines en fleurs, lucarne.
    aubepines(k, W, bot, e) {
      const x = 10,
        w = W - 20;
      const r = gableHouse(k, {
        x, w, bot, wallH: 30, gableH: 24, depth: 26, roof: RAMP.roofSlate, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, wx, wy, ww, wh) => {
          wallPlaster(k2, wx, wy, ww, wh, RAMP.plaster, RAMP.darkwood);
          for (const sx of [wx + 22, wx + ww - 25]) {
            k2.line(sx, wy + 3, sx + 6, wy + wh - 3, RAMP.darkwood[1]);
            k2.line(sx + 6, wy + 3, sx, wy + wh - 3, RAMP.darkwood[1]);
          }
        },
        gable: (k2, gx, gy, gw, cx) => {
          windowRect(k2, cx - 5, gy - 14, 10, 9, RAMP.darkwood);
          e.window(cx - 5, gy - 14, 10, 9);
        }
      });
      chimney(k, x + 12, r.roofTop + 10, 18, RAMP.brick);
      e.smoke(x + 17, r.roofTop + 6);
      windowRect(k, x + 6, bot - 22, 10, 9, RAMP.darkwood, RAMP.green);
      windowRect(k, x + w - 16, bot - 22, 10, 9, RAMP.darkwood, RAMP.green);
      e.window(x + 6, bot - 22, 10, 9);
      e.window(x + w - 16, bot - 22, 10, 9);
      door(k, W / 2, bot, 11, 18, RAMP.wood, 'arch');
      for (const bx of [x - 4, x + 4, x + w - 4, x + w + 4]) bush(k, bx, bot + 1, 5, RAMP.leaf, ['#ffffff', '#f6b0c8']);
      return r.roofTop - 10;
    },
    // Demeure du Puits : maison de pierre au toit bleu, perron, puits couvert à côté.
    puits(k, W, bot, e) {
      const x = 12,
        w = W - 32;
      const r = gableHouse(k, {
        x, w, bot, wallH: 30, gableH: 20, depth: 24, roof: RAMP.roofSlate, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, wx, wy, ww, wh) => wallStone(k2, wx, wy, ww, wh, RAMP.stone),
        gable: (k2, gx, gy, gw, cx) => windowRound(k2, cx, gy - 8, 3, RAMP.darkwood)
      });
      windowRect(k, x + 5, bot - 22, 9, 9, RAMP.darkwood, RAMP.blue);
      e.window(x + 5, bot - 22, 9, 9);
      door(k, x + w / 2 + 4, bot, 11, 18, RAMP.wood, 'double');
      flowerBox(k, x + 4, bot - 11, 12, ['#9a7ae0', '#ffffff']);
      // Puits.
      const px = x + w + 4;
      wallStone(k, px, bot - 9, 16, 9, RAMP.stone);
      k.rect(px + 1, bot - 26, 2, 17, RAMP.darkwood[1]);
      k.rect(px + 13, bot - 26, 2, 17, RAMP.darkwood[1]);
      k.poly([[px - 3, bot - 25], [px + 8, bot - 33], [px + 19, bot - 25]], RAMP.roofSlate[1]);
      k.rect(px - 3, bot - 26, 22, 2, RAMP.roofSlate[3]);
      k.rect(px + 7, bot - 24, 1, 9, '#d8d0c0');
      k.rect(px + 5, bot - 16, 5, 4, RAMP.wood[2]);
      return r.roofTop - 10;
    },
    // Refuge du Vieux Chêne : vieille maison de bois envahie par la mousse et le lierre, champignons sur le toit.
    chene(k, W, bot, e) {
      const x = 14,
        w = W - 28;
      const r = gableHouse(k, {
        x, w, bot, wallH: 28, gableH: 22, depth: 24, roof: RAMP.roofBrown, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, wx, wy, ww, wh) => wallPlanks(k2, wx, wy, ww, wh, RAMP.plaster, false),
        gable: (k2, gx, gy, gw, cx) => {
          windowRect(k2, cx - 4, gy - 12, 8, 7, RAMP.darkwood);
          e.window(cx - 4, gy - 12, 8, 7);
        }
      });
      // Mousse en coulées sur le toit, lierre, champignons.
      for (let i = 0; i < 7; i++) mossPatch(k, x - 2 + i * 9, r.top + 3 - i * 2.5, 6, i);
      for (let i = 0; i < 5; i++) mossPatch(k, x + w / 2 + 2 + i * 8, r.apex + 2 + i * 3, 6, i + 9);
      for (let i = 0; i < 6; i++) mossPatch(k, x + w / 2 - 4 + hash(i, 4) * 8, r.roofTop + 4 + i * 4, 4, i + 20);
      vines(k, x + 2, r.top + 2, 22, 1);
      vines(k, x + w - 4, r.top + 2, 18, 3);
      vines(k, x + w / 2, r.apex + 4, 10, 5);
      for (const [sx, sy, col] of [[x + 6, r.top - 2, '#e0503c'], [x + 12, r.top - 6, '#e0503c'], [x + w - 12, r.top - 4, '#f06a8a'], [x + w / 2 - 3, r.roofTop + 10, '#e0503c']]) shroom(k, sx, sy, col);
      windowRect(k, x + 6, bot - 20, 9, 8, RAMP.darkwood);
      windowRect(k, x + w - 15, bot - 20, 9, 8, RAMP.darkwood);
      e.window(x + 6, bot - 20, 9, 8);
      e.window(x + w - 15, bot - 20, 9, 8);
      door(k, W / 2, bot, 12, 18, RAMP.wood, 'arch');
      vines(k, W / 2 + 6, bot - 20, 12, 7);
      for (const [sx, col] of [[x - 6, '#e0503c'], [x - 1, '#f6e070'], [x + w + 4, '#e0503c']]) shroom(k, sx, bot + 1, col);
      lantern(k, x - 3, bot, e.fx, e.toWorld);
      return r.roofTop - 10;
    },
    // Refuge des Clairières : chalet en rondins, porche couvert sur toute la largeur, toit de bardeaux verts, bûches.
    clairieres(k, W, bot, e) {
      const x = 12,
        w = W - 24;
      const r = gableHouse(k, {
        x, w, bot: bot - 4, wallH: 30, gableH: 26, depth: 24, roof: RAMP.roofMoss, trim: RAMP.darkwood, gableRamp: RAMP.logs,
        wall: (k2, wx, wy, ww, wh) => wallLogs(k2, wx, wy, ww, wh, RAMP.logs),
        gable: (k2, gx, gy, gw, cx) => {
          for (let yy = gy - 2; yy > gy - 22; yy -= 5) k2.rect(cx - (gy - yy) * 0.9, yy, (gy - yy) * 1.8, 1, RAMP.logs[3]);
          windowRect(k2, cx - 5, gy - 14, 10, 8, RAMP.darkwood);
          e.window(cx - 5, gy - 14, 10, 8);
        }
      });
      // Porche : plancher, poteaux, auvent de bardeaux.
      k.rect(x - 6, bot - 5, w + 12, 5, RAMP.wood[1]);
      k.rect(x - 6, bot - 5, w + 12, 1, RAMP.wood[0]);
      k.rect(x - 6, bot - 1, w + 12, 1, RAMP.wood[3]);
      roofFlat(k, x - 8, bot - 40, w + 16, 8, RAMP.roofMoss, 6, 4, 0);
      for (const px of [x - 5, x + w + 3]) k.rect(px, bot - 32, 3, 27, RAMP.logs[1]);
      for (let px = x - 2; px < x + w + 2; px += 4) if (Math.abs(px - W / 2) > 10) k.rect(px, bot - 12, 1, 7, RAMP.wood[2]);
      k.rect(x - 4, bot - 13, w + 8, 2, RAMP.wood[1]);
      windowRect(k, x + 6, bot - 28, 10, 9, RAMP.darkwood, RAMP.darkwood);
      windowRect(k, x + w - 16, bot - 28, 10, 9, RAMP.darkwood, RAMP.darkwood);
      e.window(x + 6, bot - 28, 10, 9);
      e.window(x + w - 16, bot - 28, 10, 9);
      door(k, W / 2, bot - 5, 12, 20, RAMP.wood, 'planks');
      chimney(k, x + w - 16, r.roofTop + 8, 20, RAMP.stone);
      e.smoke(x + w - 11, r.roofTop + 4);
      // Bûches.
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 3 - row; i++) {
          const lx = x + w + 8 + i * 6 + row * 3,
            ly = bot - 4 - row * 5;
          k.disc(lx, ly, 2, RAMP.logs[1]);
          k.px(lx, ly, RAMP.logs[3]);
        }
      lantern(k, x - 9, bot, e.fx, e.toWorld);
      return r.roofTop - 10;
    },
    // Refuge de l'Oasis : maison de terre crue blanchie, dôme bleu, arcades, palmier et jarres.
    oasis(k, W, bot, e) {
      const x = 10,
        w = W - 20,
        top = bot - 30;
      k.rect(x, top, w, 30, RAMP.sand[1]);
      k.rect(x, top, 3, 30, RAMP.sand[0]);
      k.rect(x + w - 4, top, 4, 30, RAMP.sand[2]);
      k.rect(x - 2, top - 4, w + 4, 4, RAMP.sand[0]);
      k.rect(x - 2, top - 1, w + 4, 1, RAMP.sand[2]);
      for (let px = x + 4; px < x + w - 4; px += 9) k.rect(px, top + 1, 3, 2, RAMP.darkwood[1]);
      // Dôme.
      const cx = W / 2,
        R0 = Math.round(w * 0.32);
      for (let y = -R0; y <= 0; y++) {
        const hw = Math.round(Math.sqrt(R0 * R0 - y * y));
        k.rect(cx - hw, top - 4 + y, hw * 2, 1, RAMP.roofTeal[2]);
        k.rect(cx - hw, top - 4 + y, Math.round(hw * 0.7), 1, RAMP.roofTeal[1]);
        k.rect(cx - hw, top - 4 + y, Math.round(hw * 0.25), 1, RAMP.roofTeal[0]);
        if ((y & 3) === 0) k.rect(cx - hw, top - 4 + y, hw * 2, 1, RAMP.roofTeal[3]);
      }
      k.rect(cx - R0 - 1, top - 5, R0 * 2 + 2, 2, RAMP.sand[0]);
      k.rect(cx, top - 4 - R0 - 7, 1, 7, '#e0b040');
      k.disc(cx, top - 4 - R0 - 8, 1, '#f6d870');
      for (const ax of [x + 5, x + w - 16]) {
        windowArch(k, ax, top + 7, 10, 13, RAMP.darkwood);
        e.window(ax, top + 9, 10, 11);
      }
      door(k, cx, bot, 12, 20, RAMP.wood, 'arch');
      // Palmier.
      const tx = x - 8;
      for (let i = 0; i < 34; i += 2) k.rect(tx + Math.round(Math.sin(i * 0.08) * 3), bot - i - 2, 4, 2, i % 4 ? RAMP.logs[1] : RAMP.logs[2]);
      for (const [dx, dy, len] of [[-14, 2, 14], [12, 2, 14], [-10, -4, 12], [8, -5, 12], [0, -7, 8]]) {
        for (let i = 0; i < len; i++) {
          const fx = tx + 2 + Math.sign(dx) * i,
            fy = bot - 36 + dy + Math.round((i * i) / 18);
          k.rect(fx, fy, 2, 2, i > len - 4 ? RAMP.leaf[1] : RAMP.leaf[2]);
          if (i % 2) k.px(fx, fy + 2, RAMP.leaf[3]);
        }
      }
      for (const [jx, h, col] of [[x + w + 3, 9, '#d07a40'], [x + w + 9, 7, '#a85a2c']]) {
        k.rect(jx, bot - h, 6, h, col);
        k.rect(jx + 1, bot - h - 2, 4, 2, col);
        k.rect(jx + 1, bot - h + 1, 1, h - 2, '#ffd0a0');
      }
      k.rect(cx - 12, bot + 3, 24, 4, RAMP.red[1]);
      k.rect(cx - 10, bot + 4, 20, 2, '#e0b040');
      return top - 4 - R0 - 14;
    },
    // Camp des Dunes : grande tente de nomades rayée, mâts, cordages, foyer, jarres et fanion.
    dunes(k, W, bot, e) {
      const cx = W / 2,
        half = W / 2 - 6,
        apex = bot - 54,
        stripes = ['#fff0d6', '#c8483a', '#fff0d6', '#3a6aaa'];
      for (let y = apex; y < bot; y++) {
        const t = (y - apex) / (bot - apex),
          hw = Math.round((0.12 + t * 0.88) * half);
        for (let x = -hw; x < hw; x++) {
          const band = Math.floor(((x / hw) * 0.5 + 0.5) * 9);
          let col = stripes[band % stripes.length];
          if (x > hw * 0.45) col = band % 2 ? '#a83a2e' : band % 4 === 1 ? '#d8c8a6' : '#2e5690';
          if (x < -hw * 0.7) col = band % 2 ? '#e05a4a' : '#ffffff';
          k.px(cx + x, y, col);
        }
        if ((y - apex) % 12 === 0) k.rect(cx - hw, y, hw * 2, 1, '#00000033');
      }
      // Entrée relevée.
      k.poly([[cx - 11, bot], [cx, bot - 30], [cx + 11, bot]], '#3a2418');
      k.poly([[cx - 11, bot], [cx - 3, bot - 26], [cx - 16, bot - 4]], '#e8d4b0');
      k.poly([[cx + 11, bot], [cx + 3, bot - 26], [cx + 16, bot - 4]], '#d0bc96');
      e.window(cx - 6, bot - 18, 12, 18);
      // Mât, cordages, piquets.
      k.rect(cx, apex - 12, 1, 12, RAMP.darkwood[1]);
      e.flag(cx, apex - 14, '#c8483a', 12);
      for (const s of [-1, 1]) {
        k.line(cx + s * (half - 8), bot - 30, cx + s * (half + 8), bot, '#d8c8a0');
        k.rect(cx + s * (half + 8) - 1, bot - 2, 2, 3, RAMP.darkwood[2]);
      }
      // Foyer.
      for (let i = 0; i < 5; i++) k.rect(8 + i * 3, bot - 1, 3, 2, i % 2 ? RAMP.stone[2] : RAMP.stone[1]);
      e.campfire(15, bot - 1);
      for (const [jx, h, col] of [[W - 12, 9, '#d07a40'], [W - 6, 7, '#a85a2c']]) {
        k.rect(jx, bot - h, 5, h, col);
        k.rect(jx + 1, bot - h - 2, 3, 2, col);
      }
      k.rect(cx - 14, bot + 2, 28, 4, RAMP.red[1]);
      k.rect(cx - 12, bot + 3, 24, 2, '#e0b040');
      return apex - 20;
    },
    // Refuge des Pilotis : maison de roseaux sur pilotis, ponton de planches, toit de chaume, filets et lanternes.
    pilotis(k, W, bot, e) {
      const x = 12,
        w = W - 24,
        deck = bot - 10;
      for (const px of [x - 4, x + 10, x + w - 12, x + w + 2]) {
        k.rect(px, deck, 3, 12, RAMP.darkwood[1]);
        k.rect(px, deck, 1, 12, RAMP.darkwood[0]);
      }
      k.rect(x - 8, deck - 3, w + 16, 4, RAMP.wood[1]);
      k.rect(x - 8, deck - 3, w + 16, 1, RAMP.wood[0]);
      for (let px = x - 8; px < x + w + 8; px += 5) k.rect(px, deck - 3, 1, 4, RAMP.wood[3]);
      const r = gableHouse(k, {
        x, w, bot: deck - 3, wallH: 26, gableH: 26, depth: 22, roof: RAMP.roofThatch, trim: RAMP.darkwood, gableRamp: RAMP.wood, tileW: 3, rowH: 3,
        wall: (k2, wx, wy, ww, wh) => wallPlanks(k2, wx, wy, ww, wh, RAMP.wood, false),
        gable: (k2, gx, gy, gw, cx) => {
          windowRound(k2, cx, gy - 10, 4, RAMP.darkwood);
        }
      });
      // Frange de chaume.
      for (let px = x - 4; px < x + w + 4; px += 2) k.rect(px, r.top + 2, 1, 2 + Math.floor(hash(px, 1) * 3), RAMP.roofThatch[2]);
      windowRect(k, x + 5, deck - 22, 9, 8, RAMP.darkwood);
      windowRect(k, x + w - 14, deck - 22, 9, 8, RAMP.darkwood);
      e.window(x + 5, deck - 22, 9, 8);
      e.window(x + w - 14, deck - 22, 9, 8);
      door(k, W / 2, deck - 3, 11, 17, RAMP.darkwood, 'planks');
      // Échelle jusqu'au sol.
      k.rect(W / 2 - 6, deck, 1, 11, RAMP.darkwood[2]);
      k.rect(W / 2 + 5, deck, 1, 11, RAMP.darkwood[2]);
      for (let yy = deck + 2; yy < bot; yy += 3) k.rect(W / 2 - 6, yy, 12, 1, RAMP.wood[1]);
      // Filet de pêche et lanternes.
      k.rect(x - 14, deck - 22, 1, 22, RAMP.darkwood[1]);
      for (let i = 0; i < 9; i += 2) k.rect(x - 13, deck - 20 + i, 8, 1, '#d8d0b0');
      for (let i = 0; i < 8; i += 2) k.rect(x - 13 + i, deck - 20, 1, 9, '#d8d0b0');
      lantern(k, x + w + 6, deck - 3, e.fx, e.toWorld);
      e.ripple(x - 10, bot, w + 20);
      return r.roofTop - 8;
    },
    // Refuge des Feuilles Rousses : grande maison de bois à pignon et aile latérale, terrasse de planches, citrouilles.
    rousses(k, W, bot, e) {
      const x = 8,
        deck = bot - 6;
      // Aile droite (toit à long pan).
      const wx = W / 2 + 2,
        ww = W - wx - 8;
      roofFlat(k, wx - 2, deck - 52, ww + 6, 22, RAMP.roofBrown, 6, 4, 0);
      wallPlaster(k, wx, deck - 30, ww, 30, RAMP.peach, RAMP.darkwood);
      for (const ax of [wx + 6, wx + ww - 16]) {
        windowArch(k, ax, deck - 26, 9, 12, RAMP.darkwood);
        e.window(ax, deck - 23, 9, 9);
      }
      chimney(k, wx + ww - 10, deck - 60, 14, RAMP.stone);
      e.smoke(wx + ww - 5, deck - 64);
      // Corps principal à pignon.
      const r = gableHouse(k, {
        x, w: W / 2 - 4, bot: deck, wallH: 32, gableH: 24, depth: 22, roof: RAMP.roofBrown, trim: RAMP.darkwood, gableRamp: RAMP.plaster,
        wall: (k2, ax, ay, aw, ah) => wallPlaster(k2, ax, ay, aw, ah, RAMP.peach, RAMP.darkwood),
        gable: (k2, gx, gy, gw, cx) => windowRound(k2, cx, gy - 9, 4, RAMP.darkwood)
      });
      windowRect(k, x + W / 4 + 2, deck - 22, 9, 9, RAMP.darkwood);
      e.window(x + W / 4 + 2, deck - 22, 9, 9);
      awning(k, x + 3, deck - 30, 14, '#e05a4a', '#fff4dc');
      k.rect(x + 5, deck - 24, 10, 18, '#3a2418');
      // Terrasse de planches sur toute la largeur, rambarde, marches au milieu.
      k.rect(4, deck, W - 8, 6, RAMP.wood[1]);
      k.rect(4, deck, W - 8, 1, RAMP.wood[0]);
      for (let px = 4; px < W - 4; px += 6) k.rect(px, deck + 1, 1, 5, RAMP.wood[3]);
      for (let px = 4; px < W - 4; px += 4) if (Math.abs(px - W / 2) > 9) k.rect(px, deck - 7, 1, 7, RAMP.wood[2]);
      k.rect(4, deck - 8, W / 2 - 13, 2, RAMP.wood[1]);
      k.rect(W / 2 + 9, deck - 8, W / 2 - 13, 2, RAMP.wood[1]);
      door(k, W / 2, deck, 12, 18, RAMP.wood, 'double');
      for (let i = 0; i < 3; i++) k.rect(W / 2 - 8, deck + i * 2, 16, 2, i % 2 ? RAMP.wood[2] : RAMP.wood[1]);
      crate(k, wx + 8, deck);
      for (const [px, py] of [[2, bot + 1], [9, bot + 2], [W - 12, bot + 1]]) {
        k.disc(px + 3, py - 3, 3, '#e07a28');
        k.rect(px + 2, py - 7, 2, 2, RAMP.green[2]);
        k.rect(px + 3, py - 6, 1, 6, '#b05a1a');
      }
      e.leaves(-10, bot - 90, W + 20, 90, ['#ea8a36', '#c85a26', '#f6c25a']);
      return Math.min(r.roofTop, deck - 66) - 8;
    },
    // Refuge des Cristaux : tour de pierre au toit conique violet, lierre, fenêtres en arc, cristal au sommet.
    // ---------------------------------------------------------------- Cité elfique de Sylvaëlle
    // Maison des Feuillages : grand pignon de bardeaux de bois dont la pointe s'enroule, aile basse au toit bombé,
    // crépi crème à colombages de branches, porte en arc, panier de fleurs, lierre fleuri, chouette sur le faîte.
    elfe_maison(k, W, bot, e) {
      const base = bot - 6,
        top = base - 30;
      mossBase(k, 10, base, W - 20);
      elfStucco(k, 50, top, 58, 30, [[[50, top], [50, base]], [[106, top], [106, base]], [[54, base], [74, top + 6]]]);
      crystalWindow(k, e, 82, top + 8, 12, 14);
      shingles(k, [...bez([42, top + 8], [44, top - 14], [58, top - 24]), ...bez([58, top - 24], [88, top - 34], [114, top - 26]), [118, top - 18], [116, top + 8]], ELF.woodShingle, { cx: 64 });
      branch(k, bez([58, top - 24], [88, top - 35], [116, top - 26]), 3);
      elfStucco(k, 14, top - 4, 40, 34, [[[14, top - 4], [14, base]], [[52, top - 4], [52, base]]]);
      const L = [...bez([2, top + 12], [4, top - 30], [28, top - 60]), ...bez([28, top - 60], [40, top - 70], [46, top - 62]), ...bez([46, top - 62], [38, top - 54], [38, top - 44]), ...bez([38, top - 44], [54, top - 18], [62, top + 10])];
      shingles(k, L, ELF.woodShingle, { cx: 26 });
      branch(k, bez([2, top + 12], [4, top - 30], [28, top - 60]), 3);
      branch(k, bez([38, top - 44], [54, top - 18], [62, top + 10]), 3);
      archDoor(k, 32, base, 16, 26);
      crystalWindow(k, e, 25, top - 30, 8, 10);
      flowerBasket(k, 16, top + 4);
      vineBloom(k, 12, top - 2, 32, 3);
      vineBloom(k, 52, top + 2, 26, 7);
      vineBloom(k, 106, top - 6, 30, 11);
      owlPerch(k, 86, top - 33);
      ferns(k, 98, bot, 3, 2);
      return top - 72;
    },
    // Maison des Racines : grand pignon de feuilles au faîte de branche enroulée, ailes basses moussues, murs de
    // planches, grande porte ronde sous un écu, fenêtres de cristal.
    elfe_racines(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        top = base - 28;
      mossBase(k, 8, base, W - 16);
      for (const s of [-1, 1]) {
        const wx = s < 0 ? 12 : W - 40;
        wallPlanks(k, wx, top + 8, 28, base - top - 8, RAMP.wood, false);
        crystalWindow(k, e, wx + 9, top + 12, 10, 12);
        const edge = s < 0 ? 6 : W - 6,
          inner = s < 0 ? cx - 18 : cx + 18;
        shingles(k, [[edge, top + 12], ...bez([edge, top + 12], [edge + s * -4, top - 2], [inner, top - 8]), [inner, top + 12]], ELF.mossShingle, { cx: s < 0 ? 20 : W - 20, leaf: true, w: 6, h: 6 });
      }
      wallPlanks(k, cx - 22, top - 4, 44, base - top + 4, RAMP.wood, false);
      const roof = [...bez([cx - 32, top + 4], [cx - 26, top - 36], [cx, top - 64]), ...bez([cx, top - 64], [cx + 26, top - 36], [cx + 32, top + 4])];
      shingles(k, roof, ELF.leafShingle, { cx, leaf: true, w: 8, h: 8 });
      branch(k, bez([cx - 32, top + 4], [cx - 26, top - 36], [cx, top - 64]), 3);
      branch(k, bez([cx + 32, top + 4], [cx + 26, top - 36], [cx, top - 64]), 3);
      branch(k, [...bez([cx, top - 2], [cx - 2, top - 40], [cx, top - 66]), ...bez([cx, top - 66], [cx + 2, top - 76], [cx + 8, top - 74]), [cx + 8, top - 70]], 4);
      archDoor(k, cx, base, 24, 30);
      k.poly([[cx - 7, top - 18], [cx + 7, top - 18], [cx + 7, top - 10], [cx, top - 4], [cx - 7, top - 10]], ELF.bark[1]);
      k.poly([[cx - 5, top - 16], [cx + 5, top - 16], [cx + 5, top - 10], [cx, top - 6], [cx - 5, top - 10]], '#3a6aa8');
      k.rect(cx - 1, top - 15, 2, 8, '#f0d060');
      flowerBasket(k, cx + 18, top - 2);
      e.pulse(cx, top - 12, 40, '#9fd8ff');
      ferns(k, 4, bot, 2, 5);
      return top - 80;
    },
    // Taverne de la Feuille d'Or : grand toit de larges feuilles à trois bosses, crépi blanc à colombages, double
    // porte en arc, vitrail, enseigne à la chope, écus de part et d'autre, lanterne.
    elfe_taverne(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        top = base - 32;
      mossBase(k, 8, base, W - 16);
      elfStucco(k, 12, top, W - 24, 32, [[[12, top], [12, base]], [[W - 13, top], [W - 13, base]], [[cx - 18, top], [cx - 18, base]], [[cx + 17, top], [cx + 17, base]], [[14, top + 16], [cx - 18, top + 4]]]);
      const roof = [[2, top + 8], ...bez([2, top + 8], [6, top - 26], [28, top - 34]), ...bez([28, top - 34], [cx - 10, top - 64], [cx, top - 66]), ...bez([cx, top - 66], [cx + 12, top - 62], [W - 28, top - 34]), ...bez([W - 28, top - 34], [W - 6, top - 26], [W - 2, top + 8])];
      shingles(k, roof, ELF.leafShingle, { cx: cx - 10, leaf: true, w: 11, h: 11 });
      branch(k, bez([cx - 20, top - 52], [cx, top - 70], [cx + 18, top - 54]), 3);
      archDoor(k, cx, base, 22, 28);
      k.rect(cx - 1, base - 26, 2, 26, ELF.bark[2]);
      crystalWindow(k, e, W - 34, top + 6, 12, 16);
      crystalWindow(k, e, 22, top + 8, 10, 12);
      // Enseigne à la chope dorée.
      k.poly([[cx - 9, top - 30], [cx + 9, top - 30], [cx + 9, top - 18], [cx, top - 12], [cx - 9, top - 18]], ELF.bark[1]);
      k.rect(cx - 4, top - 27, 7, 9, '#f0c040');
      k.rect(cx - 4, top - 27, 7, 2, '#ffffff');
      k.rect(cx + 3, top - 25, 2, 5, '#f0c040');
      for (const [sx, col] of [[-2, '#3a6aa8'], [W - 6, '#8a2a3a']]) {
        k.poly([[sx, base - 2], [sx + 8, base - 2], [sx + 8, base - 14], [sx + 4, base - 18], [sx, base - 14]], ELF.bark[1]);
        k.poly([[sx + 1, base - 3], [sx + 7, base - 3], [sx + 7, base - 13], [sx + 4, base - 16], [sx + 1, base - 13]], col);
        k.rect(sx + 3, base - 13, 2, 9, '#f0d060');
      }
      lantern(k, W - 16, base, e.fx, e.toWorld);
      vineBloom(k, 12, top + 2, 28, 4);
      vineBloom(k, W - 13, top + 2, 26, 9);
      return top - 70;
    },
    // Armurerie de Sylvaëlle : bardeaux de bois, écu doré, râteliers d'arcs et de lances, vitrail.
    elfe_armurerie(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        top = base - 30;
      mossBase(k, 10, base, W - 20);
      elfStucco(k, 16, top, W - 32, 30, [[[16, top], [16, base]], [[W - 17, top], [W - 17, base]], [[18, top + 28], [cx - 12, top + 2]]]);
      shingles(k, [[6, top + 8], ...bez([6, top + 8], [10, top - 24], [cx, top - 48]), ...bez([cx, top - 48], [W - 10, top - 24], [W - 6, top + 8])], ELF.woodShingle, { cx: cx - 8 });
      branch(k, bez([6, top + 8], [10, top - 24], [cx, top - 48]), 3);
      branch(k, bez([W - 6, top + 8], [W - 10, top - 24], [cx, top - 48]), 3);
      archDoor(k, cx, base, 16, 24);
      crystalWindow(k, e, 24, top + 6, 10, 14);
      k.poly([[cx - 7, top - 22], [cx + 7, top - 22], [cx + 7, top - 14], [cx, top - 6], [cx - 7, top - 14]], '#f0d060');
      k.line(cx - 4, top - 20, cx + 4, top - 10, '#ffffff');
      k.line(cx + 4, top - 20, cx - 4, top - 10, '#ffffff');
      for (const rx of [W - 34, W - 2]) {
        k.rect(rx, base - 18, 16, 2, ELF.bark[2]);
        k.rect(rx, base - 6, 16, 2, ELF.bark[2]);
        k.rect(rx, base - 18, 2, 18, ELF.bark[3]);
        k.rect(rx + 14, base - 18, 2, 18, ELF.bark[3]);
        for (let i = 0; i < 3; i++) {
          k.rect(rx + 4 + i * 4, base - 28, 1, 26, ELF.bark[0]);
          k.poly([[rx + 3 + i * 4, base - 28], [rx + 4.5 + i * 4, base - 33], [rx + 6 + i * 4, base - 28]], '#e0e8f0');
        }
      }
      for (let i = 0; i < 3; i++) {
        k.line(-4 + i * 4, base - 2, -2 + i * 4, base - 24, '#c8a038');
        k.line(-2 + i * 4, base - 24, i * 4, base - 2, '#e8e0d0');
      }
      vineBloom(k, 16, top + 2, 24, 6);
      e.sign(12, top - 4, 'or');
      return top - 52;
    },
    // Atelier de la Tisseuse : toit de feuilles moussues, soieries suspendues, mannequin en robe elfique.
    elfe_couture(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        top = base - 30;
      mossBase(k, 10, base, W - 20);
      elfStucco(k, 16, top, W - 32, 30, [[[16, top], [16, base]], [[W - 17, top], [W - 17, base]]]);
      shingles(k, [[6, top + 8], ...bez([6, top + 8], [12, top - 30], [cx - 6, top - 44]), ...bez([cx - 6, top - 44], [cx + 6, top - 52], [cx + 12, top - 44]), ...bez([cx + 12, top - 44], [W - 12, top - 26], [W - 6, top + 8])], ELF.mossShingle, { cx: cx - 10, leaf: true, w: 8, h: 8 });
      branch(k, bez([cx - 6, top - 44], [cx + 6, top - 54], [cx + 14, top - 46]), 3);
      k.rect(14, top + 2, W - 28, 1, ELF.bark[2]);
      ['#f6a0d0', '#9affe0', '#fff0a0', '#c8a8ff', '#f6a0d0'].forEach((col, i) => {
        const sx = 20 + i * Math.floor((W - 44) / 5);
        k.rect(sx, top + 3, 6, 10 + (i % 2) * 4, col);
        k.rect(sx, top + 3, 1, 10 + (i % 2) * 4, '#ffffff');
      });
      archDoor(k, cx, base, 16, 22);
      crystalWindow(k, e, W - 32, top + 14, 10, 12);
      const mx = W - 4;
      k.rect(mx, base - 4, 1, 4, ELF.bark[2]);
      k.poly([[mx - 6, base - 4], [mx + 7, base - 4], [mx + 3, base - 20], [mx - 2, base - 20]], '#9affe0');
      k.rect(mx - 2, base - 22, 5, 3, '#e8e0d0');
      k.disc(mx, base - 25, 2, '#d8c8a8');
      k.rect(mx - 5, base - 13, 12, 1, '#f0d060');
      flowerBasket(k, 20, top - 2);
      e.sign(12, top - 4, 'or');
      return top - 58;
    },
    // Tour des Étoiles : tour de crépi enlacée d'une branche en spirale, toit conique de bardeaux à pointe enroulée,
    // cristal au sommet.
    elfe_tour(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        tw = 32,
        x = cx - tw / 2,
        top = base - 78;
      mossBase(k, x - 8, base, tw + 16);
      elfStucco(k, x, top, tw, base - top);
      const spiral = [];
      for (let y = base; y > top; y -= 2) spiral.push([cx + Math.sin((base - y) * 0.12) * (tw / 2 - 1), y]);
      branch(k, spiral, 3);
      for (let i = 0; i < 3; i++) crystalWindow(k, e, cx - 4, top + 8 + i * 22, 8, 12);
      const apex = top - 50;
      shingles(k, [[x - 8, top + 4], ...bez([x - 8, top + 4], [x, top - 20], [cx - 2, apex]), ...bez([cx - 2, apex], [cx + 8, apex - 8], [cx + 10, apex + 2]), ...bez([cx + 10, apex + 2], [cx + 4, apex + 4], [cx + 6, apex + 10]), ...bez([cx + 6, apex + 10], [x + tw, top - 20], [x + tw + 8, top + 4])], ELF.woodShingle, { cx: cx - 6, w: 6, h: 5 });
      k.poly([[cx + 7, apex - 4], [cx + 10, apex - 14], [cx + 13, apex - 4], [cx + 10, apex]], '#bfffee');
      k.poly([[cx + 7, apex - 4], [cx + 10, apex - 14], [cx + 10, apex]], '#ffffff');
      e.pulse(cx + 10, apex - 8, 80, '#9affe8');
      archDoor(k, cx, base, 12, 18);
      vineBloom(k, x + 2, top + 20, 40, 3);
      return apex - 18;
    },
    // Temple de la Lune : crépi blanc, toit de bardeaux d'argent bombé, colonnes de branches, croissant d'argent.
    elfe_temple(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 6,
        top = base - 32;
      for (let i = 0; i < 3; i++) {
        k.rect(4 + i * 3, base + 3 - i * 3, W - 8 - i * 6, 3, RAMP.stone[i % 2 ? 2 : 1]);
        k.rect(4 + i * 3, base + 3 - i * 3, W - 8 - i * 6, 1, RAMP.stone[0]);
      }
      elfStucco(k, 16, top, W - 32, base - top - 3);
      for (const px of [14, 30, W - 34, W - 18]) branch(k, [[px, base - 3], [px + 1, top + 12], [px - 1, top]], 4);
      shingles(k, [[6, top + 6], ...bez([6, top + 6], [cx - 30, top - 40], [cx, top - 44]), ...bez([cx, top - 44], [cx + 30, top - 40], [W - 6, top + 6])], ELF.silverShingle, { cx: cx - 10, w: 7, h: 6 });
      k.disc(cx, top - 50, 6, '#e8f0ff');
      k.disc(cx + 3, top - 52, 5, ELF.silverShingle[3]);
      e.pulse(cx, top - 50, 60, '#c8dcff');
      crystalWindow(k, e, 36, top + 6, 8, 14);
      crystalWindow(k, e, W - 44, top + 6, 8, 14);
      archDoor(k, cx, base - 6, 14, 22, ELF.stucco);
      return top - 60;
    },
    // Demeure de la Reine : grande salle au toit de feuilles, rosace de cristal, deux tours aux flèches de bardeaux et
    // finials d'or, balcon aux bannières vert et or, grande porte dorée, perron et jardinières.
    elfe_palais(k, W, bot, e) {
      const cx = W / 2,
        base = bot - 8,
        top = base - 40;
      for (let i = 0; i < 3; i++) {
        k.rect(cx - 30 + i * 4, bot - 8 + i * 3, 60 - i * 8, 3, RAMP.stone[i % 2 ? 2 : 1]);
        k.rect(cx - 30 + i * 4, bot - 8 + i * 3, 60 - i * 8, 1, RAMP.stone[0]);
      }
      mossBase(k, 8, base, W - 16);
      // Tours.
      for (const s of [-1, 1]) {
        const tx = s < 0 ? 12 : W - 46,
          ttop = base - 66;
        elfStucco(k, tx, ttop, 34, base - ttop, [[[tx, ttop], [tx, base]], [[tx + 33, ttop], [tx + 33, base]]]);
        const spiral = [];
        for (let y = base; y > ttop; y -= 2) spiral.push([tx + 17 + Math.sin((base - y) * 0.1 + (s > 0 ? 3 : 0)) * 15, y]);
        branch(k, spiral, 3);
        crystalWindow(k, e, tx + 12, ttop + 10, 10, 16);
        crystalWindow(k, e, tx + 12, ttop + 38, 10, 14);
        const apex = ttop - 46,
          tc = tx + 17;
        shingles(k, [[tx - 8, ttop + 6], ...bez([tx - 8, ttop + 6], [tx + 2, ttop - 20], [tc, apex]), ...bez([tc, apex], [tx + 32, ttop - 20], [tx + 42, ttop + 6])], ELF.woodShingle, { cx: tc - 6, w: 6, h: 5 });
        k.rect(tc, apex - 10, 1, 10, '#f0d060');
        k.disc(tc, apex - 11, 2, '#fff4b0');
        e.pulse(tc, apex - 11, 50, '#fff0a0');
        e.flag(tc + 1, apex - 10, s < 0 ? '#3e8a4a' : '#f0d060', 10);
      }
      // Grande salle.
      elfStucco(k, 44, top, W - 88, base - top, [[[44, top], [44, base]], [[W - 45, top], [W - 45, base]]]);
      shingles(k, [[34, top + 10], ...bez([34, top + 10], [44, top - 40], [cx, top - 74]), ...bez([cx, top - 74], [W - 44, top - 40], [W - 34, top + 10])], ELF.leafShingle, { cx: cx - 12, leaf: true, w: 10, h: 10 });
      branch(k, bez([34, top + 10], [44, top - 40], [cx, top - 74]), 4);
      branch(k, bez([W - 34, top + 10], [W - 44, top - 40], [cx, top - 74]), 4);
      branch(k, [...bez([cx, top - 70], [cx - 3, top - 84], [cx + 4, top - 90]), [cx + 9, top - 86]], 4);
      // Rosace de cristal.
      k.disc(cx, top - 30, 12, ELF.bark[1]);
      k.disc(cx, top - 30, 10, ELF.crystal[2]);
      for (let a = 0; a < 8; a++) k.line(cx, top - 30, cx + Math.cos((a * Math.PI) / 4) * 10, top - 30 + Math.sin((a * Math.PI) / 4) * 10, ELF.crystal[3]);
      k.disc(cx, top - 30, 3, '#fff4b0');
      e.pulse(cx, top - 30, 90, '#bfffee');
      // Balcon et bannières.
      k.rect(cx - 34, top + 2, 68, 3, ELF.bark[1]);
      for (let x = cx - 33; x < cx + 34; x += 4) k.rect(x, top - 4, 1, 6, ELF.bark[2]);
      k.rect(cx - 34, top - 5, 68, 2, ELF.bark[0]);
      for (const bx of [cx - 28, cx + 20]) {
        k.rect(bx, top + 5, 8, 18, '#3e8a4a');
        k.rect(bx, top + 5, 8, 2, '#f0d060');
        k.rect(bx + 3, top + 10, 2, 8, '#f0d060');
        k.poly([[bx, top + 23], [bx + 4, top + 27], [bx + 8, top + 23]], '#3e8a4a');
      }
      crystalWindow(k, e, 54, top + 10, 12, 18);
      crystalWindow(k, e, W - 66, top + 10, 12, 18);
      // Grande porte dorée.
      archDoor(k, cx, base, 28, 34);
      for (let a = 0; a <= 16; a++) k.px(cx + Math.cos(Math.PI + (a / 16) * Math.PI) * 16, base - 20 + Math.sin(Math.PI + (a / 16) * Math.PI) * 16, '#f0d060');
      for (const fx of [48, W - 62]) {
        k.rect(fx, base - 4, 14, 4, '#8a5a34');
        for (let i = 0; i < 8; i++) k.px(fx + 1 + i * 1.6, base - 6 - (i % 2), ELF.flowers[i % 5]);
      }
      vineBloom(k, 44, top + 4, 34, 2);
      vineBloom(k, W - 45, top + 4, 34, 8);
      ferns(k, 2, bot, 3, 4);
      ferns(k, W - 16, bot, 3, 8);
      return top - 94;
    },
    // Refuge des Cristaux : tour de pierre violette au toit conique d'ardoises, cristal au sommet, lierre et cristaux.
    cristaux(k, W, bot, e) {
      const cx = W / 2,
        tw = 46,
        x = cx - tw / 2,
        top = bot - 74;
      for (let xx = 0; xx < tw; xx++) {
        const t = xx / tw,
          shade = t < 0.15 ? 1 : t > 0.78 ? 3 : t > 0.6 ? 2 : 1;
        for (let yy = top; yy < bot; yy++) {
          const row = Math.floor((yy - top) / 5),
            off = (row % 2) * 4,
            joint = (yy - top) % 5 === 4 || (xx + off) % 8 === 0;
          k.px(x + xx, yy, joint ? RAMP.purpleStone[4] : RAMP.purpleStone[shade]);
        }
      }
      k.rect(x, top, 2, bot - top, RAMP.purpleStone[0]);
      // Toit conique en rangées d'ardoises courbes.
      const apex = top - 46,
        half = tw / 2 + 6;
      for (let y = apex; y <= top + 4; y++) {
        const t = (y - apex) / (top + 4 - apex),
          hw = Math.max(1, Math.round(t * half)),
          row = Math.floor((y - apex) / 4),
          rv = (y - apex) % 4;
        for (let xx = -hw; xx <= hw; xx++) {
          const u = xx / hw;
          let col = u < -0.4 ? RAMP.roofPurple[1] : u > 0.5 ? RAMP.roofPurple[3] : RAMP.roofPurple[2];
          if (rv === 3) col = RAMP.roofPurple[u > 0.5 ? 4 : 3];
          else if (rv === 0 && u < 0.5) col = RAMP.roofPurple[0];
          if ((xx + row * 3 + 40) % 6 === 0 && rv > 0) col = RAMP.roofPurple[3];
          k.px(cx + xx, y, col);
        }
      }
      // Cristal au sommet.
      k.poly([[cx - 3, apex - 2], [cx, apex - 12], [cx + 3, apex - 2], [cx, apex + 2]], '#8ae8ff');
      k.poly([[cx - 3, apex - 2], [cx, apex - 12], [cx, apex + 2]], '#d8faff');
      e.pulse(cx, apex - 6, 70, '#9af0ff');
      // Fenêtres, porte, lierre et fleurs.
      for (const [wxp, wyp] of [[cx - 5, top + 10], [cx + 8, top + 30], [cx - 16, top + 32]]) {
        windowArch(k, wxp, wyp, 8, 11, RAMP.darkwood);
        e.window(wxp, wyp + 2, 8, 9);
      }
      door(k, cx, bot, 12, 20, RAMP.wood, 'arch');
      vines(k, cx - 10, apex + 10, 30, 2);
      vines(k, cx + 12, top - 6, 40, 6);
      vines(k, x + 3, top + 20, 30, 9);
      for (const [fx, fy] of [[cx + 13, top + 14], [x + 4, top + 34], [cx - 9, apex + 26], [cx + 11, top + 44]]) {
        k.px(fx, fy, '#ffffff');
        k.px(fx + 1, fy + 1, '#ffe070');
      }
      // Cristaux et champignons au pied.
      for (const [px, h, col] of [[x - 8, 14, '#9af0ff'], [x - 2, 9, '#c89aff'], [x + tw + 2, 16, '#9af0ff'], [x + tw + 8, 9, '#ffb0f0']]) {
        k.poly([[px - 2, bot], [px, bot - h], [px + 2, bot]], col);
        k.poly([[px - 2, bot], [px, bot - h], [px, bot]], '#ffffff');
        e.pulse(px, bot - h / 2, 40, col);
      }
      for (const [sx, col] of [[x - 14, '#c89aff'], [x + tw + 12, '#ff9af0']]) shroom(k, sx, bot + 1, col);
      return apex - 18;
    }
  };
  // ---------------------------------------------------------------- Ferme du camp (même style que les maisons)
  const FARM = {
    // Grange rouge : grand pignon de face, planches verticales, porte à double battant barrée de blanc, fenil.
    barn(k, W, bot) {
      const x = 10,
        w = W - 20,
        trimW = ['#ffffff', '#f0ece4', '#d8d0c4'];
      const r = gableHouse(k, {
        x, w, bot, wallH: 36, gableH: 32, depth: 28, roof: RAMP.roofSlate, trim: trimW, gableRamp: RAMP.red,
        wall: (k2, wx, wy, ww, wh) => {
          wallPlanks(k2, wx, wy, ww, wh, ['#e8705a', '#c84838', '#a03428', '#7a2418'], false);
          k2.rect(wx, wy, 2, wh, trimW[0]);
          k2.rect(wx + ww - 2, wy, 2, wh, trimW[2]);
        },
        gable: (k2, gx, gy, gw, cx, apex) => {
          for (let yy = gy - 1; yy > apex + 2; yy -= 1) {
            const hw = Math.round(((yy - apex) / (gy - apex)) * (gw / 2)) - 1;
            for (let xx = cx - hw; xx < cx + hw; xx += 5) k2.px(xx, yy, '#a03428');
          }
          // Porte du fenil et foin.
          k2.rect(cx - 7, gy - 18, 14, 14, trimW[0]);
          k2.rect(cx - 6, gy - 17, 12, 12, '#4a2418');
          k2.rect(cx - 6, gy - 9, 12, 4, '#e8c860');
          k2.rect(cx - 6, gy - 10, 12, 1, '#f6e08a');
          k2.rect(cx - 1, gy - 26, 2, 8, RAMP.darkwood[1]);
          k2.rect(cx - 4, gy - 21, 8, 2, RAMP.darkwood[1]);
        }
      });
      // Grande porte à double battant, croix blanches.
      const dw = 30,
        dx = W / 2 - dw / 2,
        dh = 26;
      k.rect(dx - 2, bot - dh - 2, dw + 4, dh + 2, trimW[0]);
      k.rect(dx, bot - dh, dw, dh, '#a03428');
      for (const hx of [dx, dx + dw / 2]) {
        k.rect(hx, bot - dh, dw / 2, 1, trimW[0]);
        k.rect(hx, bot - 1, dw / 2, 1, trimW[0]);
        k.line(hx, bot - dh, hx + dw / 2 - 1, bot - 1, trimW[1], 1);
        k.line(hx + dw / 2 - 1, bot - dh, hx, bot - 1, trimW[1], 1);
        k.rect(hx, bot - dh, 1, dh, trimW[0]);
      }
      k.rect(dx + dw - 1, bot - dh, 1, dh, trimW[0]);
      for (const wx of [x + 6, x + w - 16]) windowRect(k, wx, bot - 28, 10, 9, trimW);
      return r.roofTop;
    },
    // Poulailler : petite maison de planches sur pieds, toit de tuiles, rampe à barreaux, trou rond.
    coop(k, W, bot) {
      const x = 6,
        w = W - 12;
      for (const px of [x + 2, x + w - 5]) k.rect(px, bot - 6, 3, 6, RAMP.darkwood[1]);
      const r = gableHouse(k, {
        x, w, bot: bot - 6, wallH: 18, gableH: 14, depth: 14, roof: RAMP.roofRed, trim: RAMP.darkwood, gableRamp: RAMP.wood, tileW: 5, rowH: 3,
        wall: (k2, wx, wy, ww, wh) => wallPlanks(k2, wx, wy, ww, wh, RAMP.wood, false),
        gable: (k2, gx, gy, gw, cx) => k2.disc(cx, gy - 5, 2, RAMP.darkwood[3])
      });
      k.disc(W / 2, bot - 14, 4, '#3a2418');
      k.rect(W / 2 - 4, bot - 13, 8, 7, '#3a2418');
      // Rampe.
      k.line(W / 2 - 4, bot - 6, W / 2 - 14, bot, RAMP.wood[1], 3);
      for (let i = 1; i < 5; i++) k.rect(W / 2 - 4 - i * 2.5, bot - 6 + i * 1.5, 3, 1, RAMP.wood[3]);
      // Paille et nichoir.
      k.rect(x + w - 2, bot - 16, 8, 8, RAMP.wood[2]);
      k.rect(x + w - 1, bot - 12, 6, 3, '#e8c860');
      return r.roofTop;
    },
    // Silo : tour de tôle cerclée, dôme de métal, échelle.
    silo(k, W, bot) {
      const cx = W / 2,
        tw = 30,
        x = cx - tw / 2,
        top = bot - 56;
      for (let xx = 0; xx < tw; xx++) {
        const t = xx / tw,
          col = t < 0.15 ? '#f0ece4' : t < 0.45 ? '#d8d4ca' : t < 0.8 ? '#b4b0a8' : '#8e8a82';
        k.rect(x + xx, top, 1, bot - top, col);
      }
      for (let yy = top + 6; yy < bot; yy += 9) k.rect(x, yy, tw, 2, '#7a7670');
      for (let y = -12; y <= 0; y++) {
        const hw = Math.round(Math.sqrt(1 - (y / 12) ** 2) * (tw / 2 + 1));
        k.rect(cx - hw, top + y, hw * 2, 1, RAMP.red[1]);
        k.rect(cx - hw, top + y, Math.round(hw * 0.6), 1, RAMP.red[0]);
        k.rect(cx + hw - Math.round(hw * 0.35), top + y, Math.round(hw * 0.35), 1, RAMP.red[2]);
      }
      k.rect(cx - 1, top - 16, 2, 4, '#7a7670');
      for (let yy = top + 4; yy < bot - 2; yy += 4) k.rect(x + tw - 7, yy, 5, 1, '#5a5650');
      k.rect(x + tw - 7, top + 4, 1, bot - top - 6, '#5a5650');
      k.rect(x + tw - 3, top + 4, 1, bot - top - 6, '#5a5650');
      return top - 16;
    }
  };
  const FARM_CACHE = {};
  // Image d'un bâtiment de la ferme (à la taille des pixels d'art), pour une emprise de wd pixels de large.
  function farm(kind, wd) {
    const keyF = kind + ':' + wd;
    if (FARM_CACHE[keyF] !== undefined) return FARM_CACHE[keyF];
    FARM_CACHE[keyF] = null;
    if (!FARM[kind] || typeof document === 'undefined') return null;
    const W = Math.round(wd / U),
      PADX = 14,
      H = 130,
      k = brush(W + PADX * 2, H);
    if (!k.g?.getImageData) return null;
    k.g.translate(PADX, 0);
    FARM[kind](k, W, H - 3);
    k.g.setTransform(1, 0, 0, 1, 0, 0);
    outline(k);
    FARM_CACHE[keyF] = { canvas: k.cv, scale: U };
    return FARM_CACHE[keyF];
  }
  // Peint le modèle d'un bâtiment. Renvoie l'image à la taille des pixels d'art, sa position (monde), les effets
  // animés et le haut du toit (monde) ; null s'il n'a pas de modèle.
  function paint(b, X, base, Wd) {
    const model = MODELS[b.room?.id];
    if (!model || typeof document === 'undefined') return null;
    const W = Math.round(Wd / U),
      PADX = 36,
      PADT = 140,
      PADB = 14,
      k = brush(W + PADX * 2, PADT + PADB);
    if (!k.g?.getImageData) return null;
    k.g.translate(PADX, 0);
    const bot = PADT - 3,
      x0 = X - PADX * U,
      y0 = base - PADT * U,
      toWorld = (ax, ay) => [x0 + (ax + PADX) * U, y0 + ay * U],
      fx = [];
    const e = {
      fx,
      toWorld,
      smoke: (ax, ay) => fx.push([1, ...toWorld(ax, ay)]),
      window: (ax, ay, aw, ah) => {
        const [wx, wy] = toWorld(ax, ay);
        fx.push([4, wx, wy, aw * U, ah * U, wx + wy]);
        fx.push([0, wx + (aw * U) / 2, wy + (ah * U) / 2, 60, '#ffd890']);
      },
      sign: (ax, ay, kind) => fx.push([5, ...toWorld(ax, ay), kind]),
      leaves: (ax, ay, aw, ah, cols) => fx.push([7, ...toWorld(ax, ay), aw * U, ah * U, cols, ax]),
      pulse: (ax, ay, r, col) => fx.push([8, ...toWorld(ax, ay), r, col, ax]),
      flag: (ax, ay, col, len) => fx.push([9, ...toWorld(ax, ay), col, len * U]),
      campfire: (ax, ay) => fx.push([10, ...toWorld(ax, ay)]),
      ripple: (ax, ay, aw) => fx.push([2, ...toWorld(ax, ay), aw * U])
    };
    const top = model(k, W, bot, e);
    k.g.setTransform(1, 0, 0, 1, 0, 0);
    outline(k);
    return { canvas: k.cv, x0, y0, scale: U, fx, roofTop: y0 + top * U };
  }
  window.CANAAN_BUILDING_ART = Object.freeze({ paint, farm, has: id => Object.hasOwn(MODELS, id), kit: Object.freeze({ brush, outline, roofPlane, RAMP, hash, shingles, branch, bez, spans, ELF }) });
})();
