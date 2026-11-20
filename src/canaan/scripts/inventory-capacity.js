(() => {
  'use strict';
  // Places et prix des neuf agrandissements du sac : shared/data/economy.js (BAG_BASE, BAG_STEP, BAG_PRICES) et
  // shared/rules/economy.js (bagSlots). Ils s'achètent chez le marchand
  // (colonne Marchandise de la boutique), plus dans le sac.
  let bagLevelCore = 0;
  // Invité en ligne : la capacité de son sac vient de l'hôte (game.hero.bagLimit), pas des agrandissements locaux.
  window.updateCapacity = function () {
    if (game.mode === 'guest' && Number.isInteger(game.hero.bagLimit)) {
      BAG_LIMIT = game.hero.bagLimit;
      return;
    }
    BAG_LIMIT = Math.max(
      bagSlots(bagLevelCore),
      Math.min(bagSlots(BAG_MAX_LEVEL), game.hero.inventory.length)
    );
  };

  updateCapacity();
  // Agrandir le sac d'un allié (invité en ligne, à sa demande) : mêmes places et mêmes prix que l'hôte.
  window.buyBagUpgradeFor = function (hero) {
    if (hero === game.hero) return false;
    const level = canaanBagLevel(hero);
    if (level >= BAG_MAX_LEVEL) {
      canaanLootNotice(hero, '🎒 Ton sac est déjà au maximum !');
      return false;
    }
    const price = BAG_PRICES[level];
    if (hero.player.gold < price) {
      canaanLootNotice(hero, '🪙 Il te manque ' + (price - hero.player.gold) + ' or pour agrandir ton sac.');
      return false;
    }
    hero.player.gold -= price;
    hero.bagLevel = level + 1;
    canaanLootNotice(hero, '🎒 Sac agrandi : ' + canaanBagLimit(hero) + ' emplacements !');
    return true;
  };
  window.buyBagUpgrade = function () {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'bag-upgrade' });
    if (bagLevelCore >= BAG_MAX_LEVEL) {
      toast('🎒 Ton sac est déjà au maximum !');
      return;
    }
    const price = BAG_PRICES[bagLevelCore];
    if (P.gold < price) {
      toast('🪙 Il te manque ' + (price - P.gold) + ' or pour agrandir ton sac.');
      return;
    }
    P.gold -= price;
    bagLevelCore++;
    updateCapacity();
    saveGame();
    if (CANAAN_SHOP.isOpen()) CANAAN_SHOP.render();
    else renderInventory();
    toast('🎒 Sac agrandi : ' + BAG_LIMIT + ' emplacements !');
  };

  // Invité en ligne : le niveau de son sac vient de l'hôte (game.hero.bagLevel).
  window.CANAAN_BAG_VIEW = () => {
    if (game.mode !== 'guest') return hostView();
    const level = canaanBagLevel(game.hero);
    return { level, capacity: bagSlots(level), price: BAG_PRICES[level], max: level >= BAG_MAX_LEVEL };
  };
  const hostView = () => ({
    level: bagLevelCore,
    capacity: bagSlots(bagLevelCore),
    price: BAG_PRICES[bagLevelCore],
    max: bagLevelCore >= BAG_MAX_LEVEL
  });
  window.CANAAN_BAG_STATE = {
    export: () => bagLevelCore,
    import(level) {
      bagLevelCore = clampBagLevel(level);
      updateCapacity();
    }
  };
})();
