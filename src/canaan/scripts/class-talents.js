// Classes et talents (shared/data/classes.js) : Druide, Paladin, Assassin, Élémentaliste, Invocateur, Barde,
// Berserker, Chasseur et Guerrier.
// Chaque héros a une classe et jusqu'à 5 talents équipés parmi les 10 de sa classe (hero.classe, sauvegardé) ;
// l'état de leurs effets (boucliers, minuteurs, compteurs) n'est pas sauvegardé. Chaque classe a son arme
// (class-weapons.js) ; le Druide en forme féline prend le jeu de compétences du félin (weaponType). La touche F lance
// le sort spécial (Forme féline, Lumière divine, Voile d'ombre, Avatar élémentaire, Contagion, Hymne de l'Aurore,
// Rage écarlate, Œil du faucon, Volonté de fer). Les fonctions agissent pour le héros courant choisi par
// within(hero, fn) ; l'hôte par défaut. L'Invocateur pose la Peste (charges cumulables) ; ses invocations vivent dans
// summons.js. Le Barde soigne en frappant (Écho mélodieux). Le Berserker paie ses compétences en PV (Soif de sang).
// Le Chasseur frappe plus fort de loin (Instinct du traqueur). Le Guerrier accumule l'Élan (Maître d'armes).
(() => {
  'use strict';
  const runtimes = new WeakMap();
  let cur = null,
    HP = null,
    w = null;
  function fresh() {
    return {
      shield: 0,
      shieldUntil: 0,
      specialReady: 0,
      // Druide : Écorce de fer, Instinct du fauve, Équilibre sauvage, Symbiose reçue.
      barkUntil: 0,
      barkReady: 0,
      instinctCrit: false,
      balanceNature: 0,
      balanceFeline: 0,
      balanceUntil: 0,
      symbiosisUntil: 0,
      // Paladin : Lumière divine reçue, Exaltation (Ferveur ardente), Rempart tournoyant, Lumière vengeresse,
      // Intervention divine.
      divineUntil: 0,
      holySeal: null,
      exaltUntil: 0,
      exaltReady: 0,
      shieldOrbitUntil: 0,
      radiantReady: 0,
      interventionUsed: false,
      invulnUntil: 0,
      // Assassin : Voile d'ombre, Embuscade, Ombre meurtrière, Danse des ombres.
      veilUntil: 0,
      umbra: false,
      crits: 0,
      shadowPending: false,
      shadowReady: 0,
      danceCrit: false,
      // Élémentaliste : Avatar élémentaire, Fusion élémentaire, Avatar primordial, Barrière de givre.
      elemAvatarUntil: 0,
      fusion: { fire: -99, ice: -99, lightning: -99 },
      fusionReady: false,
      primordial: false,
      frostUntil: 0,
      // Invocateur : Contagion, Pacte de sang et Moisson d'âmes.
      contagionUntil: 0,
      bloodReady: 0,
      harvest: 0,
      harvestReady: 0,
      // Barde : Hymne de l'Aurore reçu, Mélodie vivifiante reçue, Crescendo, Tempo.
      hymnUntil: 0,
      hymnTick: 0,
      hymnBy: null,
      vivifyUntil: 0,
      crescendo: 0,
      crescendoUntil: 0,
      tempo: 0,
      // Berserker : Rage écarlate, Soif de sang renforcée après une utilitaire, Cicatrices, Frénésie, Immortel et PV
      // dépensés (Sang bouillant).
      rageUntil: 0,
      ragePenalty: false,
      thirst: false,
      scars: 0,
      scarsUntil: 0,
      scarsAt: -1,
      frenzyUntil: 0,
      undyingReady: 0,
      spent: 0,
      // Chasseur : Œil du faucon, Instinct de survie, Piège de givre.
      hawkUntil: 0,
      survivalUntil: 0,
      survivalReady: 0,
      trapReady: 0,
      focusGainAt: -1,
      // Guerrier : Élan, Volonté de fer, Cri de ralliement reçu, Second souffle, onde de Seigneur de guerre.
      momentum: 0,
      momentumUntil: 0,
      momentumAt: -1,
      ironUntil: 0,
      rallyUntil: 0,
      windUntil: 0,
      windTick: 0,
      warlordAt: -1,
      // Ritournelle : un seul message de bouclier par allié toutes les 3 s.
      refrain: new WeakMap()
    };
  }
  const runtime = hero => {
    if (!runtimes.has(hero)) runtimes.set(hero, fresh());
    return runtimes.get(hero);
  };
  function within(hero, fn) {
    const previous = [cur, HP, w];
    cur = hero;
    HP = hero.player;
    w = runtime(hero);
    try {
      return fn();
    } finally {
      [cur, HP, w] = previous;
    }
  }
  const me = () => cur || game.hero;
  const NO_CLASS = Object.freeze({ id: null, talents: Object.freeze([]) });
  const classe = (hero = me()) => hero.classe || NO_CLASS;
  const def = (hero = me()) => classById(classe(hero).id);
  const forHero =
    (fn, at) =>
    (...args) =>
      within(args[at] && args[at].player ? args[at] : game.hero, () => fn(...args));
  // Numéro de chaque talent dans sa classe (voir shared/data/classes.js).
  const T = Object.freeze({
    druide: {
      thornlash: 0,
      bloom: 1,
      spores: 2,
      wrath: 3,
      instinct: 4,
      bleeds: 5,
      predator: 6,
      symbiosis: 7,
      bark: 8,
      balance: 9
    },
    paladin: {
      crusade: 0,
      bastion: 1,
      radiantSeal: 2,
      sentence: 3,
      holyground: 4,
      zeal: 5,
      orbit: 6,
      martyr: 7,
      radiant: 8,
      intervention: 9
    },
    assassin: {
      venom: 0,
      fan: 1,
      assassinate: 2,
      hemorrhage: 3,
      rending: 4,
      precision: 5,
      dance: 6,
      phantom: 7,
      crippling: 8,
      shadow: 9
    },
    elementaliste: {
      combustion: 0,
      twin: 1,
      winter: 2,
      shatter: 3,
      conductor: 4,
      static: 5,
      fusion: 6,
      frost: 7,
      blaze: 8,
      primordial: 9
    },
    invocateur: {
      virulence: 0,
      necrosis: 1,
      eternal: 2,
      legion: 3,
      corpse: 4,
      siphon: 5,
      carapace: 6,
      pandemic: 7,
      bloodPact: 8,
      harvest: 9
    },
    barde: {
      crescendo: 0,
      ballad: 1,
      counter: 2,
      vivify: 3,
      dissonance: 4,
      choir: 5,
      piercing: 6,
      tempo: 7,
      refrain: 8,
      finale: 9
    },
    berserker: {
      frenzy: 0,
      scars: 1,
      lastStand: 2,
      ironSkin: 3,
      bloodletting: 4,
      hunger: 5,
      boiling: 6,
      butcher: 7,
      carnage: 8,
      undying: 9
    },
    chasseur: {
      aimed: 0,
      torrent: 1,
      falconer: 2,
      prey: 3,
      disengage: 4,
      barbed: 5,
      multishot: 6,
      frosttrap: 7,
      survival: 8,
      apex: 9
    },
    guerrier: {
      honed: 0,
      cyclone: 1,
      unstoppable: 2,
      coupdegrace: 3,
      ambidextrous: 4,
      secondwind: 5,
      fury: 6,
      riposte: 7,
      rally: 8,
      warlord: 9
    }
  });
  const on = (cls, key, hero = me()) =>
    classe(hero).id === cls && T[cls]?.[key] !== undefined && classe(hero).talents.includes(T[cls][key]);
  const isClass = (cls, hero = me()) => classe(hero).id === cls;
  // Même horloge que la simulation : pauses et onglets suspendus ne consomment pas les durées.
  const now = () => time / 60;
  const TILES = n => n * TS;
  const notice = text => (me() === game.hero ? toast(text) : canaanLootNotice(me(), text));
  const inCombat = (hero = me()) => CANAAN_ARTEFACTS.inCombat(hero);
  const feral = (hero = me()) => isClass('druide', hero) && hero.player.form === 'feral';
  // Rage écarlate du Berserker en cours.
  const raging = (hero = me()) => isClass('berserker', hero) && now() < runtime(hero).rageUntil;
  const near = (a, b, tiles) => Math.hypot(a.x - b.x, a.y - b.y) < TILES(tiles);
  const alive = m => m && m.hp > 0;
  const isBoss = m => !!(m.boss || m.worldBoss || m.arenaBoss);
  const ELEMENTAL = ['fire', 'ice', 'lightning'];
  const elementColor = el => ELEMENTS[el]?.color || '#ffffff';
  // Jeu de compétences actif d'un héros : l'arme de sa classe, ou les griffes du félin pour le Druide transformé.
  const weaponType = (hero = me()) => (feral(hero) ? 'feline' : hero.equipment?.weapon?.weaponType || '');
  // Élan du Guerrier en cours (0 à 5).
  const momentum = (hero = me()) => {
    const r = runtime(hero);
    return isClass('guerrier', hero) && now() < r.momentumUntil ? r.momentum : 0;
  };
  // Effet visuel (vfx-art.js) : une explosion de l'élément, montrée aussi aux invités.
  const fx = (shape, x, y, r, c, d = 0.5, a = 0) => CANAAN_SKILLS.fx(shape, x, y, a, r, 0, c, d);

  // ---------------------------------------------------------------- État sauvegardé
  function slots(hero = me()) {
    return talentSlotsAt(clampLevel(hero.level));
  }
  function setClasse(hero, raw) {
    hero.classe = sanitizeClasse(raw, clampLevel(hero.level));
  }
  // Arme de la classe : summons.js la donne, la retire et la fait grandir avec le héros.
  const pact = hero => CANAAN_SUMMONS.syncPact(hero);
  window.CANAAN_CLASS_STATE = {
    export: () => ({ id: classe(game.hero).id, talents: [...classe(game.hero).talents] }),
    import(d) {
      setClasse(game.hero, d);
      game.hero.player.form = null;
      runtimes.set(game.hero, fresh());
      pact(game.hero);
    }
  };

  // ---------------------------------------------------------------- Statistiques
  // Talents, passif et sort spécial qui changent les statistiques (après l'équipement).
  // Les réductions de dégâts s'ajoutent à la Garde (guard, en %) : elles comptent aussi contre les dégâts sur la durée.
  window.CANAAN_CLASS_STATS = forHero(function (s) {
    const t = now(),
      id = classe().id;
    if (id === 'assassin') {
      s.speed += 5;
      s.critPower += 10;
    }
    if (on('assassin', 'precision')) {
      s.crit += 10;
      s.critPower += 20;
    }
    if (feral()) {
      s.speed += 20;
      s.crit += 8;
    }
    if (t < w.veilUntil) s.speed += 30;
    // Lumière divine reçue (d'un Paladin, soi compris).
    if (t < w.divineUntil) s.guard += 20;
    // Carapace d'os : au moins deux invocations en jeu.
    if (on('invocateur', 'carapace') && CANAAN_SUMMONS.count(me()) >= 2) s.guard += 10;
    // Mélodie vivifiante reçue (d'un Barde, soi compris).
    if (t < w.vivifyUntil) s.speed += 15;
    if (on('berserker', 'ironSkin')) s.guard += 10;
    if (on('berserker', 'lastStand') && CANAAN_SKILLS.state(me()).berserk > 0) s.guard += 20;
    // Chasseur : Œil du faucon, Instinct de survie.
    if (t < w.hawkUntil) s.crit += 10;
    if (t < w.survivalUntil) {
      s.speed += 30;
      s.guard += 20;
    }
    // Guerrier : Volonté de fer, Cri de ralliement reçu, Seigneur de guerre, Fureur martiale.
    if (t < w.ironUntil) s.guard += 30;
    if (t < w.rallyUntil) s.guard += 15;
    const elan = momentum();
    if (on('guerrier', 'warlord')) s.crit += 2 * elan;
    if (on('guerrier', 'fury') && elan >= 5) s.critPower += 25;
    return s;
  }, 1);

  // ---------------------------------------------------------------- Soins
  // Bonus de soins effectués d'un héros : Soin (secondaire), talents ; la forme féline les réduit.
  function healingDone(hero) {
    const st = characterStats(hero),
      r = runtime(hero),
      t = now();
    return (
      (1 + Math.max(0, st.healingBonus || 0) / 100) *
      (isClass('barde', hero) ? 1.1 : 1) *
      (on('barde', 'ballad', hero) ? 1.2 : 1) *
      (on('barde', 'crescendo', hero) && t < r.crescendoUntil ? 1 + 0.04 * r.crescendo : 1) *
      (raging(hero) ? 2 : 1) *
      (feral(hero) ? 0.7 : 1)
    );
  }
  function giveShield(hero, amount, seconds, label) {
    const r = runtime(hero),
      t = now();
    // Non cumulable : le plus fort bouclier en cours, sa durée repoussée.
    r.shield = t < r.shieldUntil ? Math.max(r.shield, amount) : amount;
    r.shieldUntil = Math.max(r.shieldUntil, t + seconds);
    if (label) float(hero.player.x, hero.player.y - 58, label, '#bfe4ff');
  }
  // Soin de target par healer (lui-même par défaut). periodic : régénération, rendu tel quel (sans bonus).
  // splash : soin secondaire (Lumière sacrée), qui ne se propage pas à son tour.
  function applyHeal(n, periodic, target, healer, splash) {
    const p = target.player;
    if (!(n > 0) || p.dead || target.away) return 0;
    // Artéfacts (Fiole des Brumes) et malédiction des soins de l'Arène.
    const outside = CANAAN_ARTEFACTS.healFactor(periodic, target) * CANAAN_ARENA.healFactor(target),
      amount = periodic ? n * outside : Math.round(n * healingDone(healer) * outside);
    let gained = 0;
    if (p.hp < p.mhp) {
      gained = Math.max(0, Math.min(p.mhp - p.hp, amount));
      p.hp += gained;
    }
    if (periodic) return gained;
    // Barde : le soin en trop devient un bouclier (Ritournelle) ; le soin donne de l'élan (Mélodie vivifiante).
    const overflow = Math.max(0, amount - gained);
    if (overflow > 0 && on('barde', 'refrain', healer)) {
      const r = runtime(target),
        t = now(),
        current = t < r.shieldUntil ? r.shield : 0,
        talk = t >= (runtime(healer).refrain.get(target) || 0);
      if (talk) runtime(healer).refrain.set(target, t + 3);
      giveShield(target, Math.min(p.mhp * 0.15, current + overflow), 6, talk ? '🎵 Bouclier' : '');
    }
    if (gained > 0 && on('barde', 'vivify', healer)) runtime(target).vivifyUntil = now() + 5;
    // Lumière sacrée (passif du Paladin) : ses soins sur lui-même soignent aussi les alliés proches, à 50 %.
    if (!splash && target === healer && isClass('paladin', healer))
      for (const ally of game.heroes)
        if (ally !== healer && !ally.player.dead && !ally.away && near(ally.player, healer.player, 6)) {
          const h = applyHeal(n * 0.5, false, ally, healer, true);
          if (h > 0) float(ally.player.x, ally.player.y - 40, '+' + Math.round(h) + ' PV', '#ffe9a0');
        }
    if (target === healer || gained <= 0) return gained;
    // Symbiose (Druide) : soigner un allié rend 25 % du soin au Druide et donne +10 % de dégâts à l'allié.
    if (on('druide', 'symbiosis', healer)) {
      applyHeal(gained * 0.25, true, healer, healer, true);
      runtime(target).symbiosisUntil = now() + 4;
    }
    return gained;
  }
  // canaanApplyHeal(n, periodic, hero, healer) : soin d'un héros (l'hôte par défaut) par un soigneur (lui-même).
  window.canaanApplyHeal = (n, periodic = false, hero = game.hero, healer = hero, splash = false) =>
    applyHeal(
      n,
      periodic,
      hero && hero.player ? hero : game.hero,
      healer && healer.player ? healer : hero && hero.player ? hero : game.hero,
      splash
    );

  function markHolySeal(m) {
    w.holySeal = { target: m, until: now() + 6, hits: 0 };
    CANAAN_ARTEFACTS.markCombat(me());
    fx('holyPillar', m.x, m.y, 45, '#ffe08a', 0.75);
  }
  function healFromSeal(m, t) {
    const seal = w.holySeal;
    if (HP.dead || !seal || seal.target !== m || t >= seal.until) return;
    const h = applyHeal(HP.mhp * 0.03, false, me(), me(), false);
    if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#ffe9a0');
    if (on('paladin', 'radiantSeal') && ++seal.hits === 3) {
      seal.hits = 0;
      blast(m.x, m.y, 3, characterStats(me()).attack * 1.5, 'holy');
    }
  }
  function holySealTargets() {
    const targets = new Set(),
      t = now();
    for (const hero of game.heroes) {
      if (hero.player.dead || hero.away || !isClass('paladin', hero)) continue;
      const seal = runtime(hero).holySeal;
      if (seal && t < seal.until && alive(seal.target)) targets.add(seal.target);
    }
    return targets;
  }

  // ---------------------------------------------------------------- Effets sur les monstres
  // Effet sur la durée d'un héros sur un monstre : un seul par type et par héros, la plus forte valeur gardée.
  function dot(m, kind, seconds, total, element) {
    if (!alive(m) || !(total > 0)) return;
    const t = now(),
      list = (m._clsDots ??= []),
      old = list.find(d => d.kind === kind && d.by === me() && d.until > t),
      boosted = kind === 'burn' && on('elementaliste', 'combustion') ? total * 1.3 : total,
      next = refreshDot(old, boosted / seconds, t + seconds);
    if (old) Object.assign(old, next);
    else list.push({ kind, by: me(), element, dps: next.dps, until: next.until, tick: t + 1 });
    float(
      m.x,
      m.y - 50,
      { thorns: '🌿', sap: '🌱', poison: '☠️', bleed: '🩸', burn: '🔥' }[kind] || '✦',
      elementColor(element)
    );
  }
  const hasDot = (m, kinds, hero = me()) =>
    (m._clsDots || []).some(d => d.by === hero && d.until > now() && kinds.includes(d.kind));
  // Ralentissement d'un héros : le plus fort en cours, jamais cumulé.
  function slow(m, pct, seconds, element) {
    if (!alive(m)) return;
    const t = now(),
      s = m._clsSlow;
    if (!s || s.until <= t || pct >= s.pct)
      m._clsSlow = { pct, until: Math.max(s && s.until > t ? s.until : 0, t + seconds), by: me(), element };
    else s.until = Math.max(s.until, t + seconds);
    if (element === 'ice') float(m.x, m.y - 47, '❄️', '#8fdcff');
  }
  const slowedBy = (m, element, hero = me()) =>
    m._clsSlow &&
    m._clsSlow.until > now() &&
    m._clsSlow.by === hero &&
    (!element || m._clsSlow.element === element);
  // Givre de l'Élémentaliste sur un monstre (gelé ou ralenti par sa glace) : Éclats de glace le brise une fois.
  function chill(m, seconds) {
    if (!alive(m)) return;
    m._chill = { by: me(), until: now() + seconds, shattered: false };
  }
  // Poisons du Druide (sève, ronces, poison) sur une cible.
  const poisoned = (m, hero = me()) => hasDot(m, ['thorns', 'sap', 'poison'], hero);
  // Un ennemi qui saigne (saignement d'un héros ou des armes).
  const bleeding = m =>
    (m._clsDots || []).some(d => d.kind === 'bleed' && d.until > now()) ||
    m.v1746_bleed > 0 ||
    m.spell_bleed > 0;
  // Consume les saignements d'une cible : factor × ce qu'il leur restait à faire, d'un coup.
  function consumeBleeds(m, factor) {
    if (!alive(m)) return 0;
    const t = now();
    let rest = 0;
    if (m.v1746_bleed > 0) {
      rest += m.v1746_bleed * (m.v1746_bleedPower || 2);
      m.v1746_bleed = 0;
    }
    for (const d of (m._clsDots || []).slice())
      if (d.kind === 'bleed' && d.until > t) {
        rest += d.dps * Math.max(0, d.until - t);
        m._clsDots.splice(m._clsDots.indexOf(d), 1);
      }
    if (!(rest > 0)) return 0;
    fx('bloodSplash', m.x, m.y - 10, 40, '#d0303f', 0.5);
    return effectHit(m, rest * factor, 'blood');
  }
  // ---------------------------------------------------------------- Peste (Invocateur)
  // Charges cumulables d'un même héros sur un monstre : 8 au maximum (12 avec Virulence), 5 s (7 s) renouvelées à
  // chaque charge ; chaque charge inflige 8 % de l'Attaque du héros par seconde. Plusieurs Invocateurs ont chacun
  // leur Peste.
  const PLAGUE = Object.freeze({ stacks: 8, seconds: 5, perStack: 0.08, harvest: 12 });
  const plagueOf = (m, hero = me()) => (m?._plague || []).find(p => p.by === hero && p.until > now()) || null;
  const plagueStacks = (m, hero = me()) => plagueOf(m, hero)?.stacks || 0;
  function addPlague(m, n) {
    if (!alive(m) || !(n > 0)) return;
    const t = now(),
      list = (m._plague ??= []),
      virulent = on('invocateur', 'virulence'),
      cap = virulent ? 12 : PLAGUE.stacks;
    let p = list.find(x => x.by === me());
    if (p && p.until <= t) {
      list.splice(list.indexOf(p), 1);
      p = null;
    }
    if (!p) list.push((p = { by: me(), stacks: 0, until: 0, tick: t + 1 }));
    const before = p.stacks;
    p.stacks = Math.min(cap, p.stacks + n);
    p.until = t + PLAGUE.seconds + (virulent ? 2 : 0);
    if (p.stacks !== before) float(m.x, m.y - 50, '☠️ ' + p.stacks, '#a4e83c');
    // Moisson d'âmes : toutes les 12 charges posées, un squelette gratuit (recharge 10 s).
    if (on('invocateur', 'harvest')) {
      w.harvest = Math.min(PLAGUE.harvest, w.harvest + n);
      if (w.harvest >= PLAGUE.harvest && t >= w.harvestReady) {
        w.harvest = 0;
        w.harvestReady = t + 10;
        if (CANAAN_SUMMONS.free(me(), 0)) float(HP.x, HP.y - 66, '💀 MOISSON D’ÂMES', '#a4e83c');
      }
    }
  }
  // Pandémie : un ennemi qui meurt sous la Peste en transmet la moitié des charges aux ennemis à 3 cases.
  function spreadPlague(m) {
    const p = (m._plague || []).find(x => x.by === me() && x.until > now() - 1e-9);
    if (!p || m._clsSpread || !on('invocateur', 'pandemic')) return;
    m._clsSpread = true;
    const n = Math.ceil(p.stacks / 2);
    fx('poisonBurst', m.x, m.y, TILES(3), '#a4e83c', 0.5);
    for (const o of game.world.monsters.slice()) if (o !== m && alive(o) && near(o, m, 3)) addPlague(o, n);
  }
  // Dégâts d'un effet (sur la durée, éclair, explosion) : ne redéclenchent pas les talents (aucune récursion).
  function effectHit(m, amount, element) {
    if (!alive(m)) return 0;
    const burned = hasDot(m, ['burn']);
    const done = window.CANAAN_COMBAT.rawAttack(m, Math.max(1, Math.round(amount)), me()) || 0;
    if (m.hp <= 0) onKill(m, burned);
    return done;
  }
  // Explosion d'un élément autour d'un point (vfx-art.js dessine l'élément : flammes, givre, éclairs…).
  function blast(x, y, tiles, amount, element, except = null) {
    fx('elemBurst', x, y, TILES(tiles), elementColor(element), 0.6);
    for (const m of game.world.monsters.slice())
      if (m !== except && alive(m) && canaanBodyGap(m, x, y) < TILES(tiles)) effectHit(m, amount, element);
  }
  // Renvoi de dégâts à un attaquant (Bastion, Écorce de fer, Riposte).
  function reflect(m, amount, element) {
    if (!alive(m) || !(amount > 0)) return;
    fx('spark', m.x, m.y - 14, 18, elementColor(element), 0.25);
    effectHit(m, amount, element);
  }
  function onKill(m, burned) {
    if (m._clsKilledBy?.has?.(me())) return;
    (m._clsKilledBy ??= new Set()).add(me());
    spreadPlague(m);
    const t = now();
    // Berserker : Frénésie (recharges −3 s, attaques de base plus rapides) et Carnage (6 % des PV max, Rage +2 s).
    if (isClass('berserker')) {
      if (on('berserker', 'frenzy')) {
        CANAAN_SKILLS.hasten(me(), 3);
        w.frenzyUntil = t + 5;
      }
      if (on('berserker', 'carnage')) {
        const h = applyHeal(HP.mhp * 0.06, false, me(), me(), true);
        if (h > 0) float(HP.x, HP.y - 40, '🩸 +' + Math.round(h) + ' PV', '#ff8a96');
        if (t < w.rageUntil) w.rageUntil += 2;
      }
    }
    // Explosion ardente : un ennemi brûlé par l'Élémentaliste explose et propage sa brûlure (une seule fois).
    if (burned && on('elementaliste', 'blaze') && !m._clsExploded) {
      m._clsExploded = true;
      const burn = (m._clsDots || []).find(d => d.kind === 'burn' && d.by === me());
      blast(m.x, m.y, 3, characterStats(me()).attack * 0.8, 'fire', m);
      if (burn)
        for (const o of game.world.monsters.slice())
          if (o !== m && alive(o) && near(o, m, 3)) dot(o, 'burn', 4, burn.dps * 4, 'fire');
    }
    // Assassinat : la cible du Pas de l'ombre meurt dans les 3 s.
    if (m._assassinBy?.hero === me() && m._assassinBy.until > t) {
      CANAAN_SKILLS.resetCooldown(me(), 'dualdagger:1');
      float(HP.x, HP.y - 74, '🌑 ASSASSINAT', '#c48cff');
    }
    // Proie désignée : la Marque saute sur l'ennemi le plus proche.
    if (m._huntMark?.by === me() && m._huntMark.until > t && on('chasseur', 'prey')) {
      const next = game.world.monsters
        .filter(o => o !== m && alive(o) && near(o, m, 10))
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
      if (next) {
        next._huntMark = { ...m._huntMark };
        fx('markCast', next.x, next.y - 20, 40, '#ffd27a', 0.8);
      }
    }
    // Maître de la traque : pendant l'Œil du faucon, chaque victime réduit les recharges de 2 s.
    if (on('chasseur', 'apex') && t < w.hawkUntil) CANAAN_SKILLS.hasten(me(), 2);
  }

  // ---------------------------------------------------------------- Soif de sang (Berserker)
  // Le Berserker paie ses compétences en PV : chaque point de mana vaut 0,6 % de ses PV max au niveau 1, jusqu'à 1 %
  // au niveau 60 (shared/rules/resources.js). Une compétence ne peut jamais le tuer (il lui faut garder au moins
  // 1 PV) ; un compagnon garde 25 % de ses PV.
  const BLOOD = Object.freeze({ boil: 0.2, companionFloor: 0.25 });
  const bloodPrice = (hero, mana) =>
    resourceBloodCost(hero.player.mhp, mana * (on('berserker', 'ironSkin', hero) ? 0.8 : 1), hero.level);
  function canBleed(price) {
    const floor = me() !== game.hero && me().local ? HP.mhp * BLOOD.companionFloor : 0;
    return HP.hp - price >= Math.max(1, floor);
  }
  // Sang bouillant : tous les 20 % des PV max dépensés, une explosion de sang autour du Berserker.
  function boil(price) {
    if (!on('berserker', 'boiling')) return;
    w.spent += price;
    while (w.spent >= HP.mhp * BLOOD.boil) {
      w.spent -= HP.mhp * BLOOD.boil;
      float(HP.x, HP.y - 70, '🩸 SANG BOUILLANT', '#e0404f');
      blast(HP.x, HP.y, 3, characterStats(me()).attack * 2, 'blood');
    }
  }
  // Ressource de la classe du héros (shared/rules/resources.js) : mana, Énergie, Ferveur, Rythme, Concentration,
  // Rage ou PV (Berserker).
  const resource = (hero = me()) => classResource(classe(hero).id);
  // Coût du sort spécial d'une classe dans sa ressource (prix en mana converti au niveau du héros).
  const specialPrice = (c, hero = me()) =>
    c?.special?.mana > 0 ? resourceCost(classResource(c.id), c.special.mana, hero?.level) : 0;
  // Gain de ressource sur un événement de combat ; une attaque de base de zone ne compte qu'une fois.
  function gainResource(event, info) {
    let amount = resourceGain(resource(), event, info);
    // Ferveur ardente (Paladin) : 4 de plus par coup reçu.
    if (event === 'hurt' && on('paladin', 'zeal')) amount += 4;
    if (!(amount > 0)) return;
    if (event === 'basic') {
      if (now() - (w.basicGainAt ?? -1) < RESOURCE_BASIC_GAP) return;
      w.basicGainAt = now();
    }
    HP.mp = Math.min(HP.mmp, HP.mp + amount);
  }
  // Paiement d'une compétence (après les réductions de CANAAN_CLASS_MANA_COST) : dans la ressource de la classe, ou
  // en PV pour le Berserker. Renvoie false si le héros ne peut pas payer (rien n'est retiré).
  window.CANAAN_CLASS_PAY = forHero(function (cost) {
    if (!isClass('berserker')) {
      if (HP.mp < cost) return false;
      HP.mp -= cost;
      // Tempo (Barde) : tous les 20 de Rythme dépensés, les recharges baissent d'1 s.
      if (on('barde', 'tempo') && cost > 0) {
        w.tempo += cost;
        while (w.tempo >= 20) {
          w.tempo -= 20;
          CANAAN_SKILLS.hasten(me(), 1);
        }
      }
      return true;
    }
    const price = bloodPrice(me(), cost);
    if (!canBleed(price)) return false;
    if (price > 0) {
      HP.hp -= price;
      float(HP.x, HP.y - 30, '🩸 −' + price, '#e0404f');
      boil(price);
    }
    return true;
  }, 1);
  window.CANAAN_CLASS_CAN_PAY = forHero(
    cost => (isClass('berserker') ? canBleed(bloodPrice(me(), cost)) : HP.mp >= cost),
    1
  );
  // Rage écarlate : ne pas descendre sous 1 PV, attaques de base plus rapides, soins doublés ; penalty : perte de
  // 20 % des PV max à la fin (pas pour celle d'Immortel).
  function startRage(seconds, penalty) {
    w.rageUntil = now() + seconds;
    w.ragePenalty = penalty;
    fx('bloodBurst', HP.x, HP.y, 90, '#e0404f', 0.7);
    float(HP.x, HP.y - 62, '🩸 RAGE ÉCARLATE', '#e0404f');
  }
  function addScars(n) {
    const t = now();
    w.scars = Math.min(10, (t < w.scarsUntil ? w.scars : 0) + n);
    w.scarsUntil = t + 6;
  }
  // Élan du Guerrier : +1 (ou n) charge, 5 au maximum, 4 s renouvelées.
  function addMomentum(n = 1) {
    const t = now(),
      before = t < w.momentumUntil ? w.momentum : 0;
    w.momentum = Math.min(5, before + n);
    w.momentumUntil = t + 4;
    if (w.momentum >= 5 && before < 5) float(HP.x, HP.y - 72, '⚔️ ÉLAN ×5', '#e8f0ff');
  }

  // ---------------------------------------------------------------- Compétences
  // Coût d'une compétence dans la ressource de la classe (base : son prix en mana, converti selon la ressource et le
  // niveau), puis les réductions des talents et des sorts spéciaux.
  window.CANAAN_CLASS_MANA_COST = forHero(function (type, i, base) {
    const t = now(),
      offensive = isOffensiveSkill(type, i);
    let cost = resourceCost(resource(), base, me().level);
    if (t < w.elemAvatarUntil) cost *= 0.7;
    // Exaltation (Ferveur ardente) : moitié prix.
    if (t < w.exaltUntil) cost *= 0.5;
    // Fureur martiale (Guerrier) : à 5 Élans, 30 % de Rage en moins.
    if (on('guerrier', 'fury') && momentum() >= 5) cost *= 0.7;
    // Gratuites : Ombre meurtrière prête (offensive), Fusion élémentaire prête.
    if (offensive && w.shadowPending) cost = 0;
    if (w.fusionReady) cost = 0;
    return cost;
  }, 3);
  // Lancement d'une compétence : contexte de ses coups (magique, élément, offensive, multiplicateur) et
  // déclencheurs comptés par compétence (Crescendo, Fusion, Équilibre, Ombre meurtrière, Voile d'ombre…).
  window.CANAAN_CLASS_CAST = forHero(function (type, i) {
    const offensive = isOffensiveSkill(type, i),
      t = now(),
      element = skillElement(classe().id, i),
      context = {
        magic: MAGIC_WEAPONS.includes(type),
        multiplier: 1,
        skill: true,
        offensive,
        slot: i,
        weapon: type,
        element
      };
    // Équilibre sauvage (Druide) : compétences de nature et compétences félines comptées.
    if (isClass('druide')) {
      if (type === 'feline') w.balanceFeline++;
      else w.balanceNature++;
      // Instinct du fauve : la première compétence féline après la transformation est critique.
      if (type === 'feline' && w.instinctCrit) {
        w.instinctCrit = false;
        context.forceCrit = true;
      }
    }
    // Fusion élémentaire (Élémentaliste) : d'abord la fusion prête (+50 %, gratuite), puis l'élément compté.
    if (isClass('elementaliste')) {
      if (element === 'fire' && on('elementaliste', 'frost') && t < w.frostUntil) {
        w.frostUntil = 0;
        context.multiplier *= 1.4;
      }
      if (w.fusionReady) {
        w.fusionReady = false;
        context.multiplier *= 1.5;
        float(HP.x, HP.y - 74, '🌈 FUSION +50 %', '#ffe08a');
      } else if (on('elementaliste', 'fusion') && ELEMENTAL.includes(element)) {
        w.fusion[element] = t;
        if (ELEMENTAL.every(el => t - w.fusion[el] <= 8)) {
          w.fusionReady = true;
          w.fusion = { fire: -99, ice: -99, lightning: -99 };
          float(HP.x, HP.y - 74, '🌈 FUSION PRÊTE', '#ffe08a');
        }
      }
      // Avatar primordial : la compétence libère aussi une décharge des deux autres éléments sur sa cible.
      if (on('elementaliste', 'primordial') && t < w.elemAvatarUntil) w.primordial = element || 'fire';
    }
    if (!offensive) return context;
    // Soif de sang doublée (Berserker) : la compétence offensive qui suit une utilitaire.
    if (w.thirst) {
      w.thirst = false;
      context.thirst = true;
      context.multiplier *= 1.2;
      context.bloodFury = on('berserker', 'lastStand');
      float(HP.x, HP.y - 74, '🩸 SOIF DE SANG', '#e0404f');
    }
    // Empreinte de l'Assassin : une compétence utilitaire renforce la prochaine compétence offensive.
    if (w.umbra) {
      w.umbra = false;
      context.multiplier *= 1.25;
      float(HP.x, HP.y - 74, '🌑 EMBUSCADE +25 %', '#c48cff');
    }
    if (w.shadowPending) {
      w.shadowPending = false;
      context.multiplier *= 1.4;
      float(HP.x, HP.y - 60, '🗡️ OMBRE MEURTRIÈRE', '#c48cff');
    }
    if (t < w.veilUntil) {
      context.multiplier *= 1.4;
      endVeil();
    }
    // Barde : Crescendo (+4 % par compétence offensive, 20 % au plus, 8 s).
    if (on('barde', 'crescendo')) {
      w.crescendo = t < w.crescendoUntil ? Math.min(5, w.crescendo + 1) : 1;
      w.crescendoUntil = t + 8;
    }
    return context;
  }, 2);
  // Empreintes de classe après une compétence : bouclier (Paladin), soins (Druide, Barde), embuscade (Assassin),
  // Soif de sang (Berserker). Les effets sur les coups sont dans after().
  window.CANAAN_CLASS_AFTER_CAST = forHero(function (type, i) {
    const id = classe().id;
    if (!id) return;
    const offensive = isOffensiveSkill(type, i),
      group = groupAround(6),
      t = now();
    if (type === 'staff' && i === 1 && on('elementaliste', 'frost')) {
      w.frostUntil = t + 6;
      giveShield(me(), HP.mhp * 0.2, 6, '❄️ BARRIÈRE DE GIVRE');
    }
    if (type === 'lute' && i === 1 && on('barde', 'counter'))
      for (const h of group) giveShield(h, h.player.mhp * 0.15, 5, '🎵 CONTRE-CHANT');
    if (offensive) {
      if (id === 'paladin') giveShield(me(), HP.mhp * 0.05, 4, '☀️ Bouclier');
      return;
    }
    if (id === 'druide') {
      if (on('druide', 'bark') && t >= w.barkReady) {
        w.barkUntil = t + 6;
        w.barkReady = t + 20;
        giveShield(me(), HP.mhp * 0.2, 6, '🌳 ÉCORCE DE FER');
        fx('barkSkin', HP.x, HP.y, 40, '#8a6a3a', 6);
      }
      for (const h of group) {
        const n = applyHeal(h.player.mhp * 0.08, false, h, me(), true);
        if (n > 0) float(h.player.x, h.player.y - 40, '+' + Math.round(n) + ' PV', '#7ee36a');
      }
    }
    if (id === 'paladin') for (const h of group) giveShield(h, h.player.mhp * 0.1, 5, '☀️ Bouclier');
    // Écho mélodieux (Barde) : une compétence utilitaire soigne le groupe proche de 10 % des PV max.
    if (id === 'barde') for (const h of group) healFloat(h, h.player.mhp * 0.1);
    if (id === 'berserker') {
      w.thirst = true;
      float(HP.x, HP.y - 74, '🩸 Soif de sang prête', '#e0404f');
    }
    if (id === 'assassin') {
      w.umbra = true;
      float(HP.x, HP.y - 74, '🌑 Embuscade prête', '#c48cff');
    }
  }, 2);
  // Texte de l'empreinte de classe d'une compétence, pour l'info-bulle.
  function skillRider(type, i, hero = game.hero) {
    const id = classe(hero).id,
      offensive = isOffensiveSkill(type, i);
    if (!id) return 'Sans classe : choisis une classe au camp pour recevoir son arme et ses compétences.';
    if (id === 'druide') {
      if (type === 'feline')
        return offensive
          ? '🐆 Forme féline : tes coups critiques font saigner (25 % du coup sur 4 s).'
          : '🐆 Forme féline : tes soins sont réduits de 30 %.';
      return offensive
        ? '🌿 Druide : empoisonne les cibles (25 % des dégâts infligés, en plus, sur 4 s) et soigne ton groupe proche de 5 % des dégâts.'
        : '🌿 Druide : soigne aussi toi et tes alliés à 6 cases de 8 % de leurs PV max.';
    }
    if (id === 'paladin')
      return offensive
        ? '☀️ Paladin : te donne un bouclier de 5 % de tes PV max pendant 4 s.'
        : '☀️ Paladin : toi et tes alliés à 6 cases gagnez un bouclier de 10 % des PV max pendant 5 s.';
    if (id === 'assassin')
      return offensive
        ? '🌑 Assassin : +12 % de dégâts' +
            (i === 3 ? ', et encore +30 % contre une cible sous 50 % de ses PV.' : '.')
        : '🌑 Assassin : ta prochaine compétence offensive fait +25 % de dégâts (Embuscade).';
    if (id === 'barde')
      return offensive
        ? '🎵 Barde : soigne l’allié le plus blessé à 8 cases (toi compris) de 20 % des dégâts infligés.'
        : '🎵 Barde : soigne aussi toi et tes alliés à 6 cases de 10 % de leurs PV max.';
    if (id === 'berserker')
      return offensive
        ? '🩸 Berserker : se paie en PV au lieu du mana, et te rend 15 % des dégâts infligés.'
        : '🩸 Berserker : se paie en PV ; ta prochaine compétence offensive inflige 20 % de dégâts en plus et te rend 30 % des dégâts infligés.';
    if (id === 'invocateur')
      return '☠️ Invocateur : chaque coup pose une charge de Peste (8 au maximum, 8 % de ton Attaque par charge et par seconde).';
    if (id === 'chasseur')
      return offensive
        ? '🏹 Chasseur : +1 % de dégâts par case de distance (15 % au plus) ; chaque coup rend 5 de Concentration.'
        : '🏹 Chasseur : ta proie subit plus de dégâts de toi et de ton groupe.';
    if (id === 'guerrier')
      return '⚔️ Guerrier : chaque coup qui touche te donne un Élan (+3 % de dégâts et attaques de base 4 % plus rapides, 5 au maximum).';
    const el = ELEMENTS[skillElement(id, i)];
    if (el.name === 'Feu') return '🔥 Feu : brûle les cibles (30 % des dégâts infligés, en plus, sur 4 s).';
    if (el.name === 'Glace') return '❄️ Glace : ralentit les cibles de 30 % pendant 2,5 s.';
    return '⚡ Foudre : chaque coup rebondit sur 2 ennemis proches (35 % des dégâts).';
  }
  // Talents affichés dans l'info-bulle des compétences qu'ils modifient directement.
  const SPELL_TALENTS = {
    wildstaff: [['thornlash'], ['bloom', 'bark'], ['spores'], ['wrath']],
    feline: [['bleeds'], ['predator'], ['bark'], ['bleeds']],
    aegis: [['crusade'], ['radiantSeal'], ['bastion', 'orbit'], ['sentence', 'holyground']],
    dualdagger: [['crippling', 'phantom'], ['assassinate'], ['fan', 'crippling'], ['rending', 'phantom']],
    staff: [['combustion'], ['winter', 'frost'], ['conductor', 'static'], ['twin']],
    lute: [['piercing'], ['counter'], ['ballad'], ['finale']],
    bow: [['aimed', 'disengage'], ['prey'], ['torrent'], ['falconer']],
    dualsword: [['honed'], ['cyclone'], ['unstoppable'], ['coupdegrace']],
    greataxe: [[], ['butcher'], ['lastStand', 'bloodletting'], ['hunger']]
  };
  function skillTalents(type, i, hero = game.hero) {
    const c = def(hero);
    if (!c) return [];
    const keys = SPELL_TALENTS[type]?.[i] || [];
    return keys.filter(key => on(c.id, key, hero)).map(key => c.talents[T[c.id][key]]);
  }
  // Attaques de base plus rapides : forme féline, Rage écarlate, Frénésie, Œil du faucon, Élan.
  window.CANAAN_CLASS_BASIC_LOCK = forHero(() => {
    const t = now();
    return (
      (feral() ? 0.8 : 1) *
      (raging() ? 0.8 : 1) *
      (t < w.frenzyUntil ? 0.85 : 1) *
      (t < w.hawkUntil ? 0.7 : 1) *
      (1 - 0.04 * momentum())
    );
  }, 0);
  // Roulade : Repli tactique (Chasseur) la recharge 30 % plus vite.
  window.CANAAN_CLASS_DODGE_FACTOR = forHero(() => (on('chasseur', 'disengage') ? 0.7 : 1), 0);
  // Avant un coup d'un héros : multiplicateurs de dégâts.
  function before(m, damage, options = {}) {
    const t = now();
    let mult = options.multiplier ?? 1,
      forceCrit = false;
    const ratio = m.mhp ? m.hp / m.mhp : 1;
    if (feral()) mult *= 1.15;
    if (t < w.elemAvatarUntil) mult *= 1.2;
    if (t < w.balanceUntil) mult *= 1.25;
    if (t < w.symbiosisUntil) mult *= 1.1;
    if (t < w.exaltUntil) mult *= 1.15;
    if (options.skill && options.offensive && on('assassin', 'rending') && bleeding(m)) mult *= 1.25;
    if (on('assassin', 'crippling') && slowedBy(m)) mult *= 1.12;
    // Danse des ombres : le coup après une roulade est critique.
    if (w.danceCrit) {
      w.danceCrit = false;
      forceCrit = true;
    }
    // Éclats de glace (Élémentaliste) : une cible gelée par sa glace qui subit du feu ou de la foudre se brise.
    if (
      on('elementaliste', 'shatter') &&
      (options.element === 'fire' || options.element === 'lightning') &&
      m._chill?.by === me() &&
      m._chill.until > t &&
      !m._chill.shattered
    ) {
      m._chill.shattered = true;
      m._shatter = me();
      mult *= 1.5;
    }
    // Invocateur : Nécrose (+2 % par charge de Peste), Légion (+10 % pour les invocations).
    if (on('invocateur', 'necrosis')) mult *= 1 + 0.02 * plagueStacks(m);
    if (options.summon && on('invocateur', 'legion')) mult *= 1.1;
    // Barde : Hymne de l'Aurore et Mélodie vivifiante reçus, Crescendo, Dissonance (de n'importe quel Barde).
    if (t < w.hymnUntil) mult *= 1.1;
    if (t < w.vivifyUntil) mult *= 1.08;
    if (on('barde', 'crescendo') && t < w.crescendoUntil) mult *= 1 + 0.04 * w.crescendo;
    if (m._dissonant > t) mult *= 1.1;
    if (on('berserker', 'scars') && t < w.scarsUntil) mult *= 1 + 0.03 * w.scars;
    if (on('berserker', 'hunger') && bleeding(m)) mult *= 1.2;
    // Empreinte de l'Assassin : compétences offensives +12 %, finition (4) +30 % sur une cible sous 50 %.
    if (options.skill && options.offensive && isClass('assassin'))
      mult *= options.slot === 3 && ratio < 0.5 ? 1.12 * 1.3 : 1.12;
    // Chasseur : Instinct du traqueur (+1 % par case de distance, 15 % au plus), Œil du faucon.
    if (isClass('chasseur')) {
      const tiles = Math.hypot(m.x - HP.x, m.y - HP.y) / TS;
      mult *= 1 + Math.min(15, Math.floor(tiles)) / 100;
    }
    if (t < w.hawkUntil) mult *= 1.2;
    // Marque du chasseur : la proie subit plus de dégâts de tout le groupe ; les flèches du chasseur encore +20 %.
    const mark = m._huntMark;
    if (mark && mark.until > t) {
      mult *= 1 + mark.pct;
      if (mark.by === me() && weaponType() === 'bow') mult *= 1.2;
    }
    // Guerrier : Élan (+3 % par charge), Volonté de fer.
    mult *= 1 + 0.03 * momentum();
    if (t < w.ironUntil) mult *= 1.15;
    return { damage: damage * mult, base: damage, options, forceCrit };
  }
  // Après un coup : déclencheurs (effets sur la durée, éclairs, ralentissements, soins), d'après les dégâts réels.
  function after(m, info) {
    const options = info.options || {},
      dealt = Math.max(0, info.dealt || 0),
      crit = !!m._lastCrit,
      skill = !!options.skill && !!options.offensive,
      basic = !!options.basic,
      t = now(),
      id = classe().id;
    // Ferveur, Rythme, Concentration et Rage : une attaque de base qui touche les fait monter.
    if (basic && dealt > 0) gainResource('basic');
    if (id === 'paladin' && dealt > 0 && (basic || skill) && !options.periodic) healFromSeal(m, t);
    // Instinct du traqueur : chaque compétence offensive qui touche rend 5 de Concentration.
    if (skill && dealt > 0 && id === 'chasseur' && t - w.focusGainAt >= RESOURCE_BASIC_GAP) {
      w.focusGainAt = t;
      HP.mp = Math.min(HP.mmp, HP.mp + 5);
    }
    // Maître d'armes (Guerrier) : chaque coup de lame qui touche donne un Élan (une fois toutes les 0,15 s).
    if (id === 'guerrier' && dealt > 0 && (basic || skill) && t - w.momentumAt >= 0.15) {
      w.momentumAt = t;
      addMomentum(1);
    }
    // Seigneur de guerre : à 5 Élans, une attaque de base libère une onde d'acier autour de la cible.
    if (basic && dealt > 0 && on('guerrier', 'warlord') && momentum() >= 5 && t - w.warlordAt >= 0.5) {
      w.warlordAt = t;
      blast(m.x, m.y, 2, characterStats(me()).attack * 0.6, 'steel', m);
    }
    if (dealt > 0 && (basic || skill) && on('berserker', 'scars') && t - w.scarsAt >= 0.25) {
      w.scarsAt = t;
      addScars(crit ? 3 : 1);
    }
    if (crit && on('assassin', 'shadow') && t >= w.shadowReady && !w.shadowPending && ++w.crits >= 3) {
      w.crits = 0;
      w.shadowPending = true;
      w.shadowReady = t + 12;
      float(HP.x, HP.y - 74, '🗡️ OMBRE MEURTRIÈRE PRÊTE', '#c48cff');
    }
    if (skill && options.element) burst(m.x, m.y, elementColor(options.element), 5);
    // Sève vitale (Druide, hors forme féline) : 5 % des dégâts rendus à lui et aux alliés proches.
    if (skill && dealt > 0 && id === 'druide' && !feral())
      for (const hero of groupAround(6)) applyHeal(dealt * 0.05, false, hero, me(), true);
    // Écho mélodieux (Barde) : 20 % des dégâts rendus à l'allié le plus blessé à 8 cases (Chœur : deux, 25 %).
    if (skill && dealt > 0 && id === 'barde') {
      const choir = on('barde', 'choir');
      for (const hero of groupAround(8)
        .sort((a, b) => a.player.hp / a.player.mhp - b.player.hp / b.player.mhp)
        .slice(0, choir ? 2 : 1))
        healFloat(hero, dealt * (choir ? 0.25 : 0.2));
    }
    // Soif de sang (Berserker) : 15 % des dégâts rendus, doublés après une compétence utilitaire (50 % avec Dernier carré).
    if (skill && dealt > 0 && id === 'berserker') {
      const rate = options.bloodFury ? 0.5 : options.thirst ? 0.3 : 0.15,
        h = applyHeal(dealt * rate, false, me(), me(), true);
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#ff8a96');
    }
    if (dealt > 0 && alive(m)) {
      // Saignée (Berserker) : 40 % des dégâts en saignement sur 4 s.
      if (skill && on('berserker', 'bloodletting')) dot(m, 'bleed', 4, dealt * 0.4, 'blood');
      // Barde : Dissonance (la cible subit +10 % de dégâts pendant 6 s).
      if (skill && on('barde', 'dissonance')) {
        if (!(m._dissonant > t)) float(m.x, m.y - 50, '🎵', '#ff9ad5');
        m._dissonant = t + 6;
      }
      // Druide : sève (hors forme) ; en forme féline, les critiques font saigner ; Cœur du prédateur.
      if (skill && id === 'druide' && !feral()) dot(m, 'sap', 4, dealt * 0.25, 'nature');
      if (crit && feral()) {
        dot(m, 'bleed', 4, dealt * 0.25 * (on('druide', 'bleeds') ? 1.4 : 1), 'nature');
        if (on('druide', 'predator')) {
          const h = applyHeal(HP.mhp * 0.02, false, me(), me(), true);
          if (h > 0) float(HP.x, HP.y - 40, '🐆 +' + Math.round(h) + ' PV', '#c8f59a');
          const cds = me() === game.hero ? weaponCooldowns : CANAAN_SKILLS.state(me()).cooldowns;
          if (cds['feline:1'] > 0) cds['feline:1'] = Math.max(0, cds['feline:1'] - 1);
        }
      }
      // Assassin : Hémorragie.
      if (crit && on('assassin', 'hemorrhage')) dot(m, 'bleed', 4, dealt * 0.35, 'shadow');
      // Élémentaliste : feu, glace (et givre pour Éclats de glace).
      if (skill && options.element === 'fire' && id === 'elementaliste')
        dot(m, 'burn', 4, dealt * 0.3, 'fire');
      if (skill && options.element === 'ice' && id === 'elementaliste') {
        slow(m, 0.3, 2.5, 'ice');
        if (!m._chill || m._chill.until < t + 2.5) chill(m, 2.5);
      }
      // Peste noire (Invocateur) : chaque attaque et chaque coup d'invocation pose une charge.
      if ((skill || basic) && id === 'invocateur') addPlague(m, 1);
    }
    if (dealt > 0) {
      // Éclats de glace : la cible brisée projette des éclats autour d'elle.
      if (m._shatter === me()) {
        m._shatter = null;
        float(m.x, m.y - 60, '❄️ BRISÉ', '#bfeaff');
        fx('shatter', m.x, m.y - 10, TILES(2), '#bfeaff', 0.6);
        for (const o of game.world.monsters.slice())
          if (o !== m && alive(o) && near(o, m, 2)) effectHit(o, characterStats(me()).attack * 0.6, 'ice');
      }
      // Avatar primordial : décharge des deux autres éléments autour de la première cible de la compétence.
      if (skill && w.primordial) {
        const own = w.primordial;
        w.primordial = false;
        for (const el of ELEMENTAL.filter(e => e !== own))
          blast(m.x, m.y, 2, characterStats(me()).attack * 0.6, el);
      }
      // Électricité statique : charges de foudre ; à 5, la foudre céleste.
      if (skill && options.element === 'lightning' && on('elementaliste', 'static')) {
        const s = (m._static ??= new Map()),
          n = (s.get(me()) || 0) + 1;
        if (n >= 5) {
          s.set(me(), 0);
          fx('skybolt', m.x, m.y, 40, '#f4f07a', 0.5);
          float(m.x, m.y - 64, '⚡ FOUDRE CÉLESTE', '#f4f07a');
          effectHit(m, characterStats(me()).attack * 3, 'lightning');
        } else s.set(me(), n);
      }
      // Empreinte de foudre : chaque coup rebondit sur 2 ennemis proches.
      if (skill && options.element === 'lightning' && id === 'elementaliste') {
        const others = game.world.monsters
          .filter(o => o !== m && alive(o) && near(o, m, 4))
          .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
          .slice(0, 2);
        for (const o of others) {
          CANAAN_SKILLS.fx(
            'lightning',
            m.x,
            m.y - 16,
            Math.atan2(o.y - m.y, o.x - m.x),
            Math.hypot(o.x - m.x, o.y - m.y),
            0,
            '#f4f07a',
            0.25
          );
          effectHit(o, dealt * 0.35, 'lightning');
        }
      }
    }
    if (m.hp <= 0) onKill(m, info.burned);
  }
  window.CANAAN_CLASS_ATTACK = {
    before: forHero(
      (m, damage, options) => ({ ...before(m, damage, options), burned: hasDot(m, ['burn']) }),
      3
    ),
    after: forHero(after, 2)
  };
  // Coup reçu : invulnérabilité, parade, renvois, bouclier, puis le combat continue. Le reste des réductions est
  // dans la Garde (statistiques).
  window.CANAAN_CLASS_DEFENSE = forHero(function (source, damage) {
    const t = now();
    if (t < w.invulnUntil) return 0;
    let d = damage;
    // Riposte (Guerrier) : 15 % de chance de parer et de contre-attaquer.
    if (on('guerrier', 'riposte') && d > 0 && Math.random() < 0.15) {
      float(HP.x, HP.y - 46, '⚔️ PARADE', '#e8f0ff');
      if (source && alive(source)) reflect(source, characterStats(me()).attack * 1.5, 'steel');
      return 0;
    }
    // Ferveur (Paladin) et Rage (Guerrier) : chaque coup reçu les fait monter, d'autant plus qu'il fait mal.
    if (damage > 0) gainResource('hurt', { damage, maxHp: HP.mhp });
    // Écorce de fer (Druide) : les ennemis qui frappent le Druide subissent 30 % de leurs dégâts.
    if (t < w.barkUntil && source && alive(source) && damage > 0) reflect(source, damage * 0.3, 'nature');
    // Martyr : un Paladin proche encaisse la moitié des 20 % qu'il épargne à son allié.
    if (damage > 0) {
      const guard = game.heroes.find(
        h => h !== me() && !h.player.dead && !h.away && on('paladin', 'martyr', h) && near(h.player, HP, 6)
      );
      if (guard) {
        const spared = d * 0.2,
          taken = Math.min(Math.floor(spared * 0.5), Math.max(0, Math.ceil(guard.player.hp) - 1));
        d -= spared;
        if (taken > 0) {
          guard.player.hp -= taken;
          float(guard.player.x, guard.player.y - 30, '🛡 −' + taken, '#ffd76a');
        }
      }
    }
    if (w.shield > 0 && t < w.shieldUntil && d > 0) {
      const absorb = Math.min(w.shield, d);
      w.shield -= absorb;
      d -= absorb;
      if (absorb > 0) float(HP.x, HP.y - 46, '🛡 −' + Math.round(absorb), '#bfe4ff');
      // Lumière vengeresse (Paladin) : le bouclier brisé explose.
      if (w.shield <= 0 && on('paladin', 'radiant') && t >= w.radiantReady) {
        w.radiantReady = t + 6;
        float(HP.x, HP.y - 64, '☀️ LUMIÈRE VENGERESSE', '#ffd76a');
        blast(HP.x, HP.y, 3, characterStats(me()).attack * 1.2, 'holy');
      }
    }
    return Math.max(0, Math.round(d));
  }, 2);
  // Esquive (roulade, esquive ou déviation) : Danse des ombres (Assassin), Repli tactique (Chasseur).
  window.CANAAN_CLASS_ON_DODGE = forHero(function (_hero, rolled) {
    const t = now();
    if (rolled && on('chasseur', 'survival') && t >= w.survivalReady) {
      w.survivalUntil = t + 5;
      w.survivalReady = t + 15;
      notice('🐾 Instinct de survie !');
    }
    if (on('assassin', 'dance')) {
      w.veilUntil = Math.max(w.veilUntil, t + 1.5);
      HP.veiled = true;
      w.danceCrit = true;
    }
    CANAAN_SKILLS.onDodge(me());
  }, 0);
  // Coup fatal : la Rage écarlate et Immortel (Berserker) gardent 1 PV ; Intervention divine (une fois par combat)
  // laisse le Paladin à 1 PV, invulnérable 3 s, avec un bouclier, et soigne son groupe proche.
  window.CANAAN_CLASS_FATAL = forHero(function (n) {
    if (HP.hp - n > 0) return n;
    const t = now();
    if (t < w.invulnUntil) return 0;
    if (raging()) return Math.max(0, Math.ceil(HP.hp) - 1);
    if (on('berserker', 'undying') && t >= w.undyingReady) {
      w.undyingReady = t + 90;
      startRage(4, false);
      notice('🩸 Immortel !');
      return Math.max(0, Math.ceil(HP.hp) - 1);
    }
    if (!on('paladin', 'intervention') || w.interventionUsed) return n;
    w.interventionUsed = true;
    w.invulnUntil = t + 3;
    giveShield(me(), HP.mhp * 0.25, 5, '✨ INTERVENTION DIVINE');
    fx('holyPillar', HP.x, HP.y, 60, '#ffd76a', 1);
    for (const h of groupAround(6)) if (h !== me()) healFloat(h, h.player.mhp * 0.15);
    notice('✨ Intervention divine !');
    return Math.max(0, Math.ceil(HP.hp) - 1);
  }, 1);

  // ---------------------------------------------------------------- Sort spécial (touche F)
  function endVeil() {
    w.veilUntil = 0;
    HP.veiled = false;
  }
  // Sort spécial lancé (compté pour les succès).
  const castTracked = hero => {
    const done = castSpecial(hero);
    if (done) canaanAchieve(hero, 'special');
    return done;
  };
  // Changement de forme du Druide : la barre de compétences passe du bâton aux griffes (et inversement).
  function shapeShifted() {
    if (me() === game.hero && typeof refreshWeaponBar === 'function') refreshWeaponBar();
  }
  // Lance le sort spécial de la classe d'un héros (l'hôte par défaut). Renvoie true s'il a eu lieu.
  const castSpecial = forHero(function () {
    const c = def(),
      t = now();
    if (!c || HP.dead || (me() === game.hero && playerStun > 0)) return false;
    const s = c.special,
      instinct = on('druide', 'instinct'),
      cooldown = s.id === 'feral' && instinct ? 0.5 : s.cooldown;
    if (t < w.specialReady) {
      if (me() === game.hero) toast(s.name + ' : encore ' + Math.ceil(w.specialReady - t) + ' s');
      return false;
    }
    // Quitter la forme féline est gratuit (Équilibre sauvage : soin de groupe après 3 compétences félines).
    if (s.id === 'feral' && HP.form === 'feral') {
      HP.form = null;
      w.specialReady = t + cooldown;
      fx('shapeshift', HP.x, HP.y, 50, '#7ee36a', 0.6);
      float(HP.x, HP.y - 58, 'FORME NORMALE', '#c8f5b8');
      if (on('druide', 'balance') && w.balanceFeline >= 3) {
        float(HP.x, HP.y - 72, '🌿 ÉQUILIBRE SAUVAGE', '#7ee36a');
        for (const h of groupAround(6)) healFloat(h, h.player.mhp * 0.15);
      }
      w.balanceFeline = 0;
      recompute();
      shapeShifted();
      return true;
    }
    const price = s.id === 'feral' && instinct ? 0 : specialPrice(c, me());
    if (HP.mp < price) {
      if (me() === game.hero) toast(RESOURCES[resource()].lack);
      return false;
    }
    HP.mp -= price;
    w.specialReady = t + cooldown;
    CANAAN_SOUND.cue('levelup');
    if (s.id === 'feral') {
      HP.form = 'feral';
      fx('shapeshift', HP.x, HP.y, 70, '#7ee36a', 0.7);
      float(HP.x, HP.y - 62, '🐆 FORME FÉLINE', '#7ee36a');
      if (instinct) w.instinctCrit = true;
      // Équilibre sauvage : après 3 compétences de nature, +25 % de dégâts pendant 8 s.
      if (on('druide', 'balance') && w.balanceNature >= 3) {
        w.balanceUntil = t + 8;
        float(HP.x, HP.y - 74, '🌿 ÉQUILIBRE SAUVAGE +25 %', '#7ee36a');
      }
      w.balanceNature = 0;
      shapeShifted();
    } else if (s.id === 'divine') {
      fx('holyPillar', HP.x, HP.y, TILES(6), '#ffd76a', 1);
      float(HP.x, HP.y - 62, '✨ LUMIÈRE DIVINE', '#ffd76a');
      for (const hero of groupAround(6)) {
        runtime(hero).divineUntil = t + 6;
        const h = applyHeal(hero.player.mhp * 0.2, false, hero, me(), true);
        if (h > 0) float(hero.player.x, hero.player.y - 42, '+' + Math.round(h) + ' PV', '#ffe9a0');
      }
    } else if (s.id === 'veil') {
      w.veilUntil = t + 4;
      HP.veiled = true;
      fx('shadowStep', HP.x, HP.y, 40, '#c48cff', 0.7);
      float(HP.x, HP.y - 62, '🌑 VOILE D’OMBRE', '#c48cff');
    } else if (s.id === 'avatar') {
      w.elemAvatarUntil = t + (on('elementaliste', 'primordial') ? 14 : 10);
      fx('elemAvatar', HP.x, HP.y, 90, '#ff8a3d', 0.9);
      float(HP.x, HP.y - 62, '🌋 AVATAR ÉLÉMENTAIRE', '#ff8a3d');
    } else if (s.id === 'contagion') {
      w.contagionUntil = t + 8;
      fx('poisonBurst', HP.x, HP.y, TILES(7), '#a4e83c', 0.8);
      float(HP.x, HP.y - 62, '☣️ CONTAGION', '#a4e83c');
      for (const m of game.world.monsters.slice()) if (alive(m) && near(m, HP, 7)) addPlague(m, 4);
    } else if (s.id === 'rage') {
      startRage(8, true);
    } else if (s.id === 'hymn') {
      // Hymne de l'Aurore : 15 % des PV max tout de suite, puis 3 % par seconde pendant 6 s, et +10 % de dégâts.
      fx('healSong', HP.x, HP.y, TILES(8), '#ff9ad5', 1);
      float(HP.x, HP.y - 62, '🎶 HYMNE DE L’AURORE', '#ff9ad5');
      for (const hero of groupAround(8)) {
        const r = runtime(hero);
        r.hymnUntil = t + 6;
        r.hymnTick = t + 1;
        r.hymnBy = me();
        healFloat(hero, hero.player.mhp * 0.15);
      }
    } else if (s.id === 'hawkeye') {
      // Œil du faucon : 10 s (Maître de la traque : 15 s) de dégâts, critiques et tirs plus rapides.
      w.hawkUntil = t + (on('chasseur', 'apex') ? 15 : 10);
      fx('hawkEye', HP.x, HP.y, 70, '#e8b65a', 0.9);
      float(HP.x, HP.y - 62, '🦅 ŒIL DU FAUCON', '#e8b65a');
    } else if (s.id === 'ironwill') {
      // Volonté de fer : 8 s de résistance et de dégâts, 30 de Rage (Cri de ralliement : le groupe protégé, +30).
      const rally = on('guerrier', 'rally');
      w.ironUntil = t + 8;
      HP.mp = Math.min(HP.mmp, HP.mp + (rally ? 60 : 30));
      fx('ironWill', HP.x, HP.y, rally ? TILES(6) : 70, '#cfdcea', 0.9);
      float(HP.x, HP.y - 62, '🛡️ VOLONTÉ DE FER', '#cfdcea');
      if (rally) for (const h of groupAround(6)) if (h !== me()) runtime(h).rallyUntil = t + 8;
      if (on('guerrier', 'secondwind')) {
        w.windUntil = t + 5;
        w.windTick = t + 1;
        giveShield(me(), HP.mhp * 0.15, 5, '');
        notice('💨 Second souffle !');
      }
    }
    recompute();
    return true;
  }, 0);
  // Héros du groupe à moins de tiles cases du héros courant (lui compris), vivants et présents.
  const groupAround = tiles =>
    game.heroes.filter(h => !h.player.dead && !h.away && (h === me() || near(h.player, HP, tiles)));
  // Soin d'un allié par le héros courant (sans propagation de la Lumière sacrée), avec son chiffre flottant.
  function healFloat(hero, amount) {
    const h = applyHeal(amount, false, hero, me(), true);
    if (h > 0) float(hero.player.x, hero.player.y - 40, '+' + Math.round(h) + ' PV', '#ffc2e4');
    return h;
  }
  // Vitesse d'attaque des invocations d'un héros : Contagion (+30 %).
  const summonHaste = hero => (now() < runtime(hero).contagionUntil ? 1.3 : 1);
  function recompute() {
    if (me() === game.hero) recomputeStats();
    else recomputeHeroStats(me());
  }
  // Touche F : un invité demande le sort à l'hôte.
  function useSpecial() {
    if (!started || paused) return false;
    if (!def(game.hero)) {
      toast('Choisis d’abord ta classe (T).');
      return false;
    }
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'class-special' });
    return castTracked(game.hero);
  }
  // Temps de recharge restant du sort spécial (affichage ; l'invité le reçoit de l'hôte).
  let guestSpecial = 0;
  const specialLeft = (hero = game.hero) =>
    game.mode === 'guest' && hero === game.hero
      ? guestSpecial
      : Math.max(0, runtime(hero).specialReady - now());

  // ---------------------------------------------------------------- Étape de simulation
  function stepHero(t) {
    const seal = w.holySeal;
    if (
      seal &&
      (t >= seal.until || HP.dead || !alive(seal.target) || !game.world.monsters.includes(seal.target))
    )
      w.holySeal = null;
    if (HP.dead || me().away) return;
    const ratio = HP.mhp ? HP.hp / HP.mhp : 1,
      fighting = inCombat();
    if (!fighting) w.interventionUsed = false;
    if (HP.veiled && t >= w.veilUntil) endVeil();
    if (w.shield > 0 && t >= w.shieldUntil) w.shield = 0;
    HP.shielded = w.shield > 0 ? 1 : 0;
    // Fin de la Rage écarlate : 20 % des PV max perdus, sans jamais tomber sous 1 PV.
    if (w.rageUntil > 0 && t >= w.rageUntil) {
      w.rageUntil = 0;
      const loss = w.ragePenalty ? Math.floor(Math.min(HP.mhp * 0.2, HP.hp - 1)) : 0;
      w.ragePenalty = false;
      if (loss > 0) {
        HP.hp -= loss;
        float(HP.x, HP.y - 30, '🩸 −' + loss, '#e0404f');
      }
    }
    if (w.scars > 0 && t >= w.scarsUntil) w.scars = 0;
    if (w.momentum > 0 && t >= w.momentumUntil) w.momentum = 0;
    // Paladin : Ferveur ardente (Exaltation à 100 de Ferveur).
    if (on('paladin', 'zeal') && HP.mp >= HP.mmp && HP.mmp > 0 && t >= w.exaltReady) {
      w.exaltUntil = t + 6;
      w.exaltReady = t + 20;
      fx('holyPillar', HP.x, HP.y, 50, '#ffd76a', 0.8);
      float(HP.x, HP.y - 70, '☀️ EXALTATION', '#ffd76a');
    }
    // Pacte de sang : sous 35 % de PV, la plus ancienne invocation est sacrifiée pour 15 % des PV max.
    if (
      on('invocateur', 'bloodPact') &&
      ratio < 0.35 &&
      t >= w.bloodReady &&
      CANAAN_SUMMONS.sacrifice(me())
    ) {
      w.bloodReady = t + 40;
      const h = applyHeal(HP.mhp * 0.15, false, me(), me(), true);
      notice('🩸 Pacte de sang !' + (h > 0 ? ' +' + Math.round(h) + ' PV' : ''));
    }
    // Hymne de l'Aurore reçu : 3 % des PV max par seconde, par le Barde qui l'a chanté.
    if (w.hymnUntil > 0 && t + 1e-9 >= w.hymnTick && w.hymnTick <= w.hymnUntil + 1e-9) {
      w.hymnTick += 1;
      const by = game.heroes.includes(w.hymnBy) ? w.hymnBy : me(),
        h = applyHeal(HP.mhp * 0.03, false, me(), by, true);
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#ffc2e4');
    }
    if (on('chasseur', 'frosttrap') && fighting && t >= w.trapReady) {
      const prey = game.world.monsters.find(m => alive(m) && near(m, HP, 2));
      if (prey) {
        w.trapReady = t + 15;
        fx('frostTrap', prey.x, prey.y, 40, '#bfeaff', 0.8);
        if (isBoss(prey)) slow(prey, 0.4, 2, 'ice');
        else {
          prey.cd = Math.max(prey.cd, 2);
          applyEffect(prey, 'stun', 2);
          fx('frozen', prey.x, prey.y, 30, '#bfeaff', 2);
        }
      }
    }
    if (w.windUntil > 0 && t + 1e-9 >= w.windTick && w.windTick <= w.windUntil + 1e-9) {
      w.windTick += 1;
      const h = applyHeal(HP.mhp * 0.05, false, me(), me(), true);
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#e8f0ff');
    }
    // Effets sur la durée posés par ce héros : lui seul les fait progresser.
    for (const m of game.world.monsters.slice()) {
      if (!m._clsDots) continue;
      for (const d of m._clsDots.slice()) {
        if (d.by !== me()) continue;
        if (t + 1e-9 >= d.tick && d.tick <= d.until + 1e-9 && alive(m)) {
          d.tick += 1;
          effectHit(m, d.dps, d.element);
        }
        if (t >= d.until && m._clsDots.includes(d)) m._clsDots.splice(m._clsDots.indexOf(d), 1);
      }
    }
    // Peste de ce héros : une fois par seconde, 8 % de son Attaque par charge (Siphon pestilentiel : 10 % rendus).
    for (const m of game.world.monsters.slice()) {
      const p = m._plague?.find(x => x.by === me());
      if (!p) continue;
      if (t + 1e-9 >= p.tick && p.tick <= p.until + 1e-9 && alive(m)) {
        p.tick += 1;
        const done = effectHit(m, characterStats(me()).attack * PLAGUE.perStack * p.stacks, 'poison');
        if (done > 0 && on('invocateur', 'siphon')) applyHeal(done * 0.1, true, me(), me());
      }
      if (t >= p.until && m._plague.includes(p)) m._plague.splice(m._plague.indexOf(p), 1);
    }
  }
  window.CanaanStages.classes = {
    before() {
      const t = now(),
        positions = new Map();
      for (const m of game.world.monsters)
        if (m._clsSlow && m._clsSlow.until > t) positions.set(m, { x: m.x, y: m.y, pct: m._clsSlow.pct });
      return { t, positions };
    },
    after({ t, positions }) {
      for (const [m, p] of positions) {
        m.x = p.x + (m.x - p.x) * (1 - p.pct);
        m.y = p.y + (m.y - p.y) * (1 - p.pct);
      }
      // Les héros retirés du groupe gardent un monstre à moitié dans un effet orphelin : il se termine seul.
      for (const m of game.world.monsters) {
        if (m._clsDots) m._clsDots = m._clsDots.filter(d => game.heroes.includes(d.by) && d.until > t - 1);
        if (m._plague) m._plague = m._plague.filter(p => game.heroes.includes(p.by) && p.until > t - 1);
      }
      for (const hero of game.heroes) within(hero, () => stepHero(t));
    }
  };
  // Étape de rendu : boucliers et auras des sorts spéciaux ; recharge de la touche F.
  window.CanaanStages.drawClassEffects = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    for (const hero of game.heroes) {
      const p = hero.player;
      if (p.dead) continue;
      const r = runtime(hero),
        t = now();
      if (p.shielded) CANAAN_VFX.drawShield(ctx, p, time);
      const orbit = game.mode === 'guest' ? p.shieldOrbit : r.shieldOrbitUntil - t;
      if (orbit > 0) CANAAN_VFX.drawShieldOrbit(ctx, p, time, orbit);
      // Auras : notes de l'Hymne, sang de la Rage, sève du félin, œil du faucon, acier de la Volonté de fer.
      if (t < r.hymnUntil) CANAAN_VFX.aura(p, 'notes', time);
      if (raging(hero)) CANAAN_VFX.aura(p, 'blood', time);
      if (p.form === 'feral') CANAAN_VFX.aura(p, 'leaves', time);
      if (t < r.hawkUntil) CANAAN_VFX.aura(p, 'feathers', time);
      if (t < r.ironUntil || t < r.rallyUntil) CANAAN_VFX.aura(p, 'steel', time);
      if (t < r.elemAvatarUntil) CANAAN_VFX.aura(p, 'elements', time);
      if (t < r.exaltUntil || t < r.divineUntil) CANAAN_VFX.aura(p, 'holy', time);
    }
    ctx.restore();
    const el = document.getElementById('specialSkill');
    if (el) {
      const left = specialLeft(),
        cd = el.querySelector('.cd'),
        text = left > 0 ? String(Math.ceil(left)) : '';
      if (cd.textContent !== text) cd.textContent = text;
      cd.style.display = left > 0 ? 'flex' : 'none';
      const r = runtime(game.hero),
        t = now();
      el.classList.toggle(
        'active',
        game.hero.player.form === 'feral' ||
          !!game.hero.player.veiled ||
          t < r.contagionUntil ||
          t < r.hymnUntil ||
          t < r.rageUntil ||
          t < r.hawkUntil ||
          t < r.ironUntil ||
          t < r.elemAvatarUntil
      );
    }
  };
  // ---------------------------------------------------------------- Choix de classe et talents
  // Changer de classe : gratuit, au Camp de l'Aurore (hors instance) ; la première classe se choisit partout.
  function atCamp(hero = me()) {
    return !game.world.instance && isSafe(hero.player.x / TS, hero.player.y / TS);
  }
  const chooseClass = forHero(function (id) {
    const c = classById(id);
    if (!c || classe().id === id) return false;
    if (classe().id && !atCamp()) return false;
    me().classe = { id, talents: [] };
    HP.form = null;
    endVeil();
    runtimes.set(me(), fresh());
    pact(me());
    // Un compagnon choisit lui-même ses talents.
    if (me().local) autoTalents(me());
    recompute();
    return true;
  }, 1);
  const equipTalent = forHero(function (i) {
    const k = classe();
    if (
      !k.id ||
      !Number.isInteger(i) ||
      i < 0 ||
      i >= TALENTS_PER_CLASS ||
      k.talents.includes(i) ||
      k.talents.length >= slots() ||
      inCombat()
    )
      return false;
    k.talents.push(i);
    recompute();
    return true;
  }, 1);
  const unequipTalent = forHero(function (i) {
    const k = classe(),
      at = k.talents.indexOf(i);
    if (at < 0 || inCombat()) return false;
    k.talents.splice(at, 1);
    recompute();
    return true;
  }, 1);
  // Talents d'un compagnon local : un ensemble conseillé pour sa classe, selon ses emplacements.
  const BUILDS = Object.freeze({
    druide: [0, 3, 2, 7, 8, 1, 9, 4, 5, 6],
    paladin: [6, 0, 3, 9, 4, 1, 7, 8, 2, 5],
    assassin: [5, 3, 0, 4, 9, 7, 2, 8, 1, 6],
    elementaliste: [0, 1, 3, 4, 8, 2, 5, 6, 7, 9],
    invocateur: [1, 3, 0, 5, 9, 2, 4, 7, 6, 8],
    barde: [5, 1, 8, 0, 9, 3, 4, 6, 2, 7],
    berserker: [4, 5, 0, 9, 3, 7, 1, 8, 2, 6],
    chasseur: [0, 3, 5, 1, 2, 6, 8, 4, 7, 9],
    guerrier: [0, 4, 9, 6, 3, 1, 2, 5, 7, 8]
  });
  function autoTalents(hero) {
    const k = classe(hero);
    if (!k.id) return;
    for (const i of BUILDS[k.id])
      if (k.talents.length < talentSlotsAt(clampLevel(hero.level)) && !k.talents.includes(i))
        k.talents.push(i);
  }
  // Montée de niveau : un nouvel emplacement s'ouvre peut-être.
  const onLevel = forHero(function () {
    if (!TALENT_SLOT_LEVELS.includes(clampLevel(me().level))) return;
    if (me().local) autoTalents(me());
    else notice('🌟 Nouvel emplacement de talent ! (T)');
  }, 0);

  // ---------------------------------------------------------------- Interface
  const ui = { picking: false, page: 0 };
  window.chooseClass = function (id) {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'class-choose', cls: id });
    if (classe(game.hero).id && !atCamp(game.hero)) return toast('Change de classe au Camp de l’Aurore.');
    if (!chooseClass(id, game.hero)) return;
    ui.picking = false;
    refreshWeaponBar();
    promptClass();
    saveGame();
    renderTalents();
  };
  window.equipTalent = function (i) {
    if (inCombat(game.hero)) return toast('Impossible de changer de talent en combat.');
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'talent-equip', talent: i });
    if (!equipTalent(i, game.hero)) return;
    saveGame();
    renderTalents();
  };
  window.unequipTalent = function (i) {
    if (inCombat(game.hero)) return toast('Impossible de changer de talent en combat.');
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'talent-unequip', talent: i });
    if (!unequipTalent(i, game.hero)) return;
    saveGame();
    renderTalents();
  };
  // Ouvre le choix des classes sur la page de la classe actuelle.
  function startPage() {
    const at = CLASSES.findIndex(c => c.id === classe(game.hero).id);
    ui.page = at < 0 ? 0 : at;
  }
  window.pickClass = function (open) {
    ui.picking = !!open;
    if (ui.picking) startPage();
    renderTalents();
  };
  window.classPage = function (step) {
    ui.page = (((ui.page + Math.sign(step)) % CLASSES.length) + CLASSES.length) % CLASSES.length;
    renderTalents();
  };
  window.classPageTo = function (page) {
    if (!Number.isInteger(page) || page < 0 || page >= CLASSES.length) return;
    ui.page = page;
    renderTalents();
  };
  // Coût et recharge du sort spécial, dans la ressource de la classe (le Berserker n'y met rien).
  const specialCost = (c, hero = game.hero) =>
    (c.special.mana > 0 ? RESOURCES[classResource(c.id)].name + ' ' + specialPrice(c, hero) : 'Sans coût') +
    (c.special.cooldown >= 5 ? ' · recharge ' + c.special.cooldown + ' s' : '');
  const escape = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  // Choix de la classe : une page par classe, flèches gauche et droite (et touches ← →), points en dessous.
  // La page s'ouvre sur la classe actuelle du héros.
  // Compétences d'une arme (ou d'une forme) : icônes et noms, leur explication au survol.
  function spellList(type) {
    const d = WEAPON_DEFINITIONS[type];
    return (
      '<ul class="class-pact-spells">' +
      d.sp
        .map(
          (spec, i) =>
            '<li title="' +
            escape(spec[6]) +
            '">' +
            (CANAAN_SKILL_ICONS.weapon(type, i) || spec[0]) +
            '<span>' +
            escape(spec[1]) +
            '</span></li>'
        )
        .join('') +
      '</ul>'
    );
  }
  function classPageHtml(c, current) {
    const weapon = boundWeaponOf(c.id),
      wdef = weapon ? WEAPON_DEFINITIONS[weapon] : null;
    return (
      '<div class="class-page" style="--class-color:' +
      c.color +
      '"><div class="class-page-hero"><div class="class-icon">' +
      c.icon +
      '</div><h3>' +
      escape(c.name) +
      '</h3><p class="class-style">' +
      escape(c.style) +
      '</p><p class="class-spec">' +
      escape(c.spec) +
      '</p><button ' +
      (current ? 'disabled' : 'data-action="chooseClass" data-class="' + c.id + '"') +
      '>' +
      (current ? '✓ Ta classe' : 'Choisir ' + escape(c.name)) +
      '</button></div><div class="class-page-body"><p class="class-line"><b>Passif · ' +
      escape(c.passive.name) +
      '</b>' +
      escape(c.passive.desc) +
      '</p><p class="class-line"><b>' +
      RESOURCES[classResource(c.id)].icon +
      ' Ressource · ' +
      escape(RESOURCES[classResource(c.id)].name) +
      '</b>' +
      escape(RESOURCES[classResource(c.id)].desc) +
      '</p><p class="class-line"><b>' +
      c.special.icon +
      ' Sort de classe (F) · ' +
      escape(c.special.name) +
      '</b>' +
      escape(c.special.desc) +
      ' <small>' +
      specialCost(c) +
      '</small></p>' +
      (wdef
        ? '<div class="class-line class-pact"><b>' +
          wdef.icon +
          ' Arme de classe · ' +
          escape(wdef.name) +
          (c.relic ? ' <span class="relic-tag">' + escape(BOUND_RARITY.name) + '</span>' : '') +
          '</b>' +
          escape(wdef.role) +
          ' ' +
          escape(
            c.relic
              ? 'Elle prend ton niveau et grandit avec toi ; aucune autre arme ne peut s’équiper.'
              : 'Elle prend ton niveau et monte de qualité avec les essences des boss de donjon et de raid.'
          ) +
          spellList(weapon) +
          (c.id === 'druide'
            ? '<b class="class-form-title">🐆 ' +
              escape(WEAPON_DEFINITIONS.feline.name) +
              '</b>' +
              spellList('feline')
            : '') +
          '</div>'
        : '') +
      '<div class="class-line"><b>Talents</b><ul class="class-talent-names">' +
      c.talents.map(([name, desc]) => '<li title="' + escape(desc) + '">' + escape(name) + '</li>').join('') +
      '</ul></div></div></div>'
    );
  }
  function renderPicker(current) {
    const n = CLASSES.length,
      page = ((ui.page % n) + n) % n,
      c = CLASSES[page];
    return (
      '<div class="classes class-picker panel-scroll" data-panel-size="lg"><h2>⚔️ Choisis ta classe <small>· ' +
      (page + 1) +
      ' / ' +
      n +
      '</small></h2><div class="class-pager"><button class="class-arrow" data-action="classPage" data-step="-1" aria-label="Classe précédente" title="Classe précédente (←)">‹</button>' +
      classPageHtml(c, c.id === current) +
      '<button class="class-arrow" data-action="classPage" data-step="1" aria-label="Classe suivante" title="Classe suivante (→)">›</button></div><div class="class-dots">' +
      CLASSES.map(
        (k, i) =>
          '<button class="class-dot' +
          (i === page ? ' on' : '') +
          (k.id === current ? ' mine' : '') +
          '" style="--class-color:' +
          k.color +
          '" data-action="classPageTo" data-page="' +
          i +
          '" title="' +
          escape(k.name) +
          '" aria-label="' +
          escape(k.name) +
          '">' +
          k.icon +
          '</button>'
      ).join('') +
      '</div><p class="class-foot">Chaque classe a 10 talents ; tu en équipes 5 au plus (un emplacement aux niveaux ' +
      TALENT_SLOT_LEVELS.join(', ') +
      ').' +
      (current ? ' Changer de classe est gratuit au Camp de l’Aurore ; tes talents sont retirés.' : '') +
      '</p>' +
      (current
        ? '<button class="class-back" data-action="pickClass" data-open="0">↩ Retour aux talents</button>'
        : '') +
      '</div>'
    );
  }
  function renderTalentsHtml() {
    const hero = game.hero,
      k = classe(hero),
      c = def(hero);
    if (!c || ui.picking) return renderPicker(c ? c.id : null);
    const open = slots(hero),
      fighting = inCombat(hero),
      next = TALENT_SLOT_LEVELS[open];
    let html =
      '<div class="classes panel-scroll" data-panel-size="lg" style="--class-color:' +
      c.color +
      '"><h2>' +
      c.icon +
      ' ' +
      escape(c.name) +
      ' <small>· ' +
      escape(c.spec) +
      '</small></h2>' +
      '<div class="class-boxes"><div class="class-box"><b>Passif : ' +
      escape(c.passive.name) +
      '</b><span>' +
      escape(c.passive.desc) +
      '</span></div>' +
      '<div class="class-box"><b>' +
      c.special.icon +
      ' Sort spécial (F) : ' +
      escape(c.special.name) +
      '</b><span>' +
      escape(c.special.desc) +
      ' ' +
      specialCost(c) +
      '.</span></div></div>' +
      CANAAN_CLASS_WEAPON.panelHtml(hero) +
      '<div class="talent-slots">';
    for (let s = 0; s < TALENT_SLOT_LEVELS.length; s++) {
      const i = k.talents[s];
      html +=
        s >= open
          ? '<div class="talent-slot locked">🔒<span>Niveau ' + TALENT_SLOT_LEVELS[s] + '</span></div>'
          : i === undefined
            ? '<div class="talent-slot empty">＋<span>Libre</span></div>'
            : '<div class="talent-slot filled"><b>' + escape(c.talents[i][0]) + '</b></div>';
    }
    html +=
      '</div><p class="class-foot">Talents équipés : <strong>' +
      k.talents.length +
      ' / ' +
      open +
      '</strong>' +
      (next ? ' · prochain emplacement au niveau ' + next : ' · tous les emplacements sont ouverts') +
      (fighting
        ? ' · <span class="class-warn">en combat : changements impossibles</span>'
        : ' · changements gratuits hors combat') +
      '.</p><div class="talent-list">';
    c.talents.forEach(([name, desc], i) => {
      const equipped = k.talents.includes(i),
        full = k.talents.length >= open,
        disabled = fighting || (!equipped && full);
      html +=
        '<div class="talent-row' +
        (equipped ? ' equipped' : '') +
        '"><span class="talent-num">' +
        (i + 1) +
        '</span><div class="talent-desc"><b>' +
        escape(name) +
        '</b>' +
        escape(desc) +
        '</div><button ' +
        (disabled
          ? 'disabled'
          : 'data-action="' + (equipped ? 'unequipTalent' : 'equipTalent') + '" data-talent="' + i + '"') +
        '>' +
        (equipped ? 'Retirer' : full ? 'Complet' : 'Équiper') +
        '</button></div>';
    });
    const camp = atCamp(hero);
    html +=
      '</div><button class="class-change" ' +
      (camp ? 'data-action="pickClass" data-open="1"' : 'disabled') +
      '>' +
      (camp ? '🔄 Changer de classe (gratuit)' : '🔄 Changer de classe : au Camp de l’Aurore') +
      '</button></div>';
    return html;
  }
  function renderTalents() {
    modernPanel(renderTalentsHtml());
  }
  // Barre de compétences : élément de la classe sur chaque compétence, et la case du sort spécial (F).
  function decorateSkillBar(bar) {
    const k = classe(game.hero),
      c = def(game.hero);
    bar.querySelectorAll('.skill').forEach((el, i) => {
      const element = ELEMENTS[skillElement(k.id, i)];
      if (!element) return;
      el.style.setProperty('--skill-element', element.color);
      el.classList.add('elemental');
      el.insertAdjacentHTML(
        'beforeend',
        '<span class="skill-elem" aria-hidden="true">' + element.icon + '</span>'
      );
    });
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'skill special';
    el.id = 'specialSkill';
    el.dataset.tooltipSkill = 'special';
    el.innerHTML =
      (CANAAN_SKILL_ICONS.special(c.special.id) || c.special.icon) +
      '<span class="skill-label">' +
      escape(c.special.name) +
      '</span><div class="key" data-pad="↑">' +
      escape(CANAAN_KEYS.labelOf('special')) +
      '</div><div class="cd" style="display:none"></div>';
    el.style.setProperty('--skill-element', c.color);
    bar.appendChild(el);
  }
  // Touche du sort de classe (F par défaut, Paramètres → Clavier) et clic sur la case du sort spécial.
  addEventListener('keydown', e => {
    if (e.repeat || document.activeElement === chatInput || !CANAAN_KEYS.is(e, 'special')) return;
    if (e.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (!started || paused) return;
    useSpecial();
  });
  addEventListener('click', e => {
    if (e.target && e.target.closest && e.target.closest('#specialSkill')) useSpecial();
  });
  // Flèches ← → : page précédente ou suivante du choix des classes, quand il est ouvert.
  addEventListener('keydown', e => {
    if (e.repeat || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    if (!document.querySelector('#window .class-picker') || document.activeElement === chatInput) return;
    e.preventDefault?.();
    window.classPage(e.key === 'ArrowLeft' ? -1 : 1);
  });
  // Un héros sans classe (aventure d'avant les classes, invité) est invité à la choisir, une fois par partie :
  // message, et le bouton des talents brille jusqu'au choix.
  let prompted = false;
  function promptClass() {
    const button = document.querySelector('#menuButtons [data-action="toggleTalents"]');
    if (button) button.classList.toggle('attention', started && !classe(game.hero).id);
    if (prompted || !started || classe(game.hero).id) return;
    prompted = true;
    // Noms des classes traduits un par un : la liste entière n'est pas une entrée du dictionnaire.
    chat(
      'Système',
      tt('Choisis ta classe : {liste} ou {nom} (touche T).', {
        liste: CLASSES.slice(0, -1)
          .map(c => tt(c.name))
          .join(', '),
        nom: tt(CLASSES[CLASSES.length - 1].name)
      })
    );
    toast('⚔️ Choisis ta classe (T)');
  }

  window.CANAAN_CLASS = Object.freeze({
    choose: chooseClass,
    equip: equipTalent,
    unequip: unequipTalent,
    special: hero => castTracked(hero),
    onLevel,
    autoTalents,
    within,
    runtime,
    weaponType: (hero = game.hero) => weaponType(hero),
    momentum: (hero = game.hero) => momentum(hero),
    addMomentum: (hero, n) => within(hero, () => addMomentum(n)),
    slow: (hero, m, pct, sec, element) => within(hero, () => slow(m, pct, sec, element)),
    dot: (hero, m, kind, sec, total, element) => within(hero, () => dot(m, kind, sec, total, element)),
    chill: (hero, m, sec) => within(hero, () => chill(m, sec)),
    poisoned: (hero, m) => within(hero, () => poisoned(m)),
    bleeding: m => bleeding(m),
    markHolySeal: (hero, target) => within(hero, () => markHolySeal(target)),
    holySealTargets,
    consumeBleeds: (hero, m, factor) => within(hero, () => consumeBleeds(m, factor)),
    reflect: (hero, m, amount, element) => within(hero, () => reflect(m, amount, element)),
    atCamp: hero => atCamp(hero),
    specialLeft,
    setGuestSpecial: v => (guestSpecial = Math.max(0, Number(v) || 0)),
    setClasse,
    decorateSkillBar,
    skillRider,
    skillTalents,
    promptClass,
    giveShield,
    // Invocateur (summons.js) : Peste, talents, vitesse des invocations (Contagion) et explosions.
    summonHaste,
    talent: (hero, cls, key) => on(cls, key, hero),
    plague: (hero, m, n) => within(hero, () => addPlague(m, n)),
    plagueStacks: (m, hero = game.hero) => plagueStacks(m, hero),
    blast: (hero, x, y, tiles, amount, element) => within(hero, () => blast(x, y, tiles, amount, element)),
    // Berserker : prix en PV d'une compétence (null pour une classe qui paie en mana) et Rage écarlate en cours.
    bloodCost: (hero, mana) => (isClass('berserker', hero) ? bloodPrice(hero, mana) : null),
    // Ressource de la classe (mana, energy, fervor, rhythm, blood) et coût du sort spécial dans celle-ci.
    resource: (hero = game.hero) => resource(hero),
    specialPrice: (hero = game.hero) => specialPrice(def(hero), hero),
    raging: (hero = game.hero) => raging(hero),
    specialCost,
    audit: (hero = game.hero) => ({
      id: classe(hero).id,
      talents: [...classe(hero).talents],
      slots: talentSlotsAt(clampLevel(hero.level)),
      level: clampLevel(hero.level),
      classes: CLASSES.length,
      talentCount: CLASSES.reduce((n, c) => n + c.talents.length, 0),
      shield: Math.round(runtime(hero).shield),
      form: hero.player.form || null,
      weapon: weaponType(hero),
      rage: Math.max(0, Math.round((runtime(hero).rageUntil - now()) * 10) / 10),
      scars: runtime(hero).scars,
      momentum: momentum(hero)
    })
  });
  Object.assign(window, { renderTalents, canaanUseSpecial: useSpecial });
})();
