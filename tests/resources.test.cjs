// Ressources des classes (shared/rules/resources.js) : mana qui grandit avec le niveau, Énergie de l'Assassin,
// Ferveur du Paladin, Rythme du Barde, et PV du Berserker (pas de barre).
const { test } = require('node:test');
const { assert, game, mob, same, basicHit, source } = require('./helpers/context.cjs');

test('Ressources : une par classe, maximum et coût selon le niveau', () => {
  const g = game();
  same(
    g.CLASSES.map(c => [c.id, g.classResource(c.id)]),
    [
      ['druide', 'mana'],
      ['paladin', 'fervor'],
      ['assassin', 'energy'],
      ['elementaliste', 'mana'],
      ['invocateur', 'mana'],
      ['barde', 'rhythm'],
      ['berserker', 'blood']
    ]
  );
  assert.equal(g.classResource(null), 'mana', 'sans classe : du mana');
  // Mana : 250 au niveau 1, +5 par niveau ; coûts +1 % par niveau.
  same([1, 30, 60].map(lv => g.resourceMax('mana', lv)), [250, 395, 545]);
  same([1, 30, 60].map(lv => g.resourceCost('mana', 20, lv)), [20, 26, 32]);
  // Énergie, Ferveur, Rythme : 100 à tout niveau, le double du prix en mana ; pas de barre pour le Berserker.
  same(['energy', 'fervor', 'rhythm', 'blood'].map(k => g.resourceMax(k, 60)), [100, 100, 100, 0]);
  same(['energy', 'fervor', 'rhythm'].map(k => g.resourceCost(k, 12, 1)), [24, 24, 24]);
  // Régénération : le mana selon son maximum, l'Énergie toujours, la Ferveur et le Rythme retombent hors combat.
  same(
    [
      g.resourceRegen('mana', 500, false),
      g.resourceRegen('mana', 500, true),
      g.resourceRegen('energy', 100, true),
      g.resourceRegen('fervor', 100, true),
      g.resourceRegen('fervor', 100, false),
      g.resourceRegen('rhythm', 100, false),
      g.resourceRegen('blood', 0, true)
    ],
    [10, 5, 12, 2, -8, -8, 0]
  );
  // Berserker : 0,6 % des PV max par point de mana au niveau 1, 1 % au niveau 60.
  same([1, 60].map(lv => g.resourceBloodCost(1000, 10, lv)), [60, 100]);
  assert.equal(g.resourceBloodCost(145, 10, 4), 9, 'niveau 4 avec 145 PV : 9 PV pour 10 de mana');
});

test('Ressources : maximum du héros selon sa classe, coût des compétences et du sort spécial', () => {
  const g = game();
  g.setClass('assassin', []);
  assert.equal(g.characterStats().maxMp, 100);
  assert.equal(g.CANAAN_CLASS.resource(), 'energy');
  // Voile d'ombre (20 de mana) : 40 d'Énergie.
  assert.equal(g.CANAAN_CLASS.specialPrice(), 40);
  g.P.mp = 39;
  assert.equal(g.CANAAN_CLASS.special(), false, 'pas assez d’Énergie');
  g.P.mp = 100;
  assert.equal(g.CANAAN_CLASS.special(), true);
  assert.equal(g.P.mp, 60);
  // Compétence : le double du prix en mana.
  assert.equal(g.CANAAN_CLASS_MANA_COST('dualdagger', 0, 11), 22);
  g.setClass('elementaliste', []);
  assert.equal(g.characterStats().maxMp, 545, 'mana au niveau 60');
});

test('Ferveur (Paladin) : monte avec les attaques de base et les coups reçus ; Rythme (Barde) avec les attaques de base', () => {
  const g = game();
  g.setClass('paladin', []);
  g.P.mmp = 100;
  g.P.mp = 0;
  const m = mob(1e7);
  g.monsters = [m];
  g.CANAAN_COMBAT.attack(m, 100, basicHit);
  assert.equal(g.P.mp, 6, 'attaque de base : +6');
  // Une attaque de zone ne compte qu'une fois : rien de plus dans le même instant.
  g.CANAAN_COMBAT.attack(mob(1e7), 100, basicHit);
  assert.equal(g.P.mp, 6);
  g.advance(20);
  g.CANAAN_COMBAT.attack(m, 100, basicHit);
  assert.equal(g.P.mp, 12);
  // Coup reçu : +3, plus 150 % de la part des PV max perdue (20 au plus).
  g.P.mhp = 1000;
  g.CANAAN_CLASS_DEFENSE({}, 100);
  assert.equal(g.P.mp, 30);
  g.CANAAN_CLASS_DEFENSE({}, 900);
  assert.equal(g.P.mp, 50);
  // Une compétence ne la remplit pas : seuls les coups de base comptent.
  const b = game();
  b.setClass('barde', []);
  b.P.mmp = 100;
  b.P.mp = 0;
  b.CANAAN_COMBAT.attack(mob(1e7), 100, basicHit);
  assert.equal(b.P.mp, 8, 'Rythme : +8 par note');
  b.CANAAN_CLASS_DEFENSE({}, 100);
  assert.equal(b.P.mp, 8, 'les coups reçus ne donnent pas de Rythme');
  // Les autres classes ne gagnent rien.
  const d = game();
  d.setClass('druide', []);
  d.P.mp = 0;
  d.CANAAN_COMBAT.attack(mob(1e7), 100, basicHit);
  assert.equal(d.P.mp, 0);
});

test('Ressources en jeu : régénération, barre colorée selon la classe, cachée pour le Berserker', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  assert.equal(errors.length, 0, errors.join('\n'));
  run('started=true;paused=false;P.dead=false;toast=()=>{};game.hero.level=1');
  run('chooseClass("assassin");recomputeStats()');
  assert.equal(run('P.mmp'), 100);
  same(JSON.parse(run('JSON.stringify(canaanRegenRates(true))')).mana, 12);
  run('chooseClass("paladin");recomputeStats()');
  same(JSON.parse(run('JSON.stringify(canaanRegenRates(false))')).mana, -8);
  // La Ferveur retombe hors combat, jamais sous zéro.
  run('P.mp=4;for(let i=0;i<60;i++)update()');
  assert.equal(run('P.mp'), 0);
  // Barre : couleur de la ressource ; le Berserker n'en a pas.
  const bar = () => run('updateView();{const b=document.getElementById("mpb").parentElement;b.className+"|"+b.style.display}');
  assert.equal(bar(), 'bar mp res-fervor|');
  run('chooseClass("berserker");recomputeStats()');
  assert.equal(run('P.mmp'), 0);
  assert.equal(bar(), 'bar mp res-blood|none');
  assert.equal(errors.length, 0, errors.join('\n'));
});
