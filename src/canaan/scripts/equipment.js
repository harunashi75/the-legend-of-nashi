// Équipement : équiper, retirer, arme de réserve et changement d'arme.
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
  // Arme liée (le Grimoire de l'Invocateur) : elle ne quitte jamais sa main, et aucune autre arme ne s'équipe.
  function boundLock(hero, slot) {
    if (slot !== 'weapon' && slot !== 'weapon2') return false;
    const pact = hero.equipment.weapon;
    if (!isBoundItem(pact)) return false;
    canaanLootNotice(hero, '📕 ' + gearDisplayName(pact) + ' est lié à ton âme : aucune autre arme.');
    return true;
  }
  function equipItem(id, hero = game.hero) {
    if (hero === game.hero && remote({ op: 'equip', id: String(id) })) return true;
    if (locked(hero)) return false;
    const index = hero.inventory.findIndex(item => item.id === id);
    if (index < 0) return false;
    const item = hero.inventory[index],
      mana = hero.player.mp,
      previous = hero.equipment[item.slot];
    window.CANAAN_GEAR.normalize(item);
    if (boundLock(hero, item.slot) || tooHigh(item, hero)) return false;
    hero.inventory.splice(index, 1);
    if (previous) hero.inventory.splice(index, 0, previous);
    hero.equipment[item.slot] = item;
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
  function equipReserveWeapon(index, hero = game.hero) {
    if (hero === game.hero && game.mode === 'guest') {
      const id = hero.inventory[index]?.id;
      return id !== undefined && remote({ op: 'reserve', id: String(id) });
    }
    if (locked(hero)) return false;
    const item = hero.inventory[index];
    if (!item || item.slot !== 'weapon' || boundLock(hero, 'weapon2') || tooHigh(item, hero)) return false;
    const mana = hero.player.mp,
      previous = hero.equipment.weapon2;
    hero.inventory.splice(index, 1);
    if (previous) hero.inventory.splice(index, 0, previous);
    hero.equipment.weapon2 = item;
    finishChange(hero, mana, false);
    canaanLootNotice(hero, '🔁 Arme 2 équipée : ' + gearDisplayName(item));
    return true;
  }
  // Changement d'arme de l'hôte (touche) ; pour un invité en ligne, l'hôte l'exécute avec switchHeroWeapon.
  function switchWeapon() {
    if (
      !started ||
      paused ||
      P.dead ||
      playerStun > 0 ||
      document.getElementById('dialog').style.display === 'block'
    )
      return false;
    if (!game.hero.equipment.weapon2) {
      toast('🔁 Équipe une deuxième arme depuis ton inventaire !');
      return false;
    }
    if (remote({ op: 'switch' })) return true;
    return switchHeroWeapon(game.hero);
  }
  function switchHeroWeapon(hero) {
    if (hero.player.dead || !hero.equipment.weapon2 || boundLock(hero, 'weapon')) return false;
    const mana = hero.player.mp,
      previous = hero.equipment.weapon;
    hero.equipment.weapon = hero.equipment.weapon2;
    hero.equipment.weapon2 = previous;
    finishChange(hero, mana, true, false);
    canaanLootNotice(hero, '⚔️ Arme active : ' + gearDisplayName(hero.equipment.weapon));
    burst(hero.player.x, hero.player.y, '#9de7ff', 14);
    return true;
  }
  // Action d'équipement d'un invité en ligne, déjà mise en forme par sanitizeAction : exécutée sur son héros.
  function heroAction(hero, action) {
    if (!hero || !action) return false;
    if (action.op === 'equip') {
      const item = hero.inventory.find(it => String(it.id) === action.id);
      return !!item && equipItem(item.id, hero);
    }
    if (action.op === 'unequip')
      return Object.hasOwn(hero.equipment, action.slot) && unequip(action.slot, hero);
    if (action.op === 'reserve')
      return equipReserveWeapon(
        hero.inventory.findIndex(it => String(it.id) === action.id),
        hero
      );
    if (action.op === 'switch') return switchHeroWeapon(hero);
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
    unequip,
    reserve: equipReserveWeapon,
    switchWeapon: switchWeapon,
    switchHero: switchHeroWeapon,
    heroAction
  });
  Object.assign(window, { equipItem, unequip, equipReserveWeapon, switchWeapon });
})();
