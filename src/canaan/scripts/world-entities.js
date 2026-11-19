// CANAAN EXPANSION — world, instances and equipment
// Un seul lieu sûr : le Camp de l'Aurore (voir CANAAN_CAMP). La liste reste utilisée par isSafe et la carte.
const villages = [{ name: CANAAN_CAMP.name, x: CANAAN_CAMP.x, y: CANAAN_CAMP.y, r: CANAAN_CAMP.r }];
// Donjons et raids : biome d'accueil ; la position est fixée par la génération de l'île.
const instances = createInstances();
function isSafe(x, y) {
  // Tréfonds : la Forteresse naine de Durgrim est le seul lieu sûr.
  if (canaanUnder()) return CANAAN_UNDER.safe(x, y);
  // La cité elfique de Sylvaëlle (dans sa palissade) est sûre elle aussi.
  return (
    villages.some(v => Math.hypot(x - v.x, y - v.y) < v.r + 2) || canaanInHouse(x, y) || canaanInCity(x, y)
  );
}
// Chaque instance a son portail ; canaan-world-generation le place sur l'île.
for (let i = 0; i < instances.length; i++) {
  const d = instances[i];
  game.world.npcs.push({
    x: d.x * TS,
    y: d.y * TS,
    name: d.name,
    color: d.color,
    type: 'portal',
    instance: i,
    layer: d.under ? 'under' : undefined
  });
}
// Arène des Épreuves : portail unique près du camp, ouvert à tous ; position fixée par la génération de l'île.
const CANAAN_ARENA_NAME = 'L’Arène des Épreuves';
const CANAAN_ARENA_PORTAL = { x: 0, y: 0 };
game.world.npcs.push({ x: 0, y: 0, name: CANAAN_ARENA_NAME, color: '#ffb347', type: 'arena' });

// Inventaire et équipement de départ : game.hero (canaan-game-state).
const gearSlots = {
  helm: '⟦slot_helm⟧ Tête',
  shoulders: '⟦slot_shoulders⟧ Épaules',
  armor: '⟦slot_armor⟧ Armure',
  gloves: '⟦slot_gloves⟧ Gants',
  boots: '⟦slot_boots⟧ Bottes',
  neck: '⟦slot_neck⟧ Collier',
  ring: '⟦slot_ring⟧ Bague',
  artifact: '⟦slot_artifact⟧ Artefact',
  weapon: '⟦slot_weapon⟧ Arme'
};

function attackBonus() {
  return characterStats().attack - 18;
}
function recomputeStats() {
  let oldMax = P.mhp,
    oldMp = P.mmp,
    st = characterStats();
  P.mhp = st.maxHp;
  P.mmp = st.maxMp;
  P.hp = Math.max(1, Math.min(P.hp + Math.max(0, P.mhp - oldMax), P.mhp));
  P.mp = Math.min(P.mp + Math.max(0, P.mmp - oldMp), P.mmp);
}

// PV et mana maximum d'un héros après un changement (équipement, talents, Rubis) : l'hôte via recomputeStats.
function recomputeHeroStats(hero = game.hero) {
  if (hero === game.hero) return recomputeStats();
  const p = hero.player,
    oldMax = p.mhp,
    oldMp = p.mmp,
    st = characterStats(hero);
  p.mhp = st.maxHp;
  p.mmp = st.maxMp;
  p.hp = Math.max(1, Math.min(p.hp + Math.max(0, p.mhp - oldMax), p.mhp));
  p.mp = Math.min(p.mp + Math.max(0, p.mmp - oldMp), p.mmp);
}
// Récompenses d'une élimination pour le héros qui l'a obtenue (l'hôte par défaut) : butin individuel.
function recordKill(m, hero = game.hero) {
  canaanAchieve(hero, 'kill', m);
  if (m.worldBoss) onWorldBossKilled(m, hero);
  // Rubis de fin de combat de l'hôte (Carnage, Faucheur, Récupération).
  CANAAN_RUBIS.onKill(m, hero);
  // Arène : un Rubis par boss vaincu ; les clones ne donnent rien.
  if (game.world.instance?.arena) {
    if (m.arenaBoss) {
      CANAAN_ARENA.onBossDown(m);
      CANAAN_WARDROBE.drop('arenaBoss', hero);
    }
    return;
  }
  // Donjon : trois boss. Raid : six. La herse de chaque salle de boss se lève à sa mort ; coffre après le dernier.
  if (game.world.instance && m.boss && onInstanceBossDown(m)) {
    game.world.instance.cleared = true;
    spawnRewardChest();
    toast('🏆 ' + m.t + ' vaincu ! Un coffre et un portail de retour sont apparus.');
  }
  // Monstre normal ou élite : objet garanti, au niveau du monstre ; en instance, rien (le coffre du boss fait le
  // butin, voir SOURCE_REWARDS).
  if (!m.boss && !m.worldBoss)
    grantSourceReward(
      game.world.instance ? 'instanceMob' : m.elite ? 'elite' : 'normal',
      hero,
      canaanMobLevel(m)
    );
  // Apparences (garde-robe) : une petite chance sur chaque monstre, plus sur les élites et les boss mondiaux. Les
  // boss d'instance tirent la leur dans dungeons.js, pour chaque héros du groupe.
  if (!m.boss) CANAAN_WARDROBE.drop(m.worldBoss ? 'worldBoss' : m.elite ? 'elite' : 'normal', hero);
  // Expérience : pour le vainqueur et ses alliés proches (progression.js).
  canaanKillXp(m, hero);
  saveProgress();
}

function safeGearText(v) {
  return String(v).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}
// Fabrique de l'objet brut. giveGear, installée par canaan-gear-engine, le normalise puis le dépose.
// forcedSlot : pièce choisie (armurerie de la cité elfique), sinon au hasard.
function createRawGear(level, source = 'normal', guaranteed = null, forcedSlot = null) {
  const slots = Object.keys(gearSlots).filter(k => k !== 'weapon2'),
    slot = slots.includes(forcedSlot) ? forcedSlot : slots[Math.floor(rnd() * slots.length)];
  const rarity = guaranteed
    ? GEAR_RARITIES.find(r => r.name === guaranteed) || rarityRoll(level)
    : lootRarity(source);
  const name =
    ({
      weapon: 'Lame',
      armor: 'Cuirasse',
      helm: 'Heaume',
      boots: 'Bottes',
      shoulders: 'Épaulières',
      gloves: 'Gants',
      neck: 'Collier',
      ring: 'Anneau',
      artifact: 'Artefact'
    }[slot] || 'Équipement') +
    ' ' +
    (source === 'raid'
      ? 'de l’Éclipse'
      : source === 'world'
        ? 'des Titans'
        : source === 'elfe'
          ? 'de Sylvaëlle'
          : source === 'dungeon'
            ? 'des Profondeurs'
            : ['des Étoiles', 'du Crépuscule', 'du Gardien', 'de l’Aube'][Math.floor(rnd() * 4)]);
  return { id: 'gear' + Date.now() + Math.floor(rnd() * 999999), name, slot, rarity: rarity.name };
}

function modalOpen() {
  return document.getElementById('overlay').style.display === 'flex';
}
function closePanels() {
  currentGearPanel = '';
  document.getElementById('window').classList.remove('rpg-modern');
  document.getElementById('overlay').style.display = 'none';
  hideGearTooltip();
}
function showPanel(html) {
  clearTouchControls();
  let win = document.getElementById('window'),
    oldScroll = win.scrollTop,
    oldInner = [...win.querySelectorAll('.scroll')].map(x => x.scrollTop);
  // Toute nouvelle fenêtre remplace le sac ou la fiche : ils se réinscrivent eux-mêmes (prepare) une fois dessinés.
  currentGearPanel = '';
  delete win.dataset.canaanPanel;
  document.getElementById('dialog').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
  document.getElementById('window').innerHTML =
    '<button type="button" class="os-close" aria-label="Fermer la fenêtre" title="Fermer (Échap)" data-action="closePanels">×</button>' +
    html;
  win.scrollTop = oldScroll;
  win.querySelectorAll('.scroll').forEach((el, i) => (el.scrollTop = oldInner[i] || 0));
}
let currentGearPanel = '';
function toggleInventory() {
  if (modalOpen()) {
    closePanels();
    return;
  }
  renderInventory();
}
function toggleCharacter() {
  if (modalOpen()) {
    closePanels();
    return;
  }
  renderCharacter();
}
// Redessine le sac ou la fiche seulement s'ils sont la fenêtre affichée : jamais par-dessus une autre (T, J, marchand…).
function refreshGearPanel() {
  if (!modalOpen() || !currentGearPanel) return;
  if (currentGearPanel === 'character') renderCharacter();
  else renderInventory();
}

function gearSellValue(item) {
  return sellValue(item, itemLevel(item));
}
// Message pour un héros : à l'écran de l'hôte, ou dans le chat et sur l'écran d'un invité.
function heroNotice(hero, text) {
  if (hero === game.hero) toast(text);
  else canaanLootNotice(hero, text);
}
// Vendre un objet du sac d'un héros (l'hôte, ou un invité en ligne à sa demande), près d'un marchand.
function sellItemFor(hero, id) {
  if (!nearMerchant(hero)) {
    heroNotice(hero, '💰 Va voir un marchand pour vendre !');
    return false;
  }
  const i = hero.inventory.findIndex(item => String(item.id) === String(id));
  if (i < 0) return false;
  const value = gearSellValue(hero.inventory[i]);
  hero.player.gold += value;
  canaanAchieve(hero, 'sell', value);
  hero.inventory.splice(i, 1);
  if (hero !== game.hero) heroNotice(hero, '💰 +' + value + ' or');
  return true;
}
// Vente groupée des objets communs.
function sellCommonFor(hero) {
  if (!nearMerchant(hero)) {
    heroNotice(hero, '💰 Va voir un marchand pour vendre !');
    return false;
  }
  const bulk = i => rarityInfo(i).name === 'Commun';
  const sold = hero.inventory.filter(bulk);
  if (!sold.length) return false;
  const value = sold.reduce((n, i) => n + gearSellValue(i), 0);
  hero.player.gold += value;
  canaanAchieve(hero, 'sell', value);
  hero.inventory = hero.inventory.filter(i => !bulk(i));
  if (hero !== game.hero)
    heroNotice(hero, '💰 ' + sold.length + ' objets communs vendus : +' + value + ' or');
  return true;
}
function sellBagIndex(i) {
  const item = game.hero.inventory[i];
  if (!item) return;
  if (game.mode === 'guest') return CANAAN_NET.requestAction({ op: 'sell', id: String(item.id) });
  if (!sellItemFor(game.hero, item.id)) return;
  if (CANAAN_SHOP.isOpen()) CANAAN_SHOP.render();
  else renderInventory();
  saveGame();
}
function sellAllCommon() {
  if (game.mode === 'guest') {
    if (!nearMerchant()) return toast('💰 Va voir un marchand pour vendre !');
    return CANAAN_NET.requestAction({ op: 'sell-common' });
  }
  if (!nearMerchant()) {
    toast('💰 Va voir un marchand pour vendre !');
    return;
  }
  sellCommonFor(game.hero);
  if (CANAAN_SHOP.isOpen()) CANAAN_SHOP.render();
  else renderInventory();
  saveGame();
}
function equipBagIndex(index) {
  if (game.hero.inventory[index]) equipItem(game.hero.inventory[index].id);
}

// Difficulté de l'instance en cours : null pour une instance à difficulté unique.
function instanceDifficulty() {
  const d = game.world.instance ? instances[game.world.instance.index] : null;
  return d?.difficulties?.[game.world.instance.difficulty] || null;
}
// Place le groupe : l'hôte au point donné, les alliés en éventail derrière lui (sur une case praticable).
// Un allié à terre se relève avec tous ses PV : il rejoint le groupe à l'entrée ou à la sortie.
function placeGroup(x, y) {
  const fan = [
    [-1.2, 0.9],
    [1.2, 0.9],
    [0, 1.8],
    [-2.2, 1.8],
    [2.2, 1.8]
  ];
  game.heroes.forEach((hero, k) => {
    const p = hero.player;
    if (hero === game.hero) {
      p.x = x;
      p.y = y;
      // Grand saut (entrée ou sortie d'instance, retour au camp) : la caméra suit tout de suite. Sinon l'image dessinée
      // avant le prochain pas de jeu peindrait le sol autour de l'ancienne position, pour rien.
      if (Math.abs(x - W / 2 - camX) > W || Math.abs(y - H / 2 - camY) > H) {
        camX = x - W / 2;
        camY = y - H / 2;
      }
      return;
    }
    const [ox, oy] = fan[(k - 1) % fan.length],
      tx = x + ox * TS,
      ty = y + oy * TS,
      free = canWalk(tx, ty);
    p.x = free ? tx : x;
    p.y = free ? ty : y;
    if (p.dead) {
      p.dead = false;
      p.hp = p.mhp;
    }
  });
}
function enterInstance(i, difficulty = null) {
  const d = instances[i];
  if (!d) return;
  const mode = d.difficulties ? d.difficulties[difficulty] : null;
  if (d.difficulties && !mode) {
    toast('Choisis une difficulté');
    return;
  }
  const required = mode ? mode.level : d.level;
  if (heroLevel() < required) {
    toast('Niveau ' + required + ' requis');
    return;
  }
  game.world.chests = [];
  game.world.returnPos = { x: P.x, y: P.y };
  game.world.instance = {
    index: i,
    cleared: false,
    difficulty: mode ? difficulty : null,
    bossesDown: 0,
    group: Math.max(1, Math.min(4, game.heroes.length))
  };
  // Donjon des Tréfonds : ennemis au niveau du héros le plus fort du groupe.
  if (d.scaled) game.world.instance.scaledLevel = Math.max(...game.heroes.map(h => clampLevel(h.level)));
  // Couche d'où l'on vient (l'île ou les Tréfonds) : on y ressort.
  game.world.returnLayer = game.world.layer || 'surface';
  game.world.tiles = makeDungeon(i);
  game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
  // Tout le groupe entre ensemble.
  placeGroup(120 * TS, 133 * TS);
  instanceEntrance = { x: P.x, y: P.y };
  game.world.monsters = [];
  game.world.projectiles = [];
  spawnInstanceBoss(i);
  closePanels();
  toast('⚔️ ' + d.name + (mode ? ' · ' + mode.label : ''));
  saveGame();
  CanaanStages.restartMusic();
}
function leaveInstance() {
  if (game.world.instance?.arena) CANAAN_ARENA.onLeave();
  game.world.chests = [];
  game.world.instance = null;
  // Retour sur la couche d'où l'on est entré : l'île, ou les Tréfonds.
  const under = game.world.returnLayer === 'under';
  game.world.layer = under ? 'under' : 'surface';
  game.world.tiles = under ? game.world.underworld : game.world.overworld;
  game.world.decor = under ? game.world.underdecor : game.world.overdecor;
  // Tout le groupe ressort ensemble, devant le portail.
  if (game.world.returnPos) placeGroup(game.world.returnPos.x, game.world.returnPos.y);
  game.world.monsters = [];
  game.world.projectiles = [];
  spawnMonsters(12);
  spawnWorldBosses();
  closePanels();
  toast(game.world.layer === 'under' ? 'Retour dans les Tréfonds' : 'Retour au monde de Canaan');
  saveGame();
  CanaanStages.restartMusic();
}

// Géographie et décor du monde ; les instances sont construites par canaan-dungeons.
const BIOME_COLORS = [
  '#235a85',
  '#568e45',
  '#b5a28a',
  '#d9b76e',
  '#73747e',
  '#245d3c',
  '#568e45',
  '#bf774e',
  '#7961a2',
  '#34313d',
  '#a3bd70',
  '#438b82',
  '#4c6e88',
  '#d0a7c5',
  '#9e493a',
  '#5fa3a6',
  '#c0743a',
  '#4f9c97',
  '#5a5fc4',
  // 19 herse, 20 sol, 21 chemin, 22 danger d'instance : couleurs du thème via dungeonMinimapColor.
  '#c9a24a',
  '#6e6a62',
  '#8a7f6a',
  '#2a1810'
];
// 37 : palissade de troncs et emprises de la cité elfique.
BIOME_COLORS[37] = '#6a4a2e';
let instanceEntrance = { x: 120 * TS, y: 133 * TS };
const hash = (x, y, s = 0) => {
  let n = Math.sin(x * 127.1 + y * 311.7 + s * 71.3) * 43758.5453;
  return n - Math.floor(n);
};
function smooth(a, b, t) {
  return a + (b - a) * t * t * (3 - 2 * t);
}
function field(x, y, scale, s) {
  let u = x / scale,
    v = y / scale,
    ix = Math.floor(u),
    iy = Math.floor(v),
    fx = u - ix,
    fy = v - iy;
  return smooth(
    smooth(hash(ix, iy, s), hash(ix + 1, iy, s), fx),
    smooth(hash(ix, iy + 1, s), hash(ix + 1, iy + 1, s), fx),
    fy
  );
}

function drawBiomeDecor(c, d, x, y, tx, ty) {
  let cx = x + 24,
    cy = y + 27;
  c.save();
  if (d === 'pine' || d === 'snowpine') {
    c.fillStyle = '#4c3528';
    c.fillRect(cx - 3, cy - 4, 6, 22);
    c.fillStyle = d === 'pine' ? '#174b3b' : '#d7f3f0';
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      c.moveTo(cx, cy - 33 + j * 10);
      c.lineTo(cx - 18 + j * 3, cy + 2 + j * 5);
      c.lineTo(cx + 18 - j * 3, cy + 2 + j * 5);
      c.fill();
    }
  } else if (d === 'mushroom') {
    c.fillStyle = '#eee4cd';
    c.fillRect(cx - 3, cy - 5, 6, 12);
    c.fillStyle = '#cf6aab';
    c.beginPath();
    c.arc(cx, cy - 7, 11, Math.PI, 0);
    c.fill();
    c.fillStyle = '#fff';
    c.fillRect(cx - 4, cy - 14, 4, 3);
  } else if (d === 'crystal') {
    c.fillStyle = '#a5f0ff';
    c.beginPath();
    c.moveTo(cx, cy - 26);
    c.lineTo(cx + 11, cy - 9);
    c.lineTo(cx + 5, cy + 8);
    c.lineTo(cx - 9, cy + 6);
    c.lineTo(cx - 12, cy - 10);
    c.fill();
  } else if (d === 'palm') {
    c.fillStyle = '#7b5a36';
    c.fillRect(cx, cy - 8, 5, 23);
    c.strokeStyle = '#28784c';
    c.lineWidth = 5;
    for (let i = 0; i < 5; i++) {
      let a = (i * 6.28) / 5;
      c.beginPath();
      c.moveTo(cx, cy - 17);
      c.lineTo(cx + Math.cos(a) * 21, cy - 17 + Math.sin(a) * 13);
      c.stroke();
    }
  } else if (d === 'deadwood') {
    c.strokeStyle = '#57413d';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(cx, cy + 9);
    c.lineTo(cx, cy - 21);
    c.lineTo(cx - 13, cy - 28);
    c.moveTo(cx, cy - 15);
    c.lineTo(cx + 13, cy - 23);
    c.stroke();
  } else if (d === 'reed') {
    c.strokeStyle = '#7ea967';
    c.lineWidth = 3;
    for (let j = -1; j <= 1; j++) {
      c.beginPath();
      c.moveTo(cx + j * 6, cy + 12);
      c.lineTo(cx + j * 7, cy - 12 - j * 4);
      c.stroke();
    }
  } else if (d === 'lava') {
    c.fillStyle = '#ff7c2e';
    c.shadowColor = '#ff4b14';
    c.shadowBlur = 10;
    c.beginPath();
    c.arc(cx, cy, 7 + Math.sin(time * 0.08 + tx) * 2, 0, 7);
    c.fill();
  } else if (d === 'bush') {
    c.fillStyle = '#2b7850';
    for (let j = -1; j <= 1; j++) {
      c.beginPath();
      c.arc(cx + j * 7, cy, 9, 0, 7);
      c.fill();
    }
  }
  c.restore();
}

function drawWorldFeatures(c) {
  // En instance, le titre et la sortie sont dessinés par canaan-dungeons ; les Tréfonds, par underground.js.
  if (game.world.instance || canaanUnder()) return;
  const path = (pts, w, color) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke();
  };
  const tree = (x, y, r = 22, kind = 0) => {
    c.save();
    c.fillStyle = 'rgba(20,28,20,.28)';
    c.beginPath();
    c.ellipse(x + 4, y + 8, r * 1.05, r * 0.48, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = kind ? '#67462f' : '#765039';
    c.fillRect(x - r * 0.13, y - r * 0.05, r * 0.26, r * 0.85);
    let greens = kind ? ['#28533b', '#356b43', '#487d4b'] : ['#28613c', '#347947', '#4b8a4a'];
    for (let j = 0; j < 3; j++) {
      c.fillStyle = greens[j];
      c.beginPath();
      c.arc(x + (j - 1) * r * 0.36, y - r * 0.38 + (j % 2) * r * 0.12, r * (0.62 - j * 0.06), 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = 'rgba(224,255,183,.18)';
    c.beginPath();
    c.arc(x - r * 0.2, y - r * 0.62, r * 0.22, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  const flowerPatch = (x, y, seed) => {
    c.save();
    for (let j = 0; j < 7; j++) {
      let a = j * 2.399 + seed,
        rr = 5 + (j % 3) * 5,
        fx = x + Math.cos(a) * rr,
        fy = y + Math.sin(a) * rr;
      c.strokeStyle = '#39794b';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(fx, fy + 5);
      c.lineTo(fx, fy - 2);
      c.stroke();
      c.fillStyle = ['#f6c5e2', '#f8d96a', '#d9c7ff', '#fff1c8'][(j + seed) % 4];
      for (let k = 0; k < 5; k++) {
        let aa = (k * Math.PI * 2) / 5;
        c.beginPath();
        c.arc(fx + Math.cos(aa) * 3, fy - 3 + Math.sin(aa) * 3, 2.5, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#e6a33e';
      c.beginPath();
      c.arc(fx, fy - 3, 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };
  const house = (x, y, variant, scale = 1) => {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.fillStyle = 'rgba(18,20,28,.35)';
    c.beginPath();
    c.ellipse(5, 20, 49, 23, 0, 0, Math.PI * 2);
    c.fill();
    // timber foundation and walls
    c.fillStyle = '#514033';
    c.fillRect(-43, -17, 86, 53);
    c.fillStyle = ['#e1c89b', '#d8d8c4', '#d8b79b', '#e6d3a8', '#c8d6d0', '#d8c2e5'][variant % 6];
    c.fillRect(-39, -20, 78, 51);
    c.fillStyle = '#8e6845';
    c.fillRect(-42, -22, 84, 7);
    const roofColor = ['#9a4c45', '#456f68', '#9b6b3d', '#76538a', '#536a8e', '#8b5149'][variant % 6];
    // Pignon entièrement fermé: aucun trou laissant voir la pelouse derrière le toit.
    c.fillStyle = '#4b342f';
    c.beginPath();
    c.moveTo(-55, -15);
    c.lineTo(-4, -64);
    c.lineTo(55, -15);
    c.lineTo(49, -9);
    c.lineTo(-49, -9);
    c.closePath();
    c.fill();
    c.fillStyle = roofColor;
    c.beginPath();
    c.moveTo(-52, -19);
    c.lineTo(-4, -60);
    c.lineTo(52, -19);
    c.lineTo(44, -13);
    c.lineTo(-44, -13);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,230,181,.17)';
    c.beginPath();
    c.moveTo(-4, -60);
    c.lineTo(52, -19);
    c.lineTo(44, -13);
    c.lineTo(-4, -49);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(47,32,35,.4)';
    c.lineWidth = 2;
    for (let row = 0; row < 3; row++) {
      let yy = -18 - row * 9,
        half = 49 - row * 11;
      c.beginPath();
      c.moveTo(-half, yy);
      c.lineTo(half, yy);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,234,190,.28)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-52, -19);
    c.lineTo(-4, -60);
    c.lineTo(52, -19);
    c.stroke();
    // door, warm windows, cross beams
    c.fillStyle = '#69452e';
    c.fillRect(-10, 1, 21, 30);
    c.fillStyle = '#c99b59';
    c.fillRect(-7, 4, 15, 27);
    c.fillStyle = '#f8d77d';
    c.fillRect(-31, -8, 13, 13);
    c.fillRect(19, -8, 13, 13);
    c.fillStyle = '#785238';
    c.fillRect(-33, -10, 17, 3);
    c.fillRect(17, -10, 17, 3);
    c.fillRect(-33, 5, 17, 3);
    c.fillRect(17, 5, 17, 3);
    c.fillStyle = '#60452f';
    c.fillRect(-25, -9, 2, 15);
    c.fillRect(-31, -3, 13, 2);
    c.fillRect(25, -9, 2, 15);
    c.fillRect(19, -3, 13, 2);
    // Planks, beams, roof tiles and flower boxes for a richer village silhouette.
    c.strokeStyle = 'rgba(75,47,35,.52)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-37, -17);
    c.lineTo(-37, 28);
    c.moveTo(37, -17);
    c.lineTo(37, 28);
    c.moveTo(-37, 26);
    c.lineTo(37, 26);
    c.stroke();
    c.strokeStyle = 'rgba(255,232,190,.19)';
    c.lineWidth = 2;
    for (let j = 0; j < 5; j++) {
      c.beginPath();
      c.moveTo(-37 + j * 15, -18 - j * 1.4);
      c.lineTo(-4 + j * 11, -46 + j * 5);
      c.stroke();
    }
    c.fillStyle = '#74513b';
    c.fillRect(-35, 9, 22, 6);
    c.fillRect(15, 9, 22, 6);
    for (let j = 0; j < 3; j++) {
      c.fillStyle = ['#e77b8d', '#f4d56b', '#9bc9ed'][(j + variant) % 3];
      c.beginPath();
      c.arc(-30 + j * 6, 7, 4, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(19 + j * 6, 7, 4, 0, 7);
      c.fill();
    }
    c.fillStyle = '#9a8e77';
    c.fillRect(-13, 34, 28, 5);
    c.fillStyle = '#b8ab91';
    c.fillRect(-17, 39, 36, 5);
    c.fillStyle = '#a9b27a';
    c.beginPath();
    c.arc(-49, 26, 9, 0, 7);
    c.arc(49, 26, 9, 0, 7);
    c.fill();
    // little chimney + smoke
    c.fillStyle = '#79513d';
    c.fillRect(20, -48, 11, 20);
    c.fillStyle = '#b77d59';
    c.fillRect(18, -50, 15, 4);
    c.fillStyle = 'rgba(225,230,230,.24)';
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      c.arc(26 + Math.sin(time * 0.02 + j) * 3, -58 - j * 8, 4 + j, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#b78b56';
    c.fillRect(-47, 30, 94, 5);
    c.restore();
  };
  const campfire = (x, y) => {
    c.save();
    c.fillStyle = '#78644e';
    c.beginPath();
    c.ellipse(x, y + 7, 28, 16, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#60432d';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - 17, y + 5);
    c.lineTo(x + 17, y - 3);
    c.moveTo(x - 14, y - 4);
    c.lineTo(x + 14, y + 7);
    c.stroke();
    c.shadowColor = '#ff8c35';
    c.shadowBlur = 23;
    c.fillStyle = '#ff7b32';
    c.beginPath();
    c.moveTo(x, y - 31 - Math.sin(time * 0.12) * 4);
    c.quadraticCurveTo(x + 22, y - 7, x + 7, y + 2);
    c.quadraticCurveTo(x, y + 10, x - 7, y + 2);
    c.quadraticCurveTo(x - 19, y - 9, x, y - 31);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#ffeaa0';
    c.beginPath();
    c.moveTo(x, y - 19);
    c.quadraticCurveTo(x + 9, y - 5, x, y + 1);
    c.quadraticCurveTo(x - 8, y - 7, x, y - 19);
    c.fill();
    c.restore();
  };
  const lamp = (x, y) => {
    c.save();
    c.fillStyle = '#554333';
    c.fillRect(x - 3, y - 3, 6, 29);
    c.fillStyle = '#6f5137';
    c.fillRect(x - 8, y - 9, 16, 6);
    c.fillStyle = '#f7cf70';
    c.shadowColor = '#ffd66e';
    c.shadowBlur = 12;
    c.fillRect(x - 5, y - 21, 10, 12);
    c.shadowBlur = 0;
    c.strokeStyle = '#c7a66b';
    c.lineWidth = 2;
    c.strokeRect(x - 7, y - 23, 14, 16);
    c.restore();
  };
  const statue = (x, y, variant) => {
    c.save();
    c.fillStyle = '#827e78';
    c.fillRect(x - 25, y + 8, 50, 13);
    c.fillStyle = '#b4b0a5';
    c.fillRect(x - 19, y - 2, 38, 12);
    c.fillStyle = variant % 2 ? '#8e9eaa' : '#a8a6a0';
    c.fillRect(x - 10, y - 34, 20, 34);
    c.beginPath();
    c.arc(x, y - 43, 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6d7277';
    c.fillRect(x - 15, y - 24, 30, 5);
    c.fillStyle = '#d2cfc5';
    c.fillRect(x - 3, y - 51, 6, 14);
    c.restore();
  };
  drawCampAurore(c);
  // Portails des donjons et des raids, visibles de loin.
  for (let i = 0; i < instances.length; i++) {
    let d = instances[i],
      x = d.x * TS,
      y = d.y * TS;
    // Les portails des Tréfonds sont dessinés sous l'île (underground.js).
    if (d.under) continue;
    if (x < camX - 260 || x > camX + W + 260 || y < camY - 120 || y > camY + H + 280) continue;
    c.save();
    // Entrée en pixel art posée dans son biome (portal-art.js) ; l'ancien dessin reste en secours.
    if (!CANAAN_PORTAL_ART.draw(c, i, x, y)) drawDungeonEntrance(c, i, x, y);
    c.restore();
  }
  // Colisée de l'Arène des Épreuves, près du camp.
  const ax = CANAAN_ARENA_PORTAL.x * TS,
    ay = CANAAN_ARENA_PORTAL.y * TS;
  if (ax > camX - 220 && ax < camX + W + 220 && ay > camY - 220 && ay < camY + H + 260) {
    c.save();
    if (!CANAAN_PORTAL_ART.draw(c, 'arena', ax, ay)) drawDungeonEntrance(c, 'arena', ax, ay);
    c.restore();
  }
}

// Huit boss mondiaux persistants répartis dans les six biomes ; position fixée par la génération de l'île.
const WORLD_BOSSES = WORLD_BOSS_DEFS.map(b => ({ ...b, x: 0, y: 0 }));
function findBossSpot(b) {
  let cx = b.x,
    cy = b.y;
  for (let radius = 0; radius < 22; radius++)
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (radius && Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        let x = cx + dx,
          y = cy + dy;
        if (x < 4 || y < 4 || x >= MAPW - 4 || y >= MAPH - 4 || isSafe(x, y) || SOLID.includes(tileAt(x, y)))
          continue;
        return { x, y };
      }
  return { x: cx, y: cy };
}
function spawnWorldBosses() {
  // Tréfonds : leurs propres boss mondiaux, au niveau du groupe (underground.js).
  if (canaanUnder()) return CANAAN_UNDER.spawnBosses();
  if (!game.world.instance)
    for (const b of WORLD_BOSSES) {
      if (
        (game.world.worldBossTimers[b.id] || 0) > Date.now() ||
        game.world.monsters.some(m => m.worldBossId === b.id)
      )
        continue;
      let pos = findBossSpot(b);
      game.world.monsters.push({
        x: (pos.x + 0.5) * TS,
        y: (pos.y + 0.5) * TS,
        hp: b.hp,
        mhp: b.hp,
        t: b.name,
        r: 29,
        cd: 0,
        g: 120 + b.level * 20,
        level: b.level,
        bossLevel: b.level,
        bossColor: b.color,
        worldBoss: true,
        worldBossId: b.id
      });
    }
  game.world.monsters.forEach(scaleBossHp);
}
function updateWorldBosses() {
  if (!game.world.instance && game.world.clock % 180 === 0) spawnWorldBosses();
}

// Coffres secrets : identifiants stables pour la sauvegarde, emplacements fixés par la génération de l'île.
const hiddenChestSpots = Array.from({ length: 65 }, (_, i) => ({ id: 'hidden_' + i, x: 0, y: 0 }));
// Coffres secrets de la couche affichée : ceux de l'île, ou ceux des Tréfonds (underground.js).
function canaanSecretChests() {
  return game.world.layer === 'under' ? CANAAN_UNDER.chests() : hiddenChestSpots;
}
function chestPosition(ch) {
  if (ch.instance) return ch;
  for (let r = 0; r < 18; r++)
    for (let a = 0; a < 12; a++) {
      let x = ch.x + Math.round(Math.cos((a * Math.PI) / 6) * r),
        y = ch.y + Math.round(Math.sin((a * Math.PI) / 6) * r);
      if (x > 4 && y > 4 && x < MAPW - 4 && y < MAPH - 4 && !SOLID.includes(tileAt(x, y)))
        return { ...ch, x, y };
    }
  return ch;
}
function spawnRewardChest() {
  const spot = dungeonChestSpot(game.world.instance.index);
  game.world.chests = [{ id: 'instance_' + game.world.instance.index, x: spot.x, y: spot.y, instance: true }];
}
// Coffre de fin d'instance : une bourse d'or (60–100 en donjon, 150–250 en raid) et la grosse récompense d'XP pour
// chaque héros du groupe ; l'équipement vient des boss (30 % de chance chacun, dungeons.js).
// Coffre secret de l'île ou des Tréfonds : il faut une clé des secrets (boss cachés des donjons) ; seul celui qui
// l'ouvre est récompensé : un équipement Épique au niveau de la zone, 200 à 400 or, et 25 % de chance d'un Rubis.
const SECRET_CHEST_RUBIS = 0.25;
// Coffre encore fermé à moins de 2 cases d'une position (coffre secret du monde ou coffre de fin d'instance).
function nearbyChest(p) {
  const list = game.world.instance
    ? game.world.chests.filter(c => !c.opened)
    : canaanSecretChests()
        .filter(c => !game.world.openedChests.includes(c.id))
        .map(chestPosition);
  return list.find(c => Math.hypot(p.x / TS - c.x, p.y / TS - c.y) < 2) || null;
}
function openNearbyChest(hero = game.hero) {
  const p = hero.player;
  if (p.dead || hero.away) return false;
  const c = nearbyChest(p);
  if (!c) return false;
  if (c.instance) {
    if (c.opened) return false;
    c.opened = true;
    const index = game.world.instance.index;
    for (const member of game.heroes) {
      canaanAchieve(member, 'clear', index);
      // Instance terminée : grosse récompense d'XP pour chacun.
      CANAAN_PROGRESSION.clearInstanceXp(index, member);
      const gold = instances[index].raid
        ? 150 + Math.floor(Math.random() * 101)
        : 60 + Math.floor(Math.random() * 41);
      member.player.gold += gold;
      canaanLootNotice(member, '💰 +' + gold + ' or dans le coffre');
    }
  } else {
    if (!CANAAN_BAG.count(hero, 'key', 'secret')) {
      canaanLootNotice(
        hero,
        '🔒 Coffre secret verrouillé : il faut une clé des secrets. Les boss cachés des donjons et des raids en donnent une.'
      );
      return true;
    }
    CANAAN_BAG.remove(hero, 'key', 'secret', 0, 1);
    game.world.openedChests.push(c.id);
    canaanAchieve(hero, 'chest');
    const gold = 200 + Math.floor(Math.random() * 201);
    p.gold += gold;
    // Objet Épique au niveau de la zone du coffre (le milieu de sa plage) ; dans les Tréfonds, au niveau du héros.
    const [lo, hi] = ZONE_LEVELS[canaanZoneIndexAt(c.x, c.y)],
      level = c.layer === 'under' ? clampLevel(hero.level) : Math.round((lo + hi) / 2);
    // Sac plein : sacoche de butin (ou poudres), jamais perdu.
    grantSourceReward('secretChest', hero, level);
    let extra = '';
    if (Math.random() < SECRET_CHEST_RUBIS) {
      const got = CANAAN_RUBIS.grant(null, hero);
      extra = ' + Rune ' + got.rubis.name + (got.fresh ? ' (nouvelle !)' : '');
    }
    canaanLootNotice(hero, '🗝️ Coffre secret ouvert : équipement Épique + ' + gold + ' or' + extra + ' !');
    CANAAN_WARDROBE.drop('secretChest', hero);
  }
  saveGame();
  return true;
}
function drawChests() {
  let list = game.world.instance
    ? game.world.chests
    : canaanSecretChests()
        .filter(c => !game.world.openedChests.includes(c.id))
        .map(chestPosition)
        .filter(c => Math.abs(c.x * TS - P.x) < W && Math.abs(c.y * TS - P.y) < H);
  for (const ch of list) {
    if (ch.opened) continue;
    let x = ch.x * TS,
      y = ch.y * TS;
    drawCanaanChest(ctx, x, y, !!ch.instance, ch.x * 7 + ch.y);
    if (Math.hypot(P.x - x, P.y - y) < 95) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px Palatino Linotype, Georgia, serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1a1008';
      // Coffre secret : il faut une clé des secrets.
      const text = ch.instance
        ? '[E] Ouvrir'
        : Number(P.keys) > 0
          ? '[E] Ouvrir (🗝️ ' + Math.floor(P.keys) + ')'
          : '🔒 Clé des secrets requise';
      ctx.strokeText(text, x, y - 40);
      ctx.fillStyle = '#f6dc98';
      ctx.fillText(text, x, y - 40);
      ctx.restore();
    }
  }
}
