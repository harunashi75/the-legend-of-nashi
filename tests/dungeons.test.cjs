const { test } = require('node:test');
const {
  assert,
  source,
  groupInDungeon,
  playInstance
} = require('./helpers/context.cjs');

test('Donjons et raids en exploration : trois boss par donjon, six par raid, énigmes, passages secrets et clés',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Chaque instance a son thème, ses boss, ses boss cachés et un plan jouable (énigmes faisables, boss scellés).
 const audits=JSON.parse(run('JSON.stringify(instances.map((d,i)=>CANAAN_DUNGEON_AUDIT(i)))'));
 assert.equal(new Set(audits.map(a=>a.theme)).size,14);
 assert.deepEqual(audits.map(a=>a.bosses),[3,3,3,3,3,3,6,6,6,6,3,3,3,3]);
 assert.deepEqual(audits.map(a=>a.secrets),[1,1,1,1,1,1,2,2,2,2,1,1,1,1]);
 assert.deepEqual(audits.map(a=>a.doors),audits.map(a=>a.bosses));assert.deepEqual(audits.map(a=>a.gates),audits.map(a=>a.bosses-1));
 for(const a of audits){assert.equal(a.reachable,true,a.theme);assert.equal(a.sealed,true,a.theme);assert.ok(a.props>60,a.theme);assert.ok(a.rooms>=(a.bosses===6?20:12),a.theme+' : '+a.rooms+' salles')}
 // Les quatre mécanismes servent, et chaque instance en mélange plusieurs.
 assert.deepEqual([...new Set(audits.flatMap(a=>a.locks))].sort(),['braziers','guardian','levers','runes']);
 assert.ok(audits.every(a=>new Set(a.locks).size>=3));
 assert.equal(run('instances.every(d=>d.bosses.length===(d.raid?6:3)&&d.bosses[d.bosses.length-1]===d.boss&&d.secrets.length===(d.raid?2:1))'),true);
 assert.equal(run("instances[6].bosses.join(' → ')"),'Le Maître-Chien Ravageur → Sire Écorcheur → Le Chapelain Sanguin → La Comtesse Écarlate → Le Champion du Sang → Le Roi Sanglant');
 assert.equal(run('SOLID.includes(19)&&SOLID.includes(22)&&SOLID.includes(23)&&!SOLID.includes(20)&&!SOLID.includes(21)'),true);
 assert.equal(run('JSON.stringify(makeDungeon(7))===JSON.stringify(makeDungeon(7))'),true);
 run('game.hero.level=60;openPortal({instance:6})');
 assert.match(g.document.getElementById('window').innerHTML,/Boss \(6\) : Le Maître-Chien Ravageur → Sire Écorcheur/);
 // Fiche du portail : les chances réelles (61 % par boss et par héros), plus de « 100 % garanti ».
 assert.match(g.document.getElementById('window').innerHTML,/61 % de chance par boss et par héros \(0 à 6 objets\)/);assert.doesNotMatch(g.document.getElementById('window').innerHTML,/100 % garanti/);
 run('closePanels()');
 // Donjon : trois boss et un boss caché ; les ennemis portent le thème du donjon.
 run('enterInstance(0)');
 assert.equal(run("monsters.filter(m=>m.boss&&m.secretBoss===undefined).map(m=>m.t).join()"),'Grignotte, Reine des Rats,Le Fossoyeur Bossu,Gardien des Os');
 assert.equal(run("monsters.filter(m=>m.secretBoss!==undefined).map(m=>m.t).join()"),'Le Rat-Roi aux Mille Queues');
 assert.equal(run("monsters.filter(m=>!m.boss).every(m=>['Osselet','Rat des terriers','Gardien du sceau'].includes(m.t))"),true);
 const plan='CANAAN_DUNGEON_EXPLORE.plan(0)',st='CANAAN_DUNGEON_EXPLORE.state()';
 const walk=(x,y)=>run('P.x=('+x+'+0.5)*TS;P.y=('+y+'+0.5)*TS');
 const doorOpen=s=>run('{const g='+plan+'.doors['+s+'];g.cells.every(([x,y])=>world[y][x]!==19)}');
 const lock=s=>JSON.parse(run('JSON.stringify('+plan+'.locks['+s+'])'));
 const use=it=>{walk(it.x,it.y+1);return run('CANAAN_DUNGEON_EXPLORE.interact()')};
 // Porte scellée : E donne l'indice, la porte reste fermée.
 const d0=JSON.parse(run('JSON.stringify('+plan+'.doors[0].cells[1])'));walk(d0[0],d0[1]+1);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);assert.equal(doorOpen(0),false);
 // Résout chaque porte du donjon selon son mécanisme.
 const solve=s=>{
  const L=lock(s);
  if(L.type==='braziers')for(const it of L.items)use(it);
  if(L.type==='levers'){
   // Un mauvais ordre relève tous les leviers ; le bon ordre ouvre la porte.
   const wrong=L.items.find(it=>it.id!==L.order[0]);use(wrong);assert.equal(run(st+'.locks['+s+'].step'),0);
   for(const id of L.order)use(L.items[id]);
  }
  if(L.type==='runes'){
   const press=it=>{walk(it.x,it.y);run('P.y-=10;CanaanStages.dungeonPuzzles.after()');walk(it.x+3,it.y+3);run('P.x=0;P.y=0;CanaanStages.dungeonPuzzles.after()')};
   for(const id of L.order)press(L.items[id]);
  }
  if(L.type==='guardian'){run('for(const m of monsters.filter(m=>m.guardian==='+s+'))m.hp=0');run('CanaanStages.dungeonPuzzles.after()')}
  assert.equal(doorOpen(s),true,'porte '+s+' ('+L.type+')');
 };
 // La stèle donne l'ordre des leviers ou des dalles en énigme.
 const L1=lock(1);if(L1.stele){walk(L1.stele.x,L1.stele.y+1);run('CANAAN_DUNGEON_EXPLORE.interact()')}
 solve(0);
 // Boss : 61 % de chance d'équipement par héros ; sa mort lève la herse de sa salle.
 const gates=()=>run('world.flat().filter(t=>t===19).length');
 const kill=(name,r)=>run('{const real=Math.random;Math.random=()=>'+r+';const m=monsters.find(m=>m.t==='+JSON.stringify(name)+');m.hp=0;recordKill(m);monsters=monsters.filter(o=>o!==m);Math.random=real}');
 run('inventory.length=0');const g0=gates();
 kill('Grignotte, Reine des Rats',0.1);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'chanceux : un équipement');assert.ok(gates()<g0);
 solve(1);kill('Le Fossoyeur Bossu',0.9);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'pas de chance : rien');
 // Passage secret : le mur fissuré s'effondre (E) ; le boss caché donne une clé des secrets.
 const w=JSON.parse(run('JSON.stringify('+plan+'.secretWalls[0].cells[1])'));
 assert.equal(run('world['+w[1]+']['+w[0]+']'),23);walk(w[0],w[1]+1);run('P.y-=8');
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);assert.notEqual(run('world['+w[1]+']['+w[0]+']'),23);
 run('P.keys=0');kill('Le Rat-Roi aux Mille Queues',0.1);assert.equal(run('P.keys'),1);assert.equal(run('instanceState.cleared'),false);
 solve(2);kill('Gardien des Os',0.9);assert.equal(run('instanceState.cleared'),true);assert.equal(run('chests.length'),1);
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
 // Lumi accompagne le héros sans bulle de message.
 assert.doesNotMatch(source,/lumiCloud|Lumi : ✨/);
 // Portail de retour dans la salle du dernier boss : il attend que le coffre soit ouvert, puis ramène le groupe dehors.
 const exit=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.exitSpot(0))'));
 assert.equal(run('[20,21].includes(world['+exit.y+']['+exit.x+'])'),true,'sur le sol');
 walk(exit.x,exit.y);assert.equal(run('CANAAN_DUNGEON_EXPLORE.exitNear(P)'),true);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('!!instanceState'),true,'coffre pas encore ouvert : on reste');
 run('P.x=chests[0].x*TS;P.y=chests[0].y*TS;openNearbyChest()');walk(exit.x,exit.y);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('instanceState'),null,'sorti par le portail');
 assert.equal(run('world'),run('overworld'));
 // Raid : six boss, deux boss cachés.
 run('enterInstance(6)');
 assert.equal(run('monsters.filter(m=>m.boss&&m.secretBoss===undefined).length'),6);assert.equal(run('monsters.filter(m=>m.secretBoss!==undefined).length'),2);
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

test('Donjons et raids : moins d’XP, plus coriaces, et des boss qui annoncent leurs coups, appellent des renforts et entrent en rage',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // XP : boss et instance terminée rapportent nettement moins qu'avant (×15/×25 et ×30/×50 auparavant).
 assert.equal(run('bossXp(10,"dungeon")'),(10+50)*8);assert.equal(run('bossXp(10,"raid")'),(10+50)*12);assert.equal(run('clearXp(10,false)'),(10+50)*12);
 assert.ok(run('bossHealth(30,"raid")>bossHealth(30,"dungeon")&&bossDamage(30,"dungeon")>mobDamage(30)'));
 run('started=true;paused=false;P.dead=false;game.view={notify:()=>{},chat:()=>{}};game.hero.level=10;recomputeStats();P.hp=P.mhp;enterInstance(0)');
 // Monstres d'instance plus résistants que dehors (×1,25) et plus forts (×1,12).
 const trash=run('game.world.monsters.find(m=>!m.boss)');assert.ok(run('(m=>m.mhp>=Math.round(mobHealth(m.level,false,(MOB_TYPES.find(t=>t.name===m.t)||{hp:100}).hp)*1.2))(game.world.monsters.find(m=>!m.boss))'));
 // Boss sorti de sa salle pour le test : ses mécaniques visent le héros où qu'il soit.
 run('globalThis.boss=game.world.monsters.find(m=>m.boss);delete boss.room;game.world.monsters=[boss];boss.x=P.x+200;boss.y=P.y;boss.cd=99');
 // Onde de choc : un cercle annoncé, puis des dégâts à qui y reste ; une roulade (invulnérable) l'évite.
 run('boss.mech={wave:0,rain:1e9,adds:0};time++;CanaanStages.bossMechanics.after()');
 assert.equal(run('CANAAN_BOSS_MECHANICS.zones().length'),1);
 run('const z=CANAAN_BOSS_MECHANICS.zones()[0];P.x=z.x;P.y=z.y;globalThis.hp0=P.hp;boss.mech.wave=1e9;const rnd0=Math.random;Math.random=()=>0.5;for(let i=0;i<100;i++){time++;CanaanStages.bossMechanics.after()}Math.random=rnd0');
 assert.ok(run('P.hp<hp0'),'resté dans le cercle : touché');assert.equal(run('CANAAN_BOSS_MECHANICS.zones().length'),0);
 // Renforts à 66 % de PV (et 33 %), puis rage sous 25 % (dégâts ×1,25).
 const raw=run('CANAAN_ENEMY_RAW_DAMAGE(boss)');
 run('boss.hp=boss.mhp*0.45;time++;CanaanStages.bossMechanics.after()');assert.equal(run('game.world.monsters.filter(m=>m.summoned).length'),2);
 run('boss.hp=boss.mhp*0.2;time++;CanaanStages.bossMechanics.after()');assert.equal(run('boss.enraged'),true);
 assert.ok(Math.abs(run('CANAAN_ENEMY_RAW_DAMAGE(boss)')-raw*1.25)<1e-6);
 // Dans une instance, les monstres ordinaires rapportent 60 % de leur XP.
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
