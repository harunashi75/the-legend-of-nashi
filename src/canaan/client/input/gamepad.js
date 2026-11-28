// @ts-check
// Manette : règles pures de lecture (disposition standard du navigateur : Xbox, PlayStation, Steam Deck, Switch Pro…),
// zone morte des sticks, direction en 8 secteurs, boutons tout juste appuyés ou relâchés, répétition dans les menus,
// choix de l'élément voisin pour naviguer dans l'interface, et noms des boutons affichés à la place des touches.
// Aucun accès à la page ni au jeu : scripts/gamepad.js branche ces règles sur le jeu.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).

/** Boutons de la disposition standard (navigator.getGamepads, mapping « standard »). */
export const PAD_BUTTONS = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  VIEW: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15
});
/** Zone morte des sticks : en dessous, le stick est au repos (usure, petites dérives). */
export const PAD_DEADZONE = 0.3;
/** Seuil des gâchettes analogiques (LT, RT) et des boutons à pression. */
export const PAD_TRIGGER = 0.5;

/**
 * Stick avec zone morte radiale, remis à l'échelle : 0 au bord de la zone morte, 1 en butée.
 * @returns {{ x: number, y: number, mag: number }}
 */
export function padStick(x, y, dead = PAD_DEADZONE) {
  const m = Math.hypot(x || 0, y || 0);
  if (!(m > dead)) return { x: 0, y: 0, mag: 0 };
  const mag = Math.min(1, (m - dead) / (1 - dead));
  return { x: (x / m) * mag, y: (y / m) * mag, mag };
}
/**
 * Direction en 8 secteurs de 45° ([-1, 0 ou 1, -1, 0 ou 1]), [0, 0] au repos. Les diagonales ont un secteur aussi
 * large que les axes : pas de diagonale « collante » ni introuvable.
 * @returns {[number, number]}
 */
export function padDirection8(x, y, dead = PAD_DEADZONE) {
  const s = padStick(x, y, dead);
  if (!s.mag) return [0, 0];
  const sector = Math.round(Math.atan2(s.y, s.x) / (Math.PI / 4));
  const a = (sector * Math.PI) / 4;
  return [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
}
/**
 * État lu d'une manette : 16 boutons (appuyé ou non) et les deux sticks bruts.
 * @param {{ buttons: ArrayLike<{ pressed?: boolean, value?: number }>, axes: ArrayLike<number> }} gp
 */
export function padRead(gp) {
  const buttons = [];
  for (let i = 0; i < 16; i++) {
    const b = gp.buttons[i];
    buttons.push(!!b && (!!b.pressed || (b.value || 0) > PAD_TRIGGER));
  }
  const ax = i => (Number.isFinite(gp.axes[i]) ? gp.axes[i] : 0);
  return { buttons, lx: ax(0), ly: ax(1), rx: ax(2), ry: ax(3) };
}
/**
 * Boutons tout juste appuyés (down) et relâchés (up) depuis l'état précédent (null : aucun).
 * @returns {{ down: number[], up: number[] }}
 */
export function padEdges(prev, cur) {
  const down = [],
    up = [];
  cur.buttons.forEach((on, i) => {
    const was = !!prev?.buttons[i];
    if (on && !was) down.push(i);
    if (!on && was) up.push(i);
  });
  return { down, up };
}
/**
 * Répétition d'une direction maintenue dans les menus : un pas tout de suite, puis après `first` ms, puis toutes les
 * `next` ms. `state` garde la direction et l'échéance ; renvoie vrai quand un pas doit être fait.
 */
export function padRepeat(state, dir, now, first = 360, next = 120) {
  const key = dir[0] + ',' + dir[1];
  if (key === '0,0') {
    state.key = key;
    return false;
  }
  if (state.key !== key) {
    state.key = key;
    state.at = now + first;
    return true;
  }
  if (now >= state.at) {
    state.at = now + next;
    return true;
  }
  return false;
}
/**
 * Élément voisin dans une direction, pour naviguer dans l'interface : parmi les rectangles situés de ce côté, le plus
 * proche dans l'axe, pénalisé par son décalage sur le côté (un élément aligné passe avant un élément en biais).
 * @param {{ x: number, y: number, w: number, h: number }} from rectangle de l'élément actuel
 * @param {ReadonlyArray<{ x: number, y: number, w: number, h: number }>} rects candidats
 * @param {[number, number]} dir direction (dx, dy)
 * @returns {number} indice du voisin, ou -1
 */
export function padNeighbor(from, rects, dir) {
  const [dx, dy] = dir,
    fx = from.x + from.w / 2,
    fy = from.y + from.h / 2;
  let best = -1,
    bestScore = Infinity;
  rects.forEach((r, i) => {
    const cx = r.x + r.w / 2,
      cy = r.y + r.h / 2;
    // Distance dans l'axe, de bord à bord quand c'est possible (grilles serrées).
    const along = dx
      ? dx > 0
        ? r.x - (from.x + from.w)
        : from.x - (r.x + r.w)
      : dy > 0
        ? r.y - (from.y + from.h)
        : from.y - (r.y + r.h);
    const centerAlong = (cx - fx) * dx + (cy - fy) * dy;
    if (centerAlong <= 1 || along < -Math.min(r.w, r.h, from.w, from.h) / 2) return;
    // Décalage sur le côté : nul si les deux éléments se recouvrent sur l'autre axe.
    const side = dx
      ? Math.max(0, r.y - (from.y + from.h), from.y - (r.y + r.h))
      : Math.max(0, r.x - (from.x + from.w), from.x - (r.x + r.w));
    const sideCenter = dx ? Math.abs(cy - fy) : Math.abs(cx - fx);
    // Hors du cône d'environ 60° autour de la direction : pas un voisin (fin de rangée : on reste sur place).
    if (side > 0 && centerAlong * 2 < sideCenter) return;
    const score = Math.max(0, along) + side * 6 + sideCenter * 0.05;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
// Noms des boutons montrés à la place des touches quand on joue à la manette.
const LABELS = Object.freeze({
  e: 'A',
  ' ': 'B',
  1: 'X',
  2: 'Y',
  3: 'LB',
  4: 'RB',
  f: '↑',
  q: '↓',
  m: '←',
  i: '→',
  escape: 'Start'
});
/** Bouton de la manette qui fait l'action d'une touche (minuscule), ou null. */
export function padLabel(key) {
  return Object.hasOwn(LABELS, key) ? LABELS[key] : null;
}
