# The Legend of Nashi

RPG d’action en pixel art, en vue de dessus : une île à six biomes, un monde souterrain, des donjons et des raids, sept classes, des métiers et un mode coopératif en ligne. Le jeu tient en un seul fichier HTML autonome, jouable dans le navigateur ou dans l’application de bureau (Electron).

- **Contenu du jeu** : [docs/GAMEPLAY.md](docs/GAMEPLAY.md)
- **Architecture et code** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Sauvegardes** : [docs/SAVES.md](docs/SAVES.md) · **Démarrage** : [docs/INITIALIZATION.md](docs/INITIALIZATION.md)
- **Steam** (succès, Steam Cloud, dépôts) : [docs/STEAM.md](docs/STEAM.md)
- **Journal des versions** : [CHANGELOG.md](CHANGELOG.md)

## Jouer

Chaque [release GitHub](https://github.com/harunashi75/the-legend-of-nashi/releases) contient le jeu à installer (Windows : `.exe` ; Linux : `.AppImage`) et le HTML prêt à jouer (`CANAAN_ONLINE_V<version>.html`), qui s’ouvre directement dans le navigateur, sans serveur ni installation.

## Développer

Prérequis : Node.js seulement (assemblage avec esbuild, tests avec `node:test`).

```sh
npm install        # une seule fois : esbuild, Electron, electron-builder, ESLint, Prettier (versions épinglées)
npm run build      # assemble src/canaan/ en CANAAN_ONLINE_V<version>.html
npm start          # assemble puis ouvre l’application de bureau
npm run relay      # relais du coopératif (port 8787)
```

Les sources sont dans `src/canaan/` : scripts par système dans `scripts/`, règles et données pures (modules ES) dans `shared/`, CSS dans `styles/`, structure dans `template.html`. `manifest.json` liste les modules dans leur ordre d’exécution, identique à celui du template. Le HTML généré n’est pas versionné : ne jamais le modifier à la main, le prochain assemblage le remplacerait.

### Vérifier

```sh
npm run lint           # ESLint
npm run typecheck      # types de shared/ (TypeScript sur le JavaScript annoté en JSDoc, mode strict)
npm run format:check   # mise en forme Prettier (npm run format pour corriger)
npm test               # régressions, en parallèle, sur le HTML assemblé (une vingtaine de secondes)
npm run check          # tout : ESLint, types de shared/, HTML à jour par rapport aux sources, régressions
```

Les tests sont rangés par système dans `tests/*.test.cjs` (combat, classes, sauvegardes, butin, réseau, maison, quêtes…) et `node --test` lance les fichiers en parallèle. Un seul fichier : `node --test tests/combat.test.cjs` ; un seul test : `node --test --test-name-pattern="Roulade" "tests/*.test.cjs"`. Le contexte commun (HTML assemblé, extraits de scripts, doubles de test) est dans `tests/helpers/context.cjs`, le démarrage complet du jeu dans `tests/helpers/canaan-runtime.cjs`. La variable `CANAAN_HTML` fait tester un autre HTML que celui de la version courante.

Un test vérifie ce que fait le jeu, pas la forme de son code : `run(code)` exécute dans la partie, `fire(cible, 'keydown', { key: 'y' })` envoie un événement comme le navigateur, `click('newSlot', { slot: '2' })` clique un bouton `data-action`. Chercher du texte dans le HTML assemblé (`source`, `script(id)`) est réservé aux garde-fous d’architecture : pas d’`onclick` ni de `!important`, une seule définition par fonction, `shared/` sans navigateur, anciens systèmes absents, un seul thème (pas de `#window#window`, pas de couleur de l’ancien thème violet) et une seule police pour le texte du canevas. Pour s’assurer qu’un test protège vraiment, casser le comportement dans une copie du HTML et lancer le test avec `CANAAN_HTML=copie.html` : il doit échouer.

Les tests utilisent un DOM et un Canvas simulés : sauvegardes, combat, équipement, talents, modules obligatoires, commandes tactiles, et un groupe de quatre héros joué sans écran dans un donjon et un raid. Le rendu visuel doit aussi être contrôlé dans le navigateur.

L’intégration continue (GitHub Actions) lance ESLint, l’assemblage et les régressions à chaque push sur `main` et à chaque pull request.

### Distribuer le jeu (installable)

```sh
npm run dist:linux     # dist/ : AppImage (un fichier à lancer) et dossier du jeu en .tar.gz
npm run dist:win       # dist/ : installateur .exe et dossier du jeu en .zip (sous Linux, demande Wine)
node tools/smoke_package.cjs dist/linux-unpacked/legend-of-nashi   # lance le jeu installé et le vérifie
```

Le jeu installé embarque son propre Electron : le joueur n’a besoin d’aucun navigateur. Il ne contient que l’application (`app/`), le HTML assemblé, le jeu en ligne (`online/` : relais et transports du coopératif) et les règles partagées (configuration : `electron-builder.yml` ; un test vérifie que tout ce que l’application charge y est). Les sauvegardes restent dans le dossier de données du joueur, partagé avec `npm start`, et ne sont pas effacées à la désinstallation. Le dossier du jeu (`.zip`, `.tar.gz`, ou `dist/*-unpacked/`) est ce qu’on envoie à Steam, qui installe et met à jour lui-même. L’icône provisoire `build/icon.png` est produite par `node tools/make_icon.cjs` ; la remplacer par un PNG carré de 512 × 512 au moins. Sans certificat de signature, Windows affiche « Éditeur inconnu » à l’installation hors Steam.

### Publier une version

1. Changer `CANAAN_VERSION` dans `src/canaan/scripts/runtime-config.js` et `npm version <x.y.z> --no-git-tag-version` (les tests vérifient que les deux concordent).
2. Déplacer les notes de « Non publié » vers la nouvelle version dans `CHANGELOG.md`.
3. Commiter, puis `git tag v<x.y.z> && git push origin v<x.y.z>` : la release GitHub est créée avec le HTML assemblé, le jeu installable pour Windows et Linux (chacun lancé et vérifié avant d’être publié) et les notes du journal.
