// Histoire « Les Échos de l'Aurore » et quêtes (shared/data/quests.js, shared/rules/quests.js).
// - Lieux : posés sur l'île après sa génération (mêmes cases chez chacun), avec leurs énigmes, PNJ et objets.
// - Progression personnelle (hero.quetes, sauvegardée) : quêtes actives et étapes, terminées, drapeaux, décorations,
//   choix ; l'état des énigmes et les changements du monde (pont, lanternes, sanctuaires) sont partagés
//   (monde.quetes, sauvegardé par l'hôte). Une énigme résolue à plusieurs compte pour chaque héros qui l'a en cours.
// - Touche E : parler aux PNJ et agir sur les énigmes ; touche L : journal (histoire, secondaires, terminées).
// - En ligne : l'hôte décide de tout ; un invité demande ses actions (quest-*) et reçoit sa progression et l'état
//   des lieux.
(() => {
  'use strict';
  const T = TS;
  const SITES = {};
  const NPCS = {};
  // Passage dans les lieux : case → fonction (vrai : praticable, faux : bloqué).
  const WALK = new Map();
  const tileKey = (tx, ty) => ty * MAPW + tx;
  const now = () => time;
  const guest = () => game.mode === 'guest';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fresh = () => ({ active: {}, done: {}, flags: {}, deco: [], choices: {}, track: null });
  const stateOf = hero => (hero.quetes ??= fresh());
  // État du monde : drapeaux (pont, lanternes, sanctuaires ouverts…) et énigmes résolues.
  let qworld = { flags: {}, solved: {} };
  // État vivant des énigmes partagées (non sauvegardé, sauf ce qui est résolu).
  let ST = {};
  let version = 1;
  const changed = () => version++;

  // ---------------------------------------------------------------- Placement des lieux
  const px = (site, dx) => (site.x + dx + 0.5) * T;
  const py = (site, dy) => (site.y + dy + 0.5) * T;
  // Pose une case du lieu ; une route ou un pont de l'île ne sont jamais recouverts (renvoie false).
  function setTile(x, y, t, deco = null) {
    if (x < 3 || y < 3 || x >= MAPW - 3 || y >= MAPH - 3) return false;
    if (t !== 2 && (game.world.overworld[y][x] === 2 || BRIDGE_TILES.has(y * MAPW + x))) return false;
    game.world.overworld[y][x] = t;
    game.world.overdecor[y][x] = deco;
    return true;
  }
  // Haie du labyrinthe.
  const hedge = (site, dx, dy) => wall(site, dx, dy, ZONES[1].t, 'bush');
  // Mur, arbre ou rocher qui bloque le passage, sauf s'il tombe sur une route.
  function wall(site, dx, dy, t, deco = null) {
    if (setTile(site.x + dx, site.y + dy, t, deco)) solid(site, dx, dy);
  }
  function solid(site, dx, dy, fn = () => false) {
    WALK.set(tileKey(site.x + dx, site.y + dy), fn);
  }
  function addObj(site, id, kind, dx, dy, extra = {}) {
    const o = { id, kind, dx, dy, x: px(site, dx), y: py(site, dy), ...extra };
    site.objs.push(o);
    if (extra.solid) solid(site, dx, dy, typeof extra.solid === 'function' ? extra.solid : () => false);
    return o;
  }
  // Case praticable la plus proche d'un décalage (pour les objets hors de la clairière).
  function walkableNear(site, dx, dy, tools) {
    const tx = site.x + dx,
      ty = site.y + dy;
    for (let r = 0; r <= 4; r++)
      for (let y = ty - r; y <= ty + r; y++)
        for (let x = tx - r; x <= tx + r; x++)
          if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) === r && tools.walkableLand(x, y)) return [x - site.x, y - site.y];
    return [dx, dy];
  }
  function roomy(tools, x, y, r) {
    let ok = 0,
      all = 0;
    for (let yy = y - r; yy <= y + r; yy++)
      for (let xx = x - r; xx <= x + r; xx++) {
        if (Math.hypot(xx - x, yy - y) > r) continue;
        all++;
        if (tools.valid(xx, yy) && ![0, 4].includes(game.world.overworld[yy][xx])) ok++;
      }
    return ok / all > 0.7;
  }
  // Clairière du lieu : sol de la zone, sans décor ; les routes et les ponts restent en place.
  function clearSite(site, r, tools) {
    for (let y = site.y - r; y <= site.y + r; y++)
      for (let x = site.x - r; x <= site.x + r; x++) {
        if (!tools.valid(x, y) || Math.hypot(x - site.x, y - site.y) > r + 0.4 || BRIDGE_TILES.has(y * MAPW + x)) continue;
        if (game.world.overworld[y][x] !== 2) game.world.overworld[y][x] = ZONES[site.zone].t;
        game.world.overdecor[y][x] = null;
      }
  }
  function place() {
    const tools = CANAAN_WORLD_TOOLS,
      camp = CANAAN_CAMP,
      reach = tools.reachableFrom(camp.x, camp.y),
      taken = tools.taken();
    for (const [id, def] of Object.entries(QUEST_SITES)) {
      let target,
        free = true;
      if (def.camp) target = { x: camp.x + def.camp[0], y: camp.y + def.camp[1] };
      else if (def.place) {
        const p = PIXEL_PLACES.find(p => p.name === def.place);
        target = { x: p.x + def.offset[0], y: p.y + def.offset[1] };
        free = false;
      } else target = tools.polar(def.polar[0], def.polar[1]);
      const accept = (x, y) =>
        tools.walkableLand(x, y) &&
        reach[y * MAPW + x] === 1 &&
        !isSafe(x, y) &&
        roomy(tools, x, y, def.r) &&
        (!free || !taken.some(([a, b]) => Math.hypot(a - x, b - y) < def.r + 5));
      const spot = tools.nearestSpot(target.x, target.y, def.zone, accept);
      const site = { id, x: spot.x, y: spot.y, zone: def.zone, r: def.r, objs: [], quest: QUESTS.find(q => q.site === id) };
      SITES[id] = site;
      taken.push([site.x, site.y]);
      clearSite(site, def.r + (id === 'q8' ? 1 : 0), tools);
      BUILD[id](site, tools);
    }
    for (const [id, def] of Object.entries(QUEST_NPCS)) {
      const site = SITES[def.site];
      let at = def.at || [0, 0];
      if (def.camp) at = [camp.x + def.camp[0] - site.x, camp.y + def.camp[1] - site.y];
      const [dx, dy] = walkableNear(site, at[0], at[1], tools);
      NPCS[id] = { id, def, x: px(site, dx), y: py(site, dy), face: 0, quest: QUESTS.find(q => q.npc === id), site };
    }
    // Pierre de passage du camp (raccourci de la quête 8), au bord de la clairière.
    const w = tools.nearestSpot(camp.x - 4, camp.y - 9, 0, (x, y) => tools.walkableLand(x, y));
    WAYSTONE.camp = { x: (w.x + 0.5) * T, y: (w.y + 0.5) * T };
  }
  const WAYSTONE = { camp: null, forest: null };

  // ---------------------------------------------------------------- Lieux et énigmes
  const ORDER_Q1 = ['soleil', 'pluie', 'vent', 'lune'];
  const SYMBOLS_Q2 = ['étoile', 'lune', 'flamme'];
  const SCENES_Q12 = [
    ['☀️', 'La paix', 'Les anciens chantent autour du Cœur de l’Aurore.'],
    ['🌑', 'La menace', 'Une ombre immense monte de la mer.'],
    ['✦', 'Le sacrifice', 'Le Cœur se brise en six étoiles.'],
    ['🕯️', 'L’espoir', 'Six sanctuaires s’allument sur l’île.'],
    ['🏃', 'La fuite', 'Les anciens s’enfuient et abandonnent l’île.']
  ];
  const SOLVED_STATE = {
    q2: () => ({ p: [0, 1, 2] }),
    q3: () => ({ g: [0, 0, 1], run: null, top: true }),
    q7: () => ({ m: [2, 2, 0] }),
    q11: () => ({ v: [2, 0, 1] }),
    q12: () => ({ f: [0, 1, 2, 3] }),
    q13: () => ({ pl: [1, 0, 2, 1] })
  };
  function freshStates() {
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
      q15: { pads: [] }
    };
  }
  ST = freshStates();
  const BUILD = {
    q1(site) {
      [['lune', 0, -2], ['soleil', 2, 0], ['pluie', 0, 2], ['vent', -2, 0]].forEach(([sym, dx, dy]) => addObj(site, 'p_' + sym, 'stone', dx, dy, { sym, solid: true }));
      addObj(site, 'stele', 'stele', -3, -2, { solid: true });
      addObj(site, 'crystal', 'crystal', 0, 0, { solid: true });
    },
    q2(site) {
      [['etoile', -4, -3], ['lune', 4, -2], ['flamme', 1, 4]].forEach(([s, dx, dy], i) => addObj(site, 'sym_' + s, 'relic', dx, dy, { sym: i }));
      [[0, -2], [-2, 0], [2, 0]].forEach(([dx, dy], i) => addObj(site, 'ped' + i, 'pedestal', dx, dy, { i, solid: true }));
    },
    q3(site) {
      const N = { pen: [-4, 3], j1: [-1, 3], d1: [3, 3], j2: [-1, 0], d2: [-1, -4], t1: [3, 0], top: [3, -4] };
      site.nodes = N;
      const line = (a, b) => {
        const [x0, y0] = N[a],
          [x1, y1] = N[b];
        for (let k = 0; k <= Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); k++)
          setTile(site.x + x0 + Math.sign(x1 - x0) * k, site.y + y0 + Math.sign(y1 - y0) * k, 2);
      };
      [['pen', 'j1'], ['j1', 'd1'], ['j1', 'j2'], ['j2', 'd2'], ['j2', 't1'], ['t1', 'top']].forEach(([a, b]) => line(a, b));
      addObj(site, 'gate0', 'gate', 1, 3, { i: 0, horiz: false });
      addObj(site, 'gate1', 'gate', -1, -2, { i: 1, horiz: true });
      addObj(site, 'gate2', 'gate', 1, 0, { i: 2, horiz: false });
      addObj(site, 'whistle', 'whistle', -4, 1, { solid: true });
      addObj(site, 'flag', 'hilltop', 4, -5, { solid: true });
    },
    q4(site) {
      for (const [dx, dy] of [[-4, -3], [4, -3], [-3, 4]]) {
        wall(site, dx, dy, ZONES[0].t, 'tree');
        site.objs.push({ id: 'tree' + dx, kind: 'shadowtree', dx, dy, x: px(site, dx), y: py(site, dy) });
      }
      addObj(site, 'dig', 'dig', 2, 1);
    },
    q5(site) {
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) < 2.3) setTile(site.x + x, site.y + y, 0);
      [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(([dx, dy], i) => addObj(site, 'ripple' + i, 'ripple', dx, dy, { i, range: 3.3 }));
    },
    q6(site, tools) {
      const pitch = [3, 1, 4, 2];
      [[0, -2], [2, 0], [0, 2], [-2, 0]].forEach(([dx, dy], i) => addObj(site, 'chime' + i, 'chime', dx, dy, { pitch: pitch[i], solid: true }));
      [[-9, -5], [8, -7], [9, 5], [-7, 8]].forEach(([dx, dy], i) => {
        const [x, y] = walkableNear(site, dx, dy, tools);
        addObj(site, 'mstone' + (i + 1), 'mstone', x, y, { pitch: i + 1 });
      });
      shrine(site, 'murmures');
    },
    q7(site) {
      addObj(site, 'sun', 'sun', -4, -2, { solid: true });
      [[-1, -2], [-1, 1], [2, 1]].forEach(([dx, dy], i) => addObj(site, 'mirror' + i, 'mirror', dx, dy, { i, solid: true }));
      wall(site, 2, -2, ZONES[1].t, 'bigtree');
      site.objs.push({ id: 'gtree', kind: 'gtree', dx: 2, dy: -2, x: px(site, 2), y: py(site, -2) });
    },
    q8(site) {
      // Labyrinthe de 7 × 7 cellules (15 × 15 cases), le même chez chacun.
      const rng = seededRng(4242),
        N = 15,
        maze = Array.from({ length: N }, () => Array(N).fill(true)),
        seen = new Set(),
        stack = [[3, 6]];
      seen.add('3,6');
      maze[13][7] = false;
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        maze[cy * 2 + 1][cx * 2 + 1] = false;
        const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
          const nx = cx + dx,
            ny = cy + dy;
          return nx >= 0 && ny >= 0 && nx < 7 && ny < 7 && !seen.has(nx + ',' + ny);
        });
        if (!next.length) {
          stack.pop();
          continue;
        }
        const [dx, dy] = next[Math.floor(rng() * next.length)];
        maze[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = false;
        seen.add(cx + dx + ',' + (cy + dy));
        stack.push([cx + dx, cy + dy]);
      }
      maze[0][7] = false;
      maze[14][7] = false;
      for (let v = 0; v < N; v++)
        for (let u = 0; u < N; u++) {
          const dx = u - 7,
            dy = v - 7;
          if (maze[v][u]) {
            hedge(site, dx, dy);
          } else setTile(site.x + dx, site.y + dy, 2);
        }
      // Chemin des lucioles (largeur d'abord, de l'entrée à la sortie) et panneaux trompeurs aux carrefours.
      const prev = new Map([['7,14', null]]),
        queue = [[7, 14]];
      while (queue.length) {
        const [u, v] = queue.shift();
        if (u === 7 && v === 0) break;
        for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nu = u + du,
            nv = v + dv;
          if (nu < 0 || nv < 0 || nu >= N || nv >= N || maze[nv][nu] || prev.has(nu + ',' + nv)) continue;
          prev.set(nu + ',' + nv, [u, v]);
          queue.push([nu, nv]);
        }
      }
      const path = [];
      for (let p = [7, 0]; p; p = prev.get(p[0] + ',' + p[1])) path.unshift(p);
      site.fireflies = path.filter((_, i) => i % 2 === 0).map(([u, v]) => [u - 7, v - 7]);
      const onPath = new Set(path.map(p => p.join(',')));
      site.signs = [];
      for (const [u, v] of path) {
        const exits = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([du, dv]) => !maze[v + dv]?.[u + du] && !onPath.has(u + du + ',' + (v + dv)));
        if (exits.length && site.signs.length < 6 && (u + v) % 3 === 0) site.signs.push({ dx: u - 7, dy: v - 7, dir: exits[0] });
      }
      addObj(site, 'waystone', 'waystone', 0, -9, { solid: true });
      WAYSTONE.forest = { x: px(site, 0), y: py(site, -8) };
    },
    q9(site) {
      addObj(site, 'sack', 'sack', -4, 4, { solid: true });
      addObj(site, 'thief', 'thief', 5, -4);
      const pts = [];
      for (let k = 0; k <= 26; k++) {
        const t = k / 26;
        pts.push([px(site, -3 + 8 * t) + Math.sin(t * 9) * 20, py(site, 4 - 8 * t) + Math.cos(t * 7) * 14]);
      }
      site.trail = pts;
    },
    q10(site) {
      wall(site, 0, 0, ZONES[1].t, 'bigtree');
      addObj(site, 'view', 'viewpoint', -1, -3);
      addObj(site, 'easel', 'easel', -2, 3, { solid: true });
    },
    q11(site) {
      [[-3, 2], [0, 2], [3, 2]].forEach(([dx, dy], i) => addObj(site, 'valve' + i, 'valve', dx, dy, { i, solid: true }));
      [[-3, -2], [-1, -3], [1, -3], [3, -2]].forEach(([dx, dy], i) => addObj(site, 'lantern' + i, 'lantern', dx, dy, { i, solid: true }));
      shrine(site, 'reflets');
    },
    q12(site) {
      for (let y = -2; y <= 1; y++) for (let x = -4; x <= 4; x++) setTile(site.x + x, site.y + y, 2);
      [-3, -1, 1, 3].forEach((dx, i) => addObj(site, 'frame' + i, 'frame', dx, -1, { i, solid: true }));
    },
    q13(site) {
      for (let y = -6; y <= 6; y++) for (let x = -2; x <= 1; x++) if (Math.hypot(x, y) < 6.4) setTile(site.x + x, site.y + y, 0);
      [-2, -1, 0, 1].forEach((dx, i) => {
        addObj(site, 'plank' + i, 'plank', dx, 0, { i, range: 2.4 });
        solid(site, dx, 0, () => !!qworld.flags.bridge);
      });
    },
    q14(site) {
      for (const c of GHOST_CLUES) addObj(site, 'clue_' + c.id, c.who ? 'witness' : 'clue', c.at[0], c.at[1], { clue: c.id, solid: !c.who });
    },
    q15(site) {
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 5; x++) if (!(x >= 3 && x <= 4 && y >= -1 && y <= 0)) setTile(site.x + x, site.y + y, 0);
      const pads = [[-3, 0], [-2, 0], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [2, 0]];
      ST.q15.pads = pads.map(() => ({ t: 0, sunk: 0 }));
      site.pads = pads;
      pads.forEach(([dx, dy], i) => solid(site, dx, dy, () => !ST.q15.pads[i].sunk));
      addObj(site, 'chest', 'islechest', 4, -1, { solid: true });
      site.start = [-4, 0];
    }
  };
  // Sanctuaire : alcôve de rochers fermée par une porte de pierre, autel au fond (au nord du lieu).
  function shrine(site, id) {
    const s = SANCTUARIES.find(s => s.id === id);
    for (const [dx, dy] of [[-1, -4], [1, -4], [-1, -5], [1, -5], [-1, -6], [1, -6], [0, -7]]) {
      wall(site, dx, dy, ZONES[site.zone].t, 'rock');
    }
    addObj(site, 'door', 'door', 0, -4, { solid: () => !!qworld.flags['sanct_' + id], sanct: id });
    addObj(site, 'shrine', 'shrine', 0, -6, { solid: true, sanct: id, name: s.name });
  }
  function seededRng(n) {
    let h = n >>> 0;
    return () => {
      h += 0x6d2b79f5;
      let r = Math.imul(h ^ (h >>> 15), 1 | h);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  canaanQuestWalk = (x, y) => {
    if (game.world.instance) return null;
    const f = WALK.get(tileKey(Math.floor(x / T), Math.floor(y / T)));
    return f ? f() : null;
  };

  // ---------------------------------------------------------------- Chapitres IV à VI : lieux et énigmes
  const VILLAGE_OBJS = [['enclume', '⚒️'], ['cloche', '🔔'], ['berceau', '🧺'], ['harpe', '🎵']];
  const HOUSES = ['puits', 'four', 'jardin', 'tour'];
  const SEASONS = [['🌸', 'Printemps'], ['☀️', 'Été'], ['🍂', 'Automne'], ['❄️', 'Hiver']];
  const GEARS = ['vide', 'petit', 'grand'];
  // Héros d'un objet porté (quête 16) : l'hôte, ou l'identifiant d'un invité.
  const keyOf = h => (h === game.hero ? (guest() ? CANAAN_NET.state().heroId : 'host') : h.id || 'host');
  const heroOfKey = k => game.heroes.find(h => keyOf(h) === k) || null;
  // Lieux de la fin de l'histoire : la clé de leur solution.
  const ANSWER = {
    q17: [3, 0, 1, 2],
    q19: [2, 1, 2],
    q21: [1, 3, 0],
    q25: [1, 0, 1],
    q29: [0, 1, 2, 3]
  };
  // Constellation du lac (quête 30) : pierres dans l'ordre où leurs étoiles s'allument.
  const CONSTELLATION = [[-2, -1], [0, -2], [1, 0], [0, 1], [2, 1]];
  // Leviers du monde à l'envers (quête 28) : chaque levier bascule des rochers de l'autre clairière (inversés).
  const MIRROR_LEVERS = [
    [[4, 1], [4, -2], [3, 0], [5, 1]],
    [[4, 1], [5, 2], [5, 0]],
    [[5, -2], [3, 1], [4, 2], [5, 1]]
  ];
  const MIRROR_ROCKS = [];
  for (const x of [3, 4, 5]) for (let y = -2; y <= 2; y++) MIRROR_ROCKS.push([x, y]);
  // Rochers présents selon les leviers : tous au départ, chaque levier abaissé bascule les siens.
  function mirrorRocks(levers) {
    const on = new Set(MIRROR_ROCKS.map(p => p.join()));
    levers.forEach((down, i) => {
      if (down) for (const p of MIRROR_LEVERS[i]) on.has(p.join()) ? on.delete(p.join()) : on.add(p.join());
    });
    return on;
  }
  // Bassin du bateau (quête 23) : x de -3 à 2, y de -2 à 1 ; rochers ; quai en bas à droite.
  const BASIN = { x0: -3, x1: 2, y0: -2, y1: 1, rocks: [[-1, -2], [1, -1], [-2, 1], [0, 1]], dock: [2, 1], start: [-3, -2] };
  function slide(b, dir) {
    let [x, y] = b;
    const [dx, dy] = dir;
    for (let n = 0; n < 8; n++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < BASIN.x0 || nx > BASIN.x1 || ny < BASIN.y0 || ny > BASIN.y1 || BASIN.rocks.some(([rx, ry]) => rx === nx && ry === ny)) break;
      x = nx;
      y = ny;
    }
    return [x, y];
  }
  // Aqueduc de l'oasis (quête 25) : où va l'eau selon les trois portes.
  function aqueduct(g) {
    const path = ['src', 'a'];
    if (!g[0]) return [...path, 'leakA'];
    path.push('b');
    if (g[1]) return [...path, 'leakB'];
    path.push('c');
    return g[2] ? [...path, 'basin'] : [...path, 'leakC'];
  }
  const AQ = { src: [-5, -3], a: [-3, -3], leakA: [-3, 0], b: [0, -3], leakB: [0, -5], c: [0, 0], leakC: [-2, 2], basin: [3, 2] };
  // Rayon des miroirs : quête 7 (pierre solaire → arbre gardien) et quête 24 (→ porte du temple).
  const BEAMS = {
    q7: { sun: [-4, -2], dir: [1, 0], target: [2, -2], key: 'm', bound: [6, 5] },
    q24: { sun: [-4, 2], dir: [1, 0], target: [2, -4], key: 'm', bound: [6, 5] }
  };
  Object.assign(SOLVED_STATE, {
    q16: () => ({ pos: [0, 1, 2, 3], hold: {} }),
    q17: () => ({ p: [...ANSWER.q17] }),
    q19: () => ({ g: [...ANSWER.q19] }),
    q21: () => ({ o: [...ANSWER.q21] }),
    q22: () => ({ r: [0, 0, 0] }),
    q23: () => ({ b: [...BASIN.dock] }),
    q24: () => ({ m: [0, 0, 0, 1] }),
    q25: () => ({ g: [...ANSWER.q25] }),
    q28: () => ({ l: [0, 1, 1] }),
    q29: () => ({ h: [...ANSWER.q29], fly: null }),
    q30: () => ({ seq: CONSTELLATION.length })
  });
  function freshMore() {
    return {
    q16: { pos: [-1, -1, -1, -1], hold: {} },
    q17: { p: [0, 0, 0, 0] },
    q18: { t: 0 },
    q19: { g: [0, 0, 0] },
    q21: { o: [2, 0, 1] },
    q22: { r: [3, 1, 4] },
    q23: { b: [...BASIN.start] },
    q24: { m: [2, 2, 2, 1] },
    q25: { g: [0, 0, 0] },
    q27: { on: false, wave: 0, hp: [100, 100, 100, 100, 100, 100], next: 0 },
    q28: { l: [0, 0, 0] },
    q29: { h: [2, 0, 3, 1], fly: null },
    q30: { seq: 0, last: {} }
    };
  }
  Object.assign(ST, freshMore());
  Object.assign(BUILD, {
    q16(site) {
      [[-4, -2], [4, -2], [-4, 2], [4, 2]].forEach(([dx, dy], i) => addObj(site, 'house' + i, 'house', dx, dy, { i, solid: true }));
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy], i) => addObj(site, 'vobj' + i, 'vobj', dx, dy, { i }));
      for (const m of VILLAGE_MEMORIES) addObj(site, m.id, 'leaf', m.at[0], m.at[1], { what: m.what });
      shrine(site, 'saisons');
    },
    q17(site, tools) {
      [[0, -2], [2, 0], [0, 2], [-2, 0]].forEach(([dx, dy], i) => addObj(site, 'pillar' + i, 'pillar', dx, dy, { i, solid: true }));
      for (const f of FRESCO) {
        const [x, y] = walkableNear(site, f.at[0], f.at[1], tools);
        addObj(site, f.id, 'fresco', x, y, { what: f.what });
      }
      addObj(site, 'archive', 'archive', 0, -4, { solid: true });
    },
    q18(site) {
      addObj(site, 'vane', 'vane', -3, -3, { solid: true });
      site.leaf = { id: 'leaf18', kind: 'goldleaf', x: px(site, 0), y: py(site, 0), h: 1, range: 0.9 };
      site.objs.push(site.leaf);
    },
    q19(site) {
      addObj(site, 'wheel', 'waterwheel', -4, 0, { solid: true });
      addObj(site, 'mill', 'mill', 4, -1, { solid: true });
      solid(site, 4, 0);
      [-2, 0, 2].forEach((dx, i) => addObj(site, 'gear' + i, 'gear', dx, 0, { i, solid: true }));
    },
    q20(site) {
      for (let y = -6; y <= 6; y++) if (Math.hypot(3, y) < 6.4 && y !== 1) setTile(site.x + 3, site.y + y, 15);
      setTile(site.x + 3, site.y + 1, 2);
      wall(site, -5, -3, ZONES[3].t, 'autumn_red');
      for (const t of TRAVELERS) addObj(site, t.id, 'traveler', t.at[0], t.at[1], { who: t.who, what: t.what });
      [[2, -3, 'Grosse citrouille près du ruisseau', 'pumpkin'], [-4, -2, 'Grosse citrouille sous le chêne roux', 'pumpkin'], [3, 1, 'Sous le pont du ruisseau', 'bridge'], [-3, 3, 'Tas de feuilles', 'leaves']].forEach(([dx, dy, name, look], i) =>
        addObj(site, 'hide' + i, 'hide', dx, dy, { i, name, look, solid: look === 'pumpkin' })
      );
    },
    q21(site, tools) {
      [[-5, 0], [5, 0], [0, 5]].forEach(([dx, dy], i) => addObj(site, 'obelisk' + i, 'obelisk', dx, dy, { i, solid: true }));
      addObj(site, 'plate', 'starplate', 0, 0);
      shrine(site, 'etoiles');
    },
    q22(site) {
      [-2, 0, 2].forEach((dx, i) => addObj(site, 'ring' + i, 'ringlever', dx, 3, { i, solid: true }));
      for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) solid(site, dx, dy);
      site.objs.push({ id: 'machine', kind: 'machine', dx: 0, dy: 0, x: px(site, 0), y: py(site, 0) });
      addObj(site, 'treasure', 'treasure', 0, -3, { solid: true });
    },
    q23(site) {
      for (let y = BASIN.y0; y <= BASIN.y1; y++) for (let x = BASIN.x0; x <= BASIN.x1; x++) setTile(site.x + x, site.y + y, 0);
      site.objs.push({ id: 'basin', kind: 'basin', dx: 0, dy: 0, x: px(site, 0), y: py(site, 0) });
      [['fanW', -5, -1, [1, 0]], ['fanE', 4, -1, [-1, 0]], ['fanN', 0, -4, [0, 1]], ['fanS', 0, 3, [0, -1]]].forEach(([id, dx, dy, push]) => addObj(site, id, 'fan', dx, dy, { push, solid: true }));
      addObj(site, 'bell', 'bell', -5, 2, { solid: true });
    },
    q24(site) {
      addObj(site, 'sun', 'sun', -4, 2, { solid: true });
      [[-1, 2], [-1, -2], [2, -2], [2, 2]].forEach(([dx, dy], i) => addObj(site, 'mirror' + i, 'mirror', dx, dy, { i, solid: true }));
      addObj(site, 'tdoor', 'templedoor', 2, -4, { solid: true });
      for (const dx of [0, 1, 3, 4]) wall(site, dx, -4, ZONES[4].t, 'ruin');
    },
    q25(site) {
      for (const [dx, dy] of [[3, 2], [4, 2], [3, 3], [4, 3]]) {
        setTile(site.x + dx, site.y + dy, 3);
        solid(site, dx, dy, () => false);
      }
      for (const [dx, dy] of [[5, 1], [5, 4], [2, 4]]) setTile(site.x + dx, site.y + dy, ZONES[4].t, 'palm');
      site.objs.push({ id: 'aqueduct', kind: 'aqueduct', dx: 0, dy: 0, x: px(site, 0), y: py(site, 0) });
      [['a', -3, -2], ['b', 0, -2], ['c', 1, 0]].forEach(([n, dx, dy], i) => addObj(site, 'agate' + i, 'agate', dx, dy, { i, solid: true }));
    },
    q26(site) {
      [[-3, 1], [3, 1], [-4, -2], [4, -2]].forEach(([dx, dy], i) => addObj(site, 'trial' + i, 'trial', dx, dy, { i, solid: true }));
      addObj(site, 'altar', 'altar', 0, -2, { solid: true });
      shrine(site, 'lumieres');
    },
    q27(site) {
      addObj(site, 'fresco27', 'fresco27', -4, -1, { solid: true });
      addObj(site, 'altar27', 'altar27', 0, 1, { solid: true });
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3 + Math.PI / 6;
        addObj(site, 'cc' + k, 'ccrystal', Math.round(Math.cos(a) * 3), Math.round(Math.sin(a) * 3) + 1, { i: k, solid: true });
      }
      shrine(site, 'aurore');
    },
    q28(site) {
      for (let y = -3; y <= 3; y++) wall(site, 0, y, 4);
      [[-5, -2], [-4, 0], [-5, 2]].forEach(([dx, dy], i) => addObj(site, 'lever' + i, 'lever', dx, dy, { i, solid: true }));
      for (const [dx, dy] of MIRROR_ROCKS) {
        addObj(site, 'mrock' + dx + '_' + (dy + 2), 'mrock', dx, dy);
        solid(site, dx, dy, () => !mirrorRocks(ST.q28.l).has(dx + ',' + dy));
      }
      addObj(site, 'echest', 'echest', 6, 0, { solid: true });
      // Enceinte de la seconde clairière : on n'atteint le coffre qu'en traversant les rochers.
      for (let x = 2; x <= 7; x++)
        for (const y of [-3, 3]) {
          wall(site, x, y, 4);
        }
      for (let y = -3; y <= 3; y++) {
        wall(site, 7, y, 4);
        if (y) {
          wall(site, 6, y, 4);
        }
      }
      // Passage entre les deux clairières, au sud.
      for (let x = -1; x <= 2; x++) setTile(site.x + x, site.y + 4, 2);
      setTile(site.x, site.y + 4, 2);
      WALK.delete(tileKey(site.x, site.y + 4));
    },
    q29(site) {
      [-3, -1, 1, 3].forEach((dx, i) => addObj(site, 'perch' + i, 'perch', dx, 0, { i, solid: true }));
      addObj(site, 'horn', 'horn', -5, 1, { solid: true });
    },
    q30(site) {
      for (let y = -2; y <= 2; y++)
        for (let x = -3; x <= 3; x++) {
          setTile(site.x + x, site.y + y, 18);
          if (Math.abs(x) <= 2 && Math.abs(y) <= 2) solid(site, x, y, () => true);
        }
      site.stones = [];
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) site.stones.push([x, y]);
      site.objs.push({ id: 'lake', kind: 'lake', dx: 0, dy: 0, x: px(site, 0), y: py(site, 0) });
    }
  });
  // Rayon de miroirs : la quête 7 et le temple des miroirs (24) ont le même moteur.
  function beamOf(site) {
    const cfg = BEAMS[site.id],
      S = ST[site.id],
      mirrors = site.objs.filter(o => o.kind === 'mirror'),
      pts = [[...cfg.sun]];
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
      const s = S.m[m.i];
      if (s === 1 || s === 3) return { pts, lit: false };
      [dx, dy] = s === 0 ? [-dy, -dx] : [dy, dx];
    }
    pts.push([x, y]);
    return { pts, lit: false };
  }
  // Position de la feuille dorée (quête 18) : elle tourne dans le vent et descend de temps en temps.
  function leafAt(site, t) {
    return {
      x: px(site, 0) + Math.cos(t * 0.011) * 3.2 * T + Math.sin(t * 0.031) * 0.6 * T,
      y: py(site, 0) + Math.sin(t * 0.017) * 2.4 * T,
      h: (Math.sin(t * 0.045) + 1) / 2
    };
  }
  // Actions des chapitres IV à VI.
  function actMore(hero, site, o) {
    const q = site.quest,
      S = ST[site.id],
      st = stateOf(hero);
    switch (o.kind) {
      case 'leaf':
      case 'fresco':
      case 'obelisk': {
        const c = at(hero, q, 'collect');
        if (o.kind === 'obelisk' && !c) {
          if (qworld.solved.q21) return creditSolved(hero, site);
          if (stepOf(hero, q) < 1 && !st.done[21]) return tell(hero, '🗿 Un obélisque à moitié enseveli. Il faut d’abord le dégager.');
          S.o[o.i] = (S.o[o.i] + 1) % 4;
          cue(hero, 'note' + (S.o[o.i] + 1));
          if (S.o.every((v, i) => v === ANSWER.q21[i])) {
            qworld.flags.sanct_etoiles = true;
            tell(hero, '✨ Les trois faisceaux se rejoignent : le sable s’effondre sur un escalier !');
            solve(site);
          }
          return changed();
        }
        if (!c || c.got.includes(o.id)) return o.what ? panel(hero, '🍂 Souvenir', o.what) : false;
        c.got.push(o.id);
        cue(hero, 'note' + c.got.length);
        if (o.kind === 'obelisk') tell(hero, '🗿 Obélisque dégagé (' + c.got.length + ' / 3)');
        if (c.got.length >= q.steps[c.step].n) advance(hero, q);
        return o.what ? panel(hero, o.kind === 'leaf' ? '🍂 Souvenir des feuilles' : '🧩 Fragment de la fresque', o.what) : true;
      }
      case 'vobj':
      case 'house': {
        if (qworld.solved.q16) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1 && !st.done[16]) return tell(hero, '🍂 Touche d’abord les feuilles dorées : elles savent à qui sont ces objets.');
        const k = keyOf(hero),
          held = S.hold[k];
        if (o.kind === 'vobj') {
          if (held !== undefined || S.pos[o.i] === -2) return false;
          S.pos[o.i] = -2;
          S.hold[k] = o.i;
          tell(hero, '🤲 Tu portes : ' + VILLAGE_OBJS[o.i][0]);
          return changed();
        }
        const there = S.pos.indexOf(o.i);
        if (held === undefined) {
          if (there < 0) return tell(hero, '🏚️ La maison du ' + HOUSES[o.i] + '. Il manque quelque chose devant sa porte.');
          S.pos[there] = -2;
          S.hold[k] = there;
          return changed();
        }
        if (there >= 0) S.pos[there] = -1;
        S.pos[held] = o.i;
        delete S.hold[k];
        cue(hero, 'note' + (o.i + 1));
        if (S.pos.every((v, i) => v === i)) {
          qworld.flags.sanct_saisons = true;
          tell(hero, '🍂 Chaque maison a retrouvé son objet. Les feuilles dorées s’envolent…');
          solve(site);
        }
        return changed();
      }
      case 'pillar':
        if (qworld.solved.q17) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1 && !st.done[17]) return tell(hero, '🧩 Il manque les fragments de la fresque pour savoir où va chaque saison.');
        S.p[o.i] = (S.p[o.i] + 1) % 4;
        cue(hero, 'note' + (S.p[o.i] + 1));
        if (S.p.every((v, i) => v === ANSWER.q17[i])) {
          qworld.flags.archives = true;
          tell(hero, '📚 Le mécanisme tourne : les archives anciennes s’ouvrent.');
          solve(site);
        }
        return changed();
      case 'archive':
        return qworld.solved.q17 ? panel(hero, '📚 Archives anciennes', questById(17).memory) : tell(hero, '📚 Une bibliothèque scellée par le mécanisme des saisons.');
      case 'vane':
        return tell(hero, '🌬️ La girouette tourne : le vent fait tournoyer la feuille dans le sens des aiguilles d’une montre.');
      case 'goldleaf': {
        if (!at(hero, q, 'catch')) return false;
        const l = leafAt(site, S.t);
        if (l.h > 0.35 || Math.hypot(hero.player.x - l.x, hero.player.y - l.y) > 0.9 * T) {
          cue(hero, 'wrong');
          return tell(hero, '🍂 Raté ! Elle était trop haute. Attends qu’elle redescende.');
        }
        burst(l.x, l.y, '#ffd84a', 20);
        tell(hero, '🍂 Tu attrapes la feuille dorée au vol !');
        return advance(hero, q);
      }
      case 'gear':
        if (qworld.solved.q19) return creditSolved(hero, site);
        S.g[o.i] = (S.g[o.i] + 1) % 3;
        if (S.g.every((v, i) => v === ANSWER.q19[i])) {
          qworld.flags.grenier = true;
          tell(hero, '⚙️ La roue entraîne le moulin… dans le bon sens !');
          solve(site);
        }
        return changed();
      case 'traveler': {
        const c = at(hero, q, 'clues');
        if (c && !c.got.includes(o.id)) {
          c.got.push(o.id);
          if (c.got.length >= 3) advance(hero, q);
        }
        return panel(hero, '💬 ' + o.who, o.what);
      }
      case 'hide': {
        if (!at(hero, q, 'search')) return tell(hero, '🍂 ' + o.name + '.');
        if (o.i !== 1) {
          cue(hero, 'wrong');
          return tell(hero, '🦊 Rien ici… ' + o.name + '.');
        }
        burst(o.x, o.y, '#ffb050', 22);
        tell(hero, '🦊 Le renard magique jaillit de sa cachette, des provisions plein les pattes !');
        return advance(hero, q);
      }
      case 'ringlever':
        if (qworld.solved.q22) return creditSolved(hero, site);
        S.r[o.i] = (S.r[o.i] + 1) % 6;
        if (o.i < 2) S.r[o.i + 1] = (S.r[o.i + 1] + 1) % 6;
        cue(hero, 'note' + (o.i + 1));
        if (S.r.every(v => v === 0)) {
          tell(hero, '⚙️ Les trois anneaux s’alignent : la machine de l’Aurore s’illumine !');
          solve(site);
        }
        return changed();
      case 'treasure':
        return tell(hero, qworld.solved.q22 ? '💰 La salle du trésor est ouverte.' : '🔒 Une porte ronde, scellée par la machine.');
      case 'fan': {
        if (qworld.solved.q23) return creditSolved(hero, site);
        S.b = slide(S.b, o.push);
        float(o.x, o.y - 40, '💨', '#dff4ff');
        if (S.b[0] === BASIN.dock[0] && S.b[1] === BASIN.dock[1]) {
          tell(hero, '⛵ Le bateau accoste au quai !');
          solve(site);
        }
        return changed();
      }
      case 'bell':
        if (qworld.solved.q23) return false;
        S.b = [...BASIN.start];
        tell(hero, '🔔 Le bateau revient au départ.');
        return changed();
      case 'mirror':
        if (qworld.solved[site.id]) return creditSolved(hero, site);
        S.m[o.i] = (S.m[o.i] + 1) % 4;
        if (beamOf(site).lit) {
          tell(hero, site.id === 'q7' ? '☀️ La lumière atteint l’arbre gardien ! Ses racines s’illuminent d’or.' : '☀️ Le rayon frappe le soleil de la porte : le temple s’ouvre !');
          solve(site);
        }
        return changed();
      case 'templedoor':
        return tell(hero, qworld.solved.q24 ? '🚪 La porte du temple est ouverte.' : '☀️ Un soleil gravé attend la lumière.');
      case 'agate':
        if (qworld.solved.q25) return creditSolved(hero, site);
        S.g[o.i] = S.g[o.i] ? 0 : 1;
        if (aqueduct(S.g).at(-1) === 'basin') {
          qworld.flags.oasis = true;
          tell(hero, '💧 L’eau coule jusqu’au bassin : l’oasis revit !');
          solve(site);
        }
        return changed();
      case 'trial': {
        const t = q.trials[o.i],
          c = at(hero, q, 'trials');
        if (!c) return tell(hero, c === null && st.done[26] ? '✨ L’épreuve est réussie.' : '✨ Une stèle : « ' + t.q + ' »');
        if (c.got.includes('trial' + o.i)) return tell(hero, '✨ Cette épreuve est réussie.');
        if (o.answer === undefined) return hero === game.hero ? trialPanel(o.i, t) : false;
        if (o.answer !== t.ok) {
          cue(hero, 'wrong');
          return tell(hero, '✨ La stèle s’éteint… Ce n’est pas la bonne réponse.');
        }
        c.got.push('trial' + o.i);
        tell(hero, '✨ Épreuve réussie (' + c.got.length + ' / 4)');
        if (c.got.length >= 4) advance(hero, q);
        return true;
      }
      case 'altar':
        if (!at(hero, q, 'spot')) return tell(hero, st.done[26] ? '✨ Les étoiles brillent sur l’autel.' : '✨ Six alvéoles vides attendent leurs étoiles.');
        if (starCount(st) < 5) return tell(hero, '✨ Il te manque des étoiles du Cœur.');
        burst(o.x, o.y - 20, '#fff0a0', 34);
        tell(hero, '✨ Tu poses les étoiles : six lumières s’allument en cercle.');
        qworld.flags.sanct_lumieres = true;
        changed();
        return advance(hero, q);
      case 'fresco27':
        if (at(hero, q, 'spot')) {
          advance(hero, q);
          return panel(hero, '🖼️ La fresque du gardien', 'Auralis, gardien du Cœur, refusa de partir quand les anciens le dispersèrent. Il veilla seul des siècles, devenu lumière lui-même, en attendant qu’une étincelle revienne.');
        }
        return panel(hero, '🖼️ La fresque du gardien', 'Un gardien seul devant le Cœur, entouré de six cristaux.');
      case 'altar27':
        if (!at(hero, q, 'defense')) return tell(hero, qworld.solved.q27 ? '✨ Le Cœur bat doucement.' : '✨ L’autel du Cœur, entouré de six cristaux.');
        if (S.on) return tell(hero, '⚔️ Défends les cristaux !');
        startDefense(site);
        return changed();
      case 'ccrystal': {
        const c = at(hero, q, 'collect');
        if (!c || c.got.includes(o.id)) return false;
        c.got.push(o.id);
        cue(hero, 'note' + ((c.got.length % 4) + 1));
        tell(hero, '💎 Lumière réunie (' + c.got.length + ' / 6)');
        if (c.got.length >= 6) advance(hero, q);
        return true;
      }
      case 'lever':
        if (qworld.solved.q28) return creditSolved(hero, site);
        S.l[o.i] = S.l[o.i] ? 0 : 1;
        cue(hero, 'note' + (o.i + 1));
        return changed();
      case 'echest':
        if (!at(hero, q, 'puzzle')) return tell(hero, st.done[28] ? '📦 Le coffre enchanté est vide.' : '📦 Un coffre enchanté.');
        tell(hero, '📦 Tu as traversé le miroir !');
        solve(site);
        return true;
      case 'perch':
        if (qworld.solved.q29) return creditSolved(hero, site);
        if (S.fly) return false;
        S.h[o.i] = (S.h[o.i] + 1) % 4;
        return changed();
      case 'horn':
        if (qworld.solved.q29) return creditSolved(hero, site);
        if (S.fly) return false;
        if (!S.h.every((v, i) => v === ANSWER.q29[i])) {
          float(o.x, o.y - 50, '🐉 Braise se cache sous son aile…', '#ffb0a0');
          return tell(hero, '🐉 Braise refuse : un perchoir n’est pas à la bonne hauteur.');
        }
        S.fly = { t: 0 };
        float(o.x, o.y - 50, '📯 Tuuuuut !', '#ffffff');
        return changed();
      case 'lake':
        return tell(hero, '🌌 Le reflet montre le Cerf des neiges. Ses étoiles s’allument l’une après l’autre.');
    }
    return false;
  }
  // Épreuves du sanctuaire (quête 26) : la question et ses réponses, chez le joueur.
  function trialPanel(i, t) {
    modernPanel(
      '<div class="quest-dialog"><h2>✨ Épreuve ' + (i + 1) + '</h2><p class="quest-text">« ' + esc(t.q) + ' »</p><div class="quest-buttons">' +
        t.a.map((a, k) => '<button data-action="questTrial" data-trial="' + i + '" data-choice="' + k + '">' + esc(a) + '</button>').join('') +
        '<button data-action="closePanels">Réfléchir encore</button></div></div>'
    );
    return true;
  }
  window.questTrial = (i, a) => {
    closePanels();
    if (guest()) return CANAAN_NET.requestAction({ op: 'quest-act', site: 'q26', obj: 'trial' + i + '_a' + a });
    const site = SITES.q26,
      o = site.objs.find(o => o.id === 'trial' + i);
    if (o) act(game.hero, site, { ...o, answer: a });
  };
  // Défense des cristaux (quête 27) : trois vagues d'échos de l'Ombre qui s'en prennent aux cristaux.
  function startDefense(site) {
    const S = ST.q27;
    Object.assign(S, { on: true, wave: 0, hp: [100, 100, 100, 100, 100, 100], next: now() + 90 });
    tell(game.hero, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
    for (const h of game.heroes) if (h !== game.hero && Math.hypot(h.player.x - px(site, 0), h.player.y - py(site, 0)) < 14 * T) tell(h, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
  }
  function stopDefense(site, win) {
    const S = ST.q27;
    S.on = false;
    game.world.monsters = game.world.monsters.filter(m => !m.questEcho);
    if (win) {
      S.hp = [100, 100, 100, 100, 100, 100];
      for (const hero of game.heroes)
        if (!hero.player.dead && Math.hypot(hero.player.x - px(site, 0), hero.player.y - py(site, 0)) < 16 * T && at(hero, site.quest, 'defense')) advance(hero, site.quest);
      tell(game.hero, '✨ Les échos se dissipent. Les cristaux brillent de toute leur lumière !');
    } else tell(game.hero, '💔 Les cristaux se sont éteints… Le Cœur se rendort. Réessaie depuis l’autel.');
    changed();
  }
  function stepDefense(site) {
    const S = ST.q27;
    if (!S.on) return;
    const cx = px(site, 0),
      cy = py(site, 0),
      near = game.heroes.filter(h => !h.player.dead && !h.away && Math.hypot(h.player.x - cx, h.player.y - cy) < 16 * T);
    if (!near.length) return stopDefense(site, false);
    const echoes = game.world.monsters.filter(m => m.questEcho && m.hp > 0),
      crystals = site.objs.filter(o => o.kind === 'ccrystal');
    // Les échos marchent vers le cristal le plus proche et le rongent ; un héros tout près les détourne.
    for (const m of echoes) {
      const c = crystals.filter(c => S.hp[c.i] > 0).sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
      if (!c) break;
      const d = Math.hypot(c.x - m.x, c.y - m.y);
      if (game.heroes.some(h => !h.player.dead && Math.hypot(h.player.x - m.x, h.player.y - m.y) < 2.5 * T)) continue;
      if (d > 1.2 * T) {
        const nx = m.x + ((c.x - m.x) / d) * 1.1,
          ny = m.y + ((c.y - m.y) / d) * 1.1;
        if (canWalk(nx, ny)) [m.x, m.y] = [nx, ny];
      } else {
        S.hp[c.i] = Math.max(0, S.hp[c.i] - 0.35);
        if (time % 20 === 0) changed();
        if (S.hp[c.i] === 0) {
          burst(c.x, c.y, '#6a4aa0', 24);
          changed();
        }
      }
    }
    if (S.hp.filter(v => v > 0).length < 3) return stopDefense(site, false);
    if (echoes.length || now() < S.next) return;
    if (S.wave >= 3) return stopDefense(site, true);
    S.wave++;
    S.next = now() + 120;
    const type = MOB_TYPES.find(t => t.name === 'Gardien astral') || MOB_TYPES[0],
      level = 58;
    for (let k = 0; k < 3 + S.wave; k++) {
      const a = (k / (3 + S.wave)) * Math.PI * 2 + S.wave,
        x = cx + Math.cos(a) * 6.5 * T,
        y = cy + Math.sin(a) * 6.5 * T;
      const hp = mobHealth(level, false, type.hp);
      game.world.monsters.push({ x, y, hp, mhp: hp, level, t: type.name, r: 16, cd: 1, g: 20, mobColor: '#6a3aa0', elite: false, questEcho: true, _levelHp: true });
    }
    float(cx, cy - 80, '🌑 Vague ' + S.wave + ' / 3', '#c8a0ff');
    changed();
  }
  // Lac aux mille étoiles (quête 30) : chaque pas sur une pierre de la constellation, dans l'ordre.
  function stepLake(site) {
    const S = ST.q30;
    if (qworld.solved.q30) return;
    for (const h of game.heroes) {
      if (h.player.dead) continue;
      const tx = Math.floor(h.player.x / T) - site.x,
        ty = Math.floor(h.player.y / T) - site.y,
        k = keyOf(h),
        tile = tx + ',' + ty;
      if (S.last[k] === tile) continue;
      S.last[k] = tile;
      if (Math.abs(tx) > 2 || Math.abs(ty) > 2) continue;
      const star = CONSTELLATION.findIndex(([x, y]) => x === tx && y === ty);
      if (star < 0) continue;
      if (star === S.seq) {
        S.seq++;
        cue(h, 'note' + ((S.seq % 4) + 1));
        burst(h.player.x, h.player.y, '#dff4ff', 14);
        if (S.seq >= CONSTELLATION.length) {
          tell(h, '🌌 Le lac s’illumine : la constellation est complète !');
          solve(site);
        }
      } else if (star > S.seq || star < S.seq - 1) {
        S.seq = 0;
        cue(h, 'wrong');
        tell(h, '🌌 Le reflet s’efface… Recommence depuis la première étoile.');
      }
      changed();
    }
  }
  // Étape de simulation des chapitres IV à VI (hôte).
  function stepMore() {
    const t = now(),
      leafSite = SITES.q18;
    if (leafSite && game.heroes.some(h => Math.hypot(h.player.x - px(leafSite, 0), h.player.y - py(leafSite, 0)) < 14 * T)) {
      ST.q18.t++;
      if (t % 6 === 0) changed();
    }
    if (SITES.q27) stepDefense(SITES.q27);
    if (SITES.q30) stepLake(SITES.q30);
    const fly = ST.q29.fly;
    if (fly) {
      fly.t += 1 / 60;
      if (t % 6 === 0) changed();
      if (fly.t >= 4) {
        ST.q29.fly = null;
        qworld.flags.pyria = true;
        tell(game.hero, '🐉 Braise s’envole et fait un looping au-dessus de la forêt !');
        solve(SITES.q29);
      }
    }
    // Le monde à l'envers : un héros qui atteint le coffre de l'autre clairière.
    for (const h of game.heroes) {
      const site = SITES.q28;
      if (site && at(h, site.quest, 'puzzle') && Math.hypot(h.player.x - px(site, 5), h.player.y - py(site, 0)) < 0.8 * T) {
        tell(h, '📦 Tu as traversé le miroir !');
        solve(site);
      }
    }
  }

  // ---------------------------------------------------------------- Progression d'un héros
  const quest = id => questById(id);
  const stepOf = (hero, q) => stateOf(hero).active[q.id]?.step ?? -1;
  // L'étape en cours d'un héros pour une quête, si elle est de ce type.
  function at(hero, q, k) {
    if (!q) return null;
    const st = stateOf(hero).active[q.id];
    return st && st.step < q.steps.length && q.steps[st.step].k === k ? st : null;
  }
  function tell(hero, text) {
    if (hero === game.hero) toast(text);
    else canaanLootNotice(hero, text);
  }
  function advance(hero, q) {
    const st = stateOf(hero).active[q.id];
    if (!st || st.step >= q.steps.length) return false;
    st.step++;
    st.got = [];
    const npc = QUEST_NPCS[q.npc];
    tell(hero, st.step >= q.steps.length ? '📜 ' + q.title + ' : retourne voir ' + npc.name + '.' : '📜 Objectif accompli : ' + q.steps[st.step - 1].text);
    if (hero === game.hero) CANAAN_SOUND.cue('puzzle');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function accept(hero, id) {
    const q = quest(id),
      st = stateOf(hero),
      npc = q && NPCS[q.npc];
    if (!q || !canStart(st, q) || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T) return false;
    st.active[q.id] = { step: 0, got: [] };
    if (!st.track) st.track = q.id;
    tell(hero, '📜 Nouvelle quête : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function turnIn(hero, id) {
    const q = quest(id),
      st = stateOf(hero),
      npc = q && NPCS[q.npc];
    if (!q || !questReady(st, q) || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T) return false;
    delete st.active[q.id];
    st.done[q.id] = Date.now();
    if (st.track === q.id) st.track = Object.keys(st.active).map(Number)[0] || null;
    reward(hero, q);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function reward(hero, q) {
    const r = q.reward,
      st = stateOf(hero);
    hero.player.gold += r.gold || 0;
    for (const f of r.flags || []) {
      st.flags[f] = true;
      // Un sanctuaire ouvert l'est pour tout le monde.
      if (f.startsWith('sanct_')) qworld.flags[f] = true;
    }
    if (r.jewel) giveJewel(hero, q);
    if (r.deco && !st.deco.includes(r.deco)) st.deco.push(r.deco);
    if (r.item) giveGear(clampLevel(hero.level), 'quest', r.item, hero);
    if (r.fishXp || r.goldenFish) CANAAN_PROF.questReward(hero, { fishXp: r.fishXp || 0, goldenFish: r.goldenFish || 0 });
    canaanGrantXp(hero, questXp(q), hero.player);
    tell(hero, '🏆 Quête terminée : ' + q.title + ' · +' + (r.gold || 0) + ' or · ' + r.text);
    if (hero === game.hero) {
      CANAAN_SOUND.cue('levelup');
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 30);
    }
    if (r.flags?.some(f => f.startsWith('star'))) tell(hero, '✦ Une étoile du Cœur de l’Aurore te rejoint (' + starCount(st) + ' / 6).');
  }
  // Bijou du lac aux mille étoiles : Légendaire, au niveau du héros, avec deux secondaires tirées au hasard.
  function giveJewel(hero, q) {
    const slot = Math.random() < 0.5 ? 'ring' : 'neck',
      item = window.CANAAN_GEAR.normalize({
        id: 'q30-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
        name: slot === 'ring' ? 'Anneau des mille étoiles' : 'Collier des mille étoiles',
        slot,
        level: clampLevel(hero.level),
        rarity: 'Légendaire'
      });
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) {
      hero.player.gold += gearSellValue(item);
      return tell(hero, '🎒 Sac plein ! Le bijou est échangé contre de l’or.');
    }
    hero.inventory.push(item);
    tell(hero, '💍 ' + item.name + ' (Légendaire) !');
  }
  // Une énigme partagée est résolue : chaque héros proche qui l'a en cours avance.
  function solve(site, at0) {
    qworld.solved[site.id] = true;
    changed();
    burst(px(site, 0), py(site, 0), '#ffe9a0', 34);
    for (const hero of game.heroes) {
      if (hero.player.dead || hero.away || Math.hypot(hero.player.x - px(site, 0), hero.player.y - py(site, 0)) > 14 * T) continue;
      if (at(hero, site.quest, 'puzzle')) advance(hero, site.quest);
    }
    window.CANAAN_PERSISTENCE.requestSave();
  }
  // Déjà résolue : celui qui a l'énigme en cours et touche au mécanisme est crédité.
  function creditSolved(hero, site) {
    if (!qworld.solved[site.id]) return false;
    if (at(hero, site.quest, 'puzzle')) advance(hero, site.quest);
    else tell(hero, '✨ Le mécanisme est déjà réglé.');
    return true;
  }

  // ---------------------------------------------------------------- Actions sur les objets
  function act(hero, site, o) {
    const q = site.quest,
      S = ST[site.id];
    switch (o.kind) {
      case 'stele':
        return panel(hero, '🪨 Stèle ancienne', q.hint);
      case 'crystal':
        return tell(hero, stateOf(hero).flags.lumi ? '✨ Il ne reste que des éclats de lumière.' : '✨ Une petite lumière tremble dans le cristal. Les pierres l’entourent…');
      case 'stone':
        if (qworld.solved.q1) return creditSolved(hero, site);
        S.seq.push(o.sym);
        cue(hero, 'note' + (ORDER_Q1.indexOf(o.sym) + 1));
        float(o.x, o.y - 40, { soleil: '☀️', pluie: '💧', vent: '🌬️', lune: '🌙' }[o.sym], '#ffe9a0');
        if (S.seq.some((s, i) => s !== ORDER_Q1[i])) {
          S.seq = [];
          cue(hero, 'wrong');
          tell(hero, '🪨 Les pierres s’éteignent… L’ordre n’est pas le bon.');
        } else if (S.seq.length === 4) {
          S.seq = [];
          tell(hero, '✨ Le cristal se brise ! Une petite lumière s’en échappe…');
          solve(site);
        }
        return changed();
      case 'relic': {
        const st = at(hero, q, 'collect');
        if (!st || st.got.includes(o.id)) return false;
        st.got.push(o.id);
        tell(hero, '✦ Symbole trouvé : ' + SYMBOLS_Q2[o.sym] + ' (' + st.got.length + ' / 3)');
        if (st.got.length >= 3) advance(hero, q);
        return true;
      }
      case 'pedestal':
        if (qworld.solved.q2) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1) return tell(hero, '🗿 Un socle vide. Il manque les symboles.');
        S.p[o.i] = (S.p[o.i] + 1) % 3;
        cue(hero, 'note' + (S.p[o.i] + 1));
        if (S.p.every((v, i) => v === i)) solve(site);
        return changed();
      case 'gate':
        if (S.run) return false;
        S.g[o.i] = S.g[o.i] ? 0 : 1;
        return changed();
      case 'whistle':
        if (qworld.solved.q3) return creditSolved(hero, site);
        if (S.run) return false;
        S.run = { path: sheepRoute(site, S.g), i: 0, back: 0 };
        float(o.x, o.y - 40, '🎵 Fiiiiiiou !', '#ffffff');
        return changed();
      case 'dig': {
        if (!at(hero, q, 'spot')) return stateOf(hero).done[q.id] ? tell(hero, 'Le trou est vide : tu as déjà trouvé le trésor.') : false;
        cue(hero, 'chest');
        burst(o.x, o.y, '#c8a060', 20);
        return advance(hero, q);
      }
      case 'ripple': {
        if (!at(hero, q, 'timing')) return false;
        if (S.gold === o.i && now() < S.until) {
          tell(hero, '🐟 Le poisson doré mord ! Tu le remontes, scintillant.');
          burst(o.x, o.y, '#ffd84a', 24);
          return advance(hero, q);
        }
        cue(hero, 'wrong');
        return tell(hero, '🐟 Juste une carpe… Attends le remous doré.');
      }
      case 'mstone': {
        const st = at(hero, q, 'collect');
        cue(hero, 'note' + o.pitch);
        if (!st || st.got.includes(o.id)) return float(o.x, o.y - 40, '♪', '#c8f0a0');
        st.got.push(o.id);
        tell(hero, '🎵 Pierre musicale trouvée (' + st.got.length + ' / 4). Son : ' + ['grave', 'doux', 'clair', 'aigu'][o.pitch - 1] + '.');
        if (st.got.length >= 4) advance(hero, q);
        return true;
      }
      case 'chime':
        if (qworld.solved.q6) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1 && !stateOf(hero).done[q.id]) return tell(hero, '🎵 Le socle attend sa pierre musicale. Retrouve-les dans la forêt.');
        cue(hero, 'note' + o.pitch);
        float(o.x, o.y - 40, '♪', '#c8f0a0');
        S.seq.push(o.pitch);
        if (S.seq.some((p, i) => p !== [1, 4, 2, 3][i])) {
          S.seq = [];
          cue(hero, 'wrong');
          tell(hero, '🎵 La mélodie se brise. Recommence.');
        } else if (S.seq.length === 4) {
          S.seq = [];
          qworld.flags.sanct_murmures = true;
          tell(hero, '🌿 La pierre roule sur le côté : le Sanctuaire des Murmures s’ouvre !');
          solve(site);
        }
        return changed();
      case 'waystone':
        return travel(hero, 'camp');
      case 'campstone':
        return travel(hero, 'forest');
      case 'thief':
        if (!at(hero, q, 'spot')) return false;
        tell(hero, '🦊 Le voleur apparaît : un petit caméléon-renard, les joues pleines de miel !');
        return advance(hero, q);
      case 'viewpoint':
        if (!at(hero, q, 'spot')) return false;
        tell(hero, '🐦 L’ombre de l’arbre déploie ses ailes : un oiseau parfait. Théon accourt avec ses pinceaux !');
        return advance(hero, q);
      case 'valve': {
        if (qworld.solved.q11) return creditSolved(hero, site);
        S.v[o.i] = (S.v[o.i] + 1) % 3;
        cue(hero, 'note' + (S.v[o.i] + 1));
        if (lanterns(S.v).every(Boolean)) {
          qworld.flags.lanterns = true;
          qworld.flags.sanct_reflets = true;
          tell(hero, '🏮 Les quatre lanternes brillent ! Un chemin de lumière mène au Sanctuaire des Reflets.');
          solve(site);
        }
        return changed();
      }
      case 'frame':
        if (qworld.solved.q12) return creditSolved(hero, site);
        S.f[o.i] = (S.f[o.i] + 1) % SCENES_Q12.length;
        if (S.f.every((v, i) => v === i)) {
          tell(hero, '🪞 Les reflets s’unissent : une scène du passé apparaît…');
          solve(site);
        }
        return changed();
      case 'plank':
        if (qworld.solved.q13) return creditSolved(hero, site);
        S.pl[o.i] = (S.pl[o.i] + 1) % 4;
        if (S.pl.every((v, i) => v === [1, 0, 2, 1][i])) {
          qworld.flags.bridge = true;
          tell(hero, '🌉 Le pont tient ! Il est restauré pour toujours.');
          solve(site);
        }
        return changed();
      case 'clue':
      case 'witness': {
        const c = GHOST_CLUES.find(c => c.id === o.clue),
          st = at(hero, q, 'clues');
        if (st && !st.got.includes(c.id)) {
          st.got.push(c.id);
          if (st.got.length >= 4) advance(hero, q);
        }
        return panel(hero, c.who ? '💬 ' + c.who : '🔎 Indice', c.what + (st ? '' : ''));
      }
      case 'shrine':
        return visitShrine(hero, o);
      case 'door':
        return tell(hero, qworld.flags['sanct_' + o.sanct] ? '' : '🗿 Une lourde porte de pierre. Elle ne bougera pas toute seule.');
      case 'islechest':
        return tell(hero, '📦 Le coffre de l’îlot.');
    }
    return actMore(hero, site, o);
  }
  function cue(hero, name) {
    if (hero === game.hero) CANAAN_SOUND.cue(name);
  }
  // Panneau de texte (stèle, indice) : chez le joueur concerné seulement.
  function panel(hero, title, text) {
    if (hero !== game.hero) return canaanLootNotice(hero, title + ' — ' + text);
    modernPanel('<div class="quest-dialog"><h2>' + esc(title) + '</h2><p class="quest-text">' + esc(text) + '</p><div class="quest-buttons"><button data-action="closePanels">D’accord</button></div></div>');
    return true;
  }
  function travel(hero, to) {
    if (!stateOf(hero).flags.shortcut) return tell(hero, '🪨 Une pierre de passage endormie. On dit qu’une fois réveillée, elle relie la forêt au camp.');
    const dest = WAYSTONE[to];
    if (!dest) return false;
    hero.player.x = dest.x;
    hero.player.y = dest.y + T;
    burst(dest.x, dest.y, '#9fe8ff', 24);
    tell(hero, '🌀 La pierre de passage t’emporte…');
    return true;
  }
  function visitShrine(hero, o) {
    if (!qworld.flags['sanct_' + o.sanct]) return false;
    const s = SANCTUARIES.find(s => s.id === o.sanct),
      st = stateOf(hero),
      first = !st.flags['visit_' + s.id];
    if (first) {
      st.flags['visit_' + s.id] = true;
      giveGear(clampLevel(hero.level), 'quest', 'Épique', hero);
      tell(hero, '🎁 Une offrande des anciens t’attendait sur l’autel.');
      window.CANAAN_PERSISTENCE.requestSave();
    }
    const lit = st.flags[s.star];
    return panel(hero, '🏛️ ' + s.name, s.lore + (lit ? ' L’autel brille : son étoile est revenue.' : ' L’autel est éteint, il attend son étoile.'));
  }
  // Mouton de Milo : il suit le chemin ouvert à chaque carrefour.
  function sheepRoute(site, g) {
    const N = site.nodes,
      r = ['pen', 'j1'];
    if (g[0]) r.push('d1');
    else {
      r.push('j2');
      if (g[1]) r.push('d2');
      else if (g[2]) r.push('t1', 'top');
    }
    return r.map(n => [px(site, N[n][0]), py(site, N[n][1])]).concat([[r.at(-1) === 'top' ? 1 : 0, 0]]);
  }
  // Lanternes du marais selon les trois vannes.
  const lanterns = v => [v[0] === 2, (v[0] + v[1]) % 3 === 2, (v[1] + v[2]) % 3 === 1, (v[2] * 2 + v[0]) % 3 === 1];
  // ---------------------------------------------------------------- Étape de simulation (hôte)
  function stepTrails(hero) {
    for (const [id, st] of Object.entries(stateOf(hero).active)) {
      const q = quest(Number(id));
      if (!q || st.step >= q.steps.length) continue;
      const step = q.steps[st.step],
        site = SITES[q.site],
        p = hero.player;
      if (step.k === 'trail') {
        const end = q.id === 1 ? [px(site, 0), py(site, 0)] : site.trail.at(-1);
        if (Math.hypot(p.x - end[0], p.y - end[1]) < 2.4 * T) advance(hero, q);
      } else if (step.k === 'reach' && Math.hypot(p.x - px(site, step.at[0]), p.y - py(site, step.at[1])) < 1.2 * T) {
        if (q.id === 7 && !qworld.solved.q7) continue;
        if (q.id === 7) tell(hero, '🌳 L’arbre gardien parle : « Petite étincelle… Le Cœur de l’Aurore attend. Rassemble les six étoiles. »');
        if (q.id === 15) cue(hero, 'chest');
        advance(hero, q);
      }
    }
  }
  window.CanaanStages.quests = {
    after() {
      if (!started || paused || game.world.instance || guest()) return;
      const t = now();
      if (t % 10 === 0) for (const hero of game.heroes) if (!hero.player.dead && !hero.away) stepTrails(hero);
      stepMore();
      // Poisson doré : un remous brille d'or de temps en temps.
      const f = ST.q5;
      if (t >= f.next) {
        f.gold = Math.floor(Math.random() * 5);
        f.until = t + 110;
        f.next = t + 260 + Math.floor(Math.random() * 140);
        changed();
      }
      // Mouton de Milo.
      const sheep = ST.q3;
      if (sheep.run) {
        const r = sheep.run,
          path = r.path,
          last = path.length - 2;
        if (r.back) {
          if (--r.back <= 0) {
            sheep.run = null;
            changed();
          }
        } else {
          r.i = Math.min(last, r.i + 1 / 45);
          if (r.i >= last) {
            if (path.at(-1)[0] === 1) {
              sheep.top = true;
              sheep.run = null;
              tell(game.hero, '🐑 Pompon est au sommet ! Il bêle de bonheur.');
              solve(SITES.q3);
            } else {
              r.back = 120;
              float(path[last][0], path[last][1] - 40, 'Bêêê ?', '#ffffff');
            }
          }
          if (t % 6 === 0) changed();
        }
      }
      // Nénuphars : ils coulent après deux secondes sous un héros et remontent trois secondes plus tard.
      const site = SITES.q15;
      if (site) {
        ST.q15.pads.forEach((pad, i) => {
          if (pad.sunk) {
            if (t >= pad.sunk) {
              pad.sunk = 0;
              changed();
            }
            return;
          }
          const [dx, dy] = site.pads[i],
            on = game.heroes.some(h => !h.player.dead && Math.floor(h.player.x / T) === site.x + dx && Math.floor(h.player.y / T) === site.y + dy);
          const before = Math.floor(pad.t * 4);
          pad.t = on ? pad.t + 1 / 60 : Math.max(0, pad.t - 1 / 120);
          if (pad.t >= 2) {
            pad.t = 0;
            pad.sunk = t + 180;
          }
          if (Math.floor(pad.t * 4) !== before || pad.sunk) changed();
        });
        // Un héros dans l'eau de l'étang : plouf, retour sur la rive.
        for (const h of game.heroes) {
          const p = h.player,
            tx = Math.floor(p.x / T) - site.x,
            ty = Math.floor(p.y / T) - site.y;
          if (p.dead || tx < -3 || tx > 5 || ty < -3 || ty > 3 || canWalk(p.x, p.y)) continue;
          p.x = px(site, site.start[0]);
          p.y = py(site, site.start[1]);
          float(p.x, p.y - 40, '💦 Plouf !', '#9fd8ff');
        }
      }
    }
  };

  // ---------------------------------------------------------------- Interaction (touche E)
  // Ce que le héros de ce joueur peut faire tout près : parler à un PNJ ou agir sur un objet.
  function nearest(hero = game.hero) {
    if (game.world.instance) return null;
    const p = hero.player;
    let best = null,
      bd = 1e9;
    for (const npc of Object.values(NPCS)) {
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < 1.8 * T && d < bd) [best, bd] = [{ npc }, d];
    }
    for (const site of Object.values(SITES)) {
      if (Math.abs(p.x - px(site, 0)) > 14 * T || Math.abs(p.y - py(site, 0)) > 14 * T) continue;
      for (const o of site.objs) {
        if (!usable(hero, site, o)) continue;
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if (d < (o.range || 1.6) * T && d < bd) [best, bd] = [{ site, o }, d];
      }
    }
    if (WAYSTONE.camp) {
      const d = Math.hypot(p.x - WAYSTONE.camp.x, p.y - WAYSTONE.camp.y);
      if (d < 1.6 * T && d < bd) best = { site: null, o: { id: 'campstone', kind: 'campstone', ...WAYSTONE.camp } };
    }
    return best;
  }
  // Un objet ne se propose que s'il sert à ce héros (objets personnels cachés, sanctuaire fermé…).
  function usable(hero, site, o) {
    const q = site.quest,
      st = stateOf(hero);
    switch (o.kind) {
      case 'relic':
      case 'mstone':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'dig':
      case 'thief':
      case 'viewpoint':
        return !!at(hero, q, 'spot') && Math.hypot(hero.player.x - o.x, hero.player.y - o.y) < 0.9 * T;
      case 'ripple':
        return !!at(hero, q, 'timing');
      case 'clue':
      case 'witness':
        return !!st.active[14] || !!st.done[14];
      case 'shrine':
        return !!qworld.flags['sanct_' + o.sanct];
      case 'door':
        return !qworld.flags['sanct_' + o.sanct];
      case 'gate':
        return !qworld.solved.q3;
      case 'islechest':
      case 'basin':
      case 'machine':
      case 'aqueduct':
        return false;
      case 'leaf':
      case 'fresco':
      case 'ccrystal':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'goldleaf':
        return !!at(hero, q, 'catch');
      case 'vobj':
        return ST.q16.pos[o.i] === -1 && !qworld.solved.q16;
      case 'echest':
        return !!at(hero, q, 'puzzle');
      case 'trial':
        return !!at(hero, q, 'trials');
      case 'altar':
        return !!at(hero, q, 'spot') || !!st.done[26];
      case 'fresco27':
      case 'altar27':
        return true;
    }
    return true;
  }
  function label(hero, n) {
    if (n.npc) return 'Parler à ' + n.npc.def.name;
    const o = n.o;
    return (
      {
        stele: 'Lire la stèle',
        crystal: 'Regarder le cristal',
        stone: 'Toucher la pierre',
        relic: 'Prendre le symbole',
        pedestal: 'Tourner le socle',
        gate: ST.q3.g[o.i] ? 'Fermer la barrière' : 'Ouvrir la barrière',
        whistle: 'Siffler Pompon',
        dig: 'Creuser',
        ripple: 'Ferrer',
        mstone: 'Écouter la pierre',
        chime: 'Jouer la pierre',
        mirror: 'Tourner le miroir',
        waystone: 'Pierre de passage',
        campstone: 'Pierre de passage',
        thief: 'Démasquer le voleur',
        viewpoint: 'Appeler Théon',
        valve: 'Tourner la vanne',
        frame: 'Tourner le miroir',
        plank: 'Changer la planche',
        clue: 'Examiner',
        witness: 'Interroger ' + (GHOST_CLUES.find(c => c.id === o.clue)?.who || ''),
        shrine: 'Prier à l’autel',
        door: 'Pousser la porte',
        leaf: 'Toucher la feuille',
        vobj: 'Prendre l’objet',
        house: ST.q16.hold[keyOf(hero)] !== undefined ? 'Poser ici' : 'Regarder la maison',
        fresco: 'Prendre le fragment',
        pillar: 'Tourner le pilier',
        archive: 'Lire les archives',
        vane: 'Regarder la girouette',
        goldleaf: 'Attraper la feuille',
        gear: 'Changer l’engrenage',
        traveler: 'Écouter ' + (o.who || ''),
        hide: 'Fouiller : ' + (o.name || ''),
        obelisk: o.kind === 'obelisk' && at(hero, n.site?.quest, 'collect') ? 'Dégager l’obélisque' : 'Tourner l’obélisque',
        ringlever: 'Tourner l’anneau',
        treasure: 'Porte du trésor',
        fan: 'Déboucher la bouteille',
        bell: 'Sonner (bateau au départ)',
        templedoor: 'Porte du temple',
        agate: ST.q25.g[o.i] ? 'Fermer la porte' : 'Ouvrir la porte',
        trial: 'Répondre à l’épreuve',
        altar: 'Poser les étoiles',
        fresco27: 'Lire la fresque',
        altar27: 'Éveiller le Cœur',
        ccrystal: 'Réunir la lumière',
        lever: 'Actionner le levier',
        echest: 'Ouvrir le coffre',
        perch: 'Régler le perchoir',
        horn: 'Sonner le cor'
      }[o.kind] || 'Agir'
    );
  }
  function interact() {
    const n = nearest();
    if (!n) return false;
    if (n.npc) {
      talkTo(n.npc.id);
      return true;
    }
    if (guest()) {
      CANAAN_NET.requestAction({ op: 'quest-act', site: n.site ? n.site.id : 'camp', obj: n.o.id });
      return true;
    }
    if (n.o.kind === 'campstone') travel(game.hero, 'forest');
    else act(game.hero, n.site, n.o);
    return true;
  }
  // Demandes d'un invité, vérifiées par l'hôte (distance, étape, objet existant).
  function handle(hero, a) {
    if (a.op === 'quest-accept') return accept(hero, a.q);
    if (a.op === 'quest-turnin') return turnIn(hero, a.q);
    if (a.op === 'quest-track') {
      const st = stateOf(hero);
      st.track = st.active[a.q] ? a.q : null;
      return true;
    }
    if (a.op === 'quest-choice') return choose(hero, a.q, a.choice);
    if (a.op === 'quest-act') {
      if (a.site === 'camp' && a.obj === 'campstone') return WAYSTONE.camp && Math.hypot(hero.player.x - WAYSTONE.camp.x, hero.player.y - WAYSTONE.camp.y) < 2 * T && travel(hero, 'forest');
      const site = SITES[a.site],
        trial = /^trial(\d)_a(\d)$/.exec(a.obj),
        o = site?.objs.find(o => o.id === (trial ? 'trial' + trial[1] : a.obj));
      if (trial && o) {
        if (Math.hypot(hero.player.x - o.x, hero.player.y - o.y) > 2.2 * T) return false;
        return act(hero, site, { ...o, answer: Number(trial[2]) }) !== false;
      }
      if (!o || Math.hypot(hero.player.x - o.x, hero.player.y - o.y) > ((o.range || 1.6) + 0.6) * T || !usable(hero, site, o)) return false;
      return act(hero, site, o) !== false;
    }
    return false;
  }
  // Réponse à l'esprit (quête 14) : la bonne réponse termine l'étape, une mauvaise se retente.
  function choose(hero, id, choice) {
    const q = quest(id),
      st = q && at(hero, q, 'choice'),
      npc = q && NPCS[q.npc];
    if (!st || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T || !Number.isInteger(choice)) return false;
    if (choice !== q.answer) {
      tell(hero, '👻 « Non… ce n’est pas ça. Je crois que non. »');
      return true;
    }
    stateOf(hero).choices[q.id] = choice;
    return advance(hero, q);
  }

  // ---------------------------------------------------------------- Dialogues des PNJ
  function npcState(hero, q) {
    const st = stateOf(hero);
    if (st.done[q.id]) return 'after';
    if (questReady(st, q)) return 'ready';
    if (st.active[q.id]) return 'active';
    return canStart(st, q) ? 'offer' : 'locked';
  }
  function rewardLine(q) {
    return '+' + questXp(q) + ' XP · +' + q.reward.gold + ' or · ' + q.reward.text;
  }
  function talkTo(id) {
    const npc = NPCS[id],
      q = npc.quest,
      hero = game.hero,
      st = stateOf(hero),
      mode = npcState(hero, q),
      lumi = st.flags.lumi ? '<p class="quest-lumi">✨ Lumi tinte doucement près de ' + esc(npc.def.name) + '.</p>' : '';
    let body = '',
      buttons = '';
    if (mode === 'locked') {
      const before = quest(q.requires);
      body = '<p class="quest-text">« Bonjour, voyageur. Le vent tourne, ces temps-ci… »</p><p class="quest-note">Cette partie de l’histoire commence plus tard : termine d’abord « ' + esc(before.title) + ' » (' + esc(QUEST_NPCS[before.npc].name) + ').</p>';
    } else if (mode === 'offer') {
      body = q.talk.offer.map(t => '<p class="quest-text">« ' + esc(t) + ' »</p>').join('') + card(q, st);
      buttons = '<button data-action="questAccept" data-quest="' + q.id + '">Accepter la quête</button>';
    } else if (mode === 'active') {
      const step = q.steps[st.active[q.id].step];
      if (step.k === 'choice') {
        body = '<p class="quest-text">« Alors… tu sais qui j’étais ? »</p>';
        buttons = q.choices.map((c, i) => '<button data-action="questChoice" data-quest="' + q.id + '" data-choice="' + i + '">' + esc(c) + '</button>').join('');
      } else body = '<p class="quest-text">« ' + esc(q.talk.active) + ' »</p>' + card(q, st);
    } else if (mode === 'ready') {
      body = '<p class="quest-text">« ' + esc(q.talk.ready) + ' »</p><p class="quest-reward">🏆 ' + esc(rewardLine(q)) + '</p>';
      buttons = '<button data-action="questTurnIn" data-quest="' + q.id + '">Terminer la quête</button>';
    } else body = '<p class="quest-text">« ' + esc(q.talk.after) + ' »</p>';
    modernPanel(
      '<div class="quest-dialog"><h2>' + esc(npc.def.name) + (mode === 'offer' || mode === 'active' || mode === 'ready' ? ' <small>· ' + esc(q.title) + '</small>' : '') + '</h2>' +
        body + lumi + '<div class="quest-buttons">' + buttons + '<button data-action="closePanels">' + (buttons ? 'Plus tard' : 'Au revoir') + '</button></div></div>'
    );
  }
  function card(q, st) {
    const a = st.active[q.id],
      chapter = CHAPTERS[q.chapter];
    return (
      '<div class="quest-card' + (q.main ? ' main' : '') + '"><b>' + (q.main ? '📖 Histoire · Chapitre ' + chapter.n : '🍃 Quête secondaire') + ' — ' + esc(q.title) + '</b>' +
      '<span class="quest-level">Niveau conseillé ' + q.level + '</span><p>' + esc(q.summary) + '</p><ul>' +
      q.steps
        .map((s, i) => {
          const done = st.done[q.id] || (a && a.step > i),
            cur = a && a.step === i;
          return '<li class="' + (done ? 'done' : cur ? 'current' : '') + '">' + (done ? '✓ ' : cur ? '➤ ' : '◦ ') + esc(s.text) + (cur && s.n ? ' (' + a.got.length + ' / ' + s.n + ')' : '') + '</li>';
        })
        .join('') +
      (a && a.step >= q.steps.length ? '<li class="current">➤ Retourner voir ' + esc(QUEST_NPCS[q.npc].name) + '</li>' : '') +
      '</ul><p class="quest-reward">🏆 ' + esc(rewardLine(q)) + '</p></div>'
    );
  }
  function request(op, extra) {
    if (guest()) return CANAAN_NET.requestAction({ op, ...extra });
    return null;
  }
  window.questAccept = id => {
    closePanels();
    if (request('quest-accept', { q: id }) === null) accept(game.hero, id);
  };
  window.questTurnIn = id => {
    closePanels();
    if (request('quest-turnin', { q: id }) === null) turnIn(game.hero, id);
  };
  window.questChoice = (id, choice) => {
    closePanels();
    if (request('quest-choice', { q: id, choice }) === null) choose(game.hero, id, choice);
  };
  window.questTrack = id => {
    const st = stateOf(game.hero);
    st.track = st.track === id ? null : id;
    request('quest-track', { q: st.track || 0 });
    renderJournal(ui.tab);
  };

  // ---------------------------------------------------------------- Journal (touche L)
  const ui = { tab: 'main' };
  window.questTab = tab => renderJournal(tab);
  function toggleJournal() {
    if (!started || paused) return;
    if (modalOpen()) return closePanels();
    renderJournal(ui.tab);
  }
  function renderJournal(tab = 'main') {
    ui.tab = tab;
    const st = stateOf(game.hero),
      list = q => {
        const a = st.active[q.id];
        return (
          card(q, st) +
          (a ? '<button class="quest-track' + (st.track === q.id ? ' on' : '') + '" data-action="questTrack" data-quest="' + q.id + '">' + (st.track === q.id ? '📍 Suivie' : 'Suivre') + '</button>' : '')
        );
      };
    let html = '';
    if (tab === 'main') {
      const stars = starCount(st);
      html += '<p class="quest-intro"><b>' + esc(STORY_TITLE) + '</b> — ' + esc(STORY_INTRO) + '</p>';
      html += '<p class="quest-stars">Étoiles du Cœur : ' + '★'.repeat(stars) + '☆'.repeat(6 - stars) + (st.flags.lumi ? ' · ✨ Lumi t’accompagne' : '') + '</p>';
      if (st.flags.starmap)
        html +=
          '<div class="quest-map"><b>🗺️ Carte des sanctuaires</b><ul>' +
          SANCTUARIES.map(s => {
            const open = qworld.flags['sanct_' + s.id],
              lit = st.flags[s.star];
            return '<li>' + (lit ? '★' : open ? '◇' : '·') + ' ' + esc(s.name) + ' — ' + esc(ZONES[s.zone].name) + (open ? (st.flags['visit_' + s.id] ? ' (visité)' : ' (ouvert)') : '') + '</li>';
          }).join('') +
          '</ul></div>';
      CHAPTERS.forEach((c, i) => {
        const qs = QUESTS.filter(q => q.main && q.chapter === i);
        html += '<h3 class="quest-chapter">Chapitre ' + c.n + ' — ' + esc(c.title) + ' <small>· ' + esc(ZONES[c.zone].name) + ', niveaux ' + c.levels.join(' à ') + '</small></h3>';
        if (!qs.length) html += '<p class="quest-note">Ce chapitre s’écrira bientôt…</p>';
        for (const q of qs) {
          if (st.active[q.id]) html += list(q);
          else if (st.done[q.id]) html += '<p class="quest-done-line">✓ ' + esc(q.title) + '</p>';
          else if (canStart(st, q)) html += '<p class="quest-note">➤ À découvrir : parle à ' + esc(QUEST_NPCS[q.npc].name) + ' (' + esc(ZONES[SITES[q.site].zone].name) + ').</p>';
        }
      });
    } else if (tab === 'side') {
      const side = QUESTS.filter(q => !q.main && st.active[q.id]);
      html += side.length ? side.map(list).join('') : '<p class="quest-note">Aucune quête secondaire en cours. Les habitants de l’île en proposent : cherche les « ! » dorés au-dessus des têtes.</p>';
    } else {
      const done = QUESTS.filter(q => st.done[q.id]);
      html += done.length
        ? done
            .map(q => '<div class="quest-card done"><b>✓ ' + esc(q.title) + '</b><p>' + esc(q.summary) + '</p><p class="quest-reward">🏆 ' + esc(rewardLine(q)) + '</p>' + (q.memory ? '<p class="quest-memory">📜 Souvenir : ' + esc(q.memory) + '</p>' : '') + '</div>')
            .join('')
        : '<p class="quest-note">Aucune quête terminée pour l’instant.</p>';
    }
    const tabs = [['main', '📖 Histoire principale'], ['side', '🍃 Quêtes secondaires'], ['done', '✓ Terminées']];
    modernPanel(
      '<div class="quest-journal"><h2>📜 Journal de quêtes</h2><div class="quest-tabs">' +
        tabs.map(([id, t]) => '<button class="' + (tab === id ? 'on' : '') + '" data-action="questTab" data-tab="' + id + '">' + t + '</button>').join('') +
        '</div><div class="quest-body">' + html + '</div></div>'
    );
  }

  // ---------------------------------------------------------------- Dessin
  const R = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const visible = (x, y, m = 80) => Math.abs(x - camX - W / 2) < W / 2 + m && Math.abs(y - camY - H / 2) < H / 2 + m;
  function prompt(c, x, y, text) {
    c.font = 'bold 12px system-ui';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#0c1a24';
    c.fillStyle = '#fff2cb';
    c.strokeText('[E] ' + text, x, y);
    c.fillText('[E] ' + text, x, y);
  }
  function glow(c, x, y, r, col, a = 0.35) {
    const g = c.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = a;
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 1;
  }
  // ---------------------------------------------------------------- Dessin des objets (style des donjons)
  // Comme les objets des donjons et du camp : volumes en trois tons (reflet en haut à gauche, ombre à droite),
  // contour sombre, ombre portée au sol, flamme et lueurs des torches (CANAAN_TILE_KIT).
  const OUT = '#22160e',
    FLAME = ['#e5522e', '#f9a640', '#fff1b5'],
    PAL = {
      stone: ['#8a8a84', '#c4c0b4', '#5e5e5a'],
      dark: ['#5a5e66', '#8a909a', '#363a42'],
      wood: ['#6e4c32', '#9a7248', '#43301f'],
      sand: ['#c8a46c', '#ecd09a', '#8a6a3a'],
      iron: ['#4a4a52', '#6a6a72', '#2a2a30'],
      gold: ['#c89a30', '#f0d070', '#8a6418'],
      lilac: ['#9a88c8', '#c8b8f0', '#6a5a98'],
      moss: ['#5a6a48', '#7a8a62', '#3a4630']
    };
  function shadowAt(c, x, y, rx, ry) {
    c.globalAlpha = 0.3;
    c.fillStyle = '#0a0806';
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
  // Bloc en trois tons avec contour : base, reflet (haut et gauche), ombre (droite et bas).
  function block(c, x, y, w, h, p) {
    R(c, x - 1, y - 1, w + 2, h + 2, OUT);
    R(c, x, y, w, h, p[0]);
    R(c, x, y, w, 2, p[1]);
    R(c, x, y, 2, h, p[1]);
    R(c, x + w - 3, y + 2, 3, h - 2, p[2]);
    R(c, x + 2, y + h - 2, w - 5, 2, p[2]);
  }
  function rune(c, x, y, text, col, size = 14) {
    c.font = size + 'px serif';
    c.textAlign = 'center';
    c.fillStyle = col;
    c.fillText(text, x, y);
  }
  function torchFlame(c, x, y, s = 1) {
    CANAAN_TILE_KIT.flame(c, x, y, s, FLAME, x);
    canaanLight(x, y - 6, 120 * s, '#ffcf6a');
  }
  // Pierre dressée gravée d'un symbole (allumée : symbole lumineux et lueur).
  function standing(c, x, y, p, sym, lit, col = '#ffe9a0') {
    shadowAt(c, x, y + 14, 16, 5);
    block(c, x - 12, y - 18, 24, 32, p);
    R(c, x - 14, y + 10, 28, 6, p[2]);
    if (lit) glow(c, x, y - 4, 34, col, 0.55);
    rune(c, x, y + 2, sym, lit ? '#ffffff' : '#20262c');
  }
  // Socle bas avec un objet ou un symbole posé dessus.
  function pedestalArt(c, x, y, p, top) {
    shadowAt(c, x, y + 12, 18, 5);
    block(c, x - 14, y - 4, 28, 18, p);
    block(c, x - 17, y - 9, 34, 6, p);
    if (top) rune(c, x, y - 13, top, '#fff6d0', 18);
  }
  function chestArt(c, x, y, open, glowCol) {
    shadowAt(c, x, y + 12, 18, 5);
    block(c, x - 15, y - 6, 30, 18, PAL.wood);
    R(c, x - 15, y + 1, 30, 2, '#2a1c10');
    if (open) block(c, x - 15, y - 16, 30, 7, PAL.wood);
    else block(c, x - 16, y - 12, 32, 8, PAL.wood);
    R(c, x - 3, y - 3, 6, 6, '#e8c050');
    if (!open && glowCol) glow(c, x, y, 30, glowCol, 0.3);
  }
  function crystalArt(c, x, y, col, s = 1, dim = false) {
    shadowAt(c, x, y + 12 * s, 12 * s, 4 * s);
    if (!dim) glow(c, x, y - 10 * s, 46 * s, col, 0.35 + 0.12 * Math.sin(time * 0.08 + x));
    c.fillStyle = OUT;
    c.beginPath();
    c.moveTo(x, y - 36 * s);
    c.lineTo(x + 14 * s, y - 10 * s);
    c.lineTo(x, y + 14 * s);
    c.lineTo(x - 14 * s, y - 10 * s);
    c.closePath();
    c.fill();
    c.fillStyle = dim ? '#4a4058' : col;
    c.beginPath();
    c.moveTo(x, y - 33 * s);
    c.lineTo(x + 11 * s, y - 10 * s);
    c.lineTo(x, y + 11 * s);
    c.lineTo(x - 11 * s, y - 10 * s);
    c.closePath();
    c.fill();
    if (!dim) R(c, x - 4 * s, y - 20 * s, 3 * s, 10 * s, '#ffffff');
    if (!dim) canaanLight(x, y - 10 * s, 90 * s, col);
  }
  function flagArt(c, x, y, col) {
    shadowAt(c, x, y + 10, 8, 3);
    block(c, x - 3, y - 44, 6, 54, PAL.wood);
    c.fillStyle = OUT;
    c.beginPath();
    c.moveTo(x + 2, y - 46);
    c.lineTo(x + 28, y - 36);
    c.lineTo(x + 2, y - 26);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x + 3, y - 44);
    c.lineTo(x + 24, y - 36);
    c.lineTo(x + 3, y - 28);
    c.fill();
  }
  function personArt(c, x, y, look, tool = 'none') {
    const spr = canaanHeroSprite(sanitizeLook(look), 0, 0, { tool });
    shadowAt(c, x, y + 17, 15, 5);
    c.drawImage(spr, Math.round(x - 26), Math.round(y - 42), 52, 64);
  }
  // Petit dragon (quête 29) : corps rouge, ailes, ventre doré.
  function dragonArt(c, x, y, flap = 0) {
    shadowAt(c, x, y + 26, 16, 4);
    const w = Math.round(Math.sin(flap) * 6);
    block(c, x - 12, y - 6, 24, 14, ['#c83a2a', '#f06a4a', '#8a2418']);
    R(c, x - 8, y + 2, 16, 4, '#f0c060');
    block(c, x + 8, y - 16, 12, 12, ['#c83a2a', '#f06a4a', '#8a2418']);
    R(c, x + 15, y - 12, 2, 2, '#1a1418');
    R(c, x + 10, y - 20, 3, 5, '#f0c060');
    c.fillStyle = '#a82a1a';
    c.beginPath();
    c.moveTo(x - 4, y - 6);
    c.lineTo(x - 22, y - 22 - w);
    c.lineTo(x - 8, y - 4);
    c.fill();
    c.beginPath();
    c.moveTo(x + 2, y - 6);
    c.lineTo(x - 10, y - 26 - w);
    c.lineTo(x + 4, y - 4);
    c.fill();
    R(c, x - 20, y, 9, 4, '#c83a2a');
  }
  function drawObj(c, site, o) {
    const x = o.x,
      y = o.y,
      S = ST[site.id],
      hero = game.hero,
      q = site.quest,
      st = stateOf(hero);
    switch (o.kind) {
      case 'stone':
        return standing(c, x, y, PAL.stone, { soleil: '☀', pluie: '💧', vent: '🌬', lune: '☾' }[o.sym], S.seq.includes(o.sym) || qworld.solved.q1);
      case 'stele':
        shadowAt(c, x, y + 14, 14, 5);
        block(c, x - 11, y - 30, 22, 44, PAL.stone);
        for (let k = 0; k < 4; k++) R(c, x - 6, y - 22 + k * 7, 12, 2, '#4a4a46');
        return;
      case 'crystal':
        if (st.flags.lumi) {
          for (let k = 0; k < 5; k++) block(c, x - 14 + k * 6, y + 4 - (k % 2) * 4, 4, 6, ['#bfe8ff', '#ffffff', '#7ab0d0']);
          return;
        }
        return crystalArt(c, x, y, '#cfefff');
      case 'relic':
        if (!usable(hero, site, o)) return;
        glow(c, x, y, 26, '#ffe9a0', 0.4 + 0.3 * Math.sin(time * 0.15 + o.sym));
        return rune(c, x, y + 5, ['✦', '☾', '🔥'][o.sym], '#fff6d0', 16);
      case 'pedestal': {
        const shown = qworld.solved.q2 || stepOf(hero, q) >= 1 || st.done[2];
        pedestalArt(c, x, y, PAL.sand, shown ? ['✦', '☾', '🔥'][S.p[o.i]] : null);
        c.font = 'bold 10px system-ui';
        c.fillStyle = '#2a2014';
        c.fillText(['N', 'O', 'E'][o.i], x, y + 9);
        return;
      }
      case 'gate': {
        const open = S.g[o.i];
        if (o.horiz) {
          block(c, x - 23, y - 8, 5, 22, PAL.wood);
          block(c, x + 18, y - 8, 5, 22, PAL.wood);
          if (!open) for (const yy of [-3, 5]) block(c, x - 18, y + yy, 36, 4, PAL.wood);
          else block(c, x - 19, y - 24, 4, 18, PAL.wood);
        } else {
          block(c, x - 2, y - 26, 5, 8, PAL.wood);
          block(c, x - 2, y + 16, 5, 8, PAL.wood);
          if (!open) for (const xx of [-6, 3]) block(c, x + xx, y - 18, 4, 36, PAL.wood);
          else block(c, x + 3, y - 20, 18, 4, PAL.wood);
        }
        return;
      }
      case 'whistle':
        shadowAt(c, x, y + 12, 8, 3);
        block(c, x - 3, y - 22, 6, 34, PAL.wood);
        block(c, x - 8, y - 28, 16, 7, PAL.gold);
        return;
      case 'hilltop':
        return flagArt(c, x, y, qworld.solved.q3 ? '#ffd84a' : '#c84a4a');
      case 'shadowtree': {
        const dig = SITES.q4.objs.find(d => d.kind === 'dig');
        c.save();
        c.globalAlpha = 0.28;
        c.strokeStyle = '#0a1418';
        c.lineWidth = 16;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x, y + 14);
        c.lineTo(x + (dig.x - x) * 1.15, y + 14 + (dig.y - y) * 1.15);
        c.stroke();
        c.restore();
        return;
      }
      case 'dig':
        if (st.done[4] || (st.active[4] && st.active[4].step >= 1)) {
          R(c, x - 16, y - 2, 32, 12, '#3a2814');
          chestArt(c, x, y - 4, true);
        } else R(c, x - 3, y - 3, 6, 6, '#6a5030');
        return;
      case 'ripple': {
        const gold = S.gold === o.i && now() < S.until;
        for (let k = 0; k < 3; k++) {
          const age = ((time + k * 25 + o.i * 13) % 75) / 75;
          c.globalAlpha = (1 - age) * (gold ? 0.9 : 0.45);
          c.strokeStyle = gold ? '#ffd84a' : '#e8f6ff';
          c.lineWidth = gold ? 3 : 2;
          c.beginPath();
          c.ellipse(x, y, 6 + age * 20, 3 + age * 8, 0, 0, Math.PI * 2);
          c.stroke();
        }
        c.globalAlpha = 1;
        if (gold) glow(c, x, y, 30, '#ffd84a', 0.35);
        return;
      }
      case 'chime':
      case 'mstone': {
        const col = ['#9ad8ff', '#a8f0a0', '#f0e08a', '#f0a8d8'][o.pitch - 1];
        if (o.kind === 'mstone' && !usable(hero, site, o)) return;
        if (o.kind === 'chime' && !(qworld.solved.q6 || stepOf(hero, q) >= 1 || st.done[6])) return pedestalArt(c, x, y, PAL.moss, null);
        pedestalArt(c, x, y, PAL.moss, null);
        glow(c, x, y - 12, 26, col, 0.45 + 0.2 * Math.sin(time * 0.1 + o.pitch));
        block(c, x - 6, y - 18, 12, 9, [col, '#ffffff', PAL.moss[2]]);
        return;
      }
      case 'door':
        if (qworld.flags['sanct_' + o.sanct]) return R(c, x - 22, y + 6, 44, 8, '#4a4a44');
        shadowAt(c, x, y + 20, 26, 6);
        block(c, x - 24, y - 32, 48, 52, PAL.stone);
        block(c, x - 18, y - 26, 36, 46, PAL.dark);
        return rune(c, x, y + 2, '✦', '#c8c0b0', 18);
      case 'shrine': {
        const open = qworld.flags['sanct_' + o.sanct],
          s = SANCTUARIES.find(s => s.id === o.sanct),
          lit = st.flags[s.star];
        shadowAt(c, x, y + 14, 26, 6);
        block(c, x - 22, y - 8, 44, 22, PAL.stone);
        block(c, x - 26, y - 13, 52, 7, PAL.stone);
        if (open) {
          crystalArt(c, x, y - 16, lit ? '#ffe9a0' : '#bfe8ff', 0.7, false);
          torchFlame(c, x - 22, y - 16, 0.8);
          torchFlame(c, x + 22, y - 16, 0.8);
        } else crystalArt(c, x, y - 16, '#5a5a54', 0.7, true);
        return;
      }
      case 'sun':
        shadowAt(c, x, y + 14, 16, 5);
        block(c, x - 14, y - 8, 28, 22, PAL.sand);
        glow(c, x, y - 14, 44, '#ffd84a', 0.6);
        block(c, x - 9, y - 22, 18, 14, PAL.gold);
        canaanLight(x, y - 14, 140, '#ffd84a');
        return;
      case 'mirror': {
        const s = S.m[o.i];
        shadowAt(c, x, y + 12, 16, 4);
        block(c, x - 16, y + 4, 32, 8, PAL.iron);
        c.save();
        c.translate(x, y - 8);
        c.rotate([-Math.PI / 4, 0, Math.PI / 4, Math.PI / 2][s]);
        R(c, -22, -5, 44, 10, OUT);
        R(c, -21, -4, 42, 8, '#9ab8d8');
        R(c, -21, -4, 42, 3, '#e8f6ff');
        c.restore();
        return;
      }
      case 'gtree':
        if (qworld.solved.q7) glow(c, x, y - 10, 90, '#ffd84a', 0.35 + 0.1 * Math.sin(time * 0.05));
        return;
      case 'waystone':
        shadowAt(c, x, y + 14, 16, 5);
        block(c, x - 12, y - 32, 24, 46, PAL.dark);
        if (qworld.flags.shortcut || st.flags.shortcut) {
          glow(c, x, y - 12, 40, '#9fe8ff', 0.5);
          canaanLight(x, y - 12, 100, '#9fe8ff');
        }
        return rune(c, x, y - 6, '🜁', st.flags.shortcut ? '#dff8ff' : '#20262c');
      case 'sack':
        shadowAt(c, x, y + 12, 14, 4);
        block(c, x - 12, y - 10, 24, 22, ['#b89a6a', '#d8ba8a', '#8a6a3a']);
        return block(c, x - 6, y - 16, 12, 7, ['#9a7a4a', '#b89a6a', '#6a4a2a']);
      case 'thief':
        if (st.done[9] || (st.active[9] && st.active[9].step >= 2)) {
          shadowAt(c, x, y + 10, 14, 4);
          block(c, x - 12, y - 4, 22, 12, ['#8ac06a', '#aade8a', '#5a8a4a']);
          block(c, x + 6, y - 12, 10, 10, ['#9ad07a', '#bae89a', '#6a9a5a']);
          R(c, x + 12, y - 9, 2, 2, '#1a1418');
          return block(c, x - 20, y - 6, 9, 4, ['#e08a3a', '#f0aa5a', '#a85a1a']);
        }
        c.globalAlpha = 0.12 + 0.08 * Math.sin(time * 0.2);
        R(c, x - 12, y - 4, 22, 12, '#c8e0b0');
        c.globalAlpha = 1;
        return;
      case 'easel':
        shadowAt(c, x, y + 14, 14, 4);
        block(c, x - 2, y - 30, 4, 44, PAL.wood);
        block(c, x - 14, y - 28, 28, 22, ['#f0ece4', '#ffffff', '#c8c0b0']);
        return R(c, x - 10, y - 24, 20, 14, st.done[10] ? '#3a4a5a' : '#d8d0c4');
      case 'valve': {
        const v = S.v[o.i];
        shadowAt(c, x, y + 14, 10, 3);
        block(c, x - 5, y - 4, 10, 18, PAL.iron);
        c.save();
        c.translate(x, y - 10);
        c.rotate((v * Math.PI * 2) / 3);
        c.strokeStyle = OUT;
        c.lineWidth = 6;
        c.beginPath();
        c.arc(0, 0, 11, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = '#c84a3a';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, 11, 0, Math.PI * 2);
        c.moveTo(-11, 0);
        c.lineTo(11, 0);
        c.stroke();
        c.restore();
        return;
      }
      case 'lantern': {
        const lit = qworld.flags.lanterns || lanterns(ST.q11.v)[o.i];
        shadowAt(c, x, y + 12, 10, 3);
        block(c, x - 3, y - 36, 6, 48, PAL.iron);
        block(c, x - 10, y - 50, 20, 16, lit ? ['#ffd890', '#fff0c0', '#c8a050'] : PAL.iron);
        block(c, x - 12, y - 54, 24, 5, PAL.iron);
        if (lit) torchFlame(c, x, y - 38, 0.7);
        return;
      }
      case 'frame': {
        const sc = SCENES_Q12[S.f[o.i]];
        shadowAt(c, x, y + 12, 18, 4);
        block(c, x - 20, y - 42, 40, 52, PAL.gold);
        block(c, x - 15, y - 37, 30, 42, qworld.solved.q12 ? ['#e8f4ff', '#ffffff', '#b8c8d8'] : ['#b8c8d8', '#d8e4f0', '#8a9aac']);
        rune(c, x, y - 12, sc[0], '#1a2430', 18);
        c.font = 'bold 9px system-ui';
        c.fillStyle = '#1a2430';
        c.fillText(sc[1], x, y + 2);
        return;
      }
      case 'plank': {
        const v = S.pl[o.i],
          need = [1, 0, 2, 1][o.i];
        block(c, x - 23, y - 12 - need * 8, 6, 18 + need * 8, PAL.wood);
        block(c, x + 17, y - 12 - need * 8, 6, 18 + need * 8, PAL.wood);
        if (v < 3) {
          const w = [26, 36, 46][v];
          block(c, x - w / 2, y - 5, w, 10, ['#b98a58', '#d1a66c', '#8a5a34']);
        }
        return;
      }
      case 'clue':
        shadowAt(c, x, y + 10, 16, 4);
        if (o.clue === 'lanterne') {
          block(c, x - 6, y - 20, 12, 12, PAL.iron);
          return block(c, x - 10, y - 8, 20, 16, PAL.iron);
        }
        return block(c, x - 22, y - 6, 44, 12, PAL.wood);
      case 'witness': {
        const w = GHOST_CLUES.find(g => g.id === o.clue);
        personArt(c, x, y, { sex: o.clue === 'vieille' ? 'f' : 'm', hair: o.clue === 'vieille' ? '#e8e8e0' : '#5a4030', outfit: 'cuir' }, o.clue === 'pecheur' ? 'rod' : 'none');
        if (Math.hypot(P.x - x, P.y - y) < 4 * T) nameTag(c, x, y - 48, w.who);
        return;
      }
      case 'islechest':
        return chestArt(c, x, y, st.done[15] || (st.active[15] && st.active[15].step >= 1), '#ffe9a0');
      // Chapitres IV à VI.
      case 'house': {
        const p = PAL.stone,
          there = S.pos.indexOf(o.i);
        shadowAt(c, x, y + 16, 26, 6);
        block(c, x - 24, y - 6, 8, 22, p);
        block(c, x + 16, y - 6, 8, 22, p);
        block(c, x - 24, y - 12, 48, 8, p);
        rune(c, x, y + 4, ['🪣', '🔥', '🌷', '🗼'][o.i], '#ffffff', 16);
        if (there >= 0) rune(c, x, y - 18, VILLAGE_OBJS[there][1], '#ffffff', 18);
        return;
      }
      case 'vobj':
        if (S.pos[o.i] !== -1) return;
        shadowAt(c, x, y + 8, 12, 4);
        return rune(c, x, y + 4, VILLAGE_OBJS[o.i][1], '#ffffff', 22);
      case 'leaf':
      case 'fresco':
        if (!usable(hero, site, o)) return;
        glow(c, x, y, 24, o.kind === 'leaf' ? '#ffd84a' : '#d8c8a8', 0.45 + 0.25 * Math.sin(time * 0.12 + x));
        if (o.kind === 'leaf') return rune(c, x, y + 6, '🍂', '#ffffff', 18);
        return block(c, x - 9, y - 7, 18, 14, ['#b8a080', '#d8c8a8', '#8a7050']);
      case 'pillar': {
        const shown = qworld.solved.q17 || stepOf(hero, q) >= 1 || st.done[17];
        shadowAt(c, x, y + 14, 16, 5);
        block(c, x - 12, y - 30, 24, 44, PAL.stone);
        block(c, x - 15, y - 34, 30, 6, PAL.stone);
        if (shown) rune(c, x, y - 6, SEASONS[S.p[o.i]][0], '#ffffff', 18);
        return;
      }
      case 'archive':
        shadowAt(c, x, y + 14, 24, 5);
        block(c, x - 22, y - 34, 44, 48, PAL.wood);
        for (let k = 0; k < 3; k++) for (let b = 0; b < 6; b++) R(c, x - 18 + b * 6, y - 30 + k * 14, 5, 11, qworld.solved.q17 ? ['#a83a2a', '#3a6aa8', '#c8a040', '#4a8a4a'][(b + k) % 4] : '#3a2a1a');
        return;
      case 'vane': {
        shadowAt(c, x, y + 12, 8, 3);
        block(c, x - 2, y - 40, 5, 52, PAL.iron);
        const a = time * 0.02;
        c.save();
        c.translate(x, y - 40);
        c.rotate(a);
        block(c, -16, -2, 32, 4, PAL.iron);
        R(c, 12, -5, 6, 10, '#c84a3a');
        c.restore();
        return;
      }
      case 'goldleaf': {
        if (!at(hero, q, 'catch') && !st.done[18]) return;
        const l = leafAt(site, S.t);
        o.x = l.x;
        o.y = l.y;
        shadowAt(c, l.x, l.y + 4, 10 - l.h * 5, 3);
        glow(c, l.x, l.y - l.h * 50, 22, '#ffd84a', 0.5);
        c.save();
        c.translate(l.x, l.y - l.h * 50);
        c.rotate(Math.sin(time * 0.1) * 0.8);
        rune(c, 0, 6, '🍂', '#ffffff', 18);
        c.restore();
        return;
      }
      case 'waterwheel': {
        shadowAt(c, x, y + 20, 26, 6);
        c.save();
        c.translate(x, y - 6);
        c.rotate(qworld.solved.q19 ? time * 0.04 : time * -0.01);
        for (let k = 0; k < 8; k++) {
          c.rotate(Math.PI / 4);
          block(c, -3, -26, 6, 22, PAL.wood);
        }
        c.restore();
        return block(c, x - 6, y - 12, 12, 12, PAL.iron);
      }
      case 'mill':
        shadowAt(c, x, y + 40, 30, 7);
        block(c, x - 26, y - 20, 52, 58, PAL.stone);
        block(c, x - 30, y - 34, 60, 16, ['#a8603a', '#c8804a', '#6a3a1a']);
        c.save();
        c.translate(x, y - 32);
        c.rotate(qworld.solved.q19 ? time * 0.05 : time * -0.02);
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          block(c, -4, -46, 8, 40, ['#e8e0d0', '#ffffff', '#b8b0a0']);
        }
        c.restore();
        return;
      case 'gear': {
        const v = S.g[o.i],
          gap = ANSWER.q19[o.i];
        block(c, x - 3 - gap * 6, y + 8, 4, 10, PAL.iron);
        block(c, x + gap * 6, y + 8, 4, 10, PAL.iron);
        if (!v) return;
        const r = v === 2 ? 18 : 10;
        c.save();
        c.translate(x, y);
        c.rotate((qworld.solved.q19 ? time * 0.06 : 0) * (o.i % 2 ? -1 : 1));
        c.fillStyle = OUT;
        c.beginPath();
        c.arc(0, 0, r + 4, 0, Math.PI * 2);
        c.fill();
        for (let k = 0; k < 8; k++) {
          c.rotate(Math.PI / 4);
          R(c, -3, -r - 4, 6, 6, PAL.iron[1]);
        }
        c.fillStyle = PAL.iron[0];
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.fill();
        c.restore();
        return;
      }
      case 'traveler':
        personArt(c, x, y, { sex: o.who === 'Mila' ? 'f' : 'm', race: o.who === 'Hector' ? 'orc' : 'humain', hair: '#5a3a20', outfit: o.who === 'Gaspard' ? 'rose' : 'foret' }, o.who === 'Hector' ? 'spear' : 'none');
        if (Math.hypot(P.x - x, P.y - y) < 4 * T) nameTag(c, x, y - 48, o.who);
        return;
      case 'hide':
        if (o.look === 'pumpkin') {
          shadowAt(c, x, y + 12, 18, 5);
          block(c, x - 16, y - 8, 32, 20, ['#e07a2a', '#f8a04a', '#a84a10']);
          return block(c, x - 3, y - 16, 6, 8, PAL.moss);
        }
        if (o.look === 'leaves') {
          shadowAt(c, x, y + 8, 18, 4);
          for (let k = 0; k < 6; k++) block(c, x - 16 + (k % 3) * 10, y - 4 - Math.floor(k / 3) * 6, 10, 6, ['#c86a2a', '#e89a4a', '#8a3a10']);
          return;
        }
        return block(c, x - 22, y - 6, 44, 10, PAL.wood);
      case 'obelisk': {
        const c2 = at(hero, q, 'collect'),
          found = !c2 || c2.got.includes(o.id),
          dir = S.o[o.i];
        shadowAt(c, x, y + 14, 14, 5);
        if (!found) {
          block(c, x - 8, y - 8, 16, 20, PAL.sand);
          R(c, x - 14, y + 6, 28, 8, '#d8b880');
          return;
        }
        block(c, x - 9, y - 48, 18, 62, PAL.sand);
        block(c, x - 12, y + 6, 24, 8, PAL.sand);
        rune(c, x, y - 30, ['▲', '▶', '▼', '◀'][dir], '#6a4a1a', 14);
        return;
      }
      case 'starplate':
        R(c, x - 22, y - 14, 44, 28, '#a8885a');
        block(c, x - 18, y - 11, 36, 22, PAL.sand);
        if (qworld.solved.q21) glow(c, x, y, 50, '#fff0a0', 0.5);
        return rune(c, x, y + 6, '✦', qworld.solved.q21 ? '#ffffff' : '#6a4a1a', 18);
      case 'ringlever':
        shadowAt(c, x, y + 12, 10, 3);
        block(c, x - 8, y - 2, 16, 14, PAL.iron);
        block(c, x - 2, y - 22, 4, 20, PAL.wood);
        return block(c, x - 5, y - 26, 10, 6, ['#c84a3a', '#e86a5a', '#8a2a1a']);
      case 'machine': {
        shadowAt(c, x, y + 50, 70, 14);
        for (let k = 0; k < 3; k++) {
          const r = 22 + k * 20,
            rot = (S.r[k] * Math.PI) / 3;
          c.strokeStyle = OUT;
          c.lineWidth = 12;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = ['#c89a30', '#9a88c8', '#6aa8c8'][k];
          c.lineWidth = 8;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.stroke();
          for (let s = 0; s < 6; s++) {
            const a = rot + (s * Math.PI) / 3 - Math.PI / 2;
            R(c, x + Math.cos(a) * r - 2, y + Math.sin(a) * r - 2, 4, 4, s === 0 ? '#ffffff' : '#2a2014');
          }
        }
        R(c, x - 2, y - 88, 4, 14, '#ffffff');
        if (qworld.solved.q22) glow(c, x, y, 90, '#fff0a0', 0.4);
        return;
      }
      case 'treasure':
        return chestArt(c, x, y, qworld.solved.q22, '#ffd84a');
      case 'basin': {
        const S2 = ST.q23;
        for (const [rx, ry] of BASIN.rocks) block(c, px(site, rx) - 14, py(site, ry) - 12, 28, 24, PAL.stone);
        const [dx, dy] = BASIN.dock;
        block(c, px(site, dx) + 14, py(site, dy) - 10, 16, 20, PAL.wood);
        const bx = px(site, S2.b[0]),
          by = py(site, S2.b[1]);
        block(c, bx - 14, by - 4, 28, 10, PAL.wood);
        block(c, bx - 1, by - 24, 3, 20, PAL.wood);
        c.fillStyle = '#f0ece4';
        c.beginPath();
        c.moveTo(bx + 2, by - 24);
        c.lineTo(bx + 14, by - 8);
        c.lineTo(bx + 2, by - 8);
        c.fill();
        return;
      }
      case 'fan':
        shadowAt(c, x, y + 10, 10, 3);
        block(c, x - 7, y - 14, 14, 24, ['#5a9ac8', '#9ad0f0', '#2a5a8a']);
        return block(c, x - 4, y - 20, 8, 6, PAL.wood);
      case 'bell':
        shadowAt(c, x, y + 12, 10, 3);
        block(c, x - 2, y - 30, 4, 42, PAL.wood);
        return block(c, x - 8, y - 36, 16, 12, PAL.gold);
      case 'templedoor':
        shadowAt(c, x, y + 18, 26, 6);
        if (qworld.solved.q24) {
          block(c, x - 24, y - 34, 48, 6, PAL.sand);
          return chestArt(c, x, y - 4, false, '#ffd84a');
        }
        block(c, x - 22, y - 34, 44, 52, PAL.sand);
        return rune(c, x, y - 4, '☀', '#8a6418', 22);
      case 'aqueduct': {
        const path = aqueduct(S.g),
          wet = qworld.solved.q25 ? aqueduct(ANSWER.q25) : path;
        const edges = [['src', 'a'], ['a', 'leakA'], ['a', 'b'], ['b', 'leakB'], ['b', 'c'], ['c', 'leakC'], ['c', 'basin']];
        for (const [a, b] of edges) {
          const [x0, y0] = AQ[a],
            [x1, y1] = AQ[b],
            on = wet.includes(a) && wet.includes(b) && wet.indexOf(b) === wet.indexOf(a) + 1;
          c.strokeStyle = OUT;
          c.lineWidth = 14;
          c.beginPath();
          c.moveTo(px(site, x0), py(site, y0));
          c.lineTo(px(site, x1), py(site, y1));
          c.stroke();
          c.strokeStyle = on ? '#5ab0e8' : PAL.sand[0];
          c.lineWidth = 10;
          c.stroke();
        }
        const end = wet.at(-1);
        if (end !== 'basin') glow(c, px(site, AQ[end][0]), py(site, AQ[end][1]), 30, '#8ab0c0', 0.5);
        const full = qworld.flags.oasis;
        block(c, px(site, 3) - 22, py(site, 2) - 22, 92, 92, full ? ['#3a8ac8', '#7ac0f0', '#1a5a8a'] : PAL.sand);
        return block(c, px(site, -5) - 14, py(site, -3) - 18, 28, 30, PAL.stone);
      }
      case 'agate': {
        const open = S.g[o.i];
        shadowAt(c, x, y + 12, 12, 4);
        block(c, x - 14, y - 4, 4, 18, PAL.iron);
        block(c, x + 10, y - 4, 4, 18, PAL.iron);
        return block(c, x - 10, open ? y - 18 : y, 20, 12, PAL.wood);
      }
      case 'trial': {
        const done = st.done[26] || (at(hero, q, 'trials') && at(hero, q, 'trials').got.includes('trial' + o.i));
        return standing(c, x, y, PAL.lilac, ['✦', '♪', '☾', '6'][o.i], done, '#e8d8ff');
      }
      case 'altar': {
        shadowAt(c, x, y + 14, 26, 6);
        block(c, x - 24, y - 8, 48, 22, PAL.lilac);
        const stars = st.done[26] || stepOf(hero, q) >= 2 ? 6 : starCount(st);
        for (let k = 0; k < 6; k++) {
          const lit = (st.done[26] || stepOf(hero, q) >= 2) && k < stars;
          rune(c, x - 20 + k * 8, y + 4, lit ? '★' : '☆', lit ? '#fff0a0' : '#3a2a58', 10);
        }
        if (st.done[26]) glow(c, x, y - 10, 60, '#fff0a0', 0.4);
        return;
      }
      case 'fresco27':
        shadowAt(c, x, y + 14, 22, 5);
        block(c, x - 22, y - 34, 44, 48, PAL.lilac);
        return rune(c, x, y - 4, '🛡️', '#ffffff', 22);
      case 'altar27': {
        shadowAt(c, x, y + 16, 28, 7);
        block(c, x - 26, y - 6, 52, 22, PAL.gold);
        const awake = qworld.solved.q27 || st.done[27];
        return crystalArt(c, x, y - 10, awake ? '#fff0a0' : '#c8b8f0', 1.1, false);
      }
      case 'ccrystal': {
        const hp = ST.q27.on ? ST.q27.hp[o.i] : 100,
          col = ['#ff8a8a', '#ffd08a', '#fff08a', '#8affa8', '#8ad8ff', '#c88aff'][o.i];
        crystalArt(c, x, y, col, 0.8, hp <= 0);
        if (ST.q27.on && hp > 0) {
          R(c, x - 16, y + 18, 32, 4, OUT);
          R(c, x - 15, y + 19, (30 * hp) / 100, 2, '#8affa8');
        }
        return;
      }
      case 'lever': {
        const down = ST.q28.l[o.i];
        shadowAt(c, x, y + 12, 10, 3);
        block(c, x - 10, y, 20, 12, PAL.lilac);
        c.save();
        c.translate(x, y + 2);
        c.rotate(down ? 0.7 : -0.7);
        block(c, -2, -24, 4, 24, PAL.iron);
        block(c, -5, -28, 10, 7, ['#c8b8f0', '#ffffff', '#8a7ab8']);
        c.restore();
        return;
      }
      case 'mrock':
        if (!mirrorRocks(ST.q28.l).has(o.dx + ',' + o.dy)) return R(c, x - 14, y + 6, 28, 6, '#3a3048');
        shadowAt(c, x, y + 14, 18, 5);
        return block(c, x - 18, y - 16, 36, 30, PAL.lilac);
      case 'echest':
        return chestArt(c, x, y, st.done[28], '#c8b8f0');
      case 'perch': {
        const h = ST.q29.h[o.i];
        shadowAt(c, x, y + 12, 12, 4);
        block(c, x - 3, y - 10 - h * 14, 6, 22 + h * 14, PAL.wood);
        return block(c, x - 12, y - 16 - h * 14, 24, 6, PAL.wood);
      }
      case 'horn':
        shadowAt(c, x, y + 12, 10, 3);
        block(c, x - 2, y - 24, 4, 36, PAL.wood);
        return block(c, x - 10, y - 30, 20, 8, PAL.gold);
      case 'lake': {
        const S2 = ST.q30;
        for (const [dx, dy] of site.stones) {
          const sx = px(site, dx),
            sy = py(site, dy),
            k = CONSTELLATION.findIndex(([a, b]) => a === dx && b === dy);
          block(c, sx - 18, sy - 12, 36, 26, ['#7a8aa0', '#a8b8d0', '#4a5a70']);
          if (k >= 0 && (k < S2.seq || qworld.solved.q30)) glow(c, sx, sy, 30, '#dff4ff', 0.6);
        }
        // Reflet de la constellation : les étoiles s'allument l'une après l'autre.
        const lit = Math.floor(time / 50) % (CONSTELLATION.length + 2);
        CONSTELLATION.forEach(([dx, dy], k) => {
          const sx = px(site, dx),
            sy = py(site, dy) - 4;
          rune(c, sx, sy + 5, '✦', k < lit || qworld.solved.q30 ? '#ffffff' : '#5a6a8a', 14);
          if (k && (k < lit || qworld.solved.q30)) {
            c.globalAlpha = 0.5;
            c.strokeStyle = '#dff4ff';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(px(site, CONSTELLATION[k - 1][0]), py(site, CONSTELLATION[k - 1][1]) - 4);
            c.lineTo(sx, sy);
            c.stroke();
            c.globalAlpha = 1;
          }
        });
        return;
      }
    }
  }
  // Ce que le héros voit d'un lieu des chapitres IV à VI en plus des objets : objet porté, rayons, dragon.
  function drawMoreExtras(c, site) {
    if (site.id === 'q16') {
      for (const [k, i] of Object.entries(ST.q16.hold)) {
        const h = heroOfKey(k);
        if (h) rune(c, h.player.x, h.player.y - 56, VILLAGE_OBJS[i][1], '#ffffff', 20);
      }
    }
    if (site.id === 'q21' && (qworld.solved.q21 || stepOf(game.hero, site.quest) >= 1 || stateOf(game.hero).done[21])) {
      const S = ST.q21;
      for (const o of site.objs.filter(o => o.kind === 'obelisk')) {
        const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][S.o[o.i]];
        c.save();
        c.globalAlpha = 0.6;
        c.strokeStyle = '#fff0a0';
        c.lineWidth = 4;
        c.shadowColor = '#ffd84a';
        c.shadowBlur = 12;
        c.beginPath();
        c.moveTo(o.x, o.y - 30);
        c.lineTo(o.x + dx * 5 * T, o.y - 30 + dy * 5 * T);
        c.stroke();
        c.restore();
      }
    }
    if (site.id === 'q24' || site.id === 'q7') {
      const b = beamOf(site);
      c.save();
      c.strokeStyle = '#ffe890';
      c.globalAlpha = 0.75;
      c.lineWidth = 5;
      c.shadowColor = '#ffd84a';
      c.shadowBlur = 14;
      c.beginPath();
      b.pts.forEach(([dx, dy], i) => (i ? c.lineTo(px(site, dx), py(site, dy) - 8) : c.moveTo(px(site, dx), py(site, dy) - 8)));
      c.stroke();
      c.restore();
    }
    if (site.id === 'q29') {
      const S = ST.q29,
        perches = site.objs.filter(o => o.kind === 'perch');
      let x = px(site, -5),
        y = py(site, -1),
        flap = time * 0.1;
      if (S.fly) {
        const k = Math.min(3.99, S.fly.t),
          i = Math.floor(k),
          f = k - i,
          a = perches[i],
          b = perches[Math.min(3, i + 1)];
        x = a.x + (b.x - a.x) * f;
        y = a.y - 30 - S.h[i] * 14 + (b.y - a.y) * f - 30 * Math.sin(f * Math.PI);
        flap = time * 0.4;
      } else if (qworld.solved.q29 || qworld.flags.pyria) {
        x = px(site, 0) + Math.cos(time * 0.02) * 4 * T;
        y = py(site, -2) + Math.sin(time * 0.04) * 1.5 * T - 30;
        flap = time * 0.4;
      }
      dragonArt(c, x, y, flap);
    }
  }
  function nameTag(c, x, y, text) {
    c.font = 'bold 11px sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#120c07';
    c.fillStyle = '#f6e2b1';
    c.strokeText(text, x, y);
    c.fillText(text, x, y);
  }
  // Décors propres à chaque lieu : traces, ombres, rayon, lucioles, panneaux, nénuphars, pont, mouton.
  function drawSiteExtras(c, site) {
    const hero = game.hero,
      st = stateOf(hero);
    if (site.id === 'q1' && at(hero, site.quest, 'trail')) {
      const a = NPCS.liora,
        b = [px(site, 0), py(site, 0)];
      for (let k = 1; k < 26; k++) {
        const t = k / 26,
          x = a.x + (b[0] - a.x) * t + Math.sin(t * 12) * 18,
          y = a.y + (b[1] - a.y) * t + Math.cos(t * 9) * 12;
        glow(c, x, y, 14, '#bfe8ff', 0.35 + 0.25 * Math.sin(time * 0.1 - k * 0.6));
      }
    }
    if (site.id === 'q3') {
      const S = ST.q3,
        sprite = CANAAN_LIFE.icon('mouton');
      let x = px(site, site.nodes.pen[0]),
        y = py(site, site.nodes.pen[1]);
      if (S.top) [x, y] = [px(site, 3), py(site, -4)];
      else if (S.run) {
        const path = S.run.path,
          i = Math.floor(S.run.i),
          f = S.run.i - i,
          a = path[i],
          b = path[Math.min(i + 1, path.length - 2)];
        x = a[0] + (b[0] - a[0]) * f;
        y = a[1] + (b[1] - a[1]) * f;
      }
      if (sprite) c.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height + 8));
    }
    if (site.id === 'q8') {
      for (const [dx, dy] of site.fireflies) {
        const x = px(site, dx) + Math.sin(time * 0.05 + dx) * 6,
          y = py(site, dy) + Math.cos(time * 0.07 + dy) * 6;
        glow(c, x, y, 16, '#e8ff8a', 0.45 + 0.3 * Math.sin(time * 0.12 + dx * 2 + dy));
      }
      for (const s of site.signs) {
        const x = px(site, s.dx),
          y = py(site, s.dy);
        R(c, x - 2, y - 24, 4, 26, '#6a4a2a');
        R(c, x - 14 + s.dir[0] * 6, y - 30, 28, 10, '#a8804a');
        c.font = 'bold 9px system-ui';
        c.textAlign = 'center';
        c.fillStyle = '#2a1a0a';
        c.fillText(s.dir[0] > 0 ? 'Sortie →' : s.dir[0] < 0 ? '← Sortie' : s.dir[1] < 0 ? '↑ Sortie' : '↓ Sortie', x + s.dir[0] * 6, y - 22);
      }
    }
    if (site.id === 'q9' && at(hero, site.quest, 'trail')) {
      site.trail.forEach(([x, y], k) => {
        if (Math.hypot(P.x - x, P.y - y) > 3.5 * T) return;
        R(c, x - 3 + (k % 2) * 6, y - 2, 4, 4, '#5a4a3a');
        R(c, x - 4 + (k % 2) * 6, y - 5, 2, 2, '#5a4a3a');
      });
    }
    if (site.id === 'q10') {
      const v = site.objs.find(o => o.kind === 'viewpoint'),
        d = Math.hypot(P.x - v.x, P.y - v.y),
        x = px(site, 0),
        y = py(site, 0) - 34;
      c.save();
      c.globalAlpha = 0.32;
      c.fillStyle = '#0a1418';
      if (d < 0.9 * T && (at(hero, site.quest, 'spot') || st.done[10])) {
        // L'oiseau d'ombre.
        c.beginPath();
        c.moveTo(x - 60, y - 10);
        c.quadraticCurveTo(x - 20, y - 40, x, y - 4);
        c.quadraticCurveTo(x + 20, y - 40, x + 60, y - 10);
        c.quadraticCurveTo(x + 20, y - 14, x + 6, y + 18);
        c.lineTo(x - 6, y + 18);
        c.quadraticCurveTo(x - 20, y - 14, x - 60, y - 10);
        c.fill();
      } else {
        c.beginPath();
        c.ellipse(x - (P.x - v.x) * 0.15, y, 40 + Math.min(30, d / 8), 18, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
    if (site.id === 'q11' && qworld.flags.lanterns) {
      for (let k = 0; k < 6; k++) glow(c, px(site, 0), py(site, -3 + k * 0.2) - k * 4, 18, '#ffc860', 0.25);
    }
    drawMoreExtras(c, site);
    if (site.id === 'q15') {
      site.pads.forEach(([dx, dy], i) => {
        const pad = ST.q15.pads[i],
          x = px(site, dx),
          y = py(site, dy);
        if (pad.sunk) return;
        const s = 1 - Math.min(0.5, pad.t / 4);
        c.fillStyle = pad.t > 1.2 ? '#4a7a3a' : '#5aa04a';
        c.beginPath();
        c.ellipse(x, y, 20 * s, 14 * s, 0, 0.3, Math.PI * 2);
        c.lineTo(x, y);
        c.fill();
      });
    }
  }
  // Monde : lieux visibles, objets, PNJ et marques (! disponible, ? à rendre).
  function drawWorld(c) {
    if (game.world.instance) return;
    c.save();
    c.imageSmoothingEnabled = false;
    for (const site of Object.values(SITES)) {
      if (!visible(px(site, 0), py(site, 0), (site.r + 4) * T)) continue;
      drawSiteExtras(c, site);
      for (const o of site.objs) if (visible(o.x, o.y)) drawObj(c, site, o);
    }
    if (WAYSTONE.camp && visible(WAYSTONE.camp.x, WAYSTONE.camp.y)) drawObj(c, SITES.q8, { kind: 'waystone', x: WAYSTONE.camp.x, y: WAYSTONE.camp.y });
    for (const npc of Object.values(NPCS)) {
      if (!visible(npc.x, npc.y)) continue;
      const def = npc.def,
        dx = P.x - npc.x,
        dy = P.y - npc.y;
      if (Math.hypot(dx, dy) < 3 * T) npc.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
      const s = def.child ? 0.8 : 1,
        spr = canaanHeroSprite(sanitizeLook(def.look), npc.face, 0, { tool: def.tool || 'none' });
      if (def.spirit) {
        // Lumi elle-même : une petite lumière qui flotte.
        const yy = npc.y - 20 + Math.sin(time * 0.07) * 6;
        glow(c, npc.x, yy, 44, '#bfe8ff', 0.6);
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(npc.x, yy, 7, 0, Math.PI * 2);
        c.fill();
        canaanLight(npc.x, yy, 110, '#bfe8ff');
      } else {
      c.globalAlpha = def.ghost ? 0.55 + 0.15 * Math.sin(time * 0.06) : 1;
      if (def.ghost) glow(c, npc.x, npc.y - 20, 40, '#bfe8ff', 0.35);
      c.drawImage(spr, Math.round(npc.x - 26 * s), Math.round(npc.y + 18 - 60 * s + (def.ghost ? Math.sin(time * 0.05) * 3 : 0)), Math.round(52 * s), Math.round(64 * s));
      c.globalAlpha = 1;
      }
      const mode = npcState(game.hero, npc.quest),
        mark = mode === 'offer' ? '!' : mode === 'ready' ? '?' : mode === 'active' ? '…' : '';
      if (mark) {
        c.font = 'bold 26px Georgia, serif';
        c.textAlign = 'center';
        c.lineWidth = 4;
        c.strokeStyle = '#2a1a08';
        c.fillStyle = mark === '…' ? '#c8c0b0' : npc.quest.main ? '#ffd84a' : '#fff0a0';
        const yy = npc.y - 58 * s + Math.sin(time * 0.08) * 3;
        c.strokeText(mark, npc.x, yy);
        c.fillText(mark, npc.x, yy);
      }
      if (Math.hypot(dx, dy) < 4 * T) nameTag(c, npc.x, npc.y - 46 * s, def.name);
    }
    // Lumi éclaire la nuit autour de chaque héros qu'elle accompagne.
    for (const hero of game.heroes) {
      const l = lumiAt.get(hero);
      if (l && !hero.player.dead) canaanLight(l.x, l.y, 90, '#bfe8ff');
    }
    const n = nearest();
    if (n && !modalOpen()) {
      const x = n.npc ? n.npc.x : n.o.x,
        y = n.npc ? n.npc.y : n.o.y;
      prompt(c, x, y - (n.npc ? 74 : 44), label(game.hero, n));
    }
    c.restore();
  }
  // Bulles : un PNJ qui a une quête à proposer appelle le héros qui passe.
  function drawBubbles(c) {
    if (game.world.instance) return;
    for (const npc of Object.values(NPCS)) {
      const d = Math.hypot(P.x - npc.x, P.y - npc.y);
      if (d > 4 * T || d < 1.6 * T || npcState(game.hero, npc.quest) !== 'offer') continue;
      const text = npc.quest.talk.offer[0].slice(0, 60) + (npc.quest.talk.offer[0].length > 60 ? '…' : '');
      c.save();
      c.font = '12px system-ui, sans-serif';
      c.textAlign = 'center';
      const w = Math.min(240, c.measureText(text).width + 20),
        x = npc.x - w / 2,
        y = npc.y - 100;
      c.globalAlpha = 0.95;
      c.fillStyle = '#fbf3df';
      c.strokeStyle = '#3a2a1e';
      c.lineWidth = 2;
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, 24, 7);
      else c.rect(x, y, w, 24);
      c.fill();
      c.stroke();
      c.fillStyle = '#2a1e14';
      c.fillText(text, npc.x, y + 16, w - 12);
      c.restore();
    }
  }
  // Lumi et la bénédiction des racines d'or, au-dessus des héros ; suivi de la quête à l'écran.
  const lumiAt = new WeakMap();
  let hint = null,
    hintAt = 0;
  window.CanaanStages.drawQuests = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(-camX, -camY);
    for (const hero of game.heroes) {
      const p = hero.player,
        flags = hero === game.hero ? stateOf(hero).flags : { lumi: hero.questLook & 1, blessing: hero.questLook & 2, aurora: hero.questLook & 4 };
      if (p.dead) continue;
      // Aura du Gardien de l'Aurore : anneau de lumière dorée et rose sous les pieds.
      if (flags.aurora) {
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 0.08);
        ctx.strokeStyle = time % 120 < 60 ? '#ffe9a0' : '#ffb8e8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 16, 24, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (flags.blessing && time % 14 === 0) particles.push({ x: p.x + (Math.random() - 0.5) * 34, y: p.y + 14, vx: 0, vy: -0.4, life: 34, c: '#ffd84a', r: 2 });
      if (!flags.lumi) continue;
      const l = lumiAt.get(hero) || { x: p.x, y: p.y };
      const tx = p.x - 26 * (p.face || 1),
        ty = p.y - 52 + Math.sin(time * 0.07) * 6;
      l.x += (tx - l.x) * 0.06;
      l.y += (ty - l.y) * 0.06;
      lumiAt.set(hero, l);
      glow(ctx, l.x, l.y, 30, '#bfe8ff', 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      ctx.fill();
      R(ctx, l.x - 9 + Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
      R(ctx, l.x + 5 - Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
    }
    // Indice de Lumi pour la quête suivie, de temps en temps.
    const st = stateOf(game.hero),
      l = lumiAt.get(game.hero);
    if (st.flags.lumi && l && time - hintAt > 2700 && st.track) {
      hintAt = time;
      const tr = target(game.hero);
      if (tr) hint = { text: 'Lumi : ✨ ' + tr.text + ' (' + direction(tr) + ')', until: time + 300 };
    }
    if (hint && time < hint.until && l) lumiCloud(ctx, l.x, l.y, hint.text, Math.min(1, (hint.until - time) / 40));
    ctx.restore();
    if (time % 15 === 0) tracker();
  };
  // Pensée de Lumi : un petit nuage léger et un peu transparent au-dessus d'elle (texte court sur quelques lignes),
  // aux bords bosselés irréguliers, relié à elle par deux petites bulles. alpha : fondu à la fin.
  function lumiCloud(c, x, y, text, alpha = 1) {
    c.save();
    c.font = '11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const words = String(text).replace(/^Lumi : /, '').split(' '),
      lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (line && c.measureText(test).width > 150) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    const lh = parseFloat(c.font) * 1.2,
      w = Math.max(...lines.map(t => c.measureText(t).width)),
      h = lines.length * lh,
      rx = w / 2 + 10,
      ry = h / 2 + 7,
      cx = x + 6,
      cy = y - 28 - ry;
    // Bosses du pourtour : rayons variés (toujours les mêmes pour un même texte), comme un vrai cumulus.
    const n = Math.max(7, Math.round((rx + ry) / 9)),
      bumps = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2,
        wob = 0.75 + 0.45 * Math.abs(Math.sin(i * 2.7 + text.length));
      bumps.push([cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.78, ry * 0.62 * wob]);
    }
    const blob = grow => {
      c.beginPath();
      c.ellipse(cx, cy, rx + grow, ry + grow, 0, 0, Math.PI * 2);
      for (const [bx, by, r] of bumps) {
        c.moveTo(bx + r + grow, by);
        c.arc(bx, by, r + grow, 0, Math.PI * 2);
      }
    };
    // Liseré bleuté très fin, puis le nuage blanc légèrement transparent.
    c.globalAlpha = 0.55 * alpha;
    c.fillStyle = '#9cc8ec';
    blob(1.2);
    c.fill();
    c.globalAlpha = 0.86 * alpha;
    c.fillStyle = '#ffffff';
    blob(0);
    c.fill();
    // Deux petites bulles vers Lumi.
    for (const [k, r] of [
      [0, 3.2],
      [1, 2]
    ]) {
      c.beginPath();
      c.arc(x + 3 - k * 2, cy + ry + 8 + k * 6, r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = alpha;
    c.fillStyle = '#2a4664';
    lines.forEach((t, i) => c.fillText(t, cx, cy - ((lines.length - 1) * lh) / 2 + i * lh));
    c.restore();
  }
  // Cible de la quête suivie : le PNJ s'il faut y retourner, sinon le lieu ou l'objet de l'étape.
  function target(hero) {
    const st = stateOf(hero),
      q = quest(st.track);
    if (!q || !st.active[q.id]) return null;
    const a = st.active[q.id],
      site = SITES[q.site];
    if (a.step >= q.steps.length) return { x: NPCS[q.npc].x, y: NPCS[q.npc].y, text: 'Retourne voir ' + QUEST_NPCS[q.npc].name, q };
    const step = q.steps[a.step];
    if (step.k === 'collect') {
      const left = site.objs.find(o => ['relic', 'mstone', 'leaf', 'fresco', 'obelisk', 'ccrystal'].includes(o.kind) && !a.got.includes(o.id));
      if (left) return { x: left.x, y: left.y, text: step.text, q, vague: true };
    }
    if (step.at) return { x: px(site, step.at[0]), y: py(site, step.at[1]), text: step.text, q, vague: step.k === 'spot' };
    if (step.k === 'catch') return { x: site.leaf.x, y: site.leaf.y, text: step.text, q };
    if (step.k === 'defense') {
      const altar = site.objs.find(o => o.kind === 'altar27');
      return { x: altar.x, y: altar.y, text: step.text, q };
    }
    if (step.k === 'search' || step.k === 'trials') return { x: px(site, 0), y: py(site, 0), text: step.text, q, vague: true };
    return { x: px(site, 0), y: py(site, 0), text: step.text, q };
  }
  function direction(tr) {
    const a = Math.atan2(tr.y - P.y, tr.x - P.x),
      names = ['l’est', 'le sud-est', 'le sud', 'le sud-ouest', 'l’ouest', 'le nord-ouest', 'le nord', 'le nord-est'];
    return 'vers ' + names[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
  }
  const trackerEl = document.createElement('div');
  trackerEl.id = 'questTracker';
  trackerEl.hidden = true;
  document.body.appendChild(trackerEl);
  function tracker() {
    const tr = started && !game.world.instance ? target(game.hero) : null;
    trackerEl.hidden = !tr;
    if (!tr) return;
    const d = Math.round(Math.hypot(tr.x - P.x, tr.y - P.y) / T),
      a = Math.atan2(tr.y - P.y, tr.x - P.x),
      html =
        '<b>' + (tr.q.main ? '📖 ' : '🍃 ') + esc(tr.q.title) + '</b><span>' + esc(tr.text) + '</span><em>' +
        (d <= 2 ? 'Tu y es' : '<i style="transform:rotate(' + a.toFixed(2) + 'rad)">➤</i> ' + (tr.vague && d < 8 ? 'tout près' : d + ' cases')) + '</em>';
    if (trackerEl.innerHTML !== html) trackerEl.innerHTML = html;
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  function exportWorld() {
    return { flags: { ...qworld.flags }, solved: { ...qworld.solved } };
  }
  function importWorld(d) {
    qworld = { flags: {}, solved: {} };
    const flags = ['sanct_murmures', 'sanct_reflets', 'sanct_saisons', 'sanct_etoiles', 'sanct_lumieres', 'sanct_aurore', 'lanterns', 'bridge', 'shortcut', 'archives', 'grenier', 'oasis', 'pyria'];
    if (d && typeof d === 'object') {
      for (const f of flags) if (d.flags?.[f]) qworld.flags[f] = true;
      for (const id of Object.keys(SITES)) if (d.solved?.[id]) qworld.solved[id] = true;
    }
    ST = { ...freshStates(), ...freshMore() };
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
    for (const id of Object.keys(qworld.solved)) if (SOLVED_STATE[id]) Object.assign(ST[id], SOLVED_STATE[id]());
    changed();
  }
  // État des lieux envoyé aux invités quand il change (et de temps en temps pour un invité qui arrive).
  let sent = -1,
    sentAt = -1e9;
  function netView() {
    if (version === sent && time - sentAt < 300) return undefined;
    sent = version;
    sentAt = time;
    return {
      w: exportWorld(),
      s: {
        q1: ST.q1.seq.length,
        q2: ST.q2.p,
        q3: [ST.q3.g, ST.q3.top ? 1 : 0, ST.q3.run ? [ST.q3.run.path, Math.round(ST.q3.run.i * 100) / 100] : 0],
        q5: [ST.q5.gold, Math.max(0, ST.q5.until - time)],
        q6: ST.q6.seq.length,
        q7: ST.q7.m,
        q11: ST.q11.v,
        q12: ST.q12.f,
        q13: ST.q13.pl,
        q15: ST.q15.pads.map(p => [Math.round(p.t * 4) / 4, p.sunk ? 1 : 0]),
        q16: [ST.q16.pos, ST.q16.hold],
        q17: ST.q17.p,
        q18: ST.q18.t,
        q19: ST.q19.g,
        q21: ST.q21.o,
        q22: ST.q22.r,
        q23: ST.q23.b,
        q24: ST.q24.m,
        q25: ST.q25.g,
        q27: [ST.q27.on ? 1 : 0, ST.q27.hp.map(Math.round)],
        q28: ST.q28.l,
        q29: [ST.q29.h, ST.q29.fly ? Math.round(ST.q29.fly.t * 10) / 10 : -1],
        q30: ST.q30.seq
      }
    };
  }
  const ints = (a, n, max) => (Array.isArray(a) && a.length === n && a.every(v => Number.isInteger(v) && v >= 0 && v <= max) ? [...a] : null);
  function applyRemote(v) {
    if (!v || typeof v !== 'object') return;
    if (v.w) {
      const before = JSON.stringify(qworld.solved);
      qworld = { flags: {}, solved: {} };
      for (const f of Object.keys(v.w.flags || {})) if (/^[a-z_]{2,24}$/.test(f)) qworld.flags[f] = true;
      for (const id of Object.keys(v.w.solved || {})) if (SITES[id]) qworld.solved[id] = true;
      if (before !== JSON.stringify(qworld.solved)) for (const id of Object.keys(qworld.solved)) if (SOLVED_STATE[id]) Object.assign(ST[id], SOLVED_STATE[id]());
    }
    const s = v.s;
    if (!s) return;
    ST.q2.p = ints(s.q2, 3, 2) || ST.q2.p;
    ST.q7.m = ints(s.q7, 3, 3) || ST.q7.m;
    ST.q11.v = ints(s.q11, 3, 2) || ST.q11.v;
    ST.q12.f = ints(s.q12, 4, 4) || ST.q12.f;
    ST.q13.pl = ints(s.q13, 4, 3) || ST.q13.pl;
    if (Array.isArray(s.q3)) {
      ST.q3.g = ints(s.q3[0], 3, 1) || ST.q3.g;
      ST.q3.top = !!s.q3[1];
      const run = s.q3[2];
      ST.q3.run = Array.isArray(run) && Array.isArray(run[0]) && run[0].every(p => Array.isArray(p) && p.every(Number.isFinite)) ? { path: run[0], i: Number(run[1]) || 0, back: 0 } : null;
    }
    if (Array.isArray(s.q5)) {
      ST.q5.gold = Number.isInteger(s.q5[0]) ? s.q5[0] : -1;
      ST.q5.until = time + (Number(s.q5[1]) || 0);
    }
    if (Number.isInteger(s.q1)) ST.q1.seq = ORDER_Q1.slice(0, Math.min(4, s.q1));
    if (Number.isInteger(s.q6)) ST.q6.seq = [1, 4, 2, 3].slice(0, Math.min(4, s.q6));
    ST.q17.p = ints(s.q17, 4, 3) || ST.q17.p;
    ST.q19.g = ints(s.q19, 3, 2) || ST.q19.g;
    ST.q21.o = ints(s.q21, 3, 3) || ST.q21.o;
    ST.q22.r = ints(s.q22, 3, 5) || ST.q22.r;
    ST.q24.m = ints(s.q24, 4, 3) || ST.q24.m;
    ST.q25.g = ints(s.q25, 3, 1) || ST.q25.g;
    ST.q28.l = ints(s.q28, 3, 1) || ST.q28.l;
    if (Array.isArray(s.q23) && s.q23.length === 2 && s.q23.every(Number.isInteger)) ST.q23.b = [...s.q23];
    if (Number.isFinite(s.q18)) ST.q18.t = s.q18;
    if (Number.isInteger(s.q30)) ST.q30.seq = Math.max(0, Math.min(CONSTELLATION.length, s.q30));
    if (Array.isArray(s.q16) && Array.isArray(s.q16[0]) && s.q16[0].length === 4 && s.q16[0].every(v => Number.isInteger(v) && v >= -2 && v <= 3)) {
      ST.q16.pos = [...s.q16[0]];
      ST.q16.hold = {};
      for (const [k, v] of Object.entries(s.q16[1] || {})) if (Number.isInteger(v) && v >= 0 && v <= 3) ST.q16.hold[String(k).slice(0, 64)] = v;
    }
    if (Array.isArray(s.q27)) {
      ST.q27.on = !!s.q27[0];
      if (Array.isArray(s.q27[1]) && s.q27[1].length === 6) ST.q27.hp = s.q27[1].map(v => Math.max(0, Math.min(100, Number(v) || 0)));
    }
    if (Array.isArray(s.q29)) {
      ST.q29.h = ints(s.q29[0], 4, 3) || ST.q29.h;
      ST.q29.fly = Number(s.q29[1]) >= 0 ? { t: Number(s.q29[1]) } : null;
    }
    if (Array.isArray(s.q15)) s.q15.forEach((p, i) => ST.q15.pads[i] && Array.isArray(p) && Object.assign(ST.q15.pads[i], { t: Number(p[0]) || 0, sunk: p[1] ? 1 : 0 }));
  }
  // Apparence visible chez les autres : Lumi (1) et bénédiction des racines d'or (2).
  const questLook = hero => (stateOf(hero).flags.lumi ? 1 : 0) | (stateOf(hero).flags.blessing ? 2 : 0) | (stateOf(hero).flags.aurora ? 4 : 0);

  // Lieux posés sur l'île ; une île régénérée (même graine) les reçoit à nouveau, à l'identique.
  function rebuild() {
    for (const k of Object.keys(SITES)) delete SITES[k];
    for (const k of Object.keys(NPCS)) delete NPCS[k];
    WALK.clear();
    place();
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
  }
  place();
  canaanQuestWorld = rebuild;
  window.CANAAN_QUESTS = Object.freeze({
    sites: () => SITES,
    npcs: () => NPCS,
    npcMode: (hero, npc) => (npc.quest ? npcState(hero, npc.quest) : 'none'),
    waystones: () => Object.values(WAYSTONE).filter(Boolean),
    state: stateOf,
    world: () => qworld,
    puzzles: () => ST,
    accept,
    turnIn,
    advance,
    act: (hero, siteId, objId) => {
      const site = SITES[siteId],
        o = site?.objs.find(o => o.id === objId);
      return o ? act(hero, site, o) : false;
    },
    handle,
    interact,
    nearest,
    beam: () => beamOf(SITES.q7),
    lanterns,
    exportWorld,
    importWorld,
    netView,
    applyRemote,
    questLook,
    hasDeco: (hero, k) => stateOf(hero).deco.includes(k),
    done: (hero, id) => !!stateOf(hero).done[id],
    drawWorld,
    drawBubbles,
    render: renderJournal,
    target
  });
  Object.assign(window, { toggleJournal });
})();
