const { test } = require('node:test');
const {
  fs,
  assert,
  path,
  source,
  scripts
} = require('./helpers/context.cjs');

test('Objets : normalisation unique, butin de chaque instance à son niveau, anciens iLvl convertis et sauvegarde',()=>{
  const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
  const tracked={id:'old-armor',name:'Armure ancienne',slot:'armor',rarity:'Rare',level:30};
  assert.equal(g.CANAAN_GEAR.normalize(tracked),tracked);const sec=JSON.stringify(tracked.sec);
  g.CANAAN_GEAR.normalize(tracked);assert.equal(JSON.stringify(tracked.sec),sec,'secondaires tirées une seule fois');
  const weapon={id:'identity',name:'Arc personnel',slot:'weapon',weaponType:'bow',rarity:'Épique',level:40};
  g.CANAAN_GEAR.normalize(weapon);assert.equal(weapon.name,'Arc personnel');assert.equal(weapon.weaponType,'bow');assert.equal(weapon.level,40);
  assert.equal(typeof g.CANAAN_GEAR.grant,'function');assert.equal(typeof g.CANAAN_LOOT.grant,'function');
  assert.equal(run('typeof rebalanceItem'), 'undefined');assert.equal(run('typeof rebalanceAllGear'),'undefined');
  g.Math=Object.create(Math);
  // Tous les coffres d’instance sont garantis, même avec le pire tirage, au niveau de récompense de l'instance.
  const cases=[[0,'Rare',10],[1,'Rare',16],[2,'Rare',21],[3,'Rare',28],[4,'Rare',35],[5,'Rare',40],[6,'Épique',47],[7,'Épique',52],[8,'Épique',57],[9,'Épique',60]];
  for(const [index,rarity,level] of cases){
    run('inventory=[]');let first=true;
    g.Math.random=()=>{if(first){first=false;return .999}return .2};
    assert.equal(g.CANAAN_LOOT.instance(index),true);
    const item=run('inventory[0]');assert.equal(item.rarity,rarity);assert.equal(item.level,level);assert.equal(item.ilvl,undefined);
    if(item.slot!=='artifact')assert.equal(Object.keys(item.sec).length,2);
    assert.equal(item.origin,index<6?'donjon':'raid');assert.doesNotMatch(item.name,/ — (Relique du donjon|Héritage du raid)/);
  }
  // Sac plein : la récompense garantie est perdue.
  run('inventory=Array.from({length:BAG_LIMIT},(_,i)=>({id:"full"+i,slot:"armor",level:1}))');g.Math.random=()=>.01;
  assert.equal(g.CANAAN_LOOT.instance(0),false);
  // Ancienne sauvegarde : l'iLvl devient un niveau (190 → 60) et les points Ratings52 disparaissent.
  const old=run('CANAAN_GEAR.normalize({id:"vieux-85",name:"Armure",slot:"armor",rarity:"Épique",ilvl:85,ratings52:{defense:99},_stats52:1,_stats52Ilvl:85})');
  assert.equal(old.level,Math.round(85*60/190));for(const k of ['ilvl','ratings52','_stats52','_stats52Ilvl'])assert.equal(k in old,false,k);
  assert.equal(run('CANAAN_GEAR.normalize({id:"v190",slot:"ring",rarity:"Céleste",ilvl:190}).level'),60);
  // Ancien suffixe des récompenses de boss : retiré du nom à la normalisation, provenance gardée.
  {const o=run('CANAAN_GEAR.normalize({id:"vieux",name:"Épée des braises — Héritage du raid",slot:"weapon",weaponType:"sword",rarity:"Héroïque",level:40})');assert.equal(o.name,'Épée des braises');assert.equal(o.origin,'raid');
   const relic=run('CANAAN_GEAR.normalize({id:"vieux2",name:"Arc du val — Relique du donjon",slot:"weapon",weaponType:"bow",rarity:"Rare",level:10})');assert.equal(relic.name,'Arc du val');assert.equal(relic.origin,'donjon');}
  // Une seule passe complète de normalisation au chargement ; les secondaires sont relues telles quelles.
  run('inventory=[CANAAN_GEAR.normalize({id:"keep",name:"Armure",slot:"armor",rarity:"Épique",level:30})]');const kept=JSON.stringify(run('inventory[0].sec'));
  run('saveGame()');
  let bulkPasses=0;const normalizeAll=g.CANAAN_GEAR.normalizeAll;
  g.CANAAN_GEAR.normalizeAll=function(){bulkPasses++;return normalizeAll.call(this)};
  assert.equal(run('loadGame()'),true);assert.equal(bulkPasses,1);
  assert.equal(JSON.stringify(run('inventory[0].sec')),kept);
  // La vérification centrale agrège aussi les exports présents avec un type incorrect.
  const originalDeflect=g.CANAAN_CLASS_ON_DODGE,originalBagExport=g.CANAAN_BAG_STATE.export;
  const originalName=g.WEAPON_NAMES.Mythique.bow;
  g.CANAAN_CLASS_ON_DODGE=null;g.CANAAN_BAG_STATE.export='invalid';g.WEAPON_NAMES.Mythique.bow='';
  assert.throws(()=>g.CANAAN_BOOTSTRAP.validate(),error=>{
    assert.ok(error.message.includes('CANAAN_CLASS_ON_DODGE'));
    assert.ok(error.message.includes('CANAAN_BAG_STATE.export'));
    assert.ok(error.message.includes('WEAPON_NAMES.Mythique.bow'));
    return true;
  });
  g.CANAAN_CLASS_ON_DODGE=originalDeflect;g.CANAAN_BAG_STATE.export=originalBagExport;
  g.WEAPON_NAMES.Mythique.bow=originalName;assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  assert.equal(errors.length,0,errors.join('\n'));
});

test('Rareté inconnue ou absente : Commun, sans alias ni avertissement',()=>{
 const boot=require('./helpers/canaan-runtime.cjs');
 const {g,run,errors}=boot(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const warnings=[];g.console.warn=(...a)=>warnings.push(a.join(' '));
 run("globalThis.rareTest=[{id:'gm',slot:'armor',ilvl:30,rarity:'Inconnue'},{id:'none',slot:'armor',ilvl:30},{id:'ok',slot:'armor',ilvl:30,rarity:'Rare'}];rareTest.forEach(i=>CANAAN_GEAR.normalize(i))");
 assert.equal(run("rareTest.map(i=>i.rarity).join('|')"),'Commun|Commun|Rare');
 assert.equal(warnings.length,0);
});

test('Raid 4 : Jugement de Célestia, choix Normal ou Héroïque, puissance et butin garantis',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Plus de paliers d’iLvl : chaque objet a un niveau de 1 à 60.
 assert.equal(run("typeof ITEM_ILVL_TIERS+typeof tierIlvl"),'undefinedundefined');
 // Placement : Forêt enchantée, dernier biome, sur une tuile terrestre, avec son portail.
 const d=JSON.parse(run('JSON.stringify(instances[9])'));
 assert.equal(d.name,'Le Jugement de Célestia');assert.equal(d.boss,'L’Avatar du Jugement');assert.equal(d.biome,5);assert.equal(d.raid,true);
 assert.equal(run('regionAt('+d.x+','+d.y+').name'),'Forêt enchantée');assert.equal(run('SOLID.includes(overworld['+d.y+']['+d.x+'])'),false);
 assert.equal(run("npcs.filter(n=>n.type==='portal'&&n.instance===9).length"),1);
 // Chaque instance a son sol de donjon : aucune case indéfinie.
 assert.ok(run('instances.every((d,i)=>makeDungeon(i).every(row=>row.every(Number.isInteger)))'));
 // Fenêtre du portail : deux difficultés, Normal au niveau 58, Héroïque au niveau 60.
 const portal=lv=>{run('game.hero.level='+lv+';openPortal({instance:9})');return g.document.getElementById('window').innerHTML};
 let html=portal(58);
 assert.match(html,/data-difficulty="normal" >/);assert.match(html,/data-difficulty="heroic" disabled>/);
 assert.match(html,/Épique — niveau 58 à 60/);assert.match(html,/1 % Mythique/);assert.match(html,/5 % Légendaire/);assert.match(html,/\+65 % PV et \+40 % dégâts calculés/);
 assert.match(portal(50),/data-difficulty="normal" disabled>/);
 assert.match(portal(60),/data-difficulty="heroic" >/);
 // Carte M : la plage de niveaux de chaque biome (1–10, 10–20 … 50–60).
 run('closePanels();toggleMap()');
 const ranges=[...g.document.getElementById('window').innerHTML.matchAll(/Niveaux ([^<]+)</g)].map(m=>m[1]);
 assert.deepEqual(ranges,['1–10','10–20','20–30','30–40','40–50','50–60']);
 // Entrée : la difficulté est obligatoire et son niveau contrôlé.
 run('closePanels();game.hero.level=58;enterInstance(9)');assert.equal(run('instanceState'),null);
 run("enterInstance(9,'heroic')");assert.equal(run('instanceState'),null);
 run("enterInstance(9,'inconnue')");assert.equal(run('instanceState'),null);
 const measure=mode=>{
  run("game.hero.level=60;enterInstance(9,'"+mode+"')");
  assert.equal(run('instanceState.difficulty'),mode);
  const boss=JSON.parse(run('JSON.stringify(monsters.find(m=>m.boss))')),add=JSON.parse(run('JSON.stringify(monsters.find(m=>!m.boss))'));
  const hit=run('Math.random=()=>.999;CANAAN_STATS_INCOMING(monsters.find(m=>m.boss))');
  // Butin : qualité et niveau fixés par la difficulté, même avec un tirage défavorable.
  run('inventory=[];Math.random=()=>.999');assert.equal(run('CANAAN_LOOT.instance(9)'),true);
  const loot=JSON.parse(run('JSON.stringify(inventory[0])'));
  run('leaveInstance()');assert.equal(run('instanceState'),null);
  return {boss:boss.mhp,add:add.mhp,addName:add.t,hit,loot:[loot.rarity,loot.level]};
 };
 const normal=measure('normal'),heroic=measure('heroic');
 assert.equal(heroic.boss,Math.round(normal.boss*1.65));
 assert.ok(Math.abs(heroic.add-normal.add*1.65)<=1,normal.add+' / '+heroic.add);
 assert.ok(Math.abs(heroic.hit-normal.hit*1.4)<=1,normal.hit+' / '+heroic.hit);
 assert.equal(normal.addName,'Juge céleste');
 assert.equal(normal.loot[0],'Épique');assert.equal(heroic.loot[0],'Épique');
 // Hors du raid, aucune difficulté ne s’applique.
 assert.equal(run('instanceDifficulty()'),null);
 // Bouton du portail : data-difficulty validé par la délégation d’actions.
 assert.throws(()=>run("dispatchCanaanAction({dataset:{action:'enterInstance',instance:'9',difficulty:'<b>'}})"),/Argument d’action invalide/);
});

test('Butin de prestige : niveaux requis à butin, Légendaire et Mythique seulement au Raid 4 Héroïque et à l’arène, cases brillantes',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('GEAR_RARITIES.map(r=>r.name).join()'),'Commun,Peu commun,Rare,Épique,Légendaire,Mythique');
 // La Cave (niveau requis 7, butin 10) donne du Rare du niveau 7 au niveau 10.
 const levels=new Set();
 for(let i=0;i<120;i++){run('inventory=[];dropTierGear(0)');const it=run('inventory[0]');assert.equal(it.rarity,'Rare');levels.add(it.level)}
 assert.deepEqual([...levels].sort((a,b)=>a-b),[7,8,9,10]);
 // Sources : donjons Rare, raids Épique ; seul le Raid 4 Héroïque a une chance de prestige.
 const inst=JSON.parse(run('JSON.stringify(instances)'));
 assert.ok(inst.slice(0,6).every(d=>d.rarity==='Rare'));assert.ok(inst.slice(6,9).every(d=>d.rarity==='Épique'));
 assert.equal(inst[9].difficulties.normal.rarity,'Épique');assert.equal(inst[9].difficulties.normal.prestige,undefined);
 assert.equal(inst[9].difficulties.heroic.prestige,'raidHeroic');
 const roll=(kind,x)=>run('Math.random=()=>'+x+';prestigeRoll('+JSON.stringify(kind)+')');
 assert.equal(roll('raidHeroic',.005),'Mythique');assert.equal(roll('raidHeroic',.03),'Légendaire');assert.equal(roll('raidHeroic',.5),null);
 assert.equal(roll('arenaFinal',.03),'Légendaire');assert.equal(roll('arenaFinal',.5),null);assert.equal(roll(undefined,0),null);
 // Le hasard seul ne donne jamais de Légendaire ni de Mythique.
 for(const x of [0,.5,.97,.99999])assert.ok(!['Légendaire','Mythique'].includes(run('Math.random=()=>'+x+';rarityRoll(1).name')));
 // Les anciennes qualités Héroïque et Céleste deviennent Épique et Mythique.
 assert.equal(run('rarityInfo({rarity:"Héroïque"}).name'),'Épique');assert.equal(run('rarityInfo({rarity:"Céleste"}).name'),'Mythique');
 // Cases du sac et du personnage : effet brillant et vague pour Légendaire et Mythique.
 assert.equal(run('canaanPrestige({rarity:"Légendaire"})'),' data-prestige="legendaire"');assert.equal(run('canaanPrestige({rarity:"Mythique"})'),' data-prestige="mythique"');
 assert.equal(run('canaanPrestige({rarity:"Épique"})'),'');assert.match(source,/\[data-prestige\][^{]*::before/);assert.match(source,/@keyframes prestige-wave/);
 run('inventory=[];giveGear(30,"tier","Mythique");renderInventory()');assert.match(g.document.getElementById('window').innerHTML,/data-prestige="mythique"/);
});

test('Butin des monstres, élites, boss mondiaux et coffres secrets : un objet garanti, plus de matériaux',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const reward=(code,x)=>JSON.parse(run('instanceState=null;inventory=[];P.gold=0;Math.random=()=>'+x+';'+code+';JSON.stringify({items:inventory.map(i=>[i.rarity,i.level]),gold:P.gold,hero:Object.keys(game.hero)})'));
 const mob='recordKill({x:P.x,y:P.y,t:"Loup",hp:0,level:7})',elite='recordKill({x:P.x,y:P.y,t:"Loup",hp:0,elite:true,level:12})';
 const boss='recordKill({x:P.x,y:P.y,t:"Fenrir",hp:0,worldBoss:true,worldBossId:"fenrir"})';
 const chest='{const spot=hiddenChestSpots.find(c=>!openedChests.includes(c.id)),at=chestPosition(spot);P.x=at.x*TS;P.y=at.y*TS;openNearbyChest()}';
 // Chaque objet a le niveau de sa source : mob normal et élite Commun, boss mondial Rare (+1 000 à 1 500 or).
 let r=reward(mob,0);assert.deepEqual(r.items,[['Commun',7]]);assert.equal(r.hero.includes('materials'),false);
 r=reward(mob,.999);assert.deepEqual(r.items,[['Commun',7]]);
 r=reward(elite,.5);assert.deepEqual(r.items,[['Commun',12]]);
 r=reward(boss,0);assert.deepEqual(r.items,[['Rare',10]],'Fenrir est niveau 10');assert.ok(r.gold>=1000&&r.gold<=1500,String(r.gold));
 // Coffre secret : verrouillé sans clé des secrets ; avec une clé (consommée), un Épique du niveau de sa zone
 // (milieu de la plage), 200 à 400 or et 25 % de chance d'un Rubis.
 const chestLevel=run('(()=>{const spot=hiddenChestSpots.find(c=>!openedChests.includes(c.id)),at=chestPosition(spot),[lo,hi]=ZONE_LEVELS[canaanZoneIndexAt(at.x,at.y)];return Math.round((lo+hi)/2)})()');
 const opened0=run('openedChests.length');
 r=reward('P.keys=0;'+chest,0);assert.deepEqual(r.items,[]);assert.equal(r.gold,0);assert.equal(run('openedChests.length'),opened0,'sans clé, il reste fermé');
 const rubis0=run('Object.values(CANAAN_RUBIS_STATE.export().owned).reduce((a,b)=>a+b,0)');
 r=reward('P.keys=2;'+chest,0);assert.deepEqual(r.items,[['Épique',chestLevel]]);assert.equal(r.gold,200);assert.equal(run('P.keys'),1,'une clé consommée');
 assert.equal(run('Object.values(CANAAN_RUBIS_STATE.export().owned).reduce((a,b)=>a+b,0)'),rubis0+1,'Rubis gagné');
 r=reward('P.keys=1;'+chest,0.99);assert.deepEqual(r.items,[['Épique',chestLevel]]);assert.equal(r.gold,398);
 // Les ennemis d’une instance, même élites, ne donnent rien : le coffre du boss fait le butin.
 r=reward('instanceState={index:0,cleared:false};'+mob,0);assert.deepEqual(r.items,[]);
 r=reward('instanceState={index:6,cleared:false};'+elite,.46);assert.deepEqual(r.items,[]);
 // Rubis Prospecteur : 15 % de chances qu’un mob normal lâche un objet Peu commun (jamais en instance).
 run('CANAAN_RUBIS.betterDrop=()=>true');r=reward(mob,0);assert.deepEqual(r.items,[['Peu commun',7]]);
 r=reward(boss,0);assert.deepEqual(r.items,[['Rare',10]],'le Prospecteur ne change que les mobs ordinaires');
});

test('Qualité Unique et types d’armure absents du jeu et du butin',()=>{
 for(const m of scripts)assert.doesNotMatch(m[2],/armorType|ARMOR_TYPES|ensureArmorType|'Unique'/,m[1]);
 assert.doesNotMatch(source.slice(0,source.indexOf('<script')),/armorType|Unique/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('GEAR_RARITIES.map(r=>r.name).join()'),'Commun,Peu commun,Rare,Épique,Légendaire,Mythique');
 assert.equal(run("Object.hasOwn(QUALITY_FACTOR,'Unique')||Object.hasOwn(WEAPON_NAMES,'Unique')||Object.hasOwn(GEAR_NAMES,'Unique')"),false);
 // Tirage au hasard : jamais de Légendaire ni de Mythique (réservés au Raid 4 Héroïque et à l’arène).
 const roll=x=>run('Math.random=()=>'+x+';rarityRoll(1).name');
 assert.equal(roll(0),'Commun');assert.equal(roll(0.9),'Rare');assert.equal(roll(0.9905),'Épique');assert.equal(roll(0.99999),'Épique');
 // Un objet trouvé ou normalisé ne reçoit aucun type d’armure.
 run('inventory=[];Math.random=()=>.5');
 for(const slot of ['helm','armor','ring'])assert.equal(run('Object.hasOwn(CANAAN_GEAR.normalize({id:"n-'+slot+'",slot:"'+slot+'",rarity:"Rare",ilvl:30}),"armorType")'),false,slot);
 const loot=JSON.parse(run('JSON.stringify(giveGear(10,"normal"))'));assert.equal(Object.hasOwn(loot,'armorType'),false);
});

test('Catalogues uniques : valeurs, butins et prix identiques à la référence 13e',()=>{
 const reference=require('./fixtures/catalogs-13e.json');
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const data=JSON.parse(run('JSON.stringify({instances,rarities:GEAR_RARITIES,weapons:WEAPON_TYPES,craft:CRAFT_WEAPONS,spells:WEAPON_SPELLS})'));
 for(const key of Object.keys(data))assert.deepEqual(data[key],reference[key],key);
 for(const [rarity,level,price] of reference.sales)assert.equal(run('gearSellValue('+JSON.stringify({id:'sale',slot:'armor',rarity,level})+')'),price);
 for(const [level,kind,rarity,price] of reference.fullBag){
  assert.equal(run('inventory=Array(BAG_LIMIT).fill(null);P.gold=0;Math.random=()=>.5;giveGear(...'+JSON.stringify([level,kind,rarity])+');P.gold'),price,JSON.stringify([level,kind,rarity]));
 }
 for(const [level,kind,rarity,expected] of reference.loot){
  const item=JSON.parse(run('inventory=[];Math.random=()=>.5;JSON.stringify(giveGear(...'+JSON.stringify([level,kind,rarity])+'))'));
  assert.deepEqual({level:item.level,rarity:item.rarity},expected);
  for(const key of ['secondaryStats','lvl','reqLvl','ilvl','ratings52'])assert.equal(Object.hasOwn(item,key),false);
 }
 for(const type of reference.craft){run('equipment.weapon={slot:"weapon",weaponType:'+JSON.stringify(type)+'};refreshWeaponBar()');assert.equal(run('SKILLS.length'),4)}
 assert.doesNotMatch(source,/ITEM_TIERS|function (?:mobForBiome|normalizeGearLabel|stableSecondary|ensureSecondary|rollSecondary|gearRequiredLevel)\(|raidBoss|eventId|#help\b|V1\.7\.\d+|GEAR_RARITIES\.splice|CRAFT_WEAPONS\.splice/);
 // Une seule définition, dans le module partagé des catalogues ; aucun ancien script ne la redéclare.
 const catalog=fs.readFileSync(path.join(__dirname,'..','src','canaan','shared','data','equipment.js'),'utf8');
 for(const name of ['GEAR_RARITIES','WEAPON_TYPES','CRAFT_WEAPONS','WEAPON_SPELLS']){
  assert.equal([...catalog.matchAll(new RegExp('export const\\s+'+name+'\\s*=','g'))].length,1,name);
  assert.equal([...source.matchAll(new RegExp('(?:const|let|var)\\s+'+name+'\\s*=','g'))].length,1,name);
 }
});

test('Butin individuel : objets et or de chaque victime vont au héros qui l’a obtenue',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;globalThis.__notes=[];globalThis.__chat=[];game.view={notify:m=>__notes.push(m),chat:(w,m)=>__chat.push(w+": "+m)}');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:P.x+400,y:P.y});game.heroes.push(ally)');
 const host=JSON.parse(run('JSON.stringify({inv:game.hero.inventory.length,gold:P.gold})'));
 // Monstre ordinaire : objet garanti pour l'allié.
 run('Math.random=()=>0.01;globalThis.wolf={t:"Loup",x:ally.player.x,y:ally.player.y,hp:1,mhp:1,r:14,g:0};game.world.monsters.push(wolf);canaanDamageMonster(wolf,5,ally)');
 assert.equal(run('ally.inventory.length'),1);assert.equal(run('ally.kills'),1);
 assert.equal(run('game.hero.inventory.length'),host.inv);
 assert.ok(run('__chat.some(l=>l.startsWith("Butin: Lina — 🎁"))'),'message de butin de l’allié dans le chat');assert.ok(run('!__notes.some(n=>n.startsWith("🎁"))'));
 // Boss de monde : or et objet Rare pour l'allié.
 run('globalThis.boss={t:"Fenrir",worldBoss:true,worldBossId:"fenrir",x:ally.player.x,y:ally.player.y,hp:1,mhp:1,r:30,g:0};game.world.monsters.push(boss);canaanDamageMonster(boss,5,ally)');
 assert.ok(run('ally.player.gold')>=1000);assert.equal(run('ally.inventory.some(i=>i.rarity==="Rare")'),true);
 assert.equal(run('P.gold'),host.gold);assert.ok(run('game.world.worldBossTimers.fenrir')>0,'le minuteur du boss reste celui du monde');
 // Sac plein (40 places pour un allié) : l'objet est converti en or pour lui.
 run('ally.inventory=Array.from({length:40},(_,i)=>({id:"f"+i,slot:"ring",level:1,rarity:"Commun"}));globalThis.goldBefore=ally.player.gold;giveGear(1,"normal","Commun",ally)');
 assert.equal(run('ally.inventory.length'),40);assert.ok(run('ally.player.gold')>run('goldBefore'));
 // Sans héros précisé, rien ne change pour l'hôte.
 run('giveGear(1,"normal","Commun")');assert.equal(run('game.hero.inventory.length'),host.inv+1);
 assert.equal(errors.length,0,errors.join('\n'));
});
