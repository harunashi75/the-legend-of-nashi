const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Bâtiments : échoppe, cuisine, demeures, chaumière et refuges où l’on entre (E), habitants dedans et dehors, chaumière loin des donjons',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[]');
 const list=JSON.parse(run('JSON.stringify(CANAAN_HOUSE.buildings())'));
 assert.deepEqual(list.map(b=>b.id).sort(),['aubepines','chene','clairieres','cristaux','dunes','echoppe','maison','marmite','oasis','pilotis','puits','rousses']);
 // Refuges du marais, de l'automne et de la Forêt enchantée : chacun dans son biome, avec son architecture.
 assert.equal(run("JSON.stringify(['pilotis','rousses','cristaux'].map(id=>(b=>[ZONES.indexOf(regionAt(b.x+2,b.y+1)),b.style])(CANAAN_HOUSE.buildings().find(b=>b.id===id))))"),JSON.stringify([[2,'marais'],[3,'automne'],[5,'enchantee']]));
 // Chaque façade est pleine ; chaque porte est devant un passage libre, sur une île encore entièrement accessible.
 for(const b of list){
  assert.equal(run(`canWalk(${(b.x+b.w/2)*48},${(b.y+1.5)*48})`),false,b.id);
  assert.equal(run(`canWalk(${b.door.x},${b.door.y+14})`),true,b.id);
  assert.equal(run(`canWalk(${b.inside.x},${b.inside.y})`),true,b.id);
 }
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 // Chaque porte donne sur un sentier de terre relié, de chemin en chemin, jusqu'au feu du camp.
 const linked=JSON.parse(run(`JSON.stringify((()=>{const seen=new Set(),todo=[[CANAAN_CAMP.x,CANAAN_CAMP.y]];seen.add(CANAAN_CAMP.y*MAPW+CANAAN_CAMP.x);
   while(todo.length){const [x,y]=todo.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(y+dy)*MAPW+x+dx;if(!seen.has(k)&&overworld[y+dy]?.[x+dx]===2){seen.add(k);todo.push([x+dx,y+dy])}}}
   return CANAAN_HOUSE.buildings().map(b=>[b.id,seen.has((b.y+b.h)*MAPW+Math.floor(b.x+b.w/2-0.5))])})())`));
 for(const [id,ok] of linked)assert.equal(ok,true,'sentier de '+id);
 // Chaque style de façade se dessine (un par biome, et ceux du camp).
 assert.equal(run('CANAAN_HOUSE.styles().length'),10);
 // La chaumière est loin des portails (le premier donjon était trop près) ; le camp regroupe ses bâtiments.
 assert.ok(run('instances.every(d=>Math.hypot(d.x-CANAAN_HOUSE.outside().x-2,d.y-CANAAN_HOUSE.outside().y-1)>=32)'));
 for(const id of ['echoppe','marmite','aubepines','puits'])assert.ok(run(`Math.hypot(CANAAN_HOUSE.outsideDoor("${id}").x/TS-CANAAN_CAMP.x,CANAAN_HOUSE.outsideDoor("${id}").y/TS-CANAAN_CAMP.y)`)<run('CANAAN_CAMP.r')+2,id);
 // Le marchand est derrière le comptoir de son échoppe : on y entre par la porte (E), puis on lui parle.
 assert.equal(run('canaanRoomAt(game.world.npcs.find(n=>n.type==="shop").x/TS,game.world.npcs.find(n=>n.type==="shop").y/TS).id'),'echoppe');
 run('{const d=CANAAN_HOUSE.outsideDoor("echoppe");P.x=d.x;P.y=d.y+20}');assert.equal(run('nearMerchant()'),false);
 assert.equal(run('CANAAN_HOUSE.interact()'),true);assert.equal(run('currentZoneName()'),'Échoppe de Lira');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
 run('P.x=(CANAAN_ROOMS[1].x+6.5)*TS;P.y=(CANAAN_ROOMS[1].y+5.4)*TS');assert.equal(run('nearMerchant()'),true);
 // Plus de maison à décorer : ni touche H, ni meubles à poser.
 assert.equal(run('typeof toggleHousing'),'undefined');assert.equal(run('typeof CANAAN_HOUSE.place'),'undefined');
 // Les meubles bloquent le passage : le comptoir sépare le marchand des clients.
 assert.equal(run('canWalk((CANAAN_ROOMS[1].x+6.5)*TS,(CANAAN_ROOMS[1].y+4.5)*TS)'),false);
 // Sortie (E devant la porte intérieure) : retour devant l'échoppe.
 run('{const d=CANAAN_HOUSE.insideDoor("echoppe");P.x=d.x;P.y=d.y}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
 assert.equal(run('canaanInHouse(P.x/TS,P.y/TS)'),false);assert.ok(run('Math.hypot(P.x-CANAAN_HOUSE.outsideDoor("echoppe").x,P.y-CANAAN_HOUSE.outsideDoor("echoppe").y)')<30);
 // Habitants : un ou deux dans chaque bâtiment du jeu (cuisinier à La Marmite), d'autres dehors autour du feu et des refuges.
 run('CANAAN_LIFE.update()');
 const people=JSON.parse(run('JSON.stringify(CANAAN_LIFE.villagers().map(v=>({n:v.name,room:canaanRoomAt(v.x/TS,v.y/TS)?.id||null,camp:Math.hypot(v.x/TS-CANAAN_CAMP.x,v.y/TS-CANAAN_CAMP.y)<CANAAN_CAMP.r+2})))'));
 for(const id of ['echoppe','marmite','aubepines','puits','maison','chene','clairieres','oasis','dunes']){const n=people.filter(p=>p.room===id).length;assert.ok(n>=1&&n<=2,id+' : '+n)}
 assert.ok(people.some(p=>p.room==='marmite'&&/^Cuisini/.test(p.n)));
 assert.ok(people.filter(p=>!p.room&&p.camp).length>=3,'des habitants restent dehors au camp');
 // En donjon, la carte de l'instance réutilise les mêmes coordonnées : ni pièce, ni meuble qui bloque.
 assert.equal(run('(()=>{const s=game.world.instance;game.world.instance={index:0};const r=JSON.stringify([canaanRoomAt(CANAAN_ROOMS[1].x+6,CANAAN_ROOMS[1].y+4),canaanHouseBlocked((CANAAN_ROOMS[1].x+6.5)*TS,(CANAAN_ROOMS[1].y+4.5)*TS),isSafe(CANAAN_ROOMS[1].x+6,CANAAN_ROOMS[1].y+4)]);game.world.instance=s;return r})()'),'[null,false,false]');
 // Feu de camp, souches, banc et torches bloquent le passage : les habitants et les animaux en font le tour.
 const cx='(CANAAN_CAMP.x+.5)*TS',cy='(CANAAN_CAMP.y+.5)*TS';
 assert.equal(run(`canWalk(${cx},${cy})`),false,'feu de camp');
 assert.equal(run(`canWalk(${cx}-4,${cy}+72)`),false,'banc');
 assert.equal(run(`canWalk(${cx}-70,${cy}+6)`),false,'souche');
 assert.equal(run(`canWalk(${cx}+230,${cy}+40)`),false,'torche');
 assert.equal(run(`canWalk(${cx},${cy}+150)`),true,'la place reste libre');
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS');
 for(let i=0;i<1500;i++)run('time++;CANAAN_LIFE.update()');
 assert.equal(run(`CANAAN_LIFE.villagers().filter(v=>canaanCampBlocked(v.x,v.y)).length`),0,'aucun habitant dans le feu ni sur le banc');
 // On cuisine devant une cuisinière (La Marmite dorée, un refuge), plus au feu de camp.
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_CAMP.x+.5)*TS,(CANAAN_CAMP.y+1.5)*TS)'),false);
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_ROOMS[2].x+4.5)*TS,(CANAAN_ROOMS[2].y+3.6)*TS)'),true);
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_ROOMS[5].x+5)*TS,(CANAAN_ROOMS[5].y+3.6)*TS)'),true,'cheminée du refuge');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Quêtes : devant chaque objet et chaque personnage de l’île, le texte [E] se dessine sans erreur (pierre de passage du camp comprise)',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null');
 const spots=JSON.parse(run('JSON.stringify([...Object.values(CANAAN_QUESTS.sites()).flatMap(s=>s.objs.map(o=>[o.x,o.y])),...Object.values(CANAAN_QUESTS.npcs()).map(n=>[n.x,n.y]),...CANAAN_QUESTS.waystones().map(w=>[w.x,w.y])])'));
 assert.ok(spots.length>100,String(spots.length));
 for(const [x,y] of spots)run(`P.x=${x}+20;P.y=${y}+30;camX=P.x-W/2;camY=P.y-H/2;CANAAN_QUESTS.drawWorld(ctx)`);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Chaumière des Glycines : maison de PNJ meublée dans les Plaines, habitants, aucun meuble sauvegardé, porte en ligne',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot(),run=host.run;
 for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 try{
  run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  run('globalThis.ROOM=CANAAN_ROOMS.find(r=>r.id==="maison")');
  // La chaumière est dans les Plaines verdoyantes, près du camp ; la pièce est fermée de murs.
  assert.equal(run('ZONES.indexOf(regionAt(CANAAN_HOUSE.outside().x+2,CANAAN_HOUSE.outside().y+1))'),0);
  assert.ok(run('Math.hypot(CANAAN_HOUSE.outside().x-CANAAN_CAMP.x,CANAAN_HOUSE.outside().y-CANAAN_CAMP.y)')<45);
  assert.equal(run('canWalk(CANAAN_HOUSE.outsideDoor().x,CANAAN_HOUSE.outsideDoor().y+14)'),true);
  assert.equal(run('canWalk(CANAAN_HOUSE.insideDoor().x,CANAAN_HOUSE.insideDoor().y)'),true);
  assert.equal(run('[0,1].every(y=>overworld[ROOM.y+y].slice(ROOM.x,ROOM.x+15).every(t=>SOLID.includes(t)))'),true,'mur du fond');
  // Entrer par la porte (E) : zone sûre, au nom de la chaumière.
  run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
  assert.equal(run('CANAAN_HOUSE.inside(P.x,P.y)'),true);assert.equal(run('currentZoneName()'),'Chaumière des Glycines');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
  // Meublée d'avance : chaque meuble de son agencement est à sa place ; les meubles bloquent, pas les tapis.
  assert.equal(run('CANAAN_HOUSE.roomItems("maison").length'),25);
  assert.ok(run('CANAAN_HOUSE.roomItems("maison").some(i=>i.k==="metier")&&CANAAN_HOUSE.roomItems("maison").some(i=>i.k==="cheminee")'));
  assert.equal(run('canaanHouseBlocked((ROOM.x+1)*TS+24,(ROOM.y+2)*TS+24)'),true,'le grand lit bloque');
  assert.equal(run('canaanHouseBlocked((ROOM.x+7)*TS+24,(ROOM.y+8)*TS+24)'),false,'on marche sur le tapis de l’entrée');
  assert.equal(run('CANAAN_HOUSE.nearStove((ROOM.x+6)*TS,(ROOM.y+3.6)*TS)'),true,'on cuisine à la cheminée');
  // Habitants : la tisserande et son petit-fils.
  run('CANAAN_LIFE.update()');
  const inside=JSON.parse(run('JSON.stringify(CANAAN_LIFE.villagers().filter(v=>canaanRoomAt(v.x/TS,v.y/TS)?.id==="maison").map(v=>v.name))'));
  assert.equal(inside.length,2,inside.join(', '));
  // Plus de mode décoration ni de meubles à sauvegarder.
  assert.equal(run('typeof toggleHousing'),'undefined');assert.equal(run('CANAAN_KEYS.actionOf("h")'),run('canaanExtension("vallee")?"mount":null'));
  assert.equal(/toggleHousing|housingBar/.test(source),false,'ni bouton Maison ni barre de décoration');
  assert.equal(run('saveGame()'),true);
  assert.equal(JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).monde.maison,undefined);
  // En ligne : l'invitée entre par la porte (l'hôte la fait passer) ; poser un meuble n'est plus une action.
  run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async k=>{for(let i=0;i<k;i++){run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  run(`{const d=CANAAN_HOUSE.outsideDoor();${G}.player.x=d.x;${G}.player.y=d.y+20;${G}.player.mhp=${G}.player.hp=1e6}`);await step(8);
  guest.run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');
  assert.equal(guest.run('CANAAN_HOUSE.interact()'),true);await step(10);
  assert.equal(run(`CANAAN_HOUSE.inside(${G}.player.x,${G}.player.y)`),true,'l’invitée est dans la chaumière chez l’hôte');
  assert.equal(guest.run('CANAAN_HOUSE.roomItems("maison").length'),25,'elle voit les mêmes meubles');
  assert.equal(run(`CANAAN_HOUSE.handle(${G},{op:"house-place",k:"lit",x:9,y:8})`),false);
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Règles partagées des pièces : place des meubles, porte libre, murs, orientations et chevauchements',async()=>{
 const shared=f=>import(pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href);
 const D=await shared('data/house.js'),R=await shared('rules/house.js');
 const C=D.HOUSE_FURNITURE,room={w:12,h:10},MAX=999;
 assert.equal(D.HOUSE_MAX_ITEMS,undefined);assert.equal(D.HOUSE_FURNITURE_CATEGORIES,undefined);assert.equal(R.houseTopItemAt,undefined);
 assert.ok(Object.isFrozen(C.lit)&&Object.isFrozen(D.HOUSE_ROOM_FURNITURE.chene));
 assert.deepEqual(R.houseRoomGeometry(room),{floor:{x0:1,x1:10,y0:2,y1:8},door:{x:6,y:8}});
 // Quart de tour : la place au sol pivote ; miroir : elle ne change pas.
 assert.deepEqual(R.houseDims(C.lit,1),{w:2,h:1});assert.equal(R.houseTurns(C.lit),4);
 const mirror=Object.keys(C).find(k=>!C[k].turn&&C[k].w!==C[k].h);
 assert.equal(R.houseTurns(C[mirror]),2);assert.deepEqual(R.houseDims(C[mirror],1),{w:C[mirror].w,h:C[mirror].h});
 const can=(k,x,y,list=[],r=0,limit=MAX)=>R.houseCanPlace(C,room,list,k,x,y,r,limit);
 assert.equal(can('lit',1,2),true);
 assert.equal(can('lit',0,2),false,'dans le mur');assert.equal(can('lit',1,8),false,'déborde en bas');
 assert.equal(can('lit',6,7),false,'devant la porte');assert.equal(can('tapis',6,7),true,'un tapis laisse passer');
 assert.equal(can('lit',1,2,[],4),false,'orientation inconnue');assert.equal(can('lit',1.5,2),false);
 assert.equal(can('toString',1,2),false,'clé héritée refusée');assert.equal(can('inconnu',1,2),false);
 // Même couche : pas de chevauchement ; couches différentes : un tapis passe sous un lit.
 const bed=[{k:'lit',x:1,y:2,r:0}];
 assert.equal(can('lit',1,3,bed),false);assert.equal(can('lit',2,2,bed),true);
 assert.equal(can('tapis',1,2,bed),true);
 assert.equal(can('lit',3,2,bed,0,1),false,'limite de meubles');
 // Un meuble mural se pose toujours sur le mur du fond.
 const wall=Object.keys(C).find(k=>R.houseOnWall(C[k]));
 assert.equal(can(wall,3,5),true);
 assert.deepEqual(R.houseSanitizeItems(C,room,[{k:wall,x:3,y:5}],MAX),[{k:wall,x:3,y:0,r:0}]);
 const bed1={k:'lit',x:1,y:2,r:0};
 assert.equal(R.houseCovers(C,bed1,1,3),true);assert.equal(R.houseCovers(C,bed1,2,2),false);
 // Agencement lu : inconnus, mal placés et doublons écartés, dans l'ordre.
 assert.deepEqual(R.houseSanitizeItems(C,room,[{k:'lit',x:1,y:2},{k:'lit',x:1,y:2},{k:'??',x:3,y:3},null,{k:'lit',x:0,y:2},{k:'lit',x:3,y:2,r:1}],MAX),
  [{k:'lit',x:1,y:2,r:0},{k:'lit',x:3,y:2,r:1}]);
 assert.deepEqual(R.houseSanitizeItems(C,room,'pas une liste',MAX),[]);
 // Meubles fixes : chaque agencement du jeu est entièrement valide.
 const fixed=R.houseFurnishRooms(C,{a:room},{a:[['lit',1,2],['lit',1,2]]},999);assert.equal(fixed.a.length,1);
 for(const list of Object.values(D.HOUSE_ROOM_FURNITURE))for(const [k] of list)assert.ok(Object.hasOwn(C,k),k);
 // La chaumière des Glycines : tout son agencement tient dans sa pièce de 15 × 11.
 assert.equal(R.houseFurnishRooms(C,{maison:{w:15,h:11}},{maison:D.HOUSE_ROOM_FURNITURE.maison},999).maison.length,D.HOUSE_ROOM_FURNITURE.maison.length);
 assert.ok(Object.values(C).every(c=>!('cat' in c)&&!('quest' in c)));
});

test('Portes en coopératif : seule l’action house-door existe, les anciennes actions de décoration sont refusées',async()=>{
 const n=await import(pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'house-door',x:3}),{op:'house-door'});
 for(const op of ['house-place','house-remove','house-rotate'])assert.equal(n.sanitizeAction({op,k:'lit',x:1,y:2}),null,op);
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('typeof CANAAN_HOUSE_NET'),'undefined');
 // Invité : E devant une porte est demandé à l'hôte, jamais appliqué sur place.
 run('started=true;{const d=CANAAN_HOUSE.outsideDoor("echoppe");P.x=d.x;P.y=d.y+20}');
 run('globalThis.__asked=[];const net=CANAAN_NET,mode=game.mode;CANAAN_NET={...net,requestAction:a=>(__asked.push(a),true)};game.mode="guest";try{CANAAN_HOUSE.interact()}finally{CANAAN_NET=net;game.mode=mode}');
 assert.deepEqual(JSON.parse(run('JSON.stringify(__asked)')),[{op:'house-door'}]);
 assert.equal(run('canaanInHouse(P.x/TS,P.y/TS)'),false);
 // Hôte : la porte s'ouvre tout de suite.
 assert.equal(run('CANAAN_HOUSE.interact()'),true);assert.equal(run('canaanInHouse(P.x/TS,P.y/TS)'),true);
});
