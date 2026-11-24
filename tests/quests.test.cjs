const { test } = require('node:test');
const { assert, source } = require('./helpers/context.cjs');

// Joueur automatique : prend une quête, joue chaque étape comme un joueur (objets, combats, escortes, courses…) et la
// rend. PUZZLES : les étapes propres à un lieu.
const PLAYER = `started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];
 globalThis.tp=(site,dx,dy)=>{const s=S(site);P.x=(s.x+dx+0.5)*TS;P.y=(s.y+dy+0.5)*TS};
 globalThis.toNpc=id=>{const n=Q.npcs()[id];layer(!!n.under);P.x=n.x+30;P.y=n.y};
 globalThis.layer=u=>{if(u!==canaanUnder())CANAAN_UNDER.setLayer(u?'under':'surface')};
 globalThis.act=(site,obj,n=1)=>{for(let i=0;i<n;i++)Q.act(HR,site,obj)};
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};
 globalThis.st=()=>Q.state(HR);globalThis.step=id=>st().active[id]?st().active[id].step:(st().done[id]?'done':'none');
 globalThis.npcOf=id=>QUESTS.find(q=>q.id===id).npc;
 globalThis.board=id=>{const g=st().guild;g.slot=guildSlot(Date.now());g.rank=guildRankIndex(g.fame);g.board=[id];g.taken=[]};
 globalThis.take=id=>{const q=QUESTS.find(q=>q.id===id);if(q.contract){board(id);toNpc('guilde');const ok=Q.take(HR,id);if(q.npc!=='guilde')toNpc(q.npc);return ok}toNpc(npcOf(id));return Q.accept(HR,id)};
 globalThis.dungeonFor=s=>instances.findIndex(d=>!d.arena&&(!s.raid||d.raid)&&(!s.under||d.under)&&(d.scaled||(d.mobLevel||1)>=clampLevel(HR.level)-6));
 globalThis.give=id=>{toNpc(npcOf(id));return Q.turnIn(HR,id)};
 globalThis.alive=f=>game.world.monsters.filter(f);
 globalThis.slay=f=>{alive(f).forEach(m=>{m.hp=0});game.world.monsters=game.world.monsters.filter(m=>m.hp>0||m.questGuardian||m.title)};
 globalThis.PUZZLES={
  1:{0:()=>{tp('q1',1,1);tick(20)}},
  4:{1:()=>act('q4','dig')},
  5:{1:()=>{Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act('q5','ripple1');if(step(5)!==1)throw 'pas doré';Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act('q5','ripple2')}},
  6:{2:()=>{for(let i=1;i<=4;i++)act('q6','mstone'+i)},3:()=>{for(const c of ['chime1','chime2','chime3','chime0'])act('q6',c)}},
  7:{3:()=>{tp('q7',2,-1);time=Math.ceil(time/10)*10-1;tick(2)}},
  8:{1:()=>{tp('q8',0,-8);tick(20)}},
  9:{0:()=>{const e=S('q9').trail.at(-1);P.x=e[0];P.y=e[1];tick(20)}},
  10:{2:()=>act('q10','view')},
  14:{0:()=>{for(const c of ['lanterne','barque','vieille','pecheur'])act('q14','clue_'+c)}},
  15:{2:()=>{tp('q15',4,0);time=Math.ceil(time/10)*10-1;tick(2)}},
  16:{0:()=>{for(const f of ['f1','f2','f3','f4'])act('q16',f)}},
  17:{0:()=>{for(const f of ['fr1','fr2','fr3','fr4'])act('q17',f)}},
  18:{1:()=>{for(let k=0;k<400&&step(18)===1;k++){const s=S('q18'),t=Q.puzzles().q18.t;P.x=(s.x+0.5)*TS+Math.cos(t*0.011)*3.2*TS+Math.sin(t*0.031)*0.6*TS;P.y=(s.y+0.5)*TS+Math.sin(t*0.017)*2.4*TS;if((Math.sin(t*0.045)+1)/2<0.3)act('q18','leaf18');else tick(1)}}},
  20:{0:()=>{for(const t of ['t1','t2','t3'])act('q20',t)},1:()=>{act('q20','hide0');if(step(20)!==1)throw 'mauvaise cachette';act('q20','hide1')}},
  24:{0:()=>{for(let i=0;i<3;i++)act('q24','mirror'+i,2)}},
  26:{3:()=>act('q26','altar')},
  27:{0:()=>act('q27','fresco27'),1:()=>{act('q27','altar27');for(let k=0;k<20&&step(27)===1;k++){tp('q27',0,2);tick(130);slay(m=>m.questEcho)}},4:()=>{for(let i=0;i<6;i++)act('q27','cc'+i)}},
  28:{1:()=>{act('q28','lever1');act('q28','lever2');tp('q28',5,0);tick(5)}},
  30:{1:()=>{for(const [x,y] of [[-2,-1],[0,-2],[1,0],[0,1],[2,1]]){tp('q30',x,y);tick(1)}}}
 };
 globalThis.playStep=id=>{
  const q=QUESTS.find(q=>q.id===id),i=step(id),s=q.steps[i],site=S(s.site||q.site)||null;
  if(site)layer(!!site.under);game.world.monsters=game.world.monsters.filter(m=>m.hp>0);
  if(PUZZLES[id]?.[i])return PUZZLES[id][i]();
  const objs=site?site.objs.filter(o=>o.kind==='field'&&o.quest.id===id&&o.step===i):[],o=objs[0],key=id+'_'+i,runs=Q.field().runs();
  const at=v=>{P.x=v.x;P.y=v.y};
  P.hp=P.mhp;P.dead=false;
  switch(s.k){
   case 'kill':case 'loot':for(let k=0;k<200&&step(id)===i;k++)canaanAchieve(HR,'kill',s.mobs==='*'?{t:'Loup',x:P.x,y:P.y,hp:0,level:clampLevel(HR.level),elite:!!s.elite,worldBoss:!!s.boss}:{t:s.mobs[k%s.mobs.length],x:P.x,y:P.y,hp:0});return;
   case 'pick':for(const v of objs){at(v);if(Q.act(HR,site.id,v.id)===false)throw 'objet '+v.id}return;
   case 'wave':at(o);act(site.id,o.id);for(let k=0;k<30&&step(id)===i;k++){P.hp=P.mhp;tick(130);slay(m=>m.questRun===key)}return;
   case 'escort':{at(o);act(site.id,o.id);for(let k=0;k<6000&&step(id)===i;k++){const r=runs.get(key);if(!r)throw 'escorte perdue '+__t.at(-1);P.x=r.x+20;P.y=r.y;tick(1);slay(m=>m.questRun===key)}return}
   case 'hunt':{at(o);act(site.id,o.id);const m=alive(m=>m.title===s.title)[0];if(!m)throw 'champion absent';if(!m.elite||mobTitle(m)!==s.title)throw 'champion';m.hp=0;tick(1);return}
   case 'chase':for(let k=0;k<(s.n||1);k++){at(o);tick(2);at(o);act(site.id,o.id)}return;
   case 'race':{const go=objs.find(v=>v.race==='go');at(go);act(site.id,go.id);for(let k=0;k<s.n;k++){at(objs.find(v=>v.race===k));tick(1)}return}
   case 'talk':toNpc(s.npc);Q.handle(HR,{op:'quest-talk',q:id});return;
   case 'choice':toNpc(s.npc||q.npc);Q.handle(HR,{op:'quest-choice',q:id,choice:q.answer??1});return;
   case 'work':for(let k=0;k<s.n;k++)s.job==='fish'?canaanAchieve(HR,'fish','gardon',1):s.job==='cook'?canaanAchieve(HR,'cook','x',1):canaanAchieve(HR,'gather',s.job,'x',1);return;
   case 'clear':for(let k=0;k<(s.n||1);k++)canaanAchieve(HR,'clear',s.instance==='*'?dungeonFor(s):s.instance);return;
   case 'sky':layer(false);time=Math.ceil(time/30)*30-1;tick(2);return;
   case 'guardian':{const seal=site.objs.find(v=>v.kind==='gseal');tp(site.id,0,1);Q.act(HR,site.id,'gseal');const m=alive(m=>m.questGuardian===site.id)[0];if(!m)throw 'gardien absent';m.hp=0;tick(1);return}
  }
  throw 'étape inconnue '+s.k};
 globalThis.play=id=>{
  if(!take(id))return 'refusée';
  const q=QUESTS.find(q=>q.id===id);
  for(let i=0;i<q.steps.length;i++){playStep(id);if(step(id)!==i+1)return 'étape '+i+' ('+q.steps[i].k+') : '+step(id)+' · '+__t.slice(-2).join(' | ')}
  return give(id)&&step(id)==='done'?'ok':'non rendue'};`;

test('Quêtes : les 30 quêtes de la surface se jouent de bout en bout (chasse, escortes, défenses, champions, gardiens, choix), jusqu’au réveil du Cœur', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(PLAYER + ';game.hero.level=60;HR.inventory.length=0;HR.bagLimit=100;');
  assert.equal(run('take(2)'), false, 'la 2 après la 1');
  for (let id = 1; id <= 30; id++) {
    run('HR.inventory.length=0');
    assert.equal(run('play(' + id + ')'), 'ok', 'quête ' + id);
  }
  assert.equal(run('Object.keys(st().done).length'), 30);
  // Récompenses, gardiens, sanctuaires, monde changé.
  assert.ok(run('st().flags.lumi&&st().flags.blessing&&st().flags.title&&st().flags.aurora'));
  assert.equal(run('[1,2,3,4,5,6].filter(n=>st().flags["star"+n]).length'), 6);
  assert.equal(run('[2,7,12,17,22,27].every(n=>st().flags["heart_q"+n])'), true);
  assert.ok(
    run(
      '["sommet","goldtree","lanterns","bridge","archives","grenier","cite","machine","oasis","pyria","sanct_murmures","sanct_reflets","sanct_saisons","sanct_etoiles","sanct_lumieres","sanct_aurore"].every(f=>Q.world().flags[f])'
    ),
    run('JSON.stringify(Q.world().flags)')
  );
  assert.equal(run('HR.prof.fish["dore:3"]'), 2, 'poissons dorés');
  // Contrat du lac (rendu la première fois) : le bijou, en plus de l'équipement du rang.
  assert.ok(run('HR.inventory.some(i=>["ring","neck"].includes(i.slot)&&i.rarity==="Légendaire")'), 'bijou du lac');
  assert.equal(run('CANAAN_QUESTS.questLook(HR)'), 7, 'Lumi, bénédiction et aura');
  // Le pont porte ; un sanctuaire ouvert reçoit son visiteur.
  assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'), true);
  run('HR.inventory.length=0;act("q6","shrine")');
  assert.equal(run('HR.inventory.length'), 1);
  // Choix moral : la réplique de fin en dépend.
  assert.equal(run('st().choices[27]'), 1);
  run('globalThis.__p=[];modernPanel=h=>__p.push(h);toNpc("auralis");Q.interact()');
  assert.match(run('__p.at(-1)'), /a repris la mer/);
  // Raccourci forestier.
  run('tp("q8",0,-8);act("q8","waystone")');
  assert.ok(run('Math.hypot(P.x-(CANAAN_CAMP.x*TS),P.y-(CANAAN_CAMP.y*TS))') < 14 * 48, 'pierre de passage');
  // Sauvegarde et rechargement.
  const snap = JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot())'));
  assert.equal(Object.keys(snap.heros.hote.quetes.done).length, 30);
  assert.ok(snap.monde.quetes.flags.bridge);
  run('Q.importWorld({})');
  assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'), false);
  run('Q.importWorld(' + JSON.stringify(snap.monde.quetes) + ')');
  assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'), true);
  // Monde d'une ancienne aventure : une énigme résolue garde son changement.
  run('Q.importWorld({solved:{q13:true,q22:true}})');
  assert.equal(run('Q.world().flags.bridge&&Q.world().flags.machine'), true);
  // Journal.
  run('__p.length=0;for(const t of ["main","side","treasure","done"])Q.render(t)');
  assert.match(run('__p[0]'), /★★★★★★/);
  assert.match(run('__p[0]'), /La Ballade de l’Aurore · 6 \/ 7/);
  assert.match(run('__p[0]'), /Interlude — Les Voix d’en bas/);
  assert.match(run('__p[3]'), /Souvenir/);
  // Énigmes : le genre n'est plus qu'une étape sur dix.
  assert.ok(run('QUESTS.filter(q=>q.steps.some(s=>s.k==="puzzle")).length') <= 4);
  assert.ok(run('QUESTS.filter(q=>q.id<=30).every(q=>q.steps.some(s=>s.k!=="puzzle"))'));
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Interlude des Tréfonds : 16 quêtes à tout niveau, quatre voix dans l’ordre qu’on veut, la faille et le dernier couplet', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(PLAYER + ';game.hero.level=7;HR.bagLimit=100;recomputeStats();');
  // Lieux et personnages : tous posés, sur un sol praticable, atteignables depuis la forteresse.
  assert.equal(run('Object.values(Q.sites()).filter(s=>s.under).length'), 16);
  const bad = run(`layer(true);JSON.stringify((()=>{const U=CANAAN_UNDER.spawnPoint(),sx=Math.floor(U.x/TS),sy=Math.floor(U.y/TS),seen=new Set([sy*MAPW+sx]),q=[[sx,sy]];
   for(let h=0;h<q.length;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(y+dy)*MAPW+x+dx;if(!seen.has(k)&&!SOLID.includes(tileAt(x+dx,y+dy))){seen.add(k);q.push([x+dx,y+dy])}}}
   const ok=o=>seen.has(Math.floor(o.y/TS)*MAPW+Math.floor(o.x/TS));
   return [...Object.values(Q.sites()).filter(s=>s.under).flatMap(s=>s.objs).filter(o=>!ok(o)).map(o=>o.id),...Object.values(Q.npcs()).filter(n=>n.under&&!ok(n)).map(n=>n.id)]})())`);
  assert.equal(bad, '[]', 'lieux atteignables');
  // La surface n'a pas bougé : 30 coquillages, aucun dans les Tréfonds.
  assert.equal(run('SHELLS.length'), 30);
  // Rien d'autre que la descente n'est requis ; les voix attendent le roi, le chœur attend les quatre voix.
  assert.equal(run('take(32)'), false);
  const gold0 = run('P.gold');
  assert.equal(run('play(31)'), 'ok');
  assert.equal(run('P.gold-' + gold0), 50 + 9 * 7, 'or au niveau du héros');
  assert.equal(run('questXp(questById(31),7)'), Math.round(run('levelXpShare(7)') * 0.8));
  assert.ok(run('questXp(questById(31),50)>questXp(questById(31),7)'));
  assert.equal(run('take(36)'), false, 'le chœur attend les voix');
  for (const id of [35, 33, 34, 32]) assert.equal(run('play(' + id + ')'), 'ok', 'voix ' + id);
  assert.equal(run('VOICES.every(v=>st().flags[v.flag])'), true);
  // Les ennemis d'une épreuve sont au niveau du héros.
  run('take(36);playStep(36)');
  assert.equal(run('step(36)'), 1);
  run('{const s=S("q36"),o=s.objs.find(o=>o.k==="wave");P.x=o.x;P.y=o.y;act("q36",o.id);tick(130)}');
  assert.equal(run('alive(m=>m.questRun==="36_1").length>0&&alive(m=>m.questRun==="36_1").every(m=>m.level===game.hero.level)'), true);
  // Plus personne debout à côté : la défense est abandonnée, et se retente.
  run('P.x+=40*TS;tick(2)');
  assert.equal(run('Q.field().runs().size'), 0);
  assert.equal(run('alive(m=>m.questRun).length'), 0);
  run('for(let i=1;i<4;i++)playStep(36)');
  assert.equal(run('step(36)'), 4, run('__t.slice(-3).join(" | ")'));
  assert.ok(run('st().flags.heart_q36'));
  assert.equal(run('give(36)'), true);
  assert.equal(run('Q.questLook(HR)&8'), 8, 'Écho');
  for (let id = 37; id <= 46; id++) {
    run('HR.inventory.length=0');
    assert.equal(run('play(' + id + ')'), 'ok', 'quête ' + id);
  }
  assert.equal(run('Object.keys(st().done).length'), 16);
  // Un nain sans quête à donner retrouve ses répliques ; le journal a son chapitre Interlude.
  run('globalThis.__p=[];modernPanel=h=>__p.push(h);Q.render("main")');
  assert.match(run('__p[0]'), /Interlude — Les Voix d’en bas/);
  assert.match(run('__p[0]'), /La voix de la mousse/);
  assert.match(run('__p[0]'), /dernier couplet|que le ciel a perdue/);
  // Suivi : une quête des Tréfonds suivie depuis l'île mène à l'entrée la plus proche.
  run('layer(false);P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;delete st().done[39];st().active[39]={step:0,got:[],n:0};st().track=39');
  assert.equal(run('Q.target(HR).text'), 'Descendre dans les Tréfonds');
  // Champ libre : les vrais monstres des Tréfonds comptent, un allié proche aussi.
  run('layer(true);const h=CANAAN_UNDER.hub(0);P.x=h.x;P.y=h.y;globalThis.ally=canaanCreateHero({name:"Lina",x:h.x+40,y:h.y});game.heroes.push(ally);Q.state(ally).active[39]={step:0,got:[],n:0};recordKill({t:"Taupe-garou",x:h.x,y:h.y,hp:0,mhp:10,level:7,r:16},HR)');
  assert.equal(run('st().active[39].n+Q.state(ally).active[39].n'), 2);
  assert.equal(run('Q.target(HR).count.join("/")'), '1/6');
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Quêtes à plusieurs : chacun sa progression, une épreuve gagnée ensemble compte pour chacun, demandes d’invité vérifiées', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(PLAYER + ';globalThis.n=Q.npcs().liora;P.x=n.x+30;P.y=n.y;globalThis.ally=canaanCreateHero({name:"Lina",x:n.x+40,y:n.y});game.heroes.push(ally)');
  // L'invité demande à l'hôte : quête acceptée seulement près du PNJ, objet seulement à portée.
  assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'), true);
  assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'), false, 'déjà en cours');
  assert.equal(run('Q.handle(ally,{op:"quest-accept",q:2})'), false, 'quête 2 : la 1 d’abord');
  assert.equal(run('Q.accept(game.hero,1)'), true);
  run('tp("q1",1,1);ally.player.x=P.x;ally.player.y=P.y;tick(20)');
  assert.equal(run('Q.state(ally).active[1].step+step(1)'), 2, 'les deux suivent les traces');
  // Objets personnels : chacun les siens.
  const ids = JSON.parse(run('JSON.stringify(S("q1").objs.filter(o=>o.k==="pick").map(o=>o.id))'));
  assert.equal(ids.length, 4);
  assert.equal(run('ally.player.x+=30*TS,Q.handle(ally,{op:"quest-act",site:"q1",obj:"' + ids[0] + '"})'), false, 'trop loin');
  for (const id of ids) {
    run('{const o=S("q1").objs.find(o=>o.id==="' + id + '");P.x=ally.player.x=o.x;P.y=ally.player.y=o.y}');
    assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"' + id + '"})'), true, id);
    assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"' + id + '"})'), false, 'une seule fois');
  }
  assert.equal(run('Q.state(ally).active[1].step'), 2);
  assert.equal(run('step(1)'), 1, 'l’hôte ramasse les siens');
  run('playStep(1)');
  // La défense, lancée par l'invité, compte pour les deux ; l'invité en voit l'état.
  run('{const o=S("q1").objs.find(o=>o.k==="wave");P.x=ally.player.x=o.x;P.y=ally.player.y=o.y}');
  assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:S("q1").objs.find(o=>o.k==="wave").id})'), true);
  run('tick(110)');
  assert.ok(run('alive(m=>m.questRun==="1_2").length>=3'), 'un ennemi de plus par allié');
  const view = run('JSON.stringify(Q.netView())');
  assert.match(view, /"1_2","wave"/);
  run('for(let k=0;k<20&&step(1)===2;k++){P.hp=P.mhp;ally.player.hp=ally.player.mhp;tick(130);slay(m=>m.questRun==="1_2")}');
  assert.equal(run('Q.state(ally).active[1].step+step(1)'), 6, 'gagnée ensemble');
  // Rendue par l'allié seulement : sa récompense et sa Lumi, pas celles de l'hôte.
  run('ally.player.x=n.x+30;ally.player.y=n.y');
  assert.equal(run('Q.handle(ally,{op:"quest-turnin",q:1})'), true);
  assert.equal(run('!!Q.state(ally).flags.lumi&&!st().flags.lumi'), true);
  assert.equal(run('Q.questLook(ally)'), 1);
  // Messages réseau : seules les demandes bien formées passent.
  assert.equal(
    run('JSON.stringify(sanitizeAction({op:"quest-act",site:"q12",obj:"f12_0_3"}))'),
    '{"op":"quest-act","site":"q12","obj":"f12_0_3"}'
  );
  assert.equal(run('sanitizeAction({op:"quest-act",site:"<x>",obj:"a"})'), null);
  assert.equal(run('sanitizeAction({op:"quest-accept",q:200})'), null);
  assert.equal(run('JSON.stringify(sanitizeAction({op:"quest-talk",q:31,x:1}))'), '{"op":"quest-talk","q":31}');
  assert.equal(run('sanitizeAction({op:"quest-choice",q:14,choice:9})'), null);
  assert.equal(run('Q.handle(ally,{op:"quest-talk",q:31})'), false, 'pas à cette étape');
  assert.equal(run('Q.handle(ally,{op:"quest-choice",q:9,choice:1})'), false, 'pas à cette étape');
  // Vue appliquée chez un invité : épreuve dessinée, vue abîmée ignorée.
  run('Q.puzzles().q24.m=[1,2,3,0];globalThis.v=JSON.parse(' + JSON.stringify(view) + ');v.s.q24=[1,2,3,0];Q.puzzles().q24.m=[0,0,0,0];Q.applyRemote(v)');
  assert.equal(run('Q.puzzles().q24.m.join()'), '1,2,3,0');
  assert.equal(run('Q.field().runs().get("1_2").k'), 'wave');
  run('Q.applyRemote({s:{f:[["1_2"],[1,2,3],"x",["9_9","wave",1,2,3,4,5,6]]}})');
  assert.equal(run('Q.field().runs().size'), 0);
  // Progression sauvegardée vérifiée : quête inconnue, étape hors limite et drapeau inventé retirés ; une quête en cours
  // d'avant la refonte reprend à sa première étape.
  assert.equal(
    run(
      'JSON.stringify((({guild,...o})=>o)(sanitizeQuests({v:2,active:{1:{step:99,n:7},77:{step:0}},done:{2:5},flags:{lumi:1,triche:1},deco:["mouton","x"]})))'
    ),
    JSON.stringify({
      active: { 1: { step: 3, got: [], n: 7 } },
      done: { 2: 5 },
      flags: { lumi: true },
      choices: {},
      track: null,
      troc: 0,
      shells: [],
      paid: 0,
      v: 2
    })
  );
  assert.equal(
    run('JSON.stringify(sanitizeQuests({active:{7:{step:2,got:["a"]}},done:{6:1}}).active)'),
    '{"7":{"step":0,"got":[],"n":0}}',
    'ancienne aventure'
  );
  assert.equal(
    run(
      'JSON.stringify((({guild,...o})=>o)(sanitizeQuests({v:2,troc:99,shells:["c_q1","c_q1","x"],paid:-3,flags:{heart_q2:1,heart_q36:1,heart_q99:1}})))'
    ),
    JSON.stringify({
      active: {},
      done: {},
      flags: { heart_q2: true, heart_q36: true },
      choices: {},
      track: null,
      troc: 13,
      shells: ['c_q1'],
      paid: 0,
      v: 2
    }),
    'troc, coquillages et cœurs vérifiés'
  );
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Objectifs de terrain : course au chronomètre, fuyard qui court, escorte perdue, butin de quête, dessin sans erreur', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(PLAYER + ';game.hero.level=40;recomputeStats();');
  const jump = (id, k) => {
    run('st().done={};st().active={};for(let i=1;i<=46;i++)if(i!==' + id + ')st().done[i]=1;take(' + id + ')');
    run('st().active[' + id + '].step=QUESTS.find(q=>q.id===' + id + ').steps.findIndex(s=>s.k==="' + k + '")');
  };
  // Course : hors temps, elle repart du départ.
  jump(18, 'race');
  run('{const go=S("q18").objs.find(o=>o.race==="go");P.x=go.x;P.y=go.y;act("q18",go.id)}');
  assert.ok(run('st().active[18].n') > 5);
  run('{const o=S("q18").objs.find(o=>o.race===0);P.x=o.x;P.y=o.y;tick(1)}');
  assert.equal(run('st().active[18].got.length'), 1);
  run('tick(60*60)');
  assert.equal(run('st().active[18].got.length+st().active[18].n'), 0, 'temps écoulé');
  // Fuyard : il s'éloigne du héros, plus lentement que lui, et reste dans son domaine.
  jump(3, 'chase');
  run('globalThis.sheep=S("q3").objs.find(o=>o.k==="chase");P.x=sheep.x-60;P.y=sheep.y;tick(1);globalThis.x0=sheep.x;globalThis.d0=Math.hypot(sheep.x-P.x,sheep.y-P.y);tick(30)');
  assert.ok(run('Math.hypot(sheep.x-P.x,sheep.y-P.y)>d0'), 'il fuit');
  assert.ok(run('Math.hypot(sheep.x-P.x,sheep.y-P.y)-d0') < 30 * run('CANAAN_PLAYER_SPEED'), 'moins vite que le héros');
  run('for(let i=0;i<900;i++){P.x+=(sheep.x-P.x)*0.02;P.y+=(sheep.y-P.y)*0.02;tick(1)}');
  assert.ok(run('Math.hypot(sheep.x-S("q3").x*TS,sheep.y-S("q3").y*TS)<13*TS'), 'il ne quitte pas la colline');
  // Escorte : abandonnée, elle se retente ; l'embuscade attend le milieu du chemin.
  jump(25, 'escort');
  run('{const o=S("q25").objs.find(o=>o.k==="escort");P.x=o.x;P.y=o.y;act("q25",o.id);tick(1)}');
  assert.equal(run('Q.field().runs().size'), 1);
  run('P.x+=60*TS;tick(2)');
  assert.equal(run('Q.field().runs().size'), 0);
  assert.equal(run('step(25)'), 2);
  // Butin : seulement les bonnes créatures, jamais plus de quelques coups sans rien.
  jump(7, 'loot');
  run('for(let i=0;i<30;i++)canaanAchieve(HR,"kill",{t:"Slime",x:P.x,y:P.y,hp:0})');
  assert.equal(run('st().active[7].n'), 0);
  run('for(let i=0;i<24;i++)canaanAchieve(HR,"kill",{t:"Gobelin",x:P.x,y:P.y,hp:0})');
  assert.equal(run('step(7)'), 1, 'six fioles en 24 gobelins au plus');
  // Chaque lieu se dessine à chaque étape, sur sa couche, sans erreur.
  run(`for(const q of QUESTS)for(let i=0;i<=q.steps.length;i++){st().active={[q.id]:{step:i,got:[],n:1}};st().track=q.id;const s=S(q.steps[i]?.site||q.site);if(!s){layer(false);const t=Q.target(HR);if(!t||!Number.isFinite(t.x)||!t.text)throw new Error('objectif '+q.id+' étape '+i);continue}layer(!!s.under);
   for(const o of s.objs.filter(o=>o.kind==='field'&&o.step===i&&o.quest===q)){P.x=o.x;P.y=o.y;camX=P.x-W/2;camY=P.y-H/2;CANAAN_QUESTS.drawWorld(ctx)}
   P.x=(s.x+.5)*TS;P.y=(s.y+.5)*TS;camX=P.x-W/2;camY=P.y-H/2;time++;CANAAN_QUESTS.drawWorld(ctx);CANAAN_QUESTS.drawBubbles(ctx);CanaanStages.drawQuests();const t=Q.target(HR);if(!t||!Number.isFinite(t.x)||!t.text)throw new Error('objectif '+q.id+' étape '+i)}`);
  // Les personnages parlent tous, à chaque moment de leur quête.
  run(`globalThis.__p=[];modernPanel=h=>__p.push(h);for(const n of Object.values(Q.npcs())){if(!n.quest||n.def.when)continue;const q=n.quest;
   for(const s of [{},{active:{[q.id]:{step:0,got:[],n:0}}},{active:{[q.id]:{step:q.steps.length,got:[],n:0}}},{done:{[q.id]:1}}]){Object.assign(st(),{active:{},done:{}},s);toNpc(n.id);Q.interact()}}`);
  assert.doesNotMatch(run('__p.join()'), /undefined|null|NaN/);
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Aventure : grand troc, coquillages chantants, gardiens de l’Ombre et Cœurs d’Aurore', () => {
  const { g, run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(`started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];game.hero.level=30;
 globalThis.toNpc=id=>{const n=Q.npcs()[id];P.x=n.x+30;P.y=n.y};globalThis.st=()=>Q.state(HR);
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};`);
  // Grand troc : treize échanges dans l'ordre ; un habitant qui n'est pas le suivant refuse, de loin aussi.
  assert.equal(run('toNpc("eloi");Q.trade(HR,"eloi")'), false, 'Éloi attend la laine');
  assert.equal(run('toNpc("milo");P.x+=8*TS;Q.trade(HR,"milo")'), false, 'trop loin');
  const chain = run('JSON.stringify(TRADE_CHAIN.map(t=>t.npc))');
  for (const npc of JSON.parse(chain))
    assert.equal(run('toNpc("' + npc + '");Q.trade(HR,"' + npc + '")'), true, npc);
  assert.equal(run('st().troc'), 13);
  assert.equal(run('tradeItem(st()).id'), 'loupe');
  assert.equal(run('HR.inventory.at(-1).rarity'), 'Légendaire', 'fin du troc');
  assert.equal(run('Q.trade(HR,"orven")'), false, 'plus rien à échanger');
  // Le dialogue de l'habitant propose l'échange (bouton questTrade).
  run('globalThis.__p=[];modernPanel=h=>__p.push(h);Q.state(HR).troc=4;toNpc("pipo");Q.interact()');
  assert.match(run('__p.at(-1)'), /questTrade/);
  assert.match(run('__p.at(-1)'), /Flûte de roseau/);
  run('Q.state(HR).troc=13');
  // Coquillages : un par lieu, chacun pour soi ; un deuxième ramassage ne compte pas.
  assert.equal(run('Object.values(Q.sites()).filter(s=>s.objs.some(o=>o.kind==="shell")).length'), 30);
  run(
    'for(const s of Object.values(Q.sites())){const o=s.objs.find(o=>o.kind==="shell");if(!o)continue;P.x=o.x;P.y=o.y;Q.act(HR,s.id,"shell")}'
  );
  assert.equal(run('st().shells.length'), 30);
  run('Q.act(HR,"q1","shell")');
  assert.equal(run('st().shells.length'), 30);
  // Madame Nacre : tous les paliers d'un coup, deux Cœurs d'Aurore ; les PV max montent de 3 % par cœur.
  const hp0 = run('characterStats(HR).maxHp');
  assert.equal(run('Q.claimShells(HR)'), false, 'loin de Madame Nacre');
  run('toNpc("nacre");Q.interact()');
  assert.match(run('__p.at(-1)'), /questShells/);
  assert.equal(run('Q.claimShells(HR)'), true);
  assert.equal(run('st().paid'), 6);
  assert.equal(run('heartCount(st())'), 2);
  assert.equal(run('characterStats(HR).maxHp'), Math.round(hp0 * 1.06));
  assert.equal(run('Q.claimShells(HR)'), false, 'déjà récompensé');
  // Gardien : la quête 2 finie sans son cœur (ancienne aventure) peut le défier ; un vrai boss, au niveau du héros.
  run('Q.state(HR).done[2]=1');
  assert.equal(run('Q.guardianDue(HR,questById(2))'), true);
  run('{const s=S("q2");P.x=(s.x+0.5)*TS;P.y=(s.y+1.5)*TS;Q.act(HR,"q2","gseal")}');
  assert.equal(
    run(
      '(m=>!!m&&m.boss&&m.level===30&&m.t==="Ronce-Moussue")(game.world.monsters.find(m=>m.questGuardian==="q2"))'
    ),
    true
  );
  assert.equal(run('Q.act(HR,"q2","gseal")'), false, 'un seul gardien à la fois');
  // Ses attaques : un cercle annoncé, puis des dégâts à qui reste dedans ; renforts à 66 %.
  run('P.hp=P.mhp;tick(181)');
  run('tick(90)');
  assert.ok(run('P.hp<P.mhp'), 'coup de l’Ombre');
  run('(m=>{m.hp=m.mhp*0.6})(game.world.monsters.find(m=>m.questGuardian==="q2"));tick(1)');
  assert.equal(run('game.world.monsters.filter(m=>m.questAdd==="q2").length'), 2, 'renforts');
  // Héros parti : le gardien et ses renforts disparaissent, le sceau attend.
  run('P.x+=60*TS;tick(1)');
  assert.equal(run('game.world.monsters.some(m=>m.questGuardian||m.questAdd)'), false);
  assert.equal(run('!!Q.fights().q2'), false);
  // Victoire : le cœur, une seule fois.
  run(
    '{const s=S("q2");P.x=(s.x+0.5)*TS;P.y=(s.y+1.5)*TS;Q.act(HR,"q2","gseal");game.world.monsters.find(m=>m.questGuardian==="q2").hp=0;tick(1)}'
  );
  assert.ok(run('st().flags.heart_q2'));
  assert.equal(run('heartCount(st())'), 3);
  assert.equal(run('Q.guardianDue(HR,questById(2))'), false);
  // Fanfare : l'objet brandi et la bannière, tirés de l'état du héros.
  run(
    'tick(1);st().shells.pop();for(let i=0;i<3;i++){time++;CanaanStages.drawQuests()}st().shells.push("c_q1");for(let i=0;i<3;i++){time++;CanaanStages.drawQuests()}'
  );
  assert.match(run('document.body.children.find(e=>e.id==="questFanfare").innerHTML'), /Coquillage chantant/);
  // Journal : onglet Trésors.
  run('CANAAN_QUESTS.render("treasure")');
  assert.match(run('__p.at(-1)'), /Le grand troc · 13/);
  assert.match(run('__p.at(-1)'), /Cœurs d’Aurore · 3/);
  // Réseau : demandes bien formées seulement.
  assert.equal(
    run('JSON.stringify(sanitizeAction({op:"quest-trade",npc:"milo"}))'),
    '{"op":"quest-trade","npc":"milo"}'
  );
  assert.equal(run('sanitizeAction({op:"quest-trade",npc:"<x>"})'), null);
  assert.equal(run('JSON.stringify(sanitizeAction({op:"quest-shells",x:1}))'), '{"op":"quest-shells"}');
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Règles partagées des énigmes : chaque état résolu mène à la solution, l’état de départ non', async () => {
  const path = require('node:path'),
    { pathToFileURL } = require('node:url');
  const shared = f => import(pathToFileURL(path.join(__dirname, '..', 'src', 'canaan', 'shared', f)).href);
  const R = await shared('rules/puzzles.js');
  const fresh = R.puzzleFreshStates(),
    solved = id => R.puzzleSolvedState(id);
  assert.notEqual(fresh.q24.m, R.puzzleFreshStates().q24.m, 'état de départ copié, pas partagé');
  assert.equal(R.puzzleSolvedState('inconnu'), null);
  // Rayon : la cible est atteinte avec les miroirs résolus (positions réelles des miroirs ci-dessous non requises : le moteur est générique).
  const mirrors = [
    { dx: -1, dy: -2, i: 0 },
    { dx: 0, dy: -2, i: 1 },
    { dx: 1, dy: -2, i: 2 }
  ];
  assert.equal(
    R.puzzleBeam({ sun: [-4, -2], dir: [1, 0], target: [2, -2], bound: [6, 5] }, mirrors, [1, 0, 0]).lit,
    false,
    'miroir bloquant'
  );
  assert.equal(
    R.puzzleBeam({ sun: [-4, -2], dir: [1, 0], target: [2, -2], bound: [6, 5] }, [], []).lit,
    true,
    'rayon droit'
  );
  // Monde à l'envers : les leviers résolus changent les rochers ; aucun levier : tous les rochers.
  assert.equal(R.puzzleMirrorRocks([0, 0, 0]).size, R.PUZZLE_MIRROR_ROCKS.length);
  assert.notDeepEqual([...R.puzzleMirrorRocks(solved('q28').l)], [...R.puzzleMirrorRocks([0, 0, 0])]);
  // Générateur à graine : reproductible, dans [0, 1[.
  const a = R.seededRandom(4242),
    b = R.seededRandom(4242);
  for (let i = 0; i < 50; i++) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
});

test('Suivi : sans quête en cours, il mène au prochain personnage qui en donne une, l’histoire d’abord', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  run(PLAYER + ';game.hero.level=1;HR.bagLimit=100;');
  const next = () => run('(t=>t?t.q.id+" "+(t.offer?"offre":"étape"):"rien")(Q.target(HR)||Q.nextOffer(HR))');
  assert.equal(next(), '1 offre', 'Liora au départ');
  assert.equal(run('play(1)'), 'ok');
  assert.equal(next(), '2 offre', 'Orven après la quête rendue');
  run('take(2)');
  assert.equal(next(), '2 étape', 'la quête prise est suivie');
  assert.equal(errors.length, 0, errors.join('\n'));
});

test('Guilde : rangs F à S, tableau de trois contrats renouvelé tous les quarts d’heure, un contrat à la fois, rejouable', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run(PLAYER + ';HR.inventory.length=0;HR.bagLimit=100;');
  // 51 contrats : les 28 demandes des habitants et 23 avis de la guilde, sept rangs avec leurs titres.
  assert.equal(run('QUESTS.filter(q=>q.contract).length'), 51);
  assert.equal(run('QUESTS.filter(q=>q.contract&&q.npc==="guilde").length'), 23);
  assert.equal(run('GUILD_RANKS.map(r=>r.id+":"+r.title).join()'), 'F:Recrue,E:Aventurier,D:Explorateur,C:Vétéran,B:Champion,A:Héros,S:Légende');
  assert.ok(run('GUILD_RANKS.every(r=>QUESTS.filter(q=>q.contract===r.id).length>=6)'));
  assert.ok(run('QUESTS.filter(q=>q.contract).every(q=>q.scaled&&!q.main)'), 'tous au niveau du héros');
  // Un contrat ne se prend jamais auprès d'un habitant : pas de « ! », une réplique qui renvoie à la guilde.
  run('game.hero.level=5;globalThis.__p=[];modernPanel=h=>__p.push(h);toNpc("milo");Q.interact()');
  assert.equal(run('Q.npcMode(HR,Q.npcs().milo)'), 'idle');
  assert.equal(run('Q.accept(HR,3)'), false);
  assert.match(run('__p.at(-1)'), /tableau de la guilde \(rang F\)/);
  // Tableau : trois contrats de rang F à la portée d'un héros de niveau 5, les mêmes tout le quart d'heure.
  run('const g=st().guild;g.fame=0;g.rank=-1;g.board=[];refreshBoard(st(),5,Date.UTC(2026,0,1,10,1))');
  const first = run('JSON.stringify(st().guild.board)');
  assert.equal(run('st().guild.board.length'), 3);
  assert.ok(run('st().guild.board.every(id=>{const q=QUESTS.find(q=>q.id===id);return q.contract==="F"&&q.level<=8})'));
  assert.equal(run('refreshBoard(st(),5,Date.UTC(2026,0,1,10,14))'), false);
  assert.equal(run('JSON.stringify(st().guild.board)'), first);
  const boards = new Set(
    JSON.parse(run('JSON.stringify(Array.from({length:8},(_,k)=>(refreshBoard(st(),5,Date.UTC(2026,0,1,10+k,20)),st().guild.board.join())))'))
  );
  assert.ok(boards.size > 1, 'le tableau change');
  assert.equal(run('guildRefreshIn(Date.UTC(2026,0,1,10,1))'), 14 * 60 * 1000);
  // Prendre : près de la maîtresse de guilde, un seul à la fois, jamais deux fois sur le même tableau.
  run('refreshBoard(st(),5,Date.now());globalThis.B=st().guild.board.slice();tp("q3",0,0)');
  assert.equal(run('Q.take(HR,B[0])'), false, 'loin de la guilde');
  run('toNpc("guilde")');
  assert.equal(run('CANAAN_GUILD.near(HR)'), true);
  assert.equal(run('Q.take(HR,B[0])'), true);
  assert.equal(run('Q.take(HR,B[1])'), false, 'un seul contrat à la fois');
  assert.equal(run('Q.handle(HR,{op:"quest-abandon",q:B[0]})'), true);
  assert.equal(run('Q.take(HR,B[0])'), false, 'déjà pris sur ce tableau');
  assert.equal(run('Q.handle(HR,{op:"quest-take",q:B[1]})'), true);
  run('Q.abandon(HR,B[1])');
  // Fenêtre de la guilde : rang, renommée, trois contrats et compte à rebours ; le journal a son onglet Guilde.
  run('__p.length=0;CANAAN_GUILD.open();Q.render("side")');
  assert.match(run('__p.join("")'), /Rang F · Recrue/);
  assert.match(run('__p.join("")'), /nouveaux contrats dans \d+:\d\d/);
  assert.equal(run('(__p.find(h=>h.includes("guild-panel")&&h.includes("guildTake"))||"").match(/guild-contract/g).length'), 3);
  assert.match(run('__p.at(-1)'), /Guilde des Aventuriers/);
  // Un avis se joue et se rend à la guilde : or, XP, renommée et équipement de son rang ; rejouable au tableau suivant.
  run('game.hero.level=20;HR.exp=0;HR.inventory.length=0');
  const gold = run('P.gold');
  assert.equal(run('play(101)'), 'ok');
  assert.ok(run('P.gold') > gold);
  assert.equal(run('st().guild.fame'), 10);
  assert.equal(run('st().guild.count'), 1);
  assert.equal(run('HR.inventory.length'), 1);
  assert.equal(run('HR.inventory[0].rarity'), 'Peu commun');
  assert.equal(run('play(101)'), 'ok', 'rejouable');
  // Un avis ne compte que des créatures à la mesure du héros.
  run('board(101);toNpc("guilde");Q.take(HR,101)');
  run('canaanAchieve(HR,"kill",{t:"Loup",x:P.x,y:P.y,hp:0,level:3})');
  assert.equal(run('st().active[101].n'), 0, 'trop faible');
  run('canaanAchieve(HR,"kill",{t:"Loup",x:P.x,y:P.y,hp:0,level:18})');
  assert.equal(run('st().active[101].n'), 1);
  run('Q.abandon(HR,101)');
  // Demande d'habitant : rendue à son client, avec sa récompense propre la première fois seulement.
  assert.equal(run('play(5)'), 'ok');
  assert.equal(run('HR.prof.fish["dore:3"]'), 2);
  assert.equal(run('play(5)'), 'ok');
  assert.equal(run('HR.prof.fish["dore:3"]'), 2, 'poissons dorés une seule fois');
  // Rang : la renommée fait monter de F à S ; chaque avis se joue de bout en bout au niveau 60.
  run('game.hero.level=60');
  for (const id of JSON.parse(run('JSON.stringify(QUESTS.filter(q=>q.npc==="guilde").map(q=>q.id))'))) {
    run('HR.inventory.length=0');
    assert.equal(run('play(' + id + ')'), 'ok', 'avis ' + id);
  }
  run('st().guild.fame=2090');
  assert.equal(run('guildRankIndex(st().guild.fame)'), 6);
  assert.equal(run('CANAAN_GUILD.rankOf(HR).title'), 'Légende');
  // Un avis de raid n'est affiché qu'à partir du niveau des raids.
  assert.equal(run('drawBoard(1,1,5,20).includes(117)'), false);
  assert.equal(run('contractFits(QUESTS.find(q=>q.id===117),46)'), true);
  // Récompense : la part d'un niveau monte avec le rang ; la renommée aussi.
  assert.ok(run('questXp(QUESTS.find(q=>q.id===123),30)>questXp(QUESTS.find(q=>q.id===101),30)'));
  assert.equal(run('contractFame(QUESTS.find(q=>q.id===123))'), 60);
  // État vérifié : renommée bornée, tableau limité à des contrats connus.
  assert.equal(
    run('JSON.stringify((({seed,...g})=>g)(sanitizeGuild({fame:-5,board:[101,1,999,102,103,104],taken:[1],slot:"x",count:3.7})))'),
    '{"fame":0,"slot":0,"rank":-1,"board":[101,102,103],"taken":[],"count":3}'
  );
  // En ligne : prendre et abandonner un contrat passent par l'hôte.
  assert.deepEqual(JSON.parse(run('JSON.stringify(sanitizeAction({op:"quest-take",q:101}))')), { op: 'quest-take', q: 101 });
  assert.equal(run('sanitizeAction({op:"quest-abandon",q:"x"})'), null);
  assert.equal(errors.length, 0, errors.join('\n'));
});
