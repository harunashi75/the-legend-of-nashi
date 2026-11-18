const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Plusieurs héros : chacun suit son intention, les monstres ciblent le plus proche, chaque allié encaisse selon son équipement',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:m=>(globalThis.__msgs||(globalThis.__msgs=[])).push(m),chat:()=>{}}');
 // Un terrain dégagé loin du camp ; l'hôte reste à l'écart.
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-1;a<=12&&ok;a++)for(let b=-1;b<=10&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.base={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=base.x+11*TS;P.y=base.y+9*TS');
 const gear=(level,rarity)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+level+k+'",slot:"'+k+'",level:'+level+',rarity:"'+rarity+'",weaponType:"sword"}').join(',')+'}';
 run('globalThis.bare=canaanCreateHero({name:"Nu",x:base.x,y:base.y});globalThis.tank=canaanCreateHero({name:"Rempart",x:base.x,y:base.y+5*TS,equipment:'+gear(60,'Mythique')+'});tank.level=60;recomputeHeroStats(tank);tank.player.hp=tank.player.mhp;globalThis.walker=canaanCreateHero({name:"Marcheur",x:base.x+6*TS,y:base.y+2*TS})');
 run('game.heroes.push(bare,tank,walker);walker.intent.dx=1');
 assert.ok(run('tank.player.mhp')>run('bare.player.mhp')*5,'PV maximum tirés de l’équipement de chaque héros');
 run('game.world.monsters=[{t:"Loup",x:base.x+30,y:base.y,hp:9e9,mhp:9e9,r:14,cd:0,g:0,level:20,_levelHp:true},{t:"Loup",x:base.x+30,y:base.y+5*TS,hp:9e9,mhp:9e9,r:14,cd:0,g:0,level:20,_levelHp:true}]');
 run('globalThis.dealt={bare:0,tank:0};globalThis.hpTrack={bare:bare.player.hp,tank:tank.player.hp};canaanRegenRates=(f,p)=>({mana:0,health:0})');
 const hostHp=run('P.hp'),walkX=run('walker.player.x');
 let bareFell=false;
 for(let i=0;i<60*20;i++){run('time++;simulateStep()');bareFell=bareFell||run('bare.player.dead')}
 assert.equal(run('P.hp'),hostHp,'l’hôte, loin, n’est jamais visé');
 assert.ok(run('walker.player.x')>walkX+100,'chaque héros suit sa propre intention');
 assert.equal(bareFell,true,'l’allié sans équipement tombe');assert.ok(run('__msgs.includes("💀 Nu est à terre.")'));
 assert.equal(run('tank.player.dead'),false);
 const tankLoss=run('tank.player.mhp-tank.player.hp'),tankHits=run('Math.floor(20/1.2)');
 assert.ok(tankLoss>0,'le loup frappe le héros le plus proche');assert.ok(tankLoss/tankHits<run('bare.player.mhp')/3,'la défense de l’allié réduit les coups');
 // Un héros à terre n'est plus une cible : le loup se tourne vers le plus proche encore debout.
 assert.equal(run('nearestHero(game.world.monsters[0])===bare'),false);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Attaques des alliés : épée, lance et arc frappent selon leur intention, avec leurs statistiques ; victimes au bon héros',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // On mesure les statistiques : la règle « chaque héros à son niveau » (testée à part) est neutralisée.
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}};canaanRegenRates=()=>({mana:0,health:0})');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-1;a<=14&&ok;a++)for(let b=-1;b<=12&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.base={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=base.x+13*TS;P.y=base.y+11*TS;game.world.monsters=[];const k0=game.hero.kills;globalThis.hostKills0=k0');
 const gear=(level,rarity,weapon)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+level+weapon+k+'",slot:"'+k+'",level:'+level+',rarity:"'+rarity+'",weaponType:"'+weapon+'"}').join(',')+'}';
 const ally=(name,weapon,level,rarity,row)=>run('(()=>{const h=canaanCreateHero({name:"'+name+'",x:base.x,y:base.y+'+row+'*TS,equipment:'+gear(level,rarity,weapon)+'});h.level='+level+';recomputeHeroStats(h);h.player.hp=h.player.mhp;game.heroes.push(h);const w={t:"Loup",x:h.player.x+60,y:h.player.y,hp:2000,mhp:2000,r:14,cd:99,g:5,level:30,_levelHp:true};game.world.monsters.push(w);h.intent.attack="quick";h.intent.aimX=w.x;h.intent.aimY=w.y;globalThis["w_'+name+'"]=w;globalThis["h_'+name+'"]=h})()');
 ally('Lame','sword',60,'Mythique',0);ally('Pique','spear',60,'Mythique',4);ally('Archer','bow',60,'Mythique',8);ally('Novice','sword',1,'Commun',12);
 // Les loups ne ripostent pas (recharge immense) : on mesure seulement les coups des alliés.
 run('for(const m of game.world.monsters)m.cd=1e9');
 let maxDrops=0;
 for(let i=0;i<60*30;i++){run('time++;simulateStep()');maxDrops=Math.max(maxDrops,run('game.world.drops.length'))}
 for(const name of ['Lame','Pique','Archer'])assert.equal(run('w_'+name+'.hp<=0&&!game.world.monsters.includes(w_'+name+')'),true,name+' abat son loup');
 assert.equal(run('h_Lame.kills+h_Pique.kills+h_Archer.kills'),3);assert.equal(run('h_Archer.kills'),1,'la flèche crédite son tireur');
 assert.equal(run('game.hero.kills'),run('hostKills0'),'l’hôte ne reçoit pas les victimes des alliés');
 // Chaque loup laisse son or ; l'allié qui passe dessus le ramasse dans sa propre bourse.
 for(const name of ['Lame','Pique','Archer'])assert.ok(run('h_'+name+'.player.gold')>=5,name+' ramasse son or');
 // Le novice frappe bien moins fort : son loup tient encore.
 assert.ok(run('w_Novice.hp>0'),'statistiques propres à chaque héros');assert.ok(run('w_Novice.hp<2000'),'le novice frappe quand même');
 // Recharge propre à chaque allié : pas plus d'une attaque rapide toutes les 0,6 s.
 run('h_Lame.player.basicLock=0;canaanHeroBasicAttack(h_Lame,false)');assert.equal(run('canaanHeroBasicAttack(h_Lame,false)'),false);
 // La Célérité de l'allié raccourcit ce délai.
 assert.ok(Math.abs(run('h_Lame.player.basicLock')-0.55*(1-Math.min(60,run('characterStats(h_Lame).haste'))/100))<1e-9);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Groupe local : créer, faire venir, renvoyer, supprimer ; 6 enregistrés, 3 présents ; équipement de départ et meilleur équipement',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false');
 // Pseudo vide : un nom par défaut ; puis on remplit le groupe.
 const blank=run('CANAAN_GROUP.create("").id');assert.match(run('game.guests["'+blank+'"].name'),/^Compagnon \d$/);run('CANAAN_GROUP.remove("'+blank+'")');
 const ids=[];for(let i=0;i<7;i++)ids.push(run('(CANAAN_GROUP.create("Ami <'+i+'>")||{}).id||null'));
 assert.equal(ids.filter(Boolean).length,6);assert.equal(ids[6],null,'6 compagnons au plus');
 assert.equal(run('game.guests["'+ids[0]+'"].name'),'Ami 0');assert.equal(run('CANAAN_GROUP.create("Trop")'),null);
 assert.equal(run('game.guests["'+ids[1]+'"].equipment.weapon.weaponType'),'sword');assert.equal(run('game.guests["'+ids[1]+'"].local'),true);
 for(const id of ids.slice(0,4))run('CANAAN_GROUP.join("'+id+'")');
 assert.equal(run('game.heroes.length'),4,'3 présents au plus en plus de l’hôte');assert.equal(run('game.heroes[0]===game.hero'),true);
 assert.ok(run('game.heroes.slice(1).every(h=>Math.hypot(h.player.x-P.x,h.player.y-P.y)<3*TS)'),'ils arrivent près de l’hôte');
 assert.equal(run('CANAAN_GROUP.leave("'+ids[0]+'")'),true);assert.equal(run('game.heroes.length'),3);assert.equal(run('CANAAN_GROUP.join("'+ids[3]+'")'),true);
 assert.equal(run('CANAAN_GROUP.remove("'+ids[1]+'")'),true);assert.equal(run('game.guests["'+ids[1]+'"]'),undefined);assert.equal(run('game.heroes.length'),3);
 // Meilleur équipement : la pièce la plus forte de son niveau remplace l'ancienne, qui retourne au sac ;
 // une pièce d'un niveau trop haut reste dans le sac.
 const id=ids[2];run('const h=game.guests["'+id+'"];h.level=30;h.inventory.push(CANAAN_GEAR.normalize({id:"best-armor",slot:"armor",rarity:"Épique",level:25}),CANAAN_GEAR.normalize({id:"low-helm",slot:"helm",rarity:"Commun",level:1}),CANAAN_GEAR.normalize({id:"too-high",slot:"ring",rarity:"Céleste",level:50}))');
 const hp0=run('game.guests["'+id+'"].player.mhp');
 assert.equal(run('CANAAN_GROUP.equipBest("'+id+'")'),2);assert.equal(run('game.guests["'+id+'"].equipment.armor.id'),'best-armor');
 assert.ok(run('game.guests["'+id+'"].inventory.some(i=>i.id==="'+id+'-tunique")'));assert.ok(run('game.guests["'+id+'"].player.mhp')>hp0);
 assert.ok(run('game.guests["'+id+'"].inventory.some(i=>i.id==="too-high")'),'niveau 50 requis : reste au sac');
 assert.equal(run('CANAAN_GROUP.equipBest("'+id+'")'),0);
 // Panneau : chaque compagnon a ses boutons ; un groupe plein masque la création.
 const panels=[];g.capture=h=>panels.push(h);run('showPanel=capture;CANAAN_GROUP.render()');
 assert.match(panels[0],/data-action="groupLeave" data-guest="/);assert.match(panels[0],/data-action="groupCreate"/);assert.doesNotMatch(panels[0],/<b>|Ami <0>/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Groupe enregistré : les invités sont sauvegardés dans heros.invites et reviennent au chargement, absents',()=>{
 const first=require('./helpers/canaan-runtime.cjs')(source);assert.equal(first.errors.length,0,first.errors.join('\n'));
 first.run('started=true;paused=false;globalThis.lina=CANAAN_GROUP.create("Lina");CANAAN_GROUP.join(lina.id);lina.player.gold=321;lina.kills=4');
 first.run('lina.inventory.push(CANAAN_GEAR.normalize({id:"lina-ring",slot:"ring",rarity:"Rare",ilvl:35}));lina.classe={id:"paladin",talents:[1]};lina.rubis.owned.vampire=1');
 // Un compagnon local reçoit une classe au hasard, avec ses talents conseillés.
 assert.ok(first.run('CLASS_IDS.includes(game.guests[Object.keys(game.guests)[0]].classe.id)'));
 first.run('CANAAN_GROUP.create("Oren")');
 assert.equal(first.run('saveGame()'),true);
 const raw=first.run('localStorage.getItem("canaan_slot_1")'),save=JSON.parse(raw);
 const guests=Object.values(save.heros.invites);assert.deepEqual(guests.map(x=>x.pseudo).sort(),['Lina','Oren']);
 const lina=guests.find(x=>x.pseudo==='Lina');
 assert.equal(lina.player.gold,321);assert.equal(lina.kills,4);assert.equal('materials' in lina,false);assert.equal(lina.inventory[0].id,'lina-ring');
 assert.equal(lina.equipment.weapon.name,'Épée de recrue');assert.deepEqual(lina.classe,{id:'paladin',talents:[1]});assert.equal(lina.rubis.owned.vampire,1);
 // Le menu liste leurs pseudos (confirmation de suppression de l'aventure).
 assert.equal(first.run('JSON.stringify(CANAAN_PERSISTENCE.summary(1).invites.slice().sort())'),'["Lina","Oren"]');
 // Nouvelle session sur la même aventure.
 const second=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(!part[1].includes('canaan-runtime-config'))return;
  run("globalThis.__s=new Map([['canaan_pending_slot','1']]);sessionStorage={setItem:(a,b)=>__s.set(a,b),getItem:a=>__s.get(a)??null,removeItem:a=>__s.delete(a)}");
  run('localStorage.setItem("canaan_slot_1",'+JSON.stringify(raw)+')');
 }});
 assert.equal(second.errors.length,0,second.errors.join('\n'));assert.equal(second.run('started'),true);
 assert.equal(second.run('Object.keys(game.guests).length'),2);assert.equal(second.run('game.heroes.length'),1,'les invités reviennent absents');
 const id=second.run('Object.values(game.guests).find(h=>h.name==="Lina").id');
 assert.equal(second.run('CANAAN_GROUP.join("'+id+'")'),true);
 assert.equal(second.run('JSON.stringify((h=>[h.player.gold,h.kills,h.inventory[0].id,h.equipment.weapon.weaponType,h.classe.id,h.classe.talents,h.rubis.owned.vampire])(game.guests["'+id+'"]))'),
  JSON.stringify([321,4,'lina-ring','sword','paladin',[1],1]));
 // Une entrée abîmée est ignorée sans bloquer le chargement.
 second.run('CANAAN_GROUP.importGuests({"!!":{pseudo:"x"},ok:{pseudo:"Bon",inventory:[null,{slot:"nope"}],player:{gold:-5}}})');
 assert.equal(second.run('Object.keys(game.guests).join()'),'ok');assert.equal(second.run('game.guests.ok.inventory.length+"/"+game.guests.ok.player.gold'),'0/0');
});

test('Compagnon local : suit l’hôte, combat près de lui, se relève après dix secondes',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}}');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-4;a<=12&&ok;a++)for(let b=-4;b<=4&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}P.x=(s.x+0.5)*TS;P.y=(s.y+0.5)*TS}');
 run('game.world.monsters=[];globalThis.mate=CANAAN_GROUP.create("Mia");CANAAN_GROUP.join(mate.id)');
 // L'hôte s'éloigne de 8 cases : le compagnon le suit.
 run('P.x+=8*TS');for(let i=0;i<60*6;i++)run('time++;simulateStep()');
 assert.ok(run('Math.hypot(mate.player.x-P.x,mate.player.y-P.y)<3*TS'),'il rejoint l’hôte');
 // Un loup près de l'hôte : le compagnon l'attaque et l'abat (le loup ne riposte pas).
 run('globalThis.wolf={t:"Loup",x:P.x+3*TS,y:P.y,hp:60,mhp:60,r:14,cd:1e9,g:0,level:1,_levelHp:true};game.world.monsters.push(wolf)');
 for(let i=0;i<60*15&&run('wolf.hp>0');i++)run('time++;simulateStep()');
 assert.equal(run('wolf.hp<=0'),true);assert.equal(run('mate.kills'),1);
 assert.ok(run('Object.keys(CANAAN_SKILLS.state(mate).cooldowns).length')>0,'il utilise ses compétences');
 // À terre : il se relève près de l'hôte après dix secondes, avec la moitié de ses PV.
 run('mate.player.dead=true;mate.player.hp=0');for(let i=0;i<60*9;i++)run('time++;simulateStep()');assert.equal(run('mate.player.dead'),true);
 for(let i=0;i<60*2;i++)run('time++;simulateStep()');assert.equal(run('mate.player.dead'),false);
 // Relevé à la moitié de ses PV, puis il se régénère.
 assert.ok(run('mate.player.hp>=Math.round(mate.player.mhp*0.5)&&mate.player.hp<mate.player.mhp*0.7'));
 // Dessin : le compagnon, son nom et sa barre de vie, sans erreur.
 run('runDrawPipeline()');assert.equal(errors.length,0,errors.join('\n'));
});

test('Compétences pour tous les héros : les 40 compétences d’un allié, son mana, ses recharges, ses postures et ses effets différés',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}}');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-6;a<=6&&ok;a++)for(let b=-6;b<=6&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.spot={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=spot.x-20*TS;P.y=spot.y;globalThis.hostCooldowns=JSON.stringify(weaponCooldowns)');
 const types=['sword','dualsword','axe','mace','spear','dualdagger','bow','staff','shield','lute'];
 const report={};
 for(const type of types){
  run('game.heroes.splice(1);globalThis.ally=canaanCreateHero({name:"Test",x:spot.x,y:spot.y,equipment:{weapon:{id:"w",slot:"weapon",ilvl:90,rarity:"Épique",weaponType:"'+type+'"}}});game.heroes.push(ally)');
  for(let i=0;i<4;i++){
   run('ally.player.x=spot.x;ally.player.y=spot.y;ally.player.mp=ally.player.mmp;game.world.monsters=[{t:"Cible",x:spot.x+70,y:spot.y,hp:1e6,mhp:1e6,r:14,cd:1e9,g:0}];ally.intent.aimX=spot.x+70;ally.intent.aimY=spot.y');
   const mp0=run('ally.player.mp');
   assert.equal(run('canaanHeroUseSkill(ally,'+i+')'),true,type+':'+i);
   assert.equal(run('canaanHeroUseSkill(ally,'+i+')'),false,type+':'+i+' en recharge');
   assert.ok(run('ally.player.mp')<mp0,type+':'+i+' coûte du mana');
   for(let t=0;t<150;t++)run('time++;simulateStep()');
   report[type+':'+i]=run('1e6-game.world.monsters[0].hp');
  }
 }
 // Les compétences offensives frappent (certaines sont des postures ou des soins).
 const utility=new Set(['sword:2','dualsword:2','axe:2','staff:2','shield:3','spear:2','dualdagger:2','lute:2']);
 for(const [key,dealt] of Object.entries(report))if(!utility.has(key))assert.ok(dealt>0,key+' inflige des dégâts');
 assert.equal(run('JSON.stringify(weaponCooldowns)'),run('hostCooldowns'),'les recharges de l’hôte ne bougent pas');
 // Recharges de l'allié : elles décroissent, puis la compétence revient.
 run('game.heroes.splice(1);globalThis.ally=canaanCreateHero({name:"Lame",x:spot.x,y:spot.y,equipment:{weapon:{id:"w2",slot:"weapon",level:28,rarity:"Épique",weaponType:"sword"}}});ally.level=28;game.heroes.push(ally);ally.player.mp=300');
 run('canaanHeroUseSkill(ally,0)');assert.equal(run('CANAAN_SKILLS.ready(ally,0)'),false);
 for(let t=0;t<60*4+5;t++)run('time++;simulateStep()');assert.equal(run('CANAAN_SKILLS.ready(ally,0)'),true);
 // Parade de l'allié : elle protège l'allié, pas l'hôte.
 run('canaanHeroUseSkill(ally,2)');assert.ok(run('CANAAN_SKILLS.state(ally).guard')>0);assert.equal(run('CANAAN_SKILLS.state(game.hero).guard'),0);
 assert.equal(run('CANAAN_WEAPON_DEFENSE(null,100,ally)'),60);assert.equal(run('CANAAN_WEAPON_DEFENSE(null,100)'),100);
 // Rafale différée des épées doubles : chaque coup frappe pour l'allié, et la victime lui revient.
 run('game.heroes.splice(1);globalThis.duo=canaanCreateHero({name:"Duo",x:spot.x,y:spot.y,equipment:{weapon:{id:"w3",slot:"weapon",level:54,rarity:"Mythique",weaponType:"dualsword"}}});duo.level=54;game.heroes.push(duo);duo.player.mp=300');
 run('game.world.monsters=[{t:"Rat",x:spot.x+60,y:spot.y,hp:60,mhp:60,r:14,cd:1e9,g:0,level:1,_levelHp:true}];duo.intent.aimX=spot.x+60;duo.intent.aimY=spot.y;globalThis.hostKills=game.hero.kills;canaanHeroUseSkill(duo,0)');
 for(let t=0;t<60;t++)run('time++;simulateStep()');
 assert.equal(run('game.world.monsters.length'),0);assert.equal(run('duo.kills'),1);assert.equal(run('game.hero.kills'),run('hostKills'));
 // Sol consacré d'un allié : il soigne chaque héros du groupe qui s'y tient, l'hôte compris.
 run('game.heroes.splice(1);globalThis.paladin=canaanCreateHero({name:"Gardien",x:spot.x,y:spot.y,equipment:{weapon:{id:"w4",slot:"weapon",level:28,rarity:"Épique",weaponType:"shield"}}});paladin.level=28;game.heroes.push(paladin)');
 run('game.world.monsters=[];P.x=spot.x+20;P.y=spot.y;P.hp=Math.round(P.mhp/2);paladin.player.hp=1;paladin.player.mp=300;canaanRegenRates=()=>({mana:0,health:0});canaanHeroUseSkill(paladin,1)');
 const hostHp=run('P.hp');for(let t=0;t<60*3;t++)run('time++;simulateStep()');
 assert.ok(run('paladin.player.hp')>1,'le gardien se soigne');assert.ok(run('P.hp')>hostHp,'et soigne l’hôte');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Classes et Rubis pour tous les héros : chaque allié a sa classe, ses talents, ses Rubis, ses soins de soutien et l’état de leurs effets',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__chat=[];globalThis.__toasts=[];game.view.chat=(w,m)=>__chat.push(w+": "+m);toast=m=>__toasts.push(m);canaanRegenRates=()=>({mana:0,health:0})');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:P.x+40,y:P.y,equipment:{weapon:{id:"w1",name:"Épée",slot:"weapon",ilvl:100,rarity:"Rare",weaponType:"sword"},armor:{id:"a1",name:"Tunique",slot:"armor",ilvl:100,rarity:"Rare"}}});game.heroes.push(ally);ally.level=60');
 run('globalThis.hostSpeed0=characterStats().speed||0;globalThis.hostHp0=characterStats().maxHp;globalThis.speed0=characterStats(ally).speed||0;globalThis.hp0=characterStats(ally).maxHp');
 // Classe : Assassin (vitesse +5 %) pour l'allié seulement ; ses emplacements viennent de son propre niveau.
 assert.equal(run('CANAAN_CLASS.choose("assassin",ally)'),true);assert.equal(run('CANAAN_CLASS.equip(2,ally)'),true);
 assert.equal(run('CANAAN_CLASS.equip(2,ally)'),false,'jamais deux fois');assert.equal(run('CANAAN_CLASS.equip(10,ally)'),false,'talent inconnu');
 assert.equal(run('(characterStats(ally).speed||0)-speed0'),5);
 assert.equal(run('characterStats().speed||0'),run('hostSpeed0'),'la classe de l’allié ne touche pas l’hôte');
 assert.equal(run('game.hero.classe.id'),null);
 // Rubis : Colosse (PV +10 %) porté par l'allié ; l'hôte ne le porte pas.
 run('ally.rubis.owned.colosse=1;ally.rubis.owned.pacte=1;ally.rubis.owned.peau_de_pierre=1;ally.rubis.owned.second_souffle=1');
 assert.equal(run('CANAAN_RUBIS.equipFor(ally,"colosse")'),true);assert.equal(run('CANAAN_RUBIS.equipFor(ally,"colosse")'),false,'jamais deux fois');
 assert.equal(run('CANAAN_RUBIS.equipFor(ally,"phenix")'),false,'Rubis non possédé');
 assert.equal(run('characterStats(ally).maxHp'),Math.round(run('hp0')*1.1));assert.equal(run('ally.player.mhp'),run('characterStats(ally).maxHp'),'PV max recalculés');
 assert.equal(run('characterStats().maxHp'),run('hostHp0'));assert.equal(run('CANAAN_RUBIS.has("colosse")'),false);assert.equal(run('CANAAN_RUBIS.has("colosse",ally)'),true);
 // Coups et dégâts reçus de l'allié : ses Rubis (Pacte +18 %, Peau de pierre : un coup plafonné à 25 % des PV max) et ses talents.
 run('CANAAN_RUBIS.equipFor(ally,"pacte");CANAAN_RUBIS.equipFor(ally,"peau_de_pierre");CANAAN_RUBIS.equipFor(ally,"second_souffle")');
 run('globalThis.wolf={t:"Loup",x:ally.player.x+50,y:ally.player.y,hp:1e6,mhp:1e6,r:14,cd:1e9,g:0};game.world.monsters.push(wolf)');
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore(wolf,100,{},ally)')-118)<1e-9);assert.equal(run('CANAAN_RUBIS.attackBefore(wolf,100,{})'),100);
 assert.ok(Math.abs(run('CANAAN_RUBIS.defense(wolf,ally.player.mhp,{},ally)')-run('ally.player.mhp')*0.25)<1e-9);assert.equal(run('CANAAN_RUBIS.defense(wolf,100,{},ally)'),100);assert.equal(run('CANAAN_RUBIS.defense(wolf,100,{})'),100);
 // L'allié frappe par le moteur de combat : le Pacte compte dans ses dégâts réels.
 run('Math.random=()=>0.99;ally.player.basicLock=0;ally.intent.aimX=wolf.x;ally.intent.aimY=wolf.y;canaanHeroBasicAttack(ally,false)');
 const withPact=run('1e6-wolf.hp');
 // En combat, un Rubis ne se change pas ; sept secondes plus tard, si.
 assert.equal(run('CANAAN_RUBIS.unequipFor(ally,ally.rubis.equipped.indexOf("pacte"))'),false,'pas en combat');
 run('time+=420;wolf.hp=1e6');assert.equal(run('CANAAN_RUBIS.unequipFor(ally,ally.rubis.equipped.indexOf("pacte"))'),true);
 run('ally.player.basicLock=0;canaanHeroBasicAttack(ally,false)');
 const without=run('1e6-wolf.hp');
 assert.ok(withPact>without*1.1,'Pacte appliqué aux coups de l’allié : '+withPact+' / '+without);
 // Second souffle : l'allié survit une fois à un coup fatal, à 10 % de ses PV.
 run('ally.player.hp=5');run('CANAAN_COMBAT.hurt(1e6,wolf,ally)');
 assert.equal(run('ally.player.dead'),false);assert.equal(run('ally.player.hp'),Math.max(1,Math.round(run('ally.player.mhp')*0.1)));
 run('CANAAN_COMBAT.hurt(1e6,wolf,ally)');assert.equal(run('ally.player.dead'),true,'une seule fois par combat');
 run('ally.player.dead=false;ally.player.hp=ally.player.mhp');
 // État des effets propre à chaque héros : la Foi inébranlable du Paladin allié ne profite pas à l'hôte.
 run('CANAAN_CLASS.setClasse(ally,{id:"paladin",talents:[2,6]})');
 run('ally.player.hp=ally.player.mhp*0.3;wolf.hp=wolf.mhp');run('time++;simulateStep()');
 assert.ok(run('__chat.some(m=>m.includes("Foi inébranlable"))'),'message de l’allié dans le chat');assert.equal(run('__toasts.some(m=>m.includes("Foi"))'),false,'pas à l’écran de l’hôte');
 assert.ok(run('characterStats(ally).guard')>=20);assert.equal(run('characterStats().guard'),0);
 run('wolf.hp=wolf.mhp*0.2');
 assert.ok(Math.abs(run('CANAAN_CLASS_ATTACK.before(wolf,100,{},ally).damage')-115)<1e-9,'Jugement de l’allié');
 assert.equal(run('CANAAN_CLASS_ATTACK.before(wolf,100,{}).damage'),100,'l’hôte n’a pas de classe');
 // Soins entre héros : un Druide allié (Toucher de vie, Bénédiction forestière, Symbiose) soigne l'hôte.
 run('CANAAN_CLASS.setClasse(ally,{id:"druide",talents:[3,5,7]});globalThis.hb=1+Math.max(0,characterStats(ally).healingBonus||0)/100');
 run('P.hp=1;ally.player.hp=1;globalThis.healed=canaanApplyHeal(40,false,game.hero,ally)');
 assert.equal(run('healed'),Math.round(40*run('hb')*1.15));
 assert.equal(run('CANAAN_CLASS.audit(game.hero).shield'),Math.round(run('P.mhp')*0.08),'bouclier de la Bénédiction forestière sur l’hôte');
 assert.ok(Math.abs(run('ally.player.hp')-(1+run('healed')*0.25))<1e-9,'Symbiose : 25 % rendus au Druide');
 run('CANAAN_CLASS_DEFENSE(wolf,1e6,game.hero);P.hp=1;canaanApplyHeal(10,false,game.hero,ally)');
 assert.equal(run('CANAAN_CLASS.audit(game.hero).shield'),0,'12 s de recharge par allié');
 // Paladin : ses soins sur lui-même soignent l'hôte proche à 50 % ; l'Aura protectrice ne se cumule pas.
 run('CANAAN_CLASS.setClasse(ally,{id:"paladin",talents:[7]});globalThis.hb=1+Math.max(0,characterStats(ally).healingBonus||0)/100');
 run('P.hp=1;ally.player.hp=1;canaanApplyHeal(60,false,ally)');
 assert.equal(run('P.hp'),1+Math.round(30*run('hb')),'Lumière sacrée');
 assert.equal(run('characterStats().guard'),5,'Aura protectrice de l’allié');
 run('CANAAN_CLASS_STATE.import({id:"paladin",talents:[7]})');assert.equal(run('characterStats().guard'),5,'non cumulable');
 // Sauvegarde : classe et Rubis de l'invité gardés et vérifiés au chargement (talent en double et Rubis non possédé retirés).
 run('ally.id="local-test";ally.local=true;game.guests[ally.id]=ally');
 const saved=run('JSON.stringify(CANAAN_GROUP.exportGuests(h=>h.player))');const data=JSON.parse(saved);
 data['local-test'].rubis.equipped[5]='phenix';data['local-test'].classe.talents.push(7,99);
 run('CANAAN_GROUP.importGuests('+JSON.stringify(data)+')');
 assert.deepEqual(run('JSON.stringify(game.guests["local-test"].classe)'),JSON.stringify({id:'paladin',talents:[7]}));
 assert.equal(run('game.guests["local-test"].rubis.equipped.includes("phenix")'),false);assert.equal(run('game.guests["local-test"].rubis.equipped.includes("colosse")'),true);
 assert.equal(errors.length,0,errors.join('\n'));
});
