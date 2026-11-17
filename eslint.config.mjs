// Configuration ESLint (format « flat »). Lancer : npm run lint
// Les règles visent les vrais défauts (variables en double, code mort, comparaisons douteuses…),
// pas le style : la mise en forme relève de Prettier (npm run format).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'release/', 'out/', 'CANAAN_ONLINE_V*.html']
  },
  js.configs.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // Code mort (variable ou fonction jamais lue) : signalé sans bloquer, à nettoyer au fil des refactorisations.
      // Un paramètre ou une erreur ignorés volontairement (catch, rappel) ne sont pas des défauts.
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Les « let x = null; try { x = … } catch { x = null; } » sont des initialisations défensives voulues.
      'no-useless-assignment': 'off'
    }
  },
  // Anciens scripts du jeu : scripts classiques qui partagent un seul espace global, dans l'ordre du manifeste.
  // Leurs noms se croisent d'un fichier à l'autre ; ESLint ne voit qu'un fichier à la fois, donc les noms
  // globaux inconnus (no-undef) et les déclarations globales jamais lues ici (no-unused-vars) ne sont pas vérifiés.
  {
    // group-bot.js pilote des héros dans le contexte du jeu chargé par les tests : mêmes noms globaux.
    files: ['src/canaan/scripts/**/*.js', 'src/canaan/client/preferences.js', 'tests/helpers/group-bot.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-redeclare': 'off'
    }
  },
  // Modules client convertis (src/canaan/client/) : modules ES du navigateur. Tout nom extérieur doit être importé :
  // no-undef reste actif, seuls les noms du navigateur sont connus (aucune variable globale des anciens scripts).
  {
    files: ['src/canaan/client/**/*.js'],
    ignores: ['src/canaan/client/preferences.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } }
  },
  // Modules ES : shared/ (règles et données pures, sans écran ni stockage) et le pont bridge.js.
  {
    files: ['src/canaan/shared/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: {} },
    rules: {
      // cleanPseudo, cleanChat, cleanAdventureName retirent volontairement les caractères de contrôle.
      'no-control-regex': 'off'
    }
  },
  {
    files: ['src/canaan/bridge.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { globalThis: 'readonly' } }
  },
  // Node.js (CommonJS) : application de bureau, relais, outils et tests.
  {
    files: ['app/**/*.js', 'relay/**/*.cjs', 'tools/**/*.cjs', 'tests/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    }
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } }
  }
];
