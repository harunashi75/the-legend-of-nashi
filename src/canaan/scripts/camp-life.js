// Vie du Camp de l'Aurore : une ferme au sud (grange, silo, poulailler, enclos avec moutons, vaches et cochons, bottes
// de foin, charrette, champs de blé, de légumes et de fruits), un verger de pommiers à l'ouest, un jardin fleuri au
// nord, une fontaine sur une petite place pavée, des bûches, des fleurs et un ruisseau qui descend d'une source jusqu'à
// une mare, sous un pont de la route.
// Même style que les donjons : volumes en trois tons (reflet en haut à gauche, ombre en bas à droite), contour sombre,
// grain des décors (canaanPolish, canaanOutline), ombre au sol, lueurs (canaanLight).
// Le plan est fixe (cases comptées depuis le feu) et posé après les bâtiments et les lieux de quête : un élément qui
// tomberait sur une maison, un lieu de quête ou un coffre n'est pas posé (audit()). Tout est décoratif et calculé chez
// chaque joueur à partir de la même île : rien n'est sauvegardé ni envoyé sur le réseau.
(() => {
  'use strict';
  const T = TS;
  const OUT = '#22160e';
  const key = (x, y) => y * MAPW + x;

  // ---------------------------------------------------------------- Plan (cases depuis le centre du camp)
  // Ruisseau : ligne médiane de la source à la mare.
  const STREAM = [
    [-19, -15],
    [-18, -11],
    [-16, -7],
    [-15, -3],
    [-16, 1],
    [-17, 5],
    [-17, 9],
    [-19, 12],
    [-20, 14]
  ];
  const POND = { at: [-20, 14], r: 2.5 };
  // Chemins de terre : allée de la ferme, allée du verger, sentier du jardin et cour de la ferme.
  const PATHS = [
    [0, 4, 1, 19],
    [-26, 5, -12, 6],
    [-6, -13, -5, -8],
    [2, 10, 8, 11],
    // Allée de la forge jusqu'au centre du camp.
    [-5, -3, -2, -2]
  ];
  // Objets : genre, case du coin haut-gauche, taille en cases ; block : toutes les cases bloquent.
  // Places de rechange de la forge autour du camp (cases depuis le camp), des plus proches aux plus lointaines.
  const FORGE_SPOTS = [];
  for (let dy = -12; dy <= 12; dy += 2) for (let dx = -26; dx <= 26; dx += 2) FORGE_SPOTS.push([dx, dy]);
  FORGE_SPOTS.sort(
    (a, b) => Math.abs(a[0] - 9) + Math.abs(a[1] - 1) - (Math.abs(b[0] - 9) + Math.abs(b[1] - 1))
  );
  const PROPS = [
    { kind: 'barn', x: 2, y: 6, w: 5, h: 4, block: true },
    { kind: 'silo', x: 7, y: 8, w: 2, h: 2, block: true },
    { kind: 'coop', x: -3, y: 7, w: 2, h: 2, block: true },
    { kind: 'pen', x: -12, y: 8, w: 8, h: 6 },
    { kind: 'trough', x: -7, y: 9, w: 1, h: 1, block: true },
    { kind: 'mud', x: -11, y: 12, w: 2, h: 1 },
    { kind: 'hay', x: 6, y: 12, w: 3, h: 1, block: true },
    { kind: 'cart', x: 3, y: 12, w: 2, h: 1, block: true },
    { kind: 'field', crop: 'wheat', x: -13, y: 15, w: 6, h: 5 },
    { kind: 'scarecrow', x: -10, y: 17, w: 1, h: 1, block: true, on: 'field' },
    { kind: 'field', crop: 'veg', x: -6, y: 15, w: 6, h: 5 },
    { kind: 'field', crop: 'fruit', x: 2, y: 15, w: 7, h: 5 },
    { kind: 'lantern', x: -1, y: 13, w: 1, h: 1, block: true },
    { kind: 'lantern', x: 2, y: 13, w: 1, h: 1, block: true },
    { kind: 'lantern', x: -1, y: 4, w: 1, h: 1, block: true },
    { kind: 'apple', x: -27, y: 2, w: 1, h: 1, block: true },
    { kind: 'apple', x: -24, y: 2, w: 1, h: 1, block: true },
    { kind: 'apple', x: -21, y: 2, w: 1, h: 1, block: true },
    { kind: 'apple', x: -27, y: 9, w: 1, h: 1, block: true },
    { kind: 'apple', x: -24, y: 9, w: 1, h: 1, block: true },
    { kind: 'apple', x: -21, y: 9, w: 1, h: 1, block: true },
    { kind: 'crates', x: -27, y: 5, w: 1, h: 2, block: true },
    { kind: 'basket', x: -23, y: 7, w: 1, h: 1, block: true },
    { kind: 'logs', x: -26, y: 12, w: 2, h: 1, block: true },
    { kind: 'woodpile', x: -6, y: 2, w: 3, h: 1, block: true },
    { kind: 'chop', x: -3, y: 2, w: 1, h: 1, block: true },
    // Forge du camp : là seulement se fabriquent les enchantements (canaan-gathering).
    { kind: 'forge', x: -6, y: -5, w: 3, h: 2, block: true, alt: FORGE_SPOTS },
    // Fontaine au centre du camp, sur les pavés de la place (là où était le feu de camp).
    { kind: 'fountain', x: -1, y: -1, w: 3, h: 3, block: true, onRoad: true },
    { kind: 'garden', x: -7, y: -19, w: 10, h: 6, gate: [-6, -5] },
    { kind: 'apple', x: -6, y: -18, w: 1, h: 1, block: true },
    { kind: 'apple', x: 1, y: -18, w: 1, h: 1, block: true },
    { kind: 'bench', x: -3, y: -18, w: 2, h: 1, block: true },
    { kind: 'birdbath', x: -1, y: -17, w: 1, h: 1, block: true },
    { kind: 'arch', x: -6, y: -14, w: 2, h: 1 },
    // Embellissements du camp (posés seulement s'ils trouvent leur place) : jardinières fleuries, étal du marché,
    // panneau d'affichage, poteau indicateur, bancs autour de la fontaine. Jamais sur les rangées du point d'apparition
    // (2 à 4 cases sous le centre), où l'on arrive et repart.
    ...[
      [-4, -9],
      [3, -9],
      [4, -7],
      [10, -6],
      [-13, -4],
      [-8, -5],
      [-13, 5],
      [-8, 5],
      [3, -4],
      [-9, -9]
    ].map(([x, y]) => ({ kind: 'planter', x, y, w: 1, h: 1, block: true, optional: true })),
    {
      kind: 'stall',
      x: 6,
      y: -5,
      w: 3,
      h: 1,
      block: true,
      optional: true,
      alt: [
        [11, -4],
        [5, -3],
        [-12, -1],
        [6, 4]
      ]
    },
    {
      kind: 'board',
      x: -9,
      y: 0,
      w: 2,
      h: 1,
      block: true,
      optional: true,
      alt: [
        [-10, -2],
        [6, 0],
        [-9, 2],
        [7, -2]
      ]
    },
    {
      kind: 'signpost',
      x: 5,
      y: 1,
      w: 1,
      h: 1,
      block: true,
      optional: true,
      alt: [
        [8, 1],
        [-7, 1]
      ]
    },
    {
      kind: 'bench',
      x: -9,
      y: -6,
      w: 2,
      h: 1,
      block: true,
      optional: true,
      alt: [
        [-9, -4],
        [-1, -6]
      ]
    },
    {
      kind: 'bench',
      x: -1,
      y: -4,
      w: 2,
      h: 1,
      block: true,
      optional: true,
      alt: [
        [-1, -3],
        [-8, -2]
      ]
    }
  ];
  // Zones de la ferme où aucun monstre n'apparaît (cases depuis le camp).
  const CALM = [
    [-15, 3, 9, 20],
    [-28, 0, -19, 13],
    [-9, -20, 3, -13],
    [-22, -16, -14, 16]
  ];

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
    groundImages = new Map();
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
      sites = Object.values(CANAAN_QUESTS.sites()),
      taken = tools.taken();
    // Une case libre : sur l'île, ni roche ni eau, hors des bâtiments, des lieux de quête et des coffres.
    const house = (x, y) =>
      houses.some(b => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h);
    const quest = (x, y) =>
      sites.some(s => Math.hypot(s.x - x, s.y - y) <= s.r + 1.5) ||
      canaanQuestWalk((x + 0.5) * T, (y + 0.5) * T) !== null;
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
      !solid.has(key(x, y));
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
                (!(p.block || p.kind === 'pen' || p.kind === 'garden' || p.kind === 'field') || !path(x, y))
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
    if (items.some(it => it.kind === 'pen')) {
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

  // ---------------------------------------------------------------- Outils de dessin
  // Sprite pré-dessiné sur une grille de 2 pixels, avec le grain et le contour des décors du jeu.
  const CACHE = new Map();
  function sprite(name, w, h, paint) {
    let s = CACHE.get(name);
    if (s) return s;
    const cv = document.createElement('canvas');
    cv.width = w * 2;
    cv.height = h * 2;
    const g = cv.getContext('2d');
    const R = (x, y, ww, hh, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x) * 2, Math.round(y) * 2, Math.round(ww) * 2, Math.round(hh) * 2);
    };
    // Disque et ellipse pleins, case par case.
    const E = (ex, ey, rx, ry, col) => {
      for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
        for (let x = Math.floor(ex - rx); x <= ex + rx; x++)
          if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 <= 1) R(x, y, 1, 1, col);
    };
    const D = (dx, dy, r, col) => E(dx, dy, r, r, col);
    // Trait en escalier.
    const L = (x0, y0, x1, y1, col, wd = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) R(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, wd, wd, col);
    };
    paint(R, D, E, L);
    // Aplats francs, comme les maisons du camp (building-art.js) : pas de grain, un contour net.
    s = canaanOutline(cv, 2);
    CACHE.set(name, s);
    return s;
  }
  // Hauteur des objets du camp qui cachent un personnage passé derrière eux (pixels au-dessus de leur pied).
  const TALL_ITEMS = {
    barn: 270,
    silo: 220,
    coop: 150,
    apple: 190,
    forge: 150,
    fountain: 160,
    stall: 110,
    board: 100,
    signpost: 112,
    lantern: 100,
    scarecrow: 90,
    woodpile: 60,
    hay: 60,
    cart: 60,
    birdbath: 70,
    bench: 50,
    planter: 46
  };
  let redrawing = false;
  function occluders() {
    if (game.world.instance || !items.length || canaanInHouse(P.x / TS, P.y / TS)) return [];
    const out = [];
    for (const it of items) {
      const hgt = TALL_ITEMS[it.kind];
      if (!hgt || it.part) continue;
      const bottom = it.y + it.h * T;
      if (
        it.x + it.w * T < camX - 200 ||
        it.x > camX + W + 200 ||
        bottom < camY - 60 ||
        bottom - hgt > camY + H + 60
      )
        continue;
      out.push({
        x0: it.x - 30,
        x1: it.x + it.w * T + 30,
        y0: bottom - hgt,
        base: bottom - 8,
        draw: c => {
          redrawing = true;
          c.imageSmoothingEnabled = false;
          drawItem(c, it);
          redrawing = false;
        }
      });
    }
    return out;
  }
  function shadow(c, x, y, rx, ry, a = 0.3) {
    if (redrawing) return;
    c.globalAlpha = a;
    c.fillStyle = '#0a0806';
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
  // Pose un sprite : son bas au point donné, centré.
  function put(c, s, x, y) {
    c.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height));
  }
  const rectOf = c => (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // ---------------------------------------------------------------- Sprites des objets
  // Grange rouge : toit de bardeaux, pignon en planches avec la porte du fenil, grande porte à croix blanches.
  const barnSprite = () =>
    sprite('grange', 120, 140, (R, D, E, L) => {
      const top = 10;
      // Toit : trapèze de bardeaux, plus clair à gauche, plus sombre à droite.
      for (let y = 6; y <= 82; y++) {
        const t = (y - 6) / 76,
          xl = Math.round(22 - 22 * t),
          xr = Math.round(98 + 22 * t),
          band = Math.floor((y - 6) / 5),
          first = (y - 6) % 5 === 0,
          last = (y - 6) % 5 === 4;
        R(xl, y + top, xr - xl, 1, first ? '#a85a40' : last ? '#552a1e' : band % 2 ? '#7a3a2a' : '#8a4432');
        R(xl, y + top, 4, 1, '#b8684a');
        R(xr - 5, y + top, 5, 1, '#4a2418');
        if (!first && !last)
          for (let x = xl + ((band * 7) % 9); x < xr; x += 9) R(x, y + top, 1, 1, '#5a2a1e');
      }
      R(22, 4 + top, 76, 3, '#4a2418');
      R(22, 4 + top, 76, 1, '#7a3a2a');
      // Pignon en planches rouges, bordé de blanc.
      for (let y = 16; y <= 82; y++) {
        const half = Math.round(((y - 16) / 66) * 30);
        R(60 - half, y + top, half * 2, 1, '#b03a2c');
        R(60 - half, y + top, Math.min(half, 6), 1, '#c8503c');
        for (let x = 60 - half + 3; x < 60 + half; x += 5) R(x, y + top, 1, 1, '#8a2a20');
        R(60 - half - 2, y + top, 2, 1, '#ece4d4');
        R(60 + half, y + top, 2, 1, '#b8ae9c');
      }
      // Porte du fenil, foin qui dépasse.
      R(49, 42 + top, 22, 24, '#ece4d4');
      R(51, 44 + top, 18, 20, '#3a1a12');
      R(51, 56 + top, 18, 8, '#e8c050');
      for (let k = 0; k < 6; k++) R(52 + k * 3, 53 + top + (k % 2), 1, 4, '#f6dc7a');
      R(50, 64 + top, 20, 2, '#b8ae9c');
      R(59, 30 + top, 2, 8, '#ece4d4');
      R(56, 33 + top, 8, 2, '#ece4d4');
      // Avant-toit.
      R(0, 82 + top, 120, 3, '#3a1a12');
      // Mur de façade en planches.
      for (let x = 4; x < 116; x++)
        R(
          x,
          85 + top,
          1,
          40,
          x < 12 ? '#c4503c' : x > 106 ? '#7a2a22' : (x - 4) % 5 === 0 ? '#7a2a22' : '#a8382c'
        );
      R(4, 85 + top, 112, 2, '#5a1e16');
      R(4, 85 + top, 4, 40, '#ece4d4');
      R(7, 85 + top, 1, 40, '#b8ae9c');
      R(112, 85 + top, 4, 40, '#c8beac');
      R(115, 85 + top, 1, 40, '#9a9282');
      // Fenêtres éclairées.
      for (const wx of [14, 90]) {
        R(wx, 94 + top, 16, 14, '#ece4d4');
        R(wx + 2, 96 + top, 12, 10, '#f0c860');
        R(wx + 2, 96 + top, 12, 3, '#ffe49a');
        R(wx + 7, 96 + top, 2, 10, '#ece4d4');
        R(wx + 2, 100 + top, 12, 2, '#ece4d4');
        R(wx - 1, 108 + top, 18, 2, '#b8ae9c');
      }
      // Grande porte à deux battants, croix blanches.
      R(42, 92 + top, 36, 34, '#ece4d4');
      R(44, 94 + top, 32, 32, '#6a2e20');
      R(44, 94 + top, 3, 32, '#8a4030');
      R(59, 94 + top, 2, 32, '#ece4d4');
      L(45, 95 + top, 58, 124 + top, '#ece4d4', 2);
      L(58, 95 + top, 45, 124 + top, '#ece4d4', 2);
      L(62, 95 + top, 75, 124 + top, '#ece4d4', 2);
      L(75, 95 + top, 62, 124 + top, '#ece4d4', 2);
      R(56, 108 + top, 2, 3, '#2a1a10');
      R(62, 108 + top, 2, 3, '#2a1a10');
      // Soubassement de pierres.
      for (let x = 2; x < 118; x += 6) {
        R(x, 125 + top, 6, 4, x % 12 ? '#8a8a84' : '#9e9a90');
        R(x, 125 + top, 6, 1, '#c4c0b4');
        R(x + 5, 126 + top, 1, 3, '#5e5e5a');
      }
      // Girouette en coq sur le faîte.
      R(59, top - 6, 2, 11, '#3a3a40');
      R(55, top - 8, 9, 4, '#4a4a52');
      R(62, top - 10, 3, 3, '#4a4a52');
      R(63, top - 11, 2, 1, '#c84a3a');
      R(53, top - 10, 3, 3, '#4a4a52');
    });
  const siloSprite = () =>
    sprite('silo', 44, 112, (R, D, E, L) => {
      for (let y = 24; y < 108; y++)
        for (let x = 4; x < 40; x++) R(x, y, 1, 1, x < 11 ? '#d8d4ca' : x < 31 ? '#b4b0a6' : '#86827a');
      for (let y = 34; y < 108; y += 14) {
        R(4, y, 36, 1, '#6e6a62');
        R(4, y + 1, 36, 1, '#e4e0d8');
      }
      for (let y = 6; y < 26; y++)
        for (let x = 2; x < 42; x++) {
          const dx = (x + 0.5 - 22) / 20,
            dy = (y + 0.5 - 26) / 20;
          if (dx * dx + dy * dy <= 1) R(x, y, 1, 1, x < 12 ? '#c8503c' : x < 32 ? '#a83a2c' : '#7a2a22');
        }
      R(2, 24, 40, 2, '#5a1e16');
      R(20, 3, 4, 4, '#7a2a22');
      // Échelle et petite porte.
      R(33, 30, 1, 76, '#5a4a3a');
      R(37, 30, 1, 76, '#5a4a3a');
      for (let y = 32; y < 106; y += 5) R(33, y, 5, 1, '#7a6a58');
      R(14, 92, 12, 16, '#5a3a26');
      R(14, 92, 12, 2, '#7a5236');
      R(15, 99, 2, 2, '#c8a040');
    });
  const coopSprite = () =>
    sprite('poulailler', 50, 56, (R, D, E, L) => {
      for (let y = 26; y < 52; y++)
        R(4, y, 42, 1, (y - 26) % 5 === 0 ? '#7a5634' : y < 30 ? '#d0a066' : '#b8864e');
      R(4, 26, 4, 26, '#d8aa70');
      R(42, 26, 4, 26, '#8a6438');
      for (let y = 6; y < 28; y++) {
        const t = (y - 6) / 22,
          xl = Math.round(12 - 12 * t),
          xr = Math.round(38 + 12 * t);
        R(xl, y, xr - xl, 1, (y - 6) % 4 === 0 ? '#c8603c' : (y - 6) % 4 === 3 ? '#6e2a1c' : '#a8442c');
        R(xr - 4, y, 4, 1, '#7a2a1e');
      }
      R(10, 4, 30, 3, '#6e2a1c');
      // Trou d'entrée, rampe à barreaux et nichoir de paille.
      R(20, 36, 10, 14, '#2a1a10');
      R(21, 34, 8, 2, '#2a1a10');
      L(24, 50, 34, 55, '#9a7448', 3);
      for (let k = 0; k < 3; k++) R(26 + k * 3, 51 + k, 1, 2, '#5e4430');
      R(9, 32, 8, 6, '#ece4d4');
      R(10, 33, 6, 4, '#3a2a1a');
      R(10, 35, 6, 2, '#e8c050');
      R(36, 31, 6, 7, '#f4f0e8');
      R(40, 29, 3, 3, '#f4f0e8');
      R(41, 28, 2, 1, '#e03a2a');
      R(43, 30, 1, 1, '#f0b030');
    });
  // Bottes de foin rondes : la face coupée avec sa spirale, trois tons, et le lien de ficelle.
  const hayBale = (R, D, x, y, r) => {
    D(x, y, r, '#b08a2e');
    D(x - 1, y - 1, r - 1, '#e2b84e');
    D(x - 2, y - 2, r - 4, '#f2d070');
    for (let k = 3; k < r; k += 3)
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        if ((a + k) % 3)
          R(Math.round(x + Math.cos(ang) * k), Math.round(y + Math.sin(ang) * k), 1, 1, '#c89a38');
      }
    R(x - r + 1, y - 1, r * 2 - 2, 1, '#8a6a2a');
  };
  const haySprite = () =>
    sprite('foin', 72, 40, (R, D) => {
      hayBale(R, D, 13, 28, 11);
      hayBale(R, D, 36, 28, 11);
      hayBale(R, D, 59, 28, 11);
      hayBale(R, D, 24, 13, 10);
      hayBale(R, D, 47, 13, 10);
      for (let k = 0; k < 9; k++) R(4 + k * 7, 38, 3, 1, '#e8c860');
    });
  const cartSprite = () =>
    sprite('charrette', 54, 40, (R, D, E, L) => {
      L(0, 22, 10, 18, '#6e4c32', 2);
      R(8, 12, 40, 14, '#8a6440');
      for (let y = 12; y < 26; y += 4) R(8, y, 40, 1, '#5e4430');
      R(8, 12, 40, 2, '#b08858');
      R(8, 12, 3, 14, '#a07850');
      R(45, 12, 3, 14, '#5e4430');
      // Chargement : courges et foin.
      D(18, 9, 5, '#d8701e');
      D(17, 8, 3, '#f09a3a');
      R(17, 3, 2, 3, '#5a7a2a');
      D(30, 9, 6, '#e8c050');
      D(29, 8, 4, '#f6dc7a');
      D(41, 9, 5, '#c8601a');
      D(40, 8, 3, '#e88a3a');
      for (const wx of [16, 40]) {
        D(wx, 29, 8, '#4e3422');
        D(wx, 29, 6, '#8a6440');
        D(wx - 1, 28, 4, '#a07850');
        L(wx - 6, 29, wx + 6, 29, '#4e3422');
        L(wx, 23, wx, 35, '#4e3422');
        D(wx, 29, 2, '#3a3a40');
      }
    });
  const appleSprite = variant =>
    sprite('pommier' + variant, 46, 56, (R, D, E, L) => {
      // Tronc et racines.
      R(19, 32, 8, 22, '#6e4c32');
      R(19, 32, 2, 22, '#8a6440');
      R(25, 32, 2, 22, '#4a3220');
      R(15, 51, 6, 3, '#5a3e28');
      R(25, 51, 6, 3, '#4a3220');
      L(23, 36, 14, 26, '#6e4c32', 2);
      L(23, 34, 31, 25, '#5a3e28', 2);
      // Feuillage : masses sombres, moyennes puis reflets.
      for (const [x, y, r] of [
        [23, 20, 17],
        [12, 24, 10],
        [34, 24, 10],
        [23, 30, 10]
      ])
        D(x, y, r, '#3a7230');
      for (const [x, y, r] of [
        [23, 18, 15],
        [13, 21, 8],
        [32, 21, 8],
        [22, 27, 8]
      ])
        D(x, y, r, '#529a3a');
      for (const [x, y, r] of [
        [18, 12, 6],
        [28, 11, 4],
        [11, 18, 3]
      ])
        D(x, y, r, '#78c050');
      let h = variant * 13 + 5;
      const rnd = () => {
        h = (h * 9301 + 49297) % 233280;
        return h / 233280;
      };
      for (let k = 0; k < 40; k++)
        R(6 + rnd() * 34, 5 + rnd() * 30, 1, 1, rnd() < 0.5 ? '#2e5e26' : '#8ad060');
      // Pommes rouges.
      for (let k = 0; k < 11; k++) {
        const a = rnd() * Math.PI * 2,
          d = 3 + rnd() * 12,
          x = Math.round(23 + Math.cos(a) * d * 1.1),
          y = Math.round(20 + Math.sin(a) * d * 0.9);
        R(x, y, 3, 3, '#c8281e');
        R(x, y, 2, 2, '#e84a3a');
        R(x, y, 1, 1, '#ff9a8a');
        R(x + 1, y - 1, 1, 1, '#4a3220');
      }
    });
  const crateSprite = () =>
    sprite('cagette', 24, 22, (R, D) => {
      R(1, 8, 22, 13, '#a87c4c');
      R(1, 8, 22, 2, '#c89a64');
      R(1, 14, 22, 1, '#7a5634');
      R(1, 8, 2, 13, '#c89a64');
      R(21, 8, 2, 13, '#6e4c32');
      for (let k = 0; k < 6; k++) {
        const x = 3 + k * 3,
          y = 4 + (k % 2);
        D(x + 1, y + 2, 2, '#c8281e');
        R(x, y + 1, 1, 1, '#ff8a7a');
      }
    });
  const basketSprite = () =>
    sprite('panier', 22, 20, (R, D, E, L) => {
      E(11, 7, 9, 4, '#7a5634');
      for (let y = 7; y < 18; y++) R(2 + (y - 7) / 4, y, 18 - (y - 7) / 2, 1, y % 2 ? '#c8964e' : '#a87838');
      for (let x = 4; x < 19; x += 3) R(x, 8, 1, 9, '#8a6030');
      for (const [x, y] of [
        [6, 4],
        [10, 3],
        [14, 4],
        [8, 6],
        [12, 6]
      ]) {
        D(x, y, 2, '#c8281e');
        R(x - 1, y - 1, 1, 1, '#ff8a7a');
      }
      L(3, 7, 11, 0, '#8a6030');
      L(11, 0, 19, 7, '#8a6030');
    });
  // Bûche vue par le bout : écorce, bois clair, cernes.
  const logEnd = (R, D, x, y, r) => {
    D(x, y, r, '#5a3e28');
    D(x, y, r - 1, '#c9a06c');
    D(x - 0.5, y - 0.5, r - 2, '#e0bc88');
    D(x, y, Math.max(1, r - 3.5), '#c9a06c');
    R(x, y, 1, 1, '#8a6440');
  };
  const logsSprite = () =>
    sprite('buches', 50, 30, (R, D) => {
      R(4, 10, 42, 18, '#6e4c32');
      R(4, 10, 42, 2, '#9a7248');
      for (const [x, y] of [
        [9, 23],
        [19, 23],
        [29, 23],
        [39, 23],
        [14, 15],
        [24, 15],
        [34, 15],
        [19, 7],
        [29, 7]
      ])
        logEnd(R, D, x, y, 5);
    });
  const woodpileSprite = () =>
    sprite('tas-de-bois', 74, 40, (R, D) => {
      // Abri de planches au-dessus du bois coupé.
      R(2, 4, 70, 5, '#5a3e28');
      R(2, 4, 70, 2, '#8a6440');
      R(3, 9, 3, 30, '#4e3627');
      R(68, 9, 3, 30, '#3e2a1e');
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 7; k++) {
          const x = 10 + k * 9 + (row % 2) * 4,
            y = 34 - row * 8;
          if (x > 64) continue;
          logEnd(R, D, x, y, 4.5);
        }
    });
  const chopSprite = () =>
    sprite('billot', 26, 30, (R, D, E, L) => {
      R(4, 14, 18, 14, '#6e4c32');
      R(4, 14, 4, 14, '#8a6440');
      R(18, 14, 4, 14, '#4a3220');
      E(13, 14, 9, 4, '#c9a06c');
      E(12.5, 13.5, 7, 3, '#e0bc88');
      E(13, 14, 3, 1.5, '#b8905f');
      // Hache plantée.
      L(13, 13, 22, 1, '#8a6440', 2);
      R(9, 9, 6, 5, '#8a8a92');
      R(9, 9, 6, 1, '#c4c4cc');
      R(14, 10, 1, 4, '#5a5a62');
      for (const [x, y] of [
        [1, 26],
        [24, 25],
        [3, 29]
      ])
        R(x, y, 3, 2, '#c9a06c');
    });
  // Forge : fourneau de pierre à la gueule rougeoyante, cheminée, soufflet de cuir, enclume et marteau.
  const forgeSprite = () =>
    sprite('forge', 100, 78, (R, D, E, L) => {
      // Cheminée et fourneau.
      R(10, 2, 18, 30, '#6a6a72');
      R(10, 2, 18, 3, '#8a8a92');
      R(26, 2, 2, 30, '#4a4a52');
      R(4, 28, 44, 42, '#7a7a82');
      for (let y = 30; y < 70; y += 8)
        for (let x = 4 + ((y / 8) % 2) * 6; x < 46; x += 12) R(x, y, 11, 7, '#86868e');
      R(4, 28, 44, 3, '#9a9aa2');
      R(46, 28, 2, 42, '#56565e');
      // Gueule du fourneau (le feu s'anime par-dessus).
      R(14, 46, 24, 20, '#2a1a14');
      E(26, 46, 12, 6, '#2a1a14');
      // Soufflet.
      R(50, 52, 14, 8, '#7a4a2a');
      R(50, 52, 14, 2, '#a06a3a');
      L(64, 56, 72, 54, '#5a3a22', 2);
      // Enclume sur son billot.
      R(70, 58, 16, 14, '#6e4c32');
      R(70, 58, 4, 14, '#8a6440');
      R(66, 50, 26, 6, '#4a4e58');
      R(64, 50, 6, 3, '#4a4e58');
      R(72, 56, 14, 3, '#3a3e48');
      R(66, 50, 26, 2, '#7a7e88');
      // Marteau posé.
      L(80, 49, 90, 42, '#8a6440', 2);
      R(86, 38, 8, 5, '#5a5e68');
      R(86, 38, 8, 1, '#9a9ea8');
      // Seau d'eau et outils.
      R(92, 62, 7, 9, '#5a6070');
      R(92, 62, 7, 2, '#58a8e0');
    });
  const fountainSprite = () =>
    sprite('fontaine', 76, 64, (R, D, E) => {
      // Margelle de pierre en ellipse, puis le flanc en blocs, puis l'eau sombre (l'eau vive se dessine par-dessus).
      E(38, 30, 36, 21, '#5e5e5a');
      for (let x = 2; x < 74; x++) {
        const dx = (x + 0.5 - 38) / 36;
        if (dx * dx > 1) continue;
        const yy = Math.round(30 + Math.sqrt(1 - dx * dx) * 21);
        const block = Math.floor((x - 2) / 8) + Math.floor(yy / 6);
        R(x, yy - 1, 1, 12, x < 14 ? '#b0aca0' : x > 60 ? '#6e6e68' : block % 2 ? '#8a8a84' : '#9e9a90');
        if ((x - 2) % 8 === 0) R(x, yy - 1, 1, 12, '#5e5e5a');
        R(x, yy + 4, 1, 1, '#6e6e68');
        R(x, yy + 10, 1, 1, '#4a4a46');
      }
      E(38, 30, 36, 21, '#a8a49a');
      E(37.5, 29.5, 35, 20, '#c4c0b4');
      E(38, 30, 33, 18, '#8a8a84');
      E(38, 30.5, 30, 16, '#1e5a7e');
      E(38, 31, 30, 15, '#2f7aa8');
    });
  const pillarSprite = () =>
    sprite('fontaine-colonne', 30, 46, (R, D, E) => {
      R(11, 18, 8, 26, '#9e9a90');
      R(11, 18, 2, 26, '#c4c0b4');
      R(17, 18, 2, 26, '#6e6e68');
      R(9, 40, 12, 5, '#8a8a84');
      R(9, 40, 12, 1, '#c4c0b4');
      E(15, 16, 13, 5, '#6e6e68');
      E(15, 15, 13, 5, '#b0aca0');
      E(15, 15, 11, 3.5, '#2f7aa8');
      E(15, 14.5, 9, 2.5, '#5aa8d0');
      R(13, 4, 4, 11, '#9e9a90');
      R(13, 4, 1, 11, '#c4c0b4');
      D(15, 4, 3, '#b0aca0');
      R(14, 2, 2, 2, '#d8d4ca');
    });
  // Jardinière de bois débordant de fleurs.
  const planterSprite = v =>
    sprite('jardiniere' + v, 22, 22, (R, D) => {
      R(2, 12, 18, 9, '#9a6a40');
      R(2, 12, 18, 2, '#c89058');
      R(2, 19, 18, 2, '#6a4426');
      for (const x of [5, 10, 15]) R(x, 14, 1, 5, '#7a5230');
      const cols = [
        ['#f06a8a', '#ffe070'],
        ['#9a7ae0', '#ffffff'],
        ['#ff9a4a', '#ffd0e0']
      ][v % 3];
      for (const [x, y, r] of [
        [5, 9, 3],
        [11, 7, 4],
        [17, 9, 3],
        [8, 5, 2],
        [14, 4, 2]
      ])
        D(x, y, r, '#4e8a3a');
      for (const [x, y, r] of [
        [5, 8, 2],
        [11, 6, 3],
        [17, 8, 2]
      ])
        D(x - 1, y - 1, r - 1, '#74b04e');
      for (const [x, y, k] of [
        [4, 7, 0],
        [7, 4, 1],
        [11, 5, 0],
        [14, 3, 1],
        [17, 7, 0],
        [9, 9, 1],
        [13, 9, 0]
      ]) {
        R(x, y, 2, 2, cols[k]);
        R(x, y, 1, 1, '#ffffff');
      }
    });
  // Étal du marché : comptoir de planches, auvent rayé sur deux perches, cageots de fruits et de légumes.
  const stallSprite = () =>
    sprite('etal-marche', 72, 52, R => {
      R(4, 4, 2, 44, '#6a4426');
      R(66, 4, 2, 44, '#6a4426');
      for (let x = 0; x < 72; x += 8) {
        R(x, 2, 8, 10, (x / 8) % 2 ? '#fff4dc' : '#d8483a');
        R(x + 2, 12, 4, 2, (x / 8) % 2 ? '#fff4dc' : '#d8483a');
      }
      R(0, 2, 72, 1, '#ffffff');
      R(6, 30, 60, 6, '#b47c46');
      R(6, 30, 60, 1, '#d8a066');
      R(8, 36, 56, 12, '#8e5a30');
      for (let x = 10; x < 64; x += 6) R(x, 36, 1, 12, '#663c1e');
      const crates = [
        ['#e0503c', '#f07a5a'],
        ['#ffd060', '#fff0a0'],
        ['#7ad070', '#a8e890'],
        ['#c88ae8', '#e8b8ff']
      ];
      crates.forEach(([a, b], k) => {
        const x = 9 + k * 14;
        R(x, 24, 12, 6, '#a8703e');
        for (let i = 0; i < 4; i++) {
          R(x + 1 + i * 3, 21 + (i % 2), 3, 3, a);
          R(x + 1 + i * 3, 21 + (i % 2), 1, 1, b);
        }
      });
    });
  // Panneau d'affichage : cadre de bois, petit toit, avis épinglés.
  const boardSprite = () =>
    sprite('panneau-avis', 50, 50, R => {
      R(6, 14, 3, 34, '#6a4426');
      R(41, 14, 3, 34, '#6a4426');
      R(2, 8, 46, 6, '#86321f');
      R(2, 8, 46, 2, '#b84a32');
      R(5, 14, 40, 24, '#8e5a30');
      R(7, 16, 36, 20, '#c89a64');
      for (const [x, y, w, h, col] of [
        [9, 17, 10, 12, '#fff6e4'],
        [21, 18, 9, 8, '#f6e0a0'],
        [32, 17, 9, 13, '#fff6e4'],
        [20, 28, 11, 7, '#e8f0ff']
      ]) {
        R(x, y, w, h, col);
        R(x + 1, y + 3, w - 2, 1, '#9a8a70');
        R(x + 1, y + 5, w - 3, 1, '#9a8a70');
        R(x + Math.floor(w / 2), y, 1, 1, '#d8483a');
      }
    });
  // Poteau indicateur à trois flèches.
  const signpostSprite = () =>
    sprite('poteau-indicateur', 44, 56, R => {
      R(20, 6, 4, 48, '#6a4426');
      R(20, 6, 1, 48, '#9a6a40');
      for (const [x, y, w, dir, col] of [
        [22, 8, 20, 1, '#c89058'],
        [2, 18, 20, -1, '#b47c46'],
        [22, 28, 18, 1, '#c89058']
      ]) {
        R(x - (dir < 0 ? 0 : 0), y, w, 7, col);
        R(x, y, w, 1, '#e0b078');
        if (dir > 0) {
          R(x + w, y + 1, 2, 5, col);
          R(x + w + 2, y + 2, 1, 3, col);
        } else {
          R(x - 2, y + 1, 2, 5, col);
          R(x - 3, y + 2, 1, 3, col);
        }
        R(x + 3, y + 3, w - 6, 1, '#5a3a20');
      }
    });
  const benchSprite = () =>
    sprite('banc-jardin', 50, 26, R => {
      R(4, 2, 42, 4, '#8a6440');
      R(4, 2, 42, 1, '#b08858');
      R(4, 8, 42, 3, '#7a5634');
      R(2, 12, 46, 5, '#a07850');
      R(2, 12, 46, 1, '#c89a64');
      R(2, 16, 46, 1, '#5e4430');
      for (const x of [5, 42]) {
        R(x, 2, 3, 22, '#5e4430');
        R(x, 2, 1, 22, '#7a5634');
      }
    });
  const birdbathSprite = () =>
    sprite('bain-oiseaux', 24, 34, (R, D, E) => {
      R(9, 14, 6, 16, '#9e9a90');
      R(9, 14, 2, 16, '#c4c0b4');
      R(13, 14, 2, 16, '#6e6e68');
      E(12, 31, 8, 3, '#8a8a84');
      E(12, 12, 11, 4, '#6e6e68');
      E(12, 11, 11, 4, '#b0aca0');
      E(12, 11, 9, 2.5, '#2f7aa8');
      E(11.5, 10.5, 6, 1.5, '#7ac0e0');
      // Petit oiseau sur le rebord.
      R(17, 5, 5, 4, '#7a5a3a');
      R(20, 3, 3, 3, '#7a5a3a');
      R(22, 4, 2, 1, '#f0b030');
      R(21, 4, 1, 1, '#1a1418');
      R(17, 6, 3, 2, '#c87a4a');
      R(15, 6, 2, 1, '#5a3e28');
    });
  const springSprite = () =>
    sprite('source', 40, 26, (R, D) => {
      for (const [x, y, r, k] of [
        [9, 16, 8, 0],
        [30, 15, 9, 1],
        [20, 9, 8, 2],
        [33, 21, 5, 3],
        [6, 22, 5, 4]
      ]) {
        D(x, y, r, '#5e5e5a');
        D(x - 1, y - 1, r - 1, k % 2 ? '#8a8a84' : '#9e9a90');
        D(x - 2, y - 2, r - 4, '#c4c0b4');
        D(x + 1, y - r + 2, 2, '#4f8a3a');
        R(x - 2, y - r + 1, 3, 1, '#6aa84a');
      }
      R(16, 16, 8, 10, '#2f7aa8');
      R(17, 16, 2, 10, '#9fd4ea');
    });
  const troughSprite = () =>
    sprite('abreuvoir', 26, 16, R => {
      R(1, 3, 24, 10, '#6e4c32');
      R(1, 3, 24, 2, '#9a7248');
      R(3, 5, 20, 4, '#2f7aa8');
      R(3, 5, 20, 1, '#7ac0e0');
      R(3, 13, 3, 3, '#4e3627');
      R(20, 13, 3, 3, '#4e3627');
    });
  const archSprite = () =>
    sprite('arche', 52, 60, (R, D) => {
      for (const x of [3, 45]) {
        R(x, 12, 4, 48, '#ece6d8');
        R(x, 12, 1, 48, '#ffffff');
        R(x + 3, 12, 1, 48, '#9a9282');
      }
      for (let k = 0; k <= 20; k++) {
        const a = Math.PI + (k / 20) * Math.PI,
          x = 26 + Math.cos(a) * 21,
          y = 16 + Math.sin(a) * 13;
        D(x, y, 4, '#3e7a2e');
        D(x - 0.5, y - 0.5, 3, '#5a9a3a');
      }
      for (let k = 0; k <= 12; k++) {
        const a = Math.PI + (k / 12) * Math.PI + 0.1,
          x = 26 + Math.cos(a) * 21,
          y = 16 + Math.sin(a) * 13;
        R(x - 1, y - 1, 3, 3, k % 3 ? '#e04a6a' : '#f6a0b8');
        R(x - 1, y - 1, 1, 1, '#ffd0dc');
      }
      for (let y = 20; y < 56; y += 6) {
        D(5, y, 3, '#4a8a36');
        D(47, y + 3, 3, '#4a8a36');
        R(4, y - 1, 2, 2, '#e04a6a');
        R(46, y + 2, 2, 2, '#f6a0b8');
      }
    });
  const scarecrowSprite = () =>
    sprite('epouvantail', 30, 52, (R, D, E, L) => {
      R(14, 12, 3, 40, '#6e4c32');
      R(14, 12, 1, 40, '#8a6440');
      R(2, 20, 26, 3, '#7a5634');
      // Chemise rapiécée, bras de paille.
      R(8, 20, 15, 16, '#4a6ab0');
      R(8, 20, 4, 16, '#6a8ad0');
      R(19, 20, 4, 16, '#34508a');
      R(10, 27, 4, 4, '#c84a3a');
      R(17, 31, 4, 3, '#e8c050');
      for (const x of [0, 26]) for (let k = 0; k < 3; k++) R(x + k, 21 + k, 1, 3, '#e8c860');
      // Tête de toile et chapeau.
      D(15, 13, 6, '#d8c090');
      D(14, 12, 4, '#ecd8a8');
      R(12, 12, 2, 2, '#2a1a10');
      R(17, 12, 2, 2, '#2a1a10');
      R(13, 16, 5, 1, '#8a5a30');
      R(4, 6, 22, 3, '#6e5030');
      R(9, 0, 12, 7, '#8a6438');
      R(9, 0, 3, 7, '#a07850');
      R(9, 4, 12, 2, '#c84a3a');
      for (let k = 0; k < 4; k++) R(10 + k * 3, 19, 1, 3, '#e8c860');
    });
  const fenceSprite = garden =>
    sprite(garden ? 'cloture-blanche' : 'cloture', 24, 22, R => {
      const [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'];
      if (garden) {
        // Piquets blancs pointus, reliés par une traverse.
        for (let x = 0; x < 24; x += 6) {
          R(x + 1, 4, 4, 18, m);
          R(x + 1, 4, 1, 18, l);
          R(x + 4, 4, 1, 18, d);
          R(x + 2, 2, 2, 2, m);
        }
        R(0, 9, 24, 2, d);
        R(0, 16, 24, 2, d);
      } else {
        R(0, 6, 24, 4, m);
        R(0, 6, 24, 1, l);
        R(0, 9, 24, 1, d);
        R(0, 14, 24, 4, m);
        R(0, 14, 24, 1, l);
        R(0, 17, 24, 1, d);
        R(1, 2, 5, 20, m);
        R(1, 2, 2, 20, l);
        R(5, 2, 1, 20, d);
        R(1, 2, 5, 1, l);
      }
    });
  const fencePost = garden =>
    sprite(garden ? 'piquet-blanc' : 'piquet', 8, 26, R => {
      const [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'];
      R(1, 2, 6, 24, m);
      R(1, 2, 2, 24, l);
      R(6, 2, 1, 24, d);
      R(2, 0, 4, 2, m);
    });
  // Barrière de l'enclos, deux battants fermés avec leur écharpe en diagonale.
  const gateSprite = () =>
    sprite('barriere', 48, 24, (R, D, E, L) => {
      for (const x0 of [2, 25]) {
        for (const y of [6, 13]) {
          R(x0 + 1, y, 19, 4, '#9a7048');
          R(x0 + 1, y, 19, 1, '#c09060');
          R(x0 + 1, y + 3, 19, 1, '#5e4430');
        }
        R(x0 + 1, 4, 3, 18, '#a07850');
        R(x0 + 17, 4, 3, 18, '#5e4430');
        L(x0 + 3, 19, x0 + 17, 6, '#c09060', 2);
      }
      R(23, 10, 2, 5, '#3a3a40');
      for (const x of [0, 45]) {
        R(x, 0, 4, 24, '#8a6440');
        R(x, 0, 1, 24, '#b08858');
      }
    });

  // ---------------------------------------------------------------- Dessin du sol
  const WATER = ['#2a6f98', '#3d8fb8', '#9fd8ec'];
  function drawWaterTile(c, x, y, g, R) {
    const X = x * T,
      Y = y * T;
    const wet = (dx, dy) => {
      const n = ground.get(key(x + dx, y + dy));
      return (
        (n && (n.type === 'stream' || n.type === 'pond')) ||
        BRIDGE_TILES.has(key(x + dx, y + dy)) ||
        game.world.overworld[y + dy]?.[x + dx] === 0
      );
    };
    R(X, Y, T, T, WATER[1]);
    // Reflets qui descendent le courant ; ronds lents sur la mare.
    if (g.type === 'stream') {
      const t = time * 0.55;
      for (let k = 0; k < 3; k++) {
        const s = (t + k * 16 + hash(x, y, k) * 48) % 48,
          ax = X + 8 + hash(x, y, k + 3) * 30 + g.fx * (s - 24),
          ay = Y + 8 + hash(x, y, k + 6) * 30 + g.fy * (s - 24);
        c.globalAlpha = Math.sin((s / 48) * Math.PI) * 0.8;
        R(ax, ay, Math.abs(g.fx) > Math.abs(g.fy) ? 8 : 2, Math.abs(g.fx) > Math.abs(g.fy) ? 2 : 8, WATER[2]);
      }
      c.globalAlpha = 1;
    } else {
      const s = (time * 0.4 + hash(x, y, 1) * 200) % 200;
      if (s < 60) {
        c.globalAlpha = (1 - s / 60) * 0.5;
        c.strokeStyle = WATER[2];
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(X + 24, Y + 24, 4 + s * 0.3, 2 + s * 0.12, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
    }
    if (hash(x, y, Math.floor(time / 40)) < 0.15)
      R(X + hash(x, y, 2) * 40, Y + hash(x, y, 4) * 40, 3, 3, '#e8f8ff');
    // Berges : terre, galets en trois tons et herbe qui déborde.
    const sides = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ];
    sides.forEach(([dx, dy], i) => {
      if (wet(dx, dy)) return;
      const hor = dy !== 0,
        bx = dx === 1 ? X + T - 8 : X,
        by = dy === 1 ? Y + T - 8 : Y;
      R(hor ? X : bx, hor ? by : Y, hor ? T : 8, hor ? 8 : T, '#6b5a3a');
      R(
        hor ? X : dx === 1 ? bx - 3 : bx + 8,
        hor ? (dy === 1 ? by - 3 : by + 8) : Y,
        hor ? T : 3,
        hor ? 3 : T,
        WATER[0]
      );
      for (let k = 0; k < 3; k++) {
        const o = 4 + k * 15 + hash(x, y, i * 3 + k) * 8,
          px = hor ? X + o : bx + 1,
          py = hor ? by + 1 : Y + o,
          w = 6 + hash(x, y, i + k) * 3;
        R(px - 1, py - 1, w + 2, 7, OUT);
        R(px, py, w, 5, k % 2 ? '#8a8a84' : '#9e9a90');
        R(px, py, w, 1, '#c4c0b4');
        R(px + w - 2, py + 1, 2, 4, '#5e5e5a');
      }
      for (let k = 0; k < 4; k++) {
        const o = 3 + k * 12 + hash(x, y, i + k + 9) * 6,
          px = hor ? X + o : dx === 1 ? X + T - 3 : X,
          py = hor ? (dy === 1 ? Y + T - 3 : Y) : Y + o;
        R(px, py, hor ? 3 : 3, hor ? 3 : 3, k % 2 ? '#5f9a3a' : '#7cb84a');
      }
    });
    // Nénuphars sur la mare.
    if (g.type === 'pond' && hash(x, y, 14) < 0.4) {
      const lx = X + 10 + hash(x, y, 15) * 22,
        ly = Y + 12 + hash(x, y, 16) * 20 + Math.sin(time * 0.03 + x) * 1.5;
      R(lx - 2, ly - 2, 20, 13, OUT);
      R(lx, ly, 16, 9, '#4f9a3a');
      R(lx, ly, 16, 3, '#78c050');
      R(lx + 13, ly + 6, 3, 3, '#2e6a26');
      R(lx + 7, ly, 3, 4, WATER[1]);
      if (hash(x, y, 17) < 0.5) {
        R(lx + 2, ly - 4, 8, 6, '#f6c0d8');
        R(lx + 3, ly - 6, 6, 3, '#ffffff');
        R(lx + 5, ly - 2, 2, 2, '#f0c040');
      }
    }
  }
  // Fleurs : tige, feuilles et pétales de chaque espèce.
  const PETALS = {
    tulipe: [
      ['#e0303a', '#ff7a7a'],
      ['#f0c030', '#fff08a'],
      ['#e86ab0', '#ffb0d8']
    ],
    marguerite: [['#ffffff', '#ffffff']],
    lavande: [['#9a6ad8', '#c8a8f0']],
    rose: [
      ['#c8203a', '#f05a70'],
      ['#f0a0b8', '#ffd0dc']
    ],
    bleuet: [['#3a6ae0', '#8ab0ff']],
    tournesol: [['#f0c020', '#ffe070']]
  };
  // Fleur à l'échelle des décors (pixels de 2) : tige, feuille, corolle cernée de sombre.
  function flower(R, kind, x, y, v, sway) {
    const [main, light] = PETALS[kind][v % PETALS[kind].length],
      S = (dx, dy, w, h, col) => R(x + dx * 2, y + dy * 2, w * 2, h * 2, col);
    if (kind === 'tournesol') {
      S(0, -14, 1, 14, '#4a8a2e');
      S(-3, -8, 3, 1, '#5aa83a');
      S(1, -6, 3, 1, '#3e7a2a');
      S(-3 + sway, -20, 8, 7, OUT);
      S(-2 + sway, -19, 6, 5, main);
      S(-2 + sway, -19, 6, 1, light);
      S(-1 + sway, -18, 3, 3, '#6a3a1a');
      return;
    }
    S(0, -5, 1, 5, '#4a8a2e');
    S(-2, -3, 2, 1, '#5aa83a');
    S(1, -2, 2, 1, '#3e7a2a');
    if (kind === 'lavande') {
      for (let k = 0; k < 4; k++) S(-1 + sway, -6 - k * 1.5, 3, 2, k % 2 ? main : light);
      return;
    }
    S(-2 + sway, -9, 5, 5, OUT);
    S(-1 + sway, -8, 3, 3, main);
    S(-1 + sway, -8, 2, 1, light);
    if (kind === 'marguerite' || kind === 'bleuet') S(sway, -7, 1, 1, '#f0c030');
    if (kind === 'tulipe') S(sway, -9, 1, 1, main);
  }
  function drawFieldTile(c, x, y, g, R, sway) {
    const X = x * T,
      Y = y * T;
    if (g.crop === 'wheat') {
      R(X, Y, T, T, '#b08a3a');
      for (let r = 0; r < 4; r++) R(X, Y + 6 + r * 12, T, 3, '#8a6a2a');
      for (let r = 0; r < 3; r++)
        for (let k = 0; k < 5; k++) {
          const sx = X + 3 + k * 9 + (r % 2) * 4,
            base = Y + 16 + r * 15,
            sw = sway + (hash(x + k, y + r, 1) < 0.3 ? 1 : 0);
          R(sx, base - 13, 2, 13, '#c8a040');
          R(sx - 1 + sw, base - 20, 4, 8, '#8a6a2a');
          R(sx + sw, base - 19, 3, 6, '#ecc860');
          R(sx + sw, base - 19, 1, 6, '#fbe49a');
          R(sx + 1 + sw, base - 22, 1, 3, '#d8b050');
        }
      return;
    }
    // Terre labourée : une butte par rang, sillon sombre entre deux, mottes.
    R(X, Y, T, T, '#5e4128');
    R(X, Y + 20, T, 20, '#7a5634');
    R(X, Y + 20, T, 3, '#946a42');
    R(X, Y + 38, T, 3, '#4a3220');
    for (let k = 0; k < 4; k++)
      R(
        X + 4 + hash(x, y, k + 50) * 38,
        Y + 24 + hash(x, y, k + 60) * 12,
        3,
        2,
        k % 2 ? '#8a6440' : '#5a3e28'
      );
    // Bordure de planches autour du champ.
    const same = (dx, dy) => {
      const n = ground.get(key(x + dx, y + dy));
      return n && n.type === 'field' && n.crop === g.crop;
    };
    if (!same(0, -1)) {
      R(X, Y, T, 5, '#5e4430');
      R(X, Y, T, 2, '#9a7048');
    }
    if (!same(0, 1)) {
      R(X, Y + T - 5, T, 5, '#5e4430');
      R(X, Y + T - 5, T, 2, '#9a7048');
    }
    if (!same(-1, 0)) {
      R(X, Y, 5, T, '#5e4430');
      R(X, Y, 2, T, '#9a7048');
    }
    if (!same(1, 0)) {
      R(X + T - 5, Y, 5, T, '#4e3627');
      R(X + T - 5, Y, 1, T, '#7a5634');
    }
    // Plantes sur la butte ; chaque rang a son espèce.
    const kinds =
        g.crop === 'veg'
          ? ['carotte', 'chou', 'tomate', 'courge', 'salade']
          : ['fraise', 'melon', 'framboisier', 'pasteque', 'myrtille'],
      kind = kinds[g.row % 5];
    // Petites plantes deux par case ; les grosses une seule, décalée d'un rang à l'autre (la terre se voit entre elles).
    const small = ['carotte', 'salade', 'fraise'].includes(kind),
      spots = small ? [13, 35] : [(x + g.row) % 2 ? 18 : 30];
    for (let k = 0; k < spots.length; k++) {
      const s = plantSprite(kind, Math.floor(hash(x, y, k) * 2)),
        px = X + spots[k],
        py = Y + 40,
        tall = kind === 'tomate' || kind === 'framboisier' || kind === 'carotte';
      c.globalAlpha = 0.25;
      c.fillStyle = '#1a0e06';
      c.beginPath();
      c.ellipse(px, py - 2, s.width * 0.36, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      if (tall) {
        c.save();
        c.translate(px, py);
        c.transform(1, 0, -sway * 0.03, 1, 0, 0);
        c.drawImage(s, -Math.round(s.width / 2), -s.height);
        c.restore();
      } else c.drawImage(s, Math.round(px - s.width / 2), py - s.height);
    }
  }
  // Légumes et fruits : sprites en trois tons, grain et contour (deux variantes par espèce).
  function plantSprite(kind, v) {
    const P = PLANTS[kind];
    return sprite('plante-' + kind + v, P.w, P.h, (R, D, E, L) => P.draw(R, D, E, L, v));
  }
  const LEAF = ['#2e6a26', '#4a9a36', '#78c050'];
  const PLANTS = {
    carotte: {
      w: 14,
      h: 14,
      draw(R, D, E, L, v) {
        // Fanes plumeuses, puis le haut orange de la racine qui dépasse de la terre.
        for (const [x1, y1, c] of [
          [2, 2, 0],
          [5, 0, 1],
          [7, 1, 2],
          [9, 0, 1],
          [12, 3, 0]
        ]) {
          L(7, 10, x1, y1, LEAF[c]);
          D(x1, y1 + 1, 1.6, LEAF[c]);
          D(x1 + (x1 < 7 ? 1 : -1), y1 + 3, 1.3, LEAF[(c + 1) % 3]);
        }
        E(7, 11.5, 4, 2.5, '#c8601a');
        E(6.5, 11, 3.5, 2, '#e8822a');
        R(5, 10, 3, 1, '#f8b060');
        R(4 + v, 12, 6, 1, '#a84a10');
      }
    },
    chou: {
      w: 16,
      h: 13,
      draw(R, D, E, L, v) {
        E(8, 8, 8, 5, '#2e6a26');
        E(8, 7.5, 7, 4.5, v ? '#4a8a3a' : '#5a9a6a');
        E(8, 6.5, 5, 3.5, v ? '#78b85a' : '#8ac0a0');
        E(8, 6, 3, 2.2, v ? '#b8e090' : '#c8e8d8');
        L(8, 6, 3, 10, '#2e6a26');
        L(8, 6, 13, 10, '#2e6a26');
        L(8, 6, 8, 11, '#2e6a26');
        R(6, 4, 2, 1, '#e8f8d0');
      }
    },
    tomate: {
      w: 14,
      h: 24,
      draw(R, D, E, L, v) {
        // Tuteur, tiges feuillues et grappes de tomates.
        R(6, 0, 2, 24, '#8a6440');
        R(6, 0, 1, 24, '#b08858');
        for (const [x, y, r] of [
          [4, 5, 3.5],
          [10, 8, 3.5],
          [3, 13, 3.5],
          [10, 16, 3.5],
          [6, 19, 3]
        ]) {
          D(x, y, r, LEAF[0]);
          D(x - 0.5, y - 0.5, r - 1, LEAF[1]);
          R(x - 1, y - 2, 2, 1, LEAF[2]);
        }
        for (const [x, y] of v
          ? [
              [3, 8],
              [11, 11],
              [4, 16],
              [9, 19]
            ]
          : [
              [10, 5],
              [4, 11],
              [11, 15],
              [5, 19]
            ]) {
          D(x, y, 2, '#b81a14');
          D(x - 0.3, y - 0.3, 1.5, '#e8382a');
          R(x - 1, y - 1, 1, 1, '#ffa090');
          R(x, y - 2, 1, 1, '#3a7a2a');
        }
      }
    },
    courge: {
      w: 18,
      h: 14,
      draw(R, D, E, L, v) {
        // Grande feuille derrière, courge côtelée, tige et vrille.
        E(4, 5, 4, 3, LEAF[0]);
        E(3.5, 4.5, 3, 2, LEAF[1]);
        E(14, 4, 3.5, 2.5, LEAF[1]);
        E(9, 9, 8, 5, v ? '#a8401a' : '#c0661a');
        E(9, 8.5, 7, 4.3, v ? '#d0601e' : '#e8902a');
        for (const x of [5, 9, 13]) R(x, 5, 1, 8, v ? '#a8401a' : '#c06a1a');
        E(6, 7, 1.5, 2.5, '#f8b860');
        R(8, 2, 2, 3, '#5a6a2a');
        R(8, 2, 1, 3, '#7a8a3a');
        L(10, 3, 13, 1, '#5a8a2e');
        R(13, 0, 2, 1, '#5a8a2e');
      }
    },
    salade: {
      w: 14,
      h: 11,
      draw(R, D, E, L, v) {
        E(7, 7, 7, 4, '#3e8a32');
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          D(7 + Math.cos(a) * 5, 6.5 + Math.sin(a) * 2.8, 1.8, k % 2 ? '#78c050' : '#5aa83a');
        }
        E(7, 6, 3.5, 2.3, v ? '#a8dc78' : '#c86a8a');
        E(7, 5.5, 2, 1.3, v ? '#d8f4b0' : '#e8a0b8');
      }
    },
    fraise: {
      w: 16,
      h: 11,
      draw(R, D, E, L, v) {
        // Feuilles en trèfle, fraises en cœur avec leurs graines, une fleur blanche.
        for (const [x, y] of [
          [3, 4],
          [7, 2],
          [11, 3],
          [13, 6],
          [5, 7]
        ]) {
          D(x, y, 2.4, LEAF[0]);
          D(x - 0.4, y - 0.4, 1.8, LEAF[1]);
          R(x - 1, y - 1, 1, 1, LEAF[2]);
        }
        for (const [x, y] of v
          ? [
              [4, 8],
              [10, 8],
              [13, 9]
            ]
          : [
              [6, 8],
              [11, 7],
              [2, 9]
            ]) {
          R(x - 1, y - 1, 4, 3, '#c81a24');
          R(x, y + 2, 2, 1, '#c81a24');
          R(x - 1, y - 1, 2, 1, '#ff6a6a');
          R(x, y, 1, 1, '#f8e070');
          R(x + 2, y + 1, 1, 1, '#f8e070');
          R(x, y - 2, 2, 1, '#3a8a2a');
        }
        D(9, 4, 1.6, '#ffffff');
        R(9, 4, 1, 1, '#f0c030');
      }
    },
    melon: {
      w: 16,
      h: 12,
      draw(R, D, E, L, v) {
        E(3, 4, 3, 2, LEAF[1]);
        E(8, 7, 7.5, 4.8, '#9a9040');
        E(8, 6.6, 6.8, 4.3, '#c8b860');
        for (let k = 0; k < 5; k++) L(3 + k * 2.5, 3, 2 + k * 3, 11, '#e8dca0');
        L(2, 6, 14, 6, '#e8dca0');
        E(5.5, 5, 2, 1.5, '#f0e8b8');
        R(12, 2, 2, 2, '#5a7a2a');
      }
    },
    framboisier: {
      w: 16,
      h: 24,
      draw(R, D, E, L, v) {
        // Cannes sur un treillis, feuillage dentelé, framboises en grappes.
        R(1, 4, 1, 20, '#8a6440');
        R(14, 4, 1, 20, '#8a6440');
        R(1, 8, 14, 1, '#a07850');
        R(1, 15, 14, 1, '#a07850');
        for (const [x, y, r] of [
          [5, 6, 4],
          [11, 7, 4],
          [8, 12, 4.5],
          [4, 16, 4],
          [12, 17, 4],
          [8, 20, 3.5]
        ]) {
          D(x, y, r, LEAF[0]);
          D(x - 0.5, y - 0.6, r - 1.2, LEAF[1]);
          R(x - 2, y - 3, 2, 1, LEAF[2]);
        }
        for (const [x, y] of v
          ? [
              [4, 9],
              [11, 10],
              [7, 15],
              [12, 19],
              [3, 19]
            ]
          : [
              [6, 8],
              [12, 12],
              [4, 13],
              [9, 18],
              [13, 16]
            ]) {
          D(x, y, 1.6, '#a8102a');
          R(x - 1, y - 1, 1, 1, '#f0506a');
          R(x, y, 1, 1, '#d8203a');
        }
      }
    },
    pasteque: {
      w: 18,
      h: 12,
      draw(R, D, E, L, v) {
        E(15, 3, 3, 2, LEAF[1]);
        E(9, 7, 8.5, 5, '#1e4a1e');
        E(9, 6.6, 8, 4.5, '#2e6a2e');
        for (let k = -2; k <= 2; k++)
          for (let y = 3; y <= 10; y++)
            R(9 + k * 3 + Math.round(Math.sin((y - 6.5) * 0.5) * (k * 0.6)), y, 1, 1, '#5aa04a');
        E(6, 5, 2.5, 1.5, '#8ad07a');
        if (v) {
          // Une tranche ouverte posée devant.
          E(14, 10, 3, 1.6, '#2e6a2e');
          E(14, 9.6, 2.6, 1.2, '#e84a5a');
          R(13, 9, 1, 1, '#2a1a1a');
          R(15, 10, 1, 1, '#2a1a1a');
        }
      }
    },
    myrtille: {
      w: 16,
      h: 15,
      draw(R, D, E, L, v) {
        for (const [x, y, r] of [
          [8, 8, 6.5],
          [4, 10, 4],
          [12, 10, 4]
        ])
          D(x, y, r, '#2a5a2a');
        for (const [x, y, r] of [
          [7.5, 7, 5],
          [4, 9, 3],
          [12, 9, 3]
        ])
          D(x, y, r, '#3e7a36');
        D(6, 5, 2.5, '#5a9a46');
        for (let k = 0; k < 9; k++) {
          const x = 3 + ((k * 5 + v * 3) % 11),
            y = 5 + ((k * 3 + v) % 8);
          D(x + 0.5, y + 0.5, 1.2, '#3a4ab0');
          R(x, y, 1, 1, '#8a9af0');
        }
      }
    }
  };
  // Une case du sol du camp, dessinée dans c (le canevas du jeu, ou l'image gardée de la case).
  function paintGround(c, R, x, y, g, sway) {
    const X = x * T,
      Y = y * T;
    switch (g.type) {
      case 'stream':
      case 'pond':
        drawWaterTile(c, x, y, g, R);
        break;
      case 'plaza': {
        // Pavés en quinconce : joint sombre, pierre en trois tons.
        R(X, Y, T, T, '#5d564d');
        for (let r = 0; r < 2; r++) {
          const off = (y * 2 + r) % 2 ? 12 : 0;
          for (let k = -1; k < 2; k++) {
            const sx = Math.max(X + 1, X + k * 24 + off + 1),
              ex = Math.min(X + T - 1, X + k * 24 + off + 23),
              sy = Y + r * 24 + 1;
            if (ex - sx < 3) continue;
            R(sx, sy, ex - sx, 22, hash(x * 5 + k, y * 3 + r, 1) < 0.5 ? '#a39a8c' : '#958c7e');
            R(sx, sy, ex - sx, 3, '#c4bcae');
            R(sx, sy, 2, 22, '#b4ac9e');
            R(sx, sy + 19, ex - sx, 3, '#6e675d');
          }
        }
        if (g.edge) {
          c.globalAlpha = 0.35;
          R(X, Y, T, 2, '#2a241e');
          R(X, Y + T - 2, T, 2, '#2a241e');
          c.globalAlpha = 1;
        }
        break;
      }
      case 'field':
        drawFieldTile(c, x, y, g, R, sway);
        break;
      case 'mud': {
        // Flaque de boue aux bords arrondis, reflet d'eau qui luit.
        const left = ground.get(key(x - 1, y))?.type === 'mud',
          right = ground.get(key(x + 1, y))?.type === 'mud';
        c.fillStyle = '#4e3420';
        c.beginPath();
        c.ellipse(
          X + T / 2 + (left ? -6 : 0) + (right ? 6 : 0),
          Y + 26,
          left || right ? 30 : 20,
          13,
          0,
          0,
          Math.PI * 2
        );
        c.fill();
        c.fillStyle = '#6b4a2e';
        c.beginPath();
        c.ellipse(X + T / 2 - 4, Y + 23, 12, 6, 0, 0, Math.PI * 2);
        c.fill();
        R(X + 14 + Math.sin(time * 0.04 + x) * 2, Y + 30, 8, 2, '#9a8a6a');
        break;
      }
      case 'lawn':
        break;
      case 'gpath': {
        if (g.hidden) break;
        // Allée de terre battue et pas japonais ronds, aux couleurs des chemins.
        R(X, Y, T, T, '#b8925e');
        for (let k = 0; k < 10; k++)
          R(X + hash(x, y, k + 5) * 44, Y + hash(y, x, k + 6) * 44, 2, 2, k % 2 ? '#a07c4a' : '#cca674');
        for (let k = 0; k < 2; k++) {
          const sx = X + 8 + k * 18 + hash(x, y, k) * 4,
            sy = Y + 8 + k * 16 + hash(x, y, k + 2) * 4;
          R(sx - 1, sy + 1, 18, 12, OUT);
          R(sx + 1, sy - 1, 14, 16, OUT);
          R(sx, sy + 2, 16, 10, '#c8c0b0');
          R(sx + 2, sy, 12, 14, '#c8c0b0');
          R(sx + 2, sy + 1, 10, 3, '#e8e2d6');
          R(sx + 12, sy + 4, 3, 8, '#9a9284');
        }
        break;
      }
      case 'bed':
        R(X + 2, Y + 4, T - 4, T - 6, '#5a3e28');
        R(X + 2, Y + 4, T - 4, 2, '#8a6440');
        for (let k = 0; k < 6; k++)
          flower(R, g.flower, X + 9 + (k % 3) * 14, Y + 24 + Math.floor(k / 3) * 18, k + x, sway);
        break;
      case 'flowers':
        for (let k = 0; k < g.n; k++)
          flower(
            R,
            g.flower,
            X + 8 + hash(x, y, k + 20) * 30,
            Y + 22 + hash(x, y, k + 30) * 22,
            Math.floor(hash(x, y, k + 40) * 3),
            sway
          );
        break;
      case 'reeds':
        for (let k = 0; k < 4; k++) {
          const rx = X + 6 + k * 11 + hash(x, y, k) * 4,
            h = 16 + hash(x, y, k + 5) * 12,
            sw = Math.round(sway * (h / 14));
          R(rx, Y + 44 - h, 2, h, k % 2 ? '#5a8a3a' : '#7aa84a');
          if (k % 2 === 0) {
            R(rx - 1 + sw, Y + 40 - h, 4, 8, OUT);
            R(rx + sw, Y + 41 - h, 2, 6, '#6e4428');
          }
        }
        break;
    }
  }
  // Cases fixes (pavés, champs, allées, parterres, fleurs, roseaux) : une image par case et par position du vent,
  // gardée ; le camp ne redessine plus des milliers de petits rectangles à chaque image (épis de blé, plantes…).
  const OVER = 24;
  const STILL = new Set(['plaza', 'field', 'gpath', 'bed', 'flowers', 'reeds']);
  let groundImages = new Map();
  function groundImage(x, y, g, sway) {
    const id = key(x, y) * 16 + sway + 8;
    let img = groundImages.get(id);
    if (img) return img;
    img = document.createElement('canvas');
    img.width = T;
    img.height = T + OVER;
    const gc = img.getContext('2d');
    if (!gc?.translate) return null;
    gc.imageSmoothingEnabled = false;
    gc.translate(-x * T, -y * T + OVER);
    paintGround(gc, rectOf(gc), x, y, g, sway);
    groundImages.set(id, img);
    return img;
  }
  // ---------------------------------------------------------------- Jardin fleuri (sol peint d'une pièce)
  // Pixels de 2, comme les décors : allée de gravier courbe depuis l'arche, placette ronde pavée autour de la vasque,
  // embranchement vers le banc, pas japonais ronds, massifs aux bords arrondis cernés de galets, pleins de fleurs
  // mêlées (roses, tulipes, lavande, marguerites, bleuets, tournesols), touffes d'herbe qui débordent sur l'allée.
  let gardenCanvas = null,
    gardenKey = '';
  function gardenArt(gd) {
    const cw = (gd.w - 2) * 24,
      ch = (gd.h - 1) * 24,
      id = gd.tx + ',' + gd.ty;
    if (gardenKey === id) return gardenCanvas;
    gardenKey = id;
    gardenCanvas = null;
    if (typeof document === 'undefined') return null;
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    const g = cv.getContext('2d');
    if (!g || !g.fillRect) return null;
    const px = (x, y, col, w = 1, h = 1) => {
        g.fillStyle = col;
        g.fillRect(Math.round(x), Math.round(y), w, h);
      },
      disc = (cx0, cy0, r, col, sq = 1) => {
        g.fillStyle = col;
        for (let y = -r; y <= r; y++) {
          const hw = Math.round(Math.sqrt(Math.max(0, r * r - y * y)) / sq);
          g.fillRect(Math.round(cx0 - hw), Math.round(cy0 + y * sq), hw * 2 + 1, Math.max(1, Math.round(sq)));
        }
      },
      // Case du jardin (depuis le camp) → centre en pixels d'art.
      at = (dx, dy) => [(origin.x + dx - gd.tx - 1) * 24 + 12, (origin.y + dy - gd.ty - 1) * 24 + 12],
      blob = (cx0, cy0, rx, ry, seed) => {
        const pts = [];
        for (let i = 0; i < 32; i++) {
          const a = (i / 32) * Math.PI * 2,
            k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 5 + seed * 2);
          pts.push([cx0 + Math.cos(a) * rx * k, cy0 + Math.sin(a) * ry * k]);
        }
        return pts;
      },
      inside = (pts, x, y) => {
        let c = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [ax, ay] = pts[i],
            [bx, by] = pts[j];
          if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
        }
        return c;
      };
    // Allée : courbe de Bézier depuis la porte, jusqu'à la placette de la vasque.
    const [gx] = at(-6, -14),
      gate = [gx + 12, ch + 4],
      [bx, by] = at(-1, -17),
      bench = at(-3, -18),
      path = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40,
        u = 1 - t;
      path.push([
        u * u * gate[0] + 2 * u * t * (gate[0] + 6) + t * t * (bx - 18),
        u * u * gate[1] + 2 * u * t * (by + 20) + t * t * (by + 6)
      ]);
    }
    const spur = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      spur.push([
        bx - 14 + (bench[0] + 12 - (bx - 14)) * t,
        by - 2 + (bench[1] + 16 - (by - 2)) * t - Math.sin(t * Math.PI) * 4
      ]);
    }
    const stroke = (pts, r, col) => pts.forEach(([x, y]) => disc(x, y, r, col));
    stroke(path, 10, '#8a6a42');
    stroke(spur, 7, '#8a6a42');
    disc(bx, by + 2, 24, '#8a6a42', 0.62);
    stroke(path, 8, '#c8a878');
    stroke(spur, 5, '#c8a878');
    // Placette ronde : pavés en anneaux autour de la vasque.
    disc(bx, by + 2, 22, '#d8d0c0', 0.62);
    for (let r = 6; r <= 20; r += 7)
      for (let a = 0; a < Math.PI * 2; a += 0.6 / (r / 8)) {
        const x = bx + Math.cos(a) * r,
          y = by + 2 + Math.sin(a) * r * 0.62;
        px(x, y, '#a8a090', 3, 1);
        px(x, y - 1, '#f0ebe0', 2, 1);
      }
    // Gravier et pas japonais ronds le long de l'allée.
    for (let i = 0; i < 260; i++) {
      const p = path[Math.floor(hash(i, 1, 61) * path.length)];
      px(
        p[0] + (hash(i, 2, 61) - 0.5) * 14,
        p[1] + (hash(i, 3, 61) - 0.5) * 14,
        i % 3 ? '#b0905e' : '#e0c896'
      );
    }
    for (let i = 4; i < path.length - 3; i += 6) {
      const [x, y] = path[i];
      disc(x + 1, y + 1, 4, '#6a6258', 0.7);
      disc(x, y, 4, '#c8c0b0', 0.7);
      px(x - 2, y - 2, '#ece6da', 3, 1);
    }
    // Massifs arrondis : terre, feuillage serré, fleurs mêlées, bordure de galets.
    const FL = {
      rose: [
        ['#c8203a', '#f05a70'],
        ['#f0a0b8', '#ffd0dc'],
        ['#ffffff', '#ffe8ec']
      ],
      tulipe: [
        ['#e0303a', '#ff7a7a'],
        ['#f0c030', '#fff08a'],
        ['#e86ab0', '#ffb0d8']
      ],
      lavande: [
        ['#9a6ad8', '#c8a8f0'],
        ['#7a5ac8', '#b098f0']
      ],
      champetre: [
        ['#ffffff', '#ffffff'],
        ['#3a6ae0', '#8ab0ff'],
        ['#f0c030', '#fff08a'],
        ['#e86ab0', '#ffb0d8']
      ]
    };
    const [l1x, l1y] = at(-3, -15),
      [r1x, r1y] = at(1, -16),
      [t1x, t1y] = at(-4, -18),
      [t2x, t2y] = at(0, -18);
    const beds = [
      [l1x + 6, l1y + 2, 40, 13, 'rose', 1],
      [r1x - 4, r1y + 8, 16, 22, 'champetre', 2],
      [t1x - 4, t1y + 4, 18, 9, 'tulipe', 3],
      [t2x + 2, t2y + 6, 12, 9, 'lavande', 4]
    ];
    for (const [cx0, cy0, rx, ry, kind, seed] of beds) {
      const pts = blob(cx0, cy0, rx, ry, seed);
      for (let y = Math.floor(cy0 - ry * 1.3); y <= cy0 + ry * 1.3; y++)
        for (let x = Math.floor(cx0 - rx * 1.3); x <= cx0 + rx * 1.3; x++)
          if (inside(pts, x + 0.5, y + 0.5)) px(x, y, hash(x, y, 62) > 0.5 ? '#4a3420' : '#5a3e28');
      // Feuillage.
      for (let i = 0; i < rx * ry * 0.9; i++) {
        const x = cx0 + (hash(i, seed, 63) - 0.5) * rx * 2,
          y = cy0 + (hash(seed, i, 64) - 0.5) * ry * 2;
        if (inside(pts, x, y)) px(x, y, ['#2e6a2a', '#3e8a36', '#5aa848'][i % 3], 2, 2);
      }
      // Fleurs : corolle en croix, cœur, tiges ; les tournesols et la lavande se dressent au fond.
      const pal = FL[kind];
      for (let i = 0; i < rx * ry * 0.22; i++) {
        const x = cx0 + (hash(i, seed, 65) - 0.5) * rx * 1.8,
          y = cy0 + (hash(seed, i, 66) - 0.5) * ry * 1.8;
        if (!inside(pts, x, y)) continue;
        const [m, l] = pal[Math.floor(hash(i, seed, 67) * pal.length)];
        if (kind === 'lavande') {
          for (let k = 0; k < 4; k++) px(x, y - k * 2, k % 2 ? m : l, 2, 2);
          continue;
        }
        px(x - 1, y, m, 3, 1);
        px(x, y - 1, m, 1, 3);
        px(x, y - 1, l);
        px(x, y, kind === 'champetre' && m === '#ffffff' ? '#f0c030' : l);
      }
      if (kind === 'champetre')
        for (let k = 0; k < 3; k++) {
          const x = cx0 - 6 + k * 6,
            y = cy0 - ry + 4;
          px(x, y, '#4a8a2e', 1, 10);
          disc(x, y - 1, 3, '#f0c020');
          disc(x, y - 1, 1, '#6a3a1a');
        }
      // Bordure de galets.
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i],
          [nx, ny] = pts[(i + 1) % pts.length];
        for (let t = 0; t < 1; t += 0.5) {
          const sx = x + (nx - x) * t,
            sy = y + (ny - y) * t;
          px(sx - 1, sy, '#6a6258', 4, 3);
          px(sx - 1, sy - 1, hash(i, t * 10, 68) > 0.5 ? '#d8d0c4' : '#bab2a4', 3, 2);
        }
      }
    }
    // Touffes d'herbe qui débordent sur l'allée et la placette.
    for (let i = 0; i < path.length; i += 2) {
      const [x, y] = path[i];
      for (const side of [-1, 1]) {
        const tx = x + side * (8 + hash(i, side, 69) * 2),
          ty = y + (hash(side, i, 70) - 0.5) * 4;
        px(tx, ty - 2, '#5aa848', 1, 3);
        px(tx + 1, ty - 3, '#7ac85a', 1, 3);
        px(tx - 1, ty - 1, '#3e8a36', 1, 2);
      }
    }
    gardenCanvas = cv;
    return cv;
  }
  function drawGarden(c) {
    const gd = items.find(it => it.kind === 'garden');
    if (!gd) return;
    const mx = (gd.tx + gd.w / 2) * T,
      my = (gd.ty + gd.h / 2) * T;
    if (mx < camX - 500 || mx > camX + W + 500 || my < camY - 500 || my > camY + H + 500) return;
    const art = gardenArt(gd);
    if (art) c.drawImage(art, (gd.tx + 1) * T, (gd.ty + 1) * T, art.width * 2, art.height * 2);
  }
  const fieldSway = (x, y) =>
    Math.round(
      Math.sin(time * 0.05 + x * 0.9 + y * 0.4) * 1.5 +
        (typeof windAt === 'function' ? windAt(x * T, y * T) * 2 : 0)
    );
  function drawGround(c) {
    if (game.world.instance || !ground.size || canaanInHouse(P.x / TS, P.y / TS)) return;
    const x0 = Math.max(0, Math.floor(camX / T) - 1),
      x1 = Math.min(MAPW - 1, Math.ceil((camX + W) / T) + 1),
      y0 = Math.max(0, Math.floor(camY / T) - 1),
      y1 = Math.min(MAPH - 1, Math.ceil((camY + H) / T) + 1);
    if (x1 < origin.x - 32 || x0 > origin.x + 14 || y1 < origin.y - 24 || y0 > origin.y + 24) return;
    const R = rectOf(c);
    c.save();
    c.imageSmoothingEnabled = false;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const g = ground.get(key(x, y));
        if (!g) continue;
        const X = x * T,
          Y = y * T,
          sway = Math.round(Math.sin(time * 0.05 + x * 1.3 + y * 0.7) * 1.2);
        const s = g.type === 'field' ? fieldSway(x, y) : g.type === 'plaza' || g.type === 'gpath' ? 0 : sway;
        if (STILL.has(g.type)) {
          const img = groundImage(x, y, g, s);
          if (img) {
            c.drawImage(img, X, Y - OVER);
            continue;
          }
        }
        paintGround(c, R, x, y, g, s);
      }
    drawGarden(c);
    // Pommes tombées sous les arbres du verger.
    for (const it of items) {
      if (it.kind !== 'apple') continue;
      for (let k = 0; k < 4; k++) {
        const ax = it.x + 24 + (hash(it.tx, it.ty, k) - 0.5) * 70,
          ay = it.y + 34 + hash(it.tx, it.ty, k + 4) * 14;
        R(ax - 1, ay - 1, 6, 6, OUT);
        R(ax, ay, 4, 4, '#c8281e');
        R(ax, ay, 1, 1, '#ff9a8a');
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- Dessin des objets
  function drawFence(c, it) {
    const garden = it.kind === 'garden',
      rail = fenceSprite(garden),
      post = fencePost(garden),
      R = rectOf(c),
      [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'],
      X = it.x,
      Y = it.y,
      w = it.w * T,
      h = it.h * T;
    // Fond : traverse du haut, puis les deux côtés (poteaux et longue traverse) ; devant : la traverse du bas.
    if (it.part === 'back') {
      for (let k = 0; k < it.w; k++) c.drawImage(rail, X + k * T, Y + 2, T, 44);
      for (const sx of [X + 20, X + w - 26]) {
        R(sx - 1, Y + 20, 8, h - T, OUT);
        R(sx, Y + 20, 6, h - T, m);
        R(sx, Y + 20, 2, h - T, l);
        R(sx + 5, Y + 20, 1, h - T, d);
        for (let k = 1; k < it.h; k++) c.drawImage(post, sx - 5, Y + k * T - 8, 16, 52);
      }
      return;
    }
    const by = Y + h - T,
      gate = garden ? it.gate.map(g => g + origin.x - it.tx) : [it.w - 3, it.w - 2];
    for (let k = 0; k < it.w; k++) if (!gate.includes(k)) c.drawImage(rail, X + k * T, by + 2, T, 44);
    if (!garden) c.drawImage(gateSprite(), X + gate[0] * T, by - 4);
    for (const sx of [X + 20, X + w - 26]) c.drawImage(post, sx - 5, by - 8, 16, 52);
  }
  function drawLantern(c, x, y) {
    const R = rectOf(c);
    shadow(c, x, y + 4, 10, 4);
    R(x - 4, y - 46, 8, 50, OUT);
    R(x - 3, y - 45, 6, 48, '#5d4330');
    R(x - 3, y - 45, 2, 48, '#7a5a40');
    R(x + 1, y - 45, 2, 48, '#3e2c1e');
    R(x - 3, y - 48, 16, 4, OUT);
    R(x - 2, y - 47, 14, 2, '#4a4a52');
    R(x + 5, y - 46, 12, 18, OUT);
    R(x + 6, y - 45, 10, 16, '#4a4a52');
    const glow = 0.85 + Math.sin(time * 0.13 + x) * 0.15;
    c.globalAlpha = glow;
    R(x + 7, y - 42, 8, 11, '#ffd36b');
    R(x + 8, y - 41, 3, 6, '#fff1b5');
    c.globalAlpha = 1;
    R(x + 5, y - 49, 12, 4, '#3a3a40');
    canaanLight(x + 11, y - 36, 140, '#ffcf6a');
  }
  function drawFountainWater(c, x, y) {
    const R = rectOf(c);
    // Eau du bassin : reflets qui bougent et ronds sous la chute.
    c.save();
    c.beginPath();
    c.ellipse(x, y, 58, 28, 0, 0, Math.PI * 2);
    c.clip();
    for (let k = 0; k < 6; k++) {
      const s = (time * 0.5 + k * 23) % 140,
        ax = x - 56 + ((k * 37 + s) % 112),
        ay = y - 20 + ((k * 13) % 40);
      c.globalAlpha = 0.5;
      R(ax, ay, 10, 2, '#9fd8ec');
    }
    for (let k = 0; k < 2; k++) {
      const s = (time * 0.6 + k * 30) % 60;
      c.globalAlpha = (1 - s / 60) * 0.7;
      c.strokeStyle = '#cfefff';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y + 2, 14 + s * 0.6, 6 + s * 0.25, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
  function drawSpout(c, x, top, bowl) {
    const R = rectOf(c);
    // Jet : des filets qui montent de la colonne et retombent dans la vasque, puis débordent dans le bassin.
    for (let k = 0; k < 16; k++) {
      const t = (time * 0.022 + k / 16) % 1,
        dir = [-1, 1, -0.5, 0.5][k % 4],
        dx = dir * 24 * t,
        dy = -14 * t + (bowl - top + 14) * t * t;
      c.globalAlpha = 0.95 - t * 0.4;
      R(x + dx - 1, top + dy, 3, 3, t < 0.15 ? '#ffffff' : '#bfe8f8');
    }
    for (let k = 0; k < 8; k++) {
      const t = (time * 0.03 + k / 8) % 1,
        side = k % 2 ? 1 : -1;
      c.globalAlpha = 0.8 - t * 0.5;
      R(x + side * (24 + t * 6), bowl + 2 + t * 34, 2, 4, '#bfe8f8');
    }
    c.globalAlpha = 1;
  }
  const BIG = { barn: barnSprite, silo: siloSprite, coop: coopSprite, hay: haySprite, cart: cartSprite };
  function drawItem(c, it) {
    const X = it.x,
      Y = it.y,
      w = it.w * T,
      cx = X + w / 2,
      bottom = Y + it.h * T;
    switch (it.kind) {
      case 'barn':
      case 'silo':
      case 'coop':
      case 'hay':
      case 'cart':
        shadow(c, cx, bottom - 4, w * 0.5, 12);
        {
          // Grange, silo et poulailler : modèles en pixel art des maisons (building-art.js).
          const art =
            (it.kind === 'barn' || it.kind === 'silo' || it.kind === 'coop') &&
            CANAAN_BUILDING_ART.farm(it.kind, w);
          if (art)
            c.drawImage(
              art.canvas,
              Math.round(cx - art.canvas.width),
              Math.round(bottom + 4 - art.canvas.height * 2),
              art.canvas.width * 2,
              art.canvas.height * 2
            );
          else put(c, BIG[it.kind](), cx, bottom + (it.kind === 'barn' ? 2 : 0));
        }
        if (it.kind === 'barn') {
          canaanLight(X + 44, bottom - 70, 70, '#ffd36b');
          canaanLight(X + w - 44, bottom - 70, 70, '#ffd36b');
          if (Math.hypot(P.x - cx, P.y - bottom) < 360) {
            c.font = 'bold 12px system-ui';
            c.textAlign = 'center';
            c.lineWidth = 3;
            c.strokeStyle = '#101b20';
            c.strokeText('🌾 Ferme de l’Aurore', cx, Y - 74);
            c.fillStyle = '#f6e2b1';
            c.fillText('🌾 Ferme de l’Aurore', cx, Y - 74);
          }
        }
        if (it.kind === 'coop') {
          // Une plume qui volette devant la porte.
          const t = (time * 0.4) % 120;
          if (t < 50) rectOf(c)(cx + 10 + Math.sin(t * 0.2) * 6, bottom - 10 - t * 0.4, 3, 2, '#f4f0e8');
        }
        break;
      case 'pen':
      case 'garden':
        drawFence(c, it);
        break;
      case 'trough':
        shadow(c, cx, bottom - 8, 26, 6);
        put(c, troughSprite(), cx, bottom - 6);
        break;
      case 'scarecrow': {
        shadow(c, cx, bottom - 8, 16, 5);
        const s = scarecrowSprite(),
          bend = Math.sin(time * 0.03 + it.tx) * 0.04;
        c.save();
        c.translate(cx, bottom - 6);
        c.transform(1, 0, -bend, 1, 0, 0);
        c.drawImage(s, -s.width / 2, -s.height);
        c.restore();
        break;
      }
      case 'lantern':
        drawLantern(c, cx - 6, bottom - 8);
        break;
      case 'apple': {
        shadow(c, cx, bottom - 6, 36, 10);
        const s = appleSprite((it.tx + it.ty) % 3),
          bend =
            (typeof windAt === 'function' ? windAt(X, Y) * 0.03 : 0) + Math.sin(time * 0.04 + it.tx) * 0.02;
        c.save();
        c.translate(cx, bottom - 2);
        c.transform(1, 0, -bend, 1, 0, 0);
        // Pommier agrandi (une fois et demie : ses pixels de 2 deviennent des pixels de 3, nets), comme les arbres.
        c.drawImage(
          s,
          Math.round(-s.width * 0.75),
          Math.round(-s.height * 1.5),
          Math.round(s.width * 1.5),
          Math.round(s.height * 1.5)
        );
        c.restore();
        break;
      }
      case 'crates':
        for (let k = 0; k < it.h; k++) {
          shadow(c, cx, Y + (k + 1) * T - 6, 22, 5);
          put(c, crateSprite(), cx, Y + (k + 1) * T - 4);
        }
        break;
      case 'basket':
        shadow(c, cx, bottom - 8, 18, 5);
        put(c, basketSprite(), cx, bottom - 6);
        break;
      case 'logs':
        shadow(c, cx, bottom - 6, w * 0.5, 7);
        put(c, logsSprite(), cx, bottom - 2);
        break;
      case 'woodpile':
        shadow(c, cx, bottom - 6, w * 0.5, 8);
        put(c, woodpileSprite(), cx, bottom - 2);
        break;
      case 'forge': {
        shadow(c, cx, bottom - 8, w * 0.55, 10);
        const fs = forgeSprite(),
          k = fs.width / 100;
        put(c, fs, cx, bottom - 2);
        // Feu dans la gueule du fourneau (sprite dessiné à l'échelle k) : flammes qui dansent et lueur.
        const fx = cx - fs.width / 2 + 26 * k,
          fy = bottom - 2 - fs.height + 58 * k,
          f = Math.sin(time * 0.3) * 2;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(fx, fy, 2, fx, fy, 34);
        g.addColorStop(0, 'rgba(255,170,60,.55)');
        g.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(fx, fy, 34, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff7a2a';
        c.fillRect(fx - 18, fy - 6 + f, 36, 14);
        c.fillStyle = '#ffd060';
        c.fillRect(fx - 10, fy - 2 - f, 20, 10);
        c.restore();
        if (typeof canaanLight === 'function') canaanLight(fx, fy, 90, '#ff9a40', 0.5);
        break;
      }
      case 'chop':
        shadow(c, cx, bottom - 8, 18, 5);
        put(c, chopSprite(), cx, bottom - 4);
        break;
      case 'fountain': {
        // Bassin (centre de l'eau à 72 pixels sous le haut de l'emprise), colonne et vasque, jets d'eau.
        const my = Y + 72;
        shadow(c, cx, bottom - 18, 76, 18);
        put(c, fountainSprite(), cx, bottom - 6);
        drawFountainWater(c, cx, my);
        put(c, pillarSprite(), cx, my + 16);
        drawSpout(c, cx, my - 72, my - 44);
        canaanLight(cx, my - 30, 100, '#9fd8ec');
        break;
      }
      case 'bench':
        shadow(c, cx, bottom - 10, 44, 6);
        put(c, benchSprite(), cx, bottom - 8);
        break;
      case 'planter':
        shadow(c, cx, bottom - 8, 20, 5);
        put(c, planterSprite((it.tx * 3 + it.ty) % 3), cx, bottom - 6);
        break;
      case 'stall':
        shadow(c, cx, bottom - 8, w * 0.5, 8);
        put(c, stallSprite(), cx, bottom - 4);
        break;
      case 'board':
        shadow(c, cx, bottom - 8, 40, 6);
        put(c, boardSprite(), cx, bottom - 4);
        break;
      case 'signpost':
        shadow(c, cx, bottom - 8, 16, 5);
        put(c, signpostSprite(), cx, bottom - 4);
        break;
      case 'birdbath':
        shadow(c, cx, bottom - 10, 16, 5);
        put(c, birdbathSprite(), cx, bottom - 6);
        break;
      case 'arch':
        put(c, archSprite(), cx, bottom + 6);
        break;
      case 'spring': {
        put(c, springSprite(), X, Y + 30);
        const R = rectOf(c);
        for (let k = 0; k < 4; k++) {
          const t = (time * 0.05 + k / 4) % 1;
          c.globalAlpha = 1 - t;
          R(X - 6 + k * 3, Y + 20 + t * 22, 3, 4, '#cfefff');
        }
        c.globalAlpha = 1;
        break;
      }
    }
  }
  function draw(c) {
    if (game.world.instance || !items.length || canaanInHouse(P.x / TS, P.y / TS)) return;
    c.save();
    c.imageSmoothingEnabled = false;
    for (const it of items) {
      if (
        it.x + it.w * T < camX - 200 ||
        it.x > camX + W + 200 ||
        it.y + it.h * T < camY - 60 ||
        it.y > camY + H + 220
      )
        continue;
      drawItem(c, it);
    }
    drawGarlands(c);
    drawPetals(c);
    c.restore();
  }
  // Guirlandes de fanions tendues d'une maison du camp à l'autre, qui flottent au vent.
  const BUNTING = ['#e8483a', '#ffd060', '#56a648', '#4a84cc', '#f06a8a', '#fff4dc'];
  function garlandAnchors() {
    const ids = ['aubepines', 'marmite', 'echoppe'],
      list = ids.map(id => CANAAN_HOUSE.buildings().find(b => b.id === id)).filter(Boolean),
      pairs = [];
    for (let i = 0; i + 1 < list.length; i++) {
      const a = list[i],
        b = list[i + 1];
      pairs.push([(a.x + a.w) * TS - 10, (a.y + a.h) * TS - 70, b.x * TS + 10, (b.y + b.h) * TS - 70]);
    }
    return pairs;
  }
  let garlands = null,
    garlandsFor = null;
  function drawGarlands(c) {
    if (garlandsFor !== items) {
      garlands = garlandAnchors();
      garlandsFor = items;
    }
    for (const [x0, y0, x1, y1] of garlands) {
      if (
        Math.max(x0, x1) < camX - 100 ||
        Math.min(x0, x1) > camX + W + 100 ||
        Math.max(y0, y1) < camY - 100 ||
        Math.min(y0, y1) > camY + H + 100
      )
        continue;
      const len = Math.hypot(x1 - x0, y1 - y0),
        sag = 18 + len * 0.06,
        at = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag];
      c.strokeStyle = '#3a2a1e';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1);
      c.stroke();
      const n = Math.max(3, Math.floor(len / 22));
      for (let k = 1; k < n; k++) {
        const t = k / n,
          [fx, fy] = at(t),
          sway = Math.sin(time * 0.09 + k * 1.3 + x0) * 3;
        c.fillStyle = '#22160e';
        c.beginPath();
        c.moveTo(fx - 7, fy);
        c.lineTo(fx + 7, fy);
        c.lineTo(fx + sway, fy + 15);
        c.closePath();
        c.fill();
        c.fillStyle = BUNTING[k % BUNTING.length];
        c.beginPath();
        c.moveTo(fx - 5, fy + 1);
        c.lineTo(fx + 5, fy + 1);
        c.lineTo(fx + sway, fy + 12);
        c.closePath();
        c.fill();
      }
    }
  }
  // Pétales qui volent au-dessus de la place et du jardin.
  function drawPetals(c) {
    const ox = (origin.x + 0.5) * T,
      oy = (origin.y - 4) * T;
    if (Math.abs(ox - camX - W / 2) > W + 400 || Math.abs(oy - camY - H / 2) > H + 400) return;
    const cols = ['#ffd0e0', '#ffffff', '#f6b0c8', '#fff0a0'];
    for (let k = 0; k < 18; k++) {
      const life = (time * 0.0025 + k * 0.137) % 1,
        x = ox - 520 + ((k * 211) % 1040) + life * 260 + Math.sin(time * 0.03 + k) * 18,
        y = oy - 300 + ((k * 137) % 600) + life * 120 + Math.cos(time * 0.025 + k * 2) * 12;
      c.globalAlpha = Math.sin(life * Math.PI) * 0.9;
      c.fillStyle = cols[k % cols.length];
      c.fillRect(Math.round(x), Math.round(y), 3, 2);
      c.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
    }
    c.globalAlpha = 1;
  }

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
    occluders,
    place: layout,
    blocked,
    farm,
    animals: () => animalsList,
    fliers: () => fliersList,
    drawGround,
    draw
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
    groundAt: (tx, ty) => ground.get(key(tx, ty))?.type || null
  });
})();
