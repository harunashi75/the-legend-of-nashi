// Habitats des créatures : chaque espèce de l'île a ses territoires (tanière des loups, bauge des sangliers, coin de
// forêt envahi par les araignées, campement gobelin…), trois par espèce, répartis du bord intérieur au bord extérieur
// de son biome. Les créatures n'apparaissent plus au hasard autour du héros : chacune a son point d'apparition dans le
// territoire de son espèce, y flâne librement, revient à ce point après sa mort, et y retourne si on l'entraîne trop
// loin, comme dans les grands MMO.
// - Placement : à la génération de l'île (world-generation.js, placeLairs), reproductible chez chacun ; ce module est
//   chargé après tous les autres lieux de l'île et s'y pose à son chargement.
// - Décor : le territoire est habillé dans la grille de décor de l'île, avec les pièces de lair-art.js (tanières,
//   tentes, ossements, toiles, cocons, tombes…) et les arbres du biome envahis (toiles, chauves-souris, corbeaux,
//   arbres corrompus) ; plus dense au cœur, clairsemé vers les bords irréguliers. Rien d'autre n'est dessiné.
// - Apparition et retour au point : chez l'hôte seulement (update, steer) ; les invités reçoivent les monstres.
// - Nom du territoire : sous-zone affichée en y entrant (currentZoneName), repère sur la carte (world-map.js),
//   objectif des quêtes et des contrats qui demandent une espèce (quests.js, quest-field.js : nearest).
(() => {
  'use strict';
  const T = TS;
  // Territoires par espèce ; bêtes (et points d'apparition) par territoire ; rayon moyen (cases) d'un territoire.
  const PER_SPECIES = 3,
    POP = 6,
    RADIUS = 7.5;
  // Distance (cases) d'un héros qui réveille un territoire, et au-delà de laquelle il se rendort ; délai (images)
  // avant qu'une bête vaincue revienne à son point.
  const WAKE = 30,
    SLEEP = 44,
    RESPAWN = 10 * 60;
  // Flânerie (cases) autour de son point ; laisse au-delà de laquelle une bête rentre.
  const ROAM = 2.6,
    LEASH = 13;
  const ELITE_CHANCE = 0.07;

  // Habillage du territoire de chaque espèce (décors de lair-art.js et de l'île) :
  // center : grande pièce au cœur ; features : pièces proches du cœur ; ring : { kind, n, r } en cercle autour du cœur ;
  // trees : arbres du biome envahis ('web', 'venom', 'bats', 'crows') ou remplacés ('blight') ; scatter : [genre,
  // poids] semés dans tout le territoire ; density : part des cases libres habillées au cœur.
  // Les créatures d'une extension apportent les leurs (zone.lairs).
  const THEMES = {
    Slime: {
      name: 'Mare gluante',
      features: ['lair_slime', 'lair_slime', 'lair_slime'],
      scatter: [
        ['lair_slime', 3],
        ['mushroom', 2],
        ['rock', 1]
      ],
      density: 0.16
    },
    Loup: {
      name: 'Tanière des loups',
      center: 'lair_den_wolf',
      features: ['lair_ribcage', 'lair_bones'],
      scatter: [
        ['rock', 3],
        ['lair_bones', 3],
        ['lair_ribcage', 1],
        ['bush', 1]
      ],
      density: 0.14
    },
    Sanglier: {
      name: 'Bauge des sangliers',
      features: ['lair_mud', 'lair_mud', 'lair_rooted'],
      scatter: [
        ['lair_rooted', 3],
        ['lair_mud', 2],
        ['bush', 2]
      ],
      density: 0.2
    },
    Araignée: {
      name: 'Nid d’araignées',
      trees: 'web',
      features: ['lair_cocoon', 'lair_eggsac', 'lair_groundweb'],
      scatter: [
        ['lair_groundweb', 3],
        ['lair_cocoon', 2],
        ['lair_eggsac', 2],
        ['lair_bones', 1]
      ],
      density: 0.2
    },
    Ours: {
      name: 'Grotte de l’ours',
      center: 'lair_den_bear',
      features: ['lair_hive', 'lair_bones'],
      scatter: [
        ['lair_bones', 2],
        ['lair_rooted', 1],
        ['lair_hive', 1],
        ['rock', 1]
      ],
      density: 0.12
    },
    Gobelin: {
      name: 'Campement gobelin',
      center: 'lair_tent_goblin',
      features: ['lair_fire', 'lair_tent_goblin', 'lair_totem', 'lair_crates'],
      scatter: [
        ['lair_stakes', 2],
        ['lair_bones', 2],
        ['lair_crates', 1]
      ],
      density: 0.12
    },
    'Chauve-souris': {
      name: 'Perchoir des chauves-souris',
      center: 'lair_den_bat',
      trees: 'bats',
      scatter: [
        ['rock', 2],
        ['lair_bones', 1]
      ],
      density: 0.1
    },
    'Mante des roseaux': {
      name: 'Roselière des mantes',
      features: ['lair_ootheca', 'lair_ootheca'],
      scatter: [
        ['lair_ootheca', 3],
        ['reed', 3],
        ['lair_bones', 1]
      ],
      density: 0.22
    },
    Basilic: {
      name: 'Jardin pétrifié',
      features: ['lair_statue', 'lair_statue', 'lair_statue'],
      scatter: [
        ['lair_statue', 3],
        ['rock', 2],
        ['lair_bones', 1]
      ],
      density: 0.24
    },
    'Araignée venimeuse': {
      name: 'Nid venimeux',
      trees: 'venom',
      features: ['lair_cocoon', 'lair_eggsac'],
      scatter: [
        ['lair_groundweb', 2],
        ['lair_cocoon', 2],
        ['lair_slime', 1],
        ['lair_eggsac', 1]
      ],
      density: 0.2
    },
    Wisp: {
      name: 'Cercle des feux follets',
      ring: { kind: 'lair_runestone_wisp', n: 5, r: 3 },
      scatter: [
        ['lair_glowshroom_wisp', 3],
        ['mushroom', 1]
      ],
      density: 0.16
    },
    Bandit: {
      name: 'Repaire des bandits',
      center: 'lair_tent_bandit',
      features: ['lair_fire', 'lair_crates', 'lair_crates', 'lair_stakes'],
      scatter: [
        ['lair_crates', 1],
        ['lair_bones', 1]
      ],
      density: 0.08
    },
    'Corbeau spectral': {
      name: 'Gibet des corbeaux',
      center: 'lair_gallows',
      trees: 'crows',
      scatter: [
        ['lair_grave', 2],
        ['lair_bones', 2],
        ['leafpile', 1]
      ],
      density: 0.12
    },
    Troll: {
      name: 'Antre du troll',
      center: 'lair_den_troll',
      features: ['lair_cauldron', 'lair_ribcage'],
      scatter: [
        ['lair_bones', 3],
        ['lair_ribcage', 1],
        ['rock', 1]
      ],
      density: 0.12
    },
    Pilleur: {
      name: 'Camp des pilleurs',
      center: 'lair_wagon',
      features: ['lair_tent_raider', 'lair_fire', 'lair_banner', 'lair_crates'],
      scatter: [
        ['lair_crates', 2],
        ['lair_banner', 1]
      ],
      density: 0.08
    },
    Scorpion: {
      name: 'Terriers des scorpions',
      features: ['lair_burrow', 'lair_ribcage', 'lair_burrow'],
      scatter: [
        ['lair_burrow', 4],
        ['lair_ribcage', 1],
        ['lair_bones', 1],
        ['rock', 1]
      ],
      density: 0.16
    },
    'Drake des dunes': {
      name: 'Nid des drakes',
      center: 'lair_nest_drake',
      scatter: [
        ['rock', 2],
        ['lair_bones', 2],
        ['lair_ribcage', 1]
      ],
      density: 0.2
    },
    Squelette: {
      name: 'Cimetière des sables',
      features: ['lair_grave', 'lair_grave', 'ruin'],
      scatter: [
        ['lair_grave', 4],
        ['ruin', 1],
        ['lair_bones', 2]
      ],
      density: 0.18
    },
    Minotaure: {
      name: 'Arène du minotaure',
      features: ['lair_hornskull'],
      ring: { kind: 'ruin', n: 6, r: 3.5 },
      scatter: [
        ['lair_bones', 2],
        ['ruin', 1]
      ],
      density: 0.16
    },
    'Fée sauvage': {
      name: 'Cercle des fées',
      ring: { kind: 'lair_glowshroom_fairy', n: 8, r: 2.5 },
      scatter: [
        ['lair_glowshroom_fairy', 2],
        ['flower', 2],
        ['magicplant', 1]
      ],
      density: 0.16
    },
    'Gardien astral': {
      name: 'Sanctuaire astral',
      center: 'lair_monolith',
      ring: { kind: 'lair_runestone_astral', n: 4, r: 3 },
      scatter: [
        ['crystal', 2],
        ['lair_runestone_astral', 1]
      ],
      density: 0.1
    },
    'Drake astral': {
      name: 'Nid étoilé',
      center: 'lair_nest_astral',
      scatter: [
        ['crystal', 3],
        ['lair_bones', 1]
      ],
      density: 0.22
    },
    'Ent corrompu': {
      name: 'Bosquet corrompu',
      trees: 'blight',
      features: ['lair_blightpool', 'lair_blighttree'],
      scatter: [
        ['lair_thorns', 3],
        ['lair_blightpool', 1],
        ['lair_blighttree', 1]
      ],
      density: 0.2
    }
  };
  const DEFAULT_THEME = {
    name: 'Repaire',
    scatter: [
      ['rock', 2],
      ['lair_bones', 2]
    ],
    density: 0.12
  };
  const themeOf = mob => THEMES[mob] || DEFAULT_THEME;
  // Petits décors de l'île qu'un habitat peut recouvrir (jamais un arbre, un rocher posé ni un bâtiment).
  const SOFT = new Set([
    null,
    undefined,
    'flower',
    'bush',
    'leafpile',
    'dune',
    'wheat',
    'magicplant',
    'mushroom'
  ]);

  let LAIRS = [];
  let clock = 0;

  // ---------------------------------------------------------------- Territoire
  // Distance relative d'une case au cœur d'un territoire (moins de 1 : dedans), au bord irrégulier.
  function reach(l, x, y) {
    return (Math.hypot(x - l.x, y - l.y) / l.r) * (1 + (field(x, y, 5, 700 + l.seed) - 0.5) * 0.7);
  }
  const insideTerritory = (l, x, y) => reach(l, x, y) < 1;
  // Territoire d'une case (en cases), ou null.
  function lairAt(x, y) {
    for (const l of LAIRS)
      if (Math.abs(l.x - x) < l.r * 1.5 && Math.abs(l.y - y) < l.r * 1.5 && insideTerritory(l, x, y))
        return l;
    return null;
  }

  // ---------------------------------------------------------------- Placement (génération de l'île)
  // w : outils de world-generation.js — zones [{ index, mobs, lairs, angle, x, y, ring }], center, biomeAt(x, y),
  // ok(x, y) (terre ferme accessible, hors route et zone sûre), land(x, y) (terre ferme, hors route), soil(x, y) (terre
  // ou eau peu profonde du marais : le territoire peut l'englober), avoid
  // [{ x, y, r }] (lieux déjà posés).
  function place(w) {
    LAIRS = [];
    const D = game.world.decor;
    const free = (x, y, z) => {
      if (w.biomeAt(x, y) !== z || !w.ok(x, y)) return false;
      if (w.avoid.some(a => Math.hypot(a.x - x, a.y - y) < a.r + RADIUS * 0.6)) return false;
      if (LAIRS.some(l => Math.hypot(l.x - x, l.y - y) < RADIUS * 2 + 4)) return false;
      // L'essentiel du territoire est sur la terre ferme du biome.
      let good = 0;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2,
          px = Math.round(x + Math.cos(a) * RADIUS * 0.75),
          py = Math.round(y + Math.sin(a) * RADIUS * 0.75);
        if (w.biomeAt(px, py) === z && w.soil(px, py)) good++;
      }
      return good >= 9;
    };
    const near = (tx, ty, z) => {
      for (let r = 0; r <= 14; r++)
        for (let y = ty - r; y <= ty + r; y++)
          for (let x = tx - r; x <= tx + r; x++)
            if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) === r && free(x, y, z)) return { x, y };
      return null;
    };
    for (const z of w.zones) {
      const m = z.mobs.length;
      z.mobs.forEach((mob, s) => {
        for (let b = 0; b < PER_SPECIES; b++) {
          // Carré latin : chaque espèce a un territoire par bande (bord intérieur, milieu, bord extérieur du biome),
          // dans une tranche différente à chaque bande ; les espèces se mêlent sans se marcher dessus.
          const slot = (((s + b) % m) + 0.5) / m;
          let tx, ty;
          if (z.ring) {
            const a = ((z.angle - 24 + 48 * slot) * Math.PI) / 180,
              r = [68, 102, 138][b];
            tx = Math.round(w.center.x + Math.cos(a) * r);
            ty = Math.round(w.center.y + Math.sin(a) * r);
          } else {
            const a = ((360 * slot + b * 47) * Math.PI) / 180,
              r = [12, 24, 34][b];
            tx = Math.round(z.x + Math.cos(a) * r);
            ty = Math.round(z.y + Math.sin(a) * r);
          }
          let spot = near(tx, ty, z.index);
          // Rien autour du point voulu : un autre point du biome, tiré de façon reproductible.
          for (let n = 0; !spot && n < 80; n++) {
            const h = hash(s * 13 + b, n, 641 + z.index),
              g = hash(n, s * 7 + b, 642 + z.index),
              a = ((z.angle - 26 + 52 * h) * Math.PI) / 180;
            spot = z.ring
              ? near(
                  Math.round(w.center.x + Math.cos(a) * (60 + g * 92)),
                  Math.round(w.center.y + Math.sin(a) * (60 + g * 92)),
                  z.index
                )
              : near(
                  Math.round(z.x + Math.cos(h * 6.283) * g * 36),
                  Math.round(z.y + Math.sin(h * 6.283) * g * 36),
                  z.index
                );
          }
          if (!spot) continue;
          const lair = {
            id: 'z' + z.index + '_' + s + '_' + b,
            mob,
            zone: z.index,
            theme: z.lairs?.[mob] || themeOf(mob),
            x: spot.x,
            y: spot.y,
            r: RADIUS,
            seed: LAIRS.length * 3 + 1,
            spots: [],
            awake: false,
            next: 0
          };
          lair.name = lair.theme.name;
          LAIRS.push(lair);
          dress(lair, w, D);
          lair.spots = spawnSpots(lair, w, D);
        }
      });
    }
    return LAIRS;
  }
  // Habillage du territoire dans la grille de décor de l'île.
  function dress(l, w, D) {
    const th = l.theme,
      big = CANAAN_BIG_TREES,
      taken = [];
    const groundOk = (x, y) => w.land(x, y) && insideTerritory(l, x, y);
    const room = (x, y, gap) =>
      !taken.some(([a, b, g]) => Math.max(Math.abs(a - x), Math.abs(b - y)) < Math.max(gap, g));
    const put = (x, y, kind, gap = 2) => {
      D[y][x] = kind;
      taken.push([x, y, gap]);
    };
    // Case libre la plus proche d'un point, où poser une pièce (grande : les arbres voisins sont ôtés).
    const settle = (tx, ty, kind, gap) => {
      const tall = big.has(kind);
      for (let r = 0; r <= 2; r++)
        for (let y = ty - r; y <= ty + r; y++)
          for (let x = tx - r; x <= tx + r; x++) {
            if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || !groundOk(x, y) || !room(x, y, gap))
              continue;
            if (!SOFT.has(D[y][x]) && !big.has(D[y][x])) continue;
            if (tall)
              for (let j = -1; j <= 0; j++)
                for (let i = -1; i <= 1; i++)
                  if ((i || j) && big.has(D[y + j]?.[x + i])) D[y + j][x + i] = null;
            put(x, y, kind, gap);
            return true;
          }
      return false;
    };
    if (th.center) settle(l.x, l.y, th.center, 3);
    (th.features || []).forEach((kind, i) => {
      const a = hash(l.seed, i, 671) * Math.PI * 2 + i * 2.1,
        r = 2.2 + hash(i, l.seed, 672) * 1.8;
      settle(
        Math.round(l.x + Math.cos(a) * r),
        Math.round(l.y + Math.sin(a) * r * 0.8),
        kind,
        big.has(kind) ? 3 : 2
      );
    });
    if (th.ring)
      for (let i = 0; i < th.ring.n; i++) {
        const a = (i / th.ring.n) * Math.PI * 2 + hash(l.seed, 3, 673);
        settle(
          Math.round(l.x + Math.cos(a) * th.ring.r),
          Math.round(l.y + Math.sin(a) * th.ring.r * 0.85),
          th.ring.kind,
          1
        );
      }
    const R = Math.ceil(l.r * 1.4);
    // Arbres du biome envahis (ou corrompus) : presque tous au cœur, de moins en moins vers les bords.
    if (th.trees)
      for (let y = l.y - R; y <= l.y + R; y++)
        for (let x = l.x - R; x <= l.x + R; x++) {
          if (!D[y]?.[x] || !CANAAN_LAIR_DECOR.BASE_TREES.includes(D[y][x])) continue;
          const d = reach(l, x, y);
          if (d >= 1.1 || hash(x, y, 674 + l.seed) > 1.05 - d * 0.75) continue;
          D[y][x] = th.trees === 'blight' ? 'lair_blighttree' : CANAAN_LAIR_DECOR.dressed(th.trees, D[y][x]);
        }
    // Semis : pièces éparses dans tout le territoire, plus serrées au cœur.
    const total = th.scatter.reduce((n, [, p]) => n + p, 0);
    for (let y = l.y - R; y <= l.y + R; y++)
      for (let x = l.x - R; x <= l.x + R; x++) {
        if (!groundOk(x, y) || !SOFT.has(D[y][x]) || !room(x, y, 2)) continue;
        const d = reach(l, x, y);
        if (hash(x, y, 675 + l.seed) > th.density * (1.25 - d * 0.8)) continue;
        let pick = hash(y, x, 676 + l.seed) * total,
          kind = th.scatter[0][0];
        for (const [k, p] of th.scatter)
          if ((pick -= p) < 0) {
            kind = k;
            break;
          }
        if (big.has(kind) && [-1, 1].some(i => big.has(D[y][x + i]))) continue;
        put(x, y, kind, 2);
      }
  }
  // Points d'apparition des bêtes : répartis dans le territoire (tirage du plus éloigné), sur des cases praticables
  // sans tronc ni grande pièce.
  function spawnSpots(l, w, D) {
    const cells = [];
    const R = Math.ceil(l.r);
    for (let y = l.y - R; y <= l.y + R; y++)
      for (let x = l.x - R; x <= l.x + R; x++)
        if (reach(l, x, y) < 0.85 && w.ok(x, y) && !CANAAN_BIG_TREES.has(D[y][x])) cells.push([x, y]);
    if (!cells.length) return [[l.x, l.y]];
    const dist = c => Math.hypot(c[0] - l.x - 1, c[1] - l.y - 2);
    const out = [cells.reduce((a, c) => (dist(c) < dist(a) ? c : a))];
    while (out.length < POP) {
      let best = null,
        bd = -1;
      for (const c of cells) {
        const d =
          Math.min(...out.map(o => Math.hypot(o[0] - c[0], o[1] - c[1]))) + hash(c[0], c[1], 677) * 0.4;
        if (d > bd) [best, bd] = [c, d];
      }
      out.push(best);
    }
    return out;
  }

  // ---------------------------------------------------------------- Apparition (chez l'hôte)
  const surface = () => !game.world.instance && !canaanUnder();
  // Héros debout au plus près d'un point (en cases).
  function closest(x, y) {
    let best = Infinity;
    for (const hero of game.heroes) {
      const p = hero.player;
      if (p.dead || hero.away) continue;
      best = Math.min(best, Math.hypot(p.x / T - x, p.y / T - y));
    }
    return best;
  }
  function spawnAt(lair, i) {
    const type = canaanMobTypes().find(t => t.name === lair.mob);
    if (!type) return null;
    const [sx, sy] = lair.spots[i % lair.spots.length];
    let x = sx + 0.5,
      y = sy + 0.5;
    for (let tries = 0; tries < 8; tries++) {
      const fx = sx + 0.5 + (Math.random() - 0.5) * 1.2,
        fy = sy + 0.5 + (Math.random() - 0.5) * 1.2;
      if (!canWalk(fx * T, fy * T) || isSafe(fx, fy)) continue;
      [x, y] = [fx, fy];
      break;
    }
    const elite = Math.random() < ELITE_CHANCE,
      level = canaanZoneMobLevel(lair.x, lair.y),
      hp = mobHealth(level, elite, type.hp),
      m = {
        x: x * T,
        y: y * T,
        hp,
        mhp: hp,
        level,
        t: type.name,
        r: elite ? 19 : 16,
        cd: 0,
        g: mobGold(level, elite),
        mobColor: type.color,
        elite,
        zoneMob: true,
        lair: lair.id,
        spot: i,
        hx: (sx + 0.5) * T,
        hy: (sy + 0.5) * T,
        facingAngle: Math.random() * Math.PI * 2,
        strollUntil: time + Math.random() * 240,
        _levelHp: true
      };
    game.world.monsters.push(m);
    return m;
  }
  const mobsOf = lair => game.world.monsters.filter(m => m.lair === lair.id && m.hp > 0);
  // Points sans bête vivante.
  function emptySpots(lair) {
    const used = new Set(mobsOf(lair).map(m => m.spot));
    return lair.spots.map((_, i) => i).filter(i => !used.has(i));
  }
  // Réveil, repeuplement et sommeil des territoires. now : entrée dans le monde (début de partie, retour d'un donjon
  // ou des Tréfonds), sans attendre l'horloge ; les monstres d'avant sont partis, chaque territoire proche se repeuple
  // d'un coup. Hors de la surface, tous les territoires dorment.
  function update(now = false) {
    if (game.mode === 'guest') return;
    if (!surface() || now) for (const l of LAIRS) l.awake = false;
    if (!surface() || (!now && ++clock % 30)) return;
    let asleep = null;
    for (const lair of LAIRS) {
      if (ZONES[lair.zone]?.locked) continue;
      const d = closest(lair.x, lair.y);
      if (d > SLEEP) {
        if (lair.awake) (asleep ??= new Set()).add(lair.id);
        lair.awake = false;
        continue;
      }
      if (!lair.awake) {
        if (d > WAKE) continue;
        // Un territoire qui se réveille : une bête à chaque point.
        lair.awake = true;
        for (const i of emptySpots(lair)) spawnAt(lair, i);
        lair.next = time + RESPAWN;
        continue;
      }
      const empty = emptySpots(lair);
      if (!empty.length) lair.next = time + RESPAWN;
      else if (time >= lair.next) {
        spawnAt(lair, empty[0]);
        lair.next = time + RESPAWN;
      }
    }
    // Territoire rendormi : ses bêtes intactes s'en vont (une bête blessée reste jusqu'à la fin du combat).
    if (asleep)
      game.world.monsters = game.world.monsters.filter(m => !(m.lair && asleep.has(m.lair) && m.hp >= m.mhp));
  }

  // ---------------------------------------------------------------- Comportement des bêtes (chez l'hôte)
  // Renvoie true quand la bête vaque chez elle (retour à son point, flânerie) : elle ne poursuit ni ne frappe.
  // false : un héros est à portée, la poursuite ordinaire de game-core.js s'en charge.
  function steer(m) {
    const home = Math.hypot(m.x - m.hx, m.y - m.hy);
    if (!m.homing && home > LEASH * T) m.homing = true;
    if (m.homing) {
      // Retour : vite, sans se laisser distraire, en reprenant ses PV.
      m.targetHero = null;
      m.facingAngle = Math.atan2(m.hy - m.y, m.hx - m.x);
      const step = Math.min(home, 2.4);
      walk(m, Math.cos(m.facingAngle) * step, Math.sin(m.facingAngle) * step, true);
      m.hp = Math.min(m.mhp, m.hp + m.mhp * 0.01);
      if (home < T * 1.2 || m.stuck > 240) {
        if (m.stuck > 240) [m.x, m.y] = [m.hx, m.hy];
        m.homing = false;
        m.stuck = 0;
        m.hp = m.mhp;
      }
      return true;
    }
    const target = nearestHero(m);
    if (target) {
      const p = target.player;
      if (Math.hypot(p.x - m.x, p.y - m.y) < 260 && !isSafe(p.x / T, p.y / T)) return false;
    }
    // Flânerie autour de son point : quelques pas, une pause, ailleurs.
    m.targetHero = null;
    if (time > (m.strollUntil || 0)) {
      const a = Math.random() * Math.PI * 2,
        r = Math.random() * ROAM * T;
      m.stroll = Math.random() < 0.35 ? null : { x: m.hx + Math.cos(a) * r, y: m.hy + Math.sin(a) * r };
      m.strollUntil = time + 120 + Math.random() * 300;
    }
    if (!m.stroll) return true;
    const dx = m.stroll.x - m.x,
      dy = m.stroll.y - m.y,
      d = Math.hypot(dx, dy);
    if (d > 6) {
      m.facingAngle = Math.atan2(dy, dx);
      if (!walk(m, (dx / d) * 0.55, (dy / d) * 0.55)) m.strollUntil = 0;
    }
    return true;
  }
  function walk(m, vx, vy, push = false) {
    if (canWalk(m.x + vx, m.y + vy, true)) {
      m.x += vx;
      m.y += vy;
      m.stuck = 0;
      return true;
    }
    if (push) {
      m.stuck = (m.stuck || 0) + 1;
      // Contourner l'obstacle par le côté.
      const side = m.stuck % 120 < 60 ? 1 : -1;
      if (canWalk(m.x - vy * side, m.y + vx * side, true)) {
        m.x -= vy * side;
        m.y += vx * side;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- Objectifs des quêtes et contrats
  // Territoire le plus proche d'un point (en cases) dont l'espèce est demandée : mobs, liste de noms, ou '*' (contrats
  // de la guilde : une créature à la mesure du héros, au plus 5 niveaux de moins que lui).
  function nearest(x, y, mobs, hero = game.hero) {
    let best = null,
      bd = Infinity;
    const level = clampLevel(hero?.level || 1);
    for (const l of LAIRS) {
      if (ZONES[l.zone]?.locked) continue;
      if (mobs === '*' ? zoneLevel(l.zone, level) < level - 5 : !mobs?.includes(l.mob)) continue;
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bd) [best, bd] = [l, d];
    }
    return best;
  }

  window.CANAAN_LAIRS = Object.freeze({
    THEMES,
    POP,
    place,
    update,
    steer,
    nearest,
    inside: insideTerritory,
    at: lairAt,
    all: () => LAIRS
  });
  // Sous-zone affichée en entrant dans un territoire (currentZoneName, world-generation.js).
  canaanLairAt = (x, y) => (surface() ? lairAt(x, y) : null);
  // Chargé après les autres lieux (quêtes, bâtiments, Tréfonds, extensions) : l'île déjà générée reçoit ses habitats,
  // et une île régénérée les reçoit à nouveau.
  canaanLairsWorld = CANAAN_WORLD_TOOLS.placeLairs;
  canaanLairsWorld();
})();
