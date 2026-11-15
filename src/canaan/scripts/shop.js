// Boutique du marchand (touche E près d'un marchand) : deux fenêtres côte à côte, comme dans un MMORPG.
// À gauche, la marchandise : un objet Peu commun du niveau du héros pour chaque emplacement et chaque famille
// d'arme, à choisir (un objet acheté est aussitôt remplacé par un autre du même genre). À droite, le sac : un clic
// vend l'objet ou la pile (poissons, viandes, repas, Rubis en double).
// L'hôte garde la marchandise de chaque héros et vérifie tout (marchand à portée, or, place) ; un invité reçoit la
// sienne dans son message privé et envoie ses achats et ventes (actions shop-buy et sell-stack).
(() => {
  'use strict';
  const SLOTS = ['helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring'];
  const RARITY = 'Peu commun';
  const stocks = new WeakMap();
  const esc = text => safeGearText(text);
  const say = (hero, text) => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  const guest = () => game.mode === 'guest';
  // Un objet de la marchandise : emplacement (et famille d'arme) imposés, qualité Peu commun, niveau du héros.
  function make(level, slot, weaponType = null) {
    const item = { id: 'shop' + Date.now() + Math.floor(Math.random() * 1e9), name: '', slot, rarity: RARITY, level: clampLevel(level) };
    if (weaponType) item.weaponType = weaponType;
    window.CANAAN_GEAR.normalize(item);
    return item;
  }
  // Marchandise d'un héros : refaite quand il change de niveau.
  function stock(hero) {
    const level = heroLevel(hero);
    let s = stocks.get(hero);
    if (!s || s.level !== level) {
      s = { level, items: [...SLOTS.map(slot => make(level, slot)), ...CANAAN_GEAR_ENGINE.weaponTypes.map(t => make(level, 'weapon', t))] };
      stocks.set(hero, s);
    }
    return s.items;
  }
  const priceOf = hero => shopPriceAt(heroLevel(hero));

  // ---------------------------------------------------------------- Hôte : règles
  function buy(hero, index) {
    const items = stock(hero),
      item = items[index];
    if (!item) return false;
    if (!nearMerchant(hero)) return say(hero, '🛍️ Va voir un marchand pour acheter.'), false;
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) return say(hero, '🎒 Sac plein : vends d’abord un objet.'), false;
    const cost = priceOf(hero);
    if (hero.player.gold < cost) return say(hero, 'Or insuffisant (' + cost + ' or).'), false;
    hero.player.gold -= cost;
    hero.inventory.push(item);
    // Remplacé par un autre objet du même genre.
    items[index] = make(heroLevel(hero), item.slot, item.weaponType || null);
    hero.netBag = null;
    hero.netShop = null;
    say(hero, '🛍️ ' + gearDisplayName(item) + ' acheté (' + cost + ' or).');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function sellStack(hero, text) {
    const p = CANAAN_BAG.parse(text);
    if (!p) return false;
    if (!nearMerchant(hero)) return say(hero, '💰 Va voir un marchand pour vendre !'), false;
    if (!CANAAN_BAG.remove(hero, p.kind, p.id, p.q, p.n)) return false;
    const gold = CANAAN_BAG.price(p);
    hero.player.gold += gold;
    canaanAchieve(hero, 'sell', gold);
    say(hero, '💰 ' + CANAAN_BAG.info(p).name + ' ×' + p.n + ' vendu : +' + gold + ' or');
    if (hero === game.hero) recomputeStats();
    else recomputeHeroStats(hero);
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'shop-buy') return buy(hero, action.index);
    if (action.op === 'sell-stack') return sellStack(hero, action.token);
    return false;
  }
  // Marchandise envoyée à un invité (quand elle change), seulement près d'un marchand.
  function view(hero) {
    return nearMerchant(hero) ? { price: priceOf(hero), items: stock(hero) } : null;
  }

  // ---------------------------------------------------------------- Fenêtre (hôte ou invité)
  let remote = null;
  let merchant = null;
  const isOpen = () => modalOpen() && !!document.querySelector('#window .shop-panel');
  const myStock = () => (guest() ? remote : view(game.hero));
  function stockCell(item, i, price) {
    const rarity = rarityInfo(item),
      icon = weaponIcon(item) || itemIcon[item.slot];
    return (
      '<div class="shop-item"><button type="button" class="bag-cell"' + canaanPrestige(item) + ' style="border-color:' + rarity.color + ';--rarity:' + rarity.color + '" data-tooltip-shop="' + i + '" data-action="shopBuy" data-index="' + i + '" title="Acheter ' + esc(gearDisplayName(item)) + '">' +
      '<span class="bag-icon">' + icon + '</span><span class="bag-name">' + esc(gearDisplayName(item)) + '</span><span class="bag-ilvl">' + itemLevel(item) + '</span></button>' +
      '<span class="shop-price' + (P.gold < price ? ' poor' : '') + '">🪙 ' + price + '</span></div>'
    );
  }
  // Sac du joueur dans la boutique : un clic vend (équipement ou pile).
  function bagSide() {
    const hero = game.hero,
      gear = hero.inventory.map((item, i) => {
        const rarity = rarityInfo(item),
          icon = weaponIcon(item) || itemIcon[item.slot];
        return (
          '<div class="bag-sale-wrap"><button type="button" class="bag-cell"' + canaanPrestige(item) + ' style="border-color:' + rarity.color + ';--rarity:' + rarity.color + '" data-tooltip-index="' + i + '" data-action="sellInventoryCell" data-index="' + i + '" data-item-id="' + esc(item.id) + '" title="Vendre ' + esc(gearDisplayName(item)) + ' pour ' + gearSellValue(item) + ' or">' +
          '<span class="bag-icon">' + icon + '</span><span class="bag-name">' + esc(gearDisplayName(item)) + '</span><span class="bag-ilvl">' + itemLevel(item) + '</span></button></div>'
        );
      }),
      stacks = CANAAN_BAG.tiles(hero).map(p => '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, 'data-action="shopSellStack" data-token="' + esc(CANAAN_BAG.token(p)) + '" title="Vendre pour ' + CANAAN_BAG.price(p) + ' or"') + '</div>'),
      empty = Math.max(0, canaanBagLimit(hero) - gear.length - stacks.length);
    return (
      '<section class="shop-side bag-side"><h3>⟦menu_inventory⟧ Ton sac · ' + (gear.length + stacks.length) + ' / ' + canaanBagLimit(hero) + '</h3>' +
      '<p class="muted">Clique un objet pour le vendre. Or : <b>🪙 ' + Math.floor(P.gold) + '</b></p>' +
      '<div class="modern-bag">' + gear.join('') + stacks.join('') + Array.from({ length: empty }, () => '<div class="bag-sale-wrap"><div class="bag-cell empty"><span class="bag-icon">＋</span></div></div>').join('') + '</div>' +
      '<div class="modern-foot"><button type="button" data-action="sellAllCommon">💰 Vendre les objets communs</button></div></section>'
    );
  }
  let shown = '';
  const signature = () => JSON.stringify([myStock()?.items?.map(i => i.id), game.hero.inventory.map(i => i.id), CANAAN_BAG.tiles(game.hero).map(p => CANAAN_BAG.token(p)), Math.floor(P.gold)]);
  function render() {
    if (!isOpen()) return;
    const s = myStock();
    shown = signature();
    const name = merchant?.name || 'Marchand';
    showPanel(
      '<div class="rpg-head"><h2>🛍️ ' + esc(name) + '</h2></div><div class="shop-panel shop-columns">' +
        '<section class="shop-side"><h3>Marchandise · ' + esc(merchant?.village || CANAAN_CAMP.name) + '</h3>' +
        (s
          ? '<p class="muted">Équipement Peu commun de ton niveau. Survole un objet pour le comparer, clique pour l’acheter.</p><div class="modern-bag shop-stock">' + s.items.map((it, i) => stockCell(it, i, s.price)).join('') + '</div>'
          : '<p class="muted">Approche-toi du marchand pour voir sa marchandise.</p>') +
        bagUpgradeHTML() +
        '<p class="muted">Pour devenir plus fort, il faut trouver mieux : monstres, boss mondiaux, donjons et raids lâchent des équipements toujours plus puissants.</p></section>' +
        bagSide() +
        '</div>'
    );
  }
  function open(n) {
    merchant = n || merchant;
    hideGearTooltip();
    showPanel('<div class="shop-panel"></div>');
    render();
  }
  // Survol d'un objet de la marchandise : ses statistiques et la comparaison avec l'objet porté.
  function showTooltip(index, event) {
    const item = myStock()?.items?.[index];
    if (!item) return hideGearTooltip();
    gearTooltip.innerHTML = window.CANAAN_STATS_VIEW.tooltip(item) + (game.hero.equipment[item.slot] ? gearComparison(item, game.hero.equipment[item.slot]) : '');
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
  // Mise à jour quand le sac, l'or ou la marchandise changent (réponse de l'hôte pour un invité).
  setInterval(() => {
    if (started && isOpen() && signature() !== shown) render();
  }, 250);
  // Nouveau rendu après une vente d'équipement (sellBagIndex).
  window.CANAAN_SHOP = Object.freeze({
    stock,
    buy,
    sellStack,
    handle,
    view,
    open,
    render,
    isOpen,
    showTooltip,
    applyRemote(v) {
      remote = v && Array.isArray(v.items) ? v : null;
      render();
    },
    buyAt: index => act({ op: 'shop-buy', index }),
    sellToken: text => act({ op: 'sell-stack', token: text })
  });
})();
