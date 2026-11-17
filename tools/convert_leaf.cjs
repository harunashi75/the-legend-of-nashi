#!/usr/bin/env node
// Convertit un script classique « feuille » (une IIFE qui pose ses exports sur window) en module ES de
// src/canaan/client/, pour la migration progressive. Le corps de l'IIFE devient le premier niveau du module,
// window.X = … devient export const X = …, Object.assign(window, { … }) devient des export, et chaque nom
// extérieur lu devient un import (modules partagés ou modules client déjà convertis).
//
//   node tools/convert_leaf.cjs <id du script> <chemin dans client/> [<id>=<chemin> …]
//   ex. node tools/convert_leaf.cjs canaan-icons icons/icons.js canaan-icon-art=icons/icon-art.js
//
// Les paires id=chemin indiquent où trouver les scripts dont ce module dépend (déjà convertis). Le convertisseur
// refuse les cas qu'il ne sait pas traiter (écriture sur window dans une fonction, nom extérieur inconnu) : rien
// n'est écrit dans ce cas.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');
const escope = require('eslint-scope');

const ROOT = path.resolve(__dirname, '..', 'src', 'canaan');
const [id, target, ...depArgs] = process.argv.slice(2);
if (!id || !target) {
  console.error('usage : node tools/convert_leaf.cjs <id> <chemin dans client/> [<id>=<chemin> …]');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const entry = manifest.modules.find(m => m.id === id && m.kind === 'script');
if (!entry) throw new Error('script inconnu : ' + id);
const src = fs.readFileSync(path.join(ROOT, entry.file), 'utf8');
const ast = espree.parse(src, {
  ecmaVersion: 2024,
  sourceType: 'script',
  range: true,
  loc: true,
  comment: true
});

// L'IIFE unique du fichier, et ce qui la précède (commentaire d'en-tête).
const iifes = ast.body.filter(
  st =>
    st.type === 'ExpressionStatement' &&
    st.expression.type === 'CallExpression' &&
    /Function/.test(st.expression.callee.type)
);
if (iifes.length !== 1 || ast.body.length !== 1) throw new Error('le fichier doit contenir une seule IIFE');
const fn = iifes[0].expression.callee;
const header = src.slice(0, iifes[0].range[0]);
const isWindow = n => n && n.type === 'Identifier' && (n.name === 'window' || n.name === 'globalThis');

// Exports : window.X = … et Object.assign(window, { … }) au premier niveau de l'IIFE.
const edits = [];
const exported = new Set();
for (const st of fn.body.body) {
  if (st.type === 'ExpressionStatement' && st.directive === 'use strict') {
    edits.push([st.range[0], st.range[1], '']);
    continue;
  }
  const e = st.type === 'ExpressionStatement' ? st.expression : null;
  if (
    e &&
    e.type === 'AssignmentExpression' &&
    e.left.type === 'MemberExpression' &&
    isWindow(e.left.object)
  ) {
    const name = e.left.property.name;
    exported.add(name);
    edits.push([st.range[0], e.right.range[0], 'export const ' + name + ' = ']);
  } else if (
    e &&
    e.type === 'CallExpression' &&
    e.callee.type === 'MemberExpression' &&
    e.callee.object.name === 'Object' &&
    e.callee.property.name === 'assign' &&
    isWindow(e.arguments[0])
  ) {
    const parts = [];
    for (const p of e.arguments[1].properties) {
      const key = p.key.name;
      exported.add(key);
      if (p.shorthand) parts.push('export { ' + key + ' };');
      else if (p.value.type === 'Identifier') parts.push('export { ' + p.value.name + ' as ' + key + ' };');
      else parts.push('export const ' + key + ' = ' + src.slice(...p.value.range) + ';');
    }
    edits.push([st.range[0], st.range[1], parts.join('\n')]);
  }
}
if (!exported.size) throw new Error('aucun export trouvé');

// Noms extérieurs : imports depuis les modules partagés (exports du pont) ou les modules client indiqués.
const providers = new Map(); // nom → chemin relatif depuis le module produit
const targetPath = path.join(ROOT, 'client', target);
const rel = file => {
  const r = path.relative(path.dirname(targetPath), file).split(path.sep).join('/');
  return r.startsWith('.') ? r : './' + r;
};
const bridge = espree.parse(fs.readFileSync(path.join(ROOT, 'bridge.js'), 'utf8'), {
  ecmaVersion: 2024,
  sourceType: 'module'
});
for (const imp of bridge.body.filter(st => st.type === 'ImportDeclaration')) {
  const file = path.resolve(ROOT, imp.source.value);
  if (!file.includes(path.sep + 'shared' + path.sep)) continue;
  const mod = espree.parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 2024, sourceType: 'module' });
  for (const st of mod.body.filter(x => x.type === 'ExportNamedDeclaration')) {
    const d = st.declaration;
    const names = d?.id ? [d.id.name] : d?.declarations ? d.declarations.map(v => v.id.name) : [];
    for (const sp of st.specifiers || []) names.push(sp.exported.name);
    for (const n of names) providers.set(n, rel(file));
  }
}
for (const arg of depArgs) {
  const [depId, depPath] = arg.split('=');
  const depFile = path.join(ROOT, 'client', depPath);
  const mod = espree.parse(fs.readFileSync(depFile, 'utf8'), { ecmaVersion: 2024, sourceType: 'module' });
  for (const st of mod.body.filter(x => x.type === 'ExportNamedDeclaration')) {
    const d = st.declaration;
    const names = d?.id ? [d.id.name] : d?.declarations ? d.declarations.map(v => v.id.name) : [];
    for (const sp of st.specifiers || []) names.push(sp.exported.name);
    for (const n of names) providers.set(n, rel(depFile));
  }
  if (!depId) throw new Error('dépendance mal écrite : ' + arg);
}
// window.X ailleurs : une lecture d'un nom fourni par un module devient X (importé) ; tout le reste est refusé.
const windowReads = new Map(); // chemin → noms
const walk = (n, parent) => {
  if (!n || typeof n.type !== 'string') return;
  if (
    n.type === 'MemberExpression' &&
    isWindow(n.object) &&
    !edits.some(([a, b]) => n.range[0] >= a && n.range[1] <= b)
  ) {
    const name = n.property.name;
    const written = parent && parent.type === 'AssignmentExpression' && parent.left === n;
    if (written || n.computed || !providers.has(name))
      throw new Error('window.' + (name || '?') + ' ligne ' + n.loc.start.line + ' : à traiter à la main');
    edits.push([n.range[0], n.range[1], name]);
    const from = providers.get(name);
    if (!windowReads.has(from)) windowReads.set(from, new Set());
    windowReads.get(from).add(name);
    return;
  }
  for (const k of Object.keys(n)) {
    if (k === 'range' || k === 'loc') continue;
    const v = n[k];
    if (Array.isArray(v)) v.forEach(x => walk(x, n));
    else if (v && typeof v.type === 'string') walk(v, n);
  }
};
walk(fn.body, null);
const BROWSER = new Set(Object.getOwnPropertyNames(globalThis));
for (const n of [
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'MutationObserver',
  'Node',
  'Element',
  'HTMLElement',
  'CanvasRenderingContext2D',
  'OffscreenCanvas',
  'Image',
  'Path2D',
  'DOMParser',
  'getComputedStyle',
  'innerWidth',
  'innerHeight',
  'devicePixelRatio',
  'addEventListener',
  'removeEventListener',
  'NodeFilter',
  'Text',
  'requestIdleCallback'
])
  BROWSER.add(n);
const manager = escope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });
const imports = windowReads; // chemin → noms
for (const scope of manager.scopes)
  for (const ref of scope.references) {
    if (ref.resolved) continue;
    const name = ref.identifier.name;
    if (name === 'window' || name === 'globalThis' || BROWSER.has(name)) continue;
    const from = providers.get(name);
    if (!from)
      throw new Error(
        'nom extérieur sans import connu : ' + name + ' ligne ' + ref.identifier.loc.start.line
      );
    if (!imports.has(from)) imports.set(from, new Set());
    imports.get(from).add(name);
  }

// Assemblage : en-tête, imports, corps de l'IIFE (désindenté de deux espaces).
let body = src.slice(fn.body.range[0] + 1, fn.body.range[1] - 1);
const offset = fn.body.range[0] + 1;
for (const [a, b, t] of edits.sort((x, y) => y[0] - x[0]))
  body = body.slice(0, a - offset) + t + body.slice(b - offset);
body = body
  .split('\n')
  .map(l => (l.startsWith('  ') ? l.slice(2) : l))
  .join('\n')
  .replace(/^\n+/, '');
const importLines = [...imports]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([from, names]) => 'import { ' + [...names].sort().join(', ') + " } from '" + from + "';")
  .join('\n');
const out =
  header.replace(/\n*$/, '\n') +
  '// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).\n' +
  (importLines ? importLines + '\n\n' : '\n') +
  body.replace(/\s*$/, '\n');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, out);
console.log(
  id +
    ' → client/' +
    target +
    ' : exports ' +
    [...exported].join(', ') +
    (imports.size ? ' ; imports ' + [...imports.values()].map(s => [...s].join(',')).join(' ; ') : '')
);
