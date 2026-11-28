#!/usr/bin/env node
// Supprime les sorties de build qui s'accumulent dans le dossier (npm run clean) : paquets d'electron-builder (dist/,
// release/, out/) et HTML autonomes des versions précédentes. Le HTML de la version courante est gardé (les tests le
// lisent) ; npm run build le refait de toute façon. Rien de suivi par git n'est touché.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { OUTPUT } = require('./build.cjs');

const ROOT = path.resolve(__dirname, '..');
for (const dir of ['dist', 'release', 'out']) {
  const full = path.join(ROOT, dir);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log('Supprimé : ' + dir + '/');
  }
}
for (const name of fs.readdirSync(ROOT))
  if (/^CANAAN_ONLINE_V[\d_]+[a-z]?\.html$/.test(name) && name !== path.basename(OUTPUT)) {
    fs.unlinkSync(path.join(ROOT, name));
    console.log('Supprimé : ' + name);
  }
