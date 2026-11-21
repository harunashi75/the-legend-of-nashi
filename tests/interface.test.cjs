const { test } = require('node:test');
const {
  fs,
  vm,
  assert,
  path,
  source,
  script,
  linkGameState
} = require('./helpers/context.cjs');

test('Paramètres : depuis l’accueil et la pause, son et volumes déplacés, secousses de l’écran gardées, Échap ferme, quitter sauvegarde',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const html=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 // Un bouton Paramètres sur l'accueil, dans la pause et dans la barre ; Quitter sur l'accueil, la pause et les paramètres.
 assert.ok(html.indexOf('id="titleTools"')>0&&/id="titleTools">[^]*?data-action="openSettings"[^]*?data-action="quitGame"/.test(html));
 assert.match(html,/id="pauseCard">[^]*?data-action="openSettings"[^]*?data-action="quitGame"/);
 // Le son et ses deux volumes sont dans les paramètres, plus à côté de la mini-carte.
 const card=html.slice(html.indexOf('id="settingsCard"'));
 for(const id of ['soundToggle','musicVolume','sfxVolume','setFullscreen','setResolution','setZoom','setVsync','setRestartRow','setFpsCap','setFps','setGlow','setParticles','setShake','setDamage'])assert.ok(card.includes('id="'+id+'"'),id);
 const bar=html.slice(html.indexOf('id="layoutTools"'),html.indexOf('</div>',html.indexOf('id="layoutTools"')));
 assert.doesNotMatch(bar,/soundToggle|musicVolume|sfxVolume/);
 // Ouvrir, couper les secousses (gardé dans les préférences, appliqué au dessin), fermer avec Échap.
 run('openSettings()');assert.equal(run('CANAAN_SETTINGS.isOpen()'),true);
 run('settingsToggle("shake")');assert.equal(run('canaanDisplay.shake'),false);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).shake'),false);
 run('closeSettings()');assert.equal(run('CANAAN_SETTINGS.isOpen()'),false);
 run('settingsToggle("shake")');assert.equal(run('canaanDisplay.shake'),true);
 // Limite d'images : un cycle de valeurs (aucune, 30, 60…), gardée ; les clés inconnues sont ignorées.
 run('settingsStep("fpscap",1)');assert.equal(run('canaanDisplay.fpsCap'),30);run('settingsStep("fpscap",-1)');assert.equal(run('canaanDisplay.fpsCap'),0);
 run('settingsStep("fpscap",-1)');assert.equal(run('canaanDisplay.fpsCap'),240);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).fpsCap'),240);run('settingsStep("fpscap",1)');
 run('settingsToggle("inconnu");settingsToggle("damage")');assert.equal(run('canaanDisplay.damage'),false);
 // Chiffres de dégâts masqués : « 120 » et « -35 » ne sont plus dessinés, « +7 or » si.
 const texts=[];g.__texts=texts;run('{const real=ctx.fillText;ctx.fillText=(t,...a)=>{__texts.push(String(t));return real.call(ctx,t,...a)};floaters=[{x:P.x,y:P.y,txt:120,c:"#f00",life:40},{x:P.x,y:P.y,txt:"-35",c:"#f00",life:40},{x:P.x,y:P.y,txt:"+7 or",c:"#ff0",life:40}];started=true;draw();ctx.fillText=real}');
 assert.ok(texts.includes('+7 or')&&!texts.includes('120')&&!texts.includes('-35'),JSON.stringify(texts.slice(0,8)));
 run('settingsToggle("damage")');
 // Quitter sauvegarde la partie en cours (hors application de bureau : un message invite à fermer l'onglet).
 let saves=0;g.__countSave=()=>saves++;run('{const real=saveGame;saveGame=()=>{__countSave();return real()};started=true;quitGame();saveGame=real}');
 assert.equal(saves,1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Carte M zoomable et mini-carte qui suit le héros, sur l’île comme en donjon ; marche plus douce',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS');
 // Carte M : outils de zoom, liste des biomes, vue d'ensemble à l'ouverture.
 run('closePanels();toggleMap()');
 const html=g.document.getElementById('window').innerHTML;
 for(const tag of ['data-action="mapZoom" data-step="-1"','data-action="mapZoom" data-step="1"','data-action="mapCenter"','data-action="mapFit"','id="bigMap"','Niveaux 1–10'])assert.ok(html.includes(tag),tag);
 const view=()=>JSON.parse(run('JSON.stringify(CANAAN_MAP.view())'));
 assert.equal(view().fitted,true);
 // Zoomer, se centrer (la vue suit le héros), dézoomer jusqu'à la vue d'ensemble.
 const s0=view().scale;run('CANAAN_MAP.zoom(1)');assert.ok(view().scale>s0&&!view().fitted);
 run('CANAAN_MAP.center()');run('P.x+=10*TS;drawBigMap()');const v=view();
 assert.equal(v.follow,true);assert.ok(Math.abs(v.cx-run('P.x/TS'))<0.01&&v.scale>=6,JSON.stringify(v));
 for(let i=0;i<12;i++)run('CANAAN_MAP.zoom(1)');assert.equal(view().scale,16,'zoom maximal');
 for(let i=0;i<12;i++)run('CANAAN_MAP.zoom(-1)');assert.equal(view().fitted,true);
 run('CANAAN_MAP.center();CANAAN_MAP.fit()');assert.equal(view().fitted,true);
 // Survol d'une instance dans la liste : entourée, puis effacée.
 run('highlightMapInstance(2,true)');assert.equal(view().place,2);run('highlightMapInstance(2,false)');assert.equal(view().place,null);
 // Les boutons passent par les actions autorisées.
 run('dispatchCanaanAction({dataset:{action:"mapZoom",step:"1"}},{stopPropagation(){}})');assert.equal(view().fitted,false);
 run('dispatchCanaanAction({dataset:{action:"mapFit"}},{stopPropagation(){}})');assert.equal(view().fitted,true);
 // Mini-carte : dessinée sans erreur, zoom rapproché par défaut ; un repère de quête par personnage qui en propose.
 for(let i=0;i<6;i++)run('drawMinimap()');assert.equal(run('CANAAN_MAP.miniZoom()'),5);
 assert.ok(run('Object.values(CANAAN_QUESTS.npcs()).filter(n=>CANAAN_QUESTS.npcMode(game.hero,n)==="offer").length')>=1);
 // En donjon : le plan de l'instance, ses ennemis et son boss.
 run("closePanels();game.hero.level=20;recomputeStats();enterInstance(0,'normal')");assert.ok(run('!!game.world.instance'));
 run('toggleMap()');assert.match(g.document.getElementById('window').innerHTML,/Ennemis restants/);assert.equal(view().fitted,true);
 for(let i=0;i<6;i++)run('drawMinimap()');run('closePanels();leaveInstance()');
 // Marche plus douce : environ neuf images par seconde (quatre images par pas de 6,7 unités d'anim).
 const frames=[];g.__frames=frames;
 // Une seconde de marche (60 pas, anim +0,25 à chaque pas) : on compte les changements de sprite dessiné.
 // Seul le corps compte (dessiné à sa taille) ; l'arme tenue est dessinée à part, tournée.
 run('{const c={save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},arc(){},fill(){},stroke(){},closePath(){},moveTo(){},lineTo(){},createRadialGradient:()=>({addColorStop(){}}),drawImage(img,...a){if(a.length===4)__frames.push(img)},globalAlpha:1};for(let i=0;i<60;i++){P.vx=3;P.vy=0;drawPixelHero(c,P.x,P.y,"#fff",i*0.25,true)}}');
 const changes=frames.filter((f,i)=>i&&f!==frames[i-1]).length;
 assert.ok(changes>=6&&changes<=10,'changements d’image en une seconde : '+changes);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Commandes : délégation, multitouch, annulation, pause et visée',()=>{
 const listeners={},rootListeners={},skillListeners={},calls=[];
 const names=['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','equipReserveWeapon','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','toggleJournal','buyGear','closePanels','interact','switchWeapon','useSkill'];
 const g={Map,keys:{},started:true,paused:false,P:{dead:false,x:10,y:20,face:-1},monsters:[],mouseWorldX:0,mouseWorldY:0,CanaanStages:{},modalOpen:()=>false,
  CANAAN_PERSISTENCE:{restartFresh:()=>calls.push(['restart'])},
  document:{hidden:false,addEventListener:(name,fn)=>listeners[name]=fn,getElementById:id=>id==='touchControls'?{addEventListener:(name,fn)=>rootListeners[name]=fn}:id==='skills'?{addEventListener:(name,fn)=>skillListeners[name]=fn}:{style:{display:'none'}}},
  addEventListener:(name,fn)=>listeners[name]=fn};
 for(const name of names)g[name]=(...args)=>calls.push([name,...args]);
 g.window=g;linkGameState(g);vm.createContext(g);vm.runInContext(script('canaan-controls'),g);
 const event={stopPropagation(){calls.push(['stop'])}};
 g.dispatchCanaanAction({dataset:{action:'unequip',slot:'weapon2'}},event);
 assert.deepEqual(calls.splice(0),[['hideGearTooltip'],['unequip','weapon2']]);
 g.dispatchCanaanAction({dataset:{action:'sellInventoryCell',index:'2',itemId:'test-id'}},event);
 assert.deepEqual(calls.shift(),['sellInventoryCell',2,'test-id',event]);
 g.dispatchCanaanAction({dataset:{action:'equipReserve',index:'3'}},event);
 assert.deepEqual(calls.splice(0),[['stop'],['equipReserveWeapon',3]]);
 g.dispatchCanaanAction({dataset:{action:'resume'}},event);assert.deepEqual(calls.shift(),['togglePause',false]);
 g.dispatchCanaanAction({dataset:{action:'togglePause'}},event);assert.deepEqual(calls.shift(),['togglePause']);
 g.dispatchCanaanAction({dataset:{action:'restartFresh'}},event);assert.deepEqual(calls.shift(),['restart']);
 skillListeners.click({target:{closest:selector=>selector==='[data-skill]'?{dataset:{skill:'3'}}:null}});
 assert.deepEqual(calls.shift(),['useSkill',3]);
 skillListeners.click({target:{closest:()=>null}});assert.equal(calls.length,0);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'alert'}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'toString'}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'sellInventoryCell',index:'1;alert(1)',itemId:'a'}},event),/Argument d’action invalide/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'enterInstance',instance:"1')"}},event),/Argument d’action invalide/);
 // Plus de forge : ses anciennes actions sont inconnues.
 for(const action of ['openCrafting','selectForgeItem','upgradeItem','setWeaponPassive'])assert.throws(()=>g.dispatchCanaanAction({dataset:{action}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'unequip',slot:"x')"}},event),/Argument d’action invalide/);
 assert.equal(calls.length,0);
 const press=(id,data)=>rootListeners.pointerdown({pointerId:id,preventDefault(){},target:{closest:()=>({dataset:data,setPointerCapture(){}})}});
 press(1,{direction:'arrowup'});press(2,{direction:'arrowright'});
 assert.equal(g.keys.arrowup,true);assert.equal(g.keys.arrowright,true);
 rootListeners.pointerup({pointerId:1});assert.equal(g.keys.arrowup,false);assert.equal(g.keys.arrowright,true);
 rootListeners.pointercancel({pointerId:2});assert.equal(g.keys.arrowright,false);
 press(3,{skill:'0'});assert.deepEqual(calls.shift(),['useSkill',0]);assert.equal(g.mouseWorldX,-90);assert.equal(g.mouseWorldY,20);
 g.monsters=[{x:50,y:20,hp:5},{x:200,y:20,hp:5}];press(4,{skill:'1'});assert.equal(g.mouseWorldX,50);calls.length=0;
 press(5,{direction:'arrowleft'});g.paused=true;g.CanaanStages.updateTouchControls();assert.equal(g.keys.arrowleft,false);
 press(6,{skill:'2'});assert.equal(calls.length,0);
 g.paused=false;press(7,{direction:'arrowdown'});listeners.blur();assert.equal(g.keys.arrowdown,false);
});

test('Survols délégués : objet, emplacement, mouvement et transitions entre enfants',()=>{
 const listeners={},calls=[];
 const g={Map,CanaanStages:{},keys:{},document:{addEventListener:(name,fn)=>listeners[name]=fn,getElementById:()=>({addEventListener(){}})},addEventListener(){},
  CANAAN_PERSISTENCE:{restartFresh(){}},
  showGearTooltip:(...a)=>calls.push(['bag',...a]),showEquippedTooltip:(...a)=>calls.push(['slot',...a]),moveGearTooltip:()=>calls.push(['move']),highlightMapInstance:(...a)=>calls.push(['map',...a])};
 const actions=['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','toggleJournal','buyGear','closePanels'];
 for(const name of actions)g[name]=()=>calls.push([name]);
 g.window=g;linkGameState(g);vm.createContext(g);vm.runInContext(script('canaan-controls'),g);
 const element={dataset:{tooltipIndex:'2'},contains:()=>false};const event={target:{closest:()=>element},relatedTarget:null};
 listeners.pointerover(event);assert.equal(calls.shift()[0],'bag');
 listeners.pointermove(event);assert.deepEqual(calls.shift(),['move']);
 element.contains=()=>true;listeners.pointerout({...event,relatedTarget:{}});assert.equal(calls.length,0);
 element.contains=()=>false;listeners.pointerout(event);assert.deepEqual(calls.shift(),['hideGearTooltip']);
 element.dataset={tooltipSlot:'weapon2'};listeners.pointerover(event);assert.deepEqual(calls.shift().slice(0,2),['slot','weapon2']);
 element.dataset={mapInstance:'3'};listeners.pointerover(event);listeners.pointerout(event);assert.deepEqual(calls.splice(0),[['map',3,true],['map',3,false]]);
 // Cibles sans closest (document) ou nœud texte : aucune erreur, le texte remonte à son parent.
 const doc={nodeType:9};
 for(const name of ['pointerover','pointerout','pointermove','click'])listeners[name]({target:doc,relatedTarget:null});
 assert.equal(calls.length,0);
 element.dataset={tooltipIndex:'4'};
 listeners.pointerover({target:{nodeType:3,parentElement:{closest:()=>element}},relatedTarget:null});assert.deepEqual(calls.shift().slice(0,2),['bag',4]);
 // Aucun écouteur de changement (aucun filtre dans les fenêtres).
 assert.equal(listeners.change,undefined);
});

test('Interface générée : actions autorisées, catalogue officiel, musique et accès aux instances',()=>{
 const {g,nodes,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const report=g.CANAAN_DEV.selfTest();assert.equal(report.passed,report.total);
 const panels=[];g.capture=h=>panels.push(h);
 run('showPanel=capture;modernPanel=capture;started=true;paused=false;inventory=[...inventory,{id:"reserve-test",slot:"weapon",rarity:"Rare",ilvl:15,weaponType:"bow"}];renderInventory();renderCharacter();renderTalents();game.hero.classe={id:"paladin",talents:[1]};game.hero.level=20;renderTalents();openPortal({instance:0});openShop({name:"Test",village:"Solaria"})');

 // Exécuter chaque action réelle avec ses attributs, sur des doublures des fonctions du jeu.
 const actionCalls=[];g.actionCalls=actionCalls;
 const stubbed=['togglePause','pauseOpenPanel','pauseToTitle','startGame','toggleMap','enterInstance','renderInventory','renderCharacter','unequip','equipReserveWeapon','buyGear'];
 run('globalThis.realActions={'+stubbed.join(',')+',restartFresh:CANAAN_PERSISTENCE.restartFresh}');
 run(`for(const name of ['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','toggleGroup','toggleTrade','toggleProfessions','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','equipReserveWeapon','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','classPage','classPageTo','toggleJournal','buyGear','closePanels','openSettings','closeSettings','settingsToggle','settingsStep','settingsRestart','settingsTab','keybindReset','quitGame'])
  globalThis[name]=(...args)=>actionCalls.push([name,...args]);
  togglePause=globalThis.togglePause;pauseOpenPanel=globalThis.pauseOpenPanel;pauseToTitle=globalThis.pauseToTitle;startGame=globalThis.startGame;
  toggleMap=globalThis.toggleMap;enterInstance=globalThis.enterInstance;renderInventory=globalThis.renderInventory;
  renderCharacter=globalThis.renderCharacter;unequip=globalThis.unequip;equipReserveWeapon=globalThis.equipReserveWeapon;buyGear=globalThis.buyGear;
  CANAAN_PERSISTENCE.restartFresh=()=>actionCalls.push(['restartFresh'])`);
 const html=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 const dataset=tag=>Object.fromEntries([...tag.matchAll(/\bdata-([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value]));
 let count=0;
 for(const text of [...panels,html])for(const [tag] of text.matchAll(/<[a-z]+\b[^>]*\bdata-action="[^"]*"[^>]*>/g)){
  const element={dataset:dataset(tag)};actionCalls.length=0;
  assert.doesNotThrow(()=>g.dispatchCanaanAction(element,{stopPropagation(){}}),tag);
  assert.ok(actionCalls.length>0,tag);
  for(const [,...args] of actionCalls)for(const value of args)assert.ok(value===undefined||value===false||typeof value==='string'&&value.length>0||Number.isInteger(value)||typeof value==='object',tag);
  count++;
 }
 // Sans la forge (et ses dizaines de boutons), une cinquantaine d'actions réelles restent à vérifier.
 assert.ok(count>=40,String(count));
 assert.doesNotMatch([...panels,html].join(''),/data-action="[^"]*[();]/);
 run('({'+stubbed.join(',')+'}=realActions);CANAAN_PERSISTENCE.restartFresh=realActions.restartFresh');
 let music=0;g.CanaanStages.restartMusic=()=>music++;
 run('P.x=-100;P.y=-100;startGame()');assert.equal(music,1);assert.equal(run('P.x===CANAAN_SPAWN.x&&P.y===CANAAN_SPAWN.y'),true);
 run('game.hero.level=1;enterInstance(0)');assert.equal(run('instanceState'),null,'niveau insuffisant');assert.equal(music,1);
 run('game.hero.level=60;enterInstance(0)');assert.equal(run('instanceState.index'),0);assert.equal(music,2);
 assert.ok(run('monsters.some(m=>m.boss&&m._scaledMaxHp===m.mhp)'));
});

test('Version 1.9.0 : affichage à la fréquence de l’écran par interpolation et héros plus rapide',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 run('startGame();globalThis.ticks=0;globalThis.frames=[];const u=updateWorld;updateWorld=()=>{ticks++;u()};runDrawPipeline=()=>frames.push([P.x,camX])');
 // 144 images par seconde : une image dessinée par rafraîchissement, toujours 60 ticks de simulation par seconde.
 run('CANAAN_CLOCK.reset();for(let i=0;i<=144;i++)loop(i*1000/144)');
 assert.equal(run('frames.length'),145);assert.ok(Math.abs(run('ticks')-60)<=1,String(run('ticks')));
 // L'image est placée entre les deux derniers ticks, puis la vraie position est rendue à la simulation.
 run('frames.length=0;P.x=1000;camX=400;canaanRememberPositions();P.x=1010;camX=420;canaanDrawInterpolated(0.25)');
 assert.deepEqual(JSON.parse(run('JSON.stringify(frames[0])')),[1002.5,405]);assert.equal(run('P.x+","+camX'),'1010,420');
 run('monsters=[{x:100,y:100,hp:10}];canaanRememberPositions();monsters[0].x=108;frames.length=0;runDrawPipeline=()=>frames.push(monsters[0].x);canaanDrawInterpolated(0.5)');
 assert.deepEqual(JSON.parse(run('JSON.stringify(frames)')),[104]);assert.equal(run('monsters[0].x'),108);
 // Téléportation : pas de glissement à travers la carte.
 run('canaanRememberPositions();monsters[0].x=5000;frames.length=0;canaanDrawInterpolated(0.5)');assert.deepEqual(JSON.parse(run('JSON.stringify(frames)')),[5000]);
 // Un dessin qui échoue ne laisse jamais une position intermédiaire dans la simulation.
 run('canaanRememberPositions();monsters[0].x=5010;runDrawPipeline=()=>{throw new Error("dessin")}');
 assert.throws(()=>run('canaanDrawInterpolated(0.5)'),/dessin/);assert.equal(run('monsters[0].x'),5010);
 // En pause : positions réelles.
 run('frames.length=0;runDrawPipeline=()=>frames.push(P.x);P.x=2000;canaanRememberPositions();P.x=2010;paused=true;loop(5000);loop(5010)');assert.equal(run('frames.at(-1)'),2010);
 // Vitesse du héros : 4,1 px par tick (+20 %), toujours modulée par la statistique de vitesse.
 assert.equal(run('CANAAN_PLAYER_SPEED'),4.1);
 // Un pas vers la droite avec une Vitesse de 0 puis de 50 : 4,1 px puis 50 % de plus.
 const step=speed=>run('{const cs=characterStats;characterStats=h=>({...cs(h),speed:'+speed+'});P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;P.dead=false;playerStun=0;'+
  'game.hero.intent.dx=1;game.hero.intent.dy=0;const x0=P.x;try{stepHero(game.hero)}finally{characterStats=cs;game.hero.intent.dx=0}P.x-x0}');
 const mult=run('CANAAN_PROF.speedMult(game.hero)');
 assert.ok(Math.abs(step(0)-4.1*mult)<1e-9,'vitesse de base '+step(0));
 assert.ok(Math.abs(step(50)-4.1*1.5*mult)<1e-9,'vitesse +50 % '+step(50));
 // Mana : 300 de base pour le héros, la fiche de statistiques et une nouvelle partie.
 run('paused=false;equipment={...equipment};recomputeStats()');assert.equal(run('CANAAN_BASE_MANA+","+characterStats().maxMp+","+P.mmp'),'300,300,300');
 assert.equal(run('CANAAN_PERSISTENCE.freshSnapshot().heros.hote.player.mp'),300);
 // Régénération hors combat : 6 mana et 2 PV + 1 % des PV max par seconde, soit 60 ticks.
 run('P.dead=false;paused=false;started=true;P.mhp=1000;recomputeStats=()=>{};P.mp=0;P.hp=1;for(let i=0;i<60;i++)update()');
 assert.ok(Math.abs(run('P.mp')-6)<1e-9,String(run('P.mp')));assert.ok(Math.abs(run('P.hp')-13)<1e-9,String(run('P.hp')));
 // En combat : 3 mana et 25 % de la régénération de vie hors combat.
 assert.deepEqual(JSON.parse(run('JSON.stringify(canaanRegenRates(true))')),{mana:3,health:3});
 assert.deepEqual(JSON.parse(run('JSON.stringify(canaanRegenRates(false))')),{mana:6,health:12});
 run('CANAAN_ARTEFACTS.attackBefore({x:0,y:0,hp:10,mhp:10},1);P.mp=0;P.hp=1;for(let i=0;i<60;i++)update()');
 assert.ok(Math.abs(run('P.mp')-3)<1e-9,String(run('P.mp')));assert.ok(Math.abs(run('P.hp')-4)<1e-9,String(run('P.hp')));
 // Donjon 1 : niveau 7 requis.
 assert.equal(run('instances[0].level'),7);
 run('instanceState=null;game.hero.level=6;enterInstance(0)');assert.equal(run('instanceState'),null);
 run('game.hero.level=7;enterInstance(0)');assert.equal(run('instanceState.index'),0);
});

test('Création du héros : sexe, race, peau, coiffure, couleurs et tenue, sauvegardés et vérifiés',async()=>{
 const L=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','data','looks.js')).href);
 // Valeurs vérifiées : tout ce qui est inconnu redevient la valeur par défaut ; la peau suit la palette de la race.
 assert.deepEqual(L.sanitizeLook(null),L.defaultLook());
 assert.deepEqual(L.sanitizeLook({race:'dragon',sex:'x',hairStyle:'<b>',hair:'red',eyes:'#fff',outfit:'?'}),L.defaultLook());
 assert.equal(L.sanitizeLook({race:'orc',skin:'#f0c7a0'}).skin,L.LOOK_RACES[1].skins[0],'peau humaine refusée pour un orc');
 assert.equal(L.sanitizeLook({race:'elfe',skin:'#A8B8E0'}).skin,'#a8b8e0');
 for(let i=0;i<40;i++){const r=L.randomLook(Math.random);assert.deepEqual(L.decodeLook(L.encodeLook(r)),r)}
 assert.deepEqual(L.decodeLook('x'.repeat(500)),L.defaultLook());assert.deepEqual(L.decodeLook(42),L.defaultLook());
 assert.equal(L.encodeLook(L.defaultLook()),'m|humain|#f0c7a0|court|#7d5140|#202938|acier');
 const S=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','save','schema.js')).href);
 assert.equal(S.freshSave({nom:'x',slot:1,version:'v',now:1,spawn:{x:0,y:0},baseMana:300,look:{race:'elfe',sex:'f'}}).heros.hote.look.race,'elfe');
 // Écran de création dans le menu des aventures.
 const {g,run,nodes,errors,click}=require('./helpers/canaan-runtime.cjs')(source);
 const html=()=>nodes.get('slotMenu').innerHTML;
 run('CANAAN_SLOT_MENU.newSlot(1)');
 assert.match(html(),/class="look-creator"/);assert.match(html(),/id="lookPreview"/);
 for(const word of ['Femme','Homme','Humain','Orc','Elfe','Minotaure','Vargar','Coiffure','Cheveux','Yeux','Tenue'])assert.match(html(),new RegExp(word));
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("race",4)'),true);assert.match(html(),/Pelage/);assert.match(html(),/malédiction lunaire/);assert.equal(run('lookRace("vargar").fur'),true);assert.equal(run('sanitizeLook({race:"worgen"}).race'),'vargar','ancien nom gardé');
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("race",3)'),true);assert.match(html(),/Pelage/);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("sex",0)'),true);assert.equal(run('CANAAN_SLOT_MENU.lookSet("hairStyle",2)'),true);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("outfit",4)'),true);assert.equal(run('CANAAN_SLOT_MENU.lookSet("skin",2)'),true);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("skin",99)'),false,'index hors palette refusé');assert.equal(run('CANAAN_SLOT_MENU.lookSet("constructor",0)'),false);
 assert.match(html(),/look-choice on" data-action="lookSet" data-key="race" data-index="3"/);
 run('CANAAN_SLOT_MENU.lookTurn(1)');assert.equal(run('CANAAN_SLOT_MENU.state().face'),1);run('CANAAN_SLOT_MENU.lookTurn(-1)');run('CANAAN_SLOT_MENU.lookTurn(-1)');assert.equal(run('CANAAN_SLOT_MENU.state().face'),3);
 const chosen=run('JSON.stringify(CANAAN_SLOT_MENU.state().look)');
 g.document.getElementById('slotName').value='Terres du Minotaure';
 // Changer de choix garde le nom tapé.
 run('CANAAN_SLOT_MENU.lookTurn(1)');assert.match(html(),/value="Terres du Minotaure"/);
 g.location.reload=()=>{};
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(run('CANAAN_SLOT_MENU.create(1)'),true);
 const saved=JSON.parse(g.localStorage.getItem('canaan_slot_1'));
 assert.equal(saved.nom,'Terres du Minotaure');assert.deepEqual(saved.heros.hote.look,JSON.parse(chosen));
 assert.deepEqual(saved.heros.hote.look,{sex:'f',race:'minotaure',skin:L.LOOK_RACES[3].skins[2],hairStyle:'queue',hair:'#7d5140',eyes:'#202938',outfit:'or'});
 // Héros d'invité : apparence gardée dans les préférences, le formulaire pour rejoindre conserve ce qui est tapé.
 run('CANAAN_SLOT_MENU.render();CANAAN_SLOT_MENU.joinForm()');assert.match(html(),/lookEditJoin/);
 run("document.getElementById('joinPseudo').value='Lina'");
 run('CANAAN_SLOT_MENU.lookEditJoin()');assert.match(html(),/Mon héros d’invité/);assert.doesNotMatch(html(),/id="slotName"/);
 run('CANAAN_SLOT_MENU.lookSet("race",2);CANAAN_SLOT_MENU.lookSaveJoin()');
 assert.equal(run('decodeLook(CANAAN_NET.settings().look).race'),'elfe');assert.match(html(),/value="Lina"/);assert.match(html(),/Apparence enregistrée/);
 // Sprites : un par apparence, direction et pas ; le dessin d'une apparence invalide retombe sur celle par défaut.
 // Chaque bouton du créateur passe par la table des contrôles : un clic valide ses arguments, puis appelle le menu.
 run('globalThis.__menu=CANAAN_SLOT_MENU;globalThis.__calls=[];CANAAN_SLOT_MENU=Object.fromEntries(Object.keys(__menu).map(k=>[k,typeof __menu[k]==="function"?(...a)=>{__calls.push([k,...a])}:__menu[k]]))');
 try{
  for(const [action,data] of [['lookSet',{key:'race',index:'3'}],['lookRandom'],['lookTurn',{dir:'-1'}],['lookEditJoin'],['lookSaveJoin'],['lookBack']])click(action,data);
  assert.deepEqual(JSON.parse(run('JSON.stringify(__calls)')),[['lookSet','race',3],['lookRandom'],['lookTurn',-1],['lookEditJoin'],['lookSaveJoin'],['lookBack']]);
  assert.throws(()=>click('lookSet',{key:'race"><img',index:'1'}),/Argument d’action invalide/);
 }finally{run('CANAAN_SLOT_MENU=__menu')}
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Icônes SVG du jeu et nouveau nom : chaque émoji a son icône, l’interface et le canevas les dessinent, The Legend of Nashi',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const audit=JSON.parse(run('JSON.stringify(CANAAN_ICONS.audit())'));assert.deepEqual(audit.missing,[]);assert.ok(audit.emojis>=160);
 // Tous les émojis des sources du jeu ont leur icône (sauf les symboles typographiques gardés en texte).
 const keep=new Set([...'✦✓✔✕★☆☾♪♫➤🜁']);const missing=new Set();
 const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(js|html|css)$/.test(f.name)&&f.name!=='icons.js')for(const m of fs.readFileSync(p,'utf8').matchAll(/[\u{1F300}-\u{1FAFF}☀-➿⏩-⏺⭐❤❗❓⬇]/gu)){if(!keep.has(m[0])&&!run('CANAAN_ICONS.nameOf('+JSON.stringify(m[0])+')'))missing.add(m[0])}}};
 walk(path.join(__dirname,'..','src','canaan'));assert.deepEqual([...missing],[],'émojis sans icône');
 // Interface : un texte avec émoji devient du HTML avec une icône SVG ; une info-bulle native perd l'émoji.
 assert.match(run('CANAAN_ICONS.html("🎒 Inventaire")'),/^<svg class="ico" viewBox="0 0 24 24"[^>]*>.*<\/svg> Inventaire$/);
 assert.equal(run('CANAAN_ICONS.strip("⚙️ Paramètres du jeu")'),'Paramètres du jeu');
 assert.equal(run('CANAAN_ICONS.html("Sans émoji")'),'Sans émoji');
 // Nouveau nom du jeu (le dossier et le fichier autonome gardent le leur).
 assert.match(source,/<h1>THE LEGEND OF NASHI<\/h1>/);assert.doesNotMatch(source,/Canaan Online|CANAAN ONLINE/);
 const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));assert.equal(pkg.productName,'The Legend of Nashi');
 const main=fs.readFileSync(path.join(__dirname,'..','app','main.js'),'utf8');
 assert.match(main,/title: 'The Legend of Nashi'/);assert.match(main,/function adoptOldData\(\)[\s\S]*'Canaan Online'[\s\S]*cpSync/,'les anciennes sauvegardes sont reprises');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Icônes illustrées, taille des textes et cases carrées : chaque objet a sa vraie icône, polices plus grandes et réglables',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Chaque repère ⟦nom⟧ des sources mène à une illustration.
 const art=new Set(JSON.parse(run('JSON.stringify(Object.keys(CANAAN_ICON_ART))')));const miss=new Set();
 const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(js|html)$/.test(f.name)&&f.name!=='icon-art.js')for(const m of fs.readFileSync(p,'utf8').matchAll(/⟦([a-z0-9_]+)⟧/g))if(!art.has(m[1]))miss.add(m[1])}};
 walk(path.join(__dirname,'..','src','canaan'));assert.deepEqual([...miss],[]);
 // Les objets ont leur propre icône : un artéfact, un emplacement, une statistique, une classe, un poisson, une difficulté.
 assert.equal(run('ARTEFACTS.every(a=>a.icon==="⟦artefact_"+a.id+"⟧")'),true,'chaque artéfact a son illustration');
 assert.equal(run('Object.entries(itemIcon).every(([k,v])=>v==="⟦slot_"+itemSlotOf(k)+"⟧"||k==="weapon2")'),true,'emplacements d’équipement');
 assert.equal(run('Object.entries(WEAPON_DEFINITIONS).every(([k,w])=>w.icon==="⟦w_"+k+"⟧")'),true,'familles d’armes');
 assert.equal(run('CLASSES.every(c=>c.icon==="⟦cls_"+c.id+"⟧")'),true);
 assert.match(run('CANAAN_ICONS.html("⟦artefact_couronne_souverain⟧ Couronne")'),/^<svg class="ico art" viewBox="0 0 32 32"/);
 assert.equal(run('CANAAN_ICONS.html("⟦inconnu⟧X")'),'X','un repère inconnu ne s’affiche pas');
 assert.equal(run('CANAAN_ICONS.strip("⟦slot_helm⟧ Tête")'),'Tête');
 // Taille des textes : seules les polices grandissent (125 % par défaut, de 100 % à 160 %), l'interface n'est pas zoomée.
 const css=fs.readdirSync(path.join(__dirname,'..','src','canaan','styles')).map(f=>fs.readFileSync(path.join(__dirname,'..','src','canaan','styles',f),'utf8')).join('\n');
 assert.doesNotMatch(css,/\bzoom:/,'pas de zoom de l’interface');
 assert.match(css,/--font-scale: 1\.25;/);
 assert.deepEqual([...css.matchAll(/font-size:\s*([^;]+);/g)].map(m=>m[1]).filter(v=>/px/.test(v)&&!/--font-scale/.test(v)),[],'chaque police en pixels suit le réglage');
 run('started=true;openSettings()');assert.equal(run('canaanTextScale()'),1.25);
 run('settingsStep("textscale",1)');assert.equal(run('canaanTextScale()'),1.4);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).textScale'),1.4);
 for(let i=0;i<6;i++)run('settingsStep("textscale",-1)');assert.equal(run('canaanTextScale()'),1);
 // Sac et personnage : objets en cases carrées, nom dans l'info-bulle.
 run('renderInventory()');assert.match(run('document.getElementById("window").innerHTML'),/class="bag-cell[^"]*"[^>]*data-menu="gear"/);
 assert.doesNotMatch(run('document.getElementById("window").innerHTML'),/class="bag-sale"/,'la vente se fait chez le marchand');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Paramètres en onglets ; touches du clavier réglables, échangées en cas de conflit, gardées, suivies par le jeu et la manette',()=>{
 const {g,run,fire,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const html=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 // Six onglets, chacun avec son panneau ; seul Audio est visible au départ.
 for(const tab of ['audio','display','graphics','interface','keyboard','gamepad']){
  assert.match(html,new RegExp('data-action="settingsTab" data-tab="'+tab+'"'),tab);
  assert.match(html,new RegExp('data-pane="'+tab+'" id="settingsPane-'+tab+'" role="tabpanel"'+(tab==='audio'?'>':' hidden>')),tab);
 }
 assert.ok(html.includes('id="setKeybinds"')&&html.includes('data-action="keybindReset"'));
 run('openSettings();settingsTab("keyboard")');assert.equal(run('CANAAN_SETTINGS.tab()'),'keyboard');
 run('settingsTabStep(1)');assert.equal(run('CANAAN_SETTINGS.tab()'),'gamepad');
 run('settingsTabStep(1)');assert.equal(run('CANAAN_SETTINGS.tab()'),'audio');
 run('settingsTab("inconnu")');assert.equal(run('CANAAN_SETTINGS.tab()'),'audio');
 run('settingsTab("keyboard")');
 assert.match(g.document.getElementById('setKeybinds').innerHTML,/data-action="keybindCapture" data-bind="interact" data-slot="0">E</);
 run('closeSettings()');
 // Défauts : ceux d'avant les réglages.
 assert.equal(run('CANAAN_KEYS.actionOf("e")'),'interact');assert.equal(run('CANAAN_KEYS.actionOf("Z")'),'moveUp');
 assert.equal(run('CANAAN_KEYS.actionOf(" ")'),'dodge');assert.equal(run('CANAAN_KEYS.actionOf("r")'),null);
 // Plus de touche Maison : H est libre, ou prise par la monture de l'Extension 1 dans un build de test.
 assert.equal(run('CANAAN_KEYS.actionOf("h")'),run('canaanExtension("vallee")?"mount":null'),'plus de touche Maison');
 // Attendre une touche, puis la prendre : R devient Interagir ; E se libère.
 run('keybindCapture("interact",0)');assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_KEYS.listening())')),{id:'interact',slot:0});
 fire(g,'keydown',{key:'R',stopImmediatePropagation(){}});
 assert.equal(run('CANAAN_KEYS.listening()'),null);
 assert.equal(run('CANAAN_KEYS.actionOf("r")'),'interact');assert.equal(run('CANAAN_KEYS.actionOf("e")'),null);
 // Conflit : I (Inventaire) donné à Interagir, l'Inventaire reçoit l'ancienne touche (R).
 run('CANAAN_KEYS.bind("interact",0,"i")');
 assert.equal(run('CANAAN_KEYS.actionOf("i")'),'interact');assert.equal(run('CANAAN_KEYS.actionOf("r")'),'inventory');
 // Touches réservées refusées ; Échap annule l'attente ; Retour arrière vide la case.
 assert.equal(run('CANAAN_KEYS.bind("map",0,"escape")'),false);assert.equal(run('CANAAN_KEYS.bind("map",0,"ArrowUp")'),false);
 run('keybindCapture("map",0)');fire(g,'keydown',{key:'Escape',stopImmediatePropagation(){}});assert.equal(run('CANAAN_KEYS.primary("map")'),'m');
 run('keybindCapture("chat",0)');fire(g,'keydown',{key:'Backspace',stopImmediatePropagation(){}});assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_KEYS.keysOf("chat"))')),[]);
 // Gardé dans les préférences de l'appareil.
 assert.equal(run('JSON.stringify(CANAAN_PREFERENCES.read("keybinds",{}).interact)'),'["i",""]');
 // Le jeu suit la nouvelle touche : déplacement (Avancer sur O) et inventaire (R).
 run('CANAAN_KEYS.bind("moveUp",0,"o")');
 run('started=true;paused=false;P.dead=false;closePanels();for(const k in keys)keys[k]=false');
 fire(g,'keydown',{key:'o'});run('readInput()');assert.equal(run('game.hero.intent.dy'),-1);
 fire(g,'keyup',{key:'o'});run('readInput()');assert.equal(run('game.hero.intent.dy'),0);
 fire(g,'keydown',{key:'ArrowUp'});run('readInput()');assert.equal(run('game.hero.intent.dy'),-1,'les flèches restent');
 fire(g,'keyup',{key:'ArrowUp'});
 fire(g,'keydown',{key:'r'});assert.equal(run('modalOpen()'),true,'R ouvre l’inventaire');run('closePanels()');
 // La manette envoie l'action : Interagir reste sur A même sans touche.
 const seen=[];g.__seen=seen;run('{const real=interact;interact=()=>__seen.push("interact");globalThis.__realInteract=real}');
 fire(g,'keydown',{key:'Unidentified',canaanAction:'interact'});run('interact=__realInteract');
 assert.deepEqual(seen,['interact']);
 // Textes du jeu (« [E] » des elfes et des bâtiments, « touche T ») : la touche choisie au clavier.
 assert.equal(run('CANAAN_KEYS.customized()'),true);
 assert.equal(run('CANAAN_GAMEPAD.keyText("[E] Parler à Ylvarë")'),'[I] Parler à Ylvarë');
 assert.equal(run('CANAAN_GAMEPAD.keyText("Choisis ta classe (touche T)")'),'Choisis ta classe (touche T)');
 run('CANAAN_KEYS.bind("talents",0,"k")');
 assert.equal(run('CANAAN_GAMEPAD.keyText("Choisis ta classe (touche T)")'),'Choisis ta classe (touche K)');
 // Étiquettes de l'interface : touche choisie, puis tout revient par défaut.
 run('keybindReset()');
 assert.equal(run('CANAAN_KEYS.customized()'),false);
 assert.equal(run('CANAAN_GAMEPAD.keyText("[E] Entrer")'),'[E] Entrer');
 assert.equal(run('CANAAN_KEYS.primary("interact")'),'e');assert.equal(run('CANAAN_KEYS.labelOf("dodge")'),'Espace');
 assert.equal(run('CANAAN_KEYS.actionOf("w")'),'moveUp');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Caméra : sur l’île, elle reste dans la carte près des bords ; dans un intérieur, centrée sur la pièce',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('startGame();W=1920;H=1080');
 // Coin sud-ouest : aucun vide au-delà de la grille, ni à gauche ni en bas.
 run('P.x=3*TS;P.y=(MAPH-2)*TS;camX=-5000;camY=0;for(let i=0;i<120;i++)updateView()');
 assert.equal(run('Math.round(camX)'),0);assert.equal(run('Math.round(camY)'),run('MAPH*TS-H'));
 // Coin nord-est.
 run('P.x=(MAPW-1)*TS;P.y=TS;for(let i=0;i<120;i++)updateView()');
 assert.equal(run('Math.round(camX)'),run('MAPW*TS-W'));assert.equal(run('Math.round(camY)'),0);
 // Au large des bords, la caméra suit le héros au centre de l'écran.
 run('P.x=200*TS;P.y=200*TS;for(let i=0;i<120;i++)updateView()');
 assert.equal(run('Math.round(camX)'),run('200*TS-W/2'));
 // La maison du joueur est rangée dans le coin nord-ouest : la caméra reste centrée sur la pièce.
 run('{const r=CANAAN_ROOMS[0];P.x=(r.x+r.w/2)*TS;P.y=(r.y+r.h/2)*TS;for(let i=0;i<120;i++)updateView();globalThis.room=r}');
 assert.equal(run('Math.round(camX)'),run('Math.round((room.x+room.w/2)*TS-W/2)'));assert.ok(run('camX')<0);
 // Vue plus grande que la carte : centrée.
 assert.equal(run('canaanClampCam(-10,500,300)===-100&&canaanClampCam(-10,100,300)===0&&canaanClampCam(999,100,300)===200'),true);
});

test('Curseur du jeu partout : chaque forme est un gantelet, aucune forme du curseur du système dans les styles',()=>{
 const dir=path.join(__dirname,'..','src','canaan'),files=[];
 (function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.css'))files.push(p)}})(dir);
 for(const f of files){
  const css=fs.readFileSync(f,'utf8');
  // Seules les variables du gantelet (leur dernier recours compris) donnent un curseur ; « none » cache le curseur à la manette.
  for(const [,value] of css.matchAll(/(?<![-\w])cursor:\s*([^;]+);/g))assert.match(value.trim(),/^(var\(--cursor-[a-z-]+\)|none)$/,path.relative(dir,f)+' : cursor: '+value);
 }
 const overlay=fs.readFileSync(path.join(dir,'styles','ui-overlay.css'),'utf8');
 for(const name of ['default','pointer','blocked','text','grab','grabbing','help'])assert.match(overlay,new RegExp('--cursor-'+name+':\\s*\\n\\s*url\\("data:image/svg\\+xml,'),name);
});

test('Fenêtres à taille fixe, comme dans les MMO : petit sac et petite fiche, grandes collections ; une seule zone défile',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const size=()=>run('document.getElementById("window").dataset.size||""');
 const scrolls=()=>(run('document.getElementById("window").innerHTML').match(/class="[^"]*\bpanel-scroll\b/g)||[]).length;
 run('closePanels();renderInventory()');assert.equal(size(),'bag');assert.equal(scrolls(),1,'le sac : sa grille défile, pas son en-tête ni son pied');
 assert.match(run('document.getElementById("window").innerHTML'),/class="bag-foot"[^]*class="bag-gold"/);
 run('canaanCharacterSection("gear")');assert.equal(size(),'char');assert.equal(scrolls(),1);
 run('canaanCollections("bestiary")');assert.equal(size(),'lg');assert.equal(scrolls(),1);
 run('canaanCharacterSection("titles")');assert.equal(size(),'char');
 // Les autres fenêtres (dialogues, boutiques, portails) gardent la taille de leur contenu ; fermer efface la taille.
 run('showPanel("<p>Dialogue</p>")');assert.equal(size(),'');
 run('canaanCollections("wardrobe");closePanels()');assert.equal(size(),'');
 const css=fs.readFileSync(path.join(__dirname,'..','src','canaan','styles','panel-sizes.css'),'utf8');
 for(const s of ['bag','char','md','lg'])assert.match(css,new RegExp("data-size='"+s+"'\\]\\s*\\{\\s*--panel-w"),s);
});

test('Fenêtres façon MMO : le héros joue fenêtre ouverte, le sac s’ouvre au-dessus de I, se déplace et se ferme loin du marchand',()=>{
 const {g,run,fire,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;closePanels();for(const k in keys)keys[k]=false');
 // Le bouton I de la barre des menus, en bas à droite d'un écran de 1280 × 720.
 run('{const q=document.querySelector.bind(document),i={getBoundingClientRect:()=>({left:1200,right:1250,top:650,bottom:690,width:50,height:40})};document.querySelector=s=>s===\'#menuButtons button[data-action="toggleInventory"]\'?i:q(s)}');
 fire(g,'keydown',{key:'i'});assert.equal(run('modalOpen()'),true,'I ouvre le sac');
 assert.equal(run('CANAAN_DOCK.owner()'),'toggleInventory');
 // Fenêtre de 200 × 100 : bord droit aligné sur le bouton, 10 px au-dessus.
 assert.equal(run('document.getElementById("window").style.left'),'1050px');
 assert.equal(run('document.getElementById("window").style.top'),'540px');
 // Sac ouvert : on avance toujours, et le sac redessiné (butin) garde sa place.
 fire(g,'keydown',{key:'ArrowUp'});run('readInput()');assert.equal(run('game.hero.intent.dy'),-1,'le héros avance sac ouvert');
 fire(g,'keyup',{key:'ArrowUp'});
 run('refreshGearPanel()');assert.equal(run('CANAAN_DOCK.owner()'),'toggleInventory');
 // Une saisie dans un champ de la fenêtre garde ses touches.
 fire(g,'keydown',{key:'ArrowUp',target:{closest:s=>/input/.test(s)?{}:null}});run('readInput()');assert.equal(run('game.hero.intent.dy'),0);
 fire(g,'keyup',{key:'ArrowUp'});
 // La même touche ferme le sac.
 fire(g,'keydown',{key:'i'});assert.equal(run('modalOpen()'),false,'I referme le sac');
 // Place retenue après un déplacement : elle prime sur le bouton.
 run('CANAAN_PREFERENCES.write("layout",{windows:{toggleInventory:{x:300,y:200}}})');
 fire(g,'keydown',{key:'i'});assert.equal(run('document.getElementById("window").style.left'),'300px');
 // Redimensionner par le coin en bas à gauche : le bord droit reste en place ; taille et place retenues.
 run('{const w=document.getElementById("window");w.__props={};w.style.setProperty=(k,v)=>w.__props[k]=v;w.style.removeProperty=k=>delete w.__props[k];w.getBoundingClientRect=()=>({left:300,top:200,width:470,height:500,right:770,bottom:700})}');
 const win=run('document.getElementById("window")'),grip={closest:s=>s==='.dock-grip'?{dataset:{edge:'bl'}}:null};
 fire(win,'pointerdown',{button:0,target:grip,clientX:300,clientY:700,pointerId:7});
 fire(win,'pointermove',{target:grip,clientX:200,clientY:760,pointerId:7});
 assert.equal(run('document.getElementById("window").__props["--panel-w"]'),'570px');
 assert.equal(run('document.getElementById("window").__props["--panel-h"]'),'560px');
 assert.equal(run('document.getElementById("window").style.left'),'200px','le bord droit ne bouge pas');
 fire(win,'pointerup',{pointerId:7});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PREFERENCES.read("layout",{}).windows.toggleInventory)')),{x:200,y:200,w:570,h:560});
 // Jamais plus petite que sa taille minimale.
 fire(win,'pointerdown',{button:0,target:grip,clientX:300,clientY:700,pointerId:8});fire(win,'pointermove',{target:grip,clientX:900,clientY:100,pointerId:8});fire(win,'pointerup',{pointerId:8});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PREFERENCES.read("layout",{}).windows.toggleInventory)')).w,340);
 // Double-clic sur la poignée : taille d'origine, la place reste.
 fire(win,'dblclick',{target:grip});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PREFERENCES.read("layout",{}).windows.toggleInventory)')),{x:430,y:200});
 run('closePanels()');
 // Fenêtre ouverte depuis le dialogue d'un PNJ (marchand) : centrée, et fermée quand le héros s'éloigne.
 run('P.x=1000;P.y=1000');fire(run('document.getElementById("dialog")'),'click');
 run('showPanel(\'<div class="shop-panel"></div>\')');assert.equal(run('CANAAN_DOCK.owner()'),'free:shop-panel');
 run('P.x=1100;CANAAN_DOCK.tick()');assert.equal(run('modalOpen()'),true,'encore à portée');
 run('P.x=1400;CANAAN_DOCK.tick()');assert.equal(run('modalOpen()'),false,'trop loin : fermée');
 // Fenêtre ouverte sans quitter le jeu (sac par sa touche) : jamais liée au lieu.
 fire(g,'keydown',{key:'i'});run('P.x=5000;CANAAN_DOCK.tick()');assert.equal(run('modalOpen()'),true);run('closePanels()');
});
