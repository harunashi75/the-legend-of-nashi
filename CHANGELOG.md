# Journal des versions

Les changements notables de The Legend of Nashi. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; la version unique est `CANAAN_VERSION` dans `src/canaan/scripts/runtime-config.js`. Le détail du contenu est dans [docs/GAMEPLAY.md](docs/GAMEPLAY.md).

## [Non publié]

### Corrigé
- La récompense de la quête 10 (tableau « L’oiseau d’ombre ») était écrasée par le « Grand tableau », qui portait la même clé ; celui-ci devient `grand_tableau`.

### Outillage
- Le HTML autonome n’est plus versionné : il est assemblé par `npm run build` et joint à chaque release GitHub.
- Version unique : le template reçoit `{{VERSION}}` à l’assemblage ; `package.json` est vérifié par les tests.
- ESLint (`npm run lint`), Prettier (`npm run format`, `npm run format:check`) et `npm test`.
- Intégration continue GitHub Actions (lint, assemblage, régressions) et publication automatique sur tag `vX.Y.Z`.
- Le README est raccourci ; la documentation détaillée est dans `docs/GAMEPLAY.md` et `docs/ARCHITECTURE.md`.
- Tests rangés par système (`tests/*.test.cjs`) et lancés en parallèle ; démarrage du jeu dans les tests 10× plus rapide (contexte `vm` sans intercepteurs). La suite complète passe de 12 min à une vingtaine de secondes.

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
