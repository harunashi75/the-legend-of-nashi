// Pilote de test : joue les intentions d'un groupe de héros dans une instance, sans écran.
// Chaque héros suit un chemin case par case (recherche en largeur), attaque le monstre le plus proche
// à portée de son arme ; une fois le dernier boss vaincu, l'hôte ouvre le coffre et ramène le groupe à la sortie.
// Exécuté dans le contexte du jeu (script classique), comme le ferait un invité qui envoie ses intentions.
globalThis.canaanGroupBot = (() => {
  const plans = new Map();
  const tileOf = v => Math.floor(v / TS);
  const free = (x, y) => x >= 0 && y >= 0 && x < MAPW && y < MAPH && canWalk((x + 0.5) * TS, (y + 0.5) * TS);
  // Chemin de cases entre deux cases (4 voisins), ou null.
  function findPath(fx, fy, gx, gy) {
    const key = (x, y) => y * MAPW + x,
      seen = new Map([[key(fx, fy), -1]]),
      queue = [[fx, fy]];
    for (let head = 0; head < queue.length && queue.length < 60000; head++) {
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
        if (seen.has(k) || !(free(nx, ny) || (nx === gx && ny === gy))) continue;
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
  // Un pas de pilotage pour tout le groupe.
  function step() {
    if (state.done) return state;
    const host = game.hero;
    const alive = game.world.monsters.filter(m => m.hp > 0);
    for (const hero of game.heroes) {
      const p = hero.player;
      if (p.dead) continue;
      hero.intent.attack = null;
      // Comme un joueur : sortir d'un cercle annoncé par un boss (roulade dans la direction opposée au centre).
      const zone = CANAAN_BOSS_MECHANICS.zones().find(z => Math.hypot(p.x - z.x, p.y - z.y) < z.r + 14);
      if (zone) {
        const a = Math.atan2(p.y - zone.y, p.x - zone.x) || Math.random() * 6.28;
        hero.intent.dx = Math.round(Math.cos(a));
        hero.intent.dy = Math.round(Math.sin(a));
        if (!hero.intent.dx && !hero.intent.dy) hero.intent.dx = 1;
        if (hero === host) CANAAN_COMBAT.dodge(hero.intent.dx, hero.intent.dy);
        else CANAAN_COMBAT.heroDodge(hero, hero.intent.dx, hero.intent.dy);
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
      // Plus d'ennemi : l'hôte mène, les alliés le suivent.
      if (hero !== host) {
        if (Math.hypot(host.player.x - p.x, host.player.y - p.y) > 2 * TS) steer(hero, host.player.x, host.player.y);
        else stop(hero);
      }
    }
    if (alive.length || !game.world.instance) return state;
    const chest = game.world.chests.find(c => c.instance);
    if (game.world.instance.cleared && chest && !chest.opened) {
      state.phase = 'coffre';
      if (Math.hypot(host.player.x / TS - chest.x, host.player.y / TS - chest.y) < 1.5) {
        stop(host);
        openNearbyChest(host);
      } else steer(host, chest.x * TS, chest.y * TS);
    } else if (game.world.instance.cleared) {
      state.phase = 'sortie';
      if (Math.hypot(host.player.x - instanceEntrance.x, host.player.y - instanceEntrance.y) < 60) {
        for (const hero of game.heroes) stop(hero);
        leaveInstance();
        state.done = true;
      } else steer(host, instanceEntrance.x, instanceEntrance.y);
    }
    return state;
  }
  return { step, state, findPath };
})();
