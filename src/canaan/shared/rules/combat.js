// Règles de combat pures : dégâts infligés et reçus par un héros (Défense, Résistance, déviation, critiques).
import { defenseReduction, levelGapFactor } from './stats.js';
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.

// Chance de coup critique d'un ennemi : boss de monde 13 %, boss 10 %, monstre 4 %.
export function enemyCritChance(enemy) {
  return enemy?.worldBoss ? 0.13 : enemy?.boss ? 0.1 : 0.04;
}
// Dégâts finaux d'un coup reçu par un héros. stats : statistiques du héros (heroStats : defense, resist, guard,
// dodge) ; attackerLevel : niveau de l'ennemi (la Défense compte moins contre un ennemi de haut niveau).
// rng est tiré deux fois, dans cet ordre : déviation (dégâts ÷ 2), puis coup critique ennemi (×1,5).
// critFactor réduit le bonus critique (Rubis Volonté, 1 sinon).
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
export function heroPower(attack) {
  return Math.max(8, Math.round(18 + (attack - 18) * 0.75 + attack * 0.25));
}
// Puissance magique d'un héros (bâton) : la même que la Puissance d'attaque (l'Intelligence n'existe plus sur
// les objets ; elle s'ajoute si un effet en donne). Le bâton n'est plus 40 % plus faible que les autres armes.
export function heroMagicPower(attack, intellect = 0) {
  return Math.max(8, Math.round(heroPower(attack) + Math.max(0, intellect) * 0.85));
}
