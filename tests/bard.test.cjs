// Barde (classe de soin qui peut frapper) et Luth (arme de toutes les classes, sauf l'Invocateur).
const { test } = require('node:test');
const { assert, game, mob, predictable, same, skillHit, basicHit, source } = require('./helpers/context.cjs');

const near = (a, b, eps = 1) => Math.abs(a - b) <= eps;

test('Barde et Luth : données, élément Harmonie, arme libre et noms par qualité', () => {
  const g = game();
  const barde = g.CLASSES.find(c => c.id === 'barde');
  assert.ok(barde, 'le Barde est une classe');
  assert.equal(barde.talents.length, 10);
  same(barde.elements, ['harmony', 'harmony', 'harmony', 'harmony']);
  assert.equal(g.boundWeaponOf('barde'), null, 'le Barde manie toutes les armes');
  assert.equal(g.ELEMENTS.harmony.name, 'Harmonie');
  // Le Luth : arme de butin et de marchand, magique, avec une compétence utilitaire (le chant de guérison).
  assert.ok(g.CRAFT_WEAPONS.includes('lute'));
  assert.ok(g.MAGIC_WEAPONS.includes('lute'));
  same(
    [0, 1, 2, 3].map(i => g.isOffensiveSkill('lute', i)),
    [true, true, false, true]
  );
  same(
    ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire', 'Mythique'].map(r => g.WEAPON_NAMES[r].lute),
    [
      'Luth de taverne',
      'Luth du ménestrel',
      'Luth des troubadours',
      'Luth des sirènes',
      "Luth de l'Aurore chantante",
      'Luth des échos éternels'
    ]
  );
  // Un Barde au Luth : élément Harmonie sur la barre.
  g.setClass('barde', []);
  g.equipment.weapon.weaponType = 'lute';
  g.refreshWeaponBar();
  same(g.SKILLS.map(s => s.n), ['Note éclatante', 'Accord dissonant', 'Chant de guérison', 'Symphonie']);
  assert.equal(g.CANAAN_CLASS_CAST('lute', 0).element, 'harmony');
  assert.equal(g.CANAAN_CLASS_CAST('lute', 0).magic, true);
});

test('Barde : Écho mélodieux (soin par les dégâts, soin de groupe des utilitaires) et soins +10 %', () => {
  const g = game();
  g.setClass('barde', []);
  predictable(g, 0.99);
  g.P.mhp = 100000;
  g.P.hp = 20;
  const m = mob(1e7);
  const before = m.hp;
  g.CANAAN_COMBAT.attack(m, 100, skillHit('harmony'));
  const dealt = before - m.hp;
  assert.ok(dealt > 0);
  assert.ok(near(g.P.hp - 20, dealt * 0.2 * 1.1), 'soigne de 20 % des dégâts, avec +10 % de soins');
  // Une attaque de base ne soigne pas.
  const hp = g.P.hp;
  g.CANAAN_COMBAT.attack(m, 100, basicHit);
  assert.equal(g.P.hp, hp);
  // Une compétence utilitaire soigne le groupe proche de 10 % des PV max (+10 %).
  g.P.mhp = 1000;
  g.P.hp = 100;
  g.CANAAN_CLASS_AFTER_CAST('lute', 2);
  assert.equal(g.P.hp, 210);
  // Texte de l'empreinte dans l'info-bulle.
  assert.match(g.CANAAN_CLASS.skillRider('lute', 0), /Barde : soigne l’allié le plus blessé/);
  assert.match(g.CANAAN_CLASS.skillRider('sword', 2), /10 % de leurs PV max/);
});

test('Barde : Hymne de l’Aurore (F), soin immédiat, soin par seconde et dégâts +10 %', () => {
  const g = game();
  g.setClass('barde', []);
  g.P.mp = 100;
  g.P.mhp = 1000;
  g.P.hp = 100;
  assert.equal(g.CANAAN_CLASS.special(), true);
  assert.equal(g.P.mp, 70);
  assert.equal(g.P.hp, 265, '15 % des PV max, +10 %');
  assert.ok(near(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 110, 1e-9));
  g.advance(61);
  assert.equal(g.P.hp, 298, '3 % par seconde, +10 %');
  g.advance(600);
  assert.equal(g.P.hp, 265 + 6 * 33, 'six secondes de soins, pas plus');
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 100);
  // Recharge de 40 s.
  g.P.mp = 100;
  assert.equal(g.CANAAN_CLASS.special(), false);
  g.advance(40 * 60);
  assert.equal(g.CANAAN_CLASS.special(), true);
});

test('Barde : Ballade, Crescendo, Dissonance, Inspiration et Mélodie vivifiante', () => {
  const g = game();
  g.setClass('barde', [1, 0, 4, 7, 3]);
  predictable(g, 0.99);
  g.P.mhp = 10000;
  g.P.hp = 20;
  // Ballade réparatrice : soins +15 % (en plus du passif).
  const healed = g.canaanApplyHeal(100);
  assert.ok(near(healed, 100 * 1.1 * 1.15));
  // Mélodie vivifiante : le soin donne +10 % de vitesse et +5 % de dégâts pendant 4 s.
  const speed = g.characterStats().speed;
  assert.ok(near(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 105, 1e-9));
  g.advance(241);
  assert.equal(g.characterStats().speed, speed - 10);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 100);
  // Crescendo : +3 % par compétence offensive, 15 % au plus, 6 s.
  for (let i = 0; i < 7; i++) g.CANAAN_CLASS_CAST('lute', 0);
  assert.ok(near(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 115, 1e-9));
  g.advance(361);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 100);
  // Dissonance : une cible touchée par une compétence offensive subit +8 % pendant 4 s.
  const m = mob(1e7);
  g.CANAAN_COMBAT.attack(m, 100, skillHit('harmony'));
  g.advance(1);
  // (l'Écho du coup a aussi soigné : la Mélodie vivifiante joue sur les deux cibles)
  const ratio = () =>
    g.CANAAN_CLASS_ATTACK.before(m, 100, {}).damage / g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage;
  assert.ok(near(ratio(), 1.08, 1e-9));
  g.advance(241);
  assert.ok(near(ratio(), 1, 1e-9));
  // Inspiration : toutes les 4 compétences lancées, la cinquième est gratuite.
  const h = game();
  h.setClass('barde', [7]);
  const costs = [];
  for (let i = 0; i < 10; i++) {
    costs.push(h.CANAAN_CLASS_MANA_COST('lute', i % 4, 10));
    h.CANAAN_CLASS_CAST('lute', i % 4);
  }
  same(costs, [10, 10, 10, 10, 0, 10, 10, 10, 10, 0]);
});

test('Barde : Ritournelle (soin en trop en bouclier), Contre-chant, Note perçante et Grand final', () => {
  const g = game();
  g.setClass('barde', [8, 2]);
  g.P.mhp = 100;
  g.P.hp = 100;
  g.canaanApplyHeal(50);
  assert.equal(g.CANAAN_CLASS.audit().shield, 10, 'bouclier plafonné à 10 % des PV max');
  // Contre-chant : sous 40 % de PV, +10 % des PV max et un bouclier de 10 %, recharge 40 s.
  const c = game();
  c.setClass('barde', [2]);
  c.P.mhp = 100;
  c.P.hp = 30;
  c.advance(1);
  assert.equal(c.P.hp, 41);
  assert.equal(c.CANAAN_CLASS.audit().shield, 10);
  c.P.hp = 30;
  c.advance(60);
  assert.equal(c.P.hp, 30, 'en recharge');
  // Note perçante : un critique libère une onde sur les ennemis proches.
  const n = game();
  n.setClass('barde', [6]);
  predictable(n, 0);
  const a = mob(1e7),
    b = mob(1e7);
  n.monsters = [a, b];
  n.CANAAN_COMBAT.attack(a, 100, basicHit);
  assert.ok(b.hp < 1e7, 'l’onde touche le voisin');
  // Grand final : toutes les 6 compétences offensives, un accord frappe autour et soigne le groupe.
  const f = game();
  f.setClass('barde', [9]);
  f.P.mhp = 1000;
  f.P.hp = 100;
  const t = mob(1e7);
  f.monsters = [t];
  for (let i = 0; i < 5; i++) f.CANAAN_CLASS_CAST('lute', 0);
  assert.equal(t.hp, 1e7);
  f.CANAAN_CLASS_CAST('lute', 0);
  assert.ok(t.hp < 1e7);
  assert.equal(f.P.hp, 188, '8 % des PV max, +10 %');
});

test('Luth : quatre compétences lançables, chant de guérison sur la durée, symphonie qui frappe et soigne', () => {
  const g = game();
  // Secondaires fixes (sans bonus de Soin) : soins exacts.
  g.equipment.weapon.sec = { crit: 1, power: 1 };
  g.equipment.weapon.weaponType = 'lute';
  g.refreshWeaponBar();
  g.P.mhp = 1000;
  g.P.hp = 100;
  // Chant de guérison : 12 % tout de suite, puis 2 % par seconde pendant 5 s.
  g.useSkill(2);
  assert.equal(g.P.hp, 220);
  g.advance(6 * 60);
  assert.equal(g.P.hp, 320);
  // Note éclatante : projectile magique, et 4 % des PV max au plus blessé.
  g.useSkill(0);
  assert.equal(g.P.hp, 360);
  assert.equal(g.projectiles.at(-1).kind, 'orb');
  // Symphonie : 5 ondes de 100 % sous la souris, chacune soigne de 2 %.
  const m = mob(1e7);
  m.x = g.mouseWorldX;
  m.y = g.mouseWorldY;
  g.monsters = [m];
  g.P.x = g.mouseWorldX;
  g.P.y = g.mouseWorldY;
  g.useSkill(3);
  g.advance(150);
  assert.ok(m.hp < 1e7);
  assert.equal(g.P.hp, 460);
});

test('Luth en jeu : chez les marchands, porté par un Barde allié qui soigne, refusé à l’Invocateur', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;P.dead=false;game.world.instance=null');
  // Le marchand propose un Luth.
  run('const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+30');
  assert.ok(run('CANAAN_SHOP.stock(game.hero).some(i=>i.weaponType==="lute")'));
  // Un compagnon Barde au Luth : son Écho soigne l'hôte blessé (le plus blessé du groupe).
  run(
    'globalThis.bard=canaanCreateHero({name:"Barde",x:P.x+40,y:P.y,equipment:{weapon:{id:"lute",slot:"weapon",level:20,rarity:"Rare",weaponType:"lute"}}});bard.level=20;game.heroes.push(bard);CANAAN_CLASS.choose("barde",bard)'
  );
  assert.equal(run('bard.classe.id'), 'barde');
  run('P.hp=Math.round(P.mhp*0.2);bard.player.hp=bard.player.mhp;globalThis.hp0=P.hp');
  run(
    'CANAAN_CLASS.within(bard,()=>CANAAN_COMBAT.attack({t:"Cible",x:bard.player.x+30,y:bard.player.y,hp:1e6,mhp:1e6,r:14,cd:1e9,g:0},200,{skill:true,offensive:true,element:"harmony",multiplier:1},bard))'
  );
  assert.ok(run('P.hp') > run('hp0'), 'le Barde allié soigne l’hôte');
  // Invocateur : le Grimoire reste en main, le Luth ne s'équipe pas.
  run(
    'inventory.length=0;CANAAN_CLASS_STATE.import({id:"invocateur",talents:[]});inventory.push({id:"l2",slot:"weapon",rarity:"Rare",level:1,weaponType:"lute"});CANAAN_GEAR.normalize(inventory.at(-1))'
  );
  run('equipItem("l2")');
  assert.equal(run('equipment.weapon.weaponType'), 'grimoire');
});
