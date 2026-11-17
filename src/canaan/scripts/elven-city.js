// Sylvaëlle, la Cité des Elfes : au cœur de l'île, dans la palissade de troncs (plan : CANAAN_CITY_PLAN, posé par
// world-generation.js). Une cité sûre de niveau 60 : un garde ne laisse passer la porte (cachée derrière le lac, au
// sud-ouest) qu'aux héros de niveau 60. Dedans : place et fontaine-arbre, rues de marbre, bâtiments elfiques
// (building-art.js), le Grand Arbre Ylvarë au visage vivant (histoire et bénédiction quotidienne), l'armurerie
// (équipement de niveau 60 à choisir), l'atelier de la Tisseuse (apparences elfiques), la demeure de la Reine Elwë,
// des jardins (massifs, statues, nichoirs, étangs aux cygnes), des elfes qui flânent, des cerfs blancs, une licorne,
// des renards sylvestres, des paons blancs, des lapins, des chouettes, des colibris, des fées et des lucioles.
// L'art de la cité est peint par elven-art.js.
(() => {
  'use strict';
  const U = 2;
  const plan = () => window.CANAAN_CITY_PLAN || null;
  const near = (p, x, y, r) => Math.hypot(p.x / TS - x, p.y / TS - y) < r;
  const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Toile en pixels d'art (1 pixel d'art = U pixels d'écran), cernée d'encre ensuite.
  function art(w, h, fn) {
    const cv = document.createElement('canvas');
    cv.width = w * U;
    cv.height = h * U;
    const g = cv.getContext('2d');
    if (!g || !g.fillRect) return null;
    g.scale(U, U);
    const R = (x, y, ww, hh, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh));
    };
    fn(R, g);
    return typeof canaanOutline === 'function' ? canaanOutline(cv, 2) : cv;
  }
  const hsh = (a, b, s = 0) => {
    const n = Math.sin(a * 127.1 + b * 311.7 + s * 71.3) * 43758.5453;
    return n - Math.floor(n);
  };

  // ---------------------------------------------------------------- Palissade de troncs
  // Trois troncs taillés en pointe, écorce striée, cernes au sommet, cordages, mousse au pied ; trois variantes.
  function palisade(v) {
    return art(24, 44, R => {
      const logs = [
        [1, 6 + (v === 1 ? 2 : 0)],
        [9, 2],
        [17, 5 - (v === 2 ? 2 : 0)]
      ];
      for (const [x, top] of logs) {
        const bark = ['#a87444', '#8a5a32', '#6a4224', '#4a2e18'];
        R(x, top + 4, 7, 44 - top - 4, bark[1]);
        R(x, top + 4, 2, 44 - top - 4, bark[0]);
        R(x + 5, top + 4, 2, 44 - top - 4, bark[2]);
        for (let y = top + 7; y < 42; y += 5) R(x + 2 + ((y + x) % 3), y, 1, 3, bark[3]);
        // Pointe taillée et cernes.
        R(x + 1, top + 2, 5, 2, bark[1]);
        R(x + 2, top, 3, 2, bark[1]);
        R(x + 3, top - 1, 1, 1, bark[2]);
        R(x + 2, top + 2, 3, 1, '#d8b080');
        // Cordages.
        for (const ry of [top + 11, 33]) {
          R(x, ry, 7, 2, '#c8a868');
          R(x, ry + 1, 7, 1, '#8a7040');
        }
      }
      // Mousse et herbes au pied.
      for (let x = 0; x < 24; x += 2) R(x, 41 - ((x * 7) % 3), 2, 3, x % 4 ? '#4e8a3a' : '#6aaa4a');
      if (v === 2)
        for (let y = 14; y < 40; y += 3) {
          R(10 + Math.round(Math.sin(y * 0.5) * 2), y, 2, 2, '#4e8a3a');
          if (y % 9 === 2) R(12, y, 1, 1, '#f6b0e8');
        }
      if (v === 1) {
        // Feuille d'or gravée : la marque de Sylvaëlle.
        R(10, 20, 5, 2, '#f0d060');
        R(11, 18, 3, 6, '#f0d060');
        R(12, 17, 1, 8, '#c8a038');
      }
    });
  }
  function registerDecor() {
    if (typeof document === 'undefined' || typeof PIXEL_DECOR === 'undefined') return;
    ['palisade', 'palisade2', 'palisade3'].forEach((name, v) => {
      const s = palisade(v);
      if (s) PIXEL_DECOR[name] = s;
    });
  }
  registerDecor();

  // ---------------------------------------------------------------- Habitants
  const ELF = (sex, skin, hairStyle, hair, wear) => ({
    sex,
    race: 'elfe',
    skin,
    hairStyle,
    hair,
    eyes: '#3a9a4a',
    outfit: 'foret',
    wear
  });
  let folk = null,
    animals = null;
  function setup() {
    const P0 = plan();
    if (!P0 || folk) return;
    const g = P0.gate,
      side = { x: -g.dir.y, y: g.dir.x },
      arm = P0.buildings.find(b => b.id === 'elfe_armurerie'),
      cou = P0.buildings.find(b => b.id === 'elfe_couture');
    folk = [
      {
        kind: 'guard',
        name: 'Garde de Sylvaëlle',
        x: g.out.x + side.x * 2,
        y: g.out.y + side.y * 2,
        look: ELF('m', '#f6dcc8', 'long', '#e8d9a8', 'elfe_gardien'),
        tool: 'spear',
        face: 0
      },
      {
        kind: 'guardIn',
        name: 'Garde de Sylvaëlle',
        x: g.in.x - side.x * 2,
        y: g.in.y - side.y * 2,
        look: ELF('f', '#e9c9a8', 'queue', '#c9a24a', 'elfe_gardien'),
        tool: 'spear',
        face: 0
      },
      {
        kind: 'armurier',
        name: 'Thalion, l’armurier',
        x: arm ? arm.x + 2.5 : P0.center.x + 3,
        y: arm ? arm.y + arm.h + 1.2 : P0.center.y + 6,
        look: ELF('m', '#e9c9a8', 'court', '#2a1f1a', 'elfe_rodeur'),
        tool: 'none',
        face: 0
      },
      {
        kind: 'tisseuse',
        name: 'Elwyn, la Tisseuse',
        x: cou ? cou.x + 2.5 : P0.center.x - 3,
        y: cou ? cou.y + cou.h + 1.2 : P0.center.y + 6,
        look: ELF('f', '#f6dcc8', 'long', '#e8e8e0', 'elfe_mage'),
        tool: 'none',
        face: 0
      }
    ];
    // Dans les bâtiments (house.js) : les marchands derrière leur comptoir, la Reine sur son trône, la cour, le
    // tavernier et ses clients, la prêtresse, l'astronome et les habitants des maisons (cases de chaque pièce).
    const R0 = id => (typeof CANAAN_ROOMS !== 'undefined' ? CANAAN_ROOMS.find(r => r.id === id) : null),
      inside = (id, lx, ly, n) => {
        const r = R0(id);
        return r ? { ...n, room: id, x: r.x + lx, y: r.y + ly } : null;
      };
    for (const [kind, id, lx, ly] of [
      ['armurier', 'sylv_armurerie', 6.5, 2.6],
      ['tisseuse', 'sylv_couture', 4.5, 4.4]
    ]) {
      const n = folk.find(v => v.kind === kind),
        r = R0(id);
      if (n && r) Object.assign(n, { room: id, x: r.x + lx, y: r.y + ly });
    }
    folk.push(
      ...[
        inside('sylv_palais', 8.5, 3.2, {
          kind: 'reine',
          name: 'Elwë, Reine de Sylvaëlle',
          look: ELF('f', '#f6dcc8', 'long', '#f4ecd0', 'elfe_reine'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_palais', 5.5, 4.4, {
          kind: 'cour',
          name: 'Dame Aelin',
          look: ELF('f', '#e9c9a8', 'tresses', '#c9a24a', 'elfe_mage'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_palais', 11.5, 4.4, {
          kind: 'cour',
          name: 'Seigneur Calen',
          look: ELF('m', '#f6dcc8', 'long', '#e8d9a8', 'elfe_gardien'),
          tool: 'spear',
          face: 0
        }),
        inside('sylv_taverne', 5.5, 2.6, {
          kind: 'indoor',
          name: 'Fëanwë, le tavernier',
          look: ELF('m', '#e9c9a8', 'queue', '#3a7a4a', 'fleurs'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_taverne', 1.6, 5.4, {
          kind: 'indoor',
          name: 'Lindir',
          look: ELF('m', '#c9a0d8', 'long', '#e8e8e0', 'elfe_rodeur'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_taverne', 10.4, 5.4, {
          kind: 'indoor',
          name: 'Merilwen',
          look: ELF('f', '#f6dcc8', 'long', '#6a8ad8', 'elfe_mage'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_temple', 6.5, 3.8, {
          kind: 'indoor',
          name: 'Ithilië, prêtresse de la Lune',
          look: ELF('f', '#a8b8e0', 'long', '#e8e8f0', 'elfe_mage'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_tour', 7.6, 3.6, {
          kind: 'indoor',
          name: 'Elrohen, l’astronome',
          look: ELF('m', '#f6dcc8', 'long', '#e8e8e0', 'elfe_mage'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_maison', 8.5, 4.6, {
          kind: 'indoor',
          name: 'Nimloth',
          look: ELF('f', '#e9c9a8', 'queue', '#e8d9a8', 'fleurs'),
          tool: 'none',
          face: 0
        }),
        inside('sylv_racines', 9.5, 4.2, {
          kind: 'indoor',
          name: 'Haldir des Racines',
          look: ELF('m', '#e9c9a8', 'court', '#3a7a4a', 'elfe_rodeur'),
          tool: 'none',
          face: 0
        })
      ].filter(Boolean)
    );
    // La garde royale, devant la demeure de la Reine.
    const pal = P0.buildings.find(b => b.id === 'elfe_palais');
    if (pal) {
      const dx = pal.x + pal.w / 2,
        dy = pal.y + pal.h + 1.4;
      for (const s of [-1, 1])
        folk.push({
          kind: 'garde',
          name: 'Garde royal',
          x: dx + s * 2.2,
          y: dy - 0.3,
          look: ELF(s < 0 ? 'm' : 'f', '#e9c9a8', 'long', '#e8d9a8', 'elfe_gardien'),
          tool: 'spear',
          face: 0
        });
    }
    // Elfes qui flânent dans les rues.
    const walkers = [
      ELF('f', '#f6dcc8', 'tresses', '#c9a24a', 'elfe_mage'),
      ELF('m', '#c9a0d8', 'long', '#e8e8e0', 'elfe_rodeur'),
      ELF('f', '#a8b8e0', 'long', '#6a8ad8', 'elfe_reine'),
      ELF('m', '#e9c9a8', 'queue', '#3a7a4a', 'elfe_rodeur'),
      ELF('f', '#e9c9a8', 'queue', '#e8d9a8', 'fleurs'),
      ELF('m', '#f6dcc8', 'court', '#c9a24a', 'elfe_mage')
    ];
    const names = ['Lúthiel', 'Aerendil', 'Nimrielle', 'Galdor', 'Ithilwen', 'Faelar'];
    walkers.forEach((look, k) => {
      const a = (k / walkers.length) * Math.PI * 2;
      folk.push({
        kind: 'walker',
        name: names[k],
        x: P0.center.x + Math.cos(a) * 9,
        y: P0.center.y + Math.sin(a) * 9,
        look,
        tool: 'none',
        face: 0,
        tx: null,
        ty: null,
        wait: k * 40
      });
    });
    animals = [];
    const spot = k => {
      for (let t = 0; t < 60; t++) {
        const a = hsh(k, t, 5) * Math.PI * 2,
          r = 6 + hsh(t, k, 6) * 20,
          x = P0.center.x + Math.cos(a) * r,
          y = P0.center.y + Math.sin(a) * r;
        if (P0.inside(Math.floor(x), Math.floor(y)) && tileAt(Math.floor(x), Math.floor(y)) === 1)
          return { x, y };
      }
      return { x: P0.center.x + 4, y: P0.center.y + 8 };
    };
    for (const [kind, n, speed] of [
      ['stag', 2, 0.018],
      ['unicorn', 1, 0.022],
      ['rabbit', 4, 0.03],
      ['fox', 3, 0.028],
      ['peacock', 3, 0.012]
    ])
      for (let i = 0; i < n; i++) {
        const s = spot(animals.length + 1);
        animals.push({
          kind,
          x: s.x,
          y: s.y,
          tx: s.x,
          ty: s.y,
          speed,
          face: 1,
          step: 0,
          rest: 60 + i * 50,
          seed: animals.length
        });
      }
    // Deux cygnes par étang, qui glissent en rond.
    for (const pond of (P0.props || []).filter(p => p.kind === 'pond'))
      for (let i = 0; i < 2; i++)
        animals.push({ kind: 'swan', pond, ang: i * Math.PI, dir: i ? -1 : 1, perch: true });
    // Chouettes perchées au bord du Grand Arbre et sur la tour.
    const t = P0.tree,
      tour = P0.buildings.find(b => b.id === 'elfe_tour');
    animals.push({ kind: 'owl', x: t.x - 2.6, y: t.y - 3.4, perch: true });
    if (tour) animals.push({ kind: 'owl', x: tour.x + 3.4, y: tour.y + 0.2, perch: true });
  }
  // Un pas de flânerie : vers une case de rue au hasard, en contournant ce qui bloque.
  function wander(e, speed, streets) {
    const P0 = plan();
    if (e.wait > 0) return void e.wait--;
    if (e.tx === null || Math.hypot(e.tx - e.x, e.ty - e.y) < 0.2) {
      for (let t = 0; t < 30; t++) {
        const a = Math.random() * Math.PI * 2,
          r = 3 + Math.random() * 8,
          x = e.x + Math.cos(a) * r,
          y = e.y + Math.sin(a) * r,
          tile = tileAt(Math.floor(x), Math.floor(y));
        if (P0.inside(Math.floor(x), Math.floor(y)) && (streets ? tile === 2 : tile === 1 || tile === 2)) {
          e.tx = x;
          e.ty = y;
          break;
        }
      }
      e.wait = 60 + Math.floor(Math.random() * 180);
      return;
    }
    const dx = e.tx - e.x,
      dy = e.ty - e.y,
      d = Math.hypot(dx, dy),
      nx = e.x + (dx / d) * speed,
      ny = e.y + (dy / d) * speed;
    if (canWalk(nx * TS, ny * TS) && P0.inside(Math.floor(nx), Math.floor(ny))) {
      e.x = nx;
      e.y = ny;
      e.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 0 : 2;
      e.step = (e.step || 0) + speed * 10;
    } else e.tx = null;
  }

  // ---------------------------------------------------------------- Bénédiction du Grand Arbre
  const BLESS_MS = 30 * 60 * 1000;
  const today = () => new Date().toISOString().slice(0, 10);
  const blessed = hero => !!hero?.blessing && Number(hero.blessing.until) > Date.now();
  // +10 % de dégâts pendant la bénédiction (combat.js).
  const blessMult = hero => (blessed(hero) ? 1.1 : 1);
  function bless(hero) {
    if (hero.blessing?.day === today()) {
      canaanLootNotice(hero, '🌳 Ylvarë : « Je t’ai déjà béni aujourd’hui, jeune pousse. Reviens demain. »');
      return false;
    }
    hero.blessing = { day: today(), until: Date.now() + BLESS_MS };
    hero.netBag = null;
    burst(hero.player.x, hero.player.y - 20, '#c8ffb0', 30);
    canaanLootNotice(
      hero,
      '🌳 Bénédiction du Grand Arbre : +10 % de dégâts et régénération pendant 30 minutes.'
    );
    return true;
  }
  // Régénération douce : 1 % des PV toutes les 3 secondes pendant la bénédiction (hôte).
  function update() {
    if (!started || paused || game.world.instance) return;
    if (game.mode !== 'guest' && time % 180 === 0)
      for (const h of game.heroes)
        if (blessed(h) && !h.player.dead)
          h.player.hp = Math.min(h.player.mhp, h.player.hp + Math.ceil(h.player.mhp * 0.01));
    const P0 = plan();
    if (!P0 || canaanUnder()) return;
    setup();
    if (Math.hypot(P.x / TS - P0.center.x, P.y / TS - P0.center.y) > 60) return;
    for (const n of folk) if (n.kind === 'walker') wander(n, 0.022, true);
    for (const a of animals)
      if (a.kind === 'swan') a.ang += 0.004 * a.dir;
      else if (!a.perch) wander(a, a.speed, false);
  }
  window.CanaanStages.elvenCity = { after: update };
  const LORE = [
    'Avant les hommes, avant le camp et ses feux, il y avait la forêt. J’ai vu naître chaque arbre de cette île, jeune pousse.',
    'Les elfes de Sylvaëlle ont bâti leur cité entre mes racines quand la grande roche s’est ouverte. Ils l’ont ceinte de troncs offerts par la forêt elle-même.',
    'Le Cœur de l’Aurore bat encore sous l’île. Je l’entends, la nuit, comme une source sous la mousse. Les Échos que tu poursuis viennent de lui.',
    'La porte de la cité est cachée derrière le lac : seuls ceux qui ont grandi assez pour voir au-delà des eaux la trouvent.',
    'Les boss qui dorment derrière les murs fissurés gardent les clés de vieux coffres. Je ne sais pas qui les y a mis… mais ils sont plus vieux que moi.',
    'Repose-toi à l’ombre de mes branches. Une fois par jour, je peux te prêter un peu de ma sève.'
  ];
  let loreIndex = 0,
    talkUntil = 0;

  // ---------------------------------------------------------------- Boutiques
  const ARMOR_PRICES = { rare: 2500, epic: 7500 };
  const SLOTS = ['weapon', 'helm', 'shoulders', 'armor', 'gloves', 'boots', 'neck', 'ring', 'artifact'];
  const SLOT_NAMES = {
    weapon: 'Arme',
    helm: 'Heaume',
    shoulders: 'Épaulières',
    armor: 'Cuirasse',
    gloves: 'Gants',
    boots: 'Bottes',
    neck: 'Collier',
    ring: 'Anneau',
    artifact: 'Artefact'
  };
  function buyElvenGear(hero, slot, rarity) {
    const price = ARMOR_PRICES[rarity];
    if (!price || !SLOTS.includes(slot)) return false;
    if (!nearKind(hero.player, 'armurier'))
      return (canaanLootNotice(hero, '🏹 Parle à Thalion, dans la cité, pour acheter.'), false);
    if (hero.player.gold < price) return (canaanLootNotice(hero, '💰 Il faut ' + price + ' or.'), false);
    if (canaanBagUsed(hero) >= canaanBagLimit(hero)) return (canaanLootNotice(hero, '🎒 Sac plein'), false);
    hero.player.gold -= price;
    const item = giveGear(60, 'elfe', rarity === 'epic' ? 'Épique' : 'Rare', hero, slot);
    if (item) item.origin = 'elfique';
    canaanLootNotice(
      hero,
      '🏹 ' +
        SLOT_NAMES[slot] +
        ' de Sylvaëlle (' +
        (rarity === 'epic' ? 'Épique' : 'Rare') +
        ', niveau 60) : −' +
        price +
        ' or.'
    );
    hero.netBag = null;
    return true;
  }
  const shopSkins = () => SKINS.filter(s => s.shop);
  function buySkin(hero, id) {
    const sk = shopSkins().find(s => s.id === id);
    if (!sk) return false;
    if (!nearKind(hero.player, 'tisseuse'))
      return (canaanLootNotice(hero, '👗 Parle à Elwyn, dans la cité, pour acheter.'), false);
    if (CANAAN_WARDROBE.has(hero, id))
      return (canaanLootNotice(hero, '👗 Tu possèdes déjà cette apparence.'), false);
    if (hero.player.gold < sk.shop) return (canaanLootNotice(hero, '💰 Il faut ' + sk.shop + ' or.'), false);
    hero.player.gold -= sk.shop;
    CANAAN_WARDROBE.grant(hero, id);
    return true;
  }
  function shopPanel(kind) {
    const hero = game.hero;
    if (kind === 'armurier') {
      const rows = SLOTS.map(
        s =>
          '<div class="city-row"><b>' +
          SLOT_NAMES[s] +
          '</b><button type="button" data-action="cityBuyGear" data-slot="' +
          s +
          '" data-rarity="rare">Rare · ' +
          ARMOR_PRICES.rare +
          ' or</button><button type="button" class="epic" data-action="cityBuyGear" data-slot="' +
          s +
          '" data-rarity="epic">Épique · ' +
          ARMOR_PRICES.epic +
          ' or</button></div>'
      );
      modernPanel(
        rpgHeader('🏹 Armurerie de Sylvaëlle — Thalion') +
          '<div class="modern-body"><p class="muted">« Un équipement taillé par les elfes, de niveau 60. Choisis la pièce, je m’occupe du reste. » · Ton or : <b>' +
          Math.floor(hero.player.gold) +
          '</b></p><div class="city-shop">' +
          rows.join('') +
          '</div></div>'
      );
    } else {
      const cards = shopSkins().map(sk => {
        const r = GEAR_RARITIES[sk.rarity],
          mine = CANAAN_WARDROBE.has(hero, sk.id);
        return (
          '<div class="city-row" style="--rarity:' +
          r.color +
          '"><b style="color:' +
          r.color +
          '">' +
          esc(sk.name) +
          '</b><span class="muted">' +
          r.name +
          '</span>' +
          (mine
            ? '<span class="muted">Déjà dans ta garde-robe</span>'
            : '<button type="button" data-action="cityBuySkin" data-skin="' +
              sk.id +
              '">' +
              sk.shop +
              ' or</button>') +
          '</div>'
        );
      });
      modernPanel(
        rpgHeader('👗 Atelier de la Tisseuse — Elwyn') +
          '<div class="modern-body"><p class="muted">« Des tenues tissées de fil de lune et de feuilles d’or, qu’on ne trouve nulle part ailleurs. » Elles rejoignent ta garde-robe (V). · Ton or : <b>' +
          Math.floor(hero.player.gold) +
          '</b></p><div class="city-shop">' +
          cards.join('') +
          '</div></div>'
      );
    }
  }
  function treePanel() {
    const hero = game.hero,
      done = hero.blessing?.day === today(),
      left = blessed(hero) ? Math.ceil((hero.blessing.until - Date.now()) / 60000) : 0;
    talkUntil = time + 240;
    modernPanel(
      rpgHeader('🌳 Ylvarë, l’Arbre-Ancien') +
        '<div class="modern-body"><p class="city-lore">« ' +
        esc(LORE[loreIndex % LORE.length]) +
        ' »</p>' +
        '<div class="modern-foot"><button type="button" data-action="cityTreeTalk">💬 Écouter encore</button>' +
        (done
          ? '<span class="muted">' +
            (left
              ? 'Bénédiction active : encore ' + left + ' min.'
              : 'Déjà béni aujourd’hui. Reviens demain.') +
            '</span>'
          : '<button type="button" data-action="cityBless">🍃 Recevoir la bénédiction (+10 % de dégâts et régénération, 30 min)</button>') +
        '</div></div>'
    );
  }
  // ---------------------------------------------------------------- Interactions
  function nearKind(p, kind) {
    setup();
    const n = folk && folk.find(v => v.kind === kind);
    return !!n && near(p, n.x, n.y, 2.4);
  }
  // Ce que le héros a à portée : porte (dehors ou dedans), Grand Arbre, marchands.
  function reach(p) {
    const P0 = plan();
    if (!P0 || game.world.instance || canaanUnder()) return null;
    setup();
    const g = P0.gate;
    if (near(p, g.out.x + 0.5, g.out.y + 0.5, 3) || nearKind(p, 'guard')) return 'gateIn';
    if (near(p, g.in.x + 0.5, g.in.y + 0.5, 3) || nearKind(p, 'guardIn')) return 'gateOut';
    if (near(p, P0.tree.x + 0.5, P0.tree.y + 1.5, 3.4)) return 'tree';
    if (nearKind(p, 'armurier')) return 'armurier';
    if (nearKind(p, 'tisseuse')) return 'tisseuse';
    return null;
  }
  // Passer la porte (l'hôte décide ; un invité ne déplace que lui-même).
  function gate(hero, inward) {
    const P0 = plan(),
      g = P0.gate,
      to = inward ? g.in : g.out;
    if (inward && clampLevel(hero.level) < P0.level) {
      canaanLootNotice(
        hero,
        '🛡️ Garde : « Halte. Seuls les héros de niveau ' +
          P0.level +
          ' entrent à Sylvaëlle. Reviens quand tu seras prêt. »'
      );
      return true;
    }
    const x = (to.x + 0.5) * TS,
      y = (to.y + 0.5) * TS;
    if (hero === game.hero && game.mode !== 'guest') placeGroup(x, y);
    else {
      hero.player.x = x;
      hero.player.y = y;
    }
    canaanLootNotice(
      hero,
      inward
        ? '🌿 Les portes s’ouvrent : bienvenue à Sylvaëlle, la Cité des Elfes.'
        : '🌿 Tu quittes Sylvaëlle.'
    );
    return true;
  }
  // E chez l'hôte (pour lui ou pour un invité) : true si la cité a répondu.
  function interact(hero = game.hero) {
    const what = reach(hero.player);
    if (!what) return false;
    if (what === 'gateIn') return gate(hero, true);
    if (what === 'gateOut') return gate(hero, false);
    // Fenêtres : seulement pour le joueur qui regarde son écran.
    if (hero !== game.hero) return true;
    if (what === 'tree') {
      loreIndex++;
      treePanel();
    } else shopPanel(what);
    return true;
  }
  // Invité : les fenêtres s'ouvrent chez lui, les achats et la porte passent par l'hôte.
  function guestUse() {
    const what = reach(P);
    if (!what) return false;
    if (what === 'gateIn' || what === 'gateOut') CANAAN_NET.requestAction({ op: 'city-gate' });
    else if (what === 'tree') {
      loreIndex++;
      treePanel();
    } else shopPanel(what);
    return true;
  }
  function handle(hero, action) {
    if (action.op === 'city-gate') {
      const what = reach(hero.player);
      return what === 'gateIn' ? gate(hero, true) : what === 'gateOut' ? gate(hero, false) : false;
    }
    if (action.op === 'city-bless')
      return near(hero.player, plan().tree.x + 0.5, plan().tree.y + 1.5, 3.4) && bless(hero);
    if (action.op === 'city-buy') return buyElvenGear(hero, action.slot, action.rarity);
    if (action.op === 'city-skin') return buySkin(hero, action.id);
    return false;
  }
  const act = (op, extra, local) => {
    if (game.mode === 'guest') return CANAAN_NET.requestAction({ op, ...extra });
    const ok = local();
    if (ok) saveGame();
    return ok;
  };
  const actions = {
    talk() {
      loreIndex++;
      treePanel();
    },
    bless: () => act('city-bless', {}, () => bless(game.hero) && (treePanel(), true)),
    buyGear: (slot, rarity) =>
      act(
        'city-buy',
        { slot, rarity },
        () => buyElvenGear(game.hero, slot, rarity) && (shopPanel('armurier'), true)
      ),
    buySkin: id => act('city-skin', { id }, () => buySkin(game.hero, id) && (shopPanel('tisseuse'), true))
  };
  // Résurrection : à la cité pour un héros de niveau 60 tombé dans la Forêt enchantée ou dans la cité.
  function respawnFor(hero) {
    const P0 = plan();
    if (!P0 || clampLevel(hero.level) < P0.level) return null;
    const x = hero.player.x / TS,
      y = hero.player.y / TS;
    if (!P0.inside(Math.floor(x), Math.floor(y)) && regionAt(x, y) !== ZONES[5]) return null;
    return { x: (P0.spawn.x + 0.5) * TS, y: (P0.spawn.y + 0.5) * TS };
  }

  // ---------------------------------------------------------------- Dessins
  // L'art de la cité (Grand Arbre, fontaine-arbre, jardins, animaux) est peint par elven-art.js ; ici la porte, les
  // lanternes et la mise en scène.
  const ART = () => window.CANAAN_ELVEN_ART || null;
  let gateArt = null,
    lampArt = null;
  // Le Grand Arbre est dessiné en pixels de 3 px : il domine la cité.
  const TREE_U = 3;
  function makeGate() {
    return art(84, 76, R => {
      const stone = ['#ffffff', '#f2eee2', '#dcd4c0', '#b4ac98'],
        gold = ['#fff4b0', '#f0d060', '#c8a038', '#8a6a1e'];
      // Piliers à chapiteaux de feuilles.
      for (const px of [4, 70]) {
        R(px, 20, 10, 56, stone[1]);
        R(px, 20, 2, 56, stone[0]);
        R(px + 8, 20, 2, 56, stone[3]);
        R(px - 2, 16, 14, 5, gold[1]);
        R(px - 2, 16, 14, 1, gold[0]);
        for (let i = 0; i < 4; i++) R(px - 3 + i * 4, 12 + (i % 2) * 2, 4, 4, i % 2 ? '#8ad070' : '#5aa850');
        R(px - 2, 72, 14, 4, stone[2]);
      }
      // Arche dorée en feuilles.
      for (let a = 0; a <= 32; a++) {
        const t = (a / 32) * Math.PI,
          x = 42 - Math.cos(t) * 33,
          y = 22 - Math.sin(t) * 18;
        R(x - 2, y - 2, 5, 5, gold[a % 3 === 0 ? 0 : 1]);
        if (a % 4 === 0) R(x - 3, y - 6, 3, 4, '#8ad070');
      }
      R(39, 0, 6, 6, gold[0]);
      R(40, 1, 4, 4, '#9affe0');
      // Battants de bois clair ornés d'une feuille d'or.
      R(14, 24, 56, 52, '#6a4426');
      for (const dx of [16, 43]) {
        R(dx, 26, 25, 50, '#a87a50');
        R(dx, 26, 2, 50, '#c8966a');
        for (let y = 30; y < 74; y += 6) R(dx + 2, y, 21, 1, '#8a5e38');
      }
      R(41, 26, 2, 50, '#4a2e18');
      for (const cx2 of [28, 56]) {
        R(cx2 - 3, 42, 6, 10, gold[1]);
        R(cx2 - 1, 38, 2, 18, gold[2]);
      }
      R(37, 50, 3, 3, gold[0]);
      R(44, 50, 3, 3, gold[0]);
    });
  }
  function makeLamp() {
    return art(12, 40, R => {
      R(5, 8, 2, 32, '#c8ccd8');
      R(5, 8, 1, 32, '#ffffff');
      R(3, 38, 6, 2, '#8a8ea0');
      // Lanterne en feuille, cristal suspendu.
      R(2, 4, 8, 2, '#f0d060');
      R(3, 6, 6, 8, '#bfffee');
      R(4, 7, 2, 5, '#ffffff');
      R(5, 0, 2, 4, '#f0d060');
    });
  }
  // Effets des bâtiments (building-art.js) : lumières, fenêtres qui vacillent, feuilles, pulsations, enseignes.
  function replay(c, fx) {
    for (const v of fx) {
      if (v[0] === 0) canaanLight(v[1], v[2], v[3], v[4]);
      else if (v[0] === 4) {
        c.globalAlpha = 0.15 + 0.1 * Math.sin(time * 0.05 + v[5]);
        c.fillStyle = '#fff0b0';
        c.fillRect(v[1], v[2], v[3], v[4]);
        c.globalAlpha = 1;
      } else if (v[0] === 7)
        for (let k = 0; k < 3; k++) {
          const ph = (time * 0.004 + k / 3 + v[6] * 0.01) % 1;
          c.fillStyle = v[5][k % v[5].length];
          c.globalAlpha = 1 - ph;
          c.fillRect(
            v[1] + ((k * 37 + v[6]) % v[3]) + Math.sin(time * 0.03 + k) * 6,
            v[2] + ph * v[4] * 2,
            4,
            3
          );
          c.globalAlpha = 1;
        }
      else if (v[0] === 8) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.3 + 0.2 * Math.sin(time * 0.06 + v[5]);
        c.fillStyle = v[4];
        c.beginPath();
        c.arc(v[1], v[2], 8, 0, Math.PI * 2);
        c.fill();
        c.restore();
        canaanLight(v[1], v[2], v[3], v[4]);
      } else if (v[0] === 5) {
        c.fillStyle = '#4a2e18';
        c.fillRect(v[1] - 1, v[2], 2, 10);
        c.fillStyle = '#f0d060';
        c.fillRect(v[1] - 9, v[2] + 10 + Math.round(Math.sin(time * 0.03) * 1), 18, 12);
        c.fillStyle = '#6a4426';
        c.fillRect(v[1] - 7, v[2] + 12 + Math.round(Math.sin(time * 0.03) * 1), 14, 8);
      }
    }
  }
  const builtArt = new Map();
  function buildingArt(b) {
    if (!builtArt.has(b))
      builtArt.set(
        b,
        window.CANAAN_BUILDING_ART &&
          CANAAN_BUILDING_ART.paint({ room: { id: b.id } }, b.x * TS, (b.y + b.h) * TS, b.w * TS)
      );
    return builtArt.get(b);
  }
  const visible = (x, y, m = 300) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
  function label(c, text, x, y, col = '#f6e2b1') {
    c.save();
    c.font = 'bold 12px Palatino Linotype, Georgia, serif';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#101b20';
    c.strokeText(text, x, y);
    c.fillStyle = col;
    c.fillText(text, x, y);
    c.restore();
  }
  // Parties fixes, dessinées avant les personnages (passe de profondeur pour passer derrière). Les étangs sont à plat
  // (dessinés d'abord, jamais par-dessus un personnage).
  const parts = [];
  function collect() {
    const P0 = plan(),
      A = ART();
    parts.length = 0;
    if (!P0) return parts;
    const g = P0.gate,
      gx = (g.x + 0.5) * TS,
      gy = (g.y + 1) * TS;
    gateArt ||= makeGate();
    if (gateArt)
      parts.push({
        x0: gx - gateArt.width / 2,
        x1: gx + gateArt.width / 2,
        y0: gy - gateArt.height + 8,
        base: gy,
        draw: c =>
          c.drawImage(gateArt, Math.round(gx - gateArt.width / 2), Math.round(gy - gateArt.height + 8))
      });
    for (const b of P0.buildings) {
      const s = buildingArt(b);
      if (!s) continue;
      parts.push({
        b,
        x0: s.x0 + 40,
        x1: s.x0 + s.canvas.width * s.scale - 40,
        y0: s.y0,
        base: (b.y + b.h) * TS - 4,
        draw: c => c.drawImage(s.canvas, s.x0, s.y0, s.canvas.width * s.scale, s.canvas.height * s.scale),
        s
      });
    }
    const tree = A && A.tree();
    if (tree) {
      const T = A.TREE,
        tx = (P0.tree.x + 0.5) * TS,
        bot = (P0.tree.y + 1) * TS + 24,
        tw = T.w * TREE_U,
        th = T.h * TREE_U;
      parts.push({
        tree: true,
        x0: tx - tw / 2,
        x1: tx + tw / 2,
        y0: bot - th,
        base: bot - 30,
        shadow: 150,
        draw: c => (
          c.drawImage(tree, Math.round(tx - tw / 2), Math.round(bot - th), tw, th),
          A.face(c, tx, bot, TREE_U, time < talkUntil)
        )
      });
    }
    const fount = A && A.fountain();
    if (fount) {
      const F = A.FOUNT,
        wx = (P0.well.x + 1.5) * TS,
        wy = (P0.well.y + 3) * TS;
      parts.push({
        well: true,
        x0: wx - F.w,
        x1: wx + F.w,
        y0: wy - F.h * U,
        base: wy - 10,
        draw: c => (
          c.drawImage(fount, Math.round(wx - F.w), Math.round(wy - F.h * U), F.w * U, F.h * U),
          A.fountainFx(c, wx, wy)
        )
      });
    }
    for (const p of P0.props || []) {
      const spr = A && A.prop(p.kind);
      if (!spr) continue;
      const w = spr.width * U,
        h = spr.height * U;
      if (p.kind === 'pond') {
        const x = p.x * TS,
          y = p.y * TS;
        parts.push({
          prop: p,
          flat: true,
          x0: x,
          x1: x + w,
          y0: y,
          base: y,
          draw: c => (A.pondWater(c, x + w / 2, y + 76, 108, 54), c.drawImage(spr, x, y, w, h))
        });
        continue;
      }
      const X = (p.x + p.w / 2) * TS,
        bot = (p.y + p.h) * TS - 4;
      parts.push({
        prop: p,
        x0: X - w / 2,
        x1: X + w / 2,
        y0: bot - h,
        base: bot,
        shadow: p.kind === 'arch' ? 0 : w / 2.6,
        draw: c => c.drawImage(spr, Math.round(X - w / 2), Math.round(bot - h), w, h)
      });
    }
    lampArt ||= makeLamp();
    if (lampArt)
      for (const l of P0.lamps) {
        const lx = (l.x + 0.5) * TS,
          ly = (l.y + 0.9) * TS;
        parts.push({
          lamp: true,
          x0: lx - 10,
          x1: lx + 10,
          y0: ly - lampArt.height,
          base: ly,
          draw: c => c.drawImage(lampArt, Math.round(lx - lampArt.width / 2), Math.round(ly - lampArt.height))
        });
      }
    parts.sort((a, b) => (b.flat ? 1 : 0) - (a.flat ? 1 : 0) || a.base - b.base);
    return parts;
  }
  // Feuilles d'or qui tombent de la couronne du Grand Arbre.
  function leaves(c, P0) {
    const tx = (P0.tree.x + 0.5) * TS,
      top = (P0.tree.y + 1) * TS - 520;
    for (let k = 0; k < 14; k++) {
      const ph = (time * 0.0025 + k / 14) % 1,
        x = tx - 220 + hsh(k, 4, 7) * 440 + Math.sin(time * 0.02 + k) * 18,
        y = top + 120 + ph * 360;
      c.globalAlpha = Math.min(1, (1 - ph) * 2);
      c.fillStyle = k % 3 ? '#f0d060' : '#fff4b0';
      c.fillRect(Math.round(x), Math.round(y), 4, Math.sin(time * 0.1 + k) > 0 ? 3 : 2);
    }
    c.globalAlpha = 1;
  }
  // Fées : petites lueurs ailées qui tournoient dans les jardins, avec une traînée d'étincelles.
  function pixies(c, P0) {
    for (let k = 0; k < 10; k++) {
      const a = hsh(k, 8, 21) * Math.PI * 2,
        r = 5 + hsh(k, 9, 21) * 18,
        cx = (P0.center.x + Math.cos(a) * r) * TS,
        cy = (P0.center.y + Math.sin(a) * r) * TS,
        t = time * 0.02 + k * 1.7,
        x = cx + Math.cos(t) * 60 + Math.sin(t * 2.3) * 14,
        y = cy - 50 + Math.sin(t * 1.4) * 26,
        col = ['#bfffee', '#f6c8ff', '#fff0a0', '#a8d8ff'][k % 4];
      if (!visible(x, y, 40)) continue;
      for (let i = 1; i < 5; i++) {
        c.globalAlpha = 0.5 - i * 0.1;
        c.fillStyle = col;
        c.fillRect(
          Math.round(cx + Math.cos(t - i * 0.08) * 60 + Math.sin((t - i * 0.08) * 2.3) * 14),
          Math.round(cy - 50 + Math.sin((t - i * 0.08) * 1.4) * 26),
          2,
          2
        );
      }
      const flap = Math.sin(time * 0.6 + k) > 0;
      c.globalAlpha = 0.75;
      c.fillStyle = '#ffffff';
      c.fillRect(Math.round(x) - 5, Math.round(y) - (flap ? 4 : 2), 4, flap ? 4 : 2);
      c.fillRect(Math.round(x) + 3, Math.round(y) - (flap ? 4 : 2), 4, flap ? 4 : 2);
      c.globalAlpha = 1;
      c.fillStyle = col;
      c.fillRect(Math.round(x) - 1, Math.round(y) - 2, 4, 5);
      canaanLight(x, y, 40, col);
    }
  }
  // Colibris qui butinent au-dessus des massifs de fleurs.
  function hummingbirds(c, P0) {
    let n = 0;
    for (const p of P0.props || []) {
      if (p.kind !== 'flowerbed' || n++ > 7) continue;
      const t = time * 0.03 + n * 2,
        x = (p.x + 1) * TS + Math.sin(t) * 26,
        y = p.y * TS + 6 + Math.sin(t * 2.7) * 6,
        f = Math.cos(t) > 0 ? 1 : -1;
      if (!visible(x, y, 30)) continue;
      c.fillStyle = '#3ac8a0';
      c.fillRect(Math.round(x) - 4, Math.round(y), 8, 4);
      c.fillStyle = '#e8486a';
      c.fillRect(Math.round(x) + f * 2, Math.round(y), 2, 2);
      c.fillStyle = '#1a1a1a';
      c.fillRect(Math.round(x) + f * 4, Math.round(y) + 1, f * 5, 1);
      c.globalAlpha = 0.6;
      c.fillStyle = '#d8fff0';
      c.fillRect(Math.round(x) - 2, Math.round(y) - (Math.floor(time / 2) % 2 ? 5 : 2), 4, 3);
      c.globalAlpha = 1;
    }
  }
  // Elfe dessiné (sprite de héros, effets de sa tenue, nom de près).
  function drawElf(c, n) {
    const x = n.x * TS,
      y = n.y * TS;
    if (!visible(x, y, 80)) return;
    const moving = n.kind === 'walker' && n.tx !== null && n.wait <= 0,
      frame = moving ? Math.floor((n.step || 0) * 2) % 4 : 0,
      spr = canaanHeroSprite(n.look, n.kind === 'walker' ? n.face : 0, frame, { tool: n.tool });
    const sk = skinById(n.look.wear);
    if (sk) drawSkinFx(c, sk, x, y, 'under');
    c.drawImage(
      spr,
      Math.round(x - 26 - (spr.padX || 0)),
      Math.round(y + 18 - 60 - (spr.padY || 0)),
      spr.width,
      spr.height
    );
    if (n.kind === 'reine') canaanLight(x, y - 30, 120, '#d8c8ff');
    if (Math.hypot(P.x - x, P.y - y) < 200)
      label(c, n.name, x, y - 62, n.kind === 'walker' || n.kind === 'indoor' ? '#d8f0e0' : '#f6dc98');
  }
  const PROMPTS = {
    armurier: '[E] Armurerie',
    tisseuse: '[E] Atelier de la Tisseuse'
  };
  // Dans un bâtiment de la cité (house.js) : ses habitants et l'invitation à parler aux marchands.
  function drawIndoor(c, room) {
    if (!plan()) return;
    setup();
    c.save();
    c.imageSmoothingEnabled = false;
    for (const n of folk) if (n.room === room.id) drawElf(c, n);
    const what = reach(P);
    if (PROMPTS[what]) label(c, PROMPTS[what], P.x, P.y - 78, '#fff2cb');
    c.restore();
  }
  function draw(c) {
    const P0 = plan(),
      room =
        !game.world.instance && typeof canaanRoomAt === 'function' ? canaanRoomAt(P.x / TS, P.y / TS) : null;
    if (room && room.id.startsWith('sylv_')) return drawIndoor(c, room);
    if (!P0 || game.world.instance || canaanUnder()) return;
    if (Math.hypot(P.x / TS - P0.center.x, P.y / TS - P0.center.y) > 70) return;
    setup();
    c.save();
    c.imageSmoothingEnabled = false;
    for (const p of collect()) {
      if (!visible((p.x0 + p.x1) / 2, p.base, 520)) continue;
      // Ombre au sol.
      if (!p.flat && p.shadow !== 0) {
        c.globalAlpha = 0.28;
        c.fillStyle = '#0a1008';
        c.beginPath();
        c.ellipse(
          (p.x0 + p.x1) / 2,
          p.base - 4,
          p.shadow || (p.x1 - p.x0) / 2.4,
          p.tree ? 30 : 10,
          0,
          0,
          Math.PI * 2
        );
        c.fill();
        c.globalAlpha = 1;
      }
      p.draw(c);
      if (p.s) replay(c, p.s.fx);
      if (p.lamp) canaanLight((p.x0 + p.x1) / 2, p.y0 + 12, 110, '#bfffee');
      if (p.well) canaanLight((p.x0 + p.x1) / 2, p.y0 + 60, 200, '#9fd8ff');
      if (p.prop?.kind === 'statue') canaanLight(p.x0 + 36, p.y0 + 30, 60, '#bfffee');
      if (p.tree) canaanLight((p.x0 + p.x1) / 2, p.y0 + 220, 380, '#e8ffb0');
      if (p.b && Math.hypot(P.x - (p.x0 + p.x1) / 2, P.y - p.base) < 360)
        label(c, p.b.name, (p.x0 + p.x1) / 2, p.s.roofTop - 10);
    }
    // Cygnes sur les étangs.
    for (const a of animals)
      if (a.kind === 'swan') {
        const pd = a.pond,
          x = (pd.x + pd.w / 2) * TS + Math.cos(a.ang) * 70,
          y = (pd.y + 1.6) * TS + Math.sin(a.ang) * 28,
          spr = ART()?.animal('swan', Math.sin(a.ang) * a.dir > 0 ? 3 : 1, 0);
        if (!spr || !visible(x, y, 60)) continue;
        c.globalAlpha = 0.35;
        c.fillStyle = '#e8ffff';
        c.fillRect(Math.round(x - 18), Math.round(y + 4), 36, 2);
        c.globalAlpha = 1;
        c.drawImage(
          spr,
          Math.round(x - spr.width),
          Math.round(y - spr.height * U + 6),
          spr.width * U,
          spr.height * U
        );
      }
    leaves(c, P0);
    // Lucioles et papillons dans toute la cité.
    for (let k = 0; k < 26; k++) {
      const a = hsh(k, 1, 33) * Math.PI * 2,
        r = 4 + hsh(k, 2, 33) * 24,
        x = (P0.center.x + Math.cos(a) * r) * TS + Math.sin(time * 0.01 + k) * 40,
        y = (P0.center.y + Math.sin(a) * r) * TS + Math.cos(time * 0.013 + k * 2) * 30;
      if (!visible(x, y, 40)) continue;
      if (k % 3) {
        c.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.08 + k);
        c.fillStyle = '#e8ffb0';
        c.fillRect(Math.round(x), Math.round(y), 3, 3);
        if (k % 6 === 1) canaanLight(x, y, 30, '#e8ffb0');
      } else {
        const flap = Math.sin(time * 0.4 + k) > 0 ? 2 : 1;
        c.globalAlpha = 1;
        c.fillStyle = ['#f6a0d0', '#fff0a0', '#9affe0', '#c8a8ff'][k % 4];
        c.fillRect(Math.round(x) - flap * 2, Math.round(y), flap * 2, 3);
        c.fillRect(Math.round(x) + 1, Math.round(y), flap * 2, 3);
      }
    }
    c.globalAlpha = 1;
    hummingbirds(c, P0);
    // Animaux qui marchent ou se perchent.
    for (const a of animals) {
      if (a.kind === 'swan') continue;
      const x = a.x * TS,
        y = a.y * TS;
      if (!visible(x, y, 60)) continue;
      const moving = a.tx !== null && a.wait <= 0,
        kind =
          a.kind === 'peacock' && !moving && Math.floor(time / 240 + a.seed) % 3 === 0
            ? 'peacockFan'
            : a.kind,
        spr = ART()?.animal(kind, a.face === 3 ? 3 : 1, moving && Math.floor((a.step || 0) * 2) % 2 ? 1 : 0);
      if (!spr) continue;
      const w = spr.width * U,
        h = spr.height * U;
      if (!a.perch) {
        c.globalAlpha = 0.25;
        c.fillStyle = '#0a1008';
        c.beginPath();
        c.ellipse(x, y + 4, w / 3, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }
      c.drawImage(spr, Math.round(x - w / 2), Math.round(y - h + 6), w, h);
      if (a.kind === 'unicorn') canaanLight(x, y - 30, 80, '#f6c8ff');
      if (a.kind === 'fox') canaanLight(x + (a.face === 3 ? 18 : -18), y - 16, 40, '#9affb0');
    }
    pixies(c, P0);
    // Elfes de la rue : gardes et flâneurs (ceux des bâtiments sont dessinés dedans).
    for (const n of folk) if (!n.room) drawElf(c, n);
    // Invitation à agir.
    const what = reach(P);
    if (what) {
      const text = {
        gateIn: '[E] Demander à entrer (niveau ' + P0.level + ')',
        gateOut: '[E] Sortir de Sylvaëlle',
        tree: '[E] Parler à Ylvarë',
        armurier: '[E] Armurerie',
        tisseuse: '[E] Atelier de la Tisseuse'
      }[what];
      label(c, text, P.x, P.y - 78, '#fff2cb');
    }
    c.restore();
  }
  // Grands objets à redessiner devant un personnage passé derrière (world-look.js) ; jamais les étangs.
  function occluders() {
    const P0 = plan();
    if (
      !P0 ||
      game.world.instance ||
      canaanUnder() ||
      Math.hypot(P.x / TS - P0.center.x, P.y / TS - P0.center.y) > 70
    )
      return [];
    return collect().filter(p => !p.flat && visible((p.x0 + p.x1) / 2, p.base, 200));
  }
  // État de la bénédiction gardé dans la sauvegarde et envoyé à l'invité.
  function blessingOf(raw) {
    const day = typeof raw?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.day) ? raw.day : null,
      until = Number(raw?.until);
    return day && Number.isFinite(until) ? { day, until } : null;
  }
  // La fontaine-arbre (sur les dalles de la place), les étangs et les décors des jardins bloquent le passage (canWalk) ;
  // on passe sous les arches.
  function blocked(px, py) {
    const P0 = plan();
    if (!P0 || game.world.instance || game.world.layer === 'under') return false;
    const w = P0.well,
      x = px / TS,
      y = py / TS;
    if (Math.abs(x - P0.center.x) > 40 || Math.abs(y - P0.center.y) > 40) return false;
    if (x >= w.x + 0.15 && x <= w.x + w.w - 0.15 && y >= w.y + 1.4 && y <= w.y + w.h - 0.1) return true;
    for (const p of P0.props || []) {
      if (p.kind === 'arch') continue;
      const m = p.kind === 'pond' ? 0.25 : 0.1;
      if (
        x >= p.x + m &&
        x <= p.x + p.w - m &&
        y >= p.y + (p.kind === 'pond' ? 0.4 : 0.45) &&
        y <= p.y + p.h - 0.05
      )
        return true;
    }
    return false;
  }
  window.CANAAN_CITY = Object.freeze({
    blocked,
    draw,
    occluders,
    interact,
    guestUse,
    handle,
    actions,
    near: p => !!reach(p),
    respawnFor,
    blessMult,
    blessed,
    blessingOf,
    plan,
    LORE,
    ARMOR_PRICES
  });
})();
