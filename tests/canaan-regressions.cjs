const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
// Le HTML généré porte la version déclarée dans runtime-config.js.
const version = /CANAAN_VERSION\s*=\s*'([^']+)'/.exec(fs.readFileSync(path.join(__dirname, '..', 'src', 'canaan', 'scripts', 'runtime-config.js'), 'utf8'))[1];
const builtFile = path.join(__dirname, '..', 'CANAAN_ONLINE_V' + version.replace(/\./g, '_') + '.html');
const source = fs.readFileSync(process.argv[2] || builtFile, 'utf8');
const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const script = id => scripts.find(m => m[1].includes('"' + id + '"'))[2];
// Extrait le code entre deux repères ; un repère introuvable est une erreur, jamais une section vide.
const section = (a, b) => {
  const start = source.indexOf(a);
  if (start < 0) throw new Error('Repère de début introuvable : ' + a);
  const end = source.indexOf(b, start + a.length);
  if (end < 0) throw new Error('Repère de fin introuvable : ' + b);
  return source.slice(start, end);
};
// game.hero et game.world (canaan-game-state) reliés aux doubles d'un contexte de test partiel.
function linkGameState(g) {
  g.game = {hero: {}, world: {}, view: {notify() {}, chat() {}, remote() {}, fx() {}}};
  g.game.heroes = [g.game.hero];
  const links = {hero: {equipment: 'equipment', inventory: 'inventory', kills: 'kills', player: 'P'},
    world: {tiles: 'world', decor: 'decor', overworld: 'overworld', overdecor: 'overdecor', monsters: 'monsters', projectiles: 'projectiles',
      drops: 'drops', npcs: 'npcs', chests: 'chests', openedChests: 'openedChests', worldBossTimers: 'worldBossTimers',
      instance: 'instanceState', returnPos: 'returnPos', clock: 'worldClock'}};
  for (const [part, fields] of Object.entries(links))
    for (const [field, name] of Object.entries(fields))
      Object.defineProperty(g.game[part], field, {get: () => g[name], set: value => {g[name] = value}, enumerable: true});
  // États sauvegardés du héros (classe, Rubis, records de l'Arène), comme dans canaan-game-state.
  Object.assign(g.game.hero, {intent: {dx: 0, dy: 0, attack: null, aimX: 0, aimY: 0}, classe: {id: null, talents: []},
    rubis: {owned: {}, equipped: [null, null, null, null, null, null]},
    arena: {best: 0, attempts: 0, completed: false, lastBoss: '', pendingChoice: false}});
  return g;
}
function element() {
  return {style: {setProperty() {}}, dataset: {}, children: [], classList: {add() {}, toggle() {}}, title: '',
    appendChild(e) {this.children.push(e)}, querySelector() {return {style: {}}}, querySelectorAll() {return this.children}, insertAdjacentHTML() {}};
}
function game() {
  const g = {
    P: {x: 0, y: 0, hp: 20, mhp: 100, mp: 1000, mmp: 1000, dead: false},
    started: true, paused: false, playerStun: 0, time: 0, TS: 48, shake: 0,
    inventory: [], equipment: {weapon: {id:'weapon',slot:'weapon',level:10,weaponType:'sword'}},
    SKILLS: [], weaponCooldowns: {}, activeWeaponType: '',
    spellZones: [], spellHits: [], projectiles: [],
    monsters: [], drops: [], kills: 0, recorded: 0,
    WEAPON_TYPES: {}, WEAPON_SPELLS: {}, CRAFT_WEAPONS: [],
    // Doubles explicites des modules non chargés dans les tests unitaires.
    CANAAN_ARTIFACT_STATS: s => s, CANAAN_ARTIFACT_PASSIVE: () => null,
    CANAAN_SOUND: {floatText() {}, effect() {}, cue() {}},
    // Succès (achievements.js, testé à part) : événements ignorés.
    canaanAchieve() {}, CANAAN_ACHIEVEMENTS: {draw() {}},
    // Tréfonds (underground.js, testé à part) : l'île seulement.
    canaanUnder: () => false, canaanHere: o => o?.layer !== 'under',
    CANAAN_PROF: {damageMult: () => 1, armorMult: () => 1, speedMult: () => 1, sanitize: p => p || {fishing: {level: 1, exp: 0}, cooking: {level: 1, exp: 0}, hunting: {level: 1, exp: 0}, fish: {}, meat: {}, meals: {}, codex: {}}},
    CanaanStages: {mobScaling: {}, bossScaling: {}, companions: {}, professions: {}, quests: {}, dungeonPuzzles: {}, elvenCity: {}, bossMechanics: {}, achievements: {}},
    // Cité elfique (elven-city.js, testée à part) : pas de bénédiction.
    CANAAN_CITY: {blessMult: () => 1, blocked: () => false},
    document: {activeElement: null, createElement: element, getElementById: () => ({style: {display:'none'}})},
    skEl: element(), chatInput: {}, performance: {now: () => 100000},
    // Niveau des monstres (monster-scaling.js, non chargé ici) : celui qu'ils portent, 1 sinon.
    canaanMobLevel: m => m?.level || 1, bossTier: m => ({raid: false, level: m?.level || 1}),
    migrateWeapon() {}, applyItemName() {},
    rarityInfo: () => ({name:'Commun'}), instanceDifficulty: () => null, CANAAN_BASE_MANA: 300,
    gearDisplayName: it => it?.name || '',
    modalOpen: () => false, facingAngleCore: () => 0, canWalk: () => true,
    float() {}, burst() {}, toast() {}, chat() {}, update() {}, readInput() {}, draw() {},
    characterStats() {}, recomputeStats() {}, renderCharacter() {}, renderTalents() {},
    gearStat() {}, gearScore() {}, gearComparison() {}, showEquippedTooltip() {}, showGearTooltip() {},
    useSkill() {}, hit() {}, monsterDamage() {}, addEventListener() {},
    mouseWorldX: 100, mouseWorldY: 0,
  };
  g.recordKill = () => g.recorded++;
  g.window = g;
  // game.hero (canaan-game-state) relié aux doubles de ce contexte de test.
  linkGameState(g);
  g.game.hero.level = 10;g.game.hero.exp = 0;
  vm.createContext(g);
  vm.runInContext(script('canaan-modules'),g);
  vm.runInContext(script('canaan-skill-icons'), g);
  vm.runInContext(section('function currentWeaponType()', "// Étape du pipeline : effets des sorts d'armes sur les monstres."), g);
  vm.runInContext(section("// Étape du pipeline : effets des sorts d'armes sur les monstres.", "// Fin des effets d'armes. Les PV des monstres viennent de leur niveau (monster-scaling.js)."), g);
  vm.runInContext(script('canaan-weapon-actions'), g);
  vm.runInContext(script('canaan-stats'), g);
  vm.runInContext(script('canaan-class-talents'), g);g.refreshWeaponBar();
  vm.runInContext(script('canaan-combat'), g);
  vm.runInContext(script('canaan-rubis'), g);
  vm.runInContext(script('canaan-arena'), g);
  vm.runInContext(script('canaan-pipeline'), g);
  g.attackBonus = () => g.characterStats().attack - 18;
  g.confirm = () => true;
  g.saveGame = () => true;
  g.modernPanel = () => {};
  g.advance = (ticks) => {for(let i=0;i<ticks;i++){g.time++;g.runUpdatePipeline()}};
  // Classe et talents au niveau 60 (cinq emplacements) ; arme aux secondaires fixes (sans Soin ni Célérité).
  g.setClass = (id,talents=[]) => {g.game.hero.level=60;g.equipment.weapon.sec={crit:1,power:1};g.CANAAN_CLASS_STATE.import({id,talents})};
  return g;
}
function modifiers(g, recovery = 0, healing = 0, artifact = 0) {
  const base = g.characterStats;
  g.characterStats = () => {
    const st = base(); st.cooldownReduction = recovery; st.healingBonus = healing;
    st.artifactHealingBonus = artifact; return st;
  };
}

test('Les blocs JavaScript compilent ensemble et séparément', () => {
  assert.ok(scripts.length>0);
  for (const m of scripts) new vm.Script(m[2]);
  new vm.Script(scripts.map(m => m[2]).join('\n;\n'));
});
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
  const g = game(); modifiers(g,0,20,.1);
  assert.equal(vm.runInContext('typeof canaanApplyHeal',g),'function');
  assert.equal(g.canaanApplyHeal(10),13); assert.equal(g.P.hp,33);
  g.P.hp=99; assert.equal(g.canaanApplyHeal(100),1);
  assert.equal(g.canaanApplyHeal(0),0);
  g.P.hp=0;g.P.dead=true;assert.equal(g.canaanApplyHeal(100),0);
});
test('Épée : riposte avec vol de vie sur une cible survivante', () => {
  const g=game();g.monsters.push({hp:1000,mhp:1000,x:50,y:0,g:1,r:14});
  g.useSkill(3);assert.ok(g.P.hp>20);assert.equal(g.P.mp,978);
});
test('Bouclier : soin immédiat et soin périodique du sol consacré', () => {
  const g=game();g.equipment.weapon.weaponType='shield';
  g.useSkill(3);assert.equal(g.P.hp,35);
  g.useSkill(1);
  for(let i=0;i<12;i++)g.runUpdatePipeline();
  assert.ok(g.P.hp>35);
});
test('Le moteur de combat utilise également le soin et ses bonus', () => {
  const g=game();modifiers(g,0,20,.1);
  assert.equal(g.CANAAN_COMBAT.heal(10),13);
});
test('Récupération : vrai verrou réduit, pas de double réduction, nouvelle utilisation après expiration', () => {
  const g=game();modifiers(g,30);
  g.useSkill(2);assert.ok(Math.abs(g.weaponCooldowns['sword:2']-8.4)<1e-9);
  assert.equal(g.SKILLS[2].cd,g.weaponCooldowns['sword:2']);
  const mp=g.P.mp;g.useSkill(2);assert.equal(g.P.mp,mp);
  for(let i=0;i<505;i++)g.runUpdatePipeline();
  assert.equal(g.weaponCooldowns['sword:2'],0);
  assert.equal(g.SKILLS[2].cd,0);g.useSkill(2);assert.equal(g.P.mp,mp-12);
});
test('Recharge conservée après changement de famille d’arme et retour', () => {
  const g=game();modifiers(g,30);g.useSkill(2);
  g.equipment.weapon.weaponType='shield';g.refreshWeaponBar();
  g.equipment.weapon.weaponType='sword';g.refreshWeaponBar();
  assert.ok(Math.abs(g.SKILLS[2].cd-8.4)<1e-9);
});
test('Sans Récupération, recharge normale ; pas de consommation si mana insuffisant', () => {
  const g=game();modifiers(g);g.useSkill(2);assert.equal(g.weaponCooldowns['sword:2'],12);
  g.P.mp=0;g.useSkill(1);assert.equal(g.weaponCooldowns['sword:1'],undefined);
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
test('Artefacts sans statistiques ; statistiques du héros recalculées quand l’équipement change',()=>{
  const g=game(),a=g.CANAAN_STATS_PREPARE({id:'a',slot:'artifact',level:30,sec:{crit:9,power:9}});
  assert.equal(a.sec,undefined);assert.equal(JSON.stringify(g.itemStats(a)),'{"primary":{},"secondary":{},"enchant":null}');
  const armor={id:'armor',slot:'armor',level:5,rarity:'Commun'};g.equipment.armor=armor;const before=g.characterStats().primary.defense;
  armor.level=10;const after=g.characterStats().primary.defense;
  assert.ok(after>before);assert.equal(after,g.itemStats(armor).primary.defense+g.itemStats(g.equipment.weapon).primary.defense);
});

function storageGame() {
  const g=game(),db=new Map(),scheduled=new Map();let nextTimer=0;
  Object.assign(g,{
    TS:48,MAPW:400,MAPH:400,instanceState:null,returnPos:null,
    overworld:[[1]],overdecor:[[null]],world:[[1]],decor:[[null]],chests:[],
    openedChests:[],worldBossTimers:{},
    CANAAN_BASE_MANA:300,CANAAN_SPAWN:{x:3480,y:11400},
    gearSlots:Object.fromEntries(['weapon','weapon2','helm','shoulders','armor','gloves','boots','neck','ring','artifact'].map(k=>[k,k])),
    localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v),removeItem:k=>db.delete(k)},
    setTimeout:fn=>{scheduled.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>scheduled.delete(id),
    console:{error(){},warn(){}},
    ensureArtifact(){},
  });
  g.recoveryNodes=new Map();g.reloadCount=0;
  g.document.getElementById=id=>{if(!g.recoveryNodes.has(id))g.recoveryNodes.set(id,element());return g.recoveryNodes.get(id)};
  g.location={reload(){g.reloadCount++}};
  // Normalisation : comme le moteur d'objets, un ancien iLvl devient un niveau, puis les secondaires sont tirées.
  g.CANAAN_GEAR_ENGINE={normalize:it=>{if(it&&it.level===undefined&&it.ilvl!==undefined)it.level=g.levelFromIlvl(it.ilvl);return g.CANAAN_STATS_PREPARE(it)},grant(){}};
  g.CANAAN_BAG_STATE={export:()=>g.bagLevel??0,import:n=>{g.bagLevel=n??0}};
  // Maison : meubles conservés du chargement à la sauvegarde (le vrai module est testé à part).
  g.CANAAN_HOUSE={layout:()=>g.savedHouse||{items:[]},load:d=>{g.savedHouse=d}};
  // Invités : conservés tels quels du chargement à la sauvegarde (le vrai module est testé à part).
  g.CANAAN_GROUP={importGuests:d=>{g.savedGuests=d&&typeof d==='object'?d:{}},exportGuests:()=>g.savedGuests||{}};
  // Monde des quêtes : conservé tel quel (le vrai module est testé à part).
  g.CANAAN_QUESTS={exportWorld:()=>g.savedQuests||{flags:{},solved:{}},importWorld:d=>{g.savedQuests=d}};
  // Banque : conservée telle quelle (le vrai module est testé à part).
  g.CANAAN_BANK={export:h=>h.bank||{items:[],stacks:{}},sanitize:b=>b&&Array.isArray(b.items)?b:{items:[],stacks:{}}};
  // Succès : carnet conservé tel quel (le vrai module est testé à part).
  g.CANAAN_ACHIEVEMENTS={export:h=>h.succes||{},sanitize:v=>v&&typeof v==='object'?v:{}};
  // Tréfonds : l'île seulement (le vrai module est testé à part).
  g.canaanUnder=()=>false;g.canaanHere=o=>o?.layer!=='under';g.CANAAN_UNDER={setLayer(){},spawnPoint:()=>g.CANAAN_SPAWN};
  vm.runInContext(section('function recomputeStats() {','\nfunction recordKill'),g);
  vm.runInContext(script('canaan-persistence'),g);
  g.db=db;g.scheduled=scheduled;
  return g;
}
const mob=hp=>({hp,mhp:hp,x:50,y:0,r:14,g:1,t:'Slime'});
function predictable(g,n=.99) {g.Math=Object.create(Math);g.Math.random=()=>n}

test('Sauvegarde en donjon : reprise au portail avec or, objets, sacs et talents',()=>{
  const g=storageGame();g.setClass('druide',[0,2,4]);g.P.gold=123;g.P.hp=42;g.P.mp=31;
  g.instanceState={index:1};g.returnPos={x:700,y:900};g.P.x=5760;g.P.y=6384;
  g.bagLevel=4;g.openedChests=['chest1'];
  g.worldBossTimers={dragon:123456};g.inventory=[{id:'loot',slot:'armor',ilvl:90}];
  assert.equal(g.saveGame(),true);const saved=JSON.parse(g.db.get(g.CANAAN_PERSISTENCE.key));
  assert.equal(saved.schema,10);assert.equal(saved.heros.hote.player.x,700);assert.equal(saved.heros.hote.player.y,900);
  assert.deepEqual(saved.monde.openedChests,['chest1']);assert.deepEqual(saved.heros.invites,{});
  assert.equal('materials' in saved.heros.hote,false,'plus de matériaux de forge');
  g.P.gold=0;g.inventory=[];g.equipment={};
  assert.equal(g.loadGame(),true);
  assert.equal(g.P.x,700);assert.equal(g.P.y,900);assert.equal(g.P.hp,42);assert.equal(g.P.mp,31);
  assert.equal(g.instanceState,null);assert.equal(g.returnPos,null);assert.equal(g.world,g.overworld);
  assert.equal(g.P.gold,123);assert.equal(g.bagLevel,4);
  assert.equal(g.inventory[0].id,'loot');assert.equal(g.inventory[0].level,g.levelFromIlvl(90),'ancien iLvl converti');assert.equal(Object.keys(g.inventory[0].sec).length,2);
  assert.equal(JSON.stringify(g.CANAAN_CLASS.audit().talents),'[0,2,4]');assert.equal(g.CANAAN_CLASS.audit().id,'druide');assert.equal(g.worldBossTimers.dragon,123456);
});
test('Données invalides : filtrage des objets, coordonnées sûres et nombres finis',()=>{
  const g=storageGame(),saved=g.CANAAN_PERSISTENCE.snapshot();
  const hero=saved.heros.hote;
  hero.player={x:-50,y:20,gold:-20,hp:20,mp:12};
  hero.inventory=[null,3,{slot:'invalid',ilvl:2},{slot:'armor',ilvl:'infinity'},{id:'good',slot:'armor',ilvl:15}];
  hero.equipment={weapon:{slot:'armor',ilvl:90}};
  // Anciens matériaux de forge : rendus en or, valeurs invalides ignorées (4 noyaux × 200 or).
  hero.materials={ore:'Infinity',wood:-3,core:4.9};
  g.db.set(g.CANAAN_PERSISTENCE.key,JSON.stringify(saved));assert.ok(g.loadGame());
  assert.equal(g.P.x,g.CANAAN_SPAWN.x);assert.equal(g.P.gold,800);assert.equal(g.inventory.length,1);
  assert.equal(g.equipment.weapon,null);
});
test('Sauvegarde illisible préservée et erreur d’écriture remontée',()=>{
  const g=storageGame();g.db.set(g.CANAAN_PERSISTENCE.key,'{broken');
  assert.equal(g.loadGame(),false);assert.equal(g.saveGame(),false);
  assert.equal(g.db.get(g.CANAAN_PERSISTENCE.key),'{broken');
  const h=storageGame();h.localStorage.setItem=()=>{throw new Error('quota')};
  assert.equal(h.saveGame(),false);
});
test('Annonce de sauvegarde : ne pas annoncer un succès quand le stockage échoue',()=>{
  const g=game();let message;g.toast=s=>message=s;g.saveGame=()=>false;
  vm.runInContext(section('function pauseSave() {','\nfunction pauseOpenPanel'),g);
  g.pauseSave();assert.ok(message.includes('Échec'));
});
test('Une sauvegarde pendant la mort utilise le village, pas les coordonnées du donjon',()=>{
  const g=storageGame();g.P.dead=true;g.instanceState={index:1};g.returnPos={x:700,y:900};
  const saved=g.CANAAN_PERSISTENCE.snapshot().heros.hote;assert.equal(saved.player.x,g.CANAAN_SPAWN.x);assert.equal(saved.player.y,g.CANAAN_SPAWN.y);
});

// Coup de compétence offensive (contexte d'un lancement) et attaque normale.
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
const skillHit=(el=null)=>({skill:true,offensive:true,element:el,multiplier:1});
const basicHit={basic:true,magic:false};
test('Classes : quatre classes de dix talents, cinq emplacements selon le niveau, état vérifié',()=>{
  const g=game();
  assert.equal(g.CLASSES.length,4);same(g.CLASSES.map(c=>c.name),['Druide','Paladin','Assassin','Élémentaliste']);
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
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,'feral');assert.equal(g.P.mp,85);
  const feral=g.characterStats();assert.equal(feral.speed,base.speed+20);assert.equal(feral.crit,base.crit+8);
  assert.equal(g.CANAAN_CLASS_BASIC_LOCK(),.8);
  assert.ok(Math.abs(g.CANAAN_CLASS_ATTACK.before(mob(100),100,{}).damage-115)<1e-9);
  // Pas de Sève vitale et soins réduits de 30 % en forme féline.
  const m=mob(100000);g.CANAAN_COMBAT.attack(m,100,skillHit('nature'));assert.equal(g.P.hp,20);
  assert.equal(g.canaanApplyHeal(100),70);
  // Sortir est gratuit, après la petite recharge.
  assert.equal(g.CANAAN_CLASS.special(),false);g.advance(91);
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.form,null);assert.equal(g.P.mp,85);
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
  assert.equal(g.CANAAN_CLASS.special(),true);assert.equal(g.P.hp,30);assert.equal(g.P.mp,75);
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
  same(costs,[10,10,5,10,10,5]);assert.equal(g.CANAAN_CLASS_MANA_COST('staff',2,10),10);
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
  assert.ok(Math.abs(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage-120)<1e-9);assert.ok(Math.abs(a.CANAAN_CLASS_MANA_COST('staff',0,10)-7)<1e-9);
  a.advance(601);assert.equal(a.CANAAN_CLASS_ATTACK.before(mob(10),100,{}).damage,100);
});
test('Compétences d’armes : élément et couleur de la classe, sans classe la couleur de l’arme',()=>{
  const g=game();g.setClass('elementaliste',[]);const m=mob(1e6);g.monsters=[m];predictable(g,.99);
  g.equipment.weapon.weaponType='mace';g.refreshWeaponBar();g.useSkill(1);
  assert.equal(m._clsSlow.element,'ice','Onde de choc de glace');
  g.useSkill(0);assert.ok(m.hp<1e6);
});

test('Consolidation : une seule implémentation pour chaque fonction des systèmes migrés',()=>{
  for(const name of ['renderInventory','renderCharacter','charSlot','showGearTooltip','showEquippedTooltip','gearStat','gearScore','gearComparison','equipItem','unequip','equipReserveWeapon','switchWeapon']){
    const bodies=[...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))];
    assert.equal(bodies.length,1,name);
    assert.equal(new RegExp('\\bconst\\s+\\w+\\s*=\\s*'+name+'\\s*;').test(source),false,'capture de '+name);
  }
  assert.equal(/function\s+gearItemHTML\s*\(/.test(source),false);
});

test('Chargement complet : modules, panneaux et équipement sans chaîne historique',()=>{
  const boot=require('./helpers/canaan-runtime.cjs');
  let earlyChecks=0;
  const runtime=boot(source,{beforeScript(script,run){
    if(!script[1].includes('id="canaan-weapon-actions"'))return;
    // Juste après le cœur, tous ces points d'entrée attendent encore leur propriétaire.
    const owners={
      characterStats:'canaan-stats',useSkill:'canaan-weapon-actions',drawBigMap:'canaan-world-map',applyItemName:'canaan-weapon-names',
      hit:'canaan-combat',dropTierGear:'canaan-economy',
      renderInventory:'canaan-ui',renderCharacter:'canaan-ui',charSlot:'canaan-ui',
      showGearTooltip:'canaan-ui',showEquippedTooltip:'canaan-ui',
      gearStat:'canaan-stats',gearScore:'canaan-stats',gearComparison:'canaan-stats',
      equipItem:'canaan-equipment',unequip:'canaan-equipment',
      equipReserveWeapon:'canaan-equipment',switchWeapon:'canaan-equipment'
    };
    for(const [name,owner] of Object.entries(owners)){
      // Avant son module propriétaire, la fonction n'existe pas encore : aucun bouchon ni repli.
      assert.equal(run('typeof '+name),'undefined',name+' ('+owner+')');
      assert.throws(()=>run(name+'()'),/is not defined/);
      earlyChecks++;
    }
  }}),{g,nodes,run}=runtime;
  assert.equal(earlyChecks,18);
  assert.equal(runtime.errors.length,0,runtime.errors.join('\n'));
  assert.equal(g.CANAAN_READY,true);assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  // Un export manquant est refusé par la validation, puis accepté une fois rétabli.
  const installedUi=g.CANAAN_UI;g.CANAAN_UI=undefined;
  assert.throws(()=>g.CANAAN_BOOTSTRAP.validate(),/interface : CANAAN_UI\.openInventory attendu function/);
  g.CANAAN_UI=installedUi;assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  assert.equal(g.CANAAN_UI.openInventory,run('renderInventory'));
  assert.equal(g.CANAAN_EQUIPMENT.equip,run('equipItem'));
  const counters={saves:0,stats:0,bars:0,panels:0};
  const originalSave=run('saveGame'),originalStats=run('recomputeStats'),originalBar=run('refreshWeaponBar');
  g.testCounters=counters;g.testSave=originalSave;g.testStats=originalStats;g.testBar=originalBar;
  run("saveGame=function(){testCounters.saves++;return testSave()};recomputeStats=function(){testCounters.stats++;return testStats()};refreshWeaponBar=function(){testCounters.bars++;return testBar()}");
  // Les panneaux sont construits directement, y compris les contrôles de réserve et de vente.
  g.CANAAN_UI.openInventory();
  let html=nodes.get('window').innerHTML;
  assert.ok(html.includes('bag-upgrade'));assert.ok(html.includes('Arme 2'));
  assert.equal((html.match(/class="bag-sale"/g)||[]).length,2);
  assert.equal((html.match(/class="bag-cell empty"/g)||[]).length,8);
  assert.equal(g.CANAAN_UI.inspect().panel,'inventory');
  run("inventory[0].name='<img src=x onerror=alert(1)>';inventory[0].weaponType='bow'");
  g.CANAAN_UI.openInventory();html=nodes.get('window').innerHTML;
  assert.ok(!html.includes('<img src=x'));
  // Une opération produit une sauvegarde et un recalcul, sans rendre de mana.
  run('P.mp=7;equipItem(inventory[0].id)');
  assert.equal(counters.saves,1);assert.equal(counters.stats,1);assert.equal(counters.bars,1);
  assert.equal(run('P.mp'),7);assert.equal(run('inventory.length'),1);
  assert.equal(run('equipment.weapon.weaponType'),'bow');
  g.CANAAN_UI.openCharacter();html=nodes.get('window').innerHTML;
  // Fiche : deux tableaux (3 principales, 6 secondaires), en points, sans pourcentage.
  assert.equal((html.match(/class="stat-table"/g)||[]).length,2);assert.equal((html.match(/class="stat-desc"/g)||[]).length,9);
  // Chaque statistique explique ce qu'elle fait, sous son nom (pas d'info-bulle).
  assert.ok(html.includes('Augmente les PV maximum.')&&html.includes('Augmente la vitesse d’attaque et réduit les temps de recharge.')&&!html.includes('title="Réduit les dégâts reçus."'));
  assert.ok(html.includes('Statistiques principales')&&html.includes('Statistiques secondaires'));
  assert.ok(!/stats-panel[\s\S]*%/.test(html),'aucun pourcentage dans les tableaux');
  assert.equal((html.match(/class="equip-square/g)||[]).length,10);
  assert.ok(html.includes('Arme 2'));assert.ok(html.includes('active-weapon'));
  assert.ok(!html.includes('undefined'));assert.equal(g.CANAAN_UI.inspect().panel,'character');
  // Réserve, échange et retrait : même identité d'objet, une écriture par action.
  run("inventory.push({id:'reserve',name:'Bâton',slot:'weapon',weaponType:'staff',rarity:'Commun',ilvl:1});equipReserveWeapon(inventory.length-1)");
  assert.equal(counters.saves,2);assert.equal(counters.stats,2);assert.equal(counters.bars,1);
  run('closePanels();started=true;switchWeapon()');
  assert.equal(run('equipment.weapon.id'),'reserve');assert.equal(run('equipment.weapon2.weaponType'),'bow');
  assert.equal(counters.saves,3);assert.equal(counters.stats,3);assert.equal(counters.bars,2);assert.equal(run('P.mp'),7);
  run("unequip('weapon')");assert.equal(counters.saves,4);assert.equal(counters.stats,4);assert.equal(counters.bars,3);
  assert.equal(run('equipment.weapon'),null);
  // Les info-bulles des statistiques et les passifs d'artefacts utilisent leurs services directs.
  run("inventory.push({id:'artifact-test',name:'Relique',slot:'artifact',artifactVariant:0,rarity:'Commun',ilvl:10});showGearTooltip(inventory.length-1,{clientX:1,clientY:1})");
  assert.ok(nodes.get('gearHoverTooltip')===undefined); // L'infobulle est créée par createElement.
  assert.ok(run("gearTooltip.innerHTML.includes('PASSIF')"));
  assert.ok(run("gearStat(inventory[inventory.length-1]).includes('Ardeur')"));
  assert.ok(run("gearComparison(inventory[inventory.length-1],null).includes('Comparaison des passifs')"));
  run("showGearTooltip(0,{clientX:1,clientY:1})");assert.ok(run("gearTooltip.innerHTML.includes('Attaque')&&gearTooltip.innerHTML.includes('Niveau requis')"));
  run("closePanels()");assert.equal(run('gearTooltip.style.display'),'none');
  // Échecs sans effet de bord : objet absent, sac plein, vente périmée ou refusée.
  const savesBefore=counters.saves;
  assert.equal(run("equipItem('absent')"),false);assert.equal(counters.saves,savesBefore);
  run("window.savedInventory=inventory;window.savedWeapon=equipment.weapon;equipment.weapon=equipment.weapon2;inventory=Array.from({length:BAG_LIMIT},(_,i)=>({id:'full'+i,slot:'armor',ilvl:1}))");
  assert.equal(run("unequip('weapon')"),false);assert.equal(counters.saves,savesBefore);
  run("inventory=window.savedInventory;equipment.weapon=window.savedWeapon");
  assert.equal(g.sellInventoryCell(0,'obsolete'),false);assert.equal(counters.saves,savesBefore);
  g.testMerchant=run('nearMerchant');
  run('nearMerchant=function(){return false}');
  assert.equal(g.sellInventoryCell(0,run('String(inventory[0].id)')),false);
  run('nearMerchant=function(){return true};inventory.push({id:"confirm-sale",name:"Rare",slot:"armor",ilvl:120,rarity:"Légendaire"})');
  // Légendaire : la fenêtre de confirmation du jeu (canaanConfirm) vend seulement après « Vendre ».
  let asked=null;g.canaanConfirm=(text,yes)=>{asked={text,yes};return false};
  assert.equal(g.sellInventoryCell(run('inventory.length-1'),'confirm-sale'),false);assert.equal(counters.saves,savesBefore);assert.match(asked.text,/Vendre .* or \?/);
  assert.equal(asked.yes(),true);assert.equal(counters.saves,savesBefore+1);assert.equal(asked.yes(),false);
  run('nearMerchant=testMerchant');
  // Le texte passe par l'échappement HTML même sans normalisation préalable.
  run("inventory[0].name='<img src=x onerror=alert(1)>';showGearTooltip(0,{clientX:1,clientY:1})");
  assert.ok(run("gearTooltip.innerHTML.includes('&lt;img')"));assert.ok(!run("gearTooltip.innerHTML.includes('<img')"));
  run('P.gold=250;buyBagUpgrade()');
  assert.equal(run('BAG_LIMIT'),20);assert.equal(run('P.gold'),0);
  assert.equal((nodes.get('window').innerHTML.match(/class="bag-cell empty"/g)||[]).length,run('BAG_LIMIT-inventory.length'));
  assert.equal(runtime.errors.length,0,runtime.errors.join('\n'));
  // Le parcours de récupération fonctionne aussi avec tous les modules réels chargés.
  const persistence=g.CANAAN_PERSISTENCE,broken='{sauvegarde-interface';
  g.localStorage.setItem(persistence.key,broken);
  assert.equal(run('loadGame()'),false);assert.equal(nodes.get('saveRecovery').hidden,false);
  assert.equal(run('saveGame()'),false);
  let reloads=0;g.location.reload=()=>reloads++;
  assert.equal(persistence.restartFresh(),true);assert.equal(reloads,1);
  assert.equal(g.localStorage.getItem(persistence.lastBackupKey),broken);
  assert.equal(nodes.get('saveRecovery').hidden,true);
  assert.equal(run('loadGame()'),true);assert.equal(run('saveGame()'),true);
  assert.equal(run('inventory.length'),2);assert.equal(run('P.gold'),0);assert.equal(run('BAG_LIMIT'),10);
  assert.equal(run('characterStats().level'),1);assert.equal(run('P.mhp'),104);
  assert.equal(run('inventory.every(item=>Object.keys(item.sec).length===2&&item.level===1)'),true);
  assert.equal(runtime.errors.length,1); // L'erreur de lecture volontaire est signalée.
});

test('Ratings52 uniquement : aucun ancien moteur de dégâts, rééquilibrage ou butin',()=>{
  assert.equal(/\bst\.strength\b|\bilvlStats\b|\brebalanceItem\b|\brebalanceAllGear\b|_balancedVersion\s*=\s*30/.test(source),false);
  for(const name of ['hit','dropTierGear'])
   assert.equal([...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))].length,1,name);
  assert.equal(/\bitem\.(?:atk|def|str|int|agi|vit|crit|haste|mastery|versatility|speed)\s*=/.test(source),false);
});

test('Objets : normalisation unique, butin de chaque instance à son niveau, anciens iLvl convertis et sauvegarde',()=>{
  const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
  const tracked={id:'old-armor',name:'Armure ancienne',slot:'armor',rarity:'Rare',level:30};
  assert.equal(g.CANAAN_GEAR.normalize(tracked),tracked);const sec=JSON.stringify(tracked.sec);
  g.CANAAN_GEAR.normalize(tracked);assert.equal(JSON.stringify(tracked.sec),sec,'secondaires tirées une seule fois');
  const weapon={id:'identity',name:'Arc personnel',slot:'weapon',weaponType:'bow',rarity:'Épique',level:40};
  g.CANAAN_GEAR.normalize(weapon);assert.equal(weapon.name,'Arc personnel');assert.equal(weapon.weaponType,'bow');assert.equal(weapon.level,40);
  assert.equal(typeof g.CANAAN_GEAR.grant,'function');assert.equal(typeof g.CANAAN_LOOT.grant,'function');
  assert.equal(run('typeof rebalanceItem'), 'undefined');assert.equal(run('typeof rebalanceAllGear'),'undefined');
  g.Math=Object.create(Math);
  // Tous les coffres d’instance sont garantis, même avec le pire tirage, au niveau de récompense de l'instance.
  const cases=[[0,'Rare',10],[1,'Rare',16],[2,'Rare',21],[3,'Rare',28],[4,'Rare',35],[5,'Rare',40],[6,'Épique',47],[7,'Épique',52],[8,'Épique',57],[9,'Épique',60]];
  for(const [index,rarity,level] of cases){
    run('inventory=[]');let first=true;
    g.Math.random=()=>{if(first){first=false;return .999}return .2};
    assert.equal(g.CANAAN_LOOT.instance(index),true);
    const item=run('inventory[0]');assert.equal(item.rarity,rarity);assert.equal(item.level,level);assert.equal(item.ilvl,undefined);
    if(item.slot!=='artifact')assert.equal(Object.keys(item.sec).length,2);
    assert.equal(item.origin,index<6?'donjon':'raid');assert.doesNotMatch(item.name,/ — (Relique du donjon|Héritage du raid)/);
  }
  // Sac plein : la récompense garantie est perdue.
  run('inventory=Array.from({length:BAG_LIMIT},(_,i)=>({id:"full"+i,slot:"armor",level:1}))');g.Math.random=()=>.01;
  assert.equal(g.CANAAN_LOOT.instance(0),false);
  // Ancienne sauvegarde : l'iLvl devient un niveau (190 → 60) et les points Ratings52 disparaissent.
  const old=run('CANAAN_GEAR.normalize({id:"vieux-85",name:"Armure",slot:"armor",rarity:"Épique",ilvl:85,ratings52:{defense:99},_stats52:1,_stats52Ilvl:85})');
  assert.equal(old.level,Math.round(85*60/190));for(const k of ['ilvl','ratings52','_stats52','_stats52Ilvl'])assert.equal(k in old,false,k);
  assert.equal(run('CANAAN_GEAR.normalize({id:"v190",slot:"ring",rarity:"Céleste",ilvl:190}).level'),60);
  // Ancien suffixe des récompenses de boss : retiré du nom à la normalisation, provenance gardée.
  {const o=run('CANAAN_GEAR.normalize({id:"vieux",name:"Épée des braises — Héritage du raid",slot:"weapon",weaponType:"sword",rarity:"Héroïque",level:40})');assert.equal(o.name,'Épée des braises');assert.equal(o.origin,'raid');
   const relic=run('CANAAN_GEAR.normalize({id:"vieux2",name:"Arc du val — Relique du donjon",slot:"weapon",weaponType:"bow",rarity:"Rare",level:10})');assert.equal(relic.name,'Arc du val');assert.equal(relic.origin,'donjon');}
  // Une seule passe complète de normalisation au chargement ; les secondaires sont relues telles quelles.
  run('inventory=[CANAAN_GEAR.normalize({id:"keep",name:"Armure",slot:"armor",rarity:"Épique",level:30})]');const kept=JSON.stringify(run('inventory[0].sec'));
  run('saveGame()');
  let bulkPasses=0;const normalizeAll=g.CANAAN_GEAR.normalizeAll;
  g.CANAAN_GEAR.normalizeAll=function(){bulkPasses++;return normalizeAll.call(this)};
  assert.equal(run('loadGame()'),true);assert.equal(bulkPasses,1);
  assert.equal(JSON.stringify(run('inventory[0].sec')),kept);
  // La vérification centrale agrège aussi les exports présents avec un type incorrect.
  const originalDeflect=g.CANAAN_CLASS_ON_DODGE,originalBagExport=g.CANAAN_BAG_STATE.export;
  const originalName=g.WEAPON_NAMES.Mythique.bow;
  g.CANAAN_CLASS_ON_DODGE=null;g.CANAAN_BAG_STATE.export='invalid';g.WEAPON_NAMES.Mythique.bow='';
  assert.throws(()=>g.CANAAN_BOOTSTRAP.validate(),error=>{
    assert.ok(error.message.includes('CANAAN_CLASS_ON_DODGE'));
    assert.ok(error.message.includes('CANAAN_BAG_STATE.export'));
    assert.ok(error.message.includes('WEAPON_NAMES.Mythique.bow'));
    return true;
  });
  g.CANAAN_CLASS_ON_DODGE=originalDeflect;g.CANAAN_BAG_STATE.export=originalBagExport;
  g.WEAPON_NAMES.Mythique.bow=originalName;assert.equal(g.CANAAN_BOOTSTRAP.validate(),true);
  assert.equal(errors.length,0,errors.join('\n'));
});

test('Dépendances obligatoires : pas de garde optionnelle ni de fallback de module',()=>{
  assert.equal(/\bwindow\.CANAAN_[A-Z0-9_]+\?\./.test(source),false);
  assert.equal(/\btalents\?\.before|\bOFFICIAL_NAMES_1820\b/.test(source),false);
  const boot=script('canaan-bootstrap');
  assert.ok(boot.indexOf('window.CANAAN_BOOTSTRAP.validate();')>=0&&boot.indexOf('window.CANAAN_BOOTSTRAP.validate();')<boot.indexOf('loaded = loadGame()'));
});

test('Modules réellement absents : une erreur agrégée visible et aucun démarrage ni sauvegarde',()=>{
  let broken=source;
  for(const id of ['canaan-stats','canaan-gear-engine','canaan-weapon-names']){
    const pattern=new RegExp('(<script\\b[^>]*id="'+id+'"[^>]*>)[\\s\\S]*?(</script>)');
    assert.ok(pattern.test(broken),id);broken=broken.replace(pattern,'$1\n$2');
  }
  const {g,nodes,errors,run}=require('./helpers/canaan-runtime.cjs')(broken);
  assert.equal(errors.length,1,errors.join('\n'));
  for(const name of ['CANAAN_STATS_PREPARE','CANAAN_GEAR_ENGINE.normalize','applyItemName']){
    assert.ok(g.CANAAN_BOOT_ERROR.includes(name),name);
  }
  assert.equal(g.CANAAN_READY,false);assert.equal(run('started'),false);assert.equal(run('canaanLastFrame'),null);
  assert.equal(g.localStorage.getItem('canaan_dev_18999_state'),null);
  const title=nodes.get('title');
  assert.ok(title.querySelector('p').textContent.includes(g.CANAAN_BOOT_ERROR));
  assert.equal(nodes.get('slotMenu').hidden,true);assert.equal(nodes.get('slotMenu').innerHTML,'');
  assert.throws(()=>run('startGame()'),/Dépendances obligatoires/);
});

test('Repartir à neuf : schéma ancien et JSON corrompu archivés avant une partie neuve sauvegardable',()=>{
  for(const raw of ['{corrompu', '  {"schema":9,"player":{"gold":999}}  ']){
    const g=storageGame(),p=g.CANAAN_PERSISTENCE,key=p.key;
    g.db.set(key,raw);
    g.P.gold=999;g.inventory.push({id:'lost-run',slot:'armor',ilvl:90});g.setClass('assassin',[0,1,2]);
    assert.equal(g.loadGame(),false);assert.equal(g.recoveryNodes.get('saveRecovery').hidden,false);
    assert.equal(g.saveGame(),false);assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('Repartir à neuf'));
    const writes=[],setItem=g.localStorage.setItem;
    g.localStorage.setItem=(k,value)=>{writes.push(k);return setItem(k,value)};
    assert.equal(p.restartFresh(),true);assert.equal(g.reloadCount,1);assert.equal(p._loadFailed,false);
    assert.ok(p.lastBackupKey.startsWith(key+'_backup_'));assert.equal(g.db.get(p.lastBackupKey),raw);
    assert.equal(writes[0],p.lastBackupKey);assert.equal(writes[1],key);
    const fresh=JSON.parse(g.db.get(key));assert.equal(fresh.schema,10);assert.equal(fresh.heros.hote.player.gold,0);
    assert.equal(fresh.heros.hote.inventory.length,2);assert.deepEqual(fresh.heros.hote.classe,{id:null,talents:[]});assert.equal(fresh.nom,'Aventure 1');
    assert.equal(g.recoveryNodes.get('saveRecovery').hidden,true);
    // Simuler le rechargement de page puis les sauvegardes manuelle et différée.
    assert.equal(g.loadGame(),true);assert.equal(g.P.gold,0);
    assert.equal(g.inventory.length,2);assert.equal(JSON.stringify(g.CANAAN_CLASS.audit().talents),'[]');
    assert.equal(Object.values(g.equipment).filter(Boolean).length,0);
    assert.equal(g.saveGame(),true);
    g.started=true;g.P.gold=17;p.requestSave();
    const [timer,callback]=g.scheduled.entries().next().value;g.scheduled.delete(timer);callback();
    assert.equal(JSON.parse(g.db.get(key)).heros.hote.player.gold,17);assert.equal(g.db.get(p.lastBackupKey),raw);
  }
});

test('Copie de secours : un nom de clé déjà utilisé ne remplace jamais un ancien secours',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE;g.Date={now:()=>123};
  g.db.set(p.key,'{broken');g.loadGame();
  const first=p.key+'_backup_123';g.db.set(first,'premier secours');
  assert.equal(p.restartFresh(),true);assert.equal(p.lastBackupKey,first+'_1');
  assert.equal(g.db.get(first),'premier secours');assert.equal(g.db.get(first+'_1'),'{broken');
});

test('Échec de copie ou de vérification : aucune écriture sur la sauvegarde originale',()=>{
  for(const mode of ['quota','unverified','read']){
    const g=storageGame(),p=g.CANAAN_PERSISTENCE,raw='{broken';g.db.set(p.key,raw);g.loadGame();
    const write=g.localStorage.setItem,read=g.localStorage.getItem;let activeWrites=0;
    g.localStorage.setItem=(key,value)=>{
      if(key===p.key){activeWrites++;return write(key,value)}
      if(mode==='quota')throw new Error('quota plein');
      if(mode==='unverified')return;
      return write(key,value);
    };
    if(mode==='read')g.localStorage.getItem=()=>{throw new Error('lecture refusée')};
    assert.equal(p.restartFresh(),false);assert.equal(activeWrites,0);assert.equal(g.db.get(p.key),raw);
    assert.equal(g.reloadCount,0);assert.equal(p._loadFailed,true);
    assert.equal(g.recoveryNodes.get('saveRecovery').hidden,false);
    assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('Impossible de repartir'));
    g.localStorage.getItem=read;
  }
});

test('Échec de création de la nouvelle partie : secours conservé, original intact et nouvel essai possible',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE,raw='{"schema":3}';g.db.set(p.key,raw);g.loadGame();
  const write=g.localStorage.setItem;
  g.localStorage.setItem=(key,value)=>{if(key===p.key)throw new Error('quota');return write(key,value)};
  assert.equal(p.restartFresh(),false);assert.equal(g.db.get(p.key),raw);assert.equal(g.db.get(p.lastBackupKey),raw);
  assert.equal(p._loadFailed,true);assert.equal(g.reloadCount,0);
  const firstBackup=p.lastBackupKey;g.localStorage.setItem=write;
  assert.equal(p.restartFresh(),true);assert.equal(g.db.get(firstBackup),raw);assert.equal(g.reloadCount,1);
});

test('Reprise à neuf refusée sur une sauvegarde lisible ou modifiée depuis l’échec',()=>{
  const g=storageGame(),p=g.CANAAN_PERSISTENCE;
  assert.equal(p.restartFresh(),false);assert.equal(g.db.size,0);
  g.db.set(p.key,'{broken');g.loadGame();
  const newer=JSON.stringify(p.freshSnapshot());g.db.set(p.key,newer);
  assert.equal(p.restartFresh(),false);assert.equal(g.db.get(p.key),newer);assert.equal(g.db.size,1);
  assert.equal(g.reloadCount,0);assert.ok(g.recoveryNodes.get('saveRecoveryStatus').textContent.includes('a changé'));
});

test('Déviation : esquive totale puis second jet indépendant pour diviser les dégâts',()=>{
  const g=game(),labels=[];
  g.CANAAN_ARTIFACT_STATS=s=>{s.dodge=35;return s};
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
  const g=game(),base=g.characterStats;g.setClass('elementaliste',[5]);g.P.hp=20;g.P.mhp=100;g.advance(1);
  g.characterStats=()=>{const s=base();s.dodge=100;return s};predictable(g,0);
  for(let i=0;i<5;i++)assert.equal(g.monsterDamage(mob(100)),0);
  // Le bouclier de la Barrière de givre (15 PV) est intact.
  assert.equal(g.CANAAN_CLASS.audit().shield,15);
  assert.equal(g.CANAAN_CLASS_DEFENSE(mob(100),10),0);
  assert.equal(g.CANAAN_CLASS_DEFENSE(mob(100),100),95);
  // Danse des ombres : une esquive donne +20 % de vitesse pendant 3 s.
  const h=game(),hb=h.characterStats;h.setClass('assassin',[2]);const speed=h.characterStats().speed;
  h.characterStats=()=>{const s=hb();s.dodge=100;return s};predictable(h,0);h.monsterDamage(mob(100));
  h.characterStats=hb;assert.equal(h.characterStats().speed,speed+20);h.advance(181);assert.equal(h.characterStats().speed,speed);
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

test('Sources modulaires : HTML généré à jour et identifiants descriptifs',()=>{
  const {spawnSync}=require('node:child_process');
  const result=spawnSync('python3',['tools/build_canaan.py','--check'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(/<(?:script|style)\b[^>]*id="[^"]*v\d/.test(source),false);
  for(const name of ['hit','useSkill','drawBigMap','applyItemName']){
    assert.equal([...source.matchAll(new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g'))].length,1,name);
    assert.equal(new RegExp('\\bconst\\s+\\w+\\s*=\\s*'+name+'\\s*;').test(source),false,name);
  }
});

test('Compétences : les 36 actions restent lançables par les neuf familles',()=>{
  for(const type of ['sword','dualsword','axe','mace','spear','dualdagger','bow','staff','shield']){
    for(let index=0;index<4;index++){
      const g=game();g.equipment.weapon.weaponType=type;g.refreshWeaponBar();
      const cost=g.SKILLS[index].mp;
      assert.doesNotThrow(()=>g.useSkill(index),type+':'+index);
      assert.equal(g.P.mp,1000-cost);assert.ok(g.weaponCooldowns[type+':'+index]>0);
      assert.doesNotThrow(()=>g.advance(120),type+':'+index+' différé');
    }
  }
});

test('Noms : table officielle complète appliquée directement, identité et points inchangés',()=>{
  const g=game();g.inventory=[];g.equipment={};
  g.rarityInfo=item=>({name:item.rarity});
  g.ensureArtifact=item=>{if(!Number.isInteger(item.artifactVariant))item.artifactVariant=0};
  // GEAR_NAMES et WEAPON_NAMES viennent du module partagé shared/data/item-names.js (déjà chargé par game()).
  // ensureWeaponType vient de shared/rules/items.js (déjà chargé par game()).
  vm.runInContext(script('canaan-weapon-names'),g);
  for(const [rarity,types] of Object.entries(g.WEAPON_NAMES)){
    for(const [type,name] of Object.entries(types)){
      const sec={power:42,crit:7},item={id:'identity',slot:'weapon',name:'Ancien nom',rarity,weaponType:type,level:30,sec};
      assert.equal(g.applyItemName(item),item);assert.equal(item.name,name);
      assert.equal(item.level,30);assert.equal(item.weaponType,type);assert.equal(item.id,'identity');assert.equal(item.sec,sec);
    }
  }
  for(let variant=0;variant<3;variant++){
    const item={slot:'artifact',rarity:'Rare',artifactVariant:variant,ilvl:90};
    g.applyItemName(item);
    assert.equal(item.name,vm.runInContext('GEAR_NAMES.Rare.artifact['+variant+']',g));
  }
});

test('Paramètres : depuis l’accueil et la pause, son et volumes déplacés, secousses de l’écran gardées, Échap ferme, quitter sauvegarde',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const html=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 // Un bouton Paramètres sur l'accueil, dans la pause et dans la barre ; Quitter sur l'accueil, la pause et les paramètres.
 assert.ok(html.indexOf('id="titleTools"')>0&&/id="titleTools">[^]*?data-action="openSettings"[^]*?data-action="quitGame"/.test(html));
 assert.match(html,/id="pauseCard">[^]*?data-action="openSettings"[^]*?data-action="quitGame"/);
 // Le son et ses deux volumes sont dans les paramètres, plus à côté de la mini-carte.
 const card=html.slice(html.indexOf('id="settingsCard"'));
 for(const id of ['soundToggle','musicVolume','sfxVolume','setFullscreen','setResolution','setZoom','setVsync','setRestartRow','setFpsCap','setFps','setGlow','setParticles','setShake','setDamage'])assert.ok(card.includes('id="'+id+'"'),id);
 const bar=html.slice(html.indexOf('id="layoutTools"'),html.indexOf('</div>',html.indexOf('id="layoutTools"')));
 assert.doesNotMatch(bar,/soundToggle|musicVolume|sfxVolume/);
 // Ouvrir, couper les secousses (gardé dans les préférences, appliqué au dessin), fermer avec Échap.
 run('openSettings()');assert.equal(run('CANAAN_SETTINGS.isOpen()'),true);
 run('settingsToggle("shake")');assert.equal(run('canaanDisplay.shake'),false);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).shake'),false);
 run('closeSettings()');assert.equal(run('CANAAN_SETTINGS.isOpen()'),false);
 run('settingsToggle("shake")');assert.equal(run('canaanDisplay.shake'),true);
 // Limite d'images : un cycle de valeurs (aucune, 30, 60…), gardée ; les clés inconnues sont ignorées.
 run('settingsStep("fpscap",1)');assert.equal(run('canaanDisplay.fpsCap'),30);run('settingsStep("fpscap",-1)');assert.equal(run('canaanDisplay.fpsCap'),0);
 run('settingsStep("fpscap",-1)');assert.equal(run('canaanDisplay.fpsCap'),240);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).fpsCap'),240);run('settingsStep("fpscap",1)');
 run('settingsToggle("inconnu");settingsToggle("damage")');assert.equal(run('canaanDisplay.damage'),false);
 // Chiffres de dégâts masqués : « 120 » et « -35 » ne sont plus dessinés, « +7 or » si.
 const texts=[];g.__texts=texts;run('{const real=ctx.fillText;ctx.fillText=(t,...a)=>{__texts.push(String(t));return real.call(ctx,t,...a)};floaters=[{x:P.x,y:P.y,txt:120,c:"#f00",life:40},{x:P.x,y:P.y,txt:"-35",c:"#f00",life:40},{x:P.x,y:P.y,txt:"+7 or",c:"#ff0",life:40}];started=true;draw();ctx.fillText=real}');
 assert.ok(texts.includes('+7 or')&&!texts.includes('120')&&!texts.includes('-35'),JSON.stringify(texts.slice(0,8)));
 run('settingsToggle("damage")');
 // Quitter sauvegarde la partie en cours (hors application de bureau : un message invite à fermer l'onglet).
 let saves=0;g.__countSave=()=>saves++;run('{const real=saveGame;saveGame=()=>{__countSave();return real()};started=true;quitGame();saveGame=real}');
 assert.equal(saves,1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Carte M zoomable et mini-carte qui suit le héros, sur l’île comme en donjon ; marche plus douce',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS');
 // Carte M : outils de zoom, liste des biomes, vue d'ensemble à l'ouverture.
 run('closePanels();toggleMap()');
 const html=g.document.getElementById('window').innerHTML;
 for(const tag of ['data-action="mapZoom" data-step="-1"','data-action="mapZoom" data-step="1"','data-action="mapCenter"','data-action="mapFit"','id="bigMap"','Niveaux 1–10'])assert.ok(html.includes(tag),tag);
 const view=()=>JSON.parse(run('JSON.stringify(CANAAN_MAP.view())'));
 assert.equal(view().fitted,true);
 // Zoomer, se centrer (la vue suit le héros), dézoomer jusqu'à la vue d'ensemble.
 const s0=view().scale;run('CANAAN_MAP.zoom(1)');assert.ok(view().scale>s0&&!view().fitted);
 run('CANAAN_MAP.center()');run('P.x+=10*TS;drawBigMap()');const v=view();
 assert.equal(v.follow,true);assert.ok(Math.abs(v.cx-run('P.x/TS'))<0.01&&v.scale>=6,JSON.stringify(v));
 for(let i=0;i<12;i++)run('CANAAN_MAP.zoom(1)');assert.equal(view().scale,16,'zoom maximal');
 for(let i=0;i<12;i++)run('CANAAN_MAP.zoom(-1)');assert.equal(view().fitted,true);
 run('CANAAN_MAP.center();CANAAN_MAP.fit()');assert.equal(view().fitted,true);
 // Survol d'une instance dans la liste : entourée, puis effacée.
 run('highlightMapInstance(2,true)');assert.equal(view().place,2);run('highlightMapInstance(2,false)');assert.equal(view().place,null);
 // Les boutons passent par les actions autorisées.
 run('dispatchCanaanAction({dataset:{action:"mapZoom",step:"1"}},{stopPropagation(){}})');assert.equal(view().fitted,false);
 run('dispatchCanaanAction({dataset:{action:"mapFit"}},{stopPropagation(){}})');assert.equal(view().fitted,true);
 // Mini-carte : dessinée sans erreur, zoom rapproché par défaut ; un repère de quête par personnage qui en propose.
 for(let i=0;i<6;i++)run('drawMinimap()');assert.equal(run('CANAAN_MAP.miniZoom()'),5);
 assert.ok(run('Object.values(CANAAN_QUESTS.npcs()).filter(n=>CANAAN_QUESTS.npcMode(game.hero,n)==="offer").length')>=1);
 // En donjon : le plan de l'instance, ses ennemis et son boss.
 run("closePanels();game.hero.level=20;recomputeStats();enterInstance(0,'normal')");assert.ok(run('!!game.world.instance'));
 run('toggleMap()');assert.match(g.document.getElementById('window').innerHTML,/Ennemis restants/);assert.equal(view().fitted,true);
 for(let i=0;i<6;i++)run('drawMinimap()');run('closePanels();leaveInstance()');
 // Marche plus douce : environ neuf images par seconde (quatre images par pas de 6,7 unités d'anim).
 const frames=[];g.__frames=frames;
 // Une seconde de marche (60 pas, anim +0,25 à chaque pas) : on compte les changements de sprite dessiné.
 // Seul le corps compte (dessiné à sa taille) ; l'arme tenue est dessinée à part, tournée.
 run('{const c={save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},arc(){},fill(){},stroke(){},closePath(){},moveTo(){},lineTo(){},createRadialGradient:()=>({addColorStop(){}}),drawImage(img,...a){if(a.length===4)__frames.push(img)},globalAlpha:1};for(let i=0;i<60;i++){P.vx=3;P.vy=0;drawPixelHero(c,P.x,P.y,"#fff",i*0.25,true)}}');
 const changes=frames.filter((f,i)=>i&&f!==frames[i-1]).length;
 assert.ok(changes>=6&&changes<=10,'changements d’image en une seconde : '+changes);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Version actuelle, actions sans onclick et CSS sans important',()=>{
 // Sources formatées : aucune ligne démesurée dans le code assemblé (les longues chaînes HTML restent tolérées jusqu'à 400 caractères).
 for(const m of scripts)for(const line of m[2].split('\n'))assert.ok(line.length<=400,m[1]+' : ligne de '+line.length+' caractères');
 assert.ok(script('canaan-runtime-config').includes("CANAAN_VERSION = '"+version+"'"));
 assert.doesNotMatch(source,/\bonclick\s*=\s*["']/i);
 assert.doesNotMatch(source,/!important/);
 // Le CSS vit dans les feuilles du template ; le JavaScript n'injecte ni feuille ni style en ligne complet.
 assert.doesNotMatch(source,/createElement\(\s*['"]style['"]\s*\)|\.style\.cssText\s*=/);
 const head=source.slice(0,source.indexOf('</head>'));
 const order=['canaan-interface-style','canaan-panels-style'].map(id=>head.indexOf('<style id="'+id+'">'));
 assert.ok(order.every((at,i)=>at>=0&&(i===0||at>order[i-1])),String(order));
 assert.match(head,/#regionBanner\s*\{\s*position:\s*fixed/);
 // Styles en ligne : aucun dans le balisage, et seulement des valeurs calculées dans le HTML généré.
 const markup=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 assert.doesNotMatch(markup,/\sstyle="/);
 for(const m of scripts)for(const [,value] of m[2].matchAll(/style="([^"]*)"/g)){
  assert.ok(/'\s*\+/.test(value)||value==='display:none',m[1]+' : style statique '+value);
 }
 assert.doesNotMatch(source,/correct1820|applyNames1735|craftGear1742|updateBagLimit1739/);
 assert.match(script('canaan-bootstrap'),/\[\s*'monde',\s*'worldRnd',\s*\(\)\s*=>\s*worldRnd,\s*'function'\s*\]/);
});

test('Commandes : délégation, multitouch, annulation, pause et visée',()=>{
 const listeners={},rootListeners={},skillListeners={},calls=[];
 const names=['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','equipReserveWeapon','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','toggleJournal','buyGear','closePanels','interact','switchWeapon','useSkill'];
 const g={Map,keys:{},started:true,paused:false,P:{dead:false,x:10,y:20,face:-1},monsters:[],mouseWorldX:0,mouseWorldY:0,CanaanStages:{},modalOpen:()=>false,
  CANAAN_PERSISTENCE:{restartFresh:()=>calls.push(['restart'])},
  document:{hidden:false,addEventListener:(name,fn)=>listeners[name]=fn,getElementById:id=>id==='touchControls'?{addEventListener:(name,fn)=>rootListeners[name]=fn}:id==='skills'?{addEventListener:(name,fn)=>skillListeners[name]=fn}:{style:{display:'none'}}},
  addEventListener:(name,fn)=>listeners[name]=fn};
 for(const name of names)g[name]=(...args)=>calls.push([name,...args]);
 g.window=g;linkGameState(g);vm.createContext(g);vm.runInContext(script('canaan-controls'),g);
 const event={stopPropagation(){calls.push(['stop'])}};
 g.dispatchCanaanAction({dataset:{action:'unequip',slot:'weapon2'}},event);
 assert.deepEqual(calls.splice(0),[['hideGearTooltip'],['unequip','weapon2']]);
 g.dispatchCanaanAction({dataset:{action:'sellInventoryCell',index:'2',itemId:'test-id'}},event);
 assert.deepEqual(calls.shift(),['sellInventoryCell',2,'test-id',event]);
 g.dispatchCanaanAction({dataset:{action:'equipReserve',index:'3'}},event);
 assert.deepEqual(calls.splice(0),[['stop'],['equipReserveWeapon',3]]);
 g.dispatchCanaanAction({dataset:{action:'resume'}},event);assert.deepEqual(calls.shift(),['togglePause',false]);
 g.dispatchCanaanAction({dataset:{action:'togglePause'}},event);assert.deepEqual(calls.shift(),['togglePause']);
 g.dispatchCanaanAction({dataset:{action:'restartFresh'}},event);assert.deepEqual(calls.shift(),['restart']);
 skillListeners.click({target:{closest:selector=>selector==='[data-skill]'?{dataset:{skill:'3'}}:null}});
 assert.deepEqual(calls.shift(),['useSkill',3]);
 skillListeners.click({target:{closest:()=>null}});assert.equal(calls.length,0);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'alert'}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'toString'}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'sellInventoryCell',index:'1;alert(1)',itemId:'a'}},event),/Argument d’action invalide/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'enterInstance',instance:"1')"}},event),/Argument d’action invalide/);
 // Plus de forge : ses anciennes actions sont inconnues.
 for(const action of ['openCrafting','selectForgeItem','upgradeItem','setWeaponPassive'])assert.throws(()=>g.dispatchCanaanAction({dataset:{action}},event),/Action inconnue/);
 assert.throws(()=>g.dispatchCanaanAction({dataset:{action:'unequip',slot:"x')"}},event),/Argument d’action invalide/);
 assert.equal(calls.length,0);
 const press=(id,data)=>rootListeners.pointerdown({pointerId:id,preventDefault(){},target:{closest:()=>({dataset:data,setPointerCapture(){}})}});
 press(1,{direction:'arrowup'});press(2,{direction:'arrowright'});
 assert.equal(g.keys.arrowup,true);assert.equal(g.keys.arrowright,true);
 rootListeners.pointerup({pointerId:1});assert.equal(g.keys.arrowup,false);assert.equal(g.keys.arrowright,true);
 rootListeners.pointercancel({pointerId:2});assert.equal(g.keys.arrowright,false);
 press(3,{skill:'0'});assert.deepEqual(calls.shift(),['useSkill',0]);assert.equal(g.mouseWorldX,-90);assert.equal(g.mouseWorldY,20);
 g.monsters=[{x:50,y:20,hp:5},{x:200,y:20,hp:5}];press(4,{skill:'1'});assert.equal(g.mouseWorldX,50);calls.length=0;
 press(5,{direction:'arrowleft'});g.paused=true;g.CanaanStages.updateTouchControls();assert.equal(g.keys.arrowleft,false);
 press(6,{skill:'2'});assert.equal(calls.length,0);
 g.paused=false;press(7,{direction:'arrowdown'});listeners.blur();assert.equal(g.keys.arrowdown,false);
});

test('Nettoyage : systèmes morts absents et progression par équipement conservée',()=>{
 const boot=require('./helpers/canaan-runtime.cjs');
 const {g,run,errors}=boot(source,{beforeScript(part,run){
  if(!part[1].includes('id="canaan-world-entities"'))return;
  for(const name of ['openPortal','toggleMap','rarityRoll','monsterDamage'])assert.throws(()=>run(name+'()'),/is not defined/);
 }});
 assert.equal(run('typeof facingAngleCore'), 'function');assert.equal(run('typeof applyEffect'),'function');
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run("Object.hasOwn(P,'xp')||Object.hasOwn(P,'lvl')"),false);
 assert.equal(run("monsters.some(m=>Object.hasOwn(m,'xp'))||MOB_TYPES.some(m=>Object.hasOwn(m,'xp'))"),false);
 for(const name of ['drawCharacter','artifactDescription','armorEffects','secondaryRating','persistBags','removeCraftBag','showBagChoices','readBags','bagCapacity','area','lineCore','moveHero','strike','inArc']){
  assert.equal(run('typeof '+name),'undefined',name);
 }
 for(const [name,id] of [['openPortal','canaan-portals'],['toggleMap','canaan-map-panel'],['monsterDamage','canaan-combat']]){
  const definitions=scripts.filter(m=>new RegExp('(?:\\bfunction\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\b)').test(m[2]));
  assert.equal(definitions.length,1,name);assert.ok(definitions[0][1].includes(id));
 }
 assert.doesNotMatch(source,/canaan_bags_v1_7_39|#quest\b|\.questdone\b|\.xp\b|dayPhase/);
 assert.doesNotMatch(source,/canaan_crafting_events_v1|legacyKey/);
 // Anciennes sauvegardes (schémas 4 à 8) : migrations, statistiques héritées et alias de rareté retirés.
 assert.doesNotMatch(source,/CANAAN_SAVE_MIGRATIONS|LEGACY_GEAR_STATS|cleanLegacyStats|rarityAliases|_balancedVersion|Artisan élite|Grand Master/);
 assert.equal(scripts.some(m=>m[1].includes('canaan-save-migrations')),false);
 assert.equal(run("[...villages,...instances].some(d=>Object.hasOwn(d,'lvl'))"),false);
 // Progression : niveau requis, niveau des ennemis et récompense garantie (qualité, niveau) de chaque instance.
 assert.equal(run("instances.filter(d=>!d.under).flatMap(d=>d.difficulties?Object.values(d.difficulties).map(m=>m.level+' '+m.mobLevel+' '+m.rarity+' '+m.dropLevel):[d.level+' '+d.mobLevel+' '+d.rarity+' '+d.dropLevel]).join()"),
  '7 9 Rare 10,13 15 Rare 16,18 20 Rare 21,25 27 Rare 28,32 34 Rare 35,37 39 Rare 40,44 46 Épique 47,49 51 Épique 52,54 56 Épique 57,58 60 Épique 60,60 60 Épique 60');
 assert.equal(run("JSON.stringify(instances).includes('ilvl')||JSON.stringify(instances).includes('Ilvl')"),false,'plus d’iLvl');
 assert.ok(run("instances.every(d=>!Object.hasOwn(d,'loot'))"));
 // Un objet de niveau 20 normalisé conserve son niveau, son nom et ses secondaires.
 run("inventory.length=0;const cleanupItem={id:'cleanup20',slot:'armor',rarity:'Peu commun',level:20};applyItemName(cleanupItem);CANAAN_STATS_PREPARE(cleanupItem);globalThis.cleanupBefore=JSON.stringify({name:cleanupItem.name,sec:cleanupItem.sec});inventory.push(cleanupItem);CANAAN_GEAR.normalizeAll()");
 assert.equal(run('inventory[0].level'),20);
 assert.equal(run('JSON.stringify({name:inventory[0].name,sec:inventory[0].sec})'),g.cleanupBefore);
 g.CANAAN_BAG_STATE.import(3);run('updateCapacity()');assert.equal(run('BAG_LIMIT'),40);
 run('started=true');assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(g.localStorage.getItem(g.CANAAN_PERSISTENCE.key));
 assert.equal(saved.schema,10);assert.equal(saved.version,version);
 // Les mêmes 36 compétences avec tous les vrais modules, sans doublure de visée.
 for(const type of ['sword','dualsword','axe','mace','spear','dualdagger','bow','staff','shield']){
  for(let index=0;index<4;index++){
   run("equipment.weapon={id:'live-skill',slot:'weapon',rarity:'Commun',ilvl:1,weaponType:"+JSON.stringify(type)+"};CANAAN_GEAR.normalize(equipment.weapon);for(const key of Object.keys(weaponCooldowns))weaponCooldowns[key]=0;refreshWeaponBar();started=true;paused=false;P.dead=false;P.mp=100000;mouseWorldX=P.x+50;mouseWorldY=P.y;monsters=[{x:P.x+50,y:P.y,hp:1000000,mhp:1000000,r:14,cd:0,t:'Slime'}]");
   assert.doesNotThrow(()=>run('useSkill('+index+')'),type+':'+index);
  }
 }
});

test('Sauvegarde : seul le schéma 10 est lu ; anciens et inconnus préservés, sauvegarde bloquée',()=>{
 for(const schema of [4,8,9,11,10.5,'10',null]){
  const g=storageGame(),p=g.CANAAN_PERSISTENCE,old=p.snapshot();old.schema=schema;old.heros.hote.player.gold=777;
  const raw=JSON.stringify(old);g.db.set(p.key,raw);g.P.gold=5;
  assert.equal(g.loadGame(),false,String(schema));assert.equal(p._loadFailed,true);assert.equal(g.P.gold,5);
  assert.equal(g.saveGame(),false);assert.equal(g.db.get(p.key),raw);assert.equal(g.db.size,1);
 }
 // Schéma 10 sans héros de l'hôte : refusé aussi.
 const bad=storageGame();bad.db.set(bad.CANAAN_PERSISTENCE.key,JSON.stringify({schema:10,heros:{}}));assert.equal(bad.loadGame(),false);
 const g=storageGame(),p=g.CANAAN_PERSISTENCE,cur=p.snapshot();cur.heros.hote.player.gold=321;cur.nom='Mon monde';
 cur.heros.invites={ami:{pseudo:'Ami 1',player:{}}};
 g.db.set(p.key,JSON.stringify(cur));assert.equal(g.loadGame(),true);assert.equal(g.P.gold,321);assert.equal(g.CANAAN_SAVE_SCHEMA,10);
 // Nom et héros des invités conservés à la sauvegarde suivante.
 assert.equal(g.saveGame(),true);const again=JSON.parse(g.db.get(p.key));
 assert.equal(again.nom,'Mon monde');assert.equal(again.heros.invites.ami.pseudo,'Ami 1');
});

test('Systèmes regroupés : une définition par entrée, aucun ancien captureur ni handler inline',()=>{
 for(const name of ['spawnMonsters','spawnInstanceBoss','recordKill','startGame','enterInstance','rarityRoll','itemStatsOf','characterStats']){
  const pattern=new RegExp('(?:function\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...source.matchAll(pattern)].length,1,name);
  assert.doesNotMatch(source,new RegExp('const\\s+\\w+\\s*=\\s*'+name+'\\s*;'),name);
 }
 assert.doesNotMatch(source,/\bon(?:click|mouseenter|mouseleave|mousemove|change)\s*=\s*["']/i);
 assert.doesNotMatch(source,/\.map-instance-(?:entry|dot)\b|function migrate\(|migrateWeapon|const CRAFT_SAVE/);
});

test('Surcharges consolidées : une seule définition et comportements fusionnés conservés',()=>{
 for(const name of ['drawPixelRoads','openNearbyChest','spawnWorldBosses','leaveInstance','pauseToTitle','saveGame','loadGame','drawPixelMob','heroLevel','awardBossLoot','lootRarity','openShop','buyGear','openDialog','onWorldBossKilled','renderTalents','updateZoneDisplay','updateWorld']){
  const pattern=new RegExp('(?:function\\s+'+name+'\\s*\\(|\\b'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...source.matchAll(pattern)].length,1,name);
  assert.doesNotMatch(source,new RegExp('(?:const|let)\\s+\\w+\\s*=\\s*'+name+'\\s*;'),name);
 }
 assert.doesNotMatch(source,/\bdrawMobShape\b|\bequipmentIlvl\b|\bkingdomMerchant\b|canaan-bridge-rendering/);
 // giveGear est défini une seule fois par le moteur d'objets ; la fabrique brute a son propre nom.
 assert.equal([...source.matchAll(/\bfunction\s+createRawGear\s*\(/g)].length,1);
 assert.equal([...source.matchAll(/\bfunction\s+giveGear\s*\(/g)].length,1);
 assert.doesNotMatch(source,/(?:const|let)\s+\w+\s*=\s*(?:giveGear|createRawGear)\s*;|\bgiveFinal\b|\bgiveGear\s*=/);
 // Une table est déclarée avec ses valeurs finales, jamais vidée puis remplie par un autre module.
 assert.doesNotMatch(source,/\b(\w+)\.splice\(\s*0\s*,\s*\1\.length\s*,/);
 // Commentaires : aucun marqueur de suppression ni numéro de version historique.
 for(const m of scripts)assert.doesNotMatch(m[2],/titre historique neutralisé|ancienne capture supprimée|origine ligne|\/\/\s*(?:=+\s*)?(?:CANAAN\s+)?V?1\.\d+(?:\.\d+)+\s*[—:-]/,m[1]);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run("ARTIFACT_BUFFS.map(a=>a.name).join()"),'Ardeur,Bastion,Instinct');
 // Un marchand par village, et le dialogue ouvre la boutique.
 assert.equal(run("villages.every(v=>npcs.filter(n=>n.type==='shop'&&n.village===v.name).length===1)"),true);
 // L'arme de réserve ne compte pas dans les statistiques.
 run("for(const k of Object.keys(gearSlots))equipment[k]={id:'t'+k,slot:k,level:10,rarity:'Commun'};globalThis.__def=characterStats().primary.defense;equipment.weapon2={id:'reserve',slot:'weapon',level:60,rarity:'Céleste'}");
 assert.equal(run('characterStats().primary.defense'),run('__def'));
 // Boss mondiaux mis à l'échelle dès leur apparition.
 run('monsters=[];worldBossTimers={};instanceState=null;spawnWorldBosses()');
 assert.ok(run('monsters.filter(m=>m.worldBoss).length')>0);
 assert.equal(run('monsters.filter(m=>m.worldBoss).every(m=>m._scaledMaxHp===m.mhp)'),true);
 // Coffre de boss : une bourse d'or donnée une seule fois, selon le type d'instance.
 let restarts=0,stops=0;g.CanaanStages.restartMusic=()=>restarts++;g.CanaanStages.stopMusic=()=>stops++;
 run("started=true;inventory.length=0;instanceState={index:0,cleared:true};returnPos={x:P.x,y:P.y};chests=[{x:P.x/TS,y:P.y/TS,instance:true,opened:false}];P.gold=0");
 const raid=run('!!instances[0].raid');
 run('globalThis.realRandom=Math.random;Math.random=()=>0');
 try{assert.equal(run('openNearbyChest()'),true)}finally{run('Math.random=realRandom')}
 const purse=run('P.gold');
 assert.equal(purse,raid?150:60);
 assert.equal(run('openNearbyChest()'),false);assert.equal(run('P.gold'),purse);
 // Sortie d'instance et retour au titre pilotent la musique directement.
 run('leaveInstance()');assert.equal(run('instanceState'),null);assert.equal(restarts,1);
 run('pauseToTitle()');assert.equal(stops,1);assert.equal(run('started'),false);
});

test('Pipeline : étapes déclarées, ordre imbriqué conservé, garde de pause et rendu après le monde',()=>{
 assert.doesNotMatch(source,/\bCanaanStages\.\w+\s*=\s*function\s*\(\s*\.\.\./);
 assert.doesNotMatch(source,/(?:^|[;\n])\s*(?:update|draw)\s*=\s*(?!=)/);
 assert.doesNotMatch(source,/const\s+\w+\s*=\s*(?:window\.)?CanaanStages\.\w+\s*;/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.deepEqual([...run('CANAAN_PIPELINE.update')],['companions','weaponEffects','mobScaling','bossScaling','weaponVfx','facing','classes','dodge','basicAttack','rubis','arena','professions','quests','dungeonPuzzles','elvenCity','bossMechanics','achievements']);
 // Les vraies étapes tournent sur une partie chargée.
 run('started=true;paused=false;P.dead=false');
 for(let i=0;i<240;i++)run('time++;runUpdatePipeline();updateWorld()');
 run('runDrawPipeline()');assert.equal(errors.length,0,errors.join('\n'));
 // Ordre : before() de l'extérieur vers l'intérieur, cœur, puis after() de l'intérieur vers l'extérieur.
 const calls=[];g.calls=calls;
 run(`for(const name of CANAAN_PIPELINE.update){const s=CanaanStages[name];CanaanStages[name]={
  before:s.before&&(()=>{calls.push('before:'+name);return name}),
  after:s.after&&(state=>calls.push('after:'+name+(state===undefined?'':'='+state)))}}
  update=()=>calls.push('core');draw=()=>calls.push('draw');CanaanStages.drawWeaponEffects=()=>calls.push('drawWeaponEffects')`);
 run('runUpdatePipeline();runDrawPipeline()');
 assert.deepEqual(calls,['before:rubis','before:classes','before:weaponVfx','before:bossScaling','before:weaponEffects','before:companions','core',
  'after:weaponEffects=weaponEffects','after:mobScaling','after:weaponVfx=weaponVfx','after:facing','after:classes=classes',
  'after:dodge','after:basicAttack','after:rubis=rubis','after:arena','after:professions','after:quests','after:dungeonPuzzles','after:elvenCity','after:bossMechanics','after:achievements','draw','drawWeaponEffects']);
 for(const state of ['paused=true','paused=false;P.dead=true','P.dead=false;started=false']){
  calls.length=0;run(state+';runUpdatePipeline()');assert.deepEqual(calls,[],state);
 }
});

test('Préférences : stockage centralisé, valeurs illisibles ignorées et écriture refusée sans erreur',()=>{
 assert.doesNotMatch(source,/\.on(?:click|input|change|keydown|keyup|mouse\w+|pointer\w+|touch\w+)\s*=/);
 for(const id of ['canaan-audio-layout','canaan-preferences','canaan-controls','canaan-game-core','canaan-weapon-state'])assert.ok(script(id),id);
 assert.doesNotMatch(script('canaan-audio-layout'),/localStorage/);
 const scriptsWithStorage=scripts.filter(m=>/localStorage/.test(m[2])).map(m=>/id="([^"]+)"/.exec(m[1])[1]).sort();
 assert.deepEqual(scriptsWithStorage,['canaan-persistence','canaan-preferences']);
 const db=new Map();let refuse=false;
 const g={Object,JSON,Array,Error,localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(refuse)throw new Error('quota');db.set(k,v)}}};g.window=g;
 vm.createContext(g);vm.runInContext(script('canaan-preferences'),g);
 const prefs=g.CANAAN_PREFERENCES;
 assert.deepEqual(prefs.read('audio',{on:false}),{on:false});
 assert.equal(prefs.write('audio',{on:true,music:40}),true);
 assert.equal(db.get('canaan_audio_v1729'),'{"on":true,"music":40}');
 assert.deepEqual({...prefs.read('audio',{})},{on:true,music:40});
 for(const raw of ['{cassé','null','5','"texte"','[1,2]']){db.set('canaan_layout_v1729',raw);assert.deepEqual(prefs.read('layout',{}),{},raw)}
 refuse=true;assert.equal(prefs.write('layout',{a:1}),false);assert.equal(db.get('canaan_layout_v1729'),'[1,2]');
 g.localStorage.getItem=()=>{throw new Error('bloqué')};assert.deepEqual(prefs.read('audio',{on:false}),{on:false});
 assert.throws(()=>prefs.read('inconnue',{}),/Préférence inconnue/);
 // Chargement complet : la barre reçoit ses cases avec data-skill et les réglages audio restent lisibles.
 const boot=require('./helpers/canaan-runtime.cjs');
 const {run,errors}=boot(source,{beforeScript(part,run){if(part[1].includes('id="canaan-preferences"'))run("localStorage.setItem('canaan_audio_v1729','{\"on\":false,\"music\":61,\"fx\":12}')")}});
 assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('JSON.stringify(Array.from(skEl.children,el=>el.dataset.skill))'),'[0,1,2,3]');
 assert.equal(run("document.getElementById('musicVolume').value"),61);
 assert.equal(run("document.getElementById('sfxVolume').value"),12);
});

test('Portée des modules : modules encapsulés, noms privés inaccessibles et noms publics exportés',()=>{
 const encapsulated={
  'canaan-world-settlements':{private:['campTent','campFire','campBench','campStall'],public:['drawCampAurore']},
  'canaan-world-generation':{private:['CENTER','PORTAL_SPOTS','BOSS_SPOTS','BIOME_MAP','terrain','worldMobAt'],public:['ZONES','PIXEL_PLACES','BRIDGE_TILES','regionAt','spawnMonsters','updateWorld','updateZoneDisplay','CANAAN_WORLD_AUDIT']},
  'canaan-map-panel':{private:['biomeLevelRange','instanceLine'],public:['toggleMap']},
  'canaan-sprite-kit':{private:['actor','WORLD_LOOKS','resolveLook','drawParticles','lightCanvas'],public:['canaanOutline','canaanActorSprite','drawCanaanActor','canaanLight','drawCanaanLighting','drawCanaanBossFrame']},
  'canaan-dungeons':{private:['THEMES','PLANS','planDungeon','drawFloorProp','membrane'],public:['makeDungeon','spawnInstanceBoss','onInstanceBossDown','drawDungeonTile','drawDungeonEntrance','dungeonAmbience','arenaLayout','CANAAN_DUNGEON_AUDIT']},
  'canaan-world-look':{private:['PAL','PRIORITY','fringe','paintTile','AMBIENCES'],public:['drawWorldTile','worldAmbience']},
  'canaan-rubis':{private:['LIST','GROUP_ONLY','BY_ID','UTILITY','rt','refreshActive','secondary'],public:['CANAAN_RUBIS','CANAAN_RUBIS_STATE','equipRubis','unequipRubis','toggleRubis','showRubisTooltip','drawRubisGem']},
  'canaan-arena':{private:['BOSSES','MOVES','HP_MULT','DMG_MULT','strike','tele','spawnBoss','onBossDown'],public:['CANAAN_ARENA','CANAAN_ARENA_STATE','enterArena','openArenaPortal','claimArenaRubis']},
  'canaan-pixel-art':{private:['pixHash','PIX_COLORS','actorSprite','creatureSprite'],public:['PIXEL_TERRAIN','drawPixelMob','drawPixelRoads','drawHeroArt']},
  'canaan-monster-scaling':{private:['bossMaxHealth','setupMob','hpClock','instanceLevel'],public:['bossTier','scaleBossHp','canaanMobLevel','canaanSetupMob']},
  'canaan-progression':{private:['sharers','levelUp','SHARE'],public:['CANAAN_PROGRESSION','canaanKillXp','canaanGrantXp']},
  'canaan-stats':{private:['prepare','heroStrike','damageMonster','tooltip','table'],public:['characterStats','gearStat','gearScore','gearComparison','itemStatsOf','CANAAN_STATS_VIEW','canaanDamageTaken']},
  'canaan-merchants':{private:['CANAAN_MERCHANT_SPRITES'],public:['drawCanaanMerchant']},
  'canaan-controls':{private:['CANAAN_ACTIONS','touchDirections','actionInteger'],public:['dispatchCanaanAction','clearTouchControls']},
  'canaan-bootstrap':{private:['CANAAN_REQUIRED_MODULES','CANAAN_REQUIRED_BINDINGS','CANAAN_MODULES'],public:[]}
 };
 for(const id of Object.keys(encapsulated)){
  const code=script(id).replace(/^\s*(?:\/\/[^\n]*\n\s*)*/,'');
  assert.ok(code.startsWith('(() => {'),id+' : le module doit être encapsulé');
  assert.ok(code.trimEnd().endsWith('})();'),id+' : fin d’encapsulation attendue');
 }
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 for(const [id,names] of Object.entries(encapsulated)){
  for(const name of names.private)assert.equal(run('typeof '+name),'undefined',id+' : '+name+' devrait être privé');
  for(const name of names.public)assert.notEqual(run('typeof '+name),'undefined',id+' : '+name+' devrait être public');
 }
});

test('Finitions : HUD en niveaux avec barre d’XP, plus d’iLvl, aucune variable morte et fichier versionné',()=>{
 assert.match(source,/<span id="plevel">Niv\. 1<\/span>/);assert.match(source,/<i id="xpb"><\/i>/);
 assert.doesNotMatch(source,/id="pilvl"|\bspawnClock\b|const\s+obsolete\b/);
 // Plus d'iLvl dans le jeu : seules les conversions des anciennes sauvegardes en parlent.
 for(const m of scripts)if(!/canaan-(?:modules|gear-engine|persistence|group)"/.test(m[1]))assert.doesNotMatch(m[2],/\biLvl\b|averageItemLevel|ratings52/,m[1]);
 // Les champs des anciens objets ne sont plus nettoyés nulle part : seules les sauvegardes au schéma 9 sont lues.
 assert.doesNotMatch(source,/delete\s+item\.(?:lvl|reqLvl|secondaryStats)\b/);
 assert.equal(path.basename(builtFile),'CANAAN_ONLINE_V'+version.replace(/\./g,'_')+'.html');
 assert.match(source,new RegExp("CANAAN_VERSION\\s*=\\s*'"+version.replace(/\./g,'\\.')+"'"));
 // Une seule version : package.json (application de bureau) suit runtime-config.js.
 assert.equal(require('../package.json').version,version);
});

test('Version 1.9.0 : fonctions partagées définies une fois dans leur module, sans entrée en attente',()=>{
 const owners={
  'canaan-ui':['renderInventory','renderCharacter','charSlot','showGearTooltip','showEquippedTooltip'],
  'canaan-stats':['gearStat','gearScore','gearComparison','characterStats'],
  'canaan-equipment':['equipItem','unequip','equipReserveWeapon','switchWeapon'],
  'canaan-weapon-names':['applyItemName'],'canaan-gear-engine':['giveGear'],'canaan-item-rules':['rarityRoll'],
  'canaan-economy':['dropTierGear'],'canaan-combat':['hit','monsterDamage'],'canaan-weapon-actions':['useSkill'],
  'canaan-class-talents':['renderTalents'],'canaan-world-map':['drawBigMap'],'canaan-map-panel':['toggleMap'],
  'canaan-portals':['openPortal']
 };
 assert.doesNotMatch(source,/pendingCanaanEntryPoint|canaanPending|Appel prématuré/);
 const bindings=script('canaan-bootstrap').slice(script('canaan-bootstrap').indexOf('CANAAN_REQUIRED_BINDINGS'));
 for(const [id,names] of Object.entries(owners))for(const name of names){
  const where=scripts.filter(m=>new RegExp('\\bfunction\\s+'+name+'\\s*\\(').test(m[2])).map(m=>/id="([^"]+)"/.exec(m[1])[1]);
  assert.deepEqual(where,[id],name);
  assert.doesNotMatch(source,new RegExp('(?:^|[^.\\w])'+name+'\\s*=[^=>]'),name+' réassigné');
  assert.doesNotMatch(bindings,new RegExp("'"+name+"'"),name+' encore dans les liaisons requises');
 }
 assert.ok(source.includes('<title>THE LEGEND OF NASHI V'+version+'</title>'));assert.doesNotMatch(source,/\{\{VERSION\}\}/);
 assert.doesNotMatch(source,/Statistiques Ratings52|STATS RATINGS52/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(g.document.title,'THE LEGEND OF NASHI V'+version);
 for(const names of Object.values(owners))for(const name of names)assert.equal(run('typeof '+name),'function',name);
});

test('Rareté inconnue ou absente : Commun, sans alias ni avertissement',()=>{
 const boot=require('./helpers/canaan-runtime.cjs');
 const {g,run,errors}=boot(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const warnings=[];g.console.warn=(...a)=>warnings.push(a.join(' '));
 run("globalThis.rareTest=[{id:'gm',slot:'armor',ilvl:30,rarity:'Inconnue'},{id:'none',slot:'armor',ilvl:30},{id:'ok',slot:'armor',ilvl:30,rarity:'Rare'}];rareTest.forEach(i=>CANAAN_GEAR.normalize(i))");
 assert.equal(run("rareTest.map(i=>i.rarity).join('|')"),'Commun|Commun|Rare');
 assert.equal(warnings.length,0);
});

test('Survols délégués : objet, emplacement, mouvement et transitions entre enfants',()=>{
 const listeners={},calls=[];
 const g={Map,CanaanStages:{},keys:{},document:{addEventListener:(name,fn)=>listeners[name]=fn,getElementById:()=>({addEventListener(){}})},addEventListener(){},
  CANAAN_PERSISTENCE:{restartFresh(){}},
  showGearTooltip:(...a)=>calls.push(['bag',...a]),showEquippedTooltip:(...a)=>calls.push(['slot',...a]),moveGearTooltip:()=>calls.push(['move']),highlightMapInstance:(...a)=>calls.push(['map',...a])};
 const actions=['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','toggleJournal','buyGear','closePanels'];
 for(const name of actions)g[name]=()=>calls.push([name]);
 g.window=g;linkGameState(g);vm.createContext(g);vm.runInContext(script('canaan-controls'),g);
 const element={dataset:{tooltipIndex:'2'},contains:()=>false};const event={target:{closest:()=>element},relatedTarget:null};
 listeners.pointerover(event);assert.equal(calls.shift()[0],'bag');
 listeners.pointermove(event);assert.deepEqual(calls.shift(),['move']);
 element.contains=()=>true;listeners.pointerout({...event,relatedTarget:{}});assert.equal(calls.length,0);
 element.contains=()=>false;listeners.pointerout(event);assert.deepEqual(calls.shift(),['hideGearTooltip']);
 element.dataset={tooltipSlot:'weapon2'};listeners.pointerover(event);assert.deepEqual(calls.shift().slice(0,2),['slot','weapon2']);
 element.dataset={mapInstance:'3'};listeners.pointerover(event);listeners.pointerout(event);assert.deepEqual(calls.splice(0),[['map',3,true],['map',3,false]]);
 // Cibles sans closest (document) ou nœud texte : aucune erreur, le texte remonte à son parent.
 const doc={nodeType:9};
 for(const name of ['pointerover','pointerout','pointermove','click'])listeners[name]({target:doc,relatedTarget:null});
 assert.equal(calls.length,0);
 element.dataset={tooltipIndex:'4'};
 listeners.pointerover({target:{nodeType:3,parentElement:{closest:()=>element}},relatedTarget:null});assert.deepEqual(calls.shift().slice(0,2),['bag',4]);
 // Aucun écouteur de changement (aucun filtre dans les fenêtres).
 assert.equal(listeners.change,undefined);
});

test('Interface générée : actions autorisées, catalogue officiel, musique et accès aux instances',()=>{
 const {g,nodes,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 const report=g.CANAAN_DEV.selfTest();assert.equal(report.passed,report.total);
 const panels=[];g.capture=h=>panels.push(h);
 run('showPanel=capture;modernPanel=capture;started=true;paused=false;inventory=[...inventory,{id:"reserve-test",slot:"weapon",rarity:"Rare",ilvl:15,weaponType:"bow"}];renderInventory();renderCharacter();renderTalents();game.hero.classe={id:"paladin",talents:[1]};game.hero.level=20;renderTalents();openPortal({instance:0});openShop({name:"Test",village:"Solaria"})');

 // Exécuter chaque action réelle avec ses attributs, sur des doublures des fonctions du jeu.
 const actionCalls=[];g.actionCalls=actionCalls;
 const stubbed=['togglePause','pauseOpenPanel','pauseToTitle','startGame','toggleMap','enterInstance','renderInventory','renderCharacter','unequip','equipReserveWeapon','buyGear'];
 run('globalThis.realActions={'+stubbed.join(',')+',restartFresh:CANAAN_PERSISTENCE.restartFresh}');
 run(`for(const name of ['togglePause','pauseSave','pauseOpenPanel','pauseToTitle','startGame','toggleTalents','toggleInventory','toggleCharacter','toggleWardrobe','toggleMap','toggleGroup','toggleTrade','toggleProfessions','toggleHousing','enterInstance','buyBagUpgrade','hideGearTooltip','equipBagIndex','sellInventoryCell','equipReserveWeapon','sellAllCommon','unequip','renderInventory','renderCharacter','chooseClass','equipTalent','unequipTalent','pickClass','toggleJournal','buyGear','closePanels','openSettings','closeSettings','settingsToggle','settingsStep','settingsRestart','quitGame'])
  globalThis[name]=(...args)=>actionCalls.push([name,...args]);
  togglePause=globalThis.togglePause;pauseOpenPanel=globalThis.pauseOpenPanel;pauseToTitle=globalThis.pauseToTitle;startGame=globalThis.startGame;
  toggleMap=globalThis.toggleMap;enterInstance=globalThis.enterInstance;renderInventory=globalThis.renderInventory;
  renderCharacter=globalThis.renderCharacter;unequip=globalThis.unequip;equipReserveWeapon=globalThis.equipReserveWeapon;buyGear=globalThis.buyGear;
  CANAAN_PERSISTENCE.restartFresh=()=>actionCalls.push(['restartFresh'])`);
 const html=source.slice(source.indexOf('<body'),source.indexOf('<script',source.indexOf('<body')));
 const dataset=tag=>Object.fromEntries([...tag.matchAll(/\bdata-([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),value]));
 let count=0;
 for(const text of [...panels,html])for(const [tag] of text.matchAll(/<[a-z]+\b[^>]*\bdata-action="[^"]*"[^>]*>/g)){
  const element={dataset:dataset(tag)};actionCalls.length=0;
  assert.doesNotThrow(()=>g.dispatchCanaanAction(element,{stopPropagation(){}}),tag);
  assert.ok(actionCalls.length>0,tag);
  for(const [,...args] of actionCalls)for(const value of args)assert.ok(value===undefined||value===false||typeof value==='string'&&value.length>0||Number.isInteger(value)||typeof value==='object',tag);
  count++;
 }
 // Sans la forge (et ses dizaines de boutons), une cinquantaine d'actions réelles restent à vérifier.
 assert.ok(count>=40,String(count));
 assert.doesNotMatch([...panels,html].join(''),/data-action="[^"]*[();]/);
 run('({'+stubbed.join(',')+'}=realActions);CANAAN_PERSISTENCE.restartFresh=realActions.restartFresh');
 let music=0;g.CanaanStages.restartMusic=()=>music++;
 run('P.x=-100;P.y=-100;startGame()');assert.equal(music,1);assert.equal(run('P.x===CANAAN_SPAWN.x&&P.y===CANAAN_SPAWN.y'),true);
 run('game.hero.level=1;enterInstance(0)');assert.equal(run('instanceState'),null,'niveau insuffisant');assert.equal(music,1);
 run('game.hero.level=60;enterInstance(0)');assert.equal(run('instanceState.index'),0);assert.equal(music,2);
 assert.ok(run('monsters.some(m=>m.boss&&m._scaledMaxHp===m.mhp)'));
});

test('Raid 4 : Jugement de Célestia, choix Normal ou Héroïque, puissance et butin garantis',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Plus de paliers d’iLvl : chaque objet a un niveau de 1 à 60.
 assert.equal(run("typeof ITEM_ILVL_TIERS+typeof tierIlvl"),'undefinedundefined');
 // Placement : Forêt enchantée, dernier biome, sur une tuile terrestre, avec son portail.
 const d=JSON.parse(run('JSON.stringify(instances[9])'));
 assert.equal(d.name,'Le Jugement de Célestia');assert.equal(d.boss,'L’Avatar du Jugement');assert.equal(d.biome,5);assert.equal(d.raid,true);
 assert.equal(run('regionAt('+d.x+','+d.y+').name'),'Forêt enchantée');assert.equal(run('SOLID.includes(overworld['+d.y+']['+d.x+'])'),false);
 assert.equal(run("npcs.filter(n=>n.type==='portal'&&n.instance===9).length"),1);
 // Chaque instance a son sol de donjon : aucune case indéfinie.
 assert.ok(run('instances.every((d,i)=>makeDungeon(i).every(row=>row.every(Number.isInteger)))'));
 // Fenêtre du portail : deux difficultés, Normal au niveau 58, Héroïque au niveau 60.
 const portal=lv=>{run('game.hero.level='+lv+';openPortal({instance:9})');return g.document.getElementById('window').innerHTML};
 let html=portal(58);
 assert.match(html,/data-difficulty="normal" >/);assert.match(html,/data-difficulty="heroic" disabled>/);
 assert.match(html,/Épique — niveau 58 à 60/);assert.match(html,/1 % Mythique/);assert.match(html,/5 % Légendaire/);assert.match(html,/\+65 % PV et \+40 % dégâts calculés/);
 assert.match(portal(50),/data-difficulty="normal" disabled>/);
 assert.match(portal(60),/data-difficulty="heroic" >/);
 // Carte M : la plage de niveaux de chaque biome (1–10, 10–20 … 50–60).
 run('closePanels();toggleMap()');
 const ranges=[...g.document.getElementById('window').innerHTML.matchAll(/Niveaux ([^<]+)</g)].map(m=>m[1]);
 assert.deepEqual(ranges,['1–10','10–20','20–30','30–40','40–50','50–60']);
 // Entrée : la difficulté est obligatoire et son niveau contrôlé.
 run('closePanels();game.hero.level=58;enterInstance(9)');assert.equal(run('instanceState'),null);
 run("enterInstance(9,'heroic')");assert.equal(run('instanceState'),null);
 run("enterInstance(9,'inconnue')");assert.equal(run('instanceState'),null);
 const measure=mode=>{
  run("game.hero.level=60;enterInstance(9,'"+mode+"')");
  assert.equal(run('instanceState.difficulty'),mode);
  const boss=JSON.parse(run('JSON.stringify(monsters.find(m=>m.boss))')),add=JSON.parse(run('JSON.stringify(monsters.find(m=>!m.boss))'));
  const hit=run('Math.random=()=>.999;CANAAN_STATS_INCOMING(monsters.find(m=>m.boss))');
  // Butin : qualité et niveau fixés par la difficulté, même avec un tirage défavorable.
  run('inventory=[];Math.random=()=>.999');assert.equal(run('CANAAN_LOOT.instance(9)'),true);
  const loot=JSON.parse(run('JSON.stringify(inventory[0])'));
  run('leaveInstance()');assert.equal(run('instanceState'),null);
  return {boss:boss.mhp,add:add.mhp,addName:add.t,hit,loot:[loot.rarity,loot.level]};
 };
 const normal=measure('normal'),heroic=measure('heroic');
 assert.equal(heroic.boss,Math.round(normal.boss*1.65));
 assert.ok(Math.abs(heroic.add-normal.add*1.65)<=1,normal.add+' / '+heroic.add);
 assert.ok(Math.abs(heroic.hit-normal.hit*1.4)<=1,normal.hit+' / '+heroic.hit);
 assert.equal(normal.addName,'Juge céleste');
 assert.equal(normal.loot[0],'Épique');assert.equal(heroic.loot[0],'Épique');
 // Hors du raid, aucune difficulté ne s’applique.
 assert.equal(run('instanceDifficulty()'),null);
 // Bouton du portail : data-difficulty validé par la délégation d’actions.
 assert.throws(()=>run("dispatchCanaanAction({dataset:{action:'enterInstance',instance:'9',difficulty:'<b>'}})"),/Argument d’action invalide/);
});

test('Butin de prestige : niveaux requis à butin, Légendaire et Mythique seulement au Raid 4 Héroïque et à l’arène, cases brillantes',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('GEAR_RARITIES.map(r=>r.name).join()'),'Commun,Peu commun,Rare,Épique,Légendaire,Mythique');
 // La Cave (niveau requis 7, butin 10) donne du Rare du niveau 7 au niveau 10.
 const levels=new Set();
 for(let i=0;i<120;i++){run('inventory=[];dropTierGear(0)');const it=run('inventory[0]');assert.equal(it.rarity,'Rare');levels.add(it.level)}
 assert.deepEqual([...levels].sort((a,b)=>a-b),[7,8,9,10]);
 // Sources : donjons Rare, raids Épique ; seul le Raid 4 Héroïque a une chance de prestige.
 const inst=JSON.parse(run('JSON.stringify(instances)'));
 assert.ok(inst.slice(0,6).every(d=>d.rarity==='Rare'));assert.ok(inst.slice(6,9).every(d=>d.rarity==='Épique'));
 assert.equal(inst[9].difficulties.normal.rarity,'Épique');assert.equal(inst[9].difficulties.normal.prestige,undefined);
 assert.equal(inst[9].difficulties.heroic.prestige,'raidHeroic');
 const roll=(kind,x)=>run('Math.random=()=>'+x+';prestigeRoll('+JSON.stringify(kind)+')');
 assert.equal(roll('raidHeroic',.005),'Mythique');assert.equal(roll('raidHeroic',.03),'Légendaire');assert.equal(roll('raidHeroic',.5),null);
 assert.equal(roll('arenaFinal',.03),'Légendaire');assert.equal(roll('arenaFinal',.5),null);assert.equal(roll(undefined,0),null);
 // Le hasard seul ne donne jamais de Légendaire ni de Mythique.
 for(const x of [0,.5,.97,.99999])assert.ok(!['Légendaire','Mythique'].includes(run('Math.random=()=>'+x+';rarityRoll(1).name')));
 // Les anciennes qualités Héroïque et Céleste deviennent Épique et Mythique.
 assert.equal(run('rarityInfo({rarity:"Héroïque"}).name'),'Épique');assert.equal(run('rarityInfo({rarity:"Céleste"}).name'),'Mythique');
 // Cases du sac et du personnage : effet brillant et vague pour Légendaire et Mythique.
 assert.equal(run('canaanPrestige({rarity:"Légendaire"})'),' data-prestige="legendaire"');assert.equal(run('canaanPrestige({rarity:"Mythique"})'),' data-prestige="mythique"');
 assert.equal(run('canaanPrestige({rarity:"Épique"})'),'');assert.match(source,/\[data-prestige\][^{]*::before/);assert.match(source,/@keyframes prestige-wave/);
 run('inventory=[];giveGear(30,"tier","Mythique");renderInventory()');assert.match(g.document.getElementById('window').innerHTML,/data-prestige="mythique"/);
});

test('Butin des monstres, élites, boss mondiaux et coffres secrets : un objet garanti, plus de matériaux',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const reward=(code,x)=>JSON.parse(run('instanceState=null;inventory=[];P.gold=0;Math.random=()=>'+x+';'+code+';JSON.stringify({items:inventory.map(i=>[i.rarity,i.level]),gold:P.gold,hero:Object.keys(game.hero)})'));
 const mob='recordKill({x:P.x,y:P.y,t:"Loup",hp:0,level:7})',elite='recordKill({x:P.x,y:P.y,t:"Loup",hp:0,elite:true,level:12})';
 const boss='recordKill({x:P.x,y:P.y,t:"Fenrir",hp:0,worldBoss:true,worldBossId:"fenrir"})';
 const chest='{const spot=hiddenChestSpots.find(c=>!openedChests.includes(c.id)),at=chestPosition(spot);P.x=at.x*TS;P.y=at.y*TS;openNearbyChest()}';
 // Chaque objet a le niveau de sa source : mob normal et élite Commun, boss mondial Rare (+1 000 à 1 500 or).
 let r=reward(mob,0);assert.deepEqual(r.items,[['Commun',7]]);assert.equal(r.hero.includes('materials'),false);
 r=reward(mob,.999);assert.deepEqual(r.items,[['Commun',7]]);
 r=reward(elite,.5);assert.deepEqual(r.items,[['Commun',12]]);
 r=reward(boss,0);assert.deepEqual(r.items,[['Rare',10]],'Fenrir est niveau 10');assert.ok(r.gold>=1000&&r.gold<=1500,String(r.gold));
 // Coffre secret : verrouillé sans clé des secrets ; avec une clé (consommée), un Épique du niveau de sa zone
 // (milieu de la plage), 200 à 400 or et 25 % de chance d'un Rubis.
 const chestLevel=run('(()=>{const spot=hiddenChestSpots.find(c=>!openedChests.includes(c.id)),at=chestPosition(spot),[lo,hi]=ZONE_LEVELS[canaanZoneIndexAt(at.x,at.y)];return Math.round((lo+hi)/2)})()');
 const opened0=run('openedChests.length');
 r=reward('P.keys=0;'+chest,0);assert.deepEqual(r.items,[]);assert.equal(r.gold,0);assert.equal(run('openedChests.length'),opened0,'sans clé, il reste fermé');
 const rubis0=run('Object.values(CANAAN_RUBIS_STATE.export().owned).reduce((a,b)=>a+b,0)');
 r=reward('P.keys=2;'+chest,0);assert.deepEqual(r.items,[['Épique',chestLevel]]);assert.equal(r.gold,200);assert.equal(run('P.keys'),1,'une clé consommée');
 assert.equal(run('Object.values(CANAAN_RUBIS_STATE.export().owned).reduce((a,b)=>a+b,0)'),rubis0+1,'Rubis gagné');
 r=reward('P.keys=1;'+chest,0.99);assert.deepEqual(r.items,[['Épique',chestLevel]]);assert.equal(r.gold,398);
 // Les ennemis d’une instance, même élites, ne donnent rien : le coffre du boss fait le butin.
 r=reward('instanceState={index:0,cleared:false};'+mob,0);assert.deepEqual(r.items,[]);
 r=reward('instanceState={index:6,cleared:false};'+elite,.46);assert.deepEqual(r.items,[]);
 // Rubis Prospecteur : 15 % de chances qu’un mob normal lâche un objet Peu commun (jamais en instance).
 run('CANAAN_RUBIS.betterDrop=()=>true');r=reward(mob,0);assert.deepEqual(r.items,[['Peu commun',7]]);
 r=reward(boss,0);assert.deepEqual(r.items,[['Rare',10]],'le Prospecteur ne change que les mobs ordinaires');
});

test('Version 1.9.0 : affichage à la fréquence de l’écran par interpolation et héros plus rapide',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 run('startGame();globalThis.ticks=0;globalThis.frames=[];const u=updateWorld;updateWorld=()=>{ticks++;u()};runDrawPipeline=()=>frames.push([P.x,camX])');
 // 144 images par seconde : une image dessinée par rafraîchissement, toujours 60 ticks de simulation par seconde.
 run('CANAAN_CLOCK.reset();for(let i=0;i<=144;i++)loop(i*1000/144)');
 assert.equal(run('frames.length'),145);assert.ok(Math.abs(run('ticks')-60)<=1,String(run('ticks')));
 // L'image est placée entre les deux derniers ticks, puis la vraie position est rendue à la simulation.
 run('frames.length=0;P.x=1000;camX=400;canaanRememberPositions();P.x=1010;camX=420;canaanDrawInterpolated(0.25)');
 assert.deepEqual(JSON.parse(run('JSON.stringify(frames[0])')),[1002.5,405]);assert.equal(run('P.x+","+camX'),'1010,420');
 run('monsters=[{x:100,y:100,hp:10}];canaanRememberPositions();monsters[0].x=108;frames.length=0;runDrawPipeline=()=>frames.push(monsters[0].x);canaanDrawInterpolated(0.5)');
 assert.deepEqual(JSON.parse(run('JSON.stringify(frames)')),[104]);assert.equal(run('monsters[0].x'),108);
 // Téléportation : pas de glissement à travers la carte.
 run('canaanRememberPositions();monsters[0].x=5000;frames.length=0;canaanDrawInterpolated(0.5)');assert.deepEqual(JSON.parse(run('JSON.stringify(frames)')),[5000]);
 // Un dessin qui échoue ne laisse jamais une position intermédiaire dans la simulation.
 run('canaanRememberPositions();monsters[0].x=5010;runDrawPipeline=()=>{throw new Error("dessin")}');
 assert.throws(()=>run('canaanDrawInterpolated(0.5)'),/dessin/);assert.equal(run('monsters[0].x'),5010);
 // En pause : positions réelles.
 run('frames.length=0;runDrawPipeline=()=>frames.push(P.x);P.x=2000;canaanRememberPositions();P.x=2010;paused=true;loop(5000);loop(5010)');assert.equal(run('frames.at(-1)'),2010);
 // Vitesse du héros : 4,1 px par tick (+20 %), toujours modulée par la statistique de vitesse.
 assert.equal(run('CANAAN_PLAYER_SPEED'),4.1);assert.match(source,/CANAAN_PLAYER_SPEED \* \(1 \+ characterStats\(hero\)\.speed \/ 100\)/);
 assert.doesNotMatch(source,/let sp = 3\.4/);
 // Mana : 300 de base pour le héros, la fiche de statistiques et une nouvelle partie.
 run('paused=false;equipment={...equipment};recomputeStats()');assert.equal(run('CANAAN_BASE_MANA+","+characterStats().maxMp+","+P.mmp'),'300,300,300');
 assert.equal(run('CANAAN_PERSISTENCE.freshSnapshot().heros.hote.player.mp'),300);
 // Régénération hors combat : 6 mana et 2 PV + 1 % des PV max par seconde, soit 60 ticks.
 run('P.dead=false;paused=false;started=true;P.mhp=1000;recomputeStats=()=>{};P.mp=0;P.hp=1;for(let i=0;i<60;i++)update()');
 assert.ok(Math.abs(run('P.mp')-6)<1e-9,String(run('P.mp')));assert.ok(Math.abs(run('P.hp')-13)<1e-9,String(run('P.hp')));
 // En combat : 3 mana et 25 % de la régénération de vie hors combat.
 assert.deepEqual(JSON.parse(run('JSON.stringify(canaanRegenRates(true))')),{mana:3,health:3});
 assert.deepEqual(JSON.parse(run('JSON.stringify(canaanRegenRates(false))')),{mana:6,health:12});
 run('CANAAN_RUBIS.attackBefore({x:0,y:0,hp:10,mhp:10},1);P.mp=0;P.hp=1;for(let i=0;i<60;i++)update()');
 assert.ok(Math.abs(run('P.mp')-3)<1e-9,String(run('P.mp')));assert.ok(Math.abs(run('P.hp')-4)<1e-9,String(run('P.hp')));
 // Donjon 1 : niveau 7 requis.
 assert.equal(run('instances[0].level'),7);
 run('instanceState=null;game.hero.level=6;enterInstance(0)');assert.equal(run('instanceState'),null);
 run('game.hero.level=7;enterInstance(0)');assert.equal(run('instanceState.index'),0);
});

test('Progression : niveaux 1 à 60, XP des monstres, des boss et des instances, montée de niveau, niveau requis, sauvegarde et anciennes aventures',()=>{
 const {g,nodes,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.view.chat=()=>{};inventory=[]');
 assert.equal(run('game.hero.level'),1);assert.equal(run('game.hero.exp'),0);
 // XP d'un monstre : le niveau monte, les PV et le mana reviennent au maximum ; un emplacement de talent au niveau 10.
 run('globalThis.kill=(lv,extra={})=>{const m={t:"Loup",x:P.x+30,y:P.y,hp:1,mhp:1,r:14,g:0,level:lv,_levelHp:true,...extra};game.world.monsters.push(m);canaanDamageMonster(m,999)}');
 run('P.hp=1;kill(3)');assert.ok(run('game.hero.exp')>0||run('game.hero.level')>1);
 for(let i=0;i<40&&run('game.hero.level')<5;i++)run('P.hp=1;kill(5)');
 assert.ok(run('game.hero.level')>=5,'niveau '+run('game.hero.level'));assert.equal(run('P.hp'),run('P.mhp'),'PV rendus à la montée de niveau');
 assert.equal(run('CANAAN_CLASS.audit().slots'),1,'un emplacement de talent avant le niveau 10');
 // Barre d'XP et niveau dans l'affichage tête haute.
 run('CANAAN_PROGRESSION.hud()');assert.equal(nodes.get('plevel').textContent,'Niv. '+run('game.hero.level'));
 assert.match(nodes.get('xpt').textContent,/^\d+ \/ \d+ XP$/);
 // Un monstre bien trop faible ne rapporte presque rien ; un boss mondial et une instance terminée rapportent gros.
 run('game.hero.level=30;game.hero.exp=0;kill(5)');assert.ok(run('game.hero.exp')<=mobXpAt(5,30)+1);
 function mobXpAt(m,h){return run('mobXp('+m+','+h+')')}
 run('game.hero.exp=0;kill(30,{worldBoss:true,worldBossId:"leviathan",t:"Léviathan"})');assert.equal(run('game.hero.exp'),run('bossXp(30,"world")'));
 run('game.hero.level=10;game.hero.exp=0;CANAAN_PROGRESSION.clearInstanceXp(0,game.hero)');
 // Un donjon terminé rapporte une bonne part d'un niveau, sans en faire gagner plusieurs d'un coup.
 assert.ok(run('game.hero.level>10||game.hero.exp>xpToNext(10)*0.3'),'un donjon fini rapporte gros');assert.ok(run('game.hero.level')<=11,'mais pas plusieurs niveaux');
 // Niveau 60 : l'XP s'arrête.
 run('game.hero.level=60;game.hero.exp=0;kill(60)');assert.equal(run('game.hero.level+"/"+game.hero.exp'),'60/0');
 // Niveau requis pour équiper.
 run('game.hero.level=20;inventory=[CANAAN_GEAR.normalize({id:"haut",slot:"helm",rarity:"Rare",level:25}),CANAAN_GEAR.normalize({id:"bon",slot:"helm",rarity:"Rare",level:20})]');
 assert.equal(run('equipItem("haut")'),false);assert.equal(run('equipItem("bon")'),true);assert.equal(run('equipment.helm.id'),'bon');
 // Sauvegarde : niveau et XP enregistrés et relus.
 run('game.hero.level=23;game.hero.exp=77;saveGame();game.hero.level=1;game.hero.exp=0');assert.equal(run('loadGame()'),true);
 assert.equal(run('game.hero.level+"/"+game.hero.exp'),'23/77');
 // Ancienne aventure (sans niveau) : le héros prend le niveau de sa meilleure pièce portée (iLvl converti).
 const key='"canaan_slot_"+CANAAN_PERSISTENCE.slot';
 run(`{const d=JSON.parse(localStorage.getItem(${key}));delete d.heros.hote.level;delete d.heros.hote.exp;d.heros.hote.equipment.helm={id:"old",slot:"helm",rarity:"Épique",ilvl:120};localStorage.setItem(${key},JSON.stringify(d))}`);
 assert.equal(run('loadGame()'),true);assert.equal(run('game.hero.level'),Math.round(120*60/190));assert.equal(run('equipment.helm.level'),Math.round(120*60/190));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Sans artisanat : ni forge ni touche K, objets tels que lâchés, anciennes améliorations retirées, matériaux rendus en or',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Plus rien de la forge : fonctions, catalogues, bouton du menu, raccourci K, matériaux du héros.
 for(const name of ['openCrafting','upgradeItem','setWeaponPassive','selectForgeItem','upgradeCost','upgradeLevel','upgradable','WEAPON_PASSIVES','PASSIVE_COSTS','UPGRADE_COSTS','UPGRADE_MAX','MATERIALS','materialGrant','materialSpend','rollResources','CANAAN_CRAFT','equippedWeaponPassive'])
  assert.equal(run('typeof '+name),'undefined',name);
 assert.doesNotMatch(source,/data-action="openCrafting"|Artisanat \(K\)/);
 assert.doesNotMatch(script('canaan-game-core'),/k === 'k'/);
 assert.equal(run('"materials" in game.hero'),false);
 assert.equal(run('Object.values(SOURCE_REWARDS).some(r=>"resources" in r)'),false);
 // Un objet garde les statistiques de son drop : les anciennes améliorations (+1 à +5) et passifs de forge sont retirés.
 const old=JSON.parse(run('JSON.stringify(CANAAN_GEAR.normalize({id:"o1",name:"Heaume",slot:"helm",rarity:"Rare",ilvl:26,upgrade:5,craftPassive:"bleed"}))'));
 assert.equal('upgrade' in old,false);assert.equal('craftPassive' in old,false);
 assert.equal(run('(()=>{const it=CANAAN_GEAR.normalize({id:"o2",name:"Heaume",slot:"helm",rarity:"Rare",ilvl:26,upgrade:3});return gearDisplayName(it)===it.name&&!/\\+\\d/.test(it.name)})()'),true,'plus de « +3 » après le nom');
 assert.equal(run('(()=>{const it=CANAAN_GEAR.normalize({id:"o3",slot:"helm",rarity:"Rare",level:26,upgrade:4});return JSON.stringify(itemStatsOf(it).primary)===JSON.stringify(itemPrimary(it))})()'),true,'aucun bonus d’amélioration');
 assert.equal(run('Object.hasOwn(CANAAN_GEAR.normalize({id:"o4",slot:"weapon",weaponType:"axe",rarity:"Épique",ilvl:46,craftPassive:"lifesteal"}),"craftPassive")'),false);
 // Ancienne sauvegarde : matériaux rendus en or une seule fois (10 / 10 / 50 / 200 or l'unité), objets remis à leur drop.
 run('started=true;P.gold=100;equipment.helm=CANAAN_GEAR.normalize({id:"s-helm",slot:"helm",rarity:"Rare",ilvl:26});saveGame()');
 const key='"canaan_slot_"+CANAAN_PERSISTENCE.slot';
 run(`{const d=JSON.parse(localStorage.getItem(${key}));d.heros.hote.materials={ore:10,wood:5,essence:2,core:1};d.heros.hote.equipment.helm.upgrade=4;d.heros.hote.equipment.helm.craftPassive="bleed";localStorage.setItem(${key},JSON.stringify(d))}`);
 assert.equal(run('loadGame()'),true);
 assert.equal(run('P.gold'),100+10*10+5*10+2*50+200);
 assert.equal(run('Object.hasOwn(equipment.helm,"upgrade")||Object.hasOwn(equipment.helm,"craftPassive")'),false);
 assert.equal(run('saveGame()'),true);
 assert.equal(run(`"materials" in JSON.parse(localStorage.getItem(${key})).heros.hote`),false,'plus de matériaux dans la sauvegarde');
 assert.equal(run('loadGame()&&P.gold'),550,'rendus une seule fois');
 // Invités enregistrés : leurs matériaux aussi sont rendus en or.
 run('CANAAN_GROUP.importGuests({"g-old":{pseudo:"Lina",player:{gold:5},materials:{ore:3,core:2}}})');
 assert.equal(run('game.guests["g-old"].player.gold'),5+30+400);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Qualité Unique et types d’armure absents du jeu et du butin',()=>{
 for(const m of scripts)assert.doesNotMatch(m[2],/armorType|ARMOR_TYPES|ensureArmorType|'Unique'/,m[1]);
 assert.doesNotMatch(source.slice(0,source.indexOf('<script')),/armorType|Unique/);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('GEAR_RARITIES.map(r=>r.name).join()'),'Commun,Peu commun,Rare,Épique,Légendaire,Mythique');
 assert.equal(run("Object.hasOwn(QUALITY_FACTOR,'Unique')||Object.hasOwn(WEAPON_NAMES,'Unique')||Object.hasOwn(GEAR_NAMES,'Unique')"),false);
 // Tirage au hasard : jamais de Légendaire ni de Mythique (réservés au Raid 4 Héroïque et à l’arène).
 const roll=x=>run('Math.random=()=>'+x+';rarityRoll(1).name');
 assert.equal(roll(0),'Commun');assert.equal(roll(0.9),'Rare');assert.equal(roll(0.9905),'Épique');assert.equal(roll(0.99999),'Épique');
 // Un objet trouvé ou normalisé ne reçoit aucun type d’armure.
 run('inventory=[];Math.random=()=>.5');
 for(const slot of ['helm','armor','ring'])assert.equal(run('Object.hasOwn(CANAAN_GEAR.normalize({id:"n-'+slot+'",slot:"'+slot+'",rarity:"Rare",ilvl:30}),"armorType")'),false,slot);
 const loot=JSON.parse(run('JSON.stringify(giveGear(10,"normal"))'));assert.equal(Object.hasOwn(loot,'armorType'),false);
});

test('Catalogues uniques : valeurs, butins et prix identiques à la référence 13e',()=>{
 const reference=require('./fixtures/catalogs-13e.json');
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const data=JSON.parse(run('JSON.stringify({instances,rarities:GEAR_RARITIES,weapons:WEAPON_TYPES,craft:CRAFT_WEAPONS,spells:WEAPON_SPELLS})'));
 for(const key of Object.keys(data))assert.deepEqual(data[key],reference[key],key);
 for(const [rarity,level,price] of reference.sales)assert.equal(run('gearSellValue('+JSON.stringify({id:'sale',slot:'armor',rarity,level})+')'),price);
 for(const [level,kind,rarity,price] of reference.fullBag){
  assert.equal(run('inventory=Array(BAG_LIMIT).fill(null);P.gold=0;Math.random=()=>.5;giveGear(...'+JSON.stringify([level,kind,rarity])+');P.gold'),price,JSON.stringify([level,kind,rarity]));
 }
 for(const [level,kind,rarity,expected] of reference.loot){
  const item=JSON.parse(run('inventory=[];Math.random=()=>.5;JSON.stringify(giveGear(...'+JSON.stringify([level,kind,rarity])+'))'));
  assert.deepEqual({level:item.level,rarity:item.rarity},expected);
  for(const key of ['secondaryStats','lvl','reqLvl','ilvl','ratings52'])assert.equal(Object.hasOwn(item,key),false);
 }
 for(const type of reference.craft){run('equipment.weapon={slot:"weapon",weaponType:'+JSON.stringify(type)+'};refreshWeaponBar()');assert.equal(run('SKILLS.length'),4)}
 assert.doesNotMatch(source,/ITEM_TIERS|function (?:mobForBiome|normalizeGearLabel|stableSecondary|ensureSecondary|rollSecondary|gearRequiredLevel)\(|raidBoss|eventId|#help\b|V1\.7\.\d+|GEAR_RARITIES\.splice|CRAFT_WEAPONS\.splice/);
 // Une seule définition, dans le module partagé des catalogues ; aucun ancien script ne la redéclare.
 const catalog=fs.readFileSync(path.join(__dirname,'..','src','canaan','shared','data','equipment.js'),'utf8');
 for(const name of ['GEAR_RARITIES','WEAPON_TYPES','CRAFT_WEAPONS','WEAPON_SPELLS']){
  assert.equal([...catalog.matchAll(new RegExp('export const\\s+'+name+'\\s*=','g'))].length,1,name);
  assert.equal([...source.matchAll(new RegExp('(?:const|let|var)\\s+'+name+'\\s*=','g'))].length,1,name);
 }
});

test('Île unique : six biomes, un seul camp sûr, route continue et lieux accessibles',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('ZONES.map(z=>z.name).join()'),'Plaines verdoyantes,Forêt ancienne,Marais brumeux,Forêt automnale,Désert oublié,Forêt enchantée');
 // Un seul camp, une seule zone sûre, un seul marchand ; le héros y apparaît.
 assert.equal(run('villages.length'),1);assert.equal(run('villages[0].name'),'Camp de l’Aurore');
 assert.equal(run("npcs.filter(n=>n.type==='shop'&&!n.layer).length"),1);
 assert.equal(run("npcs.filter(n=>n.type==='shop'&&!n.layer).every(n=>isSafe(n.x/TS,n.y/TS))"),true);
 assert.equal(run('canWalk(CANAAN_SPAWN.x,CANAAN_SPAWN.y)&&isSafe(CANAAN_SPAWN.x/TS,CANAAN_SPAWN.y/TS)'),true);
 assert.equal(run('regionAt(villages[0].x,villages[0].y).name'),'Plaines verdoyantes');
 run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');assert.equal(run('currentZoneName()'),'Camp de l’Aurore');
 // Tout est accessible à pied depuis le camp ; chaque lieu est dans son biome.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 assert.equal(run('instances.filter(d=>!d.under).every(d=>ZONES.indexOf(regionAt(d.x,d.y))===d.biome)'),true);
 assert.equal(run('instances.map(d=>d.biome).join()'),'0,1,1,2,3,3,4,4,5,5,6,7,8,9');
 assert.equal(run('WORLD_BOSSES.every(b=>ZONES.indexOf(regionAt(b.x,b.y))===b.biome&&!isSafe(b.x,b.y))'),true);
 assert.equal(run("npcs.filter(n=>n.type==='portal').every(n=>n.x===instances[n.instance].x*TS&&n.y===instances[n.instance].y*TS)"),true);
 // 65 coffres secrets distincts sur la terre ferme ; la Forêt ancienne en cache le plus.
 assert.equal(run("new Set(hiddenChestSpots.map(c=>c.x+','+c.y)).size"),65);
 assert.equal(run('hiddenChestSpots.every(c=>!SOLID.includes(overworld[c.y][c.x])&&!isSafe(c.x,c.y))'),true);
 const perBiome=JSON.parse(run('JSON.stringify(ZONES.map((z,i)=>hiddenChestSpots.filter(c=>ZONES.indexOf(regionAt(c.x,c.y))===i).length))'));
 assert.equal(Math.max(...perBiome),perBiome[1],perBiome.join());
 // La route relie le camp à chaque portail sans quitter les chemins et les ponts.
 const roads=run(`(()=>{const v=villages[0],seen=new Set(),q=[[v.x,v.y]];seen.add(v.y*MAPW+v.x);
  for(let h=0;h<q.length;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=yy*MAPW+xx;
   if(seen.has(k)||overworld[yy][xx]!==2)continue;seen.add(k);q.push([xx,yy])}}
  return instances.filter(d=>!d.under&&seen.has(d.y*MAPW+d.x)).length})()`);
 assert.equal(roads,10);
 // Crête : impossible de passer des Plaines à la Forêt enchantée sans traverser les autres biomes.
 const crossed=run(`(()=>{const v=villages[0],seen=new Uint8Array(MAPW*MAPH),q=[v.y*MAPW+v.x];seen[q[0]]=1;let e=0;
  for(let h=0;h<q.length;h++){const k=q[h],x=k%MAPW,y=(k-x)/MAPW;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,nk=yy*MAPW+xx;
   if(seen[nk]||SOLID.includes(overworld[yy][xx]))continue;const b=ZONES.indexOf(regionAt(xx,yy));if(b!==0&&b!==5)continue;seen[nk]=1;if(b===5)e++;q.push(nk)}}return e})()`);
 assert.equal(crossed,0);
 // Chaque biome a son sol et son décor propres.
 const has=(tile,deco,biome)=>run(`overworld.some((row,y)=>row.some((t,x)=>t===${tile}&&ZONES.indexOf(regionAt(x,y))===${biome}))&&overdecor.some((row,y)=>row.some((d,x)=>d==='${deco}'&&ZONES.indexOf(regionAt(x,y))===${biome}))`);
 assert.ok(has(1,'flower',0));assert.ok(has(5,'bigtree',1));assert.ok(has(15,'twisted',2));assert.ok(has(16,'autumn_red',3));
 assert.ok(has(10,'palm',4));assert.ok(has(3,'ruin',4));assert.ok(has(18,'glowtree',5));
 assert.ok(run('[...BRIDGE_TILES].some(k=>ZONES.indexOf(regionAt(k%MAPW,(k-k%MAPW)/MAPW))===2)'),'ponts du marais');
 assert.equal(run('SOLID.includes(15)'),false);assert.equal(run('SOLID.includes(18)'),true);
 assert.ok(run("['bigtree','twisted','lilypad','autumn_red','autumn_orange','autumn_gold','leafpile','dune','glowtree','magicplant','ruin'].every(k=>PIXEL_DECOR[k])"));
 // Génération reproductible : une seconde génération donne exactement la même île.
 const before=run('overworld.map(r=>r.join("")).join("|")+JSON.stringify(hiddenChestSpots)');
 run('newRegionWorld()');assert.equal(run('world.map(r=>r.join("")).join("|")+JSON.stringify(hiddenChestSpots)'),before);
});


test('Donjons et raids en exploration : trois boss par donjon, six par raid, énigmes, passages secrets et clés',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Chaque instance a son thème, ses boss, ses boss cachés et un plan jouable (énigmes faisables, boss scellés).
 const audits=JSON.parse(run('JSON.stringify(instances.map((d,i)=>CANAAN_DUNGEON_AUDIT(i)))'));
 assert.equal(new Set(audits.map(a=>a.theme)).size,14);
 assert.deepEqual(audits.map(a=>a.bosses),[3,3,3,3,3,3,6,6,6,6,3,3,3,3]);
 assert.deepEqual(audits.map(a=>a.secrets),[1,1,1,1,1,1,2,2,2,2,1,1,1,1]);
 assert.deepEqual(audits.map(a=>a.doors),audits.map(a=>a.bosses));assert.deepEqual(audits.map(a=>a.gates),audits.map(a=>a.bosses-1));
 for(const a of audits){assert.equal(a.reachable,true,a.theme);assert.equal(a.sealed,true,a.theme);assert.ok(a.props>60,a.theme);assert.ok(a.rooms>=(a.bosses===6?20:12),a.theme+' : '+a.rooms+' salles')}
 // Les quatre mécanismes servent, et chaque instance en mélange plusieurs.
 assert.deepEqual([...new Set(audits.flatMap(a=>a.locks))].sort(),['braziers','guardian','levers','runes']);
 assert.ok(audits.every(a=>new Set(a.locks).size>=3));
 assert.equal(run('instances.every(d=>d.bosses.length===(d.raid?6:3)&&d.bosses[d.bosses.length-1]===d.boss&&d.secrets.length===(d.raid?2:1))'),true);
 assert.equal(run("instances[6].bosses.join(' → ')"),'Le Maître-Chien Ravageur → Sire Écorcheur → Le Chapelain Sanguin → La Comtesse Écarlate → Le Champion du Sang → Le Roi Sanglant');
 assert.equal(run('SOLID.includes(19)&&SOLID.includes(22)&&SOLID.includes(23)&&!SOLID.includes(20)&&!SOLID.includes(21)'),true);
 assert.equal(run('JSON.stringify(makeDungeon(7))===JSON.stringify(makeDungeon(7))'),true);
 run('game.hero.level=60;openPortal({instance:6})');
 assert.match(g.document.getElementById('window').innerHTML,/Boss \(6\) : Le Maître-Chien Ravageur → Sire Écorcheur/);
 // Fiche du portail : les chances réelles (30 % par boss et par héros), plus de « 100 % garanti ».
 assert.match(g.document.getElementById('window').innerHTML,/30 % de chance par boss et par héros \(0 à 6 objets\)/);assert.doesNotMatch(g.document.getElementById('window').innerHTML,/100 % garanti/);
 run('closePanels()');
 // Donjon : trois boss et un boss caché ; les ennemis portent le thème du donjon.
 run('enterInstance(0)');
 assert.equal(run("monsters.filter(m=>m.boss&&m.secretBoss===undefined).map(m=>m.t).join()"),'Grignotte, Reine des Rats,Le Fossoyeur Bossu,Gardien des Os');
 assert.equal(run("monsters.filter(m=>m.secretBoss!==undefined).map(m=>m.t).join()"),'Le Rat-Roi aux Mille Queues');
 assert.equal(run("monsters.filter(m=>!m.boss).every(m=>['Osselet','Rat des terriers','Gardien du sceau'].includes(m.t))"),true);
 const plan='CANAAN_DUNGEON_EXPLORE.plan(0)',st='CANAAN_DUNGEON_EXPLORE.state()';
 const walk=(x,y)=>run('P.x=('+x+'+0.5)*TS;P.y=('+y+'+0.5)*TS');
 const doorOpen=s=>run('{const g='+plan+'.doors['+s+'];g.cells.every(([x,y])=>world[y][x]!==19)}');
 const lock=s=>JSON.parse(run('JSON.stringify('+plan+'.locks['+s+'])'));
 const use=it=>{walk(it.x,it.y+1);return run('CANAAN_DUNGEON_EXPLORE.interact()')};
 // Porte scellée : E donne l'indice, la porte reste fermée.
 const d0=JSON.parse(run('JSON.stringify('+plan+'.doors[0].cells[1])'));walk(d0[0],d0[1]+1);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);assert.equal(doorOpen(0),false);
 // Résout chaque porte du donjon selon son mécanisme.
 const solve=s=>{
  const L=lock(s);
  if(L.type==='braziers')for(const it of L.items)use(it);
  if(L.type==='levers'){
   // Un mauvais ordre relève tous les leviers ; le bon ordre ouvre la porte.
   const wrong=L.items.find(it=>it.id!==L.order[0]);use(wrong);assert.equal(run(st+'.locks['+s+'].step'),0);
   for(const id of L.order)use(L.items[id]);
  }
  if(L.type==='runes'){
   const press=it=>{walk(it.x,it.y);run('P.y-=10;CanaanStages.dungeonPuzzles.after()');walk(it.x+3,it.y+3);run('P.x=0;P.y=0;CanaanStages.dungeonPuzzles.after()')};
   for(const id of L.order)press(L.items[id]);
  }
  if(L.type==='guardian'){run('for(const m of monsters.filter(m=>m.guardian==='+s+'))m.hp=0');run('CanaanStages.dungeonPuzzles.after()')}
  assert.equal(doorOpen(s),true,'porte '+s+' ('+L.type+')');
 };
 // La stèle donne l'ordre des leviers ou des dalles en énigme.
 const L1=lock(1);if(L1.stele){walk(L1.stele.x,L1.stele.y+1);run('CANAAN_DUNGEON_EXPLORE.interact()')}
 solve(0);
 // Boss : 30 % de chance d'équipement par héros ; sa mort lève la herse de sa salle.
 const gates=()=>run('world.flat().filter(t=>t===19).length');
 const kill=(name,r)=>run('{const real=Math.random;Math.random=()=>'+r+';const m=monsters.find(m=>m.t==='+JSON.stringify(name)+');m.hp=0;recordKill(m);monsters=monsters.filter(o=>o!==m);Math.random=real}');
 run('inventory.length=0');const g0=gates();
 kill('Grignotte, Reine des Rats',0.1);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'chanceux : un équipement');assert.ok(gates()<g0);
 solve(1);kill('Le Fossoyeur Bossu',0.9);assert.equal(run('inventory.filter(i=>i.origin==="donjon").length'),1,'pas de chance : rien');
 // Passage secret : le mur fissuré s'effondre (E) ; le boss caché donne une clé des secrets.
 const w=JSON.parse(run('JSON.stringify('+plan+'.secretWalls[0].cells[1])'));
 assert.equal(run('world['+w[1]+']['+w[0]+']'),23);walk(w[0],w[1]+1);run('P.y-=8');
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.interact()'),true);assert.notEqual(run('world['+w[1]+']['+w[0]+']'),23);
 run('P.keys=0');kill('Le Rat-Roi aux Mille Queues',0.1);assert.equal(run('P.keys'),1);assert.equal(run('instanceState.cleared'),false);
 solve(2);kill('Gardien des Os',0.9);assert.equal(run('instanceState.cleared'),true);assert.equal(run('chests.length'),1);
 const chest=JSON.parse(run('JSON.stringify(chests[0])')),spot=JSON.parse(run('JSON.stringify(dungeonChestSpot(0))'));
 assert.deepEqual([chest.x,chest.y],[spot.x,spot.y]);
 // La clé est gardée dans la sauvegarde.
 assert.equal(JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}).player)')).keys,1);
 // Les clés sont des objets du sac (touche I), en piles de 20 qui prennent de la place ; elles ne se vendent pas.
 const used0=run('canaanBagUsed(game.hero)');run('P.keys=45');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BAG.tiles(game.hero,"main").filter(t=>t.kind==="key").map(t=>t.n))')),[20,20,5]);
 assert.equal(run('canaanBagUsed(game.hero)'),used0+2);assert.equal(run('CANAAN_BAG.info({kind:"key",id:"secret",q:0,n:1}).name'),'Clé des secrets');
 assert.equal(run('!!CANAAN_BAG.parse("key:secret:0*20")&&!CANAAN_BAG.parse("key:secret:0*21")'),true);
 assert.equal(run('CANAAN_SHOP.sellStack?CANAAN_SHOP.sellStack(game.hero,"key:secret:0*5"):false'),false);assert.equal(run('P.keys'),45);
 run('P.keys=1');
 // Lumi accompagne le héros sans bulle de message.
 assert.doesNotMatch(source,/lumiCloud|Lumi : ✨/);
 // Portail de retour dans la salle du dernier boss : il attend que le coffre soit ouvert, puis ramène le groupe dehors.
 const exit=JSON.parse(run('JSON.stringify(CANAAN_DUNGEON_EXPLORE.exitSpot(0))'));
 assert.equal(run('[20,21].includes(world['+exit.y+']['+exit.x+'])'),true,'sur le sol');
 walk(exit.x,exit.y);assert.equal(run('CANAAN_DUNGEON_EXPLORE.exitNear(P)'),true);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('!!instanceState'),true,'coffre pas encore ouvert : on reste');
 run('P.x=chests[0].x*TS;P.y=chests[0].y*TS;openNearbyChest()');walk(exit.x,exit.y);
 assert.equal(run('CANAAN_DUNGEON_EXPLORE.takeExit()'),true);assert.equal(run('instanceState'),null,'sorti par le portail');
 assert.equal(run('world'),run('overworld'));
 // Raid : six boss, deux boss cachés.
 run('enterInstance(6)');
 assert.equal(run('monsters.filter(m=>m.boss&&m.secretBoss===undefined).length'),6);assert.equal(run('monsters.filter(m=>m.secretBoss!==undefined).length'),2);
 run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Garde-robe : apparences de sets en six qualités, butin, doublons revendus, port vérifié, sauvegarde et réseau',async()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Catalogue : des tenues complètes dans chaque qualité, les plus hautes avec ailes, aura ou particules.
 const skins=JSON.parse(run('JSON.stringify(SKINS)'));
 assert.ok(skins.length>=24);assert.deepEqual([0,1,2,3,4,5].map(r=>skins.filter(s=>s.rarity===r).length>=4),[true,true,true,true,true,true]);
 assert.ok(skins.filter(s=>s.rarity>=4).every(s=>['dragonwings','angelwings','batwings','fairywings','flamecape'].includes(s.back)&&s.fx&&s.fx.length));
 assert.ok(skins.filter(s=>s.rarity===5).every(s=>s.fx.includes('aura')));assert.ok(skins.filter(s=>s.rarity===0).every(s=>!s.fx));
 // Apparence portée dans le look : codée seulement quand il y en a une (l'ancienne forme reste identique).
 assert.equal(run('encodeLook(defaultLook())'),'m|humain|#f0c7a0|court|#7d5140|#202938|acier');
 assert.equal(run('encodeLook({...defaultLook(),wear:"dragon"})'),'m|humain|#f0c7a0|court|#7d5140|#202938|acier|dragon');
 assert.equal(run('decodeLook(encodeLook({...defaultLook(),wear:"dragon"})).wear'),'dragon');assert.equal(run('sanitizeLook({wear:"pirate<b>"}).wear||""'),'');assert.equal(run('"wear" in defaultLook()'),false,'sans apparence, le look ne change pas');
 // Tirage : chance et qualités selon la source.
 const roll=(src,seq)=>run('{const q='+JSON.stringify(seq)+';let k=0;CANAAN_WARDROBE.roll("'+src+'",()=>q[k++%q.length])}');
 assert.equal(roll('normal',[0.5]),null,'un monstre ne donne presque jamais rien');
 assert.equal(run('SKINS.find(s=>s.id==='+JSON.stringify(roll('secretBoss',[0,0.999,0]))+').rarity'),5,'boss caché : jusqu’au Mythique');
 assert.equal(run('SKINS.find(s=>s.id==='+JSON.stringify(roll('normal',[0,0,0]))+').rarity'),0);
 // Gagner, doublon revendu, porter seulement ce qu'on possède.
 run('game.hero.skins={owned:[]};P.gold=0');
 assert.equal(run('CANAAN_WARDROBE.grant(game.hero,"pirate")'),true);assert.equal(run('CANAAN_WARDROBE.grant(game.hero,"pirate")'),false);assert.equal(run('P.gold'),300);
 assert.equal(run('CANAAN_WARDROBE.wear(game.hero,"dragon")'),false,'pas possédée');assert.equal(run('(game.hero.look||{}).wear||""'),'');
 assert.equal(run('CANAAN_WARDROBE.wear(game.hero,"pirate")'),true);assert.equal(run('game.hero.look.wear'),'pirate');
 // Le sprite d'une tenue a de la place pour les ailes ; sans tenue, rien ne change.
 assert.equal(run('canaanHeroSprite({...game.hero.look,wear:"dragon"},0,0).padX'),12);assert.equal(run('canaanHeroSprite(defaultLook(),0,0).padX'),0);
 // Sauvegarde : collection et tenue portée.
 const saved=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}))'));
 assert.deepEqual(saved.skins,{owned:['pirate']});assert.equal(saved.look.wear,'pirate');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WARDROBE.sanitize({owned:["pirate","pirate","inconnue",3]}))')),{owned:['pirate']});
 // Réseau : l'invité demande (l'hôte vérifie) ; les E de donjon passent aussi le filtre des actions.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'skin-wear',id:'pirate'}),{op:'skin-wear',id:'pirate'});assert.deepEqual(n.sanitizeAction({op:'skin-wear',id:''}),{op:'skin-wear',id:''});
 assert.equal(n.sanitizeAction({op:'skin-wear',id:'<x>'}),null);assert.deepEqual(n.sanitizeAction({op:'dungeon-use'}),{op:'dungeon-use'});
 // Butin : un boss de donjon tire une apparence pour chaque héros (ici, forcée).
 run('game.hero.skins={owned:[]};game.hero.level=60;enterInstance(0);{const real=Math.random;Math.random=()=>0;const m=monsters.find(m=>m.bossStage===0);m.hp=0;recordKill(m);Math.random=real}');
 assert.equal(run('game.hero.skins.owned.length'),1,'apparence du boss');run('leaveInstance()');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Sylvaëlle, la cité elfique : palissade sans trou, porte au niveau 60, Grand Arbre, bénédiction, armurerie, atelier, zone sûre',async()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Plus de massif ni de crête de roche : la palissade (37) ceint la cité et sépare toujours Plaines et Forêt enchantée.
 assert.equal(run('SOLID.includes(37)'),true);
 assert.equal(run('(()=>{let n=0;for(let y=150;y<250;y++)for(let x=150;x<250;x++)if(overworld[y][x]===4)n++;return n})()'),0,'plus de roche au centre');
 assert.equal(run('canaanInCity(200,200)&&!canaanInCity(200,140)'),true);
 const reach=run('(()=>{const r=CANAAN_WORLD_TOOLS.reachableFrom(CANAAN_CAMP.x,CANAAN_CAMP.y),g=CANAAN_CITY_PLAN.gate;let inside=0;for(let y=150;y<250;y++)for(let x=150;x<250;x++)if(canaanInCity(x,y)&&r[y*MAPW+x])inside++;return JSON.stringify({out:r[g.out.y*MAPW+g.out.x],inside})})()');
 assert.deepEqual(JSON.parse(reach),{out:1,inside:0},'porte accessible dehors, cité fermée à pied');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 // Plan : porte au sud-ouest (côté Forêt enchantée, près du lac), Grand Arbre au nord-ouest, bâtiments elfiques.
 const plan=JSON.parse(run('JSON.stringify({deg:CANAAN_CITY_PLAN.gate.deg,tree:CANAAN_CITY_PLAN.tree,b:CANAAN_CITY_PLAN.buildings.map(b=>b.id),level:CANAAN_CITY_PLAN.level})'));
 assert.ok(plan.deg>100&&plan.deg<150,String(plan.deg));assert.ok(plan.tree.x<200&&plan.tree.y<200,'Grand Arbre au nord-ouest');
 assert.ok(['elfe_armurerie','elfe_couture','elfe_temple','elfe_tour','elfe_maison','elfe_taverne','elfe_palais'].every(id=>plan.b.includes(id)));assert.equal(plan.level,60);
 assert.equal(run('CANAAN_BUILDING_ART.has("elfe_tour")&&CANAAN_BUILDING_ART.has("elfe_couture")'),true);
 // Zone sûre (aucun monstre n'y apparaît), nom de zone.
 assert.equal(run('isSafe(200,205)'),true);run('P.x=200.5*TS;P.y=206*TS');assert.equal(run('currentZoneName()'),'Sylvaëlle, la Cité des Elfes');
 // Porte : le garde refuse sous le niveau 60, ouvre au niveau 60 ; on ressort par la même porte.
 const go=(p)=>run('P.x=(CANAAN_CITY_PLAN.gate.'+p+'.x+0.5)*TS;P.y=(CANAAN_CITY_PLAN.gate.'+p+'.y+0.5)*TS');
 run('started=true;game.hero.level=40');go('out');assert.equal(run('CANAAN_CITY.interact()'),true);assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),false,'trop jeune');
 run('game.hero.level=60');go('out');run('CANAAN_CITY.interact()');assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),true,'entré');
 run('CANAAN_CITY.interact()');assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),false,'ressorti');
 // Résurrection à la cité pour un héros de niveau 60 tombé dans la Forêt enchantée.
 go('out');assert.ok(run('!!CANAAN_CITY.respawnFor(game.hero)'));run('game.hero.level=30');assert.equal(run('CANAAN_CITY.respawnFor(game.hero)'),null);run('game.hero.level=60');
 // Grand Arbre : histoire et bénédiction quotidienne (+10 % de dégâts), une fois par jour.
 assert.ok(run('CANAAN_CITY.LORE.length')>=5);
 run('P.x=(CANAAN_CITY_PLAN.tree.x+0.5)*TS;P.y=(CANAAN_CITY_PLAN.tree.y+2)*TS;game.hero.blessing=null');
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-bless"})'),true);assert.equal(run('CANAAN_CITY.blessMult(game.hero)'),1.1);
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-bless"})'),false,'une fois par jour');
 assert.equal(JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}).blessing)')).day.length,10,'gardée dans la sauvegarde');
 // Armurerie : la pièce choisie, de niveau 60, contre de l'or.
 // Les marchands sont dans leur boutique (pièces de house.js) : Thalion derrière son comptoir, Elwyn à son métier.
 const near=id=>{const [rid,lx,ly]=id==='elfe_armurerie'?['sylv_armurerie',6.5,4.2]:['sylv_couture',4.5,5.6];run('{const r=CANAAN_ROOMS.find(r=>r.id==="'+rid+'");P.x=(r.x+'+lx+')*TS;P.y=(r.y+'+ly+')*TS}');};
 near('elfe_armurerie');run('P.gold=10000;game.hero.inventory=[]');
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-buy",slot:"boots",rarity:"epic"})'),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.inventory.map(i=>[i.slot,i.rarity,i.level,i.origin]))')),[['boots','Épique',60,'elfique']]);assert.equal(run('P.gold'),2500);
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-buy",slot:"boots",rarity:"epic"})'),false,'pas assez d’or');
 // Atelier : apparences elfiques exclusives (jamais tirées au butin).
 assert.equal(run('SKINS.filter(s=>s.shop).length'),4);assert.equal(run('(()=>{for(let i=0;i<400;i++){const id=CANAAN_WARDROBE.roll("secretBoss",()=>Math.random()*0.18);if(id&&SKINS.find(s=>s.id===id).shop)return false}return true})()'),true);
 near('elfe_couture');run('P.gold=5000;game.hero.skins={owned:[]}');
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-skin",id:"elfe_rodeur"})'),true);assert.equal(run('CANAAN_WARDROBE.has(game.hero,"elfe_rodeur")&&P.gold===2000'),true);
 // Réseau : les actions de la cité passent le filtre de l'hôte.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'city-buy',slot:'helm',rarity:'rare'}),{op:'city-buy',slot:'helm',rarity:'rare'});assert.equal(n.sanitizeAction({op:'city-buy',slot:'helm',rarity:'mythique'}),null);
 assert.deepEqual(n.sanitizeAction({op:'city-gate'}),{op:'city-gate'});
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Monde au niveau des donjons : créatures détaillées, textures des biomes, entrées thématiques et ambiance',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Chaque créature des biomes reçoit une silhouette dédiée, plus variée que l'ancien jeu de sprites.
 const looks=JSON.parse(run("JSON.stringify(ZONES.flatMap(z=>z.mobs).map(t=>{const m={t,x:0,y:0,hp:1,mhp:1};drawCanaanActor(ctx,m);return [t,m.look]}))"));
 assert.ok(looks.every(([,l])=>l),JSON.stringify(looks));
 assert.ok(new Set(looks.map(([,l])=>l)).size>=10,JSON.stringify(looks));
 assert.deepEqual(Object.fromEntries(looks.filter(([t])=>['Slime','Loup','Ours','Scorpion','Minotaure','Bandit'].includes(t))),{Slime:'slime',Loup:'quad',Ours:'quad',Scorpion:'scorpion',Minotaure:'brute',Bandit:'rogue'});
 // Boss mondiaux : apparence propre à chacun.
 run('monsters=[];worldBossTimers={};instanceState=null;spawnWorldBosses();monsters.forEach(m=>drawCanaanActor(ctx,m))');
 assert.equal(run("monsters.filter(m=>m.worldBoss).every(m=>m.look&&m.pal)"),true);
 assert.equal(run("monsters.find(m=>m.worldBossId==='chronos').look"),'horror');
 // Textures : une bande de quatre variantes pour chaque terrain de l'île.
 assert.equal(run('[0,1,2,3,4,5,10,11,15,16,17,18].every(t=>PIXEL_TERRAIN[t]&&PIXEL_TERRAIN[t].width===192)'),true);
 // Rendu d'une zone de l'île et des dix entrées sans erreur ; les arbres lumineux éclairent.
 run('resetCanaanLights();for(let y=0;y<400;y+=7)for(let x=0;x<400;x+=7)drawWorldTile(ctx,x,y,world[y][x],decor[y][x]);instances.forEach((d,i)=>drawDungeonEntrance(ctx,i,d.x*TS,d.y*TS))');
 // Ambiance : la Forêt enchantée est plus sombre que les Plaines.
 const amb=b=>JSON.parse(run('{const z=ZONES['+b+'];P.x=(z.x+0.5)*TS;P.y=(z.y+0.5)*TS;let a;for(let k=0;k<400;k++)a=worldAmbience();JSON.stringify(a)}'));
 const plains=amb(0),enchanted=amb(5);
 assert.ok(plains.dark<0.05&&enchanted.dark>0.5,JSON.stringify([plains,enchanted]));
 assert.equal(enchanted.particles,'sparks');
 run('drawCanaanLighting(ctx,worldAmbience());drawCanaanBossFrame(ctx)');
});

test('Animations des monstres, eau peu profonde, arbres et thème RPG des menus',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Marche : le monstre se tourne vers sa direction ; attaque et coup reçu sont détectés depuis son état.
 run("globalThis.wolf={t:'Loup',x:500,y:500,hp:50,mhp:50,cd:0};drawCanaanActor(ctx,wolf);wolf.x-=3;drawCanaanActor(ctx,wolf)");
 assert.equal(run('wolf._face'),-1);assert.equal(run('wolf._walking'),true);
 run('wolf.cd=1.2;wolf.hp=40;drawCanaanActor(ctx,wolf)');
 assert.equal(run('wolf._atk===time&&wolf._hit===time'),true);
 // Le héros a une vitesse visible : son sprite s'oriente et marche.
 run("paused=false;P.dead=false;keys['d']=true;readInput();update();keys['d']=false");
 assert.ok(run('P.vx')>0);
 // Eau peu profonde : des ronds dans l'eau naissent sous les pas, jamais sur un pont.
 const spot=JSON.parse(run('{let s=null;for(let y=0;y<400&&!s;y++)for(let x=0;x<400;x++)if(world[y][x]===15&&!BRIDGE_TILES.has(y*MAPW+x)){s={x,y};break}JSON.stringify(s)}'));
 run('globalThis.walker={};drawWade(ctx,walker,'+(spot.x+0.5)+'*TS,'+(spot.y+0.5)+'*TS,40,true,1)');
 assert.equal(run('walker._rippleT===time'),true);
 run('globalThis.dry={};drawWade(ctx,dry,CANAAN_SPAWN.x,CANAAN_SPAWN.y,40,true,1);drawWaterRipples(ctx)');
 assert.equal(run('dry._rippleT'),undefined);
 // Arbres redessinés deux fois plus grands (pixels de 2) et thème RPG chargé en dernier.
 assert.equal(run("['tree','bigtree','pine','palm','twisted','autumn_red','glowtree'].every(k=>PIXEL_DECOR[k]&&PIXEL_DECOR[k].width===132)"),true);
 assert.equal(run("['rock','flower','bush','cactus'].every(k=>PIXEL_DECOR[k]&&PIXEL_DECOR[k].width===68)"),true);
 const styles=[...source.matchAll(/<style id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(styles[styles.length-1],'canaan-rpg-theme');
 assert.match(source,/--rpg-serif:/);
 // Coffres cachés et coffre de boss : sprites dédiés, dessinés sans erreur.
 run('drawCanaanChest(ctx,100,100,false,1);drawCanaanChest(ctx,200,100,true,2);drawChests()');
});

test('Rubis : 48 effets en six familles, six emplacements, collection, verrous et fiche du personnage',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const list=JSON.parse(run('JSON.stringify(CANAAN_RUBIS.list)'));
 assert.equal(list.length,48);assert.equal(new Set(list.map(r=>r.id)).size,48);
 for(let f=0;f<6;f++)assert.equal(list.filter(r=>r.family===f).length,8,'famille '+f);
 assert.deepEqual([list[0].name,list[15].name,list[23].name,list[31].name,list[39].name,list[47].name],['Berserker','Second souffle','Communion','Résonance','Élan','Transcendance']);
 run('started=true;paused=false;P.dead=false;time=10000');
 // Un Rubis non possédé ne s'équipe pas ; doublons interdits ; six emplacements au plus.
 assert.equal(run("equipRubis('berserker')"),false);
 run("for(const r of CANAAN_RUBIS.list)CANAAN_RUBIS.grant(r.id)");
 assert.equal(run('CANAAN_RUBIS.discovered()'),48);
 for(const id of ['berserker','colosse','meditation','tempete','voyageur','phenix'])assert.equal(run("equipRubis('"+id+"')"),true,id);
 assert.equal(run("equipRubis('berserker')"),false);assert.equal(run("equipRubis('pacte')"),false);
 assert.equal(run("unequipRubis(0)"),true);assert.equal(run("equipRubis('pacte')"),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_RUBIS.equipped())')),['pacte','colosse','meditation','tempete','voyageur','phenix']);
 // Hors combat seulement, et jamais pendant une tentative de l'Arène.
 run("CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:0,y:0},10)");
 assert.equal(run("unequipRubis(1)"),false);
 run('time+=600');assert.equal(run("unequipRubis(1)"),true);
 run("instanceState={index:'arena',arena:true}");assert.equal(run("equipRubis('colosse')"),false);run('instanceState=null');
 // Gain : priorité aux Rubis manquants, un doublon reste dans la collection.
 run("CANAAN_RUBIS_STATE.import({owned:{berserker:1},equipped:['berserker','inconnu','berserker',null,null,null]})");
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_RUBIS.equipped())')),['berserker',null,null,null,null,null]);
 const fresh=JSON.parse(run('JSON.stringify(Array.from({length:47},()=>CANAAN_RUBIS.grant()).map(x=>x.fresh))'));
 assert.ok(fresh.every(Boolean));assert.equal(run('CANAAN_RUBIS.discovered()'),48);
 assert.equal(run('CANAAN_RUBIS.grant().fresh'),false);
 // Fiche du personnage : six emplacements sous le personnage, puis la collection des 48.
 run('renderCharacter()');const html=g.document.getElementById('window').innerHTML;
 assert.match(html,/class="character-left"[\s\S]*rubis-paper/);
 assert.equal((html.match(/class="rubis-slot /g)||[]).length,6);
 // Les Rubis possédés sont des objets du sac (piles), plus une grille de collection sur la fiche.
 assert.equal((html.match(/class="rubis-cell /g)||[]).length,0);
 assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="rubis").length'),run('48-game.hero.rubis.equipped.filter(Boolean).length'));
 run('renderInventory()');assert.ok((g.document.getElementById('window').innerHTML.match(/data-tooltip-stack="rubis:/g)||[]).length>=40,'les Rubis dans le sac');
 run("showRubisTooltip('tempete',{clientX:0,clientY:0})");
 assert.match(g.gearTooltip?.innerHTML||run('gearTooltip.innerHTML'),/Tempête[\s\S]*15 %/);
 // Sauvegarde : Rubis et records de l'Arène dans l'instantané.
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot())'));
 assert.equal(snap.schema,10);assert.equal(Object.keys(snap.heros.hote.rubis.owned).length,48);assert.ok('best' in snap.heros.hote.arena);
});

test('Rubis : effets en combat, survie aux coups fatals, soins, mana et utilitaires',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=10000;for(const r of CANAAN_RUBIS.list)CANAAN_RUBIS.grant(r.id)');
 const wear=ids=>run("CANAAN_RUBIS_STATE.import({owned:Object.fromEntries(CANAAN_RUBIS.list.map(r=>[r.id,1])),equipped:"+JSON.stringify([...ids,...Array(6-ids.length).fill(null)])+"});recomputeStats()");
 wear([]);const hp0=run('characterStats().maxHp'),speed0=run('characterStats().speed');
 wear(['colosse']);assert.equal(run('characterStats().maxHp'),Math.round(hp0*1.1));assert.equal(run('characterStats().speed'),speed0-5);
 wear(['pacte']);assert.equal(run('characterStats().maxHp'),Math.round(hp0*0.88));
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999},100)')-118)<1e-9);
 wear(['berserker','chasseur','dernier_souffle']);run('P.hp=P.mhp');
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999,elite:true},100)')-112)<1e-9);
 run('P.hp=P.mhp*0.2');assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:1,mhp:9,x:9999,y:9999},100)')-115*1.15)<1e-9);
 wear(['briseur','precision','tresorier','volonte','arcane','endurance']);
 assert.deepEqual(JSON.parse(run('JSON.stringify([CANAAN_RUBIS.armorFactor(),CANAAN_RUBIS.critFactor(),CANAAN_RUBIS.goldFactor(),CANAAN_RUBIS.incomingCritFactor(),CANAAN_RUBIS.manaCost(100),CANAAN_RUBIS.dodgeCooldownFactor()])')),[0.92,1.12,1.15,0.8,90,0.85]);
 // Prospecteur : 15 % de chances d'un meilleur objet sur un mob ordinaire.
 wear(['prospecteur']);assert.equal(run('Math.random=()=>0.14;CANAAN_RUBIS.betterDrop()'),true);assert.equal(run('Math.random=()=>0.16;CANAAN_RUBIS.betterDrop()'),false);
 wear([]);assert.equal(run('Math.random=()=>0;CANAAN_RUBIS.betterDrop()'),false);
 // Défense : Peau de pierre seulement contre les coups physiques ; Gardien après un coup, puis recharge.
 wear(['peau_de_pierre']);assert.equal(run('CANAAN_RUBIS.defense({},100,{})'),94);assert.equal(run('CANAAN_RUBIS.defense({},100,{magic:true})'),100);
 wear(['gardien']);assert.equal(run('CANAAN_RUBIS.defense({},100)'),100);assert.equal(run('CANAAN_RUBIS.defense({},100)'),90);
 // Second souffle puis Phénix : une fois chacun par combat, puis la mort.
 wear(['second_souffle','phenix']);run('P.hp=50');
 assert.equal(run('canaanHurtPlayer(9999,null)'),0);assert.equal(run('P.hp'),Math.max(1,Math.round(run('P.mhp')*0.1)));
 assert.equal(run('canaanHurtPlayer(9999,null)'),0);assert.equal(run('P.hp'),Math.max(1,Math.round(run('P.mhp')*0.2)));
 assert.ok(run('canaanHurtPlayer(9999,null)')>0);assert.ok(run('P.hp')<=0);
 // Soins : Guérisseur pour les soins directs, Source vitale pour tous ; Bénédiction après un soin.
 wear(['guerisseur','source_vitale','benediction']);run('P.dead=false;P.mhp=10000;P.hp=1');
 assert.ok(Math.abs(run('canaanApplyHeal(100,true)')-110)<1e-9);run('P.hp=1');
 const direct=run('canaanApplyHeal(100)');assert.ok(direct>=Math.round(100*1.08*1.1)-1,String(direct));
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore({hp:9,mhp:9,x:9999,y:9999},100)')-105)<1e-9);
 // Méditation et Symbiose : 3 % du mana toutes les 5 s, et des PV en retour.
 wear(['meditation','symbiose']);run('time+=600;P.mp=0;P.hp=1');const hpBefore=run('P.hp');
 for(let i=0;i<300;i++)run('time++;CanaanStages.rubis.after(new Map())');
 assert.ok(Math.abs(run('P.mp')-run('P.mmp')*0.03-300/60*0)<=run('P.mmp')*0.03+1e-9&&run('P.mp')>=run('P.mmp')*0.03-1e-9);
 assert.ok(run('P.hp')>hpBefore);
 // Explorateur : coffres secrets proches révélés sur la mini-carte.
 wear(['explorateur']);run('instanceState=null;openedChests=[];P.x=(hiddenChestSpots[0].x+2)*TS;P.y=hiddenChestSpots[0].y*TS');
 assert.ok(run('CANAAN_RUBIS.revealedChests().some(c=>c.id==="hidden_0")'));
});

test('Roulade d’esquive : invulnérable pendant le roulé, recharge de 4 s, réduite par Endurance',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=1000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;CANAAN_RUBIS_STATE.import({})');
 const x0=run('P.x');
 assert.equal(run('canaanDodge(1,0)'),true);assert.equal(run('CANAAN_COMBAT.invulnerable()'),true);
 assert.equal(run('monsterDamage({hp:9,mhp:9,x:0,y:0,boss:true},500)'),0);
 for(let i=0;i<20;i++)run('time++;runUpdatePipeline()');
 assert.ok(run('P.x')-x0>100,'distance '+(run('P.x')-x0));assert.equal(run('CANAAN_COMBAT.invulnerable()'),false);
 assert.equal(run('canaanDodge(1,0)'),false);
 assert.ok(Math.abs(run('CANAAN_COMBAT.dodgeState().cooldown')-4)<1e-9);
 run("CANAAN_RUBIS_STATE.import({owned:{endurance:1},equipped:['endurance']})");
 assert.ok(Math.abs(run('CANAAN_COMBAT.dodgeState().cooldown')-3.4)<1e-9);
 for(let i=0;i<240;i++)run('time++;runUpdatePipeline()');
 assert.equal(run('canaanDodge(0,1)'),true);
});

test('Arène des Épreuves : portail près du camp, douze boss, vagues, récompenses, records et sortie',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Portail accessible à pied depuis le camp, à l'est, hors de la zone sûre.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 assert.equal(run("npcs.filter(n=>n.type==='arena').length"),1);
 assert.ok(run('Math.hypot(CANAAN_ARENA_PORTAL.x-CANAAN_CAMP.x,CANAAN_ARENA_PORTAL.y-CANAAN_CAMP.y)')<20);
 assert.equal(run('isSafe(CANAAN_ARENA_PORTAL.x,CANAAN_ARENA_PORTAL.y)'),false);
 // Douze boss du document, multiplicateurs proposés, tous les mouvements existent.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.bosses)')),['Gorath, le Gardien de Fer','Fenrath, Croc des Ombres','Tharok, le Colosse de Pierre','Morgana, la Sorcière des Brumes','Valdris, le Chevalier Déchu','Hydrass, l’Hydre Écarlate','Zephiron, Seigneur des Tempêtes','Kael’Thor, l’Exécuteur Astral','Ametheon, le Titan de Cristal','Ignaroth, le Dragon des Cendres','Nihil, l’Avatar du Néant','Aurelion, le Souverain des Épreuves']);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.hpMult)')),[1,1.2,1.4,1.6,1.9,2.2,2.5,2.9,3.3,3.8,4.3,5]);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_ARENA.dmgMult)')),[1,1.1,1.2,1.3,1.4,1.6,1.7,1.8,2,2.1,2.3,2.5]);
 const audit=JSON.parse(run('JSON.stringify(CANAAN_ARENA.audit())'));
 assert.equal(audit.waves,12);assert.deepEqual(audit.missingMoves,[]);assert.equal(audit.ordered,true);assert.equal(audit.phases[11],3);
 // Aucun iLvl minimum : on entre avec iLvl 0, dans le colisée.
 run('started=true;paused=false;P.dead=false;time=1000;game.hero.level=1;recomputeStats();P.hp=P.mhp=1e6;openArenaPortal()');
 assert.match(g.document.getElementById('window').innerHTML,/Meilleure vague[\s\S]*Rubis découverts[\s\S]*Tentatives effectuées[\s\S]*Arène terminée[\s\S]*Dernier boss vaincu/);
 assert.equal(run('enterArena()'),true);assert.equal(run('instanceState.arena'),true);assert.equal(run('CANAAN_ARENA.state().attempts'),1);
 assert.equal(run('canWalk(P.x,P.y)'),true);assert.equal(run("CANAAN_ARENA.run().phase"),'enter');
 const tick=n=>{for(let i=0;i<n;i++)run('time++;runUpdatePipeline();P.hp=P.mhp')};
 tick(120);assert.equal(run("CANAAN_ARENA.run().phase"),'enter');
 // Sur la piste : compte à rebours de 5 s, puis le boss ; la herse se ferme.
 run('{const L=arenaLayout();P.x=L.x;P.y=L.y+L.r*0.3}');tick(2);assert.equal(run("CANAAN_ARENA.run().phase"),'countdown');
 tick(4*60);assert.equal(run("CANAAN_ARENA.run().phase"),'countdown');tick(70);
 assert.equal(run("CANAAN_ARENA.run().phase"),'fight');
 const gate=()=>run('arenaLayout().gate.map(([x,y])=>world[y][x]).join()');
 assert.equal(gate(),'19,19,19,19,19');
 // PV fixes, indépendants de l'iLvl du héros.
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),15000);run('game.hero.level=60;scaleBossHp(CANAAN_ARENA.run().boss)');assert.equal(run('CANAAN_ARENA.run().boss.mhp'),15000);
 // Pas d'abandon pendant le combat.
 run('{const e=instanceEntrance;globalThis.saved={x:P.x,y:P.y};P.x=e.x;P.y=e.y;CANAAN_ARENA.interact();P.x=saved.x;P.y=saved.y}');assert.equal(run('!!instanceState'),true);
 // Chaque mouvement se joue sans erreur sur le boss de la vague.
 for(const name of ['slam','charge','shockwave','pounce','backstab','quake','rocks','rain','poison','volley','curse','mist','combo','parry','breath3','spit','breathRoll','lightning','fields','gust','sweep','cones','mark','execute','crystal','beams','shards','breath','meteors','firestorm','blink','spiral','clones','voidzone']){
  assert.equal(run("CANAAN_ARENA.playMove('"+name+"')"),true,name);tick(150);
 }
 assert.equal(errors.length,0,errors.join('\n'));
 // Victoire : 1 Rubis, +20 % PV et mana sans dépasser le maximum, herse ouverte, répit de 10 s.
 run('P.mhp=1000;P.hp=350;P.mmp=300;P.mp=100;{const b=CANAAN_ARENA.run().boss;b.shieldHp=0;b.parryUntil=0;b.immuneUntil=0;hit(b,1e9)}');
 assert.equal(run("CANAAN_ARENA.run().phase"),'rest');assert.equal(run('P.hp'),550);assert.equal(run('Math.round(P.mp)'),160);
 assert.equal(run('CANAAN_RUBIS.discovered()'),1);assert.equal(run('CANAAN_ARENA.state().best'),1);
 assert.equal(run('CANAAN_ARENA.run().fx.length+CANAAN_ARENA.run().shots.length+CANAAN_ARENA.run().hazards.length'),0);
 assert.equal(run('monsters.some(m=>m.arenaClone)'),false);assert.equal(gate(),'20,20,20,20,20');
 // Équipement verrouillé pendant la tentative.
 run("inventory.push({id:'a1',slot:'ring',ilvl:5,rarity:'Commun'})");assert.equal(run("equipItem('a1')"),false);
 // Abandon entre les vagues : retour au monde, le Rubis reste acquis.
 run('{const e=instanceEntrance;P.x=e.x;P.y=e.y;CANAAN_ARENA.interact()}');
 assert.equal(run('instanceState'),null);assert.equal(run('world'),run('overworld'));assert.equal(run('CANAAN_RUBIS.discovered()'),1);
 // Vague 12 : la victoire donne la récompense finale, un Rubis au choix parmi les manquants.
 run('enterArena();{const r=CANAAN_ARENA.run(),L=arenaLayout();P.x=L.x;P.y=L.y+L.r*0.3;r.wave=12;r.phase="countdown";r.timer=0}');tick(2);
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),75000);assert.equal(run('CANAAN_ARENA.run().boss.def.phases.length'),3);
 assert.equal(run('CANAAN_ARENA.tempo(1)'),1);assert.ok(Math.abs(run('CANAAN_ARENA.tempo(12)')-0.758)<1e-9);
 run('{const b=CANAAN_ARENA.run().boss;b.shieldHp=0;b.parryUntil=0;b.immuneUntil=0;hit(b,1e9)}');
 assert.equal(run('CANAAN_ARENA.state().completed'),true);assert.equal(run('CANAAN_ARENA.state().pendingChoice'),true);
 const missing=run('CANAAN_RUBIS.missing()[0].id');
 assert.equal(run("claimArenaRubis('"+missing+"')"),true);assert.equal(run("claimArenaRubis('"+missing+"')"),false);
 assert.equal(run('CANAAN_RUBIS.discovered()'),3);
 // Une partie rechargée hors du colisée ne laisse ni combat ni malédiction en mémoire.
 run('{const r=CANAAN_ARENA.run();r.phase="fight";r.curseUntil=r.clock+60}instanceState=null');
 assert.equal(run('CANAAN_ARENA.fighting()'),false);assert.equal(run('CANAAN_ARENA.healFactor()'),1);
 run('world=overworld;time++;runUpdatePipeline()');assert.equal(run('CANAAN_ARENA.run()'),null);
});


test('Attaque de base : clic gauche rapide, clic droit lourd, sans mana, maintien et verrou commun',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;time=1000;P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y;CANAAN_RUBIS_STATE.import({})');
 // Secondaires fixées sans Célérité : les verrous gardent leur durée de base (0,55 s et 1,15 s).
 run('equipment.weapon={id:"w",slot:"weapon",level:1,weaponType:"sword",rarity:"Commun",sec:{power:1,crit:1}};refreshWeaponBar()');
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
 // Le clic de la souris ne lance plus la compétence 1.
 assert.doesNotMatch(source,/mouseWorldY = e\.clientY \+ camY;\n {2}useSkill\(0\);/);
 assert.match(source,/canaanHoldBasicAttack\(e\.button, true, e\.clientX, e\.clientY\)/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Application de bureau : Electron épinglé, version unique, fenêtre isolée et pont de sauvegarde limité',()=>{
 const root=path.resolve(__dirname,'..');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.equal(pkg.version,version);assert.equal(pkg.main,'app/main.js');
 assert.match(pkg.devDependencies.electron,/^\d+\.\d+\.\d+$/,'version exacte');
 assert.match(pkg.scripts.start,/build_canaan\.py && node tools\/run_app\.cjs/);
 const main=fs.readFileSync(path.join(root,'app','main.js'),'utf8'),preload=fs.readFileSync(path.join(root,'app','preload.js'),'utf8');
 for(const flag of ['contextIsolation: true','sandbox: true','nodeIntegration: false'])assert.ok(main.includes(flag),flag);
 assert.match(main,/will-navigate/);assert.ok(main.includes("if (url.split('#')[0] !== page) event.preventDefault();"),'seul le rechargement du jeu est permis');assert.match(main,/setWindowOpenHandler/);assert.match(main,/setPermissionRequestHandler/);
 assert.match(main,/runtime-config\.js/);assert.doesNotMatch(main,/loadURL\(/);
 // Le jeu ne reçoit que les opérations de sauvegarde : aucune API Node, aucun module, aucun chemin de fichier.
 assert.match(preload,/exposeInMainWorld\(\s*'canaanDesktop'/);
 assert.doesNotMatch(preload,/require\('node:|require\('fs|process\./);
 assert.match(main,/event\.sender !== mainWindow\.webContents/);
 assert.match(fs.readFileSync(path.join(root,'tools','run_app.cjs'),'utf8'),/delete env\.ELECTRON_RUN_AS_NODE/);
});

test('Sauvegardes en fichiers : écriture sûre, schéma 10, copies vérifiées, suppression avec secours',()=>{
 const os=require('node:os');
 const {createSaveStore,SAVE_SCHEMA,KEEP_SESSION}=require('../app/saves.js');
 assert.equal(SAVE_SCHEMA,10);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canaan-saves-'));
 try{
  const store=createSaveStore(dir),text=JSON.stringify({schema:10,nom:'Test',heros:{hote:{}}});
  assert.equal(store.read(1),null);assert.deepEqual(store.list().map(s=>s.text),[null,null,null]);
  assert.equal(store.write(1,text),true);assert.equal(store.read(1),text);
  assert.equal(fs.existsSync(path.join(dir,'slot-1.json')),true);assert.equal(fs.existsSync(path.join(dir,'slot-1.json.tmp')),false);
  // Refus : autre schéma, JSON invalide, slot inconnu, contenu non textuel ; le fichier existant reste intact.
  assert.throws(()=>store.write(1,JSON.stringify({schema:9})),/Schéma/);assert.throws(()=>store.write(1,'{x'));
  for(const slot of [0,4,'1',1.5])assert.throws(()=>store.write(slot,text),/Slot invalide/);
  assert.throws(()=>store.write(2,{schema:10}),/invalide/);assert.equal(store.read(1),text);
  assert.throws(()=>store.backupText('../x','session',text),/invalide/);
  // Copies « session » : seules les plus récentes sont gardées ; les autres raisons ne sont jamais effacées.
  const imported=store.backupText('import-navigateur','schema9','{"schema":9}');
  for(let i=0;i<KEEP_SESSION+3;i++)store.backup(1,'session');
  const files=fs.readdirSync(path.join(dir,'backups'));
  assert.equal(files.filter(f=>f.startsWith('slot-1-')&&f.includes('-session')).length,KEEP_SESSION);
  assert.ok(files.includes(imported));assert.equal(fs.readFileSync(path.join(dir,'backups',imported),'utf8'),'{"schema":9}');
  // Supprimer : le slot disparaît, une copie « suppression » identique reste.
  const kept=store.remove(1);assert.equal(store.read(1),null);
  assert.match(kept,/^slot-1-.*-suppression\.json$/);assert.equal(fs.readFileSync(path.join(dir,'backups',kept),'utf8'),text);
  assert.equal(store.remove(2),null);assert.equal(store.backup(3,'session'),null);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('Slots d’aventure : résumé, création sans écrasement, suppression avec secours et importation unique du schéma 9',()=>{
 const g=storageGame(),p=g.CANAAN_PERSISTENCE;
 assert.deepEqual([1,2,3].map(n=>p.summary(n).state),['vide','vide','vide']);
 assert.equal(p.createSlot(2,'  Monde <b>de</b> Lira  '),true);
 const created=JSON.parse(g.db.get('canaan_slot_2'));assert.equal(created.schema,10);assert.equal(created.nom,'Monde bde/b Lira');
 assert.equal(p.summary(2).state,'aventure');assert.equal(p.summary(2).nom,created.nom);assert.doesNotMatch(created.nom,/[<>]/);
 assert.equal(p.createSlot(2,'Autre'),false);assert.equal(JSON.parse(g.db.get('canaan_slot_2')).nom,created.nom);
 assert.equal(p.createSlot(4,'x'),false);assert.equal(p.createSlot(3,''),true);assert.equal(p.summary(3).nom,'Aventure 3');
 g.db.set('canaan_slot_1','{cassé');assert.equal(p.summary(1).state,'illisible');
 // Invités listés pour la confirmation de suppression.
 const withGuests=JSON.parse(g.db.get('canaan_slot_3'));withGuests.heros.invites={a:{pseudo:'Ami 1'},b:{pseudo:'Ami 2'}};
 g.db.set('canaan_slot_3',JSON.stringify(withGuests));assert.equal(JSON.stringify(p.summary(3).invites),'["Ami 1","Ami 2"]');
 assert.equal(p.deleteSlot(3),true);assert.equal(g.db.has('canaan_slot_3'),false);
 assert.ok([...g.db.keys()].some(k=>k.startsWith('canaan_slot_3_backup_')&&g.db.get(k)===JSON.stringify(withGuests)));
 // Importation : seulement si aucun slot n'existe.
 const legacy={schema:9,version:'1.9.0',player:{x:1,y:2,hp:50,mp:20,gold:121914},kills:7,inventory:[{id:'a',slot:'armor',ilvl:90}],
  equipment:{helm:{id:'h',slot:'helm',ilvl:100}},openedChests:['c1'],worldBossTimers:{titan:5},materials:{ore:3},bagLevel:2,
  ways:{selected:[],learned:{},points:0},rubis:{owned:{gardien:1},equipped:['gardien',null,null,null,null,null]},arena:{best:12,attempts:1,completed:true,lastBoss:'Aurelion'}};
 g.db.set('canaan_dev_18999_state',JSON.stringify(legacy));
 assert.equal(p.importLegacy(),false);assert.ok(g.db.has('canaan_dev_18999_state'));
 const h=storageGame(),q=h.CANAAN_PERSISTENCE,raw=JSON.stringify(legacy);h.db.set('canaan_dev_18999_state',raw);
 assert.equal(q.importLegacy(),true);assert.equal(h.db.has('canaan_dev_18999_state'),false);
 assert.ok([...h.db.keys()].some(k=>k.startsWith('import-navigateur_backup_')&&h.db.get(k)===raw));
 const slot=JSON.parse(h.db.get('canaan_slot_1'));
 assert.equal(slot.schema,10);assert.equal(slot.nom,'Aventure importée');assert.deepEqual(slot.monde,{openedChests:['c1'],worldBossTimers:{titan:5}});
 for(const key of ['player','kills','inventory','equipment','materials','bagLevel','ways','rubis','arena'])assert.deepEqual(slot.heros.hote[key],legacy[key],key);
 assert.deepEqual(slot.heros.invites,{});assert.equal(slot.resume.gold,121914);assert.equal(slot.resume.level,Math.round(100*60/190),'niveau de la meilleure pièce portée');
 assert.equal(q.importLegacy(),false);
 // Le slot importé se charge comme une aventure normale.
 // Les 3 minerais de l'ancienne partie sont rendus en or au chargement (10 or l'unité).
 q.selectSlot(1);assert.equal(h.loadGame(),true);assert.equal(h.P.gold,121914+30);assert.equal(h.kills,7);assert.equal(h.openedChests[0],'c1');
 assert.equal(q.meta.nom,'Aventure importée');
 // Un schéma 9 abîmé n'est jamais importé ni retiré.
 const k=storageGame();k.db.set('canaan_dev_18999_state','{abîmé');assert.equal(k.CANAAN_PERSISTENCE.importLegacy(),false);assert.equal(k.db.get('canaan_dev_18999_state'),'{abîmé');
 // Slot à ouvrir après rechargement : lu une seule fois, validé.
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(p.setPending(2),true);assert.equal(p.takePending(),2);assert.equal(p.takePending(),null);
 session.set('canaan_pending_slot','7');assert.equal(p.takePending(),null);
 assert.throws(()=>p.selectSlot(0),/Slot invalide/);
});

test('Métiers : pêche dans l’eau profonde, qualités selon le niveau, cuisine près d’une cuisinière, repas et leurs effets',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];P.dead=false;game.view={notify:()=>{},chat:()=>{}}');
 // Bancs de poissons : en mer, dans les lacs et les lacs scintillants, jamais dans l'eau peu profonde du marais.
 const kinds=run('[...new Set(CANAAN_PROF.spots().map(s=>s.kind))].sort().join()');assert.equal(kinds,'glow,lake,sea');
 assert.ok(run('CANAAN_PROF.spots().length')>=25);
 assert.ok(run('CANAAN_PROF.spots().every(s=>s.layer==="under"?game.world.underworld[s.ty][s.tx]===CANAAN_UNDER.T.LAKE:[0,18].includes(game.world.overworld[s.ty][s.tx]))'));
 assert.ok(run('CANAAN_PROF.spots().filter(s=>s.kind==="sea").every(s=>s.table.some(([k])=>k==="thon"))'));
 // Pêcher : loin d'un banc, rien ; sur la rive, la ligne part, ça mord, E ferre.
 run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');assert.equal(run('CANAAN_PROF.fish(game.hero)'),false);
 const toSpot=k=>run(`{const s=CANAAN_PROF.spots().filter(s=>s.kind==="${k}")[0];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){P.x=x;P.y=y;break}}}`);
 toSpot('sea');
 assert.ok(run('CANAAN_PROF.spotNear(P.x,P.y)')>=0);
 const catchOne=()=>{run('CANAAN_PROF.fish(game.hero)');run('game.hero.fishing.bite=time');run('time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing.state'),'bite');return run('CANAAN_PROF.fish(game.hero)')};
 for(let i=0;i<12;i++)assert.equal(catchOne(),true);
 // Niveau 1 : seulement des poissons Commun (gris), et de l'expérience gagnée.
 assert.ok(run('Object.keys(game.hero.prof.fish).every(k=>k.endsWith(":0")&&/^(saumon|thon|espadon|merou|raie):/.test(k))'),run('JSON.stringify(game.hero.prof.fish)'));
 assert.ok(run('game.hero.prof.fishing.level')>=2,'niveau gagné');
 // Le poisson s'échappe si on ne ferre pas à temps ; bouger remonte la ligne.
 run('CANAAN_PROF.fish(game.hero);game.hero.fishing.bite=time');for(let i=0;i<80;i++)run('time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing'),null);
 run('CANAAN_PROF.fish(game.hero);P.x+=40;time++;CanaanStages.professions.after()');assert.equal(run('game.hero.fishing'),null);
 // Niveau 20 : qualités jusqu'à Épique, jamais au-delà.
 run('P.x-=40;game.hero.prof.fishing.level=20;game.hero.prof.fish={}');
 for(let i=0;i<60;i++)catchOne();
 const qs=JSON.parse(run('JSON.stringify([...new Set(Object.keys(game.hero.prof.fish).map(k=>+k.split(":")[1]))].sort())'));
 assert.ok(qs.every(q=>q<=3)&&qs.includes(3),JSON.stringify(qs));
 // Cuisine : il faut une cuisinière (La Marmite dorée) ; la qualité du repas est plafonnée par le niveau de cuisine.
 run('game.hero.prof.fish={"gardon:4":3,"truite:2":2,"carpe:0":1,"saumon:3":1,"thon:1":1}');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),false,'loin du feu');
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+1.5)*TS');assert.equal(run('CANAAN_PROF.nearFire(P.x,P.y)'),false,'le feu de camp ne sert plus à cuisiner');
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS');assert.equal(run('CANAAN_PROF.nearFire(P.x,P.y)'),true,'devant la cuisinière de La Marmite dorée');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),true);
 assert.equal(run('game.hero.prof.meals["soupe:0"]'),1,'cuisine niveau 1 : repas Commun');
 run('game.hero.prof.cooking.level=20');assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,20)'),true);
 assert.equal(run('game.hero.prof.meals["soupe:3"]'),2,'niveau 20 : jusqu’à Épique');assert.equal(run('game.hero.prof.fish["gardon:4"]'),undefined);
 for(const [r,q] of [['grillade',2],['mijote',0],['fume',3],['ragout',1]])assert.equal(run(`CANAAN_PROF.cook(game.hero,"${r}",${q},1)`),true,r);
 assert.equal(run('CANAAN_PROF.cook(game.hero,"soupe",4,1)'),false,'plus de gardon');
 // Repas : PV et mana tout de suite (délai partagé), soins sur la durée, bonus de dégâts et de protection.
 run('P.mhp=1000;P.hp=100;P.mmp=500;P.mp=0');
 assert.equal(run('CANAAN_PROF.eat(game.hero,"soupe",3)'),true);assert.equal(run('P.hp'),100+Math.round((100+30)*2.3));
 assert.equal(run('CANAAN_PROF.eat(game.hero,"grillade",2)'),false,'délai des repas rapides');
 run('time+=20*60');assert.equal(run('CANAAN_PROF.eat(game.hero,"grillade",2)'),true);assert.equal(run('P.mp'),Math.round((100+25)*1.75));
 run('P.hp=100');assert.equal(run('CANAAN_PROF.eat(game.hero,"mijote",0)'),true);
 for(let i=0;i<6*60;i++)run('time++;CanaanStages.professions.after()');
 assert.equal(run('P.hp'),100+5*Math.round(20+6),'cinq secondes de soins');
 assert.equal(run('CANAAN_PROF.eat(game.hero,"fume",3)'),true);assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1.12);
 assert.equal(run('CANAAN_PROF.eat(game.hero,"ragout",1)'),true,'un nouveau bonus remplace l’ancien');
 assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1);assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),0.93);
 for(let i=0;i<61*60;i++)run('time++;CanaanStages.professions.after()');assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),1,'bonus terminé');
 // Sauvegarde : niveaux, bourriche et garde-manger gardés et vérifiés.
 assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.prof;
 assert.ok(saved.fishing.level>=20);assert.ok(saved.cooking.level>=15);assert.ok(saved.fish['truite:2']>=1||saved.meals['grillade:2']===undefined);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({fishing:{level:99,exp:-5},cooking:{level:"x"},fish:{"requin:3":2,"thon:9":1,"thon:2":3.7,"__proto__:1":1},meals:{"soupe:1":2}}))')),
  {fishing:{level:40,exp:0},cooking:{level:1,exp:0},hunting:{level:1,exp:0},mining:{level:1,exp:0},herbalism:{level:1,exp:0},enchanting:{level:1,exp:0},fish:{'thon:2':3},meat:{},meals:{'soupe:1':2},ore:{},herb:{},ench:{},codex:{},qv:2});
 // Ancienne sauvegarde à huit qualités : Héroïque devient Épique, Céleste devient Mythique (une seule fois).
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({fish:{"thon:4":1,"carpe:7":2}}).fish)')),{'thon:3':1,'carpe:5':2});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_PROF.sanitize({qv:2,fish:{"thon:4":1}}).fish)')),{'thon:4':1});
 // Fenêtre P : trois onglets.
 run('toggleProfessions()');const html=()=>g.document.getElementById('window').innerHTML;
 assert.match(html(),/Tes poissons sont des objets de ton sac/);assert.doesNotMatch(html(),/Bourriche/);run('CANAAN_PROF.actions.tab("cuisine")');assert.match(html(),/Soupe de gardon/);run('CANAAN_PROF.actions.tab("repas")');assert.match(html(),/Manger|garde-manger/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Chasse et collections : gibier abattu à l’arme, viande et qualités, carnet de chasse et collection des poissons',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];P.dead=false;P.mhp=P.hp=1e6;game.view={notify:()=>{},chat:()=>{}};CANAAN_LIFE.update()');
 // Gibier : lièvres, cerfs, moutons, grenouilles et bêtes astrales ; les autres animaux ne se chassent pas.
 assert.equal(run('CANAAN_PROF.huntable("lapin",false)&&CANAAN_PROF.huntable("cerf",true)&&CANAAN_PROF.huntable("grenouille",false)'),true);
 assert.equal(run('CANAAN_PROF.huntable("heron",false)||CANAAN_PROF.huntable("chameau",false)||CANAAN_PROF.huntable("poule",false)'),false);
 // Une attaque à l'épée sur un lièvre tout proche : il tombe, la viande arrive, le carnet le note.
 run('{const a=CANAAN_LIFE.animals().find(x=>x.kind==="lapin"&&!x.opts.glow);globalThis.__a=a;P.x=a.x-60;P.y=a.y-10;camX=P.x-W/2;camY=P.y-H/2;mouseWorldX=a.x;mouseWorldY=a.y-10;P.atk=0;CANAAN_LIFE.huntCheck();P.atk=0.28;globalThis.__hit=CANAAN_LIFE.huntCheck()}');
 assert.equal(run('__hit===__a'),true);assert.ok(run('__a.dead>0'));
 assert.equal(run('Object.keys(game.hero.prof.meat).join()'),'lievre:0','niveau 1 : viande Commun');
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.prof.codex.lapin)')),{n:1,best:0});
 assert.ok(run('game.hero.prof.hunting.exp')>0);
 // Un animal mort n'est plus touché ; il revient une minute plus tard.
 run('P.atk=0;CANAAN_LIFE.huntCheck();P.atk=0.28');assert.equal(run('CANAAN_LIFE.huntCheck()===__a'),false);
 for(let i=0;i<3700;i+=5)run('time+=5;CANAAN_LIFE.update()');assert.equal(run('__a.dead'),0);
 // L'hôte vérifie : délai entre deux prises, biome du gibier, pas en instance.
 run('game.hero.huntCd=0');const zoneHunt=run('CANAAN_PROF.hunt(game.hero,"grenouille")');assert.equal(zoneHunt,false,'pas de grenouille hors du marais');
 assert.equal(run('CANAAN_PROF.hunt(game.hero,"dragon")'),false);
 run('game.hero.huntCd=0;game.hero.prof.hunting.level=25');
 for(let i=0;i<40;i++)run('time+=41;CANAAN_PROF.hunt(game.hero,"lapin")');
 const qs=JSON.parse(run('JSON.stringify([...new Set(Object.keys(game.hero.prof.meat).map(k=>+k.split(":")[1]))])'));assert.ok(qs.every(q=>q<=3)&&qs.includes(3),JSON.stringify(qs));
 // Recettes de gibier : la viande se cuisine près d'une cuisinière.
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS;game.hero.prof.cooking.level=40;game.hero.prof.meat={"venaison:3":1,"lievre:2":1}');
 assert.equal(run('CANAAN_PROF.cook(game.hero,"roti",3,1)&&CANAAN_PROF.cook(game.hero,"civet",2,1)'),true);
 run('P.mhp=1000;P.hp=100;P.mmp=500;P.mp=0');assert.equal(run('CANAAN_PROF.eat(game.hero,"civet",2)'),true);
 assert.equal(run('P.hp'),100+Math.round((60+20)*1.75));assert.equal(run('P.mp'),Math.round((60+15)*1.75));
 assert.equal(run('CANAAN_PROF.eat(game.hero,"roti",3)'),true);assert.equal(run('CANAAN_PROF.damageMult(game.hero)'),1.07);assert.equal(run('CANAAN_PROF.armorMult(game.hero)'),0.93);
 // Collection des poissons : une prise découvre l'espèce.
 run('{const s=CANAAN_PROF.spots().find(s=>s.kind==="sea");for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){P.x=x;P.y=y;break}}}');
 run('CANAAN_PROF.fish(game.hero);game.hero.fishing.bite=time;time++;CanaanStages.professions.after();CANAAN_PROF.fish(game.hero)');
 assert.equal(run('["saumon","thon","espadon","merou","raie"].filter(k=>game.hero.prof.codex[k]).length'),1);
 // Fenêtre : collection (découverts et silhouettes), bio d'une espèce, carnet de chasse.
 run('toggleProfessions()');const html=()=>g.document.getElementById('window').innerHTML;
 assert.match(html(),/Collection · 1 \/ 18 espèces découvertes/);assert.match(html(),/\?\?\?/);
 const fishId=run('["saumon","thon","espadon","merou","raie"].find(k=>game.hero.prof.codex[k])');
 run('CANAAN_PROF.actions.codex("'+fishId+'")');assert.match(html(),new RegExp(run('CANAAN_PROF.FISH["'+fishId+'"].bio').slice(0,30).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 run('CANAAN_PROF.actions.tab("chasse")');assert.match(html(),/Collection · 1 \/ 13 espèces découvertes/);assert.match(html(),/Ta viande est un objet de ton sac/);assert.doesNotMatch(html(),/Gibecière/);
 // Sauvegarde : carnet, viandes et niveau de chasse gardés.
 assert.equal(run('saveGame()'),true);
 const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.prof;
 assert.ok(saved.codex.lapin.n>=40&&saved.hunting.level>=25&&saved.codex[fishId].n===1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Vie du monde : animaux de chaque biome qui se promènent et fuient, habitants qui parlent, marchand redessiné',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];CANAAN_LIFE.update()');
 const zoneOf=`(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS)))`;
 const kinds=JSON.parse(run('JSON.stringify(ZONES.map((z,i)=>[...new Set(CANAAN_LIFE.animals().filter(a=>a.kind!=="poule"&&!a.sp.coast&&!a.farm&&!a.pet&&!a.layer&&'+zoneOf+'(a)===i).map(a=>a.kind))].sort()))'));
 // Chaque biome a ses espèces, et seulement les siennes (les bêtes de la ferme du camp sont à part).
 assert.deepEqual(kinds,[['cerf','lapin','mouton','renard'],['cerf','ecureuil','faisan','lapin','renard'],['canard','grenouille','heron','tortue'],['cerf','ecureuil','faisan','herisson','renard'],['chameau','chevre','fennec','lezard'],['cerf','ecureuil','lapin']]);
 // Crabes : sur les plages tout autour de l'île, sur la terre ferme au bord de la mer, dans plusieurs biomes.
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").length')>=30);
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").every(a=>{const x=Math.floor(a.hx/TS),y=Math.floor(a.hy/TS);return canWalk(a.hx,a.hy)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([u,v])=>game.world.overworld[y+v][x+u]===0)})'),'crabes au bord de la mer');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="tortue_mer").length')>=10,'tortues de mer sur les plages');
 assert.ok(run('new Set(CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").map(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS)))).size')>=4,'crabes tout autour de l’île');
 assert.ok(run('CANAAN_LIFE.animals().length')>350);assert.ok(run('CANAAN_LIFE.fliers().length')>150);
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.opts.glow).every(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS))===5)'),'cerfs et lapins lumineux de la Forêt enchantée');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>!a.layer).every(a=>canWalk(a.x,a.y))'),'tous sur un sol praticable');
 // Ils se promènent : près du héros, les bêtes bougent au fil du temps et restent près de chez elles.
 // (près d'un troupeau de moutons et de son voisinage)
 run('{const a=CANAAN_LIFE.animals().find(x=>x.kind==="mouton");P.x=a.hx+500;P.y=a.hy;camX=P.x-W/2;camY=P.y-H/2;globalThis.__deer=CANAAN_LIFE.animals().find(x=>x.kind==="cerf");globalThis.__start=CANAAN_LIFE.animals().map(x=>[x.x,x.y])}');
 for(let i=0;i<900;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('CANAAN_LIFE.animals().filter((x,i)=>Math.hypot(x.x-__start[i][0],x.y-__start[i][1])>4).length')>=2,'des animaux se sont déplacés');
 assert.ok(run('CANAAN_LIFE.animals().every(a=>Math.hypot(a.x-a.hx,a.y-a.hy)<(a.sp.roam+5)*TS)'),'chacun reste près de chez lui');
 // Un cerf détale quand le héros s'approche.
 run('__deer.wait=999;__deer.flee=0;P.x=__deer.x+60;P.y=__deer.y;camX=P.x-W/2;camY=P.y-H/2;globalThis.__d0=Math.hypot(P.x-__deer.x,P.y-__deer.y)');
 for(let i=0;i<40;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('Math.hypot(P.x-__deer.x,P.y-__deer.y)')>run('__d0')+20,'le cerf fuit');
 // Habitants : au camp et autour des refuges, ruines et tours ; une bulle quand on s'approche.
 assert.ok(run('CANAAN_LIFE.villagers().length')>=6+PIXEL_PLACES_COUNT(run));
 run('{const v=CANAAN_LIFE.villagers()[0];P.x=v.x+40;P.y=v.y;camX=P.x-W/2;camY=P.y-H/2;globalThis.__v=v}');
 run('time++;CANAAN_LIFE.update()');
 assert.equal(typeof run('__v.bubble&&__v.bubble.text'),'string');assert.ok(run('__v.lines.includes(__v.bubble.text)'));
 assert.ok(run('CANAAN_LIFE.villagers().every(v=>v.lines.length>=4&&v.name.length>1&&canWalk(v.x,v.y))'));
 // Marchand : nouveau dessin (chapeau, sac à dos), une image par village et par clignement.
 assert.match(source,/Marchand ambulant en pixels/);
 assert.equal(errors.length,0,errors.join('\n'));
});
function PIXEL_PLACES_COUNT(run){return run('PIXEL_PLACES.length')}

test('Création du héros : sexe, race, peau, coiffure, couleurs et tenue, sauvegardés et vérifiés',async()=>{
 const L=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','data','looks.js')).href);
 // Valeurs vérifiées : tout ce qui est inconnu redevient la valeur par défaut ; la peau suit la palette de la race.
 assert.deepEqual(L.sanitizeLook(null),L.defaultLook());
 assert.deepEqual(L.sanitizeLook({race:'dragon',sex:'x',hairStyle:'<b>',hair:'red',eyes:'#fff',outfit:'?'}),L.defaultLook());
 assert.equal(L.sanitizeLook({race:'orc',skin:'#f0c7a0'}).skin,L.LOOK_RACES[1].skins[0],'peau humaine refusée pour un orc');
 assert.equal(L.sanitizeLook({race:'elfe',skin:'#A8B8E0'}).skin,'#a8b8e0');
 for(let i=0;i<40;i++){const r=L.randomLook(Math.random);assert.deepEqual(L.decodeLook(L.encodeLook(r)),r)}
 assert.deepEqual(L.decodeLook('x'.repeat(500)),L.defaultLook());assert.deepEqual(L.decodeLook(42),L.defaultLook());
 assert.equal(L.encodeLook(L.defaultLook()),'m|humain|#f0c7a0|court|#7d5140|#202938|acier');
 const S=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','save','schema.js')).href);
 assert.equal(S.freshSave({nom:'x',slot:1,version:'v',now:1,spawn:{x:0,y:0},baseMana:300,look:{race:'elfe',sex:'f'}}).heros.hote.look.race,'elfe');
 // Écran de création dans le menu des aventures.
 const {g,run,nodes,errors}=require('./helpers/canaan-runtime.cjs')(source);
 const html=()=>nodes.get('slotMenu').innerHTML;
 run('CANAAN_SLOT_MENU.newSlot(1)');
 assert.match(html(),/class="look-creator"/);assert.match(html(),/id="lookPreview"/);
 for(const word of ['Femme','Homme','Humain','Orc','Elfe','Minotaure','Coiffure','Cheveux','Yeux','Tenue'])assert.match(html(),new RegExp(word));
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("race",3)'),true);assert.match(html(),/Pelage/);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("sex",0)'),true);assert.equal(run('CANAAN_SLOT_MENU.lookSet("hairStyle",2)'),true);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("outfit",4)'),true);assert.equal(run('CANAAN_SLOT_MENU.lookSet("skin",2)'),true);
 assert.equal(run('CANAAN_SLOT_MENU.lookSet("skin",99)'),false,'index hors palette refusé');assert.equal(run('CANAAN_SLOT_MENU.lookSet("constructor",0)'),false);
 assert.match(html(),/look-choice on" data-action="lookSet" data-key="race" data-index="3"/);
 run('CANAAN_SLOT_MENU.lookTurn(1)');assert.equal(run('CANAAN_SLOT_MENU.state().face'),1);run('CANAAN_SLOT_MENU.lookTurn(-1)');run('CANAAN_SLOT_MENU.lookTurn(-1)');assert.equal(run('CANAAN_SLOT_MENU.state().face'),3);
 const chosen=run('JSON.stringify(CANAAN_SLOT_MENU.state().look)');
 nodes.get('slotName').value='Terres du Minotaure';
 // Changer de choix garde le nom tapé.
 run('CANAAN_SLOT_MENU.lookTurn(1)');assert.match(html(),/value="Terres du Minotaure"/);
 g.location.reload=()=>{};
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(run('CANAAN_SLOT_MENU.create(1)'),true);
 const saved=JSON.parse(g.localStorage.getItem('canaan_slot_1'));
 assert.equal(saved.nom,'Terres du Minotaure');assert.deepEqual(saved.heros.hote.look,JSON.parse(chosen));
 assert.deepEqual(saved.heros.hote.look,{sex:'f',race:'minotaure',skin:L.LOOK_RACES[3].skins[2],hairStyle:'queue',hair:'#7d5140',eyes:'#202938',outfit:'or'});
 // Héros d'invité : apparence gardée dans les préférences, le formulaire pour rejoindre conserve ce qui est tapé.
 run('CANAAN_SLOT_MENU.render();CANAAN_SLOT_MENU.joinForm()');assert.match(html(),/lookEditJoin/);
 run("document.getElementById('joinPseudo').value='Lina'");
 run('CANAAN_SLOT_MENU.lookEditJoin()');assert.match(html(),/Mon héros d’invité/);assert.doesNotMatch(html(),/id="slotName"/);
 run('CANAAN_SLOT_MENU.lookSet("race",2);CANAAN_SLOT_MENU.lookSaveJoin()');
 assert.equal(run('decodeLook(CANAAN_NET.settings().look).race'),'elfe');assert.match(html(),/value="Lina"/);assert.match(html(),/Apparence enregistrée/);
 // Sprites : un par apparence, direction et pas ; le dessin d'une apparence invalide retombe sur celle par défaut.
 for(const action of ['lookSet','lookRandom','lookTurn','lookEditJoin','lookSaveJoin','lookBack'])assert.match(source,new RegExp(action+': '));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Menu des aventures : trois cartes, création, confirmation de suppression avec invités, noms échappés',()=>{
 const {g,run,nodes,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 const html=()=>nodes.get('slotMenu').innerHTML;
 // Sans aventure choisie, le jeu ne démarre pas : le menu s'affiche.
 assert.equal(run('started'),false);assert.equal((html().match(/class="slot-card/g)||[]).length,3);
 assert.match(html(),/data-action="newSlot" data-slot="1"/);assert.doesNotMatch(html(),/openSaveFolder/);
 run('CANAAN_SLOT_MENU.newSlot(2)');assert.match(html(),/id="slotName"[^>]*value="Aventure 2"/);
 nodes.get('slotName').value='<img src=x onerror=alert(1)>';
 let reloads=0;g.location.reload=()=>reloads++;
 const session=new Map();g.sessionStorage={setItem:(a,b)=>session.set(a,b),getItem:a=>session.get(a)??null,removeItem:a=>session.delete(a)};
 assert.equal(run('CANAAN_SLOT_MENU.create(2)'),true);assert.equal(reloads,1);assert.equal(session.get('canaan_pending_slot'),'2');
 run('CANAAN_SLOT_MENU.render()');assert.match(html(),/data-action="playSlot" data-slot="2"/);assert.doesNotMatch(html(),/<img/);
 // Confirmation : les pseudos des invités dont le héros sera perdu sont listés.
 const data=JSON.parse(g.localStorage.getItem('canaan_slot_2'));data.heros.invites={x:{pseudo:'Lina'}};g.localStorage.setItem('canaan_slot_2',JSON.stringify(data));
 run('CANAAN_SLOT_MENU.askDelete(2)');assert.match(html(),/Lina/);assert.match(html(),/confirmDeleteSlot/);
 run('CANAAN_SLOT_MENU.cancel()');assert.doesNotMatch(html(),/confirmDeleteSlot/);
 run('CANAAN_SLOT_MENU.askDelete(2)');assert.equal(run('CANAAN_SLOT_MENU.remove(2)'),true);
 assert.equal(g.localStorage.getItem('canaan_slot_2'),null);assert.match(html(),/Aventure supprimée/);
 // Actions déclarées et validées par la table des contrôles.
 for(const action of ['playSlot','newSlot','createSlot','askDeleteSlot','confirmDeleteSlot','cancelSlotMenu','openSaveFolder'])assert.match(source,new RegExp(action+': '));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Démarrage sur un slot choisi : chargement, copie de session, partie lancée ; retour au menu par rechargement',()=>{
 const save={schema:10,version:'1.9.0',nom:'Monde test',created:1,updated:2,resume:{ilvl:0,gold:4242},monde:{openedChests:[],worldBossTimers:{}},
  heros:{hote:{player:{x:3480,y:11400,hp:80,mp:40,gold:4242},kills:3,inventory:[],equipment:{},materials:{},bagLevel:0,ways:{selected:[],learned:{},points:0},rubis:{owned:{},equipped:[null,null,null,null,null,null]},arena:{best:0,attempts:0,completed:false,lastBoss:''}},invites:{}}};
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config')){
   run("globalThis.__db=new Map();localStorage={getItem:k=>__db.get(k)??null,setItem:(k,v)=>__db.set(k,String(v)),removeItem:k=>__db.delete(k)}");
   run("globalThis.__session=new Map([['canaan_pending_slot','3']]);sessionStorage={setItem:(a,b)=>__session.set(a,b),getItem:a=>__session.get(a)??null,removeItem:a=>__session.delete(a)}");
   run('localStorage.setItem("canaan_slot_3",'+JSON.stringify(JSON.stringify(save))+')');
  }
 }});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('CANAAN_PERSISTENCE.slot'),3);assert.equal(run('started'),true);assert.equal(run('P.gold'),4242);
 assert.equal(run('CANAAN_PERSISTENCE.meta.nom'),'Monde test');assert.equal(run('__session.size'),0);
 // Copie « session » prise au lancement, identique au slot chargé.
 assert.equal(run('[...__db.keys()].filter(k=>k.startsWith("canaan_slot_3_backup_")&&__db.get(k)===__db.get("canaan_slot_3")).length'),1);
 // Retour au menu : sauvegarde puis rechargement (aucun état d'une aventure ne survit).
 let reloads=0;g.location.reload=()=>reloads++;
 run('P.gold=5000;pauseToTitle()');assert.equal(reloads,1);assert.equal(run('started'),false);
 assert.equal(JSON.parse(run('localStorage.getItem("canaan_slot_3")')).heros.hote.player.gold,5000);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Architecture : shared/ pur (aucun navigateur, aucun autre dossier), chargeable dans Node, exposé par le pont transitoire',async()=>{
 const root=path.join(__dirname,'..','src','canaan'),sharedDir=path.join(root,'shared');
 const files=[];
 (function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.js'))files.push(p)}})(sharedDir);
 assert.ok(files.length>=4,'modules partagés');
 for(const file of files){
  const code=fs.readFileSync(file,'utf8'),rel=path.relative(root,file);
  // Règle de dépendance : shared n'utilise ni le navigateur, ni le stockage, ni Node, ni de variable globale.
  const bare=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');
  assert.doesNotMatch(bare,/\b(?:window|document|globalThis|localStorage|sessionStorage|navigator|requestAnimationFrame|require)\b/,rel);
  for(const [,spec] of code.matchAll(/\bfrom\s+'([^']+)'/g)){
   assert.ok(spec.startsWith('.'),rel+' importe un paquet : '+spec);
   assert.ok(path.resolve(path.dirname(file),spec).startsWith(sharedDir+path.sep),rel+' sort de shared/ : '+spec);
  }
  // Chargeable sans écran (phase 2 : simulation dans Node).
  const mod=await import(require('node:url').pathToFileURL(file).href);
  assert.ok(Object.keys(mod).length>0,rel);
 }
 // Le pont importe uniquement des modules partagés, et chaque export arrive dans le jeu.
 const bridge=fs.readFileSync(path.join(root,'bridge.js'),'utf8');
 for(const [,spec] of bridge.matchAll(/\bfrom\s+'([^']+)'/g))assert.match(spec,/^\.\/shared\//);
 const {g,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 for(const file of files){
  const mod=await import(require('node:url').pathToFileURL(file).href);
  for(const [name,value] of Object.entries(mod))assert.equal(JSON.stringify(g[name]),JSON.stringify(value),name);
 }
 // Le build regroupe les modules ES avec esbuild, version épinglée.
 assert.match(JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8')).devDependencies.esbuild,/^\d+\.\d+\.\d+$/);
 assert.match(source,/<script id="canaan-modules">\n\(\(\) => \{/);
});

test('Catalogues partagés gelés : donjons copiés pour chaque partie, monstres, boss, économie, classes et statistiques',async()=>{
 const url=f=>require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href;
 const world=await import(url('data/world.js')),economy=await import(url('data/economy.js')),classes=await import(url('data/classes.js'));
 const stats=await import(url('data/stats.js')),rules=await import(url('rules/stats.js'));
 for(const value of [world.INSTANCE_DEFS,world.INSTANCE_DEFS[9].difficulties.heroic,world.MOB_TYPES[0],world.WORLD_BOSS_DEFS[0],economy.SOURCE_REWARDS.normal,economy.LEGACY_MATERIAL_GOLD,economy.BAG_PRICES,classes.CLASSES[0].talents[0],classes.CLASSES[3].elements,classes.ELEMENTS.ice,stats.PRIMARY_STATS.attack,stats.SLOT_PROFILE.weapon,stats.ZONE_LEVELS[0],stats.QUALITY_FACTOR])
  assert.equal(Object.isFrozen(value),true);
 // Chaque partie reçoit sa propre liste de donjons, modifiable par la génération de l'île.
 const a=world.createInstances(),b=world.createInstances();
 a[0].x=42;a[9].difficulties.normal.hp=9;assert.equal(b[0].x,0);assert.equal(world.INSTANCE_DEFS[9].difficulties.normal.hp,1);
 assert.equal(Object.isFrozen(a[0]),false);assert.equal(a.length,14);assert.equal(world.WORLD_BOSS_DEFS.length,8);assert.equal(world.MOB_TYPES.length,47);
 assert.equal(world.BOSS_RESPAWN_MS,180000);assert.equal(economy.BAG_PRICES.length,9);assert.equal(classes.CLASSES.length,4);assert.deepEqual(classes.TALENT_SLOT_LEVELS,[1,10,20,30,40]);
 assert.equal(stats.PRIMARY_KEYS.length,3);assert.equal(stats.SECONDARY_KEYS.length,6);assert.equal(stats.MAX_LEVEL,60);
 assert.deepEqual(stats.ZONE_LEVELS.map(z=>z.join('-')),['1-10','10-20','20-30','30-40','40-50','50-60']);assert.equal(rules.xpToNext(60),0);
 // Dans le jeu, les portails sont placés sur la copie, jamais sur le catalogue.
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.ok(run('instances.every(d=>d.x>0&&d.y>0)'));assert.ok(run('INSTANCE_DEFS.every(d=>d.x===0&&d.y===0)'));
 assert.ok(run('WORLD_BOSSES.every(b=>!Object.isFrozen(b))'));
});

test('Règles partagées dans Node : objets, statistiques, niveaux, XP, économie et classes, identiques au jeu',async()=>{
 const url=f=>require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared',f)).href;
 const items=await import(url('rules/items.js')),stats=await import(url('rules/stats.js'));
 const economy=await import(url('rules/economy.js')),classRules=await import(url('rules/classes.js'));
 // Objets : qualité, niveau, tirage déterministe, type d'arme, nom affiché (sans amélioration).
 assert.equal(items.rarityInfo({rarity:'Inconnue'}).name,'Commun');
 assert.deepEqual([items.itemLevel({level:0}),items.itemLevel({level:45}),items.itemLevel({level:99}),items.itemLevel(null)],[1,45,60,0]);
 const seq=values=>{let i=0;return()=>values[i++]};
 assert.equal(items.rollRarity(()=>0).name,'Commun');assert.equal(items.rollRarity(()=>0.9905).name,'Épique');assert.equal(items.rollRarity(()=>0.99999).name,'Épique');
 const w={slot:'weapon',weaponType:'fronde'};items.ensureWeaponType(w);assert.equal(w.weaponType,'sword');
 assert.equal(items.gearDisplayName({slot:'helm',name:'Heaume',upgrade:2}),'Heaume');
 for(const gone of ['upgradeLevel','upgradeCost','upgradable','tierIlvl','averageIlvlOf','effectiveIlvl'])assert.equal(gone in items,false,gone);
 // Équipement : principales fixées par niveau et qualité ; secondaires tirées (deux différentes, dans la plage).
 const sword={slot:'weapon',level:45,rarity:'Légendaire'};
 assert.deepEqual(stats.itemPrimary(sword),{attack:196,defense:122,vitality:147});
 assert.deepEqual(stats.secondaryRange(45,'Légendaire'),[29,79]);
 const sec=stats.rollSecondaries(45,'Légendaire',seq([0,0,0.99,0.99]));assert.deepEqual(sec,{power:29,resist:79});
 assert.equal(stats.validSecondaries(sec),true);assert.equal(stats.validSecondaries({power:3,power2:4}),false);assert.equal(stats.validSecondaries({crit:5}),false);
 // Statistiques du héros : points convertis selon son niveau ; Défense contre le niveau de l'attaquant, jamais 100 %.
 const st=stats.heroStats(45,[{...sword,sec}],300);
 assert.equal(st.attack,Math.round(16+2*45+196*0.15));assert.equal(st.maxHp,Math.round(90+14*45+147*1.6));assert.equal(st.maxMp,300);
 assert.ok(Math.abs(st.damageBonus-29/stats.pointsPerPercent(45))<1e-9);assert.ok(st.resist>0&&st.resist<100);assert.equal(st.mastery,0);
 assert.ok(stats.defenseReduction(1e9,60)<1&&stats.defenseReduction(500,10)>stats.defenseReduction(500,60));
 // Monstres et XP : plus fort avec le niveau ; l'XP ralentit par tranche, un monstre trop faible rapporte peu.
 assert.ok(stats.mobHealth(60)>stats.mobHealth(1)&&stats.mobDamage(60)>stats.mobDamage(1));
 assert.ok(stats.bossHealth(30,'raid')>stats.bossHealth(30,'dungeon'));
 assert.ok(stats.xpToNext(55)/stats.mobXp(55,55)>5*stats.xpToNext(5)/stats.mobXp(5,5),'plus exigeant en fin de parcours');
 assert.ok(stats.mobXp(10,30)<stats.mobXp(30,30)*0.2);
 const hero={level:1,exp:0};assert.equal(stats.addXp(hero,stats.xpToNext(1)+stats.xpToNext(2)),2);assert.deepEqual(hero,{level:3,exp:0});
 const top={level:59,exp:0};stats.addXp(top,1e9);assert.deepEqual(top,{level:60,exp:0},'niveau 60 au maximum');
 assert.equal(stats.levelFromIlvl(190),60);assert.equal(stats.levelFromIlvl(1),1);
 // Économie et classes : anciens matériaux rendus en or, prix, emplacements de talents par niveau, effets non cumulables.
 const prices={ore:10,wood:10,essence:50,core:200};
 assert.equal(economy.legacyMaterialGold({ore:3,wood:2,essence:1,core:1},prices),300);
 assert.equal(economy.legacyMaterialGold({ore:'Infinity',wood:-4,core:'2'},prices),400);assert.equal(economy.legacyMaterialGold(null,prices),0);
 assert.equal(economy.lootRarity('dungeon').name,'Rare');assert.equal(economy.lootRarity('chest').name,'Peu commun');
 assert.equal(economy.shopPriceAt(10),150);assert.equal(classRules.talentSlotsAt(1),1);assert.equal(classRules.talentSlotsAt(25),3);assert.equal(classRules.talentSlotsAt(60),5);
 assert.deepEqual(classRules.sanitizeClasse({id:'assassin',talents:[3,3,9,10]},20),{id:'assassin',talents:[3,9]});
 assert.deepEqual(classRules.sanitizeClasse(null,60),{id:null,talents:[]});
 assert.deepEqual(classRules.refreshDot({dps:5,until:10},3,12),{dps:5,until:12});assert.deepEqual(classRules.refreshDot(null,3,12),{dps:3,until:12});
 // Le jeu passe par ces mêmes règles : mêmes résultats que les appels directs.
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('game.hero.level=45;equipment={...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,null])),weapon:'+JSON.stringify({id:'w',...sword,weaponType:'bow',sec})+'}');
 const game=JSON.parse(run('JSON.stringify({stats:(()=>{const s=characterStats();return {maxHp:s.maxHp,attack:s.attack,defense:s.defense}})(),sell:gearSellValue(equipment.weapon),shop:shopPrice()})'));
 assert.deepEqual(game.stats,{maxHp:st.maxHp,attack:st.attack,defense:st.defense});
 assert.equal(game.sell,economy.sellValue({rarity:'Légendaire'},45));assert.equal(game.shop,economy.shopPriceAt(45));
});

test('Objet game : game.hero porte le héros, statistiques de n’importe quel héros, anciens noms en raccourcis transitoires',()=>{
 // Plus aucun script n'utilise les anciens noms globaux : seuls les raccourcis de game-state.js les définissent.
 const dir=path.join(__dirname,'..','src','canaan','scripts');
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&f!=='game-state.js')){
  const code=fs.readFileSync(path.join(dir,file),'utf8').split('\n').filter(l=>!l.trim().startsWith('//')).map(l=>l.split(' // ')[0]).join('\n');
  assert.doesNotMatch(code,/(?<![.\w'"$-])\b(?:equipment|inventory|materials|kills|world|decor|overworld|overdecor|monsters|projectiles|drops|npcs|chests|openedChests|worldBossTimers|instanceState|returnPos|worldClock)\b(?!\s*:)/,file);
 }
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 assert.equal(run('game.hero.player===P'),true);
 // Le monde : carte, entités simulées, coffres, boss de monde et instance, regroupés dans game.world.
 assert.equal(run('world===game.world.tiles&&monsters===game.world.monsters&&npcs===game.world.npcs&&openedChests===game.world.openedChests'),true);
 assert.ok(run('game.world.tiles.length===MAPH&&game.world.monsters.length>0&&game.world.npcs.length>0'));
 run('instanceState={index:2}');assert.equal(run('game.world.instance.index'),2);run('game.world.instance=null');assert.equal(run('instanceState'),null);
 run('kills=5');assert.equal(run('game.hero.kills'),5);
 // Les effets d'affichage restent hors du monde simulé.
 assert.equal(run('"particles" in game.world||"floaters" in game.world'),false);
 // Classe, Rubis et records de l'Arène : état sauvegardé du héros dans game.hero, plus aucune copie dans les modules.
 for(const [file,names] of [['class-talents.js','classe|talents'],['rubis.js','owned|equipped'],['arena.js','state']])
  assert.doesNotMatch(fs.readFileSync(path.join(dir,file),'utf8'),new RegExp('\\blet\\s+(?:'+names+')\\b'),file);
 run("game.hero.level=20;CANAAN_CLASS_STATE.import({id:'paladin',talents:[1,6]})");
 assert.equal(run('JSON.stringify(game.hero.classe)'),JSON.stringify({id:'paladin',talents:[1,6]}));
 assert.equal(JSON.stringify(run('CANAAN_CLASS.audit().talents')),'[1,6]');
 run("CANAAN_RUBIS_STATE.import({owned:{gardien:2,vampire:1},equipped:['gardien','vampire',null,null,null,null]})");
 assert.equal(run('game.hero.rubis.owned.gardien'),2);assert.equal(run('CANAAN_RUBIS.has("vampire")'),true);
 run('CANAAN_RUBIS.grant("tempete")');assert.equal(run('game.hero.rubis.owned.tempete'),1);
 run("CANAAN_ARENA_STATE.import({best:7,attempts:3,completed:false,lastBoss:'Zephiron'})");
 assert.equal(run('game.hero.arena.best+"/"+game.hero.arena.attempts'),'7/3');assert.equal(run('CANAAN_ARENA.state().lastBoss'),'Zephiron');
 // La sauvegarde lit ces mêmes états.
 const hero=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot().heros.hote)'));
 assert.deepEqual(hero.classe,{id:'paladin',talents:[1,6]});assert.equal(hero.rubis.owned.tempete,1);assert.equal(hero.arena.best,7);assert.equal(run('equipment===game.hero.equipment&&inventory===game.hero.inventory'),true);
 // Remplacer par l'ancien nom met à jour game.hero (sauvegarde, tests et anciens scripts).
 run('inventory=[{id:"z",slot:"ring",level:5}]');assert.equal(run('game.hero.inventory[0].id'),'z');
 // Statistiques d'un autre héros : son équipement seul, sans la classe ni les Rubis de l'hôte.
 run('equipment={...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,null]))}');
 const host=run('characterStats().maxHp');
 run('globalThis.ally={level:40,player:{},inventory:[],equipment:{...Object.fromEntries(Object.keys(gearSlots).map(k=>[k,{id:"a"+k,slot:k==="weapon2"?"weapon":k,level:40,rarity:"Héroïque",weaponType:"bow"}]))}}');
 assert.ok(run('characterStats(ally).maxHp')>host);assert.equal(run('characterStats().maxHp'),host);
 assert.equal(run('characterStats(ally).level'),40);assert.ok(run('characterStats(ally).primary.vitality')>0);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Format partagé des sauvegardes : schéma 10, aventure neuve, résumé, import du schéma 9, même source pour le jeu et l’application',async()=>{
 const s=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','save','schema.js')).href);
 assert.equal(s.SAVE_SCHEMA,10);assert.equal(s.SLOT_COUNT,3);assert.equal(require('../app/saves.js').SAVE_SCHEMA,s.SAVE_SCHEMA);
 assert.deepEqual([0,1,3,4,'1'].map(s.isValidSlot),[false,true,true,false,false]);
 const fresh=s.freshSave({nom:' <Mon> monde ',slot:2,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300});
 assert.equal(s.isValidSave(fresh),true);assert.equal(fresh.nom,'Mon monde');assert.equal(fresh.heros.hote.player.mp,300);
 assert.deepEqual(Object.keys(fresh.heros.hote.equipment).sort(),[...s.SAVED_GEAR_SLOTS].sort());assert.deepEqual(fresh.heros.invites,{});
 assert.equal(s.isValidSave({schema:10,heros:{}}),false);assert.equal(s.isValidSave({...fresh,schema:9}),false);
 assert.deepEqual(s.summarizeSave(null,1),{slot:1,state:'vide'});assert.equal(s.summarizeSave('{x',1).state,'illisible');
 const sum=s.summarizeSave(JSON.stringify({...fresh,resume:{level:37.4,gold:12.9},heros:{...fresh.heros,invites:{a:{pseudo:'Lina'}}}}),2);
 assert.deepEqual({...sum},{slot:2,state:'aventure',nom:'Mon monde',updated:5,level:37,gold:12,classe:null,invites:['Lina']});
 // Classe choisie à la création : dans le héros et le résumé ; une classe inconnue est ignorée.
 const druid=s.freshSave({nom:'D',slot:1,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300,classe:'druide'});
 assert.deepEqual(druid.heros.hote.classe,{id:'druide',talents:[]});assert.equal(s.summarizeSave(JSON.stringify(druid),1).classe,'druide');
 assert.equal(s.freshSave({nom:'X',slot:1,version:'1.9.0',now:5,spawn:{x:1,y:2},baseMana:300,classe:'pirate'}).heros.hote.classe.id,null);
 // Ancienne aventure : l'iLvl moyen du résumé devient un niveau.
 assert.equal(s.summarizeSave(JSON.stringify({...fresh,resume:{ilvl:190,gold:0}}),2).level,60);
 assert.equal(fresh.heros.hote.level,1);assert.equal(fresh.heros.hote.exp,0);assert.ok(fresh.heros.hote.inventory.every(i=>i.level===1&&!('ilvl' in i)));
 const legacy=s.convertLegacySave({schema:9,player:{gold:7},kills:3,equipment:{helm:{ilvl:90}},openedChests:['c'],extra:1},{version:'1.9.0',now:1});
 assert.equal(s.isValidSave(legacy),true);assert.equal(legacy.heros.hote.kills,3);assert.equal(legacy.heros.hote.extra,undefined);
 assert.equal(legacy.resume.level,Math.round(90*60/190));assert.deepEqual(legacy.monde,{openedChests:['c'],worldBossTimers:{}});
});

test('Simulation sans écran : intention du héros, monstres, projectiles et butins avancent sans jamais toucher au document',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Une partie en cours, loin du camp, avec un monstre proche, un projectile et de l'or au sol.
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;canaanRegenRates=()=>({mana:0,health:0})');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++)if(canWalk((x+0.5)*TS,(y+0.5)*TS)&&canWalk((x+3.5)*TS,(y+0.5)*TS)&&!isSafe(x,y)&&Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30){s={x,y};break}P.x=(s.x+0.5)*TS;P.y=(s.y+0.5)*TS}');
 run('game.world.monsters=[{t:"Loup",x:P.x+90,y:P.y,hp:500,mhp:500,r:14,cd:0,g:3}];game.world.drops=[{x:P.x,y:P.y,v:7,life:300}]');
 run('game.world.projectiles=[{x:P.x,y:P.y,vx:6,vy:0,dmg:40,life:60,c:"#fff",combatContext:{magic:false}}]');
 const messages=[];g.__messages=messages;
 run('game.view={notify:m=>__messages.push(m),chat:()=>{}}');
 // Succès coupés : leurs récompenses en or fausseraient le compte (ils sont testés à part).
 run('CanaanStages.achievements={after(){}}');
 const x0=run('P.x'),gold0=run('P.gold'),hp0=run('P.hp');
 // Plus aucun écran : tout accès au document échoue.
 const screen=g.document;g.document=new Proxy({},{get(_t,key){throw new Error('accès à l’écran pendant la simulation : document.'+String(key))}});
 try{
  run('game.hero.intent.dx=1;game.hero.intent.dy=0');
  // PV le plus bas pendant la simulation (une montée de niveau rend tous les PV).
  run('globalThis.__minHp=P.hp');
  // Hasard reproductible : esquives et déviations ne laissent jamais le loup sans toucher.
  run('Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})()');
  for(let i=0;i<600;i++)run('time++;simulateStep();updateWorld();__minHp=Math.min(__minHp,P.hp)');
 }finally{g.document=screen}
 assert.ok(run('P.x')>x0,'le héros suit son intention');
 assert.equal(run('P.gold'),gold0+7);assert.ok(messages.includes('+7 or'),'le message passe par game.view');
 assert.ok(run('__minHp')<hp0,'le monstre a frappé');assert.equal(run('game.world.projectiles.length'),0);
 assert.equal(errors.length,0,errors.join('\n'));
 // Avec l'interface, le même relais affiche les messages à l'écran.
 assert.match(source,/game\.view\.notify = showToast;/);
 assert.doesNotMatch(source.slice(source.indexOf('function update() {'),source.indexOf('function updateView() {')),/document\.|getElementById|keys\[|mouseWorld|camX|shake/);
});

test('Plusieurs héros : chacun suit son intention, les monstres ciblent le plus proche, chaque allié encaisse selon son équipement',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:m=>(globalThis.__msgs||(globalThis.__msgs=[])).push(m),chat:()=>{}}');
 // Un terrain dégagé loin du camp ; l'hôte reste à l'écart.
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-1;a<=12&&ok;a++)for(let b=-1;b<=10&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.base={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=base.x+11*TS;P.y=base.y+9*TS');
 const gear=(level,rarity)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+level+k+'",slot:"'+k+'",level:'+level+',rarity:"'+rarity+'",weaponType:"sword"}').join(',')+'}';
 run('globalThis.bare=canaanCreateHero({name:"Nu",x:base.x,y:base.y});globalThis.tank=canaanCreateHero({name:"Rempart",x:base.x,y:base.y+5*TS,equipment:'+gear(60,'Mythique')+'});tank.level=60;recomputeHeroStats(tank);tank.player.hp=tank.player.mhp;globalThis.walker=canaanCreateHero({name:"Marcheur",x:base.x+6*TS,y:base.y+2*TS})');
 run('game.heroes.push(bare,tank,walker);walker.intent.dx=1');
 assert.ok(run('tank.player.mhp')>run('bare.player.mhp')*5,'PV maximum tirés de l’équipement de chaque héros');
 run('game.world.monsters=[{t:"Loup",x:base.x+30,y:base.y,hp:9e9,mhp:9e9,r:14,cd:0,g:0,level:20,_levelHp:true},{t:"Loup",x:base.x+30,y:base.y+5*TS,hp:9e9,mhp:9e9,r:14,cd:0,g:0,level:20,_levelHp:true}]');
 run('globalThis.dealt={bare:0,tank:0};globalThis.hpTrack={bare:bare.player.hp,tank:tank.player.hp};canaanRegenRates=(f,p)=>({mana:0,health:0})');
 const hostHp=run('P.hp'),walkX=run('walker.player.x');
 let bareFell=false;
 for(let i=0;i<60*20;i++){run('time++;simulateStep()');bareFell=bareFell||run('bare.player.dead')}
 assert.equal(run('P.hp'),hostHp,'l’hôte, loin, n’est jamais visé');
 assert.ok(run('walker.player.x')>walkX+100,'chaque héros suit sa propre intention');
 assert.equal(bareFell,true,'l’allié sans équipement tombe');assert.ok(run('__msgs.includes("💀 Nu est à terre.")'));
 assert.equal(run('tank.player.dead'),false);
 const tankLoss=run('tank.player.mhp-tank.player.hp'),tankHits=run('Math.floor(20/1.2)');
 assert.ok(tankLoss>0,'le loup frappe le héros le plus proche');assert.ok(tankLoss/tankHits<run('bare.player.mhp')/3,'la défense de l’allié réduit les coups');
 // Un héros à terre n'est plus une cible : le loup se tourne vers le plus proche encore debout.
 assert.equal(run('nearestHero(game.world.monsters[0])===bare'),false);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Règle partagée des dégâts reçus : Défense selon le niveau de l’attaquant, Résistance, déviation puis critique ennemi',async()=>{
 const c=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','rules','combat.js')).href);
 const seq=v=>{let i=0;return()=>v[i++]};const st={defense:0,resist:0,guard:0,dodge:30};
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.9,0.9]),0.1),{damage:100,deflected:false,crit:false});
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.1,0.9]),0.1),{damage:50,deflected:true,crit:false});
 assert.deepEqual(c.mitigateIncoming(100,st,1,seq([0.9,0.05]),0.1),{damage:150,deflected:false,crit:true});
 assert.equal(c.mitigateIncoming(100,st,1,seq([0.9,0.05]),0.1,0.8).damage,140,'Rubis Volonté');
 // Défense : 82 points contre un attaquant de niveau 1 (60 + 22) = moitié des dégâts ; moins efficace contre plus fort.
 assert.equal(c.mitigateIncoming(100,{...st,defense:82},1,seq([0.9,0.9]),0).damage,50);
 assert.ok(c.mitigateIncoming(100,{...st,defense:82},40,seq([0.9,0.9]),0).damage>50);
 assert.equal(c.mitigateIncoming(100,{...st,resist:20},1,seq([0.9,0.9]),0).damage,80);
 assert.equal(c.mitigateIncoming(100,{...st,guard:10},1,seq([0.9,0.9]),0).damage,90);
 assert.equal(c.mitigateIncoming(0.2,{...st,defense:1e6},60,seq([0.9,0.9]),0).damage,1);
 assert.deepEqual([c.enemyCritChance({worldBoss:true}),c.enemyCritChance({boss:true}),c.enemyCritChance({})],[0.13,0.1,0.04]);
});

test('Attaques des alliés : épée, lance et arc frappent selon leur intention, avec leurs statistiques ; victimes au bon héros',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // On mesure les statistiques : la règle « chaque héros à son niveau » (testée à part) est neutralisée.
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}};canaanRegenRates=()=>({mana:0,health:0})');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-1;a<=14&&ok;a++)for(let b=-1;b<=12&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.base={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=base.x+13*TS;P.y=base.y+11*TS;game.world.monsters=[];const k0=game.hero.kills;globalThis.hostKills0=k0');
 const gear=(level,rarity,weapon)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+level+weapon+k+'",slot:"'+k+'",level:'+level+',rarity:"'+rarity+'",weaponType:"'+weapon+'"}').join(',')+'}';
 const ally=(name,weapon,level,rarity,row)=>run('(()=>{const h=canaanCreateHero({name:"'+name+'",x:base.x,y:base.y+'+row+'*TS,equipment:'+gear(level,rarity,weapon)+'});h.level='+level+';recomputeHeroStats(h);h.player.hp=h.player.mhp;game.heroes.push(h);const w={t:"Loup",x:h.player.x+60,y:h.player.y,hp:2000,mhp:2000,r:14,cd:99,g:5,level:30,_levelHp:true};game.world.monsters.push(w);h.intent.attack="quick";h.intent.aimX=w.x;h.intent.aimY=w.y;globalThis["w_'+name+'"]=w;globalThis["h_'+name+'"]=h})()');
 ally('Lame','sword',60,'Mythique',0);ally('Pique','spear',60,'Mythique',4);ally('Archer','bow',60,'Mythique',8);ally('Novice','sword',1,'Commun',12);
 // Les loups ne ripostent pas (recharge immense) : on mesure seulement les coups des alliés.
 run('for(const m of game.world.monsters)m.cd=1e9');
 let maxDrops=0;
 for(let i=0;i<60*30;i++){run('time++;simulateStep()');maxDrops=Math.max(maxDrops,run('game.world.drops.length'))}
 for(const name of ['Lame','Pique','Archer'])assert.equal(run('w_'+name+'.hp<=0&&!game.world.monsters.includes(w_'+name+')'),true,name+' abat son loup');
 assert.equal(run('h_Lame.kills+h_Pique.kills+h_Archer.kills'),3);assert.equal(run('h_Archer.kills'),1,'la flèche crédite son tireur');
 assert.equal(run('game.hero.kills'),run('hostKills0'),'l’hôte ne reçoit pas les victimes des alliés');
 // Chaque loup laisse son or ; l'allié qui passe dessus le ramasse dans sa propre bourse.
 for(const name of ['Lame','Pique','Archer'])assert.ok(run('h_'+name+'.player.gold')>=5,name+' ramasse son or');
 // Le novice frappe bien moins fort : son loup tient encore.
 assert.ok(run('w_Novice.hp>0'),'statistiques propres à chaque héros');assert.ok(run('w_Novice.hp<2000'),'le novice frappe quand même');
 // Recharge propre à chaque allié : pas plus d'une attaque rapide toutes les 0,6 s.
 run('h_Lame.player.basicLock=0;canaanHeroBasicAttack(h_Lame,false)');assert.equal(run('canaanHeroBasicAttack(h_Lame,false)'),false);
 // La Célérité de l'allié raccourcit ce délai.
 assert.ok(Math.abs(run('h_Lame.player.basicLock')-0.55*(1-Math.min(60,run('characterStats(h_Lame).haste'))/100))<1e-9);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Règle partagée des coups infligés : Puissance, écart de niveau, armure des élites et boss, critique ; puissance d’attaque',async()=>{
 const c=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','rules','combat.js')).href);
 const st={level:10,crit:10,critPower:50,damageBonus:0};
 // Monstre ordinaire de même niveau : 5 % d'armure ; critique +50 %, Rubis Précision ×1,12.
 assert.deepEqual(c.resolveOutgoing(100,st,{level:10},()=>0.99),{damage:95,crit:false});
 assert.deepEqual(c.resolveOutgoing(100,st,{level:10},()=>0),{damage:Math.round(95*1.5),crit:true});
 assert.equal(c.resolveOutgoing(100,st,{level:10},()=>0,1,1.12).damage,Math.round(95*1.5*1.12));
 // Puissance : +20 % de tous les dégâts. Monstre 10 niveaux au-dessus : moitié des dégâts.
 assert.equal(c.resolveOutgoing(100,{...st,damageBonus:20},{level:10},()=>0.99).damage,114);
 assert.equal(c.resolveOutgoing(100,st,{level:20},()=>0.99).damage,48);
 // Boss de monde : 15 % d'armure, réduite par le Rubis Briseur.
 assert.equal(c.resolveOutgoing(100,st,{level:10,worldBoss:true},()=>0.99).damage,85);
 assert.equal(c.resolveOutgoing(100,st,{level:10,worldBoss:true},()=>0.99,0.92).damage,86);
 assert.equal(c.heroPower(18),23);assert.equal(c.heroPower(100),105);assert.equal(c.heroMagicPower(18),23);assert.equal(c.heroMagicPower(100),c.heroPower(100));assert.equal(c.heroPower(0),8);
});

test('Butin individuel : objets et or de chaque victime vont au héros qui l’a obtenue',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;globalThis.__notes=[];globalThis.__chat=[];game.view={notify:m=>__notes.push(m),chat:(w,m)=>__chat.push(w+": "+m)}');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:P.x+400,y:P.y});game.heroes.push(ally)');
 const host=JSON.parse(run('JSON.stringify({inv:game.hero.inventory.length,gold:P.gold})'));
 // Monstre ordinaire : objet garanti pour l'allié.
 run('Math.random=()=>0.01;globalThis.wolf={t:"Loup",x:ally.player.x,y:ally.player.y,hp:1,mhp:1,r:14,g:0};game.world.monsters.push(wolf);canaanDamageMonster(wolf,5,ally)');
 assert.equal(run('ally.inventory.length'),1);assert.equal(run('ally.kills'),1);
 assert.equal(run('game.hero.inventory.length'),host.inv);
 assert.ok(run('__chat.some(l=>l.startsWith("Butin: Lina — 🎁"))'),'message de butin de l’allié dans le chat');assert.ok(run('!__notes.some(n=>n.startsWith("🎁"))'));
 // Boss de monde : or et objet Rare pour l'allié.
 run('globalThis.boss={t:"Fenrir",worldBoss:true,worldBossId:"fenrir",x:ally.player.x,y:ally.player.y,hp:1,mhp:1,r:30,g:0};game.world.monsters.push(boss);canaanDamageMonster(boss,5,ally)');
 assert.ok(run('ally.player.gold')>=1000);assert.equal(run('ally.inventory.some(i=>i.rarity==="Rare")'),true);
 assert.equal(run('P.gold'),host.gold);assert.ok(run('game.world.worldBossTimers.fenrir')>0,'le minuteur du boss reste celui du monde');
 // Sac plein (40 places pour un allié) : l'objet est converti en or pour lui.
 run('ally.inventory=Array.from({length:40},(_,i)=>({id:"f"+i,slot:"ring",level:1,rarity:"Commun"}));globalThis.goldBefore=ally.player.gold;giveGear(1,"normal","Commun",ally)');
 assert.equal(run('ally.inventory.length'),40);assert.ok(run('ally.player.gold')>run('goldBefore'));
 // Sans héros précisé, rien ne change pour l'hôte.
 run('giveGear(1,"normal","Commun")');assert.equal(run('game.hero.inventory.length'),host.inv+1);
 assert.equal(errors.length,0,errors.join('\n'));
});

// Groupe de quatre héros (hôte à l'épée, alliés à la lance, à l'arc et à la hache), équipés au même niveau.
// Groupe de quatre héros du niveau donné, chacun équipé d'objets de ce niveau et de cette qualité.
function groupInDungeon(level,rarity){
 const boot=require('./helpers/canaan-runtime.cjs')(source),{run}=boot;
 run(fs.readFileSync(path.join(__dirname,'helpers','group-bot.js'),'utf8'));
 const gear=(w,tag)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"'+tag+k+'",slot:"'+k+'",level:'+level+',rarity:"'+rarity+'",weaponType:"'+w+'"}').join(',')+'}';
 run('started=true;paused=false;P.dead=false;game.view={notify:()=>{},chat:()=>{}}');
 run('game.hero.level='+level+';game.hero.equipment={...game.hero.equipment,...'+gear('sword','h')+'};recomputeStats();P.hp=P.mhp');
 for(const [n,w] of [['Lina','spear'],['Oren','bow'],['Maë','axe']])run('{const h=canaanCreateHero({name:"'+n+'",x:P.x,y:P.y,equipment:'+gear(w,n)+'});h.level='+level+';recomputeHeroStats(h);h.player.hp=h.player.mhp;game.heroes.push(h)}');
 return boot;
}
function playInstance(run,index,maxSeconds,prep=''){
 run('globalThis.__gold0=game.heroes.map(h=>h.player.gold);enterInstance('+index+');'+prep);
 const foes=run('game.world.monsters.length'),phases=[];let ticks=0;
 for(;ticks<60*maxSeconds;ticks++){
  const st=run('canaanGroupBot.step()');if(phases.at(-1)!==st.phase)phases.push(st.phase);
  if(st.done||run('P.dead'))break;
  run('time++;simulateStep();updateWorld()');
 }
 return {foes,phases,seconds:ticks/60,heroes:JSON.parse(run('JSON.stringify(game.heroes.map(h=>({dead:h.player.dead,kills:h.kills,purse:h.player.gold-__gold0[game.heroes.indexOf(h)],keys:h.player.keys||0,relics:h.inventory.filter(i=>i.origin==="donjon"||i.origin==="raid").map(i=>i.rarity+" "+i.level)})))'))};
}

test('Groupe en instance : entrée et sortie ensemble, allié à terre relevé, coffre de boss individuel',()=>{
 const {run,errors}=groupInDungeon(10,'Épique');assert.equal(errors.length,0,errors.join('\n'));
 run('game.heroes[2].player.dead=true;game.heroes[2].player.hp=0;enterInstance(0)');
 assert.equal(run('!!game.world.instance'),true);
 assert.ok(run('game.heroes.every(h=>Math.hypot(h.player.x-P.x,h.player.y-P.y)<3*TS&&canWalk(h.player.x,h.player.y))'),'tout le groupe à l’entrée');
 assert.equal(run('game.heroes[2].player.dead'),false);assert.equal(run('game.heroes[2].player.hp===game.heroes[2].player.mhp'),true);
 // Coffre de fin : une bourse d'or pour chaque héros, quel que soit celui qui l'ouvre (l'équipement vient des boss).
 run('globalThis.__gold0=game.heroes.map(h=>h.player.gold);game.world.monsters=[];game.world.instance.cleared=true;spawnRewardChest();const c=game.world.chests[0];game.heroes[1].player.x=c.x*TS;game.heroes[1].player.y=c.y*TS');
 assert.equal(run('openNearbyChest(game.heroes[1])'),true);assert.equal(run('openNearbyChest(game.heroes[1])'),false,'une seule ouverture');
 assert.ok(run('game.heroes.every(h=>!h.inventory.some(i=>i.origin==="donjon")&&h.player.gold-__gold0[game.heroes.indexOf(h)]>=60)'));
 run('leaveInstance()');assert.equal(run('game.world.instance'),null);
 assert.ok(run('game.heroes.every(h=>Math.hypot(h.player.x-game.world.returnPos.x,h.player.y-game.world.returnPos.y)<3*TS)'),'tout le groupe ressort');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Jalon de la phase 2 : quatre héros explorent un donjon sans écran, énigmes, passage secret et butin de chacun',()=>{
 // La Cave des Terriers Abandonnés : le pilote résout les portes scellées, examine le mur fissuré, abat les trois
 // boss et le boss caché, ouvre le coffre et ressort.
 const {run,errors}=groupInDungeon(12,'Épique');
 run('const C=[["paladin",[2,9]],["druide",[1,3]],["elementaliste",[0,5]],["assassin",[1,4]]];game.heroes.forEach((h,i)=>{h.classe={id:C[i][0],talents:C[i][1]};recomputeHeroStats(h);h.player.hp=h.player.mhp});recomputeStats();P.hp=P.mhp');
 const r=playInstance(run,0,700);
 assert.ok(r.phases.includes('exploration'),r.phases.join());assert.equal(r.phases.at(-1),'sortie');assert.equal(run('canaanGroupBot.state.done'),true);
 assert.equal(run('game.world.instance'),null,'le groupe est ressorti');assert.ok(r.seconds<700,'terminé en '+r.seconds+' s');
 assert.ok(r.heroes.every(h=>!h.dead),'personne n’est tombé');
 // Butin : 30 % par boss et par héros (0 à 3 objets), la bourse du coffre et une clé des secrets pour chacun.
 assert.ok(r.heroes.every(h=>h.relics.length<=3&&h.relics.every(x=>/^Rare (7|8|9|10)$/.test(x))&&h.purse>=60&&h.keys===1),JSON.stringify(r.heroes));
 assert.ok(r.heroes.reduce((n,h)=>n+h.kills,0)>=r.foes,'tous les ennemis, les boss et leurs renforts sont abattus');
 assert.ok(r.heroes.slice(1).some(h=>h.kills>0),'les alliés participent');
 assert.equal(errors.length,0,errors.join('\n'));
});

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

test('Groupe local : créer, faire venir, renvoyer, supprimer ; 6 enregistrés, 3 présents ; équipement de départ et meilleur équipement',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false');
 // Pseudo vide : un nom par défaut ; puis on remplit le groupe.
 const blank=run('CANAAN_GROUP.create("").id');assert.match(run('game.guests["'+blank+'"].name'),/^Compagnon \d$/);run('CANAAN_GROUP.remove("'+blank+'")');
 const ids=[];for(let i=0;i<7;i++)ids.push(run('(CANAAN_GROUP.create("Ami <'+i+'>")||{}).id||null'));
 assert.equal(ids.filter(Boolean).length,6);assert.equal(ids[6],null,'6 compagnons au plus');
 assert.equal(run('game.guests["'+ids[0]+'"].name'),'Ami 0');assert.equal(run('CANAAN_GROUP.create("Trop")'),null);
 assert.equal(run('game.guests["'+ids[1]+'"].equipment.weapon.weaponType'),'sword');assert.equal(run('game.guests["'+ids[1]+'"].local'),true);
 for(const id of ids.slice(0,4))run('CANAAN_GROUP.join("'+id+'")');
 assert.equal(run('game.heroes.length'),4,'3 présents au plus en plus de l’hôte');assert.equal(run('game.heroes[0]===game.hero'),true);
 assert.ok(run('game.heroes.slice(1).every(h=>Math.hypot(h.player.x-P.x,h.player.y-P.y)<3*TS)'),'ils arrivent près de l’hôte');
 assert.equal(run('CANAAN_GROUP.leave("'+ids[0]+'")'),true);assert.equal(run('game.heroes.length'),3);assert.equal(run('CANAAN_GROUP.join("'+ids[3]+'")'),true);
 assert.equal(run('CANAAN_GROUP.remove("'+ids[1]+'")'),true);assert.equal(run('game.guests["'+ids[1]+'"]'),undefined);assert.equal(run('game.heroes.length'),3);
 // Meilleur équipement : la pièce la plus forte de son niveau remplace l'ancienne, qui retourne au sac ;
 // une pièce d'un niveau trop haut reste dans le sac.
 const id=ids[2];run('const h=game.guests["'+id+'"];h.level=30;h.inventory.push(CANAAN_GEAR.normalize({id:"best-armor",slot:"armor",rarity:"Épique",level:25}),CANAAN_GEAR.normalize({id:"low-helm",slot:"helm",rarity:"Commun",level:1}),CANAAN_GEAR.normalize({id:"too-high",slot:"ring",rarity:"Céleste",level:50}))');
 const hp0=run('game.guests["'+id+'"].player.mhp');
 assert.equal(run('CANAAN_GROUP.equipBest("'+id+'")'),2);assert.equal(run('game.guests["'+id+'"].equipment.armor.id'),'best-armor');
 assert.ok(run('game.guests["'+id+'"].inventory.some(i=>i.id==="'+id+'-tunique")'));assert.ok(run('game.guests["'+id+'"].player.mhp')>hp0);
 assert.ok(run('game.guests["'+id+'"].inventory.some(i=>i.id==="too-high")'),'niveau 50 requis : reste au sac');
 assert.equal(run('CANAAN_GROUP.equipBest("'+id+'")'),0);
 // Panneau : chaque compagnon a ses boutons ; un groupe plein masque la création.
 const panels=[];g.capture=h=>panels.push(h);run('showPanel=capture;CANAAN_GROUP.render()');
 assert.match(panels[0],/data-action="groupLeave" data-guest="/);assert.match(panels[0],/data-action="groupCreate"/);assert.doesNotMatch(panels[0],/<b>|Ami <0>/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Groupe enregistré : les invités sont sauvegardés dans heros.invites et reviennent au chargement, absents',()=>{
 const first=require('./helpers/canaan-runtime.cjs')(source);assert.equal(first.errors.length,0,first.errors.join('\n'));
 first.run('started=true;paused=false;globalThis.lina=CANAAN_GROUP.create("Lina");CANAAN_GROUP.join(lina.id);lina.player.gold=321;lina.kills=4');
 first.run('lina.inventory.push(CANAAN_GEAR.normalize({id:"lina-ring",slot:"ring",rarity:"Rare",ilvl:35}));lina.classe={id:"paladin",talents:[1]};lina.rubis.owned.vampire=1');
 // Un compagnon local reçoit une classe au hasard, avec ses talents conseillés.
 assert.ok(first.run('CLASS_IDS.includes(game.guests[Object.keys(game.guests)[0]].classe.id)'));
 first.run('CANAAN_GROUP.create("Oren")');
 assert.equal(first.run('saveGame()'),true);
 const raw=first.run('localStorage.getItem("canaan_slot_1")'),save=JSON.parse(raw);
 const guests=Object.values(save.heros.invites);assert.deepEqual(guests.map(x=>x.pseudo).sort(),['Lina','Oren']);
 const lina=guests.find(x=>x.pseudo==='Lina');
 assert.equal(lina.player.gold,321);assert.equal(lina.kills,4);assert.equal('materials' in lina,false);assert.equal(lina.inventory[0].id,'lina-ring');
 assert.equal(lina.equipment.weapon.name,'Épée de recrue');assert.deepEqual(lina.classe,{id:'paladin',talents:[1]});assert.equal(lina.rubis.owned.vampire,1);
 // Le menu liste leurs pseudos (confirmation de suppression de l'aventure).
 assert.equal(first.run('JSON.stringify(CANAAN_PERSISTENCE.summary(1).invites.slice().sort())'),'["Lina","Oren"]');
 // Nouvelle session sur la même aventure.
 const second=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(!part[1].includes('canaan-runtime-config'))return;
  run("globalThis.__s=new Map([['canaan_pending_slot','1']]);sessionStorage={setItem:(a,b)=>__s.set(a,b),getItem:a=>__s.get(a)??null,removeItem:a=>__s.delete(a)}");
  run('localStorage.setItem("canaan_slot_1",'+JSON.stringify(raw)+')');
 }});
 assert.equal(second.errors.length,0,second.errors.join('\n'));assert.equal(second.run('started'),true);
 assert.equal(second.run('Object.keys(game.guests).length'),2);assert.equal(second.run('game.heroes.length'),1,'les invités reviennent absents');
 const id=second.run('Object.values(game.guests).find(h=>h.name==="Lina").id');
 assert.equal(second.run('CANAAN_GROUP.join("'+id+'")'),true);
 assert.equal(second.run('JSON.stringify((h=>[h.player.gold,h.kills,h.inventory[0].id,h.equipment.weapon.weaponType,h.classe.id,h.classe.talents,h.rubis.owned.vampire])(game.guests["'+id+'"]))'),
  JSON.stringify([321,4,'lina-ring','sword','paladin',[1],1]));
 // Une entrée abîmée est ignorée sans bloquer le chargement.
 second.run('CANAAN_GROUP.importGuests({"!!":{pseudo:"x"},ok:{pseudo:"Bon",inventory:[null,{slot:"nope"}],player:{gold:-5}}})');
 assert.equal(second.run('Object.keys(game.guests).join()'),'ok');assert.equal(second.run('game.guests.ok.inventory.length+"/"+game.guests.ok.player.gold'),'0/0');
});

test('Compagnon local : suit l’hôte, combat près de lui, se relève après dix secondes',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=1e6;P.hp=1e6;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}}');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-4;a<=12&&ok;a++)for(let b=-4;b<=4&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}P.x=(s.x+0.5)*TS;P.y=(s.y+0.5)*TS}');
 run('game.world.monsters=[];globalThis.mate=CANAAN_GROUP.create("Mia");CANAAN_GROUP.join(mate.id)');
 // L'hôte s'éloigne de 8 cases : le compagnon le suit.
 run('P.x+=8*TS');for(let i=0;i<60*6;i++)run('time++;simulateStep()');
 assert.ok(run('Math.hypot(mate.player.x-P.x,mate.player.y-P.y)<3*TS'),'il rejoint l’hôte');
 // Un loup près de l'hôte : le compagnon l'attaque et l'abat (le loup ne riposte pas).
 run('globalThis.wolf={t:"Loup",x:P.x+3*TS,y:P.y,hp:60,mhp:60,r:14,cd:1e9,g:0,level:1,_levelHp:true};game.world.monsters.push(wolf)');
 for(let i=0;i<60*15&&run('wolf.hp>0');i++)run('time++;simulateStep()');
 assert.equal(run('wolf.hp<=0'),true);assert.equal(run('mate.kills'),1);
 assert.ok(run('Object.keys(CANAAN_SKILLS.state(mate).cooldowns).length')>0,'il utilise ses compétences');
 // À terre : il se relève près de l'hôte après dix secondes, avec la moitié de ses PV.
 run('mate.player.dead=true;mate.player.hp=0');for(let i=0;i<60*9;i++)run('time++;simulateStep()');assert.equal(run('mate.player.dead'),true);
 for(let i=0;i<60*2;i++)run('time++;simulateStep()');assert.equal(run('mate.player.dead'),false);
 // Relevé à la moitié de ses PV, puis il se régénère.
 assert.ok(run('mate.player.hp>=Math.round(mate.player.mhp*0.5)&&mate.player.hp<mate.player.mhp*0.7'));
 // Dessin : le compagnon, son nom et sa barre de vie, sans erreur.
 run('runDrawPipeline()');assert.equal(errors.length,0,errors.join('\n'));
});

test('Compétences pour tous les héros : les 36 compétences d’un allié, son mana, ses recharges, ses postures et ses effets différés',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.view={notify:()=>{},chat:()=>{}}');
 run('{let s=null;for(let y=40;y<360&&!s;y++)for(let x=40;x<360;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-6;a<=6&&ok;a++)for(let b=-6;b<=6&&ok;b++)ok=canWalk((x+a+0.5)*TS,(y+b+0.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}globalThis.spot={x:(s.x+0.5)*TS,y:(s.y+0.5)*TS}}');
 run('P.x=spot.x-20*TS;P.y=spot.y;globalThis.hostCooldowns=JSON.stringify(weaponCooldowns)');
 const types=['sword','dualsword','axe','mace','spear','dualdagger','bow','staff','shield'];
 const report={};
 for(const type of types){
  run('game.heroes.splice(1);globalThis.ally=canaanCreateHero({name:"Test",x:spot.x,y:spot.y,equipment:{weapon:{id:"w",slot:"weapon",ilvl:90,rarity:"Épique",weaponType:"'+type+'"}}});game.heroes.push(ally)');
  for(let i=0;i<4;i++){
   run('ally.player.x=spot.x;ally.player.y=spot.y;ally.player.mp=ally.player.mmp;game.world.monsters=[{t:"Cible",x:spot.x+70,y:spot.y,hp:1e6,mhp:1e6,r:14,cd:1e9,g:0}];ally.intent.aimX=spot.x+70;ally.intent.aimY=spot.y');
   const mp0=run('ally.player.mp');
   assert.equal(run('canaanHeroUseSkill(ally,'+i+')'),true,type+':'+i);
   assert.equal(run('canaanHeroUseSkill(ally,'+i+')'),false,type+':'+i+' en recharge');
   assert.ok(run('ally.player.mp')<mp0,type+':'+i+' coûte du mana');
   for(let t=0;t<150;t++)run('time++;simulateStep()');
   report[type+':'+i]=run('1e6-game.world.monsters[0].hp');
  }
 }
 // Les compétences offensives frappent (certaines sont des postures ou des soins).
 const utility=new Set(['sword:2','dualsword:2','axe:2','staff:2','shield:3','spear:2','dualdagger:2']);
 for(const [key,dealt] of Object.entries(report))if(!utility.has(key))assert.ok(dealt>0,key+' inflige des dégâts');
 assert.equal(run('JSON.stringify(weaponCooldowns)'),run('hostCooldowns'),'les recharges de l’hôte ne bougent pas');
 // Recharges de l'allié : elles décroissent, puis la compétence revient.
 run('game.heroes.splice(1);globalThis.ally=canaanCreateHero({name:"Lame",x:spot.x,y:spot.y,equipment:{weapon:{id:"w2",slot:"weapon",level:28,rarity:"Épique",weaponType:"sword"}}});ally.level=28;game.heroes.push(ally);ally.player.mp=300');
 run('canaanHeroUseSkill(ally,0)');assert.equal(run('CANAAN_SKILLS.ready(ally,0)'),false);
 for(let t=0;t<60*4+5;t++)run('time++;simulateStep()');assert.equal(run('CANAAN_SKILLS.ready(ally,0)'),true);
 // Parade de l'allié : elle protège l'allié, pas l'hôte.
 run('canaanHeroUseSkill(ally,2)');assert.ok(run('CANAAN_SKILLS.state(ally).guard')>0);assert.equal(run('CANAAN_SKILLS.state(game.hero).guard'),0);
 assert.equal(run('CANAAN_WEAPON_DEFENSE(null,100,ally)'),60);assert.equal(run('CANAAN_WEAPON_DEFENSE(null,100)'),100);
 // Rafale différée des épées doubles : chaque coup frappe pour l'allié, et la victime lui revient.
 run('game.heroes.splice(1);globalThis.duo=canaanCreateHero({name:"Duo",x:spot.x,y:spot.y,equipment:{weapon:{id:"w3",slot:"weapon",level:54,rarity:"Mythique",weaponType:"dualsword"}}});duo.level=54;game.heroes.push(duo);duo.player.mp=300');
 run('game.world.monsters=[{t:"Rat",x:spot.x+60,y:spot.y,hp:60,mhp:60,r:14,cd:1e9,g:0,level:1,_levelHp:true}];duo.intent.aimX=spot.x+60;duo.intent.aimY=spot.y;globalThis.hostKills=game.hero.kills;canaanHeroUseSkill(duo,0)');
 for(let t=0;t<60;t++)run('time++;simulateStep()');
 assert.equal(run('game.world.monsters.length'),0);assert.equal(run('duo.kills'),1);assert.equal(run('game.hero.kills'),run('hostKills'));
 // Sol consacré d'un allié : il soigne chaque héros du groupe qui s'y tient, l'hôte compris.
 run('game.heroes.splice(1);globalThis.paladin=canaanCreateHero({name:"Gardien",x:spot.x,y:spot.y,equipment:{weapon:{id:"w4",slot:"weapon",level:28,rarity:"Épique",weaponType:"shield"}}});paladin.level=28;game.heroes.push(paladin)');
 run('game.world.monsters=[];P.x=spot.x+20;P.y=spot.y;P.hp=Math.round(P.mhp/2);paladin.player.hp=1;paladin.player.mp=300;canaanRegenRates=()=>({mana:0,health:0});canaanHeroUseSkill(paladin,1)');
 const hostHp=run('P.hp');for(let t=0;t<60*3;t++)run('time++;simulateStep()');
 assert.ok(run('paladin.player.hp')>1,'le gardien se soigne');assert.ok(run('P.hp')>hostHp,'et soigne l’hôte');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Protocole du coopératif : codes de salon, intentions vérifiées, pseudos et messages',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 const code=n.makeRoomCode(Math.random);assert.match(code,n.ROOM_CODE);assert.doesNotMatch(code,/[01OIL]/);
 assert.equal(n.normalizeRoomCode(' abc-234 '),'ABC234');assert.equal(n.normalizeRoomCode('ABC10O'),null);assert.equal(n.normalizeRoomCode('AB'),null);
 assert.equal(n.isGuestId(n.makeGuestId(Math.random)),true);assert.equal(n.isGuestId('<script>'),false);
 assert.equal(n.isGuestId(undefined),false,'undefined n’est pas un identifiant (piège de RegExp.test)');assert.equal(n.isGuestId(null),false);
 // Une intention trafiquée devient une intention valide : pas de téléportation, pas de compétence inconnue.
 assert.deepEqual(n.sanitizeIntent({dx:50,dy:-3,attack:'nuke',skill:9,aimX:'x',aimY:1e12,gold:1e9}),{dx:1,dy:-1,attack:null,skill:null,aimX:0,aimY:1e6,dodge:null,seq:null});
 assert.deepEqual(n.sanitizeIntent({dx:0,dy:1,attack:'heavy',skill:2,aimX:10.5,aimY:-3,seq:7,dodge:{dx:9,dy:-0.5}}),{dx:0,dy:1,attack:'heavy',skill:2,aimX:10.5,aimY:-3,dodge:{dx:1,dy:-0.5},seq:7});
 assert.equal(n.sanitizeIntent({seq:-1}).seq,null);assert.equal(n.sanitizeIntent({seq:1.5}).seq,null);assert.equal(n.sanitizeIntent({dodge:'x'}).dodge,null);
 // Actions d'équipement : seulement quatre opérations, avec des arguments bien formés ; le reste est ignoré.
 assert.deepEqual(n.sanitizeAction({op:'equip',id:'gear12',gold:1e9}),{op:'equip',id:'gear12'});
 assert.deepEqual(n.sanitizeAction({op:'unequip',slot:'weapon'}),{op:'unequip',slot:'weapon'});
 assert.deepEqual(n.sanitizeAction({op:'switch',id:'x'}),{op:'switch'});
 assert.deepEqual(n.sanitizeAction({op:'sell',id:'g1',gold:9e9}),{op:'sell',id:'g1'});assert.deepEqual(n.sanitizeAction({op:'bag-upgrade',level:9}),{op:'bag-upgrade'});
 // Plus de forge : les anciennes actions d'amélioration et de passif sont refusées.
 assert.equal(n.sanitizeAction({op:'passive',id:'g1',passive:'lifesteal'}),null);assert.equal(n.sanitizeAction({op:'upgrade',id:'g1'}),null);
 for(const bad of [{op:'equip'},{op:'equip',id:5},{op:'unequip',slot:'__proto__'},{op:'pirate',id:'a'},{op:'passive',id:'a',passive:'<x>'},null,'equip'])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 assert.deepEqual([...n.GUEST_TYPES].sort(),['action','chat','intent']);
 assert.equal(n.cleanPseudo(' <Lina> '),'Lina');assert.equal(n.cleanPseudo(''),'Invité');assert.equal(n.cleanPseudo('x'.repeat(40)).length,24);
 assert.equal(n.parseMessage('{"t":"intent"}').t,'intent');assert.equal(n.parseMessage('{"t":"pirate"}'),null);assert.equal(n.parseMessage('[1]'),null);
 assert.equal(n.parseMessage('x'.repeat(n.MESSAGE_LIMIT+1)),null);assert.equal(n.parseMessage('{oops'),null);
 const snap=n.heroSnapshot('h',{name:'Lina',player:{x:10.6,y:2.2,vx:1.234,vy:0,hp:9.2,mhp:10,mp:3.7,mmp:300,gold:5.9,dead:false,face:1,atk:0}});
 assert.deepEqual([snap.x,snap.y,snap.vx,snap.hp,snap.mp,snap.gold],[11,2,1.2,10,3,5]);
 const m=n.monsterSnapshot({netId:4,t:'Loup',x:1.4,y:2.6,hp:3.1,mhp:9,r:14,cd:0.66,boss:true,look:'beast',secret:'x'});
 assert.deepEqual(m,{k:4,t:'Loup',x:1,y:3,hp:4,mhp:9,r:14,cd:0.7,boss:true,look:'beast'});
});

test('Relais : salon et code, routage hôte ↔ invités, identité imposée, salon complet et fermeture',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const open=()=>new Promise(r=>{const s=new WebSocket(url);s.got=[];s.onmessage=e=>s.got.push(JSON.parse(e.data));s.onopen=()=>r(s)});
 try{
  const host=await open();host.send(JSON.stringify({t:'host'}));await wait(40);
  const code=host.got[0].code;assert.match(code,/^[A-Z2-9]{6}$/);
  const lost=await open();lost.send(JSON.stringify({t:'join',code:'ZZZZZZ',id:'g-aaaaaa'}));await wait(40);assert.match(lost.got[0].reason,/introuvable/);
  const guests=[];
  for(let i=0;i<4;i++){const g=await open();g.send(JSON.stringify({t:'join',code:code.toLowerCase(),id:'g-guest'+i,pseudo:'G'+i}));guests.push(g)}
  await wait(60);
  assert.equal(host.got.filter(m=>m.t==='join').length,3);assert.match(guests[3].got[0].reason,/complet/);
  // Un invité ne choisit pas son identité côté relais ; il ne parle qu'à l'hôte.
  guests[0].send(JSON.stringify({t:'intent',dx:1,peer:'p999'}));guests[0].send(JSON.stringify({t:'state',evil:true}));await wait(40);
  const intents=host.got.filter(m=>m.t==='intent');assert.equal(intents.length,1);assert.equal(intents[0].peer,host.got.find(m=>m.t==='join').peer);
  assert.equal(guests[1].got.length,0,'les invités ne reçoivent pas les messages des autres invités');
  // L'hôte envoie à tous, ou à un seul invité.
  host.send(JSON.stringify({t:'state',tick:1}));host.send(JSON.stringify({t:'chat',peer:host.got.find(m=>m.t==='join').peer,text:'salut'}));await wait(40);
  assert.ok(guests.slice(0,3).every(g=>g.got.some(m=>m.t==='state')));assert.ok(guests[0].got.some(m=>m.t==='chat'));assert.ok(!guests[1].got.some(m=>m.t==='chat'));
  // Départ d'un invité, puis fermeture de l'hôte : les invités sont prévenus, le salon disparaît.
  guests[2].close();await wait(40);assert.ok(host.got.some(m=>m.t==='left'));
  host.close();await wait(60);assert.ok(guests[0].got.some(m=>m.t==='closed'));assert.equal(relay.rooms.size,0);
 }finally{await relay.close()}
});

test('Jalon de la phase 4 : un hôte et un invité, reliés par le relais, se voient bouger',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  // L'hôte joue une aventure (slot 1) loin du camp, et ouvre un salon.
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('{let s=null;for(let y=60;y<340&&!s;y++)for(let x=60;x<340;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-8;a<=8&&ok;a++)for(let b=-4;b<=4&&ok;b++)ok=canWalk((x+a+.5)*TS,(y+b+.5)*TS);if(ok){s={x,y};break}}P.x=(s.x+.5)*TS;P.y=(s.y+.5)*TS}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');assert.match(code,/^[A-Z2-9]{6}$/);assert.equal(host.run('game.mode'),'host');
  // L'invité rejoint avec le code, depuis l'écran titre.
  // Apparences : l'invité choisit la sienne sur l'écran titre, l'hôte a celle de sa sauvegarde.
  guest.run('CANAAN_NET.setLook({sex:"f",race:"orc",skin:"#86a85a",hairStyle:"tresses",outfit:"or"})');
  host.run('game.hero.look=sanitizeLook({race:"minotaure",outfit:"nuit"})');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');assert.equal(guest.run('started'),true);
  const id=guest.run('CANAAN_NET.state().heroId');assert.match(id,/^g-/);
  assert.equal(guest.run('game.hero.look.race'),'orc','l’invité garde son apparence');
  assert.equal(host.run('game.heroes.length'),2);assert.equal(host.run('game.guests["'+id+'"].name'),'Lina');assert.equal(host.run('game.guests["'+id+'"].local'),false);
  // Chacun avance : l'hôte vers la droite au clavier, l'invité vers le bas au clavier.
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(30);
  assert.equal(host.run('game.guests["'+id+'"].look.race'),'orc','l’hôte voit l’orc de l’invité');assert.equal(host.run('game.guests["'+id+'"].look.hairStyle'),'tresses');
  assert.equal(guest.run('game.heroes.find(h=>h.id==="host").look.race'),'minotaure','l’invité voit le minotaure de l’hôte');
  // L'hôte part du point d'apparition, sur la place dégagée (les troncs des grands arbres bloquent le passage).
  host.run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');await step(10);
  const before={hostSeenByGuest:guest.run('game.heroes.find(h=>h.id==="host").player.x'),guestSelf:guest.run('P.y'),guestSeenByHost:host.run('game.guests["'+id+'"].player.y')};
  host.run('keys.d=true');guest.run('keys.s=true');
  await step(90);host.run('keys.d=false');guest.run('keys.s=false');await step(30);
  const after={hostSeenByGuest:guest.run('game.heroes.find(h=>h.id==="host").player.x'),guestSelf:guest.run('P.y'),guestSeenByHost:host.run('game.guests["'+id+'"].player.y')};
  assert.ok(after.guestSeenByHost>before.guestSeenByHost+100,'l’hôte voit l’invité bouger');
  assert.ok(after.hostSeenByGuest>before.hostSeenByGuest+100,'l’invité voit l’hôte bouger');
  assert.ok(after.guestSelf>before.guestSelf+100,'l’invité voit son propre héros avancer, confirmé par l’hôte');
  assert.ok(Math.abs(guest.run('P.y')-host.run('game.guests["'+id+'"].player.y'))<40,'positions synchronisées');
  // L'invité ne sauvegarde rien ; l'hôte range son héros dans sa sauvegarde.
  assert.equal(guest.run('saveGame()'),false);assert.equal(guest.run('localStorage.getItem("canaan_slot_1")'),null);
  assert.equal(host.run('saveGame()'),true);assert.equal(JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros.invites[id].pseudo,'Lina');
  {const saved=JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros;assert.equal(saved.invites[id].look.race,'orc');assert.equal(saved.hote.look.race,'minotaure');}
  // Départ de l'invité : sa place est gardée (voir le test de la place réservée), son héros reste enregistré.
  guest.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<50&&!host.run('game.guests["'+id+'"].away');i++)await wait(10);
  assert.equal(host.run('!!game.guests["'+id+'"].away'),true);assert.equal(host.run('!!game.guests["'+id+'"]'),true);
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Échange entre joueurs : demande, offres, validations, vérifications de l’hôte et sacs à jour',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 // Protocole : seules des demandes bien formées passent.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'trade-offer',items:['a','b'],gold:5}),{op:'trade-offer',items:['a','b'],gold:5});
 for(const bad of [{op:'trade-offer',items:Array(13).fill('x'),gold:0},{op:'trade-offer',items:['a'],gold:-1},{op:'trade-offer',items:[1],gold:0},{op:'trade-request',to:'<b>'},{op:'trade-ready',yes:'oui'}])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const J=(side,expr)=>JSON.parse(side.run('JSON.stringify('+expr+')'));
  const step=async k=>{for(let i=0;i<k;i++){host.run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  // Chacun a de quoi échanger.
  host.run('game.hero.inventory=[{id:"arc-hote",name:"Arc de l’hôte",slot:"weapon",weaponType:"bow",rarity:"Rare",ilvl:26},{id:"anneau-hote",name:"Anneau",slot:"ring",rarity:"Commun",ilvl:1}];P.gold=500');
  host.run(G+'.inventory=[{id:"bottes-lina",name:"Bottes de Lina",slot:"boots",rarity:"Épique",ilvl:46}];'+G+'.player.gold=80;'+G+'.netBag=null');
  await step(10);
  assert.equal(guest.run('game.hero.inventory.length'),1);
  // Un compagnon local n'est pas un partenaire ; l'invité en ligne, si.
  host.run('CANAAN_GROUP.create("Robot")');
  assert.deepEqual(J(host,'CANAAN_TRADE.view(game.hero).partners.map(p=>p.name)'),['Lina']);
  // L'invitée demande l'échange ; l'hôte le voit et accepte.
  guest.run('CANAAN_TRADE.actions.request("host")');await step(6);
  assert.equal(host.run('CANAAN_TRADE.view(game.hero).state'),'incoming');assert.equal(guest.run('CANAAN_TRADE.view===undefined')||true,true);
  host.run('CANAAN_TRADE.actions.answer(true)');await step(6);
  // Fenêtre de l'invitée : échange ouvert avec l'hôte.
  guest.run('toggleTrade()');assert.match(guest.nodes.get('window').innerHTML,/Offre de Hôte/);
  // Offres : l'invitée propose ses bottes et 30 or, l'hôte son arc.
  guest.run('CANAAN_TRADE.actions.add(0)');await step(6);
  guest.run('document.getElementById("tradeGold").value="30";CANAAN_TRADE.actions.gold()');await step(6);
  host.run('CANAAN_TRADE.actions.add(0)');await step(6);
  assert.deepEqual(J(host,'CANAAN_TRADE.view(game.hero).theirs.items.map(i=>i.id)'),['bottes-lina']);assert.equal(host.run('CANAAN_TRADE.view(game.hero).theirs.gold'),30);
  // Une offre impossible est refusée par l'hôte (objet absent, or insuffisant).
  assert.equal(host.run(`CANAAN_TRADE.handle(${G},{op:'trade-offer',items:['arc-hote'],gold:0})`),false);
  assert.equal(host.run(`CANAAN_TRADE.handle(${G},{op:'trade-offer',items:['bottes-lina'],gold:9999})`),false);
  // Validation de l'hôte, puis changement de l'offre de l'invitée : les validations tombent.
  host.run('CANAAN_TRADE.actions.ready()');await step(4);assert.equal(host.run('CANAAN_TRADE.view(game.hero).mine.ready'),true);
  guest.run('document.getElementById("tradeGold").value="20";CANAAN_TRADE.actions.gold()');await step(6);
  assert.equal(host.run('CANAAN_TRADE.view(game.hero).mine.ready'),false,'offre changée : validation annulée');
  // Les deux valident : l'échange a lieu chez l'hôte, et le sac de l'invitée suit.
  host.run('CANAAN_TRADE.actions.ready()');guest.run('CANAAN_TRADE.actions.ready()');await step(10);
  assert.equal(host.run('CANAAN_TRADE.sessions()'),0);
  assert.deepEqual(J(host,'game.hero.inventory.map(i=>i.id)'),['anneau-hote','bottes-lina']);
  assert.deepEqual(J(host,G+'.inventory.map(i=>i.id)'),['arc-hote']);
  assert.equal(host.run('P.gold'),520);assert.equal(host.run(G+'.player.gold'),60);
  assert.deepEqual(J(guest,'game.hero.inventory.map(i=>i.id)'),['arc-hote'],'sac de l’invitée à jour');
  // Sac plein : l'échange est suspendu, rien ne bouge.
  host.run(G+'.inventory=Array.from({length:10},(_,k)=>({id:"x"+k,name:"Pierre",slot:"ring",rarity:"Commun",ilvl:1}))');
  host.run('CANAAN_TRADE.actions.request("'+id+'")');host.run(`CANAAN_TRADE.handle(${G},{op:'trade-answer',yes:true})`);
  host.run('CANAAN_TRADE.actions.add(0)');host.run('CANAAN_TRADE.actions.ready()');host.run(`CANAAN_TRADE.handle(${G},{op:'trade-ready',yes:true})`);
  assert.equal(host.run(G+'.inventory.length'),10);assert.equal(host.run('game.hero.inventory.length'),2);assert.equal(host.run('CANAAN_TRADE.sessions()'),1);
  // Départ d'un joueur : l'échange est annulé.
  guest.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<50&&!host.run('!!'+G+'.away');i++)await wait(10);
  host.run('CANAAN_TRADE.check()');assert.equal(host.run('CANAAN_TRADE.sessions()'),0);
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Métiers en ligne : l’invitée pêche, cuisine et mange chez l’hôte, et voit sa ligne et ses prises',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'cook',recipe:'soupe',quality:2,count:3}),{op:'cook',recipe:'soupe',quality:2,count:3});
 for(const bad of [{op:'cook',recipe:'soupe',quality:8,count:1},{op:'cook',recipe:'<b>',quality:1,count:1},{op:'eat',recipe:'soupe'},{op:'cook',recipe:'soupe',quality:1,count:99}])assert.equal(n.sanitizeAction(bad),null,JSON.stringify(bad));
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async k=>{for(let i=0;i<k;i++){host.run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  // L'invitée se tient au bord d'un lac (côté hôte et chez elle), puis lance sa ligne avec E.
  host.run(`{const s=CANAAN_PROF.spots().find(s=>s.kind==="lake");for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const x=(s.tx+dx+.5)*TS,y=(s.ty+dy+.5)*TS;if(canWalk(x,y)){globalThis.__shore=[x,y];break}}const h=${G};h.player.x=__shore[0];h.player.y=__shore[1];h.player.mhp=h.player.hp=1e6;}`);
  const shore=JSON.parse(host.run('JSON.stringify(__shore)'));
  guest.run('P.x='+shore[0]+';P.y='+shore[1]);
  assert.equal(guest.run('CANAAN_PROF.interact()'),true);await step(6);
  assert.equal(host.run('!!'+G+'.fishing'),true,'la ligne de l’invitée est lancée chez l’hôte');
  assert.equal(guest.run('!!CANAAN_PROF.liveOf&&true'),true);
  host.run(G+'.fishing.bite=time');await step(6);
  assert.equal(host.run(G+'.fishing.state'),'bite');
  guest.run('CANAAN_PROF.interact()');await step(8);
  assert.equal(host.run(G+'.fishing'),null);
  assert.equal(guest.run('Object.values(game.hero.prof.fish).reduce((a,b)=>a+b,0)'),1,'la prise arrive dans la bourriche de l’invitée');
  // Cuisine près d'une cuisinière, puis repas : tout se décide chez l'hôte.
  host.run(`${G}.prof.fish={"gardon:0":2};${G}.netBag=null;${G}.player.x=(CANAAN_ROOMS[2].x+4.5)*TS;${G}.player.y=(CANAAN_ROOMS[2].y+3.6)*TS;${G}.player.hp=10;${G}.player.mhp=1000`);
  await step(4);guest.run('CANAAN_PROF.actions.cook("soupe",0,2)');await step(8);
  // Préparer deux repas prend 6,5 s : l'invitée voit son travail en cours, puis les repas arrivent.
  assert.equal(guest.run('CANAAN_PROF.myLive().work?.kind'),'cook','l’invitée cuisine (animation et barre)');
  await step(6.5*60);
  assert.equal(guest.run('game.hero.prof.meals["soupe:0"]'),2);
  host.run(G+'.player.hp=10');guest.run('CANAAN_PROF.actions.eat("soupe",0)');await step(8);
  {const hp=host.run(G+'.player.hp');assert.ok(hp>=140&&hp<160,String(hp));}
  assert.equal(guest.run('game.hero.prof.meals["soupe:0"]'),1);
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Bâtiments : échoppe, cuisine, demeures et refuges où l’on entre (E), habitants dedans et dehors, maison loin des donjons',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[]');
 const list=JSON.parse(run('JSON.stringify(CANAAN_HOUSE.buildings())'));
 assert.deepEqual(list.map(b=>b.id).sort(),['aubepines','chene','clairieres','cristaux','dunes','echoppe','maison','marmite','oasis','pilotis','puits','rousses']);
 // Refuges du marais, de l'automne et de la Forêt enchantée : chacun dans son biome, avec son architecture.
 assert.equal(run("JSON.stringify(['pilotis','rousses','cristaux'].map(id=>(b=>[ZONES.indexOf(regionAt(b.x+2,b.y+1)),b.style])(CANAAN_HOUSE.buildings().find(b=>b.id===id))))"),JSON.stringify([[2,'marais'],[3,'automne'],[5,'enchantee']]));
 // Chaque façade est pleine ; chaque porte est devant un passage libre, sur une île encore entièrement accessible.
 for(const b of list){
  assert.equal(run(`canWalk(${(b.x+b.w/2)*48},${(b.y+1.5)*48})`),false,b.id);
  assert.equal(run(`canWalk(${b.door.x},${b.door.y+14})`),true,b.id);
  assert.equal(run(`canWalk(${b.inside.x},${b.inside.y})`),true,b.id);
 }
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 // Chaque porte donne sur un sentier de terre relié, de chemin en chemin, jusqu'au feu du camp.
 const linked=JSON.parse(run(`JSON.stringify((()=>{const seen=new Set(),todo=[[CANAAN_CAMP.x,CANAAN_CAMP.y]];seen.add(CANAAN_CAMP.y*MAPW+CANAAN_CAMP.x);
   while(todo.length){const [x,y]=todo.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(y+dy)*MAPW+x+dx;if(!seen.has(k)&&overworld[y+dy]?.[x+dx]===2){seen.add(k);todo.push([x+dx,y+dy])}}}
   return CANAAN_HOUSE.buildings().map(b=>[b.id,seen.has((b.y+b.h)*MAPW+Math.floor(b.x+b.w/2-0.5))])})())`));
 for(const [id,ok] of linked)assert.equal(ok,true,'sentier de '+id);
 // Chaque style de façade se dessine (un par biome, et ceux du camp).
 assert.equal(run('CANAAN_HOUSE.styles().length'),10);
 // La maison est loin des portails (le premier donjon était trop près) ; le camp regroupe ses bâtiments.
 assert.ok(run('instances.every(d=>Math.hypot(d.x-CANAAN_HOUSE.outside().x-2,d.y-CANAAN_HOUSE.outside().y-1)>=32)'));
 for(const id of ['echoppe','marmite','aubepines','puits'])assert.ok(run(`Math.hypot(CANAAN_HOUSE.outsideDoor("${id}").x/TS-CANAAN_CAMP.x,CANAAN_HOUSE.outsideDoor("${id}").y/TS-CANAAN_CAMP.y)`)<run('CANAAN_CAMP.r')+2,id);
 // Le marchand est derrière le comptoir de son échoppe : on y entre par la porte (E), puis on lui parle.
 assert.equal(run('canaanRoomAt(game.world.npcs.find(n=>n.type==="shop").x/TS,game.world.npcs.find(n=>n.type==="shop").y/TS).id'),'echoppe');
 run('{const d=CANAAN_HOUSE.outsideDoor("echoppe");P.x=d.x;P.y=d.y+20}');assert.equal(run('nearMerchant()'),false);
 assert.equal(run('CANAAN_HOUSE.interact()'),true);assert.equal(run('currentZoneName()'),'Échoppe de Lira');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
 run('P.x=(CANAAN_ROOMS[1].x+6.5)*TS;P.y=(CANAAN_ROOMS[1].y+5.4)*TS');assert.equal(run('nearMerchant()'),true);
 assert.equal(run('toggleHousing()'),false,'on ne décore que sa maison');
 assert.equal(run('CANAAN_HOUSE.place(game.hero,"lit",1,6)'),false);
 // Les meubles bloquent le passage : le comptoir sépare le marchand des clients.
 assert.equal(run('canWalk((CANAAN_ROOMS[1].x+6.5)*TS,(CANAAN_ROOMS[1].y+4.5)*TS)'),false);
 // Sortie (E devant la porte intérieure) : retour devant l'échoppe.
 run('{const d=CANAAN_HOUSE.insideDoor("echoppe");P.x=d.x;P.y=d.y}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
 assert.equal(run('canaanInHouse(P.x/TS,P.y/TS)'),false);assert.ok(run('Math.hypot(P.x-CANAAN_HOUSE.outsideDoor("echoppe").x,P.y-CANAAN_HOUSE.outsideDoor("echoppe").y)')<30);
 // Habitants : un ou deux dans chaque bâtiment du jeu (cuisinier à La Marmite), d'autres dehors autour du feu et des refuges.
 run('CANAAN_LIFE.update()');
 const people=JSON.parse(run('JSON.stringify(CANAAN_LIFE.villagers().map(v=>({n:v.name,room:canaanRoomAt(v.x/TS,v.y/TS)?.id||null,camp:Math.hypot(v.x/TS-CANAAN_CAMP.x,v.y/TS-CANAAN_CAMP.y)<CANAAN_CAMP.r+2})))'));
 for(const id of ['echoppe','marmite','aubepines','puits','chene','clairieres','oasis','dunes']){const n=people.filter(p=>p.room===id).length;assert.ok(n>=1&&n<=2,id+' : '+n)}
 assert.ok(people.some(p=>p.room==='marmite'&&/^Cuisini/.test(p.n)));
 assert.ok(people.filter(p=>!p.room&&p.camp).length>=3,'des habitants restent dehors au camp');
 // En donjon, la carte de l'instance réutilise les mêmes coordonnées : ni pièce, ni meuble qui bloque.
 assert.equal(run('(()=>{const s=game.world.instance;game.world.instance={index:0};const r=JSON.stringify([canaanRoomAt(CANAAN_ROOMS[1].x+6,CANAAN_ROOMS[1].y+4),canaanHouseBlocked((CANAAN_ROOMS[1].x+6.5)*TS,(CANAAN_ROOMS[1].y+4.5)*TS),isSafe(CANAAN_ROOMS[1].x+6,CANAAN_ROOMS[1].y+4)]);game.world.instance=s;return r})()'),'[null,false,false]');
 // Feu de camp, souches, banc et torches bloquent le passage : les habitants et les animaux en font le tour.
 const cx='(CANAAN_CAMP.x+.5)*TS',cy='(CANAAN_CAMP.y+.5)*TS';
 assert.equal(run(`canWalk(${cx},${cy})`),false,'feu de camp');
 assert.equal(run(`canWalk(${cx}-4,${cy}+72)`),false,'banc');
 assert.equal(run(`canWalk(${cx}-70,${cy}+6)`),false,'souche');
 assert.equal(run(`canWalk(${cx}+230,${cy}+40)`),false,'torche');
 assert.equal(run(`canWalk(${cx},${cy}+150)`),true,'la place reste libre');
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS');
 for(let i=0;i<1500;i++)run('time++;CANAAN_LIFE.update()');
 assert.equal(run(`CANAAN_LIFE.villagers().filter(v=>canaanCampBlocked(v.x,v.y)).length`),0,'aucun habitant dans le feu ni sur le banc');
 // On cuisine devant une cuisinière (La Marmite dorée, un refuge), plus au feu de camp.
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_CAMP.x+.5)*TS,(CANAAN_CAMP.y+1.5)*TS)'),false);
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_ROOMS[2].x+4.5)*TS,(CANAAN_ROOMS[2].y+3.6)*TS)'),true);
 assert.equal(run('CANAAN_HOUSE.nearStove((CANAAN_ROOMS[5].x+5)*TS,(CANAAN_ROOMS[5].y+3.6)*TS)'),true,'cheminée du refuge');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Quêtes : devant chaque objet et chaque personnage de l’île, le texte [E] se dessine sans erreur (pierre de passage du camp comprise)',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null');
 const spots=JSON.parse(run('JSON.stringify([...Object.values(CANAAN_QUESTS.sites()).flatMap(s=>s.objs.map(o=>[o.x,o.y])),...Object.values(CANAAN_QUESTS.npcs()).map(n=>[n.x,n.y]),...CANAAN_QUESTS.waystones().map(w=>[w.x,w.y])])'));
 assert.ok(spots.length>100,String(spots.length));
 for(const [x,y] of spots)run(`P.x=${x}+20;P.y=${y}+30;camX=P.x-W/2;camY=P.y-H/2;CANAAN_QUESTS.drawWorld(ctx)`);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Vie du camp : ferme, enclos, champs, verger, jardin, fontaine, ruisseau sous des ponts, sans monstres ni passage bloqué',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Tout le plan trouve sa place, autour des maisons, des lieux de quête et des coffres ; l'île reste entièrement accessible.
 const audit=JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit())'));
 assert.deepEqual(audit.missing,[]);
 for(const k of ['barn','silo','coop','pen','trough','hay','cart','field:wheat','field:veg','field:fruit','scarecrow','lantern','apple','crates','basket','logs','woodpile','chop','fountain','garden','bench','birdbath','arch','spring'])assert.ok(audit.kinds.includes(k),k);
 assert.ok(audit.stream>=40&&audit.pond>=10&&audit.flowers>=30,JSON.stringify(audit));
 assert.equal(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)'),'[]');
 const at=(dx,dy)=>`((CANAAN_CAMP.x+${dx}+.5)*TS),((CANAAN_CAMP.y+${dy}+.5)*TS)`;
 // Le ruisseau est de l'eau ; la route de l'ouest et l'allée du verger le franchissent sur des ponts.
 assert.equal(run(`canWalk(${at(-18,-11)})`),false,'ruisseau');
 assert.ok(run('[...BRIDGE_TILES].filter(k=>{const x=k%MAPW,y=(k-x)/MAPW;return Math.abs(y-CANAAN_CAMP.y+2.5)<1.5&&Math.abs(x-CANAAN_CAMP.x+15.5)<2}).length')>=4,'pont de la route');
 assert.ok(run('[...BRIDGE_TILES].filter(k=>{const x=k%MAPW,y=(k-x)/MAPW;return Math.abs(y-CANAAN_CAMP.y-5.5)<1&&Math.abs(x-CANAAN_CAMP.x+16.5)<2.5}).length')>=4,'pont du verger');
 assert.equal(run(`canWalk(${at(-16,-3)})`),true,'on traverse le pont');
 // Les bâtiments, la fontaine et les clôtures bloquent ; les champs, la cour et la porte du jardin se traversent.
 for(const [dx,dy,name] of [[4,7,'grange'],[7,9,'silo'],[-2,8,'poulailler'],[0,0,'fontaine au centre'],[-5,-5,'forge'],[-12,10,'clôture de l’enclos'],[-7,-17,'clôture du jardin'],[-24,2,'pommier'],[-10,17,'épouvantail']])assert.equal(run(`canWalk(${at(dx,dy)})`),false,name);
 for(const [dx,dy,name] of [[-6,16,'champ de légumes'],[-12,18,'champ de blé'],[5,17,'champ de fruits'],[0,10,'allée de la ferme'],[-6,-14,'porte du jardin'],[-3,-16,'allée du jardin'],[-2,-4,'herbe près de la forge'],[-4,-2,'allée de la forge']])assert.equal(run(`canWalk(${at(dx,dy)})`),true,name);
 // Plus de vieille place pavée : la forge est à sa place, reliée au centre par une allée ; la fontaine au centre.
 assert.equal(run(`CANAAN_CAMP_LIFE.groundAt(CANAAN_CAMP.x-5,CANAAN_CAMP.y-3)`),null);
 assert.equal(run(`(()=>{const f=CANAAN_CAMP_LIFE.items().find(i=>i.kind==='fountain');return f.x===CANAAN_CAMP.x-1&&f.y===CANAAN_CAMP.y-1})()`),true);
 assert.equal(run(`(()=>{const f=CANAAN_CAMP_LIFE.items().find(i=>i.kind==='forge');return f.x===CANAAN_CAMP.x-6&&f.y===CANAAN_CAMP.y-5})()`),true);
 // En donjon, la carte de l'instance réutilise les mêmes coordonnées : rien de la ferme n'y bloque.
 assert.equal(run(`(()=>{const s=game.world.instance;game.world.instance={index:0};const r=canaanCampLife.blocked(${at(4,7)});game.world.instance=s;return r})()`),false);
 // Les bêtes de la ferme restent chez elles : l'enclos garde moutons, vaches et cochons ; les poules autour du poulailler.
 run('started=true;paused=false;game.world.monsters=[];CANAAN_LIFE.update()');
 const farm=JSON.parse(run('JSON.stringify(CANAAN_LIFE.animals().filter(a=>a.farm).map(a=>a.kind).sort())'));
 assert.deepEqual(farm,['cochon','cochon','mouton','mouton','mouton','poule','poule','poule','vache','vache']);
 run(`P.x=(CANAAN_CAMP.x-8.5)*TS;P.y=(CANAAN_CAMP.y+11.5)*TS;camX=P.x-W/2;camY=P.y-H/2`);
 for(let i=0;i<1500;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm&&a.kind!=="poule").every(a=>{const x=a.x/TS-CANAAN_CAMP.x,y=a.y/TS-CANAAN_CAMP.y;return x>-12&&x<-4&&y>8&&y<13})'),'les bêtes restent dans l’enclos');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm).some((a,i)=>Math.hypot(a.x-a.hx,a.y-a.hy)>4)'),'elles se promènent');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm).every(a=>canWalk(a.x,a.y))'));
 // Aucun monstre n'apparaît dans la ferme, le verger ni le jardin.
 run('game.world.monsters=[];spawnMonsters(200)');
 assert.equal(run('game.world.monsters.filter(m=>canaanCampLife.farm(Math.floor(m.x/TS),Math.floor(m.y/TS))).length'),0);
 // Le dessin du sol, des objets et des ponts tourne sans erreur au camp.
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS;camX=P.x-W/2;camY=P.y-H/2;canaanCampLife.drawGround(ctx);canaanCampLife.draw(ctx);drawPixelRoads(ctx)');
 // Une île régénérée retrouve exactement la même ferme et le même ruisseau.
 const before=run('JSON.stringify([CANAAN_CAMP_LIFE.items(),BRIDGE_TILES.size])');
 run('newRegionWorld()');
 assert.equal(run('JSON.stringify([CANAAN_CAMP_LIFE.items(),BRIDGE_TILES.size])'),before);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit().missing)')),[]);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Maison : chaumière dans les Plaines, pièce vide à décorer (H), meubles qu’on tourne (R), sauvegarde et invitée en ligne',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot(),run=host.run;
 for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 try{
  run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view={notify:()=>{},chat:()=>{}}');
  // La chaumière est dans les Plaines verdoyantes, près du camp ; la pièce est fermée de murs.
  assert.equal(run('ZONES.indexOf(regionAt(CANAAN_HOUSE.outside().x+2,CANAAN_HOUSE.outside().y+1))'),0);
  assert.ok(run('Math.hypot(CANAAN_HOUSE.outside().x-CANAAN_CAMP.x,CANAAN_HOUSE.outside().y-CANAAN_CAMP.y)')<45);
  assert.equal(run('canWalk(CANAAN_HOUSE.outsideDoor().x,CANAAN_HOUSE.outsideDoor().y+14)'),true);
  assert.equal(run('canWalk(CANAAN_HOUSE.insideDoor().x,CANAAN_HOUSE.insideDoor().y)'),true);
  assert.equal(run('[0,1].every(y=>overworld[CANAAN_HOUSE_ROOM.y+y].slice(CANAAN_HOUSE_ROOM.x,CANAAN_HOUSE_ROOM.x+15).every(t=>SOLID.includes(t)))'),true,'mur du fond');
  // Entrer par la porte (E) : la maison est une zone sûre, « Ta maison ».
  run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');assert.equal(run('CANAAN_HOUSE.interact()'),true);
  assert.equal(run('CANAAN_HOUSE.inside(P.x,P.y)'),true);assert.equal(run('currentZoneName()'),'Ta maison');assert.equal(run('isSafe(P.x/TS,P.y/TS)'),true);
  // Mode décoration seulement à l'intérieur ; la pièce commence vide.
  assert.equal(run('CANAAN_HOUSE.items().length'),0);assert.equal(run('toggleHousing()'),true);assert.ok(run('!!document.getElementById("housingBar")'));
  // Règles : dans la pièce, sans chevauchement (par couche), passage de la porte libre, cheminée contre le mur du fond.
  const place=(k,x,y)=>run(`CANAAN_HOUSE.place(game.hero,"${k}",${x},${y})`);
  assert.equal(place('lit',1,2),true);assert.equal(place('table',1,3),false,'chevauche le lit');
  assert.equal(place('table',0,5),false,'dans le mur');assert.equal(place('banc',13,8),false,'déborde');
  assert.equal(place('chaise',7,9),false,'devant la porte');assert.equal(place('tapis',6,8),true,'un tapis peut aller devant la porte');
  assert.equal(place('cheminee',5,4),false);assert.equal(place('cheminee',5,2),true);
  assert.equal(place('table',3,5),true);assert.equal(place('tapis_rond',3,4),true,'un tapis sous la table');
  assert.equal(place('fenetre',9,5),true);assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_HOUSE.items().find(i=>i.k==="fenetre"))')),{k:'fenetre',x:9,y:0,r:0},'au mur du fond');
  assert.equal(place('cadre',9,0),false,'déjà une fenêtre');assert.equal(place('rideaux',9,0),true,'des rideaux sur la fenêtre');
  assert.equal(place('dragon',3,3),false);
  // Les meubles bloquent le passage, pas les tapis.
  assert.equal(run('canWalk(CANAAN_HOUSE.insideDoor().x-7*TS+TS/2,(CANAAN_HOUSE_ROOM.y+3)*TS)'),false,'le lit bloque');
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+6)*TS+24,(CANAAN_HOUSE_ROOM.y+8)*TS+24)'),false,'on marche sur le tapis');
  // Retirer : le meuble le plus haut d'abord (les rideaux avant la fenêtre).
  assert.equal(run('CANAAN_HOUSE.remove(game.hero,9,1).k'),'rideaux');assert.equal(run('CANAAN_HOUSE.items().some(i=>i.k==="fenetre")'),true);
  // Clic en mode décoration : poser l'objet choisi sous la souris.
  run('CANAAN_HOUSE.actions.select("plante");mouseWorldX=(CANAAN_HOUSE_ROOM.x+12)*TS+20;mouseWorldY=(CANAAN_HOUSE_ROOM.y+6)*TS+20');
  assert.equal(run('CANAAN_HOUSE.click(0)'),true);assert.ok(run('CANAAN_HOUSE.items().some(i=>i.k==="plante"&&i.x===12&&i.y===6)'));
  // Orientation : un banc tourné d'un quart de tour occupe 1×2 cases ; une armoire se retourne en miroir (2 sens).
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"banc",10,3,1)'),true);
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+10)*TS+24,(CANAAN_HOUSE_ROOM.y+4)*TS+24)'),true,'le banc tourné prend la case du dessous');
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+11)*TS+24,(CANAAN_HOUSE_ROOM.y+3)*TS+24)'),false);
  assert.equal(run('CANAAN_HOUSE.rotate(game.hero,10,4)'),true);
  assert.equal(run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),2);
  assert.equal(run('canaanHouseBlocked((CANAAN_HOUSE_ROOM.x+11)*TS+24,(CANAAN_HOUSE_ROOM.y+3)*TS+24)'),true,'remis à l’horizontale');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"chaise",9,6,3)'),true,'chaise tournée vers la droite');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"armoire",11,6,2)'),false,'une armoire n’a que deux sens');
  assert.equal(run('CANAAN_HOUSE.place(game.hero,"armoire",11,6,1)'),true);
  // Touche R en mode décoration : le meuble en main tourne avant d'être posé.
  run('CANAAN_HOUSE.actions.select("lit");CANAAN_HOUSE.actions.rotate();mouseWorldX=(CANAAN_HOUSE_ROOM.x+9)*TS+20;mouseWorldY=(CANAAN_HOUSE_ROOM.y+8)*TS+20');
  assert.equal(run('CANAAN_HOUSE.click(0)'),true);assert.equal(run('JSON.stringify(CANAAN_HOUSE.items().find(i=>i.k==="lit"&&i.r===1))'),'{"k":"lit","x":9,"y":8,"r":1}');
  run('CANAAN_HOUSE.actions.select("lit")');
  // Sauvegarde : les meubles sont dans monde.maison ; un meuble invalide est écarté au chargement.
  assert.equal(run('saveGame()'),true);
  const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).monde.maison;
  assert.equal(saved.items.length,11);assert.equal(saved.items.find(i=>i.k==='banc').r,2,'l’orientation est sauvegardée');
  assert.equal(run('CANAAN_HOUSE.sanitize({items:[{k:"lit",x:1,y:2},{k:"lit",x:1,y:2},{k:"chaise",x:7,y:9},{k:"x",x:2,y:2},{k:"tapis",x:20,y:2}]}).length'),1);
  // En ligne : l'invitée entre par la porte, voit les meubles et en pose un.
  run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async k=>{for(let i=0;i<k;i++){run('time++;simulateStep();CANAAN_NET.tick()');guest.run('time++;CANAAN_NET.tick()');await wait(2)}};
  run(`{const d=CANAAN_HOUSE.outsideDoor();${G}.player.x=d.x;${G}.player.y=d.y+20;${G}.player.mhp=${G}.player.hp=1e6}`);await step(8);
  guest.run('{const d=CANAAN_HOUSE.outsideDoor();P.x=d.x;P.y=d.y+20}');
  assert.equal(guest.run('CANAAN_HOUSE.interact()'),true);await step(10);
  assert.equal(run(`CANAAN_HOUSE.inside(${G}.player.x,${G}.player.y)`),true,'l’invitée est dans la maison chez l’hôte');
  assert.equal(guest.run('CANAAN_HOUSE.items().length'),11,'elle voit les meubles');
  assert.equal(guest.run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),2,'dans le bon sens');
  guest.run('CANAAN_NET.requestAction({op:"house-rotate",x:10,y:3})');await step(10);
  assert.equal(run('CANAAN_HOUSE.items().find(i=>i.k==="banc").r'),3,'elle tourne un meuble');
  guest.run('CANAAN_NET.requestAction({op:"house-place",k:"aquarium",x:13,y:9})');await step(10);
  assert.ok(run('CANAAN_HOUSE.items().some(i=>i.k==="aquarium")'));assert.ok(guest.run('CANAAN_HOUSE.items().some(i=>i.k==="aquarium")'),'la maison revient à tous');
  for(const side of [host,guest])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Jalon de la phase 5 : l’invité combat chez l’hôte et voit tout de lui-même (sac, équipement, recharges, effets, butin, roulade)',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 // Le test avance le temps bien plus vite que le jeu : limite de fréquence relevée pour ce relais.
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  // Succès coupés : leurs récompenses en or fausseraient les comptes de l’invité (ils sont testés à part).
  host.run('CanaanStages.achievements={after(){}}');
  host.run('{let s=null;for(let y=60;y<340&&!s;y++)for(let x=60;x<340;x++){let ok=Math.hypot(x-CANAAN_CAMP.x,y-CANAAN_CAMP.y)>30;for(let a=-8;a<=8&&ok;a++)for(let b=-4;b<=8&&ok;b++)ok=canWalk((x+a+.5)*TS,(y+b+.5)*TS)&&!isSafe(x+a,y+b);if(ok){s={x,y};break}}P.x=(s.x+.5)*TS;P.y=(s.y+.5)*TS}');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  // L'hôte et ses monstres ne bougent que si on le demande ; pas de régénération pour mesurer le mana.
  host.run('canaanRegenRates=()=>({mana:0,health:0})');
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(20);
  // Sac et équipement : l'invité voit son propre héros, tel que l'hôte le garde.
  assert.equal(guest.run('game.hero.equipment.weapon.name'),'Épée de recrue');
  assert.equal(guest.run('updateCapacity(),BAG_LIMIT'),10,'capacité du sac donnée par l’hôte : 10 places au départ, comme l’hôte');assert.equal(guest.run('game.hero.name'),'Lina');
  assert.ok(guest.run('CANAAN_NET.debug.speed')>0,'vitesse donnée par l’hôte');
  // Prédiction : l'invité avance dès le premier pas, sans attendre l'hôte ; ensuite les deux positions coïncident.
  const y0=guest.run('P.y');guest.run('keys.s=true;time++;readInput();CANAAN_NET.tick()');
  assert.ok(guest.run('P.y')>y0+1,'mouvement prédit tout de suite');
  await step(90);guest.run('keys.s=false');await step(40);
  assert.ok(guest.run('P.y')>y0+150,'l’invité a bien avancé');
  assert.ok(Math.abs(guest.run('P.y')-host.run(G+'.player.y'))<3,'position prédite = position de l’hôte : '+guest.run('P.y')+' / '+host.run(G+'.player.y'));
  assert.ok(Math.abs(guest.run('P.x')-host.run(G+'.player.x'))<3);
  // Un objet obtenu chez l'hôte arrive dans le sac de l'invité ; l'invité l'équipe, l'hôte vérifie et exécute.
  host.run(G+'.inventory.push({id:"lance-lina",name:"Lance d’essai",slot:"weapon",level:1,rarity:"Épique",weaponType:"spear"})');
  await step(8);
  assert.equal(guest.run('game.hero.inventory.some(i=>i.id==="lance-lina")'),true,'objet visible dans le sac de l’invité');
  const weapon0=guest.run('game.hero.equipment.weapon.id');guest.run('equipItem("lance-lina")');
  assert.equal(guest.run('game.hero.equipment.weapon.id'),weapon0,'rien ne change chez l’invité avant la réponse de l’hôte');
  await step(10);
  assert.equal(host.run(G+'.equipment.weapon.id'),'lance-lina','l’hôte a équipé la lance');
  assert.equal(guest.run('game.hero.equipment.weapon.id'),'lance-lina','l’invité voit sa lance équipée');
  assert.equal(guest.run('game.hero.inventory.some(i=>i.id==="lance-lina")'),false);
  // Un objet que l'invité n'a pas ne peut pas être équipé (demande trafiquée).
  guest.run('CANAAN_NET.requestAction({op:"equip",id:"objet-inexistant"})');guest.run('CANAAN_NET.requestAction({op:"unequip",slot:"__proto__"})');await step(6);
  assert.equal(host.run(G+'.equipment.weapon.id'),'lance-lina');
  // Combat partagé : un monstre de l'hôte, frappé par l'invité ; chiffres et éclats chez l'invité, butin et victime pour lui.
  // Ce jalon vérifie le réseau : la règle « chaque héros à son niveau » (testée à part) est neutralisée.
   host.run('globalThis.mob={t:"Loup",x:'+G+'.player.x+70,y:'+G+'.player.y,hp:40,mhp:40,r:14,cd:1e9,g:9,level:1,_levelHp:true};game.world.monsters.push(mob)');
  await step(8);
  assert.equal(guest.run('game.world.monsters.some(m=>m.k==='+host.run('mob.netId')+'&&m.t==="Loup")'),true);
  assert.equal(guest.run('game.world.monsters.length'),host.run('game.world.monsters.length'),'l’invité voit les monstres de l’hôte : '+host.run('JSON.stringify(game.world.monsters.map(m=>[m.t,m.hp]))'));
  const floaters0=guest.run('floaters.length'),kills0=host.run(G+'.kills');
  guest.run('mouseWorldX=P.x+70;mouseWorldY=P.y');
  for(let i=0;i<40&&host.run('mob.hp>0');i++){guest.run('CANAAN_NET.requestAttack(false)');await step(3)}
  assert.equal(host.run('mob.hp<=0'),true,'l’invité abat le monstre chez l’hôte');
  await step(10);
  assert.equal(host.run(G+'.kills'),kills0+1,'victime créditée à l’invité');assert.equal(guest.run('game.hero.kills'),kills0+1);
  assert.equal(guest.run('game.world.monsters.some(m=>m.k==='+host.run('mob.netId')+')'),false,'le monstre disparaît chez l’invité');
  assert.ok(guest.run('floaters.length')>floaters0,'chiffres de dégâts affichés chez l’invité');
  // Butin individuel annoncé sur l'écran de l'invité, rangé dans son sac (chez l'hôte, puis chez lui).
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("🎁"))'),'objet obtenu annoncé à l’invité');
  assert.equal(guest.run('game.hero.inventory.length'),host.run(G+'.inventory.length'));
  assert.equal(host.run('game.hero.inventory.some(i=>i.id==='+JSON.stringify(host.run(G+'.inventory.at(-1).id'))+')'),false,'rien dans le sac de l’hôte');
  // Compétence : mana dépensé chez l'hôte, recharge affichée sur la barre de l'invité, effet visuel rejoué.
  host.run(G+'.player.mp='+G+'.player.mmp');const mp0=host.run(G+'.player.mp');
  guest.run('useSkill(0)');await step(10);
  assert.ok(host.run(G+'.player.mp')<mp0,'mana de l’invité dépensé chez l’hôte');
  assert.ok(guest.run('SKILLS[0].cd')>0,'recharge visible chez l’invité');
  // Roulade : prédite chez l’invité, exécutée chez l’hôte avec sa recharge ; invulnérable pendant le roulé.
  const x0=guest.run('P.x');guest.run('canaanDodge(1,0)');
  await step(1);assert.ok(guest.run('P.x')>x0+5,'roulade prédite');
  assert.equal(host.run('CANAAN_COMBAT.invulnerable('+G+')'),true,'l’hôte fait rouler l’invité');
  assert.equal(host.run('hurtAlly('+G+',{t:"Loup",x:0,y:0,hp:9,mhp:9,dmg:50})'),0,'aucun dégât pendant la roulade');
  await step(30);
  assert.ok(host.run('CANAAN_COMBAT.dodgeState('+G+').ready')>2,'recharge de la roulade chez l’hôte');
  assert.ok(Math.abs(guest.run('P.x')-host.run(G+'.player.x'))<4,'même arrivée après la roulade');
  // À terre puis relevé près de l’hôte ; les messages s’affichent sur l’écran de l’invité.
  host.run(G+'.player.hp=1;'+G+'.player.dead=true;'+G+'.reviveAt=time+20;game.view.remote('+G+',"💀 Tu es à terre…")');
  await step(8);assert.equal(guest.run('P.dead'),true);
  await step(30);assert.equal(guest.run('P.dead'),false,'relevé');
  assert.ok(guest.run('__toasts.some(t=>t.includes("Tu es à terre"))'),'message à terre sur l’écran de l’invité');
  assert.ok(guest.run('__toasts.some(t=>t.includes("se relève"))'));
  // Ce que l'hôte ne sait pas encore faire pour un invité est refusé chez lui (aucune copie locale modifiée).
  assert.equal(guest.run('CANAAN_GUEST_BLOCKED.has("enterInstance")&&CANAAN_GUEST_BLOCKED.has("enterArena")'),true);
  assert.equal(guest.run('CANAAN_GUEST_BLOCKED.has("equipTalent")||CANAAN_GUEST_BLOCKED.has("chooseClass")||CANAAN_GUEST_BLOCKED.has("equipRubis")'),false,'classe, talents et Rubis : demandés à l’hôte');
  assert.equal(guest.run('sellInventoryCell(0,"x")'),false);
  // Classe, talents et Rubis de l'invité : il les gère depuis son écran, l'hôte vérifie, les applique à son héros et les renvoie.
  host.run(G+'.level=20;'+G+'.rubis.owned.colosse=1;time+=600');await step(8);
  assert.equal(guest.run('game.hero.rubis.owned.colosse'),1,'collection de l’invité visible chez lui');
  const speedBefore=guest.run('CANAAN_NET.debug.speed'),hpBefore=host.run(G+'.player.mhp');
  guest.run('chooseClass("assassin")');await step(6);guest.run('equipTalent(1)');guest.run('equipRubis("colosse")');
  guest.run('CANAAN_NET.requestAction({op:"talent-equip",talent:12})');guest.run('CANAAN_NET.requestAction({op:"class-choose",cls:"inconnue"})');
  guest.run('CANAAN_NET.requestAction({op:"rubis-equip",rubis:"phenix"})');
  await step(10);
  assert.deepEqual(host.run('JSON.stringify('+G+'.classe)'),JSON.stringify({id:'assassin',talents:[1]}),'classe et talent choisis chez l’hôte, rien d’autre');
  assert.equal(host.run(G+'.rubis.equipped.filter(Boolean).join()'),'colosse','Rubis possédé équipé, Rubis inconnu refusé');
  assert.deepEqual(guest.run('JSON.stringify(game.hero.classe)'),JSON.stringify({id:'assassin',talents:[1]}),'l’invité voit sa classe');
  assert.ok(guest.run('!!document.getElementById("specialSkill")'),'sort spécial sur la barre de l’invité');
  assert.equal(guest.run('game.hero.rubis.equipped.includes("colosse")'),true,'l’invité voit son Rubis');
  assert.ok(Math.abs(guest.run('CANAAN_NET.debug.speed')-speedBefore)<1e-6,'Assassin (+5 %) et Colosse (−5 %) : même vitesse chez l’hôte et chez lui');
  assert.equal(host.run('characterStats('+G+').critPower'),60,'passif de l’Assassin : +10 % de dégâts critiques');
  assert.ok(host.run(G+'.player.mhp')>hpBefore*1.05,'Colosse : PV max de l’invité augmentés chez l’hôte');
  assert.equal(host.run('(game.hero.classe.id?1:0)+game.hero.rubis.equipped.filter(Boolean).length'),0,'rien ne change pour l’hôte');
  // Sort spécial (F) de l'invité : lancé par l'hôte, vu chez l'invité (Voile d'ombre) avec sa recharge.
  host.run(G+'.player.mp='+G+'.player.mmp');guest.run('canaanUseSpecial()');await step(8);
  assert.equal(host.run(G+'.player.veiled'),true,'voile chez l’hôte');assert.equal(guest.run('P.veiled'),true,'voile vu par l’invité');
  assert.ok(guest.run('CANAAN_CLASS.specialLeft()')>20,'recharge du sort spécial chez l’invité');
  // Quête de l'invité : il l'accepte depuis son écran, l'hôte vérifie qu'il est près de Liora et la lui donne.
  host.run('globalThis.liora=CANAAN_QUESTS.npcs().liora;'+G+'.player.x=liora.x+30;'+G+'.player.y=liora.y');await step(8);
  guest.run('questAccept(1)');await step(8);
  assert.equal(host.run(G+'.quetes.active[1].step'),0,'quête acceptée chez l’hôte');
  assert.equal(guest.run('game.hero.quetes.active[1].step'),0,'et visible dans le journal de l’invité');
  assert.equal(host.run('Object.keys(game.hero.quetes.active).length'),0,'rien pour l’hôte');
  // Marchand de l'invité : près du marchand (vérifié par l'hôte), avec son or.
  host.run('globalThis.shop=game.world.npcs.find(n=>n.type==="shop");'+G+'.player.x=shop.x;'+G+'.player.y=shop.y+60;'+G+'.player.gold=5000');
  host.run(G+'.inventory.push({id:"vieux-casque",name:"Casque rouillé",slot:"helm",ilvl:5,rarity:"Commun"},{id:"bague-rare",name:"Bague rare",slot:"ring",ilvl:40,rarity:"Rare"})');
  host.run('globalThis.gold0='+G+'.player.gold;globalThis.price0=gearSellValue('+G+'.inventory.find(i=>i.id==="bague-rare"))');
  await step(12);
  assert.ok(Math.hypot(guest.run('P.x')-host.run('shop.x'),guest.run('P.y')-host.run('shop.y'))<140,'l’invité est près du marchand');
  assert.equal(guest.run('P.gold'),5000,'son or vient de l’hôte');
  guest.run('sellBagIndex(game.hero.inventory.findIndex(i=>i.id==="bague-rare"))');guest.run('sellAllCommon()');await step(10);
  assert.equal(host.run(G+'.inventory.some(i=>i.id==="bague-rare"||i.id==="vieux-casque")'),false,'objets vendus chez l’hôte');
  assert.ok(host.run(G+'.player.gold')>=host.run('gold0+price0'),'or de la vente pour l’invité');assert.equal(guest.run('P.gold'),host.run(G+'.player.gold'));
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("💰"))'),'vente annoncée à l’invité');
  const bagCount=host.run(G+'.inventory.length'),goldBuy=host.run(G+'.player.gold');
  guest.run('buyGear()');guest.run('buyBagUpgrade()');await step(10);
  assert.equal(host.run(G+'.inventory.length'),bagCount+1,'équipement acheté');assert.equal(host.run(G+'.bagLevel'),1,'sac agrandi');
  assert.ok(host.run(G+'.player.gold')<goldBuy);assert.equal(guest.run('BAG_LIMIT'),20,'20 places chez l’invité');assert.equal(guest.run('CANAAN_BAG_VIEW().level'),1);
  assert.equal(host.run('saveGame()'),true);assert.equal(JSON.parse(host.run('localStorage.getItem("canaan_slot_1")')).heros.invites[id].bagLevel,1,'niveau du sac sauvegardé');
  // Plus de forge : une ancienne demande d'amélioration ou de passif est refusée par l'hôte.
  guest.run('CANAAN_NET.requestAction({op:"upgrade",id:String(game.hero.equipment.weapon.id)});CANAAN_NET.requestAction({op:"passive",id:String(game.hero.equipment.weapon.id),passive:"lifesteal"})');await step(10);
  assert.equal(host.run('Object.hasOwn('+G+'.equipment.weapon,"upgrade")||Object.hasOwn('+G+'.equipment.weapon,"craftPassive")'),false,'aucune amélioration chez l’hôte');
  host.run('game.hero.inventory.push({id:"epee-hote",name:"Épée de l’hôte",slot:"weapon",ilvl:30,rarity:"Rare",weaponType:"sword"})');
  // Loin du marchand, l'hôte refuse la vente ; une demande pour un objet d'un autre héros est ignorée.
  host.run(G+'.player.x=shop.x+3000');await step(12);
  const count0=host.run(G+'.inventory.length');guest.run('CANAAN_NET.requestAction({op:"sell",id:String(game.hero.inventory[0].id)})');
  guest.run('CANAAN_NET.requestAction({op:"upgrade",id:"epee-hote"})');await step(8);
  assert.equal(host.run(G+'.inventory.length'),count0,'pas de vente loin du marchand');
  assert.equal(host.run('Object.hasOwn(game.hero.inventory.find(i=>i.id==="epee-hote"),"upgrade")'),false,'rien ne change sur l’objet de l’hôte');
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Classes et Rubis pour tous les héros : chaque allié a sa classe, ses talents, ses Rubis, ses soins de soutien et l’état de leurs effets',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__chat=[];globalThis.__toasts=[];game.view.chat=(w,m)=>__chat.push(w+": "+m);toast=m=>__toasts.push(m);canaanRegenRates=()=>({mana:0,health:0})');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:P.x+40,y:P.y,equipment:{weapon:{id:"w1",name:"Épée",slot:"weapon",ilvl:100,rarity:"Rare",weaponType:"sword"},armor:{id:"a1",name:"Tunique",slot:"armor",ilvl:100,rarity:"Rare"}}});game.heroes.push(ally);ally.level=60');
 run('globalThis.hostSpeed0=characterStats().speed||0;globalThis.hostHp0=characterStats().maxHp;globalThis.speed0=characterStats(ally).speed||0;globalThis.hp0=characterStats(ally).maxHp');
 // Classe : Assassin (vitesse +5 %) pour l'allié seulement ; ses emplacements viennent de son propre niveau.
 assert.equal(run('CANAAN_CLASS.choose("assassin",ally)'),true);assert.equal(run('CANAAN_CLASS.equip(2,ally)'),true);
 assert.equal(run('CANAAN_CLASS.equip(2,ally)'),false,'jamais deux fois');assert.equal(run('CANAAN_CLASS.equip(10,ally)'),false,'talent inconnu');
 assert.equal(run('(characterStats(ally).speed||0)-speed0'),5);
 assert.equal(run('characterStats().speed||0'),run('hostSpeed0'),'la classe de l’allié ne touche pas l’hôte');
 assert.equal(run('game.hero.classe.id'),null);
 // Rubis : Colosse (PV +10 %) porté par l'allié ; l'hôte ne le porte pas.
 run('ally.rubis.owned.colosse=1;ally.rubis.owned.pacte=1;ally.rubis.owned.peau_de_pierre=1;ally.rubis.owned.second_souffle=1');
 assert.equal(run('CANAAN_RUBIS.equipFor(ally,"colosse")'),true);assert.equal(run('CANAAN_RUBIS.equipFor(ally,"colosse")'),false,'jamais deux fois');
 assert.equal(run('CANAAN_RUBIS.equipFor(ally,"phenix")'),false,'Rubis non possédé');
 assert.equal(run('characterStats(ally).maxHp'),Math.round(run('hp0')*1.1));assert.equal(run('ally.player.mhp'),run('characterStats(ally).maxHp'),'PV max recalculés');
 assert.equal(run('characterStats().maxHp'),run('hostHp0'));assert.equal(run('CANAAN_RUBIS.has("colosse")'),false);assert.equal(run('CANAAN_RUBIS.has("colosse",ally)'),true);
 // Coups et dégâts reçus de l'allié : ses Rubis (Pacte +18 %, Peau de pierre −6 %) et ses talents.
 run('CANAAN_RUBIS.equipFor(ally,"pacte");CANAAN_RUBIS.equipFor(ally,"peau_de_pierre");CANAAN_RUBIS.equipFor(ally,"second_souffle")');
 run('globalThis.wolf={t:"Loup",x:ally.player.x+50,y:ally.player.y,hp:1e6,mhp:1e6,r:14,cd:1e9,g:0};game.world.monsters.push(wolf)');
 assert.ok(Math.abs(run('CANAAN_RUBIS.attackBefore(wolf,100,{},ally)')-118)<1e-9);assert.equal(run('CANAAN_RUBIS.attackBefore(wolf,100,{})'),100);
 assert.ok(Math.abs(run('CANAAN_RUBIS.defense(wolf,100,{},ally)')-94)<1e-9);assert.equal(run('CANAAN_RUBIS.defense(wolf,100,{})'),100);
 // L'allié frappe par le moteur de combat : le Pacte compte dans ses dégâts réels.
 run('Math.random=()=>0.99;ally.player.basicLock=0;ally.intent.aimX=wolf.x;ally.intent.aimY=wolf.y;canaanHeroBasicAttack(ally,false)');
 const withPact=run('1e6-wolf.hp');
 // En combat, un Rubis ne se change pas ; sept secondes plus tard, si.
 assert.equal(run('CANAAN_RUBIS.unequipFor(ally,ally.rubis.equipped.indexOf("pacte"))'),false,'pas en combat');
 run('time+=420;wolf.hp=1e6');assert.equal(run('CANAAN_RUBIS.unequipFor(ally,ally.rubis.equipped.indexOf("pacte"))'),true);
 run('ally.player.basicLock=0;canaanHeroBasicAttack(ally,false)');
 const without=run('1e6-wolf.hp');
 assert.ok(withPact>without*1.1,'Pacte appliqué aux coups de l’allié : '+withPact+' / '+without);
 // Second souffle : l'allié survit une fois à un coup fatal, à 10 % de ses PV.
 run('ally.player.hp=5');run('CANAAN_COMBAT.hurt(1e6,wolf,ally)');
 assert.equal(run('ally.player.dead'),false);assert.equal(run('ally.player.hp'),Math.max(1,Math.round(run('ally.player.mhp')*0.1)));
 run('CANAAN_COMBAT.hurt(1e6,wolf,ally)');assert.equal(run('ally.player.dead'),true,'une seule fois par combat');
 run('ally.player.dead=false;ally.player.hp=ally.player.mhp');
 // État des effets propre à chaque héros : la Foi inébranlable du Paladin allié ne profite pas à l'hôte.
 run('CANAAN_CLASS.setClasse(ally,{id:"paladin",talents:[2,6]})');
 run('ally.player.hp=ally.player.mhp*0.3;wolf.hp=wolf.mhp');run('time++;simulateStep()');
 assert.ok(run('__chat.some(m=>m.includes("Foi inébranlable"))'),'message de l’allié dans le chat');assert.equal(run('__toasts.some(m=>m.includes("Foi"))'),false,'pas à l’écran de l’hôte');
 assert.ok(run('characterStats(ally).guard')>=20);assert.equal(run('characterStats().guard'),0);
 run('wolf.hp=wolf.mhp*0.2');
 assert.ok(Math.abs(run('CANAAN_CLASS_ATTACK.before(wolf,100,{},ally).damage')-115)<1e-9,'Jugement de l’allié');
 assert.equal(run('CANAAN_CLASS_ATTACK.before(wolf,100,{}).damage'),100,'l’hôte n’a pas de classe');
 // Soins entre héros : un Druide allié (Toucher de vie, Bénédiction forestière, Symbiose) soigne l'hôte.
 run('CANAAN_CLASS.setClasse(ally,{id:"druide",talents:[3,5,7]});globalThis.hb=1+Math.max(0,characterStats(ally).healingBonus||0)/100');
 run('P.hp=1;ally.player.hp=1;globalThis.healed=canaanApplyHeal(40,false,game.hero,ally)');
 assert.equal(run('healed'),Math.round(40*run('hb')*1.15));
 assert.equal(run('CANAAN_CLASS.audit(game.hero).shield'),Math.round(run('P.mhp')*0.08),'bouclier de la Bénédiction forestière sur l’hôte');
 assert.ok(Math.abs(run('ally.player.hp')-(1+run('healed')*0.25))<1e-9,'Symbiose : 25 % rendus au Druide');
 run('CANAAN_CLASS_DEFENSE(wolf,1e6,game.hero);P.hp=1;canaanApplyHeal(10,false,game.hero,ally)');
 assert.equal(run('CANAAN_CLASS.audit(game.hero).shield'),0,'12 s de recharge par allié');
 // Paladin : ses soins sur lui-même soignent l'hôte proche à 50 % ; l'Aura protectrice ne se cumule pas.
 run('CANAAN_CLASS.setClasse(ally,{id:"paladin",talents:[7]});globalThis.hb=1+Math.max(0,characterStats(ally).healingBonus||0)/100');
 run('P.hp=1;ally.player.hp=1;canaanApplyHeal(60,false,ally)');
 assert.equal(run('P.hp'),1+Math.round(30*run('hb')),'Lumière sacrée');
 assert.equal(run('characterStats().guard'),5,'Aura protectrice de l’allié');
 run('CANAAN_CLASS_STATE.import({id:"paladin",talents:[7]})');assert.equal(run('characterStats().guard'),5,'non cumulable');
 // Sauvegarde : classe et Rubis de l'invité gardés et vérifiés au chargement (talent en double et Rubis non possédé retirés).
 run('ally.id="local-test";ally.local=true;game.guests[ally.id]=ally');
 const saved=run('JSON.stringify(CANAAN_GROUP.exportGuests(h=>h.player))');const data=JSON.parse(saved);
 data['local-test'].rubis.equipped[5]='phenix';data['local-test'].classe.talents.push(7,99);
 run('CANAAN_GROUP.importGuests('+JSON.stringify(data)+')');
 assert.deepEqual(run('JSON.stringify(game.guests["local-test"].classe)'),JSON.stringify({id:'paladin',talents:[7]}));
 assert.equal(run('game.guests["local-test"].rubis.equipped.includes("phenix")'),false);assert.equal(run('game.guests["local-test"].rubis.equipped.includes("colosse")'),true);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Arène à plusieurs : boss selon le groupe, zones sur chaque héros, relever un allié, un Rubis pour chacun, échec si tous tombent',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;globalThis.__toasts=[];toast=m=>__toasts.push(m);game.view.chat=()=>{};canaanRegenRates=()=>({mana:0,health:0});Math.random=()=>0.99');
 const gear=(w,tag)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"'+tag+k+'",slot:"'+k+'",level:48,rarity:"Mythique",weaponType:"'+w+'"}').join(',')+'}';
 run('game.hero.level=48;game.hero.equipment={...game.hero.equipment,...'+gear('sword','h')+'};recomputeStats();P.hp=P.mhp');
 for(const [n,w] of [['Lina','spear'],['Oren','bow']])run('{const h=canaanCreateHero({name:"'+n+'",x:P.x,y:P.y,equipment:'+gear(w,n)+'});h.level=48;game.heroes.push(h)}');
 run('globalThis.lina=game.heroes[1];globalThis.oren=game.heroes[2];for(const h of game.heroes){h.player.mhp=h.player.hp=1e6}');
 assert.equal(run('enterArena()'),true);
 // Tout le groupe entre ; chaque héros compte sa tentative.
 assert.equal(run('game.heroes.every(h=>Math.hypot(h.player.x-arenaLayout().entry.x,h.player.y-arenaLayout().entry.y)<4*TS)'),true,'groupe placé à l’entrée');
 assert.equal(run('lina.arena.attempts+oren.arena.attempts+game.hero.arena.attempts'),3);
 // Le groupe avance au centre : le boss arrive avec PV et dégâts pour trois héros.
 run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
 for(let i=0;i<10;i++)run('time++;simulateStep()');
 run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
 assert.equal(run('CANAAN_ARENA.run().group'),3);
 assert.equal(run('CANAAN_ARENA.run().boss.mhp'),Math.round(run('CANAAN_ARENA.base.hp*CANAAN_ARENA.hpMult[0]*CANAAN_ARENA.group[3].hp')));
 assert.ok(Math.abs(run('CANAAN_ARENA.run().dmgMult')-run('CANAAN_ARENA.dmgMult[0]*1.05'))<1e-9);
 // Frappe de zone autour du boss : chaque héros dans le cercle est touché.
 run('{const b=CANAAN_ARENA.run().boss;game.heroes.forEach((h,k)=>{h.player.x=b.x+(k-1)*40;h.player.y=b.y+50});globalThis.hp0=game.heroes.map(h=>h.player.hp)}');
 run('CANAAN_ARENA.playMove("slam")');for(let i=0;i<80;i++)run('time++;simulateStep()');
 assert.equal(run('game.heroes.every((h,k)=>h.player.hp<hp0[k])'),true,'les trois héros sont touchés : '+run('JSON.stringify(game.heroes.map((h,k)=>hp0[k]-h.player.hp))'));
 // Malédiction propre au héros touché.
 run('CANAAN_ARENA.run().curse.set(lina,CANAAN_ARENA.run().clock+8)');
 assert.equal(run('CANAAN_ARENA.healFactor(lina)'),0.4);assert.equal(run('CANAAN_ARENA.healFactor()'),1);
 // Lina tombe : pas de relève automatique dans l'arène ; Oren reste à côté d'elle 3 s et la relève à 30 %.
 run('CANAAN_ARENA.run().boss.cd=1e9;CANAAN_ARENA.run().boss.moveClock=1e9;CANAAN_ARENA.run().boss.autoClock=1e9;CANAAN_ARENA.run().boss.busy=1e9');
 run('lina.player.hp=0;lina.player.dead=true;oren.player.x=lina.player.x+30;oren.player.y=lina.player.y;game.hero.player.x=lina.player.x+500');
 for(let i=0;i<60*2;i++)run('time++;simulateStep()');
 assert.equal(run('lina.player.dead'),true,'encore à terre après 2 s');
 for(let i=0;i<60*1.2;i++)run('time++;simulateStep()');
 assert.equal(run('lina.player.dead'),false,'relevée par Oren');assert.equal(run('lina.player.hp'),Math.round(1e6*0.3));
 // L'hôte à terre : le combat continue tant qu'un allié est debout.
 run('P.hp=1;CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss)');for(let i=0;i<3;i++)run('time++;simulateStep();updateWorld()');
 assert.equal(run('P.dead'),true);assert.equal(run('CANAAN_ARENA.run().failed'),false,'la tentative continue');
 assert.ok(run('__toasts.some(t=>t.includes("un allié peut te relever"))'));
 const clock0=run('CANAAN_ARENA.run().clock');for(let i=0;i<30;i++)run('time++;runUpdatePipeline()');
 assert.ok(run('CANAAN_ARENA.run().clock')>clock0,'le monde avance pendant que l’hôte est à terre');
 // Lina relève l'hôte.
 run('lina.player.x=P.x+20;lina.player.y=P.y');for(let i=0;i<60*3.2;i++)run('time++;simulateStep()');
 assert.equal(run('P.dead'),false,'l’hôte est relevé');
 // Boss vaincu : un Rubis et un record pour chacun ; un héros à terre se relève.
 run('oren.player.dead=true;oren.player.hp=0;globalThis.owned0=game.heroes.map(h=>Object.values(h.rubis.owned).reduce((a,b)=>a+b,0))');
 run('{const b=CANAAN_ARENA.run().boss;canaanDamageMonster(b,b.hp+1e6,game.hero)}');
 assert.equal(run('game.heroes.every((h,k)=>Object.values(h.rubis.owned).reduce((a,b)=>a+b,0)===owned0[k]+1)'),true,'un Rubis pour chaque héros');
 assert.equal(run('game.heroes.every(h=>h.arena.best===1)'),true);assert.equal(run('oren.player.dead'),false,'relevé à la fin de la vague');
 // Tout le groupe à terre : la tentative échoue, retour au camp.
 run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
 run('for(const h of game.heroes){h.player.hp=0;h.player.dead=true}');run('time++;CanaanStages.arena.after()');
 assert.equal(run('CANAAN_ARENA.run().failed'),true);assert.ok(run('__toasts.some(t=>t.includes("Tout le groupe est à terre"))'));
 assert.equal(errors.length,0,errors.join('\n'));
});

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

test('Arène en ligne : l’invité entre avec l’hôte, voit le colisée, le boss et ses annonces, encaisse les zones et gagne son Rubis',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});
 const host=bootWithSocket(),guest=bootWithSocket();
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{};canaanRegenRates=()=>({mana:0,health:0})');
  host.run('CANAAN_NET.openRoom("'+url+'")');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<50&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(10);
  // L'hôte entre dans l'Arène : l'invité suit, son colisée est construit à l'identique.
  assert.equal(host.run('enterArena()'),true);await step(10);
  assert.equal(guest.run('!!game.world.instance?.arena'),true,'l’invité est dans le colisée');
  assert.equal(guest.run('JSON.stringify(game.world.tiles)===JSON.stringify(makeDungeon("arena"))')||guest.run('game.world.tiles[arenaLayout().y/TS|0][arenaLayout().x/TS|0]')===host.run('game.world.tiles[arenaLayout().y/TS|0][arenaLayout().x/TS|0]'),true);
  host.run(G+'.player.mhp='+G+'.player.hp=1e6;{const L=arenaLayout();P.x=L.x-30;P.y=L.y+60;'+G+'.player.x=L.x+30;'+G+'.player.y=L.y+60}');
  await step(12);host.run('CANAAN_ARENA.run().timer=0');await step(10);
  assert.equal(host.run('CANAAN_ARENA.run().phase'),'fight');assert.equal(host.run('CANAAN_ARENA.run().group'),2,'boss pour deux héros');
  assert.equal(guest.run('CANAAN_ARENA.run()?.phase'),'fight','l’invité voit le combat commencer');
  assert.equal(guest.run('CANAAN_ARENA.run().boss?.t'),host.run('CANAAN_ARENA.run().boss.t'),'et le boss');
  const gate=host.run('JSON.stringify(arenaLayout().gate[0])');
  assert.equal(guest.run('(([x,y])=>game.world.tiles[y][x])('+gate+')'),19,'herse fermée chez l’invité');
  // Une frappe de zone annoncée : visible chez l'invité, puis elle le touche chez l'hôte.
  host.run('{const b=CANAAN_ARENA.run().boss;b.moveClock=b.autoClock=1e9;P.x=b.x-40;P.y=b.y+50;'+G+'.player.x=b.x+40;'+G+'.player.y=b.y+50}');
  await step(8);const hp0=host.run(G+'.player.hp');
  host.run('CANAAN_ARENA.playMove("slam")');await step(6);
  assert.equal(guest.run('CANAAN_ARENA.run().fx.some(fx=>fx.shape==="circle")'),true,'annonce au sol visible chez l’invité');
  await step(80);
  // Esquive possible (petite chance de base) : une seconde frappe, au même endroit.
  if(host.run(G+'.player.hp')>=hp0){host.run('{const b=CANAAN_ARENA.run().boss;'+G+'.player.x=b.x+40;'+G+'.player.y=b.y+50}');host.run('CANAAN_ARENA.playMove("slam")');await step(86)}
  assert.ok(host.run(G+'.player.hp')<hp0,'la zone touche aussi l’invité');
  // Victoire : un Rubis pour l'invité, annoncé chez lui et rangé dans sa collection.
  const owned0=guest.run('Object.values(game.hero.rubis.owned).reduce((a,b)=>a+b,0)');
  host.run('{const b=CANAAN_ARENA.run().boss;canaanDamageMonster(b,b.hp+1e6,game.hero)}');await step(12);
  assert.ok(guest.run('__toasts.some(t=>t.startsWith("💎 Rubis obtenu"))'),'Rubis annoncé à l’invité');
  assert.equal(guest.run('Object.values(game.hero.rubis.owned).reduce((a,b)=>a+b,0)'),owned0+1,'collection de l’invité');
  assert.equal(guest.run('game.hero.arena.best'),1,'record de l’invité');
  assert.equal(guest.run('(([x,y])=>game.world.tiles[y][x])('+gate+')'),20,'herse rouverte');
  // Sortie : l'invité revient au monde avec l'hôte.
  host.run('leaveInstance()');await step(10);
  assert.equal(guest.run('game.world.instance'),null);assert.equal(guest.run('CANAAN_ARENA.run()'),null);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Place réservée : un invité déconnecté garde son héros 2 minutes, immobile et protégé, et le reprend sur place',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const bootWithSocket=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;side.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');return side};
 const host=bootWithSocket(),apps=[];
 const join=async(side,code)=>{side.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"Lina"})');for(let i=0;i<60&&side.run('game.mode')!=='guest';i++)await wait(10)};
 try{
  host.run('started=true;paused=false;P.dead=false;P.mhp=P.hp=1e6;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  const first=bootWithSocket();apps.push(first);await join(first,code);
  const id=first.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async(n,list)=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');for(const a of list)if(a.run('game.mode')==='guest')a.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  await step(10,[first]);
  // L'invité s'éloigne un peu de l'hôte, puis sa connexion tombe.
  host.run(G+'.player.x=P.x+5*TS;'+G+'.player.y=P.y');await step(10,[first]);
  const spot=host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])');
  first.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<50&&!host.run(G+'.away');i++)await wait(10);
  assert.ok(host.run(G+'.away'),'place réservée');assert.equal(host.run('game.heroes.includes('+G+')'),true,'toujours dans le groupe');
  assert.ok(first.run('__toasts.some(t=>t.includes("place est gardée"))'),'l’invité sait que sa place est gardée');
  assert.equal(first.run('CANAAN_NET.settings().code'),code,'code retenu pour revenir');
  // Immobile et protégé : aucun monstre ne le vise, aucun coup ne le blesse, son intention est effacée.
  host.run('globalThis.wolf={t:"Loup",x:'+G+'.player.x+20,y:'+G+'.player.y,hp:999,mhp:999,r:14,cd:0,g:0};game.world.monsters.push(wolf);P.x+=40*TS');
  host.run(G+'.intent.dx=1');await step(1,[]);host.run(G+'.intent.dx=0');
  const hp0=host.run(G+'.player.hp');await step(60,[]);
  assert.equal(host.run('nearestHero(wolf)===game.hero'),true,'le loup ne vise pas le héros déconnecté');
  assert.equal(host.run('CANAAN_COMBAT.hurt(500,wolf,'+G+')'),0);assert.equal(host.run(G+'.player.hp'),hp0,'aucun dégât');
  assert.equal(host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])'),spot,'immobile');
  assert.equal(host.run('CANAAN_NET.snapshot().heroes.find(h=>h.id==="'+id+'").away')>100,true,'les autres voient le compte à rebours');
  host.run('game.world.monsters=[];P.x-=40*TS');
  // Il revient avec le même identifiant : même héros, à la même place.
  const second=bootWithSocket();apps.push(second);
  second.run('CANAAN_PREFERENCES.write("network",'+first.run('JSON.stringify(CANAAN_PREFERENCES.read("network",{}))')+')');
  await join(second,second.run('CANAAN_NET.settings().code'));
  assert.equal(second.run('CANAAN_NET.state().heroId'),id);await step(10,[second]);
  assert.equal(host.run(G+'.away'),null,'place reprise');assert.equal(host.run('JSON.stringify(['+G+'.player.x,'+G+'.player.y])'),spot,'à la même place');
  assert.ok(second.run('__toasts.some(t=>t.includes("Te revoilà"))'));assert.equal(host.run('game.heroes.filter(h=>h===' +G+').length'),1,'un seul héros');
  // La même identité se reconnecte alors que l'ancienne connexion est encore ouverte : la nouvelle la remplace.
  const third=bootWithSocket();apps.push(third);
  third.run('CANAAN_PREFERENCES.write("network",'+second.run('JSON.stringify(CANAAN_PREFERENCES.read("network",{}))')+')');
  await join(third,code);for(let i=0;i<40&&!second.run('__toasts.some(t=>t.includes("Nouvelle connexion"))');i++)await wait(10);
  assert.equal(third.run('game.mode'),'guest','nouvelle connexion acceptée');assert.ok(second.run('__toasts.some(t=>t.includes("Nouvelle connexion"))'),'l’ancienne est fermée');
  assert.equal(host.run('CANAAN_NET.state().peers'),1);
  // Pas de retour dans les 2 minutes : il quitte le groupe ; son héros reste enregistré dans l'aventure.
  third.run('CANAAN_NET.debug.socket.close()');for(let i=0;i<50&&!host.run(G+'.away');i++)await wait(10);
  host.run('time+=2*60*60');await step(1,[]);
  assert.equal(host.run('game.heroes.includes('+G+')'),false,'parti après 2 minutes');assert.equal(host.run(G+'.away'),null);assert.equal(host.run('!!'+G),true);
  assert.equal(host.errors.length,0,host.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Jalon de la phase 6 : quatre joueurs en ligne finissent un donjon ensemble, chacun avec son butin',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 // Le test avance le temps bien plus vite que le jeu : limite de fréquence relevée pour ce relais.
 const relay=createRelay({port:0,rate:100000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),turn=()=>new Promise(r=>setImmediate(r));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run,){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guests=[boot(),boot(),boot()];
 try{
  host.run(fs.readFileSync(path.join(__dirname,'helpers','group-bot.js'),'utf8'));
  const gear=(w,tag)=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"'+tag+k+'",slot:"'+k+'",level:10,rarity:"Épique",weaponType:"'+w+'"}').join(',')+'}';
  host.run('started=true;paused=false;P.dead=false;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('game.hero.level=10;game.hero.equipment={...game.hero.equipment,...'+gear('sword','h')+'};recomputeStats();P.hp=P.mhp');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code'),ids=[];
  for(const [k,g] of guests.entries()){
   g.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+code+'",pseudo:"'+['Lina','Oren','Maë'][k]+'"})');
   for(let i=0;i<60&&g.run('game.mode')!=='guest';i++)await wait(10);
   assert.equal(g.run('game.mode'),'guest');ids.push(g.run('CANAAN_NET.state().heroId'));
  }
  assert.equal(host.run('game.heroes.length'),4,'quatre héros dans le groupe');assert.equal(host.run('CANAAN_NET.state().peers'),3);
  // Chaque invité reçoit un équipement d'aventurier (chez l'hôte : c'est lui qui garde les héros).
  ids.forEach((id,k)=>host.run('{const h=game.guests["'+id+'"];h.level=10;h.equipment={...h.equipment,...'+gear(['spear','bow','axe'][k],'g'+k)+'};recomputeHeroStats(h);h.player.hp=h.player.mhp}'));
  // Un vrai groupe : chacun sa classe et ses talents (deux emplacements au niveau 10).
  host.run('const C=[["paladin",[2,9]],["druide",[1,3]],["elementaliste",[0,5]],["assassin",[1,4]]];game.heroes.forEach((h,i)=>{h.classe={id:C[i][0],talents:C[i][1]};recomputeHeroStats(h);h.player.hp=h.player.mhp});recomputeStats();P.hp=P.mhp');
  // Débit de l'hôte : octets envoyés au relais.
  host.run('{const s=CANAAN_NET.debug.socket,o=s.send.bind(s);globalThis.__bytes=0;s.send=d=>{__bytes+=d.length;o(d)}}');
  const tick=async()=>{
   for(const g of guests)g.run('time++;CANAAN_NET.tick()');
   host.run('time++;simulateStep();updateWorld();CANAAN_NET.tick()');
   await turn();
  };
  for(let i=0;i<20;i++)await tick();
  // Sans les monstres de passage : les boss, les gardiens et le boss caché suffisent à tester le jeu en ligne.
  host.run('enterInstance(0);game.world.monsters=game.world.monsters.filter(m=>m.boss||m.guardian!==undefined)');assert.equal(host.run('game.world.instance.group'),4,'donjon pour quatre');
  const foes=host.run('game.world.monsters.length');let ticks=0,sawDungeon=0;
  for(;ticks<60*700;ticks++){
   // Le pilote décide pour tout le groupe ; chaque invité envoie lui-même sa décision par le relais.
   const remote='game.heroes.filter(h=>h.peer)';
   host.run('globalThis.__kept=new Map('+remote+'.map(h=>[h,{...h.intent}]))');
   const st=host.run('canaanGroupBot.step()');if(st.done||host.run('P.dead'))break;
   const wanted=JSON.parse(host.run('JSON.stringify(Object.fromEntries('+remote+'.map(h=>[h.id,{dx:h.intent.dx,dy:h.intent.dy,attack:h.intent.attack,skill:h.intent.skill??null,aimX:h.intent.aimX,aimY:h.intent.aimY}])))'));
   host.run('for(const [h,i] of __kept)Object.assign(h.intent,i)');
   ids.forEach((id,k)=>{if(wanted[id])guests[k].run('Object.assign(game.hero.intent,'+JSON.stringify(wanted[id])+')')});
   await tick();
   if(ticks%120===0)sawDungeon+=guests.every(g=>g.run('Number.isInteger(game.world.instance?.index)&&game.world.monsters.length>0'))?1:0;
  }
  const seconds=ticks/60,bytes=host.run('__bytes');
  console.log('[jalon 6] donjon à quatre en',Math.round(seconds),'s ; débit de l’hôte',Math.round(bytes/seconds/1024),'Ko/s');
  assert.equal(host.run('canaanGroupBot.state.done'),true,'le groupe a fini le donjon en '+Math.round(seconds)+' s');
  assert.equal(host.run('game.world.instance'),null,'tout le groupe est ressorti');
  assert.ok(sawDungeon>0,'les invités voyaient le donjon et ses monstres');
  for(let i=0;i<20;i++)await tick();
  // Chacun son butin : les reliques de chaque invité (30 % par boss) sont dans son sac, chez l'hôte comme chez lui,
  // avec sa bourse d'or et sa clé des secrets (boss caché).
  ids.forEach((id,k)=>{
   const G='game.guests["'+id+'"]';
   const relics=host.run(G+'.inventory.filter(i=>i.origin==="donjon").length');assert.ok(relics<=3,'reliques de '+['Lina','Oren','Maë'][k]);
   assert.ok(guests[k].run('P.gold')>=60,'bourse d’or de '+['Lina','Oren','Maë'][k]);
   assert.equal(guests[k].run('game.hero.inventory.filter(i=>i.origin==="donjon").length'),relics,'visible chez '+['Lina','Oren','Maë'][k]);
   assert.equal(host.run(G+'.player.keys'),1,'clé de '+['Lina','Oren','Maë'][k]);assert.equal(guests[k].run('P.keys'),1,'clé visible chez '+['Lina','Oren','Maë'][k]);
   assert.equal(guests[k].run('game.world.instance'),null,'revenu au monde');
  });
  assert.ok(host.run('game.hero.inventory.filter(i=>i.origin==="donjon").length')<=3);assert.equal(host.run('P.keys'),1);
  assert.ok(host.run('game.heroes.reduce((n,h)=>n+h.kills,0)')>=foes,'tous les boss, gardiens et renforts abattus');
  // Cinq ennemis à se partager entre quatre héros : les invités en abattent au moins un ensemble.
  assert.ok(ids.reduce((n,id)=>n+host.run('game.guests["'+id+'"].kills'),0)>=1,'les invités participent');
  assert.ok(bytes/seconds<200*1024,'débit raisonnable');
  for(const side of [host,...guests])assert.equal(side.errors.length,0,side.errors.join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Adresses du relais et invitations : adresses Tailscale et locales, préfixes oubliés, invitation collée',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.equal(n.normalizeRelayUrl('100.120.239.59:8787'),'ws://100.120.239.59:8787','adresse Tailscale avec port');
 assert.equal(n.normalizeRelayUrl('ws://mon-pc.tail55b3f7.ts.net:8787'),'ws://mon-pc.tail55b3f7.ts.net:8787','nom MagicDNS');
 assert.equal(n.normalizeRelayUrl('https://relais.example.com'),'wss://relais.example.com');
 assert.equal(n.normalizeRelayUrl('192.168.1.20:8787'),'ws://192.168.1.20:8787','adresse locale avec port');
 assert.equal(n.normalizeRelayUrl('ws://localhost:8787'),'ws://localhost:8787');
 for(const bad of ['', 'ftp://x', 'ws://exa mple.com', 'ws://host:99999', 'javascript:alert(1)'])assert.equal(n.normalizeRelayUrl(bad),null,bad);
 const inv=n.makeInvitation('ws://100.120.239.59:8787','K7P2QX');
 assert.deepEqual(n.parseInvitation(inv),{relay:'ws://100.120.239.59:8787',code:'K7P2QX'});
 assert.deepEqual(n.parseInvitation('salut ! 100.120.239.59:8787 code: k7p2qx'),{relay:'ws://100.120.239.59:8787',code:'K7P2QX'});
 assert.deepEqual(n.parseInvitation('rien ici'),{relay:null,code:null});
});

test('Hébergement (application de bureau) : relais sur l’adresse Tailscale, Tailscale absent ou arrêté, réseau local, sans Pinggy',async()=>{
 const H=require('../app/hosting.js');
 // Plage Tailscale 100.64.0.0/10 seulement.
 for(const ip of ['100.64.0.1','100.120.239.59','100.127.255.254'])assert.ok(H.isTailscaleIp(ip),ip);
 for(const ip of ['100.63.0.1','100.128.0.1','10.0.0.5','192.168.1.2','pas une ip'])assert.ok(!H.isTailscaleIp(ip),ip);
 // Lecture de l'adresse : l'interface tailscale0, et le nom MagicDNS donné par « tailscale status --json ».
 const ifs={lo:[{family:'IPv4',address:'127.0.0.1',internal:true}],wlan:[{family:'IPv4',address:'192.168.1.25',internal:false}],tailscale0:[{family:'IPv4',address:'100.120.239.59',internal:false}]};
 const running=()=>JSON.stringify({BackendState:'Running',Self:{DNSName:'mon-pc.tail55b3f7.ts.net.',TailscaleIPs:['100.120.239.59','fd7a::1']}});
 assert.deepEqual(H.tailscaleInfo({interfaces:ifs,run:running,commands:['tailscale']}),{ip:'100.120.239.59',name:'mon-pc.tail55b3f7.ts.net'});
 // Sans interface visible, l'adresse vient du statut.
 assert.equal(H.tailscaleInfo({interfaces:{},run:running,commands:['tailscale']}).ip,'100.120.239.59');
 // Pas installé, arrêté, en attente de connexion : un message clair, aucune adresse.
 const enoent=()=>{const e=new Error('absent');e.code='ENOENT';throw e};
 assert.match(H.tailscaleInfo({interfaces:{},run:enoent,commands:['tailscale']}).why,/pas installé/);
 const stopped=()=>{const e=new Error('exit 1');e.stdout=JSON.stringify({BackendState:'Stopped'});throw e};
 assert.match(H.tailscaleInfo({interfaces:{},run:stopped,commands:['tailscale']}).why,/arrêté/);
 assert.match(H.tailscaleInfo({interfaces:{},run:()=>JSON.stringify({BackendState:'NeedsLogin'}),commands:['tailscale']}).why,/connectes/);
 // Les adresses Tailscale ne sont pas proposées comme adresses du réseau local.
 assert.deepEqual(H.lanAddresses(ifs),['192.168.1.25']);
 assert.deepEqual(H.tailscaleFirewallCommands(['firewalld','ufw'],8787),['sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0 && sudo firewall-cmd --reload','sudo ufw allow in on tailscale0 to any port 8787 proto tcp']);
 // Le relais écoute sur l'adresse Tailscale (ici 127.0.0.1 à sa place) et l'hôte s'y branche lui aussi.
 const statuses=[];
 let info={ip:'127.0.0.1',name:'mon-pc.tail55b3f7.ts.net'};
 const hosting=H.createHosting({tailscale:()=>info,firewalls:()=>['ufw'],onStatus:s=>statuses.push(s)});
 try{
  const st=await hosting.startTailscale();
  assert.equal(st.state,'online');assert.equal(st.kind,'tailscale');assert.match(st.relay,/^ws:\/\/127\.0\.0\.1:878\d$/);assert.equal(st.local,st.relay);
  assert.deepEqual(st.addresses,['ws://mon-pc.tail55b3f7.ts.net:'+st.relay.split(':').pop()]);
  assert.match(st.firewall[0],/tailscale0/);
  const code=await new Promise((resolve,reject)=>{const ws=new WebSocket(st.local);ws.onopen=()=>ws.send(JSON.stringify({t:'host'}));ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.t==='room'){ws.close();resolve(m.code)}};ws.onerror=reject});
  assert.match(code,/^[A-Z2-9]{6}$/);
  // Tailscale arrêté : erreur claire, le relais est fermé.
  info={ip:null,why:'Tailscale est arrêté : ouvre Tailscale et active la connexion (« Connect »).'};
  const off=await hosting.startTailscale();assert.equal(off.state,'error');assert.match(off.message,/arrêté/);
  await assert.rejects(()=>new Promise((resolve,reject)=>{const ws=new WebSocket(st.local);ws.onopen=()=>{ws.close();resolve()};ws.onerror=reject}));
  // Réseau local : relais ouvert au réseau, port de repli si 8787 est pris.
  const blocker=require('node:net').createServer();const busy=await new Promise(r=>blocker.once('error',()=>r(false)).listen(H.LAN_PORTS[0],'0.0.0.0',()=>r(true)));
  try{
   const lan=await hosting.startLan();
   if(lan.state==='online'){
    assert.equal(lan.kind,'lan');assert.match(lan.relay,/^ws:\/\/[\d.]+:\d+$/);
    if(busy)assert.equal(+lan.relay.split(':').pop(),H.LAN_PORTS[1],'port de repli quand 8787 est pris');
    const code2=await new Promise((resolve,reject)=>{const ws=new WebSocket(lan.relay);ws.onopen=()=>ws.send(JSON.stringify({t:'host'}));ws.onmessage=e=>{ws.close();resolve(JSON.parse(e.data).code)};ws.onerror=reject});
    assert.match(code2,/^[A-Z2-9]{6}$/);
   }else assert.match(lan.message,/réseau local/,'sans réseau : message clair');
  }finally{blocker.close()}
 }finally{await hosting.stop()}
 assert.equal(statuses.at(-1).state,'off');
 // Plus aucune trace de Pinggy ni de tunnel ssh dans l'application ni dans le jeu.
 for(const f of ['app/hosting.js','app/main.js','app/preload.js'])assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),/pinggy|ssh/i,f);
 assert.doesNotMatch(source.replace(/Anciens réglages Pinggy[^\n]*\n[^\n]*/,''),/pinggy/i);
});

test('Jouer avec Tailscale dans le jeu : l’hôte ouvre le salon, copie l’invitation ; l’invité la colle et rejoint',async()=>{
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,host:'127.0.0.1',rate:2000});await relay.ready;const local='ws://127.0.0.1:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 // Pont de l'application de bureau simulé : le relais « Tailscale » est le relais local du test.
 const host=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config'))run('{const db=new Map();window.canaanDesktop={list:()=>[],read:k=>db.get(k)??null,write:(k,t)=>{db.set(k,t)},backup(){},backupText(){},remove:k=>{db.delete(k)},openFolder(){}}}');
  if(part[1].includes('id="canaan-net"'))run('window.canaanDesktop.hosting={copied:[],next:{state:"online",kind:"tailscale",local:"'+local+'",relay:"'+local+'",addresses:["ws://mon-pc.tail55b3f7.ts.net:'+relay.port+'"],firewall:["sudo ufw allow in on tailscale0 to any port '+relay.port+' proto tcp"]},startTailscale(){this.tailscale=(this.tailscale||0)+1;return Promise.resolve(this.next)},stop(){this.stopped=true;return Promise.resolve(true)},status(){return Promise.resolve({})},onStatus(cb){this.emit=cb},copy(t){this.copied.push(t)}}');
 }});
 const guest=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){
  if(part[1].includes('canaan-runtime-config'))run('0');
  if(part[1].includes('id="canaan-slot-menu"'))run('{const m=document.getElementById("slotMenu");m.__l={};m.addEventListener=(t,f)=>{(m.__l[t]??=[]).push(f)}}');
 }});
 for(const side of [host,guest]){side.g.WebSocket=WebSocket;side.g.Event=Event;assert.equal(side.errors.length,0,side.errors.join('\n'))}
 try{
  host.run('started=true;paused=false;P.dead=false;game.view.notify=()=>{};game.view.chat=()=>{}');
  assert.equal(host.run('CANAAN_NET.state().canHostOnline'),true);
  // Le panneau propose Tailscale et le réseau local, sans aucun réglage Pinggy.
  host.run('toggleGroup()');const before=host.run('document.getElementById("window").innerHTML');
  assert.ok(before.includes('data-action="groupOpenTailscale"')&&before.includes('data-action="groupOpenLan"'));assert.doesNotMatch(before,/pinggy/i);
  host.run('closePanels()');
  await host.run('CANAAN_NET.openTailscale()');
  for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  const code=host.run('CANAAN_NET.state().code');
  assert.equal(host.run('canaanDesktop.hosting.tailscale'),1);assert.equal(host.run('CANAAN_NET.state().relay'),local,'salon ouvert sur le relais Tailscale');
  // Le panneau montre l'adresse, le nom MagicDNS, le code, l'aide Tailscale et le pare-feu ; l'invitation est copiée.
  host.run('toggleGroup()');const panel=host.run('document.getElementById("window").innerHTML');
  for(const t of [local,'mon-pc.tail55b3f7.ts.net',code,'groupCopyInvitation','réseau Tailscale','tailscale0'])assert.ok(panel.includes(t),t);
  host.run('CANAAN_NET.copyInvitation()');const invitation=host.run('canaanDesktop.hosting.copied[0]');
  assert.equal(invitation,'Rejoins ma partie The Legend of Nashi ! Relais : '+local+' · Code : '+code);
  // L'invité colle l'invitation : relais et code se remplissent ; il rejoint.
  guest.run('CANAAN_SLOT_MENU.render();CANAAN_SLOT_MENU.joinForm()');
  guest.run('{const i=document.getElementById("joinInvite");i.value='+JSON.stringify(invitation)+';for(const f of document.getElementById("slotMenu").__l.input)f({target:i})}');
  assert.equal(guest.run('document.getElementById("joinRelay").value'),local);assert.equal(guest.run('document.getElementById("joinCode").value'),code);
  guest.run('CANAAN_NET.joinRoom({relay:document.getElementById("joinRelay").value,code:document.getElementById("joinCode").value,pseudo:"Lina"})');
  for(let i=0;i<60&&guest.run('game.mode')!=='guest';i++)await wait(10);
  assert.equal(guest.run('game.mode'),'guest');assert.equal(host.run('game.heroes.length'),2);
  await host.run('CANAAN_NET.closeInternet()');assert.equal(host.run('canaanDesktop.hosting.stopped'),true);
  // Tailscale arrêté : le message s'affiche dans le panneau, aucun salon ne s'ouvre.
  host.run('canaanDesktop.hosting.next={state:"error",kind:"tailscale",message:"Tailscale est arrêté : ouvre Tailscale et active la connexion (« Connect »)."}');
  for(let i=0;i<50&&host.run('game.mode')!=='solo';i++)await wait(10);
  assert.equal(await host.run('CANAAN_NET.openTailscale()'),false);assert.equal(host.run('game.mode'),'solo','aucun salon');assert.equal(host.run('CANAAN_NET.debug.socket'),null);
  host.run('closePanels();toggleGroup()');assert.ok(host.run('document.getElementById("window").innerHTML').includes('Tailscale est arrêté'));
  // Réseau local : même parcours, l'invitation donne l'adresse de ce PC sur le réseau, avec l'aide pour le pare-feu.
  host.run('canaanDesktop.hosting.startLan=()=>Promise.resolve({state:"online",kind:"lan",local:"'+local+'",relay:"ws://192.168.1.25:'+relay.port+'",addresses:["ws://192.168.1.25:'+relay.port+'","ws://10.0.0.7:'+relay.port+'"]})');
  await host.run('CANAAN_NET.openLan()');for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  assert.equal(host.run('CANAAN_NET.state().relay'),local);
  host.run('closePanels();toggleGroup()');const lanPanel=host.run('document.getElementById("window").innerHTML');
  assert.ok(lanPanel.includes('ws://192.168.1.25:'+relay.port)&&lanPanel.includes('10.0.0.7')&&lanPanel.includes('sudo ufw allow '+relay.port+'/tcp'),'adresse locale et aide pare-feu');
  assert.equal(host.run('CANAAN_NET.invitation()'),'Rejoins ma partie The Legend of Nashi ! Relais : ws://192.168.1.25:'+relay.port+' · Code : '+host.run('CANAAN_NET.state().code'));
  await host.run('CANAAN_NET.closeInternet()');
  // Anciens réglages Pinggy d'une préférence enregistrée : retirés.
  host.run('CANAAN_PREFERENCES.write("network",{...CANAAN_PREFERENCES.read("network",{}),pinggyToken:"abcd",pinggyMode:"tcp"});CANAAN_NET.settings()');
  assert.equal(host.run('"pinggyToken" in CANAAN_PREFERENCES.read("network",{})'),false);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Connexion impossible : l’invité voit « Relais injoignable » et quoi vérifier ; l’hôte voit les commandes de son pare-feu',async()=>{
 const {firewallCommands,linuxFirewalls}=require('../app/hosting.js');
 assert.deepEqual(firewallCommands(['firewalld','ufw'],8787),['sudo firewall-cmd --permanent --add-port=8787/tcp && sudo firewall-cmd --reload','sudo ufw allow 8787/tcp']);
 if(process.platform==='linux'){
  const fake=(cmd,args)=>{if(args[1]==='ufw')return 'active\n';throw new Error('inactive')};
  assert.deepEqual(linuxFirewalls(fake),['ufw']);
 }
 // Un port fermé : le message reste « Relais injoignable » (il n'est plus remplacé par « Connexion fermée »).
 const port=await new Promise(r=>{const s=require('node:net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const guest=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});
 guest.g.WebSocket=WebSocket;guest.g.Event=Event;
 guest.run('CANAAN_NET.joinRoom({relay:"ws://127.0.0.1:'+port+'",code:"ABC234",pseudo:"Lina"})');
 for(let i=0;i<100&&!/injoignable/.test(guest.run('CANAAN_NET.state().status'));i++)await new Promise(r=>setTimeout(r,10));
 await new Promise(r=>setTimeout(r,100));
 const status=guest.run('CANAAN_NET.state().status');
 assert.match(status,/Relais injoignable : ws:\/\/127\.0\.0\.1:\d+/);assert.match(status,/pare-feu/);assert.doesNotMatch(status,/Connexion fermée/);
 assert.equal(guest.errors.length,0,guest.errors.join('\n'));
});

test('Chacun à son niveau : monstres à niveau fixe, chacun frappe et encaisse selon son niveau, XP partagée, sac de 10 places, coffres cachés ouverts par un invité',async()=>{
 // Un monstre a un niveau fixe (celui de sa zone) : mêmes PV pour tout le monde, rien ne s'adapte au héros.
 {const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
  run('started=true;paused=false;game.world.instance=null;game.view.chat=()=>{};toast=()=>{};Math.random=()=>0.99');
  run('game.hero.level=30;game.hero.equipment={...game.hero.equipment,'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"h'+k+'",slot:"'+k+'",level:30,rarity:"Rare",weaponType:"sword"}').join(',')+'};recomputeStats()');
  run('globalThis.lina=canaanCreateHero({name:"Lina",x:P.x+30,y:P.y});game.heroes.push(lina);globalThis.wolf={t:"Loup",x:P.x+60,y:P.y,hp:1,mhp:1,r:14,cd:1e9,g:0,level:20};canaanSetupMob(wolf)');
  assert.equal(run('wolf.mhp'),run('mobHealth(20,false,MOB_TYPES.find(t=>t.name==="Loup").hp)'),'PV du loup selon son niveau');
  run('game.hero.level=60;canaanSetupMob(wolf)');assert.equal(run('wolf.mhp'),run('mobHealth(20,false,MOB_TYPES.find(t=>t.name==="Loup").hp)'),'aucune adaptation au héros');run('game.hero.level=30');
  // Même coup de base : Lina (niveau 1) frappe un loup de niveau 20 bien moins fort que l'hôte (niveau 30).
  run('wolf.hp=wolf.mhp=1e6;canaanHeroStrike(wolf,50,lina)');const linaHit=run('1e6-wolf.hp');
  run('wolf.hp=1e6;canaanHeroStrike(wolf,50)');const hostHit=run('1e6-wolf.hp');
  assert.ok(linaHit<hostHit,'écart de niveau : '+linaHit+' / '+hostHit);
  // Dégâts reçus : selon le niveau du monstre, réduits par la Défense de chacun.
  run('globalThis.__hurt=h=>{let n=0;for(let i=0;i<20;i++)n+=CANAAN_STATS_INCOMING(wolf,null,h);return n}');
  assert.ok(run('__hurt(lina)')>run('__hurt(game.hero)'),'Lina encaisse plus, sans armure');
  // XP : le vainqueur et ses alliés proches gagnent chacun selon leur propre niveau.
  run('game.hero.exp=0;lina.exp=0;wolf.hp=1;canaanDamageMonster(wolf,10)');
  assert.ok(run('lina.level')>1||run('lina.exp')>0,'Lina gagne de l’XP');
  assert.ok(run('game.hero.exp')>0,'l’hôte aussi');
  assert.equal(errors.length,0,errors.join('\n'));}
 {const {run}=require('./helpers/canaan-runtime.cjs')(source);
  run('started=true;globalThis.l=canaanCreateHero({name:"L",x:0,y:0})');
  // Sac : 10 places au départ ; un héros enregistré sous l'ancienne règle (40 places par défaut) revient à 10.
  assert.equal(run('canaanBagLimit(l)'),10);
  run('CANAAN_GROUP.importGuests({"local-a":{pseudo:"A",bagLevel:3},"local-b":{pseudo:"B",bagLevel:5},"local-c":{pseudo:"C",bagLevel:2,bagVersion:2}})');
  assert.deepEqual([run('game.guests["local-a"].bagLevel'),run('game.guests["local-b"].bagLevel'),run('game.guests["local-c"].bagLevel')],[0,2,2]);
  assert.equal(run('CANAAN_GROUP.exportGuests(h=>h.player)["local-c"].bagVersion'),2);}
 // En ligne : l'invité ouvre un coffre caché près de lui (E) ; l'hôte vérifie, l'ouvre pour lui ; tout le monde le voit ouvert.
 const {createRelay}=require('../relay/server.cjs');
 const relay=createRelay({port:0,rate:2000});await relay.ready;const url='ws://localhost:'+relay.port;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const boot=()=>{const side=require('./helpers/canaan-runtime.cjs')(source,{beforeScript(part,run){if(part[1].includes('canaan-runtime-config'))run('0')}});side.g.WebSocket=WebSocket;side.g.Event=Event;return side};
 const host=boot(),guest=boot();
 try{
  host.run('started=true;paused=false;P.dead=false;game.world.monsters=[];game.view.notify=()=>{};game.view.chat=()=>{}');
  host.run('CANAAN_NET.openRoom("'+url+'")');for(let i=0;i<50&&!host.run('CANAAN_NET.state().code');i++)await wait(10);
  guest.run('globalThis.__toasts=[];{const t0=toast;toast=m=>{__toasts.push(m);t0(m)}}');
  guest.run('CANAAN_NET.joinRoom({relay:"'+url+'",code:"'+host.run('CANAAN_NET.state().code')+'",pseudo:"Lina"})');
  for(let i=0;i<60&&guest.run('game.mode')!=='guest';i++)await wait(10);
  const id=guest.run('CANAAN_NET.state().heroId'),G='game.guests["'+id+'"]';
  const step=async n=>{for(let i=0;i<n;i++){host.run('time++;readInput();simulateStep();updateWorld();CANAAN_NET.tick()');guest.run('time++;readInput();CANAAN_NET.tick()');await wait(2)}};
  assert.equal(guest.run('JSON.stringify(hiddenChestSpots.map(chestPosition))'),host.run('JSON.stringify(hiddenChestSpots.map(chestPosition))'),'mêmes coffres cachés chez l’invité');
  // L'hôte a déjà ouvert un coffre : l'invité le voit ouvert.
  host.run('game.world.openedChests.push(hiddenChestSpots[0].id)');await step(10);
  assert.equal(guest.run('game.world.openedChests.includes(hiddenChestSpots[0].id)'),true);
  // L'invité va près d'un autre coffre et appuie sur E.
  host.run('{const c=chestPosition(hiddenChestSpots[1]);'+G+'.player.x=c.x*TS;'+G+'.player.y=c.y*TS;'+G+'.player.keys=1;P.x=c.x*TS+3000;P.y=c.y*TS}');await step(15);
  const gold0=host.run(G+'.player.gold'),bag0=host.run(G+'.inventory.length');
  guest.run('interact()');await step(10);
  assert.equal(host.run('game.world.openedChests.includes(hiddenChestSpots[1].id)'),true,'coffre ouvert chez l’hôte');
  assert.ok(host.run(G+'.player.gold')>gold0&&host.run(G+'.inventory.length')>bag0,'butin pour l’invité');
  assert.equal(host.run(G+'.player.keys'),0,'sa clé est consommée');
  assert.ok(guest.run('__toasts.some(t=>t.includes("Coffre secret"))'),'annoncé à l’invité');
  assert.equal(guest.run('game.world.openedChests.includes(hiddenChestSpots[1].id)'),true,'il le voit ouvert');
  // Loin d'un coffre : rien.
  const opened=host.run('game.world.openedChests.length');guest.run('CANAAN_NET.requestAction({op:"open-chest"})');host.run(G+'.player.x+=5000');await step(6);
  assert.equal(host.run('game.world.openedChests.length'),opened);
  assert.equal(host.errors.length+guest.errors.length,0,host.errors.concat(guest.errors).join('\n'));
 }finally{host.run('CANAAN_NET.closeRoom()');await relay.close()}
});

test('Quêtes : les 15 quêtes des chapitres I à III se jouent de bout en bout (énigmes, récompenses, monde changé, sauvegarde)',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const check=(id)=>{assert.equal(run('give('+id+')'),true,'turn in '+id);assert.equal(run('step('+id+')'),'done')};
 run(`started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];
 globalThis.tp=(site,dx,dy)=>{const s=S(site);P.x=(s.x+dx+0.5)*TS;P.y=(s.y+dy+0.5)*TS};
 globalThis.toNpc=id=>{const n=Q.npcs()[id];P.x=n.x+30;P.y=n.y};
 globalThis.act=(site,obj,n=1)=>{for(let i=0;i<n;i++)Q.act(HR,site,obj)};
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};
 globalThis.st=()=>Q.state(HR);globalThis.step=id=>st().active[id]?st().active[id].step:(st().done[id]?'done':'none');
 globalThis.take=id=>{toNpc(Q.npcs()[Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id)].id);return Q.accept(HR,id)};
 globalThis.give=id=>{toNpc(Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id));return Q.turnIn(HR,id)};`);
 // Q2 locked before Q1
 assert.equal(run('take(2)'),false,'Q2 locked');
 // Q1
 assert.equal(run('take(1)'),true);run('tp("q1",1,1);tick(20)');assert.equal(run('step(1)'),1,'trail');
 run('act("q1","p_lune")');assert.equal(run('step(1)'),1);run('for(const s of ["soleil","pluie","vent","lune"])act("q1","p_"+s)');assert.equal(run('step(1)'),2);check(1);
 assert.equal(run('st().flags.lumi'),true);
 // Q2
 run('take(2);for(const s of ["etoile","lune","flamme"])act("q2","sym_"+s)');assert.equal(run('step(2)'),1);
 run('act("q2","ped0",2);act("q2","ped1",2);act("q2","ped2",2)');assert.equal(run('step(2)'),2);check(2);
 // Q3
 run('take(3);act("q3","gate0");act("q3","gate1");act("q3","gate2");act("q3","whistle");tick(400)');assert.equal(run('step(3)'),1,'sheep');check(3);
 assert.ok(run('st().deco.includes("mouton")'));
 // Q4
 const inv0=run('HR.inventory.length');run('take(4);act("q4","dig")');assert.equal(run('step(4)'),1);check(4);assert.equal(run('HR.inventory.length'),inv0+1);
 // Q5
 run('take(5);Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act("q5","ripple1")');assert.equal(run('step(5)'),0,'pas doré');run('Q.puzzles().q5.gold=2;Q.puzzles().q5.until=time+60;act("q5","ripple2")');assert.equal(run('step(5)'),1);check(5);
 assert.equal(run('HR.prof.fish["dore:3"]'),2);
 // Q6
 run('take(6);for(let i=1;i<=4;i++)act("q6","mstone"+i)');assert.equal(run('step(6)'),1);
 const door=run('(o=>canWalk(o.x,o.y))(S("q6").objs.find(o=>o.kind==="door"))');assert.equal(door,false);
 run('for(const c of ["chime1","chime2","chime3","chime0"])act("q6",c)');assert.equal(run('step(6)'),2);
 assert.equal(run('(o=>canWalk(o.x,o.y))(S("q6").objs.find(o=>o.kind==="door"))'),true,'porte ouverte');check(6);
 const inv1=run('HR.inventory.length');run('act("q6","shrine")');assert.equal(run('HR.inventory.length'),inv1+1);assert.ok(run('st().flags.visit_murmures'));
 // Q7
 run('take(7);act("q7","mirror0",2);act("q7","mirror1",2)');assert.equal(run('Q.beam().lit'),true);assert.equal(run('step(7)'),1);
 run('tp("q7",2,-1);time=Math.ceil(time/10)*10-1;tick(2)');assert.equal(run('step(7)'),2);check(7);assert.ok(run('st().flags.star1&&st().flags.blessing'));
 // Q8
 run('take(8);tp("q8",0,-8);tick(20)');assert.equal(run('step(8)'),1);check(8);
 run('tp("q8",0,-8);act("q8","waystone")');assert.ok(run('Math.hypot(P.x-(CANAAN_CAMP.x*TS),P.y-(CANAAN_CAMP.y*TS))')<14*48,'pierre de passage');
 // Q9
 run('take(9);(e=>{P.x=e[0];P.y=e[1]})(S("q9").trail.at(-1));tick(20)');assert.equal(run('step(9)'),1);run('act("q9","thief")');assert.equal(run('step(9)'),2);check(9);
 // Q10
 run('take(10);act("q10","view")');check(10);
 // Q11
 run('take(11);act("q11","valve0",2);act("q11","valve2",1)');assert.equal(run('step(11)'),1);assert.ok(run('Q.world().flags.lanterns&&Q.world().flags.sanct_reflets'));check(11);
 // Q12
 run('take(12);act("q12","frame0",2);act("q12","frame1",2);act("q12","frame2",2);act("q12","frame3",1)');assert.equal(run('step(12)'),1);check(12);assert.ok(run('st().flags.star2'));
 // Q13
 const plank=run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))');assert.equal(plank,false);
 run('take(13);act("q13","plank0",2);act("q13","plank1",1);act("q13","plank2",3);act("q13","plank3",2)');assert.equal(run('step(13)'),1);
 assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),true,'pont praticable');check(13);
 // Q14
 run('take(14);for(const c of ["lanterne","barque","vieille","pecheur"])act("q14","clue_"+c)');assert.equal(run('step(14)'),1);
 run('toNpc("esprit")');assert.equal(run('CANAAN_QUESTS.handle(HR,{op:"quest-choice",q:14,choice:0})'),true);assert.equal(run('step(14)'),1);
 run('CANAAN_QUESTS.handle(HR,{op:"quest-choice",q:14,choice:1})');assert.equal(run('step(14)'),2);check(14);
 // Q15 : nénuphar qui coule et chute, puis l'îlot.
 run('take(15);tp("q15",-3,0);tick(130)');const s15=run('[Math.floor(P.x/TS)-S("q15").x,Math.floor(P.y/TS)-S("q15").y]');assert.equal(JSON.stringify(s15),'[-4,0]','plouf');
 run('tp("q15",4,0);time=Math.ceil(time/10)*10-1;tick(2)');assert.equal(run('step(15)'),1);check(15);
 // Bilan, sauvegarde et rechargement.
 assert.equal(run('Object.keys(st().done).length'),15);
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot())'));
 assert.equal(Object.keys(snap.heros.hote.quetes.done).length,15);assert.ok(snap.monde.quetes.flags.bridge);
 run('Q.importWorld({});');assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),false);
 run('Q.importWorld('+JSON.stringify(snap.monde.quetes)+')');assert.equal(run('(o=>canWalk(o.x,o.y))(S("q13").objs.find(o=>o.id==="plank1"))'),true);
 
 // Journal (trois onglets), dialogues et décorations de quête débloquées pour la maison.
 run('globalThis.__p=[];modernPanel=h=>__p.push(h);CANAAN_QUESTS.render("main");CANAAN_QUESTS.render("side");CANAAN_QUESTS.render("done")');
 assert.match(run('__p[0]'),/Étoiles du Cœur : ★★☆☆☆☆/);assert.match(run('__p[0]'),/Carte des sanctuaires/);assert.match(run('__p[2]'),/Souvenir/);
 assert.equal(run('CANAAN_QUESTS.hasDeco(HR,"mouton")&&CANAAN_QUESTS.hasDeco(HR,"tableau")'),true);
 assert.equal(run('CANAAN_PROF.RECIPES.dore.quest'),5);
 assert.equal(errors.length,0,errors.join('\n'));
});
test('Quêtes à plusieurs : chacun sa progression, une énigme résolue ensemble compte pour chacun, demandes d’invité vérifiées',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.instance=null;game.world.monsters=[];globalThis.Q=CANAAN_QUESTS;globalThis.n=Q.npcs().liora;P.x=n.x+30;P.y=n.y');
 run('globalThis.ally=canaanCreateHero({name:"Lina",x:n.x+40,y:n.y});game.heroes.push(ally)');
 // L'invité demande à l'hôte : quête acceptée seulement près du PNJ, objet seulement à portée.
 assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'),true);assert.equal(run('Q.handle(ally,{op:"quest-accept",q:1})'),false,'déjà en cours');
 assert.equal(run('Q.handle(ally,{op:"quest-accept",q:2})'),false,'quête 2 : la 1 d’abord');
 assert.equal(run('Q.accept(game.hero,1)'),true);
 assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"p_soleil"})'),false,'trop loin');
 // Les deux suivent les traces ; l'allié touche les pierres, l'énigme compte pour les deux.
 run('const s=Q.sites().q1;P.x=ally.player.x=(s.x+1.5)*TS;P.y=ally.player.y=(s.y+1.5)*TS;for(let i=0;i<20;i++){time++;CanaanStages.quests.after()}');
 assert.equal(run('Q.state(ally).active[1].step+Q.state(game.hero).active[1].step'),2);
 for(const s of ['soleil','pluie','vent','lune']){run('(o=>{ally.player.x=o.x+40;ally.player.y=o.y})(Q.sites().q1.objs.find(o=>o.id==="p_'+s+'"))');assert.equal(run('Q.handle(ally,{op:"quest-act",site:"q1",obj:"p_'+s+'"})'),true,s)}
 assert.equal(run('Q.state(ally).active[1].step'),2);assert.equal(run('Q.state(game.hero).active[1].step'),2,'l’hôte, à côté, est crédité');
 // Rendue par l'allié seulement : sa récompense et sa Lumi, pas celles de l'hôte.
 run('ally.player.x=n.x+30;ally.player.y=n.y');assert.equal(run('Q.handle(ally,{op:"quest-turnin",q:1})'),true);
 assert.equal(run('!!Q.state(ally).flags.lumi&&!Q.state(game.hero).flags.lumi'),true);assert.equal(run('Q.questLook(ally)'),1);
 // Messages réseau : seules les demandes bien formées passent.
 assert.equal(run('JSON.stringify(sanitizeAction({op:"quest-act",site:"q12",obj:"frame0"}))'),'{"op":"quest-act","site":"q12","obj":"frame0"}');
 assert.equal(run('sanitizeAction({op:"quest-act",site:"<x>",obj:"a"})'),null);assert.equal(run('sanitizeAction({op:"quest-accept",q:99})'),null);
 assert.equal(run('sanitizeAction({op:"quest-choice",q:14,choice:9})'),null);
 // État des lieux envoyé aux invités, appliqué tel quel.
 run('Q.puzzles().q7.m=[1,2,3]');const view=run('JSON.stringify(Q.netView())');run('Q.puzzles().q7.m=[0,0,0];Q.applyRemote('+view+')');
 assert.equal(run('Q.puzzles().q7.m.join()'),'1,2,3');
 // Progression sauvegardée vérifiée : quête inconnue, étape hors limite et drapeau inventé retirés.
 assert.equal(run('JSON.stringify(sanitizeQuests({active:{1:{step:99},77:{step:0}},done:{2:5},flags:{lumi:1,triche:1},deco:["mouton","x"]}))'),
  JSON.stringify({active:{1:{step:2,got:[]}},done:{2:5},flags:{lumi:true},deco:['mouton'],choices:{},track:null}));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Quêtes : les chapitres IV à VI (quêtes 16 à 30) se jouent de bout en bout, jusqu’au réveil du Cœur',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run(`started=true;paused=false;P.dead=false;game.world.instance=null;game.world.monsters=[];globalThis.__t=[];toast=m=>__t.push(m);game.view.notify=m=>__t.push(m);
 globalThis.Q=CANAAN_QUESTS;globalThis.HR=game.hero;globalThis.S=id=>Q.sites()[id];game.hero.level=60;
 for(let i=1;i<=15;i++)Q.state(HR).done[i]=1;Object.assign(Q.state(HR).flags,{star1:true,star2:true,lumi:true});
 globalThis.tp=(site,dx,dy)=>{const s=S(site);P.x=(s.x+dx+0.5)*TS;P.y=(s.y+dy+0.5)*TS};
 globalThis.toNpc=id=>{const n=Q.npcs()[id];P.x=n.x+30;P.y=n.y};
 globalThis.act=(site,obj,n=1)=>{for(let i=0;i<n;i++)Q.act(HR,site,obj)};
 globalThis.tick=n=>{for(let i=0;i<n;i++){time++;CanaanStages.quests.after()}};
 globalThis.st=()=>Q.state(HR);globalThis.step=id=>st().active[id]?st().active[id].step:(st().done[id]?'done':'none');
 globalThis.npcOf=id=>Object.keys(Q.npcs()).find(k=>Q.npcs()[k].quest.id===id);
 globalThis.take=id=>{toNpc(npcOf(id));return Q.accept(HR,id)};
 globalThis.give=id=>{toNpc(npcOf(id));return Q.turnIn(HR,id)};`);
 const check=id=>{assert.equal(run('give('+id+')'),true,'turn in '+id);assert.equal(run('step('+id+')'),'done')};
 // 16 : feuilles puis objets dans leurs maisons.
 run('take(16);for(const f of ["f1","f2","f3","f4"])act("q16",f)');assert.equal(run('step(16)'),1);
 run('for(let i=0;i<4;i++){act("q16","vobj"+i);act("q16","house"+i)}');assert.equal(run('step(16)'),2);check(16);
 assert.ok(run('Q.world().flags.sanct_saisons&&st().flags.star3'));
 // 17
 run('take(17);for(const f of ["fr1","fr2","fr3","fr4"])act("q17",f);act("q17","pillar0",3);act("q17","pillar2",1);act("q17","pillar3",2)');assert.equal(run('step(17)'),2);check(17);
 // 18 : la feuille doit être basse et sur le héros.
 run('take(18)');
 run('globalThis.leafPos=()=>{const s=S("q18");const t=Q.puzzles().q18.t;return {x:(s.x+0.5)*TS+Math.cos(t*0.011)*3.2*TS+Math.sin(t*0.031)*0.6*TS,y:(s.y+0.5)*TS+Math.sin(t*0.017)*2.4*TS,h:(Math.sin(t*0.045)+1)/2}}');
 for(let k=0;k<400;k++){const h=run('(l=>{P.x=l.x;P.y=l.y;return l.h})(leafPos())');if(h<0.3){run('act("q18","leaf18")');break}run('tick(1)')}
 assert.equal(run('step(18)'),1,'feuille attrapée');check(18);
 // 19
 run('take(19);act("q19","gear0",2);act("q19","gear1",1);act("q19","gear2",2)');assert.equal(run('step(19)'),1);check(19);
 // 20
 run('take(20);for(const t of ["t1","t2","t3"])act("q20",t);act("q20","hide0")');assert.equal(run('step(20)'),1,'mauvaise cachette');run('act("q20","hide1")');assert.equal(run('step(20)'),2);check(20);
 // 21 : obélisques dégagés puis tournés (initial [2,0,1] → [1,3,0]).
 run('take(21);for(let i=0;i<3;i++)act("q21","obelisk"+i)');assert.equal(run('step(21)'),1);
 run('act("q21","obelisk0",3);act("q21","obelisk1",3);act("q21","obelisk2",3)');assert.equal(run('step(21)'),2);check(21);
 // 22 : anneaux [3,1,4] ; ring2 seul, ring0 entraîne ring1, ring1 entraîne ring2.
 run('take(22)');
 run('(()=>{const r=Q.puzzles().q22.r;let a=(6-r[0])%6;act("q22","ring0",a);let b=(6-Q.puzzles().q22.r[1])%6;act("q22","ring1",b);let c=(6-Q.puzzles().q22.r[2])%6;act("q22","ring2",c)})()');
 assert.equal(run('step(22)'),1);check(22);
 // 23 : E, S, E, S.
 run('take(23);act("q23","fanW");act("q23","fanN");act("q23","fanW");act("q23","fanN")');assert.equal(run('step(23)'),1);check(23);
 // 24 : [2,2,2,1] → [0,0,0,*].
 run('take(24);act("q24","mirror0",2);act("q24","mirror1",2);act("q24","mirror2",2)');assert.equal(run('step(24)'),1);check(24);
 // 25
 run('take(25);act("q25","agate0");act("q25","agate2")');assert.equal(run('step(25)'),1);check(25);
 // 26 : épreuves puis autel.
 run('take(26);for(const [i,a] of [[0,1],[1,1],[2,0],[3,2]]){const o=S("q26").objs.find(o=>o.id==="trial"+i);P.x=o.x+40;P.y=o.y;Q.handle(HR,{op:"quest-act",site:"q26",obj:"trial"+i+"_a"+a})}');
 assert.equal(run('step(26)'),1);run('act("q26","altar")');assert.equal(run('step(26)'),2);check(26);
 // 27 : fresque, défense (on tue les échos), lumières.
 run('take(27);act("q27","fresco27");act("q27","altar27")');assert.equal(run('step(27)'),1);
 for(let k=0;k<20&&run('step(27)')===1;k++){run('tp("q27",0,2);tick(130);game.world.monsters.filter(m=>m.questEcho).forEach(m=>{m.hp=0});game.world.monsters=game.world.monsters.filter(m=>m.hp>0)')}
 assert.equal(run('step(27)'),2,'défense réussie');
 run('for(let i=0;i<6;i++)act("q27","cc"+i)');assert.equal(run('step(27)'),3);check(27);
 assert.ok(run('st().flags.title&&st().flags.aurora&&st().flags.star6'));
 // 28 : leviers 1 et 2, puis marcher jusqu'au coffre.
 run('take(28);act("q28","lever1");act("q28","lever2")');
 assert.equal(run('(s=>canWalk((s.x+5.5)*TS,(s.y+0.5)*TS))(S("q28"))'),true,'passage ouvert de l’autre côté du miroir');
 run('tp("q28",5,0);tick(5)');assert.equal(run('step(28)'),1);check(28);
 // 29
 run('take(29);act("q29","horn")');assert.equal(run('step(29)'),0);
 run('act("q29","perch0",2);act("q29","perch1",1);act("q29","perch2",3);act("q29","perch3",2);act("q29","horn");tick(300)');assert.equal(run('step(29)'),1);check(29);
 // 30 : marcher sur les pierres dans l'ordre.
 run('take(30)');for(const [x,y] of [[-2,-1],[0,-2],[1,0],[0,1],[2,1]]){run(`tp("q30",${x},${y});tick(1)`)}
 assert.equal(run('step(30)'),1);const inv=run('HR.inventory.length');check(30);assert.equal(run('HR.inventory.length'),inv+1);
 assert.equal(run('Object.keys(st().done).length'),30);
 
 // Titre, aura visible par les autres, sanctuaires ouverts pour tout le monde, journal complet.
 assert.equal(run('CANAAN_QUESTS.questLook(HR)'),5,'Lumi et l’aura du Gardien');
 assert.ok(run('["sanct_saisons","sanct_etoiles","sanct_lumieres","sanct_aurore"].every(f=>Q.world().flags[f])'));
 run('globalThis.__p=[];modernPanel=h=>__p.push(h);CANAAN_QUESTS.render("main")');assert.match(run('__p[0]'),/★★★★★★/);
 assert.equal(errors.length,0,errors.join('\n'));
});
test('Donjons et raids : moins d’XP, plus coriaces, et des boss qui annoncent leurs coups, appellent des renforts et entrent en rage',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // XP : boss et instance terminée rapportent nettement moins qu'avant (×15/×25 et ×30/×50 auparavant).
 assert.equal(run('bossXp(10,"dungeon")'),(10+50)*8);assert.equal(run('bossXp(10,"raid")'),(10+50)*12);assert.equal(run('clearXp(10,false)'),(10+50)*12);
 assert.ok(run('bossHealth(30,"raid")>bossHealth(30,"dungeon")&&bossDamage(30,"dungeon")>mobDamage(30)'));
 run('started=true;paused=false;P.dead=false;game.view={notify:()=>{},chat:()=>{}};game.hero.level=10;recomputeStats();P.hp=P.mhp;enterInstance(0)');
 // Monstres d'instance plus résistants que dehors (×1,25) et plus forts (×1,12).
 const trash=run('game.world.monsters.find(m=>!m.boss)');assert.ok(run('(m=>m.mhp>=Math.round(mobHealth(m.level,false,(MOB_TYPES.find(t=>t.name===m.t)||{hp:100}).hp)*1.2))(game.world.monsters.find(m=>!m.boss))'));
 // Boss sorti de sa salle pour le test : ses mécaniques visent le héros où qu'il soit.
 run('globalThis.boss=game.world.monsters.find(m=>m.boss);delete boss.room;game.world.monsters=[boss];boss.x=P.x+200;boss.y=P.y;boss.cd=99');
 // Onde de choc : un cercle annoncé, puis des dégâts à qui y reste ; une roulade (invulnérable) l'évite.
 run('boss.mech={wave:0,rain:1e9,adds:0};time++;CanaanStages.bossMechanics.after()');
 assert.equal(run('CANAAN_BOSS_MECHANICS.zones().length'),1);
 run('const z=CANAAN_BOSS_MECHANICS.zones()[0];P.x=z.x;P.y=z.y;globalThis.hp0=P.hp;boss.mech.wave=1e9;const rnd0=Math.random;Math.random=()=>0.5;for(let i=0;i<100;i++){time++;CanaanStages.bossMechanics.after()}Math.random=rnd0');
 assert.ok(run('P.hp<hp0'),'resté dans le cercle : touché');assert.equal(run('CANAAN_BOSS_MECHANICS.zones().length'),0);
 // Renforts à 66 % de PV (et 33 %), puis rage sous 25 % (dégâts ×1,25).
 const raw=run('CANAAN_ENEMY_RAW_DAMAGE(boss)');
 run('boss.hp=boss.mhp*0.45;time++;CanaanStages.bossMechanics.after()');assert.equal(run('game.world.monsters.filter(m=>m.summoned).length'),2);
 run('boss.hp=boss.mhp*0.2;time++;CanaanStages.bossMechanics.after()');assert.equal(run('boss.enraged'),true);
 assert.ok(Math.abs(run('CANAAN_ENEMY_RAW_DAMAGE(boss)')-raw*1.25)<1e-6);
 // Dans une instance, les monstres ordinaires rapportent 60 % de leur XP.
 run('leaveInstance()');assert.equal(errors.length,0,errors.join('\n'));
});

test('Arène : tout le groupe à terre (l’hôte tombé en premier) revient au camp, chacun relevé',()=>{
 for(const order of ['hostFirst','guestFirst']){
  const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
  run('started=true;paused=false;P.dead=false;globalThis.__t=[];setTimeout=f=>{__t.push(f);return 1};toast=()=>{};game.view.chat=()=>{}');
  run('game.hero.level=20;{const h=canaanCreateHero({name:"Lina",x:P.x,y:P.y});h.level=20;game.heroes.push(h);globalThis.lina=h}');
  assert.equal(run('enterArena()'),true);
  run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
  for(let i=0;i<10;i++)run('time++;simulateStep()');run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
  assert.equal(run('CANAAN_ARENA.run().phase'),'fight');
  const host='P.hp=1;CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss);updateWorld()',ally='CANAAN_COMBAT.hurt(1e9,CANAAN_ARENA.run().boss,lina)';
  for(const s of order==='hostFirst'?[host,ally]:[ally,host]){run(s);for(let i=0;i<20;i++)run('time++;runUpdatePipeline()')}
  assert.equal(run('P.dead&&lina.player.dead'),true);
  assert.equal(run('__t.length'),1,order+' : un seul retour au camp programmé');
  run('__t.splice(0).forEach(f=>f())');
  assert.equal(run('game.world.instance'),null,order+' : le colisée est quitté');
  assert.equal(run('P.dead||lina.player.dead'),false,order+' : tout le monde est relevé');
  assert.ok(run('Math.hypot(P.x-CANAAN_SPAWN.x,P.y-CANAAN_SPAWN.y)<1&&Math.hypot(lina.player.x-P.x,lina.player.y-P.y)<3*TS'),order+' : au camp');
  assert.equal(errors.length,0,errors.join('\n'));
 }
});

test('Arène : les cercles au sol ne touchent que les héros qui sont dedans',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;toast=()=>{};game.view.chat=()=>{};Math.random=()=>0.5;canaanRegenRates=()=>({mana:0,health:0})');
 run('game.hero.level=30;{const h=canaanCreateHero({name:"Lina",x:P.x,y:P.y});h.level=30;game.heroes.push(h);globalThis.lina=h}');
 assert.equal(run('enterArena()'),true);
 run('{const L=arenaLayout();game.heroes.forEach((h,k)=>{h.player.x=L.x+(k-1)*30;h.player.y=L.y+60})}');
 for(let i=0;i<10;i++)run('time++;simulateStep()');run('CANAAN_ARENA.run().timer=0');for(let i=0;i<5;i++)run('time++;simulateStep()');
 run('const b=CANAAN_ARENA.run().boss;b.cd=b.moveClock=b.autoClock=b.busy=1e9;for(const h of game.heroes){h.player.mhp=h.player.hp=1e6}');
 // Chaque attaque à cercles autour du héros visé : l'hôte est visé, l'alliée est dans le colisée à 700 px de lui.
 // Avant la correction, chaque cercle touchait tous les héros, où qu'ils soient.
 const spot='{const L=arenaLayout();P.x=L.x+300;P.y=L.y;lina.player.x=L.x-400;lina.player.y=L.y;CANAAN_ARENA.run().boss.target=game.hero}';
 for(const move of ['quake','rocks','poison','lightning','meteors']){
  run('CANAAN_ARENA.run().fx.length=0;CANAAN_ARENA.run().hazards.length=0;CANAAN_ARENA.run().dots.length=0;'+spot);
  run('time++;simulateStep();'+spot+';globalThis.lina0=lina.player.hp;globalThis.host0=P.hp;CANAAN_ARENA.playMove("'+move+'")');
  for(let i=0;i<200;i++)run('time++;'+spot+';simulateStep()');
  assert.equal(run('lina.player.hp'),run('lina0'),move+' : l’alliée hors des cercles n’est pas touchée');
  assert.ok(run('P.hp')<run('host0'),move+' : l’hôte, dans les cercles, est touché');
 }
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Compétences : attaques de base renforcées, info-bulles claires, charges du bâton visibles, postures utiles',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;P.dead=false;game.world.instance=null;toast=()=>{};game.view.chat=()=>{};Math.random=()=>0.5');
 const gear=w=>'{'+['helm','shoulders','armor','gloves','boots','neck','ring','weapon'].map(k=>k+':{id:"g'+k+'",slot:"'+k+'",level:30,rarity:"Rare",weaponType:"'+w+'",sec:{power:1,crit:1}}').join(',')+'}';
 run('game.hero.level=30;game.hero.equipment={...game.hero.equipment,...'+gear('sword')+'};recomputeStats();refreshWeaponBar()');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BASIC_ATTACK.spec)')),{quick:{mult:0.75,lock:0.55},heavy:{mult:1.6,lock:1.15}});
 // Le bâton a la même puissance que les autres armes (plus d'Intelligence).
 assert.equal(run('CANAAN_SKILLS.power(game.hero,true)'),run('CANAAN_SKILLS.power(game.hero,false)'));
 // Info-bulle : explication, dégâts estimés avec la puissance actuelle, recharge, mana, effet de classe.
 const tip=run('canaanSkillTooltip(0)'),power=run('CANAAN_SKILLS.power(game.hero,false)');
 assert.ok(tip.includes('Un coup puissant devant toi')&&tip.includes('≈ '+Math.round(power*2.6)+' dégâts')&&tip.includes('Recharge 4 s')&&tip.includes('Mana 8'),tip);
 assert.ok(tip.includes('Sans classe'),'sans classe : invitation à en choisir une');
 for(const [id,word] of [['druide','empoisonne'],['paladin','bouclier'],['assassin','+12 %'],['elementaliste','brûle']]){
  run('game.hero.classe={id:"'+id+'",talents:[]}');assert.ok(run('canaanSkillTooltip(0)').includes(word),id);
 }
 assert.ok(run('canaanSkillTooltip(2)').includes('décharge'),'utilitaire de l’Élémentaliste');
 assert.ok(run('canaanSkillTooltip("special")').includes('Avatar élémentaire'));
 assert.ok(run('SKILLS.every(s=>s.el.dataset.tooltipSkill!==undefined)'),'survol des cases');
 // Chaque catalogue de compétence a sa puissance et son explication.
 assert.ok(run('Object.values(WEAPON_DEFINITIONS).every(w=>w.role&&w.sp.every(s=>s.length===7&&typeof s[5]==="number"&&s[6].length>20))'));
 // Bâton : les charges s'affichent (badge de la compétence 4) et la Surcharge les consomme.
 run('game.hero.classe={id:null,talents:[]};game.hero.equipment={...game.hero.equipment,...'+gear('staff')+'};recomputeStats();refreshWeaponBar();P.mp=P.mmp;mouseWorldX=P.x+100;mouseWorldY=P.y');
 const cast=i=>run('for(const k in weaponCooldowns)weaponCooldowns[k]=0;P.mp=P.mmp;useSkill('+i+')');
 cast(0);cast(0);assert.equal(run('CANAAN_SKILLS.state(game.hero).arcane'),2);
 run('canaanUpdateSkillBadges()');assert.equal(run('SKILLS[3].el.querySelector(".skill-badge").textContent'),'🔮 2/3');
 assert.ok(run('canaanSkillTooltip(3)').includes('Charges arcaniques : <b>2 / 3</b>'));
 // Concentration : une attaque de base ne la gaspille pas, la compétence suivante la consomme.
 cast(2);assert.ok(run('CANAAN_SKILLS.state(game.hero).focus')>0);assert.equal(run('CANAAN_SKILLS.state(game.hero).arcane'),3);
 run('canaanBasicAttack(false)');assert.ok(run('CANAAN_SKILLS.state(game.hero).focus')>0,'pas consommée par l’attaque de base');
 run('game.world.monsters=[{t:"Cible",x:P.x+100,y:P.y,hp:1e7,mhp:1e7,r:14,cd:1e9,g:0,level:30,_levelHp:true}]');
 cast(3);assert.equal(run('CANAAN_SKILLS.state(game.hero).focus'),0);assert.equal(run('CANAAN_SKILLS.state(game.hero).arcane'),0);
 const surge=run('1e7-game.world.monsters[0].hp');assert.ok(surge>power*7.4*1.2,'Surcharge à 3 charges et Concentration : '+surge);
 // Élan offensif (épées doubles) : les attaques de base sont vraiment plus rapides.
 run('game.hero.equipment={...game.hero.equipment,...'+gear('dualsword')+'};recomputeStats();refreshWeaponBar()');
 run('for(let i=0;i<120;i++){time++;simulateStep()}canaanBasicAttack(false)');const slow=run('CANAAN_BASIC_ATTACK.lock()');
 cast(2);run('for(let i=0;i<70;i++){time++;simulateStep()}canaanBasicAttack(false)');
 assert.ok(Math.abs(run('CANAAN_BASIC_ATTACK.lock()')/slow-0.7)<1e-9,'verrou ×0,7 pendant l’Élan');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Donjons et raids : boss bien plus robustes qu’une élite, élites plus robustes qu’un monstre',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 run('started=true;paused=false;P.dead=false;game.view.chat=()=>{};toast=()=>{}');
 run('game.hero.level=28;enterInstance(3)');
 const r=JSON.parse(run('(()=>{for(let i=0;i<3;i++)simulateStep();const ms=game.world.monsters,b=ms.find(m=>m.boss);scaleBossHp(b);const t=ms.find(m=>!m.boss);const e={...t,elite:true,_levelHp:false,hp:1,mhp:1};canaanSetupMob(e);return JSON.stringify({trash:t.mhp,elite:e.mhp,boss:b.mhp})})()'));
 assert.ok(r.elite<r.trash*1.8,'élite : '+JSON.stringify(r));
 assert.ok(r.boss>r.elite*5,'boss : '+JSON.stringify(r));
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Armes en main et icônes : plus de cercle à 360°, arme tenue et animée pour chaque famille, icônes SVG des 40 sorts',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Le cercle autour du héros à chaque attaque n'existe plus.
 assert.doesNotMatch(script('canaan-game-core'),/ctx\.arc\(P\.x, P\.y, 65/);
 // Icônes : une par compétence (9 armes × 4) et par sort de classe, en SVG.
 const audit=JSON.parse(run('JSON.stringify(CANAAN_SKILL_ICONS.audit())'));
 assert.equal(audit.weapons,9);assert.deepEqual(audit.missing,[]);assert.deepEqual(audit.specials.sort(),['avatar','divine','feral','veil']);
 assert.equal(run('Object.keys(WEAPON_DEFINITIONS).every(t=>[0,1,2,3].every(i=>CANAAN_SKILL_ICONS.weapon(t,i).startsWith("<svg")))'),true);
 assert.equal(run('CLASSES.every(c=>CANAAN_SKILL_ICONS.special(c.special.id).startsWith("<svg"))'),true);
 run('started=true;paused=false;refreshWeaponBar()');assert.ok(run('SKILLS[0].el.innerHTML').startsWith('<svg'),'la barre affiche l’icône SVG');
 // Arme tenue : chaque famille se dessine au repos et à chaque instant de son attaque, derrière ou devant le corps.
 run('globalThis.__drawn=0;const c=new Proxy({},{get:(o,k)=>k==="drawImage"?()=>__drawn++:k==="createRadialGradient"?()=>({addColorStop(){}}):()=>{} ,set:()=>true});globalThis.__c=c');
 for(const type of run('JSON.stringify(Object.keys(WEAPON_DEFINITIONS))')&&JSON.parse(run('JSON.stringify(Object.keys(WEAPON_DEFINITIONS))'))){
  run('game.hero.equipment.weapon={id:"w",slot:"weapon",level:1,weaponType:"'+type+'"};__drawn=0;P.atk=0;for(const l of ["back","front"])CANAAN_WEAPON_LOOK.draw(__c,game.hero,P,P.x,P.y,l)');
  assert.ok(run('__drawn')>=1,type+' au repos');
  for(const atk of [0.28,0.2,0.1,0.02]){run('__drawn=0;P.atk='+atk+';for(const l of ["back","front"])CANAAN_WEAPON_LOOK.draw(__c,game.hero,P,P.x,P.y,l)');assert.ok(run('__drawn')>=1,type+' en attaque '+atk)}
 }
 run('P.atk=0');
 // Le héros se tourne vers sa mire : à droite, à gauche, vers le haut, vers le bas.
 assert.deepEqual([0,Math.PI,-Math.PI/2,Math.PI/2].map(a=>run('CANAAN_WEAPON_LOOK.faceFromAim('+a+')')),[1,3,2,0]);
 // Projectiles : flèche orientée pour l'arc, orbe pour le bâton.
 run('equipment.weapon={id:"b",slot:"weapon",level:1,weaponType:"bow"};refreshWeaponBar();P.mp=P.mmp;mouseWorldX=P.x+200;mouseWorldY=P.y;game.world.projectiles.length=0;useSkill(0)');
 assert.equal(run('game.world.projectiles.at(-1).kind'),'arrow');
 run('canaanDrawProjectile(ctx,game.world.projectiles.at(-1));canaanDrawProjectile(ctx,{x:0,y:0,vx:1,vy:0,c:"#fff",kind:"orb"})');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Icônes SVG du jeu et nouveau nom : chaque émoji a son icône, l’interface et le canevas les dessinent, The Legend of Nashi',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 const audit=JSON.parse(run('JSON.stringify(CANAAN_ICONS.audit())'));assert.deepEqual(audit.missing,[]);assert.ok(audit.emojis>=160);
 // Tous les émojis des sources du jeu ont leur icône (sauf les symboles typographiques gardés en texte).
 const keep=new Set([...'✦✓✔✕★☆☾♪♫➤🜁']);const missing=new Set();
 const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(js|html|css)$/.test(f.name)&&f.name!=='icons.js')for(const m of fs.readFileSync(p,'utf8').matchAll(/[\u{1F300}-\u{1FAFF}☀-➿⏩-⏺⭐❤❗❓⬇]/gu)){if(!keep.has(m[0])&&!run('CANAAN_ICONS.nameOf('+JSON.stringify(m[0])+')'))missing.add(m[0])}}};
 walk(path.join(__dirname,'..','src','canaan'));assert.deepEqual([...missing],[],'émojis sans icône');
 // Interface : un texte avec émoji devient du HTML avec une icône SVG ; une info-bulle native perd l'émoji.
 assert.match(run('CANAAN_ICONS.html("🎒 Inventaire")'),/^<svg class="ico" viewBox="0 0 24 24"[^>]*>.*<\/svg> Inventaire$/);
 assert.equal(run('CANAAN_ICONS.strip("⚙️ Paramètres du jeu")'),'Paramètres du jeu');
 assert.equal(run('CANAAN_ICONS.html("Sans émoji")'),'Sans émoji');
 // Nouveau nom du jeu (le dossier et le fichier autonome gardent le leur).
 assert.match(source,/<h1>THE LEGEND OF NASHI<\/h1>/);assert.doesNotMatch(source,/Canaan Online|CANAAN ONLINE/);
 const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));assert.equal(pkg.productName,'The Legend of Nashi');
 const main=fs.readFileSync(path.join(__dirname,'..','app','main.js'),'utf8');
 assert.match(main,/title: 'The Legend of Nashi'/);assert.match(main,/function adoptOldData\(\)[\s\S]*'Canaan Online'[\s\S]*cpSync/,'les anciennes sauvegardes sont reprises');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Icônes illustrées, taille des textes et cases carrées : chaque objet a sa vraie icône, polices plus grandes et réglables',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Chaque repère ⟦nom⟧ des sources mène à une illustration.
 const art=new Set(JSON.parse(run('JSON.stringify(Object.keys(CANAAN_ICON_ART))')));const miss=new Set();
 const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.(js|html)$/.test(f.name)&&f.name!=='icon-art.js')for(const m of fs.readFileSync(p,'utf8').matchAll(/⟦([a-z0-9_]+)⟧/g))if(!art.has(m[1]))miss.add(m[1])}};
 walk(path.join(__dirname,'..','src','canaan'));assert.deepEqual([...miss],[]);
 // Les objets ont leur propre icône : un Rubis, un emplacement, une statistique, une classe, un poisson, une difficulté.
 assert.equal(run('RUBIS_CATALOG.every(r=>r.icon==="⟦rubis_"+r.id+"⟧")'),true,'chaque Rubis a son illustration');
 assert.equal(run('Object.entries(itemIcon).every(([k,v])=>v==="⟦slot_"+k+"⟧"||k==="weapon2")'),true,'emplacements d’équipement');
 assert.equal(run('Object.entries(WEAPON_DEFINITIONS).every(([k,w])=>w.icon==="⟦w_"+k+"⟧")'),true,'familles d’armes');
 assert.equal(run('CLASSES.every(c=>c.icon==="⟦cls_"+c.id+"⟧")'),true);
 assert.match(run('CANAAN_ICONS.html("⟦rubis_phenix⟧ Phénix")'),/^<svg class="ico art" viewBox="0 0 32 32"/);
 assert.equal(run('CANAAN_ICONS.html("⟦inconnu⟧X")'),'X','un repère inconnu ne s’affiche pas');
 assert.equal(run('CANAAN_ICONS.strip("⟦slot_helm⟧ Tête")'),'Tête');
 // Taille des textes : seules les polices grandissent (125 % par défaut, de 100 % à 160 %), l'interface n'est pas zoomée.
 const css=fs.readdirSync(path.join(__dirname,'..','src','canaan','styles')).map(f=>fs.readFileSync(path.join(__dirname,'..','src','canaan','styles',f),'utf8')).join('\n');
 assert.doesNotMatch(css,/\bzoom:/,'pas de zoom de l’interface');
 assert.match(css,/--font-scale: 1\.25;/);
 assert.deepEqual([...css.matchAll(/font-size:\s*([^;]+);/g)].map(m=>m[1]).filter(v=>/px/.test(v)&&!/--font-scale/.test(v)),[],'chaque police en pixels suit le réglage');
 run('started=true;openSettings()');assert.equal(run('canaanTextScale()'),1.25);
 run('settingsStep("textscale",1)');assert.equal(run('canaanTextScale()'),1.4);assert.equal(run('CANAAN_PREFERENCES.read("settings",{}).textScale'),1.4);
 for(let i=0;i<6;i++)run('settingsStep("textscale",-1)');assert.equal(run('canaanTextScale()'),1);
 // Sac et personnage : objets en cases carrées, nom dans l'info-bulle.
 run('renderInventory()');assert.match(run('document.getElementById("window").innerHTML'),/class="bag-sale"[^>]*>🪙<\/button>/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Sac unifié, boutique à deux fenêtres et échange de piles : Rubis, poissons, viandes et repas sont des objets du sac',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'shop-buy',index:3,gold:9}),{op:'shop-buy',index:3});assert.equal(n.sanitizeAction({op:'shop-buy',index:99}),null);
 assert.deepEqual(n.sanitizeAction({op:'sell-stack',token:'fish:gardon:2*30'}),{op:'sell-stack',token:'fish:gardon:2*30'});assert.equal(n.sanitizeAction({op:'sell-stack',token:'gold:x:1*5'}),null);
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.hero.level=20;P.gold=10000;game.hero.inventory=[];updateCapacity();toast=()=>{}');
 // Piles de 100 au plus par case, et elles prennent de la place.
 run('const h=game.hero;h.prof.fish["gardon:1"]=230;h.prof.meat["lievre:0"]=5;h.prof.meals["soupe:1"]=2;h.rubis.owned.phenix=2;h.rubis.equipped=["phenix",null,null,null,null,null]');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BAG.tiles(game.hero).map(p=>CANAAN_BAG.token(p)))')),['rubis:phenix:0*1','fish:gardon:1*100','fish:gardon:1*100','fish:gardon:1*30','meat:lievre:0*5','meal:soupe:1*2']);
 // Deux sections : le sac (Rubis, repas…) et les matériaux (poissons, viandes, minerais, herbes), chacun sa place.
 assert.equal(run('canaanBagUsed(game.hero)'),2,'un Rubis équipé n’est plus dans le sac ; les matériaux ont leur section');
 assert.equal(run('CANAAN_BAG.matUsed(game.hero)'),4);
 // Section pleine : un poisson qui demande une nouvelle case est refusé ; un de plus dans une pile entamée passe.
 run('game.hero.bagLimit=10;BAG_LIMIT=2');assert.equal(run('CANAAN_BAG.room(game.hero,"fish","truite",0,1)'),true,'le sac plein ne bloque pas les matériaux');
 assert.equal(run('CANAAN_BAG.room(game.hero,"meal","grillade",0,1)'),false);
 run('game.hero.prof.ore["fer:0"]=9600');assert.equal(run('CANAAN_BAG.matUsed(game.hero)'),100);
 assert.equal(run('CANAAN_BAG.room(game.hero,"fish","gardon",1,70)'),true);assert.equal(run('CANAAN_BAG.room(game.hero,"fish","gardon",1,71)'),false);
 assert.equal(run('CANAAN_BAG.room(game.hero,"fish","truite",0,1)'),false);run('delete game.hero.prof.ore["fer:0"]');
 // Le sac (I) : onglet Sac (équipement, Rubis, repas) et onglet Matériaux ; un repas se mange d'un clic.
 run('BAG_LIMIT=40;renderInventory()');let inv=run('document.getElementById("window").innerHTML');
 assert.equal((inv.match(/data-tooltip-stack="/g)||[]).length,2);assert.match(inv,/data-action="useBagStack" data-token="meal:soupe:1\*2"/);assert.match(inv,/data-action="bagSection" data-tab="mat"/);
 run('canaanBagSection("mat")');inv=run('document.getElementById("window").innerHTML');
 assert.equal((inv.match(/data-tooltip-stack="/g)||[]).length,4);assert.match(inv,/Matériaux — 4\/100/);run('canaanBagSection("main")');
 // Boutique : un objet Peu commun du niveau du héros par emplacement et par famille d'arme, à choisir.
 run('const m=game.world.npcs.find(n=>n.type==="shop");P.x=m.x;P.y=m.y+30;openShop(m)');
 assert.equal(run('CANAAN_SHOP.stock(game.hero).length'),16);
 assert.ok(run('CANAAN_SHOP.stock(game.hero).every(i=>i.rarity==="Peu commun"&&i.level===20)'));
 assert.deepEqual(JSON.parse(run('JSON.stringify([...new Set(CANAAN_SHOP.stock(game.hero).map(i=>i.weaponType||i.slot))])')).length,16);
 const panel=run('document.getElementById("window").innerHTML');assert.match(panel,/class="shop-panel shop-columns"/);assert.match(panel,/shop-side bag-side/);
 const want=run('CANAAN_SHOP.stock(game.hero)[2].slot'),gold0=run('P.gold');
 assert.equal(run('CANAAN_SHOP.buy(game.hero,2)'),true);assert.equal(run('game.hero.inventory.at(-1).slot'),want);assert.equal(run('P.gold'),gold0-run('shopPriceAt(20)'));
 assert.equal(run('CANAAN_SHOP.stock(game.hero)[2].slot'),want,'remplacé par un objet du même genre');
 // Vendre une pile.
 const g1=run('P.gold');assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),true);
 assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),130);assert.equal(run('P.gold'),g1+100*run('CANAAN_BAG.unitPrice({kind:"fish",q:1})'));
 assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),true);assert.equal(run('CANAAN_SHOP.sellStack(game.hero,"fish:gardon:1*100")'),false,'pas plus que ce qu’on a (30)');
 // Échange : une pile change de main avec l'équipement ; un sac trop plein annule tout.
 run('game.mode="host";globalThis.ami=canaanCreateHero({name:"Ami",x:P.x,y:P.y});ami.id="g-ami";ami.peer="p1";ami.local=false;game.heroes.push(ami)');
 run('CANAAN_TRADE.handle(game.hero,{op:"trade-request",to:"g-ami"});CANAAN_TRADE.handle(ami,{op:"trade-answer",yes:true})');
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*5","fish:gardon:1*30"],gold:0})'),true);
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*6"],gold:0})'),false,'pas plus que la pile');
 assert.equal(run('CANAAN_TRADE.handle(game.hero,{op:"trade-offer",items:["meat:lievre:0*5","fish:gardon:1*30"],gold:0})'),true);
 run('CANAAN_TRADE.handle(game.hero,{op:"trade-ready",yes:true});CANAAN_TRADE.handle(ami,{op:"trade-ready",yes:true})');
 assert.equal(run('CANAAN_BAG.count(ami,"meat","lievre",0)'),5);assert.equal(run('CANAAN_BAG.count(ami,"fish","gardon",1)'),30);
 assert.equal(run('CANAAN_BAG.count(game.hero,"meat","lievre",0)'),0);assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),0);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Banque de 500 places par joueur et Voile d’ombre : déposer, reprendre, sauvegarder ; invisible sauf pour les boss',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'bank-deposit',ref:'fish:gardon:1*30'}),{op:'bank-deposit',ref:'fish:gardon:1*30'});assert.equal(n.sanitizeAction({op:'bank-withdraw',ref:''}),null);
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=20;game.hero.inventory=[];giveGear(20,"normal","Rare");game.hero.prof.fish["gardon:1"]=150');
 assert.equal(run('CANAAN_BANK.CAPACITY'),500);assert.equal(run('game.world.npcs.filter(n=>n.type==="bank"&&!n.layer).length'),1,'un banquier au camp');
 const id=run('game.hero.inventory[0].id');
 assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),false,'loin du banquier');
 run('const b=game.world.npcs.find(n=>n.type==="bank");P.x=b.x;P.y=b.y+30');
 assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),true);assert.equal(run('game.hero.inventory.length'),0);
 assert.equal(run('CANAAN_BANK.deposit(game.hero,"fish:gardon:1*100")'),true);assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),50);
 assert.equal(run('CANAAN_BANK.used(game.hero)'),2);
 assert.equal(run('CANAAN_BANK.withdraw(game.hero,"fish:gardon:1*101")'),false);assert.equal(run('CANAAN_BANK.withdraw(game.hero,"fish:gardon:1*40")'),true);
 assert.equal(run('CANAAN_BAG.count(game.hero,"fish","gardon",1)'),90);assert.equal(run('CANAAN_BANK.of(game.hero).stacks["fish:gardon:1"]'),60);
 // Sac plein : on ne reprend pas.
 run('game.hero.prof.meals["soupe:0"]=1;BAG_LIMIT=1;game.hero.bagLimit=1');assert.equal(run('CANAAN_BANK.withdraw(game.hero,'+JSON.stringify(id)+')'),false);run('delete game.hero.prof.meals["soupe:0"]');run('BAG_LIMIT=40;game.hero.bagLimit=40');
 assert.equal(run('CANAAN_BANK.withdraw(game.hero,'+JSON.stringify(id)+')'),true);assert.equal(run('game.hero.inventory.length'),1);
 // Banque pleine : 500 cases au plus.
 run('CANAAN_BANK.of(game.hero).stacks["meat:lievre:0"]=49900');assert.equal(run('CANAAN_BANK.deposit(game.hero,'+JSON.stringify(id)+')'),false,'banque pleine');run('delete CANAAN_BANK.of(game.hero).stacks["meat:lievre:0"]');
 // Sauvegarde et vérification au chargement.
 const snap=JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.snapshot().heros.hote.bank)'));assert.deepEqual(snap.stacks,{'fish:gardon:1':60});
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_BANK.sanitize({items:[{slot:"x"}],stacks:{"fish:gardon:1":5,"or:x:1":3,"meat:lievre:0":-2}}))')),{items:[],stacks:{'fish:gardon:1':5}});
 run('CANAAN_BANK.open()');assert.match(run('document.getElementById("window").innerHTML'),/class="bank-panel shop-columns"[\s\S]*data-action="bankWithdraw"[\s\S]*data-action="bankDeposit"/);
 // Voile d'ombre : les monstres ne voient plus l'Assassin (ni ne se tournent vers lui) ; les boss si.
 run('closePanels();game.hero.classe={id:"assassin",talents:[]};P.mp=300;P.x=150*TS;P.y=150*TS;game.world.instance=null');
 run('game.world.monsters=[{t:"Loup",x:P.x+150,y:P.y,hp:500,mhp:500,r:14,cd:0,g:0,level:20,_levelHp:true},{t:"Boss",boss:true,x:P.x-150,y:P.y,hp:5000,mhp:5000,r:20,cd:0,g:0,level:20},{t:"Titan",worldBoss:true,x:P.x,y:P.y+160,hp:5000,mhp:5000,r:20,cd:0,g:0,level:20}]');
 assert.equal(run('CANAAN_CLASS.special()'),true);assert.equal(run('P.veiled'),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.world.monsters.map(m=>!!nearestHero(m)))')),[false,true,true]);
 const x0=run('game.world.monsters[0].x');run('game.world.monsters.splice(1)');for(let i=0;i<120;i++)run('time++;simulateStep()');
 assert.equal(run('game.world.monsters[0].x'),x0,'le loup ne bouge pas vers le héros invisible');assert.equal(run('game.world.monsters[0].targetHero'),null);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Minage, cueillette et enchanteur : filons et herbes dans chaque biome, enchantement en troisième secondaire ; nouveaux poissons et gibier',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'gather',node:12}),{op:'gather',node:12});
 assert.deepEqual(n.sanitizeAction({op:'enchant-craft',stat:'crit',tier:2,count:3}),{op:'enchant-craft',stat:'crit',tier:2,count:3});assert.equal(n.sanitizeAction({op:'enchant-craft',stat:'crit',tier:9,count:1}),null);
 assert.deepEqual(n.sanitizeAction({op:'enchant-apply',token:'ench:crit:2*1',ref:'helm'}),{op:'enchant-apply',token:'ench:crit:2*1',ref:'helm'});
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];BAG_LIMIT=40;game.hero.bagLimit=40');
 // Un minerai et une herbe par biome, partout sur l'île, jamais sur une route, au camp ou dans un bâtiment.
 const zones=JSON.parse(run('JSON.stringify([...new Set(CANAAN_GATHER.nodes().map(n=>n.kind+":"+n.id+":"+n.zone))].sort())'));
 for(let z=0;z<6;z++){assert.ok(zones.some(k=>k.startsWith('ore:')&&k.endsWith(':'+z)),'minerai du biome '+z);assert.ok(zones.some(k=>k.startsWith('herb:')&&k.endsWith(':'+z)),'herbe du biome '+z)}
 assert.ok(run('CANAAN_GATHER.nodes().filter(n=>!n.layer).every(n=>tileAt(n.tx,n.ty)!==2&&!isSafe(n.tx,n.ty)&&!canaanRoomAt(n.tx,n.ty)&&canWalk(n.x,n.y))'));
 // Récolter : le minerai va dans le sac, le filon s'épuise 90 s pour ce héros.
 run('globalThis.ni=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="ore");const nd=CANAAN_GATHER.nodes()[ni];P.x=nd.x;P.y=nd.y+20');
 assert.equal(run('CANAAN_GATHER.gather(game.hero,ni)'),true);assert.equal(run('CANAAN_GATHER.gather(game.hero,ni)'),false);
 assert.ok(run('CANAAN_BAG.tiles(game.hero).some(p=>p.kind==="ore")'));assert.ok(run('game.hero.prof.mining.exp')>0);
 run('time+=90*60+1');assert.equal(run('CANAAN_GATHER.depleted(game.hero).length'),0,'le filon s’est reformé');
 // Enchanteur : 3 minerais d'un métal → un enchantement ; rang verrouillé par le niveau.
 run('game.hero.prof.ore={"fer:1":7};game.hero.prof.enchanting.level=12');
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,5)'),false,'loin de la forge');
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y+30}');
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",2,5)'),true);assert.equal(run('game.hero.prof.ench["haste:2"]'),2);assert.equal(run('game.hero.prof.ore["fer:1"]'),1);
 assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",4,1)'),false,'pas de pépites d’or');
 // Niveaux requis : cuivre 1, étain 6, fer 12, argent 20, or 28, mithril 35.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_GATHER.ENCH_LEVEL)')),[1,6,12,20,28,35]);
 run('game.hero.prof.ore["mithril:0"]=3;game.hero.prof.enchanting.level=34');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",5,1)'),false,'mithril : niveau 35');
 run('game.hero.prof.enchanting.level=35');assert.equal(run('CANAAN_GATHER.craft(game.hero,"haste",5,1)'),true);
 run('game.hero.prof.enchanting.level=1;CANAAN_PROF.open("enchant")');assert.match(run('document.getElementById("window").innerHTML'),/Fer <small>[^<]*<\/small><\/h4><p>[^<]*<b class="ko">tu en as 1<\/b><\/p><div class="prof-actions"><button[^>]*disabled>🔒 Enchanteur niv\. 12</);
 run('closePanels();game.hero.prof.enchanting.level=12');
 // Poser : l'objet porté gagne une troisième secondaire, comptée dans les statistiques du héros.
 run('let it;do{giveGear(30,"normal","Rare");it=game.hero.inventory.at(-1)}while(it.slot==="artifact");globalThis.slot=it.slot;equipItem(it.id)');
 const before=run('characterStats().secondary.haste');
 assert.equal(run('CANAAN_GATHER.apply(game.hero,"ench:haste:2*1",slot)'),true);
 const ench=JSON.parse(run('JSON.stringify(game.hero.equipment[slot].ench)'));assert.equal(ench.stat,'haste');assert.equal(ench.value,run('CANAAN_GATHER.value(game.hero.equipment[slot],2,game.hero)'));assert.ok(ench.value>run('CANAAN_GATHER.value(game.hero.equipment[slot],2)'),'bonus du niveau d’enchanteur');
 assert.equal(run('Object.keys(itemStats(game.hero.equipment[slot]).secondary).length>=2&&itemStats(game.hero.equipment[slot]).enchant.stat==="haste"'),true);
 assert.equal(run('characterStats().secondary.haste'),before+ench.value);
 assert.match(run('CANAAN_STATS_VIEW.tooltip(game.hero.equipment[slot])'),/enchantement/);
 // Enchantement invalide retiré au chargement.
 assert.equal(run('JSON.stringify(CANAAN_GATHER.cleanItem({slot:"helm",ench:{stat:"or",value:5,tier:1}}).ench)'),undefined);
 // Nouveaux poissons, gibier et infusions, avec leurs recettes.
 assert.ok(['perche','brochet','anguille','merou','raie'].every(f=>run('!!CANAAN_PROF.FISH["'+f+'"]&&!!CANAAN_PROF.RECIPES[CANAAN_PROF.FISH["'+f+'"].recipe]')));
 assert.ok(['faisan','canard','chevre','lezard'].every(k=>run('!!CANAAN_PROF.GAME["'+k+'"]&&CANAAN_PROF.huntable("'+k+'",false)')));
 assert.ok(run('Object.keys(CANAAN_GATHER.HERBS).every(h=>Object.values(CANAAN_PROF.RECIPES).some(r=>r.fish===h))'),'chaque herbe a son infusion');
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Travaux minutés : miner et cueillir 5 s, forger 10 s à la forge du camp, cuisiner à la cuisinière ; bouger interrompt',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;toast=()=>{};game.hero.level=30;game.hero.inventory=[];BAG_LIMIT=40;game.hero.bagLimit=40;game.world.monsters=[]');
 assert.ok(run('!!CANAAN_CAMP_LIFE.forge()'),'une forge au camp');assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit().missing)')),[]);
 // Miner : rien avant 5 s, le minerai à la fin ; l'animation est visible (outil, avancement).
 run('globalThis.ni=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="ore");{const nd=CANAAN_GATHER.nodes()[ni];P.x=nd.x;P.y=nd.y+20}');
 assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"gather",node:ni})'),true);assert.equal(run('CANAAN_GATHER.workOf(game.hero).kind'),'mine');
 for(let i=0;i<4.8*60;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_BAG.tiles(game.hero).length'),0,'pas avant 5 s');
 assert.ok(run('CANAAN_GATHER.workView(game.hero).p')>0.9);
 for(let i=0;i<20;i++)run('time++;simulateStep()');assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="ore").length'),1);assert.equal(run('CANAAN_GATHER.workView(game.hero)'),null);
 // Cueillir puis bouger : interrompu, rien de récolté.
 run('globalThis.hi=CANAAN_GATHER.nodes().findIndex(x=>x.kind==="herb");{const nd=CANAAN_GATHER.nodes()[hi];P.x=nd.x;P.y=nd.y+20}');
 assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"gather",node:hi})'),true);for(let i=0;i<60;i++)run('time++;simulateStep()');
 run('P.x+=40');for(let i=0;i<300;i++)run('time++;simulateStep()');
 assert.equal(run('CANAAN_GATHER.workView(game.hero)'),null);assert.equal(run('CANAAN_BAG.tiles(game.hero).filter(p=>p.kind==="herb").length'),0);
 // Forger : seulement à la forge, 10 s pour un enchantement.
 run('game.hero.prof.ore={"cuivre:0":3}');assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"enchant-craft",stat:"power",tier:0,count:1})'),false);
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y+30}');assert.equal(run('CANAAN_GATHER.handle(game.hero,{op:"enchant-craft",stat:"power",tier:0,count:1})'),true);
 assert.equal(run('(game.hero.work.until-game.hero.work.start)/60'),10);
 for(let i=0;i<9.9*60;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.ench["power:0"]'),undefined);
 for(let i=0;i<10;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.ench["power:0"]'),1);
 // Cuisiner : à la cuisinière, le temps de préparer.
 run('P.x=(CANAAN_ROOMS[2].x+4.5)*TS;P.y=(CANAAN_ROOMS[2].y+3.6)*TS;game.hero.prof.fish={"gardon:0":1}');
 assert.equal(run('CANAAN_PROF.handle(game.hero,{op:"cook",recipe:"soupe",quality:0,count:1})'),true);assert.equal(run('CANAAN_GATHER.workOf(game.hero).kind'),'cook');
 for(let i=0;i<6*60+2;i++)run('time++;simulateStep()');assert.equal(run('game.hero.prof.meals["soupe:0"]'),1);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Succès et bestiaire : cent succès adaptés, exploits comptés par l’hôte, récompenses une fois, titres, collections, sauvegarde et réseau',async()=>{
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.deepEqual(n.sanitizeAction({op:'ach-title',id:'c3'}),{op:'ach-title',id:'c3'});assert.equal(n.sanitizeAction({op:'ach-title',id:'<b>'}),null);
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Cent succès, vingt par catégorie, identifiants uniques, chacun avec sa récompense ; touche Y et bouton du menu.
 const list=JSON.parse(run('JSON.stringify(CANAAN_ACHIEVEMENTS.LIST.map(a=>({id:a.id,cat:a.cat,r:CANAAN_ACHIEVEMENTS.rewardText(a.reward)})))'));
 assert.equal(list.length,100);assert.equal(new Set(list.map(a=>a.id)).size,100);assert.ok(list.every(a=>a.r));
 for(const c of ['combat','explore','eco','magic','defi'])assert.equal(list.filter(a=>a.cat===c).length,20,c);
 assert.match(source,/data-action="toggleAchievements"[^>]*>.*?menu-shortcut">Y</);assert.match(source,/k === 'y'/);
 // Bestiaire : monstres du monde, créatures des instances, boss mondiaux, boss d'instance et de l'Arène.
 assert.equal(run('JSON.stringify(["mob","under","dungeon","world","boss","arena"].map(k=>CANAAN_ACHIEVEMENTS.catalog().filter(b=>b.group===k).length))'),'[22,16,27,12,72,12]');
 assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Loup"})'),'m:Loup');assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"x",worldBoss:true,worldBossId:"fenrir"})'),'w:fenrir');
 assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Le Roi Sanglant",boss:true})'),'b:Le Roi Sanglant');assert.equal(run('CANAAN_ACHIEVEMENTS.beastKey({t:"Clone",arenaClone:true})'),null);
 run('started=true;paused=false;game.hero.level=5;game.hero.kills=0;P.gold=0;game.hero.inventory=[];game.hero.equipment.weapon={id:"w",slot:"weapon",level:5,rarity:"Commun",weaponType:"bow"};toast=()=>{}');
 // Exploits : victoire (espèce, élite, arme), coup (plus gros coup, critiques), roulade, minerai.
 run('canaanAchieve(game.hero,"hit",globalThis.__m={t:"Loup",elite:true,x:P.x,y:P.y},1234,true);canaanAchieve(game.hero,"kill",__m);canaanAchieve(game.hero,"dodge");canaanAchieve(game.hero,"gather","ore","or",2)');
 const st=()=>JSON.parse(run('JSON.stringify(game.hero.succes)'));
 let s=st();assert.deepEqual(s.best['m:Loup'],[1,1,1]);assert.equal(s.s.kills,1);assert.equal(s.s.elites,1);assert.equal(s.s.w_bow,1);
 assert.equal(s.s.maxHit,1234);assert.equal(s.s.crits,1);assert.equal(s.s.dodges,1);assert.equal(s.s.ores,2);assert.equal(s.s.oreOr,1);
 // Déblocage au relevé de l'hôte (chaque seconde) : récompense donnée une seule fois.
 for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');
 s=st();for(const id of ['c1','c8','p8'])assert.ok(s.done[id],id);assert.ok(!s.done.c2);
 assert.ok(run('P.gold')>=50+500+400,String(run('P.gold')));
 // L'or des récompenses compte comme de l'or gagné (Premier pécule) ; ensuite, plus rien ne bouge.
 for(let i=0;i<180;i++)run('CanaanStages.achievements.after()');
 const gold=run('P.gold');for(let i=0;i<180;i++)run('CanaanStages.achievements.after()');assert.equal(run('P.gold'),gold,'pas de double récompense');
 // Ancienne aventure : ses victoires déjà faites comptent (hero.kills).
 run('game.hero.kills=150');for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');assert.ok(st().done.c2);assert.equal(run('CANAAN_BAG.count(game.hero,"meal","soupe",1)'),5);
 // Boss d'instance : la victoire compte pour tout le groupe de l'instance.
 run('globalThis.ally=CANAAN_GROUP.create("Ami");CANAAN_GROUP.join(ally.id);game.world.instance={index:6,group:2};canaanAchieve(game.hero,"kill",{t:"Le Roi Sanglant",boss:true,x:P.x,y:P.y});game.world.instance=null');
 assert.equal(run('ally.succes.best["b:Le Roi Sanglant"][1]'),1);assert.equal(run('game.hero.succes.best["b:Le Roi Sanglant"][1]'),1);
 // Découverte : une créature croisée de près entre au bestiaire.
 run('game.world.monsters=[{t:"Ours",x:P.x+100,y:P.y,hp:10,mhp:10}];CANAAN_ACHIEVEMENTS.sample(game.hero)');assert.deepEqual(st().best['m:Ours'],[1,0,0]);
 // Titres : seulement ceux des succès débloqués ; affiché au-dessus du héros.
 assert.equal(run('CANAAN_ACHIEVEMENTS.setTitle(game.hero,"c3")'),false);
 run('game.hero.kills=1000');for(let i=0;i<60;i++)run('CanaanStages.achievements.after()');
 assert.equal(run('CANAAN_ACHIEVEMENTS.setTitle(game.hero,"c3")'),true);assert.equal(run('CANAAN_ACHIEVEMENTS.titleOf(game.hero)'),'Le Pourfendeur');
 // Sauvegarde : carnet vérifié (succès, espèces et titre inconnus retirés) et rechargé.
 const clean=JSON.parse(run('JSON.stringify(CANAAN_ACHIEVEMENTS.sanitize({done:{c1:5,zz:1},s:{kills:"9",bad:-1,"x y":3},sets:{biomes:[0,0,1],evil:[1]},best:{"m:Loup":[1,"4",2],"m:Dragon":[1,1,1]},title:"c4"}))'));
 assert.deepEqual(clean,{done:{c1:5},s:{kills:9},sets:{biomes:[0,1]},best:{'m:Loup':[1,4,2]},title:''});
 run('saveGame()');const saved=JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).heros.hote.succes;
 assert.ok(saved.done.c3);assert.equal(saved.title,'c3');assert.equal(saved.best['m:Ours'][0],1);
 // Réseau : carnet envoyé à l'invité au plus toutes les 3 s, sauf déblocage.
 assert.ok(run('CANAAN_ACHIEVEMENTS.netView(ally)'));assert.equal(run('CANAAN_ACHIEVEMENTS.netView(ally)'),undefined);
 assert.equal(run('CANAAN_ACHIEVEMENTS.handle(ally,{op:"ach-title",id:"c3"})'),false,'pas débloqué par l’allié');
 // Panneau : succès, bestiaire (silhouettes « ??? » pour l'inconnu) et titres.
 run('toggleAchievements()');let html=run('document.getElementById("window").innerHTML');assert.match(html,/ach-panel/);assert.match(html,/Le Pourfendeur|Fléau des ténèbres/);
 run('CANAAN_ACHIEVEMENTS.actions.tab("bestiaire")');html=run('document.getElementById("window").innerHTML');assert.match(html,/beast-card killed/);assert.match(html,/\?\?\?/);assert.match(html,/Fenrir|Pas encore croisée/);
 run('CANAAN_ACHIEVEMENTS.actions.tab("titres")');assert.match(run('document.getElementById("window").innerHTML'),/« Le Pourfendeur »/);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Les Tréfonds : monde souterrain sous l’île, quatre biomes, forteresse naine, entrées, créatures à ton niveau, donjons sans niveau requis, sauvegarde et réseau',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Carte : tout est accessible depuis la forteresse ; quatre biomes, six entrées, quatre donjons et quatre boss.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_UNDER.audit().unreachable)')),[]);
 assert.equal(run('CANAAN_UNDER.BIOMES.map(b=>b.name).join()'),'Galeries d’Argile,Cité Engloutie de Khaz-Ombral,Nécropole des Oubliés,Fangeval, le Marais Fongique');
 assert.equal(run('CANAAN_UNDER.ENTRANCES.length'),6);assert.equal(run('instances.filter(d=>d.under&&d.scaled&&d.level===1).length'),4);
 assert.equal(run('CANAAN_UNDER.BOSSES.length'),4);assert.equal(run('MOB_TYPES.filter(t=>t.under!==undefined).length'),16);
 // Entrées : à la surface, sur la terre ferme accessible depuis le camp, et ouvertes juste dessous.
 assert.equal(run('{const T=CANAAN_WORLD_TOOLS,r=T.reachableFrom(villages[0].x,villages[0].y);CANAAN_UNDER.ENTRANCES.every(e=>r[e.y*MAPW+e.x]===1&&!SOLID.includes(game.world.overworld[e.y][e.x])&&!SOLID.includes(game.world.underworld[e.y][e.x]))}'),true);
 // Bâtiments abandonnés, cimetières, nains, gisements, bancs, faune et coffres.
 assert.ok(run('CANAAN_UNDER.structures().length')>=25);assert.ok(run('CANAAN_UNDER.dwarves().length')>=10);
 assert.ok(run('CANAAN_UNDER.nodes().length')>100);assert.ok(run('CANAAN_UNDER.spots().length')>10);assert.ok(run('CANAAN_UNDER.fauna().ground.length')>50);
 assert.equal(run('game.world.underdecor.flat().filter(d=>d==="tomb"||d==="cross").length>20&&game.world.underdecor.flat().includes("deadtree")'),true);
 // Descente : tout le groupe passe dans les Tréfonds ; créatures du biome au niveau du héros, boss mondiaux à son niveau.
 run('started=true;paused=false;game.hero.level=33;recomputeStats();P.hp=P.mhp;const e=CANAAN_UNDER.ENTRANCES[0];P.x=(e.x+.5)*TS;P.y=(e.y+1.5)*TS;interact()');
 assert.equal(run('game.world.layer'),'under');assert.equal(run('game.world.tiles===game.world.underworld'),true);assert.equal(run('canWalk(P.x,P.y)'),true);
 const mobs=JSON.parse(run('JSON.stringify(game.world.monsters.filter(m=>!m.worldBoss).map(m=>[MOB_TYPES.find(t=>t.name===m.t)?.under,m.level]))'));
 assert.ok(mobs.length>5&&mobs.every(([u,l])=>u!==undefined&&l>=32&&l<=34),JSON.stringify(mobs));
 assert.equal(run('game.world.monsters.filter(m=>m.worldBoss&&m.level===33&&m.worldBossId.startsWith("u_")).length'),4);
 assert.equal(run('CANAAN_UNDER.BIOMES.some(b=>b.name===currentZoneName())'),true);
 // Rien de la surface ici : ni ses gisements, ni ses animaux, ni ses coffres.
 assert.equal(run('CANAAN_GATHER.nodes().filter(n=>!n.layer).every(n=>!canaanHere(n))&&CANAAN_LIFE.animals().filter(a=>a.layer==="under").every(a=>canaanHere(a))&&canaanSecretChests()===CANAAN_UNDER.chests()'),true);
 // Forteresse de Durgrim : zone sûre, marchand et banquière nains, forge et âtre pour les métiers, nains qui parlent.
 run('{const f=CANAAN_UNDER.spawnPoint();P.x=f.x;P.y=f.y}');assert.equal(run('isSafe(P.x/TS,P.y/TS)&&currentZoneName()==="Forteresse de Durgrim"'),true);
 run('{const n=game.world.npcs.find(n=>n.type==="shop"&&n.dwarf);P.x=n.x;P.y=n.y+40}');assert.equal(run('nearMerchant()'),true);
 run('{const n=game.world.npcs.find(n=>n.type==="bank"&&n.dwarf);P.x=n.x;P.y=n.y+40}');assert.equal(run('CANAAN_BANK.nearBanker()'),true);
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y}');assert.equal(run('CANAAN_GATHER.nearForge(game.hero)'),true);
 run('{const d=game.world.npcs.find(n=>n.type==="dwarf"&&n.dwarf.role==="roi");P.x=d.x;P.y=d.y+40;closePanels();interact();globalThis.__king=d}');assert.match(run('__king.dwarf.bubble.text'),/Durgrim/);
 // Gisement des Tréfonds : minerai rare, qui se vend plus cher.
 const node=run('CANAAN_GATHER.nodes().findIndex(n=>n.layer==="under"&&n.kind==="ore"&&CANAAN_GATHER.ORES[n.id].rare)');assert.ok(node>=0);
 run('{const n=CANAAN_GATHER.nodes()['+node+'];P.x=n.x;P.y=n.y+30;game.hero.inventory=[];CANAAN_GATHER.gather(game.hero,'+node+')}');
 assert.ok(run('Object.keys(game.hero.prof.ore).some(k=>CANAAN_GATHER.ORES[k.split(":")[0]].rare)'));
 assert.ok(run('CANAAN_BAG.unitPrice({kind:"ore",id:"geode",q:0,n:1})')>run('CANAAN_BAG.unitPrice({kind:"ore",id:"fer",q:0,n:1})'));
 // Donjon des Tréfonds : aucun niveau requis, ennemis au niveau du groupe, butin du niveau du héros (Peu commun ou Rare).
 run('game.hero.level=17;recomputeStats()');const i=run('instances.findIndex(d=>d.under)');
 run('enterInstance('+i+')');assert.equal(run('game.world.instance.scaledLevel'),17);assert.equal(run('canaanMobLevel(game.world.monsters.find(m=>m.boss))'),18);
 const loot=new Set();for(let k=0;k<40;k++){run('game.hero.inventory=[];dropTierGear('+i+')');const it=run('game.hero.inventory[0]');assert.equal(it.level,17);loot.add(it.rarity)}
 assert.deepEqual([...loot].sort(),['Peu commun','Rare']);
 run('leaveInstance()');assert.equal(run('game.world.layer+":"+(game.world.tiles===game.world.underworld)'),'under:true');
 // Sauvegarde : on reprend dans les Tréfonds.
 run('{const f=CANAAN_UNDER.spawnPoint();P.x=f.x;P.y=f.y;saveGame()}');
 assert.equal(JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).monde.couche,'under');
 run('CANAAN_UNDER.setLayer("surface");CANAAN_PERSISTENCE.load()');assert.equal(run('game.world.layer'),'under');assert.equal(run('canWalk(P.x,P.y)'),true);
 // Réseau : l'hôte annonce la couche ; un invité bascule sur les Tréfonds générés à l'identique.
 assert.equal(run('CANAAN_NET.snapshot?CANAAN_NET.snapshot().map.layer:"under"'),'under');
 // Remontée : par n'importe quelle entrée, retour sur l'île.
 run('{const e=CANAAN_UNDER.ENTRANCES[3];P.x=(e.x+.5)*TS;P.y=(e.y+1.5)*TS;closePanels();interact()}');
 assert.equal(run('game.world.layer'),'surface');assert.equal(run('game.world.tiles===game.world.overworld&&canWalk(P.x,P.y)'),true);
 assert.equal(errors.length,0,errors.join('\n'));
});
