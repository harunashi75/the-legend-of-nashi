// Invocations de l'Invocateur et son arme liée (le Grimoire).
// Les quatre compétences du Grimoire lèvent des créatures temporaires qui combattent pour leur maître : squelettes
// (3 au maximum), nuée de rats qui éclatent, totem de peste immobile et abomination. Chaque coup passe par le moteur
// de combat comme une compétence offensive de son maître (Peste noire, talents, Rubis, Maîtrise).
// Simulation chez l'hôte ; un invité reçoit leur position dans l'instantané (view / applyView) et les dessine.
// Rien n'est sauvegardé : une invocation disparaît au bout de sa durée, à la mort de son maître, quand il change de
// classe ou s'éloigne trop (changement de carte).
// Le Grimoire suit la classe et le niveau du héros (syncPact) : donné en devenant Invocateur, retiré en changeant
// de classe, il prend le niveau du héros à chaque montée.
(() => {
  'use strict';
  // slot : compétence du Grimoire ; life : durée (s) ; every : temps entre deux coups (s) ; reach : portée (px) ;
  // speed : px par pas ; power : part de la Puissance magique par coup ; r : rayon (dessin, écart).
  const KINDS = Object.freeze({
    skeleton: { slot: 0, life: 18, cap: 3, every: 1.2, reach: 30, speed: 2.6, power: 0.6, r: 12 },
    rat: { slot: 1, life: 6, count: 4, every: 0.6, reach: 20, speed: 4.2, power: 0.45, burst: 0.9, r: 8 },
    totem: { slot: 2, life: 10, cap: 1, every: 1, area: 3, power: 0.5, r: 12, still: true },
    abomination: { slot: 3, life: 15, cap: 1, every: 1.6, reach: 34, area: 2, speed: 1.8, power: 1.6, r: 22 }
  });
  const ORDER = Object.freeze(['skeleton', 'rat', 'totem', 'abomination']);
  const POISON = '#a4e83c';
  // Distances en cases : chasse autour du maître, laisse (retour), disparition (carte changée), totem et rats.
  const RANGE = Object.freeze({ hunt: 7, leash: 9, lost: 16, totemCast: 8, totemHaste: 3, ratRush: 1.2 });
  let list = [],
    serial = 0,
    // Vue d'un invité : invocations reçues de l'hôte (id → état affiché, interpolé).
    remote = new Map();
  const now = () => time / 60;
  const tiles = n => n * TS;
  const alive = m => m && m.hp > 0;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mine = owner => list.filter(s => s.owner === owner);
  const talent = (owner, key) => CANAAN_CLASS.talent(owner, 'invocateur', key);
  const lifeOf = (owner, kind) => KINDS[kind].life * (talent(owner, 'eternal') ? 1.3 : 1);
  const capOf = (owner, kind) =>
    (KINDS[kind].cap || 99) + (kind === 'skeleton' && talent(owner, 'legion') ? 1 : 0);
  const magicPower = owner => CANAAN_SKILLS.power(owner, true);
  // Un coup d'invocation : compétence offensive de poison du maître (l'hôte par hit, un allié par le moteur).
  function strike(s, m, mult) {
    if (!alive(m)) return 0;
    const before = m.hp,
      context = {
        ...s.context,
        magic: true,
        skill: true,
        offensive: true,
        element: 'poison',
        slot: KINDS[s.kind].slot,
        summon: s.kind
      },
      value = Math.max(1, Math.round(magicPower(s.owner) * mult));
    if (s.owner === game.hero) hit(m, value, context);
    else CANAAN_COMBAT.attack(m, value, context, s.owner);
    return Math.max(0, before - Math.max(0, m.hp));
  }
  function inArea(x, y, radius) {
    return game.world.monsters.filter(m => alive(m) && Math.hypot(m.x - x, m.y - y) < radius + (m.r || 0));
  }
  // ---------------------------------------------------------------- Apparition et disparition
  function spawn(owner, kind, x, y, context, extra = {}) {
    const k = KINDS[kind],
      // Hors des murs : sinon sous les pieds du maître.
      ok = typeof canWalk !== 'function' || canWalk(x, y),
      s = {
        id: ++serial,
        kind,
        owner,
        x: ok ? x : owner.player.x,
        y: ok ? y : owner.player.y,
        born: now(),
        until: now() + lifeOf(owner, kind),
        next: now() + 0.35,
        target: null,
        retarget: 0,
        face: 1,
        atk: 0,
        context,
        ...extra
      };
    // Plafond par maître (squelettes, totem, abomination) : la plus ancienne cède sa place.
    const same = mine(owner).filter(o => o.kind === kind);
    while (k.cap && same.length >= capOf(owner, kind)) remove(same.shift(), true);
    list.push(s);
    burst(s.x, s.y + 10, POISON, kind === 'abomination' ? 26 : 10);
    return s;
  }
  // Retire une invocation ; explode : fin naturelle, remplacement ou sacrifice (Cadavres explosifs).
  function remove(s, explode) {
    const at = list.indexOf(s);
    if (at < 0) return;
    list.splice(at, 1);
    burst(s.x, s.y, '#6f8a4a', 10);
    if (!explode || s.owner.player.dead) return;
    // Les rats éclatent toujours en nuage toxique.
    if (s.kind === 'rat') {
      CANAAN_SKILLS.fx('ring', s.x, s.y, 0, tiles(1.6), 0, POISON, 0.45);
      for (const m of inArea(s.x, s.y, tiles(1.6))) strike(s, m, KINDS.rat.burst);
    }
    if (talent(s.owner, 'corpse')) {
      const attack = characterStats(s.owner).attack * 0.6;
      CANAAN_CLASS.blast(s.owner, s.x, s.y, 2.5, attack, 'poison');
      for (const m of inArea(s.x, s.y, tiles(2.5))) CANAAN_CLASS.plague(s.owner, m, 3);
    }
  }
  // Renvoie toutes les invocations d'un héros (classe changée, maître parti), sans explosion.
  function dismiss(owner) {
    for (const s of mine(owner)) remove(s, false);
  }
  // Compétence du Grimoire lancée par owner : context (élément, bonus du lancement), aim {a, x, y} (visée).
  function cast(owner, i, context, aim) {
    const p = owner.player,
      a = Number.isFinite(aim?.a) ? aim.a : 0,
      ahead = d => ({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d });
    if (i === 0) {
      const at = ahead(40);
      spawn(owner, 'skeleton', at.x, at.y, context);
      float(at.x, at.y - 40, '💀', POISON);
    } else if (i === 1) {
      const goal = { x: Number.isFinite(aim?.x) ? aim.x : p.x, y: Number.isFinite(aim?.y) ? aim.y : p.y };
      for (let n = 0; n < KINDS.rat.count; n++) {
        const angle = a + (n - 1.5) * 0.5;
        spawn(owner, 'rat', p.x + Math.cos(angle) * 18, p.y + Math.sin(angle) * 18, context, {
          goal: { x: goal.x + (n - 1.5) * 16, y: goal.y + ((n % 2) - 0.5) * 16 },
          rushUntil: now() + RANGE.ratRush
        });
      }
      CANAAN_SKILLS.fx('beam', p.x, p.y, Math.atan2(goal.y - p.y, goal.x - p.x), 70, 10, POISON, 0.3);
    } else if (i === 2) {
      // Totem sous la souris, à 8 cases au plus du lanceur.
      const tx = Number.isFinite(aim?.x) ? aim.x : p.x,
        ty = Number.isFinite(aim?.y) ? aim.y : p.y,
        d = Math.hypot(tx - p.x, ty - p.y),
        k = d > tiles(RANGE.totemCast) ? tiles(RANGE.totemCast) / d : 1,
        s = spawn(owner, 'totem', p.x + (tx - p.x) * k, p.y + (ty - p.y) * k, context);
      s.next = now() + 0.2;
      CANAAN_SKILLS.fx('ring', s.x, s.y, 0, tiles(KINDS.totem.area), 0, POISON, 0.6);
    } else if (i === 3) {
      const at = ahead(48);
      spawn(owner, 'abomination', at.x, at.y, context);
      CANAAN_SKILLS.fx('ring', at.x, at.y, 0, 70, 0, POISON, 0.6);
      float(at.x, at.y - 60, '🧟 ABOMINATION', POISON);
    }
    return true;
  }
  // Squelette gratuit (Moisson d'âmes) à côté du maître.
  function free(owner, i = 0) {
    if (owner.player.dead || i !== 0) return false;
    const a = Math.random() * Math.PI * 2;
    spawn(owner, 'skeleton', owner.player.x + Math.cos(a) * 36, owner.player.y + Math.sin(a) * 30, {
      magic: true,
      skill: true,
      offensive: true,
      element: 'poison',
      multiplier: 1,
      slot: 0
    });
    return true;
  }
  // Pacte de sang : la plus ancienne invocation (hors totem) est sacrifiée. Renvoie true si une l'a été.
  function sacrifice(owner) {
    const s = mine(owner).find(o => o.kind !== 'totem');
    if (!s) return false;
    CANAAN_SKILLS.fx('ring', s.x, s.y, 0, 50, 0, '#d0304a', 0.5);
    remove(s, true);
    return true;
  }
  // ---------------------------------------------------------------- Simulation (hôte)
  // Pas vers un point : contourne un mur par un seul axe ; through : traverse tout (retour vers le maître).
  function stepTo(s, x, y, speed, through = false) {
    const dx = x - s.x,
      dy = y - s.y,
      d = Math.hypot(dx, dy);
    if (d < 1) return;
    const k = Math.min(1, speed / d),
      nx = s.x + dx * k,
      ny = s.y + dy * k;
    if (Math.abs(dx) > 2) s.face = dx > 0 ? 1 : -1;
    const walk = (px, py) => through || typeof canWalk !== 'function' || canWalk(px, py);
    if (walk(nx, ny)) {
      s.x = nx;
      s.y = ny;
    } else if (walk(nx, s.y)) s.x = nx;
    else if (walk(s.x, ny)) s.y = ny;
  }
  // Cible : le monstre vivant le plus proche de l'invocation, à portée de chasse du maître.
  function pickTarget(s, from = s) {
    const p = s.owner.player;
    let best = null,
      bestD = Infinity;
    for (const m of game.world.monsters) {
      if (!alive(m) || dist(m, p) > tiles(RANGE.hunt)) continue;
      const d = dist(m, from);
      if (d < bestD) {
        best = m;
        bestD = d;
      }
    }
    return best;
  }
  // Vitesse d'attaque : Contagion (+30 %) et totem de peste proche (+25 %).
  function haste(s) {
    const totem = list.some(
      o => o.kind === 'totem' && o.owner === s.owner && o !== s && dist(o, s) < tiles(RANGE.totemHaste)
    );
    return CANAAN_CLASS.summonHaste(s.owner) * (totem ? 1.25 : 1);
  }
  function stepSummon(s, t, index) {
    const k = KINDS[s.kind],
      p = s.owner.player;
    s.atk = Math.max(0, s.atk - 1 / 60);
    if (s.kind === 'totem') {
      if (t < s.next) return;
      s.next = t + k.every;
      s.atk = 0.4;
      const area = tiles(k.area);
      CANAAN_SKILLS.fx('ring', s.x, s.y, 0, area, 0, POISON, 0.5);
      for (const m of inArea(s.x, s.y, area)) strike(s, m, k.power);
      return;
    }
    // Trop loin du maître : retour à travers tout, sans combattre.
    if (dist(s, p) > tiles(RANGE.leash)) {
      s.target = null;
      stepTo(s, p.x, p.y, k.speed * 1.8, true);
      return;
    }
    // Rats : ruée vers le point visé avant de chasser.
    if (s.rushUntil && t < s.rushUntil && s.goal && dist(s, s.goal) > 12) {
      stepTo(s, s.goal.x, s.goal.y, k.speed * 1.3);
      return;
    }
    if (t >= s.retarget || !alive(s.target) || dist(s.target, p) > tiles(RANGE.hunt)) {
      s.retarget = t + 0.25;
      s.target = pickTarget(s);
    }
    const m = s.target;
    if (!m) {
      // Au repos : en cercle autour du maître.
      const angle = index * 2.1 + 0.6,
        hx = p.x + Math.cos(angle) * 46,
        hy = p.y + Math.sin(angle) * 30 + 6;
      if (Math.hypot(hx - s.x, hy - s.y) > 14) stepTo(s, hx, hy, k.speed * (dist(s, p) > 120 ? 1.5 : 1));
      return;
    }
    const reach = k.reach + (m.r || 0);
    if (dist(s, m) > reach) stepTo(s, m.x, m.y, k.speed);
    else s.face = m.x >= s.x ? 1 : -1;
    if (dist(s, m) > reach + 4 || t < s.next) return;
    s.next = t + k.every / haste(s);
    s.atk = 0.3;
    if (s.kind === 'abomination') {
      // Écrasement : tous les ennemis autour d'elle.
      const area = tiles(k.area);
      CANAAN_SKILLS.fx('ring', s.x, s.y, 0, area, 0, POISON, 0.45);
      for (const o of inArea(s.x, s.y, area)) strike(s, o, k.power);
    } else {
      burst(m.x, m.y - 10, POISON, 4);
      strike(s, m, k.power);
    }
  }
  // Les invocations d'un même maître s'écartent un peu les unes des autres.
  function spread(group) {
    for (let i = 0; i < group.length; i++)
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i],
          b = group[j];
        if (a.kind === 'totem' || b.kind === 'totem') continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy) || 0.01,
          need = KINDS[a.kind].r + KINDS[b.kind].r;
        if (d >= need) continue;
        const push = (need - d) / 4;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
      }
  }
  window.CanaanStages.summons = {
    after() {
      if (!started || paused || game.mode === 'guest') return;
      const t = now();
      for (const s of list.slice()) {
        const o = s.owner;
        // Maître parti, à terre, devenu autre chose, ou trop loin (changement de carte) : disparition silencieuse.
        if (
          !game.heroes.includes(o) ||
          o.player.dead ||
          o.away ||
          o.classe?.id !== 'invocateur' ||
          dist(s, o.player) > tiles(RANGE.lost)
        ) {
          remove(s, false);
          continue;
        }
        if (t >= s.until) {
          remove(s, true);
          continue;
        }
      }
      for (const hero of game.heroes) {
        const group = mine(hero);
        group.forEach((s, i) => {
          if (!list.includes(s)) return;
          const x = s.x,
            y = s.y;
          stepSummon(s, t, i);
          s.moving = Math.abs(s.x - x) + Math.abs(s.y - y) > 0.3;
        });
        spread(mine(hero));
      }
    }
  };
  // ---------------------------------------------------------------- Arme liée (le Grimoire)
  const bagRoom = hero =>
    typeof canaanBagUsed === 'function' ? canaanBagLimit(hero) - canaanBagUsed(hero) : Infinity;
  const notify = (hero, text) =>
    typeof canaanLootNotice === 'function' ? canaanLootNotice(hero, text) : toast(text);
  // Devenir une classe à arme liée : les armes portées vont dans le sac ; il faut la place.
  function canSwitch(hero, classId) {
    if (!boundWeaponOf(classId) || isBoundItem(hero.equipment?.weapon)) return true;
    const need = ['weapon', 'weapon2'].filter(slot => hero.equipment?.[slot]).length,
      room = bagRoom(hero);
    if (need <= room) return true;
    notify(hero, '🎒 Libère ' + (need - room) + ' place(s) dans ton sac : tes armes y seront rangées.');
    return false;
  }
  // Meilleure arme du sac à son niveau (en quittant l'Invocateur) : elle revient dans la main.
  function equipBestWeapon(hero) {
    const lv = clampLevel(hero.level),
      score = it => (typeof gearScore === 'function' ? gearScore(it) : itemLevel(it)),
      best = hero.inventory
        .filter(it => it && it.slot === 'weapon' && !isBoundItem(it) && itemLevel(it) <= lv)
        .sort((a, b) => score(b) - score(a))[0];
    if (!best) return;
    hero.inventory.splice(hero.inventory.indexOf(best), 1);
    hero.equipment.weapon = best;
  }
  // Accorde l'arme liée à la classe et au niveau du héros. Renvoie true si l'équipement a changé.
  function syncPact(hero) {
    const eq = hero?.equipment;
    if (!eq || !Array.isArray(hero.inventory)) return false;
    const classId = hero.classe?.id || null,
      type = boundWeaponOf(classId);
    let changed = false;
    // Une arme liée ne quitte jamais la main : ni la réserve, ni le sac ; celle d'une autre classe disparaît.
    for (let i = hero.inventory.length - 1; i >= 0; i--)
      if (isBoundItem(hero.inventory[i])) {
        hero.inventory.splice(i, 1);
        changed = true;
      }
    if (isBoundItem(eq.weapon2)) {
      eq.weapon2 = null;
      changed = true;
    }
    if (isBoundItem(eq.weapon) && eq.weapon.bound !== classId) {
      eq.weapon = null;
      changed = true;
      notify(hero, '📕 Le Grimoire retourne aux ombres. Il reviendra si tu redeviens Invocateur.');
      equipBestWeapon(hero);
    }
    if (classId !== 'invocateur') dismiss(hero);
    if (type) {
      const fresh = makeBoundWeapon(classId, type, hero.level);
      if (!isBoundItem(eq.weapon)) {
        for (const slot of ['weapon', 'weapon2'])
          if (eq[slot]) {
            hero.inventory.push(eq[slot]);
            eq[slot] = null;
          }
        eq.weapon = fresh;
        changed = true;
        notify(hero, '📕 ' + fresh.name + ' : ton arme liée, de qualité Relique. Elle grandira avec toi.');
      } else if (
        eq.weapon.level !== fresh.level ||
        eq.weapon.name !== fresh.name ||
        JSON.stringify(eq.weapon.sec) !== JSON.stringify(fresh.sec)
      ) {
        const renamed = eq.weapon.name !== fresh.name;
        // L'enchantement reste ; niveau, nom et secondaires suivent le héros.
        Object.assign(eq.weapon, {
          level: fresh.level,
          name: fresh.name,
          sec: fresh.sec,
          rarity: fresh.rarity,
          weaponType: type
        });
        changed = true;
        if (renamed) notify(hero, '📕 Ton Grimoire grandit : ' + fresh.name + ' !');
      }
    }
    if (!changed) return false;
    if (hero === game.hero) {
      if (typeof recomputeStats === 'function') recomputeStats();
      if (typeof refreshWeaponBar === 'function') refreshWeaponBar();
    } else if (typeof recomputeHeroStats === 'function') recomputeHeroStats(hero);
    return true;
  }
  // ---------------------------------------------------------------- Réseau
  // Instantané : [id, sorte, x, y, sens, attaque (dixièmes), vie restante (centièmes)].
  function view() {
    const t = now();
    return list.map(s => [
      s.id,
      ORDER.indexOf(s.kind),
      Math.round(s.x),
      Math.round(s.y),
      s.face,
      Math.round(s.atk * 10),
      Math.round(Math.max(0, Math.min(1, (s.until - t) / lifeOf(s.owner, s.kind))) * 100)
    ]);
  }
  function applyView(raw) {
    const seen = new Set();
    for (const v of Array.isArray(raw) ? raw.slice(0, 64) : []) {
      if (!Array.isArray(v) || !v.slice(0, 7).every(Number.isFinite) || !ORDER[v[1]]) continue;
      const [id, kind, x, y, face, atk, life] = v,
        old = remote.get(id);
      seen.add(id);
      remote.set(id, {
        id,
        kind: ORDER[kind],
        x: old ? old.x : x,
        y: old ? old.y : y,
        tx: x,
        ty: y,
        face: face < 0 ? -1 : 1,
        atk: atk / 10,
        life: Math.max(0, Math.min(1, life / 100)),
        born: old ? old.born : now()
      });
    }
    for (const id of [...remote.keys()]) if (!seen.has(id)) remote.delete(id);
  }
  // ---------------------------------------------------------------- Dessin
  // Petits rectangles « pixel » (2 px) autour d'un point, retournés selon le sens.
  function pixels(c, x, y, face, rects) {
    for (const [px, py, w, h, color] of rects) {
      c.fillStyle = color;
      c.fillRect(Math.round(x + (face > 0 ? px : -px - w) * 2), Math.round(y + py * 2), w * 2, h * 2);
    }
  }
  const BONE = '#e9e3cf',
    BONE_D = '#a9a28c',
    INK = '#1c1820',
    FLESH = '#8d9a6a',
    FLESH_D = '#5d6a44';
  function glow(c, x, y, r, alpha = 0.3) {
    c.save();
    c.globalAlpha *= alpha;
    c.fillStyle = POISON;
    c.beginPath();
    c.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  function drawSkeleton(c, s, bob, lunge) {
    const x = s.x + lunge * s.face,
      y = s.y - 26 + bob;
    pixels(c, x, y, s.face, [
      // Crâne, orbites et mâchoire.
      [-3, 0, 6, 5, BONE],
      [-3, 4, 6, 1, BONE_D],
      [-2, 2, 1, 1, INK],
      [1, 2, 1, 1, INK],
      [-2, 5, 4, 1, BONE],
      // Colonne et côtes.
      [-1, 6, 2, 7, BONE_D],
      [-3, 7, 6, 1, BONE],
      [-3, 9, 6, 1, BONE],
      [-2, 11, 4, 1, BONE],
      // Bras (l'un tient une lame rouillée), bassin et jambes.
      [-4, 7, 1, 5, BONE],
      [3, 7, 1, 4, BONE],
      [4, 9, 1, 1, '#7a5a3a'],
      [5, 4, 1, 6, '#b08a5a'],
      [5, 3, 1, 1, '#d8c8a0'],
      [-2, 13, 4, 1, BONE],
      [-2, 14, 1, 5, BONE],
      [1, 14, 1, 5, BONE]
    ]);
    // Yeux de peste.
    c.fillStyle = POISON;
    c.fillRect(Math.round(x + (s.face > 0 ? -4 : 2)), Math.round(y + 4), 2, 2);
    c.fillRect(Math.round(x + (s.face > 0 ? 2 : -4)), Math.round(y + 4), 2, 2);
  }
  function drawRat(c, s, bob, lunge) {
    const x = s.x + lunge * s.face,
      y = s.y - 8 + bob * 0.5;
    pixels(c, x, y, s.face, [
      [-5, 1, 8, 4, '#5a4a3e'],
      [-4, 0, 6, 1, '#6e5c4c'],
      [-3, 2, 3, 2, '#7d9a3a'],
      [3, 2, 3, 2, '#5a4a3e'],
      [5, 3, 1, 1, '#d8a0a0'],
      [3, 1, 1, 1, '#c8b0a0'],
      [-4, 5, 1, 1, INK],
      [1, 5, 1, 1, INK],
      [-8, 3, 3, 1, '#c89a8a'],
      [-10, 2, 2, 1, '#c89a8a']
    ]);
    c.fillStyle = POISON;
    c.fillRect(Math.round(x + (s.face > 0 ? 8 : -10)), Math.round(y + 5), 2, 2);
  }
  function drawTotem(c, s, t) {
    const x = s.x,
      y = s.y - 40,
      pulse = 0.5 + 0.5 * Math.sin(t * 5);
    // Zone de peste au sol.
    c.save();
    c.globalAlpha *= 0.1 + 0.05 * pulse;
    c.fillStyle = POISON;
    c.beginPath();
    c.arc(s.x, s.y, tiles(KINDS.totem.area), 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.35;
    c.strokeStyle = POISON;
    c.setLineDash([6, 8]);
    c.lineWidth = 2;
    c.stroke();
    c.restore();
    pixels(c, x, y, 1, [
      [-1, 6, 3, 14, '#5e3c22'],
      [0, 6, 1, 14, '#7a5030'],
      // Deux crânes empilés et des os en croix.
      [-3, 0, 6, 5, BONE],
      [-2, 2, 1, 1, INK],
      [1, 2, 1, 1, INK],
      [-3, 9, 6, 4, BONE],
      [-2, 10, 1, 1, INK],
      [1, 10, 1, 1, INK],
      [-5, 15, 10, 1, BONE_D],
      [-1, 20, 3, 1, '#3a2614']
    ]);
    // Flamme verte au sommet.
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y - 4, 0, x, y - 4, 12 + 4 * pulse);
    g.addColorStop(0, 'rgba(220,255,150,.9)');
    g.addColorStop(1, 'rgba(164,232,60,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y - 4, 12 + 4 * pulse, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  function drawAbomination(c, s, bob, lunge) {
    const x = s.x + lunge * s.face * 0.5,
      y = s.y - 50 + bob;
    pixels(c, x, y, s.face, [
      // Corps énorme, recousu.
      [-8, 4, 16, 14, FLESH],
      [-7, 2, 12, 2, FLESH],
      [-8, 14, 16, 4, FLESH_D],
      [-2, 5, 1, 10, '#3a2a2a'],
      [-3, 6, 3, 1, '#3a2a2a'],
      [-3, 9, 3, 1, '#3a2a2a'],
      [-3, 12, 3, 1, '#3a2a2a'],
      [3, 7, 4, 4, '#a5b47a'],
      // Tête basse, un œil.
      [1, -2, 6, 5, FLESH],
      [4, 0, 2, 2, POISON],
      [2, 3, 4, 1, INK],
      // Bras massifs et crochet.
      [-11, 6, 3, 10, FLESH_D],
      [8, 6, 3, 9, FLESH_D],
      [9, 15, 3, 2, '#b8b8b0'],
      [11, 13, 1, 2, '#b8b8b0'],
      // Jambes.
      [-6, 18, 4, 5, FLESH_D],
      [2, 18, 4, 5, FLESH_D]
    ]);
  }
  function drawOne(c, s, t, life) {
    const age = t - s.born,
      rise = Math.min(1, age / 0.4),
      fade = life < 0.08 ? life / 0.08 : 1,
      moving = s.moving ?? Math.abs((s.tx ?? s.x) - s.x) + Math.abs((s.ty ?? s.y) - s.y) > 0.5,
      bob = Math.sin(t * 10 + s.id) * (s.kind === 'rat' ? 1.5 : 1),
      lunge = s.atk > 0 ? Math.sin((1 - s.atk / 0.3) * Math.PI) * 6 : 0;
    c.save();
    c.globalAlpha = Math.max(0, fade);
    glow(c, s.x, s.y + 2, KINDS[s.kind].r + 6, 0.35);
    // Sortie de terre : la créature monte depuis le sol.
    if (rise < 1 && s.kind !== 'totem') {
      c.beginPath();
      c.rect(s.x - 60, s.y - 120, 120, 120 + 4);
      c.clip();
      c.translate(0, (1 - rise) * (s.kind === 'abomination' ? 60 : 36));
    }
    if (s.kind === 'skeleton') drawSkeleton(c, s, moving ? bob : 0, lunge);
    else if (s.kind === 'rat') drawRat(c, s, bob, lunge);
    else if (s.kind === 'totem') drawTotem(c, s, t);
    else drawAbomination(c, s, moving ? bob : 0, lunge);
    c.restore();
    // Durée restante : fine barre verte sous la créature.
    if (s.kind !== 'rat') {
      const w = s.kind === 'abomination' ? 40 : 24;
      c.save();
      c.globalAlpha = 0.85 * fade;
      c.fillStyle = '#10140c';
      c.fillRect(Math.round(s.x - w / 2), Math.round(s.y + 8), w, 3);
      c.fillStyle = POISON;
      c.fillRect(Math.round(s.x - w / 2), Math.round(s.y + 8), Math.round(w * life), 3);
      c.restore();
    }
  }
  window.CanaanStages.drawSummons = function () {
    if (!started) return;
    const t = now();
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    if (game.mode === 'guest')
      for (const s of remote.values()) {
        s.x += (s.tx - s.x) * 0.3;
        s.y += (s.ty - s.y) * 0.3;
        drawOne(ctx, s, t, s.life);
      }
    else for (const s of list) drawOne(ctx, s, t, Math.max(0, (s.until - t) / lifeOf(s.owner, s.kind)));
    ctx.restore();
  };
  window.CANAAN_SUMMONS = Object.freeze({
    KINDS,
    cast,
    free,
    sacrifice,
    dismiss,
    syncPact,
    canSwitch,
    view,
    applyView,
    count: owner => mine(owner).length,
    // Contrôle et tests : invocations d'un héros (sorte, position, fin).
    of: owner => mine(owner).map(s => ({ kind: s.kind, x: s.x, y: s.y, until: s.until })),
    clear: () => {
      list = [];
      remote = new Map();
    }
  });
})();
