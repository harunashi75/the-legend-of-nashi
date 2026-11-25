const { test } = require('node:test');
const {
  assert,
  source,
  groupInDungeon,
  playInstance
} = require('./helpers/context.cjs');

// Outils communs : se placer à côté d'un objet, actionner (E), lire l'état, résoudre l'énigme d'une porte.
function explorer(run){
 const plan='CANAAN_DUNGEON_EXPLORE.plan(game.world.instance.index)',st='CANAAN_DUNGEON_EXPLORE.state()';
 const walk=(x,y)=>run('P.x=('+x+'+0.5)*TS;P.y=('+y+'+0.5)*TS');
 const standBy=(x,y)=>run('{const c=[[0,1],[1,0],[-1,0],[0,-1]].map(([a,b])=>['+x+'+a,'+y+'+b]).find(([a,b])=>[20,21].includes(world[b][a]));P.x=(c[0]+0.5)*TS;P.y=(c[1]+0.5)*TS}');
 const use=it=>{standBy(it.x,it.y);return run('CANAAN_DUNGEON_EXPLORE.interact()')};
 const lock=s=>JSON.parse(run('JSON.stringify('+plan+'.locks['+s+'])'));
 const ls=s=>JSON.parse(run('JSON.stringify('+st+'.locks['+s+'])'));
 const after=()=>run('CanaanStages.dungeonPuzzles.after()');
 const doorOpen=s=>run('{const g='+plan+'.doors['+s+'];g.cells.every(([x,y])=>world[y][x]!==19)}');
 const solve=s=>{
  const L=lock(s);
  if(L.type==='braziers')for(const it of L.items)use(it);
  if(L.type==='levers'||L.type==='memory')for(const id of L.order)use(L.items[id]);
  if(L.type==='runes'){
   const press=it=>{walk(it.x,it.y);run('P.y-=10');after();run('P.x=0;P.y=0');after()};
   for(const id of L.order)press(L.items[id]);
  }
  if(L.type==='guardian'){run('for(const m of monsters.filter(m=>m.guardian==='+s+'))m.hp=0');after()}
  if(L.type==='mirrors')for(const it of L.items)if(it.id<L.pathMirrors&&((ls(s).prog>>it.id)&1)!==((L.solution>>it.id)&1))use(it);
  if(L.type==='toggles'){
   const n=L.items.length,full=(1<<n)-1,mask=j=>run('CANAAN_DUNGEON_EXPLORE.toggleMask('+j+','+n+')');
   const start=ls(s).prog;let pick=null;
   for(let set=0;set<1<<n&&pick===null;set++){let v=start;for(let j=0;j<n;j++)if(set&(1<<j))v^=mask(j);if(v===full)pick=set}
   for(let j=0;j<n;j++)if(pick&(1<<j))use(L.items[j]);
  }
  if(L.type==='search')for(const id of L.shards)use(L.items[id]);
  if(L.type==='ambush'){
   const hall=JSON.parse(run('JSON.stringify('+plan+'.rooms['+L.room+'])'));walk(hall.cx,hall.cy);
   for(let k=0;k<8&&!ls(s).done;k++){after();run('for(const m of monsters.filter(m=>m.ambush==='+s+'))m.hp=0')}
  }
  return doorOpen(s);
 };
 return {plan,st,walk,standBy,use,lock,ls,after,doorOpen,solve};
}

test('Donjons et raids compacts : énigmes propres à chaque instance, salles cachées invisibles, carte dans le brouillard',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Chaque instance a son thème, ses boss, ses boss cachés et un plan jouable (énigmes faisables, boss scellés).
 const audits=JSON.parse(run('JSON.stringify(instances.map((d,i)=>CANAAN_DUNGEON_AUDIT(i)))'));
 assert.equal(new Set(audits.map(a=>a.theme)).size,14);
 assert.deepEqual(audits.map(a=>a.bosses),[3,3,3,3,3,3,6,6,6,6,3,3,3,3]);
 assert.deepEqual(audits.map(a=>a.secrets),[1,1,1,1,1,1,2,2,2,2,1,1,1,1]);
 assert.deepEqual(audits.map(a=>a.doors),audits.map(a=>a.bosses));assert.deepEqual(audits.map(a=>a.gates),audits.map(a=>a.bosses-1));
 for(const a of audits){
  assert.equal(a.reachable,true,a.theme);assert.equal(a.sealed,true,a.theme);assert.ok(a.props>50,a.theme);
  // Compacts : peu de salles, deux fois moins de sol qu'avant (3 100 à 6 200 cases).
  assert.ok(a.rooms<=(a.bosses===6?20:12),a.theme+' : '+a.rooms+' salles');
  assert.ok(a.floor<(a.bosses===6?4200:2400),a.theme+' : '+a.floor+' cases de sol');
  // Salles cachées : de la roche tant que leur passage n'est pas ouvert.
  assert.equal(a.hiddenRooms,true,a.theme);
 }
 // Neuf énigmes, toutes utilisées ; jamais deux fois la même dans une instance, et aucune suite identique.
 assert.deepEqual([...new Set(audits.flatMap(a=>a.locks))].sort(),['ambush','braziers','guardian','levers','memory','mirrors','runes','search','toggles']);
 assert.ok(audits.every(a=>new Set(a.locks).size===a.locks.length));
 assert.equal(new Set(audits.map(a=>a.locks.join())).size,14);
 assert.deepEqual([...new Set(audits.flatMap(a=>a.triggers))].sort(),['statue','torch','wall']);
 // Mécaniques des boss : la bibliothèque entière sert, chaque boss a sa rotation.
 const mechs=JSON.parse(run('JSON.stringify(instances.map(d=>[...d.mechanics,...d.secretMechanics]))'));
 assert.equal(new Set(mechs.flat(2)).size,16);
 assert.ok(mechs.every(list=>list.every(m=>m.length>=2)));
 assert.ok(new Set(mechs.flat().map(m=>m.join())).size>=60,'des rotations variées');
 assert.equal(run('instances.every(d=>d.bosses.length===(d.raid?6:3)&&d.bosses[d.bosses.length-1]===d.boss&&d.secrets.length===(d.raid?2:1))'),true);
 assert.equal(run("instances[6].bosses.join(' → ')"),'Le Maître-Chien Ravageur → Sire Écorcheur → Le Chapelain Sanguin → La Comtesse Écarlate → Le Champion du Sang → Le Roi Sanglant');
 assert.equal(run('SOLID.includes(19)&&SOLID.includes(22)&&SOLID.includes(23)&&!SOLID.includes(20)&&!SOLID.includes(21)'),true);
 assert.equal(run('JSON.stringify(makeDungeon(7))===JSON.stringify(makeDungeon(7))'),true);
 run('game.hero.level=60;openPortal({instance:6})');
 assert.match(g.document.getElementById('window').innerHTML,/Boss \(6\) : Le Maître-Chien Ravageur → Sire Écorcheur/);
 assert.match(g.document.getElementById('window').innerHTML,/61 % de chance par boss et par héros \(0 à 6 objets\)/);assert.doesNotMatch(g.document.getElementById('window').innerHTML,/100 % garanti/);
 run('closePanels()');
 // Chaque énigme de chaque instance se résout comme un joueur la résoudrait.
 run('game.hero.level=60;recomputeStats();started=true;paused=false');
 for(let i=0;i<14;i++){
  run('game.hero.level=60;enterInstance('+i+',"normal")');assert.equal(run('game.world.instance?.index'),i,audits[i].theme+' : entrée');const E=explorer(run);
  for(let s=0;s<audits[i].bosses;s++)assert.equal(E.solve(s),true,audits[i].theme+' : porte '+s+' ('+audits[i].locks[s]+')');
  run('leaveInstance()');
 }
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Énigmes : braseros minutés, indices à recouper, gardiens liés, cristaux d’écho, miroirs, et passage secret qui cache sa salle',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 run('started=true;paused=false;game.hero.level=10;recomputeStats();enterInstance(0)');
 const E=explorer(run);
 assert.equal(run("monsters.filter(m=>m.boss&&m.secretBoss===undefined).map(m=>m.t).join()"),'Grignotte, Reine des Rats,Le Fossoyeur Bossu,Gardien des Os');
 // Le boss caché n'existe pas encore : ni dans la salle, ni sur la carte.
 assert.equal(run('monsters.filter(m=>m.secretBoss!==undefined).length'),0);
 assert.equal(run("monsters.filter(m=>!m.boss).every(m=>['Osselet','Rat des terriers'].includes(m.t))"),true);
 // Carte : l'entrée est connue, les salles des boss ne le sont pas encore.
 const rooms=JSON.parse(run('JSON.stringify('+E.plan+'.rooms)'));
 const boss2=rooms.find(r=>r.kind==='boss'&&r.stage===2),secret=rooms.find(r=>r.kind==='secret');
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.known('+rooms[0].cx+','+rooms[0].cy+')'),true);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.known('+boss2.cx+','+boss2.cy+')'),false);
 // Visiter une salle la révèle.
 E.walk(boss2.cx,boss2.cy);E.after();assert.equal(run('CANAAN_DUNGEON_EXPLORE.known('+boss2.cx+','+boss2.cy+')'),true);
 // Porte scellée : E donne l'indice, la porte reste fermée.
 const d0=JSON.parse(run('JSON.stringify('+E.plan+'.doors[0].cells[1])'));E.walk(d0[0],d0[1]+1);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);assert.equal(E.doorOpen(0),false);
 // Braseros minutés : trop lent, tout s'éteint.
 const L0=E.lock(0);assert.equal(L0.type,'braziers');
 E.use(L0.items[0]);assert.equal(E.ls(0).prog,1);
 run('time+='+(L0.time*60+5));E.after();assert.equal(E.ls(0).prog,0,'éteints');
 assert.equal(E.solve(0),true);
 // Urnes : une urne vide se brise, trois fragments ouvrent la porte.
 const L1=E.lock(1);assert.equal(L1.type,'search');
 const empty=L1.items.find(it=>!L1.shards.includes(it.id));E.use(empty);assert.equal(E.ls(1).prog,1<<empty.id);assert.equal(E.doorOpen(1),false);
 assert.equal(E.solve(1),true);
 // Leviers : la stèle donne des indices qui ne laissent qu'un ordre ; un mauvais ordre relève tout.
 const L2=E.lock(2);assert.equal(L2.type,'levers');
 E.standBy(L2.stele.x,L2.stele.y);run('globalThis.__notes=[];game.view.notify=m=>__notes.push(m)');run('CANAAN_DUNGEON_EXPLORE.interact()');
 assert.match(run('__notes.join()'),/📜 « .*(passe avant|vient juste après|marche|n’est pas).* » — Abaisse les leviers dans le bon ordre\./);
 const perms=a=>a.length<=1?[a]:a.flatMap((v,k)=>perms([...a.slice(0,k),...a.slice(k+1)]).map(p=>[v,...p]));
 const holds=(p,c)=>{const pa=p.indexOf(c.a),pb=p.indexOf(c.b);return c.k==='before'?pa<pb:c.k==='next'?pb===pa+1:c.k==='at'?pa===c.p:pa!==c.p};
 const fit=perms([...L2.order.keys()]).filter(p=>L2.clues.every(c=>holds(p,c)));
 assert.equal(fit.length,1,'un seul ordre possible');assert.deepEqual(fit[0],L2.order);
 const wrong=L2.items.find(it=>it.id!==L2.order[0]);E.use(wrong);assert.equal(E.ls(2).step,0);
 assert.equal(E.solve(2),true);
 // Passage secret : la salle cachée est de la roche ; le mur s'ouvre (E sur la lézarde), le boss caché apparaît.
 const w=JSON.parse(run('JSON.stringify('+E.plan+'.secretWalls[0])'));assert.equal(w.kind,'wall');
 assert.equal(run('world['+secret.cy+']['+secret.cx+']'),9);assert.equal(run('world['+w.cells[1][1]+']['+w.cells[1][0]+']'),23);
 E.standBy(w.cells[1][0],w.cells[1][1]);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);
 assert.notEqual(run('world['+w.cells[1][1]+']['+w.cells[1][0]+']'),23);assert.ok([20,21,22].includes(run('world['+secret.cy+']['+secret.cx+']')));
 assert.equal(run("monsters.filter(m=>m.secretBoss!==undefined).map(m=>m.t).join()"),'Le Rat-Roi aux Mille Queues');
 run('leaveInstance()');
 // Gardiens liés (La Citadelle des Pénitents) : abattre l'un, puis attendre trop longtemps, et il se relève.
 run('game.hero.level=30;recomputeStats();enterInstance(3)');
 const G=explorer(run),LG=G.lock(0);assert.equal(LG.type,'guardian');
 run('monsters.find(m=>m.guardian===0).hp=0');G.after();assert.equal(G.doorOpen(0),false);
 run('time+='+(LG.window*60+5));G.after();assert.equal(run('monsters.filter(m=>m.guardian===0&&m.hp>0).length'),2,'relevé');
 assert.equal(G.solve(0),true);
 // Embuscade : la salle se ferme derrière le groupe, trois vagues, puis tout se rouvre.
 const LA=G.lock(2);assert.equal(LA.type,'ambush');assert.equal(G.solve(1),true);
 const hall=rooms.length&&JSON.parse(run('JSON.stringify('+G.plan+'.rooms['+LA.room+'])'));G.walk(hall.cx,hall.cy);G.after();
 assert.equal(run('monsters.filter(m=>m.ambush===2&&m.hp>0).length'),LA.waves[0]);
 assert.ok(LA.seals.every(sl=>sl.cells.every(([x,y])=>run('world['+y+']['+x+']')===19)),'issues fermées');
 assert.equal(G.solve(2),true);assert.ok(LA.seals.every(sl=>sl.cells.every(([x,y])=>run('world['+y+']['+x+']')!==19)),'issues rouvertes');
 run('leaveInstance()');
 // Cristaux d'écho et miroirs (Le Sanctuaire de l'Éclipse) ; la statue de travers ouvre son passage.
 run('game.hero.level=20;recomputeStats();enterInstance(2)');
 const M=explorer(run),LM=M.lock(0);assert.equal(LM.type,'memory');
 M.standBy(LM.stele.x,LM.stele.y);run('CANAAN_DUNGEON_EXPLORE.interact()');
 // Pendant que la pierre chante, les cristaux écoutent ; une fausse note fait tout rejouer.
 run('time+='+(LM.order.length*42+2));
 M.use(LM.items[LM.order[0]]);assert.equal(M.ls(0).step,1);
 M.use(LM.items.find(it=>it.id!==LM.order[1]));assert.equal(M.ls(0).step,0);
 run('time+='+(60+LM.order.length*42+2));assert.equal(M.solve(0),true);
 const LR=M.lock(1);assert.equal(LR.type,'mirrors');
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.beam(2,1).lit'),false,'brouillé au départ');
 assert.equal(M.solve(1),true);assert.equal(run('CANAAN_DUNGEON_EXPLORE.beam(2,1).lit'),true);
 const sw=JSON.parse(run('JSON.stringify('+M.plan+'.secretWalls[0])'));assert.equal(sw.kind,'statue');
 M.standBy(sw.trigger.x,sw.trigger.y);assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);
 assert.equal(run('monsters.filter(m=>m.secretBoss===0).length'),1);
 run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Boss d’instance : butin, clé des secrets, coffre et portail de retour',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 run('started=true;paused=false;game.hero.level=10;recomputeStats();enterInstance(0)');
 const E=explorer(run);
 // Boss : 61 % de chance d'équipement par héros ; sa mort lève la herse de sa salle.
 const gates=()=>run('world.flat().filter(t=>t===19).length');
 const kill=(name,r)=>run('{const real=Math.random;Math.random=()=>'+r+';const m=monsters.find(m=>m.t==='+JSON.stringify(name)+');m.hp=0;recordKill(m);monsters=monsters.filter(o=>o!==m);Math.random=real}');
 run('inventory.length=0');E.solve(0);const g0=gates();
 kill('Grignotte, Reine des Rats',0.1);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'chanceux : un équipement');assert.ok(gates()<g0);
 E.solve(1);kill('Le Fossoyeur Bossu',0.9);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'pas de chance : rien');
 // Le boss caché donne une clé des secrets.
 const w=JSON.parse(run('JSON.stringify('+E.plan+'.secretWalls[0].cells[1])'));E.standBy(w[0],w[1]);run('CANAAN_DUNGEON_EXPLORE.interact()');
 run('P.keys=0');kill('Le Rat-Roi aux Mille Queues',0.1);assert.equal(run('P.keys'),1);assert.equal(run('instanceState.cleared'),false);
 E.solve(2);kill('Gardien des Os',0.9);assert.equal(run('instanceState.cleared'),true);assert.equal(run('chests.length'),1);
 const chest=JSON.parse(run('JSON.stringify(chests[0])')),spot=JSON.parse(run('JSON.stringify(dungeonChestSpot(0))'));
 assert.deepEqual([chest.x,chest.y],[spot.x,spot.y]);
 // La clé est gardée dans la sauvegarde.
 assert.equal(JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}).player)')).keys,1);
 // Les clés sont des objets du sac (touche I), en piles de 20 qui prennent de la place ; elles ne se vendent pas.
 const used0=run('canaanBagUsed(game.hero)');run('P.keys=45');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BAG.tiles(game.hero,"main").filter(t=>t.kind==="key").map(t=>t.n))')),[20,20,5]);
 assert.equal(run('canaanBagUsed(game.hero)'),used0+2);assert.equal(run('CANAAN_BAG.info({kind:"key",id:"secret",q:0,n:1}).name'),'Clé des secrets');
 assert.equal(run('!!CANAAN_BAG.parse("key:secret:0*20")&&!CANAAN_BAG.parse("key:secret:0*21")'),true);
 assert.equal(run('CANAAN_SHOP.sellStack?CANAAN_SHOP.sellStack(game.hero,"key:secret:0*5"):false'),false);assert.equal(run('P.keys'),45);
 run('P.keys=1');
 assert.doesNotMatch(source,/lumiCloud|Lumi : ✨/);
 // Portail de retour dans la salle du dernier boss : il attend que le coffre soit ouvert, puis ramène le groupe dehors.
 const exit=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.exitSpot(0))'));
 assert.equal(run('[20,21].includes(world['+exit.y+']['+exit.x+'])'),true,'sur le sol');
 E.walk(exit.x,exit.y);assert.equal(run('CANAAN_DUNGEON_EXPLORE.exitNear(P)'),true);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('!!instanceState'),true,'coffre pas encore ouvert : on reste');
 run('P.x=chests[0].x*TS;P.y=chests[0].y*TS;openNearbyChest()');E.walk(exit.x,exit.y);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('instanceState'),null,'sorti par le portail');
 assert.equal(run('world'),run('overworld'));
 // Raid : six boss ; les deux boss cachés attendent l'ouverture de leur passage.
 run('game.hero.level=60;enterInstance(6)');
 assert.equal(run('monsters.filter(m=>m.boss&&m.secretBoss===undefined).length'),6);assert.equal(run('monsters.filter(m=>m.secretBoss!==undefined).length'),0);
 run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Pièges : pointes en rythme, éboulements annoncés, et les invités reçoivent l’horloge de l’hôte',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 run('started=true;paused=false;game.hero.level=30;recomputeStats();P.hp=P.mhp;enterInstance(3)');
 const trap=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.plan(3).traps[0])'));assert.ok(trap.cells.length>=1);
 const [x,y]=trap.cells[0];run('P.x=('+x+'+0.5)*TS;P.y=('+y+'+0.5)*TS-10;game.world.monsters=[]');
 // Une période entière : la bande s'arme puis frappe une fois.
 run('globalThis.__hp=P.hp;for(let k=0;k<150;k++){time++;CanaanStages.dungeonPuzzles.after()}');
 assert.ok(run('P.hp<__hp'),'piétiné');assert.ok(run('__hp-P.hp')<=Math.ceil(run('P.mhp')*0.07)+1,'une seule fois');
 const out=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.stateOut())'));assert.equal(typeof out.tk,'number');assert.ok(Array.isArray(out.z));
 run('leaveInstance()');
 // Plus d'éboulements (La Mine) : aucun cercle ni dégât, même en marchant dans une salle d'énigme.
 run('game.hero.level=15;recomputeStats();P.hp=P.mhp;enterInstance(1)');
 const hall=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.plan(1).rooms.find(r=>r.kind==="hall"))'));
 run('P.x=('+hall.cx+'+0.5)*TS;P.y=('+hall.cy+'+0.5)*TS;game.world.monsters=[];const __x=P.x;for(let k=0;k<800;k++){time++;P.x=__x+Math.sin(k/20)*20;CanaanStages.dungeonPuzzles.after()}');
 assert.equal(JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.stateOut())')).tz.length,0,'aucune pierre annoncée');
 assert.equal(run('P.hp'),run('P.mhp'),'aucune pierre tombée');
 run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Groupe en instance : entrée et sortie ensemble, allié à terre relevé, coffre de boss individuel',()=>{
 const {run,errors}=groupInDungeon(10,'Épique');assert.equal(errors.length,0,errors.join('\n'));
 run('game.heroes[2].player.dead=true;game.heroes[2].player.hp=0;enterInstance(0)');
 assert.equal(run('!!game.world.instance'),true);
 assert.ok(run('game.heroes.every(h=>Math.hypot(h.player.x-P.x,h.player.y-P.y)<3*TS&&canWalk(h.player.x,h.player.y))'),'tout le groupe à l’entrée');
 assert.equal(run('game.heroes[2].player.dead'),false);assert.equal(run('game.heroes[2].player.hp===game.heroes[2].player.mhp'),true);
 // Coffre de fin : une bourse d'or pour chaque héros, quel que soit celui qui l'ouvre (l'équipement vient des boss).
 run('globalThis.__gold0=game.heroes.map(h=>h.player.gold);game.world.monsters=[];game.world.instance.cleared=true;spawnRewardChest();const c=game.world.chests[0];game.heroes[1].player.x=c.x*TS;game.heroes[1].player.y=c.y*TS');
 assert.equal(run('openNearbyChest(game.heroes[1])'),true);assert.equal(run('openNearbyChest(game.heroes[1])'),false,'une seule ouverture');
 assert.ok(run('game.heroes.every(h=>!h.inventory.some(i=>i.origin==="donjon")&&h.player.gold-__gold0[game.heroes.indexOf(h)]>=60)'));
 run('leaveInstance()');assert.equal(run('game.world.instance'),null);
 assert.ok(run('game.heroes.every(h=>Math.hypot(h.player.x-game.world.returnPos.x,h.player.y-game.world.returnPos.y)<3*TS)'),'tout le groupe ressort');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Jalon de la phase 2 : quatre héros explorent un donjon sans écran, énigmes, passage secret et butin de chacun',()=>{
 // La Cave des Terriers Abandonnés : le pilote résout les portes scellées, examine le mur fissuré, abat les trois
 // boss et le boss caché, ouvre le coffre et ressort.
 const {run,errors}=groupInDungeon(12,'Épique');
 run('const C=[["paladin",[2,9]],["druide",[1,3]],["elementaliste",[0,5]],["assassin",[1,4]]];game.heroes.forEach((h,i)=>{h.classe={id:C[i][0],talents:C[i][1]};recomputeHeroStats(h);h.player.hp=h.player.mhp});recomputeStats();P.hp=P.mhp');
 const r=playInstance(run,0,700);
 assert.ok(r.phases.includes('exploration'),r.phases.join());assert.equal(r.phases.at(-1),'sortie');assert.equal(run('canaanGroupBot.state.done'),true);
 assert.equal(run('game.world.instance'),null,'le groupe est ressorti');assert.ok(r.seconds<700,'terminé en '+r.seconds+' s');
 assert.ok(r.heroes.every(h=>!h.dead),'personne n’est tombé');
 // Butin : 61 % par boss et par héros (0 à 3 objets), la bourse du coffre et une clé des secrets pour chacun.
 assert.ok(r.heroes.every(h=>h.relics.length<=3&&h.relics.every(x=>/^Rare (7|8|9|10)$/.test(x))&&h.purse>=60&&h.keys===1),JSON.stringify(r.heroes));
 assert.ok(r.heroes.reduce((n,h)=>n+h.kills,0)>=r.foes,'tous les ennemis, les boss et leurs renforts sont abattus');
 assert.ok(r.heroes.slice(1).some(h=>h.kills>0),'les alliés participent');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Donjons et raids : moins d’XP, plus coriaces, et des boss aux mécaniques propres (rotation, renforts, totems, frénésie, rage)',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Boss et fin d'instance : une part du niveau de l'instance (comme les quêtes) ; boss mondial : 12 monstres de son niveau.
 assert.equal(run('bossXp(10,"dungeon")'),run('Math.round(levelXpShare(10)*0.12)'));assert.equal(run('bossXp(10,"raid")'),run('Math.round(levelXpShare(10)*0.08)'));
 assert.equal(run('clearXp(10,false)'),run('Math.round(levelXpShare(10)*0.25)'));assert.equal(run('clearXp(10,true)'),run('Math.round(levelXpShare(10)*0.3)'));
 assert.equal(run('bossXp(60,"raid")'),run('Math.round(levelXpShare(59)*0.08)'));assert.equal(run('bossXp(10,"world")'),(10+50)*12);
 // Écart de niveau : la même pénalité que les monstres (−15 % par niveau de moins, 10 % au-delà de 5), jamais de bonus.
 assert.equal(run('bossXp(10,"dungeon",12)'),run('Math.round(levelXpShare(10)*0.12*0.7)'));assert.equal(run('bossXp(10,"dungeon",7)'),run('bossXp(10,"dungeon")'));
 assert.equal(run('clearXp(10,true,30)'),run('Math.round(levelXpShare(10)*0.3*0.1)'));assert.equal(run('xpGapFactor(10,10)'),1);
 assert.ok(run('bossHealth(30,"raid")>bossHealth(30,"dungeon")&&bossDamage(30,"dungeon")>mobDamage(30)'));
 run('started=true;paused=false;P.dead=false;game.view={notify:()=>{},chat:()=>{}};game.hero.level=10;recomputeStats();P.hp=P.mhp;enterInstance(0)');
 assert.ok(run('(m=>m.mhp>=Math.round(mobHealth(m.level,false,(MOB_TYPES.find(t=>t.name===m.t)||{hp:100}).hp)*1.2))(game.world.monsters.find(m=>!m.boss))'));
 // Chaque boss porte la rotation de sa fiche.
 assert.equal(run('JSON.stringify(game.world.monsters.filter(m=>m.boss).map(m=>m.mechs))'),JSON.stringify([['charge','adds'],['slam','pools'],['nova','rain','adds']]));
 // Grignotte dans sa salle, le héros à côté.
 run('globalThis.boss=game.world.monsters.find(m=>m.bossStage===0);game.world.monsters=[boss];P.x=boss.x+120;P.y=boss.y;boss.cd=99;boss.castUntil=1e9');
 const zones='CANAAN_BOSS_MECHANICS.zones()';
 // Onde de choc : un cercle annoncé, puis des dégâts à qui y reste.
 run('CANAAN_BOSS_MECHANICS.cast(boss,"slam")');assert.equal(run(zones+'.length'),1);
 run('{const z='+zones+'[0];P.x=z.x;P.y=z.y;globalThis.hp0=P.hp;const rnd0=Math.random;Math.random=()=>0.5;for(let i=0;i<100;i++){time++;CanaanStages.bossMechanics.after()}Math.random=rnd0}');
 assert.ok(run('P.hp<hp0'),'resté dans le cercle : touché');assert.equal(run(zones+'.length'),0);
 // Anneau : seul le cœur, près du boss, est sûr.
 run('{P.hp=P.mhp;globalThis.rnd0=Math.random;Math.random=()=>0.5;CANAAN_BOSS_MECHANICS.cast(boss,"donut");const z='+zones+'[0];P.x=z.x+10;P.y=z.y;globalThis.hp0=P.hp;for(let i=0;i<140;i++){time++;CanaanStages.bossMechanics.after()}}');
 assert.equal(run('P.hp'),run('hp0'),'collé au boss : épargné');
 // Charge : une ligne vers le héros, puis le boss fonce.
 run('CANAAN_BOSS_MECHANICS.clear();P.x=boss.x+150;P.y=boss.y;globalThis.bx=boss.x;CANAAN_BOSS_MECHANICS.cast(boss,"charge")');
 assert.equal(run(zones+'[0].kind'),'line');assert.equal(run('CANAAN_BOSS_MECHANICS.inside('+zones+'[0],P.x,P.y)'),true);
 run('for(let i=0;i<90;i++){time++;CanaanStages.bossMechanics.after()}');assert.ok(run('boss.x>bx+60'),'il a foncé');
 // Zone sûre : toute la salle explose, sauf le cercle vert.
 run('{P.hp=P.mhp;CANAAN_BOSS_MECHANICS.cast(boss,"safe");const z='+zones+'[0];P.x=z.x;P.y=z.y;globalThis.hp0=P.hp;for(let i=0;i<230;i++){time++;CanaanStages.bossMechanics.after()}}');
 assert.equal(run('P.hp'),run('hp0'),'dans le cercle vert : épargné');
 // Rayon tournant : il tourne autour du boss.
 run('CANAAN_BOSS_MECHANICS.cast(boss,"beam");globalThis.z='+zones+'[0]');assert.equal(run('z.kind'),'beam');
 // Les invités reçoivent les zones et les dessinent.
 const view=JSON.parse(run('JSON.stringify(CANAAN_BOSS_MECHANICS.view())'));assert.equal(view[0][0],run('CANAAN_BOSS_MECHANICS.KINDS.indexOf("beam")'));
 run('CANAAN_BOSS_MECHANICS.clear();Math.random=rnd0');
 // Renforts à 66 % de PV (et 33 %), puis rage sous 25 % (dégâts ×1,25).
 const raw=run('CANAAN_ENEMY_RAW_DAMAGE(boss)');
 run('boss.castUntil=0;P.x=boss.x+100;P.y=boss.y;boss.mech={next:1e12,k:0,adds:0,totems:false,fight:time};boss.hp=boss.mhp*0.45;time++;CanaanStages.bossMechanics.after()');assert.equal(run('game.world.monsters.filter(m=>m.summoned).length'),2);
 run('boss.hp=boss.mhp*0.2;time++;CanaanStages.bossMechanics.after()');assert.equal(run('boss.enraged'),true);
 assert.ok(Math.abs(run('CANAAN_ENEMY_RAW_DAMAGE(boss)')-raw*1.25)<1e-6);
 // Totems : à 50 %, des cristaux de garde ; le boss est invulnérable tant qu'il en reste.
 run('boss.mechs=["totems","berserk"];boss.mech={next:1e12,k:0,adds:0,totems:false,fight:time};boss.hp=boss.mhp*0.45;time++;CanaanStages.bossMechanics.after()');
 assert.equal(run('boss.bossShield'),true);assert.equal(run('game.world.monsters.filter(m=>m.t==="Cristal de garde"&&m.still).length'),2);
 run('globalThis.hpB=boss.hp;canaanDamageMonster(boss,50)');assert.equal(run('boss.hp'),run('hpB'),'immunisé');
 run('for(const m of game.world.monsters.filter(m=>m.t==="Cristal de garde"))m.hp=0;time++;CanaanStages.bossMechanics.after()');assert.equal(run('boss.bossShield'),false);
 // Frénésie : un combat trop long, et il frappe bien plus fort.
 run('boss.mech.fight=time-200*60;time++;CanaanStages.bossMechanics.after()');assert.equal(run('boss.berserk'),true);
 assert.ok(Math.abs(run('CANAAN_ENEMY_RAW_DAMAGE(boss)')-raw*1.25*1.8)<1e-6);
 run('leaveInstance()');assert.equal(errors.length,0,errors.join('\n'));
});

test('Donjons et raids : boss bien plus robustes qu’une élite, élites plus robustes qu’un monstre',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 run('started=true;paused=false;P.dead=false;game.view.chat=()=>{};toast=()=>{}');
 run('game.hero.level=28;enterInstance(3)');
 const r=JSON.parse(run('(()=>{for(let i=0;i<3;i++)simulateStep();const ms=game.world.monsters,b=ms.find(m=>m.boss);scaleBossHp(b);const t=ms.find(m=>!m.boss);const e={...t,elite:true,_levelHp:false,hp:1,mhp:1};canaanSetupMob(e);return JSON.stringify({trash:t.mhp,elite:e.mhp,boss:b.mhp})})()'));
 assert.ok(r.elite<r.trash*1.8,'élite : '+JSON.stringify(r));
 assert.ok(r.boss>r.elite*5,'boss : '+JSON.stringify(r));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Données partagées des donjons : une structure et des créatures par instance, chaque boss et boss secret a son apparence',async()=>{
 const path=require('node:path'),{pathToFileURL}=require('node:url');
 const shared=f=>import(pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href);
 const D=await shared('data/dungeons.js'),W=await shared('data/world.js');
 assert.equal(D.DUNGEON_LAYOUTS.length,W.INSTANCE_DEFS.length,'une structure par instance');
 assert.equal(D.DUNGEON_ACTORS.length,W.INSTANCE_DEFS.length,'des créatures par instance');
 assert.ok(Object.isFrozen(D.DUNGEON_LAYOUTS[0])&&Object.isFrozen(D.DUNGEON_ACTORS[0].mobs[0].pal));
 const keys=new Set();
 W.INSTANCE_DEFS.forEach((def,i)=>{
  const L=D.DUNGEON_LAYOUTS[i],A=D.DUNGEON_ACTORS[i],who=def.name;
  assert.ok(!keys.has(L.key),'clé unique '+L.key);keys.add(L.key);
  assert.ok(['cave','hall','pit','void'].includes(L.shape),who+' : forme');
  assert.ok(Number.isInteger(L.hazard.pools)&&typeof L.hazard.style==='string',who+' : danger');
  assert.ok(['portcullis','barrier'].includes(L.gate),who+' : porte');
  assert.ok(Array.isArray(L.wallProps)&&Array.isArray(L.floorProps),who+' : décors');
  assert.ok(A.mobs.length>0&&A.mobs.every(m=>m.name&&m.look&&m.pal.length===5),who+' : monstres');
  assert.ok(A.bosses.length>=(def.bosses||[def.boss]).length,who+' : une apparence par boss');
  assert.ok((A.secrets||[]).length>=(def.secrets||[]).length,who+' : une apparence par boss secret');
  assert.ok([...A.bosses,...(A.secrets||[])].every(b=>b.look&&b.pal.length===5),who+' : palettes des boss');
 });
 assert.equal(D.DUNGEON_ARENA_LAYOUT.shape,'hall');
 assert.ok(D.DUNGEON_SOLID_PROPS.every(p=>typeof p==='string')&&D.DUNGEON_SOLID_PROPS.includes('pillar'));
 assert.ok(D.DUNGEON_BOSS_DROP_CHANCE>0&&D.DUNGEON_BOSS_DROP_CHANCE<1);
});

test('Une fiche par donjon : chaque instance a son fichier, l’ordre des sauvegardes est fixe, une fiche fautive est refusée',async()=>{
 const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
 const dir=path.join(__dirname,'..','src','canaan','shared','data','dungeons');
 const I=await import(pathToFileURL(path.join(dir,'index.js')).href),W=await import(pathToFileURL(path.join(dir,'..','world.js')).href);
 const D=await import(pathToFileURL(path.join(dir,'..','dungeons.js')).href);
 // Ordre des sauvegardes : les donjons terminés sont retenus par leur position, on n'ajoute qu'à la fin.
 assert.deepEqual(I.DUNGEONS.slice(0,14).map(d=>d.key),['terriers','mine','eclipse','penitents','forge','fosse','bastion','continuum','seraphin','celestia','durgrim','ombral','mille_tombes','fongique']);
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&f!=='index.js'&&f!=='arene.js');
 assert.equal(files.length,I.DUNGEONS.length,'chaque fiche du dossier est listée dans index.js');
 I.DUNGEONS.forEach((d,i)=>{
  assert.equal(W.INSTANCE_DEFS[i].name,d.rules.name);
  assert.equal(D.DUNGEON_LAYOUTS[i].key,d.key);
  assert.equal(D.DUNGEON_PALETTES[i].key,d.key);
  assert.ok(D.DUNGEON_PALETTES[i].floor&&D.DUNGEON_PALETTES[i].wall,d.key+' : palette');
 });
 assert.equal(D.DUNGEON_ARENA_PALETTE.key,'arene');
 // Contrôle au chargement : une fiche sans plan, ou une clé en double, empêche le jeu de démarrer avec un donjon cassé.
 const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'fiches-'));
 const src=fs.readFileSync(path.join(dir,'index.js'),'utf8').replace(/'\.\.\/\.\.\/freeze\.js'/,JSON.stringify(pathToFileURL(path.join(dir,'..','..','freeze.js')).href));
 for(const f of fs.readdirSync(dir))fs.copyFileSync(path.join(dir,f),path.join(tmp,f));
 fs.writeFileSync(path.join(tmp,'index.js'),src.replace("import mine from './mine.js';","import mine from './terriers.js';"));
 await assert.rejects(import(pathToFileURL(path.join(tmp,'index.js')).href),/clé en double/);
 fs.writeFileSync(path.join(tmp,'mine.js'),fs.readFileSync(path.join(dir,'mine.js'),'utf8').replace("shape: 'hall'","shape: 'cube'"));
 fs.writeFileSync(path.join(tmp,'index2.js'),src);
 await assert.rejects(import(pathToFileURL(path.join(tmp,'index2.js')).href),/mine.*layout\.shape/);
 fs.rmSync(tmp,{recursive:true,force:true});
});

test('Tentatives notées : chaque plan est celui que donnerait la recherche depuis la première graine', () => {
 const noted = /const PLAN_TRIES = \[[^\]]*\]/;
 assert.match(source, noted);
 const plans = src => require('./helpers/canaan-runtime.cjs')(src).run('JSON.stringify(instances.map((d,i)=>CANAAN_DUNGEON_EXPLORE.plan(i)))');
 assert.equal(plans(source), plans(source.replace(noted, 'const PLAN_TRIES = []')));
});
