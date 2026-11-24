const { test } = require('node:test');
const {
  assert,
  game,
  mob,
  predictable,
  same,
  skillHit,
  basicHit
} = require('./helpers/context.cjs');

test('Classes : neuf classes de dix talents, chacune son arme, cinq emplacements selon le niveau, état vérifié',()=>{
  const g=game();
  assert.equal(g.CLASSES.length,9);
  same(g.CLASSES.map(c=>c.name),['Druide','Paladin','Assassin','Élémentaliste','Invocateur','Barde','Berserker','Chasseur','Guerrier']);
  for(const c of g.CLASSES){
    assert.equal(c.talents.length,10,c.id);assert.ok(c.special.name&&c.passive.name,c.id);
    // Chaque classe a son arme, liée à elle, avec quatre compétences et deux secondaires fixes.
    const w=g.WEAPON_DEFINITIONS[c.weapon];assert.ok(w,c.id);assert.equal(w.bound,c.id);assert.equal(w.sp.length,4);
    assert.equal(c.weaponStats.length,2);
  }
  same(g.CLASSES.filter(c=>c.relic).map(c=>c.id),['invocateur','berserker'],'seuls le Grimoire et la Grande hache sont des Reliques');
  assert.equal(g.WEAPON_DEFINITIONS.feline.form,true,'les griffes du félin sont une forme, pas un objet');
  assert.equal(g.CRAFT_WEAPONS.length,0,'plus aucune arme au butin ni chez les marchands');
  same([1,9,10,19,20,30,40,60].map(g.talentSlotsAt),[1,1,2,2,3,4,5,5]);
  // Classe inconnue, doublons, numéros invalides et emplacements en trop sont retirés.
  g.CANAAN_CLASS_STATE.import({id:'druide',talents:[0,0,1,2,99,-1,'3',3,4,5,6]});
  same(g.CANAAN_CLASS.audit().talents,[0,1],'niveau 10 : deux emplacements');
  g.game.hero.level=60;g.CANAAN_CLASS_STATE.import({id:'druide',talents:[0,0,1,2,99,3,4,5]});
  same(g.CANAAN_CLASS.audit().talents,[0,1,2,3,4]);
  g.CANAAN_CLASS_STATE.import({id:'necromancien',talents:[0]});assert.equal(g.CANAAN_CLASS.audit().id,null);
  same(g.CANAAN_CLASS_STATE.export(),{id:null,talents:[]});
  // Les choix de la version à huit sorts sont ignorés au chargement de la sauvegarde.
  g.CANAAN_CLASS_STATE.import({id:'paladin',talents:[],spells:{aegis:[7,0,null,5]}});
  g.refreshWeaponBar();
  same(g.CANAAN_CLASS_STATE.export(),{id:'paladin',talents:[]});
  same(g.SKILLS.map(s=>s.n),['Frappe du croisé','Sceau de lumière','Rempart sacré','Marteau du Jugement']);
  // Équiper : dans la limite des emplacements, jamais deux fois, jamais en combat.
  g.game.hero.level=10;g.CANAAN_CLASS_STATE.import({id:'guerrier',talents:[]});
  assert.equal(g.CANAAN_CLASS.equip(1),true);assert.equal(g.CANAAN_CLASS.equip(1),false);
  assert.equal(g.CANAAN_CLASS.equip(6),true);assert.equal(g.CANAAN_CLASS.equip(7),false,'deux emplacements au niveau 10');
  assert.equal(g.CANAAN_CLASS.unequip(1),true);
  g.hit(mob(1000),1);assert.equal(g.CANAAN_CLASS.equip(7),false,'en combat');assert.equal(g.CANAAN_CLASS.unequip(6),false);
  g.advance(301);assert.equal(g.CANAAN_CLASS.equip(7),true);
  same(g.CANAAN_CLASS_STATE.export(),{id:'guerrier',talents:[6,7]});
  // Compétences offensives et utilitaires, éléments.
  assert.equal(g.isOffensiveSkill('wildstaff',1),false);assert.equal(g.isOffensiveSkill('wildstaff',0),true);
  assert.equal(g.isOffensiveSkill('aegis',1),false);assert.equal(g.isOffensiveSkill('aegis',2),false);
  assert.equal(g.isOffensiveSkill('bow',1),false);
  assert.equal(g.isOffensiveSkill('feline',2),false);assert.equal(g.isOffensiveSkill('dualsword',2),true);
  same([0,1,2,3].map(i=>g.skillElement('elementaliste',i)),['fire','ice','lightning','fire']);
  assert.equal(g.skillElement('chasseur',0),'wild');assert.equal(g.skillElement('guerrier',3),'steel');
  assert.equal(g.skillElement(null,0),null);
  const cast=g.CANAAN_CLASS_CAST('dualsword',0);assert.equal(cast.element,'steel');assert.equal(cast.offensive,true);
  assert.equal(cast.weapon,'dualsword');
});

test('Arme de classe : donnée avec la classe, au niveau du héros, Commun puis Peu commun au niveau 10, Relique pour deux classes',()=>{
  const g=game();
  g.game.hero.level=5;g.CANAAN_CLASS_STATE.import({id:'chasseur',talents:[]});
  let w=g.equipment.weapon;assert.equal(w.weaponType,'bow');assert.equal(w.bound,'chasseur');assert.equal(w.rarity,'Commun');
  assert.equal(w.level,5);assert.equal(w.name,'Arc de chasse');same(Object.keys(w.sec),['crit','mastery']);
  g.game.hero.level=12;g.CANAAN_SUMMONS.syncPact(g.game.hero);w=g.equipment.weapon;
  assert.equal(w.rarity,'Peu commun','Peu commun d’office au niveau 10');assert.equal(w.name,'Arc du pisteur');
  // Qualité gagnée avec les essences : gardée par classe.
  g.game.hero.weaponTiers={chasseur:3};g.CANAAN_SUMMONS.syncPact(g.game.hero);assert.equal(g.equipment.weapon.rarity,'Épique');
  g.CANAAN_CLASS_STATE.import({id:'invocateur',talents:[]});
  assert.equal(g.equipment.weapon.weaponType,'grimoire');assert.equal(g.equipment.weapon.rarity,'Relique');
  g.CANAAN_CLASS_STATE.import({id:'chasseur',talents:[]});assert.equal(g.equipment.weapon.rarity,'Épique','la qualité est gardée');
  // Une ancienne arme (sac, réserve, main) est rendue en or, une seule fois.
  g.game.hero.player.gold=0;g.inventory.push({id:'old',slot:'weapon',weaponType:'sword',level:20,rarity:'Rare'});
  g.equipment.weapon2={id:'old2',slot:'weapon',weaponType:'axe',level:20,rarity:'Commun'};
  g.CANAAN_SUMMONS.syncPact(g.game.hero);
  assert.equal(g.inventory.filter(it=>it.slot==='weapon').length,0);assert.equal(g.equipment.weapon2,undefined);
  assert.equal(g.equipment.weapon.bound,'chasseur');
});

test('Montée en qualité : essences des boss, niveau, or, et chaque marche jusqu’au Mythique',()=>{
  const g=game();g.game.hero.level=20;g.CANAAN_CLASS_STATE.import({id:'guerrier',talents:[]});
  const W=g.CANAAN_CLASS_WEAPON,hero=g.game.hero;hero.player.gold=0;
  let st=W.status(hero);assert.equal(st.tier,1);assert.equal(st.next.tier,2);assert.equal(st.next.essence,'shard');
  assert.equal(W.upgrade(hero),false,'il manque les éclats et l’or');
  W.grant(hero,{shard:8});hero.player.gold=400;
  assert.equal(W.upgrade(hero),true);assert.equal(g.equipment.weapon.rarity,'Rare');same(W.essences(hero),{});
  assert.equal(hero.player.gold,0);
  // Épique : niveau 40 et 10 sceaux ; Légendaire et Mythique : fragments d'Aurore, niveaux 58 et 60.
  W.grant(hero,{seal:10});hero.player.gold=1500;assert.equal(W.upgrade(hero),false,'niveau 40 requis');
  hero.level=40;assert.equal(W.upgrade(hero),true);assert.equal(g.equipment.weapon.rarity,'Épique');
  hero.level=60;W.grant(hero,{aurora:35});hero.player.gold=14000;
  assert.equal(W.upgrade(hero),true);assert.equal(W.upgrade(hero),true);assert.equal(g.equipment.weapon.rarity,'Mythique');
  assert.equal(W.status(hero).next,null);assert.equal(W.upgrade(hero),false);
  // Sauvegarde : rangs et essences nettoyés.
  same(W.export(hero),{tiers:{guerrier:5},essences:{}});
  W.import(hero,{tiers:{guerrier:9,invocateur:3,inconnu:2},essences:{shard:-4,seal:2.7,aurora:'x'}});
  same(W.export(hero),{tiers:{guerrier:5},essences:{seal:2}});
  // Les Reliques ne montent pas de qualité.
  g.CANAAN_CLASS_STATE.import({id:'berserker',talents:[]});assert.equal(W.status(hero).relic,true);assert.equal(W.upgrade(hero),false);
});

test('Druide : Sève vitale, forme féline (F) avec ses quatre compétences, Instinct du fauve et Équilibre sauvage',()=>{
  const g=game();g.setClass('druide',[]);predictable(g,.99);g.P.hp=20;g.P.mhp=1000;
  // Sève vitale : une compétence offensive rend 5 % des dégâts et empoisonne (25 % sur 4 s).
  const m=mob(1e6);g.CANAAN_COMBAT.attack(m,100,skillHit('nature'));const dealt=1e6-m.hp;
  assert.ok(Math.abs(g.P.hp-20-dealt*.05)<1);assert.ok(Math.abs(m._clsDots.find(d=>d.kind==='sap').dps-dealt*.25/4)<1e-9);
  // Forme féline : la barre passe du bâton aux griffes.
  g.P.mp=1000;const base=g.characterStats();assert.equal(g.currentWeaponType(),'wildstaff');
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,'feral');assert.equal(g.currentWeaponType(),'feline');
  same(g.SKILLS.map(s=>s.n),['Lacération','Bond du prédateur','Rugissement sauvage','Morsure féroce']);
  const feral=g.characterStats();assert.equal(feral.speed,base.speed+20);assert.equal(feral.crit,base.crit+8);
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(),.8);assert.equal(g.canaanApplyHeal(100),70,'soins −30 %');
  // En forme féline, les critiques font saigner au lieu de soigner.
  predictable(g,0);const hp=g.P.hp,t=mob(1e6);g.CANAAN_COMBAT.attack(t,100,skillHit('nature'));
  assert.equal(g.P.hp,hp);assert.ok(t._clsDots.some(d=>d.kind==='bleed'));
  // Rugissement sauvage : 8 % des PV et attaques de base plus rapides.
  g.P.hp=100;g.useSkill(2);assert.equal(g.P.hp,212,'8 % du Rugissement et 8 % de l’utilitaire du Druide, −30 % en forme féline');assert.equal(g.CANAAN_SKILLS.state(g.game.hero).roar,6);
  g.advance(91);assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,null);assert.equal(g.currentWeaponType(),'wildstaff');
  // Instinct du fauve : gratuit, 0,5 s de recharge, compétence féline suivante critique.
  const i=game();i.setClass('druide',[4]);i.P.mp=0;assert.equal(i.CANAAN_CLASS.special(),true);
  assert.equal(i.CANAAN_CLASS_CAST('feline',0).forceCrit,true);assert.equal(i.CANAAN_CLASS_CAST('feline',0).forceCrit,undefined);
  i.advance(31);assert.equal(i.CANAAN_CLASS.special(),true,'recharge de 0,5 s');
  // Équilibre sauvage : 3 compétences de nature, puis la forme féline donne +25 % pendant 8 s.
  const b=game();b.setClass('druide',[9]);b.P.mp=1000;for(let k=0;k<3;k++)b.CANAAN_CLASS_CAST('wildstaff',0);
  b.CANAAN_CLASS.special();assert.ok(Math.abs(b.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-115*1.25)<1e-6);
  // Écorce de fer se déclenche sur Floraison même à pleine vie.
  const e=game();e.setClass('druide',[8]);e.P.mhp=100;e.P.hp=30;e.advance(1);
  assert.equal(e.CANAAN_CLASS.audit().shield,0);
  e.P.hp=100;e.P.mp=100;e.useSkill(1);
  assert.equal(e.CANAAN_CLASS.audit().shield,20);const foe=mob(1e6);e.CANAAN_CLASS_DEFENSE(foe,10);assert.ok(foe.hp<1e6);
  e.weaponCooldowns['wildstaff:1']=0;e.useSkill(1);
  assert.equal(e.CANAAN_CLASS.audit().shield,10,'la recharge du talent est indépendante de Floraison');
});

test('Paladin : Frappe du croisé et Croisade, Rempart sacré, Ferveur ardente et Intervention divine',()=>{
  const g=game();g.setClass('paladin',[0]);predictable(g,.99);g.P.mp=100;g.P.hp=10;g.P.mhp=1000;
  const m=mob(1e6);g.monsters=[m];
  // Frappe du croisé : cône de masse, 3 % des PV max rendus (6 % à la troisième en 10 s, avec une onde).
  g.useSkill(0);assert.ok(m.hp<1e6);assert.equal(g.P.hp,40);
  g.weaponCooldowns['aegis:0']=0;g.useSkill(0);g.weaponCooldowns['aegis:0']=0;const before=g.P.hp;g.useSkill(0);
  assert.equal(g.P.hp-before,60,'Croisade : 6 %');
  // Rempart sacré : −35 % de dégâts reçus, bouclier de 12 % au groupe.
  g.P.mp=100;g.useSkill(2);assert.equal(g.CANAAN_SKILLS.state(g.game.hero).shieldGuard,6);
  assert.equal(g.CANAAN_WEAPON_DEFENSE(mob(1),100),65);
  // Sentence renforce l'impact du Marteau pendant le Rempart, même contre un boss à pleine vie.
  const hammerImpact=guarding=>{
    const p=game();p.setClass('paladin',[3]);predictable(p,.99);p.P.mp=100;
    const boss={...mob(1e6),boss:true};p.monsters=[boss];
    if(guarding)p.useSkill(2);
    p.useSkill(3);p.advance(22);
    return boss.mhp-boss.hp;
  };
  const impact=hammerImpact(false);
  assert.ok(impact>0 && Math.abs(hammerImpact(true)/impact-1.6)<.03);
  // Ferveur ardente : chaque coup reçu donne 4 de plus ; à 100, Exaltation (moitié prix, +15 %).
  const z=game();z.setClass('paladin',[5]);z.P.mp=0;z.P.mmp=100;z.P.mhp=1000;z.CANAAN_CLASS_DEFENSE(mob(1),1);
  assert.ok(Math.abs(z.P.mp-7.15)<1e-9,'3 + 0,15 + 4');z.P.mp=100;z.advance(1);
  assert.equal(z.CANAAN_CLASS_MANA_COST('aegis',0,12),12);assert.ok(Math.abs(z.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-115)<1e-9);
  // Intervention divine : un coup fatal laisse 1 PV, 3 s d'invulnérabilité et un bouclier de 25 %, une fois par combat.
  const d=game();d.setClass('paladin',[9]);d.P.mhp=100;d.P.hp=10;assert.equal(d.CANAAN_COMBAT.hurt(500,mob(10)),9);assert.equal(d.P.hp,1);
  assert.equal(d.CANAAN_CLASS.audit().shield,25);assert.equal(d.CANAAN_CLASS_DEFENSE(mob(10),30),0,'invulnérable');
  assert.equal(d.CANAAN_COMBAT.hurt(500,mob(10)),0,'pendant l’invulnérabilité');
  d.advance(181);d.P.hp=10;d.CANAAN_COMBAT.hurt(500,mob(10));assert.equal(d.P.hp,1,'hors combat, elle revient pour le combat suivant');
  // Lumière divine (F) : 20 % des PV max et −20 % de dégâts pendant 6 s.
  const l=game();l.setClass('paladin',[]);l.P.mp=100;l.P.hp=10;l.P.mhp=100;const g0=l.characterStats().guard;
  assert.equal(l.CANAAN_CLASS.special(),true);assert.equal(l.P.hp,30);assert.equal(l.P.mp,50,'Ferveur : le double du prix en mana');
  assert.equal(l.characterStats().guard,g0+20);
});

test('Rempart tournoyant : six pulsations mobiles qui frappent tout autour du Paladin',()=>{
  const g=game();g.setClass('paladin',[6]);predictable(g,.99);g.P.mp=100;
  const front=mob(1e6),back=mob(1e6),dest=mob(1e6);
  front.x=100;back.x=-100;dest.x=450;g.monsters=[front,back,dest];
  g.useSkill(2);
  assert.equal(g.CANAAN_CLASS.runtime(g.game.hero).shieldOrbitUntil,6);
  assert.equal(g.CANAAN_WEAPON_DEFENSE(front,100),65,'la protection de Rempart sacré reste active');
  assert.match(g.canaanSkillTooltip(2),/Rempart tournoyant.*90 %/);
  g.advance(2);
  const pulse=1e6-front.hp;
  assert.ok(pulse>0);
  assert.equal(back.hp,front.hp,'la pulsation frappe devant et derrière');
  assert.equal(dest.hp,1e6,'hors du rayon');
  g.P.x=450;g.advance(360);
  assert.equal(front.hp,1e6-pulse,'le tourbillon suit le Paladin');
  assert.equal(dest.hp,1e6-pulse*5,'cinq autres pulsations, pas d’impact supplémentaire par bouclier');
  g.advance(90);assert.equal(dest.hp,1e6-pulse*5,'terminé');
});

test('Paladin : dix coups sur le Sceau de lumière soignent dix fois, pendant 6 s',()=>{
  const g=game();g.setClass('paladin',[]);predictable(g,.99);
  g.P.mhp=1000;g.P.hp=100;g.P.mp=100;
  const foe={...mob(1e7),boss:true},other=mob(1e7);
  foe.x=8*g.TS;g.monsters=[foe];g.mouseWorldX=foe.x;
  g.useSkill(1);
  assert.equal(g.P.mp,100,'pas de coût si aucune cible n’est à portée');
  assert.equal(g.weaponCooldowns['aegis:1'],undefined);
  foe.x=100;other.x=60;g.monsters=[other,foe];g.mouseWorldX=100;
  g.useSkill(1);
  assert.equal(foe.hp,foe.mhp,'la pose du sceau ne frappe pas');
  assert.equal(g.CANAAN_CLASS.holySealTargets().has(foe),true);
  assert.equal(g.CANAAN_CLASS.holySealTargets().has(other),false,'privilégie le point visé');
  assert.equal(g.CANAAN_ARTEFACTS.inCombat(),true);
  g.CANAAN_COMBAT.attack(other,100,basicHit);
  const holy=skillHit('holy');
  g.CANAAN_COMBAT.attack(foe,100,{...holy,periodic:true});
  foe.bossShield=true;g.CANAAN_COMBAT.attack(foe,100,holy);foe.bossShield=false;
  assert.equal(g.P.hp,100,'les autres cibles, dégâts périodiques et coups immunisés ne soignent pas');
  for(let i=0;i<10;i++)g.CANAAN_COMBAT.attack(foe,100,i%2===0?basicHit:holy);
  assert.equal(g.P.hp,400,'30 PV par coup, même quand plusieurs coups arrivent en même temps');
  g.advance(360);
  assert.equal(g.CANAAN_CLASS.holySealTargets().size,0);
  g.CANAAN_COMBAT.attack(foe,100,basicHit);
  assert.equal(g.P.hp,400,'aucun soin après expiration');
  // Sceau rayonnant : le troisième coup déclenche une onde, sans soin supplémentaire.
  g.setClass('paladin',[2]);g.P.mp=100;g.weaponCooldowns['aegis:1']=0;g.useSkill(1);
  const nearby=other.hp;
  for(let i=0;i<3;i++)g.CANAAN_COMBAT.attack(foe,100,basicHit);
  assert.ok(other.hp<nearby);
  assert.equal(g.P.hp,490);
});

test('Assassin : Précision mortelle, Lames déchirantes, Hémorragie, Ombre meurtrière, Pas de l’ombre et Voile d’ombre',()=>{
  const g=game();g.setClass('assassin',[]);const base={...g.characterStats(),crit:g.characterStats().crit,critPower:g.characterStats().critPower-10,speed:g.characterStats().speed-5};g.setClass('assassin',[5,4,3,9]);
  const st=g.characterStats();assert.equal(st.crit,base.crit+10);assert.equal(st.critPower,base.critPower+30);assert.equal(st.speed,base.speed+5);
  const full=mob(100),offense=skillHit('shadow');
  const normal=g.CANAAN_CLASS_ATTACK.before(full,100,offense).damage;
  full.v1746_bleed=4;
  assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(full,100,offense).damage-normal*1.25)<1e-9);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(full,100,basicHit).damage,100);
  // Hémorragie : un critique fait saigner (35 % du coup sur 4 s).
  predictable(g,0);const t=mob(1e6);g.CANAAN_COMBAT.attack(t,100,basicHit);
  assert.ok(Math.abs(t._clsDots.find(d=>d.kind==='bleed').dps-(1e6-t.hp)*.35/4)<1e-9);
  // Ombre meurtrière : après 3 critiques, la prochaine compétence offensive fait +40 % et ne coûte rien.
  g.CANAAN_COMBAT.attack(t,1,basicHit);g.CANAAN_COMBAT.attack(t,1,basicHit);
  assert.equal(g.CANAAN_CLASS_MANA_COST('dualdagger',0,11),0);
  assert.equal(g.CANAAN_CLASS_CAST('dualdagger',1).multiplier,1,'une utilitaire ne consomme rien');
  assert.ok(Math.abs(g.CANAAN_CLASS_CAST('dualdagger',0).multiplier-1.4)<1e-9,'Ombre meurtrière');
  // Pas de l'ombre : dans le dos de la cible la plus proche de la souris, prochain coup +60 % et critique.
  const s=game();s.setClass('assassin',[]);s.P.mp=100;const prey=mob(1e6);prey.x=150;s.monsters=[prey];
  s.mouseWorldX=150;s.mouseWorldY=0;s.useSkill(1);assert.ok(s.P.x>150,'derrière la cible');
  assert.equal(s.CANAAN_SKILLS.state(s.game.hero).shadow,4);
  // Voile d'ombre : invisible 4 s, +30 % de vitesse ; la prochaine compétence offensive fait +40 % et le lève.
  const h=game();h.setClass('assassin',[]);h.P.mp=100;const speed=h.characterStats().speed;
  assert.equal(h.CANAAN_CLASS.special(),true);assert.equal(h.P.veiled,true);assert.equal(h.characterStats().speed,speed+30);
  assert.ok(Math.abs(h.CANAAN_CLASS_CAST('dualdagger',0).multiplier-1.4)<1e-9);assert.equal(h.P.veiled,false);
});

test('Élémentaliste : feu, glace, Éclats de glace, Électricité statique, Fusion élémentaire et Barrière de givre',()=>{
  const g=game();g.setClass('elementaliste',[3]);predictable(g,.99);
  // Glace : ralentit de 30 % pendant 2,5 s ; Éclats de glace : le feu sur une cible gelée fait +50 % et brise.
  const m=mob(1e6),near=mob(1e6);near.x=80;g.monsters=[m,near];g.CANAAN_COMBAT.attack(m,100,skillHit('ice'));
  assert.equal(m._clsSlow.pct,.3);assert.equal(m._clsSlow.element,'ice');
  assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(m,100,{element:'fire'}).damage-150)<1e-9);
  g.CANAAN_COMBAT.attack(m,100,skillHit('fire'));assert.ok(near.hp<1e6,'les éclats frappent autour');
  assert.ok(m._clsDots.some(d=>d.kind==='burn'),'le feu brûle');
  // Électricité statique : le cinquième coup de foudre appelle la foudre céleste.
  const s=game();s.setClass('elementaliste',[5]);predictable(s,.99);const t=mob(1e7);s.monsters=[t];
  for(let k=0;k<4;k++)s.CANAAN_COMBAT.attack(t,1,skillHit('lightning'));const hp=t.hp;
  s.CANAAN_COMBAT.attack(t,1,skillHit('lightning'));assert.ok(hp-t.hp>s.characterStats().attack*2,'foudre céleste');
  // Fusion élémentaire : feu, glace, foudre en 8 s, puis une compétence gratuite à +50 %.
  const f=game();f.setClass('elementaliste',[6]);f.CANAAN_CLASS_CAST('staff',0);f.CANAAN_CLASS_CAST('staff',1);
  assert.ok(f.CANAAN_CLASS_MANA_COST('staff',2,16)>0);f.CANAAN_CLASS_CAST('staff',2);
  assert.equal(f.CANAAN_CLASS_MANA_COST('staff',3,28),0);assert.ok(Math.abs(f.CANAAN_CLASS_CAST('staff',3).multiplier-1.5)<1e-9);
  // Barrière de givre : la Nova protège à pleine vie et renforce uniquement le prochain sort de feu.
  const b=game();b.setClass('elementaliste',[7]);const foe=mob(1e6);foe.x=60;b.monsters=[foe];b.P.hp=b.P.mhp=100;b.P.mp=100;
  b.useSkill(1);
  assert.equal(b.CANAAN_CLASS.audit().shield,20);assert.ok(foe.spell_stun>0,'gelé');
  assert.equal(b.CANAAN_CLASS_CAST('staff',2).multiplier,1,'la foudre ne consomme pas le bonus');
  assert.equal(b.CANAAN_CLASS_CAST('staff',3).multiplier,1.4);
  assert.equal(b.CANAAN_CLASS_CAST('staff',0).multiplier,1);
  b.weaponCooldowns['staff:1']=0;b.useSkill(1);b.advance(361);
  assert.equal(b.CANAAN_CLASS_CAST('staff',0).multiplier,1,'le bonus expire après 6 s');
  // Avatar élémentaire (F) : +20 % de dégâts et −30 % de mana pendant 10 s (14 s avec Avatar primordial).
  const a=game();a.setClass('elementaliste',[]);a.P.mp=100;assert.equal(a.CANAAN_CLASS.special(),true);
  assert.ok(Math.abs(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-120)<1e-9);
  a.advance(601);assert.equal(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage,100);
});

test('Chasseur : Instinct du traqueur, Concentration, Marque du chasseur, Œil du faucon et Instinct de survie',()=>{
  const g=game();g.setClass('chasseur',[]);
  // Instinct du traqueur : +1 % de dégâts par case de distance, 15 % au plus.
  const far=mob(100);far.x=48*10;assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(far,100,{}).damage-110)<1e-9);
  far.x=48*40;assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(far,100,{}).damage-115)<1e-9);
  // Concentration : 100, rechargée de 10 par seconde ; une compétence coûte le double de son prix en mana.
  assert.equal(g.resourceMax('focus',60),100);assert.equal(g.resourceRegen('focus',100,true),10);
  assert.equal(g.CANAAN_CLASS_MANA_COST('bow',0,10),20);
  // Marque du chasseur : la proie la plus proche de la souris subit +15 % de tout le groupe (+20 % des flèches).
  g.P.mp=100;const prey=mob(1e6);prey.x=48*3;g.monsters=[prey];g.mouseWorldX=prey.x;g.useSkill(1);
  assert.ok(prey._huntMark);assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(prey,100,{}).damage-103*1.15*1.2)<1e-6);
  // Œil du faucon (F) : +20 % de dégâts, +10 de critique, attaques de base 30 % plus rapides pendant 10 s.
  const h=game();h.setClass('chasseur',[]);h.P.mp=100;const crit=h.characterStats().crit;
  assert.equal(h.CANAAN_CLASS.special(),true);assert.equal(h.characterStats().crit,crit+10);
  assert.ok(Math.abs(h.CANAAN_CLASS_BASIC_LOCK()-.7)<1e-9);assert.ok(Math.abs(h.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-120*1.01)<1e-9,'+20 %, et 1 case de distance');
  h.advance(601);assert.equal(h.CANAAN_CLASS_BASIC_LOCK(),1);
  // Instinct de survie : seule la roulade active le bonus, même à pleine vie.
  const s=game();s.setClass('chasseur',[8]);const st=s.characterStats();s.P.mhp=s.P.hp=100;
  s.CANAAN_CLASS_ON_DODGE(s.game.hero);
  assert.equal(s.characterStats().guard,st.guard,'une déviation ne déclenche rien');
  s.particles=[];assert.equal(s.CANAAN_COMBAT.dodge(1,0),true);
  assert.equal(s.characterStats().speed,st.speed+30);assert.equal(s.characterStats().guard,st.guard+20);
  s.advance(301);
  assert.equal(s.characterStats().guard,st.guard);
  // Repli tactique : la roulade se recharge 30 % plus vite.
  const r=game();r.setClass('chasseur',[4]);assert.ok(Math.abs(r.CANAAN_CLASS_DODGE_FACTOR()-.7)<1e-9);
});

test('Guerrier : Élan (Maître d’armes), Rage, Volonté de fer, Riposte, Fureur martiale et Seigneur de guerre',()=>{
  const g=game();g.setClass('guerrier',[6,9]);predictable(g,.99);const crit=g.characterStats().crit;
  // Chaque coup qui touche donne un Élan (5 au plus) : +3 % de dégâts et attaques de base 4 % plus rapides chacun.
  const m=mob(1e7);for(let k=0;k<7;k++){g.CANAAN_COMBAT.attack(m,1,basicHit);g.advance(10)}
  assert.equal(g.CANAAN_CLASS.momentum(),5);assert.ok(Math.abs(g.CANAAN_CLASS_BASIC_LOCK()-.8)<1e-9);
  assert.equal(g.characterStats().crit,crit+10,'Seigneur de guerre : +2 de critique par Élan');
  // Fureur martiale : à 5 Élans, 30 % de Rage en moins (Rage : le double du prix en mana).
  assert.ok(Math.abs(g.CANAAN_CLASS_MANA_COST('dualsword',0,12)-24*.7)<1e-9);
  g.advance(241);assert.equal(g.CANAAN_CLASS.momentum(),0,'l’Élan retombe après 4 s');
  // Rage : part de zéro, monte avec les attaques de base et les coups reçus.
  assert.equal(g.resourceMax('rage',60),100);assert.equal(g.resourceGain('rage','basic'),7);
  // Volonté de fer (F) : 30 de Garde, +15 % de dégâts, +30 de Rage.
  const v=game();v.setClass('guerrier',[]);v.P.mp=0;v.P.mmp=100;const guard=v.characterStats().guard;
  assert.equal(v.CANAAN_CLASS.special(),true);assert.equal(v.P.mp,30);assert.equal(v.characterStats().guard,guard+30);
  assert.ok(Math.abs(v.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-115)<1e-9);
  // Riposte : 15 % de chances de parer (aucun dégât) et de contre-attaquer.
  const r=game();r.setClass('guerrier',[7]);predictable(r,0);const foe=mob(1e6);
  assert.equal(r.CANAAN_CLASS_DEFENSE(foe,50),0);assert.ok(foe.hp<1e6);
});

test('Compétences des armes de classe : les 40 compétences se lancent, avec leur coût et leur recharge',()=>{
  for(const c of ['druide','paladin','assassin','elementaliste','barde','berserker','chasseur','guerrier']){
    const g=game();g.setClass(c,[]);predictable(g,.99);g.P.hp=g.P.mhp=1e6;const m=mob(1e7);m.x=60;g.monsters=[m];g.mouseWorldX=60;
    const type=g.currentWeaponType();
    for(let i=0;i<4;i++){g.P.mp=g.P.mmp=1000;g.useSkill(i);assert.ok(g.weaponCooldowns[type+':'+i]>0,c+' '+type+':'+i);g.advance(30)}
    if(c==='druide'){g.P.mp=1000;g.CANAAN_CLASS.special();for(let i=0;i<4;i++){g.P.mp=1000;g.useSkill(i);assert.ok(g.weaponCooldowns['feline:'+i]>0,'feline:'+i);g.advance(30)}}
    assert.ok(m.hp<1e7,c+' : les compétences frappent');
  }
});

test('Les talents équipés modifient les sorts d’armes sans remplacer leurs quatre emplacements',()=>{
  const druid=game();druid.setClass('druide',[6]);druid.P.mp=100;
  const prey=mob(1e6);prey.x=100;druid.mouseWorldX=100;druid.monsters=[prey];
  assert.equal(druid.CANAAN_CLASS.special(),true);
  druid.useSkill(1);assert.ok(prey.v1746_bleed>0,'Bond du prédateur applique le saignement');

  const rogue=game();rogue.setClass('assassin',[8]);rogue.P.mp=100;
  const daggerTarget=mob(1e6);rogue.useSkill(2);rogue.projectiles[0].onHit(daggerTarget);
  assert.equal(daggerTarget._clsSlow.pct,.4,'Éventail de lames applique le venin paralysant');

  const mage=game();mage.setClass('elementaliste',[4]);mage.P.mp=100;predictable(mage,.99);
  const conduit=mob(1e6);mage.monsters=[conduit];mage.useSkill(2);mage.advance(20);
  const first=1e6-conduit.hp;
  mage.advance(3);assert.ok(first>0&&1e6-conduit.hp>first,'Conducteur frappe de nouveau une cible isolée');

  const bard=game();bard.setClass('barde',[1]);bard.P.mp=100;bard.P.mhp=1000;bard.P.hp=100;
  bard.useSkill(2);bard.advance(479);
  const beforeFinale=bard.P.hp;
  bard.advance(3);assert.equal(bard.P.hp-beforeFinale,79,'pulsation finale avec bonus de soins');

  const hunter=game();hunter.setClass('chasseur',[1]);hunter.P.mp=100;predictable(hunter,.99);
  const volleyTarget=mob(1e6);hunter.monsters=[volleyTarget];hunter.useSkill(2);hunter.advance(2);
  const firstVolley=1e6-volleyTarget.hp;
  hunter.advance(147);const beforeLast=volleyTarget.hp;
  hunter.advance(5);assert.ok(beforeLast-volleyTarget.hp>2*firstVolley,'la dernière salve est renforcée');

  const warrior=game();warrior.setClass('guerrier',[3]);warrior.P.mp=100;
  warrior.monsters=[{...mob(1e6),boss:true}];warrior.useSkill(0);warrior.useSkill(3);
  assert.equal(warrior.weaponCooldowns['dualsword:3'],warrior.WEAPON_SPELLS.dualsword[3][3]-4);

  const berserker=game();berserker.setClass('berserker',[4]);berserker.P.hp=berserker.P.mhp=1000;
  const wounded=mob(1e6);berserker.monsters=[wounded];berserker.useSkill(2);
  assert.ok(wounded.v1746_bleed>0,'Hurlement sanguinaire prépare le saignement');
});
