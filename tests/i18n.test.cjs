const { test } = require('node:test');
const { fs, assert, path, source } = require('./helpers/context.cjs');
const espree = require('espree');

const ROOT = path.join(__dirname, '..', 'src', 'canaan');
const I18N = path.join(ROOT, 'client', 'i18n');
const LANGS = ['en'];
const placeholders = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('Dictionnaires : aucune clé en double, mêmes valeurs insérées, aucune traduction qui serait retraduite', async () => {
 for (const lang of LANGS) {
  const file = path.join(I18N, lang + '.js');
  const ast = espree.parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module', loc: true });
  const object = ast.body.find(n => n.type === 'ExportDefaultDeclaration').declaration;
  const seen = new Map();
  for (const prop of object.properties) {
   assert.equal(prop.key.type, 'Literal', lang + ' : clé non textuelle ligne ' + prop.loc.start.line);
   assert.ok(!seen.has(prop.key.value), lang + ' : « ' + prop.key.value + ' » en double (lignes ' + seen.get(prop.key.value) + ' et ' + prop.loc.start.line + ')');
   seen.set(prop.key.value, prop.loc.start.line);
  }
  const dict = (await import(file)).default;
  for (const [fr, out] of Object.entries(dict)) {
   assert.equal(typeof out, 'string', fr);
   assert.ok(out.trim(), lang + ' : traduction vide pour « ' + fr + ' »');
   const key = fr.includes('|') ? fr.slice(fr.indexOf('|') + 1) : fr;
   assert.equal(placeholders(out), placeholders(key), lang + ' : valeurs insérées différentes pour « ' + fr + ' »');
   // Un modèle doit garder du texte fixe : « {a} {b} » reconnaîtrait n'importe quoi.
   // Avec seulement des valeurs numériques ({n}, {m}, {s}, {max}, {or}), une lettre suffit (« N°{n} »).
   const numeric = [...key.matchAll(/\{(\w+)\}/g)].every(m => ['n', 'm', 's', 'max', 'or'].includes(m[1]));
   if (placeholders(key)) assert.ok((numeric ? /\p{L}/u : /\p{L}{2}/u).test(key.replace(/\{\w+\}/g, '')), lang + ' : modèle sans texte fixe « ' + fr + ' »');
   // Repassée au point de passage, une traduction ne doit pas devenir autre chose.
   if (Object.hasOwn(dict, out)) assert.equal(dict[out], out, lang + ' : « ' + out + ' » est aussi une clé traduite autrement');
  }
 }
});

test('Traduction au point de passage : texte entier, cœur sans émoji ni ponctuation, modèles, morceaux composés', async () => {
 const { CANAAN_I18N: I, translateText, tt } = await import(path.join(I18N, 'i18n.js'));
 // Français : tout passe tel quel.
 assert.equal(I.lang(), 'fr');
 assert.equal(translateText('⚙️ Paramètres'), '⚙️ Paramètres');
 assert.equal(tt('Niveau {n}', { n: 4 }), 'Niveau 4');
 assert.ok(I.use('en'));
 const cases = {
  '⚙️ Paramètres': '⚙️ Settings',
  'Niv. 12': 'Lv. 12',
  'Or :': 'Gold:',
  '[E] Entrer': '[E] Enter',
  '💾 Partie sauvegardée !': '💾 Game saved!',
  '+7 or': '+7 gold',
  '120': '120',
  'Sac — 4/10 emplacements': 'Bag — 4/10 slots',
  'Classe et talents (Y)': 'Class and talents (Y)',
  'Survole un objet pour afficher son comparatif. 💰 Marchand proche : vente disponible.': 'Hover over an item to compare it. 💰 Merchant nearby: selling available.',
  'Texte encore inconnu': 'Texte encore inconnu'
 };
 for (const [fr, en] of Object.entries(cases)) assert.equal(translateText(fr), en, fr);
 // Une traduction repassée reste telle quelle ; un texte inconnu est relevé.
 assert.equal(translateText('⚙️ Settings'), '⚙️ Settings');
 assert.ok(I.missing().includes('Texte encore inconnu'));
 // Dans le code : contexte d'un mot à deux sens, valeurs insérées.
 assert.equal(tt('Retour'), 'Back');
 assert.equal(tt('Retour', null, 'touche'), 'Backspace');
 assert.equal(tt('Niveau {n}', { n: 3 }), 'Level 3');
 assert.equal(tt('Phrase sans traduction {n}', { n: 1 }), 'Phrase sans traduction 1');
 I.use('fr');
 assert.equal(translateText('⚙️ Paramètres'), '⚙️ Paramètres');
});

test('Chaque tt("…") du code a sa traduction anglaise', async () => {
 const dict = (await import(path.join(I18N, 'en.js'))).default;
 const files = [];
 const walk = dir => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
   const p = path.join(dir, e.name);
   if (e.isDirectory()) walk(p);
   else if (e.name.endsWith('.js')) files.push(p);
  }
 };
 walk(path.join(ROOT, 'scripts'));
 walk(path.join(ROOT, 'client'));
 const missing = [];
 for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  for (const m of code.matchAll(/\btt\(\s*'((?:[^'\\]|\\.)*)'(?:\s*,\s*(?:null|\{[^}]*\}|[\w.]+)\s*(?:,\s*'([^']+)')?)?\s*\)/g)) {
   const text = m[1].replace(/\\'/g, "'"), key = m[2] ? m[2] + '|' + text : text;
   if (!Object.hasOwn(dict, key) && !Object.hasOwn(dict, text)) missing.push(path.relative(ROOT, file) + ' : ' + key);
  }
 }
 assert.deepEqual(missing, []);
});

test('Langue : réglage dans Paramètres → Interface, gardé, et partie relancée dans la langue choisie', () => {
 const html = source.slice(source.indexOf('id="settingsPane-interface"'), source.indexOf('id="settingsPane-keyboard"'));
 assert.match(html, /data-key="language"/);
 assert.match(html, /id="setLanguage"/);
 const boot = require('./helpers/canaan-runtime.cjs');
 const { g, run, errors } = boot(source);
 assert.equal(errors.length, 0, errors.join('\n'));
 assert.equal(run('CANAAN_I18N.lang()'), 'fr');
 let reloads = 0;
 g.location.reload = () => reloads++;
 run('started=false;settingsStep("language",1)');
 assert.equal(reloads, 1);
 assert.equal(run('CANAAN_PREFERENCES.read("language",{}).lang'), 'en');
 // Au démarrage suivant, le jeu est en anglais : textes du code traduits, aucune erreur.
 const en = boot(source, {
  beforeScript: (m, runCode) => {
   if (m[1].includes('canaan-modules')) runCode('localStorage.setItem("canaan_language_v1",JSON.stringify({lang:"en"}))');
  }
 });
 assert.equal(en.errors.length, 0, en.errors.join('\n'));
 assert.equal(en.run('CANAAN_I18N.lang()'), 'en');
 assert.equal(en.run('CANAAN_KEYS.label("backspace")'), 'Backspace');
 assert.equal(en.run('CANAAN_I18N.translate("💾 Partie sauvegardée !")'), '💾 Game saved!');
});
