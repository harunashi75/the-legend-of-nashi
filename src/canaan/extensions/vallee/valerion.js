// Extension 1 — la Vallée des Héros : Valérion, le Dernier Champion, boss mondial de l'Arène de Valérion.
// Un ancien champion en armure dorée, à la grande hallebarde, qui met les aventuriers à l'épreuve (il n'est pas
// maléfique). Combat en plein air, possible seul mais très exigeant, prévu pour le coopératif. La difficulté vient des
// mécaniques, toutes annoncées au sol avant de frapper (au moins 0,8 s), pas d'une montagne de PV.
// - Phase 1 (100 à 70 % des PV) — L'épreuve du champion : balayage de hallebarde (cône devant lui), charge (ligne,
//   puis il fonce), frappe au sol (cercle sous un héros).
// - Phase 2 (70 à 40 %) — Le jugement des statues : les quatre statues de l'arène s'éveillent et tirent des rayons
//   qui traversent l'arène (on se place entre eux) ; puis le Jugement solaire : toute l'arène brûle, sauf derrière
//   les statues (cercles verts, du côté opposé à Valérion).
// - Phase 3 (40 à 0 %) — La dernière lumière : plus rapide, ondes de choc successives (anneaux qui s'éloignent de
//   lui), explosions de lumière, et l'incantation de la Dernière Lumière (6 s) : l'activation de deux sceaux de
//   statues différentes (E) l'interrompt ; il reste alors étourdi et vulnérable 4 s. Sinon, la lumière submerge tout.
// - Riposte (toutes les phases) : un cercle autour de lui ; on ne reste pas collé à lui. En phase 2 et 3, la charge
//   s'enchaîne trois fois ; en phase 3, la frappe au sol poursuit sa cible trois fois.
// - Dégâts en part des PV max du héros touché (la Défense et la Résistance n'en retirent qu'un quart au plus) :
//   environ un tiers par coup, la Dernière Lumière et le Jugement solaire sont mortels. Seules la roulade et le bon
//   placement protègent. Colère du Champion après 7 minutes de combat : attaques plus rapides, +40 % de dégâts.
// - PV selon le nombre de participants : cinq fois ceux d'un boss de raid de niveau 60 seul (environ 4 minutes pour
//   un héros bien équipé), +75 % par héros en plus (jamais réduits pendant un combat). Plus personne dans l'arène
//   pendant 4 s : il se relève et retourne à sa garde.
// - Butin : chaque participant éligible (il a frappé Valérion et se trouve à moins de 20 cases à sa chute) reçoit sa
//   bourse d'or, une pièce Épique de niveau 60 et tire seul sa chance de 11 % d'une pièce Mythique de niveau 63
//   (niveau requis 60 : le meilleur butin de l'extension ; pièce au hasard parmi les neuf emplacements d'équipement). Réapparition 15 minutes après sa chute.
(() => {
  'use strict';
  const DEF = canaanExtension('vallee').worldBosses.find(b => b.id === 'valerion');
  const T = TS;
  const RESPAWN_MS = 15 * 60 * 1000;
  const MYTHIC = 0.11;
  const MYTHIC_LEVEL = 63; // au-dessus du niveau maximal : se porte dès le niveau 60 (requiredLevel)
  const R = 9; // rayon de l'arène, en cases
  const HP_MULT = 5; // PV : cinq boss de raid de niveau 60
  const ENRAGE = 7 * 60 * 60; // Colère du Champion : après 7 minutes de combat (ticks)
  const baseHp = () => Math.round(bossHealth(60, 'raid') * HP_MULT);
  const KINDS = ['cone', 'line', 'circle', 'beam', 'ring', 'shelter'];
  const now = () => time;
  let arena = null;
  let zones = [],
    shown = [],
    volley = 0;
  const volleyHits = new Map();
  // État visible (hôte, puis envoyé aux invités) : statues (0 endormie, 1 éveillée, 2 sceau activé), incantation.
  let statues = [0, 0, 0, 0],
    cast = null;
  let shownStatues = [0, 0, 0, 0],
    shownCast = null;

  const center = () => ({ x: (arena.x + 0.5) * T, y: (arena.y + 0.5) * T });
  const statuePx = i => ({ x: (arena.statues[i].x + 0.5) * T, y: (arena.statues[i].y + 0.6) * T });
  const boss = () => game.world.monsters.find(m => m.worldBossId === 'valerion' && m.hp > 0) || null;
  const inArena = (p, extra = 0) => {
    const c = center();
    return Math.hypot(p.x - c.x, p.y - c.y) < (R + extra) * T;
  };
  const fighters = (extra = 1) =>
    game.heroes.filter(h => !h.player.dead && !h.away && inArena(h.player, extra));
  function say(m, text, col = '#ffd86a') {
    float(m.x, m.y - 96, text, col);
    for (const h of game.heroes) if (inArena(h.player, 8)) canaanLootNotice(h, text);
  }
  // Coup d'une mécanique : une part (pct) des PV max du héros. La Défense et la Résistance n'en retirent qu'un quart
  // au plus : l'équipement ne suffit pas, il faut esquiver. La roulade (invulnérable) évite tout.
  function hurt(m, hero, pct) {
    const p = hero.player;
    if (CANAAN_COMBAT.invulnerable(hero)) {
      float(p.x, p.y - 35, 'ESQUIVE !', '#87f8f4');
      return;
    }
    const soften = 0.75 + 0.25 * canaanDamageTaken(hero, 60),
      rage = m.fight?.enraged ? 1.4 : 1;
    CANAAN_COMBAT.hurt(p.mhp * pct * soften * rage, m, hero);
  }

  // ---------------------------------------------------------------- Apparition et garde
  function spawn() {
    const c = center(),
      base = baseHp();
    const m = {
      x: c.x,
      y: c.y,
      hp: base,
      mhp: base,
      _scaledMaxHp: base,
      t: DEF.name,
      r: 32,
      cd: 9,
      g: 1600,
      level: 60,
      bossLevel: 60,
      bossColor: DEF.color,
      worldBoss: true,
      worldBossId: 'valerion',
      ext: 'vallee',
      customHp: true,
      onHurt
    };
    m.fight = fresh(base);
    game.world.monsters.push(m);
    return m;
  }
  function fresh(base) {
    return { on: false, phase: 1, next: 0, k: 0, base, n: 1, away: 0, contrib: new Map(), last: 0 };
  }
  // Retour à la garde : PV pleins, au centre, statues endormies, zones effacées.
  function reset(m) {
    const c = center();
    m.x = c.x;
    m.y = c.y;
    m.mhp = m.hp = m._scaledMaxHp = m.fight.base;
    m.fight = fresh(m.fight.base);
    m.castUntil = 0;
    m.exposedUntil = 0;
    zones = [];
    statues = [0, 0, 0, 0];
    cast = null;
    float(m.x, m.y - 96, '🛡️ ' + tt('Valérion retourne à sa garde.'), '#f6dc98');
  }
  // Chaque coup reçu : le combat commence, le héros compte comme participant ; étourdi, il prend 30 % de plus.
  function onHurt(value, hero) {
    const m = this && this.fight ? this : boss();
    if (!m) return value;
    if (!m.fight.on) engage(m);
    m.fight.contrib.set(hero, (m.fight.contrib.get(hero) || 0) + value);
    return m.exposedUntil > now() ? Math.round(value * 1.3) : value;
  }
  function engage(m) {
    m.fight.on = true;
    m.fight.next = now() + 90;
    m.fight.started = now();
    say(m, '⚔️ ' + tt('« Montre-moi ce que vaut ton courage. »'));
  }
  // PV selon le nombre de participants présents (jamais réduits pendant le combat).
  function scale(m) {
    const n = Math.max(m.fight.n, fighters(2).length);
    if (n === m.fight.n && m.mhp) return;
    const ratio = m.hp / m.mhp;
    m.fight.n = n;
    m.mhp = m._scaledMaxHp = Math.round(m.fight.base * (1 + 0.75 * (n - 1)));
    m.hp = Math.max(1, Math.round(m.mhp * ratio));
  }

  // ---------------------------------------------------------------- Mécaniques
  function add(z) {
    z.start = now();
    zones.push(z);
    return z;
  }
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const aimAt = (m, h) => Math.atan2(h.player.y - m.y, h.player.x - m.x);
  const root = (m, frames) => (m.castUntil = Math.max(m.castUntil || 0, now() + frames));
  function leap(m) {
    const c = center();
    burst(m.x, m.y, '#ffd86a', 18);
    m.x = c.x;
    m.y = c.y;
    burst(m.x, m.y, '#ffd86a', 26);
    shake = Math.max(shake, 5);
  }
  const CAST = {
    // Balayage : un large cône devant lui, vers un héros.
    sweep(m, tg) {
      const h = pick(tg);
      root(m, 60);
      add({ kind: 'cone', x: m.x, y: m.y, a: aimAt(m, h), r: 3.8 * T, w: 1.15, at: now() + 54, pct: 0.38 });
      say(m, '⚠️ ' + tt('Balayage de hallebarde !'), '#ffb070');
    },
    // Charge : une ligne vers un héros, puis il fonce jusqu'au bout (ou jusqu'au bord de l'arène). En phase 2 et 3,
    // il recharge aussitôt deux fois vers un héros (strike).
    charge(m, tg) {
      const h = pick(tg);
      root(m, 64);
      add(chargeZone(m, h, 60, m.fight?.phase >= 2 ? 3 : 1));
      say(m, '⚠️ ' + tt('Charge du champion !'), '#ffb070');
    },
    // Frappe au sol : un cercle sous un héros ; en phase 3, elle le poursuit trois fois (strike).
    slam(m, tg) {
      const h = pick(tg);
      root(m, 50);
      add({
        kind: 'circle',
        x: h.player.x,
        y: h.player.y,
        r: 2.1 * T,
        at: now() + 66,
        pct: 0.4,
        follow: m.fight?.phase >= 3 ? h : null,
        repeat: m.fight?.phase >= 3 ? 3 : 1
      });
      say(m, '⚠️ ' + tt('Frappe au sol !'), '#ffb070');
    },
    // Riposte : un cercle autour de lui ; personne ne reste collé au champion.
    riposte(m) {
      root(m, 56);
      add({ kind: 'circle', x: m.x, y: m.y, r: 2.6 * T, at: now() + 50, pct: 0.35 });
      say(m, '⚠️ ' + tt('Riposte du champion !'), '#ffb070');
    },
    // Rayons des statues éveillées : chacune traverse l'arène, un peu de biais ; on se place entre eux.
    beams(m) {
      const c = center();
      arena.statues.forEach((_, i) => {
        const s = statuePx(i),
          a = Math.atan2(c.y - s.y, c.x - s.x) + (Math.random() - 0.5) * 0.7;
        add({
          kind: 'beam',
          x: s.x,
          y: s.y - 40,
          a,
          len: 2 * R * T,
          w: 0.55 * T,
          at: now() + 72,
          until: now() + 72 + 130,
          pct: 0.12,
          tick: 0
        });
      });
      say(m, '☀️ ' + tt('Les statues projettent leurs rayons !'));
    },
    // Jugement solaire : toute l'arène, sauf derrière les statues (côté opposé à Valérion, revenu au centre).
    judgement(m) {
      leap(m);
      root(m, 220);
      const c = center(),
        vol = ++volley;
      arena.statues.forEach((_, i) => {
        const s = statuePx(i),
          d = Math.hypot(s.x - c.x, s.y - c.y) || 1;
        add({
          kind: 'shelter',
          x: s.x + ((s.x - c.x) / d) * 1.15 * T,
          y: s.y + ((s.y - c.y) / d) * 1.15 * T,
          r: 1.15 * T,
          at: now() + 210,
          pct: 1.2,
          vol
        });
      });
      cast = { name: 'Jugement solaire', at: now() + 210, total: 210 };
      say(m, '☀️ ' + tt('Jugement solaire : abritez-vous derrière les statues !'), '#ffe88a');
    },
    // Ondes de choc : trois anneaux qui s'éloignent de lui l'un après l'autre.
    shockwave(m) {
      root(m, 140);
      for (let i = 0; i < 3; i++) {
        const r0 = (1.2 + 2.4 * i) * T;
        add({ kind: 'ring', x: m.x, y: m.y, r0, r: r0 + 1.5 * T, at: now() + 66 + 32 * i, pct: 0.35 });
      }
      say(m, '⚠️ ' + tt('Ondes de choc !'), '#ffb070');
    },
    // Explosions de lumière : sous chaque héros, et ailleurs dans l'arène.
    burst(m, tg) {
      const c = center(),
        vol = ++volley;
      for (const h of tg)
        add({ kind: 'circle', x: h.player.x, y: h.player.y, r: 1.6 * T, at: now() + 76, pct: 0.3, vol });
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2,
          d = Math.random() * (R - 2) * T;
        add({
          kind: 'circle',
          x: c.x + Math.cos(a) * d,
          y: c.y + Math.sin(a) * d,
          r: 1.6 * T,
          at: now() + 76,
          pct: 0.3,
          vol
        });
      }
      say(m, '✨ ' + tt('Explosions de lumière !'), '#fff4b0');
    },
    // La Dernière Lumière : 6 s ; deux sceaux de statues différentes l'interrompent.
    incant(m) {
      leap(m);
      root(m, 370);
      statues = statues.map(() => 1);
      cast = { name: 'La Dernière Lumière', at: now() + 360, total: 360, seals: [] };
      say(m, '🌟 ' + tt('La Dernière Lumière : activez deux sceaux des statues (E) !'), '#ffe88a');
    }
  };
  const ROTATION = {
    1: ['sweep', 'riposte', 'charge', 'slam', 'sweep', 'riposte', 'slam', 'charge'],
    2: ['beams', 'sweep', 'riposte', 'charge', 'judgement', 'slam', 'beams', 'riposte', 'sweep', 'charge'],
    3: ['riposte', 'shockwave', 'burst', 'charge', 'incant', 'slam', 'beams', 'riposte', 'burst', 'judgement']
  };
  const PERIOD = { 1: 120, 2: 110, 3: 90 };
  // Ligne de charge depuis Valérion vers un héros ; chain : charges restantes, celle-ci comprise.
  function chargeZone(m, h, delay, chain) {
    return {
      kind: 'line',
      x: m.x,
      y: m.y,
      a: aimAt(m, h),
      len: 8 * T,
      w: 0.7 * T,
      at: now() + delay,
      pct: 0.45,
      charge: true,
      chain
    };
  }
  // Sceau d'une statue (E près d'elle) pendant la Dernière Lumière.
  function canSeal(i) {
    return !!cast?.seals && statues[i] === 1;
  }
  function seal(i, hero) {
    const m = boss();
    if (!m || !canSeal(i) || !arena.statues[i]) return false;
    const s = statuePx(i);
    if (Math.hypot(hero.player.x - s.x, hero.player.y - s.y) > 2.2 * T) return false;
    statues[i] = 2;
    cast.seals.push(i);
    burst(s.x, s.y - 60, '#ffe88a', 20);
    canaanLootNotice(hero, '☀️ ' + tt('Sceau activé !'));
    if (cast.seals.length >= 2) {
      // Interrompu : étourdi et vulnérable 4 s.
      cast = null;
      m.castUntil = now() + 240;
      m.exposedUntil = now() + 240;
      statues = statues.map(v => (v ? 1 : 0));
      say(m, '💥 ' + tt('Les sceaux brisent l’incantation : Valérion vacille !'), '#ffffff');
      shake = Math.max(shake, 8);
    }
    return true;
  }
  // Un point est-il dans la zone ?
  function inside(z, x, y) {
    const dx = x - z.x,
      dy = y - z.y,
      d = Math.hypot(dx, dy);
    switch (z.kind) {
      case 'cone': {
        const diff = Math.abs(
          Math.atan2(Math.sin(Math.atan2(dy, dx) - z.a), Math.cos(Math.atan2(dy, dx) - z.a))
        );
        return d < z.r && diff < z.w;
      }
      case 'line':
      case 'beam': {
        const ax = Math.cos(z.a),
          ay = Math.sin(z.a),
          along = dx * ax + dy * ay,
          side = Math.abs(-dx * ay + dy * ax);
        return along > -z.w && along < z.len && side < z.w;
      }
      case 'ring':
        return d > z.r0 && d < z.r;
      default:
        return d < z.r;
    }
  }
  function strike(z, m) {
    const heroes = fighters(1.5);
    if (z.kind === 'shelter') {
      // Jugement : une seule frappe pour tous les abris ; touché qui n'est dans aucun.
      if (volleyHits.has(z.vol)) return;
      volleyHits.set(z.vol, true);
      const safe = zones.filter(o => o.vol === z.vol).concat(z);
      for (const h of heroes) if (!safe.some(o => inside(o, h.player.x, h.player.y))) hurt(m, h, z.pct);
      cast = null;
      burst(m.x, m.y, '#fff4b0', 40);
      shake = Math.max(shake, 10);
      return;
    }
    const seen = z.vol ? volleyHits.get(z.vol) || new Set() : null;
    for (const h of heroes) {
      if (!inside(z, h.player.x, h.player.y) || seen?.has(h)) continue;
      seen?.add(h);
      hurt(m, h, z.pct);
    }
    if (seen) volleyHits.set(z.vol, seen);
    if (volleyHits.size > 30) volleyHits.delete(volleyHits.keys().next().value);
    burst(z.x, z.y, z.kind === 'ring' ? '#ffe08a' : '#ff8a4a', 16);
    if (z.charge) {
      const ax = Math.cos(z.a),
        ay = Math.sin(z.a);
      for (let d = 0; d < z.len; d += 12) {
        const nx = m.x + ax * 12,
          ny = m.y + ay * 12;
        if (!inArena({ x: nx, y: ny }, -1)) break;
        m.x = nx;
        m.y = ny;
      }
      shake = Math.max(shake, 6);
      // Charge enchaînée : il se retourne aussitôt vers un héros.
      const tg = fighters(1);
      if (z.chain > 1 && tg.length) {
        root(m, 54);
        add(chargeZone(m, pick(tg), 48, z.chain - 1));
      }
    }
    // Frappe poursuivante : la suivante tombe là où se trouve sa cible.
    if (z.follow && z.repeat > 1 && fighters(1).includes(z.follow)) {
      root(m, 54);
      add({ ...z, x: z.follow.player.x, y: z.follow.player.y, at: now() + 48, repeat: z.repeat - 1 });
    }
  }
  function tickZones(m) {
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i];
      if (now() < z.at) continue;
      if (z.until) {
        if (now() >= z.until) zones.splice(i, 1);
        else if (now() >= z.tick) {
          z.tick = now() + 20;
          for (const h of fighters(1.5)) if (inside(z, h.player.x, h.player.y)) hurt(m, h, z.pct);
        }
        continue;
      }
      strike(z, m);
      zones.splice(i, 1);
    }
    // Dernière Lumière non interrompue : elle submerge l'arène.
    if (cast?.seals && now() >= cast.at) {
      cast = null;
      for (const h of fighters(1.5)) hurt(m, h, 1.6);
      statues = statues.map(v => (v ? 1 : 0));
      say(m, '🌟 ' + tt('La Dernière Lumière submerge l’arène !'), '#ffffff');
      burst(m.x, m.y, '#ffffff', 50);
      shake = Math.max(shake, 12);
    }
  }
  function step() {
    if (!arena || game.mode === 'guest') return;
    if (game.world.instance || game.world.layer === 'under') {
      zones = [];
      return;
    }
    const m = boss();
    if (!m) {
      zones = [];
      cast = null;
      statues = [0, 0, 0, 0];
      return;
    }
    m.fight ||= fresh(baseHp());
    m.onHurt ||= onHurt;
    // Valérion ne frappe qu'avec ses mécaniques annoncées (pas d'attaque surprise au contact).
    m.cd = 9;
    const f = m.fight,
      tg = fighters(1);
    if (!f.on) {
      root(m, 30);
      if (tg.length) engage(m);
      return;
    }
    // Plus personne dans l'arène pendant 4 s : retour à sa garde.
    if (!fighters(4).length) {
      if (++f.away > 240) reset(m);
      return;
    }
    f.away = 0;
    scale(m);
    // Laisse : il ne quitte jamais son arène.
    const c = center(),
      d = Math.hypot(m.x - c.x, m.y - c.y);
    if (d > (R - 1.5) * T) {
      m.x = c.x + ((m.x - c.x) / d) * (R - 1.5) * T;
      m.y = c.y + ((m.y - c.y) / d) * (R - 1.5) * T;
    }
    const ratio = m.hp / m.mhp;
    if (f.phase === 1 && ratio <= 0.7) {
      f.phase = 2;
      f.k = 0;
      statues = [1, 1, 1, 1];
      say(m, '☀️ ' + tt('Phase 2 — Le jugement des statues !'), '#ffe88a');
    } else if (f.phase === 2 && ratio <= 0.4) {
      f.phase = 3;
      f.k = 0;
      say(m, '🌟 ' + tt('Phase 3 — La dernière lumière !'), '#ffe88a');
    }
    // Colère du Champion : combat trop long, il frappe plus vite et plus fort.
    if (!f.enraged && now() - f.started > ENRAGE) {
      f.enraged = true;
      say(m, '🔥 ' + tt('La colère du Champion : Valérion s’embrase !'), '#ff7a3a');
    }
    if (tg.length && now() >= f.next && !(m.castUntil > now()) && !cast) {
      f.next = now() + Math.round(PERIOD[f.phase] * (f.enraged ? 0.75 : 1));
      const list = ROTATION[f.phase];
      CAST[list[f.k++ % list.length]](m, tg);
    }
    tickZones(m);
  }

  // Au rythme des boss mondiaux de l'île (spawnWorldBosses) : il reparaît au centre de son arène, délai écoulé.
  function spawnBosses() {
    if (!arena || game.mode === 'guest' || game.world.layer === 'under' || boss()) return;
    if ((game.world.worldBossTimers.valerion || 0) <= Date.now()) spawn();
  }

  // ---------------------------------------------------------------- Récompense
  function bossKilled(m, killer) {
    if (m.worldBossId !== 'valerion') return false;
    game.world.worldBossTimers.valerion = Date.now() + RESPAWN_MS;
    zones = [];
    cast = null;
    statues = [0, 0, 0, 0];
    const eligible = [...(m.fight?.contrib || new Map()).entries()]
      .filter(
        ([h, dmg]) =>
          dmg > 0 && game.heroes.includes(h) && Math.hypot(h.player.x - m.x, h.player.y - m.y) < 20 * T
      )
      .map(([h]) => h);
    if (!eligible.includes(killer)) eligible.push(killer);
    const slots = Object.keys(gearSlots).filter(s => s !== 'weapon2');
    let mythics = 0;
    for (const hero of eligible) {
      const gold = 900 + Math.floor(Math.random() * 401);
      hero.player.gold += gold;
      giveGear(60, 'worldBoss', 'Épique', hero);
      // Tirage individuel et indépendant : 11 % par victoire, pour chaque participant.
      if (Math.random() < MYTHIC) {
        mythics++;
        const item = giveGear(
          MYTHIC_LEVEL,
          'worldBoss',
          'Mythique',
          hero,
          slots[Math.floor(Math.random() * slots.length)]
        );
        canaanLootNotice(hero, '🌟 ' + tt('Pièce Mythique !') + (item ? ' ' + item.name : ''));
        chat('Boss mondial', hero.name ? hero.name + ' — ' + tt('Pièce Mythique !') : tt('Pièce Mythique !'));
      }
      canaanLootNotice(hero, '🏆 ' + tt('Valérion vaincu : +{or} or et une pièce Épique !', { or: gold }));
    }
    chat(
      'Boss mondial',
      tt(
        '« Vous êtes dignes, héros… » Valérion s’incline. {n} pièce(s) Mythique(s) ce combat. Réapparition dans 15 minutes.',
        {
          n: mythics
        }
      )
    );
    saveGame();
    return true;
  }

  // ---------------------------------------------------------------- Dessin (hôte et invités)
  const COLOR = { shelter: '#5aff8a' };
  function drawZone(c, z, k) {
    const col = COLOR[z.kind] || '#ff3a1a';
    c.fillStyle = col;
    c.strokeStyle = col === '#ff3a1a' ? '#ff7a4a' : '#d8ffe0';
    c.lineWidth = 3;
    if (z.kind === 'cone') {
      c.globalAlpha = 0.14 + 0.28 * k;
      c.beginPath();
      c.moveTo(z.x, z.y);
      c.arc(z.x, z.y, z.r * (0.25 + 0.75 * k), z.a - z.w, z.a + z.w);
      c.closePath();
      c.fill();
      c.globalAlpha = 0.85;
      c.beginPath();
      c.moveTo(z.x, z.y);
      c.arc(z.x, z.y, z.r, z.a - z.w, z.a + z.w);
      c.closePath();
      c.stroke();
      return;
    }
    if (z.kind === 'line' || z.kind === 'beam') {
      c.save();
      c.translate(z.x, z.y);
      c.rotate(z.a);
      if (z.kind === 'beam' && now() >= z.at) {
        c.globalAlpha = 0.7;
        c.fillStyle = '#ffd36a';
        c.fillRect(0, -z.w, z.len, z.w * 2);
        c.globalAlpha = 0.95;
        c.fillStyle = '#ffffff';
        c.fillRect(0, -z.w * 0.3, z.len, z.w * 0.6);
      } else {
        c.globalAlpha = 0.14 + 0.3 * k;
        c.fillStyle = z.kind === 'beam' ? '#ffb030' : col;
        c.fillRect(-z.w, -z.w, (z.len + z.w) * k, z.w * 2);
        c.globalAlpha = 0.8;
        c.strokeRect(-z.w, -z.w, z.len + z.w, z.w * 2);
      }
      c.restore();
      return;
    }
    if (z.kind === 'ring') {
      c.globalAlpha = 0.16 + 0.3 * k;
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.arc(z.x, z.y, z.r0, 0, Math.PI * 2, true);
      c.fill('evenodd');
      c.globalAlpha = 0.85;
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.stroke();
      return;
    }
    if (z.kind === 'shelter') {
      c.globalAlpha = 0.35 + 0.2 * Math.sin(now() * 0.2);
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.95;
      c.stroke();
      return;
    }
    c.globalAlpha = 0.16 + 0.28 * k;
    c.beginPath();
    c.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.beginPath();
    c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    c.stroke();
  }
  const list = () => (game.mode === 'guest' ? shown : zones);
  // Au sol, sous les combattants : cônes, lignes, cercles, anneaux ; pendant le Jugement, l'arène rougeoie.
  function drawGround(c) {
    if (!arena) return;
    const z = list(),
      cs = game.mode === 'guest' ? shownCast : cast;
    if (!z.length && !cs) return;
    c.save();
    if (cs && cs.name === 'Jugement solaire') {
      const o = center();
      c.globalAlpha = 0.14 + 0.12 * Math.sin(now() * 0.25);
      c.fillStyle = '#ff5a1a';
      c.beginPath();
      c.arc(o.x, o.y, R * T, 0, Math.PI * 2);
      c.fill();
    }
    for (const q of z)
      if (q.kind !== 'beam')
        drawZone(c, q, Math.min(1, Math.max(0, (now() - q.start) / Math.max(1, q.at - q.start))));
    c.restore();
  }
  // Au-dessus : rayons des statues, barre d'incantation au-dessus de Valérion.
  function drawAir(c) {
    if (!arena) return;
    c.save();
    for (const q of list())
      if (q.kind === 'beam')
        drawZone(c, q, Math.min(1, Math.max(0, (now() - q.start) / Math.max(1, q.at - q.start))));
    c.restore();
    const cs = game.mode === 'guest' ? shownCast : cast,
      m = game.world.monsters.find(o => o.worldBossId === 'valerion' && o.hp > 0);
    if (!cs || !m) return;
    const left = Math.max(0, cs.at - now()),
      k = 1 - left / Math.max(1, cs.total),
      x = m.x - 70,
      y = m.y - 128;
    c.save();
    c.fillStyle = 'rgba(20,12,4,.85)';
    c.fillRect(x - 2, y - 2, 144, 14);
    c.fillStyle = cs.seals ? '#ffe88a' : '#ff9a4a';
    c.fillRect(x, y, 140 * k, 10);
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#fff4d0';
    c.fillText(
      tt(cs.name) + (cs.seals ? ' · ' + tt('sceaux {n}/2', { n: cs.seals.length }) : ''),
      m.x,
      y - 6
    );
    c.restore();
  }

  // ---------------------------------------------------------------- Réseau
  function view() {
    return {
      z: zones
        .slice(0, 30)
        .map(z => [
          KINDS.indexOf(z.kind),
          Math.round(z.x),
          Math.round(z.y),
          Math.round(z.r || 0),
          Math.round(z.r0 || 0),
          Math.round((z.a || 0) * 100),
          Math.round(z.len || 0),
          Math.round((z.kind === 'cone' ? z.w * 100 : z.w) || 0),
          z.at - now(),
          z.until ? z.until - now() : 0,
          now() - z.start
        ]),
      st: statues.join(''),
      c: cast ? [cast.name, cast.at - now(), cast.total, cast.seals ? cast.seals.length : -1] : 0
    };
  }
  function apply(data) {
    const n = v => Number(v) || 0;
    shown = (Array.isArray(data?.z) ? data.z : [])
      .filter(z => Array.isArray(z) && KINDS[n(z[0])])
      .map(z => {
        const kind = KINDS[n(z[0])];
        return {
          kind,
          x: n(z[1]),
          y: n(z[2]),
          r: n(z[3]),
          r0: n(z[4]),
          a: n(z[5]) / 100,
          len: n(z[6]),
          w: kind === 'cone' ? n(z[7]) / 100 : n(z[7]),
          at: now() + n(z[8]),
          until: n(z[9]) ? now() + n(z[9]) : 0,
          start: now() - n(z[10])
        };
      });
    shownStatues = String(data?.st || '0000')
      .split('')
      .map(v => Math.max(0, Math.min(2, Number(v) || 0)));
    const cs = data?.c;
    shownCast =
      Array.isArray(cs) && typeof cs[0] === 'string'
        ? {
            name: ['Jugement solaire', 'La Dernière Lumière'].includes(cs[0]) ? cs[0] : 'Jugement solaire',
            at: now() + n(cs[1]),
            total: n(cs[2]) || 1,
            seals: n(cs[3]) >= 0 ? Array.from({ length: n(cs[3]) }) : null
          }
        : null;
  }

  window.CANAAN_VALLEY_BOSS = Object.freeze({
    DEF,
    R,
    setArena: a => (arena = a),
    arena: () => arena,
    step,
    spawnBosses,
    bossKilled,
    drawGround,
    drawAir,
    view,
    apply,
    canSeal: i => (game.mode === 'guest' ? !!shownCast?.seals && shownStatues[i] === 1 : canSeal(i)),
    seal,
    statueState: i => (game.mode === 'guest' ? shownStatues[i] : statues[i]) || 0,
    zones: () => zones,
    inside,
    cast: (kind, m = boss()) =>
      m && CAST[kind] && CAST[kind](m, fighters(1).length ? fighters(1) : game.heroes),
    spawn,
    baseHp,
    RESPAWN_MS,
    MYTHIC,
    MYTHIC_LEVEL
  });
})();
