const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Jalon de la phase 5 : l’invité combat chez l’hôte et voit tout de lui-même (sac, équipement, recharges, effets, butin, roulade)',async()=>{
 const {createRelay}=require('../online/relay.cjs');
 // Le test avance le temps bien plus vite que le jeu : limite de fréquence relevée pour ce relais.
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  // Succès coupés : leurs récompenses en or fausseraient les comptes de l’invité (ils sont testés à part).
  host.run('CanaanStages.achievements={after(){}}');
  host.run('{let s=null;for(let y=60;y<340&&!s;y++)for(let x=60;x<340;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-8;a<=8&&ok;a++)for(let b=-4;b<=8&&ok;b++)ok=canWalk((x+a+.5)*TS,(y+b+.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}P.x=(s.x+.5)*TS;P.y=(s.y+.5)*TS}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  // L'hôte et ses monstres ne bougent que si on le demande ; pas de régénération pour mesurer le mana.
  host.run('canaanRegenRates=()=>({mana:0,health:0})');
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(20);
  // Sac et équipement : l'invité voit son propre héros, tel que l'hôte le garde.
  assert.equal(guest.run('game.hero.equipment.weapon.name'),'Épée de recrue');
  assert.equal(guest.run('updateCapacity(),BAG_LIMIT'),20,'capacité du sac donnée par l’hôte : 20 places au départ, comme l’hôte');assert.equal(guest.run('game.hero.name'),'Lina');
  assert.ok(guest.run('CANAAN_NET.debug.speed')>0,'vitesse donnée par l’hôte');
  // Prédiction : l'invité avance dès le premier pas, sans attendre l'hôte ; ensuite les deux positions coïncident.
  const y0=guest.run('P.y');guest.run('keys.s=true;time++;readInput();CANAAN_NET.tick()');
  assert.ok(guest.run('P.y')>y0+1,'mouvement prédit tout de suite');
  await step(90);guest.run('keys.s=false');await step(40);
  assert.ok(guest.run('P.y')>y0+150,'l’invité a bien avancé');
  assert.ok(Math.abs(guest.run('P.y')-host.run(G+'.player.y'))<3,'position prédite = position de l’hôte : '+guest.run('P.y')+' / '+host.run(G+'.player.y'));
  assert.ok(Math.abs(guest.run('P.x')-host.run(G+'.player.x'))<3);
  // Un objet obtenu chez l'hôte arrive dans le sac de l'invité ; l'invité l'équipe, l'hôte vérifie et exécute.
  host.run(G+'.inventory.push({id:"lance-lina",name:"Lance d’essai",slot:"weapon",level:1,rarity:"Épique",weaponType:"spear"})');
  await step(8);
  assert.equal(guest.run('game.hero.inventory.some(i=>i.id==="lance-lina")'),true,'objet visible dans le sac de l’invité');
  const weapon0=guest.run('game.hero.equipment.weapon.id');guest.run('equipItem("lance-lina")');
  assert.equal(guest.run('game.hero.equipment.weapon.id'),weapon0,'rien ne change chez l’invité avant la réponse de l’hôte');
  await step(10);
  assert.equal(host.run(G+'.equipment.weapon.id'),'lance-lina','l’hôte a équipé la lance');
  assert.equal(guest.run('game.hero.equipment.weapon.id'),'lance-lina','l’invité voit sa lance équipée');
  assert.equal(guest.run('game.hero.inventory.some(i=>i.id==="lance-lina")'),false);
  // Un objet que l'invité n'a pas ne peut pas être équipé (demande trafiquée).
  guest.run('CANAAN_NET.requestAction({op:"equip",id:"objet-inexistant"})');guest.run('CANAAN_NET.requestAction({op:"unequip",slot:"__proto__"})');await step(6);
  assert.equal(host.run(G+'.equipment.weapon.id'),'lance-lina');
  // Combat partagé : un monstre de l'hôte, frappé par l'invité ; chiffres et éclats chez l'invité, butin et victime pour lui.
  // Ce jalon vérifie le réseau : la règle « chaque héros à son niveau » (testée à part) est neutralisée. Une élite
  // lâche toujours un objet (un monstre ordinaire, 38 % du temps).
   host.run('globalThis.mob={t:"Loup",x:'+G+'.player.x+70,y:'+G+'.player.y,hp:40,mhp:40,r:14,cd:1e9,g:9,level:1,elite:true,_levelHp:true};game.world.monsters.push(mob)');
  await step(8);
  assert.equal(guest.run('game.world.monsters.some(m=>m.k==='+host.run('mob.netId')+'&&m.t==="Loup")'),true);
  assert.equal(guest.run('game.world.monsters.length'),host.run('game.world.monsters.length'),'l’invité voit les monstres de l’hôte : '+host.run('JSON.stringify(game.world.monsters.map(m=>[m.t,m.hp]))'));
  const floaters0=guest.run('floaters.length'),kills0=host.run(G+'.kills');
  guest.run('mouseWorldX=P.x+70;mouseWorldY=P.y');
  for(let i=0;i<40&&host.run('mob.hp>0');i++){guest.run('CANAAN_NET.requestAttack(false)');await step(3)}
  assert.equal(host.run('mob.hp<=0'),true,'l’invité abat le monstre chez l’hôte');
  await step(10);
  assert.equal(host.run(G+'.kills'),kills0+1,'victime créditée à l’invité');assert.equal(guest.run('game.hero.kills'),kills0+1);
  assert.equal(guest.run('game.world.monsters.some(m=>m.k==='+host.run('mob.netId')+')'),false,'le monstre disparaît chez l’invité');
  assert.ok(guest.run('floaters.length')>floaters0,'chiffres de dégâts affichés chez l’invité');
  // Butin individuel annoncé sur l'écran de l'invité, rangé dans son sac (chez l'hôte, puis chez lui).
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("🎁"))'),'objet obtenu annoncé à l’invité');
  assert.equal(guest.run('game.hero.inventory.length'),host.run(G+'.inventory.length'));
  assert.equal(host.run('game.hero.inventory.some(i=>i.id==='+JSON.stringify(host.run(G+'.inventory.at(-1).id'))+')'),false,'rien dans le sac de l’hôte');
  // Compétence : mana dépensé chez l'hôte, recharge affichée sur la barre de l'invité, effet visuel rejoué.
  host.run(G+'.player.mp='+G+'.player.mmp');const mp0=host.run(G+'.player.mp');
  guest.run('useSkill(0)');await step(10);
  assert.ok(host.run(G+'.player.mp')<mp0,'mana de l’invité dépensé chez l’hôte');
  assert.ok(guest.run('SKILLS[0].cd')>0,'recharge visible chez l’invité');
  // Roulade : prédite chez l’invité, exécutée chez l’hôte avec sa recharge ; invulnérable pendant le roulé.
  const x0=guest.run('P.x');guest.run('canaanDodge(1,0)');
  await step(1);assert.ok(guest.run('P.x')>x0+5,'roulade prédite');
  // L'hôte applique la roulade dès que le message arrive par le relais : on attend la livraison sans faire avancer le
  // jeu (la roulade dure un nombre de ticks, pas de millisecondes).
  for(let i=0;i<1000&&!host.run('CANAAN_COMBAT.invulnerable('+G+')');i++)await wait(2);
  assert.equal(host.run('CANAAN_COMBAT.invulnerable('+G+')'),true,'l’hôte fait rouler l’invité');
  assert.equal(host.run('hurtAlly('+G+',{t:"Loup",x:0,y:0,hp:9,mhp:9,dmg:50})'),0,'aucun dégât pendant la roulade');
  await step(30);
  assert.ok(host.run('CANAAN_COMBAT.dodgeState('+G+').ready')>2,'recharge de la roulade chez l’hôte');
  assert.ok(Math.abs(guest.run('P.x')-host.run(G+'.player.x'))<4,'même arrivée après la roulade');
  // À terre puis relevé près de l’hôte ; les messages s’affichent sur l’écran de l’invité.
  host.run(G+'.player.hp=1;'+G+'.player.dead=true;'+G+'.reviveAt=time+20;game.view.remote('+G+',"💀 Tu es à terre…")');
  await step(8);assert.equal(guest.run('P.dead'),true);
  await step(30);assert.equal(guest.run('P.dead'),false,'relevé');
  assert.ok(guest.run('__toasts.some(t=>t.includes("Tu es à terre"))'),'message à terre sur l’écran de l’invité');
  assert.ok(guest.run('__toasts.some(t=>t.includes("se relève"))'));
  // Ce que l'hôte ne sait pas encore faire pour un invité est refusé chez lui (aucune copie locale modifiée).
  assert.equal(guest.run('CANAAN_GUEST_BLOCKED.has("enterInstance")&&CANAAN_GUEST_BLOCKED.has("enterArena")'),true);
  assert.equal(guest.run('CANAAN_GUEST_BLOCKED.has("equipTalent")||CANAAN_GUEST_BLOCKED.has("chooseClass")||CANAAN_GUEST_BLOCKED.has("toggleArtefact")'),false,'classe, talents et artéfacts : demandés à l’hôte');
  assert.equal(guest.run('sellInventoryCell(0,"x")'),false);
  // Classe, talents et artéfacts de l'invité : il les gère depuis son écran, l'hôte vérifie, les applique à son héros et
  // les renvoie.
  host.run(G+'.level=20;'+G+'.artefacts.ranks.pierre_colosse=2;time+=600');await step(8);
  assert.equal(guest.run('game.hero.artefacts.ranks.pierre_colosse'),2,'collection de l’invité visible chez lui');
  const speedBefore=guest.run('CANAAN_NET.debug.speed'),hpBefore=host.run(G+'.player.mhp');
  guest.run('chooseClass("assassin")');await step(6);guest.run('equipTalent(1)');guest.run('equipArtefact("pierre_colosse")');
  guest.run('CANAAN_NET.requestAction({op:"talent-equip",talent:12})');guest.run('CANAAN_NET.requestAction({op:"class-choose",cls:"inconnue"})');
  guest.run('CANAAN_NET.requestAction({op:"artefact-equip",artefact:"voile_neant"})');
  await step(10);
  assert.deepEqual(host.run('JSON.stringify('+G+'.classe)'),JSON.stringify({id:'assassin',talents:[1]}),'classe et talent choisis chez l’hôte, rien d’autre');
  assert.equal(host.run(G+'.artefacts.equipped.filter(Boolean).join()'),'pierre_colosse','artéfact possédé équipé, artéfact non possédé refusé');
  assert.deepEqual(guest.run('JSON.stringify(game.hero.classe)'),JSON.stringify({id:'assassin',talents:[1]}),'l’invité voit sa classe');
  assert.ok(guest.run('!!document.getElementById("specialSkill")'),'sort spécial sur la barre de l’invité');
  assert.equal(guest.run('game.hero.artefacts.equipped.includes("pierre_colosse")'),true,'l’invité voit son artéfact');
  const hostSpeed=host.run('Math.round(CANAAN_PLAYER_SPEED*(1+(characterStats('+G+').speed||0)/100)*CANAAN_PROF.speedMult('+G+')*1000)/1000');
  assert.ok(guest.run('CANAAN_NET.debug.speed')>speedBefore,'Assassin : +5 % de vitesse');
  assert.ok(Math.abs(guest.run('CANAAN_NET.debug.speed')-hostSpeed)<1e-6,'même vitesse chez l’hôte et chez lui');
  assert.equal(host.run('characterStats('+G+').critPower'),60,'passif de l’Assassin : +10 % de dégâts critiques');
  assert.ok(host.run(G+'.player.mhp')>hpBefore*1.05,'Pierre du Colosse : PV max de l’invité augmentés chez l’hôte');
  assert.equal(host.run('(game.hero.classe.id?1:0)+game.hero.artefacts.equipped.filter(Boolean).length'),0,'rien ne change pour l’hôte');
  // Sort spécial (F) de l'invité : lancé par l'hôte, vu chez l'invité (Voile d'ombre) avec sa recharge.
  host.run(G+'.player.mp='+G+'.player.mmp');guest.run('canaanUseSpecial()');await step(8);
  assert.equal(host.run(G+'.player.veiled'),true,'voile chez l’hôte');assert.equal(guest.run('P.veiled'),true,'voile vu par l’invité');
  assert.ok(guest.run('CANAAN_CLASS.specialLeft()')>20,'recharge du sort spécial chez l’invité');
  // Quête de l'invité : il l'accepte depuis son écran, l'hôte vérifie qu'il est près de Liora et la lui donne.
  host.run('globalThis.liora=CANAAN_QUESTS.npcs().liora;'+G+'.player.x=liora.x+30;'+G+'.player.y=liora.y');await step(8);
  guest.run('questAccept(1)');await step(8);
  assert.equal(host.run(G+'.quetes.active[1].step'),0,'quête acceptée chez l’hôte');
  assert.equal(guest.run('game.hero.quetes.active[1].step'),0,'et visible dans le journal de l’invité');
  assert.equal(host.run('Object.keys(game.hero.quetes.active).length'),0,'rien pour l’hôte');
  // Marchand de l'invité : près du marchand (vérifié par l'hôte), avec son or.
  host.run('globalThis.shop=game.world.npcs.find(n=>n.type==="shop");'+G+'.player.x=shop.x;'+G+'.player.y=shop.y+60;'+G+'.player.gold=5000');
  host.run(G+'.inventory.push({id:"vieux-casque",name:"Casque rouillé",slot:"helm",ilvl:5,rarity:"Commun"},{id:"bague-rare",name:"Bague rare",slot:"ring",ilvl:40,rarity:"Rare"})');
  host.run('globalThis.gold0='+G+'.player.gold;globalThis.price0=gearSellValue('+G+'.inventory.find(i=>i.id==="bague-rare"))');
  await step(12);
  assert.ok(Math.hypot(guest.run('P.x')-host.run('shop.x'),guest.run('P.y')-host.run('shop.y'))<140,'l’invité est près du marchand');
  assert.equal(guest.run('P.gold'),5000,'son or vient de l’hôte');
  guest.run('sellBagIndex(game.hero.inventory.findIndex(i=>i.id==="bague-rare"))');guest.run('sellAllCommon()');await step(10);
  assert.equal(host.run(G+'.inventory.some(i=>i.id==="bague-rare"||i.id==="vieux-casque")'),false,'objets vendus chez l’hôte');
  assert.ok(host.run(G+'.player.gold')>=host.run('gold0+price0'),'or de la vente pour l’invité');assert.equal(guest.run('P.gold'),host.run(G+'.player.gold'));
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("💰"))'),'vente annoncée à l’invité');
  const bagCount=host.run(G+'.inventory.length'),goldBuy=host.run(G+'.player.gold');
  guest.run('buyGear()');guest.run('buyBagUpgrade()');await step(10);
  assert.equal(host.run(G+'.inventory.length'),bagCount+1,'équipement acheté');assert.equal(host.run(G+'.bagLevel'),1,'sac agrandi');
  assert.ok(host.run(G+'.player.gold')<goldBuy);assert.equal(guest.run('BAG_LIMIT'),30,'30 places chez l’invité');assert.equal(guest.run('CANAAN_BAG_VIEW().level'),1);
  assert.equal(host.run('saveGame()'),true);assert.equal(JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros.invites[id].bagLevel,1,'niveau du sac sauvegardé');
  // Plus de forge : une ancienne demande d'amélioration ou de passif est refusée par l'hôte.
  guest.run('CANAAN_NET.requestAction({op:"upgrade",id:String(game.hero.equipment.weapon.id)});CANAAN_NET.requestAction({op:"passive",id:String(game.hero.equipment.weapon.id),passive:"lifesteal"})');await step(10);
  assert.equal(host.run('Object.hasOwn('+G+'.equipment.weapon,"upgrade")||Object.hasOwn('+G+'.equipment.weapon,"craftPassive")'),false,'aucune amélioration chez l’hôte');
  host.run('game.hero.inventory.push({id:"epee-hote",name:"Épée de l’hôte",slot:"weapon",ilvl:30,rarity:"Rare",weaponType:"sword"})');
  // Loin du marchand, l'hôte refuse la vente ; une demande pour un objet d'un autre héros est ignorée.
  host.run(G+'.player.x=shop.x+3000');await step(12);
  const count0=host.run(G+'.inventory.length');guest.run('CANAAN_NET.requestAction({op:"sell",id:String(game.hero.inventory[0].id)})');
  guest.run('CANAAN_NET.requestAction({op:"upgrade",id:"epee-hote"})');await step(8);
  assert.equal(host.run(G+'.inventory.length'),count0,'pas de vente loin du marchand');
  assert.equal(host.run('Object.hasOwn(game.hero.inventory.find(i=>i.id==="epee-hote"),"upgrade")'),false,'rien ne change sur l’objet de l’hôte');
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Place réservée : un invité déconnecté garde son héros 2 minutes, immobile et protégé, et le reprend sur place',async()=>{
 const {createRelay}=require('../online/relay.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;side.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');return side};
 const host=bootWithSocket(),apps=[];
 const join=async(side,code)=>{side.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');for(let i=0;i<1000&&side.run('game.mode')!=='guest';i++)await wait(10)};
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  const first=bootWithSocket();apps.push(first);await join(first,code);
  const id=first.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async(n,list)=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');for(const a of list)if(a.run('game.mode')==='guest')a.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(10,[first]);
  // L'invité s'éloigne un peu de l'hôte, puis sa connexion tombe.
  host.run(G+'.player.x=P.x+5*TS;'+G+'.player.y=P.y');await step(10,[first]);
  const spot=host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])');
  first.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<1000&&!host.run(G+'.away');i++)await wait(10);
  assert.ok(host.run(G+'.away'),'place réservée');assert.equal(host.run('game.heroes.includes('+G+')'),true,'toujours dans le groupe');
  assert.ok(first.run('__toasts.some(t=>t.includes("place est gardée"))'),'l’invité sait que sa place est gardée');
  assert.equal(first.run('CANAAN_NET.settings().code'),code,'code retenu pour revenir');
  // Immobile et protégé : aucun monstre ne le vise, aucun coup ne le blesse, son intention est effacée.
  host.run('globalThis.wolf={t:"Loup",x:'+G+'.player.x+20,y:'+G+'.player.y,hp:999,mhp:999,r:14,cd:0,g:0};game.world.monsters.push(wolf);P.x+=40*TS');
  host.run(G+'.intent.dx=1');await step(1,[]);host.run(G+'.intent.dx=0');
  const hp0=host.run(G+'.player.hp');await step(60,[]);
  assert.equal(host.run('nearestHero(wolf)===game.hero'),true,'le loup ne vise pas le héros déconnecté');
  assert.equal(host.run('CANAAN_COMBAT.hurt(500,wolf,'+G+')'),0);assert.equal(host.run(G+'.player.hp'),hp0,'aucun dégât');
  assert.equal(host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])'),spot,'immobile');
  assert.equal(host.run('CANAAN_NET.snapshot().heroes.find(h=>h.id==="'+id+'").away')>100,true,'les autres voient le compte à rebours');
  host.run('game.world.monsters=[];P.x-=40*TS');
  // Il revient avec le même identifiant : même héros, à la même place.
  const second=bootWithSocket();apps.push(second);
  second.run('CANAAN_PREFERENCES.write("network",'+first.run('JSON.stringify(CANAAN_PREFERENCES.read("network",{}))')+')');
  await join(second,second.run('CANAAN_NET.settings().code'));
  assert.equal(second.run('CANAAN_NET.state().heroId'),id);await step(10,[second]);
  assert.equal(host.run(G+'.away'),null,'place reprise');assert.equal(host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])'),spot,'à la même place');
  assert.ok(second.run('__toasts.some(t=>t.includes("Te revoilà"))'));assert.equal(host.run('game.heroes.filter(h=>h===' +G+').length'),1,'un seul héros');
  // La même identité se reconnecte alors que l'ancienne connexion est encore ouverte : la nouvelle la remplace.
  const third=bootWithSocket();apps.push(third);
  third.run('CANAAN_PREFERENCES.write("network",'+second.run('JSON.stringify(CANAAN_PREFERENCES.read("network",{}))')+')');
  await join(third,code);for(let i=0;i<1000&&!second.run('__toasts.some(t=>t.includes("Nouvelle connexion"))');i++)await wait(10);
  assert.equal(third.run('game.mode'),'guest','nouvelle connexion acceptée');assert.ok(second.run('__toasts.some(t=>t.includes("Nouvelle connexion"))'),'l’ancienne est fermée');
  assert.equal(host.run('CANAAN_NET.state().peers'),1);
  // Pas de retour dans les 2 minutes : il quitte le groupe ; son héros reste enregistré dans l'aventure.
  third.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<1000&&!host.run(G+'.away');i++)await wait(10);
  host.run('time+=2*60*60');await step(1,[]);
  assert.equal(host.run('game.heroes.includes('+G+')'),false,'parti après 2 minutes');assert.equal(host.run(G+'.away'),null);assert.equal(host.run('!!'+G),true);
  assert.equal(host.errors.length,0,host.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Jouer avec Tailscale dans le jeu : l’hôte ouvre le salon, copie l’invitation ; l’invité la colle et rejoint',async()=>{
 const {createRelay}=require('../online/relay.cjs');
 const relay=createRelay({port:0,host:'127.0.0.1',rate:2000});await relay.ready;const local='ws://127.0.0.1:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 // Pont de l'application de bureau simulé : le relais « Tailscale » est le relais local du test.
 const host=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config'))run('{const db=new Map();window.canaanDesktop={list:()=>[],read:k=>db.get(k)??null,write:(k,t)=>{db.set(k,t)},backup(){},backupText(){},remove:k=>{db.delete(k)},openFolder(){}}}');
  if(part[1].includes('id="canaan-net"'))run('window.canaanDesktop.hosting={copied:[],next:{state:"online",kind:"tailscale",local:"'+local+'",relay:"'+local+'",addresses:["ws://mon-pc.tail55b3f7.ts.net:'+relay.port+'"],firewall:["sudo ufw allow in on tailscale0 to any port '+relay.port+' proto tcp"]},startTailscale(){this.tailscale=(this.tailscale||0)+1;return Promise.resolve(this.next)},stop(){this.stopped=true;return Promise.resolve(true)},status(){return Promise.resolve({})},onStatus(cb){this.emit=cb},copy(t){this.copied.push(t)}}');
 }});
 const guest=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config'))run('0');
  if(part[1].includes('id="canaan-slot-menu"'))run('{const m=document.getElementById("slotMenu");m.__l={};m.addEventListener=(t,f)=>{(m.__l[t]??=[]).push(f)}}');
 }});
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;game.view.notify=()=>{};game.view.chat=()=>{}');
  assert.equal(host.run('CANAAN_NET.state().canHostOnline'),true);
  // Le panneau propose Tailscale et le réseau local, sans aucun réglage Pinggy.
  host.run('toggleGroup()');const before=host.run('document.getElementById("window").innerHTML');
  assert.ok(before.includes('data-action="groupOpenTailscale"')&&before.includes('data-action="groupOpenLan"'));assert.doesNotMatch(before,/pinggy/i);
  host.run('closePanels()');
  await host.run('CANAAN_NET.openTailscale()');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  assert.equal(host.run('canaanDesktop.hosting.tailscale'),1);assert.equal(host.run('CANAAN_NET.state().relay'),local,'salon ouvert sur le relais Tailscale');
  // Le panneau montre l'adresse, le nom MagicDNS, le code, l'aide Tailscale et le pare-feu ; l'invitation est copiée.
  host.run('toggleGroup()');const panel=host.run('document.getElementById("window").innerHTML');
  for(const t of [local,'mon-pc.tail55b3f7.ts.net',code,'groupCopyInvitation','réseau Tailscale','tailscale0'])assert.ok(panel.includes(t),t);
  // Fenêtre Groupe : onglets Compagnons et Échange ; J passe à l'Échange, G revient aux Compagnons, puis le referme.
  assert.match(panel,/data-action="groupTab" data-tab="trade"/);
  host.run('canaanOpenTrade()');assert.ok(host.run('!!document.querySelector("#window .trade-panel")'));assert.match(host.run('document.getElementById("window").innerHTML'),/data-tab="trade"[^>]*class="on"|class="on"[^>]*data-tab="trade"/);
  host.run('canaanPanelKey("group")');assert.ok(host.run('!!document.querySelector("#window .group-panel")'));
  host.run('canaanPanelKey("group")');assert.equal(host.run('modalOpen()'),false);
  host.run('toggleGroup()');
  host.run('CANAAN_NET.copyInvitation()');const invitation=host.run('canaanDesktop.hosting.copied[0]');
  assert.equal(invitation,'Rejoins ma partie The Legend of Nashi ! Relais : '+local+' · Code : '+code);
  // L'invité colle l'invitation : relais et code se remplissent ; il rejoint.
  guest.run('CANAAN_SLOT_MENU.render();CANAAN_SLOT_MENU.joinForm()');
  guest.run('{const i=document.getElementById("joinInvite");i.value='+JSON.stringify(invitation)+';for(const f of document.getElementById("slotMenu").__l.input)f({target:i})}');
  assert.equal(guest.run('document.getElementById("joinRelay").value'),local);assert.equal(guest.run('document.getElementById("joinCode").value'),code);
  guest.run('CANAAN_NET.joinRoom({relay:document.getElementById("joinRelay").value,code:document.getElementById("joinCode").value,pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');assert.equal(host.run('game.heroes.length'),2);
  await host.run('CANAAN_NET.closeInternet()');assert.equal(host.run('canaanDesktop.hosting.stopped'),true);
  // Tailscale arrêté : le message s'affiche dans le panneau, aucun salon ne s'ouvre.
  host.run('canaanDesktop.hosting.next={state:"error",kind:"tailscale",message:"Tailscale est arrêté : ouvre Tailscale et active la connexion (« Connect »)."}');
  for(let i=0;i<1000&&host.run('game.mode')!=='solo';i++)await wait(10);
  assert.equal(await host.run('CANAAN_NET.openTailscale()'),false);assert.equal(host.run('game.mode'),'solo','aucun salon');assert.equal(host.run('CANAAN_NET.debug.socket'),null);
  host.run('closePanels();toggleGroup()');assert.ok(host.run('document.getElementById("window").innerHTML').includes('Tailscale est arrêté'));
  // Réseau local : même parcours, l'invitation donne l'adresse de ce PC sur le réseau, avec l'aide pour le pare-feu.
  host.run('canaanDesktop.hosting.startLan=()=>Promise.resolve({state:"online",kind:"lan",local:"'+local+'",relay:"ws://192.168.1.25:'+relay.port+'",addresses:["ws://192.168.1.25:'+relay.port+'","ws://10.0.0.7:'+relay.port+'"]})');
  await host.run('CANAAN_NET.openLan()');for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  assert.equal(host.run('CANAAN_NET.state().relay'),local);
  host.run('closePanels();toggleGroup()');const lanPanel=host.run('document.getElementById("window").innerHTML');
  assert.ok(lanPanel.includes('ws://192.168.1.25:'+relay.port)&&lanPanel.includes('10.0.0.7')&&lanPanel.includes('sudo ufw allow '+relay.port+'/tcp'),'adresse locale et aide pare-feu');
  assert.equal(host.run('CANAAN_NET.invitation()'),'Rejoins ma partie The Legend of Nashi ! Relais : ws://192.168.1.25:'+relay.port+' · Code : '+host.run('CANAAN_NET.state().code'));
  await host.run('CANAAN_NET.closeInternet()');
  // Anciens réglages Pinggy d'une préférence enregistrée : retirés.
  host.run('CANAAN_PREFERENCES.write("network",{...CANAAN_PREFERENCES.read("network",{}),pinggyToken:"abcd",pinggyMode:"tcp"});CANAAN_NET.settings()');
  assert.equal(host.run('"pinggyToken" in CANAAN_PREFERENCES.read("network",{})'),false);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});
