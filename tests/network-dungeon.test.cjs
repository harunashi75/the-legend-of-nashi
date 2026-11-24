const { test } = require('node:test');
const {
  fs,
  assert,
  path,
  source
} = require('./helpers/context.cjs');

test('Jalon de la phase 6 : quatre joueurs en ligne finissent un donjon ensemble, chacun avec son butin',async()=>{
 const {createRelay}=require('../online/relay.cjs');
 // Le test avance le temps bien plus vite que le jeu : limite de fréquence relevée pour ce relais.
 const relay=createRelay({port:0,rate:100000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),turn=()=>new Promise(r=>setImmediate(r));
 // Hasard à graine fixe pour chaque côté (hôte, invités) : avec les intentions synchronisées, le donjon se joue
 // toujours de la même façon ; sans graine, une mauvaise série de coups pouvait faire tomber l'hôte.
 // (Graine choisie après la correction du tirage des monstres du monde : sur dix graines variées, le groupe finit le
 // donjon à chaque fois. Décalée de 30 quand l'emplacement artéfact a disparu du butin : le tirage d'un objet change
 // la suite du hasard, et avec cette graine la partie se joue à l'identique avant et après.)
 let seed=30;
 const boot=()=>{const mine=++seed*65537;let first=true;const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(first){first=false;run('{let s='+mine+';Math.random=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648}}')}}});
  side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guests=[boot(),boot(),boot()];
 try{
  host.run(fs.readFileSync(path.join(__dirname,'helpers','group-bot.js'),'utf8'));
  const gear=tag=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring'].map(k=>k+':{id:"'+tag+k+'",slot:"'+k+'",level:10,rarity:"Épique"}').join(',')+'}';
  host.run('started=true;paused=false;P.dead=false;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('game.hero.level=10;game.hero.equipment={...game.hero.equipment,...'+gear('h')+'};recomputeStats();P.hp=P.mhp');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code'),ids=[];
  for(const [k,g] of guests.entries()){
   g.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"'+['Lina','Oren','Maë'][k]+'"})');
   for(let i=0;i<1000&&g.run('game.mode')!=='guest';i++)await wait(10);
   assert.equal(g.run('game.mode'),'guest');ids.push(g.run('CANAAN_NET.state().heroId'));
  }
  assert.equal(host.run('game.heroes.length'),4,'quatre héros dans le groupe');assert.equal(host.run('CANAAN_NET.state().peers'),3);
  // Chaque invité reçoit un équipement d'aventurier (chez l'hôte : c'est lui qui garde les héros).
  ids.forEach((id,k)=>host.run('{const h=game.guests["'+id+'"];h.level=10;h.equipment={...h.equipment,...'+gear('g'+k)+'};recomputeHeroStats(h);h.player.hp=h.player.mhp}'));
  // Un vrai groupe : chacun sa classe, ses talents (deux emplacements au niveau 10) et l'arme de sa classe, Épique
  // comme le reste de son équipement.
  host.run('const C=[["paladin",[2,9]],["druide",[1,3]],["elementaliste",[0,5]],["assassin",[1,4]]];game.heroes.forEach((h,i)=>{h.classe={id:C[i][0],talents:C[i][1]};h.weaponTiers={[C[i][0]]:3};CANAAN_SUMMONS.syncPact(h);recomputeHeroStats(h);h.player.hp=h.player.mhp});recomputeStats();refreshWeaponBar();P.hp=P.mhp');
  // Débit de l'hôte : octets envoyés au relais.
  host.run('{const s=CANAAN_NET.debug.socket,o=s.send.bind(s);globalThis.__bytes=0;s.send=d=>{__bytes+=d.length;o(d)}}');
  // Le relais est un vrai WebSocket : avant que l'hôte avance, chaque intention envoyée par un invité doit lui être
  // arrivée (sinon un invité joue avec un tick de retard selon la charge de la machine, et l'issue varie).
  const received=sent=>ids.every((id,k)=>host.run('game.guests["'+id+'"]?.intentSeq||0')>=sent[k]);
  const tick=async()=>{
   for(const g of guests)g.run('time++;CANAAN_NET.tick()');
   const sent=guests.map(g=>g.run('CANAAN_NET.debug.seq')),deadline=Date.now()+2000;
   while(!received(sent)&&Date.now()<deadline)await turn();
   host.run('time++;simulateStep();updateWorld();CANAAN_NET.tick()');
   await turn();
  };
  for(let i=0;i<20;i++)await tick();
  // Sans les monstres de passage : les boss, les gardiens et le boss caché suffisent à tester le jeu en ligne.
  host.run('enterInstance(0);game.world.monsters=game.world.monsters.filter(m=>m.boss||m.guardian!==undefined)');assert.equal(host.run('game.world.instance.group'),4,'donjon pour quatre');
  const foes=host.run('game.world.monsters.length');let ticks=0,sawDungeon=0;
  for(;ticks<60*700;ticks++){
   // Le pilote décide pour tout le groupe ; chaque invité envoie lui-même sa décision par le relais.
   const remote='game.heroes.filter(h=>h.peer)';
   host.run('globalThis.__kept=new Map('+remote+'.map(h=>[h,{...h.intent}]))');
   const st=host.run('canaanGroupBot.step()');if(st.done||host.run('P.dead'))break;
   const wanted=JSON.parse(host.run('JSON.stringify(Object.fromEntries('+remote+'.map(h=>[h.id,{dx:h.intent.dx,dy:h.intent.dy,attack:h.intent.attack,skill:h.intent.skill??null,aimX:h.intent.aimX,aimY:h.intent.aimY}])))'));
   host.run('for(const [h,i] of __kept)Object.assign(h.intent,i)');
   ids.forEach((id,k)=>{if(wanted[id])guests[k].run('Object.assign(game.hero.intent,'+JSON.stringify(wanted[id])+')')});
   await tick();
   if(ticks%120===0)sawDungeon+=guests.every(g=>g.run('Number.isInteger(game.world.instance?.index)&&game.world.monsters.length>0'))?1:0;
  }
  const seconds=ticks/60,bytes=host.run('__bytes');
  console.log('[jalon 6] donjon à quatre en',Math.round(seconds),'s ; débit de l’hôte',Math.round(bytes/seconds/1024),'Ko/s');
  assert.equal(host.run('canaanGroupBot.state.done'),true,'le groupe a fini le donjon en '+Math.round(seconds)+' s');
  assert.equal(host.run('game.world.instance'),null,'tout le groupe est ressorti');
  assert.ok(sawDungeon>0,'les invités voyaient le donjon et ses monstres');
  for(let i=0;i<20;i++)await tick();
  // Chacun son butin : les reliques de chaque invité (61 % par boss) sont dans son sac, chez l'hôte comme chez lui,
  // avec sa bourse d'or et sa clé des secrets (boss caché).
  ids.forEach((id,k)=>{
   const G='game.guests["'+id+'"]';
   const relics=host.run(G+'.inventory.filter(i=>i.origin==="donjon").length');assert.ok(relics<=3,'reliques de '+['Lina','Oren','Maë'][k]);
   assert.ok(guests[k].run('P.gold')>=60,'bourse d’or de '+['Lina','Oren','Maë'][k]);
   assert.equal(guests[k].run('game.hero.inventory.filter(i=>i.origin==="donjon").length'),relics,'visible chez '+['Lina','Oren','Maë'][k]);
   assert.equal(host.run(G+'.player.keys'),1,'clé de '+['Lina','Oren','Maë'][k]);assert.equal(guests[k].run('P.keys'),1,'clé visible chez '+['Lina','Oren','Maë'][k]);
   assert.equal(guests[k].run('game.world.instance'),null,'revenu au monde');
  });
  assert.ok(host.run('game.hero.inventory.filter(i=>i.origin==="donjon").length')<=3);assert.equal(host.run('P.keys'),1);
  assert.ok(host.run('game.heroes.reduce((n,h)=>n+h.kills,0)')>=foes,'tous les boss, gardiens et renforts abattus');
  // Cinq ennemis à se partager entre quatre héros : les invités en abattent au moins un ensemble.
  assert.ok(ids.reduce((n,id)=>n+host.run('game.guests["'+id+'"].kills'),0)>=1,'les invités participent');
  assert.ok(bytes/seconds<200*1024,'débit raisonnable');
  for(const side of [host,...guests])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});
