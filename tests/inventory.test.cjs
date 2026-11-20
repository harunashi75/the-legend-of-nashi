const { test } = require('node:test');
const {
  vm,
  assert,
  path,
  source,
  game
} = require('./helpers/context.cjs');

test('Noms : table officielle complète appliquée directement, identité et points inchangés',async()=>{
  // Règle pure de shared/rules/items.js, chargée directement dans Node avec les vraies données de shared/.
  const shared=f=>import(require('node:url').pathToFileURL(require('node:path').join(__dirname,'..','src','canaan','shared',f)).href);
  const {applyItemName}=await shared('rules/items.js'),{WEAPON_NAMES,GEAR_NAMES}=await shared('data/item-names.js');
  for(const [rarity,types] of Object.entries(WEAPON_NAMES)){
    for(const [type,name] of Object.entries(types)){
      const sec={power:42,crit:7},item={id:'identity',slot:'weapon',name:'Ancien nom',rarity,weaponType:type,level:30,sec};
      assert.equal(applyItemName(item),item);assert.equal(item.name,name);
      assert.equal(item.level,30);assert.equal(item.weaponType,type);assert.equal(item.id,'identity');assert.equal(item.sec,sec);
    }
  }
  for(let variant=0;variant<3;variant++){
    const item={slot:'artifact',rarity:'Rare',artifactVariant:variant,ilvl:90};
    applyItemName(item);
    assert.equal(item.name,GEAR_NAMES.Rare.artifact[variant]);
  }
  // Famille d'arme inconnue : une épée ; pièce sans emplacement : inchangée.
  const odd={slot:'weapon',rarity:'Épique',weaponType:'lance-pierre'};assert.equal(applyItemName(odd).name,WEAPON_NAMES['Épique'].sword);
  const none={name:'Caillou'};assert.equal(applyItemName(none).name,'Caillou');
  // Le jeu utilise la même règle (exposée par le pont).
  const g=game();assert.equal(vm.runInContext('applyItemName({slot:"weapon",rarity:"Rare",weaponType:"bow"}).name',g),WEAPON_NAMES.Rare.bow);
});

test('Progression : niveaux 1 à 60, XP des monstres, des boss et des instances, montée de niveau, niveau requis, sauvegarde et anciennes aventures',()=>{
 const {g,nodes,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.view.chat=()=>{};inventory=[]');
 assert.equal(run('game.hero.level'),1);assert.equal(run('game.hero.exp'),0);
 // XP d'un monstre : le niveau monte, les PV et le mana reviennent au maximum ; un emplacement de talent au niveau 10.
 run('globalThis.kill=(lv,extra={})=>{const m={t:"Loup",x:P.x+30,y:P.y,hp:1,mhp:1,r:14,g:0,level:lv,_levelHp:true,...extra};game.world.monsters.push(m);canaanDamageMonster(m,999)}');
 run('P.hp=1;kill(3)');assert.ok(run('game.hero.exp')>0||run('game.hero.level')>1);
 for(let i=0;i<40&&run('game.hero.level')<5;i++)run('P.hp=1;kill(5)');
 assert.ok(run('game.hero.level')>=5,'niveau '+run('game.hero.level'));assert.equal(run('P.hp'),run('P.mhp'),'PV rendus à la montée de niveau');
 assert.equal(run('CANAAN_CLASS.audit().slots'),1,'un emplacement de talent avant le niveau 10');
 // Barre d'XP et niveau dans l'affichage tête haute.
 run('CANAAN_PROGRESSION.hud()');assert.equal(nodes.get('plevel').textContent,'Niv. '+run('game.hero.level'));
 assert.match(nodes.get('xpt').textContent,/^\d+ \/ \d+ XP$/);
 // Un monstre bien trop faible ne rapporte presque rien ; un boss mondial et une instance terminée rapportent gros.
 run('game.hero.level=30;game.hero.exp=0;kill(5)');assert.ok(run('game.hero.exp')<=mobXpAt(5,30)+1);
 function mobXpAt(m,h){return run('mobXp('+m+','+h+')')}
 run('game.hero.exp=0;kill(30,{worldBoss:true,worldBossId:"leviathan",t:"Léviathan"})');assert.equal(run('game.hero.exp'),run('bossXp(30,"world")'));
 run('game.hero.level=10;game.hero.exp=0;CANAAN_PROGRESSION.clearInstanceXp(0,game.hero)');
 // Le coffre d'un donjon rapporte un quart d'un niveau de l'instance (les boss en donnent autant chacun ou presque),
 // sans en faire gagner plusieurs d'un coup.
 assert.ok(run('game.hero.level>10||game.hero.exp===clearXp(9,false,10)'),'un donjon fini rapporte un quart de niveau');
 assert.ok(run('clearXp(9,false)>xpToNext(9)*0.2'));assert.ok(run('game.hero.level')<=11,'mais pas plusieurs niveaux');
 // Un héros bien plus fort que le boss ou l'instance ne farme plus : même pénalité d'écart que les monstres.
 run('game.hero.level=40;game.hero.exp=0;kill(10,{worldBoss:true,worldBossId:"fenrir",t:"Fenrir"})');
 assert.equal(run('game.hero.exp'),run('Math.round(bossXp(10,"world")*0.1)'));
 run('game.hero.level=40;game.hero.exp=0;CANAAN_PROGRESSION.clearInstanceXp(0,game.hero)');
 assert.equal(run('game.hero.exp'),run('clearXp(9,false,40)'));assert.ok(run('clearXp(9,false,40)<clearXp(9,false)*0.11'));
 // Niveau 60 : l'XP s'arrête.
 run('game.hero.level=60;game.hero.exp=0;kill(60)');assert.equal(run('game.hero.level+"/"+game.hero.exp'),'60/0');
 // Niveau requis pour équiper.
 run('game.hero.level=20;inventory=[CANAAN_GEAR.normalize({id:"haut",slot:"helm",rarity:"Rare",level:25}),CANAAN_GEAR.normalize({id:"bon",slot:"helm",rarity:"Rare",level:20})]');
 assert.equal(run('equipItem("haut")'),false);assert.equal(run('equipItem("bon")'),true);assert.equal(run('equipment.helm.id'),'bon');
 // Sauvegarde : niveau et XP enregistrés et relus.
 run('game.hero.level=23;game.hero.exp=77;saveGame();game.hero.level=1;game.hero.exp=0');assert.equal(run('loadGame()'),true);
 assert.equal(run('game.hero.level+"/"+game.hero.exp'),'23/77');
 // Ancienne aventure (sans niveau) : le héros prend le niveau de sa meilleure pièce portée (iLvl converti).
 const key='"canaan_slot_"+CANAAN_PERSISTENCE.slot';
 run(`{const d=JSON.parse(localStorage.getItem(${key}));delete d.heros.hote.level;delete d.heros.hote.exp;d.heros.hote.equipment.helm={id:"old",slot:"helm",rarity:"Épique",ilvl:120};localStorage.setItem(${key},JSON.stringify(d))}`);
 assert.equal(run('loadGame()'),true);assert.equal(run('game.hero.level'),Math.round(120*60/190));assert.equal(run('equipment.helm.level'),Math.round(120*60/190));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Sans artisanat : ni forge ni touche K, objets tels que lâchés, anciennes améliorations retirées, matériaux rendus en or',()=>{
 const {g,run,errors,fire}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Plus rien de la forge : fonctions, catalogues, bouton du menu, raccourci K, matériaux du héros.
 for(const name of ['openCrafting','upgradeItem','setWeaponPassive','selectForgeItem','upgradeCost','upgradeLevel','upgradable','WEAPON_PASSIVES','PASSIVE_COSTS','UPGRADE_COSTS','UPGRADE_MAX','MATERIALS','materialGrant','materialSpend','rollResources','CANAAN_CRAFT','equippedWeaponPassive'])
  assert.equal(run('typeof '+name),'undefined',name);
 assert.doesNotMatch(source,/data-action="openCrafting"|Artisanat \(K\)/);
 // L'ancien raccourci K de la forge n'ouvre plus aucune fenêtre.
 run('started=true;paused=false;closePanels()');fire(g,'keydown',{key:'k'});assert.equal(run('modalOpen()'),false);
 assert.equal(run('"materials" in game.hero'),false);
 assert.equal(run('Object.values(SOURCE_REWARDS).some(r=>"resources" in r)'),false);
 // Un objet garde les statistiques de son drop : les anciennes améliorations (+1 à +5) et passifs de forge sont retirés.
 const old=JSON.parse(run('JSON.stringify(CANAAN_GEAR.normalize({id:"o1",name:"Heaume",slot:"helm",rarity:"Rare",ilvl:26,upgrade:5,craftPassive:"bleed"}))'));
 assert.equal('upgrade' in old,false);assert.equal('craftPassive' in old,false);
 assert.equal(run('(()=>{const it=CANAAN_GEAR.normalize({id:"o2",name:"Heaume",slot:"helm",rarity:"Rare",ilvl:26,upgrade:3});return gearDisplayName(it)===it.name&&!/\\+\\d/.test(it.name)})()'),true,'plus de « +3 » après le nom');
 assert.equal(run('(()=>{const it=CANAAN_GEAR.normalize({id:"o3",slot:"helm",rarity:"Rare",level:26,upgrade:4});return JSON.stringify(itemStatsOf(it).primary)===JSON.stringify(itemPrimary(it))})()'),true,'aucun bonus d’amélioration');
 assert.equal(run('Object.hasOwn(CANAAN_GEAR.normalize({id:"o4",slot:"weapon",weaponType:"axe",rarity:"Épique",ilvl:46,craftPassive:"lifesteal"}),"craftPassive")'),false);
 // Ancienne sauvegarde : matériaux rendus en or une seule fois (10 / 10 / 50 / 200 or l'unité), objets remis à leur drop.
 run('started=true;P.gold=100;equipment.helm=CANAAN_GEAR.normalize({id:"s-helm",slot:"helm",rarity:"Rare",ilvl:26});saveGame()');
 const key='"canaan_slot_"+CANAAN_PERSISTENCE.slot';
 run(`{const d=JSON.parse(localStorage.getItem(${key}));d.heros.hote.materials={ore:10,wood:5,essence:2,core:1};d.heros.hote.equipment.helm.upgrade=4;d.heros.hote.equipment.helm.craftPassive="bleed";localStorage.setItem(${key},JSON.stringify(d))}`);
 assert.equal(run('loadGame()'),true);
 assert.equal(run('P.gold'),100+10*10+5*10+2*50+200);
 assert.equal(run('Object.hasOwn(equipment.helm,"upgrade")||Object.hasOwn(equipment.helm,"craftPassive")'),false);
 assert.equal(run('saveGame()'),true);
 assert.equal(run(`"materials" in JSON.parse(localStorage.getItem(${key})).heros.hote`),false,'plus de matériaux dans la sauvegarde');
 assert.equal(run('loadGame()&&P.gold'),550,'rendus une seule fois');
 // Invités enregistrés : leurs matériaux aussi sont rendus en or.
 run('CANAAN_GROUP.importGuests({"g-old":{pseudo:"Lina",player:{gold:5},materials:{ore:3,core:2}}})');
 assert.equal(run('game.guests["g-old"].player.gold'),5+30+400);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Garde-robe : apparences de sets en six qualités, butin, doublons revendus, port vérifié, sauvegarde et réseau',async()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Catalogue : des tenues complètes dans chaque qualité, les plus hautes avec ailes, aura ou particules.
 const skins=JSON.parse(run('JSON.stringify(SKINS)'));
 assert.ok(skins.length>=24);assert.deepEqual([0,1,2,3,4,5].map(r=>skins.filter(s=>s.rarity===r).length>=4),[true,true,true,true,true,true]);
 assert.ok(skins.filter(s=>s.rarity>=4).every(s=>['dragonwings','angelwings','batwings','fairywings','flamecape'].includes(s.back)&&s.fx&&s.fx.length));
 assert.ok(skins.filter(s=>s.rarity===5).every(s=>s.fx.includes('aura')));assert.ok(skins.filter(s=>s.rarity===0).every(s=>!s.fx));
 // Apparence portée dans le look : codée seulement quand il y en a une (l'ancienne forme reste identique).
 assert.equal(run('encodeLook(defaultLook())'),'m|humain|#f0c7a0|court|#7d5140|#202938|acier');
 assert.equal(run('encodeLook({...defaultLook(),wear:"dragon"})'),'m|humain|#f0c7a0|court|#7d5140|#202938|acier|dragon');
 assert.equal(run('decodeLook(encodeLook({...defaultLook(),wear:"dragon"})).wear'),'dragon');assert.equal(run('sanitizeLook({wear:"pirate<b>"}).wear||""'),'');assert.equal(run('"wear" in defaultLook()'),false,'sans apparence, le look ne change pas');
 // Tirage : chance et qualités selon la source.
 const roll=(src,seq)=>run('{const q='+JSON.stringify(seq)+';let k=0;CANAAN_WARDROBE.roll("'+src+'",()=>q[k++%q.length])}');
 assert.equal(roll('normal',[0.5]),null,'un monstre ne donne presque jamais rien');
 assert.equal(run('SKINS.find(s=>s.id==='+JSON.stringify(roll('secretBoss',[0,0.999,0]))+').rarity'),5,'boss caché : jusqu’au Mythique');
 assert.equal(run('SKINS.find(s=>s.id==='+JSON.stringify(roll('normal',[0,0,0]))+').rarity'),0);
 // Gagner, doublon revendu, porter seulement ce qu'on possède.
 run('game.hero.skins={owned:[]};P.gold=0');
 assert.equal(run('CANAAN_WARDROBE.grant(game.hero,"pirate")'),true);assert.equal(run('CANAAN_WARDROBE.grant(game.hero,"pirate")'),false);assert.equal(run('P.gold'),300);
 assert.equal(run('CANAAN_WARDROBE.wear(game.hero,"dragon")'),false,'pas possédée');assert.equal(run('(game.hero.look||{}).wear||""'),'');
 assert.equal(run('CANAAN_WARDROBE.wear(game.hero,"pirate")'),true);assert.equal(run('game.hero.look.wear'),'pirate');
 // La garde-robe est un onglet des Collections (V), plus de la fiche (C).
 run('closePanels();toggleWardrobe()');
 assert.equal(run('document.getElementById("window").dataset.canaanPanel'),'collections');assert.equal(run('CANAAN_COLLECTIONS.current()'),'wardrobe');
 assert.match(run('document.getElementById("window").innerHTML'),/data-tab="wardrobe"[^>]*>[^<]*Garde-robe[^]*collection-list/);
 // Journal de collection : la tenue d'origine d'abord, une apparence non obtenue grisée avec où la trouver ; obtenue, on la porte.
 const view=()=>run('document.getElementById("window").innerHTML').split('collection-view')[1]||'';
 assert.match(run('document.getElementById("window").innerHTML'),/class="collection-list" data-keep-scroll="wardrobe"><div class="collection-head">[^]*?data-skin=""/);
 run('globalThis.__skins=game.hero.skins;globalThis.__wear=game.hero.look.wear;game.hero.skins={owned:[]};CANAAN_WARDROBE.pick("fermier")');assert.match(view(),/^ locked[^]*collection-chip">Monstres[^]*Pas encore obtenue/);
 run('CANAAN_WARDROBE.pick("elfe_reine")');assert.match(view(),/Elwyn, la Tisseuse/);
 run('CANAAN_WARDROBE.grant(game.hero,"fermier");CANAAN_WARDROBE.pick("fermier")');assert.match(view(),/data-action="wearSkin" data-skin="fermier"/);
 run('CANAAN_WARDROBE.choose("fermier")');assert.equal(run('game.hero.look.wear'),'fermier');assert.match(view(),/✔ Portée/);
 run('game.hero.skins=__skins;CANAAN_WARDROBE.choose(__wear)');
 run('toggleWardrobe()');assert.equal(run('modalOpen()'),false,'V referme l’onglet Garde-robe');
 run('canaanCharacterSection("gear")');assert.doesNotMatch(run('document.getElementById("window").innerHTML'),/wardrobe-open|wardrobe-tab|data-tab="wardrobe"/);
 // Collections : un onglet par collection, le dernier ouvert gardé ; V les referme quel que soit l'onglet.
 run('closePanels();canaanCollections("bestiary")');assert.match(run('document.getElementById("window").innerHTML'),/data-tab="bestiary"[^]*beast-card/);
 run('canaanCollections("digging")');assert.match(run('document.getElementById("window").innerHTML'),/Reliques trouvées/);
 run('closePanels();started=true;paused=false;toggleCollections()');assert.equal(run('CANAAN_COLLECTIONS.current()'),'digging');
 run('toggleCollections()');assert.equal(run('modalOpen()'),false);
 // Onglet Runes : Runes équipées (avec leurs effets) à gauche, Collection filtrée par famille à droite.
 run('canaanCharacterSection("rubis")');assert.match(run('document.getElementById("window").innerHTML'),/rubis-worn[^]*rune-slots[^]*rubis-coll[^]*rune-filters/);
 run('closePanels()');
 // Le sprite d'une tenue a de la place pour les ailes ; sans tenue, rien ne change.
 assert.equal(run('canaanHeroSprite({...game.hero.look,wear:"dragon"},0,0).padX'),12);assert.equal(run('canaanHeroSprite(defaultLook(),0,0).padX'),0);
 // Sauvegarde : collection et tenue portée.
 const saved=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}))'));
 assert.deepEqual(saved.skins,{owned:['pirate']});assert.equal(saved.look.wear,'pirate');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WARDROBE.sanitize({owned:["pirate","pirate","inconnue",3]}))')),{owned:['pirate']});
 // Réseau : l'invité demande (l'hôte vérifie) ; les E de donjon passent aussi le filtre des actions.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'skin-wear',id:'pirate'}),{op:'skin-wear',id:'pirate'});assert.deepEqual(n.sanitizeAction({op:'skin-wear',id:''}),{op:'skin-wear',id:''});
 assert.equal(n.sanitizeAction({op:'skin-wear',id:'<x>'}),null);assert.deepEqual(n.sanitizeAction({op:'dungeon-use'}),{op:'dungeon-use'});
 // Butin : un boss de donjon tire une apparence pour chaque héros (ici, forcée).
 run('game.hero.skins={owned:[]};game.hero.level=60;enterInstance(0);{const real=Math.random;Math.random=()=>0;const m=monsters.find(m=>m.bossStage===0);m.hp=0;recordKill(m);Math.random=real}');
 assert.equal(run('game.hero.skins.owned.length'),1,'apparence du boss');run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Sac unifié, boutique à deux fenêtres et échange de piles : Rubis, poissons, viandes et repas sont des objets du sac',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'shop-buy',index:3,gold:9}),{op:'shop-buy',index:3});assert.equal(n.sanitizeAction({op:'shop-buy',index:99}),null);
 assert.deepEqual(n.sanitizeAction({op:'sell-stack',token:'fish:gardon:2*30'}),{op:'sell-stack',token:'fish:gardon:2*30'});assert.equal(n.sanitizeAction({op:'sell-stack',token:'gold:x:1*5'}),null);
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.hero.level=20;P.gold=10000;game.hero.inventory=[];updateCapacity();toast=()=>{}');
 // Piles de 100 au plus par case, et elles prennent de la place.
 run('const h=game.hero;h.prof.fish["gardon:1"]=230;h.prof.meat["lievre:0"]=5;h.prof.meals["soupe:1"]=2;h.rubis.owned.phenix=2;h.rubis.equipped=["phenix",null,null,null,null,null]');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BAG.tiles(game.hero).map(p=>CANAAN_BAG.token(p)))')),['rubis:phenix:0*1','fish:gardon:1*100','fish:gardon:1*100','fish:gardon:1*30','meat:lievre:0*5','meal:soupe:1*2']);
 // Deux sections : le sac (Rubis, repas…) et les matériaux (poissons, viandes, minerais, herbes), chacun sa place.
 assert.equal(run('canaanBagUsed(game.hero)'),1,'les Rubis (onglet Rubis de la fiche C) et les matériaux ont leur section');
 assert.equal(run('CANAAN_BAG.matUsed(game.hero)'),4);
 // Section pleine : un poisson qui demande une nouvelle case est refusé ; un de plus dans une pile entamée passe.
 run('game.hero.bagLimit=10;BAG_LIMIT=1');assert.equal(run('CANAAN_BAG.room(game.hero,"fish","truite",0,1)'),true,'le sac plein ne bloque pas les matériaux');
 assert.equal(run('CANAAN_BAG.room(game.hero,"meal","grillade",0,1)'),false);
 run('game.hero.prof.ore["fer:0"]=9600');assert.equal(run('CANAAN_BAG.matUsed(game.hero)'),100);
 assert.equal(run('CANAAN_BAG.room(game.hero,"fish","gardon",1,70)'),true);assert.equal(run('CANAAN_BAG.room(game.hero,"fish","gardon",1,71)'),false);
 assert.equal(run('CANAAN_BAG.room(game.hero,"fish","truite",0,1)'),false);run('delete game.hero.prof.ore["fer:0"]');
 // Le sac (I) : une seule vue par rubriques (Équipement, Utilitaire, Autre, puis Matériaux) ; un repas se mange d'un
 // clic. Les Rubis n'y sont plus. Un trésor déterré est dans Autre et prend la place du sac.
 run('game.hero.prof.treasure["perle:0"]=3;game.hero.player.keys=2;BAG_LIMIT=40;renderInventory()');let inv=run('document.getElementById("window").innerHTML');
 assert.equal(run('canaanBagUsed(game.hero)'),3,'repas, clés et trésor dans la place du sac');
 assert.equal((inv.match(/data-tooltip-stack="/g)||[]).length,7);assert.doesNotMatch(inv,/rubis:phenix/);assert.doesNotMatch(inv,/data-action="bagSection"/);
 assert.match(inv,/data-action="useBagStack" data-token="meal:soupe:1\*2"/);
 const at=re=>inv.search(re);
 assert.ok(at(/Équipement/)<at(/Utilitaire/)&&at(/Utilitaire/)<at(/key:secret/)&&at(/key:secret/)<at(/meal:soupe/)&&at(/meal:soupe/)<at(/Autre/)&&at(/Autre/)<at(/treasure:perle/)&&at(/treasure:perle/)<at(/Matériaux/)&&at(/Matériaux/)<at(/fish:gardon/),'rubriques dans l’ordre');
 assert.match(inv,/Matériaux <small>4 \/ 100/);assert.match(inv,/Libres <small>17</);assert.match(inv,/data-action="sortBag"[^>]*disabled/);
 run('delete game.hero.prof.treasure["perle:0"];game.hero.player.keys=0');
 // Trier : l'équipement par emplacement (armes d'abord), puis la meilleure qualité, puis le plus haut niveau.
 run('game.hero.inventory=[{id:"a",slot:"ring",rarity:"Commun",level:5},{id:"b",slot:"helm",rarity:"Rare",level:3},{id:"c",slot:"helm",rarity:"Épique",level:2},{id:"d",slot:"weapon",weaponType:"sword",rarity:"Commun",level:1},{id:"e",slot:"helm",rarity:"Rare",level:9}];renderInventory()');
 assert.doesNotMatch(run('document.getElementById("window").innerHTML'),/data-action="sortBag"[^>]*disabled/);
 run('canaanSortBag()');assert.equal(run('game.hero.inventory.map(i=>i.id).join("")'),'dceba');
 assert.deepEqual(n.sanitizeAction({op:'bag-sort',x:1}),{op:'bag-sort'});
 run('game.hero.inventory=[]');
 // Boutique : un objet Peu commun du niveau du héros par emplacement et par famille d'arme, à choisir.
 run('const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+30;openShop(m)');
 assert.equal(run('CANAAN_SHOP.stock(game.hero).length'),17);
 assert.ok(run('CANAAN_SHOP.stock(game.hero).every(i=>i.rarity==="Peu commun"&&i.level===20)'));
 assert.deepEqual(JSON.parse(run('JSON.stringify([...new Set(CANAAN_SHOP.stock(game.hero).map(i=>i.weaponType||i.slot))])')).length,17);
 const panel=run('document.getElementById("window").innerHTML');assert.match(panel,/class="shop-panel shop-columns"/);assert.match(panel,/shop-side bag-side/);
 const want=run('CANAAN_SHOP.stock(game.hero)[2].slot'),gold0=run('P.gold');
 assert.equal(run('CANAAN_SHOP.buy(game.hero,2)'),true);assert.equal(run('game.hero.inventory.at(-1).slot'),want);assert.equal(run('P.gold'),gold0-run('shopPriceAt(20)'));
 assert.equal(run('CANAAN_SHOP.stock(game.hero)[2].slot'),want,'remplacé par un objet du même genre');
 // Vendre une pile.
 const g1=run('P.gold');assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),true);
 assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),130);assert.equal(run('P.gold'),g1+100*run('CANAAN_BAG.unitPrice({kind:"fish",q:1})'));
 assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),true);assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),false,'pas plus que ce qu’on a (30)');
 assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"rubis:phenix:0*1")'),false,'les Runes ne se vendent pas');assert.equal(run('game.hero.rubis.owned.phenix'),2);
 // Échange : une pile change de main avec l'équipement ; un sac trop plein annule tout.
 run('game.mode="host";globalThis.ami=canaanCreateHero({name:"Ami",x:P.x,y:P.y});ami.id="g-ami";ami.peer="p1";ami.local=false;game.heroes.push(ami)');
 run('CANAAN_TRADE.handle(game.hero,{op:"trade-request",to:"g-ami"});CANAAN_TRADE.handle(ami,{op:"trade-answer",yes:true})');
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*5","fish:gardon:1*30"],gold:0})'),true);
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*6"],gold:0})'),false,'pas plus que la pile');
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["rubis:phenix:0*1"],gold:0})'),false,'les Runes ne s’échangent pas');
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*5","fish:gardon:1*30"],gold:0})'),true);
 run('CANAAN_TRADE.handle(game.hero,{op:"trade-ready",yes:true});CANAAN_TRADE.handle(ami,{op:"trade-ready",yes:true})');
 assert.equal(run('CANAAN_BAG.count(ami,"meat","lievre",0)'),5);assert.equal(run('CANAAN_BAG.count(ami,"fish","gardon",1)'),30);
 assert.equal(run('CANAAN_BAG.count(game.hero,"meat","lievre",0)'),0);assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),0);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Banque de 500 places par joueur et Voile d’ombre : déposer, reprendre, sauvegarder ; invisible sauf pour les boss',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'bank-deposit',ref:'fish:gardon:1*30'}),{op:'bank-deposit',ref:'fish:gardon:1*30'});assert.equal(n.sanitizeAction({op:'bank-withdraw',ref:''}),null);
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=20;game.hero.inventory=[];giveGear(20,"normal","Rare");game.hero.prof.fish["gardon:1"]=150');
 assert.equal(run('CANAAN_BANK.CAPACITY'),500);assert.equal(run('game.world.npcs.filter(n=>n.type==="bank"&&!n.layer).length'),1,'un banquier au camp');
 const id=run('game.hero.inventory[0].id');
 assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),false,'loin du banquier');
 run('const b=game.world.npcs.find(n=>n.type==="bank");P.x=b.x;P.y=b.y+30');
 assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),true);assert.equal(run('game.hero.inventory.length'),0);
 assert.equal(run('CANAAN_BANK.deposit(game.hero,"fish:gardon:1*100")'),true);assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),50);
 assert.equal(run('CANAAN_BANK.used(game.hero)'),2);
 // Les Runes sont liées au héros : pas de dépôt ; celles déjà rangées reviennent dans sa collection au chargement.
 run('game.hero.rubis.owned.colosse=1');assert.equal(run('CANAAN_BANK.deposit(game.hero,"rubis:colosse:0*1")'),false);assert.equal(run('game.hero.rubis.owned.colosse'),1);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BANK.sanitize({items:[],stacks:{"rubis:phenix:0":2,"fish:gardon:1":5}}).stacks)')),{'fish:gardon:1':5});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BANK.withBankedRubis({stacks:{"rubis:phenix:0":2}},{owned:{phenix:1,colosse:1},equipped:["phenix"]}))')),{owned:{phenix:3,colosse:1},equipped:['phenix']});
 assert.equal(run('CANAAN_BANK.withdraw(game.hero,"fish:gardon:1*101")'),false);assert.equal(run('CANAAN_BANK.withdraw(game.hero,"fish:gardon:1*40")'),true);
 assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),90);assert.equal(run('CANAAN_BANK.of(game.hero).stacks["fish:gardon:1"]'),60);
 // Sac plein : on ne reprend pas.
 run('game.hero.prof.meals["soupe:0"]=1;BAG_LIMIT=1;game.hero.bagLimit=1');assert.equal(run('CANAAN_BANK.withdraw(game.hero,'+JSON.stringify(id)+')'),false);run('delete game.hero.prof.meals["soupe:0"]');run('BAG_LIMIT=40;game.hero.bagLimit=40');
 assert.equal(run('CANAAN_BANK.withdraw(game.hero,'+JSON.stringify(id)+')'),true);assert.equal(run('game.hero.inventory.length'),1);
 // Banque pleine : 500 cases au plus.
 run('CANAAN_BANK.of(game.hero).stacks["meat:lievre:0"]=49900');assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),false,'banque pleine');run('delete CANAAN_BANK.of(game.hero).stacks["meat:lievre:0"]');
 // Sauvegarde et vérification au chargement.
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot().heros.hote.bank)'));assert.deepEqual(snap.stacks,{'fish:gardon:1':60});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BANK.sanitize({items:[{slot:"x"}],stacks:{"fish:gardon:1":5,"or:x:1":3,"meat:lievre:0":-2}}))')),{items:[],stacks:{'fish:gardon:1':5}});
 run('CANAAN_BANK.open()');assert.match(run('document.getElementById("window").innerHTML'),/class="bank-panel shop-columns"[\s\S]*data-action="bankWithdraw"[\s\S]*data-action="bankDeposit"/);
 // Voile d'ombre : les monstres ne voient plus l'Assassin (ni ne se tournent vers lui) ; les boss si.
 run('closePanels();game.hero.classe={id:"assassin",talents:[]};P.mp=300;P.x=150*TS;P.y=150*TS;game.world.instance=null');
 run('game.world.monsters=[{t:"Loup",x:P.x+150,y:P.y,hp:500,mhp:500,r:14,cd:0,g:0,level:20,_levelHp:true},{t:"Boss",boss:true,x:P.x-150,y:P.y,hp:5000,mhp:5000,r:20,cd:0,g:0,level:20},{t:"Titan",worldBoss:true,x:P.x,y:P.y+160,hp:5000,mhp:5000,r:20,cd:0,g:0,level:20}]');
 assert.equal(run('CANAAN_CLASS.special()'),true);assert.equal(run('P.veiled'),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.world.monsters.map(m=>!!nearestHero(m)))')),[false,true,true]);
 const x0=run('game.world.monsters[0].x');run('game.world.monsters.splice(1)');for(let i=0;i<120;i++)run('time++;simulateStep()');
 assert.equal(run('game.world.monsters[0].x'),x0,'le loup ne bouge pas vers le héros invisible');assert.equal(run('game.world.monsters[0].targetHero'),null);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Démantèlement, poudres et sacoche de butin : rien n’est perdu ni changé en or quand le sac est plein',async()=>{
 const url=f=>require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href;
 const {salvageYield}=await import(url('rules/professions.js')),n=await import(url('net/messages.js'));
 // Rendement : la qualité choisit la poudre ; le niveau d'enchanteur peut en donner une de plus.
 assert.deepEqual(salvageYield(0,1,()=>0.99),{poussiere:2});assert.deepEqual(salvageYield(2,1,()=>0.5),{essence:1,poussiere:2});
 assert.deepEqual(salvageYield(5,40,()=>0),{eclat:3});assert.deepEqual(salvageYield(9,1,()=>0.99),{eclat:2});
 // Actions d'un invité : identifiants courts, statistique connue.
 assert.deepEqual(n.sanitizeAction({op:'salvage',id:'abc'}),{op:'salvage',id:'abc'});assert.equal(n.sanitizeAction({op:'salvage'}),null);
 assert.deepEqual(n.sanitizeAction({op:'satchel-take',id:'abc'}),{op:'satchel-take',id:'abc'});
 assert.deepEqual(n.sanitizeAction({op:'enchant-reroll',ref:'helm',stat:'crit'}),{op:'enchant-reroll',ref:'helm',stat:'crit'});assert.equal(n.sanitizeAction({op:'enchant-reroll',ref:'helm',stat:'<b>'}),null);
 assert.ok(n.STACK_TOKEN.test('dust:essence:0*12'));
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];game.hero.satchel=[];game.hero.prof.dust={};BAG_LIMIT=10;game.hero.bagLimit=10;P.gold=0');
 // Démanteler une pièce Rare du sac : une essence et de la poussière, rangées avec les matériaux.
 run('giveGear(30,"world","Rare");globalThis.rare=game.hero.inventory[0]');
 assert.equal(run('CANAAN_SALVAGE.salvage(game.hero,rare.id)'),true);assert.equal(run('game.hero.inventory.length'),0);
 assert.ok(run('CANAAN_BAG.count(game.hero,"dust","essence",0)')>=1);assert.ok(run('CANAAN_BAG.tiles(game.hero,"mat").some(p=>p.kind==="dust")'));
 assert.equal(run('CANAAN_BAG.parse("dust:essence:0*1").kind'),'dust');assert.ok(run('CANAAN_BAG.unitPrice({kind:"dust",id:"eclat",q:0,n:1})')>run('CANAAN_BAG.unitPrice({kind:"dust",id:"essence",q:0,n:1})'));
 // Une arme liée ne se démantèle pas.
 run('game.hero.inventory.push({id:"lie",slot:"weapon",weaponType:"sword",rarity:"Relique",level:30})');
 assert.equal(run('CANAAN_SALVAGE.salvage(game.hero,"lie")'),false);assert.equal(run('game.hero.inventory.length'),1);
 // Sac plein : un Commun part en poudre, un Rare ou mieux attend dans la sacoche ; jamais d'or à la place.
 run('game.hero.inventory=Array.from({length:10},(_,i)=>({id:"f"+i,slot:"ring",level:1,rarity:"Commun"}));game.hero.prof.dust={}');
 assert.equal(run('giveGear(30,"normal","Commun")'),null);assert.ok(run('CANAAN_BAG.count(game.hero,"dust","poussiere",0)')>=1);
 run('globalThis.myth=giveGear(30,"tier","Mythique")');assert.equal(run('game.hero.satchel.length'),1);assert.equal(run('game.hero.satchel[0]===myth'),true);
 assert.equal(run('P.gold'),0);assert.equal(run('game.hero.inventory.length'),10);
 // Sacoche pleine (10 places) : le butin suivant est démantelé, même Rare.
 for(let i=0;i<9;i++)run('giveGear(30,"world","Rare")');assert.equal(run('game.hero.satchel.length'),10);
 run('globalThis.ess=CANAAN_BAG.count(game.hero,"dust","essence",0)');assert.equal(run('giveGear(30,"world","Rare")'),null);
 assert.ok(run('CANAAN_BAG.count(game.hero,"dust","essence",0)')>run('ess'));assert.equal(run('game.hero.satchel.length'),10);
 // Reprendre : il faut une case libre ; on en libère une en démantelant.
 assert.equal(run('CANAAN_SALVAGE.take(game.hero,myth.id)'),false);
 assert.equal(run('CANAAN_SALVAGE.salvage(game.hero,"f0")'),true);assert.equal(run('CANAAN_SALVAGE.take(game.hero,myth.id)'),true);
 assert.equal(run('game.hero.inventory.at(-1)===myth&&game.hero.satchel.length===9'),true);
 // Le sac (I) : chaque pièce a son menu du clic droit, et la sacoche s'affiche quand elle n'est pas vide.
 run('renderInventory()');const html=run('document.getElementById("window").innerHTML');
 assert.match(html,/data-menu="gear" data-index="0"/);assert.match(html,/Sacoche de butin <small>9 \/ 10/);assert.match(html,/data-action="satchelTake" data-menu="satchel"/);
 assert.doesNotMatch(html,/bag-salvage|weapon-reserve/,'plus de petits boutons dans les coins des cases');
 // Menu du clic droit : équiper et démanteler ; une arme a aussi « Arme 2 » ; vendre seulement près d'un marchand.
 const entries=menu=>JSON.parse(run('JSON.stringify(CANAAN_ITEM_MENU.entriesFor({dataset:'+JSON.stringify(menu)+'}))'));
 assert.deepEqual(entries({menu:'gear',index:'0'}),['Équiper','Démanteler']);
 assert.deepEqual(entries({menu:'satchel',id:run('game.hero.satchel[0].id')}),['Reprendre dans le sac','Démanteler']);
 run('globalThis.ring=game.hero.inventory[0];game.hero.inventory[0]={id:"w1",slot:"weapon",weaponType:"sword",level:1,rarity:"Commun"}');
 assert.deepEqual(entries({menu:'gear',index:'0'}),['Équiper (Arme 1)','Équiper en Arme 2','Démanteler']);
 run('globalThis.nearMerchantWas=nearMerchant;nearMerchant=()=>true');
 assert.deepEqual(entries({menu:'gear',index:'0'}).map(e=>e.replace(/· \d+ or/,'· N or')),['Équiper (Arme 1)','Équiper en Arme 2','Vendre · N or','Démanteler']);
 run('nearMerchant=nearMerchantWas;game.hero.inventory[0]=ring');
 // Choisir « Démanteler » dans le menu réduit la pièce en poudre.
 run('CANAAN_ITEM_MENU.open({dataset:{menu:"gear",index:"1"}},10,10)');assert.equal(run('CANAAN_ITEM_MENU.isOpen()'),true);
 run('CANAAN_ITEM_MENU.choose(1)');assert.equal(run('CANAAN_ITEM_MENU.isOpen()'),false);
 assert.equal(run('game.hero.inventory.some(it=>it.id==="f2")'),false);
 run('game.hero.inventory.splice(1,0,{id:"f2",slot:"ring",level:1,rarity:"Commun"})');
 // Clé des secrets : même sac plein, elle est gardée.
 run('game.hero.player.keys=0;CANAAN_BAG.add(game.hero,"key","secret",0,1)');assert.equal(run('game.hero.player.keys'),1);
 // Changer la statistique d'un enchantement posé : 2 essences, le métal est gardé.
 run('myth.ench={stat:"crit",value:5,tier:3};game.hero.prof.dust={"essence:0":3}');
 assert.equal(run('CANAAN_GATHER.reroll(game.hero,myth.id,"crit")'),false,'même statistique');
 assert.equal(run('CANAAN_GATHER.reroll(game.hero,myth.id,"haste")'),true);
 assert.equal(run('myth.ench.stat'),'haste');assert.equal(run('myth.ench.tier'),3);assert.equal(run('game.hero.prof.dust["essence:0"]'),1);
 assert.equal(run('CANAAN_GATHER.reroll(game.hero,myth.id,"power")'),false,'plus assez d’essence');
 // Sauvegarde : la sacoche et les poudres reviennent au chargement.
 run('game.hero.prof.dust={"eclat:0":2}');assert.equal(run('saveGame()'),true);
 run('game.hero.satchel=[];game.hero.prof.dust={}');assert.equal(run('loadGame()'),true);
 assert.equal(run('game.hero.satchel.length'),9);assert.equal(run('CANAAN_BAG.count(game.hero,"dust","eclat",0)'),2);
 assert.equal(errors.length,0,errors.join('\n'));
});
