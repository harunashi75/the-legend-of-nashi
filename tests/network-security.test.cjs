// Robustesse du coopératif : messages malformés, relais saturé, invité tricheur, hôte malveillant, déconnexions.
// L'hôte fait autorité : un invité n'envoie que des intentions et des demandes, vérifiées chez l'hôte ; un invité ne
// fait confiance à l'hôte que pour ce qu'il affiche, et rien de ce que l'hôte envoie ne doit casser son jeu.
const { test } = require('node:test');
const { assert, path, source } = require('./helpers/context.cjs');

const wait = ms => new Promise(r => setTimeout(r, ms));
const messagesModule = () =>
  import(require('node:url').pathToFileURL(path.join(__dirname, '..', 'src', 'canaan', 'shared', 'net', 'messages.js')).href);
// Texte piégé glissé dans chaque champ : il ne doit jamais arriver tel quel dans le DOM.
const X = '<b data-xss>';

// Une partie dont le WebSocket est remplacé : on lui remet les messages à la main, et on lit ce qu'elle envoie.
function sideWithFakeSocket() {
  const s = require('./helpers/canaan-runtime.cjs')(source);
  const sockets = [];
  class FakeSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.sent = [];
      sockets.push(this);
    }
    send(text) {
      this.sent.push(JSON.parse(text));
    }
    close() {
      this.readyState = 3;
      this.onclose?.();
    }
  }
  s.g.WebSocket = FakeSocket;
  s.g.Event = class {
    constructor(type) {
      this.type = type;
    }
  };
  // Le double du DOM n'a pas de firstChild : le chat (40 lignes au plus) retire la plus ancienne ligne par là.
  s.run('{const l=document.getElementById("chatlog");Object.defineProperty(l,"firstChild",{get(){return {remove:()=>l.children.shift()}}})}');
  // Éléments créés par le jeu (fenêtres, info-bulles) : relus pour y chercher du HTML injecté.
  s.made = [];
  const create = s.g.document.createElement;
  s.g.document.createElement = (...a) => {
    const el = create(...a);
    s.made.push(el);
    return el;
  };
  s.sockets = sockets;
  s.socket = () => sockets[sockets.length - 1];
  s.deliver = m => s.socket().onmessage({ data: typeof m === 'string' ? m : JSON.stringify(m) });
  return s;
}
// Hôte avec un salon ouvert et un invité accepté (peer p1).
function hostWithGuest() {
  const host = sideWithFakeSocket();
  host.run('started=true;paused=false;P.dead=false');
  host.run('CANAAN_NET.openRoom("ws://localhost:8787")');
  host.socket().onopen();
  host.deliver({ t: 'room', code: 'ABCDEF' });
  const join = {
    t: 'join',
    peer: 'p1',
    id: 'g-tricheur01',
    key: 'k'.repeat(32),
    pseudo: 'Tricheur',
    version: host.run('CANAAN_VERSION'),
    schema: host.run('SAVE_SCHEMA'),
    extensions: host.run('canaanExtensionIds().join(",")')
  };
  host.deliver(join);
  host.join = join;
  return host;
}
// Tout ce qu'un invité pourrait vouloir gagner en trichant, chez lui et chez l'hôte.
const wealth = side =>
  side.run(
    'JSON.stringify(game.heroes.map(h=>({n:h.name,gold:h.player.gold,keys:h.player.keys||0,inv:h.inventory.map(i=>i.id),eq:Object.values(h.equipment).map(i=>i&&i.id),bag:h.bagLevel||0,lv:h.level,exp:h.exp,cls:h.classe,art:h.artefacts,arena:h.arena,bank:(h.bank||null)})))'
  );

test('Protocole : clés __proto__ retirées à la lecture, objets reçus vérifiés', async () => {
  const n = await messagesModule();
  const m = n.parseMessage('{"t":"state","__proto__":{"a":1},"monsters":[{"k":1,"__proto__":{"boss":true}}]}');
  assert.equal(Object.getPrototypeOf(m), Object.prototype);
  assert.equal(Object.hasOwn(m, '__proto__'), false);
  assert.equal(Object.getPrototypeOf(m.monsters[0]), Object.prototype);
  assert.equal(Object.assign({}, m.monsters[0]).boss, undefined, 'Object.assign ne change plus de prototype');
  assert.equal(n.parseMessage('{"t":"state","x":{"y":{"__proto__":{"z":1}}}}').x.y.z, undefined);
  for (const bad of ['', 'null', '1', '"state"', '[{"t":"state"}]', '{"t":7}', '{"t":"toString"}', '{"t":"__proto__"}'])
    assert.equal(n.parseMessage(bad), null, bad);
  const items = await import(
    require('node:url').pathToFileURL(path.join(__dirname, '..', 'src', 'canaan', 'shared', 'rules', 'items.js')).href
  );
  assert.equal(items.isGearItem({ id: 'a', slot: 'armor', level: 3 }), true);
  assert.equal(items.isGearItem({ slot: 'ring', ilvl: 40 }), true, 'anciennes sauvegardes (iLvl)');
  for (const bad of [null, 'armor', [], {}, { slot: 'ring2' }, { slot: 'cape' }, { slot: 'helm', level: -1 }, { slot: 'helm', level: 'x' }])
    assert.equal(items.isGearItem(bad), false, JSON.stringify(bad));
});

test('Relais : binaire, JSON illisible, message trop gros, inondation, codes faux, connexion muette et relais plein', async () => {
  const { createRelay } = require('../online/relay.cjs');
  const { MESSAGE_LIMIT } = await messagesModule();
  const relay = createRelay({ port: 0, rate: 20, maxClients: 6, joinAttempts: 3, helloDelay: 150 });
  await relay.ready;
  const url = 'ws://localhost:' + relay.port;
  const open = () =>
    new Promise(r => {
      const s = new WebSocket(url);
      s.got = [];
      s.closed = null;
      s.onmessage = e => s.got.push(JSON.parse(e.data));
      s.onclose = e => (s.closed = e.code);
      s.onopen = () => r(s);
    });
  try {
    const host = await open();
    // Binaire, JSON illisible, type inconnu : ignorés, la connexion reste ouverte et sert encore.
    host.send(new Uint8Array([1, 2, 3]));
    host.send('{oops');
    host.send('{"t":"pirate"}');
    host.send(JSON.stringify({ t: 'host' }));
    await wait(60);
    assert.equal(host.closed, null);
    const code = host.got.find(m => m.t === 'room').code;
    // Message trop gros : le relais coupe la connexion (au-delà de la taille permise).
    const big = await open();
    big.send(JSON.stringify({ t: 'join', code, pad: 'x'.repeat(MESSAGE_LIMIT) }));
    await wait(80);
    assert.notEqual(big.closed, null, 'message démesuré : connexion fermée');
    assert.equal(host.got.filter(m => m.t === 'join').length, 0, 'rien n’arrive à l’hôte');
    // Codes faux : au troisième, la connexion est fermée (pas de devinette en série).
    const guesser = await open();
    for (const c of ['AAAAAA', 'BBBBBB', 'CCCCCC']) guesser.send(JSON.stringify({ t: 'join', code: c, id: 'g-devineur' }));
    await wait(80);
    assert.equal(guesser.closed, 1008);
    assert.equal(guesser.got.filter(m => m.t === 'error').length, 3);
    // Connexion muette : fermée après le délai de présentation ; une connexion présentée reste.
    const silent = await open();
    await wait(250);
    assert.equal(silent.closed, 1008);
    assert.equal(host.closed, null, 'l’hôte, présenté, reste connecté');
    // Inondation : au-delà de trois fois la limite par seconde, la connexion est fermée.
    const guest = await open();
    guest.send(JSON.stringify({ t: 'join', code, id: 'g-inondeur', pseudo: 'Flot' }));
    await wait(40);
    for (let i = 0; i < 80; i++) guest.send(JSON.stringify({ t: 'chat', text: 'spam' + i }));
    await wait(80);
    assert.equal(guest.closed, 1008);
    const relayed = host.got.filter(m => m.t === 'chat').length;
    assert.ok(relayed <= 20, 'au plus la limite par seconde est transmise (' + relayed + ')');
    assert.ok(host.got.some(m => m.t === 'left'), 'l’hôte apprend le départ de l’invité');
    // Relais plein : au-delà de maxClients connexions, la nouvelle est refusée.
    const crowd = [];
    for (let i = 0; i < 6; i++) crowd.push(await open());
    await wait(60);
    assert.ok(crowd.some(s => s.closed === 1013), 'relais plein');
    // Un invité ne peut ni se faire passer pour l'hôte ni parler aux autres invités.
    const a = crowd.find(s => s.closed === null);
    a.send(JSON.stringify({ t: 'join', code, id: 'g-invitea1' }));
    await wait(40);
    a.send(JSON.stringify({ t: 'state', heroes: [] }));
    a.send(JSON.stringify({ t: 'kick', peer: 'p1' }));
    a.send(JSON.stringify({ t: 'room', code: 'ZZZZZZ' }));
    await wait(40);
    assert.ok(!host.got.some(m => m.t === 'state' || m.t === 'kick' || m.t === 'room' && m.code === 'ZZZZZZ'));
    // L'hôte part : chaque invité reçoit « closed » et sa connexion est fermée.
    host.close();
    await wait(60);
    assert.ok(a.got.some(m => m.t === 'closed'));
    assert.notEqual(a.closed, null);
  } finally {
    await relay.close();
  }
});

test('Invité malveillant : arrivées piégées refusées, intentions bornées, aucune action ne fait gagner quoi que ce soit', () => {
  const host = hostWithGuest();
  const { run } = host;
  const sent = () => host.socket().sent;
  assert.ok(sent().some(m => m.t === 'accept' && m.peer === 'p1'));
  // Arrivées piégées : version, contenu, identifiant ; pseudo et apparence démesurés sont nettoyés.
  const base = { ...host.join, t: 'join' };
  host.deliver({ ...base, peer: 'p2', version: '0.0.1' });
  host.deliver({ ...base, peer: 'p3', extensions: 'pirate' });
  host.deliver({ ...base, peer: 'p4', id: '<script>' });
  host.deliver({ ...base, peer: 'p5', id: 'g-piege0005', pseudo: X + 'x'.repeat(500), look: 'z'.repeat(60000) });
  const refusals = sent().filter(m => m.t === 'refuse').map(m => m.peer);
  assert.deepEqual(refusals, ['p2', 'p3', 'p4']);
  const trapped = run('JSON.stringify(game.guests["g-piege0005"].name)');
  assert.doesNotMatch(trapped, /[<>]/);
  assert.ok(JSON.parse(trapped).length <= 24);
  // Intentions absurdes : une direction unitaire, jamais une téléportation.
  run('game.guests["g-tricheur01"].player.x=P.x;game.guests["g-tricheur01"].player.y=P.y');
  const x0 = run('game.guests["g-tricheur01"].player.x'),
    y0 = run('game.guests["g-tricheur01"].player.y');
  for (let i = 0; i < 60; i++) {
    host.deliver({ t: 'intent', peer: 'p1', dx: 1e308, dy: -1e308, aimX: 'Infinity', skill: 3.5, seq: -5, dodge: { dx: 1e9, dy: 'x' } });
    run('time++;readInput();simulateStep();updateWorld()');
  }
  const moved = Math.hypot(run('game.guests["g-tricheur01"].player.x') - x0, run('game.guests["g-tricheur01"].player.y') - y0);
  assert.ok(Number.isFinite(moved) && moved < 60 * 4.1 * 3, 'déplacement borné par la vitesse (' + Math.round(moved) + ' px)');
  // Triches ciblées, près d'un marchand : vendre ou équiper l'objet de l'hôte, acheter sans or, ouvrir un coffre
  // à distance, monter le sac, améliorer l'arme, équiper un talent hors niveau, échanger ce qu'on n'a pas…
  run('{const m=game.world.npcs.find(n=>/marchand|merchant/i.test(n.type||"")||n.shop);if(m){game.guests["g-tricheur01"].player.x=m.x;game.guests["g-tricheur01"].player.y=m.y+30}}');
  const before = wealth(host);
  const cheats = [
    { op: 'sell', id: 'armor1' },
    { op: 'equip', id: 'armor1' },
    { op: 'salvage', id: 'armor1' },
    { op: 'shop-buy', index: 0 },
    { op: 'buy-gear' },
    { op: 'bag-upgrade' },
    { op: 'shovel-buy' },
    { op: 'open-chest' },
    { op: 'dungeon-use' },
    { op: 'weapon-upgrade' },
    { op: 'talent-equip', talent: 9 },
    { op: 'artefact-equip', artefact: 'coeur_de_fer' },
    { op: 'bank-withdraw', ref: 'armor1' },
    { op: 'sell-stack', token: 'fish:aveugle:7*999' },
    { op: 'enchant-apply', token: 'ench:crit:5*9', ref: 'armor1' },
    { op: 'cook', recipe: 'dore', quality: 7, count: 20 },
    { op: 'quest-turnin', q: 1 },
    { op: 'quest-shells' },
    { op: 'city-bless' },
    { op: 'skin-wear', id: 'dragon' },
    { op: 'trade-offer', items: ['armor1'], gold: 1e12 },
    { op: 'trade-request', to: 'host' },
    { op: 'trade-ready', yes: true }
  ];
  for (const c of cheats) host.deliver({ t: 'action', peer: 'p1', ...c });
  // Toutes les actions connues, avec des paramètres piégés : aucune exception, rien de gagné.
  const ops = [...new Set(cheats.map(c => c.op).concat(['unequip', 'class-choose', 'talent-unequip', 'quest-accept', 'quest-act', 'quest-trade', 'gather', 'hunt', 'fish', 'eat', 'leather-tan', 'leather-saddle', 'enchant-craft', 'enchant-reroll', 'barber-look', 'house-door', 'city-gate', 'city-skin', 'ext', 'ach-title', 'bag-sort', 'dig', 'trade-answer', 'trade-cancel']))];
  const junk = [X, -1, 1e12, 0, '', null, [], {}, '__proto__', 'host', 'ring2', true];
  let k = 0;
  for (const op of ops)
    for (let r = 0; r < 6; r++) {
      const a = { t: 'action', peer: 'p1', op };
      for (const f of ['id', 'slot', 'cls', 'talent', 'q', 'choice', 'npc', 'site', 'obj', 'artefact', 'ref', 'index', 'token', 'look', 'node', 'quality', 'count', 'stat', 'tier', 'game', 'recipe', 'to', 'yes', 'items', 'gold', 'ext', 'act'])
        a[f] = junk[k++ % junk.length];
      host.deliver(a);
    }
  host.deliver('{"t":"action","peer":"p1","op":"equip","id":"x","__proto__":{"admin":true}}');
  host.deliver({ t: 'intent', peer: 'p1', __proto__: null });
  for (let i = 0; i < 20; i++) run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');
  const after = JSON.parse(wealth(host)),
    was = JSON.parse(before);
  for (const h of after) {
    const b = was.find(x => x.n === h.n);
    if (!b) continue;
    assert.ok(h.gold <= b.gold, h.n + ' : or gagné');
    for (const id of h.inv) assert.ok(b.inv.includes(id), h.n + ' : objet apparu ' + id);
    assert.equal(h.bag, b.bag, h.n + ' : sac agrandi');
    assert.deepEqual(h.art, b.art, h.n + ' : artéfacts');
    assert.equal(h.lv, b.lv, h.n + ' : niveau');
  }
  assert.ok(after.find(h => h.n === null || h.n === undefined || h.n === 'Hôte' || h.inv.includes('armor1')).inv.includes('armor1'), 'l’hôte garde son objet');
  assert.equal(run('({}).admin'), undefined, 'aucune pollution de prototype');
  // Chat piégé : coupé à 200 caractères, rediffusé, et affiché comme du texte.
  host.deliver({ t: 'chat', peer: 'p1', text: X.repeat(100) });
  const relayed = sent().filter(m => m.t === 'chat').pop();
  assert.ok(relayed.text.length <= 200);
  assert.ok(run('document.getElementById("chatlog").children.every(c=>!c.innerHTML.includes("<b"))'));
  assert.deepEqual(host.errors, []);
});

test('Hôte malveillant : messages tordus sans plantage, positions sûres, sac filtré, aucun HTML injecté', () => {
  const guest = sideWithFakeSocket();
  const { run } = guest;
  run('CANAAN_NET.joinRoom({relay:"ws://localhost:8787",code:"ABCDEF",pseudo:"Lina"})');
  guest.socket().onopen();
  const join = guest.socket().sent.find(m => m.t === 'join');
  assert.equal(join.code, 'ABCDEF');
  guest.deliver({ t: 'accept', heroId: 'g-moi000001', name: X + 'Hôte', host: 'x', back: false });
  assert.equal(run('game.mode'), 'guest');
  assert.doesNotMatch(run('game.hero.name'), /[<>]/);
  guest.deliver({ t: 'state', map: { instance: null, layer: 'surface' }, heroes: [{ id: 'g-moi000001', x: 500, y: 500 }] });
  const item = { id: 'it1', name: X, slot: 'weapon', level: 5, rarity: X, weaponType: X, origin: X, sec: { [X]: 5 }, ench: { stat: X, value: X } };
  const evil = [
    {
      t: 'state',
      map: { instance: null, layer: 'surface' },
      heroes: [
        { id: 'host', name: X, x: 100, y: 100, look: X, ttl: X, wpn: X, act: [X], fish: [X], color: X },
        { id: 'g-moi000001', x: NaN, y: 'x', look: X },
        { id: X, x: Infinity, y: 0 },
        null,
        7
      ],
      monsters: [
        { k: 1, t: X, x: 5, y: 5, hp: 1, mhp: 1, title: X, look: X, pal: X, lookOpts: X },
        { k: 2, t: 'Loup', x: 'a', y: null },
        null,
        'loup'
      ],
      drops: [{ x: X }, null],
      projectiles: [{ x: 1, y: 1, c: X, k: 99 }, { x: NaN }],
      fx: [['f', 1, 1, X, X], ['v', X], ['b', 1, 1, X, 1e9], 'x', null],
      summons: X,
      holes: X,
      chests: [{ id: X, x: 1, y: 1 }, null],
      opened: [X, 5],
      arena: X,
      ext: X,
      quests: X
    },
    { t: 'state', map: { instance: 9999 }, heroes: [] },
    { t: 'state', map: { instance: 'arena' }, heroes: 'tous' },
    { t: 'state', map: X, heroes: X, monsters: X, drops: X, projectiles: X },
    {
      t: 'me',
      x: NaN,
      y: 1,
      speed: 1e9,
      cds: X,
      stance: { [X]: 1, berserk: 'x' },
      effects: X,
      live: X,
      level: 1e9,
      exp: -5,
      trade: { with: X, state: 'open', mine: { items: [X], gold: X }, theirs: { items: [item, null], gold: X }, partners: [{ id: X, name: X }] },
      shop: { kind: 'armurier', items: [item, null, X], prices: [1, 2, 3] },
      bank: { items: [item, null], stacks: X },
      ach: { done: { [X]: 1 }, titles: [X] },
      bag: {
        inventory: [item, X, null, {}, { slot: 'ring2', level: 3 }, { slot: 'armor', level: -2 }],
        equipment: { weapon: item, ring: X, helm: { slot: 'boots', level: 2 }, __proto__: { admin: true } },
        satchel: [item, null],
        classe: { id: X, talents: [X] },
        quetes: { active: { [X]: X }, done: X },
        artefacts: X,
        arena: { lastBoss: X, best: 1e9 },
        prof: X,
        skins: X,
        bless: X
      }
    },
    { t: 'notice', text: X },
    { t: 'chat', from: X, text: X },
    '{"t":"state","map":{"instance":null},"heroes":[],"monsters":[{"k":3,"x":1,"y":1,"__proto__":{"hacked":1}}]}'
  ];
  for (const m of evil) guest.deliver(m);
  // Son héros n'est jamais envoyé en NaN (caméra), et son sac ne garde que des objets bien formés.
  assert.equal(run('Number.isFinite(P.x)&&Number.isFinite(P.y)'), true);
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.inventory.map(i=>i.id||null))')), ['it1']);
  assert.equal(run('game.hero.equipment.helm'), null, 'une botte ne va pas sur la tête');
  assert.equal(run('game.hero.equipment.ring'), null);
  assert.equal(run('game.hero.equipment.weapon.id'), 'it1');
  assert.equal(run('game.hero.level<=60'), true);
  assert.equal(run('game.world.monsters.every(m=>Number.isFinite(m.x)&&Number.isFinite(m.y))'), true);
  assert.equal(run('game.world.monsters.every(m=>Object.getPrototypeOf(m)===Object.prototype)'), true);
  assert.equal(run('({}).hacked===undefined&&({}).admin===undefined'), true);
  // Son écran tient : images dessinées, fenêtres ouvertes, rien d'injecté dans le DOM.
  for (const code of [
    'time++;draw()',
    'CANAAN_UI.openInventory()',
    'renderInventory()',
    'renderCharacter()',
    'showGearTooltip(game.hero.inventory[0],{clientX:5,clientY:5})',
    'CANAAN_SHOP.open(0)',
    'CANAAN_SHOP.render()',
    'CANAAN_BANK.open()',
    'CANAAN_BANK.render()',
    'toggleTrade()',
    'CANAAN_TRADE.render()',
    'renderTalents()',
    'CANAAN_QUESTS.render("story")',
    'time++;draw()'
  ])
    run(code);
  const injected = [...guest.nodes.values(), ...guest.made]
    .map(n => String(n.innerHTML || ''))
    .filter(html => html.includes(X));
  assert.deepEqual(injected, [], 'texte de l’hôte inséré sans échappement');
  assert.deepEqual(guest.errors, []);
});

test('Usurpation : l’identifiant d’un invité est public, sa clé secrète ; un imposteur ne prend pas son héros', () => {
  const host = hostWithGuest();
  const { run } = host;
  const sent = () => host.socket().sent;
  // L'identifiant des invités part dans l'état envoyé à tous ; la clé, jamais (ni dans l'état, ni dans le message privé).
  for (let i = 0; i < 12; i++) run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');
  const broadcast = JSON.stringify(sent().filter(m => m.t === 'state' || m.t === 'me'));
  assert.ok(broadcast.includes('g-tricheur01'), 'identifiant public');
  assert.ok(!broadcast.includes('k'.repeat(32)), 'clé jamais rediffusée');
  // Un autre joueur reprend l'identifiant avec une autre clé : refusé, et le vrai joueur n'est pas éjecté.
  host.deliver({ ...host.join, peer: 'p9', key: 'z'.repeat(32), pseudo: 'Imposteur' });
  assert.ok(sent().some(m => m.t === 'refuse' && m.peer === 'p9' && /autre joueur/.test(m.reason)));
  assert.ok(!sent().some(m => m.t === 'kick' && m.peer === 'p1'), 'le vrai joueur reste connecté');
  assert.equal(run('CANAAN_NET.debug.peers.get("p1")?.id'), 'g-tricheur01');
  host.deliver({ ...host.join, peer: 'p8', key: undefined });
  assert.ok(sent().some(m => m.t === 'refuse' && m.peer === 'p8'), 'sans clé : refusé');
  // Le vrai joueur revient avec sa clé (nouvelle connexion) : il reprend son héros, l'ancienne connexion est fermée.
  host.deliver({ ...host.join, peer: 'p2' });
  assert.ok(sent().some(m => m.t === 'kick' && m.peer === 'p1'));
  assert.ok(sent().some(m => m.t === 'accept' && m.peer === 'p2'));
  // La clé est enregistrée avec le héros dans la sauvegarde de l'hôte, et relue au chargement.
  assert.equal(run('saveGame()'), true);
  const saved = JSON.parse(run('localStorage.getItem("canaan_slot_1")'));
  assert.equal(saved.heros.invites['g-tricheur01'].key, 'k'.repeat(32));
  run('CANAAN_GROUP.importGuests(JSON.parse(localStorage.getItem("canaan_slot_1")).heros.invites)');
  assert.equal(run('game.guests["g-tricheur01"].netKey'), 'k'.repeat(32));
  // Héros enregistré avant les clés : il reçoit celle de sa prochaine venue, qui le protège ensuite.
  run('delete game.guests["g-tricheur01"].netKey');
  host.deliver({ ...host.join, peer: 'p3', key: 'a'.repeat(32) });
  assert.ok(sent().some(m => m.t === 'accept' && m.peer === 'p3'));
  assert.equal(run('game.guests["g-tricheur01"].netKey'), 'a'.repeat(32));
  host.deliver({ ...host.join, peer: 'p4', key: 'b'.repeat(32) });
  assert.ok(sent().some(m => m.t === 'refuse' && m.peer === 'p4'));
  assert.deepEqual(host.errors, []);
});

test('Déconnexions : l’invité perd l’hôte, l’hôte perd le relais, chacun retombe sur ses pieds', () => {
  // Invité : la connexion tombe en pleine partie ; il l’apprend, n’enregistre rien et repart vers l’écran titre.
  const guest = sideWithFakeSocket();
  guest.run('CANAAN_NET.joinRoom({relay:"ws://localhost:8787",code:"ABCDEF",pseudo:"Lina"})');
  guest.socket().onopen();
  guest.deliver({ t: 'accept', heroId: 'g-moi000001', name: 'Hôte', host: 'x', back: false });
  guest.deliver({ t: 'state', map: { instance: null, layer: 'surface' }, heroes: [{ id: 'g-moi000001', x: 500, y: 500 }] });
  guest.socket().close();
  assert.match(guest.run('CANAAN_NET.state().status'), /Connexion perdue/);
  assert.equal(guest.run('saveGame()'), false, 'un invité n’enregistre jamais le monde de l’hôte');
  // Messages arrivés après la coupure (socket déjà oublié) : sans effet.
  guest.run('time++;draw()');
  assert.deepEqual(guest.errors, []);
  // Hôte : le relais tombe ; les invités deviennent « déconnectés » puis quittent le groupe, l’hôte repasse en solo.
  const host = hostWithGuest();
  assert.equal(host.run('game.mode'), 'host');
  assert.equal(host.run('game.heroes.length'), 2);
  host.deliver({ t: 'left', peer: 'p1' });
  assert.equal(host.run('!!game.guests["g-tricheur01"].away'), true, 'place gardée');
  host.deliver({ t: 'intent', peer: 'p1', dx: 1 });
  assert.equal(host.run('game.guests["g-tricheur01"].intent.dx'), 0, 'un invité parti ne commande plus son héros');
  host.socket().close();
  assert.equal(host.run('game.mode'), 'solo');
  assert.equal(host.run('CANAAN_NET.state().peers'), 0);
  assert.equal(host.run('game.heroes.length'), 1);
  for (let i = 0; i < 10; i++) host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick();draw()');
  assert.deepEqual(host.errors, []);
});

test('Politique de sécurité du contenu : seuls les scripts assemblés s’exécutent, rien n’est chargé du dehors', () => {
  const crypto = require('node:crypto');
  const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"\/>/.exec(source);
  assert.ok(meta, 'politique présente dans le HTML assemblé');
  assert.ok(source.indexOf(meta[0]) < source.indexOf('<script'), 'posée avant le premier script');
  const policy = Object.fromEntries(
    meta[1].split(';').map(part => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    })
  );
  assert.deepEqual(policy['default-src'], ["'none'"]);
  assert.ok(!policy['script-src'].includes("'unsafe-inline'") && !policy['script-src'].includes("'unsafe-eval'"));
  // Chaque script du HTML a son empreinte dans la politique, et la politique n'en autorise pas d'autre.
  const scripts = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
    m => "'sha256-" + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64') + "'"
  );
  assert.deepEqual([...policy['script-src']].sort(), [...new Set(scripts)].sort());
  assert.deepEqual(policy['connect-src'], ['ws:', 'wss:'], 'réseau : les WebSockets du coopératif seulement');
  for (const [name, values] of Object.entries(policy))
    for (const v of values) assert.doesNotMatch(v, /^https?:|^\*$|\.[a-z]{2,}$/i, name + ' : ' + v);
  // Aucun gestionnaire en attribut (onclick, onerror…) dans la page : la politique les bloquerait.
  assert.doesNotMatch(source.replace(/<script\b[\s\S]*?<\/script>/g, ''), /<[a-z][^>]*\son[a-z]+=/i);
});
