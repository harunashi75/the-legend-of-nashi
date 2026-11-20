const { test } = require('node:test');
const {
  assert,
  path,
  source
} = require('./helpers/context.cjs');

test('Métiers : pêche dans l’eau profonde, qualités selon le niveau, cuisine près d’une cuisinière, repas et leurs effets',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];P.dead=false;game.view={notify:()=>{},chat:()=>{}}');
 // Bancs de poissons : en mer, dans les lacs et les lacs scintillants, jamais dans l'eau peu profonde du marais.
 const kinds=run('[...new Set(CANAAN_PROF.spots().map(s=>s.kind))].sort().join()');assert.equal(kinds,'glow,lake,sea');
 assert.ok(run('CANAAN_PROF.spots().length')>=25);
 assert.ok(run('CANAAN_PROF.spots().every(s=>s.layer==="under"?game.world.underworld[s.ty][s.tx]===CANAAN_UNDER.T.LAKE:[0,18].includes(game.world.overworld[s.ty][s.tx]))'));
 assert.ok(run('CANAAN_PROF.spots().filter(s=>s.kind==="sea").every(s=>s.table.some(([k])=>k==="thon"))'));
 // Pêcher : loin d'un banc, rien ; sur la rive, la ligne part, ça mord, E ferre.
 run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');assert.equal(run('CANAAN_PROF.fish(game.hero)'),false);
 const toSpot=k=>run(`{const s=CANAAN_PROF.spots().filter(s=>s.kind==="${k}")[0];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){P.x=x;P.y=y;break}}}`);
 toSpot('sea');
 assert.ok(run('CANAAN_PROF.spotNear(P.x,P.y)')>=0);
 const catchOne=()=>{run('CANAAN_PROF.fish(game.hero)');run('game.hero.fishing.bite=time');run('time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing.state'),'bite');return run('CANAAN_PROF.fish(game.hero)')};
 for(let i=0;i<12;i++)assert.equal(catchOne(),true);
 // Niveau 1 : seulement des poissons Commun (gris), et de l'expérience gagnée.
 assert.ok(run('Object.keys(game.hero.prof.fish).every(k=>k.endsWith(":0")&&/^(saumon|thon|espadon|merou|raie):/.test(k))'),run('JSON.stringify(game.hero.prof.fish)'));
 assert.ok(run('game.hero.prof.fishing.level')>=2,'niveau gagné');
 // Le poisson s'échappe si on ne ferre pas à temps ; bouger remonte la ligne.
 run('CANAAN_PROF.fish(game.hero);game.hero.fishing.bite=time');for(let i=0;i<80;i++)run('time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing'),null);
 run('CANAAN_PROF.fish(game.hero);P.x+=40;time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing'),null);
 // Niveau 20 : qualités jusqu'à Épique, jamais au-delà.
 run('P.x-=40;game.hero.prof.fishing.level=20;game.hero.prof.fish={}');
 for(let i=0;i<60;i++)catchOne();
 const qs=JSON.parse(run('JSON.stringify([...new Set(Object.keys(game.hero.prof.fish).map(k=>+k.split(":")[1]))].sort())'));
 assert.ok(qs.every(q=>q<=3)&&qs.includes(3),JSON.stringify(qs));
 // Cuisine : il faut une cuisinière (La Marmite dorée) ; la qualité du repas est plafonnée par le niveau de cuisine.
 run('game.hero.prof.fish={"gardon:4":3,"truite:2":2,"carpe:0":1,"saumon:3":1,"thon:1":1}');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),false,'loin du feu');
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+1.5)*TS');assert.equal(run('CANAAN_PROF.nearFire(P.x,P.y)'),false,'le feu de camp ne sert plus à cuisiner');
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS');assert.equal(run('CANAAN_PROF.nearFire(P.x,P.y)'),true,'devant la cuisinière de La Marmite dorée');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),true);
 assert.equal(run('game.hero.prof.meals["soupe:0"]'),1,'cuisine niveau 1 : repas Commun');
 run('game.hero.prof.cooking.level=20');assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,20)'),true);
 assert.equal(run('game.hero.prof.meals["soupe:3"]'),2,'niveau 20 : jusqu’à Épique');assert.equal(run('game.hero.prof.fish["gardon:4"]'),undefined);
 for(const [r,q] of [['grillade',2],['mijote',0],['fume',3],['ragout',1]])assert.equal(run(`CANAAN_PROF.cook(game.hero,"${r}",${q},1)`),true,r);
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),false,'plus de gardon');
 // Repas : PV et mana tout de suite (délai partagé), soins sur la durée, bonus de dégâts et de protection.
 run('P.mhp=1000;P.hp=100;P.mmp=500;P.mp=0');
 assert.equal(run('CANAAN_PROF.eat(game.hero,"soupe",3)'),true);assert.equal(run('P.hp'),100+Math.round((100+30)*2.3));
 assert.equal(run('CANAAN_PROF.eat(game.hero,"grillade",2)'),false,'délai des repas rapides');
 run('time+=20*60');assert.equal(run('CANAAN_PROF.eat(game.hero,"grillade",2)'),true);assert.equal(run('P.mp'),Math.round((100+25)*1.75));
 run('P.hp=100');assert.equal(run('CANAAN_PROF.eat(game.hero,"mijote",0)'),true);
 for(let i=0;i<6*60;i++)run('time++;CanaanStages.professions.after()');
 assert.equal(run('P.hp'),100+5*Math.round(20+6),'cinq secondes de soins');
 assert.equal(run('CANAAN_PROF.eat(game.hero,"fume",3)'),true);assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1.12);
 assert.equal(run('CANAAN_PROF.eat(game.hero,"ragout",1)'),true,'un nouveau bonus remplace l’ancien');
 assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1);assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),0.93);
 for(let i=0;i<61*60;i++)run('time++;CanaanStages.professions.after()');assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),1,'bonus terminé');
 // Sauvegarde : niveaux, bourriche et garde-manger gardés et vérifiés.
 assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.prof;
 assert.ok(saved.fishing.level>=20);assert.ok(saved.cooking.level>=15);assert.ok(saved.fish['truite:2']>=1||saved.meals['grillade:2']===undefined);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({fishing:{level:99,exp:-5},cooking:{level:"x"},fish:{"requin:3":2,"thon:9":1,"thon:2":3.7,"__proto__:1":1},meals:{"soupe:1":2}}))')),
  {fishing:{level:40,exp:0},cooking:{level:1,exp:0},hunting:{level:1,exp:0},mining:{level:1,exp:0},herbalism:{level:1,exp:0},enchanting:{level:1,exp:0},fish:{'thon:2':3},meat:{},meals:{'soupe:1':2},ore:{},herb:{},ench:{},treasure:{},dust:{},finds:{},shovel:0,codex:{},qv:2});
 // Ancienne sauvegarde à huit qualités : Héroïque devient Épique, Céleste devient Mythique (une seule fois).
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({fish:{"thon:4":1,"carpe:7":2}}).fish)')),{'thon:3':1,'carpe:5':2});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({qv:2,fish:{"thon:4":1}}).fish)')),{'thon:4':1});
 // Fenêtre P : trois onglets.
 run('toggleProfessions()');const html=()=>g.document.getElementById('window').innerHTML;
 assert.match(html(),/Tes poissons sont des objets de ton sac/);assert.doesNotMatch(html(),/Bourriche/);run('CANAAN_PROF.actions.tab("cuisine")');assert.match(html(),/Soupe de gardon/);run('CANAAN_PROF.actions.tab("repas")');assert.match(html(),/Manger|garde-manger/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Chasse et collections : gibier abattu à l’arme, viande et qualités, carnet de chasse et collection des poissons',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];P.dead=false;P.mhp=P.hp=1e6;game.view={notify:()=>{},chat:()=>{}};CANAAN_LIFE.update()');
 // Gibier : lièvres, cerfs, moutons, grenouilles et bêtes astrales ; les autres animaux ne se chassent pas.
 assert.equal(run('CANAAN_PROF.huntable("lapin",false)&&CANAAN_PROF.huntable("cerf",true)&&CANAAN_PROF.huntable("grenouille",false)'),true);
 assert.equal(run('CANAAN_PROF.huntable("heron",false)||CANAAN_PROF.huntable("chameau",false)||CANAAN_PROF.huntable("poule",false)'),false);
 // Une attaque à l'épée sur un lièvre tout proche : il tombe, la viande arrive, le carnet le note.
 run('{const a=CANAAN_LIFE.animals().find(x=>x.kind==="lapin"&&!x.opts.glow);globalThis.__a=a;P.x=a.x-60;P.y=a.y-10;camX=P.x-W/2;camY=P.y-H/2;mouseWorldX=a.x;mouseWorldY=a.y-10;P.atk=0;CANAAN_LIFE.huntCheck();P.atk=0.28;globalThis.__hit=CANAAN_LIFE.huntCheck()}');
 assert.equal(run('__hit===__a'),true);assert.ok(run('__a.dead>0'));
 assert.equal(run('Object.keys(game.hero.prof.meat).join()'),'lievre:0','niveau 1 : viande Commun');
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.prof.codex.lapin)')),{n:1,best:0});
 assert.ok(run('game.hero.prof.hunting.exp')>0);
 // Un animal mort n'est plus touché ; il revient une minute plus tard.
 run('P.atk=0;CANAAN_LIFE.huntCheck();P.atk=0.28');assert.equal(run('CANAAN_LIFE.huntCheck()===__a'),false);
 for(let i=0;i<3700;i+=5)run('time+=5;CANAAN_LIFE.update()');assert.equal(run('__a.dead'),0);
 // L'hôte vérifie : délai entre deux prises, biome du gibier, pas en instance.
 run('game.hero.huntCd=0');const zoneHunt=run('CANAAN_PROF.hunt(game.hero,"grenouille")');assert.equal(zoneHunt,false,'pas de grenouille hors du marais');
 assert.equal(run('CANAAN_PROF.hunt(game.hero,"dragon")'),false);
 run('game.hero.huntCd=0;game.hero.prof.hunting.level=25');
 for(let i=0;i<40;i++)run('time+=41;CANAAN_PROF.hunt(game.hero,"lapin")');
 const qs=JSON.parse(run('JSON.stringify([...new Set(Object.keys(game.hero.prof.meat).map(k=>+k.split(":")[1]))])'));assert.ok(qs.every(q=>q<=3)&&qs.includes(3),JSON.stringify(qs));
 // Recettes de gibier : la viande se cuisine près d'une cuisinière.
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS;game.hero.prof.cooking.level=40;game.hero.prof.meat={"venaison:3":1,"lievre:2":1}');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"roti",3,1)&&CANAAN_PROF.cook(game.hero,"civet",2,1)'),true);
 run('P.mhp=1000;P.hp=100;P.mmp=500;P.mp=0');assert.equal(run('CANAAN_PROF.eat(game.hero,"civet",2)'),true);
 assert.equal(run('P.hp'),100+Math.round((60+20)*1.75));assert.equal(run('P.mp'),Math.round((60+15)*1.75));
 assert.equal(run('CANAAN_PROF.eat(game.hero,"roti",3)'),true);assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1.07);assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),0.93);
 // Collection des poissons : une prise découvre l'espèce.
 run('{const s=CANAAN_PROF.spots().find(s=>s.kind==="sea");for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){P.x=x;P.y=y;break}}}');
 run('CANAAN_PROF.fish(game.hero);game.hero.fishing.bite=time;time++;CanaanStages.professions.after();CANAAN_PROF.fish(game.hero)');
 assert.equal(run('["saumon","thon","espadon","merou","raie"].filter(k=>game.hero.prof.codex[k]).length'),1);
 // Fenêtre : collection (découverts et silhouettes), bio d'une espèce, carnet de chasse.
 run('toggleProfessions()');const html=()=>g.document.getElementById('window').innerHTML;
 assert.match(html(),/Collection · 1 \/ 18 espèces découvertes/);assert.match(html(),/\?\?\?/);
 const fishId=run('["saumon","thon","espadon","merou","raie"].find(k=>game.hero.prof.codex[k])');
 run('CANAAN_PROF.actions.codex("'+fishId+'")');assert.match(html(),new RegExp(run('CANAAN_PROF.FISH["'+fishId+'"].bio').slice(0,30).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 run('CANAAN_PROF.actions.tab("chasse")');assert.match(html(),/Collection · 1 \/ 13 espèces découvertes/);assert.match(html(),/Ta viande est un objet de ton sac/);assert.doesNotMatch(html(),/Gibecière/);
 // Sauvegarde : carnet, viandes et niveau de chasse gardés.
 assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.prof;
 assert.ok(saved.codex.lapin.n>=40&&saved.hunting.level>=25&&saved.codex[fishId].n===1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Métiers en ligne : l’invitée pêche, cuisine et mange chez l’hôte, et voit sa ligne et ses prises',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'cook',recipe:'soupe',quality:2,count:3}),{op:'cook',recipe:'soupe',quality:2,count:3});
 for(const bad of [{op:'cook',recipe:'soupe',quality:8,count:1},{op:'cook',recipe:'<b>',quality:1,count:1},{op:'eat',recipe:'soupe'},{op:'cook',recipe:'soupe',quality:1,count:99}])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async k=>{for(let i=0;i<k;i++){host.run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  // L'invitée se tient au bord d'un lac (côté hôte et chez elle), puis lance sa ligne avec E.
  host.run(`{const s=CANAAN_PROF.spots().find(s=>s.kind==="lake");for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){globalThis.__shore=[x,y];break}}const h=${G};h.player.x=__shore[0];h.player.y=__shore[1];h.player.mhp=h.player.hp=1e6;}`);
  const shore=JSON.parse(host.run('JSON.stringify(__shore)'));
  guest.run('P.x='+shore[0]+';P.y='+shore[1]);
  assert.equal(guest.run('CANAAN_PROF.interact()'),true);await step(6);
  assert.equal(host.run('!!'+G+'.fishing'),true,'la ligne de l’invitée est lancée chez l’hôte');
  assert.equal(guest.run('!!CANAAN_PROF.liveOf&&true'),true);
  host.run(G+'.fishing.bite=time');await step(6);
  assert.equal(host.run(G+'.fishing.state'),'bite');
  guest.run('CANAAN_PROF.interact()');await step(8);
  assert.equal(host.run(G+'.fishing'),null);
  assert.equal(guest.run('Object.values(game.hero.prof.fish).reduce((a,b)=>a+b,0)'),1,'la prise arrive dans la bourriche de l’invitée');
  // Cuisine près d'une cuisinière, puis repas : tout se décide chez l'hôte.
  host.run(`${G}.prof.fish={"gardon:0":2};${G}.netBag=null;${G}.player.x=(CANAAN_ROOMS[2].x+4.5)*TS;${G}.player.y=(CANAAN_ROOMS[2].y+3.6)*TS;${G}.player.hp=10;${G}.player.mhp=1000`);
  await step(4);guest.run('CANAAN_PROF.actions.cook("soupe",0,2)');await step(8);
  // Préparer deux repas prend 6,5 s : l'invitée voit son travail en cours, puis les repas arrivent.
  assert.equal(guest.run('CANAAN_PROF.myLive().work?.kind'),'cook','l’invitée cuisine (animation et barre)');
  await step(6.5*60);
  assert.equal(guest.run('game.hero.prof.meals["soupe:0"]'),2);
  host.run(G+'.player.hp=10');guest.run('CANAAN_PROF.actions.eat("soupe",0)');await step(8);
  {const hp=host.run(G+'.player.hp');assert.ok(hp>=140&&hp<160,String(hp));}
  assert.equal(guest.run('game.hero.prof.meals["soupe:0"]'),1);
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Minage, cueillette et enchanteur : filons et herbes dans chaque biome, enchantement en troisième secondaire ; nouveaux poissons et gibier',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'gather',node:12}),{op:'gather',node:12});
 assert.deepEqual(n.sanitizeAction({op:'enchant-craft',stat:'crit',tier:2,count:3}),{op:'enchant-craft',stat:'crit',tier:2,count:3});assert.equal(n.sanitizeAction({op:'enchant-craft',stat:'crit',tier:9,count:1}),null);
 assert.deepEqual(n.sanitizeAction({op:'enchant-apply',token:'ench:crit:2*1',ref:'helm'}),{op:'enchant-apply',token:'ench:crit:2*1',ref:'helm'});
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];BAG_LIMIT=40;game.hero.bagLimit=40');
 // Un minerai et une herbe par biome, partout sur l'île, jamais sur une route, au camp ou dans un bâtiment.
 const zones=JSON.parse(run('JSON.stringify([...new Set(CANAAN_GATHER.nodes().map(n=>n.kind+":"+n.id+":"+n.zone))].sort())'));
 for(let z=0;z<6;z++){assert.ok(zones.some(k=>k.startsWith('ore:')&&k.endsWith(':'+z)),'minerai du biome '+z);assert.ok(zones.some(k=>k.startsWith('herb:')&&k.endsWith(':'+z)),'herbe du biome '+z)}
 assert.ok(run('CANAAN_GATHER.nodes().filter(n=>!n.layer).every(n=>tileAt(n.tx,n.ty)!==2&&!isSafe(n.tx,n.ty)&&!canaanRoomAt(n.tx,n.ty)&&canWalk(n.x,n.y))'));
 // Récolter : le minerai va dans le sac, le filon s'épuise 90 s pour ce héros.
 run('globalThis.ni=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="ore");const nd=CANAAN_GATHER.nodes()[ni];P.x=nd.x;P.y=nd.y+20');
 assert.equal(run('CANAAN_GATHER.gather(game.hero,ni)'),true);assert.equal(run('CANAAN_GATHER.gather(game.hero,ni)'),false);
 assert.ok(run('CANAAN_BAG.tiles(game.hero).some(p=>p.kind==="ore")'));assert.ok(run('game.hero.prof.mining.exp')>0);
 run('time+=90*60+1');assert.equal(run('CANAAN_GATHER.depleted(game.hero).length'),0,'le filon s’est reformé');
 // Enchanteur : 3 minerais d'un métal (+ de la poudre dès l'étain) → un enchantement ; rang verrouillé par le niveau.
 run('game.hero.prof.ore={"fer:1":7};game.hero.prof.enchanting.level=12;game.hero.prof.dust={"poussiere:0":3}');
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,5)'),false,'loin de la forge');
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y+30}');
 // Fer : 2 poussières par enchantement ; avec 3, un seul se forge, le minerai du second reste.
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,5)'),true);assert.equal(run('game.hero.prof.ench["haste:2"]'),1);assert.equal(run('game.hero.prof.ore["fer:1"]'),4);
 assert.equal(run('game.hero.prof.dust["poussiere:0"]'),1);assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,1)'),false,'plus assez de poussière');
 run('game.hero.prof.dust["poussiere:0"]=3');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,5)'),true);assert.equal(run('game.hero.prof.ench["haste:2"]'),2);assert.equal(run('game.hero.prof.ore["fer:1"]'),1);
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",4,1)'),false,'pas de pépites d’or');
 // Niveaux requis : cuivre 1, étain 6, fer 12, argent 20, or 28, mithril 35.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_GATHER.ENCH_LEVEL)')),[1,6,12,20,28,35]);
 run('game.hero.prof.ore["mithril:0"]=3;game.hero.prof.enchanting.level=34');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",5,1)'),false,'mithril : niveau 35');
 run('game.hero.prof.enchanting.level=35');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",5,1)'),false,'mithril : un éclat');
 run('game.hero.prof.dust["eclat:0"]=1');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",5,1)'),true);assert.equal(run('game.hero.prof.dust["eclat:0"]'),undefined);
 run('game.hero.prof.enchanting.level=1;CANAAN_PROF.open("enchant")');assert.match(run('document.getElementById("window").innerHTML'),/Fer <small>[^<]*<\/small><\/h4><p>[^<]*<b class="ko">tu en as 1<\/b><\/p><p>2 × [^<]*Poussière d’enchantement · <b class="ko">tu en as 1<\/b><\/p><div class="prof-actions"><button[^>]*disabled>🔒 Enchanteur niv\. 12</);
 run('closePanels();game.hero.prof.enchanting.level=12');
 // Poser : l'objet porté gagne une troisième secondaire, comptée dans les statistiques du héros.
 run('let it;do{giveGear(30,"normal","Rare");it=game.hero.inventory.at(-1)}while(it.slot==="artifact");globalThis.slot=it.slot;equipItem(it.id)');
 const before=run('characterStats().secondary.haste');
 assert.equal(run('CANAAN_GATHER.apply(game.hero,"ench:haste:2*1",slot)'),true);
 const ench=JSON.parse(run('JSON.stringify(game.hero.equipment[slot].ench)'));assert.equal(ench.stat,'haste');assert.equal(ench.value,run('CANAAN_GATHER.value(game.hero.equipment[slot],2,game.hero)'));assert.ok(ench.value>run('CANAAN_GATHER.value(game.hero.equipment[slot],2)'),'bonus du niveau d’enchanteur');
 assert.equal(run('Object.keys(itemStats(game.hero.equipment[slot]).secondary).length>=2&&itemStats(game.hero.equipment[slot]).enchant.stat==="haste"'),true);
 assert.equal(run('characterStats().secondary.haste'),before+ench.value);
 assert.match(run('CANAAN_STATS_VIEW.tooltip(game.hero.equipment[slot])'),/enchantement/);
 // Enchantement invalide retiré au chargement.
 assert.equal(run('JSON.stringify(CANAAN_GATHER.cleanItem({slot:"helm",ench:{stat:"or",value:5,tier:1}}).ench)'),undefined);
 // Nouveaux poissons, gibier et infusions, avec leurs recettes.
 assert.ok(['perche','brochet','anguille','merou','raie'].every(f=>run('!!CANAAN_PROF.FISH["'+f+'"]&&!!CANAAN_PROF.RECIPES[CANAAN_PROF.FISH["'+f+'"].recipe]')));
 assert.ok(['faisan','canard','chevre','lezard'].every(k=>run('!!CANAAN_PROF.GAME["'+k+'"]&&CANAAN_PROF.huntable("'+k+'",false)')));
 assert.ok(run('Object.keys(CANAAN_GATHER.HERBS).every(h=>Object.values(CANAAN_PROF.RECIPES).some(r=>r.fish===h))'),'chaque herbe a son infusion');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Travaux minutés : miner et cueillir 5 s, forger 10 s à la forge du camp, cuisiner à la cuisinière ; bouger interrompt',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];BAG_LIMIT=40;game.hero.bagLimit=40;game.world.monsters=[]');
 assert.ok(run('!!CANAAN_CAMP_LIFE.forge()'),'une forge au camp');assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit().missing)')),[]);
 // Miner : rien avant 5 s, le minerai à la fin ; l'animation est visible (outil, avancement).
 run('globalThis.ni=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="ore");{const nd=CANAAN_GATHER.nodes()[ni];P.x=nd.x;P.y=nd.y+20}');
 assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"gather",node:ni})'),true);assert.equal(run('CANAAN_GATHER.workOf(game.hero).kind'),'mine');
 for(let i=0;i<4.8*60;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_BAG.tiles(game.hero).length'),0,'pas avant 5 s');
 assert.ok(run('CANAAN_GATHER.workView(game.hero).p')>0.9);
 for(let i=0;i<20;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="ore").length'),1);assert.equal(run('CANAAN_GATHER.workView(game.hero)'),null);
 // Cueillir puis bouger : interrompu, rien de récolté.
 run('globalThis.hi=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="herb");{const nd=CANAAN_GATHER.nodes()[hi];P.x=nd.x;P.y=nd.y+20}');
 assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"gather",node:hi})'),true);for(let i=0;i<60;i++)run('time++;simulateStep()');
 run('P.x+=40');for(let i=0;i<300;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_GATHER.workView(game.hero)'),null);assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="herb").length'),0);
 // Forger : seulement à la forge, 10 s pour un enchantement.
 run('game.hero.prof.ore={"cuivre:0":3}');assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"enchant-craft",stat:"power",tier:0,count:1})'),false);
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y+30}');assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"enchant-craft",stat:"power",tier:0,count:1})'),true);
 assert.equal(run('(game.hero.work.until-game.hero.work.start)/60'),10);
 for(let i=0;i<9.9*60;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.ench["power:0"]'),undefined);
 for(let i=0;i<10;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.ench["power:0"]'),1);
 // Cuisiner : à la cuisinière, le temps de préparer.
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS;game.hero.prof.fish={"gardon:0":1}');
 assert.equal(run('CANAAN_PROF.handle(game.hero,{op:"cook",recipe:"soupe",quality:0,count:1})'),true);assert.equal(run('CANAAN_GATHER.workOf(game.hero).kind'),'cook');
 for(let i=0;i<6*60+2;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.meals["soupe:0"]'),1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Succès et bestiaire : cent succès adaptés, exploits comptés par l’hôte, récompenses une fois, titres, collections, sauvegarde et réseau',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'ach-title',id:'c3'}),{op:'ach-title',id:'c3'});assert.equal(n.sanitizeAction({op:'ach-title',id:'<b>'}),null);
 const {g,run,errors,fire,click}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Cent succès, vingt par catégorie, identifiants uniques, chacun avec sa récompense ; touche Y et bouton du menu.
 const list=JSON.parse(run('JSON.stringify(CANAAN_ACHIEVEMENTS.LIST.map(a=>({id:a.id,cat:a.cat,r:CANAAN_ACHIEVEMENTS.rewardText(a.reward)})))'));
 assert.equal(list.length,100);assert.equal(new Set(list.map(a=>a.id)).size,100);assert.ok(list.every(a=>a.r));
 for(const c of ['combat','explore','eco','magic','defi'])assert.equal(list.filter(a=>a.cat===c).length,20,c);
 assert.match(source,/data-action="toggleAchievements"[^>]*>.*?menu-shortcut">Y</);
 // La touche Y ouvre le carnet, une seconde pression le ferme ; le bouton du menu fait de même.
 const carnet=()=>run('modalOpen()&&document.getElementById("window").innerHTML.includes("ach-panel")');
 run('started=true;paused=false;closePanels()');
 fire(g,'keydown',{key:'y'});assert.equal(carnet(),true,'Y ouvre le carnet');
 fire(g,'keydown',{key:'Y'});assert.equal(run('modalOpen()'),false,'Y referme le carnet');
 click('toggleAchievements');assert.equal(carnet(),true,'le bouton ouvre le carnet');run('closePanels()');
 // Bestiaire : monstres du monde, créatures des instances, boss mondiaux, boss d'instance et de l'Arène.
 // (Créatures et boss des extensions présentes en plus : la Vallée des Héros dans un build de test.)
 const extra=JSON.parse(run('JSON.stringify(canaanExtensionIds().map(canaanExtension).reduce((s,e)=>[s[0]+(e.mobs||[]).length,s[1]+(e.worldBosses||[]).length],[0,0]))'));
 assert.equal(run('JSON.stringify(["mob","under","dungeon","world","boss","arena"].map(k=>CANAAN_ACHIEVEMENTS.catalog().filter(b=>b.group===k).length))'),JSON.stringify([23+extra[0],16,28,12+extra[1],72,12]));
 assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Loup"})'),'m:Loup');assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"x",worldBoss:true,worldBossId:"fenrir"})'),'w:fenrir');
 assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Le Roi Sanglant",boss:true})'),'b:Le Roi Sanglant');assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Clone",arenaClone:true})'),null);
 run('started=true;paused=false;game.hero.level=5;game.hero.kills=0;P.gold=0;game.hero.inventory=[];game.hero.equipment.weapon={id:"w",slot:"weapon",level:5,rarity:"Commun",weaponType:"bow"};toast=()=>{}');
 // Exploits : victoire (espèce, élite, arme), coup (plus gros coup, critiques), roulade, minerai.
 run('canaanAchieve(game.hero,"hit",globalThis.__m={t:"Loup",elite:true,x:P.x,y:P.y},1234,true);canaanAchieve(game.hero,"kill",__m);canaanAchieve(game.hero,"dodge");canaanAchieve(game.hero,"gather","ore","or",2)');
 const st=()=>JSON.parse(run('JSON.stringify(game.hero.succes)'));
 let s=st();assert.deepEqual(s.best['m:Loup'],[1,1,1]);assert.equal(s.s.kills,1);assert.equal(s.s.elites,1);assert.equal(s.s.w_bow,1);
 assert.equal(s.s.maxHit,1234);assert.equal(s.s.crits,1);assert.equal(s.s.dodges,1);assert.equal(s.s.ores,2);assert.equal(s.s.oreOr,1);
 // Déblocage au relevé de l'hôte (chaque seconde) : récompense donnée une seule fois.
 for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');
 s=st();for(const id of ['c1','c8','p8'])assert.ok(s.done[id],id);assert.ok(!s.done.c2);
 assert.ok(run('P.gold')>=50+500+400,String(run('P.gold')));
 // L'or des récompenses compte comme de l'or gagné (Premier pécule) ; ensuite, plus rien ne bouge.
 for(let i=0;i<180;i++)run('CanaanStages.achievements.after()');
 const gold=run('P.gold');for(let i=0;i<180;i++)run('CanaanStages.achievements.after()');assert.equal(run('P.gold'),gold,'pas de double récompense');
 // Ancienne aventure : ses victoires déjà faites comptent (hero.kills).
 run('game.hero.kills=150');for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');assert.ok(st().done.c2);assert.equal(run('CANAAN_BAG.count(game.hero,"meal","soupe",1)'),5);
 // Boss d'instance : la victoire compte pour tout le groupe de l'instance.
 run('globalThis.ally=CANAAN_GROUP.create("Ami");CANAAN_GROUP.join(ally.id);game.world.instance={index:6,group:2};canaanAchieve(game.hero,"kill",{t:"Le Roi Sanglant",boss:true,x:P.x,y:P.y});game.world.instance=null');
 assert.equal(run('ally.succes.best["b:Le Roi Sanglant"][1]'),1);assert.equal(run('game.hero.succes.best["b:Le Roi Sanglant"][1]'),1);
 // Découverte : une créature croisée de près entre au bestiaire.
 run('game.world.monsters=[{t:"Ours",x:P.x+100,y:P.y,hp:10,mhp:10}];CANAAN_ACHIEVEMENTS.sample(game.hero)');assert.deepEqual(st().best['m:Ours'],[1,0,0]);
 // Titres : seulement ceux des succès débloqués ; affiché au-dessus du héros.
 assert.equal(run('CANAAN_ACHIEVEMENTS.setTitle(game.hero,"c3")'),false);
 run('game.hero.kills=1000');for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');
 assert.equal(run('CANAAN_ACHIEVEMENTS.setTitle(game.hero,"c3")'),true);assert.equal(run('CANAAN_ACHIEVEMENTS.titleOf(game.hero)'),'Le Pourfendeur');
 // Sauvegarde : carnet vérifié (succès, espèces et titre inconnus retirés) et rechargé.
 const clean=JSON.parse(run('JSON.stringify(CANAAN_ACHIEVEMENTS.sanitize({done:{c1:5,zz:1},s:{kills:"9",bad:-1,"x y":3},sets:{biomes:[0,0,1],evil:[1]},best:{"m:Loup":[1,"4",2],"m:Dragon":[1,1,1]},title:"c4"}))'));
 assert.deepEqual(clean,{done:{c1:5},s:{kills:9},sets:{biomes:[0,1]},best:{'m:Loup':[1,4,2]},title:''});
 run('saveGame()');const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.succes;
 assert.ok(saved.done.c3);assert.equal(saved.title,'c3');assert.equal(saved.best['m:Ours'][0],1);
 // Réseau : carnet envoyé à l'invité au plus toutes les 3 s, sauf déblocage.
 assert.ok(run('CANAAN_ACHIEVEMENTS.netView(ally)'));assert.equal(run('CANAAN_ACHIEVEMENTS.netView(ally)'),undefined);
 assert.equal(run('CANAAN_ACHIEVEMENTS.handle(ally,{op:"ach-title",id:"c3"})'),false,'pas débloqué par l’allié');
 // Panneau : succès et titres ; le bestiaire (silhouettes « ??? » pour l'inconnu) est dans les Collections (V).
 run('toggleAchievements()');let html=run('document.getElementById("window").innerHTML');assert.match(html,/ach-panel/);assert.match(html,/Le Pourfendeur|Fléau des ténèbres/);
 run('canaanCollections("bestiary")');html=run('document.getElementById("window").innerHTML');assert.match(html,/beast-card killed/);assert.match(html,/\?\?\?/);assert.match(html,/Fenrir|Pas encore croisée/);
 run('closePanels();toggleAchievements();CANAAN_ACHIEVEMENTS.actions.tab("titres")');assert.match(run('document.getElementById("window").innerHTML'),/« Le Pourfendeur »/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Règles partagées des métiers : courbe d’XP, qualités, repas, tirages, collection et sauvegardes vérifiées',async()=>{
 const path=require('node:path'),{pathToFileURL}=require('node:url');
 const shared=f=>import(pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href);
 const D=await shared('data/professions.js'),R=await shared('rules/professions.js');
 assert.ok(Object.isFrozen(D.PROF_FISH.dore)&&Object.isFrozen(D.PROF_FISH_TABLES.sea[0]));
 // Qualités débloquées aux niveaux 1, 6, 12, 20, 28 et 35 ; expérience croissante.
 assert.deepEqual([1,5,6,11,12,20,27,28,35,40].map(R.profQualityCap),[0,0,1,1,2,3,3,4,5,5]);
 for(let l=1;l<D.PROF_MAX_LEVEL;l++)assert.ok(R.profXpNeeded(l+1)>R.profXpNeeded(l));
 // Expérience : niveaux atteints renvoyés, arrêt au niveau 40.
 const s={level:1,exp:0};assert.deepEqual(R.profAddXp(s,R.profXpNeeded(1)+R.profXpNeeded(2)),[2,3]);assert.deepEqual(s,{level:3,exp:0});
 const top={level:39,exp:0};R.profAddXp(top,1e9);assert.deepEqual(top,{level:40,exp:0});assert.deepEqual(R.profAddXp(top,99),[]);
 // Tirages : table pondérée et qualité d'une prise (générateur en paramètre).
 const seq=v=>{let i=0;return ()=>v[i++%v.length]};
 assert.equal(R.profRollWeighted([['a',1],['b',3]],seq([0.1])),'a');assert.equal(R.profRollWeighted([['a',1],['b',3]],seq([0.5])),'b');
 assert.equal(R.profRollWeighted([['a',1]],seq([0.999999])),'a');
 assert.equal(R.profRollQuality(5,seq([0])),5);assert.equal(R.profRollQuality(5,seq([0.9999])),0);
 // Collection : première prise signalée, meilleure qualité gardée.
 const prof=R.profFresh();assert.equal(R.profRecordCatch(prof,'gardon',2),true);assert.equal(R.profRecordCatch(prof,'gardon',1),false);
 assert.deepEqual(prof.codex.gardon,{n:2,best:2});
 // Repas : nombres selon la qualité et le héros (sans héros : 100 PV et 300 mana).
 assert.equal(R.profMealEffect('soupe',0).amount,103);assert.ok(R.profMealEffect('soupe',5,{mhp:1000,mmp:0}).amount>R.profMealEffect('soupe',0,{mhp:1000,mmp:0}).amount);
 assert.match(R.profMealEffect('fume',3).text,/^\+12 % de dégâts pendant 1 min$/);
 // Sauvegardes : niveaux bornés, espèces inconnues et quantités invalides écartées, anciennes qualités converties.
 const clean=R.profSanitize({qv:1,fishing:{level:99,exp:-5},fish:{'gardon:7':3,'inconnu:1':2,'carpe:x':1,'truite:2':0},codex:{gardon:{n:4,best:6},'__proto__':{n:1}}});
 assert.deepEqual(clean.fishing,{level:40,exp:0});assert.deepEqual(clean.fish,{'gardon:5':3});assert.deepEqual(clean.codex,{gardon:{n:4,best:5}});
 assert.deepEqual(R.profSanitize('cassé'),R.profFresh());
});

test('Fouilles : pelle achetée chez le marchand, coup de pelle minuté, trou au sol, or, trésors à vendre et reliques (touche V)',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'dig',x:5}),{op:'dig'});assert.deepEqual(n.sanitizeAction({op:'shovel-buy'}),{op:'shovel-buy'});
 assert.ok(n.STACK_TOKEN.test('treasure:perle:0*3'));
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];BAG_LIMIT=40;game.hero.bagLimit=40;game.world.monsters=[];globalThis.realRandom=Math.random');
 // Dix-huit reliques (trois par biome) et dix trésors, chacun avec son icône dessinée.
 assert.equal(run('Object.keys(CANAAN_DIG.RELICS).length'),18);assert.equal(run('Object.keys(CANAAN_DIG.TREASURES).length'),10);
 assert.ok(run('[0,1,2,3,4,5].every(z=>Object.values(CANAAN_DIG.RELICS).filter(r=>r.zone===z).length===3)'));
 assert.ok(run('[...Object.values(CANAAN_DIG.RELICS),...Object.values(CANAAN_DIG.TREASURES)].every(r=>CANAAN_ICONS.art(r.icon.slice(1,-1)))&&CANAAN_ICONS.art("tool_shovel")'));
 // Sans pelle, E ne creuse pas.
 assert.equal(run('CANAAN_DIG.interact()'),false);assert.equal(run('CANAAN_DIG.start(game.hero)'),false);
 // Acheter : chez un marchand seulement, assez d'or, une seule fois.
 run('P.gold=100000;{const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x+300;P.y=m.y}');assert.equal(run('CANAAN_DIG.buy(game.hero)'),false,'loin du marchand');
 run('{const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+40};P.gold=CANAAN_DIG.PRICE-1');assert.equal(run('CANAAN_DIG.buy(game.hero)'),false,'pas assez d’or');
 run('P.gold=CANAAN_DIG.PRICE+50');assert.equal(run('CANAAN_DIG.buy(game.hero)'),true);assert.equal(run('P.gold'),50);
 assert.equal(run('game.hero.prof.shovel'),1);assert.equal(run('CANAAN_DIG.buy(game.hero)'),false,'déjà une pelle');
 run('CANAAN_SHOP.open(game.world.npcs.find(n=>n.type==="shop"))');assert.match(run('document.getElementById("window").innerHTML'),/Tu as ta pelle/);run('closePanels()');
 // Le sol dur (route) ne se creuse pas.
 assert.equal(run('{let r=null;for(let y=5;y<MAPH-5&&!r;y++)for(let x=5;x<MAPW-5;x++)if(tileAt(x,y)===2&&!BRIDGE_TILES.has(y*MAPW+x)){r=CANAAN_DIG.blocked((x+0.5)*TS,(y+0.5)*TS);break}r}'),'ground');
 // Un endroit libre dans les Plaines, devant le héros.
 const place='{let ok=false;for(let y=8;y<MAPH-8&&!ok;y+=2)for(let x=8;x<MAPW-8;x+=2){P.x=(x+0.5)*TS;P.y=(y+0.5)*TS;const s=CANAAN_DIG.spotOf(game.hero);if(!CANAAN_DIG.blocked(s.x,s.y)&&ZONES.indexOf(regionAt(Math.floor(s.x/TS),Math.floor(s.y/TS)))===0&&canWalk(P.x,P.y)){ok=true;break}}ok}';
 assert.equal(run(place),true);
 // Un trésor (tirage forcé) : rien avant 1,3 s, puis le trou et la pile dans le sac (rubrique Autre).
 run('Math.random=()=>0.1');assert.equal(run('CANAAN_DIG.handle(game.hero,{op:"dig"})'),true);assert.equal(run('CANAAN_GATHER.workOf(game.hero).kind'),'dig');
 for(let i=0;i<70;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_DIG.holes().length'),0,'pas avant la fin');
 for(let i=0;i<12;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_DIG.holes().length'),1,'un trou au sol');
 const pile=JSON.parse(run('JSON.stringify(CANAAN_BAG.tiles(game.hero,"main").find(p=>p.kind==="treasure"))'));assert.ok(pile&&pile.q===0&&pile.n===1,JSON.stringify(pile));
 assert.equal(run('CANAAN_BAG.tiles(game.hero,"main").length'),1,'un trésor prend une case du sac');
 // Même endroit : déjà creusé.
 assert.equal(run('{const s=CANAAN_DIG.spotOf(game.hero);CANAAN_DIG.blocked(s.x,s.y)}'),'hole');assert.equal(run('CANAAN_DIG.start(game.hero)'),false);
 // Une relique des Plaines (tirage forcé), ailleurs ; puis de l'or.
 assert.equal(run(place),true);
 run('Math.random=()=>0.01');run('CANAAN_DIG.start(game.hero)');for(let i=0;i<82;i++)run('time++;simulateStep()');
 const finds=JSON.parse(run('JSON.stringify(game.hero.prof.finds)'));assert.equal(Object.keys(finds).length,1);assert.equal(run('CANAAN_DIG.RELICS['+JSON.stringify(Object.keys(finds)[0])+'].zone'),0);
 assert.equal(run(place),true);run('Math.random=()=>0.45;globalThis.g0=P.gold');run('CANAAN_DIG.start(game.hero)');for(let i=0;i<82;i++)run('time++;simulateStep()');assert.ok(run('P.gold-g0')>0,'quelques pièces');
 run('Math.random=realRandom');
 // Le trou s'efface au bout de 2 min 30.
 run('time+=151*60');assert.equal(run('CANAAN_DIG.holes().length'),0);
 // Vendre un trésor chez le marchand : son prix du catalogue.
 const tok=run('CANAAN_BAG.token(CANAAN_BAG.tiles(game.hero,"main").find(p=>p.kind==="treasure"))');
 run('{const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+40};globalThis.g1=P.gold');assert.equal(run('CANAAN_SHOP.sellStack(game.hero,'+JSON.stringify(tok)+')'),true);
 assert.equal(run('P.gold-g1'),run('CANAAN_DIG.TREASURES['+JSON.stringify(tok.split(':')[1])+'].value'));
 // Onglet Fouilles des Collections (touche V).
 assert.match(run('CANAAN_DIG.tab(game.hero)'),/Reliques trouvées <b>1 \/ 18<\/b>/);
 // Sauvegarde et réseau : pelle, reliques et trésors vérifiés.
 assert.deepEqual(JSON.parse(run('JSON.stringify((({shovel,finds,treasure})=>({shovel,finds,treasure}))(CANAAN_PROF.sanitize({shovel:true,finds:{toupie:1,inconnue:3,oeuf:"x"},treasure:{"perle:0":2,"perle:3":1,"faux:0":4}})))')),{shovel:1,finds:{toupie:1},treasure:{'perle:0':3}});
 // Les trous partent chez les invités.
 assert.equal(run(place),true);run('Math.random=()=>0.9');run('CANAAN_DIG.start(game.hero)');for(let i=0;i<82;i++)run('time++;simulateStep()');run('Math.random=realRandom');
 const view=JSON.parse(run('JSON.stringify(CANAAN_DIG.netView())'));assert.equal(view.length,1);assert.equal(run('CANAAN_DIG.netView()'),undefined,'seulement quand ça change');
 run('CANAAN_DIG.applyRemote('+JSON.stringify(view)+')');assert.equal(run('CANAAN_DIG.holes().length'),1);
 assert.equal(errors.length,0,errors.join('\n'));
});
