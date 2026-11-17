#!/usr/bin/env node
// Textes français du jeu et leur traduction (client/i18n). Relève les chaînes des sources (littéraux, morceaux de
// gabarits, textes et attributs du HTML) qui ressemblent à du texte affiché, puis indique celles qu'aucune entrée du
// dictionnaire ne couvre. Aide à compléter une langue fichier par fichier ; ce n'est pas une vérification exacte :
// un texte assemblé (« 'Niveau ' + n ») apparaît en morceaux, que le dictionnaire couvre par un modèle (« Niveau {n} »).
//
//   node tools/i18n_strings.cjs [--lang en] [--all] [fichiers…]
//     sans fichier : template.html et tous les scripts ; --all : aussi les textes déjà traduits.
//   node tools/i18n_strings.cjs --stats [--lang en]     couverture par fichier
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');

const ROOT = path.resolve(__dirname, '..', 'src', 'canaan');
const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  if (i < 0) return false;
  args.splice(i, 1);
  return true;
};
const option = name => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const lang = option('--lang') || 'en';
const all = flag('--all');
const stats = flag('--stats');

function sourceFiles() {
  const out = ['template.html'];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.js') && !rel.startsWith(path.join('client', 'i18n'))) out.push(rel);
    }
  };
  for (const dir of ['scripts', 'shared', 'client']) walk(dir);
  return out;
}

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
const decode = s => s.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, e => ENTITIES[e]);
// Textes d'un morceau de HTML : entre les balises, et dans title, aria-label, placeholder.
function htmlTexts(html) {
  const out = [];
  for (const m of html.matchAll(/\b(?:title|aria-label|placeholder)="([^"]*)"/g)) out.push(decode(m[1]));
  const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
  for (const part of body.split(/<[^>]*>?|^[^<]*>/)) out.push(decode(part));
  return out;
}
// Ressemble à un texte affiché : au moins un mot, et pas un identifiant, un sélecteur, une couleur, une URL ou du CSS.
function looksLikeText(s) {
  const t = s.trim();
  if (t.length < 2 || !/\p{L}{2}/u.test(t)) return false;
  if (/^[a-z][\w-]*$/.test(t) && !/[éèêàâçûôî]/.test(t)) return false;
  if (/^[A-Z_][A-Z0-9_]+$/.test(t)) return false;
  if (
    /^[#.][\w-]|^(?:rgba?|hsla?)\(|^https?:|^data:|^\d+(?:px|%|em|ms|s)\b|[{};]\s*$|^[\w-]+:\s*[\w#(-]/.test(
      t
    )
  )
    return false;
  if (/^[\w$.-]+\([^)]*\)$/.test(t)) return false;
  if (/^(?:bold |italic |normal )?\d+(?:\.\d+)?px /.test(t)) return false;
  return /\s/.test(t) || /^\p{Lu}/u.test(t) || /[à-ÿ]/i.test(t);
}

function jsStrings(code, file) {
  let ast;
  for (const sourceType of ['module', 'script']) {
    try {
      ast = espree.parse(code, { ecmaVersion: 'latest', sourceType, loc: true });
      break;
    } catch (e) {
      if (sourceType === 'script') throw new Error(file + ' : ' + e.message, { cause: e });
    }
  }
  const out = [];
  const add = (value, node) => {
    if (typeof value !== 'string') return;
    const parts = /<[a-z/!]/i.test(value) ? htmlTexts(value) : [value];
    for (const p of parts) if (looksLikeText(p)) out.push({ text: p.trim(), line: node.loc.start.line });
  };
  const visit = node => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'Literal') add(node.value, node);
    else if (node.type === 'TemplateElement') add(node.value.cooked, node);
    // Clés de propriétés et chaînes d'import : jamais affichées.
    for (const [key, child] of Object.entries(node)) {
      if (key === 'loc' || key === 'parent') continue;
      if (node.type === 'Property' && key === 'key' && !node.computed) continue;
      if ((node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration') && key === 'source')
        continue;
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(ast);
  return out;
}

function stringsOf(file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (file.endsWith('.html'))
    return code.split('\n').flatMap((line, i) =>
      htmlTexts(line.replace(/<!--[\s\S]*?-->/g, ''))
        .filter(looksLikeText)
        .map(text => ({ text: text.trim(), line: i + 1 }))
    );
  return jsStrings(code, file);
}

(async () => {
  const i18n = await import(path.join(ROOT, 'client', 'i18n', 'i18n.js'));
  if (lang !== 'fr') i18n.CANAAN_I18N.use(lang);
  // Une entrée identique au français (« Rare », « Grimoire ») compte comme traduite.
  const dict = lang === 'fr' ? {} : (await import(path.join(ROOT, 'client', 'i18n', lang + '.js'))).default;
  const files = args.length ? args.map(f => path.relative(ROOT, path.resolve(f))) : sourceFiles();
  let total = 0,
    done = 0;
  for (const file of files) {
    const seen = new Map();
    for (const s of stringsOf(file)) if (!seen.has(s.text)) seen.set(s.text, s.line);
    const list = [...seen].map(([text, line]) => ({
      text,
      line,
      ok: Object.hasOwn(dict, text) || i18n.translateText(text) !== text
    }));
    const ok = list.filter(s => s.ok).length;
    total += list.length;
    done += ok;
    if (stats) {
      if (list.length) console.log(String(ok).padStart(5) + ' / ' + String(list.length).padEnd(5) + file);
      continue;
    }
    const shown = all ? list : list.filter(s => !s.ok);
    if (!shown.length) continue;
    console.log('\n## ' + file);
    for (const s of shown) console.log((s.ok ? '  ✓ ' : '    ') + String(s.line).padStart(5) + '  ' + s.text);
  }
  console.log('\n' + done + ' / ' + total + ' textes couverts (' + lang + ')');
})();
