// CANAAN EXPANSION — world, instances and equipment
// Un seul lieu sûr : le Camp de l'Aurore (voir CANAAN_CAMP). La liste reste utilisée par isSafe et la carte.
const villages = [{ name: CANAAN_CAMP.name, x: CANAAN_CAMP.x, y: CANAAN_CAMP.y, r: CANAAN_CAMP.r }];
// Donjons et raids : biome d'accueil ; la position est fixée par la génération de l'île.
const instances = createInstances();
// Dans l'enceinte du Camp de l'Aurore (case ou position en cases) : son emprise ou le cercle autour du feu.
function canaanInCamp(x, y, margin = 0) {
  const c = CANAAN_CAMP,
    dx = Math.floor(x) - c.x,
    dy = Math.floor(y) - c.y;
  return (
    Math.hypot(x - c.x, y - c.y) < c.r + 2 + margin ||
    c.area.some(
      ([x0, y0, x1, y1]) => dx >= x0 - margin && dx <= x1 + margin && dy >= y0 - margin && dy <= y1 + margin
    )
  );
}
function isSafe(x, y) {
  // Tréfonds : la Forteresse naine de Durgrim est le seul lieu sûr.
  if (canaanUnder()) return CANAAN_UNDER.safe(x, y);
  // La cité elfique de Sylvaëlle (dans sa palissade) est sûre elle aussi.
  return canaanInCamp(x, y) || canaanInHouse(x, y) || canaanInCity(x, y);
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

// PV et mana maximum d'un héros après un changement (équipement, talents, artéfacts) : l'hôte via recomputeStats.
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
  // Arène : un artéfact par boss vaincu ; les clones ne donnent rien.
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
  // Montures rares : boss mondiaux, et créatures désignées par leur nom (« mob:… »).
  if (m.worldBoss) CANAAN_MOUNTS.drop('worldBoss', hero);
  else if (!m.boss) CANAAN_MOUNTS.drop('mob:' + m.t, hero);
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
  // Plus d'armes au butin : chaque classe a la sienne.
  const slots = Object.keys(gearSlots).filter(k => !SECOND_SLOT_OF[k] && k !== 'weapon'),
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
      ring: 'Anneau'
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
  gearDuo = false;
  document.getElementById('window').classList.remove('rpg-modern');
  delete document.getElementById('window').dataset.size;
  document.getElementById('overlay').style.display = 'none';
  hideGearTooltip();
}
// Position de défilement d'une zone, reconnue d'un dessin à l'autre : son nom (data-keep-scroll) ou la suite de ses
// classes jusqu'à la fenêtre (deux zones de même forme dans deux onglets différents portent un data-keep-scroll).
function canaanScrollKey(el, win) {
  if (el.dataset.keepScroll) return 'k:' + el.dataset.keepScroll;
  const path = [];
  for (let e = el; e && e !== win; e = e.parentElement)
    path.push(e.tagName + '.' + (e.getAttribute('class') || ''));
  return path.join('<');
}
// Taille de chaque fenêtre, comme dans les grands MMO : une taille fixe adaptée à ce qu'elle montre (petit sac,
// petite fiche, grands talents et collections…). Chaque fenêtre la déclare dans son propre contenu
// (data-panel-size="bag", "char", "duo", "md" ou "lg") ; showPanel la pose en data-size sur la fenêtre, décrite dans
// styles/panel-sizes.css. Sans déclaration (dialogues, boutiques, portails, carte), la fenêtre garde la taille de son
// contenu. Dans une fenêtre à taille fixe, seule sa zone .panel-scroll défile, et seulement si elle déborde.
const CANAAN_PANEL_SIZE = /data-panel-size="(bag|char|duo|md|lg)"/;
function canaanPanelSize(win, html) {
  const found = CANAAN_PANEL_SIZE.exec(html);
  if (found) win.dataset.size = found[1];
  else delete win.dataset.size;
}
// Toute fenêtre redessinée garde la position de chacune de ses zones qui défilent (un clic dans une longue liste ne
// la remet pas en haut) ; une zone absente du nouveau dessin repart du haut.
function showPanel(html) {
  clearTouchControls();
  const win = document.getElementById('window'),
    oldScroll = win.scrollTop,
    kept = new Map();
  for (const el of win.querySelectorAll('*')) {
    if (!el.scrollTop) continue;
    const key = canaanScrollKey(el, win);
    if (!kept.has(key)) kept.set(key, []);
    kept.get(key).push(el.scrollTop);
  }
  // Toute nouvelle fenêtre remplace le sac ou la fiche : ils se réinscrivent eux-mêmes (prepare) une fois dessinés.
  currentGearPanel = '';
  if (!String(html).includes('data-panel-size="duo"')) gearDuo = false;
  delete win.dataset.canaanPanel;
  document.getElementById('dialog').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
  win.innerHTML =
    '<button type="button" class="os-close" aria-label="Fermer la fenêtre" title="Fermer (Échap)" data-action="closePanels">×</button>' +
    html;
  canaanPanelSize(win, html);
  win.scrollTop = oldScroll;
  if (!kept.size) return;
  const seen = new Map();
  for (const el of win.querySelectorAll('*')) {
    if (el.scrollHeight <= el.clientHeight) continue;
    const key = canaanScrollKey(el, win),
      list = kept.get(key);
    if (!list) continue;
    const i = seen.get(key) || 0;
    seen.set(key, i + 1);
    if (list[i]) el.scrollTop = list[i];
  }
}
let currentGearPanel = '',
  gearDuo = false; // sac et fiche affichés côte à côte (ui.js, renderGearDuo)
// Sac ou fiche affiché : 'inventory', 'character', 'duo' (les deux), sinon null.
function shownGearPanel() {
  const shown = modalOpen() && document.getElementById('window').dataset.canaanPanel;
  return shown === 'inventory' || shown === 'character' || shown === 'duo' ? shown : null;
}
// I avec la fiche ouverte (ou C avec le sac ouvert) ajoute l'autre à côté ; I ou C referme ensuite seulement le sien.
function toggleGearPanel(mine, other) {
  const shown = shownGearPanel();
  if (shown === other || shown === 'duo') {
    gearDuo = shown === other;
    if (gearDuo) renderInventory();
    else if (other === 'character') renderCharacter();
    else renderInventory();
    return;
  }
  if (modalOpen()) {
    closePanels();
    return;
  }
  if (mine === 'inventory') renderInventory();
  else renderCharacter();
}
function toggleInventory() {
  toggleGearPanel('inventory', 'character');
}
function toggleCharacter() {
  toggleGearPanel('character', 'inventory');
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
// slot : emplacement choisi pour une bague (ring ou ring2) ; sinon le premier libre (equipSlotFor).
function equipBagIndex(index, slot = null) {
  if (game.hero.inventory[index]) equipItem(game.hero.inventory[index].id, game.hero, slot);
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
// 50 et 51 : herbe dorée et blé de la terre du sud-ouest (Extension 1).
BIOME_COLORS[50] = '#8a9a3e';
BIOME_COLORS[51] = '#c8a040';
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

function drawWorldFeatures(c) {
  // En instance, le titre et la sortie sont dessinés par canaan-dungeons ; les Tréfonds, par underground.js.
  if (game.world.instance || canaanUnder()) return;
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
    // Entrée en pixel art posée dans son biome (portal-art.js).
    CANAAN_PORTAL_ART.draw(c, i, x, y);
    c.restore();
  }
  // Colisée de l'Arène des Épreuves, près du camp.
  const ax = CANAAN_ARENA_PORTAL.x * TS,
    ay = CANAAN_ARENA_PORTAL.y * TS;
  if (ax > camX - 220 && ax < camX + W + 220 && ay > camY - 220 && ay < camY + H + 260) {
    c.save();
    CANAAN_PORTAL_ART.draw(c, 'arena', ax, ay);
    c.restore();
  }
}

// Huit boss mondiaux persistants répartis dans les six biomes ; position fixée par la génération de l'île.
// Les boss mondiaux des extensions présentes (ext : leur extension) s'y ajoutent ; leur extension les place.
const WORLD_BOSSES = [
  ...WORLD_BOSS_DEFS,
  ...canaanExtensionIds().flatMap(id => canaanExtension(id).worldBosses || [])
].map(b => ({ ...b, x: 0, y: 0 }));
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
      // Boss d'une extension : elle le fait apparaître elle-même (arène, statues, PV selon les participants).
      if (b.ext) continue;
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
  // Boss des extensions présentes : chacune fait apparaître les siens, au même rythme.
  if (!game.world.instance) CANAAN_EXT.spawnBosses();
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
// Coffre de fin d'instance : une bourse d'or (400–600 en donjon, 1 000–1 500 en raid, ×1,5 en héroïque) et la grosse récompense d'XP pour
// chaque héros du groupe ; l'équipement vient des boss (30 % de chance chacun, dungeons.js).
// Coffre secret de l'île ou des Tréfonds : il faut une clé des secrets (boss cachés des donjons) ; seul celui qui
// l'ouvre est récompensé : un équipement Épique au niveau de la zone, et 200 à 400 or.
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
      const gold = instanceChestGold(
        !!instances[index].raid,
        game.world.instance.difficulty === 'heroic',
        Math.random
      );
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
    canaanLootNotice(hero, '🗝️ Coffre secret ouvert : équipement Épique + ' + gold + ' or !');
    CANAAN_WARDROBE.drop('secretChest', hero);
    CANAAN_MOUNTS.drop('secretChest', hero);
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
      // Coffre secret : il faut une clé des secrets.
      const text = ch.instance
        ? '[E] Ouvrir'
        : Number(P.keys) > 0
          ? '[E] Ouvrir (🗝️ ' + Math.floor(P.keys) + ')'
          : '🔒 Clé des secrets requise';
      drawCanaanPrompt(ctx, text, x, y - 40);
    }
  }
}
