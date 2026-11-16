// Échange entre joueurs (touche J) : deux joueurs en ligne s'échangent des objets de leur sac et de l'or.
// L'hôte décide de tout : il garde les échanges en cours, vérifie les objets, l'or et la place dans les sacs,
// et n'échange que lorsque les deux joueurs ont validé la même offre (toute modification annule les validations).
// Un invité envoie ses demandes à l'hôte (actions trade-*) et reçoit sa vue de l'échange dans son message privé.
(() => {
  'use strict';
  const ASK_SECONDS = 30;
  const sessions = new Set();
  const esc = text => safeGearText(text);
  const idOf = hero => (hero === game.hero ? 'host' : hero.id);
  // Nom affiché : le héros de l'hôte n'a pas toujours de nom (comme dans l'état envoyé aux invités).
  const nameOf = hero => hero.name || (hero === game.hero ? 'Hôte' : 'Invité');
  const heroById = id => game.heroes.find(h => idOf(h) === id) || null;
  const sessionOf = hero => [...sessions].find(s => s.a === hero || s.b === hero) || null;
  const other = (s, hero) => (s.a === hero ? s.b : s.a);
  // Joueurs avec qui échanger : présents, connectés (pas un compagnon local) et pas déconnectés.
  const tradable = hero => !!hero && game.heroes.includes(hero) && !hero.away && (hero === game.hero ? game.mode === 'host' : !hero.local && !!hero.peer);
  function note(hero, text) {
    hero.tradeNote = text;
    if (hero === game.hero) toast('🤝 ' + text);
    else canaanLootNotice(hero, '🤝 ' + text);
  }
  function close(s, text) {
    sessions.delete(s);
    if (text) for (const hero of [s.a, s.b]) note(hero, text);
  }

  // ---------------------------------------------------------------- Hôte : règles de l'échange
  function request(from, toId) {
    const to = heroById(toId);
    if (!tradable(from) || !tradable(to) || to === from) return false;
    if (sessionOf(from) || sessionOf(to)) {
      note(from, (sessionOf(to) ? nameOf(to) + ' est déjà en train d’échanger.' : 'Termine d’abord ton échange en cours.'));
      return false;
    }
    sessions.add({ a: from, b: to, open: false, offers: new Map([[from, { items: [], gold: 0 }], [to, { items: [], gold: 0 }]]), ready: new Set(), at: time });
    note(to, nameOf(from) + ' te propose un échange (touche J).');
    note(from, 'Demande d’échange envoyée à ' + nameOf(to) + '.');
    return true;
  }
  function answer(hero, yes) {
    const s = sessionOf(hero);
    if (!s || s.open || s.b !== hero) return false;
    if (!yes) {
      close(s, nameOf(hero) + ' a refusé l’échange.');
      return true;
    }
    s.open = true;
    note(s.a, nameOf(hero) + ' accepte : l’échange est ouvert.');
    hero.tradeNote = 'Échange ouvert avec ' + nameOf(s.a) + '.';
    return true;
  }
  // Objets proposés : un équipement par son identifiant, ou une pile du sac par son repère (fish:gardon:2*30,
  // rubis:phenix:0*1…). Renvoie [{ gear }] ou [{ stack }], ou null si le héros ne les a plus.
  function resolve(hero, ids) {
    const used = new Set(),
      taken = new Map(),
      out = [];
    for (const id of ids) {
      if (CANAAN_BAG.isToken(id)) {
        const p = CANAAN_BAG.parse(id);
        if (!p) return null;
        const key = p.kind + ':' + p.id + ':' + p.q,
          n = (taken.get(key) || 0) + p.n;
        if (n > CANAAN_BAG.count(hero, p.kind, p.id, p.q)) return null;
        taken.set(key, n);
        out.push({ stack: p, id });
        continue;
      }
      const it = hero.inventory.find(x => x && x.id === id && !used.has(x));
      if (!it) return null;
      used.add(it);
      out.push({ gear: it, id });
    }
    return out;
  }
  function offer(hero, items, gold) {
    const s = sessionOf(hero);
    if (!s || !s.open || !Array.isArray(items) || items.length > TRADE_ITEMS || !Number.isInteger(gold) || gold < 0) return false;
    if (!resolve(hero, items) || gold > Math.floor(hero.player.gold)) return false;
    s.offers.set(hero, { items: [...items], gold });
    // Une offre changée : les deux validations tombent.
    s.ready.clear();
    return true;
  }
  function setReady(hero, yes) {
    const s = sessionOf(hero);
    if (!s || !s.open) return false;
    if (yes) s.ready.add(hero);
    else s.ready.delete(hero);
    if (s.ready.size === 2) execute(s);
    return true;
  }
  function cancel(hero) {
    const s = sessionOf(hero);
    if (!s) return false;
    close(s, nameOf(hero) + ' a annulé l’échange.');
    return true;
  }
  // Les deux ont validé : tout est revérifié, puis les objets et l'or changent de main d'un seul coup.
  function execute(s) {
    const oa = s.offers.get(s.a),
      ob = s.offers.get(s.b),
      ga = resolve(s.a, oa.items),
      gb = resolve(s.b, ob.items);
    const fail = text => {
      s.ready.clear();
      for (const hero of [s.a, s.b]) note(hero, text);
      return false;
    };
    if (!ga || !gb) return fail('Un objet proposé n’est plus dans le sac : échange suspendu.');
    if (oa.gold > Math.floor(s.a.player.gold) || ob.gold > Math.floor(s.b.player.gold)) return fail('Or insuffisant : échange suspendu.');
    // Les objets et les piles changent de main ; si un sac déborde, tout revient comme avant.
    const move = (from, to, give) => {
      const gear = give.filter(x => x.gear).map(x => x.gear);
      from.inventory = from.inventory.filter(it => !gear.includes(it));
      to.inventory.push(...gear);
      for (const { stack: p } of give.filter(x => x.stack)) {
        CANAAN_BAG.remove(from, p.kind, p.id, p.q, p.n);
        CANAAN_BAG.add(to, p.kind, p.id, p.q, p.n);
      }
    };
    move(s.a, s.b, ga);
    move(s.b, s.a, gb);
    const full = [s.a, s.b].find(hero => canaanBagUsed(hero) > canaanBagLimit(hero) || CANAAN_BAG.matUsed(hero) > CANAAN_BAG.MAT_LIMIT);
    if (full) {
      move(s.b, s.a, ga);
      move(s.a, s.b, gb);
      return fail('Sac trop plein pour ' + nameOf(full) + ' : échange suspendu.');
    }
    s.a.player.gold += ob.gold - oa.gold;
    s.b.player.gold += oa.gold - ob.gold;
    for (const hero of [s.a, s.b]) canaanAchieve(hero, 'trade');
    for (const hero of [s.a, s.b]) {
      hero.netBag = null;
      if (hero === game.hero) recomputeStats();
      else recomputeHeroStats(hero);
    }
    const summary = (o, g) => (g.length ? g.length + ' objet' + (g.length > 1 ? 's' : '') : '') + (g.length && o.gold ? ' et ' : '') + (o.gold ? o.gold + ' or' : '') || 'rien';
    close(s, 'Échange réussi : ' + nameOf(s.a) + ' donne ' + summary(oa, ga) + ', ' + nameOf(s.b) + ' donne ' + summary(ob, gb) + '.');
    chat('Échange', nameOf(s.a) + ' ⇄ ' + nameOf(s.b) + ' : échange conclu.');
    saveGame();
    if (modalOpen() && (currentGearPanel === 'inventory' || currentGearPanel === 'character')) refreshGearPanel();
    return true;
  }
  // Action d'un joueur (l'hôte directement, un invité par le réseau) ; renvoie vrai si elle a été prise en compte.
  function handle(hero, action) {
    if (!action || typeof action.op !== 'string') return false;
    if (action.op === 'trade-request') return request(hero, action.to);
    if (action.op === 'trade-answer') return answer(hero, action.yes);
    if (action.op === 'trade-offer') return offer(hero, action.items, action.gold);
    if (action.op === 'trade-ready') return setReady(hero, action.yes);
    if (action.op === 'trade-cancel') return cancel(hero);
    return false;
  }
  // Fin des échanges dont un joueur est parti, et des demandes restées sans réponse.
  function check() {
    for (const s of [...sessions]) {
      if (!tradable(s.a) || !tradable(s.b)) close(s, 'Échange annulé : un joueur est parti.');
      else if (!s.open && time - s.at > ASK_SECONDS * 60) close(s, 'Demande d’échange sans réponse.');
    }
  }
  // Vue d'un joueur : partenaires possibles, demande reçue ou envoyée, offres et validations.
  // Vue d'un objet proposé : un équipement (avec ce qu'il faut pour l'info-bulle) ou une pile.
  const itemView = x => (x.stack ? { token: x.id } : { ...x.gear, name: gearDisplayName(x.gear) });
  function view(hero) {
    const s = sessionOf(hero),
      out = { note: hero.tradeNote || '' };
    if (!s) {
      out.partners = game.heroes.filter(h => h !== hero && tradable(h)).map(h => ({ id: idOf(h), name: nameOf(h) }));
      return out;
    }
    const them = other(s, hero),
      mine = s.offers.get(hero),
      theirs = s.offers.get(them);
    out.with = nameOf(them);
    out.state = s.open ? 'open' : s.b === hero ? 'incoming' : 'outgoing';
    if (s.open)
      Object.assign(out, {
        mine: { items: mine.items, gold: mine.gold, ready: s.ready.has(hero) },
        theirs: { items: (resolve(them, theirs.items) || []).map(itemView), gold: theirs.gold, ready: s.ready.has(them) }
      });
    return out;
  }

  // ---------------------------------------------------------------- Côté joueur (hôte ou invité)
  let remote = { note: '' };
  const guest = () => game.mode === 'guest';
  const myView = () => (guest() ? remote : view(game.hero));
  function act(action) {
    if (guest()) return CANAAN_NET.requestAction(action);
    const done = handle(game.hero, action);
    render();
    return done;
  }
  const ui = { gold: null };
  function partnerList(v) {
    if (!v.partners?.length)
      return (
        '<p class="trade-empty">Aucun autre joueur en ligne pour l’instant.' +
        (guest() ? '' : ' Ouvre un salon (G) et envoie l’invitation à tes amis.') +
        ' Les compagnons locaux reçoivent leur équipement depuis le panneau Groupe.</p>'
      );
    return (
      '<div class="trade-partners">' +
      v.partners
        .map(p => '<button type="button" data-action="tradeRequest" data-hero="' + esc(p.id) + '">🤝 Échanger avec ' + esc(p.name) + '</button>')
        .join('') +
      '</div>'
    );
  }
  // Case d'un objet (équipement ou pile) ; attrs : action au clic.
  function tile(x, attrs) {
    if (x.token) {
      const p = CANAAN_BAG.parse(x.token);
      return p ? '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, attrs) + '</div>' : '';
    }
    const rarity = rarityInfo(x),
      icon = weaponIcon(x) || itemIcon[x.slot];
    return (
      '<div class="bag-sale-wrap"><button type="button" class="bag-cell"' + canaanPrestige(x) + ' style="border-color:' + rarity.color + ';--rarity:' + rarity.color + '" data-tooltip-trade="' + esc(x.id) + '" ' + attrs + '>' +
      '<span class="bag-icon">' + icon + '</span><span class="bag-name">' + esc(x.name || gearDisplayName(x)) + '</span><span class="bag-ilvl">' + itemLevel(x) + '</span></button></div>'
    );
  }
  // Ce qui reste dans le sac une fois l'offre retirée : équipements non proposés et piles diminuées.
  function bagLeft(mine) {
    const hero = game.hero,
      offered = resolve(hero, mine.items) || [],
      gear = hero.inventory.filter(it => it && it.id && !offered.some(x => x.gear === it)),
      minus = new Map();
    for (const { stack: p } of offered.filter(x => x.stack)) minus.set(p.kind + ':' + p.id + ':' + p.q, (minus.get(p.kind + ':' + p.id + ':' + p.q) || 0) + p.n);
    const stacks = [];
    for (const p of CANAAN_BAG.piles(hero)) {
      let n = p.n - (minus.get(p.kind + ':' + p.id + ':' + p.q) || 0);
      for (; n > 0; n -= CANAAN_BAG.STACK) stacks.push({ ...p, n: Math.min(CANAAN_BAG.STACK, n) });
    }
    return { gear, stacks, offered };
  }
  function openTrade(v) {
    const { gear, stacks, offered } = bagLeft(v.mine),
      full = offered.length >= TRADE_ITEMS,
      gold = ui.gold === null ? v.mine.gold : ui.gold,
      grid = list => '<div class="modern-bag trade-grid">' + (list.length ? list.join('') : '<p class="trade-empty">Aucun objet.</p>') + '</div>';
    const mineTiles = offered.map((x, k) => tile(x.stack ? { token: x.id } : x.gear, 'data-action="tradeRemove" data-index="' + k + '" title="Retirer de l’offre"')),
      theirTiles = v.theirs.items.map(x => tile(x, 'title="Proposé par ' + esc(v.with) + '"')),
      bagTiles = [
        ...gear.map(it => tile(it, 'data-action="tradeAddId" data-id="' + esc(it.id) + '"' + (full ? ' disabled' : '') + ' title="Proposer"')),
        ...stacks.map(p => '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, 'data-action="tradeAddId" data-id="' + esc(CANAAN_BAG.token(p)) + '"' + (full ? ' disabled' : '') + ' title="Proposer"') + '</div>')
      ];
    return (
      '<div class="trade-columns shop-columns">' +
      '<section class="shop-side trade-offers">' +
      '<div class="trade-side' + (v.mine.ready ? ' ready' : '') + '"><h3>Ton offre ' + (v.mine.ready ? '<span class="trade-ok">✅ Validé</span>' : '') + '<small> · ' + offered.length + ' / ' + TRADE_ITEMS + '</small></h3>' + grid(mineTiles) +
      '<div class="trade-gold"><label for="tradeGold">💰 Or (tu as ' + Math.floor(P.gold) + ')</label><input id="tradeGold" type="number" min="0" step="1" value="' + Number(gold) + '">' +
      '<button type="button" data-action="tradeGold">Proposer</button></div></div>' +
      '<div class="trade-side' + (v.theirs.ready ? ' ready' : '') + '"><h3>Offre de ' + esc(v.with) + ' ' + (v.theirs.ready ? '<span class="trade-ok">✅ Validé</span>' : '') + '</h3>' + grid(theirTiles) +
      '<p class="trade-gold-them">💰 ' + Number(v.theirs.gold) + ' or</p></div>' +
      '<div class="trade-actions"><button type="button" class="' + (v.mine.ready ? '' : 'trade-primary') + '" data-action="tradeReady">' + (v.mine.ready ? 'Ne plus valider' : '✅ Valider l’échange') + '</button>' +
      '<button type="button" class="trade-danger" data-action="tradeCancel">Annuler</button></div>' +
      '<p class="trade-hint">L’échange se fait quand vous avez validé tous les deux. Changer une offre annule les validations.</p></section>' +
      '<section class="shop-side bag-side"><h3>⟦menu_inventory⟧ Ton sac · clique un objet pour le proposer</h3>' +
      '<p class="muted">Les objets portés ne s’échangent pas. Une pile se propose entière (100 au plus).</p>' + grid(bagTiles) + '</section></div>'
    );
  }
  function body(v) {
    if (v.state === 'incoming')
      return (
        '<p class="trade-ask">' + esc(v.with) + ' te propose un échange.</p><div class="trade-actions">' +
        '<button type="button" class="trade-primary" data-action="tradeAnswer" data-answer="yes">Accepter</button>' +
        '<button type="button" class="trade-danger" data-action="tradeAnswer" data-answer="no">Refuser</button></div>'
      );
    if (v.state === 'outgoing')
      return '<p class="trade-ask">En attente de la réponse de ' + esc(v.with) + '…</p><div class="trade-actions"><button type="button" class="trade-danger" data-action="tradeCancel">Annuler la demande</button></div>';
    if (v.state === 'open') return openTrade(v);
    return partnerList(v);
  }
  let shown = '';
  function render() {
    if (!started) return;
    const open = modalOpen() && document.querySelector('#window .trade-panel');
    if (!open) return;
    const v = myView();
    shown = JSON.stringify(v) + '|' + (game.hero.inventory || []).length + '|' + CANAAN_BAG.tiles(game.hero).length + '|' + Math.floor(P.gold);
    showPanel(
      '<div class="rpg-head"><h2>🤝 Échange</h2></div><div class="rpg-paper trade-panel">' +
        (v.note ? '<p class="trade-note" role="status">' + esc(v.note) + '</p>' : '') +
        body(v) +
        '</div>'
    );
  }
  function toggle() {
    if (!started || paused) return;
    if (modalOpen()) {
      const mine = document.querySelector('#window .trade-panel');
      closePanels();
      if (mine) return;
    }
    ui.gold = null;
    showPanel('<div class="rpg-paper trade-panel"></div>');
    render();
  }
  // Mise à jour de la fenêtre quand l'échange change (l'autre joueur ajoute un objet, valide…).
  setInterval(() => {
    if (!started) return;
    if (!guest()) check();
    if (!modalOpen() || !document.querySelector('#window .trade-panel')) return;
    const v = myView(),
      now = JSON.stringify(v) + '|' + (game.hero.inventory || []).length + '|' + CANAAN_BAG.tiles(game.hero).length + '|' + Math.floor(P.gold);
    if (now !== shown && document.activeElement?.id !== 'tradeGold') render();
  }, 250);
  // Demande reçue : prévenir même fenêtre fermée (chez un invité, la note arrive avec sa vue).
  let lastIncoming = false;
  setInterval(() => {
    if (!started || !guest()) return;
    const incoming = remote.state === 'incoming';
    if (incoming && !lastIncoming) toast('🤝 ' + remote.with + ' te propose un échange (touche J).');
    lastIncoming = incoming;
  }, 300);

  // Actions de la fenêtre.
  function currentMine() {
    const v = myView();
    return v.state === 'open' ? v.mine : null;
  }
  const actions = {
    request: id => act({ op: 'trade-request', to: id }),
    answer: yes => act({ op: 'trade-answer', yes }),
    cancel: () => act({ op: 'trade-cancel' }),
    ready: () => {
      const mine = currentMine();
      return mine ? act({ op: 'trade-ready', yes: !mine.ready }) : false;
    },
    add(index) {
      const it = game.hero.inventory?.[index];
      return it?.id ? actions.addId(it.id) : false;
    },
    // Proposer un équipement (identifiant) ou une pile du sac (repère).
    addId(id) {
      const mine = currentMine();
      if (!mine || typeof id !== 'string' || !id || mine.items.length >= TRADE_ITEMS) return false;
      return act({ op: 'trade-offer', items: [...mine.items, id], gold: mine.gold });
    },
    remove(k) {
      const mine = currentMine();
      if (!mine || !Number.isInteger(k) || k < 0 || k >= mine.items.length) return false;
      return act({ op: 'trade-offer', items: mine.items.filter((_, i) => i !== k), gold: mine.gold });
    },
    gold() {
      const mine = currentMine(),
        value = Math.max(0, Math.floor(Number(document.getElementById('tradeGold')?.value) || 0));
      if (!mine) return false;
      ui.gold = null;
      if (value > Math.floor(P.gold)) {
        toast('Tu n’as que ' + Math.floor(P.gold) + ' or.');
        return false;
      }
      return act({ op: 'trade-offer', items: mine.items, gold: value });
    }
  };
  window.CANAAN_TRADE = Object.freeze({
    handle,
    view,
    check,
    // Info-bulle d'un équipement proposé (le sien ou celui de l'autre joueur).
    showTooltip(id, event) {
      const v = myView(),
        item = game.hero.inventory.find(it => it && it.id === id) || v.theirs?.items?.find(x => x.id === id && !x.token);
      if (!item) return hideGearTooltip();
      gearTooltip.innerHTML = window.CANAAN_STATS_VIEW.tooltip(item) + (game.hero.equipment[item.slot] ? gearComparison(item, game.hero.equipment[item.slot]) : '');
      gearTooltip.style.display = 'block';
      moveGearTooltip(event);
    },
    // Vue reçue de l'hôte par un invité (message privé).
    applyRemote(v) {
      if (v && typeof v === 'object') remote = v;
      render();
    },
    sessions: () => sessions.size,
    actions,
    toggle,
    render
  });
  window.toggleTrade = toggle;
})();
