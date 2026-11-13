#!/usr/bin/env node
// Lance l'application de bureau. Certains terminaux (celui de VS Code, par exemple) définissent
// ELECTRON_RUN_AS_NODE, qui ferait démarrer Electron comme un simple Node : on le retire ici.
'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
const electron = require('electron');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, [path.resolve(__dirname, '..'), ...process.argv.slice(2)], { stdio: 'inherit', env });
child.on('exit', code => process.exit(code ?? 0));
