// Icônes des compétences en SVG (à la place des émojis) : une par compétence d'arme (10 armes et le Grimoire × 4)
// et par sort de classe (touche F). Dessinées en code, dans un même style : glyphe clair cerné de sombre, accent de couleur
// propre à l'arme, halo doux. CANAAN_SKILL_ICONS.weapon(type, i) et .special(id) renvoient le balisage SVG.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).

import { svgPen } from './svg-pen.js';

// Palette commune.
const K = {
  ink: '#120c16',
  steel: '#dfe8f0',
  steelD: '#7d8b99',
  gold: '#f0c968',
  goldD: '#a2772c',
  wood: '#9a6a3e',
  woodD: '#5e3c22',
  white: '#ffffff'
};
const ACCENT = {
  sword: '#9fdcff',
  dualsword: '#8fc4ff',
  axe: '#ff9a5a',
  mace: '#f0c27a',
  spear: '#7fe6cf',
  dualdagger: '#e38cff',
  bow: '#9be38e',
  shield: '#ffe08a',
  staff: '#b98cff',
  lute: '#ff9ad5',
  grimoire: '#a4e83c'
};
const at = (x, y, rot = 0, s = 1, inner = '') =>
  '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')">' + inner + '</g>';
// Contour d'encre de la plume commune (client/icons/svg-pen.js).
const { O: st } = svgPen({ ink: K.ink, width: 1.6 });
// ---------------------------------------------------------------- Pièces (orientées vers le haut, poignée en bas)
const P = {
  sword: c =>
    '<path d="M0 -13 L2.2 -9 L2.2 5 L-2.2 5 L-2.2 -9 Z" fill="' +
    K.steel +
    '" ' +
    st +
    '/><path d="M0 -12 L0 4" stroke="' +
    K.white +
    '" stroke-width="0.9" opacity=".8"/>' +
    '<rect x="-5.5" y="4.5" width="11" height="2.6" rx="1" fill="' +
    K.gold +
    '" ' +
    st +
    '/><rect x="-1.3" y="7" width="2.6" height="5" fill="' +
    K.woodD +
    '" ' +
    st +
    '/><circle cx="0" cy="13" r="1.8" fill="' +
    (c || K.gold) +
    '" ' +
    st +
    '/>',
  dagger: c =>
    '<path d="M0 -9 L2 -5 L2 3 L-2 3 L-2 -5 Z" fill="' +
    K.steel +
    '" ' +
    st +
    '/><rect x="-4" y="3" width="8" height="2.2" rx="1" fill="' +
    (c || K.gold) +
    '" ' +
    st +
    '/><rect x="-1.2" y="5" width="2.4" height="4.5" fill="' +
    K.woodD +
    '" ' +
    st +
    '/>',
  axe: () =>
    '<rect x="-1.4" y="-10" width="2.8" height="23" rx="1" fill="' +
    K.wood +
    '" ' +
    st +
    '/><path d="M1 -11 C9 -12 12 -5 11 2 C7 -1 4 -1 1 -2 Z" fill="' +
    K.steel +
    '" ' +
    st +
    '/><path d="M3 -9 C8 -9 10 -5 10 -1" fill="none" stroke="' +
    K.white +
    '" stroke-width="0.9" opacity=".8"/><path d="M-1 -9 L-5 -7 L-5 -3 L-1 -4 Z" fill="' +
    K.steelD +
    '" ' +
    st +
    '/>',
  mace: () =>
    '<rect x="-1.3" y="-2" width="2.6" height="15" rx="1" fill="' +
    K.wood +
    '" ' +
    st +
    '/><circle cx="0" cy="-7" r="6" fill="' +
    K.steelD +
    '" ' +
    st +
    '/><circle cx="-2" cy="-9" r="2" fill="' +
    K.steel +
    '"/>' +
    [0, 60, 120, 180, 240, 300]
      .map(a =>
        at(0, -7, a, 1, '<path d="M-1.6 -5.5 L0 -9.5 L1.6 -5.5 Z" fill="' + K.steel + '" ' + st + '/>')
      )
      .join(''),
  spear: c =>
    '<rect x="-1.1" y="-8" width="2.2" height="22" rx="1" fill="' +
    K.wood +
    '" ' +
    st +
    '/><path d="M0 -15 L3.4 -8 L0 -5.5 L-3.4 -8 Z" fill="' +
    K.steel +
    '" ' +
    st +
    '/><rect x="-2.2" y="-6" width="4.4" height="2" fill="' +
    (c || K.gold) +
    '" ' +
    st +
    '/>',
  staff: c =>
    '<rect x="-1.2" y="-6" width="2.4" height="20" rx="1" fill="' +
    K.wood +
    '" ' +
    st +
    '/><path d="M-4 -7 C-4 -12 4 -12 4 -7 L2 -6 L-2 -6 Z" fill="' +
    K.gold +
    '" ' +
    st +
    '/><circle cx="0" cy="-10" r="3.2" fill="' +
    (c || '#b98cff') +
    '" ' +
    st +
    '/><circle cx="-1" cy="-11" r="1" fill="' +
    K.white +
    '"/>',
  // Luth : manche vers le haut, caisse en poire en bas.
  lute: c =>
    '<rect x="-1.1" y="-14" width="2.2" height="11" rx="0.6" fill="' +
    K.woodD +
    '" ' +
    st +
    '/><path d="M0 -4 C4.5 -4 6.5 0 6.5 4 C6.5 8.5 3.5 11 0 11 C-3.5 11 -6.5 8.5 -6.5 4 C-6.5 0 -4.5 -4 0 -4 Z" fill="#c08048" ' +
    st +
    '/><circle cx="0" cy="2.5" r="2" fill="#3a2414"/><path d="M-0.5 -14 L-0.5 8 M0.5 -14 L0.5 8" stroke="#f4ead0" stroke-width="0.4"/><rect x="-2.5" y="7" width="5" height="1.4" rx="0.4" fill="' +
    K.woodD +
    '"/><path d="M-6 8 L-8.5 11 L-6.5 10.6 L-6 12.6 L-4.6 9.4 Z" fill="' +
    (c || '#ff9ad5') +
    '"/>',
  bow: () =>
    '<path d="M-3 -13 C8 -8 8 8 -3 13" fill="none" stroke="' +
    K.ink +
    '" stroke-width="5" stroke-linecap="round"/><path d="M-3 -13 C8 -8 8 8 -3 13" fill="none" stroke="' +
    K.wood +
    '" stroke-width="2.6" stroke-linecap="round"/><path d="M-3 -13 L-3 13" stroke="#f2f0e0" stroke-width="0.9"/>',
  arrow: c =>
    '<path d="M0 -13 L0 10" stroke="' +
    K.ink +
    '" stroke-width="3.4" stroke-linecap="round"/><path d="M0 -12 L0 10" stroke="' +
    K.wood +
    '" stroke-width="1.6"/><path d="M0 -15 L3 -9 L-3 -9 Z" fill="' +
    K.steel +
    '" ' +
    st +
    '/><path d="M0 7 L-3 12 M0 7 L3 12 M0 4 L-3 9 M0 4 L3 9" stroke="' +
    (c || '#e8e0d0') +
    '" stroke-width="1.6"/>',
  shield: c =>
    '<path d="M0 -12 C5 -10 9 -10 10 -9 C10 2 6 9 0 13 C-6 9 -10 2 -10 -9 C-9 -10 -5 -10 0 -12 Z" fill="' +
    (c || '#5a6fb0') +
    '" ' +
    st +
    '/><path d="M0 -8 C3 -7 6 -7 6.5 -6.5 C6.5 1 4 6 0 8.5 C-4 6 -6.5 1 -6.5 -6.5 C-6 -7 -3 -7 0 -8 Z" fill="none" stroke="' +
    K.gold +
    '" stroke-width="1.4"/><path d="M0 -5 L0 5 M-4 -1 L4 -1" stroke="' +
    K.gold +
    '" stroke-width="2"/>'
};
// ---------------------------------------------------------------- Effets
const E = {
  slash: (c, r = 12, a0 = -70, a1 = 50, w = 2.4) => {
    const p = a =>
      [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r].map(v => v.toFixed(1)).join(' ');
    return (
      '<path d="M' +
      p(a0) +
      ' A' +
      r +
      ' ' +
      r +
      ' 0 0 1 ' +
      p(a1) +
      '" fill="none" stroke="' +
      c +
      '" stroke-width="' +
      w +
      '" stroke-linecap="round" opacity=".95"/>'
    );
  },
  swirl: c =>
    [0, 120, 240].map(a => at(0, 0, a, 1, E.slash(c, 11, -40, 60, 2.2))).join('') +
    '<circle r="2.4" fill="' +
    c +
    '"/>',
  burst: (c, r = 8, n = 8) =>
    '<path d="' +
    Array.from({ length: n * 2 }, (_, k) => {
      const a = (k * Math.PI) / n,
        d = k % 2 ? r * 0.42 : r;
      return (k ? 'L' : 'M') + (Math.cos(a) * d).toFixed(1) + ' ' + (Math.sin(a) * d).toFixed(1);
    }).join(' ') +
    ' Z" fill="' +
    c +
    '" ' +
    st +
    '/>',
  speed: (c, n = 3) =>
    Array.from(
      { length: n },
      (_, k) =>
        '<path d="M' +
        -14 +
        ' ' +
        (-6 + k * 6) +
        ' L' +
        (-6 + (k % 2) * 3) +
        ' ' +
        (-6 + k * 6) +
        '" stroke="' +
        c +
        '" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>'
    ).join(''),
  // Note de musique (croche) et double croche.
  note: c =>
    '<path d="M-1 6 L-1 -9 C1 -6 6 -5.5 5 -0.5" fill="none" stroke="' +
    K.ink +
    '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M-1 6 L-1 -9 C1 -6 6 -5.5 5 -0.5" fill="none" stroke="' +
    c +
    '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="-3.4" cy="6" rx="3" ry="2.3" fill="' +
    c +
    '" ' +
    st +
    '/>',
  notes: c =>
    '<path d="M-5 6 L-5 -6 L6 -9 L6 3 M-5 -2 L6 -5" fill="none" stroke="' +
    K.ink +
    '" stroke-width="3" stroke-linejoin="round"/><path d="M-5 6 L-5 -6 L6 -9 L6 3 M-5 -2 L6 -5" fill="none" stroke="' +
    c +
    '" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="-7.2" cy="6" rx="2.8" ry="2.2" fill="' +
    c +
    '" ' +
    st +
    '/><ellipse cx="3.8" cy="3" rx="2.8" ry="2.2" fill="' +
    c +
    '" ' +
    st +
    '/>',
  heart: c =>
    '<path d="M0 5 C-7 0 -7 -6 -3 -6 C-1 -6 0 -4 0 -3 C0 -4 1 -6 3 -6 C7 -6 7 0 0 5 Z" fill="' +
    c +
    '" ' +
    st +
    '/>',
  drop: c =>
    '<path d="M0 -6 C3 -1 4 1 4 2.5 C4 5 2 6.5 0 6.5 C-2 6.5 -4 5 -4 2.5 C-4 1 -3 -1 0 -6 Z" fill="' +
    c +
    '" ' +
    st +
    '/><circle cx="-1.3" cy="2" r="1" fill="#fff" opacity=".7"/>',
  flame: (c, c2 = '#ffe07a') =>
    '<path d="M0 -10 C4 -5 7 -2 6 3 C5 7 2 9 0 9 C-3 9 -6 6 -6 2 C-6 -2 -3 -3 -2 -7 C-1 -4 0 -3 1 -3 C2 -5 1 -8 0 -10 Z" fill="' +
    c +
    '" ' +
    st +
    '/><path d="M0 -2 C2 1 3 3 2 5 C1 7 -1 7 -2 5 C-3 3 -1 1 0 -2 Z" fill="' +
    c2 +
    '"/>',
  skull: () =>
    '<path d="M-6 -1 C-6 -7 6 -7 6 -1 C6 2 4 3 4 4 L4 6 L-4 6 L-4 4 C-4 3 -6 2 -6 -1 Z" fill="#efe8dc" ' +
    st +
    '/><circle cx="-2.3" cy="0" r="1.7" fill="' +
    K.ink +
    '"/><circle cx="2.3" cy="0" r="1.7" fill="' +
    K.ink +
    '"/><path d="M-2 6 L-2 4.5 M0 6 L0 4.5 M2 6 L2 4.5" stroke="' +
    K.ink +
    '" stroke-width="0.9"/>',
  bolt: c => '<path d="M2 -10 L-5 1 L-0.5 1 L-2.5 10 L5 -2 L0.5 -2 Z" fill="' + c + '" ' + st + '/>',
  stars: c =>
    [
      [-6, -3],
      [5, -5],
      [1, 4]
    ]
      .map(([x, y]) => at(x, y, 0, 0.5, E.burst(c, 6, 4)))
      .join(''),
  waves: c =>
    [5, 9, 13]
      .map(
        (r, k) =>
          '<path d="M' +
          -r +
          ' 0 A' +
          r +
          ' ' +
          r * 0.45 +
          ' 0 0 0 ' +
          r +
          ' 0" fill="none" stroke="' +
          c +
          '" stroke-width="' +
          (2.2 - k * 0.4) +
          '" opacity="' +
          (1 - k * 0.22) +
          '"/>'
      )
      .join(''),
  rings: c =>
    [4, 8, 12]
      .map(
        (r, k) =>
          '<circle r="' +
          r +
          '" fill="none" stroke="' +
          c +
          '" stroke-width="' +
          (2.2 - k * 0.5) +
          '" opacity="' +
          (1 - k * 0.25) +
          '"/>'
      )
      .join(''),
  chevrons: (c, up = true) =>
    [0, 6]
      .map(
        d =>
          '<path d="' +
          (up
            ? 'M-6 ' + (4 - d) + ' L0 ' + (-2 - d) + ' L6 ' + (4 - d)
            : 'M' + (4 - d) + ' -6 L' + (-2 - d) + ' 0 L' + (4 - d) + ' 6') +
          '" fill="none" stroke="' +
          c +
          '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
      )
      .join(''),
  target: c =>
    '<circle r="8" fill="none" stroke="' +
    c +
    '" stroke-width="2"/><circle r="4" fill="none" stroke="' +
    c +
    '" stroke-width="2"/><circle r="1.4" fill="' +
    c +
    '"/>',
  web: c =>
    [0, 45, 90, 135]
      .map(a => at(0, 0, a, 1, '<path d="M-9 0 L9 0" stroke="' + c + '" stroke-width="1.1"/>'))
      .join('') +
    [3.5, 7].map(r => '<circle r="' + r + '" fill="none" stroke="' + c + '" stroke-width="1.1"/>').join(''),
  sun: c =>
    '<circle r="4.5" fill="' +
    c +
    '" ' +
    st +
    '/>' +
    Array.from({ length: 8 }, (_, k) =>
      at(
        0,
        0,
        k * 45,
        1,
        '<path d="M0 -6.5 L0 -9.5" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>'
      )
    ).join(''),
  sparkle: c =>
    '<path d="M0 -8 L1.6 -1.6 L8 0 L1.6 1.6 L0 8 L-1.6 1.6 L-8 0 L-1.6 -1.6 Z" fill="' + c + '" ' + st + '/>',
  moon: c =>
    '<path d="M3 -8 C-5 -8 -8 -1 -5 4 C-2 9 6 8 8 3 C3 5 -2 2 -1 -3 C-0.5 -6 1 -7 3 -8 Z" fill="' +
    c +
    '" ' +
    st +
    '/>',
  crack: c =>
    '<path d="M-10 6 L-5 3 L-2 6 L2 1 L6 4 L10 0" fill="none" stroke="' +
    c +
    '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  hand: () =>
    '<path d="M-4 6 L-4 -2 C-4 -3.5 -2 -3.5 -2 -2 L-2 -6 C-2 -7.5 0 -7.5 0 -6 L0 -7 C0 -8.5 2 -8.5 2 -7 L2 -6 C2 -7.5 4 -7.5 4 -6 L4 1 C4 4 3 6 1 6 Z" fill="#f0c7a0" ' +
    st +
    '/>',
  claw: c =>
    [-4, 0, 4]
      .map(
        x =>
          '<path d="M' +
          (x - 3) +
          ' -8 C' +
          (x + 1) +
          ' -3 ' +
          (x + 1) +
          ' 3 ' +
          (x - 2) +
          ' 8" fill="none" stroke="' +
          c +
          '" stroke-width="2.4" stroke-linecap="round"/>'
      )
      .join(''),
  eye: c =>
    '<path d="M-9 0 C-5 -6 5 -6 9 0 C5 6 -5 6 -9 0 Z" fill="#1a1428" ' +
    st +
    '/><circle r="3.4" fill="' +
    c +
    '"/><circle r="1.3" fill="#fff"/>',
  snow: c =>
    [0, 60, 120]
      .map(a =>
        at(
          0,
          0,
          a,
          1,
          '<path d="M0 -7 L0 7 M-2 -5 L0 -3 L2 -5 M-2 5 L0 3 L2 5" stroke="' +
            c +
            '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
        )
      )
      .join('')
};
// Cadre commun : halo de l'accent, puis le dessin, puis un reflet discret.
let serial = 0;
function frame(accent, inner) {
  const id = 'canaanSkillGlow' + ++serial;
  return (
    '<svg class="skill-svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><radialGradient id="' +
    id +
    '" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="' +
    accent +
    '" stop-opacity=".55"/><stop offset="1" stop-color="' +
    accent +
    '" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="url(#' +
    id +
    ')"/>' +
    '<g transform="translate(16 16)">' +
    inner +
    '</g></svg>'
  );
}
// ---------------------------------------------------------------- Les 36 compétences
const ICONS = {
  sword: [
    a => at(1, 1, 45, 1.05, P.sword()) + at(0, 0, 0, 1, E.slash(a, 13, -150, -60, 2.6)),
    a => E.swirl(a) + at(0, 0, 30, 0.8, P.sword()),
    a =>
      at(-3, 0, -20, 0.95, P.sword()) +
      at(5, 3, 0, 0.55, P.shield('#4a6fa8')) +
      E.slash(a, 13, -160, -100, 2.2),
    a => at(-2, 0, 35, 1, P.sword()) + at(7, 7, 0, 0.75, E.heart('#5cf08a')) + E.slash(a, 13, -120, -40, 2.2)
  ],
  dualsword: [
    a => at(0, 1, 35, 0.9, P.sword()) + at(0, 1, -35, 0.9, P.sword()) + at(4, -2, 0, 1, E.speed(a)),
    a => E.swirl(a) + at(0, 0, 45, 0.7, P.sword()) + at(0, 0, -45, 0.7, P.sword()),
    a => at(0, 2, 0, 1, E.flame('#ff8a3d')) + at(0, -6, 0, 0.7, E.chevrons('#ffe07a')),
    a => at(0, 2, 40, 0.85, P.sword()) + at(0, 2, -40, 0.85, P.sword()) + at(0, -8, 0, 0.75, E.burst(a, 7))
  ],
  axe: [
    a => at(2, 2, 25, 1, P.axe()) + at(-2, 10, 0, 0.9, E.crack(a)),
    a => at(-2, 2, 40, 0.95, P.axe()) + E.slash(a, 14, -170, -20, 2.6),
    () => at(0, 3, 0, 1.05, E.flame('#ff4a2a', '#ffb070')) + at(0, -7, 0, 0.6, E.burst('#ffd27a', 7, 6)),
    a => at(-3, 1, 20, 0.95, P.axe()) + at(6, 7, 0, 0.7, E.skull()) + E.slash(a, 13, -140, -80, 2)
  ],
  mace: [
    a => at(2, 1, 30, 1, P.mace()) + at(-6, 7, 0, 0.5, P.shield('#6a6a7a')) + at(-6, 7, 0, 0.8, E.crack(a)),
    a => at(0, -3, 0, 0.85, P.mace()) + at(0, 9, 0, 1, E.waves(a)),
    a => at(-1, 3, 0, 1.05, E.hand()) + at(0, -6, 0, 1, E.stars('#ffe07a')),
    a => at(-2, 2, 35, 1, P.mace()) + at(6, -6, 0, 0.8, E.burst(a, 8))
  ],
  spear: [
    a => at(0, 0, 90, 1.05, P.spear()) + at(-1, -3, 0, 1, E.speed(a, 2)),
    a => at(0, 2, 60, 0.95, P.spear()) + E.slash(a, 13, 180, 360, 2.4),
    a => at(2, 0, 70, 1, P.spear()) + at(0, 4, 0, 1, E.speed(a)),
    a => at(-6, 6, 45, 0.85, P.spear()) + at(6, -6, 0, 0.7, E.target(a))
  ],
  dualdagger: [
    a => at(-3, 0, 30, 1, P.dagger()) + at(3, 0, -30, 1, P.dagger()) + at(7, 8, 0, 0.7, E.drop('#e03a4a')),
    a => E.swirl(a) + at(0, 0, 0, 0.8, P.dagger()),
    a => at(2, 0, 0, 1.05, E.moon(a)) + at(-2, 2, 0, 1, E.speed('#c48cff')),
    a =>
      [-8, -2, 4]
        .map((x, k) =>
          at(
            x,
            0,
            0,
            1,
            '<path d="M-3 -8 L5 7" stroke="' +
              a +
              '" stroke-width="2" stroke-linecap="round" opacity="' +
              (1 - k * 0.15) +
              '"/>'
          )
        )
        .join('') + at(7, 8, 0, 0.6, E.drop('#e03a4a'))
  ],
  bow: [
    () => at(-2, 0, 0, 1, P.bow()) + at(1, 0, 90, 0.95, P.arrow()),
    a =>
      [-7, 0, 7].map((x, k) => at(x, -2 + (k % 2) * 4, 180, 0.6, P.arrow(a))).join('') +
      at(
        0,
        11,
        0,
        0.8,
        '<path d="M-10 0 L10 0" stroke="' + a + '" stroke-width="1.6" stroke-dasharray="2 2"/>'
      ),
    a => at(2, 2, 0, 1, E.web(a)) + at(-1, -1, 45, 0.85, P.arrow()),
    a => at(4, 0, 90, 0.9, P.arrow()) + at(-6, 0, 0, 0.9, E.chevrons(a, false))
  ],
  shield: [
    a => E.swirl(a) + at(0, 0, 0, 0.75, P.shield()),
    () =>
      at(
        0,
        8,
        0,
        1,
        '<ellipse rx="12" ry="4" fill="#ffe08a" opacity=".35" stroke="#ffe08a" stroke-width="1.4"/>'
      ) + at(0, -3, 0, 1, E.sun('#ffd76a')),
    a => at(4, 0, 0, 0.85, P.shield()) + at(-4, 0, 0, 1, E.speed(a)),
    () => at(0, 1, 0, 0.95, P.shield('#3f63a8')) + at(7, -8, 0, 0.6, E.sparkle('#fff4b0'))
  ],
  staff: [
    a =>
      at(-6, 6, 45, 0.8, P.staff(a)) +
      at(
        5,
        -5,
        0,
        1,
        '<circle r="5" fill="' + a + '" ' + st + '/><circle cx="-1.5" cy="-1.5" r="1.6" fill="#fff"/>'
      ) +
      at(-1, 1, 45, 1, '<path d="M-3 0 L-9 0" stroke="' + a + '" stroke-width="2" opacity=".6"/>'),
    a => E.rings(a) + '<circle r="2.6" fill="' + a + '" ' + st + '/>',
    a => at(0, 1, 0, 1, E.eye(a)) + at(8, -8, 0, 0.5, E.sparkle('#fff')),
    a =>
      at(0, 0, 0, 1, E.burst(a, 11, 8)) +
      at(0, 0, 0, 1, '<circle r="3.5" fill="#fff"/>') +
      [-6, 0, 6]
        .map(
          x =>
            '<circle cx="' +
            x +
            '" cy="12" r="1.8" fill="#ffd76a" stroke="' +
            K.ink +
            '" stroke-width="0.8"/>'
        )
        .join('')
  ]
};
// Invocations du Grimoire : corbeau, rat, totem d'os, tête d'abomination (repère centré, tête en haut).
const SUMMON = {
  ground: c =>
    '<ellipse cx="0" cy="10" rx="11" ry="3" fill="' +
    c +
    '" opacity=".45" stroke="' +
    c +
    '" stroke-width="1"/>',
  crow: () =>
    '<path d="M-9 2 C-7 -2 -2 -3 1 -1.5 L5 -5 L9 -4.5 L6 -1.5 C7 3 3 6 -2 6 C-5 6 -8 4.5 -9 2 Z" fill="#2a2432" ' +
    st +
    '/><path d="M-5 0 C-3 -5 1 -6 3 -3.5 L0.5 1 L-1 -0.5 L-2.5 1.5 Z" fill="#4a3e58" ' +
    st +
    '/><path d="M9 -4.5 L11.5 -4 L9 -3.2 Z" fill="#8a8070"/><circle cx="6.3" cy="-3.4" r="0.9" fill="#a4e83c"/>',
  rat: () =>
    '<path d="M-7 3 C-7 -2 1 -3 5 0 L8 1.5 L5 3 C3 5 -5 5.5 -7 3 Z" fill="#6e5c4c" ' +
    st +
    '/><path d="M-7 3 C-10 3 -12 1 -12 -1" fill="none" stroke="#c89a8a" stroke-width="1.2"/>' +
    '<circle cx="4" cy="0.5" r="0.9" fill="#a4e83c"/><circle cx="1.5" cy="-1.8" r="1.4" fill="#c8b0a0" ' +
    st +
    '/>',
  totem: c =>
    '<rect x="-1.4" y="-2" width="2.8" height="14" fill="' +
    K.woodD +
    '" ' +
    st +
    '/>' +
    at(0, -6, 0, 0.8, E.skull()) +
    '<path d="M-6 6 L6 2 M-6 2 L6 6" stroke="#efe8dc" stroke-width="1.8" ' +
    st +
    '/><path d="M0 -14 C2 -12 2.5 -10.5 0 -9.5 C-2.5 -10.5 -2 -12 0 -14 Z" fill="' +
    c +
    '"/>',
  abomination: c =>
    '<path d="M-10 9 C-12 -2 -7 -10 0 -10 C7 -10 12 -2 10 9 Z" fill="#8d9a6a" ' +
    st +
    '/><path d="M-2 -9 L-2 8 M-4.5 -5 L0.5 -5 M-4.5 -1 L0.5 -1 M-4.5 3 L0.5 3" stroke="' +
    K.ink +
    '" stroke-width="1"/><circle cx="4.5" cy="-2" r="2.6" fill="' +
    c +
    '" ' +
    st +
    '/><circle cx="5" cy="-2.4" r="0.9" fill="' +
    K.ink +
    '"/><path d="M1 5 L8 5" stroke="' +
    K.ink +
    '" stroke-width="1.4"/>'
};
ICONS.grimoire = [
  a => SUMMON.ground(a) + at(0, -1, 0, 1.45, E.skull()) + at(-8, 8, 0, 0.35, E.sparkle(a)),
  () =>
    at(-4, -5, 0, 0.85, SUMMON.crow()) + at(5, 1, 0, 0.95, SUMMON.crow()) + at(-4, 7, 0, 0.8, SUMMON.crow()),
  a => SUMMON.ground(a) + SUMMON.totem(a) + at(7, 7, 0, 0.55, SUMMON.rat()),
  a => SUMMON.ground(a) + at(0, 0, 0, 1, SUMMON.abomination(a))
];
// Luth : note qui file, accord qui repousse, chant qui soigne, symphonie en ondes.
ICONS.lute = [
  a =>
    at(-6, 5, -30, 0.75, P.lute(a)) +
    at(5, -4, 15, 1, E.note(a)) +
    at(-1, 1, -35, 1, '<path d="M-3 0 L-10 0" stroke="' + a + '" stroke-width="2" opacity=".6"/>'),
  a => E.rings(a) + at(0, 0, 0, 0.8, P.lute(a)),
  a =>
    at(-5, 2, -20, 0.8, P.lute(a)) +
    at(5, -3, 0, 1, E.heart('#ff7ab8')) +
    at(8, 7, 0, 0.45, E.sparkle('#fff')),
  a => E.waves(a) + at(0, -1, 0, 1, E.notes(a))
];
const SPECIALS = {
  feral: () => frame('#7ee36a', E.claw('#7ee36a')),
  divine: () => frame('#ffd76a', E.sun('#ffd76a') + at(0, 0, 0, 0.5, E.sparkle('#fff'))),
  veil: () => frame('#c48cff', at(0, 0, 0, 1, E.moon('#c48cff')) + at(3, 4, 0, 0.45, E.eye('#e5b0ff'))),
  avatar: () =>
    frame(
      '#ff8a3d',
      at(-5, 3, 0, 0.75, E.flame('#ff8a3d')) +
        at(6, 4, 0, 0.6, E.snow('#8fdcff')) +
        at(1, -6, 0, 0.6, E.bolt('#f4f07a'))
    ),
  // Contagion : trois gouttes de peste autour d'un crâne, dans une onde.
  contagion: () =>
    frame(
      '#a4e83c',
      E.rings('#a4e83c') +
        [0, 120, 240].map(r => at(0, 0, r, 1, at(0, -9, 0, 0.7, E.drop('#a4e83c')))).join('') +
        at(0, 1, 0, 0.9, E.skull())
    ),
  // Hymne de l'Aurore : soleil levant et notes roses dans une onde.
  hymn: () =>
    frame(
      '#ff9ad5',
      E.rings('#ff9ad5') + at(0, 2, 0, 0.6, E.sun('#ffd76a')) + at(0, -1, 0, 0.95, E.notes('#ff9ad5'))
    )
};
const cache = new Map();
function weapon(type, i) {
  const key = type + ':' + i;
  if (!cache.has(key)) {
    const draw = ICONS[type]?.[i];
    cache.set(key, draw ? frame(ACCENT[type], draw(ACCENT[type])) : '');
  }
  return cache.get(key);
}
function special(id) {
  const key = 'special:' + id;
  if (!cache.has(key)) cache.set(key, SPECIALS[id] ? SPECIALS[id]() : '');
  return cache.get(key);
}
export const CANAAN_SKILL_ICONS = Object.freeze({
  weapon,
  special,
  // Contrôle : une icône pour chaque compétence et chaque sort de classe.
  audit: () => ({
    weapons: Object.keys(ICONS).length,
    missing: Object.entries(ICONS).flatMap(([t, list]) => (list.length === 4 ? [] : [t])),
    specials: Object.keys(SPECIALS)
  })
});
