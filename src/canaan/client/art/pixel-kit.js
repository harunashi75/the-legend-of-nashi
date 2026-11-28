// @ts-check
// Kit de pixel art commun à tous les arts du jeu (bâtiments, nains, elfes, portails, héros, créatures) : toile et
// pinceau sur la grille de pixels d'art, contour sombre, ombre et reflet (modelé), couleurs (teintes, mélanges,
// transparence) et texture (bruits à graine, tramage). Un seul exemplaire de chaque outil : un même contour, une même
// lumière venue d'en haut à gauche et un même grain partout.
// Module ES (src/canaan/client/) : les autres modules l'importent ; les scripts classiques le lisent par le pont
// (bridge.js), sous le seul nom CANAAN_PIXEL_KIT.

// ---------------------------------------------------------------- Toile
/** Toile vierge de w × h pixels. */
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
/** Rectangle plein aux coordonnées arrondies au pixel. */
export function rect(g, x, y, w, h, col) {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
// Pinceau sur la grille de pixels d'art : rectangles, pixels, polygones, traits et disques sans anticrénelage.
export function brush(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
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
      g.fillStyle = col;
      for (const [y, x0, x1] of spans(pts)) g.fillRect(x0, y, x1 - x0, 1);
    },
    line(x0, y0, x1, y1, col, t = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      g.fillStyle = col;
      for (let i = 0; i <= n; i++)
        g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t);
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
/**
 * Peintre avec cache : paint(clé, w, h, dessin) peint une fois au pinceau, cerne d'un contour et garde la toile ;
 * null sans canevas utilisable (tests sans rendu).
 */
export function painter() {
  const cache = new Map();
  return function paint(key, w, h, fn) {
    if (cache.has(key)) return cache.get(key);
    let out = null;
    if (typeof document !== 'undefined') {
      const k = brush(w, h);
      if (k.g && typeof k.g.getImageData === 'function') {
        fn(k, CANAAN_PIXEL_KIT);
        outline(k);
        out = k.cv;
      }
    }
    cache.set(key, out);
    return out;
  };
}

// ---------------------------------------------------------------- Contour
/** Encre du contour des décors et bâtiments (#2a1810). */
export const PIXEL_INK = '#2a1810';
// Contour sombre d'un pixel autour de toutes les formes du pinceau (pixels transparents qui touchent une forme).
export function outline(k) {
  const img = k.g.getImageData(0, 0, k.w, k.h),
    d = img.data,
    w = k.w,
    h = k.h,
    a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]),
    out = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (a(x, y) < 128 && (a(x - 1, y) > 128 || a(x + 1, y) > 128 || a(x, y - 1) > 128 || a(x, y + 1) > 128))
        out.push(y * w + x);
  for (const i of out) {
    d[i * 4] = 42;
    d[i * 4 + 1] = 24;
    d[i * 4 + 2] = 16;
    d[i * 4 + 3] = 255;
  }
  k.g.putImageData(img, 0, 0);
}
// Contour d'un sprite déjà peint : renvoie une toile agrandie de `pad` pixels de chaque côté (créatures, décors).
export function outlineSprite(src, pad = 1, color = 'rgba(14,10,22,.85)') {
  const w = src.width + pad * 2,
    h = src.height + pad * 2,
    sil = makeCanvas(w, h),
    sg = /** @type {CanvasRenderingContext2D} */ (sil.getContext('2d'));
  for (const [dx, dy] of [
    [0, pad],
    [pad * 2, pad],
    [pad, 0],
    [pad, pad * 2]
  ])
    sg.drawImage(src, dx, dy);
  sg.globalCompositeOperation = 'source-in';
  rect(sg, 0, 0, w, h, color);
  const out = makeCanvas(w, h),
    o = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
  o.drawImage(sil, 0, 0);
  o.drawImage(src, pad, pad);
  return out;
}

// ---------------------------------------------------------------- Ombre et reflet
// Modelé d'un sprite : éclaircit les bords exposés en haut (reflet), assombrit les bas (ombre), lumière venue de la
// gauche, et varie légèrement chaque bloc de `block` pixels (grain).
export function polish(src, block = 2, seed = 0) {
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
      let f = 1 + (noise(Math.floor(x / block), Math.floor(y / block), seed) - 0.5) * 0.16;
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

// ---------------------------------------------------------------- Formes
/** Écorce par défaut des branches : [clair, base, ombre, profond]. */
export const PIXEL_BARK = ['#b08458', '#80583a', '#5a3c24', '#3a2614'];
// Courbe de Bézier quadratique (liste de points).
export function bez(a, c, b, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]
    ]);
  }
  return out;
}
// Lignes d'un polygone : pour chaque rangée, les segments [x0, x1) à remplir.
export function spans(pts) {
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
      if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5))
        xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) rows.push([y, Math.round(xs[i]), Math.round(xs[i + 1])]);
  }
  return rows;
}
// Toit en écailles dans un polygone : bardeaux de bois arrondis (leaf : feuilles pointues à nervure), rangées
// décalées, éclairage de gauche, reflet en haut de chaque écaille, variations par écaille.
export function shingles(k, pts, ramp, o = {}) {
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
        v = hashGrid(col, row + 7);
      const lit = -(x - cx) / half + (v - 0.5) * 0.6 - (ry / 120) * 0.2,
        t = lit > 0.55 ? 0 : lit > -0.1 ? 1 : lit > -0.7 ? 2 : 3,
        dark = n => ramp[Math.min(ramp.length - 1, t + n)],
        mid = (sw - 1) / 2,
        d = Math.abs(lx - mid),
        // Écaille de bois : bas arrondi ; feuille : large en haut, pointue en bas.
        hw = leaf
          ? (mid + 0.6) * Math.sqrt(Math.max(0, 1 - Math.pow(ly / step, 2.4)))
          : ly < step - 3
            ? mid + 0.6
            : (mid + 0.6) * Math.sqrt(Math.max(0, 1 - Math.pow((ly - (step - 4)) / 3.2, 2)));
      let c = ramp[t];
      if (d > hw) c = dark(2);
      else if (d > hw - 1) c = dark(1);
      else if (ly <= 1 && lx <= mid) c = ramp[Math.max(0, t - 1)];
      else if (leaf && Math.round(mid) === lx && ly > 0 && ly < step - 2) c = dark(1);
      else if (!leaf && lx > mid + 1 && ly > 1)
        c = ramp[Math.min(ramp.length - 1, t + (ly > step - 4 ? 1 : 0))];
      k.px(x, y, c);
    }
}
// Branche torsadée le long d'un tracé : épaisseur t, modelé (clair à gauche, sombre à droite), nœuds.
export function branch(k, pts, t, ramp = PIXEL_BARK) {
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
// ---------------------------------------------------------------- Couleurs
/** Composantes [r, g, b] d'une couleur #rrggbb. */
export const rgb = h => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16)
];
/** Couleur #rrggbb de composantes [r, g, b] (bornées, arrondies). */
export const hex = c =>
  '#' +
  c
    .map(v =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('');
/** Mélange de deux couleurs #rrggbb (t = 0 : a ; t = 1 : b). */
export const mix = (a, b, t) => {
  const A = rgb(a),
    B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
};
/** Teinte plus sombre (f < 1, vers le noir) ou plus claire (f > 1, vers le blanc) d'une couleur #rrggbb. */
export function tint(color, f) {
  const n = parseInt(color.slice(1), 16),
    ch = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
}
/** Composantes multipliées par f (assombrit sous 1, sature au-dessus) ; gris moyen pour une couleur illisible. */
export function shade(color, f) {
  const n = parseInt(String(color).slice(1, 7), 16) || 0x888888,
    c = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return (
    '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('')
  );
}
/** Couleur #rrggbb avec transparence : rgba(r,g,b,a). */
export function rgba(color, a) {
  const n = parseInt(String(color).slice(1, 7), 16) || 0;
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

// ---------------------------------------------------------------- Texture
/**
 * Bruit à graine dans [0, 1[ : même valeur pour les mêmes (x, y, s). `k` règle la famille de bruit (deux arts qui
 * emploient des k différents ne tombent pas sur les mêmes motifs).
 */
export const sinNoise =
  k =>
  (x, y, s = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * k) * 43758.5453;
    return n - Math.floor(n);
  };
/** Bruit commun (grain des sprites, pierres, feuillages). */
export const noise = sinNoise(71.3);
/** Hachage entier de deux nombres dans [0, 1[ (tuiles, briques : réparti sans motif visible). */
export const hashGrid = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
/** Seuil de tramage ordonné 4 × 4 dans [0, 1[ : dégradés en pixels francs. */
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export const CANAAN_PIXEL_KIT = Object.freeze({
  makeCanvas,
  rect,
  brush,
  painter,
  PIXEL_INK,
  outline,
  outlineSprite,
  polish,
  PIXEL_BARK,
  bez,
  spans,
  shingles,
  branch,
  rgb,
  hex,
  mix,
  tint,
  shade,
  rgba,
  sinNoise,
  noise,
  hashGrid,
  bayer
});
