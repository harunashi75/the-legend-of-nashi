// Dialogues des PNJ et journal des quêtes (touche L) : état d'une quête pour un PNJ, répliques, troc, collectionneur,
// cartes de quête, onglets du journal (histoire, secondaires, terminées, trésors, guilde). Les actions du joueur
// passent par quests.js (accepter, rendre, choisir), qui les demande à l'hôte en ligne.
// quests.js appelle CANAAN_QUEST_DIALOGS.create(scène) une fois.
(() => {
  'use strict';
  function create(scene) {
    const {
      SITES,
      NPCS,
      guest,
      esc,
      stateOf,
      tradeAt,
      trade,
      hasLoupe,
      claimShells,
      quest,
      accept,
      whoTo,
      turnIn,
      choose,
      hear,
      errand
    } = scene;
    // État de quests.js relu à chaque usage (variables réassignées ou posées plus tard).
    const LIVE = scene.state;

    // ---------------------------------------------------------------- Dialogues des PNJ
    // Contrat (demande d'habitant) : 'ready', 'active', ou 'idle' quand il n'est pas en cours (il se prend à la guilde).
    function npcState(hero, q) {
      if (!q) return 'none';
      const st = stateOf(hero);
      if (questReady(st, q)) return 'ready';
      if (st.active[q.id]) return 'active';
      if (isContract(q)) return 'idle';
      if (st.done[q.id]) return 'after';
      return canStart(st, q) ? 'offer' : 'locked';
    }
    function rewardLine(q) {
      const level = clampLevel(game.hero.level);
      if (isContract(q)) {
        const rank = contractRank(q),
          first = !stateOf(game.hero).done[q.id],
          r = q.reward,
          special = first && (r.flags || r.jewel || r.recipe || r.fishXp || r.item === 'Légendaire');
        return (
          '+' +
          questXp(q, level) +
          ' XP · +' +
          questGold(q, level) +
          ' or · +' +
          contractFame(q) +
          ' renommée · équipement ' +
          rank.item +
          (special ? ' · la première fois : ' + r.text : '')
        );
      }
      return '+' + questXp(q, level) + ' XP · +' + questGold(q, level) + ' or · ' + q.reward.text;
    }
    // Madame Nacre : la collection de coquillages chantants et ses paliers.
    function talkCollector(npc) {
      const st = stateOf(game.hero),
        due = shellRewardsDue(st),
        n = st.shells.length;
      const body =
        '<p class="quest-text">« ' +
        esc(
          n
            ? due.length
              ? 'Oh ! Ils chantent si fort, tes coquillages ! Montre-les-moi, j’ai quelque chose pour toi.'
              : 'Écoute-les… chacun fredonne un petit bout de la vieille chanson. Il en reste d’autres, j’en suis sûre.'
            : 'Bonjour, voyageur ! Tu n’aurais pas entendu un coquillage chanter, par hasard ?'
        ) +
        ' »</p><p class="quest-note">' +
        esc(SHELL_LORE) +
        '</p><div class="quest-card"><b>🐚 Coquillages chantants : ' +
        n +
        ' / ' +
        SHELLS.length +
        '</b><ul>' +
        SHELL_REWARDS.map(
          (r, i) =>
            '<li class="' +
            (i < st.paid ? 'done' : n >= r.n ? 'current' : '') +
            '">' +
            (i < st.paid ? '✓ ' : n >= r.n ? '➤ ' : '◦ ') +
            r.n +
            ' coquillages · +' +
            r.gold +
            ' or · ' +
            esc(r.text) +
            '</li>'
        ).join('') +
        '</ul><p class="quest-note">Chaque lieu de quête cache un coquillage, un peu à l’écart. De près, ils scintillent.</p></div>';
      CANAAN_SOUND.voice(npc.def.name, body.replace(/<[^>]*>/g, ' '));
      modernPanel(
        '<div class="quest-dialog"><h2>' +
          esc(npc.def.name) +
          '</h2>' +
          body +
          '<div class="quest-buttons">' +
          (due.length ? '<button data-action="questShells">Montrer mes coquillages</button>' : '') +
          '<button data-action="closePanels">Au revoir</button></div></div>'
      );
    }
    // Échange du grand troc proposé par cet habitant (si c'est son tour).
    function tradeHtml(hero, npc) {
      const t = tradeAt(hero, npc.id);
      if (!t) return { body: '', button: '' };
      const held = tradeItem(stateOf(hero));
      return {
        body:
          '<div class="quest-trade">' +
          (held ? '<p class="quest-note">🎁 Tu tiens : ' + esc(held.icon + ' ' + held.name) + '</p>' : '') +
          '<p class="quest-text">« ' +
          esc(t.line) +
          ' »</p></div>',
        button:
          '<button data-action="questTrade" data-npc="' +
          npc.id +
          '">' +
          esc(
            held
              ? 'Donner : ' + held.icon + ' ' + held.name
              : 'Prendre : ' + t.gives.icon + ' ' + t.gives.name
          ) +
          '</button>'
      };
    }
    function talkTo(id) {
      if (NPCS[id].def.collector) return talkCollector(NPCS[id]);
      if (NPCS[id].def.guild) return CANAAN_GUILD.open();
      const npc = NPCS[id],
        q = npc.quest,
        hero = game.hero,
        st = stateOf(hero),
        mode = npcState(hero, q),
        lumi = st.flags.lumi
          ? '<p class="quest-lumi">✨ Lumi tinte doucement près de ' + esc(npc.def.name) + '.</p>'
          : '';
      let body = '',
        buttons = '';
      const task = errand(hero, npc);
      if (task) {
        const { q: tq, step } = task;
        if (step.k === 'talk') {
          body = step.lines.map(t => '<p class="quest-text">« ' + esc(t) + ' »</p>').join('');
          buttons = '<button data-action="questHear" data-quest="' + tq.id + '">Continuer</button>';
        } else {
          body = '<p class="quest-text">« ' + esc(tq.talk.ask) + ' »</p>';
          buttons = tq.choices
            .map(
              (c, i) =>
                '<button data-action="questChoice" data-quest="' +
                tq.id +
                '" data-choice="' +
                i +
                '">' +
                esc(c) +
                '</button>'
            )
            .join('');
        }
      } else if (!q) body = '<p class="quest-text">« Bonjour, voyageur. Le vent tourne, ces temps-ci… »</p>';
      else if (mode === 'idle')
        body =
          '<p class="quest-text">« ' +
          esc(
            st.done[q.id]
              ? q.talk.afterChoice?.[st.choices[q.id]] || q.talk.after
              : q.talk.idle || 'Bonjour, voyageur. J’ai déposé une demande à la guilde du Camp de l’Aurore.'
          ) +
          ' »</p><p class="quest-note">' +
          esc(tt('Demande affichée parfois au tableau de la guilde (rang {rang}).', { rang: q.contract })) +
          '</p>';
      else if (mode === 'locked') {
        const before = missingQuest(st, q);
        body =
          '<p class="quest-text">« Bonjour, voyageur. Le vent tourne, ces temps-ci… »</p><p class="quest-note">Cette partie de l’histoire commence plus tard : termine d’abord « ' +
          esc(before.title) +
          ' » (' +
          esc(QUEST_NPCS[before.npc].name) +
          ').</p>';
      } else if (mode === 'offer') {
        body = q.talk.offer.map(t => '<p class="quest-text">« ' + esc(t) + ' »</p>').join('') + card(q, st);
        buttons = '<button data-action="questAccept" data-quest="' + q.id + '">Accepter la quête</button>';
      } else if (mode === 'active')
        body = '<p class="quest-text">« ' + esc(q.talk.active) + ' »</p>' + card(q, st);
      else if (mode === 'ready') {
        body =
          '<p class="quest-text">« ' +
          esc(q.talk.ready) +
          ' »</p><p class="quest-reward">🏆 ' +
          esc(rewardLine(q)) +
          '</p>';
        buttons =
          '<button data-action="questTurnIn" data-quest="' +
          q.id +
          '">' +
          (isContract(q) ? 'Rendre le contrat' : 'Terminer la quête') +
          '</button>';
      } else
        body =
          '<p class="quest-text">« ' + esc(q.talk.afterChoice?.[st.choices[q.id]] || q.talk.after) + ' »</p>';
      const swap = tradeHtml(hero, npc);
      body += swap.body;
      buttons += swap.button;
      CANAAN_SOUND.voice(npc.def.name, body.replace(/<[^>]*>/g, ' '));
      modernPanel(
        '<div class="quest-dialog"><h2>' +
          esc(npc.def.name) +
          (task
            ? ' <small>· ' + esc(task.q.title) + '</small>'
            : mode === 'offer' || mode === 'active' || mode === 'ready' || mode === 'idle'
              ? ' <small>· ' + esc(q.title) + '</small>'
              : '') +
          '</h2>' +
          body +
          lumi +
          '<div class="quest-buttons">' +
          buttons +
          '<button data-action="closePanels">' +
          (buttons ? 'Plus tard' : 'Au revoir') +
          '</button></div></div>'
      );
    }
    // Avancement d'une étape (« 3 / 8 »), dans son propre élément.
    const countHtml = (s, a) => {
      const p = LIVE.FIELD.progress(s, a);
      return p ? ' <em class="quest-count">' + p[0] + ' / ' + p[1] + '</em>' : '';
    };
    const kindsOf = q => [...new Set(q.steps.map(s => QUEST_KINDS[s.k]).filter(Boolean))];
    const chapterName = c => (c.under ? c.n : 'Chapitre ' + c.n);
    const chapterPlace = c => (c.under ? 'Les Tréfonds' : ZONES[c.zone].name);
    const placeOf = q => (SITES[q.site]?.under ? 'Les Tréfonds' : ZONES[SITES[q.site].zone].name);
    function card(q, st) {
      const a = st.active[q.id],
        chapter = CHAPTERS[q.chapter];
      return (
        '<div class="quest-card' +
        (q.main ? ' main' : '') +
        '"><b>' +
        (q.main
          ? '📖 Histoire · ' + chapterName(chapter)
          : isContract(q)
            ? '🛡️ Contrat de rang ' +
              q.contract +
              ' · ' +
              (q.npc === 'guilde' ? 'Avis de la guilde' : QUEST_NPCS[q.npc].name)
            : '🍃 Quête secondaire') +
        ' — ' +
        esc(q.title) +
        '</b>' +
        '<span class="quest-level">' +
        (q.scaled ? 'À ton niveau' : 'Niveau conseillé ' + q.level) +
        '</span><div class="quest-kinds">' +
        kindsOf(q)
          .map(k => '<i>' + k + '</i>')
          .join('') +
        '</div><p>' +
        esc(q.summary) +
        '</p><ul>' +
        q.steps
          .map((s, i) => {
            const done = st.done[q.id] || (a && a.step > i),
              cur = a && a.step === i;
            return (
              '<li class="' +
              (done ? 'done' : cur ? 'current' : '') +
              '">' +
              (done ? '✓ ' : cur ? '➤ ' : '◦ ') +
              esc(s.text) +
              (cur ? countHtml(s, a) : '') +
              '</li>'
            );
          })
          .join('') +
        (a && a.step >= q.steps.length
          ? '<li class="current">➤ Retourner voir ' + esc(whoTo(q)) + '</li>'
          : '') +
        '</ul><p class="quest-reward">🏆 ' +
        esc(rewardLine(q)) +
        '</p></div>'
      );
    }
    function request(op, extra) {
      if (guest()) return CANAAN_NET.requestAction({ op, ...extra });
      return null;
    }
    window.questAccept = id => {
      closePanels();
      if (request('quest-accept', { q: id }) === null) accept(game.hero, id);
    };
    window.questTurnIn = id => {
      closePanels();
      if (request('quest-turnin', { q: id }) === null) turnIn(game.hero, id);
    };
    window.questChoice = (id, choice) => {
      closePanels();
      if (request('quest-choice', { q: id, choice }) === null) choose(game.hero, id, choice);
    };
    window.questHear = id => {
      closePanels();
      if (request('quest-talk', { q: id }) === null) hear(game.hero, id);
    };
    window.questTrade = npcId => {
      closePanels();
      if (request('quest-trade', { npc: npcId }) === null) trade(game.hero, npcId);
    };
    window.questShells = () => {
      closePanels();
      if (request('quest-shells', {}) === null) claimShells(game.hero);
    };
    window.questTrack = id => {
      const st = stateOf(game.hero);
      st.track = st.track === id ? null : id;
      request('quest-track', { q: st.track || 0 });
      renderJournal(ui.tab);
    };

    // ---------------------------------------------------------------- Journal (touche L)
    const ui = { tab: 'main' };
    window.questTab = tab => renderJournal(tab);
    function toggleJournal() {
      if (!started || paused) return;
      if (modalOpen()) return closePanels();
      renderJournal(ui.tab);
    }
    const discover = q =>
      '<p class="quest-note">➤ À découvrir : parle à ' +
      esc(QUEST_NPCS[q.npc].name) +
      ' (' +
      esc(placeOf(q)) +
      ').</p>';
    function renderJournal(tab = 'main') {
      ui.tab = tab;
      const st = stateOf(game.hero),
        list = q => {
          const a = st.active[q.id];
          return (
            card(q, st) +
            (a
              ? '<button class="quest-track' +
                (st.track === q.id ? ' on' : '') +
                '" data-action="questTrack" data-quest="' +
                q.id +
                '">' +
                (st.track === q.id ? '📍 Suivie' : 'Suivre') +
                '</button>'
              : '')
          );
        };
      let html = '';
      if (tab === 'main') {
        const stars = starCount(st);
        html += '<p class="quest-intro"><b>' + esc(STORY_TITLE) + '</b> — ' + esc(STORY_INTRO) + '</p>';
        html +=
          '<p class="quest-stars">Étoiles du Cœur : ' +
          '★'.repeat(stars) +
          '☆'.repeat(6 - stars) +
          (st.flags.lumi ? ' · ✨ Lumi t’accompagne' : '') +
          '</p>';
        if (st.flags.starmap)
          html +=
            '<div class="quest-map"><b>🗺️ Carte des sanctuaires</b><ul>' +
            SANCTUARIES.map(s => {
              const open = LIVE.qworld.flags['sanct_' + s.id],
                lit = st.flags[s.star];
              return (
                '<li>' +
                (lit ? '★' : open ? '◇' : '·') +
                ' ' +
                '<span>' +
                esc(s.name) +
                '</span> — ' +
                esc(ZONES[s.zone].name) +
                (open
                  ? ' <small>' + (st.flags['visit_' + s.id] ? '(visité)' : '(ouvert)') + '</small>'
                  : '') +
                '</li>'
              );
            }).join('') +
            '</ul></div>';
        // La Ballade : un couplet par gardien vaincu.
        const verses = QUESTS.filter(q => q.verse),
          sung = verses.filter(q => st.done[q.id]);
        if (sung.length)
          html +=
            '<div class="quest-map quest-ballad"><b>🎵 La Ballade de l’Aurore · ' +
            sung.length +
            ' / ' +
            verses.length +
            '</b>' +
            verses
              .map(q => '<p>' + (st.done[q.id] ? '« ' + esc(q.verse) + ' »' : '« … »') + '</p>')
              .join('') +
            '</div>';
        CHAPTERS.forEach((c, i) => {
          const qs = QUESTS.filter(q => q.main && q.chapter === i);
          html +=
            '<h3 class="quest-chapter">' +
            chapterName(c) +
            ' — ' +
            esc(c.title) +
            ' <small>· ' +
            (c.under
              ? 'Les Tréfonds, à ton niveau'
              : esc(ZONES[c.zone].name) + ', niveaux ' + c.levels.join(' à ')) +
            '</small></h3><p class="quest-note">' +
            esc(c.intro) +
            '</p>';
          // Interlude : les quatre voix retrouvées.
          if (c.under && VOICES.some(v => st.flags[v.flag]))
            html +=
              '<p class="quest-stars">🗿 ' +
              VOICES.map(v => (st.flags[v.flag] ? '◆ ' + esc(v.name) : '◇ …')).join(' · ') +
              '</p>';
          for (const q of qs) {
            if (st.active[q.id]) html += list(q);
            else if (st.done[q.id]) html += '<p class="quest-done-line">✓ ' + esc(q.title) + '</p>';
            else if (canStart(st, q)) html += discover(q);
          }
        });
      } else if (tab === 'side') {
        // Guilde : rang, renommée, contrat en cours (et les anciennes quêtes secondaires encore en cours).
        html += CANAAN_GUILD.summary(game.hero);
        const side = QUESTS.filter(q => !q.main && st.active[q.id]);
        html += side.length
          ? side.map(list).join('')
          : '<p class="quest-note">Aucun contrat en cours. Le tableau de la guilde, au Camp de l’Aurore, en propose trois nouveaux tous les quarts d’heure.</p>';
      } else if (tab === 'treasure') {
        // Grand troc : l'objet tenu et à qui le porter.
        const held = tradeItem(st),
          next = TRADE_CHAIN[st.troc];
        html +=
          '<div class="quest-card"><b>🎁 Le grand troc · ' +
          st.troc +
          ' / ' +
          TRADE_CHAIN.length +
          '</b>' +
          (held
            ? '<p>Tu tiens : ' +
              esc(held.icon + ' ' + held.name) +
              ' — <i>' +
              esc(TRADE_CHAIN[st.troc - 1].desc) +
              '</i></p>'
            : '') +
          '<p class="quest-note">' +
          esc(
            held
              ? TRADE_CHAIN[st.troc - 1].hint
              : 'Les habitants de l’île aiment échanger. Milo, le berger des Plaines verdoyantes, a toujours de la laine en trop…'
          ) +
          '</p>' +
          (!next
            ? '<p class="quest-reward">🔎 La Loupe d’Orven fait briller les coquillages chantants de loin.</p>'
            : '') +
          '</div>';
        // Cœurs d'Aurore et gardiens de l'Ombre.
        const hearts = heartCount(st);
        html +=
          '<div class="quest-card"><b>❤️ Cœurs d’Aurore · ' +
          hearts +
          ' / ' +
          HEART_FLAGS.length +
          '</b><p>PV max +' +
          Math.round(heartBonus(st) * 100) +
          ' %. Chaque gardien vaincu en laisse un, et Madame Nacre en garde deux pour les grands collectionneurs.</p><ul>' +
          Object.entries(GUARDIANS)
            .map(([id, g]) => {
              const q = quest(Number(id)),
                won = st.flags['heart_q' + id],
                known = won || st.done[q.id] || st.active[q.id];
              return (
                '<li class="' +
                (won ? 'done' : '') +
                '">' +
                (won ? '✓ ' : '◦ ') +
                (known ? esc(g.name + ', ' + g.title) : '???') +
                ' — ' +
                esc(chapterPlace(CHAPTERS[q.chapter])) +
                '</li>'
              );
            })
            .join('') +
          '</ul></div>';
        // Coquillages chantants : par région, ceux qui restent (avec la loupe, on sait où chercher).
        const loupe = hasLoupe(game.hero);
        html +=
          '<div class="quest-card"><b>🐚 Coquillages chantants · ' +
          st.shells.length +
          ' / ' +
          SHELLS.length +
          '</b><p>' +
          esc(SHELL_LORE) +
          '</p><ul>' +
          ZONES.slice(0, 6)
            .map((z, i) => {
              const all = SHELLS.filter(sh => QUEST_SITES[sh.site].zone === i),
                got = all.filter(sh => st.shells.includes(sh.id)).length;
              return (
                '<li class="' +
                (got === all.length ? 'done' : '') +
                '">' +
                (got === all.length ? '✓ ' : '◦ ') +
                esc(z.name) +
                ' · ' +
                got +
                ' / ' +
                all.length +
                (loupe && got < all.length
                  ? ' · ' +
                    esc(
                      'près de ' +
                        all
                          .filter(sh => !st.shells.includes(sh.id))
                          .map(sh => QUEST_NPCS[QUESTS.find(q => q.site === sh.site).npc].name)
                          .join(', ')
                    )
                  : '') +
                '</li>'
              );
            })
            .join('') +
          '</ul><p class="quest-note">Chaque lieu de quête en cache un, un peu à l’écart. Madame Nacre, au Camp de l’Aurore, récompense les collectionneurs.</p></div>';
      } else {
        // Les contrats de la guilde se comptent dans l'onglet Guilde.
        const done = QUESTS.filter(q => st.done[q.id] && !isContract(q));
        html += done.length
          ? done
              .map(
                q =>
                  '<div class="quest-card done"><b>✓ ' +
                  esc(q.title) +
                  '</b><p>' +
                  esc(q.summary) +
                  '</p><p class="quest-reward">🏆 ' +
                  esc(rewardLine(q)) +
                  '</p>' +
                  (q.memory
                    ? '<p class="quest-memory"><b>📜 Souvenir</b> <span>' + esc(q.memory) + '</span></p>'
                    : '') +
                  '</div>'
              )
              .join('')
          : '<p class="quest-note">Aucune quête terminée pour l’instant.</p>';
      }
      const tabs = [
        ['main', '📖 Histoire principale'],
        ['side', '🛡️ Guilde'],
        ['treasure', '🎁 Trésors'],
        ['done', '✓ Terminées']
      ];
      modernPanel(
        '<div class="quest-journal panel-fill" data-panel-size="md">' +
          canaanHead('📜 Journal de quêtes') +
          canaanTabs('questTab', tab, tabs) +
          '<div class="quest-body panel-scroll" data-keep-scroll="quest-' +
          tab +
          '">' +
          html +
          '</div></div>'
      );
    }

    return Object.freeze({
      npcState,
      talkTo,
      card,
      toggleJournal,
      renderJournal
    });
  }
  window.CANAAN_QUEST_DIALOGS = Object.freeze({ create });
})();
