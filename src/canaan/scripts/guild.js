// Guilde des Aventuriers de l'Aurore (shared/data/guild.js, règles dans shared/rules/quests.js) : la maison de guilde du
// Camp de l'Aurore, la maîtresse de guilde, le tableau des contrats, le rang et la renommée du héros, et leur place
// dans l'affichage tête haute.
// - Le tableau de chaque héros (trois contrats de son rang) change tous les quarts d'heure ; c'est l'hôte qui le tire
//   (refreshBoard) et l'envoie à l'invité avec son état de quêtes (hero.quetes.guild).
// - Prendre, abandonner ou rendre un contrat passe par CANAAN_QUESTS (take, abandon, turnIn) ; l'invité le demande à
//   l'hôte (quest-take, quest-abandon, quest-turnin).
(() => {
  'use strict';
  const T = TS;
  const guest = () => game.mode === 'guest';
  const esc = s =>
    String(s).replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const guildOf = hero => CANAAN_QUESTS.state(hero).guild;
  const rankOf = hero => GUILD_RANKS[guildRankIndex(guildOf(hero).fame)];
  const master = () => CANAAN_QUESTS.npcs().guilde;

  // Maîtresse de guilde à portée (jamais en instance ni sous terre).
  function near(hero = game.hero) {
    const m = master(),
      p = hero.player;
    return !!m && !game.world.instance && !canaanUnder() && Math.hypot(p.x - m.x, p.y - m.y) < 2.6 * T;
  }
  // Porte de la maison de guilde, sur l'île (pour le suivi des quêtes).
  function door() {
    const b = CANAAN_HOUSE.buildings().find(b => b.id === 'guilde');
    return b ? { x: b.door.x, y: b.door.y + 0.4 * T } : null;
  }

  // ---------------------------------------------------------------- Tableaux (hôte)
  // Chaque seconde, l'hôte met à jour le tableau de chaque héros (nouveau quart d'heure, nouveau rang).
  setInterval(() => {
    if (!started || guest()) return;
    const now = Date.now();
    for (const hero of game.heroes) {
      if (refreshBoard(CANAAN_QUESTS.state(hero), hero.level, now)) window.CANAAN_PERSISTENCE.requestSave();
    }
  }, 1000);

  // ---------------------------------------------------------------- Rang et renommée
  const pct = (a, b) => Math.max(0, Math.min(100, (100 * a) / Math.max(1, b)));
  // Badge du rang (lettre dans un écu à la couleur du rang).
  const badge = (rank, big = false) =>
    '<b class="guild-badge' + (big ? ' big' : '') + '" style="--rank:' + rank.color + '">' + rank.id + '</b>';
  // Avancement vers le rang suivant.
  function fameLine(hero) {
    const g = guildOf(hero),
      i = guildRankIndex(g.fame),
      rank = GUILD_RANKS[i],
      next = GUILD_RANKS[i + 1];
    return (
      '<div class="guild-fame">' +
      badge(rank, true) +
      '<div><b>' +
      esc('Rang ' + rank.id + ' · ' + rank.title) +
      '</b><small>' +
      esc('Contrats ' + rank.tier.toLowerCase()) +
      ' · ' +
      esc(tt('{n} contrats remplis', { n: g.count })) +
      '</small>' +
      (next
        ? '<div class="bar guild"><i style="width:' +
          pct(g.fame - rank.fame, next.fame - rank.fame) +
          '%"></i><span>' +
          esc(tt('Renommée {n} / {max}', { n: g.fame, max: next.fame })) +
          '</span></div><small>' +
          esc('Prochain rang : ' + next.id + ' · ' + next.title) +
          '</small>'
        : '<div class="bar guild full"><i></i><span>' +
          esc(tt('Renommée {n}', { n: g.fame })) +
          '</span></div><small>' +
          esc('Rang le plus haut : ton nom est gravé au mur de la guilde.') +
          '</small>') +
      '</div></div>'
    );
  }
  // Échelle des rangs.
  function ladder(hero) {
    const i = guildRankIndex(guildOf(hero).fame);
    return (
      '<ol class="guild-ladder">' +
      GUILD_RANKS.map(
        (r, k) =>
          '<li class="' +
          (k < i ? 'done' : k === i ? 'current' : '') +
          '">' +
          badge(r) +
          '<span>' +
          esc(r.title) +
          '</span><small>' +
          esc(r.tier) +
          '</small></li>'
      ).join('') +
      '</ol>'
    );
  }
  // Résumé pour le journal (onglet Guilde).
  function summary(hero) {
    return (
      '<div class="quest-card guild-summary"><b>🛡️ ' +
      esc(GUILD_NAME) +
      '</b>' +
      fameLine(hero) +
      ladder(hero) +
      '<p class="quest-note">' +
      esc(
        GUILD_MASTER +
          ' affiche trois contrats de ton rang dans la maison de guilde du Camp de l’Aurore. Ils changent tous les quarts d’heure.'
      ) +
      '</p></div>'
    );
  }

  // ---------------------------------------------------------------- Fenêtre de la guilde
  const isOpen = () => modalOpen() && !!document.querySelector('#window .guild-panel');
  let shown = '',
    // Abandon demandé : un second clic le confirme.
    confirmAbandon = 0;
  const clock = ms => {
    const s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  const signature = () => JSON.stringify([CANAAN_QUESTS.state(game.hero), near(), confirmAbandon]);
  // Redessine la fenêtre si elle est ouverte.
  function render() {
    if (isOpen()) draw();
  }
  function draw() {
    shown = signature();
    const hero = game.hero,
      st = CANAAN_QUESTS.state(hero),
      g = st.guild,
      current = activeContract(st),
      board = g.board.map(id => questById(id)).filter(Boolean),
      card = CANAAN_QUESTS.card;
    let active = '';
    if (current) {
      const ready = questReady(st, current),
        here = current.npc === 'guilde';
      active =
        '<h3 class="quest-chapter">📜 Contrat en cours</h3>' +
        card(current, st) +
        '<div class="quest-buttons">' +
        (ready && here
          ? '<button data-action="guildTurnIn" data-quest="' + current.id + '">🏆 Rendre le contrat</button>'
          : '') +
        (ready && !here
          ? '<p class="quest-note">' +
            esc('Va voir ' + QUEST_NPCS[current.npc].name + ' pour rendre ce contrat.') +
            '</p>'
          : '') +
        (!ready
          ? '<button class="guild-abandon" data-action="guildAbandon" data-quest="' +
            current.id +
            '">' +
            (confirmAbandon === current.id ? '⚠️ Confirmer l’abandon' : 'Abandonner') +
            '</button>'
          : '') +
        '</div>';
    }
    const slots = board.length
      ? board
          .map(q => {
            const taken = g.taken.includes(q.id),
              doing = st.active[q.id];
            return (
              '<div class="guild-contract' +
              (taken ? ' taken' : '') +
              '">' +
              card(q, st) +
              '<div class="quest-buttons">' +
              (doing
                ? '<span class="quest-note">📍 En cours</span>'
                : taken
                  ? '<span class="quest-note">✓ Déjà pris sur ce tableau</span>'
                  : '<button data-action="guildTake" data-quest="' +
                    q.id +
                    '"' +
                    (current ? ' disabled title="Un seul contrat à la fois"' : '') +
                    '>Prendre le contrat</button>') +
              '</div></div>'
            );
          })
          .join('')
      : '<p class="quest-note">Le tableau se remplit… reviens dans un instant.</p>';
    modernPanel(
      '<div class="guild-panel quest-journal panel-fill" data-panel-size="md">' +
        canaanHead('🛡️ ' + GUILD_NAME) +
        '<div class="quest-body panel-scroll" data-keep-scroll="guild">' +
        '<p class="quest-text">« ' +
        esc(
          current
            ? questReady(st, current)
              ? 'Beau travail. Les nouvelles vont vite, ici : tout le camp parle déjà de toi.'
              : 'Un contrat à la fois, c’est la règle de la maison. Termine celui-ci, ou rends-le-moi si c’est trop.'
            : g.count
              ? 'Te revoilà ! Le tableau a de quoi t’occuper. Choisis bien : la renommée se gagne contrat après contrat.'
              : 'Bienvenue à la guilde. Ici, les habitants de l’île déposent leurs demandes, et nous les confions à ceux qui en sont capables. Commence par un contrat simple : tout le monde débute au rang F.'
        ) +
        ' »</p>' +
        fameLine(hero) +
        active +
        '<h3 class="quest-chapter">📋 Tableau des contrats <small>· ' +
        '<span id="guildClock">' +
        esc(tt('nouveaux contrats dans {temps}', { temps: clock(guildRefreshIn(Date.now())) })) +
        '</span></small></h3>' +
        slots +
        '<h3 class="quest-chapter">👑 Rangs de la guilde</h3>' +
        ladder(hero) +
        '</div></div>'
    );
  }
  function open() {
    confirmAbandon = 0;
    CANAAN_SOUND.voice(GUILD_MASTER, 'Bienvenue à la guilde !');
    draw();
  }
  // Compte à rebours et changements d'état (tableau neuf, contrat avancé) pendant que la fenêtre est ouverte.
  setInterval(() => {
    if (!started || !isOpen()) return;
    if (signature() !== shown) return render();
    const el = document.getElementById('guildClock');
    if (el)
      el.textContent = tt('nouveaux contrats dans {temps}', { temps: clock(guildRefreshIn(Date.now())) });
  }, 500);
  const act = (op, id, local) => {
    if (guest()) CANAAN_NET.requestAction({ op, q: id });
    else local(game.hero, id);
    render();
  };
  window.guildTake = id => {
    confirmAbandon = 0;
    act('quest-take', id, CANAAN_QUESTS.take);
  };
  window.guildAbandon = id => {
    if (confirmAbandon !== id) {
      confirmAbandon = id;
      return render();
    }
    confirmAbandon = 0;
    act('quest-abandon', id, CANAAN_QUESTS.abandon);
  };
  window.guildTurnIn = id => {
    confirmAbandon = 0;
    act('quest-turnin', id, CANAAN_QUESTS.turnIn);
  };

  // ---------------------------------------------------------------- Affichage tête haute
  // Rang et titre sous le nom du héros (et le contrat prêt à rendre).
  const hudEl = document.getElementById('pguild');
  let hudShown = '';
  setInterval(() => {
    if (!started || !hudEl) return;
    const rank = rankOf(game.hero),
      html =
        '<b class="guild-badge" style="--rank:' +
        rank.color +
        '">' +
        rank.id +
        '</b><span>' +
        esc(rank.title) +
        '</span>';
    if (html !== hudShown) {
      hudShown = html;
      hudEl.innerHTML = html;
      hudEl.title = 'Rang de guilde ' + rank.id + ' · ' + rank.title;
    }
  }, 500);

  window.CANAAN_GUILD = Object.freeze({ near, door, open, render, isOpen, summary, rankOf });
})();
