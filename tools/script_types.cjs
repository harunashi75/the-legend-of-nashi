#!/usr/bin/env node
// Déclarations globales des scripts classiques pour TypeScript (src/canaan/scripts/globals.d.ts, fichier généré).
// Les scripts classiques partagent un seul espace global : TypeScript voit d'un fichier à l'autre leurs déclarations
// de premier niveau, mais pas les noms qui leur arrivent d'ailleurs. Ce fichier les déclare :
// - les exports des modules ES exposés par le pont (bridge.js), avec leur vrai type (typeof import(…)) ;
// - les noms posés sur window par un script (window.X = …, Object.assign(window, { … })), sans type (any) ;
// - les noms fournis par l'application de bureau (preload).
//
//   node tools/script_types.cjs           réécrit le fichier
//   node tools/script_types.cjs --check   vérifie seulement qu'il est à jour (tests)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');

const ROOT = path.resolve(__dirname, '..', 'src', 'canaan');
const OUT = path.join(ROOT, 'scripts', 'globals.d.ts');
const MODULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')).modules;
const parse = (file, sourceType) =>
  espree.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'), { ecmaVersion: 2024, sourceType });

// Exports d'un module ES : noms et déclarations (export const, function, { a as b }).
function exportsOf(file) {
  const names = [];
  for (const st of parse(file, 'module').body) {
    if (st.type !== 'ExportNamedDeclaration') continue;
    const d = st.declaration;
    if (d?.id) names.push(d.id.name);
    else if (d?.declarations)
      for (const v of d.declarations) if (v.id.type === 'Identifier') names.push(v.id.name);
    for (const sp of st.specifiers || []) names.push(sp.exported.name);
  }
  return names;
}

// Noms globaux posés par le pont : Object.assign(globalThis, ns, { A }, …) ; ns vient d'un import * as ns.
function bridgeGlobals() {
  const ast = parse('bridge.js', 'module');
  const from = new Map(); // nom local → [fichier, nom exporté | '*']
  for (const st of ast.body.filter(s => s.type === 'ImportDeclaration'))
    for (const sp of st.specifiers) {
      const file = path.posix.normalize(st.source.value.replace(/^\.\//, ''));
      if (sp.type === 'ImportNamespaceSpecifier') from.set(sp.local.name, [file, '*']);
      else if (sp.type === 'ImportSpecifier') from.set(sp.local.name, [file, sp.imported.name]);
    }
  const out = new Map(); // nom global → [fichier, nom exporté]
  const walk = n => {
    if (!n || typeof n.type !== 'string') return;
    if (
      n.type === 'CallExpression' &&
      n.callee.type === 'MemberExpression' &&
      n.callee.object.name === 'Object' &&
      n.callee.property.name === 'assign' &&
      n.arguments[0]?.name === 'globalThis'
    )
      for (const arg of n.arguments.slice(1)) {
        if (arg.type === 'Identifier' && from.get(arg.name)?.[1] === '*') {
          const file = from.get(arg.name)[0];
          for (const name of exportsOf(file)) out.set(name, [file, name]);
        } else if (arg.type === 'ObjectExpression')
          for (const p of arg.properties) {
            const local = p.value?.name;
            if (local && from.has(local)) out.set(p.key.name, from.get(local));
          }
      }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  };
  walk(ast);
  return out;
}

// Noms définis par les scripts classiques : premier niveau (vus par TypeScript) et window.X (à déclarer).
function scriptNames() {
  const topLevel = new Set(),
    onWindow = new Set();
  const isGlobal = n => n && n.type === 'Identifier' && (n.name === 'window' || n.name === 'globalThis');
  for (const m of MODULES.filter(x => x.kind === 'script')) {
    const ast = parse(m.file, 'script');
    for (const st of ast.body) {
      if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') topLevel.add(st.id.name);
      if (st.type === 'VariableDeclaration')
        for (const d of st.declarations) if (d.id.type === 'Identifier') topLevel.add(d.id.name);
    }
    const walk = n => {
      if (!n || typeof n.type !== 'string') return;
      if (
        n.type === 'AssignmentExpression' &&
        n.left.type === 'MemberExpression' &&
        isGlobal(n.left.object) &&
        !n.left.computed
      )
        onWindow.add(n.left.property.name);
      if (
        n.type === 'CallExpression' &&
        n.callee.type === 'MemberExpression' &&
        n.callee.object.name === 'Object' &&
        n.callee.property.name === 'assign' &&
        isGlobal(n.arguments[0])
      )
        for (const arg of n.arguments.slice(1))
          if (arg.type === 'ObjectExpression')
            for (const p of arg.properties)
              if (p.type === 'Property' && !p.computed) onWindow.add(p.key.name ?? p.key.value);
      for (const k of Object.keys(n)) {
        const v = n[k];
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v.type === 'string') walk(v);
      }
    };
    walk(ast);
  }
  return { topLevel, onWindow };
}

function render() {
  const bridge = bridgeGlobals();
  const { topLevel, onWindow } = scriptNames();
  const lines = [
    '// Fichier généré par tools/script_types.cjs : ne pas modifier à la main (node tools/script_types.cjs).',
    '// Noms globaux que les scripts classiques (src/canaan/scripts/, extensions/) reçoivent d’ailleurs, pour',
    '// TypeScript (scripts/jsconfig.json). Leurs déclarations de premier niveau ne sont pas répétées ici.',
    'export {};',
    '',
    'declare global {',
    '  // Modules ES exposés par le pont (bridge.js), avec leur type ; posés sur globalThis (var : aussi lus par window.X).'
  ];
  for (const [name, [file, exported]] of [...bridge].sort(([a], [b]) => a.localeCompare(b)))
    if (!topLevel.has(name)) lines.push(`  var ${name}: typeof import('../${file}').${exported};`);
  lines.push('  // Posés sur window par un script classique (sans type pour l’instant).');
  for (const name of [...onWindow].sort())
    if (!topLevel.has(name) && !bridge.has(name) && name !== 'canaanDesktop')
      lines.push(`  var ${name}: any;`);
  lines.push(
    '  // Application de bureau (app/preload.js, contextBridge).',
    '  var canaanDesktop: any;',
    '}',
    ''
  );
  return lines.join('\n');
}

const text = render();
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== text) {
    console.error('scripts/globals.d.ts n’est pas à jour : node tools/script_types.cjs');
    process.exit(1);
  }
  console.log('scripts/globals.d.ts à jour.');
} else {
  fs.writeFileSync(OUT, text);
  console.log('scripts/globals.d.ts : ' + text.split('\n').length + ' lignes');
}
