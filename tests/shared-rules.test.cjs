const { test } = require('node:test');
const {
  fs,
  assert,
  path,
  version,
  source,
  scripts,
  script
} = require('./helpers/context.cjs');

test('Portée des modules : modules encapsulés, noms privés inaccessibles et noms publics exportés',()=>{
 const encapsulated={
  'canaan-world-settlements':{private:['campTent','campFire','campBench','campStall'],public:['drawCampAurore']},
  'canaan-world-generation':{private:['CENTER','PORTAL_SPOTS','BOSS_SPOTS','BIOME_MAP','terrain','worldMobAt'],public:['ZONES','PIXEL_PLACES','BRIDGE_TILES','regionAt','spawnMonsters','updateWorld','updateZoneDisplay','CANAAN_WORLD_AUDIT']},
  'canaan-map-panel':{private:['biomeLevelRange','instanceLine'],public:['toggleMap']},
  'canaan-sprite-kit':{private:['actor','WORLD_LOOKS','resolveLook','drawParticles','lightCanvas'],public:['canaanOutline','canaanActorSprite','drawCanaanActor','canaanLight','drawCanaanLighting','drawCanaanBossFrame']},
  'canaan-dungeons':{private:['THEMES','PLANS','planDungeon','drawFloorProp','membrane'],public:['makeDungeon','spawnInstanceBoss','onInstanceBossDown','drawDungeonTile','drawDungeonEntrance','dungeonAmbience','arenaLayout','CANAAN_DUNGEON_AUDIT']},
  'canaan-world-look':{private:['PAL','PRIORITY','fringe','paintTile','AMBIENCES'],public:['drawWorldTile','worldAmbience']},
  'canaan-artefacts':{private:['LIST','BY_ID','BY_WAVE','rt','worn','secondary','dot','tooltipHtml'],public:['CANAAN_ARTEFACTS','CANAAN_ARTEFACTS_STATE','equipArtefact','unequipArtefact','toggleArtefact','showArtefactTooltip','drawArtefact']},
  'canaan-arena':{private:['BOSSES','MOVES','HP_MULT','DMG_MULT','strike','tele','spawnBoss','onBossDown'],public:['CANAAN_ARENA','CANAAN_ARENA_STATE','enterArena','openArenaPortal']},
  'canaan-pixel-art':{private:['pixHash','PIX_COLORS','actorSprite','creatureSprite'],public:['PIXEL_TERRAIN','drawPixelMob','drawPixelRoads','drawHeroArt']},
  'canaan-monster-scaling':{private:['bossMaxHealth','setupMob','hpClock','instanceLevel'],public:['bossTier','scaleBossHp','canaanMobLevel','canaanSetupMob']},
  'canaan-progression':{private:['sharers','levelUp','SHARE'],public:['CANAAN_PROGRESSION','canaanKillXp','canaanGrantXp']},
  'canaan-stats':{private:['prepare','heroStrike','damageMonster','tooltip','table'],public:['characterStats','gearStat','gearScore','gearComparison','itemStatsOf','CANAAN_STATS_VIEW','canaanDamageTaken']},
  'canaan-merchants':{private:['CANAAN_MERCHANT_SPRITES'],public:['drawCanaanMerchant']},
  'canaan-controls':{private:['CANAAN_ACTIONS','touchDirections','actionInteger'],public:['dispatchCanaanAction','clearTouchControls']},
  'canaan-bootstrap':{private:['CANAAN_REQUIRED_MODULES','CANAAN_REQUIRED_BINDINGS','CANAAN_MODULES'],public:[]}
 };
 for(const id of Object.keys(encapsulated)){
  const code=script(id).replace(/^\s*(?:\/\/[^\n]*\n\s*)*/,'');
  assert.ok(code.startsWith('(() => {'),id+' : le module doit être encapsulé');
  assert.ok(code.trimEnd().endsWith('})();'),id+' : fin d’encapsulation attendue');
 }
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 for(const [id,names] of Object.entries(encapsulated)){
  for(const name of names.private)assert.equal(run('typeof '+name),'undefined',id+' : '+name+' devrait être privé');
  for(const name of names.public)assert.notEqual(run('typeof '+name),'undefined',id+' : '+name+' devrait être public');
 }
});

test('Version 1.9.0 : fonctions partagées définies une fois dans leur module, sans entrée en attente',()=>{
 const owners={
  'canaan-ui':['renderInventory','renderCharacter','charSlot','showGearTooltip','showEquippedTooltip'],
  'canaan-stats':['gearStat','gearScore','gearComparison','characterStats'],
  'canaan-equipment':['equipItem','unequip','equipReserveWeapon','switchWeapon'],
  'canaan-modules':['applyItemName'],'canaan-gear-engine':['giveGear'],'canaan-item-rules':['rarityRoll'],
  'canaan-economy':['dropTierGear'],'canaan-combat':['hit','monsterDamage'],'canaan-weapon-actions':['useSkill'],
  'canaan-class-talents':['renderTalents'],'canaan-world-map':['drawBigMap'],'canaan-map-panel':['toggleMap'],
  'canaan-portals':['openPortal']
 };
 assert.doesNotMatch(source,/pendingCanaanEntryPoint|canaanPending|Appel prématuré/);
 const bindings=script('canaan-bootstrap').slice(script('canaan-bootstrap').indexOf('CANAAN_REQUIRED_BINDINGS'));
 for(const [id,names] of Object.entries(owners))for(const name of names){
  const where=scripts.filter(m=>new RegExp('\\bfunction\\s+'+name+'\\s*\\(').test(m[2])).map(m=>/id="([^"]+)"/.exec(m[1])[1]);
  assert.deepEqual(where,[id],name);
  assert.doesNotMatch(source,new RegExp('(?:^|[^.\\w])'+name+'\\s*=[^=>]'),name+' réassigné');
  assert.doesNotMatch(bindings,new RegExp("'"+name+"'"),name+' encore dans les liaisons requises');
 }
 assert.ok(source.includes('<title>THE LEGEND OF NASHI V'+version+'</title>'));assert.doesNotMatch(source,/\{\{VERSION\}\}/);
 assert.doesNotMatch(source,/Statistiques Ratings52|STATS RATINGS52/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(g.document.title,'THE LEGEND OF NASHI V'+version);
 for(const names of Object.values(owners))for(const name of names)assert.equal(run('typeof '+name),'function',name);
});

test('Architecture : shared/ pur (aucun navigateur, aucun autre dossier), chargeable dans Node, exposé par le pont transitoire',async()=>{
 const root=path.join(__dirname,'..','src','canaan'),sharedDir=path.join(root,'shared');
 const files=[];
 (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.js'))files.push(p)}})(sharedDir);
 assert.ok(files.length>=4,'modules partagés');
 for(const file of files){
  const code=fs.readFileSync(file,'utf8'),rel=path.relative(root,file);
  // Règle de dépendance : shared n'utilise ni le navigateur, ni le stockage, ni Node, ni de variable globale.
  const bare=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
  assert.doesNotMatch(bare,/\b(?:window|document|globalThis|localStorage|sessionStorage|navigator|requestAnimationFrame|require)\b/,rel);
  for(const [,spec] of code.matchAll(/\bfrom\s+'([^']+)'/g)){
   assert.ok(spec.startsWith('.'),rel+' importe un paquet : '+spec);
   assert.ok(path.resolve(path.dirname(file),spec).startsWith(sharedDir+path.sep),rel+' sort de shared/ : '+spec);
  }
  // Chargeable sans écran (phase 2 : simulation dans Node).
  const mod=await import(require('node:url').pathToFileURL(file).href);
  // Un module de types JSDoc seuls (shared/types.js, « export {}; ») n'exporte aucune valeur.
  const typesOnly=/^export \{\};?$/m.test(code)&&!/^export (?:const|function|let|class)\b/m.test(code);
  assert.ok(typesOnly||Object.keys(mod).length>0,rel);
 }
 // Le pont importe uniquement des modules partagés (shared/) et des modules client convertis (client/), et chaque
 // export partagé arrive dans le jeu.
 const bridge=fs.readFileSync(path.join(root,'bridge.js'),'utf8');
 for(const [,spec] of bridge.matchAll(/\bfrom\s+'([^']+)'/g))assert.match(spec,/^\.\/(?:shared|client)\//);
 // Modules client : ils n'importent que shared/ et client/, et ne posent rien sur window (le pont expose leurs exports).
 // Un fichier de client/ encore listé comme script classique dans le manifeste (en cours de conversion) est exclu.
 const clientDir=path.join(root,'client'),classic=new Set(require('../src/canaan/manifest.json').modules.filter(m=>m.kind==='script').map(m=>path.join(root,m.file)));
 (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){walk(p);continue}if(!e.name.endsWith('.js')||classic.has(p))continue;
  const code=fs.readFileSync(p,'utf8'),rel=path.relative(root,p);
  for(const [,spec] of code.matchAll(/\bfrom\s+'([^']+)'/g)){const to=path.resolve(path.dirname(p),spec);assert.ok(to.startsWith(sharedDir+path.sep)||to.startsWith(clientDir+path.sep),rel+' importe hors de shared/ et client/ : '+spec)}
  assert.doesNotMatch(code.replace(/\/\/.*$/gm,''),/\b(?:window|globalThis)\.\w+\s*=[^=]/,rel+' pose une variable sur window');
  assert.match(code,/^export /m,rel+' sans export');
 }})(clientDir);
 const {g,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 for(const file of files){
  const mod=await import(require('node:url').pathToFileURL(file).href);
  // Une fiche de donjon (export par défaut, shared/data/dungeons/) arrive dans le jeu par la liste DUNGEONS.
  for(const [name,value] of Object.entries(mod))if(name!=='default')assert.equal(JSON.stringify(g[name]),JSON.stringify(value),name);
 }
 // Le build regroupe les modules ES avec esbuild, version épinglée.
 assert.match(JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8')).devDependencies.esbuild,/^\d+\.\d+\.\d+$/);
 assert.match(source,/<script id="canaan-modules">\n\(\(\) => \{/);
});

test('Catalogues partagés gelés : donjons copiés pour chaque partie, monstres, boss, économie, classes et statistiques',async()=>{
 const url=f=>require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href;
 const world=await import(url('data/world.js')),economy=await import(url('data/economy.js')),classes=await import(url('data/classes.js'));
 const stats=await import(url('data/stats.js')),rules=await import(url('rules/stats.js'));
 for(const value of [world.INSTANCE_DEFS,world.INSTANCE_DEFS[9].difficulties.heroic,world.MOB_TYPES[0],world.WORLD_BOSS_DEFS[0],economy.SOURCE_REWARDS.normal,economy.LEGACY_MATERIAL_GOLD,economy.BAG_PRICES,classes.CLASSES[0].talents[0],classes.CLASSES[3].elements,classes.ELEMENTS.ice,stats.PRIMARY_STATS.attack,stats.SLOT_PROFILE.weapon,stats.ZONE_LEVELS[0],stats.QUALITY_FACTOR])
  assert.equal(Object.isFrozen(value),true);
 // Chaque partie reçoit sa propre liste de donjons, modifiable par la génération de l'île.
 const a=world.createInstances(),b=world.createInstances();
 a[0].x=42;a[9].difficulties.normal.hp=9;assert.equal(b[0].x,0);assert.equal(world.INSTANCE_DEFS[9].difficulties.normal.hp,1);
 assert.equal(Object.isFrozen(a[0]),false);assert.equal(a.length,14);assert.equal(world.WORLD_BOSS_DEFS.length,8);assert.equal(world.MOB_TYPES.length,47);
 assert.equal(world.BOSS_RESPAWN_MS,720000);assert.equal(economy.BAG_PRICES.length,9);assert.equal(classes.CLASSES.length,7);assert.deepEqual(classes.TALENT_SLOT_LEVELS,[1,10,20,30,40]);
 assert.equal(stats.PRIMARY_KEYS.length,3);assert.equal(stats.SECONDARY_KEYS.length,6);assert.equal(stats.MAX_LEVEL,60);
 assert.deepEqual(stats.ZONE_LEVELS.map(z=>z.join('-')),['1-10','10-20','20-30','30-40','40-50','50-60','60-60']);assert.equal(rules.xpToNext(60),0);
 // Dans le jeu, les portails sont placés sur la copie, jamais sur le catalogue.
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.ok(run('instances.every(d=>d.x>0&&d.y>0)'));assert.ok(run('INSTANCE_DEFS.every(d=>d.x===0&&d.y===0)'));
 assert.ok(run('WORLD_BOSSES.every(b=>!Object.isFrozen(b))'));
});

test('Règles partagées dans Node : objets, statistiques, niveaux, XP, économie et classes, identiques au jeu',async()=>{
 const url=f=>require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href;
 const items=await import(url('rules/items.js')),stats=await import(url('rules/stats.js'));
 const economy=await import(url('rules/economy.js')),classRules=await import(url('rules/classes.js'));
 // Objets : qualité, niveau, tirage déterministe, type d'arme, nom affiché (sans amélioration).
 assert.equal(items.rarityInfo({rarity:'Inconnue'}).name,'Commun');
 assert.deepEqual([items.itemLevel({level:0}),items.itemLevel({level:45}),items.itemLevel({level:99}),items.itemLevel(null)],[1,45,63,0]);
 // Niveau requis : celui de l'objet, sans dépasser 60 (les pièces Mythiques de Valérion sont de niveau 63).
 assert.deepEqual([items.requiredLevel({level:45}),items.requiredLevel({level:63}),items.requiredLevel(null)],[45,60,0]);
 assert.ok(stats.statBase(63,'Mythique')>stats.statBase(60,'Mythique'));
 const seq=values=>{let i=0;return()=>values[i++]};
 assert.equal(items.rollRarity(()=>0).name,'Commun');assert.equal(items.rollRarity(()=>0.9905).name,'Épique');assert.equal(items.rollRarity(()=>0.99999).name,'Épique');
 const w={slot:'weapon',weaponType:'fronde'};items.ensureWeaponType(w);assert.equal(w.weaponType,'sword');
 assert.equal(items.gearDisplayName({slot:'helm',name:'Heaume',upgrade:2}),'Heaume');
 for(const gone of ['upgradeLevel','upgradeCost','upgradable','tierIlvl','averageIlvlOf','effectiveIlvl'])assert.equal(gone in items,false,gone);
 // Équipement : principales fixées par niveau et qualité ; secondaires tirées (deux différentes, dans la plage).
 const sword={slot:'weapon',level:45,rarity:'Légendaire'};
 assert.deepEqual(stats.itemPrimary(sword),{attack:196,defense:122,vitality:147});
 assert.deepEqual(stats.secondaryRange(45,'Légendaire'),[29,79]);
 const sec=stats.rollSecondaries(45,'Légendaire',seq([0,0,0.99,0.99]));assert.deepEqual(sec,{power:29,resist:79});
 assert.equal(stats.validSecondaries(sec),true);assert.equal(stats.validSecondaries({power:3,power2:4}),false);assert.equal(stats.validSecondaries({crit:5}),false);
 // Statistiques du héros : points convertis selon son niveau ; Défense contre le niveau de l'attaquant, jamais 100 %.
 const st=stats.heroStats(45,[{...sword,sec}],300);
 assert.equal(st.attack,Math.round(16+2*45+196*0.15));assert.equal(st.maxHp,Math.round(90+14*45+147*1.6));assert.equal(st.maxMp,300);
 assert.ok(Math.abs(st.damageBonus-29/stats.pointsPerPercent(45))<1e-9);assert.ok(st.resist>0&&st.resist<100);assert.equal(st.mastery,0);
 assert.ok(stats.defenseReduction(1e9,60)<1&&stats.defenseReduction(500,10)>stats.defenseReduction(500,60));
 // Monstres et XP : plus fort avec le niveau ; l'XP ralentit par tranche, un monstre trop faible rapporte peu.
 assert.ok(stats.mobHealth(60)>stats.mobHealth(1)&&stats.mobDamage(60)>stats.mobDamage(1));
 assert.ok(stats.bossHealth(30,'raid')>stats.bossHealth(30,'dungeon'));
 assert.ok(stats.xpToNext(55)/stats.mobXp(55,55)>5*stats.xpToNext(5)/stats.mobXp(5,5),'plus exigeant en fin de parcours');
 assert.ok(stats.mobXp(10,30)<stats.mobXp(30,30)*0.2);
 const hero={level:1,exp:0};assert.equal(stats.addXp(hero,stats.xpToNext(1)+stats.xpToNext(2)),2);assert.deepEqual(hero,{level:3,exp:0});
 const top={level:59,exp:0};stats.addXp(top,1e9);assert.deepEqual(top,{level:60,exp:0},'niveau 60 au maximum');
 assert.equal(stats.levelFromIlvl(190),60);assert.equal(stats.levelFromIlvl(1),1);
 // Économie et classes : anciens matériaux rendus en or, prix, emplacements de talents par niveau, effets non cumulables.
 const prices={ore:10,wood:10,essence:50,core:200};
 assert.equal(economy.legacyMaterialGold({ore:3,wood:2,essence:1,core:1},prices),300);
 assert.equal(economy.legacyMaterialGold({ore:'Infinity',wood:-4,core:'2'},prices),400);assert.equal(economy.legacyMaterialGold(null,prices),0);
 assert.equal(economy.lootRarity('dungeon').name,'Rare');assert.equal(economy.lootRarity('chest').name,'Peu commun');
 assert.equal(economy.shopPriceAt(10),350);assert.equal(economy.shopPriceAt(60),1350);assert.equal(classRules.talentSlotsAt(1),1);assert.equal(classRules.talentSlotsAt(25),3);assert.equal(classRules.talentSlotsAt(60),5);
 assert.deepEqual(classRules.sanitizeClasse({id:'assassin',talents:[3,3,9,10]},20),{id:'assassin',talents:[3,9]});
 assert.deepEqual(classRules.sanitizeClasse(null,60),{id:null,talents:[]});
 assert.deepEqual(classRules.refreshDot({dps:5,until:10},3,12),{dps:5,until:12});assert.deepEqual(classRules.refreshDot(null,3,12),{dps:3,until:12});
 // Le jeu passe par ces mêmes règles : mêmes résultats que les appels directs.
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('game.hero.level=45;equipment={...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,null])),weapon:'+JSON.stringify({id:'w',...sword,weaponType:'bow',sec})+'}');
 const game=JSON.parse(run('JSON.stringify({stats:(()=>{const s=characterStats();return {maxHp:s.maxHp,attack:s.attack,defense:s.defense}})(),sell:gearSellValue(equipment.weapon),shop:shopPrice()})'));
 assert.deepEqual(game.stats,{maxHp:st.maxHp,attack:st.attack,defense:st.defense});
 assert.equal(game.sell,economy.sellValue({rarity:'Légendaire'},45));assert.equal(game.shop,economy.shopPriceAt(45));
});

test('Objet game : game.hero porte le héros, statistiques de n’importe quel héros, anciens noms globaux disparus du jeu',()=>{
 // Plus aucun script n'utilise ni ne définit les anciens noms globaux : seuls les tests gardent ces raccourcis
 // (tests/helpers/canaan-runtime.cjs).
 // Analyse des portées (eslint-scope) sur tous les scripts du manifeste : une variable locale du même nom ne compte
 // pas, une lecture du nom global compte toujours (y compris dans ...monsters ou { monsters }).
 const espree=require('espree'),escope=require('eslint-scope');
 const legacy=new Set(['equipment','inventory','materials','kills','world','decor','overworld','overdecor','monsters','projectiles','drops','npcs','chests','openedChests','worldBossTimers','instanceState','returnPos','worldClock']);
 const root=path.join(__dirname,'..','src','canaan'),dir=path.join(root,'scripts');
 const uses=[];
 for(const m of require('../src/canaan/manifest.json').modules.filter(m=>m.kind==='script')){
  const code=fs.readFileSync(path.join(root,m.file),'utf8');
  const ast=espree.parse(code,{ecmaVersion:2024,sourceType:'script',range:true,loc:true});
  for(const scope of escope.analyze(ast,{ecmaVersion:2024}).scopes)for(const ref of scope.references)
   if(!ref.resolved&&legacy.has(ref.identifier.name))uses.push(m.file+':'+ref.identifier.loc.start.line+' '+ref.identifier.name);
 }
 assert.deepEqual(uses,[],'anciens noms globaux encore lus');
 // Le jeu chargé sans les raccourcis des tests : aucun de ces noms n'existe.
 const bare=require('./helpers/canaan-runtime.cjs')(source,{testNames:false});
 assert.deepEqual(bare.errors,[]);
 assert.deepEqual([...legacy].filter(name=>bare.run('typeof '+name)!=='undefined'),[],'anciens noms encore définis par le jeu');
 assert.equal(bare.run('typeof CANAAN_LEGACY_NAMES'),'undefined');
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('game.hero.player===P'),true);
 // Le monde : carte, entités simulées, coffres, boss de monde et instance, regroupés dans game.world.
 assert.equal(run('world===game.world.tiles&&monsters===game.world.monsters&&npcs===game.world.npcs&&openedChests===game.world.openedChests'),true);
 assert.ok(run('game.world.tiles.length===MAPH&&game.world.monsters.length>0&&game.world.npcs.length>0'));
 run('instanceState={index:2}');assert.equal(run('game.world.instance.index'),2);run('game.world.instance=null');assert.equal(run('instanceState'),null);
 run('kills=5');assert.equal(run('game.hero.kills'),5);
 // Les effets d'affichage restent hors du monde simulé.
 assert.equal(run('"particles" in game.world||"floaters" in game.world'),false);
 // Classe, artéfacts et records de l'Arène : état sauvegardé du héros dans game.hero, plus aucune copie dans les modules.
 for(const [file,names] of [['class-talents.js','classe|talents'],['arena-artefacts.js','ranks|equipped'],['arena.js','state']])
  assert.doesNotMatch(fs.readFileSync(path.join(dir,file),'utf8'),new RegExp('\\blet\\s+(?:'+names+')\\b'),file);
 run("game.hero.level=20;CANAAN_CLASS_STATE.import({id:'paladin',talents:[1,6]})");
 assert.equal(run('JSON.stringify(game.hero.classe)'),JSON.stringify({id:'paladin',talents:[1,6]}));
 assert.equal(JSON.stringify(run('CANAAN_CLASS.audit().talents')),'[1,6]');
 run("CANAAN_ARTEFACTS_STATE.import({ranks:{coeur_fer:2,croc_ombres:1},equipped:['coeur_fer','croc_ombres',null,null]})");
 assert.equal(run('game.hero.artefacts.ranks.coeur_fer'),2);assert.equal(run('CANAAN_ARTEFACTS.equipped().includes("croc_ombres")'),true);
 run('CANAAN_ARTEFACTS.grant(7)');assert.equal(run('game.hero.artefacts.ranks.oeil_tempetes'),1);
 run("CANAAN_ARENA_STATE.import({best:7,attempts:3,completed:false,lastBoss:'Zephiron'})");
 assert.equal(run('game.hero.arena.best+"/"+game.hero.arena.attempts'),'7/3');assert.equal(run('CANAAN_ARENA.state().lastBoss'),'Zephiron');
 // La sauvegarde lit ces mêmes états.
 const hero=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot().heros.hote)'));
 assert.deepEqual(hero.classe,{id:'paladin',talents:[1,6]});assert.equal(hero.artefacts.ranks.oeil_tempetes,1);assert.equal(hero.arena.best,7);assert.equal(run('equipment===game.hero.equipment&&inventory===game.hero.inventory'),true);
 // Remplacer par l'ancien nom met à jour game.hero (sauvegarde, tests et anciens scripts).
 run('inventory=[{id:"z",slot:"ring",level:5}]');assert.equal(run('game.hero.inventory[0].id'),'z');
 // Statistiques d'un autre héros : son équipement seul, sans la classe ni les artéfacts de l'hôte.
 run('equipment={...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,null]))}');
 const host=run('characterStats().maxHp');
 run('globalThis.ally={level:40,player:{},inventory:[],equipment:{...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,{id:"a"+k,slot:itemSlotOf(k),level:40,rarity:"Héroïque",weaponType:"bow"}]))}}');
 assert.ok(run('characterStats(ally).maxHp')>host);assert.equal(run('characterStats().maxHp'),host);
 assert.equal(run('characterStats(ally).level'),40);assert.ok(run('characterStats(ally).primary.vitality')>0);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Simulation sans écran : intention du héros, monstres, projectiles et butins avancent sans jamais toucher au document',()=>{
 const {g,run,errors,nodes}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Une partie en cours, loin du camp, avec un monstre proche, un projectile et de l'or au sol.
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;canaanRegenRates=()=>({mana:0,health:0})');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++)if(canWalk((x+0.5)*TS,(y+0.5)*TS)&&canWalk((x+3.5)*TS,(y+0.5)*TS)&&!isSafe(x,y)&&Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30){s={x,y};break}P.x=(s.x+0.5)*TS;P.y=(s.y+0.5)*TS}');
 run('game.world.monsters=[{t:"Loup",x:P.x+90,y:P.y,hp:500,mhp:500,r:14,cd:0,g:3}];game.world.drops=[{x:P.x,y:P.y,v:7,life:300}]');
 run('game.world.projectiles=[{x:P.x,y:P.y,vx:6,vy:0,dmg:40,life:60,c:"#fff",combatContext:{magic:false}}]');
 const messages=[];g.__messages=messages;
 run('globalThis.__view=game.view;game.view={notify:m=>__messages.push(m),chat:()=>{}}');
 // Succès coupés : leurs récompenses en or fausseraient le compte (ils sont testés à part).
 run('CanaanStages.achievements={after(){}}');
 const x0=run('P.x'),gold0=run('P.gold'),hp0=run('P.hp');
 // Plus aucun écran : tout accès au document échoue.
 const screen=g.document;g.document=new Proxy({},{get(_t,key){throw new Error('accès à l’écran pendant la simulation : document.'+String(key))}});
 try{
  run('game.hero.intent.dx=1;game.hero.intent.dy=0');
  // PV le plus bas pendant la simulation (une montée de niveau rend tous les PV).
  run('globalThis.__minHp=P.hp');
  // Hasard reproductible : esquives et déviations ne laissent jamais le loup sans toucher.
  run('Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})()');
  for(let i=0;i<600;i++)run('time++;simulateStep();updateWorld();__minHp=Math.min(__minHp,P.hp)');
 }finally{g.document=screen}
 assert.ok(run('P.x')>x0,'le héros suit son intention');
 assert.equal(run('P.gold'),gold0+7);assert.ok(messages.includes('+7 or'),'le message passe par game.view');
 assert.ok(run('__minHp')<hp0,'le monstre a frappé');assert.equal(run('game.world.projectiles.length'),0);
 assert.equal(errors.length,0,errors.join('\n'));
 // Avec l'interface, le même relais affiche les messages à l'écran.
 run('game.view=__view;toast("Coffre ouvert")');
 assert.equal(nodes.get('toast').textContent,'Coffre ouvert');assert.equal(nodes.get('toast').style.opacity,1);
 assert.doesNotMatch(source.slice(source.indexOf('function update() {'),source.indexOf('function updateView() {')),/document\.|getElementById|keys\[|mouseWorld|camX|shake/);
});
