# Extensions

Contenu préparé à l'avance et livré plus tard. Extension 1 : **la Vallée des Héros** (zone de niveau 60).

## Deux builds

| Commande | Contenu | Usage |
| --- | --- | --- |
| `npm run build`, `npm run dist:linux`, `npm run dist:win`, CI, release GitHub | **sans** les extensions | sortie (Steam) |
| `npm start`, `npm run build:dev` (`node tools/build.cjs --extensions`) | **avec** les extensions | tests |

Une entrée du manifeste marquée `"extension": "vallee"` n'est assemblée qu'avec `--extensions`. Sans ce drapeau, le build par défaut la retire du HTML, sans en garder la moindre trace. Un test vérifie qu'aucun nom de l'extension n'apparaît dans le build de sortie. Les commentaires du code de base parlent donc seulement de « la terre du sud-ouest (Extension 1) ».

## Terre fermée

La terre de la vallée (coin sud-ouest, reliée à la Forêt enchantée par un isthme) est générée par l'île dans **tous** les builds : mêmes cases, mêmes sauvegardes. Sans l'extension :

- `canWalk` la refuse (`CANAAN_EXT.blocked`) ; un héros sauvegardé dedans se relève au camp ;
- un banc de brume la couvre dans le monde (`CANAAN_LOCKED_FOG`), un grand nuage blanc sur la carte M et la mini-carte (`paintClouds`, world-map.js) ;
- elle s'appelle « Brumes impénétrables » et n'est pas listée dans le panneau de la carte.

Les données d'une extension dans une sauvegarde (`hero.ext[id]`, et ses montures dans `hero.ext.mounts`) sont gardées telles quelles par un build qui ne la connaît pas. En coopératif, l'hôte refuse un invité qui n'a pas les mêmes extensions.

## Fichiers

- `scripts/extensions.js` (jeu de base) : registre, crochets (`CANAAN_EXT`), terres fermées, brume.
- `extensions/vallee/data.js` : zone, créatures, Valérion, montures et leur marchand (déclarés avant la génération de l'île).
- `extensions/vallee/i18n.js` : traductions anglaises de l'extension (hors de `client/i18n/en.js`).
- `extensions/vallee/art.js` : pixel art (montures de la vallée, statues, écurie, moulin, clôtures, ponts, dalles), avec le kit commun.
- `extensions/vallee/valerion.js` : Valérion, le Dernier Champion (trois phases, PV selon les participants, butin).
- `extensions/vallee/vallee.js` : lieux, habitants, interactions, carte ; enregistre l'extension.

## Montures de la vallée

Le système de montures est dans le jeu de base (`scripts/mounts.js`, voir `docs/GAMEPLAY.md`) ; l'extension y ajoute les siennes (`mounts`), son marchand (`mountShops`, comptoir déclaré par `CANAAN_MOUNTS.setShopNear`) et ses espèces (`CANAAN_MOUNT_ART.tools.define`). À l'Écurie des Héros, Garance vend onze montures (vitesse selon la selle, comme toutes les montures) : quatre chevaux, bélier, coq, lion, aigle, licorne, griffon, pégase. Deux se gagnent : le Destrier des Échos (Échos de héros et de champion, 0,4 %) et le Dragon de l'Aurore (Valérion, 4 % pour chaque participant).

## Sortir l'extension

Retirer `"extension": "vallee"` des entrées du manifeste (ou, plus tard, en faire un DLC Steam vérifié par `app/steam.js`), puis adapter le test « Build de sortie » de `tests/extensions.test.cjs`.
