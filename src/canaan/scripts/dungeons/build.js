// Construction des donjons et des raids : énigmes posées dans chaque aile (indices des leviers et des dalles, rayon
// des miroirs, braseros, gardiens, cristaux, piliers…), déclencheurs des passages secrets, pièges du thème, décor,
// grille de l'instance et plan du colisée de l'Arène. scripts/dungeons/dungeons.js appelle
// CANAAN_DUNGEON_BUILD.create(scène) une fois : la scène lui donne les cases, les thèmes et les plans d'exploration.
(() => {
  'use strict';
  function create(scene) {
    const {
      WALL,
      FLOOR,
      ACCENT,
      HAZARD,
      WALKABLE,
      THEMES,
      SOLID_PROPS,
      PLANS,
      bounds,
      STEP,
      OPPOSITE,
      D4,
      TILE_TRAPS,
      TRAP_CYCLE,
      eachPathCell,
      doorCells,
      planDungeon
    } = scene;

    // ---------------------------------------------------------------- Énigmes
    // Indices des leviers et des dalles : des affirmations vraies qui, ensemble, ne laissent qu'un ordre possible.
    function permutations(n) {
      const out = [],
        go = (cur, rest) => {
          if (!rest.length) out.push(cur);
          rest.forEach((v, k) => go([...cur, v], [...rest.slice(0, k), ...rest.slice(k + 1)]));
        };
      go([], [...Array(n).keys()]);
      return out;
    }
    function clueHolds(perm, c) {
      const pa = perm.indexOf(c.a),
        pb = c.b === undefined ? -1 : perm.indexOf(c.b);
      if (c.k === 'before') return pa < pb;
      if (c.k === 'next') return pb === pa + 1;
      if (c.k === 'at') return pa === c.p;
      return pa !== c.p;
    }
    function makeClues(order, rnd) {
      const n = order.length,
        facts = [],
        pos = id => order.indexOf(id);
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          if (a === b) continue;
          if (pos(a) < pos(b)) facts.push({ k: 'before', a, b });
          if (pos(b) === pos(a) + 1) facts.push({ k: 'next', a, b });
        }
        for (let p = 0; p < n; p++) {
          if (p === pos(a) && (p === 0 || p === n - 1)) facts.push({ k: 'at', a, p });
          if (p !== pos(a)) facts.push({ k: 'not', a, p });
        }
      }
      for (let k = facts.length - 1; k > 0; k--) {
        const j = Math.floor(rnd() * (k + 1));
        [facts[k], facts[j]] = [facts[j], facts[k]];
      }
      let cand = permutations(n);
      const chosen = [];
      for (const f of facts) {
        if (cand.length <= 1) break;
        // Une seule position donnée franchement : le reste se déduit.
        if (f.k === 'at' && chosen.some(c => c.k === 'at')) continue;
        const next = cand.filter(p => clueHolds(p, f));
        if (next.length < cand.length) {
          chosen.push(f);
          cand = next;
        }
      }
      // Retire les indices devenus inutiles.
      for (let k = chosen.length - 1; k >= 0; k--) {
        const rest = chosen.filter((_, j) => j !== k);
        if (permutations(n).filter(p => rest.every(c => clueHolds(p, c))).length === 1) chosen.splice(k, 1);
      }
      return chosen;
    }
    // Rayon des miroirs : une trajectoire tracée dans la salle, un miroir à chaque coude, puis brouillée.
    // Miroir « / » (bit 0) : (dx, dy) → (−dy, −dx) ; « \ » (bit 1) : (dx, dy) → (dy, dx).
    const reflect = (dir, slash) => (slash ? [dir[1], dir[0]] : [-dir[1], -dir[0]]);
    function mirrorPuzzle(room, grid, rnd, free, raid) {
      const b = bounds(room),
        inside = (x, y) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1,
        passable = (x, y) => WALKABLE(grid[y]?.[x]) || grid[y]?.[x] === HAZARD;
      for (let tries = 0; tries < 400; tries++) {
        const turns = (raid ? 3 : 2) + (rnd() < 0.5 ? 1 : 0),
          sx = Math.round(b.x0 + 1 + rnd() * (room.w - 3)),
          sy = Math.round(b.y0 + 1 + rnd() * (room.h - 3));
        if (!free(sx, sy)) continue;
        let dir = D4[Math.floor(rnd() * 4)],
          x = sx,
          y = sy,
          ok = true;
        const cells = new Set([sy * MAPW + sx]),
          mirrors = [],
          emitDir = dir;
        for (let t = 0; t <= turns && ok; t++) {
          const len = 2 + Math.floor(rnd() * 4);
          for (let k = 0; k < len; k++) {
            x += dir[0];
            y += dir[1];
            if (!inside(x, y) || !passable(x, y) || cells.has(y * MAPW + x)) {
              ok = false;
              break;
            }
            cells.add(y * MAPW + x);
          }
          if (!ok) break;
          if (t < turns) {
            if (!free(x, y)) ok = false;
            const left = rnd() < 0.5,
              nd = left ? [dir[1], -dir[0]] : [-dir[1], dir[0]],
              slash = reflect(dir, 1)[0] === nd[0] && reflect(dir, 1)[1] === nd[1] ? 1 : 0;
            mirrors.push({ x, y, good: slash });
            dir = nd;
          } else if (!free(x, y)) ok = false;
        }
        if (!ok) continue;
        // Les cases du rayon et des miroirs restent libres.
        const target = { x, y };
        if (mirrors.some((m, k) => mirrors.some((o, j) => j !== k && Math.hypot(m.x - o.x, m.y - o.y) < 2)))
          continue;
        return { emitter: { x: sx, y: sy, dir: emitDir }, mirrors, target, cells };
      }
      return null;
    }
    // Énigmes : chaque porte de boss est scellée par le mécanisme que l'instance a choisi pour cette aile.
    function placePuzzles(plan, grid, rnd, solid, set) {
      const d = instances[plan.index],
        taken = [],
        okCell = (x, y, room, lanes = true) => {
          const b = bounds(room);
          if (x <= b.x0 || x >= b.x1 || y <= b.y0 || y >= b.y1) return false;
          if (lanes && (Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1)) return false;
          if (grid[y]?.[x] !== FLOOR || plan.reserved.has(y * MAPW + x)) return false;
          if (taken.some(([tx, ty]) => Math.abs(tx - x) < 3 && Math.abs(ty - y) < 3)) return false;
          return D4.every(([dx, dy]) => WALKABLE(grid[y + dy]?.[x + dx]));
        },
        spot = room => {
          const b = bounds(room);
          for (let tries = 0; tries < 300; tries++) {
            const x = Math.round(b.x0 + 1 + rnd() * (room.w - 3)),
              y = Math.round(b.y0 + 1 + rnd() * (room.h - 3));
            // Hors de la croix des couloirs, qui doit rester libre.
            if (!okCell(x, y, room)) continue;
            taken.push([x, y]);
            return { x, y };
          }
          return null;
        },
        solidAt = (x, y) => {
          set(x, y, WALL);
          solid.add(y * MAPW + x);
        },
        stele = (lock, room, s) => {
          const st = spot(room);
          if (!st) return false;
          lock.stele = st;
          solidAt(st.x, st.y);
          plan.props.push({ ...st, kind: lock.type === 'memory' ? 'echostone' : 'stele', lock: s });
          return true;
        };
      for (let s = 0; s < plan.bossCount; s++) {
        const hall = plan.rooms.find(r => r.kind === 'hall' && r.stage === s),
          sides = plan.rooms.filter(r => r.kind === 'side' && r.stage === s),
          type = d.wings[s],
          lock = { type, items: [], order: [], stele: null, room: hall.index };
        plan.locks[s] = lock;
        if (type === 'braziers') {
          // Braseros minutés : une fois le premier allumé, les autres doivent suivre avant qu'il ne s'éteigne.
          const n = d.raid ? 5 : 4,
            order = [...sides, hall];
          for (let k = 0; k < n; k++) {
            const at = spot(order[k % order.length]);
            if (!at) return false;
            lock.items.push({ ...at, id: k });
            solidAt(at.x, at.y);
            plan.props.push({ ...at, kind: 'brazier_off', lock: s, id: k });
          }
          lock.time = d.raid ? 26 : 32;
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'levers' || type === 'runes') {
          const n = type === 'runes' ? 4 : d.raid ? 4 : 3;
          for (let k = 0; k < n; k++) {
            const room = type === 'levers' && sides.length && k === n - 1 ? sides[0] : hall,
              at = spot(room);
            if (!at) return false;
            lock.items.push({ ...at, id: k });
            if (type === 'levers') {
              solidAt(at.x, at.y);
              plan.props.push({ ...at, kind: 'lever', lock: s, id: k });
            } else plan.plates.push({ ...at, lock: s, id: k });
          }
          lock.order = [...Array(n).keys()].sort(() => rnd() - 0.5);
          lock.clues = makeClues(lock.order, rnd);
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'guardian') {
          // Gardiens liés : abattus à quelques secondes d'intervalle, sinon le premier se relève.
          const n = d.raid ? 3 : 2;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2 + 0.6,
              x = Math.round(hall.cx + Math.cos(a) * 3.5),
              y = Math.round(hall.cy + Math.sin(a) * 2.5);
            if (!WALKABLE(grid[y]?.[x])) return false;
            const g = { x, y, lock: s, type: k % 2, id: plan.guardians.length };
            plan.guardians.push(g);
            lock.items.push({ x, y, id: k });
          }
          lock.window = d.raid ? 12 : 15;
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'mirrors') {
          const free = (x, y) => okCell(x, y, hall);
          const mp = mirrorPuzzle(hall, grid, rnd, free, d.raid);
          if (!mp) return false;
          for (const id of mp.cells) plan.reserved.add(id);
          for (const p of [mp.emitter, mp.target, ...mp.mirrors]) taken.push([p.x, p.y]);
          lock.emitter = mp.emitter;
          lock.target = mp.target;
          solidAt(mp.emitter.x, mp.emitter.y);
          solidAt(mp.target.x, mp.target.y);
          plan.props.push({ ...mp.emitter, kind: 'emitter', lock: s });
          plan.props.push({ ...mp.target, kind: 'mtarget', lock: s });
          // Un miroir de trop, qui ne sert à rien : il faut comprendre le trajet, pas tout tourner au hasard.
          const decoy = spot(hall);
          /** @type {any[]} */
          const all = [
            ...mp.mirrors,
            ...(decoy ? [{ ...decoy, good: rnd() < 0.5 ? 1 : 0, decoy: true }] : [])
          ];
          let start = 0,
            solution = 0;
          all.forEach((m, k) => {
            lock.items.push({ x: m.x, y: m.y, id: k, decoy: !!m.decoy });
            solidAt(m.x, m.y);
            plan.props.push({ x: m.x, y: m.y, kind: 'mirror', lock: s, id: k });
            if (m.good) solution |= 1 << k;
          });
          // Brouillé : au moins deux miroirs du trajet sont faux au départ.
          const path = mp.mirrors.map((_, k) => k).sort(() => rnd() - 0.5);
          start = solution;
          for (const k of path.slice(0, Math.max(2, Math.ceil(path.length * 0.6)))) start ^= 1 << k;
          if (decoy && rnd() < 0.5) start ^= 1 << (all.length - 1);
          lock.start = start;
          lock.solution = solution;
          lock.pathMirrors = mp.mirrors.length;
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'memory') {
          // Cristaux d'écho : la pierre joue une suite, il faut frapper les cristaux dans le même ordre.
          for (let k = 0; k < 4; k++) {
            const at = spot(hall);
            if (!at) return false;
            lock.items.push({ ...at, id: k });
            solidAt(at.x, at.y);
            plan.props.push({ ...at, kind: 'echocrystal', lock: s, id: k });
          }
          const len = d.raid ? 6 : 5;
          for (let k = 0; k < len; k++) {
            let v;
            do v = Math.floor(rnd() * 4);
            while (k && v === lock.order[k - 1]);
            lock.order.push(v);
          }
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'toggles') {
          // Piliers liés en anneau : chacun bascule aussi ses deux voisins ; tous doivent briller.
          const n = d.raid ? 7 : 5,
            pts = [];
          for (let k = 0; k < n; k++) {
            const at = spot(hall);
            if (!at) return false;
            pts.push(at);
          }
          pts.sort(
            (a, b) => Math.atan2(a.y - hall.cy, a.x - hall.cx) - Math.atan2(b.y - hall.cy, b.x - hall.cx)
          );
          pts.forEach((at, k) => {
            lock.items.push({ ...at, id: k });
            solidAt(at.x, at.y);
            plan.props.push({ ...at, kind: 'togglepillar', lock: s, id: k });
          });
          const full = (1 << n) - 1;
          let state = full;
          const presses = [...Array(n).keys()].sort(() => rnd() - 0.5).slice(0, d.raid ? 3 : 2);
          for (const p of presses) state ^= toggleMask(p, n);
          if (state === full) state ^= toggleMask(0, n);
          lock.start = state;
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'search') {
          // Urnes : trois fragments du sceau sont cachés dans quelques-unes, réparties dans l'aile.
          const n = d.raid ? 9 : 7,
            rooms = [hall, ...sides];
          for (let k = 0; k < n; k++) {
            const at = spot(rooms[k % rooms.length]);
            if (!at) return false;
            lock.items.push({ ...at, id: k });
            solidAt(at.x, at.y);
            plan.props.push({ ...at, kind: 'urn', lock: s, id: k });
          }
          lock.shards = [...Array(n).keys()].sort(() => rnd() - 0.5).slice(0, 3);
          if (!stele(lock, hall, s)) return false;
        } else if (type === 'ambush') {
          // Embuscade : dès qu'un héros entre, la salle se ferme et trois vagues surgissent.
          lock.items.push({ x: hall.cx, y: hall.cy, id: 0 });
          lock.seals = plan.links
            .filter(l => (l.from === hall.index || l.to === hall.index) && l.door === undefined)
            .map(l => ({ cells: doorCells(hall, l) }));
          lock.waves = d.raid ? [3, 4, 5] : [2, 3, 4];
        } else return false;
        lock.ok = true;
      }
      return true;
    }
    // Pilier j : bascule j et ses deux voisins de l'anneau.
    const toggleMask = (j, n) => (1 << j) | (1 << ((j + 1) % n)) | (1 << ((j + n - 1) % n));
    // Déclencheur de chaque passage secret : une fissure qu'on ne voit que de près, une torche à la flamme d'une autre
    // couleur ou une statue de travers, parfois dans une autre salle de l'aile que le mur qui s'ouvre.
    function placeSecretTriggers(plan, grid, rnd) {
      const kind = plan.theme.secret || 'wall';
      plan.secretWalls.forEach((w, k) => {
        w.kind = kind;
        if (kind === 'wall') return;
        const stage = plan.rooms[w.room].stage,
          rooms = plan.rooms
            .filter(r => r.stage === stage && (r.kind === 'hall' || r.kind === 'side'))
            .sort(() => rnd() - 0.5);
        for (const room of rooms) {
          const b = bounds(room);
          for (let tries = 0; tries < 120; tries++) {
            if (kind === 'torch') {
              const x = Math.round(b.x0 + 1 + rnd() * (room.w - 3));
              if (Math.abs(x - room.cx) <= 2) continue;
              for (let y = b.y0 - 1; y <= room.cy; y++) {
                if (grid[y][x] === WALL && WALKABLE(grid[y + 1]?.[x]) && !plan.solid.has(y * MAPW + x)) {
                  w.trigger = { x, y, wall: true };
                  break;
                }
                if (WALKABLE(grid[y][x])) break;
              }
            } else {
              const x = Math.round(b.x0 + 2 + rnd() * (room.w - 5)),
                y = Math.round(b.y0 + 2 + rnd() * (room.h - 5));
              if (Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1) continue;
              if (grid[y]?.[x] !== FLOOR || plan.reserved.has(y * MAPW + x)) continue;
              if (!D4.every(([dx, dy]) => WALKABLE(grid[y + dy]?.[x + dx]))) continue;
              if (plan.props.some(p => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3)) continue;
              w.trigger = { x, y };
              grid[y][x] = WALL;
              plan.solid.add(y * MAPW + x);
            }
            if (w.trigger) break;
          }
          if (w.trigger) break;
        }
        if (w.trigger) {
          w.trigger.room = rooms.find(r => {
            const b = bounds(r);
            return (
              w.trigger.x >= b.x0 - 1 &&
              w.trigger.x <= b.x1 + 1 &&
              w.trigger.y >= b.y0 - 2 &&
              w.trigger.y <= b.y1
            );
          })?.index;
          plan.props.push({
            x: w.trigger.x,
            y: w.trigger.y,
            kind: kind === 'torch' ? 'secrettorch' : 'secretstatue',
            secretTrigger: k,
            wall: kind === 'torch'
          });
        } else w.kind = 'wall';
      });
    }
    // Pièges du thème : bandes qui barrent des couloirs et plaques dans les salles d'énigme ; vesses de spores.
    function placeTraps(plan, grid, rnd) {
      const trap = plan.theme.trap;
      if (!trap) return;
      const busy = (x, y) =>
        plan.solid.has(y * MAPW + x) ||
        plan.plates.some(p => p.x === x && p.y === y) ||
        plan.props.some(p => !p.wall && Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
      if (TILE_TRAPS.has(trap)) {
        let n = 0;
        for (const link of plan.links) {
          if (link.secret !== undefined || link.gate !== undefined) continue;
          const a = bounds(plan.rooms[link.from]),
            b = bounds(plan.rooms[link.to]),
            inRoom = (x, y, r) => x >= r.x0 - 1 && x <= r.x1 + 1 && y >= r.y0 - 1 && y <= r.y1 + 1,
            cells = [];
          eachPathCell(link.points, (x, y) => !inRoom(x, y, a) && !inRoom(x, y, b) && cells.push([x, y]));
          if (cells.length < 3) continue;
          const [x, y] = cells[Math.floor(cells.length / 2)],
            horizontal = link.dir === 'E' || link.dir === 'W',
            band = [];
          for (let o = -1; o <= 1; o++) {
            const cx = horizontal ? x : x + o,
              cy = horizontal ? y + o : y;
            if (WALKABLE(grid[cy]?.[cx])) band.push([cx, cy]);
          }
          if (band.length) plan.traps.push({ cells: band, phase: (n++ * 47) % TRAP_CYCLE.period });
        }
        // Plaques de deux cases sur deux dans les salles d'énigme et les annexes, hors des allées centrales.
        for (const room of plan.rooms) {
          if (room.kind !== 'hall' && room.kind !== 'side') continue;
          if (plan.locks[room.stage]?.type === 'runes' && room.kind === 'hall') continue;
          const b = bounds(room);
          for (let k = 0, tries = 0; k < (room.kind === 'hall' ? 2 : 1) && tries < 60; tries++) {
            const x = Math.round(b.x0 + 1 + rnd() * (room.w - 4)),
              y = Math.round(b.y0 + 1 + rnd() * (room.h - 4)),
              cells = [
                [x, y],
                [x + 1, y],
                [x, y + 1],
                [x + 1, y + 1]
              ];
            if (cells.some(([cx, cy]) => Math.abs(cx - room.cx) <= 1 || Math.abs(cy - room.cy) <= 1))
              continue;
            if (cells.some(([cx, cy]) => !WALKABLE(grid[cy]?.[cx]) || busy(cx, cy))) continue;
            plan.traps.push({ cells, phase: Math.floor(rnd() * TRAP_CYCLE.period) });
            k++;
          }
        }
      } else if (trap === 'spores') {
        for (const room of plan.rooms) {
          if (room.kind !== 'hall' && room.kind !== 'side') continue;
          const b = bounds(room);
          for (let k = 0, tries = 0; k < 2 && tries < 60; tries++) {
            const x = Math.round(b.x0 + 1 + rnd() * (room.w - 3)),
              y = Math.round(b.y0 + 1 + rnd() * (room.h - 3));
            if (Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1) continue;
            if (grid[y]?.[x] !== FLOOR || busy(x, y)) continue;
            plan.puffs.push({ x, y, phase: Math.floor(rnd() * 300) });
            plan.props.push({ x, y, kind: 'puffball' });
            k++;
          }
        }
      }
    }
    function decorate(plan, grid, rnd, solid, set) {
      const th = plan.theme,
        d = instances[plan.index],
        free = (x, y) =>
          grid[y]?.[x] === FLOOR &&
          !plan.reserved.has(y * MAPW + x) &&
          !plan.props.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2) &&
          !plan.plates.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2);
      const addProp = (x, y, kind, extra = {}) => {
        plan.props.push({ x, y, kind, ...extra });
        if (SOLID_PROPS.has(kind)) {
          set(x, y, WALL);
          solid.add(y * MAPW + x);
        }
      };
      plan.rooms.forEach((room, k) => {
        const b = bounds(room),
          hidden = room.kind === 'secret' ? room.secret : undefined;
        // Torches, bannières et veines de mithril sur le mur du fond.
        if (th.wallProps.length)
          for (let x = b.x0 + 1, n = k; x <= b.x1 - 1; x += 3) {
            if (Math.abs(x - room.cx) <= 2) continue;
            for (let y = b.y0 - 1; y <= room.cy; y++) {
              if (
                grid[y][x] === WALL &&
                WALKABLE(grid[y + 1]?.[x]) &&
                !solid.has(y * MAPW + x) &&
                !plan.secretWalls.some(w => w.trigger && Math.abs(w.trigger.x - x) < 2 && w.trigger.y === y)
              ) {
                plan.props.push({ x, y, kind: th.wallProps[n++ % th.wallProps.length], wall: true, hidden });
                break;
              }
              if (WALKABLE(grid[y][x])) break;
            }
          }
        // Colonnes des grandes salles, symétriques, hors des portes (pas dans les salles d'énigme, qui ont besoin de
        // toute leur place).
        if (
          (th.shape === 'hall' || th.shape === 'void') &&
          room.w >= 13 &&
          room.h >= 11 &&
          room.kind !== 'entry' &&
          room.kind !== 'hall'
        ) {
          const kind =
            th.floorProps.includes('pillarlight') && room.kind === 'boss' ? 'pillarlight' : 'pillar';
          for (let y = b.y0 + 3; y <= b.y1 - 3; y += 4)
            if (Math.abs(y - room.cy) > 2)
              for (const x of [b.x0 + 3, b.x1 - 3])
                if (free(x, y) && grid[y][x] === FLOOR) addProp(x, y, kind, { hidden });
        }
        if (room.kind === 'entry') {
          plan.decals.push({ x: DUNGEON_ENTRY.x, y: DUNGEON_ENTRY.y, kind: 'portal' });
          plan.title = { x: room.cx, y: b.y0 - 0.6 };
          return;
        }
        // Objets au sol, hors de la croix centrale où passent le joueur et les monstres.
        const count = Math.floor(
          (room.w * room.h) / (room.kind === 'boss' ? 34 : room.kind === 'hall' ? 40 : 24)
        );
        for (let n = 0, tries = 0; n < count && tries < 80; tries++) {
          const x = b.x0 + 1 + Math.floor(rnd() * (room.w - 2)),
            y = b.y0 + 1 + Math.floor(rnd() * (room.h - 2));
          if (Math.abs(x - room.cx) <= 2 || Math.abs(y - room.cy) <= 2 || !free(x, y)) continue;
          if ((room.kind === 'boss' || room.kind === 'secret') && Math.hypot(x - room.cx, y - room.cy) < 5)
            continue;
          // Jamais collé à un passage secret : il doit rester dégagé.
          if (
            plan.secretWalls.some(w =>
              w.cells.some(([cx, cy]) => Math.abs(cx - x) < 3 && Math.abs(cy - y) < 3)
            )
          )
            continue;
          const kind = th.floorProps[Math.floor(rnd() * th.floorProps.length)];
          // Le brasero de décor ne se confond pas avec ceux d'une énigme.
          if (kind === 'brazier' && plan.locks[room.stage]?.type === 'braziers') continue;
          addProp(x, y, kind, { hidden });
          n++;
        }
        if (th.hazard.style === 'blood' || th.key === 'fosse')
          for (let n = 0; n < 3; n++)
            plan.decals.push({
              x: b.x0 + 1 + rnd() * (room.w - 2),
              y: b.y0 + 1 + rnd() * (room.h - 2),
              kind: 'splat',
              hidden
            });
        if (room.kind === 'boss' || room.kind === 'secret') {
          // Pièce maîtresse sur un côté sans porte, de préférence face à l'entrée.
          const entry = room.doors[0],
            sides = [OPPOSITE[entry], 'N', 'E', 'W', 'S'].filter(s => !room.doors.includes(s)),
            side = sides[0] || 'N',
            [sx, sy] = STEP[side],
            px = room.cx + sx * ((room.w - 1) / 2 - 2),
            py = room.cy + sy * ((room.h - 1) / 2 - 2);
          plan.props.push({
            x: px,
            y: py,
            kind: room.kind === 'secret' ? 'treasure' : th.centerpiece,
            center: room.kind === 'boss',
            hidden
          });
          for (let o = -1; o <= 1; o++) {
            const cx = px + (sy ? o : 0),
              cy = py + (sx ? o : 0);
            if (grid[cy][cx] !== HAZARD) {
              set(cx, cy, WALL);
              solid.add(cy * MAPW + cx);
            }
          }
          plan.decals.push({
            x: room.cx,
            y: room.cy,
            kind: room.kind === 'secret' ? 'runecircle' : th.decal || 'runecircle',
            boss: room.stage,
            hidden
          });
          room.boss = { x: room.cx + sx * 2, y: room.cy + sy * 2 };
          room.chest = { x: room.cx + 0.5, y: room.cy + 0.5 };
          // Gardes du boss dans les raids.
          if (room.kind === 'boss' && d.raid)
            for (const o of [-3, 3])
              plan.trash.push({
                x: room.boss.x + (sy ? o : -sx * 2),
                y: room.boss.y + (sx ? o : -sy * 2),
                type: o < 0 ? 0 : 1
              });
          return;
        }
        // Pas de monstres dans la salle d'une embuscade : ils surgissent.
        if (plan.locks[room.stage]?.type === 'ambush' && room.kind === 'hall') return;
        // Groupes d'ennemis dans les salles d'énigme et les annexes, plus nombreux au fil des instances ; un chef
        // (élite) mène le groupe de chaque salle d'énigme.
        const share = (room.kind === 'hall' ? 3 : 2) + Math.floor(plan.index / 5) + (d.raid ? 1 : 0);
        for (let n = 0, tries = 0; n < share && tries < 60; tries++) {
          const a = rnd() * Math.PI * 2,
            rr = 1.5 + rnd() * Math.min(room.w, room.h) * 0.28,
            x = Math.round(room.cx + Math.cos(a) * rr),
            y = Math.round(room.cy + Math.sin(a) * rr);
          if (!WALKABLE(grid[y]?.[x]) || plan.trash.some(t => t.x === x && t.y === y)) continue;
          plan.trash.push({ x, y, type: plan.trash.length % 2, elite: room.kind === 'hall' && n === 0 });
          n++;
        }
      });
    }
    // Grille de l'instance : murs, sols, dangers et herses fermées.
    function makeDungeon(index) {
      const plan = planFor(index);
      return plan.grid.map(row => row.slice());
    }
    function planFor(index) {
      if (index === 'arena') return planArena();
      return instances[index] ? planDungeon(index) : null;
    }
    // Plan du colisée, au même format que celui d'un donjon : le rendu des instances le dessine tel quel.
    function planArena() {
      if (PLANS.arena) return PLANS.arena;
      const th = THEMES.arena,
        { cx, cy, r, gateY } = DUNGEON_ARENA,
        grid = Array.from({ length: MAPH }, () => Array(MAPW).fill(WALL)),
        solid = new Set(),
        plan = {
          index: 'arena',
          arena: true,
          theme: th,
          rooms: [],
          links: [],
          gates: [],
          bossCount: 12,
          props: [],
          decals: [],
          lights: [],
          trash: [],
          traps: [],
          puffs: [],
          solid
        };
      for (let y = cy - 14; y <= cy + 14; y++)
        for (let x = cx - 14; x <= cx + 14; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r) grid[y][x] = d > r - 1.1 ? ACCENT : FLOOR;
        }
      for (let y = cy + 11; y <= DUNGEON_ENTRY.y - 3; y++)
        for (let x = cx - 2; x <= cx + 2; x++) grid[y][x] = FLOOR;
      for (let y = DUNGEON_ENTRY.y - 3; y <= DUNGEON_ENTRY.y + 3; y++)
        for (let x = cx - 5; x <= cx + 5; x++) grid[y][x] = FLOOR;
      const solidProp = (x, y, kind) => {
        plan.props.push({ x, y, kind });
        grid[y][x] = WALL;
        solid.add(y * MAPW + x);
      };
      // Bannières et torches sur le mur de la piste, côté nord.
      let n = 0;
      for (let x = cx - 11; x <= cx + 11; x += 2) {
        if (Math.abs(x - cx) <= 1) continue;
        for (let y = cy - 15; y < cy; y++)
          if (grid[y][x] === WALL && grid[y + 1][x] !== WALL) {
            plan.props.push({ x, y, kind: th.wallProps[n++ % 2], wall: true });
            break;
          }
      }
      // Loge d'honneur : deux statues ; quatre braseros sur les diagonales ; râteliers dans l'antichambre.
      solidProp(cx - 3, cy - 11, 'statue');
      solidProp(cx + 3, cy - 11, 'statue');
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ])
        solidProp(cx + sx * 8, cy + sy * 8, 'brazier');
      solidProp(cx - 5, DUNGEON_ENTRY.y - 3, 'rack');
      solidProp(cx + 5, DUNGEON_ENTRY.y - 3, 'rack');
      plan.props.push({ x: cx - 5, y: DUNGEON_ENTRY.y + 2, kind: 'crate' });
      plan.decals.push({ x: DUNGEON_ENTRY.x, y: DUNGEON_ENTRY.y, kind: 'portal' });
      plan.decals.push({ x: cx, y: cy, kind: 'runecircle' });
      plan.lights.push({ x: cx + 0.5, y: cy + 0.5, r: 520, col: '#ffe2b0' });
      plan.title = { x: cx, y: DUNGEON_ENTRY.y - 4.4 };
      // Herse de la piste : ouverte entre les vagues, fermée pendant les combats (canaan-arena).
      const cells = [];
      for (let x = cx - 2; x <= cx + 2; x++) cells.push([x, gateY]);
      plan.gates.push({ cells, under: cells.map(() => FLOOR), dir: 'N' });
      plan.grid = grid;
      PLANS.arena = plan;
      return plan;
    }
    // Géométrie de la piste pour canaan-arena : centre et rayon en pixels, cases de la herse.
    function arenaLayout() {
      const plan = planArena();
      return {
        x: (DUNGEON_ARENA.cx + 0.5) * TS,
        y: (DUNGEON_ARENA.cy + 0.5) * TS,
        r: DUNGEON_ARENA.r * TS,
        gate: plan.gates[0].cells.map(([x, y]) => [x, y]),
        entry: { x: DUNGEON_ENTRY.x * TS, y: DUNGEON_ENTRY.y * TS }
      };
    }

    return Object.freeze({
      reflect,
      placePuzzles,
      toggleMask,
      placeSecretTriggers,
      placeTraps,
      decorate,
      makeDungeon,
      planFor,
      arenaLayout
    });
  }
  window.CANAAN_DUNGEON_BUILD = Object.freeze({ create });
})();
