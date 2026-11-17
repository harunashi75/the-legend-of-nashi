# The Legend of Nashi

RPG d’action en pixel art, en vue de dessus : une île à six biomes, un monde souterrain, des donjons et des raids, quatre classes, des métiers et un mode coopératif en ligne. Le jeu tient en un seul fichier HTML autonome, jouable dans le navigateur ou dans l’application de bureau (Electron).

- **Contenu du jeu** : [docs/GAMEPLAY.md](docs/GAMEPLAY.md)
- **Architecture et code** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Sauvegardes** : [docs/SAVES.md](docs/SAVES.md) · **Démarrage** : [docs/INITIALIZATION.md](docs/INITIALIZATION.md)
- **Journal des versions** : [CHANGELOG.md](CHANGELOG.md)

## Jouer

Le HTML prêt à jouer (`CANAAN_ONLINE_V<version>.html`) est joint à chaque [release GitHub](https://github.com/harunashi75/the-legend-of-nashi/releases) : il s’ouvre directement dans le navigateur, sans serveur ni installation.

## Développer

Prérequis : Node.js (les tests utilisent `node:test`) et Python 3.9 ou plus récent (assemblage).

```sh
npm install        # une seule fois : esbuild, Electron, ESLint, Prettier (versions épinglées)
npm run build      # assemble src/canaan/ en CANAAN_ONLINE_V<version>.html
npm start          # assemble puis ouvre l’application de bureau
npm run relay      # relais du coopératif (port 8787)
```

Les sources sont dans `src/canaan/` : scripts par système dans `scripts/`, règles et données pures (modules ES) dans `shared/`, CSS dans `styles/`, structure dans `template.html`. `manifest.json` liste les modules dans leur ordre d’exécution, identique à celui du template. Le HTML généré n’est pas versionné : ne jamais le modifier à la main, le prochain assemblage le remplacerait.

### Vérifier

```sh
npm run lint           # ESLint
npm run format:check   # mise en forme Prettier (npm run format pour corriger)
npm test               # régressions, en parallèle, sur le HTML assemblé (une vingtaine de secondes)
npm run check          # tout : ESLint, HTML à jour par rapport aux sources, régressions
```

Les tests sont rangés par système dans `tests/*.test.cjs` (combat, classes, sauvegardes, butin, réseau, maison, quêtes…) et `node --test` lance les fichiers en parallèle. Un seul fichier : `node --test tests/combat.test.cjs` ; un seul test : `node --test --test-name-pattern="Roulade" "tests/*.test.cjs"`. Le contexte commun (HTML assemblé, extraits de scripts, doubles de test) est dans `tests/helpers/context.cjs`, le démarrage complet du jeu dans `tests/helpers/canaan-runtime.cjs`. La variable `CANAAN_HTML` fait tester un autre HTML que celui de la version courante.

Les tests utilisent un DOM et un Canvas simulés : sauvegardes, combat, équipement, talents, modules obligatoires, commandes tactiles, et un groupe de quatre héros joué sans écran dans un donjon et un raid. Le rendu visuel doit aussi être contrôlé dans le navigateur.

L’intégration continue (GitHub Actions) lance ESLint, l’assemblage et les régressions à chaque push sur `main` et à chaque pull request.

### Publier une version

1. Changer `CANAAN_VERSION` dans `src/canaan/scripts/runtime-config.js` et `npm version <x.y.z> --no-git-tag-version` (les tests vérifient que les deux concordent).
2. Déplacer les notes de « Non publié » vers la nouvelle version dans `CHANGELOG.md`.
3. Commiter, puis `git tag v<x.y.z> && git push origin v<x.y.z>` : la release GitHub est créée avec le HTML assemblé et les notes du journal.
