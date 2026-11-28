// Lieux et énigmes de l'histoire « Les Échos de l'Aurore » : placement des lieux sur l'île (mêmes cases chez
// chacun) et dans les Tréfonds (placeUnder, Interlude), pierres de passage, construction de chaque lieu (BUILD :
// cases, PNJ, objets) et énigmes des chapitres IV à VI (rayon des miroirs, constellation, défense, lac…).
// quests.js appelle CANAAN_QUEST_SITES.create(scène) une fois : la scène lui donne les lieux, les PNJ, les cases
// praticables et la progression (avancer une étape, résoudre une énigme, parler au héros).
(() => {
  'use strict';
  function create(scene) {
    const {
      T,
      SITES,
      NPCS,
      WALK,
      WALK_UNDER,
      tileKey,
      now,
      guest,
      stateOf,
      changed,
      stepGuardians,
      at,
      tell,
      advance,
      solve,
      creditSolved,
      cue,
      panel
    } = scene;
    // État de quests.js relu à chaque usage (variables réassignées ou posées plus tard).
    const LIVE = scene.state;

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
        LIVE.FIELD.build(site, {
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
        NPCS[id] = {
          id,
          def,
          x,
          y,
          face: 0,
          quest: QUESTS.find(q => q.npc === id),
          site,
          under: true,
          dwarf
        };
      }
      const ok = (x, y) =>
        tools.open(x, y) &&
        !Object.values(NPCS).some(n => n.under && Math.hypot(n.x / T - x - 0.5, n.y / T - y - 0.5) < 1.2);
      for (const site of Object.values(SITES)) {
        if (!site.under) continue;
        LIVE.FIELD.build(site, { ok, cavern: tools.cavern });
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
    LIVE.ST = puzzleFreshStates();
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
          solid(site, dx, 0, () => !!LIVE.qworld.flags.bridge);
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
        LIVE.ST.q15.pads = pads.map(() => ({ t: 0, sunk: 0 }));
        site.pads = pads;
        pads.forEach(([dx, dy], i) => solid(site, dx, dy, () => !LIVE.ST.q15.pads[i].sunk));
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
      addObj(site, 'door', 'door', 0, -4, { solid: () => !!LIVE.qworld.flags['sanct_' + id], sanct: id });
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
          solid(site, dx, dy, () => !puzzleMirrorRocks(LIVE.ST.q28.l).has(dx + ',' + dy));
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
      return puzzleBeam(BEAMS[site.id], mirrors, LIVE.ST[site.id].m);
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
        S = LIVE.ST[site.id],
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
          return LIVE.qworld.flags.archives
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
            LIVE.qworld.flags.machine
              ? '💰 La salle du trésor est ouverte.'
              : '🔒 Une porte ronde, scellée par la machine.'
          );
        case 'mirror':
          if (LIVE.qworld.solved[site.id]) return creditSolved(hero, site);
          S.m[o.i] = (S.m[o.i] + 1) % 4;
          if (beamOf(site).lit) {
            tell(hero, '☀️ Le rayon frappe le soleil de la porte : le temple s’ouvre !');
            solve(site);
          }
          return changed();
        case 'templedoor':
          return tell(
            hero,
            LIVE.qworld.solved.q24
              ? '🚪 La porte du temple est ouverte.'
              : '☀️ Un soleil gravé attend la lumière.'
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
          LIVE.qworld.flags.sanct_lumieres = true;
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
              LIVE.qworld.solved.q27
                ? '✨ Le Cœur bat doucement.'
                : '✨ L’autel du Cœur, entouré de six cristaux.'
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
          if (LIVE.qworld.solved.q28) return creditSolved(hero, site);
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
      const S = LIVE.ST.q27;
      Object.assign(S, { on: true, wave: 0, hp: [100, 100, 100, 100, 100, 100], next: now() + 90 });
      tell(game.hero, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
      for (const h of game.heroes)
        if (h !== game.hero && Math.hypot(h.player.x - px(site, 0), h.player.y - py(site, 0)) < 14 * T)
          tell(h, '⚔️ Les échos de l’Ombre arrivent ! Protège les cristaux.');
    }
    function stopDefense(site, win) {
      const S = LIVE.ST.q27;
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
      const S = LIVE.ST.q27;
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
      const S = LIVE.ST.q30;
      if (LIVE.qworld.solved.q30) return;
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
        LIVE.ST.q18.t++;
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

    return Object.freeze({
      px,
      py,
      addObj,
      place,
      surfaceSites,
      here,
      placeUnder,
      WAYSTONE,
      CONSTELLATION,
      beamOf,
      leafAt,
      actMore,
      stepMore
    });
  }
  window.CANAAN_QUEST_SITES = Object.freeze({ create });
})();
