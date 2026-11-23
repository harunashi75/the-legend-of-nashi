// Berserker (classe qui paie ses compétences en PV) et sa Grande hache liée.
const { test } = require('node:test');
const { assert, game, mob, predictable, same, skillHit, basicHit, source } = require('./helpers/context.cjs');

const near = (a, b, eps = 1) => Math.abs(a - b) <= eps;
// Recharges remises à zéro : chaque test relance les compétences à volonté.
const ready = g => {
  for (const k of Object.keys(g.weaponCooldowns)) delete g.weaponCooldowns[k];
};
// Dégâts d'un coup de 100 avec les multiplicateurs de classe, contre une cible neuve.
const hit100 = (g, m = mob(100)) => g.CANAAN_CLASS_ATTACK.before(m, 100, {}).damage;

test('Berserker : Grande hache liée de qualité Relique, élément Sang, qui grandit et disparaît avec la classe', () => {
  const g = game();
  const c = g.CLASSES.find(k => k.id === 'berserker');
  assert.ok(c, 'le Berserker est une classe');
  assert.equal(c.talents.length, 10);
  same(c.elements, ['blood', 'blood', 'blood', 'blood']);
  assert.equal(g.ELEMENTS.blood.name, 'Sang');
  assert.equal(g.boundWeaponOf('berserker'), 'greataxe');
  assert.equal(c.special.mana, 0, 'la Rage écarlate ne coûte pas de mana');
  // La Grande hache : jamais dans le butin, physique, et sa troisième compétence est utilitaire.
  assert.equal(g.CRAFT_WEAPONS.includes('greataxe'), false);
  assert.equal(g.MAGIC_WEAPONS.includes('greataxe'), false);
  same(
    [0, 1, 2, 3].map(i => g.isOffensiveSkill('greataxe', i)),
    [true, true, false, true]
  );
  g.setClass('berserker', []);
  const w = g.equipment.weapon;
  same(
    [w.weaponType, w.rarity, w.level, w.bound, w.name],
    ['greataxe', 'Relique', 60, 'berserker', 'Faucheuse des mille batailles']
  );
  assert.equal(g.isBoundItem(w), true);
  same(
    g.inventory.map(i => i.weaponType),
    ['sword']
  );
  same(
    g.SKILLS.map(s => s.n),
    ['Fendoir', 'Bond du boucher', 'Hurlement sanguinaire', 'Châtiment du sang']
  );
  assert.equal(g.CANAAN_CLASS_CAST('greataxe', 0).element, 'blood');
  assert.equal(g.CANAAN_CLASS_CAST('greataxe', 0).magic, false);
  // Un nom par palier de 10 niveaux.
  same(
    [1, 10, 20, 30, 40, 50].map(lv => g.relicName('greataxe', lv)),
    [
      'Hache du maraudeur',
      'Fendoir des clans',
      'Grande hache sanglante',
      'Hache du carnage',
      'Dévoreuse écarlate',
      'Faucheuse des mille batailles'
    ]
  );
  // Une autre classe : la hache disparaît, l'épée du sac revient dans la main.
  g.CANAAN_CLASS_STATE.import({ id: 'druide', talents: [] });
  assert.equal(g.equipment.weapon.weaponType, 'sword');
  assert.equal(g.inventory.length, 0);
});

test('Soif de sang : les compétences coûtent des PV (0,6 % des PV max par point de mana au niveau 1, 1 % au niveau 60), jamais mortelles', () => {
  const g = game();
  g.setClass('berserker', []);
  g.monsters = [];
  g.P.mhp = 1000;
  g.P.hp = 1000;
  g.P.mp = 0;
  // Niveau 60 : 1 % des PV max par point de mana ; niveau 1 : 0,6 %.
  assert.equal(g.CANAAN_CLASS.bloodCost(g.game.hero, 10), 100);
  g.game.hero.level = 1;
  assert.equal(g.CANAAN_CLASS.bloodCost(g.game.hero, 10), 60);
  g.game.hero.level = 60;
  // Pas de barre de mana.
  assert.equal(g.characterStats().maxMp, 0);
  assert.equal(g.CANAAN_CLASS.resource(), 'blood');
  // Fendoir (10 de mana) : 100 PV, pas de mana.
  ready(g);
  g.useSkill(0);
  assert.equal(g.P.hp, 900);
  assert.equal(g.P.mp, 0);
  assert.ok(g.weaponCooldowns['greataxe:0'] > 0, 'la compétence est lancée');
  // Châtiment du sang (24 de mana, 240 PV) avec 200 PV : refusé, rien n'est retiré.
  g.P.hp = 200;
  ready(g);
  g.useSkill(3);
  assert.equal(g.P.hp, 200);
  assert.ok(!g.weaponCooldowns['greataxe:3'], 'pas de recharge sans paiement');
  assert.equal(g.CANAAN_CLASS_CAN_PAY(24), false);
  // Il faut garder au moins 1 PV : 241 PV suffisent, 240 non.
  g.P.hp = 240;
  assert.equal(g.CANAAN_CLASS_CAN_PAY(24), false);
  g.P.hp = 241;
  assert.equal(g.CANAAN_CLASS_PAY(24), true);
  assert.equal(g.P.hp, 1);
  // Les autres classes paient toujours en mana.
  const d = game();
  d.setClass('druide', []);
  d.P.mp = 30;
  assert.equal(d.CANAAN_CLASS.bloodCost(d.game.hero, 10), null);
  assert.equal(d.CANAAN_CLASS_PAY(10), true);
  assert.equal(d.P.mp, 20);
  assert.equal(d.CANAAN_CLASS_PAY(25), false);
  assert.equal(d.P.mp, 20);
  // Info-bulle : l'effet de la classe.
  assert.match(g.CANAAN_CLASS.skillRider('greataxe', 0), /Berserker : se paie en PV/);
  assert.match(g.CANAAN_CLASS.skillRider('greataxe', 2), /30 % des dégâts/);
});

test('Soif de sang : +1 % de dégâts par tranche de 2 % de PV perdus, vol de vie des compétences offensives, doublé après une utilitaire', () => {
  const g = game();
  g.setClass('berserker', []);
  predictable(g, 0.99);
  g.P.mhp = 1000;
  g.P.hp = 1000;
  assert.equal(hit100(g), 100);
  g.P.hp = 500;
  assert.ok(near(hit100(g), 125, 1e-9));
  g.P.hp = 1;
  assert.ok(near(hit100(g), 149, 1e-9), '50 % au plus');
  // Vol de vie : 15 % des dégâts d'une compétence offensive.
  g.P.mhp = 100000;
  g.P.hp = 50000;
  const m = mob(1e7);
  let before = m.hp,
    hp = g.P.hp;
  g.CANAAN_COMBAT.attack(m, 100, skillHit('blood'));
  let dealt = before - m.hp;
  assert.ok(dealt > 0);
  assert.ok(near(g.P.hp - hp, dealt * 0.15));
  // L'attaque de base ne vole pas de vie.
  hp = g.P.hp;
  g.CANAAN_COMBAT.attack(m, 100, basicHit);
  assert.equal(g.P.hp, hp);
  // Une compétence utilitaire double le vol de vie de la compétence offensive suivante (une seule).
  g.CANAAN_CLASS_AFTER_CAST('greataxe', 2);
  const context = g.CANAAN_CLASS_CAST('greataxe', 0);
  assert.equal(context.thirst, true);
  assert.equal(g.CANAAN_CLASS_CAST('greataxe', 0).thirst, undefined);
  before = m.hp;
  hp = g.P.hp;
  g.CANAAN_COMBAT.attack(m, 100, context);
  dealt = before - m.hp;
  assert.ok(near(g.P.hp - hp, dealt * 0.3));
});

test('Rage écarlate (F) : pas sous 1 PV, attaques de base plus rapides, soins doublés, puis 20 % des PV perdus', () => {
  const g = game();
  g.setClass('berserker', []);
  g.P.mhp = 1000;
  g.P.hp = 1000;
  g.P.mp = 0;
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(), 1);
  assert.equal(g.CANAAN_CLASS.special(), true, 'sans mana');
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(), 0.8);
  // Un coup fatal laisse 1 PV.
  g.CANAAN_COMBAT.hurt(99999);
  assert.equal(g.P.hp, 1);
  // Soins doublés.
  assert.equal(g.canaanApplyHeal(100), 200);
  // À la fin : 20 % des PV max perdus.
  g.P.hp = 1000;
  g.advance(8 * 60 + 1);
  assert.equal(g.P.hp, 800);
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(), 1);
  // La perte ne tue jamais.
  g.advance(60 * 60);
  assert.equal(g.CANAAN_CLASS.special(), true);
  g.P.hp = 50;
  g.advance(8 * 60 + 1);
  assert.equal(g.P.hp, 1);
  // Recharge de 60 s.
  assert.equal(g.CANAAN_CLASS.special(), false);
});

test('Berserker : Peau de fer, Cicatrices, Saignée, Curée et Dernier carré', () => {
  const g = game();
  g.setClass('berserker', [3]);
  g.P.mhp = 1000;
  g.P.hp = 500;
  assert.equal(g.CANAAN_CLASS_DEFENSE(null, 100), 90, '50 % des PV perdus : −10 %');
  g.P.hp = 1;
  assert.equal(g.CANAAN_CLASS_DEFENSE(null, 100), 82, '18 % au plus');
  // Cicatrices : +2 % par coup subi (10 au plus), 3 pour un critique, 6 s.
  const s = game();
  s.setClass('berserker', [1]);
  s.P.mhp = s.P.hp = 1000;
  for (let i = 0; i < 3; i++) s.CANAAN_CLASS_DEFENSE(null, 10);
  assert.ok(near(hit100(s), 106, 1e-9));
  s.CANAAN_CLASS_ON_CRIT_TAKEN();
  assert.equal(s.CANAAN_CLASS.audit().scars, 5);
  for (let i = 0; i < 10; i++) s.CANAAN_CLASS_DEFENSE(null, 10);
  assert.equal(s.CANAAN_CLASS.audit().scars, 10);
  s.advance(6 * 60 + 1);
  assert.equal(hit100(s), 100);
  // Saignée et Curée : la compétence fait saigner ; une cible qui saigne subit +15 %.
  const b = game();
  b.setClass('berserker', [4, 5]);
  predictable(b, 0.99);
  b.P.mhp = b.P.hp = 1000;
  const m = mob(1e7);
  b.monsters = [m];
  b.CANAAN_COMBAT.attack(m, 100, skillHit('blood'));
  assert.ok(m._clsDots.some(d => d.kind === 'bleed' && d.element === 'blood'));
  assert.ok(near(hit100(b, m) / hit100(b), 1.15, 1e-9));
  const hp = m.hp;
  b.advance(61);
  assert.ok(m.hp < hp, 'le saignement ronge la cible');
  // Dernier carré : sous 15 % de PV, 45 % des dégâts rendus.
  const l = game();
  l.setClass('berserker', [2]);
  predictable(l, 0.99);
  l.P.mhp = 100000;
  l.P.hp = 1000;
  const t = mob(1e7),
    before = t.hp,
    life = l.P.hp;
  l.CANAAN_COMBAT.attack(t, 100, skillHit('blood'));
  assert.ok(near(l.P.hp - life, (before - t.hp) * 0.45));
});

test('Berserker : Frénésie, Carnage, Sang bouillant, Cri de guerre et Immortel', () => {
  const g = game();
  g.setClass('berserker', [0, 8]);
  predictable(g, 0.99);
  g.P.mhp = 1000;
  g.P.hp = 500;
  g.weaponCooldowns['greataxe:0'] = 5;
  g.weaponCooldowns['greataxe:3'] = 1;
  const m = mob(5);
  g.monsters = [m];
  g.CANAAN_COMBAT.attack(m, 1000, skillHit('blood'));
  assert.ok(m.hp <= 0);
  // Frénésie : recharges −2 s ; Carnage : 4 % des PV max (en plus du vol de vie).
  assert.ok(near(g.weaponCooldowns['greataxe:0'], 3, 1e-9));
  assert.equal(g.weaponCooldowns['greataxe:3'], 0);
  assert.ok(g.P.hp - 500 >= 40);
  // Une seule fois par ennemi.
  const hp = g.P.hp;
  g.CANAAN_COMBAT.attack(m, 1000, skillHit('blood'));
  assert.ok(g.P.hp - hp < 40);
  // Sang bouillant : 25 % des PV max dépensés font exploser le sang autour du Berserker.
  const b = game();
  b.setClass('berserker', [6]);
  b.P.mhp = b.P.hp = 1000;
  const foe = mob(1e7);
  b.monsters = [foe];
  b.CANAAN_CLASS_PAY(10);
  assert.equal(foe.hp, 1e7, '100 PV dépensés : pas encore');
  b.CANAAN_CLASS_PAY(15);
  assert.ok(foe.hp < 1e7, '250 PV dépensés : explosion');
  // Cri de guerre : sous 50 % de PV en combat, +10 % de dégâts pendant 6 s ; recharge 30 s.
  const w = game();
  w.setClass('berserker', [7]);
  predictable(w, 0.99);
  w.P.mhp = 1000;
  w.P.hp = 1000;
  const target = mob(1e7);
  w.monsters = [target];
  w.CANAAN_COMBAT.attack(target, 10, basicHit);
  w.P.hp = 400;
  const plain = hit100(w);
  w.advance(1);
  assert.ok(near(hit100(w) / plain, 1.1, 1e-9));
  w.advance(6 * 60 + 1);
  assert.ok(near(hit100(w), plain, 1e-9));
  // Immortel : un coup fatal laisse 1 PV et lance une Rage de 4 s, sans perte de PV à la fin ; recharge 90 s.
  const u = game();
  u.setClass('berserker', [9]);
  u.P.mhp = 1000;
  u.P.hp = 300;
  u.CANAAN_COMBAT.hurt(5000);
  assert.equal(u.P.hp, 1);
  assert.equal(u.CANAAN_CLASS.raging(), true);
  u.P.hp = 500;
  u.advance(4 * 60 + 1);
  assert.equal(u.P.hp, 500);
  assert.equal(u.CANAAN_CLASS.raging(), false);
  u.CANAAN_COMBAT.hurt(5000);
  assert.ok(u.P.hp <= 0, 'une seule fois toutes les 90 s');
});

test('Grande hache : Fendoir, Bond du boucher qui étourdit, Hurlement (Rage +25 %) et Châtiment à 700 % sous 30 % de PV', () => {
  const g = game();
  g.setClass('berserker', []);
  predictable(g, 0.99);
  g.P.mhp = 100000;
  g.P.hp = 100000;
  const m = mob(1e9),
    boss = { ...mob(1e9), boss: true };
  g.monsters = [m, boss];
  ready(g);
  let hp = m.hp;
  g.useSkill(0);
  assert.ok(m.hp < hp, 'le Fendoir touche');
  // Bond : le héros avance vers la souris (100, 0) ; impact qui étourdit les monstres, pas les boss.
  const x = g.P.x;
  ready(g);
  hp = m.hp;
  g.useSkill(1);
  assert.ok(g.P.x > x, 'le héros bondit');
  assert.ok(m.hp < hp);
  assert.ok(m.spell_stun > 0);
  assert.ok(!(boss.spell_stun > 0));
  // Hurlement : Rage de 6 s et ennemis proches affaiblis.
  ready(g);
  g.useSkill(2);
  assert.equal(g.CANAAN_SKILLS.state(g.game.hero).berserk, 6);
  assert.ok(m.v1746_weak > 0);
  // Châtiment : 450 %, ou 700 % sous 30 % de PV (même Rage, même cible).
  // Les PV sont payés avant le coup : la Soif de sang compte avec les PV restants.
  const price = g.CANAAN_CLASS.bloodCost(g.game.hero, 24),
    thirst = life => 1 + Math.floor((1 - (life - price) / 100000) * 50 + 1e-9) / 100;
  const strike = life => {
    const t = mob(1e9);
    g.monsters = [t];
    // Le Bond a porté le héros au-delà de la cible : il revient devant elle.
    g.P.x = 0;
    g.P.hp = life;
    ready(g);
    g.useSkill(3);
    return (1e9 - t.hp) / thirst(life);
  };
  // Le Châtiment coûte 24 000 PV (1 % des PV max par point de mana) : 50 000 PV en laissent 26 000 (sous 30 %).
  const full = strike(100000),
    low = strike(50000);
  assert.ok(near(low / full, 7 / 4.5, 0.02));
});

test('Berserker en jeu : choix de la classe, Grande hache en main, coûts en PV dans les info-bulles', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('globalThis.__panels=[];modernPanel=h=>__panels.push(h);started=true;paused=false;game.hero.level=20');
  run('renderTalents();classPageTo(6)');
  const page = run('__panels.at(-1)');
  assert.ok(
    page.includes('Choisir Berserker') && page.includes('Grande hache') && page.includes('Sans coût') && page.includes('Ressource · PV')
  );
  run('chooseClass("berserker")');
  same(
    JSON.parse(
      run(
        'JSON.stringify([game.hero.classe.id,equipment.weapon.weaponType,equipment.weapon.level,equipment.weapon.name])'
      )
    ),
    ['berserker', 'greataxe', 20, 'Grande hache sanglante']
  );
  // Info-bulles : prix en PV, empreinte de la classe, sort sans coût.
  const tip = run('canaanSkillTooltip(0)');
  assert.match(tip, /Recharge 5 s · \d+ PV/);
  assert.ok(tip.includes('Berserker'));
  assert.ok(run('canaanSkillTooltip("special")').includes('Sans coût · recharge 60 s'));
  // Lancer une compétence retire des PV, pas de mana.
  run('P.hp=P.mhp;globalThis.__mp=P.mp;for(const k in weaponCooldowns)delete weaponCooldowns[k];useSkill(0)');
  assert.ok(run('P.hp<P.mhp'));
  assert.equal(run('P.mp===__mp'), true);
  // Rien ne l'enlève.
  assert.equal(run('unequip("weapon")'), false);
  assert.equal(run('equipment.weapon.weaponType'), 'greataxe');
  assert.equal(errors.length, 0, errors.join('\n'));
});
