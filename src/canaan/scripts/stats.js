// Statistiques des héros et des équipements (shared/data/stats.js, shared/rules/stats.js) : chaque équipement
// classique donne Attaque, Défense et Vitalité (selon son niveau, sa qualité et son emplacement) et deux
// statistiques secondaires tirées au hasard à sa création. Les points sont convertis en effets réels selon le
// niveau du héros. Coups donnés et reçus, info-bulles, comparaison et fiche du personnage (touche C).
(() => {
  'use strict';
  // Prépare un objet : niveau valide, et ses deux secondaires tirées une seule fois (enregistrées sur l'objet).
  function prepare(it) {
    if (!it || !it.slot) return it;
    it.level = itemLevel(it);
    if (SLOT_PROFILE[it.slot]) {
      if (!validSecondaries(it.sec)) it.sec = rollSecondaries(it.level, it.rarity, Math.random);
    } else delete it.sec;
    return it;
  }
  window.CANAAN_STATS_PREPARE = prepare;
  const heroLevel = (hero = game.hero) => clampLevel(hero?.level);
  // Statistiques d'un objet : principales (calculées) et secondaires (enregistrées).
  function itemStatsOf(it) {
    prepare(it);
    return itemStats(it);
  }
  // Statistiques d'un héros (l'hôte par défaut) : son niveau et ses pièces actives, puis le passif d'artéfact,
  // ses talents de classe et ses Rubis.
  function characterStats(hero = game.hero) {
    const gear = hero.equipment,
      pieces = Object.values(gear).filter(item => item && item.slot !== 'artifact' && item !== gear.weapon2);
    for (const item of pieces) prepare(item);
    const result = heroStats(heroLevel(hero), pieces, CANAAN_BASE_MANA);
    window.CANAAN_ARTIFACT_STATS(result, hero);
    window.CANAAN_CLASS_STATS(result, hero);
    CANAAN_RUBIS.stats(result, hero);
    // Cœurs d'Aurore (gardiens vaincus, coquillages chantants) : PV max (shared/rules/quests.js).
    if (hero.quetes?.flags) result.maxHp = Math.round(result.maxHp * (1 + heartBonus(hero.quetes)));
    return result;
  }
  // Coup d'un héros (l'hôte par défaut) : Puissance, écart de niveau, critique ; Rubis Briseur et Précision.
  function heroStrike(m, d, hero = game.hero) {
    if (!m || m.hp <= 0) return;
    canaanMobLevel(m);
    const st = characterStats(hero),
      blow = resolveOutgoing(
        d,
        st,
        m,
        Math.random,
        CANAAN_RUBIS.armorFactor(hero),
        CANAAN_RUBIS.critFactor(hero)
      );
    m._lastCrit = blow.crit;
    canaanAchieve(hero, 'hit', m, blow.damage, blow.crit);
    if (blow.crit) float(m.x, m.y - 44, 'CRITIQUE !', '#ffdf77');
    return damageMonster(m, blow.damage, hero);
  }
  // Applique des dégâts à un monstre : boucliers de l'Arène, chiffres, mort, or au sol et victime du héros.
  function damageMonster(m, value, hero = game.hero) {
    if (!m || m.hp <= 0) return 0;
    // Boss de l'Arène : bouclier de cristal, parade et contre-attaque.
    if (m.arenaBoss || m.arenaClone) value = CANAAN_ARENA.onBossHurt(m, value);
    // Boss de donjon protégé par ses cristaux de garde (boss-mechanics.js).
    if (m.bossShield) {
      if (Math.random() < 0.2) float(m.x, m.y - 60, 'IMMUNISÉ', '#d8d0c0');
      return 0;
    }
    if (value <= 0) return 0;
    const before = m.hp;
    m.hp -= value;
    float(m.x, m.y - 20, value, '#ff5c5c');
    burst(m.x, m.y, '#ff5c5c', 8);
    if (m.hp <= 0) {
      recordKill(m, hero);
      hero.kills++;
      chat('Système', m.t + ' vaincu ! Ramasse le butin.');
      burst(m.x, m.y, '#ffd54a', 24);
      const goldFactor = CANAAN_RUBIS.goldFactor(hero);
      if (m.g > 0)
        game.world.drops.push({ x: m.x, y: m.y, t: 'or', v: Math.round(m.g * goldFactor), life: 600 });
      const idx = game.world.monsters.indexOf(m);
      if (idx >= 0) game.world.monsters.splice(idx, 1);
    }
    return Math.max(0, before - Math.max(0, m.hp));
  }
  window.CANAAN_STATS_ATTACK = heroStrike;
  window.canaanHeroStrike = heroStrike;
  window.canaanDamageMonster = damageMonster;
  // Taille du groupe dans un donjon ou un raid (fixée à l'entrée, 1 à 4 héros) : PV et dégâts des ennemis selon
  // la même table que l'Arène (ARENA_GROUP). Hors instance et dans l'Arène (qui a sa propre règle) : ×1.
  const SOLO = Object.freeze({ hp: 1, dmg: 1 });
  function groupScale() {
    const inst = game.world?.instance;
    if (!inst || inst.arena || typeof ARENA_GROUP === 'undefined') return SOLO;
    return ARENA_GROUP[Math.max(1, Math.min(4, inst.group | 0 || 1))] || SOLO;
  }
  window.canaanGroupScale = groupScale;
  // Dégâts bruts d'un ennemi selon son niveau (boss : selon leur type), avec la difficulté de l'instance et la
  // taille du groupe.
  const INSTANCE_DAMAGE = 1.5;
  function enemyRawDamage(m) {
    const level = canaanMobLevel(m),
      raw =
        m.boss || m.worldBoss
          ? bossDamage(level, m.worldBoss ? 'world' : bossTier(m).raid ? 'raid' : 'dungeon')
          : mobDamage(level);
    // Donjons et raids : monstres 50 % plus forts que dehors ; un boss enragé (boss-mechanics.js) frappe 25 % plus fort.
    const inst = game.world?.instance && !game.world.instance.arena ? INSTANCE_DAMAGE : 1;
    return (
      raw *
      inst *
      (m.enraged ? 1.25 : 1) *
      (m.berserk ? 1.8 : 1) *
      (instanceDifficulty()?.damage || 1) *
      canaanGroupScale().dmg
    );
  }
  window.CANAAN_ENEMY_RAW_DAMAGE = enemyRawDamage;
  // Dégâts reçus par un héros (l'hôte par défaut) : Défense (contre le niveau de l'ennemi), Résistance, déviation
  // et critique ennemi (shared/rules/combat.js) ; une déviation ou un critique subi déclenche ses talents.
  // rawOverride : dégâts bruts imposés par une mécanique (Arène), comptés au niveau du héros.
  window.CANAAN_STATS_INCOMING = function (m, rawOverride = null, hero = game.hero) {
    if (!m) return 0;
    const p = hero.player,
      override = Number.isFinite(rawOverride),
      raw = override ? rawOverride : enemyRawDamage(m),
      blow = mitigateIncoming(
        raw,
        characterStats(hero),
        override ? heroLevel(hero) : canaanMobLevel(m),
        Math.random,
        enemyCritChance(m)
      );
    if (blow.deflected) {
      float(p.x, p.y - 50, 'DÉVIATION', '#87f8f4');
      window.CANAAN_CLASS_ON_DODGE(hero);
    }
    if (blow.crit) {
      float(p.x, p.y - 55, 'CRITIQUE ENNEMI', '#ffb87a');
      window.CANAAN_CLASS_ON_CRIT_TAKEN(hero);
    }
    return blow.damage;
  };
  // Réduction des dégâts reçus d'un héros, en fraction (0 à 1), contre un ennemi du niveau donné : Défense,
  // Résistance et talents. Sert aux dégâts sur la durée de l'Arène, qui ne passent pas par les coups.
  window.canaanDamageTaken = function (hero = game.hero, attackerLevel = heroLevel(hero)) {
    const st = characterStats(hero);
    return (
      (1 - defenseReduction(st.defense, attackerLevel)) *
      (1 - Math.min(90, st.resist) / 100) *
      (1 - Math.min(90, st.guard) / 100)
    );
  };
  // Étape du pipeline : chaque monstre se tourne vers le héros qu'il poursuit. Un héros caché par le Voile
  // d'ombre n'attire plus le regard (seuls les boss le voient encore, et le visent).
  window.CanaanStages.facing = {
    after() {
      if (!started || paused) return;
      for (const m of game.world.monsters) {
        const t = m.targetHero?.player;
        if (m.hp > 0 && t && !t.dead && Math.hypot(t.x - m.x, t.y - m.y) < 430)
          m.facingAngle = Math.atan2(t.y - m.y, t.x - m.x);
      }
    }
  };

  // ---------------------------------------------------------------- Présentation
  const label = key => {
    const s = PRIMARY_STATS[key] || SECONDARY_STATS[key];
    return s ? s.icon + ' ' + s.name : key;
  };
  const lines = st => [...Object.entries(st.primary), ...Object.entries(st.secondary)];
  function gearStat(item) {
    if (!item) return 'Aucun bonus';
    if (item.slot === 'artifact') return window.CANAAN_ARTIFACT_UI.stat(item);
    return (
      lines(itemStatsOf(item))
        .map(([key, value]) => label(key) + ' +' + value)
        .join(' · ') || 'Aucun bonus'
    );
  }
  // Valeur d'un objet pour choisir le meilleur (équipement automatique des alliés) : ses points, secondaires comptés
  // un peu plus.
  function gearScore(item) {
    if (!item) return 0;
    if (item.slot === 'artifact') return itemLevel(item) * 3;
    const st = itemStatsOf(item);
    return (
      Object.values(st.primary).reduce((n, v) => n + v, 0) +
      1.5 * Object.values(st.secondary).reduce((n, v) => n + v, 0)
    );
  }
  function gearComparison(item, worn) {
    if (!item) return '';
    if (item.slot === 'artifact') return window.CANAAN_ARTIFACT_UI.compare(item, worn);
    const next = itemStatsOf(item),
      current = worn ? itemStatsOf(worn) : { primary: {}, secondary: {} },
      value = (st, key) => st.primary[key] || st.secondary[key] || 0;
    const keys = [...PRIMARY_KEYS, ...SECONDARY_KEYS].filter(key => value(next, key) || value(current, key));
    const rows = keys
      .map(key => {
        const previous = value(current, key),
          now = value(next, key),
          difference = now - previous;
        return (
          '<div class="gear-compare-stat"><span>' +
          label(key) +
          '</span><span>' +
          previous +
          ' → ' +
          now +
          '</span><b class="' +
          (difference > 0 ? 'gear-good' : difference < 0 ? 'gear-bad' : 'gear-neutral') +
          '">' +
          (difference > 0 ? '+' : '') +
          difference +
          '</b></div>'
        );
      })
      .join('');
    return (
      '<div class="gear-compare"><div class="gear-compare-head">⚖️ Comparaison des statistiques</div>' +
      rows +
      '</div>'
    );
  }
  // Ligne « Niveau requis » en rouge si le héros n'a pas encore le niveau de l'objet.
  function requirement(item) {
    const level = itemLevel(item),
      ok = level <= heroLevel();
    return '<div class="tooltip-req' + (ok ? '' : ' too-high') + '">Niveau requis : ' + level + '</div>';
  }
  function tooltip(item) {
    if (!item) return '';
    if (item.slot === 'artifact') return window.CANAAN_ARTIFACT_UI.tooltip(item) + requirement(item);
    const rarity = rarityInfo(item),
      st = itemStatsOf(item);
    let html =
      '<div class="tooltip-name" style="color:' +
      rarity.color +
      '">' +
      safeGearText(gearDisplayName(item)) +
      '</div><div class="tooltip-sub">' +
      safeGearText(rarity.name) +
      ' · Niveau ' +
      itemLevel(item) +
      '</div>';
    for (const [key, value] of Object.entries(st.primary))
      html += '<div class="stat-line primary">+' + value + ' ' + label(key) + '</div>';
    const base = validSecondaries(item.sec) ? item.sec : {};
    for (const [key, value] of Object.entries(base))
      html += '<div class="stat-line secondary">+' + value + ' ' + label(key) + '</div>';
    // Enchantement : la troisième secondaire, en violet.
    if (st.enchant)
      html +=
        '<div class="stat-line secondary enchant">✨ +' +
        st.enchant.value +
        ' ' +
        label(st.enchant.stat) +
        ' <small>(enchantement)</small></div>';
    // Arme liée (Relique) : elle suit le niveau du héros et ne le quitte pas.
    if (isBoundItem(item))
      html +=
        '<div class="tooltip-relic">📕 Arme liée à l’Invocateur : elle prend ton niveau et grandit avec toi. Impossible à retirer, vendre ou échanger.</div>';
    return html + requirement(item);
  }
  // Ce que fait une statistique (fiche du personnage).
  const describe = key => (PRIMARY_STATS[key] || SECONDARY_STATS[key])?.desc || '';
  // Fiche du personnage : deux tableaux, statistiques principales et secondaires, en points.
  function table(title, keys, values) {
    return (
      '<table class="stat-table"><thead><tr><th>' +
      title +
      '</th><th>Points</th></tr></thead><tbody>' +
      keys
        .map(
          key =>
            '<tr><td><div class="stat-name">' +
            label(key) +
            '</div><div class="stat-desc">' +
            describe(key) +
            '</div></td><td>' +
            (values[key] || 0) +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table>'
    );
  }
  function panel(st) {
    return (
      '<section class="stats-panel">' +
      table('Statistiques principales', PRIMARY_KEYS, st.primary) +
      table('Statistiques secondaires', SECONDARY_KEYS, st.secondary) +
      '</section>'
    );
  }
  window.CANAAN_STATS_VIEW = Object.freeze({ tooltip, stats: itemStatsOf, label, panel });
  Object.assign(window, { gearStat, gearScore, gearComparison, characterStats, itemStatsOf });
})();
