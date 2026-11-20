// Butin des boss, récompenses des monstres et boutique. La puissance vient du niveau du personnage (1 à 60) et de
// celui de ses équipements (progression.js, stats.js).
// Niveau d'un héros (celui de l'hôte par défaut).
function heroLevel(hero = game.hero) {
  return clampLevel(hero.level);
}
function awardBossLoot(source, index, hero = game.hero) {
  if (source === 'dungeon') dropTierGear(index, hero);
}
// Récompense d'une source pour un héros (l'hôte par défaut), du niveau donné (celui du monstre, du boss ou de la
// zone du coffre), dans son sac : objet garanti, ou tiré (chance puis qualité) pour les monstres. Règle :
// sourceDrop (shared/rules/economy.js).
// Rubis Prospecteur : un monstre ordinaire peut lâcher un objet Peu commun au lieu d'un Commun.
function grantSourceReward(kind, hero = game.hero, level = 1) {
  const reward = SOURCE_REWARDS[kind];
  let rarity = sourceDrop(reward, Math.random);
  if (!rarity) return null;
  if (kind === 'normal' && rarity === 'Commun' && CANAAN_RUBIS.betterDrop(hero)) rarity = 'Peu commun';
  return giveGear(level, reward.source, rarity, hero);
}
function gearItemLevel(item) {
  return itemLevel(item);
}

function shopPrice() {
  return shopPriceAt(heroLevel());
}
function openShop(n) {
  return CANAAN_SHOP.open(n);
}
// Acheter l'équipement vert du marchand pour un héros (l'hôte, ou un invité en ligne à sa demande).
function buyGearFor(hero) {
  const cost = shopPriceAt(heroLevel(hero)),
    say = text => (hero === game.hero ? toast(text) : canaanLootNotice(hero, text));
  if (!nearMerchant(hero)) {
    say('🛍️ Va voir un marchand pour acheter.');
    return false;
  }
  if (canaanBagUsed(hero) >= canaanBagLimit(hero)) {
    say('Sac plein');
    return false;
  }
  if (hero.player.gold < cost) {
    say('Or insuffisant');
    return false;
  }
  hero.player.gold -= cost;
  giveGear(heroLevel(hero), 'normal', 'Peu commun', hero);
  return true;
}
function buyGear() {
  if (game.mode === 'guest') {
    closePanels();
    return CANAAN_NET.requestAction({ op: 'buy-gear' });
  }
  if (!buyGearFor(game.hero)) return;
  closePanels();
  saveGame();
}

// Le butin est enregistré dans la sauvegarde centrale (sauvegarde groupée, peu après).
function saveProgress() {
  window.CANAAN_PERSISTENCE.requestSave();
}

// Classes et talents : scripts/class-talents.js (touche T).
function toggleTalents() {
  if (!started || paused) return;
  if (modalOpen()) {
    closePanels();
    return;
  }
  renderTalents();
}

// Les portails d'instances et de l'Arène restent intacts ; le seul autre PNJ est le marchand du Camp de l'Aurore,
// derrière le comptoir de son échoppe (pièce « echoppe », voir house.js).
for (let i = game.world.npcs.length - 1; i >= 0; i--)
  if (game.world.npcs[i].type !== 'portal' && game.world.npcs[i].type !== 'arena')
    game.world.npcs.splice(i, 1);
game.world.npcs.push({
  x: (CANAAN_ROOMS[1].x + 6.5) * TS,
  y: (CANAAN_ROOMS[1].y + 3.45) * TS,
  name: 'Marchand Lira',
  role: 'Marchand',
  type: 'shop',
  color: '#f2c87b',
  village: CANAAN_CAMP.name
});
// Boss mondiaux : or selon leur niveau et objet Rare garanti.
function onWorldBossKilled(m, hero = game.hero) {
  // Boss d'une extension : sa propre récompense (chaque participant) et son propre délai de réapparition.
  if (CANAAN_EXT.bossKilled(m, hero)) return;
  game.world.worldBossTimers[m.worldBossId] = Date.now() + BOSS_RESPAWN_MS;
  const gold = worldBossGold(canaanMobLevel(m), Math.random);
  hero.player.gold += gold;
  grantSourceReward('worldBoss', hero, canaanMobLevel(m));
  canaanLootNotice(hero, '🏆 ' + m.t + ' : +' + gold + ' or !');
  chat(
    'Boss mondial',
    m.t +
      ' vaincu ! ' +
      gold +
      ' or et un objet Rare reçus. Réapparition dans ' +
      Math.round(BOSS_RESPAWN_MS / 60000) +
      ' minutes.'
  );
  saveGame();
}
