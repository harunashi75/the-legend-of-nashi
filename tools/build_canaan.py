#!/usr/bin/env python3
"""Assemble les sources ordonnées en un HTML autonome, sans dépendance externe."""
import argparse
import json
from pathlib import Path
import re
import os
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src' / 'canaan'


def read_version():
    """Version unique de l'application, déclarée dans runtime-config.js."""
    config = (SOURCE / 'scripts' / 'runtime-config.js').read_text(encoding='utf-8')
    match = re.search(r"CANAAN_VERSION\s*=\s*'(\d+(?:\.\d+)*[a-z]?)'", config)
    if not match:
        raise ValueError('Version introuvable dans scripts/runtime-config.js')
    return match.group(1)


VERSION = read_version()
# Nom du HTML généré, déduit de la version.
OUTPUT = ROOT / ('CANAAN_ONLINE_V' + VERSION.replace('.', '_') + '.html')
# Sous Windows, npm installe le lanceur sous le nom esbuild.cmd (le fichier esbuild est un script shell).
ESBUILD = ROOT / 'node_modules' / '.bin' / ('esbuild.cmd' if os.name == 'nt' else 'esbuild')


def bundle(entry):
    """Regroupe un point d'entrée de modules ES (import/export) en un script classique, avec esbuild."""
    if not ESBUILD.exists():
        raise ValueError('esbuild introuvable : exécuter npm install')
    result = subprocess.run(
        [str(ESBUILD), str(entry), '--bundle', '--format=iife', '--charset=utf8',
         '--target=es2022', '--log-level=warning', '--legal-comments=none'],
        cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=False)
    if result.returncode:
        raise ValueError('Échec du regroupement des modules :\n' + result.stderr)
    return result.stdout


def render():
    # {{VERSION}} : la version du template vient de runtime-config.js, jamais écrite en dur.
    html = (SOURCE / 'template.html').read_text(encoding='utf-8').replace('{{VERSION}}', VERSION)
    modules = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))['modules']
    markers = re.findall(r'<!-- canaan:(script|style|module):(canaan-[a-z0-9-]+) -->', html)
    if markers != [(module['kind'], module['id']) for module in modules]:
        raise ValueError('L’ordre des modules doit être identique dans template.html et manifest.json')
    identifiers = set()
    for module in modules:
        kind, name = module['kind'], module['id']
        if kind not in ('script', 'style', 'module') or not re.fullmatch(r'canaan-[a-z0-9-]+', name):
            raise ValueError(f'Module invalide : {name}')
        if name in identifiers:
            raise ValueError(f'Identifiant dupliqué : {name}')
        identifiers.add(name)
        marker = f'<!-- canaan:{kind}:{name} -->'
        if html.count(marker) != 1:
            raise ValueError(f'Marqueur absent ou dupliqué : {name}')
        source_path = (SOURCE / module['file']).resolve()
        if not source_path.is_relative_to(SOURCE.resolve()):
            raise ValueError(f'Source hors du dossier : {name}')
        # Un module ES est regroupé avec ses imports ; il s'insère comme un script classique.
        code = (bundle(source_path) if kind == 'module' else source_path.read_text(encoding='utf-8')).rstrip()
        tag = 'script' if kind == 'module' else kind
        if f'</{tag}' in code.lower():
            raise ValueError(f'Balise de fermeture dans la source : {name}')
        html = html.replace(marker, f'<{tag} id="{name}">\n{code}\n</{tag}>')
    if '<!-- canaan:' in html:
        raise ValueError('Le template contient un module absent du manifeste')
    return html


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='vérifier que le HTML est à jour sans le modifier')
    args = parser.parse_args()
    html = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != html:
            parser.exit(1, 'HTML différent des sources. Exécuter python3 tools/build_canaan.py\n')
        print('HTML autonome à jour.')
    else:
        # Fins de ligne \n sur tous les systèmes (write_text les changerait en \r\n sous Windows).
        OUTPUT.write_bytes(html.encode('utf-8'))
        print(f'HTML autonome généré : {OUTPUT.name} ({len(html.encode("utf-8"))} octets)')


if __name__ == '__main__':
    main()
