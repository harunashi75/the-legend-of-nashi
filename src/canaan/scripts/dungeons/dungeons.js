// Donjons et raids : plan, décor posé, éclairage, ennemis et boss de chaque instance, fidèles à son nom.
// Des explorations : un donjon a trois boss, un raid six ; chaque boss attend derrière une porte scellée par une
// énigme de son aile (braseros, leviers, dalles gravées ou gardiens du sceau), et des murs fissurés cachent les salles
// des boss secrets, qui donnent les clés des coffres secrets de l'île.
// Structure et créatures de chaque instance : shared/data/dungeons.js ; tout le dessin : scripts/dungeons/render.js.
(() => {
  'use strict';
  const WALL = 9,
    GATE = 19,
    FLOOR = 20,
    ACCENT = 21,
    HAZARD = 22,
    // Mur fissuré d'un passage secret : bloque jusqu'à ce qu'un héros le découvre (E).
    SECRET = 23;

  const WALKABLE = t => t === FLOOR || t === ACCENT;
  // Thèmes de la logique : structure et créatures de chaque instance (shared/data/dungeons.js), sans leur apparence.
  const THEMES = DUNGEON_LAYOUTS.map((layout, i) => ({ ...layout, ...DUNGEON_ACTORS[i] }));
  THEMES.arena = { ...DUNGEON_ARENA_LAYOUT, mobs: [], bosses: [] };

  // Objets posés au sol qui bloquent le passage ; les autres sont décoratifs.
  const SOLID_PROPS = new Set(DUNGEON_SOLID_PROPS);

  // ---------------------------------------------------------------- Plans d'exploration
  // Chaque instance est un réseau de salles : l'entrée, puis une aile par boss (salle de passage, salles annexes,
  // énigme qui scelle la porte du boss), la salle du boss, et derrière des murs fissurés les salles des boss cachés.
  // Les salles sont posées sur une grille de cases de 30 × 24 tuiles (une salle par case) et reliées seulement entre
  // cases voisines : aucun couloir ne traverse une autre salle. Le plan est le même à chaque entrée (graine fixe).
  function seeded(i) {
    let s = (i + 1) * 9973 + 17;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }
  const PLANS = [];
  const bounds = r => ({
    x0: r.cx - (r.w - 1) / 2,
    x1: r.cx + (r.w - 1) / 2,
    y0: r.cy - (r.h - 1) / 2,
    y1: r.cy + (r.h - 1) / 2
  });
  const STEP = { N: [0, -1], E: [1, 0], W: [-1, 0], S: [0, 1] };
  const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const CELL = { w: 30, h: 24, ox: 15, oy: 23, cols: 12, rows: 15 };
  // Mécanismes qui scellent la porte d'un boss, en alternance d'une aile à l'autre.
  const LOCKS = ['braziers', 'levers', 'runes', 'guardian'];
  const SIGILS = [
    { sym: '☀', name: 'le Soleil', col: '#ffcf4a' },
    { sym: '☾', name: 'la Lune', col: '#b8c8ff' },
    { sym: '★', name: 'l’Étoile', col: '#fff0a8' },
    { sym: '◆', name: 'le Cristal', col: '#7de0ff' }
  ];
  // Dessin (scripts/dungeons/render.js) : la scène donne les cases, les plans, l'état de l'exploration et les sorties.
  const ART = CANAAN_DUNGEON_RENDER.create({
    WALL,
    GATE,
    FLOOR,
    ACCENT,
    HAZARD,
    SECRET,
    WALKABLE,
    SIGILS,
    exitSpot,
    exitNear,
    planFor,
    dunState,
    reachable
  });
  function corridorPoints(a, b, dir) {
    if (dir === 'N' || dir === 'S') {
      const my = Math.round((a.cy + b.cy) / 2);
      return [
        [a.cx, a.cy],
        [a.cx, my],
        [b.cx, my],
        [b.cx, b.cy]
      ];
    }
    const mx = Math.round((a.cx + b.cx) / 2);
    return [
      [a.cx, a.cy],
      [mx, a.cy],
      [mx, b.cy],
      [b.cx, b.cy]
    ];
  }
  function eachPathCell(points, fn) {
    for (let k = 1; k < points.length; k++) {
      let [x, y] = points[k - 1];
      const [tx, ty] = points[k];
      fn(x, y);
      while (x !== tx || y !== ty) {
        x += Math.sign(tx - x);
        y += Math.sign(ty - y);
        fn(x, y);
      }
    }
  }
  // Réseau de salles sur la grille de cases ; null si le tirage se coince (on retente avec une autre graine).
  function layout(d, rnd) {
    const B = d.raid ? 6 : 3,
      secretWings = d.raid ? [1, 4] : [1],
      taken = new Map(),
      rooms = [],
      links = [],
      key = (c, r) => c + ',' + r,
      free = (c, r) => c >= 0 && r >= 0 && c < CELL.cols && r < CELL.rows && !taken.has(key(c, r)),
      shuffle = a => {
        for (let k = a.length - 1; k > 0; k--) {
          const j = Math.floor(rnd() * (k + 1));
          [a[k], a[j]] = [a[j], a[k]];
        }
        return a;
      },
      around = room =>
        shuffle(Object.entries(STEP).map(([dir, [dx, dy]]) => [dir, room.c + dx, room.r + dy])).filter(
          ([, c, r]) => free(c, r)
        ),
      add = (kind, c, r, extra) => {
        const room = { kind, c, r, ...extra };
        taken.set(key(c, r), room);
        rooms.push(room);
        return room;
      },
      link = (a, b, dir, extra = {}) =>
        links.push({ from: rooms.indexOf(a), to: rooms.indexOf(b), dir, ...extra });
    let cur = add('entry', 3, 4, { stage: -1 }),
      reserved = null;
    for (let s = 0; s < B; s++) {
      const hubs = [],
        nHubs = 1 + (rnd() < (d.raid ? 0.3 : 0.55) ? 1 : 0);
      for (let h = 0; h < nHubs; h++) {
        let at;
        if (reserved) {
          taken.delete(key(reserved[1], reserved[2]));
          at = reserved;
          reserved = null;
        } else at = around(cur)[0];
        if (!at) return null;
        const hub = add('hub', at[1], at[2], { stage: s });
        link(cur, hub, at[0], cur.kind === 'boss' ? { gate: cur.stage } : {});
        hubs.push(hub);
        cur = hub;
      }
      // Salle du boss : une case voisine du dernier hub qui garde une case libre pour l'aile suivante.
      let bossAt = null,
        next = null;
      for (const opt of around(cur)) {
        taken.set(key(opt[1], opt[2]), 1);
        const after = s === B - 1 ? [] : around({ c: opt[1], r: opt[2] });
        taken.delete(key(opt[1], opt[2]));
        if (s === B - 1 || after.length) {
          bossAt = opt;
          next = after[0] || null;
          break;
        }
      }
      if (!bossAt) return null;
      const boss = add('boss', bossAt[1], bossAt[2], { stage: s });
      link(cur, boss, bossAt[0], { door: s });
      if (next) {
        reserved = next;
        taken.set(key(next[1], next[2]), 'réservée');
      }
      // Salles annexes de l'aile, accrochées aux salles de passage (ou à une autre annexe).
      const nSides = d.raid ? 1 + (s % 2) : 2;
      for (let k = 0; k < nSides; k++) {
        const hosts = shuffle([...hubs, ...rooms.filter(r => r.kind === 'side' && r.stage === s)]);
        const host = hosts.find(h => around(h).length);
        if (!host) break;
        const at = around(host)[0],
          side = add('side', at[1], at[2], { stage: s });
        link(host, side, at[0]);
      }
      if (!rooms.some(r => r.kind === 'side' && r.stage === s)) return null;
      // Passage secret : une salle cachée derrière le mur d'une annexe de cette aile.
      const sk = secretWings.indexOf(s);
      if (sk >= 0) {
        const host = shuffle(rooms.filter(r => r.kind === 'side' && r.stage === s)).find(
          h => around(h).length
        );
        if (!host) return null;
        const at = around(host)[0],
          room = add('secret', at[1], at[2], { stage: s, secret: sk });
        link(host, room, at[0], { secret: sk });
      }
      cur = boss;
    }
    return { rooms, links };
  }
  // Taille et position de chaque salle dans sa case.
  function sizeRooms(d, rooms, rnd) {
    const odd = (lo, hi) => lo + 2 * Math.floor(rnd() * ((hi - lo) / 2 + 1)),
      B = d.raid ? 6 : 3;
    for (const room of rooms) {
      if (room.kind === 'entry') {
        Object.assign(room, { w: 11, h: 9, cx: DUNGEON_ENTRY.x, cy: DUNGEON_ENTRY.y - 2 });
        continue;
      }
      const final = room.kind === 'boss' && room.stage === B - 1;
      if (room.kind === 'hub') Object.assign(room, { w: odd(13, 17), h: odd(11, 13) });
      else if (room.kind === 'side') Object.assign(room, { w: odd(11, 15), h: odd(9, 11) });
      else if (room.kind === 'secret') Object.assign(room, { w: 15, h: 13 });
      else
        Object.assign(
          room,
          d.raid ? (final ? { w: 27, h: 21 } : { w: 23, h: 17 }) : final ? { w: 23, h: 17 } : { w: 21, h: 15 }
        );
      const mx = Math.max(0, Math.floor((CELL.w - room.w) / 2) - 2),
        my = Math.max(0, Math.floor((CELL.h - room.h) / 2) - 2);
      room.cx = CELL.ox + room.c * CELL.w + 15 + Math.round((rnd() * 2 - 1) * mx);
      room.cy = CELL.oy + room.r * CELL.h + 12 + Math.round((rnd() * 2 - 1) * my);
    }
  }
  // Les trois cases d'un couloir juste à la sortie d'une salle (porte, herse ou mur secret).
  function doorCells(room, link) {
    const pts = link.points,
      b = bounds(room),
      cells = [];
    const order = [];
    eachPathCell(pts, (x, y) => order.push([x, y]));
    if (link.to === room.index) order.reverse();
    for (let k = 1; k < order.length; k++) {
      const [x, y] = order[k];
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) continue;
      const horizontal = order[k][1] === order[k - 1][1];
      for (let o = -1; o <= 1; o++) cells.push(horizontal ? [x, y + o] : [x + o, y]);
      break;
    }
    return cells;
  }
  function planDungeon(i) {
    if (PLANS[i]) return PLANS[i];
    const d = instances[i];
    for (let attempt = 0; attempt < 400; attempt++) {
      const rnd = seeded(i * 1000 + attempt),
        net = layout(d, rnd);
      if (!net) continue;
      const plan = buildPlan(i, net, rnd);
      if (plan && validPlan(plan)) {
        PLANS[i] = plan;
        return plan;
      }
    }
    throw new Error('Plan introuvable pour ' + d.name);
  }
  function buildPlan(i, net, rnd) {
    const d = instances[i],
      th = THEMES[i],
      { rooms, links } = net;
    sizeRooms(d, rooms, rnd);
    rooms.forEach((r, k) => (r.index = k));
    for (const l of links) l.points = corridorPoints(rooms[l.from], rooms[l.to], l.dir);
    for (const room of rooms)
      room.doors = links
        .filter(l => l.from === room.index || l.to === room.index)
        .map(l => (l.from === room.index ? l.dir : OPPOSITE[l.dir]));
    const B = d.raid ? 6 : 3,
      plan = {
        index: i,
        theme: th,
        rooms,
        links,
        gates: [],
        doors: [],
        secretWalls: [],
        locks: [],
        plates: [],
        guardians: [],
        bossCount: B,
        secretCount: rooms.filter(r => r.kind === 'secret').length,
        props: [],
        decals: [],
        lights: [],
        trash: []
      };
    for (const l of links) {
      if (l.gate !== undefined) plan.gates[l.gate] = { cells: doorCells(rooms[l.from], l), dir: l.dir };
      if (l.door !== undefined)
        plan.doors[l.door] = { cells: doorCells(rooms[l.to], l), dir: l.dir, room: l.to };
      if (l.secret !== undefined)
        plan.secretWalls[l.secret] = { cells: doorCells(rooms[l.from], l), dir: l.dir, room: l.to };
    }
    plan.grid = carve(plan, i, rnd);
    return plan;
  }
  // Vérification d'un plan : chaque énigme est faisable avant sa porte, aucun boss n'est accessible avant d'avoir
  // ouvert sa porte, les salles cachées restent fermées tant que leur mur n'est pas découvert.
  function reachFrom(plan, open) {
    const grid = plan.grid,
      seen = new Set([DUNGEON_ENTRY.y * MAPW + DUNGEON_ENTRY.x]),
      queue = [[DUNGEON_ENTRY.x, DUNGEON_ENTRY.y]];
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nx = x + dx,
          ny = y + dy,
          id = ny * MAPW + nx;
        if (seen.has(id) || !(WALKABLE(grid[ny]?.[nx]) || open.has(id))) continue;
        seen.add(id);
        queue.push([nx, ny]);
      }
    }
    return seen;
  }
  const near = (seen, x, y) =>
    [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ].some(([dx, dy]) => seen.has((y + dy) * MAPW + x + dx));
  function openings(list) {
    const out = new Set();
    for (const g of list) if (g) for (const [x, y] of g.cells) out.add(y * MAPW + x);
    return out;
  }
  function validPlan(plan) {
    const bossRooms = plan.rooms.filter(r => r.kind === 'boss'),
      secretRooms = plan.rooms.filter(r => r.kind === 'secret');
    if (
      plan.gates.filter(Boolean).length !== plan.bossCount - 1 ||
      plan.doors.filter(Boolean).length !== plan.bossCount
    )
      return false;
    if ([...plan.gates, ...plan.doors, ...plan.secretWalls].some(g => g && g.cells.length < 2)) return false;
    for (let s = 0; s < plan.bossCount; s++) {
      const before = reachFrom(plan, openings([...plan.gates.slice(0, s), ...plan.doors.slice(0, s)])),
        lock = plan.locks[s],
        boss = bossRooms[s].boss;
      if (!lock || !lock.ok || !lock.items.every(it => near(before, it.x, it.y))) return false;
      if (near(before, boss.x, boss.y)) return false;
      const after = reachFrom(plan, openings([...plan.gates.slice(0, s), ...plan.doors.slice(0, s + 1)]));
      if (!near(after, boss.x, boss.y)) return false;
    }
    const all = openings([...plan.gates, ...plan.doors]),
      closed = reachFrom(plan, all);
    if (secretRooms.some(r => near(closed, r.boss.x, r.boss.y))) return false;
    if (!plan.secretWalls.every(w => w.cells.some(([x, y]) => near(closed, x, y)))) return false;
    const open = reachFrom(plan, openings([...plan.gates, ...plan.doors, ...plan.secretWalls]));
    return (
      secretRooms.every(r => near(open, r.boss.x, r.boss.y)) &&
      plan.trash.every(t => open.has(t.y * MAPW + t.x)) &&
      plan.guardians.every(g => open.has(g.y * MAPW + g.x))
    );
  }
  function carve(plan, i, rnd) {
    const th = plan.theme,
      grid = Array.from({ length: MAPH }, () => Array(MAPW).fill(th.shape === 'void' ? HAZARD : WALL)),
      inMap = (x, y) => x > 2 && y > 2 && x < MAPW - 3 && y < MAPH - 3,
      set = (x, y, t) => inMap(x, y) && (grid[y][x] = t),
      solid = new Set();
    plan.solid = solid;
    // Salles selon la forme du thème.
    for (const room of plan.rooms) {
      const b = bounds(room),
        rx = (room.w - 1) / 2,
        ry = (room.h - 1) / 2;
      for (let y = b.y0; y <= b.y1; y++)
        for (let x = b.x0; x <= b.x1; x++) {
          const dx = (x - room.cx) / (rx + 0.5),
            dy = (y - room.cy) / (ry + 0.5),
            e = dx * dx + dy * dy,
            cross = Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1;
          let inside = true;
          if (th.shape === 'cave') inside = e < 0.72 + field(x, y, 3.2, i + 40) * 0.42 || (cross && e < 1.05);
          else if (th.shape === 'pit') inside = e < 1.02 || (cross && e < 1.3);
          else if (th.shape === 'void') {
            const cut = Math.floor(Math.min(room.w, room.h) / 4);
            inside = Math.min(x - b.x0, b.x1 - x) + Math.min(y - b.y0, b.y1 - y) >= cut;
          }
          if (inside) set(x, y, FLOOR);
        }
    }
    // Couloirs de trois cases (ponts au-dessus du vide pour les thèmes célestes).
    for (const link of plan.links)
      eachPathCell(link.points, (x, y) => {
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            const jag =
              th.shape === 'cave' && Math.abs(ox) + Math.abs(oy) === 2 && hash(x + ox, y + oy, i) < 0.4;
            if (!jag && grid[y + oy]?.[x + ox] !== FLOOR) set(x + ox, y + oy, FLOOR);
          }
      });
    // Dangers : mares, coulées, gouffres ou sang, toujours hors du passage central.
    for (const room of plan.rooms) {
      if (room.kind === 'entry') continue;
      const b = bounds(room),
        count = th.hazard.pools + (room.kind === 'boss' && th.hazard.pools ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const px = b.x0 + 2 + Math.floor(rnd() * (room.w - 4)),
          py = b.y0 + 2 + Math.floor(rnd() * (room.h - 4)),
          rad = 1.2 + rnd() * 1.4;
        let placed = 0;
        for (let y = Math.floor(py - rad); y <= py + rad; y++)
          for (let x = Math.floor(px - rad); x <= px + rad; x++) {
            if (Math.hypot(x - px, y - py) > rad) continue;
            if (Math.abs(x - room.cx) <= 2 || Math.abs(y - room.cy) <= 2) continue;
            if (grid[y]?.[x] !== FLOOR) continue;
            set(x, y, HAZARD);
            placed++;
          }
        if (placed && th.hazard.glow)
          plan.lights.push({ x: px + 0.5, y: py + 0.5, r: 150, col: th.hazard.glow });
      }
      // La Fosse : un anneau de gouffre autour de l'arène, franchi par quatre passerelles.
      if (th.shape === 'pit' && room.kind === 'boss') {
        const rx = (room.w - 1) / 2,
          ry = (room.h - 1) / 2;
        for (let y = b.y0; y <= b.y1; y++)
          for (let x = b.x0; x <= b.x1; x++) {
            const dx = (x - room.cx) / rx,
              dy = (y - room.cy) / ry,
              e = Math.sqrt(dx * dx + dy * dy);
            if (e > 0.62 && e < 0.8 && Math.abs(x - room.cx) > 1 && Math.abs(y - room.cy) > 1)
              set(x, y, HAZARD);
          }
      }
    }
    // Tapis, rails, runes ou passerelles le long des couloirs (jamais vers un passage secret, qui se trahirait).
    for (const link of plan.links)
      if (link.secret === undefined)
        eachPathCell(link.points, (x, y) => {
          const aw = th.accent.width;
          for (let oy = -aw; oy <= aw; oy++)
            for (let ox = -aw; ox <= aw; ox++)
              if (grid[y + oy]?.[x + ox] === FLOOR) set(x + ox, y + oy, ACCENT);
        });
    placePuzzles(plan, grid, rnd, solid, set);
    decorate(plan, grid, rnd, solid, set);
    // Herses de sortie et portes scellées fermées ; murs fissurés des passages secrets.
    for (const g of [...plan.gates, ...plan.doors]) {
      if (!g) continue;
      g.cells = g.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
      g.under = g.cells.map(([x, y]) => grid[y][x]);
      g.cells.forEach(([x, y]) => set(x, y, GATE));
    }
    for (const g of plan.secretWalls) {
      g.cells = g.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
      g.under = g.cells.map(([x, y]) => grid[y][x]);
      g.cells.forEach(([x, y]) => set(x, y, SECRET));
    }
    return grid;
  }
  // Énigmes : chaque porte de boss est scellée par un mécanisme posé dans son aile.
  function placePuzzles(plan, grid, rnd, solid, set) {
    const d = instances[plan.index],
      taken = [],
      spot = room => {
        const b = bounds(room);
        for (let tries = 0; tries < 200; tries++) {
          const x = Math.round(b.x0 + 1 + rnd() * (room.w - 3)),
            y = Math.round(b.y0 + 1 + rnd() * (room.h - 3));
          // Hors de la croix des couloirs, qui doit rester libre.
          if (Math.abs(x - room.cx) <= 1 || Math.abs(y - room.cy) <= 1) continue;
          if (
            grid[y]?.[x] !== FLOOR ||
            taken.some(([tx, ty]) => Math.abs(tx - x) < 3 && Math.abs(ty - y) < 3)
          )
            continue;
          if (
            ![
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1]
            ].every(([dx, dy]) => WALKABLE(grid[y + dy]?.[x + dx]))
          )
            continue;
          taken.push([x, y]);
          return { x, y };
        }
        return null;
      },
      solidAt = (x, y) => {
        set(x, y, WALL);
        solid.add(y * MAPW + x);
      };
    for (let s = 0; s < plan.bossCount; s++) {
      const wing = plan.rooms.filter(r => r.stage === s && (r.kind === 'hub' || r.kind === 'side')),
        sides = wing.filter(r => r.kind === 'side'),
        hub = wing.find(r => r.kind === 'hub'),
        type = LOCKS[(plan.index + s) % LOCKS.length],
        n = d.raid ? 4 : 3,
        lock = { type, items: [], order: [], stele: null };
      plan.locks[s] = lock;
      if (type === 'braziers' || type === 'levers') {
        // Répartis dans toutes les salles de l'aile, annexes d'abord.
        const order = [...sides, ...wing.filter(r => r.kind === 'hub')];
        for (let k = 0; k < n; k++) {
          const at = spot(order[k % order.length]);
          if (!at) return;
          lock.items.push({ ...at, id: k, sym: k });
          solidAt(at.x, at.y);
          plan.props.push({ ...at, kind: type === 'braziers' ? 'brazier_off' : 'lever', lock: s, id: k });
        }
        if (type === 'levers') {
          lock.order = [...Array(n).keys()].sort(() => rnd() - 0.5);
          const st = spot(hub);
          if (!st) return;
          lock.stele = st;
          solidAt(st.x, st.y);
          plan.props.push({ ...st, kind: 'stele', lock: s });
        }
        lock.ok = true;
      } else if (type === 'runes') {
        // Quatre dalles gravées dans une même salle ; la stèle donne l'ordre.
        const room = sides.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0] || hub;
        for (let k = 0; k < 4; k++) {
          const at = spot(room);
          if (!at) return;
          lock.items.push({ ...at, id: k, sym: k });
          plan.plates.push({ ...at, lock: s, id: k });
        }
        lock.order = [0, 1, 2, 3].sort(() => rnd() - 0.5);
        const st = spot(room);
        if (!st) return;
        lock.stele = st;
        solidAt(st.x, st.y);
        plan.props.push({ ...st, kind: 'stele', lock: s });
        lock.ok = true;
      } else {
        // Gardiens du sceau : un par annexe (deux au plus), au centre de la salle.
        for (const room of sides.slice(0, 2)) {
          const g = { x: room.cx + 1, y: room.cy, lock: s, type: plan.guardians.length % 2 };
          plan.guardians.push(g);
          lock.items.push({ x: g.x, y: g.y, id: lock.items.length });
        }
        lock.ok = lock.items.length > 0;
      }
    }
  }
  function decorate(plan, grid, rnd, solid, set) {
    const th = plan.theme,
      free = (x, y) =>
        grid[y]?.[x] === FLOOR &&
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
      const b = bounds(room);
      // Torches, bannières et veines de mithril sur le mur du fond.
      if (th.wallProps.length)
        for (let x = b.x0 + 1, n = k; x <= b.x1 - 1; x += 3) {
          if (Math.abs(x - room.cx) <= 2) continue;
          for (let y = b.y0 - 1; y <= room.cy; y++) {
            if (grid[y][x] === WALL && WALKABLE(grid[y + 1]?.[x]) && !solid.has(y * MAPW + x)) {
              plan.props.push({ x, y, kind: th.wallProps[n++ % th.wallProps.length], wall: true });
              break;
            }
            if (WALKABLE(grid[y][x])) break;
          }
        }
      // Colonnes des grandes salles, symétriques, hors des portes.
      if (
        (th.shape === 'hall' || th.shape === 'void') &&
        room.w >= 13 &&
        room.h >= 11 &&
        room.kind !== 'entry'
      ) {
        const kind = th.floorProps.includes('pillarlight') && room.kind === 'boss' ? 'pillarlight' : 'pillar';
        for (let y = b.y0 + 3; y <= b.y1 - 3; y += 4)
          if (Math.abs(y - room.cy) > 2)
            for (const x of [b.x0 + 3, b.x1 - 3]) if (free(x, y) && grid[y][x] === FLOOR) addProp(x, y, kind);
      }
      if (room.kind === 'entry') {
        plan.decals.push({ x: DUNGEON_ENTRY.x, y: DUNGEON_ENTRY.y, kind: 'portal' });
        plan.title = { x: room.cx, y: b.y0 - 0.6 };
        return;
      }
      // Objets au sol, hors de la croix centrale où passent le joueur et les monstres.
      const count = Math.floor((room.w * room.h) / (room.kind === 'boss' ? 34 : 24));
      for (let n = 0, tries = 0; n < count && tries < 80; tries++) {
        const x = b.x0 + 1 + Math.floor(rnd() * (room.w - 2)),
          y = b.y0 + 1 + Math.floor(rnd() * (room.h - 2));
        if (Math.abs(x - room.cx) <= 2 || Math.abs(y - room.cy) <= 2 || !free(x, y)) continue;
        if ((room.kind === 'boss' || room.kind === 'secret') && Math.hypot(x - room.cx, y - room.cy) < 5)
          continue;
        // Jamais collé à un mur fissuré : le passage doit rester dégagé.
        if (
          plan.secretWalls.some(w => w.cells.some(([cx, cy]) => Math.abs(cx - x) < 3 && Math.abs(cy - y) < 3))
        )
          continue;
        addProp(x, y, th.floorProps[Math.floor(rnd() * th.floorProps.length)]);
        n++;
      }
      if (th.hazard.style === 'blood' || th.key === 'fosse')
        for (let n = 0; n < 3; n++)
          plan.decals.push({
            x: b.x0 + 1 + rnd() * (room.w - 2),
            y: b.y0 + 1 + rnd() * (room.h - 2),
            kind: 'splat'
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
          center: room.kind === 'boss'
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
          boss: room.stage
        });
        room.boss = { x: room.cx + sx * 2, y: room.cy + sy * 2 };
        room.chest = { x: room.cx + 0.5, y: room.cy + 0.5 };
        // Gardes du boss dans les raids.
        if (room.kind === 'boss' && instances[plan.index].raid)
          for (const o of [-3, 3])
            plan.trash.push({
              x: room.boss.x + (sy ? o : -sx * 2),
              y: room.boss.y + (sx ? o : -sy * 2),
              type: o < 0 ? 0 : 1
            });
        return;
      }
      // Groupes d'ennemis dans les salles de passage et les annexes, plus nombreux au fil des instances.
      const share =
        (room.kind === 'hub' ? 3 : 2) + Math.floor(plan.index / 5) + (instances[plan.index].raid ? 1 : 0);
      for (let n = 0, tries = 0; n < share && tries < 60; tries++) {
        const a = rnd() * Math.PI * 2,
          rr = 1.5 + rnd() * Math.min(room.w, room.h) * 0.28,
          x = Math.round(room.cx + Math.cos(a) * rr),
          y = Math.round(room.cy + Math.sin(a) * rr);
        if (!WALKABLE(grid[y]?.[x]) || plan.trash.some(t => t.x === x && t.y === y)) continue;
        plan.trash.push({ x, y, type: plan.trash.length % 2 });
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

  function spawnInstanceBoss(i) {
    const d = instances[i],
      th = THEMES[i],
      plan = planFor(i),
      inst = game.world.instance?.index === i ? game.world.instance : null,
      down = inst ? inst.bossesDown || 0 : 0,
      st = inst ? dunState() : null,
      names = d.bosses || [d.boss],
      base = 260 + i * 220,
      make = (room, name, look, extra) => ({
        x: (room.boss.x + 0.5) * TS,
        y: (room.boss.y + 0.5) * TS,
        t: name,
        r: d.raid ? 36 : 26,
        cd: 0,
        g: 90 + i * 60,
        boss: true,
        look: look.look,
        pal: look.pal,
        lookOpts: look,
        mobColor: d.color,
        room: room.index,
        ...extra
      });
    plan.rooms
      .filter(r => r.kind === 'boss' && r.stage >= down)
      .forEach(r => {
        const final = r.stage === plan.bossCount - 1,
          hp = Math.round(base * (0.7 + (0.3 * r.stage) / Math.max(1, plan.bossCount - 1)));
        game.world.monsters.push(
          make(r, names[r.stage] || d.boss, th.bosses[r.stage] || th.bosses[0], {
            hp,
            mhp: hp,
            bossStage: r.stage,
            finalBoss: final,
            scale: d.raid ? (final ? 4.1 : 3.5) : final ? 3.3 : 3
          })
        );
      });
    // Boss cachés, derrière les murs fissurés : seulement ceux que le groupe n'a pas encore vaincus.
    plan.rooms
      .filter(r => r.kind === 'secret' && !(st && st.hidden & (1 << r.secret)))
      .forEach(r => {
        const hp = Math.round(base * 1.1);
        game.world.monsters.push(
          make(r, (d.secrets || [])[r.secret] || 'Boss caché', th.secrets?.[r.secret] || th.bosses[0], {
            hp,
            mhp: hp,
            secretBoss: r.secret,
            scale: d.raid ? 3.6 : 3.2
          })
        );
      });
    if (!down) {
      for (const spot of plan.trash) {
        const type = th.mobs[spot.type];
        game.world.monsters.push({
          x: (spot.x + 0.5) * TS,
          y: (spot.y + 0.5) * TS,
          hp: 60 + i * 22,
          mhp: 60 + i * 22,
          t: type.name,
          mobColor: type.pal[0],
          look: type.look,
          pal: type.pal,
          r: 13,
          cd: 0,
          g: 12 + i * 5
        });
      }
      // Gardiens du sceau : élites qui tiennent fermée la porte de leur boss.
      for (const g of plan.guardians) {
        const type = th.mobs[g.type];
        game.world.monsters.push({
          x: (g.x + 0.5) * TS,
          y: (g.y + 0.5) * TS,
          hp: (60 + i * 22) * 3,
          mhp: (60 + i * 22) * 3,
          t: 'Gardien du sceau',
          mobColor: type.pal[0],
          look: type.look,
          pal: type.pal,
          r: 16,
          cd: 0,
          g: 30 + i * 8,
          elite: true,
          guardian: g.lock
        });
      }
    }
    // Ennemis au niveau de l'instance (boss un peu plus haut) ; la difficulté et le nombre de héros du groupe
    // multiplient leurs PV (canaanSetupMob, scaleBossHp).
    for (const mob of game.world.monsters) {
      canaanMobLevel(mob);
      canaanSetupMob(mob);
    }
    game.world.monsters.forEach(scaleBossHp);
  }
  const members = () => game.heroes.filter(h => !h.away);
  const tellAll = text => {
    for (const h of members()) canaanLootNotice(h, text);
  };
  // Mort d'un boss d'instance. Boss caché : une clé des secrets pour chaque héros. Boss : 61 % de chance d'un
  // équipement pour chacun, puis la herse de sa salle se lève. Renvoie true au dernier boss (instance terminée).
  function onInstanceBossDown(m) {
    const inst = game.world.instance;
    if (!inst) return false;
    const i = inst.index,
      plan = planFor(i),
      total = plan ? plan.bossCount : 1;
    if (m.secretBoss !== undefined) {
      dunState().hidden |= 1 << m.secretBoss;
      // La clé va dans le sac (piles de 20) ; sac plein : elle est perdue, comme un équipement.
      for (const h of members()) {
        if (!CANAAN_BAG.room(h, 'key', 'secret', 0, 1)) {
          canaanLootNotice(h, '🎒 Sac plein : clé des secrets non récupérée.');
          continue;
        }
        CANAAN_BAG.add(h, 'key', 'secret', 0, 1);
        CANAAN_WARDROBE.drop('secretBoss', h);
        canaanLootNotice(
          h,
          '🗝️ ' +
            m.t +
            ' vaincu : clé des secrets dans ton sac ! Elle ouvre un coffre secret de l’île (' +
            CANAAN_BAG.count(h, 'key', 'secret') +
            ').'
        );
      }
      burst(m.x, m.y, '#ffd36d', 30);
      return false;
    }
    for (const h of members()) {
      if (Math.random() < DUNGEON_BOSS_DROP_CHANCE) dropTierGear(i, h);
      else canaanLootNotice(h, '🎲 ' + m.t + ' : pas d’équipement cette fois.');
      // Apparence : chance propre à chaque héros (plus haute et plus belle en raid).
      CANAAN_WARDROBE.drop(instances[i].raid ? 'raid' : 'dungeon', h);
    }
    inst.bossesDown = (inst.bossesDown || 0) + 1;
    if (inst.bossesDown >= total) return true;
    const gate = plan.gates[Number.isInteger(m.bossStage) ? m.bossStage : inst.bossesDown - 1];
    if (gate)
      gate.cells.forEach(([x, y], k) => {
        if (game.world.tiles[y][x] === GATE) game.world.tiles[y][x] = gate.under[k];
        burst((x + 0.5) * TS, (y + 0.5) * TS, ART.THEMES[i].rune, 10);
      });
    toast(
      '⚔️ ' +
        m.t +
        ' vaincu (' +
        inst.bossesDown +
        '/' +
        total +
        ') — ' +
        (THEMES[i].gate === 'barrier' ? 'la barrière se dissipe.' : 'la herse se lève.')
    );
    return false;
  }
  // Portail de retour : il s'ouvre dans la salle du dernier boss quand l'instance est terminée, de l'autre côté du
  // coffre par rapport au boss (case de sol la plus proche), et ramène tout le groupe devant le portail de l'île.
  function exitSpot(index) {
    const plan = planFor(index),
      room = plan?.rooms.filter(r => r.kind === 'boss').pop();
    if (!room || !room.boss) return null;
    if (room.exit) return room.exit;
    const dx = Math.sign(room.boss.x - room.cx),
      dy = Math.sign(room.boss.y - room.cy),
      want = { x: room.cx - dx * 3, y: room.cy - dy * 3 };
    let best = null;
    for (let r = 0; r < 6 && !best; r++)
      for (let y = want.y - r; y <= want.y + r && !best; y++)
        for (let x = want.x - r; x <= want.x + r; x++)
          if (
            WALKABLE(plan.grid[y]?.[x]) &&
            !plan.solid.has(y * MAPW + x) &&
            Math.hypot(x - room.cx, y - room.cy) >= 2.5
          ) {
            best = { x, y };
            break;
          }
    room.exit = best || { x: room.cx, y: room.cy + 2 };
    return room.exit;
  }
  // Le héros est-il devant le portail de retour (instance terminée) ?
  function exitNear(p) {
    const inst = game.world.instance;
    if (!inst || inst.arena || !inst.cleared) return false;
    const e = exitSpot(inst.index);
    return !!e && Math.hypot(p.x / TS - (e.x + 0.5), p.y / TS - (e.y + 0.5)) < 1.6;
  }
  // Prendre le portail de retour : le coffre des boss doit être ouvert d'abord (sinon sa bourse serait perdue).
  function takeExit(hero = game.hero) {
    if (!exitNear(hero.player)) return false;
    if (game.world.chests.some(c => c.instance && !c.opened)) {
      canaanLootNotice(hero, '🎁 Ouvre d’abord le coffre des boss, juste à côté !');
      return true;
    }
    if (game.mode === 'guest' || hero !== game.hero) {
      canaanLootNotice(hero, '🌀 C’est l’hôte qui prend le portail : tout le groupe sort avec lui.');
      return true;
    }
    leaveInstance();
    return true;
  }
  function dungeonChestSpot(index) {
    const plan = planFor(index),
      room = plan?.rooms.filter(r => r.kind === 'boss').pop();
    return room ? room.chest : { x: DUNGEON_ENTRY.x, y: DUNGEON_ENTRY.y - 6 };
  }

  // ---------------------------------------------------------------- Énigmes, portes scellées et passages secrets
  // État de l'exploration en cours (hôte ; copié chez les invités) : pour chaque porte, ouverte ou non, les objets
  // activés (bits) et le nombre de bons pas d'une séquence ; murs secrets découverts et boss cachés vaincus (bits).
  function dunState() {
    const inst = game.world.instance;
    if (!inst || inst.arena) return null;
    const plan = planFor(inst.index);
    if (!inst.dun || inst.dun.locks?.length !== plan.locks.length)
      inst.dun = { locks: plan.locks.map(() => ({ done: 0, prog: 0, step: 0 })), secrets: 0, hidden: 0 };
    return inst.dun;
  }
  const lockGoal = lock =>
    lock.type === 'guardian' ? lock.items.length : lock.type === 'runes' ? 4 : lock.items.length;
  const bossName = (i, s) => (instances[i].bosses || [instances[i].boss])[s] || instances[i].boss;
  function openCells(g) {
    let opened = 0;
    if (!g) return 0;
    g.cells.forEach(([x, y], k) => {
      const t = game.world.tiles[y]?.[x];
      if (t === GATE || t === SECRET) {
        game.world.tiles[y][x] = g.under[k];
        opened++;
      }
    });
    return opened;
  }
  function solveLock(i, s) {
    const st = dunState(),
      plan = planFor(i),
      door = plan.doors[s];
    if (st.locks[s].done) return;
    st.locks[s].done = 1;
    openCells(door);
    if (door) for (const [x, y] of door.cells) burst((x + 0.5) * TS, (y + 0.5) * TS, ART.THEMES[i].rune, 14);
    tellAll('🔓 Le sceau se brise : la porte de ' + bossName(i, s) + ' s’ouvre !');
  }
  function revealSecret(i, k) {
    const st = dunState(),
      wall = planFor(i).secretWalls[k];
    if (st.secrets & (1 << k)) return;
    st.secrets |= 1 << k;
    openCells(wall);
    for (const [x, y] of wall.cells) burst((x + 0.5) * TS, (y + 0.5) * TS, '#c8b8a0', 18);
    shake = Math.max(shake, 8);
    tellAll('🕳️ Un passage secret ! Le mur s’effondre… quelque chose rôde derrière.');
  }
  // Un pas dans une séquence (leviers, dalles) : bon symbole, ou tout se remet à zéro.
  function sequenceStep(i, s, id, hero) {
    const lock = planFor(i).locks[s],
      ls = dunState().locks[s],
      goal = lockGoal(lock);
    if (ls.done || ls.prog & (1 << id)) return;
    if (lock.order[ls.step] === id) {
      ls.prog |= 1 << id;
      ls.step++;
      const it = lock.items[id];
      burst((it.x + 0.5) * TS, (it.y + 0.5) * TS, SIGILS[id].col, 12);
      if (ls.step >= goal) solveLock(i, s);
      else
        canaanLootNotice(
          hero,
          SIGILS[id].sym +
            ' ' +
            (lock.type === 'levers' ? 'Le levier s’abaisse' : 'La dalle s’illumine') +
            ' (' +
            ls.step +
            '/' +
            goal +
            ').'
        );
    } else {
      ls.prog = 0;
      ls.step = 0;
      const it = lock.items[id];
      burst((it.x + 0.5) * TS, (it.y + 0.5) * TS, '#ff4a3a', 16);
      tellAll(
        '✖ Mauvais ordre : ' +
          (lock.type === 'levers' ? 'les leviers se relèvent.' : 'les dalles s’éteignent.') +
          ' Relis la stèle.'
      );
    }
  }
  // Texte de la stèle : l'ordre des symboles, en énigme.
  // Assemblée morceau par morceau dans la langue du jeu (tt) : une phrase à trous ne se traduit pas à l'affichage.
  function riddle(lock) {
    const names = lock.order.map(id => tt(SIGILS[id].name)),
      verb = lock.type === 'levers' ? tt('Abaisse les leviers') : tt('Foule les dalles');
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const lines = [tt('{nom} ouvre la marche', { nom: cap(names[0]) })];
    for (let k = 1; k < names.length - 1; k++)
      lines.push(k === 1 ? tt('{nom} le suit', { nom: names[k] }) : tt('puis {nom}', { nom: names[k] }));
    lines.push(tt('et {nom} ferme le cortège', { nom: names[names.length - 1] }));
    return '📜 ' + tt('« {texte}. » — {verbe} dans cet ordre.', { texte: lines.join(', '), verbe: verb });
  }
  function lockHint(i, s) {
    const lock = planFor(i).locks[s],
      ls = dunState().locks[s],
      goal = lockGoal(lock),
      done =
        lock.type === 'guardian'
          ? goal - game.world.monsters.filter(m => m.guardian === s && m.hp > 0).length
          : lock.type === 'braziers'
            ? bits(ls.prog)
            : ls.step,
      what = {
        braziers: 'allume les ' + goal + ' braseros éteints de cette aile',
        levers: 'abaisse les ' + goal + ' leviers de cette aile dans l’ordre gravé sur la stèle',
        runes: 'foule les 4 dalles gravées dans l’ordre donné par la stèle',
        guardian: 'vaincs les gardiens du sceau dans les salles voisines'
      }[lock.type];
    return (
      '🔒 La porte de ' +
      bossName(i, s) +
      ' est scellée : ' +
      what +
      ' (' +
      Math.max(0, done) +
      '/' +
      goal +
      ').'
    );
  }
  const bits = n => {
    let c = 0;
    for (; n; n &= n - 1) c++;
    return c;
  };
  // Ce que le héros a à portée de main (E) : mur fissuré, brasero, levier, stèle ou porte scellée.
  function reachable(p) {
    const inst = game.world.instance;
    if (!inst || inst.arena) return null;
    const i = inst.index,
      plan = planFor(i),
      st = dunState(),
      hx = p.x / TS,
      hy = p.y / TS,
      close = (x, y, r) => Math.hypot(hx - (x + 0.5), hy - (y + 0.5)) < r;
    for (let k = 0; k < plan.secretWalls.length; k++)
      if (!(st.secrets & (1 << k)) && plan.secretWalls[k].cells.some(([x, y]) => close(x, y, 1.6)))
        return { kind: 'secret', k };
    for (let s = 0; s < plan.locks.length; s++) {
      const lock = plan.locks[s],
        ls = st.locks[s];
      if (!ls.done && (lock.type === 'braziers' || lock.type === 'levers'))
        for (const it of lock.items) if (close(it.x, it.y, 1.7)) return { kind: lock.type, s, id: it.id };
      if (lock.stele && close(lock.stele.x, lock.stele.y, 1.8)) return { kind: 'stele', s };
      if (!ls.done && plan.doors[s]?.cells.some(([x, y]) => close(x, y, 2))) return { kind: 'door', s };
    }
    return null;
  }
  // Interaction d'un héros (l'hôte décide, aussi pour un invité) ; true si quelque chose a répondu.
  function dungeonInteract(hero = game.hero) {
    const inst = game.world.instance;
    if (!inst || inst.arena || hero.player.dead) return false;
    const i = inst.index,
      what = reachable(hero.player);
    if (!what) return false;
    const plan = planFor(i),
      st = dunState();
    if (what.kind === 'secret') revealSecret(i, what.k);
    else if (what.kind === 'braziers') {
      const ls = st.locks[what.s],
        lock = plan.locks[what.s],
        it = lock.items[what.id];
      if (ls.prog & (1 << what.id)) return true;
      ls.prog |= 1 << what.id;
      burst((it.x + 0.5) * TS, (it.y + 0.3) * TS, ART.THEMES[i].flame[1], 18);
      if (bits(ls.prog) >= lockGoal(lock)) solveLock(i, what.s);
      else canaanLootNotice(hero, '🔥 Brasero allumé (' + bits(ls.prog) + '/' + lockGoal(lock) + ').');
    } else if (what.kind === 'levers') sequenceStep(i, what.s, what.id, hero);
    else if (what.kind === 'stele') {
      const lock = plan.locks[what.s];
      canaanLootNotice(
        hero,
        lock.type === 'braziers' || lock.type === 'guardian' ? lockHint(i, what.s) : riddle(lock)
      );
    } else if (what.kind === 'door') canaanLootNotice(hero, lockHint(i, what.s));
    return true;
  }
  // Un héros dans la salle d'un boss (ses mécaniques ne traversent ni les murs ni les portes scellées).
  function inBossRoom(m, p) {
    const inst = game.world.instance;
    if (!inst || inst.arena || !Number.isInteger(m.room)) return true;
    const room = planFor(inst.index).rooms[m.room];
    if (!room) return true;
    const b = bounds(room),
      x = p.x / TS,
      y = p.y / TS;
    return x >= b.x0 - 0.5 && x <= b.x1 + 1.5 && y >= b.y0 - 0.5 && y <= b.y1 + 1.5;
  }
  // Dalles gravées et gardiens : vérifiés à chaque pas de simulation chez l'hôte.
  const onPlate = new Map();
  function updatePuzzles() {
    const inst = game.world.instance;
    if (!inst || inst.arena || game.mode === 'guest' || inst.guestView) return;
    const i = inst.index,
      plan = planFor(i),
      st = dunState();
    for (let s = 0; s < plan.locks.length; s++) {
      const lock = plan.locks[s],
        ls = st.locks[s];
      if (ls.done) continue;
      if (lock.type === 'guardian' && !game.world.monsters.some(m => m.guardian === s && m.hp > 0))
        solveLock(i, s);
      if (lock.type !== 'runes') continue;
      for (const h of members()) {
        if (h.player.dead) continue;
        const tx = Math.floor(h.player.x / TS),
          ty = Math.floor((h.player.y + 10) / TS),
          plate = plan.plates.find(p => p.lock === s && p.x === tx && p.y === ty),
          key = plate ? s + ':' + plate.id : null;
        if (key && onPlate.get(h) !== key) sequenceStep(i, s, plate.id, h);
        onPlate.set(h, key);
      }
    }
  }
  window.CanaanStages.dungeonPuzzles = { after: updatePuzzles };
  // Copie compacte de l'état pour les invités, et son application chez eux (portes et murs ouverts).
  function dungeonStateOut() {
    const st = game.world.instance && !game.world.instance.arena ? dunState() : null;
    return st ? { l: st.locks.map(l => [l.done, l.prog, l.step]), s: st.secrets, h: st.hidden } : null;
  }
  function dungeonStateIn(raw) {
    const st = dunState();
    if (!st || !raw || !Array.isArray(raw.l)) return;
    const plan = planFor(game.world.instance.index);
    raw.l.forEach((v, s) => {
      if (!st.locks[s] || !Array.isArray(v)) return;
      [st.locks[s].done, st.locks[s].prog, st.locks[s].step] = v.map(n =>
        Math.max(0, Math.floor(Number(n) || 0))
      );
      if (st.locks[s].done) openCells(plan.doors[s]);
    });
    st.secrets = Math.max(0, Math.floor(Number(raw.s) || 0));
    st.hidden = Math.max(0, Math.floor(Number(raw.h) || 0));
    plan.secretWalls.forEach((w, k) => st.secrets & (1 << k) && openCells(w));
  }
  // Vérification d'une instance (tests et outils) : nombre de boss, de boss cachés, mécanismes des portes, et plan
  // jouable (énigmes faisables avant leur porte, boss scellés, salles cachées fermées tant que le mur tient).
  function auditDungeon(i) {
    const plan = planFor(i);
    if (i === 'arena') return { bosses: 0, theme: plan.theme.key };
    const closed = reachFrom(plan, new Set()),
      bosses = plan.rooms.filter(r => r.kind === 'boss');
    return {
      bosses: bosses.length,
      secrets: plan.secretCount,
      locks: plan.locks.map(l => l.type),
      gates: plan.gates.filter(Boolean).length,
      doors: plan.doors.filter(Boolean).length,
      rooms: plan.rooms.length,
      reachable: validPlan(plan),
      sealed: bosses.every(r => !near(closed, r.boss.x, r.boss.y)),
      trash: plan.trash.length,
      props: plan.props.length,
      theme: plan.theme.key
    };
  }
  // Invité en ligne : ouvre les herses des boss déjà vaincus chez l'hôte (dans l'ordre, sans effet).
  function openDungeonGates(index, count) {
    const plan = planFor(index);
    if (!plan) return 0;
    let opened = 0;
    plan.gates.slice(0, Math.max(0, count)).forEach(gate => {
      if (!gate) return;
      gate.cells.forEach(([x, y], k) => {
        if (game.world.tiles[y]?.[x] === GATE) {
          game.world.tiles[y][x] = gate.under[k];
          opened++;
        }
      });
    });
    return opened;
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    makeDungeon,
    openDungeonGates,
    spawnInstanceBoss,
    onInstanceBossDown,
    dungeonChestSpot,
    drawDungeonTile: ART.drawDungeonTile,
    drawDungeonDecor: ART.drawDungeonDecor,
    dungeonAmbience: ART.dungeonAmbience,
    drawDungeonEntrance: ART.drawDungeonEntrance,
    dungeonMinimapColor: ART.dungeonMinimapColor,
    arenaLayout,
    CANAAN_DUNGEON_AUDIT: auditDungeon,
    // Chance d'équipement de chaque boss, pour chaque héros (fiche des portails).
    CANAAN_BOSS_DROP_CHANCE: DUNGEON_BOSS_DROP_CHANCE,
    // Exploration : interaction (E), ce qui est à portée, état copié chez les invités.
    CANAAN_DUNGEON_EXPLORE: Object.freeze({
      exitSpot,
      exitNear,
      takeExit,
      inBossRoom,
      interact: dungeonInteract,
      near: p => !!reachable(p),
      stateOut: dungeonStateOut,
      stateIn: dungeonStateIn,
      state: () => dunState(),
      plan: i => planFor(i)
    }),
    // Monstres d'une instance (renforts appelés par les boss, boss-mechanics.js).
    CANAAN_DUNGEON_MOBS: i => THEMES[i].mobs,
    // Apparence des boss d'une instance (portraits du bestiaire).
    CANAAN_DUNGEON_BOSS_LOOKS: i => THEMES[i].bosses,
    CANAAN_DUNGEON_SECRET_LOOKS: i => THEMES[i].secrets || [],
    // Pinceaux partagés avec les intérieurs des bâtiments et le camp (house.js, world-settlements.js) : mêmes
    // textures de sol et de mur, même flamme, même ombre au pied des murs que dans les donjons et les raids.
    CANAAN_TILE_KIT: Object.freeze({
      canvas: ART.canvas,
      rect: ART.rect,
      specks: ART.specks,
      paintFloor: ART.paintFloor,
      paintFace: ART.paintFace,
      paintHazard: ART.paintHazard,
      flame: ART.flame,
      shadowTile: ART.shadowTile,
      // Objets des donjons (torches, os, caisses, statues, braseros…), réutilisés par les Tréfonds (underground.js).
      floorProp: (c, p, th) => ART.drawFloorProp(c, p, th),
      wallProp: (c, p, th) => ART.drawWallProp(c, p, th)
    })
  });
})();
