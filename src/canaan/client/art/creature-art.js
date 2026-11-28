// @ts-check
// Art des créatures : une silhouette propre à chaque espèce (loup, sanglier, ours, rat, araignée, troll, spectre,
// tréant…), peinte au pinceau du kit commun sur une grille de 32 × 40 pixels d'art, profil tourné vers la droite,
// pieds au sol à la ligne 36. Les humanoïdes (bandits, chevaliers, prêtres, sorcières…) partagent un corps mais
// chacun porte sa coiffe, son visage, sa tenue et son arme. Chaque espèce sait aussi se peindre en élite (plus
// massive, balafrée, cuirassée ou couronnée selon l'espèce). Le sprite rendu fait 34 × 42 : ombre au sol, contour
// sombre d'un pixel, modelé.
// Palettes : [principale, sombre, claire, accent, yeux]. Les options (`opts`) précisent la variante d'une espèce.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js) sous CANAAN_CREATURE_ART.
import { brush, makeCanvas, polish } from './pixel-kit.js';
import { BEASTS } from './creatures/beasts.js';
import { HUMANOIDS } from './creatures/humanoids.js';
import { OTHERS } from './creatures/others.js';

// Toutes les espèces, famille par famille (ordre de CREATURE_SPECIES).
const SPECIES = { ...BEASTS, ...HUMANOIDS, ...OTHERS };

// ---------------------------------------------------------------- Rendu
const CACHE = new Map(),
  NOT_FLAGS = new Set(['elite', 'look', 'pal', 'name']);
// Sprite d'une créature (34 × 42) : ombre au sol, contour sombre d'un pixel, puis le dessin modelé (haut éclairé,
// bas dans l'ombre). Gardé en cache par espèce, palette et options.
export function creatureSprite(look, pal, opts = {}) {
  const name = SPECIES[look] ? look : ALIASES[look] || 'wolf',
    flags = Object.keys(opts)
      .filter(f => opts[f] && !NOT_FLAGS.has(f))
      .sort(),
    key =
      name + '|' + pal.join() + '|' + flags.map(f => f + '=' + opts[f]).join() + (opts.elite ? '|elite' : '');
  if (CACHE.has(key)) return CACHE.get(key);
  const k = brush(32, 40);
  SPECIES[name].draw(k, pal, opts);
  polish(k.cv, 2, look.length);
  const src = k.g.getImageData(0, 0, 32, 40).data,
    out = makeCanvas(34, 42),
    og = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d')),
    img = og.getImageData(0, 0, 34, 42),
    d = img.data,
    alpha = (x, y) => (x < 0 || y < 0 || x >= 32 || y >= 40 ? 0 : src[(y * 32 + x) * 4 + 3]);
  // Ombre portée au sol.
  for (let y = 37; y < 40; y++) for (let x = 7; x < 27; x++) d[(y * 34 + x) * 4 + 3] = 90;
  for (let y = 0; y < 42; y++)
    for (let x = 0; x < 34; x++) {
      const sx = x - 1,
        sy = y - 1,
        i = (y * 34 + x) * 4,
        a = alpha(sx, sy);
      if (a > 0) {
        const j = (sy * 32 + sx) * 4,
          f = a / 255,
          below = d[i + 3] / 255;
        for (let c = 0; c < 3; c++) d[i + c] = src[j + c] * f + d[i + c] * (1 - f);
        d[i + 3] = Math.round((f + below * (1 - f)) * 255);
      } else if (
        alpha(sx - 1, sy) > 128 ||
        alpha(sx + 1, sy) > 128 ||
        alpha(sx, sy - 1) > 128 ||
        alpha(sx, sy + 1) > 128
      ) {
        d[i] = 14;
        d[i + 1] = 10;
        d[i + 2] = 22;
        d[i + 3] = 217;
      }
    }
  og.putImageData(img, 0, 0);
  CACHE.set(key, out);
  return out;
}
// Anciennes silhouettes génériques : chaque nom reste valable et mène à l'espèce la plus proche.
const ALIASES = {
  quad: 'wolf',
  beast: 'rat',
  flyer: 'bat',
  robed: 'caster',
  rogue: 'bandit',
  brute: 'ogre',
  spirit: 'ghost'
};
export const creatureFloats = look => !!SPECIES[SPECIES[look] ? look : ALIASES[look]]?.float;
export const creatureLegs = look => SPECIES[SPECIES[look] ? look : ALIASES[look]]?.legs !== false;
export const CREATURE_SPECIES = () => Object.keys(SPECIES);
// Nom unique pour les scripts classiques (pont).
export const CANAAN_CREATURE_ART = Object.freeze({
  creatureSprite,
  creatureFloats,
  creatureLegs,
  CREATURE_SPECIES
});
