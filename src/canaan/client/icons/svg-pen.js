// @ts-check
// Plume SVG commune aux icônes (objets, émojis, compétences) : formes cernées d'encre sombre (contour), aplats sans
// contour (ombres), traits clairs semi-transparents (reflets), groupes et étoiles. Une même facture pour toutes les
// icônes ; seules l'épaisseur du contour et la taille de la grille changent d'un jeu d'icônes à l'autre.
// Module ES (src/canaan/client/), importé par les modules d'icônes.

/**
 * Plume réglée pour un jeu d'icônes.
 * @param {object} [o]
 * @param {string} [o.ink] encre du contour
 * @param {number} [o.width] épaisseur du contour des formes
 * @param {number} [o.radius] arrondi des rectangles
 * @param {number} [o.line] épaisseur des traits
 * @param {number} [o.ring] épaisseur des traits cernés (L)
 * @param {number} [o.light] épaisseur des reflets
 * @param {string} [o.lightOpacity] opacité des reflets
 * @param {number} [o.center] centre de la grille (étoiles)
 */
export function svgPen({
  ink = '#1a1220',
  width = 1.4,
  radius = 1,
  line = 1.4,
  ring = 2.4,
  light = 1,
  lightOpacity = '.75',
  center = 12
} = {}) {
  // Contour : attribut à ajouter à une forme pleine.
  const O =
    'stroke="' + ink + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"';
  const p = (d, f) => '<path d="' + d + '" fill="' + f + '" ' + O + '/>';
  // Aplat sans contour (ombres, reflets).
  const s = (d, f) => '<path d="' + d + '" fill="' + f + '"/>';
  const c = (x, y, r, f) =>
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" ' + O + '/>';
  const e = (x, y, rx, ry, f) =>
    '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '" ' + O + '/>';
  const r = (x, y, w, h, f, rx = radius) =>
    '<rect x="' +
    x +
    '" y="' +
    y +
    '" width="' +
    w +
    '" height="' +
    h +
    '" rx="' +
    rx +
    '" fill="' +
    f +
    '" ' +
    O +
    '/>';
  // Trait sans contour (détails).
  const l = (d, col, w = line) =>
    '<path d="' +
    d +
    '" fill="none" stroke="' +
    col +
    '" stroke-width="' +
    w +
    '" stroke-linecap="round" stroke-linejoin="round"/>';
  // Trait cerné d'encre.
  const L = (d, col, w = ring) => l(d, ink, w + 2) + l(d, col, w);
  // Reflet : trait blanc semi-transparent.
  const hi = (d, w = light) => l(d, '#ffffff', w).replace('/>', ' opacity="' + lightOpacity + '"/>');
  const g = (t, inner) => '<g transform="' + t + '">' + inner + '</g>';
  // Tracé d'une étoile à n branches (rayons R et ri).
  const star = (n, R, ri, cx = center, cy = center, rot = -90) =>
    'M' +
    Array.from({ length: n * 2 }, (_, k) => {
      const a = ((rot + (k * 180) / n) * Math.PI) / 180,
        d = k % 2 ? ri : R;
      return (cx + Math.cos(a) * d).toFixed(1) + ' ' + (cy + Math.sin(a) * d).toFixed(1);
    }).join(' L') +
    ' Z';
  return Object.freeze({ ink, O, p, s, c, e, r, l, L, hi, g, star });
}
