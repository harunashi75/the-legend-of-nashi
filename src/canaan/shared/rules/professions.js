// @ts-check
// Règles des métiers : état neuf et lecture vérifiée (sauvegardes, réseau), courbe d'expérience, qualité maximale
// selon le niveau, effet d'un repas, tirages (espèce pondérée, qualité d'une prise) et collection.
// Module partagé pur (shared/rules) : aucune dépendance au navigateur, au réseau ni aux autres couches. Les
// tirages reçoivent leur générateur aléatoire en paramètre.
import {
  PROF_BUFF_PCT,
  PROF_DUSTS,
  PROF_ENCHANTS,
  PROF_FISH,
  PROF_GAME,
  PROF_HERBS,
  PROF_MAX_LEVEL,
  PROF_MEAT,
  PROF_OLD_QUALITY,
  PROF_ORES,
  PROF_QUALITY_LEVEL,
  PROF_QUALITY_MULT,
  PROF_RECIPES,
  PROF_RELICS,
  PROF_SALVAGE,
  PROF_SKILLS,
  PROF_TREASURES
} from '../data/professions.js';

/**
 * Niveau et expérience d'un métier.
 * @typedef {{ level: number, exp: number }} SkillState
 */
/**
 * Métiers d'un héros (sauvegardés dans heros.*.prof) : niveau de chaque métier, sac de chaque ressource
 * (« espèce:qualité » → quantité), collection des espèces prises, version des qualités.
 * @typedef {object} ProfState
 * @property {SkillState} fishing
 * @property {SkillState} cooking
 * @property {SkillState} hunting
 * @property {SkillState} mining
 * @property {SkillState} herbalism
 * @property {SkillState} enchanting
 * @property {Record<string, number>} fish
 * @property {Record<string, number>} meat
 * @property {Record<string, number>} meals
 * @property {Record<string, number>} ore
 * @property {Record<string, number>} herb
 * @property {Record<string, number>} ench
 * @property {Record<string, number>} treasure trésors enfouis (à vendre)
 * @property {Record<string, number>} dust poudres d'enchantement (pièces démantelées)
 * @property {Record<string, number>} finds reliques trouvées en creusant (relique → nombre)
 * @property {number} shovel 1 quand le héros possède la pelle
 * @property {Record<string, { n: number, best: number }>} codex
 * @property {number} qv version des qualités (2 : six qualités, de Commun à Mythique)
 */

/**
 * Métiers d'un héros neuf : tous au niveau 1, sacs et collection vides.
 * @returns {ProfState}
 */
export function profFresh() {
  return {
    fishing: { level: 1, exp: 0 },
    cooking: { level: 1, exp: 0 },
    hunting: { level: 1, exp: 0 },
    mining: { level: 1, exp: 0 },
    herbalism: { level: 1, exp: 0 },
    enchanting: { level: 1, exp: 0 },
    fish: {},
    meat: {},
    meals: {},
    ore: {},
    herb: {},
    ench: {},
    treasure: {},
    dust: {},
    finds: {},
    shovel: 0,
    codex: {},
    // Version des qualités (6 qualités, de Commun à Mythique).
    qv: 2
  };
}

/**
 * Expérience pour passer du niveau level au suivant.
 * @param {number} level
 * @returns {number}
 */
export function profXpNeeded(level) {
  return Math.round(30 + 12 * Math.pow(level, 1.35));
}

/**
 * Meilleure qualité accessible à ce niveau de métier (0 : Commun … 5 : Mythique).
 * @param {number} level
 * @returns {number}
 */
export function profQualityCap(level) {
  return PROF_QUALITY_LEVEL.reduce((best, need, q) => (level >= need ? q : best), 0);
}

/**
 * Ajoute de l'expérience à un métier ; renvoie les niveaux atteints (pour les messages). Au niveau maximum,
 * l'expérience s'arrête.
 * @param {SkillState} skill modifié sur place
 * @param {number} amount
 * @returns {number[]}
 */
export function profAddXp(skill, amount) {
  /** @type {number[]} */
  const reached = [];
  if (skill.level >= PROF_MAX_LEVEL) return reached;
  skill.exp += amount;
  while (skill.level < PROF_MAX_LEVEL && skill.exp >= profXpNeeded(skill.level)) {
    skill.exp -= profXpNeeded(skill.level);
    skill.level++;
    reached.push(skill.level);
  }
  if (skill.level >= PROF_MAX_LEVEL) skill.exp = 0;
  return reached;
}

/**
 * Tire une entrée d'une table pondérée [[clé, poids], …] ; la première si le tirage déborde.
 * @param {ReadonlyArray<readonly [string, number]>} table
 * @param {() => number} rng
 * @returns {string}
 */
export function profRollWeighted(table, rng) {
  const total = table.reduce((n, [, w]) => n + w, 0);
  let roll = rng() * total,
    kind = table[0][0];
  for (const [k, w] of table) {
    roll -= w;
    if (roll < 0) {
      kind = k;
      break;
    }
  }
  return kind;
}

/**
 * Qualité d'une prise : le plus souvent la meilleure accessible, parfois moins (loi exponentielle).
 * @param {number} cap qualité maximale (profQualityCap)
 * @param {() => number} rng
 * @returns {number}
 */
export function profRollQuality(cap, rng) {
  return Math.max(0, cap - Math.floor(-Math.log(1 - rng()) * 1.3));
}

/**
 * Note une prise dans la collection : nombre de prises et meilleure qualité de l'espèce.
 * @param {ProfState} prof modifié sur place
 * @param {string} kind
 * @param {number} q
 * @returns {boolean} vrai pour la première prise de l'espèce
 */
export function profRecordCatch(prof, kind, q) {
  const first = !prof.codex[kind],
    entry = (prof.codex[kind] ||= { n: 0, best: 0 });
  entry.n++;
  entry.best = Math.max(entry.best, q);
  return first;
}

/**
 * Effet d'un repas pour un héros (PV et mana maximum), avec les nombres réels : texte de la fenêtre et application.
 * @param {string} recipe clé de PROF_RECIPES
 * @param {number} q qualité du repas
 * @param {{ mhp: number, mmp: number }} [player] PV et mana maximum (100 et 300 sans héros)
 * @returns {Record<string, any> & { text: string }}
 */
export function profMealEffect(recipe, q, player = { mhp: 100, mmp: 300 }) {
  const r = /** @type {Record<string, any>} */ (PROF_RECIPES)[recipe],
    p = player,
    m = PROF_QUALITY_MULT[q] || 1,
    pct = PROF_BUFF_PCT[q] || 5;
  if (r.kind === 'heal') {
    const n = Math.round((100 + 0.03 * p.mhp) * m);
    return { amount: n, text: 'Rend ' + n + ' PV tout de suite' };
  }
  if (r.kind === 'mana') {
    const n = Math.round((100 + 0.05 * p.mmp) * m);
    return { amount: n, text: 'Rend ' + n + ' mana tout de suite' };
  }
  if (r.kind === 'both') {
    const hp = Math.round((60 + 0.02 * p.mhp) * m),
      mp = Math.round((60 + 0.03 * p.mmp) * m);
    return { amount: hp, mana: mp, text: 'Rend ' + hp + ' PV et ' + mp + ' mana tout de suite' };
  }
  if (r.kind === 'hot') {
    const n = Math.round((20 + 0.006 * p.mhp) * m);
    return { amount: n, text: 'Rend ' + n + ' PV par seconde pendant ' + r.seconds + ' s' };
  }
  if (r.kind === 'regen') {
    const share = 1 + 0.25 * q;
    return {
      share,
      text: 'Rend ' + share + ' % des PV et du mana par seconde pendant ' + r.seconds + ' s'
    };
  }
  /** @type {Record<string, string>} */
  const labels = { speed: 'vitesse', damage: 'dégâts', armor: 'dégâts subis' };
  const label = labels[r.stat];
  if (r.stat === 'warrior') {
    const dmg = Math.round(pct * 0.6),
      arm = Math.round(pct * 0.6);
    return {
      damage: dmg,
      armor: arm,
      text: '+' + dmg + ' % de dégâts et −' + arm + ' % de dégâts subis pendant ' + r.seconds / 60 + ' min'
    };
  }
  if (r.stat === 'feast') {
    const dmg = Math.round(pct * 0.7),
      spd = Math.round(pct * 0.6);
    return {
      damage: dmg,
      speed: spd,
      text: '+' + dmg + ' % de dégâts et +' + spd + ' % de vitesse pendant ' + r.seconds / 60 + ' min'
    };
  }
  return {
    [r.stat]: pct,
    text: (r.stat === 'armor' ? '−' : '+') + pct + ' % de ' + label + ' pendant ' + r.seconds / 60 + ' min'
  };
}

/**
 * Poudres obtenues en démantelant une pièce de cette qualité (rang dans GEAR_RARITIES ; une qualité inconnue compte
 * comme Commun, une qualité au-delà de Mythique comme Mythique). Le niveau d'enchanteur donne 1 % de chance par niveau
 * d'une poudre principale de plus.
 * @param {number} rank qualité de la pièce (0 : Commun … 5 : Mythique)
 * @param {number} enchLevel niveau d'enchanteur du héros
 * @param {() => number} rng
 * @returns {Record<string, number>} poudre → nombre
 */
export function salvageYield(rank, enchLevel, rng) {
  const table = PROF_SALVAGE[Math.max(0, Math.min(PROF_SALVAGE.length - 1, Math.floor(rank) || 0))];
  /** @type {Record<string, number>} */
  const out = {};
  table.forEach((entry, i) => {
    const [dust, min, max] = /** @type {[string, number, number]} */ (/** @type {unknown} */ (entry));
    let n = min + Math.floor(rng() * (max - min + 1));
    if (i === 0 && rng() < Math.max(0, Math.min(40, Number(enchLevel) || 0)) / 100) n++;
    out[dust] = (out[dust] || 0) + n;
  });
  return out;
}

/**
 * Métiers lus d'une sauvegarde ou du réseau : niveaux bornés, collection et sacs filtrés (espèces connues,
 * quantités positives et plafonnées). Une sauvegarde aux huit anciennes qualités est convertie une fois.
 * @param {any} raw état lu (non fiable : chaque champ est vérifié)
 * @returns {ProfState}
 */
export function profSanitize(raw) {
  const out = profFresh();
  if (!raw || typeof raw !== 'object') return out;
  for (const skill of PROF_SKILLS) {
    const s = raw[skill] || {},
      state = /** @type {SkillState} */ (out[/** @type {keyof ProfState} */ (skill)]);
    state.level = Math.max(1, Math.min(PROF_MAX_LEVEL, Math.floor(Number(s.level)) || 1));
    state.exp = Math.max(0, Math.min(profXpNeeded(state.level) - 1, Math.floor(Number(s.exp)) || 0));
  }
  // Collection : espèces connues, prises et meilleure qualité.
  if (raw.codex && typeof raw.codex === 'object')
    for (const [id, e] of Object.entries(raw.codex)) {
      const n = Math.floor(Number(e?.n)),
        best = Math.floor(Number(e?.best));
      if ((Object.hasOwn(PROF_FISH, id) || Object.hasOwn(PROF_GAME, id)) && n > 0)
        out.codex[id] = { n: Math.min(n, 999999), best: Math.max(0, Math.min(7, best || 0)) };
    }
  // Qualités au format actuel (qv 2) ; une ancienne sauvegarde est convertie (l'enchantement garde son métal).
  const convert = raw.qv !== 2;
  /** @type {ReadonlyArray<readonly ['fish' | 'meat' | 'meals' | 'ore' | 'herb' | 'ench' | 'treasure' | 'dust', object]>} */
  const bags = [
    ['fish', PROF_FISH],
    ['meat', PROF_MEAT],
    ['meals', PROF_RECIPES],
    ['ore', PROF_ORES],
    ['herb', PROF_HERBS],
    ['ench', PROF_ENCHANTS],
    ['treasure', PROF_TREASURES],
    ['dust', PROF_DUSTS]
  ];
  for (const [bag, known] of bags)
    if (raw[bag] && typeof raw[bag] === 'object')
      for (const [key, n] of Object.entries(raw[bag])) {
        const [id, qs] = key.split(':'),
          count = Math.floor(Number(n));
        if (!Object.hasOwn(known, id) || !/^[0-7]$/.test(qs) || !(count > 0)) continue;
        const q =
            bag === 'treasure' || bag === 'dust'
              ? 0
              : bag === 'ench'
                ? Math.min(5, Number(qs))
                : convert
                  ? PROF_OLD_QUALITY[Number(qs)]
                  : Math.min(5, Number(qs)),
          k = id + ':' + q;
        out[bag][k] = Math.min((out[bag][k] || 0) + count, 9999);
      }
  // Fouilles : la pelle, et les reliques connues trouvées au moins une fois.
  out.shovel = raw.shovel ? 1 : 0;
  if (raw.finds && typeof raw.finds === 'object')
    for (const [id, n] of Object.entries(raw.finds)) {
      const count = Math.floor(Number(n));
      if (Object.hasOwn(PROF_RELICS, id) && count > 0) out.finds[id] = Math.min(count, 9999);
    }
  for (const e of Object.values(out.codex)) e.best = convert ? PROF_OLD_QUALITY[e.best] : Math.min(5, e.best);
  return out;
}
