const itemIcon = {
  weapon: '⟦slot_weapon⟧',
  armor: '⟦slot_armor⟧',
  helm: '⟦slot_helm⟧',
  boots: '⟦slot_boots⟧',
  shoulders: '⟦slot_shoulders⟧',
  gloves: '⟦slot_gloves⟧',
  neck: '⟦slot_neck⟧',
  ring: '⟦slot_ring⟧',
  artifact: '⟦slot_artifact⟧'
};
// Objet de prestige (Légendaire, Mythique, Relique) : attribut des cases du sac et de la fiche, pour leur brillance
// animée.
function canaanPrestige(item) {
  const name = item ? rarityInfo(item).name : '';
  return name === 'Légendaire'
    ? ' data-prestige="legendaire"'
    : name === 'Mythique'
      ? ' data-prestige="mythique"'
      : name === BOUND_RARITY.name
        ? ' data-prestige="relique"'
        : '';
}
// En-tête du sac et de la fiche (comme toute fenêtre : C et I passent de l'une à l'autre).
function rpgHeader(title, right = '') {
  return canaanHead(title, right);
}

// Onglets communs à toutes les fenêtres (même allure partout) : tabs = [[id, libellé, compteur?], …]. Chaque bouton
// porte data-action et data-tab ; l'onglet `current` est allumé.
function canaanTabs(action, current, tabs, extra = '') {
  return (
    '<div class="ui-tabs' +
    (extra ? ' ' + extra : '') +
    '" role="tablist">' +
    tabs
      .map(
        ([id, label, count]) =>
          '<button type="button" role="tab" aria-selected="' +
          (id === current) +
          '" class="' +
          (id === current ? 'on' : '') +
          '" data-action="' +
          action +
          '" data-tab="' +
          id +
          '">' +
          label +
          (count !== undefined && count !== null && count !== '' ? ' <small>' + count + '</small>' : '') +
          '</button>'
      )
      .join('') +
    '</div>'
  );
}
// Fenêtre Groupe : en-tête et onglets communs à ses deux pages, le groupe (G, group.js) et l'échange entre joueurs
// (J, trade.js).
function canaanGroupHead(current) {
  return (
    canaanHead('👥 Groupe') +
    canaanTabs('groupTab', current, [
      ['group', '👥 Compagnons'],
      ['trade', '🤝 Échange']
    ])
  );
}
// En-tête commun d'une fenêtre : son titre, et à droite d'éventuels boutons.
function canaanHead(title, right = '') {
  return '<div class="rpg-head"><h2>' + title + '</h2>' + right + '</div>';
}

// Survol d'une instance dans la liste de la carte M : elle est entourée sur la carte.
function highlightMapInstance(i, active) {
  drawBigMap(active ? i : null);
}
let BAG_LIMIT = 40; // Capacité dynamique, actualisée selon le niveau du sac après chargement.
// Un héros (l'hôte par défaut) est-il près d'un marchand ? L'hôte le vérifie aussi pour ses invités.
function nearMerchant(hero = game.hero) {
  const p = hero.player;
  return (
    !game.world.instance &&
    (game.world.npcs.some(
      n => n.type === 'shop' && canaanHere(n) && Math.hypot(p.x - n.x, p.y - n.y) < 135
    ) ||
      // Thalion, l'armurier de Sylvaëlle, achète aussi (elven-city.js).
      CANAAN_CITY.nearArmorer(hero))
  );
}
function modernPanel(html) {
  showPanel(html);
  document.getElementById('window').classList.add('rpg-modern');
}

// ---------------------------------------------------------------- Fenêtres des PNJ (marchand, banque)
// Même modèle que le sac (I), en taille « md » : un en-tête, puis deux colonnes (ce que propose le PNJ à gauche, le
// sac du héros à droite). Chaque colonne a son titre, une ligne d'aide, sa zone qui défile et son pied.
// Case d'un équipement : attrs porte l'action, l'info-bulle et le titre ; bare : sans son cadre (case de la boutique,
// qui a le sien pour le prix).
function canaanGearTile(item, attrs, bare = false) {
  const rarity = rarityInfo(item),
    icon = weaponIcon(item) || itemIcon[item.slot];
  return (
    (bare ? '' : '<div class="bag-sale-wrap">') +
    '<button type="button" class="bag-cell"' +
    canaanPrestige(item) +
    ' style="border-color:' +
    rarity.color +
    ';--rarity:' +
    rarity.color +
    '" ' +
    attrs +
    '><span class="bag-icon">' +
    icon +
    '</span><span class="bag-name">' +
    safeGearText(gearDisplayName(item)) +
    '</span><span class="bag-ilvl">' +
    itemLevel(item) +
    '</span></button>' +
    (bare ? '' : '</div>')
  );
}
const canaanEmptyTiles = n =>
  Array.from(
    { length: Math.max(0, n) },
    () =>
      '<div class="bag-sale-wrap"><div class="bag-cell empty"><span class="bag-icon">＋</span></div></div>'
  ).join('');
// Groupe de cases sous un sous-titre (comme dans le sac) ; un groupe vide n'est pas affiché.
function canaanTileGroup(icon, title, count, cells) {
  if (!cells.length) return '';
  return (
    '<h3 class="bag-subhead">' +
    icon +
    ' ' +
    title +
    ' <small>' +
    count +
    '</small></h3><div class="modern-bag">' +
    cells.join('') +
    '</div>'
  );
}
// Une colonne : titre, aide, contenu qui défile (scrollKey : sa position est gardée d'un dessin à l'autre), pied.
function canaanNpcColumn(extra, title, hint, body, scrollKey, foot) {
  return (
    '<section class="shop-side ' +
    (extra ? extra + ' ' : '') +
    'npc-col"><h3 class="npc-col-title">' +
    title +
    '</h3>' +
    (hint ? '<p class="bag-hint muted">' + hint + '</p>' : '') +
    '<div class="panel-scroll" data-keep-scroll="' +
    scrollKey +
    '">' +
    body +
    '</div><div class="bag-foot">' +
    (foot || '<span></span>') +
    '</div></section>'
  );
}
const canaanGoldTag = () =>
  '<span class="bag-gold">' + Math.floor(P.gold).toLocaleString('fr-FR') + ' or</span>';
// Colonne du sac chez un PNJ : équipement, objets, places libres et matériaux ; gearAttrs(item, i) et stackAttrs(pile)
// donnent l'action de chaque case (vendre, déposer…).
function canaanBagColumn(hero, { gearAttrs, stackAttrs, hint, foot }) {
  const tile = p => '<div class="bag-sale-wrap">' + CANAAN_BAG.cell(p, stackAttrs(p)) + '</div>',
    gear = hero.inventory.map((item, i) => canaanGearTile(item, gearAttrs(item, i))),
    stacks = CANAAN_BAG.tiles(hero, 'main').map(tile),
    mats = CANAAN_BAG.tiles(hero, 'mat').map(tile),
    limit = canaanBagLimit(hero),
    used = gear.length + stacks.length,
    free = Math.max(0, limit - used);
  const body =
    canaanTileGroup('⚔️', 'Équipement', gear.length, gear) +
    canaanTileGroup('🗝️', 'Objets', stacks.length, stacks) +
    canaanTileGroup('＋', 'Libres', free, free ? [canaanEmptyTiles(free)] : []) +
    canaanTileGroup('⟦prof_mining⟧', 'Matériaux', mats.length + ' / ' + CANAAN_BAG.MAT_LIMIT, mats) +
    (used || mats.length ? '' : '<p class="muted bag-none">Ton sac est vide.</p>');
  return canaanNpcColumn(
    'bag-side',
    '⟦menu_inventory⟧ Ton sac <small>' + used + ' / ' + limit + '</small>',
    hint,
    body,
    'npc-bag',
    foot
  );
}

// Tooltips façon MMORPG : survol de la case, sans clic ni panneau en bas.
const gearTooltip = document.createElement('div');
gearTooltip.id = 'gearHoverTooltip';
document.body.appendChild(gearTooltip);
function hideGearTooltip() {
  gearTooltip.style.display = 'none';
}
function moveGearTooltip(e) {
  if (gearTooltip.style.display !== 'block') return;
  const margin = 14,
    w = gearTooltip.offsetWidth,
    h = gearTooltip.offsetHeight;
  let x = e.clientX + 18,
    y = e.clientY + 16;
  if (x + w > innerWidth - margin) x = e.clientX - w - 18;
  if (y + h > innerHeight - margin) y = innerHeight - h - margin;
  gearTooltip.style.left = Math.max(margin, x) + 'px';
  gearTooltip.style.top = Math.max(margin, y) + 'px';
}

newRegionWorld();
