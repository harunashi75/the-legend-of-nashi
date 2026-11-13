// Coopératif en ligne (phases 4 et 5) : connexion au relais, salon de l'hôte, connexion d'un invité.
// Hôte : il ouvre un salon (code à 6 caractères), accepte les invités, applique leurs intentions et leurs actions
// vérifiées, et leur envoie l'état du monde 10 fois par seconde (avec les effets de combat), plus à chacun un
// message privé : son sac, son équipement, ses recharges et sa position confirmée.
// Invité : il envoie ses intentions, prédit son propre mouvement (corrigé par l'hôte) et affiche le monde de l'hôte,
// sans rien simuler d'autre ni sauvegarder ; son héros vit dans la sauvegarde de l'hôte.
(() => {
  'use strict';
  const SNAPSHOT_TICKS = 6,
    INTENT_TICKS = 4,
    SMOOTH = 0.3,
    SNAP_DISTANCE = 240,
    // Correction de la position prédite : une part de l'écart à chaque message de l'hôte.
    CORRECTION = 0.35,
    // Place réservée : un invité déconnecté garde son héros (immobile et protégé) pendant 2 minutes.
    RESERVE_TICKS = 2 * 60 * 60,
    HISTORY_TICKS = 180,
    FX_LIMIT = 120;
  const net = {
    socket: null,
    relay: DEFAULT_RELAY,
    status: '',
    code: null,
    // Hôte : invités connectés (relais → héros). Invité : identifiant de son héros chez l'hôte.
    peers: new Map(),
    heroId: null,
    remote: new Map(),
    targets: new Map(),
    pending: { attack: null, skill: null, dodge: null },
    lastMap: undefined,
    monsterCounter: 0,
    // Hôte : effets de combat depuis le dernier instantané.
    fx: [],
    // Invité : prédiction de son mouvement (vitesse donnée par l'hôte, positions passées, séquence des intentions).
    speed: 0,
    seq: 0,
    seqTicks: new Map(),
    history: new Map(),
    snapSelf: true,
    lastIntent: '',
    lastWeapon: undefined,
    lastBosses: 0,
    corrections: 0
  };
  // ---------------------------------------------------------------- Préférences : identité et relais
  const PINGGY_SERVER = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.pinggy\.io$/i;
  // Jeton seul, ou commande copiée du tableau de bord Pinggy (« ssh -p 443 … JETON@free.pinggy.io »).
  function parsePinggyLogin(text) {
    const clean = String(text || '').trim();
    if (!clean) return { token: '', host: '' };
    if (/^[A-Za-z0-9_-]{4,128}$/.test(clean)) return { token: clean, host: '' };
    const m = clean.match(/(?:^|[\s"'])(?:([A-Za-z0-9_-]{4,128})(?:\+[a-z+]+)?@)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.pinggy\.io)\b/i);
    if (!m) return null;
    const user = m[1] && !/^(tcp|tls|http|https|qr|auth|tlstcp|udp)$/i.test(m[1]) ? m[1] : '';
    return { token: user, host: m[2].toLowerCase() };
  }
  function settings() {
    const saved = CANAAN_PREFERENCES.read('network', {});
    const id = isGuestId(saved.id) ? saved.id : makeGuestId(Math.random);
    const value = {
      id,
      pseudo: cleanPseudo(saved.pseudo || ''),
      // Apparence de son héros quand on rejoint un ami (forme compacte, voir shared/data/looks.js).
      look: encodeLook(typeof saved.look === 'string' ? decodeLook(saved.look) : saved.look),
      relay: typeof saved.relay === 'string' && /^wss?:\/\//.test(saved.relay) ? saved.relay : DEFAULT_RELAY,
      code: normalizeRoomCode(saved.code) || '',
      // Abonnement Pinggy (facultatif) : jeton pour une adresse fixe, et type de tunnel (http par défaut, ou tcp).
      pinggyToken: typeof saved.pinggyToken === 'string' && /^[A-Za-z0-9_-]{4,128}$/.test(saved.pinggyToken) ? saved.pinggyToken : '',
      pinggyMode: saved.pinggyMode === 'tcp' ? 'tcp' : 'http',
      // Serveur Pinggy lu dans la commande du tableau de bord (vide : free.pinggy.io).
      pinggyHost: typeof saved.pinggyHost === 'string' && PINGGY_SERVER.test(saved.pinggyHost) ? saved.pinggyHost : ''
    };
    if (value.id !== saved.id) CANAAN_PREFERENCES.write('network', value);
    return value;
  }
  function remember(changes) {
    CANAAN_PREFERENCES.write('network', { ...settings(), ...changes });
  }
  function setStatus(text) {
    net.status = text;
    window.dispatchEvent?.(new Event('canaan-net'));
  }
  // ---------------------------------------------------------------- Connexion
  function connect(relay, onOpen, onMessage, onClose) {
    disconnect();
    let socket;
    try {
      socket = new WebSocket(relay);
    } catch {
      setStatus('Adresse du relais invalide.');
      return false;
    }
    net.socket = socket;
    net.relay = relay;
    net.unreachable = false;
    socket.onopen = onOpen;
    socket.onmessage = event => {
      const message = parseMessage(String(event.data));
      if (message) onMessage(message);
    };
    socket.onerror = () => {
      net.unreachable = true;
      const port = relay.split(':')[2];
      setStatus(
        'Relais injoignable : ' + relay + '. ' +
          (port
            ? 'Vérifie l’adresse, que l’hôte a bien ouvert son salon, et son pare-feu (le port ' + port.replace(/\D.*/, '') + ' doit accepter les connexions).'
            : 'Vérifie que c’est bien le lien affiché par l’hôte en ce moment (en Pinggy gratuit, il change à chaque ouverture du tunnel).')
      );
    };
    socket.onclose = () => {
      if (net.socket === socket) {
        net.socket = null;
        onClose();
      }
    };
    return true;
  }
  function send(message) {
    if (net.socket && net.socket.readyState === 1) net.socket.send(JSON.stringify(message));
  }
  function disconnect() {
    const socket = net.socket;
    net.socket = null;
    if (socket) socket.close();
  }

  // ---------------------------------------------------------------- Hôte
  // remember : retenir l'adresse comme relais préféré (pas pour le relais local de l'hébergement sur Internet).
  function openRoom(relay = settings().relay, { keep = true } = {}) {
    if (game.mode === 'guest') return false;
    const address = normalizeRelayUrl(relay);
    if (!address) {
      setStatus('Adresse du relais illisible : ' + String(relay).slice(0, 80));
      return false;
    }
    relay = address;
    if (keep) remember({ relay });
    setStatus('Connexion au relais…');
    return connect(
      relay,
      () => send({ t: 'host', version: window.CANAAN_VERSION, schema: SAVE_SCHEMA }),
      hostMessage,
      () => {
        for (const hero of net.peers.values()) CANAAN_GROUP.leave(hero.id);
        for (const hero of awayHeroes()) release(hero, false);
        net.peers.clear();
        net.code = null;
        if (game.mode === 'host') game.mode = 'solo';
        setStatus('Salon fermé.');
      }
    );
  }
  function closeRoom() {
    disconnect();
  }
  function hostMessage(message) {
    if (message.t === 'room') {
      net.code = message.code;
      game.mode = 'host';
      setStatus('Salon ouvert : donne le code ' + message.code + ' à tes amis.');
      chat('Groupe', 'Salon ouvert. Code : ' + message.code);
      return;
    }
    if (message.t === 'join') return welcome(message);
    const hero = net.peers.get(message.peer);
    if (message.t === 'intent' && hero) {
      const intent = sanitizeIntent(message);
      Object.assign(hero.intent, { dx: intent.dx, dy: intent.dy, attack: intent.attack, aimX: intent.aimX, aimY: intent.aimY });
      if (intent.skill !== null) hero.intent.skill = intent.skill;
      if (intent.dodge) CANAAN_COMBAT.heroDodge(hero, intent.dodge.dx, intent.dodge.dy);
      if (intent.seq !== null) {
        hero.intentSeq = intent.seq;
        hero.intentTick = time;
      }
    } else if (message.t === 'action' && hero) {
      if (heroAction(hero, sanitizeAction(message))) hero.netBag = null;
    } else if (message.t === 'chat' && hero) {
      const text = cleanChat(message.text);
      if (!text) return;
      chat(hero.name, text);
      send({ t: 'chat', from: hero.name, text });
    } else if (message.t === 'left' && hero) {
      net.peers.delete(message.peer);
      hero.peer = null;
      reserve(hero);
    }
  }
  // ---------------------------------------------------------------- Place réservée
  // Déconnexion : le héros reste dans le groupe, immobile et protégé (aucun monstre ne le vise, aucun coup
  // ne le blesse), pendant 2 minutes. S'il revient à temps, il reprend sa place là où il était.
  function reserve(hero) {
    Object.assign(hero.intent, { dx: 0, dy: 0, attack: null, skill: null });
    hero.player.roll = null;
    hero.away = { until: time + RESERVE_TICKS };
    chat('Groupe', hero.name + ' est déconnecté : sa place est gardée 2 minutes.');
    toast('⏳ ' + hero.name + ' est déconnecté (place gardée 2 min)');
    saveGame();
  }
  // Fin de la place réservée (délai écoulé ou salon fermé) : le héros quitte le groupe ; il reste enregistré.
  function release(hero, announce = true) {
    hero.away = null;
    CANAAN_GROUP.leave(hero.id);
    if (announce) chat('Groupe', hero.name + ' n’est pas revenu à temps : il quitte le groupe.');
    saveGame();
  }
  const awayHeroes = () => game.heroes.filter(hero => hero.away);
  function checkReserved() {
    for (const hero of awayHeroes()) if (time >= hero.away.until) release(hero);
  }
  // Un invité frappe à la porte : même version, identifiant valide, place dans le groupe.
  function welcome(message) {
    const refuse = reason => send({ t: 'refuse', peer: message.peer, reason });
    if (message.version !== window.CANAAN_VERSION || message.schema !== SAVE_SCHEMA)
      return refuse('Versions différentes : hôte ' + window.CANAAN_VERSION + ', invité ' + String(message.version));
    if (!isGuestId(message.id)) return refuse('Identifiant d’invité invalide.');
    // Le même invité se reconnecte alors que l'ancienne connexion n'est pas encore fermée : la nouvelle la remplace.
    for (const [peer, other] of net.peers)
      if (other.id === message.id) {
        send({ t: 'kick', peer, reason: 'Nouvelle connexion de ce héros.' });
        net.peers.delete(peer);
      }
    let hero = game.guests[message.id];
    const back = !!hero?.away && game.heroes.includes(hero);
    if (!hero) {
      hero = CANAAN_GROUP.createRemote(message.id, cleanPseudo(message.pseudo), decodeLook(message.look));
      if (!hero) return refuse('Cette aventure a déjà six héros invités.');
    }
    // L'invité choisit son apparence chez lui : elle suit à chaque connexion.
    if (typeof message.look === 'string') hero.look = decodeLook(message.look);
    if (!game.heroes.includes(hero) && !CANAAN_GROUP.join(hero.id)) return refuse('Trois invités sont déjà présents.');
    hero.local = false;
    hero.peer = message.peer;
    hero.netBag = null;
    hero.netTrade = null;
    hero.intentSeq = null;
    hero.away = null;
    net.peers.set(message.peer, hero);
    send({ t: 'accept', peer: message.peer, heroId: hero.id, name: hero.name, host: window.CANAAN_VERSION, back });
    chat('Groupe', hero.name + (back ? ' est de retour : il reprend sa place.' : ' a rejoint la partie.'));
    toast('🌐 ' + hero.name + (back ? ' est de retour' : ' a rejoint la partie'));
    saveGame();
  }
  function snapshot() {
    const inst = game.world.instance,
      map = inst
        ? { instance: inst.arena ? 'arena' : inst.index, cleared: !!inst.cleared, bosses: inst.bossesDown || 0 }
        : { instance: null };
    for (const m of game.world.monsters) if (!m.netId) m.netId = ++net.monsterCounter;
    return {
      t: 'state',
      tick: time,
      map,
      heroes: game.heroes.map(hero => ({
        ...heroSnapshot(hero === game.hero ? 'host' : hero.id, hero),
        level: clampLevel(hero.level),
        // Lumi et bénédiction des racines d'or, dessinées chez chacun.
        q: CANAAN_QUESTS.questLook(hero),
        away: hero.away ? Math.max(0, Math.ceil((hero.away.until - time) / 60)) : 0,
        // Pêche : banc visé et touche (pour dessiner la ligne chez les autres).
        fish: hero.fishing ? [hero.fishing.spot, hero.fishing.state === 'bite' ? 1 : 0] : 0
      })),
      // Maison : meubles, quand ils changent (et de temps en temps pour un invité qui arrive).
      house: CANAAN_HOUSE.netView(),
      // Lieux des quêtes : énigmes partagées et changements du monde, quand ils changent.
      quests: CANAAN_QUESTS.netView(),
      monsters: game.world.monsters.map(monsterSnapshot),
      drops: game.world.drops.map(d => ({ x: Math.round(d.x), y: Math.round(d.y) })),
      projectiles: game.world.projectiles.slice(0, 60).map(p => ({ x: Math.round(p.x), y: Math.round(p.y), c: p.c })),
      fx: net.fx.splice(0),
      // Coffres : coffre de fin d'instance (position, ouvert), et coffres secrets déjà ouverts du monde
      // (envoyés quand la liste change, et toutes les 5 secondes pour un invité qui vient d'arriver).
      chests: game.world.instance ? game.world.chests.map(c => ({ id: c.id, x: c.x, y: c.y, instance: !!c.instance, opened: !!c.opened })) : [],
      opened: openedListDue() ? [...game.world.openedChests] : undefined,
      // Arène : annonces au sol, projectiles, vague et effets de chaque héros (null hors du colisée).
      arena: CANAAN_ARENA.view(hero => (hero === game.hero ? 'host' : hero.id))
    };
  }
  let openedSent = -1;
  function openedListDue() {
    const n = game.world.openedChests.length;
    if (n === openedSent && time % (SNAPSHOT_TICKS * 50) >= SNAPSHOT_TICKS) return false;
    openedSent = n;
    return true;
  }
  // Message privé d'un invité : position confirmée (avec la séquence de sa dernière intention), vitesse,
  // recharges des compétences et de la roulade ; son sac et son équipement seulement quand ils ont changé.
  function privateSnapshot(hero) {
    const p = hero.player,
      st = characterStats(hero),
      cooldowns = CANAAN_SKILLS.state(hero).cooldowns,
      out = {
        t: 'me',
        peer: hero.peer,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        seq: hero.intentSeq,
        age: hero.intentSeq === null ? 0 : time - hero.intentTick,
        speed: Math.round(CANAAN_PLAYER_SPEED * (1 + (st.speed || 0) / 100) * CANAAN_PROF.speedMult(hero) * 1000) / 1000,
        // Pêche et repas en cours (métiers).
        live: CANAAN_PROF.liveOf(hero),
        // Niveau et expérience (l'hôte les fait gagner).
        level: clampLevel(hero.level),
        exp: Math.max(0, Math.floor(hero.exp || 0)),
        // Recharge du sort spécial (touche F).
        special: Math.round(CANAAN_CLASS.specialLeft(hero) * 10) / 10,
        cds: [0, 1, 2, 3].map(i => {
          const spec = CANAAN_SKILLS.spec(hero, i);
          return spec ? Math.max(0, Math.round((cooldowns[spec.key] || 0) * 10) / 10) : 0;
        }),
        dodge: Math.round(CANAAN_COMBAT.dodgeState(hero).ready * 10) / 10,
        revive: p.dead && hero.reviveAt ? Math.max(0, Math.ceil((hero.reviveAt - time) / 60)) : 0
      };
    const bag = JSON.stringify({
      inventory: hero.inventory,
      equipment: hero.equipment,
      limit: canaanBagLimit(hero),
      bagLevel: canaanBagLevel(hero),
      classe: { id: hero.classe.id, talents: hero.classe.talents },
      quetes: hero.quetes,
      rubis: { owned: hero.rubis.owned, equipped: hero.rubis.equipped },
      arena: hero.arena,
      prof: CANAAN_PROF.bagOf(hero)
    });
    if (bag !== hero.netBag) {
      hero.netBag = bag;
      out.bag = JSON.parse(bag);
    }
    // Échange entre joueurs : sa vue, envoyée quand elle change.
    const trade = JSON.stringify(CANAAN_TRADE.view(hero));
    if (trade !== hero.netTrade) {
      hero.netTrade = trade;
      out.trade = JSON.parse(trade);
    }
    return out;
  }
  // Action d'un invité, déjà mise en forme : équipement, classe (choisir, talents, sort spécial) ou Rubis.
  function heroAction(hero, action) {
    if (!action) return false;
    if (action.op.startsWith('trade-')) return CANAAN_TRADE.handle(hero, action);
    if (action.op.startsWith('house-')) return CANAAN_HOUSE.handle(hero, action);
    if (action.op === 'fish' || action.op === 'cook' || action.op === 'eat' || action.op === 'hunt') return CANAAN_PROF.handle(hero, action);
    if (action.op.startsWith('quest-')) return CANAAN_QUESTS.handle(hero, action);
    if (action.op === 'class-choose') return CANAAN_CLASS.choose(action.cls, hero);
    if (action.op === 'talent-equip') return CANAAN_CLASS.equip(action.talent, hero);
    if (action.op === 'talent-unequip') return CANAAN_CLASS.unequip(action.talent, hero);
    if (action.op === 'class-special') return CANAAN_CLASS.special(hero);
    if (action.op === 'rubis-equip') return CANAAN_RUBIS.equipFor(hero, action.rubis);
    if (action.op === 'rubis-unequip') return CANAAN_RUBIS.unequipFor(hero, action.slot);
    if (action.op === 'open-chest') return openNearbyChest(hero);
    if (action.op === 'sell') return sellItemFor(hero, action.id);
    if (action.op === 'sell-common') return sellCommonFor(hero);
    if (action.op === 'buy-gear') return buyGearFor(hero);
    if (action.op === 'bag-upgrade') return buyBagUpgradeFor(hero);
    return CANAAN_EQUIPMENT.heroAction(hero, action);
  }
  // Effets de combat de l'hôte (chiffres, éclats, compétences) : regroupés dans le prochain instantané.
  game.view.fx = (kind, data) => {
    if (game.mode === 'host' && net.peers.size && net.fx.length < FX_LIMIT) net.fx.push([kind, ...data]);
  };
  // Message pour un seul invité (butin, à terre, sac plein…) : il s'affiche sur son écran.
  game.view.remote = (hero, text) => {
    if (game.mode === 'host' && hero.peer && net.peers.get(hero.peer) === hero) send({ t: 'notice', peer: hero.peer, text: cleanChat(text) });
  };

  // ---------------------------------------------------------------- Invité
  function joinRoom({ relay, code, pseudo }) {
    // Une invitation collée dans un champ donne à la fois le relais et le code.
    const pasted = parseInvitation(relay + ' ' + code);
    const room = normalizeRoomCode(code) || pasted.code;
    if (!room) {
      setStatus('Code de salon invalide (6 caractères).');
      return false;
    }
    const address = normalizeRelayUrl(relay) || pasted.relay;
    if (!address) {
      setStatus('Adresse du relais illisible : colle le lien donné par l’hôte.');
      return false;
    }
    relay = address;
    const me = settings(),
      name = cleanPseudo(pseudo || me.pseudo);
    // Le dernier code est retenu : après une coupure, l'invité rejoint le même salon d'un clic.
    remember({ relay, pseudo: name, code: room });
    setStatus('Connexion au relais…');
    return connect(
      relay,
      () => {
        setStatus('Salon ' + room + ' : en attente de l’hôte…');
        send({ t: 'join', code: room, id: me.id, pseudo: name, look: me.look, version: window.CANAAN_VERSION, schema: SAVE_SCHEMA });
      },
      guestMessage,
      () => {
        if (game.mode === 'guest') leaveAfter('Connexion perdue avec l’hôte. Ta place est gardée 2 minutes : rejoins avec le même code.');
        // La fermeture garde le message qui l'explique (relais injoignable, salon introuvable, refus…).
        else if (!net.unreachable && !/introuvable|complet|refus|Versions|déjà|injoignable/.test(net.status)) setStatus('Connexion fermée.');
      }
    );
  }
  function guestMessage(message) {
    if (message.t === 'error' || message.t === 'refuse') {
      setStatus(message.reason || 'Connexion refusée.');
      disconnect();
    } else if (message.t === 'accept') enterGuestMode(message);
    else if (message.t === 'state' && game.mode === 'guest') applyState(message);
    else if (message.t === 'me' && game.mode === 'guest') applyPrivate(message);
    else if (message.t === 'notice' && game.mode === 'guest') toast(cleanChat(message.text));
    else if (message.t === 'chat' && game.mode === 'guest') showChat(cleanPseudo(message.from), cleanChat(message.text));
    else if (message.t === 'closed' || message.t === 'kick') leaveAfter(message.reason || 'L’hôte a fermé sa partie.');
  }
  function enterGuestMode(message) {
    game.mode = 'guest';
    net.heroId = message.heroId;
    game.hero.name = cleanPseudo(message.name);
    game.hero.look = decodeLook(settings().look);
    net.remote.clear();
    net.targets.clear();
    net.lastMap = undefined;
    net.snapSelf = true;
    net.history.clear();
    net.seqTicks.clear();
    game.heroes.splice(1);
    game.world.monsters = [];
    game.world.projectiles = [];
    game.world.drops = [];
    setStatus('Connecté chez l’hôte.');
    startGame();
    toast(message.back ? '🌐 Te revoilà : tu reprends ta place' : '🌐 Tu as rejoint la partie de ton ami');
  }
  // Fin de la connexion : retour à l'écran titre 2,5 s plus tard. L'invité reste en mode invité jusque-là :
  // il ne simule pas le monde de l'hôte, dont il n'a qu'une vue partielle.
  function leaveAfter(reason) {
    if (net.leaving) return;
    net.leaving = true;
    toast('🌐 ' + reason);
    setStatus(reason);
    disconnect();
    setTimeout(() => window.location.reload(), 2500);
  }
  // Carte de l'hôte : monde extérieur, ou donjon reconstruit à l'identique (génération déterministe).
  function applyMap(map) {
    const key = map.instance === null ? 'monde' : String(map.instance),
      bosses = Number.isInteger(map.bosses) ? map.bosses : 0;
    if (key === net.lastMap) {
      if (game.world.instance) game.world.instance.cleared = !!map.cleared;
      if (Number.isInteger(game.world.instance?.index) && bosses > net.lastBosses) {
        openDungeonGates(game.world.instance.index, bosses);
        game.world.instance.bossesDown = net.lastBosses = bosses;
      }
      return;
    }
    net.lastMap = key;
    net.lastBosses = 0;
    net.snapSelf = true;
    if (map.instance === null) {
      game.world.instance = null;
      game.world.tiles = game.world.overworld;
      game.world.decor = game.world.overdecor;
    } else if (map.instance === 'arena') {
      // Colisée de l'Arène : même plan que chez l'hôte ; la herse suit la vue de l'arène.
      game.world.instance = { index: 'arena', arena: true, cleared: !!map.cleared, bossesDown: 0, guestView: true };
      game.world.tiles = makeDungeon('arena');
      game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
    } else if (Number.isInteger(map.instance) && instances[map.instance]) {
      game.world.instance = { index: map.instance, cleared: !!map.cleared, bossesDown: bosses, guestView: true };
      game.world.tiles = makeDungeon(map.instance);
      openDungeonGates(map.instance, bosses);
      net.lastBosses = bosses;
      game.world.decor = Array.from({ length: MAPH }, () => Array(MAPW).fill(null));
      instanceEntrance = { x: 120 * TS, y: 133 * TS };
    }
    net.targets.clear();
  }
  // Une entité se rapproche de sa position confirmée à chaque pas ; un grand écart est rattrapé d'un coup.
  function target(entity, x, y) {
    if (Math.hypot(entity.x - x, entity.y - y) > SNAP_DISTANCE) {
      entity.x = x;
      entity.y = y;
    }
    net.targets.set(entity, { x, y });
  }
  function applyState(state) {
    if (!state.map || !Array.isArray(state.heroes)) return;
    applyMap(state.map);
    if (state.house) CANAAN_HOUSE.applyRemote(state.house);
    if (state.quests) CANAAN_QUESTS.applyRemote(state.quests);
    const seen = new Set();
    for (const h of state.heroes) {
      if (!h || typeof h.id !== 'string') continue;
      const mine = h.id === net.heroId;
      let hero = mine ? game.hero : net.remote.get(h.id);
      if (!hero) {
        hero = { id: h.id, name: '', color: '', player: { x: h.x, y: h.y, vx: 0, vy: 0, anim: 0, atk: 0 }, intent: {}, equipment: {} };
        net.remote.set(h.id, hero);
      }
      if (!mine) {
        hero.away = Number.isFinite(h.away) && h.away > 0 ? { left: h.away } : null;
        hero.name = cleanPseudo(h.name);
        hero.color = /^#[0-9a-f]{6}$/i.test(h.color) ? h.color : '#8068db';
        hero.fishView = Array.isArray(h.fish) && Number.isInteger(h.fish[0]) ? { spot: h.fish[0], bite: !!h.fish[1] } : null;
        if (hero.lookCode !== h.look) {
          hero.lookCode = h.look;
          hero.look = decodeLook(h.look);
        }
        seen.add(h.id);
      }
      const p = hero.player;
      for (const key of ['hp', 'mhp', 'mp', 'mmp', 'gold', 'vx', 'vy', 'face', 'atk']) if (Number.isFinite(h[key])) p[key] = h[key];
      p.dead = !!h.dead;
      p.form = h.form ? 'feral' : null;
      p.veiled = !!h.veil;
      p.shielded = h.shield ? 1 : 0;
      hero.questLook = Number(h.q) || 0;
      if (Math.hypot(h.vx || 0, h.vy || 0) > 0.1) p.anim = (p.anim || 0) + 0.25;
      if (mine) {
        // Sa propre position est prédite : elle se corrige avec le message privé, sauf au premier état ou après un changement de carte.
        game.hero.kills = h.kills || 0;
        if (net.snapSelf || p.dead) {
          p.x = h.x;
          p.y = h.y;
          net.history.clear();
          net.snapSelf = false;
        }
      } else target(p, h.x, h.y);
    }
    for (const id of [...net.remote.keys()]) if (!seen.has(id)) net.remote.delete(id);
    game.heroes.splice(1, game.heroes.length, ...net.remote.values());
    // Monstres : même objet d'un instantané à l'autre (animations), créé ou retiré selon l'hôte.
    const old = new Map(game.world.monsters.map(m => [m.k, m]));
    game.world.monsters = (Array.isArray(state.monsters) ? state.monsters : []).map(s => {
      const m = old.get(s.k) || { x: s.x, y: s.y };
      const { x, y, ...rest } = s;
      Object.assign(m, rest);
      target(m, x, y);
      return m;
    });
    game.world.drops = (state.drops || []).map(d => ({ x: d.x, y: d.y, t: 'or', v: 0, life: 99 }));
    game.world.projectiles = (state.projectiles || []).map(p => ({ x: p.x, y: p.y, vx: 0, vy: 0, c: p.c, life: 2 }));
    if (Array.isArray(state.fx)) playEffects(state.fx);
    if (game.world.instance && Array.isArray(state.chests))
      game.world.chests = state.chests
        .filter(c => c && Number.isFinite(c.x) && Number.isFinite(c.y))
        .slice(0, 8)
        .map(c => ({ id: String(c.id).slice(0, 40), x: c.x, y: c.y, instance: !!c.instance, opened: !!c.opened }));
    if (Array.isArray(state.opened)) game.world.openedChests = state.opened.filter(id => typeof id === 'string').slice(0, 200);
    CANAAN_ARENA.applyView(state.arena || null, net.heroId);
  }
  // Effets de combat de l'hôte rejoués chez l'invité.
  function playEffects(list) {
    for (const e of list.slice(0, FX_LIMIT)) {
      if (!Array.isArray(e)) continue;
      const [kind, ...d] = e;
      if (kind === 'f' && Number.isFinite(d[0]) && Number.isFinite(d[1])) float(d[0], d[1], String(d[2] ?? '').slice(0, 40), String(d[3] || '#fff'));
      else if (kind === 'b' && Number.isFinite(d[0]) && Number.isFinite(d[1])) burst(d[0], d[1], String(d[2] || '#fff'), Math.min(40, d[3] | 0));
      else if (kind === 'v') CANAAN_SKILLS.remoteEffect(d);
    }
  }
  // Message privé : sac et équipement (quand ils changent), recharges, et correction de la position prédite.
  function applyPrivate(me) {
    if (Number.isFinite(me.speed)) net.speed = Math.max(0, Math.min(20, me.speed));
    if (Array.isArray(me.cds)) SKILLS.forEach((s, i) => (s.cd = Number.isFinite(me.cds[i]) ? me.cds[i] : 0));
    net.revive = Number.isFinite(me.revive) ? me.revive : 0;
    if (Number.isInteger(me.level) && Number.isInteger(me.exp)) {
      game.hero.level = clampLevel(me.level);
      game.hero.exp = Math.max(0, me.exp);
    }
    if (Number.isFinite(me.special)) CANAAN_CLASS.setGuestSpecial(me.special);
    if (me.trade && typeof me.trade === 'object') CANAAN_TRADE.applyRemote(me.trade);
    if (me.live && typeof me.live === 'object') CANAAN_PROF.applyRemote(me.live);
    const bag = me.bag;
    if (bag && Array.isArray(bag.inventory) && bag.equipment && typeof bag.equipment === 'object') {
      game.hero.inventory = bag.inventory;
      game.hero.equipment = bag.equipment;
      if (Number.isInteger(bag.limit)) game.hero.bagLimit = Math.max(10, Math.min(100, bag.limit));
      if (Number.isInteger(bag.bagLevel)) game.hero.bagLevel = canaanBagLevel({ bagLevel: bag.bagLevel });
      applyClassAndRubis(bag);
      if (bag.prof && typeof bag.prof === 'object') game.hero.prof = CANAAN_PROF.sanitize(bag.prof);
      if (bag.quetes && typeof bag.quetes === 'object') game.hero.quetes = sanitizeQuests(bag.quetes);
      if (bag.arena && typeof bag.arena === 'object')
        game.hero.arena = {
          best: Math.max(0, Math.min(CANAAN_ARENA.waves, bag.arena.best | 0)),
          attempts: Math.max(0, bag.arena.attempts | 0),
          completed: !!bag.arena.completed,
          lastBoss: typeof bag.arena.lastBoss === 'string' ? bag.arena.lastBoss.slice(0, 80) : '',
          pendingChoice: false
        };
      updateCapacity();
      const weapon = game.hero.equipment.weapon?.id;
      if (weapon !== net.lastWeapon) {
        net.lastWeapon = weapon;
        refreshWeaponBar();
      }
      if (modalOpen() && (currentGearPanel === 'inventory' || currentGearPanel === 'character')) refreshGearPanel();
      if (modalOpen() && document.querySelector('#window .classes')) renderTalents();
    }
    if (Number.isFinite(me.x) && Number.isFinite(me.y)) correct(me);
  }
  // Classe, talents et Rubis de l'invité, tels que l'hôte les garde : affichés dans son panneau (T) et sur sa fiche.
  function applyClassAndRubis(bag) {
    const r = bag.rubis;
    if (bag.classe && typeof bag.classe === 'object') {
      const before = game.hero.classe?.id;
      CANAAN_CLASS.setClasse(game.hero, bag.classe);
      if (before !== game.hero.classe.id) refreshWeaponBar();
      CANAAN_CLASS.promptClass();
    }
    if (r && r.owned && typeof r.owned === 'object' && Array.isArray(r.equipped))
      game.hero.rubis = {
        owned: Object.fromEntries(Object.entries(r.owned).filter(([id, n]) => CANAAN_RUBIS.get(id) && Number.isInteger(n) && n > 0)),
        equipped: Array.from({ length: CANAAN_RUBIS.slots }, (_, k) => (CANAAN_RUBIS.get(r.equipped[k]) ? r.equipped[k] : null))
      };
  }
  // Réconciliation : la position confirmée par l'hôte est comparée à celle que l'invité avait prédite au même moment.
  function correct(me) {
    if (game.hero.player.dead || net.snapSelf) return;
    const p = game.hero.player,
      sent = net.seqTicks.get(me.seq),
      at = sent === undefined ? undefined : sent + Math.max(0, me.age | 0),
      past = at === undefined ? null : net.history.get(at);
    const ex = me.x - (past ? past.x : p.x),
      ey = me.y - (past ? past.y : p.y);
    if (!past && Math.hypot(me.x - p.x, me.y - p.y) <= SNAP_DISTANCE) return;
    if (Math.hypot(ex, ey) > SNAP_DISTANCE || !past) {
      p.x = me.x;
      p.y = me.y;
      net.history.clear();
      net.corrections++;
      return;
    }
    for (const tick of [...net.history.keys()]) if (tick < at) net.history.delete(tick);
    if (Math.hypot(ex, ey) < 0.5) return;
    const cx = ex * CORRECTION,
      cy = ey * CORRECTION;
    p.x += cx;
    p.y += cy;
    for (const pos of net.history.values()) {
      pos.x += cx;
      pos.y += cy;
    }
    net.corrections++;
  }
  // Mouvement prédit de l'invité, comme chez l'hôte : sa vitesse, les mêmes murs, la même roulade.
  function predict() {
    const p = game.hero.player;
    if (p.dead || !net.speed) return;
    if (p.atk > 0) p.atk = Math.max(0, p.atk - 1 / 60);
    let dx = Math.sign(game.hero.intent.dx || 0),
      dy = Math.sign(game.hero.intent.dy || 0);
    if (dx || dy) {
      const l = Math.hypot(dx, dy);
      dx /= l;
      dy /= l;
      p.anim = (p.anim || 0) + 0.25;
      if (dx) p.face = dx > 0 ? 1 : -1;
    }
    p.vx = dx * net.speed;
    p.vy = dy * net.speed;
    const nx = p.x + dx * net.speed,
      ny = p.y + dy * net.speed;
    if (canWalk(nx, p.y)) p.x = nx;
    if (canWalk(p.x, ny)) p.y = ny;
    CanaanStages.dodge.after();
  }
  // Pas d'un invité : lissage des positions et envoi de l'intention (20 fois par seconde).
  // Pas d'un invité : prédiction de son mouvement, lissage des autres, effets, puis envoi de l'intention
  // dès qu'elle change (sinon 15 fois par seconde).
  function guestTick() {
    predict();
    net.history.set(time, { x: game.hero.player.x, y: game.hero.player.y });
    net.history.delete(time - HISTORY_TICKS);
    for (const [entity, goal] of net.targets) {
      entity.x += (goal.x - entity.x) * SMOOTH;
      entity.y += (goal.y - entity.y) * SMOOTH;
    }
    CANAAN_SKILLS.ageEffects(1 / 60);
    CANAAN_ARENA.advanceView(1 / 60);
    const intent = game.hero.intent,
      attack = net.pending.attack || intent.attack || null,
      key = [intent.dx, intent.dy, attack].join();
    const urgent = key !== net.lastIntent || net.pending.skill !== null || net.pending.dodge;
    if (!urgent && time % INTENT_TICKS) return;
    net.lastIntent = key;
    const seq = ++net.seq;
    net.seqTicks.set(seq, time);
    net.seqTicks.delete(seq - HISTORY_TICKS);
    send({
      t: 'intent',
      seq,
      dx: intent.dx,
      dy: intent.dy,
      attack,
      skill: net.pending.skill,
      dodge: net.pending.dodge,
      aimX: Math.round(intent.aimX),
      aimY: Math.round(intent.aimY)
    });
    net.pending.attack = null;
    net.pending.skill = null;
    net.pending.dodge = null;
  }
  // Pas de jeu côté réseau : l'hôte envoie l'état du monde, l'invité lisse et envoie son intention.
  function tick() {
    if (game.mode === 'host') checkReserved();
    if (game.mode === 'host' && net.peers.size && time % SNAPSHOT_TICKS === 0) {
      send(snapshot());
      for (const hero of net.peers.values()) send(privateSnapshot(hero));
    } else if (game.mode === 'guest') guestTick();
  }
  // ---------------------------------------------------------------- Jouer sur Internet (application de bureau)
  // L'application lance le relais chez l'hôte et ouvre un tunnel Pinggy ; le salon s'ouvre sur ce relais local,
  // et l'adresse publique du tunnel est celle que les amis collent dans « Relais ».
  const desktop = window.canaanDesktop?.hosting || null;
  net.internet = { state: 'off' };
  const internetStatus = st => {
    const s = st && typeof st === 'object' ? st : {};
    return {
      state: ['off', 'starting', 'online', 'closed', 'error'].includes(s.state) ? s.state : 'off',
      // internet : tunnel Pinggy ; lan : relais ouvert au réseau local (adresses de ce PC sur le réseau).
      kind: s.kind === 'lan' ? 'lan' : s.kind === 'internet' ? 'internet' : null,
      addresses: Array.isArray(s.addresses) ? s.addresses.map(normalizeRelayUrl).filter(Boolean).slice(0, 4) : [],
      // Commandes pour ouvrir le port dans les pare-feux actifs (Linux), et système de l'hôte.
      firewall: Array.isArray(s.firewall) ? s.firewall.filter(c => typeof c === 'string' && /^sudo [\w .=/&+-]+$/.test(c)).slice(0, 3) : [],
      platform: typeof s.platform === 'string' ? s.platform.slice(0, 16) : '',
      local: typeof s.local === 'string' ? s.local : null,
      relay: typeof s.relay === 'string' ? normalizeRelayUrl(s.relay) : null,
      free: !!s.free,
      expiresAt: Number.isFinite(s.expiresAt) ? s.expiresAt : null,
      message: typeof s.message === 'string' ? s.message.slice(0, 300) : ''
    };
  };
  if (desktop)
    desktop.onStatus(st => {
      net.internet = internetStatus(st);
      if (net.internet.state === 'closed' || net.internet.state === 'error') {
        if (game.mode === 'host') chat('Groupe', net.internet.message);
        toast('🌍 ' + net.internet.message);
      }
      setStatus(net.status);
    });
  async function openInternet() {
    if (!desktop || game.mode === 'guest') return false;
    // Passage du réseau local à Internet : le salon local se ferme d'abord (le relais change).
    if (game.mode === 'host' && net.internet.kind === 'lan') closeRoom();
    const me = settings();
    setStatus('Ouverture du tunnel Pinggy…');
    let st;
    try {
      st = internetStatus(await desktop.start({ token: me.pinggyToken, mode: me.pinggyMode, host: me.pinggyHost }));
    } catch (error) {
      st = internetStatus({ state: 'error', message: String(error?.message || error) });
    }
    net.internet = st;
    if (st.state !== 'online') {
      setStatus(st.message || 'Tunnel impossible.');
      return false;
    }
    // Le salon s'ouvre sur le relais local (s'il ne l'est pas déjà : un tunnel rouvert garde le même salon).
    if (!(game.mode === 'host' && net.relay === st.local && net.socket)) openRoom(st.local, { keep: false });
    else setStatus('Tunnel rouvert : donne le nouveau lien à tes amis.');
    return true;
  }
  // Jouer en réseau local : même salon, relais ouvert aux appareils de la maison ; l'invitation donne
  // l'adresse de ce PC sur le réseau (ws://192.168.x.x:8787).
  async function openLan() {
    if (!desktop || game.mode === 'guest') return false;
    if (game.mode === 'host') closeRoom();
    setStatus('Ouverture du relais sur ton réseau local…');
    let st;
    try {
      st = internetStatus(await desktop.startLan());
    } catch (error) {
      st = internetStatus({ state: 'error', kind: 'lan', message: String(error?.message || error) });
    }
    net.internet = st;
    if (st.state !== 'online') {
      setStatus(st.message || 'Relais local impossible.');
      return false;
    }
    openRoom(st.local, { keep: false });
    return true;
  }
  async function closeInternet() {
    closeRoom();
    if (desktop) await desktop.stop();
    net.internet = internetStatus({ state: 'off' });
    setStatus('Salon fermé.');
  }
  // Invitation à partager : lien public du tunnel (ou adresse du relais) et code du salon.
  function invitation() {
    if (!net.code) return '';
    const relay = net.internet.state === 'online' && net.internet.relay ? net.internet.relay : net.relay;
    return makeInvitation(relay, net.code);
  }
  function copyInvitation() {
    const text = invitation();
    if (!text) return false;
    if (desktop) desktop.copy(text);
    else navigator.clipboard?.writeText(text).catch(() => {});
    toast('📋 Invitation copiée : colle-la à tes amis');
    return true;
  }
  function sendChat(text) {
    const clean = cleanChat(text);
    if (!clean) return false;
    if (game.mode === 'guest') send({ t: 'chat', text: clean });
    else if (game.mode === 'host') send({ t: 'chat', from: 'Hôte', text: clean });
    return game.mode !== 'solo';
  }

  window.CANAAN_NET = Object.freeze({
    settings,
    openRoom,
    closeRoom,
    joinRoom,
    tick,
    snapshot,
    applyState,
    sendChat,
    // Invité : une compétence ou une attaque demandée part avec la prochaine intention.
    requestSkill(i) {
      net.pending.skill = i;
      return true;
    },
    requestAttack(heavy) {
      net.pending.attack = heavy ? 'heavy' : 'quick';
      return true;
    },
    requestDodge(dx, dy) {
      net.pending.dodge = { dx: Math.round(dx * 1000) / 1000, dy: Math.round(dy * 1000) / 1000 };
      return true;
    },
    // Invité : équiper, retirer, arme de réserve, changer d'arme ; l'hôte vérifie et renvoie le sac.
    requestAction(action) {
      if (game.mode !== 'guest') return false;
      send({ t: 'action', ...action });
      return true;
    },
    privateSnapshot,
    state: () => ({
      mode: game.mode,
      code: net.code,
      status: net.status,
      peers: net.peers.size,
      heroId: net.heroId,
      relay: net.relay,
      revive: net.revive || 0,
      internet: { ...net.internet },
      canHostOnline: !!desktop
    }),
    openInternet,
    openLan,
    closeInternet,
    invitation,
    copyInvitation,
    parsePinggyLogin,
    // Apparence de son héros d'invité (choisie sur l'écran titre, envoyée en rejoignant).
    setLook(look) {
      remember({ look: encodeLook(look) });
      return decodeLook(settings().look);
    },
    // Préférences Pinggy (abonnement facultatif).
    setPinggy({ token = '', mode = 'http' } = {}) {
      const login = parsePinggyLogin(token);
      if (!login) return false;
      remember({ pinggyToken: login.token, pinggyHost: login.host, pinggyMode: mode === 'tcp' ? 'tcp' : 'http' });
      return true;
    },
    debug: net
  });
})();
