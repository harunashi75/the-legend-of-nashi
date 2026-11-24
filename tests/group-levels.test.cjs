const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Chacun à son niveau : monstres à niveau fixe, chacun frappe et encaisse selon son niveau, XP partagée, sac de 10 places, coffres cachés ouverts par un invité',async()=>{
 // Un monstre a un niveau fixe (celui de sa zone) : mêmes PV pour tout le monde, rien ne s'adapte au héros.
 {const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
  run('started=true;paused=false;game.world.instance=null;game.view.chat=()=>{};toast=()=>{};Math.random=()=>0.99');
  run('game.hero.level=30;game.hero.equipment={...game.hero.equipment,'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"h'+k+'",slot:"'+k+'",level:30,rarity:"Rare",weaponType:"sword"}').join(',')+'};recomputeStats()');
  run('globalThis.lina=canaanCreateHero({name:"Lina",x:P.x+30,y:P.y});game.heroes.push(lina);globalThis.wolf={t:"Loup",x:P.x+60,y:P.y,hp:1,mhp:1,r:14,cd:1e9,g:0,level:20};canaanSetupMob(wolf)');
  assert.equal(run('wolf.mhp'),run('mobHealth(20,false,MOB_TYPES.find(t=>t.name==="Loup").hp)'),'PV du loup selon son niveau');
  run('game.hero.level=60;canaanSetupMob(wolf)');assert.equal(run('wolf.mhp'),run('mobHealth(20,false,MOB_TYPES.find(t=>t.name==="Loup").hp)'),'aucune adaptation au héros');run('game.hero.level=30');
  // Même coup de base : Lina (niveau 1) frappe un loup de niveau 20 bien moins fort que l'hôte (niveau 30).
  run('wolf.hp=wolf.mhp=1e6;canaanHeroStrike(wolf,50,lina)');const linaHit=run('1e6-wolf.hp');
  run('wolf.hp=1e6;canaanHeroStrike(wolf,50)');const hostHit=run('1e6-wolf.hp');
  assert.ok(linaHit<hostHit,'écart de niveau : '+linaHit+' / '+hostHit);
  // Dégâts reçus : selon le niveau du monstre, réduits par la Défense de chacun.
  run('globalThis.__hurt=h=>{let n=0;for(let i=0;i<20;i++)n+=CANAAN_STATS_INCOMING(wolf,null,h);return n}');
  assert.ok(run('__hurt(lina)')>run('__hurt(game.hero)'),'Lina encaisse plus, sans armure');
  // XP : le vainqueur et ses alliés proches gagnent chacun selon leur propre niveau.
  run('game.hero.exp=0;lina.exp=0;wolf.hp=1;canaanDamageMonster(wolf,10)');
  assert.ok(run('lina.level')>1||run('lina.exp')>0,'Lina gagne de l’XP');
  assert.ok(run('game.hero.exp')>0,'l’hôte aussi');
  assert.equal(errors.length,0,errors.join('\n'));}
 {const {run}=require('./helpers/canaan-runtime.cjs')(source);
  run('started=true;globalThis.l=canaanCreateHero({name:"L",x:0,y:0})');
  // Sac : 20 places au départ ; un héros enregistré sous l'ancienne règle (40 places par défaut) revient au départ.
  assert.equal(run('canaanBagLimit(l)'),20);
  run('CANAAN_GROUP.importGuests({"local-a":{pseudo:"A",bagLevel:3},"local-b":{pseudo:"B",bagLevel:5},"local-c":{pseudo:"C",bagLevel:2,bagVersion:2}})');
  assert.deepEqual([run('game.guests["local-a"].bagLevel'),run('game.guests["local-b"].bagLevel'),run('game.guests["local-c"].bagLevel')],[0,2,2]);
  assert.equal(run('CANAAN_GROUP.exportGuests(h=>h.player)["local-c"].bagVersion'),2);}
 // En ligne : l'invité ouvre un coffre caché près de lui (E) ; l'hôte vérifie, l'ouvre pour lui ; tout le monde le voit ouvert.
 const {createRelay}=require('../online/relay.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 try{
  host.run('started=true;paused=false;P.dead=false;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  assert.equal(guest.run('JSON.stringify(hiddenChestSpots.map(chestPosition))'),host.run('JSON.stringify(hiddenChestSpots.map(chestPosition))'),'mêmes coffres cachés chez l’invité');
  // L'hôte a déjà ouvert un coffre : l'invité le voit ouvert.
  host.run('game.world.openedChests.push(hiddenChestSpots[0].id)');await step(10);
  assert.equal(guest.run('game.world.openedChests.includes(hiddenChestSpots[0].id)'),true);
  // L'invité va près d'un autre coffre et appuie sur E.
  host.run('{const c=chestPosition(hiddenChestSpots[1]);'+G+'.player.x=c.x*TS;'+G+'.player.y=c.y*TS;'+G+'.player.keys=1;P.x=c.x*TS+3000;P.y=c.y*TS}');await step(15);
  const gold0=host.run(G+'.player.gold'),bag0=host.run(G+'.inventory.length');
  guest.run('interact()');await step(10);
  assert.equal(host.run('game.world.openedChests.includes(hiddenChestSpots[1].id)'),true,'coffre ouvert chez l’hôte');
  assert.ok(host.run(G+'.player.gold')>gold0&&host.run(G+'.inventory.length')>bag0,'butin pour l’invité');
  assert.equal(host.run(G+'.player.keys'),0,'sa clé est consommée');
  assert.ok(guest.run('__toasts.some(t=>t.includes("Coffre secret"))'),'annoncé à l’invité');
  assert.equal(guest.run('game.world.openedChests.includes(hiddenChestSpots[1].id)'),true,'il le voit ouvert');
  // Loin d'un coffre : rien.
  const opened=host.run('game.world.openedChests.length');guest.run('CANAAN_NET.requestAction({op:"open-chest"})');host.run(G+'.player.x+=5000');await step(6);
  assert.equal(host.run('game.world.openedChests.length'),opened);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});
