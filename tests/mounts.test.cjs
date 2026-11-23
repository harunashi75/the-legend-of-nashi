// Montures du jeu de base (scripts/mounts.js) : la Ménagerie du Camp de l'Aurore, l'achat, la selle, les trouvailles,
// la sauvegarde et les textes. Les montures de l'Extension 1 sont vérifiées dans extensions.test.cjs.
const { test } = require('node:test');
const path = require('node:path');
const assert = require('node:assert/strict');
const { render } = require('../tools/build.cjs');
const boot = require('./helpers/canaan-runtime.cjs');

const release = render();
const ROOT = path.join(__dirname, '..', 'src', 'canaan');

test('Ménagerie du camp : roulotte et enclos posés, Oriane accessible à pied, montures variées à vendre', () => {
  const { run, errors } = boot(release);
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit().missing)')), []);
  const m = JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.menagerie())'));
  assert.ok(m && m.pen.w >= 7 && m.pen.h >= 4);
  assert.equal(run(`canWalk(${m.x},${m.y}+30)`), true);
  assert.equal(
    run(
      `(()=>{const r=CANAAN_WORLD_TOOLS.reachableFrom(CANAAN_CAMP.x,CANAAN_CAMP.y+4);return r[Math.floor((${m.y}+30)/TS)*MAPW+Math.floor(${m.x}/TS)]===1})()`
    ),
    true
  );
  assert.equal(run(`isSafe(Math.floor(${m.x}/TS),Math.floor(${m.y}/TS))`), true, 'dans la zone sûre');
  const list = JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.MOUNTS)'));
  assert.ok(list.length >= 18);
  assert.equal(new Set(list.map(x => x.id)).size, list.length);
  assert.ok(new Set(list.map(x => x.species)).size >= 15, 'pas que des chevaux');
  for (const x of list) {
    assert.ok(/^[a-z]{2,24}$/.test(x.id), x.id);
    assert.ok(run(`CANAAN_MOUNT_ART.species().includes(${JSON.stringify(x.species)})`), x.species);
    assert.ok((x.shop && x.price > 0) || (x.drop && x.drop.chance > 0 && x.source), x.id);
    assert.equal(x.speed, undefined, 'même vitesse pour toutes : ' + x.id);
  }
  // Dessin du camp, d'Oriane et de chaque cavalier, dans les quatre directions, sans erreur.
  run(
    `started=true;P.x=${m.x};P.y=${m.y}+60;camX=P.x-W/2;camY=P.y-H/2;time++;CANAAN_EXT.draw(ctx,'world');CANAAN_MAP.base();runDrawPipeline()`
  );
  assert.equal(run('CANAAN_MOUNTS.herd().length'), 4);
  run(
    'for(const M of CANAAN_MOUNTS.MOUNTS){game.hero.ext={mounts:{owned:[M.id],active:M.id}};game.hero.riding=M.id;for(const f of [0,1,2,3]){P.vx=[0,1,0,-1][f];P.vy=[1,0,-1,0][f];drawPixelHero(ctx,P.x,P.y,"#fff",4,true)}}'
  );
  assert.ok(
    JSON.parse(run('JSON.stringify(CANAAN_EXT.markers().map(k=>k.name))')).includes('Ménagerie de l’Aurore')
  );
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Montures du jeu de base : achat chez Oriane, touche H, vitesse, descente en combat, trouvailles, sauvegarde', () => {
  const { run, errors, fire } = boot(release);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;game.world.monsters=[]');
  const m = JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.menagerie())'));
  // Sans monture ou loin d'Oriane : rien.
  run('P.gold=10000');
  assert.equal(run('CANAAN_MOUNTS.mount(game.hero)'), false);
  assert.equal(run('CANAAN_MOUNTS.buy(game.hero,"tortue")'), false, 'trop loin');
  run(`P.x=${m.x};P.y=${m.y}+30;P.gold=100`);
  assert.equal(run('CANAAN_MOUNTS.buy(game.hero,"tortue")'), false, 'pas assez d’or');
  run('P.gold=10000');
  assert.equal(run('CANAAN_MOUNTS.buy(game.hero,"drake")'), false, 'ne se vend pas');
  // E ouvre la boutique ; le bouton achète.
  assert.equal(run('CANAAN_EXT.interact(game.hero)'), true);
  assert.match(run('document.getElementById("window").innerHTML'), /Tortue Moussue/);
  run('CANAAN_EXT.ui("mounts","buy","tortue")');
  assert.equal(run('P.gold'), 3500);
  assert.equal(run('CANAAN_MOUNTS.buy(game.hero,"tortue")'), false, 'une seule fois');
  run('closePanels()');
  fire(run('globalThis'), 'keydown', { key: 'h' });
  assert.equal(run('game.hero.riding'), 'tortue');
  assert.equal(run('CANAAN_EXT.speed(game.hero)'), 1.4);
  run('P.atk=0.3;CANAAN_EXT.step()');
  assert.equal(run('game.hero.riding'), null);
  run('P.atk=0');
  // Trouvailles : une seule fois chacune, selon la source.
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.drop("worldBoss",game.hero,()=>0))')), [
    'drake'
  ]);
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.drop("worldBoss",game.hero,()=>0))')), []);
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.drop("raid",game.hero,()=>0.5))')), []);
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.drop("raid",game.hero,()=>0))')), [
    'cauchemar'
  ]);
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.drop("secretBoss",game.hero,()=>0))')), [
    'nuage'
  ]);
  // Onglet Montures des Collections et sauvegarde ; une monture inconnue de ce build est gardée sans s'afficher.
  run('game.hero.ext.mounts.owned.push("inconnue");canaanCollections("mounts")');
  assert.match(run('document.getElementById("window").innerHTML'), /Drake Écarlate/);
  run('saveGame();game.hero.ext={};loadGame()');
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.stateOf(game.hero))')), {
    owned: ['tortue', 'drake', 'cauchemar', 'nuage', 'inconnue'],
    active: 'tortue',
    saddles: [],
    saddle: 0
  });
  assert.equal(run('CANAAN_MOUNTS.ownedOf(game.hero).length'), 4);
  // Données abîmées : réparées.
  run('game.hero.ext={mounts:{owned:"x",active:7}}');
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.stateOf(game.hero))')), {
    owned: [],
    active: null,
    saddles: [],
    saddle: 0
  });
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Montures : action réseau vérifiée chez l’hôte, montures de chacun envoyées, textes traduits', async () => {
  const { run, errors } = boot(release);
  run('started=true;game.world.monsters=[]');
  const m = JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.menagerie())'));
  run(
    `globalThis.__g=canaanCreateHero({name:'Lina',x:${m.x},y:${m.y}+30});__g.id='g1';game.heroes.push(__g);__g.player.gold=5000`
  );
  assert.equal(run('CANAAN_EXT.handle(__g,{op:"ext",ext:"mounts",act:"buy",id:"cerf"})'), true);
  assert.equal(run('CANAAN_EXT.handle(__g,{op:"ext",ext:"mounts",act:"mount"})'), true);
  assert.equal(run('__g.player.gold'), 500);
  const v = JSON.parse(run('JSON.stringify(CANAAN_EXT.view(h=>h===game.hero?"host":h.id).mounts)'));
  assert.deepEqual(v, { r: { g1: 'cerf' }, sd: {}, own: { g1: ['cerf', 'cerf', '', 0] } });
  run('__g.riding=null;CANAAN_EXT.apply({mounts:' + JSON.stringify(v) + '},id=>id==="g1"?__g:null)');
  assert.equal(run('__g.riding'), 'cerf');
  assert.deepEqual(JSON.parse(run('JSON.stringify(canaanExtensionIds())')), [], 'pas une extension');
  assert.equal(errors.length, 0, errors.join('\n'));
  const en = (await import(path.join(ROOT, 'client', 'i18n', 'en.js'))).default;
  const { BASE_MOUNTS, MOUNT_SHOPS } = await import(path.join(ROOT, 'shared', 'data', 'mounts.js'));
  for (const x of BASE_MOUNTS)
    for (const text of [x.name, x.desc, x.source]) if (text) assert.ok(Object.hasOwn(en, text), text);
  for (const s of Object.values(MOUNT_SHOPS))
    for (const text of Object.values(s)) assert.ok(Object.hasOwn(en, text), text);
});

test('Travail du cuir : peaux de chasse, tannage, selles par qualité, vitesse en selle équipée dans V', () => {
  const { run, errors, click } = boot(release);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;game.world.monsters=[]');
  assert.deepEqual(JSON.parse(run('JSON.stringify(MOUNT_SADDLE_SPEED)')), [40, 50, 60, 70, 80, 100]);
  // La chasse donne une peau dont la qualité suit le travail du cuir, pas la chasse : un grand chasseur débutant au
  // cuir ne reçoit que des peaux Communes, qu'il sait tanner.
  run(
    'globalThis.__z=ZONES.findIndex(z=>z.name==="Plaines verdoyantes");P.x=(ZONES[__z].x+0.5)*TS;P.y=(ZONES[__z].y+0.5)*TS'
  );
  run(
    'game.hero.prof.hunting.level=30;for(let i=0;i<5;i++){game.hero.huntCd=0;time+=50;CANAAN_PROF.hunt(game.hero,"lapin")}'
  );
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.prof.hide)')), { 'peau:0': 5 });
  // Chances : Commune jusqu'au niveau 5 ; au niveau 6, 15 % de Peu commun (+5 points par niveau, 45 % au plus).
  const share = (level, q) =>
    run(
      `(()=>{let n=0;for(let i=0;i<1000;i++)if(profHideQuality(${level},()=>i/1000)===${q})n++;return n})()`
    );
  assert.equal(share(5, 0), 1000);
  assert.equal(share(6, 1), 150);
  assert.equal(share(11, 1), 400);
  assert.equal(share(12, 2), 150);
  assert.equal(share(12, 0), 0);
  assert.equal(share(19, 2), 450, '45 % au plus');
  assert.equal(share(40, 5), 400);
  // Loin de l'établi d'Oriane : rien.
  const m = JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.menagerie())'));
  run('game.hero.prof.hide={"peau:0":4,"peau:2":10}');
  assert.equal(run('CANAAN_LEATHER.startTan(game.hero,0,1)'), false);
  run(`P.x=${m.x};P.y=${m.y}+30`);
  // Tanner : 2 peaux = 1 cuir, en travail minuté ; une qualité trop haute pour le niveau est refusée.
  assert.equal(run('CANAAN_LEATHER.startTan(game.hero,2,5)'), false, 'Rare : niveau 12');
  assert.equal(run('CANAAN_LEATHER.startTan(game.hero,0,20)'), true);
  run('for(let i=0;i<60*8;i++){time++;CANAAN_GATHER.stepWork()}');
  assert.equal(run('CANAAN_BAG.count(game.hero,"hide","cuir",0)'), 2);
  assert.equal(run('CANAAN_BAG.count(game.hero,"hide","peau",0)'), 0);
  assert.ok(run('game.hero.prof.leatherworking.exp+game.hero.prof.leatherworking.level') > 1);
  // Coudre une selle Rare : niveau, cuirs Rares ou meilleurs (les moins bons d'abord), or ; une seule fois.
  run('game.hero.prof.leatherworking.level=12;game.hero.prof.hide={"cuir:2":8,"cuir:4":5};P.gold=3000');
  assert.equal(run('CANAAN_LEATHER.saddle(game.hero,3)'), false, 'Épique : niveau 20');
  assert.equal(run('CANAAN_LEATHER.saddle(game.hero,2)'), true);
  assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.prof.hide)')), { 'cuir:4': 3 });
  assert.equal(run('P.gold'), 1000);
  assert.equal(run('CANAAN_LEATHER.saddle(game.hero,2)'), false, 'déjà dans la sellerie');
  // Équipée d'office (meilleure que rien) : toutes les montures vont à +60 %.
  run(
    'game.hero.ext.mounts.owned=["tortue"];game.hero.ext.mounts.active="tortue";CANAAN_MOUNTS.mount(game.hero)'
  );
  assert.equal(run('CANAAN_EXT.speed(game.hero)'), 1.6);
  // Onglet Montures : la sellerie ; on peut retirer la selle et la remettre.
  run('canaanCollections("mounts")');
  assert.match(
    run('document.getElementById("window").innerHTML'),
    /data-action="mountSaddle" data-quality="2"/
  );
  click('mountSaddle', { quality: '0' });
  assert.equal(run('CANAAN_EXT.speed(game.hero)'), 1.4);
  assert.equal(run('CANAAN_EXT.handle(game.hero,{op:"ext",ext:"mounts",act:"saddle",id:"mythique"})'), false);
  assert.equal(run('CANAAN_EXT.handle(game.hero,{op:"ext",ext:"mounts",act:"saddle",id:"rare"})'), true);
  assert.equal(run('CANAAN_EXT.speed(game.hero)'), 1.6);
  // Onglet du panneau P, sauvegarde, et selle visible chez les autres joueurs.
  run('closePanels();CANAAN_PROF.open("cuir")');
  assert.match(run('document.getElementById("window").innerHTML'), /Selles de monture/);
  run('saveGame();game.hero.ext={};game.hero.prof={};loadGame()');
  assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_MOUNTS.stateOf(game.hero).saddles)')), [2]);
  assert.equal(run('game.hero.prof.leatherworking.level'), 12);
  assert.equal(run('CANAAN_BAG.count(game.hero,"hide","cuir",4)'), 3);
  run('game.hero.riding="tortue"');
  assert.deepEqual(
    JSON.parse(run('JSON.stringify(CANAAN_EXT.view(h=>h===game.hero?"host":h.id).mounts.sd)')),
    {
      host: 2
    }
  );
  assert.equal(errors.length, 0, errors.join('\n'));
});
