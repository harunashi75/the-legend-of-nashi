// Règles de progression et de statistiques : objets (3 principales + 2 secondaires), statistiques du héros, monstres
// par niveau et courbe d'XP. Remplace l'ancien système Ratings52 et l'iLvl.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import {
  MAX_LEVEL,
  PRIMARY_KEYS,
  QUALITY_FACTOR,
  SECONDARY_KEYS,
  SLOT_PROFILE,
  XP_BRACKETS,
  ZONE_LEVELS
} from '../data/stats.js';

const clampLevel = level => Math.max(1, Math.min(MAX_LEVEL, Math.round(Number(level) || 1)));
export { clampLevel };
const quality = rarity => QUALITY_FACTOR[rarity] || 1;
// Base des points d'un objet : grandit avec le niveau, multipliée par la qualité.
export function statBase(level, rarity) {
  return (6 + 2.2 * clampLevel(level)) * quality(rarity);
}
// Statistiques principales d'un équipement classique : fixées par son niveau, sa qualité et son emplacement.
// L'artéfact n'en a pas (seul son passif agit).
export function itemPrimary(item) {
  const profile = SLOT_PROFILE[item?.slot];
  if (!profile) return {};
  const base = statBase(item.level, item.rarity);
  return Object.fromEntries(PRIMARY_KEYS.map((key, i) => [key, Math.max(1, Math.round(base * profile[i]))]));
}
// Valeurs possibles d'une statistique secondaire : de 15 % à 40 % de la base (sans plafond : elles grandissent
// avec le niveau et la qualité).
export function secondaryRange(level, rarity) {
  const base = statBase(level, rarity);
  return [Math.max(1, Math.round(base * 0.15)), Math.max(1, Math.round(base * 0.4))];
}
// Tire deux statistiques secondaires différentes et leurs valeurs indépendantes. rng renvoie un nombre dans [0, 1[.
export function rollSecondaries(level, rarity, rng) {
  const pool = [...SECONDARY_KEYS],
    [lo, hi] = secondaryRange(level, rarity),
    out = {};
  for (let k = 0; k < 2; k++) {
    const key = pool.splice(Math.floor(rng() * pool.length) % pool.length, 1)[0];
    out[key] = lo + Math.floor(rng() * (hi - lo + 1));
  }
  return out;
}
// Secondaires enregistrées valides : deux clés connues, différentes, valeurs entières positives.
export function validSecondaries(sec) {
  if (!sec || typeof sec !== 'object' || Array.isArray(sec)) return false;
  const keys = Object.keys(sec);
  return (
    keys.length === 2 && keys.every(k => SECONDARY_KEYS.includes(k) && Number.isInteger(sec[k]) && sec[k] > 0)
  );
}
// Enchantement d'un objet (enchanteur) : une statistique secondaire de plus, ou null.
export function itemEnchant(item) {
  const e = item?.ench;
  return e && SECONDARY_KEYS.includes(e.stat) && Number.isInteger(e.value) && e.value > 0
    ? { stat: e.stat, value: e.value }
    : null;
}
// Toutes les statistiques d'un objet : principales calculées, secondaires enregistrées, plus l'enchantement
// (ajouté aux secondaires ; à part dans enchant pour l'info-bulle).
export function itemStats(item) {
  if (!item || !SLOT_PROFILE[item.slot]) return { primary: {}, secondary: {}, enchant: null };
  const secondary = validSecondaries(item.sec) ? { ...item.sec } : {},
    enchant = itemEnchant(item);
  if (enchant) secondary[enchant.stat] = (secondary[enchant.stat] || 0) + enchant.value;
  return { primary: itemPrimary(item), secondary, enchant };
}
// Points nécessaires pour 1 % d'effet, selon le niveau du héros : un même équipement compte moins en montant.
export function pointsPerPercent(level) {
  return 3 + 0.45 * clampLevel(level);
}
// Réduction des dégâts par la Défense contre un attaquant d'un niveau donné (rendement dégressif, jamais 100 %).
export function defenseReduction(defense, attackerLevel) {
  const d = Math.max(0, Number(defense) || 0);
  return d / (d + 60 + 22 * clampLevel(attackerLevel));
}
// Statistiques d'un héros d'après son niveau et ses pièces actives (sans artéfact ni arme de réserve).
// Les points sont convertis en effets réels ; les passifs d'artéfact, les talents de classe et les Rubis s'ajoutent ensuite.
export function heroStats(level, pieces, baseMana) {
  const lv = clampLevel(level),
    primary = Object.fromEntries(PRIMARY_KEYS.map(k => [k, 0])),
    secondary = Object.fromEntries(SECONDARY_KEYS.map(k => [k, 0]));
  for (const item of pieces) {
    const st = itemStats(item);
    for (const [k, v] of Object.entries(st.primary)) primary[k] += v;
    for (const [k, v] of Object.entries(st.secondary)) secondary[k] += v;
  }
  const R = pointsPerPercent(lv),
    haste = (60 * secondary.haste) / (secondary.haste + 12 * R);
  return {
    level: lv,
    attack: Math.round(16 + 2 * lv + primary.attack * 0.15),
    defense: primary.defense,
    maxHp: Math.round(90 + 14 * lv + primary.vitality * 1.6),
    maxMp: baseMana,
    crit: 5 + secondary.crit / R,
    critPower: 50,
    damageBonus: secondary.power / R,
    mastery: secondary.mastery / R,
    haste,
    cooldownReduction: haste,
    healingBonus: secondary.healing / R,
    resist: (100 * secondary.resist) / (secondary.resist + 40 * R),
    // Réduction supplémentaire des dégâts reçus (talents de classe), en %.
    guard: 0,
    // Chance de dévier un coup (dégâts ÷ 2) : petite base fixe, les talents y réagissent.
    dodge: 4,
    stunReduction: 0,
    speed: 0,
    primary,
    secondary
  };
}
// ---------------------------------------------------------------- Monstres
// Niveau d'un monstre de la zone index (0 à 5) : tiré dans la plage de la zone.
export function zoneLevel(index, rng) {
  const [lo, hi] = ZONE_LEVELS[Math.max(0, Math.min(ZONE_LEVELS.length - 1, index | 0))];
  return lo + Math.floor(rng() * (hi - lo + 1));
}
// PV d'un monstre ordinaire selon son niveau ; typeHp (PV de base de l'espèce) le rend un peu plus ou moins robuste.
export function mobHealth(level, elite = false, typeHp = 100) {
  return Math.round((150 + 42 * clampLevel(level)) * (0.8 + typeHp / 600) * (elite ? 2.4 : 1));
}
// Dégâts bruts d'un coup de monstre, avant la Défense et la Résistance du héros touché.
export function mobDamage(level) {
  return 6 + 1.5 * clampLevel(level);
}
// Boss : [PV, dégâts] par rapport à un monstre du même niveau. Un boss doit durer bien plus longtemps qu'un
// monstre de son instance (≈ 45 s seul) et frapper nettement plus fort.
const BOSS = Object.freeze({ dungeon: [12, 1.9], raid: [14, 2.1], world: [8, 1.8] });
export function bossHealth(level, kind) {
  return Math.round(mobHealth(level) * (BOSS[kind] || BOSS.dungeon)[0]);
}
export function bossDamage(level, kind) {
  return mobDamage(level) * (BOSS[kind] || BOSS.dungeon)[1];
}
// Écart de niveau : frapper un monstre plus fort réduit les dégâts (jusqu'à −50 %), un plus faible les augmente un peu.
export function levelGapFactor(heroLevel, mobLevel) {
  return Math.max(0.5, Math.min(1.25, 1 - 0.05 * (clampLevel(mobLevel) - clampLevel(heroLevel))));
}
// ---------------------------------------------------------------- Expérience
// XP pour passer du niveau level au suivant (0 au niveau maximum).
export function xpToNext(level) {
  const lv = clampLevel(level);
  if (lv >= MAX_LEVEL) return 0;
  return Math.round(
    (35 * Math.pow(lv, 1.65) + 25) * XP_BRACKETS[Math.min(XP_BRACKETS.length - 1, Math.floor((lv - 1) / 10))]
  );
}
// XP d'un monstre vaincu ; un monstre bien plus faible que le héros n'en donne presque plus.
export function mobXp(mobLevel, heroLevel, elite = false) {
  const gap = clampLevel(mobLevel) - clampLevel(heroLevel),
    factor = gap >= 3 ? 1.2 : gap >= 0 ? 1 + 0.066 * gap : gap >= -5 ? 1 + 0.15 * gap : 0.1;
  return Math.max(1, Math.round((10 + 5 * clampLevel(mobLevel)) * (elite ? 3 : 1) * factor));
}
// XP d'un boss (dungeon, raid ou world) et d'une instance terminée (coffre ouvert).
export function bossXp(level, kind) {
  return Math.round((10 + 5 * clampLevel(level)) * ({ dungeon: 8, raid: 12, world: 30 }[kind] || 8));
}
export function clearXp(level, raid) {
  return Math.round((10 + 5 * clampLevel(level)) * (raid ? 20 : 12));
}
// Ajoute de l'XP à {level, exp} ; renvoie le nombre de niveaux gagnés. Au niveau 60, l'XP s'arrête.
export function addXp(state, amount) {
  let gained = 0;
  state.level = clampLevel(state.level);
  state.exp = Math.max(0, Math.floor(Number(state.exp) || 0)) + Math.max(0, Math.floor(amount));
  while (state.level < MAX_LEVEL && state.exp >= xpToNext(state.level)) {
    state.exp -= xpToNext(state.level);
    state.level++;
    gained++;
  }
  if (state.level >= MAX_LEVEL) state.exp = 0;
  return gained;
}
// Ancien iLvl (1 à 190) converti en niveau d'objet (1 à 60), pour les anciennes sauvegardes.
export function levelFromIlvl(ilvl) {
  return clampLevel((Number(ilvl) || 1) * (MAX_LEVEL / 190));
}
