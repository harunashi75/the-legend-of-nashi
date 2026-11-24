// Artéfacts de l'Arène des Épreuves : douze artéfacts, un par boss, et quatre emplacements sous le héros (fiche C).
// Chaque boss vaincu donne son artéfact ; un doublon le fait monter de rang (1 à 5) et renforce son effet ; au rang
// maximum, il rapporte de l'or. Les effets (shared/data/arena-artefacts.js) ne s'appliquent qu'aux artéfacts
// équipés, aux points d'entrée du combat : stats, attackBefore / attackAfter, defense, beforeHurt, onCast,
// cooldownFactor, dodgeCooldownFactor / onDodge et healFactor.
(() => {
  'use strict';
  const LIST = ARTEFACTS,
    SLOTS = ARTEFACT_SLOTS,
    MAX = ARTEFACT_MAX_RANK;
  const BY_ID = new Map(LIST.map(a => [a.id, a]));
  const BY_WAVE = new Map(LIST.map(a => [a.wave, a]));
  const now = () => time / 60;

  // ---------------------------------------------------------------- Collection d'un héros
  // hero.artefacts : { ranks: { id: rang }, equipped: [id | null × 4] } (sauvegardé). Un héros d'avant les
  // artéfacts n'en possède ni n'en porte aucun.
  const EMPTY = Object.freeze({ ranks: Object.freeze({}), equipped: Object.freeze(Array(SLOTS).fill(null)) });
  const state = (hero = game.hero) => hero?.artefacts || EMPTY;
  const rankOf = (id, hero = game.hero) => artefactRank(state(hero).ranks[id]);
  const owned = (hero = game.hero) => LIST.filter(a => rankOf(a.id, hero) > 0);
  const equipped = (hero = game.hero) => [...state(hero).equipped];
  // Valeurs d'un artéfact équipé : { n, m } au rang du héros, ou null s'il n'est pas équipé.
  function worn(hero, id) {
    if (!state(hero).equipped.includes(id)) return null;
    const a = BY_ID.get(id),
      k = Math.max(1, rankOf(id, hero)) - 1;
    return { n: a.n[k], m: a.m[k] ?? 0 };
  }
  // Collection propre, d'après des données non fiables (sauvegarde, invité).
  function clean(raw) {
    const ranks = {};
    for (const a of LIST) {
      const r = artefactRank(raw?.ranks?.[a.id]);
      if (r > 0) ranks[a.id] = r;
    }
    const seen = new Set();
    const slots = Array.from({ length: SLOTS }, (_, k) => {
      const id = raw?.equipped?.[k];
      if (typeof id !== 'string' || !ranks[id] || seen.has(id)) return null;
      seen.add(id);
      return id;
    });
    return { ranks, equipped: slots };
  }
  // Artéfact gagné sur un boss de l'Arène (sa vague). Renvoie { artefact, rank, fresh, gold }.
  function grant(wave, hero = game.hero) {
    const a = BY_WAVE.get(wave);
    if (!a) return null;
    hero.artefacts ??= { ranks: {}, equipped: Array(SLOTS).fill(null) };
    const before = rankOf(a.id, hero);
    if (before >= MAX) {
      const gold = artefactMaxedGold(wave);
      hero.player.gold += gold;
      return { artefact: a, rank: MAX, fresh: false, gold };
    }
    hero.artefacts.ranks[a.id] = before + 1;
    return { artefact: a, rank: before + 1, fresh: before === 0, gold: 0 };
  }

  // ---------------------------------------------------------------- Effets passagers (non sauvegardés)
  const runtimes = new WeakMap();
  function rt(hero) {
    let r = runtimes.get(hero);
    if (!r)
      runtimes.set(
        hero,
        (r = {
          lastCombat: -1e9,
          shield: 0,
          prismReady: 0,
          crownReady: 0,
          invulnUntil: 0,
          voidUntil: 0,
          echoes: [],
          embers: [],
          emberAt: -1,
          plates: 0,
          platesUntil: 0,
          stoneReady: 0,
          mistReady: 0,
          mistUntil: 0,
          mistTick: 0,
          parryBoost: false,
          stormHits: 0,
          hydraAt: -1
        })
      );
    return r;
  }
  function inCombat(hero = game.hero) {
    if (game.mode === 'guest' && hero === game.hero) return CANAAN_NET.guestInCombat();
    return now() - rt(hero).lastCombat < 5 || CANAAN_ARENA.fighting();
  }
  const fx = (shape, x, y, r, c, d = 0.5, a = 0) => CANAAN_SKILLS.fx(shape, x, y, a, r, 0, c, d);
  const attackOf = hero => characterStats(hero).attack || 0;
  // Dégâts secondaires (brûlure, saignement, éclair, onde) : ils ne redéclenchent aucun effet.
  function secondary(m, amount, hero) {
    if (!m || m.hp <= 0) return 0;
    return window.CANAAN_COMBAT.rawAttack(m, Math.max(1, Math.round(amount)), hero) || 0;
  }
  // Dégâts secondaires autour d'un point.
  function around(x, y, tiles, amount, hero) {
    for (const o of game.world.monsters.slice())
      if (o.hp > 0 && canaanBodyGap(o, x, y) < tiles * TS) secondary(o, amount, hero);
  }
  // Brûlure ou saignement d'un héros sur un monstre : un seul de chaque par héros, le plus fort gardé.
  function dot(m, kind, total, hero) {
    if (!m || m.hp <= 0 || !(total > 0)) return;
    const t = now(),
      list = (m._artDots ??= []),
      old = list.find(d => d.kind === kind && d.by === hero),
      dps = total / 4;
    if (old) {
      old.dps = Math.max(old.until > t ? old.dps : 0, dps);
      old.until = t + 4;
    } else list.push({ kind, by: hero, dps, until: t + 4, tick: t + 1 });
  }
  const nearest = (m, tiles, n) =>
    game.world.monsters
      .filter(o => o !== m && o.hp > 0 && Math.hypot(o.x - m.x, o.y - m.y) < tiles * TS)
      .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
      .slice(0, n);

  // ---------------------------------------------------------------- Points d'accroche du combat
  // Statistiques : appelé à la fin de characterStats.
  function stats(s, hero = game.hero) {
    let v;
    if ((v = worn(hero, 'pierre_colosse'))) s.maxHp = Math.round(s.maxHp * (1 + v.n / 100));
    if ((v = worn(hero, 'croc_ombres'))) s.crit = Math.min(75, +((s.crit || 0) + v.n).toFixed(1));
    if ((v = worn(hero, 'couronne_souverain'))) {
      const k = 1 + v.n / 100;
      s.attack = Math.round((s.attack || 0) * k);
      s.defense = Math.round((s.defense || 0) * k);
      s.maxHp = Math.round(s.maxHp * k);
    }
    return s;
  }
  function attackBefore(m, damage, options = {}, hero = game.hero) {
    const r = rt(hero);
    r.lastCombat = now();
    let v,
      mult = 1;
    if ((v = worn(hero, 'sceau_executeur')) && m.mhp > 0 && m.hp / m.mhp < 0.35) mult *= 1 + v.n / 100;
    if (worn(hero, 'voile_neant') && now() < r.voidUntil) mult *= 1.25;
    // Écu du Déchu : la compétence qui suit une parade fait +30 %.
    if (r.parryBoost && options.skill && options.offensive) {
      r.parryBoost = false;
      mult *= 1.3;
    }
    return damage * mult;
  }
  function attackAfter(m, done, options = {}, hero = game.hero) {
    const r = rt(hero),
      t = now(),
      p = hero.player;
    r.lastCombat = t;
    if (!m || !(done > 0)) return;
    const skill = !!options.skill && !!options.offensive;
    let v;
    // Cœur de Fer : à 5 plaques, l'onde de choc part du héros.
    if ((v = worn(hero, 'coeur_fer')) && r.plates >= 5 && t < r.platesUntil) {
      r.plates = 0;
      float(p.x, p.y - 62, '⚙️ ONDE DE FER', '#d6dbe2');
      fx('groundSmash', p.x, p.y, TS * 3, '#d6dbe2', 0.7);
      around(p.x, p.y, 3, (attackOf(hero) * v.m) / 100, hero);
    }
    const wasBleeding = (m._artDots || []).some(d => d.kind === 'bleed' && d.until > t) || m.v1746_bleed > 0;
    if ((v = worn(hero, 'croc_ombres')) && m._lastCrit && m.hp > 0) dot(m, 'bleed', (done * v.m) / 100, hero);
    if ((v = worn(hero, 'ecaille_ecarlate'))) {
      if (m.hp > 0) dot(m, 'burn', (done * v.m) / 100, hero);
      // Les têtes de l'Hydre : une fois par compétence (0,5 s), sur la cible et deux ennemis proches.
      if (skill && t - r.hydraAt >= 0.5) {
        r.hydraAt = t;
        for (const o of [m, ...nearest(m, 4, 2)]) {
          if (o.hp <= 0) continue;
          CANAAN_SKILLS.fx(
            'lightning',
            p.x,
            p.y - 20,
            Math.atan2(o.y - p.y, o.x - p.x),
            Math.hypot(o.x - p.x, o.y - p.y),
            0,
            '#ff7a2a',
            0.3
          );
          fx('flames', o.x, o.y - 10, 34, '#ff7a2a', 0.5);
          secondary(o, (done * v.n) / 100, hero);
        }
      }
    }
    // Œil des Tempêtes : tous les 5 coups, la foudre du ciel et trois rebonds qui ralentissent.
    if ((v = worn(hero, 'oeil_tempetes')) && ++r.stormHits >= 5) {
      r.stormHits = 0;
      const bolt = (attackOf(hero) * v.n) / 100;
      fx('skybolt', m.x, m.y, 40, '#bfe8ff', 0.45);
      float(m.x, m.y - 70, '⚡', '#bfe8ff');
      let from = m;
      for (const o of [m, ...nearest(m, 5, 3)]) {
        if (o !== m)
          CANAAN_SKILLS.fx(
            'lightning',
            from.x,
            from.y - 16,
            Math.atan2(o.y - from.y, o.x - from.x),
            Math.hypot(o.x - from.x, o.y - from.y),
            0,
            '#bfe8ff',
            0.3
          );
        secondary(o, bolt, hero);
        if (o.hp > 0) CANAAN_CLASS.slow(hero, o, v.m / 100, 2, 'lightning');
        from = o;
      }
    }
    // Cœur de Cendres : le sol s'embrase sous la cible d'une compétence.
    if (worn(hero, 'coeur_cendres') && skill && t - r.emberAt >= 0.8) {
      r.emberAt = t;
      r.embers.push({ x: m.x, y: m.y, until: t + 3, tick: t + 1 });
      fx('fireGround', m.x, m.y, TS * 1.5, '#ff7a2a', 3);
    }
    if (m.hp <= 0) {
      if ((v = worn(hero, 'croc_ombres')) && wasBleeding) {
        p.hp = Math.min(p.mhp, p.hp + p.mhp * 0.04);
        float(p.x, p.y - 40, '🩸 +' + Math.round(p.mhp * 0.04) + ' PV', '#d8b0ff');
      }
      if ((v = worn(hero, 'sceau_executeur'))) CANAAN_SKILLS.hasten(hero, v.m);
    }
  }
  // Compétences : Cœur de Cendres renforce leurs dégâts.
  function onCast(type, i, key, context, hero = game.hero) {
    const v = worn(hero, 'coeur_cendres');
    if (!v) return context;
    return { ...context, multiplier: (context?.multiplier ?? 1) * (1 + v.n / 100) };
  }
  const cooldownFactor = (hero = game.hero) => {
    const v = worn(hero, 'coeur_cendres');
    return v ? 1 - v.m / 100 : 1;
  };
  const dodgeCooldownFactor = (hero = game.hero) => {
    const v = worn(hero, 'voile_neant');
    return v ? 1 - v.n / 100 : 1;
  };
  // Roulade : Voile du Néant (écho qui explose 1 s plus tard, +25 % de dégâts pendant 3 s).
  function onDodge(hero = game.hero) {
    if (!worn(hero, 'voile_neant')) return;
    const r = rt(hero),
      p = hero.player;
    r.voidUntil = now() + 3;
    r.echoes.push({ x: p.x, y: p.y, at: now() + 1 });
    fx('voidPool', p.x, p.y, TS * 1.2, '#9a40e0', 1);
  }
  // Soins reçus (Fiole des Brumes) ; target : le héros soigné.
  function healFactor(periodic, target = game.hero) {
    const v = worn(target, 'fiole_brumes');
    return v ? 1 + v.n / 100 : 1;
  }
  // Coup direct reçu, après la Défense, les armes et les talents : invulnérabilité, parade, plaques, peau de pierre,
  // bouclier de cristal.
  function defense(source, damage, options = {}, hero = game.hero) {
    const r = rt(hero),
      p = hero.player,
      t = now();
    r.lastCombat = t;
    if (t < r.invulnUntil) return 0;
    if (!(damage > 0)) return damage;
    let v,
      d = damage;
    if ((v = worn(hero, 'ecu_dechu')) && Math.random() < v.n / 100) {
      float(p.x, p.y - 56, '🛡️ PARADE', '#a4caff');
      fx('shieldBash', p.x, p.y, 60, '#a4caff', 0.4, source ? Math.atan2(source.y - p.y, source.x - p.x) : 0);
      r.parryBoost = true;
      if (source && source.hp > 0 && Number.isFinite(source.mhp))
        secondary(source, (attackOf(hero) * v.m) / 100, hero);
      return 0;
    }
    if ((v = worn(hero, 'coeur_fer'))) {
      const plates = t < r.platesUntil ? r.plates : 0;
      d *= 1 - (plates * v.n) / 100;
      r.plates = Math.min(5, plates + 1);
      r.platesUntil = t + 6;
      if (r.plates === 5 && plates < 5) float(p.x, p.y - 62, '⚙️ ×5', '#d6dbe2');
    }
    if ((v = worn(hero, 'pierre_colosse')) && t >= r.stoneReady) {
      r.stoneReady = t + 8;
      d *= 1 - v.m / 100;
      float(p.x, p.y - 52, '🪨 −' + v.m + ' %', '#e2d4b8');
    }
    if (r.shield > 0) {
      const absorbed = Math.min(r.shield, d);
      r.shield -= absorbed;
      d -= absorbed;
      if (absorbed > 0) float(p.x, p.y - 48, '💎 −' + Math.round(absorbed), '#e8c8ff');
      // Prisme de Cristal : le bouclier brisé éclate.
      if (r.shield <= 0 && (v = worn(hero, 'prisme_cristal'))) {
        fx('shatter', p.x, p.y - 10, TS * 3, '#e8c8ff', 0.7);
        around(p.x, p.y, 3, (attackOf(hero) * v.m) / 100, hero);
      }
    }
    return Math.max(0, d);
  }
  // Juste avant la perte de PV : Couronne du Souverain contre un coup fatal.
  function beforeHurt(n, source, hero = game.hero) {
    const p = hero.player,
      r = rt(hero),
      v = worn(hero, 'couronne_souverain');
    if (now() < r.invulnUntil) return 0;
    if (p.hp - n > 0 || !v || now() < r.crownReady) return n;
    r.crownReady = now() + 90;
    r.invulnUntil = now() + 2;
    p.hp = Math.max(1, Math.round(p.mhp * (v.m / 100)));
    canaanAchieve(hero, 'phoenix');
    float(p.x, p.y - 64, '👑 SOUVERAIN', '#ffe08a');
    fx('holyPillar', p.x, p.y, 70, '#ffe08a', 1.2);
    return 0;
  }
  // Nouvelle vague de l'Arène : le bouclier du Prisme se recharge.
  function newCombat(hero = game.hero) {
    rt(hero).prismReady = 0;
  }
  // Effets passagers en cours (barre des effets).
  function auras(hero = game.hero) {
    const r = rt(hero),
      t = now(),
      out = [],
      add = (id, left, text, stacks = 0) => {
        const a = BY_ID.get(id);
        if (left > 0) out.push({ id, icon: a.icon, name: a.name, text, left, stacks });
      };
    let v;
    if (r.shield > 0 && worn(hero, 'prisme_cristal'))
      add(
        'prisme_cristal',
        Math.max(0.1, r.prismReady - t),
        'Bouclier : absorbe ' + Math.round(r.shield) + ' dégâts.'
      );
    if ((v = worn(hero, 'coeur_fer')) && r.plates > 0)
      add('coeur_fer', r.platesUntil - t, 'Dégâts subis −' + r.plates * v.n + ' %.', r.plates);
    if (worn(hero, 'voile_neant')) add('voile_neant', r.voidUntil - t, 'Dégâts +25 %.');
    if (worn(hero, 'fiole_brumes')) add('fiole_brumes', r.mistUntil - t, 'Brume guérisseuse.');
    if (worn(hero, 'couronne_souverain'))
      add('couronne_souverain', r.crownReady - t, 'Protection contre un coup fatal en recharge.');
    return out;
  }

  // ---------------------------------------------------------------- Étape de simulation
  // Pour chaque héros : bouclier du Prisme, brume de la Fiole, échos du Néant, braises, brûlures et saignements.
  window.CanaanStages.artefacts = {
    after() {
      for (const hero of game.heroes) stepHero(hero);
    }
  };
  function stepHero(hero) {
    const p = hero.player,
      r = rt(hero),
      t = now();
    if (p.dead) return;
    let v;
    if ((v = worn(hero, 'prisme_cristal')) && t >= r.prismReady) {
      r.prismReady = t + 15;
      r.shield = (p.mhp * v.n) / 100;
      if (inCombat(hero)) float(p.x, p.y - 58, '💎 Bouclier', '#e8c8ff');
    } else if (!worn(hero, 'prisme_cristal')) r.shield = 0;
    // Fiole des Brumes : sous 35 % de PV, une brume rend m % des PV max en 5 s.
    if ((v = worn(hero, 'fiole_brumes'))) {
      if (p.hp < p.mhp * 0.35 && t >= r.mistReady) {
        r.mistReady = t + 45;
        r.mistUntil = t + 5;
        r.mistTick = t;
        fx('healSong', p.x, p.y, 60, '#a8f2bc', 1);
      }
      if (t + 1e-9 < r.mistUntil && t + 1e-9 >= r.mistTick) {
        r.mistTick += 1;
        const gain = Math.min(p.mhp - p.hp, (p.mhp * v.m) / 500);
        if (gain > 0) {
          p.hp += gain;
          float(p.x, p.y - 40, '+' + Math.round(gain) + ' PV', '#a8f2bc');
        }
      }
    }
    // Voile du Néant : les échos explosent.
    if ((v = worn(hero, 'voile_neant')))
      for (const e of r.echoes.slice())
        if (t >= e.at) {
          r.echoes.splice(r.echoes.indexOf(e), 1);
          fx('elemBurst', e.x, e.y, TS * 2.5, '#c48cff', 0.6);
          around(e.x, e.y, 2.5, (attackOf(hero) * v.m) / 100, hero);
        }
    if (!worn(hero, 'voile_neant')) r.echoes.length = 0;
    // Cœur de Cendres : le sol embrasé brûle chaque seconde.
    for (const e of r.embers.slice()) {
      if (t + 1e-9 >= e.tick && e.tick <= e.until + 1e-9) {
        e.tick += 1;
        around(e.x, e.y, 1.5, attackOf(hero) * 0.3, hero);
      }
      if (t >= e.until) r.embers.splice(r.embers.indexOf(e), 1);
    }
    for (const m of game.world.monsters.slice()) {
      if (!m._artDots) continue;
      for (const d of m._artDots.slice()) {
        // Un effet appartient au héros qui l'a posé : lui seul le fait progresser.
        if (d.by !== hero) continue;
        if (t + 1e-9 >= d.tick && t <= d.until + 1e-9 && m.hp > 0) {
          d.tick += 1;
          secondary(m, d.dps, hero);
        }
        if (t >= d.until) m._artDots.splice(m._artDots.indexOf(d), 1);
      }
    }
  }

  // ---------------------------------------------------------------- Équiper et retirer
  // Hors combat et hors Arène : on prépare ses artéfacts avant la tentative.
  function canChange(hero = game.hero) {
    if (game.world.instance?.arena)
      return { ok: false, why: 'Les artéfacts se changent avant d’entrer dans l’Arène.' };
    if (inCombat(hero)) return { ok: false, why: 'Impossible de changer d’artéfact en combat.' };
    return { ok: true, why: '' };
  }
  const notify = (hero, text) => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  // Équiper ou retirer pour un héros (l'hôte, ou un invité en ligne à sa demande). Renvoie true si un emplacement a
  // changé ; sinon le héros reçoit le message expliquant pourquoi.
  function equipFor(hero, id, slot = -1) {
    const a = BY_ID.get(id),
      lock = canChange(hero);
    if (!a || !rankOf(id, hero)) return false;
    if (!lock.ok) {
      notify(hero, '🔒 ' + lock.why);
      return false;
    }
    const eq = hero.artefacts.equipped;
    if (eq.includes(id)) return false;
    const at = Number.isInteger(slot) && slot >= 0 && slot < SLOTS ? slot : eq.indexOf(null);
    if (at < 0) {
      notify(hero, '🔮 Les 4 emplacements sont occupés : retire d’abord un artéfact.');
      return false;
    }
    eq[at] = id;
    notify(hero, '🔮 ' + a.name + ' équipé');
    if (hero !== game.hero) recomputeHeroStats(hero);
    return true;
  }
  function unequipFor(hero, slot) {
    const lock = canChange(hero),
      eq = hero.artefacts?.equipped;
    if (!eq || !Number.isInteger(slot) || slot < 0 || slot >= SLOTS || !eq[slot]) return false;
    if (!lock.ok) {
      notify(hero, '🔒 ' + lock.why);
      return false;
    }
    eq[slot] = null;
    if (hero !== game.hero) recomputeHeroStats(hero);
    return true;
  }
  // Après un changement : statistiques, puis la fiche ou le sac ouvert (l'artéfact passe de l'un à l'autre).
  function refreshPanel() {
    recomputeStats();
    refreshGearPanel();
    saveGame();
  }
  // Interface : un invité en ligne demande le changement à l'hôte, qui renvoie ses emplacements.
  function equipArtefact(id) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'artefact-equip', artefact: id });
    const ok = equipFor(game.hero, id);
    if (ok) refreshPanel();
    return ok;
  }
  function unequipArtefact(slot) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'artefact-unequip', slot });
    const ok = unequipFor(game.hero, slot);
    if (ok) refreshPanel();
    return ok;
  }
  function toggleArtefact(id) {
    const slot = state().equipped.indexOf(id);
    return slot >= 0 ? unequipArtefact(slot) : equipArtefact(id);
  }

  // ---------------------------------------------------------------- Interface : fiche du personnage (C)
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
  // Les quatre emplacements, sous le héros : l'artéfact porté (clic : le retirer) ou un socle vide.
  function slotHtml(k) {
    const a = BY_ID.get(state().equipped[k]);
    if (!a)
      return '<button type="button" class="art-slot empty" data-action="toggleInventory" title="Emplacement d’artéfact libre : équipe un artéfact depuis le sac (I)"><span>＋</span></button>';
    const rank = rankOf(a.id);
    return (
      '<button type="button" class="art-slot" style="--art:' +
      a.color +
      ';--art-l:' +
      a.light +
      '" data-action="unequipArtefact" data-slot="' +
      k +
      '" data-menu="artefact" data-artefact="' +
      a.id +
      '" data-tooltip-artefact="' +
      a.id +
      '" aria-label="Retirer ' +
      esc(a.name) +
      '"><b>' +
      a.icon +
      '</b><em>' +
      ROMAN[rank] +
      '</em></button>'
    );
  }
  // Artéfacts possédés et non équipés : des objets du sac (touche I), dans leur rubrique. Liés au héros, ils ne
  // prennent pas de place ; un clic les équipe, le clic droit propose les mêmes choix.
  function bagCells(hero = game.hero) {
    const eq = state(hero).equipped;
    return owned(hero)
      .filter(a => !eq.includes(a.id))
      .map(
        a =>
          '<button type="button" class="bag-cell art-bag-cell" style="border-color:' +
          a.light +
          ';--rarity:' +
          a.color +
          '" data-action="toggleArtefact" data-artefact="' +
          a.id +
          '" data-menu="artefact" data-tooltip-artefact="' +
          a.id +
          '" aria-label="' +
          esc(a.name) +
          '"><span class="bag-icon">' +
          a.icon +
          '</span><span class="bag-name">' +
          esc(a.name) +
          '</span><span class="bag-ilvl">' +
          ROMAN[rankOf(a.id, hero)] +
          '</span></button>'
      );
  }
  // Bloc de la fiche, sous le héros : les quatre emplacements. Les artéfacts à équiper sont dans le sac.
  function section() {
    const worn = state().equipped.filter(Boolean).length,
      lock = canChange();
    return (
      '<div class="rpg-paper art-paper"><div class="art-head"><h3>🔮 Artéfacts</h3><span>' +
      worn +
      ' / ' +
      SLOTS +
      '</span></div><div class="art-slots">' +
      Array.from({ length: SLOTS }, (_, k) => slotHtml(k)).join('') +
      '</div>' +
      (!lock.ok
        ? '<p class="art-note">🔒 ' + esc(lock.why) + '</p>'
        : !owned().length
          ? '<p class="art-note">⚔️ Chaque boss de l’Arène des Épreuves donne son artéfact.</p>'
          : '<p class="art-note">Tes artéfacts sont dans le sac (I) : clic pour les équiper.</p>') +
      '</div>'
    );
  }
  function tooltipHtml(id) {
    const a = BY_ID.get(id);
    if (!a) return '';
    const rank = rankOf(id),
      boss = CANAAN_ARENA.bosses[a.wave - 1] || '';
    if (!rank)
      return (
        '<div class="tooltip-name art-unknown">Artéfact inconnu</div><div class="tooltip-sub">Vague ' +
        a.wave +
        ' · ' +
        esc(boss) +
        '</div><div class="art-tip-desc">Vaincs ce boss de l’Arène des Épreuves pour l’obtenir.</div>'
      );
    const slot = state().equipped.indexOf(id),
      next =
        rank < MAX
          ? '<div class="art-tip-note"><b>Rang ' +
            ROMAN[rank + 1] +
            ' :</b> ' +
            esc(artefactText(a, rank + 1)) +
            '</div>'
          : '<div class="art-tip-note">Rang maximum : un nouveau doublon rapporte de l’or.</div>';
    return (
      '<div class="art-tip"><span class="art-cell" style="--art:' +
      a.color +
      ';--art-l:' +
      a.light +
      '"><b>' +
      a.icon +
      '</b></span><div><div class="tooltip-name" style="color:' +
      a.light +
      '">' +
      esc(a.name) +
      '</div><div class="tooltip-sub">Rang ' +
      ROMAN[rank] +
      ' / ' +
      ROMAN[MAX] +
      ' · ' +
      esc(boss) +
      '</div></div></div><div class="art-tip-desc">' +
      esc(artefactText(a, rank)) +
      '</div>' +
      next +
      '<div class="art-tip-note">' +
      (slot >= 0 ? '✅ Équipé (emplacement ' + (slot + 1) + ') · clic : retirer' : 'Clic : équiper') +
      '</div>'
    );
  }
  function showArtefactTooltip(id, event) {
    gearTooltip.innerHTML = tooltipHtml(id);
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  // Artéfact dessiné sur le canevas (bandeau de l'Arène) : cadre de sa couleur et son icône.
  function drawArtefact(c, x, y, size, id) {
    const a = BY_ID.get(id);
    if (!a) return;
    c.save();
    c.fillStyle = 'rgba(10,8,6,.9)';
    c.fillRect(x - size / 2, y - size / 2, size, size);
    c.strokeStyle = a.light;
    c.lineWidth = 3;
    c.strokeRect(x - size / 2, y - size / 2, size, size);
    c.font = canaanGlyphFont(Math.round(size * 0.62));
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(a.icon, x, y + size * 0.03);
    c.restore();
  }

  // ---------------------------------------------------------------- Sauvegarde et anciennes versions
  window.CANAAN_ARTEFACTS_STATE = {
    export: (hero = game.hero) => clean(state(hero)),
    import(raw, hero = game.hero) {
      hero.artefacts = clean(raw);
    }
  };
  // Or rendu, une seule fois, pour ce qu'une sauvegarde d'avant les artéfacts de l'Arène contenait encore : chaque
  // Rune possédée (collection et banque) et chaque ancien objet artéfact (sac, équipement, banque, sacoche).
  function legacyRefund(h) {
    if (!h || typeof h !== 'object') return { gold: 0, runes: 0, items: 0 };
    const count = n => Math.max(0, Math.floor(Number(n) || 0));
    let runes = 0,
      items = 0,
      gold = 0;
    for (const n of Object.values(h.rubis?.owned || {})) runes += count(n);
    for (const [key, n] of Object.entries(h.bank?.stacks || {}))
      if (key.startsWith('rubis:')) runes += count(n);
    const gear = [
      ...(Array.isArray(h.inventory) ? h.inventory : []),
      ...Object.values(h.equipment && typeof h.equipment === 'object' ? h.equipment : {}),
      ...(Array.isArray(h.bank?.items) ? h.bank.items : []),
      ...(Array.isArray(h.sacoche) ? h.sacoche : [])
    ];
    for (const it of gear)
      if (it && typeof it === 'object' && it.slot === 'artifact') {
        items++;
        gold += Math.max(1, Math.round(Number(gearSellValue({ ...it, slot: 'ring' })) || 0));
      }
    gold += runes * LEGACY_RUNE_GOLD;
    return { gold, runes, items };
  }

  window.CANAAN_ARTEFACTS = Object.freeze({
    list: LIST,
    slots: SLOTS,
    maxRank: MAX,
    get: id => BY_ID.get(id) || null,
    rank: rankOf,
    owned,
    equipped,
    grant,
    clean,
    inCombat,
    markCombat: hero => (rt(hero).lastCombat = now()),
    stats,
    attackBefore,
    attackAfter,
    onCast,
    cooldownFactor,
    dodgeCooldownFactor,
    onDodge,
    healFactor,
    defense,
    beforeHurt,
    newCombat,
    auras,
    canChange,
    section,
    bagCells,
    tooltip: tooltipHtml,
    legacyRefund,
    equipFor,
    unequipFor
  });
  Object.assign(window, {
    equipArtefact,
    unequipArtefact,
    toggleArtefact,
    showArtefactTooltip,
    drawArtefact
  });
})();
