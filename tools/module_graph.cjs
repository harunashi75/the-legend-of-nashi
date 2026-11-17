#!/usr/bin/env node
// Graphe des dépendances entre les scripts classiques du jeu (src/canaan/manifest.json), pour la migration en
// modules ES. Les scripts classiques partagent un seul espace global : un nom défini par l'un (déclaration de premier
// niveau, window.X = …, Object.assign(window, { … })) est lu par les autres sans import. Cet outil relève, pour chaque
// script, les noms qu'il définit et ceux qu'il lit sans les définir, et en déduit qui dépend de qui.
//
//   node tools/module_graph.cjs              résumé : feuilles, puis chaque script et ses dépendances
//   node tools/module_graph.cjs --json       graphe complet en JSON
//   node tools/module_graph.cjs --why a b    noms du script a lus par le script b
//
// « au chargement » : le nom est lu pendant l'exécution du script lui-même (hors de toute fonction) ; il doit donc
// exister avant. « à l'appel » : lu seulement dans une fonction, il peut être défini plus tard.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const espree = require('espree');
const escope = require('eslint-scope');

const ROOT = path.resolve(__dirname, '..', 'src', 'canaan');
const MODULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')).modules;
// Noms fournis par le navigateur ou le langage : jamais des dépendances entre scripts.
const BROWSER = new Set([
  ...Object.getOwnPropertyNames(globalThis),
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'performance',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'addEventListener',
  'removeEventListener',
  'getComputedStyle',
  'matchMedia',
  'innerWidth',
  'innerHeight',
  'devicePixelRatio',
  'screen',
  'history',
  'alert',
  'confirm',
  'prompt',
  'Image',
  'Audio',
  'AudioContext',
  'webkitAudioContext',
  'OfflineAudioContext',
  'OffscreenCanvas',
  'ImageData',
  'Path2D',
  'DOMParser',
  'Event',
  'CustomEvent',
  'KeyboardEvent',
  'MouseEvent',
  'PointerEvent',
  'TouchEvent',
  'WebSocket',
  'Blob',
  'FileReader',
  'HTMLElement',
  'HTMLCanvasElement',
  'Node',
  'Element',
  'MutationObserver',
  'ResizeObserver',
  'IntersectionObserver',
  'getSelection',
  'scrollTo',
  'open',
  'close',
  'focus',
  'blur',
  'print',
  'name',
  'status',
  'parent',
  'top',
  'self',
  'frames',
  'opener',
  'origin',
  'crypto',
  'isSecureContext',
  'caches',
  'indexedDB',
  'visualViewport',
  'onerror',
  'event',
  'globalThis',
  'undefined',
  'NaN',
  'Infinity',
  'arguments'
]);

function parse(file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return espree.parse(code, { ecmaVersion: 2024, sourceType: 'script', range: true });
}

// Noms définis : déclarations du premier niveau, et propriétés posées sur window / globalThis à n'importe quel niveau.
function definedNames(ast) {
  const names = new Set();
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') names.add(st.id.name);
    if (st.type === 'VariableDeclaration')
      for (const d of st.declarations) if (d.id.type === 'Identifier') names.add(d.id.name);
  }
  const isGlobal = n => n && n.type === 'Identifier' && (n.name === 'window' || n.name === 'globalThis');
  const walk = n => {
    if (!n || typeof n.type !== 'string') return;
    // window.X = … et window.X ??= …
    if (
      n.type === 'AssignmentExpression' &&
      n.left.type === 'MemberExpression' &&
      isGlobal(n.left.object) &&
      !n.left.computed
    )
      names.add(n.left.property.name);
    // Object.assign(window, { X, Y: … })
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
            if (p.type === 'Property' && !p.computed) names.add(p.key.name ?? p.key.value);
    for (const k of Object.keys(n)) {
      if (k === 'range') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  };
  walk(ast);
  return names;
}

// Noms lus sans être définis dans le fichier, avec le moment de la lecture (chargement ou appel).
function freeNames(ast) {
  const manager = escope.analyze(ast, { ecmaVersion: 2024, sourceType: 'script' });
  const out = new Map();
  const note = (name, when) => {
    if (BROWSER.has(name)) return;
    if (out.get(name) !== 'chargement') out.set(name, when);
  };
  for (const scope of manager.scopes) {
    // Une IIFE de premier niveau s'exécute au chargement : ses lectures directes comptent comme « au chargement ».
    const loadTime = scope.type === 'global' || isTopIife(scope);
    for (const ref of scope.references)
      if (!ref.resolved || ref.resolved.scope.type === 'global') {
        const id = ref.identifier.name;
        if (!ref.resolved || !ref.resolved.defs.length) note(id, loadTime ? 'chargement' : 'appel');
      }
    // window.X lu (et non écrit) : X est une dépendance.
  }
  const walk = (n, parent) => {
    if (!n || typeof n.type !== 'string') return;
    if (
      n.type === 'MemberExpression' &&
      !n.computed &&
      n.object.type === 'Identifier' &&
      (n.object.name === 'window' || n.object.name === 'globalThis') &&
      !(parent && parent.type === 'AssignmentExpression' && parent.left === n)
    )
      note(n.property.name, 'appel');
    for (const k of Object.keys(n)) {
      if (k === 'range') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => walk(x, n));
      else if (v && typeof v.type === 'string') walk(v, n);
    }
  };
  walk(ast, null);
  return out;
}
function isTopIife(scope) {
  const fn = scope.block;
  if (scope.type !== 'function' || !scope.upper || scope.upper.type !== 'global') return false;
  // (() => { … })() ou (function () { … })() au premier niveau du fichier.
  return scope.upper.block.body.some(
    st =>
      st.type === 'ExpressionStatement' &&
      st.expression.type === 'CallExpression' &&
      st.expression.callee === fn
  );
}

// Noms exportés par les modules ES que le pont (bridge.js) expose en variables globales.
function bridgeNames() {
  const names = new Set();
  for (const m of MODULES.filter(x => x.kind === 'module')) {
    const entry = path.join(ROOT, m.file);
    const bridge = espree.parse(fs.readFileSync(entry, 'utf8'), { ecmaVersion: 2024, sourceType: 'module' });
    for (const imp of bridge.body.filter(st => st.type === 'ImportDeclaration')) {
      const file = path.resolve(path.dirname(entry), imp.source.value);
      const mod = espree.parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 2024, sourceType: 'module' });
      for (const st of mod.body.filter(x => x.type === 'ExportNamedDeclaration')) {
        const d = st.declaration;
        if (d?.type === 'FunctionDeclaration' || d?.type === 'ClassDeclaration') names.add(d.id.name);
        if (d?.type === 'VariableDeclaration') for (const v of d.declarations) names.add(v.id.name);
        for (const sp of st.specifiers || []) names.add(sp.exported.name);
      }
    }
  }
  return names;
}

function graph() {
  const scripts = MODULES.filter(m => m.kind === 'script');
  const info = scripts.map((m, order) => {
    const ast = parse(m.file);
    return { id: m.id, file: m.file, order, defines: definedNames(ast), reads: freeNames(ast) };
  });
  // Noms des modules ES exposés par le pont (shared/ et modules convertis) : fournis par « canaan-modules ».
  const owner = new Map();
  for (const n of bridgeNames()) owner.set(n, 'canaan-modules');
  for (const s of info) for (const n of s.defines) if (!owner.has(n)) owner.set(n, s.id);
  for (const s of info) {
    s.deps = new Map();
    s.unknown = [];
    for (const [name, when] of s.reads) {
      const o = owner.get(name);
      if (o === s.id) continue;
      if (!o) {
        s.unknown.push(name);
        continue;
      }
      if (o === 'canaan-modules') {
        (s.shared ??= new Set()).add(name);
        continue;
      }
      if (!s.deps.has(o)) s.deps.set(o, { chargement: [], appel: [] });
      s.deps.get(o)[when].push(name);
    }
  }
  return info;
}

const args = process.argv.slice(2);
const info = graph();
if (args[0] === '--json') {
  console.log(
    JSON.stringify(
      info.map(s => ({
        id: s.id,
        file: s.file,
        defines: [...s.defines],
        deps: Object.fromEntries(s.deps),
        shared: [...(s.shared || [])],
        unknown: s.unknown
      })),
      null,
      2
    )
  );
} else if (args[0] === '--why') {
  const [a, b] = args.slice(1).map(x => (x.startsWith('canaan-') ? x : 'canaan-' + x));
  const s = info.find(x => x.id === b);
  console.log(JSON.stringify(s?.deps.get(a) || {}, null, 2));
} else {
  const users = new Map(info.map(s => [s.id, 0]));
  for (const s of info) for (const d of s.deps.keys()) users.set(d, users.get(d) + 1);
  const short = id => id.replace('canaan-', '');
  const leaves = info.filter(s => s.deps.size === 0);
  console.log('Feuilles (ne lisent aucun autre script) : ' + leaves.map(s => short(s.id)).join(', ') + '\n');
  for (const s of info) {
    const deps = [...s.deps].map(([d, w]) => short(d) + (w.chargement.length ? '*' : ''));
    console.log(
      short(s.id).padEnd(22) +
        String(s.deps.size).padStart(3) +
        ' dépend. ' +
        String(users.get(s.id)).padStart(3) +
        ' utilis.  ' +
        deps.join(' ')
    );
  }
  console.log("\n* : au moins un nom lu au chargement (le script dépendu doit s'exécuter avant).");
}
