// @ts-check
// Art des créatures : humanoïdes (bandits, chevaliers, prêtres, sorcières…), un corps commun avec coiffe, visage,
// tenue et arme propres à chacun, et leurs variantes d'élite. Le rendu est dans client/art/creature-art.js.
// Module ES (src/canaan/client/).
import { shade } from '../pixel-kit.js';
import {
  INK,
  WHITE,
  BONE,
  CLAW,
  BLOOD,
  IRON,
  GOLD,
  WOOD,
  SKIN,
  pts,
  xy,
  ell,
  ghost,
  eye,
  crown,
  speckle,
  registry
} from './kit.js';

// Humanoïdes : registre de la famille, rassemblé par client/art/creature-art.js.
const { list: HUMANOIDS, species } = registry();
export { HUMANOIDS };

// ---------------------------------------------------------------- Humanoïdes
// Corps commun des humanoïdes, de face. Chaque personnage choisit sa carrure (`build`), sa peau, son visage
// (`face`), sa coiffe (`head`), sa tenue (`robe`, `cape`, `armor`), son arme (`hold`) et ce qu'il porte à l'autre
// main (`off`). Palette : [tenue, ombre de la tenue, liseré, métal ou accent, yeux].
const BUILDS = {
  thin: { hw: 5, hy: 4, hh: 9, sy: 13, wy: 25, arm: 2 },
  normal: { hw: 6, hy: 4, hh: 9, sy: 13, wy: 25, arm: 3 },
  stocky: { hw: 7, hy: 7, hh: 8, sy: 15, wy: 27, arm: 3 },
  big: { hw: 8, hy: 2, hh: 8, sy: 10, wy: 25, arm: 4 },
  small: { hw: 5, hy: 9, hh: 10, sy: 19, wy: 29, arm: 2 },
  dwarf: { hw: 7, hy: 9, hh: 8, sy: 17, wy: 29, arm: 3 }
};
function person(k, pal, s) {
  const [m, dk, lt, ac] = pal,
    B = BUILDS[s.build] || BUILDS.normal,
    cx = 16,
    hw = B.hw,
    skin = s.skin || SKIN,
    hx = cx - 4,
    hw2 = 8,
    hy = B.hy,
    hh = B.hh,
    sy = B.sy,
    wy = B.wy,
    rh = { x: cx + hw + 1, y: wy - 1 },
    lh = { x: cx - hw - 3, y: wy - 1 },
    metal = s.metal || IRON;
  // Cape et objets dans le dos.
  if (s.cape) {
    k.poly(xy(cx - hw, sy, cx + hw, sy, cx + hw + 3, 35, cx - hw - 3, 35), s.cape);
    k.rect(cx - hw - 3, 34, hw * 2 + 6, 1, shade(s.cape, 0.7));
  }
  if (s.wings) wingsBack(k, s.wings, sy);
  // Jambes ou robe.
  if (s.robe) {
    k.poly(xy(cx - hw, wy - 4, cx + hw, wy - 4, cx + hw + 3, 36, cx - hw - 3, 36), m);
    k.rect(cx - 1, wy - 2, 2, 36 - wy + 2, dk);
    k.rect(cx - hw - 3, 34, hw * 2 + 6, 2, s.trim || ac);
    if (s.tatters) for (let x = cx - hw - 3; x < cx + hw + 3; x += 3) k.rect(x + 1, 35, 1, 1, dk);
  } else {
    const lw = Math.max(3, hw - 2),
      leg = s.legs || dk;
    k.rect(cx - lw - 1, wy, lw, 36 - wy, leg);
    k.rect(cx + 1, wy, lw, 36 - wy, leg);
    if (s.hooves) {
      k.rect(cx - lw - 1, 34, lw, 2, INK);
      k.rect(cx + 1, 34, lw, 2, INK);
    } else if (!s.barefoot) {
      k.rect(cx - lw - 2, 33, lw + 1, 3, s.boots || '#2a1e18');
      k.rect(cx + 1, 33, lw + 1, 3, s.boots || '#2a1e18');
    }
    if (s.kilt)
      k.poly(xy(cx - hw, wy - 1, cx + hw, wy - 1, cx + hw + 1, wy + 5, cx - hw - 1, wy + 5), s.kilt);
  }
  // Torse.
  const ty = sy,
    belly = s.belly ? 2 : 0;
  k.rect(cx - hw, ty, hw * 2, wy - ty, s.bare ? skin : m);
  if (belly) ell(k, cx, wy - 4, hw + 1, 4, s.bare ? skin : m);
  if (s.bare) {
    k.rect(cx - 3, ty + 3, 2, 1, shade(skin, 0.8));
    k.rect(cx + 1, ty + 3, 2, 1, shade(skin, 0.8));
    k.rect(cx - hw, wy - 2, hw * 2, 2, s.belt || dk);
  } else {
    k.rect(cx - hw, ty, 3, wy - ty, lt);
    k.rect(cx - hw, wy - 3, hw * 2, 2, s.belt || dk);
    k.px(cx, wy - 3, ac);
  }
  if (s.ribs)
    for (let y = ty + 2; y < wy - 3; y += 2) k.rect(cx - hw + 1, y, hw * 2 - 2, 1, shade(skin, 0.7));
  if (s.armor) {
    // Cuirasse : plastron et épaulières de métal.
    k.rect(cx - hw + 1, ty + 1, hw * 2 - 2, wy - ty - 4, metal[1]);
    k.rect(cx - hw + 1, ty + 1, 3, wy - ty - 4, metal[0]);
    k.rect(cx - 1, ty + 2, 2, wy - ty - 6, s.armor === true ? ac : s.armor);
    k.rect(cx - hw - 3, ty - 1, 5, 4, metal[0]);
    k.rect(cx + hw - 2, ty - 1, 5, 4, metal[1]);
    k.rect(cx - hw - 3, ty + 2, 5, 1, metal[2]);
    k.rect(cx + hw - 2, ty + 2, 5, 1, metal[2]);
  }
  if (s.collar)
    k.poly(
      xy(
        cx - hw - 1,
        ty - 4,
        cx - 2,
        ty + 2,
        cx + 2,
        ty + 2,
        cx + hw + 1,
        ty - 4,
        cx + hw,
        ty + 1,
        cx - hw,
        ty + 1
      ),
      s.collar
    );
  if (s.chains)
    for (let i = 0; i < hw * 2; i += 2)
      k.px(cx - hw + i, ty + 3 + Math.round(i / 2), i % 4 ? metal[0] : metal[2]);
  // Bras.
  const aw = B.arm,
    sleeve = s.bare || s.armsBare ? skin : m;
  k.rect(cx - hw - aw, ty, aw, wy - ty - 1, sleeve);
  k.rect(cx + hw, ty, aw, wy - ty - 1, sleeve);
  if (s.longArms) {
    k.rect(cx - hw - aw, wy - 1, aw, 6, sleeve);
    k.rect(cx + hw, wy - 1, aw, 6, sleeve);
    lh.y = wy + 5;
    rh.y = wy + 5;
  }
  const hand = s.gloves || (s.claws ? skin : skin);
  k.rect(lh.x + 3 - aw, lh.y - 1, aw, 2, hand);
  k.rect(rh.x - 1, rh.y - 1, aw, 2, hand);
  if (s.claws) {
    for (const x of [lh.x + 3 - aw, lh.x + 4 - aw]) k.rect(x, lh.y + 1, 1, 2, CLAW);
    for (const x of [rh.x - 1, rh.x]) k.rect(x, rh.y + 1, 1, 2, CLAW);
  }
  // Tête et visage.
  head(k, pal, s, { cx, hx, hw: hw2, hy, hh, skin, metal });
  // Arme et main gauche, devant le corps.
  if (s.off) item(k, s.off, lh.x + 1, lh.y, pal, metal, -1);
  if (s.hold) item(k, s.hold, rh.x, rh.y, pal, metal, 1);
}
// Ailes dans le dos d'un humanoïde : plumes (ange), noires (déchu), membrane (démon), papillon.
function wingsBack(k, kind, sy) {
  const col =
      kind === 'dark' ? '#2a2230' : kind === 'demon' ? '#5a1e24' : kind === 'gold' ? '#fff0c0' : '#f4f0ff',
    edge =
      kind === 'dark' ? '#4a3e58' : kind === 'demon' ? '#8a2e30' : kind === 'gold' ? '#e0b858' : '#c8c0e8';
  for (const side of [-1, 1]) {
    const f = x => (side < 0 ? 32 - x : x);
    if (kind === 'demon') {
      k.poly(xy(f(20), sy, f(30), sy - 8, f(32), sy + 4, f(28), sy + 2, f(27), sy + 9, f(22), sy + 8), col);
      k.line(f(20), sy, f(30), sy - 8, edge);
    } else {
      k.poly(
        xy(f(20), sy + 1, f(28), sy - 6, f(32), sy - 2, f(31), sy + 10, f(27), sy + 18, f(22), sy + 12),
        col
      );
      for (let i = 0; i < 3; i++) k.line(f(23 + i * 2), sy + 3, f(25 + i * 2), sy + 12 + i * 2, edge);
    }
  }
}
function head(k, pal, s, { cx, hx, hw, hy, hh, skin, metal }) {
  const [, dk, , ac, ey] = pal,
    face = s.face || 'human',
    hd = s.head;
  // Cheveux longs derrière la tête.
  if (s.hair) k.rect(hx - 1, hy + 2, hw + 2, hh + 3, s.hair);
  if (hd === 'hood' || hd === 'cowl' || hd === 'veil') {
    const hc = s.hoodColor || (hd === 'veil' ? '#f0ece4' : dk);
    k.rect(hx - 2, hy - 1, hw + 4, hh + 4, hc);
    if (hd === 'cowl') k.poly(xy(hx - 1, hy, cx, hy - 10, hx + hw + 1, hy), hc);
    else k.poly(xy(hx - 2, hy + 1, cx, hy - 3, hx + hw + 2, hy + 1), hc);
    if (hd === 'veil') k.rect(hx - 1, hy - 1, hw + 2, 2, s.veilBand || '#2a2230');
  }
  // Visage.
  const fx = hx + 1,
    fy = hy + 1,
    fw = hw - 2,
    fh = hh - 2;
  if (face === 'skull') {
    k.rect(hx, hy, hw, hh - 2, BONE);
    k.rect(hx + 1, hy + hh - 2, hw - 2, 2, BONE);
    k.rect(hx + 1, hy + 3, 2, 2, INK);
    k.rect(hx + hw - 3, hy + 3, 2, 2, INK);
    k.px(hx + 2, hy + 4, ey);
    k.px(hx + hw - 2, hy + 4, ey);
    k.px(cx - 1, hy + 6, INK);
    for (let x = hx + 2; x < hx + hw - 2; x += 2) k.px(x, hy + hh - 1, '#8a8068');
  } else if (face === 'shadow') {
    k.rect(fx, fy, fw, fh, '#0a0610');
    eye(k, fx + 1, fy + 2, ey, true);
    eye(k, fx + fw - 3, fy + 2, ey, true);
  } else if (face === 'helm') {
    k.rect(hx, hy, hw, hh, metal[1]);
    k.rect(hx, hy, hw, 2, metal[0]);
    k.rect(hx + 1, hy + 4, hw - 2, 2, INK);
    k.px(hx + 2, hy + 4, ey);
    k.px(hx + hw - 3, hy + 4, ey);
    for (let y = hy + 7; y < hy + hh; y += 2) k.px(cx - 1, y, INK);
  } else if (face === 'bull') {
    k.rect(hx - 1, hy, hw + 2, hh, skin);
    k.rect(hx + 1, hy + hh - 4, hw - 2, 4, shade(skin, 1.25));
    k.px(hx + 2, hy + hh - 3, INK);
    k.px(hx + hw - 3, hy + hh - 3, INK);
    k.rect(hx + 2, hy + hh, hw - 4, 1, GOLD[1]);
    eye(k, hx, hy + 3, ey, true);
    eye(k, hx + hw - 2, hy + 3, ey, true);
    k.poly(xy(hx - 1, hy + 2, hx - 6, hy - 1, hx - 5, hy - 5, hx - 3, hy - 1, hx, hy), CLAW);
    k.poly(
      xy(hx + hw + 1, hy + 2, hx + hw + 6, hy - 1, hx + hw + 5, hy - 5, hx + hw + 3, hy - 1, hx + hw, hy),
      CLAW
    );
    k.rect(hx - 3, hy + 2, 2, 2, skin);
    k.rect(hx + hw + 1, hy + 2, 2, 2, skin);
  } else {
    // Visage de chair (humain, pâle, gobelin, troll…).
    const col = face === 'pale' ? '#e8e4f0' : skin;
    k.rect(fx, fy, fw, fh, col);
    if (!hd || hd === 'bare' || hd === 'hair' || hd === 'crown' || hd === 'halo')
      k.rect(hx, hy + 1, hw, hh - 2, col);
    if (face === 'mask') {
      k.rect(fx, fy + 1, fw, 4, '#2a2024');
      k.px(fx + 1, fy + 2, ey);
      k.px(fx + fw - 2, fy + 2, ey);
    } else if (face === 'blind') {
      k.rect(fx, fy + 2, fw, 2, s.band || ac);
    } else {
      k.px(fx + 1, fy + 2, face === 'pale' ? '#e02040' : ey);
      k.px(fx + fw - 2, fy + 2, face === 'pale' ? '#e02040' : ey);
    }
    if (face === 'goblin' || face === 'troll') {
      // Nez crochu, grandes oreilles, crocs.
      k.rect(cx, fy + 3, 2, 3, shade(skin, 0.8));
      if (face === 'goblin') {
        k.poly(xy(hx, hy + 3, hx - 6, hy + 1, hx, hy + 6), skin);
        k.poly(xy(hx + hw, hy + 3, hx + hw + 6, hy + 1, hx + hw, hy + 6), skin);
      }
      k.rect(fx + 1, fy + fh - 1, fw - 2, 1, INK);
      k.px(fx + 1, fy + fh - 2, WHITE);
      k.px(fx + fw - 2, fy + fh - 2, WHITE);
    } else if (face === 'pale') {
      k.rect(fx + 2, fy + fh - 2, fw - 4, 1, '#6a1020');
      k.px(fx + 2, fy + fh - 1, WHITE);
      k.px(fx + fw - 3, fy + fh - 1, WHITE);
    } else if (face !== 'mask') k.rect(cx - 1, fy + fh - 2, 2, 1, shade(col, 0.7));
  }
  if (s.beard) {
    k.poly(
      xy(
        hx - 1,
        hy + hh - 4,
        hx + hw + 1,
        hy + hh - 4,
        hx + hw,
        hy + hh + 4,
        cx,
        hy + hh + 7,
        hx,
        hy + hh + 4
      ),
      s.beard
    );
    k.rect(cx - 2, hy + hh - 3, 4, 1, shade(s.beard, 0.7));
  }
  if (s.tusks) {
    k.rect(hx + 1, hy + hh - 3, 1, 3, BONE);
    k.rect(hx + hw - 2, hy + hh - 3, 1, 3, BONE);
  }
  // Coiffes.
  if (hd === 'bandana') {
    k.rect(hx, hy, hw, 3, ac);
    k.rect(hx, hy + hh - 4, hw, 3, ac);
    k.poly(xy(hx, hy + 1, hx - 4, hy + 4, hx - 2, hy + 1), ac);
  } else if (hd === 'hat') {
    k.rect(hx - 4, hy + 1, hw + 8, 2, s.hatColor || dk);
    k.rect(hx, hy - 3, hw, 4, s.hatColor || dk);
    k.rect(hx, hy, hw, 1, ac);
  } else if (hd === 'witch') {
    const hc = s.hatColor || dk;
    k.rect(hx - 4, hy + 1, hw + 8, 2, hc);
    k.poly(xy(hx, hy + 1, cx + 2, hy - 11, cx + 7, hy - 9, hx + hw, hy + 1), hc);
    k.rect(hx, hy - 1, hw, 2, ac);
  } else if (hd === 'mitre') {
    k.poly(xy(hx, hy + 1, cx, hy - 9, hx + hw, hy + 1), s.hatColor || WHITE);
    k.rect(cx - 1, hy - 7, 2, 8, GOLD[1]);
    k.rect(hx, hy, hw, 1, GOLD[1]);
  } else if (hd === 'crown') crown(k, hx, hy - 3, hw);
  else if (hd === 'helm' || hd === 'horned' || hd === 'miner') {
    k.rect(hx - 1, hy - 1, hw + 2, 4, metal[1]);
    k.rect(hx - 1, hy - 1, hw + 2, 1, metal[0]);
    k.rect(cx - 1, hy - 1, 2, 7, metal[2]);
    if (hd === 'horned') {
      k.poly(xy(hx - 1, hy + 1, hx - 5, hy - 2, hx - 5, hy - 6, hx - 2, hy - 2), CLAW);
      k.poly(xy(hx + hw + 1, hy + 1, hx + hw + 5, hy - 2, hx + hw + 5, hy - 6, hx + hw + 2, hy - 2), CLAW);
    }
    if (hd === 'miner') {
      k.rect(cx - 2, hy - 3, 4, 3, GOLD[1]);
      k.px(cx, hy - 3, WHITE);
      ghost(k, 0.3, () => k.disc(cx, hy - 2, 4, GOLD[0]));
    }
  } else if (hd === 'halo') {
    k.rect(hx, hy - 4, hw, 1, GOLD[0]);
    k.rect(hx - 1, hy - 3, 1, 1, GOLD[0]);
    k.rect(hx + hw, hy - 3, 1, 1, GOLD[0]);
  } else if (hd === 'antlers') {
    k.line(hx + 1, hy, hx - 3, hy - 7, WOOD[1]);
    k.line(hx - 1, hy - 3, hx - 4, hy - 3, WOOD[1]);
    k.line(hx + hw - 2, hy, hx + hw + 2, hy - 7, WOOD[1]);
    k.line(hx + hw, hy - 3, hx + hw + 3, hy - 3, WOOD[1]);
  } else if (hd === 'horns') {
    k.poly(xy(hx, hy + 1, hx - 2, hy - 4, hx + 2, hy), s.hornColor || CLAW);
    k.poly(xy(hx + hw, hy + 1, hx + hw + 2, hy - 4, hx + hw - 2, hy), s.hornColor || CLAW);
  } else if (hd === 'goggles') {
    k.rect(hx, hy + 2, hw, 2, '#5a3a24');
    k.disc(hx + 2, hy + 3, 1, '#9fe8ff');
    k.disc(hx + hw - 2, hy + 3, 1, '#9fe8ff');
    k.rect(hx, hy - 1, hw, 2, s.hair || '#f0f0f0');
  }
  if (s.crown && hd !== 'crown') crown(k, hx, hy - (hd === 'hood' ? 6 : 3), hw);
}
// Objets tenus en main : (x, y) est la main, `dir` 1 à droite et -1 à gauche.
export function item(k, kind, x, y, pal, metal, dir) {
  const [, , , ac] = pal;
  switch (kind) {
    case 'sword':
      k.rect(x + 1, y - 15, 2, 15, metal[0]);
      k.rect(x + 1, y - 15, 1, 15, WHITE);
      k.rect(x - 1, y - 1, 6, 2, ac);
      k.rect(x + 1, y + 1, 2, 3, WOOD[2]);
      break;
    case 'greatsword':
      k.rect(x, y - 22, 3, 22, metal[0]);
      k.rect(x, y - 22, 1, 22, WHITE);
      k.rect(x - 2, y - 1, 7, 2, ac);
      k.rect(x + 1, y + 1, 2, 4, WOOD[2]);
      break;
    case 'dagger':
      k.rect(x + 1, y - 6, 1, 6, metal[0]);
      k.rect(x, y - 1, 3, 1, ac);
      break;
    case 'axe':
    case 'greataxe': {
      const big = kind === 'greataxe',
        top = y - (big ? 22 : 15);
      k.rect(x + 1, top, 2, y - top + 4, WOOD[1]);
      k.poly(
        xy(
          x + 3,
          top + 1,
          x + 3 + (big ? 7 : 5) * dir,
          top - 2,
          x + 3 + (big ? 7 : 5) * dir,
          top + (big ? 10 : 7),
          x + 3,
          top + (big ? 7 : 5)
        ),
        metal[0]
      );
      if (big) k.poly(xy(x, top + 1, x - 5, top - 1, x - 5, top + 8, x, top + 6), metal[1]);
      break;
    }
    case 'halberd':
    case 'spear':
      k.rect(x + 1, y - 24, 1, 30, WOOD[1]);
      k.poly(xy(x, y - 24, x + 1, y - 29, x + 3, y - 24), metal[0]);
      if (kind === 'halberd')
        k.poly(xy(x + 2, y - 23, x + 6, y - 25, x + 6, y - 18, x + 2, y - 20), metal[0]);
      break;
    case 'staff':
      k.rect(x + 1, y - 20, 2, 27, WOOD[1]);
      k.disc(x + 2, y - 22, 2, ac);
      k.px(x + 1, y - 23, WHITE);
      ghost(k, 0.3, () => k.disc(x + 2, y - 22, 4, ac));
      break;
    case 'scythe':
      k.rect(x + 1, y - 20, 1, 27, WOOD[2]);
      k.poly(xy(x + 1, y - 20, x - 9, y - 19, x - 12, y - 14, x - 6, y - 17, x + 1, y - 17), metal[0]);
      break;
    case 'shovel':
      k.rect(x + 1, y - 16, 1, 20, WOOD[1]);
      k.rect(x - 1, y - 18, 5, 2, WOOD[2]);
      k.poly(xy(x - 1, y + 3, x + 4, y + 3, x + 4, y + 8, x + 1, y + 10, x - 1, y + 8), metal[1]);
      break;
    case 'pickaxe':
      k.rect(x + 1, y - 12, 2, 16, WOOD[1]);
      k.poly(xy(x - 5, y - 11, x + 2, y - 15, x + 9, y - 11, x + 2, y - 13), metal[0]);
      break;
    case 'hammer':
      k.rect(x + 1, y - 12, 2, 16, WOOD[1]);
      k.rect(x - 3, y - 17, 10, 6, metal[1]);
      k.rect(x - 3, y - 17, 10, 2, metal[0]);
      break;
    case 'club':
      k.poly(xy(x, y + 2, x - 1, y - 12, x + 2, y - 15, x + 5, y - 12, x + 3, y + 2), WOOD[1]);
      k.px(x + 1, y - 10, WOOD[0]);
      for (const [px, py] of xy(x - 1, y - 9, x + 4, y - 11, x + 2, y - 15)) k.px(px, py, CLAW);
      break;
    case 'whip':
      k.rect(x + 1, y - 2, 2, 4, WOOD[2]);
      k.line(x + 2, y + 2, x + 5, y + 8, '#5a3a24');
      k.line(x + 5, y + 8, x + 2, y + 11, '#5a3a24');
      k.line(x + 2, y + 11, x + 6, y + 12, '#5a3a24');
      break;
    case 'crossbow':
      k.rect(x - 1, y - 3, 7, 2, WOOD[1]);
      k.line(x + 5, y - 7, x + 5, y + 2, WOOD[2]);
      k.line(x + 5, y - 7, x, y - 2, '#d8d0c0');
      break;
    case 'bow':
      k.line(x + 2, y - 10, x + 4, y - 5, WOOD[1]);
      k.line(x + 4, y - 5, x + 4, y + 3, WOOD[1]);
      k.line(x + 4, y + 3, x + 2, y + 8, WOOD[1]);
      k.line(x + 2, y - 10, x + 2, y + 8, '#e8e0d0');
      break;
    case 'book':
      k.rect(x - 2, y - 2, 6, 5, ac);
      k.rect(x - 1, y - 1, 4, 3, BONE);
      break;
    case 'lantern':
      k.rect(x, y, 1, 3, IRON[3]);
      k.rect(x - 2, y + 3, 5, 5, IRON[2]);
      k.rect(x - 1, y + 4, 3, 3, GOLD[0]);
      ghost(k, 0.3, () => k.disc(x, y + 5, 5, GOLD[1]));
      break;
    case 'censer':
      k.line(x + 1, y, x + 1, y + 5, GOLD[2]);
      k.disc(x + 1, y + 7, 2, GOLD[1]);
      ghost(k, 0.4, () => {
        k.disc(x + 3, y + 3, 2, '#d8d0e8');
        k.disc(x + 5, y, 2, '#d8d0e8');
      });
      break;
    case 'scales':
      k.rect(x + 1, y - 14, 1, 16, GOLD[2]);
      k.rect(x - 5, y - 14, 13, 1, GOLD[1]);
      k.line(x - 5, y - 14, x - 6, y - 9, GOLD[2]);
      k.line(x + 7, y - 14, x + 8, y - 9, GOLD[2]);
      k.rect(x - 8, y - 9, 5, 1, GOLD[1]);
      k.rect(x + 6, y - 9, 5, 1, GOLD[1]);
      break;
    case 'shield':
      k.poly(xy(x - 4, y - 9, x + 3, y - 9, x + 3, y, x - 0.5, y + 4, x - 4, y), metal[1]);
      k.rect(x - 3, y - 8, 5, 2, ac);
      k.rect(x - 1, y - 6, 1, 8, ac);
      break;
    case 'towershield':
      k.rect(x - 5, y - 13, 8, 18, metal[1]);
      k.rect(x - 5, y - 13, 8, 2, metal[0]);
      k.rect(x - 2, y - 9, 2, 10, ac);
      break;
    case 'chain':
      for (let i = 0; i < 6; i++) k.px(x + (i % 2), y + 1 + i * 2, metal[0]);
      k.disc(x + 1, y + 14, 2, metal[2]);
      break;
    case 'cleaver':
      k.rect(x + 1, y - 2, 2, 5, WOOD[2]);
      k.rect(x - 1, y - 11, 7, 9, metal[0]);
      k.rect(x - 1, y - 4, 7, 1, BLOOD);
      break;
    case 'torch':
      k.rect(x + 1, y - 8, 2, 12, WOOD[1]);
      k.poly(xy(x - 1, y - 8, x + 2, y - 15, x + 5, y - 8), '#ff8a2a');
      k.poly(xy(x + 1, y - 8, x + 2, y - 12, x + 3, y - 8), '#ffe07a');
      break;
    case 'wrench':
      k.rect(x + 1, y - 12, 2, 15, metal[1]);
      k.rect(x - 1, y - 15, 6, 4, metal[1]);
      k.rect(x + 1, y - 14, 2, 3, IRON[3]);
      break;
    case 'orb':
      k.disc(x + 1, y - 2, 3, ac);
      k.px(x, y - 3, WHITE);
      ghost(k, 0.3, () => k.disc(x + 1, y - 2, 5, ac));
      break;
    case 'flail':
      k.rect(x + 1, y - 6, 2, 9, WOOD[1]);
      k.line(x + 2, y - 6, x + 6, y - 11, metal[0]);
      k.disc(x + 7, y - 12, 2, metal[1]);
      k.px(x + 9, y - 12, metal[0]);
      k.px(x + 7, y - 15, metal[0]);
      break;
  }
}
// Déclare un humanoïde : réglages par défaut de l'espèce, que les options d'une créature précisent.
function humanoid(name, base, meta) {
  species(
    name,
    (k, pal, o) => {
      const s = elite(name, { ...base, ...o }, o.elite);
      if (s.spectral) ghost(k, 0.72, () => person(k, pal, s));
      else person(k, pal, s);
    },
    meta
  );
}
// Variante d'élite d'un humanoïde : plus massif, cuirassé ou couronné selon ce qu'il porte déjà.
function elite(name, s, on) {
  if (!on) return s;
  const e = { ...s };
  if (e.build === 'thin') e.build = 'normal';
  else if (e.build === 'normal' || !e.build) e.build = 'stocky';
  if (!e.armor && !e.robe) e.armor = true;
  if (!e.cape) e.cape = '#7a1a24';
  return e;
}
humanoid('humanoid', {});
// Bandit : capuche, foulard sur le visage, deux dagues.
humanoid('bandit', {
  build: 'thin',
  head: 'hood',
  face: 'mask',
  hold: 'dagger',
  off: 'dagger',
  belt: '#3a2a1c'
});
// Pilleur : chapeau à larges bords, hache et sac, barbe.
humanoid('raider', { head: 'hat', hold: 'axe', beard: '#5a3a24', belt: '#3a2a1c' });
// Gobelin : petit, grosse tête, oreilles pointues, nez crochu.
humanoid('goblin', {
  build: 'small',
  face: 'goblin',
  skin: '#7aa65a',
  barefoot: true,
  kilt: '#6a4a30',
  hold: 'dagger'
});
// Troll : grand, voûté, longs bras, crocs, gourdin.
humanoid('troll', {
  build: 'big',
  face: 'troll',
  skin: '#6e8e5a',
  bare: true,
  longArms: true,
  tusks: true,
  kilt: '#5a4430',
  barefoot: true,
  hold: 'club'
});
// Minotaure : tête de taureau aux grandes cornes, torse nu, sabots, hache à deux mains.
humanoid('minotaur', {
  build: 'big',
  face: 'bull',
  skin: '#8a5e40',
  bare: true,
  hooves: true,
  kilt: '#5a3a24',
  hold: 'greataxe',
  belly: false
});
// Goule : chair grise, côtes saillantes, griffes, voûtée.
humanoid('ghoul', {
  build: 'thin',
  face: 'troll',
  skin: '#a8b49a',
  bare: true,
  ribs: true,
  claws: true,
  longArms: true,
  barefoot: true,
  kilt: '#4a3a2a'
});
// Ogre geôlier : ventre, masque de cuir, chaînes, couperet.
humanoid('ogre', {
  build: 'big',
  face: 'mask',
  skin: '#c89070',
  bare: true,
  belly: true,
  chains: true,
  hold: 'cleaver',
  off: 'chain',
  kilt: '#4a3428',
  barefoot: true
});
// Nain : trapu, grande barbe, casque, marteau.
humanoid('dwarf', { build: 'dwarf', head: 'helm', beard: '#c87a3a', hold: 'hammer', armor: true });
// Chevalier : armure, heaume, épée et bouclier, cape.
humanoid('knight', {
  face: 'helm',
  armor: true,
  hold: 'sword',
  off: 'shield',
  legs: IRON[2],
  boots: IRON[3],
  armsBare: false
});
// Prêtre ou mage en robe : capuche, bâton.
humanoid('caster', { robe: true, head: 'hood', face: 'shadow', hold: 'staff' });
// Squelette : os nus, orbites luisantes (le corps est peint à part, voir plus bas).
// Vampire : visage pâle, col haut, cape.
humanoid('vampire', {
  build: 'thin',
  robe: true,
  face: 'pale',
  hair: '#1a1018',
  collar: '#2a0a12',
  cape: '#1a0a10'
});
// Sorcière : chapeau pointu, cheveux, balai ou bâton.
humanoid('witch', { robe: true, head: 'witch', hair: '#3a2a3a', hold: 'staff' });
// Pénitent : cagoule pointue, dos nu, fouet.
humanoid('penitent', {
  build: 'thin',
  head: 'cowl',
  face: 'shadow',
  bare: true,
  ribs: true,
  skin: '#d8b8a0',
  kilt: '#5a4a3a',
  barefoot: true,
  hold: 'whip'
});
// Yéti : grand corps de fourrure blanche hirsute, visage bleuté, petites cornes, grands pieds.
species('yeti', (k, [m, dk, lt, ac, ey], o) => {
  k.rect(8, 30, 6, 6, m);
  k.rect(18, 30, 6, 6, m);
  k.rect(6, 34, 8, 2, dk);
  k.rect(18, 34, 8, 2, dk);
  ell(k, 16, 21, 10, 10, m);
  for (let x = 6; x < 27; x += 2) k.rect(x, 30 + (x % 4 ? 1 : 0), 1, 2, m);
  k.rect(1, 13, 6, 17, m);
  k.rect(25, 13, 6, 17, m);
  for (let y = 15; y < 30; y += 3) {
    k.px(0, y, m);
    k.px(31, y, m);
  }
  k.rect(1, 29, 6, 3, ac);
  k.rect(25, 29, 6, 3, ac);
  speckle(k, 7, 12, 18, 18, lt, 14, 13);
  k.rect(12, 9, 9, 8, ac);
  k.rect(13, 14, 7, 2, INK);
  k.px(14, 14, WHITE);
  k.px(18, 14, WHITE);
  eye(k, 13, 11, ey, true);
  eye(k, 18, 11, ey, true);
  ell(k, 16, 7, 6, 3, m);
  k.poly(pts('10 6, 7 1, 11 4'), dk);
  k.poly(pts('22 6, 25 1, 21 4'), dk);
  if (o.elite) {
    k.poly(pts('9 5, 4 -1, 6 4'), ac);
    k.poly(pts('23 5, 28 -1, 26 4'), ac);
    for (const [x, y] of pts('3 12, 28 12, 16 2')) k.poly(xy(x - 1, y, x, y - 4, x + 2, y), '#d0f4ff');
  }
});
// Kobold : petit reptile à museau de chien, cornes courtes, queue, casque de mineur et pioche.
species('kobold', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('10 28, 3 31, 1 35, 5 33, 11 31'), m);
  k.rect(11, 29, 3, 7, dk);
  k.rect(17, 29, 3, 7, dk);
  k.rect(10, 34, 4, 2, CLAW);
  k.rect(17, 34, 4, 2, CLAW);
  ell(k, 15, 24, 5, 6, m);
  k.rect(13, 23, 5, 6, lt);
  k.rect(10, 27, 11, 2, '#5a3a24');
  k.rect(9, 20, 2, 7, m);
  // Tête à museau
  ell(k, 15, 14, 5, 5, m);
  k.poly(pts('18 12, 26 14, 26 17, 18 18'), m);
  k.rect(24, 13, 2, 1, INK);
  k.line(19, 17, 25, 17, dk);
  k.px(21, 18, WHITE);
  eye(k, 17, 12, ey, true);
  k.poly(pts('12 10, 9 5, 13 9'), CLAW);
  if (o.head !== 'crown') {
    k.rect(10, 8, 10, 3, IRON[1]);
    k.rect(14, 6, 3, 3, GOLD[1]);
    ghost(k, 0.3, () => k.disc(15, 7, 4, GOLD[0]));
  } else crown(k, 11, 6, 8);
  item(k, o.hold || 'pickaxe', 21, 25, [m, dk, lt, ac], IRON, 1);
  k.rect(20, 23, 3, 3, m);
  if (o.elite) {
    k.rect(12, 21, 7, 4, IRON[1]);
    k.rect(12, 21, 7, 1, IRON[0]);
  }
});
// Diablotin : petit démon rouge aux ailes de chauve-souris, cornes, queue en pointe de flèche, fourche.
species('imp', (k, [m, dk, lt, ac, ey], o) => {
  if (!o.nowings) {
    k.poly(pts('12 18, 3 9, 1 18, 5 16, 6 22'), dk);
    k.poly(pts('20 18, 29 9, 31 18, 27 16, 26 22'), dk);
  }
  k.line(12, 28, 6, 32, m);
  k.line(6, 32, 3, 28, m);
  k.poly(pts('1 27, 5 27, 3 24'), m);
  k.rect(12, 28, 3, 8, dk);
  k.rect(17, 28, 3, 8, dk);
  k.rect(11, 34, 4, 2, INK);
  k.rect(17, 34, 4, 2, INK);
  ell(k, 16, 24, 5, 6, m);
  k.rect(14, 23, 4, 4, lt);
  k.disc(16, 14, 5, m);
  k.poly(pts('11 12, 9 5, 13 10'), ac);
  k.poly(pts('21 12, 23 5, 19 10'), ac);
  eye(k, 13, 13, ey, true);
  eye(k, 17, 13, ey, true);
  k.rect(14, 17, 4, 1, INK);
  k.px(14, 16, WHITE);
  k.px(17, 16, WHITE);
  // Fourche
  k.rect(24, 10, 1, 22, WOOD[2]);
  k.rect(22, 9, 5, 1, IRON[1]);
  for (const x of [22, 24, 26]) k.rect(x, 6, 1, 3, IRON[0]);
  k.rect(20, 21, 5, 3, m);
  if (o.elite) {
    ghost(k, 0.5, () => k.disc(16, 9, 3, '#ff8a2a'));
    k.poly(pts('14 9, 16 3, 18 9'), '#ffd36b');
    k.poly(pts('11 11, 7 2, 12 8'), ac);
    k.poly(pts('21 11, 25 2, 20 8'), ac);
  }
});
// Gargouille : statue ailée accroupie, cornes, ailes repliées, griffes sur le socle.
species('gargoyle', (k, [m, dk, lt, ac, ey], o) => {
  k.poly(pts('10 12, 2 4, 0 14, 4 22, 10 24'), dk);
  k.poly(pts('22 12, 30 4, 32 14, 28 22, 22 24'), dk);
  k.line(10, 13, 2, 5, m);
  k.line(22, 13, 30, 5, m);
  k.rect(6, 33, 20, 3, shade(m, 0.8));
  ell(k, 16, 25, 8, 8, m);
  k.rect(8, 28, 5, 6, m);
  k.rect(19, 28, 5, 6, m);
  for (const x of [8, 10, 12, 19, 21, 23]) k.px(x, 33, CLAW);
  k.rect(11, 20, 3, 9, lt);
  k.rect(18, 20, 3, 9, lt);
  k.rect(11, 9, 10, 9, m);
  k.rect(13, 15, 6, 3, dk);
  k.px(14, 15, WHITE);
  k.px(17, 15, WHITE);
  eye(k, 12, 11, ey, true);
  eye(k, 18, 11, ey, true);
  k.poly(pts('11 9, 8 3, 13 8'), ac);
  k.poly(pts('21 9, 24 3, 19 8'), ac);
  speckle(k, 8, 18, 16, 14, dk, 10, 17);
  if (o.elite) for (const [x, y] of pts('7 22, 24 19, 14 26')) k.line(x, y, x + 2, y + 3, ac);
});
