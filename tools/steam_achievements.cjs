#!/usr/bin/env node
// Succès Steam : liste des 100 succès du jeu à déclarer sur le site Steamworks (nom d'API, titre, description), tirée
// du jeu lui-même (CANAAN_ACHIEVEMENTS), en français et en anglais (dictionnaire du jeu), et leurs icônes 256 × 256
// dessinées avec les icônes du jeu.
//
//   node tools/steam_achievements.cjs            # écrit steam/achievements.csv et achievements_en.csv (test : à jour)
//   node tools/steam_achievements.cjs --check    # vérifie seulement que les deux listes sont à jour
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

// Anglais : le même dictionnaire que le jeu (client/i18n/en.js). Tous les textes doivent y être.
run('CANAAN_I18N.use("en")');
const english = JSON.parse(
  run(`JSON.stringify({
    cats: CANAAN_ACHIEVEMENTS.CATS.map(c => [c.id, CANAAN_I18N.translate(c.name)]),
    list: CANAAN_ACHIEVEMENTS.LIST.map(a => ({ name: CANAAN_I18N.translate(a.name), desc: CANAAN_I18N.translate(a.desc) }))
  })`)
);
const missing = list.flatMap((a, k) =>
  ['name', 'desc']
    .filter(f => english.list[k][f] === a[f])
    .map(f => steamName(a.id) + ' (' + f + ') : ' + a[f])
);
if (missing.length) {
  console.error('Succès sans traduction anglaise (client/i18n/en.js) :\n  ' + missing.join('\n  '));
  process.exit(1);
}
const CATS_EN = Object.fromEntries(english.cats);

const cell = v => (/[",\n;]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
const table = (head, rows) => [head].concat(rows.map(r => r.map(cell).join(','))).join('\n') + '\n';
const files = {
  'achievements.csv': table(
    'Nom d’API,Titre,Description,Catégorie,Icône obtenue,Icône non obtenue',
    list.map(a => [steamName(a.id), a.name, a.desc, CATS[a.cat] || a.cat, ...icons(a)])
  ),
  'achievements_en.csv': table(
    'API name,Name,Description,Category,Achieved icon,Unachieved icon',
    list.map((a, k) => [
      steamName(a.id),
      english.list[k].name,
      english.list[k].desc,
      CATS_EN[a.cat] || a.cat,
      ...icons(a)
    ])
  )
};
function icons(a) {
  return [steamName(a.id) + '.png', steamName(a.id) + '_locked.png'];
}
if (process.argv.includes('--check')) {
  const stale = Object.keys(files).filter(
    name =>
      !fs.existsSync(path.join(OUT, name)) || fs.readFileSync(path.join(OUT, name), 'utf8') !== files[name]
  );
  console.log(
    stale.length
      ? 'Différent : ' + stale.map(n => 'steam/' + n).join(', ') + ' → node tools/steam_achievements.cjs'
      : 'steam/achievements.csv et steam/achievements_en.csv à jour.'
  );
  process.exit(stale.length ? 1 : 0);
}
fs.mkdirSync(OUT, { recursive: true });
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), text);
console.log('steam/achievements.csv et steam/achievements_en.csv : ' + list.length + ' succès');

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
