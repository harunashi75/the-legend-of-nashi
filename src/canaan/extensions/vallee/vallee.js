// Extension 1 — la Vallée des Héros (zone de niveau 60, facultative) : ses lieux, ses habitants, et l'extension
// enregistrée auprès du jeu (CANAAN_EXT). La terre elle-même (herbe dorée, blé, collines, isthme du Col des Héros)
// est générée par l'île dans tous les builds (world-generation.js) ; ce fichier y pose, une fois l'île générée :
// - les Ruisseaux Dorés : deux cours d'eau peu profonds qui se rejoignent dans un étang (pêche), franchis par des
//   ponts de pierre ;
// - les chemins : du Col des Héros à l'écurie, à l'Allée des Légendes, à l'arène et aux moulins des Champs d'Or ;
// - l'Écurie des Héros : grange, enclos et ses quatre chevaux, Garance la maîtresse d'écurie (montures, mounts.js) ;
// - l'Allée des Légendes : dalles, huit statues de héros et leurs plaques, la statue de l'Aurore (elle s'illumine
//   pour un héros qui porte le titre « Gardien de l'Aurore »), et Hector, le gardien de l'Allée ;
// - l'Arène de Valérion : dalles en cercle, quatre statues (rayons, abris et sceaux du combat, valerion.js) ;
// - deux moulins dans les Champs d'Or.
(() => {
  'use strict';
  const A = () => window.CANAAN_VALLEY_ART || null;
  const MOUNTS = () => window.CANAAN_VALLEY_MOUNTS;
  const BOSS = () => window.CANAAN_VALLEY_BOSS;
  const esc = (s, params) => safeGearText(tt(String(s), params));
  let land = null,
    plan = null,
    remoteLit = false;

  // ---------------------------------------------------------------- Légendes des statues
  const LEGENDS = [
    {
      name: 'Aldric le Brave',
      text: 'Seul sur le pont de pierre, il retint la horde des Cendres jusqu’à l’aube. Le pont tient encore ; on dit qu’il n’a jamais cédé depuis.'
    },
    {
      name: 'Sigrun Lance-d’Aube',
      text: 'Elle chevaucha trois jours sans dormir pour prévenir la vallée. Sa lance plantée au sommet du col servit de phare aux réfugiés.'
    },
    {
      name: 'Elara Œil-de-Faucon',
      text: 'D’une seule flèche, à six cents pas, elle trancha la corde du pont-levis de la forteresse noire.'
    },
    {
      name: 'Maître Orvel',
      text: 'Le vieux mage arrêta la grande crue en gelant la rivière d’un seul mot. Les anciens l’appellent encore « l’Hiver qui sauve ».'
    },
    {
      name: 'Brann Fend-Montagne',
      text: 'Il ouvrit à la hache le passage du Col des Héros, pierre après pierre, pour que les familles puissent fuir.'
    },
    {
      name: 'Dame Ysolde',
      text: 'Son bouclier ne connut jamais la défaite : elle protégea l’enfant-roi pendant toute la bataille des Moissons.'
    },
    {
      name: 'Liora la Chanteuse',
      text: 'Sa ballade rendit courage à une armée vaincue. On la chante encore à la fin des moissons.'
    },
    {
      name: 'Nyx Pas-d’Ombre',
      text: 'Personne ne vit jamais son visage. Elle déroba les plans de l’ennemi sous son nez, la veille de la dernière bataille.'
    }
  ];
  const AURORA = {
    name: 'Le Gardien de l’Aurore',
    text: 'Cette statue n’a pas encore de visage. La plaque dit seulement : « Pour celui ou celle qui réveillera le Cœur de l’Aurore. »',
    lit: 'La pierre s’illumine à ton approche : tes propres traits y apparaissent. Tu es le Gardien de l’Aurore, et la vallée se souviendra de toi.'
  };
  const HECTOR_LINES = [
    'Bienvenue dans la Vallée des Héros. Chaque statue raconte une vie donnée pour les autres.',
    'Valérion fut le dernier champion de la vallée. Il garde son arène, au nord-ouest, et éprouve ceux qui viennent.',
    'Ses coups s’annoncent toujours : regarde le sol, et éloigne-toi des zones qui rougeoient.',
    'Quand ses statues s’éveillent, leurs rayons traversent l’arène. Puis vient le Jugement : abrite-toi derrière une statue.',
    'À la fin, il invoque la Dernière Lumière. Deux sceaux de deux statues différentes, et il vacille.',
    'On dit qu’il récompense les dignes : parfois, une pièce mythique, une chance sur neuf environ pour chacun.'
  ];
  const GARANCE_LINES = [
    'Des chevaux de héros, rien de moins ! Viens voir l’enclos.',
    'Une monture se monte dans le monde ouvert. En combat, mieux vaut garder les pieds sur terre.',
    'Le Coursier de l’Aurore ? Il ne se laisse monter que par les plus déterminés… et les plus riches.'
  ];

  // ---------------------------------------------------------------- Construction des lieux
  const RAD = Math.PI / 180;
  function catmull(points) {
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[Math.max(0, i - 1)],
        b = points[i],
        d = points[i + 1],
        e = points[Math.min(points.length - 1, i + 2)],
        n = Math.max(8, Math.ceil(Math.hypot(d[0] - b[0], d[1] - b[1]) * 6));
      for (let j = 0; j <= n; j++) {
        const t = j / n,
          t2 = t * t,
          t3 = t2 * t,
          f = k =>
            0.5 *
            (2 * b[k] +
              (-a[k] + d[k]) * t +
              (2 * a[k] - 5 * b[k] + 4 * d[k] - e[k]) * t2 +
              (-a[k] + 3 * b[k] - 3 * d[k] + e[k]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    return out;
  }
  function build() {
    land = CANAAN_EXT_LANDS.find(l => l.ext === 'vallee') || null;
    plan = null;
    if (!land) return;
    const T = game.world.tiles,
      D = game.world.decor,
      mine = (x, y) => canaanExtLand(x, y) === land,
      ground = (x, y) => mine(x, y) && [50, 51].includes(T[y][x]),
      set = (x, y, t) => {
        if (!mine(x, y)) return;
        T[y][x] = t;
        D[y][x] = null;
      };
    // Lieu dégagé le plus proche d'une cible : un carré w × h tout entier d'herbe ou de blé de la vallée.
    function spot(tx, ty, w, h) {
      for (let r = 0; r < 18; r++)
        for (let y = ty - r; y <= ty + r; y++)
          for (let x = tx - r; x <= tx + r; x++) {
            if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue;
            let ok = true;
            for (let j = -1; j <= h && ok; j++) for (let i = -1; i <= w && ok; i++) ok = ground(x + i, y + j);
            if (ok) return { x, y };
          }
      return { x: tx, y: ty };
    }
    const clear = (x0, y0, w, h, t = 50) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, t);
    };
    // Ruisseaux Dorés et étang : eau peu profonde (on y marche), l'étang au milieu est profond (on y pêche).
    const pond = spot(52, 361, 5, 5);
    const pc = { x: pond.x + 2.5, y: pond.y + 2.5 };
    const water = (pts, half) => {
      for (const [fx, fy] of catmull(pts))
        for (let y = Math.round(fy) - 2; y <= Math.round(fy) + 2; y++)
          for (let x = Math.round(fx) - 2; x <= Math.round(fx) + 2; x++)
            if (ground(x, y) && Math.hypot(x - fx, y - fy) <= half + hash(x, y, 91) * 0.4) set(x, y, 15);
    };
    water(
      [
        [23, 330],
        [30, 341],
        [40, 349],
        [47, 356],
        [pc.x, pc.y]
      ],
      0.9
    );
    water(
      [
        [72, 297],
        [71, 312],
        [67, 327],
        [62, 340],
        [57, 352],
        [pc.x, pc.y]
      ],
      0.9
    );
    for (let y = pond.y - 2; y <= pond.y + 7; y++)
      for (let x = pond.x - 2; x <= pond.x + 7; x++) {
        const d = Math.hypot(x + 0.5 - pc.x, y + 0.5 - pc.y) + (hash(x, y, 92) - 0.5) * 0.8;
        if (d < 2.4) set(x, y, 0);
        else if (d < 3.6 && ground(x, y)) set(x, y, 15);
      }
    // Lieux.
    const stable = spot(86, 360, 7, 6),
      paddock = { x: stable.x - 10, y: stable.y + 2, w: 9, h: 5 },
      alley = { x0: 47, x1: 76, y: 346 },
      arenaAt = spot(34, 316, 1, 1),
      mills = [spot(36, 371, 2, 2), spot(64, 377, 2, 2)];
    clear(stable.x - 1, stable.y - 1, 9, 8);
    clear(paddock.x - 1, paddock.y - 1, paddock.w + 2, paddock.h + 2, 1);
    for (const m of mills) clear(m.x - 1, m.y - 1, 4, 4, 51);
    // Arène de Valérion : cercle de dalles (sol de route sous les dalles), quatre statues en diagonale.
    const R = BOSS().R;
    for (let y = arenaAt.y - R - 1; y <= arenaAt.y + R + 1; y++)
      for (let x = arenaAt.x - R - 1; x <= arenaAt.x + R + 1; x++)
        if (mine(x, y) && Math.hypot(x - arenaAt.x, y - arenaAt.y) <= R + 0.6) set(x, y, 50);
    const arenaStatues = [45, 135, 225, 315].map(a => ({
      x: Math.round(arenaAt.x + Math.cos(a * RAD) * 6.2),
      y: Math.round(arenaAt.y + Math.sin(a * RAD) * 6.2)
    }));
    // Allée des Légendes : trois cases de dalles, statues de part et d'autre, statue de l'Aurore au bout.
    for (let x = alley.x0 - 3; x <= alley.x1 + 1; x++)
      for (let y = alley.y - 3; y <= alley.y + 3; y++) if (T[y]?.[x] !== 15) set(x, y, 50);
    const statues = [];
    for (let i = 0; i < 8; i++)
      statues.push({
        x: alley.x1 - 4 - Math.floor(i / 2) * 6,
        y: alley.y + (i % 2 ? 2 : -2),
        pose: i,
        legend: LEGENDS[i]
      });
    const aurora = { x: alley.x0 - 2, y: alley.y, special: true, legend: AURORA };
    // Chemins (terre battue, ponts de pierre sur l'eau).
    const pave = (pts, half = 1.4) => {
      for (const [fx, fy] of catmull(pts))
        for (let y = Math.round(fy) - 2; y <= Math.round(fy) + 2; y++)
          for (let x = Math.round(fx) - 2; x <= Math.round(fx) + 2; x++) {
            if (!mine(x, y) || Math.hypot(x - fx, y - fy) > half || T[y][x] === 4 || T[y][x] === 0) continue;
            if (T[y][x] === 15) BRIDGE_TILES.add(y * MAPW + x);
            T[y][x] = 2;
            D[y][x] = null;
          }
    };
    const E = land.pass.to,
      door = { x: stable.x + 3.5, y: stable.y + 6.5 };
    pave([
      [E.x, E.y],
      [(E.x + door.x) / 2, door.y + 1],
      [door.x, door.y],
      [alley.x1 + 2, alley.y + 3],
      [alley.x1 + 1, alley.y]
    ]);
    for (let x = alley.x0 - 1; x <= alley.x1 + 1; x++)
      for (let y = alley.y - 1; y <= alley.y + 1; y++) {
        if (T[y][x] === 15) BRIDGE_TILES.add(y * MAPW + x);
        T[y][x] = 2;
        D[y][x] = null;
      }
    pave([
      [alley.x0 - 1, alley.y],
      [alley.x0 - 6, alley.y - 4],
      [arenaAt.x + 2, arenaAt.y + R + 3],
      [arenaAt.x, arenaAt.y + R]
    ]);
    pave(
      [
        [door.x - 2, door.y + 1],
        [70, 374],
        [mills[1].x + 1, mills[1].y + 3],
        [50, 373],
        [mills[0].x + 1, mills[0].y + 3]
      ],
      1.1
    );
    // Dalles de l'arène, posées après les chemins.
    for (let y = arenaAt.y - R - 1; y <= arenaAt.y + R + 1; y++)
      for (let x = arenaAt.x - R - 1; x <= arenaAt.x + R + 1; x++)
        if (mine(x, y) && Math.hypot(x - arenaAt.x, y - arenaAt.y) <= R + 0.4) {
          T[y][x] = 2;
          D[y][x] = null;
        }
    // Pied des statues, de l'écurie et des moulins : rien ne pousse dessus.
    for (const s of [...statues, aurora, ...arenaStatues]) {
      D[s.y][s.x] = null;
      if (T[s.y][s.x] === 15) T[s.y][s.x] = 2;
    }
    // Chevaux de l'enclos, chacun de sa robe.
    const horses = MOUNTS().MOUNTS.map((M, i) => ({
      M,
      x: (paddock.x + 1.5 + i * 2) * TS,
      y: (paddock.y + 1.5 + (i % 2) * 2) * TS,
      tx: null,
      ty: null,
      face: i % 2 ? -1 : 1,
      wait: 60 + i * 50,
      graze: i === 1,
      phase: 0
    }));
    const people = [
      {
        id: 'garance',
        name: 'Garance, maîtresse d’écurie',
        x: door.x,
        y: door.y - 0.6,
        look: {
          sex: 'f',
          race: 'humain',
          skin: '#e8b48a',
          hairStyle: 'queue',
          hair: '#a8442a',
          eyes: '#3a9a4a',
          outfit: 'foret'
        },
        lines: GARANCE_LINES
      },
      {
        id: 'hector',
        name: 'Hector, gardien de l’Allée',
        x: alley.x1 + 2.5,
        y: alley.y - 1.6,
        look: {
          sex: 'm',
          race: 'humain',
          skin: '#c98e62',
          hairStyle: 'court',
          hair: '#e8e8e0',
          eyes: '#2a7ab8',
          outfit: 'or'
        },
        lines: HECTOR_LINES
      }
    ];
    plan = {
      stable,
      paddock,
      door,
      alley,
      statues,
      aurora,
      arena: { x: arenaAt.x, y: arenaAt.y, statues: arenaStatues },
      mills,
      horses,
      people,
      pond: pc,
      line: 0
    };
    BOSS().setArena(plan.arena);
    // Boss mondial : son repère sur les cartes, au centre de l'arène.
    const b = WORLD_BOSSES.find(o => o.id === 'valerion');
    if (b) Object.assign(b, { x: arenaAt.x, y: arenaAt.y });
  }

  // ---------------------------------------------------------------- Collisions
  // Rectangles (en cases) : grange, pieds des statues et des moulins, clôture de l'enclos.
  let solids = [];
  function solidsOf() {
    if (!plan) return [];
    if (solids.plan === plan) return solids;
    const p = plan,
      list = [
        [p.stable.x + 0.2, p.stable.y + 2.6, 6.6, 3.2],
        ...[...p.statues, p.aurora].map(s => [s.x + 0.15, s.y + 0.35, 0.7, 0.6]),
        ...p.arena.statues.map(s => [s.x + 0.05, s.y + 0.3, 0.9, 0.7]),
        ...p.mills.map(m => [m.x + 0.1, m.y + 0.4, 1.8, 1.4])
      ],
      { x, y, w, h } = p.paddock;
    list.push([x, y - 0.1, w, 0.3], [x, y + h - 0.2, w, 0.3], [x - 0.1, y, 0.3, h], [x + w - 0.2, y, 0.3, h]);
    solids = list;
    solids.plan = plan;
    return solids;
  }
  function blocked(px, py) {
    if (!plan || !land) return false;
    const x = px / TS,
      y = py / TS,
      b = land.box;
    if (x < b.x0 - 1 || x > b.x1 + 1 || y < b.y0 - 1 || y > b.y1 + 1) return false;
    return solidsOf().some(([sx, sy, sw, sh]) => x >= sx && x <= sx + sw && y >= sy && y <= sy + sh);
  }

  // ---------------------------------------------------------------- Interactions
  const near = (p, x, y, r) => Math.hypot(p.x / TS - x, p.y / TS - y) < r;
  function reach(p) {
    if (!plan || game.world.instance || game.world.layer === 'under') return null;
    const b = land.box;
    if (p.x / TS < b.x0 - 2 || p.x / TS > b.x1 + 2 || p.y / TS < b.y0 - 2 || p.y / TS > b.y1 + 2) return null;
    for (const n of plan.people) if (near(p, n.x, n.y, 2.2)) return { kind: 'npc', n };
    for (let i = 0; i < plan.arena.statues.length; i++) {
      const s = plan.arena.statues[i];
      if (near(p, s.x + 0.5, s.y + 0.6, 2.2)) return { kind: 'seal', i };
    }
    for (const s of [...plan.statues, plan.aurora])
      if (near(p, s.x + 0.5, s.y + 0.8, 1.7)) return { kind: 'statue', s };
    return null;
  }
  const titled = hero => !!hero?.quetes?.flags?.title;
  function statuePanel(s) {
    const L = s.legend,
      lit = s.special && titled(game.hero);
    modernPanel(
      rpgHeader('🗿 ' + tt(L.name)) +
        '<div class="modern-body"><p class="city-lore">« ' +
        esc(lit ? L.lit : L.text) +
        ' »</p><p class="muted">' +
        esc('Allée des Légendes · Vallée des Héros') +
        '</p></div>'
    );
  }
  function talk(n) {
    plan.line++;
    if (n.id === 'garance') return MOUNTS().shop();
    modernPanel(
      rpgHeader('💬 ' + tt(n.name)) +
        '<div class="modern-body"><p class="city-lore">« ' +
        esc(n.lines[plan.line % n.lines.length]) +
        ' »</p><div class="modern-foot"><button type="button" data-action="extAction" data-ext="vallee" data-act="talk" data-id="' +
        n.id +
        '">' +
        esc('💬 Écouter encore') +
        '</button></div></div>'
    );
  }
  function sealPanel() {
    modernPanel(
      rpgHeader('☀️ ' + tt('Statue de l’arène')) +
        '<div class="modern-body"><p class="city-lore">« ' +
        esc(
          'Quatre gardiens de pierre veillent sur l’arène de Valérion. Leurs disques solaires dorment… jusqu’à ce que le champion soit éprouvé.'
        ) +
        ' »</p></div>'
    );
  }
  // E chez l'hôte (pour lui ou pour un invité) : true si la vallée a répondu.
  function interact(hero) {
    const r = reach(hero.player);
    if (!r) return false;
    if (r.kind === 'seal' && BOSS().canSeal(r.i)) return (BOSS().seal(r.i, hero), true);
    if (hero !== game.hero) return true;
    if (r.kind === 'npc') talk(r.n);
    else if (r.kind === 'statue') statuePanel(r.s);
    else sealPanel();
    return true;
  }
  // E chez un invité : les fenêtres s'ouvrent chez lui ; un sceau est demandé à l'hôte.
  function guestUse() {
    const r = reach(P);
    if (!r) return false;
    if (r.kind === 'seal' && BOSS().canSeal(r.i))
      CANAAN_NET.requestAction({ op: 'ext', ext: 'vallee', act: 'seal', id: 's' + r.i });
    else if (r.kind === 'npc') talk(r.n);
    else if (r.kind === 'statue') statuePanel(r.s);
    else sealPanel();
    return true;
  }
  function handle(hero, action) {
    if (action.act === 'seal') {
      const i = Number(String(action.id || '').slice(1));
      const r = reach(hero.player);
      return r?.kind === 'seal' && r.i === i && BOSS().seal(i, hero);
    }
    return MOUNTS().handle(hero, action);
  }
  // Résurrection : un héros tombé dans la vallée se relève devant l'écurie.
  function respawnFor(hero) {
    if (!plan || canaanExtLand(Math.floor(hero.player.x / TS), Math.floor(hero.player.y / TS)) !== land)
      return null;
    return { x: plan.door.x * TS, y: (plan.door.y + 1.4) * TS };
  }

  // ---------------------------------------------------------------- Vie de l'enclos
  // Hasard propre aux chevaux (décor) : ils ne puisent jamais dans celui du jeu, qui reste le même avec ou sans
  // l'extension.
  let horseSeed = 4271;
  const horseRnd = () => {
    horseSeed = (horseSeed * 16807) % 2147483647;
    return horseSeed / 2147483647;
  };
  function stepHorses() {
    if (!plan) return;
    const p = plan.paddock;
    for (const h of plan.horses) {
      h.phase += 0.25;
      if (h.wait > 0) {
        h.wait--;
        continue;
      }
      if (h.tx === null) {
        h.tx = (p.x + 0.8 + horseRnd() * (p.w - 1.6)) * TS;
        h.ty = (p.y + 1 + horseRnd() * (p.h - 1.8)) * TS;
        h.graze = false;
      }
      const dx = h.tx - h.x,
        dy = h.ty - h.y,
        d = Math.hypot(dx, dy);
      if (d < 2) {
        h.tx = null;
        h.wait = 200 + Math.floor(horseRnd() * 400);
        h.graze = horseRnd() < 0.55;
        continue;
      }
      h.x += (dx / d) * 0.45;
      h.y += (dy / d) * 0.45;
      if (Math.abs(dx) > 1) h.face = dx > 0 ? 1 : -1;
    }
  }

  // ---------------------------------------------------------------- Dessin
  const visible = (x, y, m = 320) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
  const inView = () => {
    if (!plan || !land) return false;
    const b = land.box;
    return visible(((b.x0 + b.x1) / 2) * TS, ((b.y0 + b.y1) / 2) * TS, ((b.x1 - b.x0) / 2 + 10) * TS);
  };
  // Noms : même facture que les invitations [E] (sprite-kit.js).
  const label = (c, text, x, y, col) => drawCanaanName(c, text, x, y, col);
  // Sol de l'arène : anneaux de dalles et soleil de mosaïque au centre, peint une fois.
  let arenaFloor = null;
  function floor() {
    if (arenaFloor !== null) return arenaFloor;
    arenaFloor = false;
    if (typeof document === 'undefined') return arenaFloor;
    const R = BOSS().R,
      size = (R * 2 + 2) * 24,
      k = CANAAN_PIXEL_KIT.brush(size, size);
    if (!k.g?.getImageData) return arenaFloor;
    const c0 = size / 2,
      S = ['#efe4c6', '#ddd0ae', '#c6b690', '#9a8a68'];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - c0,
          dy = y + 0.5 - c0,
          d = Math.hypot(dx, dy);
        if (d > (R + 0.45) * 24) continue;
        const ring = Math.floor(d / 14),
          seg = Math.floor(((Math.atan2(dy, dx) / (2 * Math.PI) + 1) * (8 + ring * 6)) % (8 + ring * 6)),
          joint = d % 14 < 1 || ((Math.atan2(dy, dx) / (2 * Math.PI) + 1) * (8 + ring * 6)) % 1 < 0.06;
        let col = joint ? S[3] : S[1 + ((seg + ring) % 2)];
        if (!joint && CANAAN_PIXEL_KIT.hashGrid(seg, ring) > 0.85) col = S[0];
        // Soleil de mosaïque au centre, et bordure de pierre sombre.
        if (d < 30) col = d < 12 ? '#f0c040' : (Math.atan2(dy, dx) * 8) % 1 > 0.5 ? '#e8a830' : '#f4dc80';
        if (d > (R - 0.2) * 24) col = joint ? '#6a604c' : '#8a7e64';
        k.px(x, y, col);
      }
    arenaFloor = makeScaled(k.cv, 2);
    return arenaFloor;
  }
  function makeScaled(src, U) {
    const cv = CANAAN_PIXEL_KIT.makeCanvas(src.width * U, src.height * U),
      g = cv.getContext('2d');
    if (g) {
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, cv.width, cv.height);
    }
    return cv;
  }
  function drawGround(c) {
    if (!inView()) return;
    const art = A();
    // Ponts de pierre sur les ruisseaux de la vallée.
    if (art) {
      const b = land.box,
        x0 = Math.max(b.x0, Math.floor(camX / TS) - 1),
        x1 = Math.min(b.x1, Math.ceil((camX + W) / TS) + 1),
        y0 = Math.max(b.y0, Math.floor(camY / TS) - 1),
        y1 = Math.min(b.y1, Math.ceil((camY + H) / TS) + 1);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          if (!BRIDGE_TILES.has(y * MAPW + x) || canaanExtLand(x, y) !== land) continue;
          // L'Allée des Légendes passe sur le ruisseau d'un seul tenant : ses dalles couvrent le pont.
          if (Math.abs(y - plan.alley.y) <= 1 && x >= plan.alley.x0 - 1 && x <= plan.alley.x1 + 1) continue;
          const row = BRIDGE_TILES.has(y * MAPW + x - 1) || BRIDGE_TILES.has(y * MAPW + x + 1),
            col = BRIDGE_TILES.has((y - 1) * MAPW + x) || BRIDGE_TILES.has((y + 1) * MAPW + x),
            axis = row && !col ? 'h' : col && !row ? 'v' : 'h',
            spr = art.bridge(axis, (x + y) & 1);
          if (spr) c.drawImage(spr, x * TS, y * TS, TS, TS);
        }
      // Dalles de l'Allée des Légendes.
      const al = plan.alley;
      for (let x = al.x0 - 1; x <= al.x1 + 1; x++)
        for (let y = al.y - 1; y <= al.y + 1; y++) {
          if (!visible(x * TS, y * TS, 60)) continue;
          const spr = art.slab((x * 3 + y) % 3 === 0 ? 1 : 0);
          if (spr) c.drawImage(spr, x * TS, y * TS, TS, TS);
        }
    }
    // Sol de l'arène.
    const ar = plan.arena,
      fl = floor();
    if (fl && visible(ar.x * TS, ar.y * TS, fl.width))
      c.drawImage(
        fl,
        Math.round((ar.x + 0.5) * TS - fl.width / 2),
        Math.round((ar.y + 0.5) * TS - fl.height / 2)
      );
    BOSS().drawGround(c);
  }
  // Objets hauts : chacun avec sa ligne de pied (occlusion) et son dessin.
  function things() {
    const art = A();
    if (!art || !plan) return [];
    const out = [],
      U = art.U;
    const st = plan.stable,
      sspr = art.stable();
    if (sspr) {
      const x = st.x * TS + (7 * TS - sspr.width) / 2,
        base = (st.y + 6) * TS;
      out.push({
        x0: x,
        x1: x + sspr.width,
        y0: base - sspr.height,
        base: base - 8,
        draw: g => {
          g.drawImage(sspr, Math.round(x), Math.round(base - sspr.height));
          const l = art.lantern();
          if (l) g.drawImage(l, Math.round(x + 48 * U), Math.round(base - sspr.height + 64 * U));
          if (typeof canaanLight === 'function')
            canaanLight(x + 52 * U, base - sspr.height + 72 * U, 110, '#ffd27a');
        }
      });
    }
    for (const s of [...plan.statues, plan.aurora]) {
      const lit = s.special && (game.mode === 'guest' ? remoteLit : game.heroes.some(titled));
      const spr = art.statue(s.pose || 0, !!s.special);
      if (!spr) continue;
      const x = (s.x + 0.5) * TS - spr.width / 2,
        base = (s.y + 1) * TS;
      out.push({
        x0: x,
        x1: x + spr.width,
        y0: base - spr.height,
        base: base - 10,
        draw: g => {
          g.drawImage(spr, Math.round(x), Math.round(base - spr.height));
          if (lit) {
            if (typeof canaanLight === 'function')
              canaanLight(x + spr.width / 2, base - spr.height / 2, 170, '#ffe07a');
            g.save();
            g.globalAlpha = 0.25 + 0.15 * Math.sin(time * 0.06);
            g.fillStyle = '#fff2a8';
            g.beginPath();
            g.arc(x + spr.width / 2, base - spr.height + 14, 26, 0, Math.PI * 2);
            g.fill();
            g.restore();
          }
        }
      });
    }
    plan.arena.statues.forEach((s, i) => {
      const state = BOSS().statueState(i),
        spr = art.arenaStatue(state > 0);
      if (!spr) return;
      const x = (s.x + 0.5) * TS - spr.width / 2,
        base = (s.y + 1) * TS;
      out.push({
        x0: x,
        x1: x + spr.width,
        y0: base - spr.height,
        base: base - 10,
        draw: g => {
          g.drawImage(spr, Math.round(x), Math.round(base - spr.height));
          if (state > 0 && typeof canaanLight === 'function')
            canaanLight(
              x + spr.width / 2,
              base - spr.height + 22,
              state === 2 ? 200 : 120,
              state === 2 ? '#ffffff' : '#ffd86a'
            );
          if (state === 2) {
            g.save();
            g.globalAlpha = 0.5;
            g.fillStyle = '#fff6c0';
            g.fillRect(Math.round(x + spr.width / 2 - 3), Math.round(base - spr.height - 60), 6, 60);
            g.restore();
          }
        }
      });
    });
    const mill = art.mill(),
      sail = art.sail();
    for (const m of plan.mills) {
      if (!mill) break;
      const x = (m.x + 1) * TS - mill.width / 2,
        base = (m.y + 2) * TS;
      out.push({
        x0: x - 40,
        x1: x + mill.width + 40,
        y0: base - mill.height - 60,
        base: base - 12,
        draw: g => {
          g.drawImage(mill, Math.round(x), Math.round(base - mill.height));
          if (!sail) return;
          const hx = x + 22 * U,
            hy = base - mill.height + 22 * U,
            a = time * 0.012 + m.x;
          g.save();
          g.imageSmoothingEnabled = false;
          g.translate(Math.round(hx), Math.round(hy));
          for (let i = 0; i < 4; i++) {
            g.save();
            g.rotate(a + (i * Math.PI) / 2);
            g.drawImage(sail, -sail.width / 2, -sail.height);
            g.restore();
          }
          g.fillStyle = '#4a2e18';
          g.fillRect(-4, -4, 8, 8);
          g.restore();
        }
      });
    }
    return out;
  }
  // Clôture de l'enclos : rangée du fond, chevaux, puis rangée de devant ; et les poteaux des côtés.
  function drawPaddock(c) {
    const art = A(),
      p = plan.paddock;
    if (!art || !visible((p.x + p.w / 2) * TS, (p.y + p.h / 2) * TS, p.w * TS)) return;
    const post = art.post(),
      rail = art.rail();
    if (!post || !rail) return;
    const row = y => {
      for (let x = p.x; x < p.x + p.w; x++) c.drawImage(rail, x * TS, y * TS - 26, TS, 16);
      for (let x = p.x; x <= p.x + p.w; x++) c.drawImage(post, x * TS - 5, y * TS - 30);
    };
    const sides = () => {
      for (let y = p.y; y < p.y + p.h; y++)
        for (const x of [p.x, p.x + p.w]) {
          c.drawImage(post, x * TS - 5, y * TS - 30);
          c.drawImage(post, x * TS - 5, (y + 0.5) * TS - 30);
        }
    };
    row(p.y);
    sides();
    const horses = plan.horses.slice().sort((a, b) => a.y - b.y);
    for (const h of horses) {
      const moving = h.tx !== null && h.wait <= 0,
        frame = moving ? Math.floor(h.phase * 0.25) % 4 : -1,
        swish = Math.round(Math.sin(time * 0.04 + h.x) * 1.5),
        spr = art.HORSE.side(h.M, frame, { graze: !moving && h.graze, swish });
      if (!spr) continue;
      const H = art.HORSE.SIDE,
        top = Math.round(h.y + 18 - H.ground);
      c.save();
      if (h.face < 0) {
        c.translate(Math.round(h.x), 0);
        c.scale(-1, 1);
        c.drawImage(spr, -H.saddleX, top);
      } else c.drawImage(spr, Math.round(h.x - H.saddleX), top);
      c.restore();
      if (h.M.glow && typeof canaanLight === 'function') canaanLight(h.x, h.y, 60, h.M.glow);
    }
    row(p.y + p.h);
  }
  function drawPerson(c, n) {
    const x = n.x * TS,
      y = n.y * TS;
    if (!visible(x, y, 80)) return;
    const look = sanitizeLook(n.look),
      spr = canaanHeroSprite(look, 0, 0, { tool: 'none' });
    c.drawImage(
      spr,
      Math.round(x - 26 - (spr.padX || 0)),
      Math.round(y + 18 - 60 - (spr.padY || 0)),
      spr.width,
      spr.height
    );
    if (Math.hypot(P.x - x, P.y - y) < 220) {
      label(c, tt(n.name), x, y - 62);
      if (Math.hypot(P.x - x, P.y - y) < 110) drawCanaanPrompt(c, '[E] ' + tt('Parler'), x, y - 80);
    }
  }
  function drawWorld(c) {
    if (!inView()) return;
    drawPaddock(c);
    for (const t of things()) if (visible((t.x0 + t.x1) / 2, t.base, 400)) t.draw(c);
    for (const n of plan.people) drawPerson(c, n);
    // Invitations près des statues et des sceaux.
    const r = reach(P);
    if (r?.kind === 'statue')
      drawCanaanPrompt(c, '[E] ' + tt('Lire la plaque'), (r.s.x + 0.5) * TS, (r.s.y + 1) * TS - 120);
    if (r?.kind === 'seal' && BOSS().canSeal(r.i))
      drawCanaanPrompt(
        c,
        '[E] ' + tt('Activer le sceau'),
        (plan.arena.statues[r.i].x + 0.5) * TS,
        (plan.arena.statues[r.i].y + 1) * TS - 140
      );
  }
  function occluders() {
    if (!inView()) return [];
    return things().filter(t => visible((t.x0 + t.x1) / 2, t.base, 200));
  }
  function draw(c, layer) {
    if (!plan) return;
    if (layer === 'ground') drawGround(c);
    else if (layer === 'world') drawWorld(c);
    else if (layer === 'air' && inView()) BOSS().drawAir(c);
  }

  // ---------------------------------------------------------------- Cartes
  function mapPaint(g, px) {
    if (!plan) return;
    const box = (x, y, w, h, col) => {
      g.fillStyle = '#1a120b';
      g.fillRect(x * px - 1, y * px - 1, w * px + 2, h * px + 2);
      g.fillStyle = col;
      g.fillRect(x * px, y * px, w * px, h * px);
    };
    box(plan.stable.x, plan.stable.y + 2, 7, 4, '#b04a36');
    const p = plan.paddock;
    g.strokeStyle = '#7a5634';
    g.lineWidth = 1;
    g.strokeRect(p.x * px + 0.5, p.y * px + 0.5, p.w * px - 1, p.h * px - 1);
    for (const s of [...plan.statues, plan.aurora]) box(s.x, s.y, 1, 1, s.special ? '#f0d060' : '#d8d0bc');
    for (const m of plan.mills) box(m.x, m.y, 2, 2, '#d8d0bc');
    const ar = plan.arena,
      R = BOSS().R;
    g.strokeStyle = '#8a7e64';
    g.lineWidth = 2;
    g.beginPath();
    g.arc((ar.x + 0.5) * px, (ar.y + 0.5) * px, (R + 0.3) * px, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#f0c040';
    g.beginPath();
    g.arc((ar.x + 0.5) * px, (ar.y + 0.5) * px, 2 * px, 0, Math.PI * 2);
    g.fill();
  }
  function markers() {
    if (!plan) return [];
    return [
      { kind: 'shop', x: plan.door.x, y: plan.door.y, name: tt('Écurie des Héros') },
      {
        kind: 'ruins',
        x: (plan.alley.x0 + plan.alley.x1) / 2,
        y: plan.alley.y,
        name: tt('Allée des Légendes')
      }
    ];
  }

  // ---------------------------------------------------------------- Extension
  const ui = {
    talk: id => {
      const n = plan?.people.find(p => p.id === id);
      if (n) talk(n);
    },
    ...MOUNTS().ui
  };
  CANAAN_EXT.register({
    id: 'vallee',
    afterWorld: build,
    step() {
      stepHorses();
      MOUNTS().step();
      BOSS().step();
    },
    draw,
    occluders,
    blocked,
    interact,
    guestUse,
    handle,
    ui,
    respawnFor,
    speed: hero => MOUNTS().speed(hero),
    heroBody: (hero, body, face, moving, phase) => MOUNTS().heroBody(hero, body, face, moving, phase),
    view: idOf => ({ m: MOUNTS().view(idOf), b: BOSS().view(), lit: game.heroes.some(titled) ? 1 : 0 }),
    apply(data, heroOf) {
      MOUNTS().apply(data?.m, heroOf);
      BOSS().apply(data?.b);
      remoteLit = !!data?.lit;
    },
    key: action => MOUNTS().key(action),
    bossKilled: (m, hero) => BOSS().bossKilled(m, hero),
    spawnBosses: () => BOSS().spawnBosses(),
    collectionTabs: () => MOUNTS().collectionTabs(),
    mapPaint,
    markers
  });
  window.CANAAN_VALLEY = Object.freeze({
    plan: () => plan,
    nearStable: p => !!plan && near(p, plan.door.x, plan.door.y - 0.6, 2.6),
    reach,
    LEGENDS,
    AURORA
  });
})();
