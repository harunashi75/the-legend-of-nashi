// Pipeline de simulation et de rendu, exécuté par la boucle de jeu.
// Une étape de mise à jour peut définir before() et after(state) ; before() renvoie l'état reçu par after().
// Les étapes sont listées de l'intérieur vers l'extérieur : les before() s'exécutent
// de la dernière à la première, puis update() du cœur, puis les after() de la première à la dernière.
const CANAAN_PIPELINE = Object.freeze({
  update: Object.freeze([
    'companions',
    'weaponEffects',
    'mobScaling',
    'bossScaling',
    'weaponVfx',
    'facing',
    'classes',
    'dodge',
    'basicAttack',
    'rubis',
    'arena',
    'professions',
    'quests',
    'bossMechanics'
  ]),
  draw: Object.freeze(['drawWeaponEffects', 'drawClassEffects', 'drawQuests', 'drawBossMechanics', 'drawDodge', 'drawArenaHud'])
});
// Un pas de simulation complet (cœur et étapes), sans lire les entrées ni toucher à l'écran.
// Le monde continue tant qu'un héros du groupe est debout (Arène : l'hôte à terre attend d'être relevé).
const canaanAnyoneStanding = () => game.heroes.some(hero => !hero.player.dead);
function simulateStep() {
  // Aucune simulation hors partie, en pause, ou quand tout le groupe est à terre.
  if (!started || paused || !canaanAnyoneStanding()) return;
  const stages = CANAAN_PIPELINE.update.map(name => CanaanStages[name]),
    states = [];
  for (let i = stages.length - 1; i >= 0; i--) states[i] = stages[i].before?.();
  update();
  stages.forEach((stage, i) => stage.after?.(states[i]));
}
// Pas de jeu : les entrées du joueur deviennent l'intention du héros, puis la simulation avance.
function runUpdatePipeline() {
  if (!started || paused || !canaanAnyoneStanding()) return;
  readInput();
  simulateStep();
}
function runDrawPipeline() {
  draw();
  for (const name of CANAAN_PIPELINE.draw) CanaanStages[name]();
}
