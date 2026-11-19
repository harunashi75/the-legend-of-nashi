// Interface du sac et du personnage : un rendu par panneau.
(function () {
  'use strict';
  function prepare(panel) {
    const win = document.getElementById('window');
    win.dataset.canaanPanel = panel;
    currentGearPanel = panel;
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
  // Case d'une pièce du sac : clic pour l'équiper, ⚒ pour la démanteler, « 2 » pour une arme de réserve. La vente se
  // fait dans la fenêtre du marchand (shop.js), plus depuis le sac.
  function bagCell(item, index) {
    if (!item)
      return '<div class="bag-sale-wrap"><div class="bag-cell empty" title="Emplacement vide"><span class="bag-icon">＋</span><span class="bag-name">Vide</span></div></div>';
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
      CANAAN_SALVAGE.salvageButton(item) +
      (item.slot === 'weapon'
        ? '<button type="button" class="weapon-reserve" data-action="equipReserve" data-index="' +
          index +
          '" title="Équiper cette arme dans le deuxième emplacement (Arme 2)">2</button>'
        : '') +
      '</div>'
    );
  }
  // Sac (touche I) : une seule vue, rangée par rubriques. Dans la place du sac (BAG_LIMIT) : l'équipement, les
  // utilitaires (clés, repas, enchantements) et le reste (trésors déterrés), puis ses cases libres ; ensuite les
  // matériaux récoltés (minerais, herbes, poissons, viandes), dans leurs propres MAT_LIMIT cases.
  function bagGroup(icon, title, count, cells, note = '') {
    return (
      '<h3 class="bag-subhead">' +
      icon +
      ' ' +
      title +
      ' <small>' +
      count +
      (note ? ' · ' + note : '') +
      '</small></h3>' +
      (cells.length
        ? '<div class="modern-bag">' + cells.join('') + '</div>'
        : '<p class="muted bag-none">Rien pour l’instant.</p>')
    );
  }
  // Bouton Trier : range l'équipement du sac (l'invité le demande à l'hôte, qui garde son sac).
  function sortBag() {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'bag-sort' });
    CANAAN_BAG.sortGear(game.hero);
    renderInventory();
    saveGame();
  }
  function renderInventory() {
    updateCapacity();
    game.hero.inventory.forEach(item => window.CANAAN_GEAR.normalize(item));
    currentGearPanel = 'inventory';
    hideGearTooltip();
    const merchant = nearMerchant(),
      stackCell = p =>
        '<div class="bag-sale-wrap">' +
        CANAAN_BAG.cell(
          p,
          'data-action="useBagStack" data-token="' + safeGearText(CANAAN_BAG.token(p)) + '"'
        ) +
        '</div>',
      gear = game.hero.inventory.map((item, i) => bagCell(item, i)),
      util = CANAAN_BAG.tiles(game.hero, null, 'util').map(stackCell),
      other = CANAAN_BAG.tiles(game.hero, null, 'other').map(stackCell),
      mats = CANAAN_BAG.tiles(game.hero, null, 'mat').map(stackCell),
      used = canaanBagUsed(game.hero),
      free = Math.max(0, BAG_LIMIT - used),
      matUsed = CANAAN_BAG.matUsed(game.hero);
    modernPanel(
      rpgHeader('🎒 Sac — ' + used + '/' + BAG_LIMIT + ' emplacements') +
        '<div class="modern-body">' +
        '<div class="bag-toolbar"><p class="muted">Survole un objet pour afficher son comparatif. Clique pour l’équiper (un repas se mange). ' +
        (merchant
          ? '💰 Marchand proche : vente disponible.'
          : '💰 Pour vendre, rends-toi chez un marchand et appuie sur E.') +
        '</p><button type="button" class="bag-sort" data-action="sortBag" title="Ranger l’équipement : par emplacement, qualité puis niveau"' +
        (game.hero.inventory.length < 2 ? ' disabled' : '') +
        '>⇅ Trier</button></div>' +
        '<p class="weapon-hint">⚔️ Clic sur une arme : Arme 1 · Bouton « Arme 2 » : réserve · Q : changer en combat.</p>' +
        '<p class="weapon-hint">⚒ Démanteler : la pièce devient de la poudre d’enchantement, même en donjon.</p>' +
        bagGroup('⚔️', 'Équipement', gear.length, gear) +
        bagGroup('🗝️', 'Utilitaire', util.length, util, 'clés, repas, enchantements') +
        bagGroup('💎', 'Autre', other.length, other, 'trésors déterrés') +
        (free
          ? '<h3 class="bag-subhead">＋ Libres <small>' +
            free +
            '</small></h3><div class="modern-bag">' +
            Array.from({ length: free }, () => bagCell(null)).join('') +
            '</div>'
          : '<p class="weapon-hint">🎒 Sac plein : démantèle (⚒), vends ou dépose des objets, ou agrandis ton sac chez un marchand. Le butin Rare ou mieux attend dans la sacoche ; le reste est démantelé tout seul.</p>') +
        CANAAN_SALVAGE.section() +
        '<div class="bag-section-mat">' +
        bagGroup(
          '⟦prof_mining⟧',
          'Matériaux',
          matUsed + ' / ' + CANAAN_BAG.MAT_LIMIT,
          mats,
          'minerais, herbes, poissons, viandes, poudres'
        ) +
        '<p class="muted">Leurs ' +
        CANAAN_BAG.MAT_LIMIT +
        ' cases de 100 ne prennent pas la place du sac.</p></div>' +
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
          (item
            ? gearDisplayName(item) +
              (isBoundItem(item)
                ? ' · arme liée, elle grandit avec toi'
                : slot === 'weapon2'
                  ? ' · Q pour changer'
                  : ' · cliquer pour retirer')
            : 'emplacement libre')
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
  // Onglet de la fiche (C), comme le sac : 'gear' (le personnage et son équipement), 'rubis' (ses six
  // emplacements de Rubis et sa collection) ou 'wardrobe' (la garde-robe, aussi ouverte par la touche V).
  // L'onglet choisi est gardé d'une ouverture à l'autre.
  const CHAR_TABS = ['gear', 'rubis', 'wardrobe'];
  let charTab = 'gear';
  function characterSection(tab) {
    if (CHAR_TABS.includes(tab)) charTab = tab;
    renderCharacter();
  }
  function renderCharacter() {
    Object.values(game.hero.equipment).forEach(item => window.CANAAN_GEAR.normalize(item));
    currentGearPanel = 'character';
    hideGearTooltip();
    const st = characterStats(),
      count = Object.values(game.hero.equipment).filter(Boolean).length,
      rubis = charTab === 'rubis',
      wardrobe = charTab === 'wardrobe',
      worn = window.CANAAN_RUBIS.equipped().filter(Boolean).length,
      need = xpToNext(st.level);
    const tabs =
      '<div class="bag-tabs char-tabs">' +
      '<button type="button" class="' +
      (charTab === 'gear' ? 'on' : '') +
      '" data-action="characterSection" data-tab="gear">⚔️ Équipement <small>' +
      count +
      ' / 10</small></button>' +
      '<button type="button" class="' +
      (rubis ? 'on' : '') +
      '" data-action="characterSection" data-tab="rubis">⟦rune⟧ Runes <small>' +
      worn +
      ' / ' +
      window.CANAAN_RUBIS.slots +
      '</small></button>' +
      '<button type="button" class="' +
      (wardrobe ? 'on' : '') +
      '" data-action="characterSection" data-tab="wardrobe">👗 Garde-robe <small>' +
      window.CANAAN_WARDROBE.count() +
      ' / ' +
      SKINS.length +
      '</small></button></div>';
    const gear =
      '<div class="character-layout"><div class="character-left"><div class="rpg-paper"><div class="character-doll">' +
      '<div class="doll-column">' +
      ['helm', 'shoulders', 'armor', 'gloves', 'boots'].map(charSlot).join('') +
      '</div>' +
      '<div class="doll-center"><canvas id="heroPreview" width="170" height="250"></canvas><p class="muted">⚔️ ' +
      count +
      '/10 équipés</p></div>' +
      '<div class="doll-column">' +
      ['neck', 'ring', 'artifact', 'weapon', 'weapon2'].map(charSlot).join('') +
      '</div></div></div></div>' +
      '<div class="rpg-paper"><div class="char-stats">' +
      '<div class="char-level"><b>Niveau ' +
      st.level +
      '</b><div class="bar exp"><i style="width:' +
      (need ? Math.min(100, (100 * (game.hero.exp || 0)) / need) : 100) +
      '%"></i><span>' +
      (need ? (game.hero.exp || 0) + ' / ' + need + ' XP' : 'Niveau maximum') +
      '</span></div></div>' +
      window.CANAAN_STATS_VIEW.panel(st) +
      '</div></div></div>';
    modernPanel(
      rpgHeader(
        '🧙 Personnage · Niveau ' +
          st.level +
          (game.hero.quetes?.flags?.title ? ' · ✨ Gardien de l’Aurore' : '')
      ) +
        tabs +
        (rubis ? window.CANAAN_RUBIS.section() : wardrobe ? window.CANAAN_WARDROBE.section() : gear)
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
  Object.assign(window, {
    renderInventory,
    canaanSortBag: sortBag,
    renderCharacter,
    canaanCharacterSection: characterSection,
    canaanCharacterTab: () => charTab,
    charSlot,
    showGearTooltip,
    showEquippedTooltip,
    bagUpgradeHTML
  });
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
  // Le sprite d'une apparence est plus grand (ailes, chapeaux) : il est ramené dans le cadre.
  const sprite = canaanHeroSprite(game.hero?.look, 0, 0, { tool: 'none' }),
    scale =
      Math.min(preview.width / sprite.width, preview.height / sprite.height) * (sprite.padX ? 0.95 : 0.82);
  c.translate(Math.round(preview.width / 2), Math.round(preview.height / 2));
  c.scale(scale, scale);
  c.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  c.restore();
}
