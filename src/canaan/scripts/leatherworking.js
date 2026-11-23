// Travail du cuir (panneau P, Artisanat) : septième métier, appris auprès d'Oriane à la Ménagerie du Camp de l'Aurore.
// - La chasse donne une peau brute de la qualité de la prise (professions.js), en plus de la viande.
// - Tanner : PROF_TAN_HIDES peaux d'une qualité donnent un cuir tanné de la même qualité.
// - Coudre une selle de monture : une par qualité (Peu commun à Mythique), avec des cuirs de cette qualité ou
//   meilleurs (les moins bons d'abord) et de l'or. La selle rejoint la sellerie du héros (hero.ext.mounts.saddles) et
//   s'équipe dans l'onglet Montures des Collections (V) : elle donne leur vitesse à toutes les montures
//   (MOUNT_SADDLE_SPEED : 40 % sans selle … 100 % avec la selle Mythique).
// - Chaque qualité demande son niveau de métier (PROF_QUALITY_LEVEL) ; tanner et coudre se font à l'établi d'Oriane,
//   en travail minuté (gathering.js : rester immobile). L'hôte décide (actions leather-tan, leather-saddle).
(() => {
  'use strict';
  const QL = PROF_QUALITY_LEVEL;
  const tell = (hero, text) => canaanLootNotice(hero, text);
  const esc = text => safeGearText(text);
  const qualityName = q => GEAR_RARITIES[q]?.name || 'Commun';
  const qualityColor = q => GEAR_RARITIES[q]?.color || '#aeb4c0';
  const levelOf = hero => CANAAN_PROF.profOf(hero).leatherworking.level;
  const count = (hero, id, q) => CANAAN_BAG.count(hero, 'hide', id, q);
  // Cuirs utilisables pour une selle de qualité q : ceux de qualité q ou meilleure.
  const leatherFrom = (hero, q) => {
    let n = 0;
    for (let k = q; k < GEAR_RARITIES.length; k++) n += count(hero, 'cuir', k);
    return n;
  };
  const near = hero => CANAAN_MOUNTS.nearMenagerie(hero.player);
  const bench = () => CANAAN_CAMP_LIFE.menagerie();
  const farText = '🧵 Le travail du cuir se fait à l’établi d’Oriane, à la Ménagerie du Camp de l’Aurore.';
  const levelText = q => '🧵 ' + tt('Travail du cuir niveau {n} requis.', { n: QL[q] });

  // ---------------------------------------------------------------- Hôte : règles
  // Vérifie un tannage (q, n) : texte d'erreur, ou '' si tout va bien.
  function tanCheck(hero, q, n) {
    if (!near(hero)) return farText;
    if (levelOf(hero) < QL[q]) return levelText(q);
    if (count(hero, 'peau', q) < PROF_TAN_HIDES * n)
      return '🧵 ' + tt('Il faut {n} peaux brutes de cette qualité.', { n: PROF_TAN_HIDES * n });
    if (!CANAAN_BAG.room(hero, 'hide', 'cuir', q, n)) return '🎒 Plus de place parmi les matériaux.';
    return '';
  }
  function tan(hero, q, n) {
    const why = tanCheck(hero, q, n);
    if (why) return (tell(hero, why), false);
    CANAAN_BAG.remove(hero, 'hide', 'peau', q, PROF_TAN_HIDES * n);
    CANAAN_BAG.add(hero, 'hide', 'cuir', q, n);
    CANAAN_PROF.gainXp(hero, 'leatherworking', (8 + 6 * q) * n);
    tell(hero, '🧵 ' + tt('{n} cuir(s) tanné(s)', { n }) + ' (' + tt(qualityName(q)) + ')');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function saddleCheck(hero, q) {
    if (!near(hero)) return farText;
    if (CANAAN_MOUNTS.stateOf(hero).saddles.includes(q)) return '🧵 Tu as déjà cette selle.';
    if (levelOf(hero) < QL[q]) return levelText(q);
    if (leatherFrom(hero, q) < PROF_SADDLE_LEATHER[q])
      return (
        '🧵 ' + tt('Il faut {n} cuirs tannés de cette qualité ou meilleurs.', { n: PROF_SADDLE_LEATHER[q] })
      );
    if (hero.player.gold < PROF_SADDLE_GOLD[q])
      return '💰 ' + tt('Il faut {or} or.', { or: PROF_SADDLE_GOLD[q] });
    return '';
  }
  function saddle(hero, q) {
    const why = saddleCheck(hero, q);
    if (why) return (tell(hero, why), false);
    let left = PROF_SADDLE_LEATHER[q];
    for (let k = q; left > 0 && k < GEAR_RARITIES.length; k++) {
      const take = Math.min(left, count(hero, 'cuir', k));
      if (take) CANAAN_BAG.remove(hero, 'hide', 'cuir', k, take);
      left -= take;
    }
    hero.player.gold -= PROF_SADDLE_GOLD[q];
    CANAAN_MOUNTS.addSaddle(hero, q);
    CANAAN_PROF.gainXp(hero, 'leatherworking', 60 + 50 * q);
    tell(
      hero,
      '🐾 ' +
        tt('Selle {qualite} cousue : +{n} % de vitesse en selle (touche V).', {
          qualite: tt(qualityName(q)),
          n: MOUNT_SADDLE_SPEED[q]
        })
    );
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  // Travaux minutés à l'établi : les règles sont vérifiées au début, puis revérifiées à la fin.
  function where() {
    const b = bench();
    return { x: b ? b.x - TS : 0, y: b ? b.y : 0 };
  }
  function startTan(hero, q, count) {
    const n = Math.max(
      1,
      Math.min(20, count | 0, Math.floor(CANAAN_BAG.count(hero, 'hide', 'peau', q) / PROF_TAN_HIDES))
    );
    const why = tanCheck(hero, q, n);
    if (why) return (tell(hero, why), false);
    return CANAAN_GATHER.startWork(hero, 'leather', where(), () => tan(hero, q, n), n);
  }
  function startSaddle(hero, q) {
    const why = saddleCheck(hero, q);
    if (why) return (tell(hero, why), false);
    return CANAAN_GATHER.startWork(hero, 'leather', where(), () => saddle(hero, q), 12);
  }
  function handle(hero, action) {
    if (action.op === 'leather-tan') return startTan(hero, action.quality, action.count);
    if (action.op === 'leather-saddle') return startSaddle(hero, action.quality);
    return false;
  }

  // ---------------------------------------------------------------- Onglet du panneau P
  function tab(h) {
    const hero = game.hero,
      level = levelOf(hero),
      at = near(hero),
      owned = CANAAN_MOUNTS.stateOf(hero).saddles,
      qualities = GEAR_RARITIES.map((_, q) => q).filter(q => q < 6);
    const peaux = qualities.filter(q => count(hero, 'peau', q) > 0 || count(hero, 'cuir', q) > 0);
    let html =
      h.bar('leatherworking') +
      h.status(at, at ? '🧵 À l’établi d’Oriane : tu peux travailler.' : farText) +
      h.tips(
        ['🏹 Gibier chassé → peau', PROF_TAN_HIDES + ' peaux = 1 cuir', '🐾 Selles : vitesse des montures'],
        'Chaque animal chassé donne une peau brute, de la qualité de la prise. Tanne-les en cuir à l’établi d’Oriane, à la Ménagerie du Camp de l’Aurore, puis couds les selles de monture : une par qualité.' +
          ' Une selle s’équipe dans l’onglet Montures (touche V) et donne sa vitesse à toutes tes montures. Chaque qualité demande son niveau de métier. Tanner et coudre prennent quelques secondes : reste immobile.'
      ) +
      '<h3>' +
      esc(tt('Tanner les peaux')) +
      '</h3>';
    html += peaux.length
      ? '<div class="prof-grid">' +
        peaux
          .map(q => {
            const p = count(hero, 'peau', q),
              c = count(hero, 'cuir', q),
              can = p >= PROF_TAN_HIDES && level >= QL[q];
            return (
              '<div class="prof-item"><span style="color:' +
              qualityColor(q) +
              '">' +
              PROF_HIDES.peau.icon +
              ' ' +
              esc(tt(qualityName(q))) +
              '</span><small>' +
              esc(tt('Peaux : {p} · cuirs : {c}', { p, c })) +
              (level < QL[q] ? ' · ' + esc(tt('niv. {n}', { n: QL[q] })) : '') +
              '</small><div class="prof-actions"><button type="button" data-action="leatherTan" data-quality="' +
              q +
              '" data-count="1"' +
              (can ? '' : ' disabled') +
              '>' +
              esc(tt('Tanner')) +
              '</button><button type="button" data-action="leatherTan" data-quality="' +
              q +
              '" data-count="20"' +
              (can && p >= PROF_TAN_HIDES * 2 ? '' : ' disabled') +
              '>' +
              esc(tt('Tout tanner')) +
              '</button></div></div>'
            );
          })
          .join('') +
        '</div>'
      : '<p class="prof-empty">' +
        esc(tt('Aucune peau pour l’instant : chasse le gibier de l’île.')) +
        '</p>';
    html += '<h3>' + esc(tt('Selles de monture')) + '</h3><div class="prof-grid saddles">';
    for (let q = 1; q < 6; q++) {
      const mine = owned.includes(q),
        have = leatherFrom(hero, q),
        can =
          !mine &&
          level >= QL[q] &&
          have >= PROF_SADDLE_LEATHER[q] &&
          hero.player.gold >= PROF_SADDLE_GOLD[q];
      html +=
        '<div class="prof-item"><span style="color:' +
        qualityColor(q) +
        '">⟦saddle⟧ ' +
        esc(tt('Selle {qualite}', { qualite: tt(qualityName(q)) })) +
        '</span><small>' +
        esc(tt('+{n} % de vitesse', { n: MOUNT_SADDLE_SPEED[q] })) +
        ' · ' +
        esc(tt('niv. {n}', { n: QL[q] })) +
        '<br>' +
        esc(
          tt('{c} / {n} cuirs ({qualite} ou mieux)', {
            c: have,
            n: PROF_SADDLE_LEATHER[q],
            qualite: tt(qualityName(q))
          })
        ) +
        ' · ' +
        esc(tt('{or} or', { or: PROF_SADDLE_GOLD[q].toLocaleString('fr-FR') })) +
        '</small>' +
        (mine
          ? '<b>' + esc(tt('✔ Dans ta sellerie')) + '</b>'
          : '<button type="button" data-action="leatherSaddle" data-quality="' +
            q +
            '"' +
            (can ? '' : ' disabled') +
            '>' +
            esc(tt('Coudre')) +
            '</button>') +
        '</div>';
    }
    return html + '</div>';
  }
  const act = action => {
    const done = game.mode === 'guest' ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    CANAAN_PROF.render();
    return done;
  };
  window.CANAAN_LEATHER = Object.freeze({
    tan,
    saddle,
    startTan,
    startSaddle,
    handle,
    tab,
    leatherFrom,
    actions: Object.freeze({
      // La fenêtre se ferme pour laisser voir le travail à l'établi.
      tan(quality, count) {
        closePanels();
        return act({ op: 'leather-tan', quality, count });
      },
      saddle(quality) {
        closePanels();
        return act({ op: 'leather-saddle', quality });
      }
    })
  });
})();
