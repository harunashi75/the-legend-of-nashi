// Démantèlement et sacoche de butin : plus aucun équipement n'est perdu ni changé en or quand le sac est plein.
// - Démanteler (bouton ⚒ d'une pièce du sac, partout, même en donjon) réduit la pièce en poudres d'enchantement
//   (Poussière, Essence, Éclat selon sa qualité : PROF_SALVAGE) ; l'enchanteur s'en sert avec les minerais.
// - Sacoche de butin (hero.satchel, SATCHEL_SIZE places) : un butin Rare ou mieux qui ne rentre pas dans le sac y
//   est rangé ; on le reprend depuis le sac (I) dès qu'une case se libère. Un butin moins bon, ou qui ne trouve plus
//   de place dans la sacoche, est démantelé tout seul : ses poudres rejoignent les matériaux.
// Tout butin d'équipement passe par deliver(hero, item). L'hôte décide ; un invité demande (actions salvage et
// satchel-take) et reçoit sa sacoche avec son sac.
(() => {
  'use strict';
  const esc = s => safeGearText(s);
  const guest = () => game.mode === 'guest';
  const tell = (hero, text) => canaanLootNotice(hero, text);
  const satchelOf = hero => (Array.isArray(hero.satchel) ? hero.satchel : (hero.satchel = []));
  // Rang de qualité d'une pièce (0 : Commun … 5 : Mythique) ; -1 pour une arme liée (Relique), qui ne se démantèle pas.
  const rankOf = item => GEAR_RARITIES.indexOf(rarityInfo(item));
  const canSalvage = item => !!item && !isBoundItem(item) && rankOf(item) >= 0;
  const bagFull = hero => canaanBagUsed(hero) >= canaanBagLimit(hero);
  const gainText = gains =>
    Object.entries(gains)
      .map(([id, n]) => '+' + n + ' ' + PROF_DUSTS[id].name)
      .join(' · ');

  // ---------------------------------------------------------------- Hôte : règles
  // Réduit une pièce en poudres pour ce héros (elle est déjà retirée de là où elle était) ; renvoie les poudres.
  // Les poudres rejoignent toujours les matériaux, même pleins : rien n'est perdu.
  function reduce(hero, item) {
    const prof = CANAAN_PROF.profOf(hero),
      rank = Math.max(0, rankOf(item)),
      gains = salvageYield(rank, prof.enchanting.level, Math.random);
    for (const [id, n] of Object.entries(gains)) CANAAN_BAG.add(hero, 'dust', id, 0, n);
    CANAAN_PROF.gainXp(hero, 'enchanting', 4 + 4 * rank);
    hero.netBag = null;
    return gains;
  }
  // Démanteler une pièce du sac ou de la sacoche (son identifiant).
  function salvage(hero, id) {
    for (const list of [hero.inventory, satchelOf(hero)]) {
      const i = list.findIndex(it => it && String(it.id) === String(id));
      if (i < 0) continue;
      const item = list[i];
      if (!canSalvage(item)) return (tell(hero, '⚒️ Une arme liée ne se démantèle pas.'), false);
      list.splice(i, 1);
      const gains = reduce(hero, item);
      tell(hero, '⚒️ ' + gearDisplayName(item) + ' démantelé · ' + gainText(gains));
      window.CANAAN_PERSISTENCE.requestSave();
      return true;
    }
    return false;
  }
  // Dépose un butin d'équipement (déjà normalisé) : dans le sac s'il y a la place, sinon dans la sacoche (Rare ou
  // mieux), sinon démantelé. Renvoie 'bag', 'satchel' ou 'dust'.
  function deliver(hero, item) {
    if (!bagFull(hero)) {
      hero.inventory.push(item);
      hero.netBag = null;
      return 'bag';
    }
    const rank = rankOf(item),
      satchel = satchelOf(hero);
    if ((rank < 0 || rank >= SATCHEL_MIN_RARITY) && satchel.length < SATCHEL_SIZE) {
      satchel.push(item);
      hero.netBag = null;
      tell(hero, '👜 Sac plein : ' + gearDisplayName(item) + ' rangé dans ta sacoche de butin.');
      window.CANAAN_PERSISTENCE.requestSave();
      return 'satchel';
    }
    const gains = reduce(hero, item);
    tell(hero, '⚒️ Sac plein : ' + gearDisplayName(item) + ' démantelé automatiquement · ' + gainText(gains));
    window.CANAAN_PERSISTENCE.requestSave();
    return 'dust';
  }
  // Reprendre une pièce de la sacoche dans le sac.
  function take(hero, id) {
    const satchel = satchelOf(hero),
      i = satchel.findIndex(it => it && String(it.id) === String(id));
    if (i < 0) return false;
    if (bagFull(hero))
      return (
        tell(hero, '🎒 Sac plein : démantèle, vends ou dépose un objet pour reprendre ce butin.'),
        false
      );
    hero.inventory.push(satchel.splice(i, 1)[0]);
    hero.netBag = null;
    window.CANAAN_PERSISTENCE.requestSave();
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'salvage') return salvage(hero, action.id);
    if (action.op === 'satchel-take') return take(hero, action.id);
    return false;
  }

  // ---------------------------------------------------------------- Sauvegarde
  const validItem = it =>
    it &&
    typeof it === 'object' &&
    !Array.isArray(it) &&
    Object.hasOwn(gearSlots, it.slot) &&
    it.slot !== 'weapon2' &&
    Number.isFinite(Number(it.level ?? 1)) &&
    Number(it.level ?? 1) > 0;
  // Sacoche valide : équipements reconnus, SATCHEL_SIZE au plus.
  function sanitize(raw) {
    return (Array.isArray(raw) ? raw : [])
      .filter(validItem)
      .slice(0, SATCHEL_SIZE)
      .map(it => window.CANAAN_GEAR.normalize(it));
  }
  const exportSatchel = hero => satchelOf(hero).slice();

  // ---------------------------------------------------------------- Interface (hôte ou invité)
  const refresh = () => {
    if (CANAAN_SHOP.isOpen()) CANAAN_SHOP.render();
    else if (modalOpen() && currentGearPanel === 'inventory') renderInventory();
  };
  const act = action => {
    hideGearTooltip();
    if (guest()) return CANAAN_NET.requestAction(action);
    const done = handle(game.hero, action);
    refresh();
    if (done) saveGame();
    return done;
  };
  // Démanteler depuis le sac : une pièce Épique ou mieux, ou enchantée, demande d'abord confirmation.
  function salvageMine(id) {
    const item = [...game.hero.inventory, ...satchelOf(game.hero)].find(
      it => it && String(it.id) === String(id)
    );
    if (!item) return false;
    if (!canSalvage(item)) return (toast('⚒️ Une arme liée ne se démantèle pas.'), false);
    if (rankOf(item) >= 3 || item.ench) {
      canaanConfirm(
        'Démanteler ' +
          gearDisplayName(item) +
          ' (' +
          item.rarity +
          ', niveau ' +
          itemLevel(item) +
          ') en poudres d’enchantement ?' +
          (item.ench ? ' Son enchantement sera perdu.' : ''),
        () => act({ op: 'salvage', id: String(item.id) }),
        { title: '⚒️ Démanteler un objet précieux', yes: 'Démanteler', no: 'Garder' }
      );
      return false;
    }
    return act({ op: 'salvage', id: String(item.id) });
  }
  const takeMine = id => act({ op: 'satchel-take', id: String(id) });
  // Case d'une pièce de la sacoche : clic pour la reprendre, bouton ⚒ pour la démanteler.
  function cell(item) {
    const rarity = rarityInfo(item),
      icon = weaponIcon(item) || itemIcon[item.slot] || '💎';
    return (
      '<div class="bag-sale-wrap"><button type="button" class="bag-cell"' +
      canaanPrestige(item) +
      ' style="border-color:' +
      rarity.color +
      ';--rarity:' +
      rarity.color +
      '" data-tooltip-satchel="' +
      esc(item.id) +
      '" data-action="satchelTake" data-id="' +
      esc(item.id) +
      '" title="' +
      esc(gearDisplayName(item) + ' · cliquer pour le reprendre dans le sac') +
      '"><span class="bag-icon">' +
      icon +
      '</span><span class="bag-name" style="color:' +
      rarity.color +
      '">' +
      esc(gearDisplayName(item)) +
      '</span><span class="bag-ilvl">' +
      itemLevel(item) +
      '</span></button>' +
      salvageButton(item) +
      '</div>'
    );
  }
  // Bouton ⚒ d'une pièce (sac ou sacoche).
  function salvageButton(item) {
    if (!canSalvage(item)) return '';
    return (
      '<button type="button" class="bag-salvage" data-action="salvageItem" data-id="' +
      esc(item.id) +
      '" title="' +
      esc('Démanteler ' + gearDisplayName(item) + ' en poudres d’enchantement') +
      '">⚒</button>'
    );
  }
  // Rubrique de la sacoche dans le sac (I) : seulement quand elle contient quelque chose.
  function section() {
    const list = satchelOf(game.hero);
    if (!list.length) return '';
    return (
      '<div class="bag-section-satchel"><h3 class="bag-subhead">👜 Sacoche de butin <small>' +
      list.length +
      ' / ' +
      SATCHEL_SIZE +
      ' · butin Rare ou mieux gardé quand le sac était plein</small></h3>' +
      '<div class="modern-bag">' +
      list.map(cell).join('') +
      '</div><p class="muted">Clique une pièce pour la reprendre dans le sac (il faut une case libre).</p></div>'
    );
  }
  function showTooltip(id, event) {
    const item = satchelOf(game.hero).find(it => String(it.id) === String(id));
    if (!item) return hideGearTooltip();
    gearTooltip.innerHTML =
      window.CANAAN_STATS_VIEW.tooltip(item) +
      (game.hero.equipment[item.slot] ? gearComparison(item, game.hero.equipment[item.slot]) : '');
    gearTooltip.style.display = 'block';
    moveGearTooltip(event);
  }

  window.CANAAN_SALVAGE = Object.freeze({
    canSalvage,
    reduce,
    salvage,
    deliver,
    take,
    handle,
    of: satchelOf,
    sanitize,
    export: exportSatchel,
    salvageMine,
    takeMine,
    salvageButton,
    section,
    showTooltip
  });
})();
