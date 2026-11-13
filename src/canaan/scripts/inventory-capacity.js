(() => {
  'use strict';
  // Prix des neuf agrandissements du sac : shared/data/economy.js (BAG_PRICES).
  let bagLevelCore = 0;
  // Invité en ligne : la capacité de son sac vient de l'hôte (game.hero.bagLimit), pas des agrandissements locaux.
  window.updateCapacity = function () {
    if (game.mode === 'guest' && Number.isInteger(game.hero.bagLimit)) {
      BAG_LIMIT = game.hero.bagLimit;
      return;
    }
    BAG_LIMIT = Math.max(10 + bagLevelCore * 10, Math.min(100, game.hero.inventory.length));
  };

  updateCapacity();
  // Agrandir le sac d'un allié (invité en ligne, à sa demande) : 40 places au départ, +10 par achat, 100 au plus.
  window.buyBagUpgradeFor = function (hero) {
    if (hero === game.hero) return false;
    const level = canaanBagLevel(hero);
    if (level >= 9) {
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
    if (bagLevelCore >= 9) {
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
    renderInventory();
    toast('🎒 Sac agrandi : ' + BAG_LIMIT + ' emplacements !');
  };

  // Invité en ligne : le niveau de son sac vient de l'hôte (game.hero.bagLevel).
  window.CANAAN_BAG_VIEW = () => {
    if (game.mode !== 'guest') return hostView();
    const level = canaanBagLevel(game.hero);
    return { level, capacity: 10 + level * 10, price: BAG_PRICES[level], max: level >= 9 };
  };
  const hostView = () => ({
    level: bagLevelCore,
    capacity: 10 + bagLevelCore * 10,
    price: BAG_PRICES[bagLevelCore],
    max: bagLevelCore >= 9
  });
  window.CANAAN_BAG_STATE = {
    export: () => bagLevelCore,
    import(level) {
      bagLevelCore = Math.max(0, Math.min(9, Math.floor(Number(level) || 0)));
      updateCapacity();
    }
  };
})();
