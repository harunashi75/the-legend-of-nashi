// Montures : des bêtes (et quelques objets enchantés) qui portent le héros plus vite dans le monde ouvert.
// - Celles du jeu sont dans shared/data/mounts.js ; une extension ajoute les siennes (mounts, mountShops de ses données).
// - Achetées une fois par personnage à un marchand de montures (la Ménagerie du camp), ou trouvées (drop) : boss
//   mondiaux, raids, coffres secrets… Gardées dans la sauvegarde du personnage : hero.ext.mounts = { owned, active }.
//   Une monture inconnue de ce build (extension absente) y reste, sans s'afficher.
// - Touche de la monture (H par défaut, Paramètres → Clavier) : appeler ou renvoyer la monture choisie. Seulement
//   dans le monde ouvert (île, hors des donjons, raids, Arène, Tréfonds et maisons) et hors combat.
// - En selle : +40 % de vitesse avec toutes les montures, plus avec une selle (MOUNT_SADDLE_SPEED, de 50 % à 100 %) :
//   les selles se cousent au travail du cuir (leatherworking.js) et s'équipent dans l'onglet Montures (V).
//   hero.ext.mounts.saddles : selles possédées (qualités 1 à 5) ; saddle : celle qui est équipée (0 : aucune). On descend tout seul en attaquant, en lançant une compétence,
//   en roulant, en étant touché (combat), en tombant, ou en entrant dans un lieu fermé.
// - Coopératif : l'hôte décide (action ext « mount », « buy », « choose ») ; chacun voit les montures de tous.
// - Onglet « Montures » des Collections (V) : journal de collection — liste à gauche (obtenues en couleur,
//   les autres grisées), monture sélectionnée en grand à droite avec où l'obtenir (styles communs .collection-*,
//   equipment-style.css, partagés avec la garde-robe).
// - La Ménagerie du Camp de l'Aurore : roulotte et enclos posés par camp-life.js, Oriane la dresseuse, et quelques
//   montures à vendre qui se promènent.
(() => {
  'use strict';
  const packs = canaanExtensionIds().map(canaanExtension);
  const MOUNTS = [...BASE_MOUNTS, ...packs.flatMap(e => e.mounts || [])],
    BY = Object.fromEntries(MOUNTS.map(m => [m.id, m])),
    // Marchands de montures. near(p) : le héros p est-il à leur comptoir ? (posé par setShopNear)
    SHOPS = Object.assign({}, MOUNT_SHOPS, ...packs.map(e => e.mountShops || {})),
    shopNear = {};
  const A = CANAAN_MOUNT_ART;
  const esc = (s, params) => safeGearText(tt(String(s), params));
  const shopMounts = shop => MOUNTS.filter(m => m.shop === shop);
  const sourceOf = M => (M.shop ? SHOPS[M.shop]?.source : M.source) || '';

  // ---------------------------------------------------------------- État d'un héros
  // Montures possédées et monture choisie, vérifiées à chaque lecture (sauvegarde ou réseau non fiables).
  function stateOf(hero) {
    hero.ext ||= {};
    const s = (hero.ext.mounts ||= { owned: [], active: null });
    let owned = Array.isArray(s.owned) ? s.owned : [];
    // Anciennes sauvegardes : les montures étaient rangées dans les données de leur extension.
    for (const id of Object.keys(hero.ext)) {
      const old = hero.ext[id];
      if (id === 'mounts' || !Array.isArray(old?.mounts)) continue;
      owned = [...owned, ...old.mounts];
      s.active ||= old.active;
      delete old.mounts;
      delete old.active;
      if (!Object.keys(old).length) delete hero.ext[id];
    }
    s.owned = [...new Set(owned.filter(id => typeof id === 'string' && /^[a-z]{2,24}$/.test(id)))].slice(
      0,
      200
    );
    const mine = s.owned.filter(id => BY[id]);
    if (!mine.includes(s.active)) s.active = mine[0] || null;
    s.saddles = [
      ...new Set(
        (Array.isArray(s.saddles) ? s.saddles : []).filter(q => Number.isInteger(q) && q >= 1 && q <= 5)
      )
    ].sort();
    if (!s.saddles.includes(s.saddle)) s.saddle = 0;
    return s;
  }
  // Selles : par qualité (0 : aucune), leur identifiant dans les actions réseau.
  const SADDLE_IDS = ['aucune', 'peu_commun', 'rare', 'epique', 'legendaire', 'mythique'];
  const saddleOf = hero => stateOf(hero).saddle || 0;
  const speedOf = hero => MOUNT_SADDLE_SPEED[saddleOf(hero)] || MOUNT_SADDLE_SPEED[0];
  // Une selle cousue rejoint la sellerie ; elle est équipée si elle vaut mieux que celle qu'on porte.
  function addSaddle(hero, q) {
    const s = stateOf(hero);
    if (!(q >= 1 && q <= 5) || s.saddles.includes(q)) return false;
    s.saddles.push(q);
    s.saddles.sort();
    if (q > s.saddle) s.saddle = q;
    hero.netBag = null;
    return true;
  }
  function equipSaddle(hero, q) {
    const s = stateOf(hero);
    if (q !== 0 && !s.saddles.includes(q)) return false;
    s.saddle = q;
    return true;
  }
  // La monture montée porte le tapis de selle à la couleur de la qualité de sa selle.
  const dressed = new Map();
  function withSaddle(M, q) {
    if (!q) return M;
    const key = M.id + '|' + q;
    if (!dressed.has(key))
      dressed.set(
        key,
        Object.freeze({ ...M, id: M.id + 'q' + q, blanket: GEAR_RARITIES[q]?.color || M.blanket })
      );
    return dressed.get(key);
  }
  const ownedOf = hero => stateOf(hero).owned.filter(id => BY[id]);
  const owns = (hero, id) => !!BY[id] && stateOf(hero).owned.includes(id);
  // Monde ouvert seulement : ni instance, ni Tréfonds, ni intérieur de bâtiment, ni héros à terre.
  function rideable(hero) {
    const p = hero.player;
    return (
      !p.dead &&
      !hero.away &&
      !game.world.instance &&
      game.world.layer !== 'under' &&
      !canaanInHouse(p.x / TS, p.y / TS)
    );
  }
  function mount(hero) {
    const s = stateOf(hero);
    if (!s.active) {
      canaanLootNotice(
        hero,
        '🐾 Tu n’as pas encore de monture : Oriane en vend, à la Ménagerie du Camp de l’Aurore.'
      );
      return false;
    }
    if (!rideable(hero)) {
      canaanLootNotice(hero, '🐾 Les montures ne servent que dans le monde ouvert.');
      return false;
    }
    if (CANAAN_ARTEFACTS.inCombat(hero)) {
      canaanLootNotice(hero, '🐾 Impossible d’appeler ta monture en plein combat.');
      return false;
    }
    hero.riding = s.active;
    puff(hero);
    canaanLootNotice(hero, '🐾 ' + tt('{nom} : en selle !', { nom: tt(BY[s.active].name) }));
    return true;
  }
  function dismount(hero, why = '') {
    if (!hero.riding) return false;
    hero.riding = null;
    puff(hero);
    if (why) canaanLootNotice(hero, why);
    return true;
  }
  function toggle(hero) {
    return hero.riding ? dismount(hero, '🐾 Ta monture repart se reposer.') : mount(hero);
  }
  function puff(hero) {
    if (typeof burst === 'function') burst(hero.player.x, hero.player.y + 10, '#e8dcc0', 14);
  }
  // Une monture rejoint le héros (achat ou trouvaille) ; la première est aussitôt choisie.
  function grant(hero, id) {
    if (!BY[id] || owns(hero, id)) return false;
    stateOf(hero).owned.push(id);
    hero.netBag = null;
    return true;
  }
  // Achat : au comptoir de son marchand, assez d'or, une seule fois.
  function buy(hero, id) {
    const M = BY[id];
    if (!M?.shop || !M.price) return false;
    if (!shopNear[M.shop]?.(hero.player)) {
      canaanLootNotice(hero, '🐾 ' + tt(SHOPS[M.shop].far));
      return false;
    }
    if (owns(hero, id)) {
      canaanLootNotice(hero, '🐾 Cette monture est déjà à toi.');
      return false;
    }
    if (hero.player.gold < M.price) {
      canaanLootNotice(hero, '💰 Il faut ' + M.price + ' or.');
      return false;
    }
    hero.player.gold -= M.price;
    grant(hero, id);
    stateOf(hero).active = id;
    canaanLootNotice(
      hero,
      '🐾 ' +
        tt('{nom} rejoint tes montures (touche {touche}).', {
          nom: tt(M.name),
          touche: CANAAN_KEYS.labelOf('mount')
        })
    );
    return true;
  }
  // Trouvailles : chaque monture de cette source encore inconnue du héros tire sa chance (mêmes sources que la
  // garde-robe, plus celles des extensions). Renvoie les montures gagnées.
  function drop(source, hero = game.hero, rnd = Math.random) {
    const won = [];
    for (const M of MOUNTS) {
      if (!M.drop?.sources.includes(source) || owns(hero, M.id) || rnd() >= M.drop.chance) continue;
      grant(hero, M.id);
      won.push(M.id);
      canaanLootNotice(hero, '🌟 ' + tt('MONTURE TROUVÉE : {nom} !', { nom: tt(M.name) }));
      chat(
        'Monture',
        (hero.name ? hero.name + ' — ' : '') + tt('MONTURE TROUVÉE : {nom} !', { nom: tt(M.name) })
      );
      if (typeof burst === 'function') burst(hero.player.x, hero.player.y - 20, rarityColor(M.rarity), 40);
    }
    return won;
  }
  function choose(hero, id) {
    if (!owns(hero, id)) return false;
    stateOf(hero).active = id;
    if (hero.riding) hero.riding = id;
    return true;
  }

  // ---------------------------------------------------------------- Simulation
  function step() {
    if (game.mode === 'guest') return;
    for (const hero of game.heroes) {
      if (!hero.riding) continue;
      const p = hero.player;
      if (!BY[hero.riding] || !owns(hero, hero.riding)) hero.riding = null;
      else if (!rideable(hero)) dismount(hero);
      else if ((p.atk || 0) > 0 || p.roll || CANAAN_ARTEFACTS.inCombat(hero))
        dismount(hero, '🐾 Tu sautes de ta monture pour combattre.');
      else if (hero.fishing || CANAAN_GATHER.workView(hero)) dismount(hero);
    }
  }
  const speed = hero => (hero.riding && BY[hero.riding] ? 1 + speedOf(hero) / 100 : 1);

  // ---------------------------------------------------------------- Dessin du cavalier
  // Le héros est soulevé à hauteur de selle ; la monture passe dessous et sa partie avant le recouvre (mount-art.js).
  // Profil : galop en quatre images ; de face et de dos : deux images. Les montures qui flottent ondulent.
  function heroBody(hero, body, face, moving, phase) {
    const M = hero.riding && BY[hero.riding] && withSaddle(BY[hero.riding], hero.netSaddle ?? saddleOf(hero));
    if (!M) return null;
    const sp = A.speciesOf(M),
      U = A.U,
      seed = hero.id?.length || 0,
      frame = moving ? Math.floor(Math.abs(phase) * 0.42) % 4 : -1,
      swish = Math.round(Math.sin(time * 0.05 + seed) * 1.4),
      flap = Math.floor(time / 8) % 4,
      profile = face === 1 || face === 3,
      // Hauteur au-dessus du sol : vol (hover) ou bond (bounce).
      air =
        (sp.hover ? sp.hover * U + Math.round(Math.sin(time * 0.06 + seed) * 2) * U : 0) +
        (sp.bounce && moving ? -sp.bounce[frame] * U : 0),
      step = !sp.hover && !sp.bounce && (frame === 1 || frame === 3) ? U : 0,
      o = { saddle: true, swish, flap };
    const before = (c, x, y) => {
      if (air) {
        c.save();
        c.globalAlpha *= 0.28;
        c.fillStyle = '#0a0806';
        c.beginPath();
        c.ellipse(x, y + 18, profile ? 34 : 24, 8, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      if (!M.glow) return;
      if (typeof canaanLight === 'function') canaanLight(x, y, 70, M.glow);
      if (moving && Math.random() < 0.35)
        particles.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + 16 - air,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6,
          life: 26,
          c: M.glow,
          r: 2
        });
    };
    const put = (c, x, y, spr, box, flip) => {
      if (!spr) return;
      const top = Math.round(y + 18 - box.ground - air);
      c.save();
      c.imageSmoothingEnabled = false;
      if (M.alpha) c.globalAlpha *= M.alpha;
      if (flip) {
        c.translate(Math.round(x), 0);
        c.scale(-1, 1);
        c.drawImage(spr, -box.x, top);
      } else c.drawImage(spr, Math.round(x - box.x), top);
      c.restore();
    };
    // Assis, les pieds pendent sous la selle ; debout (tapis, nuage), ils sont posés dessus.
    const sit = sp.stand || sp.soft ? sp.seat * U - (sp.soft ? 8 : 0) : Math.max(8, sp.seat * U - 26);
    if (profile) {
      const flip = face === 3,
        f = sp.hover ? (moving ? Math.floor(time / 7) % 4 : -1) : frame;
      return {
        lift: sit + air + step,
        bob: 0,
        under(c, x, y) {
          before(c, x, y);
          put(c, x, y, A.side(M, { ...o, frame: f }), A.SIDE, flip);
        },
        over: (c, x, y) => put(c, x, y, A.sideOver(M, { ...o, frame: f }), A.SIDE, flip)
      };
    }
    const paint = A[face === 2 ? 'back' : 'front'],
      f = sp.hover ? Math.floor(time / 7) % 4 : Math.max(0, frame),
      hop = step ? -U : 0;
    return {
      lift: sit - (sp.stand || sp.soft ? 0 : 4) + air,
      bob: hop,
      under(c, x, y) {
        before(c, x, y);
        put(c, x, y + hop, paint(M, 'under', { ...o, frame: f }), A.FRONT, false);
      },
      over: (c, x, y) => put(c, x, y + hop, paint(M, 'over', { ...o, frame: f }), A.FRONT, false)
    };
  }

  // ---------------------------------------------------------------- Ménagerie du camp
  const ORIANE = {
    name: 'Oriane, dresseuse de montures',
    look: {
      sex: 'f',
      race: 'elfe',
      skin: '#f0c7a0',
      hairStyle: 'queue',
      hair: '#c84a2a',
      eyes: '#3a9a4a',
      outfit: 'foret'
    }
  };
  const REACH = 96;
  // Où se tient Oriane et son enclos, ou null : ménagerie absente, ou ailleurs que sur l'île.
  function place() {
    if (game.world.instance || game.world.layer === 'under') return null;
    return CANAAN_CAMP_LIFE.menagerie();
  }
  function nearMenagerie(p) {
    const m = place();
    return !!m && !canaanInHouse(p.x / TS, p.y / TS) && Math.hypot(p.x - m.x, p.y - m.y) < REACH;
  }
  shopNear.menagerie = nearMenagerie;
  // Montures à vendre qui se promènent dans l'enclos. Hasard propre (décor) : jamais celui du jeu.
  const SHOWN = ['cerf', 'tortue', 'casoar', 'ours'];
  let herd = null,
    herdFor = null,
    herdTick = 0,
    seed = 9137;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // Cadre de promenade de l'enclos (pixels) : entre les clôtures.
  const walk = pen => ({
    x0: (pen.x + 1.1) * TS,
    x1: (pen.x + pen.w - 1.1) * TS,
    y0: (pen.y + 0.95) * TS,
    y1: (pen.y + pen.h - 0.95) * TS
  });
  function stepPen() {
    const m = place();
    if (!m || Math.hypot(P.x - m.x, P.y - m.y) > 1600) return;
    const a = walk(m.pen);
    if (herdFor !== m.pen.x * 1000 + m.pen.y) {
      herdFor = m.pen.x * 1000 + m.pen.y;
      herd = SHOWN.filter(id => BY[id]).map((id, i, all) => ({
        M: BY[id],
        x: a.x0 + ((i + 0.5) / all.length) * (a.x1 - a.x0),
        y: a.y0 + (i % 2 ? 0.8 : 0.2) * (a.y1 - a.y0),
        tx: null,
        ty: null,
        face: i % 2 ? -1 : 1,
        wait: 80 + i * 70,
        phase: 0
      }));
    }
    for (const h of herd) {
      h.phase += 0.25;
      if (h.wait > 0) {
        h.wait--;
        continue;
      }
      if (h.tx === null) {
        h.tx = a.x0 + rnd() * (a.x1 - a.x0);
        h.ty = a.y0 + rnd() * (a.y1 - a.y0);
      }
      const dx = h.tx - h.x,
        dy = h.ty - h.y,
        d = Math.hypot(dx, dy);
      if (d < 2) {
        h.tx = null;
        h.wait = 220 + Math.floor(rnd() * 420);
        continue;
      }
      h.x += (dx / d) * 0.4;
      h.y += (dy / d) * 0.4;
      if (Math.abs(dx) > 1) h.face = dx > 0 ? 1 : -1;
    }
  }
  // Une monture libre (enclos, écurie), de profil ; h : { M, x, y, tx, wait, face, graze, phase }.
  function drawFree(c, h) {
    const moving = h.tx !== null && h.wait <= 0,
      frame = moving ? Math.floor(h.phase * 0.25) % 4 : -1,
      sp = A.speciesOf(h.M),
      spr = A.side(h.M, {
        frame,
        graze: !moving && !!h.graze,
        swish: Math.round(Math.sin(time * 0.04 + h.M.id.length) * 1.5),
        flap: 0
      });
    if (!spr) return;
    const lift = (sp.hover || 0) * A.U + (sp.bounce && moving ? -sp.bounce[frame] * A.U : 0),
      top = Math.round(h.y + 18 - A.SIDE.ground - lift);
    c.save();
    c.imageSmoothingEnabled = false;
    c.save();
    c.globalAlpha *= 0.28;
    c.fillStyle = '#0a0806';
    c.beginPath();
    c.ellipse(h.x, h.y + 18, 30, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    if (h.M.alpha) c.globalAlpha *= h.M.alpha;
    if (h.face < 0) {
      c.translate(Math.round(h.x), 0);
      c.scale(-1, 1);
      c.drawImage(spr, -A.SIDE.x, top);
    } else c.drawImage(spr, Math.round(h.x - A.SIDE.x), top);
    c.restore();
    if (h.M.glow && typeof canaanLight === 'function') canaanLight(h.x, h.y, 60, h.M.glow);
  }
  function draw(c, layer) {
    if (layer !== 'world') return;
    const m = place();
    if (!m || canaanInHouse(P.x / TS, P.y / TS)) return;
    if (Math.abs(m.x - P.x) > W + 400 || Math.abs(m.y - P.y) > H + 500) return;
    // Promenade au rythme du jeu, chez l'hôte comme chez un invité (décor).
    for (let n = Math.min(3, time - herdTick); n > 0; n--) stepPen();
    herdTick = time;
    for (const h of [...(herd || [])].sort((a, b) => a.y - b.y)) drawFree(c, h);
    m.drawFront(c);
    const spr = canaanHeroSprite(sanitizeLook(ORIANE.look), 0, 0, { tool: 'none' });
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(
      spr,
      Math.round(m.x - 26 - (spr.padX || 0)),
      Math.round(m.y + 18 - 60 - (spr.padY || 0)),
      spr.width,
      spr.height
    );
    c.restore();
    if (Math.hypot(P.x - m.x, P.y - m.y) < 220) {
      drawCanaanName(c, tt(ORIANE.name), m.x, m.y - 62);
      if (nearMenagerie(P)) drawCanaanPrompt(c, '[E] ' + tt('Voir les montures'), m.x, m.y - 80);
    }
  }
  function greet() {
    CANAAN_SOUND.voice('Oriane', 'Bienvenue, voyageur !', P.x, P.y);
    shop('menagerie');
  }
  function interact(hero) {
    if (!nearMenagerie(hero.player)) return false;
    if (hero === game.hero) greet();
    return true;
  }
  function guestUse() {
    if (!nearMenagerie(P)) return false;
    greet();
    return true;
  }
  function markers() {
    const m = place();
    return m ? [{ kind: 'shop', x: m.x / TS, y: m.y / TS, name: tt('Ménagerie de l’Aurore') }] : [];
  }

  // ---------------------------------------------------------------- Fenêtres
  const rarityColor = r => GEAR_RARITIES.find(q => q.name === r)?.color || '#d8d0c0';
  // Aperçu d'une monture pour les fenêtres (image du profil à l'arrêt, recadrée).
  function preview(M, saddle = false) {
    const src = A.thumb(M, saddle);
    return src ? '<img class="mount-thumb" alt="" src="' + src + '">' : '<span class="mount-thumb">🐾</span>';
  }
  // Carte d'une monture chez un marchand.
  function card(hero, M) {
    const mine = owns(hero, M.id),
      col = rarityColor(M.rarity);
    const action = mine
      ? '<span class="muted">' + esc('✔ Déjà à toi') + '</span>'
      : '<button type="button" data-action="extAction" data-ext="mounts" data-act="buy" data-id="' +
        M.id +
        '"' +
        (hero.player.gold < M.price ? ' disabled' : '') +
        '>' +
        esc('{or} or', { or: M.price.toLocaleString('fr-FR') }) +
        '</button>';
    return (
      '<div class="mount-card' +
      (mine ? ' owned' : '') +
      '" style="--rarity:' +
      col +
      '"><div class="mount-card-stage">' +
      preview(M) +
      '</div><b style="color:' +
      col +
      '">' +
      esc(M.name) +
      '</b><small>' +
      esc(M.rarity) +
      '</small><p class="muted">' +
      esc(M.desc) +
      '</p>' +
      action +
      '</div>'
    );
  }
  // Boutique d'un marchand de montures.
  let openShop = null;
  function shop(id) {
    const hero = game.hero,
      S = SHOPS[id];
    if (!S) return;
    openShop = id;
    modernPanel(
      rpgHeader('🐾 ' + tt(S.title)) +
        '<div class="modern-body mount-shop panel-scroll" data-panel-size="lg" data-keep-scroll="mount-shop"><p class="muted">' +
        esc(S.quote, { touche: CANAAN_KEYS.labelOf('mount') }) +
        ' · ' +
        esc('Ton or') +
        ' : <b>' +
        Math.floor(hero.player.gold).toLocaleString('fr-FR') +
        '</b></p><div class="mount-cards">' +
        shopMounts(id)
          .map(M => card(hero, M))
          .join('') +
        '</div></div>'
    );
    const win = document.getElementById('window');
    if (win?.dataset) win.dataset.canaanPanel = 'mount-shop';
  }
  // Onglet « Montures » des Collections (V), en journal de collection : la liste à gauche (montures obtenues
  // d'abord, en couleur ; les autres grisées), la monture sélectionnée en grand à droite, avec où l'obtenir.
  let picked = null; // monture affichée à droite (interface locale, jamais envoyée)
  // Où obtenir une monture : son lieu (data.js) et son prix, s'il y en a un.
  function sourceText(M) {
    return (
      esc(sourceOf(M)) + (M.price ? ' · ' + esc('{or} or', { or: M.price.toLocaleString('fr-FR') }) : '')
    );
  }
  function listItem(hero, M, s) {
    const mine = owns(hero, M.id),
      col = rarityColor(M.rarity);
    return (
      '<button type="button" class="collection-item' +
      (mine ? ' owned' : ' locked') +
      (M.id === picked ? ' picked' : '') +
      '" style="--rarity:' +
      col +
      '" data-action="extAction" data-ext="mounts" data-act="pick" data-id="' +
      M.id +
      '">' +
      preview(M, mine) +
      '<span class="collection-name"><b>' +
      esc(M.name) +
      '</b><small>' +
      (mine ? esc(M.rarity) : sourceText(M)) +
      '</small></span><span class="collection-mark">' +
      (!mine ? '🔒' : s.active === M.id ? '★' : '') +
      '</span></button>'
    );
  }
  function detail(hero, M, s) {
    const mine = owns(hero, M.id),
      col = rarityColor(M.rarity),
      key = CANAAN_KEYS.labelOf('mount');
    let action;
    if (!mine) action = '<span class="collection-lock">🔒 ' + esc('Pas encore obtenue') + '</span>';
    else if (s.active !== M.id)
      action =
        '<button type="button" data-action="extAction" data-ext="mounts" data-act="choose" data-id="' +
        M.id +
        '">' +
        esc('Choisir') +
        '</button>';
    else
      action =
        '<b>' +
        esc('✔ Monture choisie') +
        '</b><button type="button" data-action="extAction" data-ext="mounts" data-act="summon">' +
        esc(hero.riding ? 'Renvoyer ({touche})' : 'Appeler ({touche})', { touche: key }) +
        '</button>';
    return (
      '<div class="collection-view' +
      (mine ? '' : ' locked') +
      '" style="--rarity:' +
      col +
      '"><div class="collection-stage">' +
      preview(M, mine) +
      '</div><h3 style="color:' +
      (mine ? col : '#9a948a') +
      '">' +
      esc(M.name) +
      '</h3><p class="collection-sub">' +
      esc(M.rarity) +
      ' · ' +
      esc('+{n} % de vitesse', { n: speedOf(hero) }) +
      '</p><p class="muted">' +
      esc(M.desc) +
      '</p><div class="collection-source">📍 <b>' +
      esc('Où l’obtenir') +
      '</b><div class="collection-chips"><span class="collection-chip">' +
      esc(sourceOf(M)) +
      '</span>' +
      (M.price
        ? '<span class="collection-chip">' +
          esc('{or} or', { or: M.price.toLocaleString('fr-FR') }) +
          '</span>'
        : '') +
      '</div></div><div class="collection-actions">' +
      action +
      '</div></div>'
    );
  }
  // Sellerie : la selle équipée donne sa vitesse à toutes les montures ; les selles se cousent au travail du cuir.
  function saddleBar(hero, s) {
    return (
      '<div class="mount-saddles"><b>⟦saddle⟧ ' +
      esc('Selle') +
      '</b>' +
      MOUNT_SADDLE_SPEED.map((n, q) => {
        const mine = q === 0 || s.saddles.includes(q),
          on = s.saddle === q,
          col = q ? rarityColor(GEAR_RARITIES[q].name) : '#c8c0b0';
        return (
          '<button type="button" class="mount-saddle' +
          (on ? ' on' : '') +
          (mine ? '' : ' locked') +
          '" style="--rarity:' +
          col +
          '" data-action="mountSaddle" data-quality="' +
          q +
          '"' +
          (mine ? '' : ' disabled') +
          ' title="' +
          esc(mine ? '' : 'À coudre au travail du cuir (panneau P)') +
          '"><span>' +
          esc(q ? GEAR_RARITIES[q].name : 'Sans selle') +
          '</span><small>+' +
          n +
          ' %</small></button>'
        );
      }).join('') +
      '</div>'
    );
  }
  function section() {
    const hero = game.hero,
      s = stateOf(hero);
    if (!BY[picked]) picked = s.active || MOUNTS[0].id;
    const list = [...MOUNTS.filter(M => owns(hero, M.id)), ...MOUNTS.filter(M => !owns(hero, M.id))];
    return (
      '<div class="rpg-paper"><p class="muted">' +
      esc(
        'Touche {touche} : appeler ou renvoyer ta monture, dans le monde ouvert et hors combat. On descend de selle en combattant.',
        { touche: CANAAN_KEYS.labelOf('mount') }
      ) +
      (hero.riding ? ' <b>' + esc('🐾 En selle : {nom}', { nom: tt(BY[hero.riding].name) }) + '</b>' : '') +
      '</p>' +
      saddleBar(hero, s) +
      '<div class="collection"><div class="collection-list" data-keep-scroll="mounts"><div class="collection-head">' +
      esc('Montures obtenues') +
      ' <b>' +
      ownedOf(hero).length +
      ' / ' +
      MOUNTS.length +
      '</b></div>' +
      list.map(M => listItem(hero, M, s)).join('') +
      '</div>' +
      detail(hero, BY[picked], s) +
      '</div></div>'
    );
  }
  const collectionTabs = () => [
    {
      id: 'mounts',
      label: '🐾 ' + tt('Montures'),
      count: ownedOf(game.hero).length + ' / ' + MOUNTS.length,
      section
    }
  ];
  const refresh = () => {
    const shown = document.getElementById('window')?.dataset?.canaanPanel;
    if (shown === 'mount-shop' && openShop && shopNear[openShop]?.(P)) shop(openShop);
    else if (typeof canaanCollections === 'function' && modalOpen()) canaanCollections('mounts');
  };

  // ---------------------------------------------------------------- Actions (joueur, réseau)
  // L'hôte agit tout de suite ; un invité demande à l'hôte (action ext), qui vérifie et répond par l'état suivant.
  function act(name, id, local) {
    if (game.mode === 'guest') {
      CANAAN_NET.requestAction({ op: 'ext', ext: 'mounts', act: name, id: id ?? null });
      return true;
    }
    const ok = local();
    if (ok) saveGame();
    return ok;
  }
  const ui = {
    buy: id => act('buy', id, () => buy(game.hero, id)) && setTimeout(refresh, 120),
    choose: id => act('choose', id, () => choose(game.hero, id)) && setTimeout(refresh, 120),
    mount: () => act('mount', null, () => toggle(game.hero)),
    // Onglet Montures : afficher une monture à droite, appeler ou renvoyer la monture choisie.
    pick: id => {
      if (!BY[id]) return;
      picked = id;
      canaanCollections('mounts');
    },
    summon: () => ui.mount() && setTimeout(refresh, 120),
    saddle: q =>
      SADDLE_IDS[q] &&
      act('saddle', SADDLE_IDS[q], () => equipSaddle(game.hero, q)) &&
      setTimeout(refresh, 120)
  };
  function handle(hero, action) {
    if (action.act === 'buy') return buy(hero, action.id);
    if (action.act === 'choose') return choose(hero, action.id);
    if (action.act === 'mount') return toggle(hero);
    if (action.act === 'saddle') return equipSaddle(hero, SADDLE_IDS.indexOf(action.id));
    return false;
  }
  function key(action) {
    if (action !== 'mount') return false;
    ui.mount();
    return true;
  }
  // Réseau : la monture de chaque héros en selle (pour la dessiner chez tous), et les montures de chaque invité.
  function view(idOf) {
    const r = {},
      sd = {},
      own = {};
    for (const hero of game.heroes) {
      if (hero.riding) {
        r[idOf(hero)] = hero.riding;
        if (saddleOf(hero)) sd[idOf(hero)] = saddleOf(hero);
      }
      if (hero !== game.hero) {
        const s = stateOf(hero);
        own[idOf(hero)] = [s.owned.join(','), s.active || '', s.saddles.join(','), s.saddle];
      }
    }
    return { r, sd, own };
  }
  function apply(data, heroOf) {
    for (const hero of game.heroes) [hero.riding, hero.netSaddle] = [null, null];
    for (const [id, m] of Object.entries(data?.r || {})) {
      const hero = heroOf(id),
        q = Number(data?.sd?.[id]) || 0;
      if (hero && BY[m]) [hero.riding, hero.netSaddle] = [m, q >= 0 && q <= 5 ? q : 0];
    }
    // Ses propres montures (pour l'onglet et la boutique) : celles que l'hôte lui connaît.
    for (const [id, [list, active, saddles, saddle]] of Object.entries(data?.own || {})) {
      const hero = heroOf(id);
      if (hero !== game.hero || typeof list !== 'string') continue;
      hero.ext ||= {};
      hero.ext.mounts = {
        owned: list.split(',').filter(Boolean),
        active: BY[active] ? active : null,
        saddles: String(saddles || '')
          .split(',')
          .map(Number),
        saddle: Number(saddle) || 0
      };
      stateOf(hero);
    }
  }

  // Module du jeu de base (core) branché sur les mêmes crochets que les extensions.
  CANAAN_EXT.register({
    id: 'mounts',
    core: true,
    step,
    draw,
    interact,
    guestUse,
    handle,
    ui,
    speed,
    heroBody,
    view,
    apply,
    key,
    collectionTabs,
    markers
  });
  window.CANAAN_MOUNTS = Object.freeze({
    MOUNTS,
    BY,
    SHOPS,
    shopMounts,
    // Une extension dit où est le comptoir de son marchand : near(p).
    setShopNear(id, near) {
      if (SHOPS[id]) shopNear[id] = near;
    },
    stateOf,
    ownedOf,
    addSaddle,
    equipSaddle,
    saddleOf,
    speedOf,
    owns,
    grant,
    drop,
    mount,
    dismount,
    toggle,
    buy,
    choose,
    step,
    speed,
    heroBody,
    drawFree,
    shop,
    collectionTabs,
    ui,
    preview,
    nearMenagerie,
    herd: () => herd
  });
})();
