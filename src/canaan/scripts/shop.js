// Boutique d'un marchand (touche E) : deux fenêtres côte à côte, comme dans un MMORPG.
// À gauche, la marchandise, objet par objet (survol : statistiques et comparaison ; un objet acheté est aussitôt
// remplacé par un autre du même genre). À droite, le sac : un clic vend l'objet ou la pile (poissons, viandes, repas…).
// - Marchand du Camp de l'Aurore (et des villages) : un objet Peu commun du niveau du héros pour chaque emplacement et
//   chaque famille d'arme.
// - Thalion, l'armurier de Sylvaëlle : équipement elfique de niveau 60, Rare ou Épique, pour chaque emplacement et
//   chaque famille d'arme.
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
      slots: SLOTS,
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
      return (say(hero, '🗝️ ' + CANAAN_BAG.info(p).name + ' : ne se vend pas.'), false);
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
    return (
      '<div class="shop-item">' +
      canaanGearTile(
        item,
        'data-tooltip-shop="' +
          i +
          '" data-action="shopBuy" data-index="' +
          i +
          '" title="Acheter ' +
          esc(gearDisplayName(item)) +
          '"',
        true
      ) +
      '<span class="shop-price' +
      (P.gold < price ? ' poor' : '') +
      '">🪙 ' +
      price +
      '</span></div>'
    );
  }
  // Sac du joueur dans la boutique : un clic vend (équipement ou pile) ; une pile qui ne se vend pas (clés des
  // secrets) reste visible, sans action de vente.
  function bagSide() {
    return canaanBagColumn(game.hero, {
      gearAttrs: (item, i) =>
        'data-tooltip-index="' +
        i +
        '" data-action="sellInventoryCell" data-index="' +
        i +
        '" data-item-id="' +
        esc(item.id) +
        '" data-menu="gear" title="Vendre ' +
        esc(gearDisplayName(item)) +
        ' pour ' +
        gearSellValue(item) +
        ' or"',
      stackAttrs: p =>
        CANAAN_BAG.sellable(p)
          ? 'data-action="shopSellStack" data-token="' +
            esc(CANAAN_BAG.token(p)) +
            '" data-menu="stack" title="Vendre pour ' +
            CANAAN_BAG.price(p) +
            ' or"'
          : 'title="Ne se vend pas"',
      hint: 'Clic : vendre · Clic droit : options',
      foot:
        '<button type="button" data-action="sellAllCommon">💰 Vendre les objets communs</button>' +
        canaanGoldTag()
    });
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
  // Rayons de la marchandise : un par qualité et par prix (chez l'armurier elfe, Rare puis Épique).
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
          '<h3 class="bag-subhead" style="color:' +
          rarityInfo({ rarity: g.rarity }).color +
          '">' +
          esc(g.rarity) +
          ' <small>🪙 ' +
          g.price +
          ' · ' +
          g.cells.length +
          '</small></h3><div class="modern-bag shop-stock">' +
          g.cells.join('') +
          '</div>'
      )
      .join('');
  }
  // Fenêtre au modèle du sac (taille md) : la marchandise et les services à gauche, le sac à droite.
  function render() {
    if (!isOpen()) return;
    const s = myStock(),
      shop = SHOPS[s?.kind] || SHOPS.camp,
      elfe = s?.kind === 'elfe';
    shown = signature();
    const name = shop.name || merchant?.name || 'Marchand',
      place = shop.place || merchant?.village || CANAAN_CAMP.name;
    const stock = s
      ? shelvesHTML(s) +
        (elfe ? '' : '<h3 class="bag-subhead">⚒️ Services</h3>' + bagUpgradeHTML() + CANAAN_DIG.shopHTML())
      : '<p class="muted">Approche-toi du marchand pour voir sa marchandise.</p>';
    modernPanel(
      rpgHeader((elfe ? '🏹 ' : '🛍️ ') + esc(name) + ' <small>' + esc(place) + '</small>') +
        '<div class="shop-panel shop-columns npc-panel" data-panel-size="md">' +
        canaanNpcColumn(
          '',
          '⚔️ Marchandise <small>' + (s ? s.items.length : 0) + '</small>',
          s ? esc(shop.intro) : '',
          stock,
          'npc-stock',
          '<span class="muted" title="Pour devenir plus fort, il faut trouver mieux : monstres, boss mondiaux, donjons et raids lâchent des équipements toujours plus puissants.">Clic : acheter · Survol : comparer</span>'
        ) +
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
      (wornAgainst(item) ? gearComparison(item, wornAgainst(item)) : '');
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
