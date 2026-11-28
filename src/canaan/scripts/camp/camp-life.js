// @ts-nocheck
// Vie du Camp de l'Aurore : une ferme au sud (grange, silo, poulailler, enclos avec moutons, vaches et cochons, bottes
// de foin, charrette, champs de blé, de légumes et de fruits), un verger de pommiers à l'ouest, un jardin fleuri au
// nord, une fontaine sur une petite place pavée, des bûches, des fleurs et un ruisseau qui descend d'une source jusqu'à
// une mare, sous un pont de la route ; à l'ouest du verger, un quai sur pilotis où mouille un navire draconique.
// Même style que les donjons : volumes en trois tons (reflet en haut à gauche, ombre en bas à droite), contour sombre,
// grain des décors (canaanPolish, canaanOutline), ombre au sol, lueurs (canaanLight).
// Le plan est fixe (cases comptées depuis le feu) et posé après les bâtiments et les lieux de quête : un élément qui
// tomberait sur une maison, un lieu de quête ou un coffre n'est pas posé (audit()). Tout est décoratif et calculé chez
// chaque joueur à partir de la même île : rien n'est sauvegardé ni envoyé sur le réseau.
// Ce fichier pose le camp et garde ses collisions ; le plan est dans shared/data/camp.js, le dessin dans
// scripts/camp/render.js (objets), ground.js (sol) et client/art/camp-sprites.js (sprites des objets).
(() => {
  'use strict';
  const T = TS;
  const key = (x, y) => y * MAPW + x;

  // ---------------------------------------------------------------- Plan (shared/data/camp.js)
  const { STREAM, POND, PATHS, PROPS, PIER, PIER_PROPS, CALM } = CAMP_PLAN;

  // ---------------------------------------------------------------- État posé sur l'île
  let ground = new Map(); // case → { type: 'stream' | 'pond' | 'plaza' | 'field' | 'gpath' | 'bed' | 'flowers', ... }
  let solid = new Set(); // cases qui bloquent
  let items = []; // objets dessinés, du fond vers l'avant
  let missing = []; // éléments qui n'ont pas trouvé leur place
  let origin = { x: 0, y: 0 };
  let animalsList = [];
  let fliersList = [];

  // Hasard reproductible par case.
  function hash(x, y, k = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function catmull(points) {
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[Math.max(0, i - 1)],
        b = points[i],
        d = points[i + 1],
        e = points[Math.min(points.length - 1, i + 2)];
      for (let j = 0; j < 12; j++) {
        const t = j / 12,
          t2 = t * t,
          t3 = t2 * t;
        const f = k =>
          0.5 *
          (2 * b[k] +
            (-a[k] + d[k]) * t +
            (2 * a[k] - 5 * b[k] + 4 * d[k] - e[k]) * t2 +
            (-a[k] + 3 * b[k] - 3 * d[k] + e[k]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    out.push(points[points.length - 1]);
    return out;
  }

  // ---------------------------------------------------------------- Pose
  function layout() {
    ground = new Map();
    solid = new Set();
    items = [];
    missing = [];
    animalsList = [];
    fliersList = [];
    const tools = CANAAN_WORLD_TOOLS,
      tiles = game.world.overworld,
      grid = game.world.overdecor,
      cx = CANAAN_CAMP.x,
      cy = CANAAN_CAMP.y;
    origin = { x: cx, y: cy };
    const houses = CANAAN_HOUSE.buildings(),
      sites = Object.values(CANAAN_QUESTS.sites()).filter(s => !s.under),
      taken = tools.taken();
    // Une case libre : sur l'île, ni roche ni eau, hors des bâtiments, des lieux de quête et des coffres.
    // Cases gardées libres sans bloquer : le tapis du salon de coiffure, où se tient la coiffeuse.
    const kept = new Set();
    const house = (x, y) =>
      houses.some(b => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h);
    const quest = (x, y) =>
      sites.some(s => Math.hypot(s.x - x, s.y - y) <= s.r + 1.5) ||
      canaanQuestWalk((x + 0.5) * T, (y + 0.5) * T, false) !== null;
    const spot = (x, y) => taken.some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1);
    const land = (x, y) =>
      tools.valid(x, y) && !SOLID.includes(tiles[y][x]) && tiles[y][x] !== 15 && !BRIDGE_TILES.has(key(x, y));
    // La pelouse du jardin accueille ses propres objets (pommiers, banc, bain d'oiseaux).
    const free = (x, y) =>
      land(x, y) &&
      !house(x, y) &&
      !quest(x, y) &&
      !spot(x, y) &&
      (ground.get(key(x, y))?.type || 'lawn') === 'lawn' &&
      !solid.has(key(x, y)) &&
      !kept.has(key(x, y));
    const clear = (x, y) => {
      if (grid[y]) grid[y][x] = null;
    };

    // Ruisseau : deux cases de large, de la source à la mare ; une route croisée devient un pont.
    const line = catmull(STREAM);
    const water = (x, y, flow) => {
      const k = key(x, y);
      if (!tools.valid(x, y) || house(x, y) || quest(x, y) || spot(x, y) || ground.has(k)) return;
      if (tiles[y][x] === 2 || BRIDGE_TILES.has(k)) {
        BRIDGE_TILES.add(k);
        return;
      }
      if (SOLID.includes(tiles[y][x]) && tiles[y][x] !== 0) return;
      tiles[y][x] = 0;
      clear(x, y);
      ground.set(k, flow);
    };
    line.forEach(([fx, fy], i) => {
      const [nx, ny] = line[Math.min(line.length - 1, i + 1)],
        [px, py] = line[Math.max(0, i - 1)],
        len = Math.hypot(nx - px, ny - py) || 1;
      for (let y = Math.floor(fy) - 2; y <= Math.ceil(fy) + 2; y++)
        for (let x = Math.floor(fx) - 2; x <= Math.ceil(fx) + 2; x++)
          if (Math.hypot(x - fx, y - fy) < 1)
            water(cx + x, cy + y, { type: 'stream', fx: (nx - px) / len, fy: (ny - py) / len });
    });
    // Une route qui coupe le ruisseau passe tout entière sur un pont (de la rive amont à la rive aval).
    const bridgeAcross = () => {
      for (const [k, g] of [...ground]) {
        if (g.type !== 'stream' && g.type !== 'pond') continue;
        const x = k % MAPW,
          y = (k - x) / MAPW;
        for (const [dx, dy] of [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0]
        ]) {
          const run = [];
          let n = 1;
          for (; n <= 5; n++) {
            const t = tiles[y + dy * n]?.[x + dx * n];
            if (t !== 2) break;
            run.push(key(x + dx * n, y + dy * n));
          }
          const after = ground.get(key(x + dx * n, y + dy * n));
          if (run.length && after && (after.type === 'stream' || after.type === 'pond'))
            for (const r of run) BRIDGE_TILES.add(r);
        }
      }
    };
    bridgeAcross();
    // Mare : un rond d'eau un peu irrégulier.
    const [pdx, pdy] = POND.at;
    for (let y = -4; y <= 4; y++)
      for (let x = -4; x <= 4; x++) {
        const d = Math.hypot(x, y * 1.15) + (hash(cx + x, cy + y, 3) - 0.5) * 0.7;
        const k = key(cx + pdx + x, cy + pdy + y);
        if (d < POND.r) {
          if (ground.get(k)?.type === 'stream') ground.delete(k);
          water(cx + pdx + x, cy + pdy + y, { type: 'pond' });
        }
      }
    // Source : un tas de rochers au bout du ruisseau.
    const [sx, sy] = STREAM[0];
    items.push({
      kind: 'spring',
      tx: cx + sx,
      ty: cy + sy,
      w: 1,
      h: 1,
      x: (cx + sx) * T,
      y: (cy + sy) * T,
      base: (cy + sy) * T + 6
    });

    // Chemins de terre ; un chemin qui croise le ruisseau passe sur un pont droit, aussi large que le chemin.
    for (const [x0, y0, x1, y1] of PATHS) {
      const crossing = [];
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const tx = cx + x,
            ty = cy + y,
            k = key(tx, ty);
          if (!tools.valid(tx, ty) || house(tx, ty) || quest(tx, ty)) continue;
          if (ground.has(k) && ['stream', 'pond'].includes(ground.get(k).type)) {
            tiles[ty][tx] = 2;
            BRIDGE_TILES.add(k);
            ground.delete(k);
            crossing.push([x, y]);
            continue;
          }
          if (!land(tx, ty)) continue;
          tiles[ty][tx] = 2;
          clear(tx, ty);
        }
      if (!crossing.length) continue;
      const along = x1 - x0 >= y1 - y0,
        lo = Math.min(...crossing.map(p => (along ? p[0] : p[1]))),
        hi = Math.max(...crossing.map(p => (along ? p[0] : p[1])));
      for (let v = lo; v <= hi; v++)
        for (let w = along ? y0 : x0; w <= (along ? y1 : x1); w++) {
          const tx = cx + (along ? v : w),
            ty = cy + (along ? w : v);
          if (tiles[ty][tx] === 2) BRIDGE_TILES.add(key(tx, ty));
        }
    }
    bridgeAcross();

    // Quai : des planches sur l'eau profonde (praticables comme un pont), puis le navire amarré à son bord nord.
    const pierCells = [];
    for (let y = PIER.y; y < PIER.y + PIER.h; y++)
      for (let x = PIER.x0; x <= PIER.x1; x++) pierCells.push([cx + x, cy + y]);
    if (
      pierCells.every(
        ([x, y]) => tools.valid(x, y) && ([0, 15, 2, 3].includes(tiles[y][x]) || BRIDGE_TILES.has(key(x, y)))
      )
    ) {
      // Sur l'eau, des pilotis (un pont) ; sur le sable, le chemin.
      for (const [x, y] of pierCells) {
        if ([0, 15].includes(tiles[y][x])) BRIDGE_TILES.add(key(x, y));
        tiles[y][x] = 2;
        clear(x, y);
      }
      const px0 = cx + PIER.x0,
        py0 = cy + PIER.y,
        w = PIER.x1 - PIER.x0 + 1;
      items.push({ kind: 'pier', tx: px0, ty: py0, w, h: PIER.h, x: px0 * T, y: py0 * T, base: py0 * T });
      // Le navire est centré sur la partie du quai au-dessus de l'eau (sans la case posée sur le sable).
      items.push({
        kind: 'ship',
        tx: px0,
        ty: py0 - 5,
        w: w - 1,
        h: 5,
        x: px0 * T,
        y: (py0 - 5) * T,
        base: py0 * T - 2
      });
      // Coque à flot : la mer peu profonde porte les héros (world-shallows.js), mais on ne traverse pas le navire.
      for (let y = py0 - 2; y < py0; y++) for (let x = px0; x < px0 + w - 1; x++) solid.add(key(x, y));
      for (const p of PIER_PROPS) {
        const tx = cx + p.x,
          ty = cy + p.y;
        if (p.block) solid.add(key(tx, ty));
        items.push({ ...p, tx, ty, x: tx * T, y: ty * T, base: (ty + p.h) * T });
      }
    } else missing.push('pier@' + PIER.x0 + ',' + PIER.y);

    // Objets : toute l'emprise doit être libre (et hors des chemins pour ce qui bloque).
    for (const p of PROPS) {
      const path = (x, y) => tiles[y][x] === 2;
      const fits = (x, y) =>
        p.on && ground.get(key(x, y))?.type === p.on ? land(x, y) && !solid.has(key(x, y)) : free(x, y);
      const cellsAt = (x0, y0) => {
        const out = [];
        for (let y = y0; y < y0 + p.h; y++) for (let x = x0; x < x0 + p.w; x++) out.push([x, y]);
        return out;
      };
      const fitsAt = list =>
        list.every(([x, y]) =>
          p.onRoad
            ? land(x, y) && !solid.has(key(x, y))
            : p.kind === 'arch'
              ? land(x, y) || ground.get(key(x, y))?.type === 'gpath'
              : fits(x, y) &&
                (!(
                  p.block ||
                  p.kind === 'pen' ||
                  p.kind === 'garden' ||
                  p.kind === 'field' ||
                  p.kind === 'barber'
                ) ||
                  !path(x, y))
        );
      // Place prévue, puis les places de rechange (alt) dans l'ordre : la première libre.
      let x0 = cx + p.x,
        y0 = cy + p.y,
        cells = cellsAt(x0, y0),
        ok = fitsAt(cells);
      for (const [ax, ay] of p.alt || []) {
        if (ok) break;
        const list = cellsAt(cx + ax, cy + ay);
        if (fitsAt(list)) {
          x0 = cx + ax;
          y0 = cy + ay;
          cells = list;
          ok = true;
        }
      }
      if (!ok) {
        if (!p.optional) missing.push(p.kind + (p.crop ? ':' + p.crop : '') + '@' + p.x + ',' + p.y);
        continue;
      }
      // Les arbres et buissons sauvages autour sont dégagés.
      for (let y = y0 - 1; y <= y0 + p.h; y++)
        for (let x = x0 - 1; x <= x0 + p.w; x++) if (!ground.has(key(x, y))) clear(x, y);
      const item = { ...p, tx: x0, ty: y0, x: x0 * T, y: y0 * T, base: (y0 + p.h) * T };
      if (p.block) for (const [x, y] of cells) solid.add(key(x, y));
      if (p.kind === 'barber') for (const [x, y] of cells) (y === y0 ? solid : kept).add(key(x, y));
      if (p.kind === 'pen' || p.kind === 'garden')
        for (const [x, y] of cells) {
          const edge = x === x0 || y === y0 || x === x0 + p.w - 1 || y === y0 + p.h - 1,
            gate = p.gate && y === y0 + p.h - 1 && p.gate.includes(x - cx);
          if (edge && !gate) solid.add(key(x, y));
          if (p.kind === 'garden' && !edge) ground.set(key(x, y), { type: 'lawn' });
          if (gate) ground.set(key(x, y), { type: 'gpath' });
        }
      if (p.kind === 'field')
        for (const [x, y] of cells)
          ground.set(key(x, y), {
            type: 'field',
            crop: p.crop,
            row: y - y0,
            col: x - x0,
            last: y === y0 + p.h - 1
          });
      if (p.kind === 'mud') for (const [x, y] of cells) ground.set(key(x, y), { type: 'mud' });
      if (p.kind === 'arch' || p.kind === 'pen' || p.kind === 'garden')
        item.base = p.kind === 'arch' ? (y0 + 1) * T - 4 : (y0 + p.h) * T;
      if (p.kind !== 'mud') items.push(item);
    }
    // Pen et jardin : la clôture se dessine en deux fois (le fond derrière les bêtes, le devant à sa place).
    items = items.flatMap(it =>
      it.kind === 'pen' || it.kind === 'garden'
        ? [
            { ...it, part: 'back', base: it.y + T },
            { ...it, part: 'front' }
          ]
        : [it]
    );
    // Allées du jardin et parterres.
    // Le sol du jardin (allée courbe, placette ronde, massifs arrondis) est peint d'une pièce (gardenArt) : ses cases
    // ne reçoivent plus de touffes de fleurs au hasard ; la porte reste une allée (l'arche s'y pose).
    const garden = items.find(it => it.kind === 'garden');
    if (garden)
      for (let y = garden.ty + 1; y < garden.ty + garden.h; y++)
        for (let x = garden.tx + 1; x < garden.tx + garden.w - 1; x++) {
          const g = ground.get(key(x, y));
          if (g?.type === 'gpath') g.hidden = true;
          else if (!g || g.type === 'lawn') ground.set(key(x, y), { type: 'garden' });
        }
    // Fleurs : touffes sur l'herbe libre du camp et de la ferme, plus serrées le long des chemins et autour de la place.
    const flowers = ['tulipe', 'marguerite', 'lavande', 'rose', 'tulipe', 'marguerite', 'bleuet'];
    for (let y = cy - 20; y <= cy + 20; y++)
      for (let x = cx - 28; x <= cx + 10; x++) {
        if (!free(x, y) || tiles[y][x] !== 1) continue;
        const nearPath = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ].some(
          ([dx, dy]) => tiles[y + dy]?.[x + dx] === 2 || ground.get(key(x + dx, y + dy))?.type === 'plaza'
        );
        const chance = nearPath ? 0.22 : Math.hypot(x - cx, y - cy) < 14 ? 0.08 : 0.04;
        if (hash(x, y, 9) >= chance) continue;
        clear(x, y);
        ground.set(key(x, y), {
          type: 'flowers',
          flower: flowers[Math.floor(hash(x, y, 10) * flowers.length)],
          n: 2 + Math.floor(hash(x, y, 11) * 3)
        });
      }
    // Roseaux et massettes au bord de la mare et du ruisseau.
    for (const [k, g] of ground) {
      if (g.type !== 'pond' && g.type !== 'stream') continue;
      const x = k % MAPW,
        y = (k - x) / MAPW;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1]
      ]) {
        const nk = key(x + dx, y + dy);
        if (
          !ground.has(nk) &&
          free(x + dx, y + dy) &&
          tiles[y + dy][x + dx] === 1 &&
          hash(x + dx, y + dy, g.type === 'pond' ? 12 : 13) < (g.type === 'pond' ? 0.45 : 0.12)
        ) {
          clear(x + dx, y + dy);
          ground.set(nk, { type: 'reeds' });
        }
      }
    }
    items.sort((a, b) => a.base - b.base);

    // Bêtes de la ferme : l'enclos (moutons, vaches, cochons) et les poules autour du poulailler.
    const at = (x, y) => ({ x: (cx + x + 0.5) * T, y: (cy + y + 0.5) * T });
    if (items.some(it => it.kind === 'pen' && !it.mounts)) {
      for (const [kind, x, y, variant] of [
        ['mouton', -11, 10, 0],
        ['mouton', -10, 11, 0],
        ['mouton', -9, 10, 0],
        ['vache', -7, 11, 0],
        ['vache', -8, 12, 1],
        ['cochon', -10, 12, 0],
        ['cochon', -11, 12, 0]
      ])
        animalsList.push({ kind, ...at(x, y), roam: 1.5, variant });
    }
    if (items.some(it => it.kind === 'coop'))
      for (const [x, y, variant] of [
        [-2, 10, 0],
        [-3, 10, 1],
        [-1, 11, 0]
      ])
        animalsList.push({ kind: 'poule', ...at(x, y), roam: 2, variant });
    // Chats et chien du camp.
    for (const [kind, x, y, variant] of [
      ['chat', -4, -2, 0],
      ['chat', 6, -6, 1],
      ['chien', 3, 2, 0]
    ])
      animalsList.push({ kind, ...at(x, y), roam: 3, variant });
    for (const [x, y, k] of [
      [-3, -16, 1],
      [1, -15, 2],
      [-10, 16, 3],
      [-4, 17, 4],
      [5, 17, 5],
      [-6, -4, 6]
    ])
      fliersList.push({ kind: 'papillon', ...at(x, y), seed: k * 97.3 });
    for (const [x, y, k] of [
      [-20, 14, 7],
      [-17, 6, 8],
      [-16, -4, 9]
    ])
      fliersList.push({ kind: 'libellule', ...at(x, y), seed: k * 61.7 });
    RENDER.use({ ground, items, origin });
  }

  // ---------------------------------------------------------------- Collisions et calme
  function blocked(wx, wy) {
    if (game.world.instance) return false;
    return solid.has(key(Math.floor(wx / T), Math.floor(wy / T)));
  }
  function farm(tx, ty) {
    const x = tx - origin.x,
      y = ty - origin.y;
    return CALM.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  }

  // ---------------------------------------------------------------- Dessin (scripts/camp/render.js)
  const RENDER = CANAAN_CAMP_RENDER.create({ key, hash });

  // ---------------------------------------------------------------- Contrôle
  function audit() {
    return {
      missing: [...missing],
      kinds: [...new Set(items.map(it => it.kind + (it.crop ? ':' + it.crop : '')))],
      stream: [...ground.values()].filter(g => g.type === 'stream').length,
      pond: [...ground.values()].filter(g => g.type === 'pond').length,
      flowers: [...ground.values()].filter(g => g.type === 'flowers' || g.type === 'bed').length,
      solid: solid.size,
      animals: animalsList.length
    };
  }

  layout();
  canaanCampLife = {
    occluders: RENDER.occluders,
    place: layout,
    blocked,
    farm,
    animals: () => animalsList,
    fliers: () => fliersList,
    drawGround: RENDER.drawGround,
    draw: RENDER.draw
  };
  window.CANAAN_CAMP_LIFE = Object.freeze({
    audit,
    layout,
    items: () =>
      items.map(it => ({ kind: it.kind, crop: it.crop || null, x: it.tx, y: it.ty, w: it.w, h: it.h })),
    solidAt: (tx, ty) => solid.has(key(tx, ty)),
    // Forge du camp (centre, en pixels), ou null si elle n'a pas trouvé sa place.
    forge() {
      const f = items.find(it => it.kind === 'forge');
      return f ? { x: (f.tx + f.w / 2) * TS, y: (f.ty + f.h) * TS } : null;
    },
    // Salon de coiffure : où se tient la coiffeuse (sur le tapis, à droite du fauteuil, en pixels), ou null.
    barber() {
      const b = items.find(it => it.kind === 'barber');
      return b ? { x: (b.tx + 2) * TS, y: (b.ty + 1) * TS + 28 } : null;
    },
    // Ménagerie : où se tient Oriane (pixels), son enclos (cases) et la clôture de devant, redessinée devant les
    // montures ; null si elle n'a pas trouvé sa place.
    menagerie() {
      const w = items.find(it => it.kind === 'wagon'),
        pen = items.find(it => it.mounts && it.part === 'front');
      return w && pen
        ? {
            x: (w.tx + 5.2) * TS,
            y: (w.ty + 1) * TS,
            pen: { x: pen.tx, y: pen.ty, w: pen.w, h: pen.h },
            drawFront: c => RENDER.drawFence(c, pen)
          }
        : null;
    },
    groundAt: (tx, ty) => ground.get(key(tx, ty))?.type || null,
    // Navire draconique amarré au quai (centre de sa ligne d'eau, en pixels), ou null s'il n'a pas trouvé sa place :
    // le point d'appui de l'extension « L'Éclipse des Dragons ».
    ship() {
      const s = items.find(it => it.kind === 'ship');
      return s ? { x: s.x + (s.w * T) / 2, y: s.y + s.h * T - 4 } : null;
    }
  });
})();
