// Histoire « Les Échos de l'Aurore » et quêtes (shared/data/quests.js, shared/rules/quests.js) : lieux, personnages,
// progression, dialogues, journal, gardiens, troc et coquillages. Les objectifs de terrain (chasse, escorte, défense,
// poursuite, course, champion…) sont dans quest-field.js.
// - Lieux : posés sur l'île après sa génération (mêmes cases chez chacun), et ceux de l'Interlude dans les Tréfonds
//   (placeUnder, appelé par underground.js), avec leurs énigmes, PNJ et objets.
// - Progression personnelle (hero.quetes, sauvegardée) : quêtes actives et étapes, terminées, drapeaux,
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
  // Même chose dans les Tréfonds (lieux de l'Interlude).
  const WALK_UNDER = new Map();
  const tileKey = (tx, ty) => ty * MAPW + tx;
  const now = () => time;
  const guest = () => game.mode === 'guest';
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const fresh = () => ({
    active: {},
    done: {},
    flags: {},
    choices: {},
    track: null,
    troc: 0,
    shells: [],
    paid: 0,
    v: QUEST_VERSION,
    guild: sanitizeGuild(null)
  });
  const stateOf = hero => {
    const st = (hero.quetes ??= fresh());
    st.troc ??= 0;
    st.shells ??= [];
    st.paid ??= 0;
    st.v ??= QUEST_VERSION;
    st.guild ??= sanitizeGuild(null);
    return st;
  };
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
    // Ni route, ni pont, ni palissade de troncs (cité elfique, Plaines | Forêt enchantée).
    if (game.world.overworld[y][x] === CANAAN_WOOD_TILE) return false;
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
    (site.under ? WALK_UNDER : WALK).set(tileKey(site.x + dx, site.y + dy), fn);
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
          if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) === r && tools.walkableLand(x, y))
            return [x - site.x, y - site.y];
    return [dx, dy];
  }
  function roomy(tools, x, y, r) {
    let ok = 0,
      all = 0;
    for (let yy = y - r; yy <= y + r; yy++)
      for (let xx = x - r; xx <= x + r; xx++) {
        if (Math.hypot(xx - x, yy - y) > r) continue;
        all++;
        if (tools.valid(xx, yy) && ![0, 4, CANAAN_WOOD_TILE].includes(game.world.overworld[yy][xx])) ok++;
      }
    return ok / all > 0.7;
  }
  // Clairière du lieu : sol de la zone, sans décor ; les routes et les ponts restent en place.
  function clearSite(site, r, tools) {
    for (let y = site.y - r; y <= site.y + r; y++)
      for (let x = site.x - r; x <= site.x + r; x++) {
        if (
          !tools.valid(x, y) ||
          Math.hypot(x - site.x, y - site.y) > r + 0.4 ||
          BRIDGE_TILES.has(y * MAPW + x) ||
          game.world.overworld[y][x] === CANAAN_WOOD_TILE
        )
          continue;
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
      // Les lieux des Tréfonds sont posés après leur génération (placeUnder).
      if (def.under) continue;
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
      const site = {
        id,
        x: spot.x,
        y: spot.y,
        zone: def.zone,
        r: def.r,
        objs: [],
        quest: QUESTS.find(q => q.site === id)
      };
      SITES[id] = site;
      taken.push([site.x, site.y]);
      clearSite(site, def.r + (id === 'q8' ? 1 : 0), tools);
      BUILD[id]?.(site, tools);
    }
    for (const [id, def] of Object.entries(QUEST_NPCS)) {
      const site = SITES[def.site];
      // La maîtresse de guilde se tient dans la maison de guilde (guild.js).
      if (def.guild || QUEST_SITES[def.site].under || def.dwarfName) continue;
      let at = def.at || [0, 0];
      if (def.camp) at = [camp.x + def.camp[0] - site.x, camp.y + def.camp[1] - site.y];
      const [dx, dy] = walkableNear(site, at[0], at[1], tools);
      NPCS[id] = {
        id,
        def,
        x: px(site, dx),
        y: py(site, dy),
        face: 0,
        quest: QUESTS.find(q => q.npc === id),
        site
      };
    }
    // Maîtresse de guilde : derrière son comptoir, dans la maison de guilde.
    const hall = CANAAN_ROOMS.find(r => r.id === 'guilde');
    if (hall)
      NPCS.guilde = {
        id: 'guilde',
        def: QUEST_NPCS.guilde,
        x: (hall.x + 7.5) * T,
        y: (hall.y + 3.9) * T,
        face: 0,
        quest: null,
        site: null,
        guild: true
      };
    for (const site of surfaceSites())
      FIELD.build(site, {
        ok: (x, y) =>
          tools.valid(x, y) &&
          tools.walkableLand(x, y) &&
          reach[y * MAPW + x] === 1 &&
          !isSafe(x, y) &&
          !WALK.has(tileKey(x, y)) &&
          !Object.values(NPCS).some(n => Math.hypot(n.x / T - x - 0.5, n.y / T - y - 0.5) < 1.2)
      });
    placeAdventure(tools, reach);
    // Pierre de passage du camp (raccourci de la quête 8), au bord de la clairière.
    const w = tools.nearestSpot(camp.x - 4, camp.y - 9, 0, (x, y) => tools.walkableLand(x, y));
    WAYSTONE.camp = { x: (w.x + 0.5) * T, y: (w.y + 0.5) * T };
  }
  const surfaceSites = () => Object.values(SITES).filter(s => !s.under);
  // Même couche que le groupe : l'île, ou les Tréfonds.
  const here = v => !!(v.under ?? v.site?.under) === canaanUnder();
  // Lieux et personnages de l'Interlude, posés par underground.js une fois les Tréfonds générés, dans la forteresse ou au
  // plus près du centre d'une caverne, sans toucher à la roche. tools : cavern(biome, kind), open(x, y) (sol libre),
  // clear(x, y) (retire un décor), center (forteresse), dwarf(nom) (nain du jeu).
  function placeUnder(tools) {
    for (const s of Object.values(SITES)) if (s.under) delete SITES[s.id];
    for (const n of Object.values(NPCS)) if (n.under) delete NPCS[n.id];
    WALK_UNDER.clear();
    const taken = [],
      roomyUnder = (x, y, r) => {
        let ok = 0,
          all = 0;
        for (let yy = y - r; yy <= y + r; yy++)
          for (let xx = x - r; xx <= x + r; xx++) {
            if (Math.hypot(xx - x, yy - y) > r) continue;
            all++;
            if (tools.open(xx, yy)) ok++;
          }
        return ok / all;
      };
    for (const [id, def] of Object.entries(QUEST_SITES)) {
      if (!def.under) continue;
      let best;
      if (def.fort) best = { x: tools.center.x + def.fort[0], y: tools.center.y + def.fort[1] };
      else {
        const c = tools.cavern(def.biome, def.cavern),
          R0 = Math.ceil(c.r);
        let score = -1e9;
        for (let y = Math.round(c.y) - R0; y <= c.y + R0; y++)
          for (let x = Math.round(c.x) - R0; x <= c.x + R0; x++) {
            if (!tools.open(x, y) || taken.some(([a, b]) => Math.hypot(a - x, b - y) < 9)) continue;
            const v = roomyUnder(x, y, 4) * 40 - Math.hypot(x - c.x, y - c.y);
            if (v > score) [best, score] = [{ x, y }, v];
          }
        best ??= { x: Math.round(c.x), y: Math.round(c.y) };
      }
      const site = {
        id,
        x: best.x,
        y: best.y,
        zone: 0,
        under: true,
        biome: def.biome ?? 4,
        r: def.r,
        objs: [],
        quest: QUESTS.find(q => q.site === id)
      };
      SITES[id] = site;
      taken.push([site.x, site.y]);
      if (!def.fort)
        for (let y = -4; y <= 4; y++)
          for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < 4.3) tools.clear(site.x + x, site.y + y);
    }
    for (const [id, def] of Object.entries(QUEST_NPCS)) {
      const site = SITES[def.site];
      if (!site?.under) continue;
      const dwarf = def.dwarfName ? tools.dwarf(def.dwarfName) : null;
      let x = px(site, def.at?.[0] || 0),
        y = py(site, def.at?.[1] || 0);
      // Un nain du jeu : sa place habituelle (il ne s'en éloigne guère), la même chez l'hôte et chez l'invité.
      if (dwarf) {
        [x, y] = [dwarf.hx, dwarf.hy];
        dwarf.roam = Math.min(dwarf.roam || 0.6, 0.6);
      } else {
        const [tx, ty] = nearOpen(tools, site.x + (def.at?.[0] || 0), site.y + (def.at?.[1] || 0));
        [x, y] = [(tx + 0.5) * T, (ty + 0.5) * T];
      }
      NPCS[id] = { id, def, x, y, face: 0, quest: QUESTS.find(q => q.npc === id), site, under: true, dwarf };
    }
    const ok = (x, y) =>
      tools.open(x, y) &&
      !Object.values(NPCS).some(n => n.under && Math.hypot(n.x / T - x - 0.5, n.y / T - y - 0.5) < 1.2);
    for (const site of Object.values(SITES)) {
      if (!site.under) continue;
      FIELD.build(site, { ok, cavern: tools.cavern });
      // Sceau du gardien de l'Interlude.
      if (site.quest && GUARDIANS[site.quest.id]) {
        const [x, y] = nearOpen(tools, site.x + 3, site.y - 3);
        addObj(site, 'gseal', 'gseal', x - site.x, y - site.y, { range: 1.4 });
      }
    }
  }
  function nearOpen(tools, x, y) {
    for (let r = 0; r <= 8; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && tools.open(x + dx, y + dy))
            return [x + dx, y + dy];
    return [x, y];
  }
  const WAYSTONE = { camp: null, forest: null };
  // Sceaux des gardiens (au bord de leur clairière, loin des objets et des PNJ) et coquillages chantants (cachés
  // juste hors du lieu, sur une case qu'on peut atteindre depuis le camp). Mêmes cases chez chacun.
  function placeAdventure(tools, reach) {
    const free = (site, dx, dy, gap) =>
      !site.objs.some(o => Math.hypot(o.x - px(site, dx), o.y - py(site, dy)) < gap * T) &&
      !Object.values(NPCS).some(n => Math.hypot(n.x - px(site, dx), n.y - py(site, dy)) < gap * T);
    for (const id of Object.keys(GUARDIANS)) {
      const q = questById(Number(id)),
        site = q && SITES[q.site];
      if (!site || site.under) continue;
      let spot = null;
      for (let k = 0; k < 24 && !spot; k++) {
        const a = ((90 + k * 37) * Math.PI) / 180,
          d = Math.max(2, site.r - 2 + (k % 2)),
          dx = Math.round(Math.cos(a) * d),
          dy = Math.round(Math.sin(a) * d);
        if (
          tools.walkableLand(site.x + dx, site.y + dy) &&
          !WALK.has(tileKey(site.x + dx, site.y + dy)) &&
          free(site, dx, dy, 2)
        )
          spot = [dx, dy];
      }
      const [dx, dy] = spot || walkableNear(site, 0, site.r - 1, tools);
      addObj(site, 'gseal', 'gseal', dx, dy, { range: 1.4 });
    }
    for (const sh of SHELLS) {
      const site = SITES[sh.site];
      if (!site) continue;
      let h = 7;
      for (const ch of sh.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      let spot = null;
      for (let k = 0; k < 24 && !spot; k++) {
        const a = (((h % 360) + k * 47) * Math.PI) / 180,
          d = site.r + 2 + (((h >> 5) + k) % 3),
          x = Math.round(site.x + Math.cos(a) * d),
          y = Math.round(site.y + Math.sin(a) * d);
        if (
          tools.valid(x, y) &&
          tools.walkableLand(x, y) &&
          reach[y * MAPW + x] === 1 &&
          !WALK.has(tileKey(x, y)) &&
          !isSafe(x, y) &&
          free(site, x - site.x, y - site.y, 1.5)
        )
          spot = [x - site.x, y - site.y];
      }
      const [dx, dy] = spot || walkableNear(site, 0, site.r + 1, tools);
      addObj(site, 'shell', 'shell', dx, dy, { shell: sh.id, range: 1.1 });
    }
  }

  // ---------------------------------------------------------------- Lieux et énigmes
  ST = puzzleFreshStates();
  const BUILD = {
    q1(site) {
      addObj(site, 'crystal', 'crystal', 0, 0, { solid: true });
    },
    q3(site) {
      addObj(site, 'flag', 'hilltop', 4, -5, { solid: true });
    },
    q4(site) {
      for (const [dx, dy] of [
        [-4, -3],
        [4, -3],
        [-3, 4]
      ]) {
        wall(site, dx, dy, ZONES[0].t, 'tree');
        site.objs.push({ id: 'tree' + dx, kind: 'shadowtree', dx, dy, x: px(site, dx), y: py(site, dy) });
      }
      addObj(site, 'dig', 'dig', 2, 1);
    },
    q5(site) {
      for (let y = -2; y <= 2; y++)
        for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) < 2.3) setTile(site.x + x, site.y + y, 0);
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
        [0, 0]
      ].forEach(([dx, dy], i) => addObj(site, 'ripple' + i, 'ripple', dx, dy, { i, range: 3.3 }));
    },
    q6(site, tools) {
      const pitch = [3, 1, 4, 2];
      [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0]
      ].forEach(([dx, dy], i) =>
        addObj(site, 'chime' + i, 'chime', dx, dy, { pitch: pitch[i], solid: true })
      );
      [
        [-9, -5],
        [8, -7],
        [9, 5],
        [-7, 8]
      ].forEach(([dx, dy], i) => {
        const [x, y] = walkableNear(site, dx, dy, tools);
        addObj(site, 'mstone' + (i + 1), 'mstone', x, y, { pitch: i + 1 });
      });
      shrine(site, 'murmures');
    },
    q7(site) {
      wall(site, 2, -2, ZONES[1].t, 'bigtree');
      site.objs.push({ id: 'gtree', kind: 'gtree', dx: 2, dy: -2, x: px(site, 2), y: py(site, -2) });
    },
    q8(site) {
      // Labyrinthe de 7 × 7 cellules (15 × 15 cases), le même chez chacun.
      const rng = seededRandom(4242),
        N = 15,
        maze = Array.from({ length: N }, () => Array(N).fill(true)),
        seen = new Set(),
        stack = [[3, 6]];
      seen.add('3,6');
      maze[13][7] = false;
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        maze[cy * 2 + 1][cx * 2 + 1] = false;
        const next = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ].filter(([dx, dy]) => {
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
        for (const [du, dv] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
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
        const exits = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ].filter(([du, dv]) => !maze[v + dv]?.[u + du] && !onPath.has(u + du + ',' + (v + dv)));
        if (exits.length && site.signs.length < 6 && (u + v) % 3 === 0)
          site.signs.push({ dx: u - 7, dy: v - 7, dir: exits[0] });
      }
      addObj(site, 'waystone', 'waystone', 0, -9, { solid: true });
      WAYSTONE.forest = { x: px(site, 0), y: py(site, -8) };
    },
    q9(site) {
      addObj(site, 'sack', 'sack', -4, 4, { solid: true });
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
      shrine(site, 'reflets');
    },
    q12(site) {
      for (let y = -2; y <= 1; y++) for (let x = -4; x <= 4; x++) setTile(site.x + x, site.y + y, 2);
    },
    q13(site) {
      for (let y = -6; y <= 6; y++)
        for (let x = -2; x <= 1; x++) if (Math.hypot(x, y) < 6.4) setTile(site.x + x, site.y + y, 0);
      [-2, -1, 0, 1].forEach(dx => {
        addObj(site, 'plank' + (dx + 2), 'plank', dx, 0, { range: 0 });
        solid(site, dx, 0, () => !!qworld.flags.bridge);
      });
    },
    q14(site) {
      for (const c of GHOST_CLUES)
        addObj(site, 'clue_' + c.id, c.who ? 'witness' : 'clue', c.at[0], c.at[1], {
          clue: c.id,
          solid: !c.who
        });
    },
    q15(site) {
      for (let y = -3; y <= 3; y++)
        for (let x = -3; x <= 5; x++)
          if (!(x >= 3 && x <= 4 && y >= -1 && y <= 0)) setTile(site.x + x, site.y + y, 0);
      const pads = [
        [-3, 0],
        [-2, 0],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [2, 0]
      ];
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
    for (const [dx, dy] of [
      [-1, -4],
      [1, -4],
      [-1, -5],
      [1, -5],
      [-1, -6],
      [1, -6],
      [0, -7]
    ]) {
      wall(site, dx, dy, ZONES[site.zone].t, 'rock');
    }
    addObj(site, 'door', 'door', 0, -4, { solid: () => !!qworld.flags['sanct_' + id], sanct: id });
    addObj(site, 'shrine', 'shrine', 0, -6, { solid: true, sanct: id, name: s.name });
  }

  // under : couche à interroger (celle du groupe par défaut).
  canaanQuestWalk = (x, y, under = canaanUnder()) => {
    if (game.world.instance) return null;
    const f = (under ? WALK_UNDER : WALK).get(tileKey(Math.floor(x / T), Math.floor(y / T)));
    return f ? f() : null;
  };

  // ---------------------------------------------------------------- Chapitres IV à VI : lieux et énigmes
  // Clé d'un héros dans l'état partagé d'une énigme : l'hôte, ou l'identifiant d'un invité.
  const keyOf = h => (h === game.hero ? (guest() ? CANAAN_NET.state().heroId : 'host') : h.id || 'host');
  // Constellation du lac (quête 30) : pierres dans l'ordre où leurs étoiles s'allument.
  const CONSTELLATION = PUZZLE_CONSTELLATION;

  // Rayon des miroirs (quête 24).
  const BEAMS = PUZZLE_BEAMS;

  Object.assign(BUILD, {
    q16(site) {
      for (const m of VILLAGE_MEMORIES) addObj(site, m.id, 'leaf', m.at[0], m.at[1], { what: m.what });
      shrine(site, 'saisons');
    },
    q17(site, tools) {
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
    },
    q20(site) {
      for (let y = -6; y <= 6; y++)
        if (Math.hypot(3, y) < 6.4 && y !== 1) setTile(site.x + 3, site.y + y, 15);
      setTile(site.x + 3, site.y + 1, 2);
      wall(site, -5, -3, ZONES[3].t, 'autumn_red');
      for (const t of TRAVELERS)
        addObj(site, t.id, 'traveler', t.at[0], t.at[1], { who: t.who, what: t.what });
      [
        [2, -3, 'Grosse citrouille près du ruisseau', 'pumpkin'],
        [-4, -2, 'Grosse citrouille sous le chêne roux', 'pumpkin'],
        [3, 1, 'Sous le pont du ruisseau', 'bridge'],
        [-3, 3, 'Tas de feuilles', 'leaves']
      ].forEach(([dx, dy, name, look], i) =>
        addObj(site, 'hide' + i, 'hide', dx, dy, { i, name, look, solid: look === 'pumpkin' })
      );
    },
    q21(site) {
      addObj(site, 'plate', 'starplate', 0, 0);
      shrine(site, 'etoiles');
    },
    q22(site) {
      for (const [dx, dy] of [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1]
      ])
        solid(site, dx, dy);
      site.objs.push({ id: 'machine', kind: 'machine', dx: 0, dy: 0, x: px(site, 0), y: py(site, 0) });
      addObj(site, 'treasure', 'treasure', 0, -3, { solid: true });
    },
    q24(site) {
      addObj(site, 'sun', 'sun', -4, 2, { solid: true });
      [
        [-1, 2],
        [-1, -2],
        [2, -2],
        [2, 2]
      ].forEach(([dx, dy], i) => addObj(site, 'mirror' + i, 'mirror', dx, dy, { i, solid: true }));
      addObj(site, 'tdoor', 'templedoor', 2, -4, { solid: true });
      for (const dx of [0, 1, 3, 4]) wall(site, dx, -4, ZONES[4].t, 'ruin');
    },
    q25(site) {
      for (const [dx, dy] of [
        [3, 2],
        [4, 2],
        [3, 3],
        [4, 3]
      ]) {
        setTile(site.x + dx, site.y + dy, 3);
        solid(site, dx, dy, () => false);
      }
      for (const [dx, dy] of [
        [5, 1],
        [5, 4],
        [2, 4]
      ])
        setTile(site.x + dx, site.y + dy, ZONES[4].t, 'palm');
      site.objs.push({ id: 'oasis', kind: 'oasis', dx: 3, dy: 2, x: px(site, 3), y: py(site, 2) });
    },
    q26(site) {
      addObj(site, 'altar', 'altar', 0, -2, { solid: true });
      shrine(site, 'lumieres');
    },
    q27(site) {
      addObj(site, 'fresco27', 'fresco27', -4, -1, { solid: true });
      addObj(site, 'altar27', 'altar27', 0, 1, { solid: true });
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3 + Math.PI / 6;
        addObj(site, 'cc' + k, 'ccrystal', Math.round(Math.cos(a) * 3), Math.round(Math.sin(a) * 3) + 1, {
          i: k,
          solid: true
        });
      }
      shrine(site, 'aurore');
    },
    q28(site) {
      for (let y = -3; y <= 3; y++) wall(site, 0, y, 4);
      [
        [-5, -2],
        [-4, 0],
        [-5, 2]
      ].forEach(([dx, dy], i) => addObj(site, 'lever' + i, 'lever', dx, dy, { i, solid: true }));
      for (const [dx, dy] of PUZZLE_MIRROR_ROCKS) {
        addObj(site, 'mrock' + dx + '_' + (dy + 2), 'mrock', dx, dy);
        solid(site, dx, dy, () => !puzzleMirrorRocks(ST.q28.l).has(dx + ',' + dy));
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
    const mirrors = site.objs.filter(o => o.kind === 'mirror');
    return puzzleBeam(BEAMS[site.id], mirrors, ST[site.id].m);
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
      case 'fresco': {
        const c = at(hero, q, 'collect');
        if (!c || c.got.includes(o.id)) return false;
        c.got.push(o.id);
        cue(hero, 'note' + c.got.length);
        if (c.got.length >= q.steps[c.step].n) advance(hero, q);
        return panel(
          hero,
          o.kind === 'leaf' ? '🍂 Souvenir des feuilles' : '🧩 Fragment de la fresque',
          o.what
        );
      }
      case 'archive':
        return qworld.flags.archives
          ? panel(hero, '📚 Archives anciennes', questById(17).memory)
          : tell(hero, '📚 Une bibliothèque scellée par les esprits des saisons.');
      case 'vane':
        return tell(
          hero,
          '🌬️ La girouette tourne : le vent fait tournoyer la feuille dans le sens des aiguilles d’une montre.'
        );
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
      case 'treasure':
        return tell(
          hero,
          qworld.flags.machine
            ? '💰 La salle du trésor est ouverte.'
            : '🔒 Une porte ronde, scellée par la machine.'
        );
      case 'mirror':
        if (qworld.solved[site.id]) return creditSolved(hero, site);
        S.m[o.i] = (S.m[o.i] + 1) % 4;
        if (beamOf(site).lit) {
          tell(hero, '☀️ Le rayon frappe le soleil de la porte : le temple s’ouvre !');
          solve(site);
        }
        return changed();
      case 'templedoor':
        return tell(
          hero,
          qworld.solved.q24 ? '🚪 La porte du temple est ouverte.' : '☀️ Un soleil gravé attend la lumière.'
        );
      case 'altar':
        if (!at(hero, q, 'spot'))
          return tell(
            hero,
            st.done[26]
              ? '✨ Les étoiles brillent sur l’autel.'
              : '✨ Six alvéoles vides attendent leurs étoiles.'
          );
        if (starCount(st) < 5) return tell(hero, '✨ Il te manque des étoiles du Cœur.');
        burst(o.x, o.y - 20, '#fff0a0', 34);
        tell(hero, '✨ Tu poses les étoiles : six lumières s’allument en cercle.');
        qworld.flags.sanct_lumieres = true;
        changed();
        return advance(hero, q);
      case 'fresco27':
        if (at(hero, q, 'spot')) {
          advance(hero, q);
          return panel(
            hero,
            '🖼️ La fresque du gardien',
            'Auralis, gardien du Cœur, refusa de partir quand les anciens le dispersèrent. Il veilla seul des siècles, devenu lumière lui-même, en attendant qu’une étincelle revienne.'
          );
        }
        return panel(
          hero,
          '🖼️ La fresque du gardien',
          'Un gardien seul devant le Cœur, entouré de six cristaux.'
        );
      case 'altar27':
        if (!at(hero, q, 'defense'))
          return tell(
            hero,
            qworld.solved.q27 ? '✨ Le Cœur bat doucement.' : '✨ L’autel du Cœur, entouré de six cristaux.'
          );
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
        if (!at(hero, q, 'puzzle'))
          return tell(hero, st.done[28] ? '📦 Le coffre enchanté est vide.' : '📦 Un coffre enchanté.');
        tell(hero, '📦 Tu as traversé le miroir !');
        solve(site);
        return true;
      case 'lake':
        return tell(
          hero,
          '🌌 Le reflet montre le Cerf des neiges. Ses étoiles s’allument l’une après l’autre.'
        );
    }
    return false;
  }
  // Défense des cristaux (quête 27) : trois vagues d'échos de l'Ombre qui s'en prennent aux cristaux.
  function startDefense(site) {
    const S = ST.q27;
    Object.assign(S, { on: true, wave: 0, hp: [100, 100, 100, 100, 100, 100], next: now() + 90 });
    tell(game.hero, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
    for (const h of game.heroes)
      if (h !== game.hero && Math.hypot(h.player.x - px(site, 0), h.player.y - py(site, 0)) < 14 * T)
        tell(h, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
  }
  function stopDefense(site, win) {
    const S = ST.q27;
    S.on = false;
    game.world.monsters = game.world.monsters.filter(m => !m.questEcho);
    if (win) {
      S.hp = [100, 100, 100, 100, 100, 100];
      for (const hero of game.heroes)
        if (
          !hero.player.dead &&
          Math.hypot(hero.player.x - px(site, 0), hero.player.y - py(site, 0)) < 16 * T &&
          at(hero, site.quest, 'defense')
        )
          advance(hero, site.quest);
      tell(game.hero, '✨ Les échos se dissipent. Les cristaux brillent de toute leur lumière !');
    } else tell(game.hero, '💔 Les cristaux se sont éteints… Le Cœur se rendort. Réessaie depuis l’autel.');
    changed();
  }
  function stepDefense(site) {
    const S = ST.q27;
    if (!S.on) return;
    const cx = px(site, 0),
      cy = py(site, 0),
      near = game.heroes.filter(
        h => !h.player.dead && !h.away && Math.hypot(h.player.x - cx, h.player.y - cy) < 16 * T
      );
    if (!near.length) return stopDefense(site, false);
    const echoes = game.world.monsters.filter(m => m.questEcho && m.hp > 0),
      crystals = site.objs.filter(o => o.kind === 'ccrystal');
    // Les échos marchent vers le cristal le plus proche et le rongent ; un héros tout près les détourne.
    for (const m of echoes) {
      const c = crystals
        .filter(c => S.hp[c.i] > 0)
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
      if (!c) break;
      const d = Math.hypot(c.x - m.x, c.y - m.y);
      if (game.heroes.some(h => !h.player.dead && Math.hypot(h.player.x - m.x, h.player.y - m.y) < 2.5 * T))
        continue;
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
      game.world.monsters.push({
        x,
        y,
        hp,
        mhp: hp,
        level,
        t: type.name,
        r: 16,
        cd: 1,
        g: 20,
        mobColor: '#6a3aa0',
        elite: false,
        questEcho: true,
        _levelHp: true
      });
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
    if (
      leafSite &&
      !canaanUnder() &&
      game.heroes.some(h => Math.hypot(h.player.x - px(leafSite, 0), h.player.y - py(leafSite, 0)) < 14 * T)
    ) {
      ST.q18.t++;
      if (t % 6 === 0) changed();
    }
    if (SITES.q27 && !canaanUnder()) stepDefense(SITES.q27);
    stepGuardians();
    if (SITES.q30 && !canaanUnder()) stepLake(SITES.q30);
    // Le monde à l'envers : un héros qui atteint le coffre de l'autre clairière.
    for (const h of canaanUnder() ? [] : game.heroes) {
      const site = SITES.q28;
      if (
        site &&
        at(h, site.quest, 'puzzle') &&
        Math.hypot(h.player.x - px(site, 5), h.player.y - py(site, 0)) < 0.8 * T
      ) {
        tell(h, '📦 Tu as traversé le miroir !');
        solve(site);
      }
    }
  }

  // ---------------------------------------------------------------- Au fil de l'aventure : gardiens, troc, coquillages
  // Gardiens de l'Ombre (GUARDIANS) : un sceau dans le lieu de chaque fin de chapitre ; le briser (E) appelle le
  // gardien, un vrai boss (barre en haut de l'écran, PV et coups de boss) avec ses attaques annoncées au sol. Vaincu :
  // l'étape avance pour chaque héros proche qui l'a en cours, et chacun reçoit son Cœur d'Aurore (PV max), même s'il
  // avait fini la quête avant l'arrivée des gardiens. Perdu (tout le monde à terre ou parti) : le sceau attend.
  const FIGHTS = {};
  // Attaques annoncées : centre, rayon, explosion à l'instant `at`, multiplicateur du coup du gardien.
  const zones = [];
  // Un gardien a 60 % des PV d'un boss de donjon de son niveau : un vrai combat, pas une épreuve d'endurance.
  const GUARDIAN_HP = 0.6;
  const heartFlag = q => 'heart_q' + q.id;
  const guardianOf = q => (q ? GUARDIANS[q.id] || null : null);
  const heroesNear = (x, y, r, dead = false) =>
    game.heroes.filter(
      h => (dead || !h.player.dead) && !h.away && Math.hypot(h.player.x - x, h.player.y - y) < r
    );
  // Le héros peut défier le gardien : il en est à cette étape, ou il a fini la quête sans en avoir le cœur.
  function guardianDue(hero, q) {
    if (!guardianOf(q)) return false;
    const st = stateOf(hero);
    return !!at(hero, q, 'guardian') || (!!st.done[q.id] && !st.flags[heartFlag(q)]);
  }
  function summonGuardian(site, hero) {
    const q = site.quest,
      g = guardianOf(q),
      seal = site.objs.find(o => o.kind === 'gseal');
    if (!g || !seal || FIGHTS[site.id] || !guardianDue(hero, q)) return false;
    const cx = px(site, 0),
      cy = py(site, 0),
      // Au niveau de la quête, ou du héros le plus fort présent : le gardien reste un défi.
      level = clampLevel(
        Math.max(questLevel(q), ...heroesNear(cx, cy, 16 * T).map(h => clampLevel(h.level)))
      ),
      m = {
        x: seal.x,
        y: seal.y - T,
        hp: 1,
        mhp: 1,
        level,
        t: g.name,
        r: 24,
        cd: 1.2,
        g: 40 + level * 8,
        boss: true,
        questGuardian: site.id,
        look: g.look,
        pal: [...g.pal],
        lookOpts: { ...g.opts },
        mobColor: g.color,
        bossColor: g.color,
        scale: g.scale,
        under: !!site.under
      };
    game.world.monsters.push(m);
    scaleBossHp(m);
    m.mhp = m.hp = Math.max(1, Math.round(m.mhp * GUARDIAN_HP));
    const t = now();
    FIGHTS[site.id] = { m, adds: 0, slam: t + 180, rain: t + 360, nova: t + 300, blink: t + 480 };
    burst(m.x, m.y, g.color, 40);
    burst(seal.x, seal.y, '#2a1a3e', 30);
    for (const h of heroesNear(cx, cy, 16 * T)) tell(h, '⚔️ ' + g.intro);
    changed();
    return true;
  }
  function warn(m, x, y, r, delay, mult) {
    zones.push({ m, x, y, r, at: now() + delay, start: now(), mult });
    if (typeof CANAAN_SKILLS !== 'undefined') CANAAN_SKILLS.fx('ring', x, y, 0, r, 0, '#ff3a2a', delay / 60);
  }
  function explode(z) {
    burst(z.x, z.y, '#ff6a3a', 22);
    if (typeof CANAAN_SKILLS !== 'undefined') CANAAN_SKILLS.fx('ring', z.x, z.y, 0, z.r, 0, '#ffb070', 0.4);
    if (!z.m || z.m.hp <= 0) return;
    const raw = CANAAN_ENEMY_RAW_DAMAGE(z.m) * z.mult;
    for (const hero of heroesNear(z.x, z.y, z.r))
      CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(z.m, raw, {}, hero), z.m, hero);
  }
  // Renforts : deux créatures de l'espèce du gardien, à son niveau.
  function spawnAdds(site, m, g) {
    const type = MOB_TYPES.find(t => t.name === g.adds) || MOB_TYPES[0];
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * Math.PI * 2;
      let x = m.x + Math.cos(a) * 2.5 * T,
        y = m.y + Math.sin(a) * 2.5 * T;
      if (!canWalk(x, y)) [x, y] = [m.x, m.y];
      const hp = mobHealth(m.level, false, type.hp);
      game.world.monsters.push({
        x,
        y,
        hp,
        mhp: hp,
        level: m.level,
        t: type.name,
        r: 16,
        cd: 1,
        g: 0,
        mobColor: type.color,
        elite: false,
        questAdd: site.id,
        _levelHp: true
      });
    }
    float(m.x, m.y - 80, '📯 ' + m.t + ' appelle des renforts !', '#ffb0ff');
  }
  // Disparaît dans un nuage d'ombre et réapparaît ailleurs dans le lieu.
  function blink(site, m) {
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2,
        d = (1 + Math.random() * Math.max(1, site.r - 1)) * T,
        x = px(site, 0) + Math.cos(a) * d,
        y = py(site, 0) + Math.sin(a) * d;
      if (!canWalk(x, y)) continue;
      burst(m.x, m.y, m.bossColor, 24);
      [m.x, m.y] = [x, y];
      burst(x, y, m.bossColor, 24);
      float(x, y - 90, '🌀 ' + m.t + ' disparaît !', '#c8a0ff');
      return;
    }
  }
  function stepGuardians() {
    const t = now();
    for (const [id, F] of Object.entries(FIGHTS)) {
      const site = SITES[id],
        m = F.m,
        g = guardianOf(site.quest),
        cx = px(site, 0),
        cy = py(site, 0);
      if (m.hp <= 0) {
        endFight(site, true);
        continue;
      }
      // Retiré du monde sans être vaincu (héros trop loin), ou plus personne debout près du lieu : le sceau attend.
      if (!game.world.monsters.includes(m) || !heroesNear(cx, cy, (site.r + 12) * T).length) {
        endFight(site, false);
        continue;
      }
      // Le gardien ne quitte pas son lieu.
      if (Math.hypot(m.x - cx, m.y - cy) > (site.r + 5) * T) {
        burst(m.x, m.y, g.color, 16);
        [m.x, m.y] = [cx, cy];
      }
      const ratio = m.hp / m.mhp,
        pace = m.enraged ? 0.7 : 1,
        targets = heroesNear(m.x, m.y, 12 * T);
      if (!targets.length) continue;
      const pick = () => targets[Math.floor(Math.random() * targets.length)];
      if (g.moves.includes('slam') && t >= F.slam) {
        F.slam = t + 300 * pace;
        const h = pick();
        warn(m, h.player.x, h.player.y, 1.8 * T, 80, 1.6);
        float(m.x, m.y - 80, '⚠️ Coup de l’Ombre !', '#ff8a6a');
      }
      if (g.moves.includes('rain') && t >= F.rain) {
        F.rain = t + 600 * pace;
        for (const h of targets)
          warn(
            m,
            h.player.x + (Math.random() - 0.5) * 40,
            h.player.y + (Math.random() - 0.5) * 40,
            1.3 * T,
            75,
            1.1
          );
        float(m.x, m.y - 80, '⚠️ Pluie d’éclats !', '#ff8a6a');
      }
      if (g.moves.includes('nova') && t >= F.nova) {
        F.nova = t + 540 * pace;
        warn(m, m.x, m.y, 3.4 * T, 90, 1.4);
        float(m.x, m.y - 90, '⚠️ Onde de l’Ombre !', '#ff8a6a');
      }
      if (g.moves.includes('blink') && t >= F.blink) {
        F.blink = t + 480 * pace;
        blink(site, m);
      }
      const stage = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
      if (stage > F.adds) {
        F.adds = stage;
        spawnAdds(site, m, g);
      }
      if (ratio < 0.25 && !m.enraged) {
        m.enraged = true;
        float(m.x, m.y - 100, '😡 ' + m.t + ' entre en rage !', '#ff4a3a');
        burst(m.x, m.y, '#ff2a1a', 30);
      }
    }
    for (let i = zones.length - 1; i >= 0; i--)
      if (now() >= zones[i].at) {
        const [z] = zones.splice(i, 1);
        explode(z);
      }
  }
  function endFight(site, win) {
    const F = FIGHTS[site.id],
      q = site.quest,
      g = guardianOf(q);
    delete FIGHTS[site.id];
    game.world.monsters = game.world.monsters.filter(x => x !== F.m && x.questAdd !== site.id);
    for (let i = zones.length - 1; i >= 0; i--) if (zones[i].m === F.m) zones.splice(i, 1);
    const around = heroesNear(px(site, 0), py(site, 0), (site.r + 16) * T, true);
    if (win) {
      burst(F.m.x, F.m.y, '#ffe9a0', 50);
      for (const h of around) {
        if (!guardianDue(h, q)) continue;
        tell(h, '✨ ' + g.defeat);
        const st = stateOf(h);
        if (!st.flags[heartFlag(q)]) {
          st.flags[heartFlag(q)] = true;
          recomputeHeroStats(h);
          tell(h, '❤️ Cœur d’Aurore : PV max +3 % (' + heartCount(st) + ' / ' + HEART_FLAGS.length + ')');
        }
        if (at(h, q, 'guardian')) advance(h, q);
      }
      window.CANAAN_PERSISTENCE.requestSave();
    } else
      for (const h of around) tell(h, '🌑 ' + g.name + ' retourne dans l’ombre… Le sceau attend ton retour.');
    changed();
  }
  // Annonces au sol chez l'hôte : remplissage rouge qui monte jusqu'à l'explosion (les invités voient l'anneau).
  function drawZones(c) {
    for (const z of zones) {
      const k = Math.min(1, (now() - z.start) / Math.max(1, z.at - z.start));
      c.globalAlpha = 0.16 + 0.24 * k;
      c.fillStyle = '#ff2a1a';
      c.beginPath();
      c.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  // Le grand troc (TRADE_CHAIN) : chaque habitant donne son objet contre celui du précédent.
  const tradeAt = (hero, npcId) => {
    const t = TRADE_CHAIN[stateOf(hero).troc];
    return t && t.npc === npcId ? t : null;
  };
  function trade(hero, npcId) {
    const st = stateOf(hero),
      t = tradeAt(hero, npcId),
      npc = NPCS[npcId];
    if (!t || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T) return false;
    st.troc++;
    tell(hero, '🎁 ' + t.gives.icon + ' ' + t.gives.name + ' — ' + t.hint);
    if (st.troc >= TRADE_CHAIN.length) {
      hero.player.gold += TRADE_FINAL.gold;
      giveGear(clampLevel(hero.level), 'quest', TRADE_FINAL.item, hero);
      tell(hero, '🏆 Grand troc terminé · +' + TRADE_FINAL.gold + ' or · ' + TRADE_FINAL.text);
    }
    if (hero === game.hero) CANAAN_SOUND.cue('fanfare');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Coquillages chantants (SHELLS) : un par lieu, ramassé par chacun pour soi.
  const hasLoupe = hero => stateOf(hero).troc >= TRADE_CHAIN.length;
  function pickShell(hero, o) {
    const st = stateOf(hero);
    if (st.shells.includes(o.shell)) return false;
    st.shells.push(o.shell);
    tell(hero, '🐚 Coquillage chantant ! (' + st.shells.length + ' / ' + SHELLS.length + ')');
    if (shellRewardsDue(st).length)
      tell(hero, '🐚 Madame Nacre, au Camp de l’Aurore, aimerait voir ta collection.');
    burst(o.x, o.y, '#ffd8f0', 18);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Paliers de la collection, récompensés par Madame Nacre.
  function claimShells(hero) {
    const st = stateOf(hero),
      npc = NPCS.nacre,
      due = shellRewardsDue(st);
    if (!npc || !due.length || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    for (const r of due) {
      st.paid++;
      hero.player.gold += r.gold;
      if (r.item) giveGear(clampLevel(hero.level), 'quest', r.item, hero);
      if (r.heart) {
        st.flags[r.heart] = true;
        recomputeHeroStats(hero);
      }
      tell(hero, '🐚 Palier de ' + r.n + ' coquillages · +' + r.gold + ' or · ' + r.text);
    }
    if (hero === game.hero) CANAAN_SOUND.cue('fanfare');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Coquillage le plus proche pas encore trouvé (boussole de la Loupe d'Orven), à moins de 60 cases.
  function shellTarget(hero) {
    if (!hasLoupe(hero)) return null;
    const st = stateOf(hero);
    let best = null,
      bd = 60 * T;
    for (const site of Object.values(SITES))
      for (const o of site.objs) {
        if (o.kind !== 'shell' || st.shells.includes(o.shell)) continue;
        const d = Math.hypot(hero.player.x - o.x, hero.player.y - o.y);
        if (d < bd) [best, bd] = [o, d];
      }
    return (
      best && {
        x: best.x,
        y: best.y,
        text: 'La Loupe d’Orven entend un coquillage',
        q: { title: 'Coquillage chantant', main: false }
      }
    );
  }
  function drawShell(c, o) {
    const st = stateOf(game.hero);
    if (st.shells.includes(o.shell)) return;
    const d = Math.hypot(P.x - o.x, P.y - o.y),
      loupe = hasLoupe(game.hero);
    // Caché dans l'herbe : un éclat de temps en temps quand on passe à côté, visible de près (de loin avec la loupe).
    if (d > (loupe ? 14 : 2.6) * T) {
      if (d < 6 * T && (time + o.x) % 150 < 8) glow(c, o.x, o.y - 4, 16, '#ffe8f4', 0.7);
      return;
    }
    if (loupe) glow(c, o.x, o.y - 4, 30 + Math.sin(time * 0.1) * 6, '#ffd0ec', 0.45);
    shadowAt(c, o.x, o.y + 8, 9, 3);
    rune(c, o.x, o.y + 6 + Math.sin(time * 0.08) * 1.5, '🐚', '#ffffff', 18);
    if (time % 40 < 20) R(c, o.x + 6, o.y - 10, 2, 2, '#ffffff');
  }
  function drawSeal(c, site, o) {
    const q = site.quest,
      due = guardianDue(game.hero, q),
      fight = !!FIGHTS[site.id] || game.world.monsters.some(m => m.boss && m.t === guardianOf(q).name),
      done = stateOf(game.hero).flags[heartFlag(q)];
    shadowAt(c, o.x, o.y + 10, 20, 6);
    block(c, o.x - 16, o.y - 2, 32, 12, PAL.dark);
    if (done) return rune(c, o.x, o.y + 7, '✦', '#ffe9a0', 14);
    // Sceau de l'Ombre : une rune violette qui pulse, plus fort quand le gardien attend ce héros.
    const pulse = 0.5 + 0.5 * Math.sin(time * (due ? 0.12 : 0.05));
    glow(c, o.x, o.y + 2, due ? 40 : 22, '#8a4aff', fight ? 0.15 : 0.25 + 0.3 * pulse);
    rune(c, o.x, o.y + 8, '۞', fight ? '#3a2a4e' : '#c8a0ff', 16);
  }

  // Fanfare « objet obtenu » : à chaque objet du troc, coquillage, Cœur d'Aurore ou étoile, le héros brandit sa
  // trouvaille au-dessus de sa tête et une bannière s'affiche. Tirée de l'état du héros local (hôte comme invité,
  // qui reçoit le sien de l'hôte) : rien de plus à envoyer sur le réseau.
  const fanfareEl = document.createElement('div');
  fanfareEl.id = 'questFanfare';
  fanfareEl.hidden = true;
  document.body.appendChild(fanfareEl);
  const fanfares = [];
  let fanfareUntil = 0,
    raised = null,
    seen = null;
  const stateMark = st => ({
    troc: st.troc,
    shells: st.shells.length,
    hearts: heartCount(st),
    stars: starCount(st),
    lumi: !!st.flags.lumi
  });
  function fanfare(icon, title, text, kind = 'item') {
    fanfares.push({ icon, title, text, kind });
  }
  function watchFanfare() {
    if (!started) {
      seen = null;
      return;
    }
    const st = stateOf(game.hero),
      cur = stateMark(st);
    if (seen) {
      // Une aventure chargée (beaucoup de changements d'un coup) ne déclenche rien.
      const jumps =
        cur.troc -
        seen.troc +
        (cur.shells - seen.shells) +
        (cur.hearts - seen.hearts) +
        (cur.stars - seen.stars);
      if (jumps > 0 && jumps <= 3) {
        if (cur.troc > seen.troc) {
          const t = TRADE_CHAIN[cur.troc - 1];
          fanfare(t.gives.icon, t.gives.name, t.desc);
        }
        if (cur.shells > seen.shells)
          fanfare(
            '🐚',
            'Coquillage chantant',
            cur.shells + ' / ' + SHELLS.length + ' — Madame Nacre, au Camp de l’Aurore, les collectionne.'
          );
        if (cur.hearts > seen.hearts)
          fanfare('❤️', 'Cœur d’Aurore', 'PV max +3 % (' + cur.hearts + ' / ' + HEART_FLAGS.length + ')');
        if (cur.stars > seen.stars)
          fanfare(
            '✦',
            'Étoile du Cœur',
            'Une étoile du Cœur de l’Aurore te rejoint (' + cur.stars + ' / 6).'
          );
      }
      if (cur.lumi && !seen.lumi)
        fanfare('✨', 'Lumi', 'Une petite lumière tombée du ciel devient ta compagne de voyage.');
    }
    seen = cur;
    // Carte de titre d'un gardien qui apparaît près du héros.
    for (const m of game.world.monsters)
      if (m.boss && !m._questIntro && GUARDIAN_NAMES.has(m.t) && Math.hypot(m.x - P.x, m.y - P.y) < 16 * T) {
        m._questIntro = true;
        const g = Object.values(GUARDIANS).find(g => g.name === m.t);
        fanfare('⚔️', g.name, g.title, 'boss');
      }
    if (time < fanfareUntil || !fanfares.length) {
      if (time >= fanfareUntil && !fanfareEl.hidden) fanfareEl.hidden = true;
      return;
    }
    const f = fanfares.shift();
    fanfareUntil = time + (f.kind === 'boss' ? 150 : 170);
    raised = f.kind === 'boss' ? null : { icon: f.icon, until: fanfareUntil };
    fanfareEl.className = f.kind;
    fanfareEl.innerHTML =
      '<i>' +
      esc(f.icon) +
      '</i><small>' +
      (f.kind === 'boss' ? 'Gardien' : 'Tu as obtenu') +
      '</small><b>' +
      esc(f.title) +
      '</b><span>' +
      esc(f.text) +
      '</span>';
    fanfareEl.hidden = false;
    CANAAN_SOUND.cue(f.kind === 'boss' ? 'wrong' : 'fanfare');
    if (f.kind !== 'boss') burst(P.x, P.y - 60, '#ffe9a0', 26);
  }
  const GUARDIAN_NAMES = new Set(Object.values(GUARDIANS).map(g => g.name));
  // Le héros brandit sa trouvaille au-dessus de sa tête.
  function drawRaised(c) {
    if (!raised || time >= raised.until || P.dead) return;
    const k = Math.min(1, (raised.until - time) / 20),
      y = P.y - 78 - Math.min(14, (170 - (raised.until - time)) * 0.8);
    c.globalAlpha = k;
    glow(c, P.x, y - 8, 46, '#fff2b0', 0.6);
    for (let i = 0; i < 8; i++) {
      const a = time * 0.03 + (i * Math.PI) / 4;
      R(c, P.x + Math.cos(a) * 28, y - 8 + Math.sin(a) * 28, 3, 3, '#fff6c8');
    }
    rune(c, P.x, y, raised.icon, '#ffffff', 28);
    c.globalAlpha = 1;
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
    const ended = q.steps[st.step];
    st.step++;
    st.got = [];
    st.n = 0;
    // Le lieu change pour tout le monde.
    for (const f of ended.world || []) qworld.flags[f] = true;
    if (ended.world) changed();
    tell(
      hero,
      st.step >= q.steps.length
        ? '📜 ' + q.title + ' : retourne voir ' + whoTo(q) + '.'
        : '📜 Objectif accompli : ' + ended.text
    );
    if (hero === game.hero) CANAAN_SOUND.cue('puzzle');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function accept(hero, id) {
    const q = quest(id),
      st = stateOf(hero),
      npc = q && NPCS[q.npc];
    if (!q || !canStart(st, q) || !npc || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    st.active[q.id] = { step: 0, got: [], n: 0 };
    if (!st.track) st.track = q.id;
    tell(hero, '📜 Nouvelle quête : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Un avis de la guilde se rend à la maîtresse de guilde ; une demande d'habitant, à cet habitant.
  const nearGiver = (hero, q) => {
    if (q.npc === 'guilde') return CANAAN_GUILD.near(hero);
    const npc = NPCS[q.npc];
    return !!npc && Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) <= 3.5 * T;
  };
  // Personnage à qui rendre une quête (texte).
  const whoTo = q => (q.npc === 'guilde' ? GUILD_MASTER + ', à la guilde' : QUEST_NPCS[q.npc].name);
  function turnIn(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    if (!q || !questReady(st, q) || !nearGiver(hero, q)) return false;
    // Première fois : les récompenses propres à une demande d'habitant (recette, coffre, bijou…).
    const first = !st.done[q.id];
    delete st.active[q.id];
    st.done[q.id] = Date.now();
    if (st.track === q.id) st.track = Object.keys(st.active).map(Number)[0] || null;
    if (isContract(q)) rewardContract(hero, q, first);
    else reward(hero, q);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Prendre un contrat au tableau de la guilde (près de la maîtresse de guilde).
  function take(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    refreshBoard(st, hero.level, Date.now());
    if (!q || !CANAAN_GUILD.near(hero) || !canTakeContract(st, q)) return false;
    st.guild.taken.push(q.id);
    st.active[q.id] = { step: 0, got: [], n: 0 };
    st.track = q.id;
    tell(hero, '📜 Contrat accepté : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Renoncer au contrat en cours : il ne revient pas avant le prochain tableau.
  function abandon(hero, id) {
    const q = quest(id),
      st = stateOf(hero);
    if (!q || !isContract(q) || !st.active[q.id]) return false;
    delete st.active[q.id];
    if (st.track === q.id) st.track = Object.keys(st.active).map(Number)[0] || null;
    tell(hero, '📜 Contrat abandonné : ' + q.title);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Contrat rendu : or, XP, renommée et équipement de son rang ; la première fois, la récompense propre à la demande.
  function rewardContract(hero, q, first) {
    const st = stateOf(hero),
      g = st.guild,
      rank = contractRank(q),
      level = clampLevel(hero.level),
      gold = questGold(q, level),
      before = guildRankIndex(g.fame);
    hero.player.gold += gold;
    g.fame += contractFame(q);
    g.count++;
    const r = q.reward;
    if (first) {
      for (const f of r.flags || []) st.flags[f] = true;
      if (r.jewel) giveJewel(hero, q);
      if (r.item === 'Légendaire') giveGear(level, 'quest', 'Légendaire', hero);
      if (r.fishXp || r.goldenFish)
        CANAAN_PROF.questReward(hero, { fishXp: r.fishXp || 0, goldenFish: r.goldenFish || 0 });
    }
    giveGear(level, 'quest', rank.better && Math.random() < rank.better ? 'Légendaire' : rank.item, hero);
    canaanGrantXp(hero, questXp(q, level), hero.player);
    tell(
      hero,
      '🏆 Contrat rempli : ' +
        q.title +
        ' · +' +
        gold +
        ' or · +' +
        contractFame(q) +
        ' renommée' +
        (first && (r.flags || r.jewel || r.recipe || r.fishXp || r.item === 'Légendaire')
          ? ' · ' + r.text
          : '')
    );
    if (hero === game.hero) {
      CANAAN_SOUND.cue('levelup');
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 30);
    }
    const after = guildRankIndex(g.fame);
    if (after > before) {
      const R = GUILD_RANKS[after];
      tell(hero, '🛡️ Nouveau rang de guilde : ' + R.id + ' · ' + R.title);
      if (hero === game.hero)
        fanfare('🛡️', 'Rang ' + R.id + ' · ' + R.title, 'Contrats ' + R.tier.toLowerCase());
      refreshBoard(st, hero.level, Date.now());
    }
  }
  function reward(hero, q) {
    const r = q.reward,
      st = stateOf(hero);
    const level = clampLevel(hero.level),
      gold = questGold(q, level);
    hero.player.gold += gold;
    for (const f of r.flags || []) {
      st.flags[f] = true;
      // Un sanctuaire ouvert l'est pour tout le monde.
      if (f.startsWith('sanct_')) qworld.flags[f] = true;
    }
    if (r.jewel) giveJewel(hero, q);
    if (r.item) giveGear(clampLevel(hero.level), 'quest', r.item, hero);
    if (r.fishXp || r.goldenFish)
      CANAAN_PROF.questReward(hero, { fishXp: r.fishXp || 0, goldenFish: r.goldenFish || 0 });
    canaanGrantXp(hero, questXp(q, level), hero.player);
    tell(hero, '🏆 Quête terminée : ' + q.title + ' · +' + gold + ' or · ' + r.text);
    if (hero === game.hero) {
      CANAAN_SOUND.cue('levelup');
      burst(hero.player.x, hero.player.y - 20, '#ffe08a', 30);
    }
    if (r.flags?.some(f => f.startsWith('star')))
      tell(hero, '✦ Une étoile du Cœur de l’Aurore te rejoint (' + starCount(st) + ' / 6).');
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
    // Sac plein : il attend dans la sacoche de butin (ou part en poudres si elle est pleine).
    if (CANAAN_SALVAGE.deliver(hero, item) === 'bag') tell(hero, '💍 ' + item.name + ' (Légendaire) !');
  }
  // Une énigme partagée est résolue : chaque héros proche qui l'a en cours avance.
  function solve(site, at0) {
    qworld.solved[site.id] = true;
    changed();
    burst(px(site, 0), py(site, 0), '#ffe9a0', 34);
    for (const hero of game.heroes) {
      if (
        hero.player.dead ||
        hero.away ||
        Math.hypot(hero.player.x - px(site, 0), hero.player.y - py(site, 0)) > 14 * T
      )
        continue;
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
    if (o.kind === 'field') return FIELD.act(hero, site, o);
    switch (o.kind) {
      case 'gseal':
        return summonGuardian(site, hero);
      case 'shell':
        return pickShell(hero, o);
      case 'crystal':
        return tell(
          hero,
          stateOf(hero).flags.lumi
            ? '✨ Il ne reste que des éclats de lumière.'
            : '✨ Une petite lumière tremble dans le cristal. Il lui manque des éclats.'
        );
      case 'dig': {
        if (!at(hero, q, 'spot'))
          return stateOf(hero).done[q.id]
            ? tell(hero, 'Le trou est vide : tu as déjà trouvé le trésor.')
            : false;
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
        tell(
          hero,
          '🎵 Pierre musicale trouvée (' +
            st.got.length +
            ' / 4). Son : ' +
            ['grave', 'doux', 'clair', 'aigu'][o.pitch - 1] +
            '.'
        );
        if (st.got.length >= 4) advance(hero, q);
        return true;
      }
      case 'chime':
        if (qworld.solved.q6) return creditSolved(hero, site);
        if (stepOf(hero, q) < 1 && !stateOf(hero).done[q.id])
          return tell(hero, '🎵 Le socle attend sa pierre musicale. Retrouve-les dans la forêt.');
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
      case 'viewpoint':
        if (!at(hero, q, 'spot')) return false;
        tell(
          hero,
          '🐦 L’ombre de l’arbre déploie ses ailes : un oiseau parfait. Théon accourt avec ses pinceaux !'
        );
        return advance(hero, q);
      case 'clue':
      case 'witness': {
        const c = GHOST_CLUES.find(c => c.id === o.clue),
          st = at(hero, q, 'clues');
        if (st && !st.got.includes(c.id)) {
          st.got.push(c.id);
          if (st.got.length >= 4) advance(hero, q);
        }
        return panel(hero, c.who ? '💬 ' + c.who : '🔎 Indice', c.what);
      }
      case 'shrine':
        return visitShrine(hero, o);
      case 'door':
        return tell(
          hero,
          qworld.flags['sanct_' + o.sanct]
            ? ''
            : '🗿 Une lourde porte de pierre. Elle ne bougera pas toute seule.'
        );
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
    modernPanel(
      '<div class="quest-dialog"><h2>' +
        esc(title) +
        '</h2><p class="quest-text">' +
        esc(text) +
        '</p><div class="quest-buttons"><button data-action="closePanels">D’accord</button></div></div>'
    );
    return true;
  }
  function travel(hero, to) {
    if (!stateOf(hero).flags.shortcut)
      return tell(
        hero,
        '🪨 Une pierre de passage endormie. On dit qu’une fois réveillée, elle relie la forêt au camp.'
      );
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
    return panel(
      hero,
      '🏛️ ' + s.name,
      s.lore +
        (lit ? ' L’autel brille : son étoile est revenue.' : ' L’autel est éteint, il attend son étoile.')
    );
  }
  // ---------------------------------------------------------------- Étape de simulation (hôte)
  function stepTrails(hero) {
    for (const [id, st] of Object.entries(stateOf(hero).active)) {
      const q = quest(Number(id));
      if (!q || st.step >= q.steps.length) continue;
      const step = q.steps[st.step],
        site = SITES[q.site],
        p = hero.player;
      if (!here(site)) continue;
      if (step.k === 'trail') {
        const end = q.id === 1 ? [px(site, 0), py(site, 0)] : site.trail.at(-1);
        if (Math.hypot(p.x - end[0], p.y - end[1]) < 2.4 * T) advance(hero, q);
      } else if (
        step.k === 'reach' &&
        Math.hypot(p.x - px(site, step.at[0]), p.y - py(site, step.at[1])) < 1.2 * T
      ) {
        if (q.id === 7)
          tell(
            hero,
            '🌳 L’arbre gardien parle : « Petite étincelle… Le Cœur de l’Aurore attend. Rassemble les six étoiles. »'
          );
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
      FIELD.step(SITES);
      stepMore();
      // La suite ne concerne que l'île.
      if (canaanUnder()) return;
      // Poisson doré : un remous brille d'or de temps en temps.
      const f = ST.q5;
      if (t >= f.next) {
        f.gold = Math.floor(Math.random() * 5);
        f.until = t + 110;
        f.next = t + 260 + Math.floor(Math.random() * 140);
        changed();
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
            on = game.heroes.some(
              h =>
                !h.player.dead &&
                Math.floor(h.player.x / T) === site.x + dx &&
                Math.floor(h.player.y / T) === site.y + dy
            );
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
      if (!here(npc) || !present(hero, npc) || (npc.dwarf && !hasWords(hero, npc))) continue;
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < 1.8 * T && d < bd) [best, bd] = [{ npc }, d];
    }
    for (const site of Object.values(SITES)) {
      if (!here(site)) continue;
      for (const o of site.objs) {
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if (d < (o.range ?? 1.6) * T && d < bd && usable(hero, site, o)) [best, bd] = [{ site, o }, d];
      }
    }
    if (WAYSTONE.camp && !canaanUnder()) {
      const d = Math.hypot(p.x - WAYSTONE.camp.x, p.y - WAYSTONE.camp.y);
      if (d < 1.6 * T && d < bd)
        best = { site: null, o: { id: 'campstone', kind: 'campstone', ...WAYSTONE.camp } };
    }
    return best;
  }
  // Un objet ne se propose que s'il sert à ce héros (objets personnels cachés, sanctuaire fermé…).
  function usable(hero, site, o) {
    const q = site.quest,
      st = stateOf(hero);
    switch (o.kind) {
      case 'field':
        return FIELD.usable(hero, site, o);
      case 'mstone':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'dig':
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
      case 'crystal':
      case 'islechest':
      case 'machine':
      case 'plank':
      case 'oasis':
        return false;
      case 'leaf':
      case 'fresco':
      case 'ccrystal':
        return !!at(hero, q, 'collect') && !at(hero, q, 'collect').got.includes(o.id);
      case 'goldleaf':
        return !!at(hero, q, 'catch');
      case 'echest':
        return !!at(hero, q, 'puzzle');
      case 'altar':
        return !!at(hero, q, 'spot') || !!st.done[26];
      case 'fresco27':
      case 'altar27':
        return true;
      case 'gseal':
        // Un seul gardien à la fois (chez l'invité, FIGHTS est vide : le boss présent suffit).
        return (
          guardianDue(hero, q) &&
          !FIGHTS[site.id] &&
          !game.world.monsters.some(m => m.boss && m.t === guardianOf(q).name)
        );
      case 'shell':
        return !st.shells.includes(o.shell);
    }
    return true;
  }
  function label(hero, n) {
    if (n.npc) return 'Parler à ' + n.npc.def.name;
    const o = n.o;
    if (o.kind === 'field') return FIELD.label(o);
    return (
      {
        dig: 'Creuser',
        ripple: 'Ferrer',
        mstone: 'Écouter la pierre',
        chime: 'Jouer la pierre',
        mirror: 'Tourner le miroir',
        waystone: 'Pierre de passage',
        campstone: 'Pierre de passage',
        viewpoint: 'Appeler Théon',
        clue: 'Examiner',
        witness: 'Interroger ' + (GHOST_CLUES.find(c => c.id === o.clue)?.who || ''),
        shrine: 'Prier à l’autel',
        door: 'Pousser la porte',
        leaf: 'Toucher la feuille',
        fresco: 'Prendre le fragment',
        archive: 'Lire les archives',
        vane: 'Regarder la girouette',
        goldleaf: 'Attraper la feuille',
        traveler: 'Écouter ' + (o.who || ''),
        hide: 'Fouiller : ' + (o.name || ''),
        treasure: 'Porte du trésor',
        templedoor: 'Porte du temple',
        altar: 'Poser les étoiles',
        fresco27: 'Lire la fresque',
        altar27: 'Éveiller le Cœur',
        ccrystal: 'Réunir la lumière',
        lever: 'Actionner le levier',
        echest: 'Ouvrir le coffre',
        gseal: 'Briser le sceau de l’Ombre',
        shell: 'Ramasser le coquillage'
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
    if (a.op === 'quest-take') return take(hero, a.q);
    if (a.op === 'quest-abandon') return abandon(hero, a.q);
    if (a.op === 'quest-turnin') return turnIn(hero, a.q);
    if (a.op === 'quest-track') {
      const st = stateOf(hero);
      st.track = st.active[a.q] ? a.q : null;
      return true;
    }
    if (a.op === 'quest-choice') return choose(hero, a.q, a.choice);
    if (a.op === 'quest-talk') return hear(hero, a.q);
    if (a.op === 'quest-trade') return trade(hero, a.npc);
    if (a.op === 'quest-shells') return claimShells(hero);
    if (a.op === 'quest-act') {
      if (a.site === 'camp' && a.obj === 'campstone')
        return (
          WAYSTONE.camp &&
          Math.hypot(hero.player.x - WAYSTONE.camp.x, hero.player.y - WAYSTONE.camp.y) < 2 * T &&
          travel(hero, 'forest')
        );
      const site = SITES[a.site],
        o = site?.objs.find(o => o.id === a.obj);
      if (
        !o ||
        !here(site) ||
        Math.hypot(hero.player.x - o.x, hero.player.y - o.y) > ((o.range ?? 1.6) + 0.6) * T ||
        !usable(hero, site, o)
      )
        return false;
      return act(hero, site, o) !== false;
    }
    return false;
  }
  // Réponse ou choix moral : à une question (answer), une mauvaise réponse se retente ; sinon, chaque choix compte.
  function choose(hero, id, choice) {
    const q = quest(id),
      st = q && at(hero, q, 'choice'),
      npc = st && NPCS[q.steps[st.step].npc || q.npc];
    if (
      !st ||
      !npc ||
      !here(npc) ||
      Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T ||
      !Number.isInteger(choice) ||
      !q.choices[choice]
    )
      return false;
    if (q.answer !== undefined && choice !== q.answer) {
      tell(hero, '👻 « Non… ce n’est pas ça. Je crois que non. »');
      return true;
    }
    stateOf(hero).choices[q.id] = choice;
    return advance(hero, q);
  }
  // Étape « parler à quelqu'un » : ses répliques sont lues.
  function hear(hero, id) {
    const q = quest(id),
      st = q && at(hero, q, 'talk'),
      npc = st && NPCS[q.steps[st.step].npc];
    if (!npc || !here(npc) || Math.hypot(hero.player.x - npc.x, hero.player.y - npc.y) > 3.5 * T)
      return false;
    return advance(hero, q);
  }
  // Étape en cours qui se passe avec ce personnage (parler, choisir) : { q, step }, ou null.
  function errand(hero, npc) {
    for (const id of Object.keys(stateOf(hero).active)) {
      const q = quest(Number(id)),
        step = q?.steps[stateOf(hero).active[id].step];
      if ((step?.k === 'talk' || step?.k === 'choice') && (step.npc || q.npc) === npc.id) return { q, step };
    }
    return null;
  }
  // Un nain de la forteresse garde ses répliques ordinaires quand il n'a rien à dire d'une quête.
  const hasWords = (hero, npc) =>
    !!errand(hero, npc) || ['offer', 'active', 'ready'].includes(npcState(hero, npc.quest));
  // Personnage visible seulement à une étape précise (Vesper).
  const present = (hero, npc) => {
    const w = npc.def.when;
    return !w || stateOf(hero).active[w.quest]?.step === w.step;
  };

  // ---------------------------------------------------------------- Dialogues des PNJ
  // Contrat (demande d'habitant) : 'ready', 'active', ou 'idle' quand il n'est pas en cours (il se prend à la guilde).
  function npcState(hero, q) {
    if (!q) return 'none';
    const st = stateOf(hero);
    if (questReady(st, q)) return 'ready';
    if (st.active[q.id]) return 'active';
    if (isContract(q)) return 'idle';
    if (st.done[q.id]) return 'after';
    return canStart(st, q) ? 'offer' : 'locked';
  }
  function rewardLine(q) {
    const level = clampLevel(game.hero.level);
    if (isContract(q)) {
      const rank = contractRank(q),
        first = !stateOf(game.hero).done[q.id],
        r = q.reward,
        special = first && (r.flags || r.jewel || r.recipe || r.fishXp || r.item === 'Légendaire');
      return (
        '+' +
        questXp(q, level) +
        ' XP · +' +
        questGold(q, level) +
        ' or · +' +
        contractFame(q) +
        ' renommée · équipement ' +
        rank.item +
        (special ? ' · la première fois : ' + r.text : '')
      );
    }
    return '+' + questXp(q, level) + ' XP · +' + questGold(q, level) + ' or · ' + q.reward.text;
  }
  // Madame Nacre : la collection de coquillages chantants et ses paliers.
  function talkCollector(npc) {
    const st = stateOf(game.hero),
      due = shellRewardsDue(st),
      n = st.shells.length;
    const body =
      '<p class="quest-text">« ' +
      esc(
        n
          ? due.length
            ? 'Oh ! Ils chantent si fort, tes coquillages ! Montre-les-moi, j’ai quelque chose pour toi.'
            : 'Écoute-les… chacun fredonne un petit bout de la vieille chanson. Il en reste d’autres, j’en suis sûre.'
          : 'Bonjour, voyageur ! Tu n’aurais pas entendu un coquillage chanter, par hasard ?'
      ) +
      ' »</p><p class="quest-note">' +
      esc(SHELL_LORE) +
      '</p><div class="quest-card"><b>🐚 Coquillages chantants : ' +
      n +
      ' / ' +
      SHELLS.length +
      '</b><ul>' +
      SHELL_REWARDS.map(
        (r, i) =>
          '<li class="' +
          (i < st.paid ? 'done' : n >= r.n ? 'current' : '') +
          '">' +
          (i < st.paid ? '✓ ' : n >= r.n ? '➤ ' : '◦ ') +
          r.n +
          ' coquillages · +' +
          r.gold +
          ' or · ' +
          esc(r.text) +
          '</li>'
      ).join('') +
      '</ul><p class="quest-note">Chaque lieu de quête cache un coquillage, un peu à l’écart. De près, ils scintillent.</p></div>';
    CANAAN_SOUND.voice(npc.def.name, body.replace(/<[^>]*>/g, ' '));
    modernPanel(
      '<div class="quest-dialog"><h2>' +
        esc(npc.def.name) +
        '</h2>' +
        body +
        '<div class="quest-buttons">' +
        (due.length ? '<button data-action="questShells">Montrer mes coquillages</button>' : '') +
        '<button data-action="closePanels">Au revoir</button></div></div>'
    );
  }
  // Échange du grand troc proposé par cet habitant (si c'est son tour).
  function tradeHtml(hero, npc) {
    const t = tradeAt(hero, npc.id);
    if (!t) return { body: '', button: '' };
    const held = tradeItem(stateOf(hero));
    return {
      body:
        '<div class="quest-trade">' +
        (held ? '<p class="quest-note">🎁 Tu tiens : ' + esc(held.icon + ' ' + held.name) + '</p>' : '') +
        '<p class="quest-text">« ' +
        esc(t.line) +
        ' »</p></div>',
      button:
        '<button data-action="questTrade" data-npc="' +
        npc.id +
        '">' +
        esc(
          held ? 'Donner : ' + held.icon + ' ' + held.name : 'Prendre : ' + t.gives.icon + ' ' + t.gives.name
        ) +
        '</button>'
    };
  }
  function talkTo(id) {
    if (NPCS[id].def.collector) return talkCollector(NPCS[id]);
    if (NPCS[id].def.guild) return CANAAN_GUILD.open();
    const npc = NPCS[id],
      q = npc.quest,
      hero = game.hero,
      st = stateOf(hero),
      mode = npcState(hero, q),
      lumi = st.flags.lumi
        ? '<p class="quest-lumi">✨ Lumi tinte doucement près de ' + esc(npc.def.name) + '.</p>'
        : '';
    let body = '',
      buttons = '';
    const task = errand(hero, npc);
    if (task) {
      const { q: tq, step } = task;
      if (step.k === 'talk') {
        body = step.lines.map(t => '<p class="quest-text">« ' + esc(t) + ' »</p>').join('');
        buttons = '<button data-action="questHear" data-quest="' + tq.id + '">Continuer</button>';
      } else {
        body = '<p class="quest-text">« ' + esc(tq.talk.ask) + ' »</p>';
        buttons = tq.choices
          .map(
            (c, i) =>
              '<button data-action="questChoice" data-quest="' +
              tq.id +
              '" data-choice="' +
              i +
              '">' +
              esc(c) +
              '</button>'
          )
          .join('');
      }
    } else if (!q) body = '<p class="quest-text">« Bonjour, voyageur. Le vent tourne, ces temps-ci… »</p>';
    else if (mode === 'idle')
      body =
        '<p class="quest-text">« ' +
        esc(
          st.done[q.id]
            ? q.talk.afterChoice?.[st.choices[q.id]] || q.talk.after
            : q.talk.idle || 'Bonjour, voyageur. J’ai déposé une demande à la guilde du Camp de l’Aurore.'
        ) +
        ' »</p><p class="quest-note">' +
        esc(tt('Demande affichée parfois au tableau de la guilde (rang {rang}).', { rang: q.contract })) +
        '</p>';
    else if (mode === 'locked') {
      const before = missingQuest(st, q);
      body =
        '<p class="quest-text">« Bonjour, voyageur. Le vent tourne, ces temps-ci… »</p><p class="quest-note">Cette partie de l’histoire commence plus tard : termine d’abord « ' +
        esc(before.title) +
        ' » (' +
        esc(QUEST_NPCS[before.npc].name) +
        ').</p>';
    } else if (mode === 'offer') {
      body = q.talk.offer.map(t => '<p class="quest-text">« ' + esc(t) + ' »</p>').join('') + card(q, st);
      buttons = '<button data-action="questAccept" data-quest="' + q.id + '">Accepter la quête</button>';
    } else if (mode === 'active')
      body = '<p class="quest-text">« ' + esc(q.talk.active) + ' »</p>' + card(q, st);
    else if (mode === 'ready') {
      body =
        '<p class="quest-text">« ' +
        esc(q.talk.ready) +
        ' »</p><p class="quest-reward">🏆 ' +
        esc(rewardLine(q)) +
        '</p>';
      buttons =
        '<button data-action="questTurnIn" data-quest="' +
        q.id +
        '">' +
        (isContract(q) ? 'Rendre le contrat' : 'Terminer la quête') +
        '</button>';
    } else
      body =
        '<p class="quest-text">« ' + esc(q.talk.afterChoice?.[st.choices[q.id]] || q.talk.after) + ' »</p>';
    const swap = tradeHtml(hero, npc);
    body += swap.body;
    buttons += swap.button;
    CANAAN_SOUND.voice(npc.def.name, body.replace(/<[^>]*>/g, ' '));
    modernPanel(
      '<div class="quest-dialog"><h2>' +
        esc(npc.def.name) +
        (task
          ? ' <small>· ' + esc(task.q.title) + '</small>'
          : mode === 'offer' || mode === 'active' || mode === 'ready' || mode === 'idle'
            ? ' <small>· ' + esc(q.title) + '</small>'
            : '') +
        '</h2>' +
        body +
        lumi +
        '<div class="quest-buttons">' +
        buttons +
        '<button data-action="closePanels">' +
        (buttons ? 'Plus tard' : 'Au revoir') +
        '</button></div></div>'
    );
  }
  // Genres d'une quête, d'après ses étapes (dans l'ordre, sans répétition).
  const KINDS = {
    kill: 'Chasse',
    loot: 'Butin',
    pick: 'Collecte',
    collect: 'Collecte',
    wave: 'Défense',
    defense: 'Défense',
    escort: 'Escorte',
    chase: 'Poursuite',
    race: 'Course',
    hunt: 'Champion',
    guardian: 'Gardien',
    talk: 'Messager',
    work: 'Métier',
    timing: 'Métier',
    clear: 'Donjon',
    sky: 'Exploration',
    reach: 'Exploration',
    trail: 'Exploration',
    spot: 'Exploration',
    clues: 'Enquête',
    search: 'Enquête',
    choice: 'Choix',
    catch: 'Adresse',
    puzzle: 'Énigme'
  };
  // Avancement d'une étape (« 3 / 8 »), dans son propre élément.
  const countHtml = (s, a) => {
    const p = FIELD.progress(s, a);
    return p ? ' <em class="quest-count">' + p[0] + ' / ' + p[1] + '</em>' : '';
  };
  const kindsOf = q => [...new Set(q.steps.map(s => KINDS[s.k]).filter(Boolean))];
  const chapterName = c => (c.under ? c.n : 'Chapitre ' + c.n);
  const chapterPlace = c => (c.under ? 'Les Tréfonds' : ZONES[c.zone].name);
  const placeOf = q => (SITES[q.site]?.under ? 'Les Tréfonds' : ZONES[SITES[q.site].zone].name);
  function card(q, st) {
    const a = st.active[q.id],
      chapter = CHAPTERS[q.chapter];
    return (
      '<div class="quest-card' +
      (q.main ? ' main' : '') +
      '"><b>' +
      (q.main
        ? '📖 Histoire · ' + chapterName(chapter)
        : isContract(q)
          ? '🛡️ Contrat de rang ' +
            q.contract +
            ' · ' +
            (q.npc === 'guilde' ? 'Avis de la guilde' : QUEST_NPCS[q.npc].name)
          : '🍃 Quête secondaire') +
      ' — ' +
      esc(q.title) +
      '</b>' +
      '<span class="quest-level">' +
      (q.scaled ? 'À ton niveau' : 'Niveau conseillé ' + q.level) +
      '</span><div class="quest-kinds">' +
      kindsOf(q)
        .map(k => '<i>' + k + '</i>')
        .join('') +
      '</div><p>' +
      esc(q.summary) +
      '</p><ul>' +
      q.steps
        .map((s, i) => {
          const done = st.done[q.id] || (a && a.step > i),
            cur = a && a.step === i;
          return (
            '<li class="' +
            (done ? 'done' : cur ? 'current' : '') +
            '">' +
            (done ? '✓ ' : cur ? '➤ ' : '◦ ') +
            esc(s.text) +
            (cur ? countHtml(s, a) : '') +
            '</li>'
          );
        })
        .join('') +
      (a && a.step >= q.steps.length
        ? '<li class="current">➤ Retourner voir ' + esc(whoTo(q)) + '</li>'
        : '') +
      '</ul><p class="quest-reward">🏆 ' +
      esc(rewardLine(q)) +
      '</p></div>'
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
  window.questHear = id => {
    closePanels();
    if (request('quest-talk', { q: id }) === null) hear(game.hero, id);
  };
  window.questTrade = npcId => {
    closePanels();
    if (request('quest-trade', { npc: npcId }) === null) trade(game.hero, npcId);
  };
  window.questShells = () => {
    closePanels();
    if (request('quest-shells', {}) === null) claimShells(game.hero);
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
  const discover = q =>
    '<p class="quest-note">➤ À découvrir : parle à ' +
    esc(QUEST_NPCS[q.npc].name) +
    ' (' +
    esc(placeOf(q)) +
    ').</p>';
  function renderJournal(tab = 'main') {
    ui.tab = tab;
    const st = stateOf(game.hero),
      list = q => {
        const a = st.active[q.id];
        return (
          card(q, st) +
          (a
            ? '<button class="quest-track' +
              (st.track === q.id ? ' on' : '') +
              '" data-action="questTrack" data-quest="' +
              q.id +
              '">' +
              (st.track === q.id ? '📍 Suivie' : 'Suivre') +
              '</button>'
            : '')
        );
      };
    let html = '';
    if (tab === 'main') {
      const stars = starCount(st);
      html += '<p class="quest-intro"><b>' + esc(STORY_TITLE) + '</b> — ' + esc(STORY_INTRO) + '</p>';
      html +=
        '<p class="quest-stars">Étoiles du Cœur : ' +
        '★'.repeat(stars) +
        '☆'.repeat(6 - stars) +
        (st.flags.lumi ? ' · ✨ Lumi t’accompagne' : '') +
        '</p>';
      if (st.flags.starmap)
        html +=
          '<div class="quest-map"><b>🗺️ Carte des sanctuaires</b><ul>' +
          SANCTUARIES.map(s => {
            const open = qworld.flags['sanct_' + s.id],
              lit = st.flags[s.star];
            return (
              '<li>' +
              (lit ? '★' : open ? '◇' : '·') +
              ' ' +
              '<span>' +
              esc(s.name) +
              '</span> — ' +
              esc(ZONES[s.zone].name) +
              (open ? ' <small>' + (st.flags['visit_' + s.id] ? '(visité)' : '(ouvert)') + '</small>' : '') +
              '</li>'
            );
          }).join('') +
          '</ul></div>';
      // La Ballade : un couplet par gardien vaincu.
      const verses = QUESTS.filter(q => q.verse),
        sung = verses.filter(q => st.done[q.id]);
      if (sung.length)
        html +=
          '<div class="quest-map quest-ballad"><b>🎵 La Ballade de l’Aurore · ' +
          sung.length +
          ' / ' +
          verses.length +
          '</b>' +
          verses.map(q => '<p>' + (st.done[q.id] ? '« ' + esc(q.verse) + ' »' : '« … »') + '</p>').join('') +
          '</div>';
      CHAPTERS.forEach((c, i) => {
        const qs = QUESTS.filter(q => q.main && q.chapter === i);
        html +=
          '<h3 class="quest-chapter">' +
          chapterName(c) +
          ' — ' +
          esc(c.title) +
          ' <small>· ' +
          (c.under
            ? 'Les Tréfonds, à ton niveau'
            : esc(ZONES[c.zone].name) + ', niveaux ' + c.levels.join(' à ')) +
          '</small></h3><p class="quest-note">' +
          esc(c.intro) +
          '</p>';
        // Interlude : les quatre voix retrouvées.
        if (c.under && VOICES.some(v => st.flags[v.flag]))
          html +=
            '<p class="quest-stars">🗿 ' +
            VOICES.map(v => (st.flags[v.flag] ? '◆ ' + esc(v.name) : '◇ …')).join(' · ') +
            '</p>';
        for (const q of qs) {
          if (st.active[q.id]) html += list(q);
          else if (st.done[q.id]) html += '<p class="quest-done-line">✓ ' + esc(q.title) + '</p>';
          else if (canStart(st, q)) html += discover(q);
        }
      });
    } else if (tab === 'side') {
      // Guilde : rang, renommée, contrat en cours (et les anciennes quêtes secondaires encore en cours).
      html += CANAAN_GUILD.summary(game.hero);
      const side = QUESTS.filter(q => !q.main && st.active[q.id]);
      html += side.length
        ? side.map(list).join('')
        : '<p class="quest-note">Aucun contrat en cours. Le tableau de la guilde, au Camp de l’Aurore, en propose trois nouveaux tous les quarts d’heure.</p>';
    } else if (tab === 'treasure') {
      // Grand troc : l'objet tenu et à qui le porter.
      const held = tradeItem(st),
        next = TRADE_CHAIN[st.troc];
      html +=
        '<div class="quest-card"><b>🎁 Le grand troc · ' +
        st.troc +
        ' / ' +
        TRADE_CHAIN.length +
        '</b>' +
        (held
          ? '<p>Tu tiens : ' +
            esc(held.icon + ' ' + held.name) +
            ' — <i>' +
            esc(TRADE_CHAIN[st.troc - 1].desc) +
            '</i></p>'
          : '') +
        '<p class="quest-note">' +
        esc(
          held
            ? TRADE_CHAIN[st.troc - 1].hint
            : 'Les habitants de l’île aiment échanger. Milo, le berger des Plaines verdoyantes, a toujours de la laine en trop…'
        ) +
        '</p>' +
        (!next
          ? '<p class="quest-reward">🔎 La Loupe d’Orven fait briller les coquillages chantants de loin.</p>'
          : '') +
        '</div>';
      // Cœurs d'Aurore et gardiens de l'Ombre.
      const hearts = heartCount(st);
      html +=
        '<div class="quest-card"><b>❤️ Cœurs d’Aurore · ' +
        hearts +
        ' / ' +
        HEART_FLAGS.length +
        '</b><p>PV max +' +
        Math.round(heartBonus(st) * 100) +
        ' %. Chaque gardien vaincu en laisse un, et Madame Nacre en garde deux pour les grands collectionneurs.</p><ul>' +
        Object.entries(GUARDIANS)
          .map(([id, g]) => {
            const q = quest(Number(id)),
              won = st.flags['heart_q' + id],
              known = won || st.done[q.id] || st.active[q.id];
            return (
              '<li class="' +
              (won ? 'done' : '') +
              '">' +
              (won ? '✓ ' : '◦ ') +
              (known ? esc(g.name + ', ' + g.title) : '???') +
              ' — ' +
              esc(chapterPlace(CHAPTERS[q.chapter])) +
              '</li>'
            );
          })
          .join('') +
        '</ul></div>';
      // Coquillages chantants : par région, ceux qui restent (avec la loupe, on sait où chercher).
      const loupe = hasLoupe(game.hero);
      html +=
        '<div class="quest-card"><b>🐚 Coquillages chantants · ' +
        st.shells.length +
        ' / ' +
        SHELLS.length +
        '</b><p>' +
        esc(SHELL_LORE) +
        '</p><ul>' +
        ZONES.slice(0, 6)
          .map((z, i) => {
            const all = SHELLS.filter(sh => QUEST_SITES[sh.site].zone === i),
              got = all.filter(sh => st.shells.includes(sh.id)).length;
            return (
              '<li class="' +
              (got === all.length ? 'done' : '') +
              '">' +
              (got === all.length ? '✓ ' : '◦ ') +
              esc(z.name) +
              ' · ' +
              got +
              ' / ' +
              all.length +
              (loupe && got < all.length
                ? ' · ' +
                  esc(
                    'près de ' +
                      all
                        .filter(sh => !st.shells.includes(sh.id))
                        .map(sh => QUEST_NPCS[QUESTS.find(q => q.site === sh.site).npc].name)
                        .join(', ')
                  )
                : '') +
              '</li>'
            );
          })
          .join('') +
        '</ul><p class="quest-note">Chaque lieu de quête en cache un, un peu à l’écart. Madame Nacre, au Camp de l’Aurore, récompense les collectionneurs.</p></div>';
    } else {
      // Les contrats de la guilde se comptent dans l'onglet Guilde.
      const done = QUESTS.filter(q => st.done[q.id] && !isContract(q));
      html += done.length
        ? done
            .map(
              q =>
                '<div class="quest-card done"><b>✓ ' +
                esc(q.title) +
                '</b><p>' +
                esc(q.summary) +
                '</p><p class="quest-reward">🏆 ' +
                esc(rewardLine(q)) +
                '</p>' +
                (q.memory
                  ? '<p class="quest-memory"><b>📜 Souvenir</b> <span>' + esc(q.memory) + '</span></p>'
                  : '') +
                '</div>'
            )
            .join('')
        : '<p class="quest-note">Aucune quête terminée pour l’instant.</p>';
    }
    const tabs = [
      ['main', '📖 Histoire principale'],
      ['side', '🛡️ Guilde'],
      ['treasure', '🎁 Trésors'],
      ['done', '✓ Terminées']
    ];
    modernPanel(
      '<div class="quest-journal panel-fill" data-panel-size="md">' +
        canaanHead('📜 Journal de quêtes') +
        canaanTabs('questTab', tab, tabs) +
        '<div class="quest-body panel-scroll" data-keep-scroll="quest-' +
        tab +
        '">' +
        html +
        '</div></div>'
    );
  }

  // ---------------------------------------------------------------- Dessin
  const R = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const visible = (x, y, m = 80) =>
    Math.abs(x - camX - W / 2) < W / 2 + m && Math.abs(y - camY - H / 2) < H / 2 + m;
  const prompt = (c, x, y, text) => drawCanaanPrompt(c, '[E] ' + text, x, y);
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
    c.font = canaanFont(size, '');
    c.textAlign = 'center';
    c.fillStyle = col;
    c.fillText(text, x, y);
  }
  function torchFlame(c, x, y, s = 1) {
    CANAAN_TILE_KIT.flame(c, x, y, s, FLAME, x);
    canaanLight(x, y - 6, 120 * s, '#ffcf6a');
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
    if (o.kind === 'field') return FIELD.draw(c, site, o);
    const x = o.x,
      y = o.y,
      S = ST[site.id],
      hero = game.hero,
      q = site.quest,
      st = stateOf(hero);
    switch (o.kind) {
      case 'gseal':
        return drawSeal(c, site, o);
      case 'shell':
        return drawShell(c, o);
      case 'crystal':
        if (st.flags.lumi) {
          for (let k = 0; k < 5; k++)
            block(c, x - 14 + k * 6, y + 4 - (k % 2) * 4, 4, 6, ['#bfe8ff', '#ffffff', '#7ab0d0']);
          return;
        }
        return crystalArt(c, x, y, '#cfefff');
      case 'hilltop':
        return flagArt(c, x, y, qworld.flags.sommet ? '#ffd84a' : '#c84a4a');
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
        if (o.kind === 'chime' && !(qworld.solved.q6 || stepOf(hero, q) >= 1 || st.done[6]))
          return pedestalArt(c, x, y, PAL.moss, null);
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
        if (qworld.flags.goldtree) glow(c, x, y - 10, 90, '#ffd84a', 0.35 + 0.1 * Math.sin(time * 0.05));
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
      case 'easel':
        shadowAt(c, x, y + 14, 14, 4);
        block(c, x - 2, y - 30, 4, 44, PAL.wood);
        block(c, x - 14, y - 28, 28, 22, ['#f0ece4', '#ffffff', '#c8c0b0']);
        return R(c, x - 10, y - 24, 20, 14, st.done[10] ? '#3a4a5a' : '#d8d0c4');
      case 'plank':
        block(c, x - 23, y - 14, 6, 20, PAL.wood);
        block(c, x + 17, y - 14, 6, 20, PAL.wood);
        if (qworld.flags.bridge) block(c, x - 24, y - 6, 48, 12, ['#b98a58', '#d1a66c', '#8a5a34']);
        return;
      case 'clue':
        shadowAt(c, x, y + 10, 16, 4);
        if (o.clue === 'lanterne') {
          block(c, x - 6, y - 20, 12, 12, PAL.iron);
          return block(c, x - 10, y - 8, 20, 16, PAL.iron);
        }
        return block(c, x - 22, y - 6, 44, 12, PAL.wood);
      case 'witness': {
        const w = GHOST_CLUES.find(g => g.id === o.clue);
        personArt(
          c,
          x,
          y,
          {
            sex: o.clue === 'vieille' ? 'f' : 'm',
            hair: o.clue === 'vieille' ? '#e8e8e0' : '#5a4030',
            outfit: 'cuir'
          },
          o.clue === 'pecheur' ? 'rod' : 'none'
        );
        if (Math.hypot(P.x - x, P.y - y) < 4 * T) nameTag(c, x, y - 48, w.who);
        return;
      }
      case 'islechest':
        return chestArt(c, x, y, st.done[15] || (st.active[15] && st.active[15].step >= 1), '#ffe9a0');
      // Chapitres IV à VI.
      case 'leaf':
      case 'fresco':
        if (!usable(hero, site, o)) return;
        glow(c, x, y, 24, o.kind === 'leaf' ? '#ffd84a' : '#d8c8a8', 0.45 + 0.25 * Math.sin(time * 0.12 + x));
        if (o.kind === 'leaf') return rune(c, x, y + 6, '🍂', '#ffffff', 18);
        return block(c, x - 9, y - 7, 18, 14, ['#b8a080', '#d8c8a8', '#8a7050']);
      case 'archive':
        shadowAt(c, x, y + 14, 24, 5);
        block(c, x - 22, y - 34, 44, 48, PAL.wood);
        for (let k = 0; k < 3; k++)
          for (let b = 0; b < 6; b++)
            R(
              c,
              x - 18 + b * 6,
              y - 30 + k * 14,
              5,
              11,
              qworld.flags.archives ? ['#a83a2a', '#3a6aa8', '#c8a040', '#4a8a4a'][(b + k) % 4] : '#3a2a1a'
            );
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
        c.rotate(qworld.flags.grenier ? time * 0.04 : time * -0.01);
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
        c.rotate(qworld.flags.grenier ? time * 0.05 : time * -0.02);
        for (let k = 0; k < 4; k++) {
          c.rotate(Math.PI / 2);
          block(c, -4, -46, 8, 40, ['#e8e0d0', '#ffffff', '#b8b0a0']);
        }
        c.restore();
        return;
      case 'traveler':
        personArt(
          c,
          x,
          y,
          {
            sex: o.who === 'Mila' ? 'f' : 'm',
            race: o.who === 'Barnabé' ? 'orc' : 'humain',
            hair: '#5a3a20',
            outfit: o.who === 'Gaspard' ? 'rose' : 'foret'
          },
          o.who === 'Barnabé' ? 'spear' : 'none'
        );
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
          for (let k = 0; k < 6; k++)
            block(c, x - 16 + (k % 3) * 10, y - 4 - Math.floor(k / 3) * 6, 10, 6, [
              '#c86a2a',
              '#e89a4a',
              '#8a3a10'
            ]);
          return;
        }
        return block(c, x - 22, y - 6, 44, 10, PAL.wood);
      case 'starplate':
        R(c, x - 22, y - 14, 44, 28, '#a8885a');
        block(c, x - 18, y - 11, 36, 22, PAL.sand);
        if (qworld.flags.cite) glow(c, x, y, 50, '#fff0a0', 0.5);
        return rune(c, x, y + 6, '✦', qworld.flags.cite ? '#ffffff' : '#6a4a1a', 18);
      case 'machine': {
        shadowAt(c, x, y + 50, 70, 14);
        for (let k = 0; k < 3; k++) {
          const r = 22 + k * 20,
            rot = qworld.flags.machine ? time * 0.012 * (k % 2 ? -1 : 1) : k * 0.9;
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
        if (qworld.flags.machine) glow(c, x, y, 90, '#fff0a0', 0.4);
        return;
      }
      case 'treasure':
        return chestArt(c, x, y, qworld.flags.machine, '#ffd84a');
      case 'templedoor':
        shadowAt(c, x, y + 18, 26, 6);
        if (qworld.solved.q24) {
          block(c, x - 24, y - 34, 48, 6, PAL.sand);
          return chestArt(c, x, y - 4, false, '#ffd84a');
        }
        block(c, x - 22, y - 34, 44, 52, PAL.sand);
        return rune(c, x, y - 4, '☀', '#8a6418', 22);
      case 'oasis':
        return block(
          c,
          x - 22,
          y - 22,
          92,
          92,
          qworld.flags.oasis ? ['#3a8ac8', '#7ac0f0', '#1a5a8a'] : PAL.sand
        );
      case 'altar': {
        shadowAt(c, x, y + 14, 26, 6);
        block(c, x - 24, y - 8, 48, 22, PAL.lilac);
        const stars = st.done[26] || stepOf(hero, q) >= 4 ? 6 : starCount(st);
        for (let k = 0; k < 6; k++) {
          const lit = (st.done[26] || stepOf(hero, q) >= 4) && k < stars;
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
        if (!puzzleMirrorRocks(ST.q28.l).has(o.dx + ',' + o.dy)) return R(c, x - 14, y + 6, 28, 6, '#3a3048');
        shadowAt(c, x, y + 14, 18, 5);
        return block(c, x - 18, y - 16, 36, 30, PAL.lilac);
      case 'echest':
        return chestArt(c, x, y, st.done[28], '#c8b8f0');
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
    if (site.id === 'q24') {
      const b = beamOf(site);
      c.save();
      c.strokeStyle = '#ffe890';
      c.globalAlpha = 0.75;
      c.lineWidth = 5;
      c.shadowColor = '#ffd84a';
      c.shadowBlur = 14;
      c.beginPath();
      b.pts.forEach(([dx, dy], i) =>
        i ? c.lineTo(px(site, dx), py(site, dy) - 8) : c.moveTo(px(site, dx), py(site, dy) - 8)
      );
      c.stroke();
      c.restore();
    }
    if (site.id === 'q29') {
      // Braise : posé près de Pyria, puis en vol au-dessus de la clairière.
      let x = px(site, -5),
        y = py(site, -1),
        flap = time * 0.1;
      if (qworld.flags.pyria) {
        x = px(site, 0) + Math.cos(time * 0.02) * 4 * T;
        y = py(site, -2) + Math.sin(time * 0.04) * 1.5 * T - 30;
        flap = time * 0.4;
      }
      dragonArt(c, x, y, flap);
    }
  }
  const nameTag = (c, x, y, text) => drawCanaanName(c, text, x, y);
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
    if (site.id === 'q3' && qworld.flags.sommet) {
      const sprite = CANAAN_LIFE.icon('mouton'),
        x = px(site, 3),
        y = py(site, -4);
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
        c.font = canaanFont(9);
        c.textAlign = 'center';
        c.fillStyle = '#2a1a0a';
        c.fillText(
          s.dir[0] > 0 ? 'Sortie →' : s.dir[0] < 0 ? '← Sortie' : s.dir[1] < 0 ? '↑ Sortie' : '↓ Sortie',
          x + s.dir[0] * 6,
          y - 22
        );
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
      if (!here(site)) continue;
      if (!site.under && visible(px(site, 0), py(site, 0), (site.r + 7) * T)) drawSiteExtras(c, site);
      for (const o of site.objs) if (visible(o.x, o.y)) drawObj(c, site, o);
    }
    if (WAYSTONE.camp && !canaanUnder() && visible(WAYSTONE.camp.x, WAYSTONE.camp.y))
      drawObj(c, SITES.q8, { kind: 'waystone', x: WAYSTONE.camp.x, y: WAYSTONE.camp.y });
    for (const npc of Object.values(NPCS)) {
      if (!here(npc) || !visible(npc.x, npc.y) || !present(game.hero, npc)) continue;
      const def = npc.def,
        // Un nain du jeu se promène autour de sa place (dessiné par underground.js).
        at0 = npc.dwarf || npc,
        dx = P.x - at0.x,
        dy = P.y - at0.y;
      if (Math.hypot(dx, dy) < 3 * T)
        npc.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 2 : 0;
      const s = def.child ? 0.8 : 1;
      if (npc.dwarf) {
        // Déjà dessiné.
      } else if (def.mob) FIELD.mobArt(c, npc.id, def.mob, npc.x, npc.y, 1, def.pal);
      else if (def.dwarf) {
        c.globalAlpha = def.ghost ? 0.6 + 0.15 * Math.sin(time * 0.06) : 1;
        if (def.ghost) glow(c, npc.x, npc.y - 16, 40, '#bfe8ff', 0.35);
        CANAAN_UNDER.dwarfArt(c, { name: def.name, ...def.dwarf }, npc.x, npc.y, dx < 0 ? -1 : 1);
        c.globalAlpha = 1;
      } else if (def.spirit) {
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
        c.drawImage(
          canaanHeroSprite(sanitizeLook(def.look), npc.face, 0, { tool: def.tool || 'none' }),
          Math.round(npc.x - 26 * s),
          Math.round(npc.y + 18 - 60 * s + (def.ghost ? Math.sin(time * 0.05) * 3 : 0)),
          Math.round(52 * s),
          Math.round(64 * s)
        );
        c.globalAlpha = 1;
      }
      const mode = npcState(game.hero, npc.quest),
        // Grand troc : l'habitant qui attend l'objet tenu montre un cadeau (de près) ; Madame Nacre, un palier atteint.
        gift =
          (Math.hypot(dx, dy) < 6 * T && tradeAt(game.hero, npc.id)) ||
          (def.collector && shellRewardsDue(stateOf(game.hero)).length),
        // Une étape en cours l'attend (parler, choisir) : « ? », comme une quête à rendre.
        mark = def.guild
          ? guildMark(game.hero)
          : errand(game.hero, npc)
            ? '?'
            : mode === 'offer'
              ? '!'
              : mode === 'ready'
                ? '?'
                : mode === 'active'
                  ? '…'
                  : '';
      if (gift && !mark) rune(c, at0.x, at0.y - 58 * s + Math.sin(time * 0.08) * 3, '🎁', '#ffffff', 22);
      if (mark) {
        // Au-dessus du nom et de l'invitation des nains.
        const yy = at0.y - (npc.dwarf ? 78 : 58 * s) + Math.sin(time * 0.08) * 3;
        canaanText(
          c,
          mark,
          at0.x,
          yy,
          26,
          mark === '…' ? '#c8c0b0' : npc.quest?.main ? '#ffd84a' : '#fff0a0',
          {
            line: 4
          }
        );
      }
      if (!npc.dwarf && Math.hypot(dx, dy) < 4 * T) nameTag(c, npc.x, npc.y - 46 * s, def.name);
    }
    if (!guest()) drawZones(c);
    drawRaised(c);
    FIELD.drawHero(c);
    // Lumi éclaire la nuit autour de chaque héros qu'elle accompagne.
    for (const hero of game.heroes) {
      const l = lumiAt.get(hero);
      if (l && !hero.player.dead) canaanLight(l.x, l.y, 90, '#bfe8ff');
    }
    const n = nearest();
    if (n && !modalOpen() && !n.npc?.dwarf) {
      const x = n.npc ? n.npc.x : n.o.x,
        y = n.npc ? n.npc.y : n.o.y;
      prompt(c, x, y - (n.npc ? 74 : 44), label(game.hero, n));
    }
    c.restore();
  }
  // Maîtresse de guilde : « ? » quand un avis de la guilde est à rendre, « ! » quand aucun contrat n'est en cours.
  function guildMark(hero) {
    const c = activeContract(stateOf(hero));
    return !c ? '!' : c.npc === 'guilde' && questReady(stateOf(hero), c) ? '?' : '';
  }
  // Bulles : un PNJ qui a une quête à proposer appelle le héros qui passe.
  function drawBubbles(c) {
    if (game.world.instance) return;
    for (const npc of Object.values(NPCS)) {
      if (!here(npc)) continue;
      const d = Math.hypot(P.x - npc.x, P.y - npc.y);
      if (!npc.quest || d > 4 * T || d < 1.6 * T || npcState(game.hero, npc.quest) !== 'offer') continue;
      // Traduite avant d'être coupée : un début de phrase seul ne serait pas reconnu.
      const said = translateText(npc.quest.talk.offer[0]),
        text = said.slice(0, 60) + (said.length > 60 ? '…' : '');
      c.save();
      c.font = canaanFont(12, '');
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
  // Lumi flotte et éclaire, sans bulle de message (le suivi de la quête reste dans le cadre à l'écran).
  const lumiAt = new WeakMap();
  window.CanaanStages.drawQuests = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    for (const hero of game.heroes) {
      const p = hero.player,
        flags =
          hero === game.hero
            ? stateOf(hero).flags
            : {
                lumi: hero.questLook & 1,
                blessing: hero.questLook & 2,
                aurora: hero.questLook & 4,
                echo: hero.questLook & 8
              };
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
      if (flags.blessing && time % 14 === 0)
        particles.push({
          x: p.x + (Math.random() - 0.5) * 34,
          y: p.y + 14,
          vx: 0,
          vy: -0.4,
          life: 34,
          c: '#ffd84a',
          r: 2
        });
      // Écho : une lueur d'ambre des profondeurs, qui tourne lentement autour du héros.
      if (flags.echo) {
        const a = time * 0.035,
          ex = p.x + Math.cos(a) * 24,
          ey = p.y - 30 + Math.sin(a * 2) * 5;
        glow(ctx, ex, ey, 22, '#ffc65a', 0.55);
        R(ctx, ex - 3, ey - 3, 6, 6, '#8a5a20');
        R(ctx, ex - 2, ey - 2, 4, 4, '#ffe0a0');
        canaanLight(ex, ey, 70, '#ffc65a');
      }
      if (!flags.lumi) continue;
      const l = lumiAt.get(hero) || { x: p.x, y: p.y };
      // Lumi guide son héros : elle vole du côté de l'objectif suivi (encadré du suivi), sinon derrière lui.
      const goal = hero === game.hero && guideTo && Math.hypot(guideTo.x - p.x, guideTo.y - p.y) > 3 * T,
        ga = goal ? Math.atan2(guideTo.y - p.y, guideTo.x - p.x) : 0;
      const tx = goal ? p.x + Math.cos(ga) * 46 : p.x - 26 * (p.face || 1),
        ty = (goal ? p.y - 30 + Math.sin(ga) * 30 : p.y - 52) + Math.sin(time * 0.07) * 6;
      l.x += (tx - l.x) * 0.06;
      l.y += (ty - l.y) * 0.06;
      lumiAt.set(hero, l);
      // Lumi parle (conseil de guide.js) : un anneau de lumière qui pulse autour d'elle.
      if (hero === game.hero && CANAAN_GUIDE.speaking()) {
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.15);
        ctx.strokeStyle = '#dff4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 12 + Math.sin(time * 0.15) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      glow(ctx, l.x, l.y, 30, '#bfe8ff', 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      ctx.fill();
      R(ctx, l.x - 9 + Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
      R(ctx, l.x + 5 - Math.sin(time * 0.3) * 2, l.y - 3, 4, 2, '#dff4ff');
    }
    ctx.restore();
    watchFanfare();
    if (time % 15 === 0) tracker();
  };
  // Cible de la quête suivie : le PNJ s'il faut y retourner, sinon le lieu ou l'objet de l'étape.
  function target(hero) {
    const st = stateOf(hero),
      q = quest(st.track);
    if (!q || !st.active[q.id]) return null;
    const a = st.active[q.id],
      step = q.steps[a.step];
    // Avis de la guilde : il se rend à la guilde ; ses objectifs se font n'importe où.
    if (q.npc === 'guilde' && !step) {
      const door = CANAAN_GUILD.door();
      return door && { ...door, text: 'Retourne voir ' + whoTo(q), q };
    }
    const site = SITES[step?.site || q.site];
    if (!site)
      return step
        ? {
            x: hero.player.x,
            y: hero.player.y,
            text: step.text,
            count: FIELD.progress(step, a),
            q,
            anywhere: true
          }
        : null;
    // Personnage à voir : celui de la quête à rendre, ou celui de l'étape.
    const who = !step ? q.npc : step.k === 'talk' || step.k === 'choice' ? step.npc || q.npc : null,
      npc = who && NPCS[who],
      text = step ? step.text : 'Retourne voir ' + whoTo(q),
      count = step ? FIELD.progress(step, a) : null,
      under = npc ? !!npc.under : !!site.under;
    // L'objectif est sur l'autre couche : l'entrée des Tréfonds la plus proche.
    if (step?.k !== 'sky' && step?.k !== 'work' && under !== canaanUnder()) {
      const p = hero.player,
        e = [...CANAAN_UNDER.ENTRANCES].sort(
          (u, v) => Math.hypot(u.x * T - p.x, u.y * T - p.y) - Math.hypot(v.x * T - p.x, v.y * T - p.y)
        )[0];
      return {
        x: (e.x + 0.5) * T,
        y: (e.y + 0.5) * T,
        text: under ? 'Descendre dans les Tréfonds' : 'Remonter à la surface',
        q
      };
    }
    if (npc) return { x: npc.x, y: npc.y, text, q };
    const spot = FIELD.target(hero, site, q, step, a);
    if (spot) return { ...spot, text, count, q };
    if (step.k === 'guardian') {
      const seal = site.objs.find(o => o.kind === 'gseal');
      if (seal) return { x: seal.x, y: seal.y, text, q };
    }
    if (step.k === 'collect') {
      const left = site.objs.find(
        o => ['mstone', 'leaf', 'fresco', 'ccrystal'].includes(o.kind) && !a.got.includes(o.id)
      );
      if (left) return { x: left.x, y: left.y, text: step.text, count, q, vague: true };
    }
    if (step.at)
      return {
        x: px(site, step.at[0]),
        y: py(site, step.at[1]),
        text: step.text,
        q,
        vague: step.k === 'spot'
      };
    if (step.k === 'catch') return { x: site.leaf.x, y: site.leaf.y, text: step.text, q };
    if (step.k === 'defense') {
      const altar = site.objs.find(o => o.kind === 'altar27');
      return { x: altar.x, y: altar.y, text: step.text, q };
    }
    if (step.k === 'search' || step.k === 'clues')
      return { x: px(site, 0), y: py(site, 0), text: step.text, q, vague: true };
    return { x: px(site, 0), y: py(site, 0), text: step.text, q };
  }
  // Aucune quête suivie : le prochain personnage qui a une quête à donner (« ! »). D'abord l'histoire principale à
  // portée du niveau du héros, puis la quête secondaire la plus proche sur la même couche (au plus trois niveaux
  // au-dessus du héros), et à défaut la suite de l'histoire, même plus haute.
  function nextOffer(hero) {
    const level = clampLevel(hero.level),
      p = hero.player,
      under = canaanUnder(),
      fits = q => q.scaled || q.level <= level + 3,
      dist = n => Math.hypot(n.x - p.x, n.y - p.y);
    const offers = Object.values(NPCS).filter(
      n => n.quest && !n.def.collector && present(hero, n) && npcState(hero, n.quest) === 'offer'
    );
    if (!offers.length) return guildOffer(hero);
    const near = offers.filter(n => !!n.under === under).sort((a, b) => dist(a) - dist(b)),
      main = offers.filter(n => n.quest.main && !n.under).sort((a, b) => a.quest.id - b.quest.id)[0],
      pick =
        (main && fits(main.quest) && main) ||
        near.find(n => n.quest.main && fits(n.quest)) ||
        near.find(n => fits(n.quest)) ||
        main;
    if (!pick) return null;
    // La suite de l'histoire est trop haute : un contrat de la guilde d'abord, s'il n'y en a pas en cours.
    if (!fits(pick.quest) && !activeContract(stateOf(hero)) && !under) {
      const g = guildOffer(hero);
      if (g) return g;
    }
    const q = pick.quest,
      text = tt('Parler à {nom} pour une nouvelle quête', { nom: pick.def.name });
    if (!!pick.under !== under) {
      const e = [...CANAAN_UNDER.ENTRANCES].sort(
        (u, v) => Math.hypot(u.x * T - p.x, u.y * T - p.y) - Math.hypot(v.x * T - p.x, v.y * T - p.y)
      )[0];
      return { x: (e.x + 0.5) * T, y: (e.y + 0.5) * T, text: 'Remonter à la surface', q, offer: true };
    }
    return { x: pick.x, y: pick.y, text, q, offer: true, high: !fits(q) };
  }
  // Le tableau de la guilde, quand le héros n'a pas de contrat en cours (à la surface).
  function guildOffer(hero) {
    if (canaanUnder() || activeContract(stateOf(hero))) return null;
    const door = CANAAN_GUILD.door();
    return (
      door && {
        ...door,
        text: 'Choisir un contrat au tableau de la guilde',
        q: GUILD_BOARD_QUEST,
        offer: true
      }
    );
  }
  // Pseudo-quête affichée par le suivi pour le tableau de la guilde.
  const GUILD_BOARD_QUEST = Object.freeze({ id: 0, title: GUILD_NAME, contract: 'F', main: false });
  const trackerEl = document.createElement('div');
  trackerEl.id = 'questTracker';
  trackerEl.hidden = true;
  document.body.appendChild(trackerEl);
  // Objectif montré par le suivi : Lumi vole de ce côté.
  let guideTo = null;
  function tracker() {
    const tr =
      started && !game.world.instance
        ? target(game.hero) || nextOffer(game.hero) || shellTarget(game.hero)
        : null;
    guideTo = tr;
    trackerEl.hidden = !tr;
    if (!tr) return;
    const d = Math.round(Math.hypot(tr.x - P.x, tr.y - P.y) / T),
      a = Math.atan2(tr.y - P.y, tr.x - P.x),
      html =
        (tr.offer
          ? '<small>' +
            (tr.high
              ? 'Suite de l’histoire'
              : tr.q === GUILD_BOARD_QUEST
                ? 'Nouveau contrat'
                : 'Nouvelle quête') +
            '</small>'
          : '') +
        '<b>' +
        (tr.q.main ? '📖 ' : isContract(tr.q) ? '🛡️ ' : '🍃 ') +
        esc(tr.q.title) +
        (tr.high ? ' <small>(' + tt('niveau {n}', { n: tr.q.level }) + ')</small>' : '') +
        '</b><span>' +
        esc(tr.text) +
        '</span>' +
        (tr.count ? '<b class="quest-count">' + tr.count[0] + ' / ' + tr.count[1] + '</b>' : '') +
        '<em>' +
        (tr.anywhere
          ? 'Partout sur l’île'
          : tr.area
            ? 'Par ici'
            : d <= 2
              ? 'Tu y es'
              : '<i style="transform:rotate(' +
                a.toFixed(2) +
                'rad)">➤</i> ' +
                (tr.vague && d < 8 ? 'tout près' : d + ' cases')) +
        '</em>';
    if (trackerEl.innerHTML !== html) trackerEl.innerHTML = html;
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  function exportWorld() {
    return { flags: { ...qworld.flags }, solved: { ...qworld.solved } };
  }
  function importWorld(d) {
    qworld = { flags: {}, solved: {} };
    if (d && typeof d === 'object') {
      for (const f of WORLD_FLAGS) if (d.flags?.[f]) qworld.flags[f] = true;
      for (const id of Object.keys(SITES)) if (d.solved?.[id]) qworld.solved[id] = true;
      // Anciennes énigmes résolues : le lieu garde son changement.
      for (const [id, f] of Object.entries(LEGACY_SOLVED)) if (d.solved?.[id]) qworld.flags[f] = true;
    }
    ST = puzzleFreshStates();
    FIELD.reset();
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
    for (const id of Object.keys(qworld.solved)) {
      const solved = puzzleSolvedState(id);
      if (solved) Object.assign(ST[id], solved);
    }
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
        f: FIELD.netView(),
        q5: [ST.q5.gold, Math.max(0, ST.q5.until - time)],
        q6: ST.q6.seq.length,
        q15: ST.q15.pads.map(p => [Math.round(p.t * 4) / 4, p.sunk ? 1 : 0]),
        q18: ST.q18.t,
        q24: ST.q24.m,
        q27: [ST.q27.on ? 1 : 0, ST.q27.hp.map(Math.round)],
        q28: ST.q28.l,
        q30: ST.q30.seq
      }
    };
  }
  const ints = (a, n, max) =>
    Array.isArray(a) && a.length === n && a.every(v => Number.isInteger(v) && v >= 0 && v <= max)
      ? [...a]
      : null;
  function applyRemote(v) {
    if (!v || typeof v !== 'object') return;
    if (v.w) {
      const before = JSON.stringify(qworld.solved);
      qworld = { flags: {}, solved: {} };
      for (const f of Object.keys(v.w.flags || {})) if (/^[a-z_]{2,24}$/.test(f)) qworld.flags[f] = true;
      for (const id of Object.keys(v.w.solved || {})) if (SITES[id]) qworld.solved[id] = true;
      if (before !== JSON.stringify(qworld.solved))
        for (const id of Object.keys(qworld.solved)) {
          const solved = puzzleSolvedState(id);
          if (solved) Object.assign(ST[id], solved);
        }
    }
    const s = v.s;
    if (!s) return;
    FIELD.applyRemote(s.f, SITES);
    if (Array.isArray(s.q5)) {
      ST.q5.gold = Number.isInteger(s.q5[0]) ? s.q5[0] : -1;
      ST.q5.until = time + (Number(s.q5[1]) || 0);
    }
    if (Number.isInteger(s.q6)) ST.q6.seq = [1, 4, 2, 3].slice(0, Math.min(4, s.q6));
    ST.q24.m = ints(s.q24, 4, 3) || ST.q24.m;
    ST.q28.l = ints(s.q28, 3, 1) || ST.q28.l;
    if (Number.isFinite(s.q18)) ST.q18.t = s.q18;
    if (Number.isInteger(s.q30)) ST.q30.seq = Math.max(0, Math.min(CONSTELLATION.length, s.q30));
    if (Array.isArray(s.q27)) {
      ST.q27.on = !!s.q27[0];
      if (Array.isArray(s.q27[1]) && s.q27[1].length === 6)
        ST.q27.hp = s.q27[1].map(v => Math.max(0, Math.min(100, Number(v) || 0)));
    }
    if (Array.isArray(s.q15))
      s.q15.forEach(
        (p, i) =>
          ST.q15.pads[i] &&
          Array.isArray(p) &&
          Object.assign(ST.q15.pads[i], { t: Number(p[0]) || 0, sunk: p[1] ? 1 : 0 })
      );
  }
  // Apparence visible chez les autres : Lumi (1), bénédiction des racines d'or (2), aura (4) et Écho (8).
  const questLook = hero =>
    (stateOf(hero).flags.lumi ? 1 : 0) |
    (stateOf(hero).flags.blessing ? 2 : 0) |
    (stateOf(hero).flags.aurora ? 4 : 0) |
    (stateOf(hero).flags.echo ? 8 : 0);

  // Lieux posés sur l'île ; une île régénérée (même graine) les reçoit à nouveau, à l'identique.
  function rebuild() {
    for (const site of surfaceSites()) delete SITES[site.id];
    for (const k of Object.keys(NPCS)) if (!NPCS[k].under) delete NPCS[k];
    FIELD.reset();
    WALK.clear();
    place();
    if (SITES.q15) ST.q15.pads = SITES.q15.pads.map(() => ({ t: 0, sunk: 0 }));
  }
  // Objectifs de terrain (quest-field.js), avec ce dont ils ont besoin d'ici.
  const FIELD = canaanQuestField({
    px,
    py,
    stateOf,
    advance,
    tell,
    cue,
    panel,
    changed,
    addObj,
    heroesNear,
    art: { R, glow, block, rune, shadowAt, crystalArt, flagArt, torchFlame, personArt, chestArt, PAL, OUT }
  });
  place();
  canaanQuestWorld = rebuild;
  window.CANAAN_QUESTS = Object.freeze({
    sites: () => SITES,
    placeUnder,
    field: () => FIELD,
    // Événement du jeu (victoire, pêche, récolte, donjon terminé), posé par canaanAchieve.
    event: (hero, type, a) => FIELD.event(hero, type, a),
    hear: (hero, id) => hear(hero, id),
    errand: (hero, npc) => !!errand(hero, npc),
    present,
    npcs: () => NPCS,
    // Personnage à montrer sur la carte : 'offer' (!), 'ready' (?), sur la couche du groupe.
    npcMode: (hero, npc) =>
      !here(npc) || !present(hero, npc)
        ? 'none'
        : errand(hero, npc)
          ? 'ready'
          : npc.quest
            ? npcState(hero, npc.quest)
            : 'none',
    waystones: () => Object.values(WAYSTONE).filter(Boolean),
    state: stateOf,
    world: () => qworld,
    puzzles: () => ST,
    accept,
    turnIn,
    take,
    abandon,
    advance,
    act: (hero, siteId, objId) => {
      const site = SITES[siteId],
        o = site?.objs.find(o => o.id === objId);
      return o ? act(hero, site, o) : false;
    },
    handle,
    interact,
    nearest,
    beam: () => beamOf(SITES.q24),
    exportWorld,
    importWorld,
    netView,
    applyRemote,
    questLook,
    done: (hero, id) => !!stateOf(hero).done[id],
    trade,
    claimShells,
    guardianDue,
    fights: () => FIGHTS,
    drawWorld,
    drawBubbles,
    render: renderJournal,
    card: (q, st) => card(q, st),
    target,
    // Prochaine quête à prendre quand aucune n'est suivie (suivi, conseils de Lumi).
    nextOffer
  });
  Object.assign(window, { toggleJournal });
})();
