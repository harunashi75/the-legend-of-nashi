// Équipement : équiper et retirer. L'arme vient de la classe (summons.js) : elle ne se retire ni ne se change.
(function () {
  'use strict';
  // Fin d'un changement : statistiques, mana conservé, barre d'arme et sauvegarde. Pour un invité en ligne,
  // seuls ses PV et son mana maximum sont recalculés ; son application reçoit son nouveau sac de l'hôte.
  function finishChange(hero, mana, weaponChanged, refreshPanel = true) {
    if (hero !== game.hero) {
      const p = hero.player,
        st = characterStats(hero),
        ratio = p.hp / (p.mhp || 1);
      p.mhp = st.maxHp;
      p.hp = Math.max(1, Math.min(p.mhp, Math.round(p.mhp * ratio)));
      if (st.maxMp) p.mmp = st.maxMp;
      p.mp = Math.min(p.mmp, mana);
      return;
    }
    recomputeStats();
    P.mp = Math.min(P.mmp, mana);
    updateCapacity();
    if (weaponChanged) refreshWeaponBar();
    if (refreshPanel) refreshGearPanel();
    saveGame();
  }
  // Arène : l'équipement se prépare avant la tentative.
  function locked(hero) {
    if (!game.world.instance?.arena) return false;
    canaanLootNotice(hero, '🔒 L’équipement se prépare avant d’entrer dans l’Arène.');
    return true;
  }
  // Un invité en ligne ne change rien chez lui : il demande à l'hôte, qui vérifie et renvoie son sac.
  const remote = action => game.mode === 'guest' && CANAAN_NET.requestAction(action);
  // Un objet ne s'équipe qu'à partir de son niveau.
  function tooHigh(item, hero) {
    const need = requiredLevel(item);
    if (need <= clampLevel(hero.level)) return false;
    canaanLootNotice(hero, '🔒 Niveau ' + need + ' requis pour ' + gearDisplayName(item) + '.');
    return true;
  }
  // Arme de classe : elle ne quitte jamais la main, et aucune autre arme ne s'équipe.
  function boundLock(hero, slot) {
    if (slot !== 'weapon') return false;
    const pact = hero.equipment.weapon;
    canaanLootNotice(
      hero,
      pact
        ? weaponIcon(pact) +
            ' ' +
            tt('{nom} est l’arme de ta classe : aucune autre arme.', { nom: tt(gearDisplayName(pact)) })
        : tt('Ton arme vient de ta classe (T).')
    );
    return true;
  }
  // Emplacement où va un objet : le sien ; une bague va dans la bague demandée (ring ou ring2), sinon dans la
  // première libre, sinon à la place de la première.
  function equipSlotFor(item, hero = game.hero, wanted = null) {
    if (item?.slot !== 'ring') return item?.slot;
    if (wanted === 'ring' || wanted === 'ring2') return wanted;
    return hero.equipment.ring && !hero.equipment.ring2 ? 'ring2' : 'ring';
  }
  function equipItem(id, hero = game.hero, wanted = null) {
    if (hero === game.hero && remote({ op: 'equip', id: String(id), ...(wanted ? { slot: wanted } : {}) }))
      return true;
    if (locked(hero)) return false;
    const index = hero.inventory.findIndex(item => item.id === id);
    if (index < 0) return false;
    const item = hero.inventory[index],
      slot = equipSlotFor(item, hero, wanted),
      mana = hero.player.mp,
      previous = hero.equipment[slot];
    window.CANAAN_GEAR.normalize(item);
    if (boundLock(hero, item.slot) || tooHigh(item, hero)) return false;
    hero.inventory.splice(index, 1);
    if (previous) hero.inventory.splice(index, 0, previous);
    hero.equipment[slot] = item;
    finishChange(hero, mana, item.slot === 'weapon');
    return true;
  }
  function unequip(slot, hero = game.hero) {
    if (hero === game.hero && remote({ op: 'unequip', slot })) return true;
    if (locked(hero)) return false;
    const item = hero.equipment[slot];
    if (!item || (slot === 'weapon' && boundLock(hero, slot))) return false;
    if (hero === game.hero) updateCapacity();
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) {
      canaanLootNotice(hero, '🎒 Sac plein ! Vends un objet au marchand.');
      return false;
    }
    const mana = hero.player.mp;
    hero.inventory.push(item);
    hero.equipment[slot] = null;
    finishChange(hero, mana, slot === 'weapon');
    return true;
  }
  // Action d'équipement d'un invité en ligne, déjà mise en forme par sanitizeAction : exécutée sur son héros.
  function heroAction(hero, action) {
    if (!hero || !action) return false;
    if (action.op === 'equip') {
      const item = hero.inventory.find(it => String(it.id) === action.id);
      return !!item && equipItem(item.id, hero, action.slot || null);
    }
    if (action.op === 'unequip')
      return Object.hasOwn(hero.equipment, action.slot) && unequip(action.slot, hero);
    return false;
  }
  window.sellInventoryCell = function (index, id, event) {
    event?.stopPropagation();
    event?.preventDefault();
    const item = game.hero.inventory[index];
    if (!item || String(item.id) !== id) {
      toast('Sac modifié : rouvre-le avant de vendre.');
      return false;
    }
    if (!nearMerchant()) {
      toast('💰 Va voir un marchand pour vendre !');
      return false;
    }
    // Vente : l'objet doit toujours être à sa place (le sac a pu changer pendant la confirmation).
    const sell = () => {
      const now = game.hero.inventory[index];
      if (!now || String(now.id) !== id || !nearMerchant()) return false;
      hideGearTooltip();
      sellBagIndex(index);
      return true;
    };
    // Légendaire ou mieux : la fenêtre de confirmation du jeu demande d'abord.
    if (rarityInfo(item).mult >= rarityInfo({ rarity: 'Légendaire' }).mult) {
      canaanConfirm(
        'Vendre ' +
          gearDisplayName(item) +
          ' (' +
          item.rarity +
          ', niveau ' +
          itemLevel(item) +
          ') pour ' +
          gearSellValue(item) +
          ' or ?',
        sell,
        { title: '💰 Vendre un objet précieux', yes: 'Vendre', no: 'Garder' }
      );
      return false;
    }
    return sell();
  };
  window.CANAAN_EQUIPMENT = Object.freeze({
    equip: equipItem,
    slotFor: equipSlotFor,
    unequip,
    heroAction
  });
  // Pièce portée à laquelle comparer un objet (info-bulles) : celle qu'il remplacerait.
  const wornAgainst = (item, hero = game.hero) =>
    item ? hero.equipment[equipSlotFor(item, hero)] || null : null;
  // Pièce du sac meilleure que celle portée à sa place (repère ▲ du sac, pastille du bouton, conseil de Lumi) :
  // portable dès maintenant et plus forte par son niveau et sa qualité, ou pour un emplacement vide. Une arme ne
  // compte que du même type que celle en main (changer de type change les compétences), jamais à côté d'une arme liée.
  function gearUpgrade(item, hero = game.hero) {
    if (!item?.slot || requiredLevel(item) > clampLevel(hero.level)) return false;
    const worn = wornAgainst(item, hero);
    if (!worn) return true;
    if (item.slot === 'weapon' && (isBoundItem(worn) || worn.weaponType !== item.weaponType)) return false;
    return statBase(item.level ?? 1, item.rarity) > statBase(worn.level ?? 1, worn.rarity) + 1e-6;
  }
  Object.assign(window, { equipItem, unequip, wornAgainst, gearUpgrade });
})();
