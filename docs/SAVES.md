# Sauvegardes

Le schéma courant est **10**. Le format (schéma, validation, aventure neuve, résumé, importation du schéma 9) est défini une seule fois dans `src/canaan/shared/save/schema.js`, utilisé par le jeu (`canaan-persistence`) et par l’application de bureau (`app/saves.js`).

## Trois aventures

Chaque installation a trois slots d’aventure. Un slot contient le monde de l’aventure et tous les héros qui y ont joué : celui de l’hôte et, plus tard, ceux des invités.

| Où | Slots | Copies de secours |
| --- | --- | --- |
| Application de bureau | `saves/slot-1.json` à `slot-3.json` dans le dossier de données (`~/.config/The Legend of Nashi` sous Linux (les sauvegardes de l’ancien dossier `Canaan Online` y sont copiées au premier lancement)) | `saves/backups/` |
| Build HTML de test | clés `canaan_slot_1` à `canaan_slot_3` du stockage local | clés `<clé>_backup_<horodatage>` |

Le menu de l’écran titre (`canaan-slot-menu`) propose Continuer, Nouvelle aventure (avec un nom, 32 caractères au plus) ou Supprimer. Un slot occupé n’est jamais remplacé par une nouvelle aventure : il faut d’abord le supprimer. La suppression demande une confirmation qui liste les pseudos des invités dont le héros sera perdu, et garde toujours une copie `suppression` dans les copies de secours.

Ouvrir une aventure recharge la page : le slot choisi est retenu dans le stockage de session (`canaan_pending_slot`), puis le démarrage le charge et lance la partie. « Retour au titre » sauvegarde puis recharge la page. Ainsi, aucune donnée d’une aventure ne reste en mémoire dans une autre.

## Format

```json
{
  "schema": 10,
  "version": "0.9.8",
  "nom": "Aventure de Haruna",
  "created": 1794083453133,
  "updated": 1794104975791,
  "resume": { "ilvl": 121, "gold": 121914 },
  "monde": { "openedChests": [], "worldBossTimers": {}, "quetes": { "flags": { "bridge": true }, "solved": { "q13": true } } },
  "heros": {
    "hote": { "player": {}, "kills": 0, "inventory": [], "equipment": {}, "materials": {}, "bagLevel": 0, "classe": { "id": "druide", "talents": [] }, "quetes": { "active": {}, "done": {}, "flags": {}, "deco": [], "choices": {}, "track": null }, "rubis": {}, "arena": {} },
    "invites": {}
  }
}
```

Les champs du héros reprennent ceux du schéma 9. `resume` sert uniquement au menu (niveau du héros et or ; une ancienne aventure qui n’a que l’iLvl moyen voit celui-ci converti en niveau). Le héros porte aussi son niveau (`level`, 1 à 60) et son XP (`exp`) ; chaque objet son niveau (`level`) et ses deux statistiques secondaires (`sec`).

Quêtes (« Les Échos de l’Aurore ») : chaque héros garde sa progression dans `quetes` : quêtes actives (`active[id] = { step, got }`, étape et objets trouvés), terminées (`done[id]`, date), drapeaux d’histoire (`flags` : Lumi, carte des sanctuaires, étoiles, bénédiction, raccourci, sanctuaires visités…), décorations gagnées (`deco`), choix narratifs (`choices`) et quête suivie (`track`). Le monde garde `monde.quetes` : changements visibles par tous (`flags` : pont restauré, lanternes, sanctuaires ouverts, raccourci) et énigmes résolues (`solved`). Tout est vérifié au chargement (`sanitizeQuests`) ; une quête ou un drapeau inconnu est retiré.

`heros.invites` contient les héros invités, par identifiant (6 au plus) : `pseudo`, `local` (compagnon local), `color`, puis les mêmes champs qu’un héros (`player`, `kills`, `inventory`, `equipment`, `materials`, `bagLevel`, `classe`, `quetes`, `rubis`, `arena`). Au chargement, chaque entrée est vérifiée comme le héros de l’hôte (objets invalides retirés, nombres positifs) ; une entrée abîmée est ignorée sans bloquer l’aventure.

## Écriture sûre et copies

Dans l’application, `app/saves.js` écrit chaque slot dans un fichier temporaire, le synchronise sur le disque, puis le renomme : une coupure laisse l’ancien ou le nouveau fichier, jamais un fichier à moitié écrit. L’écriture refuse un slot inconnu, un contenu qui n’est pas du JSON au schéma 10, ou plus de 8 Mo.

Les copies de secours sont relues après écriture pour être vérifiées :

- `session` : une au lancement de chaque aventure ; les 5 plus récentes par slot sont gardées.
- `suppression` : avant de supprimer un slot.
- `illisible` : avant « Repartir à neuf » sur une sauvegarde illisible.
- `import-navigateur-…-schema9` : l’ancienne partie importée.

Seules les copies `session` sont effacées automatiquement.

Le jeu n’accède aux fichiers que par le pont `canaanDesktop` (`app/preload.js`) : lire, écrire, copier et supprimer un slot, et ouvrir le dossier. `app/main.js` n’accepte ces messages que de la page du jeu, dans la fenêtre principale.

La sauvegarde est automatique toutes les 45 secondes en jeu, après les événements importants (butin, boss…), à la pause, au retour au titre et à la fermeture de la fenêtre.

## Sauvegarde illisible

Une sauvegarde d’un autre schéma ou abîmée n’est jamais écrasée. Le menu la signale ; l’ouvrir bloque la sauvegarde automatique et affiche « Repartir à neuf », qui copie d’abord la source, puis crée une aventure neuve dans ce slot.

## Importation de l’ancienne partie

L’ancienne sauvegarde unique du navigateur (clé `canaan_dev_18999_state`, schéma 9) est importée une seule fois dans le slot 1, et seulement si aucun slot n’existe. La source est d’abord archivée, le slot est écrit et relu, puis l’ancienne clé est retirée. Une source abîmée n’est ni importée ni retirée.

## Changer de format

Pour une future version : augmenter `CANAAN_SAVE_SCHEMA` et `SAVE_SCHEMA`, puis ajouter au chargement une conversion du schéma précédent, en gardant une copie avant d’écrire. Tester avec `npm run check`.
