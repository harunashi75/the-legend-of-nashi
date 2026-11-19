// Extensions : contenu préparé à l'avance, absent du build de sortie (Extension 1 : la Vallée des Héros).
// Le build de sortie (node tools/build.cjs) ne contient rien de la vallée : sa terre est fermée, sous la brume et le
// nuage des cartes. Le build de test (--extensions) l'ouvre : lieux, montures et Valérion.
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { render, manifest } = require('../tools/build.cjs');
const boot = require('./helpers/canaan-runtime.cjs');

const locked = render();
const open = render({ extensions: true });
const ROOT = path.join(__dirname, '..', 'src', 'canaan');

test('Build de sortie : aucun fichier ni texte de l’Extension 1 ; build de test : la vallée complète', () => {
  const ext = manifest().filter(m => m.extension);
  assert.ok(ext.length >= 5, 'fichiers de l’extension déclarés dans le manifeste');
  assert.ok(ext.every(m => m.extension === 'vallee' && m.file.startsWith('extensions/vallee/')));
  for (const m of ext) {
    assert.ok(!locked.includes('id="' + m.id + '"'), 'retiré du build de sortie : ' + m.id);
    assert.ok(
      open.includes('id="' + m.id + '" data-extension="vallee"'),
      'présent dans le build de test : ' + m.id
    );
  }
  for (const word of [
    'Dernier Champion',
    'Vallée',
    'Garance',
    'Coursier',
    'Valley of Heroes',
    'monture',
    'Monture',
    'Col des Héros'
  ])
    assert.ok(!locked.includes(word), 'aucune trace de « ' + word + ' » dans le build de sortie');
  assert.ok(!locked.includes('<!-- canaan:'), 'plus aucun marqueur');
  // npm run build, la CI, la release et Steam font le build de sortie ; seuls npm start et build:dev ouvrent la vallée.
  const pkg = require('../package.json');
  assert.equal(pkg.scripts.build, 'node tools/build.cjs');
  assert.match(pkg.scripts['dist:linux'], /^node tools\/build\.cjs && /);
  assert.match(pkg.scripts['dist:win'], /^node tools\/build\.cjs && /);
  assert.match(pkg.scripts.start, /build\.cjs --extensions/);
  for (const wf of ['ci.yml', 'release.yml']) {
    const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', wf), 'utf8');
    assert.ok(!yml.includes('--extensions') && !yml.includes('build:dev'), wf + ' : build de sortie');
  }
});

test('Terre fermée (build de sortie) : brume, nuage des cartes, aucun accès, nom caché, héros replacé au chargement', () => {
  const { run, errors } = boot(locked);
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual(JSON.parse(run('JSON.stringify(canaanExtensionIds())')), []);
  assert.equal(run('ZONES.length'), 7);
  assert.equal(run('ZONES[6].locked'), true);
  assert.equal(run('ZONES[6].name'), 'Brumes impénétrables');
  const land = JSON.parse(run('JSON.stringify(CANAAN_EXT_LANDS[0])'));
  assert.equal(land.ext, 'vallee');
  // Mêmes cases dans les deux builds : la terre existe, mais on ne peut ni y entrer ni la traverser.
  assert.ok(
    run(
      `(()=>{let n=0;for(let y=${land.box.y0};y<=${land.box.y1};y++)for(let x=${land.box.x0};x<=${land.box.x1};x++)if(canaanExtLand(x,y))n++;return n})()`
    ) > 4000
  );
  assert.equal(run(`canaanLockedTile(${land.pass.to.x},${land.pass.to.y})`), true);
  assert.equal(run(`canWalk((${land.pass.to.x}+0.5)*TS,(${land.pass.to.y}+0.5)*TS)`), false);
  assert.equal(run(`canWalk((${land.x}+0.5)*TS,(${land.y}+0.5)*TS)`), false);
  // Le bout de l'isthme côté Forêt enchantée reste praticable (la route y mène, jusqu'à la brume).
  assert.equal(run(`canaanLockedTile(${land.pass.from.x},${land.pass.from.y})`), false);
  assert.equal(run(`regionAt(${land.pass.from.x},${land.pass.from.y}).name`), 'Forêt enchantée');
  // Rien n'apparaît dans la terre fermée.
  run(
    `P.x=(${land.pass.from.x}+0.5)*TS;P.y=(${land.pass.from.y}+0.5)*TS;game.world.monsters=[];spawnMonsters(60)`
  );
  assert.equal(
    run('game.world.monsters.filter(m=>canaanLockedTile(Math.floor(m.x/TS),Math.floor(m.y/TS))).length'),
    0
  );
  // Brume dans le monde et nuage des cartes : dessinés sans erreur ; la liste des lieux de la carte l'ignore.
  run('started=true;camX=P.x-W/2;camY=P.y-H/2;CANAAN_LOCKED_FOG.draw(ctx);CANAAN_MAP.base();drawMinimap()');
  assert.equal(errors.length, 0, errors.join('\n'));
  // Un héros sauvegardé dans la vallée (build de test) se relève au camp dans le build de sortie.
  run(`P.x=(${land.x}+0.5)*TS;P.y=(${land.y}+0.5)*TS;saveGame();loadGame()`);
  assert.equal(run('P.x'), run('CANAAN_SPAWN.x'));
  assert.equal(run('P.y'), run('CANAAN_SPAWN.y'));
});

test('Données d’extension gardées telles quelles par le build de sortie (montures achetées en test)', () => {
  const { run, errors } = boot(locked);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('game.hero.ext={vallee:{mounts:["aurore"],active:"aurore"}};saveGame();game.hero.ext={};loadGame()');
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.ext)')), {
    vallee: { mounts: ['aurore'], active: 'aurore' }
  });
  // Données invalides ou démesurées : rien n'est gardé.
  assert.deepEqual(JSON.parse(run('JSON.stringify(canaanSanitizeExt({vallee:"x",Bad:{a:1},ok:{a:1}}))')), {
    ok: { a: 1 }
  });
  assert.deepEqual(JSON.parse(run('JSON.stringify(canaanSanitizeExt({vallee:{s:"x".repeat(40000)}}))')), {});
});

test('Vallée des Héros (build de test) : terre ouverte, lieux posés, créatures de niveau 60, carte et touche H', () => {
  const { run, errors } = boot(open);
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual(JSON.parse(run('JSON.stringify(canaanExtensionIds())')), ['vallee']);
  assert.equal(run('ZONES[6].name'), 'Vallée des Héros');
  assert.equal(run('ZONES[6].locked'), false);
  const plan = JSON.parse(run('JSON.stringify(CANAAN_VALLEY.plan())'));
  assert.equal(plan.statues.length, 8);
  assert.equal(plan.arena.statues.length, 4);
  assert.equal(plan.horses.length, 4);
  assert.equal(plan.mills.length, 2);
  // Tout est dans la vallée, accessible à pied depuis le Col des Héros.
  const land = JSON.parse(run('JSON.stringify(CANAAN_EXT_LANDS[0])'));
  const reach = `(()=>{const r=CANAAN_WORLD_TOOLS.reachableFrom(${land.pass.from.x},${land.pass.from.y});return (x,y)=>r[y*MAPW+x]===1})()`;
  run('globalThis.__reach=' + reach);
  for (const [x, y] of [
    [Math.floor(plan.door.x), Math.floor(plan.door.y)],
    [plan.arena.x, plan.arena.y],
    [plan.alley.x0, plan.alley.y],
    [plan.alley.x1, plan.alley.y]
  ])
    assert.equal(
      run(`__reach(${x},${y})&&canaanExtLand(${x},${y})?.ext==='vallee'`),
      true,
      'accessible : ' + x + ',' + y
    );
  assert.equal(run(`canWalk((${land.pass.to.x}+0.5)*TS,(${land.pass.to.y}+0.5)*TS)`), true);
  // Ruisseaux (eau peu profonde), étang profond, ponts de pierre.
  assert.ok(run('game.world.tiles.flat().length') > 0);
  assert.equal(run(`game.world.tiles[Math.floor(${plan.pond.y})][Math.floor(${plan.pond.x})]`), 0);
  assert.ok(run(`[...BRIDGE_TILES].filter(k=>canaanExtLand(k%MAPW,Math.floor(k/MAPW))).length`) > 0);
  // Créatures de la vallée, au niveau 60.
  run(
    `P.x=(${plan.pond.x}+6)*TS;P.y=(${plan.pond.y}-6)*TS;game.world.monsters=game.world.monsters.filter(m=>m.worldBoss);spawnMonsters(40)`
  );
  const mobs = JSON.parse(
    run(
      'JSON.stringify(game.world.monsters.filter(m=>!m.worldBoss&&ZONES.indexOf(regionAt(m.x/TS,m.y/TS))===6).map(m=>[m.t,m.level]))'
    )
  );
  assert.ok(mobs.length > 5);
  assert.ok(
    mobs.every(
      ([t, l]) => ['Fauve des Moissons', 'Écho de héros', 'Aigle des Cimes'].includes(t) && l === 60
    ),
    JSON.stringify(mobs)
  );
  // Repères des cartes, dessin de la vallée sans erreur ; touche de la monture (H, V reste la garde-robe).
  assert.ok(
    JSON.parse(run('JSON.stringify(CANAAN_EXT.markers().map(m=>m.name))')).includes('Écurie des Héros')
  );
  run(
    `started=true;P.x=(${plan.door.x})*TS;P.y=(${plan.door.y}+2)*TS;camX=P.x-W/2;camY=P.y-H/2;CANAAN_EXT.draw(ctx,'ground');CANAAN_EXT.draw(ctx,'world');CANAAN_EXT.draw(ctx,'air');CANAAN_MAP.base();runDrawPipeline()`
  );
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_KEYS.keysOf("mount"))')), ['h']);
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_KEYS.keysOf("wardrobe"))')), ['v']);
  // La fiche du personnage a son onglet Montures.
  assert.equal(JSON.parse(run('JSON.stringify(CANAAN_EXT.charTabs().map(t=>t.id))'))[0], 'mounts');
});

test('Montures : achat à l’écurie, choix, en selle (H), vitesse, descente en combat, monde ouvert seulement, sauvegarde', () => {
  const { run, errors, fire } = boot(open);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;game.world.monsters=[];game.hero.level=60');
  const door = JSON.parse(run('JSON.stringify(CANAAN_VALLEY.plan().door)'));
  // Loin de l'écurie : refusé ; pas assez d'or : refusé.
  run('P.gold=100000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');
  assert.equal(run('CANAAN_VALLEY_MOUNTS.buy(game.hero,"plaines")'), false);
  run(`P.x=${door.x}*TS;P.y=(${door.y}+0.3)*TS;P.gold=4000`);
  assert.equal(run('CANAAN_VALLEY_MOUNTS.buy(game.hero,"plaines")'), false);
  run('P.gold=40000');
  assert.equal(run('CANAAN_VALLEY_MOUNTS.buy(game.hero,"plaines")'), true);
  assert.equal(run('P.gold'), 35000);
  assert.equal(run('CANAAN_VALLEY_MOUNTS.buy(game.hero,"plaines")'), false, 'une seule fois par personnage');
  assert.equal(run('CANAAN_VALLEY_MOUNTS.buy(game.hero,"aurore")'), true);
  assert.equal(run('P.gold'), 0);
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.ext.vallee)')), {
    mounts: ['plaines', 'aurore'],
    active: 'aurore'
  });
  assert.equal(
    run('CANAAN_VALLEY_MOUNTS.choose(game.hero,"argent")'),
    false,
    'pas un cheval qu’on ne possède pas'
  );
  // Touche H : en selle, vitesse +75 % (Coursier de l'Aurore), dessin du cavalier dans les quatre directions.
  run('closePanels()');
  fire(run('globalThis'), 'keydown', { key: 'h' });
  assert.equal(run('game.hero.riding'), 'aurore');
  assert.equal(run('CANAAN_EXT.speed(game.hero)'), 1.75);
  const x0 = run('P.x');
  run(
    'for(let i=0;i<60;i++){game.hero.intent.dx=1;game.hero.intent.dy=0;simulateStep()}game.hero.intent.dx=0'
  );
  assert.ok(run('P.x') - x0 > 60 * 4.1 * 1.5, 'plus rapide à cheval');
  run(
    'camX=P.x-W/2;camY=P.y-H/2;for(const f of [0,1,2,3]){P.vx=[0,1,0,-1][f];P.vy=[1,0,-1,0][f];drawPixelHero(ctx,P.x,P.y,"#fff",4,true)}'
  );
  assert.equal(errors.length, 0, errors.join('\n'));
  // Attaquer fait descendre de selle ; au combat, impossible de remonter.
  run('P.atk=0.3;CANAAN_EXT.step()');
  assert.equal(run('game.hero.riding'), null);
  // (Un coup reçu peut être dévié au hasard : on passe par la défense, qui marque toujours le combat.)
  run('P.atk=0;CANAAN_RUBIS.defense({x:P.x,y:P.y,t:"Test",level:60},5,{},game.hero)');
  assert.equal(run('CANAAN_RUBIS.inCombat(game.hero)'), true);
  assert.equal(run('CANAAN_VALLEY_MOUNTS.mount(game.hero)'), false);
  // Hors du monde ouvert (instance) : pas de monture.
  run('enterInstance(0)');
  assert.equal(run('CANAAN_VALLEY_MOUNTS.mount(game.hero)'), false);
  run('leaveInstance()');
  // Gardées dans la sauvegarde du personnage.
  run('saveGame();game.hero.ext={};loadGame()');
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_VALLEY_MOUNTS.stateOf(game.hero))')), {
    mounts: ['plaines', 'aurore'],
    active: 'aurore'
  });
  // Réseau : la monture de chacun, envoyée aux invités.
  run('game.hero.riding="aurore"');
  assert.deepEqual(
    JSON.parse(run('JSON.stringify(CANAAN_EXT.view(h=>h===game.hero?"host":h.id).vallee.m.r)')),
    { host: 'aurore' }
  );
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Valérion : PV selon les participants, attaques annoncées, abris du Jugement, sceaux, butin individuel à 11 %', () => {
  const { run, errors } = boot(open);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;game.world.monsters=[];game.hero.level=60;game.world.worldBossTimers={}');
  const ar = JSON.parse(run('JSON.stringify(CANAAN_VALLEY.plan().arena)'));
  run('spawnWorldBosses()');
  assert.equal(run('game.world.monsters.filter(m=>m.worldBossId==="valerion").length'), 1);
  const base = run('bossHealth(60,"raid")');
  assert.equal(run('game.world.monsters.find(m=>m.worldBossId==="valerion").mhp'), base);
  // Un héros entre dans l'arène : le combat commence ; un deuxième : +75 % de PV, part de PV gardée.
  run(`P.mhp=P.hp=1e7;P.x=(${ar.x}+0.5)*TS;P.y=(${ar.y}+4.5)*TS;CANAAN_EXT.step()`);
  assert.equal(run('game.world.monsters.find(m=>m.worldBossId==="valerion").fight.on'), true);
  run(
    `globalThis.__ally=canaanCreateHero({name:"Lina",x:(${ar.x}-3.5)*TS,y:(${ar.y}+0.5)*TS});__ally.id="g-ally";__ally.local=true;__ally.level=60;__ally.player.mhp=__ally.player.hp=1e7;game.heroes.push(__ally);CANAAN_EXT.step()`
  );
  assert.equal(run('game.world.monsters.find(m=>m.worldBossId==="valerion").mhp'), Math.round(base * 1.75));
  // Pas d'attaque surprise : seules les mécaniques annoncées frappent (au moins 0,8 s d'avance).
  run('globalThis.__m=game.world.monsters.find(m=>m.worldBossId==="valerion");__m.fight.next=1e9');
  for (const kind of ['sweep', 'charge', 'slam', 'beams', 'shockwave', 'burst'])
    run(
      `CANAAN_VALLEY_BOSS.zones().length=0;__m.castUntil=0;CANAAN_VALLEY_BOSS.cast("${kind}");if(CANAAN_VALLEY_BOSS.zones().some(z=>z.at-time<48))throw new Error("${kind} trop rapide")`
    );
  // Jugement solaire : abrité derrière une statue, rien ; à découvert, un coup très lourd.
  run('CANAAN_VALLEY_BOSS.zones().length=0;__m.castUntil=0;CANAAN_VALLEY_BOSS.cast("judgement")');
  const shelter = JSON.parse(run('JSON.stringify(CANAAN_VALLEY_BOSS.zones().find(z=>z.kind==="shelter"))'));
  run(
    `P.x=${shelter.x};P.y=${shelter.y};__ally.player.x=(${ar.x}+0.5)*TS+60;__ally.player.y=(${ar.y}+0.5)*TS;globalThis.__hp=[P.hp,__ally.player.hp];P.roll=0;__ally.player.roll=0`
  );
  run('for(let i=0;i<240;i++){time++;CANAAN_EXT.step()}');
  assert.equal(run('P.hp'), run('__hp[0]'), 'abrité derrière la statue');
  assert.ok(run('__hp[1]-__ally.player.hp') > 0, 'à découvert : touché');
  // La Dernière Lumière : deux sceaux de deux statues différentes l'interrompent (étourdi, vulnérable).
  run('__m.castUntil=0;CANAAN_VALLEY_BOSS.cast("incant")');
  const s0 = ar.statues[0],
    s1 = ar.statues[1];
  run(`P.x=(${s0.x}+0.5)*TS;P.y=(${s0.y}+1.6)*TS`);
  assert.equal(run('CANAAN_EXT.interact(game.hero)'), true);
  assert.equal(run('CANAAN_VALLEY_BOSS.statueState(0)'), 2);
  run(`__ally.player.x=(${s1.x}+0.5)*TS;__ally.player.y=(${s1.y}+1.6)*TS`);
  assert.equal(run('CANAAN_VALLEY_BOSS.seal(1,__ally)'), true);
  assert.ok(run('__m.exposedUntil>time&&__m.castUntil>time'), 'incantation interrompue');
  assert.equal(run('CANAAN_VALLEY_BOSS.view().c'), 0);
  // Victoire : chaque participant éligible reçoit or, pièce Épique, et tire seul ses 11 % de Mythique.
  run('canaanDamageMonster(__m,10,__ally)');
  run('globalThis.__rnd=Math.random;Math.random=()=>0.05');
  run(
    'game.hero.inventory=[];__ally.inventory=[];canaanDamageMonster(__m,__m.hp+10,game.hero);Math.random=__rnd'
  );
  const loot = JSON.parse(
    run('JSON.stringify([game.hero.inventory.map(i=>i.rarity),__ally.inventory.map(i=>i.rarity)])')
  );
  for (const bag of loot) {
    assert.ok(bag.includes('Épique'), JSON.stringify(loot));
    assert.ok(bag.includes('Mythique'), JSON.stringify(loot));
  }
  assert.ok(
    run('game.world.worldBossTimers.valerion-Date.now()') > 14 * 60 * 1000,
    'réapparition dans 15 minutes'
  );
  assert.equal(run('game.world.monsters.filter(m=>m.worldBossId==="valerion").length'), 0);
  assert.equal(run('CANAAN_VALLEY_BOSS.MYTHIC'), 0.11);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Réseau et langue : actions d’extension vérifiées, même contenu exigé, textes de l’extension traduits', async () => {
  const { sanitizeAction } = await import(path.join(ROOT, 'shared', 'net', 'messages.js'));
  assert.deepEqual(sanitizeAction({ op: 'ext', ext: 'vallee', act: 'buy', id: 'aurore' }), {
    op: 'ext',
    ext: 'vallee',
    act: 'buy',
    id: 'aurore'
  });
  assert.deepEqual(sanitizeAction({ op: 'ext', ext: 'vallee', act: 'mount' }), {
    op: 'ext',
    ext: 'vallee',
    act: 'mount',
    id: null
  });
  for (const bad of [
    { op: 'ext', ext: 'Vallee', act: 'buy' },
    { op: 'ext', ext: 'vallee', act: '<b>' },
    { op: 'ext', ext: 'vallee', act: 'buy', id: 7 }
  ])
    assert.equal(sanitizeAction(bad), null);
  // Un hôte n'accepte qu'un invité du même build (mêmes extensions).
  const net = fs.readFileSync(path.join(ROOT, 'scripts', 'net.js'), 'utf8');
  assert.match(net, /message\.extensions \|\| ''\) !== canaanExtensionIds\(\)\.join\(','\)/);
  assert.match(net, /extensions: canaanExtensionIds\(\)\.join\(','\)/);
  // Chaque tt('…') de l'extension a sa traduction (dictionnaire du jeu ou celui de l'extension).
  const en = (await import(path.join(ROOT, 'client', 'i18n', 'en.js'))).default;
  const extDict = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'extensions', 'vallee', 'i18n.js'), 'utf8'), {
    CANAAN_I18N: { extend: (lang, table) => Object.assign(extDict, table) }
  });
  const missing = [];
  for (const file of fs.readdirSync(path.join(ROOT, 'extensions', 'vallee'))) {
    const code = fs.readFileSync(path.join(ROOT, 'extensions', 'vallee', file), 'utf8');
    for (const m of code.matchAll(/\btt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      const text = m[1].replace(/\\'/g, "'");
      if (!Object.hasOwn(en, text) && !Object.hasOwn(extDict, text)) missing.push(file + ' : ' + text);
    }
  }
  assert.deepEqual(missing, []);
  // Noms affichés (zone, créatures, montures, statues) traduits aussi.
  for (const name of [
    'Vallée des Héros',
    'Valérion, le Dernier Champion',
    'Coursier de l’Aurore',
    'Aldric le Brave',
    'Monture'
  ])
    assert.ok(Object.hasOwn(extDict, name), name);
  // Le dictionnaire du jeu (livré) ne contient aucun texte de l'extension.
  for (const key of Object.keys(extDict))
    assert.ok(!Object.hasOwn(en, key) || ['Parler'].includes(key), 'en.js : ' + key);
});
