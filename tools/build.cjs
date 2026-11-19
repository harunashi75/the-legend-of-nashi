#!/usr/bin/env node
// Assemble les sources ordonnées en un HTML autonome, sans dépendance externe : template.html, puis chaque entrée de
// manifest.json à son marqueur (scripts classiques et feuilles de style tels quels, modules ES regroupés par esbuild en
// un seul script). Un seul outil pour tout le projet : Node et esbuild.
//
//   node tools/build.cjs                # écrit CANAAN_ONLINE_V<version>.html (npm run build) : jeu de sortie
//   node tools/build.cjs --extensions   # même HTML, avec les extensions en préparation (npm start, npm run build:dev)
//   node tools/build.cjs --check        # vérifie seulement que le HTML est à jour (npm run check, CI)
//
// Extensions : une entrée du manifeste marquée « extension » (Extension 1 : la Vallée des Héros) n'est assemblée
// qu'avec --extensions. Le build par défaut, celui de la CI, de la release GitHub et de Steam, la retire entièrement
// du HTML : rien de son contenu n'est livré, la région reste couverte de nuages et fermée.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'src', 'canaan');

// Version unique de l'application, déclarée dans runtime-config.js.
function readVersion() {
  const config = fs.readFileSync(path.join(SOURCE, 'scripts', 'runtime-config.js'), 'utf8');
  const match = /CANAAN_VERSION\s*=\s*'(\d+(?:\.\d+)*[a-z]?)'/.exec(config);
  if (!match) throw new Error('Version introuvable dans scripts/runtime-config.js');
  return match[1];
}
const VERSION = readVersion();
// Nom du HTML généré, déduit de la version.
const OUTPUT = path.join(ROOT, 'CANAAN_ONLINE_V' + VERSION.replace(/\./g, '_') + '.html');

// Regroupe un point d'entrée de modules ES (import/export) en un script classique.
function bundle(entry) {
  const result = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    charset: 'utf8',
    target: 'es2022',
    legalComments: 'none',
    logLevel: 'warning',
    write: false,
    absWorkingDir: ROOT
  });
  return result.outputFiles[0].text;
}

// Entrées du manifeste, extensions comprises.
function manifest() {
  return JSON.parse(fs.readFileSync(path.join(SOURCE, 'manifest.json'), 'utf8')).modules;
}

// extensions : true pour assembler aussi les extensions en préparation (jamais pour la sortie).
function render({ extensions = false } = {}) {
  // {{VERSION}} : la version du template vient de runtime-config.js, jamais écrite en dur.
  let html = fs.readFileSync(path.join(SOURCE, 'template.html'), 'utf8').replaceAll('{{VERSION}}', VERSION);
  const modules = manifest();
  const markers = [...html.matchAll(/<!-- canaan:(script|style|module):(canaan-[a-z0-9-]+) -->/g)].map(
    m => m[1] + ':' + m[2]
  );
  if (markers.join('\n') !== modules.map(m => m.kind + ':' + m.id).join('\n'))
    throw new Error('L’ordre des modules doit être identique dans template.html et manifest.json');
  const ids = new Set();
  for (const { kind, id, file, extension } of modules) {
    if (!['script', 'style', 'module'].includes(kind) || !/^canaan-[a-z0-9-]+$/.test(id))
      throw new Error('Module invalide : ' + id);
    if (extension !== undefined && (!/^[a-z]+$/.test(extension) || kind === 'module'))
      throw new Error('Extension invalide : ' + id);
    if (ids.has(id)) throw new Error('Identifiant dupliqué : ' + id);
    ids.add(id);
    const marker = '<!-- canaan:' + kind + ':' + id + ' -->';
    if (html.split(marker).length !== 2) throw new Error('Marqueur absent ou dupliqué : ' + id);
    const source = path.resolve(SOURCE, file);
    if (path.relative(SOURCE, source).startsWith('..')) throw new Error('Source hors du dossier : ' + id);
    // Extension en préparation hors de ce build : son marqueur disparaît, rien de son contenu n'est lu.
    if (extension && !extensions) {
      html = html.replace(marker, '');
      continue;
    }
    // Un module ES est regroupé avec ses imports ; il s'insère comme un script classique.
    const code = (kind === 'module' ? bundle(source) : fs.readFileSync(source, 'utf8')).trimEnd();
    const tag = kind === 'module' ? 'script' : kind;
    if (code.toLowerCase().includes('</' + tag))
      throw new Error('Balise de fermeture dans la source : ' + id);
    const attrs = extension ? ' data-extension="' + extension + '"' : '';
    html = html.replace(
      marker,
      () => '<' + tag + ' id="' + id + '"' + attrs + '>\n' + code + '\n</' + tag + '>'
    );
  }
  if (html.includes('<!-- canaan:')) throw new Error('Le template contient un module absent du manifeste');
  return html;
}

module.exports = { render, manifest, VERSION, OUTPUT };

if (require.main === module) {
  const extensions = process.argv.includes('--extensions');
  if (process.argv.includes('--check')) {
    // Le HTML sur le disque peut être celui de la sortie ou celui de test (npm start) : les deux sont à jour.
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : null;
    if (current === render()) console.log('HTML autonome à jour.');
    else if (current === render({ extensions: true }))
      console.log('HTML autonome à jour (avec les extensions).');
    else {
      console.error('HTML différent des sources. Exécuter npm run build');
      process.exit(1);
    }
  } else {
    const html = render({ extensions });
    fs.writeFileSync(OUTPUT, html);
    console.log(
      'HTML autonome généré : ' +
        path.basename(OUTPUT) +
        (extensions ? ' avec les extensions' : '') +
        ' (' +
        Buffer.byteLength(html) +
        ' octets)'
    );
  }
}
