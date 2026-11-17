#!/usr/bin/env node
// Succès Steam : liste des 100 succès du jeu à déclarer sur le site Steamworks (nom d'API, titre, description), tirée
// du jeu lui-même (CANAAN_ACHIEVEMENTS), et leurs icônes 256 × 256 dessinées avec les icônes du jeu.
//
//   node tools/steam_achievements.cjs            # écrit steam/achievements.csv (à jour ? un test le vérifie)
//   node tools/steam_achievements.cjs --check    # vérifie seulement que steam/achievements.csv est à jour
//   node tools/steam_achievements.cjs --icons    # dessine aussi steam/icons/ (succès obtenu, et gris : pas obtenu)
//
// Le nom d'API d'un succès est ACH_ suivi de son identifiant (c1 → ACH_C1), comme dans app/steam.js.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { steamName } = require('../app/steam.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'steam');
const version = /CANAAN_VERSION\s*=\s*'([^']+)'/.exec(
  fs.readFileSync(path.join(ROOT, 'src', 'canaan', 'scripts', 'runtime-config.js'), 'utf8')
)[1];
const html = path.join(ROOT, 'CANAAN_ONLINE_V' + version.replace(/\./g, '_') + '.html');
if (!fs.existsSync(html)) {
  console.error('HTML introuvable : exécuter npm run build');
  process.exit(1);
}

// Le jeu chargé sans écran (même démarrage que les tests) donne la liste et l'icône de chaque succès.
const { run } = require('../tests/helpers/canaan-runtime.cjs')(fs.readFileSync(html, 'utf8'));
const CATS = Object.fromEntries(
  JSON.parse(run('JSON.stringify(CANAAN_ACHIEVEMENTS.CATS)')).map(c => [c.id, c.name])
);
const list = JSON.parse(
  run(`JSON.stringify(CANAAN_ACHIEVEMENTS.LIST.map(a => ({ id: a.id, cat: a.cat, name: a.name, desc: a.desc,
    svg: CANAAN_ICONS.svg(CANAAN_ICONS.nameOf(a.icon), 'ico') })))`)
);

const cell = v => (/[",\n;]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
const csv =
  ['Nom d’API,Titre,Description,Catégorie,Icône obtenue,Icône non obtenue']
    .concat(
      list.map(a =>
        [
          steamName(a.id),
          a.name,
          a.desc,
          CATS[a.cat] || a.cat,
          steamName(a.id) + '.png',
          steamName(a.id) + '_locked.png'
        ]
          .map(cell)
          .join(',')
      )
    )
    .join('\n') + '\n';
const file = path.join(OUT, 'achievements.csv');
if (process.argv.includes('--check')) {
  const same = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === csv;
  console.log(
    same
      ? 'steam/achievements.csv à jour.'
      : 'steam/achievements.csv différent : node tools/steam_achievements.cjs'
  );
  process.exit(same ? 0 : 1);
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(file, csv);
console.log('steam/achievements.csv : ' + list.length + ' succès');

if (process.argv.includes('--icons')) {
  // Dessin dans Electron (canevas du navigateur) : cadre doré aux couleurs de la catégorie, icône du jeu au centre.
  const job = path.join(OUT, 'icons', 'job.json');
  fs.mkdirSync(path.dirname(job), { recursive: true });
  fs.writeFileSync(job, JSON.stringify(list.map(a => ({ name: steamName(a.id), cat: a.cat, svg: a.svg }))));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const r = spawnSync(require('electron'), [path.join(__dirname, 'steam_icons.cjs'), job], {
    stdio: 'inherit',
    env
  });
  fs.rmSync(job, { force: true });
  process.exit(r.status ?? 1);
}
