// Barde (classe de soin qui peut frapper) et son arme, le Luth.
const { test } = require('node:test');
const { assert, game, mob, predictable, same, skillHit, basicHit, source } = require('./helpers/context.cjs');

const near = (a, b, eps = 1) => Math.abs(a - b) <= eps;

test('Barde et Luth : données, élément Harmonie, arme de la classe et noms par niveau', () => {
  const g = game();
  const barde = g.CLASSES.find(c => c.id === 'barde');
  assert.ok(barde, 'le Barde est une classe');
  assert.equal(barde.talents.length, 10);
  same(barde.elements, ['harmony', 'harmony', 'harmony', 'harmony']);
  assert.equal(g.boundWeaponOf('barde'), 'lute', 'le Luth est l’arme du Barde');
  assert.equal(g.ELEMENTS.harmony.name, 'Harmonie');
  // Le Luth : arme de la classe, magique, avec une compétence utilitaire (le chant de guérison).
  assert.ok(!g.CRAFT_WEAPONS.includes('lute'));
  assert.ok(g.MAGIC_WEAPONS.includes('lute'));
  same(
    [0, 1, 2, 3].map(i => g.isOffensiveSkill('lute', i)),
    [true, true, false, true]
  );
  same(
    [1, 10, 20, 30, 40, 50].map(lv => g.relicName('lute', lv)),
    [
      'Luth de taverne',
      'Luth du ménestrel',
      'Luth des troubadours',
      'Luth des sirènes',
      'Luth de l’Aurore chantante',
      'Luth des échos éternels'
    ]
  );
  // Un Barde reçoit son Luth : élément Harmonie sur la barre.
  g.setClass('barde', []);
  assert.equal(g.equipment.weapon.weaponType, 'lute');
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
  assert.match(g.CANAAN_CLASS.skillRider('lute', 2), /10 % de leurs PV max/);
});

test('Barde : Hymne de l’Aurore (F), soin immédiat, soin par seconde et dégâts +10 %', () => {
  const g = game();
  g.setClass('barde', []);
  g.P.mp = 100;
  g.P.mhp = 1000;
  g.P.hp = 100;
  assert.equal(g.CANAAN_CLASS.special(), true);
  assert.equal(g.P.mp, 40, 'Rythme : le double du prix en mana (30)');
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

test('Barde : Ballade, Crescendo, Dissonance, Tempo et Mélodie vivifiante', () => {
  const g = game();
  g.setClass('barde', [1, 0, 4, 7, 3]);
  predictable(g, 0.99);
  g.P.mhp = 10000;
  g.P.hp = 20;
  // Ballade réparatrice : soins +20 % (en plus du passif).
  const healed = g.canaanApplyHeal(100);
  assert.ok(near(healed, 100 * 1.1 * 1.2));
  // Mélodie vivifiante : le soin donne +15 % de vitesse et +8 % de dégâts pendant 5 s.
  const speed = g.characterStats().speed;
  assert.ok(near(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 108, 1e-9));
  g.advance(301);
  assert.equal(g.characterStats().speed, speed - 15);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 100);
  // Crescendo : +4 % par compétence offensive, 20 % au plus, 8 s (dégâts et soins).
  for (let i = 0; i < 7; i++) g.CANAAN_CLASS_CAST('lute', 0);
  assert.ok(near(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 120, 1e-9));
  assert.ok(near(g.canaanApplyHeal(100), 100 * 1.1 * 1.2 * 1.2));
  g.advance(481);
  assert.equal(g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage, 100);
  // Dissonance : une cible touchée par une compétence offensive subit +10 % pendant 6 s.
  const m = mob(1e7);
  g.CANAAN_COMBAT.attack(m, 100, skillHit('harmony'));
  g.advance(1);
  const ratio = () =>
    g.CANAAN_CLASS_ATTACK.before(m, 100, {}).damage / g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage;
  assert.ok(near(ratio(), 1.1, 1e-9));
  g.advance(361);
  assert.ok(near(ratio(), 1, 1e-9));
  // Tempo : tous les 20 de Rythme dépensés, les recharges baissent d'1 s.
  const h = game();
  h.setClass('barde', [7]);
  h.P.mp = 100;
  h.weaponCooldowns['lute:3'] = 10;
  h.CANAAN_CLASS_PAY(40);
  assert.equal(h.weaponCooldowns['lute:3'], 8);
});

test('Barde : Ritournelle (soin en trop en bouclier), Contre-chant, Note perçante et Grand final', () => {
  const g = game();
  g.setClass('barde', [8, 2]);
  g.P.mhp = 100;
  g.P.hp = 100;
  g.canaanApplyHeal(50);
  assert.equal(g.CANAAN_CLASS.audit().shield, 15, 'bouclier plafonné à 15 % des PV max');
  // Contre-chant : Accord dissonant protège le groupe même à pleine vie.
  const c = game();
  c.setClass('barde', [2]);
  c.P.mhp = c.P.hp = 100;
  c.P.mp = 100;
  c.useSkill(1);
  assert.equal(c.CANAAN_CLASS.audit().shield, 15);
  c.advance(301);
  assert.equal(c.CANAAN_CLASS.audit().shield, 0, 'le bouclier expire au bout de 5 s');
  // Note perçante : la note traverse et soigne 6 % des PV max.
  const n = game();
  n.setClass('barde', [6]);
  n.P.mhp = 1000;
  n.P.hp = 100;
  n.P.mp = 100;
  n.useSkill(0);
  assert.equal(n.projectiles.at(-1).pierce, true);
  assert.equal(n.P.hp, 166, '6 % des PV max, +10 %');
  // Grand final : la Symphonie se termine par un accord final qui frappe et soigne 15 % des PV max.
  const f = game();
  f.setClass('barde', [9]);
  f.P.mhp = 1e7;
  f.P.hp = 100;
  f.P.mp = 100;
  const t = mob(1e9);
  t.x = f.mouseWorldX;
  t.y = f.mouseWorldY;
  f.monsters = [t];
  f.useSkill(3);
  f.advance(150);
  const before = t.hp;
  f.advance(20);
  assert.ok(t.hp < before, 'l’accord final frappe');
});

test('Luth : quatre compétences lançables, chant de guérison sur la durée, symphonie qui frappe et soigne', () => {
  const g = game();
  // Secondaires fixes (sans bonus de Soin) : soins exacts ; le Barde soigne 10 % de plus.
  g.setClass('barde', []);
  g.refreshWeaponBar();
  g.P.mhp = 1000;
  g.P.hp = 100;
  g.P.mp = 100;
  // Chant de guérison : 12 % tout de suite, puis 2 % par seconde pendant 5 s ; l'utilitaire du Barde soigne 10 %.
  g.useSkill(2);
  assert.equal(g.P.hp, 100 + 132 + 110);
  g.advance(6 * 60);
  assert.equal(g.P.hp, 342 + 5 * 22);
  // Note éclatante : une note magique, et 4 % des PV max au plus blessé.
  g.P.mp = 100;
  g.useSkill(0);
  assert.equal(g.P.hp, 452 + 44);
  assert.equal(g.projectiles.at(-1).kind, 'note');
  // Symphonie : 5 ondes de 100 % sous la souris, chacune soigne.
  const m = mob(1e7);
  m.x = g.mouseWorldX;
  m.y = g.mouseWorldY;
  g.monsters = [m];
  g.P.x = g.mouseWorldX;
  g.P.y = g.mouseWorldY;
  g.P.mp = 100;
  g.useSkill(3);
  g.advance(150);
  assert.ok(m.hp < 1e7);
  assert.ok(g.P.hp > 496);
});

test('Luth en jeu : chez les marchands, porté par un Barde allié qui soigne, refusé à l’Invocateur', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;P.dead=false;game.world.instance=null');
  // Le marchand ne vend plus d'armes : chaque classe a la sienne.
  run('const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+30');
  assert.ok(!run('CANAAN_SHOP.stock(game.hero).some(i=>i.slot==="weapon")'));
  // Un compagnon Barde au Luth : son Écho soigne l'hôte blessé (le plus blessé du groupe).
  run(
    'globalThis.bard=canaanCreateHero({name:"Barde",x:P.x+40,y:P.y});bard.level=20;game.heroes.push(bard);CANAAN_CLASS.choose("barde",bard)'
  );
  assert.equal(run('bard.classe.id'), 'barde');
  assert.equal(run('bard.equipment.weapon.weaponType'), 'lute', 'le Barde reçoit son Luth');
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
