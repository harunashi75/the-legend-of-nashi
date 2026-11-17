// Arène des Épreuves : douze vagues, un boss par vague, attaques annoncées au sol, un Rubis par victoire.
// Difficulté fixe : jamais adaptée au niveau. Seul le nombre de joueurs la changera (coopératif à venir).
(() => {
  'use strict';
  // Données partagées (shared/data/arena.js) ; la simulation et l'affichage restent ici.
  const WAVES = ARENA_WAVES,
    HP_MULT = ARENA_HP_MULT,
    DMG_MULT = ARENA_DMG_MULT,
    GROUP = ARENA_GROUP,
    BASE = ARENA_BASE,
    tempo = arenaTempo,
    TIERS = ARENA_TIERS,
    COLORS = ARENA_COLORS,
    BOSSES = ARENA_BOSSES;
  const PREP_FIRST = ARENA_TIMING.first,
    PREP_NEXT = ARENA_TIMING.next,
    RECOVERY = ARENA_TIMING.recovery;

  // ---------------------------------------------------------------- Records (sauvegardés)
  // Records de l'Arène : hero.arena (état sauvegardé de chaque héros ; l'hôte par défaut). La tentative en cours (run) reste ici.
  const records = (hero = game.hero) => hero.arena;
  window.CANAAN_ARENA_STATE = {
    export: () => ({ ...records() }),
    import(d) {
      const n = v => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
      game.hero.arena = {
        best: Math.min(WAVES, n(d?.best)),
        attempts: n(d?.attempts),
        completed: !!d?.completed,
        lastBoss: typeof d?.lastBoss === 'string' ? d.lastBoss.slice(0, 80) : '',
        pendingChoice: !!d?.pendingChoice
      };
    }
  };

  // ---------------------------------------------------------------- Tentative en cours
  let run = null;
  // Nombre de héros dans le colisée à l'arrivée du boss (1 à 4) : PV et dégâts du boss selon ARENA_GROUP.
  const players = () => Math.max(1, Math.min(4, inArena().length));
  // Réanimation : un allié debout à côté d'un héros à terre le relève en 3 secondes, à 30 % de ses PV.
  const REVIVE = Object.freeze({ seconds: 3, range: 70, hp: 0.3 });
  function newRun() {
    return {
      wave: 1,
      phase: 'enter',
      timer: PREP_FIRST,
      clock: 0,
      boss: null,
      fx: [],
      rings: [],
      hazards: [],
      shots: [],
      sweeps: [],
      flashes: [],
      timers: [],
      dots: [],
      gust: null,
      curse: new Map(),
      revives: new Map(),
      failed: false,
      rubisWon: 0,
      banner: null,
      cheerUntil: 0
    };
  }
  const layout = () => arenaLayout();
  // Tentative en cours : seulement dans le colisée (un chargement de partie ramène toujours au monde).
  const active = () => !!run && !!game.world.instance?.arena;
  const alive = () => active() && run.phase === 'fight' && !!run.boss && run.boss.hp > 0;
  const h = () => BASE.hit * run.dmgMult;
  function insideArena(x = P.x, y = P.y, margin = 30) {
    const L = layout();
    return Math.hypot(x - L.x, y - L.y) < L.r - margin;
  }
  function randomSpot(margin = 0.82) {
    const L = layout(),
      a = Math.random() * Math.PI * 2,
      d = Math.sqrt(Math.random()) * L.r * margin;
    return { x: L.x + Math.cos(a) * d, y: L.y + Math.sin(a) * d };
  }
  function clampArena(x, y) {
    const L = layout(),
      dx = x - L.x,
      dy = y - L.y,
      d = Math.hypot(dx, dy),
      max = L.r - 60;
    return d <= max ? { x, y } : { x: L.x + (dx / d) * max, y: L.y + (dy / d) * max };
  }
  function setGate(closed) {
    for (const [x, y] of layout().gate) game.world.tiles[y][x] = closed ? 19 : 20;
  }

  // ---------------------------------------------------------------- Héros dans l'arène
  // Combattants : héros vivants du groupe dans le colisée. TP est la position du héros visé par le boss
  // (le plus proche pour la poursuite, un héros au hasard pour chaque grande attaque).
  let TP = null;
  // Un invité déconnecté (place réservée) ne combat pas, ne compte pas et n'est pas visé.
  const fighters = () => game.heroes.filter(hero => !hero.away && !hero.player.dead && insideArena(hero.player.x, hero.player.y, 0));
  const inArena = () => game.heroes.filter(hero => !hero.away && insideArena(hero.player.x, hero.player.y, 0));
  function nearestFighter(b) {
    let best = null,
      bestD = Infinity;
    for (const hero of fighters()) {
      const d = Math.hypot(hero.player.x - b.x, hero.player.y - b.y);
      if (d < bestD) {
        best = hero;
        bestD = d;
      }
    }
    return best;
  }
  // Cible du boss : gardée tant qu'elle combat, sinon le héros le plus proche ; P si personne (rien à viser).
  function aim(b) {
    const list = fighters();
    if (!b.target || !list.includes(b.target)) b.target = nearestFighter(b);
    TP = (b.target || game.hero).player;
    return b.target;
  }
  function retarget(b) {
    const list = fighters();
    if (list.length) b.target = list[Math.floor(Math.random() * list.length)];
    return aim(b);
  }

  // ---------------------------------------------------------------- Dégâts aux héros
  // Coup direct sur un héros : esquive, Déviation, défense, armes, talents et Rubis s'appliquent (combat.incoming).
  function strike(mult, opts = {}, hero = game.hero) {
    const p = hero.player;
    if (!run?.boss || p.dead) return 0;
    const raw = h() * mult,
      n = CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(run.boss, raw, { magic: !!opts.magic }, hero), run.boss, hero);
    if (n > 0) {
      if (opts.bleed) addDot('bleed', 0.22, 5, hero);
      if (opts.burn) addDot('burn', 0.25, 4, hero);
      if (opts.curse) {
        run.curse.set(hero, run.clock + 8);
        addDot('curse', 0.18, 8, hero);
        float(p.x, p.y - 70, '☠ MALÉDICTION', '#b0ff70');
      }
    }
    return n;
  }
  // Une attaque de zone touche chaque combattant qui s'y trouve (test(p) sur sa position).
  function strikeWhere(test, mult, opts = {}) {
    let total = 0;
    for (const hero of fighters()) if (test(hero.player)) total += strike(mult, opts, hero);
    return total;
  }
  // Dégâts sur la durée et sols dangereux : seule la Défense les réduit, la roulade ne les évite pas.
  function tickDamage(mult, hero = game.hero) {
    const n = Math.max(1, Math.round(h() * mult * canaanDamageTaken(hero)));
    return CANAAN_COMBAT.hurt(n, run.boss, hero);
  }
  function addDot(kind, mult, sec, hero = game.hero) {
    const found = run.dots.find(d => d.kind === kind && d.hero === hero);
    if (found) {
      found.until = run.clock + sec;
      return;
    }
    run.dots.push({ kind, mult, until: run.clock + sec, tick: run.clock + 1, hero });
  }
  const hitCircle = (p, x, y, r) => Math.hypot(p.x - x, p.y - y) <= r + 10;
  function hitCone(p, x, y, a, w, r) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d > r + 10) return false;
    if (d < 30) return true;
    const diff = Math.atan2(
      Math.sin(Math.atan2(p.y - y, p.x - x) - a),
      Math.cos(Math.atan2(p.y - y, p.x - x) - a)
    );
    return Math.abs(diff) <= w / 2 + 0.08;
  }
  function hitLine(p, x, y, a, len, w) {
    const dx = p.x - x,
      dy = p.y - y,
      t = dx * Math.cos(a) + dy * Math.sin(a),
      cross = Math.abs(dx * Math.sin(a) - dy * Math.cos(a));
    return t >= -10 && t <= len + 10 && cross <= w / 2 + 10;
  }

  // ---------------------------------------------------------------- Annonces au sol et effets
  // Chaque attaque majeure est annoncée : sa zone se remplit, puis l'effet tombe à la fin du délai.
  function tele(shape, data, delay, color, onResolve) {
    const fx = { shape, ...data, delay, t: 0, color, onResolve };
    // Une marque suit le héros visé jusqu'à se figer.
    if (shape === 'mark') fx.follow = TP;
    run.fx.push(fx);
    return fx;
  }
  function later(sec, fn) {
    run.timers.push({ t: sec, fn });
  }
  function flash(x, y, r, color, life = 0.35, bolt = false) {
    run.flashes.push({ x, y, r, color, life, max: life, bolt });
  }
  function swing(b) {
    b.cd = (b.cd || 0) + 1;
  }
  const angleTo = (b, x = TP.x, y = TP.y) => Math.atan2(y - b.y, x - b.x);
  // Mouvement direct d'un boss, arrêté par les murs.
  function step(b, dx, dy) {
    if (canWalk(b.x + dx, b.y)) b.x += dx;
    if (canWalk(b.x, b.y + dy)) b.y += dy;
  }
  function slowFactor(b) {
    const t = time / 60;
    return (
      (b._rubisSlowUntil > t ? 0.75 : 1) * (b.v1746_slow > 0 ? 0.75 : 1) * (b._clsSlow && b._clsSlow.until > t ? 0.85 : 1)
    );
  }
  function shoot(x, y, a, speed, mult, color, opts = {}) {
    run.shots.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: opts.r || 12,
      mult,
      color,
      magic: opts.magic !== false,
      life: opts.life || 260,
      homing: opts.homing || 0
    });
  }

  // ---------------------------------------------------------------- Mouvements des boss
  const MOVES = {
    // Frappe circulaire autour du boss.
    slam(b, o = {}) {
      const r = o.r || 170;
      b.busy = 1.3;
      tele('circle', { x: b.x, y: b.y, r }, 1.2, b.def.color, () => {
        swing(b);
        flash(b.x, b.y, r, b.def.color);
        shake = 14;
        strikeWhere(p => hitCircle(p, b.x, b.y, r), o.mult || 2.8, { bleed: b.def.bleed });
      });
    },
    // Charge en ligne droite : la trajectoire est annoncée, puis le boss fonce.
    charge(b, o = {}) {
      const a = angleTo(b),
        len = o.len || 430;
      b.busy = 1.0 + len / 14 / 60 + 0.2;
      tele('line', { x: b.x, y: b.y, a, len, w: 74 }, 1.0, b.def.color, () => {
        b.dash = { a, left: len, speed: 14, hit: false, mult: o.mult || 2.6 };
      });
    },
    // Onde de choc : un anneau qui s'élargit ; on le franchit d'une roulade ou on s'éloigne.
    shockwave(b) {
      b.busy = 1.1;
      tele('circle', { x: b.x, y: b.y, r: 70 }, 0.9, b.def.color, () => {
        swing(b);
        shake = 10;
        run.rings.push({
          x: b.x,
          y: b.y,
          r: 40,
          speed: 6,
          max: 560,
          w: 30,
          mult: 2,
          hit: false,
          color: b.def.color
        });
      });
    },
    // Bond rapide sur la position du héros.
    pounce(b, o = {}) {
      const target = clampArena(TP.x, TP.y),
        r = o.r || 110;
      b.busy = (o.delay || 0.8) + 0.2;
      tele('circle', { x: target.x, y: target.y, r }, o.delay || 0.8, b.def.color, () => {
        if (canWalk(target.x, target.y)) {
          b.x = target.x;
          b.y = target.y;
        }
        swing(b);
        flash(target.x, target.y, r, b.def.color);
        strikeWhere(p => hitCircle(p, target.x, target.y, r), o.mult || 2.2, { bleed: b.def.bleed });
      });
    },
    // Attaque arrière : le loup surgit dans le dos du héros, puis mord.
    backstab(b) {
      b.busy = 1.0;
      const a = facingAngleCore() + Math.PI,
        spot = clampArena(TP.x + Math.cos(a) * 95, TP.y + Math.sin(a) * 95);
      flash(b.x, b.y, 50, COLORS.shadow);
      if (canWalk(spot.x, spot.y)) {
        b.x = spot.x;
        b.y = spot.y;
      }
      flash(b.x, b.y, 50, COLORS.shadow);
      const aim = angleTo(b);
      tele('cone', { x: b.x, y: b.y, a: aim, w: 1.4, r: 160 }, 0.55, b.def.color, () => {
        swing(b);
        strikeWhere(p => hitCone(p, b.x, b.y, aim, 1.4, 160), 2.4, { bleed: true });
      });
    },
    frenzy(b) {
      b.busy = 2.2;
      for (let k = 0; k < 3; k++)
        later(k * 0.6, () => alive() && MOVES.pounce(b, { r: 90, delay: 0.6, mult: 1.6 }));
    },
    // Tremblement de terre : plusieurs zones autour du héros.
    quake(b, o = {}) {
      b.busy = 0.8;
      swing(b);
      shake = 8;
      for (let k = 0; k < (o.n || 5); k++) {
        const a = Math.random() * Math.PI * 2,
          d = k ? 60 + Math.random() * 180 : 0,
          p = clampArena(TP.x + Math.cos(a) * d, TP.y + Math.sin(a) * d);
        tele('circle', { x: p.x, y: p.y, r: 90 }, 1.3 + k * 0.12, COLORS.phys, () => {
          flash(p.x, p.y, 90, '#c8a878');
          strikeWhere(q => hitCircle(q, p.x, p.y, 90), 2);
        });
      }
    },
    // Rochers lancés sur le héros, l'un après l'autre.
    rocks(b, o = {}) {
      b.busy = 0.6;
      for (let k = 0; k < (o.n || 3); k++)
        later(k * 0.4, () => {
          if (!alive()) return;
          swing(b);
          const p = clampArena(TP.x + (TP.vx || 0) * 12, TP.y + (TP.vy || 0) * 12);
          tele('circle', { x: p.x, y: p.y, r: 100 }, 1.1, COLORS.phys, () => {
            flash(p.x, p.y, 100, '#c8a878');
            shake = 9;
            strikeWhere(q => hitCircle(q, p.x, p.y, 100), 2.4);
          });
        });
    },
    // Pluie de zones dans toute l'arène (éboulis, étoiles, jugement).
    rain(b, o = {}) {
      b.busy = 0.6;
      swing(b);
      const r = o.r || 85;
      for (let k = 0; k < (o.n || 8); k++) {
        const p = k === 0 ? clampArena(TP.x, TP.y) : randomSpot();
        tele('circle', { x: p.x, y: p.y, r }, 1.5 + k * 0.08, o.magic ? b.def.color : COLORS.phys, () => {
          flash(p.x, p.y, r, o.magic ? b.def.color : '#c8a878', 0.35, !!o.magic);
          strikeWhere(q => hitCircle(q, p.x, p.y, r), 2.2, { magic: !!o.magic });
        });
      }
    },
    // Poison : trois zones qui laissent des flaques toxiques.
    poison(b) {
      b.busy = 0.7;
      swing(b);
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * Math.PI * 2,
          p = clampArena(TP.x + (k ? Math.cos(a) * 140 : 0), TP.y + (k ? Math.sin(a) * 140 : 0));
        tele('circle', { x: p.x, y: p.y, r: 110 }, 1.2, COLORS.poison, () => {
          flash(p.x, p.y, 110, COLORS.poison);
          strikeWhere(q => hitCircle(q, p.x, p.y, 110), 1.4, { magic: true });
          run.hazards.push({
            x: p.x,
            y: p.y,
            r: 95,
            until: run.clock + 6,
            mult: 0.5,
            color: COLORS.poison,
            kind: 'poison',
            tick: 0
          });
        });
      }
    },
    // Éventail de projectiles.
    volley(b, o = {}) {
      b.busy = 0.9;
      const n = o.n || 7,
        spread = 1.2,
        col = o.holy ? COLORS.holy : b.def.color;
      tele('cone', { x: b.x, y: b.y, a: angleTo(b), w: spread, r: 140 }, 0.6, col, () => {
        swing(b);
        const a0 = angleTo(b);
        for (let k = 0; k < n; k++)
          shoot(b.x, b.y - 30, a0 - spread / 2 + (spread * k) / (n - 1), 5.6, 1.6, col);
      });
    },
    // Malédiction des soins : une marque suit le héros, se fige, puis frappe.
    curse(b) {
      b.busy = 0.5;
      swing(b);
      tele('mark', { x: TP.x, y: TP.y, r: 85, lock: 0.6 }, 2, COLORS.poison, fx => {
        flash(fx.x, fx.y, 85, COLORS.poison);
        strikeWhere(p => hitCircle(p, fx.x, fx.y, 85), 1.2, { magic: true, curse: true });
      });
    },
    // Brume : la sorcière disparaît et réapparaît plus loin, entourée de projectiles.
    mist(b) {
      b.busy = 1.2;
      flash(b.x, b.y, 80, '#d0ffe0', 0.6);
      const L = layout(),
        a = Math.atan2(L.y - TP.y, L.x - TP.x) + (Math.random() - 0.5),
        p = clampArena(TP.x + Math.cos(a) * 300, TP.y + Math.sin(a) * 300);
      if (canWalk(p.x, p.y)) {
        b.x = p.x;
        b.y = p.y;
      }
      later(0.5, () => {
        if (!alive()) return;
        flash(b.x, b.y, 80, '#d0ffe0', 0.6);
        for (let k = 0; k < 10; k++) shoot(b.x, b.y - 30, (k / 10) * Math.PI * 2, 3.6, 1.3, COLORS.poison);
      });
    },
    // Combo d'épée : trois frappes qui suivent le héros, puis un tourbillon.
    combo(b) {
      b.busy = 2.6;
      const strikeCone = (delay, mult) =>
        later(delay, () => {
          if (!alive()) return;
          const a = angleTo(b);
          tele('cone', { x: b.x, y: b.y, a, w: 1.9, r: 155 }, 0.45, b.def.color, () => {
            swing(b);
            strikeWhere(p => hitCone(p, b.x, b.y, a, 1.9, 155), mult);
          });
        });
      strikeCone(0, 1.8);
      strikeCone(0.55, 1.8);
      strikeCone(1.1, 1.8);
      later(1.65, () => alive() && MOVES.slam(b, { r: 165, mult: 2.4 }));
    },
    // Parade : frapper le chevalier pendant sa garde déclenche une contre-attaque.
    parry(b) {
      b.busy = 2.5;
      b.parryUntil = run.clock + 2.5;
      b.countered = false;
      float(b.x, b.y - 150, '🛡️ EN GARDE', '#b0e8ff');
    },
    // Trois souffles de flammes, un par tête.
    breath3(b) {
      b.busy = 1.4;
      const a = angleTo(b);
      for (const off of [-0.75, 0, 0.75])
        tele('cone', { x: b.x, y: b.y, a: a + off, w: 0.55, r: 280 }, 1.2, COLORS.fire, fx => {
          swing(b);
          flash(b.x + Math.cos(fx.a) * 140, b.y + Math.sin(fx.a) * 140, 90, COLORS.fire);
          strikeWhere(p => hitCone(p, fx.x, fx.y, fx.a, 0.55, 280), 2.6, { magic: true, burn: true });
        });
    },
    // Chaque tête crache une rafale.
    spit(b) {
      b.busy = 1.4;
      for (let head = 0; head < (b.def.heads || 3); head++)
        later(head * 0.35, () => {
          if (!alive()) return;
          swing(b);
          const a = angleTo(b) + (head - 1) * 0.25;
          for (let k = -1; k <= 1; k++)
            shoot(b.x + (head - 1) * 40, b.y - 50, a + k * 0.16, 6.2, 1.5, COLORS.fire);
        });
    },
    // Souffles successifs de gauche à droite : il faut suivre l'ouverture.
    breathRoll(b) {
      b.busy = 2.2;
      const a0 = angleTo(b);
      [-1.1, -0.4, 0.3, 1.0].forEach((off, k) =>
        later(k * 0.35, () => {
          if (!alive()) return;
          tele('cone', { x: b.x, y: b.y, a: a0 + off, w: 0.62, r: 300 }, 0.9, COLORS.fire, fx => {
            swing(b);
            strikeWhere(p => hitCone(p, fx.x, fx.y, fx.a, 0.62, 300), 2.2, { magic: true, burn: true });
          });
        })
      );
    },
    // Éclairs : frappes rapides qui suivent le héros.
    lightning(b, o = {}) {
      b.busy = 0.6;
      swing(b);
      for (let k = 0; k < (o.n || 6); k++)
        later(k * 0.33, () => {
          if (!alive()) return;
          const p = { x: TP.x, y: TP.y };
          tele('circle', { x: p.x, y: p.y, r: 70 }, 0.8, COLORS.storm, () => {
            flash(p.x, p.y, 70, COLORS.storm, 0.3, true);
            strikeWhere(q => hitCircle(q, p.x, p.y, 70), 2, { magic: true });
          });
        });
    },
    // Zones électriques mobiles qui poursuivent lentement le héros.
    fields(b) {
      b.busy = 0.8;
      swing(b);
      for (let k = 0; k < 4; k++) {
        const p = randomSpot(0.7);
        run.hazards.push({
          x: p.x,
          y: p.y,
          r: 95,
          until: run.clock + 8,
          mult: 0.8,
          color: COLORS.storm,
          kind: 'storm',
          tick: 0,
          chase: 0.9
        });
      }
    },
    // Rafales : le vent repousse le héros, entouré de projectiles.
    gust(b) {
      b.busy = 1.6;
      swing(b);
      run.gust = { x: b.x, y: b.y, until: run.clock + 1.5, force: 3.2 };
      float(TP.x, TP.y - 70, '🌪️ RAFALE', '#bfe8ff');
      for (let k = 0; k < 8; k++) shoot(b.x, b.y - 30, (k / 8) * Math.PI * 2 + 0.2, 4.4, 1.4, COLORS.storm);
    },
    // Rayons tournants depuis le boss.
    sweep(b, o = {}) {
      const beams = o.beams || 2,
        a0 = angleTo(b) + Math.PI / beams / 2;
      b.busy = 4.4;
      for (let k = 0; k < beams; k++) {
        const a = a0 + (k * Math.PI * 2) / beams;
        tele('line', { x: b.x, y: b.y, a, len: 640, w: 38 }, 1.2, b.def.color, () => {
          run.sweeps.push({
            a,
            speed: 0.75 * (Math.random() < 0.5 ? -1 : 1),
            len: 640,
            w: 38,
            until: run.clock + 3,
            mult: 1.3,
            tick: 0,
            color: b.def.color
          });
        });
      }
    },
    // Attaques en cône alternées.
    cones(b) {
      b.busy = 2.4;
      [0, 0.75, 1.4].forEach((delay, k) =>
        later(delay, () => {
          if (!alive()) return;
          const a = angleTo(b) + (k === 1 ? 0.6 : k === 2 ? -0.6 : 0);
          tele('cone', { x: b.x, y: b.y, a, w: 2.3, r: 240 }, k ? 0.6 : 0.9, b.def.color, fx => {
            swing(b);
            strikeWhere(p => hitCone(p, fx.x, fx.y, fx.a, 2.3, 240), 2.4, { magic: true });
          });
        })
      );
    },
    // Marque astrale : elle suit le héros puis explose.
    mark(b) {
      b.busy = 0.5;
      swing(b);
      tele('mark', { x: TP.x, y: TP.y, r: 150, lock: 0.7 }, 2.4, b.def.color, fx => {
        flash(fx.x, fx.y, 150, b.def.color, 0.45, true);
        shake = 10;
        strikeWhere(p => hitCircle(p, fx.x, fx.y, 150), 3, { magic: true });
      });
    },
    // Exécution : sur un héros affaibli, une ligne dévastatrice longuement annoncée.
    execute(b) {
      if (TP.hp / TP.mhp > 0.45) return MOVES.cones(b);
      b.busy = 1.9;
      const a = angleTo(b);
      float(b.x, b.y - 160, '⚔️ EXÉCUTION', '#ff6a6a');
      tele('line', { x: b.x, y: b.y, a, len: 680, w: 96 }, 1.6, '#ff3a3a', () => {
        swing(b);
        flash(b.x + Math.cos(a) * 300, b.y + Math.sin(a) * 300, 140, '#ff3a3a');
        shake = 16;
        strikeWhere(p => hitLine(p, b.x, b.y, a, 680, 96), 6, { magic: true });
      });
    },
    // Bouclier de cristal : à briser avant la fin, sinon il explose.
    crystal(b) {
      b.busy = 1;
      b.shieldHp = Math.round(b.mhp * 0.12);
      b.shieldMax = b.shieldHp;
      b.shieldUntil = run.clock + 8;
      float(b.x, b.y - 170, '💎 BOUCLIER DE CRISTAL', '#e0c0ff');
      later(6, () => {
        if (!alive() || !(b.shieldHp > 0)) return;
        tele('circle', { x: b.x, y: b.y, r: 340 }, 2, COLORS.crystal, () => {
          if (!(b.shieldHp > 0)) return;
          b.shieldHp = 0;
          flash(b.x, b.y, 340, '#ffffff', 0.5);
          shake = 18;
          strikeWhere(p => hitCircle(p, b.x, b.y, 340), 4, { magic: true });
        });
      });
    },
    // Rayons dirigés vers le héros.
    beams(b, o = {}) {
      const n = o.n || 3,
        a0 = angleTo(b);
      b.busy = 1.5;
      for (let k = 0; k < n; k++) {
        const a = a0 + (k - (n - 1) / 2) * 0.42;
        tele('line', { x: b.x, y: b.y, a, len: 660, w: 46 }, 1.3, b.def.color, () => {
          swing(b);
          flash(b.x + Math.cos(a) * 330, b.y + Math.sin(a) * 330, 60, b.def.color);
          strikeWhere(p => hitLine(p, b.x, b.y, a, 660, 46), 2.6, { magic: true });
        });
      }
    },
    // Éclats de cristal qui explosent sur la piste.
    shards(b) {
      b.busy = 0.8;
      swing(b);
      for (let k = 0; k < 6; k++) {
        const p = k < 2 ? clampArena(TP.x + (k ? 120 : 0), TP.y) : randomSpot();
        tele('circle', { x: p.x, y: p.y, r: 110, crystal: true }, 2, COLORS.crystal, () => {
          flash(p.x, p.y, 110, '#e0c0ff');
          strikeWhere(q => hitCircle(q, p.x, p.y, 110), 2.4, { magic: true });
        });
      }
    },
    // Souffle de feu qui laisse un sol brûlant.
    breath(b) {
      b.busy = 1.4;
      const a = angleTo(b);
      tele('cone', { x: b.x, y: b.y, a, w: 1.25, r: 340 }, 1.1, COLORS.fire, () => {
        swing(b);
        shake = 10;
        strikeWhere(p => hitCone(p, b.x, b.y, a, 1.25, 340), 3, { magic: true, burn: true });
        for (const d of [120, 210, 300])
          run.hazards.push({
            x: b.x + Math.cos(a) * d,
            y: b.y + Math.sin(a) * d,
            r: 70,
            until: run.clock + 6,
            mult: 0.7,
            color: COLORS.fire,
            kind: 'fire',
            tick: 0
          });
      });
    },
    // Météores : impacts qui laissent un sol brûlant.
    meteors(b, o = {}) {
      b.busy = 0.8;
      swing(b);
      for (let k = 0; k < (o.n || 7); k++) {
        const a = Math.random() * Math.PI * 2,
          p =
            k === 0
              ? clampArena(TP.x, TP.y)
              : clampArena(
                  TP.x + Math.cos(a) * (80 + Math.random() * 260),
                  TP.y + Math.sin(a) * (80 + Math.random() * 260)
                );
        tele('circle', { x: p.x, y: p.y, r: 105, meteor: true }, 1.6 + k * 0.15, COLORS.fire, () => {
          flash(p.x, p.y, 105, COLORS.fire);
          shake = 8;
          strikeWhere(q => hitCircle(q, p.x, p.y, 105), 2.6, { magic: true });
          run.hazards.push({
            x: p.x,
            y: p.y,
            r: 75,
            until: run.clock + 5,
            mult: 0.7,
            color: COLORS.fire,
            kind: 'fire',
            tick: 0
          });
        });
      }
    },
    // Tempête de feu : deux couronnes de projectiles.
    firestorm(b) {
      b.busy = 1.8;
      MOVES.slam(b, { r: 160, mult: 2.4 });
      for (let wave = 0; wave < 2; wave++)
        later(1.3 + wave * 0.5, () => {
          if (!alive()) return;
          for (let k = 0; k < 16; k++)
            shoot(b.x, b.y - 40, (k / 16) * Math.PI * 2 + wave * 0.2, 4.6, 1.6, COLORS.fire);
        });
    },
    // Téléportation dans le dos du héros, puis frappe.
    blink(b) {
      b.busy = 1.5;
      flash(b.x, b.y, 70, COLORS.void, 0.5);
      b.hidden = true;
      later(0.6, () => {
        if (!alive()) return;
        const a = facingAngleCore() + Math.PI,
          spot = clampArena(TP.x + Math.cos(a) * 130, TP.y + Math.sin(a) * 130);
        if (canWalk(spot.x, spot.y)) {
          b.x = spot.x;
          b.y = spot.y;
        }
        b.hidden = false;
        flash(b.x, b.y, 70, COLORS.void, 0.5);
        MOVES.slam(b, { r: 150, mult: 2.6 });
        b.busy = 1.3;
      });
    },
    // Spirale d'orbes du Néant.
    spiral(b) {
      b.busy = 2.2;
      for (let k = 0; k < 18; k++)
        later(k * 0.11, () => {
          if (!alive()) return;
          shoot(b.x, b.y - 30, k * 0.55 + run.clock * 0.3, 4.4, 1.6, COLORS.void);
        });
    },
    // Clones : des échos du Néant qui tirent sur le héros.
    clones(b, o = {}) {
      b.busy = 1;
      swing(b);
      for (let k = 0; k < (o.n || 2); k++) {
        const a = (k / (o.n || 2)) * Math.PI * 2 + Math.random(),
          p = clampArena(TP.x + Math.cos(a) * 260, TP.y + Math.sin(a) * 260);
        const hp = Math.round(b.mhp * 0.04);
        game.world.monsters.push({
          x: p.x,
          y: p.y,
          hp,
          mhp: hp,
          t: 'Écho du Néant',
          r: 22,
          cd: 0,
          g: 0,
          arenaClone: true,
          shotClock: 1 + k * 0.4,
          expires: run.clock + 12,
          look: 'horror',
          pal: ['#2a1840', '#120a20', '#6a3a9a', '#c050ff', '#ffffff'],
          lookOpts: {}
        });
        flash(p.x, p.y, 60, COLORS.void, 0.5);
      }
    },
    // Flaques du Néant autour du héros.
    voidzone(b) {
      b.busy = 0.8;
      swing(b);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.random() * 0.5,
          p = clampArena(TP.x + Math.cos(a) * (k ? 150 : 0), TP.y + Math.sin(a) * (k ? 150 : 0));
        tele('circle', { x: p.x, y: p.y, r: 100 }, 1.1, COLORS.void, () => {
          run.hazards.push({
            x: p.x,
            y: p.y,
            r: 100,
            until: run.clock + 7,
            mult: 0.8,
            color: COLORS.void,
            kind: 'void',
            tick: 0
          });
        });
      }
    }
  };

  // ---------------------------------------------------------------- Vagues
  function spawnBoss() {
    const def = BOSSES[run.wave - 1],
      L = layout(),
      group = GROUP[players()] || GROUP[1],
      hp = Math.round(BASE.hp * HP_MULT[run.wave - 1] * group.hp);
    run.dmgMult = DMG_MULT[run.wave - 1] * group.dmg;
    const b = {
      x: L.x,
      y: L.y - L.r * 0.45,
      hp,
      mhp: hp,
      t: def.name,
      r: Math.round(def.scale * 9),
      cd: 0,
      g: 150 + run.wave * 60,
      boss: true,
      arenaBoss: true,
      def,
      wave: run.wave,
      look: def.look,
      pal: def.pal,
      lookOpts: def.opts,
      mobColor: def.color,
      bossColor: def.color,
      scale: def.scale,
      phase: 0,
      rot: 0,
      moveClock: 2.2,
      autoClock: 1.2,
      busy: 0
    };
    game.world.monsters = game.world.monsters.filter(m => !m.arenaBoss && !m.arenaClone);
    game.world.monsters.push(b);
    run.boss = b;
    run.phase = 'fight';
    run.cheerUntil = run.clock + 2.5;
    setGate(true);
    run.group = players();
    for (const hero of inArena()) CANAAN_RUBIS.newCombat(hero);
    flash(b.x, b.y, 160, def.color, 0.8);
    toast('⚔️ Vague ' + run.wave + ' : ' + def.name);
    chat('Arène', 'Vague ' + run.wave + '/12 — ' + def.name + ' entre dans l’arène !');
  }
  function clearField() {
    run.fx = [];
    run.rings = [];
    run.hazards = [];
    run.shots = [];
    run.sweeps = [];
    run.timers = [];
    run.dots = [];
    run.gust = null;
    run.curse = new Map();
    game.world.monsters = game.world.monsters.filter(m => !m.arenaClone && !(m.arenaBoss && m.hp <= 0));
  }
  // Mort du boss : arrêt immédiat de ses attaques. Chaque héros du colisée gagne son Rubis et son record ;
  // les héros debout récupèrent 20 % de leurs PV et de leur mana, ceux à terre se relèvent avec 20 % de leurs PV.
  function onBossDown(m) {
    if (!run || m !== run.boss) return;
    const wave = run.wave,
      group = inArena();
    clearField();
    run.boss = null;
    run.cheerUntil = run.clock + 4;
    run.rubisWon++;
    for (const hero of group) {
      const rec = records(hero),
        p = hero.player,
        host = hero === game.hero;
      rec.best = Math.max(rec.best, wave);
      rec.lastBoss = m.t;
      const { rubis, fresh } = CANAAN_RUBIS.grant(null, hero),
        text = '💎 Rubis obtenu : ' + rubis.name + (fresh ? ' (nouveau !)' : ' (doublon)');
      if (host) {
        run.banner = { id: rubis.id, fresh, until: run.clock + 5, wave };
        toast(text);
      } else {
        canaanLootNotice(hero, text);
        (run.banners ??= new Map()).set(hero, { id: rubis.id, fresh, until: run.clock + 5, wave });
      }
      if (p.dead) {
        p.dead = false;
        p.hp = Math.max(1, Math.round(p.mhp * RECOVERY));
        hero.reviveAt = null;
        float(p.x, p.y - 40, '✨ RELEVÉ', '#8fe3ae');
        continue;
      }
      const before = p.hp;
      p.hp = Math.min(p.mhp, p.hp + p.mhp * RECOVERY);
      const mana = CANAAN_RUBIS.restoreMana(p.mmp * RECOVERY, hero);
      float(p.x, p.y - 40, '+' + Math.round(p.hp - before) + ' PV · +' + Math.round(mana) + ' mana', '#8fe3ae');
    }
    if (!run.banner || run.banner.wave !== wave) run.banner = { text: m.t + ' vaincu !', until: run.clock + 4, wave };
    chat('Arène', m.t + ' est vaincu ! Un Rubis pour chaque héros de l’arène.');
    setGate(false);
    if (wave >= WAVES) {
      run.phase = 'victory';
      game.world.instance.cleared = true;
      for (const hero of group) {
        const rec = records(hero);
        rec.completed = true;
        // Butin de prestige du dernier boss : 5 % de chances d'un objet Légendaire du niveau du héros.
        if (prestigeRoll('arenaFinal')) {
          const item = giveGear(clampLevel(hero.level), 'arena', 'Légendaire', hero);
          if (item) chat('Arène', '🌟 ' + (hero.name || 'Le héros') + ' remporte un objet LÉGENDAIRE : ' + gearDisplayName(item) + ' !');
        }
        if (CANAAN_RUBIS.missing(hero).length) {
          // L'hôte choisit son Rubis final ; un allié reçoit un Rubis qui lui manque.
          if (hero === game.hero) {
            rec.pendingChoice = true;
            later(2.5, () => openFinalChoice());
          } else {
            const pick = CANAAN_RUBIS.missing(hero)[Math.floor(Math.random() * CANAAN_RUBIS.missing(hero).length)];
            CANAAN_RUBIS.grant(pick.id, hero);
            canaanLootNotice(hero, '🏆 Rubis de la victoire : ' + pick.name);
          }
        } else {
          hero.player.gold += 2500;
          if (hero === game.hero) toast('🏆 Collection complète : +2500 or');
          else canaanLootNotice(hero, '🏆 Collection complète : +2500 or');
        }
      }
      chat('Arène', '🏆 Les douze épreuves sont accomplies ! La victoire, elle, se mérite.');
    } else {
      run.wave = wave + 1;
      run.phase = 'rest';
      run.timer = PREP_NEXT;
    }
    saveGame();
  }
  function enterArena() {
    if (game.world.instance) {
      toast('Termine ton instance actuelle');
      return false;
    }
    game.world.chests = [];
    game.world.returnPos = { x: P.x, y: P.y };
    game.world.instance = { index: 'arena', arena: true, cleared: false, difficulty: null, bossesDown: 0 };
    game.world.tiles = makeDungeon('arena');
    game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    const L = layout();
    // Tout le groupe entre ensemble ; chaque héros compte une tentative.
    placeGroup(L.entry.x, L.entry.y);
    for (const hero of game.heroes) if (hero !== game.hero) records(hero).attempts++;
    camX = P.x - W / 2;
    camY = P.y - H / 2;
    instanceEntrance = { x: P.x, y: P.y };
    game.world.monsters = [];
    game.world.projectiles = [];
    records().attempts++;
    run = newRun();
    setGate(false);
    closePanels();
    toast('⚔️ ' + CANAAN_ARENA_NAME + ' : avance sur la piste pour commencer');
    saveGame();
    CanaanStages.restartMusic();
    return true;
  }
  // Sortie (abandon entre les vagues, défaite ou victoire) : les Rubis gagnés restent acquis.
  function onLeave() {
    if (!run) return;
    // Un boss vaincu = une vague réussie = un Rubis.
    const won = run.rubisWon;
    chat('Arène', 'Tentative terminée : ' + won + ' vague(s) réussie(s), ' + won + ' Rubis gagné(s).');
    clearField();
    run = null;
  }
  function interact() {
    if (!run) return;
    if (Math.hypot(P.x - instanceEntrance.x, P.y - instanceEntrance.y) >= 95) return;
    if (run.phase === 'fight') {
      toast('⚔️ Impossible d’abandonner pendant un combat !');
      return;
    }
    leaveInstance();
  }

  // ---------------------------------------------------------------- Intelligence des boss
  function phaseOf(b) {
    const phases = b.def.phases,
      ratio = b.hp / b.mhp;
    let k = 0;
    phases.forEach((p, i) => {
      if (ratio <= p.hp) k = i;
    });
    return k;
  }
  function updateBoss(b, dt) {
    // Changement de phase : courte immunité et onde de choc, puis nouveaux mouvements.
    const want = phaseOf(b);
    if (want > b.phase) {
      b.phase = want;
      b.rot = 0;
      b.immuneUntil = run.clock + 1.5;
      b.busy = 1.6;
      b.dash = null;
      run.fx = run.fx.filter(fx => fx.shape === 'mark');
      run.banner = {
        phase: want + 1,
        text: b.def.phases[want].label || 'Phase ' + (want + 1),
        until: run.clock + 3
      };
      run.cheerUntil = run.clock + 2;
      flash(b.x, b.y, 220, b.def.color, 0.8);
      run.rings.push({
        x: b.x,
        y: b.y,
        r: 40,
        speed: 7,
        max: 480,
        w: 26,
        mult: 1.6,
        hit: false,
        color: b.def.color
      });
    }
    const phase = b.def.phases[b.phase],
      speed = b.def.speed * (phase.speed || 1) * slowFactor(b),
      stunned = b.stunUntil > run.clock;
    b.cd = Math.max(0, (b.cd || 0) - dt);
    if (b.dash) {
      // Charge en cours : le boss fonce, blesse une fois au contact.
      const s = b.dash.speed;
      const nx = b.x + Math.cos(b.dash.a) * s,
        ny = b.y + Math.sin(b.dash.a) * s;
      if (!canWalk(nx, ny) || b.dash.left <= 0) b.dash = null;
      else {
        b.x = nx;
        b.y = ny;
        b.dash.left -= s;
        particles.push({ x: b.x, y: b.y + 20, vx: 0, vy: -0.5, life: 18, c: b.def.color, r: 5 });
        // Chaque héros n'est blessé qu'une fois par charge.
        b.dash.hits ??= [];
        for (const hero of fighters())
          if (!b.dash.hits.includes(hero) && Math.hypot(hero.player.x - b.x, hero.player.y - b.y) < b.r + 34) {
            b.dash.hits.push(hero);
            swing(b);
            if (hero === game.hero) shake = 12;
            strike(b.dash.mult, {}, hero);
          }
      }
      return;
    }
    if (stunned) return;
    if (b.busy > 0) {
      b.busy -= dt;
      return;
    }
    // Poursuite du héros visé : les lanceurs de sorts gardent leurs distances.
    const target = aim(b),
      d = Math.hypot(TP.x - b.x, TP.y - b.y) || 1,
      reach = 70 + b.def.scale * 14;
    if (target && !b.hidden) {
      const want = b.def.caster ? 240 : reach * 0.75;
      if (d > want + 10) step(b, ((TP.x - b.x) / d) * speed, ((TP.y - b.y) / d) * speed);
      else if (b.def.caster && d < 150)
        step(b, (-(TP.x - b.x) / d) * speed * 0.8, (-(TP.y - b.y) / d) * speed * 0.8);
    }
    // Mouvement spécial à intervalle régulier, en rotation, sur un héros choisi au hasard.
    b.moveClock -= dt;
    if (b.moveClock <= 0) {
      const [name, opts] = phase.moves[b.rot++ % phase.moves.length];
      b.moveClock = phase.gap * tempo(run.wave);
      retarget(b);
      MOVES[name](b, opts || {});
      return;
    }
    // Attaque de base, elle aussi annoncée : mêlée en cône, ou projectile pour les lanceurs de sorts.
    b.autoClock -= dt;
    if (b.autoClock > 0) return;
    if (b.def.caster && d < 640) {
      b.autoClock = 1.7 * tempo(run.wave);
      swing(b);
      shoot(b.x, b.y - 30, angleTo(b), 6, 1, b.def.color);
    } else if (d <= reach + 20) {
      b.autoClock = 1.8 * tempo(run.wave);
      b.busy = 0.5;
      const a = angleTo(b),
        r = reach + 30;
      tele('cone', { x: b.x, y: b.y, a, w: 1.75, r, auto: true }, 0.45, b.def.color, () => {
        swing(b);
        strikeWhere(p => hitCone(p, b.x, b.y, a, 1.75, r), 1, { bleed: b.def.bleed });
      });
    }
  }
  // Dégâts reçus par un boss : immunité de phase, bouclier de cristal, parade et contre-attaque.
  function onBossHurt(m, value) {
    if (!run || m.arenaClone) return value;
    if (m.immuneUntil > run.clock) {
      float(m.x, m.y - 60, 'IMMUNISÉ', '#d8d0c0');
      return 0;
    }
    if (m.parryUntil > run.clock) {
      if (!m.countered) {
        m.countered = true;
        m.parryUntil = run.clock + 0.4;
        float(m.x, m.y - 150, '⚔️ CONTRE-ATTAQUE !', '#ff9a6a');
        aim(m);
        const a = angleTo(m);
        tele('cone', { x: m.x, y: m.y, a, w: 1.6, r: 200 }, 0.3, '#ff6a3a', () => {
          swing(m);
          strikeWhere(p => hitCone(p, m.x, m.y, a, 1.6, 200), 3);
        });
      }
      float(m.x, m.y - 60, 'PARÉ', '#b0e8ff');
      return Math.round(value * 0.3);
    }
    if (m.shieldHp > 0) {
      const absorbed = Math.min(m.shieldHp, value);
      m.shieldHp -= absorbed;
      float(m.x, m.y - 60, '💎 ' + absorbed, '#e0c0ff');
      if (m.shieldHp <= 0) {
        m.shieldHp = 0;
        m.stunUntil = run.clock + 2.5;
        m.busy = 0;
        flash(m.x, m.y, 160, '#ffffff', 0.5);
        float(m.x, m.y - 170, '💥 BOUCLIER BRISÉ', '#ffffff');
        run.fx = run.fx.filter(fx => !(fx.shape === 'circle' && fx.r === 340));
      }
      return value - absorbed;
    }
    return value;
  }

  // ---------------------------------------------------------------- Étape de simulation
  // Héros à terre dans le colisée : relevés par un allié proche, ou fin de la tentative si plus personne ne combat.
  function stepDowned(dt) {
    const standing = fighters();
    for (const hero of inArena()) {
      const p = hero.player;
      if (!p.dead) {
        run.revives.delete(hero);
        continue;
      }
      const helper = standing.find(o => Math.hypot(o.player.x - p.x, o.player.y - p.y) <= REVIVE.range);
      const progress = helper ? (run.revives.get(hero) || 0) + dt : 0;
      run.revives.set(hero, progress);
      if (progress >= REVIVE.seconds) {
        run.revives.delete(hero);
        p.dead = false;
        p.hp = Math.max(1, Math.round(p.mhp * REVIVE.hp));
        hero.reviveAt = null;
        burst(p.x, p.y, '#8fe3ae', 18);
        float(p.x, p.y - 50, '✨ RELEVÉ', '#8fe3ae');
        chat('Arène', helper.name + ' relève ' + hero.name + ' !');
        if (hero !== game.hero) canaanLootNotice(hero, '✨ ' + helper.name + ' t’a relevé !');
        else toast('✨ ' + helper.name + ' t’a relevé !');
      }
    }
    // Tout le groupe à terre : la tentative échoue, retour au camp (comme la mort en solo).
    if (!standing.length && P.dead && !run.failed) {
      run.failed = true;
      canaanHostRespawn('⚔️ Tout le groupe est à terre… Tentative terminée.');
    }
  }
  window.CanaanStages.arena = {
    after() {
      // Partie rechargée hors du colisée : la tentative est terminée.
      if (run && !game.world.instance?.arena) run = null;
      if (!run || run.failed) return;
      const dt = 1 / 60;
      run.clock += dt;
      stepDowned(dt);
      if (run.failed || !fighters().length) return;
      if (run.phase === 'enter') {
        if (insideArena()) {
          run.phase = 'countdown';
          run.timer = PREP_FIRST;
        }
      } else if (run.phase === 'countdown' || run.phase === 'rest') {
        run.timer = Math.max(0, run.timer - dt);
        if (run.timer <= 0 && insideArena(P.x, P.y, 60)) spawnBoss();
      }
      for (let i = run.flashes.length - 1; i >= 0; i--)
        if ((run.flashes[i].life -= dt) <= 0) run.flashes.splice(i, 1);
      if (run.phase !== 'fight') {
        for (let i = run.timers.length - 1; i >= 0; i--) {
          const tm = run.timers[i];
          if ((tm.t -= dt) <= 0) {
            run.timers.splice(i, 1);
            tm.fn();
          }
        }
        return;
      }
      const b = run.boss;
      if (!b || b.hp <= 0) return;
      aim(b);
      updateBoss(b, dt);
      if (!alive()) return;
      // Minuteries des mouvements enchaînés.
      for (let i = run.timers.length - 1; i >= 0; i--) {
        const tm = run.timers[i];
        if ((tm.t -= dt) <= 0) {
          run.timers.splice(i, 1);
          tm.fn();
          if (!alive()) return;
        }
      }
      // Annonces au sol : la marque suit le héros visé jusqu'à se figer.
      for (let i = run.fx.length - 1; i >= 0; i--) {
        const fx = run.fx[i];
        if (!fx) continue;
        fx.t += dt;
        if (fx.shape === 'mark' && fx.t < fx.delay - fx.lock && fx.follow) {
          fx.x = fx.follow.x;
          fx.y = fx.follow.y;
        }
        if (fx.t >= fx.delay) {
          run.fx.splice(i, 1);
          fx.onResolve(fx);
          if (!alive()) return;
        }
      }
      // Ondes de choc.
      for (let i = run.rings.length - 1; i >= 0; i--) {
        const ring = run.rings[i];
        ring.r += ring.speed;
        // Une onde touche chaque héros une seule fois.
        ring.hits ??= [];
        for (const hero of fighters()) {
          const p = hero.player;
          if (ring.hits.includes(hero) || Math.abs(Math.hypot(p.x - ring.x, p.y - ring.y) - ring.r) >= ring.w / 2 + 8) continue;
          ring.hits.push(hero);
          strike(ring.mult, {}, hero);
        }
        if (!alive()) return;
        if (ring.r > ring.max) run.rings.splice(i, 1);
      }
      // Rayons tournants.
      for (let i = run.sweeps.length - 1; i >= 0; i--) {
        const sw = run.sweeps[i];
        sw.a += sw.speed * dt;
        sw.tick -= dt;
        if (sw.tick <= 0 && fighters().some(hero => hitLine(hero.player, b.x, b.y, sw.a, sw.len, sw.w))) {
          sw.tick = 0.45;
          strikeWhere(p => hitLine(p, b.x, b.y, sw.a, sw.len, sw.w), sw.mult, { magic: true });
          if (!alive()) return;
        }
        if (run.clock > sw.until) run.sweeps.splice(i, 1);
      }
      // Sols dangereux : dégâts toutes les 0,5 s ; les zones électriques poursuivent le héros.
      for (let i = run.hazards.length - 1; i >= 0; i--) {
        const hz = run.hazards[i];
        if (hz.chase) {
          // Une zone électrique poursuit le héros le plus proche d'elle.
          const prey = fighters().reduce((a, o) => (!a || Math.hypot(o.player.x - hz.x, o.player.y - hz.y) < Math.hypot(a.player.x - hz.x, a.player.y - hz.y) ? o : a), null);
          if (prey) {
            const q = prey.player,
              d = Math.hypot(q.x - hz.x, q.y - hz.y) || 1;
            hz.x += ((q.x - hz.x) / d) * hz.chase;
            hz.y += ((q.y - hz.y) / d) * hz.chase;
          }
        }
        hz.tick -= dt;
        const burnt = fighters().filter(hero => hitCircle(hero.player, hz.x, hz.y, hz.r - 10));
        if (hz.tick <= 0 && burnt.length) {
          hz.tick = 0.5;
          for (const hero of burnt) tickDamage(hz.mult * 0.5, hero);
          if (!alive()) return;
        }
        if (run.clock > hz.until) run.hazards.splice(i, 1);
      }
      // Projectiles des boss : arrêtés par les murs et les piliers.
      for (let i = run.shots.length - 1; i >= 0; i--) {
        const s = run.shots[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life--;
        if (SOLID.includes(tileAt(Math.floor(s.x / TS), Math.floor(s.y / TS)))) s.life = 0;
        else {
          // Le projectile s'arrête sur le premier héros touché.
          const hero = fighters().find(o => Math.hypot(o.player.x - s.x, o.player.y - (s.y + 10)) < s.r + 14);
          if (hero) {
            s.life = 0;
            strike(s.mult, { magic: s.magic }, hero);
            if (!alive()) return;
          }
        }
        if (s.life <= 0) run.shots.splice(i, 1);
      }
      // Saignements, brûlures et malédiction.
      for (let i = run.dots.length - 1; i >= 0; i--) {
        const dot = run.dots[i];
        if (run.clock >= dot.tick) {
          dot.tick += 1;
          if (!dot.hero.player.dead) tickDamage(dot.mult, dot.hero);
          if (!alive()) return;
        }
        if (run.clock >= dot.until) run.dots.splice(i, 1);
      }
      // Rafale : le vent pousse le héros loin du boss.
      if (run.gust) {
        if (run.clock > run.gust.until) run.gust = null;
        else {
          for (const hero of fighters()) {
            const q = hero.player,
              d = Math.hypot(q.x - run.gust.x, q.y - run.gust.y) || 1,
              fx = ((q.x - run.gust.x) / d) * run.gust.force,
              fy = ((q.y - run.gust.y) / d) * run.gust.force;
            if (canWalk(q.x + fx, q.y)) q.x += fx;
            if (canWalk(q.x, q.y + fy)) q.y += fy;
          }
        }
      }
      // Échos du Néant : immobiles, ils tirent puis se dissipent.
      for (const m of game.world.monsters.slice()) {
        if (!m.arenaClone) continue;
        if (run.clock > m.expires) {
          flash(m.x, m.y, 50, COLORS.void, 0.4);
          game.world.monsters.splice(game.world.monsters.indexOf(m), 1);
          continue;
        }
        m.shotClock -= dt;
        if (m.shotClock <= 0) {
          m.shotClock = 2.2;
          m.cd += 1;
          const prey = nearestFighter(m);
          if (prey) shoot(m.x, m.y - 30, Math.atan2(prey.player.y - m.y, prey.player.x - m.x), 4.6, 1.2, COLORS.void);
        }
        m.cd = Math.max(0, m.cd - dt);
      }
    }
  };

  // ---------------------------------------------------------------- Rendu
  function wedge(c, x, y, a, w, r) {
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, r, a - w / 2, a + w / 2);
    c.closePath();
  }
  function drawGround(c) {
    if (!run) return;
    c.save();
    // Héros à terre : anneau de réanimation qui se remplit pendant qu'un allié se tient à côté.
    for (const d of downs()) {
      c.globalAlpha = 0.85;
      c.strokeStyle = '#3a2a1a';
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(d.x, d.y + 18, 34, 14, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = '#8fe3ae';
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(d.x, d.y + 18, 34, 14, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, d.p || 0));
      c.stroke();
    }
    c.globalAlpha = 1;
    // Sols dangereux.
    for (const hz of run.hazards) {
      const pulse = 0.5 + Math.sin(time * 0.15 + hz.x) * 0.15,
        fade = Math.min(1, (hz.until - run.clock) / 0.6);
      c.globalAlpha = 0.32 * pulse * fade + 0.12;
      c.fillStyle = hz.color;
      c.beginPath();
      c.ellipse(hz.x, hz.y, hz.r, hz.r, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.75 * fade;
      c.strokeStyle = hz.color;
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = '#ffffff';
      for (let k = 0; k < 5; k++) {
        const a = time * 0.05 + k * 1.3 + hz.y,
          rr = (hz.r * (0.25 + ((k * 37 + time) % 60) / 100)) % hz.r;
        if (hz.kind === 'storm') c.fillRect(hz.x + Math.cos(a) * rr - 6, hz.y + Math.sin(a) * rr, 12, 2);
        else c.fillRect(hz.x + Math.cos(a) * rr - 2, hz.y + Math.sin(a) * rr - 2, 4, 4);
      }
      canaanLight(hz.x, hz.y, hz.r * 1.4, hz.color);
    }
    // Annonces : contour franc, remplissage qui grandit jusqu'à l'impact.
    for (const fx of run.fx) {
      const k = Math.min(1, fx.t / fx.delay),
        col = fx.color,
        danger = k > 0.75;
      c.lineWidth = fx.auto ? 2 : 3;
      if (fx.shape === 'circle' || fx.shape === 'mark') {
        const ry = fx.r;
        c.globalAlpha = fx.auto ? 0.1 : 0.16;
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(fx.x, fx.y, fx.r, ry, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 0.34;
        c.beginPath();
        c.ellipse(fx.x, fx.y, fx.r * k, ry * k, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = danger ? 0.95 : 0.7;
        c.strokeStyle = danger ? '#ffffff' : col;
        c.beginPath();
        c.ellipse(fx.x, fx.y, fx.r, ry, 0, 0, Math.PI * 2);
        c.stroke();
        if (fx.shape === 'mark') {
          const locked = fx.t >= fx.delay - fx.lock;
          c.strokeStyle = locked ? '#ff3a3a' : col;
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(fx.x - fx.r * 0.5, fx.y);
          c.lineTo(fx.x + fx.r * 0.5, fx.y);
          c.moveTo(fx.x, fx.y - ry * 0.5);
          c.lineTo(fx.x, fx.y + ry * 0.5);
          c.stroke();
        }
        if (fx.meteor || fx.crystal) {
          // Objet qui tombe du ciel vers sa zone.
          const fall = (1 - k) * 420;
          c.globalAlpha = 0.9;
          c.fillStyle = fx.crystal ? '#e0c0ff' : '#ffb040';
          c.fillRect(fx.x - 9, fx.y - 40 - fall, 18, 18);
          c.fillStyle = '#ffffff';
          c.fillRect(fx.x - 4, fx.y - 36 - fall, 6, 6);
        }
      } else if (fx.shape === 'cone') {
        c.globalAlpha = fx.auto ? 0.1 : 0.16;
        c.fillStyle = col;
        wedge(c, fx.x, fx.y, fx.a, fx.w, fx.r);
        c.fill();
        c.globalAlpha = 0.34;
        wedge(c, fx.x, fx.y, fx.a, fx.w, fx.r * k);
        c.fill();
        c.globalAlpha = danger ? 0.95 : 0.7;
        c.strokeStyle = danger ? '#ffffff' : col;
        wedge(c, fx.x, fx.y, fx.a, fx.w, fx.r);
        c.stroke();
      } else if (fx.shape === 'line') {
        c.save();
        c.translate(fx.x, fx.y);
        c.rotate(fx.a);
        c.globalAlpha = 0.16;
        c.fillStyle = col;
        c.fillRect(0, -fx.w / 2, fx.len, fx.w);
        c.globalAlpha = 0.34;
        c.fillRect(0, -fx.w / 2, fx.len * k, fx.w);
        c.globalAlpha = danger ? 0.95 : 0.7;
        c.strokeStyle = danger ? '#ffffff' : col;
        c.strokeRect(0, -fx.w / 2, fx.len, fx.w);
        c.restore();
      }
    }
    // Ondes de choc.
    for (const ring of run.rings) {
      c.globalAlpha = 0.7;
      c.strokeStyle = ring.color;
      c.lineWidth = ring.w;
      c.beginPath();
      c.ellipse(ring.x, ring.y, ring.r, ring.r, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.9;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3;
      c.stroke();
    }
    c.restore();
  }
  function drawAir(c) {
    if (!run) return;
    c.save();
    const b = run.boss;
    // Rayons tournants.
    for (const sw of run.sweeps) {
      if (!b) break;
      c.save();
      c.translate(b.x, b.y - 30);
      c.rotate(sw.a);
      c.globalAlpha = 0.45;
      c.fillStyle = sw.color;
      c.fillRect(0, -sw.w / 2, sw.len, sw.w);
      c.globalAlpha = 0.9;
      c.fillStyle = '#ffffff';
      c.fillRect(0, -sw.w / 6, sw.len, sw.w / 3);
      c.restore();
      canaanLight(b.x + Math.cos(sw.a) * 200, b.y + Math.sin(sw.a) * 200, 200, sw.color);
    }
    // Bouclier de cristal et garde du chevalier.
    if (b && b.shieldHp > 0) {
      c.globalAlpha = 0.35 + Math.sin(time * 0.2) * 0.1;
      c.fillStyle = '#e0c0ff';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3;
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + time * 0.01;
        c.lineTo(b.x + Math.cos(a) * 110, b.y - 70 + Math.sin(a) * 120);
      }
      c.closePath();
      c.fill();
      c.globalAlpha = 0.8;
      c.stroke();
    }
    if (b && b.parryUntil > run.clock) {
      c.globalAlpha = 0.5 + Math.sin(time * 0.4) * 0.2;
      c.strokeStyle = '#b0e8ff';
      c.lineWidth = 5;
      c.beginPath();
      c.ellipse(b.x, b.y - 60, 80, 100, 0, 0, Math.PI * 2);
      c.stroke();
    }
    // Projectiles : orbe lumineux et traînée.
    for (const s of run.shots) {
      c.globalAlpha = 0.35;
      c.fillStyle = s.color;
      c.beginPath();
      c.arc(s.x - s.vx * 2, s.y - s.vy * 2, s.r * 0.8, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(s.x, s.y, s.r * 0.45, 0, Math.PI * 2);
      c.fill();
      canaanLight(s.x, s.y, 70, s.color);
    }
    // Éclairs et impacts.
    for (const f of run.flashes) {
      const k = f.life / f.max;
      c.globalAlpha = k * 0.8;
      if (f.bolt) {
        c.strokeStyle = '#ffffff';
        c.lineWidth = 4;
        c.beginPath();
        let x = f.x,
          y = f.y - 420;
        c.moveTo(x, y);
        for (let s = 1; s <= 7; s++) {
          x = f.x + (s < 7 ? Math.sin(s * 3.1 + f.x) * 26 : 0);
          y = f.y - 420 + s * 60;
          c.lineTo(x, y);
        }
        c.stroke();
        c.strokeStyle = f.color;
        c.lineWidth = 9;
        c.globalAlpha = k * 0.35;
        c.stroke();
      }
      canaanLight(f.x, f.y, f.r * 1.6, f.color);
      c.globalAlpha = k * 0.5;
      c.fillStyle = f.color;
      c.beginPath();
      c.ellipse(f.x, f.y, f.r * (1.1 - k * 0.3), f.r * (1.1 - k * 0.3), 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  // Interface : vague, compte à rebours, phase, Rubis obtenu et effets subis.
  function drawHud() {
    if (!run || !game.world.instance?.arena || !started) return;
    const c = ctx,
      tier = TIERS[Math.min(3, Math.floor((run.wave - 1) / 3))],
      wave = Math.min(WAVES, run.wave);
    c.save();
    c.textAlign = 'center';
    c.lineJoin = 'round';
    const text = (s, x, y, size, col, stroke = 5) => {
      c.font =
        'bold ' +
        size +
        'px ' +
        (size > 20 ? "'Palatino Linotype', Georgia, serif" : 'system-ui, sans-serif');
      c.lineWidth = stroke;
      c.strokeStyle = 'rgba(10,6,4,.9)';
      c.strokeText(s, x, y);
      c.fillStyle = col;
      c.fillText(s, x, y);
    };
    if (run.phase !== 'victory')
      text('⚔️ VAGUE ' + wave + ' / ' + WAVES + ' · ' + tier.toUpperCase(), W / 2, 118, 15, '#ffd36d', 4);
    // Bouclier de cristal : jauge sous la barre du boss.
    const b = run.boss;
    if (b && b.shieldHp > 0) {
      const w = Math.min(520, W - 40),
        x = (W - w) / 2;
      c.fillStyle = 'rgba(20,10,30,.85)';
      c.fillRect(x, 178, w, 8);
      c.fillStyle = '#e0c0ff';
      c.fillRect(x, 178, w * (b.shieldHp / b.shieldMax), 8);
    }
    if (run.phase === 'enter')
      text('Avance sur la piste pour commencer l’épreuve', W / 2, H * 0.3, 22, '#fff2cb');
    if (run.phase === 'countdown' || run.phase === 'rest') {
      const def = BOSSES[run.wave - 1],
        n = Math.ceil(run.timer);
      if (run.phase === 'rest') text('Vague terminée · +20 % PV et mana', W / 2, H * 0.24, 20, '#8fe3ae');
      text('Prochain boss : ' + def.name, W / 2, H * 0.3, 22, '#fff2cb');
      if (n > 0) text(String(n), W / 2, H * 0.3 + 64, 56, '#ffd36d', 7);
      else text('Entre sur la piste !', W / 2, H * 0.3 + 52, 24, '#ffd36d');
      if (run.phase === 'rest')
        text(
          '[E] au portail de l’antichambre pour quitter avec tes Rubis',
          W / 2,
          H * 0.3 + 96,
          14,
          '#d8c8a8',
          4
        );
    }
    if (run.phase === 'victory') {
      text('🏆 L’ARÈNE EST VAINCUE', W / 2, H * 0.26, 34, '#ffd36d', 7);
      text('Retourne au portail de l’antichambre [E]', W / 2, H * 0.26 + 40, 16, '#fff2cb', 4);
    }
    // Bandeau : Rubis obtenu ou nouvelle phase.
    if (run.banner && run.clock < run.banner.until) {
      const k = Math.min(1, (run.banner.until - run.clock) / 0.5),
        y = H * 0.66;
      c.globalAlpha = k;
      if (run.banner.id) {
        const r = CANAAN_RUBIS.get(run.banner.id),
          fam = CANAAN_RUBIS.families[r.family];
        c.fillStyle = 'rgba(18,12,8,.88)';
        c.fillRect(W / 2 - 230, y - 44, 460, 92);
        c.strokeStyle = fam.color;
        c.lineWidth = 3;
        c.strokeRect(W / 2 - 230, y - 44, 460, 92);
        drawRubisGem(c, W / 2 - 180, y + 2, 56, r.id);
        c.textAlign = 'left';
        text(
          '💎 RUBIS OBTENU' + (run.banner.fresh ? ' · NOUVEAU !' : ' · DOUBLON'),
          W / 2 - 140,
          y - 16,
          13,
          '#ffd36d',
          4
        );
        text(r.name, W / 2 - 140, y + 12, 24, fam.light, 5);
        text(fam.name + ' · N°' + String(r.n).padStart(2, '0'), W / 2 - 140, y + 34, 12, '#d8c8a8', 3);
        c.textAlign = 'center';
      } else text(run.banner.text, W / 2, y, 24, '#ffb347', 6);
      c.globalAlpha = 1;
    }
    // Effets subis par le héros de cette application.
    const status = [],
      mine = myStatus();
    if (mine.curse > run.clock) status.push('☠ Soins −60 % ' + Math.ceil(mine.curse - run.clock) + ' s');
    for (const [kind, until] of mine.dots)
      if (kind !== 'curse')
        status.push((kind === 'bleed' ? '🩸 Saignement ' : '🔥 Brûlure ') + Math.ceil(until - run.clock) + ' s');
    status.forEach((s, k) => text(s, W / 2, H - 170 - k * 20, 14, '#ffb0a0', 4));
    c.restore();
  }
  window.CanaanStages.drawArenaHud = drawHud;

  // ---------------------------------------------------------------- Coopératif : vue de l'arène pour les invités
  // Malédiction et effets sur la durée d'un héros (l'hôte par défaut) ; un invité lit ceux envoyés par l'hôte.
  function statusOf(hero) {
    return {
      curse: run.curse instanceof Map ? run.curse.get(hero) || 0 : 0,
      dots: run.dots.filter(d => d.hero === hero).map(d => [d.kind, d.until])
    };
  }
  function myStatus() {
    return run.remote ? run.mine || { curse: 0, dots: [] } : statusOf(game.hero);
  }
  // Héros à terre et progression de leur réanimation (anneau dessiné au sol).
  function downs() {
    if (run.remote) return run.downs || [];
    return inArena()
      .filter(hero => hero.player.dead)
      .map(hero => ({ x: hero.player.x, y: hero.player.y, p: (run.revives.get(hero) || 0) / REVIVE.seconds }));
  }
  const pick = (o, keys) => {
    const out = {};
    for (const k of keys) if (o[k] !== undefined) out[k] = typeof o[k] === 'number' ? Math.round(o[k] * 100) / 100 : o[k];
    return out;
  };
  // Ce qu'un invité doit dessiner : tout sauf les fonctions et les héros visés (idOf : identifiant réseau d'un héros).
  function view(idOf) {
    if (!active()) return null;
    const status = {},
      banners = {};
    for (const hero of inArena()) {
      status[idOf(hero)] = statusOf(hero);
      const own = hero === game.hero ? run.banner : run.banners?.get(hero);
      if (own) banners[idOf(hero)] = own;
    }
    return {
      wave: run.wave,
      phase: run.phase,
      timer: Math.round(run.timer * 100) / 100,
      clock: Math.round(run.clock * 100) / 100,
      cheerUntil: run.cheerUntil,
      gate: run.phase === 'fight',
      boss: run.boss ? { k: run.boss.netId, shieldHp: run.boss.shieldHp || 0, parryUntil: run.boss.parryUntil || 0, phase: run.boss.phase, wave: run.boss.wave } : null,
      fx: run.fx.slice(0, 60).map(fx => pick(fx, ['shape', 'x', 'y', 'a', 'w', 'r', 'len', 't', 'delay', 'color', 'lock', 'auto', 'meteor', 'crystal'])),
      rings: run.rings.slice(0, 20).map(r => pick(r, ['x', 'y', 'r', 'w', 'speed', 'max', 'color'])),
      hazards: run.hazards.slice(0, 40).map(hz => pick(hz, ['x', 'y', 'r', 'until', 'color', 'kind'])),
      shots: run.shots.slice(0, 60).map(sh => pick(sh, ['x', 'y', 'vx', 'vy', 'r', 'color'])),
      sweeps: run.sweeps.slice(0, 8).map(sw => pick(sw, ['a', 'speed', 'len', 'w', 'color', 'until'])),
      flashes: run.flashes.slice(0, 30).map(f => pick(f, ['x', 'y', 'r', 'color', 'life', 'max', 'bolt'])),
      banner: run.banner && !run.banner.id ? run.banner : null,
      banners,
      status,
      downs: downs()
    };
  }
  // Invité : la vue reçue devient sa tentative affichée (aucune simulation) ; myId est l'identifiant de son héros.
  function applyView(v, myId) {
    if (!v || typeof v !== 'object' || !game.world.instance?.arena) {
      run = null;
      return;
    }
    const list = k => (Array.isArray(v[k]) ? v[k] : []);
    const wave = Math.max(1, Math.min(WAVES, v.wave | 0));
    run = {
      remote: true,
      wave,
      phase: ['enter', 'countdown', 'rest', 'fight', 'victory'].includes(v.phase) ? v.phase : 'enter',
      timer: +v.timer || 0,
      clock: +v.clock || 0,
      cheerUntil: +v.cheerUntil || 0,
      fx: list('fx'),
      rings: list('rings'),
      hazards: list('hazards'),
      shots: list('shots'),
      sweeps: list('sweeps'),
      flashes: list('flashes'),
      timers: [],
      dots: [],
      banner: (v.banners && v.banners[myId]) || v.banner || null,
      mine: v.status && v.status[myId] ? v.status[myId] : { curse: 0, dots: [] },
      downs: list('downs'),
      boss: null
    };
    if (v.boss) {
      const b = game.world.monsters.find(m => m.k === v.boss.k);
      if (b) {
        Object.assign(b, { shieldHp: +v.boss.shieldHp || 0, parryUntil: +v.boss.parryUntil || 0, phase: v.boss.phase | 0, wave, def: BOSSES[wave - 1] });
        run.boss = b;
      }
    }
    setGate(!!v.gate);
  }
  // Invité : entre deux vues, les annonces se remplissent et les projectiles avancent, pour un rendu fluide.
  function advanceView(dt) {
    if (!run?.remote) return;
    run.clock += dt;
    run.timer = Math.max(0, run.timer - dt);
    for (const fx of run.fx) fx.t = Math.min(fx.delay, (fx.t || 0) + dt);
    for (const sh of run.shots) {
      sh.x += sh.vx || 0;
      sh.y += sh.vy || 0;
    }
    for (const r of run.rings) r.r += r.speed || 0;
    for (const sw of run.sweeps) sw.a += (sw.speed || 0) * dt;
    for (const f of run.flashes) f.life -= dt;
    run.flashes = run.flashes.filter(f => f.life > 0);
  }

  // ---------------------------------------------------------------- Portail et récompense finale
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  function openArenaPortal() {
    const rubis = window.CANAAN_RUBIS,
      row = (label, value) =>
        '<div class="arena-record"><span>' + label + '</span><b>' + value + '</b></div>';
    let html =
      '<h2>⚔️ ' +
      esc(CANAAN_ARENA_NAME) +
      '</h2><p class="arena-motto">« L’Arène est ouverte à tous. La victoire, elle, se mérite. »</p>' +
      '<div class="arena-layout"><div class="arena-board"><h3>🏆 Tableau des records</h3>' +
      row('Meilleure vague', records().best + ' / ' + WAVES) +
      row('Rubis découverts', rubis.discovered() + ' / 48') +
      row('Tentatives effectuées', records().attempts) +
      row('Arène terminée', records().completed ? 'Oui' : 'Non') +
      row('Dernier boss vaincu', records().lastBoss ? esc(records().lastBoss) : '—') +
      '<h3>📜 Règles</h3><ul class="arena-rules">' +
      '<li>12 vagues, un boss par vague, difficulté fixe dès la vague 1.</li>' +
      '<li>Aucun niveau minimum : la difficulté ne s’adapte jamais à ton équipement.</li>' +
      '<li>1 Rubis garanti par boss vaincu, en priorité un Rubis que tu ne possèdes pas.</li>' +
      '<li>Entre deux vagues : +20 % des PV et du mana, 10 s de répit.</li>' +
      '<li>Équipement et Rubis se préparent avant d’entrer.</li>' +
      '<li>Abandon possible entre les vagues ; la mort met fin à la tentative. Les Rubis gagnés sont conservés.</li>' +
      '<li>Les attaques majeures sont annoncées au sol : <b>Maj</b> ou <b>Espace</b> pour une roulade.</li>' +
      '</ul></div><div class="arena-bosses"><h3>👑 Les douze épreuves</h3>';
    BOSSES.forEach((def, k) => {
      if (k % 3 === 0) html += '<div class="arena-tier">' + TIERS[k / 3] + '</div>';
      const done = records().best > k;
      html +=
        '<div class="arena-boss' +
        (done ? ' done' : '') +
        '"><span>' +
        (k + 1) +
        '</span><b>' +
        esc(def.name) +
        '</b><em>' +
        (done ? '✔' : '') +
        '</em></div>';
    });
    html += '</div></div>';
    if (records().pendingChoice)
      html +=
        '<p class="arena-choice-note">🎁 Ta récompense finale t’attend : choisis un Rubis.</p>' +
        choiceList();
    html +=
      '<div class="arena-actions"><button type="button" data-action="enterArena"' +
      (game.world.instance ? ' disabled' : '') +
      '>⚔️ Entrer dans l’Arène</button><button type="button" data-action="renderCharacter">💎 Préparer mes Rubis</button></div>';
    showPanel(html);
  }
  function choiceList() {
    return (
      '<div class="arena-choice">' +
      CANAAN_RUBIS.missing()
        .map(
          r =>
            '<button type="button" data-action="claimArenaRubis" data-rubis="' +
            r.id +
            '" data-tooltip-rubis="' +
            r.id +
            '">' +
            r.icon +
            ' ' +
            esc(r.name) +
            '</button>'
        )
        .join('') +
      '</div>'
    );
  }
  // Récompense spéciale de la vague 12 : un Rubis au choix parmi ceux qui manquent.
  function openFinalChoice() {
    if (!records().pendingChoice) return;
    showPanel(
      '<h2>🏆 Le Souverain est tombé</h2><p>Récompense finale : choisis un Rubis que tu ne possèdes pas encore.</p>' +
        choiceList()
    );
  }
  function claimArenaRubis(id) {
    const r = CANAAN_RUBIS.get(id);
    if (!records().pendingChoice || !r || CANAAN_RUBIS.owned(id)) return false;
    CANAAN_RUBIS.grant(id);
    records().pendingChoice = false;
    hideGearTooltip();
    closePanels();
    toast('💎 Récompense finale : ' + r.name);
    if (run) run.banner = { id, fresh: true, until: run.clock + 5 };
    saveGame();
    return true;
  }

  // ---------------------------------------------------------------- Accès publics
  window.CANAAN_ARENA = Object.freeze({
    waves: WAVES,
    bosses: BOSSES.map(b => b.name),
    hpMult: HP_MULT,
    tempo,
    dmgMult: DMG_MULT,
    group: GROUP,
    base: BASE,
    fighting: () => active() && run.phase === 'fight',
    // Héros encore debout dans le colisée.
    standing: () => (active() ? fighters().length : 0),
    // Malédiction : soins −60 % pour le héros maudit (l'hôte par défaut).
    healFactor: (hero = game.hero) => (active() && run.curse instanceof Map && (run.curse.get(hero) || 0) > run.clock ? 0.4 : 1),
    // Malus subis dans l'Arène (barre des effets) : secondes restantes de la malédiction et des effets sur la durée.
    effects() {
      if (!run || (!run.remote && !active())) return { curse: 0, dots: [] };
      const s = myStatus(),
        c = run.clock || 0;
      return { curse: Math.max(0, (s.curse || 0) - c), dots: (s.dots || []).map(([k, u]) => [k, Math.max(0, u - c)]).filter(d => d[1] > 0) };
    },
    cheer: () => (run && run.cheerUntil > run.clock ? Math.min(1, run.cheerUntil - run.clock) : 0),
    entities: () => (run ? run.shots : []),
    run: () => run,
    state: () => ({ ...records() }),
    frameLabel(m) {
      const n = m.def?.phases.length || 1;
      return 'Vague ' + m.wave + '/' + WAVES + (n > 1 ? ' · Phase ' + (m.phase + 1) + '/' + n : '');
    },
    // Joue un mouvement précis sur le boss en cours (vérifications et tests).
    playMove(name) {
      if (!alive() || !MOVES[name]) return false;
      MOVES[name](run.boss, {});
      return true;
    },
    onBossDown,
    onBossHurt,
    view,
    applyView,
    advanceView,
    onLeave,
    interact,
    drawGround,
    drawAir,
    // Contrôle : chaque mouvement existe, chaque boss a ses phases dans l'ordre.
    audit: () => ({
      waves: BOSSES.length,
      missingMoves: BOSSES.flatMap(b => b.phases.flatMap(p => p.moves.map(([n]) => n))).filter(
        n => !MOVES[n]
      ),
      phases: BOSSES.map(b => b.phases.length),
      ordered: BOSSES.every(b => b.phases.every((p, i) => !i || p.hp < b.phases[i - 1].hp))
    })
  });
  Object.assign(window, { enterArena, openArenaPortal, claimArenaRubis });
})();
