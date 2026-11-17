// Manette : règles pures (client/input/gamepad.js) et jeu piloté à la manette (scripts/gamepad.js), avec une fausse
// manette branchée dans le jeu simulé.
const { test } = require('node:test');
const { assert, path, source } = require('./helpers/context.cjs');
const { pathToFileURL } = require('node:url');

const load = () => import(pathToFileURL(path.join(__dirname, '..', 'src', 'canaan', 'client', 'input', 'gamepad.js')).href);

test('Manette, règles : zone morte, 8 directions, gâchettes, fronts d’appui et répétition', async () => {
  const G = await load();
  assert.deepEqual(G.padStick(0.2, 0.1), { x: 0, y: 0, mag: 0 }, 'zone morte');
  assert.equal(G.padStick(1, 0).mag, 1);
  assert.ok(G.padStick(0.65, 0).mag > 0.45 && G.padStick(0.65, 0).mag < 0.55, 'remis à l’échelle après la zone morte');
  const dir = (x, y) => G.padDirection8(x, y).join();
  assert.equal(dir(0, 0), '0,0');
  assert.equal(dir(0.1, -0.1), '0,0');
  for (const [x, y, want] of [
    [1, 0, '1,0'], [-1, 0, '-1,0'], [0, -1, '0,-1'], [0, 1, '0,1'],
    [0.7, 0.7, '1,1'], [-0.7, -0.7, '-1,-1'], [0.7, -0.7, '1,-1'], [-0.7, 0.7, '-1,1'],
    [0.95, 0.3, '1,0'], [0.3, 0.95, '0,1']
  ])
    assert.equal(dir(x, y), want, x + ',' + y);
  // Lecture : gâchette analogique au-delà du seuil, boutons manquants, axes illisibles.
  const read = G.padRead({ buttons: Object.assign([], { 0: { pressed: true }, 1: { value: 0.2 }, 7: { value: 0.8 } }), axes: [0.5, NaN] });
  assert.deepEqual([read.buttons[0], read.buttons[1], read.buttons[2], read.buttons[7], read.buttons.length], [true, false, false, true, 16]);
  assert.deepEqual([read.lx, read.ly, read.rx], [0.5, 0, 0]);
  const off = G.padRead({ buttons: [], axes: [] }),
    on = G.padRead({ buttons: [{ pressed: true }], axes: [] });
  assert.deepEqual(G.padEdges(off, on), { down: [0], up: [] });
  assert.deepEqual(G.padEdges(on, on), { down: [], up: [] }, 'maintenu : pas de nouvel appui');
  assert.deepEqual(G.padEdges(on, off), { down: [], up: [0] });
  assert.deepEqual(G.padEdges(null, on).down, [0]);
  // Répétition : un pas tout de suite, puis après 360 ms, puis toutes les 120 ms.
  const st = {};
  const steps = [0, 100, 359, 360, 400, 479, 480, 600].map(t => G.padRepeat(st, [1, 0], t));
  assert.deepEqual(steps, [true, false, false, true, false, false, true, true]);
  assert.equal(G.padRepeat(st, [0, 0], 700), false);
  assert.equal(G.padRepeat(st, [1, 0], 710), true, 'relâché puis rappuyé : pas immédiat');
  assert.equal(G.padLabel('e'), 'A');
  assert.equal(G.padLabel('z'), null);
});

test('Manette, menus : l’élément voisin suit la grille, aligné avant en biais, rien au bord', async () => {
  const G = await load();
  // Grille 3 × 2 de cases de 40 × 40 espacées de 10, plus un bouton large en dessous.
  const cell = (c, r) => ({ x: c * 50, y: r * 50, w: 40, h: 40 });
  const rects = [cell(0, 0), cell(1, 0), cell(2, 0), cell(0, 1), cell(1, 1), cell(2, 1), { x: 0, y: 110, w: 140, h: 30 }];
  const go = (i, d) => G.padNeighbor(rects[i], rects, d);
  assert.equal(go(0, [1, 0]), 1);
  assert.equal(go(1, [1, 0]), 2);
  assert.equal(go(2, [1, 0]), -1, 'bord droit');
  assert.equal(go(1, [0, 1]), 4, 'juste en dessous');
  assert.equal(go(4, [-1, 0]), 3);
  assert.equal(go(5, [0, 1]), 6, 'bouton large en dessous');
  assert.equal(go(6, [0, -1]), 4, 'remonte vers la case alignée avec son centre');
  assert.equal(go(0, [0, -1]), -1, 'bord haut');
  // Un élément aligné plus loin passe avant un élément proche mais décalé.
  const far = [{ x: 0, y: 0, w: 20, h: 20 }, { x: 200, y: 0, w: 20, h: 20 }, { x: 40, y: 60, w: 20, h: 20 }];
  assert.equal(G.padNeighbor(far[0], far, [1, 0]), 1);
  // Fin de rangée : un élément loin au-dessus n'est pas « à droite ».
  const row = [{ x: 0, y: 300, w: 60, h: 60 }, { x: 70, y: 300, w: 60, h: 60 }, { x: 140, y: 30, w: 170, h: 40 }];
  assert.equal(G.padNeighbor(row[1], row, [1, 0]), -1);
  assert.equal(G.padNeighbor(row[1], row, [0, -1]), 2, 'mais il est bien au-dessus');
});

// Valeur venant du jeu simulé, copiée dans ce contexte (comparaisons strictes de tableaux et d'objets).
const value = (run, code) => JSON.parse(run('JSON.stringify(' + code + ')'));

function padGame() {
  const runtime = require('./helpers/canaan-runtime.cjs')(source);
  const { run } = runtime;
  // Fausse manette standard, événements clavier du navigateur et dispatchEvent du document.
  run(`globalThis.__pad = { mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    globalThis.navigator = { getGamepads: () => [__pad] };
    globalThis.KeyboardEvent = class { constructor(type, o) { Object.assign(this, o); this.type = type; this.isTrusted = false; this.target = document; this.preventDefault = () => {}; this.stopPropagation = () => {}; } };
    document.dispatchEvent = e => { for (const f of document.listeners?.[e.type] || []) f(e); for (const f of globalThis.listeners?.[e.type] || []) f(e); return true; };
    globalThis.__t = 1000;
    globalThis.padPress = (b, on = true) => { __pad.buttons[b].pressed = on; CANAAN_GAMEPAD.poll(__t += 16); };
    globalThis.padStickTo = (i, x, y) => { __pad.axes[i] = x; __pad.axes[i + 1] = y; CANAAN_GAMEPAD.poll(__t += 16); };
    started = true; paused = false; game.world.instance = null; game.world.monsters.length = 0;`);
  return runtime;
}

test('Manette en jeu : déplacement, compétences, attaques, roulade, pause, sans gêner le clavier', () => {
  const { run, errors, fire } = padGame();
  const B = run('PAD_BUTTONS');
  // Stick gauche : le héros veut aller à droite ; au repos, il s'arrête.
  run('padStickTo(0, 1, 0); readInput()');
  assert.deepEqual(value(run, '[game.hero.intent.dx, game.hero.intent.dy, CANAAN_GAMEPAD.active()]'), [1, 0, true]);
  run('padStickTo(0, -0.7, -0.7); readInput()');
  assert.deepEqual(value(run, '[game.hero.intent.dx, game.hero.intent.dy]'), [-1, -1], 'diagonale');
  run('padStickTo(0, 0, 0); readInput()');
  assert.deepEqual(value(run, '[game.hero.intent.dx, game.hero.intent.dy]'), [0, 0]);
  // Le clavier n'est pas relâché par une manette au repos.
  run('keys.d = true; CANAAN_GAMEPAD.poll(__t += 16); readInput()');
  assert.equal(run('game.hero.intent.dx'), 1, 'touche D gardée');
  run('keys.d = false');
  // X, Y, LB, RB : compétences 1 à 4 (par les mêmes touches que le clavier).
  run('globalThis.__skills = []; useSkill = i => __skills.push(i)');
  for (const b of [B.X, B.Y, B.LB, B.RB]) run(`padPress(${b}); padPress(${b}, false)`);
  assert.deepEqual(value(run, '__skills'), [0, 1, 2, 3]);
  run('padPress(' + B.X + '); padPress(' + B.X + '); padPress(' + B.X + ')');
  assert.deepEqual(value(run, '__skills'), [0, 1, 2, 3, 0], 'bouton maintenu : une seule compétence de plus');
  run('padPress(' + B.X + ', false)');
  // RT : attaque rapide maintenue ; LT : attaque lourde.
  run('padPress(' + B.RT + ')');
  assert.equal(run('CANAAN_BASIC_ATTACK.held().left'), true);
  run('padPress(' + B.RT + ', false); padPress(' + B.LT + ')');
  assert.deepEqual(value(run, 'CANAAN_BASIC_ATTACK.held()'), { left: false, right: true });
  run('padPress(' + B.LT + ', false)');
  // B : roulade dans la direction du stick.
  run('globalThis.__dodge = []; canaanDodge = (x, y) => __dodge.push([x, y]); __pad.axes[0] = 0; __pad.axes[1] = 1; padPress(' + B.B + '); padPress(' + B.B + ', false)');
  assert.deepEqual(value(run, '__dodge'), [[0, 1]]);
  run('padStickTo(0, 0, 0)');
  // Croix : ↓ change d'arme, A interagit.
  run('globalThis.__calls = []; switchWeapon = () => __calls.push("arme"); interact = () => __calls.push("parler")');
  run(`padPress(${B.DOWN}); padPress(${B.DOWN}, false); padPress(${B.A}); padPress(${B.A}, false)`);
  assert.deepEqual(value(run, '__calls'), ['arme', 'parler']);
  // Start : pause.
  run(`padPress(${B.START}); padPress(${B.START}, false)`);
  assert.equal(run('paused'), true);
  run('togglePause(false)');
  // Souris : elle reprend la main.
  fire(run('globalThis'), 'mousemove', { clientX: 10, clientY: 10, movementX: 8, movementY: 0 });
  assert.equal(run('CANAAN_GAMEPAD.active()'), false);
  assert.deepEqual(errors, []);
});

test('Manette en jeu : visée au stick droit, visée automatique, menu ouvert, libellés et vibrations', () => {
  const { run, nodes, errors } = padGame();
  const B = run('PAD_BUTTONS');
  run('P.x = 1000; P.y = 1000; camX = 600; camY = 700');
  // Stick droit : visée devant le héros dans sa direction.
  run('padStickTo(2, 0, -1)');
  assert.deepEqual(value(run, '[Math.round(mouseWorldX), Math.round(mouseWorldY)]'), [1000, 840]);
  // Stick au repos (passé le délai) : le monstre le plus proche est visé.
  run('game.world.monsters.push({ hp: 10, x: 1200, y: 1050 }, { hp: 10, x: 1100, y: 980 }, { hp: 0, x: 1010, y: 1000 }); padStickTo(2, 0, 0); __t += 2000; CANAAN_GAMEPAD.poll(__t)');
  assert.deepEqual(value(run, '[mouseWorldX, mouseWorldY]'), [1100, 980], 'monstre vivant le plus proche');
  // Un panneau s'ouvre : le héros lâche tout (direction, attaque).
  run(`padStickTo(0, 1, 0); padPress(${B.RT})`);
  assert.equal(run('keys.arrowright'), true);
  run('document.getElementById("overlay").style.display = "flex"; CANAAN_GAMEPAD.poll(__t += 16)');
  assert.deepEqual(value(run, '[keys.arrowright, CANAAN_BASIC_ATTACK.held().left]'), [false, false]);
  run(`document.getElementById("overlay").style.display = "none"; padStickTo(0, 0, 0); padPress(${B.RT}, false)`);
  // View : barre des menus ; B en sort.
  run(`padPress(${B.VIEW}); padPress(${B.VIEW}, false)`);
  assert.equal(run('CANAAN_GAMEPAD.menuBar()'), true);
  run(`padPress(${B.B}); padPress(${B.B}, false)`);
  assert.equal(run('CANAAN_GAMEPAD.menuBar()'), false);
  // Libellés : la touche E devient le bouton A, dans le texte et les messages.
  assert.equal(run('CANAAN_GAMEPAD.keyText("[E] Entrer")'), '[A] Entrer');
  assert.equal(run('CANAAN_GAMEPAD.keyText("Ça mord ! (E)")'), 'Ça mord ! (A)');
  run('toast("Approche-toi et appuie sur E pour ouvrir.")');
  assert.equal(nodes.get('toast').textContent, 'Approche-toi et appuie sur A pour ouvrir.');
  // Vibrations : secousse de l'écran (forte) et coup reçu (légère) ; coupées dans les Paramètres.
  run('globalThis.__rumble = []; __pad.vibrationActuator = { playEffect: (t, o) => __rumble.push(o.strongMagnitude) }; CANAAN_GAMEPAD.poll(__t += 16)');
  run('shake = 18; CANAAN_GAMEPAD.poll(__t += 16); P.hp -= 5; CANAAN_GAMEPAD.poll(__t += 16)');
  assert.deepEqual(value(run, '__rumble'), [1, 0.3]);
  run('canaanDisplay.rumble = false; shake = 30; CANAAN_GAMEPAD.poll(__t += 16)');
  assert.equal(run('__rumble.length'), 2);
  assert.deepEqual(errors, []);
});
