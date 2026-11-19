// Contexte commun des tests de régression : HTML assemblé, extraits de ses scripts et doubles de test.
// Chaque fichier tests/*.test.cjs importe seulement ce qu'il utilise ; node --test les lance en parallèle.
// Le HTML lu est celui de la version courante (npm run build), ou celui de la variable CANAAN_HTML.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
// Le HTML généré porte la version déclarée dans runtime-config.js.
const version = /CANAAN_VERSION\s*=\s*'([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'src', 'canaan', 'scripts', 'runtime-config.js'), 'utf8'))[1];
const builtFile = path.join(ROOT, 'CANAAN_ONLINE_V' + version.replace(/\./g, '_') + '.html');
const source = fs.readFileSync(process.env.CANAAN_HTML || builtFile, 'utf8');
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
    // Touches du clavier (keybinds.js, testé à part) : étiquettes par défaut.
    CANAAN_KEYS: {labelOf: id => ({skill1:'1',skill2:'2',skill3:'3',skill4:'4',special:'F'})[id] || '', is: () => false},
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
  vm.runInContext(section('function currentWeaponType()', "// Étape du pipeline : effets des sorts d'armes sur les monstres."), g);
  vm.runInContext(section("// Étape du pipeline : effets des sorts d'armes sur les monstres.", "// Fin des effets d'armes. Les PV des monstres viennent de leur niveau (monster-scaling.js)."), g);
  vm.runInContext(script('canaan-weapon-actions'), g);
  vm.runInContext(script('canaan-stats'), g);
  vm.runInContext(script('canaan-class-talents'), g);
  vm.runInContext(script('canaan-summons'), g);g.refreshWeaponBar();
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
  g.CANAAN_BANK={export:h=>h.bank||{items:[],stacks:{}},withBankedRubis:(b,r)=>r,sanitize:b=>b&&Array.isArray(b.items)?b:{items:[],stacks:{}}};
  // Sacoche de butin : conservée telle quelle (le vrai module est testé à part).
  g.CANAAN_SALVAGE={of:h=>h.satchel||[],export:h=>(h.satchel||[]).slice(),sanitize:v=>Array.isArray(v)?v:[]};
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
// Coup de compétence offensive (contexte d'un lancement) et attaque normale.
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);
const skillHit=(el=null)=>({skill:true,offensive:true,element:el,multiplier:1});
const basicHit={basic:true,magic:false};
function PIXEL_PLACES_COUNT(run){return run('PIXEL_PLACES.length')}
// Groupe de quatre héros (hôte à l'épée, alliés à la lance, à l'arc et à la hache), équipés au même niveau.
// Groupe de quatre héros du niveau donné, chacun équipé d'objets de ce niveau et de cette qualité.
function groupInDungeon(level,rarity){
 const boot=require('./canaan-runtime.cjs')(source),{run}=boot;
 run(fs.readFileSync(path.join(__dirname,'group-bot.js'),'utf8'));
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

module.exports = {
  fs,
  vm,
  assert,
  path,
  version,
  builtFile,
  source,
  scripts,
  script,
  section,
  linkGameState,
  element,
  game,
  modifiers,
  storageGame,
  mob,
  predictable,
  same,
  skillHit,
  basicHit,
  PIXEL_PLACES_COUNT,
  groupInDungeon,
  playInstance
};
