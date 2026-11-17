// Steam : module de l'application (app/steam.js) avec un faux Steam, report des succès du jeu, liste à déclarer.
const { test } = require('node:test');
const { assert, path, source } = require('./helpers/context.cjs');
const { execFileSync } = require('node:child_process');
const { createSteam, steamName } = require('../app/steam.js');

// Faux steamworks.js : garde les succès activés ; `refuse` simule un Steam qui n'accepte pas encore.
function fakeSteam({ initError = null, refuse = false } = {}) {
  const fake = { inits: [], activated: new Set(), calls: [], overlay: 0, refuse };
  fake.lib = {
    init(appId) {
      if (initError) throw new Error(initError);
      fake.inits.push(appId);
      return {
        achievement: {
          isActivated: name => fake.activated.has(name),
          activate: name => {
            fake.calls.push(name);
            if (fake.refuse) return false;
            fake.activated.add(name);
            return true;
          }
        },
        localplayer: { getName: () => 'Haru' }
      };
    },
    electronEnableSteamOverlay: () => fake.overlay++
  };
  return fake;
}

test('Steam : inactif hors de Steam, sans bibliothèque ou client fermé, sans jamais bloquer le jeu', () => {
  const fake = fakeSteam();
  const off = createSteam({ env: {}, load: () => fake.lib });
  assert.deepEqual(off.status(), { loaded: true, available: false, appId: null, user: null, reason: 'jeu lancé hors de Steam' });
  assert.equal(off.unlock(['c1']), 0);
  assert.equal(off.enableOverlay(), false);
  assert.deepEqual(fake.inits, [], 'Steam jamais contacté hors de Steam');
  const missing = createSteam({ env: { SteamAppId: '480' }, load: () => { throw new Error('absent'); } });
  assert.equal(missing.status().loaded, false);
  assert.match(missing.status().reason, /bibliothèque Steam indisponible/);
  const closed = createSteam({ env: { SteamAppId: '480' }, load: () => fakeSteam({ initError: 'no client' }).lib });
  assert.deepEqual([closed.status().loaded, closed.status().available], [true, false]);
  assert.match(closed.status().reason, /Steam injoignable/);
  assert.equal(closed.unlock(['c1']), 0);
});

test('Steam : succès envoyés une fois, identifiants vérifiés, renvoyés tant que Steam ne les a pas acceptés', () => {
  const fake = fakeSteam();
  const steam = createSteam({ env: { SteamAppId: '2468' }, load: () => fake.lib });
  assert.deepEqual(fake.inits, [2468]);
  assert.deepEqual(steam.status(), { loaded: true, available: true, appId: 2468, user: 'Haru', reason: '' });
  assert.equal(steam.unlock(['c1', 'e12', 'pas valide !', 7, '', 'x'.repeat(41)]), 2);
  assert.deepEqual(fake.calls, ['ACH_C1', 'ACH_E12']);
  assert.equal(steam.unlock(['c1', 'e12']), 2, 'déjà obtenus : rien de plus envoyé');
  assert.deepEqual(fake.calls, ['ACH_C1', 'ACH_E12']);
  assert.equal(steam.unlock('c1'), 0);
  // Steam refuse (statistiques pas encore reçues) : le succès reste en attente et repart au prochain envoi.
  fake.refuse = true;
  steam.unlock(['d3']);
  assert.deepEqual(steam.pending(), ['ACH_D3']);
  fake.refuse = false;
  steam.unlock([]);
  assert.deepEqual(steam.pending(), []);
  assert.ok(fake.activated.has('ACH_D3'));
  // Le client Steam fournit SteamGameId à la place de SteamAppId selon les cas ; un essai passe par NASHI_STEAM_APPID.
  const other = fakeSteam();
  createSteam({ env: { NASHI_STEAM_APPID: '480' }, load: () => other.lib });
  assert.deepEqual(other.inits, [480]);
  // Superposition : activée avec Steam, coupée par NASHI_STEAM_OVERLAY=0.
  assert.equal(steam.enableOverlay(), true);
  assert.equal(createSteam({ env: { SteamAppId: '1', NASHI_STEAM_OVERLAY: '0' }, load: () => fakeSteam().lib }).enableOverlay(), false);
  assert.equal(steamName('m17'), 'ACH_M17');
});

test('Steam : le jeu reporte les succès du héros joué, anciens compris, et les nouveaux dès leur déblocage', () => {
  const { run, errors } = require('./helpers/canaan-runtime.cjs')(source);
  run(`globalThis.__sent = []; canaanDesktop = { steam: { unlock: ids => __sent.push(ids.slice().sort()) } };
    started = true; game.hero.succes = { done: { c1: 1, e2: 1, inconnu: 1 }, s: {}, sets: {}, best: {}, title: '' };
    CANAAN_ACHIEVEMENTS.steamSync(); CANAAN_ACHIEVEMENTS.steamSync();`);
  assert.equal(run('JSON.stringify(__sent)'), JSON.stringify([['c1', 'e2']]), 'une fois, succès inconnus écartés');
  // Un nouveau succès débloqué en jeu part aussitôt.
  run('game.hero.succes.s.kills = 1e6; CANAAN_ACHIEVEMENTS.evaluate(game.hero)');
  const last = JSON.parse(run('JSON.stringify(__sent.at(-1))'));
  assert.ok(last.length > 2 && last.includes('c1') && last.includes('c2'), last.join());
  // Invité : son carnet arrive de l'hôte et part aussi vers son Steam.
  run('__sent.length = 0; CANAAN_ACHIEVEMENTS.applyRemote({ done: { c1: 1, c2: 1, x9: 1 } })');
  assert.equal(run('JSON.stringify(__sent)'), JSON.stringify([['c1', 'c2']]));
  assert.deepEqual(errors, []);
});

test('Steam : liste des succès à déclarer (steam/achievements.csv) à jour avec le jeu', () => {
  // Échoue si un succès a été ajouté, renommé ou retiré sans régénérer la liste.
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'steam_achievements.cjs'), '--check'], {
    encoding: 'utf8',
    env: { ...process.env, CANAAN_HTML: '' }
  });
  assert.match(out, /à jour/);
});
