const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Quêtes : les 15 quêtes des chapitres I à III se jouent de bout en bout (énigmes, récompenses, monde changé, sauvegarde)',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const check=(id)=>{assert.equal(run('give('+id+')'),true,'turn in '+id);assert.equal(run('step('+id+')'),'done')};
 run(`started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];
 globalThis.tp=(site,dx,dy)=>{const s=S(site);P.x=(s.x+dx+0.5)*TS;P.y=(s.y+dy+0.5)*TS};
 globalThis.toNpc=id=>{const n=Q.npcs()[id];P.x=n.x+30;P.y=n.y};
 globalThis.act=(site,obj,n=1)=>{for(let i=0;i<n;i++)Q.act(HR,site,obj)};
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};
 globalThis.st=()=>Q.state(HR);globalThis.step=id=>st().active[id]?st().active[id].step:(st().done[id]?'done':'none');
 globalThis.take=id=>{toNpc(Q.npcs()[Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id)].id);return Q.accept(HR,id)};
 globalThis.give=id=>{toNpc(Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id));return Q.turnIn(HR,id)};`);
 // Q2 locked before Q1
 assert.equal(run('take(2)'),false,'Q2 locked');
 // Q1
 assert.equal(run('take(1)'),true);run('tp("q1",1,1);tick(20)');assert.equal(run('step(1)'),1,'trail');
 run('act("q1","p_lune")');assert.equal(run('step(1)'),1);run('for(const s of ["soleil","pluie","vent","lune"])act("q1","p_"+s)');assert.equal(run('step(1)'),2);check(1);
 assert.equal(run('st().flags.lumi'),true);
 // Q2
 run('take(2);for(const s of ["etoile","lune","flamme"])act("q2","sym_"+s)');assert.equal(run('step(2)'),1);
 run('act("q2","ped0",2);act("q2","ped1",2);act("q2","ped2",2)');assert.equal(run('step(2)'),2);check(2);
 // Q3
 run('take(3);act("q3","gate0");act("q3","gate1");act("q3","gate2");act("q3","whistle");tick(400)');assert.equal(run('step(3)'),1,'sheep');check(3);
 assert.ok(run('st().deco.includes("mouton")'));
 // Q4
 const inv0=run('HR.inventory.length');run('take(4);act("q4","dig")');assert.equal(run('step(4)'),1);check(4);assert.equal(run('HR.inventory.length'),inv0+1);
 // Q5
 run('take(5);Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act("q5","ripple1")');assert.equal(run('step(5)'),0,'pas doré');run('Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act("q5","ripple2")');assert.equal(run('step(5)'),1);check(5);
 assert.equal(run('HR.prof.fish["dore:3"]'),2);
 // Q6
 run('take(6);for(let i=1;i<=4;i++)act("q6","mstone"+i)');assert.equal(run('step(6)'),1);
 const door=run('(o=>canWalk(o.x,o.y))(S("q6").objs.find(o=>o.kind==="door"))');assert.equal(door,false);
 run('for(const c of ["chime1","chime2","chime3","chime0"])act("q6",c)');assert.equal(run('step(6)'),2);
 assert.equal(run('(o=>canWalk(o.x,o.y))(S("q6").objs.find(o=>o.kind==="door"))'),true,'porte ouverte');check(6);
 const inv1=run('HR.inventory.length');run('act("q6","shrine")');assert.equal(run('HR.inventory.length'),inv1+1);assert.ok(run('st().flags.visit_murmures'));
 // Q7
 run('take(7);act("q7","mirror0",2);act("q7","mirror1",2)');assert.equal(run('Q.beam().lit'),true);assert.equal(run('step(7)'),1);
 run('tp("q7",2,-1);time=Math.ceil(time/10)*10-1;tick(2)');assert.equal(run('step(7)'),2);check(7);assert.ok(run('st().flags.star1&&st().flags.blessing'));
 // Q8
 run('take(8);tp("q8",0,-8);tick(20)');assert.equal(run('step(8)'),1);check(8);
 run('tp("q8",0,-8);act("q8","waystone")');assert.ok(run('Math.hypot(P.x-(CANAAN_CAMP.x*TS),P.y-(CANAAN_CAMP.y*TS))')<14*48,'pierre de passage');
 // Q9
 run('take(9);(e=>{P.x=e[0];P.y=e[1]})(S("q9").trail.at(-1));tick(20)');assert.equal(run('step(9)'),1);run('act("q9","thief")');assert.equal(run('step(9)'),2);check(9);
 // Q10
 run('take(10);act("q10","view")');check(10);
 // Q11
 run('take(11);act("q11","valve0",2);act("q11","valve2",1)');assert.equal(run('step(11)'),1);assert.ok(run('Q.world().flags.lanterns&&Q.world().flags.sanct_reflets'));check(11);
 // Q12
 run('take(12);act("q12","frame0",2);act("q12","frame1",2);act("q12","frame2",2);act("q12","frame3",1)');assert.equal(run('step(12)'),1);check(12);assert.ok(run('st().flags.star2'));
 // Q13
 const plank=run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))');assert.equal(plank,false);
 run('take(13);act("q13","plank0",2);act("q13","plank1",1);act("q13","plank2",3);act("q13","plank3",2)');assert.equal(run('step(13)'),1);
 assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),true,'pont praticable');check(13);
 // Q14
 run('take(14);for(const c of ["lanterne","barque","vieille","pecheur"])act("q14","clue_"+c)');assert.equal(run('step(14)'),1);
 run('toNpc("esprit")');assert.equal(run('CANAAN_QUESTS.handle(HR,{op:"quest-choice",q:14,choice:0})'),true);assert.equal(run('step(14)'),1);
 run('CANAAN_QUESTS.handle(HR,{op:"quest-choice",q:14,choice:1})');assert.equal(run('step(14)'),2);check(14);
 // Q15 : nénuphar qui coule et chute, puis l'îlot.
 run('take(15);tp("q15",-3,0);tick(130)');const s15=run('[Math.floor(P.x/TS)-S("q15").x,Math.floor(P.y/TS)-S("q15").y]');assert.equal(JSON.stringify(s15),'[-4,0]','plouf');
 run('tp("q15",4,0);time=Math.ceil(time/10)*10-1;tick(2)');assert.equal(run('step(15)'),1);check(15);
 // Bilan, sauvegarde et rechargement.
 assert.equal(run('Object.keys(st().done).length'),15);
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot())'));
 assert.equal(Object.keys(snap.heros.hote.quetes.done).length,15);assert.ok(snap.monde.quetes.flags.bridge);
 run('Q.importWorld({});');assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),false);
 run('Q.importWorld('+JSON.stringify(snap.monde.quetes)+')');assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),true);
 
 // Journal (trois onglets), dialogues et décorations de quête débloquées pour la maison.
 run('globalThis.__p=[];modernPanel=h=>__p.push(h);CANAAN_QUESTS.render("main");CANAAN_QUESTS.render("side");CANAAN_QUESTS.render("done")');
 assert.match(run('__p[0]'),/Étoiles du Cœur : ★★☆☆☆☆/);assert.match(run('__p[0]'),/Carte des sanctuaires/);assert.match(run('__p[2]'),/Souvenir/);
 assert.equal(run('CANAAN_QUESTS.hasDeco(HR,"mouton")&&CANAAN_QUESTS.hasDeco(HR,"tableau")'),true);
 assert.equal(run('CANAAN_PROF.RECIPES.dore.quest'),5);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Quêtes à plusieurs : chacun sa progression, une énigme résolue ensemble compte pour chacun, demandes d’invité vérifiées',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;game.world.monsters=[];globalThis.Q=CANAAN_QUESTS;globalThis.n=Q.npcs().liora;P.x=n.x+30;P.y=n.y');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:n.x+40,y:n.y});game.heroes.push(ally)');
 // L'invité demande à l'hôte : quête acceptée seulement près du PNJ, objet seulement à portée.
 assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'),true);assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'),false,'déjà en cours');
 assert.equal(run('Q.handle(ally,{op:"quest-accept",q:2})'),false,'quête 2 : la 1 d’abord');
 assert.equal(run('Q.accept(game.hero,1)'),true);
 assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"p_soleil"})'),false,'trop loin');
 // Les deux suivent les traces ; l'allié touche les pierres, l'énigme compte pour les deux.
 run('const s=Q.sites().q1;P.x=ally.player.x=(s.x+1.5)*TS;P.y=ally.player.y=(s.y+1.5)*TS;for(let i=0;i<20;i++){time++;CanaanStages.quests.after()}');
 assert.equal(run('Q.state(ally).active[1].step+Q.state(game.hero).active[1].step'),2);
 for(const s of ['soleil','pluie','vent','lune']){run('(o=>{ally.player.x=o.x+40;ally.player.y=o.y})(Q.sites().q1.objs.find(o=>o.id==="p_'+s+'"))');assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"p_'+s+'"})'),true,s)}
 assert.equal(run('Q.state(ally).active[1].step'),2);assert.equal(run('Q.state(game.hero).active[1].step'),2,'l’hôte, à côté, est crédité');
 // Rendue par l'allié seulement : sa récompense et sa Lumi, pas celles de l'hôte.
 run('ally.player.x=n.x+30;ally.player.y=n.y');assert.equal(run('Q.handle(ally,{op:"quest-turnin",q:1})'),true);
 assert.equal(run('!!Q.state(ally).flags.lumi&&!Q.state(game.hero).flags.lumi'),true);assert.equal(run('Q.questLook(ally)'),1);
 // Messages réseau : seules les demandes bien formées passent.
 assert.equal(run('JSON.stringify(sanitizeAction({op:"quest-act",site:"q12",obj:"frame0"}))'),'{"op":"quest-act","site":"q12","obj":"frame0"}');
 assert.equal(run('sanitizeAction({op:"quest-act",site:"<x>",obj:"a"})'),null);assert.equal(run('sanitizeAction({op:"quest-accept",q:99})'),null);
 assert.equal(run('sanitizeAction({op:"quest-choice",q:14,choice:9})'),null);
 // État des lieux envoyé aux invités, appliqué tel quel.
 run('Q.puzzles().q7.m=[1,2,3]');const view=run('JSON.stringify(Q.netView())');run('Q.puzzles().q7.m=[0,0,0];Q.applyRemote('+view+')');
 assert.equal(run('Q.puzzles().q7.m.join()'),'1,2,3');
 // Progression sauvegardée vérifiée : quête inconnue, étape hors limite et drapeau inventé retirés.
 assert.equal(run('JSON.stringify(sanitizeQuests({active:{1:{step:99},77:{step:0}},done:{2:5},flags:{lumi:1,triche:1},deco:["mouton","x"]}))'),
  JSON.stringify({active:{1:{step:2,got:[]}},done:{2:5},flags:{lumi:true},deco:['mouton'],choices:{},track:null}));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Quêtes : les chapitres IV à VI (quêtes 16 à 30) se jouent de bout en bout, jusqu’au réveil du Cœur',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run(`started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];game.hero.level=60;
 for(let i=1;i<=15;i++)Q.state(HR).done[i]=1;Object.assign(Q.state(HR).flags,{star1:true,star2:true,lumi:true});
 globalThis.tp=(site,dx,dy)=>{const s=S(site);P.x=(s.x+dx+0.5)*TS;P.y=(s.y+dy+0.5)*TS};
 globalThis.toNpc=id=>{const n=Q.npcs()[id];P.x=n.x+30;P.y=n.y};
 globalThis.act=(site,obj,n=1)=>{for(let i=0;i<n;i++)Q.act(HR,site,obj)};
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};
 globalThis.st=()=>Q.state(HR);globalThis.step=id=>st().active[id]?st().active[id].step:(st().done[id]?'done':'none');
 globalThis.npcOf=id=>Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id);
 globalThis.take=id=>{toNpc(npcOf(id));return Q.accept(HR,id)};
 globalThis.give=id=>{toNpc(npcOf(id));return Q.turnIn(HR,id)};`);
 const check=id=>{assert.equal(run('give('+id+')'),true,'turn in '+id);assert.equal(run('step('+id+')'),'done')};
 // 16 : feuilles puis objets dans leurs maisons.
 run('take(16);for(const f of ["f1","f2","f3","f4"])act("q16",f)');assert.equal(run('step(16)'),1);
 run('for(let i=0;i<4;i++){act("q16","vobj"+i);act("q16","house"+i)}');assert.equal(run('step(16)'),2);check(16);
 assert.ok(run('Q.world().flags.sanct_saisons&&st().flags.star3'));
 // 17
 run('take(17);for(const f of ["fr1","fr2","fr3","fr4"])act("q17",f);act("q17","pillar0",3);act("q17","pillar2",1);act("q17","pillar3",2)');assert.equal(run('step(17)'),2);check(17);
 // 18 : la feuille doit être basse et sur le héros.
 run('take(18)');
 run('globalThis.leafPos=()=>{const s=S("q18");const t=Q.puzzles().q18.t;return {x:(s.x+0.5)*TS+Math.cos(t*0.011)*3.2*TS+Math.sin(t*0.031)*0.6*TS,y:(s.y+0.5)*TS+Math.sin(t*0.017)*2.4*TS,h:(Math.sin(t*0.045)+1)/2}}');
 for(let k=0;k<400;k++){const h=run('(l=>{P.x=l.x;P.y=l.y;return l.h})(leafPos())');if(h<0.3){run('act("q18","leaf18")');break}run('tick(1)')}
 assert.equal(run('step(18)'),1,'feuille attrapée');check(18);
 // 19
 run('take(19);act("q19","gear0",2);act("q19","gear1",1);act("q19","gear2",2)');assert.equal(run('step(19)'),1);check(19);
 // 20
 run('take(20);for(const t of ["t1","t2","t3"])act("q20",t);act("q20","hide0")');assert.equal(run('step(20)'),1,'mauvaise cachette');run('act("q20","hide1")');assert.equal(run('step(20)'),2);check(20);
 // 21 : obélisques dégagés puis tournés (initial [2,0,1] → [1,3,0]).
 run('take(21);for(let i=0;i<3;i++)act("q21","obelisk"+i)');assert.equal(run('step(21)'),1);
 run('act("q21","obelisk0",3);act("q21","obelisk1",3);act("q21","obelisk2",3)');assert.equal(run('step(21)'),2);check(21);
 // 22 : anneaux [3,1,4] ; ring2 seul, ring0 entraîne ring1, ring1 entraîne ring2.
 run('take(22)');
 run('(()=>{const r=Q.puzzles().q22.r;let a=(6-r[0])%6;act("q22","ring0",a);let b=(6-Q.puzzles().q22.r[1])%6;act("q22","ring1",b);let c=(6-Q.puzzles().q22.r[2])%6;act("q22","ring2",c)})()');
 assert.equal(run('step(22)'),1);check(22);
 // 23 : E, S, E, S.
 run('take(23);act("q23","fanW");act("q23","fanN");act("q23","fanW");act("q23","fanN")');assert.equal(run('step(23)'),1);check(23);
 // 24 : [2,2,2,1] → [0,0,0,*].
 run('take(24);act("q24","mirror0",2);act("q24","mirror1",2);act("q24","mirror2",2)');assert.equal(run('step(24)'),1);check(24);
 // 25
 run('take(25);act("q25","agate0");act("q25","agate2")');assert.equal(run('step(25)'),1);check(25);
 // 26 : épreuves puis autel.
 run('take(26);for(const [i,a] of [[0,1],[1,1],[2,0],[3,2]]){const o=S("q26").objs.find(o=>o.id==="trial"+i);P.x=o.x+40;P.y=o.y;Q.handle(HR,{op:"quest-act",site:"q26",obj:"trial"+i+"_a"+a})}');
 assert.equal(run('step(26)'),1);run('act("q26","altar")');assert.equal(run('step(26)'),2);check(26);
 // 27 : fresque, défense (on tue les échos), lumières.
 run('take(27);act("q27","fresco27");act("q27","altar27")');assert.equal(run('step(27)'),1);
 for(let k=0;k<20&&run('step(27)')===1;k++){run('tp("q27",0,2);tick(130);game.world.monsters.filter(m=>m.questEcho).forEach(m=>{m.hp=0});game.world.monsters=game.world.monsters.filter(m=>m.hp>0)')}
 assert.equal(run('step(27)'),2,'défense réussie');
 run('for(let i=0;i<6;i++)act("q27","cc"+i)');assert.equal(run('step(27)'),3);check(27);
 assert.ok(run('st().flags.title&&st().flags.aurora&&st().flags.star6'));
 // 28 : leviers 1 et 2, puis marcher jusqu'au coffre.
 run('take(28);act("q28","lever1");act("q28","lever2")');
 assert.equal(run('(s=>canWalk((s.x+5.5)*TS,(s.y+0.5)*TS))(S("q28"))'),true,'passage ouvert de l’autre côté du miroir');
 run('tp("q28",5,0);tick(5)');assert.equal(run('step(28)'),1);check(28);
 // 29
 run('take(29);act("q29","horn")');assert.equal(run('step(29)'),0);
 run('act("q29","perch0",2);act("q29","perch1",1);act("q29","perch2",3);act("q29","perch3",2);act("q29","horn");tick(300)');assert.equal(run('step(29)'),1);check(29);
 // 30 : marcher sur les pierres dans l'ordre.
 run('take(30)');for(const [x,y] of [[-2,-1],[0,-2],[1,0],[0,1],[2,1]]){run(`tp("q30",${x},${y});tick(1)`)}
 assert.equal(run('step(30)'),1);const inv=run('HR.inventory.length');check(30);assert.equal(run('HR.inventory.length'),inv+1);
 assert.equal(run('Object.keys(st().done).length'),30);
 
 // Titre, aura visible par les autres, sanctuaires ouverts pour tout le monde, journal complet.
 assert.equal(run('CANAAN_QUESTS.questLook(HR)'),5,'Lumi et l’aura du Gardien');
 assert.ok(run('["sanct_saisons","sanct_etoiles","sanct_lumieres","sanct_aurore"].every(f=>Q.world().flags[f])'));
 run('globalThis.__p=[];modernPanel=h=>__p.push(h);CANAAN_QUESTS.render("main")');assert.match(run('__p[0]'),/★★★★★★/);
 assert.equal(errors.length,0,errors.join('\n'));
});
