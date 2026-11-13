// Moteur de combat : point d'entrée des dégâts infligés, des dégâts reçus et des soins.
(function () {
  'use strict';
  // Roulade : 128 px en 0,24 s, invulnérable pendant le roulé et 0,08 s après, recharge de 4 s.
  const DODGE = Object.freeze({ distance: 128, duration: 0.24, grace: 0.08, cooldown: 4 });
  const clock = () => time / 60;
  let roll = null,
    dodgeReady = 0,
    invulnerableUntil = 0;
  const combat = {
    version: window.CANAAN_VERSION,
    // La primitive des statistiques gère Puissance, écart de niveau, critique, mort et butin.
    // hero : le héros qui frappe (l'hôte par défaut), avec ses statistiques, ses talents de classe et ses Rubis.
    rawAttack(target, amount, hero = game.hero) {
      return window.CANAAN_STATS_ATTACK(target, amount, hero);
    },
    attack(target, amount, options = {}, hero = game.hero) {
      if (!target || target.hp <= 0) return;
      let damage = Math.max(0, Number(amount) || 0);
      // Les marques et vulnérabilités sont des effets de l'arme.
      if (target.spell_vulnerable > 0) damage *= 1.15;
      if (target.v1746_armor > 0) damage *= 1.1;
      if (target.v1746_mark > 0) {
        damage *= 1.15;
        target.v1746_mark = 0;
      }
      const artifact = window.CANAAN_ARTIFACT_PASSIVE(hero);
      if (artifact?.variant === 0) damage *= 1 + artifact.amount / 100;
      // Maîtrise : bonus des compétences offensives (pas des attaques de base).
      if (!options.basic) damage *= 1 + Math.max(0, characterStats(hero).mastery || 0) / 100;
      // Rubis équipés : bonus conditionnels avant la frappe, déclencheurs après.
      // Repas de cuisine : bonus de dégâts en cours.
      damage *= CANAAN_PROF.damageMult(hero);
      damage = CANAAN_RUBIS.attackBefore(target, damage, options, hero);
      // Talents de classe : multiplicateurs avant, déclencheurs après (avec les dégâts réellement infligés).
      const talents = window.CANAAN_CLASS_ATTACK;
      const context = talents.before(target, damage, options, hero);
      damage = context.damage;
      const result = this.rawAttack(target, damage, hero);
      context.dealt = result || 0;
      talents.after(target, context, hero);
      CANAAN_RUBIS.attackAfter(target, result || 0, options, hero);
      return result;
    },
    // raw : dégâts bruts d'une attaque précise (mécaniques de l'Arène) ; sinon calculés par Ratings52.
    // options.magic : dégâts magiques (la Peau de pierre ne réduit que les dégâts physiques).
    // hero : le héros touché (l'hôte par défaut), avec sa roulade, ses postures, ses talents et ses Rubis.
    incoming(source, raw = null, options = {}, hero = game.hero) {
      if (!source || hero.away) return 0;
      const p = hero.player;
      // La roulade rend invulnérable : aucun jet, aucun dégât.
      if (this.invulnerable(hero)) {
        float(p.x, p.y - 35, 'ESQUIVE !', '#87f8f4');
        return 0;
      }
      // Esquive totale (petite chance de base), puis déviation indépendante si le coup touche.
      if (Math.random() < (characterStats(hero).dodge || 0) / 100) {
        float(p.x, p.y - 35, 'ESQUIVE !', '#87f8f4');
        CANAAN_RUBIS.onDodge(hero);
        window.CANAAN_CLASS_ON_DODGE(hero);
        return 0;
      }
      let damage = window.CANAAN_STATS_INCOMING(source, raw, hero);
      damage = window.CANAAN_WEAPON_DEFENSE(source, damage, hero);
      const artifact = window.CANAAN_ARTIFACT_PASSIVE(hero);
      if (artifact?.variant === 1) damage = Math.max(1, Math.round(damage * (1 - artifact.amount / 100)));
      damage = window.CANAAN_CLASS_DEFENSE(source, damage, hero);
      damage = CANAAN_RUBIS.defense(source, damage, options, hero);
      // Repas de cuisine : protection en cours.
      damage *= CANAAN_PROF.armorMult(hero);
      return Math.max(0, Math.round(damage));
    },
    // Seule porte des dégâts subis par un héros : survie aux coups fatals (Rubis), nombres flottants, secousse
    // pour l'hôte ; un allié note l'heure du coup et tombe à 0 PV.
    hurt(amount, source = null, hero = game.hero) {
      const p = hero.player;
      let n = Math.max(0, Math.round(Number(amount) || 0));
      // Un invité déconnecté (place réservée) est protégé.
      if (!n || p.dead || hero.away) return 0;
      n = CANAAN_RUBIS.beforeHurt(n, source, hero);
      // Coup fatal : Intervention divine du Paladin.
      if (n) n = window.CANAAN_CLASS_FATAL(n, hero);
      if (!n) return 0;
      p.hp -= n;
      if (hero === game.hero) {
        float(P.x, P.y - 30, '-' + n, '#ff5c5c');
        shake = Math.max(shake, 8);
        return n;
      }
      p.hp = Math.max(0, p.hp);
      p.lastHurt = time;
      float(p.x, p.y - 40, '-' + n, '#ff8a8a');
      if (p.hp <= 0 && !p.dead) {
        p.dead = true;
        toast('💀 ' + hero.name + ' est à terre.');
        if (hero.peer)
          game.view.remote?.(
            hero,
            game.world.instance?.arena
              ? '💀 Tu es à terre… Un allié peut te relever (3 s à côté de toi).'
              : '💀 Tu es à terre… Tu te relèves dans 10 secondes près de l’hôte.'
          );
      }
      return n;
    },
    // Roulade d'esquive : courte, invulnérable, avec une recharge.
    dodge(dirX = 0, dirY = 0) {
      if (
        !started ||
        paused ||
        P.dead ||
        playerStun > 0 ||
        roll ||
        modalOpen() ||
        document.getElementById('dialog').style.display === 'block'
      )
        return false;
      const t = clock();
      if (t < dodgeReady) return false;
      let dx = dirX,
        dy = dirY;
      if (!dx && !dy) {
        const a = facingAngleCore();
        dx = Math.cos(a);
        dy = Math.sin(a);
      }
      const len = Math.hypot(dx, dy) || 1;
      roll = { dx: dx / len, dy: dy / len, left: DODGE.duration };
      dodgeReady = t + DODGE.cooldown * CANAAN_RUBIS.dodgeCooldownFactor();
      CANAAN_RUBIS.onDodge();
      window.CANAAN_CLASS_ON_DODGE();
      CANAAN_SOUND.cue('dodge');
      return true;
    },
    invulnerable(hero = game.hero) {
      if (hero !== game.hero) return !!hero.player.roll || clock() < (hero.player.graceUntil || 0);
      return !!roll || clock() < invulnerableUntil;
    },
    // Roulade d'un autre héros (invité en ligne) : même distance, même invulnérabilité, sa propre recharge.
    heroDodge(hero, dirX = 0, dirY = 0) {
      const p = hero?.player;
      if (!p || hero === game.hero || p.dead || p.roll || clock() < (p.dodgeReady || 0)) return false;
      let dx = dirX,
        dy = dirY;
      if (!dx && !dy) {
        const a = Math.atan2((hero.intent.aimY ?? p.y) - p.y, (hero.intent.aimX ?? p.x + 1) - p.x);
        dx = Math.cos(a);
        dy = Math.sin(a);
      }
      const len = Math.hypot(dx, dy) || 1;
      p.roll = { dx: dx / len, dy: dy / len, left: DODGE.duration };
      p.dodgeReady = clock() + DODGE.cooldown * CANAAN_RUBIS.dodgeCooldownFactor(hero);
      CANAAN_RUBIS.onDodge(hero);
      window.CANAAN_CLASS_ON_DODGE(hero);
      return true;
    },
    dodgeState(hero = game.hero) {
      const t = clock();
      if (hero !== game.hero)
        return {
          rolling: !!hero.player.roll,
          ready: Math.max(0, (hero.player.dodgeReady || 0) - t),
          cooldown: DODGE.cooldown * CANAAN_RUBIS.dodgeCooldownFactor(hero)
        };
      return {
        rolling: !!roll,
        ready: Math.max(0, dodgeReady - t),
        cooldown: DODGE.cooldown * CANAAN_RUBIS.dodgeCooldownFactor()
      };
    },
    heal(amount, kind = 'direct', hero = game.hero) {
      const n = Math.max(0, Number(amount) || 0);
      if (!n) return 0;
      const before = hero.player.hp;
      canaanApplyHeal(n, kind === 'periodic', hero);
      return Math.max(0, hero.player.hp - before);
    },
    inspect() {
      const st = characterStats();
      return {
        attack: st.attack,
        crit: st.crit,
        critPower: st.critPower,
        maxHp: st.maxHp,
        level: st.level,
        primary: { ...st.primary },
        secondary: { ...st.secondary }
      };
    }
  };
  window.CANAAN_COMBAT = combat;
  // Étape du pipeline : déplacement de la roulade, après le mouvement normal.
  function stepRoll(p, r) {
    const step = DODGE.distance / DODGE.duration / 60;
    for (let k = 0; k < 2; k++) {
      const nx = p.x + (r.dx * step) / 2,
        ny = p.y + (r.dy * step) / 2;
      if (canWalk(nx, p.y)) p.x = nx;
      if (canWalk(p.x, ny)) p.y = ny;
    }
    r.left -= 1 / 60;
    return r.left > 1e-9;
  }
  window.CanaanStages.dodge = {
    after() {
      for (const hero of game.heroes) {
        const p = hero.player;
        if (hero === game.hero || !p.roll) continue;
        if (!stepRoll(p, p.roll)) {
          p.roll = null;
          p.graceUntil = clock() + DODGE.grace;
        }
      }
      if (!roll) return;
      const step = DODGE.distance / DODGE.duration / 60;
      for (let k = 0; k < 2; k++) {
        const nx = P.x + (roll.dx * step) / 2,
          ny = P.y + (roll.dy * step) / 2;
        if (canWalk(nx, P.y)) P.x = nx;
        if (canWalk(P.x, ny)) P.y = ny;
      }
      particles.push({ x: P.x, y: P.y + 10, vx: -roll.dx, vy: -roll.dy * 0.5, life: 16, c: '#bfe8ff', r: 4 });
      roll.left -= 1 / 60;
      if (roll.left <= 1e-9) {
        roll = null;
        invulnerableUntil = clock() + DODGE.grace;
      }
    }
  };
  // Étape de rendu : anneau de recharge sous le héros tant que la roulade n'est pas prête.
  window.CanaanStages.drawDodge = function () {
    if (!started || P.dead) return;
    const t = clock(),
      left = dodgeReady - t,
      total = DODGE.cooldown * CANAAN_RUBIS.dodgeCooldownFactor();
    if (left <= 0 && !roll) return;
    ctx.save();
    ctx.translate(-camX, -camY);
    ctx.globalAlpha = roll ? 0.9 : 0.55;
    ctx.strokeStyle = roll ? '#bfe8ff' : '#7fb8d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      P.x,
      P.y + 22,
      20,
      7,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * (1 - Math.max(0, left) / total)
    );
    ctx.stroke();
    ctx.restore();
  };
  function hit(target, amount, options) {
    return combat.attack(target, amount, options);
  }
  function monsterDamage(source, raw, options) {
    return combat.incoming(source, raw, options);
  }
  function canaanHurtPlayer(amount, source) {
    return combat.hurt(amount, source);
  }
  // Un invité en ligne roule tout de suite chez lui (prédiction) et demande la même roulade à l'hôte.
  function canaanDodge(dirX, dirY) {
    const done = combat.dodge(dirX, dirY);
    if (done && game.mode === 'guest') CANAAN_NET.requestDodge(roll.dx, roll.dy);
    return done;
  }
  Object.assign(window, { hit, monsterDamage, canaanHurtPlayer, canaanDodge });
})();
