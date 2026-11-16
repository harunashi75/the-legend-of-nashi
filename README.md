# The Legend of Nashi

Les sources modifiables sont dans `src/canaan/` : JavaScript par système dans `scripts/`, CSS dans `styles/`, structure HTML dans `template.html`. `manifest.json` répertorie les modules dans leur ordre d’exécution, identique à celui du template.

Le fichier `CANAAN_ONLINE_V1_9_0.html` est le résultat généré ; son nom suit la version déclarée dans `src/canaan/scripts/runtime-config.js`. Il reste autonome et peut être ouvert directement dans le navigateur, sans serveur ni installation de dépendances.

Après une modification des sources :

```sh
python3 tools/build_canaan.py
python3 tools/build_canaan.py --check
node tests/canaan-regressions.cjs
```

Python 3.9 ou plus récent est nécessaire à l’assemblage. Les tests utilisent Node.js avec `node:test`. Ne pas modifier directement le HTML généré : le prochain assemblage remplacerait ces changements.

Les points d’entrée `hit`, `useSkill`, `drawBigMap` et `applyItemName` ont chacun une implémentation directe. Les fonctions et les modules portent des noms descriptifs. Les catalogues de qualités et d’armes sont définis une seule fois dans `src/canaan/shared/data/equipment.js`.

## Modules ES et dossier shared/

Le code passe progressivement en modules ES (`import`/`export`), comme prévu par la conception du coopératif. Pendant la transition, le jeu reste jouable et le résultat reste un seul HTML autonome.

- `src/canaan/shared/` contient les règles et données pures : aucun écran, aucun stockage, aucun réseau, aucune variable globale, et aucun import hors de `shared/`. Ces modules se chargent aussi directement dans Node (base de la simulation sans écran).
- Déjà convertis :
  - `shared/data/equipment.js` : qualités, armes et compétences ;
  - `shared/data/item-names.js` : noms officiels des objets et passifs des artéfacts ;
  - `shared/data/rubis.js` : catalogue des 48 Rubis ;
  - `shared/data/arena.js` : vagues, multiplicateurs, coopératif et les douze boss ;
  - `shared/data/world.js` : donjons et raids (`INSTANCE_DEFS`, et `createInstances()` qui donne à chaque partie sa propre copie, où l’île place les portails), monstres, boss de monde et délai de réapparition ;
  - `shared/data/economy.js` : récompenses par source, prix du sac, prix de rachat des anciens matériaux (`LEGACY_MATERIAL_GOLD`) ;
  - `shared/data/classes.js` : les quatre classes (élément, passif, sort spécial, dix talents) et les niveaux des emplacements de talents ;
  - `shared/data/stats.js` : niveau maximum (60), les trois statistiques principales et les six secondaires, force de chaque qualité, profil de chaque emplacement, niveaux des six zones et courbe d’XP.
- Règles pures, dans `shared/rules/` ; elles reçoivent leurs données en paramètres et ne lisent jamais l’état d’une partie :
  - `items.js` : qualité, niveau d’un objet (`itemLevel`), tirage de qualité (avec un générateur aléatoire en paramètre), type d’arme, nom affiché, icônes, variantes d’artéfact ;
  - `stats.js` : statistiques d’un objet (`itemPrimary`, `rollSecondaries`, `itemStats`), statistiques d’un héros (`heroStats`), Défense (`defenseReduction`), monstres par niveau (`mobHealth`, `mobDamage`, `bossHealth`, `bossDamage`, `levelGapFactor`), XP (`xpToNext`, `mobXp`, `bossXp`, `clearXp`, `addXp`) et conversion des anciens iLvl (`levelFromIlvl`) ;
  - `combat.js` : dégâts reçus par un héros (défense, déviation, coup critique ennemi), dégâts infligés (armure de la cible, précision, attaque de dos, critique) et puissance d’attaque ;
  - `economy.js` : qualité du butin par source, tirage des ressources, prix de vente et de la boutique ;
  - `classes.js` : emplacements de talents selon le niveau, état de classe valide, compétences offensives, élément d’une compétence, effets sur la durée non cumulables.
- Les anciens scripts gardent de petites fonctions d’appel (`averageItemLevel()`, `characterStats()`, `gearSellValue()`, `rarityRoll()`…) qui passent l’état global à ces règles. `characterStats()` ajoute ensuite le passif d’artéfact, les talents de classe et les Rubis.
- Format des sauvegardes, dans `shared/save/schema.js` : schéma 10, validation, aventure neuve, résumé pour le menu, nettoyage des noms et importation du schéma 9. Le jeu et l’application de bureau (`app/saves.js`, qui le charge avec `require`) utilisent cette même source.
- **Objet `game`** (`scripts/game-state.js`, phase 2) :
  - `game.hero` : le héros de l’hôte (`player`, qui est l’objet `P`, `equipment`, `inventory`, `materials`, `kills`), et ses états sauvegardés : `classe` (classe et talents équipés), `rubis` (collection et six emplacements) et `arena` (records). Les modules des classes, des Rubis et de l’Arène lisent et modifient ces champs ; ils ne gardent que l’état temporaire du combat (minuteurs, boucliers, tentative d’Arène en cours) ;
  - `game.world` : le monde de l’aventure (`tiles` et `decor`, `overworld` et `overdecor` gardés pendant une instance, `monsters`, `projectiles`, `drops`, `npcs`, `chests`, `openedChests`, `worldBossTimers`, `instance` pour le donjon, raid ou Arène en cours, `returnPos`, `clock`). Les particules et les textes flottants n’en font pas partie : ce sont des effets d’affichage.
  - `game.hero.intent` : l’intention du joueur pour le prochain pas (direction voulue, attaque de base maintenue, point visé). `readInput()` la remplit depuis le clavier, le tactile et la souris ; un invité l’enverra par le réseau.
  - `game.heroes` : les héros présents, l’hôte d’abord. `canaanCreateHero({ name, x, y, equipment })` crée un héros au même format (PV maximum tirés de son équipement) ; l’appelant l’ajoute à la liste. À chaque pas, chaque héros se déplace selon sa propre intention et à sa propre vitesse (`stepHero`), les monstres ciblent le héros vivant le plus proche (`nearestHero`), et un allié touché encaisse selon ses propres statistiques (`hurtAlly`, règle partagée `shared/rules/combat.js`, aussi utilisée pour l’hôte). Un allié à terre n’est plus une cible. Chaque allié frappe selon son intention (`intent.attack`) avec son attaque de base (`canaanHeroBasicAttack`) : mêmes formes, portées et valeurs que l’hôte, mais avec sa propre arme, ses propres statistiques et sa propre recharge ; ses flèches et projectiles lui appartiennent. Tous les coups, ceux de l’hôte compris, passent par `canaanHeroStrike` (règle partagée `resolveOutgoing`, Rubis de l’hôte seulement) puis `canaanDamageMonster`, qui compte la victime pour le héros qui l’a abattue. **Groupe en instance** : `enterInstance` et `leaveInstance` font entrer et sortir tout le groupe ensemble (`placeGroup` : l’hôte au point d’entrée, les alliés en éventail ; un allié à terre se relève). Le coffre de boss donne à **chaque** héros son objet garanti et sa bourse d’or, quel que soit celui qui l’ouvre (`openNearbyChest(héros)`).

**Jalon de la phase 2 atteint** : un test fait jouer quatre héros (épée, lance, arc, hache) par un pilote qui envoie leurs intentions (`tests/helpers/group-bot.js` : chemin case par case, attaque à portée de l’arme, coffre puis sortie). Sans écran, le groupe explore et termine la Cave des Terriers Abandonnés (énigmes des portes, mur fissuré, boss caché) puis le raid du Bastion du Roi Sanglant, chacun avec son propre butin.

**Butin individuel** : `recordKill(monstre, héros)` donne les récompenses au héros qui a abattu le monstre ; `giveGear(…, héros)`, `grantSourceReward(source, héros)`, `materialGrant(gain, héros)` et `onWorldBossKilled(boss, héros)` déposent objets, ressources et or dans ses propres affaires (l’hôte par défaut). Le sac d’un allié a 10 places au départ, comme celui de l’hôte (agrandissable jusqu’à 100) ; plein, l’objet est converti en or pour lui. L’or au sol revient au premier héros vivant qui passe dessus. Les messages de butin d’un allié vont dans le chat (`canaanLootNotice`). **Compétences pour tous les héros** : les 36 compétences (9 armes × 4) se lancent pour n’importe quel héros. Pendant une compétence, les aides de `weapon-actions.js` (cônes, cercles, lignes, ruées, projectiles, dégâts, soins) agissent pour le lanceur courant (`withActor`) ; les postures et cumuls (parade, rage, élan, combo, ombre, concentration, arcanes, marque, serment…) sont propres à chaque héros (`héros.skillState`), et les effets différés (rafales, pluie de flèches, saignements, sol consacré) frappent pour leur lanceur. Un allié lance une compétence par son intention (`intent.skill`, ou `canaanHeroUseSkill(héros, i)`) : son arme, son mana et ses propres recharges, réduites par sa Récupération. Le sol consacré soigne chaque héros du groupe qui s’y tient ; la parade et le serment d’un allié le protègent lui seul. L’hôte garde sa barre et ses recharges affichées. Les compagnons locaux lancent une compétence prête dès qu’une cible est à portée.

**Classes et Rubis pour tous les héros** : chaque héros a sa classe, ses talents équipés (emplacements selon son propre niveau), sa collection et ses six emplacements de Rubis (`héros.classe`, `héros.rubis`, sauvegardés), ainsi que l’état de leurs effets : minuteurs, boucliers, forme féline, cumuls, effets sur la durée, survie aux coups fatals (non sauvegardé). `class-talents.js` et `rubis.js` agissent pour un héros courant (`within(héros, fn)`, l’hôte par défaut) ; chaque point d’accroche prend le héros en dernier argument (`CANAAN_RUBIS.attackBefore(m, d, options, héros)`, `CANAAN_CLASS_DEFENSE(m, d, héros)`, `canaanApplyHeal(n, périodique, héros, soigneur)`…). Le moteur de combat sert aussi chaque héros : `CANAAN_COMBAT.attack(cible, dégâts, options, héros)`, `incoming(source, brut, options, héros)`, `hurt(n, source, héros)` et `heal(n, type, héros)`. Les coups, compétences, flèches et dégâts reçus des alliés y passent (passif d’artéfact, talents, Rubis, roulade, déviation), avec le coût de mana et les recharges réduits par leurs propres talents et Rubis. Les effets posés sur un monstre (ronces, poisons, saignements, brûlures, ralentissements) avancent pour le héros qui les a posés. `CANAAN_CLASS.choose / equip / unequip / special(…, héros)` et `CANAAN_RUBIS.equipFor / unequipFor(héros, …)` changent la classe, les talents et les Rubis d’un héros. Au chargement, ceux des invités sont vérifiés comme ceux de l’hôte. Les messages d’un allié (Foi inébranlable, Écorce protectrice, Rubis équipé…) vont dans le chat, et sur l’écran d’un invité en ligne. Les Rubis se gagnent encore dans l’Arène, qui ne se joue qu’en solo.
  - `game.view` : le relais d’affichage. `toast()` et `chat()` passent par lui ; sans interface, il ne fait rien. `canaan-game-core` y branche l’affichage réel (`showToast`, `showChat`).
- **Simulation et affichage séparés** : à chaque pas, `runUpdatePipeline()` lit les entrées (`readInput()`) puis appelle `simulateStep()` (le cœur `update()` et les étapes du pipeline), puis `updateWorld()` ; `updateView()` s’occupe ensuite des commandes tactiles, des particules et textes flottants, de la caméra, des barres de PV et de mana, des chiffres de recharge et du nom de la zone. Un test fait tourner 600 pas de `simulateStep()` en interdisant tout accès au document : le héros suit son intention, un monstre frappe, un projectile touche, l’or au sol est ramassé.
  - Tout le code passe par `game.hero` et `game.world`. Les anciens noms globaux (`equipment`, `monsters`, `world`, `instanceState`…) ne sont plus que des raccourcis transitoires vers ces champs (`CANAAN_LEGACY_NAMES`), gardés pour les tests ; un test interdit de les réutiliser dans le code du jeu. `averageItemLevel(héros)` et `characterStats(héros)` calculent n’importe quel héros (l’hôte par défaut), avec sa classe et ses Rubis.
- Les catalogues sont gelés en profondeur (`shared/freeze.js`) : une donnée de référence ne peut pas être modifiée par erreur pendant une partie.
- Les thèmes des donjons (`dungeons.js`) mêlent couleurs, décor et apparence des monstres : ils iront avec l’affichage (`client/render`), pas dans `shared/`.
- `src/canaan/bridge.js` est le point d’entrée des modules. L’entrée `"kind": "module"` du manifeste le fait regrouper par esbuild (version épinglée dans `package.json`) en un seul bloc `canaan-modules` du HTML. C’est aussi un **pont transitoire** : il expose les exports des modules partagés en variables globales pour les anciens scripts de `scripts/`. Il disparaîtra quand plus aucun ancien script n’en dépendra.
- Pour convertir un catalogue : déplacer ses données dans `shared/data/` avec `export`, l’importer dans `bridge.js`, puis retirer l’ancienne déclaration. Un test vérifie les règles de `shared/` et que chaque export arrive dans le jeu.

Le build demande maintenant `npm install` une fois (esbuild et Electron), en plus de Python 3.

## Bâtiments où l'on entre et maison (housing)

`scripts/house.js`. Comme dans les RPG en vue de dessus, plusieurs bâtiments s'ouvrent : **E** devant la porte fait entrer dans la pièce intérieure, **E** devant la porte intérieure fait ressortir. Les pièces (`CANAAN_ROOMS`, `game-core.js`) sont posées dans les coins d'océan de la carte, loin les unes des autres ; dedans, le reste du monde est noir, la caméra se cale sur la pièce et on ne voit que les habitants de cette pièce. Zone sûre, musique douce, feu qui crépite s'il y a une cheminée ou une cuisinière.

Les façades suivent la facture de l'île, des donjons et des raids : volumes en blocs de pixels, contour sombre, lumière venant du haut à gauche (reflet à gauche, ombre à droite et sous l'avant-toit), ombre portée, textures fixes. Toit à quatre pans en escalier de pixels (croupes à l'ombre, faîtage, pignon avancé au-dessus de la porte avec un œil-de-bœuf), porte en arc avec ferrures et lanterne, fenêtres éclairées à volets, soubassement de pierres, cheminée qui fume. Chaque bâtiment prend le style de son biome (`LOOKS` dans `house.js`) :

| Style | Biome | Architecture |
|---|---|---|
| Chaumière, échoppe, auberge, demeures | Plaines verdoyantes (camp, maison) | Colombages et croix de bois, chaume, tuiles rouges ou ardoises ; jardinières fleuries, auvent rayé et caisses (échoppe), tonneaux (auberge), enseignes en potence |
| Cabane en rondins | Forêt ancienne | Rondins aux bouts ronds, bardeaux couverts de mousse, bois empilé |
| Cabane sur pilotis | Marais brumeux | Planches humides, toit de roseaux à longue frange, pilotis, échelle, eau qui clapote |
| Maison aux bardeaux roux | Bois d'automne | Colombages, bardeaux orangés semés de feuilles mortes, citrouilles |
| Maison de terre crue | Désert oublié | Toit-terrasse (tapis, jarres, parapet, poutres saillantes), tour carrée crénelée coiffée d'un dôme blanchi, fenêtres à moucharabieh |
| Maison de pierre lilas | Forêt enchantée | Pierre de taille lilas, toit violet aux éclats scintillants, cristaux lumineux |

**Sentiers** : chaque porte est reliée au chemin le plus proche (ou au sentier d'un bâtiment déjà relié) par un sentier de terre de deux cases. Il est tracé par une recherche de chemin sur la terre ferme, sans eau, roche ni bâtiment, avec peu de virages. Tous les sentiers rejoignent le camp.

**Intérieurs** : peints avec les pinceaux des donjons et des raids (`CANAAN_TILE_KIT`, exporté par `dungeons.js`). Le sol est en planches, rondins ou pierres plates, avec une ombre au pied des murs. Le mur du fond a un couronnement, du papier peint, de la pierre blanchie, des rondins ou de la terre crue, une cimaise, un lambris à panneaux biseautés (faïence bleue en cuisine) et une plinthe dans l'ombre. Les autres murs ont un sommet sombre et une arête claire côté sol, et la porte un chambranle en trois tons. Chaque meuble est peint à part, avec reflet à gauche, ombre à droite, contour sombre et ombre au sol ; les meubles animés sont repeints toutes les deux images.

**Camp de l'Aurore** (`world-settlements.js`) : le feu (lit de braises, cercle de pierres, bûches aux cernes visibles, flamme des donjons, étincelles), les souches, le banc-bûche et les torches sur poteau sont peints de la même façon. Chacun a une emprise au sol (`canaanCampBlocked`, au moins 26 pixels, car `canWalk` teste les coins du personnage à ±12 pixels) : héros, habitants et animaux en font le tour.

Les pièces n'existent que sur l'île : en donjon, dont la carte réutilise les mêmes coordonnées, `canaanRoomAt` renvoie toujours `null` (aucun meuble n'y bloque le passage).

| Bâtiment | Où | À l'intérieur |
|---|---|---|
| Échoppe de Lira | Camp de l'Aurore | Le marchand Lira derrière son comptoir, présentoirs à potions, caisses ; un client |
| La Marmite dorée | Camp de l'Aurore | Cheminée, cuisinières, grande marmite, tables : **on y cuisine** ; le cuisinier et une cliente |
| Demeure des Aubépines, Demeure du Puits | Camp de l'Aurore | Chambres meublées ; un ou deux habitants |
| Refuges (Vieux Chêne, Clairières, Oasis, Dunes) | Leur lieu sur l'île | Cabane en rondins (terre crue dans le désert) avec cheminée ou cuisinière ; un habitant dedans, un pêcheur ou un voyageur devant |
| Ta maison | À l'ouest du camp (sentier jusqu'au camp), loin des portails | Pièce vide à décorer |

Le garde, un villageois, un enfant et un voyageur restent dehors, autour du feu de camp.

**Décorer sa maison**

- **H** (à l'intérieur de sa maison) ouvre le mode décoration : catalogue en bas de l'écran (Meubles, Cuisine, Déco, Murs, Tapis), aperçu vert ou rouge sous la souris, clic pour poser, clic sur un meuble pour le déplacer, 🗑 Retirer, clic droit ou Échap pour annuler.
- **R** (ou ⟳ Tourner) tourne le meuble en main avant de le poser, sinon le meuble visé. Lits, tables, bancs, coffres, comptoir, caisses et tapis tournent d'un quart de tour (4 sens, leur place au sol pivote) ; la chaise a 4 vues dessinées (de face, de dos, de profil) ; les autres objets se retournent en miroir (2 sens). Un meuble qu'on déplace garde son sens.
- 40 objets : lits, table, table ronde, chaise, banc, armoire, bibliothèque, coffre, commode, comptoir, présentoir à potions, caisse ; cuisinière, cheminée, grande marmite, tonneau, sacs de grain ; grande plante, pot de fleurs, lampe, aquarium ; fenêtres (vue animée sur l'extérieur), cadre, grand tableau, horloge, étagère, trophée de chasse, miroir, rideaux rouges ou bleus, casseroles suspendues, herbes et jambons ; tapis rouge, rond et long.
- Règles : dans la pièce, pas de chevauchement dans une même couche (sol, tapis, mur, rideau : les rideaux vont sur les fenêtres, les tapis sous les meubles), passage devant la porte libre, cheminée, bibliothèque et présentoir contre le mur du fond, 150 objets au plus. Les meubles bloquent le passage, pas les tapis.
- Sauvegarde : `monde.maison` (`{k, x, y, r}` par objet). En ligne, chacun entre et décore ; l'hôte vérifie (actions `house-door`, `house-place` avec `r`, `house-rotate`, `house-remove`) et renvoie la maison à tous dans l'état.

## Métiers : pêche et cuisine (touche P)

**Minage, cueillette et enchanteur** (`gathering.js`, `CANAAN_GATHER`) : trois métiers de plus, avec leur niveau (1 à 40) et leurs qualités comme la pêche.
- **Minage** : des filons (rochers aux éclats colorés) sur toute l’île, un métal par biome : cuivre (Plaines), étain (Forêt ancienne), fer (Marais), argent (Forêt automnale), or (Désert), mithril (Forêt enchantée). E près d’un filon : 1 à 3 minerais.
- **Cueillette** : une herbe par biome (menthe sauvage, sauge des bois, mousse des brumes, ortie rousse, aloès des sables, lys étoilé), cuisinée en infusions (onglet Cuisine).
- **Travaux minutés** : miner et cueillir prennent 5 s (outil en main, coups réguliers, éclats de roche ou feuilles, barre d’avancement ; le filon tremble et se fissure peu à peu). Fabriquer un enchantement prend 10 s à la **forge du Camp de l’Aurore** (fourneau et enclume, à l’est du feu de camp ; 2 s de plus par enchantement en série) et ne se fait nulle part ailleurs. Cuisiner prend 6 s près d’une cuisinière (La Marmite dorée, un refuge ou sa maison). Bouger interrompt le travail. L’hôte mène les travaux (`hero.work`) ; un invité voit le sien (avec sa pêche en cours) et ceux des autres (`act` dans l’état des héros).
- Un gisement récolté se reforme au bout de 90 s pour ce héros (chacun récolte les siens) ; il apparaît vide en attendant. Positions identiques chez chacun, jamais sur une route, au camp, dans un bâtiment ou sur un lieu de quête.
- **Enchanteur** : 3 minerais d’un même métal donnent un enchantement d’une statistique secondaire au choix (Puissance, Critique, Célérité, Maîtrise, Soin, Résistance). Le métal fixe sa force (16 % à 40 % de la base de l’objet, comme une secondaire) ; chaque métal demande un niveau d’enchanteur (cuivre 1, étain 6, fer 12, argent 20, or 28, mithril 35 : les mêmes paliers que les qualités des métiers), et le niveau d’enchanteur de celui qui pose l’enchantement le renforce aussi de 1 % par niveau (jusqu’à +40 %). Chaque recette indique clairement ce qui manque (niveau, minerais, forge). Posé sur une pièce d’équipement (sauf un artefact), il lui ajoute cette statistique en **troisième secondaire** (`item.ench`, compté dans les statistiques et affiché dans l’info-bulle) ; un nouvel enchantement remplace l’ancien. Un clic sur un enchantement du sac ouvre l’onglet Enchantement pour choisir la pièce.
- Minerais, herbes et enchantements sont des objets du sac et de la banque (piles de 100). Actions de l’invité : `gather`, `enchant-craft`, `enchant-apply`.
- **Nouveaux poissons** : perche, brochet, anguille, mérou, raie ; **nouveau gibier** : faisan, canard colvert, chèvre des sables, lézard des dunes ; chacun avec sa recette.

`scripts/professions.js`. Deux métiers, niveaux 1 à 40 ; chaque qualité (les mêmes que l'équipement) se débloque à un niveau : Commun 1, Peu commun 6, Rare 12, Épique 20, Légendaire 28, Mythique 35 (les anciennes sauvegardes à huit qualités sont converties une fois : Héroïque → Épique, Céleste → Mythique).

- **Pêche** : dans l'eau profonde seulement (mer, lacs, lacs scintillants ; pas l'eau peu profonde du marais), près d'un banc de poissons (remous, petits poissons qui sautent). **E** lance la ligne ; quand ça mord ❗, **E** ferre (sinon le poisson s'échappe ; bouger remonte la ligne). Espèces : mer (saumon, thon, espadon), lacs selon le biome (gardon, carpe, truite), oasis (silure), lacs scintillants (poisson-lune astral). La qualité dépend du niveau de pêche.
- **Cuisine** : près d'une cuisinière, d'une marmite ou d'une cheminée : à La Marmite dorée (Camp de l'Aurore), dans les refuges, ou dans sa maison si on y en a posé une. Un poisson donne un repas de sa recette ; qualité du repas = celle du poisson, plafonnée par le niveau de cuisine.
- **Repas** (onglet Repas) : Soupe de gardon (PV tout de suite), Truite grillée (mana tout de suite), Carpe mijotée (PV par seconde pendant 5 s), Festin astral (% des PV et du mana pendant 10 s), Saumon fumé (+dégâts 1 min), Ragoût de thon (−dégâts subis 1 min), Silure aux épices (+vitesse 2 min), Brochette d'espadon (dégâts et vitesse 2 min). Effets multipliés par la qualité. Les repas rapides partagent un délai de 20 s ; un seul bonus à la fois.
- Sauvegarde : `heros.hote.prof` (et `heros.invites[id].prof`). En ligne, l'hôte décide (actions `fish`, `cook`, `eat`) ; l'invité reçoit ses métiers dans le sac et sa pêche en cours dans son message privé.

### Chasse et collections

- **Chasse** (3e métier, niveaux 1 à 40, mêmes qualités) : lièvres, cerfs, moutons sauvages, grenouilles et bêtes astrales (cerfs et lièvres lumineux) tombent sous une attaque normale (mêlée devant soi, arc ou bâton en ligne droite vers le viseur) et donnent leur viande (gibecière). L'animal revient une minute plus tard. L'hôte vérifie l'espèce, le biome et un court délai (action `hunt`).
- **Recettes de gibier** : Civet de lièvre (PV et mana tout de suite), Rôti de venaison (+dégâts et −dégâts subis 2 min), Gigot aux herbes (PV sur 8 s), Cuisses de grenouille sautées (+vitesse 3 min), Banquet céleste (% des PV et du mana pendant 15 s).
- **Collections** (onglets Pêche et Chasse) : chaque espèce découverte a sa carte (image en pixels, prises, meilleure qualité) et une petite bio ; les autres restent en silhouette avec un indice. Sauvegarde : `prof.codex`, `prof.meat`, `prof.hunting`.

## Vie dans l'eau

`scripts/sea-life.js` : bancs de poissons sous la surface (mer et lacs), dauphins qui sautent, baleines qui remontent souffler puis plongent en levant la queue.

## Vie du monde

`scripts/life.js` (décoratif, calculé chez chaque joueur) :

- **Animaux** propres à chaque biome, qui se promènent autour de chez eux, font des pauses et fuient le héros (les craintifs) : lapins, moutons, cerfs et renards dans les Plaines ; cerfs, renards, écureuils dans la Forêt ancienne ; grenouilles, hérons et tortues au bord de l'eau du Marais ; renards, hérissons, cerfs et écureuils dans la Forêt automnale ; lézards, fennecs et caravanes de chameaux dans le Désert ; cerfs et lapins lumineux dans la Forêt enchantée ; poules au camp ; moutons, vaches et cochons dans l’enclos de la ferme. Papillons, libellules et lucioles virevoltent selon le biome.
- **Habitants** au Camp de l'Aurore (garde, villageois, enfant, voyageur dehors ; ancien, cuisinier, villageois dans les bâtiments) et aux refuges, ruines et tours (pêcheur, ermite, éclaireuse…) : ils flânent, se tournent vers le héros et lui parlent dans une bulle quand il passe près d'eux (répliques selon le rôle et le biome) ; de temps en temps, l'un d'eux parle tout seul.
- **Marchand** redessiné (`merchants.js`) : marchand ambulant à chapeau à plume, moustache, manteau à boutons dorés et grand sac à dos, couleurs propres à chaque village, clignement d'yeux.

## Échange entre joueurs

Touche **J** (ou 🤝) : en ligne, deux joueurs s'échangent des objets de leur sac (12 au plus) et de l'or. L'un propose, l'autre accepte ; chacun compose son offre, puis valide. L'hôte vérifie tout (objets encore dans le sac, or, place dans les deux sacs) et n'échange que si les deux ont validé la même offre : toute modification annule les validations. Les objets portés ne s'échangent pas ; un échange est annulé si un joueur part. Les compagnons locaux reçoivent leur équipement par le panneau Groupe.

- Règles : `scripts/trade.js` (`CANAAN_TRADE.handle`, côté hôte). Protocole : actions `trade-request`, `trade-answer`, `trade-offer`, `trade-ready`, `trade-cancel` (`sanitizeAction`), et vue de l'échange dans le message privé `me` (`trade`).

## Son et ambiance

`scripts/audio.js` synthétise tout (Web Audio, aucun fichier) :

- **Musique** : une pièce par biome (Plaines, Forêt ancienne, Marais, Forêt automnale, Désert, Forêt enchantée), pour les villages, pour chaque donjon et chaque raid (tonalité et tempo propres) et pour l'Arène. Harpe et guitare (cordes pincées), flûte, cloches, nappes, cordes, chœur, cuivres, taikos et tambours sur cadre. Chaque pièce est composée une fois par lieu (32 mesures : introduction, thème, variation, pont, reprise) et s'enchaîne en fondu.
- **Ambiance** : vent (qui suit le vent visible des arbres), feuillage, ressac et clapotis près de l'eau, oiseaux, grillons, grenouilles, hiboux, corbeaux, carillons magiques ; gouttes et grondements dans les donjons.
- **Bruitages** : attaque selon l'arme, impacts et coups critiques, coups reçus, chutes de monstres, roulade, pas selon le sol (herbe, sable, terre, pierre, eau), pièces, butin, coffres et sorts (selon la couleur : feu, glace, nature, foudre, arcane).

## Vent

Arbres, buissons, fleurs et roseaux ploient au passage de rafales qui traversent l'île d'ouest en est (`windAt`, `world-look.js`) ; des feuilles aux couleurs du biome et de légers souffles passent à l'écran (`drawWindLayer`).

## Création du héros

« Nouvelle aventure » ouvre l'écran de création : sexe, race (Humain, Orc, Elfe, Minotaure), teinte de peau ou de pelage (palette propre à chaque race), coiffure (court, long, queue de cheval, tresses, crête, rasé), couleur des cheveux et des yeux, et tenue (huit couleurs d'armure et de cape). L'aperçu marche sur place ; ⟲ ⟳ le font tourner, 🎲 tire une apparence au hasard. L'apparence est purement visuelle.

- Données et vérification : `shared/data/looks.js` (`sanitizeLook`, `randomLook`, `encodeLook`/`decodeLook`). Toute valeur inconnue redevient celle par défaut ; une aventure créée avant cette version garde le héros d'origine (humain, acier et pourpre).
- Sauvegarde : `heros.hote.look`, et `heros.invites[id].look` pour les invités.
- Invités : « 🎨 Apparence de mon héros » dans le formulaire pour rejoindre ; l'apparence est gardée dans les préférences et envoyée avec `join`. L'hôte la renvoie à tous dans l'état (forme compacte `look`).
- Dessin : `drawHeroArt(c, face, pas, look)` dans `pixel-art.js`, sprites mis en cache par apparence (`canaanHeroSprite`).

## Garde-robe et apparences (touche V)

`shared/data/skins.js` (`SKINS`, `SKIN_DROPS`) et `scripts/wardrobe.js` (`CANAAN_WARDROBE`) : des **apparences** (transmogrification) à porter par-dessus son équipement. Ce ne sont pas des pièces une à une mais des **tenues complètes**, purement visuelles : 28 apparences en six qualités, de l’habit de fermier (Commun) à l’armure du dragon d’or ancestral (Mythique).

- **Tenues** : chacune assemble un corps (salopette, tunique, ciré, cuir, robe, robe longue, manteau, kimono, armure de plates), une coiffe (chapeau de paille, toque, bandana, capuche, chapeau de mage, heaume à plumet, cornes, ailes, couronne, couronne de glace, tricorne, kabuto, masque, couronne de fleurs, auréole…), un dos (cape, cape longue, carquois, sac, ailes de dragon, de chauve-souris, d’ange à quatre ou six rangées, de fée, langues de feu) et des épaulières (plates, or, pointes, crânes). Dessinées sur la grille 24 × 30 du héros (`drawSkinParts`, `pixel-art.js`), avec la place autour pour les ailes et les chapeaux.
- **Qualités** : Communes et Peu communes (habits de métier), Rares (chevalier, mage de bataille, druide, pirate, samouraï), Épiques (paladin, nécromancien, chevalier de givre, ninja des ombres, sorcière des fleurs) avec un premier effet, Légendaires (chevalier-dragon, séraphin, seigneur démon, phénix) avec ailes ou flammes et particules, Mythiques (empereur céleste, dragon d’or ancestral, souverain du néant, gardien de l’aurore) avec ailes, aura au sol et particules permanentes (`drawSkinFx` : aura, étincelles, braises, étoiles en orbite, givre, pétales, ombres, auréole lumineuse).
- **Butin** (`SKIN_DROPS`, chance puis poids de chaque qualité) : monstres (0,4 %), élites (2 %), boss de donjon (6 %, pour chaque héros), boss de raid (8 %), boss cachés (18 %, jusqu’au Mythique), boss mondiaux (10 %), coffres secrets (12 %), boss de l’Arène (5 %). Une apparence déjà possédée est revendue d’office (60 à 4 000 or selon sa qualité).
- **Garde-robe (V, ou bouton sur la fiche C)** : toutes les apparences en cartes au cadre de leur qualité, aperçu de la tenue sur ton héros, « ??? » pour celles à découvrir ; un clic pour porter, « Retirer l’apparence » pour revenir à la tenue de création.
- **Données** : la collection est gardée par héros (`skins.owned`, sauvegardée) ; la tenue portée est dans son apparence (`look.wear`, ajoutée à la forme compacte seulement quand il y en a une), donc sauvegardée, envoyée aux autres joueurs et dessinée chez chacun. En ligne, l’invité demande à l’hôte (`skin-wear`), qui vérifie qu’il la possède.

## Coopératif en ligne (phases 4 à 6)

Un hôte ouvre son aventure à ses amis ; jusqu’à trois invités le rejoignent par un code de salon. Le **relais** (`relay/server.cjs`) ne fait que les mettre en relation : il ne simule rien et ne garde aucune sauvegarde.

```sh
npm install      # une seule fois (ws pour le relais, Electron, esbuild)
npm run relay    # relais sur ws://localhost:8787 (variable PORT pour changer de port)
```

- **Hôte** : dans le panneau 👥 Groupe (touche G), saisir l’adresse du relais puis **Ouvrir à mes amis** ; le code du salon (6 caractères) s’affiche. **Fermer le salon** renvoie les invités au menu.
- **Invité** : sur l’écran titre, **Rejoindre la partie d’un ami** : pseudo, code du salon, adresse du relais. Son application crée une fois un identifiant (gardé dans ses préférences) : il retrouve le même héros à chaque retour dans ce monde. Un nouvel invité reçoit un héros de départ ; tout est rangé dans la sauvegarde de l’hôte (`heros.invites`).
- **Synchronisation** : l’invité envoie ses intentions dès qu’elles changent, sinon 15 fois par seconde (direction, attaque de base, compétence, roulade, point visé, numéro de séquence) ; l’hôte les vérifie (`sanitizeIntent`), simule le monde et renvoie son état 10 fois par seconde (héros, monstres, or au sol, projectiles, carte ou donjon en cours avec ses herses ouvertes, et les effets de combat : chiffres, éclats, effets des compétences). L’invité ne sauvegarde rien ; il lisse les positions des autres. Le chat passe par le salon.
- **Ce que l’invité voit de lui-même** (phase 5) : l’hôte envoie à chaque invité un message privé : sa position confirmée, sa vitesse, les recharges de ses compétences et de sa roulade, et, quand ils changent, son sac (10 places au départ, comme l’hôte), son équipement ; à chaque message, son niveau et son XP. Son sac, sa fiche, sa barre de compétences, ses PV, son niveau, son XP et son or sont donc les siens. Les messages de butin (« 🎁 … », « +9 or »), « à terre » et « se relève » s’affichent sur son écran.
- **Mouvement prédit** : l’invité avance tout de suite chez lui, avec la vitesse donnée par l’hôte et les mêmes murs ; à chaque message privé, il compare la position confirmée à celle qu’il avait prédite au même moment (numéro de séquence) et corrige l’écart en douceur, ou d’un coup au-delà de 240 px. La roulade est prédite de la même façon.
- **Actions de l’invité** : équiper, retirer, arme de réserve et changement d’arme (Q) ; choisir sa classe, équiper et retirer ses talents (panneau T), lancer son sort spécial (F) ; équiper et retirer ses Rubis (fiche, touche C) ; parler au marchand (E) pour acheter l’équipement vert, vendre un objet ou tous les objets communs, agrandir son sac (10 places au départ, +10 par achat jusqu’à 100, aux mêmes prix que l’hôte). Il les demande à l’hôte (`sanitizeAction`), qui vérifie (objet dans son sac ou porté, classe connue, changement de classe au camp, emplacement libre, hors combat, mana et recharge du sort spécial, Rubis possédé, marchand à portée de **son** héros, or suffisant), les exécute sur son héros avec son or, et renvoie son sac, sa classe et ses Rubis. Rien ne change chez l’invité avant la réponse ; ses panneaux (sac, fiche, talents) se mettent à jour à la réponse. Un invité parle au marchand et ouvre les coffres (secrets ou de fin d’instance) à côté de lui : l’hôte vérifie la distance et lui donne le butin ; un coffre secret ouvert l’est pour tout le monde (état du monde), et les invités reçoivent la liste des coffres déjà ouverts. Portails, instances, Arène et panneau Groupe restent à l’hôte.
- **Chacun à son niveau** : un monstre a un niveau fixe (celui de sa zone, de son instance ou de son boss) et les mêmes PV pour tout le monde ; rien ne s’adapte aux héros. Chaque héros le frappe avec ses propres statistiques (un écart de niveau réduit ou augmente ses dégâts, `levelGapFactor`) et encaisse ses coups avec sa propre Défense et sa Résistance. Une victoire donne de l’XP au vainqueur et à ses alliés proches, chacun selon son propre niveau.
- **Combat partagé** : les monstres sont ceux de l’hôte, avec les mêmes PV pour tout le monde ; chaque héros frappe avec ses propres statistiques, reçoit les coups selon son équipement, roule avec son invulnérabilité et sa recharge, et garde son propre butin. Un invité à terre se relève près de l’hôte au bout de dix secondes, à 50 % de ses PV ; son cadre affiche le compte à rebours.
- **Refus** : versions ou schémas différents, aventure déjà pleine (6 héros invités), trois invités déjà présents, héros déjà connecté.
- **Sécurité** : le relais limite la taille (64 ko) et la fréquence des messages (60 par seconde pour un invité, 240 pour l’hôte qui écrit à tous), impose l’identité de chaque invité et ne transmet à l’hôte que ses intentions, ses actions et son chat. L’invité n’envoie jamais de statistiques, d’or, d’objets ni de Rubis.
- Le protocole est dans `src/canaan/shared/net/messages.js`, partagé par le relais et le jeu ; le client est `scripts/net.js` (`canaan-net`).
- **Place réservée** (phase 6) : si la connexion d’un invité tombe, son héros reste dans le groupe pendant 2 minutes, immobile et protégé : aucun monstre ne le vise, aucun coup ne le blesse, il ne compte pas dans l’Arène. Il apparaît en transparence avec « ⏳ » ; le panneau Groupe montre le temps restant. L’application de l’invité retient le dernier code de salon : il rouvre le jeu, clique sur « Rejoindre », et reprend son héros là où il était. Si l’ancienne connexion n’est pas encore fermée chez l’hôte (le relais met jusqu’à 30 s à s’en rendre compte), la nouvelle la remplace. Sans retour dans les 2 minutes, le héros quitte le groupe ; il reste enregistré dans l’aventure.
- **Jalon de la phase 6** : un hôte et trois invités en ligne finissent le donjon 1 ensemble, chacun avec sa relique dans son propre sac et sa bourse d’or. Chaque invité envoie lui-même ses intentions par le relais. L’hôte envoie environ 17 Ko/s à quatre joueurs (état du monde et trois messages privés, 10 fois par seconde).
- **Jouer avec Tailscale** (application de bureau, ami loin) : installez tous les deux [Tailscale](https://tailscale.com/download) (gratuit), connectez-vous, et mettez-vous dans le même réseau Tailscale (l’hôte invite son ami depuis la console Tailscale, ou partage sa machine avec lui). Dans le panneau 👥 Groupe, **🌍 Jouer avec Tailscale** : l’application lance le relais chez l’hôte (`app/hosting.js`) sur son **adresse Tailscale seulement** (`ws://100.x.y.z:8787`, port 8788 à 8791 si pris) : invisible depuis Internet et depuis le réseau de la maison. Le panneau affiche l’adresse, le nom MagicDNS (`…ts.net`) et le **code du salon** ; **📋 Copier l’invitation** met les deux dans le presse-papiers, l’invité la colle dans « Invitation reçue » sur l’écran titre. Pas de tunnel, pas de limite de temps, l’adresse ne change pas.
  - Si Tailscale n’est pas installé, arrêté ou pas connecté, le panneau le dit. Sous Linux, si un pare-feu est actif, le panneau donne la commande à lancer une fois (firewalld : `sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0 && sudo firewall-cmd --reload` ; ufw : `sudo ufw allow in on tailscale0 to any port 8787 proto tcp`).
  - « Relais injoignable » chez l’invité avec une adresse Tailscale : son Tailscale doit être lancé et connecté, et il doit voir la machine de l’hôte dans sa liste Tailscale.
- **Jouer en réseau local** (application de bureau) : **🏠 Jouer en réseau local** dans le même panneau, pour quelqu’un chez toi, sans Internet ni Tailscale. L’application ouvre le relais aux appareils de la maison (port 8787, ou 8788 à 8791 s’il est pris), trouve l’adresse de ce PC sur le réseau (`ws://192.168.x.x:8787`, adresses privées en premier) et l’affiche avec le code ; l’invitation se copie et se colle comme pour Tailscale. Si l’invité n’arrive pas à se connecter, le panneau rappelle d’autoriser le port dans le pare-feu (Windows le propose à la première ouverture ; Ubuntu : `sudo ufw allow 8787/tcp`).
  - Pour un relais permanent (par exemple sur un serveur), `npm run relay` reste disponible ; tout le monde met alors son adresse dans « Relais ».

## Groupe (phase 3 du coopératif)

Le panneau **👥 Groupe** (touche **G**, ou le bouton du menu) gère les héros invités de l’aventure : 6 enregistrés au plus, 3 présents à la fois (`scripts/group.js`, `canaan-group`).

- **Créer** un compagnon avec un pseudo : il commence avec l’épée et la tunique de départ portées.
- **Faire venir** ou **Renvoyer** : un compagnon présent apparaît près du héros, avec son pseudo en couleur et sa barre de vie.
- **Équiper le meilleur** : il porte les pièces les plus fortes de son sac qui sont de son niveau (`gearScore`) ; les anciennes retournent dans son sac.
- **Supprimer** demande une confirmation : son héros est perdu.
- En attendant le réseau, un compagnon local est piloté par une petite IA (étape `companions` du pipeline) : il suit l’hôte, combat les monstres proches de lui, se relève près de lui dix secondes après être tombé, et le rejoint s’il est trop loin. Il garde son propre butin : objets, ressources et or.
- Chaque invité est enregistré dans la sauvegarde de l’aventure (`heros.invites`) : pseudo, position, PV, or, victimes, sac, équipement, ressources, classe et talents, Rubis et records. Au chargement, les invités reviennent absents ; le menu des aventures liste leurs pseudos avant une suppression.

## Application de bureau

The Legend of Nashi s’installe comme une application de bureau avec Electron (`app/`). La fenêtre affiche le même HTML assemblé que la version de test ; il n’y a plus besoin de navigateur.

```sh
npm install      # une seule fois : installe Electron (version épinglée dans package.json)
npm start        # assemble le jeu, puis ouvre la fenêtre
npm run app      # ouvre la fenêtre sans réassembler
```

- `app/main.js` crée la fenêtre et charge le HTML dont le nom suit la version de `runtime-config.js`. F11 bascule en plein écran ; F12 ouvre les outils de développement, hors version installée.
- La fenêtre est isolée : pas d’accès à Node.js pour le jeu, aucune navigation ni nouvelle fenêtre, aucune autorisation (caméra, micro…).
- `tools/run_app.cjs` lance Electron en retirant `ELECTRON_RUN_AS_NODE`, que certains terminaux (celui de VS Code, par exemple) définissent et qui ferait démarrer Electron comme un simple Node.
- Les données de l’application sont dans `~/.config/The Legend of Nashi` sous Linux (dossier de données propre à chaque utilisateur). Au premier lancement, les sauvegardes et réglages de l’ancien dossier `~/.config/Canaan Online` y sont copiés (l’ancien dossier n’est pas modifié).
- **Trois aventures** (slots) sur l’écran titre : Continuer, Nouvelle aventure (avec un nom) ou Supprimer, avec une confirmation qui liste les héros invités perdus. Dans l’application, chaque aventure est un fichier `saves/slot-1.json` à `slot-3.json` du dossier de données, avec un bouton « Ouvrir le dossier des sauvegardes ». Le build HTML garde les mêmes trois slots dans le stockage du navigateur. Détails dans [docs/SAVES.md](docs/SAVES.md).

## Le monde : une île, six biomes

Le monde est une seule grande île générée par `world-generation.js` (graine fixe `CANAAN_WORLD_SEED` : la même île à chaque partie). Six biomes l’entourent en anneau, autour d’un massif central infranchissable, dans l’ordre de progression. Une route continue les relie dans cet ordre, depuis le camp, avec un embranchement vers chaque portail. Une crête rocheuse sépare les Plaines de la Forêt enchantée : on atteint la région de fin de jeu en traversant les autres biomes.

| Biome | Paysage | Donjons et raids | Boss mondiaux |
| --- | --- | --- | --- |
| 1. Plaines verdoyantes | Prairies, fleurs, buissons, petits bosquets ; Camp de l’Aurore | Donjon 1 | Fenrir |
| 2. Forêt ancienne | Grands arbres, sous-bois, champignons, clairières ; le plus de coffres secrets et deux refuges | Donjons 2 et 3 | Nocturne |
| 3. Marais brumeux | Eau peu profonde (traversable), roseaux, arbres tordus, petits ponts, chemins étroits | Donjon 4 | Léviathan |
| 4. Forêt automnale | Arbres rouges, orangés et dorés, feuilles au sol, petits lacs | Donjons 5 et 6 | Golem, Colosse |
| 5. Désert oublié | Dunes, oasis, ruines, cactus ; refuges près des points d’eau | Raids 1 et 2 | Ifrit, Séraphin |
| 6. Forêt enchantée | Arbres lumineux, cristaux, plantes magiques, lacs scintillants | Raids 3 et 4 | Chronos |

Le **Camp de l’Aurore** (`CANAAN_CAMP`, `game-core.js`) est la seule zone sûre : un feu de camp, un banc en bûche et quatre bâtiments où l’on entre (échoppe du marchand, cuisine, deux demeures ; voir « Bâtiments où l'on entre »), entourés d’une ferme, d’un verger, d’un jardin et d’un ruisseau (voir « Vie du Camp de l’Aurore »). Le héros y apparaît et y ressuscite (`CANAAN_SPAWN`). Les refuges, ruines et tours (`PIXEL_PLACES`) sont des lieux d’exploration, sans protection ; chaque refuge a sa cabane où l’on entre. `CANAAN_WORLD_AUDIT()` vérifie que chaque portail, boss, coffre et lieu est accessible à pied depuis le camp.


## Paramètres

Bouton « ⚙️ Paramètres » sur l’écran d’accueil, dans le menu pause et en haut de l’écran (`scripts/settings.js`). Échap ferme la fenêtre.

- **Son** : couper ou activer, volume de la musique, volume des effets.
- **Affichage** : plein écran (aussi F11), résolution de la fenêtre (tailles courantes qui tiennent sur l’écran), échelle de l’affichage (75 à 150 %), synchronisation verticale (s’applique au redémarrage, bouton « Redémarrer le jeu »), limite d’images par seconde (selon l’écran, 30, 60, 90, 120, 144, 165, 240) et compteur d’images par seconde.
- **Graphismes et confort** : lueurs des lumières, particules et vent, secousses de l’écran, chiffres de dégâts (les gains d’or, d’XP et de PV restent affichés).
- **🚪 Quitter le jeu** (aussi sur l’accueil et dans la pause) : sauvegarde la partie en cours puis ferme l’application.

Dans l’application de bureau, la fenêtre est réglée par Electron (`app/main.js`, messages `display:*`, réglages gardés dans `display.json` du dossier de données ; la page du jeu ne peut pas demander le plein écran elle-même, les autorisations étant refusées). Les réglages du jeu sont gardés dans les préférences de l’appareil (`settings`). Dans un navigateur, seuls le plein écran et les réglages du jeu sont disponibles.

## Fluidité

Le sol de l’île est peint par blocs de 16 × 16 cases gardés en mémoire (textures, bords arrondis, falaises, détails fixes) ; chaque image ne dessine que les blocs visibles, puis l’eau, les détails animés et le décor. Les blocs voisins sont préparés d’avance pendant les temps libres du navigateur. Les bords de chaque case et les cases fixes du camp (champs, fleurs, pavés) sont aussi gardés, et l’image des cartes n’est refaite que si l’île change ou qu’une herse s’ouvre.

## Cartes (touche M) et mini-carte

`scripts/world-map.js` peint une fois une image de l’île (4 pixels par case : relief et falaises, eaux profondes et rives, écume, arbres et rochers vus d’en haut, routes, ponts, toits des bâtiments, champs et enclos de la ferme). En donjon ou en raid, c’est le plan de l’instance (sols du thème, murs soulignés, herses).

- **Carte M** : vue d’ensemble à l’ouverture ; molette pour zoomer autour de la souris (jusqu’à 16 pixels par case), glisser pour la déplacer, double-clic pour zoomer, boutons ➖ ➕, « 🎯 Me centrer » (la carte suit alors le héros) et « 🗺️ Vue d’ensemble ». Repères : camp, portails des donjons et raids, Arène, boss mondiaux, refuges, ruines et tours, ta maison, marchand, coffres révélés, personnages de quête (« ! » à prendre, « ? » à rendre), objectif de la quête suivie, alliés et ta flèche. Les noms apparaissent en zoomant. En donjon : le plan, les monstres, les élites, les boss nommés et le nombre d’ennemis restants.
- **Mini-carte** ronde, cerclée de laiton avec le nord : elle suit le héros de près (molette pour choisir entre trois zooms), montre les monstres proches et, au bord, une flèche vers l’objectif de la quête suivie s’il est plus loin. Dans une maison, elle montre le bâtiment, dehors.

## Rendu graphique

Le monde et les instances partagent le même niveau de détail :

- **`sprite-kit.js`** (`canaan-sprite-kit`) : silhouettes détaillées en pixels, avec contour sombre, pour toutes les créatures (slime, quadrupèdes, araignée, scorpion, chauve-souris, corbeau, mante, bandit, brute, golem, dragon, esprit, ange, squelette, chevalier…). Chaque monstre du monde reçoit la sienne d’après son nom (`WORLD_LOOKS`), chaque boss mondial une apparence propre. Les élites ont un anneau doré, les boss une aura et une barre de vie en haut de l’écran. Le module gère aussi les lumières (`canaanLight`), l’obscurité, les halos et les particules d’ambiance.
- **`world-look.js`** (`canaan-world-look`) : textures des biomes (herbe, terre, sable, roche, sous-bois, marais, feuilles, mousse, eaux animées), débords dentelés entre terrains voisins, falaises en relief au bord des montagnes, décors avec volume, grain et contour. Chaque biome a son ambiance : pénombre en forêt, brume au marais, feuilles en automne, chaleur au désert, nuit lumineuse en Forêt enchantée.
- **Entrées des instances** (`portal-art.js`, `CANAAN_PORTAL_ART`) : chaque portail sur l’île est dessiné en pixel art « cosy », avec le moteur des bâtiments (grille de gros pixels, aplats de 3 à 5 tons, contour sombre). Il garde le thème de son donjon : terrier sous une butte herbue avec racines et torches ; mine boisée dans la roche moussue, lanterne et wagonnet de cristaux, rails au sol ; temple d’Éclipse à colonnes, fronton et braseros ; château des Pénitents à tours coniques, herse et bannières ; forge volcanique à coulées de lave et cheminée qui fume ; fosse à margelle, potence et chaînes qui plongent ; bastion de briques rouges à crânes sur piques ; anneau doré flottant du Continuum sur son dais ensablé, entre deux engrenages qui tournent ; sanctuaire de marbre ailé de Séraphin ; porte d’étoiles de Célestia entre deux colonnes de lumière ; colisée de l’Arène à deux étages d’arcades et fanions. Chaque entrée se pose dans son biome : ombre de contact tramée, pied des murs assombri, passage tassé devant l’ouverture, cailloux, et selon la région touffes et fleurs, fougères et champignons, roseaux et traces d’eau, feuilles mortes, congères de sable ou cristaux, avec lierre et mousse sur les corniches. L’ouverture est un tourbillon en pixels (12 images précalculées par couleur), avec des étincelles qui montent et une lueur au sol. Les images sont peintes sur le temps libre du navigateur. Le pied de chaque entrée bloque le passage là où elle est pleine (`CANAAN_PORTAL_ART.blocked`, via `canaanPortalBlocked` dans `canWalk`) : le héros s’arrête le pied contre le socle, assez près pour entrer (E), ou passe derrière, caché (`CANAAN_PORTAL_ART.occluders`). L’ancien dessin (`drawDungeonEntrance`, `dungeons.js`) sert de secours sans canevas.
- **Animations des monstres** (`drawCanaanActor`) : ils se tournent vers leur direction, alternent les pas et rebondissent en marchant (les slimes s’écrasent, les volants battent des ailes), prennent leur élan avec une trace de coup quand ils attaquent, et clignotent en blanc quand ils sont touchés. Tout est déduit de leur état (position, recharge, PV), sans toucher à la simulation.
- **Transitions de terrain organiques** (`world-blend.js`, `CANAAN_BLEND`) : même technique que les routes pour tous les bords entre terrains (eau, sable, herbe du marais, feuilles d’automne, herbe, sous-bois) : chaque bloc de 2 px prend le terrain le plus haut dont le champ lissé dépasse un seuil bruité, donc rivages, lisières, mares et esplanades ondulent librement de part et d’autre des cases. Talus éclairé en haut à gauche et ombre portée sur le terrain d’en bas ; berge humide et liseré d’écume au bord de l’eau ; limite douce entre la mer et l’eau peu profonde (teinte translucide sur l’eau animée) ; côtés et haut des falaises découpés avec un contour sombre et une ombre au sol (le pied reste droit). L’eau animée est peinte sous les blocs de sol (`waterUnder`), qui la laissent voir là où elle déborde. Grandes nuances de lumière continues sur toute l’île (motif sans couture), ombres rondes et floues du sous-bois, nappes de brume douces au marais.
- **Eau continue** (`world-look.js`) : mer, eau du marais et lacs scintillants sont peints d’un seul tenant, en motifs sans couture de 256 px ancrés sur le monde (fond marbré en quatre tons qui dérive lentement, reflets qui filent en biais), un remplissage par suite de cases d’une rangée ; plus aucune grille. L’eau passe aussi sous les ponts.
- **Routes au bord de l’eau** (`world-roads.js`) : contre l’eau, routes et esplanades s’arrêtent en bord organique (l’eau animée passe dessous, liseré d’écume) ; elles rejoignent les ponts bien droit. Seule la place du camp est pavée en anneaux ; les portails se posent directement sur le sol de leur biome, au bout de leur chemin.
- **Caméra au pixel près** : la translation de la caméra est arrondie ; sol, eau, décors et personnages bougent ensemble (plus de secousses pendant que la caméra ralentit derrière le héros).
- **Bâtiments en pixel art** (`building-art.js`, `CANAAN_BUILDING_ART`) : chaque bâtiment a son modèle « cosy », dessiné sur une grille de gros pixels (1 pixel d’art = 2 pixels d’écran), en aplats francs de 3 à 5 tons par matière, cerné d’un contour sombre et agrandi sans flou : grands toits à pignon en tuiles rangées et décalées, colombages, volets, fenêtres rondes à croisillons et vitres bleues, auvents rayés, porches et terrasses de planches, cheminées de pierre, lierre et mousse. Ta maison : chaumière pêche au toit rouge, boîte aux lettres ; Marmite dorée : auberge à étage, rez de pierre ; Échoppe : boutique à vitrine et étal de fruits ; Aubépines : maison blanche à colombages et haie fleurie ; Demeure du Puits : maison de pierre et puits couvert ; Vieux Chêne : vieille maison envahie de mousse, de lierre et de champignons ; Clairières : chalet de rondins à porche ; Oasis : maison de terre au dôme bleu, palmier ; Dunes : tente de nomades rayée et foyer ; Pilotis : maison de roseaux sur pilotis et ponton ; Feuilles Rousses : maison à aile et terrasse, citrouilles ; Cristaux : tour au toit conique violet, lierre et cristaux. Effets rejoués à chaque image : fumée en volutes, fenêtres qui vacillent (silhouette qui passe), enseignes qui se balancent, fanion, feu de camp, feuilles qui tombent, cristaux qui pulsent, clapotis. Images peintes d’avance sur le temps libre du navigateur.
- **Camp de l’Aurore embelli** (`camp-life.js`) : guirlandes de fanions tendues entre les maisons, qui flottent au vent ; jardinières fleuries ; étal du marché à auvent rayé ; panneau d’affichage ; poteau indicateur ; bancs autour de la fontaine ; pétales qui volent au-dessus de la place ; chats et chien qui se promènent (animaux de compagnie, hors de l’enclos). Ces embellissements sont posés seulement s’ils trouvent leur place (`optional`).
- **Centre du camp et ferme** : la fontaine est au centre du camp, sur la place pavée (à la place du feu de camp et de ses rondins) ; la forge a pris l’ancienne place de la fontaine (la vieille place pavée grise a disparu), reliée au centre par une allée. Grange rouge, poulailler et silo sont dessinés avec le moteur des maisons (`CANAAN_BUILDING_ART.farm`) ; les objets du camp sont en aplats francs (sans grain) ; allées du jardin en terre battue et pas japonais.
- **Arbres à la bonne taille** : tous les arbres (feuillus, géants, pins, palmiers, arbres d’automne, tordus, morts, lumineux) sont dessinés deux fois plus grands, en pixels de 2, ancrés par le pied ; ils sont dessinés avec une marge hors de l’écran pour ne pas apparaître d’un coup. Les pommiers du camp sont agrandis d’une fois et demie.
- **Devant / derrière** (`drawCanaanOcclusion`, `world-look.js`) : après les personnages (héros, monstres, habitants, personnages de quête, animaux), chaque objet haut — grand arbre, rocher, cactus, ruine, bâtiment (`CANAAN_HOUSE.occluders`), portail (`CANAAN_PORTAL_ART.occluders`), grange, silo, poulailler, pommier, forge, fontaine, étal… (`canaanCampLife.occluders`) — dont le pied est plus bas que celui d’un personnage qui le chevauche est redessiné par-dessus, seulement autour de ce personnage (découpe) : il passe derrière sans que l’objet recouvre un autre personnage resté devant. Quand c’est un héros qui est caché, l’objet devient à moitié transparent à cet endroit. Les lumières ne sont pas rallumées deux fois.
- **Forêts éclaircies et troncs solides** : à la génération, une bonne part des grands arbres est retirée et ceux qui restent ne se touchent jamais (une case libre entre deux) ; le pied des grands arbres bloque le passage (`canaanTreeBlocked`), on les contourne.
- **Crabes des sables** (`life.js`) : 36 crabes longent les plages de toute l’île en marchant de côté, sur le chemin du rivage (cases de terre au bord de la mer, dans l’ordre du tour de l’île), s’arrêtent, font demi-tour devant un trou dans la plage et détalent quand on approche. Gibier : chair de crabe, recette du crabe farci, page du carnet de chasse.
- **Tortues de mer** (`life.js`) : 32 tortues longent les plages à leur rythme, sur le même chemin du rivage, et font des siestes au soleil (non chassables).
- **Fluidité du sol** : routes et transitions sont peintes à l’avance par tranches de 5 ms au plus, quand le navigateur a du temps libre, avant que leur bloc n’entre à l’écran ; les ponts sont peints une fois par case (seul le reflet bouge) ; l’eau qui défile se pose en une seule copie par case ; les détails animés des rivages lisent un octet précalculé par case, sans créer de chaîne de couleur à chaque image ; les blocs de sol sont calés au pixel près (plus de liseré entre deux blocs).
- **Routes calculées pixel par pixel** (`world-roads.js`, `CANAAN_ROADS`) : en coordonnées du monde, sans couture entre les cases. Les cases de route forment un champ lissé (B-spline) dont la ligne de niveau, bousculée par un bruit fractal, donne des bords organiques ; la pente du champ donne une vraie distance au bord : talus éclairés d’un côté et ombrés de l’autre (lumière en haut à gauche), ombre portée de l’herbe, occlusion, brins qui débordent sur la chaussée. Un champ plus large trace les ornières qui suivent la route. Chaque région a sa chaussée : terre battue des Plaines (ornières, bande d’herbe, cailloux, flaques qui reflètent le ciel), sous-bois moussu, boue et flaques du Marais, feuilles mortes de l’automne, dalles de grès fissurées et ensablées du Désert, dalles d’ardoise aux joints lumineux et runes de la Forêt enchantée, pavés au Camp de l’Aurore, et dalles en anneaux autour du feu de camp et des portails. Les cases sont peintes à la demande (cache de 900 cases) dans les blocs de sol ; sans canevas (tests sans écran), l’ancien rendu des chemins sert.
- **Chemins aux bords naturels, rendu de secours** (`world-look.js`) : l’herbe (ou le sable, la mousse…) mord sur la terre des chemins en vagues douces qui se raccordent d’une case à l’autre ; les angles extérieurs sont arrondis et les angles intérieurs s’arrondissent sur l’herbe, avec une fine ombre au bord. Formes calculées par blocs de 2 pixels et gardées en cache. Les débords dentelés entre terrains voisins sont aussi bien visibles.
- **Eau peu profonde** (`drawWade`, `drawWaterRipples`) : dans les marais, le héros et les monstres ont les jambes immergées, laissent des ronds dans l’eau et éclaboussent en marchant.
- **Arbres** (`pixel-art.js`) : feuillages en grappes de pixels ombrés sur quatre tons, troncs avec écorce et racines, sapins à étages, palmiers à palmes retombantes, arbres tordus à mousse pendante.
- **Menus** (`styles/rpg-theme.css`, chargée en dernier) : bois sombre sculpté, liserés et rivets dorés, titres à empattements, barres de vie et de mana en verre, emplacements de sorts biseautés, boutons en laiton ; même habillage pour l’écran titre, la pause, les fenêtres et les infobulles.
- **Coffres** (`drawCanaanChest`) : coffres cachés en bois cerclé de fer, serrure dorée et mousse, avec un éclat qui passe de temps en temps ; coffre de boss en or et gemme, surmonté d’un rayon de lumière.
- Le héros et le marchand ont le même contour ; le feu de camp, les torches, les refuges, les tours et les arbres lumineux éclairent leurs alentours. Au plus 32 lumières visibles sont calculées par image, avec des halos précalculés.

## Donjons et raids

Chaque instance est une **exploration**, construite par `dungeons.js` (`canaan-dungeons`) à partir de son nom ; le plan est fixe (le même à chaque entrée). Les salles sont posées sur une grille de cases de 30 × 24 tuiles, une salle par case, et reliées seulement entre cases voisines (aucun couloir ne traverse une autre salle) : salle d’entrée, puis une **aile par boss** (une ou deux salles de passage, des salles annexes en impasse), la salle du boss, et derrière des murs fissurés les salles des boss cachés. Un donjon compte 14 à 17 salles et **trois boss**, un raid 24 à 27 salles et **six boss** (le dernier est le boss final de l’instance). Chaque plan est vérifié à la génération (`validPlan`) : chaque énigme est faisable avant sa porte, aucun boss n’est accessible avant d’avoir ouvert la sienne, les salles cachées restent fermées tant que leur mur tient ; `CANAAN_DUNGEON_AUDIT(i)` le résume.

- **Portes scellées** : la porte de chaque boss est tenue par une énigme de son aile, en alternance d’une aile à l’autre (`LOCKS`) : **braseros** éteints à allumer (E) dans les salles de l’aile ; **leviers** à abaisser dans l’ordre gravé sur une **stèle** (« Le Soleil ouvre la marche, l’Étoile le suit… »), un mauvais ordre relève tous les leviers ; **dalles gravées** à fouler dans l’ordre de la stèle, une erreur les éteint ; **gardiens du sceau**, élites à vaincre dans les salles annexes. E devant une porte scellée rappelle ce qu’il faut faire et la progression. Les mécaniques d’un boss ne visent que les héros dans sa salle.
- **Herses** : une herse de fer (ou une barrière magique dans les instances célestes) ferme la sortie de chaque salle de boss et se lève à sa mort.
- **Passages secrets et boss cachés** : un donjon cache un boss, un raid deux, chacun derrière un mur fissuré d’une salle annexe (lézardes et filet de poussière, « [E] Examiner le mur fissuré ») qui s’effondre quand on l’examine. Chaque boss caché vaincu donne une **clé des secrets** à chaque héros du groupe : un objet du sac (touche I), en piles de 20 qui prennent de la place, qui ne se vend pas et peut s’échanger ou se déposer à la banque (gardée dans la sauvegarde ; sac plein : la clé est perdue).
- **Butin** : chaque boss (hors boss cachés) a **30 % de chance** de donner un équipement de l’instance à chaque héros : selon la chance, de 0 à 3 objets par donjon (0 à 6 par raid). Le coffre final donne la bourse d’or (60–100 en donjon, 150–250 en raid) et la grosse récompense d’XP.
- **Coffres secrets de l’île et des Tréfonds** : ils s’ouvrent avec une clé des secrets (consommée) et donnent un équipement **Épique** au niveau de la zone, 200 à 400 or et 25 % de chance d’un Rubis. Sans clé : « 🔒 Clé des secrets requise ».
- **Pixel art** : sols, chemins et murs sont peints comme les bâtiments et les routes de l’île (gros pixels de 3 px, aplats de 3 à 4 tons, joints sombres, reflet en haut à gauche, couronnement des murs cerné d’encre, pied ombré) ; les objets posés au sol sont réduits en gros pixels et cernés d’encre (`pixelProp`, peints une fois) ; leviers, braseros, stèles, dalles, portes scellées et trésors sont dessinés en pixels. La pénombre des instances est adoucie.
- **En ligne** : l’hôte décide (E d’un invité : `dungeon-use`) ; l’état de l’exploration (portes, objets activés, murs découverts, boss cachés) suit l’instantané de la carte.

| Instance | Décor | Monstres | Boss |
| --- | --- | --- | --- |
| La Cave des Terriers Abandonnés | Grotte de terre, racines, flaques souterraines, champignons lumineux, terriers | Osselet, Rat des terriers | Gardien des Os |
| La Mine Oubliée du Mithril | Galeries étayées, rails, wagonnets, veines de mithril, puits | Mineur maudit, Kobold des galeries | Golem de Mithril |
| Le Sanctuaire de l’Éclipse | Temple violet, colonnes, runes dorées, braseros, mosaïque d’éclipse | Acolyte de l’Éclipse, Ombre éclipsée | Oracle de l’Éclipse |
| La Citadelle des Pénitents | Forteresse de pierre, tapis rouge, bannières, chaînes, cages | Pénitent flagellant, Chevalier spectral | Le Grand Inquisiteur |
| La Forge d’Écaille-Ardente | Basalte, coulées de lave, grilles rougeoyantes, enclumes, fourneaux | Diablotin des forges, Dragonnet ardent | Pyrrhax, Wyrm d’Écaille-Ardente |
| La Fosse d’Expiation | Salles rondes, gouffre autour de l’arène, chaînes, pointes, ossements | Âme damnée, Geôlier de la Fosse | Le Bourreau de l’Expiation |
| Le Bastion du Roi Sanglant | Briques pourpres, mares de sang, têtes sur piques, trône | Garde sanglant, Vampire écarlate | Sire Écorcheur, La Comtesse Écarlate, Le Roi Sanglant |
| L’Aiguille du Continuum | Plateformes arcaniques dans le vide étoilé, rouages, sabliers, orrery | Rouage animé, Ombre astrale | Le Gardien des Rouages, La Tisseuse du Temps, Le Dévoreur Stellaire |
| Le Thronos du Séraphin Divin | Marbre et or au-dessus des nuages, statues d’anges, trône doré | Séraphin corrompu, Sentinelle solaire | L’Archonte Radieux, La Sentinelle Auréolée, Le Séraphin Divin |
| Le Jugement de Célestia | Dalles constellées dans le cosmos, piliers de lumière, balance éternelle | Juge céleste, Héraut stellaire | Le Héraut de Célestia, La Balance Éternelle, L’Avatar du Jugement |

Les boss d’instance ont des sprites en grand format, une aura et une barre de vie en haut de l’écran, avec la progression de l’instance (« Boss 2/6 », « Boss caché ») et la difficulté. L’obscurité dépend du thème : torches, braseros, cristaux et lave éclairent les salles, et le héros porte sa propre lumière. Les cases d’instance sont 19 (herse), 20 (sol), 21 (chemin : tapis, rails, runes ou grille) et 22 (danger infranchissable : lave, gouffre, eau, sang, vide ou nuages). Les noms des boss sont dans `instances[].bosses` ; `boss` reste le boss final. `CANAAN_DUNGEON_AUDIT(i)` vérifie qu’une instance est entièrement accessible une fois les herses levées, et qu’aucun boss suivant n’est accessible tant que la première herse est fermée.


**Robustesse des instances** : un monstre de donjon ou de raid a 25 % de PV de plus que dehors et frappe 50 % plus fort ; une élite d’instance a 1,6× les PV d’un monstre (×2,4 dehors). Un boss a 12× (donjon) ou 14× (raid) les PV d’un monstre de son niveau et frappe 1,9× (donjon) ou 2,1× (raid) plus fort : seul, un boss dure environ 45 s. Mécaniques (`boss-mechanics.js`) : onde de choc sous un héros toutes les 7 s (5 s en raid), pluie d’éclats sur chaque héros proche toutes les 13 s (9 s en raid), renforts à 66 % et à 33 % de PV (2 monstres, 3 en raid), rage sous 25 % (+25 % de dégâts, frappes plus rapides). Seuls les héros dans un cercle au moment de l’explosion sont touchés.

**Difficulté selon le nombre de joueurs (phase 6)** : à l’entrée d’un donjon ou d’un raid, le nombre de héros du groupe (1 à 4, compagnons locaux compris) est retenu dans `instance.group`. Les PV des ennemis et des boss et les dégâts des ennemis suivent la même table que l’Arène (`canaanGroupScale()` : PV ×1 / ×1,7 / ×2,4 / ×3,1, dégâts ×1 / ×1 / ×1,05 / ×1,1), en plus de la difficulté choisie. Le monde ouvert ne change pas.
## Arène des Épreuves et Rubis

L’**Arène des Épreuves** (`arena.js`, `canaan-arena`) est un colisée accessible par un portail à l’est du Camp de l’Aurore (`CANAAN_ARENA_PORTAL`). Elle est ouverte à tous : pas de niveau minimum, et une difficulté fixe qui ne s’adapte jamais à l’équipement. Le colisée est dessiné par le moteur des donjons (`dungeons.js`, thème `arene`) : piste de sable, gradins avec un public qui s’anime, braseros, statues, herse et antichambre avec le portail de sortie. Sur l’île, son entrée est une façade de colisée en pixel art, à deux étages d’arcades en grès (`portal-art.js`).

Une tentative enchaîne 12 vagues, avec un boss par vague :

1. Entrée dans l’antichambre, sans niveau minimum. Le compte à rebours de 5 s démarre quand le héros avance sur la piste.
2. Le boss apparaît et la herse se ferme. Chaque attaque majeure est annoncée au sol : une zone (cercle, cône, ligne ou marque) se remplit jusqu’à l’impact.
3. À la mort du boss, ses attaques, projectiles et sols dangereux disparaissent. Le héros reçoit 1 Rubis et récupère 20 % de ses PV et de son mana maximum, sans dépasser le maximum.
4. Pendant 10 s de répit, la herse est ouverte : on peut repartir par le portail de l’antichambre (E) en gardant ses Rubis. Il est impossible d’abandonner pendant un combat.
5. La mort met fin à la tentative en solo (à plusieurs : quand tout le groupe est à terre) ; les Rubis gagnés sont conservés. La tentative suivante recommence à la vague 1.

| Vague | Boss | Mécaniques |
| --- | --- | --- |
| 1 | Gorath, le Gardien de Fer | Charge, frappe circulaire, onde de choc |
| 2 | Fenrath, Croc des Ombres | Bonds rapides, saignement, attaques dans le dos |
| 3 | Tharok, le Colosse de Pierre | Tremblements, rochers ; phase 2 sous 50 % |
| 4 | Morgana, la Sorcière des Brumes | Poison au sol, projectiles, malédiction des soins (−60 %), brume |
| 5 | Valdris, le Chevalier Déchu | Combos d’épée, parade avec contre-attaque, charge |
| 6 | Hydrass, l’Hydre Écarlate | Trois souffles de flammes, crachats de chaque tête |
| 7 | Zephiron, Seigneur des Tempêtes | Éclairs, zones électriques qui poursuivent, rafales, rayons tournants |
| 8 | Kael’Thor, l’Exécuteur Astral | Cônes alternés, marque astrale, exécution sous 45 % de PV, pluie d’étoiles |
| 9 | Ametheon, le Titan de Cristal | Bouclier de cristal à briser (sinon il explose), rayons, éclats ; phase 2 |
| 10 | Ignaroth, le Dragon des Cendres | Souffle, météores, sol brûlant ; phase 2 sous 60 % |
| 11 | Nihil, l’Avatar du Néant | Téléportations, échos qui tirent, spirale d’orbes, flaques du Néant ; phase 2 |
| 12 | Aurelion, le Souverain des Épreuves | Trois phases : l’épée, la magie céleste, puis les deux combinées |

Le boss de référence a 15 000 PV (relevés avec les nouvelles attaques de base et compétences) et un coup de base de 62, multipliés par vague selon le document de conception (PV ×1 à ×5, dégâts ×1 à ×2,5 : `CANAAN_ARENA.hpMult` et `dmgMult`). Leur cadence s’accélère aussi de vague en vague : l’intervalle entre deux attaques est multiplié par `CANAAN_ARENA.tempo(vague)`, de ×1 à ×0,76 à la vague 12 ; les annonces au sol gardent leur durée. Les dégâts directs passent par la défense, la Déviation et les Rubis ; les saignements, brûlures et sols dangereux ne sont réduits que par la Défense. La vague 12 donne en plus un Rubis au choix parmi ceux qui manquent ; si la collection est complète, 2 500 or. Les records sont sauvegardés : meilleure vague, tentatives, arène terminée, dernier boss vaincu.

**Arène à plusieurs (phase 6)** : tout le groupe entre avec l’hôte, et chaque héros compte sa tentative. Le boss s’adapte au nombre de héros dans le colisée à son arrivée (`ARENA_GROUP`, `CANAAN_ARENA.run().group`) :

| Héros | PV du boss | Dégâts du boss |
| --- | --- | --- |
| 1 | ×1 | ×1 |
| 2 | ×1,7 | ×1 |
| 3 | ×2,4 | ×1,05 |
| 4 | ×3,1 | ×1,1 |

- Le boss poursuit le héros le plus proche et lance chaque grande attaque sur un héros choisi au hasard ; une marque suit le héros visé. Les zones (cercles, cônes, lignes, ondes, rayons, sols dangereux, charge, rafale) touchent **chaque** héros qui s’y trouve ; un projectile s’arrête sur le premier touché. Saignements, brûlures et malédiction (soins −60 %) sont propres au héros touché (`CANAAN_ARENA.healFactor(héros)`).
- **À terre** : pas de relève automatique dans l’arène. Un allié debout qui reste 3 s à côté d’un héros à terre le relève à 30 % de ses PV ; un anneau vert au sol montre la progression. L’hôte à terre attend comme les autres : le combat continue tant qu’un héros est debout. Si tout le groupe est à terre, la tentative échoue et tout le monde revient au camp.
- **Récompenses individuelles** : à chaque boss vaincu, chaque héros du colisée reçoit son propre Rubis (sa priorité aux Rubis qui lui manquent) et son record ; les héros debout récupèrent 20 % de leurs PV et de leur mana, ceux à terre se relèvent avec 20 % de leurs PV. À la vague 12, l’hôte choisit son Rubis final ; un allié reçoit un Rubis qui lui manque (ou 2 500 or si sa collection est complète).
- **Invités en ligne** : l’instantané contient une vue de l’arène (`CANAAN_ARENA.view`) : vague, phase, compte à rebours, herse, boss (bouclier, parade, phase), annonces au sol, ondes, sols, projectiles, rayons, éclairs, bandeaux, et pour chaque héros ses effets subis et son Rubis obtenu. L’invité reconstruit le colisée, affiche cette vue (`applyView`) et la fait avancer entre deux instantanés (`advanceView`) ; ses records d’Arène arrivent avec son sac.

**Roulade d’esquive** (Maj ou Espace, bouton ⤳ sur écran tactile, `CANAAN_COMBAT.dodge`) : 128 px dans la direction du déplacement (sinon vers la visée), invulnérable pendant le roulé, recharge de 4 s. Un anneau sous le héros montre la recharge.

Les **Rubis** (`rubis.js`, `canaan-rubis`) sont 48 objets permanents en six familles de huit : offensifs, défensifs, de soutien, d’armes, utilitaires et spéciaux. L’Arène est leur seule source. Chaque boss vaincu donne en priorité un Rubis que le joueur ne possède pas ; un doublon s’ajoute à la collection (×2, ×3…). La fiche du personnage (C) montre sous le héros les six emplacements universels et la collection. Un clic équipe ou retire un Rubis, et une infobulle détaille son effet. Les Rubis se changent hors combat et jamais pendant une tentative ; un même Rubis ne s’équipe qu’une fois. Ils ne donnent pas d’iLvl et n’agissent que s’ils sont équipés.

Les effets s’appliquent aux points d’entrée du combat : `CANAAN_RUBIS.attackBefore` / `attackAfter` (dégâts infligés), `defense` et `beforeHurt` (dégâts reçus, survie aux coups fatals), `stats` (PV, vitesse), `manaCost`, `onCast` (bonus des compétences offensives) et `healFactor` (soins). Les dégâts secondaires (éclair, écho, onde, brûlure, miroir) ne redéclenchent aucun effet : pas de boucle. « Une fois par combat » se réinitialise à chaque vague et après 5 s sans combat. Communion et Âme liée agissent sur des alliés : ils ne s’activeront qu’en coopération.

Dans l’Arène, l’équipement et les Rubis sont verrouillés. La sauvegarde contient la collection (`rubis`) et les records (`arena`).

## Histoire et quêtes : « Les Échos de l’Aurore »

Autrefois, six sanctuaires reliés au Cœur de l’Aurore protégeaient l’île ; les anciens ont dispersé son énergie pour la sauver. Des siècles plus tard, une petite lumière, Lumi, tombe près du Camp de l’Aurore. Données : `shared/data/quests.js` (chapitres, sanctuaires, lieux, PNJ, quêtes et dialogues) ; règles : `shared/rules/quests.js` (XP, disponibilité, état vérifié) ; jeu : `scripts/quests.js`.

- **30 quêtes, 6 chapitres** (un par zone, 2 principales et 3 secondaires chacun), du niveau 1 au niveau 60. L’histoire est facultative : rien n’est nécessaire pour atteindre le niveau 60. Une quête rapporte une part du niveau conseillé (60 % d’un niveau pour une principale, 35 % pour une secondaire), de l’or et sa récompense propre.
- **Journal (touche L, bouton 📜)** : Histoire principale (intro, étoiles du Cœur, carte des sanctuaires, chapitres, prochaine étape à découvrir), Quêtes secondaires, Terminées (récompenses et souvenirs). Une quête peut être **suivie** : un encadré sous la mini-carte donne l’objectif, la direction et la distance (Lumi accompagne le héros en silence, sans bulle de message).
- **PNJ** : un « ! » doré (quête disponible), « ? » (à rendre), « … » (en cours) ; dialogue avec E. Leurs répliques changent selon ta progression (proposition, en cours, à rendre, après). Les principales s’enchaînent dans l’ordre.
- **Chaque quête a sa mécanique** : traces lumineuses (1), énigme de pierres (1), symboles et socles (2), barrières pour guider un mouton (3), ombres de trois arbres (4), remous doré au bon moment (5), pierres musicales et mélodie (6), miroirs et rayon de soleil (7), labyrinthe aux panneaux menteurs (8), empreintes visibles de près (9), point de vue de l’oiseau d’ombre (10), vannes et lanternes (11), reflets dans l’ordre de l’histoire (12), planches selon les poteaux (13), enquête et nom du fantôme (14), nénuphars qui coulent (15) ; feuilles-souvenirs puis objets à porter dans leur maison (16), fragments de fresque et piliers des saisons (17), feuille dorée à attraper quand elle descend (18), engrenages selon l’écart des axes (19), témoignages contradictoires et bonne cachette (20), obélisques à dégager puis à orienter vers l’étoile (21), anneaux couplés de la machine (22), bateau qui glisse d’un rocher à l’autre (23), temple des miroirs (24), portes de l’aqueduc (25), quatre épreuves de mémoire puis l’autel des étoiles (26), défense des six cristaux contre trois vagues d’échos de l’Ombre (27), leviers d’un monde qui se reflète à l’envers (28), perchoirs en escalier pour un jeune dragon (29), constellation à suivre sur les pierres du lac (30).
- **Le monde change** : cristal brisé, mouton au sommet, arbre gardien illuminé, lanternes du marais, pont restauré, village rendu à ses objets, archives ouvertes, moulin qui tourne dans le bon sens, cité des étoiles, machine illuminée, oasis remplie, Braise le dragon qui vole au-dessus de la forêt, Cœur de l’Aurore réveillé ; six sanctuaires (Murmures, Reflets, Saisons, Étoiles, Six Lumières, Chambre de l’Aurore) qui s’ouvrent pour tous (autel, inscription, offrande Épique à la première visite) et se rallument avec leur étoile ; pierre de passage forêt ↔ camp.
- **Récompenses** : Lumi (compagne lumineuse visible par tous, silencieuse), carte des sanctuaires, six étoiles du Cœur, bénédiction des racines d’or, titre « Gardien de l’Aurore » (fiche C) et son aura lumineuse, raccourci, sept décorations de maison (Petit mouton, Le petit voleur, L’oiseau d’ombre, Lueur d’Ilian, Feuille éternelle, Bouteille de vent, Petit dragon ; seul le héros qui les a gagnées peut les poser), recettes « Poisson doré en croûte de sel » et « Tajine de l’oasis », souvenirs dans le journal, équipements Rare à Légendaire au niveau du héros et un bijou Légendaire (lac aux mille étoiles).
- **Style** : tous les objets des lieux (pierres, socles, miroirs, lanternes, engrenages, cristaux, coffres…) sont peints comme ceux des donjons : volumes en trois tons, contour sombre, ombre au sol, flammes et lueurs des torches (CANAAN_TILE_KIT).
- **Solo et coopération** : chacun garde sa progression ; une énigme résolue à plusieurs compte pour chaque héros proche qui l’a en cours (et un mécanisme déjà réglé crédite celui qui y touche). En ligne, l’invité demande `quest-accept`, `quest-turnin`, `quest-act`, `quest-choice` et `quest-track` ; l’hôte vérifie la distance, l’étape et l’objet, et envoie l’état des lieux (`quests`) quand il change.
- **Lieux** : posés après la génération de l’île (`CANAAN_WORLD_TOOLS`), dans leur zone, loin des portails, boss et coffres, sans couper les routes ; une île régénérée les reçoit à l’identique. Socles, haies et nénuphars passent par `canaanQuestWalk` (praticable, bloqué ou règle normale).
- **Sauvegarde** : `quetes` pour chaque héros (hôte et invités), `monde.quetes` pour le monde (voir docs/SAVES.md).

## Les Tréfonds de Canaan (monde souterrain)

`scripts/underground.js` (`CANAAN_UNDER`) : une seconde carte **sous toute l’île**, aux mêmes coordonnées (`game.world.underworld` / `underdecor`, couche `game.world.layer` : `'surface'` ou `'under'`), générée de façon déterministe chez chacun après l’île. Graphismes faits avec les pinceaux des donjons (`CANAAN_TILE_KIT` : sols, parois, objets) ; obscurité, lumières et particules propres à chaque biome.

- **Quatre biomes** en couronne : **Galeries d’Argile** (terre battue, rivières de boue, racines, cabanes et puits de mine abandonnés), **Cité Engloutie de Khaz-Ombral** (rues dallées, maisons et tours naines effondrées, statues, lacs noirs), **Nécropole des Oubliés** (cimetières clôturés, tombes, croix, arbres morts, mausolées, cryptes, brume verte), **Fangeval, le Marais Fongique** (boue, champignons géants luisants, spores, lacs troubles). Tuiles 40 à 49 (43 rivière de boue, 44 paroi, 48 lac, 49 gouffre sont solides) ; ponts de planches sur l’eau.
- **Forteresse de Durgrim** (zone sûre, au centre, sous le massif) : nains des cavernes — le roi Thrain, Borin le marchand, Gimra la banquière, Hilda la forgeronne (la forge sert aux enchantements), Dorn le tavernier (l’âtre sert à cuisiner), gardes, mineurs, ancienne, enfant, et un éclaireur au cœur de chaque biome. Touche E : parler (bulle), commercer, banque. On s’y relève après une chute dans les Tréfonds.
- **Six entrées** à la surface (une par biome de l’île, près de la route ; marquées sur les cartes) : touche E pour descendre ou remonter, tout le groupe ensemble (l’hôte décide).
- **Créatures** : 16 nouvelles (4 par biome, dont insectes : scarabée foreur, mille-pattes, moustique), élites (7 %), au **niveau du héros**. **Boss mondiaux** : Gorgrath (Galeries), le Gardien d’Argent (Cité), Morvane la Reine-Liche (Nécropole), Sporemère (Fangeval), au niveau du groupe, chacun dans son repaire (butin Rare comme les autres boss mondiaux).
- **Faune** chassable (taupe, salamandre, crapaud) et insectes d’ambiance (lucioles, chauves-souris, mouches, spores). **Métiers** : minerais rares (fer noir, quartz, obsidienne, géode : vendus 3 à 5 fois plus cher, pas d’enchantement) et métaux de l’île ; herbes (racine de pierre, lichen, pavot funèbre, champignon luisant) ; poissons des lacs (aveugle, lanterne, murène, silure fangeux) ; dix nouvelles recettes. 16 coffres secrets (objet Commun du niveau du héros).
- **Quatre donjons** (instances 10 à 13, `under` et `scaled`) : la Mine Effondrée de Durgrim, les Halls Engloutis de Khaz-Ombral, la Crypte des Mille Tombes, les Tréfonds Fongiques. **Aucun niveau requis** ; ennemis au niveau du héros le plus fort du groupe (`instance.scaledLevel`) ; coffre : objet **Peu commun**, ou **Rare** une fois sur trois environ (`PRESTIGE_DROPS.underground`), du niveau de chaque héros. On ressort dans les Tréfonds (`returnLayer`).
- **Sauvegarde** : `monde.couche` ; **réseau** : `map.layer` dans l’état de l’hôte, l’invité bascule sur la même carte. Carte M et mini-carte dédiées ; musique et sons de caverne par biome.

## Succès et collections (touche Y)

`scripts/achievements.js` (`CANAAN_ACHIEVEMENTS`) : **cent succès** en cinq catégories de vingt (Combat & armes, Exploration & aventure, Économie & métiers, Magie, Rubis & progression, Défis & Arène), adaptés au jeu à partir d’une liste d’idées : victoires (1 à 10 000, élites, chaque famille d’arme), plus gros coup et critiques, roulades, compétences et sort de classe, Rubis Phénix, boss mondial en moins de 30 s ; distance à pied (une case = 1 m), six régions, coffres secrets, portails, régions trop fortes, chutes, boss mondiaux découverts, quêtes et fin de l’histoire ; or gagné, sac de 100 places, ventes, banque, minage, cueillette, recettes, repas Mythique, collection des poissons, chasse, enchantements, échange ; niveaux 10/30/60, Rubis (collection, six de la même famille), classe et ses cinq talents, quatre classes jouées, objets Légendaire et Mythique, panoplies Épique et Mythique ; Arène (première tentative, vague 6, victoire), Raid 4 Héroïque, boss d’instance précis, Avatar du Jugement en moins de 3 min, donjon seul sans tomber, PV sous 5 % à la mort d’un boss, instance en moins de 5 min, tous les donjons et raids, 1 000 000 de dégâts subis, bestiaire complet, 99 succès, puis **La Légende de Nashi** (tous).

- **Récompenses** (une seule fois) : or, part d’un niveau d’XP, objet Rare ou Épique du niveau du héros (jamais Légendaire ni Mythique : ils restent réservés au Raid 4 Héroïque et à l’Arène), Rubis qui manque, repas ou matériaux dans le sac, et **titres**. Chaque succès vaut des points (5 à 100).
- **Titres** (onglet Titres) : un titre débloqué se choisit et s’affiche entre guillemets au-dessus du personnage, pour tout le groupe ; la Légende de Nashi donne aussi une **aura dorée**.
- **Bestiaire** (onglet Bestiaire) : 170 créatures, avec leur vrai sprite (`canaanActorPortrait`) : les 31 monstres du monde, les 16 créatures des Tréfonds, les 27 créatures des donjons et raids, les 12 boss mondiaux et des Tréfonds, les 72 boss de donjon et de raid (54 boss et 18 boss cachés), les 12 boss de l’Arène. Une créature croisée de près est **découverte** ; vaincue, elle montre le nombre de victoires (et d’élites). Une inconnue reste une silhouette « ??? ».
- **Bandeau doré** à chaque succès débloqué (un récapitulatif quand une ancienne aventure en débloque beaucoup d’un coup : ses victoires, niveaux, quêtes, Rubis, objets et métiers comptent tout de suite).
- **Règles** : l’hôte compte tout (événements `canaanAchieve(hero, type, …)` posés dans les combats, les métiers, les coffres, les ventes, l’échange, et un relevé chaque seconde dans l’étape `achievements` du pipeline). Une victoire sur un boss compte pour tout le groupe de l’instance (ou les héros tout près dehors). Le carnet de chaque héros (`hero.succes` : `done`, `s`, `sets`, `best`, `title`) est vérifié et sauvegardé avec lui (invités compris) ; un invité reçoit le sien dans son message privé (`ach`, au plus toutes les 3 s sauf déblocage), voit les titres des autres (`ttl`, `aur`) et choisit le sien (action `ach-title`).

## Attaques et compétences d’armes

- **Attaques de base** : clic gauche rapide (75 % de la Puissance, toutes les 0,55 s) et clic droit lourd (160 %, toutes les 1,15 s), sans mana. La Puissance magique du bâton est la même que la Puissance d’attaque.
- **Compétences** (`shared/data/equipment.js`, `scripts/weapon-actions.js`) : chacune a dans le catalogue sa recharge, son mana, sa puissance (dégâts totaux sur une cible, en multiple de la Puissance) et une explication. Une compétence fait environ 2 à 3 fois une attaque de base pour la première, 4,5 à 6 fois pour la quatrième ; les postures servent vraiment : Élan offensif (attaques de base 30 % plus rapides, +15 %), Rage du berserker (+25 %, attaques de base comprises), Pas de l’ombre (prochain coup +60 %), Concentration (prochaine compétence offensive +40 %, jamais gaspillée par une attaque de base).
- **Info-bulle** (survol d’une case, `canaanSkillTooltip`) : ce que fait la compétence, les dégâts estimés avec ta Puissance actuelle, recharge et mana, l’empreinte de ta classe et l’état en cours. La case du sort spécial (F) a aussi la sienne.
- **Badges de la barre** (`canaanUpdateSkillBadges`) : une posture affiche ses secondes restantes, un bonus prêt fait briller la compétence qui en profite (Riposte après Parade, Assaut final en combo, Tir puissant après un Repli). Les **charges arcaniques** du bâton (0 à 3) sont affichées sur la Surcharge et par trois pastilles sous le héros ; un invité reçoit ses postures et charges de l’hôte.

- **Armes en main** (`weapon-look.js`, `CANAAN_WEAPON_LOOK`) : chaque héros porte sa vraie arme, dessinée en pixels et tournée vers sa mire, derrière le corps quand il vise vers le haut. Animations d’attaque : taille en arc avec traînée (épée, hache, masse), double taille croisée (épées doubles), estocs alternés (dagues), recul puis estoc (lance), corde tirée avec flèche encochée puis relâchée (arc), coup de bouclier (égide), poussée et éclat de l’orbe (bâton). Le héros regarde sa mire à l’arrêt et pendant une attaque. L’hôte envoie l’arme et la visée de chacun (`wpn`, `aim`) : chaque joueur voit les armes des autres. Il n’y a plus de cercle autour du héros à chaque attaque : seule la direction visée compte.
- **Effets** : la taille balaie le cône réellement touché (croissant lumineux sur un voile léger), les zones s’élargissent en onde, les rayons sont effilés avec un cœur blanc, chaque coup qui porte fait jaillir une étincelle sur la cible. Les flèches volent orientées avec leur empennage ; les sorts du bâton sont des orbes avec un sillage.
- **Icônes** (`skill-icons.js`, `CANAAN_SKILL_ICONS`) : les 36 compétences et les 4 sorts de classe ont chacun leur icône SVG dessinée en code, dans la barre et dans l’info-bulle.
- **Icônes illustrées** (`icon-art.js`, `CANAAN_ICON_ART`, 122 icônes en 32 × 32) : chaque objet a une icône dessinée pour ce qu’il représente : emplacements d’équipement (casque, épaulières, plastron, gantelet, bottes, collier, bague, artéfact), familles d’armes, statistiques, les 48 Rubis (Phénix, Miroir, Éclipse, Vampire…) et leurs six familles, classes et éléments, passifs d’artéfact, difficultés, poissons, viandes, métiers et boutons des menus. Les données y renvoient par un repère `⟦nom⟧` (par exemple `icon: '⟦rubis_phenix⟧'`), remplacé à l’affichage comme les émojis.
- **Taille des textes** (Paramètres → Affichage, 100 % à 160 %, 125 % par défaut) : seules les polices grandissent. Chaque taille de police en pixels des styles passe par `--font-scale` (ainsi que le texte de base et celui des boutons) ; sur le canevas du jeu, les textes dessinés (noms, chiffres, bulles) grandissent aussi. Les panneaux, les barres et la vue du monde gardent leur taille.
- **Sac (I) et personnage (C)** : chaque objet est une petite case carrée (icône, bordure et fond de la couleur de sa qualité, niveau dans le coin) ; les cases remplissent toute la largeur de la fenêtre. Son nom et ses statistiques sont dans l’info-bulle. Sur la fiche, le héros est au centre, entre les deux colonnes d’emplacements.
- **Sac unifié** (`bag.js`, `CANAAN_BAG`) : tout ce qu’on possède est un objet du sac. En plus de l’équipement, les Rubis non équipés, les poissons, les viandes et les repas y sont des piles de 100 au plus par case, et prennent de la place. **Deux sections** (onglets de la touche I) : le **Sac** (équipement, Rubis, repas, enchantements ; `canaanBagUsed`, agrandi chez le marchand) et les **Matériaux** récoltés (minerais, poissons, herbes, viandes ; `CANAAN_BAG.matUsed`, 100 cases de 100, `MAT_LIMIT`), qui ne prennent jamais la place du sac. La boutique et la banque montrent les deux sections. Un clic sur un Rubis l’équipe, sur un repas le mange. Leurs quantités restent rangées où le jeu les utilise (`hero.rubis.owned`, `hero.prof.fish / meat / meals`) : sauvegardes et état des invités inchangés. Section pleine : un poisson est relâché, la viande n’est pas ramassée, le minerai n’est pas récolté (matériaux), la cuisine s’arrête (sac). Une pile se désigne par un repère `genre:id:qualité*nombre` (`fish:gardon:2*30`). La fiche (C) ne montre plus que les six emplacements de Rubis ; le panneau P n’a plus de bourriche ni de gibecière.
- **Banque** (`bank.js`, `CANAAN_BANK`) : 500 places par joueur, chez le Banquier Orvin (échoppe de Lira, Camp de l’Aurore, touche E). Deux fenêtres côte à côte : la banque à gauche, le sac à droite ; un clic dépose un objet ou une pile, un clic sur la banque le reprend (s’il y a la place dans le sac). Équipements et piles (Rubis, poissons, viandes, repas ; 100 par case) sont rangés dans `hero.bank` et sauvegardés avec chaque héros, invités compris ; au chargement, la banque est vérifiée comme le sac. Un invité reçoit sa banque près du banquier (actions `bank-deposit`, `bank-withdraw`).
- **Boutique** (`shop.js`, `CANAAN_SHOP`, touche E près du marchand) : deux fenêtres côte à côte. À gauche, la marchandise : un objet Peu commun du niveau du héros pour chaque emplacement et chaque famille d’arme (16), à choisir ; un objet acheté est remplacé par un autre du même genre, et la marchandise est refaite au changement de niveau. À droite, le sac : un clic vend l’équipement ou la pile (poissons, viandes, repas, Rubis en double). L’hôte garde la marchandise de chaque héros et envoie la sienne à un invité près d’un marchand (actions `shop-buy`, `sell-stack`).
- **Échange entre joueurs** (J) : même principe, l’échange à gauche (ton offre, celle de l’autre, or, validation) et ton sac à droite ; un clic propose un objet ou une pile entière. Si un sac déborde à la conclusion, l’échange est annulé et tout revient comme avant.
- **Icônes de tout le jeu** (`icons.js`, `CANAAN_ICONS`, chargé en premier) : chaque émoji utilisé par le jeu (environ 170 : menus, panneaux, messages, objets, Rubis, quêtes, métiers, carte, textes flottants…) a son icône SVG dessinée en code, dans le même style. Les sources gardent les émojis comme repères ; à l’affichage, un observateur du document les remplace par leur icône (`svg.ico`, plus grande quand elle est seule dans sa case), retire l’émoji des info-bulles natives et des listes déroulantes, et sur le canevas `fillText` dessine l’icône à la place de l’émoji. Les symboles typographiques (✓ ✕ ★ ♪ flèches) restent du texte.

## Classes et talents

Le système des huit voies est remplacé par **quatre classes** (`shared/data/classes.js`, `scripts/class-talents.js`, panneau **T**) : 🌿 Druide (nature, poison, régénération, soutien), 🛡️ Paladin (protection, boucliers, soins, lumière sacrée), 🗡️ Assassin (critiques, saignements, mobilité, exécution) et 🔥 Élémentaliste (feu, glace, foudre, zones).

- **Choix** : à la création de l’aventure (ligne « Classe »). Une aventure d’avant les classes, un invité ou un ancien compagnon en choisit une en arrivant (message et bouton T qui brille ; les compagnons locaux reçoivent une classe au hasard et des talents conseillés). Changer de classe est **gratuit au Camp de l’Aurore** (hors instance) ; les talents sont alors retirés.
- **Talents** : 10 talents exclusifs par classe, un seul rang, surtout passifs ou déclenchés automatiquement. On en équipe **5 au plus** : un emplacement aux niveaux 1, 10, 20, 30 et 40. Les changements sont gratuits, hors combat. Les effets identiques ne se cumulent pas (un seul effet sur la durée par type et par héros, la plus forte valeur ; un seul bouclier, le plus fort ; ralentissements au plus fort ; Aura protectrice non cumulable).
- **Compétences d’armes** : toutes les armes restent utilisables par toutes les classes. Leurs compétences prennent l’**élément de la classe** (couleurs, icône sur la barre, info-bulle) : nature, sacré, ombre, ou feu (1 et 4), glace (2) et foudre (3) pour l’Élémentaliste. Les postures et ruées (Parade, Élan, Rage, Pas de l’ombre, Concentration, Serment) ne comptent pas comme compétences offensives.
- **Empreintes de classe sur les compétences d’armes** (`CANAAN_CLASS_AFTER_CAST`, `CANAAN_CLASS.skillRider` pour le texte de l’info-bulle) : chaque compétence gagne un effet selon la classe.
  - 🌿 Druide : les compétences offensives empoisonnent (25 % des dégâts en plus sur 4 s) ; les utilitaires soignent le héros et ses alliés à 6 cases de 8 % de leurs PV max.
  - ☀️ Paladin : chaque compétence offensive donne un bouclier de 5 % des PV max (4 s) ; chaque utilitaire, un bouclier de 10 % au groupe proche (5 s).
  - 🌑 Assassin : compétences offensives +12 %, et la compétence 4 encore +30 % contre une cible sous 50 % de PV ; une utilitaire renforce la compétence offensive suivante de 25 % (Embuscade).
  - 🔥 Élémentaliste : feu (1 et 4) brûle (30 % des dégâts sur 4 s), glace (2) ralentit de 30 % pendant 2,5 s, foudre (3) rebondit sur 2 ennemis proches (35 %) ; une utilitaire libère une décharge autour du héros (100 % de l’Attaque, 2,5 cases).
- **Passifs de classe** : Sève vitale (Druide : 5 % des dégâts des compétences offensives rendus à lui et aux alliés à moins de 6 cases), Lumière sacrée (Paladin : ses soins sur lui-même soignent aussi les alliés proches à 50 %), Pas de l’ombre (Assassin : +5 % de vitesse, +10 % de dégâts critiques), Maîtrise des éléments (Élémentaliste : voir les empreintes).
- **Sort spécial (touche F)**, une case ronde au bout de la barre de compétences :
  - 🐆 **Forme féline** (Druide, 15 mana, F pour entrer ou sortir) : panthère de la forêt, +15 % de dégâts, +20 % de vitesse, +8 de critique, attaques de base 20 % plus rapides ; en échange, plus de Sève vitale et des soins réduits de 30 %.
  - ✨ **Lumière divine** (Paladin, 25 mana, 45 s) : soigne lui et ses alliés à moins de 6 cases de 20 % de leurs PV max et réduit leurs dégâts reçus de 20 % pendant 6 s.
  - 🌑 **Voile d’ombre** (Assassin, 20 mana, 30 s) : invisible 4 s (les monstres l’ignorent et ne se tournent plus vers lui ; les boss et boss mondiaux le voient encore), +30 % de vitesse ; la compétence offensive suivante fait +40 % et lève le voile.
  - 🌋 **Avatar élémentaire** (Élémentaliste, 30 mana, 60 s) : +20 % de dégâts et compétences 30 % moins chères pendant 10 s.
- **Soins entre héros** : `canaanApplyHeal(n, périodique, cible, soigneur)` ; les bonus de soins effectués viennent du soigneur, ceux reçus de la cible. Soigner un allié déclenche Bénédiction forestière, Gardien divin (boucliers, recharge par allié) et Symbiose.
- **Points d’accroche** : `CANAAN_CLASS_STATS`, `CANAAN_CLASS_ATTACK.before/after` (dégâts réellement infligés dans `after`), `CANAAN_CLASS_DEFENSE` (boucliers), `CANAAN_CLASS_CAST` (élément, compteurs de Consécration, Tempête, Ombre meurtrière), `CANAAN_CLASS_MANA_COST`, `CANAAN_CLASS_ON_DODGE`, `CANAAN_CLASS_ON_CRIT_TAKEN`, `CANAAN_CLASS_FATAL` (Intervention divine), étape `classes` du pipeline et rendu `drawClassEffects`.
- **En ligne** : l’invité demande `class-choose`, `talent-equip`, `talent-unequip` et `class-special` ; l’état public de chaque héros porte sa forme féline, son voile et son bouclier, dessinés chez tous.
- **Sauvegarde** : `classe: {id, talents}` pour l’hôte et chaque invité (vérifiée au chargement), et `resume.classe` pour le menu des aventures. L’ancien champ `ways` est ignoré.

## Refuges des six biomes

Chaque biome a maintenant son refuge, avec l’architecture de sa région et un intérieur peint comme les donjons : Refuge du Vieux Chêne et Refuge des Clairières (Forêt ancienne), **Refuge des Pilotis** (Marais brumeux : cabane sur pilotis, toit de roseaux, eau qui clapote), **Refuge des Feuilles Rousses** (Forêt automnale : bardeaux roux, feuilles mortes, citrouilles), Refuge de l’Oasis et Camp des Dunes (Désert oublié), **Refuge des Cristaux** (Forêt enchantée : pierre lilas, toit violet qui scintille, cristaux lumineux). Chacun a son habitant (pêcheur, villageois, ermite) et un sentier jusqu’à la route.

## Vie du Camp de l’Aurore

`scripts/camp-life.js` donne de la vie autour du feu, dans le style des donjons (volumes en trois tons, contour sombre, grain des décors, ombre au sol, lueurs) :

- **Ferme** au sud : grange rouge à girouette (« Ferme de l’Aurore »), silo, poulailler, cour de terre, charrette de courges, bottes de foin rondes, lanternes le long de l’allée.
- **Enclos** fermé par une barrière : moutons, vaches (noire et blanche, rousse) et cochons avec leur flaque de boue, abreuvoir ; les poules picorent autour du poulailler. Ces bêtes restent chez elles (`life.js`).
- **Champs** bordés de planches, rangs sur des buttes de terre : blé qui ondule au vent avec son épouvantail ; potager (carottes, choux, tomates sur tuteur, courges, salades) ; fruits (fraisiers en fleurs, melons brodés, framboisiers sur treillis, pastèques, myrtilliers). Chaque plante est un sprite en trois tons avec grain et contour, en deux variantes.
- **Verger** de pommiers à l’ouest : pommes au sol, cagettes, panier, tas de bûches.
- **Ruisseau** qui naît d’une source entre les rochers, descend en serpentant (berges de galets, reflets qui suivent le courant, roseaux et massettes), passe sous la route et sous l’allée du verger, puis finit dans une mare à nénuphars où l’on peut pêcher.
- **Fontaine** à jets d’eau sur une place pavée, **tas de bois** abrité et billot avec sa hache, **jardin** fleuri clos d’une palissade blanche (arche de roses, parterres de tulipes, roses, lavande, tournesols, marguerites et bleuets, banc, bain d’oiseaux), fleurs le long des chemins, papillons et libellules.

Le plan est fixe (cases comptées depuis le feu) et posé après les bâtiments et les lieux de quête (`canaanCampLife.place`, appelé aussi par `newRegionWorld`) : un élément qui tomberait sur une maison, un lieu de quête ou un coffre n’est pas posé (`CANAAN_CAMP_LIFE.audit()`). Bâtiments, clôtures, arbres et fontaine bloquent le passage ; les champs et les allées se traversent. Aucun monstre n’apparaît dans la ferme, le verger ni le jardin. Tout est calculé chez chaque joueur à partir de la même île : rien n’est sauvegardé ni envoyé.

**Ponts** (`drawPixelRoads`, `pixel-art.js`) : tous les ponts de l’île sont redessinés. Planches en trois tons posées en travers de la route, avec joints, clous et nœuds ; garde-corps et poteaux sur les bords ; ombre et pilotis dans l’eau qu’on voit dessous, de la couleur de l’eau voisine (mer, marais, lac scintillant) ; seuil plus sombre là où le pont pose sur la terre ferme. Le sens de chaque case est déduit de la forme du pont.

## Difficulté des donjons et des raids

Les instances sont plus exigeantes et rapportent moins d’XP, pour que la campagne et l’exploration gardent leur place :

- **XP** : boss de donjon ×8 et de raid ×12 (au lieu de ×15 et ×25), instance terminée ×12 et ×20 (au lieu de ×30 et ×50) ; les monstres ordinaires d’une instance rapportent 60 % de leur XP.
- **Monstres** : 25 % de PV et 12 % de dégâts en plus que dehors. Boss de donjon : ×2,9 PV et ×1,3 dégâts d’un monstre de leur niveau ; boss de raid : ×3,4 et ×1,22.
- **Mécaniques des boss** (`scripts/boss-mechanics.js`) : **onde de choc** (cercle rouge annoncé 1,6 s sous un héros, gros dégâts à qui reste dedans : rouler en sort), **renforts** (deux monstres de l’instance à 50 % de PV), **pluie d’éclats** en raid (un petit cercle sur chaque héros), **rage** sous 25 % (dégâts ×1,15 et coups plus rapides). Les cercles sont envoyés aux invités.
- Vérifié par les jalons automatiques : un groupe de quatre (niveau 10, Épique) finit la Cave des Terriers en 1 min 40 environ, et un groupe niveau 48 en Mythique, avec ses classes, finit le Bastion du Roi Sanglant en un peu plus de 4 min, en frôlant la mort.

## Niveaux, statistiques, instances et raids

Il n’y a plus d’iLvl ni de Ratings52 : la puissance vient du **niveau du personnage** (1 à 60) et du **niveau et de la qualité de ses équipements**. Règles pures : `shared/rules/stats.js` ; dans le jeu : `stats.js` (statistiques, coups donnés et reçus, info-bulles, fiche C), `progression.js` (XP et niveaux) et `monster-scaling.js` (niveau des monstres).

**Progression du personnage** (`hero.level`, `hero.exp`, sauvegardés) : XP gagnée sur les monstres, les élites (×3), les boss mondiaux, les boss de donjon et de raid, et en terminant un donjon ou un raid (coffre du boss ouvert). Un monstre trop faible pour le héros ne rapporte presque rien. La courbe va très vite au début puis ralentit par tranche de dix niveaux (×1 ; ×1,15 ; ×1,35 ; ×1,6 ; ×1,9 ; ×2,3) : environ 4 monstres de son niveau pour passer le niveau 2, 26 vers le niveau 10, 80 vers 30, 220 vers 59. Chaque montée de niveau rend tous les PV et le mana ; un emplacement de talent s’ouvre aux niveaux 1, 10, 20, 30 et 40. L’affichage tête haute montre le niveau et une barre d’XP. Un objet ne s’équipe qu’à partir de son niveau.

**Équipements** : chaque objet a un niveau fixe (1 à 60) et une qualité. Un équipement classique donne toujours les trois statistiques principales, Attaque, Défense et Vitalité : base = (6 + 2,2 × niveau) × qualité, répartie selon l’emplacement (l’arme favorise l’Attaque, l’armure la Défense, etc.). Il a aussi deux statistiques secondaires différentes, tirées au hasard parmi six à sa création et enregistrées (`item.sec`), chacune de 15 % à 40 % de la base. L’artéfact n’a pas de statistiques, seulement son passif.

| Qualité | Force |
| --- | --- |
| Commun | ×1 |
| Peu commun | ×1,12 |
| Rare | ×1,27 |
| Épique | ×1,45 |
| Légendaire | ×1,87 |
| Mythique | ×2,1 |

Il y a six qualités ; Héroïque et Céleste n’existent plus (un ancien objet Héroïque devient Épique, un Céleste devient Mythique). **Légendaire et Mythique sont des objets de prestige** : jamais tirés au hasard, ils ne tombent qu’au Raid 4 en Héroïque (5 % Légendaire, 1 % Mythique, à la place de l’Épique garanti) et au dernier boss de l’arène (5 % de chances d’un Légendaire à son niveau pour chaque héros, `PRESTIGE_DROPS`, `prestigeRoll`). Dans le sac (I), le personnage (C), la boutique, la banque et l’échange, leur case brille (lueur pulsée orange ou cyan-violet, reflet qui passe) avec une vague colorée dans le fond (`canaanPrestige`, `[data-prestige]` dans `rpg-theme.css` ; immobile si le système demande moins d’animations).

Exemple : une épée légendaire de niveau 45 donne +196 Attaque, +122 Défense, +147 Vitalité et deux secondaires entre +29 et +79.

**Effets réels** (selon le niveau du héros ; il faut 3 + 0,45 × niveau points pour 1 %, sans plafond fixe) :

| Statistique | Effet |
| --- | --- |
| ⚔️ Attaque | Dégâts des attaques et compétences (16 + 2 × niveau + 15 % de l’Attaque) |
| 🛡️ Défense | Réduit les dégâts reçus selon le niveau de l’ennemi : Défense ÷ (Défense + 60 + 22 × niveau de l’ennemi) |
| ❤️ Vitalité | PV maximum (90 + 14 × niveau + 1,6 × Vitalité) |
| 💥 Puissance | +% de tous les dégâts infligés |
| 🎯 Critique | +% de chances de coup critique (5 % de base, critique ×1,5) |
| ⚡ Célérité | Attaques de base plus rapides et recharges plus courtes (rendement dégressif) |
| ✨ Maîtrise | +% des dégâts des compétences offensives |
| 💚 Soin | +% des soins effectués |
| 🔰 Résistance | Réduit les dégâts reçus (rendement dégressif) |

La fiche du personnage (touche C) montre le niveau, la barre d’XP et deux tableaux, statistiques principales et secondaires, en points seulement.

**Monstres** : chacun a un niveau fixe, celui de sa zone, de son instance ou de son boss. Ses PV (150 + 42 × niveau, selon son espèce, ×2,4 pour une élite) et ses dégâts (6 + 1,5 × niveau) en découlent. Les boss ont ×2,6 PV et ×1,25 dégâts (donjon), ×3,4 et ×1,4 (raid) ou ×4 et ×1,5 (boss mondial). Frapper un monstre plus fort que soi réduit les dégâts de 5 % par niveau d’écart (jusqu’à −50 %).

| Zone | Niveaux des monstres | Boss mondiaux |
| --- | --- | --- |
| 1. Plaines verdoyantes | 1–10 | Fenrir (10) |
| 2. Forêt ancienne | 10–20 | Nocturne (20) |
| 3. Marais brumeux | 20–30 | Léviathan (30) |
| 4. Forêt automnale | 30–40 | Golem des Étoiles (36), Colosse (40) |
| 5. Désert oublié | 40–50 | Ifrit (45), Séraphin Déchu (50) |
| 6. Forêt enchantée | 50–60 | Chronos (60) |

Chaque instance déclare son niveau requis (`level`), le niveau de ses ennemis (`mobLevel` ; ses boss sont un niveau au-dessus, deux en raid) et sa récompense garantie (`rarity`, `dropLevel`) : le coffre du boss donne toujours cet objet à chaque héros, sauf si son sac est plein. Son niveau est tiré entre le niveau requis et le niveau de butin (Cave : 7 à 10), pour pouvoir porter tout de suite ce qu’on y gagne. Sources : mobs et coffres secrets Commun, marchand Peu commun, boss mondiaux et donjons Rare, raids Épique.

| Instance | Zone | Niveau requis | Ennemis | Récompense |
| --- | --- | --- | --- | --- |
| La Cave des Terriers Abandonnés | Plaines | 7 | 9 | Rare 7–10 |
| La Mine Oubliée du Mithril | Forêt ancienne | 13 | 15 | Rare 13–16 |
| Le Sanctuaire de l’Éclipse | Forêt ancienne | 18 | 20 | Rare 18–21 |
| La Citadelle des Pénitents | Marais | 25 | 27 | Rare 25–28 |
| La Forge d’Écaille-Ardente | Automne | 32 | 34 | Rare 32–35 |
| La Fosse d’Expiation | Automne | 37 | 39 | Rare 37–40 |
| Raid : Le Bastion du Roi Sanglant | Désert | 44 | 46 | Épique 44–47 |
| Raid : L’Aiguille du Continuum | Désert | 49 | 51 | Épique 49–52 |
| Raid : Le Thronos du Séraphin Divin | Forêt enchantée | 54 | 56 | Épique 54–57 |
| Raid : Le Jugement de Célestia — Normal | Forêt enchantée | 58 | 60 | Épique 58–60 |
| Raid : Le Jugement de Célestia — Héroïque | Forêt enchantée | 60 | 60 | Épique 60 (5 % Légendaire, 1 % Mythique) |

**Anciennes aventures** : au chargement, l’iLvl de chaque objet devient un niveau (iLvl × 60 ÷ 190), ses anciens points Ratings52 disparaissent et deux secondaires sont tirées. Le héros commence au niveau de sa meilleure pièce portée, pour garder son équipement.

Le raid 4, **Le Jugement de Célestia**, déclare plutôt des `difficulties` choisies au portail ; en Héroïque, ses ennemis ont ×1,65 PV et ×1,40 dégâts. La difficulté jouée est gardée dans `instanceState.difficulty` et lue par `instanceDifficulty()`. Chaque instance déclare aussi son biome (`biome`) ; sa position est fixée par la génération de l’île.

Hors instance, les récompenses sont décrites une seule fois dans `SOURCE_REWARDS` (`shared/data/economy.js`) : un objet garanti ; sac plein, l’objet est converti en or. Les ennemis ordinaires des donjons et raids (ligne « Mob d’instance ») ne donnent rien, pour ne pas remplir le sac : l’équipement d’une instance vient du coffre du boss.

| Source | Objet garanti | En plus |
| --- | --- | --- |
| Mob normal | Commun, au niveau du monstre (Peu commun une fois sur sept avec le Rubis Prospecteur) | — |
| Mob élite | Commun, au niveau du monstre | — |
| Mob d’instance | Aucun | — |
| Boss mondial | Rare, au niveau du boss | 1000–1500 or |
| Coffre secret (une clé des secrets) | Épique, au niveau de sa zone (milieu de la plage) ; 25 % de chance d’un Rubis | 200–400 or |
| Boss d’instance | 30 % de chance d’un équipement de l’instance, pour chaque héros (boss cachés : une clé des secrets chacun) | — |
| Coffre de fin d’instance | — | 60–100 or (donjon), 150–250 or (raid), pour chaque héros |

## Fréquence d’affichage

La simulation avance toujours à 60 ticks par seconde (`CANAAN_TICK_MS`, `game-core.js`) : mouvements, recharges, IA et dégâts sont identiques sur tous les écrans. L’affichage suit `requestAnimationFrame`, donc la fréquence de l’écran avec la synchronisation verticale (60, 144 Hz ou plus). Pour chaque image, `canaanDrawInterpolated` place le héros, les monstres, les projectiles et la caméra entre les deux derniers ticks, puis leur rend leur vraie position. Un déplacement de plus de 96 px en un tick (téléportation, entrée d’instance) n’est pas interpolé. En pause, l’image montre les positions réelles.

La vitesse de base du héros est `CANAAN_PLAYER_SPEED` : 4,1 px par tick, soit 246 px/s (+20 % depuis la 1.9.0), modulée par la statistique de vitesse. Le mana maximum de base est `CANAAN_BASE_MANA` : 300 depuis la 1.9.0 (60 avant), avant les bonus de talents ; la régénération est définie par `CANAAN_REGEN` et calculée par `canaanRegenRates()` :

| Ressource | Hors combat | En combat |
| --- | --- | --- |
| PV | 2 + 1 % des PV max par seconde | 25 % de la régénération hors combat |
| Mana | 6 par seconde | 3 par seconde |

Le héros est en combat pendant 5 secondes après chaque coup donné ou reçu, et pendant tout combat de l’Arène.

## Pas d’artisanat : la puissance vient du butin

Il n’y a plus de forge : un équipement garde toute sa vie les statistiques de son drop. Pas d’amélioration +1 à +5, pas de points ajoutés, pas de passif d’arme. Pour devenir plus fort, il faut trouver mieux sur les monstres, les boss mondiaux, les donjons et les raids. La touche K et le bouton ⚒️ ont disparu, de même que les matériaux (minerai ancien, bois runique, essence magique, noyau astral).

Le Rubis **Prospecteur** (🔍) suit cette direction : un monstre ordinaire a 15 % de chances de lâcher un objet Peu commun au lieu d’un Commun (`CANAAN_RUBIS.betterDrop`).

Anciennes sauvegardes, au chargement :
- les améliorations (`item.upgrade`) et passifs de forge (`item.craftPassive`) sont retirés par `CANAAN_GEAR.normalize` ;
- les matériaux en stock sont rendus en or, une seule fois, à l’hôte comme aux invités enregistrés : 10 or par minerai ou bois, 50 par essence, 200 par noyau (`LEGACY_MATERIAL_GOLD`, `legacyMaterialGold`). Un message dans le chat indique la somme. La sauvegarde suivante ne contient plus de matériaux.

Le contrat d’installation et la liste des propriétaires sont décrits dans [docs/INITIALIZATION.md](docs/INITIALIZATION.md). Les tests utilisent un DOM et un Canvas simulés ; le rendu visuel doit aussi être contrôlé dans le navigateur.

La version actuelle est **1.9.0**. La sauvegarde est au schéma 10 (un fichier par aventure : monde, héros de l’hôte, héros invités).

Les tests automatiques se trouvent dans [tests/canaan-regressions.cjs](tests/canaan-regressions.cjs) : sauvegardes, combat, équipement, talents, modules obligatoires et commandes tactiles. Ils se lancent avec `node tests/canaan-regressions.cjs`.

**Attaque de base** (`canaanBasicAttack`, `weapon-actions.js`) : elle ne coûte jamais de mana, pour pouvoir toujours se battre. Clic gauche : attaque rapide (40 % de puissance, toutes les 0,6 s). Clic droit : attaque lourde (90 %, toutes les 1,4 s, portée et angle plus grands). Maintenir un bouton enchaîne les attaques ; les deux partagent le même verrou. La forme suit l’arme : arc devant le héros pour les armes de mêlée, estoc en ligne pour la lance, flèche pour l’arc, projectile magique pour le bâton. Le clic ne lance plus la compétence 1.

Sur écran tactile, les flèches permettent de se déplacer ; ⚔ donne une attaque de base rapide ; les boutons 1–4 lancent les compétences en visant le monstre vivant le plus proche. E sert à interagir, Q à changer d’arme et ⤳ à faire une roulade. Plusieurs doigts peuvent maintenir des directions simultanément.

Les scripts et les feuilles de style sont formatés avec Prettier selon `.prettierrc.json`. Prettier n’est pas une dépendance du jeu ; pour reformater après une modification :

```sh
npx prettier@3.3.3 --write "src/canaan/scripts/*.js" "src/canaan/styles/*.css"
```

Pour lancer toutes les vérifications sans modifier le jeu :

```sh
python3 tools/check_canaan.py
```

Le format de sauvegarde et les copies de secours sont décrits dans [docs/SAVES.md](docs/SAVES.md). Les survols utilisent des événements délégués, sans attributs d’événement dans le HTML.

Un bouton déclare son action par son nom seul, par exemple `data-action="setWeaponPassive"`. Ses arguments sont des attributs nommés, comme `data-passive="bleed"`. La table `CANAAN_ACTIONS` de `src/canaan/scripts/controls.js` liste les actions autorisées et valide leurs arguments avant tout effet. Le CSS se trouve uniquement dans `src/canaan/styles/` ; le JavaScript n’injecte pas de feuille de style. Le balisage n’a pas de style en ligne. Le HTML généré n’en garde que pour des valeurs calculées, comme la couleur d’une rareté ou la largeur d’une barre de progression.
