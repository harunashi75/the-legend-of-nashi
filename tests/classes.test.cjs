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

test('Classes : sept classes de dix talents, cinq emplacements selon le niveau, état vérifié',()=>{
  const g=game();
  assert.equal(g.CLASSES.length,7);same(g.CLASSES.map(c=>c.name),['Druide','Paladin','Assassin','Élémentaliste','Invocateur','Barde','Berserker']);
  for(const c of g.CLASSES){assert.equal(c.talents.length,10,c.id);assert.ok(c.special.name&&c.passive.name,c.id)}
  same([1,9,10,19,20,30,40,60].map(g.talentSlotsAt),[1,1,2,2,3,4,5,5]);
  // Classe inconnue, doublons, numéros invalides et emplacements en trop sont retirés.
  g.CANAAN_CLASS_STATE.import({id:'druide',talents:[0,0,1,2,99,-1,'3',3,4,5,6]});
  same(g.CANAAN_CLASS.audit().talents,[0,1],'niveau 10 : deux emplacements');
  g.game.hero.level=60;g.CANAAN_CLASS_STATE.import({id:'druide',talents:[0,0,1,2,99,3,4,5]});
  same(g.CANAAN_CLASS.audit().talents,[0,1,2,3,4]);
  g.CANAAN_CLASS_STATE.import({id:'guerrier',talents:[0]});assert.equal(g.CANAAN_CLASS.audit().id,null);
  same(g.CANAAN_CLASS_STATE.export(),{id:null,talents:[]});
  // Équiper : dans la limite des emplacements, jamais deux fois, jamais en combat.
  g.game.hero.level=10;g.CANAAN_CLASS_STATE.import({id:'paladin',talents:[]});
  assert.equal(g.CANAAN_CLASS.equip(1),true);assert.equal(g.CANAAN_CLASS.equip(1),false);
  assert.equal(g.CANAAN_CLASS.equip(6),true);assert.equal(g.CANAAN_CLASS.equip(7),false,'deux emplacements au niveau 10');
  assert.equal(g.CANAAN_CLASS.unequip(1),true);
  g.hit(mob(1000),1);assert.equal(g.CANAAN_CLASS.equip(7),false,'en combat');assert.equal(g.CANAAN_CLASS.unequip(6),false);
  g.advance(301);assert.equal(g.CANAAN_CLASS.equip(7),true);
  same(g.CANAAN_CLASS_STATE.export(),{id:'paladin',talents:[6,7]});
  // Compétences offensives et éléments.
  assert.equal(g.isOffensiveSkill('sword',2),false);assert.equal(g.isOffensiveSkill('sword',3),true);assert.equal(g.isOffensiveSkill('staff',2),false);
  same([0,1,2,3].map(i=>g.skillElement('elementaliste',i)),['fire','ice','lightning','fire']);
  assert.equal(g.skillElement('druide',2),'nature');assert.equal(g.skillElement(null,0),null);
  const cast=g.CANAAN_CLASS_CAST('sword',0);assert.equal(cast.element,'holy');assert.equal(cast.offensive,true);assert.equal(cast.skill,true);
});

test('Druide : ronces, poison et racines non cumulables, Fureur sauvage, régénération et Sève vitale',()=>{
  const g=game();g.setClass('druide',[0,1,4,6,8]);predictable(g,0);
  const m=mob(100000);g.monsters=[m];
  const before=m.hp;g.CANAAN_COMBAT.attack(m,100,skillHit('nature'));const dealt=before-m.hp;
  const dots=m._clsDots.filter(d=>d.by===g.game.hero);
  same(dots.map(d=>d.kind).sort(),['poison','sap','thorns']);
  assert.ok(Math.abs(dots.find(d=>d.kind==='thorns').dps-dealt*.3/5)<1e-9);
  // Empreinte du Druide : toute compétence offensive empoisonne de 25 % des dégâts sur 4 s.
  assert.ok(Math.abs(dots.find(d=>d.kind==='sap').dps-dealt*.25/4)<1e-9);
  assert.ok(Math.abs(dots.find(d=>d.kind==='poison').dps-dealt*.4/6)<1e-9,'le coup critique empoisonne');
  assert.equal(m._clsSlow.pct,.3);assert.equal(m._clsSlow.element,'nature');
  // Une deuxième application ne s'empile pas : un seul effet par type, la plus forte valeur.
  g.CANAAN_COMBAT.attack(m,10,skillHit('nature'));assert.equal(m._clsDots.length,3);
  assert.ok(Math.abs(m._clsDots.find(d=>d.kind==='thorns').dps-dealt*.3/5)<1e-9);
  // Fureur sauvage : +12 % contre une cible marquée par la nature.
  const marked=g.CANAAN_CLASS_ATTACK.before(m,100,{}).damage,clean=g.CANAAN_CLASS_ATTACK.before(mob(100),100,{}).damage;
  assert.ok(Math.abs(marked/clean-1.12)<1e-9);
  // Les ronces et le poison font leurs dégâts une fois par seconde, puis s'arrêtent.
  const hp=m.hp;g.advance(60);assert.ok(m.hp<hp);g.advance(400);assert.equal(m._clsDots.length,0);
  const done=m.hp;g.advance(120);assert.equal(m.hp,done);
  // Régénération naturelle : 1 % des PV max toutes les 5 s, seulement en combat.
  const h=game();h.setClass('druide',[1]);h.P.hp=20;h.P.mhp=100;h.advance(301);assert.equal(h.P.hp,20,'hors combat');
  h.hit(mob(100000),1);h.advance(299);for(let i=0;i<3;i++){h.hit(mob(100000),1);h.advance(100)}
  assert.ok(Math.abs(h.P.hp-21)<1e-9,String(h.P.hp));
  // Sève vitale : une compétence offensive rend 5 % des dégâts infligés.
  const s=game();s.setClass('druide',[]);s.P.hp=20;s.P.mhp=1000;const target=mob(100000);
  s.CANAAN_COMBAT.attack(target,100,skillHit('nature'));const healed=s.P.hp-20;assert.ok(healed>0);
  assert.ok(Math.abs(healed-(100000-target.hp)*.05)<1,'5 % des dégâts réels');
  const hp2=s.P.hp;s.CANAAN_COMBAT.attack(target,100,basicHit);assert.equal(s.P.hp,hp2,'pas sur les attaques normales');
});

test('Druide : Forme féline (F), bonus, attaques de base plus rapides et soins réduits',()=>{
  const g=game();g.setClass('druide',[]);g.P.mp=100;g.P.hp=20;g.P.mhp=1000;
  const base=g.characterStats();
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,'feral');assert.equal(g.P.mp,76,'15 de mana, +1 % par niveau (niv. 60)');
  const feral=g.characterStats();assert.equal(feral.speed,base.speed+20);assert.equal(feral.crit,base.crit+8);
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(),.8);
  assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(mob(100),100,{}).damage-115)<1e-9);
  // Pas de Sève vitale et soins réduits de 30 % en forme féline.
  const m=mob(100000);g.CANAAN_COMBAT.attack(m,100,skillHit('nature'));assert.equal(g.P.hp,20);
  assert.equal(g.canaanApplyHeal(100),70);
  // Sortir est gratuit, après la petite recharge.
  assert.equal(g.CANAAN_CLASS.special(),false);g.advance(91);
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,null);assert.equal(g.P.mp,76);
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(),1);
  // Basic lock réel de l'arme.
  g.advance(91);g.CANAAN_CLASS.special();g.canaanBasicAttack(false);
  assert.ok(Math.abs(g.CANAAN_BASIC_ATTACK.lock()-.55*.8*(1-Math.min(60,g.characterStats().haste)/100))<1e-9);
  // Sans mana, pas de transformation.
  const h=game();h.setClass('druide',[]);h.P.mp=5;assert.equal(h.CANAAN_CLASS.special(),false);assert.equal(h.P.form,null);
});

test('Paladin : Armure bénie, Jugement, Foi inébranlable, Volonté sacrée et Intervention divine',()=>{
  const g=game();g.setClass(null);const base=g.characterStats();g.setClass('paladin',[1,6,2,8,9]);
  assert.equal(g.characterStats().defense,Math.round(base.defense*1.12));
  const low=mob(100);low.hp=29;assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(low,100,{}).damage-115)<1e-9);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100),100,{}).damage,100);
  // Foi inébranlable : sous 35 % de PV, +20 de Garde pendant 5 s, recharge 45 s.
  g.P.mhp=100;g.P.hp=30;const guard=g.characterStats().guard;g.advance(1);assert.equal(g.characterStats().guard,guard+20);
  g.advance(301);assert.equal(g.characterStats().guard,guard);g.advance(600);assert.equal(g.characterStats().guard,guard,'en recharge');
  // Volonté sacrée : un critique subi rend 5 % des PV max, puis 20 s de recharge.
  g.P.hp=50;g.CANAAN_CLASS_ON_CRIT_TAKEN();assert.equal(g.P.hp,55);g.CANAAN_CLASS_ON_CRIT_TAKEN();assert.equal(g.P.hp,55);
  // Intervention divine : un coup fatal laisse 1 PV et un bouclier de 25 %, une fois par combat.
  g.P.hp=10;assert.equal(g.CANAAN_COMBAT.hurt(500,mob(10)),9);assert.equal(g.P.hp,1);
  assert.equal(g.CANAAN_CLASS.audit().shield,25);
  assert.equal(g.CANAAN_CLASS_DEFENSE(mob(10),30),5,'le bouclier absorbe 25');
  g.P.hp=10;g.CANAAN_COMBAT.hurt(500,mob(10));assert.ok(g.P.hp<=0,'une seule fois par combat');
  g.P.hp=10;g.advance(400);g.CANAAN_COMBAT.hurt(500,mob(10));assert.equal(g.P.hp,1,'nouveau combat');
});

test('Paladin : Consécration après trois compétences offensives, Lumière divine (F)',()=>{
  const g=game();g.setClass('paladin',[4]);predictable(g,.99);const m=mob(100000);g.monsters=[m];
  g.CANAAN_CLASS_CAST('sword',0);g.CANAAN_CLASS_CAST('sword',2);g.CANAAN_CLASS_CAST('sword',1);
  g.advance(1);assert.equal(m.hp,100000,'la parade ne compte pas');
  g.CANAAN_CLASS_CAST('sword',3);g.advance(1);assert.ok(m.hp<100000);
  const tick=100000-m.hp;g.advance(60);assert.ok(Math.abs((100000-m.hp)-2*tick)<=2);
  g.advance(400);const after=m.hp;g.advance(120);assert.equal(m.hp,after,'zone finie après 5 s');
  // Lumière divine : soin de 20 % des PV max et −20 % de dégâts pendant 6 s.
  g.P.mp=100;g.P.hp=10;g.P.mhp=100;const guard=g.characterStats().guard;
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.hp,30);assert.equal(g.P.mp,50,'Ferveur : le double du prix en mana (25)');
  assert.equal(g.characterStats().guard,guard+20);g.advance(361);assert.equal(g.characterStats().guard,guard);
  assert.equal(g.CANAAN_CLASS.special(),false,'recharge de 45 s');
});

test('Assassin : Précision, Exécuteur, Assaut implacable, Hémorragie, Ombre meurtrière et Voile d’ombre',()=>{
  const g=game();g.setClass(null);const base=g.characterStats();g.setClass('assassin',[1,4,5,3,9]);
  const st=g.characterStats();assert.equal(st.crit,base.crit+8);assert.equal(st.speed,base.speed+5);assert.equal(st.critPower,base.critPower+10);
  const low=mob(100);low.hp=24;assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(low,100,{}).damage-120)<1e-9);
  // Assaut implacable : +2 % par coup consécutif sur la même cible, 10 % au plus, remis à zéro après 4 s.
  predictable(g,.99);const m=mob(1e7),dmg=()=>g.CANAAN_CLASS_ATTACK.before(m,100,{}).damage;
  assert.equal(dmg(),100);for(let i=0;i<8;i++)g.CANAAN_COMBAT.attack(m,1,basicHit);
  assert.ok(Math.abs(dmg()-110)<1e-9);g.advance(241);assert.equal(dmg(),100);
  // Hémorragie : un critique pose un saignement de 30 % du coup sur 4 s.
  predictable(g,0);const t=mob(1e6);const before=t.hp;g.CANAAN_COMBAT.attack(t,100,basicHit);
  const bleed=t._clsDots.find(d=>d.kind==='bleed');assert.ok(Math.abs(bleed.dps-(before-t.hp)*.3/4)<1e-9);
  // Ombre meurtrière : après 3 critiques, la prochaine compétence offensive fait +30 % (sur tout le lancement).
  g.CANAAN_COMBAT.attack(t,1,basicHit);g.CANAAN_COMBAT.attack(t,1,basicHit);
  assert.equal(g.CANAAN_CLASS_CAST('dualdagger',2).multiplier,1,'une ruée ne consomme rien');
  assert.ok(Math.abs(g.CANAAN_CLASS_CAST('dualdagger',0).multiplier-1.3)<1e-9);
  assert.equal(g.CANAAN_CLASS_CAST('dualdagger',0).multiplier,1);
  // Voile d'ombre : invisible 4 s, +30 % de vitesse ; la prochaine compétence offensive fait +40 % et le lève.
  const h=game();h.setClass('assassin',[]);h.P.mp=100;const speed=h.characterStats().speed;
  assert.equal(h.CANAAN_CLASS.special(),true);assert.equal(h.P.veiled,true);assert.equal(h.characterStats().speed,speed+30);
  assert.ok(Math.abs(h.CANAAN_CLASS_CAST('bow',0).multiplier-1.4)<1e-9);assert.equal(h.P.veiled,false);
  h.advance(1801);h.CANAAN_CLASS.special();h.advance(241);assert.equal(h.P.veiled,false,'fin du voile après 4 s');
});

test('Élémentaliste : glace, Gel profond, Concentration arcanique, Tempête, Explosion ardente et Barrière de givre',()=>{
  const g=game();g.setClass('elementaliste',[7,8,9,4,5]);g.TS=48;predictable(g,.99);
  // Compétence de glace : ralentit de 30 % pendant 2,5 s ; Gel profond : +15 % contre une cible gelée.
  const m=mob(1e6);g.monsters=[m];g.CANAAN_COMBAT.attack(m,100,skillHit('ice'));
  assert.equal(m._clsSlow.pct,.3);assert.equal(m._clsSlow.element,'ice');
  assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(m,100,{}).damage-115)<1e-9);
  g.update=()=>{m.x+=4};const x=m.x;g.advance(1);assert.ok(Math.abs(m.x-x-2.8)<1e-9,'ralentissement de 30 %');
  g.advance(151);const y=m.x;g.advance(1);assert.equal(m.x-y,4);g.update=()=>{};
  // Concentration arcanique : chaque 3e compétence offensive coûte moitié prix.
  const costs=[];for(let i=0;i<6;i++){costs.push(g.CANAAN_CLASS_MANA_COST('staff',0,10));g.CANAAN_CLASS_CAST('staff',0)}
  // Coût en mana au niveau 60 : +59 % (10 → 16).
  same(costs,[16,16,8,16,16,8]);assert.equal(g.CANAAN_CLASS_MANA_COST('staff',2,10),16);
  // Tempête élémentaire : la 5e compétence offensive explose (80 % de l'Attaque, 4 cases), puis 12 s de recharge.
  const n=game();n.setClass('elementaliste',[9]);n.TS=48;predictable(n,.99);const near=mob(1e6),far=mob(1e6);far.x=1000;n.monsters=[near,far];
  for(let i=0;i<4;i++)n.CANAAN_CLASS_CAST('staff',0);assert.equal(near.hp,1e6);
  n.CANAAN_CLASS_CAST('staff',0);assert.ok(near.hp<1e6);assert.equal(far.hp,1e6);
  const hp=near.hp;for(let i=0;i<5;i++)n.CANAAN_CLASS_CAST('staff',0);assert.equal(near.hp,hp,'recharge');
  // Explosion ardente : un ennemi brûlé qui meurt explose une fois.
  const e=game();e.setClass('elementaliste',[0,4]);e.TS=48;predictable(e,0);
  const burned=mob(1e6),other=mob(1e6);other.x=80;e.monsters=[burned,other];
  e.CANAAN_COMBAT.attack(burned,10,skillHit('fire'));assert.ok(burned._clsDots.some(d=>d.kind==='burn'));
  burned.hp=1;e.CANAAN_COMBAT.attack(burned,10,basicHit);assert.ok(other.hp<1e6,'explosion sur l’ennemi proche');
  // Barrière de givre : sous 40 % de PV, bouclier de 15 % des PV max, 40 s de recharge.
  const b=game();b.setClass('elementaliste',[5]);b.P.hp=30;b.P.mhp=100;b.advance(1);
  assert.equal(b.CANAAN_CLASS.audit().shield,15);assert.equal(b.CANAAN_CLASS_DEFENSE(mob(1),10),0);
  assert.equal(b.CANAAN_CLASS_DEFENSE(mob(1),10),5);b.advance(400);assert.equal(b.CANAAN_CLASS.audit().shield,0);
  // Avatar élémentaire (F) : +20 % de dégâts et −30 % de mana pendant 10 s.
  const a=game();a.setClass('elementaliste',[]);a.P.mp=100;assert.equal(a.CANAAN_CLASS.special(),true);
  assert.ok(Math.abs(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-120)<1e-9);assert.ok(Math.abs(a.CANAAN_CLASS_MANA_COST('staff',0,10)-16*0.7)<1e-9);
  a.advance(601);assert.equal(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage,100);
});

test('Compétences d’armes : élément et couleur de la classe, sans classe la couleur de l’arme',()=>{
  const g=game();g.setClass('elementaliste',[]);const m=mob(1e6);g.monsters=[m];predictable(g,.99);
  g.equipment.weapon.weaponType='mace';g.refreshWeaponBar();g.useSkill(1);
  assert.equal(m._clsSlow.element,'ice','Onde de choc de glace');
  g.useSkill(0);assert.ok(m.hp<1e6);
});
