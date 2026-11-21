// Barre des effets, à gauche de la mini-carte (comme dans les MMORPG) : en haut les bonus actifs (repas, bénédiction
// d'Ylvarë, talents et sort de classe, postures d'armes, artéfacts), en dessous les malus (étourdissement, malédiction,
// saignement, brûlure), et en bas les passifs permanents (passif de classe, talents équipés, artéfacts équipés).
// Chaque icône montre le temps restant, un voile qui tourne avec la durée et clignote à la fin ; au survol, une
// info-bulle donne le nom, l'effet et le temps restant. Sous la barre d'un boss, ses bonus et les malus qu'on lui
// inflige (drawMonster, appelé par sprite-kit.js). Lecture seule : rien n'est modifié.
(() => {
  'use strict';
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const icon = s => (window.CANAAN_ICONS ? CANAAN_ICONS.html(s) : esc(s));
  const sec = () => time / 60;
  // Un effet : id (unique), icône, nom, texte, type (buff, debuff, passive), secondes restantes (∞ si absent), cumul.
  const E = (id, ic, name, text, kind, left = Infinity, stacks = 0) => ({
    id,
    icon: ic,
    name,
    text,
    kind,
    left,
    stacks
  });

  // ---------------------------------------------------------------- Sources
  function classEffects(hero, out) {
    if (!window.CANAAN_CLASS || !hero.classe || !hero.classe.id || typeof classById !== 'function') return;
    const c = classById(hero.classe.id);
    if (!c) return;
    const t = sec(),
      w = CANAAN_CLASS.runtime(hero),
      on = until => until > t,
      tal = i => c.talents[i] || ['', ''];
    out.push(E('cls-passive', c.icon, c.passive.name, c.passive.desc, 'passive'));
    for (const i of hero.classe.talents) out.push(E('tal-' + i, c.icon, tal(i)[0], tal(i)[1], 'passive'));
    if (w.shield > 0 && on(w.shieldUntil))
      out.push(
        E(
          'cls-shield',
          '🛡',
          'Bouclier',
          'Absorbe encore ' + Math.round(w.shield) + ' dégâts.',
          'buff',
          w.shieldUntil - t
        )
      );
    const timed = [
      ['barkUntil', '🌿', 'druide', 2, 'Dégâts reçus −15 %.'],
      ['faithUntil', '✨', 'paladin', 2, 'Dégâts reçus −20 %.'],
      ['instinctUntil', '🎯', 'assassin', 6, 'Instinct de survie actif.'],
      ['natureAvatarUntil', '🌱', 'druide', 9, 'Dégâts +15 %, régénération renforcée.'],
      ['danceUntil', '💨', 'assassin', 2, 'Vitesse +20 %.']
    ];
    for (const [k, ic, cls, i, text] of timed)
      if (c.id === cls && on(w[k])) out.push(E('cls-' + k, ic, tal(i)[0], text, 'buff', w[k] - t));
    if (on(w.divineUntil))
      out.push(E('cls-divine', '✨', 'Lumière divine', 'Dégâts reçus −20 %.', 'buff', w.divineUntil - t));
    if (on(w.veilUntil))
      out.push(E('cls-veil', '🌑', 'Voile d’ombre', 'Invisible, vitesse +30 %.', 'buff', w.veilUntil - t));
    if (on(w.elemAvatarUntil))
      out.push(
        E(
          'cls-avatar',
          '🌋',
          'Avatar élémentaire',
          'Dégâts +20 %, mana des compétences −30 %.',
          'buff',
          w.elemAvatarUntil - t
        )
      );
    if (on(w.contagionUntil))
      out.push(
        E(
          'cls-contagion',
          '☣',
          'Contagion',
          'Tes invocations frappent 30 % plus vite.',
          'buff',
          w.contagionUntil - t
        )
      );
    // Barde : Hymne de l'Aurore et Mélodie vivifiante reçus, Crescendo.
    if (on(w.hymnUntil))
      out.push(
        E(
          'cls-hymn',
          '🎶',
          'Hymne de l’Aurore',
          'Soigne 3 % des PV max par seconde, dégâts +10 %.',
          'buff',
          w.hymnUntil - t
        )
      );
    if (on(w.vivifyUntil))
      out.push(
        E('cls-vivify', '🎵', 'Mélodie vivifiante', 'Vitesse +10 %, dégâts +5 %.', 'buff', w.vivifyUntil - t)
      );
    if (c.id === 'barde' && on(w.crescendoUntil) && w.crescendo > 0)
      out.push(
        E(
          'cls-crescendo',
          '🎵',
          tal(0)[0],
          'Dégâts +' + 3 * w.crescendo + ' %.',
          'buff',
          w.crescendoUntil - t,
          w.crescendo
        )
      );
    if (hero.player.form === 'feral') out.push(E('cls-feral', '🐆', 'Forme féline', c.special.desc, 'buff'));
  }
  const STANCES = [
    ['guard', '🛡', 'Garde', 'Parade prête : les coups sont bloqués.'],
    ['parryReady', '⚔', 'Riposte prête', 'Ta prochaine Riposte inflige 600 %.'],
    ['berserk', '😡', 'Rage', 'Dégâts +25 %, dégâts reçus +15 %.'],
    ['flurry', '🌀', 'Déchaînement', 'Dégâts +15 %, attaques 30 % plus rapides, dégâts reçus +10 %.'],
    ['combo', '💥', 'Combo', 'L’enchaînement suivant est prêt.'],
    ['shadow', '💨', 'Pas de l’ombre', 'Ton prochain coup fait +60 %.'],
    ['fastBow', '🏹', 'Repli tactique', 'Ton prochain Tir puissant inflige 360 %.'],
    ['shieldGuard', '✨', 'Serment du gardien', 'Dégâts reçus −35 %.'],
    ['focus', '✨', 'Concentration', 'Ta prochaine compétence offensive fait +40 %.']
  ];
  function stanceEffects(out) {
    if (typeof canaanStanceOf !== 'function') return;
    const st = canaanStanceOf() || {};
    for (const [k, ic, name, text] of STANCES)
      if (st[k] > 0) out.push(E('st-' + k, ic, name, text, 'buff', st[k]));
    if ((st.arcane | 0) > 0)
      out.push(
        E(
          'st-arcane',
          '🔮',
          'Charges arcaniques',
          'La Surcharge libère les charges (3 au maximum).',
          'buff',
          Infinity,
          st.arcane | 0
        )
      );
  }
  function foodEffects(hero, out) {
    if (!window.CANAAN_PROF) return;
    const live = CANAAN_PROF.myLive() || {};
    for (const [key, f, ic] of [
      ['food', live.food, '🍽'],
      ['hot', live.hot, '💚']
    ]) {
      const r = f && CANAAN_PROF.RECIPES[f.recipe];
      if (r)
        out.push(E('food-' + key, ic, r.name, CANAAN_PROF.effect(f.recipe, f.q, hero).text, 'buff', f.left));
    }
  }
  function blessingEffects(hero, out) {
    if (window.CANAAN_CITY && CANAAN_CITY.blessed(hero))
      out.push(
        E(
          'bless',
          '🌳',
          'Bénédiction d’Ylvarë',
          'Dégâts +10 %, 1 % des PV rendus toutes les 3 s.',
          'buff',
          (hero.blessing.until - Date.now()) / 1000
        )
      );
  }
  // Artéfacts de l'Arène équipés (passifs, avec leur effet au rang du héros) et leurs effets passagers.
  function artefactEffects(hero, out) {
    if (!window.CANAAN_ARTEFACTS) return;
    for (const id of CANAAN_ARTEFACTS.equipped(hero)) {
      const a = id && CANAAN_ARTEFACTS.get(id);
      if (a)
        out.push(E('art-' + id, a.icon, a.name, artefactText(a, CANAAN_ARTEFACTS.rank(id, hero)), 'passive'));
    }
    for (const a of CANAAN_ARTEFACTS.auras(hero))
      out.push(E('arta-' + a.id, a.icon, a.name, a.text, 'buff', a.left));
  }
  function debuffs(out) {
    if (game.mode !== 'guest' && typeof playerStun === 'number' && playerStun > 0)
      out.push(E('stun', '💫', 'Étourdi', 'Impossible de bouger.', 'debuff', playerStun));
    const a = window.CANAAN_ARENA && CANAAN_ARENA.effects ? CANAAN_ARENA.effects() : null;
    if (!a) return;
    if (a.curse > 0) out.push(E('ar-curse', '☠', 'Malédiction', 'Soins reçus −60 %.', 'debuff', a.curse));
    a.dots.forEach(([kind, left], i) => {
      if (kind !== 'curse')
        out.push(
          E(
            'ar-' + kind + i,
            kind === 'bleed' ? '🩸' : '🔥',
            kind === 'bleed' ? 'Saignement' : 'Brûlure',
            'Dégâts sur la durée.',
            'debuff',
            left
          )
        );
    });
  }
  // Tous les effets du héros de cette application.
  function list(hero = game.hero) {
    const out = [];
    if (!hero || !hero.player) return out;
    for (const f of [
      () => blessingEffects(hero, out),
      () => foodEffects(hero, out),
      () => classEffects(hero, out),
      () => stanceEffects(out),
      () => artefactEffects(hero, out),
      () => debuffs(out)
    ])
      try {
        f();
      } catch (e) {
        // Une source absente (tests, invité) ne bloque pas les autres.
      }
    return out.filter(e => e.left > 0);
  }

  // ---------------------------------------------------------------- Affichage
  const fmt = s =>
    !Number.isFinite(s)
      ? ''
      : s < 60
        ? Math.ceil(s) + ' s'
        : s < 3600
          ? Math.ceil(s / 60) + ' min'
          : Math.ceil(s / 3600) + ' h';
  const longest = new Map();
  let bar = null,
    tip = null,
    hover = null,
    lastKey = '';
  function mount() {
    if (bar || typeof document === 'undefined' || !document.body) return;
    bar = document.createElement('div');
    bar.id = 'buffbar';
    bar.setAttribute('aria-label', 'Effets actifs');
    bar.innerHTML =
      '<div class="buff-row buffs"></div><div class="buff-row debuffs"></div><div class="buff-row passives"></div>';
    tip = document.createElement('div');
    tip.className = 'buff-tip';
    tip.hidden = true;
    document.body.append(bar, tip);
    bar.addEventListener('pointerover', e => {
      const el = e.target.closest('.buff');
      hover = el ? el.dataset.id : null;
      showTip(el);
    });
    bar.addEventListener('pointerleave', () => {
      hover = null;
      tip.hidden = true;
    });
  }
  let current = [];
  function showTip(el) {
    const fx = el && current.find(e => e.id === el.dataset.id);
    if (!fx) return void (tip.hidden = true);
    const kind = { buff: 'Bonus', debuff: 'Malus', passive: 'Passif' }[fx.kind];
    tip.innerHTML =
      '<b class="' +
      fx.kind +
      '">' +
      icon(fx.icon) +
      ' ' +
      esc(fx.name) +
      '</b><span class="buff-kind">' +
      kind +
      (fx.stacks ? ' · ' + fx.stacks + ' charge' + (fx.stacks > 1 ? 's' : '') : '') +
      '</span><p>' +
      icon(esc(fx.text)) +
      '</p>' +
      (Number.isFinite(fx.left) ? '<span class="buff-left">Reste ' + fmt(fx.left) + '</span>' : '');
    const r = el.getBoundingClientRect();
    tip.hidden = false;
    tip.style.top = Math.round(r.bottom + 6) + 'px';
    tip.style.left =
      Math.round(
        Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2))
      ) + 'px';
  }
  // Collée à gauche de la mini-carte (ou à droite si la carte a été déplacée sur la gauche de l'écran).
  function place() {
    const mm = document.getElementById('minimap');
    if (!mm) return;
    const r = mm.getBoundingClientRect();
    if (!r.width) return;
    // Sous les boutons du haut (pause, placement, paramètres) s'ils passent au-dessus.
    let top = r.top;
    for (const id of ['layoutTools', 'pauseButton']) {
      const b = document.getElementById(id),
        br = b && b.getBoundingClientRect();
      if (br && br.width && br.right > r.left - 440 && br.left < r.right + 440 && br.top < r.top + 60)
        top = Math.max(top, br.bottom + 8);
    }
    bar.style.top = Math.round(top) + 'px';
    if (r.left > innerWidth / 2) {
      bar.style.left = '';
      bar.style.right = Math.round(innerWidth - r.left + 10) + 'px';
      bar.classList.remove('flip');
    } else {
      bar.style.right = '';
      bar.style.left = Math.round(r.right + 10) + 'px';
      bar.classList.add('flip');
    }
  }
  function cell(fx) {
    const max = Math.max(longest.get(fx.id) || 0, fx.left),
      share = Number.isFinite(fx.left) ? Math.max(0, Math.min(1, 1 - fx.left / max)) : 0;
    longest.set(fx.id, max);
    return (
      '<div class="buff ' +
      fx.kind +
      (Number.isFinite(fx.left) && fx.left < 5 ? ' ending' : '') +
      '" data-id="' +
      fx.id +
      '" style="--spent:' +
      (share * 360).toFixed(0) +
      'deg">' +
      '<span class="buff-icon">' +
      icon(fx.icon) +
      '</span>' +
      (fx.stacks ? '<span class="buff-stacks">' + fx.stacks + '</span>' : '') +
      (Number.isFinite(fx.left) ? '<span class="buff-time">' + fmt(fx.left) + '</span>' : '') +
      '</div>'
    );
  }
  function render() {
    mount();
    if (!bar) return;
    const show = typeof started !== 'undefined' && started;
    bar.hidden = !show;
    if (!show) return void (tip.hidden = true);
    place();
    current = list();
    for (const id of [...longest.keys()]) if (!current.some(e => e.id === id)) longest.delete(id);
    // Une durée rallongée (effet relancé) repart de zéro.
    for (const e of current) if (longest.has(e.id) && e.left > longest.get(e.id) + 0.5) longest.delete(e.id);
    const rows = { buff: [], debuff: [], passive: [] };
    for (const e of current) rows[e.kind].push(e);
    const html = ['buff', 'debuff', 'passive'].map(k => rows[k].map(cell).join(''));
    const key = html.join('|');
    if (key === lastKey) return;
    lastKey = key;
    const [b, d, p] = bar.children;
    b.innerHTML = html[0];
    d.innerHTML = html[1];
    p.innerHTML = html[2];
    if (hover) showTip(bar.querySelector('.buff[data-id="' + hover + '"]'));
  }
  if (typeof setInterval === 'function' && typeof document !== 'undefined') setInterval(render, 250);

  // ---------------------------------------------------------------- Effets d'un boss (sous sa barre de vie)
  // Malus que les héros lui infligent (sorts d'armes, talents de classe, artéfacts) et ses propres bonus (rage, bouclier,
  // parade, invulnérabilité). L'hôte les calcule ; l'invité les reçoit avec le boss (champ fx de l'instantané).
  const MON = {
    stun: ['💫', 'Étourdi', 'debuff'],
    root: ['⛓', 'Immobilisé', 'debuff'],
    slow: ['❄', 'Ralenti', 'debuff'],
    bleed: ['🩸', 'Saignement', 'debuff'],
    poison: ['☠', 'Poison', 'debuff'],
    plague: ['☣', 'Peste', 'debuff'],
    burn: ['🔥', 'Brûlure', 'debuff'],
    thorns: ['🌿', 'Ronces', 'debuff'],
    sap: ['🌱', 'Sève', 'debuff'],
    vulnerable: ['💔', 'Vulnérable', 'debuff'],
    armor: ['🛡', 'Armure brisée', 'debuff'],
    weak: ['⬇', 'Affaibli', 'debuff'],
    mark: ['🎯', 'Marqué', 'debuff'],
    enraged: ['😡', 'Rage', 'buff'],
    berserk: ['🔥', 'Frénésie', 'buff'],
    shield: ['🛡', 'Bouclier', 'buff'],
    parry: ['🤺', 'Parade', 'buff'],
    immune: ['✨', 'Invulnérable', 'buff']
  };
  const MON_CODES = Object.keys(MON);
  // Effets en cours d'un monstre : liste de [code, secondes restantes] (−1 : sans fin), arrondies au dixième.
  function monsterCodes(m) {
    if (game.mode === 'guest')
      return Array.isArray(m.fx) ? m.fx.filter(f => Array.isArray(f) && MON[f[0]]) : [];
    const t = sec(),
      left = new Map(),
      add = (code, l) => {
        if (l > 0) left.set(code, Math.max(left.get(code) || 0, l));
      };
    for (const k of ['stun', 'root', 'slow', 'bleed', 'vulnerable']) add(k, m['spell_' + k] || 0);
    for (const k of ['armor', 'slow', 'weak', 'mark', 'bleed']) add(k, m['v1746_' + k] || 0);
    for (const d of m._clsDots || []) add(MON[d.kind] ? d.kind : 'poison', d.until - t);
    // Peste de l'Invocateur (charges cumulables).
    for (const p of m._plague || []) add('plague', p.until - t);
    if (m._clsSlow) add('slow', m._clsSlow.until - t);
    // Brûlures et saignements des artéfacts de l'Arène.
    for (const d of m._artDots || []) add(d.kind, d.until - t);
    const run = window.CANAAN_ARENA && CANAAN_ARENA.run ? CANAAN_ARENA.run() : null;
    if (run && m.arenaBoss) {
      const c = run.clock || 0;
      add('stun', (m.stunUntil || 0) - c);
      add('parry', (m.parryUntil || 0) - c);
      add('immune', (m.immuneUntil || 0) - c);
    }
    if (m.shieldHp > 0) add('shield', Infinity);
    if (m.enraged) add('enraged', Infinity);
    if (m.berserk) add('berserk', Infinity);
    if (m.bossShield) add('immune', Infinity);
    return [...left]
      .map(([code, l]) => [code, Number.isFinite(l) ? Math.round(l * 10) / 10 : -1])
      .sort((a, b) => MON_CODES.indexOf(a[0]) - MON_CODES.indexOf(b[0]));
  }
  // Rangée d'icônes sous la barre de boss : bonus (cadre vert) puis malus (cadre rouge), temps restant dessous.
  function drawMonster(c, m, x, y, w) {
    const codes = monsterCodes(m);
    if (!codes.length) return 0;
    const S = 24,
      gap = 6,
      list = [...codes.filter(f => MON[f[0]][2] === 'buff'), ...codes.filter(f => MON[f[0]][2] !== 'buff')],
      fit = Math.max(1, Math.floor((w + gap) / (S + gap)));
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    list.slice(0, fit).forEach(([code, l], i) => {
      const [ic, , kind] = MON[code],
        bx = x + i * (S + gap),
        ending = l >= 0 && l < 3;
      c.globalAlpha = ending ? 0.55 + 0.45 * Math.abs(Math.sin(time * 0.15)) : 1;
      c.fillStyle = kind === 'buff' ? '#13241a' : '#2a1012';
      c.fillRect(bx, y, S, S);
      c.strokeStyle = kind === 'buff' ? '#6fd38a' : '#e5484d';
      c.lineWidth = 2;
      c.strokeRect(bx + 1, y + 1, S - 2, S - 2);
      c.font = '15px system-ui,sans-serif';
      c.fillStyle = '#ffffff';
      c.fillText(ic, bx + S / 2, y + S / 2 + 1);
      if (l >= 0) {
        c.font = 'bold 10px system-ui,sans-serif';
        c.lineWidth = 3;
        c.strokeStyle = '#000000';
        const txt = l < 10 ? l.toFixed(1) : String(Math.ceil(l));
        c.strokeText(txt, bx + S / 2, y + S + 7);
        c.fillStyle = kind === 'buff' ? '#c8f8d0' : '#ffc0b0';
        c.fillText(txt, bx + S / 2, y + S + 7);
      }
    });
    c.restore();
    return S + 14;
  }
  window.CANAAN_BUFF_BAR = Object.freeze({ list, render, MON, monsterCodes, drawMonster });
})();
