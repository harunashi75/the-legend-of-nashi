// Une seule grande île : six biomes en anneau autour d'un massif central infranchissable,
// le Camp de l'Aurore, une route continue dans l'ordre de progression et l'apparition des monstres.
(() => {
  const CENTER = Object.freeze({ x: 200, y: 200 });
  const RAD = Math.PI / 180;
  function polar(deg, r) {
    return {
      x: Math.round(CENTER.x + Math.cos(deg * RAD) * r),
      y: Math.round(CENTER.y + Math.sin(deg * RAD) * r)
    };
  }
  // Ordre de progression : chaque biome occupe un secteur de 60° centré sur son angle.
  // Les Plaines (départ) et la Forêt enchantée (fin) sont séparées par une crête rocheuse.
  const ZONES = [
    {
      name: 'Plaines verdoyantes',
      angle: 165,
      t: 1,
      mobs: ['Slime', 'Loup', 'Sanglier'],
      description: 'Prairies, fleurs, buissons et petits bosquets. La région de départ.'
    },
    {
      name: 'Forêt ancienne',
      angle: 225,
      t: 5,
      mobs: ['Araignée', 'Ours', 'Gobelin'],
      description: 'Grands arbres, sous-bois, champignons et clairières.'
    },
    {
      name: 'Marais brumeux',
      angle: 285,
      t: 11,
      mobs: ['Mante des roseaux', 'Basilic', 'Araignée venimeuse', 'Wisp'],
      description: 'Eau peu profonde, roseaux, arbres tordus et petits ponts en bois.'
    },
    {
      name: 'Forêt automnale',
      angle: 345,
      t: 16,
      mobs: ['Bandit', 'Corbeau spectral', 'Troll', 'Pilleur'],
      description: 'Arbres rouges, orangés et dorés, feuilles au sol et petits lacs.'
    },
    {
      name: 'Désert oublié',
      angle: 45,
      t: 3,
      mobs: ['Scorpion', 'Drake des dunes', 'Squelette', 'Minotaure'],
      description: 'Dunes, oasis, ruines et cactus.'
    },
    {
      name: 'Forêt enchantée',
      angle: 105,
      t: 17,
      mobs: ['Fée sauvage', 'Gardien astral', 'Drake astral', 'Ent corrompu'],
      description: 'Arbres lumineux, cristaux, plantes magiques et lacs scintillants.'
    }
  ].map(z => Object.freeze({ ...z, ...polar(z.angle, 112) }));
  const FIRST_SECTOR = ZONES[0].angle - 30;

  // Géométrie de l'île : angle déformé, rayon de côte et massif central.
  function warpedAngle(x, y) {
    const a = Math.atan2(y - CENTER.y, x - CENTER.x) / RAD;
    return a + (field(x, y, 41, 501) - 0.5) * 34 + (field(x, y, 15, 502) - 0.5) * 10;
  }
  function sectorOf(x, y) {
    const rel = (((warpedAngle(x, y) - FIRST_SECTOR) % 360) + 360) % 360;
    return { index: Math.min(5, Math.floor(rel / 60)), rel };
  }
  function coastRadius(x, y) {
    const a = Math.atan2(y - CENTER.y, x - CENTER.x);
    return (
      164 +
      7 * Math.sin(3 * a + 1) +
      5 * Math.cos(5 * a - 0.7) +
      2.5 * Math.sin(9 * a + 2) +
      (field(x, y, 23, 503) - 0.5) * 14
    );
  }
  function massifRadius(x, y) {
    const a = Math.atan2(y - CENTER.y, x - CENTER.x);
    return 33 + 5 * Math.sin(4 * a + 0.5) + 3 * Math.cos(7 * a) + (field(x, y, 9, 504) - 0.5) * 8;
  }
  // Biome d'une case : lu dans la carte des biomes générée, calculé hors de la carte.
  function regionAt(x, y) {
    const ix = Math.floor(x),
      iy = Math.floor(y);
    if (ix >= 0 && iy >= 0 && ix < MAPW && iy < MAPH) return ZONES[BIOME_MAP[iy * MAPW + ix]];
    return ZONES[sectorOf(x, y).index];
  }
  function currentZoneName() {
    if (game.world.instance?.arena) return CANAAN_ARENA_NAME;
    if (game.world.instance) return instances[game.world.instance.index].name;
    if (canaanUnder()) return CANAAN_UNDER.zoneName(P.x / TS, P.y / TS);
    const x = P.x / TS,
      y = P.y / TS;
    const room = canaanRoomAt(x, y);
    if (room) return room.name;
    const v = villages.find(v => Math.hypot(x - v.x, y - v.y) < v.r + 3);
    return v ? v.name : regionAt(x, y).name;
  }
  // Titre de région affiché en haut de l'écran lors des changements de zone.
  const regionBanner = document.createElement('div');
  regionBanner.id = 'regionBanner';
  document.body.appendChild(regionBanner);
  let previousZone = '';
  function updateZoneDisplay() {
    const name = currentZoneName();
    document.getElementById('zone').textContent = name;
    if (name !== previousZone) {
      if (previousZone && started) toast('📍 ' + name);
      previousZone = name;
    }
    regionBanner.textContent = previousZone;
  }
  function worldMobAt(x, y) {
    const list = regionAt(x, y).mobs;
    return MOB_TYPES.find(m => m.name === list[Math.floor(rnd() * list.length)]) || MOB_TYPES[0];
  }

  // Lieux fixes, en coordonnées polaires autour du centre de l'île.
  const PORTAL_SPOTS = [
    [150, 128],
    [212, 132],
    [240, 98],
    [285, 130],
    [328, 132],
    [358, 98],
    [32, 132],
    [60, 98],
    [92, 132],
    [118, 100]
  ];
  const BOSS_SPOTS = {
    fenrir: [182, 95],
    nocturne: [228, 150],
    leviathan: [268, 96],
    golem: [322, 96],
    colosse: [352, 140],
    ifrit: [42, 76],
    seraph: [22, 112],
    chronos: [108, 78]
  };
  const OASES = [
    [24, 146],
    [56, 136],
    [44, 84]
  ];
  // Refuges, ruines et tours : décor d'exploration, sans zone sûre.
  const PIXEL_PLACES = [
    { name: 'Ruines de la Couronne', type: 'ruins', at: [145, 150] },
    { name: 'Refuge du Vieux Chêne', type: 'camp', at: [205, 120] },
    { name: 'Refuge des Clairières', type: 'camp', at: [248, 150] },
    { name: 'Tour des Brumes', type: 'tower', at: [300, 150] },
    { name: 'Pierres des Anciens', type: 'ruins', at: [335, 118] },
    { name: 'Refuge de l’Oasis', type: 'camp', at: [28, 138] },
    { name: 'Camp des Dunes', type: 'camp', at: [52, 128] },
    { name: 'Ruines Oubliées', type: 'ruins', at: [18, 92] },
    { name: 'Ruines des Sables', type: 'ruins', at: [66, 118] },
    { name: 'Sanctuaire Oublié', type: 'tower', at: [82, 150] },
    // Refuges du marais (cabane sur pilotis), de l'automne (bardeaux roux) et de la Forêt enchantée (pierre lilas).
    { name: 'Refuge des Pilotis', type: 'camp', at: [274, 148] },
    { name: 'Refuge des Feuilles Rousses', type: 'camp', at: [340, 150] },
    { name: 'Refuge des Cristaux', type: 'camp', at: [99, 146] }
  ].map(p => ({ name: p.name, type: p.type, angle: p.at[0], radius: p.at[1], x: 0, y: 0 }));
  // Coffres secrets par biome : la Forêt ancienne en cache le plus.
  const CHEST_SHARE = [8, 20, 9, 10, 9, 9];

  const BRIDGE_TILES = new Set();
  let BIOME_MAP = new Uint8Array(MAPW * MAPH);
  const valid = (x, y) => x >= 3 && y >= 3 && x < MAPW - 3 && y < MAPH - 3;
  const pick = (list, k) => list[Math.floor(k * list.length) % list.length];
  // Décor de chaque biome : [densité, éléments].
  const DECOR = {
    1: [0.16, ['flower', 'flower', 'bush', 'flower', 'tree']],
    5: [0.55, ['bigtree', 'bigtree', 'tree', 'pine', 'mushroom', 'bush', 'bigtree']],
    11: [0.3, ['reed', 'twisted', 'reed', 'mushroom', 'bush', 'twisted']],
    15: [0.22, ['reed', 'lilypad', 'lilypad']],
    16: [0.42, ['autumn_red', 'autumn_orange', 'autumn_gold', 'leafpile', 'autumn_orange', 'bush']],
    3: [0.08, ['cactus', 'dune', 'rock', 'dune', 'cactus', 'deadwood']],
    10: [0.3, ['palm', 'bush', 'flower', 'palm']],
    17: [0.42, ['glowtree', 'glowtree', 'crystal', 'magicplant', 'magicplant', 'mushroom']],
    4: [0.12, ['peak', 'rock']]
  };
  function decorate(x, y, t) {
    const d = DECOR[t];
    game.world.decor[y][x] = d && hash(x, y, 19) < d[0] ? pick(d[1], hash(x, y, 20)) : null;
  }

  function terrain(x, y) {
    const dist = Math.hypot(x - CENTER.x, y - CENTER.y),
      coast = coastRadius(x, y),
      { index, rel } = sectorOf(x, y);
    BIOME_MAP[y * MAPW + x] = index;
    if (dist >= coast) return { t: 0, biome: index };
    if (dist < massifRadius(x, y)) return { t: 4, biome: index };
    // Crête entre la région de départ et la Forêt enchantée, du massif jusqu'à la mer.
    const ridge = Math.min(rel, 360 - rel) * RAD * dist;
    if (ridge < 3.2 + field(x, y, 7, 505) * 2.2) return { t: 4, biome: index };
    if (coast - dist < 2.6) return { t: index === 2 ? 11 : 3, biome: index };
    const lake = field(x, y, 17, 510 + index),
      detail = field(x, y, 9, 520 + index);
    let t = ZONES[index].t;
    if (index === 0) {
      if (lake > 0.87) t = 0;
    } else if (index === 1) {
      if (field(x, y, 15, 530) > 0.74) t = 1;
      else if (lake > 0.9) t = 0;
    } else if (index === 2) {
      const wet = field(x, y, 12, 531) * 0.7 + detail * 0.3;
      if (wet > 0.74) t = 0;
      else if (wet > 0.5) t = 15;
    } else if (index === 3) {
      if (lake > 0.82) t = 0;
    } else if (index === 5 && lake > 0.8) t = 18;
    return { t, biome: index };
  }

  // Tracé des chemins : lignes médianes Catmull-Rom, puis largeur mesurée par distance.
  function catmull(points, out) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[Math.max(0, i - 1)],
        b = points[i],
        d = points[i + 1],
        e = points[Math.min(points.length - 1, i + 2)];
      const n = Math.max(8, Math.ceil(Math.hypot(d[0] - b[0], d[1] - b[1]) * 6));
      for (let j = 0; j <= n; j++) {
        const t = j / n,
          t2 = t * t,
          t3 = t2 * t;
        out.push([
          0.5 *
            (2 * b[0] +
              (-a[0] + d[0]) * t +
              (2 * a[0] - 5 * b[0] + 4 * d[0] - e[0]) * t2 +
              (-a[0] + 3 * b[0] - 3 * d[0] + e[0]) * t3),
          0.5 *
            (2 * b[1] +
              (-a[1] + d[1]) * t +
              (2 * a[1] - 5 * b[1] + 4 * d[1] - e[1]) * t2 +
              (-a[1] + 3 * b[1] - 3 * d[1] + e[1]) * t3)
        ]);
      }
    }
    return out;
  }
  function paveLine(line) {
    for (const [fx, fy] of line) {
      // Chemins étroits dans le marais, routes de trois cases ailleurs.
      const half = BIOME_MAP[Math.round(fy) * MAPW + Math.round(fx)] === 2 ? 0.95 : 1.5;
      for (let y = Math.round(fy) - 2; y <= Math.round(fy) + 2; y++)
        for (let x = Math.round(fx) - 2; x <= Math.round(fx) + 2; x++) {
          if (!valid(x, y) || Math.hypot(x - fx, y - fy) > half || game.world.tiles[y][x] === 2) continue;
          // Sur l'eau, profonde ou non, la route devient un petit pont en bois.
          if ([0, 15, 18].includes(game.world.tiles[y][x])) BRIDGE_TILES.add(y * MAPW + x);
          game.world.tiles[y][x] = 2;
          game.world.decor[y][x] = null;
        }
    }
  }
  function walkableLand(x, y) {
    return (
      valid(x, y) && !SOLID.includes(game.world.tiles[y][x]) && game.world.tiles[y][x] !== 15 && !BRIDGE_TILES.has(y * MAPW + x)
    );
  }
  // Case de terre ferme la plus proche, dans le biome demandé.
  function nearestSpot(tx, ty, biome, accept = walkableLand) {
    for (let radius = 0; radius <= 24; radius++)
      for (let y = ty - radius; y <= ty + radius; y++)
        for (let x = tx - radius; x <= tx + radius; x++) {
          if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== radius) continue;
          if (accept(x, y) && BIOME_MAP[y * MAPW + x] === biome) return { x, y };
        }
    return { x: tx, y: ty };
  }
  function clearArea(cx, cy, r, tile) {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (!valid(x, y) || Math.hypot(x - cx, y - cy) > r + 0.4) continue;
        if (tile !== undefined && !BRIDGE_TILES.has(y * MAPW + x)) game.world.tiles[y][x] = tile;
        game.world.decor[y][x] = null;
      }
  }
  // Cases accessibles à pied depuis le camp.
  function reachableFrom(x0, y0) {
    const seen = new Uint8Array(MAPW * MAPH),
      queue = [y0 * MAPW + x0];
    seen[queue[0]] = 1;
    for (let head = 0; head < queue.length; head++) {
      const k = queue[head],
        x = k % MAPW,
        y = (k - x) / MAPW;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const xx = x + dx,
          yy = y + dy,
          nk = yy * MAPW + xx;
        if (valid(xx, yy) && !seen[nk] && !SOLID.includes(game.world.tiles[yy][xx])) {
          seen[nk] = 1;
          queue.push(nk);
        }
      }
    }
    return seen;
  }

  function newRegionWorld() {
    worldSeed = CANAAN_WORLD_SEED;
    game.world.tiles = Array.from({ length: MAPH }, () => Array(MAPW).fill(0));
    game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    BIOME_MAP = new Uint8Array(MAPW * MAPH);
    BRIDGE_TILES.clear();
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const { t } = terrain(x, y);
        game.world.tiles[y][x] = t;
        decorate(x, y, t);
      }
    // Bosquets des plaines et clairières fleuries de la Forêt ancienne.
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        if (game.world.tiles[y][x] !== 1) continue;
        const biome = BIOME_MAP[y * MAPW + x];
        if (biome === 0 && field(x, y, 8, 540) > 0.76 && hash(x, y, 21) < 0.5)
          game.world.decor[y][x] = hash(x, y, 22) < 0.8 ? 'tree' : 'bush';
        if (biome === 1)
          game.world.decor[y][x] = hash(x, y, 23) < 0.2 ? pick(['flower', 'mushroom'], hash(x, y, 24)) : null;
      }
    // Ruines du désert : colonnes de grès regroupées en anciens sites.
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++)
        if (game.world.tiles[y][x] === 3 && BIOME_MAP[y * MAPW + x] === 4 && field(x, y, 9, 524) > 0.8)
          game.world.decor[y][x] = hash(x, y, 25) < 0.45 ? 'ruin' : null;
    // Oasis du désert : point d'eau, herbe et palmiers.
    for (const [angle, radius] of OASES) {
      const o = polar(angle, radius);
      for (let y = o.y - 6; y <= o.y + 6; y++)
        for (let x = o.x - 6; x <= o.x + 6; x++) {
          const d = Math.hypot(x - o.x, y - o.y) + (field(x, y, 4, 550) - 0.5) * 1.6;
          if (!valid(x, y) || d > 5.6 || game.world.tiles[y][x] === 4) continue;
          game.world.tiles[y][x] = d < 2.3 ? 0 : 10;
          decorate(x, y, game.world.tiles[y][x]);
        }
    }
    // Forêts éclaircies : on retire une bonne part des grands arbres, et ceux qui restent ne se touchent jamais (au
    // moins une case libre entre deux arbres) : on circule entre eux, on passe devant et derrière.
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const d = game.world.decor[y][x];
        if (!CANAAN_BIG_TREES.has(d)) continue;
        const crowded = [[-1, -1], [0, -1], [1, -1], [-1, 0]].some(([dx, dy]) => CANAAN_BIG_TREES.has(game.world.decor[y + dy][x + dx]));
        if (crowded || hash(x, y, 61) > 0.42) game.world.decor[y][x] = hash(x, y, 62) < 0.25 && d !== 'palm' ? 'bush' : null;
      }
    // Camp de l'Aurore : clairière d'herbe, terre battue autour du feu.
    const camp = villages[0];
    clearArea(camp.x, camp.y, camp.r + 2, 1);
    clearArea(camp.x, camp.y, 3, 2);
    // Portails : terre ferme dans le biome de l'instance, posés sur le sol (décor dégagé autour, sans esplanade).
    instances.forEach((d, i) => {
      // Les donjons des Tréfonds ont leur portail sous l'île (underground.js).
      if (d.under) return;
      const target = polar(...PORTAL_SPOTS[i]),
        spot = nearestSpot(target.x, target.y, d.biome);
      d.x = spot.x;
      d.y = spot.y;
      clearArea(d.x, d.y, 2);
      const npc = game.world.npcs.find(n => n.type === 'portal' && n.instance === i);
      if (npc) {
        npc.x = d.x * TS;
        npc.y = d.y * TS;
      }
    });
    // Arène des Épreuves : à l'est du camp, ouverte à tous, reliée au camp par un chemin.
    {
      const spot = nearestSpot(camp.x + 14, camp.y - 3, BIOME_MAP[camp.y * MAPW + camp.x]);
      CANAAN_ARENA_PORTAL.x = spot.x;
      CANAAN_ARENA_PORTAL.y = spot.y;
      clearArea(spot.x, spot.y, 3);
      const npc = game.world.npcs.find(n => n.type === 'arena');
      if (npc) {
        npc.x = spot.x * TS;
        npc.y = spot.y * TS;
      }
      paveLine(
        catmull(
          [
            [camp.x + 3, camp.y + 1],
            [(camp.x + spot.x) / 2, spot.y + 2],
            [spot.x, spot.y + 2],
            [spot.x, spot.y]
          ],
          []
        )
      );
    }
    // Route principale : du camp à la Forêt enchantée, dans l'ordre de progression.
    const ring = [];
    for (let angle = ZONES[0].angle; angle <= ZONES[5].angle + 360; angle += 10) {
      const p = polar(angle, 116 + 7 * Math.sin(angle * 3 * RAD));
      ring.push([p.x, p.y]);
    }
    const main = catmull([[camp.x + 3, camp.y], [camp.x + 9, camp.y - 1], ...ring], []);
    paveLine(main);
    // Embranchements vers chaque portail, depuis le point le plus proche de la route.
    for (const d of instances) {
      if (d.under) continue;
      const near = main.reduce(
        (best, p) => {
          const dist = Math.hypot(p[0] - d.x, p[1] - d.y);
          return dist < best.dist ? { p, dist } : best;
        },
        { p: main[0], dist: Infinity }
      ).p;
      const mx = (near[0] + d.x) / 2 + (hash(d.x, d.y, 31) - 0.5) * 6,
        my = (near[1] + d.y) / 2 + (hash(d.y, d.x, 32) - 0.5) * 6;
      paveLine(catmull([near, [mx, my], [d.x, d.y + 2], [d.x, d.y]], []));
    }
    // Les placements suivants n'utilisent que des cases accessibles depuis le camp.
    const reach = reachableFrom(camp.x, camp.y);
    const reachable = (x, y) => walkableLand(x, y) && reach[y * MAPW + x] === 1 && !isSafe(x, y);
    for (const b of WORLD_BOSSES) {
      const target = polar(...BOSS_SPOTS[b.id]),
        spot = nearestSpot(target.x, target.y, b.biome, reachable);
      b.x = spot.x;
      b.y = spot.y;
      clearArea(b.x, b.y, 2);
    }
    for (const p of PIXEL_PLACES) {
      const target = polar(p.angle, p.radius),
        biome = sectorOf(target.x, target.y).index,
        spot = nearestSpot(target.x, target.y, biome, (x, y) => reachable(x, y) && game.world.tiles[y][x] !== 2);
      p.x = spot.x;
      p.y = spot.y;
      clearArea(p.x, p.y, 2);
    }
    // Coffres secrets : tirage reproductible, loin des portails, des boss et des autres coffres.
    const taken = [...instances.filter(d => !d.under), CANAAN_ARENA_PORTAL, ...WORLD_BOSSES, ...PIXEL_PLACES].map(p => [p.x, p.y]);
    let next = 0;
    CHEST_SHARE.forEach((count, biome) => {
      for (let n = 0; n < count && next < hiddenChestSpots.length; n++) {
        for (let tries = 0; tries < 400; tries++) {
          const angle = ZONES[biome].angle - 27 + worldRnd() * 54,
            radius = 52 + worldRnd() * 108,
            p = polar(angle, radius);
          if (!reachable(p.x, p.y) || game.world.tiles[p.y][p.x] === 2 || BIOME_MAP[p.y * MAPW + p.x] !== biome)
            continue;
          if (taken.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 7)) continue;
          Object.assign(hiddenChestSpots[next++], { x: p.x, y: p.y });
          taken.push([p.x, p.y]);
          break;
        }
      }
    });
    game.world.overworld = game.world.tiles;
    game.world.overdecor = game.world.decor;
    // Maison du joueur (house.js) : pièce et chaumière reposées sur une île régénérée.
    if (typeof canaanAfterWorld === 'function') canaanAfterWorld();
    canaanQuestWorld();
    // Ferme, verger, jardin et ruisseau du Camp de l'Aurore, autour des bâtiments et des lieux de quête.
    canaanCampLife.place();
  }
  // Contrôle : chaque lieu important doit être accessible à pied depuis le camp.
  function auditWorld() {
    const camp = villages[0],
      reach = reachableFrom(camp.x, camp.y);
    const places = [
      ...instances.filter(d => !d.under).map(d => ['portail', d.name, d.x, d.y]),
      ['portail', CANAAN_ARENA_NAME, CANAAN_ARENA_PORTAL.x, CANAAN_ARENA_PORTAL.y],
      ...WORLD_BOSSES.map(b => ['boss', b.name, b.x, b.y]),
      ...hiddenChestSpots.map(c => ['coffre', c.id, c.x, c.y]),
      ...PIXEL_PLACES.map(p => ['lieu', p.name, p.x, p.y])
    ];
    return {
      unreachable: places
        .filter(([, , x, y]) => !reach[y * MAPW + x])
        .map(([kind, name]) => kind + ' ' + name),
      biomes: ZONES.map((z, i) =>
        BIOME_MAP.reduce(
          (n, b, k) => n + (b === i && game.world.overworld[(k - (k % MAPW)) / MAPW][k % MAPW] !== 0 ? 1 : 0),
          0
        )
      )
    };
  }

  // Remplacement des spawns : créatures propres à leur biome, densité locale.
  function spawnMonsters(count = 100) {
    // Tréfonds : leurs créatures, au niveau du héros (underground.js).
    if (canaanUnder()) return CANAAN_UNDER.spawn(count);
    if (game.world.instance) {
      game.world.monsters.forEach(canaanSetupMob);
      return;
    }
    let cx = P.x / TS,
      cy = P.y / TS;
    for (let i = 0; i < count; i++) {
      let x,
        y,
        tries = 0;
      do {
        let a = rnd() * Math.PI * 2,
          rad = 12 + rnd() * 18;
        x = Math.round(cx + Math.cos(a) * rad);
        y = Math.round(cy + Math.sin(a) * rad);
        tries++;
      } while (
        (x < 5 ||
          y < 5 ||
          x >= MAPW - 5 ||
          y >= MAPH - 5 ||
          SOLID.includes(tileAt(x, y)) ||
          isSafe(x, y) ||
          canaanCampLife.farm(x, y) ||
          game.world.monsters.some(m => Math.hypot(m.x / TS - x, m.y / TS - y) < 3.5)) &&
        tries < 80
      );
      if (tries >= 80) continue;
      // Niveau tiré dans la plage de la zone ; PV et or en découlent.
      let type = worldMobAt(x, y),
        elite = rnd() < 0.07,
        level = zoneLevel(canaanZoneIndexAt(x, y), rnd),
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
        g: Math.round((8 + level * 1.6) * (elite ? 3 : 1)),
        mobColor: type.color,
        elite,
        _levelHp: true
      });
    }
  }
  function updateWorld() {
    game.world.clock++;
    if (game.world.clock % 420 === 0 && !game.world.instance) {
      game.world.monsters = game.world.monsters.filter(m => m.worldBoss || Math.hypot(m.x - P.x, m.y - P.y) < TS * 34);
      let nearby = game.world.monsters.filter(m => !m.worldBoss && Math.hypot(m.x - P.x, m.y - P.y) < TS * 25).length;
      if (nearby < 10) spawnMonsters(Math.min(3, 12 - nearby));
    }
    updateWorldBosses();
    if (game.world.instance && !game.world.instance.arena && game.world.instance.cleared && game.world.clock % 360 === 0)
      toast('Ouvre le coffre (E), puis retourne à l’entrée');
    if (
      game.world.instance &&
      !game.world.instance.arena &&
      game.world.clock % 120 === 0 &&
      game.world.monsters.length === 0 &&
      !game.world.instance.cleared
    )
      spawnInstanceBoss(game.world.instance.index);
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, {
    currentZoneName,
    regionBanner,
    updateZoneDisplay,
    ZONES,
    PIXEL_PLACES,
    regionAt,
    BRIDGE_TILES,
    newRegionWorld,
    // Outils de placement pour les lieux posés après la génération (quêtes) : mêmes règles que les portails.
    CANAAN_WORLD_TOOLS: Object.freeze({
      polar,
      nearestSpot,
      clearArea,
      walkableLand,
      reachableFrom,
      valid,
      biomeAt: (x, y) => BIOME_MAP[y * MAPW + x],
      taken: () => [...instances.filter(d => !d.under), CANAAN_ARENA_PORTAL, ...WORLD_BOSSES, ...PIXEL_PLACES, ...hiddenChestSpots].map(p => [p.x, p.y])
    }),
    spawnMonsters,
    updateWorld,
    CANAAN_WORLD_AUDIT: auditWorld
  });
})();
