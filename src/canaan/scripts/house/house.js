// Bâtiments où l'on entre : E devant une porte fait passer dans une pièce intérieure (posée dans un coin d'océan
// de la carte, invisible de l'extérieur), avec ses meubles et un ou deux habitants (life.js).
// - Camp de l'Aurore : l'Échoppe de Lira (le marchand, derrière son comptoir), La Marmite dorée (cuisinières où
//   cuisiner ses prises) et deux demeures ; d'autres habitants restent dehors, autour du feu.
// - Refuges de l'île : cabanes en rondins (ou en terre crue dans le désert) avec cheminée ou cuisinière.
// - Maison du joueur : chaumière à l'ouest du camp, pièce vide ; H y ouvre le mode décoration (lits, tables, chaises,
//   cuisinière, plantes, tapis, fenêtres avec vue, rideaux…), R tourne le meuble en main ou celui visé.
// Les meubles de la maison appartiennent à l'aventure (sauvegarde de l'hôte : monde.maison) ; un invité peut entrer
// et décorer, l'hôte vérifie chaque meuble posé, tourné ou retiré et renvoie la maison à tous.
// Ce fichier garde l'état (meubles posés, bâtiments, mode décoration) ; le catalogue et les règles des meubles sont
// dans shared/data/house.js et shared/rules/house.js, tout le dessin dans scripts/house/render.js.
(() => {
  'use strict';

  const FLOOR_TILE = 30,
    WALL_TILE = 31,
    OUTSIDE_TILE = 32;

  // ---------------------------------------------------------------- Pièces intérieures
  // Chaque pièce (CANAAN_ROOMS, game-core) : sol, murs et porte selon houseRoomGeometry (shared/rules/house.js).
  const ROOM = Object.fromEntries(CANAAN_ROOMS.map(r => [r.id, r]));
  const HOME = ROOM.maison;
  // Pièces de l'île seulement : en donjon, les mêmes coordonnées désignent la carte de l'instance.
  const roomAt = (x, y) => {
    if (game.world.instance) return null;
    const under = game.world.layer === 'under';
    for (const r of CANAAN_ROOMS) {
      if (!!r.under !== under) continue;
      const lx = Math.floor(x / TS) - r.x,
        ly = Math.floor(y / TS) - r.y;
      if (lx >= 0 && ly >= 0 && lx < r.w && ly < r.h) return r;
    }
    return null;
  };
  const inside = (x, y) => !!roomAt(x, y);
  const inHome = (x, y) => roomAt(x, y) === HOME;
  const px = (room, lx) => (room.x + lx) * TS,
    py = (room, ly) => (room.y + ly) * TS;
  // Dessin (scripts/house/render.js) : la scène donne les pièces, les portes, les meubles et le mode décoration.
  // Fonctions enveloppées : elles sont lues au moment du dessin, quand tout le module est chargé.
  const ART = CANAAN_HOUSE_RENDER.create({
    roomAt: (x, y) => roomAt(x, y),
    px: (room, lx) => px(room, lx),
    py: (room, ly) => py(room, ly),
    itemsOf: room => itemsOf(room),
    HOME,
    ROOM,
    aimed: () => aimed(),
    valid: (...args) => valid(...args),
    topAt: (...args) => topAt(...args),
    insideDoor: room => insideDoor(room),
    outsideDoor: b => outsideDoor(b),
    externals: () => externals(),
    FLOOR_TILE,
    WALL_TILE,
    OUTSIDE_TILE,
    items: () => items,
    editing: () => editing,
    buildings: () => buildings,
    ui: () => ui
  });

  // ---------------------------------------------------------------- Meubles : règles (vérifiées par l'hôte)
  // La maison du joueur se décore ; les autres pièces gardent leurs meubles fixes (999 au plus).
  // Les règles de placement sont dans shared/rules/house.js.
  let items = [],
    version = 0;
  const FIXED = houseFurnishRooms(HOUSE_FURNITURE, ROOM, HOUSE_ROOM_FURNITURE, 999);
  const itemsOf = room => (!room ? [] : room === HOME ? items : FIXED[room.id] || []);
  const cover = (it, lx, ly) => houseCovers(HOUSE_FURNITURE, it, lx, ly);
  const valid = (k, x, y, list = items, r = 0, room = HOME, limit = HOUSE_MAX_ITEMS) =>
    houseCanPlace(HOUSE_FURNITURE, room, list, k, x, y, r, limit);
  // Passage bloqué : meubles des pièces, et dehors les objets du camp (feu, souches, banc, torches).
  function blocked(wx, wy) {
    const room = roomAt(wx, wy);
    if (!room) return canaanCampBlocked(wx, wy);
    const lx = Math.floor(wx / TS) - room.x,
      ly = Math.floor(wy / TS) - room.y;
    return itemsOf(room).some(it => HOUSE_FURNITURE[it.k].layer === 'floor' && cover(it, lx, ly));
  }
  canaanHouseBlocked = blocked;
  // Le meuble visible le plus haut sur une case (rideau, mur, sol, tapis).
  const topAt = (lx, ly, list = items) => houseTopItemAt(HOUSE_FURNITURE, list, lx, ly);
  function changed() {
    version++;
    saveGame();
  }
  function place(hero, k, x, y, r = 0) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const c = HOUSE_FURNITURE[k];
    if (!c) return false;
    // Décoration de quête : seulement pour un héros qui l'a gagnée.
    if (c.quest && !CANAAN_QUESTS.hasDeco(hero, k)) {
      if (hero === game.hero) toast('🔒 Récompense de quête : termine « ' + questById(c.quest).title + ' ».');
      return false;
    }
    if (houseOnWall(c)) y = 0;
    if (!valid(k, x, y, items, r)) return false;
    items.push({ k, x, y, r });
    changed();
    return true;
  }
  function remove(hero, x, y) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const it = topAt(x, y);
    if (!it) return false;
    items.splice(items.indexOf(it), 1);
    changed();
    return it;
  }
  // Tourner un meuble posé : quart de tour suivant (ou miroir), s'il a encore la place.
  function rotate(hero, x, y) {
    if (!hero || !inHome(hero.player.x, hero.player.y)) return false;
    const it = topAt(x, y);
    if (!it) return false;
    const r = houseNextRotation(HOUSE_FURNITURE, HOME, items, it, HOUSE_MAX_ITEMS);
    if (r === null) return false;
    it.r = r;
    changed();
    return true;
  }

  // ---------------------------------------------------------------- Bâtiments sur l'île
  // Camp de l'Aurore : échoppe, cuisine et deux demeures autour du feu (décalages en cases depuis le camp) ;
  // maison du joueur à l'ouest du camp, loin des portails ; chaque refuge devient une cabane où l'on entre.
  const VILLAGE = [
    { room: 'marmite', style: 'auberge', form: 'storey', w: 5, h: 3, dx: -2, dy: -11, sign: 'bol' },
    { room: 'echoppe', style: 'echoppe', w: 5, h: 3, dx: 5, dy: -9, sign: 'or' },
    { room: 'aubepines', style: 'demeure', form: 'gable', w: 4, h: 3, dx: -12, dy: -7 },
    { room: 'puits', style: 'demeure_bleue', form: 'storey', w: 4, h: 3, dx: -12, dy: 2 }
  ];
  const REFUGES = {
    'Refuge du Vieux Chêne': 'chene',
    'Refuge des Clairières': 'clairieres',
    'Refuge de l’Oasis': 'oasis',
    'Camp des Dunes': 'dunes',
    'Refuge des Pilotis': 'pilotis',
    'Refuge des Feuilles Rousses': 'rousses',
    'Refuge des Cristaux': 'cristaux'
  };
  let buildings = [];
  // Modèle de chaque refuge, accordé à son biome et à son nom.
  const REFUGE_FORM = {
    chene: 'tree',
    clairieres: 'gable',
    oasis: 'dome',
    dunes: 'tent',
    pilotis: 'round',
    rousses: 'gambrel',
    cristaux: 'tower'
  };
  const homeB = () => buildings.find(b => b.room === HOME);
  const groundOk = (x, y) => {
    const t = game.world.overworld[y]?.[x];
    return t !== undefined && !SOLID.includes(t) && t !== 15 && t !== 30;
  };
  // Emplacement de la maison : herbe des Plaines à l'ouest du camp, loin des portails, de l'Arène et des lieux.
  function findHome() {
    const tiles = game.world.overworld,
      ok = (x, y) => [1, 2, 10].includes(tiles[y]?.[x]),
      tx = CANAAN_CAMP.x - 24,
      ty = CANAAN_CAMP.y - 5;
    for (let r = 0; r < 40; r++)
      for (let k = 0; k < Math.max(1, r * 6); k++) {
        const a = (k / Math.max(1, r * 6)) * Math.PI * 2,
          fx = Math.round(tx + Math.cos(a) * r) - 2,
          fy = Math.round(ty + Math.sin(a) * r) - 1;
        let good = regionAt(fx + 2, fy + 1) === ZONES[0];
        for (let y = fy - 1; y <= fy + 5 && good; y++)
          for (let x = fx - 1; x <= fx + 4 && good; x++) good = ok(x, y);
        if (!good || Math.hypot(fx + 2 - CANAAN_CAMP.x, fy + 1 - CANAAN_CAMP.y) < CANAAN_CAMP.r + 6) continue;
        if (instances.some(d => Math.hypot(d.x - fx - 2, d.y - fy - 1) < 32)) continue;
        if (Math.hypot(CANAAN_ARENA_PORTAL.x - fx - 2, CANAAN_ARENA_PORTAL.y - fy - 1) < 16) continue;
        if (PIXEL_PLACES.some(p => Math.hypot(p.x - fx - 2, p.y - fy - 1) < 10)) continue;
        return { x: fx, y: fy };
      }
    return { x: CANAAN_CAMP.x - 26, y: CANAAN_CAMP.y - 6 };
  }
  // Cabane d'un refuge : juste au nord du lieu (sa porte donne sur lui), sinon à côté, sur la terre ferme.
  function findCabin(p) {
    for (const [dx, dy] of [
      [-2, -4],
      [-1, -4],
      [-3, -4],
      [-2, -5],
      [-2, -3],
      [-4, -2],
      [1, -2],
      [-2, 1]
    ]) {
      const fx = p.x + dx,
        fy = p.y + dy;
      let good = groundOk(fx + 2, fy + 3) && groundOk(fx + 1, fy + 3);
      for (let y = fy; y < fy + 3 && good; y++)
        for (let x = fx; x < fx + 4 && good; x++) good = groundOk(x, y);
      if (good) return { x: fx, y: fy };
    }
    return { x: p.x - 2, y: p.y - 4 };
  }
  // Pièces des Tréfonds : creusées dans la roche de la carte souterraine (dès qu'elle existe).
  function stampUnder() {
    const tiles = game.world.underworld,
      deco = game.world.underdecor;
    if (!tiles || !deco) return false;
    for (const room of CANAAN_ROOMS) {
      if (!room.under) continue;
      const { floor: F } = houseRoomGeometry(room);
      for (let ly = 0; ly < room.h; ly++)
        for (let lx = 0; lx < room.w; lx++) {
          tiles[room.y + ly][room.x + lx] =
            lx >= F.x0 && lx <= F.x1 && ly >= F.y0 && ly <= F.y1 ? FLOOR_TILE : WALL_TILE;
          deco[room.y + ly][room.x + lx] = null;
        }
    }
    return true;
  }
  function stamp() {
    const tiles = game.world.overworld,
      deco = game.world.overdecor;
    stampUnder();
    for (const room of CANAAN_ROOMS) {
      if (room.under) continue;
      const { floor: F } = houseRoomGeometry(room);
      for (let ly = 0; ly < room.h; ly++)
        for (let lx = 0; lx < room.w; lx++) {
          const floor = lx >= F.x0 && lx <= F.x1 && ly >= F.y0 && ly <= F.y1;
          tiles[room.y + ly][room.x + lx] = floor ? FLOOR_TILE : WALL_TILE;
          deco[room.y + ly][room.x + lx] = null;
        }
    }
    buildings = [];
    const home = findHome();
    for (const v of VILLAGE)
      buildings.push({
        room: ROOM[v.room],
        style: v.style,
        form: v.form,
        w: v.w,
        h: v.h,
        x: CANAAN_CAMP.x + v.dx,
        y: CANAAN_CAMP.y + v.dy,
        sign: v.sign,
        label: ROOM[v.room].name,
        village: true
      });
    buildings.push({ room: HOME, style: 'chaume', w: 4, h: 3, x: home.x, y: home.y, label: '🏠 Ta maison' });
    // Chaque refuge prend l'architecture de son biome.
    const BIOME_STYLE = ['chaume', 'foret', 'marais', 'automne', 'desert', 'enchantee'];
    for (const p of PIXEL_PLACES) {
      const id = REFUGES[p.name];
      if (!id) continue;
      const at = findCabin(p),
        zone = Math.max(0, ZONES.indexOf(regionAt(at.x + 2, at.y + 1)));
      buildings.push({
        room: ROOM[id],
        style: BIOME_STYLE[zone],
        form: REFUGE_FORM[id],
        w: 4,
        h: 3,
        x: at.x,
        y: at.y,
        label: p.name,
        place: p
      });
    }
    // Emprise au sol (pleine) et décor dégagé autour.
    for (const b of buildings) {
      for (let y = b.y - 1; y <= b.y + b.h + 1; y++)
        for (let x = b.x - 1; x <= b.x + b.w; x++) if (deco[y]) deco[y][x] = null;
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) tiles[y][x] = OUTSIDE_TILE;
    }
    // Puis un sentier de terre de chaque porte jusqu'au chemin le plus proche (ou au sentier d'un bâtiment déjà relié).
    for (const b of buildings) connect(b, tiles, deco);
  }
  // Sentier : recherche du plus court chemin sur la terre ferme (ni eau, ni roche, ni bâtiment), en partant vers le
  // bas depuis la porte ; chaque virage coûte un peu, pour des sentiers droits. Tracé de deux cases de large.
  function connect(b, tiles, deco) {
    const sx = Math.floor(b.x + b.w / 2 - 0.5),
      sy = b.y + b.h,
      RAD = 70,
      N = RAD * 2 + 1,
      ox = sx - RAD,
      oy = sy - RAD,
      land = (x, y) => {
        const t = tiles[y]?.[x];
        return t !== undefined && !SOLID.includes(t) && t !== 15 && t < 30;
      };
    if (!land(sx, sy)) return false;
    const DX = [0, 1, 0, -1],
      DY = [1, 0, -1, 0],
      cost = new Int32Array(N * N * 4).fill(1e9),
      prev = new Int32Array(N * N * 4).fill(-1),
      buckets = [];
    const push = (state, c) => {
      (buckets[c] ||= []).push(state);
    };
    const start = ((sy - oy) * N + (sx - ox)) * 4;
    cost[start] = 0;
    push(start, 0);
    let goal = -1;
    for (let c = 0; c < buckets.length && goal < 0; c++) {
      const list = buckets[c];
      if (!list) continue;
      for (let i = 0; i < list.length && goal < 0; i++) {
        const st = list[i];
        if (cost[st] !== c) continue;
        const cell = st >> 2,
          dir = st & 3,
          x = (cell % N) + ox,
          y = Math.floor(cell / N) + oy;
        // Un chemin existant (hors de la marche devant la porte) : arrivé.
        if (c > 0 && tiles[y][x] === 2 && !(y === sy && (x === sx || x === sx + 1))) {
          goal = st;
          break;
        }
        for (let d = 0; d < 4; d++) {
          if (d === (dir + 2) % 4) continue;
          const nx = x + DX[d],
            ny = y + DY[d];
          if (nx < ox || ny < oy || nx >= ox + N || ny >= oy + N || !land(nx, ny)) continue;
          const ns = (((ny - oy) * N + (nx - ox)) << 2) | d,
            nc = c + 2 + (d === dir ? 0 : 3);
          if (nc < cost[ns]) {
            cost[ns] = nc;
            prev[ns] = st;
            push(ns, nc);
          }
        }
      }
    }
    const paint = (x, y) => {
      for (const [ax, ay] of [
        [x, y],
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1]
      ])
        if (land(ax, ay)) {
          tiles[ay][ax] = 2;
          if (deco[ay]) deco[ay][ax] = null;
        }
    };
    paint(sx, sy);
    if (goal < 0) return false;
    for (let st = goal; st >= 0; st = prev[st]) {
      const cell = st >> 2;
      paint((cell % N) + ox, Math.floor(cell / N) + oy);
    }
    return true;
  }
  // Images des bâtiments peintes d'avance, une par une, quand le navigateur a du temps libre (jamais au moment où un
  // bâtiment entre à l'écran).
  function prebake() {
    const todo = buildings.slice();
    const next = () => {
      const b = todo.shift();
      if (!b) return;
      ART.builtOf(b);
      if (typeof requestIdleCallback === 'function') requestIdleCallback(next, { timeout: 1500 });
      else setTimeout(next, 40);
    };
    if (typeof document !== 'undefined' && document.createElement) setTimeout(next, 200);
  }
  function restamp() {
    stamp();
    prebake();
  }
  restamp();
  // Une île régénérée (même graine) retrouve ses bâtiments.
  window.canaanAfterWorld = restamp;
  // Bâtiments dessinés par d'autres modules où l'on entre aussi : ceux de Sylvaëlle (CANAAN_CITY_PLAN), la grange et le
  // poulailler du camp (camp-life.js), le hall, la forge, la taverne, la chambre forte et les maisons de la forteresse
  // naine (underground.js, sous terre). Même règle de porte : au milieu du bas du bâtiment.
  function externals() {
    const out = [],
      add = (id, x, y, w, h, under = false) =>
        ROOM[id] && out.push({ room: ROOM[id], x, y, w, h, under, external: true, label: ROOM[id].name });
    const plan = window.CANAAN_CITY_PLAN;
    if (plan) for (const b of plan.buildings) add('sylv_' + b.id.replace('elfe_', ''), b.x, b.y, b.w, b.h);
    const camp = window.CANAAN_CAMP_LIFE ? CANAAN_CAMP_LIFE.items() : [];
    for (const [kind, id] of [
      ['barn', 'grange'],
      ['coop', 'poulailler']
    ]) {
      const it = camp.find(i => i.kind === kind);
      if (it) add(id, it.x, it.y, it.w, it.h);
    }
    if (window.CANAAN_UNDER) {
      const homes = ['dur_maison1', 'dur_maison2'],
        ids = { dwarfhall: 'dur_hall', forge: 'dur_forge', tavern: 'dur_taverne', vault: 'dur_coffre' };
      for (const st of CANAAN_UNDER.structures()) {
        if (st.biome !== 4) continue;
        const id = st.kind === 'dwarfhouse' ? homes.shift() : ids[st.kind];
        if (id) add(id, st.tx - st.w / 2, st.ty + 1 - st.h, st.w, st.h, true);
      }
    }
    return out;
  }
  // Toutes les portes de la couche où l'on est (île ou Tréfonds).
  const entrances = () => {
    const under = game.world.layer === 'under';
    return [...(under ? [] : buildings), ...externals()].filter(b => !!b.under === under);
  };
  // Points de passage : devant la porte d'un bâtiment, et juste devant la porte intérieure de sa pièce.
  const outsideDoor = (b = homeB()) => ({ x: (b.x + b.w / 2) * TS, y: (b.y + b.h) * TS + 10 });
  const insideDoor = (room = HOME) => {
    const D = houseRoomGeometry(room).door;
    return { x: px(room, D.x) + TS / 2, y: py(room, D.y) + TS / 2 };
  };
  const nearestDoor = (x, y) => {
    let best = null,
      bd = 90;
    for (const b of entrances()) {
      if (b.closed) continue;
      const d = outsideDoor(b),
        dist = Math.hypot(x - d.x, y - d.y);
      if (dist < bd) {
        bd = dist;
        best = b;
      }
    }
    return best;
  };
  // Porte : entrer depuis l'extérieur, ou sortir depuis l'intérieur (chacun pour soi).
  function door(hero) {
    if (!hero || hero.player.dead || game.world.instance) return false;
    const p = hero.player,
      room = roomAt(p.x, p.y);
    let to;
    if (room) {
      const d = insideDoor(room),
        b = entrances().find(b => b.room === room);
      if (!b || Math.hypot(p.x - d.x, p.y - d.y) > 90) return false;
      to = outsideDoor(b);
      to.y += 14;
    } else {
      const b = nearestDoor(p.x, p.y);
      if (!b) return false;
      to = insideDoor(b.room);
    }
    p.x = to.x;
    p.y = to.y;
    p.vx = p.vy = 0;
    const now = roomAt(p.x, p.y);
    if (hero === game.hero) {
      camX = now ? (now.x + now.w / 2) * TS - W / 2 : p.x - W / 2;
      camY = now ? (now.y + now.h / 2 + 0.6) * TS - H / 2 : p.y - H / 2;
      if (now === HOME) toast('🏠 Bienvenue chez toi ! Appuie sur H pour décorer.');
      else if (now) toast('🚪 ' + now.name);
      if (now !== HOME && editing) toggle();
    } else
      canaanLootNotice(
        hero,
        now === HOME
          ? '🏠 Tu entres dans la maison (H pour décorer).'
          : now
            ? '🚪 ' + now.name
            : '🚪 Tu sors.'
      );
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'house-door') return door(hero);
    if (action.op === 'house-place') return place(hero, action.k, action.x, action.y, action.r || 0);
    if (action.op === 'house-remove') return !!remove(hero, action.x, action.y);
    if (action.op === 'house-rotate') return rotate(hero, action.x, action.y);
    return false;
  }

  // ---------------------------------------------------------------- Sauvegarde et réseau
  const sanitize = raw => houseSanitizeItems(HOUSE_FURNITURE, HOME, raw?.items, HOUSE_MAX_ITEMS);
  const layout = () => ({ items: items.map(it => ({ ...it })) });
  function load(raw) {
    items = sanitize(raw);
    version++;
  }
  // Maison envoyée aux invités : quand elle change, et toutes les 5 secondes pour un invité qui arrive.
  let sent = -1,
    sentAt = -1e9;
  function netView() {
    if (version === sent && time - sentAt < 300) return undefined;
    sent = version;
    sentAt = time;
    return { v: version, items: items.map(it => [it.k, it.x, it.y, it.r || 0]) };
  }
  function applyRemote(view) {
    if (!view || !Array.isArray(view.items)) return;
    items = sanitize({
      items: view.items.map(a => (Array.isArray(a) ? { k: a[0], x: a[1], y: a[2], r: a[3] || 0 } : null))
    });
  }
  const guest = () => game.mode === 'guest';
  // Touche E : porte d'un bâtiment ou porte intérieure. Renvoie vrai si E a servi.
  function interact() {
    if (game.world.instance) return false;
    const room = roomAt(P.x, P.y);
    if (room) {
      const d = insideDoor(room);
      if (Math.hypot(P.x - d.x, P.y - d.y) > 90) return false;
    } else if (!nearestDoor(P.x, P.y)) return false;
    if (guest()) CANAAN_NET.requestAction({ op: 'house-door' });
    else door(game.hero);
    return true;
  }
  // Cuisiner : près d'une cuisinière, d'une marmite ou d'une cheminée (dans n'importe quel bâtiment).
  function nearStove(x, y) {
    if (game.world.instance) return false;
    // Tréfonds : l'âtre de la taverne naine.
    if (game.world.layer === 'under') return CANAAN_UNDER.nearStove(x, y);
    const room = roomAt(x, y);
    return itemsOf(room).some(it => {
      const c = HOUSE_FURNITURE[it.k];
      if (!c.fire) return false;
      const d = houseDims(c, it.r);
      return (
        Math.hypot(px(room, it.x + d.w / 2) - x, py(room, it.y + d.h / 2) - y) <
        1.9 * TS + (d.w - 1) * TS * 0.5
      );
    });
  }

  // ---------------------------------------------------------------- Mode décoration (touche H)
  let editing = false;
  const ui = { cat: 'meubles', selected: null, tool: 'move', rot: 0 };
  // Case visée par la souris (coordonnées de la pièce), bornée au sol ou au mur.
  function aimed() {
    const cat = ui.selected ? HOUSE_FURNITURE[ui.selected] : null,
      d = cat ? houseDims(cat, ui.rot) : { w: 1, h: 1 },
      lx = Math.floor(mouseWorldX / TS) - HOME.x - Math.floor((d.w - 1) / 2),
      ly = Math.floor(mouseWorldY / TS) - HOME.y - (cat && !houseOnWall(cat) ? Math.floor((d.h - 1) / 2) : 0);
    return { x: lx, y: ly };
  }
  const esc = text => safeGearText(text);
  function renderBar() {
    let bar = document.getElementById('housingBar');
    if (!editing) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'housingBar';
      document.body.appendChild(bar);
    }
    const list = Object.entries(HOUSE_FURNITURE).filter(([, c]) => c.cat === ui.cat);
    bar.innerHTML =
      '<div class="house-head"><b>🏠 Décorer ta maison</b><span>Clic gauche : poser · clic sur un meuble : le déplacer · R : tourner · clic droit ou Échap : annuler · H : terminer</span></div>' +
      '<div class="house-tabs">' +
      HOUSE_FURNITURE_CATEGORIES.map(
        ([id, text]) =>
          '<button type="button" class="' +
          (ui.cat === id ? 'on' : '') +
          '" data-action="houseCat" data-cat="' +
          id +
          '">' +
          text +
          '</button>'
      ).join('') +
      '<button type="button" class="house-tool" data-action="houseRotate">⟳ Tourner (R)</button>' +
      '<button type="button" class="house-tool' +
      (ui.tool === 'remove' ? ' on' : '') +
      '" data-action="houseTool" data-tool="' +
      (ui.tool === 'remove' ? 'move' : 'remove') +
      '">🗑 Retirer</button>' +
      '<span class="house-count">' +
      items.length +
      ' / ' +
      HOUSE_MAX_ITEMS +
      ' objets</span></div>' +
      '<div class="house-items">' +
      list
        .map(([k, c]) => {
          const url = ART.preview(k),
            locked = c.quest && !CANAAN_QUESTS.hasDeco(game.hero, k);
          return (
            '<button type="button" class="house-item' +
            (ui.selected === k ? ' on' : '') +
            (locked ? ' locked' : '') +
            '" data-action="houseSelect" data-item="' +
            k +
            '"' +
            (locked ? ' title="Récompense de quête : ' + esc(questById(c.quest).title) + '"' : '') +
            '>' +
            (url ? '<img src="' + url + '" alt="">' : '') +
            '<span>' +
            (locked ? '🔒 ' : '') +
            esc(c.name) +
            '</span></button>'
          );
        })
        .join('') +
      '</div>';
  }
  function toggle() {
    if (!started) return false;
    if (!editing && (!inHome(P.x, P.y) || game.world.instance)) {
      toast('🏠 Entre dans ta maison (chaumière à l’ouest du Camp de l’Aurore) pour la décorer.');
      return false;
    }
    editing = !editing;
    ui.selected = null;
    ui.tool = 'move';
    ui.rot = 0;
    renderBar();
    return true;
  }
  function act(action) {
    const done = guest() ? CANAAN_NET.requestAction(action) : handle(game.hero, action);
    renderBar();
    return done;
  }
  // Tourner : le meuble en main (aperçu), sinon celui sous la souris.
  function turn() {
    if (!editing) return false;
    if (ui.selected) {
      ui.rot = (ui.rot + 1) % houseTurns(HOUSE_FURNITURE[ui.selected]);
      return true;
    }
    const at = aimed();
    if (!topAt(at.x, at.y)) {
      toast('🏠 Prends un meuble ou vise-en un pour le tourner (R).');
      return false;
    }
    act({ op: 'house-rotate', x: at.x, y: at.y });
    return true;
  }
  // Clic dans le monde en mode décoration : poser, déplacer ou retirer. Renvoie vrai si le clic est pris.
  function click(button) {
    if (!editing) return false;
    if (!inHome(P.x, P.y)) {
      toggle();
      return false;
    }
    if (button === 2) {
      ui.selected = null;
      renderBar();
      return true;
    }
    const at = aimed();
    if (ui.selected) {
      const cat = HOUSE_FURNITURE[ui.selected],
        y = houseOnWall(cat) ? 0 : at.y;
      if (!valid(ui.selected, at.x, y, items, ui.rot)) {
        toast('🏠 Impossible de poser ici.');
        return true;
      }
      act({ op: 'house-place', k: ui.selected, x: at.x, y, r: ui.rot });
      if (ui.moving) {
        ui.selected = null;
        ui.moving = false;
      }
      return true;
    }
    const it = topAt(at.x, at.y);
    if (!it) return true;
    act({ op: 'house-remove', x: at.x, y: at.y });
    // Déplacer : le meuble repris suit la souris, dans le même sens, jusqu'au prochain clic.
    if (ui.tool !== 'remove') {
      ui.selected = it.k;
      ui.rot = it.r || 0;
      ui.moving = true;
    }
    renderBar();
    return true;
  }
  // Échap annule le meuble en main avant de mettre le jeu en pause ; R tourne le meuble.
  addEventListener(
    'keydown',
    e => {
      if (!editing || e.target?.tagName === 'INPUT') return;
      if (e.key === 'Escape' && ui.selected) {
        ui.selected = null;
        ui.moving = false;
        renderBar();
      } else if (e.key === 'r' || e.key === 'R') turn();
      else return;
      e.stopImmediatePropagation();
      e.preventDefault();
    },
    true
  );
  // Sortie de la maison : le mode décoration se ferme.
  setInterval(() => {
    if (editing && (!started || !inHome(P.x, P.y))) toggle();
  }, 300);
  const actions = {
    cat(id) {
      if (HOUSE_FURNITURE_CATEGORIES.some(([c]) => c === id)) ui.cat = id;
      renderBar();
    },
    select(k) {
      if (!HOUSE_FURNITURE[k]) return;
      ui.selected = ui.selected === k ? null : k;
      ui.moving = false;
      ui.tool = 'move';
      ui.rot = 0;
      renderBar();
    },
    tool(t) {
      ui.tool = t === 'remove' ? 'remove' : 'move';
      ui.selected = null;
      renderBar();
    },
    rotate: turn
  };
  // Habitants des bâtiments (life.js) : [rôle, x, y] en cases du monde, avec le lieu d'un refuge.
  function residents() {
    const out = [];
    for (const b of [...buildings, ...externals().filter(e => !e.under)])
      for (const [role, lx, ly] of HOUSE_ROOM_RESIDENTS[b.room.id] || [])
        out.push({
          role,
          tx: b.room.x + lx - 0.5,
          ty: b.room.y + ly - 0.5,
          place: b.place || null,
          inside: true
        });
    for (const b of buildings)
      if (b.place) out.push({ role: null, tx: b.place.x, ty: b.place.y + 1, place: b.place, inside: false });
    return out;
  }
  window.CANAAN_HOUSE = Object.freeze({
    CATALOG: ART.CATALOG,
    room: HOME,
    roomAt,
    outside: () => ({ x: homeB().x, y: homeB().y }),
    // Bâtiments à redessiner devant les personnages qui passent derrière (world-look.js).
    occluders: () => ART.occluders(),
    buildings: () =>
      buildings.map(b => ({
        id: b.room.id,
        name: b.room.name,
        kind: b.room.kind,
        style: b.style,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        door: outsideDoor(b),
        inside: insideDoor(b.room)
      })),
    outsideDoor: id => outsideDoor(id ? buildings.find(b => b.room.id === id) : homeB()),
    insideDoor: id => insideDoor(id ? ROOM[id] : HOME),
    inside,
    valid,
    blocked,
    place,
    remove,
    rotate,
    door,
    handle,
    items: () => items.map(it => ({ ...it })),
    roomItems: id => itemsOf(ROOM[id]).map(it => ({ ...it })),
    drawFacade: ART.drawFacade,
    styles: ART.styles,
    residents,
    layout,
    load,
    sanitize,
    netView,
    applyRemote,
    interact,
    nearStove,
    drawTile: ART.drawTile,
    stampUnder,
    entrances: () =>
      entrances().map(b => ({
        id: b.room.id,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        under: !!b.under,
        door: outsideDoor(b)
      })),
    draw: ART.draw,
    click,
    toggle,
    editing: () => editing,
    actions,
    hasFire: () => itemsOf(ART.current()).some(it => HOUSE_FURNITURE[it.k].fire)
  });
  window.toggleHousing = toggle;
})();
