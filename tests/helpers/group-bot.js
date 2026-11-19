// Pilote de test : joue les intentions d'un groupe de héros dans une instance, sans écran.
// Chaque héros suit un chemin case par case (recherche en largeur), attaque le monstre le plus proche
// à portée de son arme ; une fois le dernier boss vaincu, l'hôte ouvre le coffre et ramène le groupe dehors par le
// portail de retour.
// Exploration : quand plus aucun monstre n'est accessible, l'hôte ouvre les passages secrets et résout les énigmes
// des portes scellées (braseros, leviers et dalles, miroirs, cristaux, piliers, urnes, embuscade), comme un joueur.
// Exécuté dans le contexte du jeu (script classique), comme le ferait un invité qui envoie ses intentions.
globalThis.canaanGroupBot = (() => {
  const plans = new Map();
  // Cases à contourner (dalles gravées qu'il ne faut pas fouler maintenant).
  let avoid = new Set();
  const tileOf = v => Math.floor(v / TS);
  const free = (x, y) => x >= 0 && y >= 0 && x < MAPW && y < MAPH && canWalk((x + 0.5) * TS, (y + 0.5) * TS);
  // Chemin de cases entre deux cases (4 voisins), ou null.
  function findPath(fx, fy, gx, gy) {
    const key = (x, y) => y * MAPW + x,
      seen = new Map([[key(fx, fy), -1]]),
      queue = [[fx, fy]];
    for (let head = 0; head < queue.length && queue.length < 200000; head++) {
      const [x, y] = queue[head];
      if (x === gx && y === gy) {
        const path = [];
        for (let k = key(x, y); k !== -1; k = seen.get(k)) path.unshift({ x: k % MAPW, y: Math.floor(k / MAPW) });
        return path;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx,
          ny = y + dy,
          k = key(nx, ny);
        if (seen.has(k) || (avoid.has(k) && !(nx === gx && ny === gy)) || !(free(nx, ny) || (nx === gx && ny === gy))) continue;
        seen.set(k, key(x, y));
        queue.push([nx, ny]);
      }
    }
    return null;
  }
  // Oriente l'intention du héros vers un point, en suivant un chemin recalculé quand la cible change de case.
  function steer(hero, tx, ty) {
    const p = hero.player,
      goal = tileOf(tx) + ',' + tileOf(ty);
    let plan = plans.get(hero);
    if (!plan || plan.goal !== goal || plan.age++ > 45) {
      plan = { goal, age: 0, path: findPath(tileOf(p.x), tileOf(p.y), tileOf(tx), tileOf(ty)) || [] };
      plans.set(hero, plan);
    }
    while (plan.path.length > 1 && tileOf(p.x) === plan.path[0].x && tileOf(p.y) === plan.path[0].y) plan.path.shift();
    const next = plan.path.length > 1 ? plan.path[0] : null,
      wx = next ? (next.x + 0.5) * TS : tx,
      wy = next ? (next.y + 0.5) * TS : ty;
    hero.intent.dx = Math.abs(wx - p.x) > 4 ? Math.sign(wx - p.x) : 0;
    hero.intent.dy = Math.abs(wy - p.y) > 4 ? Math.sign(wy - p.y) : 0;
  }
  function stop(hero) {
    hero.intent.dx = hero.intent.dy = 0;
    hero.intent.attack = null;
  }
  function reach(hero) {
    const type = hero.equipment.weapon?.weaponType || 'sword';
    return type === 'bow' || type === 'staff' ? 330 : type === 'spear' ? 150 : 95;
  }
  // Comme un joueur : lance ses compétences dès qu'elles sont prêtes (une par pas, mana suffisant).
  function useSkills(hero) {
    for (let i = 0; i < 4; i++) {
      if (hero === game.hero) {
        const type = currentWeaponType();
        if ((weaponCooldowns[type + ':' + i] || 0) > 0) continue;
        const before = P.mp;
        useSkill(i);
        if (P.mp < before) return;
      } else if (CANAAN_SKILLS.ready(hero, i)) {
        hero.intent.skill = i;
        return;
      }
    }
  }
  const state = { phase: 'combat', done: false };
  // Cases accessibles depuis l'hôte, recalculées de temps en temps (portes et murs s'ouvrent en cours de route).
  let reachSet = null,
    reachAge = 0;
  function reachable() {
    if (reachSet && reachAge++ < 20) return reachSet;
    reachAge = 0;
    const p = game.hero.player,
      start = tileOf(p.y) * MAPW + tileOf(p.x),
      queue = [start];
    reachSet = new Set(queue);
    for (let head = 0; head < queue.length; head++) {
      const k = queue[head],
        x = k % MAPW,
        y = Math.floor(k / MAPW);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = (y + dy) * MAPW + x + dx;
        if (!reachSet.has(n) && free(x + dx, y + dy)) {
          reachSet.add(n);
          queue.push(n);
        }
      }
    }
    return reachSet;
  }
  const near = (set, x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has((y + dy) * MAPW + x + dx));
  // Prochaine chose à faire pour ouvrir la suite : passage secret, puis l'objet utile de chaque énigme accessible
  // (brasero, levier, dalle, miroir, cristal, pilier, urne, salle de l'embuscade), comme un joueur qui a compris.
  function bestToggle(lock, prog) {
    const n = lock.items.length,
      full = (1 << n) - 1;
    let best = null;
    for (let set = 0; set < 1 << n; set++) {
      let st = prog;
      for (let j = 0; j < n; j++) if (set & (1 << j)) st ^= CANAAN_DUNGEON_EXPLORE.toggleMask(j, n);
      if (st !== full) continue;
      const count = [...Array(n).keys()].filter(j => set & (1 << j)).length;
      if (!best || count < best.count) best = { set, count };
    }
    return best ? [...Array(n).keys()].find(j => best.set & (1 << j)) : 0;
  }
  function objective() {
    const E = CANAAN_DUNGEON_EXPLORE,
      plan = E.plan(game.world.instance.index),
      st = E.state(),
      set = reachable();
    if (!st) return null;
    for (let k = 0; k < plan.secretWalls.length; k++) {
      if (st.secrets & (1 << k)) continue;
      const w = plan.secretWalls[k];
      if (w.trigger) {
        const ty = w.trigger.y + (w.trigger.wall ? 1 : 0);
        if (near(set, w.trigger.x, ty)) return { x: w.trigger.x, y: ty, act: 'use', r: w.trigger.wall ? 0.6 : 1.4 };
        continue;
      }
      const [x, y] = w.cells[1] || w.cells[0];
      if (near(set, x, y)) return { x, y, act: 'use', r: 1.1 };
    }
    for (let s = 0; s < plan.locks.length; s++) {
      const lock = plan.locks[s],
        ls = st.locks[s];
      if (ls.done) continue;
      let it = null;
      if (lock.type === 'braziers') it = lock.items.find(i => !(ls.prog & (1 << i.id)));
      if (lock.type === 'levers' || lock.type === 'runes' || lock.type === 'memory') it = lock.items[lock.order[ls.step]];
      if (lock.type === 'mirrors')
        it = lock.items.find(i => i.id < lock.pathMirrors && ((ls.prog >> i.id) & 1) !== ((lock.solution >> i.id) & 1));
      if (lock.type === 'toggles') it = lock.items[bestToggle(lock, ls.prog)];
      if (lock.type === 'search') it = lock.items.find(i => lock.shards.includes(i.id) && !(ls.prog & (1 << i.id)));
      if (lock.type === 'ambush' && !ls.step) it = lock.items[0];
      if (it && near(set, it.x, it.y)) {
        // Dalles : ne marcher que sur la bonne, comme un joueur attentif.
        const next = new Set(lock.type === 'runes' ? lock.items.filter(i => i !== it).map(i => i.y * MAPW + i.x) : []);
        if ([...next].join() !== [...avoid].join()) plans.clear();
        avoid = next;
        return { x: it.x, y: it.y, act: lock.type === 'runes' || lock.type === 'ambush' ? 'stand' : 'use', r: 1.4 };
      }
    }
    if (avoid.size) plans.clear();
    avoid = new Set();
    return null;
  }
  // Un pas de pilotage pour tout le groupe.
  function step() {
    if (state.done) return state;
    const host = game.hero;
    const set = game.world.instance && !game.world.instance.arena ? reachable() : null,
      inReach = game.world.monsters.filter(m => m.hp > 0 && (!set || near(set, tileOf(m.x), tileOf(m.y)))),
      // Un boss protégé par ses cristaux de garde : on brise d'abord les cristaux.
      alive = inReach.some(m => !m.bossShield) ? inReach.filter(m => !m.bossShield) : inReach;
    for (const hero of game.heroes) {
      const p = hero.player;
      if (p.dead) continue;
      hero.intent.attack = null;
      // Comme un joueur : sortir des zones annoncées par un boss (ou entrer dans la zone sûre, l'impact partagé), en
      // roulant quand il le faut.
      const go = CANAAN_BOSS_MECHANICS.escape(hero);
      if (go) {
        const a = Math.atan2(go.y - p.y, go.x - p.x) || Math.random() * 6.28;
        hero.intent.dx = Math.round(Math.cos(a));
        hero.intent.dy = Math.round(Math.sin(a));
        if (!hero.intent.dx && !hero.intent.dy) hero.intent.dx = 1;
        if (go.roll) {
          if (hero === host) CANAAN_COMBAT.dodge(hero.intent.dx, hero.intent.dy);
          else CANAAN_COMBAT.heroDodge(hero, hero.intent.dx, hero.intent.dy);
        }
        continue;
      }
      if (alive.length) {
        const m = alive.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) <= Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        hero.intent.aimX = m.x;
        hero.intent.aimY = m.y;
        if (hero === host) {
          mouseWorldX = m.x;
          mouseWorldY = m.y;
        }
        if (d <= reach(hero) + (m.r || 0) * 0.5) {
          hero.intent.dx = hero.intent.dy = 0;
          hero.intent.attack = 'quick';
          useSkills(hero);
        } else steer(hero, m.x, m.y);
        continue;
      }
      // Plus d'ennemi : l'hôte mène, les alliés le suivent (ils attendent pendant qu'il foule les dalles).
      if (hero !== host && avoid.size) stop(hero);
      else if (hero !== host) {
        if (Math.hypot(host.player.x - p.x, host.player.y - p.y) > 2 * TS) steer(hero, host.player.x, host.player.y);
        else stop(hero);
      }
    }
    if (alive.length || !game.world.instance) return state;
    // Exploration : murs fissurés et énigmes des portes scellées.
    const goal = game.world.instance.cleared ? null : objective();
    if (goal) {
      state.phase = 'exploration';
      const p = host.player,
        d = Math.hypot(p.x / TS - (goal.x + 0.5), p.y / TS - (goal.y + 0.5));
      if (goal.act === 'use' && d < goal.r) {
        stop(host);
        CANAAN_DUNGEON_EXPLORE.interact(host);
        reachAge = 99;
      } else if (goal.act === 'stand' && Math.abs(p.x / TS - (goal.x + 0.5)) < 0.45 && tileOf(p.y + 10) === goal.y) {
        stop(host);
        reachAge = 99;
      } else steer(host, (goal.x + 0.5) * TS, (goal.y + 0.5) * TS);
      return state;
    }
    const chest = game.world.chests.find(c => c.instance);
    if (game.world.instance.cleared && chest && !chest.opened) {
      state.phase = 'coffre';
      if (Math.hypot(host.player.x / TS - chest.x, host.player.y / TS - chest.y) < 1.5) {
        stop(host);
        openNearbyChest(host);
      } else steer(host, chest.x * TS, chest.y * TS);
    } else if (game.world.instance.cleared) {
      // Sortie par le portail de retour ouvert dans la salle du dernier boss (sinon, par l'entrée).
      state.phase = 'sortie';
      const exit = !game.world.instance.arena && CANAAN_DUNGEON_EXPLORE.exitSpot(game.world.instance.index),
        ex = exit ? (exit.x + 0.5) * TS : instanceEntrance.x,
        ey = exit ? (exit.y + 0.5) * TS : instanceEntrance.y;
      if (exit ? CANAAN_DUNGEON_EXPLORE.exitNear(host.player) : Math.hypot(host.player.x - ex, host.player.y - ey) < 60) {
        for (const hero of game.heroes) stop(hero);
        if (exit) CANAAN_DUNGEON_EXPLORE.takeExit(host);
        else leaveInstance();
        state.done = true;
      } else steer(host, ex, ey);
    }
    return state;
  }
  return { step, state, findPath };
})();
