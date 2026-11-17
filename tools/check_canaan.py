#!/usr/bin/env python3
"""Vérifie le code (ESLint, types de shared/), le HTML généré, puis lance les régressions, sans modifier les fichiers."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
for command in (['node', 'node_modules/eslint/bin/eslint.js', '.'],
                ['node', 'node_modules/typescript/bin/tsc', '-p', 'src/canaan/shared/jsconfig.json'],
                [sys.executable, 'tools/build_canaan.py', '--check'],
                ['node', '--test', '--test-timeout=120000', 'tests/*.test.cjs']):
    try:
        result = subprocess.run(command, cwd=root, check=False)
    except FileNotFoundError as error:
        print(f'Outil requis absent : {error.filename}', file=sys.stderr)
        sys.exit(1)
    if result.returncode:
        sys.exit(result.returncode)
