// Outils communs de l'art des créatures (client/art/creature-art.js) : couleurs, formes (ellipses, tubes, membres,
// yeux, couronnes, cicatrices…) et inscription des espèces : chaque famille tient son registre (registry).
// Module ES (src/canaan/client/).
import { noise } from '../pixel-kit.js';

export const INK = '#1a1418',
  WHITE = '#ffffff',
  BONE = '#efe6cc',
  PINK = '#e2a0a0',
  CLAW = '#ece0c4',
  BLOOD = '#b02a2a',
  IRON = ['#c8ccd4', '#8a909c', '#5a606c', '#363a44'],
  GOLD = ['#fff2a8', '#ffd36d', '#c8962e', '#7a5418'],
  WOOD = ['#a8784a', '#7a5432', '#4e3420'],
  SKIN = '#e8c0a0';

// ---------------------------------------------------------------- Outils de forme
// Liste de points écrite d'un trait : pts('7 19, 3 22, 0 28') donne xy(7, 19, 3, 22, 0, 28).
export const pts = text => text.split(',').map(p => p.trim().split(/\s+/).map(Number));
// Liste de points calculés : xy(x0, y0, x1, y1, …) donne [[x0, y0], [x1, y1], …].
export const xy = (...v) => v.flatMap((n, i) => (i % 2 ? [] : [[n, v[i + 1]]]));
// Ellipse pleine (rayons rx, ry) sans anticrénelage.
export function ell(k, cx, cy, rx, ry, col) {
  k.g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))));
    k.g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
  }
}
// Trait épais le long d'une suite de points (disques de rayon décroissant de r0 à r1) : cous, queues, tentacules.
export function tube(k, pts, r0, r1, col) {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i],
      [x1, y1] = pts[i + 1],
      steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s++) {
      const t = (i + s / steps) / n;
      k.disc(
        x0 + ((x1 - x0) * s) / steps,
        y0 + ((y1 - y0) * s) / steps,
        Math.max(0, Math.round(r0 + (r1 - r0) * t)),
        col
      );
    }
  }
}
// Transparence le temps d'un dessin (ailes membraneuses, spectres, flammes).
export function ghost(k, a, fn) {
  const before = k.g.globalAlpha;
  k.g.globalAlpha = a;
  fn();
  k.g.globalAlpha = before;
}
// Patte articulée : hanche, genou, pied.
export function limb(k, pts, t, col) {
  for (let i = 0; i < pts.length - 1; i++) k.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, t);
}
// Œil : pupille sombre et point de lumière, ou simple lueur pour les yeux luisants.
export function eye(k, x, y, col, glow) {
  if (glow) {
    k.rect(x, y, 2, 2, col);
    ghost(k, 0.35, () => k.rect(x - 1, y - 1, 4, 4, col));
    k.rect(x, y, 2, 2, col);
  } else {
    k.rect(x, y, 2, 2, col);
    k.px(x + 1, y, WHITE);
  }
}
// Couronne posée sur une tête (x, y : coin haut gauche, largeur w).
export function crown(k, x, y, w = 8) {
  k.rect(x, y + 2, w, 2, GOLD[1]);
  for (let i = 0; i < w; i += 3) k.rect(x + i, y, 2, 2, GOLD[1]);
  k.rect(x, y + 2, w, 1, GOLD[0]);
  k.px(x + Math.floor(w / 2), y + 3, '#d0304a');
}
// Balafre d'élite sur l'œil.
export function scar(k, x, y) {
  k.line(x, y, x + 3, y + 4, '#f0d8c8');
}
// Collier à pointes d'élite.
export function collar(k, x, y, w) {
  k.rect(x, y, w, 2, IRON[3]);
  for (let i = 1; i < w; i += 3) k.px(x + i, y - 1, IRON[0]);
}
// Petites taches de pelage ou d'écailles, stables d'un dessin à l'autre.
export function speckle(k, x, y, w, h, col, n, seed = 1) {
  for (let i = 0; i < n; i++) {
    const a = noise(i, seed, 1),
      b = noise(i, seed, 2);
    k.px(x + Math.floor(a * w), y + Math.floor(b * h), col);
  }
}

// Registre d'une famille d'espèces, et sa fonction d'inscription species(nom, dessin, réglages) : dessin, et
// réglages d'animation (legs : pas alternés ; float : flotte et ondule).
export function registry() {
  const list = {};
  const species = (name, draw, meta = {}) => {
    list[name] = { draw, legs: meta.legs !== false, float: !!meta.float };
  };
  return { list, species };
}
