// État d'une partie : l'objet game regroupe ce qui appartient au monde et aux héros.
// Phase 2 de la conception du coopératif : l'état est un objet passé aux fonctions, plus des variables éparses.
// game.hero est le héros de l'hôte. Les invités rejoindront game plus tard, chacun avec le même format de héros.
// Métiers d'un héros neuf : profFresh (shared/rules/professions.js).
// Types : CanaanGame, CanaanHero, CanaanWorld… (scripts/types.d.ts).
/** @type {CanaanGame} */
const game = {
  // solo, host (salon ouvert à des invités) ou guest (connecté au monde d'un hôte, sans simulation locale).
  mode: 'solo',
  hero: {
    // Position, PV, mana, or : l'objet P de canaan-game-core y est rattaché à sa création.
    player: null,
    // Niveau du personnage (1 à 60) et expérience vers le niveau suivant (progression.js).
    level: 1,
    exp: 0,
    // Inventaire et équipement de départ.
    inventory: [{ id: 'armor1', name: 'Tunique du voyageur', slot: 'armor', level: 1, rarity: 'Commun' }],
    equipment: {
      weapon: null,
      armor: null,
      helm: null,
      boots: null,
      shoulders: null,
      gloves: null,
      neck: null,
      ring: null,
      ring2: null
    },
    // Compteur de victimes.
    kills: 0,
    // Intention du joueur pour le prochain pas : direction voulue (-1 à 1), attaque de base maintenue
    // ('quick', 'heavy' ou null) et point visé. L'interface la remplit (clavier, tactile, souris) ;
    // un invité l'enverra par le réseau.
    intent: { dx: 0, dy: 0, attack: null, skill: null, aimX: 0, aimY: 0 },
    // Classe (Druide, Paladin, Assassin, Élémentaliste) et talents équipés (5 au plus, selon le niveau).
    classe: { id: null, talents: [] },
    // Quêtes et histoire (shared/rules/quests.js : sanitizeQuests).
    quetes: { active: {}, done: {}, flags: {}, choices: {}, track: null, troc: 0, shells: [], paid: 0 },
    // Artéfacts de l'Arène : rang de chaque artéfact possédé et quatre emplacements.
    artefacts: { ranks: {}, equipped: [null, null, null, null] },
    // Records de l'Arène des Épreuves.
    arena: { best: 0, attempts: 0, completed: false, lastBoss: '' },
    // Métiers : pêche et cuisine (niveaux, poissons, repas).
    prof: profFresh()
  },
  // Monde de l'aventure : carte, entités simulées, coffres, boss de monde et instance en cours.
  // Les particules et les textes flottants n'en font pas partie : ce sont des effets d'affichage.
  world: {
    // Grille de tuiles et décor affichés ; canaan-game-core crée l'océan initial, canaan-world-generation l'île.
    tiles: [],
    decor: [],
    // Carte extérieure, gardée pendant une instance pour y revenir.
    overworld: null,
    overdecor: null,
    // Les Tréfonds, sous l'île (underground.js) : même taille et mêmes coordonnées que l'île.
    underworld: null,
    underdecor: null,
    // Couche affichée : 'surface' (l'île) ou 'under' (les Tréfonds) ; couche de retour d'une instance.
    layer: 'surface',
    returnLayer: 'surface',
    monsters: [],
    projectiles: [],
    drops: [],
    npcs: [],
    // Coffres présents dans la zone courante, et coffres secrets déjà ouverts (sauvegardés).
    chests: [],
    openedChests: [],
    // Fin de réapparition de chaque boss de monde (sauvegardé).
    worldBossTimers: {},
    // Donjon, raid ou Arène en cours (null dans le monde extérieur) et position de retour.
    instance: null,
    returnPos: null,
    clock: 0
  },
  // Héros présents dans l'aventure : l'hôte d'abord (ci-dessous), puis les invités présents (3 au plus).
  heroes: [],
  // Invités enregistrés dans l'aventure (présents ou non), par identifiant : 6 au plus (canaan-group).
  guests: {},
  // Relais d'affichage : ce que la simulation veut montrer (messages, chat). Sans interface, rien n'est affiché
  // et la simulation n'accède jamais à l'écran ; canaan-game-core y branche ses fonctions d'affichage.
  view: { notify() {}, chat() {}, remote() {}, fx() {} }
};
game.heroes.push(game.hero);
// Crée un héros au format de game.hero : équipement vide, sac vide, aucun talent ni artéfact.
// Ses PV maximum viennent de son équipement ; il n'est ajouté à game.heroes que par l'appelant.
/**
 * @param {{ name?: string, x?: number, y?: number, equipment?: Record<string, CanaanItem | null> }} [options]
 * @returns {CanaanHero}
 */
function canaanCreateHero({ name = 'Allié', x, y, equipment = {} } = {}) {
  const hero = {
    name,
    player: {
      x,
      y,
      vx: 0,
      vy: 0,
      hp: 1,
      mhp: 1,
      mp: CANAAN_BASE_MANA,
      mmp: CANAAN_BASE_MANA,
      gold: 0,
      face: 1,
      anim: 0,
      atk: 0,
      dead: false
    },
    level: 1,
    exp: 0,
    inventory: [],
    equipment: {
      weapon: null,
      armor: null,
      helm: null,
      boots: null,
      shoulders: null,
      gloves: null,
      neck: null,
      ring: null,
      ring2: null,
      ...equipment
    },
    // Niveau du sac d'un allié : 0 = 10 places, jusqu'à 9 = 100 places (comme l'hôte, mêmes prix).
    bagLevel: 0,
    kills: 0,
    intent: { dx: 0, dy: 0, attack: null, skill: null, aimX: x, aimY: y },
    classe: { id: null, talents: [] },
    quetes: { active: {}, done: {}, flags: {}, choices: {}, track: null, troc: 0, shells: [], paid: 0 },
    artefacts: { ranks: {}, equipped: [null, null, null, null] },
    arena: { best: 0, attempts: 0, completed: false, lastBoss: '' },
    prof: profFresh()
  };
  hero.player.mhp = hero.player.hp = characterStats(hero).maxHp;
  return hero;
}
// Capacité du sac d'un héros : celle de l'hôte suit ses agrandissements (BAG_LIMIT) ; un allié commence comme lui
// et s'agrandit de la même façon (bagSlots, shared/rules/economy.js).
function canaanBagLevel(hero) {
  return clampBagLevel(hero.bagLevel);
}
function canaanBagLimit(hero) {
  return hero === game.hero ? BAG_LIMIT : bagSlots(canaanBagLevel(hero));
}
// Message de butin : à l'écran pour l'hôte, dans le chat pour un allié.
// Un invité en ligne reçoit aussi le message sur son écran (game.view.remote, branché par canaan-net).
// Couche du monde : true dans les Tréfonds (hors instance). canaanHere : la chose (PNJ, gisement, coffre, animal)
// est sur la couche affichée (sans champ layer : à la surface).
function canaanUnder() {
  return game.world.layer === 'under' && !game.world.instance;
}
function canaanHere(o) {
  return (o?.layer === 'under') === (game.world.layer === 'under');
}
// Exploits pour les succès (achievements.js remplace ce relais vide une fois chargé).
/**
 * @param {CanaanHero} hero
 * @param {string} type
 * @param {...any} details
 */
function canaanAchieve(hero, type, ...details) {}
function canaanLootNotice(hero, message) {
  if (hero === game.hero) return game.view.notify(message);
  game.view.chat('Butin', hero.name + ' — ' + message);
  if (hero.peer) game.view.remote?.(hero, message);
}
