// Jeu installable (electron-builder.yml) : tout ce que l'application charge est livré, rien de ce qu'elle charge ne
// vient des dépendances de développement, et l'icône est utilisable. Le lancement réel du jeu installé est vérifié
// par tools/smoke_package.cjs (après npm run dist:linux ou dist:win, et dans la release).
const { test } = require('node:test');
const { fs, assert, path } = require('./helpers/context.cjs');
const { builtinModules } = require('node:module');

const ROOT = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const config = fs.readFileSync(path.join(ROOT, 'electron-builder.yml'), 'utf8');

// Motifs de la liste files: (« ! » : exclu), traduits en expressions régulières sur les chemins du dépôt.
const patterns = [];
for (const line of config.slice(config.indexOf('\nfiles:') + 8).split('\n')) {
  if (!/^\s+- /.test(line)) break;
  patterns.push(line.replace(/^\s+- /, '').replace(/^'|'$/g, ''));
}
const toRegex = glob =>
  new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').split('**').map(part => part.replace(/\*/g, '[^/]*')).join('.*') + '$');
const shipped = file => {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  let ok = false;
  for (const p of patterns) if (p.startsWith('!') ? toRegex(p.slice(1)).test(rel) : toRegex(p).test(rel)) ok = !p.startsWith('!');
  return ok;
};

test('Jeu installable : chaque fichier chargé par l’application est livré, sans dépendance de développement', () => {
  assert.ok(patterns.length >= 4, 'liste files: lue : ' + patterns.join(', '));
  const seen = new Set(),
    external = new Set(),
    todo = [path.join(ROOT, pkg.main)];
  while (todo.length) {
    const file = todo.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    assert.ok(shipped(file), path.relative(ROOT, file) + ' est chargé par l’application mais pas livré (electron-builder.yml, files:)');
    const src = fs.readFileSync(file, 'utf8');
    for (const [, spec] of src.matchAll(/(?:require\(|import\(|\bfrom\s+)\s*['"]([^'"]+)['"]/g)) {
      if (spec.startsWith('.')) todo.push(path.resolve(path.dirname(file), spec));
      else external.add(spec.replace(/^node:/, '').split('/')[0]);
    }
  }
  assert.ok(seen.size > 10, 'fichiers suivis : ' + seen.size);
  for (const name of external)
    assert.ok(
      builtinModules.includes(name) || name === 'electron' || Object.hasOwn(pkg.dependencies, name),
      name + ' : module chargé par le jeu installé mais absent de "dependencies" (les devDependencies ne sont pas livrées)'
    );
  // Le HTML assemblé est livré sous le nom que cherche le jeu installé (version de package.json).
  assert.ok(shipped(path.join(ROOT, 'CANAAN_ONLINE_V' + pkg.version.replace(/\./g, '_') + '.html')));
  // Rien des sources du jeu, des tests ni des outils.
  for (const f of ['src/canaan/scripts/game-core.js', 'tests/art.test.cjs', 'tools/build.cjs', 'src/canaan/template.html'])
    assert.ok(!shipped(path.join(ROOT, f)), f + ' ne doit pas être livré');
});

test('Jeu installable : outils épinglés, icône carrée d’au moins 512 px, nom de bureau Linux, Steam hors archive', () => {
  assert.match(pkg.devDependencies['electron-builder'], /^\d+\.\d+\.\d+$/, 'version exacte');
  const png = fs.readFileSync(path.join(ROOT, 'build', 'icon.png'));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  assert.ok(w === h && w >= 512, w + ' × ' + h);
  assert.match(config, /^\s+icon: build\/icon\.png$/m);
  assert.equal(pkg.desktopName, 'legend-of-nashi.desktop');
  // Bibliothèque Steam : binaires natifs hors de l'archive (sinon ils ne se chargent pas dans le jeu installé).
  assert.match(config, /asarUnpack:\n\s+- node_modules\/steamworks\.js\/dist\/\*\*/);
  assert.match(pkg.dependencies['steamworks.js'], /^\d+\.\d+\.\d+$/, 'version exacte');
  assert.match(config, /executableName: legend-of-nashi\n/);
});

test('Jeu installable : le processus principal n’écrit jamais directement sur la console (EBADF sous Windows)', () => {
  // Sans console (jeu lancé par Steam ou l'Explorateur sous Windows), console.log peut lever EBADF et arrêter le jeu au
  // démarrage : tout passe par log() de app/main.js, qui ne lève jamais.
  for (const file of fs.readdirSync(path.join(ROOT, 'app'))) {
    const src = fs.readFileSync(path.join(ROOT, 'app', file), 'utf8'),
      uses = src.match(/\bconsole\.\w+/g) || [];
    if (file === 'main.js') {
      assert.deepEqual(uses, ['console.log'], 'une seule écriture, dans log()');
      assert.ok(src.includes('function log(...parts) {\n  try {\n    console.log(...parts);\n  } catch {}'), 'log() protégé');
    } else assert.deepEqual(uses, [], file);
  }
});

test('Jeu installable sous Linux : script de lancement qui coupe le bac à sable de Chromium seulement là où il ne peut pas démarrer', { skip: process.platform !== 'linux' }, () => {
  // Ubuntu 24.04+ : sans espaces de noms utilisateur ni chrome-sandbox à root, Chromium s'arrête avant app/main.js.
  assert.match(config, /^afterPack: tools\/after_pack\.cjs$/m);
  const { execFileSync } = require('node:child_process'),
    os = require('node:os'),
    hook = require('../tools/after_pack.cjs').default,
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nashi-afterpack-'));
  try {
    // Faux programme : il affiche ses arguments.
    fs.writeFileSync(path.join(dir, 'legend-of-nashi'), '#!/bin/sh\nprintf "%s|" "$@"\n', { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'chrome-sandbox'), '');
    const ctx = platform => ({ electronPlatformName: platform, appOutDir: dir, packager: { executableName: 'legend-of-nashi' } });
    hook(ctx('win32'));
    assert.ok(!fs.existsSync(path.join(dir, 'legend-of-nashi.bin')), 'rien à faire hors de Linux');
    hook(ctx('linux'));
    assert.ok(fs.statSync(path.join(dir, 'legend-of-nashi')).mode & 0o100, 'script exécutable');
    assert.match(fs.readFileSync(path.join(dir, 'legend-of-nashi'), 'utf8'), /^#!\/bin\/sh\n/);
    const launch = env => execFileSync(path.join(dir, 'legend-of-nashi'), ['--un', 'deux mots'], { env: { ...process.env, ...env }, encoding: 'utf8' });
    // Forcé : --no-sandbox, et les arguments du joueur passent tels quels (espaces compris).
    assert.equal(launch({ NASHI_NO_SANDBOX: '1' }), '--no-sandbox|--un|deux mots|');
    // Sinon, selon les réglages du noyau de la machine (Arch, SteamOS : bac à sable gardé ; Ubuntu 24.04+ : coupé).
    const sysctl = (file, value) => {
      try {
        return fs.readFileSync(file, 'utf8').trim() === value;
      } catch {
        return false;
      }
    };
    const restricted =
      sysctl('/proc/sys/kernel/apparmor_restrict_unprivileged_userns', '1') ||
      sysctl('/proc/sys/kernel/unprivileged_userns_clone', '0') ||
      sysctl('/proc/sys/user/max_user_namespaces', '0');
    assert.equal(launch({ NASHI_NO_SANDBOX: '' }), (restricted ? '--no-sandbox|' : '') + '--un|deux mots|');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
