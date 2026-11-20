// Extensions du jeu : contenu préparé à l'avance et livré plus tard (Extension 1 : la terre du sud-ouest).
// - Les fichiers d'une extension (src/canaan/extensions/<id>/, entrées « extension » du manifeste) ne sont assemblés
//   que par node tools/build.cjs --extensions (npm start, npm run build:dev). Le build de sortie (npm run build : CI,
//   release GitHub, Steam) les retire entièrement : le jeu tourne sans eux et n'en contient rien.
// - La terre d'une extension fait partie de l'île dans tous les builds (mêmes cases partout : génération, sauvegardes
//   et coopératif identiques). Sans son extension, elle est fermée (canWalk), couverte d'un banc de brume dans le
//   monde et d'un grand nuage blanc sur la carte (M) et la mini-carte (world-map.js).
// - Une extension se déclare en deux temps : ses données, avant la génération de l'île (canaanDefineExtension), puis
//   son comportement, une fois les systèmes du jeu chargés (CANAAN_EXT.register) : dessin, collisions, interactions
//   (E), actions réseau et boutons, pas de simulation, résurrection.
// - Données d'une extension dans la sauvegarde d'un héros : hero.ext[id], gardées telles quelles par un build qui ne
//   connaît pas l'extension (rien n'est perdu en passant d'un build à l'autre).
const CANAAN_EXTENSIONS = Object.create(null);
// Données d'une extension (zone, créatures, boss, objets, traductions), déclarées avant la génération de l'île.
function canaanDefineExtension(id, data) {
  if (!/^[a-z]+$/.test(id) || CANAAN_EXTENSIONS[id]) throw new Error('Extension invalide : ' + id);
  CANAAN_EXTENSIONS[id] = Object.freeze({ id, ...data });
  return CANAAN_EXTENSIONS[id];
}
function canaanExtension(id) {
  return CANAAN_EXTENSIONS[id] || null;
}
// Extensions présentes dans ce build, triées (identité du build pour le coopératif).
function canaanExtensionIds() {
  return Object.keys(CANAAN_EXTENSIONS).sort();
}
// Créatures du monde : celles du jeu (MOB_TYPES), puis celles des extensions présentes.
let canaanMobList = null;
function canaanMobTypes() {
  canaanMobList ||= [...MOB_TYPES, ...canaanExtensionIds().flatMap(id => canaanExtension(id).mobs || [])];
  return canaanMobList;
}
// Données d'extension d'une sauvegarde : un objet simple, de taille bornée ; rien d'autre n'est gardé.
function canaanSanitizeExt(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  try {
    const text = JSON.stringify(raw);
    if (text.length > 32768) return {};
    const out = {};
    for (const [id, value] of Object.entries(JSON.parse(text)))
      if (/^[a-z]+$/.test(id) && value && typeof value === 'object') out[id] = value;
    return out;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------- Terres des extensions
// Posées par la génération de l'île : un masque par case (numéro de la terre + 1, 0 hors de toute terre), et pour
// chaque terre son extension, son centre et son cadre (en cases).
const CANAAN_EXT_LANDS = [];
let canaanExtLandMask = null;
function canaanExtLand(x, y) {
  if (!canaanExtLandMask || x < 0 || y < 0 || x >= MAPW || y >= MAPH) return null;
  const k = canaanExtLandMask[y * MAPW + x];
  return k ? CANAAN_EXT_LANDS[k - 1] : null;
}
// Case fermée : terre d'une extension absente de ce build.
function canaanLockedTile(tx, ty) {
  const land = canaanExtLand(tx, ty);
  return !!land && !canaanExtension(land.ext);
}
function canaanLockedAt(px, py) {
  if (game.world.instance || game.world.layer === 'under') return false;
  return canaanLockedTile(Math.floor(px / TS), Math.floor(py / TS));
}

// ---------------------------------------------------------------- Crochets
// Chaque extension chargée enregistre un objet { id, … } dont le jeu appelle les crochets présents :
//   afterWorld()              île générée : poser ses lieux (cases déjà générées par world-generation.js)
//   step()                    pas de simulation (hôte et solo), après le cœur
//   draw(c, layer)            dessin dans le monde : 'ground' (sur le sol), 'world' (bâtiments, personnages),
//                             'air' (au-dessus de tout, avant la lumière)
//   occluders()               grands objets redessinés devant un personnage passé derrière (world-look.js)
//   blocked(px, py)           collisions propres (statues, bâtiments, enclos)
//   interact(hero)            E chez l'hôte (pour lui ou un invité) : true si l'extension a répondu
//   guestUse()                E chez un invité : true si l'extension a répondu
//   handle(hero, action)      action réseau { op: 'ext', ext, act, id } d'un invité, chez l'hôte
//   ui[act](id)               bouton de l'interface data-action="extAction" data-ext data-act data-id
//   respawnFor(hero)          point de résurrection proposé, ou null
//   speed(hero)               multiplicateur de vitesse du héros (1 : aucun effet)
//   heroBody(hero, body, face, moving, phase)  avant de dessiner un héros : { lift, bob, under(c, x, y),
//                             over(c, x, y) } pour le porter, ou null
//   view(idOf) / apply(data, heroOf)  état envoyé aux invités avec celui du monde (identifiants des héros)
//   key(action)               touche d'une action réservée à l'extension : true si elle l'a prise
//   bossKilled(m, hero)       un boss mondial vient de tomber : true si l'extension fait sa récompense
//   spawnBosses()             au rythme des boss mondiaux de l'île : faire apparaître les siens
//   collectionTabs()          onglets ajoutés aux Collections (V) : [{ id, label, count, section() }]
//   mapPaint(g, px)           dessin sur l'image de l'île des cartes (px pixels par case)
//   markers()                 repères des cartes : [{ kind, x, y, name, extra }]
const CANAAN_EXT = (() => {
  const list = [];
  const each = (name, ...args) => {
    for (const e of list) if (typeof e[name] === 'function') e[name](...args);
  };
  const first = (name, ...args) => {
    for (const e of list) {
      if (typeof e[name] !== 'function') continue;
      const v = e[name](...args);
      if (v) return v;
    }
    return null;
  };
  const here = () => typeof started !== 'undefined' && started && !game.world.instance;
  return Object.freeze({
    register(api) {
      if (!api || !canaanExtension(api.id) || list.some(e => e.id === api.id))
        throw new Error('Extension non déclarée : ' + api?.id);
      list.push(api);
      // L'île est générée au chargement (interface-foundation.js), avant les fichiers des extensions : une extension
      // enregistrée après pose aussitôt ses lieux.
      if (game.world.overworld && typeof api.afterWorld === 'function') api.afterWorld();
      return api;
    },
    list: () => list.map(e => e.id),
    afterWorld: () => each('afterWorld'),
    step: () => each('step'),
    draw(c, layer) {
      if (!game.world.instance && game.world.layer !== 'under') each('draw', c, layer);
    },
    occluders: () => (here() && game.world.layer !== 'under' ? list.flatMap(e => e.occluders?.() || []) : []),
    blocked: (px, py) =>
      canaanLockedAt(px, py) ||
      (!game.world.instance && game.world.layer !== 'under' && list.some(e => e.blocked?.(px, py))),
    interact: hero => !game.world.instance && game.world.layer !== 'under' && !!first('interact', hero),
    guestUse: () => !game.world.instance && game.world.layer !== 'under' && !!first('guestUse'),
    handle(hero, action) {
      const e = list.find(e => e.id === action.ext);
      return !!e?.handle?.(hero, action);
    },
    ui(ext, act, id) {
      const e = list.find(e => e.id === ext);
      if (typeof e?.ui?.[act] === 'function') e.ui[act](id);
    },
    respawnFor: hero => first('respawnFor', hero),
    speed(hero) {
      let k = 1;
      for (const e of list) if (typeof e.speed === 'function') k *= e.speed(hero) || 1;
      return k;
    },
    heroBody: (hero, body, face, moving, phase) => first('heroBody', hero, body, face, moving, phase),
    // Réseau : idOf(héros) donne l'identifiant d'un héros chez les invités ('host' pour l'hôte).
    view(idOf) {
      const out = {};
      for (const e of list) if (typeof e.view === 'function') out[e.id] = e.view(idOf);
      return out;
    },
    // Chez un invité : heroOf(identifiant) retrouve le héros reçu.
    apply(data, heroOf) {
      if (!data || typeof data !== 'object') return;
      for (const e of list)
        if (typeof e.apply === 'function' && data[e.id] !== undefined) e.apply(data[e.id], heroOf);
    },
    key: action => !!first('key', action),
    bossKilled: (m, hero) => !!first('bossKilled', m, hero),
    spawnBosses: () => each('spawnBosses'),
    // Onglets de la fiche du personnage (C) : [{ id, label, count, section() }].
    collectionTabs: () => list.flatMap(e => e.collectionTabs?.() || []),
    // Carte : dessin d'une extension sur l'image de l'île (g, PX pixels par case) et ses repères [{ kind, x, y, name }].
    mapPaint(id, g, px) {
      const e = list.find(e => e.id === id);
      if (typeof e?.mapPaint === 'function') e.mapPaint(g, px);
    },
    markers: () => list.flatMap(e => e.markers?.() || [])
  });
})();
window.CanaanStages.extensions = { after: () => CANAAN_EXT.step() };

// ---------------------------------------------------------------- Banc de brume (terres fermées)
// Grosses volutes blanches peintes une fois en gros pixels (tramage ordonné, ombre bleutée en bas, reflet en haut),
// posées sur une grille au-dessus de chaque case fermée visible et un peu au-delà, qui ondulent lentement.
const CANAAN_LOCKED_FOG = (() => {
  const PUFFS = [];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function puff(size, seed) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    if (!g) return cv;
    const R = size / 2,
      U = 3;
    for (let y = 0; y < size; y += U)
      for (let x = 0; x < size; x += U) {
        const dx = (x + U / 2 - R) / R,
          dy = (y + U / 2 - R) / R,
          wob =
            0.12 * Math.sin(Math.atan2(dy, dx) * 5 + seed) +
            0.06 * Math.sin(Math.atan2(dy, dx) * 9 + seed * 2),
          d = Math.hypot(dx, dy * 1.12) / (0.92 + wob);
        if (d >= 1) continue;
        const a = Math.min(1, (1 - d) * 2.4),
          bx = Math.floor(x / U) & 3,
          by = Math.floor(y / U) & 3;
        if (a < (BAYER[by * 4 + bx] + 0.5) / 16) continue;
        // Lumière en haut à gauche : blanc ; dessous, un gris bleuté.
        const shade = dy * 0.7 - dx * 0.3;
        g.fillStyle =
          shade > 0.45 ? '#c9d2e0' : shade > 0.1 ? '#e4e9f1' : shade < -0.45 ? '#ffffff' : '#f4f6fa';
        g.fillRect(x, y, U, U);
      }
    return cv;
  }
  function puffs() {
    if (!PUFFS.length && typeof document !== 'undefined')
      for (let i = 0; i < 4; i++) PUFFS.push(puff(150 + i * 18, i * 1.7 + 0.4));
    return PUFFS;
  }
  const h = (x, y, k) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  // Distance (en cases, bornée à 3) d'une case à la terre fermée la plus proche : la brume déborde un peu.
  function near(x, y) {
    if (canaanLockedTile(x, y)) return 0;
    for (let r = 1; r <= 2; r++)
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++)
          if (Math.max(Math.abs(i), Math.abs(j)) === r && canaanLockedTile(x + i, y + j)) return r;
    return 3;
  }
  function draw(c) {
    if (!CANAAN_EXT_LANDS.some(l => !canaanExtension(l.ext))) return;
    if (game.world.instance || game.world.layer === 'under') return;
    const list = puffs();
    if (!list.length) return;
    const x0 = Math.floor(camX / TS) - 3,
      x1 = Math.ceil((camX + W) / TS) + 3,
      y0 = Math.floor(camY / TS) - 3,
      y1 = Math.ceil((camY + H) / TS) + 3,
      t = typeof time === 'number' ? time : 0;
    c.save();
    // Fond plein sous la brume : rien de la terre fermée ne se voit entre les volutes.
    c.fillStyle = '#e8edf4';
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (canaanLockedTile(x, y)) c.fillRect(x * TS, y * TS, TS, TS);
    // Volutes : serrées sur la terre fermée, plus rares et plus légères là où la brume déborde.
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const r = near(x, y);
        if (r > 2 || (r > 0 && (x + y) % 2) || (r === 0 && (x * 3 + y) % 3 === 1)) continue;
        const k = h(x, y, 3),
          spr = list[Math.floor(k * list.length)],
          sx = (x + 0.5) * TS + (h(x, y, 1) - 0.5) * 40 + Math.sin(t * 0.008 + k * 6) * 10,
          sy = (y + 0.5) * TS + (h(x, y, 2) - 0.5) * 40 + Math.cos(t * 0.006 + k * 5) * 6;
        c.globalAlpha = r === 0 ? 1 : r === 1 ? 0.9 : 0.55;
        c.drawImage(spr, Math.round(sx - spr.width / 2), Math.round(sy - spr.height / 2));
      }
    c.restore();
  }
  return Object.freeze({ draw });
})();
