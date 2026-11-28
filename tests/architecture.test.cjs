const { test } = require('node:test');
const {
  fs,
  vm,
  assert,
  path,
  version,
  builtFile,
  source,
  scripts,
  script
} = require('./helpers/context.cjs');

test('Les blocs JavaScript compilent ensemble et séparément', () => {
  assert.ok(scripts.length>0);
  for (const m of scripts) new vm.Script(m[2]);
  new vm.Script(scripts.map(m => m[2]).join('\n;\n'));
});

test('Consolidation : une seule implémentation pour chaque fonction des systèmes migrés',()=>{
  for(const name of ['renderInventory','renderCharacter','charSlot','showGearTooltip','showEquippedTooltip','gearStat','gearScore','gearComparison','equipItem','unequip']){
    const bodies=[...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))];
    assert.equal(bodies.length,1,name);
    assert.equal(new RegExp('\\bconst\\s+\\w+\\s*=\\s*'+name+'\\s*;').test(source),false,'capture de '+name);
  }
  assert.equal(/function\s+gearItemHTML\s*\(/.test(source),false);
});

test('Chargement complet : modules, panneaux et équipement sans chaîne historique',()=>{
  const boot=require('./helpers/canaan-runtime.cjs');
  let earlyChecks=0;
  const runtime=boot(source,{beforeScript(script,run){
    if(!script[1].includes('id="canaan-weapon-actions"'))return;
    // Juste après le cœur, tous ces points d'entrée attendent encore leur propriétaire.
    const owners={
      characterStats:'canaan-stats',useSkill:'canaan-weapon-actions',drawBigMap:'canaan-world-map',
      hit:'canaan-combat',dropTierGear:'canaan-economy',
      renderInventory:'canaan-ui',renderCharacter:'canaan-ui',charSlot:'canaan-ui',
      showGearTooltip:'canaan-ui',showEquippedTooltip:'canaan-ui',
      gearStat:'canaan-stats',gearScore:'canaan-stats',gearComparison:'canaan-stats',
      equipItem:'canaan-equipment',unequip:'canaan-equipment'
    };
    // Règle partagée (shared/rules/items.js) : disponible dès le départ, avant tous les scripts classiques.
    assert.equal(run('typeof applyItemName'),'function');
    for(const [name,owner] of Object.entries(owners)){
      // Avant son module propriétaire, la fonction n'existe pas encore : aucun bouchon ni repli.
      assert.equal(run('typeof '+name),'undefined',name+' ('+owner+')');
      assert.throws(()=>run(name+'()'),/is not defined/);
      earlyChecks++;
    }
  }}),{g,nodes,run}=runtime;
  assert.equal(earlyChecks,15);
  assert.equal(runtime.errors.length,0,runtime.errors.join('\n'));
  assert.equal(g.CANAAN_READY,true);assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  // Un export manquant est refusé par la validation, puis accepté une fois rétabli.
  const installedUi=g.CANAAN_UI;g.CANAAN_UI=undefined;
  assert.throws(()=>g.CANAAN_BOOTSTRAP.validate(),/interface : CANAAN_UI\.openInventory attendu function/);
  g.CANAAN_UI=installedUi;assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  assert.equal(g.CANAAN_UI.openInventory,run('renderInventory'));
  assert.equal(g.CANAAN_EQUIPMENT.equip,run('equipItem'));
  const counters={saves:0,stats:0,bars:0,panels:0};
  const originalSave=run('saveGame'),originalStats=run('recomputeStats'),originalBar=run('refreshWeaponBar');
  g.testCounters=counters;g.testSave=originalSave;g.testStats=originalStats;g.testBar=originalBar;
  run("saveGame=function(){testCounters.saves++;return testSave()};recomputeStats=function(){testCounters.stats++;return testStats()};refreshWeaponBar=function(){testCounters.bars++;return testBar()}");
  // Les panneaux sont construits directement, y compris les contrôles de réserve et de vente.
  g.CANAAN_UI.openInventory();
  let html=nodes.get('window').innerHTML;
  assert.ok(!html.includes('bag-upgrade'),'l’agrandissement du sac s’achète chez le marchand');assert.ok(!html.includes('Arme 2'),'plus d’arme de réserve');
  // La vente se fait chez le marchand : plus de bouton 🪙 dans le sac ; chaque pièce a son menu du clic droit (démanteler…).
  assert.equal((html.match(/class="bag-sale"/g)||[]).length,0);assert.equal((html.match(/data-menu="gear"/g)||[]).length,1);
  assert.equal((html.match(/class="bag-cell empty"/g)||[]).length,19);
  assert.equal(g.CANAAN_UI.inspect().panel,'inventory');
  run("inventory[0].name='<img src=x onerror=alert(1)>';inventory[0].weaponType='bow'");
  g.CANAAN_UI.openInventory();html=nodes.get('window').innerHTML;
  assert.ok(!html.includes('<img src=x'));
  // Une opération produit une sauvegarde et un recalcul, sans rendre de mana.
  run('P.mp=7;equipItem(inventory[0].id)');
  assert.equal(counters.saves,1);assert.equal(counters.stats,1);assert.equal(counters.bars,0,'une armure ne change pas la barre');
  assert.equal(run('P.mp'),7);assert.equal(run('inventory.length'),0);
  assert.equal(run('equipment.armor.slot'),'armor');
  g.CANAAN_UI.openCharacter();html=nodes.get('window').innerHTML;
  // Fiche : deux tableaux (3 principales, 6 secondaires), en points, sans pourcentage.
  assert.equal((html.match(/class="stat-table"/g)||[]).length,2);assert.equal((html.match(/class="stat-desc"/g)||[]).length,9);
  // Chaque statistique explique ce qu'elle fait, sous son nom (pas d'info-bulle).
  assert.ok(html.includes('Augmente les PV maximum.')&&html.includes('Augmente la vitesse d’attaque et réduit les temps de recharge.')&&!html.includes('title="Réduit les dégâts reçus."'));
  assert.ok(html.includes('Statistiques principales')&&html.includes('Statistiques secondaires'));
  assert.ok(!/stats-panel[\s\S]*%/.test(html),'aucun pourcentage dans les tableaux');
  assert.equal((html.match(/class="equip-square/g)||[]).length,9);
  assert.ok(!html.includes('Arme 2'));assert.ok(html.includes('Arme de classe'));
  assert.ok(!html.includes('undefined'));assert.equal(g.CANAAN_UI.inspect().panel,'character');
  // Retrait : même identité d'objet, une écriture par action ; l'arme de classe ne se retire pas.
  run("closePanels();started=true;unequip('armor')");assert.equal(counters.saves,2);assert.equal(counters.stats,2);
  assert.equal(run('equipment.armor'),null);assert.equal(run('P.mp'),7);
  run('CANAAN_CLASS_STATE.import({id:"guerrier",talents:[]})');assert.equal(run("unequip('weapon')"),false);
  assert.equal(run('equipment.weapon.weaponType'),'dualsword');
  // Deux bagues : la première va dans la Bague 1, la suivante dans la Bague 2 ; l'info-bulle compare une nouvelle bague
  // à celle qu'elle remplacerait.
  run("inventory.push({id:'ring-a',name:'A',slot:'ring',rarity:'Commun',level:1},{id:'ring-b',name:'B',slot:'ring',rarity:'Commun',level:1},{id:'ring-c',name:'C',slot:'ring',rarity:'Rare',level:1})");
  run("equipItem('ring-a');equipItem('ring-b')");
  assert.equal(run('equipment.ring.id'),'ring-a');assert.equal(run('equipment.ring2.id'),'ring-b');
  assert.equal(run("wornAgainst(inventory.find(it=>it.id==='ring-c')).id"),'ring-a');
  run("equipItem('ring-c',game.hero,'ring2')");assert.equal(run('equipment.ring2.id'),'ring-c');
  assert.ok(run("inventory.some(it=>it.id==='ring-b')"),'la bague remplacée revient au sac');
  run("showGearTooltip(inventory.findIndex(it=>it.id==='ring-b'),{clientX:1,clientY:1})");
  assert.ok(nodes.get('gearHoverTooltip')===undefined); // L'infobulle est créée par createElement.
  assert.ok(run("gearTooltip.innerHTML.includes('Comparaison')"));
  run("showGearTooltip(0,{clientX:1,clientY:1})");assert.ok(run("gearTooltip.innerHTML.includes('Attaque')&&gearTooltip.innerHTML.includes('Niveau requis')"));
  run("closePanels()");assert.equal(run('gearTooltip.style.display'),'none');
  // Échecs sans effet de bord : objet absent, sac plein, vente périmée ou refusée.
  const savesBefore=counters.saves;
  assert.equal(run("equipItem('absent')"),false);assert.equal(counters.saves,savesBefore);
  run("window.savedInventory=inventory;window.savedWeapon=equipment.weapon;equipment.weapon=equipment.weapon2;inventory=Array.from({length:BAG_LIMIT},(_,i)=>({id:'full'+i,slot:'armor',ilvl:1}))");
  assert.equal(run("unequip('weapon')"),false);assert.equal(counters.saves,savesBefore);
  run("inventory=window.savedInventory;equipment.weapon=window.savedWeapon");
  assert.equal(g.sellInventoryCell(0,'obsolete'),false);assert.equal(counters.saves,savesBefore);
  g.testMerchant=run('nearMerchant');
  run('nearMerchant=function(){return false}');
  assert.equal(g.sellInventoryCell(0,run('String(inventory[0].id)')),false);
  run('nearMerchant=function(){return true};inventory.push({id:"confirm-sale",name:"Rare",slot:"armor",ilvl:120,rarity:"Légendaire"})');
  // Légendaire : la fenêtre de confirmation du jeu (canaanConfirm) vend seulement après « Vendre ».
  let asked=null;g.canaanConfirm=(text,yes)=>{asked={text,yes};return false};
  assert.equal(g.sellInventoryCell(run('inventory.length-1'),'confirm-sale'),false);assert.equal(counters.saves,savesBefore);assert.match(asked.text,/Vendre .* or \?/);
  assert.equal(asked.yes(),true);assert.equal(counters.saves,savesBefore+1);assert.equal(asked.yes(),false);
  run('nearMerchant=testMerchant');
  // Le texte passe par l'échappement HTML même sans normalisation préalable.
  run("inventory[0].name='<img src=x onerror=alert(1)>';showGearTooltip(0,{clientX:1,clientY:1})");
  assert.ok(run("gearTooltip.innerHTML.includes('&lt;img')"));assert.ok(!run("gearTooltip.innerHTML.includes('<img')"));
  run('P.gold=400;buyBagUpgrade()');
  assert.equal(run('BAG_LIMIT'),30);assert.equal(run('P.gold'),0);
  assert.equal((nodes.get('window').innerHTML.match(/class="bag-cell empty"/g)||[]).length,run('BAG_LIMIT-inventory.length'));
  assert.equal(runtime.errors.length,0,runtime.errors.join('\n'));
  // Le parcours de récupération fonctionne aussi avec tous les modules réels chargés.
  const persistence=g.CANAAN_PERSISTENCE,broken='{sauvegarde-interface';
  g.localStorage.setItem(persistence.key,broken);
  assert.equal(run('loadGame()'),false);assert.equal(nodes.get('saveRecovery').hidden,false);
  assert.equal(run('saveGame()'),false);
  let reloads=0;g.location.reload=()=>reloads++;
  assert.equal(persistence.restartFresh(),true);assert.equal(reloads,1);
  assert.equal(g.localStorage.getItem(persistence.lastBackupKey),broken);
  assert.equal(nodes.get('saveRecovery').hidden,true);
  assert.equal(run('loadGame()'),true);assert.equal(run('saveGame()'),true);
  assert.equal(run('inventory.length'),1,'une tunique : l’arme vient de la classe');assert.equal(run('P.gold'),0);assert.equal(run('BAG_LIMIT'),20);
  assert.equal(run('characterStats().level'),1);assert.equal(run('P.mhp'),104);
  assert.equal(run('inventory.every(item=>Object.keys(item.sec).length===2&&item.level===1)'),true);
  assert.equal(runtime.errors.length,1); // L'erreur de lecture volontaire est signalée.
});

test('Ratings52 uniquement : aucun ancien moteur de dégâts, rééquilibrage ou butin',()=>{
  assert.equal(/\bst\.strength\b|\bilvlStats\b|\brebalanceItem\b|\brebalanceAllGear\b|_balancedVersion\s*=\s*30/.test(source),false);
  for(const name of ['hit','dropTierGear'])
   assert.equal([...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))].length,1,name);
  assert.equal(/\bitem\.(?:atk|def|str|int|agi|vit|crit|haste|mastery|versatility|speed)\s*=/.test(source),false);
});

test('Dépendances obligatoires : pas de garde optionnelle ni de fallback de module',()=>{
  assert.equal(/\bwindow\.CANAAN_[A-Z0-9_]+\?\./.test(source),false);
  assert.equal(/\btalents\?\.before|\bOFFICIAL_NAMES_1820\b/.test(source),false);
  const boot=script('canaan-bootstrap');
  assert.ok(boot.indexOf('window.CANAAN_BOOTSTRAP.validate();')>=0&&boot.indexOf('window.CANAAN_BOOTSTRAP.validate();')<boot.indexOf('loaded = loadGame()'));
});

test('Modules réellement absents : une erreur agrégée visible et aucun démarrage ni sauvegarde',()=>{
  let broken=source;
  for(const id of ['canaan-stats','canaan-gear-engine','canaan-artefacts']){
    const pattern=new RegExp('(<script\\b[^>]*id="'+id+'"[^>]*>)[\\s\\S]*?(</script>)');
    assert.ok(pattern.test(broken),id);broken=broken.replace(pattern,'$1\n$2');
  }
  const {g,nodes,errors,run}=require('./helpers/canaan-runtime.cjs')(broken);
  assert.equal(errors.length,1,errors.join('\n'));
  for(const name of ['CANAAN_STATS_PREPARE','CANAAN_GEAR_ENGINE.normalize','CANAAN_ARTEFACTS.stats']){
    assert.ok(g.CANAAN_BOOT_ERROR.includes(name),name);
  }
  assert.equal(g.CANAAN_READY,false);assert.equal(run('started'),false);assert.equal(run('canaanLastFrame'),null);
  assert.equal(g.localStorage.getItem('canaan_dev_18999_state'),null);
  const title=nodes.get('title');
  assert.ok(title.querySelector('p').textContent.includes(g.CANAAN_BOOT_ERROR));
  assert.equal(nodes.get('slotMenu').hidden,true);assert.equal(nodes.get('slotMenu').innerHTML,'');
  assert.throws(()=>run('startGame()'),/Dépendances obligatoires/);
});

test('Sources modulaires : HTML généré à jour et identifiants descriptifs',()=>{
  const {spawnSync}=require('node:child_process');
  const result=spawnSync(process.execPath,['tools/build.cjs','--check'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(/<(?:script|style)\b[^>]*id="[^"]*v\d/.test(source),false);
  for(const name of ['hit','useSkill','drawBigMap','applyItemName']){
    assert.equal([...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))].length,1,name);
    assert.equal(new RegExp('\\bconst\\s+\\w+\\s*=\\s*'+name+'\\s*;').test(source),false,name);
  }
});

test('Version actuelle, actions sans onclick et CSS sans important',()=>{
 // Sources formatées : aucune ligne démesurée dans le code assemblé (les longues chaînes HTML restent tolérées jusqu'à 400 caractères).
 // Le bloc des modules ES est réécrit par esbuild : ce sont ses sources (shared/, client/, le pont) qui sont vérifiées.
 for(const m of scripts)if(!m[1].includes('"canaan-modules"'))for(const line of m[2].split('\n'))assert.ok(line.length<=400,m[1]+' : ligne de '+line.length+' caractères');
 const esSources=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.js'))esSources.push(f)}})(path.join(__dirname,'..','src','canaan','shared'));
 (function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.js'))esSources.push(f)}})(path.join(__dirname,'..','src','canaan','client'));
 esSources.push(path.join(__dirname,'..','src','canaan','bridge.js'));
 for(const f of esSources)fs.readFileSync(f,'utf8').split('\n').forEach((line,i)=>assert.ok(line.length<=400,f+':'+(i+1)+' : ligne de '+line.length+' caractères'));
 assert.ok(script('canaan-runtime-config').includes("CANAAN_VERSION = '"+version+"'"));
 assert.doesNotMatch(source,/\bonclick\s*=\s*["']/i);
 assert.doesNotMatch(source,/!important/);
 // Le CSS vit dans les feuilles du template ; le JavaScript n'injecte ni feuille ni style en ligne complet.
 assert.doesNotMatch(source,/createElement\(\s*['"]style['"]\s*\)|\.style\.cssText\s*=/);
 const head=source.slice(0,source.indexOf('</head>'));
 const order=['canaan-palette','canaan-interface-style','canaan-panels-style'].map(id=>head.indexOf('<style id="'+id+'">'));
 assert.ok(order.every((at,i)=>at>=0&&(i===0||at>order[i-1])),String(order));
 // Un seul thème : la palette est la première feuille, aucune feuille ne repeint les autres par-dessus.
 assert.equal([...head.matchAll(/<style id="([^"]+)"/g)][0][1],'canaan-palette');
 assert.doesNotMatch(head,/canaan-rpg-theme/);
 assert.match(head,/#regionBanner\s*\{\s*position:\s*fixed/);
 // Styles en ligne : aucun dans le balisage, et seulement des valeurs calculées dans le HTML généré.
 const markup=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 assert.doesNotMatch(markup,/\sstyle="/);
 for(const m of scripts)for(const [,value] of m[2].matchAll(/style="([^"]*)"/g)){
  assert.ok(/'\s*\+/.test(value)||value==='display:none',m[1]+' : style statique '+value);
 }
 assert.doesNotMatch(source,/correct1820|applyNames1735|craftGear1742|updateBagLimit1739/);
 // Sans le générateur du monde, la validation du démarrage échoue et nomme la liaison manquante.
 const {run}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(run('CANAAN_BOOTSTRAP.validate()'),true);
 run('globalThis.__rnd=worldRnd;worldRnd=undefined');
 try{assert.throws(()=>run('CANAAN_BOOTSTRAP.validate()'),/monde : worldRnd attendu function/)}finally{run('worldRnd=__rnd')}
});

test('Nettoyage : systèmes morts absents et progression par équipement conservée',()=>{
 const boot=require('./helpers/canaan-runtime.cjs');
 const {g,run,errors}=boot(source,{beforeScript(part,run){
  if(!part[1].includes('id="canaan-world-entities"'))return;
  for(const name of ['openPortal','toggleMap','rarityRoll','monsterDamage'])assert.throws(()=>run(name+'()'),/is not defined/);
 }});
 assert.equal(run('typeof facingAngleCore'), 'function');assert.equal(run('typeof applyEffect'),'function');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run("Object.hasOwn(P,'xp')||Object.hasOwn(P,'lvl')"),false);
 assert.equal(run("monsters.some(m=>Object.hasOwn(m,'xp'))||MOB_TYPES.some(m=>Object.hasOwn(m,'xp'))"),false);
 for(const name of ['drawCharacter','artifactDescription','armorEffects','secondaryRating','persistBags','removeCraftBag','showBagChoices','readBags','bagCapacity','area','lineCore','moveHero','strike','inArc']){
  assert.equal(run('typeof '+name),'undefined',name);
 }
 for(const [name,id] of [['openPortal','canaan-portals'],['toggleMap','canaan-map-panel'],['monsterDamage','canaan-combat']]){
  const definitions=scripts.filter(m=>new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\b)').test(m[2]));
  assert.equal(definitions.length,1,name);assert.ok(definitions[0][1].includes(id));
 }
 assert.doesNotMatch(source,/canaan_bags_v1_7_39|#quest\b|\.questdone\b|\.xp\b|dayPhase/);
 assert.doesNotMatch(source,/canaan_crafting_events_v1|legacyKey/);
 // Un seul dessin par chose : les anciens dessins « de secours » (décors de l'île, entrées des instances, décors des
 // Tréfonds, ancien camp) et l'ancienne feuille qui repeignait l'interface par-dessus ne reviennent pas.
 assert.doesNotMatch(source,/\bfunction (drawPixDecor|polishDecor|drawDungeonEntrance|drawBiomeDecor|paintAccent|membrane|worldText)\b|canaan-rpg-theme|rpg-theme\.css/);
 // Une seule police pour le texte du canevas : la serif du thème (canaanFont, canaanText), ou celle des icônes
 // (canaanGlyphFont) ; aucune police écrite à la main. Elle reste celle de l'interface (--rpg-serif, palette.css).
 const handFonts=scripts.flatMap(m=>[...m[2].matchAll(/\.font\s*=(?!\s*canaan(?:Glyph)?Font\()[^;\n]*/g)].map(f=>f[0]));
 assert.deepEqual(handFonts,[],'police de canevas écrite à la main');
 const serif=source.match(/const CANAAN_SERIF = "([^"]+)"/)[1],cssSerif=source.match(/--rpg-serif:\s*([^;]+);/)[1];
 assert.equal(serif,cssSerif.trim(),'la police du canevas suit --rpg-serif');
 // Anciennes sauvegardes (schémas 4 à 8) : migrations, statistiques héritées et alias de rareté retirés.
 assert.doesNotMatch(source,/CANAAN_SAVE_MIGRATIONS|LEGACY_GEAR_STATS|cleanLegacyStats|rarityAliases|_balancedVersion|Artisan élite|Grand Master/);
 assert.equal(scripts.some(m=>m[1].includes('canaan-save-migrations')),false);
 assert.equal(run("[...villages,...instances].some(d=>Object.hasOwn(d,'lvl'))"),false);
 // Progression : niveau requis, niveau des ennemis et récompense garantie (qualité, niveau) de chaque instance.
 assert.equal(run("instances.filter(d=>!d.under).flatMap(d=>d.difficulties?Object.values(d.difficulties).map(m=>m.level+' '+m.mobLevel+' '+m.rarity+' '+m.dropLevel):[d.level+' '+d.mobLevel+' '+d.rarity+' '+d.dropLevel]).join()"),
  '7 9 Rare 10,13 15 Rare 16,18 20 Rare 21,25 27 Rare 28,32 34 Rare 35,37 39 Rare 40,44 46 Épique 47,49 51 Épique 52,54 56 Épique 57,58 60 Épique 60,60 60 Épique 60');
 assert.equal(run("JSON.stringify(instances).includes('ilvl')||JSON.stringify(instances).includes('Ilvl')"),false,'plus d’iLvl');
 assert.ok(run("instances.every(d=>!Object.hasOwn(d,'loot'))"));
 // Un objet de niveau 20 normalisé conserve son niveau, son nom et ses secondaires.
 run("inventory.length=0;const cleanupItem={id:'cleanup20',slot:'armor',rarity:'Peu commun',level:20};applyItemName(cleanupItem);CANAAN_STATS_PREPARE(cleanupItem);globalThis.cleanupBefore=JSON.stringify({name:cleanupItem.name,sec:cleanupItem.sec});inventory.push(cleanupItem);CANAAN_GEAR.normalizeAll()");
 assert.equal(run('inventory[0].level'),20);
 assert.equal(run('JSON.stringify({name:inventory[0].name,sec:inventory[0].sec})'),g.cleanupBefore);
 g.CANAAN_BAG_STATE.import(3);run('updateCapacity()');assert.equal(run('BAG_LIMIT'),50);
 run('started=true');assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(g.localStorage.getItem(g.CANAAN_PERSISTENCE.key));
 assert.equal(saved.schema,10);assert.equal(saved.version,version);
 // Les mêmes 40 compétences avec tous les vrais modules, sans doublure de visée.
 for(const type of ['sword','dualsword','axe','mace','spear','dualdagger','bow','staff','shield','lute']){
  for(let index=0;index<4;index++){
   run("equipment.weapon={id:'live-skill',slot:'weapon',rarity:'Commun',ilvl:1,weaponType:"+JSON.stringify(type)+"};CANAAN_GEAR.normalize(equipment.weapon);for(const key of Object.keys(weaponCooldowns))weaponCooldowns[key]=0;refreshWeaponBar();started=true;paused=false;P.dead=false;P.mp=100000;mouseWorldX=P.x+50;mouseWorldY=P.y;monsters=[{x:P.x+50,y:P.y,hp:1000000,mhp:1000000,r:14,cd:0,t:'Slime'}]");
   assert.doesNotThrow(()=>run('useSkill('+index+')'),type+':'+index);
  }
 }
});

test('Systèmes regroupés : une définition par entrée, aucun ancien captureur ni handler inline',()=>{
 for(const name of ['spawnMonsters','spawnInstanceBoss','recordKill','startGame','enterInstance','rarityRoll','itemStatsOf','characterStats']){
  const pattern=new RegExp('(?:function\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...source.matchAll(pattern)].length,1,name);
  assert.doesNotMatch(source,new RegExp('const\\s+\\w+\\s*=\\s*'+name+'\\s*;'),name);
 }
 assert.doesNotMatch(source,/\bon(?:click|mouseenter|mouseleave|mousemove|change)\s*=\s*["']/i);
 assert.doesNotMatch(source,/\.map-instance-(?:entry|dot)\b|function migrate\(|migrateWeapon|const CRAFT_SAVE/);
});

test('Surcharges consolidées : une seule définition et comportements fusionnés conservés',()=>{
 for(const name of ['drawPixelRoads','openNearbyChest','spawnWorldBosses','leaveInstance','pauseToTitle','saveGame','loadGame','drawPixelMob','heroLevel','awardBossLoot','lootRarity','openShop','buyGear','openDialog','onWorldBossKilled','renderTalents','updateZoneDisplay','updateWorld']){
  const pattern=new RegExp('(?:function\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...source.matchAll(pattern)].length,1,name);
  assert.doesNotMatch(source,new RegExp('(?:const|let)\\s+\\w+\\s*=\\s*'+name+'\\s*;'),name);
 }
 assert.doesNotMatch(source,/\bdrawMobShape\b|\bequipmentIlvl\b|\bkingdomMerchant\b|canaan-bridge-rendering/);
 // giveGear est défini une seule fois par le moteur d'objets ; la fabrique brute a son propre nom.
 assert.equal([...source.matchAll(/\bfunction\s+createRawGear\s*\(/g)].length,1);
 assert.equal([...source.matchAll(/\bfunction\s+giveGear\s*\(/g)].length,1);
 assert.doesNotMatch(source,/(?:const|let)\s+\w+\s*=\s*(?:giveGear|createRawGear)\s*;|\bgiveFinal\b|\bgiveGear\s*=/);
 // Une table est déclarée avec ses valeurs finales, jamais vidée puis remplie par un autre module.
 assert.doesNotMatch(source,/\b(\w+)\.splice\(\s*0\s*,\s*\1\.length\s*,/);
 // Commentaires : aucun marqueur de suppression ni numéro de version historique.
 for(const m of scripts)assert.doesNotMatch(m[2],/titre historique neutralisé|ancienne capture supprimée|origine ligne|\/\/\s*(?:=+\s*)?(?:CANAAN\s+)?V?1\.\d+(?:\.\d+)+\s*[—:-]/,m[1]);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run("ARTEFACTS.map(a=>a.wave).join()"),'1,2,3,4,5,6,7,8,9,10,11,12');
 // Un marchand par village, et le dialogue ouvre la boutique.
 assert.equal(run("villages.every(v=>npcs.filter(n=>n.type==='shop'&&n.village===v.name).length===1)"),true);
 // Plus d'arme de réserve : une seule arme, celle de la classe.
 assert.equal(run("'weapon2' in gearSlots"),false);
 // Boss mondiaux mis à l'échelle dès leur apparition.
 run('monsters=[];worldBossTimers={};instanceState=null;spawnWorldBosses()');
 assert.ok(run('monsters.filter(m=>m.worldBoss).length')>0);
 assert.equal(run('monsters.filter(m=>m.worldBoss).every(m=>m._scaledMaxHp===m.mhp)'),true);
 // Coffre de boss : une bourse d'or donnée une seule fois, selon le type d'instance.
 let restarts=0,stops=0;g.CanaanStages.restartMusic=()=>restarts++;g.CanaanStages.stopMusic=()=>stops++;
 run("started=true;inventory.length=0;instanceState={index:0,cleared:true};returnPos={x:P.x,y:P.y};chests=[{x:P.x/TS,y:P.y/TS,instance:true,opened:false}];P.gold=0");
 const raid=run('!!instances[0].raid');
 run('globalThis.realRandom=Math.random;Math.random=()=>0');
 try{assert.equal(run('openNearbyChest()'),true)}finally{run('Math.random=realRandom')}
 const purse=run('P.gold');
 assert.equal(purse,raid?1000:400);
 assert.equal(run('openNearbyChest()'),false);assert.equal(run('P.gold'),purse);
 // Sortie d'instance et retour au titre pilotent la musique directement.
 run('leaveInstance()');assert.equal(run('instanceState'),null);assert.equal(restarts,1);
 run('pauseToTitle()');assert.equal(stops,1);assert.equal(run('started'),false);
});

test('Pipeline : étapes déclarées, ordre imbriqué conservé, garde de pause et rendu après le monde',()=>{
 assert.doesNotMatch(source,/\bCanaanStages\.\w+\s*=\s*function\s*\(\s*\.\.\./);
 assert.doesNotMatch(source,/(?:^|[;\n])\s*(?:update|draw)\s*=\s*(?!=)/);
 assert.doesNotMatch(source,/const\s+\w+\s*=\s*(?:window\.)?CanaanStages\.\w+\s*;/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.deepEqual([...run('CANAAN_PIPELINE.update')],['companions','weaponEffects','mobScaling','bossScaling','weaponVfx','facing','classes','summons','dodge','basicAttack','artefacts','arena','professions','quests','dungeonPuzzles','elvenCity','bossMechanics','extensions','achievements']);
 // Les vraies étapes tournent sur une partie chargée.
 run('started=true;paused=false;P.dead=false');
 for(let i=0;i<240;i++)run('time++;runUpdatePipeline();updateWorld()');
 run('runDrawPipeline()');assert.equal(errors.length,0,errors.join('\n'));
 // Ordre : before() de l'extérieur vers l'intérieur, cœur, puis after() de l'intérieur vers l'extérieur.
 const calls=[];g.calls=calls;
 run(`for(const name of CANAAN_PIPELINE.update){const s=CanaanStages[name];CanaanStages[name]={
  before:s.before&&(()=>{calls.push('before:'+name);return name}),
  after:s.after&&(state=>calls.push('after:'+name+(state===undefined?'':'='+state)))}}
  update=()=>calls.push('core');draw=()=>calls.push('draw');CanaanStages.drawWeaponEffects=()=>calls.push('drawWeaponEffects')`);
 run('runUpdatePipeline();runDrawPipeline()');
 assert.deepEqual(calls,['before:classes','before:weaponVfx','before:bossScaling','before:weaponEffects','before:companions','core',
  'after:weaponEffects=weaponEffects','after:mobScaling','after:weaponVfx=weaponVfx','after:facing','after:classes=classes','after:summons',
  'after:dodge','after:basicAttack','after:artefacts','after:arena','after:professions','after:quests','after:dungeonPuzzles','after:elvenCity','after:bossMechanics','after:extensions','after:achievements','draw','drawWeaponEffects']);
 for(const state of ['paused=true','paused=false;P.dead=true','P.dead=false;started=false']){
  calls.length=0;run(state+';runUpdatePipeline()');assert.deepEqual(calls,[],state);
 }
});

test('Préférences : stockage centralisé, valeurs illisibles ignorées et écriture refusée sans erreur',async()=>{
 assert.doesNotMatch(source,/\.on(?:click|input|change|keydown|keyup|mouse\w+|pointer\w+|touch\w+)\s*=/);
 for(const id of ['canaan-audio-layout','canaan-controls','canaan-game-core','canaan-weapon-state'])assert.ok(script(id),id);
 assert.doesNotMatch(script('canaan-audio-layout'),/localStorage/);
 // Stockage de l'appareil : la sauvegarde (canaan-persistence) et, parmi les modules ES, client/preferences.js seul.
 const scriptsWithStorage=scripts.filter(m=>/localStorage/.test(m[2])).map(m=>/id="([^"]+)"/.exec(m[1])[1]).sort();
 assert.deepEqual(scriptsWithStorage,['canaan-modules','canaan-persistence']);
 const esRoot=path.join(__dirname,'..','src','canaan'),esWithStorage=[];
 for(const dir of ['shared','client'])(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.js')&&/localStorage/.test(fs.readFileSync(f,'utf8')))esWithStorage.push(path.relative(esRoot,f))}})(path.join(esRoot,dir));
 assert.deepEqual(esWithStorage,[path.join('client','preferences.js')]);
 const db=new Map();let refuse=false;
 // Le module lit localStorage au moment de l'appel : un faux stockage global le remplace le temps du test.
 const g={localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(refuse)throw new Error('quota');db.set(k,v)}}};
 const saved=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get:()=>g.localStorage});
 try{
 const prefs=(await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','client','preferences.js')).href)).CANAAN_PREFERENCES;
 assert.deepEqual(prefs.read('audio',{on:false}),{on:false});
 assert.equal(prefs.write('audio',{on:true,music:40}),true);
 assert.equal(db.get('canaan_audio_v1729'),'{"on":true,"music":40}');
 assert.deepEqual({...prefs.read('audio',{})},{on:true,music:40});
 for(const raw of ['{cassé','null','5','"texte"','[1,2]']){db.set('canaan_layout_v1729',raw);assert.deepEqual(prefs.read('layout',{}),{},raw)}
 refuse=true;assert.equal(prefs.write('layout',{a:1}),false);assert.equal(db.get('canaan_layout_v1729'),'[1,2]');
 g.localStorage.getItem=()=>{throw new Error('bloqué')};assert.deepEqual(prefs.read('audio',{on:false}),{on:false});
 assert.throws(()=>prefs.read('inconnue',{}),/Préférence inconnue/);
 }finally{if(saved)Object.defineProperty(globalThis,'localStorage',saved);else delete globalThis.localStorage}
 // Chargement complet : la barre reçoit ses cases avec data-skill et les réglages audio restent lisibles.
 const boot=require('./helpers/canaan-runtime.cjs');
 const {run,errors}=boot(source,{beforeScript(part,run){if(part[1].includes('id="canaan-modules"'))run("localStorage.setItem('canaan_audio_v1729','{\"on\":false,\"music\":61,\"fx\":12}')")}});
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('JSON.stringify(Array.from(skEl.children,el=>el.dataset.skill))'),'[]','sans classe, aucune compétence');
 // Une classe : ses quatre compétences, puis la case du sort de classe (F).
 run('CANAAN_CLASS_STATE.import({id:"guerrier",talents:[]})');
 assert.equal(run('JSON.stringify(Array.from(skEl.children,el=>el.dataset.skill))'),'[0,1,2,3,null]');
 assert.equal(run("document.getElementById('musicVolume').value"),61);
 assert.equal(run("document.getElementById('sfxVolume').value"),12);
});

test('Finitions : HUD en niveaux avec barre d’XP, plus d’iLvl, aucune variable morte et fichier versionné',()=>{
 assert.match(source,/<span id="plevel">/);assert.match(source,/<i id="xpb"><\/i>/);
 // Le HUD affiche le niveau du héros et sa progression vers le suivant.
 const hud=require('./helpers/canaan-runtime.cjs')(source);
 hud.run('game.hero.level=7;game.hero.exp=Math.floor(xpToNext(7)/4);CANAAN_PROGRESSION.hud()');
 assert.equal(hud.nodes.get('plevel').textContent,'Niv. 7');
 assert.equal(hud.nodes.get('xpb').style.width,hud.run('100*game.hero.exp/xpToNext(7)')+'%');assert.ok(parseFloat(hud.nodes.get('xpb').style.width)>20&&parseFloat(hud.nodes.get('xpb').style.width)<30);
 assert.equal(hud.nodes.get('xpt').textContent,hud.run('game.hero.exp+" / "+xpToNext(7)+" XP"'));
 assert.doesNotMatch(source,/id="pilvl"|\bspawnClock\b|const\s+obsolete\b/);
 // Plus d'iLvl dans le jeu : seules les conversions des anciennes sauvegardes en parlent.
 for(const m of scripts)if(!/canaan-(?:modules|gear-engine|persistence|group)"/.test(m[1]))assert.doesNotMatch(m[2],/\biLvl\b|averageItemLevel|ratings52/,m[1]);
 // Les champs des anciens objets ne sont plus nettoyés nulle part : seules les sauvegardes au schéma 9 sont lues.
 assert.doesNotMatch(source,/delete\s+item\.(?:lvl|reqLvl|secondaryStats)\b/);
 assert.equal(path.basename(builtFile),'CANAAN_ONLINE_V'+version.replace(/\./g,'_')+'.html');
 assert.match(source,new RegExp("CANAAN_VERSION\\s*=\\s*'"+version.replace(/\./g,'\\.')+"'"));
 // Une seule version : package.json (application de bureau) suit runtime-config.js.
 assert.equal(require('../package.json').version,version);
});

test('Application de bureau : Electron épinglé, version unique, fenêtre isolée et pont de sauvegarde limité',()=>{
 const root=path.resolve(__dirname,'..');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.equal(pkg.version,version);assert.equal(pkg.main,'app/main.js');
 assert.match(pkg.devDependencies.electron,/^\d+\.\d+\.\d+$/,'version exacte');
 assert.match(pkg.scripts.start,/tools\/build\.cjs --extensions && node tools\/run_app\.cjs/);
 const main=fs.readFileSync(path.join(root,'app','main.js'),'utf8'),preload=fs.readFileSync(path.join(root,'app','preload.js'),'utf8');
 for(const flag of ['contextIsolation: true','sandbox: true','nodeIntegration: false'])assert.ok(main.includes(flag),flag);
 assert.match(main,/will-navigate/);assert.ok(main.includes("if (url.split('#')[0] !== page) event.preventDefault();"),'seul le rechargement du jeu est permis');assert.match(main,/setWindowOpenHandler/);assert.match(main,/setPermissionRequestHandler/);
 assert.match(main,/runtime-config\.js/);assert.doesNotMatch(main,/loadURL\(/);
 // Le jeu ne reçoit que les opérations de sauvegarde : aucune API Node, aucun module, aucun chemin de fichier.
 assert.match(preload,/exposeInMainWorld\(\s*'canaanDesktop'/);
 assert.doesNotMatch(preload,/require\('node:|require\('fs|process\./);
 assert.match(main,/event\.sender !== mainWindow\.webContents/);
 assert.match(fs.readFileSync(path.join(root,'tools','run_app.cjs'),'utf8'),/delete env\.ELECTRON_RUN_AS_NODE/);
});

test('Graphe des scripts : aucun nom lu sans être défini (scripts classiques, pont, modules ES)',()=>{
 // no-undef ne peut pas s'appliquer aux scripts classiques (ils partagent un espace global) : l'outil de graphe relève
 // chaque nom lu et vérifie qu'un script, le pont ou le navigateur le définit. Une déclaration retirée sans remplacer
 // ses lectures, ou un import oublié dans le pont, est attrapé ici.
 const out=require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'..','tools','module_graph.cjs')],{encoding:'utf8'});
 assert.match(out.trim().split('\n').at(-1),/^Aucun nom lu sans définition\.$/,out.trim().split('\n').at(-1));
});

test('Compositeur (client/audio/music.js) : même pièce pour une même graine, événements dans l’ordre',async()=>{
 const M=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','client','audio','music.js')).href);
 for(const key of M.MUSIC_BIOME_THEMES)assert.ok(M.MUSIC_THEMES[key],key);
 const a=M.composeMusic(M.MUSIC_THEMES.plaines,'plaines'),b=M.composeMusic(M.MUSIC_THEMES.plaines,'plaines'),c=M.composeMusic(M.MUSIC_THEMES.plaines,'ailleurs');
 assert.deepEqual(a,b);assert.notDeepEqual(a,c);assert.ok(a.length>100);
 assert.ok(a.every((e,i)=>i===0||a[i-1].beat<=e.beat),'triés par temps');assert.ok(a.every(e=>e.beat>=0&&e.beat<32*4),'sur 32 mesures');
 assert.equal(M.midiFrequency(69),440);assert.equal(M.midiFrequency(81),880);
});

test('Migration en modules ES : plus aucun nouveau script classique, la liste restante ne fait que raccourcir', () => {
  // Seuil de la migration (docs/ARCHITECTURE.md) : tout nouveau fichier du jeu est un module de client/ ou de
  // shared/. tests/fixtures/classic-scripts.json liste les scripts classiques restants ; un script converti en est
  // retiré, un script ajouté au manifeste sans y figurer fait échouer ce test.
  const listed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'classic-scripts.json'), 'utf8')).scripts;
  const manifest = require('../src/canaan/manifest.json').modules;
  const classic = manifest.filter(m => m.kind === 'script').map(m => m.file);
  const extra = classic.filter(f => !listed.includes(f));
  assert.deepEqual(extra, [], 'nouveaux scripts classiques (à écrire en module ES dans client/ ou shared/)');
  const gone = listed.filter(f => !classic.includes(f));
  assert.deepEqual(gone, [], 'scripts convertis ou supprimés : les retirer de tests/fixtures/classic-scripts.json');
  // Un seul point d'entrée des modules ES dans le manifeste : le pont (bridge.js), regroupé par esbuild.
  assert.deepEqual(manifest.filter(m => m.kind === 'module').map(m => m.file), ['bridge.js']);
  // Aucun fichier de scripts/ hors du manifeste (un fichier oublié échapperait au compte).
  const root = path.join(__dirname, '..', 'src', 'canaan');
  const onDisk = fs
    .readdirSync(path.join(root, 'scripts'), { recursive: true })
    .filter(f => f.endsWith('.js'))
    .map(f => 'scripts/' + f.split(path.sep).join('/'));
  assert.deepEqual(onDisk.filter(f => !classic.includes(f)), [], 'fichiers de scripts/ absents du manifeste');
});

test('Modules ES vérifiés par TypeScript : // @ts-check en tête de chaque fichier de shared/ et de client/', () => {
  const root = path.join(__dirname, '..', 'src', 'canaan');
  for (const dir of ['shared', 'client'])
    for (const f of fs.readdirSync(path.join(root, dir), { recursive: true }).filter(f => f.endsWith('.js'))) {
      const first = fs.readFileSync(path.join(root, dir, f), 'utf8').split('\n')[0];
      assert.equal(first, '// @ts-check', dir + '/' + f);
    }
  // Les deux projets TypeScript existent et sont lancés par npm run typecheck (et npm run check).
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  for (const dir of ['shared', 'client']) {
    assert.ok(fs.existsSync(path.join(root, dir, 'jsconfig.json')), dir + '/jsconfig.json');
    assert.match(pkg.scripts.typecheck, new RegExp('src/canaan/' + dir + '/jsconfig\\.json'));
  }
});
