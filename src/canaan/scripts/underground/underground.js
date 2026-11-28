// Les Tréfonds de Canaan : un monde souterrain sous toute l'île, aux mêmes coordonnées (une case des Tréfonds est
// juste sous la case de l'île). Quatre biomes en couronne autour de la Forteresse naine de Durgrim, creusée sous le
// massif central : les Galeries d'Argile (terre, rivières de boue, vieilles mines), la Cité Engloutie de
// Khaz-Ombral (bâtiments nains abandonnés), la Nécropole des Oubliés (cimetières, arbres morts, mausolées) et
// Fangeval, le Marais Fongique (boue, champignons géants, lacs troubles).
// Six entrées à la surface (une par biome de l'île) ; tout le groupe descend et remonte ensemble (touche E).
// Les créatures, élites et boss des Tréfonds ont le niveau du héros qui les croise ; quatre donjons sans niveau
// requis (world.js, scaled) donnent du Peu commun ou du Rare du niveau de chaque héros.
// La carte (game.world.underworld / underdecor) est générée de façon déterministe chez chacun, après l'île.
// Ce fichier garde la génération, les nains, les règles et la carte ; les données (biomes, boss, nains, emprise des
// bâtiments) sont dans shared/data/underground.js, tout le dessin dans scripts/underground/render.js.
(() => {
  'use strict';
  // Données (shared/data/underground.js).
  const {
    T,
    FORT_R,
    BIOMES,
    FORT,
    BOSSES,
    ENTRY_NAMES,
    FORT_PLAN,
    SOLID_DECOR,
    ORE_OF,
    METAL_OF,
    HERB_OF,
    FISH_TABLES,
    FAUNA,
    DWARF_PLAN,
    DWARF_HOMES,
    SCOUTS,
    STRUCT
  } = UNDER_DATA;
  const OPEN = t => t !== undefined && !SOLID.includes(t);
  const WET = new Set([T.RIVER, T.LAKE, T.CHASM]);
  const C = Object.freeze({ x: 200, y: 200 });
  const RAD = Math.PI / 180;
  const polar = (deg, r) => ({
    x: Math.round(C.x + Math.cos(deg * RAD) * r),
    y: Math.round(C.y + Math.sin(deg * RAD) * r)
  });

  // ---------------------------------------------------------------- Les quatre biomes et la forteresse
  const themeOf = b => (b === 4 ? FORT : BIOMES[b] || BIOMES[0]);

  const ENTRANCES = ENTRY_NAMES.map((name, i) => ({ id: i, name, x: 0, y: 0 }));
  const CHESTS = Array.from({ length: 16 }, (_, i) => ({ id: 'under_' + i, x: 0, y: 0, layer: 'under' }));

  // ---------------------------------------------------------------- Génération
  let BMAP = new Uint8Array(MAPW * MAPH);
  const bridges = new Map();
  const structures = [];
  const buckets = new Map();
  const lights = [];
  let nodes = [],
    spots = [],
    fauna = { ground: [], fliers: [] },
    dwarves = [],
    lairs = [],
    hubs = [];
  const tiles = () => game.world.underworld;
  const deco = () => game.world.underdecor;
  const at = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? T.WALL : tiles()[y][x]);
  const set = (x, y, t) => {
    if (x > 2 && y > 2 && x < MAPW - 3 && y < MAPH - 3) tiles()[y][x] = t;
  };
  const biomeAt = (x, y) => (x < 0 || y < 0 || x >= MAPW || y >= MAPH ? 0 : BMAP[(y | 0) * MAPW + (x | 0)]);
  // Biome d'une case : secteur de 90° autour de la forteresse, frontière ondulée (± 12°).
  function sectorOf(x, y) {
    const a = Math.atan2(y - C.y, x - C.x) / RAD + (field(x, y, 37, 791) - 0.5) * 24,
      rel = (((a - (BIOMES[0].angle - 45)) % 360) + 360) % 360;
    return Math.min(3, Math.floor(rel / 90));
  }
  const floorOf = (x, y) => (biomeAt(x, y) === 4 ? T.STONE : BIOMES[biomeAt(x, y)].floor);
  // Couloir sinueux de a à b : creuse la roche (largeur qui respire le long du chemin) ; sur l'eau ou un gouffre, un
  // pont étroit. road : chaussée (dalles, gravier) au milieu.
  function tunnel(a, b, width, road) {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 9)),
      pts = [[a.x, a.y]];
    for (let k = 1; k < n; k++) {
      const t = k / n,
        jx = (field(a.x * 3 + k, b.y, 3, 793) - 0.5) * 9,
        jy = (field(b.x, a.y * 3 + k, 3, 794) - 0.5) * 9;
      pts.push([a.x + (b.x - a.x) * t + jx, a.y + (b.y - a.y) * t + jy]);
    }
    pts.push([b.x, b.y]);
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1],
        [x1, y1] = pts[k],
        steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let s = 0; s <= steps; s++) {
        const fx = x0 + ((x1 - x0) * s) / steps,
          fy = y0 + ((y1 - y0) * s) / steps,
          w = road ? width : width * (0.8 + 0.6 * field(fx, fy, 5, 795));
        for (let y = Math.floor(fy - w); y <= Math.ceil(fy + w); y++)
          for (let x = Math.floor(fx - w); x <= Math.ceil(fx + w); x++) {
            const d = Math.hypot(x - fx, y - fy);
            if (d > w) continue;
            const t = at(x, y);
            if (WET.has(t) || bridges.has(y * MAPW + x)) {
              if (d > 0.8) continue;
              if (!bridges.has(y * MAPW + x)) bridges.set(y * MAPW + x, t);
              set(x, y, T.PATH);
            } else if (road) set(x, y, T.PATH);
            else if (!OPEN(t)) set(x, y, floorOf(x, y));
            if (deco()[y]) deco()[y][x] = null;
          }
      }
    }
  }
  function clear(cx, cy, r, tile) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (Math.hypot(x - cx, y - cy) > r + 0.3) continue;
        bridges.delete(y * MAPW + x);
        set(x, y, tile ?? floorOf(x, y));
        if (deco()[y]) deco()[y][x] = null;
      }
  }
  const hashU = (x, y, k) => hash(x, y, 900 + k);
  function addStructure(kind, tx, ty, biome) {
    const S = STRUCT[kind],
      s = { kind, tx, ty, biome, w: S.w, h: S.h, seed: tx * 7 + ty * 13 };
    // Emprise au sol (pixels) : le bas du bâtiment bloque ; on passe derrière le toit.
    s.box = [(tx - S.w / 2) * TS + 6, (ty - S.foot) * TS, (tx + S.w / 2) * TS - 6, (ty + 0.6) * TS];
    structures.push(s);
    for (let y = Math.floor(ty - S.h); y <= ty + 1; y++)
      for (let x = Math.floor(tx - S.w / 2 - 1); x <= Math.ceil(tx + S.w / 2 + 1); x++)
        if (deco()[y]) deco()[y][x] = null;
    const key = Math.floor(tx / 8) + ',' + Math.floor(ty / 8);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s);
    return s;
  }
  // Cases libres pour un bâtiment : sol praticable sur tout le rectangle, loin des lieux importants.
  function roomFor(tx, ty, w, h, keep) {
    for (let y = ty - h; y <= ty + 1; y++)
      for (let x = tx - Math.ceil(w / 2) - 1; x <= tx + Math.ceil(w / 2) + 1; x++)
        if (!OPEN(at(x, y)) || at(x, y) === T.PATH || at(x, y) === T.MUD) return false;
    return !keep.some(([x, y, r]) => Math.hypot(x - tx, y - ty) < r);
  }

  // ---------------------------------------------------------------- Plan des cavernes
  // Chaque biome : une caverne-porte au sortir de la forteresse, un carrefour (son éclaireur), un village (ses
  // bâtiments), un lac, une caverne profonde, la salle du portail de son donjon et le repaire de son boss ; une caverne
  // de passage entre deux biomes voisins. Des galeries sinueuses, plus ou moins larges, les relient : on se repère
  // d'une grande salle à l'autre au lieu d'errer dans un dédale de poches.
  let caverns = [];
  const VILLAGE_R = [14, 17, 15, 14];
  function plan() {
    caverns = [];
    const add = (p, r, b, kind) => {
      const c = { x: p.x, y: p.y, r, b, kind };
      caverns.push(c);
      return c;
    };
    return BIOMES.map((B, k) => ({
      gate: add(polar(B.angle, 32), 7, k, 'gate'),
      hub: add(polar(B.angle, 60), 12, k, 'hub'),
      village: add(polar(B.angle - 21, 81), VILLAGE_R[k], k, 'village'),
      lake: add(polar(B.angle + 27, 64), 12, k, 'lake'),
      deep: add(polar(B.angle + 1, 100), 10, k, 'deep'),
      portal: add(polar(B.angle + 23, 99), 8.5, k, 'portal'),
      lair: add(polar(B.angle - 26, 104), 10.5, k, 'lair'),
      pass: add(polar(B.angle + 45, 86), 10, k, 'pass')
    }));
  }
  // Caverne qui contient une case (null : galerie ou roche).
  function cavernAt(x, y, k = 1.15) {
    for (const c of caverns) if (Math.hypot(x - c.x, (y - c.y) * 1.12) < c.r * k) return c;
    return null;
  }
  // Salle aux bords organiques : rayon qui ondule tout autour, un peu plus large que haute.
  function carveCavern(c) {
    const m = Math.ceil(c.r * 1.4);
    for (let y = Math.floor(c.y) - m; y <= Math.ceil(c.y) + m; y++)
      for (let x = Math.floor(c.x) - m; x <= Math.ceil(c.x) + m; x++) {
        const a = Math.atan2(y - c.y, x - c.x),
          edge =
            c.r * (0.8 + 0.4 * field(c.x * 5 + Math.cos(a) * 2.6, c.y * 5 + Math.sin(a) * 2.6, 1.6, 811)) +
            (field(x, y, 3, 812) - 0.5) * 2.2;
        if (Math.hypot(x - c.x, (y - c.y) * 1.12) < edge) set(x, y, floorOf(x, y));
      }
  }
  // Tache organique d'un terrain (lac, boue, gouffre) dans une salle : seulement sur le sol déjà creusé.
  function blob(cx, cy, r, tile, seed) {
    const m = Math.ceil(r * 1.5);
    for (let y = Math.floor(cy) - m; y <= Math.ceil(cy) + m; y++)
      for (let x = Math.floor(cx) - m; x <= Math.ceil(cx) + m; x++) {
        const a = Math.atan2(y - cy, x - cx),
          edge = r * (0.75 + 0.5 * field(cx * 7 + Math.cos(a) * 2, cy * 7 + Math.sin(a) * 2, 1.4, seed));
        if (Math.hypot(x - cx, y - cy) < edge && OPEN(at(x, y)) && at(x, y) !== T.PATH) set(x, y, tile);
      }
  }
  function build() {
    game.world.underworld = Array.from({ length: MAPH }, () => Array(MAPW).fill(T.WALL));
    game.world.underdecor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    BMAP = new Uint8Array(MAPW * MAPH);
    bridges.clear();
    structures.length = 0;
    lights.length = 0;
    buckets.clear();
    // 1. Carte des biomes : la forteresse au centre, quatre secteurs autour.
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++)
        BMAP[y * MAPW + x] = Math.hypot(x - C.x, y - C.y) < FORT_R + 4 ? 4 : sectorOf(x, y);
    // 2. Cavernes creusées dans la roche.
    const P = plan();
    for (const c of caverns) carveCavern(c);
    // Piliers de roche dans les grandes salles de passage : on en fait le tour.
    for (const c of caverns)
      if (c.kind === 'deep' || c.kind === 'pass' || c.kind === 'gate')
        for (let k = 0; k < 3; k++) {
          const a = hashU(c.x, k, 30) * Math.PI * 2,
            d = c.r * (0.35 + hashU(k, c.y, 31) * 0.25),
            px = Math.round(c.x + Math.cos(a) * d),
            py = Math.round(c.y + Math.sin(a) * d),
            pr = 0.9 + hashU(px, py, 32) * 0.8;
          for (let y = py - 2; y <= py + 2; y++)
            for (let x = px - 2; x <= px + 2; x++) if (Math.hypot(x - px, y - py) < pr) set(x, y, T.WALL);
        }
    // 3. Eaux, boue et gouffres : dans les salles (jamais au portail, au repaire, au carrefour ni aux portes).
    P.forEach((p, k) => {
      const L = p.lake,
        out = Math.atan2(L.y - C.y, L.x - C.x);
      blob(L.x + Math.cos(out) * L.r * 0.42, L.y + Math.sin(out) * L.r * 0.42, L.r * 0.46, T.LAKE, 820 + k);
      if (k === 1) blob(p.deep.x, p.deep.y + 2, 4.2, T.LAKE, 824);
      if (k === 3) blob(p.pass.x, p.pass.y, 4.5, T.LAKE, 825);
      if (k === 0) blob(p.deep.x + 3, p.deep.y, 3.6, T.LAKE, 826);
      if (k === 1) blob(p.pass.x - 2, p.pass.y + 1, 3.4, T.CHASM, 827);
      if (k === 2) blob(p.deep.x, p.deep.y, 3.8, T.CHASM, 828);
      if (k === 2) blob(p.pass.x + 1, p.pass.y - 1, 3.2, T.LAKE, 829);
    });
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const t = at(x, y),
          b = biomeAt(x, y);
        if (b === 4 || !OPEN(t) || t === T.LAKE || t === T.CHASM) continue;
        const cv = cavernAt(x, y, 1.3),
          calm = !cv || cv.kind === 'portal' || cv.kind === 'lair' || cv.kind === 'hub' || cv.kind === 'gate';
        // Sols de chaque biome : plaques de gravier, de dalles ou de terre.
        if (b === 1 && field(x, y, 7, 880) > 0.62) set(x, y, T.FLOOR);
        if (b === 0 && field(x, y, 8, 881) > 0.66) set(x, y, T.STONE);
        if (b === 3 && field(x, y, 7, 882) > 0.68) set(x, y, T.FLOOR);
        if (b === 2 && field(x, y, 9, 883) > 0.66) set(x, y, T.FLOOR);
        if (calm) continue;
        if (b === 3 && cv.kind !== 'village' && field(x, y, 6, 850) > 0.6) set(x, y, T.MUD);
        if (b === 0 && field(x, y, 6, 851) > 0.72) set(x, y, T.MUD);
        // Ruisseaux de boue des Galeries et de Fangeval : ils sortent de la roche et y retournent.
        if ((b === 0 || b === 3) && cv.kind !== 'village' && Math.abs(field(x, y, 26, 840 + b) - 0.5) < 0.03)
          set(x, y, T.RIVER);
      }
    // 4. Forteresse de Durgrim : place dallée, rempart circulaire et quatre portes vers les biomes.
    for (let y = C.y - FORT_R - 4; y <= C.y + FORT_R + 4; y++)
      for (let x = C.x - FORT_R - 4; x <= C.x + FORT_R + 4; x++) {
        const d = Math.hypot(x - C.x, y - C.y);
        if (d < FORT_R + 0.5) set(x, y, T.STONE);
        else if (d < FORT_R + 2.6) {
          const a = (((Math.atan2(y - C.y, x - C.x) / RAD) % 360) + 360) % 360,
            gate = BIOMES.some(b => Math.abs(((a - b.angle + 540) % 360) - 180) < 8);
          set(x, y, gate ? T.PATH : T.WALL);
        }
      }
    // 5. Lieux : carrefour de chaque biome, portail de son donjon, repaire de son boss.
    hubs = P.map(p => ({ x: p.hub.x, y: p.hub.y }));
    lairs = BOSSES.map(b => ({ x: P[b.biome].lair.x, y: P[b.biome].lair.y, boss: b }));
    const portals = instances.map((d, i) => ({ d, i })).filter(v => v.d.under);
    portals.forEach(({ d }, k) => {
      d.x = P[k].portal.x;
      d.y = P[k].portal.y - 1;
    });
    // 6. Galeries : une route dallée des portes de la forteresse au portail du donjon, par le carrefour ; des galeries
    // plus larges vers chaque salle, et vers les biomes voisins par la caverne de passage.
    P.forEach((p, k) => {
      const A = BIOMES[k].angle,
        next = P[(k + 1) % 4];
      tunnel(p.gate, p.hub, 2.88, false);
      tunnel(p.hub, p.village, 2.75, false);
      tunnel(p.hub, p.lake, 2.5, false);
      tunnel(p.hub, p.deep, 2.62, false);
      tunnel(p.village, p.lair, 2.75, false);
      tunnel(p.deep, p.lair, 2.25, false);
      tunnel(p.deep, p.portal, 2.38, false);
      tunnel(p.lake, p.portal, 2.5, false);
      tunnel(p.hub, p.portal, 2.75, false);
      tunnel(p.lake, p.pass, 2.62, false);
      tunnel(p.pass, next.village, 2.62, false);
      tunnel(polar(A, FORT_R - 2), polar(A, FORT_R + 3), 1.2, true);
      tunnel(polar(A, FORT_R + 3), p.gate, 1.2, true);
      tunnel(p.gate, p.hub, 1.15, true);
      tunnel(p.hub, p.portal, 1.15, true);
    });
    // 7. Entrées depuis l'île : même case qu'à la surface, une petite salle reliée à la caverne la plus proche.
    placeEntrances();
    for (const e of ENTRANCES) {
      carveCavern({ x: e.x, y: e.y, r: 4.5, b: biomeAt(e.x, e.y) });
      clear(e.x, e.y, 2.5);
      const near = caverns
        .filter(c => c.kind !== 'portal' && c.kind !== 'lair')
        .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
      tunnel(e, near, 2, false);
    }
    for (const { d } of portals) clear(d.x, d.y + 1, 4.2, T.STONE);
    for (const l of lairs) clear(l.x, l.y, 7.5);
    for (const h of hubs) clear(h.x, h.y, 4);
    // 8. Alcôves : la roche s'effrite par endroits au bord des salles et des galeries (jamais de poche isolée : on ne
    // garde que ce qui touche déjà le réseau).
    const near = new Uint8Array(MAPW * MAPH);
    for (let y = 4; y < MAPH - 4; y++)
      for (let x = 4; x < MAPW - 4; x++) if (OPEN(at(x, y)) || WET.has(at(x, y))) near[y * MAPW + x] = 1;
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (let y = 4; y < MAPH - 4; y++)
        for (let x = 4; x < MAPW - 4; x++) {
          if (at(x, y) !== T.WALL || biomeAt(x, y) === 4 || Math.hypot(x - C.x, y - C.y) > 116) continue;
          const touch =
            near[y * MAPW + x - 1] ||
            near[y * MAPW + x + 1] ||
            near[(y - 1) * MAPW + x] ||
            near[(y + 1) * MAPW + x];
          if (touch && 0.6 * field(x, y, 4, 801) + 0.4 * field(x, y, 2, 802) > 0.6) add.push([x, y]);
        }
      for (const [x, y] of add) {
        set(x, y, floorOf(x, y));
        near[y * MAPW + x] = 1;
      }
    }
    // 9. Seules les cases accessibles depuis la forteresse restent ouvertes.
    const seen = new Uint8Array(MAPW * MAPH),
      queue = [C.y * MAPW + C.x];
    seen[queue[0]] = 1;
    for (let h = 0; h < queue.length; h++) {
      const k = queue[h],
        x = k % MAPW,
        y = (k - x) / MAPW;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nk = (y + dy) * MAPW + x + dx;
        if (!seen[nk] && OPEN(at(x + dx, y + dy))) {
          seen[nk] = 1;
          queue.push(nk);
        }
      }
    }
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const t = tiles()[y][x];
        if (OPEN(t) && !seen[y * MAPW + x]) tiles()[y][x] = T.WALL;
        // Eau et gouffres isolés dans la roche : de la roche.
        if (
          WET.has(t) &&
          ![
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([dx, dy]) => seen[(y + dy) * MAPW + x + dx])
        )
          tiles()[y][x] = T.WALL;
      }
    // 10. Bâtiments, cimetières, décor, lumières, gisements, bancs de poissons, faune et coffres.
    const keep = [
      [C.x, C.y, FORT_R + 6],
      ...ENTRANCES.map(e => [e.x, e.y, 6]),
      ...portals.map(({ d }) => [d.x, d.y, 6]),
      ...lairs.map(l => [l.x, l.y, 9]),
      ...hubs.map(h => [h.x, h.y, 5])
    ];
    fortress();
    placeStructures(keep);
    cemeteries(keep);
    decorate(keep);
    placeChests(keep);
    findNodes(keep);
    findSpots();
    placeFauna(keep);
    placeDwarves();
    for (const { d, i } of portals) {
      const npc = game.world.npcs.find(n => n.type === 'portal' && n.instance === i);
      if (npc) Object.assign(npc, { x: d.x * TS, y: d.y * TS, layer: 'under' });
    }
    // Pièces des bâtiments de la forteresse (house.js), creusées dans la roche du nord de la carte.
    if (window.CANAAN_HOUSE) CANAAN_HOUSE.stampUnder();
    // Lieux des quêtes de l'Interlude, une fois tout le reste en place.
    CANAAN_QUESTS.placeUnder({
      center: C,
      cavern: (b, kind) => P[b][kind],
      open: (x, y) =>
        OPEN(at(x, y)) &&
        !bridges.has(y * MAPW + x) &&
        !SOLID_DECOR.has(deco()[y]?.[x]) &&
        !structureAt(x, y, 1) &&
        !nodes.some(n => Math.abs(n.tx - x) < 1.5 && Math.abs(n.ty - y) < 1.5) &&
        !portals.some(({ d }) => Math.hypot(d.x - x, d.y - y) < 4) &&
        !lairs.some(l => Math.hypot(l.x - x, l.y - y) < 9),
      clear: (x, y) => {
        if (OPEN(at(x, y))) deco()[y][x] = null;
      },
      dwarf: name => dwarves.find(v => v.name === name)
    });
  }
  // Un point du sol d'un biome, tiré dans l'une de ses salles (n : numéro du tirage, salt : famille de tirages).
  function pick(bi, n, salt, kinds) {
    const list = caverns.filter(c => c.b === bi && (!kinds || kinds.includes(c.kind)));
    if (!list.length) return null;
    const c = list[Math.floor(hashU(n, salt, 40) * list.length)],
      a = hashU(salt, n, 41) * Math.PI * 2,
      d = Math.sqrt(hashU(n + 7, salt, 42)) * c.r * 0.92;
    return { x: Math.round(c.x + Math.cos(a) * d), y: Math.round(c.y + (Math.sin(a) * d) / 1.12) };
  }
  // Entrées à la surface : terre ferme accessible depuis le camp, près de la route, loin des autres lieux.
  function placeEntrances() {
    const W2 = CANAAN_WORLD_TOOLS,
      camp = villages[0],
      surface = game.world.tiles;
    game.world.tiles = game.world.overworld;
    try {
      const reach = W2.reachableFrom(camp.x, camp.y),
        taken = W2.taken(),
        ok = (x, y) =>
          W2.walkableLand(x, y) &&
          reach[y * MAPW + x] === 1 &&
          !isSafe(x, y) &&
          !canaanRoomAt(x, y) &&
          canaanQuestWalk((x + 0.5) * TS, (y + 0.5) * TS, false) === null &&
          game.world.overworld[y][x] !== 2 &&
          !taken.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 7) &&
          !game.world.npcs.some(n => Math.hypot(n.x / TS - x, n.y / TS - y) < 6);
      ENTRANCES.forEach((e, i) => {
        const target = W2.polar(ZONES[i].angle + 14, 100),
          spot = W2.nearestSpot(target.x, target.y, i, ok);
        e.x = spot.x;
        e.y = spot.y;
        taken.push([e.x, e.y]);
        W2.clearArea(e.x, e.y, 2);
      });
    } finally {
      game.world.tiles = surface;
    }
    // Les entrées sont des PNJ d'interaction (touche E) : descendre à la surface, remonter dans les Tréfonds.
    for (let i = game.world.npcs.length - 1; i >= 0; i--)
      if (game.world.npcs[i].type === 'descend' || game.world.npcs[i].type === 'ascend')
        game.world.npcs.splice(i, 1);
    for (const e of ENTRANCES) {
      game.world.npcs.push({
        x: (e.x + 0.5) * TS,
        y: (e.y + 0.5) * TS,
        name: e.name,
        type: 'descend',
        entrance: e.id
      });
      game.world.npcs.push({
        x: (e.x + 0.5) * TS,
        y: (e.y + 0.5) * TS,
        name: e.name,
        type: 'ascend',
        entrance: e.id,
        layer: 'under'
      });
    }
  }
  function fortress() {
    for (const f of FORT_PLAN) addStructure(f.kind, C.x + f.dx, C.y + f.dy, 4);
    for (const [dx, dy] of [
      [-3, 1],
      [3, 1],
      [-4, -5],
      [4, -5],
      [-3, 11],
      [3, 11]
    ])
      deco()[C.y + dy][C.x + dx] = 'k:brazier';
    // Torches et bannières sur le rempart (faces tournées vers la place).
    for (let y = C.y - FORT_R - 3; y <= C.y + FORT_R + 3; y++)
      for (let x = C.x - FORT_R - 3; x <= C.x + FORT_R + 3; x++)
        if (
          at(x, y) === T.WALL &&
          OPEN(at(x, y + 1)) &&
          Math.hypot(x - C.x, y - C.y) < FORT_R + 3 &&
          hashU(x, y, 1) < 0.35
        )
          deco()[y][x] = 'w:' + FORT.wallProps[Math.floor(hashU(x, y, 2) * 4)];
  }
  function placeStructures(keep) {
    BIOMES.forEach((b, bi) => {
      let placed = 0;
      // Le village d'abord, puis les autres grandes salles.
      for (let tries = 0; tries < 1400 && placed < b.structures.length; tries++) {
        const p = pick(bi, tries, 3 + bi, tries < 700 ? ['village'] : ['village', 'deep', 'lake', 'pass']),
          kind = b.structures[placed],
          S = STRUCT[kind];
        if (
          !p ||
          biomeAt(p.x, p.y) !== bi ||
          !roomFor(p.x, p.y, S.w, S.h, keep) ||
          structures.some(s => Math.abs(s.tx - p.x) < (s.w + S.w) / 2 + 2 && Math.abs(s.ty - p.y) < 6)
        )
          continue;
        addStructure(kind, p.x, p.y, bi);
        keep.push([p.x, p.y, 4]);
        placed++;
      }
    });
  }
  // Nécropole : carrés de tombes alignées, avec une grille de fer sur le haut.
  function cemeteries(keep) {
    let made = 0;
    for (let tries = 0; tries < 1500 && made < 5; tries++) {
      const p = pick(2, tries, 5);
      if (!p || biomeAt(p.x, p.y) !== 2 || !roomFor(p.x, p.y, 9, 6, keep)) continue;
      for (let y = p.y - 5; y <= p.y + 1; y++)
        for (let x = p.x - 5; x <= p.x + 5; x++)
          if (OPEN(at(x, y)) && at(x, y) !== T.PATH) set(x, y, T.GRAVE);
      for (let x = p.x - 5; x <= p.x + 5; x++)
        if (OPEN(at(x, p.y - 5))) deco()[p.y - 5][x] = x === p.x ? null : 'fence';
      for (let y = p.y - 3; y <= p.y + 1; y += 2)
        for (let x = p.x - 4; x <= p.x + 4; x += 2)
          if (OPEN(at(x, y)))
            deco()[y][x] = hashU(x, y, 7) < 0.6 ? 'tomb' : hashU(x, y, 8) < 0.5 ? 'cross' : 'grave';
      deco()[p.y - 4][p.x - 5] = 'deadtree';
      keep.push([p.x, p.y - 2, 6]);
      made++;
    }
  }
  function decorate(keep) {
    for (let y = 4; y < MAPH - 4; y++)
      for (let x = 4; x < MAPW - 4; x++) {
        const t = at(x, y),
          b = biomeAt(x, y);
        if (b === 4) continue;
        // Objets sur les parois (lanternes, appliques, crânes, racines), côté sol.
        if (t === T.WALL) {
          if (OPEN(at(x, y + 1)) && at(x, y + 1) !== T.PATH && hashU(x, y, 9) < 0.07)
            deco()[y][x] = 'w:' + BIOMES[b].wallProps[Math.floor(hashU(x, y, 10) * 4)];
          continue;
        }
        if (
          !OPEN(t) ||
          t === T.PATH ||
          deco()[y][x] ||
          keep.some(([kx, ky, r]) => Math.hypot(kx - x, ky - y) < r)
        )
          continue;
        const [density, list] = BIOMES[b].decor;
        if (hashU(x, y, 11) > density) continue;
        let d = list[Math.floor(hashU(x, y, 12) * list.length)];
        // Un objet qui bloque ne se pose ni au bord d'un chemin ni dans un passage étroit.
        const around = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1]
        ];
        if (
          SOLID_DECOR.has(d) &&
          (around.filter(([dx, dy]) => OPEN(at(x + dx, y + dy))).length < 8 ||
            around.some(([dx, dy]) => at(x + dx, y + dy) === T.PATH))
        )
          d = b === 3 ? 'shrooms' : b === 2 ? 'grave' : 'stalag2';
        if (t === T.MUD) d = b === 3 ? (hashU(x, y, 13) < 0.5 ? 'mudreeds' : null) : null;
        deco()[y][x] = d;
      }
    // Lumières fixes : lanternes, braseros, champignons et cristaux (dessinées avec leur objet).
  }
  function placeChests(keep) {
    let k = 0;
    BIOMES.forEach((b, bi) => {
      for (let n = 0, tries = 0; n < 4 && tries < 600; tries++) {
        const p = pick(bi, tries, 14 + bi, ['village', 'lake', 'deep', 'pass', 'gate']);
        if (
          !p ||
          biomeAt(p.x, p.y) !== bi ||
          !OPEN(at(p.x, p.y)) ||
          at(p.x, p.y) === T.PATH ||
          at(p.x, p.y) === T.MUD ||
          deco()[p.y][p.x]
        )
          continue;
        if (
          keep.some(([x, y, r]) => Math.hypot(x - p.x, y - p.y) < r) ||
          CHESTS.some(c => c.x && Math.hypot(c.x - p.x, c.y - p.y) < 12)
        )
          continue;
        Object.assign(CHESTS[k++], { x: p.x, y: p.y });
        n++;
      }
    });
  }
  function findNodes(keep) {
    nodes = [];
    for (let ty = 5; ty < MAPH - 5; ty += 3)
      for (let tx = 5; tx < MAPW - 5; tx += 3) {
        const t = at(tx, ty),
          b = biomeAt(tx, ty);
        if (
          b === 4 ||
          !OPEN(t) ||
          t === T.PATH ||
          t === T.MUD ||
          bridges.has(ty * MAPW + tx) ||
          deco()[ty][tx]
        )
          continue;
        if (keep.some(([x, y, r]) => Math.hypot(x - tx, y - ty) < r) || structureAt(tx, ty, 2)) continue;
        const rocky = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].some(([dx, dy]) => at(tx + dx, ty + dy) === T.WALL),
          roll = hashU(tx, ty, 16);
        let kind = null;
        if (roll < (rocky ? 0.3 : 0.05)) kind = 'ore';
        else if (roll > 0.955) kind = 'herb';
        if (!kind || nodes.some(n => Math.hypot(n.tx - tx, n.ty - ty) < (kind === 'ore' ? 6 : 5))) continue;
        const id = kind === 'herb' ? HERB_OF[b] : hashU(tx, ty, 17) < 0.68 ? ORE_OF[b] : METAL_OF[b];
        nodes.push({ tx, ty, x: (tx + 0.5) * TS, y: (ty + 0.5) * TS, kind, id, zone: 6 + b, layer: 'under' });
      }
  }
  function findSpots() {
    spots = [];
    for (let ty = 4; ty < MAPH - 4; ty += 2)
      for (let tx = 4; tx < MAPW - 4; tx += 2) {
        if (at(tx, ty) !== T.LAKE || hashU(tx, ty, 18) > 0.55) continue;
        const shore = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1]
        ].some(([dx, dy]) => OPEN(at(tx + dx, ty + dy)));
        if (!shore || spots.some(s => Math.hypot(s.tx - tx, s.ty - ty) < 6)) continue;
        const b = biomeAt(tx, ty) % 4;
        spots.push({
          tx,
          ty,
          x: (tx + 0.5) * TS,
          y: (ty + 0.5) * TS,
          kind: 'lake',
          zone: 6 + b,
          table: FISH_TABLES[b],
          layer: 'under'
        });
      }
  }
  function placeFauna(keep) {
    fauna = { ground: [], fliers: [] };
    BIOMES.forEach((b, bi) => {
      const spot = (wet, salt) => {
        for (let tries = 0; tries < 300; tries++) {
          const p = pick(bi, tries, salt);
          if (
            !p ||
            biomeAt(p.x, p.y) !== bi ||
            !OPEN(at(p.x, p.y)) ||
            keep.some(([x, y, r]) => Math.hypot(x - p.x, y - p.y) < r * 0.6)
          )
            continue;
          if (
            wet &&
            ![
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1]
            ].some(([dx, dy]) => at(p.x + dx, p.y + dy) === T.MUD || at(p.x + dx, p.y + dy) === T.LAKE) &&
            tries < 200
          )
            continue;
          return { x: (p.x + 0.5) * TS, y: (p.y + 0.5) * TS };
        }
        return null;
      };
      let salt = bi * 1000;
      for (const [kind, count] of FAUNA[bi].ground)
        for (let k = 0; k < count; k++) {
          const p = spot(kind === 'crapaud', salt++);
          if (p) fauna.ground.push({ kind, ...p, layer: 'under' });
        }
      for (const [kind, count, glow] of FAUNA[bi].fliers)
        for (let k = 0; k < count; k++) {
          const p = spot(false, salt++);
          if (p)
            fauna.fliers.push({
              kind,
              ...p,
              glow: !!glow || kind === 'luciole' || kind === 'spore',
              seed: hashU(k, salt, 21) * 1000,
              layer: 'under'
            });
        }
    });
  }
  function structureAt(tx, ty, margin = 0) {
    for (let by = Math.floor(ty / 8) - 1; by <= Math.floor(ty / 8) + 1; by++)
      for (let bx = Math.floor(tx / 8) - 1; bx <= Math.floor(tx / 8) + 1; bx++)
        for (const s of buckets.get(bx + ',' + by) || [])
          if (Math.abs(s.tx - tx) <= s.w / 2 + margin && ty >= s.ty - s.h - margin && ty <= s.ty + 1 + margin)
            return s;
    return null;
  }

  // ---------------------------------------------------------------- Nains des cavernes
  function placeDwarves() {
    for (let i = game.world.npcs.length - 1; i >= 0; i--)
      if (game.world.npcs[i].dwarf) game.world.npcs.splice(i, 1);
    dwarves = [];
    const add = (d, x, y) => {
      const v = {
        ...d,
        x,
        y,
        hx: x,
        hy: y,
        tx: x,
        ty: y,
        step: 0,
        face: 1,
        wait: Math.floor(hashU(x, y, 22) * 200),
        bubble: null,
        line: 0,
        skin: ['#f0c7a0', '#e8b48a', '#c98e62'][Math.floor(hashU(x, y, 23) * 3)]
      };
      dwarves.push(v);
      game.world.npcs.push({
        x,
        y,
        name: d.name,
        type: d.type || 'dwarf',
        layer: 'under',
        dwarf: v,
        village: FORT.name
      });
    };
    for (const d of DWARF_PLAN) add(d, (C.x + d.dx + 0.5) * TS, (C.y + d.dy + 0.5) * TS);
    // Nains qui vivent dans les bâtiments de la forteresse (pièces de house.js, cases de la pièce).
    for (const d of DWARF_HOMES) {
      const room = typeof CANAAN_ROOMS !== 'undefined' && CANAAN_ROOMS.find(r => r.id === d.room);
      if (room) add(d, (room.x + d.lx) * TS, (room.y + d.ly) * TS);
    }
    SCOUTS.forEach(([name, lines], k) =>
      add(
        {
          name,
          role: 'éclaireur',
          beard: ['#c8642a', '#d8a040', '#4a2e1e', '#e8e0d0'][k],
          helm: '#6a4a2a',
          tunic: '#3a4a2a',
          tool: 'lantern',
          fem: k % 2 === 1,
          lines
        },
        (hubs[k].x + 1.5) * TS,
        (hubs[k].y + 0.5) * TS
      )
    );
  }
  // Une réplique du nain, en bulle au-dessus de lui.
  function talk(npc) {
    const v = npc.dwarf;
    if (!v || !v.lines.length) return false;
    v.bubble = { text: v.lines[v.line % v.lines.length], until: time + 300 };
    CANAAN_SOUND.voice(npc.name || 'nain', v.bubble.text, v.x, v.y, 'dwarf');
    v.line++;
    v.face = P.x < v.x ? -1 : 1;
    return true;
  }
  function stepDwarves() {
    for (const v of dwarves) {
      if (Math.abs(v.x - P.x) > W || Math.abs(v.y - P.y) > H) continue;
      if (v.bubble && v.bubble.until < time) v.bubble = null;
      const roam = v.roam || 0.6;
      if (v.wait > 0) {
        v.wait--;
        continue;
      }
      const dx = v.tx - v.x,
        dy = v.ty - v.y,
        d = Math.hypot(dx, dy);
      if (d < 2) {
        v.wait = 120 + Math.floor(Math.random() * 260);
        v.tx = v.hx + (Math.random() - 0.5) * roam * TS * 2;
        v.ty = v.hy + (Math.random() - 0.5) * roam * TS * 2;
        if (!canWalk(v.tx, v.ty)) [v.tx, v.ty] = [v.hx, v.hy];
        continue;
      }
      const sp = 0.45;
      const nx = v.x + (dx / d) * sp,
        ny = v.y + (dy / d) * sp;
      if (canWalk(nx, ny)) {
        v.x = nx;
        v.y = ny;
        v.step++;
        v.face = dx < 0 ? -1 : 1;
      } else v.wait = 60;
      const npc = game.world.npcs.find(n => n.dwarf === v);
      if (npc) {
        npc.x = v.x;
        npc.y = v.y;
      }
    }
  }
  // ---------------------------------------------------------------- Dessin (scripts/underground/render.js)
  const RENDER = CANAAN_UNDER_RENDER.create({
    OPEN,
    WET,
    themeOf,
    ENTRANCES,
    bridges,
    structures,
    deco,
    at,
    biomeAt,
    stepDwarves,
    dwarves: () => dwarves,
    lairs: () => lairs
  });

  // ---------------------------------------------------------------- Règles : couche, voyage, monstres, boss
  // Les caches de l'île (gisements, bancs, animaux) se calculent à la surface, avant de descendre.
  function prepareSurface() {
    CANAAN_GATHER.prepare();
    CANAAN_PROF.prepare();
    CANAAN_LIFE.prepare();
  }
  function setLayer(layer) {
    if (layer === 'under') {
      if (game.world.layer !== 'under') prepareSurface();
      game.world.layer = 'under';
      if (!game.world.instance) {
        game.world.tiles = game.world.underworld;
        game.world.decor = game.world.underdecor;
      }
    } else {
      game.world.layer = 'surface';
      if (!game.world.instance) {
        game.world.tiles = game.world.overworld;
        game.world.decor = game.world.overdecor;
      }
    }
  }
  // L'hôte mène tout le groupe par une entrée : vers le bas (descend) ou vers le haut (ascend).
  function travel(entrance, down) {
    const e = ENTRANCES[entrance];
    if (!e || game.world.instance) return false;
    if (game.mode === 'guest') {
      toast('Seul l’hôte peut mener le groupe dans les Tréfonds ou à la surface.');
      return false;
    }
    closePanels();
    setLayer(down ? 'under' : 'surface');
    game.world.monsters = [];
    game.world.projectiles = [];
    game.world.drops = [];
    placeGroup((e.x + 0.5) * TS, (e.y + 2.1) * TS);
    spawnMonsters(12);
    spawnWorldBosses();
    toast(
      down
        ? '🏮 Les Tréfonds de Canaan · ' + zoneName(e.x, e.y)
        : '🌅 Retour à la surface · ' + currentZoneName()
    );
    if (down)
      chat(
        'Système',
        'Tu descends dans les Tréfonds : créatures, élites et boss y ont ton niveau. Remonte par n’importe quelle entrée (touche E).'
      );
    saveGame();
    CanaanStages.restartMusic();
    return true;
  }
  function use(npc) {
    if (npc.type === 'descend') return travel(npc.entrance, true);
    if (npc.type === 'ascend') return travel(npc.entrance, false);
    return false;
  }
  const hostLevel = () => Math.max(1, ...game.heroes.filter(h => !h.away).map(h => clampLevel(h.level)));
  // Créatures autour de l'hôte : celles du biome, au niveau du héros (élites : 7 %).
  function spawn(count) {
    const cx = P.x / TS,
      cy = P.y / TS,
      lv = clampLevel(game.hero.level);
    for (let i = 0; i < count; i++) {
      let x,
        y,
        tries = 0;
      do {
        const a = Math.random() * Math.PI * 2,
          r = 12 + Math.random() * 18;
        x = Math.round(cx + Math.cos(a) * r);
        y = Math.round(cy + Math.sin(a) * r);
        tries++;
      } while (
        (!OPEN(at(x, y)) ||
          safe(x, y) ||
          biomeAt(x, y) === 4 ||
          ENTRANCES.some(e => Math.hypot(e.x - x, e.y - y) < 4) ||
          game.world.monsters.some(m => Math.hypot(m.x / TS - x, m.y / TS - y) < 3.5)) &&
        tries < 80
      );
      if (tries >= 80) continue;
      const list = MOB_TYPES.filter(t => t.under === biomeAt(x, y));
      if (!list.length) continue;
      const type = list[Math.floor(Math.random() * list.length)],
        elite = Math.random() < 0.07,
        level = clampLevel(lv + Math.round(Math.random() * 2 - 1)),
        hp = mobHealth(level, elite, type.hp);
      game.world.monsters.push({
        x: (x + 0.5) * TS,
        y: (y + 0.5) * TS,
        hp,
        mhp: hp,
        level,
        t: type.name,
        r: elite ? 19 : 16,
        cd: 0,
        g: mobGold(level, elite),
        mobColor: type.color,
        elite,
        under: true,
        _levelHp: true
      });
    }
  }
  function spawnBosses() {
    const lv = hostLevel();
    for (const l of lairs) {
      const b = l.boss;
      if (
        (game.world.worldBossTimers[b.id] || 0) > Date.now() ||
        game.world.monsters.some(m => m.worldBossId === b.id)
      )
        continue;
      game.world.monsters.push({
        x: (l.x + 0.5) * TS,
        y: (l.y + 0.5) * TS,
        hp: 1000,
        mhp: 1000,
        t: b.name,
        r: 29,
        cd: 0,
        g: 120 + lv * 20,
        level: lv,
        bossLevel: lv,
        bossColor: b.color,
        worldBoss: true,
        worldBossId: b.id,
        look: b.look,
        pal: b.pal,
        lookOpts: b.opts,
        under: true
      });
    }
    game.world.monsters.forEach(scaleBossHp);
  }
  const safe = (tx, ty) => Math.hypot(tx - C.x, ty - C.y) < FORT_R + 3 || canaanInHouse(tx, ty);
  function blocked(px, py) {
    const tx = Math.floor(px / TS),
      ty = Math.floor(py / TS),
      d = deco()?.[ty]?.[tx];
    if (d && SOLID_DECOR.has(d)) {
      const cx = (tx + 0.5) * TS,
        cy = (ty + 0.5) * TS;
      if (Math.abs(px - cx) < 15 && py > cy - 4 && py < cy + 22) return true;
    }
    for (let by = Math.floor(ty / 8) - 1; by <= Math.floor(ty / 8) + 1; by++)
      for (let bx = Math.floor(tx / 8) - 1; bx <= Math.floor(tx / 8) + 1; bx++)
        for (const s of buckets.get(bx + ',' + by) || [])
          if (px > s.box[0] && px < s.box[2] && py > s.box[1] && py < s.box[3]) return true;
    return false;
  }
  function zoneName(tx, ty) {
    const b = biomeAt(tx, ty);
    return b === 4 ? FORT.name : BIOMES[b].name;
  }
  // Zone des métiers et de la chasse : 6 à 9 (Galeries, Cité, Nécropole, Fangeval).
  const zoneId = (tx, ty) => 6 + (biomeAt(tx, ty) % 4);
  const spawnPoint = () => ({ x: (C.x + 0.5) * TS, y: (C.y + 5.5) * TS });
  const forgeSpot = () => ({ x: (C.x - 9 + 0.5) * TS, y: (C.y - 2 + 1.6) * TS });
  const nearStove = (x, y) =>
    !game.world.instance && Math.hypot(x - (C.x + 9.5) * TS, y - (C.y - 0.4) * TS) < TS * 3.2;
  // Ambiance : pénombre et teinte du biome, adoucies d'un biome à l'autre.
  const cur = { dark: 0.6, tint: [10, 8, 6], particles: 'dust', color: '#e0c090' };
  function ambience() {
    const b = biomeAt(P.x / TS, P.y / TS),
      target = themeOf(b).amb,
      k = 0.03;
    cur.dark += (target.dark - cur.dark) * k;
    cur.tint = cur.tint.map((v, i) => v + (target.tint[i] - v) * k);
    cur.particles = target.particles;
    cur.color = target.color;
    return {
      dark: cur.dark,
      tint: cur.tint.map(Math.round).join(','),
      particles: cur.particles,
      color: cur.color,
      heroLight: 300
    };
  }
  // Musique : une pièce par biome (audio.js).
  const themeKey = () =>
    ['galeries', 'ombral', 'necropole', 'fangeval', 'durgrim'][biomeAt(P.x / TS, P.y / TS)];

  // ---------------------------------------------------------------- Carte (mini-carte et touche M)
  function mapColor(t, x, y) {
    const b = biomeAt(x, y),
      th = themeOf(b);
    if (bridges.has(y * MAPW + x)) return '#8a6a40';
    if (t === T.PATH) return th.mapPath;
    if (t === T.MUD) return b === 3 ? '#4e5a28' : '#5e4428';
    if (t === T.RIVER) return (BIOMES[b % 4].river || BIOMES[0].river).b;
    if (t === T.LAKE) return (BIOMES[b % 4].lake || BIOMES[0].lake).b;
    if (t === T.CHASM) return '#020203';
    return th.map;
  }
  function markers() {
    const out = [{ kind: 'camp', x: C.x, y: C.y, name: FORT.name }];
    for (const e of ENTRANCES) out.push({ kind: 'stairs', x: e.x, y: e.y, name: e.name });
    instances.forEach((d, i) => d.under && out.push({ kind: 'portal', x: d.x, y: d.y, name: d.name, i }));
    for (const l of lairs) out.push({ kind: 'boss', x: l.x, y: l.y, name: l.boss.name });
    out.push({ kind: 'shop', x: C.x + 7, y: C.y + 10, name: null });
    return out;
  }
  function mapPanel() {
    const lv = clampLevel(game.hero.level),
      list = BIOMES.map((b, k) => {
        const d = instances.find(x => x.under && x.biome === 6 + k),
          boss = BOSSES[k];
        return (
          '<section class="island-section"><h4>' +
          (k + 1) +
          '. ' +
          safeGearText(b.name) +
          '</h4><div class="muted">' +
          safeGearText(b.desc) +
          '</div>' +
          (d
            ? '<button class="entry map-place" data-map-instance="' +
              instances.indexOf(d) +
              '" data-action="mapFocus" data-x="' +
              Math.round(d.x) +
              '" data-y="' +
              Math.round(d.y) +
              '"><span class="map-dungeon">Donjon</span> <span class="map-place-name">' +
              safeGearText(d.name) +
              '</span> <b class="map-ilvl">à ton niveau</b></button>'
            : '') +
          '<div class="entry">⭐ Boss : ' +
          safeGearText(boss.name) +
          '</div></section>'
        );
      }).join('');
    return (
      '<div class="map-head"><h2>🗺️ Les Tréfonds de Canaan</h2><div class="map-here">📍 <span>Vous êtes ici</span> · <b>' +
      safeGearText(currentZoneName()) +
      '</b></div></div><div class="map-instance-layout"><div class="map-main">' +
      CANAAN_MAP.frame() +
      '</div><div class="map-instance-list">' +
      CANAAN_MAP.legend([
        ['me', 'Vous'],
        ['camp', 'Forteresse de Durgrim (zone sûre)'],
        ['portal', 'Donjons'],
        ['boss', 'Boss'],
        ['stairs', 'Entrées vers la surface'],
        ['shop', 'Marchand'],
        ['chest', 'Coffres révélés'],
        ['ally', 'Alliés']
      ]) +
      '<h3 class="map-list-title">🧭 Quatre biomes sous l’île</h3><p class="muted">Créatures et boss à ton niveau (' +
      lv +
      ')</p>' +
      list +
      '</div></div>'
    );
  }

  build();
  window.CANAAN_UNDER = Object.freeze({
    T,
    BIOMES,
    BOSSES,
    ENTRANCES,
    FORT,
    build,
    biomeAt,
    zoneId,
    zoneName,
    safe,
    blocked,
    setLayer,
    travel,
    use,
    talk,
    spawn,
    spawnBosses,
    spawnPoint,
    forgeSpot,
    nearStove,
    chests: () => CHESTS,
    nodes: () => nodes,
    spots: () => spots,
    fauna: () => fauna,
    dwarves: () => dwarves,
    dwarfArt: RENDER.dwarfArt,
    // Carrefour d'un biome, en pixels.
    hub: b => ({ x: (hubs[b].x + 0.5) * TS, y: (hubs[b].y + 0.5) * TS }),
    structures: () => structures,
    lairs: () => lairs,
    drawGround: RENDER.drawGround,
    draw: RENDER.draw,
    drawSurface: RENDER.drawSurface,
    ambience,
    themeKey,
    mapColor,
    markers,
    mapPanel,
    audit() {
      // Contrôle : forteresse, entrées, portails, repaires et coffres accessibles depuis la forteresse.
      const seen = new Uint8Array(MAPW * MAPH),
        q = [C.y * MAPW + C.x];
      seen[q[0]] = 1;
      for (let h = 0; h < q.length; h++) {
        const k = q[h],
          x = k % MAPW,
          y = (k - x) / MAPW;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const nk = (y + dy) * MAPW + x + dx;
          if (!seen[nk] && OPEN(at(x + dx, y + dy))) {
            seen[nk] = 1;
            q.push(nk);
          }
        }
      }
      const places = [
        ...ENTRANCES.map(e => ['entrée', e.name, e.x, e.y]),
        ...instances.filter(d => d.under).map(d => ['portail', d.name, d.x, d.y]),
        ...lairs.map(l => ['repaire', l.boss.name, l.x, l.y]),
        ...CHESTS.map(c => ['coffre', c.id, c.x, c.y])
      ];
      return {
        unreachable: places.filter(([, , x, y]) => !seen[y * MAPW + x]).map(([k, n]) => k + ' ' + n),
        open: seen.reduce((n, v) => n + v, 0)
      };
    }
  });
})();
