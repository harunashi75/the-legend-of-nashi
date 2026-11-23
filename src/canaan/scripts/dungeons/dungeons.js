// Donjons et raids : plan, décor posé, éclairage, ennemis et boss de chaque instance, fidèles à son nom.
// Des explorations compactes : un donjon a trois boss, un raid six ; chaque boss attend derrière une porte scellée par
// l'énigme de son aile (la suite des énigmes est propre à chaque instance : braseros minutés, leviers et dalles à
// déduire, gardiens liés, miroirs, cristaux d'écho, piliers liés, urnes à fouiller, embuscade). Les salles des boss
// cachés n'existent pas tant que leur passage n'est pas ouvert : ni à l'écran, ni sur la carte, et leur boss n'apparaît
// qu'à ce moment-là. La carte ne montre que les salles visitées. Chaque instance a ses pièges (pointes, jets de feu,
// éboulements, spores, runes) et des boss aux mécaniques propres (scripts/boss-mechanics.js).
// Fiche de chaque instance (règles, plan, créatures, apparence) : shared/data/dungeons/<clé>.js ; tout le dessin :
// scripts/dungeons/render.js.
(() => {
  'use strict';
  const WALL = 9,
    GATE = 19,
    FLOOR = 20,
    ACCENT = 21,
    HAZARD = 22,
    // Passage secret fermé : bloque jusqu'à ce qu'il soit ouvert (mur examiné, torche tirée, statue tournée).
    SECRET = 23;

  const WALKABLE = t => t === FLOOR || t === ACCENT;
  // Thèmes de la logique : structure et créatures de chaque instance (shared/data/dungeons/), sans leur apparence.
  const THEMES = DUNGEON_LAYOUTS.map((layout, i) => ({ ...layout, ...DUNGEON_ACTORS[i] }));
  THEMES.arena = { ...DUNGEON_ARENA_LAYOUT, mobs: [], bosses: [] };

  // Objets posés au sol qui bloquent le passage ; les autres sont décoratifs.
  const SOLID_PROPS = new Set(DUNGEON_SOLID_PROPS);

  // ---------------------------------------------------------------- Plans d'exploration
  // Chaque instance est un réseau de salles accolées par des couloirs courts : l'entrée, puis une aile par boss (la
  // salle de l'énigme, parfois une annexe), la salle du boss, et derrière des passages secrets les salles des boss
  // cachés. Le plan est le même à chaque entrée (graine fixe).
  function seeded(i) {
    let s = (i + 1) * 9973 + 17;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }
  const PLANS = [];
  // Tentative qui donne le plan de chaque instance (les graines sont fixes, c'est toujours la même) : on commence par
  // elle au lieu de rejouer les échecs (12 essais pour le Bastion). Si le générateur change, la recherche reprend
  // depuis le début ; le test « tentatives notées » signale alors le tableau à mettre à jour.
  const PLAN_TRIES = [0, 1, 0, 1, 0, 1, 11, 0, 0, 4, 0, 0, 1, 0];
  const bounds = r => ({
    x0: r.cx - (r.w - 1) / 2,
    x1: r.cx + (r.w - 1) / 2,
    y0: r.cy - (r.h - 1) / 2,
    y1: r.cy + (r.h - 1) / 2
  });
  const grow = (b, m) => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m });
  const overlap = (a, b) => a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;
  const STEP = { N: [0, -1], E: [1, 0], W: [-1, 0], S: [0, 1] };
  const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const D4 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  // Énigmes des portes : chaque instance déclare la sienne pour chaque aile (rules.wings).
  const LOCK_TYPES = [
    'braziers',
    'levers',
    'runes',
    'guardian',
    'mirrors',
    'memory',
    'toggles',
    'search',
    'ambush'
  ];
  const SIGILS = [
    { sym: '☀', name: 'le Soleil', col: '#ffcf4a' },
    { sym: '☾', name: 'la Lune', col: '#b8c8ff' },
    { sym: '★', name: 'l’Étoile', col: '#fff0a8' },
    { sym: '◆', name: 'le Cristal', col: '#7de0ff' }
  ];
  // Pièges : pointes, jets de feu et runes sont des bandes de cases qui s'arment en rythme ; éboulements et spores sont
  // des cercles annoncés.
  const TILE_TRAPS = new Set(['spikes', 'jets', 'pulse']);
  const TRAP_CYCLE = { period: 150, warn: 50, active: 34 };
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
    reachable,
    beamPath,
    trapPhase,
    trapZones: () => trapZones,
    secretOpen,
    hostTime
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
  // Tailles des salles (toujours impaires) : l'énigme demande de la place, les boss de raid une vraie arène.
  function roomSize(d, kind, stage, lock) {
    const B = d.raid ? 6 : 3,
      final = stage === B - 1;
    if (kind === 'hall')
      return d.raid || ['mirrors', 'toggles', 'ambush'].includes(lock) ? [17, 13] : [15, 11];
    if (kind === 'side') return [11, 9];
    if (kind === 'secret') return [15, 11];
    if (kind === 'boss') return d.raid ? (final ? [25, 19] : [21, 15]) : final ? [21, 17] : [19, 15];
    return [11, 9];
  }
  // Réseau de salles accolées ; null si le tirage se coince (on retente avec une autre graine).
  function layout(d, rnd) {
    const B = d.raid ? 6 : 3,
      secretWings = d.raid ? [1, 4] : [1],
      rooms = [],
      links = [],
      boxes = [],
      shuffle = a => {
        for (let k = a.length - 1; k > 0; k--) {
          const j = Math.floor(rnd() * (k + 1));
          [a[k], a[j]] = [a[j], a[k]];
        }
        return a;
      },
      add = (kind, w, h, cx, cy, extra) => {
        const room = { kind, w, h, cx, cy, index: rooms.length, ...extra };
        rooms.push(room);
        boxes.push({ b: grow(bounds(room), 2), owner: room.index });
        return room;
      },
      // Accroche une salle à un côté libre de son hôte, à 4–6 cases, sans toucher aucune autre salle ni couloir.
      attach = (host, kind, size, extra, dirs = ['N', 'E', 'S', 'W']) => {
        const [w, h] = size;
        for (const dir of shuffle(dirs.filter(dd => !(host.used || []).includes(dd)))) {
          const [dx, dy] = STEP[dir];
          for (let t = 0; t < 5; t++) {
            const gap = 4 + Math.floor(rnd() * 3),
              lim = Math.max(0, Math.min(dx ? host.h : host.w, dx ? h : w) / 2 - 3),
              off = t ? Math.round((rnd() * 2 - 1) * Math.min(3, lim)) : 0,
              cx = host.cx + (dx ? dx * ((host.w - 1) / 2 + gap + 1 + (w - 1) / 2) : off),
              cy = host.cy + (dy ? dy * ((host.h - 1) / 2 + gap + 1 + (h - 1) / 2) : off),
              room = { cx, cy, w, h },
              b = bounds(room);
            if (b.x0 < 6 || b.y0 < 6 || b.x1 > MAPW - 7 || b.y1 > MAPH - 7) continue;
            if (boxes.some(o => overlap(grow(b, 2), o.b))) continue;
            const hb = bounds(host),
              lane = dx
                ? {
                    x0: Math.min(hb.x1, b.x1) + 1,
                    x1: Math.max(hb.x0, b.x0) - 1,
                    y0: Math.min(host.cy, cy) - 2,
                    y1: Math.max(host.cy, cy) + 2
                  }
                : {
                    x0: Math.min(host.cx, cx) - 2,
                    x1: Math.max(host.cx, cx) + 2,
                    y0: Math.min(hb.y1, b.y1) + 1,
                    y1: Math.max(hb.y0, b.y0) - 1
                  };
            if (boxes.some(o => o.owner !== host.index && overlap(lane, o.b))) continue;
            const made = add(kind, w, h, cx, cy, extra);
            (host.used ||= []).push(dir);
            (made.used ||= []).push(OPPOSITE[dir]);
            boxes.push({ b: lane, owner: -1 });
            return { room: made, dir };
          }
        }
        return null;
      },
      link = (a, b, dir, extra = {}) => links.push({ from: a.index, to: b.index, dir, ...extra });
    const entry = add('entry', 11, 9, DUNGEON_ENTRY.x, DUNGEON_ENTRY.y - 2, { stage: -1 });
    // Le portail de sortie est au sud de l'entrée : la première aile part ailleurs.
    entry.used = ['S'];
    let cur = entry;
    for (let s = 0; s < B; s++) {
      const lock = d.wings[s],
        hall = attach(cur, 'hall', roomSize(d, 'hall', s, lock), { stage: s, lock });
      if (!hall) return null;
      link(cur, hall.room, hall.dir, cur.kind === 'boss' ? { gate: cur.stage } : {});
      // Annexe : obligatoire pour les braseros et les urnes (l'énigme s'étend sur deux salles), au hasard sinon.
      const needSide = lock === 'braziers' || lock === 'search',
        wantSide = needSide || rnd() < (d.raid ? 0.3 : 0.5);
      let side = null;
      if (wantSide) {
        side = attach(hall.room, 'side', roomSize(d, 'side'), { stage: s });
        if (!side && needSide) return null;
        if (side) link(hall.room, side.room, side.dir);
      }
      const boss = attach(hall.room, 'boss', roomSize(d, 'boss', s), { stage: s });
      if (!boss) return null;
      link(hall.room, boss.room, boss.dir, { door: s });
      const sk = secretWings.indexOf(s);
      if (sk >= 0) {
        const hosts = side ? [side.room, hall.room] : [hall.room];
        let sec = null,
          host = null;
        for (const h of hosts) {
          sec = attach(h, 'secret', roomSize(d, 'secret'), { stage: s, secret: sk });
          if (sec) {
            host = h;
            break;
          }
        }
        if (!sec) return null;
        link(host, sec.room, sec.dir, { secret: sk });
      }
      cur = boss.room;
    }
    return { rooms, links };
  }
  // Les trois cases d'un couloir juste à la sortie d'une salle (porte, herse ou passage secret).
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
    const first = PLAN_TRIES[i] ?? 0;
    for (let k = -1; k < 600; k++) {
      const attempt = k < 0 ? first : k;
      if (k === first) continue;
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
        masks: [],
        locks: [],
        plates: [],
        guardians: [],
        traps: [],
        puffs: [],
        bossCount: B,
        secretCount: rooms.filter(r => r.kind === 'secret').length,
        props: [],
        decals: [],
        lights: [],
        trash: [],
        reserved: new Set()
      };
    for (const l of links) {
      if (l.gate !== undefined) plan.gates[l.gate] = { cells: doorCells(rooms[l.from], l), dir: l.dir };
      if (l.door !== undefined)
        plan.doors[l.door] = { cells: doorCells(rooms[l.to], l), dir: l.dir, room: l.to };
      if (l.secret !== undefined)
        plan.secretWalls[l.secret] = { cells: doorCells(rooms[l.from], l), dir: l.dir, room: l.to, link: l };
    }
    plan.grid = carve(plan, i, rnd);
    return plan.grid ? plan : null;
  }
  // Vérification d'un plan : chaque énigme est faisable avant sa porte, aucun boss n'est accessible avant d'avoir
  // ouvert sa porte, les salles cachées restent fermées tant que leur passage n'est pas ouvert.
  function reachFrom(plan, open) {
    const grid = plan.grid,
      seen = new Set([DUNGEON_ENTRY.y * MAPW + DUNGEON_ENTRY.x]),
      queue = [[DUNGEON_ENTRY.x, DUNGEON_ENTRY.y]];
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of D4) {
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
  const near = (seen, x, y) => [[0, 0], ...D4].some(([dx, dy]) => seen.has((y + dy) * MAPW + x + dx));
  function openings(list) {
    const out = new Set();
    for (const g of list) if (g) for (const [x, y] of g.cells) out.add(y * MAPW + x);
    return out;
  }
  function maskOpenings(plan) {
    const out = new Set();
    for (const m of plan.masks) for (const [x, y, t] of m) if (WALKABLE(t)) out.add(y * MAPW + x);
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
      if (lock.stele && !near(before, lock.stele.x, lock.stele.y)) return false;
      if (near(before, boss.x, boss.y)) return false;
      const after = reachFrom(plan, openings([...plan.gates.slice(0, s), ...plan.doors.slice(0, s + 1)]));
      if (!near(after, boss.x, boss.y)) return false;
    }
    const all = openings([...plan.gates, ...plan.doors]),
      closed = reachFrom(plan, all);
    if (secretRooms.some(r => near(closed, r.boss.x, r.boss.y))) return false;
    // Le déclencheur de chaque passage secret est accessible avant de l'ouvrir.
    for (const w of plan.secretWalls) {
      if (!w.cells.some(([x, y]) => near(closed, x, y))) return false;
      if (w.trigger && !near(closed, w.trigger.x, w.trigger.y + (w.trigger.wall ? 1 : 0))) return false;
    }
    const open = reachFrom(
      plan,
      new Set([...openings([...plan.gates, ...plan.doors, ...plan.secretWalls]), ...maskOpenings(plan)])
    );
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
          plan.lights.push({
            x: px + 0.5,
            y: py + 0.5,
            r: 150,
            col: th.hazard.glow,
            hidden: room.kind === 'secret' ? room.secret : undefined
          });
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
    if (!placePuzzles(plan, grid, rnd, solid, set)) return null;
    placeSecretTriggers(plan, grid, rnd);
    decorate(plan, grid, rnd, solid, set);
    placeTraps(plan, grid, rnd);
    // Herses de sortie et portes scellées fermées ; passages secrets murés.
    for (const g of [...plan.gates, ...plan.doors]) {
      if (!g) continue;
      g.cells = g.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
      g.under = g.cells.map(([x, y]) => grid[y][x]);
      g.cells.forEach(([x, y]) => set(x, y, GATE));
    }
    for (const lock of plan.locks)
      if (lock.seals)
        for (const sl of lock.seals) {
          sl.cells = sl.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
          sl.under = sl.cells.map(([x, y]) => grid[y][x]);
        }
    for (const g of plan.secretWalls) {
      g.cells = g.cells.filter(([x, y]) => WALKABLE(grid[y][x]));
      g.under = g.cells.map(([x, y]) => grid[y][x]);
      g.cells.forEach(([x, y]) => set(x, y, SECRET));
    }
    // Salle cachée et son couloir : de la roche pleine tant que le passage n'est pas ouvert (rien ne se devine,
    // ni à l'écran ni sur la carte).
    plan.secretWalls.forEach((w, k) => {
      const room = plan.rooms[w.room],
        host = plan.rooms[w.link.from],
        hb = bounds(host),
        rb = grow(bounds(room), 1),
        mask = [],
        seen = new Set(),
        door = new Set(w.cells.map(([x, y]) => y * MAPW + x)),
        hide = (x, y) => {
          const id = y * MAPW + x;
          if (seen.has(id) || door.has(id)) return;
          if (x >= hb.x0 - 1 && x <= hb.x1 + 1 && y >= hb.y0 - 1 && y <= hb.y1 + 1) return;
          seen.add(id);
          const t = grid[y]?.[x];
          if (t === undefined || t === WALL) return;
          mask.push([x, y, t]);
          grid[y][x] = WALL;
        };
      for (let y = rb.y0; y <= rb.y1; y++) for (let x = rb.x0; x <= rb.x1; x++) hide(x, y);
      eachPathCell(w.link.points, (x, y) => {
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) hide(x + ox, y + oy);
      });
      plan.masks[k] = mask;
    });
    return grid;
  }
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
        const all = [...mp.mirrors, ...(decoy ? [{ ...decoy, good: rnd() < 0.5 ? 1 : 0, decoy: true }] : [])];
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
          if (cells.some(([cx, cy]) => Math.abs(cx - room.cx) <= 1 || Math.abs(cy - room.cy) <= 1)) continue;
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
        const kind = th.floorProps.includes('pillarlight') && room.kind === 'boss' ? 'pillarlight' : 'pillar';
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
          plan.secretWalls.some(w => w.cells.some(([cx, cy]) => Math.abs(cx - x) < 3 && Math.abs(cy - y) < 3))
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

  // ---------------------------------------------------------------- Créatures
  const baseHp = i => 260 + i * 220;
  function makeBoss(i, room, name, look, extra) {
    const d = instances[i];
    return {
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
    };
  }
  // Monstre ordinaire de l'instance (passage, renforts d'une embuscade) ; élite : un chef plus coriace.
  function makeMob(i, typeIndex, x, y, extra = {}) {
    const type = THEMES[i].mobs[typeIndex % THEMES[i].mobs.length];
    return {
      x,
      y,
      hp: 60 + i * 22,
      mhp: 60 + i * 22,
      t: type.name,
      mobColor: type.pal[0],
      look: type.look,
      pal: type.pal,
      lookOpts: type,
      r: 13,
      cd: 0,
      g: 12 + i * 5,
      ...extra
    };
  }
  function makeGuardian(i, g) {
    const type = THEMES[i].mobs[g.type];
    return {
      x: (g.x + 0.5) * TS,
      y: (g.y + 0.5) * TS,
      hp: (60 + i * 22) * 3,
      mhp: (60 + i * 22) * 3,
      t: 'Gardien du sceau',
      mobColor: type.pal[0],
      look: type.look,
      pal: type.pal,
      lookOpts: type,
      r: 16,
      cd: 0,
      g: 30 + i * 8,
      elite: true,
      guardian: g.lock,
      guardianId: g.id
    };
  }
  // Niveau, PV et dégâts réels d'un ennemi ajouté (difficulté et taille du groupe comprises).
  function ready(mob) {
    canaanMobLevel(mob);
    canaanSetupMob(mob);
    if (mob.boss) scaleBossHp(mob);
    return mob;
  }
  function spawnInstanceBoss(i) {
    const d = instances[i],
      th = THEMES[i],
      plan = planFor(i),
      inst = game.world.instance?.index === i ? game.world.instance : null,
      down = inst ? inst.bossesDown || 0 : 0,
      names = d.bosses || [d.boss],
      base = baseHp(i),
      fresh = [];
    plan.rooms
      .filter(r => r.kind === 'boss' && r.stage >= down)
      .forEach(r => {
        const final = r.stage === plan.bossCount - 1,
          hp = Math.round(base * (0.7 + (0.3 * r.stage) / Math.max(1, plan.bossCount - 1)));
        fresh.push(
          makeBoss(i, r, names[r.stage] || d.boss, th.bosses[r.stage] || th.bosses[0], {
            hp,
            mhp: hp,
            bossStage: r.stage,
            finalBoss: final,
            mechs: (d.mechanics || [])[r.stage] || [],
            scale: d.raid ? (final ? 4.1 : 3.5) : final ? 3.3 : 3
          })
        );
      });
    // Les boss cachés n'apparaissent qu'à l'ouverture de leur passage (revealSecret).
    if (!down) {
      for (const spot of plan.trash)
        fresh.push(
          makeMob(i, spot.type, (spot.x + 0.5) * TS, (spot.y + 0.5) * TS, spot.elite ? { elite: true } : {})
        );
      // Gardiens du sceau : élites liées qui tiennent fermée la porte de leur boss.
      for (const g of plan.guardians) fresh.push(makeGuardian(i, g));
    }
    // Ennemis au niveau de l'instance (boss un peu plus haut) ; la difficulté et le nombre de héros du groupe
    // multiplient leurs PV (canaanSetupMob, scaleBossHp).
    for (const mob of fresh) {
      canaanMobLevel(mob);
      canaanSetupMob(mob);
      game.world.monsters.push(mob);
    }
    game.world.monsters.forEach(scaleBossHp);
  }
  function spawnSecretBoss(i, k) {
    const d = instances[i],
      th = THEMES[i],
      plan = planFor(i),
      room = plan.rooms.find(r => r.kind === 'secret' && r.secret === k),
      st = dunState();
    if (!room || (st && st.hidden & (1 << k))) return;
    if (game.world.monsters.some(m => m.secretBoss === k && m.hp > 0)) return;
    const hp = Math.round(baseHp(i) * 1.1);
    game.world.monsters.push(
      ready(
        makeBoss(i, room, (d.secrets || [])[k] || 'Boss caché', th.secrets?.[k] || th.bosses[0], {
          hp,
          mhp: hp,
          secretBoss: k,
          mechs: (d.secretMechanics || [])[k] || [],
          scale: d.raid ? 3.6 : 3.2
        })
      )
    );
  }
  const members = () => game.heroes.filter(h => !h.away);
  const tellAll = text => {
    for (const h of members()) canaanLootNotice(h, text);
  };
  const host = () => game.mode !== 'guest' && !game.world.instance?.guestView;
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
      // La clé va dans le sac (piles de 20), même plein : elle n'est jamais perdue.
      for (const h of members()) {
        CANAAN_BAG.add(h, 'key', 'secret', 0, 1);
        CANAAN_WARDROBE.drop('secretBoss', h);
        CANAAN_MOUNTS.drop('secretBoss', h);
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
      CANAAN_MOUNTS.drop(instances[i].raid ? 'raid' : 'dungeon', h);
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
  // État de l'exploration en cours (hôte ; copié chez les invités) : pour chaque porte, ouverte ou non, l'état de
  // l'énigme (bits des objets activés, pas d'une séquence, heure d'un minuteur ou d'un écho), passages secrets ouverts,
  // boss cachés vaincus et salles visitées (bits).
  function dunState() {
    const inst = game.world.instance;
    if (!inst || inst.arena) return null;
    const plan = planFor(inst.index);
    if (!inst.dun || inst.dun.locks?.length !== plan.locks.length)
      inst.dun = {
        locks: plan.locks.map(l => ({ done: 0, prog: l.start || 0, step: 0, t: 0, a: 0 })),
        secrets: 0,
        hidden: 0,
        seen: 1,
        offset: 0
      };
    return inst.dun;
  }
  // Horloge de l'hôte (pièges en rythme, minuteurs) : l'invité la déduit de l'état reçu.
  function hostTime() {
    return time + (game.world.instance?.dun?.offset || 0);
  }
  function secretOpen(k) {
    return !!(dunState()?.secrets & (1 << k));
  }
  const lockGoal = lock =>
    ({ braziers: lock.items.length, runes: 4, memory: lock.order.length, search: 3, ambush: 1 })[lock.type] ??
    lock.items.length;
  const bossName = (i, s) => (instances[i].bosses || [instances[i].boss])[s] || instances[i].boss;
  function setCells(g, tile) {
    let changed = 0;
    if (!g) return 0;
    g.cells.forEach(([x, y], k) => {
      const want = tile === null ? g.under[k] : tile;
      if (game.world.tiles[y]?.[x] !== undefined && game.world.tiles[y][x] !== want) {
        game.world.tiles[y][x] = want;
        changed++;
      }
    });
    return changed;
  }
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
    st.locks[s].t = 0;
    openCells(door);
    if (door) for (const [x, y] of door.cells) burst((x + 0.5) * TS, (y + 0.5) * TS, ART.THEMES[i].rune, 14);
    tellAll('🔓 ' + tt('Le sceau se brise : la porte de {nom} s’ouvre !', { nom: tt(bossName(i, s)) }));
  }
  // Ouvre un passage secret : la roche qui cachait la salle disparaît et son boss se réveille.
  function revealSecret(i, k) {
    const st = dunState(),
      plan = planFor(i),
      wall = plan.secretWalls[k];
    if (st.secrets & (1 << k)) return;
    st.secrets |= 1 << k;
    applySecret(plan, k);
    for (const [x, y] of wall.cells) burst((x + 0.5) * TS, (y + 0.5) * TS, '#c8b8a0', 18);
    shake = Math.max(shake, 10);
    if (host()) spawnSecretBoss(i, k);
    tellAll(
      wall.kind === 'wall'
        ? '🕳️ Un passage secret ! Le mur s’effondre… quelque chose rôde derrière.'
        : '🕳️ Un grondement sourd : quelque part dans cette aile, un mur a coulissé…'
    );
  }
  function applySecret(plan, k) {
    openCells(plan.secretWalls[k]);
    for (const [x, y, t] of plan.masks[k] || []) game.world.tiles[y][x] = t;
  }
  // Un pas dans une séquence (leviers, dalles, cristaux) : bon symbole, ou tout se remet à zéro.
  function sequenceStep(i, s, id, hero) {
    const lock = planFor(i).locks[s],
      ls = dunState().locks[s],
      goal = lockGoal(lock),
      it = lock.items[id];
    if (ls.done) return;
    if (lock.type !== 'memory' && ls.prog & (1 << id)) return;
    if (lock.order[ls.step] === id) {
      if (lock.type !== 'memory') ls.prog |= 1 << id;
      ls.step++;
      ls.a = id + 1;
      ls.t = time;
      burst((it.x + 0.5) * TS, (it.y + 0.5) * TS, SIGILS[id].col, 12);
      if (ls.step >= goal) solveLock(i, s);
      else
        canaanLootNotice(
          hero,
          SIGILS[id].sym +
            ' ' +
            (lock.type === 'levers'
              ? 'Le levier s’abaisse'
              : lock.type === 'memory'
                ? 'Le cristal répond'
                : 'La dalle s’illumine') +
            ' (' +
            ls.step +
            '/' +
            goal +
            ').'
        );
    } else {
      ls.prog = 0;
      ls.step = 0;
      burst((it.x + 0.5) * TS, (it.y + 0.5) * TS, '#ff4a3a', 16);
      tellAll(
        {
          levers: '✖ Mauvais ordre : les leviers se relèvent. Relis la stèle.',
          runes: '✖ Mauvais ordre : les dalles s’éteignent. Relis la stèle.',
          memory: '✖ Fausse note : les cristaux se taisent. Écoute de nouveau la pierre d’écho.'
        }[lock.type]
      );
      // Les cristaux rejouent la suite après une courte pause.
      if (lock.type === 'memory') {
        ls.t = time + 60;
        ls.a = 0;
      }
    }
  }
  // Texte de la stèle des leviers et des dalles : des indices à recouper.
  // Assemblée morceau par morceau dans la langue du jeu (tt) : une phrase à trous ne se traduit pas à l'affichage.
  function clueText(c, n) {
    const name = id => tt(SIGILS[id].name),
      cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    let out;
    if (c.k === 'before') out = tt('{a} passe avant {b}', { a: name(c.a), b: name(c.b) });
    else if (c.k === 'next') out = tt('{b} vient juste après {a}', { a: name(c.a), b: name(c.b) });
    else if (c.k === 'at')
      out =
        c.p === 0 ? tt('{a} ouvre la marche', { a: name(c.a) }) : tt('{a} ferme la marche', { a: name(c.a) });
    else if (c.p === 0) out = tt('{a} n’ouvre pas la marche', { a: name(c.a) });
    else if (c.p === n - 1) out = tt('{a} ne ferme pas la marche', { a: name(c.a) });
    else out = tt('{a} n’est pas {n}e', { a: name(c.a), n: c.p + 1 });
    return cap(out);
  }
  function riddle(lock) {
    const verb = lock.type === 'levers' ? tt('Abaisse les leviers') : tt('Foule les dalles'),
      text = lock.clues.map(c => clueText(c, lock.order.length)).join('. ');
    return '📜 ' + tt('« {texte}. » — {verbe} dans le bon ordre.', { texte: text, verbe: verb });
  }
  function steleText(i, s) {
    const lock = planFor(i).locks[s];
    switch (lock.type) {
      case 'levers':
      case 'runes':
        return riddle(lock);
      case 'braziers':
        return (
          '📜 ' +
          tt('« Les flammes s’éteignent vite : allume les {n} braseros en moins de {s} secondes. »', {
            n: lock.items.length,
            s: lock.time
          })
        );
      case 'guardian':
        return (
          '📜 ' +
          tt(
            '« Les gardiens sont liés : abattez-les à moins de {s} secondes d’intervalle, ou ils se relèvent. »',
            {
              s: lock.window
            }
          )
        );
      case 'mirrors':
        return '📜 ' + tt('« Guide la lumière jusqu’au cristal : tourne les miroirs (E). L’un d’eux ment. »');
      case 'toggles':
        return '📜 ' + tt('« Chaque pilier réveille aussi ses deux voisins. Allume-les tous. »');
      case 'search':
        return (
          '📜 ' +
          tt('« Trois fragments du sceau dorment dans les urnes de cette aile. Elles luisent à peine. »')
        );
      default:
        return lockHint(i, s);
    }
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
            : lock.type === 'search'
              ? lock.shards.filter(k => ls.prog & (1 << k)).length
              : lock.type === 'mirrors' || lock.type === 'toggles' || lock.type === 'ambush'
                ? 0
                : ls.step,
      what = {
        braziers: 'allume les braseros de cette aile avant qu’ils ne s’éteignent',
        levers: 'abaisse les leviers dans l’ordre que la stèle laisse deviner',
        runes: 'foule les dalles gravées dans l’ordre que la stèle laisse deviner',
        guardian: 'abats les gardiens liés presque en même temps',
        mirrors: 'guide le rayon de lumière jusqu’au cristal avec les miroirs',
        memory: 'écoute la pierre d’écho et frappe les cristaux dans le même ordre',
        toggles: 'allume tous les piliers liés',
        search: 'retrouve les trois fragments du sceau cachés dans les urnes',
        ambush: 'survis à l’embuscade de la salle voisine'
      }[lock.type];
    return (
      '🔒 ' +
      tt('La porte de {nom} est scellée : {quoi}', { nom: tt(bossName(i, s)), quoi: tt(what) }) +
      (lock.type === 'mirrors' || lock.type === 'toggles' || lock.type === 'ambush'
        ? '.'
        : ' (' + Math.max(0, done) + '/' + goal + ').')
    );
  }
  const bits = n => {
    let c = 0;
    for (; n; n &= n - 1) c++;
    return c;
  };
  // Trajet du rayon des miroirs selon leur orientation : cases traversées, et s'il touche le cristal.
  function beamPath(plan, s, prog) {
    const lock = plan.locks[s],
      tiles = game.world.instance?.index === plan.index ? game.world.tiles : plan.grid;
    let x = lock.emitter.x,
      y = lock.emitter.y,
      dir = lock.emitter.dir;
    const pts = [[x, y]];
    for (let n = 0; n < 80; n++) {
      x += dir[0];
      y += dir[1];
      if (x === lock.target.x && y === lock.target.y) {
        pts.push([x, y]);
        return { pts, lit: true };
      }
      const m = lock.items.find(it => it.x === x && it.y === y);
      if (m) {
        pts.push([x, y]);
        dir = reflect(dir, (prog >> m.id) & 1);
        continue;
      }
      const t = tiles[y]?.[x];
      if (!(WALKABLE(t) || t === HAZARD)) {
        pts.push([x - dir[0] * 0.5, y - dir[1] * 0.5]);
        return { pts, lit: false };
      }
    }
    pts.push([x, y]);
    return { pts, lit: false };
  }
  const roomOf = (plan, x, y) =>
    plan.rooms.find(r => {
      const b = bounds(r);
      return x >= b.x0 && x <= b.x1 + 1 && y >= b.y0 && y <= b.y1 + 1;
    });
  // Ce que le héros a à portée de main (E) : déclencheur secret, objet d'une énigme, stèle ou porte scellée.
  function reachable(p) {
    const inst = game.world.instance;
    if (!inst || inst.arena) return null;
    const i = inst.index,
      plan = planFor(i),
      st = dunState(),
      hx = p.x / TS,
      hy = p.y / TS,
      close = (x, y, r) => Math.hypot(hx - (x + 0.5), hy - (y + 0.5)) < r;
    for (let k = 0; k < plan.secretWalls.length; k++) {
      if (st.secrets & (1 << k)) continue;
      const w = plan.secretWalls[k];
      // Mur fissuré : il faut s'y coller ; torche ou statue : juste devant.
      if (w.kind === 'wall' && w.cells.some(([x, y]) => close(x, y, 1.25))) return { kind: 'secret', k };
      if (w.trigger && close(w.trigger.x, w.trigger.y + (w.trigger.wall ? 1 : 0), w.trigger.wall ? 1.1 : 1.6))
        return { kind: 'secret', k };
    }
    for (let s = 0; s < plan.locks.length; s++) {
      const lock = plan.locks[s],
        ls = st.locks[s];
      if (!ls.done && lock.type !== 'runes' && lock.type !== 'guardian' && lock.type !== 'ambush')
        for (const it of lock.items) {
          if (lock.type === 'braziers' && ls.prog & (1 << it.id)) continue;
          if (lock.type === 'search' && ls.prog & (1 << it.id)) continue;
          if (close(it.x, it.y, 1.7)) return { kind: lock.type, s, id: it.id };
        }
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
    if (what.kind === 'secret') {
      revealSecret(i, what.k);
      return true;
    }
    if (what.kind === 'door') {
      canaanLootNotice(hero, lockHint(i, what.s));
      return true;
    }
    const lock = plan.locks[what.s],
      ls = st.locks[what.s];
    if (what.kind === 'stele') {
      if (lock.type === 'memory' && !ls.done) {
        // La pierre d'écho rejoue la suite ; il faut ensuite la refaire depuis le début.
        ls.step = 0;
        ls.t = time;
        ls.a = 0;
        canaanLootNotice(
          hero,
          '🔔 ' +
            tt('La pierre d’écho chante une suite de {n} notes. Frappe les cristaux dans le même ordre.', {
              n: lock.order.length
            })
        );
      } else
        canaanLootNotice(
          hero,
          ls.done ? '✅ ' + tt('Le sceau de cette aile est déjà brisé.') : steleText(i, what.s)
        );
      return true;
    }
    const it = lock.items[what.id];
    if (what.kind === 'braziers') {
      if (ls.prog & (1 << it.id)) return true;
      if (!ls.prog) {
        ls.t = time + lock.time * 60;
        tellAll(
          '⏳ ' + tt('Le premier brasero brûle : {s} secondes pour allumer les autres !', { s: lock.time })
        );
      }
      ls.prog |= 1 << it.id;
      burst((it.x + 0.5) * TS, (it.y + 0.3) * TS, ART.THEMES[i].flame[1], 18);
      if (bits(ls.prog) >= lockGoal(lock)) solveLock(i, what.s);
      else canaanLootNotice(hero, '🔥 Brasero allumé (' + bits(ls.prog) + '/' + lockGoal(lock) + ').');
    } else if (what.kind === 'levers' || what.kind === 'memory') {
      // Pendant que la pierre chante, les cristaux écoutent.
      if (what.kind === 'memory' && ls.t && time < ls.t + lock.order.length * 42 && ls.a === 0) return true;
      sequenceStep(i, what.s, it.id, hero);
    } else if (what.kind === 'mirrors') {
      ls.prog ^= 1 << it.id;
      burst((it.x + 0.5) * TS, (it.y + 0.4) * TS, '#fff6c8', 8);
      if (beamPath(plan, what.s, ls.prog).lit) solveLock(i, what.s);
    } else if (what.kind === 'toggles') {
      const n = lock.items.length;
      ls.prog ^= toggleMask(it.id, n);
      for (const j of [it.id, (it.id + 1) % n, (it.id + n - 1) % n]) {
        const o = lock.items[j];
        burst((o.x + 0.5) * TS, (o.y + 0.2) * TS, ls.prog & (1 << j) ? ART.THEMES[i].rune : '#5a5468', 8);
      }
      if (ls.prog === (1 << n) - 1) solveLock(i, what.s);
    } else if (what.kind === 'search') {
      ls.prog |= 1 << it.id;
      burst((it.x + 0.5) * TS, (it.y + 0.4) * TS, '#c8a070', 14);
      if (lock.shards.includes(it.id)) {
        const found = lock.shards.filter(k => ls.prog & (1 << k)).length;
        burst((it.x + 0.5) * TS, (it.y + 0.2) * TS, ART.THEMES[i].rune, 20);
        if (found >= 3) solveLock(i, what.s);
        else canaanLootNotice(hero, '✨ Un fragment du sceau ! (' + found + '/3)');
      } else canaanLootNotice(hero, '💨 ' + tt('L’urne se brise… rien dedans.'));
    }
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
  // Une case de sol libre de la salle d'un boss, loin de lui (zone sûre, téléportation).
  function bossRoomSpot(m, minDist = 3) {
    const inst = game.world.instance;
    if (!inst || !Number.isInteger(m.room)) return null;
    const room = planFor(inst.index).rooms[m.room],
      b = bounds(room);
    for (let tries = 0; tries < 60; tries++) {
      const x = Math.round(b.x0 + 2 + Math.random() * (room.w - 5)),
        y = Math.round(b.y0 + 2 + Math.random() * (room.h - 5));
      if (!WALKABLE(game.world.tiles[y]?.[x])) continue;
      if (!D4.every(([dx, dy]) => WALKABLE(game.world.tiles[y + dy]?.[x + dx]))) continue;
      if (Math.hypot((x + 0.5) * TS - m.x, (y + 0.5) * TS - m.y) < minDist * TS) continue;
      return { x: (x + 0.5) * TS, y: (y + 0.5) * TS };
    }
    return null;
  }

  // ---------------------------------------------------------------- Pièges
  // Phase d'une bande de pièges : 0 au repos, 1 armée (elle tremble), 2 active (elle blesse).
  function trapPhase(trap) {
    const c = (((hostTime() + trap.phase) % TRAP_CYCLE.period) + TRAP_CYCLE.period) % TRAP_CYCLE.period;
    return c < TRAP_CYCLE.warn ? 1 : c < TRAP_CYCLE.warn + TRAP_CYCLE.active ? 2 : 0;
  }
  // Éboulements et spores : cercles annoncés (centre, rayon, explosion), envoyés aux invités.
  let trapZones = [];
  const trapHits = new Map();
  function trapHurt(hero, pct, label) {
    if (hero.player.dead || CANAAN_COMBAT.invulnerable(hero)) return;
    const n = Math.max(1, Math.round(hero.player.mhp * pct));
    CANAAN_COMBAT.hurt(n, null, hero);
    if (label) float(hero.player.x, hero.player.y - 52, label, '#ffb070');
  }
  function updateTraps(i, plan) {
    const th = plan.theme,
      heroes = members().filter(h => !h.player.dead);
    if (TILE_TRAPS.has(th.trap))
      plan.traps.forEach((trap, k) => {
        const ph = trapPhase(trap),
          was = trapHits.get(k);
        if (ph !== 2) {
          if (was) trapHits.delete(k);
          return;
        }
        const touched = was || new Set();
        for (const h of heroes) {
          if (touched.has(h)) continue;
          const tx = Math.floor(h.player.x / TS),
            ty = Math.floor((h.player.y + 10) / TS);
          if (trap.cells.some(([x, y]) => x === tx && y === ty)) {
            touched.add(h);
            trapHurt(h, 0.07, { spikes: '🗡️', jets: '🔥', pulse: '💥' }[th.trap]);
          }
        }
        trapHits.set(k, touched);
      });
    // Éboulements : une pierre annoncée près d'un héros, dans les salles d'énigme, les annexes et les couloirs.
    if (th.trap === 'falling')
      for (const h of heroes) {
        const r = roomOf(plan, h.player.x / TS, h.player.y / TS);
        if (r && (r.kind === 'boss' || r.kind === 'entry' || r.kind === 'secret')) continue;
        if ((h._rockAt ||= time + 120 + Math.random() * 200) > time) continue;
        h._rockAt = time + 260 + Math.random() * 180;
        trapZones.push({
          x: h.player.x + (Math.random() - 0.5) * 70,
          y: h.player.y + (Math.random() - 0.5) * 70,
          r: 1.3 * TS,
          at: time + 70,
          start: time,
          kind: 'rock'
        });
      }
    if (th.trap === 'spores')
      for (const p of plan.puffs) {
        const px = (p.x + 0.5) * TS,
          py = (p.y + 0.5) * TS;
        if (
          (time + p.phase) % 300 !== 0 ||
          !heroes.some(h => Math.hypot(h.player.x - px, h.player.y - py) < 6 * TS)
        )
          continue;
        trapZones.push({ x: px, y: py, r: 1.9 * TS, at: time + 66, start: time, kind: 'spore' });
      }
    for (let k = trapZones.length - 1; k >= 0; k--) {
      const z = trapZones[k];
      if (time < z.at) continue;
      burst(z.x, z.y, z.kind === 'spore' ? '#a8e060' : '#a08a70', 16);
      for (const h of heroes)
        if (Math.hypot(h.player.x - z.x, h.player.y - z.y) < z.r)
          trapHurt(h, z.kind === 'spore' ? 0.06 : 0.09, z.kind === 'spore' ? '☣' : '🪨');
      trapZones.splice(k, 1);
    }
  }

  // ---------------------------------------------------------------- Simulation de l'exploration (hôte)
  const onPlate = new Map();
  function updatePuzzles() {
    const inst = game.world.instance;
    if (!inst || inst.arena) {
      trapZones = [];
      return;
    }
    if (game.mode === 'guest' || inst.guestView) return;
    const i = inst.index,
      plan = planFor(i),
      st = dunState();
    // Salles visitées : elles apparaissent sur la carte.
    for (const h of members()) {
      if (h.player.dead) continue;
      const r = roomOf(plan, h.player.x / TS, h.player.y / TS);
      if (r && !(st.seen & (1 << r.index)) && (r.kind !== 'secret' || st.secrets & (1 << r.secret))) {
        st.seen |= 1 << r.index;
        if (r.kind === 'secret') tellAll('💀 ' + tt('Une salle oubliée… Un boss caché s’y réveille !'));
      }
    }
    updateTraps(i, plan);
    for (let s = 0; s < plan.locks.length; s++) {
      const lock = plan.locks[s],
        ls = st.locks[s];
      if (ls.done) continue;
      if (lock.type === 'braziers' && ls.prog && ls.t && time > ls.t) {
        ls.prog = 0;
        ls.t = 0;
        tellAll('💨 ' + tt('Trop lent : les braseros s’éteignent. Recommence, plus vite.'));
      }
      if (lock.type === 'guardian') updateGuardians(i, plan, s, lock, ls);
      if (lock.type === 'ambush') updateAmbush(i, plan, s, lock, ls);
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
  // Gardiens liés : quand l'un tombe, les autres ont quelques secondes ; sinon les morts se relèvent.
  function updateGuardians(i, plan, s, lock, ls) {
    const mine = plan.guardians.filter(g => g.lock === s),
      alive = mine.filter(g => game.world.monsters.some(m => m.guardianId === g.id && m.hp > 0));
    if (!alive.length) return solveLock(i, s);
    if (alive.length === mine.length) {
      ls.t = 0;
      return;
    }
    if (!ls.t) {
      ls.t = time + lock.window * 60;
      tellAll(
        '⚔️ ' + tt('Un gardien tombe : abattez les autres en moins de {s} secondes !', { s: lock.window })
      );
      return;
    }
    if (time < ls.t) return;
    ls.t = 0;
    for (const g of mine)
      if (!alive.includes(g)) {
        const m = ready(makeGuardian(i, g));
        game.world.monsters.push(m);
        burst(m.x, m.y, '#c84aff', 24);
      }
    tellAll('💢 ' + tt('Trop tard : le gardien se relève ! Ils doivent tomber ensemble.'));
  }
  // Embuscade : la salle se ferme quand un héros y entre, trois vagues surgissent, puis tout se rouvre.
  function updateAmbush(i, plan, s, lock, ls) {
    const hall = plan.rooms[lock.room],
      b = bounds(hall),
      inside = members().some(h => {
        const x = h.player.x / TS,
          y = h.player.y / TS;
        return !h.player.dead && x > b.x0 + 1 && x < b.x1 && y > b.y0 + 1 && y < b.y1;
      });
    if (!ls.step) {
      if (!inside) return;
      ls.step = 1;
      for (const sl of lock.seals) setCells(sl, GATE);
      tellAll('⚠️ ' + tt('Embuscade ! Les issues se referment…'));
      spawnWave(i, hall, s, lock.waves[0], false);
      return;
    }
    if (game.world.monsters.some(m => m.ambush === s && m.hp > 0)) return;
    if (ls.step < lock.waves.length) {
      ls.step++;
      tellAll('⚔️ ' + tt('Vague {n} sur {m} !', { n: ls.step, m: lock.waves.length }));
      spawnWave(i, hall, s, lock.waves[ls.step - 1], ls.step === lock.waves.length);
      return;
    }
    for (const sl of lock.seals) setCells(sl, null);
    solveLock(i, s);
  }
  function spawnWave(i, hall, s, n, elite) {
    for (let k = 0; k < n; k++) {
      let x = hall.cx,
        y = hall.cy;
      for (let tries = 0; tries < 30; tries++) {
        const a = Math.random() * Math.PI * 2,
          r = 3 + Math.random() * 3,
          tx = Math.round(hall.cx + Math.cos(a) * r),
          ty = Math.round(hall.cy + Math.sin(a) * r * 0.7);
        if (WALKABLE(game.world.tiles[ty]?.[tx])) {
          x = tx;
          y = ty;
          break;
        }
      }
      const m = ready(
        makeMob(i, k, (x + 0.5) * TS, (y + 0.5) * TS, { ambush: s, elite: elite && k === 0, cd: 1 })
      );
      game.world.monsters.push(m);
      burst(m.x, m.y, '#c84aff', 16);
    }
  }
  window.CanaanStages.dungeonPuzzles = { after: updatePuzzles };
  // Copie compacte de l'état pour les invités, et son application chez eux (portes, murs, salles visitées). Les
  // heures (minuteurs, échos) voyagent en écart à l'horloge de l'hôte.
  function dungeonStateOut() {
    const st = game.world.instance && !game.world.instance.arena ? dunState() : null;
    if (!st) return null;
    return {
      l: st.locks.map(l => [l.done, l.prog, l.step, l.t ? l.t - time : 0, l.a]),
      s: st.secrets,
      h: st.hidden,
      v: st.seen,
      tk: time,
      tz: trapZones.map(z => [
        Math.round(z.x),
        Math.round(z.y),
        Math.round(z.r),
        z.at - time,
        z.kind === 'spore' ? 1 : 0
      ]),
      z: window.CANAAN_BOSS_MECHANICS ? CANAAN_BOSS_MECHANICS.view() : []
    };
  }
  function dungeonStateIn(raw) {
    const st = dunState();
    if (!st || !raw || !Array.isArray(raw.l)) return;
    const plan = planFor(game.world.instance.index),
      int = n => Math.floor(Number(n) || 0);
    raw.l.forEach((v, s) => {
      if (!st.locks[s] || !Array.isArray(v)) return;
      const ls = st.locks[s],
        lock = plan.locks[s];
      ls.done = Math.max(0, int(v[0]));
      ls.prog = Math.max(0, int(v[1]));
      ls.step = Math.max(0, int(v[2]));
      ls.t = int(v[3]) ? time + int(v[3]) : 0;
      ls.a = int(v[4]);
      if (ls.done) openCells(plan.doors[s]);
      if (lock.seals) for (const sl of lock.seals) setCells(sl, ls.step && !ls.done ? GATE : null);
    });
    st.secrets = Math.max(0, int(raw.s));
    st.hidden = Math.max(0, int(raw.h));
    st.seen = Math.max(1, int(raw.v));
    if (Number.isFinite(Number(raw.tk))) st.offset = int(raw.tk) - time;
    plan.secretWalls.forEach((w, k) => st.secrets & (1 << k) && applySecret(plan, k));
    trapZones = Array.isArray(raw.tz)
      ? raw.tz.slice(0, 40).map(z => ({
          x: int(z[0]),
          y: int(z[1]),
          r: int(z[2]),
          at: time + int(z[3]),
          start: time + int(z[3]) - 70,
          kind: z[4] ? 'spore' : 'rock'
        }))
      : [];
    if (window.CANAAN_BOSS_MECHANICS && Array.isArray(raw.z)) CANAAN_BOSS_MECHANICS.apply(raw.z);
  }
  // Brouillard de la carte : une case est connue si elle appartient à une salle visitée (ou à ses abords), ou à un
  // couloir qui en part (sauf un passage secret encore fermé). La version change quand le connu grandit.
  let knownCache = { key: '', set: null };
  function knownKey() {
    const st = dunState();
    return st ? game.world.instance.index + ':' + st.seen + ':' + st.secrets : '';
  }
  function knownSet() {
    const key = knownKey();
    if (knownCache.key === key) return knownCache.set;
    const st = dunState(),
      plan = planFor(game.world.instance.index),
      set = new Set(),
      addBox = b => {
        for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) set.add(y * MAPW + x);
      };
    plan.rooms.forEach(r => st.seen & (1 << r.index) && addBox(grow(bounds(r), 2)));
    for (const l of plan.links) {
      if (l.secret !== undefined && !(st.secrets & (1 << l.secret))) continue;
      if (!(st.seen & (1 << l.from)) && !(st.seen & (1 << l.to))) continue;
      // Le couloir s'arrête au seuil d'une salle encore inconnue : on devine une porte, pas ce qu'il y a derrière.
      const unseen = [l.from, l.to]
        .filter(k => !(st.seen & (1 << k)))
        .map(k => grow(bounds(plan.rooms[k]), 1));
      eachPathCell(l.points, (x, y) => {
        if (unseen.some(b => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)) return;
        addBox({ x0: x - 2, y0: y - 2, x1: x + 2, y1: y + 2 });
      });
      for (const b of unseen)
        for (const k of [...set]) {
          const x = k % MAPW,
            y = Math.floor(k / MAPW);
          if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) set.delete(k);
        }
    }
    knownCache = { key, set };
    return set;
  }
  function known(x, y) {
    const inst = game.world.instance;
    if (!inst || inst.arena) return true;
    return knownSet().has(Math.floor(y) * MAPW + Math.floor(x));
  }
  // Vérification d'une instance (tests et outils) : nombre de boss, de boss cachés, mécanismes des portes, et plan
  // jouable (énigmes faisables avant leur porte, boss scellés, salles cachées fermées tant que le passage tient).
  function auditDungeon(i) {
    const plan = planFor(i);
    if (i === 'arena') return { bosses: 0, theme: plan.theme.key };
    const closed = reachFrom(plan, new Set()),
      bosses = plan.rooms.filter(r => r.kind === 'boss');
    let floor = 0;
    for (const row of plan.grid) for (const t of row) if (WALKABLE(t)) floor++;
    return {
      bosses: bosses.length,
      secrets: plan.secretCount,
      locks: plan.locks.map(l => l.type),
      triggers: plan.secretWalls.map(w => w.kind),
      gates: plan.gates.filter(Boolean).length,
      doors: plan.doors.filter(Boolean).length,
      rooms: plan.rooms.length,
      floor,
      reachable: validPlan(plan),
      sealed: bosses.every(r => !near(closed, r.boss.x, r.boss.y)),
      hiddenRooms: plan.rooms
        .filter(r => r.kind === 'secret')
        .every(r => !WALKABLE(plan.grid[r.cy][r.cx]) && !WALKABLE(plan.grid[r.boss.y][r.boss.x])),
      trash: plan.trash.length,
      traps: plan.traps.length + plan.puffs.length,
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
    drawDungeonGround: ART.drawDungeonGround,
    // Sol d'une instance peint à l'avance, pendant que le panneau de son portail est ouvert.
    prewarmInstance: ART.prewarm,
    drawDungeonDecor: ART.drawDungeonDecor,
    dungeonAmbience: ART.dungeonAmbience,
    dungeonMinimapColor: ART.dungeonMinimapColor,
    arenaLayout,
    CANAAN_DUNGEON_AUDIT: auditDungeon,
    // Chance d'équipement de chaque boss, pour chaque héros (fiche des portails).
    CANAAN_BOSS_DROP_CHANCE: DUNGEON_BOSS_DROP_CHANCE,
    // Exploration : interaction (E), ce qui est à portée, état copié chez les invités, brouillard de la carte.
    CANAAN_DUNGEON_EXPLORE: Object.freeze({
      exitSpot,
      exitNear,
      takeExit,
      inBossRoom,
      bossRoomSpot,
      interact: dungeonInteract,
      near: p => !!reachable(p),
      stateOut: dungeonStateOut,
      stateIn: dungeonStateIn,
      state: () => dunState(),
      plan: i => planFor(i),
      known,
      knownKey,
      beam: (i, s) => beamPath(planFor(i), s, dunState()?.locks[s]?.prog || 0),
      toggleMask,
      trapCells: () => {
        const inst = game.world.instance;
        if (!inst || inst.arena) return [];
        return planFor(inst.index).traps.flatMap(t => t.cells);
      },
      LOCK_TYPES
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
