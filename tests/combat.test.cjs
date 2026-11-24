const { test } = require('node:test');
const {
  vm,
  assert,
  path,
  source,
  script,
  section,
  game,
  modifiers,
  mob,
  predictable
} = require('./helpers/context.cjs');

test('Mort : récompense unique, retrait du monstre et exécution des hooks suivants', () => {
  const g = game(); let after = 0;
  g.CANAAN_CLASS_ATTACK = {before: (_,damage) => ({damage}), after: () => after++};
  const m = {hp:1,mhp:1,x:50,y:0,g:12,t:'Slime'}; g.monsters.push(m);
  assert.equal(g.hit(m,100),1);
  assert.equal(g.kills,1); assert.equal(g.recorded,1); assert.equal(g.monsters.length,0);
  assert.equal(g.drops.length,1); assert.equal(after,1);
  g.hit(m,100); assert.equal(g.kills,1); assert.equal(g.drops.length,1);
});

test('Soin partagé : bonus appliqués une fois, plafond PV et mort respectés', () => {
  const g = game(); modifiers(g,0,20);
  assert.equal(vm.runInContext('typeof canaanApplyHeal',g),'function');
  assert.equal(g.canaanApplyHeal(10),12); assert.equal(g.P.hp,32);
  g.P.hp=99; assert.equal(g.canaanApplyHeal(100),1);
  assert.equal(g.canaanApplyHeal(0),0);
  g.P.hp=0;g.P.dead=true;assert.equal(g.canaanApplyHeal(100),0);
});

test('Sans classe : aucune compétence, l’attaque de base frappe à mains nues', () => {
  const g=game();assert.equal(g.equipment.weapon,null);assert.equal(g.currentWeaponType(),'');assert.equal(g.SKILLS.length,0);
  const m={hp:1000,mhp:1000,x:50,y:0,g:1,r:14};g.monsters.push(m);g.useSkill(0);assert.equal(g.P.mp,1000);
  assert.equal(g.canaanBasicAttack(false),true);assert.ok(m.hp<1000);
});

test('Paladin : Marteau du Jugement, puis un sol consacré qui frappe et soigne', () => {
  const g=game();g.setClass('paladin',[]);g.P.mp=100;g.P.mhp=1000;g.P.hp=100;
  const m=mob(1e7);m.x=g.mouseWorldX;m.y=g.mouseWorldY;g.monsters=[m];g.P.x=g.mouseWorldX;g.P.y=g.mouseWorldY;
  g.useSkill(3);g.advance(25);assert.ok(m.hp<1e7,'le marteau tombe');
  const hp=g.P.hp,mhp=m.hp;g.advance(130);assert.ok(g.P.hp>hp,'le sol consacré soigne');assert.ok(m.hp<mhp,'et brûle les ennemis');
});

test('Le moteur de combat utilise également le soin et ses bonus', () => {
  const g=game();modifiers(g,0,20);
  assert.equal(g.CANAAN_COMBAT.heal(10),12);
});

test('Récupération : vrai verrou réduit, pas de double réduction, nouvelle utilisation après expiration', () => {
  const g=game();g.setClass('paladin',[]);modifiers(g,30);g.P.mp=1000;
  g.useSkill(2);assert.ok(Math.abs(g.weaponCooldowns['aegis:2']-14)<1e-9);
  assert.equal(g.SKILLS[2].cd,g.weaponCooldowns['aegis:2']);
  const mp=g.P.mp;g.useSkill(2);assert.equal(g.P.mp,mp);
  for(let i=0;i<845;i++)g.runUpdatePipeline();
  assert.equal(g.weaponCooldowns['aegis:2'],0);
  assert.equal(g.SKILLS[2].cd,0);g.useSkill(2);assert.equal(g.P.mp,mp-40,'Ferveur : le double des 20 de mana');
});

test('Recharge conservée en changeant de forme (Druide) et en revenant', () => {
  const g=game();g.setClass('druide',[]);modifiers(g,30);g.P.mp=1000;g.useSkill(1);
  g.CANAAN_CLASS.special();assert.equal(g.currentWeaponType(),'feline');
  g.advance(91);g.CANAAN_CLASS.special();assert.equal(g.currentWeaponType(),'wildstaff');
  assert.ok(Math.abs(g.SKILLS[1].cd-(14*0.7-91/60))<1e-6);
});

test('Sans Récupération, recharge normale ; pas de consommation sans ressource', () => {
  const g=game();g.setClass('paladin',[]);modifiers(g);g.P.mp=1000;g.useSkill(2);assert.equal(g.weaponCooldowns['aegis:2'],20);
  g.P.mp=0;g.useSkill(1);assert.equal(g.weaponCooldowns['aegis:1'],undefined);
});

test('Statistiques d’un objet : trois principales selon niveau et qualité, deux secondaires tirées une fois et stables',()=>{
  const g=game(),prep=g.CANAAN_STATS_PREPARE;
  const it=prep({id:'t',slot:'armor',level:30,rarity:'Rare'}),keys=Object.keys(it.sec);
  assert.equal(keys.length,2);assert.notEqual(keys[0],keys[1]);
  const [lo,hi]=g.secondaryRange(30,'Rare');for(const v of Object.values(it.sec))assert.ok(v>=lo&&v<=hi,String(v));
  // Tirage fait une seule fois : relu tel quel (sauvegarde JSON comprise).
  const sec=JSON.stringify(it.sec);prep(it);assert.equal(JSON.stringify(it.sec),sec);
  const back=prep(JSON.parse(JSON.stringify(it)));assert.equal(JSON.stringify(back.sec),sec);
  // Principales : fixées par le niveau, la qualité et l'emplacement ; meilleure qualité = plus fort à niveau égal.
  const st=g.itemStats(it);assert.deepEqual(Object.keys(st.primary),['attack','defense','vitality']);
  assert.deepEqual(st.primary,g.itemStats({...it}).primary);
  const epic=g.itemStats({slot:'armor',level:30,rarity:'Épique'}).primary;
  for(const k of ['attack','defense','vitality'])assert.ok(epic[k]>st.primary[k],k);
  assert.ok(g.itemStats({slot:'armor',level:40,rarity:'Rare'}).primary.defense>st.primary.defense,'plus haut niveau, plus fort');
  // Toutes les combinaisons de secondaires sont possibles.
  const seen=new Set();for(let i=0;i<400;i++)seen.add(Object.keys(prep({id:'x'+i,slot:'ring',level:10,rarity:'Commun'}).sec).sort().join('+'));
  assert.equal(seen.size,15);
});

test('Deux bagues comptées ; statistiques du héros recalculées quand l’équipement change',()=>{
  const g=game(),ring=()=>({id:'r'+Math.random(),slot:'ring',level:20,rarity:'Rare'});
  const none=g.characterStats().primary.attack||0;g.equipment.ring=ring();const one=g.characterStats().primary.attack;
  g.equipment.ring2=ring();const two=g.characterStats().primary.attack;
  assert.ok(one>none&&two>one,'la seconde bague compte comme la première');
  delete g.equipment.ring;delete g.equipment.ring2;
  const armor={id:'armor',slot:'armor',level:5,rarity:'Commun'};g.equipment.armor=armor;const before=g.characterStats().primary.defense;
  armor.level=10;const after=g.characterStats().primary.defense;
  assert.ok(after>before);assert.equal(after,g.itemStats(armor).primary.defense,'sans classe, pas d’arme');
});

test('Déviation : esquive totale puis second jet indépendant pour diviser les dégâts',()=>{
  const g=game(),labels=[],classStats=g.CANAAN_CLASS_STATS;
  // 35 % d'esquive, ajoutés là où les talents de classe complètent les statistiques du héros.
  g.CANAAN_CLASS_STATS=(s,hero)=>{classStats(s,hero);s.dodge=35;return s};
  // Secondaires de l'arme tirées avant de compter les jets.
  g.characterStats();
  g.float=(x,y,label)=>labels.push(label);
  g.Math=Object.create(Math);
  function receive(rolls){let used=0;g.Math.random=()=>{assert.ok(used<rolls.length,'tirage supplémentaire inattendu');return rolls[used++]};const damage=g.monsterDamage(mob(100));return {damage,used}}
  const avoided=receive([.2]);assert.equal(avoided.damage,0);assert.equal(avoided.used,1);
  assert.ok(labels.includes('ESQUIVE !'));assert.ok(!labels.includes('DÉVIATION'));
  labels.length=0;
  const deflected=receive([.8,.2,.99]);assert.equal(deflected.used,3);
  assert.ok(labels.includes('DÉVIATION'));assert.ok(!labels.includes('ESQUIVE !'));
  labels.length=0;
  const full=receive([.8,.8,.99]);assert.equal(full.used,3);assert.ok(full.damage>1);
  assert.ok(Math.abs(deflected.damage-full.damage/2)<=1,'la déviation divise les dégâts par deux');
  assert.ok(!labels.includes('DÉVIATION'));assert.ok(!labels.includes('ESQUIVE !'));
});

test('Une esquive ne consomme pas le bouclier, garde zéro dégât et déclenche la Danse des ombres',()=>{
  const g=game(),base=g.characterStats;g.setClass('elementaliste',[7]);g.P.hp=g.P.mhp=100;g.P.mp=100;g.useSkill(1);
  g.characterStats=()=>{const s=base();s.dodge=100;return s};predictable(g,0);
  for(let i=0;i<5;i++)assert.equal(g.monsterDamage(mob(100)),0);
  // Le bouclier de la Barrière de givre (20 PV) est intact.
  assert.equal(g.CANAAN_CLASS.audit().shield,20);
  assert.equal(g.CANAAN_CLASS_DEFENSE(mob(100),10),0);
  assert.equal(g.CANAAN_CLASS_DEFENSE(mob(100),100),90);
  // Danse des ombres : une esquive rend invisible 1,5 s et le coup suivant est critique.
  const h=game(),hb=h.characterStats;h.setClass('assassin',[6]);
  h.characterStats=()=>{const s=hb();s.dodge=100;return s};predictable(h,0);h.monsterDamage(mob(100));
  h.characterStats=hb;assert.equal(h.P.veiled,true);assert.equal(h.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).forceCrit,true);
  h.advance(91);assert.equal(h.P.veiled,false);
});

test('IA : le coup esquivé n’enlève aucun PV, ne secoue pas l’écran et n’étourdit pas',()=>{
  const g=game(),base=g.characterStats,labels=[];
  g.characterStats=()=>{const s=base();s.dodge=100;return s};predictable(g,0);
  Object.assign(g,{TS:48,isSafe:()=>false,instanceState:null,bossStunImmunity:0,shake:0,rnd:()=>0});
  g.float=(x,y,label)=>labels.push(label);
  g.monsters=[{...mob(100),x:30,y:0,cd:0,boss:true}];const hp=g.P.hp;
  vm.runInContext(section('function nearestHero(m) {','// Coup reçu par un allié'),g);
  vm.runInContext(section('  game.world.monsters.forEach(m => {\n    // Les boss de l','\n  if (P.hp <= 0 && !P.dead)'),g);
  assert.equal(g.P.hp,hp);assert.equal(g.playerStun,0);assert.equal(g.shake,0);
  assert.ok(labels.includes('ESQUIVE !'));assert.ok(!labels.includes('-0'));
});

test('Attaques de base : chaque arme de classe (et les griffes du félin) frappe sans erreur',()=>{
  for(const c of ['druide','paladin','assassin','elementaliste','invocateur','barde','berserker','chasseur','guerrier']){
    const g=game();g.setClass(c,[]);const m=mob(1e7);m.x=60;g.monsters=[m];g.mouseWorldX=60;
    for(const heavy of [false,true]){assert.doesNotThrow(()=>g.canaanBasicAttack(heavy),c);g.advance(80)}
    if(c==='druide'){g.CANAAN_CLASS.special();for(const heavy of [false,true]){assert.doesNotThrow(()=>g.canaanBasicAttack(heavy),'félin');g.advance(80)}}
  }
});

test('Roulade d’esquive : invulnérable pendant le roulé, recharge de 4 s, réduite par le Voile du Néant',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=1000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;CANAAN_ARTEFACTS_STATE.import({})');
 const x0=run('P.x');
 assert.equal(run('canaanDodge(1,0)'),true);assert.equal(run('CANAAN_COMBAT.invulnerable()'),true);
 assert.equal(run('monsterDamage({hp:9,mhp:9,x:0,y:0,boss:true},500)'),0);
 for(let i=0;i<20;i++)run('time++;runUpdatePipeline()');
 assert.ok(run('P.x')-x0>100,'distance '+(run('P.x')-x0));assert.equal(run('CANAAN_COMBAT.invulnerable()'),false);
 assert.equal(run('canaanDodge(1,0)'),false);
 assert.ok(Math.abs(run('CANAAN_COMBAT.dodgeState().cooldown')-4)<1e-9);
 run("CANAAN_ARTEFACTS_STATE.import({ranks:{voile_neant:1},equipped:['voile_neant']})");
 assert.ok(Math.abs(run('CANAAN_COMBAT.dodgeState().cooldown')-2.6)<1e-9);
 for(let i=0;i<240;i++)run('time++;runUpdatePipeline()');
 assert.equal(run('canaanDodge(0,1)'),true);
});

test('Attaque de base : clic gauche rapide, clic droit lourd, sans mana, maintien et verrou commun',()=>{
 const {run,errors,fire,nodes}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=1000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;CANAAN_ARTEFACTS_STATE.import({})');
 // Secondaires fixées sans Célérité : les verrous gardent leur durée de base (0,55 s et 1,15 s).
 run('CANAAN_CLASS_STATE.import({id:"berserker",talents:[]});equipment.weapon.sec={power:1,crit:1};refreshWeaponBar()');
 run('monsters.length=0;monsters.push({x:P.x+60,y:P.y,hp:1e6,mhp:1e6,r:14,t:"Cible"});mouseWorldX=P.x+60;mouseWorldY=P.y;P.mp=0');
 // Sans mana : l'attaque de base frappe quand même, et ne consomme rien.
 assert.equal(run('canaanBasicAttack(false)'),true);assert.ok(run('monsters[0].hp')<1e6);assert.equal(run('P.mp'),0);
 // Verrou commun : ni rapide ni lourde avant 0,6 s.
 assert.equal(run('canaanBasicAttack(false)'),false);assert.equal(run('canaanBasicAttack(true)'),false);
 for(let i=0;i<37;i++)run('time++;runUpdatePipeline()');
 const before=run('monsters[0].hp');assert.equal(run('canaanBasicAttack(true)'),true);
 const heavy=before-run('monsters[0].hp');assert.ok(Math.abs(run('CANAAN_BASIC_ATTACK.lock()')-1.15)<1e-9);
 // Maintien du clic gauche : enchaîne les attaques toutes les 0,6 s.
 for(let i=0;i<90;i++)run('time++;runUpdatePipeline()');
 run('canaanHoldBasicAttack(0,true)');const held=run('monsters[0].hp');
 for(let i=0;i<120;i++)run('time++;runUpdatePipeline()');
 assert.ok(run('monsters[0].hp')<held);run('canaanHoldBasicAttack(0,false)');
 const after=run('monsters[0].hp');for(let i=0;i<120;i++)run('time++;runUpdatePipeline()');
 assert.equal(run('monsters[0].hp'),after);
 // L'attaque lourde frappe plus fort que la rapide.
 run('monsters[0].hp=1e6');for(let i=0;i<90;i++)run('time++;runUpdatePipeline()');run('canaanBasicAttack(false)');
 assert.ok(heavy>1e6-run('monsters[0].hp'),'lourde '+heavy);
 // Un vrai clic sur le canevas : attaque de base (bouton de la souris et visée), jamais la compétence 1.
 run('globalThis.__calls=[];const hold=canaanHoldBasicAttack,skill=useSkill;canaanHoldBasicAttack=(...a)=>__calls.push(["hold",...a]);useSkill=i=>__calls.push(["skill",i]);globalThis.__restore=()=>{canaanHoldBasicAttack=hold;useSkill=skill}');
 for(const button of [0,2])fire(nodes.get('game'),'mousedown',{button,clientX:640,clientY:360});
 assert.deepEqual(JSON.parse(run('JSON.stringify(__calls)')),[['hold',0,true,640,360],['hold',2,true,640,360]]);
 run('__restore()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Règle partagée des dégâts reçus : Défense selon le niveau de l’attaquant, Résistance, déviation puis critique ennemi',async()=>{
 const c=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','rules','combat.js')).href);
 const seq=v=>{let i=0;return()=>v[i++]};const st={defense:0,resist:0,guard:0,dodge:30};
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.9,0.9]),0.1),{damage:100,deflected:false,crit:false});
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.1,0.9]),0.1),{damage:50,deflected:true,crit:false});
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.9,0.05]),0.1),{damage:150,deflected:false,crit:true});
 assert.equal(c.mitigateIncoming(100,st,1,seq([0.9,0.05]),0.1,0.8).damage,140,'critique réduit');
 // Défense : 82 points contre un attaquant de niveau 1 (60 + 22) = moitié des dégâts ; moins efficace contre plus fort.
 assert.equal(c.mitigateIncoming(100,{...st,defense:82},1,seq([0.9,0.9]),0).damage,50);
 assert.ok(c.mitigateIncoming(100,{...st,defense:82},40,seq([0.9,0.9]),0).damage>50);
 assert.equal(c.mitigateIncoming(100,{...st,resist:20},1,seq([0.9,0.9]),0).damage,80);
 assert.equal(c.mitigateIncoming(100,{...st,guard:10},1,seq([0.9,0.9]),0).damage,90);
 assert.equal(c.mitigateIncoming(0.2,{...st,defense:1e6},60,seq([0.9,0.9]),0).damage,1);
 assert.deepEqual([c.enemyCritChance({worldBoss:true}),c.enemyCritChance({boss:true}),c.enemyCritChance({})],[0.13,0.1,0.04]);
});

test('Règle partagée des coups infligés : Puissance, écart de niveau, armure des élites et boss, critique ; puissance d’attaque',async()=>{
 const c=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','rules','combat.js')).href);
 const st={level:10,crit:10,critPower:50,damageBonus:0};
 // Monstre ordinaire de même niveau : 5 % d'armure ; critique +50 %, modificateur du critique ×1,12.
 assert.deepEqual(c.resolveOutgoing(100,st,{level:10},()=>0.99),{damage:95,crit:false});
 assert.deepEqual(c.resolveOutgoing(100,st,{level:10},()=>0),{damage:Math.round(95*1.5),crit:true});
 assert.equal(c.resolveOutgoing(100,st,{level:10},()=>0,1,1.12).damage,Math.round(95*1.5*1.12));
 // Puissance : +20 % de tous les dégâts. Monstre 10 niveaux au-dessus : moitié des dégâts.
 assert.equal(c.resolveOutgoing(100,{...st,damageBonus:20},{level:10},()=>0.99).damage,114);
 assert.equal(c.resolveOutgoing(100,st,{level:20},()=>0.99).damage,48);
 // Boss de monde : 15 % d'armure, réduite par un modificateur d'armure.
 assert.equal(c.resolveOutgoing(100,st,{level:10,worldBoss:true},()=>0.99).damage,85);
 assert.equal(c.resolveOutgoing(100,st,{level:10,worldBoss:true},()=>0.99,0.92).damage,86);
 assert.equal(c.heroPower(18),23);assert.equal(c.heroPower(100),105);assert.equal(c.heroMagicPower(18),23);assert.equal(c.heroMagicPower(100),c.heroPower(100));assert.equal(c.heroPower(0),8);
 // Corps touchable : la tête d'un boss de monde compte, pas seulement ses pieds.
 const boss={x:0,y:0,r:29,worldBoss:true};
 assert.ok(c.canaanBodyGap(boss,0,-120)<0);assert.ok(c.canaanBodyGap(boss,0,-60)<0);
 assert.ok(c.canaanBodyGap(boss,0,80)>20);assert.equal(c.canaanBodyPoints({x:0,y:0,r:16}).length,5);
});

test('Compétences : attaques de base renforcées, info-bulles claires, badges et postures utiles',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;toast=()=>{};game.view.chat=()=>{};Math.random=()=>0.5');
 const gear='{'+['helm','shoulders','armor','gloves','boots','neck','ring'].map(k=>k+':{id:"g'+k+'",slot:"'+k+'",level:30,rarity:"Rare",sec:{power:1,crit:1}}').join(',')+'}';
 run('game.hero.level=30;game.hero.equipment={...game.hero.equipment,...'+gear+'};CANAAN_CLASS_STATE.import({id:"paladin",talents:[]});equipment.weapon.sec={power:1,crit:1};recomputeStats();refreshWeaponBar()');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BASIC_ATTACK.spec)')),{quick:{mult:0.75,lock:0.55},heavy:{mult:1.6,lock:1.15}});
 // Les bâtons ont la même puissance que les autres armes (plus d'Intelligence).
 assert.equal(run('CANAAN_SKILLS.power(game.hero,true)'),run('CANAAN_SKILLS.power(game.hero,false)'));
 // Info-bulle : explication, dégâts estimés avec la puissance actuelle, recharge, ressource, effet de classe.
 const tip=run('canaanSkillTooltip(0)'),power=run('CANAAN_SKILLS.power(game.hero,false)');
 assert.ok(tip.includes('dégâts sacrés égaux à 280 % de ta Puissance')&&tip.includes('≈ '+Math.round(power*2.8)+' dégâts')&&tip.includes('Recharge 5 s')&&tip.includes('Ferveur 24'),tip);
 assert.ok(tip.includes('Paladin'),'empreinte de la classe');
 for(const [id,word] of [['druide','empoisonne'],['assassin','+12 %'],['elementaliste','brûle'],['chasseur','distance'],['guerrier','Élan']]){
  run('CANAAN_CLASS_STATE.import({id:"'+id+'",talents:[]});refreshWeaponBar()');assert.ok(run('canaanSkillTooltip(0)').includes(word),id);
 }
 assert.ok(run('canaanSkillTooltip("special")').includes('Volonté de fer'));
 assert.ok(run('SKILLS.every(s=>s.el.dataset.tooltipSkill!==undefined)'),'survol des cases');
 // Chaque catalogue de compétence indique le rôle, la puissance et une visée indépendante de la souris.
 assert.ok(run('Object.values(WEAPON_DEFINITIONS).every(w=>w.role&&w.sp.every(s=>s.length===7&&typeof s[5]==="number"&&s[6].length>20&&!/souris/i.test(s[2]+s[6])))'));
 // Druide : le Rugissement sauvage rend les attaques de base vraiment plus rapides, et son badge compte les secondes.
 run('CANAAN_CLASS_STATE.import({id:"druide",talents:[]});P.mp=P.mmp;CANAAN_CLASS.special();refreshWeaponBar();mouseWorldX=P.x+100;mouseWorldY=P.y');
 run('for(let i=0;i<120;i++){time++;simulateStep()}canaanBasicAttack(false)');const slow=run('CANAAN_BASIC_ATTACK.lock()');
 run('for(const k in weaponCooldowns)weaponCooldowns[k]=0;P.mp=P.mmp;useSkill(2)');
 run('canaanUpdateSkillBadges()');assert.equal(run('SKILLS[2].el.querySelector(".skill-badge").textContent'),'6 s');
 run('for(let i=0;i<70;i++){time++;simulateStep()}canaanBasicAttack(false)');
 assert.ok(Math.abs(run('CANAAN_BASIC_ATTACK.lock()')/slow-0.7)<1e-9,'verrou ×0,7 pendant le Rugissement');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Armes en main et icônes : plus de cercle à 360°, arme tenue et animée pour chaque classe, félin qui griffe, icônes SVG des sorts',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Le cercle autour du héros à chaque attaque n'existe plus.
 assert.doesNotMatch(script('canaan-game-core'),/ctx\.arc\(P\.x, P\.y, 65/);
 // Icônes : une par compétence (les neuf armes de classe et les griffes du félin × 4) et par sort de classe, en SVG.
 const audit=JSON.parse(run('JSON.stringify(CANAAN_SKILL_ICONS.audit())'));
 assert.equal(audit.weapons,10);assert.deepEqual(audit.missing,[]);assert.deepEqual(audit.specials.sort(),['avatar','contagion','divine','feral','hawkeye','hymn','ironwill','rage','veil']);
 assert.equal(run('Object.keys(WEAPON_DEFINITIONS).every(t=>[0,1,2,3].every(i=>CANAAN_SKILL_ICONS.weapon(t,i).startsWith("<svg")))'),true);
 assert.equal(run('CLASSES.every(c=>CANAAN_SKILL_ICONS.special(c.special.id).startsWith("<svg"))'),true);
 run('started=true;paused=false;CANAAN_CLASS_STATE.import({id:"guerrier",talents:[]});refreshWeaponBar()');assert.ok(run('SKILLS[0].el.innerHTML').startsWith('<svg'),'la barre affiche l’icône SVG');
 // Arme tenue : chaque famille se dessine au repos et à chaque instant de son attaque, derrière ou devant le corps.
 run('globalThis.__drawn=0;const c=new Proxy({},{get:(o,k)=>k==="drawImage"?()=>__drawn++:k==="createRadialGradient"?()=>({addColorStop(){}}):()=>{} ,set:()=>true});globalThis.__c=c');
 for(const type of JSON.parse(run('JSON.stringify(Object.keys(WEAPON_DEFINITIONS).filter(t=>!WEAPON_DEFINITIONS[t].form))'))){
  run('game.hero.equipment.weapon={id:"w",slot:"weapon",level:1,weaponType:"'+type+'"};__drawn=0;P.atk=0;for(const l of ["back","front"])CANAAN_WEAPON_LOOK.draw(__c,game.hero,P,P.x,P.y,l)');
  assert.ok(run('__drawn')>=1,type+' au repos');
  for(const atk of [0.28,0.2,0.1,0.02]){run('__drawn=0;P.atk='+atk+';for(const l of ["back","front"])CANAAN_WEAPON_LOOK.draw(__c,game.hero,P,P.x,P.y,l)');assert.ok(run('__drawn')>=1,type+' en attaque '+atk)}
 }
 run('P.atk=0');
 // Félin : il bondit vers sa mire et ses griffes lacèrent pendant l'attaque.
 run('P.form="feral";P.atk=0.28;CANAAN_WEAPON_LOOK.draw(__c,game.hero,P,P.x,P.y,"front")');
 assert.ok(Math.hypot(...Object.values(JSON.parse(run('JSON.stringify(CANAAN_WEAPON_LOOK.lunge(game.hero,{...P,atk:0.15,_atkPeak:0.28,_atkSeen:0.15}))'))))>0,'bond en avant');
 run('P.form=null;P.atk=0');
 // Le héros se tourne vers sa mire : à droite, à gauche, vers le haut, vers le bas.
 assert.deepEqual([0,Math.PI,-Math.PI/2,Math.PI/2].map(a=>run('CANAAN_WEAPON_LOOK.faceFromAim('+a+')')),[1,3,2,0]);
 // Projectiles : flèche lourde qui traverse pour le Tir perçant ; chaque forme se dessine.
 run('CANAAN_CLASS_STATE.import({id:"chasseur",talents:[]});refreshWeaponBar();P.mp=P.mmp;mouseWorldX=P.x+200;mouseWorldY=P.y;game.world.projectiles.length=0;useSkill(0)');
 assert.equal(run('game.world.projectiles.at(-1).kind'),'heavyArrow');assert.equal(run('game.world.projectiles.at(-1).pierce'),true);
 run('canaanDrawProjectile(ctx,game.world.projectiles.at(-1));canaanDrawProjectile(ctx,{x:0,y:0,vx:1,vy:0,c:"#fff",kind:"orb"})');
 for(const kind of ['comet','plague','note','fireball','ember','thorn','dagger','arrow'])run('canaanDrawProjectile(ctx,{x:0,y:0,vx:1,vy:0,c:"#fff",kind:"'+kind+'"})');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Attaque lourde : une animation propre à chaque arme, et les armes à distance frappent de loin',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=1000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;CANAAN_ARTEFACTS_STATE.import({})');
 const equip=type=>run('equipment.weapon={id:"w",slot:"weapon",level:1,weaponType:"'+type+'",rarity:"Commun",sec:{power:1,crit:1}};refreshWeaponBar();game.world.projectiles.length=0;monsters.length=0');
 const wait=n=>run('for(let i=0;i<'+n+';i++){time++;runUpdatePipeline()}');
 // Arc : la rapide tire une flèche, la lourde une rafale de cinq flèches coup sur coup.
 equip('bow');run('mouseWorldX=P.x+300;mouseWorldY=P.y');
 assert.equal(run('canaanBasicAttack(false)'),true);assert.equal(run('game.world.projectiles.length'),1);
 wait(80);run('game.world.projectiles.length=0');
 assert.equal(run('canaanBasicAttack(true)'),true);assert.equal(run('game.world.projectiles.length'),1);
 wait(20);assert.equal(run('game.world.projectiles.filter(p=>p.kind==="arrow").length'),5);
 // Portée : une flèche rapide atteint un monstre à 800 px.
 wait(120);run('game.world.projectiles.length=0;monsters.push({x:P.x+800,y:P.y,hp:1e6,mhp:1e6,r:14,t:"Cible"});mouseWorldX=P.x+800');
 run('canaanBasicAttack(false)');wait(70);assert.ok(run('monsters[0].hp')<1e6,'flèche à 800 px');
 // Bâton élémentaire : la lourde est une boule de feu qui explose à l'impact et touche aussi le voisin.
 equip('staff');wait(120);
 run('monsters.push({x:P.x+300,y:P.y,hp:1e6,mhp:1e6,r:14,t:"Cible"},{x:P.x+340,y:P.y+30,hp:1e6,mhp:1e6,r:14,t:"Voisin"});mouseWorldX=P.x+300;mouseWorldY=P.y');
 run('canaanBasicAttack(true)');assert.equal(run('game.world.projectiles[0].kind'),'fireball');
 wait(60);assert.ok(run('monsters[0].hp')<1e6&&run('monsters[1].hp')<1e6,'explosion de la comète');
 // Grimoire : rafale de peste en cinq crachats.
 equip('grimoire');wait(120);run('mouseWorldX=P.x+300;mouseWorldY=P.y;canaanBasicAttack(true)');wait(20);
 assert.equal(run('game.world.projectiles.filter(p=>p.kind==="plague").length'),5);
 // Mêlée : chaque arme lourde dessine sa forme (croix, fracas, percée), sans erreur.
 for(const type of ['aegis','wildstaff','dualsword','dualdagger','lute','greataxe']){equip(type);wait(120);run('canaanBasicAttack(true)');wait(30)}
 run('CanaanStages.drawWeaponEffects()');
 assert.equal(errors.length,0,errors.join('\n'));
});
