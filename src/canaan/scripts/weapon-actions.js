/* Armes : neuf familles, 36 compétences, ciblage et effets. */
(() => {
  // Repousse un monstre loin du lanceur courant.
  function pushAway(m, distance) {
    const dx = m.x - AP.x,
      dy = m.y - AP.y,
      len = Math.max(1, Math.hypot(dx, dy));
    for (let n = distance; n > 0; n -= 12) {
      const x = m.x + (dx / len) * Math.min(12, n),
        y = m.y + (dy / len) * Math.min(12, n);
      if (!canWalk(x, y)) break;
      m.x = x;
      m.y = y;
    }
  }
  const vfx = [],
    timers = [];
  let castContext = { magic: false };
  // États des compétences propres à chaque héros (parade, rage, élan, combo, ombre, concentration, arcanes…)
  // et recharges des alliés ; ceux de l'hôte vivent dans game.hero.skillState, ses recharges dans weaponCooldowns.
  const SKILL_STATES = ['guard', 'parryReady', 'berserk', 'flurry', 'combo', 'shadow', 'charge', 'focus', 'arcane', 'fastBow', 'mark', 'shieldGuard'];
  const TIMED_STATES = ['guard', 'parryReady', 'berserk', 'flurry', 'combo', 'shadow', 'fastBow', 'shieldGuard'];
  function skillStateOf(hero) {
    if (!hero.skillState) hero.skillState = { ...Object.fromEntries(SKILL_STATES.map(k => [k, 0])), cooldowns: {} };
    return hero.skillState;
  }
  // Lanceur courant : les aides (cônes, cercles, ruées, projectiles, dégâts, soins) agissent pour ce héros.
  let actor = game.hero,
    AP = P,
    S = skillStateOf(game.hero);
  const isHost = () => actor === game.hero;
  function withActor(hero, fn) {
    const previous = [actor, AP, S];
    actor = hero;
    AP = hero.player;
    S = skillStateOf(hero);
    try {
      return fn();
    } finally {
      [actor, AP, S] = previous;
    }
  }
  const holyZones = [];
  const color = {
    sword: '#c9f1ff',
    dualsword: '#b2d8ff',
    axe: '#ffb078',
    mace: '#e7c08c',
    spear: '#9ce6d5',
    dualdagger: '#e5a7ff',
    bow: '#a7e8a0',
    staff: '#b38aff',
    shield: '#ffe4a2'
  };
  const now = () => performance.now() / 1000,
    // Visée : la souris pour l'hôte, le point de son intention pour un allié.
    aim = () => (isHost() ? facingAngleCore() : Math.atan2(actor.intent.aimY - AP.y, actor.intent.aimX - AP.x)),
    groundTarget = () => (isHost() ? { x: mouseWorldX, y: mouseWorldY } : { x: actor.intent.aimX, y: actor.intent.aimY }),
    stats = () => characterStats(actor),
    power = () =>
      isHost()
        ? Math.max(8, Math.round(18 + attackBonus() * 0.75 + (stats().attack || 0) * 0.25))
        : heroPower(stats().attack),
    magPower = () =>
      isHost()
        ? Math.max(8, Math.round(18 + attackBonus() * 0.55 + (stats().intellect || 0) * 0.85))
        : heroMagicPower(stats().attack, stats().intellect || 0);
  function effect(shape, x, y, a, r, w, c, d = 0.3) {
    vfx.push({ shape, x, y, a, r, w, c, life: d, max: d });
    if (vfx.length > 180) vfx.shift();
    CANAAN_SOUND.effect(shape, x, y, c);
    game.view.fx?.('v', [shape, Math.round(x), Math.round(y), Math.round(a * 100) / 100, Math.round(r), Math.round(w * 100) / 100, c, d]);
  }
  // Effets reçus de l'hôte par un invité en ligne : ajoutés tels quels, puis vieillis à chaque pas d'affichage.
  function remoteEffect([shape, x, y, a, r, w, c, d]) {
    if (typeof shape !== 'string' || ![x, y, a, r, w, d].every(Number.isFinite) || typeof c !== 'string') return;
    vfx.push({ shape, x, y, a, r, w, c, life: Math.min(d, 2), max: Math.min(d, 2) });
    if (vfx.length > 180) vfx.shift();
    CANAAN_SOUND.effect(shape, x, y, c);
  }
  function ageEffects(dt) {
    for (let i = vfx.length - 1; i >= 0; i--) {
      vfx[i].life -= dt;
      if (vfx[i].life <= 0) vfx.splice(i, 1);
    }
  }
  function arc(r, angle, width, c) {
    effect('arc', AP.x, AP.y, angle, r, width, c);
    AP.atk = 0.28;
  }
  function ring(r, c) {
    effect('ring', AP.x, AP.y, 0, r, 0, c, 0.45);
    AP.atk = 0.28;
  }
  function beam(x, y, a, len, w, c) {
    effect('beam', x, y, a, len, w, c, 0.3);
    AP.atk = 0.28;
  }
  function splash(x, y, r, c) {
    effect('ring', x, y, 0, r, 0, c, 0.5);
    burst(x, y, c, 12);
  }
  // Coup du lanceur : le moteur de combat, avec ses statistiques, ses talents de classe et ses Rubis (l'hôte ou un allié).
  function strike(m, value, context) {
    return isHost() ? hit(m, value, context) : CANAAN_COMBAT.attack(m, value, context, actor);
  }
  // Soin du lanceur, avec ses bonus de soins, ses talents de classe et ses Rubis. Renvoie les PV rendus.
  function healActor(amount) {
    return canaanApplyHeal(amount, false, actor);
  }
  function dmg(m, mult, mag = false) {
    if (!m || m.hp <= 0) return 0;
    const before = m.hp;
    const extra = (S.berserk > 0 ? 1.2 : 1) * (S.shadow > 0 ? 1.25 : 1) * (S.focus > 0 ? 1.3 : 1);
    strike(m, Math.round((mag ? magPower() : power()) * mult * extra), {
      ...castContext,
      magic: mag || castContext.magic
    });
    S.shadow = 0;
    S.focus = 0;
    const done = Math.max(0, before - Math.max(0, m.hp));
    return done;
  }
  function withCastContext(context, fn) {
    const previous = castContext;
    castContext = context;
    try {
      return fn();
    } finally {
      castContext = previous;
    }
  }
  function lifesteal(amount) {
    const n = healActor(amount * 0.15);
    if (n > 0) {
      float(AP.x, AP.y - 43, '+' + n + ' PV', '#77ffa9');
      splash(AP.x, AP.y, 42, '#77ffa9');
    }
  }
  function targets(range, angle, width) {
    return game.world.monsters
      .slice()
      .filter(
        m =>
          m.hp > 0 &&
          Math.hypot(m.x - AP.x, m.y - AP.y) <= range + (m.r || 0) &&
          Math.abs(
            Math.atan2(
              Math.sin(Math.atan2(m.y - AP.y, m.x - AP.x) - angle),
              Math.cos(Math.atan2(m.y - AP.y, m.x - AP.x) - angle)
            )
          ) <=
            width / 2
      );
  }
  // Couleur d'un effet : l'élément de la classe pour une compétence, sinon la couleur de l'arme.
  const fxColor = () => ELEMENTS[castContext.element]?.color || color[currentWeaponType()] || '#fff';
  function cone(range, width, mult, cb, a = aim()) {
    arc(range, a, width, fxColor());
    let total = 0;
    for (const m of targets(range, a, width)) {
      total += dmg(m, mult);
      cb?.(m);
    }
    return total;
  }
  function circle(radius, mult, cb) {
    ring(radius, fxColor());
    let total = 0;
    for (const m of game.world.monsters.slice())
      if (m.hp > 0 && Math.hypot(m.x - AP.x, m.y - AP.y) < radius + (m.r || 0)) {
        total += dmg(m, mult);
        cb?.(m);
      }
    return total;
  }
  function linear(len, width, mult, cb, a = aim()) {
    beam(AP.x, AP.y, a, len, width, fxColor());
    let total = 0;
    for (const m of game.world.monsters.slice()) {
      const dx = m.x - AP.x,
        dy = m.y - AP.y,
        t = dx * Math.cos(a) + dy * Math.sin(a),
        cross = Math.abs(dx * Math.sin(a) - dy * Math.cos(a));
      if (m.hp > 0 && t >= 0 && t <= len + (m.r || 0) && cross <= width + (m.r || 0)) {
        total += dmg(m, mult);
        cb?.(m);
      }
    }
    return total;
  }
  function later(delay, fn) {
    timers.push({ t: delay, fn, context: { ...castContext }, actor });
  }
  function debuff(m, k, sec, v = 1) {
    if (m.hp <= 0) return;
    m['v1746_' + k] = Math.max(m['v1746_' + k] || 0, sec);
    if (k === 'bleed') {
      m.v1746_bleedPower = Math.max(m.v1746_bleedPower || 0, v);
      m.v1746_bleedBy = actor;
    }
    float(
      m.x,
      m.y - 47,
      { bleed: '🩸', armor: '🛡️−', slow: '❄️', weak: '⬇', mark: '🎯' }[k] || '✦',
      '#f7ceff'
    );
  }
  function dash(distance, angle = aim()) {
    const x = AP.x,
      y = AP.y;
    for (let t = 0; t < distance; t += 8) {
      const nx = AP.x + Math.cos(angle) * 8,
        ny = AP.y + Math.sin(angle) * 8;
      if (!canWalk(nx, ny)) break;
      AP.x = nx;
      AP.y = ny;
    }
    beam(x, y, angle, Math.hypot(AP.x - x, AP.y - y), 16, '#9cecff');
    return { x, y };
  }
  function projectile(a, mult, c, opts = {}) {
    const speed = opts.speed || 12;
    game.world.projectiles.push({
      x: AP.x,
      y: AP.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      dmg: Math.round(
        (opts.mag ? magPower() : power()) * mult * (S.focus > 0 ? 1.3 : 1) * (S.shadow > 0 ? 1.25 : 1)
      ),
      life: opts.life || 48,
      c,
      homing: false,
      owner: isHost() ? undefined : actor,
      combatContext: { ...castContext, magic: !!opts.mag || castContext.magic }
    });
    S.focus = 0;
    S.shadow = 0;
    beam(AP.x, AP.y, a, 65, 7, c);
  }
  // Postures du héros touché (l'hôte par défaut) : parade, rage, élan et serment du gardien.
  window.CANAAN_WEAPON_DEFENSE = function (m, damage, hero = game.hero) {
    const st = skillStateOf(hero);
    let d = damage;
    if (st.guard > 0) d *= 0.6;
    if (st.berserk > 0) d *= 1.15;
    if (st.flurry > 0) d *= 1.1;
    if (m?.v1746_weak > 0) d *= 0.95;
    if (st.shieldGuard > 0) d *= 0.65;
    return Math.max(1, Math.round(d));
  };
  // Étape du pipeline : zones sacrées, ralentissements, minuteurs différés et durées des effets visuels.
  window.CanaanStages.weaponVfx = {
    before() {
      const pos = new Map();
      for (const m of game.world.monsters) if (m.v1746_slow > 0) pos.set(m, { x: m.x, y: m.y });
      return pos;
    },
    after(pos) {
      if (!started || paused) return;
      const dt = 1 / 60;
      const states = game.heroes.map(skillStateOf);
      for (const st of states) st.shieldGuard = Math.max(0, st.shieldGuard - dt);
      for (let zi = holyZones.length - 1; zi >= 0; zi--) {
        const z = holyZones[zi];
        z.t -= dt;
        z.tick -= dt;
        if (z.tick <= 0) {
          z.tick += 1;
          const owner = game.heroes.includes(z.owner) ? z.owner : game.hero;
          for (const m of game.world.monsters.slice())
            if (m.hp > 0 && Math.hypot(m.x - z.x, m.y - z.y) < z.r + (m.r || 0))
              withActor(owner, () => withCastContext(z.context, () => dmg(m, 0.32, true)));
          // Le sol consacré soigne chaque héros du groupe qui s'y tient.
          for (const hero of game.heroes) {
            const p = hero.player;
            if (p.dead || Math.hypot(p.x - z.x, p.y - z.y) >= z.r) continue;
            // Soigné par le lanceur de la zone (ses bonus de soins et ses talents de soutien).
            const h = canaanApplyHeal(Math.max(1, p.mhp * 0.025), false, hero, owner, true);
            if (h > 0) float(p.x, p.y - 39, '+' + h + ' PV', '#9fffc7');
          }
        }
        if (z.t <= 0) holyZones.splice(zi, 1);
      }
      // Durées des postures de chaque héros, et recharges des compétences des alliés.
      for (const st of states) for (const k of TIMED_STATES) if (k !== 'shieldGuard') st[k] = Math.max(0, st[k] - dt);
      for (const hero of game.heroes) {
        if (hero === game.hero) continue;
        const cds = skillStateOf(hero).cooldowns;
        for (const key of Object.keys(cds)) cds[key] = Math.max(0, cds[key] - dt);
      }
      for (const m of game.world.monsters.slice()) {
        const p = pos.get(m);
        if (p) {
          m.x = p.x + (m.x - p.x) * 0.65;
          m.y = p.y + (m.y - p.y) * 0.65;
        }
        for (const k of ['armor', 'slow', 'weak', 'mark', 'bleed'])
          if (m['v1746_' + k] > 0) m['v1746_' + k] = Math.max(0, m['v1746_' + k] - dt);
        if (m.v1746_bleed > 0) {
          m.v1746_bleedTick = (m.v1746_bleedTick || 0) + dt;
          if (m.v1746_bleedTick >= 1) {
            m.v1746_bleedTick -= 1;
            const by = m.v1746_bleedBy;
            if (by && by !== game.hero && game.heroes.includes(by)) canaanHeroStrike(m, m.v1746_bleedPower || 3, by);
            else hit(m, m.v1746_bleedPower || 3);
          }
        }
      }
      for (let i = timers.length - 1; i >= 0; i--) {
        const t = timers[i];
        t.t -= dt;
        if (t.t <= 0) {
          timers.splice(i, 1);
          if (!t.actor.player.dead) withActor(t.actor, () => withCastContext(t.context, t.fn));
        }
      }
      ageEffects(dt);
    }
  };
  // Étape de rendu : visée et effets des armes, dessinés après le monde.
  window.CanaanStages.drawWeaponEffects = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(-camX, -camY);
    // Direction et portée : indication légère, même sans lancer un sort.
    const type = currentWeaponType(),
      a = aim(),
      c = color[type] || '#b7d8ff';
    const r =
      type === 'bow' || type === 'staff'
        ? 240
        : type === 'spear'
          ? 175
          : type === 'mace' || type === 'shield'
            ? 135
            : 125;
    ctx.globalAlpha = 0.17;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(P.x, P.y);
    ctx.arc(P.x, P.y, r, a - 0.2, a + 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    ctx.moveTo(P.x + Math.cos(a) * 27, P.y + Math.sin(a) * 27);
    ctx.lineTo(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r);
    ctx.stroke();
    ctx.setLineDash([]);
    const tx = P.x + Math.cos(a) * r,
      ty = P.y + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
    ctx.stroke();
    for (const z of holyZones) {
      ctx.save();
      ctx.globalAlpha = 0.17 + 0.05 * Math.sin(time * 0.12);
      ctx.fillStyle = '#ffd77a';
      ctx.strokeStyle = '#fff1aa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const e of vfx) {
      const t = e.life / e.max;
      ctx.globalAlpha = Math.max(0, t) * 0.75;
      ctx.strokeStyle = e.c;
      ctx.fillStyle = e.c;
      ctx.lineWidth = 3 + 5 * (1 - t);
      ctx.shadowColor = e.c;
      ctx.shadowBlur = 12;
      if (e.shape === 'arc') {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (0.8 + 0.2 * (1 - t)), e.a - e.w / 2, e.a + e.w / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, e.r, e.a - e.w / 2, e.a + e.w / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (e.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (0.35 + 0.65 * (1 - t)), 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.shape === 'beam') {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.a);
        ctx.fillRect(0, (-e.w * t) / 2, e.r, e.w * t);
        ctx.restore();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  };
  function spend(i) {
    if (
      i < 0 ||
      i > 3 ||
      !started ||
      paused ||
      P.dead ||
      playerStun > 0 ||
      modalOpen() ||
      document.activeElement === chatInput ||
      document.getElementById('dialog').style.display === 'block'
    )
      return null;
    const type = currentWeaponType();
    if (!WEAPON_DEFINITIONS[type]) return null;
    if (type !== activeWeaponType) refreshWeaponBar();
    const s = SKILLS[i],
      key = type + ':' + i;
    if (!s || (weaponCooldowns[key] || 0) > 0) return null;
    const cost = CANAAN_RUBIS.manaCost(window.CANAAN_CLASS_MANA_COST(type, i, s.mp));
    if (P.mp < cost) {
      toast('Mana insuffisant');
      return null;
    }
    P.mp -= cost;
    // La Célérité (et les talents) réduit le verrou réel, également utilisé par l'affichage et le changement d'arme.
    const recovery = Math.max(0, Math.min(80, stats().cooldownReduction || 0));
    weaponCooldowns[key] = s.max * (1 - recovery / 100) * CANAAN_RUBIS.cooldownFactor();
    s.cd = weaponCooldowns[key];
    castContext = window.CANAAN_CLASS_CAST(type, i);
    // Rubis de compétence : Résonance, Éclipse, Chaos, Transcendance, Écho, Accélération.
    castContext = CANAAN_RUBIS.onCast(type, i, key, castContext);
    return type;
  }

  // Attaque de base : gratuite (aucun mana), clic gauche rapide et clic droit lourd.
  // Maintenir le bouton enchaîne les attaques ; un verrou commun empêche de cumuler les deux.
  const BASIC = Object.freeze({
    quick: { mult: 0.4, lock: 0.6 },
    heavy: { mult: 0.9, lock: 1.4 }
  });
  const basicHeld = { left: false, right: false };
  let basicLock = 0,
    clientX = null,
    clientY = null;
  // Simulation : le héros peut-il frapper maintenant ?
  function basicReady() {
    return basicLock <= 0 && started && !paused && !P.dead && playerStun <= 0;
  }
  // Interface : un menu, le chat ou un dialogue ouvert empêche d'attaquer à la souris.
  function uiBlocked() {
    return (
      modalOpen() ||
      document.activeElement === chatInput ||
      document.getElementById('dialog').style.display === 'block'
    );
  }
  // Attaque déclenchée par l'interface (clic, bouton tactile).
  function basicAttack(heavy = false) {
    if (game.mode === 'guest') return !uiBlocked() && CANAAN_NET.requestAttack(heavy);
    if (!basicReady() || uiBlocked()) return false;
    return performBasic(heavy);
  }
  // Attaque de base dans la simulation, sans aucun accès à l'écran.
  function performBasic(heavy) {
    if (!basicReady()) return false;
    const type = currentWeaponType();
    if (!WEAPON_DEFINITIONS[type]) return false;
    const spec = heavy ? BASIC.heavy : BASIC.quick,
      col = color[type],
      m = spec.mult;
    // Célérité (et forme féline) : attaques de base plus rapides.
    basicLock = spec.lock * (1 - Math.min(60, characterStats().haste || 0) / 100) * window.CANAAN_CLASS_BASIC_LOCK();
    castContext = { magic: false, basic: true };
    switch (type) {
      case 'bow':
        projectile(aim(), m, col, { speed: heavy ? 15 : 13 });
        break;
      case 'staff':
        projectile(aim(), m, col, { mag: true, speed: heavy ? 10 : 12 });
        break;
      case 'spear':
        linear(heavy ? 185 : 160, heavy ? 30 : 22, m);
        break;
      case 'mace':
      case 'shield':
      case 'axe':
        cone(heavy ? 140 : 120, heavy ? Math.PI * 0.8 : Math.PI / 2, m);
        break;
      default:
        cone(heavy ? 130 : 115, heavy ? Math.PI * 0.7 : Math.PI / 2, m);
    }
    return true;
  }
  // Bouton de souris : 0 = gauche (rapide), 2 = droit (lourd).
  function holdBasicAttack(button, down, x = null, y = null) {
    if (button !== 0 && button !== 2) return;
    basicHeld[button === 0 ? 'left' : 'right'] = down;
    if (x !== null) {
      clientX = x;
      clientY = y;
    }
    if (down) {
      if (clientX !== null) {
        mouseWorldX = clientX + camX;
        mouseWorldY = clientY + camY;
      }
      basicAttack(button === 2);
    }
  }
  function releaseBasicAttack() {
    basicHeld.left = basicHeld.right = false;
  }
  addEventListener('mousemove', e => {
    clientX = e.clientX;
    clientY = e.clientY;
  });
  addEventListener('mouseup', e => holdBasicAttack(e.button, false));
  addEventListener('blur', releaseBasicAttack);
  // Étape du pipeline : verrou de l'attaque de base et répétition tant que le bouton est maintenu.
  // Entrées (appelé par readInput) : attaque voulue d'après les boutons maintenus, ou null.
  function wantedBasicAttack() {
    if (!basicHeld.left && !basicHeld.right) return null;
    if (uiBlocked()) {
      releaseBasicAttack();
      return null;
    }
    // La caméra suit le héros : la visée reste sous le curseur même sans bouger la souris.
    if (clientX !== null) {
      mouseWorldX = clientX + camX;
      mouseWorldY = clientY + camY;
    }
    return basicHeld.right ? 'heavy' : 'quick';
  }
  // Attaque de base d'un allié : mêmes formes, portées et valeurs que celle de l'hôte, avec sa propre arme,
  // ses propres statistiques et sa propre recharge. Elle vise le point de son intention.
  function heroBasicAttack(hero, heavy = false) {
    const p = hero.player;
    if (p.dead || (p.basicLock || 0) > 0) return false;
    const type = hero.equipment.weapon?.weaponType || 'sword';
    if (!WEAPON_DEFINITIONS[type]) return false;
    const spec = heavy ? BASIC.heavy : BASIC.quick,
      a = Math.atan2(hero.intent.aimY - p.y, hero.intent.aimX - p.x),
      st = characterStats(hero),
      base = Math.round((type === 'staff' ? heroMagicPower(st.attack, st.intellect || 0) : heroPower(st.attack)) * spec.mult),
      context = { magic: type === 'staff', basic: true };
    p.basicLock = spec.lock * (1 - Math.min(60, st.haste || 0) / 100) * window.CANAAN_CLASS_BASIC_LOCK(hero);
    p.atk = 0.28;
    if (type === 'bow' || type === 'staff') {
      const speed = type === 'bow' ? (heavy ? 15 : 13) : heavy ? 10 : 12;
      game.world.projectiles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        dmg: base,
        life: 48,
        c: color[type],
        homing: false,
        owner: hero,
        combatContext: context
      });
      return true;
    }
    const spear = type === 'spear',
      wide = type === 'mace' || type === 'shield' || type === 'axe',
      range = spear ? (heavy ? 185 : 160) : wide ? (heavy ? 140 : 120) : heavy ? 130 : 115,
      width = spear ? (heavy ? 30 : 22) : wide ? (heavy ? Math.PI * 0.8 : Math.PI / 2) : heavy ? Math.PI * 0.7 : Math.PI / 2;
    for (const m of game.world.monsters.slice()) {
      if (m.hp <= 0) continue;
      const dx = m.x - p.x,
        dy = m.y - p.y,
        r = m.r || 0;
      const inside = spear
        ? (t => t >= 0 && t <= range + r && Math.abs(dx * Math.sin(a) - dy * Math.cos(a)) <= width + r)(dx * Math.cos(a) + dy * Math.sin(a))
        : Math.hypot(dx, dy) <= range + r && Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a))) <= width / 2;
      if (inside) CANAAN_COMBAT.attack(m, base, context, hero);
    }
    return true;
  }
  // Étape du pipeline : attaque voulue par chaque héros (intent.attack), avec sa propre recharge.
  window.CanaanStages.basicAttack = {
    after() {
      if (!started || paused) return;
      basicLock = Math.max(0, basicLock - 1 / 60);
      const wanted = game.hero.intent.attack;
      if (wanted) performBasic(wanted === 'heavy');
      for (const hero of game.heroes) {
        if (hero === game.hero || hero.away) continue;
        hero.player.basicLock = Math.max(0, (hero.player.basicLock || 0) - 1 / 60);
        if (Number.isInteger(hero.intent.skill)) {
          heroUseSkill(hero, hero.intent.skill);
          hero.intent.skill = null;
        }
        if (hero.intent.attack) heroBasicAttack(hero, hero.intent.attack === 'heavy');
      }
    }
  };

  // Compétence de l'hôte : barre, mana, recharges affichées, talents de classe et Rubis.
  function useSkill(i) {
    // Un invité demande la compétence à l'hôte, qui la lance avec ses statistiques.
    if (game.mode === 'guest') return CANAAN_NET.requestSkill(i);
    const type = spend(i);
    if (!type) return;
    castSkill(type, i);
  }
  // Compétence d'un allié : son arme, son mana, ses propres recharges (réduites par sa Récupération).
  function skillSpec(hero, i) {
    const type = hero.equipment.weapon?.weaponType || 'sword',
      spec = WEAPON_DEFINITIONS[type]?.sp?.[i];
    if (!spec) return null;
    // Coût réel : réductions des talents (Concentration arcanique, Avatar élémentaire) et des Rubis (Arcane, Transcendance) du héros.
    const cost = CANAAN_RUBIS.manaCost(window.CANAAN_CLASS_MANA_COST(type, i, spec[4], hero), hero);
    return { type, key: type + ':' + i, cooldown: spec[3], mana: spec[4], cost };
  }
  function skillReady(hero, i) {
    if (hero === game.hero) return false;
    const spec = skillSpec(hero, i);
    return !!spec && !hero.player.dead && (skillStateOf(hero).cooldowns[spec.key] || 0) <= 0 && hero.player.mp >= spec.cost;
  }
  function heroUseSkill(hero, i) {
    if (hero === game.hero) return useSkill(i);
    if (!started || paused || !skillReady(hero, i)) return false;
    const spec = skillSpec(hero, i),
      recovery = Math.max(0, Math.min(80, characterStats(hero).cooldownReduction || 0));
    hero.player.mp -= spec.cost;
    skillStateOf(hero).cooldowns[spec.key] = spec.cooldown * (1 - recovery / 100) * CANAAN_RUBIS.cooldownFactor(hero);
    // Talents de classe (élément, Consécration…) et Rubis de compétence (Résonance, Éclipse, Chaos…) du lanceur.
    const context = CANAAN_RUBIS.onCast(spec.type, i, spec.key, window.CANAAN_CLASS_CAST(spec.type, i, hero), hero);
    return withActor(hero, () => {
      castContext = context;
      castSkill(spec.type, i);
      return true;
    });
  }
  // Les 36 compétences, pour le lanceur courant (l'hôte, ou un allié via heroUseSkill).
  function castSkill(type, i) {
    const a = aim();
    const col = ELEMENTS[castContext.element]?.color || color[type];
    const rep = (n, interval, fn) => {
      for (let j = 0; j < n; j++) later(j * interval, () => fn(j));
    };
    switch (type) {
      case 'sword':
        if (i === 0) cone(125, Math.PI / 2, 1.2);
        if (i === 1) circle(132, 0.85);
        if (i === 2) {
          S.guard = 2;
          S.parryReady = 3;
          ring(75, '#a5dfff');
          float(AP.x, AP.y - 42, 'PARADE', '#a5dfff');
        }
        if (i === 3) {
          const total = cone(145, Math.PI / 2, S.parryReady > 0 ? 2.8 : 2.2);
          lifesteal(total);
          S.parryReady = 0;
          splash(AP.x, AP.y, 90, '#73ffa8');
        }
        break;
      case 'dualsword':
        if (i === 0) {
          S.combo = 4;
          rep(4, 0.1, () => cone(135, Math.PI / 3, 0.45));
        }
        if (i === 1) {
          S.combo = 4;
          rep(3, 0.15, () => circle(125, 0.55));
        }
        if (i === 2) {
          S.flurry = 5;
          ring(110, col);
          float(AP.x, AP.y - 42, 'ÉLAN +20 %', '#ffd79e');
        }
        if (i === 3) {
          const boosted = S.combo > 0;
          rep(6, 0.11, j => cone(145, Math.PI / 2, 0.45 * (boosted && j === 5 ? 1.2 : 1)));
          S.combo = 0;
        }
        break;
      case 'axe':
        if (i === 0) cone(140, Math.PI / 2, 1.7);
        if (i === 1) cone(165, (Math.PI * 2) / 3, 1.25);
        if (i === 2) {
          S.berserk = 6;
          ring(100, col);
          float(AP.x, AP.y - 42, 'BERSERKER', '#ffb078');
        }
        if (i === 3) {
          const m = targets(145, a, Math.PI / 2)[0];
          cone(145, Math.PI / 2, m && m.hp / m.mhp < 0.3 ? 3.2 : 2.4);
        }
        break;
      case 'mace':
        if (i === 0) cone(135, Math.PI / 2, 1.3, m => debuff(m, 'armor', 6));
        if (i === 1) circle(145, 0.9, m => debuff(m, 'slow', 3));
        if (i === 2)
          cone(145, Math.PI / 2, 1, m => {
            if (m.boss || m.worldBoss) debuff(m, 'weak', 4);
            else {
              m.cd = Math.max(m.cd, 1.4);
              applyEffect(m, 'stun', 0.65);
            }
          });
        if (i === 3) {
          const marked = targets(145, a, Math.PI / 2).some(m => m.v1746_armor > 0);
          cone(145, Math.PI / 2, marked ? 2.6 : 2.1);
        }
        break;
      case 'spear':
        if (i === 0) linear(230, 25, 1.35);
        if (i === 1)
          cone(175, Math.PI, 0.95, m => {
            if (!m.boss && !m.worldBoss) pushAway(m, 42);
          });
        if (i === 2) {
          const p = dash(180, a);
          beam(p.x, p.y, a, 180, 30, col);
          linear(205, 34, 1.15, null, a);
        }
        if (i === 3) {
          const m = targets(220, a, Math.PI / 3)[0];
          const d = m ? Math.hypot(m.x - AP.x, m.y - AP.y) : 0;
          cone(220, Math.PI / 3, d >= 115 && d <= 205 ? 2.75 : 2.2);
        }
        break;
      case 'dualdagger':
        if (i === 0) {
          rep(2, 0.11, j =>
            cone(110, Math.PI / 2, 0.65, m => {
              if (j === 1) debuff(m, 'bleed', 5, Math.max(2, Math.round(power() * 0.2)));
            })
          );
        }
        if (i === 1)
          circle(115, 0.9, m => {
            if (m.v1746_bleed > 0) m.v1746_bleed += 2;
          });
        if (i === 2) {
          dash(130, a + Math.PI);
          S.shadow = 3;
          ring(65, col);
        }
        if (i === 3) {
          rep(5, 0.1, () =>
            cone(115, Math.PI / 2, 0.45, m => {
              if (m.v1746_bleed > 0) {
                const remaining = m.v1746_bleed;
                const bleed = m.v1746_bleedPower || 2;
                m.v1746_bleed = 0;
                hit(m, Math.round(remaining * bleed));
                splash(m.x, m.y, 40, '#f68abb');
              }
            })
          );
        }
        break;
      case 'bow':
        if (i === 0) {
          const mult = S.fastBow > 0 ? 1.9 : 1.55;
          projectile(a, mult, col);
          S.fastBow = 0;
        }
        if (i === 1) {
          const { x, y } = groundTarget();
          effect('ring', x, y, 0, 115, 0, col, 0.9);
          rep(4, 0.65, () => {
            splash(x, y, 115, col);
            for (const m of game.world.monsters.slice())
              if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) < 115 + (m.r || 0)) dmg(m, 0.4);
          });
        }
        if (i === 2) {
          projectile(a, 0.8, col);
          for (const m of targets(350, a, 0.2)) {
            if (m.boss || m.worldBoss) debuff(m, 'mark', 4);
            else debuff(m, 'slow', 4);
          }
        }
        if (i === 3) {
          dash(115, a + Math.PI);
          projectile(a, 1.1, col);
          S.fastBow = 5;
        }
        break;
      case 'shield':
        if (i === 0) {
          rep(4, 0.14, j => {
            circle(135, 0.4);
            arc(135, a + (j * Math.PI) / 2, Math.PI * 0.8, '#ffe4a2');
          });
        }
        if (i === 1) {
          const z = { x: AP.x, y: AP.y, r: 155, t: 6, tick: 0.15, context: { ...castContext }, owner: actor };
          holyZones.push(z);
          splash(z.x, z.y, 155, '#ffe4a2');
          float(AP.x, AP.y - 48, 'SOL CONSACRÉ', '#ffe4a2');
        }
        if (i === 2) {
          linear(340, 23, 1.55);
          beam(AP.x, AP.y, a, 340, 20, '#ffe4a2');
          later(0.24, () =>
            beam(AP.x + Math.cos(a) * 310, AP.y + Math.sin(a) * 310, a + Math.PI, 310, 16, '#fff0b7')
          );
        }
        if (i === 3) {
          S.shieldGuard = 5;
          const h = healActor(AP.mhp * 0.12);
          if (h > 0) float(AP.x, AP.y - 40, '+' + h + ' PV', '#aaffd0');
          ring(110, '#ffe4a2');
          float(AP.x, AP.y - 65, 'SERMENT DU GARDIEN', '#ffe4a2');
        }
        break;
      case 'staff':
        if (i === 0) {
          projectile(a, 1.2, col, { mag: true });
          S.arcane = Math.min(3, S.arcane + 1);
        }
        if (i === 1) {
          const count = game.world.monsters.filter(m => m.hp > 0 && Math.hypot(m.x - AP.x, m.y - AP.y) < 150).length;
          circle(150, 1, null);
          if (count) S.arcane = Math.min(3, S.arcane + 1);
        }
        if (i === 2) {
          S.focus = 8;
          S.arcane = Math.min(3, S.arcane + 1);
          ring(100, col);
          float(AP.x, AP.y - 44, 'CONCENTRATION', '#d6aaff');
        }
        if (i === 3) {
          const mult = 1.7 + 0.55 * S.arcane;
          S.arcane = 0;
          const { x, y } = groundTarget();
          effect('ring', x, y, 0, 135, 0, col, 0.6);
          splash(x, y, 135, col);
          for (const m of game.world.monsters.slice())
            if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) < 135 + (m.r || 0)) dmg(m, mult, true);
        }
        break;
    }
  }
  Object.assign(window, {
    useSkill,
    canaanBasicAttack: basicAttack,
    canaanHoldBasicAttack: holdBasicAttack,
    canaanHeroBasicAttack: heroBasicAttack,
    canaanHeroUseSkill: heroUseSkill,
    CANAAN_SKILLS: Object.freeze({ ready: skillReady, spec: skillSpec, state: skillStateOf, remoteEffect, ageEffects, fx: effect }),
    CANAAN_BASIC_ATTACK: Object.freeze({
      spec: BASIC,
      lock: () => basicLock,
      held: () => ({ ...basicHeld }),
      wanted: wantedBasicAttack
    })
  });
})();
