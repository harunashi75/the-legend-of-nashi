# Contrat d’initialisation de CANAAN

Les sources de référence sont dans `src/canaan/`. Après modification, `npm run build` génère le HTML autonome ; `--check` vérifie sa synchronisation. L’ordre des modules est déclaré dans `template.html` et `manifest.json`, et l’assembleur refuse toute divergence.

Les scripts classiques du HTML généré s’exécutent dans l’ordre du document. Les fonctions partagées ne deviennent pas toutes disponibles en même temps.

## Phases

1. Chaque fonction partagée est définie une seule fois, dans son module propriétaire : `function nom()` au niveau global, ou dans un module encapsulé suivi de l’export `Object.assign(window, { … })`. Le cœur ne réserve aucun emplacement ; avant le chargement de son propriétaire, le nom n’existe simplement pas.
2. Un module peut définir des fonctions qui appelleront d’autres modules plus tard ; il ne doit pas lancer ces opérations pendant son chargement.
3. Le script `canaan-bootstrap` appelle `CANAAN_BOOTSTRAP.validate()`. La vérification contrôle les exports des modules (`CANAAN_REQUIRED_MODULES`), les catalogues et les liaisons restantes (`CANAAN_REQUIRED_BINDINGS`), et leurs types.
4. Après validation, le bootstrap charge ou initialise la sauvegarde, crée les monstres et recalcule les statistiques. Il passe ensuite `CANAAN_READY` à `true` et lance la boucle. `startGame()` exige cet état.

En cas d’échec, le démarrage est bloqué et l’écran d’accueil affiche les dépendances manquantes. La validation précède toute lecture ou écriture de sauvegarde par le bootstrap.

## Propriétaires des fonctions partagées

| Module (identifiant du script) | Fonctions définies |
| --- | --- |
| `canaan-weapon-actions` | `useSkill` |
| `canaan-world-map` | `drawBigMap` |
| `canaan-modules` (`shared/rules/items.js`) | `applyItemName` |
| `canaan-stats` | `characterStats`, `gearStat`, `gearScore`, `gearComparison` |
| `canaan-progression` | `CANAAN_PROGRESSION`, `canaanKillXp`, `canaanGrantXp` |
| `canaan-equipment` | `equipItem`, `unequip`, `equipReserveWeapon`, `switchWeapon` |
| `canaan-economy` | `dropTierGear` |
| `canaan-combat` | `hit`, `monsterDamage`, `canaanHurtPlayer`, `canaanDodge` |
| `canaan-artefacts` | `CANAAN_ARTEFACTS`, `CANAAN_ARTEFACTS_STATE`, `equipArtefact`, `unequipArtefact`, `toggleArtefact`, `showArtefactTooltip`, `drawArtefact` |
| `canaan-arena` | `CANAAN_ARENA`, `CANAAN_ARENA_STATE`, `enterArena`, `openArenaPortal` |
| `canaan-portals` | `openPortal` |
| `canaan-map-panel` | `toggleMap` |
| `canaan-sprite-kit` | `canaanOutline`, `canaanPolish`, `canaanActorSprite`, `drawCanaanActor`, `canaanLight`, `resetCanaanLights`, `drawCanaanLighting`, `drawCanaanBossFrame` |
| `canaan-dungeons` | `makeDungeon`, `spawnInstanceBoss`, `onInstanceBossDown`, `dungeonChestSpot`, `drawDungeonTile`, `drawDungeonGround`, `drawDungeonDecor`, `dungeonAmbience`, `dungeonMinimapColor`, `arenaLayout` |
| `canaan-world-look` | `drawWorldTile`, `worldAmbience` |
| `canaan-item-rules` | `rarityRoll` |
| `canaan-gear-engine` | `giveGear` |
| `canaan-inventory-capacity` | `updateCapacity` |
| `canaan-ui` | `renderInventory`, `renderCharacter`, `charSlot`, `showGearTooltip`, `showEquippedTooltip` |
| `canaan-class-talents` | `renderTalents` |
| `canaan-quest-field` | `canaanQuestField` |
| `canaan-quests` | `toggleJournal` |

Ces fonctions ne figurent plus dans `CANAAN_REQUIRED_BINDINGS` : leur module est contrôlé par ses exports dans `CANAAN_REQUIRED_MODULES` (par exemple `CANAAN_UI`, `CANAAN_EQUIPMENT`, `CANAAN_COMBAT`) et par les tests, qui vérifient une seule définition par fonction. Un module chargé avant le propriétaire ne doit pas lire ces noms pendant son chargement ; s’il doit en exposer un dans un objet d’export, il le lit sur `window` pour que le bootstrap signale l’absence au lieu d’un plantage (voir `CANAAN_UI.gearStat`).

## Pipeline de simulation et de rendu

La boucle de jeu appelle `runUpdatePipeline()` à chaque tick, puis `runDrawPipeline()` à chaque image. Les deux sont définies dans `canaan-pipeline`.

Chaque étape de mise à jour est un objet de `CanaanStages` qui peut définir `before()` et `after(state)`. La valeur renvoyée par `before()` est transmise à `after()`. `CANAAN_PIPELINE.update` liste les étapes de l'intérieur vers l'extérieur :

| Étape | Module | Rôle |
| --- | --- | --- |
| `weaponEffects` | `canaan-weapon-state` | Immobilisations, saignements, zones et recharges des sorts d'armes |
| `mobScaling` | `canaan-monster-scaling` | PV des monstres ordinaires selon leur niveau |
| `bossScaling` | `canaan-monster-scaling` | PV des boss |
| `weaponVfx` | `canaan-weapon-actions` | Sols consacrés, minuteurs différés, durée des effets visuels |
| `facing` | `canaan-stats` | Orientation des monstres proches |
| `classes` | `canaan-class-talents` | Ralentissements, déclencheurs de PV, effets sur la durée et zones des talents de classe |
| `dodge` | `canaan-combat` | Déplacement de la roulade d'esquive |
| `artefacts` | `canaan-artefacts` | Bouclier, régénération, brûlures et saignements des artéfacts de l’Arène équipés |
| `arena` | `canaan-arena` | Vagues, intelligence des boss de l'Arène, annonces, projectiles et sols dangereux |
| `quests` | `canaan-quests` | Objectifs de terrain (vagues, escortes, fuyards, courses, champions), traces et points à atteindre, poisson doré, nénuphars qui coulent |

Les `before()` s'exécutent de la dernière étape à la première, puis `update()` du cœur, puis les `after()` de la première à la dernière. Aucune étape ne tourne hors partie, en pause ou pendant la mort du héros. Le rendu appelle `draw()` du cœur puis les étapes de `CANAAN_PIPELINE.draw` : effets des armes (`drawWeaponEffects`), zones, boucliers et forme féline des classes (`drawClassEffects`), Lumi, bénédiction et suivi de quête (`drawQuests`), recharge de la roulade (`drawDodge`) et interface de l'Arène (`drawArenaHud`).

Pour ajouter une étape, installer son objet dans le module propriétaire, l'inscrire à sa place dans `CANAAN_PIPELINE` et ajouter ses fonctions aux contrats du bootstrap. Une étape ne capture jamais une autre étape et ne réaffecte ni `update` ni `draw`.

## Portée des modules

Les scripts classiques partagent une seule portée globale. Un module encapsulé enveloppe son code dans `(() => { … })();` : ses déclarations restent privées, et ses noms publics sont exportés en une ligne, `Object.assign(window, { … })`, à la fin du module.

Sont encapsulés : `canaan-world-settlements`, `canaan-world-generation`, `canaan-sprite-kit`, `canaan-dungeons`, `canaan-world-look`, `canaan-artefacts`, `canaan-arena`, `canaan-map-panel`, `canaan-pixel-art`, `canaan-monster-scaling`, `canaan-merchants`, `canaan-controls` et `canaan-bootstrap`. Beaucoup d'autres modules exposent déjà leur interface via un objet `window.CANAAN_…` construit dans une fonction auto-exécutée.

Restent globaux par conception les états partagés que plusieurs modules réaffectent, comme `monsters`, `world`, `inventory`, `instanceState` ou `materials`, ainsi que les fonctions que les tests remplacent par des doublures. Un nom exporté ne doit jamais être réaffecté hors de son module : le module continuerait d'utiliser sa propre version. Pour encapsuler un nouveau module, vérifier d'abord qu'aucun de ses noms publics n'est réaffecté ailleurs.

## Ajouter ou déplacer un module

- Installer son implémentation avant le bootstrap et après les définitions qu’il utilise immédiatement.
- Reporter les opérations qui appellent d’autres systèmes après la validation, ou dans les actions du joueur.
- Déclarer les nouveaux points d’entrée avec leur propriétaire et les ajouter aux contrats du bootstrap.
- Ne pas redéfinir ni envelopper une fonction d’un autre module : modifier sa définition unique. Le test « Surcharges consolidées » le vérifie.
- Conserver les appels directs aux dépendances obligatoires. Un appel prématuré doit être corrigé en déplaçant l’opération, sans ajout de garde silencieuse.

Vérification : `npm test`. Les tests exercent les appels prématurés, la détection des entrées non installées et le chargement complet avec DOM/Canvas simulés.

Le module `canaan-controls` installe les actions déléguées des menus et les commandes tactiles avant le bootstrap. `clearTouchControls` et `CanaanStages.updateTouchControls` font partie des dépendances obligatoires. Les générateurs `worldRnd` et `visualRnd` sont également validés au démarrage.

Le module ES `client/preferences.js` (dans le bloc `canaan-modules`, exécuté en premier) précède `canaan-audio-layout`. Il porte seul les préférences de l’appareil, son et disposition des panneaux, via `CANAAN_PREFERENCES.read` et `CANAAN_PREFERENCES.write`. Une valeur illisible donne la valeur par défaut, et une écriture refusée renvoie `false` sans erreur. Seuls ce module et `canaan-persistence` accèdent au stockage local. Les boutons de l’interface utilisent `addEventListener` ; les cases de compétences portent `data-skill` et leur clic est délégué par `canaan-controls`.

Le module `canaan-game-state`, chargé juste après la configuration, crée l’objet `game` : le héros de l’hôte `game.hero` et le monde `game.world`. `canaan-game-core` y rattache `P` et crée l’océan initial (`game.world.tiles`), que `canaan-world-generation` remplace par l’île. Le module `canaan-persistence` définit le schéma courant, `CANAAN_SAVE_SCHEMA`, et le stockage des slots, `CANAAN_SAVE_STORE` (fichiers dans l’application de bureau, stockage local dans le build HTML). Après la validation, le bootstrap importe une éventuelle ancienne partie (schéma 9) dans le slot 1, puis charge l’aventure choisie dans le menu avant le rechargement et lance la partie ; sans aventure choisie, `canaan-slot-menu` affiche les huit slots. L’audio expose `CanaanStages.restartMusic` et `CanaanStages.stopMusic`. Les fonctions uniques `startGame`, `enterInstance` et `leaveInstance` appellent la première après une entrée ou une sortie réussie ; `pauseToTitle` appelle la seconde. Les systèmes précédemment empilés ont une définition directe ; `normalizeGearLabel`, devenu inutilisé, a été supprimé. Voir [SAVES.md](SAVES.md).

Le module `canaan-modules` (point d’entrée `bridge.js`, regroupé par esbuild) expose les catalogues de `shared/data/` aux anciens scripts. `shared/data/equipment.js` définit les qualités, définitions d’armes et compétences (il n’y a plus d’artisanat ni de forge). Les tables font partie des contrats obligatoires du bootstrap. Les modules consommateurs ne les reconstruisent plus. La barre des quatre compétences est initialisée après validation du bootstrap (ou après chargement de la sauvegarde), et non pendant le chargement des modules. `characterStats` utilise une entrée en attente jusqu’à l’installation des statistiques (`canaan-stats`).
