// Portails des donjons et raids : niveau requis, niveau des ennemis, butin garanti et choix de la difficulté.
// Une carte de difficulté : conditions, butin garanti et puissance des ennemis.
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
    mode.dropLevel +
    '</b><br><small>100 % garanti</small></p><p class="muted">' +
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
  const lv = heroLevel(),
    title = '<h2>🌀 ' + safeGearText(d.name) + '</h2>';
  if (d.difficulties) {
    showPanel(
      title +
        '<p>' +
        safeGearText(d.subtitle || 'RAID') +
        ' · Boss : ' +
        safeGearText((d.bosses || [d.boss]).join(' → ')) +
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
      d.dropLevel +
      '</b> · 100 % garanti</p><button data-action="enterInstance" data-instance="' +
      n.instance +
      '" ' +
      (!allowed ? 'disabled' : '') +
      '>' +
      (allowed ? '⚔️ Entrer' : '🔒 Niveau ' + d.level + ' requis') +
      '</button>'
  );
}
