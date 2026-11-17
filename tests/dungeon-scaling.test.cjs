const { test } = require('node:test');
const {
  assert,
  source
} = require('./helpers/context.cjs');

test('Donjons et raids selon le nombre de joueurs : PV ×1 / ×1,7 / ×2,4 / ×3,1 et dégâts ×1 / ×1 / ×1,05 / ×1,1',()=>{
 const measure=n=>{
  const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
  run('started=true;paused=false;P.dead=false;game.view.chat=()=>{};toast=()=>{}');
  run('game.hero.level=32;game.hero.equipment={...game.hero.equipment,'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+k+'",slot:"'+k+'",level:32,rarity:"Rare",weaponType:"sword"}').join(',')+'};recomputeStats()');
  for(let k=1;k<n;k++)run('game.heroes.push(canaanCreateHero({name:"A'+k+'",x:P.x,y:P.y}))');
  run('enterInstance(0)');
  const out={group:run('game.world.instance.group'),trash:run('game.world.monsters.find(m=>!m.boss).mhp'),boss:run('game.world.monsters.find(m=>m.boss).mhp'),
   dmg:run('CANAAN_ENEMY_RAW_DAMAGE(game.world.monsters.find(m=>!m.boss))')};
  run('leaveInstance()');out.after=run('canaanGroupScale().hp');assert.equal(errors.length,0,errors.join('\n'));return out;
 };
 const one=measure(1),two=measure(2),four=measure(4);
 assert.deepEqual([one.group,two.group,four.group],[1,2,4]);
 assert.ok(Math.abs(two.trash/one.trash-1.7)<0.02&&Math.abs(four.trash/one.trash-3.1)<0.02,'PV des ennemis : '+[one.trash,two.trash,four.trash]);
 assert.ok(Math.abs(four.boss/one.boss-3.1)<0.02,'PV du boss');
 assert.ok(Math.abs(two.dmg/one.dmg-1)<1e-9&&Math.abs(four.dmg/one.dmg-1.1)<1e-9,'dégâts des ennemis');
 assert.equal(four.after,1,'hors instance : ×1');
});
