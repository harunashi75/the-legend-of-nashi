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
        (r = { lastCombat: -1e9, shield: 0, prismReady: 0, crownReady: 0, voidUntil: 0, regenClock: 0 })
      );
    return r;
  }
  function inCombat(hero = game.hero) {
    return now() - rt(hero).lastCombat < 5 || CANAAN_ARENA.fighting();
  }
  // Dégâts secondaires (brûlure, saignement, éclair, riposte) : ils ne redéclenchent aucun effet.
  function secondary(m, amount, hero) {
    if (!m || m.hp <= 0) return 0;
    return window.CANAAN_COMBAT.rawAttack(m, Math.max(1, Math.round(amount)), hero) || 0;
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
    if ((v = worn(hero, 'voile_neant')) && now() < r.voidUntil) mult *= 1 + v.m / 100;
    return damage * mult;
  }
  function attackAfter(m, done, options = {}, hero = game.hero) {
    rt(hero).lastCombat = now();
    if (!m || !(done > 0)) return;
    let v;
    if ((v = worn(hero, 'croc_ombres')) && m._lastCrit && m.hp > 0) dot(m, 'bleed', (done * v.m) / 100, hero);
    if ((v = worn(hero, 'ecaille_ecarlate')) && m.hp > 0) dot(m, 'burn', (done * v.n) / 100, hero);
    if ((v = worn(hero, 'oeil_tempetes')) && Math.random() < v.n / 100) {
      const bolt = (done * v.m) / 100,
        others = game.world.monsters
          .filter(o => o !== m && o.hp > 0 && Math.hypot(o.x - m.x, o.y - m.y) < 4 * TS)
          .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
          .slice(0, 2);
      for (const o of [m, ...others]) {
        secondary(o, bolt, hero);
        burst(o.x, o.y - 20, '#bfe8ff', 8);
      }
      float(m.x, m.y - 70, '⚡', '#bfe8ff');
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
  function onDodge(hero = game.hero) {
    if (worn(hero, 'voile_neant')) rt(hero).voidUntil = now() + 3;
  }
  // Soins reçus (Fiole des Brumes) ; target : le héros soigné.
  function healFactor(periodic, target = game.hero) {
    const v = worn(target, 'fiole_brumes');
    return v ? 1 + v.n / 100 : 1;
  }
  // Coup direct reçu, après la Défense, les armes et les talents : parade, réduction, bouclier.
  function defense(source, damage, options = {}, hero = game.hero) {
    const r = rt(hero),
      p = hero.player;
    r.lastCombat = now();
    if (!(damage > 0)) return damage;
    let v,
      d = damage;
    if ((v = worn(hero, 'ecu_dechu')) && Math.random() < v.n / 100) {
      float(p.x, p.y - 56, '🛡️ PARADE', '#a4caff');
      if (source && source.hp > 0 && Number.isFinite(source.mhp))
        secondary(source, (characterStats(hero).attack * v.m) / 100, hero);
      return 0;
    }
    if ((v = worn(hero, 'coeur_fer'))) d *= 1 - v.n / 100;
    if (r.shield > 0) {
      const absorbed = Math.min(r.shield, d);
      r.shield -= absorbed;
      d -= absorbed;
      if (absorbed > 0) float(p.x, p.y - 48, '💎 −' + Math.round(absorbed), '#e8c8ff');
    }
    return Math.max(0, d);
  }
  // Juste avant la perte de PV : Couronne du Souverain contre un coup fatal.
  function beforeHurt(n, source, hero = game.hero) {
    const p = hero.player,
      r = rt(hero);
    if (p.hp - n > 0 || !worn(hero, 'couronne_souverain') || now() < r.crownReady) return n;
    r.crownReady = now() + 90;
    p.hp = Math.max(1, Math.round(p.mhp * 0.2));
    canaanAchieve(hero, 'phoenix');
    float(p.x, p.y - 64, '👑 SOUVERAIN', '#ffe08a');
    burst(p.x, p.y, '#ffd36d', 28);
    return 0;
  }
  // Nouvelle vague de l'Arène : le bouclier du Prisme se recharge.
  function newCombat(hero = game.hero) {
    rt(hero).prismReady = 0;
  }
  // Effets passagers en cours (barre des effets) : bouclier, élan du Néant, recharge de la Couronne.
  function auras(hero = game.hero) {
    const r = rt(hero),
      t = now(),
      out = [],
      add = (id, left, text) => {
        const a = BY_ID.get(id);
        if (left > 0) out.push({ id, icon: a.icon, name: a.name, text, left });
      };
    if (r.shield > 0 && worn(hero, 'prisme_cristal'))
      add(
        'prisme_cristal',
        Math.max(0.1, r.prismReady - t),
        'Bouclier : absorbe ' + Math.round(r.shield) + ' dégâts.'
      );
    const v = worn(hero, 'voile_neant');
    if (v) add('voile_neant', r.voidUntil - t, 'Dégâts +' + v.m + ' %.');
    if (worn(hero, 'couronne_souverain'))
      add('couronne_souverain', r.crownReady - t, 'Protection contre un coup fatal en recharge.');
    return out;
  }

  // ---------------------------------------------------------------- Étape de simulation
  // Pour chaque héros : bouclier du Prisme, régénération de la Fiole, brûlures et saignements qu'il a posés.
  window.CanaanStages.artefacts = {
    after() {
      for (const hero of game.heroes) stepHero(hero);
    }
  };
  function stepHero(hero) {
    const p = hero.player,
      r = rt(hero),
      t = now(),
      dt = 1 / 60;
    if (p.dead) return;
    let v;
    if ((v = worn(hero, 'prisme_cristal')) && t >= r.prismReady) {
      r.prismReady = t + 20;
      r.shield = (p.mhp * v.n) / 100;
      if (inCombat(hero)) float(p.x, p.y - 58, '💎 Bouclier', '#e8c8ff');
    } else if (!worn(hero, 'prisme_cristal')) r.shield = 0;
    if (
      (v = worn(hero, 'fiole_brumes')) &&
      !inCombat(hero) &&
      p.hp < p.mhp &&
      (r.regenClock += dt) >= 1 - 1e-9
    ) {
      r.regenClock = 0;
      p.hp = Math.min(p.mhp, p.hp + (p.mhp * v.m) / 100);
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
