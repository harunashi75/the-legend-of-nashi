// Point d'entrée des modules ES, regroupés par esbuild en un seul bloc du HTML autonome.
// Pont transitoire : tant que tous les fichiers ne sont pas convertis, les exports des modules
// partagés sont aussi exposés en variables globales pour les anciens scripts (scripts/*.js).
// Chaque conversion ajoute ici son module ; le pont disparaîtra quand plus aucun ancien script n'en dépendra.
import * as equipment from './shared/data/equipment.js';
import * as itemNames from './shared/data/item-names.js';
import * as rubis from './shared/data/rubis.js';
import * as arena from './shared/data/arena.js';
import * as world from './shared/data/world.js';
import * as economy from './shared/data/economy.js';
import * as classes from './shared/data/classes.js';
import * as statsData from './shared/data/stats.js';
import * as statRules from './shared/rules/stats.js';
import * as itemRules from './shared/rules/items.js';
import * as economyRules from './shared/rules/economy.js';
import * as classRules from './shared/rules/classes.js';
import * as quests from './shared/data/quests.js';
import * as questRules from './shared/rules/quests.js';
import * as saveSchema from './shared/save/schema.js';
import * as combatRules from './shared/rules/combat.js';
import * as netMessages from './shared/net/messages.js';
import * as looks from './shared/data/looks.js';
import * as skins from './shared/data/skins.js';

Object.assign(globalThis, equipment, itemNames, rubis, arena, world, economy, classes, statsData, statRules, itemRules, economyRules, classRules, quests, questRules, saveSchema, combatRules, netMessages, looks, skins);
