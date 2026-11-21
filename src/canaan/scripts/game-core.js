const cv = document.getElementById('game'),
  ctx = cv.getContext('2d');
// CONTRAT DE CHARGEMENT (voir docs/INITIALIZATION.md) :
// 1. Chaque fonction partagée est définie une seule fois, dans son module propriétaire.
// 2. Aucun module n'appelle une fonction d'un module chargé après lui pendant son propre chargement.
// 3. Le bootstrap vérifie les exports et les liaisons requises avant de charger la partie.
let W, H;
function resize() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
}
resize();
addEventListener('resize', resize);
const TS = 48,
  MAPW = 400,
  MAPH = 400;
// --- World generation ---
// Générateurs indépendants : monde reproductible, jeu et effets sans influence sur la carte.
// L'île est générée par canaan-world-generation ; ici, seulement l'océan initial.
game.world.tiles = Array.from({ length: MAPH }, () => Array(MAPW).fill(0));
game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
const CANAAN_WORLD_SEED = 1337;
let worldSeed = CANAAN_WORLD_SEED;
function worldRnd() {
  worldSeed = (worldSeed * 16807) % 2147483647;
  return worldSeed / 2147483647;
}
function rnd() {
  return Math.random();
}
function visualRnd() {
  return Math.random();
}
// Camp de l'Aurore : seule zone sûre de l'île, au cœur des Plaines verdoyantes (coordonnées en tuiles).
const CANAAN_CAMP = Object.freeze({ name: 'Camp de l’Aurore', x: 72, y: 234, r: 10 });
// Intérieurs des bâtiments où l'on entre (house.js) : chaque pièce est posée dans un coin d'océan de la carte
// (cases, murs compris), assez loin des autres pour qu'on n'en voie qu'une à la fois. La première est la maison
// du joueur ; viennent ensuite l'échoppe, la cuisine et les demeures du camp, puis l'intérieur de chaque refuge.
const CANAAN_ROOMS = Object.freeze(
  [
    { id: 'maison', name: 'Chaumière des Glycines', kind: 'home', x: 8, y: 8, w: 15, h: 11 },
    { id: 'echoppe', name: 'Échoppe de Lira', kind: 'shop', x: 38, y: 8, w: 13, h: 9 },
    { id: 'marmite', name: 'La Marmite dorée', kind: 'kitchen', x: 68, y: 8, w: 13, h: 9 },
    { id: 'aubepines', name: 'Demeure des Aubépines', kind: 'dwelling', x: 98, y: 8, w: 11, h: 9 },
    { id: 'puits', name: 'Demeure du Puits', kind: 'dwelling', x: 8, y: 32, w: 11, h: 9 },
    { id: 'chene', name: 'Refuge du Vieux Chêne', kind: 'refuge', x: 38, y: 32, w: 11, h: 9 },
    { id: 'clairieres', name: 'Refuge des Clairières', kind: 'refuge', x: 68, y: 32, w: 11, h: 9 },
    { id: 'oasis', name: 'Refuge de l’Oasis', kind: 'refuge', x: 98, y: 32, w: 11, h: 9 },
    { id: 'dunes', name: 'Camp des Dunes', kind: 'refuge', x: 8, y: 56, w: 11, h: 9 },
    // Refuges du marais, de l'automne et de la Forêt enchantée : dans le coin d'océan au nord-est.
    { id: 'pilotis', name: 'Refuge des Pilotis', kind: 'refuge', x: 330, y: 8, w: 11, h: 9 },
    { id: 'rousses', name: 'Refuge des Feuilles Rousses', kind: 'refuge', x: 360, y: 8, w: 11, h: 9 },
    { id: 'cristaux', name: 'Refuge des Cristaux', kind: 'refuge', x: 360, y: 32, w: 11, h: 9 },
    // Sylvaëlle, la cité elfique : la demeure de la Reine, la taverne, les deux échoppes, la tour, le temple et deux
    // maisons (océan du nord) ; la grange et le poulailler du camp (océan de l'est).
    { id: 'sylv_palais', name: 'Demeure de la Reine Elwë', kind: 'palace', x: 130, y: 6, w: 17, h: 11 },
    { id: 'sylv_taverne', name: 'Taverne de la Feuille d’Or', kind: 'elftavern', x: 160, y: 6, w: 13, h: 9 },
    { id: 'sylv_armurerie', name: 'Armurerie de Sylvaëlle', kind: 'elfshop', x: 190, y: 6, w: 13, h: 9 },
    { id: 'sylv_couture', name: 'Atelier de la Tisseuse', kind: 'elfshop', x: 220, y: 6, w: 13, h: 9 },
    { id: 'sylv_tour', name: 'Tour des Étoiles', kind: 'elfstar', x: 250, y: 6, w: 13, h: 9 },
    { id: 'sylv_temple', name: 'Temple de la Lune', kind: 'temple', x: 280, y: 6, w: 13, h: 9 },
    { id: 'sylv_maison', name: 'Maison des Feuillages', kind: 'elfhome', x: 310, y: 6, w: 13, h: 9 },
    { id: 'sylv_racines', name: 'Maison des Racines', kind: 'elfroots', x: 336, y: 60, w: 13, h: 9 },
    { id: 'grange', name: 'Grange du Camp', kind: 'barn', x: 336, y: 90, w: 15, h: 9 },
    { id: 'poulailler', name: 'Poulailler', kind: 'barn', x: 366, y: 90, w: 11, h: 9 },
    // Forteresse naine de Durgrim, dans les Tréfonds (under) : pièces creusées dans la roche, au nord de la carte.
    {
      id: 'dur_hall',
      name: 'Grand Hall de Durgrim',
      kind: 'dwarfhall',
      under: true,
      x: 10,
      y: 10,
      w: 17,
      h: 11
    },
    { id: 'dur_forge', name: 'Forge de Durgrim', kind: 'dwarfforge', under: true, x: 40, y: 10, w: 13, h: 9 },
    {
      id: 'dur_taverne',
      name: 'Taverne de Dorn',
      kind: 'dwarftavern',
      under: true,
      x: 70,
      y: 10,
      w: 13,
      h: 9
    },
    {
      id: 'dur_coffre',
      name: 'Chambre forte de Gimra',
      kind: 'dwarfvault',
      under: true,
      x: 100,
      y: 10,
      w: 11,
      h: 9
    },
    {
      id: 'dur_maison1',
      name: 'Maison de la famille Pied-de-Roc',
      kind: 'dwarfhome',
      under: true,
      x: 130,
      y: 10,
      w: 11,
      h: 9
    },
    {
      id: 'dur_maison2',
      name: 'Maison de la famille Marteau-d’Or',
      kind: 'dwarfhome',
      under: true,
      x: 160,
      y: 10,
      w: 11,
      h: 9
    }
  ].map(r => Object.freeze(r))
);
// Pièce qui contient la case (tx, ty), murs compris, ou null dehors (et toujours null en donjon, dont la carte
// réutilise les mêmes coordonnées).
// Les pièces des Tréfonds (under) n'existent que sous terre, les autres qu'à la surface.
function canaanRoomAt(tx, ty) {
  if (game.world.instance) return null;
  const under = game.world.layer === 'under';
  for (const r of CANAAN_ROOMS)
    if (!!r.under === under && tx >= r.x - 1 && ty >= r.y - 1 && tx < r.x + r.w + 1 && ty < r.y + r.h + 1)
      return r;
  return null;
}
function canaanInHouse(tx, ty) {
  return !!canaanRoomAt(tx, ty);
}
// Point d'apparition et de résurrection du héros : au sud du feu de camp, en pixels.
const CANAAN_SPAWN = Object.freeze({ x: (CANAAN_CAMP.x + 0.5) * TS, y: (CANAAN_CAMP.y + 3.5) * TS });
// Eau profonde, roche, murs et lacs scintillants bloquent le passage ; l'eau peu profonde se traverse.
// 19 herse et 22 danger (lave, gouffre, vide…) n'existent qu'en instance.
// 31 : murs des intérieurs ; 32 : bâtiments vus de l'extérieur (voir house.js).
// Tréfonds (underground.js) : 43 rivière de boue, 44 paroi rocheuse, 48 lac souterrain, 49 gouffre.
// 37 : palissade de troncs autour de la cité elfique et le long de l'ancienne crête (et les emprises de la cité :
// bâtiments, Grand Arbre, fontaine), peinte sur le sol de son biome (CANAAN_WOOD_GROUND).
const CANAAN_WOOD_TILE = 37;
const CANAAN_WOOD_GROUND = new Map();
const SOLID = [0, 4, 9, 18, 19, 22, 23, 31, 32, 37, 43, 44, 48, 49];
function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return 4;
  return game.world.tiles[y][x];
}
// --- Player ---
// Mana maximum de base du héros (300 depuis la 1.9.0), avant les bonus de talents.
const CANAAN_BASE_MANA = 300;
// Régénération par seconde, appliquée à chaque tick.
// Hors combat : 6 mana, et 2 points de vie + 1 % des PV max.
// En combat (5 s après le dernier coup donné ou reçu, ou tout combat d'Arène) : 3 mana, et 25 % de la régénération de vie.
const CANAAN_REGEN = Object.freeze({
  mana: 6,
  manaCombat: 3,
  health: 2,
  healthPercent: 0.01,
  healthCombat: 0.25
});
function canaanRegenRates(fighting = CANAAN_RUBIS.inCombat(), player = P) {
  const health = CANAAN_REGEN.health + player.mhp * CANAAN_REGEN.healthPercent;
  return {
    mana: fighting ? CANAAN_REGEN.manaCombat : CANAAN_REGEN.mana,
    health: fighting ? health * CANAAN_REGEN.healthCombat : health
  };
}
const P = {
  x: CANAAN_SPAWN.x,
  y: CANAAN_SPAWN.y,
  vx: 0,
  vy: 0,
  hp: 100,
  mhp: 100,
  mp: CANAAN_BASE_MANA,
  mmp: CANAAN_BASE_MANA,
  gold: 0,
  face: 0,
  anim: 0,
  atk: 0,
  dead: false
};
game.hero.player = P;
const SKILLS = [];
// Effets d'affichage ; les entités simulées (monstres, projectiles, butins, PNJ) sont dans game.world.
let particles = [],
  floaters = [];

// Monsters are spawned after world settlements are initialized.
// Compteur de victimes : game.hero.kills.
// Input
const keys = {};
// Touches des fenêtres : la même touche ferme sa fenêtre, une autre passe directement à la sienne.
const CANAAN_PANEL_KEYS = {
  talents: 'toggleTalents',
  inventory: 'toggleInventory',
  character: 'toggleCharacter',
  map: 'toggleMap',
  group: 'toggleGroup',
  trade: 'toggleTrade',
  professions: 'toggleProfessions',
  journal: 'toggleJournal',
  achievements: 'toggleAchievements',
  wardrobe: 'toggleCollections'
};
let canaanPanelOpen = null,
  canaanPanelOpening = null,
  canaanPanelsTracked = false;
// Retient quelle touche a ouvert la fenêtre affichée (les fenêtres ouvertes autrement n'en ont pas).
function canaanTrackPanels() {
  if (canaanPanelsTracked) return;
  canaanPanelsTracked = true;
  for (const name of Object.values(CANAAN_PANEL_KEYS)) {
    const fn = window[name];
    if (typeof fn !== 'function') continue;
    window[name] = function (...args) {
      canaanPanelOpening = name;
      try {
        return fn.apply(this, args);
      } finally {
        canaanPanelOpening = null;
        canaanPanelOpen = modalOpen() ? name : null;
      }
    };
  }
  const show = window.showPanel;
  if (typeof show === 'function')
    window.showPanel = function (...args) {
      const was = modalOpen(),
        r = show.apply(this, args);
      if (!canaanPanelOpening && !was) canaanPanelOpen = null;
      return r;
    };
}
function canaanPanelKey(action) {
  const name = action && Object.hasOwn(CANAAN_PANEL_KEYS, action) ? CANAAN_PANEL_KEYS[action] : null;
  if (!name || typeof window[name] !== 'function') return false;
  canaanTrackPanels();
  if (!modalOpen()) return false;
  // C ferme la fiche quel que soit son onglet, V les Collections quel que soit le leur (même ouvertes autrement).
  // Fenêtre Groupe : G ferme la page Compagnons, J la page Échange, et chacune passe à l'autre page.
  const shownPanel = document.getElementById('window')?.dataset.canaanPanel,
    groupPage = document.querySelector('#window .group-panel')
      ? 'toggleGroup'
      : document.querySelector('#window .trade-panel')
        ? 'toggleTrade'
        : null,
    same =
      groupPage && (name === 'toggleGroup' || name === 'toggleTrade')
        ? groupPage === name
        : canaanPanelOpen === name ||
          (shownPanel === 'character' && name === 'toggleCharacter') ||
          (shownPanel === 'collections' && name === 'toggleCollections');
  closePanels();
  canaanPanelOpen = null;
  if (!same) window[name]();
  return true;
}
addEventListener('keydown', e => {
  if (document.activeElement === chatInput) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  let k = e.key.toLowerCase();
  if (!started) return;
  // Action de la touche selon les Paramètres → Clavier (ou envoyée directement par la manette).
  const action = CANAAN_KEYS.actionOf(e);
  if (k === 'escape') {
    e.preventDefault();
    if (modalOpen()) {
      closePanels();
      return;
    }
    if (document.getElementById('dialog').style.display === 'block') {
      document.getElementById('dialog').style.display = 'none';
      return;
    }
    togglePause();
    return;
  }
  const typing =
    e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
  if (
    !paused &&
    modalOpen() &&
    !typing &&
    !e.repeat &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    canaanPanelKey(action)
  ) {
    e.preventDefault();
    return;
  }
  // Une fenêtre ouverte (sac, carte, fiche…) ne bloque pas le héros ; seule la saisie dans un champ garde ses touches.
  if (paused || typing) return;
  canaanTrackPanels();
  keys[k] = true;
  if (!action || e.repeat) return;
  // Roulade d'esquive, dans la direction du déplacement (sinon vers la visée).
  if (action === 'dodge') {
    e.preventDefault();
    const [dx, dy] = canaanMoveAxes();
    canaanDodge(dx, dy);
    return;
  }
  if (action === 'switchWeapon') {
    e.preventDefault();
    switchWeapon();
    return;
  }
  if (action === 'interact') return interact();
  if (action === 'chat') {
    e.preventDefault();
    return chatInput.focus();
  }
  if (/^skill[1-4]$/.test(action)) return useSkill(+action.slice(5) - 1);
  // Actions des extensions (leurs touches, Paramètres → Clavier).
  if (CANAAN_EXT.key(action)) return e.preventDefault();
  if (Object.hasOwn(CANAAN_PANEL_KEYS, action)) {
    e.preventDefault();
    window[CANAAN_PANEL_KEYS[action]]();
  }
});
// Direction voulue au clavier : touches choisies dans les Paramètres, et toujours les flèches.
function canaanMoveAxes() {
  const on = (id, arrow) => keys[arrow] || CANAAN_KEYS.held(keys, id);
  return [
    (on('moveRight', 'arrowright') ? 1 : 0) - (on('moveLeft', 'arrowleft') ? 1 : 0),
    (on('moveDown', 'arrowdown') ? 1 : 0) - (on('moveUp', 'arrowup') ? 1 : 0)
  ];
}
addEventListener('keyup', e => (keys[e.key.toLowerCase()] = false));
cv.addEventListener('mousedown', e => {
  if (!started || paused || P.dead || document.getElementById('dialog').style.display === 'block') return;
  // Clic gauche : attaque de base rapide · clic droit : attaque de base lourde (sans mana, maintien possible).
  canaanHoldBasicAttack(e.button, true, e.clientX, e.clientY);
});
cv.addEventListener('contextmenu', e => e.preventDefault());
// camera
let camX = 0,
  camY = 0;
// Borne une coordonnée de caméra pour que la vue (view px) reste dans la carte (size px) ; centrée si la vue est
// plus grande que la carte.
function canaanClampCam(cam, view, size) {
  return view >= size ? (size - view) / 2 : Math.min(Math.max(cam, 0), size - view);
}
// chat
const chatLog = document.getElementById('chatlog'),
  chatInput = document.getElementById('chatinput');
// Messages de la simulation et de l'interface : passent par le relais game.view.
function chat(who, msg) {
  game.view.chat(who, msg);
}
function showChat(who, msg) {
  let d = document.createElement('div');
  // L'expéditeur (« Système », un pseudo) : traduit s'il est connu ; le message passe par la traduction de l'affichage.
  d.textContent = (who ? '[' + tt(who) + '] ' : '') + msg;
  chatLog.appendChild(d);
  chatLog.scrollTop = 1e9;
  while (chatLog.children.length > 40) chatLog.firstChild.remove();
}
showChat('Système', 'Bienvenue à Canaan, héros. Explore, combats, deviens légende.');
chatInput.addEventListener('keydown', e => {
  if (e.key == 'Enter') {
    if (chatInput.value.trim()) {
      chat('Moi', chatInput.value);
      // En ligne, le message part aussi vers le groupe.
      CANAAN_NET.sendChat(chatInput.value);
      chatInput.value = '';
    }
    chatInput.blur();
  }
  e.stopPropagation();
});
// toast
let toastT;
function toast(m) {
  game.view.notify(m);
}
function showToast(m) {
  let t = document.getElementById('toast');
  t.textContent = m;
  t.style.opacity = 1;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.style.opacity = 0), 2200);
}
// L'interface branche ses fonctions d'affichage sur le relais.
game.view.notify = showToast;
game.view.chat = showChat;
// skills UI
// Barre des compétences : remplie par refreshWeaponBar, clics délégués par canaan-controls.
const skEl = document.getElementById('skills');

let mouseWorldX = 0,
  mouseWorldY = 0;
addEventListener('mousemove', e => {
  mouseWorldX = e.clientX + camX;
  mouseWorldY = e.clientY + camY;
});

// Chiffres flottants et éclats : affichés ici, et transmis aux invités en ligne par game.view.fx (hôte).
function float(x, y, txt, c) {
  floaters.push({ x, y, txt, c, life: 50 });
  CANAAN_SOUND.floatText(x, y, txt, c);
  game.view.fx?.('f', [Math.round(x), Math.round(y), String(txt).slice(0, 40), c]);
}
function burst(x, y, c, n) {
  game.view.fx?.('b', [Math.round(x), Math.round(y), c, Math.min(40, n | 0)]);
  for (let i = 0; i < n; i++) {
    let a = rnd() * 6.283;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (1 + rnd() * 4),
      vy: Math.sin(a) * (1 + rnd() * 4),
      life: 20 + rnd() * 20,
      c,
      r: 2 + rnd() * 3
    });
  }
}
// dialog
// Mort de l'hôte (ou de tout le groupe) : retour au camp 1,5 s plus tard, l'instance est quittée
// et tout le groupe se relève avec lui. Un seul retour à la fois, même si plusieurs morts l'annoncent.
let canaanRespawnPending = false;
function canaanHostRespawn(message) {
  P.dead = true;
  if (canaanRespawnPending) return;
  canaanRespawnPending = true;
  toast(message);
  setTimeout(() => {
    try {
      if (game.world.instance) leaveInstance();
    } finally {
      canaanRespawnPending = false;
      // Dans les Tréfonds, on se relève à la Forteresse de Durgrim ; sur l'île, au camp, ou à la cité elfique pour un
      // héros de niveau 60 tombé dans la Forêt enchantée ou dans la cité.
      const home = canaanUnder()
        ? CANAAN_UNDER.spawnPoint()
        : CANAAN_EXT.respawnFor(game.hero) || CANAAN_CITY.respawnFor(game.hero) || CANAAN_SPAWN;
      P.x = home.x;
      P.y = home.y;
      P.hp = P.mhp;
      P.dead = false;
      for (const hero of game.heroes) {
        if (hero === game.hero || !hero.player.dead) continue;
        hero.player.dead = false;
        hero.player.hp = Math.max(1, Math.round(hero.player.mhp * 0.5));
        hero.reviveAt = null;
        hero.player.x = P.x + (Math.random() - 0.5) * 60;
        hero.player.y = P.y + 40;
      }
      saveGame();
    }
  }, 1500);
}
function interact() {
  // Un invité n'ouvre ni coffre ni portail lui-même : le monde appartient à l'hôte. Il peut parler au marchand.
  if (game.mode === 'guest') {
    if (document.getElementById('dialog').style.display === 'block') return;
    // Un coffre à côté : l'hôte vérifie que le héros y est bien, puis l'ouvre pour lui.
    if (nearbyChest(P)) return CANAAN_NET.requestAction({ op: 'open-chest' });
    // Cité elfique : porte (l'hôte la fait passer), Grand Arbre et marchands (fenêtres chez l'invité).
    if (!game.world.instance && !canaanUnder() && CANAAN_CITY.guestUse()) return;
    // Salon de coiffure du camp : la fenêtre s'ouvre chez l'invité, « Valider » passe par l'hôte.
    if (CANAAN_BARBER.guestUse()) return;
    // Extensions : leurs lieux et personnages (fenêtres chez l'invité, le reste demandé à l'hôte).
    if (!canaanUnder() && CANAAN_EXT.guestUse()) return;
    // Donjon : mur fissuré, brasero, levier, stèle ou porte scellée (l'hôte agit pour lui).
    if (game.world.instance && CANAAN_DUNGEON_EXPLORE.near(P))
      return CANAAN_NET.requestAction({ op: 'dungeon-use' });
    // Portail de retour : c'est l'hôte qui le prend, pour tout le groupe.
    if (game.world.instance && CANAAN_DUNGEON_EXPLORE.takeExit()) return;
    if (game.world.instance) return;
    // Quêtes : PNJ de l'histoire, énigmes et objets (demandés à l'hôte) ; bâtiments : portes (île seulement).
    if (!canaanUnder() && CANAAN_QUESTS.interact()) return;
    if (CANAAN_HOUSE.interact()) return;
    // Pêche : lancer, ferrer ou remonter la ligne près d'un banc de poissons.
    if (CANAAN_PROF.interact()) return;
    const npc = game.world.npcs.find(
      n =>
        (n.type === 'shop' ||
          n.type === 'bank' ||
          n.type === 'dwarf' ||
          n.type === 'descend' ||
          n.type === 'ascend') &&
        canaanHere(n) &&
        Math.hypot(P.x - n.x, P.y - n.y) < 120
    );
    if (npc) openDialog(npc);
    // Rien d'autre à portée : creuser avec la pelle (l'hôte creuse pour lui).
    else CANAAN_DIG.interact();
    return;
  }
  if (openNearbyChest()) return;
  if (!game.world.instance && !canaanUnder() && CANAAN_CITY.interact()) return;
  if (CANAAN_BARBER.interact()) return;
  if (!canaanUnder() && CANAAN_EXT.interact(game.hero)) return;
  if (!game.world.instance && !canaanUnder() && CANAAN_QUESTS.interact()) return;
  if (!game.world.instance && CANAAN_HOUSE.interact()) return;
  if (!game.world.instance && CANAAN_PROF.interact()) return;
  if (game.world.instance?.arena) {
    CANAAN_ARENA.interact();
    return;
  }
  if (game.world.instance) {
    // Exploration : murs fissurés, braseros, leviers, stèles et portes scellées ; portail de retour une fois le
    // dernier boss vaincu.
    if (CANAAN_DUNGEON_EXPLORE.interact()) return;
    if (CANAAN_DUNGEON_EXPLORE.takeExit()) return;
    if (game.world.instance.cleared && Math.hypot(P.x - instanceEntrance.x, P.y - instanceEntrance.y) < 95) {
      leaveInstance();
      return;
    }
    if (Math.hypot(P.x - instanceEntrance.x, P.y - instanceEntrance.y) < 95) {
      leaveInstance();
      return;
    }
  }
  if (document.getElementById('dialog').style.display === 'block') return;
  let n = game.world.npcs
    .filter(
      n =>
        !game.world.instance &&
        canaanHere(n) &&
        Math.hypot(P.x - n.x, P.y - n.y) <
          (n.type === 'shop' || n.type === 'bank'
            ? 120
            : n.type === 'descend' || n.type === 'ascend'
              ? 100
              : 85)
    )
    .sort((a, b) => Math.hypot(P.x - a.x, P.y - a.y) - Math.hypot(P.x - b.x, P.y - b.y))[0];
  if (n) openDialog(n);
  // Rien d'autre à portée : creuser avec la pelle, si le héros en a une.
  else if (!game.world.instance) CANAAN_DIG.interact();
}
function openDialog(npc) {
  if (npc.type === 'portal') return openPortal(npc);
  if (npc.type === 'arena') return openArenaPortal();
  // Marchand et banquier saluent le héros (un babillage, voir audio.js).
  if (npc.type === 'shop' || npc.type === 'bank')
    CANAAN_SOUND.voice(npc.name || npc.type, 'Bienvenue, voyageur !', npc.x, npc.y);
  if (npc.type === 'shop') return openShop(npc);
  if (npc.type === 'bank') return CANAAN_BANK.open(npc);
  // Tréfonds : parler à un nain, descendre ou remonter par une entrée.
  if (npc.type === 'dwarf') return CANAAN_UNDER.talk(npc);
  if (npc.type === 'descend' || npc.type === 'ascend') return CANAAN_UNDER.use(npc);
}
// game loop
// Réglages d'affichage du menu Paramètres (settings.js) : secousses de l'écran, lueurs des lumières, particules et
// vent, chiffres de dégâts, compteur d'images par seconde et limite d'images (0 : aucune, l'écran décide).
const canaanDisplay = {
  shake: true,
  glow: true,
  particles: true,
  damage: true,
  fps: false,
  fpsCap: 0,
  rumble: true
};
let shake = 0,
  time = 0,
  started = false,
  paused = false;
setInterval(() => {
  if (started) saveGame();
}, 10000);
// saveGame est déclarée par canaan-persistence et appelée seulement après le démarrage.
addEventListener('beforeunload', () => {
  if (started) saveGame();
});
addEventListener('pagehide', () => {
  if (started) saveGame();
});
function startGame() {
  if (!window.CANAAN_READY) throw new Error(window.CANAAN_BOOT_ERROR || 'Initialisation du jeu incomplète');
  if (!canWalk(P.x, P.y, true)) {
    P.x = CANAAN_SPAWN.x;
    P.y = CANAAN_SPAWN.y;
  }
  document.getElementById('title').style.display = 'none';
  paused = false;
  document.getElementById('pauseScreen').classList.remove('visible');
  document.getElementById('pauseButton').textContent = '⏸ Pause';
  started = true;
  window.CANAAN_CLOCK.reset();
  mouseWorldX = P.x + 50;
  mouseWorldY = P.y;
  chat(
    'Système',
    'Clic gauche : attaque rapide · clic droit : attaque lourde (sans mana). Touches 1-4 : compétences · F : sort de classe. WASD/ZASD : déplacement · Maj/Espace : roulade · Q : changer d’arme · T : classe et talents · L : journal de quêtes.'
  );
  CanaanStages.restartMusic();
  // Un héros sans classe (aventure d'avant les classes) la choisit en arrivant.
  CANAAN_CLASS.promptClass();
}
function togglePause(force) {
  clearTouchControls();
  if (!started) return;
  if (modalOpen()) closePanels();
  document.getElementById('dialog').style.display = 'none';
  paused = typeof force === 'boolean' ? force : !paused;
  document.getElementById('pauseScreen').classList.toggle('visible', paused);
  document.getElementById('pauseButton').textContent = paused ? '▶ Reprendre' : '⏸ Pause';
  Object.keys(keys).forEach(k => (keys[k] = false));
  if (paused) saveGame();
}
function pauseSave() {
  toast(saveGame() ? '💾 Partie sauvegardée !' : 'Échec de sauvegarde : stockage indisponible.');
}
function pauseOpenPanel(which) {
  togglePause(false);
  if (which === 'inventory') renderInventory();
  else toggleMap();
}
// Retour au menu des aventures : sauvegarder, puis recharger la page sur l'écran titre.
function pauseToTitle() {
  clearTouchControls();
  saveGame();
  started = false;
  paused = true;
  Object.keys(keys).forEach(k => (keys[k] = false));
  CanaanStages.stopMusic();
  window.location.reload();
}
// Horloge fixe à 60 ticks/s, alimentée par le temps réel de requestAnimationFrame.
// Le mouvement, les cooldowns et l'IA ne dépendent pas du taux de rafraîchissement.
const CANAAN_TICK_MS = 1000 / 60;
// Vitesse de base du héros en pixels par tick (4,1 × 60 = 246 px/s, +20 % depuis la 1.9.0).
const CANAAN_PLAYER_SPEED = 4.1;
const CANAAN_MAX_FRAME_MS = 250;
const CANAAN_MAX_CATCHUP_STEPS = 8;
let canaanLastFrame = null,
  canaanAccumulator = 0;
// Interpolation de rendu : l'écran (60, 144 Hz ou plus) affiche une position intermédiaire
// entre les deux derniers ticks. La simulation reste à 60 ticks/s, identique sur tout écran.
const CANAAN_SNAP_DISTANCE = 96;
let canaanPrevCamX = null,
  canaanPrevCamY = null;
function canaanInterpolatedEntities() {
  return [P, ...game.world.monsters, ...game.world.projectiles, ...CANAAN_ARENA.entities()];
}
function canaanRememberPositions() {
  for (const e of canaanInterpolatedEntities()) {
    e._prevX = e.x;
    e._prevY = e.y;
  }
  canaanPrevCamX = camX;
  canaanPrevCamY = camY;
}
// Dessine à la fraction alpha du tick en cours, puis rend aux entités leur vraie position.
// Au-delà de CANAAN_SNAP_DISTANCE (téléportation, entrée d'instance), la position réelle est gardée.
function canaanDrawInterpolated(alpha) {
  const moved = [];
  const place = (target, xKey, yKey, prevX, prevY) => {
    const dx = target[xKey] - prevX,
      dy = target[yKey] - prevY;
    if ((!dx && !dy) || Math.abs(dx) + Math.abs(dy) > CANAAN_SNAP_DISTANCE) return;
    moved.push([target, xKey, yKey, target[xKey], target[yKey]]);
    target[xKey] = prevX + dx * alpha;
    target[yKey] = prevY + dy * alpha;
  };
  if (alpha < 1) {
    for (const e of canaanInterpolatedEntities())
      if (Number.isFinite(e._prevX) && Number.isFinite(e._prevY)) place(e, 'x', 'y', e._prevX, e._prevY);
    if (canaanPrevCamX !== null) {
      const camera = { camX, camY };
      place(camera, 'camX', 'camY', canaanPrevCamX, canaanPrevCamY);
      camX = camera.camX;
      camY = camera.camY;
    }
  }
  try {
    runDrawPipeline();
  } finally {
    for (const [target, xKey, yKey, x, y] of moved) {
      if (xKey === 'camX') {
        camX = x;
        camY = y;
      } else {
        target[xKey] = x;
        target[yKey] = y;
      }
    }
  }
}
window.CANAAN_CLOCK = {
  tickMs: CANAAN_TICK_MS,
  get accumulator() {
    return canaanAccumulator;
  },
  get ticks() {
    return time;
  },
  reset() {
    canaanLastFrame = null;
    canaanAccumulator = 0;
  }
};
// Limite d'images par seconde (Paramètres) et compteur d'images affiché à la demande.
let canaanLastDraw = null,
  canaanFpsFrames = 0,
  canaanFpsAt = 0;
function canaanCountFrame(now) {
  canaanFpsFrames++;
  if (now - canaanFpsAt < 500) return;
  const fps = Math.round((canaanFpsFrames * 1000) / Math.max(1, now - canaanFpsAt));
  canaanFpsFrames = 0;
  canaanFpsAt = now;
  const el = document.getElementById('fpsCounter');
  if (el) {
    el.hidden = !canaanDisplay.fps;
    if (canaanDisplay.fps) el.textContent = fps + ' i/s';
  }
}
function loop(timestamp) {
  requestAnimationFrame(loop);
  const now = Number.isFinite(timestamp) ? timestamp : performance.now();
  // Limite d'images : un rythme régulier (l'échéance avance d'un intervalle à la fois, pour garder la bonne moyenne
  // même quand l'écran ne propose que des instants fixes). Une image sautée garde son temps pour la simulation.
  if (canaanDisplay.fpsCap > 0) {
    const interval = 1000 / canaanDisplay.fpsCap;
    if (canaanLastDraw !== null && now - canaanLastDraw < interval - 1.5) {
      // Sans VSync, Chromium ralentit ses images quand rien ne change : un point invisible (coin sombre de la vignette)
      // garde le rythme rapide, pour que les limites au-delà de 60 images/s soient tenues.
      ctx.fillStyle = 'rgba(0,0,0,0.01)';
      ctx.fillRect(0, 0, 1, 1);
      return;
    }
    canaanLastDraw =
      canaanLastDraw !== null && now - canaanLastDraw < interval * 2 ? canaanLastDraw + interval : now;
  } else canaanLastDraw = now;
  canaanCountFrame(now);
  if (canaanLastFrame === null) {
    canaanLastFrame = now;
    runDrawPipeline();
    return;
  }
  const elapsed = Math.min(CANAAN_MAX_FRAME_MS, Math.max(0, now - canaanLastFrame));
  canaanLastFrame = now;
  if (started && !paused) {
    canaanAccumulator += elapsed;
    let steps = 0;
    while (canaanAccumulator >= CANAAN_TICK_MS && steps < CANAAN_MAX_CATCHUP_STEPS) {
      canaanRememberPositions();
      time++;
      // Un invité ne simule rien : il envoie son intention et affiche le monde de l'hôte.
      if (game.mode === 'guest') readInput();
      else {
        runUpdatePipeline();
        updateWorld();
      }
      CANAAN_NET.tick();
      updateView();
      canaanAccumulator -= CANAAN_TICK_MS;
      steps++;
    }
    // Ne pas accélérer brutalement le jeu après un onglet bloqué.
    if (steps === CANAAN_MAX_CATCHUP_STEPS) canaanAccumulator = 0;
    canaanDrawInterpolated(Math.min(1, canaanAccumulator / CANAAN_TICK_MS));
    return;
  }
  // En pause ou hors partie : positions réelles, sans interpolation.
  canaanAccumulator = 0;
  runDrawPipeline();
}
addEventListener('visibilitychange', () => {
  if (document.hidden) window.CANAAN_CLOCK.reset();
});
// wade : la mer peu profonde autour de l'île porte (héros, monstres qui les poursuivent) ; world-shallows.js.
function canWalk(x, y, wade = false) {
  let r = 12;
  return [
    [-r, -r],
    [r, -r],
    [-r, r],
    [r, r]
  ].every(([a, b]) => {
    // Tréfonds : la roche et les bâtiments souterrains bloquent ; rien de la surface (quêtes, maisons) ne compte.
    if (canaanUnder())
      return (
        !SOLID.includes(tileAt(Math.floor((x + a) / TS), Math.floor((y + b) / TS))) &&
        !CANAAN_UNDER.blocked(x + a, y + b)
      );
    // Lieux des quêtes : socles et haies bloquent, nénuphars et pont restauré portent (quests.js).
    const quest = canaanQuestWalk(x + a, y + b);
    if (quest !== null) return quest;
    const tx = Math.floor((x + a) / TS),
      ty = Math.floor((y + b) / TS);
    return (
      (!SOLID.includes(tileAt(tx, ty)) || (wade && CANAAN_SHALLOWS.wadeable(tx, ty))) &&
      !canaanHouseBlocked(x + a, y + b) &&
      !canaanTreeBlocked(x + a, y + b) &&
      !canaanPortalBlocked(x + a, y + b) &&
      !CANAAN_CITY.blocked(x + a, y + b) &&
      !CANAAN_EXT.blocked(x + a, y + b)
    );
  });
}
// Grands arbres de l'île (décor) : leur tronc bloque le passage, on les contourne.
// Arbres elfiques de Sylvaëlle (elven-city.js) : bouleau d'argent, cerisier en fleurs, cyprès, saule lumineux.
const CANAAN_BIG_TREES = new Set([
  'tree',
  'pine',
  'snowpine',
  'palm',
  'deadwood',
  'bigtree',
  'twisted',
  'autumn_red',
  'autumn_orange',
  'autumn_gold',
  'goldtree',
  'glowtree',
  'elftree',
  'blossom',
  'elfcypress',
  'elfwillow'
]);
function canaanTreeBlocked(px, py) {
  if (game.world.instance || game.world.layer === 'under') return false;
  const tx = Math.floor(px / TS),
    ty = Math.floor(py / TS);
  if (!CANAAN_BIG_TREES.has(game.world.overdecor?.[ty]?.[tx])) return false;
  const lx = px - tx * TS,
    ly = py - ty * TS;
  return lx >= 16 && lx <= 32 && ly >= 26 && ly <= 46;
}
// Entrées des donjons, des raids et de l'Arène (île et Tréfonds) : leur pied bloque le passage (portal-art.js).
function canaanPortalBlocked(px, py) {
  return !game.world.instance && CANAAN_PORTAL_ART.blocked(px, py);
}
// Meubles des bâtiments et objets du camp qui bloquent le passage (remplacé par house.js).
let canaanHouseBlocked = () => false;
// Passage dans les lieux des quêtes : true (praticable), false (bloqué) ou null (règle normale) ; remplacé par quests.js.
let canaanQuestWalk = () => null;
// Lieux des quêtes reposés sur une île régénérée (remplacé par quests.js).
let canaanQuestWorld = () => {};
// Vie du Camp de l'Aurore (ferme, enclos, champs, verger, jardin, fontaine, ruisseau) : remplacé par camp-life.js.
// place : pose sur l'île ; blocked : objets qui bloquent ; farm : cases sans monstres ; animals / fliers : bêtes de la
// ferme pour life.js ; drawGround : eau, pavés, champs et fleurs (sous tout le reste) ; draw : bâtiments et objets.
let canaanCampLife = {
  occluders: () => [],
  place() {},
  blocked: () => false,
  farm: () => false,
  animals: () => [],
  fliers: () => [],
  drawGround() {},
  draw() {}
};

// Entrées du joueur → intention du héros (direction voulue et point visé), lue par la simulation.
function readInput() {
  const intent = game.hero.intent;
  [intent.dx, intent.dy] = canaanMoveAxes();
  intent.attack = CANAAN_BASIC_ATTACK.wanted();
  intent.aimX = mouseWorldX;
  intent.aimY = mouseWorldY;
}
// Un pas de simulation du héros, des monstres, des projectiles et des butins.
// Aucun accès à l'écran : les messages passent par game.view, l'affichage se fait dans updateView().
// Déplacement et régénération d'un héros selon son intention, à sa propre vitesse.
// L'hôte garde son étourdissement, son état de combat (Rubis) et la malédiction des soins de l'Arène.
function stepHero(hero) {
  const p = hero.player,
    host = hero === game.hero;
  // Mort, ou invité déconnecté (place réservée) : immobile.
  if (p.dead || hero.away) return;
  // Les durées d'animation avancent une seule fois par tick de simulation.
  if (p.atk > 0) p.atk = Math.max(0, p.atk - 1 / 60);
  let sp =
      CANAAN_PLAYER_SPEED *
      (1 + characterStats(hero).speed / 100) *
      CANAAN_PROF.speedMult(hero) *
      CANAAN_EXT.speed(hero) *
      CANAAN_SHALLOWS.speedAt(p.x, p.y),
    dx = Math.sign(hero.intent.dx),
    dy = Math.sign(hero.intent.dy);
  if (host && playerStun > 0) {
    playerStun = Math.max(0, playerStun - 1 / 60);
    sp = 0;
  }
  if (dx || dy) {
    let l = Math.hypot(dx, dy);
    dx /= l;
    dy /= l;
    p.anim += 0.25;
    if (dx) p.face = dx > 0 ? 1 : -1;
  }
  // Vitesse visible du héros : orientation et animation de marche du sprite.
  p.vx = dx * sp;
  p.vy = dy * sp;
  let nx = p.x + dx * sp,
    ny = p.y + dy * sp;
  if (canWalk(nx, p.y, true)) p.x = nx;
  if (canWalk(p.x, ny, true)) p.y = ny;
  // Régénération : un héros est en combat 5 s après son dernier coup donné ou reçu (Rubis compris).
  const fighting = CANAAN_RUBIS.inCombat(hero),
    regen = canaanRegenRates(fighting, p);
  p.mp = Math.min(p.mmp, p.mp + regen.mana / 60);
  p.hp = Math.min(p.mhp, p.hp + (regen.health / 60) * CANAAN_ARENA.healFactor(hero));
}
// Héros vivant le plus proche d'un monstre, ou null.
function nearestHero(m) {
  let best = null,
    bestDistance = Infinity;
  for (const hero of game.heroes) {
    const p = hero.player;
    // Un invité déconnecté (place réservée) n'est jamais visé ; caché par le Voile d'ombre, seuls les boss
    // (d'instance et mondiaux) le voient encore.
    if (p.dead || hero.away || (p.veiled && !m.boss && !m.worldBoss)) continue;
    const d = Math.hypot(p.x - m.x, p.y - m.y);
    if (d < bestDistance) {
      best = hero;
      bestDistance = d;
    }
  }
  return best;
}
// Coup reçu par un allié : réduction par ses propres statistiques (règle partagée), sans effet de l'hôte.
// Coup d'un monstre sur un allié : même moteur que pour l'hôte (roulade, déviation, postures, talents, Rubis).
function hurtAlly(hero, m) {
  return CANAAN_COMBAT.hurt(CANAAN_COMBAT.incoming(m, null, {}, hero), m, hero);
}
// Coup d'un projectile : celui d'un allié frappe avec ses statistiques ; celui de l'hôte passe par le moteur de combat.
function projectileStrike(p, m, value) {
  if (p.owner && p.owner !== game.hero) CANAAN_COMBAT.attack(m, value, p.combatContext || {}, p.owner);
  else hit(m, value, p.combatContext);
}
// Explosion à l'impact (comète du bâton) : la moitié des dégâts aux autres ennemis dans le rayon.
function projectileBlast(p, first) {
  CANAAN_SKILLS.fx('ring', p.x, p.y, 0, p.splash, 0, p.c, 0.45);
  for (const o of game.world.monsters.slice())
    if (o !== first && o.hp > 0 && canaanBodyGap(o, p.x, p.y) < p.splash)
      projectileStrike(p, o, Math.max(1, Math.round(p.dmg * 0.5)));
}
// Sillage : une poussière fine pour la flèche et l'orbe, une traînée épaisse pour la comète et la peste.
function projectileTrail(p) {
  if (p.kind === 'comet')
    for (let k = 0; k < 3; k++)
      particles.push({
        x: p.x - p.vx * k * 0.4 + (Math.random() - 0.5) * 10,
        y: p.y - p.vy * k * 0.4 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6 - 0.2,
        life: 22,
        c: k ? p.c : '#ffffff',
        r: 6 - k
      });
  else if (p.kind === 'plague')
    particles.push({
      x: p.x + (Math.random() - 0.5) * 8,
      y: p.y + (Math.random() - 0.5) * 8,
      vx: 0,
      vy: -0.3,
      life: 18,
      c: Math.random() < 0.5 ? p.c : '#3d5a1a',
      r: 4
    });
  else particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 12, c: p.c, r: 3 });
}
// Un pas de simulation des héros, des monstres, des projectiles et des butins.
// Aucun accès à l'écran : les messages passent par game.view, l'affichage se fait dans updateView().
function update() {
  for (const hero of game.heroes) stepHero(hero);
  SKILLS.forEach(s => {
    if (s.cd > 0) s.cd -= 1 / 60;
  });
  // monsters AI
  game.world.monsters.forEach(m => {
    // Les boss de l'Arène et leurs clones sont pilotés par canaan-arena.
    if (m.arenaBoss || m.arenaClone) return;
    // Cristaux de garde immobiles ; un boss qui incante reste sur place sans frapper (boss-mechanics.js).
    if (m.still || m.castUntil > time) {
      m.cd -= 1 / 60;
      return;
    }
    // Cible : le héros vivant le plus proche (gardée pour l'orientation du monstre).
    const target = nearestHero(m);
    m.targetHero = target;
    if (!target) {
      m.cd -= 1 / 60;
      return;
    }
    const T = target.player,
      exposed = !isSafe(T.x / TS, T.y / TS) || game.world.instance;
    let d = Math.hypot(T.x - m.x, T.y - m.y);
    if (d < (m.worldBoss ? 430 : 260) && d > 28 && exposed) {
      // Steering fluide: pas de micro-corrections sur les deux axes ni de tremblement au contact.
      const speed = m.worldBoss ? 1.05 : 1.22,
        ux = (T.x - m.x) / d,
        uy = (T.y - m.y) / d;
      let tx = m.x + ux * speed,
        ty = m.y + uy * speed;
      if (canWalk(tx, ty, true)) {
        m.x = tx;
        m.y = ty;
        m.stuck = 0;
      } else {
        m.stuck = (m.stuck || 0) + 1;
        let side = m.stuck % 120 < 60 ? 1 : -1;
        let ax = m.x - uy * speed * side,
          ay = m.y + ux * speed * side;
        if (canWalk(ax, ay, true)) {
          m.x = ax;
          m.y = ay;
        }
      }
    }
    // Recalculer la distance après le déplacement : pas de zone morte entre poursuite et attaque.
    const attackDistance = Math.hypot(T.x - m.x, T.y - m.y);
    if (attackDistance <= 40 && m.cd <= 0 && exposed && target !== game.hero) {
      m.cd = m.boss ? 1.0 : 1.2;
      hurtAlly(target, m);
    } else if (attackDistance <= 40 && m.cd <= 0 && exposed) {
      m.cd = m.boss ? 1.0 : 1.2;
      const st = characterStats(),
        dmg = canaanHurtPlayer(monsterDamage(m), m);
      if (dmg > 0 && (m.boss || m.worldBoss) && playerStun <= 0 && bossStunImmunity <= 0 && rnd() < 0.25) {
        const base = m.worldBoss ? 2.5 : 1.8;
        playerStun = base * (1 - st.stunReduction / 100);
        bossStunImmunity = 8;
        float(P.x, P.y - 56, '💫 ÉTOURDI ' + playerStun.toFixed(1) + 's', '#ffcf70');
        toast('💫 ' + m.t + ' t’a étourdi !');
      }
    }
    m.cd -= 1 / 60;
  });
  if (P.hp <= 0 && !P.dead) {
    P.dead = true;
    // Dans l'Arène, un allié encore debout peut relever l'hôte ; sinon retour au camp.
    if (game.world.instance?.arena && CANAAN_ARENA.standing() > 0)
      toast('💀 Tu es à terre : un allié peut te relever (3 s à côté de toi).');
    else
      canaanHostRespawn(
        game.world.instance?.arena
          ? '⚔️ Tentative terminée… Résurrection au camp.'
          : 'Tu es tombé… Résurrection au camp.'
      );
  }
  // projectiles
  game.world.projectiles.forEach(p => {
    if (p.homing) {
      let a = Math.atan2(game.hero.intent.aimY - p.y, game.hero.intent.aimX - p.x),
        b = Math.atan2(p.vy, p.vx),
        diff = Math.atan2(Math.sin(a - b), Math.cos(a - b)),
        turn = Math.max(-0.15, Math.min(0.15, diff)),
        angle = b + turn;
      p.vx = Math.cos(angle) * 10;
      p.vy = Math.sin(angle) * 10;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    const ptx = Math.floor(p.x / TS),
      pty = Math.floor(p.y / TS);
    // Les tirs filent au-dessus de la mer peu profonde (un héros peut tirer depuis l'eau).
    if (SOLID.includes(tileAt(ptx, pty)) && !CANAAN_SHALLOWS.wadeable(ptx, pty)) {
      p.life = 0;
      if (p.splash) projectileBlast(p, null);
    }
    projectileTrail(p);
    game.world.monsters.slice().forEach(m => {
      if (p.life > 0 && m.hp > 0 && canaanBodyGap(m, p.x, p.y) < (p.size || 8)) {
        projectileStrike(p, m, p.dmg);
        if (p.splash) projectileBlast(p, m);
        p.life = 0;
      }
    });
  });
  game.world.projectiles = game.world.projectiles.filter(p => p.life > 0);
  // Or au sol : le premier héros vivant qui passe dessus le ramasse.
  game.world.drops.forEach(d => {
    d.life--;
    const finder = game.heroes.find(
      h => !h.player.dead && Math.hypot(d.x - h.player.x, d.y - h.player.y) < 30
    );
    if (finder) {
      finder.player.gold += d.v;
      canaanLootNotice(finder, '+' + d.v + ' or');
      d.life = 0;
    }
  });
  game.world.drops = game.world.drops.filter(d => d.life > 0);
}
// Affichage d'un pas : commandes tactiles, effets visuels, caméra, barres, recharges et zone.
function updateView() {
  CanaanStages.updateTouchControls();
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
  floaters.forEach(f => {
    f.y -= 1;
    f.life--;
  });
  floaters = floaters.filter(f => f.life > 0);
  for (const s of SKILLS) {
    const cd = s.el.querySelector('.cd');
    cd.style.display = s.cd > 0 ? 'flex' : 'none';
    if (s.cd > 0) cd.textContent = Math.ceil(s.cd);
  }
  canaanUpdateSkillBadges();
  if (game.world.clock % 12 === 0) updateZoneDisplay();
  // camera
  // Dans un bâtiment, la caméra se cale sur le centre de la pièce (toute la pièce reste visible).
  const room = game.world.instance ? null : canaanRoomAt(P.x / TS, P.y / TS),
    focusX = room ? (room.x + room.w / 2) * TS : P.x,
    focusY = room ? (room.y + room.h / 2 + 0.6) * TS : P.y;
  let goalX = focusX - W / 2,
    goalY = focusY - H / 2;
  // Sur l'île, la caméra reste dans la carte : près d'un bord, le héros
  // s'écarte du centre de l'écran au lieu de laisser voir le vide au-delà de la grille. Les intérieurs, eux, restent
  // centrés sur leur pièce.
  if (!room && !game.world.instance && !canaanUnder()) {
    goalX = canaanClampCam(goalX, W, MAPW * TS);
    goalY = canaanClampCam(goalY, H, MAPH * TS);
  }
  // Grand saut (début de partie, entrée ou sortie d'instance, retour au camp) : la caméra se pose d'un coup sur le
  // héros au lieu de traverser la carte (elle partait de l'angle de la carte, où sont rangés les intérieurs).
  if (Math.abs(goalX - camX) > W || Math.abs(goalY - camY) > H) {
    camX = goalX;
    camY = goalY;
  }
  camX += (goalX - camX) * (room ? 0.2 : 0.1);
  camY += (goalY - camY) * (room ? 0.2 : 0.1);
  if (shake > 0) shake *= 0.85;
  // HUD
  document.getElementById('hpb').style.width = (P.hp / P.mhp) * 100 + '%';
  document.getElementById('hpt').textContent = Math.ceil(P.hp) + ' / ' + P.mhp;
  document.getElementById('mpb').style.width = (P.mp / P.mmp) * 100 + '%';
  document.getElementById('mpt').textContent = Math.ceil(P.mp) + ' / ' + P.mmp;

  document.getElementById('pname').textContent =
    playerStun > 0
      ? '💫 ÉTOURDI (' + playerStun.toFixed(1) + 's)'
      : game.mode !== 'guest'
        ? game.hero.name || 'Héros'
        : P.dead
          ? game.world.instance?.arena
            ? '💀 À terre : un allié peut te relever'
            : '💀 Relève dans ' + CANAAN_NET.state().revive + ' s'
          : game.hero.name || 'Héros';
  // Niveau et barre d'XP.
  CANAAN_PROGRESSION.hud();
  document.getElementById('gold').textContent = P.gold;
}
function draw() {
  resetCanaanLights();
  ctx.save();
  const shaking = canaanDisplay.shake ? shake : 0;
  let sx = (visualRnd() - 0.5) * shaking,
    sy = (visualRnd() - 0.5) * shaking;
  // sky gradient / ambient
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0a1e');
  g.addColorStop(1, '#141028');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Caméra calée sur un pixel entier : toutes les couches (sol, eau, décors, personnages) bougent ensemble, sans
  // glisser l'une contre l'autre d'un pixel pendant que la caméra ralentit derrière le héros.
  ctx.translate(Math.round(-camX + sx), Math.round(-camY + sy));
  // tiles
  let x0 = Math.max(0, Math.floor(camX / TS) - 1),
    x1 = Math.min(MAPW, Math.ceil((camX + W) / TS) + 1);
  let y0 = Math.max(0, Math.floor(camY / TS) - 1),
    y1 = Math.min(MAPH, Math.ceil((camY + H) / TS) + 1);
  const cols = BIOME_COLORS;
  // Sol : par blocs gardés sur l'île (world-look.js), dans les Tréfonds et en donjon (under-look.js).
  if (game.world.instance) {
    forgetWorldGround();
    drawDungeonGround(ctx, x0, x1, y0, y1);
  } else if (canaanUnder()) {
    forgetWorldGround();
    CANAAN_UNDER.drawGround(ctx, x0, x1, y0, y1);
  } else drawWorldGround(ctx, x0, x1, y0, y1);
  // Villages, maisons, monuments et portails
  if (game.world.instance) drawDungeonDecor(ctx);
  else if (canaanUnder()) {
    // Tréfonds : gisements et bancs de poissons, décor, bâtiments, portails, entrées, nains et faune.
    CANAAN_PROF.drawSpots(ctx);
    CANAAN_UNDER.draw(ctx);
    // Pièces de la forteresse naine (house.js) : intérieur meublé de celle où l'on est.
    CANAAN_HOUSE.draw(ctx);
    CANAAN_LIFE.update();
    CANAAN_LIFE.drawAnimals(ctx);
  } else {
    // Ruisseau, mare, pavés, champs et fleurs du camp, posés sur le sol.
    canaanCampLife.drawGround(ctx);
    // Vie dans l'eau profonde et bancs de poissons où pêcher.
    CANAAN_SEA.draw(ctx);
    // Trous creusés à la pelle, posés sur le sol.
    CANAAN_DIG.drawGround(ctx);
    CANAAN_PROF.drawSpots(ctx);
    drawPixelRoads(ctx);
    drawPixelLandmarks(ctx);
    // Extensions : ce qui est posé sur le sol (champs, dalles, enclos).
    CANAAN_EXT.draw(ctx, 'ground');
    // Bâtiments (maison, échoppe, cuisine, demeures, refuges) et intérieur meublé de la pièce où l'on est.
    CANAAN_HOUSE.draw(ctx);
    // Ferme, enclos, verger, jardin et fontaine du Camp de l'Aurore.
    canaanCampLife.draw(ctx);
    // Sélène, la coiffeuse, sur le tapis de son salon.
    CANAAN_BARBER.draw(ctx);
    // Sylvaëlle, la cité elfique : porte, bâtiments, Grand Arbre, fontaine, lanternes, elfes et animaux.
    CANAAN_CITY.draw(ctx);
    // Extensions : bâtiments, statues et habitants de leurs terres.
    CANAAN_EXT.draw(ctx, 'world');
    // Animaux de chaque biome et habitants (camp, refuges, ruines, tours).
    CANAAN_LIFE.update();
    CANAAN_LIFE.drawAnimals(ctx);
    CANAAN_LIFE.drawVillagers(ctx);
    // Lieux des quêtes : énigmes, PNJ de l'histoire et leurs marques.
    CANAAN_QUESTS.drawWorld(ctx);
    // Entrées des Tréfonds, sous l'île.
    CANAAN_UNDER.drawSurface(ctx);
  }
  drawWorldFeatures(ctx);
  // Grands arbres plantés devant un portail, un bâtiment ou un sol posé : repeints par-dessus (world-look.js).
  drawCanaanDecorFront(ctx);
  // drops
  game.world.drops.forEach(d => {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(d.x, d.y + Math.sin(time * 0.1) * 3, 6, 0, 7);
    ctx.fill();
  });
  // inhabitants, enemies and treasures
  if (!game.world.instance)
    game.world.npcs
      // PNJ de la couche affichée ; les nains des Tréfonds sont dessinés par underground.js.
      .filter(
        n =>
          (n.type === 'shop' || n.type === 'bank' || n.type === 'portal' || n.type === 'arena') &&
          canaanHere(n) &&
          !n.dwarf
      )
      .forEach(n => {
        if (Math.abs(n.x - P.x) > W || Math.abs(n.y - P.y) > H) return;
        // Une seule pièce visible à la fois : le marchand de l'échoppe n'apparaît que chez lui.
        if (canaanRoomAt(n.x / TS, n.y / TS) !== canaanRoomAt(P.x / TS, P.y / TS)) return;
        if (n.type === 'portal' || n.type === 'arena') {
          if (Math.hypot(P.x - n.x, P.y - n.y) < 115) {
            const at = CANAAN_PORTAL_ART.labelAt(n.type === 'arena' ? 'arena' : n.instance);
            if (at) drawCanaanPrompt(ctx, '[E] Entrer', at.x, at.y);
            else drawCanaanPrompt(ctx, '[E] Entrer', n.x, n.type === 'arena' ? n.y - 166 : n.y - 91);
          }
          return;
        }
        drawCanaanMerchant(ctx, n);
        drawCanaanName(ctx, n.name, n.x, n.y - 53);
        if (Math.hypot(P.x - n.x, P.y - n.y) < 120) drawCanaanPrompt(ctx, '[E] Parler', n.x, n.y - 80);
      });
  drawChests();
  if (!game.world.instance) drawWaterRipples(ctx);
  // Arène : zones annoncées et dangers au sol, sous les combattants.
  if (game.world.instance?.arena) CANAAN_ARENA.drawGround(ctx);
  game.world.monsters.forEach(m => {
    if (Math.abs(m.x - P.x) > W || Math.abs(m.y - P.y) > H || m.hidden) return;
    drawPixelMob(m);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = m.worldBoss ? '#ffe49c' : '#fff';
    // Les boss ont leur barre en haut de l'écran ; les autres, au-dessus de leur sprite.
    if (m.boss || m.worldBoss) return;
    const top = m.y - (m.elite ? 88 : 64);
    if (m.elite) ctx.fillText(mobTitle(m), m.x, top - 6);
    ctx.fillStyle = '#261d2b';
    ctx.fillRect(m.x - 22, top, 44, 5);
    ctx.fillStyle = '#f36b74';
    ctx.fillRect(m.x - 22, top, 44 * Math.max(0, m.hp / m.mhp), 5);
  });
  // projectiles
  game.world.projectiles.forEach(p => canaanDrawProjectile(ctx, p));
  // particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Compagnons présents, puis le héros de l'hôte au-dessus.
  CANAAN_GROUP.drawAllies(ctx);
  // animated equipped adventurer
  drawPixelHero(ctx, P.x, P.y, '#8068db', P.anim, true);
  drawWade(ctx, P, P.x, P.y + 16, 40, Math.hypot(P.vx || 0, P.vy || 0) > 0.1, 1);
  // Devant / derrière : arbres, bâtiments et grands objets redessinés devant les personnages qui sont derrière eux.
  drawCanaanOcclusion(ctx);
  // Extensions : ce qui passe au-dessus des personnages (rayons, oiseaux, pétales).
  CANAAN_EXT.draw(ctx, 'air');
  // Invitations « [E] Entrer » des bâtiments, au-dessus des façades et des personnages.
  CANAAN_HOUSE.drawPrompts(ctx);
  CANAAN_CITY.drawPrompts(ctx);
  CANAAN_BARBER.drawPrompts(ctx);
  // Titres et aura des succès, au-dessus de chaque héros.
  CANAAN_ACHIEVEMENTS.draw(ctx);
  // Lignes de pêche et bouchons.
  CANAAN_PROF.drawLines(ctx);
  // Arène : projectiles et effets des boss, au-dessus des combattants.
  if (game.world.instance?.arena) CANAAN_ARENA.drawAir(ctx);
  // L'attaque se voit sur l'arme tenue en main (canaan-weapon-look) et sur son effet, dans la direction visée.
  // Vent : feuilles emportées et souffles légers (monde extérieur).
  drawWindLayer(ctx);
  // Obscurité, lumières et particules du biome ou du donjon, sous les nombres flottants.
  drawCanaanLighting(
    ctx,
    game.world.instance ? dungeonAmbience() : canaanUnder() ? CANAAN_UNDER.ambience() : worldAmbience()
  );
  // Terres des extensions absentes de ce build : un banc de brume blanche, lumineux même la nuit.
  CANAAN_LOCKED_FOG.draw(ctx);
  // Bulles de dialogue des habitants, lisibles même dans l'obscurité.
  CANAAN_LIFE.drawBubbles(ctx);
  CANAAN_QUESTS.drawBubbles(ctx);
  // floaters
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  floaters.forEach(f => {
    // Chiffres de dégâts masqués au choix (les gains d'or, d'XP et de PV restent affichés).
    if (!canaanDisplay.damage && (typeof f.txt === 'number' || /^-\d+$/.test(f.txt))) return;
    ctx.globalAlpha = f.life / 50;
    ctx.fillStyle = f.c;
    ctx.fillText(f.txt, f.x, f.y);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
  // vignette
  let v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  drawCanaanBossFrame(ctx);
  drawMinimap();
}
// Mini-carte ronde qui suit le héros : drawMinimap (world-map.js).
