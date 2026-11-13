const itemIcon = {
  weapon: '⚔️',
  armor: '🛡️',
  helm: '🪖',
  boots: '🥾',
  shoulders: '🦾',
  gloves: '🧤',
  neck: '📿',
  ring: '💍',
  artifact: '🔮'
};
function rpgHeader(title) {
  return (
    '<div class="rpg-head"><h2>' +
    title +
    '</h2><div class="rpg-tabs"><button data-action="renderInventory">🎒 Sac</button><button data-action="renderCharacter">🧙 Personnage</button></div></div>'
  );
}

// Survol d'une instance dans la liste de la carte M : elle est entourée sur la carte.
function highlightMapInstance(i, active) {
  drawBigMap(active ? i : null);
}
let BAG_LIMIT = 40; // Capacité dynamique, actualisée selon le niveau du sac après chargement.
// Un héros (l'hôte par défaut) est-il près d'un marchand ? L'hôte le vérifie aussi pour ses invités.
function nearMerchant(hero = game.hero) {
  const p = hero.player;
  return !game.world.instance && game.world.npcs.some(n => n.type === 'shop' && Math.hypot(p.x - n.x, p.y - n.y) < 135);
}
function modernPanel(html) {
  showPanel(html);
  document.getElementById('window').classList.add('rpg-modern');
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
