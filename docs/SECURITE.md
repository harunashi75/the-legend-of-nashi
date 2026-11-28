# Sécurité du coopératif

Audit du jeu en ligne de The Legend of Nashi (novembre 2026, version 0.12.3) : relais, transports, protocole, code
réseau du jeu et application de bureau. Ce document dit ce qui protège quoi, ce qui a été corrigé, et ce qui reste à
savoir. Les tests correspondants sont dans `tests/network-security.test.cjs`.

## Ce qui est en jeu

Le coopératif est hébergé par un joueur. Son jeu simule le monde et garde la sauvegarde, héros des invités compris.
Les invités envoient seulement des intentions (se déplacer, attaquer) et des demandes (équiper, vendre, échanger…), et
affichent ce que l'hôte leur renvoie. Le relais (`online/relay.cjs`) ne fait que mettre en relation un hôte et ses
invités par un code de salon. Il tourne chez l'hôte, sur son réseau local ou sur son adresse Tailscale.

| Qui | Peut tenter | Ce qui doit tenir |
| --- | --- | --- |
| Un invité tricheur | Envoyer n'importe quel message à l'hôte | L'hôte ne lui donne rien qu'il n'a pas gagné ; la partie de l'hôte ne plante pas |
| Un invité qui en vise un autre | Reprendre le héros d'un autre invité | Un héros n'est repris que par son joueur |
| Un hôte malveillant | Envoyer n'importe quel état à ses invités | Le jeu de l'invité ne plante pas et n'exécute rien de ce qu'on lui envoie |
| N'importe qui sur le réseau | Se connecter au relais | Le relais ne s'arrête pas, ne se laisse pas saturer, et les codes ne se devinent pas |

Un hôte fait autorité dans sa partie : il peut modifier sa sauvegarde, donc aussi les héros de ses invités. C'est
inhérent au modèle hébergé par un joueur. On ne protège pas un invité contre un hôte qui triche dans sa propre partie,
seulement contre ce qui toucherait son jeu à lui.

## Ce qui était déjà solide

- **Autorité de l'hôte.** Toute intention passe par `sanitizeIntent` : direction unitaire, compétence 0 à 3, point visé
  borné. Toute demande passe par `sanitizeAction`, une liste fermée d'opérations aux paramètres typés, puis par le
  système concerné, qui vérifie la distance, l'or, la possession, le niveau… L'invité n'envoie jamais d'or, de
  statistiques ni d'objets. Les dégâts, le butin et l'expérience sont calculés chez l'hôte.
- **Relais.** Taille des messages limitée (64 Ko) et fréquence aussi (60 messages par seconde pour un invité, 240 pour
  l'hôte, fermeture au-delà du triple). Les invités ne parlent qu'à l'hôte, avec une identité de connexion attribuée
  par le relais, et leurs types de messages sont filtrés (`GUEST_TYPES`). Un ping toutes les 30 s détecte les connexions
  mortes.
- **Affichage.** Le chat et les notifications sont posés en texte (`textContent`). Le point de passage commun des textes
  (`client/icons/icons.js`) échappe `& < >` avant de remplacer les émojis par des icônes. Les pseudos sont nettoyés
  (`cleanPseudo` : sans chevrons, 24 caractères) et le chat est coupé à 200 caractères.
- **Application de bureau.** La page tourne avec `contextIsolation`, `sandbox`, sans Node. Aucune navigation ni
  nouvelle fenêtre n'est permise, et toute autorisation (caméra, micro…) est refusée. Chaque appel IPC vérifie qu'il
  vient de la fenêtre du jeu. Les numéros de slots et les noms de copies de secours sont validés avant tout accès disque.
- **Transports.** Avec Tailscale, le relais n'écoute que sur l'adresse Tailscale (invisible d'Internet et du réseau
  local). Les commandes système (`systemctl`, `tailscale`) sont en lecture seule, sans shell et avec délai.
- **Taille réelle des messages.** L'instantané d'un raid (54 monstres) fait environ 18 Ko, le message privé d'un invité
  au sac plein environ 10 Ko : bien sous la limite de 64 Ko.

## Failles trouvées et corrigées

| Gravité | Faille | Correction |
| --- | --- | --- |
| Élevée | **Un seul message de plus de 64 Ko arrêtait le relais**, donc le salon de tout le monde : l'erreur levée par `ws` sur la connexion n'avait pas d'écouteur. | Chaque connexion écoute ses erreurs et seule la fautive est fermée ; le serveur note les siennes sans s'arrêter. |
| Élevée | **Usurpation d'un héros d'invité.** L'hôte rattachait un arrivant au héros portant son identifiant, et éjectait l'ancienne connexion. Or ces identifiants partent dans l'état envoyé à tous : un invité pouvait reprendre le héros d'un autre et vider son sac par un échange. | Chaque invité a une clé secrète (`makeGuestKey`, hasard cryptographique), gardée chez lui et envoyée seulement à l'hôte. L'hôte l'enregistre avec le héros et l'exige ensuite, en vérifiant avant d'éjecter quiconque. Un héros sauvegardé avant les clés reçoit celle de sa prochaine venue. |
| Moyenne | **Pollution de prototype.** Une clé `"__proto__"` dans un message devenait le prototype de l'objet où un système la recopiait (`Object.assign`), par exemple un monstre chez l'invité. | `parseMessage` retire les clés `__proto__` à tous les niveaux, dès la lecture (relais, hôte, invité). |
| Moyenne | **Un hôte pouvait faire planter le jeu de l'invité** : une entrée invalide dans le sac faisait planter la boutique et la banque ; des positions non numériques envoyaient la caméra en `NaN`. | Tout objet reçu passe par `isGearItem` (`shared/rules/items.js`, la règle des sauvegardes, désormais unique). Sac, équipement, boutique et banque ne gardent que des objets bien formés. Héros, monstres, butins et projectiles sans position numérique sont ignorés. |
| Faible | **Relais saturable**, codes de salon devinables en série. | 32 connexions au plus, 10 s pour se présenter (hôte ou invité), 5 codes faux par connexion. |
| Défense en profondeur | **Aucune politique de sécurité du contenu.** Un texte inséré sans échappement aurait pu exécuter du script. | `npm run build` pose une CSP : seuls les scripts assemblés s'exécutent (empreinte SHA-256 de chacun), sans `unsafe-inline` ni `unsafe-eval` ; rien n'est chargé du dehors ; réseau limité aux WebSockets. Vérifié dans Electron : le jeu, le relais et le salon fonctionnent ; une image piégée (`onerror`) est bloquée. |

Aucune injection de HTML n'a été trouvée. Un hôte factice envoie une balise piégée dans chaque texte possible (noms,
objets, titres, échange, boutique, banque, quêtes), puis les fenêtres sont ouvertes : rien n'arrive non échappé dans le
DOM. La CSP garantit en plus qu'une omission future ne pourrait pas exécuter de script.

## Risques qui restent

- **Trafic en clair sur le réseau local.** Le relais local parle en `ws://` : sur le Wi-Fi de la maison, le chat et les
  positions circulent en clair. Tailscale chiffre tout (WireGuard). Un relais ouvert sur Internet (`npm run relay`)
  devrait passer derrière un proxy en `wss://`.
- **Pas de confirmation d'arrivée.** Quiconque a le code et la même version du jeu rejoint sans que l'hôte valide. Le
  code (31⁶ possibilités) et les limites du relais rendent la devinette impraticable. Une confirmation dans le panneau
  Groupe serait l'étape suivante si des salons devaient être partagés largement.
- **Origine des connexions non vérifiée.** Une page web ouverte sur le PC de l'hôte peut se connecter à
  `ws://localhost:8787`. Sans code, elle ne fait rien ; les limites ci-dessus l'empêchent de saturer le relais. Le jeu
  peut s'ouvrir depuis un fichier local comme depuis un serveur : l'origine n'est donc pas filtrée.
- **Styles en ligne permis** (`style-src 'unsafe-inline'`) : les fenêtres utilisent des attributs `style`. Sans effet
  sur le code, mais un texte injecté pourrait changer l'apparence de la page.
- **Le message `join` d'un invité arrive tel quel chez l'hôte** (64 Ko au plus). L'hôte en vérifie chaque champ
  (version, contenu, identifiant, clé, pseudo, apparence).

## Tests

`node --test tests/network-security.test.cjs` (lancés par `npm test` et `npm run check`) :

- **Protocole** : clés `__proto__` retirées, messages illisibles refusés, objets reçus vérifiés.
- **Relais** : binaire, JSON illisible, type inconnu, message démesuré, inondation, codes faux en série, connexion
  muette, relais plein, invité qui se fait passer pour l'hôte, départ de l'hôte.
- **Invité malveillant** : arrivées piégées, intentions absurdes (déplacement borné par la vitesse), toutes les actions
  avec des paramètres piégés, triches ciblées. Exemples : vendre ou équiper l'objet de l'hôte, acheter sans or, ouvrir
  un coffre à distance, agrandir le sac, équiper un talent hors niveau, échanger ce qu'on n'a pas. Aucune exception,
  rien de gagné, chat coupé et affiché en texte.
- **Hôte malveillant** : messages tordus dans chaque champ, aucune exception, positions toujours finies, aucune
  pollution, sac filtré, fenêtres ouvertes sans plantage, aucun HTML injecté.
- **Usurpation** : la clé n'est jamais rediffusée, un imposteur est refusé sans éjecter le vrai joueur, la clé est
  gardée dans la sauvegarde.
- **Déconnexions** : l'invité perd l'hôte, l'hôte perd le relais ; chacun retombe en état cohérent.
- **CSP** : chaque script du HTML a son empreinte, et aucune autre n'est autorisée ; aucune source extérieure.
