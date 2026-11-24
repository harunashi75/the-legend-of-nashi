// Armes de classe : chaque classe a la sienne (shared/data/classes.js, weapon), au niveau du héros (summons.js,
// syncPact). Le Grimoire et la Grande hache sont des Reliques ; les armes des autres classes montent de qualité,
// comme les armes artefacts d'un MMO : Commun au départ, Peu commun d'office au niveau 10, puis Rare avec les
// Éclats des profondeurs (boss de donjon), Épique avec les Sceaux des conquérants (boss de raid), Légendaire et
// Mythique avec les Fragments d'Aurore (boss du Jugement de Célestia en héroïque).
// Sauvegardé avec chaque héros : hero.weaponTiers (rang gagné par classe) et hero.essences (essences possédées).
// L'hôte décide : un invité demande l'amélioration (action weapon-upgrade) et reçoit son état avec son sac.
(() => {
  'use strict';
  const KINDS = Object.freeze(Object.keys(WEAPON_ESSENCES));
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const say = (hero, text) =>
    hero === game.hero || typeof canaanLootNotice !== 'function' ? toast(text) : canaanLootNotice(hero, text);
  // Essences possédées, nettoyées : entiers positifs, 9 999 au plus par sorte.
  function cleanEssences(raw) {
    const out = {};
    for (const k of KINDS) {
      const n = Math.floor(Number(raw && typeof raw === 'object' ? raw[k] : 0) || 0);
      if (n > 0) out[k] = Math.min(9999, n);
    }
    return out;
  }
  const essencesOf = hero => (hero.essences = cleanEssences(hero.essences));
  // Ajoute des essences (bundle : { sorte: nombre }) et l'annonce au héros.
  function grant(hero, bundle) {
    const owned = essencesOf(hero),
      parts = [];
    for (const [k, n] of Object.entries(bundle || {})) {
      if (!KINDS.includes(k) || !(n > 0)) continue;
      owned[k] = Math.min(9999, (owned[k] || 0) + n);
      parts.push(WEAPON_ESSENCES[k].icon + ' +' + n + ' ' + tt(WEAPON_ESSENCES[k].name));
    }
    if (parts.length) say(hero, parts.join(' · '));
    return parts.length > 0;
  }
  // Sorte d'instance pour les essences : donjon (Tréfonds compris), raid, ou dernier raid en héroïque ; null ailleurs
  // (Arène, monde).
  function dropKind() {
    const inst = game.world.instance;
    if (!inst || inst.arena) return null;
    const d = instances[inst.index];
    if (!d) return null;
    if (d.raid) return inst.difficulty === 'heroic' && d.difficulties?.heroic ? 'raidHeroic' : 'raid';
    return 'dungeon';
  }
  // Boss d'instance vaincu : chaque héros qui partage la victoire reçoit ses essences.
  function onBossKill(m, heroes) {
    if (!m?.boss || m.worldBoss) return;
    const kind = dropKind();
    if (!kind) return;
    for (const hero of heroes) grant(hero, ESSENCE_DROPS[kind].boss);
  }
  // Coffre final ouvert : essences en plus pour le héros.
  function onClear(hero) {
    const kind = dropKind();
    if (kind) grant(hero, ESSENCE_DROPS[kind].chest);
  }
  // État de l'arme de la classe du héros : qualité, prochaine marche et ce qui manque.
  function status(hero = game.hero) {
    const c = classById(hero.classe?.id);
    if (!c) return null;
    if (c.relic) return { classId: c.id, relic: true, tier: -1, next: null, missing: [] };
    const tier = CANAAN_SUMMONS.tierOf(hero, c.id),
      next = nextWeaponUpgrade(tier),
      missing = [];
    if (next) {
      const have = essencesOf(hero)[next.essence] || 0;
      if (clampLevel(hero.level) < next.level) missing.push(tt('niveau {n}', { n: next.level }));
      if (have < next.count)
        missing.push(
          tt('{n} × {nom}', { n: next.count - have, nom: tt(WEAPON_ESSENCES[next.essence].name) })
        );
      if ((hero.player.gold || 0) < next.gold)
        missing.push(tt('{n} or', { n: next.gold - (hero.player.gold || 0) }));
    }
    return { classId: c.id, relic: false, tier, next, missing };
  }
  // Améliore l'arme de la classe d'un cran (l'hôte décide). Renvoie true si c'est fait.
  function upgrade(hero = game.hero) {
    const st = status(hero);
    if (!st || st.relic || !st.next) return false;
    if (game.world.instance?.arena) {
      say(hero, '🔒 ' + tt('L’équipement se prépare avant d’entrer dans l’Arène.'));
      return false;
    }
    if (CANAAN_ARTEFACTS.inCombat(hero)) {
      say(hero, tt('Impossible d’améliorer ton arme en combat.'));
      return false;
    }
    if (st.missing.length) {
      say(hero, '🔒 ' + tt('Il te manque : {liste}.', { liste: st.missing.join(', ') }));
      return false;
    }
    const owned = essencesOf(hero);
    owned[st.next.essence] -= st.next.count;
    if (owned[st.next.essence] <= 0) delete owned[st.next.essence];
    hero.player.gold -= st.next.gold;
    CANAAN_SUMMONS.tiersOf(hero)[st.classId] = st.next.tier;
    CANAAN_SUMMONS.syncPact(hero);
    if (hero === game.hero) recomputeStats();
    else recomputeHeroStats(hero);
    const p = hero.player,
      color = GEAR_RARITIES[st.next.tier].color;
    burst(p.x, p.y - 20, color, 40);
    CANAAN_SKILLS.fx('ring', p.x, p.y, 0, 90, 0, color, 0.7);
    if (hero === game.hero) CANAAN_SOUND.cue('levelup');
    canaanAchieve(hero, 'weapon-tier', st.next.tier);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Bouton du panneau (T) : un invité demande à l'hôte.
  window.upgradeClassWeapon = function () {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'weapon-upgrade' });
    if (upgrade(game.hero)) renderTalents();
  };
  // Section « Arme de classe » du panneau des talents : qualité, essences, prochaine marche.
  function panelHtml(hero = game.hero) {
    const item = hero.equipment?.weapon,
      st = status(hero);
    if (!st || !isBoundItem(item)) return '';
    const r = rarityInfo(item),
      owned = essencesOf(hero);
    let html =
      '<div class="class-weapon" style="--weapon-color:' +
      r.color +
      '"><div class="class-weapon-head">' +
      weaponIcon(item) +
      '<div><strong style="color:' +
      r.color +
      '">' +
      esc(tt(gearDisplayName(item))) +
      '</strong><small>' +
      esc(tt(r.name)) +
      ' · ' +
      esc(tt('niveau {n}', { n: itemLevel(item) })) +
      '</small></div></div>';
    if (st.relic)
      return (
        html +
        '<p class="class-weapon-note">' +
        esc(tt('Arme Relique : elle grandit avec toi, de Rare au niveau 1 à Légendaire au niveau 60.')) +
        '</p></div>'
      );
    // Échelle des qualités : celles atteintes en couleur, la suivante en pointillé.
    html += '<div class="class-weapon-ladder">';
    GEAR_RARITIES.forEach((q, i) => {
      html +=
        '<span class="rung' +
        (i <= st.tier ? ' done' : i === st.tier + 1 ? ' next' : '') +
        '" style="--rung:' +
        q.color +
        '" title="' +
        esc(tt(q.name)) +
        '">' +
        esc(tt(q.name)) +
        '</span>';
    });
    html += '</div><div class="class-weapon-essences">';
    for (const k of KINDS)
      html +=
        '<span title="' +
        esc(tt(WEAPON_ESSENCES[k].source)) +
        '" style="color:' +
        WEAPON_ESSENCES[k].color +
        '">' +
        WEAPON_ESSENCES[k].icon +
        ' ' +
        (owned[k] || 0) +
        ' <small>' +
        esc(tt(WEAPON_ESSENCES[k].name)) +
        '</small></span>';
    html += '</div>';
    if (!st.next)
      return html + '<p class="class-weapon-note">✨ ' + esc(tt('Qualité maximale atteinte.')) + '</p></div>';
    const n = st.next,
      ready = !st.missing.length;
    html +=
      '<p class="class-weapon-note">' +
      esc(
        tt('Prochaine qualité : {q} · niveau {lv} · {n} × {essence} · {or} or', {
          q: tt(GEAR_RARITIES[n.tier].name),
          lv: n.level,
          n: n.count,
          essence: tt(WEAPON_ESSENCES[n.essence].name),
          or: n.gold
        })
      ) +
      '</p><button class="class-weapon-up" ' +
      (ready ? 'data-action="upgradeClassWeapon"' : 'disabled') +
      '>' +
      (ready
        ? '⬆ ' + esc(tt('Améliorer en {q}', { q: tt(GEAR_RARITIES[n.tier].name) }))
        : '🔒 ' + esc(tt('Il te manque : {liste}.', { liste: st.missing.join(', ') }))) +
      '</button>';
    if (st.tier < 2)
      html +=
        '<p class="class-weapon-hint">' +
        esc(
          tt(
            'Les boss de donjon donnent des Éclats des profondeurs, ceux des raids des Sceaux des conquérants, et ceux du Jugement de Célestia en héroïque des Fragments d’Aurore.'
          )
        ) +
        '</p>';
    return html + '</div>';
  }
  // Sauvegarde : rangs gagnés et essences.
  const exportState = hero => ({ tiers: { ...CANAAN_SUMMONS.tiersOf(hero) }, essences: essencesOf(hero) });
  function importState(hero, raw) {
    const d = raw && typeof raw === 'object' ? raw : {};
    hero.weaponTiers = d.tiers && typeof d.tiers === 'object' ? { ...d.tiers } : {};
    CANAAN_SUMMONS.tiersOf(hero);
    hero.essences = cleanEssences(d.essences);
  }
  window.CANAAN_CLASS_WEAPON = Object.freeze({
    status,
    upgrade,
    grant,
    onBossKill,
    onClear,
    panelHtml,
    essences: essencesOf,
    cleanEssences,
    export: exportState,
    import: importState
  });
})();
