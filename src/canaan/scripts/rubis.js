// Rubis : 48 objets à effet unique en six familles, six emplacements universels, collection permanente.
// Source exclusive : l'Arène des Épreuves (canaan-arena). Les effets ne s'appliquent qu'aux Rubis équipés.
(() => {
  'use strict';
  // Catalogue partagé (shared/data/rubis.js) ; les effets et la collection restent ici.
  const FAMILIES = RUBIS_FAMILIES,
    RUBIS = RUBIS_CATALOG,
    GROUP_ONLY = RUBIS_GROUP_ONLY,
    SLOTS = RUBIS_SLOTS,
    UTILITY = RUBIS_UTILITY_SKILLS;
  const BY_ID = new Map(RUBIS.map(r => [r.id, r]));

  // ---------------------------------------------------------------- Héros courant
  // Chaque héros a sa collection et ses emplacements (hero.rubis, sauvegardés) et l'état de ses effets
  // (minuteurs, boucliers, compteurs : non sauvegardé). Les fonctions agissent pour le héros courant :
  // within(hero, fn) le choisit le temps d'un appel ; sans appel en cours, c'est le héros de l'hôte.
  const runtimes = new WeakMap();
  let cur = null,
    HP = null,
    rt = null,
    active = new Set();
  function runtime(hero) {
    let r = runtimes.get(hero);
    if (!r) runtimes.set(hero, (r = { rt: freshEffects(), key: null, active: new Set() }));
    // Les Rubis actifs suivent les emplacements, y compris quand l'hôte les change pour un invité.
    const equipped = hero.rubis?.equipped || [],
      key = equipped.join();
    if (r.key !== key) {
      r.key = key;
      r.active = new Set(equipped.filter(Boolean));
    }
    return r;
  }
  function within(hero, fn) {
    const previous = [cur, HP, rt, active],
      r = runtime(hero);
    cur = hero;
    HP = hero.player;
    rt = r.rt;
    active = r.active;
    try {
      return fn();
    } finally {
      [cur, HP, rt, active] = previous;
    }
  }
  // Héros de l'appel en cours, ou l'hôte.
  const me = () => cur || game.hero;
  // Un héros sans Rubis (créé avant eux) n'en possède ni n'en porte aucun.
  const NO_RUBIS = Object.freeze({
    owned: Object.freeze({}),
    equipped: Object.freeze(Array(SLOTS).fill(null))
  });
  const gems = () => me().rubis || NO_RUBIS;
  const has = id => (cur ? active : runtime(game.hero).active).has(id);
  function refreshActive() {
    if (cur) active = runtime(cur).active;
  }
  function ownedCount(id) {
    return Math.max(0, Math.floor(Number(gems().owned[id]) || 0));
  }
  // Les Rubis sont liés au héros (ni banque, ni vente, ni échange) : un Rubis connu est un Rubis possédé.
  const known = id => ownedCount(id) > 0;
  function discovered() {
    return RUBIS.filter(r => known(r.id)).length;
  }
  // Un Rubis gagné : priorité aux Rubis non possédés ; un doublon est conservé dans la collection.
  function grant(id = null) {
    let rubis = id ? BY_ID.get(id) : null;
    if (!rubis) {
      const missing = RUBIS.filter(r => !known(r.id)),
        pool = missing.length ? missing : RUBIS;
      rubis = pool[Math.floor(Math.random() * pool.length)];
    }
    const fresh = !known(rubis.id);
    gems().owned[rubis.id] = ownedCount(rubis.id) + 1;
    return { rubis, fresh };
  }
  function missingRubis() {
    return RUBIS.filter(r => !known(r.id));
  }
  window.CANAAN_RUBIS_STATE = {
    export: () => ({ owned: { ...gems().owned }, equipped: [...gems().equipped] }),
    import(d) {
      within(game.hero, () => importRubis(d));
    }
  };
  function importRubis(d) {
    {
      gems().owned = {};
      for (const r of RUBIS) {
        const n = Math.floor(Number(d?.owned?.[r.id]) || 0);
        if (n > 0) gems().owned[r.id] = n;
      }
      // Emplacements : Rubis possédés uniquement, jamais deux fois le même.
      const seen = new Set();
      gems().equipped = Array.from({ length: SLOTS }, (_, k) => {
        const id = d?.equipped?.[k];
        if (typeof id !== 'string' || !BY_ID.has(id) || !ownedCount(id) || seen.has(id)) return null;
        seen.add(id);
        return id;
      });
      refreshActive();
      resetEffects();
    }
  }

  // ---------------------------------------------------------------- État des effets (non sauvegardé)
  const now = () => time / 60;
  function freshEffects() {
    return {
      lastCombat: -1e9,
      carnage: [],
      target: null,
      targetHits: 0,
      gardienReady: 0,
      shield: 0,
      shieldUntil: 0,
      shieldFrom: 'rempart',
      rempartReady: 0,
      still: 0,
      lastX: null,
      lastY: null,
      losses: [],
      resilienceReady: 0,
      hots: [],
      secondUsed: false,
      phoenixUsed: false,
      regenClock: 0,
      meditationClock: 0,
      hits: 0,
      accelUntil: 0,
      accelReady: 0,
      offensive: 0,
      resonanceReady: false,
      crits: 0,
      eclipseReady: false,
      transClock: 0,
      transReady: false,
      sprintUntil: 0,
      moving: 0,
      elan: false,
      lastSkill: null,
      recoveryReady: 0
    };
  }
  function resetEffects() {
    Object.assign(rt, freshEffects());
  }
  function inCombat() {
    return now() - rt.lastCombat < 5 || CANAAN_ARENA.fighting();
  }
  function secondary(m, amount) {
    if (!m || m.hp <= 0) return 0;
    return window.CANAAN_COMBAT.rawAttack(m, Math.max(1, Math.round(amount)), cur) || 0;
  }
  function heal(amount) {
    return canaanApplyHeal(amount, true, cur);
  }
  // Mana rendu par un effet (Méditation, récupération de l'Arène) : déclenche la Symbiose.
  function restoreMana(amount) {
    const gained = Math.max(0, Math.min(HP.mmp - HP.mp, amount));
    HP.mp += gained;
    if (gained > 0 && has('symbiose')) {
      const h = heal(Math.min(gained * 0.2, HP.mhp * 0.03));
      if (h > 0) float(HP.x, HP.y - 52, '+' + Math.round(h) + ' PV ☯', '#c8a8ff');
    }
    return gained;
  }

  // ---------------------------------------------------------------- Points d'accroche du combat
  const effects = {
    list: RUBIS,
    families: FAMILIES,
    slots: SLOTS,
    get: id => BY_ID.get(id) || null,
    owned: ownedCount,
    known,
    equipped: () => [...gems().equipped],
    discovered,
    missing: missingRubis,
    grant,
    has,
    inCombat,
    restoreMana,
    // Effets passagers en cours (barre des effets) : nom, icône du rubis, texte et secondes restantes.
    auras() {
      const t = now(),
        out = [],
        add = (id, until, text, extra = '') => {
          const r = BY_ID.get(id);
          if (r && until > t) out.push({ id, icon: r.icon, name: r.name + extra, text, left: until - t });
        };
      if (rt.shield > 0)
        add(rt.shieldFrom, rt.shieldUntil, 'Bouclier : absorbe encore ' + Math.round(rt.shield) + ' dégâts.');
      if (has('acceleration')) add('acceleration', rt.accelUntil, 'Recharges −10 %.');
      if (has('sprinteur')) add('sprinteur', rt.sprintUntil, 'Vitesse +20 %.');
      return out;
    },
    // Statistiques : appelé à la fin de characterStats.
    stats(s) {
      if (!active.size) return s;
      if (has('colosse')) {
        s.maxHp = Math.round(s.maxHp * 1.1);
        s.defense = Math.round((s.defense || 0) * 1.1);
      }
      if (has('pacte')) s.maxHp = Math.max(1, Math.round(s.maxHp * 0.88));
      if (has('voyageur')) s.speed = (s.speed || 0) + 10;
      if (has('sprinteur') && now() < rt.sprintUntil) s.speed = (s.speed || 0) + 20;
      if (has('elan') && rt.elan) s.speed = (s.speed || 0) + 15;
      return s;
    },
    attackBefore(m, damage, options = {}) {
      rt.lastCombat = now();
      if (!active.size) return damage;
      let mult = 1;
      const t = now();
      if (has('berserker') && HP.hp / HP.mhp < 0.3) mult *= 1.15;
      if (has('duelliste')) {
        const near = game.world.monsters.filter(
          o => o.hp > 0 && Math.hypot(o.x - HP.x, o.y - HP.y) < 5 * TS
        ).length;
        if (near === 1) mult *= 1.08;
      }
      if (has('chasseur') && (m.elite || m.boss || m.worldBoss || m.arenaBoss)) mult *= 1.15;
      if (has('carnage')) mult *= 1 + 0.03 * rt.carnage.filter(x => x > t).length;
      if (has('acharnement') && m._rubisFocusUntil > t) mult *= 1.1;
      if (has('dernier_souffle') && m.mhp > 0 && m.hp / m.mhp < 0.3) mult *= 1.2;
      if (has('pacte')) mult *= 1.18;
      return damage * mult;
    },
    attackAfter(m, done, options = {}) {
      rt.lastCombat = now();
      if (!active.size || !m) return;
      const t = now(),
        crit = !!m._lastCrit;
      if (has('acharnement')) {
        if (rt.target === m) rt.targetHits++;
        else {
          rt.target = m;
          rt.targetHits = 1;
        }
        if (rt.targetHits >= 4) m._rubisFocusUntil = t + 5;
      }
      if (crit && done > 0) {
        if (has('tempete') && Math.random() < 0.15 && m.hp > 0) {
          secondary(m, done * 0.35);
          burst(m.x, m.y - 30, '#bfe8ff', 10);
          float(m.x, m.y - 70, '⚡', '#bfe8ff');
        }
        if (has('vampire')) heal(done * 0.03);
        if (has('eclipse') && ++rt.crits >= 3) {
          rt.crits = 0;
          rt.eclipseReady = true;
        }
      }
      if (has('onde') && done > 0 && ++rt.hits % 8 === 0) {
        const wave = characterStats(cur).attack * 0.4;
        for (const o of game.world.monsters.slice())
          if (o.hp > 0 && canaanBodyGap(o, HP.x, HP.y) < 140) secondary(o, wave);
        burst(HP.x, HP.y, '#ffd890', 16);
      }
      if (has('lame_ardente') && done > 0 && m.hp > 0 && Math.random() < 0.15)
        m._rubisBurn = { until: t + 4, tick: t + 1, dps: (done * 0.12) / 4, by: cur };
      if (has('gel') && m.hp > 0 && Math.random() < 0.12) {
        m._rubisSlowUntil = t + 3;
        float(m.x, m.y - 50, '❄️', '#bfe8ff');
      }
      if (has('echo') && options.rubisEcho && done > 0 && m.hp > 0) secondary(m, done * 0.3);
    },
    onKill(m) {
      if (!active.size) return;
      const t = now();
      if (has('carnage')) {
        rt.carnage = rt.carnage.filter(x => x > t);
        rt.carnage.push(t + 8);
        if (rt.carnage.length > 3) rt.carnage.shift();
      }
      if (has('faucheur')) heal(HP.mhp * 0.05);
      if (has('recuperation') && rt.lastSkill && t >= rt.recoveryReady) {
        const cds = cur === game.hero ? weaponCooldowns : CANAAN_SKILLS.state(cur).cooldowns;
        cds[rt.lastSkill] = Math.max(0, (cds[rt.lastSkill] || 0) - 1);
        rt.recoveryReady = t + 5;
      }
    },
    onCast(type, i, key, context) {
      rt.lastSkill = key;
      if (!active.size) return context;
      const t = now(),
        offensive = !UTILITY.has(type + ':' + i);
      let mult = context.multiplier ?? 1,
        echo = false;
      if (has('acceleration') && t >= rt.accelReady) {
        rt.accelUntil = t + 4;
        rt.accelReady = t + 10;
      }
      if (rt.transReady && has('transcendance')) {
        rt.transReady = false;
        rt.transClock = 0;
        if (offensive) mult *= 1.15;
        float(HP.x, HP.y - 60, '🌟 TRANSCENDANCE', '#fff0a8');
      }
      if (offensive) {
        if (has('resonance')) {
          if (rt.resonanceReady) {
            mult *= 1.2;
            rt.resonanceReady = false;
          }
          if (++rt.offensive % 5 === 0) rt.resonanceReady = true;
        }
        if (has('eclipse') && rt.eclipseReady) {
          rt.eclipseReady = false;
          mult *= 1.25;
          float(HP.x, HP.y - 74, '🌑 ÉCLIPSE', '#e2b8ff');
        }
        if (has('chaos') && Math.random() < 0.2) {
          const good = Math.random() < 0.5;
          mult *= good ? 1.3 : 0.9;
          float(HP.x, HP.y - 66, good ? '🎲 CHAOS +30 %' : '🎲 CHAOS −10 %', good ? '#e2b8ff' : '#9a8aa8');
        }
        if (has('echo') && Math.random() < 0.1) echo = true;
      }
      return { ...context, multiplier: mult, rubisEcho: echo };
    },
    manaCost(cost) {
      if (has('transcendance') && rt.transReady) return 0;
      return has('arcane') ? cost * 0.9 : cost;
    },
    cooldownFactor: () => (has('acceleration') && now() < rt.accelUntil ? 0.9 : 1),
    dodgeCooldownFactor: () => (has('endurance') ? 0.85 : 1),
    onDodge() {
      if (has('sprinteur')) rt.sprintUntil = now() + 2;
    },
    armorFactor: () => (has('briseur') ? 0.92 : 1),
    critFactor: () => (has('precision') ? 1.12 : 1),
    goldFactor: () => (has('tresorier') ? 1.15 : 1),
    // Prospecteur : 15 % de chances qu'un monstre ordinaire lâche un objet Peu commun au lieu d'un Commun.
    betterDrop() {
      return has('prospecteur') && Math.random() < 0.15;
    },
    healFactor(periodic) {
      return (!periodic && has('guerisseur') ? 1.15 : 1) * (has('source_vitale') ? 1.2 : 1);
    },
    // Bénédiction : le soin direct reçu au-delà des PV max devient un bouclier (10 % des PV max au plus, 6 s).
    onOverheal(overflow) {
      if (!has('benediction') || !(overflow > 0)) return;
      const t = now(),
        current = t < rt.shieldUntil ? rt.shield : 0,
        cap = HP.mhp * 0.1;
      if (current >= cap) return;
      rt.shield = Math.min(cap, current + overflow);
      rt.shieldUntil = Math.max(rt.shieldUntil, t + 6);
      rt.shieldFrom = 'benediction';
      if (!current) float(HP.x, HP.y - 58, '🙏 Bouclier', '#a8f2bc');
    },
    // Réductions des dégâts reçus, après la Défense, les armes et les talents de classe.
    defense(source, damage, options = {}) {
      rt.lastCombat = now();
      if (!active.size || damage <= 0) return damage;
      const t = now();
      let d = damage;
      if (has('volonte') && HP.hp / HP.mhp < 0.5) d *= 0.85;
      if (has('forteresse') && rt.still >= 2) d *= 0.88;
      if (has('gardien') && t >= rt.gardienReady) {
        rt.gardienReady = t + 12;
        d *= 0.5;
        float(HP.x, HP.y - 56, '🛡️ GARDIEN', '#a4caff');
      }
      if (has('peau_de_pierre')) d = Math.min(d, HP.mhp * 0.25);
      if (rt.shield > 0 && t < rt.shieldUntil) {
        const absorbed = Math.min(rt.shield, d);
        rt.shield -= absorbed;
        d -= absorbed;
        if (absorbed > 0) float(HP.x, HP.y - 48, '🏰 −' + Math.round(absorbed), '#a4caff');
      }
      if (has('miroir') && source && source.hp > 0 && Number.isFinite(source.mhp) && d > 0)
        secondary(source, Math.min(d * 0.15, source.mhp * 0.05));
      return Math.max(0, d);
    },
    // Juste avant la perte de PV : Résilience, Rempart et survie aux coups fatals.
    beforeHurt(n, source) {
      if (!active.size) return n;
      const t = now();
      if (has('resilience')) {
        rt.losses = rt.losses.filter(l => l.t > t - 3);
        rt.losses.push({ t, n });
        if (t >= rt.resilienceReady && rt.losses.reduce((a, l) => a + l.n, 0) >= HP.mhp * 0.25) {
          rt.resilienceReady = t + 30;
          rt.hots.push({ left: 5, perSec: (HP.mhp * 0.08) / 5 });
          float(HP.x, HP.y - 62, '🌱 RÉSILIENCE', '#a8f2bc');
        }
      }
      if (HP.hp - n <= 0) {
        if (has('second_souffle') && !rt.secondUsed) {
          rt.secondUsed = true;
          HP.hp = Math.max(1, Math.round(HP.mhp * 0.1));
          float(HP.x, HP.y - 64, '💨 SECOND SOUFFLE', '#a4caff');
          burst(HP.x, HP.y, '#a4caff', 18);
          return 0;
        }
        if (has('phenix') && !rt.phoenixUsed) {
          rt.phoenixUsed = true;
          HP.hp = Math.max(1, Math.round(HP.mhp * 0.2));
          canaanAchieve(cur, 'phoenix');
          float(HP.x, HP.y - 64, '🌅 PHÉNIX', '#ffb347');
          burst(HP.x, HP.y, '#ffb347', 30);
          // Repousse les ennemis proches ; les boss ne reculent que d'un pas.
          for (const m of game.world.monsters) {
            const d = Math.hypot(m.x - HP.x, m.y - HP.y);
            if (d > 170 || m.hp <= 0) continue;
            const push = m.boss || m.worldBoss ? 30 : 110,
              ux = (m.x - HP.x) / (d || 1),
              uy = (m.y - HP.y) / (d || 1);
            for (let k = 0; k < push; k += 10)
              if (canWalk(m.x + ux * 10, m.y + uy * 10)) {
                m.x += ux * 10;
                m.y += uy * 10;
              }
          }
          return 0;
        }
      }
      if (has('rempart') && (HP.hp - n) / HP.mhp < 0.4 && t >= rt.rempartReady) {
        rt.rempartReady = t + 45;
        rt.shield = HP.mhp * 0.15;
        rt.shieldUntil = t + 5;
        rt.shieldFrom = 'rempart';
        float(HP.x, HP.y - 70, '🏰 REMPART', '#a4caff');
      }
      return n;
    },
    // Rubis Explorateur : coffres secrets non ouverts à moins de 12 cases.
    revealedChests() {
      if (!has('explorateur') || game.world.instance) return [];
      const x = HP.x / TS,
        y = HP.y / TS;
      return canaanSecretChests().filter(
        c => !game.world.openedChests.includes(c.id) && Math.hypot(c.x - x, c.y - y) <= 12
      );
    },
    // Nouvelle vague de l'Arène : un nouveau combat commence.
    newCombat() {
      rt.secondUsed = false;
      rt.phoenixUsed = false;
    },
    canChange,
    section,
    reset: resetEffects
  };
  // Point d'accroche pour un héros : son dernier argument (facultatif) est le héros ; l'hôte par défaut.
  // Position de cet argument pour chaque fonction ; les autres (catalogue, interface) ne dépendent pas du héros.
  const HERO_ARG = {
    owned: 1,
    equipped: 0,
    discovered: 0,
    missing: 0,
    grant: 1,
    has: 1,
    inCombat: 0,
    restoreMana: 1,
    auras: 0,
    stats: 1,
    attackBefore: 3,
    attackAfter: 3,
    onKill: 1,
    onCast: 4,
    manaCost: 1,
    cooldownFactor: 0,
    dodgeCooldownFactor: 0,
    onDodge: 0,
    armorFactor: 0,
    critFactor: 0,
    goldFactor: 0,
    betterDrop: 0,
    healFactor: 1,
    onOverheal: 1,
    defense: 3,
    beforeHurt: 2,
    revealedChests: 0,
    newCombat: 0,
    canChange: 0,
    reset: 0
  };
  const api = {};
  for (const [name, value] of Object.entries(effects)) {
    const at = HERO_ARG[name];
    api[name] =
      at === undefined
        ? value
        : (...args) => {
            const hero = args[at] && args[at].player ? args[at] : game.hero;
            return within(hero, () => value(...args));
          };
  }
  api.within = within;
  window.CANAAN_RUBIS = api;

  // ---------------------------------------------------------------- Étape de simulation
  // Le Gel d'un héros ralentit les monstres qu'il a gelés ; les autres effets agissent pour chaque héros présent.
  window.CanaanStages.rubis = {
    before() {
      const t = now(),
        slowed = new Map();
      if (game.heroes.some(hero => runtime(hero).active.has('gel')))
        for (const m of game.world.monsters)
          if (m._rubisSlowUntil > t && !m.arenaBoss) slowed.set(m, { x: m.x, y: m.y });
      return slowed;
    },
    after(slowed) {
      for (const [m, p] of slowed) {
        m.x = p.x + (m.x - p.x) * 0.75;
        m.y = p.y + (m.y - p.y) * 0.75;
      }
      for (const hero of game.heroes) within(hero, stepHeroEffects);
    }
  };
  function stepHeroEffects() {
    {
      if (HP.dead) return;
      const t = now(),
        dt = 1 / 60,
        fighting = inCombat();
      if (!fighting) {
        rt.secondUsed = false;
        rt.phoenixUsed = false;
      }
      if (!active.size) return;
      const moved = rt.lastX !== null && Math.hypot(HP.x - rt.lastX, HP.y - rt.lastY) > 0.3;
      rt.lastX = HP.x;
      rt.lastY = HP.y;
      rt.still = moved ? 0 : rt.still + dt;
      if (moved) {
        if (!fighting) rt.moving += dt;
        if (rt.moving >= 5) rt.elan = true;
      } else {
        rt.moving = 0;
        rt.elan = false;
      }
      if (has('regeneration') && (rt.regenClock += dt) >= 3 - 1e-9) {
        rt.regenClock = 0;
        heal(HP.mhp * 0.01);
      }
      if (has('meditation') && (rt.meditationClock += dt) >= 5 - 1e-9) {
        rt.meditationClock = 0;
        restoreMana(HP.mmp * 0.03);
      }
      if (has('transcendance') && fighting && !rt.transReady && (rt.transClock += dt) >= 30 - 1e-9) {
        rt.transReady = true;
        float(HP.x, HP.y - 58, '🌟 Transcendance prête', '#fff0a8');
      }
      if (rt.shield > 0 && t >= rt.shieldUntil) rt.shield = 0;
      for (let k = rt.hots.length - 1; k >= 0; k--) {
        const hot = rt.hots[k];
        heal(hot.perSec * dt);
        if ((hot.left -= dt) <= 0) rt.hots.splice(k, 1);
      }
      if (has('lame_ardente'))
        for (const m of game.world.monsters.slice()) {
          const b = m._rubisBurn;
          // Une brûlure appartient au héros qui l'a posée : lui seul la fait progresser.
          if (!b || (b.by && b.by !== cur && game.heroes.includes(b.by))) continue;
          if (t >= b.tick && m.hp > 0) {
            b.tick += 1;
            secondary(m, b.dps);
          }
          if (t >= b.until) delete m._rubisBurn;
        }
    }
  }

  // ---------------------------------------------------------------- Interface : fiche du personnage
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  // Hors combat et hors Arène : on prépare ses Rubis avant la tentative.
  function canChange() {
    if (game.world.instance?.arena)
      return { ok: false, why: 'Les Runes se changent avant d’entrer dans l’Arène.' };
    if (inCombat()) return { ok: false, why: 'Impossible de changer de Runes en combat.' };
    return { ok: true, why: '' };
  }
  function gem(r, size = '') {
    const f = FAMILIES[r.family];
    return (
      '<span class="rubis-gem fam' +
      r.family +
      (size ? ' ' + size : '') +
      '" style="--gem:' +
      f.color +
      ';--gem-l:' +
      f.light +
      ';--gem-d:' +
      f.dark +
      '"><i></i><b>' +
      r.icon +
      '</b></span>'
    );
  }
  // Onglet Rubis de la fiche (C) : le héros entouré de ses six emplacements et la collection des 48 en haut, ses effets
  // actifs dessous.
  // Le héros affiché est celui de cette application (l'invité chez lui).
  function section() {
    return within(game.hero, sectionHtml);
  }
  function slotHtml(k) {
    const r = BY_ID.get(gems().equipped[k]);
    return r
      ? '<button type="button" class="rubis-slot filled" data-action="unequipRubis" data-slot="' +
          k +
          '" data-tooltip-rubis="' +
          r.id +
          '" aria-label="Retirer ' +
          esc(r.name) +
          '">' +
          gem(r, 'big') +
          '<em>' +
          esc(r.name) +
          '</em></button>'
      : '<div class="rubis-slot empty"><span class="rubis-socket"></span><em title="Emplacement de Rune">Libre · ' +
          (k + 1) +
          '</em></div>';
  }
  function collectionHtml() {
    let html = '<div class="rubis-collection">';
    FAMILIES.forEach((f, fi) => {
      html +=
        '<div class="rubis-family"><span class="rubis-family-name" style="color:' +
        f.light +
        '">' +
        f.icon +
        ' ' +
        esc(f.short) +
        '</span><div class="rubis-row">';
      for (const r of RUBIS.filter(x => x.family === fi)) {
        const n = ownedCount(r.id),
          worn = gems().equipped.includes(r.id);
        // Possédé : clic pour équiper ou retirer. Jamais trouvé : « ? ».
        html += n
          ? '<button type="button" class="rubis-cell owned' +
            (worn ? ' worn' : '') +
            '" data-action="toggleRubis" data-rubis="' +
            r.id +
            '" data-tooltip-rubis="' +
            r.id +
            '" aria-label="' +
            esc(r.name) +
            '">' +
            gem(r) +
            (n > 1 ? '<sup>×' + n + '</sup>' : '') +
            '</button>'
          : '<span class="rubis-cell unknown" data-tooltip-rubis="' + r.id + '">?</span>';
      }
      html += '</div></div>';
    });
    return html + '</div>';
  }
  function effectsHtml() {
    const worn = gems()
      .equipped.filter(Boolean)
      .map(id => BY_ID.get(id));
    if (!worn.length) return '<p class="muted">Aucune Rune équipée : choisis-en dans ta collection.</p>';
    return (
      '<ul class="rubis-effects">' +
      worn
        .map(
          r =>
            '<li data-tooltip-rubis="' +
            r.id +
            '">' +
            gem(r) +
            '<div><b style="color:' +
            FAMILIES[r.family].light +
            '">' +
            esc(r.name) +
            '</b><span>' +
            esc(r.desc) +
            '</span></div></li>'
        )
        .join('') +
      '</ul>'
    );
  }
  function sectionHtml() {
    const lock = canChange(),
      count = gems().equipped.filter(Boolean).length,
      half = SLOTS / 2;
    const left = Array.from({ length: half }, (_, k) => slotHtml(k)).join(''),
      right = Array.from({ length: SLOTS - half }, (_, k) => slotHtml(half + k)).join('');
    let notes = '';
    if (!lock.ok) notes += '<p class="rubis-lock">🔒 ' + esc(lock.why) + '</p>';
    else if (!discovered())
      notes +=
        '<p class="rubis-lock">⚔️ Les Runes se gagnent dans l’Arène des Épreuves, à l’est du camp.</p>';
    // Grille alignée : Runes équipées et Collection côte à côte, les effets actifs sur toute la largeur dessous.
    return (
      '<div class="character-layout rubis-layout">' +
      '<div class="rpg-paper rubis-paper rubis-worn"><div class="rubis-head"><h3>⟦rune⟧ Runes équipées</h3><span>' +
      count +
      '/' +
      SLOTS +
      ' équipées</span></div>' +
      '<div class="rubis-doll"><div class="rubis-doll-col">' +
      left +
      '</div><div class="doll-center"><canvas id="heroPreview" width="170" height="250"></canvas></div>' +
      '<div class="rubis-doll-col">' +
      right +
      '</div></div>' +
      notes +
      '</div>' +
      '<div class="rpg-paper rubis-paper rubis-coll"><div class="rubis-head"><h3>📖 Collection</h3><span>' +
      discovered() +
      '/48 découvertes</span></div>' +
      '<p class="rubis-hint">Clique une Rune de ta collection pour l’équiper ou la retirer ; clique un emplacement pour le libérer.</p>' +
      collectionHtml() +
      '</div>' +
      '<div class="rpg-paper rubis-paper rubis-fx"><div class="rubis-head"><h3>✨ Effets actifs</h3></div>' +
      effectsHtml() +
      '</div></div>'
    );
  }
  function refreshPanel() {
    recomputeStats();
    const panel = document.getElementById('window')?.dataset.canaanPanel;
    if (modalOpen() && panel === 'character') renderCharacter();
    saveGame();
  }
  // Équiper ou retirer un Rubis pour un héros (l'hôte, ou un invité en ligne à sa demande).
  // Renvoie true si l'emplacement a changé ; sinon le héros reçoit le message expliquant pourquoi.
  const notify = (hero, text) => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  function equipFor(hero, id) {
    return within(hero, () => {
      const r = BY_ID.get(id),
        lock = canChange();
      if (!r || !ownedCount(id)) return false;
      if (!lock.ok) {
        notify(hero, '🔒 ' + lock.why);
        return false;
      }
      if (gems().equipped.includes(id)) return false;
      const slot = gems().equipped.indexOf(null);
      if (slot < 0) {
        notify(hero, '⟦rune⟧ Les 6 emplacements sont occupés : retire d’abord une Rune.');
        return false;
      }
      gems().equipped[slot] = id;
      refreshActive();
      notify(hero, '⟦rune⟧ Rune ' + r.name + ' équipée');
      if (hero !== game.hero) recomputeHeroStats(hero);
      return true;
    });
  }
  function unequipFor(hero, slot) {
    return within(hero, () => {
      const lock = canChange();
      if (!Number.isInteger(slot) || slot < 0 || slot >= SLOTS || !gems().equipped[slot]) return false;
      if (!lock.ok) {
        notify(hero, '🔒 ' + lock.why);
        return false;
      }
      gems().equipped[slot] = null;
      refreshActive();
      if (hero !== game.hero) recomputeHeroStats(hero);
      return true;
    });
  }
  // Interface : un invité en ligne demande le changement à l'hôte, qui renvoie ses emplacements.
  function equipRubis(id) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'rubis-equip', rubis: id });
    const ok = equipFor(game.hero, id);
    if (ok) refreshPanel();
    return ok;
  }
  function unequipRubis(slot) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'rubis-unequip', slot });
    const ok = unequipFor(game.hero, slot);
    if (ok) refreshPanel();
    return ok;
  }
  function toggleRubis(id) {
    const slot = gems().equipped.indexOf(id);
    return slot >= 0 ? unequipRubis(slot) : equipRubis(id);
  }
  function rubisTooltip(id) {
    const r = BY_ID.get(id);
    if (!r) return '';
    const f = FAMILIES[r.family],
      n = ownedCount(id),
      slot = gems().equipped.indexOf(id);
    if (!n)
      return (
        '<div class="tooltip-name rubis-unknown">Rune inconnue · N°' +
        String(r.n).padStart(2, '0') +
        '</div><div class="tooltip-sub">' +
        esc(f.name) +
        '</div><div class="rubis-tip-desc">À découvrir dans l’Arène des Épreuves.</div>'
      );
    return (
      '<div class="rubis-tip">' +
      gem(r, 'big') +
      '<div><div class="tooltip-name" style="color:' +
      f.light +
      '">' +
      esc(r.name) +
      '</div><div class="tooltip-sub">' +
      esc(f.name) +
      ' · N°' +
      String(r.n).padStart(2, '0') +
      (n > 1 ? ' · possédée ×' + n : '') +
      '</div></div></div><div class="rubis-tip-desc">' +
      esc(r.desc) +
      '</div>' +
      (GROUP_ONLY.has(r.id)
        ? '<div class="rubis-tip-note">👥 Effet de groupe : s’active en coopération.</div>'
        : '') +
      '<div class="rubis-tip-note">' +
      (slot >= 0 ? '✅ Équipée (emplacement ' + (slot + 1) + ') · clic : retirer' : 'Clic : équiper') +
      '</div>'
    );
  }
  function showRubisTooltip(id, event) {
    gearTooltip.innerHTML = rubisTooltip(id);
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  // Pierre runique dessinée sur le canevas (bandeau de l'Arène) : mêmes silhouettes que dans l'interface
  // (styles/rubis-arena.css), liseré lumineux de la famille, pierre grise, puis l'illustration de la Rune.
  const STONE_SHAPES = [
    [
      [50, 0],
      [78, 14],
      [90, 55],
      [82, 100],
      [18, 100],
      [10, 55],
      [22, 14]
    ],
    [
      [24, 3],
      [50, 0],
      [76, 3],
      [94, 16],
      [99, 40],
      [95, 100],
      [5, 100],
      [1, 40],
      [6, 16]
    ],
    null,
    [
      [30, 0],
      [76, 5],
      [100, 38],
      [90, 90],
      [42, 100],
      [4, 80],
      [0, 30]
    ],
    [
      [12, 4],
      [86, 0],
      [100, 14],
      [96, 88],
      [84, 100],
      [10, 96],
      [0, 84],
      [4, 16]
    ],
    [
      [50, 0],
      [80, 12],
      [94, 100],
      [6, 100],
      [20, 12]
    ]
  ];
  function drawRubisGem(c, x, y, size, id) {
    const r = BY_ID.get(id);
    if (!r) return;
    const f = FAMILIES[r.family],
      pts = STONE_SHAPES[r.family];
    // Silhouette réduite de k (k = 1 : liseré ; un peu moins : la pierre).
    const path = k => {
      const s = (size / 2) * k;
      c.beginPath();
      if (!pts) c.ellipse(x, y + s * 0.06, s * 0.98, s * 0.9, 0, 0, Math.PI * 2);
      else
        pts.forEach(([px, py], i) => {
          const X = x + (px / 50 - 1) * s,
            Y = y + (py / 50 - 1) * s;
          i ? c.lineTo(X, Y) : c.moveTo(X, Y);
        });
      c.closePath();
    };
    c.save();
    const rim = c.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
    rim.addColorStop(0, f.light);
    rim.addColorStop(0.55, f.color);
    rim.addColorStop(1, f.dark);
    path(1);
    c.shadowColor = f.color;
    c.shadowBlur = size / 5;
    c.fillStyle = rim;
    c.fill();
    c.shadowBlur = 0;
    const s = size / 2,
      stone = c.createRadialGradient(x - s * 0.36, y - s * 0.48, 1, x, y, s * 1.1);
    stone.addColorStop(0, '#a9afb9');
    stone.addColorStop(0.48, '#767c88');
    stone.addColorStop(1, '#40444d');
    path(1 - 6 / size);
    c.fillStyle = stone;
    c.fill();
    c.font = Math.round(size * 0.55) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(r.icon, x, y + size * 0.03);
    c.restore();
  }
  api.equipFor = equipFor;
  api.unequipFor = unequipFor;
  Object.assign(window, { equipRubis, unequipRubis, toggleRubis, showRubisTooltip, drawRubisGem });
})();
