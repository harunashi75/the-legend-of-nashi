const { test } = require('node:test');
const {
  fs,
  vm,
  assert,
  path,
  source,
  section,
  game,
  storageGame
} = require('./helpers/context.cjs');

test('Sauvegarde en donjon : reprise au portail avec or, objets, sacs et talents',()=>{
  const g=storageGame();g.setClass('druide',[0,2,4]);g.P.gold=123;g.P.hp=42;g.P.mp=31;
  g.instanceState={index:1};g.returnPos={x:700,y:900};g.P.x=5760;g.P.y=6384;
  g.bagLevel=4;g.openedChests=['chest1'];
  g.worldBossTimers={dragon:123456};g.inventory=[{id:'loot',slot:'armor',ilvl:90}];
  assert.equal(g.saveGame(),true);const saved=JSON.parse(g.db.get(g.CANAAN_PERSISTENCE.key));
  assert.equal(saved.schema,10);assert.equal(saved.heros.hote.player.x,700);assert.equal(saved.heros.hote.player.y,900);
  assert.deepEqual(saved.monde.openedChests,['chest1']);assert.deepEqual(saved.heros.invites,{});
  assert.equal('materials' in saved.heros.hote,false,'plus de matériaux de forge');
  g.P.gold=0;g.inventory=[];g.equipment={};
  assert.equal(g.loadGame(),true);
  assert.equal(g.P.x,700);assert.equal(g.P.y,900);assert.equal(g.P.hp,42);assert.equal(g.P.mp,31);
  assert.equal(g.instanceState,null);assert.equal(g.returnPos,null);assert.equal(g.world,g.overworld);
  assert.equal(g.P.gold,123);assert.equal(g.bagLevel,4);
  assert.equal(g.inventory[0].id,'loot');assert.equal(g.inventory[0].level,g.levelFromIlvl(90),'ancien iLvl converti');assert.equal(Object.keys(g.inventory[0].sec).length,2);
  assert.equal(JSON.stringify(g.CANAAN_CLASS.audit().talents),'[0,2,4]');assert.equal(g.CANAAN_CLASS.audit().id,'druide');assert.equal(g.worldBossTimers.dragon,123456);
});

test('Données invalides : filtrage des objets, coordonnées sûres et nombres finis',()=>{
  const g=storageGame(),saved=g.CANAAN_PERSISTENCE.snapshot();
  const hero=saved.heros.hote;
  hero.player={x:-50,y:20,gold:-20,hp:20,mp:12};
  hero.inventory=[null,3,{slot:'invalid',ilvl:2},{slot:'armor',ilvl:'infinity'},{id:'good',slot:'armor',ilvl:15}];
  hero.equipment={weapon:{slot:'armor',ilvl:90}};
  // Anciens matériaux de forge : rendus en or, valeurs invalides ignorées (4 noyaux × 200 or).
  hero.materials={ore:'Infinity',wood:-3,core:4.9};
  g.db.set(g.CANAAN_PERSISTENCE.key,JSON.stringify(saved));assert.ok(g.loadGame());
  assert.equal(g.P.x,g.CANAAN_SPAWN.x);assert.equal(g.P.gold,800);assert.equal(g.inventory.length,1);
  assert.equal(g.equipment.weapon,null);
});

test('Sauvegarde illisible préservée et erreur d’écriture remontée',()=>{
  const g=storageGame();g.db.set(g.CANAAN_PERSISTENCE.key,'{broken');
  assert.equal(g.loadGame(),false);assert.equal(g.saveGame(),false);
  assert.equal(g.db.get(g.CANAAN_PERSISTENCE.key),'{broken');
  const h=storageGame();h.localStorage.setItem=()=>{throw new Error('quota')};
  assert.equal(h.saveGame(),false);
});

test('Annonce de sauvegarde : ne pas annoncer un succès quand le stockage échoue',()=>{
  const g=game();let message;g.toast=s=>message=s;g.saveGame=()=>false;
  vm.runInContext(section('function pauseSave() {','\nfunction pauseOpenPanel'),g);
  g.pauseSave();assert.ok(message.includes('Échec'));
});

test('Une sauvegarde pendant la mort utilise le village, pas les coordonnées du donjon',()=>{
  const g=storageGame();g.P.dead=true;g.instanceState={index:1};g.returnPos={x:700,y:900};
  const saved=g.CANAAN_PERSISTENCE.snapshot().heros.hote;assert.equal(saved.player.x,g.CANAAN_SPAWN.x);assert.equal(saved.player.y,g.CANAAN_SPAWN.y);
});

test('Repartir à neuf : schéma ancien et JSON corrompu archivés avant une partie neuve sauvegardable',()=>{
  for(const raw of ['{corrompu', '  {"schema":9,"player":{"gold":999}}  ']){
    const g=storageGame(),p=g.CANAAN_PERSISTENCE,key=p.key;
    g.db.set(key,raw);
    g.P.gold=999;g.inventory.push({id:'lost-run',slot:'armor',ilvl:90});g.setClass('assassin',[0,1,2]);
    assert.equal(g.loadGame(),false);assert.equal(g.recoveryNodes.get('saveRecovery').hidden,false);
    assert.equal(g.saveGame(),false);assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('Repartir à neuf'));
    const writes=[],setItem=g.localStorage.setItem;
    g.localStorage.setItem=(k,value)=>{writes.push(k);return setItem(k,value)};
    assert.equal(p.restartFresh(),true);assert.equal(g.reloadCount,1);assert.equal(p._loadFailed,false);
    assert.ok(p.lastBackupKey.startsWith(key+'_backup_'));assert.equal(g.db.get(p.lastBackupKey),raw);
    assert.equal(writes[0],p.lastBackupKey);assert.equal(writes[1],key);
    const fresh=JSON.parse(g.db.get(key));assert.equal(fresh.schema,10);assert.equal(fresh.heros.hote.player.gold,0);
    assert.equal(fresh.heros.hote.inventory.length,2);assert.deepEqual(fresh.heros.hote.classe,{id:null,talents:[]});assert.equal(fresh.nom,'Aventure 1');
    assert.equal(g.recoveryNodes.get('saveRecovery').hidden,true);
    // Simuler le rechargement de page puis les sauvegardes manuelle et différée.
    assert.equal(g.loadGame(),true);assert.equal(g.P.gold,0);
    assert.equal(g.inventory.length,2);assert.equal(JSON.stringify(g.CANAAN_CLASS.audit().talents),'[]');
    assert.equal(Object.values(g.equipment).filter(Boolean).length,0);
    assert.equal(g.saveGame(),true);
    g.started=true;g.P.gold=17;p.requestSave();
    const [timer,callback]=g.scheduled.entries().next().value;g.scheduled.delete(timer);callback();
    assert.equal(JSON.parse(g.db.get(key)).heros.hote.player.gold,17);assert.equal(g.db.get(p.lastBackupKey),raw);
  }
});

test('Copie de secours : un nom de clé déjà utilisé ne remplace jamais un ancien secours',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE;g.Date={now:()=>123};
  g.db.set(p.key,'{broken');g.loadGame();
  const first=p.key+'_backup_123';g.db.set(first,'premier secours');
  assert.equal(p.restartFresh(),true);assert.equal(p.lastBackupKey,first+'_1');
  assert.equal(g.db.get(first),'premier secours');assert.equal(g.db.get(first+'_1'),'{broken');
});

test('Échec de copie ou de vérification : aucune écriture sur la sauvegarde originale',()=>{
  for(const mode of ['quota','unverified','read']){
    const g=storageGame(),p=g.CANAAN_PERSISTENCE,raw='{broken';g.db.set(p.key,raw);g.loadGame();
    const write=g.localStorage.setItem,read=g.localStorage.getItem;let activeWrites=0;
    g.localStorage.setItem=(key,value)=>{
      if(key===p.key){activeWrites++;return write(key,value)}
      if(mode==='quota')throw new Error('quota plein');
      if(mode==='unverified')return;
      return write(key,value);
    };
    if(mode==='read')g.localStorage.getItem=()=>{throw new Error('lecture refusée')};
    assert.equal(p.restartFresh(),false);assert.equal(activeWrites,0);assert.equal(g.db.get(p.key),raw);
    assert.equal(g.reloadCount,0);assert.equal(p._loadFailed,true);
    assert.equal(g.recoveryNodes.get('saveRecovery').hidden,false);
    assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('Impossible de repartir'));
    g.localStorage.getItem=read;
  }
});

test('Échec de création de la nouvelle partie : secours conservé, original intact et nouvel essai possible',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE,raw='{"schema":3}';g.db.set(p.key,raw);g.loadGame();
  const write=g.localStorage.setItem;
  g.localStorage.setItem=(key,value)=>{if(key===p.key)throw new Error('quota');return write(key,value)};
  assert.equal(p.restartFresh(),false);assert.equal(g.db.get(p.key),raw);assert.equal(g.db.get(p.lastBackupKey),raw);
  assert.equal(p._loadFailed,true);assert.equal(g.reloadCount,0);
  const firstBackup=p.lastBackupKey;g.localStorage.setItem=write;
  assert.equal(p.restartFresh(),true);assert.equal(g.db.get(firstBackup),raw);assert.equal(g.reloadCount,1);
});

test('Reprise à neuf refusée sur une sauvegarde lisible ou modifiée depuis l’échec',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE;
  assert.equal(p.restartFresh(),false);assert.equal(g.db.size,0);
  g.db.set(p.key,'{broken');g.loadGame();
  const newer=JSON.stringify(p.freshSnapshot());g.db.set(p.key,newer);
  assert.equal(p.restartFresh(),false);assert.equal(g.db.get(p.key),newer);assert.equal(g.db.size,1);
  assert.equal(g.reloadCount,0);assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('a changé'));
});

test('Sauvegarde : seul le schéma 10 est lu ; anciens et inconnus préservés, sauvegarde bloquée',()=>{
 for(const schema of [4,8,9,11,10.5,'10',null]){
  const g=storageGame(),p=g.CANAAN_PERSISTENCE,old=p.snapshot();old.schema=schema;old.heros.hote.player.gold=777;
  const raw=JSON.stringify(old);g.db.set(p.key,raw);g.P.gold=5;
  assert.equal(g.loadGame(),false,String(schema));assert.equal(p._loadFailed,true);assert.equal(g.P.gold,5);
  assert.equal(g.saveGame(),false);assert.equal(g.db.get(p.key),raw);assert.equal(g.db.size,1);
 }
 // Schéma 10 sans héros de l'hôte : refusé aussi.
 const bad=storageGame();bad.db.set(bad.CANAAN_PERSISTENCE.key,JSON.stringify({schema:10,heros:{}}));assert.equal(bad.loadGame(),false);
 const g=storageGame(),p=g.CANAAN_PERSISTENCE,cur=p.snapshot();cur.heros.hote.player.gold=321;cur.nom='Mon monde';
 cur.heros.invites={ami:{pseudo:'Ami 1',player:{}}};
 g.db.set(p.key,JSON.stringify(cur));assert.equal(g.loadGame(),true);assert.equal(g.P.gold,321);assert.equal(g.CANAAN_SAVE_SCHEMA,10);
 // Nom et héros des invités conservés à la sauvegarde suivante.
 assert.equal(g.saveGame(),true);const again=JSON.parse(g.db.get(p.key));
 assert.equal(again.nom,'Mon monde');assert.equal(again.heros.invites.ami.pseudo,'Ami 1');
});

test('Sauvegardes en fichiers : écriture sûre, schéma 10, copies vérifiées, suppression avec secours',()=>{
 const os=require('node:os');
 const {createSaveStore,SAVE_SCHEMA,KEEP_SESSION}=require('../app/saves.js');
 assert.equal(SAVE_SCHEMA,10);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canaan-saves-'));
 try{
  const store=createSaveStore(dir),text=JSON.stringify({schema:10,nom:'Test',heros:{hote:{}}});
  assert.equal(store.read(1),null);assert.deepEqual(store.list().map(s=>s.text),[null,null,null]);
  assert.equal(store.write(1,text),true);assert.equal(store.read(1),text);
  assert.equal(fs.existsSync(path.join(dir,'slot-1.json')),true);assert.equal(fs.existsSync(path.join(dir,'slot-1.json.tmp')),false);
  // Refus : autre schéma, JSON invalide, slot inconnu, contenu non textuel ; le fichier existant reste intact.
  assert.throws(()=>store.write(1,JSON.stringify({schema:9})),/Schéma/);assert.throws(()=>store.write(1,'{x'));
  for(const slot of [0,4,'1',1.5])assert.throws(()=>store.write(slot,text),/Slot invalide/);
  assert.throws(()=>store.write(2,{schema:10}),/invalide/);assert.equal(store.read(1),text);
  assert.throws(()=>store.backupText('../x','session',text),/invalide/);
  // Copies « session » : seules les plus récentes sont gardées ; les autres raisons ne sont jamais effacées.
  const imported=store.backupText('import-navigateur','schema9','{"schema":9}');
  for(let i=0;i<KEEP_SESSION+3;i++)store.backup(1,'session');
  const files=fs.readdirSync(path.join(dir,'backups'));
  assert.equal(files.filter(f=>f.startsWith('slot-1-')&&f.includes('-session')).length,KEEP_SESSION);
  assert.ok(files.includes(imported));assert.equal(fs.readFileSync(path.join(dir,'backups',imported),'utf8'),'{"schema":9}');
  // Supprimer : le slot disparaît, une copie « suppression » identique reste.
  const kept=store.remove(1);assert.equal(store.read(1),null);
  assert.match(kept,/^slot-1-.*-suppression\.json$/);assert.equal(fs.readFileSync(path.join(dir,'backups',kept),'utf8'),text);
  assert.equal(store.remove(2),null);assert.equal(store.backup(3,'session'),null);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('Slots d’aventure : résumé, création sans écrasement, suppression avec secours et importation unique du schéma 9',()=>{
 const g=storageGame(),p=g.CANAAN_PERSISTENCE;
 assert.deepEqual([1,2,3].map(n=>p.summary(n).state),['vide','vide','vide']);
 assert.equal(p.createSlot(2,'  Monde <b>de</b> Lira  '),true);
 const created=JSON.parse(g.db.get('canaan_slot_2'));assert.equal(created.schema,10);assert.equal(created.nom,'Monde bde/b Lira');
 assert.equal(p.summary(2).state,'aventure');assert.equal(p.summary(2).nom,created.nom);assert.doesNotMatch(created.nom,/[<>]/);
 assert.equal(p.createSlot(2,'Autre'),false);assert.equal(JSON.parse(g.db.get('canaan_slot_2')).nom,created.nom);
 assert.equal(p.createSlot(4,'x'),false);assert.equal(p.createSlot(3,''),true);assert.equal(p.summary(3).nom,'Aventure 3');
 // Nom du héros : nettoyé, gardé dans la sauvegarde et le résumé ; « Héros » s'il est laissé vide.
 assert.equal(p.summary(3).heros,'Héros');p.deleteSlot(3);
 assert.equal(p.createSlot(3,'Monde','',null,'  Lira <la> Brave  '),true);
 assert.equal(JSON.parse(g.db.get('canaan_slot_3')).heros.hote.name,'Lira la Brave');assert.equal(p.summary(3).heros,'Lira la Brave');
 g.db.set('canaan_slot_1','{cassé');assert.equal(p.summary(1).state,'illisible');
 // Invités listés pour la confirmation de suppression.
 const withGuests=JSON.parse(g.db.get('canaan_slot_3'));withGuests.heros.invites={a:{pseudo:'Ami 1'},b:{pseudo:'Ami 2'}};
 g.db.set('canaan_slot_3',JSON.stringify(withGuests));assert.equal(JSON.stringify(p.summary(3).invites),'["Ami 1","Ami 2"]');
 assert.equal(p.deleteSlot(3),true);assert.equal(g.db.has('canaan_slot_3'),false);
 assert.ok([...g.db.keys()].some(k=>k.startsWith('canaan_slot_3_backup_')&&g.db.get(k)===JSON.stringify(withGuests)));
 // Importation : seulement si aucun slot n'existe.
 const legacy={schema:9,version:'1.9.0',player:{x:1,y:2,hp:50,mp:20,gold:121914},kills:7,inventory:[{id:'a',slot:'armor',ilvl:90}],
  equipment:{helm:{id:'h',slot:'helm',ilvl:100}},openedChests:['c1'],worldBossTimers:{titan:5},materials:{ore:3},bagLevel:2,
  ways:{selected:[],learned:{},points:0},rubis:{owned:{gardien:1},equipped:['gardien',null,null,null,null,null]},arena:{best:12,attempts:1,completed:true,lastBoss:'Aurelion'}};
 g.db.set('canaan_dev_18999_state',JSON.stringify(legacy));
 assert.equal(p.importLegacy(),false);assert.ok(g.db.has('canaan_dev_18999_state'));
 const h=storageGame(),q=h.CANAAN_PERSISTENCE,raw=JSON.stringify(legacy);h.db.set('canaan_dev_18999_state',raw);
 assert.equal(q.importLegacy(),true);assert.equal(h.db.has('canaan_dev_18999_state'),false);
 assert.ok([...h.db.keys()].some(k=>k.startsWith('import-navigateur_backup_')&&h.db.get(k)===raw));
 const slot=JSON.parse(h.db.get('canaan_slot_1'));
 assert.equal(slot.schema,10);assert.equal(slot.nom,'Aventure importée');assert.deepEqual(slot.monde,{openedChests:['c1'],worldBossTimers:{titan:5}});
 for(const key of ['player','kills','inventory','equipment','materials','bagLevel','ways','rubis','arena'])assert.deepEqual(slot.heros.hote[key],legacy[key],key);
 assert.deepEqual(slot.heros.invites,{});assert.equal(slot.resume.gold,121914);assert.equal(slot.resume.level,Math.round(100*60/190),'niveau de la meilleure pièce portée');
 assert.equal(q.importLegacy(),false);
 // Le slot importé se charge comme une aventure normale.
 // Les 3 minerais de l'ancienne partie sont rendus en or au chargement (10 or l'unité), et sa Rune aussi (300 or) :
 // les Runes ont laissé place aux artéfacts de l'Arène.
 q.selectSlot(1);assert.equal(h.loadGame(),true);assert.equal(h.P.gold,121914+30+300);assert.equal(h.kills,7);assert.equal(h.openedChests[0],'c1');
 assert.equal(q.meta.nom,'Aventure importée');
 // Un schéma 9 abîmé n'est jamais importé ni retiré.
 const k=storageGame();k.db.set('canaan_dev_18999_state','{abîmé');assert.equal(k.CANAAN_PERSISTENCE.importLegacy(),false);assert.equal(k.db.get('canaan_dev_18999_state'),'{abîmé');
 // Slot à ouvrir après rechargement : lu une seule fois, validé.
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(p.setPending(2),true);assert.equal(p.takePending(),2);assert.equal(p.takePending(),null);
 session.set('canaan_pending_slot','7');assert.equal(p.takePending(),null);
 assert.throws(()=>p.selectSlot(0),/Slot invalide/);
});

test('Menu des aventures : trois cartes, création, confirmation de suppression avec invités, noms échappés',()=>{
 const {g,run,nodes,errors,click}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const html=()=>nodes.get('slotMenu').innerHTML;
 // Sans aventure choisie, le jeu ne démarre pas : le menu s'affiche.
 assert.equal(run('started'),false);assert.equal((html().match(/class="slot-card/g)||[]).length,3);
 assert.match(html(),/data-action="newSlot" data-slot="1"/);assert.doesNotMatch(html(),/openSaveFolder/);
 run('CANAAN_SLOT_MENU.newSlot(2)');assert.match(html(),/id="slotName"[^>]*value="Aventure 2"/);
 nodes.get('slotName').value='<img src=x onerror=alert(1)>';
 let reloads=0;g.location.reload=()=>reloads++;
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(run('CANAAN_SLOT_MENU.create(2)'),true);assert.equal(reloads,1);assert.equal(session.get('canaan_pending_slot'),'2');
 run('CANAAN_SLOT_MENU.render()');assert.match(html(),/data-action="playSlot" data-slot="2"/);assert.doesNotMatch(html(),/<img/);
 // Confirmation : les pseudos des invités dont le héros sera perdu sont listés.
 const data=JSON.parse(g.localStorage.getItem('canaan_slot_2'));data.heros.invites={x:{pseudo:'Lina'}};g.localStorage.setItem('canaan_slot_2',JSON.stringify(data));
 run('CANAAN_SLOT_MENU.askDelete(2)');assert.match(html(),/Lina/);assert.match(html(),/confirmDeleteSlot/);
 run('CANAAN_SLOT_MENU.cancel()');assert.doesNotMatch(html(),/confirmDeleteSlot/);
 run('CANAAN_SLOT_MENU.askDelete(2)');assert.equal(run('CANAAN_SLOT_MENU.remove(2)'),true);
 assert.equal(g.localStorage.getItem('canaan_slot_2'),null);assert.match(html(),/Aventure supprimée/);
 // Chaque bouton du menu passe par la table des contrôles : un clic valide ses arguments, puis appelle le menu.
 run('globalThis.__menu=CANAAN_SLOT_MENU;globalThis.__calls=[];CANAAN_SLOT_MENU=Object.fromEntries(Object.keys(__menu).map(k=>[k,typeof __menu[k]==="function"?(...a)=>{__calls.push([k,...a])}:__menu[k]]))');
 try{
  for(const [action,data] of [['playSlot',{slot:'1'}],['newSlot',{slot:'2'}],['createSlot',{slot:'3'}],['askDeleteSlot',{slot:'1'}],['confirmDeleteSlot',{slot:'2'}],['cancelSlotMenu'],['openSaveFolder']])click(action,data);
  assert.deepEqual(JSON.parse(run('JSON.stringify(__calls)')),[['play',1],['newSlot',2],['create',3],['askDelete',1],['remove',2],['cancel'],['openFolder']]);
  // Un argument invalide est refusé avant tout effet.
  assert.throws(()=>click('confirmDeleteSlot',{slot:'2;x'}),/Argument d’action invalide/);assert.equal(run('__calls.length'),7);
 }finally{run('CANAAN_SLOT_MENU=__menu')}
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Démarrage sur un slot choisi : chargement, copie de session, partie lancée ; retour au menu par rechargement',()=>{
 const save={schema:10,version:'1.9.0',nom:'Monde test',created:1,updated:2,resume:{ilvl:0,gold:4242},monde:{openedChests:[],worldBossTimers:{}},
  heros:{hote:{player:{x:3480,y:11400,hp:80,mp:40,gold:4242},kills:3,inventory:[],equipment:{},materials:{},bagLevel:0,ways:{selected:[],learned:{},points:0},rubis:{owned:{},equipped:[null,null,null,null,null,null]},arena:{best:0,attempts:0,completed:false,lastBoss:''}},invites:{}}};
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config')){
   run("globalThis.__db=new Map();localStorage={getItem:k=>__db.get(k)??null,setItem:(k,v)=>__db.set(k,String(v)),removeItem:k=>__db.delete(k)}");
   run("globalThis.__session=new Map([['canaan_pending_slot','3']]);sessionStorage={setItem:(a,b)=>__session.set(a,b),getItem:a=>__session.get(a)??null,removeItem:a=>__session.delete(a)}");
   run('localStorage.setItem("canaan_slot_3",'+JSON.stringify(JSON.stringify(save))+')');
  }
 }});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('CANAAN_PERSISTENCE.slot'),3);assert.equal(run('started'),true);assert.equal(run('P.gold'),4242);
 assert.equal(run('CANAAN_PERSISTENCE.meta.nom'),'Monde test');assert.equal(run('__session.size'),0);
 // Copie « session » prise au lancement, identique au slot chargé.
 assert.equal(run('[...__db.keys()].filter(k=>k.startsWith("canaan_slot_3_backup_")&&__db.get(k)===__db.get("canaan_slot_3")).length'),1);
 // Retour au menu : sauvegarde puis rechargement (aucun état d'une aventure ne survit).
 let reloads=0;g.location.reload=()=>reloads++;
 run('P.gold=5000;pauseToTitle()');assert.equal(reloads,1);assert.equal(run('started'),false);
 assert.equal(JSON.parse(run('localStorage.getItem("canaan_slot_3")')).heros.hote.player.gold,5000);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Format partagé des sauvegardes : schéma 10, aventure neuve, résumé, import du schéma 9, même source pour le jeu et l’application',async()=>{
 const s=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','save','schema.js')).href);
 assert.equal(s.SAVE_SCHEMA,10);assert.equal(s.SLOT_COUNT,3);assert.equal(require('../app/saves.js').SAVE_SCHEMA,s.SAVE_SCHEMA);
 assert.deepEqual([0,1,3,4,'1'].map(s.isValidSlot),[false,true,true,false,false]);
 const fresh=s.freshSave({nom:' <Mon> monde ',slot:2,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300});
 assert.equal(s.isValidSave(fresh),true);assert.equal(fresh.nom,'Mon monde');assert.equal(fresh.heros.hote.player.mp,300);
 assert.deepEqual(Object.keys(fresh.heros.hote.equipment).sort(),[...s.SAVED_GEAR_SLOTS].sort());assert.deepEqual(fresh.heros.invites,{});
 assert.equal(s.isValidSave({schema:10,heros:{}}),false);assert.equal(s.isValidSave({...fresh,schema:9}),false);
 assert.deepEqual(s.summarizeSave(null,1),{slot:1,state:'vide'});assert.equal(s.summarizeSave('{x',1).state,'illisible');
 const sum=s.summarizeSave(JSON.stringify({...fresh,resume:{level:37.4,gold:12.9},heros:{...fresh.heros,invites:{a:{pseudo:'Lina'}}}}),2);
 assert.deepEqual({...sum},{slot:2,state:'aventure',nom:'Mon monde',updated:5,level:37,gold:12,classe:null,heros:'Héros',invites:['Lina']});
 // Classe choisie à la création : dans le héros et le résumé ; une classe inconnue est ignorée.
 const druid=s.freshSave({nom:'D',slot:1,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300,classe:'druide'});
 assert.deepEqual(druid.heros.hote.classe,{id:'druide',talents:[]});assert.equal(s.summarizeSave(JSON.stringify(druid),1).classe,'druide');
 assert.equal(s.freshSave({nom:'X',slot:1,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300,classe:'pirate'}).heros.hote.classe.id,null);
 // Ancienne aventure : l'iLvl moyen du résumé devient un niveau.
 assert.equal(s.summarizeSave(JSON.stringify({...fresh,resume:{ilvl:190,gold:0}}),2).level,60);
 assert.equal(fresh.heros.hote.level,1);assert.equal(fresh.heros.hote.exp,0);assert.ok(fresh.heros.hote.inventory.every(i=>i.level===1&&!('ilvl' in i)));
 const legacy=s.convertLegacySave({schema:9,player:{gold:7},kills:3,equipment:{helm:{ilvl:90}},openedChests:['c'],extra:1},{version:'1.9.0',now:1});
 assert.equal(s.isValidSave(legacy),true);assert.equal(legacy.heros.hote.kills,3);assert.equal(legacy.heros.hote.extra,undefined);
 assert.equal(legacy.resume.level,Math.round(90*60/190));assert.deepEqual(legacy.monde,{openedChests:['c'],worldBossTimers:{}});
});
