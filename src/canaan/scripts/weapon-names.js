(() => {
  'use strict';
  function applyItemName(item) {
    if (!item?.slot) return item;
    const rarity = rarityInfo(item).name;
    if (item.slot === 'weapon') {
      ensureWeaponType(item);
      item.name = WEAPON_NAMES[rarity][item.weaponType];
    } else {
      const entry = GEAR_NAMES[rarity];
      if (item.slot === 'artifact') {
        ensureArtifact(item);
        item.name = entry.artifact[item.artifactVariant];
      } else if (entry[item.slot]) item.name = entry[item.slot];
    }
    return item;
  }
  Object.assign(window, { applyItemName });
})();
