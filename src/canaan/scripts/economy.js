(() => {
  'use strict';
  // Progression par le butin : les créatures lâchent des objets, les coffres de boss d'instance l'équipement
  // de l'instance (et une bourse d'or), les boss mondiaux un objet Rare.

  // Chaque coffre de boss donne à coup sûr la récompense de l'instance,
  // ou celle de la difficulté jouée pour une instance à difficultés.
  function dropTierGear(index, hero = game.hero) {
    const d = instances[index];
    if (!d) return false;
    // Niveau de l'objet : entre le niveau requis de l'instance et son niveau de butin (7 à 10 pour la Cave),
    // pour pouvoir porter tout de suite ce qu'on y gagne. Mode héroïque du dernier raid : chance de prestige.
    // Donjon des Tréfonds : un objet du niveau du héros. Règle : instanceLoot (shared/rules/economy.js).
    const difficulty = d.difficulties ? game.world.instance?.index === index && instanceDifficulty() : null,
      { level, rarity, origin } = instanceLoot(d, difficulty, hero.level, Math.random);
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) {
      canaanLootNotice(hero, '🎒 Sac plein : équipement non récupéré');
      return false;
    }
    const item = window.CANAAN_GEAR.grant(level, 'tier', rarity, hero);
    if (!item) return false;
    // Provenance gardée sur l'objet (sans suffixe dans le nom de l'arme).
    item.origin = origin;
    canaanLootNotice(
      hero,
      (rarity === 'Légendaire' || rarity === 'Mythique'
        ? '🌟 BUTIN ' + rarity.toUpperCase() + ' ! '
        : '✨ Butin : ' + rarity + ' · ') +
        'niveau ' +
        level
    );
    saveGame();
    return true;
  }
  // Qualité de prestige tirée pour un butin (null : la qualité normale de la source).
  const prestigeRoll = kind => rollPrestige(kind, Math.random);
  Object.assign(window, { dropTierGear, prestigeRoll });
})();
