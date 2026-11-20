// @ts-check
// Règles économiques : qualité du butin par source, prix de vente et de la boutique.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { GEAR_RARITIES, PRESTIGE_DROPS } from '../data/equipment.js';
import {
  BAG_BASE,
  BAG_PRICES,
  BAG_STEP,
  INSTANCE_CHEST_GOLD,
  MOB_GOLD,
  WORLD_BOSS_GOLD
} from '../data/economy.js';
import { clampLevel } from './stats.js';
import { rarityInfo } from './items.js';

// Qualité d'un butin hors instance selon sa source.
/**
 * @param {string} source
 */
export function lootRarity(source) {
  if (source === 'dungeon' || source === 'tier') return GEAR_RARITIES[2];
  return GEAR_RARITIES[1];
}
// Or rendu pour les anciens matériaux de forge d'une sauvegarde (minerai, bois, essence, noyau), qui n'existent plus.
/**
 * @param {any} materials anciens matériaux lus d'une sauvegarde (non fiable)
 * @param {Readonly<Record<string, number>>} prices
 * @returns {number}
 */
export function legacyMaterialGold(materials, prices) {
  if (!materials || typeof materials !== 'object') return 0;
  let gold = 0;
  for (const [key, price] of Object.entries(prices)) {
    // Valeurs invalides (texte, infini, négatif) ignorées ; quantité plafonnée à un million.
    const n = Math.floor(Number(materials[key]));
    if (Number.isFinite(n) && n > 0) gold += Math.min(n, 1e6) * price;
  }
  return gold;
}
// Prix de vente au marchand : selon le niveau de l'objet et le multiplicateur de qualité (5 or au minimum).
/**
 * @param {import('../types.js').Item | null | undefined} item
 * @param {unknown} level
 * @returns {number}
 */
export function sellValue(item, level) {
  return Math.max(5, Math.round((6 + 7 * Math.max(1, Number(level) || 1)) * rarityInfo(item).mult));
}
// Prix de l'équipement vert du marchand, selon le niveau du héros.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function shopPriceAt(level) {
  return 60 + Math.round(Math.max(1, Number(level) || 1) * 9);
}
// Qualité de prestige tirée pour un butin (null : la qualité normale de la source). Un seul tirage : chaque qualité
// occupe sa part, de la plus rare à la plus courante, si bien que les chances affichées sont les chances réelles.
/**
 * @param {string | undefined} kind clé de PRESTIGE_DROPS (raidHeroic, arenaFinal, underground…)
 * @param {() => number} rng
 * @returns {string | null}
 */
export function rollPrestige(kind, rng) {
  const list = PRESTIGE_DROPS[kind ?? ''] || [];
  if (!list.length) return null;
  const roll = rng();
  let edge = 0;
  for (const [rarity, chance] of list) if (roll < (edge += chance)) return rarity;
  return null;
}
// Butin garanti d'un coffre de boss d'instance : récompense de l'instance (ou de la difficulté jouée), niveau tiré
// entre le niveau requis et le niveau de butin (niveau du héros dans un donjon des Tréfonds), puis qualité, avec sa
// chance de prestige. Les tirages se font dans cet ordre : niveau, puis prestige.
/**
 * @param {any} def instance (INSTANCE_DEFS)
 * @param {any} difficulty récompense de la difficulté jouée, pour une instance à difficultés (null sinon)
 * @param {number} heroLevel
 * @param {() => number} rng
 * @returns {{ level: number, rarity: string, origin: 'raid' | 'donjon' }}
 */
export function instanceLoot(def, difficulty, heroLevel, rng) {
  const reward = def.difficulties ? difficulty || def.difficulties.normal : def;
  const level = def.scaled
      ? clampLevel(heroLevel)
      : reward.level + Math.floor(rng() * (reward.dropLevel - reward.level + 1)),
    rarity = rollPrestige(reward.prestige, rng) || reward.rarity;
  return { level, rarity, origin: def.raid ? 'raid' : 'donjon' };
}
// Qualité de l'objet lâché par une source (SOURCE_REWARDS), ou null si elle ne lâche rien cette fois. Qualité
// garantie (rarity) : aucun tirage. Butin tiré : d'abord la chance d'un objet, puis la qualité selon les poids.
/**
 * @param {{ rarity?: string | null, chance?: number, rarities?: ReadonlyArray<readonly [string, number]> }} reward
 * @param {() => number} rng
 * @returns {string | null}
 */
export function sourceDrop(reward, rng) {
  if (!reward.rarities) return reward.rarity || null;
  if (rng() >= (reward.chance ?? 1)) return null;
  const total = reward.rarities.reduce((n, [, w]) => n + w, 0);
  let roll = rng() * total;
  for (const [rarity, weight] of reward.rarities) if ((roll -= weight) < 0) return rarity;
  return reward.rarities[reward.rarities.length - 1][0];
}
// Or lâché par un monstre de son niveau (élite : plus).
/**
 * @param {unknown} level
 * @param {boolean} [elite]
 * @returns {number}
 */
export function mobGold(level, elite = false) {
  const lv = Math.max(1, Number(level) || 1);
  return Math.round((MOB_GOLD.base + MOB_GOLD.perLevel * lv) * (elite ? MOB_GOLD.elite : 1));
}
// Tirage entier entre lo et hi (bornes comprises).
/**
 * @param {number} lo
 * @param {number} hi
 * @param {() => number} rng
 */
const between = (lo, hi, rng) => lo + Math.floor(rng() * (hi - lo + 1));
// Bourse d'or d'un boss mondial, selon son niveau.
/**
 * @param {unknown} level
 * @param {() => number} rng
 * @returns {number}
 */
export function worldBossGold(level, rng) {
  const lv = Math.max(1, Number(level) || 1),
    lo = Math.round(WORLD_BOSS_GOLD.base + WORLD_BOSS_GOLD.perLevel * lv);
  return between(lo, Math.round(lo * WORLD_BOSS_GOLD.spread), rng);
}
// Bourse d'or du coffre de fin d'instance (donjon ou raid ; plus en héroïque).
/**
 * @param {boolean} raid
 * @param {boolean} heroic
 * @param {() => number} rng
 * @returns {number}
 */
export function instanceChestGold(raid, heroic, rng) {
  const [lo, hi] = raid ? INSTANCE_CHEST_GOLD.raid : INSTANCE_CHEST_GOLD.dungeon,
    k = heroic ? INSTANCE_CHEST_GOLD.heroic : 1;
  return between(Math.round(lo * k), Math.round(hi * k), rng);
}
// Niveau d'agrandissement du sac le plus haut.
export const BAG_MAX_LEVEL = BAG_PRICES.length;
// Niveau d'agrandissement valide (0 à BAG_MAX_LEVEL) ; toute valeur invalide vaut 0.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function clampBagLevel(level) {
  const n = Math.floor(Number(level));
  return Number.isFinite(n) ? Math.max(0, Math.min(BAG_MAX_LEVEL, n)) : 0;
}
// Places du sac à ce niveau d'agrandissement.
/**
 * @param {unknown} level
 * @returns {number}
 */
export function bagSlots(level) {
  return BAG_BASE + clampBagLevel(level) * BAG_STEP;
}
