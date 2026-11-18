// @ts-check
// Règles de combat pures : dégâts infligés et reçus par un héros (Défense, Résistance, déviation, critiques).
import { defenseReduction, levelGapFactor } from './stats.js';
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.

// Chance de coup critique d'un ennemi : boss de monde 13 %, boss 10 %, monstre 4 %.
/**
 * @param {{ worldBoss?: boolean, boss?: boolean } | null | undefined} enemy
 * @returns {number}
 */
export function enemyCritChance(enemy) {
  return enemy?.worldBoss ? 0.13 : enemy?.boss ? 0.1 : 0.04;
}
// Dégâts finaux d'un coup reçu par un héros. stats : statistiques du héros (heroStats : defense, resist, guard,
// dodge) ; attackerLevel : niveau de l'ennemi (la Défense compte moins contre un ennemi de haut niveau).
// rng est tiré deux fois, dans cet ordre : déviation (dégâts ÷ 2), puis coup critique ennemi (×1,5).
// critFactor réduit le bonus critique (Rubis Volonté, 1 sinon).
/**
 * @param {number} raw dégâts bruts
 * @param {{ defense: number, resist?: number, guard?: number, dodge?: number }} stats
 * @param {number} attackerLevel
 * @param {() => number} rng
 * @param {number} critChance dans [0, 1]
 * @param {number} [critFactor]
 * @returns {{ damage: number, deflected: boolean, crit: boolean }}
 */
export function mitigateIncoming(raw, stats, attackerLevel, rng, critChance, critFactor = 1) {
  let damage =
      raw *
      (1 - defenseReduction(stats.defense, attackerLevel)) *
      (1 - Math.min(90, Math.max(0, stats.resist || 0)) / 100) *
      (1 - Math.min(90, Math.max(0, stats.guard || 0)) / 100),
    deflected = false,
    crit = false;
  if (rng() < (stats.dodge || 0) / 100) {
    damage *= 0.5;
    deflected = true;
  }
  if (rng() < critChance) {
    damage *= 1 + 0.5 * critFactor;
    crit = true;
  }
  return { damage: Math.max(1, Math.round(damage)), deflected, crit };
}

// Dégâts d'un coup infligé par un héros, avant l'application à la cible.
// value : dégâts de base ; stats : statistiques du héros (level, crit, critPower, damageBonus) ; target : le
// monstre (niveau, élite, boss) ; rng est tiré une fois, pour le critique.
// armorFactor et critFactor : Rubis du héros (Brise-armure, Précision), 1 sinon.
/**
 * @param {unknown} value dégâts de base
 * @param {{ level: number, crit: number, critPower: number, damageBonus?: number }} stats
 * @param {{ level?: number, elite?: boolean, boss?: boolean, worldBoss?: boolean }} target
 * @param {() => number} rng
 * @param {number} [armorFactor]
 * @param {number} [critFactor]
 * @returns {{ damage: number, crit: boolean }}
 */
export function resolveOutgoing(value, stats, target, rng, armorFactor = 1, critFactor = 1) {
  let damage = Math.max(1, Number(value) || 1) * (1 + Math.max(0, stats.damageBonus || 0) / 100);
  damage *= levelGapFactor(stats.level, target.level || stats.level);
  const tier = target.worldBoss ? 3 : target.boss ? 2 : target.elite ? 1.4 : 1;
  damage *= 1 - Math.min(0.3, 0.05 * tier) * armorFactor;
  const crit = rng() * 100 < stats.crit;
  if (crit) damage *= (1 + stats.critPower / 100) * critFactor;
  return { damage: Math.max(1, Math.round(damage)), crit };
}
// Puissance d'attaque d'un héros (dégâts de base de ses coups) d'après sa statistique d'attaque.
/**
 * @param {number} attack
 * @returns {number}
 */
export function heroPower(attack) {
  return Math.max(8, Math.round(18 + (attack - 18) * 0.75 + attack * 0.25));
}
// Puissance magique d'un héros (bâton) : la même que la Puissance d'attaque (l'Intelligence n'existe plus sur
// les objets ; elle s'ajoute si un effet en donne). Le bâton n'est plus 40 % plus faible que les autres armes.
/**
 * @param {number} attack
 * @param {number} [intellect]
 * @returns {number}
 */
export function heroMagicPower(attack, intellect = 0) {
  return Math.max(8, Math.round(heroPower(attack) + Math.max(0, intellect) * 0.85));
}
// Corps touchable d'un monstre : un axe vertical des pieds (m.x, m.y) jusqu'à la tête, épaissi d'un rayon. Les
// coups du héros visent la silhouette entière, pas seulement les pieds. L'échelle suit le dessin (sprite-kit.js).
/** @typedef {{ x: number, y: number, r?: number, boss?: boolean, worldBoss?: boolean, elite?: boolean, scale?: number }} BodyMob */
/**
 * @param {BodyMob} m
 * @returns {number}
 */
export function canaanMobScale(m) {
  return m.boss ? m.scale || 3.3 : m.worldBoss ? 3.6 : m.elite ? 1.95 : 1.5;
}
/**
 * @param {BodyMob} m
 * @returns {{ height: number, radius: number }}
 */
export function canaanBody(m) {
  const scale = canaanMobScale(m);
  return { height: 42 * scale * 0.7, radius: Math.max(m.r || 0, 34 * scale * 0.28) };
}
// Écart entre un point et la surface du corps (négatif dedans) : touché quand il est sous le rayon du coup.
/**
 * @param {BodyMob} m
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function canaanBodyGap(m, x, y) {
  const b = canaanBody(m),
    cy = Math.max(m.y - b.height, Math.min(m.y, y));
  return Math.hypot(m.x - x, cy - y) - b.radius;
}
// Points de l'axe du corps (pieds → tête), pour les coups en cône ou en ligne.
/**
 * @param {BodyMob} m
 * @returns {{ x: number, y: number, radius: number }[]}
 */
export function canaanBodyPoints(m) {
  const b = canaanBody(m);
  return [0, 0.25, 0.5, 0.75, 1].map(k => ({ x: m.x, y: m.y - b.height * k, radius: b.radius }));
}
