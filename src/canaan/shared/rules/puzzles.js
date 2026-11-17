// @ts-check
// Règles des énigmes des quêtes : état de départ et état résolu de chaque énigme, rochers du monde à l'envers,
// glissement du bateau dans le bassin, chemin de l'eau de l'aqueduc, lanternes du marais, trajet du mouton, rayon
// des miroirs et générateur aléatoire à graine (placement fixe des lieux).
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches. L'hôte
// s'en sert pour vérifier les actions des invités ; scripts/quests.js garde les lieux, les objets et le dessin.
import { PUZZLE_ANSWER, PUZZLE_BASIN, PUZZLE_CONSTELLATION, PUZZLE_MIRROR_LEVERS } from '../data/puzzles.js';

/** @typedef {[number, number]} Cell case relative au lieu de la quête */

/**
 * État de départ de toutes les énigmes (chapitres I à VI).
 * @returns {Record<string, any>}
 */
export function puzzleFreshStates() {
  return {
    q1: { seq: [] },
    q2: { p: [1, 2, 0] },
    q3: { g: [1, 1, 0], run: null, top: false },
    q5: { gold: -1, until: 0, next: 0 },
    q6: { seq: [] },
    q7: { m: [0, 0, 0] },
    q11: { v: [0, 0, 0] },
    q12: { f: [3, 4, 0, 2] },
    q13: { pl: [3, 3, 3, 3] },
    q15: { pads: [] },
    q16: { pos: [-1, -1, -1, -1], hold: {} },
    q17: { p: [0, 0, 0, 0] },
    q18: { t: 0 },
    q19: { g: [0, 0, 0] },
    q21: { o: [2, 0, 1] },
    q22: { r: [3, 1, 4] },
    q23: { b: [...PUZZLE_BASIN.start] },
    q24: { m: [2, 2, 2, 1] },
    q25: { g: [0, 0, 0] },
    q27: { on: false, wave: 0, hp: [100, 100, 100, 100, 100, 100], next: 0 },
    q28: { l: [0, 0, 0] },
    q29: { h: [2, 0, 3, 1], fly: null },
    q30: { seq: 0, last: {} }
  };
}

/** @type {Record<string, () => Record<string, any>>} */
const SOLVED = {
  q2: () => ({ p: [0, 1, 2] }),
  q3: () => ({ g: [0, 0, 1], run: null, top: true }),
  q7: () => ({ m: [2, 2, 0] }),
  q11: () => ({ v: [2, 0, 1] }),
  q12: () => ({ f: [0, 1, 2, 3] }),
  q13: () => ({ pl: [1, 0, 2, 1] }),
  q16: () => ({ pos: [0, 1, 2, 3], hold: {} }),
  q17: () => ({ p: [...PUZZLE_ANSWER.q17] }),
  q19: () => ({ g: [...PUZZLE_ANSWER.q19] }),
  q21: () => ({ o: [...PUZZLE_ANSWER.q21] }),
  q22: () => ({ r: [0, 0, 0] }),
  q23: () => ({ b: [...PUZZLE_BASIN.dock] }),
  q24: () => ({ m: [0, 0, 0, 1] }),
  q25: () => ({ g: [...PUZZLE_ANSWER.q25] }),
  q28: () => ({ l: [0, 1, 1] }),
  q29: () => ({ h: [...PUZZLE_ANSWER.q29], fly: null }),
  q30: () => ({ seq: PUZZLE_CONSTELLATION.length })
};
/**
 * État d'une énigme résolue (un lieu déjà résolu dans le monde se montre ainsi), ou null si elle n'en a pas.
 * @param {string} id lieu de quête (q2, q7…)
 * @returns {Record<string, any> | null}
 */
export function puzzleSolvedState(id) {
  return Object.hasOwn(SOLVED, id) ? SOLVED[id]() : null;
}

/**
 * Générateur aléatoire à graine (mulberry32) : même suite de nombres dans [0, 1[ pour une même graine.
 * @param {number} n graine
 * @returns {() => number}
 */
export function seededRandom(n) {
  let h = n >>> 0;
  return () => {
    h += 0x6d2b79f5;
    let r = Math.imul(h ^ (h >>> 15), 1 | h);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Rochers du monde à l'envers (quête 28) : tous les rochers des colonnes 3 à 5 au départ.
/** @type {Cell[]} */
const MIRROR_ROCKS = [];
for (const x of [3, 4, 5]) for (let y = -2; y <= 2; y++) MIRROR_ROCKS.push([x, y]);
export const PUZZLE_MIRROR_ROCKS = Object.freeze(MIRROR_ROCKS.map(p => Object.freeze(p)));
/**
 * Rochers présents selon les leviers : chaque levier abaissé bascule les siens.
 * @param {ReadonlyArray<unknown>} levers
 * @returns {Set<string>} cases « x,y » où se trouve un rocher
 */
export function puzzleMirrorRocks(levers) {
  const on = new Set(MIRROR_ROCKS.map(p => p.join()));
  levers.forEach((down, i) => {
    if (down)
      for (const p of PUZZLE_MIRROR_LEVERS[i]) on.has(p.join()) ? on.delete(p.join()) : on.add(p.join());
  });
  return on;
}

/**
 * Bateau poussé dans le bassin (quête 23) : il glisse jusqu'à un bord ou un rocher.
 * @param {readonly number[]} pos position [x, y]
 * @param {readonly number[]} dir direction [dx, dy]
 * @returns {Cell}
 */
export function puzzleBasinSlide(pos, dir) {
  let [x, y] = pos;
  const [dx, dy] = dir;
  for (let n = 0; n < 8; n++) {
    const nx = x + dx,
      ny = y + dy;
    if (
      nx < PUZZLE_BASIN.x0 ||
      nx > PUZZLE_BASIN.x1 ||
      ny < PUZZLE_BASIN.y0 ||
      ny > PUZZLE_BASIN.y1 ||
      PUZZLE_BASIN.rocks.some(([rx, ry]) => rx === nx && ry === ny)
    )
      break;
    x = nx;
    y = ny;
  }
  return [x, y];
}

/**
 * Chemin de l'eau de l'aqueduc (quête 25) selon les trois portes : il finit dans le bassin ou par une fuite.
 * @param {ReadonlyArray<unknown>} gates
 * @returns {string[]} étapes (src, a, b, c, puis basin ou leakA / leakB / leakC)
 */
export function puzzleAqueduct(gates) {
  const path = ['src', 'a'];
  if (!gates[0]) return [...path, 'leakA'];
  path.push('b');
  if (gates[1]) return [...path, 'leakB'];
  path.push('c');
  return gates[2] ? [...path, 'basin'] : [...path, 'leakC'];
}

/**
 * Lanternes du marais (quête 11) allumées selon les trois vannes (0 à 2).
 * @param {readonly number[]} valves
 * @returns {boolean[]}
 */
export function puzzleLanterns(valves) {
  return [
    valves[0] === 2,
    (valves[0] + valves[1]) % 3 === 2,
    (valves[1] + valves[2]) % 3 === 1,
    (valves[2] * 2 + valves[0]) % 3 === 1
  ];
}

/**
 * Trajet du mouton de Milo (quête 3) : il suit le chemin ouvert à chaque carrefour.
 * @param {ReadonlyArray<unknown>} gates
 * @returns {{ nodes: string[], top: boolean }} carrefours traversés, et s'il atteint le sommet
 */
export function puzzleSheepPath(gates) {
  const nodes = ['pen', 'j1'];
  if (gates[0]) nodes.push('d1');
  else {
    nodes.push('j2');
    if (gates[1]) nodes.push('d2');
    else if (gates[2]) nodes.push('t1', 'top');
  }
  return { nodes, top: nodes.at(-1) === 'top' };
}

/**
 * Rayon de lumière renvoyé par les miroirs (quêtes 7 et 24) : il part de la pierre solaire et tourne sur chaque
 * miroir selon son orientation (0 et 2 : renvoi ; 1 et 3 : bloqué) jusqu'à la cible ou au bord.
 * @param {{ sun: readonly number[], dir: readonly number[], target: readonly number[], bound: readonly number[] }} cfg
 * @param {ReadonlyArray<{ dx: number, dy: number, i: number }>} mirrors miroirs du lieu
 * @param {readonly number[]} states orientation de chaque miroir
 * @returns {{ pts: number[][], lit: boolean }} points du rayon, et si la cible est atteinte
 */
export function puzzleBeam(cfg, mirrors, states) {
  const pts = [[...cfg.sun]];
  let [x, y] = cfg.sun,
    [dx, dy] = cfg.dir;
  for (let n = 0; n < 24; n++) {
    x += dx;
    y += dy;
    if (Math.abs(x) > cfg.bound[0] || Math.abs(y) > cfg.bound[1]) break;
    if (x === cfg.target[0] && y === cfg.target[1]) {
      pts.push([x, y]);
      return { pts, lit: true };
    }
    const m = mirrors.find(o => o.dx === x && o.dy === y);
    if (!m) continue;
    pts.push([x, y]);
    const s = states[m.i];
    if (s === 1 || s === 3) return { pts, lit: false };
    [dx, dy] = s === 0 ? [-dy, -dx] : [dy, dx];
  }
  pts.push([x, y]);
  return { pts, lit: false };
}
