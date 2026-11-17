// Mécaniques des boss de donjon et de raid (l'Arène a les siennes) :
// - Onde de choc : un cercle rouge annoncé sous un héros, puis de gros dégâts à qui reste dedans (rouler en sort).
// - Renforts : à 66 % et à 33 % de PV, le boss appelle des monstres de l'instance (2, ou 3 en raid).
// - Pluie d'éclats : un petit cercle annoncé sur chaque héros proche (toutes les 9 s en raid, 13 s en donjon).
// - Rage : sous 25 % de PV, il frappe 25 % plus fort et plus vite.
// Seuls les héros DANS un cercle au moment de l'explosion sont touchés.
// L'hôte décide ; les cercles sont montrés aux invités par les effets de combat (game.view.fx).
(() => {
  'use strict';
  const T = TS;
  const now = () => time;
  // Zones annoncées : centre, rayon, explosion à l'instant `at`, dégâts (multiplicateur du coup du boss).
  const zones = [];
  const alive = h => !h.player.dead && !h.away;
  function warn(m, x, y, r, delay, mult) {
    zones.push({ m, x, y, r, at: now() + delay, start: now(), mult });
    CANAAN_SKILLS.fx('ring', x, y, 0, r, 0, '#ff3a2a', delay / 60);
  }
  function explode(z) {
    burst(z.x, z.y, '#ff6a3a', 22);
    CANAAN_SKILLS.fx('ring', z.x, z.y, 0, z.r, 0, '#ffb070', 0.4);
    if (!z.m || z.m.hp <= 0) return;
    const raw = CANAAN_ENEMY_RAW_DAMAGE(z.m) * z.mult;
    for (const hero of game.heroes) {
      if (!alive(hero) || Math.hypot(hero.player.x - z.x, hero.player.y - z.y) > z.r) continue;
      CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(z.m, raw, {}, hero), z.m, hero);
    }
  }
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
      const add = {
        x,
        y,
        hp: 1,
        mhp: 1,
        t: type.name,
        mobColor: type.pal[0],
        look: type.look,
        pal: type.pal,
        r: 13,
        cd: 1,
        g: 0,
        summoned: true
      };
      canaanMobLevel(add);
      canaanSetupMob(add);
      game.world.monsters.push(add);
    }
    burst(m.x, m.y, '#c84aff', 26);
    float(m.x, m.y - 80, '📯 ' + m.t + ' appelle des renforts !', '#ffb0ff');
  }
  function step(m) {
    const raid = instances[game.world.instance.index].raid,
      s = (m.mech ??= { wave: now() + (raid ? 300 : 360), rain: now() + (raid ? 480 : 600), adds: 0 }),
      ratio = m.hp / m.mhp,
      targets = game.heroes.filter(
        h =>
          alive(h) &&
          Math.hypot(h.player.x - m.x, h.player.y - m.y) < 12 * T &&
          CANAAN_DUNGEON_EXPLORE.inBossRoom(m, h.player)
      );
    if (!targets.length) return;
    // Onde de choc sous un héros au hasard, toutes les 7 s (5 s en raid).
    if (now() >= s.wave) {
      s.wave = now() + (raid ? 300 : 420);
      const h = targets[Math.floor(Math.random() * targets.length)];
      warn(m, h.player.x, h.player.y, (raid ? 2.4 : 2) * T, 96, raid ? 2.2 : 1.6);
      float(m.x, m.y - 70, '⚠️ Onde de choc !', '#ff8a6a');
    }
    // Pluie d'éclats : un cercle sur chaque héros proche, toutes les 9 s en raid (13 s en donjon).
    if (now() >= s.rain) {
      s.rain = now() + (raid ? 540 : 780);
      for (const h of targets)
        warn(
          m,
          h.player.x + (Math.random() - 0.5) * 40,
          h.player.y + (Math.random() - 0.5) * 40,
          1.3 * T,
          80,
          raid ? 1.3 : 1.1
        );
      float(m.x, m.y - 70, '⚠️ Pluie d’éclats !', '#ff8a6a');
    }
    // Renforts : une vague à 66 % de PV, une autre à 33 %.
    const step = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
    if (step > s.adds) {
      s.adds = step;
      summon(m, raid ? 3 : 2);
    }
    // Rage sous 25 % : frappe plus fort (stats.js) et plus vite.
    if (ratio < 0.25 && !m.enraged) {
      m.enraged = true;
      float(m.x, m.y - 90, '😡 ' + m.t + ' entre en rage !', '#ff4a3a');
      burst(m.x, m.y, '#ff2a1a', 30);
    }
    if (m.enraged && m.cd > 0) m.cd -= 1 / 300;
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
      for (let i = zones.length - 1; i >= 0; i--)
        if (now() >= zones[i].at) {
          explode(zones[i]);
          zones.splice(i, 1);
        }
    }
  };
  // Cercles annoncés : remplissage rouge qui monte jusqu'à l'explosion.
  window.CanaanStages.drawBossMechanics = function () {
    if (!started || !zones.length) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    for (const z of zones) {
      const k = Math.min(1, (now() - z.start) / Math.max(1, z.at - z.start));
      ctx.globalAlpha = 0.18 + 0.25 * k;
      ctx.fillStyle = '#ff2a1a';
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ff6a4a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };
  window.CANAAN_BOSS_MECHANICS = Object.freeze({ zones: () => zones, clear: () => (zones.length = 0) });
})();
