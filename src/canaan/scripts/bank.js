// Banque : 500 places par joueur pour ranger ce qu'on veut garder et faire de la place dans le sac. Le banquier
// (échoppe de Lira, au Camp de l'Aurore) ouvre deux fenêtres côte à côte : la banque à gauche, le sac à droite ;
// un clic dépose un objet du sac, un clic sur un objet de la banque le reprend.
// La banque de chaque héros (hero.bank : { items, stacks }) contient des équipements et des piles (Rubis, poissons,
// viandes, repas ; 100 au plus par case), et elle est sauvegardée avec lui (l'hôte garde celle de ses invités).
// L'hôte décide : banquier à portée, place à la banque et dans le sac ; un invité reçoit sa banque dans son message
// privé près du banquier et envoie ses dépôts et retraits (actions bank-deposit et bank-withdraw).
(() => {
  'use strict';
  const CAPACITY = 500;
  const STACK = 100;
  const esc = text => safeGearText(text);
  const say = (hero, text) => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  const guest = () => game.mode === 'guest';
  const bankOf = hero => (hero.bank ||= { items: [], stacks: {} });
  const tilesFor = n => Math.ceil(Math.max(0, n) / STACK);
  // Banquier à moins de quelques pas (jamais en instance).
  function nearBanker(hero = game.hero) {
    const p = hero.player;
    return (
      !game.world.instance &&
      game.world.npcs.some(n => n.type === 'bank' && canaanHere(n) && Math.hypot(p.x - n.x, p.y - n.y) < 135)
    );
  }
  // Cases occupées : un équipement par case, et les piles par 100.
  function used(bank) {
    return bank.items.length + Object.values(bank.stacks).reduce((a, n) => a + tilesFor(n), 0);
  }
  // Cases des piles de la banque, prêtes à afficher (même format que celles du sac).
  function stackTiles(bank) {
    const out = [];
    for (const [key, total] of Object.entries(bank.stacks).sort()) {
      const [kind, id, q] = key.split(':');
      for (let left = total; left > 0; left -= STACK)
        out.push({ kind, id, q: Number(q) || 0, n: Math.min(STACK, left) });
    }
    return out;
  }

  // ---------------------------------------------------------------- Hôte : règles
  // Déposer : un équipement du sac (son identifiant) ou une pile (son repère).
  function deposit(hero, ref) {
    if (!nearBanker(hero)) return (say(hero, '🏦 Va voir le banquier pour ranger tes objets.'), false);
    const bank = bankOf(hero);
    if (CANAAN_BAG.isToken(ref)) {
      const p = CANAAN_BAG.parse(ref);
      if (!p || CANAAN_BAG.count(hero, p.kind, p.id, p.q) < p.n) return false;
      const key = p.kind + ':' + p.id + ':' + p.q,
        now = bank.stacks[key] || 0;
      if (used(bank) + tilesFor(now + p.n) - tilesFor(now) > CAPACITY)
        return (say(hero, '🏦 La banque est pleine.'), false);
      CANAAN_BAG.remove(hero, p.kind, p.id, p.q, p.n);
      bank.stacks[key] = now + p.n;
    } else {
      const i = hero.inventory.findIndex(it => it && String(it.id) === String(ref));
      if (i < 0) return false;
      if (used(bank) >= CAPACITY) return (say(hero, '🏦 La banque est pleine.'), false);
      bank.items.push(hero.inventory.splice(i, 1)[0]);
    }
    return changed(hero);
  }
  // Reprendre : un équipement de la banque (identifiant) ou une pile (repère), s'il y a la place dans le sac.
  function withdraw(hero, ref) {
    if (!nearBanker(hero)) return (say(hero, '🏦 Va voir le banquier pour reprendre tes objets.'), false);
    const bank = bankOf(hero);
    if (CANAAN_BAG.isToken(ref)) {
      const p = CANAAN_BAG.parse(ref),
        key = p && p.kind + ':' + p.id + ':' + p.q;
      if (!p || (bank.stacks[key] || 0) < p.n) return false;
      if (!CANAAN_BAG.room(hero, p.kind, p.id, p.q, p.n))
        return (say(hero, '🎒 Sac plein : fais de la place avant de reprendre.'), false);
      bank.stacks[key] -= p.n;
      if (bank.stacks[key] <= 0) delete bank.stacks[key];
      CANAAN_BAG.add(hero, p.kind, p.id, p.q, p.n);
    } else {
      const i = bank.items.findIndex(it => it && String(it.id) === String(ref));
      if (i < 0) return false;
      if (canaanBagUsed(hero) >= canaanBagLimit(hero))
        return (say(hero, '🎒 Sac plein : fais de la place avant de reprendre.'), false);
      hero.inventory.push(bank.items.splice(i, 1)[0]);
    }
    return changed(hero);
  }
  function changed(hero) {
    hero.netBag = null;
    hero.netBank = null;
    if (hero === game.hero) recomputeStats();
    else recomputeHeroStats(hero);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'bank-deposit') return deposit(hero, action.ref);
    if (action.op === 'bank-withdraw') return withdraw(hero, action.ref);
    return false;
  }
  // Banque envoyée à un invité (quand elle change), seulement près du banquier.
  function view(hero) {
    return nearBanker(hero) ? bankOf(hero) : null;
  }

  // ---------------------------------------------------------------- Sauvegarde
  const validItem = it =>
    it &&
    typeof it === 'object' &&
    !Array.isArray(it) &&
    Object.hasOwn(gearSlots, it.slot) &&
    it.slot !== 'weapon2' &&
    Number.isFinite(Number(it.level ?? 1)) &&
    Number(it.level ?? 1) > 0;
  // Banque valide : équipements reconnus, piles connues en quantités entières, 500 cases au plus.
  function sanitize(raw) {
    const out = { items: [], stacks: {} };
    if (!raw || typeof raw !== 'object') return out;
    if (Array.isArray(raw.items))
      for (const it of raw.items)
        if (validItem(it) && out.items.length < CAPACITY) out.items.push(window.CANAAN_GEAR.normalize(it));
    if (raw.stacks && typeof raw.stacks === 'object')
      for (const [key, n] of Object.entries(raw.stacks)) {
        const count = Math.floor(Number(n));
        if (count > 0 && CANAAN_BAG.parse(key + '*1')) {
          const room = (CAPACITY - used(out)) * STACK;
          if (room > 0) out.stacks[key] = Math.min(count, room);
        }
      }
    return out;
  }
  const exportBank = hero => ({ items: bankOf(hero).items, stacks: { ...bankOf(hero).stacks } });

  // ---------------------------------------------------------------- Fenêtre (hôte ou invité)
  let remote = null;
  const isOpen = () => modalOpen() && !!document.querySelector('#window .bank-panel');
  const myBank = () => (guest() ? remote : view(game.hero));
  function gearTile(item, attrs) {
    const rarity = rarityInfo(item),
      icon = weaponIcon(item) || itemIcon[item.slot];
    return (
      '<div class="bag-sale-wrap"><button type="button" class="bag-cell"' +
      canaanPrestige(item) +
      ' style="border-color:' +
      rarity.color +
      ';--rarity:' +
      rarity.color +
      '" ' +
      attrs +
      '>' +
      '<span class="bag-icon">' +
      icon +
      '</span><span class="bag-name">' +
      esc(gearDisplayName(item)) +
      '</span><span class="bag-ilvl">' +
      itemLevel(item) +
      '</span></button></div>'
    );
  }
  const stackTile = (p, attrs) => '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, attrs) + '</div>';
  const empty = n =>
    Array.from(
      { length: Math.max(0, n) },
      () =>
        '<div class="bag-sale-wrap"><div class="bag-cell empty"><span class="bag-icon">＋</span></div></div>'
    ).join('');
  let shown = '';
  const signature = () =>
    JSON.stringify([
      myBank(),
      game.hero.inventory.map(i => i.id),
      CANAAN_BAG.tiles(game.hero).map(p => CANAAN_BAG.token(p))
    ]);
  function render() {
    if (!isOpen()) return;
    shown = signature();
    const bank = myBank(),
      hero = game.hero;
    let left;
    if (!bank) left = '<p class="muted">Approche-toi du banquier pour ouvrir ta banque.</p>';
    else {
      const tiles = [
        ...bank.items.map(it =>
          gearTile(
            it,
            'data-tooltip-bank="' +
              esc(it.id) +
              '" data-action="bankWithdraw" data-ref="' +
              esc(it.id) +
              '" title="Reprendre"'
          )
        ),
        ...stackTiles(bank).map(p =>
          stackTile(
            p,
            'data-action="bankWithdraw" data-ref="' + esc(CANAAN_BAG.token(p)) + '" title="Reprendre"'
          )
        )
      ];
      // Toutes les cases occupées, puis assez de cases libres pour remplir la dernière rangée (la place restante est indiquée).
      left =
        '<p class="muted">Clique un objet pour le reprendre dans ton sac.</p><div class="modern-bag bank-grid">' +
        tiles.join('') +
        empty(Math.min(CAPACITY - tiles.length, 40)) +
        '</div>';
    }
    const gear = hero.inventory.map((it, i) =>
        gearTile(
          it,
          'data-tooltip-index="' +
            i +
            '" data-action="bankDeposit" data-ref="' +
            esc(it.id) +
            '" title="Déposer à la banque"'
        )
      ),
      depositTile = p =>
        stackTile(
          p,
          'data-action="bankDeposit" data-ref="' + esc(CANAAN_BAG.token(p)) + '" title="Déposer à la banque"'
        ),
      stacks = CANAAN_BAG.tiles(hero, 'main').map(depositTile),
      mats = CANAAN_BAG.tiles(hero, 'mat').map(depositTile);
    showPanel(
      '<div class="rpg-head"><h2>🏦 Banque</h2></div><div class="bank-panel shop-columns">' +
        '<section class="shop-side"><h3>🏦 Ta banque · ' +
        (bank ? used(bank) : 0) +
        ' / ' +
        CAPACITY +
        '</h3>' +
        left +
        '</section>' +
        '<section class="shop-side bag-side"><h3>⟦menu_inventory⟧ Ton sac · ' +
        canaanBagUsed(hero) +
        ' / ' +
        canaanBagLimit(hero) +
        '</h3>' +
        '<p class="muted">Clique un objet pour le déposer. Les objets portés et les Rubis équipés restent sur toi.</p>' +
        '<div class="modern-bag">' +
        gear.join('') +
        stacks.join('') +
        empty(canaanBagLimit(hero) - gear.length - stacks.length) +
        '</div>' +
        '<h3 class="bag-subhead">⟦prof_mining⟧ Matériaux · ' +
        mats.length +
        ' / ' +
        CANAAN_BAG.MAT_LIMIT +
        '</h3>' +
        (mats.length
          ? '<div class="modern-bag">' + mats.join('') + '</div>'
          : '<p class="muted">Aucun matériau.</p>') +
        '</section></div>'
    );
  }
  function open() {
    hideGearTooltip();
    showPanel('<div class="bank-panel"></div>');
    render();
  }
  function showTooltip(id, event) {
    const item = myBank()?.items?.find(it => String(it.id) === String(id));
    if (!item) return hideGearTooltip();
    gearTooltip.innerHTML =
      window.CANAAN_STATS_VIEW.tooltip(item) +
      (game.hero.equipment[item.slot] ? gearComparison(item, game.hero.equipment[item.slot]) : '');
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  const act = action => {
    hideGearTooltip();
    if (guest()) return CANAAN_NET.requestAction(action);
    const done = handle(game.hero, action);
    render();
    return done;
  };
  setInterval(() => {
    if (started && isOpen() && signature() !== shown) render();
  }, 250);

  // Le banquier, dans l'échoppe de Lira (au bout du comptoir).
  game.world.npcs.push({
    x: (CANAAN_ROOMS[1].x + 10.5) * TS,
    y: (CANAAN_ROOMS[1].y + 4.6) * TS,
    name: 'Banquier Orvin',
    role: 'Banquier',
    type: 'bank',
    color: '#e8c050',
    village: CANAAN_CAMP.name,
    sprite: 4
  });

  window.CANAAN_BANK = Object.freeze({
    CAPACITY,
    nearBanker,
    used: hero => used(bankOf(hero)),
    of: bankOf,
    deposit,
    withdraw,
    handle,
    view,
    sanitize,
    export: exportBank,
    open,
    render,
    isOpen,
    showTooltip,
    remote: () => remote,
    applyRemote(v) {
      remote = v && Array.isArray(v.items) && v.stacks && typeof v.stacks === 'object' ? v : null;
      render();
    },
    depositRef: ref => act({ op: 'bank-deposit', ref }),
    withdrawRef: ref => act({ op: 'bank-withdraw', ref })
  });
})();
