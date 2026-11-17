# Journal des versions

Les changements notables de The Legend of Nashi. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; la version unique est `CANAAN_VERSION` dans `src/canaan/scripts/runtime-config.js`. Le détail du contenu est dans [docs/GAMEPLAY.md](docs/GAMEPLAY.md).

## [0.9.8] — en préparation

Première version officielle avant la sortie sur Steam : la numérotation repart de 0.9.8 (les versions 1.9.x étaient des versions de développement). Les sauvegardes des versions 1.9.x restent lisibles : seul le format des sauvegardes compte, et il ne change pas. Prochaine étape : tests en jeu, puis 0.10.0, première version publique.

### Ajouté
- **Nouvelle classe : l’Invocateur** ☠️ (nécromancie et poison). Il reçoit son arme liée, le **Grimoire**, de qualité **Relique** (vert acide, case qui brille) : il prend toujours le niveau du héros, change de nom tous les 10 niveaux et ne peut être ni retiré, ni remplacé, ni vendu. Ses quatre compétences sont des invocations : Squelette putride, Nuée de rats, Totem de peste et Abomination. Passif **Peste noire** (charges de poison cumulables), sort **Contagion** (F) et dix talents (Virulence, Nécrose, Os éternels, Légion, Cadavres explosifs, Siphon pestilentiel, Carapace d’os, Pandémie, Pacte de sang, Moisson d’âmes). Les invocations sont visibles par les invités en coopératif.
- Choix de la classe **en pages** : une classe par page, flèches ‹ › (ou ← →) et une icône par classe pour y aller directement, à la place de la grille qui défilait.
- Steam : les 100 succès du jeu sont reportés sur le compte Steam (anciens succès compris, invités en coopératif aussi), superposition Steam (Maj+Tab), sauvegardes prêtes pour Steam Cloud (Auto-Cloud). Sans Steam, rien ne change. Liste des succès et icônes 256 × 256 à déclarer produites par `tools/steam_achievements.cjs` ; guide de mise en place dans `docs/STEAM.md`.
- Manette (Xbox, PlayStation, Steam Deck, Switch Pro…) : tout le jeu se joue sans clavier ni souris. Déplacement au stick gauche, visée au stick droit ou automatique, attaques aux gâchettes, compétences sur X, Y, LB, RB ; menus parcourus à la croix (A valider, B retour) ; boutons de la manette affichés à la place des touches ; vibrations (réglables dans les Paramètres, avec le rappel des commandes).
- Jeu installable, sans navigateur : installateur `.exe` et `.zip` pour Windows, AppImage et `.tar.gz` pour Linux (`npm run dist:win`, `npm run dist:linux`, electron-builder). Les archives contiennent le dossier du jeu, prêt pour Steam. Icône provisoire en pixel art.
- La release GitHub construit le jeu pour Windows et Linux, lance chaque version installée pour de vrai (menu, nouvelle aventure, sauvegarde sur disque, relais du coopératif ; `tools/smoke_package.cjs`) puis la publie.

### Corrigé
- Application de bureau sous Windows : une écriture dans le journal sans console disponible (EBADF) pouvait arrêter le jeu au démarrage ; le journal ne peut plus lever d’erreur.
- Trois lectures des anciens noms globaux (`monsters`, `projectiles`, `inventory`) avaient échappé au garde-fou : une expression régulière ignorait `...monsters`. Le garde-fou analyse maintenant les portées de tous les scripts du manifeste, sous-dossiers compris.
- La récompense de la quête 10 (tableau « L’oiseau d’ombre ») était écrasée par le « Grand tableau », qui portait la même clé ; celui-ci devient `grand_tableau`.

### Refactorisation
- Métiers : constantes, catalogues et règles pures (XP, qualités, repas, tirages, sauvegardes) dans `shared/data/professions.js` et `shared/rules/professions.js` ; résultats identiques à l’ancienne version sur 500 sauvegardes aléatoires et toutes les recettes.
- Quêtes : données et règles des énigmes dans `shared/data/puzzles.js` et `shared/rules/puzzles.js` (1 585 comparaisons exhaustives identiques à l’ancienne version).
- Économie : butin garanti d’une instance, tirage de prestige et bourse des boss mondiaux dans `shared/rules/economy.js` (mêmes tirages dans le même ordre, vérifié sur 5 400 tirages à graine fixe).
- Maison : catalogue et règles des meubles dans `shared/` ; `scripts/house/` sépare l’état (`house.js`), le dessin (`render.js`) et le coopératif (`net.js`).
- Donjons : structure et créatures de chaque instance dans `shared/data/dungeons.js` ; `scripts/dungeons/` sépare les plans, énigmes et boss (`dungeons.js`) du dessin (`render.js`).
- Pixel art : un kit commun (`client/art/pixel-kit.js` : toile, contour, ombre et reflet, couleurs, bruit et trame, écailles et branches) remplace les copies propres à chaque art (bâtiments, nains, elfes, portails, héros, créatures) ; les icônes SVG partagent une même plume (`client/icons/svg-pen.js`). Chaque outil n’existe plus qu’une fois.
- Rien ne change à l’écran : chaque étape a été comparée appel de dessin par appel de dessin avec la version précédente.

### Outillage
- Assemblage en Node (`tools/build.cjs`, esbuild par son API) à la place du script Python, HTML identique octet pour octet ; `npm run check` et l’icône aussi en Node : Python n’est plus nécessaire, ni en local ni en CI.
- Les anciens noms globaux (`CANAAN_LEGACY_NAMES` : `monsters`, `inventory`, `instanceState`…) sont retirés du jeu ; seuls les tests gardent ces raccourcis.
- Le HTML autonome n’est plus versionné : il est assemblé par `npm run build` et joint à chaque release GitHub.
- Version unique : le template reçoit `{{VERSION}}` à l’assemblage ; `package.json` est vérifié par les tests.
- ESLint (`npm run lint`), Prettier (`npm run format`, `npm run format:check`) et `npm test`.
- Intégration continue GitHub Actions (lint, assemblage, régressions) et publication automatique sur tag `vX.Y.Z`.
- Le README est raccourci ; la documentation détaillée est dans `docs/GAMEPLAY.md` et `docs/ARCHITECTURE.md`.
- Migration en modules ES commencée : icônes, pixel art des bâtiments et préférences de l’appareil convertis dans `src/canaan/client/`, nom officiel des objets (`applyItemName`) devenu une règle partagée, compositeur de la musique dans `client/audio/music.js` (partitions identiques sur 96 pièces) ; un test vérifie qu’aucun script ne lit un nom que personne ne définit (imports explicites, aucune variable globale implicite) ; outils `tools/module_graph.cjs` (graphe des dépendances entre scripts) et `tools/convert_leaf.cjs` (conversion d’une feuille).
- `shared/` vérifié par TypeScript en mode strict (`npm run typecheck`, en CI) : `// @ts-check` et JSDoc sur tous les fichiers, types communs dans `shared/types.js`.
- Tests rangés par système (`tests/*.test.cjs`) et lancés en parallèle ; démarrage du jeu dans les tests 10× plus rapide (contexte `vm` sans intercepteurs). La suite complète passe de 12 min à une vingtaine de secondes.
- Deux tests instables stabilisés : attentes de connexion au relais (10 s au lieu de 0,5 s) et doublon de Rubis tiré au hasard.
- Tests de comportement à la place des recherches de texte dans le code : vrais clics (`click`) et vraies touches (`fire`) dans le jeu simulé, vitesse mesurée, dessin du marchand, HUD, validation du démarrage ; chacun vérifié en cassant le comportement.

## [1.9.7] - 2026-11-16

### Ajouté
- Bulles d’aide et fenêtres de confirmation propres au jeu (`ui-overlay.js`) à la place de celles du navigateur ; la vente d’un objet Légendaire ou mieux passe par cette confirmation.
- Onglets des métiers : repères courts toujours visibles et détail repliable, état du poste (forge, cuisinière…) en une ligne.

### Modifié
- Le bestiaire ne compte que les espèces qui apparaissent vraiment.
- Les Rubis rangés à la banque restent découverts, sans s’équiper depuis la banque.

## [1.9.6] - 2026-11-16

### Ajouté
- **Sylvaëlle, la Cité des Elfes** (niveau 60) : palissade, porte gardée, fontaine-arbre, bâtiments elfiques (`elven-city.js`, `elven-art.js`).
- Tous les bâtiments de l’île et de la forteresse naine s’ouvrent : grange, poulailler, Demeure de la Reine Elwë, armurerie, atelier de la tisseuse, Grand Hall de Durgrim… (`dwarf-art.js`), avec de nouveaux meubles pour la maison.
- Barre des effets : bonus, malus et passifs (`buff-bar.js`).
- Écran de chargement dès la première image (`boot-loader.css`).

## [1.9.3] - 2026-11-16

### Ajouté
- **Garde-robe** (touche V) : tenues complètes purement visuelles, trouvées sur les monstres, boss et coffres (`wardrobe.js`, `shared/data/skins.js`).
- Donjons en exploration : portes scellées par des énigmes, herses, passages secrets et boss cachés, coffres secrets à clé.
- Pixel art « cosy » des bâtiments et des portails d’instance (`building-art.js`, `portal-art.js`).
- Routes calculées pixel par pixel et transitions de terrain organiques (`world-roads.js`, `world-blend.js`), eau continue, crabes et tortues sur les plages.

### Modifié
- Arbres deux fois plus grands, forêts éclaircies, gestion devant / derrière des objets hauts ; caméra au pixel près.
- Centre du camp réorganisé (fontaine au centre, forge déplacée).

## [1.9.1] - 2026-11-14

### Ajouté
- **Les Tréfonds de Canaan** : monde souterrain à quatre biomes, forteresse de Durgrim, quatre donjons (`underground.js`).
- Métiers : minage, cueillette et enchanteur (`gathering.js`).
- **Succès et collections** (touche Y) : cent succès, titres, bestiaire (`achievements.js`).
- Sac unifié, banque et boutique (`bag.js`, `bank.js`, `shop.js`).
- Armes dessinées en main, icônes illustrées des objets et des compétences (`weapon-look.js`, `icon-art.js`, `icons.js`, `skill-icons.js`).
- Empreintes de classe sur les compétences d’armes ; coopératif par Tailscale ou réseau local.

### Modifié
- Six qualités d’objet (Héroïque et Céleste retirées) ; Légendaire et Mythique réservés au Raid 4 Héroïque et à l’Arène.

## [1.9.0] - 2026-11-13

- Première version publiée dans ce dépôt.

[Non publié]: https://github.com/harunashi75/the-legend-of-nashi/compare/fc5f38a...HEAD
[1.9.7]: https://github.com/harunashi75/the-legend-of-nashi/compare/5b7a66f...fc5f38a
[1.9.6]: https://github.com/harunashi75/the-legend-of-nashi/compare/e53bfa0...5b7a66f
[1.9.3]: https://github.com/harunashi75/the-legend-of-nashi/compare/0eb47bd...e53bfa0
[1.9.1]: https://github.com/harunashi75/the-legend-of-nashi/compare/40bf474...0eb47bd
[1.9.0]: https://github.com/harunashi75/the-legend-of-nashi/commit/40bf474
