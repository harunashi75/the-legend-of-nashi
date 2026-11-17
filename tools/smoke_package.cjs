#!/usr/bin/env node
// Test de fumée du jeu installé (après npm run dist:linux ou dist:win) : lance l'exécutable livré avec un dossier de
// données temporaire (les vraies sauvegardes ne sont pas touchées), s'y connecte par le protocole de débogage de
// Chromium et vérifie que le jeu tourne vraiment : HTML chargé depuis l'archive du jeu, bonne version, menu des
// aventures prêt, sauvegarde écrite puis relue sur disque, réglages d'affichage, relais du coopératif démarré puis
// arrêté, aucune erreur JavaScript.
//
//   node tools/smoke_package.cjs dist/linux-unpacked/legend-of-nashi
//   node tools/smoke_package.cjs dist/Legend-of-Nashi-0.9.8-linux-x86_64.AppImage
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require('ws');

const exe = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(exe)) {
  console.error('usage : node tools/smoke_package.cjs <exécutable du jeu installé>');
  process.exit(2);
}
const version = require('../package.json').version;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nashi-smoke-'));
const port = 9300 + Math.floor(Math.random() * 500);
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(exe, ['--user-data-dir=' + dataDir, '--remote-debugging-port=' + port], {
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
child.stdout.on('data', d => (output += d));
child.stderr.on('data', d => (output += d));
// Échec tant que le bilan n'est pas fait : une sortie anticipée ne passe jamais pour un succès.
process.exitCode = 1;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const checks = [];
const check = (ok, label, detail = '') => {
  checks.push(ok);
  console.log((ok ? '  ✔ ' : '  ✖ ') + label + (detail ? ' — ' + detail : ''));
};

async function pageTarget() {
  for (let i = 0; i < 150; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = list.find(t => t.type === 'page' && t.url.startsWith('file:'));
      if (page) return page;
    } catch {}
    if (child.exitCode !== null) break;
    await sleep(200);
  }
  throw new Error('fenêtre du jeu introuvable\n' + output);
}

async function main() {
  const page = await pageTarget();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => (ws.once('open', res), ws.once('error', rej)));
  let id = 0;
  const pending = new Map(),
    errors = [];
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) pending.get(m.id)(m);
    else if (m.method === 'Runtime.exceptionThrown')
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
      errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
  });
  const send = (method, params = {}) =>
    new Promise(res => {
      pending.set(++id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const run = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails)
      throw new Error(expr + ' : ' + r.result.exceptionDetails.exception?.description);
    return r.result.result.value;
  };
  await send('Runtime.enable');
  // Menu des aventures prêt (écran de chargement levé, cartes des aventures affichées).
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    ready = await run(
      "document.readyState === 'complete' && typeof CANAAN_VERSION === 'string' && !!document.querySelector('[data-action]')"
    );
    if (!ready) await sleep(200);
  }
  console.log('Jeu installé : ' + exe);
  const info = await run(
    '({ url: location.href, version: CANAAN_VERSION, desktop: typeof canaanDesktop, title: document.title })'
  );
  check(
    /app\.asar\/CANAAN_ONLINE_V[\d_]+\.html$/.test(decodeURIComponent(info.url)),
    'HTML chargé depuis l’archive du jeu',
    path.basename(info.url)
  );
  check(info.version === version, 'version ' + info.version, 'package.json : ' + version);
  check(ready, 'menu des aventures prêt', info.title);
  check(info.desktop === 'object', 'pont de l’application (canaanDesktop) présent');
  // Nouvelle aventure, comme un joueur : « Nouvelle aventure » puis « Créer » ; le jeu démarre et sauvegarde sur disque.
  await run("document.querySelector('[data-action=newSlot][data-slot=\\'1\\']').click()");
  await sleep(300);
  await run("document.querySelector('[data-action=createSlot]').click()");
  const savesDir = path.join(dataDir, 'saves');
  let saved = false,
    started = false;
  for (let i = 0; i < 100 && !(saved && started); i++) {
    await sleep(200);
    saved =
      fs.existsSync(savesDir) &&
      fs.readdirSync(savesDir, { recursive: true }).some(f => /\.json$/.test(String(f)));
    started = await run("typeof started !== 'undefined' && started === true").catch(() => false);
  }
  check(started, 'nouvelle aventure lancée');
  check(
    saved,
    'sauvegarde écrite sur disque',
    saved ? fs.readdirSync(savesDir, { recursive: true }).join(', ') : ''
  );
  const display = await run('canaanDesktop.display.get()');
  check(display && typeof display.fullscreen === 'boolean', 'réglages d’affichage', JSON.stringify(display));
  // Relais du coopératif (relay/server.cjs et règles partagées, livrés dans l'archive).
  const lan = await run('canaanDesktop.hosting.startLan().then(s => s, e => ({ error: e.message }))');
  check(
    lan && !lan.error,
    'relais du coopératif démarré (réseau local)',
    lan?.error || lan?.url || JSON.stringify(lan)
  );
  await run('canaanDesktop.hosting.stop()');
  await sleep(1500);
  check(!errors.length, 'aucune erreur JavaScript', errors.slice(0, 3).join(' | '));
  // Fermeture demandée sans attendre de réponse : le navigateur se ferme avant de répondre.
  ws.send(JSON.stringify({ id: ++id, method: 'Browser.close' }));
  ws.close();
}

main()
  .catch(e => check(false, 'démarrage', e.message))
  .finally(async () => {
    await sleep(500);
    if (child.exitCode === null) child.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
    const ok = checks.length > 0 && checks.every(Boolean);
    // Écrire avant de quitter : process.exit couperait une sortie redirigée vers un fichier ou un tube.
    process.stdout.write((ok ? 'Jeu installé : OK' : 'Jeu installé : ÉCHEC') + '\n', () =>
      process.exit(ok ? 0 : 1)
    );
  });
