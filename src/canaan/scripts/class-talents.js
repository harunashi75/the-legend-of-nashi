// Classes et talents (shared/data/classes.js) : Druide, Paladin, Assassin, Élémentaliste, Invocateur, Barde,
// Berserker.
// Chaque héros a une classe et jusqu'à 5 talents équipés parmi les 10 de sa classe (hero.classe, sauvegardé) ;
// l'état de leurs effets (boucliers, minuteurs, compteurs) n'est pas sauvegardé. Les compétences d'armes prennent
// l'élément de la classe ; la touche F lance le sort spécial (Forme féline, Lumière divine, Voile d'ombre,
// Avatar élémentaire, Contagion, Hymne de l'Aurore, Rage écarlate). Les fonctions agissent pour le héros courant choisi par within(hero, fn) ;
// l'hôte par défaut. L'Invocateur pose la Peste (charges cumulables) ; ses invocations vivent dans summons.js.
// Le Barde soigne en frappant (Écho mélodieux) et renforce son groupe (Hymne de l'Aurore).
// Le Berserker paie ses compétences en PV (Soif de sang) : plus il est blessé, plus il frappe fort.
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
      barkUntil: 0,
      barkReady: 0,
      faithUntil: 0,
      faithReady: 0,
      instinctUntil: 0,
      instinctReady: 0,
      frostReady: 0,
      willReady: 0,
      interventionUsed: false,
      regenNext: 0,
      natureAvatarUntil: 0,
      natureAvatarNext: 0,
      danceUntil: 0,
      divineUntil: 0,
      veilUntil: 0,
      elemAvatarUntil: 0,
      specialReady: 0,
      crits: 0,
      shadowPending: false,
      shadowReady: 0,
      consecration: 0,
      consecrationReady: 0,
      tempest: 0,
      tempestReady: 0,
      arcane: 0,
      umbra: false,
      // Invocateur : Contagion, Pacte de sang et Moisson d'âmes.
      contagionUntil: 0,
      bloodReady: 0,
      harvest: 0,
      harvestReady: 0,
      // Barde : Hymne de l'Aurore reçu (soin par seconde et dégâts), Mélodie vivifiante reçue, Crescendo,
      // Contre-chant, Inspiration et Grand final.
      hymnUntil: 0,
      hymnTick: 0,
      hymnBy: null,
      vivifyUntil: 0,
      crescendo: 0,
      crescendoUntil: 0,
      counterReady: 0,
      inspire: 0,
      finale: 0,
      finaleReady: 0,
      // Berserker : Rage écarlate (et sa perte de PV à la fin), Soif de sang doublée après une utilitaire,
      // Cicatrices, Cri de guerre reçu, Immortel et PV dépensés (Sang bouillant).
      rageUntil: 0,
      ragePenalty: false,
      thirst: false,
      scars: 0,
      scarsUntil: 0,
      warcryUntil: 0,
      warcryReady: 0,
      undyingReady: 0,
      spent: 0,
      relentless: new WeakMap(),
      // Recharges par allié : Bénédiction forestière et Gardien divin.
      blessing: new WeakMap(),
      guardian: new WeakMap(),
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
      thorns: 0,
      regen: 1,
      bark: 2,
      touch: 3,
      poison: 4,
      blessing: 5,
      roots: 6,
      symbiosis: 7,
      fury: 8,
      avatar: 9
    },
    paladin: {
      holyStrike: 0,
      armor: 1,
      faith: 2,
      light: 3,
      consecration: 4,
      guardian: 5,
      judgment: 6,
      aura: 7,
      will: 8,
      intervention: 9
    },
    assassin: {
      poison: 0,
      precision: 1,
      dance: 2,
      hemorrhage: 3,
      executioner: 4,
      relentless: 5,
      instinct: 6,
      phantom: 7,
      predator: 8,
      shadow: 9
    },
    elementaliste: {
      flames: 0,
      iceHeart: 1,
      overload: 2,
      affinity: 3,
      blaze: 4,
      frost: 5,
      chain: 6,
      deepFreeze: 7,
      arcane: 8,
      tempest: 9
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
      inspiration: 7,
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
      warcry: 7,
      carnage: 8,
      undying: 9
    }
  });
  const on = (cls, key, hero = me()) => classe(hero).id === cls && classe(hero).talents.includes(T[cls][key]);
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
  const ELEMENTAL = ['fire', 'ice', 'lightning'];
  const elementColor = el => ELEMENTS[el]?.color || '#ffffff';

  // ---------------------------------------------------------------- État sauvegardé
  function slots(hero = me()) {
    return talentSlotsAt(clampLevel(hero.level));
  }
  function setClasse(hero, raw) {
    hero.classe = sanitizeClasse(raw, clampLevel(hero.level));
  }
  // Arme liée (Grimoire de l'Invocateur, Grande hache du Berserker) : summons.js la donne, la retire et la fait grandir avec le héros.
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
    if (on('assassin', 'precision')) s.crit += 8;
    if (on('paladin', 'armor')) s.defense = Math.round(s.defense * 1.12);
    if (feral()) {
      s.speed += 20;
      s.crit += 8;
    }
    if (on('druide', 'bark') && t < w.barkUntil) s.guard += 15;
    if (on('paladin', 'faith') && t < w.faithUntil) s.guard += 20;
    if (on('assassin', 'dance') && t < w.danceUntil) s.speed += 20;
    if (on('assassin', 'instinct') && t < w.instinctUntil) {
      s.speed += 20;
      s.guard += 10;
    }
    if (t < w.veilUntil) s.speed += 30;
    // Lumière divine reçue (d'un Paladin, soi compris).
    if (t < w.divineUntil) s.guard += 20;
    // Carapace d'os : au moins deux invocations en jeu.
    if (on('invocateur', 'carapace') && CANAAN_SUMMONS.count(me()) >= 2) s.guard += 10;
    // Mélodie vivifiante reçue (d'un Barde, soi compris).
    if (t < w.vivifyUntil) s.speed += 10;
    // Aura protectrice : un Paladin à moins de 6 cases (soi compris) ; non cumulable.
    if (
      game.heroes.some(
        h => !h.player.dead && on('paladin', 'aura', h) && (h === me() || near(h.player, HP, 6))
      )
    )
      s.guard += 5;
    return s;
  }, 1);

  // ---------------------------------------------------------------- Soins
  // Bonus de soins effectués d'un héros : Soin (secondaire), talents ; la forme féline les réduit.
  function healingDone(hero) {
    const st = characterStats(hero);
    return (
      (1 + Math.max(0, st.healingBonus || 0) / 100) *
      (on('druide', 'touch', hero) ? 1.15 : 1) *
      (on('paladin', 'light', hero) ? 1.12 : 1) *
      (isClass('barde', hero) ? 1.1 : 1) *
      (on('barde', 'ballad', hero) ? 1.15 : 1) *
      (raging(hero) ? 2 : 1) *
      (feral(hero) ? 0.7 : 1)
    );
  }
  // Soins reçus : Lumière guérisseuse.
  const healingReceived = hero => (on('paladin', 'light', hero) ? 1.08 : 1);
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
      amount = periodic
        ? n * outside
        : Math.round(n * healingDone(healer) * healingReceived(target) * outside);
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
      giveShield(target, Math.min(p.mhp * 0.1, current + overflow), 5, talk ? '🎵 Bouclier' : '');
    }
    if (gained > 0 && on('barde', 'vivify', healer)) runtime(target).vivifyUntil = now() + 4;
    // Lumière sacrée (passif du Paladin) : ses soins sur lui-même soignent aussi les alliés proches, à 50 %.
    if (!splash && target === healer && isClass('paladin', healer))
      for (const ally of game.heroes)
        if (ally !== healer && !ally.player.dead && !ally.away && near(ally.player, healer.player, 6)) {
          const h = applyHeal(n * 0.5, false, ally, healer, true);
          if (h > 0) float(ally.player.x, ally.player.y - 40, '+' + Math.round(h) + ' PV', '#ffe9a0');
        }
    if (target === healer || gained <= 0) return gained;
    // Soin d'un allié : boucliers (Bénédiction forestière, Gardien divin) et Symbiose.
    const r = runtime(healer),
      t = now();
    if (on('druide', 'blessing', healer) && t >= (r.blessing.get(target) || 0)) {
      r.blessing.set(target, t + 12);
      giveShield(target, p.mhp * 0.08, 5, '🌿 Bouclier');
    }
    if (on('paladin', 'guardian', healer) && t >= (r.guardian.get(target) || 0)) {
      r.guardian.set(target, t + 15);
      giveShield(target, p.mhp * 0.1, 5, '✨ Bouclier');
    }
    if (on('druide', 'symbiosis', healer)) applyHeal(gained * 0.25, true, healer, healer, true);
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

  // ---------------------------------------------------------------- Effets sur les monstres
  // Effet sur la durée d'un héros sur un monstre : un seul par type et par héros, la plus forte valeur gardée.
  function dot(m, kind, seconds, total, element) {
    if (!alive(m) || !(total > 0)) return;
    const t = now(),
      list = (m._clsDots ??= []),
      old = list.find(d => d.kind === kind && d.by === me() && d.until > t),
      next = refreshDot(old, total / seconds, t + seconds);
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
    m._clsSlow && m._clsSlow.until > now() && m._clsSlow.by === hero && m._clsSlow.element === element;
  // Fureur sauvage : poisons, ronces ou ralentissement de nature du Druide.
  const natureMarked = m => hasDot(m, ['thorns', 'sap', 'poison']) || slowedBy(m, 'nature');
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
    CANAAN_SKILLS.fx('ring', m.x, m.y, 0, TILES(3), 0, '#a4e83c', 0.5);
    for (const o of game.world.monsters.slice()) if (o !== m && alive(o) && near(o, m, 3)) addPlague(o, n);
  }
  // Dégâts d'un effet (sur la durée, éclair, explosion) : ne redéclenchent pas les talents (aucune récursion).
  function effectHit(m, amount, element) {
    if (!alive(m)) return 0;
    let value = amount;
    if (ELEMENTAL.includes(element) && on('elementaliste', 'affinity')) value *= 1.15;
    const burned = hasDot(m, ['burn']);
    const done = window.CANAAN_COMBAT.rawAttack(m, Math.max(1, Math.round(value)), me()) || 0;
    if (m.hp <= 0) onKill(m, burned);
    return done;
  }
  function blast(x, y, tiles, amount, element, except = null) {
    CANAAN_SKILLS.fx('ring', x, y, 0, TILES(tiles), 0, elementColor(element), 0.55);
    burst(x, y, elementColor(element), 18);
    for (const m of game.world.monsters.slice())
      if (m !== except && alive(m) && canaanBodyGap(m, x, y) < TILES(tiles)) effectHit(m, amount, element);
  }
  function onKill(m, burned) {
    spreadPlague(m);
    // Berserker (une seule fois par ennemi) : Frénésie (recharges −2 s) et Carnage (4 % des PV max).
    if (isClass('berserker') && !m._bloodKill) {
      m._bloodKill = true;
      if (on('berserker', 'frenzy')) CANAAN_SKILLS.hasten(me(), 2);
      if (on('berserker', 'carnage')) {
        const h = applyHeal(HP.mhp * 0.04, false, me(), me(), true);
        if (h > 0) float(HP.x, HP.y - 40, '🩸 +' + Math.round(h) + ' PV', '#ff8a96');
      }
    }
    // Explosion ardente : un ennemi brûlé par l'Élémentaliste explose (une seule fois).
    if (burned && on('elementaliste', 'blaze') && !m._clsExploded) {
      m._clsExploded = true;
      blast(m.x, m.y, 3, characterStats(me()).attack * 0.5, 'fire', m);
    }
  }

  // ---------------------------------------------------------------- Soif de sang (Berserker)
  // Le Berserker paie ses compétences en PV : chaque point de mana vaut 0,6 % de ses PV max au niveau 1, jusqu'à 1 %
  // au niveau 60 (shared/rules/resources.js). Une compétence ne peut jamais le tuer (il lui faut garder au moins
  // 1 PV) ; un compagnon garde 25 % de ses PV.
  const BLOOD = Object.freeze({ boil: 0.25, companionFloor: 0.25 });
  const bloodPrice = (hero, mana) => resourceBloodCost(hero.player.mhp, mana, hero.level);
  function canBleed(price) {
    const floor = me() !== game.hero && me().local ? HP.mhp * BLOOD.companionFloor : 0;
    return HP.hp - price >= Math.max(1, floor);
  }
  // Sang bouillant : tous les 25 % des PV max dépensés, une explosion de sang autour du Berserker.
  function boil(price) {
    if (!on('berserker', 'boiling')) return;
    w.spent += price;
    while (w.spent >= HP.mhp * BLOOD.boil) {
      w.spent -= HP.mhp * BLOOD.boil;
      float(HP.x, HP.y - 70, '🩸 SANG BOUILLANT', '#e0404f');
      blast(HP.x, HP.y, 3, characterStats(me()).attack * 1.5, 'blood');
    }
  }
  // Ressource de la classe du héros (shared/rules/resources.js) : mana, Énergie, Ferveur, Rythme ou PV (Berserker).
  const resource = (hero = me()) => classResource(classe(hero).id);
  // Coût du sort spécial d'une classe dans sa ressource (prix en mana converti au niveau du héros).
  const specialPrice = (c, hero = me()) =>
    c?.special?.mana > 0 ? resourceCost(classResource(c.id), c.special.mana, hero?.level) : 0;
  // Gain de Ferveur ou de Rythme sur un événement de combat ; une attaque de base de zone ne compte qu'une fois.
  function gainResource(event, info) {
    const amount = resourceGain(resource(), event, info);
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
    CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, 90, 0, '#e0404f', 0.6);
    burst(HP.x, HP.y, '#e0404f', 30);
    burst(HP.x, HP.y, '#5a0a14', 12);
    float(HP.x, HP.y - 62, '🩸 RAGE ÉCARLATE', '#e0404f');
  }
  function addScars(n) {
    const t = now();
    w.scars = Math.min(10, (t < w.scarsUntil ? w.scars : 0) + n);
    w.scarsUntil = t + 6;
  }
  // Un ennemi qui saigne (saignement d'un héros, des dagues ou d'un sort).
  const bleeding = m =>
    (m._clsDots || []).some(d => d.kind === 'bleed' && d.until > now()) ||
    m.v1746_bleed > 0 ||
    m.spell_bleed > 0;

  // ---------------------------------------------------------------- Compétences
  // Coût d'une compétence dans la ressource de la classe (base : son prix en mana, converti selon la ressource et le
  // niveau), puis Concentration arcanique (chaque 3e offensive) et Avatar élémentaire.
  window.CANAAN_CLASS_MANA_COST = forHero(function (type, i, base) {
    let cost = resourceCost(resource(), base, me().level);
    if (on('elementaliste', 'arcane') && isOffensiveSkill(type, i) && (w.arcane + 1) % 3 === 0) cost *= 0.5;
    if (now() < w.elemAvatarUntil) cost *= 0.7;
    // Inspiration (Barde) : toutes les 4 compétences, la cinquième est gratuite.
    if (on('barde', 'inspiration') && (w.inspire + 1) % 5 === 0) cost = 0;
    return cost;
  }, 3);
  // Lancement d'une compétence : contexte de ses coups (magique, élément, offensive, multiplicateur) et
  // déclencheurs comptés par compétence (Consécration, Tempête élémentaire, Ombre meurtrière, Voile d'ombre).
  window.CANAAN_CLASS_CAST = forHero(function (type, i) {
    const offensive = isOffensiveSkill(type, i),
      t = now(),
      context = {
        magic: MAGIC_WEAPONS.includes(type),
        multiplier: 1,
        skill: true,
        offensive,
        slot: i,
        element: skillElement(classe().id, i)
      };
    if (on('barde', 'inspiration') && ++w.inspire % 5 === 0)
      float(HP.x, HP.y - 74, '🎵 INSPIRATION : GRATUIT', '#ff9ad5');
    if (!offensive) return context;
    w.arcane++;
    // Soif de sang doublée (Berserker) : la compétence offensive qui suit une utilitaire.
    if (w.thirst) {
      w.thirst = false;
      context.thirst = true;
      float(HP.x, HP.y - 74, '🩸 SOIF DE SANG ×2', '#e0404f');
    }
    // Empreinte de l'Assassin : une compétence utilitaire renforce la prochaine compétence offensive.
    if (w.umbra) {
      w.umbra = false;
      context.multiplier *= 1.25;
      float(HP.x, HP.y - 74, '🌑 EMBUSCADE +25 %', '#c48cff');
    }
    if (w.shadowPending) {
      w.shadowPending = false;
      context.multiplier *= 1.3;
      float(HP.x, HP.y - 60, '🗡️ OMBRE MEURTRIÈRE', '#c48cff');
    }
    if (t < w.veilUntil) {
      context.multiplier *= 1.4;
      endVeil();
    }
    if (on('paladin', 'consecration')) {
      w.consecration = Math.min(3, w.consecration + 1);
      if (w.consecration >= 3 && t >= w.consecrationReady) {
        w.consecration = 0;
        w.consecrationReady = t + 15;
        zones.push({ x: HP.x, y: HP.y, r: TILES(3), until: t + 5, tick: t, owner: me() });
        float(HP.x, HP.y - 62, '☀️ CONSÉCRATION', '#ffd76a');
      }
    }
    // Barde : Crescendo (+3 % par compétence offensive, 15 % au plus, 6 s) et Grand final (toutes les 6).
    if (on('barde', 'crescendo')) {
      w.crescendo = t < w.crescendoUntil ? Math.min(5, w.crescendo + 1) : 1;
      w.crescendoUntil = t + 6;
    }
    if (on('barde', 'finale')) {
      w.finale = Math.min(6, w.finale + 1);
      if (w.finale >= 6 && t >= w.finaleReady) {
        w.finale = 0;
        w.finaleReady = t + 12;
        float(HP.x, HP.y - 62, '🎶 GRAND FINAL', '#ff9ad5');
        blast(HP.x, HP.y, 4, characterStats(me()).attack * 1.2, 'harmony');
        for (const h of groupAround(6)) healFloat(h, h.player.mhp * 0.08);
      }
    }
    if (on('elementaliste', 'tempest')) {
      w.tempest = Math.min(5, w.tempest + 1);
      if (w.tempest >= 5 && t >= w.tempestReady) {
        w.tempest = 0;
        w.tempestReady = t + 12;
        float(HP.x, HP.y - 62, '🌪️ TEMPÊTE ÉLÉMENTAIRE', '#f4f07a');
        const atk = characterStats(me()).attack * 0.8;
        blast(HP.x, HP.y, 4, atk, ['fire', 'ice', 'lightning'][Math.floor(Math.random() * 3)]);
      }
    }
    return context;
  }, 2);
  // Empreintes de classe après une compétence : bouclier (Paladin), soins (Druide), embuscade (Assassin),
  // décharge élémentaire (Élémentaliste). Les effets sur les coups sont dans after().
  window.CANAAN_CLASS_AFTER_CAST = forHero(function (type, i) {
    const id = classe().id;
    if (!id) return;
    const offensive = isOffensiveSkill(type, i),
      group = game.heroes.filter(h => !h.player.dead && !h.away && (h === me() || near(h.player, HP, 6)));
    if (offensive) {
      if (id === 'paladin') giveShield(me(), HP.mhp * 0.05, 4, '☀️ Bouclier');
      return;
    }
    if (id === 'druide')
      for (const h of group) {
        const n = applyHeal(h.player.mhp * 0.08, false, h, me(), true);
        if (n > 0) float(h.player.x, h.player.y - 40, '+' + Math.round(n) + ' PV', '#7ee36a');
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
    if (id === 'elementaliste') {
      const el = skillElement(id, i);
      blast(HP.x, HP.y, 2.5, characterStats(me()).attack, el);
    }
  }, 2);
  // Texte de l'empreinte de classe d'une compétence d'arme, pour l'info-bulle.
  function skillRider(type, i, hero = game.hero) {
    const id = classe(hero).id,
      offensive = isOffensiveSkill(type, i);
    if (!id) return 'Sans classe : choisis une classe au camp pour ajouter un effet à cette compétence.';
    const el = ELEMENTS[skillElement(id, i)];
    if (id === 'druide')
      return offensive
        ? '🌿 Druide : empoisonne les cibles (25 % des dégâts infligés, en plus, sur 4 s) et soigne ton groupe proche de 5 % des dégâts.'
        : '🌿 Druide : soigne aussi toi et tes alliés à 6 cases de 8 % de leurs PV max.';
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
        : '🩸 Berserker : se paie en PV ; ta prochaine compétence offensive te rend 30 % des dégâts infligés.';
    if (id === 'invocateur')
      return '☠️ Invocateur : chaque coup pose une charge de Peste (8 au maximum, 8 % de ton Attaque par charge et par seconde).';
    if (!offensive)
      return (
        el.icon +
        ' ' +
        el.name +
        ' : libère une décharge autour de toi (100 % de l’Attaque, rayon 2,5 cases).'
      );
    if (el.name === 'Feu') return '🔥 Feu : brûle les cibles (30 % des dégâts infligés, en plus, sur 4 s).';
    if (el.name === 'Glace') return '❄️ Glace : ralentit les cibles de 30 % pendant 2,5 s.';
    return '⚡ Foudre : chaque coup rebondit sur 2 ennemis proches (35 % des dégâts).';
  }
  // Attaques de base plus rapides en forme féline et pendant la Rage écarlate (verrou × 0,8 chacune).
  window.CANAAN_CLASS_BASIC_LOCK = forHero(() => (feral() ? 0.8 : 1) * (raging() ? 0.8 : 1), 0);
  // Avant un coup d'un héros : multiplicateurs de dégâts.
  function before(m, damage, options = {}) {
    const t = now();
    let mult = options.multiplier ?? 1;
    if (feral()) mult *= 1.15;
    if (t < w.elemAvatarUntil) mult *= 1.2;
    if (on('druide', 'avatar') && t < w.natureAvatarUntil) mult *= 1.15;
    if (on('druide', 'fury') && natureMarked(m)) mult *= 1.12;
    const ratio = m.mhp ? m.hp / m.mhp : 1;
    if (on('paladin', 'judgment') && ratio < 0.3) mult *= 1.15;
    if (on('assassin', 'executioner') && ratio < 0.25) mult *= 1.2;
    if (on('assassin', 'relentless')) {
      const r = w.relentless.get(m);
      if (r && t - r.last <= 4) mult *= 1 + 0.02 * Math.min(5, r.stacks);
    }
    if (
      on('assassin', 'predator') &&
      game.world.monsters.filter(o => alive(o) && near(o, HP, 5)).length === 1
    )
      mult *= 1.12;
    if (on('elementaliste', 'deepFreeze') && slowedBy(m, 'ice')) mult *= 1.15;
    // Invocateur : Nécrose (+2 % par charge de Peste), Légion (+10 % pour les invocations).
    if (on('invocateur', 'necrosis')) mult *= 1 + 0.02 * plagueStacks(m);
    if (options.summon && on('invocateur', 'legion')) mult *= 1.1;
    // Barde : Hymne de l'Aurore et Mélodie vivifiante reçus, Crescendo, Dissonance (de n'importe quel Barde).
    if (t < w.hymnUntil) mult *= 1.1;
    if (t < w.vivifyUntil) mult *= 1.05;
    if (on('barde', 'crescendo') && t < w.crescendoUntil) mult *= 1 + 0.03 * w.crescendo;
    if (m._dissonant > t) mult *= 1.08;
    // Berserker : Soif de sang (+1 % par tranche de 2 % de PV perdus, 50 % au plus), Cicatrices, Curée ; Cri de
    // guerre reçu (de n'importe quel Berserker).
    if (isClass('berserker')) {
      const lost = HP.mhp ? Math.max(0, 1 - HP.hp / HP.mhp) : 0;
      mult *= 1 + Math.min(50, Math.floor(lost * 50 + 1e-9)) / 100;
    }
    if (on('berserker', 'scars') && t < w.scarsUntil) mult *= 1 + 0.02 * w.scars;
    if (on('berserker', 'hunger') && bleeding(m)) mult *= 1.15;
    if (t < w.warcryUntil) mult *= 1.1;
    // Empreinte de l'Assassin : compétences offensives +12 %, finition (4) +30 % sur une cible sous 50 %.
    if (options.skill && options.offensive && isClass('assassin'))
      mult *= options.slot === 3 && ratio < 0.5 ? 1.12 * 1.3 : 1.12;
    return { damage: damage * mult, base: damage, options };
  }
  // Après un coup : déclencheurs (effets sur la durée, éclairs, ralentissements, soins), d'après les dégâts réels.
  function after(m, info) {
    const options = info.options || {},
      dealt = Math.max(0, info.dealt || 0),
      crit = !!m._lastCrit,
      skill = !!options.skill && !!options.offensive,
      basic = !!options.basic,
      t = now(),
      roll = Math.random;
    // Ferveur (Paladin) et Rythme (Barde) : une attaque de base qui touche les fait monter.
    if (basic && dealt > 0) gainResource('basic');
    if (on('assassin', 'relentless')) {
      const r = w.relentless.get(m);
      w.relentless.set(m, { stacks: r && t - r.last <= 4 ? Math.min(5, r.stacks + 1) : 1, last: t });
    }
    if (crit && on('assassin', 'shadow') && t >= w.shadowReady && !w.shadowPending && ++w.crits >= 3) {
      w.crits = 0;
      w.shadowPending = true;
      w.shadowReady = t + 15;
    }
    if (skill && options.element) burst(m.x, m.y, elementColor(options.element), 5);
    // Sève vitale (Druide, hors forme féline) : 5 % des dégâts rendus à lui et aux alliés proches.
    if (skill && dealt > 0 && isClass('druide') && !feral())
      for (const hero of game.heroes)
        if (!hero.player.dead && !hero.away && (hero === me() || near(hero.player, HP, 6)))
          applyHeal(dealt * 0.05, false, hero, me(), true);
    // Écho mélodieux (Barde) : 20 % des dégâts rendus à l'allié le plus blessé à 8 cases (deux avec Chœur).
    if (skill && dealt > 0 && isClass('barde'))
      for (const hero of groupAround(8)
        .sort((a, b) => a.player.hp / a.player.mhp - b.player.hp / b.player.mhp)
        .slice(0, on('barde', 'choir') ? 2 : 1))
        healFloat(hero, dealt * 0.2);
    // Soif de sang (Berserker) : 15 % des dégâts rendus (45 % sous 15 % de PV avec Dernier carré), doublés après une
    // compétence utilitaire.
    if (skill && dealt > 0 && isClass('berserker')) {
      const rate =
          (on('berserker', 'lastStand') && HP.hp < HP.mhp * 0.15 ? 0.45 : 0.15) * (options.thirst ? 2 : 1),
        h = applyHeal(dealt * rate, false, me(), me(), true);
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#ff8a96');
    }
    if (dealt > 0 && alive(m)) {
      // Saignée (Berserker) : 30 % des dégâts en saignement sur 4 s.
      if (skill && on('berserker', 'bloodletting')) dot(m, 'bleed', 4, dealt * 0.3, 'blood');
      // Barde : Dissonance (la cible subit +8 % de dégâts pendant 4 s).
      if (skill && on('barde', 'dissonance')) {
        if (!(m._dissonant > t)) float(m.x, m.y - 50, '🎵', '#ff9ad5');
        m._dissonant = t + 4;
      }
      // Druide
      if (skill && on('druide', 'thorns') && roll() < 0.2) dot(m, 'thorns', 5, dealt * 0.3, 'nature');
      if (crit && on('druide', 'poison') && roll() < 0.25) dot(m, 'poison', 6, dealt * 0.4, 'nature');
      if (skill && on('druide', 'roots') && roll() < 0.15) slow(m, 0.3, 3, 'nature');
      // Assassin
      if (basic && on('assassin', 'poison') && roll() < 0.2) dot(m, 'poison', 5, dealt * 0.35, 'shadow');
      if (crit && on('assassin', 'hemorrhage')) dot(m, 'bleed', 4, dealt * 0.3, 'shadow');
      // Empreintes de classe sur les compétences offensives : sève (Druide), feu et glace (Élémentaliste).
      if (skill && isClass('druide')) dot(m, 'sap', 4, dealt * 0.25, 'nature');
      if (skill && options.element === 'fire' && isClass('elementaliste'))
        dot(m, 'burn', 4, dealt * 0.3, 'fire');
      if (skill && options.element === 'ice' && isClass('elementaliste')) slow(m, 0.3, 2.5, 'ice');
      if (skill && on('elementaliste', 'flames') && roll() < 0.2) dot(m, 'burn', 5, dealt * 0.35, 'fire');
      if (skill && on('elementaliste', 'iceHeart') && roll() < 0.2) slow(m, 0.3, 3, 'ice');
      // Peste noire (Invocateur) : chaque attaque et chaque coup d'invocation pose une charge.
      if ((skill || basic) && isClass('invocateur')) addPlague(m, 1);
    }
    if (dealt > 0) {
      // Frappes supplémentaires (sans nouveaux déclencheurs).
      if (basic && on('paladin', 'holyStrike') && roll() < 0.2) {
        burst(m.x, m.y, '#ffd76a', 8);
        effectHit(m, dealt * 0.35, 'holy');
      }
      if (skill && on('assassin', 'phantom') && roll() < 0.15) {
        float(m.x, m.y - 60, '👻', '#c48cff');
        effectHit(m, dealt * 0.4, 'shadow');
      }
      // Note perçante (Barde) : onde sonore autour de la cible.
      if (crit && on('barde', 'piercing') && roll() < 0.25) blast(m.x, m.y, 2.5, dealt * 0.5, 'harmony');
      if (crit && on('elementaliste', 'overload') && roll() < 0.2) {
        CANAAN_SKILLS.fx('beam', m.x, m.y - 90, Math.PI / 2, 90, 6, '#f4f07a', 0.25);
        effectHit(m, dealt * 0.4, 'lightning');
      }
      // Empreinte de foudre : chaque coup rebondit sur 2 ennemis proches.
      if (skill && options.element === 'lightning' && isClass('elementaliste')) {
        const others = game.world.monsters
          .filter(o => o !== m && alive(o) && near(o, m, 4))
          .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
          .slice(0, 2);
        for (const o of others) {
          CANAAN_SKILLS.fx(
            'beam',
            m.x,
            m.y,
            Math.atan2(o.y - m.y, o.x - m.x),
            Math.hypot(o.x - m.x, o.y - m.y),
            5,
            '#f4f07a',
            0.25
          );
          effectHit(o, dealt * 0.35, 'lightning');
        }
      }
      if (skill && on('elementaliste', 'chain') && roll() < 0.15) {
        const others = game.world.monsters
          .filter(o => o !== m && alive(o) && near(o, m, 5))
          .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
          .slice(0, 2);
        for (const o of others) {
          CANAAN_SKILLS.fx(
            'beam',
            m.x,
            m.y,
            Math.atan2(o.y - m.y, o.x - m.x),
            Math.hypot(o.x - m.x, o.y - m.y),
            5,
            '#f4f07a',
            0.25
          );
          effectHit(o, dealt * 0.25, 'lightning');
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
  // Coup reçu : bouclier, puis le combat continue. Le reste des réductions est dans la Garde (statistiques).
  window.CANAAN_CLASS_DEFENSE = forHero(function (source, damage) {
    let d = damage;
    // Berserker : Peau de fer (−1 % par tranche de 5 % de PV perdus, 18 % au plus) et Cicatrices (une par coup).
    if (on('berserker', 'ironSkin')) {
      const lost = HP.mhp ? Math.max(0, 1 - HP.hp / HP.mhp) : 0;
      d *= 1 - Math.min(18, Math.floor(lost * 20 + 1e-9)) / 100;
    }
    if (on('berserker', 'scars') && damage > 0) addScars(1);
    // Ferveur (Paladin) : chaque coup reçu la fait monter, d'autant plus qu'il fait mal.
    if (damage > 0) gainResource('hurt', { damage, maxHp: HP.mhp });
    if (w.shield > 0 && now() < w.shieldUntil && d > 0) {
      const absorb = Math.min(w.shield, d);
      w.shield -= absorb;
      d -= absorb;
      if (absorb > 0) float(HP.x, HP.y - 46, '🛡 −' + Math.round(absorb), '#bfe4ff');
    }
    return Math.max(0, Math.round(d));
  }, 2);
  // Esquive (roulade, esquive ou déviation) : Danse des ombres.
  window.CANAAN_CLASS_ON_DODGE = forHero(function () {
    if (on('assassin', 'dance')) w.danceUntil = now() + 3;
  }, 0);
  // Coup critique ennemi subi : Volonté sacrée, Cicatrices (deux de plus que pour un coup normal).
  window.CANAAN_CLASS_ON_CRIT_TAKEN = forHero(function () {
    const t = now();
    if (on('berserker', 'scars')) addScars(2);
    if (!on('paladin', 'will') || t < w.willReady) return;
    w.willReady = t + 20;
    const h = applyHeal(HP.mhp * 0.05, true, me(), me());
    if (h > 0) float(HP.x, HP.y - 60, '✨ +' + Math.round(h) + ' PV', '#ffe9a0');
  }, 0);
  // Coup fatal : la Rage écarlate et Immortel (Berserker) gardent 1 PV ; Intervention divine (une fois par combat)
  // laisse le Paladin à 1 PV avec un bouclier.
  window.CANAAN_CLASS_FATAL = forHero(function (n) {
    if (HP.hp - n > 0) return n;
    const t = now();
    if (raging()) return Math.max(0, Math.ceil(HP.hp) - 1);
    if (on('berserker', 'undying') && t >= w.undyingReady) {
      w.undyingReady = t + 90;
      startRage(4, false);
      notice('🩸 Immortel !');
      return Math.max(0, Math.ceil(HP.hp) - 1);
    }
    if (!on('paladin', 'intervention') || w.interventionUsed) return n;
    w.interventionUsed = true;
    giveShield(me(), HP.mhp * 0.25, 5, '✨ INTERVENTION DIVINE');
    burst(HP.x, HP.y, '#ffd76a', 30);
    notice('✨ Intervention divine !');
    return Math.max(0, Math.ceil(HP.hp) - 1);
  }, 1);

  // ---------------------------------------------------------------- Sort spécial (touche F)
  function endVeil() {
    w.veilUntil = 0;
    HP.veiled = false;
  }
  // Lance le sort spécial de la classe d'un héros (l'hôte par défaut). Renvoie true s'il a eu lieu.
  // Sort spécial lancé (compté pour les succès).
  const castTracked = hero => {
    const done = castSpecial(hero);
    if (done) canaanAchieve(hero, 'special');
    return done;
  };
  const castSpecial = forHero(function () {
    const c = def(),
      t = now();
    if (!c || HP.dead || (me() === game.hero && playerStun > 0)) return false;
    const s = c.special;
    if (t < w.specialReady) {
      if (me() === game.hero) toast(s.name + ' : encore ' + Math.ceil(w.specialReady - t) + ' s');
      return false;
    }
    // Quitter la forme féline est gratuit.
    if (s.id === 'feral' && HP.form === 'feral') {
      HP.form = null;
      w.specialReady = t + s.cooldown;
      burst(HP.x, HP.y, '#7ee36a', 18);
      float(HP.x, HP.y - 58, 'FORME NORMALE', '#c8f5b8');
      recompute();
      return true;
    }
    const price = specialPrice(c, me());
    if (HP.mp < price) {
      if (me() === game.hero) toast(RESOURCES[resource()].lack);
      return false;
    }
    HP.mp -= price;
    w.specialReady = t + s.cooldown;
    CANAAN_SOUND.cue('levelup');
    if (s.id === 'feral') {
      HP.form = 'feral';
      burst(HP.x, HP.y, '#7ee36a', 34);
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, 70, 0, '#7ee36a', 0.5);
      float(HP.x, HP.y - 62, '🐆 FORME FÉLINE', '#7ee36a');
    } else if (s.id === 'divine') {
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, TILES(6), 0, '#ffd76a', 0.7);
      burst(HP.x, HP.y, '#ffd76a', 30);
      float(HP.x, HP.y - 62, '✨ LUMIÈRE DIVINE', '#ffd76a');
      for (const hero of game.heroes) {
        if (hero.player.dead || hero.away || (hero !== me() && !near(hero.player, HP, 6))) continue;
        runtime(hero).divineUntil = t + 6;
        const h = applyHeal(hero.player.mhp * 0.2, false, hero, me(), true);
        if (h > 0) float(hero.player.x, hero.player.y - 42, '+' + Math.round(h) + ' PV', '#ffe9a0');
      }
    } else if (s.id === 'veil') {
      w.veilUntil = t + 4;
      HP.veiled = true;
      burst(HP.x, HP.y, '#c48cff', 24);
      float(HP.x, HP.y - 62, '🌑 VOILE D’OMBRE', '#c48cff');
    } else if (s.id === 'avatar') {
      w.elemAvatarUntil = t + 10;
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, 90, 0, '#ff8a3d', 0.6);
      burst(HP.x, HP.y, '#ff8a3d', 14);
      burst(HP.x, HP.y, '#8fdcff', 14);
      burst(HP.x, HP.y, '#f4f07a', 14);
      float(HP.x, HP.y - 62, '🌋 AVATAR ÉLÉMENTAIRE', '#ff8a3d');
    } else if (s.id === 'contagion') {
      w.contagionUntil = t + 8;
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, TILES(7), 0, '#a4e83c', 0.8);
      burst(HP.x, HP.y, '#a4e83c', 30);
      burst(HP.x, HP.y, '#7b3fa0', 14);
      float(HP.x, HP.y - 62, '☣️ CONTAGION', '#a4e83c');
      for (const m of game.world.monsters.slice()) if (alive(m) && near(m, HP, 7)) addPlague(m, 4);
    } else if (s.id === 'rage') {
      startRage(8, true);
    } else if (s.id === 'hymn') {
      // Hymne de l'Aurore : 15 % des PV max tout de suite, puis 3 % par seconde pendant 6 s, et +10 % de dégâts.
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, TILES(8), 0, '#ff9ad5', 0.8);
      burst(HP.x, HP.y, '#ff9ad5', 30);
      burst(HP.x, HP.y, '#ffe9f4', 12);
      float(HP.x, HP.y - 62, '🎶 HYMNE DE L’AURORE', '#ff9ad5');
      for (const hero of groupAround(8)) {
        const r = runtime(hero);
        r.hymnUntil = t + 6;
        r.hymnTick = t + 1;
        r.hymnBy = me();
        healFloat(hero, hero.player.mhp * 0.15);
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
  // Zones sacrées de la Consécration.
  const zones = [];
  function stepHero(t) {
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
    // Cri de guerre (Berserker) : sous 50 % de PV en combat, +10 % de dégâts au groupe proche pendant 6 s.
    if (on('berserker', 'warcry') && fighting && ratio < 0.5 && t >= w.warcryReady) {
      w.warcryReady = t + 30;
      CANAAN_SKILLS.fx('ring', HP.x, HP.y, 0, TILES(6), 0, '#e0404f', 0.7);
      float(HP.x, HP.y - 62, '💢 CRI DE GUERRE', '#e0404f');
      for (const h of groupAround(6)) runtime(h).warcryUntil = t + 6;
    }
    if (on('druide', 'bark') && ratio < 0.4 && t >= w.barkReady) {
      w.barkUntil = t + 6;
      w.barkReady = t + 40;
      notice('🌳 Écorce protectrice !');
    }
    if (on('paladin', 'faith') && ratio < 0.35 && t >= w.faithReady) {
      w.faithUntil = t + 5;
      w.faithReady = t + 45;
      notice('🙏 Foi inébranlable !');
    }
    if (on('assassin', 'instinct') && ratio < 0.35 && t >= w.instinctReady) {
      w.instinctUntil = t + 5;
      w.instinctReady = t + 40;
      notice('🐾 Instinct de survie !');
    }
    if (on('elementaliste', 'frost') && ratio < 0.4 && t >= w.frostReady) {
      w.frostReady = t + 40;
      giveShield(me(), HP.mhp * 0.15, 5, '❄️ BARRIÈRE DE GIVRE');
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
    // Contre-chant (Barde) : sous 40 % de PV, 10 % des PV max et un bouclier de 10 % pendant 5 s.
    if (on('barde', 'counter') && ratio < 0.4 && t >= w.counterReady) {
      w.counterReady = t + 40;
      applyHeal(HP.mhp * 0.1, false, me(), me(), true);
      giveShield(me(), HP.mhp * 0.1, 5, '🎵 CONTRE-CHANT');
    }
    // Hymne de l'Aurore reçu : 3 % des PV max par seconde, par le Barde qui l'a chanté.
    if (w.hymnUntil > 0 && t + 1e-9 >= w.hymnTick && w.hymnTick <= w.hymnUntil + 1e-9) {
      w.hymnTick += 1;
      const by = game.heroes.includes(w.hymnBy) ? w.hymnBy : me(),
        h = applyHeal(HP.mhp * 0.03, false, me(), by, true);
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#ffc2e4');
    }
    if (on('druide', 'avatar') && fighting && t >= w.natureAvatarNext) {
      w.natureAvatarNext = t + 45;
      w.natureAvatarUntil = t + 8;
      burst(HP.x, HP.y, '#7ee36a', 20);
      notice('🌳 Avatar de la nature !');
    }
    // Régénération naturelle : 1 % des PV max toutes les 5 s en combat (+50 % pendant l'Avatar de la nature).
    if (!on('druide', 'regen') || !fighting) w.regenNext = t + 5;
    else if (t >= w.regenNext) {
      w.regenNext = t + 5;
      const h = applyHeal(HP.mhp * 0.01 * (t < w.natureAvatarUntil ? 1.5 : 1), true, me(), me());
      if (h > 0) float(HP.x, HP.y - 40, '+' + Math.round(h) + ' PV', '#9fffa0');
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
        if (t >= d.until) m._clsDots.splice(m._clsDots.indexOf(d), 1);
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
      for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        if (t >= z.until || !game.heroes.includes(z.owner)) {
          zones.splice(i, 1);
          continue;
        }
        if (t + 1e-9 < z.tick) continue;
        z.tick += 1;
        CANAAN_SKILLS.fx('ring', z.x, z.y, 0, z.r, 0, '#ffd76a', 1);
        within(z.owner, () => {
          const atk = characterStats(me()).attack * 0.15;
          for (const m of game.world.monsters.slice())
            if (alive(m) && canaanBodyGap(m, z.x, z.y) < z.r) effectHit(m, atk, 'holy');
        });
      }
    }
  };
  // Étape de rendu : zones consacrées, boucliers et aura du sort spécial ; recharge de la touche F.
  window.CanaanStages.drawClassEffects = function () {
    if (!started) return;
    ctx.save();
    ctx.translate(Math.round(-camX), Math.round(-camY));
    for (const z of zones) {
      ctx.globalAlpha = 0.16 + 0.05 * Math.sin(time * 0.15);
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#fff1aa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (const hero of game.heroes) {
      const p = hero.player;
      if (p.dead) continue;
      if (p.shielded) {
        ctx.globalAlpha = 0.35 + 0.1 * Math.sin(time * 0.2);
        ctx.strokeStyle = '#bfe4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 4, 28, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Hymne de l'Aurore : notes roses qui montent autour du héros.
      if (now() < runtime(hero).hymnUntil && time % 10 === 0)
        particles.push({
          x: p.x + (Math.random() - 0.5) * 34,
          y: p.y + 6,
          vx: 0,
          vy: -0.7,
          life: 30,
          c: '#ff9ad5',
          r: 2.5
        });
      // Rage écarlate : gouttes de sang qui montent autour du héros.
      if (raging(hero) && time % 6 === 0)
        particles.push({
          x: p.x + (Math.random() - 0.5) * 32,
          y: p.y + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.9,
          life: 24,
          c: Math.random() < 0.5 ? '#e0404f' : '#8a1020',
          r: 2.5
        });
      if (p.form === 'feral' && time % 9 === 0)
        particles.push({
          x: p.x + (Math.random() - 0.5) * 30,
          y: p.y + 12,
          vx: 0,
          vy: -0.6,
          life: 26,
          c: '#7ee36a',
          r: 2.5
        });
    }
    ctx.restore();
    const el = document.getElementById('specialSkill');
    if (el) {
      const left = specialLeft(),
        cd = el.querySelector('.cd'),
        text = left > 0 ? String(Math.ceil(left)) : '';
      if (cd.textContent !== text) cd.textContent = text;
      cd.style.display = left > 0 ? 'flex' : 'none';
      el.classList.toggle(
        'active',
        game.hero.player.form === 'feral' ||
          !!game.hero.player.veiled ||
          now() < runtime(game.hero).contagionUntil ||
          now() < runtime(game.hero).hymnUntil ||
          now() < runtime(game.hero).rageUntil
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
    // Arme liée : il faut de la place dans le sac pour ranger les armes portées (summons.js prévient le joueur).
    if (!CANAAN_SUMMONS.canSwitch(me(), id)) return false;
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
    druide: [0, 1, 3, 8, 9, 7, 2, 4, 5, 6],
    paladin: [1, 6, 2, 0, 7, 9, 3, 4, 5, 8],
    assassin: [1, 3, 4, 5, 8, 9, 0, 2, 6, 7],
    elementaliste: [0, 3, 7, 1, 9, 4, 6, 2, 5, 8],
    invocateur: [1, 3, 0, 5, 9, 2, 4, 7, 6, 8],
    barde: [1, 5, 8, 0, 9, 3, 7, 4, 2, 6],
    berserker: [4, 5, 0, 9, 3, 7, 1, 8, 2, 6]
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
  function classPageHtml(c, current) {
    const weapon = boundWeaponOf(c.id),
      def = weapon ? WEAPON_DEFINITIONS[weapon] : null;
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
      (def
        ? '<div class="class-line class-pact"><b>' +
          def.icon +
          ' Arme liée · ' +
          escape(def.name) +
          ' <span class="relic-tag">' +
          escape(BOUND_RARITY.name) +
          '</span></b>' +
          escape(def.role) +
          ' Il prend ton niveau et grandit avec toi ; aucune autre arme ne peut s’équiper.<ul class="class-pact-spells">' +
          def.sp
            .map(
              (spec, i) =>
                '<li title="' +
                escape(spec[6]) +
                '">' +
                (CANAAN_SKILL_ICONS.weapon(weapon, i) || spec[0]) +
                '<span>' +
                escape(spec[1]) +
                '</span></li>'
            )
            .join('') +
          '</ul></div>'
        : '<p class="class-line"><b>⚔️ Armes</b>Toutes les armes restent utilisables : leurs compétences prennent l’élément de la classe (' +
          [...new Set(c.elements)].map(e => ELEMENTS[e].icon + ' ' + escape(ELEMENTS[e].name)).join(', ') +
          ').</p>') +
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
      pactLine(hero) +
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
  // Arme liée portée (Grimoire) : nom du palier, qualité Relique et niveau, sous le passif.
  function pactLine(hero) {
    const item = hero.equipment?.weapon;
    if (!isBoundItem(item)) return '';
    return (
      '<p class="class-foot class-pact-line">' +
      weaponIcon(item) +
      ' Arme liée : <strong style="color:' +
      rarityInfo(item).color +
      '">' +
      escape(gearDisplayName(item)) +
      '</strong> · ' +
      escape(rarityInfo(item).name) +
      ' niveau ' +
      itemLevel(item) +
      ' · elle grandit avec toi et change de nom tous les 10 niveaux.</p>'
    );
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
    atCamp: hero => atCamp(hero),
    specialLeft,
    setGuestSpecial: v => (guestSpecial = Math.max(0, Number(v) || 0)),
    setClasse,
    decorateSkillBar,
    skillRider,
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
      rage: Math.max(0, Math.round((runtime(hero).rageUntil - now()) * 10) / 10),
      scars: runtime(hero).scars
    })
  });
  Object.assign(window, { renderTalents, canaanUseSpecial: useSpecial });
})();
