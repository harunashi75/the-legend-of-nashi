// Boutique d'un marchand (touche E) : deux fenêtres côte à côte, comme dans un MMORPG.
// À gauche, la marchandise, objet par objet (survol : statistiques et comparaison ; un objet acheté est aussitôt
// remplacé par un autre du même genre). À droite, le sac : un clic vend l'objet ou la pile (poissons, viandes, repas…).
// Les Rubis, liés au héros, ne se vendent pas.
// - Marchand du Camp de l'Aurore (et des villages) : un objet Peu commun du niveau du héros pour chaque emplacement et
//   chaque famille d'arme.
// - Thalion, l'armurier de Sylvaëlle : équipement elfique de niveau 60, Rare ou Épique, pour chaque emplacement (artefact
//   compris) et chaque famille d'arme.
// L'hôte garde la marchandise de chaque héros et vérifie tout (marchand à portée, or, place) ; un invité reçoit la
// sienne dans son message privé et envoie ses achats et ventes (actions shop-buy et sell-stack).
(() => {
  'use strict';
  const SLOTS = ['helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring'];
  const stocks = new WeakMap();
  const esc = text => safeGearText(text);
  const say = (hero, text) => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  const guest = () => game.mode === 'guest';
  const weapons = () => CANAAN_GEAR_ENGINE.weaponTypes;
  // Un objet de la marchandise : emplacement (et famille d'arme) imposés.
  function make(offer, level, slot, weaponType = null) {
    let item;
    if (offer.source) {
      const raw = createRawGear(level, offer.source, offer.rarity, slot);
      item = { ...raw, id: 'shop' + raw.id, rarity: offer.rarity, level: clampLevel(level) };
      if (offer.origin) item.origin = offer.origin;
      if (slot === 'artifact') item.artifactVariant = Math.floor(Math.random() * 3);
    } else
      item = {
        id: 'shop' + Date.now() + Math.floor(Math.random() * 1e9),
        name: '',
        slot,
        rarity: offer.rarity,
        level: clampLevel(level)
      };
    if (weaponType) item.weaponType = weaponType;
    window.CANAAN_GEAR.normalize(item);
    return item;
  }
  // Les marchands : niveau de la marchandise, offres (qualité et prix) et emplacements proposés.
  const SHOPS = {
    camp: {
      level: hero => heroLevel(hero),
      offers: hero => [{ rarity: 'Peu commun', price: shopPriceAt(heroLevel(hero)) }],
      slots: SLOTS,
      near: hero => nearMerchant(hero),
      intro: 'Équipement Peu commun de ton niveau. Survole un objet pour le comparer, clique pour l’acheter.'
    },
    elfe: {
      level: () => 60,
      offers: () => [
        { rarity: 'Rare', price: 2500, source: 'elfe', origin: 'elfique' },
        { rarity: 'Épique', price: 7500, source: 'elfe', origin: 'elfique' }
      ],
      slots: [...SLOTS, 'artifact'],
      near: hero => CANAAN_CITY.nearArmorer(hero),
      name: 'Thalion, l’armurier',
      place: 'Armurerie de Sylvaëlle',
      intro:
        '« Un équipement taillé par les elfes, de niveau 60. Choisis ta pièce, je m’occupe du reste. » Survole un objet pour le comparer, clique pour l’acheter.'
    }
  };
  // Marchand à portée du héros (l'armurier elfe d'abord : il compte aussi comme marchand pour vendre).
  const which = hero => (SHOPS.elfe.near(hero) ? 'elfe' : SHOPS.camp.near(hero) ? 'camp' : null);
  // Marchandise d'un héros chez un marchand : refaite quand il change de niveau ou que les prix changent.
  function shelf(hero, kind = which(hero) || 'camp') {
    const shop = SHOPS[kind],
      level = shop.level(hero),
      offers = shop.offers(hero),
      key = level + ':' + offers.map(o => o.price).join(',');
    let all = stocks.get(hero);
    if (!all) stocks.set(hero, (all = {}));
    let s = all[kind];
    if (!s || s.key !== key) {
      s = { key, items: [], offers: [] };
      for (const offer of offers) {
        for (const slot of shop.slots) (s.items.push(make(offer, level, slot)), s.offers.push(offer));
        for (const t of weapons()) (s.items.push(make(offer, level, 'weapon', t)), s.offers.push(offer));
      }
      all[kind] = s;
    }
    return s;
  }
  const stock = (hero, kind) => shelf(hero, kind).items;

  // ---------------------------------------------------------------- Hôte : règles
  function buy(hero, index) {
    const kind = which(hero);
    if (!kind) return (say(hero, '🛍️ Va voir un marchand pour acheter.'), false);
    const s = shelf(hero, kind),
      item = s.items[index],
      offer = s.offers[index];
    if (!item) return false;
    if (canaanBagUsed(hero) >= canaanBagLimit(hero))
      return (say(hero, '🎒 Sac plein : vends d’abord un objet.'), false);
    const cost = offer.price;
    if (hero.player.gold < cost) return (say(hero, 'Or insuffisant (' + cost + ' or).'), false);
    hero.player.gold -= cost;
    hero.inventory.push(item);
    // Remplacé par un autre objet du même genre.
    s.items[index] = make(offer, SHOPS[kind].level(hero), item.slot, item.weaponType || null);
    hero.netBag = null;
    hero.netShop = null;
    say(hero, '🛍️ ' + gearDisplayName(item) + ' acheté (' + cost + ' or).');
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function sellStack(hero, text) {
    const p = CANAAN_BAG.parse(text);
    if (!p) return false;
    if (!CANAAN_BAG.sellable(p))
      return (
        say(hero, (p.kind === 'rubis' ? '⟦rune⟧ ' : '🗝️ ') + CANAAN_BAG.info(p).name + ' : ne se vend pas.'),
        false
      );
    if (!nearMerchant(hero)) return (say(hero, '💰 Va voir un marchand pour vendre !'), false);
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
    const kind = which(hero);
    if (!kind) return null;
    const s = shelf(hero, kind);
    return { kind, items: s.items, prices: s.offers.map(o => o.price) };
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
      '<div class="shop-item"><button type="button" class="bag-cell"' +
      canaanPrestige(item) +
      ' style="border-color:' +
      rarity.color +
      ';--rarity:' +
      rarity.color +
      '" data-tooltip-shop="' +
      i +
      '" data-action="shopBuy" data-index="' +
      i +
      '" title="Acheter ' +
      esc(gearDisplayName(item)) +
      '">' +
      '<span class="bag-icon">' +
      icon +
      '</span><span class="bag-name">' +
      esc(gearDisplayName(item)) +
      '</span><span class="bag-ilvl">' +
      itemLevel(item) +
      '</span></button>' +
      '<span class="shop-price' +
      (P.gold < price ? ' poor' : '') +
      '">🪙 ' +
      price +
      '</span></div>'
    );
  }
  // Sac du joueur dans la boutique : un clic vend (équipement ou pile).
  function bagSide() {
    const hero = game.hero,
      gear = hero.inventory.map((item, i) => {
        const rarity = rarityInfo(item),
          icon = weaponIcon(item) || itemIcon[item.slot];
        return (
          '<div class="bag-sale-wrap"><button type="button" class="bag-cell"' +
          canaanPrestige(item) +
          ' style="border-color:' +
          rarity.color +
          ';--rarity:' +
          rarity.color +
          '" data-tooltip-index="' +
          i +
          '" data-action="sellInventoryCell" data-index="' +
          i +
          '" data-item-id="' +
          esc(item.id) +
          '" title="Vendre ' +
          esc(gearDisplayName(item)) +
          ' pour ' +
          gearSellValue(item) +
          ' or">' +
          '<span class="bag-icon">' +
          icon +
          '</span><span class="bag-name">' +
          esc(gearDisplayName(item)) +
          '</span><span class="bag-ilvl">' +
          itemLevel(item) +
          '</span></button></div>'
        );
      }),
      // Une pile qui ne se vend pas (clés des secrets) reste visible, sans action de vente.
      sell = p =>
        '<div class="bag-sale-wrap">' +
        (CANAAN_BAG.sellable(p)
          ? CANAAN_BAG.cell(
              p,
              'data-action="shopSellStack" data-token="' +
                esc(CANAAN_BAG.token(p)) +
                '" title="Vendre pour ' +
                CANAAN_BAG.price(p) +
                ' or"'
            )
          : CANAAN_BAG.cell(p, 'title="Ne se vend pas"')) +
        '</div>',
      stacks = CANAAN_BAG.tiles(hero, 'main').map(sell),
      mats = CANAAN_BAG.tiles(hero, 'mat').map(sell),
      empty = Math.max(0, canaanBagLimit(hero) - gear.length - stacks.length);
    return (
      '<section class="shop-side bag-side"><h3>⟦menu_inventory⟧ Ton sac · ' +
      (gear.length + stacks.length) +
      ' / ' +
      canaanBagLimit(hero) +
      '</h3>' +
      '<p class="muted">Clique un objet pour le vendre. Or : <b>🪙 ' +
      Math.floor(P.gold) +
      '</b></p>' +
      '<div class="modern-bag">' +
      gear.join('') +
      stacks.join('') +
      Array.from(
        { length: empty },
        () =>
          '<div class="bag-sale-wrap"><div class="bag-cell empty"><span class="bag-icon">＋</span></div></div>'
      ).join('') +
      '</div>' +
      '<h3 class="bag-subhead">⟦prof_mining⟧ Matériaux · ' +
      mats.length +
      ' / ' +
      CANAAN_BAG.MAT_LIMIT +
      '</h3>' +
      (mats.length
        ? '<div class="modern-bag">' + mats.join('') + '</div>'
        : '<p class="muted">Aucun matériau.</p>') +
      '<div class="modern-foot"><button type="button" data-action="sellAllCommon">💰 Vendre les objets communs</button></div></section>'
    );
  }
  let shown = '';
  const signature = () =>
    JSON.stringify([
      myStock()?.kind,
      myStock()?.items?.map(i => i.id),
      game.hero.inventory.map(i => i.id),
      CANAAN_BAG.tiles(game.hero).map(p => CANAAN_BAG.token(p)),
      Math.floor(P.gold),
      canaanBagLimit(game.hero),
      CANAAN_DIG.has(game.hero)
    ]);
  // Rayons de la marchandise : un par qualité (chez l'armurier elfe, Rare puis Épique), avec leur prix.
  function shelvesHTML(s) {
    const groups = [];
    s.items.forEach((it, i) => {
      const last = groups.at(-1);
      if (last && last.rarity === it.rarity && last.price === s.prices[i])
        last.cells.push(stockCell(it, i, s.prices[i]));
      else groups.push({ rarity: it.rarity, price: s.prices[i], cells: [stockCell(it, i, s.prices[i])] });
    });
    return groups
      .map(
        g =>
          (groups.length > 1
            ? '<h3 class="bag-subhead" style="color:' +
              rarityInfo({ rarity: g.rarity }).color +
              '">' +
              esc(g.rarity) +
              ' · 🪙 ' +
              g.price +
              '</h3>'
            : '') +
          '<div class="modern-bag shop-stock">' +
          g.cells.join('') +
          '</div>'
      )
      .join('');
  }
  function render() {
    if (!isOpen()) return;
    const s = myStock(),
      shop = SHOPS[s?.kind] || SHOPS.camp,
      elfe = s?.kind === 'elfe';
    shown = signature();
    const name = shop.name || merchant?.name || 'Marchand';
    showPanel(
      '<div class="rpg-head"><h2>' +
        (elfe ? '🏹 ' : '🛍️ ') +
        esc(name) +
        '</h2></div><div class="shop-panel shop-columns">' +
        '<section class="shop-side"><h3>Marchandise · ' +
        esc(shop.place || merchant?.village || CANAAN_CAMP.name) +
        '</h3>' +
        (s
          ? '<p class="muted">' + esc(shop.intro) + '</p>' + shelvesHTML(s)
          : '<p class="muted">Approche-toi du marchand pour voir sa marchandise.</p>') +
        (elfe
          ? ''
          : bagUpgradeHTML() +
            CANAAN_DIG.shopHTML() +
            '<p class="muted">Pour devenir plus fort, il faut trouver mieux : monstres, boss mondiaux, donjons et raids lâchent des équipements toujours plus puissants.</p>') +
        '</section>' +
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
      remote =
        v && Array.isArray(v.items) && Array.isArray(v.prices) && SHOPS[v.kind]
          ? { kind: v.kind, items: v.items, prices: v.prices }
          : null;
      render();
    },
    buyAt: index => act({ op: 'shop-buy', index }),
    sellToken: text => act({ op: 'sell-stack', token: text })
  });
})();
