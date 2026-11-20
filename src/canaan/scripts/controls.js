// Actions d'interface autorisées : délégation pour les panneaux reconstruits dynamiquement.
// Chaque bouton nomme une action dans data-action ; ses arguments sont des attributs data-* nommés.
// Les fonctions du jeu sont résolues au clic, jamais capturées au chargement.
// Les arguments sont validés avant tout effet.
(() => {
  function actionInteger(element, key) {
    const value = Number(element.dataset[key]);
    if (!Number.isInteger(value))
      throw new Error('Argument d’action invalide : data-' + key + '="' + element.dataset[key] + '"');
    return value;
  }
  function actionText(element, key) {
    const value = element.dataset[key];
    if (typeof value !== 'string' || !/^[a-zA-Z_][\w-]*$/.test(value))
      throw new Error('Argument d’action invalide : data-' + key + '="' + value + '"');
    return value;
  }
  // La cible d'un événement peut être un nœud texte ou le document (panneau reconstruit sous la souris).
  function eventClosest(event, selector) {
    let node = event.target;
    if (node && node.nodeType === 3) node = node.parentElement;
    return node && typeof node.closest === 'function' ? node.closest(selector) : null;
  }
  const CANAAN_ACTIONS = Object.freeze({
    togglePause: () => togglePause(),
    resume: () => togglePause(false),
    pauseSave: () => pauseSave(),
    pauseOpenPanel: element => pauseOpenPanel(actionText(element, 'panel')),
    pauseToTitle: () => pauseToTitle(),
    startGame: () => startGame(),
    playSlot: element => CANAAN_SLOT_MENU.play(actionInteger(element, 'slot')),
    newSlot: element => CANAAN_SLOT_MENU.newSlot(actionInteger(element, 'slot')),
    createSlot: element => CANAAN_SLOT_MENU.create(actionInteger(element, 'slot')),
    askDeleteSlot: element => CANAAN_SLOT_MENU.askDelete(actionInteger(element, 'slot')),
    confirmDeleteSlot: element => CANAAN_SLOT_MENU.remove(actionInteger(element, 'slot')),
    cancelSlotMenu: () => CANAAN_SLOT_MENU.cancel(),
    openSaveFolder: () => CANAAN_SLOT_MENU.openFolder(),
    toggleGroup: () => toggleGroup(),
    toggleTrade: () => toggleTrade(),
    toggleProfessions: () => toggleProfessions(),
    profTab: element => CANAAN_PROF.actions.tab(actionText(element, 'tab')),
    profCook: element =>
      CANAAN_PROF.actions.cook(actionText(element, 'recipe'), actionInteger(element, 'quality'), 1),
    profCookAll: element =>
      CANAAN_PROF.actions.cook(actionText(element, 'recipe'), actionInteger(element, 'quality'), 20),
    profCodex: element => CANAAN_PROF.actions.codex(actionText(element, 'kind')),
    profEat: element =>
      CANAAN_PROF.actions.eat(actionText(element, 'recipe'), actionInteger(element, 'quality')),
    tradeRequest: element => CANAAN_TRADE.actions.request(actionText(element, 'hero')),
    tradeAnswer: element => CANAAN_TRADE.actions.answer(actionText(element, 'answer') === 'yes'),
    tradeCancel: () => CANAAN_TRADE.actions.cancel(),
    tradeReady: () => CANAAN_TRADE.actions.ready(),
    tradeAdd: element => CANAAN_TRADE.actions.add(actionInteger(element, 'index')),
    tradeAddId: element => CANAAN_TRADE.actions.addId(element.dataset.id),
    tradeRemove: element => CANAAN_TRADE.actions.remove(actionInteger(element, 'index')),
    tradeGold: () => CANAAN_TRADE.actions.gold(),
    groupCreate: () => CANAAN_GROUP.actions.create(),
    groupJoin: element => CANAAN_GROUP.actions.join(actionText(element, 'guest')),
    groupLeave: element => CANAAN_GROUP.actions.leave(actionText(element, 'guest')),
    groupEquip: element => CANAAN_GROUP.actions.equip(actionText(element, 'guest')),
    groupAskRemove: element => CANAAN_GROUP.actions.askRemove(actionText(element, 'guest')),
    groupRemove: element => CANAAN_GROUP.actions.remove(actionText(element, 'guest')),
    groupCancel: () => CANAAN_GROUP.actions.cancel(),
    groupOpenRoom: () => CANAAN_GROUP.actions.openRoom(),
    groupCloseRoom: () => CANAAN_GROUP.actions.closeRoom(),
    groupOpenTailscale: () => CANAAN_GROUP.actions.openTailscale(),
    groupOpenLan: () => CANAAN_GROUP.actions.openLan(),
    groupCloseInternet: () => CANAAN_GROUP.actions.closeInternet(),
    groupCopyInvitation: () => CANAAN_GROUP.actions.copyInvitation(),
    netJoinForm: () => CANAAN_SLOT_MENU.joinForm(),
    lookSet: element => CANAAN_SLOT_MENU.lookSet(actionText(element, 'key'), actionInteger(element, 'index')),
    lookRandom: () => CANAAN_SLOT_MENU.lookRandom(),
    classSet: element => CANAAN_SLOT_MENU.classSet(actionText(element, 'class')),
    lookTurn: element => CANAAN_SLOT_MENU.lookTurn(actionInteger(element, 'dir')),
    lookEditJoin: () => CANAAN_SLOT_MENU.lookEditJoin(),
    lookSaveJoin: () => CANAAN_SLOT_MENU.lookSaveJoin(),
    lookBack: () => CANAAN_SLOT_MENU.lookBack(),
    netJoin: () => CANAAN_SLOT_MENU.join(),
    restartFresh: () => CANAAN_PERSISTENCE.restartFresh(),
    toggleTalents: () => toggleTalents(),
    toggleJournal: () => toggleJournal(),
    toggleAchievements: () => toggleAchievements(),
    // Collections (V) : ouvrir, changer d'onglet ; la Garde-robe seule (son onglet).
    toggleCollections: () => toggleCollections(),
    collectionsTab: element => canaanCollections(actionText(element, 'tab')),
    toggleWardrobe: () => toggleWardrobe(),
    // Cité elfique : écouter le Grand Arbre, sa bénédiction, l'armurerie et l'atelier de la Tisseuse.
    cityTreeTalk: () => CANAAN_CITY.actions.talk(),
    cityBless: () => CANAAN_CITY.actions.bless(),
    cityBuySkin: element => CANAAN_CITY.actions.buySkin(actionText(element, 'skin')),
    // Extensions : un bouton de leurs fenêtres (data-ext, data-act, data-id).
    extAction: element =>
      CANAAN_EXT.ui(actionText(element, 'ext'), actionText(element, 'act'), element.dataset.id || null),
    wearSkin: element =>
      CANAAN_WARDROBE.choose(
        element.dataset.skin && /^[a-z_]{2,32}$/.test(element.dataset.skin) ? element.dataset.skin : ''
      ),
    wardrobePick: element =>
      CANAAN_WARDROBE.pick(
        element.dataset.skin && /^[a-z_]{2,32}$/.test(element.dataset.skin) ? element.dataset.skin : ''
      ),
    achCat: element => CANAAN_ACHIEVEMENTS.actions.cat(actionText(element, 'cat')),
    achTitle: element => CANAAN_ACHIEVEMENTS.actions.title(actionText(element, 'title')),
    questTab: element => questTab(actionText(element, 'tab')),
    questTrack: element => questTrack(actionInteger(element, 'quest')),
    questAccept: element => questAccept(actionInteger(element, 'quest')),
    questTurnIn: element => questTurnIn(actionInteger(element, 'quest')),
    questChoice: element => questChoice(actionInteger(element, 'quest'), actionInteger(element, 'choice')),
    questTrade: element => questTrade(actionText(element, 'npc')),
    questShells: () => questShells(),
    toggleInventory: () => toggleInventory(),
    toggleCharacter: () => toggleCharacter(),
    toggleMap: () => toggleMap(),
    openSettings: () => openSettings(),
    closeSettings: () => closeSettings(),
    settingsToggle: element => settingsToggle(actionText(element, 'key')),
    settingsStep: element => settingsStep(actionText(element, 'key'), actionInteger(element, 'step')),
    settingsRestart: () => settingsRestart(),
    settingsTab: element => settingsTab(actionText(element, 'tab')),
    keybindCapture: element => keybindCapture(actionText(element, 'bind'), actionInteger(element, 'slot')),
    keybindReset: () => keybindReset(),
    quitGame: () => quitGame(),
    mapZoom: element => CANAAN_MAP.zoom(actionInteger(element, 'step')),
    mapCenter: () => CANAAN_MAP.center(),
    mapFit: () => CANAAN_MAP.fit(),
    mapFocus: element => CANAAN_MAP.focus(actionInteger(element, 'x'), actionInteger(element, 'y')),
    enterInstance: element =>
      enterInstance(
        actionInteger(element, 'instance'),
        element.dataset.difficulty === undefined ? null : actionText(element, 'difficulty')
      ),
    buyBagUpgrade: () => buyBagUpgrade(),
    buyShovel: () => CANAAN_DIG.buyMine(),
    hideGearTooltip: () => hideGearTooltip(),
    equipBagIndex: element => {
      const index = actionInteger(element, 'index');
      hideGearTooltip();
      equipBagIndex(index);
    },
    sellInventoryCell: (element, event) =>
      sellInventoryCell(actionInteger(element, 'index'), element.dataset.itemId, event),
    equipReserve: (element, event) => {
      const index = actionInteger(element, 'index');
      event.stopPropagation();
      equipReserveWeapon(index);
    },
    sellAllCommon: () => sellAllCommon(),
    // Sac unifié et boutique : utiliser une pile (Rubis, repas), acheter au marchand, vendre une pile.
    useBagStack: element => CANAAN_BAG.use(element.dataset.token),
    shopBuy: element => CANAAN_SHOP.buyAt(actionInteger(element, 'index')),
    shopSellStack: element => CANAAN_SHOP.sellToken(element.dataset.token),
    // Enchanteur (panneau P) : statistique, création, enchantement choisi, pièce à enchanter.
    enchantStat: element => CANAAN_GATHER.actions.stat(element.dataset.stat),
    enchantCraft: element =>
      CANAAN_GATHER.actions.craft(
        element.dataset.stat,
        actionInteger(element, 'tier'),
        element.dataset.count ? actionInteger(element, 'count') : 1
      ),
    enchantPick: element => CANAAN_GATHER.actions.pick(element.dataset.token),
    enchantApply: element => CANAAN_GATHER.actions.apply(element.dataset.ref),
    enchantReroll: element => CANAAN_GATHER.actions.reroll(element.dataset.ref),
    // Démantèlement et sacoche de butin (salvage.js).
    salvageItem: (element, event) => {
      event?.stopPropagation();
      CANAAN_SALVAGE.salvageMine(element.dataset.id);
    },
    satchelTake: element => CANAAN_SALVAGE.takeMine(element.dataset.id),
    bankDeposit: element => CANAAN_BANK.depositRef(element.dataset.ref),
    bankWithdraw: element => CANAAN_BANK.withdrawRef(element.dataset.ref),
    unequip: element => {
      const slot = actionText(element, 'slot');
      hideGearTooltip();
      unequip(slot);
    },
    renderInventory: () => renderInventory(),
    sortBag: () => canaanSortBag(),
    renderCharacter: () => renderCharacter(),
    characterSection: element => canaanCharacterSection(actionText(element, 'tab')),
    chooseClass: element => chooseClass(actionText(element, 'class')),
    equipTalent: element => equipTalent(actionInteger(element, 'talent')),
    unequipTalent: element => unequipTalent(actionInteger(element, 'talent')),
    pickClass: element => pickClass(actionInteger(element, 'open')),
    classPage: element => classPage(actionInteger(element, 'step')),
    classPageTo: element => classPageTo(actionInteger(element, 'page')),
    buyGear: () => buyGear(),
    equipRubis: element => equipRubis(actionText(element, 'rubis')),
    toggleRubis: element => {
      hideGearTooltip();
      toggleRubis(actionText(element, 'rubis'));
    },
    unequipRubis: element => {
      hideGearTooltip();
      unequipRubis(actionInteger(element, 'slot'));
    },
    enterArena: () => enterArena(),
    claimArenaRubis: element => claimArenaRubis(actionText(element, 'rubis')),
    closePanels: () => closePanels()
  });
  // Invité en ligne : son héros vit chez l'hôte, qui exécute ses changements d'équipement, de classe et de talents, de Rubis,
  // ses ventes et ses achats. Les actions qui modifieraient le monde de l'hôte (Arène, instances, groupe) sont refusées.
  const GUEST_BLOCKED = new Set([
    'pauseSave',
    'groupCreate',
    'groupJoin',
    'groupLeave',
    'groupEquip',
    'groupAskRemove',
    'groupRemove',
    'groupOpenRoom',
    'groupOpenTailscale',
    'groupOpenLan',
    'groupCloseInternet',
    'restartFresh',
    'enterInstance',
    'enterArena',
    'claimArenaRubis'
  ]);
  window.CANAAN_GUEST_BLOCKED = GUEST_BLOCKED;
  function dispatchCanaanAction(element, event) {
    const name = element.dataset.action;
    if (!Object.hasOwn(CANAAN_ACTIONS, name)) throw new Error('Action inconnue : ' + name);
    if (game.mode === 'guest' && GUEST_BLOCKED.has(name)) {
      toast('🌐 Invité : seul l’hôte peut faire cela pour l’instant.');
      return;
    }
    CANAAN_ACTIONS[name](element, event);
  }
  document.addEventListener('click', event => {
    const element = eventClosest(event, '[data-action]');
    if (element && !element.disabled) dispatchCanaanAction(element, event);
  });

  // Barre des compétences : un clic sur une case lance la compétence correspondante.
  document.getElementById('skills').addEventListener('click', event => {
    const slot = eventClosest(event, '[data-skill]');
    if (slot) useSkill(Number(slot.dataset.skill));
  });

  // Chaque doigt possède sa direction ; lever un doigt ne relâche pas les autres.
  const touchDirections = new Map();
  function clearTouchControls() {
    touchDirections.clear();
    syncTouchDirections();
  }
  function syncTouchDirections() {
    for (const key of ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'])
      keys[key] = [...touchDirections.values()].includes(key);
  }
  function touchGameActive() {
    return (
      started &&
      !paused &&
      !P.dead &&
      !modalOpen() &&
      document.getElementById('dialog').style.display !== 'block'
    );
  }
  function aimTouchAttack() {
    const target = game.world.monsters
      .filter(m => m.hp > 0)
      .sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
    mouseWorldX = target ? target.x : P.x + (P.face < 0 ? -100 : 100);
    mouseWorldY = target ? target.y : P.y;
  }
  const touchRoot = document.getElementById('touchControls');
  touchRoot.addEventListener('pointerdown', event => {
    const button = eventClosest(event, 'button');
    if (!button || !touchGameActive()) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (button.dataset.direction) {
      touchDirections.set(event.pointerId, button.dataset.direction);
      syncTouchDirections();
    } else if (button.dataset.skill !== undefined) {
      aimTouchAttack();
      useSkill(Number(button.dataset.skill));
    } else if (button.dataset.touchAction === 'attack') {
      // Attaque de base sans mana, visant le monstre le plus proche.
      aimTouchAttack();
      canaanBasicAttack(false);
    } else if (button.dataset.touchAction === 'interact') interact();
    else if (button.dataset.touchAction === 'switch') switchWeapon();
    else if (button.dataset.touchAction === 'dodge') {
      const dx = (keys.arrowright ? 1 : 0) - (keys.arrowleft ? 1 : 0),
        dy = (keys.arrowdown ? 1 : 0) - (keys.arrowup ? 1 : 0);
      canaanDodge(dx, dy);
    }
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
    touchRoot.addEventListener(name, event => {
      touchDirections.delete(event.pointerId);
      syncTouchDirections();
    });
  addEventListener('blur', clearTouchControls);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTouchControls();
  });
  // Ne jamais conserver une direction au retour d'un menu ou de la pause.
  CanaanStages.updateTouchControls = () => {
    if (!touchGameActive()) clearTouchControls();
  };

  // Survol délégué : les événements pointerover/out remontent depuis les panneaux dynamiques.
  const CANAAN_HOVER_SELECTOR =
    '[data-tooltip-index],[data-tooltip-slot],[data-tooltip-rubis],[data-tooltip-skill],[data-tooltip-stack],[data-tooltip-shop],[data-tooltip-trade],[data-tooltip-bank],[data-tooltip-satchel],[data-map-instance]';
  function canaanHover(event, enter) {
    const element = eventClosest(event, CANAAN_HOVER_SELECTOR);
    if (!element || (event.relatedTarget && element.contains(event.relatedTarget))) return;
    if (element.dataset.mapInstance !== undefined)
      highlightMapInstance(Number(element.dataset.mapInstance), enter);
    else if (!enter) hideGearTooltip();
    else if (element.dataset.tooltipSkill !== undefined)
      showSkillTooltip(element.dataset.tooltipSkill, event);
    else if (element.dataset.tooltipStack !== undefined)
      CANAAN_BAG.showTooltip(element.dataset.tooltipStack, event);
    else if (element.dataset.tooltipShop !== undefined)
      CANAAN_SHOP.showTooltip(Number(element.dataset.tooltipShop), event);
    else if (element.dataset.tooltipTrade !== undefined)
      CANAAN_TRADE.showTooltip(element.dataset.tooltipTrade, event);
    else if (element.dataset.tooltipBank !== undefined)
      CANAAN_BANK.showTooltip(element.dataset.tooltipBank, event);
    else if (element.dataset.tooltipSatchel !== undefined)
      CANAAN_SALVAGE.showTooltip(element.dataset.tooltipSatchel, event);
    else if (element.dataset.tooltipRubis !== undefined)
      showRubisTooltip(element.dataset.tooltipRubis, event);
    else if (element.dataset.tooltipIndex !== undefined)
      showGearTooltip(Number(element.dataset.tooltipIndex), event);
    else showEquippedTooltip(element.dataset.tooltipSlot, event);
  }
  document.addEventListener('pointerover', event => canaanHover(event, true));
  document.addEventListener('pointerout', event => canaanHover(event, false));
  document.addEventListener('pointermove', event => {
    if (
      eventClosest(
        event,
        '[data-tooltip-index],[data-tooltip-slot],[data-tooltip-rubis],[data-tooltip-skill],[data-tooltip-stack],[data-tooltip-shop],[data-tooltip-trade],[data-tooltip-bank],[data-tooltip-satchel]'
      )
    )
      moveGearTooltip(event);
  });
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, { dispatchCanaanAction, clearTouchControls });
})();
