// Portails des donjons et raids : niveau requis, niveau des ennemis, butin (chances par boss) et choix de la difficulté.
// Niveau de l'objet gagné : du niveau requis au niveau de butin (« 7 à 10 »).
function dropRange(d) {
  return d.level < d.dropLevel ? d.level + ' à ' + d.dropLevel : String(d.dropLevel);
}
// Chances d'objet de prestige (Légendaire, Mythique) d'un mode de difficulté.
function prestigeText(kind) {
  const list = PRESTIGE_DROPS[kind] || [];
  return list
    .map(
      ([name, chance]) =>
        '<br><b style="color:' +
        rarityInfo({ rarity: name }).color +
        '">' +
        Math.round(chance * 100) +
        ' % ' +
        name +
        '</b>'
    )
    .join('');
}
// Chances d'équipement d'une instance : chaque boss (hors boss cachés) a 61 % de chance de donner un objet à chaque
// héros, d'où 0 à 3 objets par donjon et 0 à 6 par raid ; les boss cachés donnent une clé des secrets.
function lootOdds(raid) {
  return (
    Math.round(CANAAN_BOSS_DROP_CHANCE * 100) +
    ' % de chance par boss et par héros (0 à ' +
    (raid ? 6 : 3) +
    ' objets) · boss cachés : clé des secrets'
  );
}
// Une carte de difficulté : conditions, butin et puissance des ennemis.
function difficultyCard(index, key, mode, lv) {
  const allowed = lv >= mode.level,
    rarity = rarityInfo({ rarity: mode.rarity }),
    power =
      mode.hp === 1 && mode.damage === 1
        ? 'PV et dégâts standards de l’instance.'
        : 'Ennemis : +' +
          Math.round((mode.hp - 1) * 100) +
          ' % PV et +' +
          Math.round((mode.damage - 1) * 100) +
          ' % dégâts calculés.';
  return (
    '<section class="raid-mode' +
    (allowed ? '' : ' locked') +
    '"><h3>' +
    mode.icon +
    ' ' +
    mode.label +
    '</h3><p>Niveau requis <b>' +
    mode.level +
    '</b> · Ennemis niveau <b>' +
    mode.mobLevel +
    '</b></p><p>Récompense : <b style="color:' +
    rarity.color +
    '">' +
    rarity.name +
    ' — niveau ' +
    dropRange(mode) +
    '</b><br><small>' +
    lootOdds(true) +
    prestigeText(mode.prestige) +
    '</small></p><p class="muted">' +
    power +
    '</p><button data-action="enterInstance" data-instance="' +
    index +
    '" data-difficulty="' +
    key +
    '" ' +
    (allowed ? '' : 'disabled') +
    '>' +
    (allowed ? mode.icon + ' Entrer en ' + mode.label : '🔒 Niveau ' + mode.level + ' requis') +
    '</button></section>'
  );
}
// Contrôle d'accès aux instances fondé sur le niveau du personnage.
function openPortal(n) {
  const d = instances[n.instance];
  if (!d) return;
  if (game.world.instance) {
    if (game.world.instance.index === n.instance) {
      leaveInstance();
      return;
    }
    toast('Termine ton instance actuelle');
    return;
  }
  // Le joueur lit le panneau : le sol de l'instance se peint pendant ce temps (canaan-dungeons).
  window.prewarmInstance?.(n.instance);
  const lv = heroLevel(),
    title = '<h2>🌀 ' + safeGearText(d.name) + '</h2>';
  if (d.difficulties) {
    showPanel(
      title +
        '<p>' +
        safeGearText(d.subtitle || 'RAID') +
        ' · Boss : ' +
        safeGearText((d.bosses || [d.boss]).map(b => tt(b)).join(' → ')) +
        ' · Ton niveau : <b>' +
        lv +
        '</b></p><div class="raid-modes">' +
        Object.entries(d.difficulties)
          .map(([key, mode]) => difficultyCard(n.instance, key, mode, lv))
          .join('') +
        '</div>'
    );
    return;
  }
  if (d.scaled) {
    const common = rarityInfo({ rarity: d.rarity }),
      rare = rarityInfo({ rarity: 'Rare' });
    showPanel(
      title +
        '<p>DONJON DES TRÉFONDS · <b>Aucun niveau requis</b> · Ennemis à ton niveau (<b>' +
        lv +
        '</b>)</p><p>Boss : ' +
        safeGearText(d.boss) +
        ' · Récompense de ton niveau : <b style="color:' +
        common.color +
        '">Peu commun</b> ou <b style="color:' +
        rare.color +
        '">Rare</b> (' +
        Math.round((PRESTIGE_DROPS[d.prestige]?.[0]?.[1] || 0) * 100) +
        ' %) · ' +
        lootOdds(false) +
        '</p><button data-action="enterInstance" data-instance="' +
        n.instance +
        '">⚔️ Entrer</button>'
    );
    return;
  }
  const allowed = lv >= d.level,
    rarity = rarityInfo({ rarity: d.rarity });
  showPanel(
    title +
      '<p>' +
      (d.raid ? 'RAID' : 'DONJON') +
      ' · Niveau requis <b>' +
      d.level +
      '</b> · Ennemis niveau <b>' +
      d.mobLevel +
      '</b> · Ton niveau : <b>' +
      lv +
      '</b></p><p>' +
      ((d.bosses || []).length > 1 ? 'Boss (' + d.bosses.length + ') : ' : 'Boss : ') +
      safeGearText((d.bosses || [d.boss]).join(' → ')) +
      ' · Récompense : <b style="color:' +
      rarity.color +
      '">' +
      rarity.name +
      ' — niveau ' +
      dropRange(d) +
      '</b> · ' +
      lootOdds(!!d.raid) +
      '</p><button data-action="enterInstance" data-instance="' +
      n.instance +
      '" ' +
      (!allowed ? 'disabled' : '') +
      '>' +
      (allowed ? '⚔️ Entrer' : '🔒 Niveau ' + d.level + ' requis') +
      '</button>'
  );
}
