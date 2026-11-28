#!/usr/bin/env node
// Vérifie tout sans rien modifier (npm run check) : ESLint, types de shared/ et de client/, HTML à jour par rapport aux sources,
// puis les régressions. S'arrête à la première étape en échec, avec son code de sortie.
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const steps = [
  ['node_modules/eslint/bin/eslint.js', '.'],
  ['node_modules/typescript/bin/tsc', '-p', 'src/canaan/shared/jsconfig.json'],
  ['node_modules/typescript/bin/tsc', '-p', 'src/canaan/client/jsconfig.json'],
  ['tools/build.cjs', '--check'],
  ['--test', '--test-timeout=120000', 'tests/*.test.cjs']
];
for (const args of steps) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
