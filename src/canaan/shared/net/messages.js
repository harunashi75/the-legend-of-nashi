// @ts-check
// Protocole du coopératif : messages entre l'hôte, le relais et les invités, et leur vérification.
// Module partagé pur (shared/net) : aucun réseau ici ; le relais (Node) et le jeu (navigateur) l'utilisent.
// Les invités envoient des intentions ; l'hôte vérifie, simule et renvoie l'état du monde (10 fois par seconde).

import { encodeLook } from '../data/looks.js';

// Taille maximale d'un message (octets) et nombre maximal de messages par seconde et par connexion.
export const MESSAGE_LIMIT = 64 * 1024;
export const RATE_LIMIT = 60;
export const ROOM_GUESTS = 3;
// Codes de salon : 6 caractères, sans les signes faciles à confondre (0/O, 1/I/L).
export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
export const DEFAULT_RELAY = 'ws://localhost:8787';
// Objets au plus dans une offre d'échange.
export const TRADE_ITEMS = 12;

/**
 * @param {() => number} rng
 * @returns {string}
 */
export function makeRoomCode(rng) {
  let code = '';
  for (let i = 0; i < 6; i++) code += ROOM_ALPHABET[Math.floor(rng() * ROOM_ALPHABET.length)];
  return code;
}
/**
 * @param {unknown} text
 * @returns {string | null} null si illisible
 */
export function normalizeRoomCode(text) {
  const code = String(text ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return ROOM_CODE.test(code) ? code : null;
}
// Adresse du relais saisie ou collée par un joueur : ws:// ou wss://, avec un nom d'hôte et un port facultatif.
// Un lien https:// devient wss://, http:// devient ws:// ; sans préfixe, wss:// pour une adresse
// sans port (tunnel HTTPS) et ws:// avec un port. Renvoie null si l'adresse n'est pas lisible.
/**
 * @param {unknown} text
 * @returns {string | null} null si illisible
 */
export function normalizeRelayUrl(text) {
  let s = String(text ?? '').trim();
  if (!s) return null;
  s = s
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://')
    .replace(/^tcp:\/\//i, 'ws://');
  if (!/^wss?:\/\//i.test(s)) s = (/:\d{2,5}(\/|$)/.test(s) ? 'ws://' : 'wss://') + s;
  const m = /^(wss?):\/\/([a-z0-9.-]+|\[[0-9a-f:]+\])(?::(\d{2,5}))?\/?$/i.exec(s);
  if (!m || (m[3] && (+m[3] < 1 || +m[3] > 65535))) return null;
  return m[1].toLowerCase() + '://' + m[2].toLowerCase() + (m[3] ? ':' + m[3] : '');
}
// Invitation à partager : adresse du relais et code du salon, dans un texte lisible.
/**
 * @param {string} relay
 * @param {string} code
 * @returns {string}
 */
export function makeInvitation(relay, code) {
  return 'Rejoins ma partie The Legend of Nashi ! Relais : ' + relay + ' · Code : ' + code;
}
// Invitation collée par un invité (ou n'importe quel texte) : relais et code retrouvés si présents.
/**
 * @param {unknown} text
 */
export function parseInvitation(text) {
  const s = String(text ?? '');
  // Adresse avec préfixe, sinon une adresse nue avec son port (100.120.239.59:8787, mon-pc.tail1234.ts.net:8787).
  const relay =
      /\b((?:wss?|https?):\/\/[^\s·,;]+)/i.exec(s) ||
      /(?:^|[\s:])((?:\d{1,3}(?:\.\d{1,3}){3}|[a-z0-9-]+(?:\.[a-z0-9-]+)+):\d{2,5})\b/i.exec(s),
    code = /code\s*:?\s*([A-Za-z0-9]{6})\b/i.exec(s);
  return {
    relay: relay ? normalizeRelayUrl(relay[1]) : null,
    code: code ? normalizeRoomCode(code[1]) : null
  };
}
// Identifiant d'un invité : créé une fois par son application, puis gardé dans sa configuration.
export const GUEST_ID = /^[a-zA-Z][\w-]{5,63}$/;
// Toujours tester un identifiant avec isGuestId : RegExp.test convertirait undefined en texte « undefined ».
/**
 * @param {unknown} id
 * @returns {boolean}
 */
export function isGuestId(id) {
  return typeof id === 'string' && GUEST_ID.test(id);
}
/**
 * @param {() => number} rng
 * @returns {string}
 */
export function makeGuestId(rng) {
  let id = 'g-';
  for (let i = 0; i < 16; i++) id += '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(rng() * 36)];
  return id;
}

// Lit un message reçu : JSON objet avec un type connu, taille limitée ; null sinon.
const TYPES = new Set([
  'host',
  'room',
  'join',
  'accept',
  'refuse',
  'intent',
  'action',
  'state',
  'me',
  'notice',
  'left',
  'closed',
  'kick',
  'chat',
  'error'
]);
// Messages qu'un invité a le droit d'envoyer (le relais les transmet à l'hôte, les autres sont ignorés).
export const GUEST_TYPES = Object.freeze(['intent', 'action', 'chat']);
/**
 * @param {unknown} text message brut du réseau
 * @returns {any} objet lu, à vérifier, ou null
 */
export function parseMessage(text) {
  if (typeof text !== 'string' || text.length > MESSAGE_LIMIT) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  return data && typeof data === 'object' && !Array.isArray(data) && TYPES.has(data.t) ? data : null;
}

/** @type {(v: unknown, fallback?: number) => number} */
const finite = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
/** @type {(v: number, a: number, b: number) => number} */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Intention d'un invité, vérifiée par l'hôte : direction (-1, 0 ou 1), attaque de base, compétence 0 à 3, point visé,
// roulade (direction en -1..1) et numéro de séquence (pour que l'invité corrige sa position prédite).
// L'invité n'envoie jamais de statistiques, d'or, d'objets ni d'artéfacts : seulement ce qu'il veut faire.
/**
 * @param {any} raw intention reçue d'un invité (non fiable : chaque champ est vérifié)
 */
export function sanitizeIntent(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const d = r.dodge && typeof r.dodge === 'object' ? r.dodge : null;
  return {
    dx: clamp(Math.sign(finite(r.dx)), -1, 1),
    dy: clamp(Math.sign(finite(r.dy)), -1, 1),
    attack: r.attack === 'quick' || r.attack === 'heavy' ? r.attack : null,
    skill: Number.isInteger(r.skill) && r.skill >= 0 && r.skill <= 3 ? r.skill : null,
    aimX: clamp(finite(r.aimX), -1e6, 1e6),
    aimY: clamp(finite(r.aimY), -1e6, 1e6),
    dodge: d ? { dx: clamp(finite(d.dx), -1, 1), dy: clamp(finite(d.dy), -1, 1) } : null,
    seq: Number.isInteger(r.seq) && r.seq >= 0 && r.seq < 2 ** 31 ? r.seq : null
  };
}
// Action demandée par un invité (équipement, classe et talents, artéfacts) : l'hôte vérifie ensuite qu'elle est permise à son héros.
const GEAR_SLOT = /^[a-z][a-z0-9]{1,15}$/;
// Repère d'une pile du sac (voir scripts/bag.js).
export const STACK_TOKEN = /^(fish|meat|meal|ore|herb|ench|key|treasure|dust):[a-z_]{2,32}:[0-7]\*\d{1,3}$/;
/**
 * @param {any} raw action reçue d'un invité (non fiable : chaque champ est vérifié)
 * @returns {Record<string, any> | null} action mise en forme, ou null si elle est invalide
 */
export function sanitizeAction(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const id = typeof r.id === 'string' && r.id.length <= 96 ? r.id : null;
  // Équiper : une bague peut viser la première ou la seconde bague (ring, ring2).
  if (r.op === 'equip' && id && (r.slot === 'ring' || r.slot === 'ring2'))
    return { op: r.op, id, slot: r.slot };
  if (r.op === 'equip' || r.op === 'reserve') return id ? { op: r.op, id } : null;
  if (r.op === 'unequip')
    return typeof r.slot === 'string' && GEAR_SLOT.test(r.slot) ? { op: 'unequip', slot: r.slot } : null;
  if (r.op === 'switch') return { op: 'switch' };
  // Classe, talents et artéfacts : identifiants courts ; l'hôte vérifie ensuite qu'ils existent et que le héros y a droit.
  const word = /** @param {unknown} v */ v =>
    typeof v === 'string' && /^[a-z][a-z_]{1,31}$/.test(v) ? v : null;
  if (r.op === 'class-choose') return word(r.cls) ? { op: r.op, cls: r.cls } : null;
  if (r.op === 'talent-equip' || r.op === 'talent-unequip')
    return Number.isInteger(r.talent) && r.talent >= 0 && r.talent <= 9
      ? { op: r.op, talent: r.talent }
      : null;
  if (r.op === 'class-special') return { op: r.op };
  // Quêtes : numéro de quête, objet d'un lieu ; l'hôte vérifie la distance, l'étape et l'objet.
  const questId = /** @param {unknown} v */ v =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 30 ? v : null;
  if (r.op === 'quest-accept' || r.op === 'quest-turnin' || r.op === 'quest-track')
    return questId(r.q) !== null ? { op: r.op, q: r.q } : null;
  if (r.op === 'quest-choice')
    return questId(r.q) !== null && Number.isInteger(r.choice) && r.choice >= 0 && r.choice <= 7
      ? { op: r.op, q: r.q, choice: r.choice }
      : null;
  // Grand troc : l'habitant (identifiant de PNJ) ; coquillages : récompenses de Madame Nacre.
  if (r.op === 'quest-trade')
    return typeof r.npc === 'string' && /^[a-z]{2,16}$/.test(r.npc) ? { op: r.op, npc: r.npc } : null;
  if (r.op === 'quest-shells') return { op: r.op };
  if (r.op === 'quest-act')
    return typeof r.site === 'string' &&
      /^(q\d{1,2}|camp)$/.test(r.site) &&
      typeof r.obj === 'string' &&
      /^[a-z0-9_]{1,24}$/.test(r.obj)
      ? { op: r.op, site: r.site, obj: r.obj }
      : null;
  if (r.op === 'artefact-equip') return word(r.artefact) ? { op: r.op, artefact: r.artefact } : null;
  // Marchand : l'hôte vérifie la présence d'un marchand, l'or et l'objet.
  if (r.op === 'sell') return id ? { op: r.op, id } : null;
  // Démanteler une pièce du sac ou de la sacoche, reprendre une pièce de la sacoche (l'hôte vérifie qu'elle y est).
  if (r.op === 'salvage' || r.op === 'satchel-take') return id ? { op: r.op, id } : null;
  // Banque : un équipement (identifiant) ou une pile (repère) à déposer ou reprendre.
  // Succès : titre choisi (identifiant d'un succès débloqué, ou none).
  if (r.op === 'ach-title')
    return typeof r.id === 'string' && /^[a-z0-9]{1,8}$/.test(r.id) ? { op: r.op, id: r.id } : null;
  if (r.op === 'bank-deposit' || r.op === 'bank-withdraw')
    return typeof r.ref === 'string' && r.ref.length > 0 && r.ref.length <= 96
      ? { op: r.op, ref: r.ref }
      : null;
  if (r.op === 'shop-buy')
    return Number.isInteger(r.index) && r.index >= 0 && r.index < 64 ? { op: r.op, index: r.index } : null;
  // Pile du sac (poissons, viandes, repas…) : « genre:id:qualité*nombre ».
  if (r.op === 'sell-stack')
    return typeof r.token === 'string' && STACK_TOKEN.test(r.token) ? { op: r.op, token: r.token } : null;
  // Donjon : E devant un mur fissuré, un brasero, un levier, une stèle ou une porte scellée (l'hôte vérifie).
  if (
    r.op === 'sell-common' ||
    r.op === 'bag-upgrade' ||
    r.op === 'bag-sort' ||
    r.op === 'shovel-buy' ||
    r.op === 'dig' ||
    r.op === 'buy-gear' ||
    r.op === 'open-chest' ||
    r.op === 'dungeon-use'
  )
    return { op: r.op };
  // Garde-robe : apparence à porter (identifiant court, ou vide pour la retirer) ; l'hôte vérifie qu'elle est possédée.
  if (r.op === 'skin-wear') return r.id === '' || word(r.id) ? { op: r.op, id: r.id } : null;
  // Cité elfique : porte, bénédiction du Grand Arbre, atelier (apparence) ; l'hôte vérifie. L'armurerie passe par shop-buy.
  if (r.op === 'city-gate' || r.op === 'city-bless') return { op: r.op };
  // Extensions : l'extension, son action et un identifiant court facultatif (vérifiés ensuite par l'extension).
  if (r.op === 'ext')
    return word(r.ext) && word(r.act) && (r.id === undefined || r.id === null || word(r.id))
      ? { op: 'ext', ext: r.ext, act: r.act, id: r.id ?? null }
      : null;
  if (r.op === 'city-skin') return word(r.id) ? { op: r.op, id: r.id } : null;
  // Salon de coiffure : la nouvelle apparence en forme compacte (vérifiée par decodeLook chez l'hôte).
  if (r.op === 'barber-look')
    return typeof r.look === 'string' && r.look.length <= 120 ? { op: r.op, look: r.look } : null;
  if (r.op === 'artefact-unequip')
    return Number.isInteger(r.slot) && r.slot >= 0 && r.slot <= 3 ? { op: r.op, slot: r.slot } : null;
  // Métiers : pêcher (lancer, ferrer, remonter), cuisiner, manger ; l'hôte vérifie le banc, le feu et les stocks.
  // Bâtiments : passer une porte (l'hôte vérifie qu'elle est à portée).
  if (r.op === 'house-door') return { op: 'house-door' };
  if (r.op === 'fish') return { op: 'fish' };
  // Minage et cueillette : numéro du gisement ; enchanteur : statistique, métal (0 à 5), nombre ; poser : pile et pièce.
  if (r.op === 'gather')
    return Number.isInteger(r.node) && r.node >= 0 && r.node < 5000 ? { op: 'gather', node: r.node } : null;
  if (r.op === 'enchant-craft')
    return word(r.stat) &&
      Number.isInteger(r.tier) &&
      r.tier >= 0 &&
      r.tier <= 5 &&
      Number.isInteger(r.count) &&
      r.count >= 1 &&
      r.count <= 20
      ? { op: r.op, stat: r.stat, tier: r.tier, count: r.count }
      : null;
  if (r.op === 'enchant-apply')
    return typeof r.token === 'string' &&
      STACK_TOKEN.test(r.token) &&
      typeof r.ref === 'string' &&
      r.ref.length > 0 &&
      r.ref.length <= 96
      ? { op: r.op, token: r.token, ref: r.ref }
      : null;
  // Changer la statistique d'un enchantement posé : pièce (identifiant ou emplacement) et nouvelle statistique.
  if (r.op === 'enchant-reroll')
    return word(r.stat) && typeof r.ref === 'string' && r.ref.length > 0 && r.ref.length <= 96
      ? { op: r.op, stat: r.stat, ref: r.ref }
      : null;
  if (r.op === 'hunt')
    return typeof r.game === 'string' && /^[a-z]{2,16}$/.test(r.game) ? { op: 'hunt', game: r.game } : null;
  const recipe = typeof r.recipe === 'string' && /^[a-z]{2,16}$/.test(r.recipe) ? r.recipe : null,
    quality = Number.isInteger(r.quality) && r.quality >= 0 && r.quality <= 7 ? r.quality : null;
  if (r.op === 'cook')
    return recipe && quality !== null && Number.isInteger(r.count) && r.count >= 1 && r.count <= 20
      ? { op: 'cook', recipe, quality, count: r.count }
      : null;
  if (r.op === 'eat') return recipe && quality !== null ? { op: 'eat', recipe, quality } : null;
  // Échange entre joueurs : l'hôte vérifie ensuite le partenaire, les objets du sac, l'or et la place.
  if (r.op === 'trade-request') return r.to === 'host' || isGuestId(r.to) ? { op: r.op, to: r.to } : null;
  if (r.op === 'trade-answer' || r.op === 'trade-ready')
    return typeof r.yes === 'boolean' ? { op: r.op, yes: r.yes } : null;
  if (r.op === 'trade-cancel') return { op: r.op };
  if (r.op === 'trade-offer') {
    const items = Array.isArray(r.items) ? r.items : null;
    if (
      !items ||
      items.length > TRADE_ITEMS ||
      !items.every(/** @param {unknown} x */ x => typeof x === 'string' && x.length > 0 && x.length <= 96)
    )
      return null;
    return Number.isInteger(r.gold) && r.gold >= 0 && r.gold <= 1e12
      ? { op: r.op, items: [...items], gold: r.gold }
      : null;
  }
  return null;
}
// Pseudo d'un invité : sans caractère de contrôle ni chevron, 24 caractères au plus.
/**
 * @param {unknown} text
 * @returns {string}
 */
export function cleanPseudo(text) {
  const pseudo = String(text ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, 24);
  return pseudo || 'Invité';
}
// Message de chat : 200 caractères au plus.
/**
 * @param {unknown} text
 * @returns {string}
 */
export function cleanChat(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim()
    .slice(0, 200);
}

// Instantané envoyé par l'hôte : héros, monstres, butins au sol et projectiles, avec des nombres arrondis.
/** @type {(v: unknown) => number} */
const round = v => Math.round(finite(v));
/**
 * @param {string} id
 * @param {any} hero héros du jeu (game.heroes)
 */
export function heroSnapshot(id, hero) {
  const p = hero.player;
  return {
    id,
    name: hero.name || 'Hôte',
    color: hero.color || '#8068db',
    // Apparence compacte (shared/data/looks.js), lue par decodeLook.
    look: encodeLook(hero.look),
    x: round(p.x),
    y: round(p.y),
    vx: Math.round(finite(p.vx) * 10) / 10,
    vy: Math.round(finite(p.vy) * 10) / 10,
    hp: Math.ceil(finite(p.hp)),
    mhp: round(p.mhp),
    mp: Math.floor(finite(p.mp)),
    mmp: round(p.mmp),
    gold: Math.floor(finite(p.gold)),
    // Clés des secrets (boss cachés des donjons), pour les coffres secrets de l'île.
    keys: Math.floor(finite(p.keys)),
    dead: !!p.dead,
    face: finite(p.face, 1),
    atk: Math.round(finite(p.atk) * 100) / 100,
    kills: Math.floor(finite(hero.kills)),
    // Forme féline (Druide), Voile d'ombre (Assassin) et bouclier de talent : dessinés chez chacun.
    form: p.form === 'feral' ? 1 : 0,
    veil: p.veiled ? 1 : 0,
    shield: p.shielded ? 1 : 0
  };
}
const MONSTER_LOOK = ['look', 'pal', 'scale', 'mobColor', 'lookOpts'];
/**
 * @param {any} m monstre du jeu (game.world.monsters)
 * @returns {Record<string, any>}
 */
export function monsterSnapshot(m) {
  /** @type {Record<string, any>} */
  const out = {
    k: m.netId,
    t: m.t,
    x: round(m.x),
    y: round(m.y),
    hp: Math.ceil(finite(m.hp)),
    mhp: round(m.mhp),
    r: round(m.r),
    cd: Math.round(finite(m.cd) * 10) / 10
  };
  for (const key of ['boss', 'worldBoss', 'elite', 'arenaBoss', 'hidden']) if (m[key]) out[key] = true;
  // Niveau décidé par l'hôte (plaque des monstres des invités).
  if (Number.isFinite(m.level)) out.level = round(m.level);
  for (const key of MONSTER_LOOK) if (m[key] !== undefined) out[key] = m[key];
  if (Number.isFinite(m.facingAngle)) out.facingAngle = Math.round(m.facingAngle * 100) / 100;
  // Rang du boss dans l'instance et boss caché (barre de boss des invités).
  if (Number.isInteger(m.bossStage)) out.bossStage = m.bossStage;
  if (Number.isInteger(m.secretBoss)) out.secretBoss = m.secretBoss;
  return out;
}
