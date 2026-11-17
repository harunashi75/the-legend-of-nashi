const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Rubis : 48 effets en six familles, six emplacements, collection, verrous et fiche du personnage',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const list=JSON.parse(run('JSON.stringify(CANAAN_RUBIS.list)'));
 assert.equal(list.length,48);assert.equal(new Set(list.map(r=>r.id)).size,48);
 for(let f=0;f<6;f++)assert.equal(list.filter(r=>r.family===f).length,8,'famille '+f);
 assert.deepEqual([list[0].name,list[15].name,list[23].name,list[31].name,list[39].name,list[47].name],['Berserker','Second souffle','Communion','Résonance','Élan','Transcendance']);
 run('started=true;paused=false;P.dead=false;time=10000');
 // Un Rubis non possédé ne s'équipe pas ; doublons interdits ; six emplacements au plus.
 assert.equal(run("equipRubis('berserker')"),false);
 run("for(const r of CANAAN_RUBIS.list)CANAAN_RUBIS.grant(r.id)");
 assert.equal(run('CANAAN_RUBIS.discovered()'),48);
 for(const id of ['berserker','colosse','meditation','tempete','voyageur','phenix'])assert.equal(run("equipRubis('"+id+"')"),true,id);
 assert.equal(run("equipRubis('berserker')"),false);assert.equal(run("equipRubis('pacte')"),false);
 assert.equal(run("unequipRubis(0)"),true);assert.equal(run("equipRubis('pacte')"),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_RUBIS.equipped())')),['pacte','colosse','meditation','tempete','voyageur','phenix']);
 // Hors combat seulement, et jamais pendant une tentative de l'Arène.
 run("CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:0,y:0},10)");
 assert.equal(run("unequipRubis(1)"),false);
 run('time+=600');assert.equal(run("unequipRubis(1)"),true);
 run("instanceState={index:'arena',arena:true}");assert.equal(run("equipRubis('colosse')"),false);run('instanceState=null');
 // Gain : priorité aux Rubis manquants, un doublon reste dans la collection.
 run("CANAAN_RUBIS_STATE.import({owned:{berserker:1},equipped:['berserker','inconnu','berserker',null,null,null]})");
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_RUBIS.equipped())')),['berserker',null,null,null,null,null]);
 const fresh=JSON.parse(run('JSON.stringify(Array.from({length:47},()=>CANAAN_RUBIS.grant()).map(x=>x.fresh))'));
 assert.ok(fresh.every(Boolean));assert.equal(run('CANAAN_RUBIS.discovered()'),48);
 assert.equal(run('CANAAN_RUBIS.grant().fresh'),false);
 // Fiche du personnage : six emplacements sous le personnage, puis la collection des 48.
 run('renderCharacter()');const html=g.document.getElementById('window').innerHTML;
 assert.match(html,/class="character-left"[\s\S]*rubis-paper/);
 assert.equal((html.match(/class="rubis-slot /g)||[]).length,6);
 // Les Rubis possédés sont des objets du sac (piles), plus une grille de collection sur la fiche.
 assert.equal((html.match(/class="rubis-cell /g)||[]).length,0);
 assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="rubis").length'),run('48-game.hero.rubis.equipped.filter(Boolean).length'));
 run('renderInventory()');assert.ok((g.document.getElementById('window').innerHTML.match(/data-tooltip-stack="rubis:/g)||[]).length>=40,'les Rubis dans le sac');
 run("showRubisTooltip('tempete',{clientX:0,clientY:0})");
 assert.match(g.gearTooltip?.innerHTML||run('gearTooltip.innerHTML'),/Tempête[\s\S]*15 %/);
 // Sauvegarde : Rubis et records de l'Arène dans l'instantané.
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot())'));
 assert.equal(snap.schema,10);assert.equal(Object.keys(snap.heros.hote.rubis.owned).length,48);assert.ok('best' in snap.heros.hote.arena);
});

test('Rubis : effets en combat, survie aux coups fatals, soins, mana et utilitaires',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=10000;for(const r of CANAAN_RUBIS.list)CANAAN_RUBIS.grant(r.id)');
 const wear=ids=>run("CANAAN_RUBIS_STATE.import({owned:Object.fromEntries(CANAAN_RUBIS.list.map(r=>[r.id,1])),equipped:"+JSON.stringify([...ids,...Array(6-ids.length).fill(null)])+"});recomputeStats()");
 wear([]);const hp0=run('characterStats().maxHp'),speed0=run('characterStats().speed');
 wear(['colosse']);assert.equal(run('characterStats().maxHp'),Math.round(hp0*1.1));assert.equal(run('characterStats().speed'),speed0-5);
 wear(['pacte']);assert.equal(run('characterStats().maxHp'),Math.round(hp0*0.88));
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999},100)')-118)<1e-9);
 wear(['berserker','chasseur','dernier_souffle']);run('P.hp=P.mhp');
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999,elite:true},100)')-112)<1e-9);
 run('P.hp=P.mhp*0.2');assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:1,mhp:9,x:9999,y:9999},100)')-115*1.15)<1e-9);
 wear(['briseur','precision','tresorier','volonte','arcane','endurance']);
 assert.deepEqual(JSON.parse(run('JSON.stringify([CANAAN_RUBIS.armorFactor(),CANAAN_RUBIS.critFactor(),CANAAN_RUBIS.goldFactor(),CANAAN_RUBIS.incomingCritFactor(),CANAAN_RUBIS.manaCost(100),CANAAN_RUBIS.dodgeCooldownFactor()])')),[0.92,1.12,1.15,0.8,90,0.85]);
 // Prospecteur : 15 % de chances d'un meilleur objet sur un mob ordinaire.
 wear(['prospecteur']);assert.equal(run('Math.random=()=>0.14;CANAAN_RUBIS.betterDrop()'),true);assert.equal(run('Math.random=()=>0.16;CANAAN_RUBIS.betterDrop()'),false);
 wear([]);assert.equal(run('Math.random=()=>0;CANAAN_RUBIS.betterDrop()'),false);
 // Défense : Peau de pierre seulement contre les coups physiques ; Gardien après un coup, puis recharge.
 wear(['peau_de_pierre']);assert.equal(run('CANAAN_RUBIS.defense({},100,{})'),94);assert.equal(run('CANAAN_RUBIS.defense({},100,{magic:true})'),100);
 wear(['gardien']);assert.equal(run('CANAAN_RUBIS.defense({},100)'),100);assert.equal(run('CANAAN_RUBIS.defense({},100)'),90);
 // Second souffle puis Phénix : une fois chacun par combat, puis la mort.
 wear(['second_souffle','phenix']);run('P.hp=50');
 assert.equal(run('canaanHurtPlayer(9999,null)'),0);assert.equal(run('P.hp'),Math.max(1,Math.round(run('P.mhp')*0.1)));
 assert.equal(run('canaanHurtPlayer(9999,null)'),0);assert.equal(run('P.hp'),Math.max(1,Math.round(run('P.mhp')*0.2)));
 assert.ok(run('canaanHurtPlayer(9999,null)')>0);assert.ok(run('P.hp')<=0);
 // Soins : Guérisseur pour les soins directs, Source vitale pour tous ; Bénédiction après un soin.
 wear(['guerisseur','source_vitale','benediction']);run('P.dead=false;P.mhp=10000;P.hp=1');
 assert.ok(Math.abs(run('canaanApplyHeal(100,true)')-110)<1e-9);run('P.hp=1');
 const direct=run('canaanApplyHeal(100)');assert.ok(direct>=Math.round(100*1.08*1.1)-1,String(direct));
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999},100)')-105)<1e-9);
 // Méditation et Symbiose : 3 % du mana toutes les 5 s, et des PV en retour.
 wear(['meditation','symbiose']);run('time+=600;P.mp=0;P.hp=1');const hpBefore=run('P.hp');
 for(let i=0;i<300;i++)run('time++;CanaanStages.rubis.after(new Map())');
 assert.ok(Math.abs(run('P.mp')-run('P.mmp')*0.03-300/60*0)<=run('P.mmp')*0.03+1e-9&&run('P.mp')>=run('P.mmp')*0.03-1e-9);
 assert.ok(run('P.hp')>hpBefore);
 // Explorateur : coffres secrets proches révélés sur la mini-carte.
 wear(['explorateur']);run('instanceState=null;openedChests=[];P.x=(hiddenChestSpots[0].x+2)*TS;P.y=hiddenChestSpots[0].y*TS');
 assert.ok(run('CANAAN_RUBIS.revealedChests().some(c=>c.id==="hidden_0")'));
});

test('Arène des Épreuves : portail près du camp, douze boss, vagues, récompenses, records et sortie',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Portail accessible à pied depuis le camp, à l'est, hors de la zone sûre.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 assert.equal(run("npcs.filter(n=>n.type==='arena').length"),1);
 assert.ok(run('Math.hypot(CANAAN_ARENA_PORTAL.x-CANAAN_CAMP.x,CANAAN_ARENA_PORTAL.y-CANAAN_CAMP.y)')<20);
 assert.equal(run('isSafe(CANAAN_ARENA_PORTAL.x,CANAAN_ARENA_PORTAL.y)'),false);
 // Douze boss du document, multiplicateurs proposés, tous les mouvements existent.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.bosses)')),['Gorath, le Gardien de Fer','Fenrath, Croc des Ombres','Tharok, le Colosse de Pierre','Morgana, la Sorcière des Brumes','Valdris, le Chevalier Déchu','Hydrass, l’Hydre Écarlate','Zephiron, Seigneur des Tempêtes','Kael’Thor, l’Exécuteur Astral','Ametheon, le Titan de Cristal','Ignaroth, le Dragon des Cendres','Nihil, l’Avatar du Néant','Aurelion, le Souverain des Épreuves']);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.hpMult)')),[1,1.2,1.4,1.6,1.9,2.2,2.5,2.9,3.3,3.8,4.3,5]);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.dmgMult)')),[1,1.1,1.2,1.3,1.4,1.6,1.7,1.8,2,2.1,2.3,2.5]);
 const audit=JSON.parse(run('JSON.stringify(CANAAN_ARENA.audit())'));
 assert.equal(audit.waves,12);assert.deepEqual(audit.missingMoves,[]);assert.equal(audit.ordered,true);assert.equal(audit.phases[11],3);
 // Aucun iLvl minimum : on entre avec iLvl 0, dans le colisée.
 run('started=true;paused=false;P.dead=false;time=1000;game.hero.level=1;recomputeStats();P.hp=P.mhp=1e6;openArenaPortal()');
 assert.match(g.document.getElementById('window').innerHTML,/Meilleure vague[\s\S]*Rubis découverts[\s\S]*Tentatives effectuées[\s\S]*Arène terminée[\s\S]*Dernier boss vaincu/);
 assert.equal(run('enterArena()'),true);assert.equal(run('instanceState.arena'),true);assert.equal(run('CANAAN_ARENA.state().attempts'),1);
 assert.equal(run('canWalk(P.x,P.y)'),true);assert.equal(run("CANAAN_ARENA.run().phase"),'enter');
 const tick=n=>{for(let i=0;i<n;i++)run('time++;runUpdatePipeline();P.hp=P.mhp')};
 tick(120);assert.equal(run("CANAAN_ARENA.run().phase"),'enter');
 // Sur la piste : compte à rebours de 5 s, puis le boss ; la herse se ferme.
 run('{const L=arenaLayout();P.x=L.x;P.y=L.y+L.r*0.3}');tick(2);assert.equal(run("CANAAN_ARENA.run().phase"),'countdown');
 tick(4*60);assert.equal(run("CANAAN_ARENA.run().phase"),'countdown');tick(70);
 assert.equal(run("CANAAN_ARENA.run().phase"),'fight');
 const gate=()=>run('arenaLayout().gate.map(([x,y])=>world[y][x]).join()');
 assert.equal(gate(),'19,19,19,19,19');
 // PV fixes, indépendants de l'iLvl du héros.
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),15000);run('game.hero.level=60;scaleBossHp(CANAAN_ARENA.run().boss)');assert.equal(run('CANAAN_ARENA.run().boss.mhp'),15000);
 // Pas d'abandon pendant le combat.
 run('{const e=instanceEntrance;globalThis.saved={x:P.x,y:P.y};P.x=e.x;P.y=e.y;CANAAN_ARENA.interact();P.x=saved.x;P.y=saved.y}');assert.equal(run('!!instanceState'),true);
 // Chaque mouvement se joue sans erreur sur le boss de la vague.
 for(const name of ['slam','charge','shockwave','pounce','backstab','quake','rocks','rain','poison','volley','curse','mist','combo','parry','breath3','spit','breathRoll','lightning','fields','gust','sweep','cones','mark','execute','crystal','beams','shards','breath','meteors','firestorm','blink','spiral','clones','voidzone']){
  assert.equal(run("CANAAN_ARENA.playMove('"+name+"')"),true,name);tick(150);
 }
 assert.equal(errors.length,0,errors.join('\n'));
 // Victoire : 1 Rubis, +20 % PV et mana sans dépasser le maximum, herse ouverte, répit de 10 s.
 run('P.mhp=1000;P.hp=350;P.mmp=300;P.mp=100;{const b=CANAAN_ARENA.run().boss;b.shieldHp=0;b.parryUntil=0;b.immuneUntil=0;hit(b,1e9)}');
 assert.equal(run("CANAAN_ARENA.run().phase"),'rest');assert.equal(run('P.hp'),550);assert.equal(run('Math.round(P.mp)'),160);
 assert.equal(run('CANAAN_RUBIS.discovered()'),1);assert.equal(run('CANAAN_ARENA.state().best'),1);
 assert.equal(run('CANAAN_ARENA.run().fx.length+CANAAN_ARENA.run().shots.length+CANAAN_ARENA.run().hazards.length'),0);
 assert.equal(run('monsters.some(m=>m.arenaClone)'),false);assert.equal(gate(),'20,20,20,20,20');
 // Équipement verrouillé pendant la tentative.
 run("inventory.push({id:'a1',slot:'ring',ilvl:5,rarity:'Commun'})");assert.equal(run("equipItem('a1')"),false);
 // Abandon entre les vagues : retour au monde, le Rubis reste acquis.
 run('{const e=instanceEntrance;P.x=e.x;P.y=e.y;CANAAN_ARENA.interact()}');
 assert.equal(run('instanceState'),null);assert.equal(run('world'),run('overworld'));assert.equal(run('CANAAN_RUBIS.discovered()'),1);
 // Vague 12 : la victoire donne la récompense finale, un Rubis au choix parmi les manquants.
 run('enterArena();{const r=CANAAN_ARENA.run(),L=arenaLayout();P.x=L.x;P.y=L.y+L.r*0.3;r.wave=12;r.phase="countdown";r.timer=0}');tick(2);
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),75000);assert.equal(run('CANAAN_ARENA.run().boss.def.phases.length'),3);
 assert.equal(run('CANAAN_ARENA.tempo(1)'),1);assert.ok(Math.abs(run('CANAAN_ARENA.tempo(12)')-0.758)<1e-9);
 run('{const b=CANAAN_ARENA.run().boss;b.shieldHp=0;b.parryUntil=0;b.immuneUntil=0;hit(b,1e9)}');
 assert.equal(run('CANAAN_ARENA.state().completed'),true);assert.equal(run('CANAAN_ARENA.state().pendingChoice'),true);
 const missing=run('CANAAN_RUBIS.missing()[0].id');
 assert.equal(run("claimArenaRubis('"+missing+"')"),true);assert.equal(run("claimArenaRubis('"+missing+"')"),false);
 assert.equal(run('CANAAN_RUBIS.discovered()'),3);
 // Une partie rechargée hors du colisée ne laisse ni combat ni malédiction en mémoire.
 run('{const r=CANAAN_ARENA.run();r.phase="fight";r.curseUntil=r.clock+60}instanceState=null');
 assert.equal(run('CANAAN_ARENA.fighting()'),false);assert.equal(run('CANAAN_ARENA.healFactor()'),1);
 run('world=overworld;time++;runUpdatePipeline()');assert.equal(run('CANAAN_ARENA.run()'),null);
});

test('Arène à plusieurs : boss selon le groupe, zones sur chaque héros, relever un allié, un Rubis pour chacun, échec si tous tombent',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;globalThis.__toasts=[];toast=m=>__toasts.push(m);game.view.chat=()=>{};canaanRegenRates=()=>({mana:0,health:0});Math.random=()=>0.99');
 const gear=(w,tag)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"'+tag+k+'",slot:"'+k+'",level:48,rarity:"Mythique",weaponType:"'+w+'"}').join(',')+'}';
 run('game.hero.level=48;game.hero.equipment={...game.hero.equipment,...'+gear('sword','h')+'};recomputeStats();P.hp=P.mhp');
 for(const [n,w] of [['Lina','spear'],['Oren','bow']])run('{const h=canaanCreateHero({name:"'+n+'",x:P.x,y:P.y,equipment:'+gear(w,n)+'});h.level=48;game.heroes.push(h)}');
 run('globalThis.lina=game.heroes[1];globalThis.oren=game.heroes[2];for(const h of game.heroes){h.player.mhp=h.player.hp=1e6}');
 assert.equal(run('enterArena()'),true);
 // Tout le groupe entre ; chaque héros compte sa tentative.
 assert.equal(run('game.heroes.every(h=>Math.hypot(h.player.x-arenaLayout().entry.x,h.player.y-arenaLayout().entry.y)<4*TS)'),true,'groupe placé à l’entrée');
 assert.equal(run('lina.arena.attempts+oren.arena.attempts+game.hero.arena.attempts'),3);
 // Le groupe avance au centre : le boss arrive avec PV et dégâts pour trois héros.
 run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
 for(let i=0;i<10;i++)run('time++;simulateStep()');
 run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
 assert.equal(run('CANAAN_ARENA.run().group'),3);
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),Math.round(run('CANAAN_ARENA.base.hp*CANAAN_ARENA.hpMult[0]*CANAAN_ARENA.group[3].hp')));
 assert.ok(Math.abs(run('CANAAN_ARENA.run().dmgMult')-run('CANAAN_ARENA.dmgMult[0]*1.05'))<1e-9);
 // Frappe de zone autour du boss : chaque héros dans le cercle est touché.
 run('{const b=CANAAN_ARENA.run().boss;game.heroes.forEach((h,k)=>{h.player.x=b.x+(k-1)*40;h.player.y=b.y+50});globalThis.hp0=game.heroes.map(h=>h.player.hp)}');
 run('CANAAN_ARENA.playMove("slam")');for(let i=0;i<80;i++)run('time++;simulateStep()');
 assert.equal(run('game.heroes.every((h,k)=>h.player.hp<hp0[k])'),true,'les trois héros sont touchés : '+run('JSON.stringify(game.heroes.map((h,k)=>hp0[k]-h.player.hp))'));
 // Malédiction propre au héros touché.
 run('CANAAN_ARENA.run().curse.set(lina,CANAAN_ARENA.run().clock+8)');
 assert.equal(run('CANAAN_ARENA.healFactor(lina)'),0.4);assert.equal(run('CANAAN_ARENA.healFactor()'),1);
 // Lina tombe : pas de relève automatique dans l'arène ; Oren reste à côté d'elle 3 s et la relève à 30 %.
 run('CANAAN_ARENA.run().boss.cd=1e9;CANAAN_ARENA.run().boss.moveClock=1e9;CANAAN_ARENA.run().boss.autoClock=1e9;CANAAN_ARENA.run().boss.busy=1e9');
 run('lina.player.hp=0;lina.player.dead=true;oren.player.x=lina.player.x+30;oren.player.y=lina.player.y;game.hero.player.x=lina.player.x+500');
 for(let i=0;i<60*2;i++)run('time++;simulateStep()');
 assert.equal(run('lina.player.dead'),true,'encore à terre après 2 s');
 for(let i=0;i<60*1.2;i++)run('time++;simulateStep()');
 assert.equal(run('lina.player.dead'),false,'relevée par Oren');assert.equal(run('lina.player.hp'),Math.round(1e6*0.3));
 // L'hôte à terre : le combat continue tant qu'un allié est debout.
 run('P.hp=1;CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss)');for(let i=0;i<3;i++)run('time++;simulateStep();updateWorld()');
 assert.equal(run('P.dead'),true);assert.equal(run('CANAAN_ARENA.run().failed'),false,'la tentative continue');
 assert.ok(run('__toasts.some(t=>t.includes("un allié peut te relever"))'));
 const clock0=run('CANAAN_ARENA.run().clock');for(let i=0;i<30;i++)run('time++;runUpdatePipeline()');
 assert.ok(run('CANAAN_ARENA.run().clock')>clock0,'le monde avance pendant que l’hôte est à terre');
 // Lina relève l'hôte.
 run('lina.player.x=P.x+20;lina.player.y=P.y');for(let i=0;i<60*3.2;i++)run('time++;simulateStep()');
 assert.equal(run('P.dead'),false,'l’hôte est relevé');
 // Boss vaincu : un Rubis et un record pour chacun ; un héros à terre se relève.
 run('oren.player.dead=true;oren.player.hp=0;globalThis.owned0=game.heroes.map(h=>Object.values(h.rubis.owned).reduce((a,b)=>a+b,0))');
 run('{const b=CANAAN_ARENA.run().boss;canaanDamageMonster(b,b.hp+1e6,game.hero)}');
 assert.equal(run('game.heroes.every((h,k)=>Object.values(h.rubis.owned).reduce((a,b)=>a+b,0)===owned0[k]+1)'),true,'un Rubis pour chaque héros');
 assert.equal(run('game.heroes.every(h=>h.arena.best===1)'),true);assert.equal(run('oren.player.dead'),false,'relevé à la fin de la vague');
 // Tout le groupe à terre : la tentative échoue, retour au camp.
 run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
 run('for(const h of game.heroes){h.player.hp=0;h.player.dead=true}');run('time++;CanaanStages.arena.after()');
 assert.equal(run('CANAAN_ARENA.run().failed'),true);assert.ok(run('__toasts.some(t=>t.includes("Tout le groupe est à terre"))'));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Arène en ligne : l’invité entre avec l’hôte, voit le colisée, le boss et ses annonces, encaisse les zones et gagne son Rubis',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{};canaanRegenRates=()=>({mana:0,health:0})');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<1000&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<1000&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(10);
  // L'hôte entre dans l'Arène : l'invité suit, son colisée est construit à l'identique.
  assert.equal(host.run('enterArena()'),true);await step(10);
  assert.equal(guest.run('!!game.world.instance?.arena'),true,'l’invité est dans le colisée');
  assert.equal(guest.run('JSON.stringify(game.world.tiles)===JSON.stringify(makeDungeon("arena"))')||guest.run('game.world.tiles[arenaLayout().y/TS|0][arenaLayout().x/TS|0]')===host.run('game.world.tiles[arenaLayout().y/TS|0][arenaLayout().x/TS|0]'),true);
  host.run(G+'.player.mhp='+G+'.player.hp=1e6;{const L=arenaLayout();P.x=L.x-30;P.y=L.y+60;'+G+'.player.x=L.x+30;'+G+'.player.y=L.y+60}');
  await step(12);host.run('CANAAN_ARENA.run().timer=0');await step(10);
  assert.equal(host.run('CANAAN_ARENA.run().phase'),'fight');assert.equal(host.run('CANAAN_ARENA.run().group'),2,'boss pour deux héros');
  assert.equal(guest.run('CANAAN_ARENA.run()?.phase'),'fight','l’invité voit le combat commencer');
  assert.equal(guest.run('CANAAN_ARENA.run().boss?.t'),host.run('CANAAN_ARENA.run().boss.t'),'et le boss');
  const gate=host.run('JSON.stringify(arenaLayout().gate[0])');
  assert.equal(guest.run('(([x,y])=>game.world.tiles[y][x])('+gate+')'),19,'herse fermée chez l’invité');
  // Une frappe de zone annoncée : visible chez l'invité, puis elle le touche chez l'hôte.
  host.run('{const b=CANAAN_ARENA.run().boss;b.moveClock=b.autoClock=1e9;P.x=b.x-40;P.y=b.y+50;'+G+'.player.x=b.x+40;'+G+'.player.y=b.y+50}');
  await step(8);const hp0=host.run(G+'.player.hp');
  host.run('CANAAN_ARENA.playMove("slam")');await step(6);
  assert.equal(guest.run('CANAAN_ARENA.run().fx.some(fx=>fx.shape==="circle")'),true,'annonce au sol visible chez l’invité');
  await step(80);
  // Esquive possible (petite chance de base) : une seconde frappe, au même endroit.
  if(host.run(G+'.player.hp')>=hp0){host.run('{const b=CANAAN_ARENA.run().boss;'+G+'.player.x=b.x+40;'+G+'.player.y=b.y+50}');host.run('CANAAN_ARENA.playMove("slam")');await step(86)}
  assert.ok(host.run(G+'.player.hp')<hp0,'la zone touche aussi l’invité');
  // Victoire : un Rubis pour l'invité, annoncé chez lui et rangé dans sa collection.
  const owned0=guest.run('Object.values(game.hero.rubis.owned).reduce((a,b)=>a+b,0)');
  host.run('{const b=CANAAN_ARENA.run().boss;canaanDamageMonster(b,b.hp+1e6,game.hero)}');await step(12);
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("💎 Rubis obtenu"))'),'Rubis annoncé à l’invité');
  assert.equal(guest.run('Object.values(game.hero.rubis.owned).reduce((a,b)=>a+b,0)'),owned0+1,'collection de l’invité');
  assert.equal(guest.run('game.hero.arena.best'),1,'record de l’invité');
  assert.equal(guest.run('(([x,y])=>game.world.tiles[y][x])('+gate+')'),20,'herse rouverte');
  // Sortie : l'invité revient au monde avec l'hôte.
  host.run('leaveInstance()');await step(10);
  assert.equal(guest.run('game.world.instance'),null);assert.equal(guest.run('CANAAN_ARENA.run()'),null);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Arène : tout le groupe à terre (l’hôte tombé en premier) revient au camp, chacun relevé',()=>{
 for(const order of ['hostFirst','guestFirst']){
  const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
  run('started=true;paused=false;P.dead=false;globalThis.__t=[];setTimeout=f=>{__t.push(f);return 1};toast=()=>{};game.view.chat=()=>{}');
  run('game.hero.level=20;{const h=canaanCreateHero({name:"Lina",x:P.x,y:P.y});h.level=20;game.heroes.push(h);globalThis.lina=h}');
  assert.equal(run('enterArena()'),true);
  run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
  for(let i=0;i<10;i++)run('time++;simulateStep()');run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
  assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
  const host='P.hp=1;CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss);updateWorld()',ally='CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss,lina)';
  for(const s of order==='hostFirst'?[host,ally]:[ally,host]){run(s);for(let i=0;i<20;i++)run('time++;runUpdatePipeline()')}
  assert.equal(run('P.dead&&lina.player.dead'),true);
  assert.equal(run('__t.length'),1,order+' : un seul retour au camp programmé');
  run('__t.splice(0).forEach(f=>f())');
  assert.equal(run('game.world.instance'),null,order+' : le colisée est quitté');
  assert.equal(run('P.dead||lina.player.dead'),false,order+' : tout le monde est relevé');
  assert.ok(run('Math.hypot(P.x-CANAAN_SPAWN.x,P.y-CANAAN_SPAWN.y)<1&&Math.hypot(lina.player.x-P.x,lina.player.y-P.y)<3*TS'),order+' : au camp');
  assert.equal(errors.length,0,errors.join('\n'));
 }
});

test('Arène : les cercles au sol ne touchent que les héros qui sont dedans',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;toast=()=>{};game.view.chat=()=>{};Math.random=()=>0.5;canaanRegenRates=()=>({mana:0,health:0})');
 run('game.hero.level=30;{const h=canaanCreateHero({name:"Lina",x:P.x,y:P.y});h.level=30;game.heroes.push(h);globalThis.lina=h}');
 assert.equal(run('enterArena()'),true);
 run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
 for(let i=0;i<10;i++)run('time++;simulateStep()');run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 run('const b=CANAAN_ARENA.run().boss;b.cd=b.moveClock=b.autoClock=b.busy=1e9;for(const h of game.heroes){h.player.mhp=h.player.hp=1e6}');
 // Chaque attaque à cercles autour du héros visé : l'hôte est visé, l'alliée est dans le colisée à 700 px de lui.
 // Avant la correction, chaque cercle touchait tous les héros, où qu'ils soient.
 const spot='{const L=arenaLayout();P.x=L.x+300;P.y=L.y;lina.player.x=L.x-400;lina.player.y=L.y;CANAAN_ARENA.run().boss.target=game.hero}';
 for(const move of ['quake','rocks','poison','lightning','meteors']){
  run('CANAAN_ARENA.run().fx.length=0;CANAAN_ARENA.run().hazards.length=0;CANAAN_ARENA.run().dots.length=0;'+spot);
  run('time++;simulateStep();'+spot+';globalThis.lina0=lina.player.hp;globalThis.host0=P.hp;CANAAN_ARENA.playMove("'+move+'")');
  for(let i=0;i<200;i++)run('time++;'+spot+';simulateStep()');
  assert.equal(run('lina.player.hp'),run('lina0'),move+' : l’alliée hors des cercles n’est pas touchée');
  assert.ok(run('P.hp')<run('host0'),move+' : l’hôte, dans les cercles, est touché');
 }
 assert.equal(errors.length,0,errors.join('\n'));
});
