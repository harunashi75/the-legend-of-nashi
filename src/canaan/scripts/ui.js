// Interface du sac et du personnage : un rendu par panneau.
(function () {
  'use strict';
  function prepare(panel) {
    const win = document.getElementById('window');
    win.dataset.canaanPanel = panel;
    win.querySelectorAll('button').forEach(button => {
      if (!button.hasAttribute('type')) button.type = 'button';
    });
  }
  function bagUpgradeHTML() {
    const state = window.CANAAN_BAG_VIEW();
    return (
      '<section class="bag-upgrade"><div><strong>🎒 Capacité du sac : ' +
      state.capacity +
      ' / 100</strong><p>Amélioration permanente : +10 emplacements par achat · ' +
      state.level +
      '/9 améliorations</p></div>' +
      (state.max
        ? '<b class="bag-max">✓ Capacité maximale atteinte</b>'
        : '<button type="button" data-action="buyBagUpgrade" ' +
          (P.gold < state.price ? 'disabled' : '') +
          '>＋ 10 emplacements · 🪙 ' +
          state.price +
          ' or</button>') +
      '</section>'
    );
  }
  function bagCell(item, index, merchant) {
    if (!item) return '<div class="bag-sale-wrap"><div class="bag-cell empty" title="Emplacement vide"><span class="bag-icon">＋</span><span class="bag-name">Vide</span></div></div>';
    const rarity = rarityInfo(item),
      icon = weaponIcon(item) || itemIcon[item.slot] || '💎';
    return (
      '<div class="bag-sale-wrap">' +
      '<button type="button" class="bag-cell' +
      (item.slot === 'weapon' ? ' weapon-cell' : '') +
      '"' +
      canaanPrestige(item) +
      ' style="border-color:' +
      rarity.color +
      ';--rarity:' +
      rarity.color +
      '" data-tooltip-index="' +
      index +
      '" data-action="equipBagIndex" data-index="' +
      index +
      '" title="' +
      safeGearText(gearDisplayName(item)) +
      ' · cliquer pour équiper">' +
      '<span class="bag-icon">' +
      icon +
      '</span><span class="bag-name" style="color:' +
      rarity.color +
      '">' +
      safeGearText(gearDisplayName(item)) +
      '</span><span class="bag-ilvl' +
      (itemLevel(item) > clampLevel(game.hero.level) ? ' too-high' : '') +
      '">' +
      itemLevel(item) +
      '</span></button>' +
      '<button type="button" class="bag-sale" data-item-id="' +
      safeGearText(item.id) +
      '" data-action="sellInventoryCell" data-index="' +
      index +
      '" title="' +
      safeGearText(
        'Vendre ' +
          gearDisplayName(item) +
          ' pour ' +
          gearSellValue(item) +
          ' or' +
          (!merchant ? ' (marchand requis)' : '')
      ) +
      '" ' +
      (!merchant ? 'disabled' : '') +
      '>🪙</button>' +
      (item.slot === 'weapon'
        ? '<button type="button" class="weapon-reserve" data-action="equipReserve" data-index="' +
          index +
          '" title="Équiper cette arme dans le deuxième emplacement (Arme 2)">2</button>'
        : '') +
      '</div>'
    );
  }
  function renderInventory() {
    updateCapacity();
    game.hero.inventory.forEach(item => window.CANAAN_GEAR.normalize(item));
    currentGearPanel = 'inventory';
    hideGearTooltip();
    // Équipement d'abord, puis les piles (Rubis, poissons, viandes, repas), puis les cases libres.
    const merchant = nearMerchant(),
      gear = game.hero.inventory.map((item, i) => bagCell(item, i, merchant)),
      stacks = CANAAN_BAG.tiles(game.hero).map(p => '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, 'data-action="useBagStack" data-token="' + safeGearText(CANAAN_BAG.token(p)) + '"') + '</div>'),
      empty = Math.max(0, BAG_LIMIT - gear.length - stacks.length),
      cells = gear.join('') + stacks.join('') + Array.from({ length: empty }, () => bagCell(null)).join('');
    modernPanel(
      rpgHeader('🎒 Sac — ' + canaanBagUsed(game.hero) + '/' + BAG_LIMIT + ' emplacements') +
        '<div class="modern-body">' +
        '<p class="muted">Survole un objet pour afficher son comparatif. Clique pour l’équiper (un Rubis s’équipe, un repas se mange). ' +
        (merchant
          ? '💰 Marchand proche : vente disponible.'
          : '💰 Pour vendre, rends-toi chez un marchand et appuie sur E.') +
        '</p>' +
        '<p class="weapon-hint">⚔️ Clic sur une arme : Arme 1 · Bouton « Arme 2 » : réserve · Q : changer en combat.</p>' +
        bagUpgradeHTML() +
        '<div class="modern-bag">' +
        cells +
        '</div>' +
        (merchant
          ? '<div class="modern-foot"><button type="button" data-action="sellAllCommon">💰 Vendre les objets communs</button></div>'
          : '') +
        '</div>'
    );
    prepare('inventory');
  }
  function charSlot(slot) {
    const item = game.hero.equipment[slot],
      rarity = item ? rarityInfo(item) : null;
    const icon = item ? weaponIcon(item) || itemIcon[slot] || '💎' : itemIcon[slot] || '💎';
    return (
      '<div class="equip-square' +
      (slot === 'weapon' ? ' active-weapon' : '') +
      (item ? '' : ' empty') +
      '"' +
      canaanPrestige(item) +
      ' style="border-color:' +
      (rarity ? rarity.color : '#5e7180') +
      ';--rarity:' +
      (rarity ? rarity.color : 'transparent') +
      '" data-tooltip-slot="' +
      slot +
      '" data-action="' +
      (item ? 'unequip' : 'hideGearTooltip') +
      '" data-slot="' +
      slot +
      '" title="' +
      safeGearText(
        CANAAN_ICONS.strip(gearSlots[slot]) +
          ' — ' +
          (item ? gearDisplayName(item) + (slot === 'weapon2' ? ' · Q pour changer' : ' · cliquer pour retirer') : 'emplacement libre')
      ) +
      '">' +
      '<span class="eq-icon">' +
      icon +
      '</span><span class="eq-label">' +
      safeGearText(gearSlots[slot]) +
      '</span><span class="eq-name" style="color:' +
      (rarity ? rarity.color : '#8498a5') +
      '">' +
      (item ? safeGearText(gearDisplayName(item)) : 'Vide') +
      '</span></div>'
    );
  }
  function renderCharacter() {
    Object.values(game.hero.equipment).forEach(item => window.CANAAN_GEAR.normalize(item));
    currentGearPanel = 'character';
    hideGearTooltip();
    const st = characterStats(),
      count = Object.values(game.hero.equipment).filter(Boolean).length,
      need = xpToNext(st.level);
    modernPanel(
      rpgHeader('🧙 Personnage · Niveau ' + st.level + (game.hero.quetes?.flags?.title ? ' · ✨ Gardien de l’Aurore' : '')) +
        '<div class="character-layout"><div class="character-left"><div class="rpg-paper"><div class="character-doll">' +
        '<div class="doll-column">' +
        ['helm', 'shoulders', 'armor', 'gloves', 'boots'].map(charSlot).join('') +
        '</div>' +
        '<div class="doll-center"><canvas id="heroPreview" width="170" height="250"></canvas><p class="muted">⚔️ ' +
        count +
        '/10 équipés</p></div>' +
        '<div class="doll-column">' +
        ['neck', 'ring', 'artifact', 'weapon', 'weapon2'].map(charSlot).join('') +
        '</div></div></div>' +
        // Six emplacements de Rubis et collection, sous le personnage.
        window.CANAAN_RUBIS.section() +
        '</div>' +
        '<div class="rpg-paper"><div class="char-stats">' +
        '<div class="char-level"><b>Niveau ' +
        st.level +
        '</b><div class="bar exp"><i style="width:' +
        (need ? Math.min(100, (100 * (game.hero.exp || 0)) / need) : 100) +
        '%"></i><span>' +
        (need ? (game.hero.exp || 0) + ' / ' + need + ' XP' : 'Niveau maximum') +
        '</span></div></div>' +
        window.CANAAN_STATS_VIEW.panel(st) +
        '</div></div></div>'
    );
    drawCharacterPreview();
    prepare('character');
  }
  function showGearTooltip(index, event) {
    const item = game.hero.inventory[index];
    if (!item) {
      hideGearTooltip();
      return;
    }
    gearTooltip.innerHTML =
      window.CANAAN_STATS_VIEW.tooltip(item) +
      (game.hero.equipment[item.slot] ? gearComparison(item, game.hero.equipment[item.slot]) : '');
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  function showEquippedTooltip(slot, event) {
    const item = game.hero.equipment[slot];
    if (!item) {
      hideGearTooltip();
      return;
    }
    gearTooltip.innerHTML = window.CANAAN_STATS_VIEW.tooltip(item);
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }
  window.CANAAN_UI = Object.freeze({
    version: window.CANAAN_VERSION,
    openInventory: renderInventory,
    openCharacter: renderCharacter,
    // Lu sur window : si les statistiques manquent, le bootstrap signale CANAAN_UI.gearStat au lieu d'un plantage.
    gearStat: window.gearStat,
    showGearTooltip,
    showEquippedTooltip,
    inspect: () => ({
      panel: document.getElementById('window')?.dataset.canaanPanel || null,
      inventory: true,
      character: true,
      gearStat: !!window.gearStat
    })
  });
  Object.assign(window, { renderInventory, renderCharacter, charSlot, showGearTooltip, showEquippedTooltip, bagUpgradeHTML });
})();
// Aperçu direct, utilisé une fois par rendu de la fiche personnage.
function drawCharacterPreview() {
  const preview = document.getElementById('heroPreview');
  if (!preview) return;
  const c = preview.getContext('2d');
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, preview.width, preview.height);
  c.imageSmoothingEnabled = false;
  const scale = Math.min(preview.width / 48, preview.height / 60) * 0.77;
  c.translate(Math.round(preview.width / 2), Math.round(preview.height / 2));
  c.scale(scale, scale);
  const sprite = canaanHeroSprite(game.hero?.look, 0, 0);
  c.drawImage(sprite, -24, -30, 48, 60);
  c.restore();
}
