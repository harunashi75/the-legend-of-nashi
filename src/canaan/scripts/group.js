// Groupe : héros invités de l'aventure (phase 3 du coopératif).
// Les invités sont enregistrés dans la sauvegarde de l'hôte (heros.invites), 6 au plus, 3 présents à la fois.
// En attendant le réseau, un invité créé ici est un compagnon local, piloté par une petite IA : il suit l'hôte,
// combat les monstres proches et se relève quelques secondes après être tombé.
(() => {
  'use strict';
  const GUEST_LIMIT = 6,
    PRESENT_LIMIT = 3,
    REVIVE_TICKS = 600,
    FOLLOW_TILES = 2.5,
    TELEPORT_TILES = 30;
  const COLORS = ['#4fb8ff', '#ff9f43', '#7ee081', '#e477d6', '#f6d55c', '#9b8cff'];
  const ui = { removing: null, message: '' };
  const guests = () => Object.values(game.guests);
  const present = () => game.heroes.filter(h => h !== game.hero);

  // ---------------------------------------------------------------- Création, arrivée, départ
  function starterGear(id) {
    return {
      weapon: {
        id: id + '-epee',
        name: 'Épée de recrue',
        slot: 'weapon',
        level: 1,
        rarity: 'Commun',
        weaponType: 'sword'
      },
      armor: { id: id + '-tunique', name: 'Tunique du voyageur', slot: 'armor', level: 1, rarity: 'Commun' }
    };
  }
  function newId() {
    let id;
    do id = 'local-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    while (game.guests[id]);
    return id;
  }
  // Nouveau compagnon local : équipement de départ porté, rien d'autre. Renvoie le héros ou null.
  function create(pseudo) {
    if (guests().length >= GUEST_LIMIT) return null;
    const id = newId(),
      name =
        cleanAdventureName(pseudo, '?') === 'Aventure ?'
          ? 'Compagnon ' + (guests().length + 1)
          : cleanAdventureName(pseudo, '?'),
      hero = canaanCreateHero({ name, x: P.x, y: P.y, equipment: starterGear(id) });
    hero.id = id;
    hero.local = true;
    hero.color = COLORS[guests().length % COLORS.length];
    // Un compagnon local reçoit une apparence et une classe au hasard.
    hero.look = randomLook(Math.random);
    giveClass(hero);
    game.guests[id] = hero;
    return hero;
  }
  // Classe au hasard d'un compagnon local, et ses talents conseillés.
  function giveClass(hero) {
    hero.classe = { id: CLASS_IDS[Math.floor(Math.random() * CLASS_IDS.length)], talents: [] };
    CANAAN_CLASS.autoTalents(hero);
  }
  // Héros d'un invité en ligne qui arrive pour la première fois : équipement de départ, identifiant de son application.
  function createRemote(id, pseudo, look = null) {
    if (game.guests[id] || guests().length >= GUEST_LIMIT) return game.guests[id] || null;
    const hero = canaanCreateHero({ name: pseudo, x: P.x, y: P.y, equipment: starterGear(id) });
    hero.id = id;
    hero.look = sanitizeLook(look);
    hero.local = false;
    hero.color = COLORS[guests().length % COLORS.length];
    game.guests[id] = hero;
    return hero;
  }
  // Fait venir un invité près de l'hôte (3 présents au plus).
  function join(id) {
    const hero = game.guests[id];
    if (!hero || game.heroes.includes(hero) || present().length >= PRESENT_LIMIT) return false;
    game.heroes.push(hero);
    nearHost(hero);
    hero.player.dead = false;
    hero.player.hp = Math.max(1, hero.player.hp);
    hero.reviveAt = null;
    return true;
  }
  function leave(id) {
    const hero = game.guests[id],
      k = game.heroes.indexOf(hero);
    if (!hero || k < 1) return false;
    game.heroes.splice(k, 1);
    hero.away = null;
    hero.intent.dx = hero.intent.dy = 0;
    hero.intent.attack = null;
    return true;
  }
  // Supprimer un invité : son héros est perdu (une copie reste dans les sauvegardes de session).
  function remove(id) {
    if (!game.guests[id]) return false;
    leave(id);
    delete game.guests[id];
    return true;
  }
  function nearHost(hero) {
    const p = hero.player,
      k = Math.max(0, game.heroes.indexOf(hero)),
      a = (k * 2 * Math.PI) / 3 + 0.6;
    for (const r of [1.4, 2.2, 0.8, 0]) {
      const x = P.x + Math.cos(a) * r * TS,
        y = P.y + Math.sin(a) * r * TS;
      if (canWalk(x, y)) {
        p.x = x;
        p.y = y;
        return;
      }
    }
    p.x = P.x;
    p.y = P.y;
  }
  // Équipe les meilleures pièces du sac (les plus fortes de son niveau, par emplacement, les deux bagues comprises) ;
  // l'ancienne pièce retourne au sac.
  function equipBest(id) {
    const hero = game.guests[id];
    if (!hero) return 0;
    let changed = 0;
    for (const slot of ACTIVE_GEAR_SLOTS) {
      // Arme liée (Invocateur) : jamais remplacée.
      if (slot === 'weapon' && isBoundItem(hero.equipment.weapon)) continue;
      const best = hero.inventory
        .filter(it => it.slot === itemSlotOf(slot) && requiredLevel(it) <= clampLevel(hero.level))
        .sort((a, b) => gearScore(b) - gearScore(a))[0];
      if (!best || gearScore(best) <= gearScore(hero.equipment[slot])) continue;
      hero.inventory.splice(hero.inventory.indexOf(best), 1);
      if (hero.equipment[slot]) hero.inventory.push(hero.equipment[slot]);
      hero.equipment[slot] = best;
      changed++;
    }
    if (changed) {
      const p = hero.player,
        ratio = p.hp / p.mhp;
      p.mhp = characterStats(hero).maxHp;
      p.hp = Math.max(1, Math.round(p.mhp * ratio));
    }
    return changed;
  }

  // ---------------------------------------------------------------- Sauvegarde (heros.invites)
  const validItem = it =>
    it &&
    typeof it === 'object' &&
    !Array.isArray(it) &&
    Object.hasOwn(gearSlots, it.slot) &&
    !SECOND_SLOT_OF[it.slot] &&
    Number.isFinite(Number(it.level ?? it.ilvl ?? 1)) &&
    Number(it.level ?? it.ilvl ?? 1) > 0;
  const count = v => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
  function exportGuests(position) {
    const out = {};
    for (const hero of guests()) {
      const p = hero.player,
        where = game.heroes.includes(hero) ? position(hero) : { x: p.x, y: p.y };
      out[hero.id] = {
        pseudo: hero.name,
        local: !!hero.local,
        color: hero.color,
        look: sanitizeLook(hero.look),
        skins: { owned: [...(hero.skins?.owned || [])] },
        ...(hero.blessing ? { blessing: { day: hero.blessing.day, until: hero.blessing.until } } : {}),
        player: {
          x: where.x,
          y: where.y,
          hp: p.hp,
          mp: p.mp,
          gold: p.gold,
          ...(p.keys > 0 ? { keys: Math.floor(p.keys) } : {})
        },
        kills: hero.kills,
        level: clampLevel(hero.level),
        exp: Math.max(0, Math.floor(hero.exp || 0)),
        inventory: hero.inventory,
        equipment: hero.equipment,
        bank: CANAAN_BANK.export(hero),
        ...(CANAAN_SALVAGE.of(hero).length ? { sacoche: CANAAN_SALVAGE.export(hero) } : {}),
        bagLevel: canaanBagLevel(hero),
        // Version du niveau de sac : sans elle, un niveau 3 venait du départ à 40 places (ancienne règle).
        bagVersion: 2,
        classe: { id: hero.classe.id, talents: [...hero.classe.talents] },
        artefacts: CANAAN_ARTEFACTS.clean(hero.artefacts),
        arena: { ...hero.arena },
        prof: CANAAN_PROF.sanitize(hero.prof),
        succes: CANAAN_ACHIEVEMENTS.export(hero),
        quetes: sanitizeQuests(hero.quetes),
        ...(Object.keys(hero.ext || {}).length ? { ext: canaanSanitizeExt(hero.ext) } : {})
      };
    }
    return out;
  }
  // Recrée les invités enregistrés. Ils arrivent absents : l'hôte les fait venir depuis le panneau Groupe.
  function importGuests(data) {
    game.guests = {};
    game.heroes.splice(1);
    if (!data || typeof data !== 'object') return;
    for (const [id, d] of Object.entries(data).slice(0, GUEST_LIMIT)) {
      if (!/^[a-zA-Z_][\w-]{0,63}$/.test(id) || !d || typeof d !== 'object') continue;
      const p = d.player || {},
        hero = canaanCreateHero({
          name: cleanAdventureName(d.pseudo, '?'),
          x: Number(p.x) || P.x,
          y: Number(p.y) || P.y
        });
      hero.id = id;
      hero.local = d.local !== false;
      hero.color = /^#[0-9a-f]{6}$/i.test(d.color)
        ? d.color
        : COLORS[Object.keys(game.guests).length % COLORS.length];
      hero.look = sanitizeLook(d.look);
      hero.skins = {
        owned: [
          ...new Set((Array.isArray(d.skins?.owned) ? d.skins.owned : []).filter(id => SKIN_IDS.includes(id)))
        ]
      };
      if (!hero.skins.owned.includes(hero.look.wear)) delete hero.look.wear;
      hero.blessing =
        typeof d.blessing?.day === 'string' && Number.isFinite(Number(d.blessing.until))
          ? { day: d.blessing.day.slice(0, 10), until: Number(d.blessing.until) }
          : null;
      hero.prof = CANAAN_PROF.sanitize(d.prof);
      hero.succes = CANAAN_ACHIEVEMENTS.sanitize(d.succes);
      hero.quetes = sanitizeQuests(d.quetes);
      hero.ext = canaanSanitizeExt(d.ext);
      hero.inventory = Array.isArray(d.inventory) ? d.inventory.filter(validItem) : [];
      hero.bank = CANAAN_BANK.sanitize(d.bank);
      hero.satchel = CANAAN_SALVAGE.sanitize(d.sacoche);
      for (const slot of Object.keys(hero.equipment)) {
        const it = d.equipment?.[slot];
        hero.equipment[slot] = validItem(it) && it.slot === itemSlotOf(slot) ? it : null;
      }
      hero.kills = count(d.kills);
      // Niveau : celui sauvegardé ; ancienne sauvegarde (avant les niveaux) : de quoi porter son équipement.
      for (const it of [...hero.inventory, ...Object.values(hero.equipment)])
        if (it) window.CANAAN_GEAR.normalize(it);
      hero.level = clampLevel(
        d.level ?? Math.max(1, ...Object.values(hero.equipment).filter(Boolean).map(itemLevel))
      );
      hero.exp = Math.min(count(d.exp), Math.max(0, xpToNext(hero.level) - 1));
      // Ancienne règle (sans bagVersion) : tout allié avait 40 places (niveau 3) sans rien acheter → 10 places.
      hero.bagLevel = canaanBagLevel({
        bagLevel: d.bagVersion === 2 ? d.bagLevel : Math.max(0, (Number(d.bagLevel) || 0) - 3)
      });
      // Anciens matériaux de forge, Runes et anciens objets artéfact (supprimés) : rendus en or.
      hero.player.gold =
        count(p.gold) +
        legacyMaterialGold(d.materials, LEGACY_MATERIAL_GOLD) +
        CANAAN_ARTEFACTS.legacyRefund(d).gold;
      hero.player.keys = count(p.keys);
      hero.player.mhp = characterStats(hero).maxHp;
      hero.player.hp = Math.max(1, Math.min(hero.player.mhp, Number(p.hp) || hero.player.mhp));
      // Classe et artéfacts agissent en combat : mêmes vérifications que pour l'hôte (classe connue, talents
      // différents dans la limite des emplacements, artéfacts connus, possédés et jamais deux fois).
      CANAAN_CLASS.setClasse(hero, d.classe);
      // Compagnon d'avant les classes : il en reçoit une, avec ses talents.
      if (hero.local && !hero.classe.id) giveClass(hero);
      hero.artefacts = CANAAN_ARTEFACTS.clean(d.artefacts);
      // PV maximum avec sa classe et ses artéfacts, une fois ceux-ci vérifiés.
      hero.player.mhp = characterStats(hero).maxHp;
      hero.player.hp = Math.max(1, Math.min(hero.player.mhp, Number(p.hp) || hero.player.mhp));
      if (d.arena && typeof d.arena === 'object')
        hero.arena = {
          best: Math.min(12, count(d.arena.best)),
          attempts: count(d.arena.attempts),
          completed: !!d.arena.completed,
          lastBoss: typeof d.arena.lastBoss === 'string' ? d.arena.lastBoss.slice(0, 80) : ''
        };
      for (const it of [...hero.inventory, ...Object.values(hero.equipment)])
        if (it) window.CANAAN_GEAR.normalize(it);
      game.guests[id] = hero;
    }
  }

  // ---------------------------------------------------------------- IA des compagnons locaux
  const tileOf = v => Math.floor(v / TS);
  const free = (x, y) => x >= 0 && y >= 0 && x < MAPW && y < MAPH && canWalk((x + 0.5) * TS, (y + 0.5) * TS);
  // Chemin de cases (4 voisins) vers une case proche, limité à 3 000 cases explorées ; null si introuvable.
  function findPath(fx, fy, gx, gy) {
    const key = (x, y) => y * MAPW + x,
      seen = new Map([[key(fx, fy), -1]]),
      queue = [[fx, fy]];
    for (let head = 0; head < queue.length && queue.length < 3000; head++) {
      const [x, y] = queue[head];
      if (x === gx && y === gy) {
        const path = [];
        for (let k = key(x, y); k !== -1; k = seen.get(k))
          path.unshift({ x: k % MAPW, y: Math.floor(k / MAPW) });
        return path;
      }
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nx = x + dx,
          ny = y + dy,
          k = key(nx, ny);
        if (seen.has(k) || !(free(nx, ny) || (nx === gx && ny === gy))) continue;
        seen.set(k, key(x, y));
        queue.push([nx, ny]);
      }
    }
    return null;
  }
  function steer(hero, tx, ty) {
    const p = hero.player,
      goal = tileOf(tx) + ',' + tileOf(ty);
    let plan = hero.aiPath;
    if (!plan || plan.goal !== goal || plan.age++ > 40) {
      plan = hero.aiPath = {
        goal,
        age: 0,
        path: findPath(tileOf(p.x), tileOf(p.y), tileOf(tx), tileOf(ty)) || []
      };
    }
    while (plan.path.length > 1 && tileOf(p.x) === plan.path[0].x && tileOf(p.y) === plan.path[0].y)
      plan.path.shift();
    const next = plan.path.length > 1 ? plan.path[0] : null,
      wx = next ? (next.x + 0.5) * TS : tx,
      wy = next ? (next.y + 0.5) * TS : ty;
    hero.intent.dx = Math.abs(wx - p.x) > 4 ? Math.sign(wx - p.x) : 0;
    hero.intent.dy = Math.abs(wy - p.y) > 4 ? Math.sign(wy - p.y) : 0;
  }
  function reach(hero) {
    const type = hero.equipment.weapon?.weaponType || 'sword';
    return type === 'bow' || type === 'staff' ? 300 : type === 'spear' ? 145 : 92;
  }
  // Un héros à terre (compagnon ou invité en ligne) se relève près de l'hôte au bout de 10 secondes, à 50 % de ses PV.
  function revive(hero) {
    const p = hero.player;
    // Dans l'Arène, seul un allié peut relever un héros à terre (3 s à côté de lui).
    if (game.world.instance?.arena) {
      hero.reviveAt = null;
      return;
    }
    hero.reviveAt ??= time + REVIVE_TICKS;
    if (time < hero.reviveAt || P.dead) return;
    p.dead = false;
    p.hp = Math.round(p.mhp * 0.5);
    hero.reviveAt = null;
    nearHost(hero);
    canaanLootNotice(hero, '✨ se relève.');
  }
  // Intentions d'un compagnon local pour ce pas : se relever, combattre près de l'hôte, ou le suivre.
  function think(hero) {
    const p = hero.player,
      intent = hero.intent;
    intent.attack = null;
    if (p.dead) {
      intent.dx = intent.dy = 0;
      revive(hero);
      return;
    }
    const fromHost = Math.hypot(P.x - p.x, P.y - p.y);
    if (fromHost > TELEPORT_TILES * TS) {
      nearHost(hero);
      hero.aiPath = null;
      return;
    }
    const foes = game.world.monsters.filter(
      m =>
        m.hp > 0 &&
        !m.hidden &&
        Math.hypot(m.x - P.x, m.y - P.y) < 7 * TS &&
        Math.hypot(m.x - p.x, m.y - p.y) < 9 * TS
    );
    if (foes.length && (game.world.instance || !isSafe(P.x / TS, P.y / TS))) {
      const m = foes.reduce((a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) <= Math.hypot(b.x - p.x, b.y - p.y) ? a : b
      );
      intent.aimX = m.x;
      intent.aimY = m.y;
      if (Math.hypot(m.x - p.x, m.y - p.y) <= reach(hero) + (m.r || 0) * 0.5) {
        intent.dx = intent.dy = 0;
        intent.attack = 'quick';
        // Une compétence prête (la plus forte d'abord), sinon l'attaque de base.
        intent.skill = [3, 0, 1, 2].find(i => CANAAN_SKILLS.ready(hero, i)) ?? null;
      } else steer(hero, m.x, m.y);
      return;
    }
    if (fromHost > FOLLOW_TILES * TS) steer(hero, P.x, P.y);
    else intent.dx = intent.dy = 0;
  }
  // Étape du pipeline (avant le cœur) : les compagnons locaux présents décident de leur intention.
  window.CanaanStages.companions = {
    before() {
      if (!started || paused) return;
      for (const hero of present())
        if (hero.local) think(hero);
        else if (hero.player.dead) revive(hero);
    }
  };

  // ---------------------------------------------------------------- Affichage
  function drawAllies(c) {
    for (const hero of present()) {
      const p = hero.player;
      if (Math.abs(p.x - P.x) > W || Math.abs(p.y - P.y) > H) continue;
      c.save();
      // Héros à terre ou déconnecté (place réservée) : en transparence.
      const faded = p.dead || hero.away;
      if (faded) c.globalAlpha = 0.45;
      c.fillStyle = hero.color || '#4fb8ff';
      c.globalAlpha *= 0.55;
      c.beginPath();
      c.ellipse(p.x, p.y + 17, 17, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = faded ? 0.45 : 1;
      drawPixelHero(c, p.x, p.y, hero.color, p.anim, false, p, hero.look, hero);
      c.textAlign = 'center';
      c.font = 'bold 12px Palatino Linotype, Georgia, serif';
      c.lineWidth = 3;
      c.strokeStyle = '#120c07';
      c.fillStyle = hero.color || '#fff';
      const label = (hero.away ? '⏳ ' : p.dead ? '💀 ' : '') + hero.name;
      c.strokeText(label, p.x, p.y - 52);
      c.fillText(label, p.x, p.y - 52);
      c.fillStyle = 'rgba(0,0,0,.65)';
      c.fillRect(p.x - 20, p.y - 47, 40, 5);
      c.fillStyle = '#e04848';
      c.fillRect(p.x - 20, p.y - 47, 40 * Math.max(0, p.hp / p.mhp), 5);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- Panneau Groupe (touche G)
  const esc = text => safeGearText(text);
  function card(hero) {
    const p = hero.player,
      here = game.heroes.includes(hero),
      id = esc(hero.id);
    const status = here
      ? hero.away
        ? '⏳ Déconnecté · place gardée ' + Math.max(0, Math.ceil((hero.away.until - time) / 60)) + ' s'
        : p.dead
          ? '💀 À terre'
          : hero.peer
            ? '🌐 En ligne'
            : '🟢 Présent'
      : '⚪ Absent';
    if (ui.removing === hero.id)
      return (
        '<article class="group-card confirm"><h3>' +
        esc(hero.name) +
        '</h3><p class="group-warning">Supprimer ce héros ? Son équipement, son sac et sa progression seront perdus.</p>' +
        '<div class="group-actions"><button type="button" class="group-danger" data-action="groupRemove" data-guest="' +
        id +
        '">Supprimer</button>' +
        '<button type="button" data-action="groupCancel">Annuler</button></div></article>'
      );
    return (
      '<article class="group-card' +
      (here ? ' here' : '') +
      '"><h3><span class="group-dot" data-color="' +
      esc(hero.color) +
      '"></span>' +
      esc(hero.name) +
      '</h3>' +
      '<p class="group-meta">' +
      status +
      ' · ' +
      (classById(hero.classe?.id)
        ? classById(hero.classe.id).icon + ' ' + classById(hero.classe.id).name + ' · '
        : '') +
      'Niv. ' +
      clampLevel(hero.level) +
      ' · PV ' +
      Math.ceil(p.hp) +
      ' / ' +
      p.mhp +
      '</p>' +
      '<p class="group-meta">⚔️ ' +
      hero.kills +
      ' victimes · 💰 ' +
      p.gold +
      ' or · 🎒 ' +
      hero.inventory.length +
      ' / 40</p>' +
      '<div class="group-actions">' +
      (here
        ? '<button type="button" data-action="groupLeave" data-guest="' + id + '">Renvoyer</button>'
        : '<button type="button" data-action="groupJoin" data-guest="' +
          id +
          '"' +
          (present().length >= PRESENT_LIMIT ? ' disabled' : '') +
          '>Faire venir</button>') +
      '<button type="button" data-action="groupEquip" data-guest="' +
      id +
      '">Équiper le meilleur</button>' +
      '<button type="button" class="group-danger" data-action="groupAskRemove" data-guest="' +
      id +
      '">Supprimer</button></div></article>'
    );
  }
  // Salon en ligne : ouvrir à ses amis (code à donner), ou fermer.
  // Salon : sur Tailscale ou sur le réseau local (relais lancé par l'application de bureau), ou sur un relais choisi.
  function online() {
    const st = CANAAN_NET.state(),
      web = st.internet || {},
      me = CANAAN_NET.settings();
    const firewallHelp = (commands, port, kind) =>
      commands.length
        ? '<p class="group-meta group-warn">🧱 Pare-feu actif sur ce PC : il peut bloquer ton invité. Une seule fois, dans un terminal :</p>' +
          commands.map(c => '<p class="group-meta"><code>' + esc(c) + '</code></p>').join('')
        : kind === 'lan'
          ? '<p class="group-meta">Si ton invité n’arrive pas à se connecter : autorise ce port dans ton pare-feu' +
            (web.platform === 'win32'
              ? ' (Windows le propose à la première ouverture : accepte « réseaux privés »).'
              : ' (Ubuntu : <code>sudo ufw allow ' + esc(port) + '/tcp</code>).') +
            '</p>'
          : '';
    if (st.mode === 'host') {
      const hosted = web.state === 'online' && web.local && st.relay === web.local,
        port = hosted && web.relay ? web.relay.split(':').pop() : '';
      let link = '';
      if (hosted && web.kind === 'lan')
        link =
          '<p class="group-link">🏠 Adresse sur ton réseau : <b>' +
          esc(web.relay) +
          '</b></p>' +
          (web.addresses.length > 1
            ? '<p class="group-meta">Autres adresses de ce PC : ' +
              web.addresses.slice(1).map(esc).join(' · ') +
              '</p>'
            : '') +
          firewallHelp(web.firewall, port, 'lan');
      else if (hosted && web.kind === 'tailscale')
        link =
          '<p class="group-link">🌍 Adresse Tailscale : <b>' +
          esc(web.relay) +
          '</b></p>' +
          (web.addresses.length
            ? '<p class="group-meta">Ou par son nom : ' + web.addresses.map(esc).join(' · ') + '</p>'
            : '') +
          '<p class="group-meta">Ton ami doit avoir Tailscale lancé et être dans ton réseau Tailscale (tu l’invites depuis la console Tailscale, ou tu partages cette machine avec lui).</p>' +
          firewallHelp(web.firewall, port, 'tailscale');
      else link = '<p class="group-meta">Relais ' + esc(st.relay) + '</p>';
      return (
        '<div class="group-online open"><p class="group-code">Code du salon : <b>' +
        esc(st.code || '…') +
        '</b></p>' +
        link +
        '<p class="group-meta">' +
        esc(st.status) +
        ' · ' +
        st.peers +
        ' invité(s) en ligne</p>' +
        (st.code
          ? '<button type="button" data-action="groupCopyInvitation">📋 Copier l’invitation</button>'
          : '') +
        '<button type="button" data-action="' +
        (hosted ? 'groupCloseInternet' : 'groupCloseRoom') +
        '">Fermer le salon</button></div>'
      );
    }
    const hosting = st.canHostOnline
      ? '<div class="group-online-web"><button type="button" class="group-primary" data-action="groupOpenTailscale"' +
        (web.state === 'starting' ? ' disabled' : '') +
        '>🌍 Jouer avec Tailscale</button>' +
        '<button type="button" data-action="groupOpenLan"' +
        (web.state === 'starting' ? ' disabled' : '') +
        '>🏠 Jouer en réseau local</button>' +
        '<p class="group-meta">🌍 Un ami loin : installez tous les deux Tailscale (gratuit), mettez-vous dans le même réseau Tailscale, puis ouvre le salon ici. 🏠 Quelqu’un chez toi : le relais s’ouvre sur ton réseau, sans Internet. Dans les deux cas, copie l’invitation et envoie-la.</p>' +
        (web.state === 'error' && web.message
          ? '<p class="group-meta group-warn">' + esc(web.message) + '</p>'
          : '') +
        '</div>'
      : '';
    return (
      '<div class="group-online">' +
      hosting +
      '<div class="group-online-lan"><label for="groupRelay">' +
      (st.canHostOnline ? 'Ou un relais déjà lancé (serveur, npm run relay)' : 'Relais') +
      '</label><input id="groupRelay" type="text" autocomplete="off" value="' +
      esc(me.relay) +
      '">' +
      '<button type="button" data-action="groupOpenRoom">🌐 Ouvrir à mes amis</button></div>' +
      (st.status ? '<p class="group-meta">' + esc(st.status) + '</p>' : '') +
      '</div>'
    );
  }
  function render() {
    const list = guests();
    showPanel(
      canaanGroupHead('group') +
        '<div class="rpg-paper group-panel panel-scroll" data-panel-size="md">' +
        '<p class="group-note">Tes amis te rejoignent en ligne avec le code du salon ; un compagnon local suit ton héros et combat seul. Chacun garde son propre butin, et tous sont enregistrés dans cette aventure : ' +
        GUEST_LIMIT +
        ' au plus, ' +
        PRESENT_LIMIT +
        ' présents à la fois.</p>' +
        (ui.message ? '<p class="group-message" role="status">' + esc(ui.message) + '</p>' : '') +
        online() +
        '<div class="group-list">' +
        (list.length
          ? list.map(card).join('')
          : '<p class="group-empty">Aucun compagnon pour l’instant.</p>') +
        '</div>' +
        (list.length < GUEST_LIMIT
          ? '<div class="group-new"><label for="groupPseudo">Nouveau compagnon</label><input id="groupPseudo" type="text" maxlength="32" autocomplete="off" placeholder="Pseudo">' +
            '<button type="button" data-action="groupCreate">Créer</button></div>'
          : '') +
        '</div>'
    );
    for (const dot of document.querySelectorAll('#window .group-dot'))
      dot.style.background = dot.dataset.color;
  }
  function changed(message) {
    ui.removing = null;
    ui.message = message;
    saveGame();
    render();
  }
  // Ouvre la page Compagnons de la fenêtre Groupe (touche G, ou son onglet).
  function open() {
    ui.removing = null;
    ui.message = '';
    render();
  }
  function toggle() {
    if (!started || paused) return;
    if (modalOpen()) {
      closePanels();
      return;
    }
    open();
  }
  window.CANAAN_GROUP = Object.freeze({
    guestLimit: GUEST_LIMIT,
    presentLimit: PRESENT_LIMIT,
    create,
    createRemote,
    join,
    leave,
    remove,
    equipBest,
    exportGuests,
    importGuests,
    think,
    drawAllies,
    render,
    toggle,
    present,
    actions: Object.freeze({
      create() {
        const input = document.getElementById('groupPseudo'),
          hero = create(input ? input.value : '');
        if (!hero) return changed('Le groupe est complet (' + GUEST_LIMIT + ' compagnons).');
        changed(
          join(hero.id)
            ? hero.name + ' rejoint le groupe.'
            : hero.name + ' est enregistré (absent : trois compagnons sont déjà là).'
        );
      },
      join(id) {
        // Appelé depuis le panneau, un invité absent vient comme compagnon local (piloté par l'IA).
        if (game.guests[id] && !game.guests[id].peer) game.guests[id].local = true;
        changed(join(id) ? game.guests[id].name + ' arrive.' : 'Trois compagnons sont déjà présents.');
      },
      openRoom() {
        const input = document.getElementById('groupRelay');
        CANAAN_NET.openRoom(input && input.value.trim() ? input.value.trim() : CANAAN_NET.settings().relay);
        render();
      },
      async openTailscale() {
        await CANAAN_NET.openTailscale();
        if (modalOpen() && document.querySelector('#window .group-panel')) render();
      },
      async openLan() {
        await CANAAN_NET.openLan();
        if (modalOpen() && document.querySelector('#window .group-panel')) render();
      },
      async closeInternet() {
        await CANAAN_NET.closeInternet();
        if (modalOpen() && document.querySelector('#window .group-panel')) render();
      },
      copyInvitation: () => CANAAN_NET.copyInvitation(),
      closeRoom() {
        CANAAN_NET.closeRoom();
        render();
      },
      leave: id => changed(leave(id) ? game.guests[id].name + ' quitte le groupe.' : ''),
      equip: id => {
        const n = equipBest(id);
        changed(n ? n + ' pièce(s) équipée(s).' : 'Rien de mieux dans son sac.');
      },
      askRemove(id) {
        ui.removing = id;
        ui.message = '';
        render();
      },
      remove: id => changed(remove(id) ? 'Compagnon supprimé.' : ''),
      cancel() {
        ui.removing = null;
        render();
      }
    })
  });
  window.toggleGroup = toggle;
  window.canaanOpenGroup = open;
  // Le panneau se met à jour quand l'état du salon change (code reçu, invité arrivé ou parti).
  window.addEventListener('canaan-net', () => {
    if (started && document.getElementById('groupPseudo') !== null) render();
  });
  // Entrée dans le champ du pseudo : créer le compagnon.
  document.addEventListener('keydown', event => {
    if (event.target?.id === 'groupPseudo' && event.key === 'Enter') window.CANAAN_GROUP.actions.create();
  });
})();
