// Mécaniques des boss de donjon et de raid (l'Arène a les siennes). Chaque boss a sa rotation, déclarée dans la fiche
// de son instance (rules.mechanics, rules.secretMechanics) : il lance la suivante toutes les 6,5 s (5 s en raid, un
// peu plus vite sous 50 % de PV), toujours dans le même ordre, pour qu'on puisse l'apprendre.
// - slam : onde de choc sous un héros ; rain : un petit cercle sur chaque héros.
// - nova : grand cercle autour du boss (s'éloigner) ; donut : tout explose sauf près de lui (se coller).
// - charge : une ligne vers un héros, puis il fonce ; cross : quatre lignes en croix (ou en X) depuis lui.
// - soak : impact partagé entre les héros dans le cercle doré (se regrouper) ; spread : une marque sur chaque héros,
//   qui blesse les autres autour de lui (se disperser).
// - pools : flaques corrompues sous chaque héros, qui restent ; beam : rayon qui tourne autour de lui.
// - pull : il attire tout le monde, puis frappe autour de lui ; blink : il disparaît et retombe ailleurs.
// - safe : toute la salle explose, sauf un cercle vert.
// Déclenchements : adds (renforts à 66 % et 33 % de PV), totems (à 50 %, il devient invulnérable tant que ses
// cristaux de garde tiennent), berserk (frénésie après 3 min, 4 min en raid). Tous entrent en rage sous 25 %.
// Seuls les héros DANS une zone au moment où elle frappe sont touchés ; une roulade les protège.
// L'hôte décide ; les zones sont envoyées aux invités avec l'état du donjon (view / apply).
(() => {
  'use strict';
  const T = TS;
  const now = () => time;
  // Zones annoncées ou persistantes : forme, centre, dimensions, heure de frappe (at), fin (until), dégâts (mult).
  let zones = [];
  // Zones reçues de l'hôte (invité) : seulement pour les dessiner.
  let shown = [];
  const KINDS = ['circle', 'donut', 'line', 'safe', 'soak', 'mark', 'pool', 'beam'];
  // Salves (pluie d'éclats, croix) : plusieurs zones lancées ensemble ne touchent chaque héros qu'une fois.
  let volley = 0;
  const volleyHits = new Map();
  const alive = h => !h.player.dead && !h.away;
  const raidNow = () => !!instances[game.world.instance?.index]?.raid;
  function add(z) {
    z.start = now();
    zones.push(z);
    return z;
  }
  function say(m, text, col = '#ff8a6a') {
    float(m.x, m.y - 80, text, col);
  }
  // Le boss reste sur place pendant une incantation.
  const root = (m, frames) => (m.castUntil = Math.max(m.castUntil || 0, now() + frames));
  const angleNow = z => z.a + (z.spin || 0) * Math.max(0, now() - z.at);
  // Un point est-il dans la zone ?
  function inside(z, x, y) {
    const d = Math.hypot(x - z.x, y - z.y);
    switch (z.kind) {
      case 'donut':
        return d > z.r0 && d < z.r;
      case 'line':
      case 'beam': {
        const a = z.kind === 'beam' ? angleNow(z) : z.a,
          ax = Math.cos(a),
          ay = Math.sin(a),
          along = (x - z.x) * ax + (y - z.y) * ay,
          side = Math.abs(-(x - z.x) * ay + (y - z.y) * ax);
        return along > -z.w && along < z.len && side < z.w;
      }
      case 'safe':
        return d > z.r;
      default:
        return d < z.r;
    }
  }
  function hurtHero(m, hero, mult) {
    const raw = CANAAN_ENEMY_RAW_DAMAGE(m) * mult;
    CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(m, raw, {}, hero), m, hero);
  }
  // Héros visés par une zone : debout, dans la salle du boss.
  const roomHeroes = m => game.heroes.filter(h => alive(h) && CANAAN_DUNGEON_EXPLORE.inBossRoom(m, h.player));
  function strike(z) {
    const m = z.m;
    if (!m || m.hp <= 0) return;
    const heroes = roomHeroes(m),
      already = z.vol ? volleyHits.get(z.vol) || new Set() : null,
      touched = heroes.filter(h => inside(z, h.player.x, h.player.y) && !already?.has(h));
    if (already) {
      for (const h of touched) already.add(h);
      volleyHits.set(z.vol, already);
      if (volleyHits.size > 20) volleyHits.delete(volleyHits.keys().next().value);
    }
    if (z.kind === 'soak') {
      // Impact partagé : divisé entre ceux qui sont dans le cercle ; personne dedans, tout le groupe encaisse.
      if (!touched.length) for (const h of heroes) hurtHero(m, h, z.mult * 0.7);
      else
        for (const h of touched) hurtHero(m, h, (z.mult * (heroes.length > 1 ? 1.25 : 0.6)) / touched.length);
      burst(z.x, z.y, '#ffd34a', 26);
      return;
    }
    if (z.kind === 'mark') {
      for (const h of touched) hurtHero(m, h, h === z.target ? 0.45 : z.mult);
      burst(z.x, z.y, '#c86aff', 18);
      return;
    }
    for (const h of touched) hurtHero(m, h, z.mult);
    if (z.kind === 'safe') burst(z.x, z.y, '#5aff8a', 30);
    else burst(z.x, z.y, '#ff6a3a', 22);
    if (z.charge) dash(m, z);
  }
  // Charge : le boss fonce au bout de sa ligne (jusqu'au premier mur).
  function dash(m, z) {
    const ax = Math.cos(z.a),
      ay = Math.sin(z.a);
    let d = 0;
    while (d < z.len && canWalk(m.x + ax * 12, m.y + ay * 12)) {
      m.x += ax * 12;
      m.y += ay * 12;
      d += 12;
    }
    burst(m.x, m.y, '#ffb070', 20);
    shake = Math.max(shake, 6);
  }
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // ------------------------------------------------------------ Mécaniques lancées par la rotation
  const CAST = {
    slam(m, tg, raid) {
      const h = pick(tg);
      add({
        kind: 'circle',
        m,
        x: h.player.x,
        y: h.player.y,
        r: (raid ? 2.4 : 2) * T,
        at: now() + 90,
        mult: raid ? 2.2 : 1.7
      });
      say(m, '⚠️ ' + tt('Onde de choc !'));
    },
    rain(m, tg, raid) {
      const vol = ++volley;
      for (const h of tg)
        add({
          kind: 'circle',
          m,
          x: h.player.x + (Math.random() - 0.5) * 40,
          y: h.player.y + (Math.random() - 0.5) * 40,
          r: 1.3 * T,
          at: now() + 80,
          mult: raid ? 1.3 : 1.1,
          vol
        });
      say(m, '⚠️ ' + tt('Pluie d’éclats !'));
    },
    nova(m, tg, raid) {
      add({
        kind: 'circle',
        m,
        x: m.x,
        y: m.y,
        r: (raid ? 4.6 : 4) * T,
        at: now() + 120,
        mult: raid ? 2.6 : 2.2
      });
      root(m, 120);
      say(m, '💥 ' + tt('Nova : éloignez-vous !'));
    },
    donut(m, tg, raid) {
      add({
        kind: 'donut',
        m,
        x: m.x,
        y: m.y,
        r0: 2.3 * T,
        r: 12 * T,
        at: now() + 130,
        mult: raid ? 2.4 : 2
      });
      root(m, 130);
      say(m, '🌀 ' + tt('Anneau : collez-vous à lui !'), '#ffd34a');
    },
    charge(m, tg, raid) {
      const h = pick(tg),
        a = Math.atan2(h.player.y - m.y, h.player.x - m.x),
        len = Math.min(Math.hypot(h.player.x - m.x, h.player.y - m.y) + 3 * T, 12 * T);
      add({
        kind: 'line',
        m,
        x: m.x,
        y: m.y,
        a,
        len,
        w: 0.85 * T,
        at: now() + 80,
        mult: raid ? 2.3 : 1.9,
        charge: true
      });
      root(m, 80);
      say(m, '🏃 ' + tt('Charge !'));
    },
    cross(m, tg, raid) {
      // En croix, puis en X au lancer suivant.
      const s = m.mech;
      s.tilt = !s.tilt;
      const a0 = s.tilt ? 0 : Math.PI / 4,
        vol = ++volley;
      for (let k = 0; k < 4; k++)
        add({
          kind: 'line',
          m,
          x: m.x,
          y: m.y,
          a: a0 + (k * Math.PI) / 2,
          len: 13 * T,
          w: 0.8 * T,
          at: now() + 110,
          mult: raid ? 2.2 : 1.8,
          vol
        });
      root(m, 110);
      say(m, '➕ ' + tt('Croix : sortez des lignes !'));
    },
    soak(m, tg, raid) {
      const h = pick(tg);
      add({
        kind: 'soak',
        m,
        follow: h,
        x: h.player.x,
        y: h.player.y,
        r: 1.9 * T,
        at: now() + 150,
        mult: raid ? 3.2 : 2.6
      });
      say(
        m,
        '🛡️ ' + tt('Impact partagé : regroupez-vous sur {nom} !', { nom: h.name || tt('Héros') }),
        '#ffd34a'
      );
    },
    spread(m, tg, raid) {
      for (const h of tg)
        add({
          kind: 'mark',
          m,
          follow: h,
          target: h,
          x: h.player.x,
          y: h.player.y,
          r: 2.1 * T,
          at: now() + 150,
          mult: raid ? 1.9 : 1.6
        });
      say(m, '🎯 ' + tt('Marques : dispersez-vous !'), '#d8a0ff');
    },
    pools(m, tg, raid) {
      for (const h of tg)
        add({
          kind: 'pool',
          m,
          x: h.player.x,
          y: h.player.y,
          r: 1.6 * T,
          at: now() + 70,
          until: now() + 70 + 600,
          mult: raid ? 0.42 : 0.34,
          tick: 0
        });
      say(m, '☠️ ' + tt('Le sol se corrompt !'), '#9ae060');
    },
    beam(m, tg, raid) {
      add({
        kind: 'beam',
        m,
        x: m.x,
        y: m.y,
        a: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (raid ? 0.016 : 0.013),
        len: 11 * T,
        w: 0.6 * T,
        at: now() + 80,
        until: now() + 80 + 400,
        mult: raid ? 0.7 : 0.55,
        tick: 0
      });
      root(m, 480);
      say(m, '⚡ ' + tt('Rayon tournant !'), '#ffe08a');
    },
    pull(m, tg, raid) {
      m.mech.pullUntil = now() + 90;
      add({ kind: 'circle', m, x: m.x, y: m.y, r: 3 * T, at: now() + 120, mult: raid ? 2.4 : 2 });
      root(m, 120);
      say(m, '🌪️ ' + tt('Attraction : résistez !'), '#a0c8ff');
    },
    blink(m, tg, raid) {
      const to = CANAAN_DUNGEON_EXPLORE.bossRoomSpot(m, 4);
      if (!to) return CAST.slam(m, tg, raid);
      burst(m.x, m.y, '#b070ff', 24);
      m.x = to.x;
      m.y = to.y;
      burst(m.x, m.y, '#b070ff', 24);
      add({ kind: 'circle', m, x: m.x, y: m.y, r: 2.7 * T, at: now() + 60, mult: raid ? 2 : 1.7 });
      root(m, 60);
      say(m, '✨ ' + tt('Il disparaît… et retombe !'), '#d8a0ff');
    },
    safe(m, tg, raid) {
      const at = CANAAN_DUNGEON_EXPLORE.bossRoomSpot(m, 3);
      if (!at) return CAST.nova(m, tg, raid);
      add({ kind: 'safe', m, x: at.x, y: at.y, r: 2.3 * T, at: now() + 220, mult: raid ? 3.4 : 2.8 });
      say(m, '🟢 ' + tt('Zone sûre : tous dans le cercle vert !'), '#7aff9a');
    }
  };
  const CASTS = new Set(Object.keys(CAST));
  function summon(m, n) {
    const i = game.world.instance.index,
      types = CANAAN_DUNGEON_MOBS(i);
    if (!types.length) return;
    for (let k = 0; k < n; k++) {
      // Une case libre autour du boss (plusieurs essais, de plus en plus près).
      let x = m.x,
        y = m.y;
      for (let tries = 0; tries < 12; tries++) {
        const a = (k / n) * Math.PI * 2 + tries * 0.9,
          d = 170 - tries * 10;
        if (canWalk(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d)) {
          x = m.x + Math.cos(a) * d;
          y = m.y + Math.sin(a) * d;
          break;
        }
      }
      const type = types[k % types.length];
      const mob = {
        x,
        y,
        hp: 1,
        mhp: 1,
        t: type.name,
        mobColor: type.pal[0],
        look: type.look,
        pal: type.pal,
        lookOpts: type,
        r: 13,
        cd: 1,
        g: 0,
        summoned: true
      };
      canaanMobLevel(mob);
      canaanSetupMob(mob);
      game.world.monsters.push(mob);
    }
    burst(m.x, m.y, '#c84aff', 26);
    float(m.x, m.y - 80, '📯 ' + tt('{nom} appelle des renforts !', { nom: tt(m.t) }), '#ffb0ff');
  }
  // Totems : des cristaux de garde immobiles ; le boss est invulnérable tant qu'il en reste un.
  function totems(m, raid) {
    const i = game.world.instance.index,
      rune = instances[i].color || '#9fd8ff',
      n = raid ? 3 : 2;
    m.bossShield = true;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.PI / 6;
      let x = m.x + Math.cos(a) * 3.5 * T,
        y = m.y + Math.sin(a) * 3.5 * T;
      if (!canWalk(x, y)) {
        const spot = CANAAN_DUNGEON_EXPLORE.bossRoomSpot(m, 2.5);
        if (spot) ({ x, y } = spot);
      }
      const totem = {
        x,
        y,
        hp: 1,
        mhp: 1,
        t: 'Cristal de garde',
        mobColor: rune,
        look: 'wisp',
        pal: [rune, '#3a3a5a', '#ffffff', rune, '#ffffff'],
        lookOpts: { look: 'wisp', star: true, pal: [rune, '#3a3a5a', '#ffffff', rune, '#ffffff'] },
        r: 16,
        cd: 0,
        g: 0,
        still: true,
        totemOf: (m.mechId ||= Math.floor(Math.random() * 1e9)),
        elite: true
      };
      canaanMobLevel(totem);
      canaanSetupMob(totem);
      totem.hp = totem.mhp = Math.round(totem.mhp * 0.9);
      game.world.monsters.push(totem);
      burst(x, y, rune, 20);
    }
    float(
      m.x,
      m.y - 90,
      '💎 ' + tt('{nom} s’entoure de cristaux : brisez-les !', { nom: tt(m.t) }),
      '#c0e8ff'
    );
  }
  function step(m) {
    const raid = raidNow(),
      s = (m.mech ??= { next: now() + 150, k: 0, adds: 0, totems: false, fight: 0 }),
      ratio = m.hp / m.mhp,
      mechs = m.mechs?.length ? m.mechs : ['slam', 'rain', 'adds'],
      targets = game.heroes.filter(
        h =>
          alive(h) &&
          Math.hypot(h.player.x - m.x, h.player.y - m.y) < 13 * T &&
          CANAAN_DUNGEON_EXPLORE.inBossRoom(m, h.player)
      );
    // Bouclier des totems : levé quand le dernier cristal tombe.
    if (m.bossShield && !game.world.monsters.some(o => o.totemOf === m.mechId && o.hp > 0)) {
      m.bossShield = false;
      burst(m.x, m.y, '#ffffff', 30);
      float(m.x, m.y - 90, '💥 ' + tt('Le bouclier se brise !'), '#ffffff');
    }
    if (!targets.length) return;
    s.fight ||= now();
    // Attraction en cours : les héros glissent vers le boss (on peut lutter en marchant).
    if (s.pullUntil > now())
      for (const h of targets) {
        const p = h.player,
          d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < 40) continue;
        const nx = p.x + ((m.x - p.x) / d) * 2.4,
          ny = p.y + ((m.y - p.y) / d) * 2.4;
        if (canWalk(nx, ny)) {
          p.x = nx;
          p.y = ny;
        }
      }
    // Rotation : la mécanique suivante, plus vite sous 50 % de PV.
    const rotation = mechs.filter(k => CASTS.has(k));
    if (rotation.length && now() >= s.next && !(m.castUntil > now())) {
      const period = (raid ? 300 : 390) * (ratio < 0.5 ? 0.8 : 1);
      s.next = now() + period;
      CAST[rotation[s.k++ % rotation.length]](m, targets, raid);
    }
    // Renforts : une vague à 66 % de PV, une autre à 33 %.
    if (mechs.includes('adds')) {
      const wave = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
      if (wave > s.adds) {
        s.adds = wave;
        summon(m, raid ? 3 : 2);
      }
    }
    if (mechs.includes('totems') && !s.totems && ratio < 0.5) {
      s.totems = true;
      totems(m, raid);
    }
    // Frénésie : un combat trop long, et le boss frappe bien plus fort.
    if (mechs.includes('berserk') && !m.berserk && now() - s.fight > (raid ? 240 : 180) * 60) {
      m.berserk = true;
      say(m, '🔥 ' + tt('{nom} entre en frénésie !', { nom: tt(m.t) }), '#ff4a3a');
      burst(m.x, m.y, '#ff2a1a', 40);
    }
    // Rage sous 25 % : frappe plus fort (stats.js) et plus vite.
    if (ratio < 0.25 && !m.enraged) {
      m.enraged = true;
      float(m.x, m.y - 90, '😡 ' + tt('{nom} entre en rage !', { nom: tt(m.t) }), '#ff4a3a');
      burst(m.x, m.y, '#ff2a1a', 30);
    }
    if (m.enraged && m.cd > 0) m.cd -= 1 / 300;
  }
  function tick() {
    for (let i = zones.length - 1; i >= 0; i--) {
      const z = zones[i];
      if (z.m && z.m.hp <= 0) {
        zones.splice(i, 1);
        continue;
      }
      // Les marques et l'impact partagé suivent leur héros ; le rayon suit le boss.
      if (z.follow && now() < z.at) {
        z.x = z.follow.player.x;
        z.y = z.follow.player.y;
      }
      if (z.kind === 'beam' && z.m) {
        z.x = z.m.x;
        z.y = z.m.y;
      }
      if (now() < z.at) continue;
      if (z.until) {
        // Zones persistantes : elles blessent par à-coups tant qu'on y reste.
        if (now() >= z.until) {
          zones.splice(i, 1);
          continue;
        }
        if (now() >= z.tick) {
          z.tick = now() + (z.kind === 'beam' ? 18 : 30);
          for (const h of roomHeroes(z.m)) if (inside(z, h.player.x, h.player.y)) hurtHero(z.m, h, z.mult);
        }
        continue;
      }
      strike(z);
      zones.splice(i, 1);
    }
  }
  window.CanaanStages.bossMechanics = {
    after() {
      if (!started || paused || game.mode === 'guest') return;
      const inst = game.world.instance;
      if (!inst || inst.arena) {
        zones.length = 0;
        return;
      }
      for (const m of game.world.monsters) if (m.boss && m.hp > 0) step(m);
      tick();
    }
  };
  // ------------------------------------------------------------ Dessin (hôte et invités)
  const COLOR = { soak: '#ffd34a', safe: '#5aff8a', mark: '#c86aff', pool: '#7ad040' };
  function drawZone(c, z, k) {
    const col = COLOR[z.kind] || '#ff2a1a';
    c.fillStyle = col;
    c.strokeStyle = col === '#ff2a1a' ? '#ff6a4a' : col;
    c.lineWidth = 3;
    if (z.kind === 'line' || z.kind === 'beam') {
      const a = z.kind === 'beam' ? angleNow(z) : z.a;
      c.save();
      c.translate(z.x, z.y);
      c.rotate(a);
      if (z.kind === 'beam' && now() >= z.at) {
        // Rayon actif : cœur blanc et gaine dorée.
        c.globalAlpha = 0.75;
        c.fillStyle = '#ffd36a';
        c.fillRect(0, -z.w, z.len, z.w * 2);
        c.globalAlpha = 0.9;
        c.fillStyle = '#ffffff';
        c.fillRect(0, -z.w * 0.3, z.len, z.w * 0.6);
      } else {
        c.globalAlpha = 0.15 + 0.3 * k;
        c.fillRect(-z.w, -z.w, (z.len + z.w) * k, z.w * 2);
        c.globalAlpha = 0.8;
        c.strokeRect(-z.w, -z.w, z.len + z.w, z.w * 2);
      }
      c.restore();
      return;
    }
    if (z.kind === 'donut') {
      c.globalAlpha = 0.14 + 0.24 * k;
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.arc(z.x, z.y, z.r0, 0, Math.PI * 2, true);
      c.fill();
      c.globalAlpha = 0.9;
      c.strokeStyle = '#5aff8a';
      c.beginPath();
      c.arc(z.x, z.y, z.r0, 0, Math.PI * 2);
      c.stroke();
      return;
    }
    if (z.kind === 'safe') {
      // Toute la salle rougeoie ; le cercle vert pulse.
      c.globalAlpha = 0.1 + 0.2 * k;
      c.fillStyle = '#ff2a1a';
      c.fillRect(camX, camY, W, H);
      c.globalAlpha = 0.35 + 0.2 * Math.sin(now() * 0.2);
      c.fillStyle = '#5aff8a';
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.95;
      c.strokeStyle = '#d8ffe0';
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.stroke();
      return;
    }
    if (z.kind === 'pool') {
      c.globalAlpha = now() < z.at ? 0.2 + 0.2 * k : 0.38 + 0.08 * Math.sin(now() * 0.1 + z.x);
      c.beginPath();
      c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      c.fill();
      return;
    }
    c.globalAlpha = 0.18 + 0.25 * k;
    c.beginPath();
    c.arc(z.x, z.y, z.r * (z.kind === 'soak' || z.kind === 'mark' ? 1 : k), 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 0.85;
    c.beginPath();
    c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    c.stroke();
    if (z.kind === 'soak') {
      // Impact partagé : l'anneau se resserre jusqu'à l'impact.
      c.beginPath();
      c.arc(z.x, z.y, z.r * (1 - k * 0.8), 0, Math.PI * 2);
      c.stroke();
    }
  }
  window.CanaanStages.drawBossMechanics = function () {
    const list = game.mode === 'guest' ? shown : zones;
    if (!started || !list.length) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    for (const z of list)
      drawZone(ctx, z, Math.min(1, Math.max(0, (now() - z.start) / Math.max(1, z.at - z.start))));
    ctx.restore();
  };
  // Zones pour les invités : [forme, x, y, r, r0, angle (centièmes), longueur, largeur, frappe, fin, rotation].
  function view() {
    return zones
      .slice(0, 40)
      .map(z => [
        KINDS.indexOf(z.kind),
        Math.round(z.x),
        Math.round(z.y),
        Math.round(z.r || 0),
        Math.round(z.r0 || 0),
        Math.round((z.a || 0) * 100),
        Math.round(z.len || 0),
        Math.round(z.w || 0),
        z.at - now(),
        z.until ? z.until - now() : 0,
        Math.round((z.spin || 0) * 10000),
        now() - z.start
      ]);
  }
  function apply(list) {
    const n = v => Number(v) || 0;
    shown = list
      .slice(0, 40)
      .filter(z => Array.isArray(z) && KINDS[n(z[0])])
      .map(z => ({
        kind: KINDS[n(z[0])],
        x: n(z[1]),
        y: n(z[2]),
        r: n(z[3]),
        r0: n(z[4]),
        a: n(z[5]) / 100,
        len: n(z[6]),
        w: n(z[7]),
        at: now() + n(z[8]),
        until: n(z[9]) ? now() + n(z[9]) : 0,
        spin: n(z[10]) / 10000,
        start: now() - n(z[11])
      }));
    // L'angle du rayon est celui de l'hôte à cet instant : il repart de là.
    for (const z of shown) if (z.kind === 'beam' && now() > z.at) z.a -= z.spin * (now() - z.at);
  }
  // Pour le pilote des tests et les joueurs automatiques : où aller pour sortir des zones dangereuses (ou entrer dans
  // la zone sûre, l'impact partagé), et s'il faut rouler.
  function escape(hero) {
    const p = hero.player;
    for (const z of zones) {
      if (z.kind === 'soak') {
        if (game.heroes.length > 1 && z.follow !== hero && Math.hypot(p.x - z.x, p.y - z.y) > z.r * 0.7)
          return { x: z.x, y: z.y, roll: false };
        continue;
      }
      if (z.kind === 'mark') {
        if (z.target === hero) {
          const other = game.heroes.find(
            h => h !== hero && alive(h) && Math.hypot(h.player.x - p.x, h.player.y - p.y) < z.r + 20
          );
          if (other) return { x: p.x * 2 - other.player.x, y: p.y * 2 - other.player.y, roll: false };
        } else if (Math.hypot(p.x - z.x, p.y - z.y) < z.r + 14)
          return { x: p.x * 2 - z.x, y: p.y * 2 - z.y, roll: false };
        continue;
      }
      if (z.kind === 'safe') {
        if (Math.hypot(p.x - z.x, p.y - z.y) > z.r * 0.6) return { x: z.x, y: z.y, roll: now() > z.at - 50 };
        continue;
      }
      if (z.kind === 'donut') {
        if (Math.hypot(p.x - z.x, p.y - z.y) > z.r0 * 0.7) return { x: z.x, y: z.y, roll: now() > z.at - 40 };
        continue;
      }
      if (z.kind === 'line' || z.kind === 'beam') {
        if (!inside({ ...z, w: z.w + 18, len: z.len + 18 }, p.x, p.y)) continue;
        const a = z.kind === 'beam' ? angleNow(z) : z.a,
          side = -(p.x - z.x) * Math.sin(a) + (p.y - z.y) * Math.cos(a) >= 0 ? 1 : -1;
        return { x: p.x - Math.sin(a) * side * 100, y: p.y + Math.cos(a) * side * 100, roll: true };
      }
      if (Math.hypot(p.x - z.x, p.y - z.y) < z.r + 14)
        return { x: p.x * 2 - z.x, y: p.y * 2 - z.y, roll: true };
    }
    return null;
  }
  window.CANAAN_BOSS_MECHANICS = Object.freeze({
    zones: () => zones,
    clear: () => (zones.length = 0),
    cast: (m, kind) => {
      m.mech ??= { next: now() + 150, k: 0, adds: 0, totems: false, fight: now() };
      const tg = game.heroes.filter(alive);
      if (CAST[kind] && tg.length) CAST[kind](m, tg, raidNow());
    },
    inside,
    view,
    apply,
    escape,
    KINDS
  });
})();
