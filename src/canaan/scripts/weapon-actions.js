/* Armes de classe : chaque classe a son arme (shared/data/classes.js, weapon) et le Druide a en plus les griffes de sa
   forme féline. Attaques de base, 40 compétences, sols persistants (fleur de vie, spores, sol consacré, braises,
   glace, mare de sang), faucon du Chasseur, ciblage et effets. Les effets visuels sont dessinés par vfx-art.js. */
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
  // Attire un monstre vers un point (Œil du cyclone).
  function pullTo(m, x, y, distance) {
    const dx = x - m.x,
      dy = y - m.y,
      len = Math.hypot(dx, dy);
    if (len < 30) return;
    const step = Math.min(distance, len - 30),
      nx = m.x + (dx / len) * step,
      ny = m.y + (dy / len) * step;
    if (canWalk(nx, ny)) {
      m.x = nx;
      m.y = ny;
    }
  }
  const vfx = [],
    timers = [];
  let castContext = { magic: false };
  // États des compétences propres à chaque héros (postures, marques, combos, faucon…) et recharges des alliés ;
  // ceux de l'hôte vivent dans game.hero.skillState, ses recharges dans weaponCooldowns.
  const SKILL_STATES = [
    'berserk',
    'combo',
    'shadow',
    'shadowMult',
    'roar',
    'shieldGuard',
    'huntMark',
    'bloom',
    'falcon',
    'falconTick',
    'crusade',
    'crusadeUntil',
    'rollShot'
  ];
  const TIMED_STATES = ['berserk', 'combo', 'shadow', 'roar', 'shieldGuard', 'huntMark', 'bloom', 'rollShot'];
  function skillStateOf(hero) {
    if (!hero.skillState)
      hero.skillState = { ...Object.fromEntries(SKILL_STATES.map(k => [k, 0])), cooldowns: {} };
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
  // Talent équipé par le lanceur courant.
  const talent = (cls, key) => CANAAN_CLASS.talent(actor, cls, key);
  // Sols persistants : { kind, x, y, r, t, every, tick, owner, context, onTick, onEnd }.
  const zones = [];
  const color = {
    wildstaff: '#7ee36a',
    feline: '#c8f59a',
    aegis: '#ffe4a2',
    dualdagger: '#e5a7ff',
    staff: '#ff9a4a',
    lute: '#ff9ad5',
    bow: '#e8c27a',
    dualsword: '#d6e4f2',
    grimoire: '#a4e83c',
    greataxe: '#e0404f'
  };
  // Portée des attaques de base à distance (px) : on frappe de loin, sans coller l'ennemi.
  const BASIC_RANGE = Object.freeze({ bow: 900, staff: 760, wildstaff: 720, lute: 700, grimoire: 720 });
  // Visée : la souris pour l'hôte, le point de son intention pour un allié.
  const aim = () =>
      isHost() ? facingAngleCore() : Math.atan2(actor.intent.aimY - AP.y, actor.intent.aimX - AP.x),
    groundTarget = () =>
      isHost() ? { x: mouseWorldX, y: mouseWorldY } : { x: actor.intent.aimX, y: actor.intent.aimY },
    stats = () => characterStats(actor),
    power = () =>
      isHost()
        ? Math.max(8, Math.round(18 + attackBonus() * 0.75 + (stats().attack || 0) * 0.25))
        : heroPower(stats().attack),
    magPower = () =>
      isHost()
        ? Math.max(8, Math.round(power() + Math.max(0, stats().intellect || 0) * 0.85))
        : heroMagicPower(stats().attack, stats().intellect || 0);
  // Effet visuel (vfx-art.js le dessine) : envoyé aussi aux invités.
  function effect(shape, x, y, a, r, w, c, d = 0.3) {
    const e = { shape, x, y, a, r, w, c, life: d, max: d };
    vfx.push(e);
    if (vfx.length > 220) vfx.shift();
    CANAAN_VFX.start(e);
    CANAAN_SOUND.effect(shape, x, y, c, r, w);
    game.view.fx?.('v', [
      shape,
      Math.round(x),
      Math.round(y),
      Math.round(a * 100) / 100,
      Math.round(r),
      Math.round(w * 100) / 100,
      c,
      d
    ]);
  }
  // Effets reçus de l'hôte par un invité en ligne : ajoutés tels quels, puis vieillis à chaque pas d'affichage.
  // Les sols persistants durent jusqu'à 15 s.
  function remoteEffect([shape, x, y, a, r, w, c, d]) {
    if (typeof shape !== 'string' || ![x, y, a, r, w, d].every(Number.isFinite) || typeof c !== 'string')
      return;
    const e = { shape, x, y, a, r, w, c, life: Math.min(d, 15), max: Math.min(d, 15) };
    vfx.push(e);
    if (vfx.length > 220) vfx.shift();
    CANAAN_VFX.start(e);
    CANAAN_SOUND.effect(shape, x, y, c, r, w);
  }
  function ageEffects(dt) {
    for (let i = vfx.length - 1; i >= 0; i--) {
      vfx[i].life -= dt;
      if (vfx[i].life <= 0) vfx.splice(i, 1);
      else CANAAN_VFX.tick(vfx[i], dt);
    }
    CANAAN_VFX.step(dt);
  }
  // Taille physique (cône) : une traînée d'acier pour les armes, un souffle de l'élément pour la magie.
  function arc(r, angle, width, c, shape = 'arc') {
    effect(shape, AP.x, AP.y, angle, r, width, c, 0.32);
    AP.atk = 0.28;
  }
  function ring(r, c, shape = 'ring') {
    effect(shape, AP.x, AP.y, 0, r, 0, c, 0.45);
    AP.atk = 0.28;
  }
  function beam(x, y, a, len, w, c, shape = 'beam') {
    effect(shape, x, y, a, len, w, c, 0.3);
    AP.atk = 0.28;
  }
  // Coup du lanceur : le moteur de combat, avec ses statistiques, ses talents de classe et ses artéfacts (l'hôte ou un allié).
  function strike(m, value, context) {
    return isHost() ? hit(m, value, context) : CANAAN_COMBAT.attack(m, value, context, actor);
  }
  // Soin du lanceur, avec ses bonus de soins, ses talents de classe et ses artéfacts. Renvoie les PV rendus.
  function healActor(amount) {
    return canaanApplyHeal(amount, false, actor);
  }
  // Postures du lanceur qui renforcent ses coups : Hurlement (+25 %), Rugissement (+15 % aux attaques de base) et
  // Pas de l'ombre (prochain coup +60 %, ou +100 % avec Assassinat, et critique).
  function stanceMult(st, basic) {
    return (
      (st.berserk > 0 ? 1.25 : 1) *
      (basic && st.roar > 0 ? 1.15 : 1) *
      (st.shadow > 0 ? st.shadowMult || 1.6 : 1)
    );
  }
  function spendStance() {
    S.shadow = 0;
  }
  // Dégâts d'un coup du lanceur courant ; mult : part de la Puissance (magique si mag).
  function dmg(m, mult, mag = false, extra = null) {
    if (!m || m.hp <= 0) return 0;
    const before = m.hp,
      basic = !!castContext.basic,
      forceCrit = S.shadow > 0 || !!castContext.forceCrit || !!extra?.forceCrit;
    strike(m, Math.round((mag ? magPower() : power()) * mult * stanceMult(S, basic)), {
      ...castContext,
      ...(extra || {}),
      forceCrit,
      magic: mag || castContext.magic
    });
    spendStance();
    const done = Math.max(0, before - Math.max(0, m.hp));
    if (done > 0) spark(m.x, m.y - 14, fxColor());
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
  // Héros du groupe à moins de tiles cases du lanceur (lui compris), vivants et présents.
  function groupNear(tiles, x = AP.x, y = AP.y) {
    return game.heroes.filter(
      h => !h.player.dead && !h.away && Math.hypot(h.player.x - x, h.player.y - y) < tiles * TS
    );
  }
  // Soin d'un héros par le lanceur (ses bonus de soins et ses talents de soutien), avec son chiffre flottant.
  function healHero(hero, amount, colour = '#ffc2e4') {
    const h = canaanApplyHeal(Math.max(1, amount), false, hero, actor, true);
    if (h > 0) float(hero.player.x, hero.player.y - 40, '+' + Math.round(h) + ' PV', colour);
    return h;
  }
  // Monstres dans le cône : un point de leur corps (pieds → tête) à portée et dans l'angle, élargi de sa carrure.
  function targets(range, angle, width) {
    return game.world.monsters.slice().filter(
      m =>
        m.hp > 0 &&
        canaanBodyPoints(m).some(q => {
          const d = Math.hypot(q.x - AP.x, q.y - AP.y),
            off = Math.atan2(q.y - AP.y, q.x - AP.x) - angle;
          return (
            d <= range + q.radius &&
            (d <= q.radius ||
              Math.abs(Math.atan2(Math.sin(off), Math.cos(off))) <=
                width / 2 + Math.asin(Math.min(1, q.radius / d)))
          );
        })
    );
  }
  // Un point du corps dans la bande partant de (x, y) selon a : longueur [from, len], demi-largeur width.
  function inBand(m, x, y, a, from, len, width) {
    return canaanBodyPoints(m).some(q => {
      const dx = q.x - x,
        dy = q.y - y,
        t = dx * Math.cos(a) + dy * Math.sin(a);
      return (
        t >= from - q.radius &&
        t <= len + q.radius &&
        Math.abs(dx * Math.sin(a) - dy * Math.cos(a)) <= width + q.radius
      );
    });
  }
  // Monstres vivants à moins de r px d'un point.
  const around = (x, y, r) => game.world.monsters.slice().filter(m => m.hp > 0 && canaanBodyGap(m, x, y) < r);
  // Monstre vivant le plus proche d'un point, à moins de max px du lanceur (sauf ceux de skip).
  function nearestTo(x, y, max, skip = null) {
    let best = null,
      bd = Infinity;
    for (const m of game.world.monsters) {
      if (m.hp <= 0 || skip?.has(m) || Math.hypot(m.x - AP.x, m.y - AP.y) > max) continue;
      const d = Math.hypot(m.x - x, m.y - y);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }
  const isBoss = m => !!(m.boss || m.worldBoss || m.arenaBoss);
  // Couleur d'un effet : l'élément de la classe pour une compétence, sinon la couleur de l'arme.
  const fxColor = () =>
    ELEMENTS[castContext.element]?.color ||
    color[isHost() ? currentWeaponType() : CANAAN_CLASS.weaponType(actor)] ||
    '#fff';
  function cone(range, width, mult, cb, a = aim(), shape = 'arc') {
    arc(range, a, width, fxColor(), shape);
    let total = 0;
    for (const m of targets(range, a, width)) {
      total += dmg(m, mult);
      cb?.(m);
    }
    return total;
  }
  function circle(radius, mult, cb, shape = 'ring', mag = false) {
    ring(radius, fxColor(), shape);
    let total = 0;
    for (const m of game.world.monsters.slice())
      if (m.hp > 0 && canaanBodyGap(m, AP.x, AP.y) < radius) {
        total += dmg(m, mult, mag);
        cb?.(m);
      }
    return total;
  }
  function linear(len, width, mult, cb, a = aim(), shape = 'beam', mag = false) {
    beam(AP.x, AP.y, a, len, width, fxColor(), shape);
    let total = 0;
    for (const m of game.world.monsters.slice()) {
      if (m.hp > 0 && inBand(m, AP.x, AP.y, a, 0, len, width)) {
        total += dmg(m, mult, mag);
        cb?.(m);
      }
    }
    return total;
  }
  // Zone sous un point : tous les monstres à moins de r px.
  function area(x, y, r, mult, cb, mag = false) {
    let total = 0;
    for (const m of around(x, y, r)) {
      total += dmg(m, mult, mag);
      cb?.(m);
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
  // Saignement du lanceur : perSecond dégâts par seconde pendant sec secondes (Venin mortel : +40 %).
  function bleed(m, sec, perSecond) {
    const venom = talent('assassin', 'venom'),
      value = Math.max(2, Math.round(perSecond * (venom ? 1.4 : 1)));
    debuff(m, 'bleed', sec, value);
    if (venom) m._venomUntil = time / 60 + sec;
  }
  // Étourdit un monstre (pas un boss, qui est affaibli à la place).
  function stun(m, sec) {
    if (m.hp <= 0) return;
    if (isBoss(m)) return debuff(m, 'weak', 4);
    m.cd = Math.max(m.cd, sec);
    applyEffect(m, 'stun', sec);
  }
  // Immobilise un monstre dans des racines (un boss est ralenti).
  function root(m, sec) {
    if (m.hp <= 0) return;
    if (isBoss(m)) return CANAAN_CLASS.slow(actor, m, 0.4, sec, 'nature');
    applyEffect(m, 'root', sec);
    effect('rooted', m.x, m.y, 0, 26, 0, '#7ee36a', sec);
  }
  // Gèle un monstre (un boss est ralenti de 40 %).
  function freeze(m, sec) {
    if (m.hp <= 0) return;
    CANAAN_CLASS.chill(actor, m, sec);
    if (isBoss(m)) return CANAAN_CLASS.slow(actor, m, 0.4, sec, 'ice');
    m.cd = Math.max(m.cd, sec);
    applyEffect(m, 'stun', sec);
    effect('frozen', m.x, m.y, 0, 30, 0, '#bfeaff', sec);
  }
  // Ruée du lanceur ; le chemin parcouru est tracé par shape.
  function dash(distance, angle = aim(), shape = 'dashTrail') {
    const x = AP.x,
      y = AP.y;
    for (let t = 0; t < distance; t += 8) {
      const nx = AP.x + Math.cos(angle) * 8,
        ny = AP.y + Math.sin(angle) * 8;
      if (!canWalk(nx, ny)) break;
      AP.x = nx;
      AP.y = ny;
    }
    effect(shape, x, y, angle, Math.hypot(AP.x - x, AP.y - y), 18, fxColor(), 0.4);
    AP.atk = 0.28;
    return { x, y };
  }
  // Monstres touchés une fois sur le chemin d'une ruée (de start jusqu'au lanceur), et devant lui.
  function pathTargets(start, a, ahead = 60, width = 40) {
    const out = new Set(),
      len = Math.hypot(AP.x - start.x, AP.y - start.y) + ahead;
    for (const m of game.world.monsters)
      if (m.hp > 0 && inBand(m, start.x, start.y, a, -20, len, width)) out.add(m);
    return [...out];
  }
  // Projectile du lanceur. opts : speed (px par pas), range (portée en px) ou life (pas), mag (magique),
  // kind (forme dessinée : arrow, orb, comet, plague, note, fireball, thorn, dagger, heavyArrow, ember, frost),
  // size (rayon de contact), splash (rayon de l'explosion à l'impact, 50 % des dégâts autour), blast (forme de
  // l'explosion), pierce (traverse), onHit (effet à l'impact, dans le contexte du lanceur), scale (multiplicateur
  // selon la cible), flash (trait de départ, true par défaut), from (point de départ).
  function projectile(a, mult, c, opts = {}) {
    const speed = opts.speed || 12,
      hero = actor,
      context = { ...castContext, magic: !!opts.mag || castContext.magic },
      from = opts.from || AP,
      within = fn => m => withActor(hero, () => withCastContext(context, () => fn(m)));
    game.world.projectiles.push({
      x: from.x,
      y: from.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      dmg: Math.round((opts.mag ? magPower() : power()) * mult * stanceMult(S, !!castContext.basic)),
      life: opts.range ? Math.ceil(opts.range / speed) : opts.life || 48,
      c,
      kind: opts.kind || (opts.mag ? 'orb' : 'arrow'),
      size: opts.size || 8,
      splash: opts.splash || 0,
      blast: opts.blast || null,
      pierce: !!opts.pierce,
      homing: false,
      owner: isHost() ? undefined : actor,
      combatContext: { ...context, forceCrit: S.shadow > 0 || !!castContext.forceCrit },
      ...(opts.onHit ? { onHit: within(opts.onHit) } : {}),
      ...(opts.scale ? { scale: within(opts.scale) } : {}),
      ...(opts.contextFor ? { contextFor: within(opts.contextFor) } : {})
    });
    spendStance();
    if (opts.flash !== false) effect('muzzle', from.x, from.y, a, 40, 7, c, 0.2);
    AP.atk = 0.28;
  }
  // Sol persistant du lanceur : il agit toutes les every secondes pendant t secondes (onTick), puis onEnd.
  function addZone(kind, x, y, r, t, every, onTick, onEnd = null, c = fxColor()) {
    const z = {
      kind,
      x,
      y,
      r,
      t,
      every,
      tick: 0.05,
      owner: actor,
      context: { ...castContext },
      onTick,
      onEnd
    };
    zones.push(z);
    effect(kind, x, y, 0, r, 0, c, t);
    return z;
  }
  // Remet à zéro la recharge d'une compétence d'un héros (Coup de grâce, Assassinat, Boucherie).
  function resetCooldown(hero, key) {
    if (hero === game.hero) weaponCooldowns[key] = 0;
    else skillStateOf(hero).cooldowns[key] = 0;
  }
  // Postures du héros touché (l'hôte par défaut) : Hurlement, Rempart sacré (Bastion : 40 % des dégâts évités
  // renvoyés), Venin mortel (cible qui saigne : −10 %).
  window.CANAAN_WEAPON_DEFENSE = function (m, damage, hero = game.hero) {
    const st = skillStateOf(hero);
    let d = damage;
    if (st.berserk > 0) d *= 1.15;
    if (m?.v1746_weak > 0) d *= 0.95;
    if (m && m._venomUntil > time / 60) d *= 0.9;
    if (st.shieldGuard > 0) {
      const avoided = d * 0.35;
      d *= 0.65;
      if (m && m.hp > 0 && CANAAN_CLASS.talent(hero, 'paladin', 'bastion'))
        CANAAN_CLASS.reflect(hero, m, avoided * 0.4, 'holy');
    }
    // Terre sainte : un héros dans un sol consacré d'un Paladin qui a ce talent.
    if (
      zones.some(
        z =>
          z.kind === 'consecrated' &&
          CANAAN_CLASS.talent(z.owner, 'paladin', 'holyground') &&
          Math.hypot(hero.player.x - z.x, hero.player.y - z.y) < z.r
      )
    )
      d *= 0.85;
    return Math.max(1, Math.round(d));
  };
  // Faucon du Chasseur (Fauconnier) : il fond sur la Marque ou l'ennemi le plus proche toutes les 0,8 s.
  function stepFalcon(hero, st, dt) {
    if (!(st.falcon > 0)) return;
    st.falcon = Math.max(0, st.falcon - dt);
    st.falconTick -= dt;
    if (st.falconTick > 0) return;
    st.falconTick = 0.8;
    withActor(hero, () =>
      withCastContext(
        { magic: false, skill: true, offensive: true, slot: 3, element: 'wild', falcon: true },
        () => {
          const marked = game.world.monsters.find(
              m => m.hp > 0 && m._huntMark?.by === hero && m._huntMark.until > time / 60
            ),
            target =
              marked && Math.hypot(marked.x - AP.x, marked.y - AP.y) < TS * 12
                ? marked
                : nearestTo(AP.x, AP.y, TS * 10);
          if (!target) return;
          effect('hawk', target.x, target.y - 10, Math.random() * 6.28, 34, 0, '#e8c27a', 0.45);
          dmg(target, 0.6);
        }
      )
    );
  }
  // Étape du pipeline : sols persistants, ralentissements, faucons, minuteurs différés et durées des effets visuels.
  window.CanaanStages.weaponVfx = {
    before() {
      const pos = new Map();
      for (const m of game.world.monsters) if (m.v1746_slow > 0) pos.set(m, { x: m.x, y: m.y });
      return pos;
    },
    after(pos) {
      if (!started || paused) return;
      const dt = 1 / 60;
      for (let zi = zones.length - 1; zi >= 0; zi--) {
        const z = zones[zi];
        if (!game.heroes.includes(z.owner)) {
          zones.splice(zi, 1);
          continue;
        }
        z.t -= dt;
        z.tick -= dt;
        if (z.tick <= 0) {
          z.tick += z.every;
          withActor(z.owner, () => withCastContext(z.context, () => z.onTick(z)));
        }
        if (z.t <= 0) {
          zones.splice(zi, 1);
          if (z.onEnd) withActor(z.owner, () => withCastContext(z.context, () => z.onEnd(z)));
        }
      }
      // Durées des postures de chaque héros, faucons, et recharges des compétences des alliés.
      for (const hero of game.heroes) {
        const st = skillStateOf(hero);
        for (const k of TIMED_STATES) st[k] = Math.max(0, st[k] - dt);
        if (!hero.player.dead) stepFalcon(hero, st, dt);
        if (hero === game.hero) continue;
        const cds = st.cooldowns;
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
            if (time % 2 === 0) effect('bleedDrip', m.x, m.y - 20, 0, 12, 0, '#d0303f', 0.5);
            if (by && by !== game.hero && game.heroes.includes(by))
              canaanHeroStrike(m, m.v1746_bleedPower || 3, by);
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
  // Étincelle d'impact sur un monstre touché (sans son), montrée aussi aux invités.
  function spark(x, y, c) {
    const a = Math.round(Math.random() * 100) / 100,
      e = { shape: 'spark', x, y, a, r: 18, w: 0, c, life: 0.22, max: 0.22 };
    vfx.push(e);
    if (vfx.length > 220) vfx.shift();
    CANAAN_VFX.start(e);
    game.view.fx?.('v', ['spark', Math.round(x), Math.round(y), a, 18, 0, c, 0.22]);
  }
  // Étape de rendu : visée et effets des armes, dessinés après le monde.
  window.CanaanStages.drawWeaponEffects = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    // Direction et portée : indication légère, même sans lancer un sort.
    const type = currentWeaponType(),
      a = aim(),
      c = color[type] || '#b7d8ff';
    // À distance : la mire suit le curseur, jusqu'à la portée réelle de l'attaque de base.
    const r = BASIC_RANGE[type]
      ? Math.max(120, Math.min(BASIC_RANGE[type], Math.hypot(mouseWorldX - P.x, mouseWorldY - P.y)))
      : type === 'aegis' || type === 'greataxe'
        ? 135
        : 125;
    // Ligne pointillée et cercle au bout, sans cône plein (trop intense une fois allongé).
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
    ctx.globalAlpha = 1;
    // Marque du chasseur : réticule doré au-dessus de la proie (chez l'hôte).
    const t = time / 60;
    for (const m of game.world.monsters)
      if (m.hp > 0 && m._huntMark && m._huntMark.until > t) CANAAN_VFX.drawMark(ctx, m, time);
    // Sols persistants (en dessous), puis effets, puis particules.
    for (const e of vfx) if (CANAAN_VFX.isGround(e.shape)) CANAAN_VFX.draw(ctx, e);
    for (const e of vfx) if (!CANAAN_VFX.isGround(e.shape)) CANAAN_VFX.draw(ctx, e);
    CANAAN_VFX.drawParticles(ctx);
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
      document.activeElement === chatInput ||
      document.getElementById('dialog').style.display === 'block'
    )
      return null;
    const type = currentWeaponType();
    if (!WEAPON_DEFINITIONS[type]) {
      if (!game.hero.classe?.id) toast(tt('Choisis d’abord ta classe (T).'));
      return null;
    }
    if (type !== activeWeaponType) refreshWeaponBar();
    const s = SKILLS[i],
      key = type + ':' + i;
    if (!s || (weaponCooldowns[key] || 0) > 0) return null;
    const cost = window.CANAAN_CLASS_MANA_COST(type, i, s.mp);
    // Ressource de la classe (mana, Énergie, Ferveur, Rythme, Concentration, Rage), ou PV pour le Berserker.
    if (!window.CANAAN_CLASS_PAY(cost)) {
      toast(RESOURCES[CANAAN_CLASS.resource(game.hero)].lack);
      return null;
    }
    // La Célérité (et les talents) réduit le verrou réel, également utilisé par l'affichage.
    const recovery = Math.max(0, Math.min(80, stats().cooldownReduction || 0));
    weaponCooldowns[key] = s.max * (1 - recovery / 100) * CANAAN_ARTEFACTS.cooldownFactor();
    s.cd = weaponCooldowns[key];
    castContext = window.CANAAN_CLASS_CAST(type, i);
    // Artéfacts de l'Arène : Cœur de Cendres renforce les compétences.
    castContext = CANAAN_ARTEFACTS.onCast(type, i, key, castContext);
    return type;
  }

  // Attaque de base : gratuite (aucun mana), clic gauche rapide et clic droit lourd.
  // Maintenir le bouton enchaîne les attaques ; un verrou commun empêche de cumuler les deux.
  const BASIC = Object.freeze({
    quick: { mult: 0.75, lock: 0.55 },
    heavy: { mult: 1.6, lock: 1.15 }
  });
  const basicHeld = { left: false, right: false };
  let basicLock = 0,
    clientX = null,
    clientY = null;
  // Simulation : le héros peut-il frapper maintenant ?
  function basicReady() {
    return basicLock <= 0 && started && !paused && !P.dead && playerStun <= 0;
  }
  // Interface : le chat ou un dialogue ouvert empêche d'attaquer à la souris (une fenêtre du jeu, non).
  function uiBlocked() {
    return (
      document.activeElement === chatInput || document.getElementById('dialog').style.display === 'block'
    );
  }
  // Attaque déclenchée par l'interface (clic, bouton tactile).
  function basicAttack(heavy = false) {
    if (game.mode === 'guest') return !uiBlocked() && CANAAN_NET.requestAttack(heavy);
    if (!basicReady() || uiBlocked()) return false;
    return performBasic(heavy);
  }
  // Forme de l'attaque de base du lanceur courant (l'hôte ou un allié, voir withActor) : la rapide frappe une
  // fois, la lourde a sa propre animation selon l'arme. m : part de la Puissance de la frappe.
  function basicStrike(type, heavy, m) {
    const col = color[type] || '#e8eef4',
      a = aim(),
      range = BASIC_RANGE[type];
    // Repli tactique (Chasseur) : la flèche qui suit une roulade fait +60 %.
    if (S.rollShot > 0 && type === 'bow') {
      S.rollShot = 0;
      m *= 1.6;
    }
    // Tirs successifs : le premier part tout de suite, les suivants toutes les gap secondes.
    const salvo = (n, gap, shoot) => {
      for (let k = 0; k < n; k++) k ? later(k * gap, () => shoot(k)) : shoot(0);
    };
    switch (type) {
      case 'bow': {
        const barbed = talent('chasseur', 'barbed')
          ? { onHit: tgt => bleed(tgt, 4, power() * m * 0.0625) }
          : {};
        if (!heavy) {
          projectile(a, m, col, { speed: 15, range, ...barbed });
          // Multitir : 25 % de chance de décocher une seconde flèche.
          if (talent('chasseur', 'multishot') && Math.random() < 0.25)
            later(0.08, () => projectile(a + 0.05, m, col, { speed: 15, range, flash: false, ...barbed }));
          return;
        }
        // Rafale : cinq flèches (sept avec Multitir) en léger éventail.
        const n = talent('chasseur', 'multishot') ? 7 : 5;
        return salvo(n, 0.06, k =>
          projectile(a + (k - (n - 1) / 2) * 0.045, (m * 1.3) / n, col, {
            speed: 18,
            range: range + 60,
            flash: !k,
            ...barbed
          })
        );
      }
      case 'staff':
        // Trait de feu ; la lourde : une comète élémentaire qui explose.
        if (!heavy) return projectile(a, m, '#ffb050', { mag: true, speed: 13, range, kind: 'ember' });
        return projectile(a, m, '#ff7a2a', {
          mag: true,
          speed: 10,
          range,
          kind: 'fireball',
          size: 18,
          splash: 75,
          blast: 'flames'
        });
      case 'wildstaff':
        // Graine épineuse ; la lourde : trois épines en éventail qui ralentissent.
        if (!heavy) return projectile(a, m, col, { mag: true, speed: 13, range, kind: 'thorn' });
        return salvo(3, 0, k =>
          projectile(a + (k - 1) * 0.16, m * 0.42, col, {
            mag: true,
            speed: 12,
            range,
            kind: 'thorn',
            flash: !k,
            onHit: tgt => CANAAN_CLASS.slow(actor, tgt, 0.25, 1.5, 'nature')
          })
        );
      case 'grimoire':
        if (!heavy) return projectile(a, m, col, { mag: true, speed: 13, range });
        // Rafale de peste : cinq crachats toxiques en gerbe.
        return salvo(5, 0.06, k =>
          projectile(a + [-0.09, 0.05, -0.02, 0.08, -0.05][k], m * 0.26, col, {
            mag: true,
            speed: 11,
            range,
            kind: 'plague',
            size: 11,
            flash: !k
          })
        );
      case 'lute':
        if (!heavy) return projectile(a, m, col, { mag: true, speed: 12, range, kind: 'note' });
        // Accord : trois notes en éventail.
        return salvo(3, 0, k =>
          projectile(a + (k - 1) * 0.2, m * 0.5, col, {
            mag: true,
            speed: 12,
            range,
            kind: 'note',
            flash: !k
          })
        );
      case 'greataxe':
        if (!heavy) return cone(140, Math.PI * 0.6, m, null, a, 'heavySlash');
        // Moulinet : la grande hache fait le tour du héros et fend le sol.
        circle(140, m, null, 'whirl');
        effect('slam', AP.x, AP.y, a, 155, Math.PI * 0.9, col, 0.6);
        return;
      case 'aegis':
        // Coup de masse ; la lourde : coup de bouclier qui repousse, puis la masse qui écrase.
        if (!heavy) return cone(125, Math.PI / 2, m, null, a, 'maceSmash');
        cone(120, Math.PI * 0.7, m * 0.45, tgt => !isBoss(tgt) && pushAway(tgt, 30), a, 'shieldBash');
        later(0.18, () => {
          cone(140, Math.PI * 0.7, m * 0.55, null, a, 'maceSmash');
          effect('slam', AP.x, AP.y, a, 145, Math.PI * 0.7, '#ffe4a2', 0.5);
        });
        return;
      case 'feline':
        // Coup de griffe ; la lourde : bond court et double griffure.
        if (!heavy) return cone(110, Math.PI / 2, m, null, a, 'claws');
        dash(46, a, 'pounceTrail');
        return salvo(2, 0.1, k => cone(120, Math.PI * 0.6, m * 0.5, null, a + (k ? 0.25 : -0.25), 'claws'));
      case 'dualsword': {
        // Ambidextrie : la seconde lame frappe à 40 %.
        const twin = talent('guerrier', 'ambidextrous');
        if (!heavy) {
          cone(115, Math.PI / 2, m, null, a, 'twinSlash');
          if (twin) later(0.1, () => cone(115, Math.PI / 2, m * 0.4, null, a + 0.2, 'twinSlash'));
          return;
        }
        // Tourbillon : les deux lames tournent autour du héros.
        circle(125, m, null, 'whirl');
        if (twin) later(0.14, () => circle(125, m * 0.4, null, 'whirl'));
        return;
      }
      case 'dualdagger':
        if (!heavy) return cone(115, Math.PI / 2, m, null, a, 'daggerSlash');
        // Estocades : trois coups de dague rapides, à gauche, au centre puis à droite.
        return salvo(3, 0.08, k => linear(140, 16, m * 0.36, null, a + (k - 1) * 0.22, 'stab'));
      default:
        // Sans classe : un coup de poing.
        return cone(80, Math.PI / 2, m * 0.6, null, a, 'arc');
    }
  }
  // Attaque de base dans la simulation, sans aucun accès à l'écran.
  function performBasic(heavy) {
    if (!basicReady()) return false;
    const type = currentWeaponType(),
      spec = heavy ? BASIC.heavy : BASIC.quick;
    // Célérité, forme féline, Rugissement, Élan… : attaques de base plus rapides.
    basicLock =
      spec.lock *
      (1 - Math.min(60, characterStats().haste || 0) / 100) *
      window.CANAAN_CLASS_BASIC_LOCK() *
      (S.roar > 0 ? 0.7 : 1);
    withActor(game.hero, () =>
      withCastContext({ magic: MAGIC_WEAPONS.includes(type), basic: true }, () =>
        basicStrike(type, heavy, spec.mult)
      )
    );
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
  // Visée sans souris (stick droit de la manette) : un point de l'écran, comme le curseur ; la souris reprend la main
  // dès qu'elle bouge.
  function aimBasicAttack(x, y) {
    clientX = x;
    clientY = y;
    mouseWorldX = x + camX;
    mouseWorldY = y + camY;
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
    const type = CANAAN_CLASS.weaponType(hero),
      spec = heavy ? BASIC.heavy : BASIC.quick,
      st = characterStats(hero),
      stance = skillStateOf(hero);
    p.basicLock =
      spec.lock *
      (1 - Math.min(60, st.haste || 0) / 100) *
      window.CANAAN_CLASS_BASIC_LOCK(hero) *
      (stance.roar > 0 ? 0.7 : 1);
    withActor(hero, () =>
      withCastContext({ magic: MAGIC_WEAPONS.includes(type), basic: true }, () =>
        basicStrike(type, heavy, spec.mult)
      )
    );
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

  // Compétence de l'hôte : barre, mana, recharges affichées, talents de classe et artéfacts.
  function useSkill(i) {
    // Un invité demande la compétence à l'hôte, qui la lance avec ses statistiques.
    if (game.mode === 'guest') return CANAAN_NET.requestSkill(i);
    const type = spend(i);
    if (!type) return;
    castSkill(type, i);
  }
  // Compétence d'un allié : son arme (ou ses griffes), sa ressource, ses propres recharges (réduites par sa Célérité).
  function skillSpec(hero, i) {
    const type = CANAAN_CLASS.weaponType(hero),
      spec = WEAPON_DEFINITIONS[type]?.sp?.[i];
    if (!spec) return null;
    // Coût réel : réductions des talents du héros.
    const cost = window.CANAAN_CLASS_MANA_COST(type, i, spec[4], hero);
    return { type, key: type + ':' + i, cooldown: spec[3], mana: spec[4], cost };
  }
  function skillReady(hero, i) {
    if (hero === game.hero) return false;
    const spec = skillSpec(hero, i);
    return (
      !!spec &&
      !hero.player.dead &&
      (skillStateOf(hero).cooldowns[spec.key] || 0) <= 0 &&
      window.CANAAN_CLASS_CAN_PAY(spec.cost, hero)
    );
  }
  function heroUseSkill(hero, i) {
    if (hero === game.hero) return useSkill(i);
    if (!started || paused || !skillReady(hero, i)) return false;
    const spec = skillSpec(hero, i),
      recovery = Math.max(0, Math.min(80, characterStats(hero).cooldownReduction || 0));
    if (!window.CANAAN_CLASS_PAY(spec.cost, hero)) return false;
    skillStateOf(hero).cooldowns[spec.key] =
      spec.cooldown * (1 - recovery / 100) * CANAAN_ARTEFACTS.cooldownFactor(hero);
    // Talents de classe (élément, compteurs…) et artéfacts de l'Arène (Cœur de Cendres) du lanceur.
    const context = CANAAN_ARTEFACTS.onCast(
      spec.type,
      i,
      spec.key,
      window.CANAAN_CLASS_CAST(spec.type, i, hero),
      hero
    );
    return withActor(hero, () => {
      castContext = context;
      castSkill(spec.type, i);
      return true;
    });
  }
  // Les 40 compétences, pour le lanceur courant (l'hôte, ou un allié via heroUseSkill).
  // Les valeurs suivent le catalogue (shared/data/equipment.js) : la puissance affichée est celle infligée.
  function castSkill(type, i) {
    runSkill(type, i);
    window.CANAAN_CLASS_AFTER_CAST(type, i, actor);
    canaanAchieve(actor, 'skill', type);
  }
  function runSkill(type, i) {
    const a = aim();
    const col = ELEMENTS[castContext.element]?.color || color[type];
    const rep = (n, interval, fn) => {
      for (let j = 0; j < n; j++) later(j * interval, () => fn(j));
    };
    switch (type) {
      // ------------------------------------------------------------ Druide : bâton sylvestre
      case 'wildstaff':
        if (i === 0) {
          // Fouet de ronces : liane en ligne, ralentit (Ronces vivaces : immobilise et fait saigner).
          const vivid = talent('druide', 'thornlash');
          linear(
            TS * 6,
            24,
            2.4,
            m => {
              if (vivid) {
                root(m, 1.5);
                CANAAN_CLASS.dot(actor, m, 'thorns', 4, magPower() * 2.4 * 0.4, 'nature');
              } else CANAAN_CLASS.slow(actor, m, 0.4, 2, 'nature');
            },
            a,
            'vineLash',
            true
          );
        }
        if (i === 1) {
          // Floraison : fleur de vie sous la souris (Floraison éternelle : +4 s, +50 %, éclosion finale).
          const eternal = talent('druide', 'bloom'),
            { x, y } = groundTarget(),
            life = eternal ? 12 : 8,
            r = TS * 3;
          S.bloom = life;
          float(x, y - 50, '🌸 FLORAISON', '#ffc8e8');
          addZone(
            'bloom',
            x,
            y,
            r,
            life,
            1,
            z => {
              for (const h of groupNear(3, z.x, z.y))
                healHero(h, h.player.mhp * 0.03 * (eternal ? 1.5 : 1), '#b8ffb0');
            },
            eternal
              ? z => {
                  effect('petals', z.x, z.y, 0, z.r, 0, '#ffc8e8', 1);
                  for (const h of groupNear(3, z.x, z.y)) healHero(h, h.player.mhp * 0.1, '#b8ffb0');
                }
              : null,
            '#ffb8e0'
          );
        }
        if (i === 2) {
          // Spores toxiques : nuage 5 s (Spores virulentes : plus grand, ralentit plus, se propage aux morts).
          const virulent = talent('druide', 'spores'),
            { x, y } = groundTarget();
          const cloud = (cx, cy, life) =>
            addZone(
              'spores',
              cx,
              cy,
              TS * 2.5 * (virulent ? 1.3 : 1),
              life,
              1,
              z => {
                for (const m of around(z.x, z.y, z.r)) {
                  dmg(m, 0.7, true);
                  CANAAN_CLASS.slow(actor, m, virulent ? 0.4 : 0.2, 1.2, 'nature');
                  if (virulent && m.hp <= 0 && !m._sporeBurst) {
                    m._sporeBurst = true;
                    later(0.05, () => cloud(m.x, m.y, 3));
                  }
                }
              },
              null,
              '#9ad84a'
            );
          cloud(x, y, 5);
        }
        if (i === 3) {
          // Courroux de la forêt : vagues de racines de plus en plus loin (Colère des anciens : une de plus, +25 %
          // contre les ennemis empoisonnés).
          const wrath = talent('druide', 'wrath'),
            waves = wrath ? 4 : 3,
            x0 = AP.x,
            y0 = AP.y;
          rep(waves, 0.22, k => {
            const d = TS * (1.4 + k * 1.5),
              x = x0 + Math.cos(a) * d,
              y = y0 + Math.sin(a) * d;
            effect('roots', x, y, a, TS * 1.6, 0, '#7ee36a', 0.9);
            for (const m of around(x, y, TS * 1.6)) {
              dmg(m, 1.7 * (wrath && CANAAN_CLASS.poisoned(actor, m) ? 1.25 : 1), true);
              root(m, 1.5);
            }
          });
        }
        break;
      // ------------------------------------------------------------ Druide : forme féline
      case 'feline':
        if (i === 0) {
          // Lacération : deux griffures, la seconde fait saigner (Griffes sanglantes : +40 %).
          const deep = talent('druide', 'bleeds') ? 1.4 : 1;
          rep(2, 0.12, j =>
            cone(
              115,
              Math.PI / 2,
              1.2,
              m => j === 1 && bleed(m, 5, power() * 0.3 * deep),
              a + (j ? 0.2 : -0.2),
              'claws'
            )
          );
        }
        if (i === 1) {
          // Bond du prédateur : saut jusqu'à la souris, griffes à l'atterrissage, étourdit les monstres.
          const spot = groundTarget();
          dash(Math.min(TS * 5, Math.hypot(spot.x - AP.x, spot.y - AP.y)), a, 'pounceTrail');
          circle(TS * 1.8, 2.2, m => stun(m, 1), 'pounceLand');
        }
        if (i === 2) {
          // Rugissement sauvage : 8 % des PV et attaques de base plus rapides et plus fortes 6 s.
          S.roar = 6;
          const h = healActor(AP.mhp * 0.08);
          if (h > 0) float(AP.x, AP.y - 40, '+' + h + ' PV', '#b8ffb0');
          effect('roar', AP.x, AP.y, a, TS * 4, 0, '#c8f59a', 0.7);
          float(AP.x, AP.y - 62, '🐆 RUGISSEMENT', '#c8f59a');
        }
        if (i === 3) {
          // Morsure féroce : 650 % sur une cible qui saigne ; Griffes sanglantes consume les saignements.
          const consume = talent('druide', 'bleeds');
          arc(125, a, Math.PI / 2.4, '#ff6a7a', 'bite');
          for (const m of targets(125, a, Math.PI / 2.4)) {
            const bleeding = m.v1746_bleed > 0 || CANAAN_CLASS.bleeding(m);
            dmg(m, bleeding ? 6.5 : 4.5);
            if (bleeding && consume && m.hp > 0 && m.v1746_bleed > 0) {
              const rest = Math.round(m.v1746_bleed * (m.v1746_bleedPower || 2) * 1.5);
              m.v1746_bleed = 0;
              strike(m, rest, { ...castContext, effect: true });
              effect('bloodSplash', m.x, m.y - 10, 0, 40, 0, '#d0303f', 0.5);
            }
          }
        }
        break;
      // ------------------------------------------------------------ Paladin : masse et égide
      case 'aegis':
        if (i === 0) {
          // Frappe du croisé : coup de masse sacré qui soigne (Croisade : la 3e en 10 s libère une onde).
          cone(130, Math.PI / 2, 2.8, null, a, 'holySmite');
          let rate = 0.03;
          if (talent('paladin', 'crusade')) {
            const t = time / 60;
            S.crusade = t < S.crusadeUntil ? S.crusade + 1 : 1;
            S.crusadeUntil = t + 10;
            if (S.crusade >= 3) {
              S.crusade = 0;
              rate = 0.06;
              float(AP.x, AP.y - 64, '☀️ CROISADE', '#ffd76a');
              CANAAN_CLASS.blast(actor, AP.x, AP.y, 3, stats().attack * 2, 'holy');
            }
          }
          const h = healActor(AP.mhp * rate);
          if (h > 0) float(AP.x, AP.y - 40, '+' + h + ' PV', '#ffe9a0');
        }
        if (i === 1) {
          // Charge du bouclier : ruée de 5 cases qui étourdit (Bouclier vengeur : l'égide rebondit sur 3 ennemis).
          const start = dash(TS * 5, a, 'shieldCharge');
          for (const m of pathTargets(start, a)) {
            dmg(m, 2.2);
            stun(m, 1.2);
          }
          if (talent('paladin', 'avenger')) {
            let from = { x: AP.x, y: AP.y };
            const struck = new Set();
            for (let k = 0; k < 3; k++) {
              const next = nearestTo(from.x, from.y, TS * 6, struck);
              if (!next) break;
              struck.add(next);
              const hop = from;
              later(0.12 * (k + 1), () => {
                effect(
                  'shieldThrow',
                  hop.x,
                  hop.y,
                  Math.atan2(next.y - hop.y, next.x - hop.x),
                  Math.hypot(next.x - hop.x, next.y - hop.y),
                  14,
                  '#ffe4a2',
                  0.3
                );
                dmg(next, 1.5);
              });
              from = { x: next.x, y: next.y };
            }
          }
        }
        if (i === 2) {
          // Rempart sacré : −35 % de dégâts 6 s (Bastion : 8 s) et bouclier de 12 % au groupe proche.
          S.shieldGuard = talent('paladin', 'bastion') ? 8 : 6;
          for (const h of groupNear(6)) CANAAN_CLASS.giveShield(h, h.player.mhp * 0.12, 6, '🏰 Bouclier');
          effect('aegisWall', AP.x, AP.y, a, TS * 2, 0, '#ffe4a2', 1.2);
          float(AP.x, AP.y - 65, '🏰 REMPART SACRÉ', '#ffe4a2');
        }
        if (i === 3) {
          // Marteau du Jugement : marteau de lumière sous la souris, puis sol consacré (Sentence, Terre sainte).
          const { x, y } = groundTarget(),
            sentence = talent('paladin', 'sentence'),
            life = talent('paladin', 'holyground') ? 8 : 5,
            r = TS * 2.5;
          effect('holyHammer', x, y, 0, r, 0, '#ffe08a', 0.75);
          later(0.35, () => {
            for (const m of around(x, y, r)) {
              const low = m.hp / m.mhp < 0.35;
              if (sentence && !isBoss(m) && m.hp / m.mhp < 0.1) {
                float(m.x, m.y - 60, '⚖️', '#ffd76a');
                strike(m, m.hp * 10, { ...castContext, effect: true });
                continue;
              }
              dmg(m, 5 * (sentence && low ? 1.6 : 1));
            }
            addZone(
              'consecrated',
              x,
              y,
              r,
              life,
              1,
              z => {
                for (const m of around(z.x, z.y, z.r)) dmg(m, 0.5, true);
                for (const h of groupNear(2.5, z.x, z.y)) healHero(h, h.player.mhp * 0.03, '#ffe9a0');
              },
              null,
              '#ffd76a'
            );
          });
        }
        break;
      // ------------------------------------------------------------ Assassin : dagues jumelles
      case 'dualdagger':
        if (i === 0) {
          // Entaille : deux coups, le second fait saigner (Venin paralysant : ralentit ; Lame fantôme : un double).
          const crippling = talent('assassin', 'crippling');
          const slashes = (mult, shape) =>
            rep(2, 0.11, j =>
              cone(
                110,
                Math.PI / 2,
                1.2 * mult,
                m => {
                  if (j !== 1) return;
                  bleed(m, 5, power() * 0.35 * mult);
                  if (crippling) CANAAN_CLASS.slow(actor, m, 0.4, 3, 'shadow');
                },
                a + (j ? 0.2 : -0.2),
                shape
              )
            );
          slashes(1, 'daggerSlash');
          if (talent('assassin', 'phantom')) later(0.25, () => slashes(0.4, 'phantomSlash'));
        }
        if (i === 1) {
          // Pas de l'ombre : téléportation dans le dos de l'ennemi le plus proche de la souris (6 cases au plus).
          const spot = groundTarget(),
            target = nearestTo(spot.x, spot.y, TS * 6),
            from = { x: AP.x, y: AP.y };
          let to = null;
          if (target) {
            const away = Math.atan2(target.y - AP.y, target.x - AP.x);
            for (const gap of [46, 34, 22, 0]) {
              const x = target.x + Math.cos(away) * gap,
                y = target.y + Math.sin(away) * gap;
              if (canWalk(x, y)) {
                to = { x, y };
                break;
              }
            }
          }
          effect('shadowStep', from.x, from.y, 0, 34, 0, '#c48cff', 0.6);
          if (to) {
            AP.x = to.x;
            AP.y = to.y;
          } else dash(TS * 5, a, 'shadowTrail');
          effect('shadowStep', AP.x, AP.y, 0, 34, 0, '#c48cff', 0.6);
          const assassinate = talent('assassin', 'assassinate');
          S.shadow = 4;
          S.shadowMult = assassinate ? 2 : 1.6;
          if (assassinate && target) target._assassinBy = { hero: actor, until: time / 60 + 3 };
          float(AP.x, AP.y - 42, assassinate ? 'PROCHAIN COUP +100 %' : 'PROCHAIN COUP +60 %', '#e5a7ff');
        }
        if (i === 2) {
          // Éventail de lames : dagues en éventail qui font saigner (Lames jumelles : 8 dagues qui reviennent).
          const twin = talent('assassin', 'fan'),
            n = twin ? 8 : 5,
            spread = twin ? 0.9 : 0.6;
          for (let k = 0; k < n; k++)
            projectile(a + (k / (n - 1) - 0.5) * spread, 0.9, '#e5a7ff', {
              speed: 14,
              range: TS * 7,
              kind: 'dagger',
              flash: k === 0,
              onHit: m => {
                bleed(m, 4, power() * 0.2);
                if (twin)
                  later(0.3, () => {
                    if (m.hp <= 0) return;
                    effect(
                      'daggerReturn',
                      m.x,
                      m.y,
                      Math.atan2(AP.y - m.y, AP.x - m.x),
                      Math.hypot(AP.x - m.x, AP.y - m.y),
                      8,
                      '#e5a7ff',
                      0.3
                    );
                    dmg(m, 0.45);
                  });
              }
            });
        }
        if (i === 3) {
          // Mille coupures : 5 coups qui consument les saignements (Exécuteur : achève sous 15 % ; Lame fantôme).
          const execute = talent('assassin', 'executioner');
          const cuts = (mult, shape) =>
            rep(5, 0.1, j =>
              cone(
                115,
                Math.PI / 2,
                0.85 * mult,
                m => {
                  if (m.hp <= 0) return;
                  if (execute && !isBoss(m) && m.hp / m.mhp < 0.15) {
                    float(m.x, m.y - 60, '💀', '#c48cff');
                    strike(m, m.hp * 10, { ...castContext, effect: true });
                    return;
                  }
                  if (m.v1746_bleed > 0) {
                    const remaining = m.v1746_bleed,
                      pw = m.v1746_bleedPower || 2,
                      by = m.v1746_bleedBy;
                    m.v1746_bleed = 0;
                    const burstDmg = Math.round(remaining * pw * 1.5);
                    if (by && by !== game.hero && game.heroes.includes(by)) canaanHeroStrike(m, burstDmg, by);
                    else hit(m, burstDmg);
                    effect('bloodSplash', m.x, m.y - 10, 0, 40, 0, '#d0303f', 0.5);
                  }
                },
                a + (j % 2 ? 0.25 : -0.25),
                shape
              )
            );
          cuts(1, 'daggerSlash');
          if (talent('assassin', 'phantom')) later(0.3, () => cuts(0.4, 'phantomSlash'));
        }
        break;
      // ------------------------------------------------------------ Élémentaliste : bâton élémentaire
      case 'staff':
        if (i === 0) {
          // Boule de feu : explose à l'impact (Combustion : trois flammèches vers les ennemis proches).
          const combustion = talent('elementaliste', 'combustion');
          projectile(a, 2.6, '#ff7a2a', {
            mag: true,
            speed: 11,
            kind: 'fireball',
            size: 16,
            splash: TS * 1.5,
            blast: 'flames',
            onHit: m => {
              if (!combustion) return;
              const struck = new Set([m]);
              for (let k = 0; k < 3; k++) {
                const o = nearestTo(m.x, m.y, TS * 12, struck);
                if (!o || Math.hypot(o.x - m.x, o.y - m.y) > TS * 5) break;
                struck.add(o);
                projectile(Math.atan2(o.y - m.y, o.x - m.x), 0.6, '#ffb050', {
                  mag: true,
                  speed: 12,
                  kind: 'ember',
                  from: { x: m.x, y: m.y },
                  range: TS * 6,
                  flash: false
                });
              }
            }
          });
        }
        if (i === 1) {
          // Nova de givre : gèle autour de toi (Hiver éternel : 2,5 s et sol de glace).
          const winter = talent('elementaliste', 'winter');
          circle(TS * 3, 1.9, m => freeze(m, winter ? 2.5 : 1.5), 'frostNova', true);
          if (winter)
            addZone(
              'iceGround',
              AP.x,
              AP.y,
              TS * 3,
              4,
              0.5,
              z => {
                for (const m of around(z.x, z.y, z.r)) CANAAN_CLASS.slow(actor, m, 0.5, 0.7, 'ice');
              },
              null,
              '#bfeaff'
            );
        }
        if (i === 2) {
          // Chaîne d'éclairs : l'ennemi le plus proche de la souris, puis 4 rebonds (Conducteur : 7, sans perte).
          const conductor = talent('elementaliste', 'conductor'),
            spot = groundTarget(),
            struck = new Set();
          let prev = { x: AP.x, y: AP.y - 20 },
            target = nearestTo(spot.x, spot.y, TS * 9),
            factor = 1;
          if (!target) effect('lightning', prev.x, prev.y, a, TS * 6, 0, '#f4f07a', 0.3);
          for (let k = 0; target && k <= (conductor ? 7 : 4); k++) {
            const tgt = target,
              from = prev,
              f = factor;
            struck.add(tgt);
            later(k * 0.07, () => {
              effect(
                'lightning',
                from.x,
                from.y,
                Math.atan2(tgt.y - 16 - from.y, tgt.x - from.x),
                Math.hypot(tgt.x - from.x, tgt.y - 16 - from.y),
                0,
                '#f4f07a',
                0.35
              );
              dmg(tgt, 2.6 * f, true);
            });
            prev = { x: tgt.x, y: tgt.y - 16 };
            factor *= conductor ? 1 : 0.85;
            target = nearestTo(tgt.x, tgt.y, TS * 30, struck);
            if (target && Math.hypot(target.x - tgt.x, target.y - tgt.y) > TS * 5) target = null;
          }
        }
        if (i === 3) {
          // Météore : tombe 0,8 s plus tard sous la souris, puis le sol brûle (Météore jumeau : un second).
          const { x, y } = groundTarget(),
            fall = (fx, fy, mult) => {
              effect('meteor', fx, fy, 0, TS * 2.5, 0, '#ff7a2a', 0.8);
              later(0.8, () => {
                effect('flames', fx, fy, 0, TS * 2.5, 0, '#ff7a2a', 0.9);
                effect('crater', fx, fy, 0, TS * 1.6, 0, '#3a2418', 4);
                area(fx, fy, TS * 2.5, 6 * mult, null, true);
                addZone(
                  'burnGround',
                  fx,
                  fy,
                  TS * 2.2,
                  4,
                  1,
                  z => {
                    for (const m of around(z.x, z.y, z.r)) dmg(m, 0.4 * mult, true);
                  },
                  null,
                  '#ff7a2a'
                );
              });
            };
          fall(x, y, 1);
          if (talent('elementaliste', 'twin'))
            later(0.6, () => fall(x + Math.cos(a + 1.6) * TS * 1.8, y + Math.sin(a + 1.6) * TS * 1.8, 0.6));
        }
        break;
      // ------------------------------------------------------------ Barde : luth
      case 'lute':
        if (i === 0) {
          // Note éclatante : la note frappe, l'allié le plus blessé est soigné (Note perçante : traverse, 6 %).
          const piercing = talent('barde', 'piercing');
          projectile(a, 2.4, col, {
            mag: true,
            speed: 13,
            kind: 'note',
            size: 12,
            pierce: piercing,
            range: TS * 14
          });
          const hurt = groupNear(8)
            .filter(h => h.player.hp < h.player.mhp)
            .sort((x, y) => x.player.hp / x.player.mhp - y.player.hp / y.player.mhp)[0];
          if (hurt) healHero(hurt, hurt.player.mhp * (piercing ? 0.06 : 0.04));
        }
        if (i === 1)
          circle(
            140,
            1.9,
            m => {
              if (!isBoss(m)) pushAway(m, 40);
            },
            'soundwave',
            true
          );
        if (i === 2) {
          // Chant de guérison : 12 % tout de suite, puis 2 % par seconde pendant 5 s (Ballade : 8 s).
          const ticks = talent('barde', 'ballad') ? 8 : 5;
          effect('healSong', AP.x, AP.y, 0, TS * 6, 0, '#ffc2e4', 1.2);
          float(AP.x, AP.y - 48, '💗 CHANT DE GUÉRISON', '#ffc2e4');
          for (const h of groupNear(6)) healHero(h, h.player.mhp * 0.12);
          rep(ticks, 1, () => {
            for (const h of groupNear(6)) healHero(h, h.player.mhp * 0.02);
          });
        }
        if (i === 3) {
          // Symphonie : 5 ondes en 2 s là où tu vises (Grand final : un accord final à 300 % qui soigne 15 %).
          const { x, y } = groundTarget(),
            r = TS * 3,
            finale = talent('barde', 'finale');
          effect('symphony', x, y, 0, r, 0, col, 2.4);
          float(x, y - 60, '🎶 SYMPHONIE', '#ffc2e4');
          rep(5, 0.5, () => {
            effect('soundwave', x, y, 0, r, 0, col, 0.5);
            area(x, y, r, 1, null, true);
            for (const h of groupNear(3, x, y)) healHero(h, h.player.mhp * 0.02);
          });
          if (finale)
            later(2.6, () => {
              effect('finale', x, y, 0, r * 1.2, 0, '#ff9ad5', 0.8);
              float(x, y - 70, '🎶 GRAND FINAL', '#ff9ad5');
              area(x, y, r * 1.2, 3, null, true);
              for (const h of groupNear(6)) healHero(h, h.player.mhp * 0.15);
            });
        }
        break;
      // ------------------------------------------------------------ Chasseur : arc long
      case 'bow':
        if (i === 0) {
          // Tir perçant : traverse tout (Tir de précision : +40 % sur la proie marquée, critique de loin).
          const aimed = talent('chasseur', 'aimed'),
            shot = S.rollShot > 0 ? 1.6 : 1;
          S.rollShot = 0;
          const ownMark = m => m._huntMark?.by === actor && m._huntMark.until > time / 60;
          projectile(a, 3 * shot, '#e8c27a', {
            speed: 19,
            range: TS * 14,
            kind: 'heavyArrow',
            size: 12,
            pierce: true,
            scale: m => (aimed && ownMark(m) ? 1.4 : 1),
            contextFor: m => ({
              ...castContext,
              forceCrit: aimed && Math.hypot(m.x - AP.x, m.y - AP.y) > TS * 8
            })
          });
        }
        if (i === 1) {
          // Marque du chasseur : la proie la plus proche de la souris subit plus de dégâts (Proie désignée : +25 %).
          const spot = groundTarget(),
            target = nearestTo(spot.x, spot.y, TS * 14);
          if (!target) {
            float(AP.x, AP.y - 50, tt('Aucune proie en vue'), '#e8c27a');
            break;
          }
          for (const m of game.world.monsters) if (m._huntMark?.by === actor) m._huntMark = null;
          target._huntMark = {
            by: actor,
            until: time / 60 + 12,
            pct: talent('chasseur', 'prey') ? 0.25 : 0.15
          };
          S.huntMark = 12;
          effect('markCast', target.x, target.y - 20, 0, 40, 0, '#ffd27a', 0.8);
          float(target.x, target.y - 62, '🎯 PROIE MARQUÉE', '#ffd27a');
        }
        if (i === 2) {
          // Volée de flèches : salves sur la zone visée (Pluie torrentielle : 6 salves, ralentit).
          const torrent = talent('chasseur', 'torrent'),
            { x, y } = groundTarget(),
            r = 115;
          effect('rainMark', x, y, 0, r, 0, '#e8c27a', torrent ? 3.2 : 2.2);
          rep(torrent ? 6 : 4, 0.5, () => {
            effect('arrowRain', x, y, 0, r, 0, '#e8c27a', 0.6);
            area(x, y, r, 0.9, m => torrent && CANAAN_CLASS.slow(actor, m, 0.4, 1.5, 'wild'));
          });
        }
        if (i === 3) {
          // Assaut du faucon : 5 serres en 2 s sur la proie (Fauconnier : il reste ensuite 8 s).
          const spot = groundTarget();
          let target = nearestTo(spot.x, spot.y, TS * 14);
          effect('hawkDive', AP.x, AP.y - 30, a, 0, 0, '#e8c27a', 0.5);
          rep(5, 0.4, () => {
            if (!target || target.hp <= 0) target = nearestTo(target?.x ?? AP.x, target?.y ?? AP.y, TS * 14);
            if (!target) return;
            effect('hawk', target.x, target.y - 10, Math.random() * 6.28, 38, 0, '#e8c27a', 0.45);
            dmg(target, 1);
          });
          if (talent('chasseur', 'falconer')) {
            S.falcon = 10;
            S.falconTick = 2.2;
          }
        }
        break;
      // ------------------------------------------------------------ Guerrier : épées jumelles
      case 'dualsword':
        if (i === 0) {
          // Rafale de lames : 4 coups rapides (Lames affûtées : 6 coups qui font saigner).
          const honed = talent('guerrier', 'honed');
          S.combo = 4;
          rep(honed ? 6 : 4, 0.09, j =>
            cone(
              135,
              Math.PI / 3,
              0.8,
              m => honed && bleed(m, 4, power() * 0.8 * 0.3 * 0.25),
              a + (j % 2 ? 0.18 : -0.18),
              'twinSlash'
            )
          );
        }
        if (i === 1) {
          // Tempête d'acier : 6 tours en 1,5 s autour de toi (Œil du cyclone : 9 tours, attire les monstres).
          const cyclone = talent('guerrier', 'cyclone');
          S.combo = 4;
          rep(cyclone ? 9 : 6, 0.25, () => {
            if (cyclone)
              for (const m of around(AP.x, AP.y, TS * 4.5)) if (!isBoss(m)) pullTo(m, AP.x, AP.y, 22);
            circle(TS * 2.4, 0.6, null, 'bladeStorm');
          });
        }
        if (i === 2) {
          // Charge héroïque : ruée de 5 cases, +20 de Rage (Élan imparable : étourdit, 5 Élans).
          const unstoppable = talent('guerrier', 'unstoppable'),
            start = dash(TS * 5, a, 'chargeTrail');
          for (const m of pathTargets(start, a)) {
            dmg(m, 2);
            if (unstoppable) stun(m, 1.5);
          }
          AP.mp = Math.min(AP.mmp, AP.mp + 20);
          if (unstoppable) CANAAN_CLASS.addMomentum(actor, 5);
        }
        if (i === 3) {
          // Exécution croisée : 500 % (600 % en combo), ×1,5 sous 35 % (Coup de grâce : recharge remise à zéro).
          const boosted = S.combo > 0;
          let killed = false;
          arc(145, a, Math.PI / 2.2, '#e8f0ff', 'crossSlash');
          for (const m of targets(145, a, Math.PI / 2.2)) {
            dmg(m, (boosted ? 6 : 5) * (m.hp / m.mhp < 0.35 ? 1.5 : 1));
            if (m.hp <= 0) killed = true;
          }
          if (boosted) float(AP.x, AP.y - 60, 'COMBO !', '#e8f0ff');
          S.combo = 0;
          if (killed && talent('guerrier', 'coupdegrace')) {
            resetCooldown(actor, 'dualsword:3');
            float(AP.x, AP.y - 74, '⚔️ COUP DE GRÂCE', '#e8f0ff');
          }
        }
        break;
      // ------------------------------------------------------------ Berserker : grande hache (Relique)
      case 'greataxe':
        if (i === 0) {
          cone(150, Math.PI * 0.66, 3, null, a, 'heavySlash');
          effect('slam', AP.x, AP.y, a, 160, Math.PI * 0.66, col, 0.6);
        }
        if (i === 1) {
          // Bond du boucher : saut jusqu'à la souris (200 px au plus), impact qui étourdit (Boucherie : mare de sang,
          // recharge remise à zéro si un ennemi meurt).
          const spot = groundTarget(),
            butcher = talent('berserker', 'butcher');
          dash(Math.min(200, Math.hypot(spot.x - AP.x, spot.y - AP.y)), a, 'leapTrail');
          let killed = false;
          circle(
            125,
            2.4,
            m => {
              stun(m, 1);
              if (m.hp <= 0) killed = true;
            },
            'groundSmash'
          );
          if (butcher) {
            addZone(
              'bloodPool',
              AP.x,
              AP.y,
              TS * 2,
              4,
              1,
              z => {
                for (const m of around(z.x, z.y, z.r)) dmg(m, 0.6);
              },
              null,
              '#a01828'
            );
            if (killed) resetCooldown(actor, 'greataxe:1');
          }
        }
        if (i === 2) {
          // Hurlement sanguinaire : Rage (+25 % de dégâts, +15 % de dégâts subis) et ennemis proches affaiblis.
          S.berserk = 6;
          effect('roar', AP.x, AP.y, a, TS * 4, 0, col, 0.7);
          float(AP.x, AP.y - 42, '💢 HURLEMENT : DÉGÂTS +25 %', '#ff8a96');
          for (const m of around(AP.x, AP.y, TS * 4)) debuff(m, 'weak', 4);
        }
        if (i === 3) {
          // Châtiment du sang : 700 % sous 30 % de PV (Curée : consume les saignements).
          const low = AP.hp < AP.mhp * 0.3,
            hunger = talent('berserker', 'hunger');
          arc(155, a, Math.PI / 2, fxColor(), 'heavySlash');
          for (const m of targets(155, a, Math.PI / 2)) {
            dmg(m, low ? 7 : 4.5);
            if (hunger && m.hp > 0) CANAAN_CLASS.consumeBleeds(actor, m, 1.5);
          }
          if (low) float(AP.x, AP.y - 60, '💀 CHÂTIMENT 700 %', '#e0404f');
        }
        break;
      case 'grimoire':
        // Invocations (summons.js) : le lanceur, la compétence, son contexte (élément, bonus) et sa visée.
        window.CANAAN_SUMMONS.cast(actor, i, { ...castContext, magic: true }, { a, ...groundTarget() });
        AP.atk = 0.28;
        break;
    }
  }
  // Frénésie, Tempo… : recharges des compétences d'un héros réduites de seconds (l'hôte : celles de sa barre).
  function hasten(hero, seconds) {
    const cds = hero === game.hero ? weaponCooldowns : skillStateOf(hero).cooldowns;
    for (const key of Object.keys(cds)) cds[key] = Math.max(0, cds[key] - seconds);
  }
  // Puissance (Attaque ou magie) d'un héros, pour les dégâts estimés des info-bulles.
  function powerOf(hero, magic) {
    return withActor(hero, () => (magic ? magPower() : power()));
  }
  // Repli tactique (Chasseur) : la flèche qui suit une roulade est renforcée.
  function onDodge(hero) {
    if (CANAAN_CLASS.talent(hero, 'chasseur', 'disengage')) skillStateOf(hero).rollShot = 3;
  }
  Object.assign(window, {
    useSkill,
    canaanBasicAttack: basicAttack,
    canaanHoldBasicAttack: holdBasicAttack,
    canaanHeroBasicAttack: heroBasicAttack,
    canaanHeroUseSkill: heroUseSkill,
    CANAAN_SKILLS: Object.freeze({
      ready: skillReady,
      spec: skillSpec,
      state: skillStateOf,
      remoteEffect,
      ageEffects,
      fx: effect,
      hasten,
      resetCooldown,
      onDodge,
      zones: () => zones,
      power: powerOf
    }),
    CANAAN_BASIC_ATTACK: Object.freeze({
      spec: BASIC,
      lock: () => basicLock,
      held: () => ({ ...basicHeld }),
      wanted: wantedBasicAttack,
      aimAt: aimBasicAttack
    })
  });
})();
