const { test } = require('node:test');
const { assert, game, mob, predictable, same, skillHit, source } = require('./helpers/context.cjs');

// Recharges remises à zéro : chaque test relance les compétences à volonté.
const ready = g => {
  for (const k of Object.keys(g.weaponCooldowns)) delete g.weaponCooldowns[k];
  g.P.mp = g.P.mmp;
};
const summons = g => g.CANAAN_SUMMONS.of(g.game.hero);
const kinds = g => summons(g).map(s => s.kind);

test('Invocateur : Grimoire lié de qualité Relique, au niveau du héros, qui grandit et disparaît avec la classe', () => {
  const g = game();
  g.setClass('invocateur', []);
  const w = g.equipment.weapon;
  same([w.weaponType, w.rarity, w.level, w.bound, w.name], ['grimoire', 'Relique', 60, 'invocateur', 'Évangile du Fléau éternel']);
  assert.equal(g.isBoundItem(w), true);
  assert.equal(g.rarityInfo(w).color, g.BOUND_RARITY.color, 'couleur de qualité propre à la Relique');
  same(Object.keys(w.sec).sort(), ['haste', 'mastery']);
  // L'épée portée est rangée dans le sac ; la barre montre les quatre invocations.
  same(g.inventory.map(i => i.weaponType), ['sword']);
  same(g.SKILLS.map(s => s.n), ['Squelette putride', 'Nuée de rats', 'Totem de peste', 'Abomination']);
  // Le Grimoire suit le niveau : nom par palier de 10 niveaux, statistiques qui montent avec lui.
  const stats = lv => {
    g.game.hero.level = lv;
    g.CANAAN_SUMMONS.syncPact(g.game.hero);
    return [g.equipment.weapon.level, g.equipment.weapon.name, g.itemPrimary(g.equipment.weapon).attack];
  };
  const [l1, l10, l20] = [stats(1), stats(10), stats(20)];
  same([l1[0], l1[1]], [1, 'Grimoire de l’apprenti']);
  same([l10[0], l10[1]], [10, 'Grimoire des sépultures']);
  same([l20[0], l20[1]], [20, 'Codex putride']);
  assert.ok(l1[2] < l10[2] && l10[2] < l20[2]);
  // La Relique est entre Rare (niveau 1) et Légendaire (niveau 60).
  assert.equal(g.qualityFactor('Relique', 1), g.QUALITY_FACTOR.Rare);
  assert.equal(g.qualityFactor('Relique', 60), g.QUALITY_FACTOR.Légendaire);
  // Jamais dans le butin ni chez les marchands.
  assert.equal(g.CRAFT_WEAPONS.includes('grimoire'), false);
  // Une autre classe : le Grimoire disparaît, la meilleure arme du sac revient dans la main.
  g.CANAAN_CLASS_STATE.import({ id: 'druide', talents: [] });
  assert.equal(g.equipment.weapon.weaponType, 'sword');
  assert.equal(g.inventory.length, 0);
  assert.equal(g.CANAAN_SUMMONS.syncPact(g.game.hero), false, 'rien à faire sans arme liée');
});

test('Peste noire : charges cumulables (8, ou 12 avec Virulence), dégâts chaque seconde, Nécrose et fin de l’effet', () => {
  const g = game();
  g.setClass('invocateur', [1]);
  predictable(g, 0.99);
  const m = mob(1e7);
  g.monsters = [m];
  for (let i = 0; i < 20; i++) g.CANAAN_COMBAT.attack(m, 10, skillHit('poison'));
  assert.equal(g.CANAAN_CLASS.plagueStacks(m), 8);
  // Nécrose : +2 % par charge.
  const marked = g.CANAAN_CLASS_ATTACK.before(m, 100, {}).damage,
    clean = g.CANAAN_CLASS_ATTACK.before(mob(100), 100, {}).damage;
  assert.ok(Math.abs(marked / clean - 1.16) < 1e-9);
  // Les attaques de base posent aussi la Peste.
  const b = mob(1e7);
  g.CANAAN_COMBAT.attack(b, 10, { basic: true, magic: true });
  assert.equal(g.CANAAN_CLASS.plagueStacks(b), 1);
  // Une seconde : la Peste ronge la cible, puis s'arrête au bout de 5 s.
  const hp = m.hp;
  g.advance(61);
  assert.ok(m.hp < hp, 'dégâts de la Peste');
  g.advance(6 * 60);
  assert.equal(g.CANAAN_CLASS.plagueStacks(m), 0);
  const after = m.hp;
  g.advance(120);
  assert.equal(m.hp, after);
  // Virulence : 12 charges au maximum.
  const v = game();
  v.setClass('invocateur', [0]);
  predictable(v, 0.99);
  const n = mob(1e7);
  v.monsters = [n];
  for (let i = 0; i < 20; i++) v.CANAAN_COMBAT.attack(n, 10, skillHit('poison'));
  assert.equal(v.CANAAN_CLASS.plagueStacks(n), 12);
  // Une autre classe ne pose pas de Peste.
  const d = game();
  d.setClass('druide', []);
  const o = mob(1e7);
  d.CANAAN_COMBAT.attack(o, 10, skillHit('nature'));
  assert.equal(d.CANAAN_CLASS.plagueStacks(o), 0);
});

test('Invocations : squelettes (3 au maximum), rats qui éclatent, totem de zone et abomination, qui frappent et empoisonnent', () => {
  const g = game();
  g.setClass('invocateur', []);
  predictable(g, 0.99);
  const m = mob(1e7);
  g.monsters = [m];
  // Squelette : il frappe la cible et pose la Peste.
  ready(g);
  g.useSkill(0);
  same(kinds(g), ['skeleton']);
  const hp = m.hp;
  g.advance(60);
  assert.ok(m.hp < hp, 'le squelette frappe');
  assert.ok(g.CANAAN_CLASS.plagueStacks(m) >= 1, 'chaque coup pose une charge de Peste');
  // Quatre lancers : trois squelettes, le plus ancien cède sa place.
  for (let i = 0; i < 3; i++) {
    ready(g);
    g.useSkill(0);
  }
  same(kinds(g), ['skeleton', 'skeleton', 'skeleton']);
  // Ils disparaissent au bout de 18 s.
  g.advance(18 * 60 + 2);
  same(kinds(g), []);
  // Nuée de rats : quatre rats qui éclatent au bout de 6 s (dégâts autour d'eux).
  ready(g);
  g.useSkill(1);
  same(kinds(g), ['rat', 'rat', 'rat', 'rat']);
  g.advance(5 * 60);
  const beforeBurst = m.hp;
  g.advance(70);
  same(kinds(g), []);
  assert.ok(m.hp < beforeBurst, 'les rats éclatent');
  // Totem : sous la souris (100, 0), il frappe chaque seconde les ennemis à 3 cases.
  ready(g);
  g.useSkill(2);
  const totem = summons(g)[0];
  same([totem.kind, Math.round(totem.x), Math.round(totem.y)], ['totem', 100, 0]);
  const t0 = m.hp;
  g.advance(65);
  assert.ok(m.hp < t0, 'le totem empoisonne la zone');
  const far = mob(1e7);
  far.x = 2000;
  g.monsters.push(far);
  g.advance(120);
  assert.equal(far.hp, far.mhp, 'hors de la zone');
  // Abomination : une seule à la fois.
  ready(g);
  g.useSkill(3);
  ready(g);
  g.useSkill(3);
  assert.equal(kinds(g).filter(k => k === 'abomination').length, 1);
  // Une autre classe renvoie toutes les invocations.
  g.CANAAN_CLASS_STATE.import({ id: 'paladin', talents: [] });
  g.advance(1);
  same(kinds(g), []);
});

test('Talents de l’Invocateur : Légion, Os éternels, Cadavres explosifs, Carapace d’os, Pandémie, Pacte de sang, Moisson d’âmes, Siphon', () => {
  // Légion : quatre squelettes ; Os éternels : 30 % plus longtemps.
  const g = game();
  g.setClass('invocateur', [3, 2]);
  predictable(g, 0.99);
  g.monsters = [];
  for (let i = 0; i < 5; i++) {
    ready(g);
    g.useSkill(0);
  }
  assert.equal(kinds(g).length, 4);
  g.advance(19 * 60);
  assert.equal(kinds(g).length, 4, 'encore là après 19 s');
  g.advance(5 * 60);
  assert.equal(kinds(g).length, 0);
  // Carapace d'os : 10 % de dégâts en moins avec au moins deux invocations.
  const c = game();
  c.setClass('invocateur', [6]);
  const guard = c.characterStats().guard;
  ready(c);
  c.useSkill(0);
  assert.equal(c.characterStats().guard, guard);
  ready(c);
  c.useSkill(0);
  assert.equal(c.characterStats().guard, guard + 10);
  // Cadavres explosifs : un squelette remplacé explose et pose 3 charges.
  const e = game();
  e.setClass('invocateur', [4]);
  predictable(e, 0.99);
  const target = mob(1e7);
  target.x = 1000;
  e.monsters = [target];
  for (let i = 0; i < 3; i++) {
    ready(e);
    e.useSkill(0);
  }
  target.x = 40;
  ready(e);
  e.useSkill(0);
  assert.equal(e.CANAAN_CLASS.plagueStacks(target), 3);
  // Pandémie : un ennemi qui meurt sous la Peste en transmet la moitié aux ennemis proches.
  const p = game();
  p.setClass('invocateur', [7]);
  predictable(p, 0.99);
  const dying = mob(1e7),
    next = mob(1e7);
  next.x = 70;
  p.monsters = [dying, next];
  for (let i = 0; i < 8; i++) p.CANAAN_COMBAT.attack(dying, 1, skillHit('poison'));
  const before = p.CANAAN_CLASS.plagueStacks(next);
  dying.hp = 1;
  p.CANAAN_COMBAT.attack(dying, 50, skillHit('poison'));
  assert.equal(dying.hp <= 0, true);
  assert.equal(p.CANAAN_CLASS.plagueStacks(next), before + 4);
  // Pacte de sang : sous 35 % de PV, la plus ancienne invocation est sacrifiée pour 15 % des PV max.
  const b = game();
  b.setClass('invocateur', [8]);
  b.monsters = [];
  ready(b);
  b.useSkill(0);
  b.P.mhp = 100;
  b.P.hp = 20;
  b.advance(1);
  assert.equal(kinds(b).length, 0);
  assert.equal(b.P.hp, 35);
  b.P.hp = 20;
  ready(b);
  b.useSkill(0);
  b.advance(1);
  assert.equal(kinds(b).length, 1, 'recharge de 40 s');
  // Moisson d'âmes : 12 charges posées lèvent un squelette gratuit.
  const h = game();
  h.setClass('invocateur', [9]);
  predictable(h, 0.99);
  const foe = mob(1e7);
  h.monsters = [foe];
  for (let i = 0; i < 11; i++) h.CANAAN_COMBAT.attack(foe, 1, skillHit('poison'));
  assert.equal(kinds(h).length, 0);
  h.CANAAN_COMBAT.attack(foe, 1, skillHit('poison'));
  same(kinds(h), ['skeleton']);
  // Siphon pestilentiel : la Peste soigne de 10 % de ses dégâts.
  const s = game();
  s.setClass('invocateur', [5]);
  predictable(s, 0.99);
  const sick = mob(1e7);
  s.monsters = [sick];
  for (let i = 0; i < 8; i++) s.CANAAN_COMBAT.attack(sick, 1, skillHit('poison'));
  s.P.mhp = 1e6;
  s.P.hp = 10;
  s.advance(61);
  assert.ok(s.P.hp > 10, 'soigné par sa Peste');
});

test('Contagion (F) : 4 charges de Peste à 7 cases et invocations 30 % plus rapides pendant 8 s', () => {
  const g = game();
  g.setClass('invocateur', []);
  const near = mob(1e7),
    far = mob(1e7);
  far.x = 2000;
  g.monsters = [near, far];
  g.P.mp = 100;
  assert.equal(g.CANAAN_CLASS.special(), true);
  assert.equal(g.P.mp, 70);
  same([g.CANAAN_CLASS.plagueStacks(near), g.CANAAN_CLASS.plagueStacks(far)], [4, 0]);
  assert.equal(g.CANAAN_CLASS.summonHaste(g.game.hero), 1.3);
  g.advance(8 * 60 + 1);
  assert.equal(g.CANAAN_CLASS.summonHaste(g.game.hero), 1);
  assert.equal(g.CANAAN_CLASS.special(), false, 'recharge de 40 s');
  // Info-bulle : l'effet de la classe sur les invocations.
  assert.ok(g.CANAAN_CLASS.skillRider('grimoire', 0, g.game.hero).includes('Peste'));
});

test('Arme liée en jeu : rien ne l’enlève ni ne la remplace, sac plein refusé, brillance Relique et choix des classes en pages', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('globalThis.__panels=[];modernPanel=h=>__panels.push(h);started=true;paused=false;game.hero.level=20');
  // Sans classe, le choix s'ouvre sur une seule page, avec ses flèches et une icône par classe.
  run('renderTalents()');
  let html = run('__panels.at(-1)');
  assert.equal((html.match(/class="class-page"/g) || []).length, 1);
  assert.equal((html.match(/data-action="classPage"/g) || []).length, 2);
  assert.equal((html.match(/data-action="classPageTo"/g) || []).length, 5);
  assert.ok(html.includes('Druide') && html.includes('1 / 5'));
  run('classPage(-1)');
  html = run('__panels.at(-1)');
  assert.ok(html.includes('Choisir Invocateur') && html.includes('Arme liée') && html.includes('Relique'));
  run('classPage(1);classPageTo(2)');
  assert.ok(run('__panels.at(-1)').includes('Choisir Assassin'));
  // Sac plein : il faut de la place pour ranger l'arme portée.
  run('equipment.weapon={id:"epee",slot:"weapon",level:1,rarity:"Commun",weaponType:"sword"};CANAAN_GEAR.normalize(equipment.weapon)');
  run('globalThis.__bag=inventory.slice();while(canaanBagUsed(game.hero)<canaanBagLimit(game.hero))inventory.push({id:"f"+inventory.length,slot:"ring",level:1,rarity:"Commun"})');
  run('chooseClass("invocateur")');
  assert.equal(run('game.hero.classe.id'), null);
  run('inventory.length=0;inventory.push(...__bag)');
  // Devenir Invocateur : le Grimoire en main, l'ancienne arme dans le sac.
  run('chooseClass("invocateur")');
  same(JSON.parse(run('JSON.stringify([game.hero.classe.id,equipment.weapon.weaponType,equipment.weapon.level,equipment.weapon.rarity])')), ['invocateur', 'grimoire', 20, 'Relique']);
  assert.ok(run('inventory.some(i=>i.id==="epee")'), 'l’épée est rangée dans le sac');
  // Rien ne l'enlève : retirer, équiper une autre arme, la réserve, changer d'arme.
  run('inventory.push({id:"arc",slot:"weapon",level:1,rarity:"Rare",weaponType:"bow"})');
  assert.equal(run('unequip("weapon")'), false);
  assert.equal(run('equipItem("arc")'), false);
  assert.equal(run('equipReserveWeapon(inventory.findIndex(i=>i.id==="arc"))'), false);
  assert.equal(run('CANAAN_EQUIPMENT.switchHero(game.hero)'), false);
  assert.equal(run('equipment.weapon.weaponType'), 'grimoire');
  // Fiche du personnage : la case brille comme une Relique ; info-bulle d'arme liée.
  run('renderCharacter()');
  assert.ok(run('__panels.at(-1)').includes('data-prestige="relique"'));
  // Montée de niveau : le Grimoire grandit aussi.
  run('game.hero.exp=0;CANAAN_PROGRESSION.grantXp(game.hero,xpToNext(game.hero.level))');
  assert.equal(run('game.hero.level'), 21);
  assert.equal(run('equipment.weapon.level'), run('game.hero.level'));
  assert.equal(errors.length, 0, errors.join('\n'));
});
