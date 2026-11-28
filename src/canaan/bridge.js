// Point d'entrée des modules ES, regroupés par esbuild en un seul bloc du HTML autonome.
// Pont transitoire : tant que tous les fichiers ne sont pas convertis, les exports des modules
// partagés (shared/) et des modules client convertis (client/) sont aussi exposés en variables globales pour les
// anciens scripts (scripts/*.js).
// Chaque conversion ajoute ici son module ; le pont disparaîtra quand plus aucun ancien script n'en dépendra.
import * as equipment from './shared/data/equipment.js';
import * as itemNames from './shared/data/item-names.js';
import * as arenaArtefacts from './shared/data/arena-artefacts.js';
import * as arena from './shared/data/arena.js';
import * as world from './shared/data/world.js';
import * as economy from './shared/data/economy.js';
import * as classes from './shared/data/classes.js';
import * as statsData from './shared/data/stats.js';
import * as statRules from './shared/rules/stats.js';
import * as itemRules from './shared/rules/items.js';
import * as economyRules from './shared/rules/economy.js';
import * as classRules from './shared/rules/classes.js';
import * as resourceRules from './shared/rules/resources.js';
import * as quests from './shared/data/quests.js';
import * as interlude from './shared/data/quests-interlude.js';
import * as questRules from './shared/rules/quests.js';
import * as guildData from './shared/data/guild.js';
import * as saveSchema from './shared/save/schema.js';
import * as combatRules from './shared/rules/combat.js';
import * as netMessages from './shared/net/messages.js';
import * as looks from './shared/data/looks.js';
import * as skins from './shared/data/skins.js';
import * as mounts from './shared/data/mounts.js';
import * as houseData from './shared/data/house.js';
import * as houseRules from './shared/rules/house.js';
import * as campData from './shared/data/camp.js';
import * as undergroundData from './shared/data/underground.js';
import * as dungeonData from './shared/data/dungeons.js';
import * as professionData from './shared/data/professions.js';
import * as professionRules from './shared/rules/professions.js';
import * as puzzleData from './shared/data/puzzles.js';
import * as puzzleRules from './shared/rules/puzzles.js';
// Modules client convertis (src/canaan/client/) : navigateur, sans variable globale implicite.
// Kit de pixel art : un seul nom global (ses outils, rect, tint, noise…, ne deviennent pas des variables globales).
import { CANAAN_PIXEL_KIT } from './client/art/pixel-kit.js';
import * as iconArt from './client/icons/icon-art.js';
import * as icons from './client/icons/icons.js';
import * as skillIcons from './client/icons/skill-icons.js';
import * as buildingArt from './client/art/building-art.js';
import * as dwarfArt from './client/art/dwarf-art.js';
// Art des créatures : un seul nom global, comme le kit.
import { CANAAN_CREATURE_ART } from './client/art/creature-art.js';
// Arts convertis depuis les scripts classiques : un seul nom global chacun (leur API create() ou leurs dessins).
import { CANAAN_MOUNT_ART } from './client/art/mount-art.js';
import { CANAAN_CAMP_SPRITES } from './client/art/camp-sprites.js';
import { CANAAN_VFX_EFFECTS } from './client/art/vfx-effects.js';
import { CANAAN_HOUSE_FURNITURE } from './client/art/house-furniture.js';
import { CANAAN_DUNGEON_TILES } from './client/art/dungeon-tiles.js';
import { CANAAN_DUNGEON_DECOR } from './client/art/dungeon-decor.js';
import * as preferences from './client/preferences.js';
import * as music from './client/audio/music.js';
import * as gamepad from './client/input/gamepad.js';
import * as i18n from './client/i18n/i18n.js';

Object.assign(
  globalThis,
  equipment,
  itemNames,
  arenaArtefacts,
  arena,
  world,
  economy,
  classes,
  statsData,
  statRules,
  itemRules,
  economyRules,
  classRules,
  resourceRules,
  quests,
  interlude,
  questRules,
  guildData,
  saveSchema,
  combatRules,
  netMessages,
  looks,
  skins,
  mounts,
  houseData,
  houseRules,
  campData,
  undergroundData,
  dungeonData,
  professionData,
  professionRules,
  puzzleData,
  puzzleRules,
  { CANAAN_PIXEL_KIT },
  iconArt,
  icons,
  skillIcons,
  buildingArt,
  dwarfArt,
  { CANAAN_CREATURE_ART },
  { CANAAN_MOUNT_ART },
  { CANAAN_CAMP_SPRITES },
  { CANAAN_VFX_EFFECTS },
  { CANAAN_HOUSE_FURNITURE },
  { CANAAN_DUNGEON_TILES },
  { CANAAN_DUNGEON_DECOR },
  preferences,
  music,
  gamepad,
  i18n
);
