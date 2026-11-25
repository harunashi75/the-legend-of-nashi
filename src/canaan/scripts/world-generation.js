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
      mobs: ['Araignée', 'Ours', 'Gobelin', 'Chauve-souris'],
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

  // Terre de l'Extension 1 (zone de niveau 60) : au sud-ouest, entre la côte et le coin de la carte, un
  // carré aux angles très arrondis séparé de l'île par un chenal peu profond, bordé d'une plage de sable, relié à la
  // Forêt enchantée par un isthme sablonneux. Ses cases sont les mêmes dans tous les builds ; sans l'extension, elle
  // est fermée et couverte de brume (extensions.js), et son nom reste caché.
  const VALLEY = Object.freeze({ x: 66, y: 334, half: 52, p: 3.2, channel: 7, rim: 3.4 });
  const VALLEY_ZONE = Object.freeze({
    name: 'Brumes impénétrables',
    angle: 135,
    t: 50,
    mobs: [],
    description: 'Une brume épaisse recouvre ces terres. Nul ne sait ce qu’elle cache.',
    ...(canaanExtension('vallee')?.zone || {}),
    locked: !canaanExtension('vallee'),
    ext: 'vallee',
    x: VALLEY.x,
    y: VALLEY.y
  });
  ZONES.push(VALLEY_ZONE);
  Object.freeze(ZONES);
  // Profondeur approchée (en cases) d'une case dans cette terre : positive dedans, avec un bord organique.
  function valleyDepth(x, y) {
    const se =
        Math.pow(Math.abs(x - VALLEY.x) / VALLEY.half, VALLEY.p) +
        Math.pow(Math.abs(y - VALLEY.y) / VALLEY.half, VALLEY.p),
      edge = (1 - Math.pow(se, 1 / VALLEY.p)) * VALLEY.half,
      sea = Math.hypot(x - CENTER.x, y - CENTER.y) - coastRadius(x, y) - VALLEY.channel;
    return Math.min(edge, sea) + (field(x, y, 7, 561) - 0.5) * 3;
  }
  // Chenal entre l'île et cette terre : somme des distances (en cases, sans bruit) d'une case de mer aux deux
  // rivages ; environ VALLEY.channel dans le chenal, beaucoup plus au large. Les hauts-fonds s'en servent pour
  // garder le chenal guéable d'un bout à l'autre (world-shallows.js).
  function valleyStrait(x, y) {
    const se =
        Math.pow(Math.abs(x - VALLEY.x) / VALLEY.half, VALLEY.p) +
        Math.pow(Math.abs(y - VALLEY.y) / VALLEY.half, VALLEY.p),
      outside = Math.max(0, (Math.pow(se, 1 / VALLEY.p) - 1) * VALLEY.half),
      off = Math.max(0, Math.hypot(x - CENTER.x, y - CENTER.y) - coastRadius(x, y));
    return outside + off;
  }
  // Isthme : de la Forêt enchantée (A, au bord de la terre ferme) au premier point bien à l'intérieur de la terre
  // (B), tout droit vers le large ; l'angle retenu est celui du plus court passage qui part de la Forêt enchantée.
  let isthmus = null;
  function valleyIsthmus() {
    if (isthmus) return isthmus;
    for (let angle = 100; angle <= 134; angle++) {
      const ux = Math.cos(angle * RAD),
        uy = Math.sin(angle * RAD);
      let A = null,
        B = null;
      for (let r = 140; r < 260 && !B; r += 0.5) {
        const x = CENTER.x + ux * r,
          y = CENTER.y + uy * r;
        if (!A && r > coastRadius(x, y) - 4) {
          if (sectorOf(x, y).index !== 5) break;
          A = { x, y };
        }
        if (A && valleyDepth(Math.round(x), Math.round(y)) > VALLEY.rim + 4) B = { x, y };
      }
      if (!A || !B) continue;
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      if (!isthmus || len < isthmus.len) isthmus = { A, B, len, angle };
    }
    return isthmus;
  }
  // Distance d'une case à l'axe de l'isthme, et position le long de l'axe (0 en A, 1 en B).
  function isthmusAt(x, y) {
    const { A, B, len } = valleyIsthmus(),
      ux = (B.x - A.x) / len,
      uy = (B.y - A.y) / len,
      t = ((x - A.x) * ux + (y - A.y) * uy) / len;
    if (t < -0.05 || t > 1.05) return null;
    return { d: Math.abs(-(x - A.x) * uy + (y - A.y) * ux), t };
  }
  // Terrain de la terre du sud-ouest et de son isthme, ou null hors d'eux.
  function valleyTerrain(x, y) {
    const depth = valleyDepth(x, y),
      neck = isthmusAt(x, y),
      half = 3.2 + (field(x, y, 5, 562) - 0.5) * 1.4;
    if (neck && neck.d < half && (depth > -VALLEY.channel - 4 || neck.t < 0.6)) {
      // Isthme : herbe au milieu (la route y passe), bords de sable ; côté île, la Forêt enchantée.
      const valley = depth > -2 || neck.t > 0.55;
      if (!valley && Math.hypot(x - CENTER.x, y - CENTER.y) < coastRadius(x, y) - 2.6) return null;
      return { t: neck.d < half - 1.3 ? (valley ? 50 : 17) : 3, biome: valley ? 6 : 5, valley };
    }
    if (depth <= 0) return null;
    // Plage de sable tout autour : la terre s'ouvre sur l'eau (pas de mur), le chenal reste trop profond au milieu.
    if (depth < VALLEY.rim + (field(x, y, 6, 563) - 0.5) * 2) return { t: 3, biome: 6, valley: true };
    // Collines rocheuses éparses et champs de blé ; herbe dorée ailleurs.
    if (depth > 8 && field(x, y, 6, 572) > 0.86) return { t: 4, biome: 6, valley: true };
    if (depth > 6 && field(x, y, 9, 571) > 0.7) return { t: 51, biome: 6, valley: true };
    return { t: 50, biome: 6, valley: true };
  }

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
    const x = P.x / TS,
      y = P.y / TS;
    const room = canaanRoomAt(x, y);
    if (room) return room.name;
    if (canaanUnder()) return CANAAN_UNDER.zoneName(x, y);
    if (inCity(Math.floor(x), Math.floor(y))) return 'Sylvaëlle, la Cité des Elfes';
    if (canaanInCamp(x, y, 1)) return CANAAN_CAMP.name;
    // Territoire d'une espèce (mob-lairs.js) : sous-zone, comme dans un MMO.
    return canaanLairAt(x, y)?.name || regionAt(x, y).name;
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
  // Région « parente » d'une zone, pour les systèmes qui ne connaissent que les six biomes de l'île (poissons,
  // herbes, minerais, trésors, gibier, musique, chaussée) : la terre du sud-ouest prend ceux de la Forêt enchantée.
  function zoneKin(index) {
    return index === 6 ? 5 : index;
  }
  function surfaceZoneAt(x, y) {
    return zoneKin(Math.max(0, ZONES.indexOf(regionAt(x, y))));
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
    4: [0.12, ['peak', 'rock']],
    // Terre du sud-ouest : herbe dorée (arbres aux feuilles d'or, fleurs, buissons) et champs de blé.
    50: [0.15, ['goldtree', 'flower', 'bush', 'goldtree', 'flower', 'goldtree']],
    51: [0.06, ['wheat', 'wheat', 'flower']]
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
    // Terre du sud-ouest et son isthme (Extension 1).
    if (dist > 150) {
      const v = valleyTerrain(x, y);
      if (v) {
        BIOME_MAP[y * MAPW + x] = v.biome;
        return v;
      }
    }
    if (dist >= coast) return { t: 0, biome: index };
    // Cité elfique de Sylvaëlle, au cœur de l'île (à la place de l'ancien massif) : herbe, ceinte d'une palissade de
    // troncs ; la Forêt enchantée la borde (niveau 60).
    const mr = massifRadius(x, y);
    if (dist < mr - 0.9) {
      BIOME_MAP[y * MAPW + x] = 5;
      return { t: 1, biome: 5, city: true };
    }
    // Sol sous la palissade : celui du biome (le sable près de la mer).
    const ground = coast - dist < 2.6 ? (index === 2 ? 11 : 3) : ZONES[index].t;
    if (dist < mr + 0.5) return { t: CANAAN_WOOD_TILE, biome: index, wall: true, ground };
    // Palissade entre la région de départ et la Forêt enchantée, de la cité jusqu'à la mer (ancienne crête).
    const ridge = Math.min(rel, 360 - rel) * RAD * dist;
    if (ridge < 1.25) return { t: CANAAN_WOOD_TILE, biome: index, wall: true, ground };
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
          // Jamais à travers la palissade (ni la cité elfique, qui a ses propres rues).
          if (
            !valid(x, y) ||
            Math.hypot(x - fx, y - fy) > half ||
            game.world.tiles[y][x] === 2 ||
            game.world.tiles[y][x] === CANAAN_WOOD_TILE
          )
            continue;
          // Sur l'eau, profonde ou non, la route devient un petit pont en bois.
          if ([0, 15, 18].includes(game.world.tiles[y][x])) BRIDGE_TILES.add(y * MAPW + x);
          game.world.tiles[y][x] = 2;
          game.world.decor[y][x] = null;
        }
    }
  }
  function walkableLand(x, y) {
    return (
      valid(x, y) &&
      !SOLID.includes(game.world.tiles[y][x]) &&
      game.world.tiles[y][x] !== 15 &&
      !BRIDGE_TILES.has(y * MAPW + x) &&
      !inCity(x, y)
    );
  }
  // Intérieur de la cité elfique (dans la palissade) : rien d'autre ne s'y pose.
  function inCity(x, y) {
    return Math.hypot(x - CENTER.x, y - CENTER.y) < massifRadius(x, y) - 0.9;
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
        // La palissade de troncs reste intacte (ses troncs sont son décor).
        if (
          !valid(x, y) ||
          Math.hypot(x - cx, y - cy) > r + 0.4 ||
          game.world.tiles[y][x] === CANAAN_WOOD_TILE
        )
          continue;
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

  // Terre du sud-ouest : masque des cases fermées sans l'extension (extensions.js), arbres dorés espacés.
  function valleyLand() {
    canaanExtLandMask = new Uint8Array(MAPW * MAPH);
    CANAAN_EXT_LANDS.length = 0;
    let x0 = MAPW,
      y0 = MAPH,
      x1 = 0,
      y1 = 0;
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++)
        if (BIOME_MAP[y * MAPW + x] === 6) {
          canaanExtLandMask[y * MAPW + x] = 1;
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    const { A, B } = valleyIsthmus();
    CANAAN_EXT_LANDS.push(
      Object.freeze({
        ext: 'vallee',
        zone: VALLEY_ZONE,
        x: VALLEY.x,
        y: VALLEY.y,
        box: Object.freeze({ x0, y0, x1, y1 }),
        // Isthme : du bord de la Forêt enchantée (from) à l'entrée de la terre (to), en cases.
        pass: Object.freeze({
          from: Object.freeze({ x: Math.round(A.x), y: Math.round(A.y) }),
          to: Object.freeze({ x: Math.round(B.x), y: Math.round(B.y) })
        })
      })
    );
    // Collines rocheuses : les rochers trop petits (moins de deux voisins de roche) redeviennent de l'herbe dorée ; le
    // lissage des bords (world-blend.js) les effacerait presque, et ils bloqueraient sans se voir.
    for (let pass = 0; pass < 2; pass++)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          if (game.world.tiles[y][x] !== 4 || !canaanExtLandMask[y * MAPW + x]) continue;
          const n = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ].filter(([dx, dy]) => game.world.tiles[y + dy][x + dx] === 4).length;
          if (n < 2) {
            game.world.tiles[y][x] = 50;
            game.world.decor[y][x] = null;
          }
        }
    // Décor sur la roche : seulement loin du bord inférieur (jamais posé sur la face de la falaise).
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        if (
          game.world.tiles[y][x] === 4 &&
          canaanExtLandMask[y * MAPW + x] &&
          (game.world.tiles[y + 1][x] !== 4 || game.world.tiles[y + 2][x] !== 4)
        )
          game.world.decor[y][x] = null;
    // Plage de la vallée et bords de l'isthme : ni cactus ni bois mort du désert, quelques galets.
    for (let y = y0 - 8; y <= y1 + 8; y++)
      for (let x = x0 - 8; x <= x1 + 8; x++) {
        if (!valid(x, y) || game.world.tiles[y][x] !== 3) continue;
        if (!canaanExtLandMask[y * MAPW + x] && !(isthmusAt(x, y)?.d < 5)) continue;
        game.world.decor[y][x] = hash(x, y, 64) < 0.03 ? 'rock' : null;
      }
    // Arbres aux feuilles d'or : jamais collés l'un à l'autre, jamais sur l'isthme.
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (game.world.decor[y][x] !== 'goldtree') continue;
        const crowded = [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [-2, 0],
          [0, -2]
        ].some(([dx, dy]) => CANAAN_BIG_TREES.has(game.world.decor[y + dy][x + dx]));
        if (crowded || isthmusAt(x, y)?.d < 5)
          game.world.decor[y][x] = hash(x, y, 63) < 0.4 ? 'flower' : null;
      }
  }
  // Route de la Forêt enchantée jusqu'à l'isthme : de la route principale au bout de l'isthme.
  function valleyRoad(main) {
    const { A, B } = valleyIsthmus(),
      near = main.reduce(
        (best, p) => {
          const dist = Math.hypot(p[0] - A.x, p[1] - A.y);
          return dist < best.dist ? { p, dist } : best;
        },
        { p: main[0], dist: Infinity }
      ).p,
      mx = (near[0] + A.x) / 2 + (hash(Math.round(A.x), Math.round(A.y), 33) - 0.5) * 8,
      my = (near[1] + A.y) / 2 + (hash(Math.round(A.y), Math.round(A.x), 34) - 0.5) * 8;
    paveLine(
      catmull(
        [near, [mx, my], [A.x, A.y], [(A.x + B.x) / 2, (A.y + B.y) / 2], [B.x, B.y]].map(([x, y]) => [x, y]),
        []
      )
    );
  }
  function newRegionWorld() {
    worldSeed = CANAAN_WORLD_SEED;
    game.world.tiles = Array.from({ length: MAPH }, () => Array(MAPW).fill(0));
    game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    BIOME_MAP = new Uint8Array(MAPW * MAPH);
    BRIDGE_TILES.clear();
    CANAAN_WOOD_GROUND.clear();
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        const { t, wall, ground } = terrain(x, y);
        game.world.tiles[y][x] = t;
        if (wall) {
          // Palissade : trois dessins de troncs en alternance, sur le sol du biome.
          CANAAN_WOOD_GROUND.set(y * MAPW + x, ground);
          game.world.decor[y][x] = ['palisade', 'palisade2', 'palisade3'][Math.floor(hash(x, y, 77) * 3)];
        } else decorate(x, y, t);
      }
    // Palissade entre les Plaines et la Forêt enchantée sans trou : là où une case des Plaines touche une case de la
    // Forêt enchantée (terre ferme des deux côtés, hors de la cité), elle devient un tronc.
    const wall = (x, y) => {
      CANAAN_WOOD_GROUND.set(y * MAPW + x, game.world.tiles[y][x]);
      game.world.tiles[y][x] = CANAAN_WOOD_TILE;
      game.world.decor[y][x] = ['palisade', 'palisade2', 'palisade3'][Math.floor(hash(x, y, 77) * 3)];
    };
    for (let y = 3; y < MAPH - 3; y++)
      for (let x = 3; x < MAPW - 3; x++) {
        if (BIOME_MAP[y * MAPW + x] !== 0 || SOLID.includes(game.world.tiles[y][x]) || inCity(x, y)) continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ])
          if (
            BIOME_MAP[(y + dy) * MAPW + x + dx] === 5 &&
            !SOLID.includes(game.world.tiles[y + dy][x + dx]) &&
            !inCity(x + dx, y + dy)
          ) {
            wall(x, y);
            break;
          }
      }
    // Palissade sans trou : toute case hors de la cité qui touche la cité devient un tronc.
    for (let y = CENTER.y - 50; y <= CENTER.y + 50; y++)
      for (let x = CENTER.x - 50; x <= CENTER.x + 50; x++) {
        if (!inCity(x, y)) continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const nx = x + dx,
            ny = y + dy;
          if (inCity(nx, ny) || game.world.tiles[ny][nx] === CANAAN_WOOD_TILE) continue;
          CANAAN_WOOD_GROUND.set(
            ny * MAPW + nx,
            game.world.tiles[ny][nx] === 4 ? 1 : game.world.tiles[ny][nx]
          );
          game.world.tiles[ny][nx] = CANAAN_WOOD_TILE;
          game.world.decor[ny][nx] = ['palisade', 'palisade2', 'palisade3'][Math.floor(hash(nx, ny, 77) * 3)];
        }
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
        const crowded = [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0]
        ].some(([dx, dy]) => CANAAN_BIG_TREES.has(game.world.decor[y + dy][x + dx]));
        if (crowded || hash(x, y, 61) > 0.42)
          game.world.decor[y][x] = hash(x, y, 62) < 0.25 && d !== 'palm' ? 'bush' : null;
      }
    valleyLand();
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
      // À droite de la grande route nord-sud du camp, sans la couvrir.
      const spot = nearestSpot(camp.x + 17, camp.y - 3, BIOME_MAP[camp.y * MAPW + camp.x]);
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
    valleyRoad(main);
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
      // Boss d'une extension : placé par son extension (CANAAN_EXT.afterWorld).
      if (!BOSS_SPOTS[b.id]) continue;
      const target = polar(...BOSS_SPOTS[b.id]),
        spot = nearestSpot(target.x, target.y, b.biome, reachable);
      b.x = spot.x;
      b.y = spot.y;
      clearArea(b.x, b.y, 2);
    }
    for (const p of PIXEL_PLACES) {
      const target = polar(p.angle, p.radius),
        biome = sectorOf(target.x, target.y).index,
        spot = nearestSpot(
          target.x,
          target.y,
          biome,
          (x, y) => reachable(x, y) && game.world.tiles[y][x] !== 2
        );
      p.x = spot.x;
      p.y = spot.y;
      clearArea(p.x, p.y, 2);
    }
    // Coffres secrets : tirage reproductible, loin des portails, des boss et des autres coffres.
    const taken = [
      ...instances.filter(d => !d.under),
      CANAAN_ARENA_PORTAL,
      ...WORLD_BOSSES,
      ...PIXEL_PLACES
    ].map(p => [p.x, p.y]);
    let next = 0;
    CHEST_SHARE.forEach((count, biome) => {
      for (let n = 0; n < count && next < hiddenChestSpots.length; n++) {
        for (let tries = 0; tries < 400; tries++) {
          const angle = ZONES[biome].angle - 27 + worldRnd() * 54,
            radius = 52 + worldRnd() * 108,
            p = polar(angle, radius);
          if (
            !reachable(p.x, p.y) ||
            game.world.tiles[p.y][p.x] === 2 ||
            BIOME_MAP[p.y * MAPW + p.x] !== biome
          )
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
    cityLayout();
    // Extensions présentes : leurs lieux, dans leurs terres déjà générées.
    CANAAN_EXT.afterWorld();
    // Habitats des créatures (mob-lairs.js), en dernier : à l'écart de tout ce qui est déjà posé. Au tout premier
    // passage, le module n'est pas encore chargé : il se pose lui-même à son chargement, après les autres lieux.
    canaanLairsWorld();
  }
  // Habitats des créatures : sur la terre ferme accessible depuis le camp, hors route, à l'écart du camp, des lieux
  // de l'île, des lieux des quêtes, des bâtiments, des entrées des Tréfonds et des lieux des extensions.
  function placeLairs() {
    const camp = villages[0],
      reach = reachableFrom(camp.x, camp.y),
      taken = [...instances.filter(d => !d.under), CANAAN_ARENA_PORTAL, ...WORLD_BOSSES, ...PIXEL_PLACES];
    CANAAN_LAIRS.place({
      center: CENTER,
      zones: ZONES.map((z, index) => ({
        index,
        mobs: z.mobs,
        lairs: z.lairs,
        angle: z.angle,
        x: z.x,
        y: z.y,
        ring: index < 6
      })).filter(z => z.mobs.length && !ZONES[z.index].locked),
      biomeAt: (x, y) => (valid(x, y) ? BIOME_MAP[y * MAPW + x] : -1),
      ok: (x, y) =>
        walkableLand(x, y) &&
        reach[y * MAPW + x] === 1 &&
        !isSafe(x, y) &&
        game.world.tiles[y][x] !== 2 &&
        !canaanCampLife.farm(x, y),
      land: (x, y) => walkableLand(x, y) && game.world.tiles[y][x] !== 2 && !isSafe(x, y),
      soil: (x, y) => valid(x, y) && (walkableLand(x, y) || game.world.tiles[y][x] === 15),
      avoid: [
        { x: camp.x, y: camp.y, r: 26 },
        ...taken.map(p => ({ x: p.x, y: p.y, r: 9 })),
        ...hiddenChestSpots.map(c => ({ x: c.x, y: c.y, r: 4 })),
        ...Object.values(CANAAN_QUESTS.sites())
          .filter(s => !s.under)
          .map(s => ({ x: s.x, y: s.y, r: (s.r || 4) + 6 })),
        ...CANAAN_HOUSE.buildings().map(b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 9 })),
        ...CANAAN_UNDER.ENTRANCES.map(e => ({ x: e.x, y: e.y, r: 7 })),
        ...CANAAN_EXT.markers().map(m => ({ x: m.x, y: m.y, r: 10 }))
      ]
    });
  }
  // ---------------------------------------------------------------- Cité elfique de Sylvaëlle
  // Plan de la cité, dans la palissade : porte cachée au sud-ouest (derrière le lac), place et fontaine de lune au
  // centre, rues de marbre (cases de route, peintes en dalles blanches par world-roads.js), anneau de rues, bâtiments
  // elfiques, Grand Arbre au nord-ouest, étang, arbres et fleurs. Les emprises (bâtiments, arbre, fontaine) sont des cases
  // de palissade sans dessin : elles bloquent, et canaan-elven-city dessine ce qu'il y a dessus.
  function cityLayout() {
    const T = game.world.tiles,
      D = game.world.decor,
      C = CENTER,
      at = (deg, r) => ({
        x: Math.round(C.x + Math.cos(deg * RAD) * r),
        y: Math.round(C.y + Math.sin(deg * RAD) * r)
      }),
      solid = (x, y, w, h) => {
        for (let yy = y; yy < y + h; yy++)
          for (let xx = x; xx < x + w; xx++)
            if (inCity(xx, yy)) {
              T[yy][xx] = CANAAN_WOOD_TILE;
              CANAAN_WOOD_GROUND.set(yy * MAPW + xx, 1);
              D[yy][xx] = null;
            }
      },
      street = pts => {
        for (const [fx, fy] of catmull(pts, []))
          for (let y = Math.round(fy) - 2; y <= Math.round(fy) + 2; y++)
            for (let x = Math.round(fx) - 2; x <= Math.round(fx) + 2; x++)
              if (inCity(x, y) && Math.hypot(x - fx, y - fy) <= 1.05 && T[y][x] !== CANAAN_WOOD_TILE) {
                T[y][x] = 2;
                D[y][x] = null;
              }
      };
    // Sol de la cité : herbe dégagée.
    for (let y = C.y - 45; y <= C.y + 45; y++)
      for (let x = C.x - 45; x <= C.x + 45; x++) if (inCity(x, y)) D[y][x] = null;
    // Porte : sur la palissade du côté de la Forêt enchantée, près du lac ; dehors, de la terre ferme accessible.
    const reach = reachableFrom(villages[0].x, villages[0].y);
    let gate = null;
    for (let k = 0; k <= 30 && !gate; k++)
      for (const deg of [124 + k, 124 - k]) {
        let r = 10;
        while (r < 50 && inCity(at(deg, r).x, at(deg, r).y)) r += 0.5;
        const g = at(deg, r),
          out = at(deg, r + 3),
          inn = at(deg, r - 3);
        if (T[g.y][g.x] !== CANAAN_WOOD_TILE || !inCity(inn.x, inn.y)) continue;
        if (!walkableLand(out.x, out.y) || reach[out.y * MAPW + out.x] !== 1) continue;
        gate = { x: g.x, y: g.y, deg, out, in: inn };
        break;
      }
    if (!gate) gate = { x: at(124, 34).x, y: at(124, 34).y, deg: 124, out: at(124, 37), in: at(124, 30) };
    // Ouverture de trois cases, fermée par la porte (case de palissade sans dessin) ; dégagée de part et d'autre.
    const gateCells = [];
    for (let y = gate.y - 2; y <= gate.y + 2; y++)
      for (let x = gate.x - 2; x <= gate.x + 2; x++)
        if (T[y][x] === CANAAN_WOOD_TILE && Math.hypot(x - gate.x, y - gate.y) <= 1.6) {
          D[y][x] = null;
          gateCells.push([x, y]);
        }
    for (const p of [gate.out, gate.in]) clearArea(p.x, p.y, 2);
    // Place centrale et fontaine de lune.
    const plaza = { x: C.x, y: C.y, r: 5 };
    for (let y = C.y - 6; y <= C.y + 6; y++)
      for (let x = C.x - 6; x <= C.x + 6; x++)
        if (Math.hypot(x - C.x, y - C.y) <= plaza.r + 0.4) {
          T[y][x] = 2;
          D[y][x] = null;
        }
    const well = { x: C.x - 1, y: C.y - 1, w: 3, h: 3 };
    // Rues : de la porte à la place, puis une allée vers chaque bâtiment et vers le Grand Arbre (le reste est herbe).
    street([
      [gate.in.x, gate.in.y],
      [(gate.in.x + C.x) / 2 + 2, (gate.in.y + C.y) / 2],
      [C.x, C.y + 4]
    ]);
    // Grand Arbre au nord-ouest : tronc (emprise) et clairière autour (posé avant les bâtiments, qui l'évitent).
    const tp = at(205, 17),
      tree = { x: tp.x, y: tp.y, name: 'Ylvarë, l’Arbre-Ancien' };
    // Emprises : rectangles déjà pris (bâtiments, Grand Arbre, place), avec une marge.
    const taken = [
      { x: tree.x - 6, y: tree.y - 9, w: 13, h: 13 },
      { x: C.x - 7, y: C.y - 7, w: 15, h: 15 }
    ];
    const overlaps = (r, m) =>
      taken.some(
        o => r.x - m < o.x + o.w && r.x + r.w + m > o.x && r.y - m < o.y + o.h && r.y + r.h + m > o.y
      );
    const inside = (r, m) => {
      for (let y = r.y - m; y < r.y + r.h + m; y++)
        for (let x = r.x - m; x < r.x + r.w + m; x++) if (!inCity(x, y)) return false;
      return true;
    };
    // Place le rectangle le plus près possible de l'angle et du rayon voulus, sans chevaucher.
    const placeRect = (w, h, deg, r, m = 2, ok = () => true) => {
      for (let k = 0; k <= 16; k++)
        for (const dd of k ? [deg + k * 5, deg - k * 5] : [deg])
          for (const rr of [r, r - 1, r + 1, r - 2, r - 3, r + 2]) {
            const p = at(dd, rr),
              rect = { x: p.x - Math.floor(w / 2), y: p.y - Math.floor(h / 2), w, h };
            if (inside(rect, m) && !overlaps(rect, m) && ok(rect)) {
              taken.push(rect);
              return rect;
            }
          }
      return null;
    };
    // Bâtiments : la demeure de la Reine au nord, armurerie et atelier près de la porte, taverne, maisons, tour, temple.
    const SPOTS = [
      ['elfe_palais', 270, 17, 'Demeure de la Reine Elwë', 9, 4],
      ['elfe_armurerie', 68, 15, 'Armurerie de Sylvaëlle', 5, 3],
      ['elfe_couture', 160, 15, 'Atelier de la Tisseuse', 5, 3],
      ['elfe_taverne', 20, 16, 'Taverne de la Feuille d’Or', 5, 3],
      ['elfe_tour', 320, 19, 'Tour des Étoiles', 5, 3],
      ['elfe_temple', 345, 15, 'Temple de la Lune', 5, 3],
      ['elfe_maison', 45, 19, 'Maison des Feuillages', 5, 3],
      ['elfe_racines', 240, 22, 'Maison des Racines', 5, 3]
    ];
    const buildings = [];
    for (const [id, deg, r, name, w, h] of SPOTS) {
      const rect = placeRect(w, h, deg, r, 2);
      if (!rect) continue;
      const b = { id, name, ...rect };
      solid(b.x, b.y, b.w, b.h);
      buildings.push(b);
    }
    for (let y = tree.y - 5; y <= tree.y + 3; y++)
      for (let x = tree.x - 5; x <= tree.x + 5; x++) if (inCity(x, y) && T[y][x] !== 2) D[y][x] = null;
    solid(tree.x - 2, tree.y - 1, 5, 2);
    // Allée de chaque porte jusqu'à la rue la plus proche : chemin le plus court qui contourne les bâtiments (à une case
    // des murs), lissé en courbe ; plus d'allée coupée net ni d'allée qui traverse un bâtiment.
    const walls = [...buildings, { x: tree.x - 2, y: tree.y - 1, w: 5, h: 2 }],
      nearWall = (x, y) => walls.some(o => x >= o.x - 1 && x <= o.x + o.w && y >= o.y - 1 && y <= o.y + o.h);
    const alley = (sx, sy) => {
      const prev = new Map(),
        key = (x, y) => y * MAPW + x,
        q = [[sx, sy]];
      prev.set(key(sx, sy), -1);
      let end = null;
      for (let i = 0; i < q.length && !end; i++) {
        const [x, y] = q[i];
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1]
        ]) {
          const nx = x + dx,
            ny = y + dy,
            k = key(nx, ny);
          if (
            prev.has(k) ||
            !inCity(nx, ny) ||
            T[ny][nx] === CANAAN_WOOD_TILE ||
            (nearWall(nx, ny) && Math.hypot(nx - sx, ny - sy) > 1.5)
          )
            continue;
          if (dx && dy && (T[y][nx] === CANAAN_WOOD_TILE || T[ny][x] === CANAAN_WOOD_TILE)) continue;
          prev.set(k, key(x, y));
          if (T[ny][nx] === 2 && Math.hypot(nx - sx, ny - sy) > 2.5) {
            end = k;
            break;
          }
          q.push([nx, ny]);
        }
      }
      if (end === null) return;
      const path = [];
      for (let k = end; k !== -1; k = prev.get(k)) path.unshift([k % MAPW, Math.floor(k / MAPW)]);
      const pts = path.filter((_, i) => i % 3 === 0 || i === path.length - 1);
      street(pts.length > 1 ? pts : [path[0], path[0]]);
    };
    for (const b of buildings) {
      const dx = b.x + Math.floor(b.w / 2);
      street([
        [dx, b.y + b.h],
        [dx, b.y + b.h + 1]
      ]);
      alley(dx, b.y + b.h + 1);
    }
    street([
      [tree.x, tree.y + 1],
      [tree.x, tree.y + 2]
    ]);
    alley(tree.x, tree.y + 2);
    // La fontaine-arbre reste posée sur les dalles de la place : elle bloque par canaan-elven-city (CANAAN_CITY.blocked).
    // Étangs aux cygnes (dessinés et bloquants : canaan-elven-city), puis jardins, statues, nichoirs, bancs, arches.
    const props = [];
    // Un étang n'empiète sur aucune allée (ni sur une case autour).
    const dry = r => {
      for (let y = r.y - 1; y <= r.y + r.h; y++)
        for (let x = r.x - 1; x <= r.x + r.w; x++)
          if (T[y][x] === 2 || T[y][x] === CANAAN_WOOD_TILE) return false;
      return true;
    };
    for (const [deg, r] of [
      [120, 13],
      [300, 10]
    ]) {
      const rect = placeRect(5, 3, deg, r, 1, dry);
      if (rect) props.push({ kind: 'pond', ...rect });
    }
    const near = (x, y, d) =>
      props.some(p => Math.hypot(p.x + p.w / 2 - x, p.y + p.h / 2 - y) < d) ||
      buildings.some(b => x >= b.x - 2 && x <= b.x + b.w + 1 && y >= b.y - 3 && y <= b.y + b.h + 2);
    const grass = (x, y, w, h) => {
      for (let yy = y - 1; yy <= y + h; yy++)
        for (let xx = x - 1; xx <= x + w; xx++) if (!inCity(xx, yy) || T[yy][xx] !== 1) return false;
      return true;
    };
    const GARDEN = [
      'flowerbed',
      'statue',
      'birdhouses',
      'flowerbed',
      'birdbath',
      'bench',
      'topiary',
      'stagstatue',
      'flowerbed',
      'bench',
      'topiary',
      'statue'
    ];
    let g = 0;
    for (let k = 0; k < 900 && g < 30; k++) {
      const a = hash(k, 3, 91) * 360,
        r = 7 + hash(k, 4, 91) * 18,
        p = at(a, r),
        kind = GARDEN[g % GARDEN.length],
        w = kind === 'flowerbed' || kind === 'stagstatue' || kind === 'bench' ? 2 : 1;
      if (!grass(p.x, p.y, w, 1) || near(p.x, p.y, 4) || Math.hypot(p.x - tree.x, p.y - tree.y) < 7) continue;
      props.push({ kind, x: p.x, y: p.y, w, h: 1 });
      g++;
    }
    // Arches fleuries au-dessus des allées, près de la place.
    for (let k = 0, n = 0; k < 400 && n < 4; k++) {
      const p = at(hash(k, 5, 92) * 360, 8 + hash(k, 6, 92) * 3);
      if (T[p.y][p.x] !== 2 || props.some(o => Math.hypot(o.x - p.x, o.y - p.y) < 6)) continue;
      props.push({ kind: 'arch', x: p.x, y: p.y, w: 1, h: 1 });
      n++;
    }
    for (const p of props)
      if (p.kind !== 'arch')
        for (let y = p.y - 1; y <= p.y + p.h; y++)
          for (let x = p.x - 1; x <= p.x + p.w; x++) if (D[y]?.[x]) D[y][x] = null;
    // Arbres elfiques (bouleaux d'argent, cerisiers en fleurs, cyprès, saules), fleurs, à l'écart du reste.
    const free = (x, y) => inCity(x, y) && T[y][x] === 1 && !D[y][x];
    const ELFTREES = ['elftree', 'blossom', 'elftree', 'elfcypress', 'elfwillow', 'blossom', 'elfcypress'];
    for (let y = C.y - 45; y <= C.y + 45; y++)
      for (let x = C.x - 45; x <= C.x + 45; x++) {
        if (!free(x, y)) continue;
        let close = false;
        for (let j = -1; j <= 1 && !close; j++)
          for (let i = -1; i <= 1; i++) if (T[y + j]?.[x + i] !== 1) close = true;
        if (close) continue;
        const h = hash(x, y, 83);
        if (
          h < 0.05 &&
          !near(x, y, 3) &&
          Math.hypot(x - tree.x, y - tree.y) > 7 &&
          ![-2, -1, 1, 2].some(d => CANAAN_BIG_TREES.has(D[y][x + d]) || CANAAN_BIG_TREES.has(D[y + d]?.[x]))
        )
          D[y][x] = ELFTREES[Math.floor(hash(x, y, 84) * ELFTREES.length)];
        else if (h < 0.14 && !near(x, y, 2))
          D[y][x] = ['flower', 'magicplant', 'flower', 'bush', 'flower'][Math.floor(hash(x, y, 85) * 5)];
      }
    // Lanternes de cristal le long des allées (une case à côté de la route).
    const lamps = [];
    for (let y = C.y - 45; y <= C.y + 45; y++)
      for (let x = C.x - 45; x <= C.x + 45; x++)
        if (
          inCity(x, y) &&
          T[y][x] === 1 &&
          !D[y][x] &&
          T[y][x + 1] === 2 &&
          (x * 7 + y * 3) % 7 === 0 &&
          !lamps.some(l => Math.hypot(l.x - x, l.y - y) < 4) &&
          !near(x, y, 2)
        )
          lamps.push({ x, y });
    const dir = { x: Math.cos(gate.deg * RAD), y: Math.sin(gate.deg * RAD) };
    window.CANAAN_CITY_PLAN = {
      name: 'Sylvaëlle, la Cité des Elfes',
      center: { x: C.x, y: C.y },
      inside: inCity,
      gate: { ...gate, cells: gateCells, dir },
      plaza,
      well,
      buildings,
      tree,
      lamps,
      props,
      spawn: { x: C.x, y: C.y + 6 },
      level: 60
    };
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
      ...PIXEL_PLACES.map(p => ['lieu', p.name, p.x, p.y]),
      ...CANAAN_LAIRS.all().map(l => ['habitat', l.name + ' (' + l.id + ')', l.x, l.y])
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

  // Créatures de la surface : elles vivent dans leurs habitats (mob-lairs.js), plus au hasard autour du héros. Ici, les
  // habitats proches se peuplent tout de suite (entrée dans le monde, retour d'un donjon ou des Tréfonds).
  function spawnMonsters(count = 100) {
    // Tréfonds : leurs créatures, au niveau du héros (underground.js).
    if (canaanUnder()) return CANAAN_UNDER.spawn(count);
    if (game.world.instance) {
      game.world.monsters.forEach(canaanSetupMob);
      return;
    }
    CANAAN_LAIRS.update(true);
  }
  function updateWorld() {
    game.world.clock++;
    if (game.world.clock % 420 === 0 && !game.world.instance) {
      // Les monstres égarés loin de tout héros disparaissent, et ceux qui traînent dans une zone sûre (Camp de
      // l'Aurore) aussi ; ceux des habitats vont et viennent avec leur habitat.
      const far = m => game.heroes.every(h => Math.hypot(m.x - h.player.x, m.y - h.player.y) >= TS * 34);
      game.world.monsters = game.world.monsters.filter(
        m =>
          m.worldBoss ||
          (m.lair
            ? !(m.hp >= m.mhp && isSafe(m.x / TS, m.y / TS))
            : !far(m) && !(m.zoneMob && m.hp >= m.mhp && isSafe(m.x / TS, m.y / TS)))
      );
      // Tréfonds : leurs créatures apparaissent encore autour du héros (underground.js).
      if (canaanUnder()) {
        const nearby = game.world.monsters.filter(
          m => !m.worldBoss && Math.hypot(m.x - P.x, m.y - P.y) < TS * 25
        ).length;
        if (nearby < 10) spawnMonsters(Math.min(3, 12 - nearby));
      }
    }
    CANAAN_LAIRS.update();
    updateWorldBosses();
    if (
      game.world.instance &&
      !game.world.instance.arena &&
      game.world.instance.cleared &&
      game.world.clock % 360 === 0
    )
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
    // Cité elfique : intérieur de la palissade (rien d'autre ne s'y pose).
    canaanInCity: (x, y) => inCity(Math.floor(x), Math.floor(y)),
    canaanZoneKin: zoneKin,
    canaanSurfaceZoneAt: surfaceZoneAt,
    canaanValleyStrait: valleyStrait,
    // Outils de placement pour les lieux posés après la génération (quêtes) : mêmes règles que les portails.
    CANAAN_WORLD_TOOLS: Object.freeze({
      placeLairs,
      polar,
      nearestSpot,
      clearArea,
      walkableLand,
      reachableFrom,
      valid,
      biomeAt: (x, y) => BIOME_MAP[y * MAPW + x],
      taken: () =>
        [
          ...instances.filter(d => !d.under),
          CANAAN_ARENA_PORTAL,
          ...WORLD_BOSSES,
          ...PIXEL_PLACES,
          ...hiddenChestSpots
        ].map(p => [p.x, p.y])
    }),
    spawnMonsters,
    updateWorld,
    CANAAN_WORLD_AUDIT: auditWorld
  });
})();
