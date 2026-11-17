// Art de la Forteresse naine de Durgrim (Tréfonds), dans la facture des bâtiments de l'île (building-art.js) : gros
// pixels (1 pixel d'art = 2 pixels d'écran), volumes éclairés de la gauche, contour sombre. Pierre taillée en blocs
// modelés, toits d'ardoise en écailles, frises de runes dorées, portes ferrées, bannières rouge et or. Le grand hall
// du roi, la forge, la taverne de Dorn, la chambre forte de Gimra, l'étal de Borin, les maisons naines et la statue du
// premier roi. Les feux, fumées et lueurs restent animés à part (underground.js).
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).
import { CANAAN_BUILDING_ART } from './building-art.js';

const kit = () => CANAAN_BUILDING_ART && CANAAN_BUILDING_ART.kit;
const cache = new Map();
const STONE = ['#c4b8a6', '#a2968a', '#82766a', '#625850', '#433b34'];
const GRANITE = ['#a8a4a8', '#86828a', '#66626c', '#4a4650', '#302e36'];
const SLATE = ['#9aa4b8', '#76809a', '#58627c', '#3e465e', '#282e42'];
const WOOD = ['#b8844e', '#94643a', '#704a2a', '#4e321c', '#2e1e10'];
const GOLD = ['#fff0a8', '#f0c858', '#c8962e', '#8a6418'];
const RED = ['#c8384a', '#a8242e', '#7a1a20', '#4a0e14'];
const IRON = ['#9aa0aa', '#6a707a', '#464a54', '#2a2c34'];
const hsh = (a, b, s = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7 + s * 71.3) * 43758.5453;
  return n - Math.floor(n);
};
function paint(key, w, h, fn) {
  if (cache.has(key)) return cache.get(key);
  const K = kit();
  let out = null;
  if (K && typeof document !== 'undefined') {
    const k = K.brush(w, h);
    if (k.g && k.g.getImageData) {
      fn(k, K);
      K.outline(k);
      out = k.cv;
    }
  }
  cache.set(key, out);
  return out;
}
// Mur de blocs taillés : rangées décalées, chaque bloc modelé (arête claire en haut à gauche, ombre en bas à droite),
// joints sombres, plus sombre vers la droite du mur.
function blocks(k, x, y, w, h, ramp = STONE, seed = 0, bh = 6) {
  k.rect(x, y, w, h, ramp[4]);
  for (let row = 0; row * bh < h; row++) {
    const yy = y + row * bh,
      rh = Math.min(bh, y + h - yy);
    let xx = x - (row % 2 ? 5 : 0);
    while (xx < x + w) {
      const bw = 9 + Math.floor(hsh(xx, row, seed) * 6),
        x0 = Math.max(x, xx),
        x1 = Math.min(x + w, xx + bw) - 1;
      if (x1 > x0) {
        const side = (x0 - x) / Math.max(1, w),
          t = side < 0.25 ? 1 : side < 0.75 ? 2 : 3,
          base = ramp[Math.min(3, t + (hsh(xx, row, seed + 1) > 0.8 ? 1 : 0))];
        k.rect(x0, yy, x1 - x0, rh - 1, base);
        k.rect(x0, yy, x1 - x0, 1, ramp[t - 1]);
        k.rect(x0, yy, 1, rh - 1, ramp[t - 1]);
        if (hsh(xx, row, seed + 2) > 0.85) k.px(x0 + 3, yy + 2, ramp[4]);
      }
      xx += bw;
    }
  }
}
// Frise de runes dorées sur un bandeau sombre.
function runes(k, x, y, w, ramp = GOLD) {
  k.rect(x, y, w, 5, STONE[4]);
  k.rect(x, y, w, 1, ramp[2]);
  k.rect(x, y + 4, w, 1, ramp[2]);
  for (let xx = x + 2; xx < x + w - 3; xx += 6) {
    const r = Math.floor(hsh(xx, y) * 4);
    k.px(xx, y + 2, ramp[0]);
    if (r === 0) k.rect(xx + 1, y + 1, 1, 3, ramp[1]);
    if (r === 1) k.rect(xx, y + 1, 3, 1, ramp[1]);
    if (r === 2) k.rect(xx + 2, y + 2, 1, 2, ramp[1]);
    if (r === 3) k.rect(xx + 1, y + 3, 2, 1, ramp[1]);
  }
}
// Toit d'ardoise en écailles entre deux versants (polygone), faîtage doré.
function slateRoof(k, K, pts, ridge) {
  K.shingles(k, pts, SLATE, { w: 6, h: 5 });
  if (ridge) k.rect(ridge[0], ridge[1], ridge[2], 2, GOLD[2]);
}
// Porte ferrée en arc : planches, pentures, clous dorés, linteau de pierre.
function door(k, cx, bot, w, h, round = false) {
  const x = Math.round(cx - w / 2),
    top = bot - h;
  k.rect(x - 3, top + (round ? w / 2 : 0), w + 6, h - (round ? w / 2 : 0) + 1, STONE[3]);
  k.disc(cx - 0.5, top + w / 2, w / 2 + 3, STONE[3]);
  k.rect(x, top + w / 2, w, h - w / 2, WOOD[2]);
  k.disc(cx - 0.5, top + w / 2, w / 2, WOOD[2]);
  for (let xx = x + 3; xx < x + w; xx += 4) k.rect(xx, top + 2, 1, h - 2, WOOD[3]);
  k.rect(x, top + w / 2, 1, h - w / 2, WOOD[1]);
  for (const yy of [top + Math.round(h * 0.35), bot - 6]) {
    k.rect(x, yy, w, 2, IRON[2]);
    for (let xx = x + 2; xx < x + w - 1; xx += 4) k.px(xx, yy, GOLD[1]);
  }
  k.disc(cx + w / 4, bot - h / 2.2, 1.5, GOLD[1]);
}
// Fenêtre profonde à barreaux, lueur chaude (la lueur animée est ajoutée au dessin).
function windowAt(k, x, y, w, h) {
  k.rect(x - 2, y - 2, w + 4, h + 4, STONE[3]);
  k.rect(x - 2, y - 2, w + 4, 1, STONE[1]);
  k.rect(x, y, w, h, '#ffb84a');
  k.rect(x, y, w, Math.ceil(h / 3), '#ffd88a');
  k.rect(x + Math.floor(w / 2), y, 1, h, IRON[3]);
  k.rect(x, y + Math.floor(h / 2), w, 1, IRON[3]);
  k.rect(x - 3, y + h + 2, w + 6, 2, STONE[1]);
}
function banner(k, x, y, h) {
  k.rect(x - 1, y - 2, 12, 2, GOLD[2]);
  k.rect(x, y, 10, h, RED[2]);
  k.rect(x, y, 3, h, RED[1]);
  k.poly(
    [
      [x, y + h],
      [x + 5, y + h + 5],
      [x + 10, y + h],
      [x + 10, y + h + 1],
      [x, y + h + 1]
    ],
    RED[2]
  );
  k.rect(x, y + h - 3, 10, 2, GOLD[1]);
  // Marteau d'or brodé.
  k.rect(x + 4, y + 5, 2, 10, GOLD[1]);
  k.rect(x + 2, y + 4, 6, 3, GOLD[1]);
  k.px(x + 2, y + 4, GOLD[0]);
}
function column(k, x, top, bot, w = 10) {
  k.rect(x - 2, top, w + 4, 4, STONE[1]);
  k.rect(x - 2, top, w + 4, 1, STONE[0]);
  k.rect(x, top + 4, w, bot - top - 8, STONE[2]);
  k.rect(x, top + 4, 3, bot - top - 8, STONE[0]);
  k.rect(x + w - 3, top + 4, 3, bot - top - 8, STONE[3]);
  for (let xx = x + 4; xx < x + w - 3; xx += 2) k.rect(xx, top + 6, 1, bot - top - 12, STONE[1]);
  k.rect(x - 2, bot - 4, w + 4, 4, STONE[1]);
  k.rect(x - 1, top + 8, w + 2, 2, GOLD[2]);
}
// ---------------------------------------------------------------- Bâtiments (largeur en cases × 24 + 16)
const MODELS = {
  // Grand hall du roi : marches, quatre colonnes cannelées, fronton d'ardoise, tympan au marteau et à l'enclume d'or,
  // grande porte en arc, bannières, frise de runes.
  dwarfhall: [
    184,
    136,
    (k, K) => {
      const W = 184,
        B = 134,
        cx = W / 2;
      for (let s = 0; s < 3; s++) k.rect(4 + s * 4, B - 4 - s * 4, W - 8 - s * 8, 4, STONE[s + 1]);
      blocks(k, 14, 44, W - 28, B - 56, STONE, 1, 7);
      runes(k, 12, 44, W - 24);
      slateRoof(
        k,
        K,
        [
          [2, 46],
          [cx, 4],
          [W - 2, 46]
        ],
        [cx - 10, 4, 20]
      );
      k.poly(
        [
          [24, 44],
          [cx, 16],
          [W - 24, 44]
        ],
        STONE[2]
      );
      k.poly(
        [
          [30, 42],
          [cx, 20],
          [W - 30, 42]
        ],
        STONE[3]
      );
      // Marteau et enclume d'or.
      k.rect(cx - 9, 34, 18, 4, GOLD[1]);
      k.rect(cx - 5, 30, 10, 4, GOLD[2]);
      k.rect(cx - 1, 22, 3, 9, GOLD[0]);
      k.rect(cx - 5, 21, 11, 3, GOLD[1]);
      for (const x of [22, 50, W - 60, W - 32]) column(k, x, 50, B - 10);
      door(k, cx, B - 12, 30, 52);
      runes(k, cx - 20, B - 70, 40);
      for (const x of [36, W - 46]) banner(k, x, 58, 34);
      for (const x of [18, W - 26]) {
        k.rect(x, 74, 8, 3, IRON[1]);
        k.rect(x + 3, 66, 2, 8, IRON[2]);
      }
    }
  ],
  // Forge : bâtiment bas, toit d'ardoise, grande cheminée cerclée d'or, foyer ouvert (lueur animée), enclume,
  // soufflet de cuir, râtelier d'outils.
  forge: [
    112,
    110,
    (k, K) => {
      const W = 112,
        B = 108;
      blocks(k, 6, 52, W - 30, B - 52, STONE, 2);
      slateRoof(
        k,
        K,
        [
          [0, 56],
          [16, 30],
          [W - 40, 30],
          [W - 22, 56]
        ],
        null
      );
      // Cheminée.
      blocks(k, W - 30, 6, 20, B - 6, GRANITE, 3, 5);
      for (const y of [14, 40]) k.rect(W - 32, y, 24, 3, GOLD[2]);
      k.rect(W - 33, 4, 26, 4, GRANITE[1]);
      // Foyer ouvert en arc.
      k.rect(14, 70, 44, 38, STONE[4]);
      k.disc(36, 72, 22, STONE[4]);
      k.rect(18, 76, 36, 32, '#2a1206');
      k.disc(36, 76, 18, '#2a1206');
      runes(k, 10, 52, 54);
      // Enclume, soufflet, outils.
      k.rect(66, 96, 18, 5, IRON[2]);
      k.rect(70, 101, 10, 7, IRON[3]);
      k.rect(64, 94, 22, 3, IRON[1]);
      k.poly(
        [
          [4, 100],
          [12, 92],
          [14, 106],
          [4, 106]
        ],
        WOOD[3]
      );
      k.rect(5, 98, 8, 2, WOOD[1]);
      for (let i = 0; i < 3; i++) {
        k.rect(68 + i * 6, 62, 1, 20, WOOD[2]);
        k.rect(66 + i * 6, 60, 5, 3, IRON[1]);
      }
    }
  ],
  // Taverne de Dorn : rez-de-chaussée en pierre, étage à colombages de bois sombre, toit d'ardoise raide, deux
  // fenêtres chaudes, porte, enseigne à la chope, tonneaux.
  tavern: [
    136,
    112,
    (k, K) => {
      const W = 136,
        B = 110,
        cx = W / 2;
      blocks(k, 8, 72, W - 16, B - 72, STONE, 4);
      k.rect(6, 40, W - 12, 34, WOOD[1]);
      for (let x = 6; x < W - 6; x += 16) {
        k.rect(x, 40, 3, 34, WOOD[3]);
        k.line(x + 3, 42, x + 15, 72, WOOD[3]);
      }
      k.rect(6, 40, W - 12, 3, WOOD[3]);
      k.rect(4, 70, W - 8, 4, WOOD[3]);
      slateRoof(
        k,
        K,
        [
          [0, 44],
          [cx, 2],
          [W, 44]
        ],
        [cx - 8, 2, 16]
      );
      windowAt(k, 22, 50, 14, 12);
      windowAt(k, W - 36, 50, 14, 12);
      windowAt(k, 20, 82, 14, 12);
      windowAt(k, W - 34, 82, 14, 12);
      door(k, cx, B - 2, 18, 32);
      // Enseigne à la chope.
      k.rect(cx + 14, 74, 16, 2, IRON[2]);
      k.rect(cx + 18, 76, 12, 12, WOOD[2]);
      k.rect(cx + 21, 78, 6, 8, GOLD[1]);
      k.rect(cx + 21, 78, 6, 2, '#fff6d8');
      k.rect(cx + 27, 80, 2, 4, GOLD[2]);
      for (const x of [4, W - 16]) {
        k.rect(x, B - 12, 12, 12, WOOD[2]);
        k.rect(x, B - 9, 12, 2, IRON[2]);
        k.rect(x, B - 4, 12, 2, IRON[2]);
        k.rect(x + 2, B - 12, 3, 12, WOOD[1]);
      }
    }
  ],
  // Chambre forte : granit massif, créneaux, piliers dorés, porte ronde de fer à rivets et cadran.
  vault: [
    112,
    92,
    (k, K) => {
      const W = 112,
        B = 90,
        cx = W / 2;
      blocks(k, 6, 20, W - 12, B - 20, GRANITE, 5, 8);
      for (let x = 4; x < W - 4; x += 12) {
        k.rect(x, 10, 8, 12, GRANITE[2]);
        k.rect(x, 10, 8, 2, GRANITE[0]);
      }
      k.rect(4, 20, W - 8, 4, GRANITE[1]);
      runes(k, 8, 26, W - 16);
      for (const x of [14, W - 24]) {
        k.rect(x, 34, 10, B - 36, GOLD[2]);
        k.rect(x, 34, 3, B - 36, GOLD[1]);
        k.rect(x + 7, 34, 3, B - 36, GOLD[3]);
      }
      k.disc(cx, B - 28, 24, IRON[3]);
      k.disc(cx, B - 28, 21, IRON[2]);
      k.disc(cx - 2, B - 30, 17, IRON[1]);
      for (let i = 0; i < 12; i++)
        k.rect(cx + Math.cos(i * 0.52) * 19 - 1, B - 28 + Math.sin(i * 0.52) * 19 - 1, 2, 2, GOLD[1]);
      k.disc(cx, B - 28, 6, GOLD[2]);
      for (let i = 0; i < 4; i++)
        k.line(cx, B - 28, cx + Math.cos(i * 1.57) * 11, B - 28 + Math.sin(i * 1.57) * 11, IRON[3], 2);
      k.px(cx - 1, B - 30, GOLD[0]);
    }
  ],
  // Étal de Borin : comptoir de bois, auvent rayé bleu et or festonné, lingots, gemmes, balance.
  stall: [
    88,
    72,
    (k, K) => {
      const W = 88,
        B = 70;
      for (const x of [6, W - 10]) k.rect(x, 10, 4, B - 10, WOOD[2]);
      k.rect(4, B - 26, W - 8, 24, WOOD[2]);
      k.rect(4, B - 26, W - 8, 3, WOOD[0]);
      for (let x = 8; x < W - 8; x += 10) k.rect(x, B - 22, 1, 20, WOOD[3]);
      for (let i = 0; i < 8; i++) {
        const x = 2 + i * 10.5;
        k.rect(x, 6, 11, 14, i % 2 ? GOLD[1] : '#2a4a7a');
        k.disc(x + 5, 20, 5, i % 2 ? GOLD[1] : '#2a4a7a');
      }
      k.rect(0, 4, W, 3, WOOD[3]);
      for (let i = 0; i < 3; i++) {
        k.rect(14 + i * 7, B - 32, 8, 4, GOLD[1]);
        k.rect(14 + i * 7, B - 32, 8, 1, GOLD[0]);
      }
      for (const [x, col] of [
        [44, '#e04040'],
        [50, '#40c0e0'],
        [56, '#60e060']
      ]) {
        k.disc(x, B - 30, 2, col);
        k.px(x - 1, B - 31, '#ffffff');
      }
      k.rect(66, B - 40, 1, 12, IRON[1]);
      k.rect(60, B - 40, 13, 1, IRON[1]);
      k.rect(59, B - 36, 4, 2, GOLD[1]);
      k.rect(70, B - 36, 4, 2, GOLD[1]);
    }
  ],
  // Maison naine : creusée à demi dans la roche, toit rond d'ardoise, porte ronde, fenêtre ronde, cheminée,
  // champignons luisants en pot, lanterne.
  dwarfhouse: [
    88,
    92,
    (k, K) => {
      const W = 88,
        B = 90,
        cx = W / 2;
      blocks(k, 8, 42, W - 16, B - 42, STONE, 6);
      const roof = [];
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI + (i / 24) * Math.PI;
        roof.push([cx + Math.cos(a) * 44, 46 + Math.sin(a) * 30]);
      }
      slateRoof(k, K, roof, null);
      blocks(k, W - 28, 4, 12, 26, GRANITE, 7, 5);
      k.rect(W - 30, 2, 16, 3, GRANITE[1]);
      runes(k, 10, 44, W - 20);
      door(k, cx, B - 2, 22, 26, true);
      k.disc(20, 64, 6, STONE[3]);
      k.disc(20, 64, 4, '#ffb84a');
      k.px(18, 62, '#ffd88a');
      k.rect(19, 60, 1, 8, IRON[3]);
      k.rect(16, 64, 8, 1, IRON[3]);
      for (const x of [W - 18, 10]) {
        k.rect(x, B - 8, 8, 8, '#8a5a34');
        k.disc(x + 4, B - 10, 4, '#7ad8c8');
        k.px(x + 2, B - 12, '#e0fff8');
      }
      k.rect(W - 24, 56, 2, 8, IRON[2]);
      k.rect(W - 26, 64, 6, 7, '#ffd36d');
    }
  ],
  // Statue du premier roi : socle de granit à runes, nain casqué aux cornes, barbe tressée, hache levée, mousse.
  kingstatue: [
    64,
    112,
    (k, K) => {
      const W = 64,
        B = 110,
        cx = W / 2,
        S = GRANITE;
      k.rect(8, B - 22, W - 16, 22, S[2]);
      k.rect(8, B - 22, W - 16, 3, S[0]);
      k.rect(W - 16, B - 19, 8, 19, S[3]);
      runes(k, 10, B - 14, W - 20);
      k.rect(14, B - 30, W - 28, 8, S[1]);
      // Corps trapu, cape.
      k.poly(
        [
          [16, B - 30],
          [W - 16, B - 30],
          [W - 20, B - 66],
          [20, B - 66]
        ],
        S[1]
      );
      k.rect(20, B - 66, 8, 36, S[0]);
      k.rect(W - 24, B - 66, 6, 36, S[3]);
      k.rect(18, B - 48, W - 36, 4, S[3]);
      k.rect(cx - 3, B - 48, 6, 4, GOLD[2]);
      // Barbe tressée.
      k.poly(
        [
          [cx - 10, B - 78],
          [cx + 10, B - 78],
          [cx + 6, B - 50],
          [cx - 6, B - 50]
        ],
        S[0]
      );
      for (let y = B - 74; y < B - 52; y += 4) k.rect(cx - 4, y, 8, 1, S[2]);
      k.rect(cx - 2, B - 52, 4, 3, GOLD[2]);
      // Tête, casque à cornes.
      k.rect(cx - 9, B - 90, 18, 14, S[1]);
      k.rect(cx - 9, B - 90, 5, 14, S[0]);
      k.rect(cx - 5, B - 82, 3, 2, S[4]);
      k.rect(cx + 2, B - 82, 3, 2, S[4]);
      k.rect(cx - 11, B - 96, 22, 8, S[2]);
      k.rect(cx - 11, B - 96, 22, 2, S[0]);
      for (const s of [-1, 1]) {
        k.line(cx + s * 11, B - 92, cx + s * 18, B - 100, '#e8dcc0', 2);
        k.line(cx + s * 18, B - 100, cx + s * 17, B - 106, '#e8dcc0', 2);
      }
      // Hache levée.
      k.rect(W - 18, B - 104, 3, 60, S[3]);
      k.poly(
        [
          [W - 16, B - 104],
          [W - 4, B - 110],
          [W - 4, B - 92],
          [W - 16, B - 96]
        ],
        S[0]
      );
      k.rect(W - 8, B - 106, 2, 12, S[2]);
      // Mousse.
      for (let x = 10; x < W - 10; x += 5) k.rect(x, B - 23 - (x % 3), 3, 2, '#5a8a4a');
    }
  ]
};
// Image d'un bâtiment de la forteresse (pixels d'art ; null sans canevas).
function art(kind) {
  const m = MODELS[kind];
  return m ? paint(kind, m[0], m[1], m[2]) : null;
}
export const CANAAN_DWARF_ART = Object.freeze({ art, has: kind => Object.hasOwn(MODELS, kind), U: 2 });
