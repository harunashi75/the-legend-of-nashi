const { test } = require('node:test');
const {
  assert,
  groupInDungeon,
  playInstance
} = require('./helpers/context.cjs');

test('Jalon de la phase 2 : quatre héros finissent un raid de six boss, deux passages secrets, chacun son butin',()=>{
 // Le Bastion du Roi Sanglant, sans les monstres de passage (le test reste court) : six portes scellées, deux murs
 // fissurés, huit boss. À quatre, les ennemis ont ×3,1 PV et ×1,1 dégâts ; les boss ont leurs mécaniques : il faut un
 // groupe complet, équipé, avec ses classes et ses talents, qui esquive les cercles annoncés.
 const {run,errors}=groupInDungeon(48,'Mythique');
 run('const C=[["paladin",[1,2,7,9,6]],["druide",[1,3,7,8,0]],["elementaliste",[0,3,7,1,5]],["assassin",[1,3,4,5,8]]];game.heroes.forEach((h,i)=>{h.classe={id:C[i][0],talents:C[i][1]};recomputeHeroStats(h);h.player.hp=h.player.mhp});recomputeStats();P.hp=P.mhp');
 const r=playInstance(run,6,900,'game.world.monsters=game.world.monsters.filter(m=>m.boss||m.guardian!==undefined)');
 assert.equal(run('canaanGroupBot.state.done'),true,'fini en '+r.seconds+' s');assert.equal(run('game.world.instance'),null);
 assert.ok(r.heroes.every(h=>!h.dead&&h.relics.length<=6&&h.relics.every(x=>/^Épique 4[4-7]$/.test(x))&&h.purse>=150&&h.keys===2),JSON.stringify(r.heroes));
 assert.equal(errors.length,0,errors.join('\n'));
});
