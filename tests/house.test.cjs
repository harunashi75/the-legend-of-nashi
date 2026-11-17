const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Bâtiments : échoppe, cuisine, demeures et refuges où l’on entre (E), habitants dedans et dehors, maison loin des donjons',()=>{
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
 // La maison est loin des portails (le premier donjon était trop près) ; le camp regroupe ses bâtiments.
 assert.ok(run('instances.every(d=>Math.hypot(d.x-CANAAN_HOUSE.outside().x-2,d.y-CANAAN_HOUSE.outside().y-1)>=32)'));
 for(const id of ['echoppe','marmite','aubepines','puits'])assert.ok(run(`Math.hypot(CANAAN_HOUSE.outsideDoor("${id}").x/TS-CANAAN_CAMP.x,CANAAN_HOUSE.outsideDoor("${id}").y/TS-CANAAN_CAMP.y)`)<run('CANAAN_CAMP.r')+2,id);
 // Le marchand est derrière le comptoir de son échoppe : on y entre par la porte (E), puis on lui parle.
 assert.equal(run('canaanRoomAt(game.world.npcs.find(n=>n.type==="shop").x/TS,game.world.npcs.find(n=>n.type==="shop").y/TS).id'),'echoppe');
 run('{const d=CANAAN_HOUSE.outsideDoor("echoppe");P.x=d.x;P.y=d.y+20}');assert.equal(run('nearMerchant()'),false);
 assert.equal(run('CANAAN_HOUSE.interact()'),true);assert.equal(run('currentZoneName()'),'Échoppe de Lira');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
 run('P.x=(CANAAN_ROOMS[1].x+6.5)*TS;P.y=(CANAAN_ROOMS[1].y+5.4)*TS');assert.equal(run('nearMerchant()'),true);
 assert.equal(run('toggleHousing()'),false,'on ne décore que sa maison');
 assert.equal(run('CANAAN_HOUSE.place(game.hero,"lit",1,6)'),false);
 // Les meubles bloquent le passage : le comptoir sépare le marchand des clients.
 assert.equal(run('canWalk((CANAAN_ROOMS[1].x+6.5)*TS,(CANAAN_ROOMS[1].y+4.5)*TS)'),false);
 // Sortie (E devant la porte intérieure) : retour devant l'échoppe.
 run('{const d=CANAAN_HOUSE.insideDoor("echoppe");P.x=d.x;P.y=d.y}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
 assert.equal(run('canaanInHouse(P.x/TS,P.y/TS)'),false);assert.ok(run('Math.hypot(P.x-CANAAN_HOUSE.outsideDoor("echoppe").x,P.y-CANAAN_HOUSE.outsideDoor("echoppe").y)')<30);
 // Habitants : un ou deux dans chaque bâtiment du jeu (cuisinier à La Marmite), d'autres dehors autour du feu et des refuges.
 run('CANAAN_LIFE.update()');
 const people=JSON.parse(run('JSON.stringify(CANAAN_LIFE.villagers().map(v=>({n:v.name,room:canaanRoomAt(v.x/TS,v.y/TS)?.id||null,camp:Math.hypot(v.x/TS-CANAAN_CAMP.x,v.y/TS-CANAAN_CAMP.y)<CANAAN_CAMP.r+2})))'));
 for(const id of ['echoppe','marmite','aubepines','puits','chene','clairieres','oasis','dunes']){const n=people.filter(p=>p.room===id).length;assert.ok(n>=1&&n<=2,id+' : '+n)}
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

test('Maison : chaumière dans les Plaines, pièce vide à décorer (H), meubles qu’on tourne (R), sauvegarde et invitée en ligne',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot(),run=host.run;
 for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 try{
  run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  // La chaumière est dans les Plaines verdoyantes, près du camp ; la pièce est fermée de murs.
  assert.equal(run('ZONES.indexOf(regionAt(CANAAN_HOUSE.outside().x+2,CANAAN_HOUSE.outside().y+1))'),0);
  assert.ok(run('Math.hypot(CANAAN_HOUSE.outside().x-CANAAN_CAMP.x,CANAAN_HOUSE.outside().y-CANAAN_CAMP.y)')<45);
  assert.equal(run('canWalk(CANAAN_HOUSE.outsideDoor().x,CANAAN_HOUSE.outsideDoor().y+14)'),true);
  assert.equal(run('canWalk(CANAAN_HOUSE.insideDoor().x,CANAAN_HOUSE.insideDoor().y)'),true);
  assert.equal(run('[0,1].every(y=>overworld[CANAAN_HOUSE_ROOM.y+y].slice(CANAAN_HOUSE_ROOM.x,CANAAN_HOUSE_ROOM.x+15).every(t=>SOLID.includes(t)))'),true,'mur du fond');
  // Entrer par la porte (E) : la maison est une zone sûre, « Ta maison ».
  run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
  assert.equal(run('CANAAN_HOUSE.inside(P.x,P.y)'),true);assert.equal(run('currentZoneName()'),'Ta maison');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
  // Mode décoration seulement à l'intérieur ; la pièce commence vide.
  assert.equal(run('CANAAN_HOUSE.items().length'),0);assert.equal(run('toggleHousing()'),true);assert.ok(run('!!document.getElementById("housingBar")'));
  // Règles : dans la pièce, sans chevauchement (par couche), passage de la porte libre, cheminée contre le mur du fond.
  const place=(k,x,y)=>run(`CANAAN_HOUSE.place(game.hero,"${k}",${x},${y})`);
  assert.equal(place('lit',1,2),true);assert.equal(place('table',1,3),false,'chevauche le lit');
  assert.equal(place('table',0,5),false,'dans le mur');assert.equal(place('banc',13,8),false,'déborde');
  assert.equal(place('chaise',7,9),false,'devant la porte');assert.equal(place('tapis',6,8),true,'un tapis peut aller devant la porte');
  assert.equal(place('cheminee',5,4),false);assert.equal(place('cheminee',5,2),true);
  assert.equal(place('table',3,5),true);assert.equal(place('tapis_rond',3,4),true,'un tapis sous la table');
  assert.equal(place('fenetre',9,5),true);assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_HOUSE.items().find(i=>i.k==="fenetre"))')),{k:'fenetre',x:9,y:0,r:0},'au mur du fond');
  assert.equal(place('cadre',9,0),false,'déjà une fenêtre');assert.equal(place('rideaux',9,0),true,'des rideaux sur la fenêtre');
  assert.equal(place('dragon',3,3),false);
  // Les meubles bloquent le passage, pas les tapis.
  assert.equal(run('canWalk(CANAAN_HOUSE.insideDoor().x-7*TS+TS/2,(CANAAN_HOUSE_ROOM.y+3)*TS)'),false,'le lit bloque');
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+6)*TS+24,(CANAAN_HOUSE_ROOM.y+8)*TS+24)'),false,'on marche sur le tapis');
  // Retirer : le meuble le plus haut d'abord (les rideaux avant la fenêtre).
  assert.equal(run('CANAAN_HOUSE.remove(game.hero,9,1).k'),'rideaux');assert.equal(run('CANAAN_HOUSE.items().some(i=>i.k==="fenetre")'),true);
  // Clic en mode décoration : poser l'objet choisi sous la souris.
  run('CANAAN_HOUSE.actions.select("plante");mouseWorldX=(CANAAN_HOUSE_ROOM.x+12)*TS+20;mouseWorldY=(CANAAN_HOUSE_ROOM.y+6)*TS+20');
  assert.equal(run('CANAAN_HOUSE.click(0)'),true);assert.ok(run('CANAAN_HOUSE.items().some(i=>i.k==="plante"&&i.x===12&&i.y===6)'));
  // Orientation : un banc tourné d'un quart de tour occupe 1×2 cases ; une armoire se retourne en miroir (2 sens).
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"banc",10,3,1)'),true);
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+10)*TS+24,(CANAAN_HOUSE_ROOM.y+4)*TS+24)'),true,'le banc tourné prend la case du dessous');
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+11)*TS+24,(CANAAN_HOUSE_ROOM.y+3)*TS+24)'),false);
  assert.equal(run('CANAAN_HOUSE.rotate(game.hero,10,4)'),true);
  assert.equal(run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),2);
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+11)*TS+24,(CANAAN_HOUSE_ROOM.y+3)*TS+24)'),true,'remis à l’horizontale');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"chaise",9,6,3)'),true,'chaise tournée vers la droite');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"armoire",11,6,2)'),false,'une armoire n’a que deux sens');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"armoire",11,6,1)'),true);
  // Touche R en mode décoration : le meuble en main tourne avant d'être posé.
  run('CANAAN_HOUSE.actions.select("lit");CANAAN_HOUSE.actions.rotate();mouseWorldX=(CANAAN_HOUSE_ROOM.x+9)*TS+20;mouseWorldY=(CANAAN_HOUSE_ROOM.y+8)*TS+20');
  assert.equal(run('CANAAN_HOUSE.click(0)'),true);assert.equal(run('JSON.stringify(CANAAN_HOUSE.items().find(i=>i.k==="lit"&&i.r===1))'),'{"k":"lit","x":9,"y":8,"r":1}');
  run('CANAAN_HOUSE.actions.select("lit")');
  // Sauvegarde : les meubles sont dans monde.maison ; un meuble invalide est écarté au chargement.
  assert.equal(run('saveGame()'),true);
  const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).monde.maison;
  assert.equal(saved.items.length,11);assert.equal(saved.items.find(i=>i.k==='banc').r,2,'l’orientation est sauvegardée');
  assert.equal(run('CANAAN_HOUSE.sanitize({items:[{k:"lit",x:1,y:2},{k:"lit",x:1,y:2},{k:"chaise",x:7,y:9},{k:"x",x:2,y:2},{k:"tapis",x:20,y:2}]}).length'),1);
  // En ligne : l'invitée entre par la porte, voit les meubles et en pose un.
  run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async k=>{for(let i=0;i<k;i++){run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  run(`{const d=CANAAN_HOUSE.outsideDoor();${G}.player.x=d.x;${G}.player.y=d.y+20;${G}.player.mhp=${G}.player.hp=1e6}`);await step(8);
  guest.run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');
  assert.equal(guest.run('CANAAN_HOUSE.interact()'),true);await step(10);
  assert.equal(run(`CANAAN_HOUSE.inside(${G}.player.x,${G}.player.y)`),true,'l’invitée est dans la maison chez l’hôte');
  assert.equal(guest.run('CANAAN_HOUSE.items().length'),11,'elle voit les meubles');
  assert.equal(guest.run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),2,'dans le bon sens');
  guest.run('CANAAN_NET.requestAction({op:"house-rotate",x:10,y:3})');await step(10);
  assert.equal(run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),3,'elle tourne un meuble');
  guest.run('CANAAN_NET.requestAction({op:"house-place",k:"aquarium",x:13,y:9})');await step(10);
  assert.ok(run('CANAAN_HOUSE.items().some(i=>i.k==="aquarium")'));assert.ok(guest.run('CANAAN_HOUSE.items().some(i=>i.k==="aquarium")'),'la maison revient à tous');
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Règles partagées de la maison : place des meubles, porte libre, murs, orientations et chevauchements',async()=>{
 const shared=f=>import(pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href);
 const D=await shared('data/house.js'),R=await shared('rules/house.js');
 const C=D.HOUSE_FURNITURE,room={w:12,h:10},MAX=D.HOUSE_MAX_ITEMS;
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
 // Meuble le plus haut sur une case : mur avant sol, sol avant tapis.
 const list=[{k:'tapis',x:1,y:2,r:0},{k:'lit',x:1,y:2,r:0}];
 assert.equal(R.houseTopItemAt(C,list,1,2).k,'lit');assert.equal(R.houseCovers(C,list[1],1,3),true);assert.equal(R.houseCovers(C,list[1],2,2),false);
 // Rotation : quart de tour suivant s'il a la place, sinon null.
 const alone={k:'lit',x:1,y:2,r:0};assert.equal(R.houseNextRotation(C,room,[alone],alone,MAX),1);
 const tight=[{k:'lit',x:1,y:2,r:0},{k:'lit',x:2,y:2,r:0}];
 assert.equal(R.houseNextRotation(C,room,tight,tight[0],MAX),2,'demi-tour : même place au sol');
 // Lecture d'une sauvegarde : inconnus, mal placés et doublons écartés, dans l'ordre.
 assert.deepEqual(R.houseSanitizeItems(C,room,[{k:'lit',x:1,y:2},{k:'lit',x:1,y:2},{k:'??',x:3,y:3},null,{k:'lit',x:0,y:2},{k:'lit',x:3,y:2,r:1}],MAX),
  [{k:'lit',x:1,y:2,r:0},{k:'lit',x:3,y:2,r:1}]);
 assert.deepEqual(R.houseSanitizeItems(C,room,'pas une liste',MAX),[]);
 // Meubles fixes : chaque agencement du jeu est entièrement valide.
 const fixed=R.houseFurnishRooms(C,{a:room},{a:[['lit',1,2],['lit',1,2]]},999);assert.equal(fixed.a.length,1);
 for(const list of Object.values(D.HOUSE_ROOM_FURNITURE))for(const [k] of list)assert.ok(Object.hasOwn(C,k),k);
 for(const tab of new Set(Object.values(C).map(c=>c.cat)))assert.ok(D.HOUSE_FURNITURE_CATEGORIES.some(([c])=>c===tab),tab);
});
