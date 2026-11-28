// Types de l'état d'une partie pour les scripts classiques (scripts/jsconfig.json), écrits à la main.
// Fichier de déclarations global (aucun import ni export au premier niveau) : ses noms sont visibles de tous les
// scripts. Les champs connus sont typés ; la signature [clé: string]: any garde, le temps de la migration, les
// champs qu'un système ajoute à un objet partagé (un monstre de boss, un héros invité…). À resserrer champ par champ.

/** Objet d'équipement ou du sac (shared/types.js), avec les champs propres à certains objets (piles, clés…). */
type CanaanItem = import('../shared/types.js').Item & { [key: string]: any };

/** Tout ce qui se tient quelque part sur la carte : PNJ, coffre, butin, projectile, gisement… */
interface CanaanEntity {
  x: number;
  y: number;
  /** 'under' : dans les Tréfonds ; absent : à la surface. */
  layer?: string;
  [key: string]: any;
}

/** Monstre, élite ou boss (game.world.monsters). */
interface CanaanMonster extends CanaanEntity {
  /** Nom affiché (et clé de son type de monstre). */
  t: string;
  hp: number;
  mhp: number;
  r?: number;
  level?: number;
  boss?: boolean;
  worldBoss?: boolean;
  worldBossId?: string;
}

/** Personnage d'un héros sur la carte : position, PV, mana, or (l'objet P de game-core pour l'hôte). */
interface CanaanPlayer extends CanaanEntity {
  vx: number;
  vy: number;
  hp: number;
  mhp: number;
  mp: number;
  mmp: number;
  gold: number;
  face: number;
  dead: boolean;
}

/** Intention du joueur pour le prochain pas (clavier, manette, tactile, ou réseau pour un invité). */
interface CanaanIntent {
  dx: number;
  dy: number;
  attack: 'quick' | 'heavy' | null;
  skill: number | null;
  aimX: number;
  aimY: number;
  [key: string]: any;
}

/** Un héros : l'hôte (game.hero) ou un allié (canaanCreateHero). */
interface CanaanHero {
  name?: string;
  /** Rattaché à la création du personnage (P de game-core pour l'hôte), avant toute lecture. */
  player: CanaanPlayer;
  level: number;
  exp: number;
  inventory: CanaanItem[];
  equipment: Record<string, CanaanItem | null>;
  kills: number;
  intent: CanaanIntent;
  classe: { id: string | null; talents: string[]; [key: string]: any };
  /** Progression des quêtes (complétée par quests.js : stateOf, sanitizeQuests). */
  quetes: { [key: string]: any };
  artefacts: { ranks: Record<string, number>; equipped: (string | null)[] };
  arena: { best: number; attempts: number; completed: boolean; lastBoss: string };
  prof: { [key: string]: any };
  [key: string]: any;
}

/** Monde de l'aventure : cartes, entités simulées, coffres, boss de monde, instance en cours. */
interface CanaanWorld {
  /** Grille affichée (île, Tréfonds ou instance) ; créée avant toute lecture. */
  tiles: number[][];
  decor: any[][];
  /** Île et Tréfonds : posés à la génération, avant toute lecture. */
  overworld: number[][];
  overdecor: any[][];
  underworld: number[][];
  underdecor: any[][];
  layer: 'surface' | 'under';
  returnLayer: 'surface' | 'under';
  monsters: CanaanMonster[];
  projectiles: CanaanEntity[];
  drops: CanaanEntity[];
  npcs: CanaanEntity[];
  chests: CanaanEntity[];
  openedChests: string[];
  worldBossTimers: Record<string, number>;
  /** Donjon, raid ou Arène en cours ; null dans le monde extérieur. */
  instance: any;
  returnPos: any;
  clock: number;
  [key: string]: any;
}

/** Relais d'affichage de la simulation (game-core y branche l'interface). */
interface CanaanView {
  notify(message: string, ...rest: any[]): any;
  chat(who: string, message: string, ...rest: any[]): any;
  remote(hero: CanaanHero, message: string, ...rest: any[]): any;
  fx(...args: any[]): any;
}

/** L'objet game (game-state.js). */
interface CanaanGame {
  /** solo, host (salon ouvert) ou guest (connecté au monde d'un hôte). */
  mode: 'solo' | 'host' | 'guest';
  hero: CanaanHero;
  heroes: CanaanHero[];
  guests: Record<string, any>;
  world: CanaanWorld;
  view: CanaanView;
  [key: string]: any;
}

// Champs ajoutés par le jeu à des objets du navigateur.
interface HTMLCanvasElement {
  /** Grain des décors déjà appliqué (canaanPolish) : la toile n'est pas repeinte deux fois. */
  canaanPolished?: boolean;
}
interface KeyboardEvent {
  /** Action de la manette qui a produit cette touche (gamepad.js). */
  canaanAction?: string;
}
