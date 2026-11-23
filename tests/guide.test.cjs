const { test } = require('node:test');
const { assert, source } = require('./helpers/context.cjs');

// Guide du joueur (scripts/guide.js) : conseils de Lumi au bon moment, une fois chacun, pastilles des menus,
// marchand de l'île sur la carte.
test('Guide : bienvenue d’abord, puis suivi, équipement, Lumi, talent, donjon et échoppe, chacun une fois', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(
    'started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];game.hero.level=1;game.hero.bagLimit=100;CANAAN_GUIDE.reset();' +
      'globalThis.HR=game.hero;globalThis.Q=CANAAN_QUESTS;globalThis.frames=n=>{for(let i=0;i<n;i++){time++;CanaanStages.drawGuide()}return Object.keys(CANAAN_GUIDE.seen())}'
  );
  // Rien tant que l'écran ne s'est pas posé ; puis le bienvenue, seul.
  assert.deepEqual([...run('frames(100)')], []);
  assert.deepEqual([...run('frames(200)')], ['welcome']);
  assert.equal(run('CANAAN_GUIDE.speaking()'), true);
  // Équipement meilleur que le porté : repère dans le sac et conseil.
  run(
    'HR.inventory.length=0;HR.equipment.helmet=null;HR.inventory.push({id:"casque-test",slot:"helmet",level:1,rarity:"Rare"})'
  );
  assert.equal(run('gearUpgrade(HR.inventory[0])'), true);
  assert.ok(run('frames(3000)').includes('gear'));
  // Lumi rejoint le héros : elle se présente, et parle désormais en son nom.
  run('Q.state(HR).flags.lumi=true');
  assert.ok(run('frames(1000)').includes('lumi'));
  // Une case de talent libre.
  run('CANAAN_CLASS.choose("paladin")');
  assert.ok(run('frames(1000)').includes('talent:1'));
  // Un donjon à portée.
  run('HR.level=8');
  assert.ok(run('frames(1000)').some(id => id.startsWith('dungeon:')));
  // L'échoppe du camp, devant sa porte.
  const shop = JSON.parse(run('JSON.stringify(CANAAN_GUIDE.shops()[0])'));
  assert.equal(shop.name, 'Échoppe de Lira');
  run('P.x=' + shop.x + ';P.y=' + shop.y);
  assert.ok(run('frames(1000)').includes('shop'));
  // Déjà vus : ils ne reviennent pas.
  const seen = run('frames(3000)').length;
  assert.equal(run('frames(3000)').length, seen);
  // Suivant : le conseil en attente s'affiche tout de suite, sans le délai entre deux conseils.
  run('CANAAN_GUIDE.reset();frames(200);HR.level=8');
  assert.deepEqual([...run('Object.keys(CANAAN_GUIDE.seen())')], ['welcome']);
  run('CANAAN_GUIDE.next()');
  assert.equal(run('CANAAN_GUIDE.speaking()'), true);
  assert.equal(run('Object.keys(CANAAN_GUIDE.seen()).length'), 2);
  // Conseils coupés dans les Paramètres : plus rien ne s'affiche.
  run('CANAAN_GUIDE.reset();canaanDisplay.tips=false');
  assert.deepEqual([...run('frames(3000)')], []);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Guide : une arme d’un autre type ou trop haute n’est pas marquée comme meilleure', () => {
  const { run } = require('./helpers/canaan-runtime.cjs')(source);
  run(
    'game.hero.level=10;game.hero.equipment.weapon={id:"w",slot:"weapon",weaponType:"sword",level:5,rarity:"Commun"}'
  );
  assert.equal(run('gearUpgrade({id:"a",slot:"weapon",weaponType:"sword",level:8,rarity:"Commun"})'), true);
  assert.equal(run('gearUpgrade({id:"b",slot:"weapon",weaponType:"staff",level:8,rarity:"Épique"})'), false);
  assert.equal(run('gearUpgrade({id:"c",slot:"weapon",weaponType:"sword",level:30,rarity:"Commun"})'), false);
  assert.equal(run('gearUpgrade({id:"d",slot:"weapon",weaponType:"sword",level:4,rarity:"Commun"})'), false);
});
