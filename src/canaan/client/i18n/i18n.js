// Langue du jeu. Le français est la langue source : le texte français sert de clé, et chaque autre langue a son
// dictionnaire (client/i18n/<langue>.js : { 'texte français': 'traduction' }). Un texte absent du dictionnaire reste
// en français : rien ne casse quand une traduction manque.
//
// Deux façons de traduire :
//  - au point de passage commun des textes affichés (client/icons/icons.js : textes de l'interface, info-bulles,
//    textes dessinés sur le canevas) : translateText() reconnaît un texte entier, son cœur sans les émojis, puces et
//    ponctuation qui l'entourent, ou un modèle avec des valeurs (« Niveau {n} » reconnaît « Niveau 12 ») ;
//  - dans le code, tt('Niveau {n}', { n }) pour un texte qui ne passe pas par l'affichage (titre de la fenêtre…)
//    ou dont la forme dépend de la langue.
// En français, les deux renvoient le texte tel quel, sans aucun calcul.
// La langue est choisie dans Paramètres → Interface ; le jeu redémarre pour l'appliquer partout.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).
import { CANAAN_PREFERENCES } from '../preferences.js';
import EN from './en.js';

export const LANGUAGES = Object.freeze({ fr: 'Français', en: 'English' });
const DICTIONARIES = { fr: null, en: EN };

function storedLanguage() {
  const lang = CANAAN_PREFERENCES.read('language', {}).lang;
  return Object.hasOwn(LANGUAGES, lang) ? lang : 'fr';
}

let lang = storedLanguage();
let dict = null; // Map texte français → traduction, null en français
let patterns = []; // modèles avec valeurs : { re, out, names }
let cache = new Map();
const missing = new Set();
// Traductions déjà rendues : repassées au point de passage (texte remplacé, observé à nouveau), elles restent telles quelles.
const produced = new Set();
const CACHE_MAX = 20000;

// Valeurs des modèles : {n}, {m}, {s}, {max} et {or} sont des nombres (« 1 234 », « −15 », « 2.5 ») ; les autres, un texte
// court (80 caractères au plus), sans séparateur « · — | » ni fin de phrase ; {qualite}, une qualité d'objet.
const NUMERIC = new Set(['n', 'm', 's', 'max', 'or']);
const NUMBER = '([+−-]?\\d[\\d\\s\\u00a0\\u202f.,]*?)';
const VALUE = '((?:(?![.!?…]\\s)[^·—|\\n]){1,80}?)';
// {qualite} : le nom d'une qualité d'objet, pour séparer « Truite Rare » en un nom et une qualité.
const QUALITY = '(Commun|Peu commun|Rare|Épique|Légendaire|Mythique|Relique)';
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PLACEHOLDER = /\{(\w+)\}/g;

// Remplit {nom} avec les valeurs données (les valeurs absentes restent telles quelles).
export function interpolate(text, params) {
  if (!params) return text;
  return text.replace(PLACEHOLDER, (all, name) => (Object.hasOwn(params, name) ? String(params[name]) : all));
}

function compile(table) {
  dict = new Map();
  patterns = [];
  for (const [fr, out] of Object.entries(table || {})) {
    if (typeof out !== 'string' || !out) continue;
    dict.set(fr, out);
    const names = [...fr.matchAll(PLACEHOLDER)].map(m => m[1]);
    if (!names.length) continue;
    // « Niveau {n} » → /^Niveau (\d…)$/ ; une valeur n'est jamais vide et ne traverse pas un séparateur.
    const source = fr
      .split(PLACEHOLDER)
      .map((part, i) =>
        i % 2 ? (NUMERIC.has(part) ? NUMBER : part === 'qualite' ? QUALITY : VALUE) : escRe(part)
      )
      .join('');
    // Morceaux de texte fixe, dans l'ordre : un filtre rapide avant l'expression régulière, qui sur un long texte
    // sans rapport pourrait essayer un très grand nombre de découpages.
    const chunks = fr.split(PLACEHOLDER).filter((part, i) => i % 2 === 0);
    patterns.push({ re: new RegExp('^' + source + '$', 'su'), out, names, chunks });
  }
  // Les modèles les plus précis (le plus de texte fixe) d'abord.
  const fixed = p => p.chunks.join('').length;
  patterns.sort((a, b) => fixed(b) - fixed(a));
  cache = new Map();
}

function setDictionary(code) {
  if (code === 'fr' || !DICTIONARIES[code]) {
    dict = null;
    patterns = [];
    cache = new Map();
    produced.clear();
    return;
  }
  produced.clear();
  compile(DICTIONARIES[code]);
}
setDictionary(lang);

const HAS_LETTER = /\p{L}{2}/u;
// Ce qui entoure le cœur d'un texte : espaces, émojis, repères d'icône ⟦…⟧, puces, flèches, ponctuation finale, et
// l'étiquette d'une touche en tête (« [E] »). Les alternatives ne se recouvrent pas : sinon, sur une longue suite
// d'espaces, le moteur essaierait toutes les façons de la découper.
const LEAD = /^(?:⟦[a-z0-9_]+⟧|\[[^\]\s]{1,12}\]|«[\s\u00a0\u202f]*|[^\p{L}\p{N}«(¿¡⟦[])*/u;
const TRAIL = /(?:⟦[a-z0-9_]+⟧|[\s\u00a0\u202f]*»|[^\p{L}\p{N}»)?!…⟦⟧])*$/u;

const PATTERN_MAX = 300;
// Le texte commence par le premier morceau fixe, finit par le dernier, et contient les autres dans l'ordre.
function fits(chunks, text) {
  const last = chunks.length - 1;
  if (!text.startsWith(chunks[0]) || !text.endsWith(chunks[last])) return false;
  let at = chunks[0].length;
  for (let i = 1; i < last; i++) {
    at = text.indexOf(chunks[i], at);
    if (at < 0) return false;
    at += chunks[i].length;
  }
  return at <= text.length - chunks[last].length;
}

function exact(text) {
  const direct = dict.get(text);
  if (direct !== undefined) return direct;
  if (text.length > PATTERN_MAX) return null;
  for (const p of patterns) {
    if (!fits(p.chunks, text)) continue;
    const m = p.re.exec(text);
    if (!m) continue;
    const values = {};
    // Une valeur est traduite à son tour (nom d'un lieu, d'un objet, effet d'un repas…), avec son émoji éventuel.
    p.names.forEach((name, i) => (values[name] = single(m[i + 1]) ?? m[i + 1]));
    return interpolate(p.out, values);
  }
  return null;
}

// Texte entier, ou son cœur sans ce qui l'entoure (émoji, puce, étiquette de touche, guillemets, ponctuation).
function single(text) {
  const whole = exact(text);
  if (whole !== null) return whole;
  const lead = LEAD.exec(text)[0];
  const rest = text.slice(lead.length);
  const trail = TRAIL.exec(rest.slice(-40))[0];
  const core = rest.slice(0, rest.length - trail.length);
  if (!core || (core === text && !lead && !trail)) return null;
  // Sans ce qui précède (émoji, puce) mais avec la ponctuation finale de l'entrée (« Partie sauvegardée ! »).
  if (lead) {
    const withEnd = exact(rest);
    if (withEnd !== null) return quotes(lead) + withEnd;
    // Réplique entre guillemets : la phrase garde sa ponctuation (« Rien à signaler. »).
    const quoted = /^(.*?)([\s\u00a0\u202f]*»\s*)$/su.exec(rest);
    const said = quoted && exact(quoted[1]);
    if (said) return quotes(lead) + said + quotes(quoted[2]);
  }
  const inner = exact(core);
  if (inner !== null) return quotes(lead) + inner + quotes(punctuation(trail));
  // Le cœur avec le début de sa ponctuation (« Talents équipés : » suivi d'un nombre, « Étoiles du Cœur : ★★☆ »).
  for (let k = trail.length - 1; k > 0; k--) {
    const head = trail.slice(0, k);
    if (!/\S/u.test(head)) continue;
    const found = exact(core + head.trimEnd());
    if (found !== null) return quotes(lead) + found + quotes(trail.slice(head.trimEnd().length));
  }
  return null;
}
// Guillemets français autour d'un texte traduit : « … » devient “…”.
const quotes = part => part.replace(/«[\s\u00a0\u202f]*/gu, '“').replace(/[\s\u00a0\u202f]*»/gu, '”');
// Un texte composé (« Guerrier · Niveau 12 · 340 or », plusieurs phrases) se traduit morceau par morceau : d'abord
// aux séparateurs « · », « — », « | », puis phrase par phrase, puis autour des émojis (« +12 ⚔ Force »). Il suffit qu'un morceau soit connu ; les autres
// restent tels quels (et sont signalés comme manquants).
const SPLITS = [
  /(\s+[·—|]\s+)/u,
  /((?<=[.!?…])\s+(?=[^\s.]))/u,
  /(\s*(?:\p{Extended_Pictographic}\uFE0F?|⟦[a-z0-9_]+⟧)\s*)/u
];
function lookup(text, level = 0) {
  const found = single(text);
  if (found !== null || level >= SPLITS.length) return found;
  for (let k = level; k < SPLITS.length; k++) {
    const parts = text.split(SPLITS[k]);
    if (parts.length < 3) continue;
    let any = false,
      out = '';
    // Morceaux pris de gauche à droite ; d'abord le plus long groupe connu (une description de deux phrases suivie
    // de « Mana 15. »), puis un morceau seul.
    for (let i = 0; i < parts.length; i += 2) {
      let done = false;
      for (let j = parts.length - 1; j > i && !done; j -= 2) {
        const group = parts.slice(i, j + 1).join('');
        const tr = single(group);
        if (tr !== null) {
          out += tr + (j + 1 < parts.length ? parts[j + 1] : '');
          any = done = true;
          i = j;
        }
      }
      if (done) continue;
      const part = parts[i],
        sep = i + 1 < parts.length ? parts[i + 1] : '';
      const tr = HAS_LETTER.test(part) ? lookup(part, k + 1) : null;
      if (tr === null && HAS_LETTER.test(part)) missing.add(part.trim());
      if (tr !== null) any = true;
      out += (tr ?? part) + sep;
    }
    return any ? out : null;
  }
  return null;
}
// Ponctuation française autour d'un texte traduit : pas d'espace avant « : ; ! ? » dans les autres langues.
const punctuation = trail => trail.replace(/^[\s\u00a0\u202f]+(?=[:;!?])/u, '');

// Nombres à l'anglaise dans un texte traduit : « 220 % » → « 220% », « 2,5 s » → « 2.5 s ».
const typography = text => text.replace(/(\d)[\s\u00a0\u202f]%/g, '$1%').replace(/(\d),(\d)/g, '$1.$2');

// Texte affiché (interface, info-bulle, canevas) : sa traduction, ou le texte tel quel.
export function translateText(text) {
  if (dict === null || typeof text !== 'string' || !HAS_LETTER.test(text)) return text;
  let out = cache.get(text);
  if (out !== undefined) return out;
  if (produced.has(text)) return text;
  let found = lookup(text);
  if (found === null) missing.add(text.trim());
  else {
    found = typography(found);
    if (produced.size < CACHE_MAX) produced.add(found);
  }
  out = found ?? text;
  if (cache.size >= CACHE_MAX) cache = new Map();
  cache.set(text, out);
  return out;
}

// Dans le code : tt('Niveau {n}', { n: 12 }) → « Level 12 » en anglais, « Niveau 12 » en français.
// Un même mot français peut avoir deux sens : tt('Retour', null, 'touche') cherche d'abord « touche|Retour ».
export function tt(text, params, context) {
  let out = text;
  if (dict !== null) out = (context && dict.get(context + '|' + text)) ?? dict.get(text) ?? text;
  return interpolate(out, params);
}

export const CANAAN_I18N = Object.freeze({
  languages: LANGUAGES,
  lang: () => lang,
  // Garde le choix ; il s'applique au prochain démarrage (Paramètres redémarre le jeu aussitôt).
  choose(code) {
    if (!Object.hasOwn(LANGUAGES, code)) return false;
    return CANAAN_PREFERENCES.write('language', { lang: code });
  },
  // Change la langue sans redémarrer (tests et outils) : seuls les textes affichés ensuite sont traduits.
  use(code) {
    if (!Object.hasOwn(LANGUAGES, code)) return false;
    lang = code;
    setDictionary(code);
    missing.clear();
    if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = code;
    return true;
  },
  translate: translateText,
  tt,
  // Traductions apportées par une extension (src/canaan/extensions/) : ajoutées au dictionnaire de la langue, pour
  // que le build de sortie, sans l'extension, n'en contienne aucune.
  extend(code, table) {
    if (!Object.hasOwn(LANGUAGES, code) || code === 'fr' || !table || typeof table !== 'object') return false;
    DICTIONARIES[code] = { ...DICTIONARIES[code], ...table };
    if (lang === code) setDictionary(code);
    return true;
  },
  // Textes vus à l'écran sans traduction depuis le démarrage (aide à compléter le dictionnaire).
  missing: () => [...missing].filter(Boolean).sort()
});

if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = lang;
