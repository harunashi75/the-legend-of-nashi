(() => {
  'use strict';
  // Progression par le butin : les créatures lâchent des objets, les coffres de boss d'instance l'équipement
  // de l'instance (et une bourse d'or), les boss mondiaux un objet Rare.

  // Chaque coffre de boss donne à coup sûr la récompense de l'instance,
  // ou celle de la difficulté jouée pour une instance à difficultés.
  function dropTierGear(index, hero = game.hero) {
    const d = instances[index];
    if (!d) return false;
    const reward = d.difficulties
      ? (game.world.instance?.index === index && instanceDifficulty()) || d.difficulties.normal
      : d;
    const rarity = reward.rarity,
      level = reward.dropLevel;
    if (hero.inventory.length >= canaanBagLimit(hero)) {
      canaanLootNotice(hero, '🎒 Sac plein : équipement non récupéré');
      return false;
    }
    const item = window.CANAAN_GEAR.grant(level, 'tier', rarity, hero);
    if (!item) return false;
    // Provenance gardée sur l'objet (sans suffixe dans le nom de l'arme).
    item.origin = d.raid ? 'raid' : 'donjon';
    canaanLootNotice(hero, '✨ Butin : ' + rarity + ' · niveau ' + level);
    saveGame();
    return true;
  }
  Object.assign(window, { dropTierGear });
})();
