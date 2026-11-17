// Transitions de terrain de l'île, au même rendu que les routes (world-roads.js) : plus aucun escalier de cases.
// Chaque niveau de terrain (eau, sable, herbe du marais, feuilles d'automne, herbe, sous-bois) forme un champ lissé
// (B-spline quadratique) à partir des cases voisines ; en chaque bloc de 2 px, le niveau le plus haut dont le champ
// dépasse un seuil bousculé par un bruit fractal l'emporte. Les limites ondulent donc librement de part et d'autre
// des bords de cases : rivages, lisières, mares et esplanades deviennent organiques.
// - Relief : le terrain le plus haut a un talus éclairé en haut à gauche et projette son ombre sur le terrain d'en bas.
// - Eau : l'eau animée est dessinée sous le sol (drawWorldGround) ; ici, les pixels d'eau restent transparents, avec
//   un liseré d'écume, et la terre qui les borde est plus sombre (berge humide).
// Seules les cases de bord sont calculées (les autres gardent leur texture), à l'avance quand le navigateur a du temps
// libre, et gardées dans un cache ; sans canevas (tests), l'ancien rendu (débords dentelés) sert.
(() => {
  'use strict';
  const S = 48,
    B = 24;
  const LX = -0.6,
    LY = -0.8;
  // Niveau de chaque terrain qui se fond dans ses voisins ; toutes les eaux sont au même niveau (0).
  const LEVEL = { 0: 0, 15: 0, 18: 0, 3: 1, 11: 2, 16: 3, 1: 4, 10: 4, 5: 5, 17: 5 };
  const WATER = new Set([0, 15, 18]);
  const OTHER = 99;
  // Teinte de chaque eau quand elle déborde sur une case de l'autre eau.
  const WATER_TINT = { 0: [26, 80, 122], 15: [60, 132, 128], 18: [56, 60, 150] }; // roche, route, bâtiment : compte comme « plus haut » pour tous les niveaux
  const kit = () => window.CANAAN_GROUND_KIT;
  const bridge = (x, y) => BRIDGE_TILES.has(y * MAPW + x);
  // Palissade et emprises de la cité elfique : elles se fondent comme le sol de leur biome (les troncs sont un décor).
  const groundAt = (x, y) => {
    const t = tileAt(x, y);
    return t === CANAAN_WOOD_TILE ? (CANAAN_WOOD_GROUND.get(y * MAPW + x) ?? 1) : t;
  };
  function levelAt(x, y) {
    if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return 0;
    if (bridge(x, y)) return 0;
    const l = LEVEL[groundAt(x, y)];
    return l === undefined ? OTHER : l;
  }
  // Eau à dessiner sous une case (la sienne, ou celle d'une voisine si la case borde l'eau) ; -1 : aucune.
  let underFor = null,
    underBridges = -1,
    under = null;
  function waterUnder(x, y) {
    if (underFor !== game.world.tiles || underBridges !== BRIDGE_TILES.size) {
      under = new Int8Array(MAPW * MAPH).fill(-2);
      underFor = game.world.tiles;
      underBridges = BRIDGE_TILES.size;
    }
    const k = y * MAPW + x;
    if (under[k] !== -2) return under[k];
    let w = -1;
    const t = groundAt(x, y);
    if (WATER.has(t) && !bridge(x, y)) w = t;
    // Pont, route ou terre au bord de l'eau : l'eau des cases voisines passe dessous.
    else if (LEVEL[t] !== undefined || bridge(x, y) || t === 2)
      for (let j = -1; j <= 1 && w < 0; j++)
        for (let i = -1; i <= 1 && w < 0; i++) {
          const n = groundAt(x + i, y + j);
          if (WATER.has(n) && !bridge(x + i, y + j)) w = n;
        }
    under[k] = w;
    return w;
  }
  // Une case de bord : ses voisins n'ont pas tous son niveau.
  function paint(tx, ty, v) {
    const K = kit();
    if (!K?.active()) return null;
    const lv = new Int16Array(9),
      own = levelAt(tx, ty);
    if (own === OTHER || own === undefined) return null;
    const levels = new Set([own]),
      // Sur une case d'eau, une route voisine compte comme de l'eau : c'est la route qui dessine son propre bord.
      wetHere = own === 0 && !bridge(tx, ty),
      lvl = (x, y) => (wetHere && groundAt(x, y) === 2 && !bridge(x, y) ? 0 : levelAt(x, y));
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const l = lvl(tx + i, ty + j);
        lv[(j + 1) * 3 + i + 1] = l;
        if (l !== OTHER) levels.add(l);
      }
    // Mer et eau peu profonde (marais, lacs) côte à côte : limite organique par une teinte translucide sur l'eau animée.
    const ownT = WATER.has(groundAt(tx, ty)) && !bridge(tx, ty) ? groundAt(tx, ty) : -1;
    let shallowT = -1,
      seaNear = false;
    const wocc = new Float32Array(9);
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const u = groundAt(tx + i, ty + j),
          isW = WATER.has(u) && !bridge(tx + i, ty + j);
        if (isW && u !== 0) shallowT = u;
        if (isW && u === 0) seaNear = true;
        wocc[(j + 1) * 3 + i + 1] = isW ? (u === 0 ? 0 : 1) : ownT === 0 ? 0 : 1;
      }
    const mixed = ownT >= 0 && shallowT >= 0 && seaNear;
    if (levels.size < 2 && !mixed) return null;
    const order = [...levels].sort((a, b) => a - b),
      n = order.length;
    // Terrain qui représente chaque niveau : le plus présent autour (la case elle-même d'abord).
    const kind = order.map(l => {
      const t = groundAt(tx, ty);
      if (LEVEL[t] === l) return t;
      const count = {};
      let best = -1,
        most = 0;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const u = groundAt(tx + i, ty + j);
          if (LEVEL[u] !== l || bridge(tx + i, ty + j)) continue;
          count[u] = (count[u] || 0) + 1;
          if (count[u] > most) {
            most = count[u];
            best = u;
          }
        }
      return best < 0 ? (l === 0 ? 0 : 1) : best;
    });
    const tex = kind.map(t => (WATER.has(t) ? null : K.terrainData(t) || K.terrainData(1)));
    // Présence de chaque niveau (au-dessus du plus bas) dans les 3 × 3 cases.
    const occ = [];
    for (let k = 1; k < n; k++) occ.push(lv.map(l => (l >= order[k] ? 1 : 0)));
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d'),
      img = g.createImageData(S, S),
      out = img.data,
      f = new Float32Array(n),
      gx = new Float32Array(n),
      gy = new Float32Array(n),
      Q = K.Q,
      DQ = K.DQ,
      { fbm, vnoise, smooth, ih } = K;
    for (let by = 0; by < B; by++)
      for (let bx = 0; bx < B; bx++) {
        const wx = tx * S + bx * 2 + 1,
          wy = ty * S + by * 2 + 1,
          thr = 0.5 + (fbm(wx / 38, wy / 38, 201) - 0.5) * 0.4 + (vnoise(wx / 8, wy / 8, 202) - 0.5) * 0.08;
        let win = 0;
        for (let k = 1; k < n; k++) {
          const o = occ[k - 1];
          let a = 0,
            ax = 0,
            ay = 0;
          // Seules les cases voisines immédiates comptent (le support de la B-spline fait 1,5 case).
          for (let j = 0; j < 3; j++) {
            const qy = Q[by * 5 + j + 1],
              dqy = DQ[by * 5 + j + 1];
            for (let i = 0; i < 3; i++) {
              if (!o[j * 3 + i]) continue;
              const qx = Q[bx * 5 + i + 1];
              a += qx * qy;
              ax += DQ[bx * 5 + i + 1] * qy;
              ay += qx * dqy;
            }
          }
          f[k] = a;
          gx[k] = ax / S;
          gy[k] = ay / S;
          if (a > thr) win = k;
        }
        // Distance au bord (en pixels) et direction vers l'intérieur, pour le niveau gagnant et celui du dessus.
        const dist = k => {
          const gl = Math.hypot(gx[k], gy[k]);
          return gl > 0.0015 ? (f[k] - thr) / gl : f[k] > thr ? 60 : -60;
        };
        const lit = k => {
          const gl = Math.hypot(gx[k], gy[k]);
          return gl > 0.0015 ? (gx[k] * LX + gy[k] * LY) / gl : 0;
        };
        let r = 0,
          gr = 0,
          b = 0,
          a = 255,
          shade = 1;
        if (!tex[win]) {
          // Eau : transparente (l'eau animée est dessous), liseré d'écume contre la rive.
          a = 0;
          if (mixed) {
            let w = 0;
            for (let j = 0; j < 3; j++)
              for (let i = 0; i < 3; i++) if (wocc[j * 3 + i]) w += Q[bx * 5 + i + 1] * Q[by * 5 + j + 1];
            const shallow = w > thr;
            if (shallow !== (ownT !== 0)) {
              const tint = shallow ? WATER_TINT[shallowT] : WATER_TINT[0];
              r = tint[0];
              gr = tint[1];
              b = tint[2];
              a = 200;
            }
          }
          if (n > 1) {
            const d = dist(1);
            if (d > -3.5) {
              r = 232;
              gr = 246;
              b = 240;
              a = Math.round(255 * 0.42 * (1 + d / 3.5));
              if (ih(wx >> 1, wy >> 1, 203) > 0.75) a = Math.round(a * 0.4);
            }
          }
        } else {
          if (win > 0) {
            const d = dist(win);
            if (d < 5) {
              if (!tex[win - 1]) shade *= 0.74 + 0.26 * smooth(0, 5, d);
              else shade *= 1 - 0.2 * lit(win) * (1 - d / 5);
            }
          }
          if (win + 1 < n) {
            const d = dist(win + 1),
              l = lit(win + 1);
            if (d > -6 && l > 0) shade *= 1 - 0.26 * l * (1 + d / 6);
          }
        }
        for (let q = 0; q < 4; q++) {
          const px = bx * 2 + (q & 1),
            py = by * 2 + (q >> 1),
            o = (py * S + px) * 4;
          if (tex[win]) {
            const s = (py * 192 + v * S + px) * 4,
              t = tex[win];
            out[o] = t[s] * shade;
            out[o + 1] = t[s + 1] * shade;
            out[o + 2] = t[s + 2] * shade;
            out[o + 3] = 255;
          } else {
            out[o] = r;
            out[o + 1] = gr;
            out[o + 2] = b;
            out[o + 3] = a;
          }
        }
      }
    g.putImageData(img, 0, 0);
    return c;
  }
  // Cache des cases peintes (null : case sans bord, texture ordinaire), vidé quand l'île change.
  const KEEP = 3200;
  let cache = new Map(),
    cacheFor = null,
    cacheBridges = -1;
  function fresh() {
    if (cacheFor !== game.world.tiles || cacheBridges !== BRIDGE_TILES.size) {
      cache = new Map();
      cacheFor = game.world.tiles;
      cacheBridges = BRIDGE_TILES.size;
    }
  }
  function tile(x, y, v) {
    fresh();
    const id = y * 4096 + x;
    if (cache.has(id)) {
      const img = cache.get(id);
      cache.delete(id);
      cache.set(id, img);
      return img;
    }
    const img = paint(x, y, v);
    cache.set(id, img);
    if (cache.size > KEEP) cache.delete(cache.keys().next().value);
    return img;
  }
  // Préparation d'avance (temps libre) : vrai quand toutes les cases du rectangle sont prêtes.
  function warm(x0, y0, x1, y1, deadline) {
    if (!active()) return true;
    fresh();
    for (let y = Math.max(0, y0); y < Math.min(MAPH, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(MAPW, x1); x++) {
        if (cache.has(y * 4096 + x)) continue;
        if (performance.now() > deadline) return false;
        tile(x, y, (x * 7 + y * 13) & 3);
      }
    return true;
  }
  // Roche : les côtés et le haut d'un massif ondulent sur le terrain voisin (contour sombre, ombre portée) ; le pied
  // de la falaise reste droit. drawRock(g) peint la case de roche ordinaire à l'origine.
  const ROCK_EDGE = [34, 38, 44];
  let rocks = new Map(),
    rocksFor = null;
  function paintRock(tx, ty, v, drawRock) {
    const K = kit();
    if (!K?.active()) return null;
    const occ = new Uint8Array(9);
    let open = false,
      best = -1,
      most = 0;
    const count = {};
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const u = groundAt(tx + i, ty + j),
          land = LEVEL[u] !== undefined && !WATER.has(u) && !bridge(tx + i, ty + j);
        occ[(j + 1) * 3 + i + 1] = j === 1 || !land ? 1 : 0;
        if (land && j < 1) {
          if (i === 0 || j === 0) open = true;
          count[u] = (count[u] || 0) + 1;
          if (count[u] > most) {
            most = count[u];
            best = u;
          }
        }
      }
    if (!open) return null;
    const ground = K.terrainData(best) || K.terrainData(1),
      src = document.createElement('canvas');
    src.width = src.height = S;
    const sg = src.getContext('2d');
    drawRock(sg);
    let rockPx;
    try {
      rockPx = sg.getImageData(0, 0, S, S).data;
    } catch (e) {
      return null;
    }
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d'),
      img = g.createImageData(S, S),
      out = img.data,
      { Q, DQ, fbm, vnoise } = K;
    for (let by = 0; by < B; by++)
      for (let bx = 0; bx < B; bx++) {
        let f = 0,
          fx = 0,
          fy = 0;
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 3; i++) {
            if (!occ[j * 3 + i]) continue;
            const qx = Q[bx * 5 + i + 1],
              qy = Q[by * 5 + j + 1];
            f += qx * qy;
            fx += DQ[bx * 5 + i + 1] * qy;
            fy += qx * DQ[by * 5 + j + 1];
          }
        const wx = tx * S + bx * 2 + 1,
          wy = ty * S + by * 2 + 1,
          thr = 0.5 + (fbm(wx / 30, wy / 30, 211) - 0.5) * 0.36 + (vnoise(wx / 6, wy / 6, 212) - 0.5) * 0.1,
          gl = Math.hypot(fx, fy) / S,
          d = gl > 0.0015 ? (f - thr) / gl : f > thr ? 60 : -60,
          lit = gl > 0.0015 ? (fx * LX + fy * LY) / S / gl : 0;
        for (let q = 0; q < 4; q++) {
          const px = bx * 2 + (q & 1),
            py = by * 2 + (q >> 1),
            o = (py * S + px) * 4;
          if (d >= 0) {
            const edge = d < 2.5;
            out[o] = edge ? ROCK_EDGE[0] : rockPx[o];
            out[o + 1] = edge ? ROCK_EDGE[1] : rockPx[o + 1];
            out[o + 2] = edge ? ROCK_EDGE[2] : rockPx[o + 2];
          } else {
            // Ombre de la roche sur le sol, du côté opposé à la lumière.
            const s0 = (py * 192 + v * S + px) * 4,
              shade = lit > 0 && d > -8 ? 1 - 0.35 * lit * (1 + d / 8) : 1;
            out[o] = ground[s0] * shade;
            out[o + 1] = ground[s0 + 1] * shade;
            out[o + 2] = ground[s0 + 2] * shade;
          }
          out[o + 3] = 255;
        }
      }
    g.putImageData(img, 0, 0);
    return c;
  }
  function rock(x, y, v, drawRock) {
    if (rocksFor !== game.world.tiles) {
      rocks = new Map();
      rocksFor = game.world.tiles;
    }
    const id = y * 4096 + x;
    if (rocks.has(id)) return rocks.get(id);
    const img = paintRock(x, y, v, drawRock);
    rocks.set(id, img);
    if (rocks.size > 1500) rocks.delete(rocks.keys().next().value);
    return img;
  }
  const active = () => !!kit()?.active();
  window.CANAAN_BLEND = Object.freeze({ tile, warm, waterUnder, active, rock });
})();
