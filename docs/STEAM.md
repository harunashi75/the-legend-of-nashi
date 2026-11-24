# Steam : mise en place

Ce que le jeu fait déjà, et ce qu’il reste à régler sur le site [Steamworks](https://partner.steamgames.com) une fois l’application Steam créée (frais d’entrée payés, App ID attribué).

## Dans le jeu

- **Succès** : les 100 succès du jeu sont reportés sur le compte Steam du joueur dès qu’il les débloque, ceux d’une ancienne aventure compris (`app/steam.js`, `steamworks.js`). Chaque succès du jeu a un nom d’API `ACH_` + son identifiant (`c1` → `ACH_C1`). En coopératif, l’invité reçoit aussi les siens.
- **Sans Steam** (navigateur, itch.io, `npm start`, client Steam fermé), le jeu tourne normalement : Steam n’est utilisé que si le jeu est lancé par Steam, qui fournit son App ID au lancement. Aucun fichier `steam_appid.txt` n’est nécessaire.
- **Superposition Steam** (Maj+Tab) activée quand le jeu est lancé par Steam. En cas de souci d’affichage, la variable `NASHI_STEAM_OVERLAY=0` la coupe (options de lancement Steam : `NASHI_STEAM_OVERLAY=0 %command%`).
- **Linux (Ubuntu 24.04 et suivantes)** : ces systèmes interdisent le bac à sable de Chromium aux applications sans profil AppArmor ; le script de lancement `legend-of-nashi` (créé par `tools/after_pack.cjs`) le détecte et démarre alors le jeu (`legend-of-nashi.bin`) avec `--no-sandbox`. Ailleurs (SteamOS, Arch, Fedora…), le bac à sable reste actif. `NASHI_NO_SANDBOX=1 %command%` le coupe de force si un autre système refusait de démarrer.
- **Manette** : prise en charge native (disposition standard) ; Steam Input peut rester sur « disposition par défaut ».

## Sur le site Steamworks

### 1. Succès (Stats & Achievements)

`steam/achievements.csv` contient les 100 succès : nom d’API, titre, description. Les icônes (256 × 256, obtenue et non obtenue) se produisent avec :

```sh
npm run build
node tools/steam_achievements.cjs --icons     # steam/icons/ACH_C1.png, ACH_C1_locked.png…
```

Pour chaque ligne : *New Achievement*, recopier le nom d’API (exactement, `ACH_C1`), le titre et la description (langue : français), téléverser les deux icônes, puis **Publish** les changements. Un succès absent sur Steam est simplement ignoré par le jeu ; un succès ajouté plus tard est envoyé au lancement suivant.

### 2. Steam Cloud (Auto-Cloud)

Les sauvegardes sont des fichiers ; Steam les synchronise sans code. *Application → Steam Cloud* :

- **Byte quota** : 100 Mo · **Number of files** : 50.
- **Auto-Cloud**, chemin racine (*Root Paths*) :

  | Root | Subdirectory | Pattern | OS | Recursive |
  |---|---|---|---|---|
  | `WinAppDataRoaming` | `The Legend of Nashi/saves` | `slot-*.json` | Windows | non |

- **Root Overrides** (même sauvegarde sous Linux et Steam Deck) :

  | Original Root | OS | New Root | Add/Replace Path |
  |---|---|---|---|
  | `WinAppDataRoaming` | Linux | `LinuxXdgConfigHome` | *(vide)* |

Seules les huit aventures (`slot-1.json` à `slot-8.json`) voyagent : les copies de secours (`saves/backups/`) et les réglages d’affichage restent propres à chaque appareil.

### 3. Dépôts et lancement (SteamPipe)

- Construire : `npm run dist:win` et `npm run dist:linux` (ou télécharger les fichiers de la release GitHub).
- **Dépôt Windows** : le contenu de `Legend-of-Nashi-<version>-win-x64.zip` (ou `dist/win-unpacked/`). **Dépôt Linux** : le contenu de `Legend-of-Nashi-<version>-linux-x64.tar.gz` (ou `dist/linux-unpacked/`).
- **Options de lancement** : Windows `The Legend of Nashi.exe` ; Linux `legend-of-nashi`.
- Steam Deck : le dépôt Linux tourne nativement ; la version Windows passe aussi par Proton.

## Essayer sans App ID

Avec le client Steam ouvert, `NASHI_STEAM_APPID=480 npm start` lance le jeu comme **Spacewar** (le jeu de test de Valve) : le jeu se connecte et le profil Steam affiche « En jeu : Spacewar ». Les succès du jeu n’existent pas dans Spacewar : ils restent en attente, sans erreur. Une fois l’App ID réel attribué et les succès publiés, `NASHI_STEAM_APPID=<App ID> npm start` permet de les essayer (ils se réinitialisent depuis le site Steamworks).
