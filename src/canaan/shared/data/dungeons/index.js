// @ts-check
// Liste des donjons et raids : une fiche par instance (un fichier par donjon dans ce dossier), dans l'ordre du jeu.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
//
// Ajouter un donjon ou un raid : copier la fiche d'une instance proche, changer sa clé et son contenu, l'importer
// ici et l'ajouter À LA FIN de DUNGEONS. Les sauvegardes retiennent les instances par leur position dans cette liste
// (donjons terminés, progression) : ne jamais réordonner, insérer au milieu ni retirer une instance existante.
// Les textes français d'une nouvelle fiche (nom, boss, monstres) reçoivent leur traduction dans client/i18n/en.js.
import { deepFreeze } from '../../freeze.js';
import terriers from './terriers.js';
import mine from './mine.js';
import eclipse from './eclipse.js';
import penitents from './penitents.js';
import forge from './forge.js';
import fosse from './fosse.js';
import bastion from './bastion.js';
import continuum from './continuum.js';
import seraphin from './seraphin.js';
import celestia from './celestia.js';
import durgrim from './durgrim.js';
import ombral from './ombral.js';
import milleTombes from './mille-tombes.js';
import fongique from './fongique.js';
import arene from './arene.js';

const SHAPES = ['cave', 'hall', 'pit', 'void'];
const GATES = ['portcullis', 'barrier'];
const LOCKS = ['braziers', 'levers', 'runes', 'guardian', 'mirrors', 'memory', 'toggles', 'search', 'ambush'];
const MECHANICS = [
  'slam',
  'rain',
  'adds',
  'nova',
  'donut',
  'charge',
  'cross',
  'soak',
  'spread',
  'pools',
  'totems',
  'blink',
  'pull',
  'safe',
  'beam',
  'berserk'
];
const TRAPS = [null, 'spikes', 'jets', 'pulse', 'spores'];
const TRIGGERS = ['wall', 'torch', 'statue'];

/**
 * Vérifie une fiche au chargement : une erreur nomme la fiche et le champ fautif.
 * @param {any} d fiche d'un donjon ou d'un raid
 */
function check(d) {
  const fail = (/** @type {string} */ what) => {
    throw new Error(`Donjon « ${d?.key ?? '?'} » : ${what}`);
  };
  if (typeof d?.key !== 'string' || !d.key) fail('clé manquante');
  const { rules, layout, actors, palette } = d;
  if (!rules || !layout || !actors || !palette) fail('il faut rules, layout, actors et palette');
  if (typeof rules.name !== 'string' || typeof rules.boss !== 'string') fail('rules : nom ou boss manquant');
  if (!Number.isInteger(rules.biome) || !Number.isInteger(rules.level))
    fail('rules : biome ou niveau manquant');
  const bosses = rules.bosses || [rules.boss];
  if (bosses.length !== (rules.raid ? 6 : 3)) fail(`rules.bosses : ${rules.raid ? 6 : 3} boss attendus`);
  if (bosses[bosses.length - 1] !== rules.boss) fail('rules.boss doit être le dernier de rules.bosses');
  if (
    !Array.isArray(rules.wings) ||
    rules.wings.length !== bosses.length ||
    !rules.wings.every((/** @type {string} */ w) => LOCKS.includes(w))
  )
    fail('rules.wings : une énigme par boss parmi ' + LOCKS.join(', '));
  const mechs = (/** @type {any} */ list, /** @type {number} */ n, /** @type {string} */ what) => {
    if (!Array.isArray(list) || list.length !== n) fail(what + ' : une liste par boss');
    for (const m of list)
      if (!Array.isArray(m) || !m.length || !m.every(k => MECHANICS.includes(k)))
        fail(what + ' : mécaniques parmi ' + MECHANICS.join(', '));
  };
  mechs(rules.mechanics, bosses.length, 'rules.mechanics');
  mechs(rules.secretMechanics, (rules.secrets || []).length, 'rules.secretMechanics');
  if (!SHAPES.includes(layout.shape)) fail('layout.shape : ' + SHAPES.join(', '));
  if (!TRAPS.includes(layout.trap ?? null)) fail('layout.trap : ' + TRAPS.join(', '));
  if (!TRIGGERS.includes(layout.secret)) fail('layout.secret : ' + TRIGGERS.join(', '));
  if (!(typeof layout.dark === 'number' && layout.dark >= 1 && layout.dark <= 2))
    fail('layout.dark : de 1 à 2');
  if (!GATES.includes(layout.gate)) fail('layout.gate : ' + GATES.join(', '));
  if (!Number.isInteger(layout.hazard?.pools) || typeof layout.hazard?.style !== 'string')
    fail('layout.hazard');
  if (!Array.isArray(layout.wallProps) || !Array.isArray(layout.floorProps))
    fail('layout : wallProps, floorProps');
  const look = (/** @type {any} */ a) => typeof a?.look === 'string' && a.pal?.length === 5;
  if (!actors.mobs?.length || !actors.mobs.every((/** @type {any} */ m) => m.name && look(m)))
    fail('actors.mobs : nom, silhouette et palette de 5 couleurs');
  if (!(actors.bosses?.length >= bosses.length) || !actors.bosses.every(look))
    fail('actors.bosses : une apparence par boss');
  if (!((actors.secrets || []).length >= (rules.secrets || []).length) || !(actors.secrets || []).every(look))
    fail('actors.secrets : une apparence par boss secret');
  for (const part of ['floor', 'accent', 'wall', 'hazard', 'light'])
    if (!palette[part]) fail('palette.' + part + ' manquant');
}

/** Donjons et raids, dans l'ordre du jeu (et des sauvegardes). */
export const DUNGEONS = deepFreeze([
  terriers,
  mine,
  eclipse,
  penitents,
  forge,
  fosse,
  bastion,
  continuum,
  seraphin,
  celestia,
  durgrim,
  ombral,
  milleTombes,
  fongique
]);
/** Arène des Épreuves : plan et apparence, hors de la liste des instances. */
export const DUNGEON_ARENA_SHEET = deepFreeze(arene);

const seen = new Set();
for (const d of DUNGEONS) {
  check(d);
  if (seen.has(d.key)) throw new Error(`Donjon « ${d.key} » : clé en double`);
  seen.add(d.key);
}
