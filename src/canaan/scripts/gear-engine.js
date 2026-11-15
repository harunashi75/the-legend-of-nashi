// THE LEGEND OF NASHI — GEAR/LOOT ENGINE UNIQUE (normalize + grant, sauvegarde différée).
// Tables de noms d'armes : source unique WEAPON_NAMES.
// Moteur des objets : normalisation, création, dépôt et conversion en or si le sac est plein.
(function () {
  'use strict';
  const WEAPONS = new Set([
    'sword',
    'dualsword',
    'axe',
    'mace',
    'spear',
    'dualdagger',
    'bow',
    'staff',
    'shield'
  ]);
  function normalizeWeapon(item) {
    if (item.slot !== 'weapon') return;
    if (!WEAPONS.has(item.weaponType)) item.weaponType = 'sword';
  }
  // Normalisation unique : identité, qualité, niveau (1 à 60) et deux secondaires tirées une seule fois.
  // Anciennes sauvegardes : l'iLvl devient un niveau (levelFromIlvl) et les points Ratings52 disparaissent.
  function normalizeItem(item) {
    if (!item || !item.slot) return item;
    // Ancien suffixe des récompenses de boss retiré du nom ; la provenance reste dans item.origin.
    if (typeof item.name === 'string') {
      const old = / — (Héritage du raid|Relique du donjon)$/.exec(item.name);
      if (old) {
        item.name = item.name.slice(0, old.index);
        if (!item.origin) item.origin = old[1] === 'Héritage du raid' ? 'raid' : 'donjon';
      }
    }
    if (!Number.isFinite(Number(item.level)) && Number.isFinite(Number(item.ilvl))) item.level = levelFromIlvl(item.ilvl);
    for (const key of ['ilvl', 'ratings52', '_stats52', '_stats52Ilvl', 'upgrade', 'craftPassive']) delete item[key];
    const originalType = item.weaponType,
      originalName = item.name;
    normalizeWeapon(item);
    // Une rareté absente ou inconnue devient Commun ; Héroïque devient Épique, Céleste devient Mythique.
    item.rarity = rarityInfo(item).name;
    item.level = itemLevel(item);
    const weapon = item.slot === 'weapon';
    // Les noms choisis sont des propriétés persistantes.
    if (weapon && WEAPONS.has(originalType)) item.weaponType = originalType;
    applyItemName(item);
    if (weapon && WEAPONS.has(originalType) && originalName && !/^Lame\s/.test(originalName)) item.name = originalName;
    window.CANAAN_STATS_PREPARE(item);
    // Enchantement enregistré : vérifié (sinon retiré).
    CANAAN_GATHER.cleanItem(item);
    return item;
  }
  // Crée un objet du niveau donné et le dépose dans le sac du héros (l'hôte par défaut) ; sac plein : converti en or.
  // guaranteed : qualité imposée ; sinon selon la source (monstre : Commun ou Peu commun).
  function giveGear(level, source = 'normal', guaranteed = null, hero = game.hero) {
    // createRawGear fournit l'objet brut ; ce moteur le normalise puis le dépose.
    const item = createRawGear(level, source, guaranteed);
    if (!item) return item;
    item.level = clampLevel(level);
    // Sans qualité imposée : monstres et coffres donnent du Commun.
    if (!guaranteed) item.rarity = ['normal', 'chest', 'hidden_common'].includes(source) ? 'Commun' : rarityInfo(item).name;
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) {
      const price = gearSellValue(item);
      hero.player.gold += price;
      canaanLootNotice(hero, '🎒 Sac plein ! Butin converti en ' + price + ' or.');
      window.CANAAN_PERSISTENCE.requestSave();
      return null;
    }
    if (item.slot === 'weapon') {
      const types = [...WEAPONS];
      item.weaponType = types[Math.floor(rnd() * types.length)];
    }
    if (item.slot === 'artifact') item.artifactVariant = Math.floor(rnd() * 3);
    normalizeItem(item);
    hero.inventory.push(item);
    canaanLootNotice(hero, '🎁 ' + item.rarity + ' niv. ' + item.level + ' : ' + item.name);
    // Sauvegarde différée : une seule écriture pour tout un butin, après les ajustements des appelants.
    window.CANAAN_PERSISTENCE.requestSave();
    return item;
  }
  window.CANAAN_GEAR_ENGINE = Object.freeze({
    normalize: normalizeItem,
    grant: giveGear,
    weaponTypes: [...WEAPONS]
  });
  Object.assign(window, { giveGear });
})();
