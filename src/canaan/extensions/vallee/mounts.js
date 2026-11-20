// Extension 1 — la Vallée des Héros : les montures.
// - Quatre chevaux à l'Écurie des Héros (data.js) : achetés une fois avec l'or du jeu, pour un personnage (gardés
//   dans sa sauvegarde, hero.ext.vallee.mounts) ; la monture choisie est hero.ext.vallee.active.
// - Touche de la monture (H par défaut, Paramètres → Clavier) : appeler ou renvoyer la monture choisie. Seulement
//   dans le monde ouvert (île, hors des donjons, raids, Arène, Tréfonds et maisons) et hors combat.
// - En selle : vitesse augmentée du bonus de la monture. On descend tout seul en attaquant, en lançant une compétence,
//   en roulant, en étant touché (combat), en tombant, ou en entrant dans un lieu fermé.
// - Coopératif : l'hôte décide (action ext « mount », « buy », « choose ») ; chacun voit les montures de tous.
// - Onglet « Montures » de la fiche du personnage (C) : journal de collection — liste à gauche (obtenues en couleur,
//   les autres grisées), monture sélectionnée en grand à droite avec où l'obtenir (styles communs .collection-*,
//   equipment-style.css, partagés avec la garde-robe).
(() => {
  'use strict';
  const EXT = canaanExtension('vallee'),
    MOUNTS = EXT.mounts,
    BY = Object.fromEntries(MOUNTS.map(m => [m.id, m]));
  const ART = () => window.CANAAN_VALLEY_ART || null;
  const esc = (s, params) => safeGearText(tt(String(s), params));

  // ---------------------------------------------------------------- État d'un héros
  // Montures possédées et monture choisie, vérifiées à chaque lecture (sauvegarde ou réseau non fiables).
  function stateOf(hero) {
    hero.ext ||= {};
    const s = (hero.ext.vallee ||= {});
    s.mounts = Array.isArray(s.mounts) ? [...new Set(s.mounts.filter(id => BY[id]))] : [];
    if (!s.mounts.includes(s.active)) s.active = s.mounts[0] || null;
    return s;
  }
  const owns = (hero, id) => stateOf(hero).mounts.includes(id);
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
        '🐎 Tu n’as pas encore de monture : l’Écurie des Héros en vend, dans la Vallée des Héros.'
      );
      return false;
    }
    if (!rideable(hero)) {
      canaanLootNotice(hero, '🐎 Les montures ne servent que dans le monde ouvert.');
      return false;
    }
    if (CANAAN_RUBIS.inCombat(hero)) {
      canaanLootNotice(hero, '🐎 Impossible d’appeler ta monture en plein combat.');
      return false;
    }
    hero.riding = s.active;
    puff(hero);
    canaanLootNotice(hero, '🐎 ' + tt('{nom} : en selle !', { nom: tt(BY[s.active].name) }));
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
    return hero.riding ? dismount(hero, '🐎 Ta monture repart au pré.') : mount(hero);
  }
  function puff(hero) {
    if (typeof burst === 'function') burst(hero.player.x, hero.player.y + 10, '#e8dcc0', 14);
  }
  // Achat à l'Écurie des Héros : près de la maîtresse d'écurie, assez d'or, une seule fois.
  function buy(hero, id) {
    const M = BY[id];
    if (!M) return false;
    if (!CANAAN_VALLEY.nearStable(hero.player)) {
      canaanLootNotice(hero, '🐎 Parle à Garance, à l’Écurie des Héros, pour acheter une monture.');
      return false;
    }
    if (owns(hero, id)) {
      canaanLootNotice(hero, '🐎 Ce cheval est déjà à toi.');
      return false;
    }
    if (hero.player.gold < M.price) {
      canaanLootNotice(hero, '💰 Il faut ' + M.price + ' or.');
      return false;
    }
    hero.player.gold -= M.price;
    const s = stateOf(hero);
    s.mounts.push(id);
    s.active = id;
    canaanLootNotice(
      hero,
      '🐎 ' +
        tt('{nom} rejoint tes montures (touche {touche}).', {
          nom: tt(M.name),
          touche: CANAAN_KEYS.labelOf('mount')
        })
    );
    return true;
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
      else if ((p.atk || 0) > 0 || p.roll || CANAAN_RUBIS.inCombat(hero))
        dismount(hero, '🐎 Tu sautes de ta monture pour combattre.');
      else if (hero.fishing || CANAAN_GATHER.workView(hero)) dismount(hero);
    }
  }
  const speed = hero => (hero.riding && BY[hero.riding] ? 1 + BY[hero.riding].speed / 100 : 1);

  // ---------------------------------------------------------------- Dessin du cavalier
  // Le héros est soulevé à hauteur de selle ; la monture passe dessous et sa partie avant le recouvre.
  // Profil : galop en quatre images ; de face et de dos : deux images.
  function heroBody(hero, body, face, moving, phase) {
    const M = hero.riding && BY[hero.riding],
      A = ART();
    if (!M || !A) return null;
    const frame = moving ? Math.floor(Math.abs(phase) * 0.42) % 4 : -1,
      swish = Math.round(Math.sin(time * 0.05 + (hero.id?.length || 0)) * 1.4),
      bob = frame === 1 || frame === 3 ? -2 : 0,
      U = A.U,
      glow = M.glow
        ? (c, x, y) => {
            if (typeof canaanLight === 'function') canaanLight(x, y, 70, M.glow);
            if (moving && Math.random() < 0.35)
              particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + 16,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.6,
                life: 26,
                c: M.glow,
                r: 2
              });
          }
        : () => {};
    if (face === 1 || face === 3) {
      const H = A.HORSE.SIDE,
        flip = face === 3,
        put = (c, x, y, spr) => {
          if (!spr) return;
          const top = Math.round(y + 18 - H.ground);
          if (!flip) c.drawImage(spr, Math.round(x - H.saddleX), top);
          else {
            c.save();
            c.translate(Math.round(x), 0);
            c.scale(-1, 1);
            c.drawImage(spr, -H.saddleX, top);
            c.restore();
          }
        };
      return {
        lift: 26 - bob,
        bob: 0,
        under(c, x, y) {
          glow(c, x, y);
          put(c, x, y, A.HORSE.side(M, frame, { saddle: true, swish }));
        },
        over: (c, x, y) => put(c, x, y, A.HORSE.sideFront(M, frame))
      };
    }
    const F = A.HORSE.FRONT,
      side = face === 2 ? 'back' : 'front',
      paint = (c, x, y, part) => {
        const spr = A.HORSE[side](M, part, Math.max(0, frame), true, swish);
        if (spr) c.drawImage(spr, Math.round(x - F.cx), Math.round(y + 18 - F.ground + (frame % 2 ? -U : 0)));
      };
    return {
      lift: 22,
      bob: frame % 2 ? -U : 0,
      under(c, x, y) {
        glow(c, x, y);
        paint(c, x, y, 'under');
      },
      over: (c, x, y) => paint(c, x, y, 'over')
    };
  }

  // ---------------------------------------------------------------- Fenêtres
  const rarityColor = r => GEAR_RARITIES.find(q => q.name === r)?.color || '#d8d0c0';
  // Aperçu d'un cheval pour les fenêtres (image du profil à l'arrêt).
  function preview(M, saddle = false) {
    const spr = ART()?.HORSE.side(M, -1, { saddle });
    let src = '';
    try {
      src = spr?.toDataURL ? spr.toDataURL() : '';
    } catch {
      src = '';
    }
    return src
      ? '<img class="vallee-horse" alt="" src="' + src + '" width="92" height="76">'
      : '<span class="vallee-horse">🐎</span>';
  }
  // Carte d'un cheval à la boutique de l'Écurie des Héros.
  function card(hero, M) {
    const mine = owns(hero, M.id),
      col = rarityColor(M.rarity);
    const action = mine
      ? '<span class="muted">' + esc('Déjà dans ton écurie') + '</span>'
      : '<button type="button" data-action="extAction" data-ext="vallee" data-act="buy" data-id="' +
        M.id +
        '"' +
        (hero.player.gold < M.price ? ' disabled' : '') +
        '>' +
        M.price.toLocaleString('fr-FR') +
        ' ' +
        esc('or') +
        '</button>';
    return (
      '<div class="city-row vallee-mount" style="--rarity:' +
      col +
      '">' +
      preview(M) +
      '<div class="vallee-mount-text"><b style="color:' +
      col +
      '">' +
      esc(M.name) +
      '</b> <span class="muted">' +
      esc(M.rarity) +
      ' · ' +
      esc('+{n} % de vitesse', { n: M.speed }) +
      '</span><br><span class="muted">' +
      esc(M.desc) +
      '</span></div>' +
      action +
      '</div>'
    );
  }
  // Boutique de l'Écurie des Héros.
  function shop() {
    const hero = game.hero;
    modernPanel(
      rpgHeader('🐎 ' + tt('Écurie des Héros — Garance')) +
        '<div class="modern-body"><p class="muted">' +
        esc(
          '« Chaque cheval ici a porté un héros. Choisis le tien : il te suivra partout dans le monde ouvert. » Touche de la monture : {touche}.',
          { touche: CANAAN_KEYS.labelOf('mount') }
        ) +
        ' · ' +
        esc('Ton or') +
        ' : <b>' +
        Math.floor(hero.player.gold).toLocaleString('fr-FR') +
        '</b></p><div class="city-shop">' +
        MOUNTS.map(M => card(hero, M)).join('') +
        '</div></div>'
    );
  }
  // Onglet « Montures » de la fiche du personnage, en journal de collection : la liste à gauche (montures obtenues
  // d'abord, en couleur ; les autres grisées), la monture sélectionnée en grand à droite, avec où l'obtenir.
  let picked = null; // monture affichée à droite (interface locale, jamais envoyée)
  // Où obtenir une monture : son lieu (data.js) et son prix, s'il y en a un.
  function sourceText(M) {
    return (
      esc(M.source || 'Écurie des Héros') +
      (M.price ? ' · ' + esc('{or} or', { or: M.price.toLocaleString('fr-FR') }) : '')
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
      '" data-action="extAction" data-ext="vallee" data-act="pick" data-id="' +
      M.id +
      '">' +
      preview(M, mine) +
      '<span class="collection-name"><b>' +
      esc(M.name) +
      '</b><small>' +
      (mine ? esc(M.rarity) + ' · ' + esc('+{n} % de vitesse', { n: M.speed }) : sourceText(M)) +
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
        '<button type="button" data-action="extAction" data-ext="vallee" data-act="choose" data-id="' +
        M.id +
        '">' +
        esc('Choisir') +
        '</button>';
    else
      action =
        '<b>' +
        esc('✔ Monture choisie') +
        '</b><button type="button" data-action="extAction" data-ext="vallee" data-act="summon">' +
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
      esc('+{n} % de vitesse', { n: M.speed }) +
      '</p><p class="muted">' +
      esc(M.desc) +
      '</p><p class="collection-source">📍 <b>' +
      esc('Où l’obtenir') +
      '</b> : ' +
      sourceText(M) +
      '</p><div class="collection-actions">' +
      action +
      '</div></div>'
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
      (hero.riding ? ' <b>' + esc('🐎 En selle : {nom}', { nom: tt(BY[hero.riding].name) }) + '</b>' : '') +
      '</p><div class="collection"><div class="collection-list"><div class="collection-head">' +
      esc('Montures obtenues') +
      ' <b>' +
      s.mounts.length +
      ' / ' +
      MOUNTS.length +
      '</b></div>' +
      list.map(M => listItem(hero, M, s)).join('') +
      '</div>' +
      detail(hero, BY[picked], s) +
      '</div></div>'
    );
  }
  const charTabs = () => [
    {
      id: 'mounts',
      label: '🐎 ' + tt('Montures'),
      count: stateOf(game.hero).mounts.length + ' / ' + MOUNTS.length,
      section
    }
  ];
  const refresh = () => {
    const shown = document.getElementById('window')?.dataset?.canaanPanel;
    if (CANAAN_VALLEY.nearStable(P) && !shown?.startsWith('character')) shop();
    else if (typeof canaanCharacterSection === 'function' && modalOpen()) canaanCharacterSection('mounts');
  };

  // ---------------------------------------------------------------- Actions (joueur, réseau)
  // L'hôte agit tout de suite ; un invité demande à l'hôte (action ext), qui vérifie et répond par l'état suivant.
  function act(name, id, local) {
    if (game.mode === 'guest') {
      CANAAN_NET.requestAction({ op: 'ext', ext: 'vallee', act: name, id: id ?? null });
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
      canaanCharacterSection('mounts');
    },
    summon: () => ui.mount() && setTimeout(refresh, 120)
  };
  function handle(hero, action) {
    if (action.act === 'buy') return buy(hero, action.id);
    if (action.act === 'choose') return choose(hero, action.id);
    if (action.act === 'mount') return toggle(hero);
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
      own = {};
    for (const hero of game.heroes) {
      if (hero.riding) r[idOf(hero)] = hero.riding;
      if (hero !== game.hero) {
        const s = stateOf(hero);
        own[idOf(hero)] = [s.mounts.join(','), s.active || ''];
      }
    }
    return { r, own };
  }
  function apply(data, heroOf) {
    for (const hero of game.heroes) hero.riding = null;
    for (const [id, m] of Object.entries(data?.r || {})) {
      const hero = heroOf(id);
      if (hero && BY[m]) hero.riding = m;
    }
    // Ses propres montures (pour l'onglet et la boutique) : celles que l'hôte lui connaît.
    for (const [id, [list, active]] of Object.entries(data?.own || {})) {
      const hero = heroOf(id);
      if (hero !== game.hero || typeof list !== 'string') continue;
      hero.ext ||= {};
      hero.ext.vallee = { mounts: list.split(',').filter(m => BY[m]), active: BY[active] ? active : null };
    }
  }

  window.CANAAN_VALLEY_MOUNTS = Object.freeze({
    MOUNTS,
    BY,
    stateOf,
    owns,
    mount,
    dismount,
    toggle,
    buy,
    choose,
    step,
    speed,
    heroBody,
    shop,
    charTabs,
    ui,
    handle,
    key,
    view,
    apply,
    preview
  });
})();
