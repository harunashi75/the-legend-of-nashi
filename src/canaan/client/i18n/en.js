// Dictionnaire anglais : { 'texte français': 'English text' } (voir client/i18n/i18n.js).
// {nom} : une valeur insérée (« Niveau {n} » → « Level {n} »). « contexte|texte » : un mot français à deux sens,
// demandé dans le code par tt(texte, valeurs, contexte). Un texte absent reste en français.
// Un texte composé (« · », « — », phrases) se traduit morceau par morceau : une entrée par morceau suffit.
// Les textes sont rangés par partie du jeu ; `node tools/i18n_strings.cjs` liste ceux qui manquent.
export default {
  // ------------------------------------------------------------ Écran de chargement et accueil
  'Chargement de Canaan…': 'Loading Canaan…',
  'Astuce : les boss cachés des donjons donnent les clés des coffres secrets de l’île.':
    'Tip: hidden dungeon bosses drop the keys to the island’s secret chests.',
  'Astuce : la roulade (Maj ou Espace) rend invulnérable pendant un instant.':
    'Tip: dodge rolling (Shift or Space) makes you invulnerable for a moment.',
  'Astuce : la garde-robe (V) range les apparences trouvées en jouant.':
    'Tip: the wardrobe (V) stores the appearances you find while playing.',
  'Astuce : la stèle d’un donjon ne donne que des indices ; recoupe-les pour trouver l’ordre des leviers.':
    'Tip: a dungeon stele only gives clues; cross-check them to find the order of the levers.',
  'Ouverture de l’aventure…': 'Opening the adventure…',
  'Préparation du monde…': 'Preparing the world…',
  'Erreur de chargement :': 'Loading error:',
  'Aventures': 'Adventures',

  // ------------------------------------------------------------ Barre du héros, chat et barre des menus
  'Héros': 'Hero',
  'Niv. {n}': 'Lv. {n}',
  'Niv.': 'Lv.',
  'Expérience': 'Experience',
  'Or': 'Gold',
  'Zone': 'Zone',
  'Écris dans le chat… (Entrée)': 'Type in the chat… (Enter)',
  'Système': 'System',
  'Moi': 'Me',
  'Bienvenue à Canaan, héros. Explore, combats, deviens légende.':
    'Welcome to Canaan, hero. Explore, fight, become a legend.',
  'Déplacer les panneaux': 'Move the panels',
  'Positions par défaut': 'Default positions',
  'Paramètres du jeu': 'Game settings',
  'Déplacer l’interface': 'Move the interface',
  'Reset': 'Reset',
  'Paramètres': 'Settings',
  'Pause': 'Pause',
  'Menus du jeu': 'Game menus',
  'Classe et talents ({k})': 'Class and talents ({k})',
  'Inventaire ({k})': 'Inventory ({k})',
  'Personnage ({k})': 'Character ({k})',
  'Carte ({k})': 'Map ({k})',
  'Groupe ({k})': 'Group ({k})',
  'Métiers ({k})': 'Professions ({k})',
  'Métiers : récolte et artisanat ({k})': 'Professions: gathering and crafting ({k})',
  'Personnage : équipement, artéfacts, titres ({k})': 'Character: gear, artifacts, titles ({k})',
  'Groupe : compagnons et échange ({k})': 'Group: companions and trade ({k})',
  'Menu du jeu (Échap)': 'Game menu (Esc)',
  'Menu du jeu': 'Game menu',
  'Échap': 'Esc',
  'Journal de quêtes ({k})': 'Quest log ({k})',
  'Succès ({k})': 'Achievements ({k})',
  'Collections ({k})': 'Collections ({k})',
  'Collections : garde-robe, bestiaire, fouilles ({k})': 'Collections: wardrobe, bestiary, digging ({k})',

  // ------------------------------------------------------------ Menu pause
  'Menu pause': 'Pause menu',
  'Canaan attend ton retour, aventurier.': 'Canaan awaits your return, adventurer.',
  'Reprendre l’aventure': 'Resume the adventure',
  'Reprendre': 'Resume',
  'Sauvegarder maintenant': 'Save now',
  'Inventaire': 'Inventory',
  'Carte du monde': 'World map',
  'Retour à l’accueil': 'Back to the title screen',
  'Quitter le jeu': 'Quit the game',
  'Échap pour reprendre': 'Esc to resume',
  'Partie sauvegardée !': 'Game saved!',
  'Échec de sauvegarde : stockage indisponible.': 'Save failed: storage unavailable.',
  'Clic gauche : attaque rapide': 'Left click: quick attack',
  'clic droit : attaque lourde (sans mana). Touches 1-4 : compétences':
    'right click: heavy attack (no mana). Keys 1-4: skills',
  'F : sort de classe. WASD/ZASD : déplacement': 'F: class spell. WASD/ZQSD: move',
  'Maj/Espace : roulade': 'Shift/Space: dodge roll',
  'Q : changer d’arme': 'Q: switch weapon',
  'T : classe et talents': 'T: class and talents',
  'L : journal de quêtes.': 'L: quest log.',

  // ------------------------------------------------------------ Paramètres
  'Sections des paramètres': 'Settings sections',
  'Audio': 'Audio',
  'Affichage': 'Display',
  'Graphismes': 'Graphics',
  'Interface': 'Interface',
  'Interface et confort': 'Interface and comfort',
  'Clavier': 'Keyboard',
  'Manette': 'Gamepad',
  'Activer ou couper la musique et les effets': 'Turn music and sound effects on or off',
  'Musique et effets': 'Music and effects',
  'Son': 'Sound',
  'Volume de la musique': 'Music volume',
  'Volume des effets': 'Effects volume',
  'Volume général': 'Master volume',
  'Effets sonores': 'Sound effects',
  'Combat et sorts': 'Combat and spells',
  'Interface, butin et métiers': 'Interface, loot and crafts',
  'Bruits de pas': 'Footsteps',
  'Voix des personnages': 'Character voices',
  'Ambiance': 'Ambience',
  'Vent et feuillage': 'Wind and leaves',
  'Mer et rivières': 'Sea and rivers',
  'Animaux et nature': 'Wildlife and nature',
  'Plein écran': 'Fullscreen',
  '(plein écran)': '(fullscreen)',
  'Activé': 'On',
  'Activée': 'On',
  'Activées': 'On',
  'Désactivé': 'Off',
  'Désactivée': 'Off',
  'Désactivées': 'Off',
  'Affichés': 'Shown',
  'Masqués': 'Hidden',
  'Résolution de la fenêtre': 'Window resolution',
  'Échelle de l’affichage': 'Display scale',
  'Synchronisation verticale (VSync)': 'Vertical sync (VSync)',
  'La VSync change au prochain démarrage.': 'VSync changes on the next launch.',
  'Redémarrer le jeu': 'Restart the game',
  'Résolution, échelle et VSync se règlent dans l’application de bureau.':
    'Resolution, scale and VSync are set in the desktop app.',
  'Lueurs des lumières': 'Light glow',
  'Particules et vent': 'Particles and wind',
  'Limite d’images par seconde': 'Frame rate limit',
  '{n} images/s': '{n} FPS',
  'Illimitée': 'Unlimited',
  'Selon l’écran': 'Match the screen',
  'Afficher les images par seconde': 'Show frames per second',
  'Langue': 'Language',
  // Indice à côté de « Langue » : écrit dans l'autre langue, pour retrouver le réglage sans lire celle du jeu.
  '(Language)': '(Langue)',
  'Taille des textes': 'Text size',
  'Chiffres de dégâts': 'Damage numbers',
  'Secousses de l’écran': 'Screen shake',
  'Clique sur une case puis appuie sur la touche voulue. Échap annule, Retour arrière vide la case. Les flèches déplacent toujours le héros.':
    'Click a box, then press the key you want. Esc cancels, Backspace clears the box. The arrow keys always move the hero.',
  'Touches par défaut': 'Default keys',
  'Réinitialiser': 'Reset',
  'Touches par défaut rétablies.': 'Default keys restored.',
  'Appuie sur une touche…': 'Press a key…',
  'Cette touche est réservée (Échap, flèches, Tab, F11, F12).':
    'This key is reserved (Esc, arrows, Tab, F11, F12).',
  'Vibrations': 'Vibration',
  'Stick gauche': 'Left stick',
  'Se déplacer': 'Move',
  'Stick droit': 'Right stick',
  'Viser (sinon : le monstre le plus proche)': 'Aim (otherwise: the nearest monster)',
  'Attaque rapide · attaque lourde': 'Quick attack · heavy attack',
  'Interagir · roulade': 'Interact · dodge roll',
  'Compétences 1 à 4': 'Skills 1 to 4',
  'Croix': 'D-pad',
  '↑ sort de classe · ↓ changer d’arme · ← carte · → sac': '↑ class spell · ↓ switch weapon · ← map · → bag',
  'Pause · barre des menus': 'Pause · menu bar',
  'Dans les menus': 'In menus',
  'Croix ou stick : choisir · A : valider · B : retour · stick droit : défiler':
    'D-pad or stick: choose · A: confirm · B: back · right stick: scroll',
  'Retour': 'Back',
  'Échap pour fermer · Q / E (ou LB / RB) pour changer d’onglet':
    'Esc to close · Q / E (or LB / RB) to switch tabs',
  'Réglage d’affichage indisponible.': 'Display setting unavailable.',
  'Plein écran indisponible ici : essaie F11.': 'Fullscreen unavailable here: try F11.',
  'Impossible de garder la langue choisie.': 'Could not save the chosen language.',
  'Pour quitter, ferme simplement cet onglet : ta partie est sauvegardée.':
    'To quit, just close this tab: your game is saved.',
  'Manette connectée': 'Gamepad connected',
  'Manette déconnectée': 'Gamepad disconnected',

  // ------------------------------------------------------------ Touches et actions (Paramètres → Clavier)
  'Déplacement': 'Movement',
  'Combat': 'Combat',
  'Menus': 'Menus',
  'Avancer': 'Move up',
  'Reculer': 'Move down',
  'Aller à gauche': 'Move left',
  'Aller à droite': 'Move right',
  'Roulade': 'Dodge roll',
  'Compétence {n}': 'Skill {n}',
  'Sort de classe': 'Class spell',
  'Changer d’arme': 'Switch weapon',
  'Interagir': 'Interact',
  'Classe et talents': 'Class and talents',
  'Personnage': 'Character',
  'Groupe': 'Group',
  'Échange': 'Trade',
  'Compagnons': 'Companions',
  'Récolte': 'Gathering',
  'Artisanat': 'Crafting',
  'Garde-manger': 'Pantry',
  'Métiers': 'Professions',
  'Journal de quêtes': 'Quest log',
  'Collections': 'Collections',
  'Garde-robe': 'Wardrobe',
  'Écrire dans la discussion': 'Write in the chat',
  'touche|Espace': 'Space',
  'touche|Maj': 'Shift',
  'touche|Méta': 'Meta',
  'touche|Entrée': 'Enter',
  'touche|Retour': 'Backspace',
  'touche|Suppr': 'Delete',
  'touche|Inser': 'Insert',
  'touche|Début': 'Home',
  'touche|Fin': 'End',
  'touche|Pg préc.': 'Page Up',
  'touche|Pg suiv.': 'Page Down',
  'touche|Verr. maj': 'Caps Lock',
  '[E] Entrer': '[E] Enter',
  '[E] Parler': '[E] Talk',

  // ------------------------------------------------------------ Commandes tactiles
  'Commandes tactiles': 'Touch controls',
  'Monter': 'Up',
  'Gauche': 'Left',
  'Descendre': 'Down',
  'Droite': 'Right',
  'Attaque de base': 'Basic attack',
  'Roulade d’esquive': 'Dodge roll',

  // ------------------------------------------------------------ Fenêtres de confirmation
  'Confirmer': 'Confirm',
  'Oui': 'Yes',
  'Annuler': 'Cancel',
  'Invité : seul l’hôte peut faire cela pour l’instant.': 'Guest: only the host can do that for now.',

  // ------------------------------------------------------------ Sauvegardes et aventures
  'Sauvegarde illisible ou incompatible': 'Unreadable or incompatible save',
  'La sauvegarde originale est conservée. Pour pouvoir sauvegarder à nouveau, repars avec une partie neuve : une copie de secours sera créée avant de remplacer l’ancienne sauvegarde.':
    'The original save is kept. To be able to save again, start a fresh game: a backup copy will be made before the old save is replaced.',
  'Repartir à neuf': 'Start fresh',
  'Partie retrouvée !': 'Game restored!',
  'Sauvegarde illisible : utilise le bouton « Repartir à neuf ».':
    'Unreadable save: use the “Start fresh” button.',
  'Sauvegarde bloquée : utilise « Repartir à neuf » pour créer une copie de secours et recommencer.':
    'Saving is blocked: use “Start fresh” to make a backup copy and start over.',
  'La sauvegarde a changé. Recharge la page avant de réessayer.':
    'The save has changed. Reload the page before trying again.',
  'La sauvegarde a changé. Recharge la page.': 'The save has changed. Reload the page.',
  'Impossible de repartir à neuf : {raison}': 'Could not start fresh: {raison}',
  'La sauvegarde originale est conservée.': 'The original save is kept.',
  'La copie de secours n’a pas pu être vérifiée.': 'The backup copy could not be verified.',
  'L’artisanat a disparu : tes anciens matériaux de forge ont été échangés contre {n} or.':
    'Crafting is gone: your old forging materials were exchanged for {n} gold.',
  'Les niveaux arrivent : ton héros commence au niveau {n}, celui de ton meilleur équipement.':
    'Levels are here: your hero starts at level {n}, the level of your best gear.',
  'Les voies sont remplacées par les classes : choisis ta classe et tes talents (T).':
    'Paths are replaced by classes: choose your class and talents (T).',
  'Slot {n}': 'Slot {n}',
  'Aventure {n}': 'Adventure {n}',
  'Aventure': 'Adventure',
  'Invités : {noms}': 'Guests: {noms}',
  'Supprimer cette aventure ? Le monde et ton héros seront perdus.':
    'Delete this adventure? The world and your hero will be lost.',
  'Supprimer cette aventure ? Le monde et les héros de tes invités ({noms}) seront perdus.':
    'Delete this adventure? The world and your guests’ heroes ({noms}) will be lost.',
  'Une copie de secours est gardée dans le dossier des sauvegardes.':
    'A backup copy is kept in the saves folder.',
  'Supprimer définitivement': 'Delete permanently',
  'Niveau {n}': 'Level {n}',
  'Niveau': 'Level',
  '{n} or': '{n} gold',
  'Dernière partie : {date}': 'Last played: {date}',
  'Continuer': 'Continue',
  'Supprimer': 'Delete',
  'Sauvegarde illisible': 'Unreadable save',
  'Ouvre-la pour proposer « Repartir à neuf » (une copie est gardée), ou supprime-la.':
    'Open it to offer “Start fresh” (a copy is kept), or delete it.',
  'Ouvrir': 'Open',
  'Nouvelle aventure': 'New adventure',
  'Nom de l’aventure': 'Adventure name',
  'Nom du héros': 'Hero name',
  'Créer': 'Create',
  'Emplacement libre': 'Empty slot',
  'Un nouveau monde et un nouveau héros.': 'A new world and a new hero.',
  'Ouvrir le dossier des sauvegardes': 'Open the saves folder',
  'Impossible d’ouvrir cette aventure : stockage de session indisponible.':
    'Could not open this adventure: session storage unavailable.',
  'Impossible de créer l’aventure dans ce slot.': 'Could not create the adventure in this slot.',
  'Aventure supprimée. Une copie de secours a été gardée.': 'Adventure deleted. A backup copy was kept.',
  'Suppression impossible : l’aventure est conservée.': 'Could not delete: the adventure is kept.',

  // ------------------------------------------------------------ Création du héros
  'Création du héros': 'Hero creation',
  'Nouvelle aventure · Slot {n}': 'New adventure · Slot {n}',
  'Mon héros d’invité': 'My guest hero',
  'Aperçu du héros': 'Hero preview',
  'Tourner à gauche': 'Turn left',
  'Tourner à droite': 'Turn right',
  'Au hasard': 'Random',
  'Sexe': 'Sex',
  'Race': 'Race',
  'Pelage': 'Fur',
  'Peau': 'Skin',
  'Coiffure': 'Hairstyle',
  'Cheveux': 'Hair',
  'Yeux': 'Eyes',
  'Tenue': 'Outfit',
  'L’apparence est purement visuelle : aucune race n’est plus forte qu’une autre.':
    'Appearance is purely cosmetic: no race is stronger than another.',
  'Créer l’aventure': 'Create the adventure',
  'Enregistrer mon héros': 'Save my hero',
  'Classe': 'Class',
  'Créer un héros': 'Create a hero',
  'Aucun héros pour l’instant.': 'No hero yet.',
  'Choisis un emplacement libre pour créer ton premier personnage.':
    'Pick an empty slot to create your first character.',
  'Entrer dans le monde': 'Enter the world',
  'Apparence': 'Appearance',
  'Précédent': 'Previous',
  'Suivant': 'Next',
  'Vargar': 'Vargar',
  'Bâtisseurs tenaces des plaines de Canaan, les humains s’adaptent à toutes les voies.':
    'Steadfast builders of the plains of Canaan, humans adapt to every path.',
  'Fiers guerriers des terres arides, les orcs vivent pour l’honneur et pour leur clan.':
    'Proud warriors of the arid lands, orcs live for honor and for their clan.',
  'Gardiens anciens des forêts, les elfes sont liés à la magie et aux étoiles.':
    'Ancient guardians of the forests, elves are bound to magic and the stars.',
  'Colosses des hauts plateaux, les minotaures sont aussi calmes que redoutables.':
    'Giants of the high plateaus, minotaurs are as calm as they are fearsome.',
  'Frappés par une malédiction lunaire, les Vargars ont appris à dompter la bête qui sommeille en eux.':
    'Struck by a lunar curse, the Vargars have learned to tame the beast that slumbers within them.',

  // ------------------------------------------------------------ Salon de coiffure du camp
  'Salon de coiffure': 'Barber shop',
  'Sélène, la coiffeuse': 'Sélène, the hairdresser',
  '« Assieds-toi, je m’occupe de tout. Une nouvelle tête, un nouveau départ ! » Rien ne change avant de valider. Ta tenue et ta garde-robe restent les mêmes.':
    '“Have a seat, I’ll take care of everything. A new look, a fresh start!” Nothing changes until you confirm. Your outfit and wardrobe stay the same.',
  'Valider': 'Confirm',
  'Comme avant': 'As before',
  '[E] Changer d’apparence': '[E] Change appearance',
  'Changer d’apparence': 'Change appearance',
  'Nouvelle apparence !': 'New look!',
  'Nouvelle apparence ! (−{n} or)': 'New look! (−{n} gold)',
  'Rien n’a changé : rien à payer.': 'Nothing changed: nothing to pay.',
  'Valider ({n} or)': 'Confirm ({n} gold)',
  'Approche-toi de Sélène pour changer d’apparence.': 'Get closer to Sélène to change your appearance.',
  'Sort spécial (F) : {sort}': 'Special spell (F): {sort}',
  'Tu pourras changer de classe au Camp de l’Aurore.': 'You can change class at the Dawn Camp.',
  'Rejoindre la partie d’un ami': 'Join a friend’s game',
  'Rejoins ma partie The Legend of Nashi ! Relais : wss://… · Code : …':
    'Join my The Legend of Nashi game! Relay: wss://… · Code: …',
  'Invitation reçue (colle-la ici)': 'Invitation received (paste it here)',
  'Pseudo': 'Nickname',
  'Invité': 'Guest',
  'Code du salon': 'Room code',
  'Relais': 'Relay',
  'Apparence de mon héros': 'My hero’s appearance',
  'Rejoindre': 'Join',
  'Apparence enregistrée : tes amis la verront en jeu.':
    'Appearance saved: your friends will see it in game.',

  // ------------------------------------------------------------ Sac, matériaux et personnage
  'Capacité du sac : {n} / {m}': 'Bag capacity: {n} / {m}',
  'Amélioration permanente : +{n} emplacements par achat': 'Permanent upgrade: +{n} slots per purchase',
  '{n}/{m} améliorations': '{n}/{m} upgrades',
  'Capacité maximale atteinte': 'Maximum capacity reached',
  '＋ {n} emplacements': '＋ {n} slots',
  'Emplacement vide': 'Empty slot',
  'Vide': 'Empty',
  'cliquer pour équiper': 'click to equip',
  'Vendre': 'Sell',
  'Vendre {objet} pour {n} or': 'Sell {objet} for {n} gold',
  'clic : équiper': 'click: equip',
  'clic droit : options': 'right click: options',
  'Clic droit : options': 'Right click: options',
  'Sac': 'Bag',
  'Matériaux': 'Materials',
  'Matériaux — {n}/{max} emplacements': 'Materials — {n}/{max} slots',
  'Sac — {n}/{max} emplacements': 'Bag — {n}/{max} slots',
  'Survole un objet pour afficher son comparatif.': 'Hover over an item to compare it.',
  'Clique pour l’équiper (un repas se mange).': 'Click to equip it (a meal is eaten).',
  'Marchand proche : vente disponible.': 'Merchant nearby: selling available.',
  'Pour vendre, rends-toi chez un marchand et appuie sur E.': 'To sell, go to a merchant and press E.',
  'Vente chez un marchand (E).': 'Sell at a merchant (E).',
  'Leurs {n} cases de 100 ne prennent pas la place du sac.': 'Their {n} slots of 100 take no bag space.',
  'Autre': 'Other',
  'Libres': 'Free',
  'clés, repas, enchantements': 'keys, meals, enchantments',
  'trésors déterrés': 'dug-up treasures',
  'minerais, herbes, poissons, viandes, poudres': 'ores, herbs, fish, meat, dusts',
  'Rien pour l’instant.': 'Nothing yet.',
  'Trier': 'Sort',
  'Ranger l’équipement : par emplacement, qualité puis niveau':
    'Tidy the equipment: by slot, quality, then level',
  'Sac plein : démantèle (clic droit), vends ou dépose des objets, ou agrandis ton sac chez un marchand.':
    'Bag full: salvage (right click), sell or deposit items, or enlarge your bag at a merchant.',
  'Le butin Rare ou mieux attend dans la sacoche ; le reste est démantelé tout seul.':
    'Rare or better loot waits in the satchel; the rest is salvaged automatically.',
  'Démanteler : la pièce devient de la poudre d’enchantement, même en donjon.':
    'Salvage: the piece turns into enchanting dust, even in a dungeon.',
  // Démantèlement et sacoche de butin (salvage.js)
  'Une arme liée ne se démantèle pas.': 'A bound weapon cannot be salvaged.',
  '{nom} démantelé': '{nom} salvaged',
  '+{n} Poussière d’enchantement': '+{n} Enchanting Dust',
  '+{n} Essence d’enchantement': '+{n} Enchanting Essence',
  '+{n} Éclat d’enchantement': '+{n} Enchanting Shard',
  'Sac plein : {nom} rangé dans ta sacoche de butin.': 'Bag full: {nom} stored in your loot satchel.',
  'Sac plein : {nom} démantelé automatiquement': 'Bag full: {nom} salvaged automatically',
  'Sac plein : démantèle, vends ou dépose un objet pour reprendre ce butin.':
    'Bag full: salvage, sell or deposit an item to take this loot back.',
  'Démanteler {nom} ({qualite}, niveau {n}) en poudres d’enchantement ?':
    'Salvage {nom} ({qualite}, level {n}) into enchanting dust?',
  'Son enchantement sera perdu.': 'Its enchantment will be lost.',
  'Démanteler un objet précieux': 'Salvage a precious item',
  'Démanteler': 'Salvage',
  'cliquer pour le reprendre dans le sac': 'click to take it back into the bag',
  'Sacoche de butin': 'Loot satchel',
  'butin Rare ou mieux gardé quand le sac était plein': 'Rare or better loot kept while the bag was full',
  'Clique une pièce pour la reprendre dans le sac (il faut une case libre) ; clic droit pour la démanteler.':
    'Click a piece to take it back into the bag (a free slot is needed); right click to salvage it.',
  'Clic droit : Bague 2, vendre chez un marchand, démanteler.':
    'Right click: Ring 2, sell at a merchant, salvage.',
  // Menu du clic droit sur un objet (item-menu.js)
  'Équiper (Arme 1)': 'Equip (Weapon 1)',
  'Équiper en Arme 2': 'Equip as Weapon 2',
  'Vendre ×{n}': 'Sell ×{n}',
  'Reprendre dans le sac': 'Take back into the bag',
  'Enchanter une pièce': 'Enchant a piece',
  'Ouvrir l’enchanteur': 'Open the enchanter',
  'Vendre les objets communs': 'Sell common items',
  'arme liée, elle grandit avec toi': 'bound weapon, it grows with you',
  'Q pour changer': 'Q to switch',
  'cliquer pour retirer': 'click to remove',
  'emplacement libre': 'empty slot',
  'Personnage · Niveau {n}': 'Character · Level {n}',
  'Gardien de l’Aurore': 'Guardian of the Dawn',
  '{n}/10 équipés': '{n}/10 equipped',
  'Garde-robe (V)': 'Wardrobe (V)',
  'Niveau maximum': 'Maximum level',
  'Sac plein ! Vends un objet au marchand.': 'Bag full! Sell an item to the merchant.',
  'Ton sac est déjà au maximum !': 'Your bag is already at maximum!',
  'Il te manque {n} or pour agrandir ton sac.': 'You need {n} more gold to enlarge your bag.',
  'Sac agrandi : {n} emplacements !': 'Bag enlarged: {n} slots!',

  // ------------------------------------------------------------ Combat et état du héros
  'ÉTOURDI {n}s': 'STUNNED {n}s',
  'ÉTOURDI ({n}s)': 'STUNNED ({n}s)',
  '{nom} t’a étourdi !': '{nom} stunned you!',
  'Tu es à terre : un allié peut te relever (3 s à côté de toi).':
    'You are down: an ally can revive you (3 s next to you).',
  'Tentative terminée… Résurrection au camp.': 'Attempt over… Resurrected at camp.',
  'Tu es tombé… Résurrection au camp.': 'You fell… Resurrected at camp.',
  'À terre : un allié peut te relever': 'Down: an ally can revive you',
  'Relève dans {n} s': 'Revive in {n} s',
  // ------------------------------------------------------------ Effets actifs (barre des bonus et malus)
  'Effets actifs': 'Active effects',
  'Bonus': 'Buff',
  'Malus': 'Debuff',
  'Passif': 'Passive',
  'Reste {t}': '{t} left',
  'Bouclier': 'Shield',
  'Absorbe encore {n} dégâts.': 'Absorbs {n} more damage.',
  'Dégâts reçus −15 %.': 'Damage taken −15%.',
  'Dégâts reçus −20 %.': 'Damage taken −20%.',
  'Dégâts reçus −35 %.': 'Damage taken −35%.',
  'Instinct de survie actif.': 'Survival instinct active.',
  'Dégâts +15 %, régénération renforcée.': 'Damage +15%, stronger regeneration.',
  'Vitesse +20 %.': 'Speed +20%.',
  'Lumière divine': 'Divine light',
  'Voile d’ombre': 'Shadow veil',
  'Invisible, vitesse +30 %.': 'Invisible, speed +30%.',
  'Avatar élémentaire': 'Elemental avatar',
  'Dégâts +20 %, mana des compétences −30 %.': 'Damage +20%, skill mana −30%.',
  'Contagion': 'Contagion',
  'Tes invocations frappent 30 % plus vite.': 'Your summons strike 30% faster.',
  'Hymne de l’Aurore': 'Dawn hymn',
  'Soigne 3 % des PV max par seconde, dégâts +10 %.': 'Heals 3% of max HP per second, damage +10%.',
  'Mélodie vivifiante': 'Invigorating melody',
  'Vitesse +10 %, dégâts +5 %.': 'Speed +10%, damage +5%.',
  'Dégâts +{n} %.': 'Damage +{n}%.',
  'Rage écarlate': 'Scarlet rage',
  'Impossible de tomber sous 1 PV, attaques de base +25 %, soins doublés.':
    'Cannot drop below 1 HP, basic attacks +25%, healing doubled.',
  'Soif de sang': 'Bloodthirst',
  'Ta prochaine compétence offensive te rend 30 % des dégâts infligés.':
    'Your next offensive skill returns 30% of the damage dealt to you.',
  'Cri de guerre': 'War cry',
  'Forme féline': 'Cat form',
  'Garde': 'Guard',
  'Parade prête : les coups sont bloqués.': 'Parry ready: blows are blocked.',
  'Riposte prête': 'Riposte ready',
  'Ta prochaine Riposte inflige 600 %.': 'Your next Riposte deals 600%.',
  'Rage': 'Rage',
  'Dégâts +25 %, dégâts reçus +15 %.': 'Damage +25%, damage taken +15%.',
  'Déchaînement': 'Frenzy',
  'Dégâts +15 %, attaques 30 % plus rapides, dégâts reçus +10 %.':
    'Damage +15%, attacks 30% faster, damage taken +10%.',
  'Combo': 'Combo',
  'L’enchaînement suivant est prêt.': 'The next combo strike is ready.',
  'Pas de l’ombre': 'Shadowstep',
  'Ton prochain coup fait +60 %.': 'Your next hit deals +60%.',
  'Repli tactique': 'Tactical retreat',
  'Ton prochain Tir puissant inflige 360 %.': 'Your next Power Shot deals 360%.',
  'Serment du gardien': 'Guardian’s oath',
  'Concentration': 'Focus',
  'Ta prochaine compétence offensive fait +40 %.': 'Your next offensive skill deals +40%.',
  'Charges arcaniques': 'Arcane charges',
  'La Surcharge libère les charges (3 au maximum).': 'Overload releases the charges (3 at most).',
  'Bénédiction d’Ylvarë': 'Blessing of Ylvarë',
  'Dégâts +10 %, 1 % des PV rendus toutes les 3 s.': 'Damage +10%, 1% of HP restored every 3 s.',
  'Étourdi': 'Stunned',
  'Impossible de bouger.': 'Cannot move.',
  'Malédiction': 'Curse',
  'Soins reçus −60 %.': 'Healing received −60%.',
  'Saignement': 'Bleeding',
  'Brûlure': 'Burn',
  'Dégâts sur la durée.': 'Damage over time.',
  'Immobilisé': 'Rooted',
  'Ralenti': 'Slowed',
  'Poison': 'Poison',
  'Peste': 'Plague',
  'Ronces': 'Brambles',
  'Sève': 'Sap',
  'Vulnérable': 'Vulnerable',
  'Armure brisée': 'Broken armor',
  'Affaibli': 'Weakened',
  'Marqué': 'Marked',
  'Parade': 'Parry',
  'Invulnérable': 'Invulnerable',

  // ------------------------------------------------------------ Piles du sac (ressources, clés, repas)
  'Clé des secrets': 'Key of secrets',
  'Clé · piles de 20': 'Key · stacks of 20',
  'Ouvre un coffre secret de l’île ou des Tréfonds (E devant le coffre).':
    'Opens a secret chest on the island or in the Depths (E in front of the chest).',
  'Les boss cachés des donjons et des raids en donnent une à chaque héros.':
    'Hidden dungeon and raid bosses give one to each hero.',
  '(nouvelle !)': '(new!)',
  'Poisson': 'Fish',
  'Viande': 'Meat',
  'Minerai': 'Ore',
  'Herbe': 'Herb',
  'Enchantement': 'Enchantment',
  'Repas': 'Meal',
  'À cuisiner près d’une cuisinière (panneau P).': 'To cook at a stove (P panel).',
  'À cuisiner en infusion près d’une cuisinière (panneau P).': 'To brew as an infusion at a stove (P panel).',
  'Minerai rare des Tréfonds : il se vend {n} fois plus cher qu’un minerai de l’île.':
    'Rare ore from the Depths: it sells for {n} times the price of an island ore.',
  'Pour l’enchanteur : 3 minerais de {metal} donnent un enchantement (panneau P).':
    'For the enchanter: 3 {metal} ores make an enchantment (P panel).',
  'Ajoute {stat} en troisième statistique secondaire ({n} % de la base de l’objet).':
    'Adds {stat} as a third secondary stat ({n}% of the item’s base).',
  'Clic : choisir la pièce à enchanter.': 'Click: choose the piece to enchant.',
  'Clic : manger.': 'Click: eat.',
  'Vente : {n} or l’unité': 'Sells for {n} gold each',
  'clic droit : vendre': 'right click: sell',
  'Ne se vend pas.': 'Cannot be sold.',
  'Ne se vend pas': 'Cannot be sold',
  'Approche-toi d’un coffre secret et appuie sur E pour l’ouvrir avec une clé.':
    'Go up to a secret chest and press E to open it with a key.',
  '{nom} : à cuisiner près d’une cuisinière (panneau P).': '{nom}: to cook at a stove (P panel).',

  // ------------------------------------------------------------ Banque
  'Banque': 'Bank',
  'Banquier': 'Banker',
  'Banquier Orvin': 'Orvin the Banker',
  'Ta banque · {n} / {max}': 'Your bank · {n} / {max}',
  'Ton sac · {n} / {max}': 'Your bag · {n} / {max}',
  'Matériaux · {n} / {max}': 'Materials · {n} / {max}',
  'Va voir le banquier pour ranger tes objets.': 'Visit the banker to store your items.',
  'La banque est pleine.': 'The bank is full.',
  'Va voir le banquier pour reprendre tes objets.': 'Visit the banker to take back your items.',
  'Sac plein : fais de la place avant de reprendre.': 'Bag full: make room before taking items back.',
  'Approche-toi du banquier pour ouvrir ta banque.': 'Go up to the banker to open your bank.',
  'banque|Reprendre': 'Take back',
  'Clique un objet pour le reprendre dans ton sac.': 'Click an item to put it back in your bag.',
  'Déposer à la banque': 'Deposit in the bank',
  'Clique un objet pour le déposer.': 'Click an item to deposit it.',
  'Aucun matériau.': 'No materials.',
  'Ta banque': 'Your bank',
  'Ta banque est vide.': 'Your bank is empty.',
  '{n} places libres': '{n} free slots',
  'Clic : reprendre dans ton sac': 'Click: take back into your bag',
  'Clic : déposer à la banque': 'Click: deposit in the bank',
  'Ton sac': 'Your bag',
  'Ton sac est vide.': 'Your bag is empty.',
  'Objets': 'Items',

  // ------------------------------------------------------------ Équipement
  'L’équipement se prépare avant d’entrer dans l’Arène.': 'Gear is prepared before entering the Arena.',
  'Niveau {n} requis pour {objet}.': 'Level {n} required for {objet}.',
  '{objet} est lié à ton âme : aucune autre arme.': '{objet} is bound to your soul: no other weapon.',
  'Arme 2 équipée : {objet}': 'Weapon 2 equipped: {objet}',
  'Équipe une deuxième arme depuis ton inventaire !': 'Equip a second weapon from your inventory!',
  'Arme active : {objet}': 'Active weapon: {objet}',
  'Sac modifié : rouvre-le avant de vendre.': 'Bag changed: reopen it before selling.',
  'Va voir un marchand pour vendre !': 'Visit a merchant to sell!',
  'Vendre {objet} ({qualite}, niveau {n}) pour {or} or ?':
    'Sell {objet} ({qualite}, level {n}) for {or} gold?',
  'Vendre un objet précieux': 'Sell a precious item',
  'Garder': 'Keep',

  // ------------------------------------------------------------ Statistiques et info-bulles des objets
  'CRITIQUE !': 'CRITICAL!',
  'DÉVIATION': 'DEFLECT',
  'CRITIQUE ENNEMI': 'ENEMY CRITICAL',
  '{nom} vaincu ! Ramasse le butin.': '{nom} defeated! Pick up the loot.',
  'Aucun bonus': 'No bonus',
  'Comparaison des statistiques': 'Stat comparison',
  'Niveau requis : {n}': 'Required level: {n}',
  '(enchantement)': '(enchantment)',
  'Arme liée à l’Invocateur : elle prend ton niveau et grandit avec toi. Impossible à retirer, vendre ou échanger.':
    'Weapon bound to the Summoner: it takes your level and grows with you. Cannot be removed, sold or traded.',
  'Arme liée au Berserker : elle prend ton niveau et grandit avec toi. Impossible à retirer, vendre ou échanger.':
    'Weapon bound to the Berserker: it takes your level and grows with you. Cannot be removed, sold or traded.',
  'Points': 'Points',
  'Statistiques principales': 'Primary stats',
  'Statistiques secondaires': 'Secondary stats',

  // ------------------------------------------------------------ Artéfacts de l'Arène (shared/data/arena-artefacts.js)
  'Cœur de Fer': 'Iron Heart',
  'Croc des Ombres': 'Shadow Fang',
  'Pierre du Colosse': 'Colossus Stone',
  'Fiole des Brumes': 'Mist Vial',
  'Écu du Déchu': 'Fallen Knight’s Shield',
  'Écaille Écarlate': 'Scarlet Scale',
  'Œil des Tempêtes': 'Eye of Storms',
  'Sceau de l’Exécuteur': 'Executioner’s Seal',
  'Prisme de Cristal': 'Crystal Prism',
  'Cœur de Cendres': 'Heart of Ashes',
  'Voile du Néant': 'Veil of the Void',
  'Couronne du Souverain': 'Sovereign’s Crown',
  'Dégâts reçus −{n} %.': 'Damage taken −{n}%.',
  'Chance critique +{n} points ; tes coups critiques font saigner ({m} % du coup en 4 s).':
    'Critical chance +{n} points; your critical hits cause bleeding ({m}% of the hit over 4 s).',
  'PV maximum +{n} %.': 'Maximum HP +{n}%.',
  'Soins reçus +{n} % ; hors combat, tu récupères {m} % de tes PV maximum par seconde.':
    'Healing received +{n}%; out of combat, you recover {m}% of your maximum HP per second.',
  '{n} % de chances de parer un coup (aucun dégât) et de riposter ({m} % de ton Attaque).':
    '{n}% chance to parry a blow (no damage) and strike back ({m}% of your Attack).',
  'Tes coups enflamment l’ennemi : {n} % des dégâts infligés en brûlure sur 4 s.':
    'Your hits set the enemy ablaze: {n}% of the damage dealt as a burn over 4 s.',
  '{n} % de chances qu’un coup lance un éclair en chaîne : {m} % des dégâts sur la cible et deux ennemis proches.':
    '{n}% chance for a hit to unleash chain lightning: {m}% of the damage to the target and two nearby enemies.',
  '+{n} % de dégâts contre les ennemis sous 35 % de leurs PV.':
    '+{n}% damage against enemies below 35% of their HP.',
  'Toutes les 20 s, un bouclier absorbe {n} % de tes PV maximum.':
    'Every 20 s, a shield absorbs {n}% of your maximum HP.',
  'Compétences +{n} % de dégâts ; leurs recharges −{m} %.': 'Skills +{n}% damage; their cooldowns −{m}%.',
  'Recharge de la roulade −{n} % ; après une roulade, +{m} % de dégâts pendant 3 s.':
    'Dodge roll cooldown −{n}%; after a roll, +{m}% damage for 3 s.',
  'Attaque, Défense et PV maximum +{n} % ; une fois toutes les 90 s, un coup fatal te laisse à 20 % de tes PV.':
    'Attack, Defense and maximum HP +{n}%; once every 90 s, a fatal blow leaves you at 20% of your HP.',
  // Fiche du personnage (C), info-bulles et effets en combat (scripts/arena-artefacts.js).
  'Artéfacts': 'Artifacts',
  'sans place prise': 'take no space',
  'Tes artéfacts sont dans le sac (I) : clic pour les équiper.':
    'Your artifacts are in the bag (I): click to equip them.',
  'Emplacement d’artéfact libre : équipe un artéfact depuis le sac (I)':
    'Free artifact slot: equip an artifact from the bag (I)',
  'Chaque boss de l’Arène des Épreuves donne son artéfact.':
    'Each boss of the Arena of Trials gives its artifact.',
  'Artéfact inconnu': 'Unknown artifact',
  'Vaincs ce boss de l’Arène des Épreuves pour l’obtenir.':
    'Defeat this boss of the Arena of Trials to get it.',
  'Rang {rang}': 'Rank {rang}',
  'Rang maximum : un nouveau doublon rapporte de l’or.': 'Maximum rank: another duplicate brings gold.',
  'Équipé (emplacement {n})': 'Equipped (slot {n})',
  'Les artéfacts se changent avant d’entrer dans l’Arène.':
    'Artifacts are changed before entering the Arena.',
  'Impossible de changer d’artéfact en combat.': 'Cannot change artifacts in combat.',
  'Les 4 emplacements sont occupés : retire d’abord un artéfact.':
    'All 4 slots are taken: remove an artifact first.',
  '{nom} équipé': '{nom} equipped',
  'PARADE': 'PARRY',
  'SOUVERAIN': 'SOVEREIGN',
  'Bouclier : absorbe {n} dégâts.': 'Shield: absorbs {n} damage.',
  'Protection contre un coup fatal en recharge.': 'Protection against a fatal blow on cooldown.',
  'Les Runes et les anciens artéfacts laissent place aux artéfacts de l’Arène : {n} or remboursés.':
    'Runes and the old artifacts make way for the Arena artifacts: {n} gold refunded.',
  // Deux bagues (fiche C, menu du clic droit).
  'Bague 1': 'Ring 1',
  'Bague 2': 'Ring 2',
  'Équiper (Bague 1)': 'Equip (Ring 1)',
  'Équiper en Bague 2': 'Equip as Ring 2',
  'Dégâts +{n} %': 'Damage +{n}%',
  'PV max +{n} %': 'Max HP +{n}%',
  'Dégâts reçus −{n} %': 'Damage taken −{n}%',
  'Chance critique +{n} points': 'Critical chance +{n} points',
  'Vitesse +{n} %': 'Speed +{n}%',

  // ------------------------------------------------------------ Garde-robe
  'Apparence déjà connue ({nom}) : revendue {n} or.': 'Appearance already known ({nom}): sold for {n} gold.',
  'APPARENCE {qualite} !': '{qualite} APPEARANCE!',
  'Nouvelle apparence {qualite} : {nom} (touche V)': 'New {qualite} appearance: {nom} (V key)',
  '{nom} (touche V)': '{nom} (V key)',
  'Apparence {qualite} à découvrir': '{qualite} appearance to discover',
  'portée': 'worn',
  '{n} / {max} apparences': '{n} / {max} appearances',
  'Des tenues complètes, purement visuelles, portées par-dessus ton équipement.':
    'Complete outfits, purely cosmetic, worn over your gear.',
  'Elles tombent des monstres, des boss (donjons, raids, boss cachés, boss mondiaux, Arène) et des coffres secrets ; plus la qualité est haute, plus la tenue est travaillée (ailes, aura, particules).':
    'They drop from monsters, bosses (dungeons, raids, hidden bosses, world bosses, Arena) and secret chests; the higher the quality, the more elaborate the outfit (wings, aura, particles).',
  'Clique pour porter.': 'Click to wear.',
  'Tenue d’origine': 'Original outfit',
  'Retirer l’apparence': 'Remove the appearance',
  'Aucune apparence portée.': 'No appearance worn.',
  'Apparences obtenues': 'Appearances collected',
  'Ta tenue de création': 'Your starting outfit',
  'Porter': 'Wear',
  '✔ Portée': '✔ Worn',
  'Pas encore obtenue': 'Not collected yet',
  'Où l’obtenir': 'Where to get it',
  'Boss de donjon': 'Dungeon bosses',
  'Boss de raid': 'Raid bosses',
  'Boss cachés': 'Hidden bosses',
  'Coffres secrets': 'Secret chests',

  // ------------------------------------------------------------ Boutique
  'Marchand': 'Merchant',
  'Marchandise · {lieu}': 'Wares · {lieu}',
  'Marchandise': 'Wares',
  'Services': 'Services',
  'Clic : vendre': 'Click: sell',
  'Clic : acheter': 'Click: buy',
  'Survol : comparer': 'Hover: compare',
  'Équipement Peu commun de ton niveau.': 'Uncommon gear of your level.',
  'Survole un objet pour le comparer, clique pour l’acheter.':
    'Hover over an item to compare it, click to buy it.',
  'Thalion, l’armurier': 'Thalion, the armorer',
  '« Un équipement taillé par les elfes, de niveau 60. Choisis ta pièce, je m’occupe du reste. »':
    '“Elf-crafted gear, level 60. Pick your piece, I’ll take care of the rest.”',
  'Va voir un marchand pour acheter.': 'Visit a merchant to buy.',
  'Sac plein : vends d’abord un objet.': 'Bag full: sell an item first.',
  'Or insuffisant ({n} or).': 'Not enough gold ({n} gold).',
  '{objet} acheté ({n} or).': '{objet} bought ({n} gold).',
  '{nom} : ne se vend pas.': '{nom}: cannot be sold.',
  '{nom} ×{n} vendu : +{or} or': '{nom} ×{n} sold: +{or} gold',
  'Acheter {objet}': 'Buy {objet}',
  'Vendre {objet}': 'Sell {objet}',
  'Vendre pour {n} or': 'Sell for {n} gold',
  'Clique un objet pour le vendre ; clic droit pour plus d’options. Or :':
    'Click an item to sell it; right click for more options. Gold:',
  'Approche-toi du marchand pour voir sa marchandise.': 'Go up to the merchant to see the wares.',
  'Pour devenir plus fort, il faut trouver mieux : monstres, boss mondiaux, donjons et raids lâchent des équipements toujours plus puissants.':
    'To get stronger, you need better finds: monsters, world bosses, dungeons and raids drop ever more powerful gear.',

  // ------------------------------------------------------------ Carte
  'Raid': 'Raid',
  'Donjon': 'Dungeon',
  'Dézoomer': 'Zoom out',
  'Zoomer': 'Zoom in',
  'Me centrer': 'Center on me',
  'Vue d’ensemble': 'Overview',
  'Molette : zoom': 'Wheel: zoom',
  'glisser : déplacer': 'drag: move',
  'double-clic : zoomer ici': 'double-click: zoom here',
  'Vous': 'You',
  'Alliés': 'Allies',
  'Monstres': 'Monsters',
  'Élites': 'Elites',
  'Boss': 'Boss',
  'Ennemis restants :': 'Enemies left:',
  '{nom} vous attend.': '{nom} awaits you.',
  'Instance terminée : ouvre le coffre puis ressors.': 'Instance cleared: open the chest, then leave.',
  'Le boss apparaîtra quand la salle sera vide.': 'The boss will appear once the room is empty.',
  'Niveaux {n}': 'Levels {n}',
  'zone sûre': 'safe zone',
  'Canaan — L’île et ses six biomes': 'Canaan — The island and its six biomes',
  'Camp': 'Camp',
  'Donjons': 'Dungeons',
  'Raids': 'Raids',
  'Arène': 'Arena',
  'Boss mondiaux': 'World bosses',
  'Refuges': 'Shelters',
  'Quête à prendre': 'Quest available',
  'Quête à rendre': 'Quest to turn in',
  'Objectif suivi': 'Tracked objective',
  'Biomes, donjons et raids': 'Biomes, dungeons and raids',
  'Survole une instance pour la voir sur la carte.': 'Hover over an instance to see it on the map.',
  'Vous êtes ici': 'You are here',
  'Légende': 'Legend',
  'Marchands': 'Merchants',
  'Entrées des Tréfonds': 'Entrances to the Depths',
  'Coffres révélés': 'Revealed chests',
  'Clique un lieu pour le voir sur la carte.': 'Click a place to see it on the map.',
  'Créatures et boss à ton niveau ({n})': 'Creatures and bosses at your level ({n})',
  // ------------------------------------------------------------ Statistiques (shared/data/stats.js)
  'Attaque': 'Attack',
  'Augmente les dégâts des attaques et compétences offensives.':
    'Increases the damage of attacks and offensive skills.',
  'Défense': 'Defense',
  'Réduit les dégâts reçus.': 'Reduces damage taken.',
  'Vitalité': 'Vitality',
  'Augmente les PV maximum.': 'Increases maximum HP.',
  'Puissance': 'Power',
  'Augmente tous les dégâts infligés.': 'Increases all damage dealt.',
  'Critique': 'Critical',
  'Augmente les chances de coup critique.': 'Increases critical hit chance.',
  'Célérité': 'Haste',
  'Augmente la vitesse d’attaque et réduit les temps de recharge.':
    'Increases attack speed and reduces cooldowns.',
  'Maîtrise': 'Mastery',
  'Augmente les dégâts des compétences offensives.': 'Increases the damage of offensive skills.',
  'Soin': 'Healing',
  'Augmente les soins effectués.': 'Increases healing done.',
  'Résistance': 'Resistance',

  // ------------------------------------------------------------ Qualités des objets
  'Commun': 'Common',
  'Peu commun': 'Uncommon',
  'Rare': 'Rare',
  'Épique': 'Epic',
  'Légendaire': 'Legendary',
  'Mythique': 'Mythic',
  'Relique': 'Relic',

  // ------------------------------------------------------------ Armes et compétences (shared/data/equipment.js)
  'Épée': 'Sword',
  'Polyvalente : frappes sûres, parade et riposte qui soigne.':
    'Versatile: reliable strikes, parry and a healing riposte.',
  'Frappe précise': 'Precise strike',
  'Cône court': 'Short cone',
  'Un coup puissant devant toi qui touche tous les ennemis du cône.':
    'A powerful blow in front of you that hits every enemy in the cone.',
  'Tourbillon': 'Whirlwind',
  'Cercle autour de toi': 'Circle around you',
  'Tu tournoies et frappes tous les ennemis autour de toi.': 'You spin and strike every enemy around you.',
  '−40 % de dégâts reçus 2,5 s': '−40% damage taken for 2.5 s',
  'prépare la Riposte': 'prepares the Riposte',
  'Pendant 2,5 s, tu subis 40 % de dégâts en moins. Pendant 4 s, ta Riposte héroïque est renforcée.':
    'For 2.5 s, you take 40% less damage. For 4 s, your Heroic riposte is empowered.',
  'Riposte héroïque': 'Heroic riposte',
  'Cône': 'Cone',
  '450 % (600 % après Parade)': '450% (600% after Parry)',
  'vol de vie 20 %': 'lifesteal 20%',
  'Un coup dévastateur devant toi. Après une Parade, il inflige 600 %. Tu récupères 20 % des dégâts infligés en PV.':
    'A devastating blow in front of you. After a Parry, it deals 600%. You recover 20% of the damage dealt as HP.',
  'Épées doubles': 'Twin swords',
  'Rapide : enchaîne les coups et accélère tes attaques.':
    'Fast: chain your blows and speed up your attacks.',
  'Rafale de lames': 'Blade flurry',
  '{n} coups rapides': '{n} quick hits',
  '{n} % chacun ({max} %)': '{n}% each ({max}%)',
  'Danse des lames': 'Blade dance',
  '{n} tours': '{n} spins',
  '3 frappes circulaires autour de toi. Active le combo pendant 4 s.':
    '3 circular strikes around you. Activates the combo for 4 s.',
  'Élan offensif': 'Offensive momentum',
  'Attaques de base 30 % plus rapides et +15 % de dégâts, 6 s':
    'Basic attacks 30% faster and +15% damage, 6 s',
  'Pendant 6 s, tes attaques de base sont 30 % plus rapides et tous tes coups font +15 % de dégâts. Tu subis 10 % de dégâts en plus.':
    'For 6 s, your basic attacks are 30% faster and all your hits deal +15% damage. You take 10% more damage.',
  'Assaut final': 'Final assault',
  '6 frappes': '6 strikes',
  '80 % (480 %), dernier coup ×2 en combo': '80% (480%), last hit ×2 in combo',
  '6 frappes en cône. Si le combo est actif (Rafale ou Danse lancée dans les 4 s), la dernière frappe fait double dégâts (560 % au total).':
    '6 strikes in a cone. If the combo is active (Flurry or Dance cast within 4 s), the last strike deals double damage (560% in total).',
  'Hache': 'Axe',
  'Brutale : gros coups lents et exécution des cibles blessées.':
    'Brutal: slow heavy blows and executing wounded targets.',
  'Frappe écrasante': 'Crushing strike',
  'Un coup lourd devant toi.': 'A heavy blow in front of you.',
  'Fendoir': 'Cleaver',
  'Large cône de 120°': 'Wide 120° cone',
  'Un grand coup de taille qui touche tous les ennemis devant toi.':
    'A wide slash that hits every enemy in front of you.',
  'Rage du berserker': 'Berserker rage',
  '+25 % de dégâts pendant 8 s': '+25% damage for 8 s',
  'Pendant 8 s, tous tes coups (attaques de base comprises) font +25 % de dégâts. Tu subis 15 % de dégâts en plus.':
    'For 8 s, all your hits (basic attacks included) deal +25% damage. You take 15% more damage.',
  'Exécution': 'Execute',
  '500 %, ou 750 % sous 30 % de PV': '500%, or 750% below 30% HP',
  'Un coup fatal devant toi. Contre une cible sous 30 % de ses PV, il inflige 750 %.':
    'A fatal blow in front of you. Against a target below 30% of its HP, it deals 750%.',
  'Masse': 'Mace',
  'Contrôle : brise l’armure, ralentit et étourdit.': 'Control: breaks armor, slows and stuns.',
  'Coup fracassant': 'Shattering blow',
  'armure brisée 6 s': 'armor broken 6 s',
  'Brise l’armure des ennemis touchés : ils subissent 10 % de dégâts en plus pendant 6 s (de toi et de ton groupe).':
    'Breaks the armor of enemies hit: they take 10% more damage for 6 s (from you and your group).',
  'Onde de choc': 'Shockwave',
  'Cercle': 'Circle',
  'ralentit 3 s': 'slows 3 s',
  'Frappe le sol : tous les ennemis autour de toi sont touchés et ralentis pendant 3 s.':
    'Strike the ground: every enemy around you is hit and slowed for 3 s.',
  'Coup d’interruption': 'Interrupting blow',
  'étourdit 1,5 s (boss : affaibli)': 'stuns 1.5 s (bosses: weakened)',
  'Étourdit les monstres touchés pendant 1,5 s. Un boss n’est pas étourdi mais affaibli : il inflige 5 % de dégâts en moins pendant 4 s.':
    'Stuns the monsters hit for 1.5 s. A boss is not stunned but weakened: it deals 5% less damage for 4 s.',
  'Briseur de rempart': 'Rampart breaker',
  '460 %, ou 600 % sur armure brisée': '460%, or 600% on broken armor',
  'Un coup massif devant toi. Contre une cible à l’armure brisée (Coup fracassant), il inflige 600 %.':
    'A massive blow in front of you. Against a target with broken armor (Shattering blow), it deals 600%.',
  'Lance': 'Spear',
  'Portée : frappe de loin en ligne et repousse.': 'Reach: strikes from afar in a line and knocks back.',
  'Estoc perforant': 'Piercing thrust',
  'Ligne longue': 'Long line',
  'Un coup en ligne droite qui traverse tous les ennemis alignés devant toi.':
    'A straight-line thrust that pierces every enemy lined up in front of you.',
  'Balayage du lancier': 'Spearman’s sweep',
  'Demi-cercle': 'Half circle',
  'repousse': 'knocks back',
  'Un balayage devant toi qui repousse les monstres (pas les boss).':
    'A sweep in front of you that knocks monsters back (not bosses).',
  'Charge du lancier': 'Spearman’s charge',
  'Bond en avant': 'Leap forward',
  '{n} % sur la trajectoire': '{n}% along the path',
  'Tu bondis vers la souris et frappes tous les ennemis sur ton chemin et devant toi.':
    'You leap toward the mouse and strike every enemy in your path and in front of you.',
  'Percée parfaite': 'Perfect thrust',
  'Cône étroit': 'Narrow cone',
  '460 %, ou 600 % à portée idéale': '460%, or 600% at ideal range',
  'Un estoc puissant. Contre une cible entre 3 et 5 cases de toi (ni collée, ni trop loin), il inflige 600 %.':
    'A powerful thrust. Against a target 3 to 5 tiles from you (neither too close nor too far), it deals 600%.',
  'Dagues doubles': 'Twin daggers',
  'Saignement : fais saigner, puis consume les saignements.':
    'Bleed: make them bleed, then consume the bleeds.',
  'Entaille rapide': 'Quick slash',
  '{n} coups': '{n} hits',
  'saignement 5 s': 'bleed 5 s',
  'Lames tournoyantes': 'Spinning blades',
  'saignements +3 s': 'bleeds +3 s',
  'Frappe tous les ennemis autour de toi et prolonge de 3 s leurs saignements.':
    'Strikes every enemy around you and extends their bleeds by 3 s.',
  'Bond arrière': 'Back leap',
  'prochain coup +60 %': 'next hit +60%',
  'Tu bondis en arrière (dos à la souris). Ton prochain coup, dans les 4 s, fait +60 % de dégâts.':
    'You leap backward (away from the mouse). Your next hit, within 4 s, deals +60% damage.',
  'Mille coupures': 'Thousand cuts',
  '85 % (425 %)': '85% (425%)',
  'consume les saignements': 'consumes the bleeds',
  'Arc': 'Bow',
  'Distance : tirs puissants, zone au sol et repli.': 'Ranged: powerful shots, ground area and retreat.',
  'Tir puissant': 'Power shot',
  'Flèche': 'Arrow',
  '280 % (360 % après un Repli)': '280% (360% after a Retreat)',
  'Une flèche puissante vers la souris. Juste après un Repli tactique (5 s), elle inflige 360 %.':
    'A powerful arrow toward the mouse. Right after a Tactical retreat (5 s), it deals 360%.',
  'Pluie de flèches': 'Rain of arrows',
  'Zone sous la souris': 'Area under the mouse',
  '4 salves de 90 % (360 %)': '4 volleys of 90% (360%)',
  'Tir entravant': 'Hobbling shot',
  'ralentit 4 s (boss : marqué)': 'slows 4 s (bosses: marked)',
  'Une flèche qui ralentit les monstres sur sa ligne pendant 4 s. Un boss est marqué : son prochain coup reçu fait +30 % de dégâts.':
    'An arrow that slows the monsters in its path for 4 s. A boss is marked: the next hit it takes deals +30% damage.',
  'tir 240 %': 'shot 240%',
  'renforce le Tir puissant': 'empowers Power shot',
  'Tu bondis en arrière et tires une flèche (240 %). Ton prochain Tir puissant dans les 5 s inflige 360 %.':
    'You leap backward and fire an arrow (240%). Your next Power shot within 5 s deals 360%.',
  'Égide sacrée': 'Sacred aegis',
  'Protection : zone sacrée qui soigne le groupe et serment défensif.':
    'Protection: a sacred area that heals the group, and a defensive oath.',
  'Tempête d’égide': 'Aegis storm',
  '4 frappes de 65 % (260 %)': '4 strikes of 65% (260%)',
  'Ton bouclier tourne autour de toi et frappe 4 fois tous les ennemis proches.':
    'Your shield circles around you and strikes every nearby enemy 4 times.',
  'Sol consacré': 'Consecrated ground',
  'Zone 6 s': 'Area 6 s',
  '60 %/s aux ennemis': '60%/s to enemies',
  'soigne 3 % PV/s': 'heals 3% HP/s',
  'Consacre le sol pendant 6 s : chaque seconde, les ennemis dedans subissent 60 % de dégâts sacrés et chaque héros du groupe dedans récupère 3 % de ses PV max.':
    'Consecrates the ground for 6 s: each second, enemies inside take 60% holy damage and each group hero inside recovers 3% of their max HP.',
  'Lancer du rempart': 'Rampart throw',
  'Tu lances ton bouclier en ligne droite : il traverse et frappe tous les ennemis alignés.':
    'You throw your shield in a straight line: it passes through and strikes every enemy lined up.',
  '−35 % de dégâts reçus 6 s': '−35% damage taken for 6 s',
  'soigne 15 % PV': 'heals 15% HP',
  'Pendant 6 s, tu subis 35 % de dégâts en moins, et tu récupères aussitôt 15 % de tes PV max.':
    'For 6 s, you take 35% less damage, and you instantly recover 15% of your max HP.',
  'Bâton arcanique': 'Arcane staff',
  'Arcanes : accumule des charges, puis libère-les avec la Surcharge.':
    'Arcana: build up charges, then release them with Overload.',
  'Projectile arcanique': 'Arcane missile',
  'Projectile magique': 'Magic missile',
  '+{n} charge': '+{n} charge',
  'Un projectile magique vers la souris. Donne 1 charge arcanique (3 au maximum, affichées sur la barre et sous ton héros).':
    'A magic missile toward the mouse. Gives 1 arcane charge (3 at most, shown on the bar and under your hero).',
  'Onde magique': 'Magic wave',
  'Cercle magique': 'Magic circle',
  '+1 charge si touche': '+1 charge on hit',
  'Une onde autour de toi qui frappe tous les ennemis proches. Donne 1 charge si elle touche au moins un ennemi.':
    'A wave around you that strikes every nearby enemy. Gives 1 charge if it hits at least one enemy.',
  'Prochaine compétence +40 %': 'Next skill +40%',
  'Ta prochaine compétence offensive (dans les 8 s) fait +40 % de dégâts. Les attaques de base ne la consomment pas. Donne 1 charge.':
    'Your next offensive skill (within 8 s) deals +40% damage. Basic attacks do not consume it. Gives 1 charge.',
  'Surcharge arcanique': 'Arcane overload',
  '320 % +140 % par charge (max 740 %)': '320% +140% per charge (max 740%)',
  'Explosion là où tu vises : 320 %, plus 140 % par charge consommée (740 % avec 3 charges). Consomme toutes les charges.':
    'An explosion where you aim: 320%, plus 140% per charge consumed (740% with 3 charges). Consumes all charges.',
  'Grimoire': 'Grimoire',
  'Invocations : lève des morts-vivants qui empoisonnent tes ennemis.':
    'Summons: raise undead that poison your enemies.',
  'Squelette putride': 'Putrid skeleton',
  'Invocation': 'Summon',
  '{n} au maximum': '{n} at most',
  '{n} % par coup': '{n}% per hit',
  'sans limite': 'no limit',
  'Nuée de corbeaux': 'Crow swarm',
  '4 corbeaux nécrosés': '4 necrotic crows',
  '{n} % par coup de bec': '{n}% per peck',
  'Totem de peste': 'Plague totem',
  'Totem 10 s sous la souris': 'Totem 10 s under the mouse',
  '50 %/s en zone': '50%/s in an area',
  'rats pestiférés': 'plague rats',
  'Abomination': 'Abomination',
  '{n} % en zone': '{n}% in an area',
  'Luth': 'Lute',
  'Musique : notes à distance, soins de groupe et symphonie qui frappe et soigne.':
    'Music: ranged notes, group healing and a symphony that strikes and heals.',
  'Note éclatante': 'Bursting note',
  'soigne {n} % PV': 'heals {n}% HP',
  'Accord dissonant': 'Dissonant chord',
  'Chant de guérison': 'Healing song',
  'Symphonie': 'Symphony',
  '5 ondes de 100 % (500 %)': '5 waves of 100% (500%)',
  'soigne': 'heals',
  'CHANT DE GUÉRISON': 'HEALING SONG',
  'SYMPHONIE': 'SYMPHONY',
  'Grande hache': 'Great axe',
  'Hache à deux mains : larges coups, bond écrasant et hurlement de rage, payés avec ton sang.':
    'Two-handed axe: wide blows, a crushing leap and a howl of rage, paid for with your blood.',
  'Grand cône': 'Wide cone',
  'Bond du boucher': 'Butcher’s leap',
  'Bond vers la souris': 'Leap toward the mouse',
  '240 % autour de toi': '240% around you',
  'étourdit 1 s': 'stuns 1 s',
  'Hurlement sanguinaire': 'Bloodthirsty howl',
  'Rage 6 s : dégâts +25 %': 'Rage 6 s: damage +25%',
  'affaiblit autour de toi': 'weakens around you',
  'Châtiment du sang': 'Blood punishment',
  '450 %, ou 700 % sous 30 % de tes PV': '450%, or 700% below 30% of your HP',
  'HURLEMENT : DÉGÂTS +25 %': 'HOWL: DAMAGE +25%',
  'CHÂTIMENT 700 %': 'PUNISHMENT 700%',
  // ------------------------------------------------------------ Classes et talents (shared/data/classes.js)
  'Nature': 'Nature',
  'Sacré': 'Holy',
  'Ombre': 'Shadow',
  'Feu': 'Fire',
  'Glace': 'Ice',
  'Foudre': 'Lightning',
  'Harmonie': 'Harmony',
  'Sang': 'Blood',
  'Druide': 'Druid',
  'Polyvalence, soins, poison et régénération': 'Versatility, healing, poison and regeneration',
  'Nature, poison, régénération et soutien': 'Nature, poison, regeneration and support',
  'Sève vitale': 'Vital sap',
  'Tes compétences d’armes frappent avec la nature : elles empoisonnent (25 % des dégâts en plus sur 4 s) et soignent ton groupe proche de 5 % des dégâts. Tes compétences utilitaires soignent ton groupe proche de 8 % des PV max.':
    'Your weapon skills strike with nature: they poison (25% extra damage over 4 s) and heal your nearby group for 5% of the damage. Your utility skills heal your nearby group for 8% of max HP.',
  'Transformation (F pour entrer ou sortir) : +15 % de dégâts, +20 % de vitesse de déplacement, +8 points de critique et attaques de base 20 % plus rapides. En forme féline, la Sève vitale ne soigne plus et tes soins sont réduits de 30 %.':
    'Shapeshift (F to enter or leave): +15% damage, +20% movement speed, +8 critical points and basic attacks 20% faster. In cat form, Vital sap no longer heals and your healing is reduced by 30%.',
  'Ronces sauvages': 'Wild brambles',
  'Les compétences offensives ont 20 % de chance d’infliger 30 % de leurs dégâts en dégâts de nature sur 5 secondes.':
    'Offensive skills have a 20% chance to deal 30% of their damage as nature damage over 5 seconds.',
  'Régénération naturelle': 'Natural regeneration',
  'Restaure 1 % des PV maximum toutes les 5 secondes en combat.':
    'Restores 1% of maximum HP every 5 seconds in combat.',
  'Écorce protectrice': 'Protective bark',
  'Sous 40 % de PV, réduit les dégâts reçus de 15 % pendant 6 secondes. Recharge : 40 s.':
    'Below 40% HP, reduces damage taken by 15% for 6 seconds. Cooldown: 40 s.',
  'Toucher de vie': 'Touch of life',
  'Augmente les soins effectués de 15 %.': 'Increases healing done by 15%.',
  'Poison rampant': 'Creeping poison',
  'Les coups critiques ont 25 % de chance d’infliger un poison causant 40 % des dégâts du coup sur 6 secondes.':
    'Critical hits have a 25% chance to inflict a poison dealing 40% of the hit’s damage over 6 seconds.',
  'Bénédiction forestière': 'Forest blessing',
  'Soigner un allié lui accorde un bouclier de 8 % de ses PV maximum pendant 5 secondes. Recharge : 12 s par allié.':
    'Healing an ally grants them a shield worth 8% of their maximum HP for 5 seconds. Cooldown: 12 s per ally.',
  'Racines profondes': 'Deep roots',
  'Les compétences offensives ont 15 % de chance de ralentir la cible de 30 % pendant 3 secondes.':
    'Offensive skills have a 15% chance to slow the target by 30% for 3 seconds.',
  'Symbiose': 'Symbiosis',
  'Soigner un allié restaure également au Druide 25 % des PV réellement soignés.':
    'Healing an ally also restores 25% of the HP actually healed to the Druid.',
  'Fureur sauvage': 'Wild fury',
  'Inflige 12 % de dégâts supplémentaires aux ennemis affectés par ses poisons ou effets de nature.':
    'Deals 12% extra damage to enemies affected by their poisons or nature effects.',
  'Avatar de la nature': 'Avatar of nature',
  'Toutes les 45 s en combat, gagne +15 % de dégâts et +50 % de régénération naturelle pendant 8 secondes.':
    'Every 45 s in combat, gains +15% damage and +50% natural regeneration for 8 seconds.',
  'Paladin': 'Paladin',
  'Défense, protection des alliés et dégâts sacrés': 'Defense, ally protection and holy damage',
  'Protection, boucliers, soins et lumière sacrée': 'Protection, shields, healing and holy light',
  'Lumière sacrée': 'Holy light',
  'Tes compétences d’armes frappent avec la lumière : chaque compétence offensive te donne un bouclier de 5 % des PV max, chaque compétence utilitaire un bouclier de 10 % à ton groupe proche. Tes soins soignent aussi tes alliés à moins de 6 cases, à 50 %.':
    'Your weapon skills strike with light: each offensive skill gives you a shield worth 5% of max HP, each utility skill a 10% shield to your nearby group. Your heals also heal allies within 6 tiles, at 50%.',
  'Soigne toi et tes alliés à moins de 6 cases de 20 % de leurs PV maximum et réduit leurs dégâts reçus de 20 % pendant 6 secondes.':
    'Heals you and your allies within 6 tiles for 20% of their maximum HP and reduces their damage taken by 20% for 6 seconds.',
  'Frappe sacrée': 'Holy strike',
  'Les attaques normales ont 20 % de chance d’infliger 35 % de dégâts sacrés supplémentaires.':
    'Normal attacks have a 20% chance to deal 35% extra holy damage.',
  'Armure bénie': 'Blessed armor',
  'Augmente la Défense totale de 12 %.': 'Increases total Defense by 12%.',
  'Foi inébranlable': 'Unshakable faith',
  'Sous 35 % de PV, réduit les dégâts reçus de 20 % pendant 5 secondes. Recharge : 45 s.':
    'Below 35% HP, reduces damage taken by 20% for 5 seconds. Cooldown: 45 s.',
  'Lumière guérisseuse': 'Healing light',
  'Augmente les soins effectués de 12 % et les soins reçus de 8 %.':
    'Increases healing done by 12% and healing received by 8%.',
  'Consécration': 'Consecration',
  'Après 3 compétences offensives, crée une zone sacrée pendant 5 s infligeant 15 % de l’Attaque par seconde. Recharge : 15 s.':
    'After 3 offensive skills, creates a holy area for 5 s dealing 15% of Attack per second. Cooldown: 15 s.',
  'Gardien divin': 'Divine guardian',
  'Soigner un allié lui accorde un bouclier de 10 % de ses PV maximum pendant 5 secondes. Recharge : 15 s par allié.':
    'Healing an ally grants them a shield worth 10% of their maximum HP for 5 seconds. Cooldown: 15 s per ally.',
  'Jugement': 'Judgment',
  'Inflige 15 % de dégâts supplémentaires aux ennemis sous 30 % de PV.':
    'Deals 15% extra damage to enemies below 30% HP.',
  'Aura protectrice': 'Protective aura',
  'Les alliés à moins de 6 cases subissent 5 % de dégâts en moins. Effet non cumulable.':
    'Allies within 6 tiles take 5% less damage. Does not stack.',
  'Volonté sacrée': 'Holy will',
  'Subir un coup critique restaure 5 % des PV maximum. Recharge : 20 s.':
    'Taking a critical hit restores 5% of maximum HP. Cooldown: 20 s.',
  'Intervention divine': 'Divine intervention',
  'Une fois par combat, un coup fatal laisse le Paladin à 1 PV et lui accorde un bouclier de 25 % des PV maximum pendant 5 secondes.':
    'Once per fight, a fatal blow leaves the Paladin at 1 HP and grants a shield worth 25% of maximum HP for 5 seconds.',
  'Assassin': 'Assassin',
  'Dégâts critiques, saignements et mobilité': 'Critical damage, bleeds and mobility',
  'Critiques, saignements, mobilité et exécution': 'Criticals, bleeds, mobility and execution',
  'Tes compétences d’armes frappent avec l’ombre : +12 % de dégâts, +30 % de plus pour la compétence 4 contre une cible sous 50 % de PV ; une compétence utilitaire renforce la suivante de 25 %. +5 % de vitesse de déplacement et +10 % de dégâts critiques.':
    'Your weapon skills strike with shadow: +12% damage, +30% more for skill 4 against a target below 50% HP; a utility skill empowers the next one by 25%. +5% movement speed and +10% critical damage.',
  'Invisible pendant 4 secondes : les monstres t’ignorent (pas les boss ni les boss mondiaux) et tu gagnes +30 % de vitesse. Ta prochaine compétence offensive inflige +40 % de dégâts et met fin au voile.':
    'Invisible for 4 seconds: monsters ignore you (not bosses or world bosses) and you gain +30% speed. Your next offensive skill deals +40% damage and ends the veil.',
  'Lames empoisonnées': 'Poisoned blades',
  'Les attaques normales ont 20 % de chance d’infliger un poison causant 35 % des dégâts du coup sur 5 secondes.':
    'Normal attacks have a 20% chance to inflict a poison dealing 35% of the hit’s damage over 5 seconds.',
  'Précision mortelle': 'Deadly precision',
  'Augmente les chances de coup critique de 8 points de pourcentage.':
    'Increases critical hit chance by 8 percentage points.',
  'Danse des ombres': 'Shadow dance',
  'Après une esquive, augmente la vitesse de déplacement de 20 % pendant 3 secondes.':
    'After a dodge, increases movement speed by 20% for 3 seconds.',
  'Hémorragie': 'Hemorrhage',
  'Les coups critiques infligent un saignement causant 30 % des dégâts du coup sur 4 secondes.':
    'Critical hits inflict a bleed dealing 30% of the hit’s damage over 4 seconds.',
  'Exécuteur': 'Executioner',
  'Inflige 20 % de dégâts supplémentaires aux ennemis sous 25 % de PV.':
    'Deals 20% extra damage to enemies below 25% HP.',
  'Assaut implacable': 'Relentless assault',
  'Chaque attaque consécutive sur la même cible augmente les dégâts de 2 %, jusqu’à 10 %. Réinitialisation après 4 s sans toucher la cible.':
    'Each consecutive attack on the same target increases damage by 2%, up to 10%. Resets after 4 s without hitting the target.',
  'Instinct de survie': 'Survival instinct',
  'Sous 35 % de PV, gagne +20 % de vitesse de déplacement et 10 % de réduction des dégâts pendant 5 secondes. Recharge : 40 s.':
    'Below 35% HP, gains +20% movement speed and 10% damage reduction for 5 seconds. Cooldown: 40 s.',
  'Lame fantôme': 'Phantom blade',
  'Les compétences offensives ont 15 % de chance de déclencher une frappe supplémentaire infligeant 40 % des dégâts initiaux.':
    'Offensive skills have a 15% chance to trigger an extra strike dealing 40% of the initial damage.',
  'Prédateur solitaire': 'Lone predator',
  'Inflige 12 % de dégâts supplémentaires lorsqu’un seul ennemi se trouve dans un rayon de 5 cases.':
    'Deals 12% extra damage when only one enemy is within 5 tiles.',
  'Ombre meurtrière': 'Murderous shadow',
  'Après 3 coups critiques, la prochaine compétence offensive inflige 30 % de dégâts supplémentaires. Recharge : 15 s.':
    'After 3 critical hits, the next offensive skill deals 30% extra damage. Cooldown: 15 s.',
  'Élémentaliste': 'Elementalist',
  'Magie élémentaire, contrôle et dégâts de zone': 'Elemental magic, control and area damage',
  'Feu, glace, foudre et dégâts de zone': 'Fire, ice, lightning and area damage',
  'Maîtrise des éléments': 'Mastery of the elements',
  'Tes compétences d’armes deviennent élémentaires : 1 et 4 de feu (brûlure de 30 % des dégâts sur 4 s), 2 de glace (ralentit de 30 % pendant 2,5 s), 3 de foudre (rebondit sur 2 ennemis à 35 %). Une compétence utilitaire libère une décharge autour de toi.':
    'Your weapon skills become elemental: 1 and 4 are fire (burn for 30% of the damage over 4 s), 2 is ice (slows by 30% for 2.5 s), 3 is lightning (bounces to 2 enemies at 35%). A utility skill releases a discharge around you.',
  'Pendant 10 secondes : +20 % de dégâts et compétences 30 % moins chères en mana.':
    'For 10 seconds: +20% damage and skills cost 30% less mana.',
  'Flammes persistantes': 'Lingering flames',
  'Les compétences offensives ont 20 % de chance d’infliger une brûlure causant 35 % des dégâts initiaux sur 5 secondes.':
    'Offensive skills have a 20% chance to inflict a burn dealing 35% of the initial damage over 5 seconds.',
  'Cœur de glace': 'Heart of ice',
  'Les compétences offensives ont 20 % de chance de ralentir la cible de 30 % pendant 3 secondes.':
    'Offensive skills have a 20% chance to slow the target by 30% for 3 seconds.',
  'Surcharge électrique': 'Electric overload',
  'Les coups critiques ont 20 % de chance de déclencher un éclair supplémentaire infligeant 40 % des dégâts du coup.':
    'Critical hits have a 20% chance to trigger an extra lightning bolt dealing 40% of the hit’s damage.',
  'Affinité élémentaire': 'Elemental affinity',
  'Augmente les dégâts des effets de feu, glace et foudre de 15 %.':
    'Increases the damage of fire, ice and lightning effects by 15%.',
  'Explosion ardente': 'Blazing explosion',
  'Lorsqu’un ennemi brûlé meurt, il explose et inflige 50 % de l’Attaque aux ennemis dans un rayon de 3 cases.':
    'When a burning enemy dies, it explodes and deals 50% of Attack to enemies within 3 tiles.',
  'Barrière de givre': 'Frost barrier',
  'Sous 40 % de PV, gagne un bouclier de 15 % des PV maximum pendant 5 secondes. Recharge : 40 s.':
    'Below 40% HP, gains a shield worth 15% of maximum HP for 5 seconds. Cooldown: 40 s.',
  'Chaîne d’éclairs': 'Chain lightning',
  'Les compétences offensives ont 15 % de chance de propager un éclair à 2 ennemis proches, infligeant 25 % des dégâts initiaux à chacun.':
    'Offensive skills have a 15% chance to spread lightning to 2 nearby enemies, dealing 25% of the initial damage to each.',
  'Gel profond': 'Deep freeze',
  'Inflige 15 % de dégâts supplémentaires aux ennemis ralentis par ses effets de glace.':
    'Deals 15% extra damage to enemies slowed by their ice effects.',
  'Concentration arcanique': 'Arcane focus',
  'Chaque troisième compétence offensive coûte 50 % de mana en moins.':
    'Every third offensive skill costs 50% less mana.',
  'Tempête élémentaire': 'Elemental storm',
  'Toutes les 5 compétences offensives, déclenche une explosion infligeant 80 % de l’Attaque aux ennemis dans un rayon de 4 cases. Recharge : 12 s.':
    'Every 5 offensive skills, triggers an explosion dealing 80% of Attack to enemies within 4 tiles. Cooldown: 12 s.',
  'Invocateur': 'Summoner',
  'Invocations, peste et nécromancie': 'Summons, plague and necromancy',
  'Morts-vivants, poison qui s’accumule et armée d’os': 'Undead, stacking poison and an army of bone',
  'Peste noire': 'Black plague',
  'Tes attaques et chaque coup de tes invocations posent une charge de Peste (8 au maximum, 5 s, durée renouvelée à chaque charge) : chaque charge inflige 8 % de ton Attaque par seconde. Tu ne manies que ton Grimoire, qui grandit avec toi.':
    'Your attacks and each hit from your summons apply a Plague charge (8 at most, 5 s, refreshed with each charge): each charge deals 8% of your Attack per second. You wield only your Grimoire, which grows with you.',
  'Une vague de peste : les ennemis à moins de 7 cases reçoivent 4 charges de Peste et, pendant 8 secondes, tes invocations frappent 30 % plus vite.':
    'A wave of plague: enemies within 7 tiles receive 4 Plague charges and, for 8 seconds, your summons strike 30% faster.',
  'Virulence': 'Virulence',
  'La Peste monte jusqu’à 12 charges et dure 2 secondes de plus.':
    'Plague stacks up to 12 charges and lasts 2 seconds longer.',
  'Nécrose': 'Necrosis',
  'Toi et tes invocations infligez 2 % de dégâts supplémentaires par charge de Peste sur la cible.':
    'You and your summons deal 2% extra damage per Plague charge on the target.',
  'Os éternels': 'Eternal bones',
  'Tes invocations durent 30 % plus longtemps.': 'Your summons last 30% longer.',
  'Légion': 'Legion',
  'Tes squelettes frappent 20 % plus vite ; tes invocations infligent 10 % de dégâts supplémentaires.':
    'Your skeletons strike 20% faster; your summons deal 10% extra damage.',
  'Cadavres explosifs': 'Exploding corpses',
  'Une invocation qui disparaît explose : 60 % de l’Attaque et 3 charges de Peste aux ennemis à moins de 2,5 cases.':
    'A summon that vanishes explodes: 60% of Attack and 3 Plague charges to enemies within 2.5 tiles.',
  'Siphon pestilentiel': 'Pestilent siphon',
  'Les dégâts de ta Peste te soignent de 10 % de leur montant.':
    'Your Plague damage heals you for 10% of its amount.',
  'Carapace d’os': 'Bone carapace',
  'Avec au moins 2 invocations en jeu, tu subis 10 % de dégâts en moins.':
    'With at least 2 summons in play, you take 10% less damage.',
  'Pandémie': 'Pandemic',
  'Un ennemi qui meurt sous ta Peste la transmet : la moitié de ses charges passe aux ennemis à moins de 3 cases.':
    'An enemy that dies under your Plague spreads it: half of its charges pass to enemies within 3 tiles.',
  'Pacte de sang': 'Blood pact',
  'Sous 35 % de PV, sacrifie ta plus ancienne invocation pour récupérer 15 % de tes PV maximum. Recharge : 40 s.':
    'Below 35% HP, sacrifices your oldest summon to recover 15% of your maximum HP. Cooldown: 40 s.',
  'Moisson d’âmes': 'Soul harvest',
  'Toutes les 12 charges de Peste posées, un squelette se lève gratuitement à tes côtés. Recharge : 10 s.':
    'For every 12 Plague charges applied, a skeleton rises for free at your side. Cooldown: 10 s.',
  'Barde': 'Bard',
  'Soins de groupe, chants de soutien et ondes sonores': 'Group healing, support songs and sound waves',
  'Le soigneur du groupe : il soigne en frappant et renforce ses alliés':
    'The group’s healer: heals by striking and empowers allies',
  'Écho mélodieux': 'Melodic echo',
  'Tes compétences d’armes résonnent d’harmonie : chaque compétence offensive soigne l’allié le plus blessé à moins de 8 cases (toi compris) de 20 % des dégâts infligés ; chaque compétence utilitaire soigne ton groupe proche de 10 % de ses PV max. Tes soins sont augmentés de 10 %.':
    'Your weapon skills resonate with harmony: each offensive skill heals the most wounded ally within 8 tiles (you included) for 20% of the damage dealt; each utility skill heals your nearby group for 10% of their max HP. Your healing is increased by 10%.',
  'Soigne toi et tes alliés à moins de 8 cases de 15 % de leurs PV maximum, puis de 3 % par seconde pendant 6 secondes ; pendant ce temps, ils infligent 10 % de dégâts en plus.':
    'Heals you and your allies within 8 tiles for 15% of their maximum HP, then 3% per second for 6 seconds; meanwhile, they deal 10% more damage.',
  'Crescendo': 'Crescendo',
  'Chaque compétence offensive augmente tes dégâts de 3 %, jusqu’à 15 %, pendant 6 secondes.':
    'Each offensive skill increases your damage by 3%, up to 15%, for 6 seconds.',
  'Ballade réparatrice': 'Restoring ballad',
  'Contre-chant': 'Countersong',
  'Sous 40 % de PV, te soigne de 10 % des PV maximum et te donne un bouclier de 10 % pendant 5 secondes. Recharge : 40 s.':
    'Below 40% HP, heals you for 10% of maximum HP and gives you a 10% shield for 5 seconds. Cooldown: 40 s.',
  'Tes soins donnent à leur cible (toi compris) +10 % de vitesse de déplacement et +5 % de dégâts pendant 4 secondes.':
    'Your heals give their target (you included) +10% movement speed and +5% damage for 4 seconds.',
  'Dissonance': 'Dissonance',
  'Les ennemis touchés par tes compétences offensives subissent 8 % de dégâts en plus, de toi et de ton groupe, pendant 4 secondes.':
    'Enemies hit by your offensive skills take 8% more damage, from you and your group, for 4 seconds.',
  'Chœur': 'Choir',
  'Ton Écho mélodieux soigne aussi un deuxième allié blessé.':
    'Your Melodic echo also heals a second wounded ally.',
  'Note perçante': 'Piercing note',
  'Les coups critiques ont 25 % de chance de libérer une onde sonore infligeant 50 % des dégâts du coup aux ennemis à moins de 2,5 cases.':
    'Critical hits have a 25% chance to release a sound wave dealing 50% of the hit’s damage to enemies within 2.5 tiles.',
  'Inspiration': 'Inspiration',
  'Toutes les 4 compétences lancées, la suivante ne coûte pas de mana.':
    'After every 4 skills cast, the next one costs no mana.',
  'Ritournelle': 'Refrain',
  'Les soins qui dépassent les PV maximum deviennent un bouclier, jusqu’à 10 % des PV maximum de la cible pendant 5 secondes.':
    'Healing beyond maximum HP becomes a shield, up to 10% of the target’s maximum HP for 5 seconds.',
  'Grand final': 'Grand finale',
  'Toutes les 6 compétences offensives, un accord final inflige 120 % de l’Attaque aux ennemis à moins de 4 cases et soigne ton groupe proche de 8 % de ses PV max. Recharge : 12 s.':
    'Every 6 offensive skills, a final chord deals 120% of Attack to enemies within 4 tiles and heals your nearby group for 8% of their max HP. Cooldown: 12 s.',
  'Berserker': 'Berserker',
  'Corps à corps sauvage, sang versé et vol de vie': 'Savage melee, spilled blood and life steal',
  'Pendant 8 secondes, tu ne peux pas descendre sous 1 PV, tes attaques de base sont 25 % plus rapides et tes soins sont doublés. À la fin, tu perds 20 % de tes PV maximum (sans pouvoir en mourir).':
    'For 8 seconds, you cannot drop below 1 HP, your basic attacks are 25% faster and your healing is doubled. At the end, you lose 20% of your maximum HP (it cannot kill you).',
  'Tuer un ennemi réduit de 2 secondes les recharges de tes compétences.':
    'Killing an enemy reduces your skill cooldowns by 2 seconds.',
  'Cicatrices': 'Scars',
  'Chaque coup subi te donne une Cicatrice : +2 % de dégâts par Cicatrice, 10 au maximum, pendant 6 secondes (durée renouvelée). Un coup critique ennemi en donne 3.':
    'Each blow you take gives you a Scar: +2% damage per Scar, 10 at most, for 6 seconds (duration refreshed). An enemy critical hit gives 3.',
  'Dernier carré': 'Last stand',
  'Sous 15 % de PV, ta Soif de sang te rend 45 % des dégâts infligés au lieu de 15 % (le double après une compétence utilitaire).':
    'Below 15% HP, your Bloodthirst returns 45% of the damage dealt instead of 15% (double after a utility skill).',
  'Peau de fer': 'Iron skin',
  'Tu subis 1 % de dégâts en moins par tranche de 5 % de PV perdus (jusqu’à 18 %).':
    'You take 1% less damage per 5% of HP lost (up to 18%).',
  'Saignée': 'Bloodletting',
  'Tes compétences offensives font saigner leurs cibles : 30 % des dégâts infligés, en plus, sur 4 secondes.':
    'Your offensive skills make their targets bleed: 30% of the damage dealt, extra, over 4 seconds.',
  'Curée': 'Quarry',
  'Inflige 15 % de dégâts supplémentaires aux ennemis qui saignent.':
    'Deals 15% extra damage to bleeding enemies.',
  'Sang bouillant': 'Boiling blood',
  'Chaque fois que tu as dépensé 25 % de tes PV maximum pour tes compétences, ton sang explose : 150 % de l’Attaque aux ennemis à moins de 3 cases.':
    'Each time you have spent 25% of your maximum HP on skills, your blood explodes: 150% of Attack to enemies within 3 tiles.',
  'Passer sous 50 % de PV en combat te fait pousser un cri : toi et tes alliés à moins de 6 cases infligez 10 % de dégâts en plus pendant 6 secondes. Recharge : 30 s.':
    'Dropping below 50% HP in combat makes you let out a cry: you and your allies within 6 tiles deal 10% more damage for 6 seconds. Cooldown: 30 s.',
  'Carnage': 'Carnage',
  'Tuer un ennemi te soigne de 4 % de tes PV maximum.':
    'Killing an enemy heals you for 4% of your maximum HP.',
  'Immortel': 'Undying',
  'Une fois toutes les 90 s, un coup fatal te laisse à 1 PV et déclenche une Rage écarlate de 4 secondes, sans perte de PV à la fin.':
    'Once every 90 s, a fatal blow leaves you at 1 HP and triggers a 4-second Scarlet rage, with no HP lost at the end.',
  // ------------------------------------------------------------ Noms des objets (shared/data/item-names.js)
  'Épée émoussée': 'Blunted sword',
  'Hachettes rouillées': 'Rusty hatchets',
  'Bâton en bois mort': 'Deadwood staff',
  'Masse de chantier': 'Builder’s mallet',
  'Pique en bois taillé': 'Whittled pike',
  'Couteaux ébréchés': 'Chipped knives',
  'Arc de foire tordu': 'Warped fairground bow',
  'Rondache en bois vermoulu': 'Worm-eaten buckler',
  'Glaives rouillés': 'Rusty glaives',
  "Lame d'acier trempé": 'Tempered steel blade',
  'Haches de bûcheron': 'Woodcutter’s axes',
  'Bâton de disciple': 'Disciple’s staff',
  "Masse d'armes ferrée": 'Iron-shod mace',
  'Hallebarde de milicien': 'Militiaman’s halberd',
  'Poignards de maraudeur': 'Marauder’s daggers',
  'Arc composite de frondeur': 'Slinger’s composite bow',
  'Pavois de milice': 'Militia pavise',
  "Lames jumelles d'acier": 'Twin steel blades',
  'Trancheuse de mithril': 'Mithril slicer',
  'Fendeuses des gelées': 'Frost cleavers',
  'Sceptre des marées': 'Scepter of the tides',
  'Marteau de cristal': 'Crystal hammer',
  'Javelot des abysses': 'Javelin of the abyss',
  'Crocs de givre': 'Frost fangs',
  'Arc long de saphir': 'Sapphire longbow',
  'Écu de mithril étincelant': 'Gleaming mithril shield',
  'Sabres de cristal marin': 'Sea crystal sabers',
  "Lame d'éclipse": 'Eclipse blade',
  'Haches du massacreur': 'Slaughterer’s axes',
  'Sceptre du vide': 'Scepter of the void',
  'Marteau des tempêtes': 'Storm hammer',
  'Pique du gardien ténébreux': 'Pike of the dark guardian',
  "Lames de l'assassin": 'Assassin’s blades',
  "Grand arc de l'ombre": 'Great shadow bow',
  "Mur de l'éclipse": 'Wall of the eclipse',
  'Épées jumelles du crépuscule': 'Twin swords of twilight',
  "Lame de l'étincelle": 'Blade of the spark',
  'Dévoreuses de chair': 'Flesh devourers',
  "Sceptre de l'apocalypse": 'Scepter of the apocalypse',
  'Marteau du wyrm': 'Wyrm hammer',
  'Trident du drakôn': 'Trident of the drakôn',
  'Griffes de braise': 'Ember claws',
  'Traverseur de flammes': 'Flamewalker',
  'Égide de écaille-ardente': 'Blazescale aegis',
  'Trancheuses du désert ardent': 'Slicers of the burning desert',
  'Lame du continuum': 'Blade of the continuum',
  'Trancheuses astrales': 'Astral slicers',
  'Sceptre des constellations': 'Scepter of the constellations',
  'Masse de la singularité': 'Mace of the singularity',
  'Lance du continuum': 'Spear of the continuum',
  'Dagues de phase': 'Phase daggers',
  'Arc des constellations': 'Bow of the constellations',
  'Barrière de singularité': 'Singularity barrier',
  'Lames stellaires doubles': 'Twin stellar blades',
  'Luth de taverne': 'Tavern lute',
  'Luth du ménestrel': 'Minstrel’s lute',
  'Luth des troubadours': 'Troubadours’ lute',
  'Luth des sirènes': 'Sirens’ lute',
  "Luth de l'Aurore chantante": 'Lute of the singing Dawn',
  'Luth des échos éternels': 'Lute of eternal echoes',
  'Capuche trouée': 'Holey hood',
  'Épaulières usées': 'Worn shoulderpads',
  'Tunique en lin': 'Linen tunic',
  'Gants râpés': 'Threadbare gloves',
  'Bottes trouées': 'Holey boots',
  'Pendentif en pierre': 'Stone pendant',
  'Anneau en tôle': 'Tin ring',
  'Casque de la garde': 'Guard helmet',
  'Spallières en cuir': 'Leather spaulders',
  'Cuirasse renforcée': 'Reinforced cuirass',
  'Gants en cuir ajustés': 'Fitted leather gloves',
  'Bottes de patrouille': 'Patrol boots',
  'Amulette en os gravé': 'Carved bone amulet',
  'Bague de cuivre poli': 'Polished copper ring',
  'Heaume de mithril': 'Mithril helm',
  'Épaulières du traqueur': 'Tracker’s shoulderpads',
  'Plastron de givre': 'Frost breastplate',
  'Gants arcaniques': 'Arcane gloves',
  'Bottes du marcheur': 'Wanderer’s boots',
  'Pendentif de la brume': 'Mist pendant',
  'Anneau de saphir pur': 'Pure sapphire ring',
  'Casque de maître': 'Master’s helmet',
  'Spallières du conquérant': 'Conqueror’s spaulders',
  'Cuirasse du jugement': 'Cuirass of judgment',
  "Gants d'ombre-pas": 'Shadowstep gloves',
  "Bottes d'ombre-pas": 'Shadowstep boots',
  'Amulette du cœur nocturne': 'Amulet of the night heart',
  'Sceau du souverain': 'Sovereign’s seal',
  'Masque du drakôn': 'Mask of the drakôn',
  'Spallières de la fureur': 'Spaulders of fury',
  'Carapace de volcan': 'Volcano carapace',
  'Gants de brasier': 'Blaze gloves',
  'Bottes de marche-flamme': 'Flamewalker boots',
  'Amulette de la résurgence': 'Amulet of resurgence',
  'Anneau du pacte draconique': 'Ring of the draconic pact',
  'Visage du cosmos': 'Face of the cosmos',
  "Spallières d'éther": 'Ether spaulders',
  'Carapace de starlight': 'Starlight carapace',
  'Gants du vide': 'Void gloves',
  'Bottes de marche-vide': 'Voidwalker boots',
  "Pendentif de l'éternité": 'Pendant of eternity',
  'Anneau de la singularité': 'Ring of the singularity',
  'Grimoire de l’apprenti': 'Apprentice’s grimoire',
  'Grimoire des sépultures': 'Grimoire of the graves',
  'Codex putride': 'Putrid codex',
  'Codex de la peste noire': 'Codex of the black plague',
  'Tome des légions mortes': 'Tome of the dead legions',
  'Évangile du Fléau éternel': 'Gospel of the eternal Scourge',
  'Hache du maraudeur': 'Marauder’s axe',
  'Fendoir des clans': 'Clan cleaver',
  'Grande hache sanglante': 'Bloody great axe',
  'Hache du carnage': 'Axe of carnage',
  'Dévoreuse écarlate': 'Scarlet devourer',
  'Faucheuse des mille batailles': 'Reaper of a thousand battles',
  // ------------------------------------------------------------ Monde, donjons, raids et Arène (shared/data)
  'La Cave des Terriers Abandonnés': 'The Cave of the Abandoned Burrows',
  'Gardien des Os': 'Bone Guardian',
  'Grignotte, Reine des Rats': 'Nibbles, Queen of Rats',
  'Le Fossoyeur Bossu': 'The Hunchbacked Gravedigger',
  'Le Rat-Roi aux Mille Queues': 'The Thousand-Tailed Rat King',
  'La Mine Oubliée du Mithril': 'The Forgotten Mithril Mine',
  'Golem de Mithril': 'Mithril Golem',
  'Le Contremaître Kobold Grisch': 'Grisch the Kobold Foreman',
  'L’Araignée des Galeries': 'The Tunnel Spider',
  'Le Mineur Sans Visage': 'The Faceless Miner',
  'Le Sanctuaire de l’Éclipse': 'The Sanctuary of the Eclipse',
  'Oracle de l’Éclipse': 'Oracle of the Eclipse',
  'L’Acolyte du Crépuscule': 'The Acolyte of Dusk',
  'Le Gardien Solaire': 'The Solar Guardian',
  'L’Ombre de l’Astre Mort': 'The Shadow of the Dead Star',
  'La Citadelle des Pénitents': 'The Citadel of the Penitents',
  'Le Grand Inquisiteur': 'The Grand Inquisitor',
  'Le Geôlier Flagellant': 'The Flagellant Jailer',
  'La Mère Supérieure': 'The Mother Superior',
  'Le Pénitent Oublié': 'The Forgotten Penitent',
  'La Forge d’Écaille-Ardente': 'The Blazescale Forge',
  'Pyrrhax, Wyrm d’Écaille-Ardente': 'Pyrrhax, Blazescale Wyrm',
  'Maître-Forgeron Kraag': 'Master Smith Kraag',
  'L’Élémentaire de Scories': 'The Slag Elemental',
  'La Salamandre d’Obsidienne': 'The Obsidian Salamander',
  'La Fosse d’Expiation': 'The Pit of Atonement',
  'Le Bourreau de l’Expiation': 'The Executioner of Atonement',
  'Le Gardien des Chaînes': 'The Keeper of Chains',
  'La Pleureuse des Abysses': 'The Weeper of the Abyss',
  'Celui-qui-Rampe-au-Fond': 'He-Who-Crawls-Below',
  'Le Bastion du Roi Sanglant': 'The Bastion of the Blood King',
  'Le Roi Sanglant': 'The Blood King',
  'Le Maître-Chien Ravageur': 'The Ravaging Houndmaster',
  'Sire Écorcheur': 'Sir Flayer',
  'Le Chapelain Sanguin': 'The Sanguine Chaplain',
  'La Comtesse Écarlate': 'The Scarlet Countess',
  'Le Champion du Sang': 'The Champion of Blood',
  'Le Bourreau Masqué': 'The Masked Executioner',
  'La Dame Blanche du Bastion': 'The White Lady of the Bastion',
  'L’Aiguille du Continuum': 'The Needle of the Continuum',
  'Le Dévoreur Stellaire': 'The Stellar Devourer',
  'L’Horloger Fou': 'The Mad Clockmaker',
  'Le Gardien des Rouages': 'The Keeper of the Gears',
  'Le Sablier Vivant': 'The Living Hourglass',
  'La Tisseuse du Temps': 'The Weaver of Time',
  'L’Écho des Âges': 'The Echo of Ages',
  'Le Paradoxe Errant': 'The Wandering Paradox',
  'L’Enfant d’Avant le Temps': 'The Child Before Time',
  'Le Thronos du Séraphin Divin': 'The Thronos of the Divine Seraph',
  'Le Séraphin Divin': 'The Divine Seraph',
  'Le Chérubin Vigilant': 'The Vigilant Cherub',
  'L’Archonte Radieux': 'The Radiant Archon',
  'Le Trône Ailé': 'The Winged Throne',
  'La Sentinelle Auréolée': 'The Haloed Sentinel',
  'La Voix du Chœur': 'The Voice of the Choir',
  'L’Ange Déchu Sans Nom': 'The Nameless Fallen Angel',
  'Le Gardien du Septième Ciel': 'The Guardian of the Seventh Heaven',
  'Le Jugement de Célestia': 'The Judgment of Celestia',
  'L’Avatar du Jugement': 'The Avatar of Judgment',
  'Le Porte-Étoile': 'The Star-Bearer',
  'Le Héraut de Célestia': 'The Herald of Celestia',
  'L’Astrolabe Vivant': 'The Living Astrolabe',
  'La Balance Éternelle': 'The Eternal Scales',
  'Le Juge des Constellations': 'The Judge of the Constellations',
  'La Comète Écarlate': 'The Scarlet Comet',
  'Le Témoin du Premier Jour': 'The Witness of the First Day',
  'Normal': 'Normal',
  'Héroïque': 'Heroic',
  'La Mine Effondrée de Durgrim': 'The Collapsed Mine of Durgrim',
  'Grumbar, le Contremaître Maudit': 'Grumbar, the Cursed Foreman',
  'Le Chef d’Équipe Brisepierre': 'Crew Chief Stonebreaker',
  'La Foreuse Possédée': 'The Possessed Drill',
  'Le Nain Emmuré': 'The Walled-In Dwarf',
  'Les Halls Engloutis de Khaz-Ombral': 'The Sunken Halls of Khaz-Ombral',
  'Ombral, le Roi sous la Pierre': 'Ombral, the King under the Stone',
  'Le Héraut des Profondeurs': 'The Herald of the Depths',
  'La Garde de Pierre Noire': 'The Blackstone Guard',
  'Le Prince Noyé': 'The Drowned Prince',
  'La Crypte des Mille Tombes': 'The Crypt of a Thousand Tombs',
  'Le Fossoyeur Éternel': 'The Eternal Gravedigger',
  'Le Pilleur de Tombes': 'The Tomb Robber',
  'La Veuve des Cryptes': 'The Crypt Widow',
  'Le Mille-et-Unième Mort': 'The Thousand-and-First Dead',
  'Les Tréfonds Fongiques': 'The Fungal Depths',
  'La Reine des Spores': 'The Spore Queen',
  'Le Champignon Hurleur': 'The Howling Mushroom',
  'Le Mycélium Vivant': 'The Living Mycelium',
  'Le Cœur de Moisissure': 'The Heart of Mold',
  'Slime': 'Slime',
  'Loup': 'Wolf',
  'Squelette': 'Skeleton',
  'Spectre': 'Specter',
  'Araignée': 'Spider',
  'Golem': 'Golem',
  'Scorpion': 'Scorpion',
  'Élémentaire': 'Elemental',
  'Dragonnet': 'Whelp',
  'Gobelin': 'Goblin',
  'Pilleur': 'Raider',
  'Sanglier': 'Boar',
  'Ours': 'Bear',
  'Yéti': 'Yeti',
  'Troll': 'Troll',
  'Gardien astral': 'Astral guardian',
  'Chauve-souris': 'Bat',
  'Bandit': 'Bandit',
  'Mante des roseaux': 'Reed mantis',
  'Corbeau spectral': 'Spectral raven',
  'Basilic': 'Basilisk',
  'Drake des dunes': 'Dune drake',
  'Araignée venimeuse': 'Venomous spider',
  'Ent corrompu': 'Corrupted ent',
  'Chevalier déchu': 'Fallen knight',
  'Wisp': 'Wisp',
  'Molosse infernal': 'Hellhound',
  'Fée sauvage': 'Wild fairy',
  'Minotaure': 'Minotaur',
  'Serpent des glaces': 'Ice serpent',
  'Drake astral': 'Astral drake',
  'Ver des boues': 'Mud worm',
  'Taupe-garou': 'Weremole',
  'Scarabée foreur': 'Borer beetle',
  'Gobelin des mines': 'Mine goblin',
  'Sentinelle de pierre': 'Stone sentinel',
  'Spectre minier': 'Mining specter',
  'Squelette nain': 'Dwarf skeleton',
  'Gargouille': 'Gargoyle',
  'Goule': 'Ghoul',
  'Âme errante': 'Wandering soul',
  'Chevalier des tombes': 'Tomb knight',
  'Corbeau des tombes': 'Tomb raven',
  'Myconide': 'Myconid',
  'Limace des fanges': 'Mire slug',
  'Mille-pattes géant': 'Giant centipede',
  'Moustique des fanges': 'Mire mosquito',
  // Élites du monde (MOB_TYPES.elite).
  'Slime royal': 'Royal slime',
  'Loup alpha': 'Alpha wolf',
  'Squelette champion': 'Skeleton champion',
  'Spectre hurleur': 'Howling specter',
  'Mygale matriarche': 'Matriarch tarantula',
  'Golem ancien': 'Ancient golem',
  'Scorpion empereur': 'Emperor scorpion',
  'Élémentaire ardent': 'Blazing elemental',
  'Dragonnet colérique': 'Wrathful whelp',
  'Chef gobelin': 'Goblin chief',
  'Capitaine pilleur': 'Raider captain',
  'Vieux solitaire': 'Old tusker',
  'Grizzli balafré': 'Scarred grizzly',
  'Yéti ancestral': 'Ancestral yeti',
  'Troll des cavernes': 'Cave troll',
  'Gardien astral majeur': 'Greater astral guardian',
  'Chauve-souris vampire': 'Vampire bat',
  'Chef bandit': 'Bandit chief',
  'Mante tranchante': 'Razor mantis',
  'Corbeau de mauvais augure': 'Raven of ill omen',
  'Basilic ancien': 'Ancient basilisk',
  'Drake à crête': 'Crested drake',
  'Veuve des marais': 'Marsh widow',
  'Ent millénaire': 'Millennial ent',
  'Seigneur déchu': 'Fallen lord',
  'Feu follet ardent': 'Blazing wisp',
  'Molosse des enfers': 'Hound of the underworld',
  'Reine des fées': 'Fairy queen',
  'Minotaure ancien': 'Ancient minotaur',
  'Serpent du givre': 'Frost serpent',
  'Drake céleste': 'Celestial drake',
  'Ver dévoreur': 'Devourer worm',
  'Taupe-garou alpha': 'Alpha weremole',
  'Scarabée cuirassé': 'Armored beetle',
  'Contremaître gobelin': 'Goblin foreman',
  'Sentinelle runique': 'Runic sentinel',
  'Contremaître spectral': 'Spectral foreman',
  'Thane squelette': 'Skeleton thane',
  'Gargouille ancienne': 'Ancient gargoyle',
  'Goule vorace': 'Ravenous ghoul',
  'Âme tourmentée': 'Tormented soul',
  'Seigneur des tombes': 'Lord of the tombs',
  'Corbeau charognard': 'Carrion raven',
  'Myconide ancien': 'Ancient myconid',
  'Limace géante': 'Giant slug',
  'Mille-pattes royal': 'Royal centipede',
  'Moustique gorgé': 'Bloated mosquito',
  'Fenrir, Croc Ancien': 'Fenrir, Ancient Fang',
  'Nocturne, Gardien du Crépuscule': 'Nocturne, Guardian of Dusk',
  'Léviathan des Brumes': 'Leviathan of the Mists',
  'Golem des Étoiles': 'Star Golem',
  'Colosse des Cimes Éternelles': 'Colossus of the Eternal Peaks',
  'Ifrit, Cœur de Braise': 'Ifrit, Ember Heart',
  'Séraphin Déchu': 'Fallen Seraph',
  'Chronos, Dévoreur du Continuum': 'Chronos, Devourer of the Continuum',
  'Osselet': 'Knucklebone',
  'Rat des terriers': 'Burrow rat',
  'Mineur maudit': 'Cursed miner',
  'Mineur nain maudit': 'Cursed dwarf miner',
  'Kobold des galeries': 'Tunnel kobold',
  'Acolyte de l’Éclipse': 'Eclipse acolyte',
  'Ombre éclipsée': 'Eclipsed shadow',
  'Pénitent flagellant': 'Flagellant penitent',
  'Chevalier spectral': 'Spectral knight',
  'Diablotin des forges': 'Forge imp',
  'Dragonnet ardent': 'Blazing whelp',
  'Âme damnée': 'Damned soul',
  'Geôlier de la Fosse': 'Pit jailer',
  'Garde sanglant': 'Bloody guard',
  'Vampire écarlate': 'Scarlet vampire',
  'Rouage animé': 'Animated gear',
  'Ombre astrale': 'Astral shadow',
  'Séraphin corrompu': 'Corrupted seraph',
  'Sentinelle solaire': 'Solar sentinel',
  'Juge céleste': 'Celestial judge',
  'Héraut stellaire': 'Stellar herald',
  'Taupe des galeries': 'Tunnel mole',
  'Garde de pierre': 'Stone guard',
  'Esprit d’Ombral': 'Spirit of Ombral',
  'Goule des cryptes': 'Crypt ghoul',
  'Âme sans repos': 'Restless soul',
  'Porte-spores': 'Spore-bearer',
  'Larve des fanges': 'Mire larva',
  'Épreuves des champions': 'Trials of the champions',
  'Épreuves des vétérans': 'Trials of the veterans',
  'Épreuves des maîtres': 'Trials of the masters',
  'Épreuves légendaires': 'Legendary trials',
  'Gorath, le Gardien de Fer': 'Gorath, the Iron Guardian',
  'Fenrath, Croc des Ombres': 'Fenrath, Shadow Fang',
  'Tharok, le Colosse de Pierre': 'Tharok, the Stone Colossus',
  'Le colosse se fissure : sa colère fait trembler l’arène !':
    'The colossus cracks: its wrath shakes the arena!',
  'Morgana, la Sorcière des Brumes': 'Morgana, the Mist Witch',
  'Valdris, le Chevalier Déchu': 'Valdris, the Fallen Knight',
  'Hydrass, l’Hydre Écarlate': 'Hydrass, the Scarlet Hydra',
  'Zephiron, Seigneur des Tempêtes': 'Zephiron, Lord of Storms',
  'Kael’Thor, l’Exécuteur Astral': 'Kael’Thor, the Astral Executioner',
  'Ametheon, le Titan de Cristal': 'Ametheon, the Crystal Titan',
  'Le titan se couvre de prismes !': 'The titan covers itself in prisms!',
  'Ignaroth, le Dragon des Cendres': 'Ignaroth, the Ash Dragon',
  'Ignaroth embrase le ciel : les cendres pleuvent !': 'Ignaroth sets the sky ablaze: ash rains down!',
  'Nihil, l’Avatar du Néant': 'Nihil, Avatar of the Void',
  'Le Néant se dédouble…': 'The Void splits in two…',
  'Aurelion, le Souverain des Épreuves': 'Aurelion, Sovereign of the Trials',
  'Phase 1 : l’épée': 'Phase 1: the sword',
  'Phase 2 : la magie céleste': 'Phase 2: celestial magic',
  'Phase 3 : le jugement du Souverain': 'Phase 3: the Sovereign’s judgment',
  // ------------------------------------------------------------ Apparence du héros et tenues (shared/data)
  'Offensive': 'Offensive',
  'Arme': 'Weapon',
  'Utilitaire': 'Utility',
  'Chasseur': 'Hunter',
  'Briseur': 'Breaker',
  'Colosse': 'Colossus',
  'Gardien': 'Guardian',
  'Volonté de fer': 'Iron will',
  'Forteresse': 'Fortress',
  'Résilience': 'Resilience',
  'Régénération': 'Regeneration',
  'Arcane': 'Arcane',
  'Bénédiction': 'Blessing',
  'Tempête': 'Storm',
  'Écho': 'Echo',
  'Vampire': 'Vampire',
  'Résonance': 'Resonance',
  'Voyageur': 'Traveler',
  'Récupération': 'Recovery',
  'Élan': 'Momentum',
  'Miroir': 'Mirror',
  'Éclipse': 'Eclipse',
  'Transcendance': 'Transcendence',
  'Femme': 'Woman',
  'Homme': 'Man',
  'Humain': 'Human',
  'Orc': 'Orc',
  'Elfe': 'Elf',
  'Court': 'Short',
  'Long': 'Long',
  'Queue de cheval': 'Ponytail',
  'Tresses': 'Braids',
  'Crête': 'Mohawk',
  'Rasé': 'Shaved',
  'Acier et pourpre': 'Steel and purple',
  'Cramoisi': 'Crimson',
  'Forêt': 'Forest',
  'Nuit': 'Night',
  'Or royal': 'Royal gold',
  'Cuir de voyage': 'Traveling leather',
  'Rose des vents': 'Compass rose',
  'Habit de fermier': 'Farmer’s clothes',
  'Tunique de villageois': 'Villager’s tunic',
  'Ciré de pêcheur': 'Fisherman’s oilskin',
  'Tablier de cuisinier': 'Cook’s apron',
  'Chemise de bûcheron': 'Woodcutter’s shirt',
  'Cuir de rôdeur': 'Ranger’s leathers',
  'Robe d’apprenti mage': 'Apprentice mage’s robe',
  'Vareuse de marin': 'Sailor’s jacket',
  'Robe de moine': 'Monk’s robe',
  'Armure de garde du camp': 'Camp guard armor',
  'Armure de chevalier': 'Knight’s armor',
  'Robe de mage de bataille': 'Battle mage’s robe',
  'Parure de druide': 'Druid’s regalia',
  'Manteau de capitaine pirate': 'Pirate captain’s coat',
  'Armure de samouraï': 'Samurai armor',
  'Harnois de paladin': 'Paladin’s plate',
  'Robe de nécromancien': 'Necromancer’s robe',
  'Armure du chevalier de givre': 'Frost knight armor',
  'Tenue de ninja des ombres': 'Shadow ninja outfit',
  'Robe de la sorcière des fleurs': 'Flower witch’s robe',
  'Armure du chevalier-dragon': 'Dragon knight armor',
  'Vêtements du séraphin': 'Seraph’s garments',
  'Armure du seigneur démon': 'Demon lord armor',
  'Robe du phénix': 'Phoenix robe',
  'Armure de l’empereur céleste': 'Celestial emperor armor',
  'Armure du dragon d’or ancestral': 'Ancestral golden dragon armor',
  'Robe du souverain du néant': 'Robe of the void sovereign',
  'Parure du gardien de l’aurore': 'Regalia of the dawn guardian',
  'Tenue du rôdeur sylvestre': 'Sylvan ranger outfit',
  'Robe de mage de Sylvaëlle': 'Sylvaëlle mage robe',
  'Armure du gardien elfe': 'Elf guardian armor',
  'Parure de la reine des elfes': 'Regalia of the elf queen',
  // ------------------------------------------------------------ Meubles et énigmes (shared/data/house.js, puzzles.js)
  'Lit': 'Bed',
  'Grand lit': 'Large bed',
  'Table': 'Table',
  'Table ronde': 'Round table',
  'Chaise': 'Chair',
  'Banc': 'Bench',
  'Armoire': 'Wardrobe cabinet',
  'Bibliothèque': 'Bookcase',
  'Coffre': 'Chest',
  'Commode': 'Chest of drawers',
  'Cuisinière': 'Stove',
  'Cheminée': 'Fireplace',
  'Tonneau': 'Barrel',
  'Grande plante': 'Large plant',
  'Pot de fleurs': 'Flowerpot',
  'Lampe': 'Lamp',
  'Aquarium': 'Aquarium',
  'Tapis rouge': 'Red rug',
  'Tapis rond': 'Round rug',
  'Tapis long': 'Long rug',
  'Petit mouton': 'Little sheep',
  'Le petit voleur': 'The little thief',
  'Lueur d’Ilian': 'Ilian’s glow',
  'L’oiseau d’ombre': 'The shadow bird',
  'Feuille éternelle': 'Eternal leaf',
  'Bouteille de vent': 'Bottled wind',
  'Petit dragon': 'Little dragon',
  'Fenêtre': 'Window',
  'Grande fenêtre': 'Large window',
  'Cadre': 'Frame',
  'Grand tableau': 'Large painting',
  'Horloge': 'Clock',
  'Étagère': 'Shelf',
  'Trophée de chasse': 'Hunting trophy',
  'Rideaux rouges': 'Red curtains',
  'Rideaux bleus': 'Blue curtains',
  'Comptoir': 'Counter',
  'Présentoir à potions': 'Potion display',
  'Caisse de marchandises': 'Crate of goods',
  'Grande marmite': 'Large cauldron',
  'Sacs de grain': 'Grain sacks',
  'Casseroles suspendues': 'Hanging pans',
  'Herbes et jambons': 'Herbs and hams',
  'Trône de la Reine': 'Queen’s throne',
  'Harpe elfique': 'Elven harp',
  'Télescope': 'Telescope',
  'Autel de la Lune': 'Moon altar',
  'Métier à tisser': 'Loom',
  'Mannequin de couture': 'Dressmaker’s dummy',
  'Râtelier d’armes': 'Weapon rack',
  'Bannière de Sylvaëlle': 'Banner of Sylvaëlle',
  'Bannière de Durgrim': 'Banner of Durgrim',
  'Enclume': 'Anvil',
  'Pile de lingots d’or': 'Stack of gold ingots',
  'Botte de foin': 'Haystack',
  'Nichoirs à poules': 'Hen boxes',
  'Statue elfique': 'Elven statue',
  'Pilier de pierre runique': 'Runestone pillar',
  'étoile': 'star',
  'Hiver': 'Winter',
  // ------------------------------------------------------------ Métiers : poissons, gibier, recettes, minerais, herbes
  'Poisson doré': 'Golden fish',
  'L’étang d’Éloi (quête « Le poisson du vieux pêcheur »)': 'Éloi’s pond (quest “The old fisherman’s fish”)',
  'Le poisson que le vieil Éloi a poursuivi pendant quarante ans. Il ne se montre qu’à ceux qui savent lire les remous.':
    'The fish old Éloi chased for forty years. It only shows itself to those who can read the ripples.',
  'Gardon': 'Roach',
  'Lacs des Plaines et de la Forêt ancienne': 'Lakes of the Plains and the Ancient Forest',
  'Petit poisson argenté des lacs tranquilles. Il se promène en bande et adore les miettes de pain que les enfants du camp lui lancent.':
    'A small silvery fish of quiet lakes. It swims in schools and loves the bread crumbs the camp children toss to it.',
  'Truite': 'Trout',
  'Lacs des forêts et lacs scintillants': 'Forest lakes and shimmering lakes',
  'Rapide et tachetée, elle file dans les eaux fraîches. Les anciens disent qu’une truite qui saute annonce la pluie.':
    'Fast and speckled, it darts through cool waters. The elders say a leaping trout means rain is coming.',
  'Carpe': 'Carp',
  'Lacs des Plaines, du Marais et de la Forêt automnale':
    'Lakes of the Plains, the Marsh and the Autumn Forest',
  'Placide et gourmande, elle peut vivre plus vieille que le plus vieux des gardes. On raconte qu’une carpe dorée exauce un vœu… mais personne ne l’a jamais vue.':
    'Placid and greedy, it can outlive the oldest of the guards. They say a golden carp grants a wish… but no one has ever seen one.',
  'Silure des oasis': 'Oasis catfish',
  'Oasis du Désert oublié': 'Oases of the Forgotten Desert',
  'Moustachu et un brin grognon, il dort au fond des oasis pendant la chaleur du jour. Les caravaniers le saluent avec respect.':
    'Whiskered and a bit grumpy, it sleeps at the bottom of the oases through the heat of the day. Caravaneers greet it with respect.',
  'Saumon': 'Salmon',
  'En mer, tout autour de l’île': 'At sea, all around the island',
  'Voyageur infatigable, il traverse la mer entière pour revenir là où il est né. Sa chair rose fait la fierté des fumoirs.':
    'A tireless traveler, it crosses the whole sea to return where it was born. Its pink flesh is the pride of the smokehouses.',
  'Thon': 'Tuna',
  'Puissant nageur de la haute mer, il file plus vite qu’un cheval au galop. Il faut des bras solides pour le remonter !':
    'A powerful swimmer of the open sea, faster than a galloping horse. It takes strong arms to reel it in!',
  'Espadon': 'Swordfish',
  'En mer (rare)': 'At sea (rare)',
  'Le seigneur des vagues, armé d’une épée naturelle. Les pêcheurs le surnomment « le chevalier des mers ».':
    'Lord of the waves, armed with a natural sword. Fishermen call it “the knight of the seas”.',
  'Perche': 'Perch',
  'Lacs des Plaines verdoyantes': 'Lakes of the Verdant Plains',
  'Rayée de vert et de noir, la nageoire hérissée : elle chasse en bande au bord des roseaux.':
    'Striped green and black, fin bristling: it hunts in packs along the reeds.',
  'Brochet': 'Pike',
  'Lacs de la Forêt ancienne et de la Forêt automnale': 'Lakes of the Ancient Forest and the Autumn Forest',
  'Le loup des lacs : il guette, immobile, puis jaillit comme une flèche. Gare à ses dents !':
    'The wolf of the lakes: it lies in wait, motionless, then shoots out like an arrow. Mind its teeth!',
  'Anguille': 'Eel',
  'Lacs du Marais brumeux': 'Lakes of the Misty Marsh',
  'Glissante comme la brume, elle se faufile dans la vase. On dit qu’elle traverse les prés les nuits de pluie.':
    'Slippery as the mist, it slips through the mud. They say it crosses the meadows on rainy nights.',
  'Mérou': 'Grouper',
  'Gros, placide et curieux, il vient regarder les pêcheurs de ses yeux ronds avant de mordre.':
    'Big, placid and curious, it comes to look at fishermen with its round eyes before biting.',
  'Raie': 'Ray',
  'Elle vole sous les vagues comme un grand oiseau plat. Les marins disent qu’elle porte chance.':
    'It flies beneath the waves like a great flat bird. Sailors say it brings luck.',
  'Poisson-lune astral': 'Astral moonfish',
  'Lacs scintillants de la Forêt enchantée': 'Shimmering lakes of the Enchanted Forest',
  'Il brille doucement sous la surface. Certains pensent qu’il est tombé du ciel le jour où l’Aube s’est brisée.':
    'It glows softly beneath the surface. Some believe it fell from the sky the day the Dawn shattered.',
  'Poisson aveugle': 'Blind fish',
  'Lacs noirs des Galeries d’Argile et de la Nécropole (Tréfonds)':
    'Black lakes of the Clay Tunnels and the Necropolis (Depths)',
  'Pâle comme la craie et sans yeux, il se repère aux remous. Les nains disent qu’il entend battre le cœur des pêcheurs.':
    'Chalk-pale and eyeless, it finds its way by the ripples. Dwarves say it can hear the fishermen’s hearts beat.',
  'Poisson-lanterne': 'Lanternfish',
  'Lacs de Khaz-Ombral et de Fangeval (Tréfonds)': 'Lakes of Khaz-Ombral and Fangeval (Depths)',
  'Une petite lumière pend au bout de sa nageoire. Dans le noir des Tréfonds, c’est lui qui trouve les pêcheurs.':
    'A little light hangs from the tip of its fin. In the dark of the Depths, it is the one that finds the fishermen.',
  'Murène des grottes': 'Cave moray',
  'Lacs souterrains (Tréfonds)': 'Underground lakes (Depths)',
  'Elle se cache entre les roches immergées et mord tout ce qui passe. Même les nains la pêchent avec des gants.':
    'It hides among the sunken rocks and bites anything that passes. Even dwarves wear gloves to catch it.',
  'Silure fangeux': 'Mire catfish',
  'Lacs troubles de Fangeval (Tréfonds)': 'Murky lakes of Fangeval (Depths)',
  'Il vit dans la boue tiède et mange les spores qui tombent des champignons. Son goût est… surprenant.':
    'It lives in the warm mud and eats the spores that fall from the mushrooms. Its taste is… surprising.',
  'Lièvre': 'Hare',
  'Plaines et Forêt ancienne': 'Plains and Ancient Forest',
  'Vif et méfiant, il détale au moindre bruit. Approche-toi doucement… ou vise de loin avec un arc !':
    'Quick and wary, it bolts at the slightest sound. Approach gently… or aim from afar with a bow!',
  'Cerf': 'Deer',
  'Plaines et forêts': 'Plains and forests',
  'Majestueux roi des forêts, il sent le chasseur de loin. Ses bois tombent chaque hiver et repoussent au printemps.':
    'Majestic king of the forests, it scents the hunter from afar. Its antlers fall every winter and grow back in spring.',
  'Mouton sauvage': 'Wild sheep',
  'Troupeaux des Plaines': 'Flocks of the Plains',
  'Il broute paisiblement en troupeau et ne se méfie de rien. Un peu trop, peut-être.':
    'It grazes peacefully in a flock and suspects nothing. A little too much, perhaps.',
  'Grenouille': 'Frog',
  'Bord de l’eau du Marais': 'Marsh waterside',
  'Elle chante tout le soir dans le marais. Ses cuisses sautées sont un mets de choix au Camp de l’Aurore.':
    'It sings all evening in the marsh. Its sautéed legs are a delicacy at the Dawn Camp.',
  'Faisan': 'Pheasant',
  'Forêt ancienne et Forêt automnale': 'Ancient Forest and Autumn Forest',
  'Superbe et bruyant, il s’envole dans un grand fracas d’ailes quand on le surprend dans les fougères.':
    'Splendid and noisy, it takes off in a great clatter of wings when startled in the ferns.',
  'Canard colvert': 'Mallard',
  'Il barbote toute la journée entre les roseaux et cancane au moindre bruit.':
    'It paddles about among the reeds all day and quacks at the slightest sound.',
  'Chèvre des sables': 'Sand goat',
  'Désert oublié': 'Forgotten Desert',
  'Elle grimpe sur les dunes et les rochers brûlants, et broute ce que personne d’autre ne veut.':
    'It climbs the dunes and scorching rocks, and grazes on what no one else wants.',
  'Lézard des dunes': 'Dune lizard',
  'Il file entre les pierres chaudes plus vite qu’on ne cligne des yeux. Grillé, il paraît que c’est délicieux.':
    'It darts between the hot stones faster than you can blink. Grilled, it is said to be delicious.',
  'Bête astrale': 'Astral beast',
  'Forêt enchantée (cerfs et lièvres lumineux)': 'Enchanted Forest (glowing deer and hares)',
  'Cerfs et lièvres baignés de lumière d’étoiles. On dit que leur chair garde un peu de la magie du ciel.':
    'Deer and hares bathed in starlight. They say their flesh keeps a little of the sky’s magic.',
  'Crabe des sables': 'Sand crab',
  'Plages de toute l’île': 'Beaches all over the island',
  'Il fait le tour de l’île en marchant de côté, toujours au bord des vagues, et file à la moindre ombre. Sa chair est douce et sucrée.':
    'It walks sideways around the whole island, always at the edge of the waves, and scurries off at the slightest shadow. Its meat is tender and sweet.',
  'Taupe des cavernes': 'Cave mole',
  'Galeries d’Argile et Fangeval (Tréfonds)': 'Clay Tunnels and Fangeval (Depths)',
  'Grosse comme un chien, aveugle et têtue, elle creuse sans cesse. Les nains en font un ragoût réputé.':
    'As big as a dog, blind and stubborn, it never stops digging. Dwarves make a famous stew from it.',
  'Salamandre des ruines': 'Ruin salamander',
  'Cité Engloutie et Nécropole (Tréfonds)': 'Sunken City and Necropolis (Depths)',
  'Elle file entre les pierres froides, sa peau brille d’un orange de braise. On dit qu’elle ne craint pas le feu.':
    'It darts between the cold stones, its skin glowing ember orange. They say it fears no fire.',
  'Crapaud des fanges': 'Mire toad',
  'Boue de Fangeval (Tréfonds)': 'Fangeval mud (Depths)',
  'Gros, verruqueux et bruyant, il coasse toute la nuit éternelle des Tréfonds. Ses cuisses valent celles des grenouilles.':
    'Fat, warty and loud, it croaks all through the eternal night of the Depths. Its legs are as good as a frog’s.',
  'Viande de lièvre': 'Hare meat',
  'Venaison': 'Venison',
  'Gigot': 'Leg of mutton',
  'Cuisses de grenouille': 'Frog legs',
  'Chair astrale': 'Astral flesh',
  'Viande de faisan': 'Pheasant meat',
  'Magret de canard': 'Duck breast',
  'Viande de chèvre': 'Goat meat',
  'Queue de lézard': 'Lizard tail',
  'Viande de taupe': 'Mole meat',
  'Queue de salamandre': 'Salamander tail',
  'Chair de crabe': 'Crab meat',
  'Soupe de gardon': 'Roach soup',
  'Truite grillée': 'Grilled trout',
  'Carpe mijotée': 'Braised carp',
  'Silure aux épices': 'Spiced catfish',
  'Saumon fumé': 'Smoked salmon',
  'Ragoût de thon': 'Tuna stew',
  'Brochette d’espadon': 'Swordfish skewer',
  'Festin astral': 'Astral feast',
  'Civet de lièvre': 'Jugged hare',
  'Rôti de venaison': 'Roast venison',
  'Gigot aux herbes': 'Herbed leg of mutton',
  'Cuisses de grenouille sautées': 'Sautéed frog legs',
  'Banquet céleste': 'Celestial banquet',
  'Perche meunière': 'Perch meunière',
  'Quenelles de brochet': 'Pike quenelles',
  'Anguille fumée': 'Smoked eel',
  'Mérou grillé': 'Grilled grouper',
  'Raie aux câpres': 'Ray with capers',
  'Faisan rôti': 'Roast pheasant',
  'Ragoût de chèvre': 'Goat stew',
  'Brochette de lézard': 'Lizard skewer',
  'Crabe farci': 'Stuffed crab',
  'Infusion de menthe': 'Mint infusion',
  'Tisane de sauge': 'Sage tea',
  'Bouillon des brumes': 'Mist broth',
  'Soupe d’ortie': 'Nettle soup',
  'Jus d’aloès': 'Aloe juice',
  'Nectar de lys étoilé': 'Star lily nectar',
  'Poisson doré en croûte de sel': 'Salt-crusted golden fish',
  'Tajine de l’oasis': 'Oasis tagine',
  'Papillote de poisson aveugle': 'Blind fish en papillote',
  'Poisson-lanterne flambé': 'Flambéed lanternfish',
  'Murène en ragoût': 'Moray stew',
  'Silure fangeux fumé': 'Smoked mire catfish',
  'Ragoût de taupe des nains': 'Dwarven mole stew',
  'Salamandre grillée': 'Grilled salamander',
  'Décoction de racine de pierre': 'Stoneroot decoction',
  'Thé de lichen': 'Lichen tea',
  'Infusion de pavot funèbre': 'Funeral poppy infusion',
  'Velouté de champignons luisants': 'Glowing mushroom velouté',
  'Minerai de cuivre': 'Copper ore',
  'Minerai d’étain': 'Tin ore',
  'étain': 'tin',
  'Minerai de fer': 'Iron ore',
  'Minerai d’argent': 'Silver ore',
  'Pépite d’or': 'Gold nugget',
  'Minerai de mithril': 'Mithril ore',
  'Minerai de fer noir': 'Black iron ore',
  'fer noir': 'black iron',
  'Quartz ancien': 'Ancient quartz',
  'Obsidienne funèbre': 'Funeral obsidian',
  'Géode luisante': 'Glowing geode',
  'géode': 'geode',
  'Menthe sauvage': 'Wild mint',
  'Plaines verdoyantes': 'Verdant Plains',
  'Sauge des bois': 'Wood sage',
  'Forêt ancienne': 'Ancient Forest',
  'Mousse des brumes': 'Mist moss',
  'Marais brumeux': 'Misty Marsh',
  'Ortie rousse': 'Red nettle',
  'Forêt automnale': 'Autumn Forest',
  'Aloès des sables': 'Sand aloe',
  'Lys étoilé': 'Star lily',
  'Forêt enchantée': 'Enchanted Forest',
  'Racine de pierre': 'Stoneroot',
  'Galeries d’Argile (Tréfonds)': 'Clay Tunnels (Depths)',
  'Lichen des ruines': 'Ruin lichen',
  'Cité Engloutie (Tréfonds)': 'Sunken City (Depths)',
  'Pavot funèbre': 'Funeral poppy',
  'Nécropole des Oubliés (Tréfonds)': 'Necropolis of the Forgotten (Depths)',
  'Champignon luisant': 'Glowing mushroom',
  'Fangeval (Tréfonds)': 'Fangeval (Depths)',
  'Enchantement de Puissance': 'Power enchantment',
  'Enchantement de Critique': 'Critical enchantment',
  'Enchantement de Célérité': 'Haste enchantment',
  'Enchantement de Maîtrise': 'Mastery enchantment',
  'Enchantement de Soin': 'Healing enchantment',
  'Enchantement de Résistance': 'Resistance enchantment',
  'Rend {n} PV tout de suite': 'Restores {n} HP instantly',
  'Rend {n} mana tout de suite': 'Restores {n} mana instantly',
  'Rend {n} PV et {m} mana tout de suite': 'Restores {n} HP and {m} mana instantly',
  'Rend {n} PV par seconde pendant {s} s': 'Restores {n} HP per second for {s} s',
  'Rend {n} % des PV et du mana par seconde pendant {s} s':
    'Restores {n}% of HP and mana per second for {s} s',
  '{n} % de dégâts et −{m} % de dégâts subis pendant {s} min':
    '{n}% damage and −{m}% damage taken for {s} min',
  '{n} % de dégâts et +{m} % de vitesse pendant {s} min': '{n}% damage and +{m}% speed for {s} min',
  '{n} % de vitesse pendant {s} min': '{n}% speed for {s} min',
  '{n} % de dégâts pendant {s} min': '{n}% damage for {s} min',
  '{n} % de dégâts subis pendant {s} min': '{n}% damage taken for {s} min',
  // ------------------------------------------------------------ Lieux, régions et classes (panneau T)
  'Camp de l’Aurore': 'Dawn Camp',
  'Ferme de l’Aurore': 'Dawn Farm',
  'Le Souffle du Dragon': 'The Dragon’s Breath',
  'Capitaine Kaelor': 'Captain Kaelor',
  'Je suis Kaelor, capitaine du Souffle du Dragon.': 'I am Kaelor, captain of the Dragon’s Breath.',
  'Le Souffle du Dragon n’attend que le bon vent pour lever l’ancre.':
    'The Dragon’s Breath is only waiting for the right wind to weigh anchor.',
  'Cette figure de proue n’est pas qu’une sculpture. Certains soirs, ses yeux brûlent pour de vrai.':
    'That figurehead is more than a carving. Some nights, its eyes truly burn.',
  'Au-delà des brumes de l’ouest, le ciel s’assombrit. Les anciens parlent d’une éclipse…':
    'Beyond the western mists, the sky is darkening. The elders speak of an eclipse…',
  'Quand le moment viendra, j’aurai besoin d’un équipage courageux. Tiens-toi prêt.':
    'When the time comes, I will need a brave crew. Be ready.',
  'Chaumière des Glycines': 'Wisteria Cottage',
  'Échoppe de Lira': 'Lira’s Stall',
  'La Marmite dorée': 'The Golden Pot',
  'Demeure des Aubépines': 'Hawthorn House',
  'Demeure du Puits': 'Well House',
  'Refuge du Vieux Chêne': 'Old Oak Shelter',
  'Refuge des Clairières': 'Glade Shelter',
  'Refuge de l’Oasis': 'Oasis Shelter',
  'Camp des Dunes': 'Dune Camp',
  'Refuge des Pilotis': 'Stilt Shelter',
  'Refuge des Feuilles Rousses': 'Russet Leaf Shelter',
  'Refuge des Cristaux': 'Crystal Shelter',
  'Demeure de la Reine Elwë': 'Queen Elwë’s Residence',
  'Taverne de la Feuille d’Or': 'Golden Leaf Tavern',
  'Armurerie de Sylvaëlle': 'Sylvaëlle Armory',
  'Atelier de la Tisseuse': 'The Weaver’s Workshop',
  'Tour des Étoiles': 'Tower of the Stars',
  'Temple de la Lune': 'Temple of the Moon',
  'Maison des Feuillages': 'House of Leaves',
  'Maison des Racines': 'House of Roots',
  'Grange du Camp': 'Camp Barn',
  'Poulailler': 'Henhouse',
  'Grand Hall de Durgrim': 'Great Hall of Durgrim',
  'Forge de Durgrim': 'Forge of Durgrim',
  'Taverne de Dorn': 'Dorn’s Tavern',
  'Chambre forte de Gimra': 'Gimra’s Vault',
  'Maison de la famille Pied-de-Roc': 'Rockfoot Family House',
  'Maison de la famille Marteau-d’Or': 'Goldhammer Family House',
  'Initialisation du jeu incomplète': 'Game initialization incomplete',
  'Prairies, fleurs, buissons et petits bosquets. La région de départ.':
    'Meadows, flowers, bushes and small groves. The starting region.',
  'Grands arbres, sous-bois, champignons et clairières.': 'Tall trees, undergrowth, mushrooms and glades.',
  'Eau peu profonde, roseaux, arbres tordus et petits ponts en bois.':
    'Shallow water, reeds, twisted trees and small wooden bridges.',
  'Arbres rouges, orangés et dorés, feuilles au sol et petits lacs.':
    'Red, orange and golden trees, fallen leaves and small lakes.',
  'Dunes, oasis, ruines et cactus.': 'Dunes, oases, ruins and cacti.',
  'Arbres lumineux, cristaux, plantes magiques et lacs scintillants.':
    'Glowing trees, crystals, magical plants and shimmering lakes.',
  'Sylvaëlle, la Cité des Elfes': 'Sylvaëlle, City of the Elves',
  'Ruines de la Couronne': 'Ruins of the Crown',
  'Tour des Brumes': 'Tower of Mists',
  'Pierres des Anciens': 'Stones of the Ancients',
  'Ruines Oubliées': 'Forgotten Ruins',
  'Ruines des Sables': 'Sand Ruins',
  'Sanctuaire Oublié': 'Forgotten Sanctuary',
  'Ylvarë, l’Arbre-Ancien': 'Ylvarë, the Ancient Tree',
  'Ouvre le coffre (E), puis retourne à l’entrée': 'Open the chest (E), then return to the entrance',
  'MOISSON D’ÂMES': 'SOUL HARVEST',
  'EMBUSCADE +25 %': 'AMBUSH +25%',
  'OMBRE MEURTRIÈRE': 'MURDEROUS SHADOW',
  'CONSÉCRATION': 'CONSECRATION',
  'TEMPÊTE ÉLÉMENTAIRE': 'ELEMENTAL STORM',
  'Embuscade prête': 'Ambush ready',
  'Embuscade': 'Ambush',
  'Sans classe : choisis une classe au camp pour ajouter un effet à cette compétence.':
    'No class: choose a class at camp to add an effect to this skill.',
  'Druide : empoisonne les cibles (25 % des dégâts infligés, en plus, sur 4 s) et soigne ton groupe proche de 5 % des dégâts.':
    'Druid: poisons targets (25% of the damage dealt, extra, over 4 s) and heals your nearby group for 5% of the damage.',
  'Druide : soigne aussi toi et tes alliés à 6 cases de 8 % de leurs PV max.':
    'Druid: also heals you and your allies within 6 tiles for 8% of their max HP.',
  'Paladin : te donne un bouclier de 5 % de tes PV max pendant 4 s.':
    'Paladin: gives you a shield worth 5% of your max HP for 4 s.',
  'Paladin : toi et tes alliés à 6 cases gagnez un bouclier de 10 % des PV max pendant 5 s.':
    'Paladin: you and your allies within 6 tiles gain a shield worth 10% of max HP for 5 s.',
  'Assassin : +12 % de dégâts.': 'Assassin: +12% damage.',
  'Assassin : +12 % de dégâts, et encore +30 % contre une cible sous 50 % de ses PV.':
    'Assassin: +12% damage, and a further +30% against a target below 50% of its HP.',
  'Assassin : ta prochaine compétence offensive fait +25 % de dégâts (Embuscade).':
    'Assassin: your next offensive skill deals +25% damage (Ambush).',
  'Invocateur : chaque coup pose une charge de Peste (8 au maximum, 8 % de ton Attaque par charge et par seconde).':
    'Summoner: each hit applies a Plague charge (8 at most, 8% of your Attack per charge per second).',
  'Barde : soigne l’allié le plus blessé à 8 cases (toi compris) de 20 % des dégâts infligés.':
    'Bard: heals the most wounded ally within 8 tiles (you included) for 20% of the damage dealt.',
  'Barde : soigne aussi toi et tes alliés à 6 cases de 10 % de leurs PV max.':
    'Bard: also heals you and your allies within 6 tiles for 10% of their max HP.',
  'HYMNE DE L’AURORE': 'DAWN HYMN',
  'GRAND FINAL': 'GRAND FINALE',
  'CONTRE-CHANT': 'COUNTERSONG',
  'INSPIRATION : GRATUIT': 'INSPIRATION: FREE',
  'Berserker : se paie en PV au lieu du mana, et te rend 15 % des dégâts infligés.':
    'Berserker: paid with HP instead of mana, and returns 15% of the damage dealt to you.',
  'Berserker : se paie en PV ; ta prochaine compétence offensive te rend 30 % des dégâts infligés.':
    'Berserker: paid with HP; your next offensive skill returns 30% of the damage dealt to you.',
  'SANG BOUILLANT': 'BOILING BLOOD',
  'RAGE ÉCARLATE': 'SCARLET RAGE',
  'SOIF DE SANG ×2': 'BLOODTHIRST ×2',
  'Soif de sang prête': 'Bloodthirst ready',
  'CRI DE GUERRE': 'WAR CRY',
  'Immortel !': 'Undying!',
  'PV insuffisants': 'Not enough HP',
  'Sans mana': 'No mana',
  // Ressources des classes (shared/data/classes.js, RESOURCES).
  'Sans coût': 'No cost',
  'PV': 'HP',
  'Énergie': 'Energy',
  'Ferveur': 'Fervor',
  'Rythme': 'Rhythm',
  'Énergie {n}': 'Energy {n}',
  'Ferveur {n}': 'Fervor {n}',
  'Rythme {n}': 'Rhythm {n}',
  'Ressource · {nom}': 'Resource · {nom}',
  'Énergie insuffisante': 'Not enough energy',
  'Ferveur insuffisante': 'Not enough fervor',
  'Rythme insuffisant': 'Not enough rhythm',
  'Recharge {n} s · Énergie {m}': 'Cooldown {n} s · Energy {m}',
  'Recharge {n} s · Ferveur {m}': 'Cooldown {n} s · Fervor {m}',
  'Recharge {n} s · Rythme {m}': 'Cooldown {n} s · Rhythm {m}',
  'Grandit avec ton niveau et se régénère tout seul, plus lentement en combat.':
    'Grows with your level and regenerates on its own, more slowly in combat.',
  '100 points qui se rechargent très vite, même en plein combat.':
    '100 points that recharge very quickly, even in the middle of a fight.',
  'Part de zéro : monte quand tu frappes, et surtout quand tu es frappé ; retombe hors combat.':
    'Starts at zero: rises when you strike, and even more when you are struck; fades out of combat.',
  'Part de zéro : chaque attaque de base qui touche est une note qui le fait monter ; retombe hors combat.':
    'Starts at zero: every basic attack that hits is a note that raises it; fades out of combat.',
  'Tes compétences coûtent des PV, de plus en plus cher avec ton niveau : pas de barre de mana.':
    'Your skills cost HP, more and more as you level up: no mana bar.',
  'La Grande hache retourne au sang. Elle reviendra si tu redeviens Berserker.':
    'The Great axe returns to the blood. It will come back if you become a Berserker again.',
  'Ta Grande hache grandit :': 'Your Great axe grows:',
  '{element} : libère une décharge autour de toi (100 % de l’Attaque, rayon 2,5 cases).':
    '{element}: releases a discharge around you (100% of Attack, 2.5-tile radius).',
  'Feu : brûle les cibles (30 % des dégâts infligés, en plus, sur 4 s).':
    'Fire: burns targets (30% of the damage dealt, extra, over 4 s).',
  'Glace : ralentit les cibles de 30 % pendant 2,5 s.': 'Ice: slows targets by 30% for 2.5 s.',
  'Foudre : chaque coup rebondit sur 2 ennemis proches (35 % des dégâts).':
    'Lightning: each hit bounces to 2 nearby enemies (35% of the damage).',
  'INTERVENTION DIVINE': 'DIVINE INTERVENTION',
  'Intervention divine !': 'Divine intervention!',
  '{nom} : encore {n} s': '{nom}: {n} s left',
  'FORME NORMALE': 'NORMAL FORM',
  'Mana insuffisant': 'Not enough mana',
  'FORME FÉLINE': 'CAT FORM',
  'LUMIÈRE DIVINE': 'DIVINE LIGHT',
  'VOILE D’OMBRE': 'SHADOW VEIL',
  'AVATAR ÉLÉMENTAIRE': 'ELEMENTAL AVATAR',
  'CONTAGION': 'CONTAGION',
  'Choisis d’abord ta classe (T).': 'Choose your class first (T).',
  'Écorce protectrice !': 'Protective bark!',
  'Foi inébranlable !': 'Unshakable faith!',
  'Instinct de survie !': 'Survival instinct!',
  'BARRIÈRE DE GIVRE': 'FROST BARRIER',
  'Pacte de sang !': 'Blood pact!',
  'Avatar de la nature !': 'Avatar of nature!',
  'Nouvel emplacement de talent ! (T)': 'New talent slot! (T)',
  'Change de classe au Camp de l’Aurore.': 'Change class at the Dawn Camp.',
  'Impossible de changer de talent en combat.': 'Cannot change talents in combat.',
  'Ta classe': 'Your class',
  'Choisir {nom}': 'Choose {nom}',
  'Passif · {nom}': 'Passive · {nom}',
  'Passif : {nom}': 'Passive: {nom}',
  'Sort de classe (F) · {nom}': 'Class spell (F) · {nom}',
  'Mana {n}': 'Mana {n}',
  'recharge {n} s': 'cooldown {n} s',
  'Arme liée · {nom}': 'Bound weapon · {nom}',
  'Il prend ton niveau et grandit avec toi ; aucune autre arme ne peut s’équiper.':
    'It takes your level and grows with you; no other weapon can be equipped.',
  'Armes': 'Weapons',
  'Toutes les armes restent utilisables : leurs compétences prennent l’élément de la classe (':
    'All weapons remain usable: their skills take on the class element (',
  'Talents': 'Talents',
  'Choisis ta classe': 'Choose your class',
  'Classe précédente': 'Previous class',
  'Classe précédente (←)': 'Previous class (←)',
  'Classe suivante': 'Next class',
  'Classe suivante (→)': 'Next class (→)',
  'Chaque classe a 10 talents ; tu en équipes 5 au plus (un emplacement aux niveaux {liste}).':
    'Each class has 10 talents; you equip 5 at most (one slot at levels {liste}).',
  'Changer de classe est gratuit au Camp de l’Aurore ; tes talents sont retirés.':
    'Changing class is free at the Dawn Camp; your talents are removed.',
  'Retour aux talents': 'Back to talents',
  'Sort spécial (F) : {nom}': 'Special spell (F): {nom}',
  'Libre': 'Empty',
  'Talents équipés :': 'Talents equipped:',
  'prochain emplacement au niveau {n}': 'next slot at level {n}',
  'tous les emplacements sont ouverts': 'all slots are unlocked',
  'en combat : changements impossibles': 'in combat: no changes possible',
  'changements gratuits hors combat.': 'free changes out of combat.',
  'tous les emplacements sont ouverts.': 'all slots are unlocked.',
  'Retirer': 'Remove',
  'Complet': 'Full',
  'Équiper': 'Equip',
  'Changer de classe (gratuit)': 'Change class (free)',
  'Changer de classe : au Camp de l’Aurore': 'Change class: at the Dawn Camp',
  'Arme liée :': 'Bound weapon:',
  '{qualite} niveau {n}': '{qualite} level {n}',
  'elle grandit avec toi et change de nom tous les 10 niveaux.':
    'it grows with you and changes its name every 10 levels.',
  'Choisis ta classe : {liste} ou {nom} (touche T).': 'Choose your class: {liste} or {nom} (T key).',
  'Choisis ta classe (T)': 'Choose your class (T)',
  '{n}/{max} équipées': '{n}/{max} equipped',
  '{n}/48 découvertes': '{n}/48 discovered',
  'Retirer {nom}': 'Remove {nom}',
  'Toutes': 'All',
  'Clic : équiper ou retirer': 'Click: equip or remove',
  'Collection': 'Collection',
  'Rune {nom} équipée': 'Rune {nom} equipped',
  'N°{n}': 'No. {n}',
  'clic : retirer': 'click: remove',
  'Clic : équiper': 'Click: equip',
  // ------------------------------------------------------------ Panneau des métiers (P), récolte et enchantement
  'Pêche': 'Fishing',
  'Cuisine': 'Cooking',
  'Chasse': 'Hunting',
  'Minage': 'Mining',
  'Cueillette': 'Herbalism',
  'Enchanteur': 'Enchanting',
  '{metier} niveau {n} !': '{metier} level {n}!',
  'Qualité {qualite} débloquée.': '{qualite} quality unlocked.',
  'Aucun banc de poissons à portée : approche-toi des remous dans l’eau profonde.':
    'No school of fish in range: go up to the ripples in deep water.',
  'Sac plein : {nom} relâché.': 'Bag full: {nom} released.',
  '{nom} ({qualite})': '{nom} ({qualite})',
  '{nom} {qualite} pêché !': '{nom} {qualite} caught!',
  'Sac plein : impossible de ramasser la viande.': 'Bag full: cannot pick up the meat.',
  '{nom} : {viande} {qualite}': '{nom}: {viande} {qualite}',
  'nouvelle espèce dans ton carnet !': 'new species in your logbook!',
  'Tu remontes ta ligne.': 'You reel in your line.',
  'Approche-toi d’une cuisinière pour cuisiner (La Marmite dorée au camp ou un refuge).':
    'Go up to a stove to cook (The Golden Pot at camp, or a shelter).',
  'Sac plein : impossible de ranger d’autres repas.': 'Bag full: cannot store more meals.',
  '{n} × {nom} préparé.': '{n} × {nom} prepared.',
  '{n} × {nom} préparés.': '{n} × {nom} prepared.',
  'Encore {n} s avant un autre repas rapide.': '{n} s more before another quick meal.',
  '{nom} ({qualite}) : {effet}.': '{nom} ({qualite}): {effet}.',
  'Tu as bougé : la ligne est remontée.': 'You moved: the line was reeled in.',
  'Ça mord ! (E)': 'Got a bite! (E)',
  'Le poisson s’est échappé… Appuie sur E dès que ça mord.':
    'The fish got away… Press E as soon as it bites.',
  '[E] Pêcher': '[E] Fish',
  'Comment ça marche ?': 'How does it work?',
  'Maîtrise complète': 'Full mastery',
  'Meilleure qualité :': 'Best quality:',
  'Collection · {n} / {max} espèces découvertes': 'Collection · {n} / {max} species discovered',
  'Où : {lieu}': 'Where: {lieu}',
  'Banc de poissons +': 'School of fish +',
  'Ça mord :': 'Bite:',
  'vite': 'quickly',
  'Se cuisine': 'Can be cooked',
  'Les bancs sont des remous dans l’eau profonde (mer et lacs).':
    'Schools are ripples in deep water (sea and lakes).',
  'Approche-toi et appuie sur': 'Go up to one and press',
  'pour lancer ; quand ça mord': 'to cast; when it bites',
  'appuie vite sur': 'quickly press',
  'pour ferrer.': 'to hook it.',
  'Plus ton niveau est haut, meilleure est la qualité des prises.':
    'The higher your level, the better the quality of your catches.',
  'Tes poissons sont des objets de ton sac (I), par piles de 100.':
    'Your fish are items in your bag (I), in stacks of 100.',
  'Pêchés': 'Caught',
  'Attaque le gibier': 'Attack the game',
  'Arc ou bâton pour les craintifs': 'Bow or staff for the skittish ones',
  'Viande à cuisiner': 'Meat to cook',
  'Chasse le petit gibier avec ton arme (attaque normale) : lièvres, cerfs, moutons sauvages, grenouilles et bêtes astrales.':
    'Hunt small game with your weapon (normal attack): hares, deer, wild sheep, frogs and astral beasts.',
  'Les animaux craintifs fuient quand tu approches : un arc ou un bâton les atteint de loin.':
    'Skittish animals flee as you approach: a bow or a staff reaches them from afar.',
  'Chaque prise donne de la viande à cuisiner ; plus ton niveau est haut, meilleure est sa qualité.':
    'Each catch gives meat to cook; the higher your level, the better its quality.',
  'Ta viande est un objet de ton sac (I), par piles de 100.':
    'Your meat is an item in your bag (I), in stacks of 100.',
  'Chassés': 'Hunted',
  'Tu es près d’une cuisinière : tu peux cuisiner.': 'You are near a stove: you can cook.',
  'Va près d’une cuisinière : Marmite dorée (camp) ou refuge.':
    'Go near a stove: Golden Pot (camp) or a shelter.',
  '1 ingrédient = 1 repas (2 pour un festin)': '1 ingredient = 1 meal (2 for a feast)',
  'Qualité max :': 'Max quality:',
  '6 s, reste immobile': '6 s, stand still',
  'Un poisson, une viande ou une herbe donne un repas de sa qualité, plafonnée par ton niveau de cuisine (':
    'A fish, meat or herb gives a meal of its quality, capped by your cooking level (',
  'Il y a donc un bouton par qualité d’ingrédient.': 'So there is one button per ingredient quality.',
  'Les festins (Festin astral, Brochette d’espadon, Banquet céleste) demandent deux ingrédients.':
    'Feasts (Astral feast, Swordfish skewer, Celestial banquet) take two ingredients.',
  'Il faut {n} × {nom} pour ce repas.': 'You need {n} × {nom} for this meal.',
  'Préparer un repas prend 6 s (un peu plus en série) : reste immobile près de la cuisinière.':
    'Preparing a meal takes 6 s (a bit longer in batches): stand still near the stove.',
  'Les cuisinières : La Marmite dorée au Camp de l’Aurore et les refuges.':
    'Stoves: The Golden Pot at the Dawn Camp, and the shelters.',
  'Pas de {nom} dans ton sac.': 'No {nom} in your bag.',
  '{nom} ({qualite}) : encore {n} s': '{nom} ({qualite}): {n} s left',
  'Repas rapide (PV, mana) dans {n} s': 'Quick meal (HP, mana) in {n} s',
  'PV / mana : 20 s entre deux': 'HP / mana: 20 s between two',
  'Un seul bonus à la fois': 'Only one bonus at a time',
  'Manger': 'Eat',
  'Ton garde-manger est vide : pêche, puis cuisine près d’un feu.':
    'Your pantry is empty: fish, then cook near a fire.',
  'Cuisiner': 'Cook',
  'Enchanteur niveau {n} requis pour le {metal} (tu es niveau {m}).':
    'Enchanter level {n} required for {metal} (you are level {m}).',
  'Ce filon est épuisé : il se reforme bientôt.': 'This vein is depleted: it will re-form soon.',
  'Déjà cueillie : elle repousse bientôt.': 'Already picked: it will grow back soon.',
  'Sac plein : fais de la place pour récolter.': 'Bag full: make room to gather.',
  'Les enchantements se fabriquent à une forge : celle du Camp de l’Aurore, ou celle de la Forteresse de Durgrim (Tréfonds).':
    'Enchantments are made at a forge: the one at the Dawn Camp, or the one in the Fortress of Durgrim (Depths).',
  'Sac plein : impossible de ranger l’enchantement.': 'Bag full: cannot store the enchantment.',
  'Il faut {n} {minerai} pour cet enchantement.': 'You need {n} {minerai} for this enchantment.',
  '{n} × {nom} ({metal}) créé.': '{n} × {nom} ({metal}) created.',
  '{n} × {nom} ({metal}) créés.': '{n} × {nom} ({metal}) created.',
  '{objet} : enchantement remplacé, +{n} {stat}.': '{objet}: enchantment replaced, +{n} {stat}.',
  '{objet} : enchantement changé, +{n} {stat}.': '{objet}: enchantment changed, +{n} {stat}.',
  'Il faut aussi {n} × {nom} pour cet enchantement.': 'You also need {n} × {nom} for this enchantment.',
  'Il faut {n} × {nom} pour changer un enchantement.': 'You need {n} × {nom} to change an enchantment.',
  'Choisis une pièce déjà enchantée.': 'Choose an already enchanted piece.',
  'Cet enchantement donne déjà {stat}.': 'This enchantment already gives {stat}.',
  'Poudre en plus dès l’étain': 'Dust needed from tin upward',
  'Dès l’étain, il faut aussi de la poudre d’enchantement : démantèle les pièces dont tu n’as plus besoin (clic droit sur une pièce du sac).':
    'From tin upward, you also need enchanting dust: salvage the pieces you no longer need (right click a piece in the bag).',
  'Il manque de la poudre': 'Dust missing',
  'Changer la statistique d’un enchantement': 'Change an enchantment’s stat',
  'Choisis la statistique en haut ({stat}), puis clique une pièce enchantée : l’enchantement garde son métal.':
    'Choose the stat at the top ({stat}), then click an enchanted piece: the enchantment keeps its metal.',
  'Coût : {n} × {nom}': 'Cost: {n} × {nom}',
  'Aucune pièce enchantée.': 'No enchanted pieces.',
  '{objet} : +{n} {stat}.': '{objet}: +{n} {stat}.',
  'Termine d’abord ce que tu fais.': 'Finish what you are doing first.',
  'Va à la forge du Camp de l’Aurore pour fabriquer un enchantement.':
    'Go to the Dawn Camp forge to make an enchantment.',
  'Sac plein : libère une case pour ranger l’enchantement.':
    'Bag full: free a slot to store the enchantment.',
  'Interrompu : reste immobile pendant le travail.': 'Interrupted: stand still while working.',
  '[E] Miner': '[E] Mine',
  '[E] Cueillir': '[E] Gather',
  'Filon +': 'Ore vein +',
  '1 à 3 minerais': '1 to 3 ores',
  'Repousse en 90 s': 'Regrows in 90 s',
  'Pour l’Enchantement': 'For Enchanting',
  'Les filons sont des rochers aux éclats colorés. Un métal par biome :':
    'Ore veins are rocks with colored shards. One metal per biome:',
  'Les Tréfonds ont aussi des minerais rares, qui ne servent pas aux enchantements mais se vendent très cher.':
    'The Depths also have rare ores, which are not used for enchantments but sell for a lot.',
  'Plus ton niveau est haut, meilleure est la qualité.': 'The higher your level, the better the quality.',
  'Minerais dans ton sac': 'Ores in your bag',
  'Aucun minerai pour l’instant.': 'No ores yet.',
  'Herbe +': 'Herb +',
  'Infusions (Cuisine)': 'Infusions (Cooking)',
  'Les herbes sauvages sont de petites plantes fleuries. Une herbe par biome :':
    'Wild herbs are small flowering plants. One herb per biome:',
  'Herbes dans ton sac': 'Herbs in your bag',
  'Aucune herbe pour l’instant.': 'No herbs yet.',
  'Tu es à la forge : tu peux fabriquer.': 'You are at the forge: you can craft.',
  'Va à une forge pour fabriquer : Camp de l’Aurore (à l’est du feu) ou Forteresse de Durgrim (Tréfonds).':
    'Go to a forge to craft: Dawn Camp (east of the fire) or Fortress of Durgrim (Depths).',
  '{n} à {m} minerais du même métal = 1 enchantement': '{n} to {m} ores of the same metal = 1 enchantment',
  'Toutes les qualités comptent': 'All qualities count',
  'Ton niveau : +{n} % de force': 'Your level: +{n}% strength',
  'Choisis la statistique, puis le métal : plus le métal est rare, plus l’enchantement est fort, mais il demande un niveau d’enchanteur plus haut (':
    'Choose the stat, then the metal: the rarer the metal, the stronger the enchantment, but it requires a higher enchanting level (',
  'Les minerais les moins bons partent en premier.': 'The lowest-quality ores are used first.',
  'Fabriquer prend 10 s (2 s de plus par enchantement en série) : reste immobile.':
    'Crafting takes 10 s (2 s more per enchantment in a batch): stand still.',
  'Posé sur une pièce d’équipement (n’importe où), l’enchantement lui ajoute sa statistique en troisième secondaire ; un nouveau remplace l’ancien.':
    'Applied to a piece of gear (anywhere), the enchantment adds its stat as a third secondary; a new one replaces the old one.',
  'Ton niveau d’enchanteur renforce de {n} % ceux que tu poses.':
    'Your enchanting level strengthens the ones you apply by {n}%.',
  'Enchanteur niv. {n}': 'Enchanter lv. {n}',
  'Il manque {n} minerai': '{n} ore missing',
  'Il manque {n} minerais': '{n} ores missing',
  'Va à la forge': 'Go to the forge',
  'tu en as {n}': 'you have {n}',
  'Poser un enchantement': 'Apply an enchantment',
  'Aucun enchantement dans ton sac.': 'No enchantments in your bag.',
  'Puis clique la pièce à enchanter': 'Then click the piece to enchant',
  '(portée)': '(worn)',
  'actuel : +{n} {stat}': 'current: +{n} {stat}',
  'deviendra : +{n} {stat}': 'will become: +{n} {stat}',
  // ------------------------------------------------------------ Fouilles : pelle, trésors et reliques (digging.js)
  'Le sol est trop dur ici : creuse dans la terre, l’herbe ou le sable.':
    'The ground is too hard here: dig in soil, grass or sand.',
  'Tu as déjà creusé ici.': 'You already dug here.',
  'Tu as déjà ta pelle.': 'You already have your shovel.',
  'Va voir un marchand pour acheter la pelle.': 'Visit a merchant to buy the shovel.',
  'Il te manque {n} or pour la pelle.': 'You need {n} more gold for the shovel.',
  'Pelle achetée ! Appuie sur E sur la terre, l’herbe ou le sable pour creuser.':
    'Shovel bought! Press E on soil, grass or sand to dig.',
  'Pelle achetée !': 'Shovel bought!',
  'Appuie sur E sur la terre, l’herbe ou le sable pour creuser.': 'Press E on soil, grass or sand to dig.',
  'Il te faut une pelle : le marchand en vend une.': 'You need a shovel: the merchant sells one.',
  'Relique trouvée : {nom} !': 'Relic found: {nom}!',
  'Collection des fouilles : {n} / {m} (touche V).': 'Dig collection: {n} / {m} (V key).',
  'Sac plein : tu laisses {nom} au fond du trou.':
    'Materials full: you leave {nom} at the bottom of the hole.',
  'Rien qu’un ver de terre…': 'Just an earthworm…',
  'Pelle de fouilleur': 'Digger’s shovel',
  'Creuse la terre, l’herbe et le sable de l’île (touche E) : de l’or, des trésors à vendre et des reliques à collectionner (touche V).':
    'Dig the island’s soil, grass and sand (E key): gold, treasures to sell and relics to collect (V key).',
  'Tu as ta pelle': 'You have your shovel',
  'Acheter la pelle': 'Buy the shovel',
  'Fouilles': 'Digging',
  'Reliques trouvées': 'Relics found',
  'ta pelle est prête : E sur la terre, l’herbe ou le sable de l’île.':
    'your shovel is ready: E on the island’s soil, grass or sand.',
  'achète une pelle chez un marchand ({n} or) pour creuser.':
    'buy a shovel from a merchant ({n} gold) to dig.',
  'Pas encore déterrée.': 'Not dug up yet.',
  'Trésors à vendre': 'Treasures to sell',
  'Trésor déterré': 'Unearthed treasure',
  'Poussière d’enchantement': 'Enchanting Dust',
  'Essence d’enchantement': 'Enchanting Essence',
  'Éclat d’enchantement': 'Enchanting Shard',
  'Poudre d’enchantement': 'Enchanting dust',
  'Obtenue en démantelant un équipement (clic droit sur une pièce du sac).':
    'Obtained by salvaging gear (right click a piece in the bag).',
  'L’enchanteur s’en sert, avec les minerais, pour forger les enchantements des métaux rares et pour changer la statistique d’un enchantement posé.':
    'The enchanter uses it, along with ores, to forge enchantments of the rare metals and to change the stat of an applied enchantment.',
  'Trouvé en creusant avec la pelle.': 'Found by digging with the shovel.',
  'Le marchand le rachète {n} or.': 'The merchant buys it for {n} gold.',
  'Trouvé en creusant avec la pelle. Le marchand le rachète {n} or.':
    'Found by digging with the shovel. The merchant buys it for {n} gold.',
  '{nom} : à vendre chez un marchand.': '{nom}: sell it to a merchant.',
  'Tesson de poterie': 'Pottery shard',
  'Fer à cheval rouillé': 'Rusty horseshoe',
  'Pièce ancienne': 'Ancient coin',
  'Bouton de nacre': 'Mother-of-pearl button',
  'Clé rouillée': 'Rusty key',
  'Anneau terni': 'Tarnished ring',
  'Éclat d’ambre': 'Amber shard',
  'Grosse pépite d’or': 'Large gold nugget',
  'Écu des anciens rois': 'Crown of the old kings',
  'Perle noire': 'Black pearl',
  'Toupie de bois peint': 'Painted wooden top',
  'Un jouet d’enfant aux couleurs presque effacées. Elle tourne encore, en chantonnant un peu.':
    'A child’s toy with almost faded colours. It still spins, humming a little.',
  'Sifflet de berger': 'Shepherd’s whistle',
  'Taillé dans un os de mouton. Les moutons sauvages des Plaines dressent encore l’oreille quand il sonne.':
    'Carved from a sheep bone. The wild sheep of the Plains still prick up their ears when it sounds.',
  'Médaille des premiers colons': 'First settlers’ medal',
  'Frappée pour ceux qui ont allumé le premier feu du Camp de l’Aurore. Le nom gravé au dos est illisible.':
    'Struck for those who lit the first fire of the Dawn Camp. The name engraved on the back is unreadable.',
  'Gland de bronze': 'Bronze acorn',
  'Les druides en enterraient un au pied de chaque arbre planté. Celui-ci n’a jamais germé… pour l’instant.':
    'Druids buried one at the foot of every tree they planted. This one never sprouted… yet.',
  'Masque d’écorce': 'Bark mask',
  'Porté lors des fêtes de la sève. On raconte qu’il laisse entendre le murmure des vieux chênes.':
    'Worn at the sap festivals. They say it lets you hear the whisper of the old oaks.',
  'Pipeau de sureau': 'Elder pipe',
  'Trois trous seulement, mais un son si doux que les oiseaux de la Forêt ancienne lui répondent.':
    'Only three holes, but a sound so sweet that the birds of the Ancient Forest answer it.',
  'Grenouille de jade': 'Jade frog',
  'Une statuette porte-bonheur des pêcheurs du marais. Elle est toujours un peu humide au toucher.':
    'A lucky charm of the marsh fishermen. It always feels a little damp.',
  'Fiole de brume': 'Vial of mist',
  'Bouchée à la cire depuis des siècles : la brume prisonnière tourbillonne encore à l’intérieur.':
    'Sealed with wax for centuries: the trapped mist still swirls inside.',
  'Cloche engloutie': 'Sunken bell',
  'Elle appelait les barques avant que le village ne disparaisse sous les eaux. Elle sent la vase et le vieux bronze.':
    'It called the boats home before the village vanished under the water. It smells of mud and old bronze.',
  'Feuille d’or fin': 'Fine gold leaf',
  'Une feuille d’érable battue dans l’or le plus pur, offerte jadis au plus beau des automnes.':
    'A maple leaf beaten from the purest gold, once offered to the most beautiful of autumns.',
  'Sceau du bûcheron': 'Woodcutter’s seal',
  'La marque de la guilde des bûcherons : une hache et un gland. Chaque tronc vendu en portait l’empreinte.':
    'The mark of the woodcutters’ guild: an axe and an acorn. Every log sold bore its print.',
  'Gobelet d’érable': 'Maple cup',
  'On y buvait le cidre chaud de la fête des récoltes. Une odeur de pomme cuite s’en échappe encore.':
    'Hot cider was drunk from it at the harvest festival. It still smells of baked apple.',
  'Scarabée d’émeraude': 'Emerald scarab',
  'Les caravaniers le cousaient à leur turban pour ne jamais perdre le chemin de l’oasis.':
    'Caravaneers sewed it to their turbans so they would never lose the way to the oasis.',
  'Sablier fêlé': 'Cracked hourglass',
  'Le sable y coule vers le haut. Personne n’a jamais su pourquoi, et personne n’ose le réparer.':
    'The sand flows upwards. No one has ever known why, and no one dares to fix it.',
  'Masque solaire': 'Sun mask',
  'Le masque d’or des prêtres du Désert oublié. Il reste tiède, même au cœur de la nuit.':
    'The golden mask of the priests of the Forgotten Desert. It stays warm, even in the dead of night.',
  'Plume d’étoile': 'Star feather',
  'Tombée d’un oiseau qu’aucun chasseur n’a jamais vu. Elle luit doucement dans le noir.':
    'Dropped by a bird no hunter has ever seen. It glows softly in the dark.',
  'Boîte à musique': 'Music box',
  'Quand on l’ouvre, elle joue une berceuse que tous les habitants de l’île ont l’impression de connaître.':
    'When opened, it plays a lullaby that everyone on the island feels they know.',
  'Œuf de cristal': 'Crystal egg',
  'Quelque chose remue parfois à l’intérieur. Les elfes disent qu’il éclora le jour où l’île n’aura plus peur.':
    'Something sometimes stirs inside. The elves say it will hatch the day the island is no longer afraid.',

  // ------------------------------------------------------------ Groupe, échange, coopératif en ligne et portails
  'Épée de recrue': 'Recruit’s sword',
  'Tunique du voyageur': 'Traveler’s tunic',
  'Aventure ?': 'Adventure?',
  'Compagnon': 'Companion',
  'se relève.': 'gets back up.',
  'Déconnecté': 'Disconnected',
  'place gardée': 'place kept',
  'À terre': 'Down',
  'En ligne': 'Online',
  'Présent': 'Present',
  'Absent': 'Away',
  'Supprimer ce héros ? Son équipement, son sac et sa progression seront perdus.':
    'Delete this hero? Their gear, bag and progress will be lost.',
  'PV {n} / {max}': 'HP {n} / {max}',
  '{n} victimes': '{n} kills',
  '{n} / 40': '{n} / 40',
  'Renvoyer': 'Dismiss',
  'Faire venir': 'Bring along',
  'Équiper le meilleur': 'Equip the best',
  'Pare-feu actif sur ce PC : il peut bloquer ton invité. Une seule fois, dans un terminal :':
    'Firewall active on this PC: it may block your guest. Once only, in a terminal:',
  'Si ton invité n’arrive pas à se connecter : autorise ce port dans ton pare-feu':
    'If your guest cannot connect: allow this port in your firewall',
  '(Windows le propose à la première ouverture : accepte « réseaux privés »).':
    '(Windows offers this the first time: accept “private networks”).',
  'Adresse sur ton réseau :': 'Address on your network:',
  'Autres adresses de ce PC :': 'Other addresses of this PC:',
  'Adresse Tailscale :': 'Tailscale address:',
  'Ou par son nom :': 'Or by its name:',
  'Ton ami doit avoir Tailscale lancé et être dans ton réseau Tailscale (tu l’invites depuis la console Tailscale, ou tu partages cette machine avec lui).':
    'Your friend must have Tailscale running and be on your Tailscale network (invite them from the Tailscale console, or share this machine with them).',
  '{n} invité(s) en ligne': '{n} guest(s) online',
  'Copier l’invitation': 'Copy the invitation',
  'Fermer le salon': 'Close the room',
  'Jouer avec Tailscale': 'Play with Tailscale',
  'Jouer en réseau local': 'Play on local network',
  'Un ami loin : installez tous les deux Tailscale (gratuit), mettez-vous dans le même réseau Tailscale, puis ouvre le salon ici.':
    'A friend far away: both install Tailscale (free), join the same Tailscale network, then open the room here.',
  'Quelqu’un chez toi : le relais s’ouvre sur ton réseau, sans Internet.':
    'Someone at your place: the relay opens on your network, no Internet needed.',
  'Dans les deux cas, copie l’invitation et envoie-la.': 'Either way, copy the invitation and send it.',
  'Ou un relais déjà lancé (serveur, npm run relay)': 'Or a relay already running (server, npm run relay)',
  'Ouvrir à mes amis': 'Open to my friends',
  'Tes amis te rejoignent en ligne avec le code du salon ; un compagnon local suit ton héros et combat seul.':
    'Your friends join you online with the room code; a local companion follows your hero and fights on its own.',
  'Chacun garde son propre butin, et tous sont enregistrés dans cette aventure : {n} au plus, {m} présents à la fois.':
    'Everyone keeps their own loot, and all are saved in this adventure: {n} at most, {m} present at once.',
  'Aucun compagnon pour l’instant.': 'No companions yet.',
  'Nouveau compagnon': 'New companion',
  'Le groupe est complet ({n} compagnons).': 'The group is full ({n} companions).',
  '{nom} rejoint le groupe.': '{nom} joins the group.',
  '{nom} est enregistré (absent : trois compagnons sont déjà là).':
    '{nom} is saved (away: three companions are already here).',
  '{nom} arrive.': '{nom} arrives.',
  'Trois compagnons sont déjà présents.': 'Three companions are already present.',
  '{nom} quitte le groupe.': '{nom} leaves the group.',
  '{n} pièce(s) équipée(s).': '{n} piece(s) equipped.',
  'Rien de mieux dans son sac.': 'Nothing better in their bag.',
  'Compagnon supprimé.': 'Companion deleted.',
  'Hôte': 'Host',
  '{nom} est déjà en train d’échanger.': '{nom} is already trading.',
  'Termine d’abord ton échange en cours.': 'Finish your current trade first.',
  '{nom} te propose un échange (touche J).': '{nom} offers you a trade (J key).',
  'Demande d’échange envoyée à {nom}.': 'Trade request sent to {nom}.',
  '{nom} a refusé l’échange.': '{nom} declined the trade.',
  '{nom} accepte : l’échange est ouvert.': '{nom} accepts: the trade is open.',
  'Échange ouvert avec {nom}.': 'Trade open with {nom}.',
  '{nom} a annulé l’échange.': '{nom} cancelled the trade.',
  'Un objet proposé n’est plus dans le sac : échange suspendu.':
    'An offered item is no longer in the bag: trade paused.',
  'Or insuffisant : échange suspendu.': 'Not enough gold: trade paused.',
  'Sac trop plein pour {nom} : échange suspendu.': 'Bag too full for {nom}: trade paused.',
  'Échange réussi : {a} donne {x}, {b} donne {y}.': 'Trade complete: {a} gives {x}, {b} gives {y}.',
  '{n} objet': '{n} item',
  '{n} objets': '{n} items',
  '{n} objet et {m} or': '{n} item and {m} gold',
  '{n} objets et {m} or': '{n} items and {m} gold',
  'rien': 'nothing',
  '{a} ⇄ {b} : échange conclu.': '{a} ⇄ {b}: trade concluded.',
  'Échange annulé : un joueur est parti.': 'Trade cancelled: a player left.',
  'Demande d’échange sans réponse.': 'Trade request got no answer.',
  'Aucun autre joueur en ligne pour l’instant.': 'No other player online for now.',
  'Ouvre un salon (G) et envoie l’invitation à tes amis.':
    'Open a room (G) and send the invitation to your friends.',
  'Les compagnons locaux reçoivent leur équipement depuis le panneau Groupe.':
    'Local companions get their gear from the Group panel.',
  'Échanger avec {nom}': 'Trade with {nom}',
  'Aucun objet.': 'No items.',
  'Retirer de l’offre': 'Remove from the offer',
  'Proposé par {nom}': 'Offered by {nom}',
  'Ton offre': 'Your offer',
  'Validé': 'Confirmed',
  'Or (tu as {n})': 'Gold (you have {n})',
  'Proposer': 'Offer',
  'Offre de {nom}': '{nom}’s offer',
  'Ne plus valider': 'Unconfirm',
  'Valider l’échange': 'Confirm the trade',
  'L’échange se fait quand vous avez validé tous les deux. Changer une offre annule les validations.':
    'The trade happens once you have both confirmed. Changing an offer cancels the confirmations.',
  'Ton sac · clique un objet pour le proposer': 'Your bag · click an item to offer it',
  'Les objets portés ne s’échangent pas. Une pile se propose entière (100 au plus).':
    'Worn items cannot be traded. A stack is offered whole (100 at most).',
  '{nom} te propose un échange.': '{nom} offers you a trade.',
  'Accepter': 'Accept',
  'Refuser': 'Decline',
  'En attente de la réponse de {nom}…': 'Waiting for {nom}’s answer…',
  'Annuler la demande': 'Cancel the request',
  'Adresse du relais invalide.': 'Invalid relay address.',
  'Relais injoignable : {adresse}': 'Relay unreachable: {adresse}',
  'Adresse Tailscale : Tailscale doit être lancé et connecté chez toi, et tu dois être dans le réseau Tailscale de l’hôte (il t’invite, ou partage sa machine avec toi). Vérifie aussi que l’hôte a bien ouvert son salon.':
    'Tailscale address: Tailscale must be running and connected on your side, and you must be on the host’s Tailscale network (they invite you, or share their machine with you). Also check that the host has opened their room.',
  'Vérifie l’adresse, que l’hôte a bien ouvert son salon, et son pare-feu':
    'Check the address, that the host has opened their room, and their firewall',
  '(le port {n} doit accepter les connexions).': '(port {n} must accept connections).',
  'Adresse du relais illisible :': 'Unreadable relay address:',
  'Connexion au relais…': 'Connecting to the relay…',
  'Salon fermé.': 'Room closed.',
  'Salon ouvert : donne le code {code} à tes amis.': 'Room open: give the code {code} to your friends.',
  'Salon ouvert. Code : {code}': 'Room open. Code: {code}',
  '{nom} est déconnecté : sa place est gardée 2 minutes.':
    '{nom} disconnected: their place is kept for 2 minutes.',
  '{nom} est déconnecté (place gardée 2 min)': '{nom} disconnected (place kept 2 min)',
  '{nom} n’est pas revenu à temps : il quitte le groupe.':
    '{nom} did not come back in time: they leave the group.',
  'Versions différentes : hôte {a}, invité {b}': 'Different versions: host {a}, guest {b}',
  'Identifiant d’invité invalide.': 'Invalid guest ID.',
  'Nouvelle connexion de ce héros.': 'New connection from this hero.',
  'Cette aventure a déjà six héros invités.': 'This adventure already has six guest heroes.',
  'Trois invités sont déjà présents.': 'Three guests are already present.',
  '{nom} est de retour : il reprend sa place.': '{nom} is back: they take their place again.',
  '{nom} a rejoint la partie.': '{nom} joined the game.',
  '{nom} est de retour': '{nom} is back',
  '{nom} a rejoint la partie': '{nom} joined the game',
  'Code de salon invalide (6 caractères).': 'Invalid room code (6 characters).',
  'Adresse du relais illisible : colle le lien donné par l’hôte.':
    'Unreadable relay address: paste the link given by the host.',
  'Salon {code} : en attente de l’hôte…': 'Room {code}: waiting for the host…',
  'Connexion perdue avec l’hôte. Ta place est gardée 2 minutes : rejoins avec le même code.':
    'Connection to the host lost. Your place is kept for 2 minutes: rejoin with the same code.',
  'Connexion fermée.': 'Connection closed.',
  'Connexion refusée.': 'Connection refused.',
  'L’hôte a fermé sa partie.': 'The host closed their game.',
  'Connecté chez l’hôte.': 'Connected to the host.',
  'Te revoilà : tu reprends ta place': 'Welcome back: you take your place again',
  'Tu as rejoint la partie de ton ami': 'You joined your friend’s game',
  'Ouverture du relais sur ton réseau local…': 'Opening the relay on your local network…',
  'Ouverture du relais sur ton réseau Tailscale…': 'Opening the relay on your Tailscale network…',
  'Relais impossible.': 'Relay unavailable.',
  'Invitation copiée : colle-la à tes amis': 'Invitation copied: paste it to your friends',
  '{n} % de chance par boss et par héros (0 à {m} objets)':
    '{n}% chance per boss and per hero (0 to {m} items)',
  'boss cachés : clé des secrets': 'hidden bosses: key of secrets',
  'PV et dégâts standards de l’instance.': 'Standard instance HP and damage.',
  'Ennemis : +{n} % PV et +{m} % dégâts calculés.': 'Enemies: +{n}% HP and +{m}% damage calculated.',
  'Niveau requis': 'Required level',
  'Ennemis niveau': 'Enemy level',
  'Récompense :': 'Reward:',
  '{qualite} — niveau {n}': '{qualite} — level {n}',
  'Entrer en {mode}': 'Enter in {mode}',
  'Niveau {n} requis': 'Level {n} required',
  'Termine ton instance actuelle': 'Finish your current instance',
  'Boss : {liste}': 'Bosses: {liste}',
  'Ton niveau :': 'Your level:',
  'DONJON DES TRÉFONDS': 'DUNGEON OF THE DEPTHS',
  'Aucun niveau requis': 'No level required',
  'Ennemis à ton niveau (': 'Enemies at your level (',
  'Récompense de ton niveau :': 'Reward at your level:',
  'ou': 'or',
  'Entrer': 'Enter',
  'RAID': 'RAID',
  'DONJON': 'DUNGEON',
  'Boss ({n}) : {liste}': 'Bosses ({n}): {liste}',
  // ------------------------------------------------------------ Arène des Épreuves
  'MALÉDICTION': 'CURSE',
  'EN GARDE': 'ON GUARD',
  'RAFALE': 'FLURRY',
  'EXÉCUTION': 'EXECUTION',
  'BOUCLIER DE CRISTAL': 'CRYSTAL SHIELD',
  'Écho du Néant': 'Echo of the Void',
  'Vague {n} : {nom}': 'Wave {n}: {nom}',
  'Vague {n}/12 — {nom} entre dans l’arène !': 'Wave {n}/12 — {nom} enters the arena!',
  'RELEVÉ': 'REVIVED',
  '+{n} PV': '+{n} HP',
  '+{n} mana': '+{n} mana',
  '{nom} vaincu !': '{nom} defeated!',
  '{nom} vaincu ! {n} or et un objet Rare reçus. Réapparition dans {m} minutes.':
    '{nom} defeated! {n} gold and a Rare item received. Respawns in {m} minutes.',
  'Le héros': 'The hero',
  '{nom} remporte un objet LÉGENDAIRE : {objet} !': '{nom} wins a LEGENDARY item: {objet}!',
  'Collection complète : +2500 or': 'Collection complete: +2500 gold',
  'Les douze épreuves sont accomplies ! La victoire, elle, se mérite.':
    'The twelve trials are complete! Victory, though, must be earned.',
  '{nom} : avance sur la piste pour commencer': '{nom}: step onto the track to begin',
  'Arène des Épreuves': 'Arena of Trials',
  'Impossible d’abandonner pendant un combat !': 'Cannot give up during a fight!',
  'IMMUNISÉ': 'IMMUNE',
  'CONTRE-ATTAQUE !': 'COUNTERATTACK!',
  'PARÉ': 'PARRIED',
  'BOUCLIER BRISÉ': 'SHIELD BROKEN',
  '{a} relève {b} !': '{a} revives {b}!',
  '{nom} t’a relevé !': '{nom} revived you!',
  'Tout le groupe est à terre… Tentative terminée.': 'The whole group is down… Attempt over.',
  'VAGUE': 'WAVE',
  'VAGUE {n}': 'WAVE {n}',
  'Avance sur la piste pour commencer l’épreuve': 'Step onto the track to begin the trial',
  'Vague terminée · +20 % PV et mana': 'Wave complete · +20% HP and mana',
  'Vague terminée': 'Wave complete',
  '+20 % PV et mana': '+20% HP and mana',
  'Prochain boss : {nom}': 'Next boss: {nom}',
  'Entre sur la piste !': 'Step onto the track!',
  'L’ARÈNE EST VAINCUE': 'THE ARENA IS CONQUERED',
  'Retourne au portail de l’antichambre [E]': 'Return to the antechamber portal [E]',
  'RUNE OBTENUE': 'RUNE OBTAINED',
  'NOUVEAU !': 'NEW!',
  'NOUVELLE !': 'NEW!',
  'DOUBLON': 'DUPLICATE',
  'Soins −60 %': 'Healing −60%',
  '« L’Arène est ouverte à tous. La victoire, elle, se mérite. »':
    '“The Arena is open to all. Victory, though, must be earned.”',
  'Tableau des records': 'Records board',
  'Meilleure vague': 'Best wave',
  'Tentatives effectuées': 'Attempts made',
  'Arène terminée': 'Arena completed',
  'Non': 'No',
  'Dernier boss vaincu': 'Last boss defeated',
  'Règles': 'Rules',
  '12 vagues, un boss par vague, difficulté fixe dès la vague 1.':
    '12 waves, one boss per wave, fixed difficulty from wave 1.',
  'Aucun niveau minimum : la difficulté ne s’adapte jamais à ton équipement.':
    'No minimum level: the difficulty never adapts to your gear.',
  'Les attaques majeures sont annoncées au sol :': 'Major attacks are telegraphed on the ground:',
  'pour une roulade.': 'to dodge roll.',
  'Les douze épreuves': 'The twelve trials',
  'Entrer dans l’Arène': 'Enter the Arena',
  'Le Souverain est tombé': 'The Sovereign has fallen',
  'Récompense finale : {nom}': 'Final reward: {nom}',
  'Vague {n}/{max}': 'Wave {n}/{max}',
  'Phase {n}/{max}': 'Phase {n}/{max}',
  // ------------------------------------------------------------ Succès, bestiaire et titres (touche Y)
  'L’Arène des Épreuves': 'The Arena of Trials',
  'Monde ouvert': 'Open world',
  'Tréfonds': 'Depths',
  'élite : {nom}': 'elite: {nom}',
  'Boss mondial · niveau {n}': 'World boss · level {n}',
  'Boss mondial': 'World boss',
  'Boss des Tréfonds · à ton niveau': 'Boss of the Depths · at your level',
  'Boss caché': 'Hidden boss',
  'Combat & armes': 'Combat & weapons',
  'Exploration & aventure': 'Exploration & adventure',
  'Économie & métiers': 'Economy & professions',
  'Défis & Arène': 'Challenges & Arena',
  'Vaincre 200 ennemis avec une arme de la famille {arme}.':
    'Defeat 200 enemies with a weapon of the {arme} family.',
  'Premiers pas ensanglantés': 'Bloody first steps',
  'Vaincre ton tout premier monstre.': 'Defeat your very first monster.',
  'Le massacre des Plaines': 'The Plains massacre',
  'Vaincre 100 monstres.': 'Defeat 100 monsters.',
  'Fléau des ténèbres': 'Scourge of darkness',
  'Vaincre 1 000 monstres.': 'Defeat 1,000 monsters.',
  'Le Pourfendeur': 'The Slayer',
  'Génocide légendaire': 'Legendary slaughter',
  'Vaincre 10 000 monstres.': 'Defeat 10,000 monsters.',
  'Dieu de la guerre': 'God of war',
  'Chasseur d’élites': 'Elite hunter',
  'Vaincre 25 monstres élites.': 'Defeat 25 elite monsters.',
  'Fléau des élites': 'Scourge of elites',
  'Vaincre 250 monstres élites.': 'Defeat 250 elite monsters.',
  'Briseur d’élites': 'Elite breaker',
  'Œil du tigre': 'Eye of the tiger',
  'Réussir 500 coups critiques.': 'Land 500 critical hits.',
  'Frappe dévastatrice': 'Devastating strike',
  'Infliger 1 000 dégâts en un seul coup.': 'Deal 1,000 damage in a single hit.',
  'Le Dévastateur': 'The Devastator',
  'Infliger 5 000 dégâts en un seul coup.': 'Deal 5,000 damage in a single hit.',
  'Artiste de l’esquive': 'Dodge artist',
  'Faire 500 roulades d’esquive.': 'Perform 500 dodge rolls.',
  'L’Insaisissable': 'The Elusive',
  'Tempête d’acier': 'Steel storm',
  'Lancer 1 000 compétences d’arme.': 'Cast 1,000 weapon skills.',
  'Pouvoir de classe': 'Class power',
  'Lancer 100 fois le sort de ta classe (touche F).': 'Cast your class spell 100 times (F key).',
  'Maître d’armes': 'Weapon master',
  'Vaincre 50 ennemis avec chacune des neuf familles d’arme.':
    'Defeat 50 enemies with each of the nine weapon families.',
  'Tireur d’élite': 'Sharpshooter',
  'Exécuteur silencieux': 'Silent executioner',
  'Bûcheron des âmes': 'Soul woodcutter',
  'Masse atomique': 'Atomic mace',
  'Résilience de Phénix': 'Phoenix resilience',
  'Bourreau des cœurs': 'Heartbreaker',
  'Vaincre un boss mondial moins de 30 secondes après le premier coup.':
    'Defeat a world boss less than 30 seconds after the first hit.',
  'Le grand départ': 'The great departure',
  'Quitter le Camp de l’Aurore pour la première fois.': 'Leave the Dawn Camp for the first time.',
  'Promeneur solitaire': 'Lone walker',
  'Marcher 10 km dans le monde ouvert (une case = 1 m).': 'Walk 10 km in the open world (one tile = 1 m).',
  'Globe-trotteur': 'Globetrotter',
  'Marcher 50 km dans le monde ouvert.': 'Walk 50 km in the open world.',
  'Le Vagabond': 'The Wanderer',
  'Touriste des biomes': 'Biome tourist',
  'Visiter les six régions de l’île.': 'Visit the six regions of the island.',
  'Voyageur intrépide': 'Intrepid traveler',
  'Chasseur de trésors': 'Treasure hunter',
  'Ouvrir ton premier coffre secret.': 'Open your first secret chest.',
  'Pilleur de tombes': 'Tomb raider',
  'Ouvrir 25 coffres secrets.': 'Open 25 secret chests.',
  'Cartographe royal': 'Royal cartographer',
  'Ouvrir tous les coffres secrets de l’île.': 'Open every secret chest on the island.',
  'Premier portail': 'First portal',
  'Entrer dans un donjon ou un raid.': 'Enter a dungeon or a raid.',
  'Collectionneur de portails': 'Portal collector',
  'Entrer dans tous les donjons et raids, sur l’île et dans les Tréfonds.':
    'Enter every dungeon and raid, on the island and in the Depths.',
  'Promenade en enfer': 'A stroll through hell',
  'Entrer dans la Forge d’Écaille-Ardente.': 'Enter the Blazescale Forge.',
  'Pèlerinage céleste': 'Celestial pilgrimage',
  'Atteindre l’Aiguille du Continuum.': 'Reach the Needle of the Continuum.',
  'Au cœur des ténèbres': 'Heart of darkness',
  'Rester 5 minutes d’affilée dans une région plus forte que toi, sans tomber.':
    'Stay 5 minutes in a row in a region stronger than you, without falling.',
  'Touriste égaré': 'Lost tourist',
  'Tomber dans la Forêt enchantée (niveau 50+) en étant niveau 10 ou moins.':
    'Fall in the Enchanted Forest (level 50+) while level 10 or lower.',
  'Téméraire inconscient': 'Reckless daredevil',
  'Première chute': 'First fall',
  'Tomber au combat pour la première fois.': 'Fall in combat for the first time.',
  'Increvable': 'Unkillable',
  'Tomber 100 fois et te relever à chaque fois.': 'Fall 100 times and get back up every time.',
  'L’Increvable': 'The Unkillable',
  'Chasseur de légendes': 'Legend hunter',
  'Découvrir les huit boss mondiaux.': 'Discover the eight world bosses.',
  'Premier chapitre': 'First chapter',
  'Terminer une quête.': 'Complete a quest.',
  'Aventurier aguerri': 'Seasoned adventurer',
  'Terminer 15 quêtes.': 'Complete 15 quests.',
  'Chroniqueur de l’Aurore': 'Chronicler of the Dawn',
  'Terminer toutes les quêtes.': 'Complete every quest.',
  'Chroniqueur': 'Chronicler',
  'Légende vivante': 'Living legend',
  'Terminer l’histoire « Les Échos de l’Aurore ».': 'Complete the story “The Echoes of Dawn”.',
  'Sauveur de Canaan': 'Savior of Canaan',
  'Premier pécule': 'First nest egg',
  'Gagner tes 100 premières pièces d’or.': 'Earn your first 100 gold coins.',
  'Magnat de l’or': 'Gold magnate',
  'Gagner 100 000 pièces d’or au total.': 'Earn 100,000 gold coins in total.',
  'Le Magnat': 'The Magnate',
  'Gros portefeuille': 'Fat wallet',
  'Agrandir ton sac jusqu’à 100 places.': 'Enlarge your bag to 100 slots.',
  'Maître artisan': 'Master artisan',
  'Atteindre le niveau 40 dans un métier.': 'Reach level 40 in a profession.',
  'Commerçant malin': 'Savvy trader',
  'Gagner 10 000 pièces d’or en vendant aux marchands.': 'Earn 10,000 gold coins selling to merchants.',
  'Le Marchand': 'The Merchant',
  'Coffre-fort': 'Strongbox',
  'Ranger 50 cases à la banque.': 'Store 50 slots in the bank.',
  'Mineur de fond': 'Deep miner',
  'Extraire 100 minerais.': 'Mine 100 ores.',
  'Chercheur d’or pur': 'Pure gold seeker',
  'Extraire une pépite d’or.': 'Mine a gold nugget.',
  'Herboriste des bois': 'Woodland herbalist',
  'Cueillir 100 herbes.': 'Gather 100 herbs.',
  'La main verte': 'Green thumb',
  'Cueillir un aloès ou un lys étoilé.': 'Gather an aloe or a star lily.',
  'Apprenti cuisinier': 'Apprentice cook',
  'Cuisiner 10 recettes différentes.': 'Cook 10 different recipes.',
  'Maître cuisinier': 'Master cook',
  'Cuisiner toutes les recettes du jeu.': 'Cook every recipe in the game.',
  'Chef étoilé': 'Star chef',
  'Festin royal': 'Royal feast',
  'Cuisiner un repas de qualité Mythique.': 'Cook a meal of Mythic quality.',
  'Pêcheur du dimanche': 'Sunday angler',
  'Pêcher ton tout premier poisson.': 'Catch your very first fish.',
  'Gros poisson': 'Big fish',
  'Pêcher un espadon ou un poisson-lune astral.': 'Catch a swordfish or an astral moonfish.',
  'Maître des profondeurs': 'Master of the deep',
  'Compléter la collection des poissons.': 'Complete the fish collection.',
  'Vieux Loup de Mer': 'Old Sea Dog',
  'Enchanteur débutant': 'Novice enchanter',
  'Avoir une pièce d’équipement enchantée.': 'Own an enchanted piece of gear.',
  'Runes mystiques': 'Mystic runes',
  'Le Runiste': 'The Runesmith',
  'Chasseur de viande': 'Meat hunter',
  'Chasser 50 animaux.': 'Hunt 50 animals.',
  'Le Philanthrope': 'The Philanthropist',
  'Faire un échange avec un autre joueur.': 'Trade with another player.',
  'Éveil des pouvoirs': 'Awakening of powers',
  'Atteindre le niveau 10.': 'Reach level 10.',
  'Force de l’âge': 'In your prime',
  'Atteindre le niveau 30.': 'Reach level 30.',
  'Transcendance totale': 'Total transcendence',
  'Atteindre le niveau maximum (60).': 'Reach the maximum level (60).',
  'L’Immortel': 'The Immortal',
  'Collection de runes': 'Rune collection',
  'Maître des runes': 'Rune master',
  'Le Maître des runes': 'The Rune Master',
  'Puissance écarlate': 'Scarlet power',
  'Forteresse impénétrable': 'Impregnable fortress',
  'Bénédiction divine': 'Divine blessing',
  'Immortalité du Phénix': 'Phoenix immortality',
  'Spécialisation de classe': 'Class specialization',
  'Maître Druide': 'Master Druid',
  'Remplir les cinq emplacements de talents en Druide.': 'Fill the five talent slots as a Druid.',
  'Paladin éternel': 'Eternal Paladin',
  'Remplir les cinq emplacements de talents en Paladin.': 'Fill the five talent slots as a Paladin.',
  'Ombre mortelle': 'Deadly shadow',
  'Remplir les cinq emplacements de talents en Assassin.': 'Fill the five talent slots as an Assassin.',
  'Seigneur des Éléments': 'Lord of the Elements',
  'Remplir les cinq emplacements de talents en Élémentaliste.':
    'Fill the five talent slots as an Elementalist.',
  'Toutes les voies': 'All paths',
  'Jouer les quatre classes.': 'Play the four classes.',
  'L’Éclectique': 'The Eclectic',
  'Éclat légendaire': 'Legendary gleam',
  'Obtenir un objet Légendaire.': 'Obtain a Legendary item.',
  'Mythe vivant': 'Living myth',
  'Obtenir un objet Mythique.': 'Obtain a Mythic item.',
  'Porteur de mythe': 'Myth bearer',
  'Panoplie épique': 'Epic set',
  'Collectionneur mythique': 'Mythic collector',
  'Élu des Dieux': 'Chosen of the Gods',
  'Entrée dans l’Arène': 'Into the Arena',
  'Tenter l’Arène des Épreuves.': 'Attempt the Arena of Trials.',
  'Gladiateur': 'Gladiator',
  'Atteindre la vague 6 de l’Arène.': 'Reach wave 6 of the Arena.',
  'Champion des champions': 'Champion of champions',
  'Vaincre les 12 vagues de l’Arène.': 'Defeat all 12 waves of the Arena.',
  'Champion de l’Arène': 'Arena champion',
  'Le triomphe de l’Héroïque': 'Heroic triumph',
  'Terminer le Jugement de Célestia en mode Héroïque.': 'Complete the Judgment of Celestia in Heroic mode.',
  'Dominateur des Mondes': 'Dominator of Worlds',
  'Chasseur de divinités': 'Deity hunter',
  'Vaincre L’Avatar du Jugement.': 'Defeat the Avatar of Judgment.',
  'Premier boss mondial': 'First world boss',
  'Vaincre un boss mondial.': 'Defeat a world boss.',
  'Tueur de dieux anciens': 'Slayer of ancient gods',
  'Vaincre les huit boss mondiaux.': 'Defeat the eight world bosses.',
  'Titanomache': 'Titanomachy',
  'Le réveil du dragon': 'The dragon awakens',
  'Vaincre Pyrrhax, Wyrm d’Écaille-Ardente.': 'Defeat Pyrrhax, Blazescale Wyrm.',
  'Cauchemar d’argent': 'Silver nightmare',
  'Vaincre le Roi Sanglant dans le Bastion.': 'Defeat the Blood King in the Bastion.',
  'Voyageur temporel': 'Time traveler',
  'Vaincre le Dévoreur Stellaire dans l’Aiguille du Continuum.':
    'Defeat the Stellar Devourer in the Needle of the Continuum.',
  'Jugement dernier': 'Last judgment',
  'Vaincre L’Avatar du Jugement moins de 3 minutes après le premier coup.':
    'Defeat the Avatar of Judgment less than 3 minutes after the first hit.',
  'Défi en solitaire': 'Solo challenge',
  'Terminer un donjon ou un raid seul, sans tomber.': 'Complete a dungeon or raid alone, without falling.',
  'Loup solitaire': 'Lone wolf',
  'Le prix du sang': 'The price of blood',
  'Vaincre un boss en ayant moins de 5 % de tes PV.': 'Defeat a boss while below 5% of your HP.',
  'Vitesse éclair': 'Lightning speed',
  'Terminer un donjon ou un raid en moins de 5 minutes.': 'Complete a dungeon or raid in under 5 minutes.',
  'Conquérant des donjons': 'Dungeon conqueror',
  'Terminer les six donjons de l’île.': 'Complete the six dungeons of the island.',
  'Fléau des raids': 'Scourge of raids',
  'Terminer les quatre raids.': 'Complete the four raids.',
  'Résistant suprême': 'Supreme endurance',
  'Subir 1 000 000 de dégâts au total.': 'Take 1,000,000 damage in total.',
  'Le Roc': 'The Rock',
  'Bestiaire complet': 'Complete bestiary',
  'Vaincre chaque espèce du monde, des donjons et des raids.':
    'Defeat every species of the world, dungeons and raids.',
  'Le Naturaliste': 'The Naturalist',
  'Perfectionniste absolu': 'Absolute perfectionist',
  'Débloquer 99 succès.': 'Unlock 99 achievements.',
  'La Légende de Nashi': 'The Legend of Nashi',
  'Débloquer tous les autres succès.': 'Unlock all the other achievements.',
  'La Légende Vivante': 'The Living Legend',
  'Titre « {titre} »': 'Title “{titre}”',
  'aura dorée': 'golden aura',
  'un objet {qualite} de ton niveau': '{qualite} item of your level',
  '{n} % d’un niveau d’XP': '{n}% of a level’s XP',
  'Récompense du succès « {nom} » : objet {qualite} de ton niveau ({objet})':
    'Achievement reward “{nom}”: {qualite} item of your level ({objet})',
  'Succès : {nom}': 'Achievement: {nom}',
  'Succès': 'Achievements',
  '{nom} débloque « {succes} »': '{nom} unlocks “{succes}”',
  '{n} succès débloqués !': '{n} achievements unlocked!',
  'Ouvre le panneau des succès (Y) pour les voir.': 'Open the achievements panel (Y) to see them.',
  'Succès débloqué': 'Achievement unlocked',
  'Tous': 'All',
  'Récents': 'Recent',
  'Aucun succès débloqué pour l’instant.': 'No achievements unlocked yet.',
  'Monstres du monde': 'World monsters',
  'Créatures des Tréfonds': 'Creatures of the Depths',
  'Créatures des donjons et raids': 'Dungeon and raid creatures',
  'Boss de donjon et de raid': 'Dungeon and raid bosses',
  'Boss de l’Arène': 'Arena bosses',
  'Découverts': 'Discovered',
  'Vaincus': 'Defeated',
  'une créature est découverte quand tu la croises de près.':
    'a creature is discovered when you come close to it.',
  'Créature inconnue': 'Unknown creature',
  'Pas encore croisée': 'Not met yet',
  '{n} élite': '{n} elite',
  '{n} élites': '{n} elites',
  'Découverte': 'Discovered',
  'Ton titre s’affiche au-dessus de ton personnage, pour tous les joueurs du groupe.':
    'Your title is shown above your character, for every player in the group.',
  'Aucun titre': 'No title',
  'À débloquer': 'To unlock',
  'Bestiaire': 'Bestiary',
  'Titres': 'Titles',
  'Succès & collections': 'Achievements & collections',
  'succès': 'achievements',
  '{n} points': '{n} points',
  // ------------------------------------------------------------ PNJ, villageois, cité elfique et coffres
  'Tête': 'Head',
  'Épaules': 'Shoulders',
  'Armure': 'Armor',
  'Gants': 'Gloves',
  'Bottes': 'Boots',
  'Collier': 'Necklace',
  'Bague': 'Ring',
  '{nom} vaincu ! Un coffre et un portail de retour sont apparus.':
    '{nom} defeated! A chest and a return portal have appeared.',
  'Lame': 'Blade',
  'Cuirasse': 'Cuirass',
  'Heaume': 'Helm',
  'Épaulières': 'Shoulderpads',
  'Anneau': 'Ring',
  'Équipement': 'Gear',
  '{piece} de l’Éclipse': '{piece} of the Eclipse',
  '{piece} des Titans': '{piece} of the Titans',
  '{piece} de Sylvaëlle': '{piece} of Sylvaëlle',
  '{piece} des Profondeurs': '{piece} of the Depths',
  '{piece} des Étoiles': '{piece} of the Stars',
  '{piece} du Crépuscule': '{piece} of Dusk',
  '{piece} du Gardien': '{piece} of the Guardian',
  '{piece} de l’Aube': '{piece} of the Dawn',
  'Fermer la fenêtre': 'Close the window',
  'Fermer (Échap)': 'Close (Esc)',
  'Redimensionner': 'Resize',
  'double-clic : taille d’origine': 'double-click: original size',
  '{n} objets communs vendus : +{m} or': '{n} common items sold: +{m} gold',
  'Choisis une difficulté': 'Choose a difficulty',
  'Retour dans les Tréfonds': 'Back to the Depths',
  'Retour au monde de Canaan': 'Back to the world of Canaan',
  '+{n} or dans le coffre': '+{n} gold in the chest',
  'Coffre secret verrouillé : il faut une clé des secrets. Les boss cachés des donjons et des raids en donnent une.':
    'Secret chest locked: you need a key of secrets. Hidden dungeon and raid bosses give one.',
  '(nouveau !)': '(new!)',
  'Clé des secrets requise': 'Key of secrets required',
  'Coffre secret ouvert : équipement Épique + {n} or !': 'Secret chest opened: Epic gear + {n} gold!',
  'Halte ! Ah, c’est toi. Rien à signaler.': 'Halt! Ah, it’s you. Nothing to report.',
  'Les loups rôdent à la lisière des plaines. Garde ton arme prête.':
    'Wolves prowl at the edge of the plains. Keep your weapon ready.',
  'On raconte qu’un boss mondial erre dans le désert…': 'They say a world boss roams the desert…',
  'Je monte la garde depuis l’aube. Encore trois heures…': 'I’ve been on guard since dawn. Three more hours…',
  'Si tu croises des squelettes, vise la tête.': 'If you run into skeletons, aim for the head.',
  'Le marchand a reçu de nouvelles marchandises, va voir son échoppe !':
    'The merchant got new wares, go check out the stall!',
  'Le feu de camp, ça réchauffe le cœur après une longue route.':
    'A campfire warms the heart after a long road.',
  'La Marmite dorée sent bon toute la journée. On y cuisine ses prises.':
    'The Golden Pot smells good all day long. That’s where you cook your catches.',
  'Tu reviens des ruines ? Raconte-moi tout !': 'Back from the ruins? Tell me everything!',
  'Ma grand-mère disait que l’Aube s’est brisée en mille éclats.':
    'My grandmother used to say the Dawn shattered into a thousand shards.',
  'Le meilleur équipement, c’est celui qu’on arrache aux boss des donjons !':
    'The best gear is the gear you tear from dungeon bosses!',
  'J’ai cueilli des baies ce matin. Elles sont délicieuses !':
    'I picked berries this morning. They’re delicious!',
  'Tu as vu ? J’ai attrapé un papillon !': 'Did you see? I caught a butterfly!',
  'Quand je serai grand, je serai un héros comme toi !': 'When I grow up, I’ll be a hero like you!',
  'Chut… je joue à cache-cache avec les lapins.': 'Shh… I’m playing hide-and-seek with the rabbits.',
  'Est-ce que les dragons existent vraiment ?': 'Do dragons really exist?',
  'Tu me montres ton épée ? S’il te plaît !': 'Will you show me your sword? Please!',
  'De mon temps, les donjons étaient bien plus sombres…': 'In my day, dungeons were much darker…',
  'Ne va pas au Bastion du Roi Sanglant sans tes amis.':
    'Don’t go to the Bastion of the Blood King without your friends.',
  'Le vent tourne… il va se passer quelque chose.': 'The wind is turning… something is going to happen.',
  'Repose-toi près du feu, tes jambes te remercieront.': 'Rest by the fire, your legs will thank you.',
  'Chaque héros commence par une épée émoussée, tu sais.':
    'Every hero starts with a blunted sword, you know.',
  'J’arrive de la Forêt enchantée : les arbres y brillent la nuit !':
    'I’ve just come from the Enchanted Forest: the trees glow there at night!',
  'Le désert est traître, emporte de l’eau.': 'The desert is treacherous, take water with you.',
  'Avec des amis, les raids paraissent moins longs (touche G).': 'With friends, raids feel shorter (G key).',
  'Les aventuriers s’échangent leur butin, tu savais ? (touche J)':
    'Adventurers trade their loot with each other, did you know? (J key)',
  'Je cherche une carte des oasis. Tu en aurais une ?':
    'I’m looking for a map of the oases. Do you have one?',
  'Ça ne mord pas beaucoup aujourd’hui…': 'Not many bites today…',
  'Le plus gros poisson que j’ai vu ? Grand comme ton épée !':
    'The biggest fish I’ve seen? As long as your sword!',
  'Les grenouilles chantent, la pluie n’est pas loin.': 'The frogs are singing, rain isn’t far off.',
  'Chut, tu vas faire fuir les poissons.': 'Shh, you’ll scare the fish away.',
  'Approche-toi d’une cuisinière avec tes prises : je te prête mes fourneaux !':
    'Come to a stove with your catches: I’ll lend you my ovens!',
  'Une soupe de gardons, et la journée commence bien.': 'A bowl of roach soup, and the day starts well.',
  'Le secret d’un bon ragoût ? Du gibier frais et de la patience.':
    'The secret of a good stew? Fresh game and patience.',
  'Plus tu cuisines, mieux tu cuisines. Ouvre ton carnet (touche P) !':
    'The more you cook, the better you cook. Open your logbook (P key)!',
  'Un repas de qualité légendaire… je n’en ai vu qu’un dans ma vie.':
    'A meal of legendary quality… I’ve only seen one in my life.',
  'Ces pierres se souviennent de l’Aube d’avant…': 'These stones remember the Dawn of old…',
  'Les squelettes ne dorment jamais vraiment.': 'Skeletons never truly sleep.',
  'Écoute… on entend encore les anciens murmurer.': 'Listen… you can still hear the ancients whisper.',
  'D’ici, on voit loin. Les brumes cachent bien des choses.':
    'You can see far from here. The mists hide many things.',
  'J’ai repéré des coffres cachés… mais c’est un secret.':
    'I’ve spotted some hidden chests… but it’s a secret.',
  'Un portail s’est ouvert au loin, je l’ai vu briller.': 'A portal opened in the distance, I saw it shine.',
  'Les monstres sont plus forts à mesure qu’on s’éloigne du camp.':
    'Monsters get stronger the farther you go from camp.',
  'Les plaines sont douces, mais les sangliers ont mauvais caractère.':
    'The plains are gentle, but the boars are bad-tempered.',
  'Dans la Forêt ancienne, les araignées tissent des toiles géantes.':
    'In the Ancient Forest, spiders weave giant webs.',
  'Les feuilles d’automne cachent parfois des pièces d’or…': 'Autumn leaves sometimes hide gold coins…',
  'La nuit, le sable chante sous le vent.': 'At night, the sand sings in the wind.',
  'Les fées sauvages ne sont pas aussi gentilles qu’elles en ont l’air.':
    'Wild fairies aren’t as nice as they look.',
  'Cuisinier {nom}': 'Cook {nom}',
  'Cuisinière {nom}': 'Cook {nom}',
  'Garde {nom}': 'Guard {nom}',
  'Vieux {nom}': 'Old {nom}',
  'Vieille {nom}': 'Old {nom}',
  'Petit {nom}': 'Little {nom}',
  'Petite {nom}': 'Little {nom}',
  'Pêcheur {nom}': 'Fisherman {nom}',
  'Ermite {nom}': 'Hermit {nom}',
  'Éclaireuse {nom}': 'Scout {nom}',
  'Garde de Sylvaëlle': 'Guard of Sylvaëlle',
  'Elwyn, la Tisseuse': 'Elwyn, the Weaver',
  'Elwë, Reine de Sylvaëlle': 'Elwë, Queen of Sylvaëlle',
  'Dame Aelin': 'Lady Aelin',
  'Seigneur Calen': 'Lord Calen',
  'Fëanwë, le tavernier': 'Fëanwë, the innkeeper',
  'Ithilië, prêtresse de la Lune': 'Ithilië, priestess of the Moon',
  'Elrohen, l’astronome': 'Elrohen, the astronomer',
  'Haldir des Racines': 'Haldir of the Roots',
  'Garde royal': 'Royal guard',
  'Ylvarë : « Je t’ai déjà béni aujourd’hui, jeune pousse. Reviens demain. »':
    'Ylvarë: “I have already blessed you today, young sprout. Come back tomorrow.”',
  'Avant les hommes, avant le camp et ses feux, il y avait la forêt. J’ai vu naître chaque arbre de cette île, jeune pousse.':
    'Before men, before the camp and its fires, there was the forest. I have seen every tree on this island be born, young sprout.',
  'Les elfes de Sylvaëlle ont bâti leur cité entre mes racines quand la grande roche s’est ouverte. Ils l’ont ceinte de troncs offerts par la forêt elle-même.':
    'The elves of Sylvaëlle built their city among my roots when the great rock opened. They girded it with trunks offered by the forest itself.',
  'Le Cœur de l’Aurore bat encore sous l’île. Je l’entends, la nuit, comme une source sous la mousse. Les Échos que tu poursuis viennent de lui.':
    'The Heart of Dawn still beats beneath the island. I hear it at night, like a spring beneath the moss. The Echoes you pursue come from it.',
  'La porte de la cité est cachée derrière le lac : seuls ceux qui ont grandi assez pour voir au-delà des eaux la trouvent.':
    'The city gate is hidden behind the lake: only those who have grown enough to see beyond the waters find it.',
  'Les boss qui dorment derrière les murs fissurés gardent les clés de vieux coffres. Je ne sais pas qui les y a mis… mais ils sont plus vieux que moi.':
    'The bosses sleeping behind cracked walls keep the keys to old chests. I do not know who put them there… but they are older than I am.',
  'Repose-toi à l’ombre de mes branches. Une fois par jour, je peux te prêter un peu de ma sève.':
    'Rest in the shade of my branches. Once a day, I can lend you a little of my sap.',
  'Parle à Elwyn, dans la cité, pour acheter.': 'Talk to Elwyn, in the city, to buy.',
  'Tu possèdes déjà cette apparence.': 'You already own this appearance.',
  'Il faut {n} or.': 'You need {n} gold.',
  'Déjà dans ta garde-robe': 'Already in your wardrobe',
  'Atelier de la Tisseuse — Elwyn': 'The Weaver’s Workshop — Elwyn',
  '« Des tenues tissées de fil de lune et de feuilles d’or, qu’on ne trouve nulle part ailleurs. » Elles rejoignent ta garde-robe (V).':
    '“Outfits woven from moonthread and golden leaves, found nowhere else.” They join your wardrobe (V).',
  'Ton or :': 'Your gold:',
  'Écouter encore': 'Listen again',
  'Bénédiction active : encore {n} min.': 'Blessing active: {n} min left.',
  'Déjà béni aujourd’hui. Reviens demain.': 'Already blessed today. Come back tomorrow.',
  'Recevoir la bénédiction (+10 % de dégâts et régénération, 30 min)':
    'Receive the blessing (+10% damage and regeneration, 30 min)',
  'Garde : « Halte. Seuls les héros de niveau {n} entrent à Sylvaëlle. Reviens quand tu seras prêt. »':
    'Guard: “Halt. Only heroes of level {n} may enter Sylvaëlle. Come back when you are ready.”',
  'Les portes s’ouvrent : bienvenue à Sylvaëlle, la Cité des Elfes.':
    'The gates open: welcome to Sylvaëlle, City of the Elves.',
  'Tu quittes Sylvaëlle.': 'You leave Sylvaëlle.',
  '[E] Armurerie': '[E] Armory',
  '[E] Demander à entrer (niveau {n})': '[E] Ask to enter (level {n})',
  '[E] Sortir de Sylvaëlle': '[E] Leave Sylvaëlle',
  '[E] Parler à Ylvarë': '[E] Talk to Ylvarë',
  // ------------------------------------------------------------ Tréfonds, forteresse de Durgrim, donjons et énigmes
  'Galeries d’Argile': 'Clay Tunnels',
  'Galeries de terre battue, rivières de boue, racines et vieilles mines abandonnées par les nains.':
    'Packed-earth tunnels, rivers of mud, roots and old mines abandoned by the dwarves.',
  'Cité Engloutie de Khaz-Ombral': 'Sunken City of Khaz-Ombral',
  'Une ancienne cité naine abandonnée : rues dallées, maisons effondrées, statues sans tête et lacs noirs.':
    'An ancient abandoned dwarven city: paved streets, collapsed houses, headless statues and black lakes.',
  'Nécropole des Oubliés': 'Necropolis of the Forgotten',
  'Cimetières sans fin, arbres morts, mausolées et brumes vertes où rôdent goules et âmes errantes.':
    'Endless graveyards, dead trees, mausoleums and green mists where ghouls and wandering souls prowl.',
  'Fangeval, le Marais Fongique': 'Fangeval, the Fungal Marsh',
  'Un marais de boue tiède sous la roche : champignons géants luisants, spores, lacs troubles et mille-pattes.':
    'A marsh of warm mud beneath the rock: giant glowing mushrooms, spores, murky lakes and centipedes.',
  'Forteresse de Durgrim': 'Fortress of Durgrim',
  'Gorgrath, le Ver-Roi des Boues': 'Gorgrath, the Mud Worm King',
  'Le Gardien d’Argent de Khaz-Ombral': 'The Silver Guardian of Khaz-Ombral',
  'Morvane, la Reine-Liche': 'Morvane, the Lich Queen',
  'Sporemère, la Myconide Ancestrale': 'Sporemother, the Ancestral Myconid',
  'Gouffre des Plaines': 'Plains Chasm',
  'Puits des Racines': 'Root Well',
  'Grotte des Brumes': 'Mist Cave',
  'Crevasse Rousse': 'Russet Crevasse',
  'Escalier des Sables': 'Sand Stairway',
  'Faille Étoilée': 'Starry Rift',
  'Roi Thrain Barbe-de-Fer': 'King Thrain Ironbeard',
  'Bienvenue à Durgrim, voyageur de la surface. Mon peuple garde ces profondeurs depuis mille ans.':
    'Welcome to Durgrim, traveler from the surface. My people have guarded these depths for a thousand years.',
  'Khaz-Ombral était notre plus belle cité… jusqu’à ce que la pierre se réveille. Ne t’y aventure pas sans arme.':
    'Khaz-Ombral was our finest city… until the stone awoke. Do not venture there unarmed.',
  'Morvane, la Reine-Liche, règne sur la Nécropole. Les nôtres qui y sont tombés ne reposent plus en paix.':
    'Morvane, the Lich Queen, rules the Necropolis. Those of ours who fell there no longer rest in peace.',
  'Quatre donjons se cachent dans les Tréfonds. Ils s’adaptent à la force de qui y entre : aucun n’est trop tôt pour toi.':
    'Four dungeons hide in the Depths. They adapt to the strength of whoever enters: none is too early for you.',
  'Hilda Fonte-Rune': 'Hilda Runecaster',
  'Ma forge vaut bien celle du Camp de l’Aurore : fabrique tes enchantements ici (panneau P, onglet Enchantement).':
    'My forge is as good as the Dawn Camp’s: make your enchantments here (P panel, Enchanting tab).',
  'Le fer noir des Galeries chante sous le marteau. Les marchands le paient très cher.':
    'The black iron of the Tunnels sings under the hammer. Merchants pay a lot for it.',
  'Un bon nain ne sort jamais sans sa pioche. Toi, tu sors sans ? Étrange peuple, celui de la surface.':
    'A good dwarf never goes out without a pickaxe. You go out without one? Strange folk, the surface people.',
  'Dorn le Tavernier': 'Dorn the Innkeeper',
  'L’âtre de ma taverne est toujours chaud : cuisine tes prises ici, comme à La Marmite dorée.':
    'My tavern’s hearth is always warm: cook your catches here, just like at The Golden Pot.',
  'Le poisson aveugle des lacs noirs ? Délicieux en papillote. Fais-moi confiance.':
    'The blind fish of the black lakes? Delicious en papillote. Trust me.',
  'Une chope de bière de champignon ? Non ? Tant pis pour toi.': 'A mug of mushroom beer? No? Your loss.',
  'Borin le Marchand': 'Borin the Merchant',
  'Gimra la Banquière': 'Gimra the Banker',
  'banquière': 'banker',
  'Halte ! Ah, un ami de la surface. Passe, mais garde ta lanterne allumée.':
    'Halt! Ah, a friend from the surface. Go ahead, but keep your lantern lit.',
  'Au sud, la Nécropole. Au nord, Khaz-Ombral. Ne confonds pas, l’un est plus sinistre que l’autre.':
    'To the south, the Necropolis. To the north, Khaz-Ombral. Don’t mix them up, one is grimmer than the other.',
  'Les gargouilles de Khaz-Ombral ne dorment jamais. Moi non plus, d’ailleurs.':
    'The gargoyles of Khaz-Ombral never sleep. Neither do I, come to think of it.',
  'Un ver gros comme une maison creuse les Galeries d’Argile. Gorgrath, qu’on l’appelle.':
    'A worm as big as a house digs through the Clay Tunnels. Gorgrath, they call it.',
  'Mineur Gloin': 'Miner Gloin',
  'Il y a de l’obsidienne dans la Nécropole… si tu oses creuser entre les tombes.':
    'There is obsidian in the Necropolis… if you dare to dig between the graves.',
  'Les géodes de Fangeval brillent comme des étoiles. Elles valent une fortune !':
    'The geodes of Fangeval shine like stars. They are worth a fortune!',
  'Ancienne Brunhild': 'Elder Brunhild',
  'Ma grand-mère disait que l’île de là-haut repose sur le dos des Tréfonds.':
    'My grandmother used to say the island up there rests on the back of the Depths.',
  'Écoute les âmes errantes : elles pleurent les noms qu’on a oubliés.':
    'Listen to the wandering souls: they mourn the names that were forgotten.',
  'Tu viens vraiment de là-haut ? C’est vrai que le plafond est bleu ?':
    'You really come from up there? Is it true the ceiling is blue?',
  'Un jour, j’irai voir le soleil. Il paraît qu’il brûle les yeux !':
    'One day, I’ll go see the sun. They say it burns your eyes!',
  'Conseillère Dagny': 'Councilor Dagny',
  'conseillère': 'councilor',
  'Le Roi tient conseil sur la place, mais c’est ici que se décide l’avenir de Durgrim.':
    'The King holds council in the square, but it is here that Durgrim’s future is decided.',
  'Ces piliers portent les noms des vingt rois. Le vingt-et-unième attend encore le sien.':
    'These pillars bear the names of the twenty kings. The twenty-first is still waiting for his.',
  'Personne ne s’assied sur le trône de pierre. Personne.': 'No one sits on the stone throne. No one.',
  'Sigrun la Forgeronne': 'Sigrun the Smith',
  'Le fer se plie à qui sait l’écouter. Le reste n’est que du bruit.':
    'Iron bends to those who know how to listen to it. The rest is just noise.',
  'Hilda t’enchantera tes armes dehors, à la grande forge. Ici, on forge les haches de la garde.':
    'Hilda will enchant your weapons outside, at the great forge. In here, we forge the guards’ axes.',
  'Apprenti Kili': 'Apprentice Kili',
  'Trois cents coups de marteau par lame. J’en suis à deux cent douze… je crois.':
    'Three hundred hammer blows per blade. I’m at two hundred and twelve… I think.',
  'Helga la Brasseuse': 'Helga the Brewer',
  'Bière de champignon, hydromel de mousse ou eau de roche ? Choisis bien, la surface.':
    'Mushroom beer, moss mead or rock water? Choose wisely, surface dweller.',
  'Dorn dit que c’est sa taverne. Moi, je dis que c’est ma bière.':
    'Dorn says it’s his tavern. I say it’s my beer.',
  'Ulfar le Buveur': 'Ulfar the Drinker',
  'Hic ! Les gargouilles… elles m’ont souri. Je le jure sur ma barbe.':
    'Hic! The gargoyles… they smiled at me. I swear on my beard.',
  'Frida Chope-Pleine': 'Frida Fullmug',
  'Une naine qui boit plus qu’Ulfar ? C’est moi. Et je chante mieux, aussi.':
    'A dwarf woman who drinks more than Ulfar? That’s me. And I sing better, too.',
  'Gardien Thror': 'Warden Thror',
  'L’or de Durgrim dort ici. Gimra compte, moi je garde. Chacun son métier.':
    'Durgrim’s gold sleeps here. Gimra counts, I guard. To each their trade.',
  'Ylva Pied-de-Roc': 'Ylva Rockfoot',
  'mère': 'mother',
  'Essuie tes bottes, voyageur ! La boue des Galeries, ça ne part jamais.':
    'Wipe your boots, traveler! Tunnel mud never comes off.',
  'Mon mari est mineur. Il rentre quand la lanterne s’éteint.':
    'My husband is a miner. He comes home when the lantern goes out.',
  'Quand je serai grande, j’aurai les plus longues tresses de Durgrim !':
    'When I grow up, I’ll have the longest braids in Durgrim!',
  'Bombur Marteau-d’Or': 'Bombur Goldhammer',
  'père': 'father',
  'Ma famille forge des marteaux depuis six générations. Le mien est accroché là-haut.':
    'My family has forged hammers for six generations. Mine hangs up there.',
  'Grand-mère Astrid': 'Grandmother Astrid',
  'Assieds-toi, petit. Je vais te raconter la Grande Chute de Khaz-Ombral.':
    'Sit down, little one. I’ll tell you about the Great Fall of Khaz-Ombral.',
  'Les tresses d’une naine racontent sa vie : une par victoire, une par deuil.':
    'A dwarf woman’s braids tell her life: one for each victory, one for each loss.',
  'Éclaireur Nori': 'Scout Nori',
  'Les Galeries d’Argile : terre, boue et vieilles mines. Attention aux taupes-garous.':
    'The Clay Tunnels: earth, mud and old mines. Watch out for weremoles.',
  'La Mine Effondrée de Durgrim est au bout de la route. Grumbar y hante encore ses galeries.':
    'The Collapsed Mine of Durgrim is at the end of the road. Grumbar still haunts its tunnels.',
  'Khaz-Ombral, notre cité perdue. Les sentinelles de pierre gardent encore ses rues.':
    'Khaz-Ombral, our lost city. The stone sentinels still guard its streets.',
  'Les Halls Engloutis abritent le Roi Ombral. Il ne reconnaît plus les siens.':
    'The Sunken Halls shelter King Ombral. He no longer recognizes his own people.',
  'Éclaireur Óin': 'Scout Óin',
  'La Nécropole des Oubliés… Restez sur les dalles, les tombes ont faim.':
    'The Necropolis of the Forgotten… Stay on the flagstones, the graves are hungry.',
  'La Crypte des Mille Tombes : le Fossoyeur Éternel y creuse sans fin.':
    'The Crypt of a Thousand Tombs: the Eternal Gravedigger digs there endlessly.',
  'Fangeval : la boue est tiède et les champignons brillent. Les spores, elles, piquent.':
    'Fangeval: the mud is warm and the mushrooms glow. The spores, though, sting.',
  'Les Tréfonds Fongiques cachent la Reine des Spores. Brûle-la, si tu peux.':
    'The Fungal Depths hide the Spore Queen. Burn her, if you can.',
  'éclaireur': 'scout',
  '[E] Commercer': '[E] Trade',
  '[E] Descendre dans les Tréfonds': '[E] Descend into the Depths',
  '[E] Remonter à la surface': '[E] Return to the surface',
  'Seul l’hôte peut mener le groupe dans les Tréfonds ou à la surface.':
    'Only the host can lead the group into the Depths or to the surface.',
  'Les Tréfonds de Canaan': 'The Depths of Canaan',
  'Retour à la surface': 'Back to the surface',
  'Tu descends dans les Tréfonds : créatures, élites et boss y ont ton niveau. Remonte par n’importe quelle entrée (touche E).':
    'You descend into the Depths: creatures, elites and bosses there match your level. Go back up through any entrance (E key).',
  'à ton niveau': 'at your level',
  'Quatre biomes sous l’île': 'Four biomes beneath the island',
  'Forteresse de Durgrim (zone sûre)': 'Fortress of Durgrim (safe zone)',
  'Entrées vers la surface': 'Entrances to the surface',
  'créatures et boss à ton niveau ({n})': 'creatures and bosses at your level ({n})',
  'Boss : {nom}': 'Boss: {nom}',
  'entrée': 'entrance',
  'le Soleil': 'the Sun',
  'la Lune': 'the Moon',
  'l’Étoile': 'the Star',
  'le Cristal': 'the Crystal',
  'Abaisse les leviers': 'Pull the levers',
  'Foule les dalles': 'Step on the tiles',
  '{nom} ouvre la marche': '{nom} leads the way',
  '{nom} le suit': '{nom} follows',
  'puis {nom}': 'then {nom}',
  'et {nom} ferme le cortège': 'and {nom} closes the procession',
  '« {texte}. » — {verbe} dans cet ordre.': '“{texte}.” — {verbe} in this order.',
  'réservée': 'reserved',
  'Gardien du sceau': 'Seal guardian',
  '{nom} vaincu : clé des secrets dans ton sac ! Elle ouvre un coffre secret de l’île ({n}).':
    '{nom} defeated: key of secrets in your bag! It opens a secret chest on the island ({n}).',
  '{nom} : pas d’équipement cette fois.': '{nom}: no gear this time.',
  '{nom} vaincu ({n}/{m}) — la barrière se dissipe.': '{nom} defeated ({n}/{m}) — the barrier fades.',
  '{nom} vaincu ({n}/{m}) — la herse se lève.': '{nom} defeated ({n}/{m}) — the portcullis rises.',
  'Ouvre d’abord le coffre des boss, juste à côté !': 'Open the bosses’ chest first, right next to it!',
  'C’est l’hôte qui prend le portail : tout le groupe sort avec lui.':
    'The host takes the portal: the whole group leaves with them.',
  'Le sceau se brise : la porte de {nom} s’ouvre !': 'The seal breaks: {nom}’s door opens!',
  'Un passage secret ! Le mur s’effondre… quelque chose rôde derrière.':
    'A secret passage! The wall collapses… something lurks behind it.',
  'Le levier s’abaisse ({n}/{m}).': 'The lever goes down ({n}/{m}).',
  'La dalle s’illumine ({n}/{m}).': 'The tile lights up ({n}/{m}).',
  'Mauvais ordre : les leviers se relèvent. Relis la stèle.':
    'Wrong order: the levers go back up. Read the stele again.',
  'Mauvais ordre : les dalles s’éteignent. Relis la stèle.':
    'Wrong order: the tiles go dark. Read the stele again.',
  'allume les braseros de cette aile avant qu’ils ne s’éteignent':
    'light this wing’s braziers before they go out',
  'abaisse les leviers dans l’ordre que la stèle laisse deviner':
    'pull the levers in the order the stele hints at',
  'foule les dalles gravées dans l’ordre que la stèle laisse deviner':
    'step on the engraved tiles in the order the stele hints at',
  'abats les gardiens liés presque en même temps': 'slay the bound guardians at almost the same time',
  'guide le rayon de lumière jusqu’au cristal avec les miroirs':
    'guide the beam of light to the crystal with the mirrors',
  'écoute la pierre d’écho et frappe les cristaux dans le même ordre':
    'listen to the echo stone and strike the crystals in the same order',
  'allume tous les piliers liés': 'light all the bound pillars',
  'retrouve les trois fragments du sceau cachés dans les urnes':
    'find the three seal fragments hidden in the urns',
  'survis à l’embuscade de la salle voisine': 'survive the ambush in the neighboring room',
  'La porte de {nom} est scellée : {quoi}': '{nom}’s door is sealed: {quoi}',
  'Brasero allumé ({n}/{m}).': 'Brazier lit ({n}/{m}).',
  'Le cristal répond ({n}/{m}).': 'The crystal answers ({n}/{m}).',
  'Un fragment du sceau ! ({n}/{m})': 'A seal fragment! ({n}/{m})',
  'Un grondement sourd : quelque part dans cette aile, un mur a coulissé…':
    'A dull rumble: somewhere in this wing, a wall has slid open…',
  'Fausse note : les cristaux se taisent. Écoute de nouveau la pierre d’écho.':
    'Wrong note: the crystals fall silent. Listen to the echo stone again.',
  '{a} passe avant {b}': '{a} comes before {b}',
  '{b} vient juste après {a}': '{b} comes right after {a}',
  '{a} ouvre la marche': '{a} leads the way',
  '{a} ferme la marche': '{a} brings up the rear',
  '{a} n’ouvre pas la marche': '{a} does not lead the way',
  '{a} ne ferme pas la marche': '{a} does not bring up the rear',
  '{a} n’est pas {n}e': '{a} is not number {n}',
  '« {texte}. » — {verbe} dans le bon ordre.': '“{texte}.” — {verbe} in the right order.',
  '« Les flammes s’éteignent vite : allume les {n} braseros en moins de {s} secondes. »':
    '“The flames die quickly: light the {n} braziers in under {s} seconds.”',
  '« Les gardiens sont liés : abattez-les à moins de {s} secondes d’intervalle, ou ils se relèvent. »':
    '“The guardians are bound: slay them within {s} seconds of each other, or they rise again.”',
  '« Guide la lumière jusqu’au cristal : tourne les miroirs (E). L’un d’eux ment. »':
    '“Guide the light to the crystal: turn the mirrors (E). One of them lies.”',
  '« Chaque pilier réveille aussi ses deux voisins. Allume-les tous. »':
    '“Each pillar also wakes its two neighbors. Light them all.”',
  '« Trois fragments du sceau dorment dans les urnes de cette aile. Elles luisent à peine. »':
    '“Three seal fragments sleep in this wing’s urns. They barely glimmer.”',
  'La pierre d’écho chante une suite de {n} notes. Frappe les cristaux dans le même ordre.':
    'The echo stone sings a sequence of {n} notes. Strike the crystals in the same order.',
  'Le sceau de cette aile est déjà brisé.': 'This wing’s seal is already broken.',
  'Le premier brasero brûle : {s} secondes pour allumer les autres !':
    'The first brazier burns: {s} seconds to light the others!',
  'L’urne se brise… rien dedans.': 'The urn shatters… nothing inside.',
  'Une salle oubliée… Un boss caché s’y réveille !': 'A forgotten room… A hidden boss awakens!',
  'Trop lent : les braseros s’éteignent. Recommence, plus vite.':
    'Too slow: the braziers go out. Try again, faster.',
  'Un gardien tombe : abattez les autres en moins de {s} secondes !':
    'A guardian falls: slay the others within {s} seconds!',
  'Trop tard : le gardien se relève ! Ils doivent tomber ensemble.':
    'Too late: the guardian rises again! They must fall together.',
  'Embuscade ! Les issues se referment…': 'Ambush! The exits slam shut…',
  'Vague {n} sur {m} !': 'Wave {n} of {m}!',
  '[E] Examiner la lézarde': '[E] Examine the crack',
  '[E] Tirer la torche': '[E] Pull the torch',
  '[E] Tourner la statue': '[E] Turn the statue',
  '[E] Écouter la pierre d’écho': '[E] Listen to the echo stone',
  '[E] Tourner le miroir': '[E] Turn the mirror',
  '[E] Frapper le cristal': '[E] Strike the crystal',
  '[E] Toucher le pilier': '[E] Touch the pillar',
  '[E] Fouiller l’urne': '[E] Search the urn',
  // Mécaniques des boss d'instance (boss-mechanics.js).
  'Onde de choc !': 'Shockwave!',
  'Nova : éloignez-vous !': 'Nova: get away!',
  'Anneau : collez-vous à lui !': 'Ring: stick close to it!',
  'Charge !': 'Charge!',
  'Croix : sortez des lignes !': 'Cross: get out of the lines!',
  'Impact partagé : regroupez-vous sur {nom} !': 'Shared impact: stack on {nom}!',
  'Marques : dispersez-vous !': 'Marks: spread out!',
  'Le sol se corrompt !': 'The ground is corrupted!',
  'Rayon tournant !': 'Sweeping beam!',
  'Attraction : résistez !': 'Pull: resist it!',
  'Il disparaît… et retombe !': 'It vanishes… and crashes down!',
  'Zone sûre : tous dans le cercle vert !': 'Safe zone: everyone into the green circle!',
  'Cristal de garde': 'Guardian crystal',
  '{nom} s’entoure de cristaux : brisez-les !': '{nom} surrounds itself with crystals: break them!',
  'Le bouclier se brise !': 'The shield shatters!',
  '{nom} entre en frénésie !': '{nom} goes berserk!',
  'Frénésie': 'Berserk',
  '[E] Sortir de l’instance': '[E] Leave the instance',
  'Portail de retour': 'Return portal',
  '[E] Examiner le mur fissuré': '[E] Examine the cracked wall',
  '[E] Porte scellée': '[E] Sealed door',
  '[E] Lire la stèle': '[E] Read the stele',
  '[E] Allumer le brasero': '[E] Light the brazier',
  '[E] Actionner le levier': '[E] Pull the lever',
  '↟ SORTIE [E] ↟': '↟ EXIT [E] ↟',
  '✦ ARÈNE ✦': '✦ ARENA ✦',
  '✦ RAID ✦': '✦ RAID ✦',
  // ------------------------------------------------------------ Histoire « Les Échos de l’Aurore » (1) : chapitres, sanctuaires, quêtes des chapitres I à III
  'Les Échos de l’Aurore': 'The Echoes of Dawn',
  'Autrefois, six sanctuaires reliés au Cœur de l’Aurore protégeaient l’île. Un jour, les anciens ont dispersé son énergie pour la sauver. Des siècles plus tard, une petite lumière tombe près du Camp de l’Aurore…':
    'Long ago, six sanctuaries bound to the Heart of Dawn protected the island. One day, the ancients scattered its energy to save it. Centuries later, a small light falls near the Dawn Camp…',
  'La Première Étincelle': 'The First Spark',
  'La Forêt qui chante': 'The Singing Forest',
  'Les Lanternes du Marais': 'The Lanterns of the Marsh',
  'Les Couleurs du Passé': 'The Colors of the Past',
  'La Cité des Étoiles': 'The City of Stars',
  'Le Réveil de l’Aurore': 'The Awakening of Dawn',
  'Sanctuaire des Murmures': 'Sanctuary of Whispers',
  'Sur l’autel, des mots gravés en spirale : « Ici dormait la première étoile, celle qui écoute. Quand la forêt chantera de nouveau, elle reviendra vers le Cœur. »':
    'On the altar, words carved in a spiral: “Here slept the first star, the one who listens. When the forest sings again, it will return to the Heart.”',
  'Sanctuaire des Reflets': 'Sanctuary of Reflections',
  'Un bassin immobile reflète un ciel qui n’existe plus. Une inscription : « La deuxième étoile se souvient de tout. Le reflet ne ment qu’à ceux qui ne regardent pas. »':
    'A still pool reflects a sky that no longer exists. An inscription: “The second star remembers everything. The reflection lies only to those who do not look.”',
  'Bibliothèque des Saisons': 'Library of the Seasons',
  'Des étagères de pierre couvertes de feuilles dorées qui ne tombent jamais. Sur le pupitre : « La troisième étoile garde le temps. Elle se souvient de chaque automne. »':
    'Stone shelves covered in golden leaves that never fall. On the lectern: “The third star keeps time. It remembers every autumn.”',
  'Cité des Étoiles': 'City of Stars',
  'Sous les sables, une salle voûtée constellée de cristaux. Une carte du ciel gravée au plafond : « La quatrième étoile guidait les voyageurs du désert. »':
    'Beneath the sands, a vaulted hall studded with crystals. A sky map carved on the ceiling: “The fourth star guided the travelers of the desert.”',
  'Sanctuaire des Six Lumières': 'Sanctuary of the Six Lights',
  'Six alcôves en cercle autour d’un autel de cristal. « Quand les six lumières se tiendront ensemble, la Chambre de l’Aurore s’ouvrira. »':
    'Six alcoves in a circle around a crystal altar. “When the six lights stand together, the Chamber of Dawn will open.”',
  'Chambre de l’Aurore': 'Chamber of Dawn',
  'Le Cœur de l’Aurore bat doucement au centre de la chambre, entouré de six étoiles. Sa lumière se répand sur toute l’île.':
    'The Heart of Dawn beats softly at the center of the chamber, surrounded by six stars. Its light spreads across the whole island.',
  'Esprit amical': 'Friendly spirit',
  'Trois voyageurs': 'Three travelers',
  'Érable': 'Maple',
  'La lumière tombée du ciel': 'The light that fell from the sky',
  'Suivre les traces lumineuses depuis le camp': 'Follow the glowing trail from the camp',
  'Lumi devient ta compagne de voyage': 'Lumi becomes your traveling companion',
  'La carte aux six étoiles': 'The map of six stars',
  'Carte des sanctuaires dans le journal': 'Map of the sanctuaries in the journal',
  'Le Cœur de l’Aurore… on n’en parlait que dans les berceuses. Va voir Sylva, dans la Forêt ancienne.':
    'The Heart of Dawn… we only spoke of it in lullabies. Go see Sylva, in the Ancient Forest.',
  'Le mouton aux grandes ambitions': 'The sheep with great ambitions',
  'Équipement Rare de ton niveau': 'Rare gear of your level',
  'Le trésor qui n’existe pas': 'The treasure that doesn’t exist',
  'Bastian jure qu’un trésor est enterré « là où les ombres de trois arbres se rejoignent ». Tout le camp se moque de lui.':
    'Bastian swears a treasure is buried “where the shadows of three trees meet”. The whole camp laughs at him.',
  'Trouver où se croisent les ombres des trois arbres et creuser (E)':
    'Find where the shadows of the three trees cross and dig (E)',
  'Le coffre secret (équipement Rare de ton niveau)': 'The secret chest (Rare gear of your level)',
  'Ils disent que mon trésor n’existe pas. Pfff. La vieille chanson dit : « Là où trois ombres se tiennent la main, dort le coffre du marin. »':
    'They say my treasure doesn’t exist. Pfff. The old song goes: “Where three shadows hold hands, the sailor’s chest lies in the sands.”',
  'Le poisson du vieux pêcheur': 'The old fisherman’s fish',
  'Observer les ondulations de l’étang et pêcher le poisson doré (E au bon remous)':
    'Watch the ripples on the pond and catch the golden fish (E at the right ripple)',
  'Expérience de pêche, recette « Poisson doré en croûte de sel »':
    'Fishing experience, recipe “Salt-crusted golden fish”',
  'La mélodie des anciens': 'The melody of the ancients',
  'Retrouver les quatre pierres musicales dans la forêt': 'Find the four musical stones in the forest',
  'Jouer la mélodie des anciens sur le cercle de pierres':
    'Play the melody of the ancients on the stone circle',
  'Accès au Sanctuaire des Murmures': 'Access to the Sanctuary of Whispers',
  'Grave, aiguë, puis les deux du milieu de la plus grave à la plus aiguë. Écoute bien chaque pierre.':
    'Low, high, then the two in the middle from lowest to highest. Listen closely to each stone.',
  'Le gardien aux racines d’or': 'The guardian with golden roots',
  'Écouter l’arbre gardien': 'Listen to the guardian tree',
  'Bénédiction des racines d’or (cosmétique) et première étoile':
    'Blessing of the golden roots (cosmetic) and the first star',
  'Le chemin des lucioles': 'The path of the fireflies',
  'Traverser le labyrinthe en suivant les lucioles (pas les panneaux)':
    'Cross the maze by following the fireflies (not the signposts)',
  'Raccourci forestier : une pierre de passage vers le Camp de l’Aurore':
    'Forest shortcut: a waystone to the Dawn Camp',
  'Ce bosquet est un labyrinthe. Les panneaux ? Une farce des fées : ils mentent tous.':
    'This grove is a maze. The signposts? A fairy prank: they all lie.',
  'Le voleur invisible': 'The invisible thief',
  'Suivre les petites empreintes (elles n’apparaissent que de près)':
    'Follow the small footprints (they only appear up close)',
  'Or et équipement Rare de ton niveau': 'Gold and Rare gear of your level',
  'On me vole mes provisions ! Des pommes, du fromage, même mes biscuits au miel.':
    'Someone is stealing my supplies! Apples, cheese, even my honey biscuits.',
  'Je ne vois jamais personne. Mais il y a de toutes petites empreintes… Tu veux bien enquêter ?':
    'I never see anyone. But there are tiny little footprints… Would you investigate?',
  'Le petit voleur vient manger dans ma main maintenant. On est amis.':
    'The little thief eats out of my hand now. We’re friends.',
  'Le peintre des ombres': 'The painter of shadows',
  'Trouver le point d’observation où l’ombre de l’arbre devient un oiseau (E)':
    'Find the viewpoint where the tree’s shadow becomes a bird (E)',
  'Un jour, d’un endroit précis, l’ombre de ce vieil arbre est devenue un oiseau. Un oiseau parfait !':
    'One day, from one precise spot, this old tree’s shadow became a bird. A perfect bird!',
  'Les lanternes perdues': 'The lost lanterns',
  'Passage vers le Sanctuaire des Reflets': 'Passage to the Sanctuary of Reflections',
  'Le miroir des souvenirs': 'The mirror of memories',
  'Deuxième étoile et un souvenir dans le journal': 'The second star and a memory in the journal',
  'Le pont qui ne tient jamais': 'The bridge that never holds',
  'Le pont restauré pour toujours': 'The bridge restored for good',
  'Le fantôme qui avait oublié son nom': 'The ghost who forgot his name',
  'Interroger les habitants et examiner les objets du marais (4 indices)':
    'Question the locals and examine the objects of the marsh (4 clues)',
  'Rendre son nom à l’esprit': 'Give the spirit back his name',
  'Équipement Épique de ton niveau': 'Epic gear of your level',
  'Bouuh… pardon. Je ne voulais pas te faire peur. J’ai oublié mon nom, tu sais. Ça arrive, quand on est mort depuis longtemps.':
    'Boooh… sorry. I didn’t mean to scare you. I forgot my name, you know. It happens when you’ve been dead a long time.',
  'Les gens d’ici et les objets du marais se souviennent peut-être de moi. Tu veux bien chercher ?':
    'The people here and the objects of the marsh may remember me. Would you look?',
  'Une lanterne, une barque, un vieux chapeau… et les habitants. Quelqu’un se souvient forcément.':
    'A lantern, a rowboat, an old hat… and the locals. Someone must remember.',
  'Orrin le passeur': 'Orrin the ferryman',
  'Ilian le lanternier': 'Ilian the lamplighter',
  'Barnabé le pêcheur': 'Barnabé the fisherman',
  'Silas le chapelier': 'Silas the hatter',
  'La traversée des nénuphars': 'The water-lily crossing',
  'Traverser l’étang sur les nénuphars sans t’arrêter et ouvrir le coffre de l’îlot':
    'Cross the pond on the water lilies without stopping and open the islet’s chest',
  'Le coffre caché (équipement Épique de ton niveau)': 'The hidden chest (Epic gear of your level)',
  // ------------------------------------------------------------ Histoire « Les Échos de l’Aurore » (2) : quêtes des chapitres IV à VI, épreuves et indices
  'Le village des feuilles dorées': 'The village of golden leaves',
  'Toucher les quatre feuilles dorées pour voir les souvenirs du village':
    'Touch the four golden leaves to see the village’s memories',
  'Troisième étoile et accès à la Bibliothèque des Saisons':
    'The third star and access to the Library of the Seasons',
  'Les feuilles dorées : un village heureux, une forge, un four, une cloche et une harpe. Quand l’ombre vint, les villageois partirent vers les sanctuaires… en laissant tout derrière eux.':
    'The golden leaves: a happy village, a forge, an oven, a bell and a harp. When the shadow came, the villagers left for the sanctuaries… leaving everything behind.',
  'Le secret des quatre saisons': 'The secret of the four seasons',
  'Retrouver les quatre fragments de la fresque': 'Find the four fragments of the fresco',
  'Accès aux archives anciennes (un souvenir dans le journal)':
    'Access to the ancient archives (a memory in the journal)',
  'Les archives des saisons : l’Ombre se nourrissait de lumière. Pour l’affamer, les anciens endormirent le Cœur et cachèrent ses six étoiles. Quand l’Ombre disparut, plus personne ne se souvenait comment le réveiller.':
    'The archives of the seasons: the Shadow fed on light. To starve it, the ancients put the Heart to sleep and hid its six stars. When the Shadow vanished, no one remembered how to wake it.',
  'Le concours des feuilles': 'The leaf contest',
  'Attraper la feuille dorée dans le vent (E quand elle est sur toi)':
    'Catch the golden leaf in the wind (E when it is over you)',
  'Le moulin qui tournait à l’envers': 'The mill that turned backward',
  'Or et le coffre du grenier (équipement Épique)': 'Gold and the attic chest (Epic gear)',
  'Le renard et les trois voyageurs': 'The fox and the three travelers',
  'Écouter les trois témoignages': 'Hear the three accounts',
  'Fouiller la bonne cachette (E)': 'Search the right hiding place (E)',
  'La cachette secrète du renard (équipement Épique)': 'The fox’s secret hiding place (Epic gear)',
  'Un renard qui brille ! Il a filé avec nos provisions. Chacun de nous l’a vu, mais pas au même endroit…':
    'A glowing fox! He ran off with our supplies. Each of us saw him, but not in the same place…',
  'Écoute-nous tous les trois, compare, et trouve sa cachette. Attention, l’un de nous se trompe souvent.':
    'Listen to all three of us, compare, and find his hiding place. Careful, one of us is often wrong.',
  'Deux de nos témoignages sont vrais. Le troisième… c’est Gaspard, il voit mal.':
    'Two of our accounts are true. The third… that’s Gaspard, he can’t see well.',
  'La cité sous les sables': 'The city beneath the sands',
  'La machine de l’Aurore': 'The Dawn machine',
  'Cinquième étoile et la salle du trésor (équipement Épique)':
    'The fifth star and the treasure room (Epic gear)',
  'Lumi t’attend dans la Forêt enchantée. Elle sait où se trouve le sanctuaire central.':
    'Lumi is waiting for you in the Enchanted Forest. She knows where the central sanctuary is.',
  'La machine de l’Aurore : pour réveiller le Cœur, il faut réunir les six étoiles dans le sanctuaire central, puis qu’une étincelle du Cœur lui-même chante avec elles.':
    'The Dawn machine: to wake the Heart, the six stars must be united in the central sanctuary, then a spark of the Heart itself must sing with them.',
  'Le marchand qui vendait du vent': 'The merchant who sold wind',
  'Le temple des miroirs': 'The temple of mirrors',
  'La porte d’un petit temple ne s’ouvre qu’à la lumière du soleil. Des miroirs anciens sont encore là.':
    'The door of a small temple only opens to sunlight. Ancient mirrors are still there.',
  'Orienter les miroirs pour diriger le rayon solaire sur la porte':
    'Turn the mirrors to direct the sunbeam onto the door',
  'Le coffre du temple (équipement Épique)': 'The temple chest (Epic gear)',
  'Ce temple garde un coffre depuis mille ans. Sa porte attend un rayon de soleil.':
    'This temple has guarded a chest for a thousand years. Its door awaits a ray of sunlight.',
  'Quatre miroirs, un rayon. Tourne-les (E), et suis la lumière jusqu’au soleil gravé sur la porte.':
    'Four mirrors, one ray. Turn them (E), and follow the light to the sun carved on the door.',
  'Le secret de l’oasis': 'The secret of the oasis',
  'Recette « Tajine de l’oasis » et oasis restaurée': 'Recipe “Oasis tagine” and the oasis restored',
  'Le sanctuaire des six lumières': 'The sanctuary of the six lights',
  'Placer les étoiles sur l’autel (E)': 'Place the stars on the altar (E)',
  'Accès à la Chambre de l’Aurore': 'Access to the Chamber of Dawn',
  'Tu entends ? C’est ici. Le sanctuaire des six lumières… je m’en souviens, je crois.':
    'Do you hear it? It’s here. The sanctuary of the six lights… I remember it, I think.',
  'Je me sens… plus chaude. Comme si je rentrais chez moi.': 'I feel… warmer. As if I were coming home.',
  'Quatre': 'Four',
  'Cinq': 'Five',
  'Six': 'Six',
  'Le Cœur de l’Aurore': 'The Heart of Dawn',
  'Lire la fresque du gardien (E)': 'Read the guardian’s fresco (E)',
  'Réunir la lumière des six cristaux': 'Unite the light of the six crystals',
  'Titre « Gardien de l’Aurore », aura lumineuse, sixième étoile et la Chambre de l’Aurore pour toujours':
    'Title “Guardian of the Dawn”, a glowing aura, the sixth star and the Chamber of Dawn forever',
  'Je suis Auralis. J’étais le gardien du Cœur… et je suis resté, même quand tout le monde est parti.':
    'I am Auralis. I was the guardian of the Heart… and I stayed, even when everyone else left.',
  'Tiens bon. Tant qu’il reste des cristaux, le Cœur peut se réveiller.':
    'Hold on. As long as crystals remain, the Heart can wake.',
  'L’île respire à nouveau. Les six sanctuaires brillent. Merci, Gardien.':
    'The island breathes again. The six sanctuaries shine. Thank you, Guardian.',
  'Le Cœur de l’Aurore se réveille. Les six sanctuaires retrouvent leur lumière, et Lumi révèle la vérité : elle était une étincelle du Cœur, tombée du ciel pour trouver quelqu’un capable de le réveiller. Ce quelqu’un, c’était toi.':
    'The Heart of Dawn awakens. The six sanctuaries regain their light, and Lumi reveals the truth: she was a spark of the Heart, fallen from the sky to find someone able to wake it. That someone was you.',
  'Le monde à l’envers': 'The upside-down world',
  'Le coffre enchanté (équipement Légendaire)': 'The enchanted chest (Legendary gear)',
  'Regarde : deux clairières jumelles. Mais le miroir est capricieux : la gauche devient la droite.':
    'Look: two twin glades. But the mirror is fickle: left becomes right.',
  'Deux leviers abaissés, un seul levé. Regarde quels rochers bougent de l’autre côté du miroir.':
    'Two levers down, only one up. Watch which rocks move on the other side of the mirror.',
  'Parfois, je me demande quelle clairière est la vraie.': 'Sometimes I wonder which glade is the real one.',
  'Le dragon qui avait peur de voler': 'The dragon who was afraid to fly',
  'Équipement Épique de ton niveau et Pyria s’installe dans la forêt':
    'Epic gear of your level, and Pyria settles in the forest',
  'Le lac aux mille étoiles': 'The lake of a thousand stars',
  'Marcher sur les pierres du lac dans l’ordre de la constellation reflétée':
    'Walk on the lake’s stones in the order of the reflected constellation',
  'Un bijou Légendaire avec des statistiques secondaires aléatoires':
    'A Legendary piece of jewelry with random secondary stats',
  'Regarde le reflet : une constellation, le Cerf des neiges. Ses étoiles s’allument l’une après l’autre.':
    'Look at the reflection: a constellation, the Snow Stag. Its stars light up one after another.',
  'Regarde le reflet : l’étoile qui s’allume en premier, puis la suivante…':
    'Look at the reflection: the star that lights up first, then the next…',
  'Une vieille lanterne gravée : « I. — Que la lumière guide les égarés. »':
    'An old engraved lantern: “I. — May the light guide the lost.”',
  'Une barque échouée. Sur le banc : « Au lanternier, pour ses tournées du soir. »':
    'A beached rowboat. On the bench: “To the lamplighter, for his evening rounds.”',
  'Une feuille dorée : le forgeron battait le fer, et l’enclume chantait dans la maison du puits.':
    'A golden leaf: the smith hammered the iron, and the anvil sang in the house by the well.',
  'Une feuille dorée : la boulangère sonnait la cloche quand le pain sortait du four.':
    'A golden leaf: the baker rang the bell when the bread came out of the oven.',
  'Une feuille dorée : dans la maison au jardin, une mère berçait son enfant.':
    'A golden leaf: in the house with the garden, a mother rocked her child.',
  'Une feuille dorée : le soir, du haut de la petite tour, la harpe jouait pour tout le village.':
    'A golden leaf: in the evening, from the top of the little tower, the harp played for the whole village.',
  'Fragment : « Au nord dort l’hiver, sous la neige. »':
    'Fragment: “In the north sleeps winter, beneath the snow.”',
  'Fragment : « À l’est se lève le printemps. »': 'Fragment: “In the east rises spring.”',
  'Fragment : « Au sud brûle l’été. »': 'Fragment: “In the south burns summer.”',
  'Fragment : « À l’ouest tombe l’automne. »': 'Fragment: “In the west falls autumn.”',
  'Barnabé : « Il s’est caché près d’une grosse citrouille, j’en suis sûr. »':
    'Barnabé: “He hid near a big pumpkin, I’m sure of it.”',
  'Mila : « Il déteste l’eau. Il ne va jamais près du ruisseau. »':
    'Mila: “He hates water. He never goes near the stream.”',
  'Gaspard : « Moi je l’ai vu sous le pont du ruisseau ! Enfin… je crois. »':
    'Gaspard: “I saw him under the bridge by the stream! Well… I think.”',
  // ------------------------------------------------------------ Histoire (3) : objectifs de terrain, Vesper et la Ballade
  'Interlude': 'Interlude',
  'Les Voix d’en bas': 'The Voices Below',
  'Sous l’île, la pierre chante depuis que l’étoile est tombée. Durgrim ne dort plus.':
    'Beneath the island, the stone has been singing since the star fell. Durgrim no longer sleeps.',
  'Garde Dwalin': 'Guard Dwalin',
  'Éclaireuse Dísa': 'Scout Dísa',
  'Éclaireuse Thyra': 'Scout Thyra',
  'Petit Fili': 'Little Fili',
  'Garde Balin': 'Guard Balin',
  'Perrin l’Égaré': 'Perrin the Lost',
  'Orsik le Sonneur': 'Orsik the Bell-Ringer',
  'Sœur Runa': 'Sister Runa',
  'Grand-père Nog': 'Grandpa Nog',
  'Éclat d’étoile': 'Star shard',
  'Ramasser l’éclat': 'Pick up the shard',
  'Ramasser les éclats tombés autour du cristal': 'Gather the shards fallen around the crystal',
  'le cristal': 'the crystal',
  'Rendre ses éclats au cristal': 'Give the crystal its shards back',
  'Protéger le cristal des slimes attirés par sa lumière':
    'Protect the crystal from the slimes drawn to its light',
  'Fragment de carte': 'Map fragment',
  'Reprendre les fragments de carte aux loups et aux sangliers':
    'Take the map fragments back from the wolves and boars',
  'Sceau d’ombre': 'Shadow seal',
  'Arracher le sceau': 'Tear out the seal',
  'Arracher les trois sceaux d’ombre plantés dans les ruines':
    'Tear out the three shadow seals driven into the ruins',
  'Une étincelle tombe où nul ne l’attend, et la plaine se souvient du premier chant.':
    'A spark falls where no one waits for it, and the plain remembers the very first song.',
  'Sur le dernier sceau, un nom gravé à l’envers : Vesper. Orven a pâli en le lisant, et n’a rien voulu en dire.':
    'On the last seal, a name carved backwards: Vesper. Orven turned pale when he read it, and would say nothing more.',
  'Attraper Pompon': 'Catch Pompom',
  'Rattraper Pompon, qui court dans tous les sens': 'Catch Pompom, who is running every which way',
  'Loup vaincu': 'Wolf defeated',
  'Éloigner les loups de la colline': 'Drive the wolves away from the hill',
  'Emmener Pompon': 'Lead Pompom',
  'Accompagner Pompon jusqu’au drapeau du sommet': 'Escort Pompom to the flag at the top',
  'Pompon veut monter au sommet de la colline. Il en rêve, je te jure ! Alors il saute la barrière toutes les nuits.':
    'Pompom wants to climb to the top of the hill. He dreams of it, I swear! So he jumps the fence every night.',
  'Rattrape-le, chasse les loups, puis monte là-haut avec lui. Juste une fois. Pour qu’il voie.':
    'Catch him, chase off the wolves, then go up there with him. Just once. So he can see.',
  'Page de chanson mâchonnée': 'Chewed-up song page',
  'Reprendre aux sangliers les pages de la chanson': 'Take the pages of the song back from the boars',
  'Dent-de-Cale, le gardien du coffre': 'Holdtusk, the guardian of the chest',
  'Vaincre le vieux sanglier qui dormait sur le coffre': 'Defeat the old boar that was sleeping on the chest',
  'La preuve ? Un sanglier l’a mangée. Enfin, presque toute. Retrouve les pages, suis l’ombre des trois chênes, et creuse !':
    'Proof? A boar ate it. Well, most of it. Find the pages, follow the shadow of the three oaks, and dig!',
  'Pêcher trois poissons pour l’appât, dans n’importe quelle eau': 'Catch three fish for bait, in any water',
  'Le poisson doré ne mord pas au ver. Il lui faut du poisson frais. Trois prises, pêchées de ta main.':
    'The golden fish won’t bite on a worm. It wants fresh fish. Three of them, caught by your own hand.',
  'Ensuite, regarde mon étang : quand une onde brille d’or, il est dessous. Approche-toi de ce remous et ferre (E) pendant qu’il brille !':
    'Then watch my pond: when a ripple shines gold, it’s underneath. Get close to that ripple and strike (E) while it shines!',
  'Araignée vaincue': 'Spider defeated',
  'Chasser les araignées de la forêt': 'Drive the spiders out of the forest',
  'Cocon déchiré': 'Cocoon torn open',
  'Déchirer le cocon': 'Tear the cocoon open',
  'Libérer les oiseaux chanteurs pris dans les cocons': 'Free the songbirds caught in the cocoons',
  'Fiole de sève d’or': 'Vial of golden sap',
  'Reprendre la sève d’or aux gobelins': 'Take the golden sap back from the goblins',
  'l’arbre gardien': 'the guardian tree',
  'Verser la sève aux racines': 'Pour the sap on the roots',
  'Défendre l’arbre gardien pendant qu’il boit sa sève': 'Defend the guardian tree while it drinks its sap',
  'Les gobelins rôdent partout dans la Forêt ancienne. La sève brille dans leurs fioles, tu ne peux pas la manquer.':
    'Goblins prowl all over the Ancient Forest. The sap glows in their vials, you can’t miss it.',
  'La racine écoute, la feuille répond, l’or coule en silence sous les troncs profonds.':
    'The root listens, the leaf replies, gold flows in silence where the deep trunk lies.',
  'L’arbre gardien : « Petite étincelle, te voilà revenue. Une autre est venue avant toi, la voilée. Elle chantait, jadis. Maintenant elle cherche les étoiles pour les éteindre. Trouve-les avant elle. »':
    'The guardian tree: “Little spark, you have come back. Another came before you, the veiled one. She used to sing. Now she seeks the stars to put them out. Find them before she does.”',
  'Luciole farceuse': 'Prankster firefly',
  'Attraper la luciole': 'Catch the firefly',
  'Attraper trois lucioles farceuses devant le bosquet': 'Catch three prankster fireflies outside the grove',
  'Attrape trois lucioles et elles t’aideront. Suis-les jusqu’à la vieille pierre de passage, de l’autre côté.':
    'Catch three fireflies and they’ll help you. Follow them to the old waystone, on the other side.',
  'Le voleur': 'The thief',
  'Attraper le voleur': 'Catch the thief',
  'Rattraper le voleur avant qu’il ne disparaisse': 'Catch the thief before it disappears',
  'Décider du sort du petit voleur': 'Decide the fate of the little thief',
  'Un… caméléon-renard ? Avec les joues pleines de mon miel ? Dis-moi, toi qui l’as attrapé : j’en fais quoi ?':
    'A… chameleon-fox? With its cheeks full of my honey? Tell me, since you caught it: what do I do with it?',
  'Il travaille pour payer ses dettes : il garde mon sac. Je n’ai jamais eu de meilleur gardien.':
    'It’s working off its debts: it guards my sack. I’ve never had a better guard.',
  'Lui laisser un biscuit chaque soir': 'Leave it a biscuit every night',
  'L’engager comme gardien du sac': 'Hire it to guard the sack',
  'Cueillir trois herbes pour les pigments': 'Pick three herbs for the pigments',
  'Touffe de poils fins': 'Tuft of fine hair',
  'Prendre des poils de chauve-souris pour les pinceaux': 'Take bat hair for the brushes',
  'Il me faut des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Et l’endroit : « au nord de l’arbre, un pas à l’ouest ». Appelle-moi (E) quand tu y es.':
    'I need herbs for the colors, bat hair for the brushes. And the spot: “north of the tree, one step west”. Call me (E) when you’re there.',
  'Flamme volée': 'Stolen flame',
  'Reprendre les flammes volées par les feux follets': 'Take back the flames stolen by the wisps',
  'Lanterne rallumée': 'Lantern relit',
  'Rallumer la lanterne': 'Relight the lantern',
  'Rallumer les quatre lanternes': 'Relight the four lanterns',
  'les lanternes': 'the lanterns',
  'Lever la grande lanterne': 'Raise the great lantern',
  'Défendre les lanternes jusqu’à l’aube': 'Defend the lanterns until dawn',
  'Une flamme avalée par un feu follet ne s’éteint pas. Il faut seulement la lui reprendre.':
    'A flame swallowed by a wisp doesn’t go out. You just have to take it back.',
  'Dans la boue, une broche en forme de voile. Vesper n’est plus seule : des gens la suivent et se font appeler la Confrérie du Voile.':
    'In the mud, a brooch shaped like a veil. Vesper is no longer alone: people follow her, and they call themselves the Brotherhood of the Veil.',
  'Éclat de miroir': 'Mirror shard',
  'Retrouver les éclats des miroirs brisés': 'Find the shards of the broken mirrors',
  'Miroir réparé': 'Mirror mended',
  'Réparer le miroir': 'Mend the mirror',
  'Le premier miroir : les anciens chantent autour du Cœur de l’Aurore. Deux voix mènent le chœur, un frère et une sœur. Auralis et Vesper.':
    'The first mirror: the ancients sing around the Heart of Dawn. Two voices lead the choir, a brother and a sister. Auralis and Vesper.',
  'Le deuxième miroir : une ombre immense monte de la mer. Elle se nourrit de lumière. Vesper est la seule à ne pas reculer : elle écoute.':
    'The second mirror: a vast shadow rises from the sea. It feeds on light. Vesper is the only one who doesn’t step back: she listens.',
  'Le troisième miroir : le Cœur se brise en six étoiles pour échapper à l’Ombre. Vesper hurle. On ne l’a pas prévenue.':
    'The third mirror: the Heart shatters into six stars to escape the Shadow. Vesper screams. No one had warned her.',
  'Le dernier miroir : six sanctuaires s’allument sur l’île. Vesper est restée du mauvais côté de la mer, seule avec l’Ombre.':
    'The last mirror: six sanctuaries light up across the island. Vesper is left on the wrong side of the sea, alone with the Shadow.',
  'Remettre les éclats dans leurs cadres et regarder': 'Put the shards back in their frames and look',
  'Le Reflet menteur': 'The Lying Reflection',
  'Regarder ton reflet': 'Look at your reflection',
  'Affronter le reflet qui ne te ressemble pas': 'Face the reflection that looks nothing like you',
  'Les basilics adorent ce qui brille. Méfie-toi quand tu ramasses un éclat.':
    'Basilisks love anything shiny. Be careful when you pick up a shard.',
  'L’eau garde un visage que l’eau n’a pas pris ; qui regarde longtemps s’y trouve, et sourit.':
    'Water keeps a face that water never took; who looks long enough finds it there, and smiles back.',
  'Le miroir des souvenirs : les anciens vivaient en paix autour du Cœur de l’Aurore, guidés par deux chanteurs, Auralis et sa sœur Vesper. Une ombre est venue de la mer. Ils ont brisé le Cœur en six étoiles pour le sauver. Vesper, restée au large, a entendu le silence tomber. Elle n’a jamais su que c’était un sacrifice. Elle a cru à une trahison.':
    'The mirror of memories: the ancients lived in peace around the Heart of Dawn, led by two singers, Auralis and his sister Vesper. A shadow came from the sea. They shattered the Heart into six stars to save it. Vesper, left at sea, heard the silence fall. She never knew it was a sacrifice. She thought it was a betrayal.',
  'Planche solide': 'Sturdy plank',
  'Ramasser la planche': 'Pick up the plank',
  'Ramasser des planches échouées autour de l’étang': 'Gather planks washed up around the pond',
  'Tendon de mante': 'Mantis tendon',
  'Prendre des tendons de mante pour les cordes': 'Take mantis tendons for the ropes',
  'le pont': 'the bridge',
  'Commencer les travaux': 'Start the work',
  'Défendre le pont pendant que Goran cloue': 'Defend the bridge while Goran hammers',
  'Mon pont ? Une catastrophe. Onze fois que je le reconstruis. Onze fois !':
    'My bridge? A disaster. Eleven times I’ve rebuilt it. Eleven!',
  'Cette fois, on fait ça bien : de vraies planches, de vraies cordes. Et toi, avec ton arme, entre les bêtes et moi pendant que je cloue.':
    'This time we do it right: real planks, real ropes. And you, with your weapon, between the beasts and me while I hammer.',
  'Accompagner Ilian': 'Walk with Ilian',
  'Accompagner Ilian pour sa dernière tournée': 'Walk with Ilian on his last round',
  'Basilic vaincu': 'Basilisk defeated',
  'Attirer le vieux basilic en chassant les siens': 'Draw out the old basilisk by hunting its kin',
  'Gobe-Tout, le basilic glouton': 'Gulp, the greedy basilisk',
  'Appeler Gobe-Tout': 'Call Gulp',
  'Vaincre Gobe-Tout et récupérer la clé': 'Defeat Gulp and get the key back',
  'Il y a un coffre sur l’îlot ! J’avais la clé, mais Gobe-Tout l’a gobée. Il gobe tout. C’est pour ça qu’il s’appelle comme ça.':
    'There’s a chest on the islet! I had the key, but Gulp gulped it. He gulps everything. That’s why he’s called that.',
  'Après, saute de nénuphar en nénuphar sans t’arrêter. Si tu tombes, l’eau te ramène sur la rive. Promis, je ne rirai pas !':
    'After that, jump from lily to lily without stopping. If you fall, the water brings you back to shore. I promise I won’t laugh!',
  'Voilé mis en fuite': 'Veiled one driven off',
  'Chasser les pilleurs et les bandits de la Confrérie':
    'Drive off the raiders and bandits of the Brotherhood',
  'Objet du village': 'Village keepsake',
  'Reprendre ce qu’ils ont volé au village': 'Take back what they stole from the village',
  'Maison rendue à elle-même': 'House made whole again',
  'Rendre l’objet à la maison': 'Give the house its keepsake back',
  'Rendre à chaque maison ce qui lui appartient': 'Give each house back what belongs to it',
  'la fresque': 'the fresco',
  'Assembler la fresque': 'Piece the fresco together',
  'Tenir tête aux quatre saisons, l’une après l’autre': 'Stand up to the four seasons, one after another',
  'Les fragments sont au nord, à l’est, au sud et à l’ouest. Comme les saisons.':
    'The fragments lie to the north, east, south and west. Like the seasons.',
  'Quatre saisons tournent autour d’un seul nom ; la feuille qui tombe est encore une chanson.':
    'Four seasons turn around a single name; the falling leaf is still a song, the same.',
  'Les archives des saisons : l’Ombre se nourrissait de lumière. Pour l’affamer, les anciens endormirent le Cœur et cachèrent ses six étoiles. Quand l’Ombre disparut, plus personne ne se souvenait comment le réveiller. Dans la marge, une autre main a écrit : « Moi, je m’en souviens. »':
    'The archives of the seasons: the Shadow fed on light. To starve it, the ancients put the Heart to sleep and hid its six stars. When the Shadow vanished, no one remembered how to wake it. In the margin, another hand has written: “I remember.”',
  'Courir la boucle du concours avant la fin du temps': 'Run the contest loop before time runs out',
  'Le grand concours d’automne ! Première épreuve : la boucle des érables. Six fanions, et le temps file.':
    'The great autumn contest! First trial: the maple loop. Six pennants, and the clock is ticking.',
  'Deuxième épreuve : une feuille dorée danse dans le vent. Ne la poursuis pas, devine où elle va. E quand elle passe sur toi !':
    'Second trial: a golden leaf dances in the wind. Don’t chase it, guess where it’s going. E when it passes over you!',
  'Engrenage': 'Gear',
  'Reprendre les engrenages aux trolls': 'Take the gears back from the trolls',
  'Engrenage remonté': 'Gear refitted',
  'Remonter l’engrenage': 'Refit the gear',
  'Remonter les engrenages du moulin': 'Refit the gears of the mill',
  'Scrr-Scrr, la terreur du grenier': 'Scrr-Scrr, the terror of the attic',
  'Ouvrir le grenier': 'Open the attic',
  'Déloger ce qui fait « scrr-scrr » dans le grenier': 'Flush out whatever goes “scrr-scrr” in the attic',
  'Les trolls m’ont pris trois engrenages. Des colliers ! Ils en font des colliers ! Et mon moulin tourne à l’envers.':
    'The trolls took three of my gears. Necklaces! They make necklaces out of them! And my mill turns backwards.',
  'Reprends-les, remonte-les. Et tant que tu y es… quelque chose fait « scrr-scrr » dans mon grenier. Je préfère ne pas savoir.':
    'Take them back, refit them. And while you’re at it… something goes “scrr-scrr” in my attic. I’d rather not know.',
  'Attraper le renard': 'Catch the fox',
  'Rattraper le renard magique': 'Catch the magic fox',
  'Veilleur renvoyé au sable': 'Watcher returned to the sand',
  'Renvoyer au sable les veilleurs de la cité': 'Return the watchers of the city to the sand',
  'Obélisque dégagé': 'Obelisk uncovered',
  'Dégager les trois obélisques ensevelis': 'Uncover the three buried obelisks',
  'Rakhem, le gardien sans visage': 'Rakhem, the faceless guardian',
  'Poser la main sur l’étoile gravée': 'Lay your hand on the carved star',
  'Vaincre le gardien qui barre l’escalier': 'Defeat the guardian barring the stairway',
  'Les squelettes ne sont pas cruels. Ils obéissent à un ordre vieux de mille ans : « Ne laissez entrer personne. »':
    'The skeletons aren’t cruel. They obey a thousand-year-old order: “Let no one in.”',
  'Quatrième étoile et accès à la Cité des Étoiles': 'The fourth star and access to the City of Stars',
  'Écaille de verre solaire': 'Sun-glass scale',
  'Prendre des écailles de verre aux drakes des dunes': 'Take glass scales from the dune drakes',
  'Anneau lancé': 'Ring set spinning',
  'Lancer l’anneau': 'Set the ring spinning',
  'Lancer les trois anneaux de la machine': 'Set the machine’s three rings spinning',
  'la machine': 'the machine',
  'Allumer la machine': 'Switch on the machine',
  'Défendre la machine pendant qu’elle chauffe': 'Defend the machine while it heats up',
  'Les drakes des dunes muent souvent. Ceux qui muent sont de mauvaise humeur.':
    'Dune drakes molt often. The ones that are molting are in a bad mood.',
  'Le sable a tout bu, sauf l’étoile et le soir ; marche, voyageur, la nuit n’est pas le noir.':
    'The sand drank it all, but the star and the light; walk on, traveler, dark is not the night.',
  'La machine de l’Aurore : pour réveiller le Cœur, il faut réunir les six étoiles dans le sanctuaire central, puis qu’une étincelle du Cœur lui-même chante avec elles. Derrière un pilier, une femme voilée écoutait. Elle est partie sans se battre.':
    'The Dawn machine: to wake the Heart, the six stars must be gathered in the central sanctuary, then a spark of the Heart itself must sing with them. Behind a pillar, a veiled woman was listening. She left without a fight.',
  'Mettre en bouteille': 'Bottle it',
  'Remettre quatre tourbillons en bouteille': 'Put four whirlwinds back in their bottles',
  'Drake mis en fuite': 'Drake driven off',
  'Éloigner les drakes qui respirent la marchandise': 'Drive off the drakes that are breathing in the goods',
  'Une bouteille de brise, de la part de Zafir ? Il me doit de l’argent depuis trois ans, et il m’envoie du vent.':
    'A bottle of breeze, from Zafir? He has owed me money for three years, and he sends me wind.',
  'Oh… mais c’est du vrai. Il sent la mer. Dis-lui que nous sommes quittes. Et que… non, rien. Dis-lui juste merci.':
    'Oh… but it’s the real thing. It smells of the sea. Tell him we’re even. And that… no, nothing. Just tell him thank you.',
  'Livrer une bouteille de brise à Amira, à l’oasis': 'Deliver a bottle of breeze to Amira, at the oasis',
  'Du vent du nord, du sud, de l’est, de l’ouest ! Tu ne me crois pas ? Regarde-le courir, il s’est échappé !':
    'North wind, south wind, east, west! You don’t believe me? Look at it run, it got away!',
  'Rattrape mes tourbillons, éloigne les drakes qui les respirent, et porte une bouteille à Amira. Discrètement. C’est un cadeau.':
    'Catch my whirlwinds, drive off the drakes breathing them in, and take a bottle to Amira. Discreetly. It’s a gift.',
  'Néfer, la gardienne du rayon': 'Néfer, the keeper of the ray',
  'Franchir la porte': 'Step through the door',
  'Vaincre la gardienne du temple': 'Defeat the keeper of the temple',
  'Quatre miroirs, un rayon. Tourne-les (E), et suis la lumière jusqu’au soleil gravé sur la porte. Puis salue Néfer. Elle déteste être réveillée.':
    'Four mirrors, one ray. Turn them (E), and follow the light to the sun carved on the door. Then greet Néfer. She hates being woken.',
  'Scorpion vaincu': 'Scorpion defeated',
  'Chasser les scorpions de l’oasis': 'Drive the scorpions out of the oasis',
  'Nid détruit': 'Nest destroyed',
  'Détruire le nid': 'Destroy the nest',
  'Détruire les nids qui bouchent l’aqueduc': 'Destroy the nests clogging the aqueduct',
  'Porteur d’eau': 'Water bearer',
  'Accompagner le porteur': 'Walk with the bearer',
  'Escorter le porteur d’eau jusqu’au bassin': 'Escort the water bearer to the basin',
  'L’eau n’arrive plus. Les scorpions ont fait leurs nids dans les conduits, et mes porteurs refusent de sortir.':
    'The water no longer comes. Scorpions have nested in the channels, and my bearers refuse to go out.',
  'Nettoie l’aqueduc, puis accompagne le dernier porteur courageux jusqu’au bassin. Une seule jarre suffira : l’eau appelle l’eau.':
    'Clean out the aqueduct, then walk the last brave bearer to the basin. A single jar will do: water calls to water.',
  'Un nid détruit, c’est une colère réveillée. Garde ton arme en main.':
    'A nest destroyed is a temper woken. Keep your weapon in hand.',
  'Épreuve du souffle : courir avec la lumière avant qu’elle s’éteigne':
    'Trial of breath: run with the light before it goes out',
  'la flamme du sanctuaire': 'the sanctuary flame',
  'Allumer la flamme': 'Light the flame',
  'Épreuve du courage : garder la flamme du sanctuaire': 'Trial of courage: guard the sanctuary flame',
  'Lumière retrouvée': 'Light recovered',
  'Recueillir la lumière': 'Gather the light',
  'Épreuve de la lumière : recueillir les six lumières égarées':
    'Trial of light: gather the six stray lights',
  'Trois épreuves. Les anciens voulaient des gens qui courent, qui tiennent et qui regardent. Puis pose les étoiles sur l’autel. Je reste près de toi.':
    'Three trials. The ancients wanted people who run, who hold, and who look. Then place the stars on the altar. I’ll stay close to you.',
  'Je brille plus fort quand tu es près de moi. Tu l’avais remarqué ?':
    'I shine brighter when you’re near me. Had you noticed?',
  'Les étoiles brillent ensemble ! La Chambre de l’Aurore est ouverte. Auralis nous attend… et quelqu’un d’autre.':
    'The stars shine together! The Chamber of Dawn is open. Auralis is waiting for us… and someone else.',
  'Décider du sort de Vesper': 'Decide Vesper’s fate',
  'Elle arrive, et l’Ombre avec elle. Lis ma fresque, puis défends les six cristaux pendant que le Cœur s’éveille.':
    'She is coming, and the Shadow with her. Read my fresco, then defend the six crystals while the Heart awakens.',
  'L’Ombre m’a tenu compagnie quand vous m’avez laissée. Elle n’était pas mauvaise, au début. Elle avait faim, et moi aussi. Je suis fatiguée, gardien. Que fais-tu de moi ?':
    'The Shadow kept me company when you all left me. It wasn’t wicked, at first. It was hungry, and so was I. I’m tired, guardian. What will you do with me?',
  'Le Cœur s’éveille… Et Lumi… regarde-la. Elle était une étincelle du Cœur depuis le début. Elle pouvait rentrer. Elle a choisi de rester avec toi. Gardien de l’Aurore.':
    'The Heart awakens… And Lumi… look at her. She was a spark of the Heart from the very start. She could have gone home. She chose to stay with you. Guardian of Dawn.',
  'Ma sœur a repris sa place dans le chœur. Elle chante faux. C’est le plus beau son que j’aie entendu depuis mille ans.':
    'My sister has taken her place in the choir again. She sings off-key. It’s the most beautiful sound I’ve heard in a thousand years.',
  'Ma sœur a repris la mer. Elle écrira, dit-elle. Je lui ai laissé une étoile allumée, au cas où.':
    'My sister has gone back to sea. She’ll write, she says. I left a star lit for her, just in case.',
  'Reviens chanter avec nous': 'Come back and sing with us',
  'Pars en paix, et ne reviens pas': 'Go in peace, and do not return',
  'Cœur, réveille-toi : nous chantons à nouveau, l’aube a gardé ta place au bord de l’eau.':
    'Heart, awaken: we are singing once more, dawn has kept your place by the water’s shore.',
  'Le Cœur de l’Aurore se réveille. Les six sanctuaires retrouvent leur lumière, et Lumi révèle la vérité : elle était une étincelle du Cœur, tombée du ciel pour trouver quelqu’un capable de le réveiller. Ce quelqu’un, c’était toi. Quant à Vesper, elle a entendu son nom dans la Ballade. Personne ne l’avait effacé de la musique.':
    'The Heart of Dawn awakens. The six sanctuaries regain their light, and Lumi reveals the truth: she was a spark of the Heart, fallen from the sky to find someone able to wake it. That someone was you. As for Vesper, she heard her name in the Ballad. No one had erased it from the music.',
  'Fée calmée': 'Fairy soothed',
  'Calmer les fées qui brouillent le reflet': 'Soothe the fairies that blur the reflection',
  'Regarde : deux clairières jumelles. Mais le miroir est capricieux : la gauche devient la droite. Et les fées s’amusent à le rider.':
    'Look: two twin glades. But the mirror is fickle: left becomes right. And the fairies love to ripple it.',
  'Calme-les, puis abaisse les leviers (E) ici, et les rochers de l’autre clairière bougeront. Ouvre-toi un chemin jusqu’au coffre.':
    'Soothe them, then lower the levers (E) here, and the rocks in the other glade will move. Open a path to the chest.',
  'Pêche étoilée': 'Star peach',
  'Cueillir la pêche': 'Pick the peach',
  'Cueillir des pêches étoilées pour Braise': 'Pick star peaches for Ember',
  'Braise': 'Ember',
  'Protéger Braise des drakes qui se moquent de lui': 'Protect Ember from the drakes that mock him',
  'Courir devant Braise pour lui montrer comment prendre son élan':
    'Run ahead of Ember to show him how to take off',
  'Braise a peur du vide. Les grands drakes le savent, et ils viennent rire de lui tous les soirs.':
    'Ember is afraid of heights. The big drakes know it, and they come to laugh at him every evening.',
  'Donne-lui des pêches, fais taire les moqueurs, puis cours devant lui. Aussi vite que tu peux. Il te suivra, j’en suis sûre.':
    'Give him peaches, shut the mockers up, then run ahead of him. As fast as you can. He’ll follow you, I’m sure of it.',
  'Il aime les pêches bien mûres. Et il aime bien tes bottes, mais ne le laisse pas les manger.':
    'He likes his peaches nice and ripe. He likes your boots too, but don’t let him eat them.',
  'Ent apaisé': 'Ent soothed',
  'Apaiser les ents corrompus autour du lac': 'Soothe the corrupted ents around the lake',
  'Regarde le reflet : une constellation, le Cerf des neiges. Ses étoiles s’allument l’une après l’autre. Enfin, quand les ents ne lui cachent pas le ciel.':
    'Look at the reflection: a constellation, the Snow Stag. Its stars light up one after another. When the ents aren’t hiding the sky from it, that is.',
  'Apaise-les, puis marche sur les pierres du lac dans le même ordre. Une erreur, et le reflet s’efface : il faudra recommencer.':
    'Soothe them, then walk on the stones of the lake in the same order. One mistake, and the reflection fades: you’ll have to start over.',
  // ------------------------------------------------------------ Interlude des Tréfonds « Les Voix d’en bas »
  'La pierre qui chante': 'The singing stone',
  'Depuis la nuit où l’étoile est tombée, les pierres de Durgrim chantent. Le roi Thrain n’a pas dormi. La dernière fois que la pierre s’est réveillée, Khaz-Ombral s’est vidée en une nuit.':
    'Since the night the star fell, the stones of Durgrim have been singing. King Thrain hasn’t slept. The last time the stone woke, Khaz-Ombral emptied in a single night.',
  'Le roi t’envoie me demander si j’ai peur ? Non. J’ai déjà entendu ce chant. Ma grand-mère le fredonnait en tressant mes cheveux.':
    'The king sent you to ask if I’m afraid? No. I’ve heard that song before. My grandmother hummed it while braiding my hair.',
  'Quatre pierres-voix gardent les portes de nos quatre royaumes. Pose ton oreille contre chacune. Si elles chantent la même chose, c’est un cri. Si elles se répondent… c’est une chanson.':
    'Four voice-stones guard the gates of our four realms. Put your ear to each one. If they all sing the same thing, it’s a scream. If they answer each other… it’s a song.',
  'Demander à l’Ancienne Brunhild ce qu’elle entend': 'Ask Elder Brunhild what she hears',
  'Pierre-voix écoutée': 'Voice-stone heard',
  'Écouter la pierre-voix': 'Listen to the voice-stone',
  'La pierre des Galeries gronde : trois notes lourdes, comme des coups de pioche. Puis elle attend.':
    'The stone of the Tunnels rumbles: three heavy notes, like blows of a pickaxe. Then it waits.',
  'La pierre de Khaz-Ombral répond, de l’autre côté de la forteresse : trois notes claires, comme un marteau sur une cloche.':
    'The stone of Khaz-Ombral answers, from the far side of the fortress: three clear notes, like a hammer on a bell.',
  'La pierre de la Nécropole murmure sans jamais finir sa phrase. On dirait une liste de noms.':
    'The stone of the Necropolis murmurs and never finishes its sentence. It sounds like a list of names.',
  'La pierre de Fangeval ronronne. Elle est la seule à chanter juste, et elle a l’air de s’amuser.':
    'The stone of Fangeval purrs. It’s the only one that sings in tune, and it seems to be enjoying itself.',
  'Écouter les quatre pierres-voix, aux portes des quatre royaumes':
    'Listen to the four voice-stones, at the gates of the four realms',
  'Créature repoussée': 'Creature driven back',
  'Repousser les créatures que le chant rend folles': 'Drive back the creatures the song has maddened',
  'Approche, voyageur. Pose la main sur ce pilier. Tu la sens, cette vibration ? Voilà trois semaines que mes murs fredonnent.':
    'Come closer, traveler. Lay your hand on this pillar. Do you feel that tremor? For three weeks now, my walls have been humming.',
  'Il y a mille ans, la pierre a chanté. Le lendemain, Khaz-Ombral était vide, et les bols de soupe encore tièdes. Je ne perdrai pas Durgrim. Va voir Brunhild : elle sait écouter.':
    'A thousand years ago, the stone sang. The next day, Khaz-Ombral was empty, and the bowls of soup were still warm. I will not lose Durgrim. Go and see Brunhild: she knows how to listen.',
  'Aux quatre portes, il y a quatre pierres. Mon père m’interdisait de les toucher. Toi, tu n’es pas mon fils.':
    'At the four gates, there are four stones. My father forbade me to touch them. But you’re not my son.',
  'Elles se répondent ? Ce n’est donc pas un cri… Alors quelqu’un, en bas, essaie de nous parler. Mes éclaireurs sont postés dans les quatre royaumes : Nori, Dísa, Óin, Thyra. Trouve qui chante.':
    'They answer each other? Then it isn’t a scream… Someone down there is trying to speak to us. My scouts are posted in the four realms: Nori, Dísa, Óin, Thyra. Find out who is singing.',
  'Quatre royaumes, quatre voix. Va dans l’ordre que tu veux : la pierre, elle, n’est pas pressée.':
    'Four realms, four voices. Go in whatever order you like: the stone is in no hurry.',
  'Durgrim : la pierre ne crie pas, elle chante. Quatre voix se répondent sous l’île, et aucune ne connaît la fin de la chanson.':
    'Durgrim: the stone isn’t screaming, it’s singing. Four voices answer each other beneath the island, and none of them knows how the song ends.',
  'Le chant des profondeurs dans le journal': 'The song of the deep in your journal',
  'La voix de l’argile': 'The voice of clay',
  'Dans les Galeries d’Argile, une équipe de mineurs a disparu en suivant le chant. Les gobelins des mines les ont trouvés avant Nori.':
    'In the Clay Tunnels, a team of miners vanished while following the song. The mine goblins found them before Nori did.',
  'Ennemi des Galeries vaincu': 'Foe of the Tunnels defeated',
  'Ouvrir la route : gobelins des mines et scarabées foreurs':
    'Clear the road: mine goblins and borer beetles',
  'Mineur libéré': 'Miner freed',
  'Libérer le mineur': 'Free the miner',
  'Libérer les quatre mineurs enchaînés': 'Free the four chained miners',
  'Grik, le contremaître': 'Grik, the foreman',
  'Briser les chaînes de Grik': 'Break Grik’s chains',
  'Vaincre Grik, le contremaître': 'Defeat Grik, the foreman',
  'Chut… Tu entends les pioches ? Ce ne sont pas les nôtres. Mes mineurs creusent, mais pour quelqu’un d’autre.':
    'Shh… Do you hear the pickaxes? They aren’t ours. My miners are digging, but for someone else.',
  'Ils ont suivi le chant jusqu’au vieux village. Les gobelins les y attendaient. Ramène-les-moi, et fais taire leur contremaître.':
    'They followed the song to the old village. The goblins were waiting for them. Bring them back to me, and silence their foreman.',
  'Grik compte ses prisonniers toutes les heures. Il ne sait compter que jusqu’à quatre.':
    'Grik counts his prisoners every hour. He can only count to four.',
  'Ils sont tous là ! Et ils disent que c’est la paroi qui chantait, au fond : trois notes lourdes, comme un cœur. La première voix, c’est l’argile elle-même.':
    'They’re all here! And they say it was the rock face that was singing, at the far end: three heavy notes, like a heart. The first voice is the clay itself.',
  'Les mineurs sifflent le chant en travaillant, maintenant. Ça creuse plus droit.':
    'The miners whistle the song while they work, now. The digging comes out straighter.',
  'La voix de l’argile : « Je porte. Je porte l’île, et les racines, et vos maisons. Personne ne me l’a jamais demandé. Personne ne m’a jamais remerciée. »':
    'The voice of clay: “I carry. I carry the island, and the roots, and your houses. No one ever asked me to. No one ever thanked me.”',
  'La voix de l’argile et un équipement Rare de ton niveau': 'The voice of clay and Rare gear of your level',
  'La voix du fer': 'The voice of iron',
  'À Khaz-Ombral, les sentinelles de pierre montent toujours la garde. Dísa veut savoir ce qu’elles gardent, et contre qui.':
    'In Khaz-Ombral, the stone sentinels still stand guard. Dísa wants to know what they’re guarding, and against whom.',
  'Rune royale': 'Royal rune',
  'Reprendre les runes royales aux morts de la cité': 'Take the royal runes back from the dead of the city',
  'Pilier runique éveillé': 'Runic pillar awakened',
  'Poser la rune': 'Set the rune',
  'Éveiller les trois piliers runiques': 'Awaken the three runic pillars',
  'Le Veilleur aveugle': 'The Blind Watcher',
  'Défier le Veilleur': 'Challenge the Watcher',
  'Vaincre le Veilleur aveugle, capitaine des sentinelles':
    'Defeat the Blind Watcher, captain of the sentinels',
  'Regarde-les marcher. Toujours le même tour, depuis mille ans. Une patrouille protège quelque chose, ou empêche quelque chose de sortir.':
    'Look at them march. Always the same round, for a thousand years. A patrol protects something, or keeps something from getting out.',
  'Les runes royales leur parlaient, autrefois. Les morts les portent encore. Rends-les aux piliers, et demande au capitaine ce qu’il garde.':
    'The royal runes used to speak to them. The dead still carry them. Give them back to the pillars, and ask the captain what he’s guarding.',
  'Ne frappe pas les statues qui ne bougent pas. Les autres non plus, si tu peux éviter. Mais tu ne pourras pas.':
    'Don’t strike the statues that don’t move. Nor the others, if you can avoid it. But you won’t be able to.',
  'Le Veilleur a parlé en tombant ? « La porte était fermée de l’intérieur. » Alors ceux de Khaz-Ombral n’ont pas fui… Ils se sont enfermés. Avec quoi ?':
    'The Watcher spoke as he fell? “The gate was locked from the inside.” Then the people of Khaz-Ombral didn’t flee… They shut themselves in. With what?',
  'Les sentinelles s’arrêtent quand je passe. L’une d’elles a hoché la tête, je crois.':
    'The sentinels stop when I walk past. One of them nodded, I think.',
  'La voix du fer : « L’Ombre est venue de la mer et elle a cherché un chemin par en bas. Le roi Ombral a fermé la cité sur elle, et sur les siens. Ils l’ont tenue avec leurs mains. Là-haut, on ne l’a jamais su. »':
    'The voice of iron: “The Shadow came from the sea and looked for a way in from below. King Ombral shut the city on it, and on his own people. They held it with their bare hands. Up there, no one ever knew.”',
  'La voix du fer et un équipement Rare de ton niveau': 'The voice of iron and Rare gear of your level',
  'La voix des oubliés': 'The voice of the forgotten',
  'Dans la Nécropole, les tombes n’ont plus de noms : ils ont été grattés, un par un. Les âmes tournent en rond, incapables de se reposer.':
    'In the Necropolis, the graves no longer have names: they were scratched off, one by one. The souls wander in circles, unable to rest.',
  'Nom retrouvé': 'Name recovered',
  'Lire la tombe du bout des doigts': 'Read the grave with your fingertips',
  'Lire du bout des doigts les noms effacés': 'Read the erased names with your fingertips',
  'Profanateur chassé': 'Desecrator driven off',
  'Chasser les goules et les corbeaux qui rongent les noms':
    'Drive off the ghouls and ravens gnawing at the names',
  'la bougie des noms': 'the candle of names',
  'Allumer la bougie des noms': 'Light the candle of names',
  'Veiller la bougie pendant qu’Óin dit les noms': 'Watch over the candle while Óin speaks the names',
  'Quelqu’un a gratté les noms. Tous. À la main, avec les ongles. Ça a dû prendre des siècles.':
    'Someone scratched the names off. All of them. By hand, with their nails. It must have taken centuries.',
  'Un mort sans nom ne dort pas. Retrouve-m’en six, du bout des doigts, et chasse ce qui les ronge. Ensuite on allumera une bougie, et je les dirai à voix haute. Ça va attirer du monde.':
    'The nameless dead don’t sleep. Find me six, with your fingertips, and drive off whatever is gnawing at them. Then we’ll light a candle, and I’ll speak them aloud. That will draw a crowd.',
  'Ferme les yeux pour lire. Sur une tombe grattée, les doigts voient mieux.':
    'Close your eyes to read. On a scratched grave, fingers see better.',
  'Je les ai tous dits, et la bougie ne s’est pas éteinte. Tu as entendu, à la fin ? Elles ont répondu. Pas des plaintes : elles chantaient leur nom.':
    'I spoke every one of them, and the candle never went out. Did you hear, at the end? They answered. Not wailing: they were singing their names.',
  'J’en dis dix chaque soir. Il m’en reste pour deux cents ans. J’ai de la bougie.':
    'I speak ten every evening. I’ve got two hundred years’ worth left. And plenty of candles.',
  'La voix des oubliés : « Nous avons tenu la porte. Quand nos bras sont tombés, nos noms l’ont tenue. Quand on a effacé nos noms, le chagrin l’a tenue à notre place. Et le chagrin a pris une forme. »':
    'The voice of the forgotten: “We held the gate. When our arms fell, our names held it. When our names were erased, grief held it in our stead. And grief took a shape.”',
  'La voix des oubliés et un équipement Rare de ton niveau':
    'The voice of the forgotten and Rare gear of your level',
  'La voix de la mousse': 'The voice of moss',
  'À Fangeval, les champignons dansent. Thyra a suivi l’un d’eux, tout petit, qui veut rejoindre le Grand Cercle et que tout le marais essaie de manger.':
    'In Fangeval, the mushrooms dance. Thyra has been following one of them, a tiny one, who wants to join the Great Circle and whom the whole marsh is trying to eat.',
  'Dévoreur vaincu': 'Devourer defeated',
  'Éclaircir les mille-pattes et les moustiques des fanges': 'Thin out the centipedes and mire mosquitoes',
  'Spore luisante': 'Glowing spore',
  'Cueillir la spore': 'Pick the spore',
  'Cueillir des spores luisantes pour éclairer la route': 'Pick glowing spores to light the way',
  'Accompagner Mousseron': 'Walk with Mousseron',
  'Escorter Mousseron jusqu’au Grand Cercle': 'Escort Mousseron to the Great Circle',
  'Regarde, là, derrière ma botte. Il s’appelle Mousseron. Il a trois jours. Il veut aller danser.':
    'Look, there, behind my boot. His name is Mousseron. He’s three days old. He wants to go dancing.',
  'Le Grand Cercle est au bout de la caverne. Pour lui, c’est le bout du monde. Nettoie le chemin, éclaire-le, et marche à son pas. Il a de toutes petites jambes.':
    'The Great Circle is at the far end of the cavern. For him, it’s the end of the world. Clear the path, light it, and walk at his pace. He has very short legs.',
  'S’il s’arrête, c’est qu’il t’attend. Ou qu’il a vu un joli caillou.':
    'If he stops, he’s waiting for you. Or he’s seen a pretty pebble.',
  'Il danse ! Ils dansent tous, et le sol chante sous eux… C’est ça, la quatrième voix. La seule qui n’a jamais cessé d’être heureuse.':
    'He’s dancing! They’re all dancing, and the ground sings beneath them… That’s it, the fourth voice. The only one that never stopped being happy.',
  'Mousseron a grandi d’un doigt. Il me fait signe de loin, maintenant. Comme un grand.':
    'Mousseron has grown by a finger. He waves at me from afar, now. Like a grown-up.',
  'La voix de la mousse : « Rien ne finit. On pourrit un peu, on repousse beaucoup. Dis-le à celui qui pleure au fond de la faille : il n’a pas besoin de tenir la porte tout seul. »':
    'The voice of moss: “Nothing ends. You rot a little, you grow back a lot. Tell that to the one weeping at the bottom of the rift: he doesn’t have to hold the gate all alone.”',
  'La voix de la mousse et un équipement Rare de ton niveau': 'The voice of moss and Rare gear of your level',
  'Le chœur des profondeurs': 'The choir of the deep',
  'Quatre voix, et une cinquième qui pleure au fond de la faille, sous la Nécropole. Brunhild veut y descendre elle-même. Elle a quelque chose à lui chanter.':
    'Four voices, and a fifth weeping at the bottom of the rift, beneath the Necropolis. Brunhild wants to go down there herself. She has something to sing to it.',
  'Donner le bras à Brunhild': 'Give Brunhild your arm',
  'Accompagner Brunhild au bord de la faille': 'Escort Brunhild to the edge of the rift',
  'le chant de Brunhild': 'Brunhild’s song',
  'Commencer le chant': 'Begin the song',
  'Protéger Brunhild pendant qu’elle appelle les quatre voix':
    'Protect Brunhild while she calls the four voices',
  'Vaincre Karn-Duram, l’écho du deuil (E sur le sceau)':
    'Defeat Karn-Duram, the echo of grief (E on the seal)',
  'Choisir le nom à graver sur le vingt-et-unième pilier':
    'Choose the name to carve on the twenty-first pillar',
  'Tu as les quatre voix. Alors tu sais qui pleure. Le chagrin de Khaz-Ombral a tenu la porte si longtemps qu’il a oublié qu’il pouvait la lâcher.':
    'You have the four voices. Then you know who is weeping. The grief of Khaz-Ombral has held the gate so long that it forgot it could let go.',
  'Mon aïeule était de là-bas. Je vais lui chanter la fin, et tu me donneras le bras jusqu’à la faille. Ne discute pas. J’ai deux cent quarante ans, je fais ce que je veux.':
    'My foremother was from there. I’m going to sing it the ending, and you’ll give me your arm to the rift. Don’t argue. I’m two hundred and forty years old, I do as I please.',
  'La faille est au fond de la Nécropole. Je t’y attends, je marche plus vite qu’on ne croit.':
    'The rift is at the far end of the Necropolis. I’ll meet you there, I walk faster than people think.',
  'Il s’est endormi. Enfin. Il reste un pilier sans nom dans la salle du roi, le vingt-et-unième. Thrain le gardait pour lui. Il m’a dit ce matin : « Que le voyageur choisisse. »':
    'It’s asleep. At last. There’s one nameless pillar left in the king’s hall, the twenty-first. Thrain was saving it for himself. He told me this morning: “Let the traveler choose.”',
  'C’est gravé. Écoute… la pierre ne chante plus. Elle fredonne. Et quelqu’un là-haut, au bord de la mer, vient de lever la tête.':
    'It’s carved. Listen… the stone isn’t singing anymore. It’s humming. And someone up there, at the edge of the sea, has just looked up.',
  'Je dors bien, maintenant. À mon âge, c’est un trésor plus rare que le mithril.':
    'I sleep well, now. At my age, that’s a treasure rarer than mithril.',
  'Sur le pilier, Thrain a gravé tous les noms qu’Óin retrouve. Il a fallu réduire la taille des lettres.':
    'On the pillar, Thrain had every name Óin recovers carved. They had to make the letters smaller.',
  'Sur le pilier, il y a écrit « Ombral ». Dessous, une main d’enfant a ajouté « merci ». Fili jure que ce n’est pas lui.':
    'On the pillar, it says “Ombral”. Underneath, a child’s hand added “thank you”. Fili swears it wasn’t him.',
  'Les noms de tous les oubliés': 'The names of all the forgotten',
  'Celui du roi Ombral, qui a fermé la porte': 'That of King Ombral, who shut the gate',
  'Et sous nos pas, très bas, la pierre tient la note que le ciel a perdue et que la nuit nous porte.':
    'And far beneath our steps, the stone holds the note that the sky has lost and the dark keeps afloat.',
  'Le chœur des profondeurs : l’Ombre avait deux chemins vers le Cœur. Là-haut, on a brisé la lumière pour la sauver. En bas, un roi a fermé sa cité. Les deux sacrifices se sont ignorés pendant mille ans. Maintenant, ils chantent la même chanson.':
    'The choir of the deep: the Shadow had two roads to the Heart. Above, the light was shattered to save it. Below, a king shut his city. For a thousand years, the two sacrifices knew nothing of each other. Now they sing the same song.',
  'Équipement Légendaire de ton niveau, Écho (une lueur d’ambre qui t’accompagne) et le dernier couplet de la Ballade':
    'Legendary gear of your level, Echo (an amber glow that follows you) and the last verse of the Ballad',
  'La lanterne de Gloin': 'Gloin’s lantern',
  'Extraire cinq minerais, en bas ou à la surface': 'Mine five ores, below or on the surface',
  'Carapace brillante': 'Shiny shell',
  'Prendre des carapaces aux scarabées foreurs': 'Take shells from the borer beetles',
  'Dis… Ylva dit toujours : « Mon mari rentre quand la lanterne s’éteint. » J’aimerais qu’un soir, elle ne s’éteigne pas. Que je rentre avant.':
    'Say… Ylva always says: “My husband comes home when the lantern goes out.” I’d like it not to go out, one evening. I’d like to get home before it does.',
  'Alors je fabrique une lanterne si belle que le contremaître me laissera partir juste pour la voir allumée. Du minerai, des carapaces. Tu m’aides ?':
    'So I’m making a lantern so beautiful that the foreman will let me leave just to see it lit. Ore, shells. Will you help me?',
  'Les scarabées foreurs des Galeries ont les plus belles carapaces. On dirait du ciel, paraît-il.':
    'The borer beetles of the Tunnels have the finest shells. Like the sky, I’m told.',
  'Je suis rentré à l’heure. Elle a cru que j’étais malade.': 'I got home on time. She thought I was ill.',
  'Un morceau de ciel': 'A piece of sky',
  'Remonter à la surface et remplir la fiole de ciel': 'Go back up to the surface and fill the vial with sky',
  'Cueillir deux herbes qui sentent le soleil': 'Pick two herbs that smell of sunshine',
  'Tu viens de là-haut, hein ? Papa dit que le plafond est bleu et qu’il n’y a rien pour le tenir. Il tombe jamais ?':
    'You’re from up there, right? Dad says the ceiling is blue and there’s nothing holding it up. Doesn’t it ever fall?',
  'J’ai vidé cette fiole exprès. Tu peux la remplir de ciel ? Et me rapporter quelque chose qui sent dehors. Je donne mon plus beau caillou !':
    'I emptied this vial specially. Can you fill it with sky? And bring me something that smells of outside. I’ll give you my best pebble!',
  'N’oublie pas de bien refermer le bouchon. Le ciel, ça doit s’échapper.':
    'Don’t forget to put the stopper back in properly. Sky must leak.',
  'La nuit, je débouche un tout petit peu la fiole. Ça sent l’herbe.':
    'At night, I open the vial just a tiny bit. It smells of grass.',
  'Le caillou de Fili : un éclat de la même étoile que Lumi. Elle n’est pas tombée à côté du Camp par hasard : une moitié est allée vers l’île, l’autre vers ce qu’il y a dessous.':
    'Fili’s pebble: a shard of the same star as Lumi. She didn’t fall near the Camp by chance: one half went to the island, the other to what lies beneath it.',
  'Équipement Peu commun de ton niveau et le secret de Fili': 'Uncommon gear of your level and Fili’s secret',
  'Les pioches de la Mine Effondrée': 'The pickaxes of the Collapsed Mine',
  'Bête des Galeries vaincue': 'Beast of the Tunnels defeated',
  'Dégager la route de la mine : taupes-garous et vers des boues':
    'Clear the road to the mine: weremoles and mud worms',
  'Terminer la Mine Effondrée de Durgrim': 'Complete the Collapsed Mine of Durgrim',
  'Mon frère Frerin descendait tous les matins à la Mine Effondrée. Elle ne s’appelait pas comme ça, à l’époque.':
    'My brother Frerin went down to the Collapsed Mine every morning. It wasn’t called that, back then.',
  'Grumbar hante encore les galeries avec les outils des nôtres. Je garde cette porte depuis vingt ans pour ne pas avoir à y aller. Vas-y à ma place.':
    'Grumbar still haunts the tunnels with our people’s tools. I’ve been guarding this gate for twenty years so I wouldn’t have to go. Go in my place.',
  'La mine est au bout de la route des Galeries, à l’ouest. Entre à plusieurs si tu peux.':
    'The mine is at the end of the Tunnels road, to the west. Go in with friends if you can.',
  'La bière qui voit double': 'The double-vision brew',
  'Chapeau de myconide': 'Myconid cap',
  'Récolter des chapeaux de myconide': 'Gather myconid caps',
  'Bave pétillante': 'Fizzy slime',
  'Récolter de la bave de limace, pour les bulles': 'Gather slug slime, for the bubbles',
  'De la part de Dorn ? Sa bière, on dirait de l’eau de vaisselle. Donne. … … …':
    'From Dorn? His beer tastes like dishwater. Give it here. … … …',
  'Pourquoi êtes-vous deux ? Non. Trois. Dis à Dorn… dis aux Dorn… qu’ils ont gagné. Et aide-moi à tenir ce mur, il tangue.':
    'Why are there two of you? No. Three. Tell Dorn… tell the Dorns… they’ve won. And help me hold this wall up, it’s swaying.',
  'Faire goûter la bière au Garde Dwalin': 'Have Guard Dwalin taste the beer',
  'Helga prétend que ma bière est « tendre ». TENDRE ! J’ai parié ma taverne que je ferais tomber Dwalin en une chope.':
    'Helga claims my beer is “gentle”. GENTLE! I bet my tavern I’d put Dwalin on the floor with a single mug.',
  'Il me faut des chapeaux de myconide bien mûrs, et de la bave de limace pour les bulles. Ne fais pas cette tête, on en met dans tout.':
    'I need some nice ripe myconid caps, and slug slime for the bubbles. Don’t make that face, we put it in everything.',
  'Fangeval, au sud de la forteresse. Ça sent déjà ma bière, tu ne peux pas te tromper.':
    'Fangeval, south of the fortress. It already smells like my beer, you can’t go wrong.',
  'Le colporteur égaré': 'The lost peddler',
  'Rouleau de rubans': 'Roll of ribbons',
  'Ramasser les rubans': 'Pick up the ribbons',
  'Retrouver sa marchandise éparpillée': 'Find his scattered wares',
  'Sandwich à peine mordu': 'Barely bitten sandwich',
  'Reprendre le sandwich de Perrin': 'Get Perrin’s sandwich back',
  'Accompagner Perrin': 'Walk with Perrin',
  'Escorter Perrin vers la route de Durgrim': 'Escort Perrin toward the Durgrim road',
  'Un visage ! Un visage sans barbe ! Pardon. Je me présente : Perrin, rubans, dentelles, articles de mode. Je suis tombé.':
    'A face! A face without a beard! Sorry. Allow me to introduce myself: Perrin, ribbons, lace, fashion items. I fell.',
  'Tout est tombé avec moi, jusqu’à mon sandwich, et une bête me l’a pris. Si tu retrouves tout ça et que tu m’emmènes jusqu’à une route… je te fais un prix.':
    'Everything fell with me, even my sandwich, and some beast took it. If you find it all and walk me to a road… I’ll give you a discount.',
  'Les rubans jaunes sont les plus chers. Le sandwich, c’est sentimental.':
    'The yellow ribbons are the priciest. The sandwich has sentimental value.',
  'La cloche engloutie': 'The sunken bell',
  'Éclat de bronze': 'Shard of bronze',
  'Ramasser le bronze': 'Pick up the bronze',
  'Retrouver les éclats de la cloche': 'Find the shards of the bell',
  'la cloche': 'the bell',
  'Sonner la cloche': 'Ring the bell',
  'Défendre la cloche pendant qu’elle sonne': 'Defend the bell while it rings',
  'Terminer les Halls Engloutis de Khaz-Ombral': 'Complete the Sunken Halls of Khaz-Ombral',
  'Le soir de la Grande Fermeture, j’avais la corde en main. Le roi a dit : « Pas un bruit. » Alors je n’ai pas sonné.':
    'On the evening of the Great Closing, I had the rope in my hand. The king said: “Not a sound.” So I didn’t ring it.',
  'Personne n’a su que c’était la fin. On dit au revoir, d’habitude. Aide-moi à la sonner une fois, et va dire au roi Ombral que son sonneur a fini son service.':
    'No one knew it was the end. Usually, people say goodbye. Help me ring it once, and go and tell King Ombral that his bell-ringer has finished his shift.',
  'Les gargouilles détestent les cloches. C’est une vieille histoire de pigeons.':
    'Gargoyles hate bells. It’s an old story about pigeons.',
  'Dong… Pardon. L’habitude.': 'Dong… Sorry. Force of habit.',
  'Les clés de la Crypte': 'The keys of the Crypt',
  'Clé d’os': 'Bone key',
  'Reprendre les clés d’os aux chevaliers et aux goules':
    'Take the bone keys back from the knights and ghouls',
  'Terminer la Crypte des Mille Tombes': 'Complete the Crypt of a Thousand Tombs',
  'Choisir ce que Runa fera des clés': 'Choose what Runa will do with the keys',
  'Mille tombes, voilà ce que dit le registre. J’ai recompté : mille douze. Le Fossoyeur Éternel creuse plus vite que je n’écris.':
    'A thousand tombs, says the register. I recounted: a thousand and twelve. The Eternal Gravedigger digs faster than I can write.',
  'Les chevaliers portent les clés de la crypte. Reprends-les, descends, et arrête ce zélé. On ne creuse pas la tombe des gens avant qu’ils soient morts. C’est une question de politesse.':
    'The knights carry the keys to the crypt. Take them back, go down, and stop that zealot. You don’t dig people’s graves before they’re dead. It’s a matter of manners.',
  'Si tu vois une tombe à ton nom, ne t’allonge pas dedans pour vérifier la taille.':
    'If you see a grave with your name on it, don’t lie down in it to check the size.',
  'C’est fini. Voilà les quatre clés. Dis-moi, toi qui en reviens : on ferme la crypte pour de bon, ou on laisse une porte aux familles ?':
    'It’s over. Here are the four keys. Tell me, you who came back from there: do we close the crypt for good, or leave a door for the families?',
  'Le registre dit mille, et j’en compte mille. Je dors mieux.':
    'The register says a thousand, and I count a thousand. I sleep better.',
  'La crypte est fermée. J’ai jeté les clés dans le lac. Elles ont fait un joli bruit.':
    'The crypt is closed. I threw the keys into the lake. They made a lovely sound.',
  'Les familles viennent le soir, avec des bougies. Ce n’est plus une crypte. C’est presque un salon.':
    'The families come in the evening, with candles. It’s not a crypt anymore. It’s almost a parlor.',
  'Ferme-la pour toujours': 'Close it forever',
  'Laisse une porte aux familles': 'Leave a door for the families',
  'La reine qui ne dansait plus': 'The queen who no longer danced',
  'Parasite vaincu': 'Parasite defeated',
  'Chasser les limaces et les mille-pattes qui rongent la colonie':
    'Drive off the slugs and centipedes gnawing at the colony',
  'Ponte détruite': 'Clutch destroyed',
  'Écraser la ponte': 'Crush the clutch',
  'Détruire les pontes de limaces': 'Destroy the slug clutches',
  'Terminer les Tréfonds Fongiques': 'Complete the Fungal Depths',
  'Bonjour-bonjour. Toi pas-mousse, mais toi gentil-pas. Girolle parler bien la langue des pieds, oui ?':
    'Hello-hello. You not-moss, but you nice-foot. Girolle speak foot-language well, yes?',
  'La reine danse plus. La reine mange ceux qui dansent. Limaces ont pondu dans ses rêves. Toi nettoyer dehors, puis nettoyer dedans. Doucement-fort.':
    'The queen dance no more. The queen eat those who dance. Slugs laid eggs in her dreams. You clean outside, then clean inside. Softly-hard.',
  'Pontes rondes, pontes gluantes. Écraser avec le talon, pas avec la pointe. Pointe glisse.':
    'Round clutches, sticky clutches. Crush with the heel, not with the toe. Toe slips.',
  'Girolle apprend la valse des pieds. Un-deux-trois-mousse, un-deux-trois-mousse.':
    'Girolle learning the foot-waltz. One-two-three-moss, one-two-three-moss.',
  'Le dentier du grand-père': 'Grandpa’s dentures',
  'La taupe au dentier': 'The mole with the dentures',
  'Attraper la taupe': 'Catch the mole',
  'Rattraper la taupe au sourire doré': 'Catch the mole with the golden smile',
  'Asticot de qualité': 'Quality grub',
  'Trouver des asticots pour consoler la taupe': 'Find grubs to comfort the mole',
  'Fa m’a folé mon dentier ! La taupe ! Elle me regarde, elle fourit, et elle f’en fa ! AFec MES dents !':
    'It ftole my denturef! The mole! It lookf at me, it fmilef, and off it goef! With MY teeth!',
  'Rattrape-la. Et fois gentil aFec, elle est Fieille auffi. Trouve-lui de quoi manger mou.':
    'Catch it. And be nife to it, it’f old too. Find it fomething foft to eat.',
  'Elle creufe Fite mais elle court comme moi. F’est dire.':
    'It digf faft but it runf like me. That’f faying fomething.',
  'On déjeune ensemble le dimanche, elle et moi. Elle mange plus proprement.':
    'We have lunch together on Sundays, she and I. Her table manners are better than mine.',
  'La course des spores': 'The spore race',
  'Courir la course des spores avant qu’elles retombent': 'Run the spore race before they settle',
  'Spore fugueuse': 'Runaway spore',
  'Attraper la spore': 'Catch the spore',
  'Rattraper trois spores fugueuses': 'Catch three runaway spores',
  'Courir la revanche, plus longue et plus rapide': 'Run the rematch, longer and faster',
  'Toi ! Toi courir ! Bolet gagner course chaque année, sauf que le vent gagne avant. Le vent triche.':
    'You! You run! Bolet win race every year, except wind wins first. Wind cheats.',
  'Suis les fanions. Les spores retombent vite : si elles touchent le sol, perdu. Après, revanche. Toujours revanche.':
    'Follow the pennants. Spores fall fast: if they touch the ground, lost. Then, rematch. Always rematch.',
  'Les jambes, c’est comme les racines mais ça va moins profond et plus loin.':
    'Legs are like roots, but they go less deep and farther.',
  'L’an prochain, Bolet invite la reine. Elle finira troisième. Enfin un podium.':
    'Next year, Bolet invites the queen. She’ll come third. A podium at last.',
  'l’écho du deuil': 'the echo of grief',
  'La faille gémit. Le chagrin de Khaz-Ombral se lève, plus grand qu’une tour !':
    'The rift moans. The grief of Khaz-Ombral rises, taller than a tower!',
  'Karn-Duram pose un genou à terre, lâche la porte qu’il tenait depuis mille ans, et s’endort.':
    'Karn-Duram drops to one knee, lets go of the gate it held for a thousand years, and falls asleep.',
  // ------------------------------------------------------------ Quêtes : énigmes, actions, journal et suivi
  'À ton niveau': 'At your level',
  'Vieille Odette : « Il allumait les lanternes chaque soir, en sifflant. Un garçon gentil. »':
    'Old Odette: “He lit the lanterns every evening, whistling. A kind boy.”',
  'Pêcheur Tom : « Son prénom commençait comme une île… I-quelque chose. Ilian ? »':
    'Fisherman Tom: “His name started like an island… I-something. Ilian?”',
  'Protéger les six cristaux (E sur l’autel pour commencer)':
    'Protect the six crystals (E on the altar to begin)',
  'Actionner les leviers pour ouvrir un passage dans l’autre clairière':
    'Pull the levers to open a way through in the other glade',
  'Karn-Duram, l’écho du deuil': 'Karn-Duram, the echo of grief',
  'Les Tréfonds': 'The Depths',
  'Les Tréfonds, à ton niveau': 'The Depths, at your level',
  'Butin': 'Loot',
  'Collecte': 'Collecting',
  'Escorte': 'Escort',
  'Poursuite': 'Chase',
  'Course': 'Race',
  'Champion': 'Champion',
  'Messager': 'Messenger',
  'Métier': 'Trade',
  'Exploration': 'Exploration',
  'Enquête': 'Investigation',
  'Choix': 'Choice',
  'Adresse': 'Skill',
  'Énigme': 'Riddle',
  'La Ballade de l’Aurore': 'The Ballad of Dawn',
  'Par ici': 'Around here',
  'Descendre dans les Tréfonds': 'Descend into the Depths',
  'Remonter à la surface': 'Go back up to the surface',
  'Prendre le départ': 'Start the race',
  'Embuscade !': 'Ambush!',
  'Partez !': 'Go!',
  'Défends {chose} !': 'Defend {chose}!',
  '{nom} te suit. Reste à ses côtés !': '{nom} is following you. Stay close!',
  'Plus personne pour défendre le lieu… Recommence quand tu veux.':
    'No one left to defend the place… Try again whenever you like.',
  'La défense a cédé. Reprends ton souffle et recommence.':
    'The defense has fallen. Catch your breath and try again.',
  'Vague {n} / {m}': 'Wave {n} / {m}',
  'Tu as semé la personne que tu accompagnais. Elle t’attend au départ.':
    'You lost the one you were escorting. They are waiting for you at the start.',
  'Trop de coups : il faut repartir du départ.': 'Too many hits: back to the start.',
  'Ton adversaire a disparu. Il reviendra si tu l’appelles.':
    'Your opponent has vanished. It will return if you call it.',
  'Trop tard ! Reprends le départ.': 'Too late! Start over.',
  'Une bibliothèque scellée par les esprits des saisons.': 'A library sealed by the spirits of the seasons.',
  'Une petite lumière tremble dans le cristal. Il lui manque des éclats.':
    'A small light trembles in the crystal. It is missing some shards.',
  'Chaque gardien vaincu en laisse un, et Madame Nacre en garde deux pour les grands collectionneurs.':
    'Each guardian defeated leaves one behind, and Madame Nacre keeps two for great collectors.',
  'Grosse citrouille près du ruisseau': 'Big pumpkin by the stream',
  'Grosse citrouille sous le chêne roux': 'Big pumpkin under the russet oak',
  'Sous le pont du ruisseau': 'Under the bridge over the stream',
  'Tas de feuilles': 'Pile of leaves',
  'Souvenir': 'Memory',
  'Souvenir des feuilles': 'Memory of the leaves',
  'Fragment de la fresque': 'Fresco fragment',
  'enclume': 'anvil',
  'cloche': 'bell',
  'harpe': 'harp',
  'puits': 'well',
  'four': 'oven',
  'jardin': 'garden',
  'tour': 'tower',
  'lune': 'moon',
  'flamme': 'flame',
  'Archives anciennes': 'Ancient archives',
  'La girouette tourne : le vent fait tournoyer la feuille dans le sens des aiguilles d’une montre.':
    'The weathervane turns: the wind spins the leaf clockwise.',
  'Raté ! Elle était trop haute. Attends qu’elle redescende.':
    'Missed! It was too high. Wait for it to come back down.',
  'Tu attrapes la feuille dorée au vol !': 'You catch the golden leaf in midair!',
  'Rien ici…': 'Nothing here…',
  'Le renard magique jaillit de sa cachette, des provisions plein les pattes !':
    'The magic fox leaps out of its hiding place, paws full of supplies!',
  'La salle du trésor est ouverte.': 'The treasure room is open.',
  'Une porte ronde, scellée par la machine.': 'A round door, sealed by the machine.',
  'Le rayon frappe le soleil de la porte : le temple s’ouvre !':
    'The ray strikes the sun on the door: the temple opens!',
  'La porte du temple est ouverte.': 'The temple door is open.',
  'Un soleil gravé attend la lumière.': 'A carved sun awaits the light.',
  'Les étoiles brillent sur l’autel.': 'The stars shine on the altar.',
  'Six alvéoles vides attendent leurs étoiles.': 'Six empty hollows await their stars.',
  'Il te manque des étoiles du Cœur.': 'You are missing some of the Heart’s stars.',
  'Tu poses les étoiles : six lumières s’allument en cercle.':
    'You place the stars: six lights kindle in a circle.',
  'La fresque du gardien': 'The guardian’s fresco',
  'Auralis, gardien du Cœur, refusa de partir quand les anciens le dispersèrent. Il veilla seul des siècles, devenu lumière lui-même, en attendant qu’une étincelle revienne.':
    'Auralis, guardian of the Heart, refused to leave when the ancients scattered it. He kept watch alone for centuries, becoming light himself, waiting for a spark to return.',
  'Un gardien seul devant le Cœur, entouré de six cristaux.':
    'A lone guardian before the Heart, surrounded by six crystals.',
  'Le Cœur bat doucement.': 'The Heart beats softly.',
  'L’autel du Cœur, entouré de six cristaux.': 'The altar of the Heart, surrounded by six crystals.',
  'Défends les cristaux !': 'Defend the crystals!',
  'Lumière réunie ({n} / 6)': 'Light united ({n} / 6)',
  'Le coffre enchanté est vide.': 'The enchanted chest is empty.',
  'Un coffre enchanté.': 'An enchanted chest.',
  'Tu as traversé le miroir !': 'You crossed the mirror!',
  'Le reflet montre le Cerf des neiges. Ses étoiles s’allument l’une après l’autre.':
    'The reflection shows the Snow Stag. Its stars light up one after another.',
  'Les échos de l’Ombre arrivent ! Protège les cristaux.':
    'The echoes of the Shadow are coming! Protect the crystals.',
  'Les échos se dissipent. Les cristaux brillent de toute leur lumière !':
    'The echoes fade. The crystals shine with all their light!',
  'Les cristaux se sont éteints… Le Cœur se rendort. Réessaie depuis l’autel.':
    'The crystals have gone out… The Heart falls back asleep. Try again from the altar.',
  'Le lac s’illumine : la constellation est complète !': 'The lake lights up: the constellation is complete!',
  'Le reflet s’efface… Recommence depuis la première étoile.':
    'The reflection fades… Start again from the first star.',
  '{quete} : retourne voir {nom}.': '{quete}: go back to {nom}.',
  'Objectif accompli : {objectif}': 'Objective complete: {objectif}',
  'Nouvelle quête : {quete}': 'New quest: {quete}',
  'Quête terminée : {quete}': 'Quest complete: {quete}',
  'Une étoile du Cœur de l’Aurore te rejoint ({n} / 6).': 'A star of the Heart of Dawn joins you ({n} / 6).',
  'Anneau des mille étoiles': 'Ring of a thousand stars',
  'Collier des mille étoiles': 'Necklace of a thousand stars',
  '{objet} (Légendaire) !': '{objet} (Legendary)!',
  'Le mécanisme est déjà réglé.': 'The mechanism is already set.',
  'Il ne reste que des éclats de lumière.': 'Only shards of light remain.',
  'Le trou est vide : tu as déjà trouvé le trésor.': 'The hole is empty: you already found the treasure.',
  'Le poisson doré mord ! Tu le remontes, scintillant.': 'The golden fish bites! You reel it in, glittering.',
  'Juste une carpe… Attends le remous doré.': 'Just a carp… Wait for the golden ripple.',
  'Pierre musicale trouvée ({n} / 4). Son : {son}.': 'Musical stone found ({n} / 4). Sound: {son}.',
  'grave': 'low',
  'doux': 'soft',
  'clair': 'clear',
  'aigu': 'high',
  'Le socle attend sa pierre musicale. Retrouve-les dans la forêt.':
    'The pedestal awaits its musical stone. Find them in the forest.',
  'La mélodie se brise. Recommence.': 'The melody breaks. Start again.',
  'La pierre roule sur le côté : le Sanctuaire des Murmures s’ouvre !':
    'The stone rolls aside: the Sanctuary of Whispers opens!',
  'L’ombre de l’arbre déploie ses ailes : un oiseau parfait. Théon accourt avec ses pinceaux !':
    'The tree’s shadow spreads its wings: a perfect bird. Théon rushes over with his brushes!',
  'Indice': 'Clue',
  'Une lourde porte de pierre. Elle ne bougera pas toute seule.':
    'A heavy stone door. It won’t move on its own.',
  'Le coffre de l’îlot.': 'The islet’s chest.',
  'D’accord': 'All right',
  'Une pierre de passage endormie. On dit qu’une fois réveillée, elle relie la forêt au camp.':
    'A sleeping waystone. They say that once awakened, it links the forest to the camp.',
  'La pierre de passage t’emporte…': 'The waystone carries you away…',
  'Une offrande des anciens t’attendait sur l’autel.':
    'An offering from the ancients awaited you on the altar.',
  'L’autel brille : son étoile est revenue.': 'The altar shines: its star has returned.',
  'L’autel est éteint, il attend son étoile.': 'The altar is dark, it awaits its star.',
  'L’arbre gardien parle : « Petite étincelle… Le Cœur de l’Aurore attend. Rassemble les six étoiles. »':
    'The guardian tree speaks: “Little spark… The Heart of Dawn awaits. Gather the six stars.”',
  'Plouf !': 'Splash!',
  'Parler à {nom}': 'Talk to {nom}',
  'Lire la stèle': 'Read the stele',
  'Creuser': 'Dig',
  'Ferrer': 'Strike',
  'Écouter la pierre': 'Listen to the stone',
  'Jouer la pierre': 'Play the stone',
  'Tourner le miroir': 'Turn the mirror',
  'Pierre de passage': 'Waystone',
  'Appeler Théon': 'Call Théon',
  'Examiner': 'Examine',
  'Interroger': 'Question',
  'Prier à l’autel': 'Pray at the altar',
  'Pousser la porte': 'Push the door',
  'Toucher la feuille': 'Touch the leaf',
  'Prendre le fragment': 'Take the fragment',
  'Lire les archives': 'Read the archives',
  'Regarder la girouette': 'Look at the weathervane',
  'Attraper la feuille': 'Catch the leaf',
  'Écouter': 'Listen',
  'Écouter {nom}': 'Listen to {nom}',
  'Fouiller : {lieu}': 'Search: {lieu}',
  'Dégager l’obélisque': 'Uncover the obelisk',
  'Porte du trésor': 'Treasure door',
  'Porte du temple': 'Temple door',
  'Poser les étoiles': 'Place the stars',
  'Lire la fresque': 'Read the fresco',
  'Éveiller le Cœur': 'Awaken the Heart',
  'Réunir la lumière': 'Unite the light',
  'Actionner le levier': 'Pull the lever',
  'Ouvrir le coffre': 'Open the chest',
  'Sonner le cor': 'Sound the horn',
  'Agir': 'Act',
  'Non… ce n’est pas ça. Je crois que non.': 'No… that’s not it. I don’t think so.',
  '+{n} XP': '+{n} XP',
  'Lumi tinte doucement près de {nom}.': 'Lumi chimes softly near {nom}.',
  'Bonjour, voyageur. Le vent tourne, ces temps-ci…': 'Hello, traveler. The wind is turning, these days…',
  'Cette partie de l’histoire commence plus tard : termine d’abord « {quete} » ({nom}).':
    'This part of the story begins later: first complete “{quete}” ({nom}).',
  'Accepter la quête': 'Accept the quest',
  'Alors… tu sais qui j’étais ?': 'So… do you know who I was?',
  'Terminer la quête': 'Complete the quest',
  'Plus tard': 'Later',
  'Au revoir': 'Goodbye',
  'Histoire · Chapitre {n}': 'Story · Chapter {n}',
  'Histoire': 'Story',
  'Quête secondaire': 'Side quest',
  'Niveau conseillé {n}': 'Recommended level {n}',
  'Retourner voir {nom}': 'Go back to {nom}',
  'Suivie': 'Tracked',
  'Suivre': 'Track',
  'Étoiles du Cœur :': 'Stars of the Heart:',
  'Lumi t’accompagne': 'Lumi is with you',
  'Carte des sanctuaires': 'Map of the sanctuaries',
  '(visité)': '(visited)',
  '(ouvert)': '(open)',
  'Chapitre {n}': 'Chapter {n}',
  'niveaux {n} à {m}': 'levels {n} to {m}',
  'À découvrir : parle à {nom} ({lieu})': 'To discover: talk to {nom} ({lieu})',
  'Aucune quête secondaire en cours. Les habitants de l’île en proposent : cherche les « ! » dorés au-dessus des têtes.':
    'No side quests in progress. The island’s inhabitants offer them: look for golden “!” above their heads.',
  'Souvenir : {texte}': 'Memory: {texte}',
  'Aucune quête terminée pour l’instant.': 'No quests completed yet.',
  'Histoire principale': 'Main story',
  'Quêtes secondaires': 'Side quests',
  'Terminées': 'Completed',
  'Sortie →': 'Exit →',
  '← Sortie': '← Exit',
  '↑ Sortie': '↑ Exit',
  '↓ Sortie': '↓ Exit',
  'Retourne voir {nom}': 'Go back to {nom}',
  'Tu y es': 'You’re there',
  'tout près': 'very close',
  '{n} cases': '{n} tiles',
  // ------------------------------------------------------------ Histoire principale et contrats (réécriture)
  'Cette nuit, une lumière est tombée juste à l’est du Camp de l’Aurore. Liora l’a vue, et elle a peur d’aller voir seule.':
    'Last night, a light fell just east of the Dawn Camp. Liora saw it, and she is afraid to go and look alone.',
  'Tu l’as vue, toi aussi ? Une lumière est tombée cette nuit, juste à l’est du camp !':
    'You saw it too? A light fell last night, just east of the camp!',
  'Elle a laissé des traces qui brillent dans l’herbe. Suis-les, s’il te plaît, et dis-moi ce que c’est. Moi, je n’ose pas y aller seule.':
    'It left glowing tracks in the grass. Please follow them and tell me what it is. I don’t dare go alone.',
  'Les traces partent vers l’est du camp. Suis-les jusqu’au bout : la lumière doit être là.':
    'The tracks lead east of the camp. Follow them to the end: the light must be there.',
  'Elle te suit ? C’est une petite créature de lumière… Lumi, c’est ça ? Le vieil Orven, aux Ruines de la Couronne, saura ce qu’elle est. Va le voir avec elle.':
    'It’s following you? A little creature of light… Lumi, is that it? Old Orven, at the Crown Ruins, will know what she is. Go and see him with her.',
  'Va voir Orven aux Ruines de la Couronne. Il connaît toutes les vieilles histoires de lumière.':
    'Go and see Orven at the Crown Ruins. He knows all the old stories about lights.',
  'Orven reconnaît Lumi : une étincelle du Cœur de l’Aurore. Sa vieille carte montre où dorment les six étoiles du Cœur, mais une femme voilée a lâché les loups dessus.':
    'Orven recognizes Lumi: a spark of the Heart of the Dawn. His old map shows where the Heart’s six stars sleep, but a veiled woman set the wolves on it.',
  'Par ma barbe… Cette lumière vient du Cœur de l’Aurore ! Le Cœur protégeait l’île, autrefois. Les anciens l’ont endormi et ont caché ses six étoiles dans six sanctuaires. Ma carte les montre.':
    'By my beard… This light comes from the Heart of the Dawn! The Heart protected the island, long ago. The ancients put it to sleep and hid its six stars in six sanctuaries. My map shows them.',
  'Hier soir, une femme voilée a sifflé, et les loups ont mis ma carte en pièces. Reprends les morceaux aux loups et aux sangliers, puis arrache les sceaux noirs qu’elle a plantés dans mes ruines.':
    'Last night, a veiled woman whistled, and the wolves tore my map to pieces. Take the pieces back from the wolves and boars, then rip out the black seals she planted in my ruins.',
  'Les morceaux de ma carte sont dans la gueule des loups et des sangliers des plaines. Les sceaux noirs sont ici, dans les ruines.':
    'The pieces of my map are in the jaws of the plains’ wolves and boars. The black seals are here, in the ruins.',
  'La carte est entière ! Regarde : six étoiles, six sanctuaires. Si on les retrouve toutes et qu’on les ramène au Cœur, il se réveillera, et l’île sera de nouveau protégée. La première dort dans la Forêt ancienne : va voir Sylva, la gardienne des chants. Et méfie-toi de la femme voilée : elle cherche les étoiles, elle aussi.':
    'The map is whole! Look: six stars, six sanctuaries. If we find them all and bring them back to the Heart, it will wake, and the island will be protected again. The first one sleeps in the Ancient Forest: go and see Sylva, the keeper of songs. And beware of the veiled woman: she is looking for the stars too.',
  'La première étoile est dans la Forêt ancienne. Sylva t’y attend. Trouve les étoiles avant la femme voilée.':
    'The first star is in the Ancient Forest. Sylva is waiting for you there. Find the stars before the veiled woman does.',
  'Le Sanctuaire des Murmures, où dormait la première étoile, ne s’ouvre qu’à la mélodie des anciens. Mais des araignées étouffent la forêt sous leurs toiles.':
    'The Sanctuary of Whispers, where the first star slept, only opens to the melody of the ancients. But spiders are smothering the forest in their webs.',
  'Orven t’envoie ? Alors tu cherches la première étoile. Elle dormait dans le Sanctuaire des Murmures, et le sanctuaire ne s’ouvre qu’à la mélodie des anciens.':
    'Orven sent you? Then you’re looking for the first star. It slept in the Sanctuary of Whispers, and the sanctuary only opens to the melody of the ancients.',
  'Mais les araignées ont tout envahi, comme si quelqu’un le leur avait demandé. Chasse-les, libère les oiseaux chanteurs pris dans leurs cocons, retrouve les quatre pierres musicales, puis joue au cercle : la plus grave, la plus aiguë, puis les deux du milieu, de la plus grave à la plus aiguë.':
    'But spiders have overrun everything, as if someone had asked them to. Drive them off, free the songbirds caught in their cocoons, find the four musical stones, then play at the circle: the lowest, the highest, then the two middle ones, from lowest to highest.',
  'Le sanctuaire s’ouvre ! Mais l’autel est vide… L’étoile n’est plus là. Les arbres murmurent un nom : Aelor. Il veille sur l’arbre gardien aux racines d’or. Si quelqu’un sait où l’étoile est partie, c’est lui.':
    'The sanctuary opens! But the altar is empty… The star is gone. The trees whisper a name: Aelor. He watches over the guardian tree with golden roots. If anyone knows where the star went, it’s him.',
  'L’étoile a quitté le sanctuaire. Va voir Aelor, près de l’arbre gardien aux racines d’or, dans la Forêt ancienne.':
    'The star has left the sanctuary. Go and see Aelor, by the guardian tree with golden roots, in the Ancient Forest.',
  'L’arbre gardien a recueilli la première étoile. Il dépérit : des gobelins le saignent la nuit et vendent sa sève d’or à la femme voilée.':
    'The guardian tree took in the first star. It is withering: goblins bleed it at night and sell its golden sap to the veiled woman.',
  'La première étoile ? Elle s’est réfugiée dans l’arbre gardien, quand le sanctuaire s’est tu. Mais l’arbre dépérit : les gobelins percent son écorce et vendent sa sève à une femme voilée.':
    'The first star? It took refuge in the guardian tree when the sanctuary fell silent. But the tree is withering: goblins pierce its bark and sell its sap to a veiled woman.',
  'Reprends la sève aux gobelins et verse-la à ses racines. Ils reviendront la chercher : tiens bon le temps qu’il la boive. Quand il aura repris des forces, il te confiera l’étoile.':
    'Take the sap back from the goblins and pour it on its roots. They’ll come back for it: hold out while it drinks. Once it has regained its strength, it will entrust you with the star.',
  'Il t’a parlé, et il t’a confié l’étoile. Une sur six ! La femme voilée s’appelle Vesper, dit l’arbre, et elle veut éteindre les étoiles. La deuxième dort dans le marais, au Sanctuaire des Reflets. Maëline y entretient les lanternes : elle te montrera le chemin.':
    'It spoke to you, and it entrusted you with the star. One of six! The veiled woman is called Vesper, the tree says, and she wants to put out the stars. The second sleeps in the marsh, at the Sanctuary of Reflections. Maëline tends the lanterns there: she’ll show you the way.',
  'Une étoile sur six. La suivante dort au Sanctuaire des Reflets, dans le Marais brumeux. Va voir Maëline et ses lanternes.':
    'One star of six. The next one sleeps at the Sanctuary of Reflections, in the Misty Marsh. Go and see Maëline and her lanterns.',
  'Les lanternes de Maëline guidaient les voyageurs jusqu’au Sanctuaire des Reflets, où dort la deuxième étoile. Elles se sont toutes éteintes en une nuit.':
    'Maëline’s lanterns guided travelers to the Sanctuary of Reflections, where the second star sleeps. They all went out in a single night.',
  'Tu cherches le Sanctuaire des Reflets ? Mes lanternes en montraient le chemin. Elles se sont toutes éteintes la même nuit, et trois voyageurs ne sont pas rentrés.':
    'You’re looking for the Sanctuary of Reflections? My lanterns showed the way. They all went out the same night, and three travelers never came back.',
  'Les feux follets ont avalé leurs flammes. Reprends-les-leur, rallume les quatre lanternes, et défends-les jusqu’à l’aube : le marais n’aime pas la lumière.':
    'The will-o’-the-wisps swallowed their flames. Take them back, relight the four lanterns, and defend them until dawn: the marsh doesn’t like light.',
  'Elles brillent toutes ! J’ai vu des silhouettes au visage voilé s’enfuir : Vesper n’est plus seule. Et regarde, les lanternes tracent le chemin du Sanctuaire des Reflets. Néris garde ses vieux miroirs : elle t’attend là-bas.':
    'They’re all shining! I saw veiled figures running away: Vesper is no longer alone. And look, the lanterns trace the path to the Sanctuary of Reflections. Néris keeps its old mirrors: she’s waiting for you there.',
  'Le chemin du Sanctuaire des Reflets est éclairé. Néris t’attend près des vieux miroirs.':
    'The path to the Sanctuary of Reflections is lit. Néris is waiting for you by the old mirrors.',
  'Les miroirs du Sanctuaire des Reflets montraient le passé. Les Voilés les ont brisés pour cacher la vérité sur Vesper. La deuxième étoile est derrière eux.':
    'The mirrors of the Sanctuary of Reflections showed the past. The Veiled broke them to hide the truth about Vesper. The second star is behind them.',
  'Ces miroirs se souvenaient de tout. Une nuit, des hommes voilés les ont brisés, un par un. Ils ne voulaient pas qu’on voie ce qu’ils montrent : l’histoire de Vesper.':
    'These mirrors remembered everything. One night, veiled men smashed them, one by one. They didn’t want anyone to see what they show: Vesper’s story.',
  'Retrouve les éclats et remets-les dans leurs cadres. Quand les miroirs seront entiers, le sanctuaire te rendra la deuxième étoile. Méfie-toi : un miroir brisé a parfois un reflet qui ne te ressemble pas.':
    'Find the shards and put them back in their frames. When the mirrors are whole, the sanctuary will give you the second star. Beware: a broken mirror sometimes has a reflection that doesn’t look like you.',
  'Alors c’était ça… Vesper chantait avec les anciens. Ils ont endormi le Cœur pour le sauver, et ils l’ont oubliée au large. Elle croit qu’on l’a trahie. Voici la deuxième étoile : deux sur six. La troisième dort dans la Forêt automnale, où Érable garde un village oublié.':
    'So that was it… Vesper sang with the ancients. They put the Heart to sleep to save it, and they forgot her out at sea. She believes she was betrayed. Here is the second star: two of six. The third sleeps in the Autumn Forest, where Érable guards a forgotten village.',
  'Deux étoiles sur six. La troisième est dans la Forêt automnale : Érable t’y attend, dans les ruines du village aux feuilles dorées.':
    'Two stars of six. The third is in the Autumn Forest: Érable is waiting for you in the ruins of the village of golden leaves.',
  'La troisième étoile dort sous les feuilles d’un village oublié de la Forêt automnale. La Confrérie du Voile pille ses ruines pour la trouver avant toi.':
    'The third star sleeps beneath the leaves of a forgotten village in the Autumn Forest. The Brotherhood of the Veil is looting its ruins to find it before you.',
  'Ici vivait un village, avant l’Ombre. Ses maisons sont tombées, mais les feuilles dorées se souviennent de tout, et la troisième étoile dort sous elles.':
    'A village lived here, before the Shadow. Its houses have fallen, but the golden leaves remember everything, and the third star sleeps beneath them.',
  'Les Voilés fouillent les ruines et emportent les souvenirs des maisons. Touche les feuilles pour voir le village, chasse les pilleurs, reprends ce qu’ils ont volé et rends-le à chaque maison. Quand le village se souviendra de lui-même, l’étoile se lèvera.':
    'The Veiled are searching the ruins and carrying off the houses’ memories. Touch the leaves to see the village, drive off the looters, take back what they stole and return it to each house. When the village remembers itself, the star will rise.',
  'Les pilleurs de la Confrérie rôdent dans toute la Forêt automnale. Ils cherchent l’étoile sans savoir qu’elle est sous leurs pieds.':
    'The Brotherhood’s looters prowl all over the Autumn Forest. They’re looking for the star without knowing it’s under their feet.',
  'Le village se souvient… et l’étoile se lève des feuilles ! Trois sur six. Mais une question demeure : pourquoi les anciens ont-ils endormi le Cœur, et comment le réveiller ? Solenne garde la fresque des saisons, près des grands érables. Elle le sait peut-être.':
    'The village remembers… and the star rises from the leaves! Three of six. But a question remains: why did the ancients put the Heart to sleep, and how do we wake it? Solenne keeps the fresco of the seasons, by the great maples. She may know.',
  'Trois étoiles sur six. Solenne garde la fresque des saisons : elle sait pourquoi le Cœur s’est endormi.':
    'Three stars of six. Solenne keeps the fresco of the seasons: she knows why the Heart fell asleep.',
  'La fresque des saisons raconte pourquoi les anciens ont endormi le Cœur. Elle est en morceaux, et les esprits des saisons la gardent.':
    'The fresco of the seasons tells why the ancients put the Heart to sleep. It is in pieces, and the spirits of the seasons guard it.',
  'La fresque des saisons dit pourquoi le Cœur s’est endormi. Elle est en quatre morceaux : rassemble-les et repose-les au centre du cercle.':
    'The fresco of the seasons tells why the Heart fell asleep. It’s in four pieces: gather them and set them back in the center of the circle.',
  'Les esprits du printemps, de l’été, de l’automne et de l’hiver viendront voir qui ose. Ils ne sont pas méchants : ils ont peur. Tiens bon.':
    'The spirits of spring, summer, autumn and winter will come to see who dares. They aren’t wicked: they’re afraid. Hold firm.',
  'Les archives parlent : « Le Cœur fut endormi pour que l’Ombre ne le dévore pas. » Mais personne n’a écrit comment le réveiller… sauf une main, dans la marge : « Moi, je m’en souviens. » Vesper. Les anciens ont laissé une machine sous le désert, dans la Cité des Étoiles : elle saura. Sahir connaît le chemin.':
    'The archives speak: “The Heart was put to sleep so the Shadow would not devour it.” But no one wrote how to wake it… except one hand, in the margin: “I remember.” Vesper. The ancients left a machine beneath the desert, in the City of Stars: it will know. Sahir knows the way.',
  'Pour savoir comment réveiller le Cœur, il faut la machine de la Cité des Étoiles, sous le Désert oublié. Sahir connaît les obélisques qui en gardent l’entrée.':
    'To learn how to wake the Heart, you need the machine of the City of Stars, beneath the Forgotten Desert. Sahir knows the obelisks that guard its entrance.',
  'Trois obélisques gardent l’entrée de la Cité des Étoiles, où dorment la quatrième étoile et la machine des anciens. Les morts de la cité en barrent la route.':
    'Three obelisks guard the entrance to the City of Stars, where the fourth star and the machine of the ancients sleep. The city’s dead bar the way.',
  'La Cité des Étoiles ? Trois obélisques en gardent l’entrée, sous le sable. La quatrième étoile y dort, et la machine des anciens aussi.':
    'The City of Stars? Three obelisks guard its entrance, beneath the sand. The fourth star sleeps there, and so does the machine of the ancients.',
  'Mais les morts se sont relevés depuis le passage de la Confrérie. Renvoie-les au sable, dégage les trois obélisques et vaincs le gardien de l’escalier.':
    'But the dead have risen since the Brotherhood came through. Send them back to the sand, uncover the three obelisks and defeat the guardian of the stairs.',
  'Le sable s’effondre… un escalier ! La Cité des Étoiles, et sa lumière : la quatrième étoile ! Quatre sur six. En bas, Astéria étudie la vieille machine. Elle a besoin de toi pour la faire parler.':
    'The sand gives way… a staircase! The City of Stars, and its light: the fourth star! Four of six. Down below, Astéria is studying the old machine. She needs you to make it speak.',
  'Quatre étoiles sur six. Descends dans la Cité des Étoiles : Astéria t’y attend avec la machine des anciens.':
    'Four stars of six. Go down into the City of Stars: Astéria is waiting for you with the machine of the ancients.',
  'Sous la Cité des Étoiles, une machine des anciens sait comment réveiller le Cœur. Il lui faut du verre solaire, et quelqu’un pour la défendre quand elle s’éveille.':
    'Beneath the City of Stars, a machine of the ancients knows how to wake the Heart. It needs sun glass, and someone to defend it as it wakes.',
  'Cette machine a été faite pour une seule chose : dire comment réveiller le Cœur. Trois anneaux, six symboles chacun. Quand ils tournent ensemble, elle parle.':
    'This machine was made for one thing only: to tell how to wake the Heart. Three rings, six symbols each. When they turn together, it speaks.',
  'Il lui faut du verre solaire, et les drakes des dunes le portent sur le dos. Une fois lancée, elle fera du bruit. Beaucoup de bruit. Tout le désert viendra : il faudra la défendre.':
    'It needs sun glass, and the dune drakes carry it on their backs. Once started, it will make noise. A lot of noise. The whole desert will come: you’ll have to defend it.',
  'Elle parle : « Réunissez les six étoiles dans le sanctuaire central, et qu’une étincelle du Cœur chante avec elles. » Une étincelle du Cœur… c’est Lumi ! La cinquième étoile était dans la machine : cinq sur six. Lumi connaît le chemin du sanctuaire central, dans la Forêt enchantée. Et Vesper aussi, maintenant : elle écoutait derrière un pilier.':
    'It speaks: “Gather the six stars in the central sanctuary, and let a spark of the Heart sing with them.” A spark of the Heart… that’s Lumi! The fifth star was inside the machine: five of six. Lumi knows the way to the central sanctuary, in the Enchanted Forest. And so does Vesper, now: she was listening behind a pillar.',
  'Cinq étoiles sur six. Suis Lumi dans la Forêt enchantée, jusqu’au Sanctuaire des Six Lumières. Vesper y va aussi.':
    'Five stars of six. Follow Lumi into the Enchanted Forest, to the Sanctuary of the Six Lights. Vesper is heading there too.',
  'Lumi te mène au Sanctuaire des Six Lumières. Trois épreuves attendent avant qu’on puisse poser les étoiles sur l’autel et ouvrir la Chambre de l’Aurore.':
    'Lumi leads you to the Sanctuary of the Six Lights. Three trials await before the stars can be set on the altar and the Chamber of the Dawn opened.',
  '✨ C’est ici. Le Sanctuaire des Six Lumières… je m’en souviens. Si tu poses les étoiles sur l’autel, la Chambre de l’Aurore s’ouvrira, et le Cœur sera derrière.':
    '✨ It’s here. The Sanctuary of the Six Lights… I remember it. If you set the stars on the altar, the Chamber of the Dawn will open, and the Heart will be behind it.',
  '✨ Mais les anciens ont laissé trois épreuves : courir avec la lumière, garder la flamme, et recueillir les lumières égarées. Je reste près de toi.':
    '✨ But the ancients left three trials: run with the light, keep the flame, and gather the lost lights. I’ll stay close to you.',
  '✨ Trois épreuves, puis l’autel. Je brille plus fort quand tu es près de moi. Tu l’avais remarqué ?':
    '✨ Three trials, then the altar. I shine brighter when you’re near me. Had you noticed?',
  '✨ Les étoiles brillent ensemble ! La Chambre de l’Aurore est ouverte. Auralis, le gardien du Cœur, nous y attend… et Vesper arrive.':
    '✨ The stars shine together! The Chamber of the Dawn is open. Auralis, the Heart’s guardian, is waiting for us… and Vesper is coming.',
  '✨ La Chambre de l’Aurore est ouverte. Auralis nous attend. Vite, avant Vesper !':
    '✨ The Chamber of the Dawn is open. Auralis is waiting for us. Hurry, before Vesper!',
  'Dans la Chambre de l’Aurore, Auralis, le dernier gardien, attend pour réveiller le Cœur. Sa sœur Vesper arrive en même temps que toi, et l’Ombre avec elle.':
    'In the Chamber of the Dawn, Auralis, the last guardian, waits to wake the Heart. His sister Vesper arrives at the same time as you, and the Shadow with her.',
  'Je suis Auralis, le gardien du Cœur. Je suis resté ici quand tout le monde est parti, même quand ma sœur Vesper a cessé de chanter.':
    'I am Auralis, the Heart’s guardian. I stayed here when everyone left, even when my sister Vesper stopped singing.',
  'Elle arrive, et l’Ombre avec elle. Lis ma fresque, puis défends les six cristaux pendant que le Cœur s’éveille. Si l’Ombre les brise tous, il se rendormira pour toujours.':
    'She’s coming, and the Shadow with her. Read my fresco, then defend the six crystals while the Heart wakes. If the Shadow breaks them all, it will fall asleep forever.',
  'Milo, berger des Plaines verdoyantes : Pompon, son mouton, s’est encore sauvé pour monter au sommet de la colline, et les loups rôdent. Il faut le rattraper, chasser les loups et l’accompagner là-haut, sinon il recommencera cette nuit.':
    'Milo, shepherd of the Verdant Plains: Pompom, his sheep, has run off again to climb to the top of the hill, and wolves are prowling. Catch him, drive off the wolves and walk him up there, or he’ll do it again tonight.',
  'Rattrape Pompon, chasse les loups de la colline, puis monte avec lui jusqu’au drapeau. Têtu comme un mouton, je te dis !':
    'Catch Pompom, drive the wolves off the hill, then climb with him to the flag. Stubborn as a sheep, I tell you!',
  'Il est en haut ! Regarde-le, il est si fier. Merci de ta patience : la guilde aura ton paiement, et moi ma nuit de sommeil.':
    'He’s at the top! Look at him, so proud. Thanks for your patience: the guild will have your payment, and I’ll have my night’s sleep.',
  'Pompon regarde le coucher de soleil du haut de la colline. Il recommencera, j’en suis sûr : je repasserai par la guilde.':
    'Pompom watches the sunset from the top of the hill. He’ll do it again, I’m sure: I’ll go back to the guild.',
  'Bastian, chasseur de trésors des Plaines verdoyantes : les sangliers ont encore mâchonné les pages de sa vieille chanson de marin. Elle dit qu’un coffre dort là où se croisent les ombres de trois chênes. Il faut reprendre les pages, creuser au bon endroit et chasser le vieux sanglier qui dort dessus.':
    'Bastian, treasure hunter of the Verdant Plains: the boars have chewed the pages of his old sailor’s song again. It says a chest sleeps where the shadows of three oaks meet. Take back the pages, dig in the right spot and chase off the old boar sleeping on it.',
  'Reprends les pages aux sangliers, puis regarde les ombres des trois chênes : elles se croisent juste au-dessus du coffre.':
    'Take the pages back from the boars, then watch the shadows of the three oaks: they meet right above the chest.',
  'Un coffre ! Encore un ! La chanson a plus de couplets que je ne croyais. Garde ce qu’il contient, moi je veux juste voir leur tête au camp.':
    'A chest! Another one! The song has more verses than I thought. Keep what’s inside, I just want to see their faces back at camp.',
  'Chaque couplet de la chanson cache un coffre. Je dépose une demande à la guilde dès que je trouve le suivant.':
    'Every verse of the song hides a chest. I’ll post a request at the guild as soon as I find the next one.',
  'Éloi, vieux pêcheur des Plaines verdoyantes : le poisson doré de son étang ne mord qu’au poisson frais, et seulement quand une onde brille d’or. Il lui faut trois poissons pour l’appât, puis quelqu’un qui sache ferrer au bon moment.':
    'Éloi, old fisherman of the Verdant Plains: the golden fish in his pond only bites on fresh fish, and only when a ripple shines gold. He needs three fish for bait, then someone who can strike at the right moment.',
  'Trois poissons pour l’appât, pêchés n’importe où. Ensuite, regarde mon étang : quand un remous brille d’or, approche-toi et ferre (E).':
    'Three fish for bait, caught anywhere. Then watch my pond: when a ripple shines gold, get close and strike (E).',
  'Tu l’as eu ! Il y en a toujours un autre dans cet étang, tu sais. C’est pour ça que je reviens chaque matin.':
    'You got it! There’s always another one in this pond, you know. That’s why I come back every morning.',
  'Le poisson doré revient toujours. Quand il se montre, je fais passer le mot à la guilde.':
    'The golden fish always comes back. When it shows itself, I send word to the guild.',
  'Nima, de la Forêt ancienne : les fées ont encore retourné les panneaux du bosquet, et les voyageurs s’y perdent. Seules les lucioles connaissent le vrai chemin : il faut en attraper trois et les suivre jusqu’à la pierre de passage.':
    'Nima, of the Ancient Forest: the fairies have turned the grove’s signposts around again, and travelers are getting lost. Only the fireflies know the true path: catch three and follow them to the waystone.',
  'Attrape trois lucioles devant le bosquet, puis suis-les. Surtout, ne lis pas les panneaux : les fées les ont retournés.':
    'Catch three fireflies in front of the grove, then follow them. Above all, don’t read the signposts: the fairies turned them around.',
  'Te voilà de l’autre côté ! La pierre de passage te ramène au camp quand tu veux (E). Les fées vont encore bouder.':
    'There you are, on the other side! The waystone takes you back to camp whenever you like (E). The fairies are going to sulk again.',
  'Les fées retournent les panneaux tous les quelques jours. Si le bosquet se remet à mentir, je préviendrai la guilde.':
    'The fairies turn the signposts every few days. If the grove starts lying again, I’ll tell the guild.',
  'Brin, voyageur de la Forêt ancienne : ses provisions disparaissent chaque nuit, et il ne voit que de toutes petites empreintes. Il faut suivre la piste, attraper le voleur et décider de son sort.':
    'Brin, traveler of the Ancient Forest: his supplies vanish every night, and all he sees are tiny footprints. Follow the trail, catch the thief and decide its fate.',
  'Les empreintes partent de mon sac. Regarde par terre, de près : elles n’apparaissent qu’à quelques pas.':
    'The footprints start at my bag. Look at the ground, up close: they only show from a few steps away.',
  'Bon, c’est décidé. Merci d’avoir tiré ça au clair : la guilde te paiera pour moi.':
    'Right, that’s settled. Thanks for getting to the bottom of it: the guild will pay you on my behalf.',
  'Théon, peintre de la Forêt ancienne : d’un endroit précis, l’ombre de son vieil arbre prend la forme d’un oiseau. Pour la peindre, il lui faut des herbes pour ses couleurs, des poils de chauve-souris pour ses pinceaux, et quelqu’un pour retrouver le bon endroit.':
    'Théon, painter of the Ancient Forest: from one exact spot, the shadow of his old tree takes the shape of a bird. To paint it, he needs herbs for his colors, bat hair for his brushes, and someone to find the right spot.',
  'Des herbes pour les couleurs, des poils de chauve-souris pour les pinceaux. Puis l’endroit : au nord de l’arbre, un pas à l’ouest. Appelle-moi (E) quand tu y es.':
    'Herbs for the colors, bat hair for the brushes. Then the spot: north of the tree, one step west. Call me (E) when you’re there.',
  'Le voilà, mon oiseau d’ombre ! Il change avec les saisons, alors je le repeins souvent. Merci, l’ami.':
    'There it is, my shadow bird! It changes with the seasons, so I paint it often. Thank you, friend.',
  'L’ombre de l’arbre change avec la lumière. Quand mes couleurs s’épuisent, je repasse par la guilde.':
    'The tree’s shadow changes with the light. When my colors run out, I go back to the guild.',
  'Goran, bâtisseur du Marais brumeux : les bêtes du marais rongent encore son pont. Il lui faut des planches échouées, des tendons de mante pour les cordes, et quelqu’un pour tenir les bêtes à distance pendant qu’il cloue.':
    'Goran, builder of the Misty Marsh: the marsh beasts are gnawing at his bridge again. He needs washed-up planks, mantis tendons for the ropes, and someone to keep the beasts at bay while he nails.',
  'Des planches bien droites autour de l’étang, des tendons de mante pour les cordes. Ensuite, reste entre les bêtes et moi pendant que je cloue.':
    'Nice straight planks from around the pond, mantis tendons for the ropes. Then stay between the beasts and me while I nail.',
  'Il tient ! Encore une fois ! Les mantes finiront par se lasser avant moi. Merci, l’ami.':
    'It holds! Once again! The mantises will tire of it before I do. Thanks, friend.',
  'Le Pont qui Tient tient… jusqu’à la prochaine mante affamée. Je laisserai un mot à la guilde.':
    'The Bridge that Holds holds… until the next hungry mantis. I’ll leave a note at the guild.',
  'Un esprit amical erre dans le Marais brumeux. Il oublie son nom à chaque nouvelle lune, et sans nom il ne peut pas faire sa tournée. Il faut interroger les habitants et les objets du marais, lui rendre son nom et l’accompagner.':
    'A friendly spirit wanders the Misty Marsh. It forgets its name every new moon, and without a name it can’t make its rounds. Question the locals and the marsh’s objects, give it back its name and walk with it.',
  'Ilian le lanternier. Oui, c’était moi. Merci d’avoir fait la tournée avec moi. À la prochaine lune, je l’aurai sans doute encore oublié…':
    'Ilian the lamplighter. Yes, that was me. Thank you for making the rounds with me. By the next moon, I’ll probably have forgotten it again…',
  'Je m’appelle… Ilian, je crois. À chaque nouvelle lune, ça m’échappe encore. Si je l’oublie, la guilde saura où me trouver.':
    'My name is… Ilian, I think. Every new moon, it slips away again. If I forget it, the guild will know where to find me.',
  'Pipo, enfant du Marais brumeux : Gobe-Tout, le vieux basilic de l’étang, a encore avalé la clé du coffre de l’îlot. Il faut attirer le basilic en chassant les siens, le vaincre pour reprendre la clé, puis traverser sur les nénuphars qui coulent.':
    'Pipo, a child of the Misty Marsh: Gulp, the pond’s old basilisk, has swallowed the key to the islet’s chest again. Lure the basilisk out by hunting its kin, defeat it to get the key back, then cross on the sinking lily pads.',
  'Chasse les basilics pour faire sortir Gobe-Tout, reprends-lui la clé, puis saute de nénuphar en nénuphar sans t’arrêter !':
    'Hunt the basilisks to draw out Gulp, take the key back from him, then hop from lily pad to lily pad without stopping!',
  'Tu l’as fait ! Hi hi, tu sens le basilic. Gobe-Tout avale tout ce qui brille, alors il y aura sûrement une prochaine fois.':
    'You did it! Hee hee, you smell like basilisk. Gulp swallows everything shiny, so there’ll surely be a next time.',
  'Je m’entraîne à sauter. Et Gobe-Tout a déjà avalé ma nouvelle clé…':
    'I’m practicing my jumps. And Gulp has already swallowed my new key…',
  'Flavio, de la Forêt automnale, organise un concours à chaque saison et cherche des concurrents : une course à travers les érables, puis la feuille dorée à attraper au vol.':
    'Flavio, of the Autumn Forest, holds a contest every season and is looking for contestants: a race through the maples, then the golden leaf to catch in midair.',
  'Touche les six fanions avant la fin du temps. Pour la feuille, ne la poursuis pas : devine où le vent l’emmène, et E quand elle passe sur toi.':
    'Touch the six pennants before time runs out. For the leaf, don’t chase it: guess where the wind is taking it, and E when it passes over you.',
  'Champion ! Garde la feuille, elle ne fanera jamais. Reviens au prochain concours : je compte bien te battre.':
    'Champion! Keep the leaf, it will never wither. Come back for the next contest: I fully intend to beat you.',
  'Le prochain concours approche. Je l’annoncerai au tableau de la guilde.':
    'The next contest is coming. I’ll announce it on the guild board.',
  'Odel, meunier de la Forêt automnale : les trolls lui ont encore volé ses engrenages pour s’en faire des colliers. Depuis, son moulin tourne à l’envers, le grain s’entasse au grenier, et une grosse bête y a fait son nid.':
    'Odel, miller of the Autumn Forest: the trolls have stolen his gears again to make necklaces. Since then, his mill turns backwards, grain is piling up in the loft, and a big beast has nested there.',
  'Reprends mes engrenages aux trolls, remonte-les dans le moulin, puis chasse la bête qui mange mon grain au grenier.':
    'Take my gears back from the trolls, put them back in the mill, then chase off the beast eating my grain in the loft.',
  'Il tourne dans le bon sens, et le grenier est calme. Les trolls finiront par revenir, ils adorent ce qui brille. Merci !':
    'It turns the right way, and the loft is quiet. The trolls will come back eventually, they love anything shiny. Thank you!',
  'Ma farine est fine comme de la poussière d’étoile. Si les trolls reviennent, la guilde le saura.':
    'My flour is as fine as stardust. If the trolls come back, the guild will hear of it.',
  'Trois voyageurs campent dans la Forêt automnale : un renard magique leur vole leurs provisions, et ils ne sont jamais d’accord sur l’endroit où il se cache. Il faut écouter leurs témoignages, trouver la cachette et rattraper le renard.':
    'Three travelers are camping in the Autumn Forest: a magic fox steals their supplies, and they never agree on where it hides. Listen to their accounts, find the hiding place and catch the fox.',
  'La cachette ! Et nos provisions… Ce renard est malin : il trouvera une autre cachette, c’est sûr.':
    'The hiding place! And our supplies… That fox is clever: it’ll find another hiding place, for sure.',
  'Malice, le renard, change de cachette à chaque lune. On laisse toujours un mot à la guilde.':
    'Mischief, the fox, changes hiding places every moon. We always leave a note at the guild.',
  'Zafir, marchand du Désert oublié, vend du vent en bouteille. Ses tourbillons se sont échappés, les drakes des dunes les avalent, et il veut offrir une bouteille de brise à Amira, à l’oasis, pour se faire pardonner une vieille dette.':
    'Zafir, a merchant of the Forgotten Desert, sells wind in bottles. His whirlwinds have escaped, the dune drakes are swallowing them, and he wants to give a bottle of breeze to Amira, at the oasis, to make up for an old debt.',
  'Remets mes tourbillons en bouteille, chasse les drakes qui les avalent, puis porte une bouteille de brise à Amira, à l’oasis. Discrètement : c’est un cadeau.':
    'Bottle my whirlwinds back up, chase off the drakes swallowing them, then take a bottle of breeze to Amira, at the oasis. Discreetly: it’s a gift.',
  'Elle a souri ? Elle a SOURI ? Je lui en enverrai une autre à la prochaine lune. Merci, l’ami du vent.':
    'She smiled? She SMILED? I’ll send her another one next moon. Thank you, friend of the wind.',
  'Chaque lune, j’envoie une bouteille à Amira. Et chaque lune, mes tourbillons s’échappent.':
    'Every moon, I send Amira a bottle. And every moon, my whirlwinds escape.',
  'Noura, prêtresse du Désert oublié : le sable a encore dérangé les miroirs du petit temple, et sa porte ne s’ouvre qu’au rayon du soleil. Il faut orienter les miroirs, puis calmer Néfer, la gardienne, que la lumière réveille.':
    'Noura, priestess of the Forgotten Desert: the sand has shifted the little temple’s mirrors again, and its door only opens to a ray of sunlight. Turn the mirrors, then calm Néfer, the guardian, whom the light wakes up.',
  'Tourne les miroirs (E) et suis le rayon depuis la pierre solaire jusqu’au soleil de la porte. Puis calme Néfer : elle déteste être réveillée.':
    'Turn the mirrors (E) and follow the beam from the sun stone to the sun on the door. Then calm Néfer: she hates being woken.',
  'La porte est ouverte et Néfer dort de nouveau. Les tempêtes déplacent les miroirs à chaque saison : reviens quand la guilde t’enverra.':
    'The door is open and Néfer sleeps again. Storms move the mirrors every season: come back when the guild sends you.',
  'Je prie ici chaque matin. Quand une tempête dérange les miroirs, j’écris à la guilde.':
    'I pray here every morning. When a storm disturbs the mirrors, I write to the guild.',
  'Amira, de l’oasis du Désert oublié : les scorpions ont encore fait leurs nids dans l’aqueduc, l’eau n’arrive plus et les porteurs n’osent plus sortir. Il faut chasser les scorpions, détruire les nids et escorter un porteur jusqu’au bassin.':
    'Amira, of the Forgotten Desert’s oasis: scorpions have nested in the aqueduct again, the water no longer flows and the carriers no longer dare go out. Drive off the scorpions, destroy the nests and escort a carrier to the basin.',
  'L’eau chante dans le bassin ! Les scorpions reviendront avec la saison sèche, mais aujourd’hui l’oasis respire. Merci, l’ami de l’eau.':
    'The water sings in the basin! The scorpions will be back with the dry season, but today the oasis breathes. Thank you, friend of the water.',
  'Les palmiers reverdissent. À la saison sèche, les scorpions reviennent toujours : la guilde le saura.':
    'The palms are growing green again. In the dry season, the scorpions always come back: the guild will hear of it.',
  'Lyss, de la Forêt enchantée : deux clairières se reflètent l’une l’autre, et les fées sauvages brouillent encore le reflet. Il faut les calmer, puis actionner les leviers pour ouvrir un passage jusqu’au coffre de l’autre clairière.':
    'Lyss, of the Enchanted Forest: two glades reflect each other, and the wild fairies are blurring the reflection again. Calm them, then pull the levers to open a way to the chest in the other glade.',
  'Tu as traversé le miroir ! Le reflet remplit le coffre à chaque pleine lune. Reviens quand les fées recommenceront.':
    'You crossed the mirror! The reflection refills the chest every full moon. Come back when the fairies start again.',
  'Parfois, je me demande quelle clairière est la vraie. Les fées, elles, s’en moquent.':
    'Sometimes I wonder which glade is the real one. The fairies couldn’t care less.',
  'Pyria, de la Forêt enchantée, élève un jeune dragon, Braise, qui a peur du vide. Les grands drakes viennent se moquer de lui. Il faut lui donner du courage avec des pêches étoilées, chasser les moqueurs et courir devant lui pour lui montrer comment prendre son élan.':
    'Pyria, of the Enchanted Forest, is raising a young dragon, Ember, who is afraid of heights. The big drakes come to mock him. Give him courage with star peaches, chase off the mockers and run ahead of him to show him how to build momentum.',
  'IL VOLE ! Braise vole ! Il oublie parfois comment faire, alors on recommencera. Merci, il t’adore.':
    'HE’S FLYING! Ember is flying! He sometimes forgets how, so we’ll do it again. Thank you, he adores you.',
  'Braise fait des loopings, quand il n’a pas peur. Les jours de vent, il faut tout recommencer.':
    'Ember does loops, when he isn’t scared. On windy days, we have to start all over again.',
  'Élya, de la Forêt enchantée : les ents corrompus cachent encore le ciel au lac aux mille étoiles. Il faut les apaiser, puis marcher sur les pierres du lac dans l’ordre où s’allument les étoiles du reflet.':
    'Élya, of the Enchanted Forest: the corrupted ents are hiding the sky from the lake of a thousand stars again. Calm them, then walk on the lake’s stones in the order the reflected stars light up.',
  'Le lac t’a reconnu. Chaque nuit claire, il recommence sa constellation. Reviens quand les ents la cacheront de nouveau.':
    'The lake recognized you. Every clear night, it starts its constellation anew. Come back when the ents hide it again.',
  'Les nuits claires, le lac brille pour toi. Les ents, eux, n’aiment pas la lumière.':
    'On clear nights, the lake shines for you. The ents don’t like the light.',
  'Mineur Gloin, de Durgrim : il fabrique pour sa femme Ylva des lanternes toujours plus belles, pour rentrer avant qu’elles ne s’éteignent. Il lui faut du minerai et des carapaces de scarabées foreurs.':
    'Miner Gloin, of Durgrim: he makes ever more beautiful lanterns for his wife Ylva, so he can come home before they go out. He needs ore and borer beetle shells.',
  'Elle est… magnifique. Ylva va pleurer. Moi, je pleure déjà. La prochaine sera encore plus belle !':
    'It’s… magnificent. Ylva is going to cry. I’m already crying. The next one will be even more beautiful!',
  'Je suis rentré à l’heure. Elle a cru que j’étais malade. J’en fabrique déjà une autre.':
    'I got home on time. She thought I was ill. I’m already making another one.',
  'Petit Fili, de Durgrim, n’a jamais vu le ciel. Il voudrait une fiole remplie de ciel et quelque chose qui sent dehors. Sa fiole se vide toujours trop vite.':
    'Little Fili, of Durgrim, has never seen the sky. He would like a vial filled with sky and something that smells of outside. His vial always empties too quickly.',
  'Elle est pleine de bleu très clair ! Je la mettrai près de mon lit. Tiens, un de mes cailloux : celui-là est tombé d’en haut, une nuit. Il chantait.':
    'It’s full of very pale blue! I’ll put it by my bed. Here, one of my pebbles: this one fell from up there, one night. It was singing.',
  'La nuit, je débouche un tout petit peu la fiole. Ça sent l’herbe. Quand elle sera vide, tu reviendras ?':
    'At night, I uncork the vial just a tiny bit. It smells like grass. When it’s empty, will you come back?',
  'Garde Balin, de Durgrim : Grumbar hante toujours la Mine Effondrée avec les outils des mineurs morts, dont la pioche de son frère Frerin. Il faut dégager la route de la mine et la terminer.':
    'Guard Balin, of Durgrim: Grumbar still haunts the Collapsed Mine with the dead miners’ tools, including his brother Frerin’s pickaxe. Clear the road to the mine and complete it.',
  'Sa pioche… Il y avait gravé nos deux noms. Grumbar reviendra, il revient toujours. Mais aujourd’hui, Frerin peut dormir.':
    'His pickaxe… He had carved both our names on it. Grumbar will be back, he always comes back. But today, Frerin can sleep.',
  'Je porte de la bière à Frerin chaque semaine. Quand Grumbar se réveille, je préviens la guilde.':
    'I bring Frerin a beer every week. When Grumbar wakes, I warn the guild.',
  'Dorn le Tavernier, de Durgrim : Helga trouve encore sa bière « tendre ». Il lui faut des chapeaux de myconide et de la bave de limace pour une bière plus forte, et un témoin : le Garde Dwalin, qui doit la goûter.':
    'Dorn the Innkeeper, of Durgrim: Helga still finds his beer “tender”. He needs myconid caps and slug slime for a stronger brew, and a witness: Guard Dwalin, who has to taste it.',
  'Il a dit « les Dorn » ? Au pluriel ? HELGA ! Tiens, l’ami, ta part. Elle trouvera bien autre chose à redire…':
    'He said “the Dorns”? Plural? HELGA! Here, friend, your share. She’ll find something else to complain about…',
  'On l’a appelée la Voit-Double. Helga parie déjà sur la prochaine.':
    'We called it the Double-Vision. Helga is already betting on the next one.',
  'Perrin, colporteur de la surface, est encore tombé par une trappe dans les Tréfonds avec toute sa marchandise. Il faut retrouver ses rubans, reprendre son sandwich à une bête et l’escorter jusqu’à la route de Durgrim.':
    'Perrin, a peddler from the surface, has fallen through a trapdoor into the Depths again with all his wares. Find his ribbons, take his sandwich back from a beast and escort him to the Durgrim road.',
  'Une route ! Des gens ! Petits, mais des gens ! Je fais toujours attention aux trappes… sauf quand je mange.':
    'A road! People! Small ones, but people! I always watch out for trapdoors… except when I’m eating.',
  'Les naines adorent mes rubans. Je remonte vendre là-haut, et je retombe toujours au même endroit.':
    'The dwarf women love my ribbons. I go back up to sell, and I always fall back down in the same spot.',
  'Orsik le Sonneur, esprit de Khaz-Ombral : chaque année, au soir de la Grande Fermeture, il veut sonner sa cloche pour dire au revoir. Il faut en retrouver les éclats, la défendre pendant qu’elle sonne et terminer les Halls Engloutis.':
    'Orsik the Bellringer, a spirit of Khaz-Ombral: every year, on the eve of the Great Closing, he wants to ring his bell to say goodbye. Find its shards, defend it while it rings and complete the Sunken Halls.',
  'Tu l’as entendue ? Un peu fausse, comme toujours. Merci. Je la sonnerai encore l’an prochain : on ne dit jamais assez au revoir.':
    'Did you hear it? A little off-key, as always. Thank you. I’ll ring it again next year: you can never say goodbye enough.',
  'Sœur Runa, de la Crypte des Mille Tombes : le Fossoyeur Éternel recommence à creuser des tombes en trop. Il faut reprendre les clés d’os aux chevaliers et aux goules, terminer la crypte et décider de ce qu’on fera des clés.':
    'Sister Runa, of the Crypt of a Thousand Tombs: the Eternal Gravedigger is digging extra graves again. Take the bone keys back from the knights and ghouls, complete the crypt and decide what to do with the keys.',
  'Ce sera fait comme tu l’as dit. Le Fossoyeur ne se lasse jamais, mais moi non plus. Prends ceci dans le tronc des offrandes.':
    'It will be done as you said. The Gravedigger never tires, but neither do I. Take this from the offering box.',
  'Girolle, myconide polie des Tréfonds Fongiques : une nouvelle reine a grandi, et les limaces ont encore pondu dans ses rêves. Il faut chasser les limaces et les mille-pattes, détruire les pontes et terminer les Tréfonds Fongiques.':
    'Girolle, a polite myconid of the Fungal Depths: a new queen has grown, and the slugs have laid eggs in her dreams again. Drive off the slugs and centipedes, destroy the eggs and complete the Fungal Depths.',
  'Reine dé-réveillée ! Nouvelle reine petite-petite danse mal. C’est très beau. Les limaces reviendront, toujours. Cadeau !':
    'Queen un-woken! New queen tiny-tiny dances badly. It is very beautiful. Slugs come back, always. Gift!',
  'Grand-père Nog, de Durgrim : la taupe au sourire doré lui a encore volé son dentier en or. Il faut la rattraper et lui trouver des asticots, pour qu’elle rende les dents de bon cœur.':
    'Grandpa Nog, of Durgrim: the golden-grinned mole has stolen his gold dentures again. Catch it and find it some maggots, so it gives the teeth back gladly.',
  'Clac. Ah. Beaucoup mieux. Elle les a nettoyées, la brave bête. Elle reviendra les emprunter, elle aime bien briller.':
    'Clack. Ah. Much better. She cleaned them, the good beast. She’ll come back to borrow them, she likes to shine.',
  'Bolet, myconide coureur, organise la course des spores à chaque saison. Il cherche un concurrent : une course entre les fanions, des spores fugueuses à rattraper, puis la revanche.':
    'Bolet, a racing myconid, holds the spore race every season. He’s looking for a contestant: a race between the pennants, runaway spores to catch, then the rematch.',
  'Premier ! Bolet encore deuxième ! Mais deuxième derrière un pas-mousse, c’est une première. Revanche bientôt !':
    'First! Bolet second again! But second behind a not-moss, that’s a first. Rematch soon!',
  'Une petite lumière tombe près du camp. Le vieil Orven sait ce qu’elle est : une étincelle du Cœur de l’Aurore, et le début de la quête des six étoiles.':
    'A small light falls near the camp. Old Orven knows what it is: a spark of the Heart of the Dawn, and the start of the quest for the six stars.',
  'Première étoile : la Forêt ancienne. L’arbre gardien l’a recueillie, mais une femme voilée paie des gobelins pour le saigner.':
    'First star: the Ancient Forest. The guardian tree took it in, but a veiled woman pays goblins to bleed it.',
  'Deuxième étoile : le marais. Les lanternes éteintes cachent le chemin du Sanctuaire des Reflets, et ses miroirs savent qui est Vesper.':
    'Second star: the marsh. The dark lanterns hide the path to the Sanctuary of Reflections, and its mirrors know who Vesper is.',
  'Troisième étoile : la Forêt automnale. Un village oublié la garde, et les archives des saisons disent pourquoi le Cœur s’est endormi.':
    'Third star: the Autumn Forest. A forgotten village guards it, and the archives of the seasons tell why the Heart fell asleep.',
  'Quatrième et cinquième étoiles : le désert. Sous le sable, une machine des anciens sait comment réveiller le Cœur.':
    'Fourth and fifth stars: the desert. Beneath the sand, a machine of the ancients knows how to wake the Heart.',
  'Les étoiles réunies, Lumi mène au sanctuaire central. Le Cœur peut se réveiller… si Vesper ne l’éteint pas avant.':
    'With the stars gathered, Lumi leads the way to the central sanctuary. The Heart can wake… unless Vesper puts it out first.',
  'Autrefois, le Cœur de l’Aurore protégeait l’île. Pour le sauver d’une Ombre venue de la mer, les anciens l’ont endormi et ont caché ses six étoiles dans six sanctuaires. Des siècles plus tard, une petite lumière tombe près du Camp de l’Aurore. Ton but : retrouver les six étoiles et réveiller le Cœur, avant qu’une femme voilée, Vesper, ne les éteigne.':
    'Long ago, the Heart of the Dawn protected the island. To save it from a Shadow that came from the sea, the ancients put it to sleep and hid its six stars in six sanctuaries. Centuries later, a small light falls near the Dawn Camp. Your goal: find the six stars and wake the Heart, before a veiled woman, Vesper, puts them out.',

  // ------------------------------------------------------------ Guilde des Aventuriers (guild.js, shared/data/guild.js)
  'Guilde des Aventuriers de l’Aurore': 'Adventurers’ Guild of the Dawn',
  'Maîtresse Ysolde': 'Guildmistress Ysolde',
  'Maison de la Guilde': 'Guild Hall',
  'GUILDE': 'GUILD',
  'Tableau des contrats': 'Contract board',
  'Bannière de la guilde': 'Guild banner',
  'Guilde': 'Guild',
  'Recrue': 'Recruit',
  'Aventurier': 'Adventurer',
  'Explorateur': 'Explorer',
  'Vétéran': 'Veteran',
  'Simples': 'Simple',
  'Standards': 'Standard',
  'Plus variés': 'More varied',
  'Difficiles': 'Hard',
  'Exceptionnels': 'Exceptional',
  'Prestigieux': 'Prestigious',
  'Contrats {genre}': '{genre} contracts',
  'simples': 'Simple',
  'standards': 'Standard',
  'plus variés': 'More varied',
  'élites': 'Elite',
  'difficiles': 'Hard',
  'exceptionnels': 'Exceptional',
  'prestigieux': 'Prestigious',
  'Rang de guilde {rang}': 'Guild rank {rang}',
  'Prochain rang : {rang}': 'Next rank: {rang}',
  '{n} contrats remplis': '{n} contracts fulfilled',
  'Renommée {n} / {max}': 'Renown {n} / {max}',
  'Renommée {n}': 'Renown {n}',
  'Rang le plus haut : ton nom est gravé au mur de la guilde.':
    'Highest rank: your name is carved on the guild wall.',
  '{nom} affiche trois contrats de ton rang dans la maison de guilde du Camp de l’Aurore. Ils changent tous les quarts d’heure.':
    '{nom} posts three contracts of your rank in the Guild Hall of the Dawn Camp. They change every quarter of an hour.',
  'Contrat en cours': 'Current contract',
  'Rendre le contrat': 'Hand in the contract',
  'Va voir {nom} pour rendre ce contrat.': 'Go see {nom} to hand in this contract.',
  'Confirmer l’abandon': 'Confirm abandoning',
  'Abandonner': 'Abandon',
  'En cours': 'In progress',
  'Déjà pris sur ce tableau': 'Already taken from this board',
  'Un seul contrat à la fois': 'One contract at a time',
  'Prendre le contrat': 'Take the contract',
  'Le tableau se remplit… reviens dans un instant.': 'The board is filling up… come back in a moment.',
  'Beau travail. Les nouvelles vont vite, ici : tout le camp parle déjà de toi.':
    'Fine work. News travels fast here: the whole camp is already talking about you.',
  'Un contrat à la fois, c’est la règle de la maison. Termine celui-ci, ou rends-le-moi si c’est trop.':
    'One contract at a time, that’s the house rule. Finish this one, or give it back to me if it’s too much.',
  'Te revoilà ! Le tableau a de quoi t’occuper. Choisis bien : la renommée se gagne contrat après contrat.':
    'You’re back! The board has plenty to keep you busy. Choose well: renown is earned one contract at a time.',
  'Bienvenue à la guilde. Ici, les habitants de l’île déposent leurs demandes, et nous les confions à ceux qui en sont capables. Commence par un contrat simple : tout le monde débute au rang F.':
    'Welcome to the guild. The island’s folk leave their requests here, and we entrust them to those who can handle them. Start with a simple contract: everyone begins at rank F.',
  'nouveaux contrats dans {temps}': 'new contracts in {temps}',
  'Rangs de la guilde': 'Guild ranks',
  'Bienvenue à la guilde !': 'Welcome to the guild!',
  'Contrat accepté : {quete}': 'Contract accepted: {quete}',
  'Contrat abandonné : {quete}': 'Contract abandoned: {quete}',
  'Contrat rempli : {quete}': 'Contract fulfilled: {quete}',
  '+{n} renommée': '+{n} renown',
  'Nouveau rang de guilde : {rang}': 'New guild rank: {rang}',
  '{nom}, à la guilde': '{nom}, at the guild',
  'équipement {qualite}': '{qualite} gear',
  'la première fois : {texte}': 'the first time: {texte}',
  'Bonjour, voyageur. J’ai déposé une demande à la guilde du Camp de l’Aurore.':
    'Hello, traveler. I’ve left a request at the guild in the Dawn Camp.',
  'Demande affichée parfois au tableau de la guilde (rang {rang}).':
    'This request sometimes appears on the guild board (rank {rang}).',
  'Contrat de rang {rang}': 'Rank {rang} contract',
  'Avis de la guilde': 'Guild notice',
  'Récompense de la guilde': 'Guild reward',
  'Aucun contrat en cours. Le tableau de la guilde, au Camp de l’Aurore, en propose trois nouveaux tous les quarts d’heure.':
    'No contract in progress. The guild board in the Dawn Camp offers three new ones every quarter of an hour.',
  'Choisir un contrat au tableau de la guilde': 'Pick a contract from the guild board',
  'Nouveau contrat': 'New contract',
  'Partout sur l’île': 'Anywhere on the island',
  'Créature vaincue': 'Creature defeated',
  'Élite vaincue': 'Elite defeated',
  'Boss mondial vaincu': 'World boss defeated',
  // Avis de la guilde
  'Des bêtes trop près des routes': 'Beasts too close to the roads',
  'Les marchands se plaignent : les bêtes sauvages s’approchent des chemins. La guilde paie pour les éloigner.':
    'The merchants are complaining: wild beasts are coming close to the paths. The guild pays to drive them off.',
  'Vaincre 8 créatures sauvages de ton niveau': 'Defeat 8 wild creatures of your level',
  'Des herbes pour les blessés': 'Herbs for the wounded',
  'Les guérisseurs du camp manquent d’herbes pour leurs onguents. N’importe quelle plante fera l’affaire.':
    'The camp’s healers are short of herbs for their ointments. Any plant will do.',
  'Cueillir 6 herbes sur l’île': 'Gather 6 herbs on the island',
  'Du poisson pour la Marmite': 'Fish for the Marmite',
  'Le cuisinier de la Marmite dorée doit nourrir tout le camp ce soir. Il lui faut du poisson frais.':
    'The cook of the Golden Marmite has to feed the whole camp tonight. He needs fresh fish.',
  'Pêcher 5 poissons, dans n’importe quelle eau': 'Catch 5 fish, in any water',
  'Du minerai pour la forge': 'Ore for the forge',
  'Le forgeron a promis des fers neufs à la ferme et son stock de minerai est vide.':
    'The smith promised the farm new horseshoes and his ore supply is empty.',
  'Miner 6 minerais sur l’île': 'Mine 6 ores on the island',
  'Trophées pour le tanneur': 'Trophies for the tanner',
  'Le tanneur du camp achète crocs, cornes et peaux. La guilde lui a promis une livraison.':
    'The camp’s tanner buys fangs, horns and hides. The guild promised him a delivery.',
  'Prendre 6 trophées sur des créatures de ton niveau': 'Take 6 trophies from creatures of your level',
  'Patrouille des chemins': 'Path patrol',
  'Une caravane part demain. La guilde veut des chemins sûrs du camp jusqu’à la prochaine région.':
    'A caravan leaves tomorrow. The guild wants safe paths from the camp to the next region.',
  'Vaincre 14 créatures de ton niveau': 'Defeat 14 creatures of your level',
  'Le banquet des recrues': 'The recruits’ banquet',
  'La guilde fête ses nouvelles recrues. Il faut du poisson, et quelqu’un pour le cuisiner.':
    'The guild is celebrating its new recruits. It needs fish, and someone to cook it.',
  'Pêcher 4 poissons': 'Catch 4 fish',
  'Cuisiner 2 repas (cuisinière, marmite ou cheminée)': 'Cook 2 meals (stove, cauldron or fireplace)',
  'La réserve de l’apothicaire': 'The apothecary’s stock',
  'L’apothicaire prépare des potions pour la saison des tempêtes : des herbes, puis du minerai pour ses fioles.':
    'The apothecary is brewing potions for the storm season: herbs, then ore for his vials.',
  'Cueillir 5 herbes': 'Gather 5 herbs',
  'Miner 4 minerais': 'Mine 4 ores',
  'Crocs et racines': 'Fangs and roots',
  'Un alchimiste de passage cherche des trophées de bêtes et des herbes fraîches pour un remède rare.':
    'A traveling alchemist is looking for beast trophies and fresh herbs for a rare remedy.',
  'Prendre 5 trophées sur des créatures de ton niveau': 'Take 5 trophies from creatures of your level',
  'Cueillir 4 herbes': 'Gather 4 herbs',
  'Les chefs de meute': 'The pack leaders',
  'Des créatures plus grosses que les autres mènent les meutes. Sans elles, les meutes se dispersent.':
    'Creatures bigger than the rest lead the packs. Without them, the packs scatter.',
  'Vaincre 2 élites de ton niveau': 'Defeat 2 elites of your level',
  'Prime sur les élites': 'Bounty on elites',
  'La guilde affiche une prime : chaque élite abattue rend les routes plus sûres pour tout le monde.':
    'The guild posts a bounty: every elite slain makes the roads safer for everyone.',
  'Vaincre 4 élites de ton niveau': 'Defeat 4 elites of your level',
  'Un donjon à nettoyer': 'A dungeon to clear',
  'Des monstres sortent d’un donjon la nuit. La guilde veut qu’on aille jusqu’à son dernier boss.':
    'Monsters come out of a dungeon at night. The guild wants someone to reach its last boss.',
  'Terminer un donjon à ta mesure (coffre du dernier boss)':
    'Complete a dungeon of your level (last boss’s chest)',
  'Élites et trophées': 'Elites and trophies',
  'Un collectionneur paie très cher les trophées pris sur des élites. La guilde prend sa part, toi la tienne.':
    'A collector pays a fortune for trophies taken from elites. The guild takes its share, you take yours.',
  'Vaincre 3 élites de ton niveau': 'Defeat 3 elites of your level',
  'Prendre 4 trophées sur des créatures de ton niveau': 'Take 4 trophies from creatures of your level',
  'Un colosse sur l’île': 'A colossus on the island',
  'Un boss mondial terrorise sa région. La guilde n’envoie que ses meilleurs, et tu en fais partie.':
    'A world boss terrorizes its region. The guild only sends its best, and you are one of them.',
  'Vaincre un boss mondial': 'Defeat a world boss',
  'Expédition double': 'Double expedition',
  'Deux donjons se sont réveillés en même temps. La guilde manque de bras : elle te confie les deux.':
    'Two dungeons have woken at once. The guild is short-handed: it entrusts both to you.',
  'Terminer 2 donjons à ta mesure': 'Complete 2 dungeons of your level',
  'La grande battue': 'The great hunt',
  'Les bêtes sont trop nombreuses cette saison. La guilde organise une battue et compte sur toi.':
    'There are too many beasts this season. The guild is organizing a hunt and counts on you.',
  'Vaincre 20 créatures de ton niveau': 'Defeat 20 creatures of your level',
  'L’assaut du raid': 'The raid assault',
  'Un raid entier menace l’île. La guilde réunit ses héros : terminer le raid, et revenir vivant.':
    'A whole raid threatens the island. The guild gathers its heroes: complete the raid, and come back alive.',
  'Terminer un raid': 'Complete a raid',
  'Sous nos pieds': 'Beneath our feet',
  'Les nains de Durgrim demandent de l’aide : un donjon des Tréfonds déborde de monstres.':
    'The dwarves of Durgrim ask for help: a dungeon of the Depths is overflowing with monsters.',
  'Terminer un donjon des Tréfonds': 'Complete a dungeon of the Depths',
  'Vaincre 3 élites de ton niveau, à la surface': 'Defeat 3 elites of your level, on the surface',
  'Deux colosses': 'Two colossi',
  'Deux boss mondiaux ont été aperçus. La guilde veut qu’ils tombent avant la fin de la saison.':
    'Two world bosses have been sighted. The guild wants them to fall before the season ends.',
  'Vaincre 2 boss mondiaux': 'Defeat 2 world bosses',
  'La gloire de l’Aurore': 'The glory of the Dawn',
  'Le conseil de la guilde veut une victoire dont on parlera longtemps : un raid, puis un colosse.':
    'The guild council wants a victory people will talk about for years: a raid, then a colossus.',
  'La tournée des donjons': 'The dungeon tour',
  'Trois donjons, trois boss, une seule légende. Les bardes du camp attendent ton retour.':
    'Three dungeons, three bosses, a single legend. The camp’s bards await your return.',
  'Terminer 3 donjons à ta mesure': 'Complete 3 dungeons of your level',
  'Le festin des Légendes': 'The Legends’ feast',
  'Une fois par saison, la guilde offre un festin à toute l’île. Il faut tout : la pêche, la cuisine et le gibier.':
    'Once a season, the guild throws a feast for the whole island. It needs everything: fish, cooking and game.',
  'Pêcher 8 poissons': 'Catch 8 fish',
  'Cuisiner 4 repas': 'Cook 4 meals',
  'Vaincre 3 élites pour le gibier du festin': 'Defeat 3 elites for the feast’s game',
  'La chasse légendaire': 'The legendary hunt',
  'Les plus grands chasseurs de l’île ont laissé leur nom sur le mur de la guilde. Le tien y a sa place.':
    'The island’s greatest hunters left their names on the guild wall. Yours belongs there.',
  'Vaincre 6 élites de ton niveau': 'Defeat 6 elites of your level',

  // ------------------------------------------------------------ Compléments vus à l'écran (butin, chapitres, bannières)
  'BUTIN {qualite} !': '{qualite} LOOT!',
  'Butin : {qualite}': 'Loot: {qualite}',
  'niveau {n}': 'level {n}',
  'Chapitre I': 'Chapter I',
  'Chapitre II': 'Chapter II',
  'Chapitre III': 'Chapter III',
  'Chapitre IV': 'Chapter IV',
  'Chapitre V': 'Chapter V',
  'Chapitre VI': 'Chapter VI',
  '{zone}, niveaux {n} à {m}': '{zone}, levels {n} to {m}',
  "Plaines d'Aube": 'Dawn Plains',
  '{n} × {nom}': '{n} × {nom}',
  'VAGUE {n} / {m}': 'WAVE {n} / {m}',
  // ------------------------------------------------------------ Compléments : métiers
  'métier|Enchantement': 'Enchanting',
  'niv. {n}': 'lv. {n}',
  // ------------------------------------------------------------ Aventure : gardiens de l’Ombre, grand troc, coquillages chantants
  'Vaincre Ronce-Moussue, l’écho des ruines (E sur le sceau)':
    'Defeat Mossbramble, the echo of the ruins (E on the seal)',
  'Vaincre Sylvenoir, l’écho de la forêt (E sur le sceau)':
    'Defeat Sylvanoir, the echo of the forest (E on the seal)',
  'Vaincre Miroitombe, l’écho des reflets (E sur le sceau)':
    'Defeat Mirrortomb, the echo of reflections (E on the seal)',
  'Vaincre Fanegrise, l’écho de l’automne (E sur le sceau)':
    'Defeat Greywither, the echo of autumn (E on the seal)',
  'Vaincre Sablamort, l’écho des dunes (E sur le sceau)':
    'Defeat Dunebane, the echo of the dunes (E on the seal)',
  'Vaincre l’Ombre, le cœur des échos (E sur le sceau)':
    'Defeat the Shadow, heart of the echoes (E on the seal)',
  'Ronce-Moussue': 'Mossbramble',
  'Sylvenoir': 'Sylvanoir',
  'Miroitombe': 'Mirrortomb',
  'Fanegrise': 'Greywither',
  'Sablamort': 'Dunebane',
  'L’Ombre': 'The Shadow',
  'l’écho des ruines': 'the echo of the ruins',
  'l’écho de la forêt': 'the echo of the forest',
  'l’écho des reflets': 'the echo of reflections',
  'l’écho de l’automne': 'the echo of autumn',
  'l’écho des dunes': 'the echo of the dunes',
  'le cœur des échos': 'heart of the echoes',
  'Ronce-Moussue, l’écho des ruines': 'Mossbramble, the echo of the ruins',
  'Sylvenoir, l’écho de la forêt': 'Sylvanoir, the echo of the forest',
  'Miroitombe, l’écho des reflets': 'Mirrortomb, the echo of reflections',
  'Fanegrise, l’écho de l’automne': 'Greywither, the echo of autumn',
  'Sablamort, l’écho des dunes': 'Dunebane, the echo of the dunes',
  'L’Ombre, le cœur des échos': 'The Shadow, heart of the echoes',
  'Les pierres tremblent… Une masse de mousse et de ronces se lève des ruines !':
    'The stones tremble… A mass of moss and brambles rises from the ruins!',
  'Ronce-Moussue s’effrite en pétales. Une douce chaleur reste dans l’air.':
    'Mossbramble crumbles into petals. A gentle warmth lingers in the air.',
  'L’ombre de l’arbre gardien se décolle du sol et prend vie !':
    'The guardian tree’s shadow peels off the ground and comes to life!',
  'Sylvenoir se dissout dans les racines d’or. L’arbre gardien soupire de soulagement.':
    'Sylvanoir melts into the golden roots. The guardian tree sighs with relief.',
  'Un reflet sort du dernier miroir… et il ne te ressemble pas du tout !':
    'A reflection steps out of the last mirror… and it looks nothing like you!',
  'Miroitombe éclate en mille éclats de lumière, qui retournent sagement dans les miroirs.':
    'Mirrortomb shatters into a thousand shards of light, which quietly return to the mirrors.',
  'Les feuilles mortes tourbillonnent et forment une silhouette immense !':
    'The dead leaves swirl into a towering silhouette!',
  'Fanegrise retombe en une pluie de feuilles dorées. Le vent sent bon la cannelle.':
    'Greywither falls apart in a rain of golden leaves. The wind smells of cinnamon.',
  'Le sable s’ouvre sous la machine : une carapace géante en surgit !':
    'The sand splits open beneath the machine: a giant carapace bursts out!',
  'Sablamort s’enfonce dans le sable pour toujours. Les anneaux de la machine brillent plus fort.':
    'Dunebane sinks into the sand forever. The machine’s rings shine brighter.',
  'Toute la lumière de la chambre vacille. L’Ombre elle-même vient reprendre le Cœur !':
    'All the light in the chamber flickers. The Shadow itself has come to take back the Heart!',
  'L’Ombre se déchire comme un rideau de nuit. Derrière elle, l’aube se lève.':
    'The Shadow tears like a curtain of night. Behind it, dawn is breaking.',
  '{nom} appelle des renforts !': '{nom} calls for reinforcements!',
  '{nom} disparaît !': '{nom} vanishes!',
  '{nom} entre en rage !': '{nom} flies into a rage!',
  'Coup de l’Ombre !': 'Shadow strike!',
  'Pluie d’éclats !': 'Shard rain!',
  'Onde de l’Ombre !': 'Shadow wave!',
  'Cœur d’Aurore : PV max +3 % ({n} / {m})': 'Heart of Dawn: max HP +3% ({n} / {m})',
  '{nom} retourne dans l’ombre…': '{nom} returns to the shadows…',
  'Le sceau attend ton retour.': 'The seal awaits your return.',
  'Briser le sceau de l’Ombre': 'Break the Shadow seal',
  'Ramasser le coquillage': 'Pick up the shell',
  'Tu as obtenu': 'You got',
  'Cœur d’Aurore': 'Heart of Dawn',
  'Cœurs d’Aurore': 'Hearts of Dawn',
  'PV max +3 % ({n} / {m})': 'Max HP +3% ({n} / {m})',
  'Étoile du Cœur': 'Star of the Heart',
  'Une petite lumière tombée du ciel devient ta compagne de voyage.':
    'A little light fallen from the sky becomes your travel companion.',
  'Un Cœur d’Aurore (+3 % de PV max)': 'A Heart of Dawn (+3% max HP)',
  'Équipement Légendaire de ton niveau': 'Legendary gear of your level',
  'Trésors': 'Treasures',
  'Madame Nacre': 'Madam Nacre',
  'Coquillage chantant': 'Singing shell',
  'Coquillages chantants': 'Singing shells',
  'Coquillage chantant ! ({n} / {m})': 'Singing shell! ({n} / {m})',
  'Coquillages chantants : {n} / {m}': 'Singing shells: {n} / {m}',
  'Madame Nacre, au Camp de l’Aurore, aimerait voir ta collection.':
    'Madam Nacre, at Dawn Camp, would love to see your collection.',
  'Madame Nacre, au Camp de l’Aurore, les collectionne.': 'Madam Nacre, at Dawn Camp, collects them.',
  'Palier de {n} coquillages': '{n}-shell milestone',
  '{n} coquillages': '{n} shells',
  'La Loupe d’Orven entend un coquillage': 'Orven’s Loupe hears a shell',
  'près de {noms}': 'near {noms}',
  'Quand le Cœur de l’Aurore s’est brisé, son chant s’est caché dans des coquillages, partout sur l’île. Pose-les contre ton oreille : ils fredonnent encore.':
    'When the Heart of Dawn shattered, its song hid inside shells all over the island. Hold one to your ear: they still hum.',
  'Oh ! Ils chantent si fort, tes coquillages ! Montre-les-moi, j’ai quelque chose pour toi.':
    'Oh! Your shells are singing so loudly! Show them to me, I have something for you.',
  'Écoute-les… chacun fredonne un petit bout de la vieille chanson. Il en reste d’autres, j’en suis sûre.':
    'Listen… each one hums a little piece of the old song. There are more out there, I’m sure of it.',
  'Bonjour, voyageur ! Tu n’aurais pas entendu un coquillage chanter, par hasard ?':
    'Hello, traveler! You wouldn’t have heard a shell singing, by any chance?',
  'Chaque lieu de quête cache un coquillage, un peu à l’écart. De près, ils scintillent.':
    'Every quest site hides a shell, a little off to the side. Up close, they sparkle.',
  'Chaque lieu de quête en cache un, un peu à l’écart. Madame Nacre, au Camp de l’Aurore, récompense les collectionneurs.':
    'Every quest site hides one, a little off to the side. Madam Nacre, at Dawn Camp, rewards collectors.',
  'Montrer mes coquillages': 'Show my shells',
  'Tu tiens : {objet}': 'You’re holding: {objet}',
  'Donner : {objet}': 'Give: {objet}',
  'Prendre : {objet}': 'Take: {objet}',
  'Le grand troc': 'The great trade',
  'Grand troc terminé': 'Great trade complete',
  'Les habitants de l’île aiment échanger. Milo, le berger des Plaines verdoyantes, a toujours de la laine en trop…':
    'The islanders love to trade. Milo, the shepherd of the Verdant Plains, always has wool to spare…',
  'La Loupe d’Orven fait briller les coquillages chantants de loin.':
    'Orven’s Loupe makes singing shells shine from afar.',
  'Pelote de laine': 'Ball of wool',
  'Vieille botte': 'Old boot',
  'Pot de miel': 'Honey pot',
  'Flûte de roseau': 'Reed flute',
  'Grenouille porte-bonheur': 'Lucky frog',
  'Lanterne de poche': 'Pocket lantern',
  'Sac de farine fine': 'Bag of fine flour',
  'Girouette en cuivre': 'Copper weathervane',
  'Bouteille de brise fraîche': 'Bottle of cool breeze',
  'Dattes dorées': 'Golden dates',
  'Écaille de Braise': 'Ember’s scale',
  'Lentille d’étoile': 'Star lens',
  'Loupe d’Orven': 'Orven’s Loupe',
  'Tu vois cette pelote ? Pompon perd sa laine partout depuis qu’il se prend pour un aventurier. Prends-la, moi j’en ai des sacs entiers !':
    'See this ball of wool? Pompom sheds everywhere since he decided he’s an adventurer. Take it, I have whole sacks of the stuff!',
  'Une pelote toute douce, tricotée par le vent et par Pompon.':
    'A soft little ball, knitted by the wind and by Pompom.',
  'Un vieux pêcheur, près d’un étang des Plaines verdoyantes, se plaint que ses lignes cassent.':
    'An old fisherman by a pond in the Verdant Plains complains that his lines keep snapping.',
  'De la laine de mouton ? Parfaite pour mes mouches de pêche ! En échange… j’ai pêché ça ce matin. Quarante ans de métier, et je sors une botte.':
    'Sheep’s wool? Perfect for my fishing flies! In exchange… I caught this this morning. Forty years on the job, and I reel in a boot.',
  'Une botte trempée. Un petit poisson y habitait encore.':
    'A soaking boot. A little fish was still living in it.',
  'Brin, dans la Forêt ancienne, répète qu’il a froid aux sabots la nuit.':
    'Brin, in the Ancient Forest, keeps saying his hooves get cold at night.',
  'Une botte ! Une seule, mais quelle botte ! Mon sabot gauche te remercie. Prends ce miel : le petit voleur m’en apporte tous les matins, maintenant.':
    'A boot! Just one, but what a boot! My left hoof thanks you. Take this honey: the little thief brings me some every morning now.',
  'Du miel doré de la forêt. Ça colle partout, même aux pensées.':
    'Golden forest honey. It sticks to everything, even your thoughts.',
  'Sylva, la gardienne des chants de la Forêt ancienne, a la voix toute cassée.':
    'Sylva, keeper of songs in the Ancient Forest, has lost her voice.',
  'Du miel de la forêt… Ma voix ! Elle revient ! La-la-laaa. Prends ma vieille flûte : je n’en ai plus besoin, j’ai retrouvé ma voix.':
    'Forest honey… My voice! It’s coming back! La-la-laaa. Take my old flute: I don’t need it anymore, I have my voice again.',
  'Une flûte taillée dans un roseau. Elle joue faux, mais avec cœur.':
    'A flute carved from a reed. It plays off-key, but with heart.',
  'Au Marais brumeux, le petit Pipo rêve de faire de la musique.':
    'In the Misty Marsh, little Pipo dreams of making music.',
  'Une flûte ! Pour moi ?! Pi-pi-piii ! Tiens, je te donne mon ami Crôa. Il porte bonheur… sauf aux moustiques.':
    'A flute! For me?! Pee-pee-peee! Here, you can have my friend Croak. He brings luck… except to mosquitoes.',
  'Crôa, une grenouille verte qui adore les moustiques. Elle te regarde avec confiance.':
    'Croak, a green frog who loves mosquitoes. He looks at you trustingly.',
  'Goran se fait dévorer par les moustiques sur son pont, au Marais brumeux.':
    'Goran is being eaten alive by mosquitoes on his bridge in the Misty Marsh.',
  'Une grenouille qui mange les moustiques ? Crôa, tu es engagé ! Prends ma lanterne de poche : avec mon pont, je ne me perds plus dans le noir.':
    'A frog that eats mosquitoes? Croak, you’re hired! Take my pocket lantern: with my bridge, I don’t get lost in the dark anymore.',
  'Une petite lanterne qui ne s’éteint jamais, même sous la pluie du marais.':
    'A little lantern that never goes out, even in the marsh rain.',
  'Odel, le meunier de la Forêt automnale, n’ose plus monter dans son grenier sombre.':
    'Odel, the miller of the Autumn Forest, no longer dares climb into his dark attic.',
  'Une lanterne ! Je vais enfin voir ce qui fait « scrr-scrr » dans mon grenier. Prends ce sac de farine, la plus fine de l’île.':
    'A lantern! At last I’ll see what goes “scritch-scratch” in my attic. Take this bag of flour, the finest on the island.',
  'Une farine si fine qu’elle s’envole quand on la regarde.':
    'Flour so fine it flies away when you look at it.',
  'Flavio, dans la Forêt automnale, veut cuire un gâteau pour le concours des feuilles.':
    'Flavio, in the Autumn Forest, wants to bake a cake for the leaf contest.',
  'De la farine fine ! Mon gâteau va gagner, c’est sûr. Tiens, ma girouette de champion : elle tourne même quand il n’y a pas de vent.':
    'Fine flour! My cake is going to win for sure. Here, my champion’s weathervane: it spins even when there’s no wind.',
  'Une petite girouette en cuivre. Elle tourne toute seule, sans raison.':
    'A little copper weathervane. It spins on its own, for no reason.',
  'Zafir, le marchand du Désert oublié, achète tout ce qui parle du vent.':
    'Zafir, the merchant of the Forgotten Desert, buys anything that has to do with wind.',
  'Une girouette qui tourne sans vent ? C’est… du vent pur ! Marché conclu. Prends cette bouteille de brise fraîche, ma meilleure cuvée.':
    'A weathervane that spins without wind? That’s… pure wind! Deal. Take this bottle of cool breeze, my finest vintage.',
  'Quand on la débouche, une brise de montagne s’en échappe en chantant.':
    'Uncork it, and a mountain breeze escapes, singing.',
  'Amira, à l’oasis du Désert oublié, étouffe sous la chaleur.':
    'Amira, at the oasis of the Forgotten Desert, is stifling in the heat.',
  'Une brise fraîche, en plein désert ! Ahhh… Merci. Prends ces dattes dorées, les plus sucrées de l’oasis.':
    'A cool breeze, in the middle of the desert! Ahhh… Thank you. Take these golden dates, the sweetest in the oasis.',
  'Des dattes qui brillent comme de l’or. Un dragon ferait n’importe quoi pour elles.':
    'Dates that shine like gold. A dragon would do anything for them.',
  'Pyria, dans la Forêt enchantée, dit que son jeune dragon adore le sucre.':
    'Pyria, in the Enchanted Forest, says her young dragon loves sweets.',
  'Des dattes dorées ?! Braise, regarde ! … Il a tout mangé. Il est si content qu’il a perdu une écaille. Prends-la, c’est un cadeau.':
    'Golden dates?! Ember, look! … He ate them all. He’s so happy he shed a scale. Take it, it’s a gift.',
  'Une écaille chaude qui brille comme une braise. Elle ne refroidit jamais.':
    'A warm scale that glows like an ember. It never cools down.',
  'Élya, au lac aux mille étoiles de la Forêt enchantée, taille tout ce qui brille.':
    'Élya, at the lake of a thousand stars in the Enchanted Forest, cuts anything that shines.',
  'Une écaille de dragon… Elle brille comme une étoile. J’en ferai un bijou. Prends cette lentille d’étoile : elle voit ce qui est caché.':
    'A dragon scale… It shines like a star. I’ll make a jewel of it. Take this star lens: it sees what is hidden.',
  'Une lentille taillée dans une étoile tombée. À travers elle, la nuit est claire.':
    'A lens cut from a fallen star. Through it, the night is clear.',
  'Orven, aux Ruines de la Couronne, a toujours rêvé de mieux lire sa carte.':
    'Orven, at the Crown Ruins, has always dreamed of reading his map better.',
  'Une lentille d’étoile ! Avec ça, je lirais les plus petits signes de ma carte… Non, prends plutôt ma vieille loupe, montée avec ta lentille. Elle te servira mieux qu’à moi.':
    'A star lens! With this I could read the tiniest marks on my map… No, take my old loupe instead, fitted with your lens. It will serve you better than me.',
  'Avec elle, les coquillages chantants brillent de loin, et ta boussole les trouve.':
    'With it, singing shells shine from afar, and your compass finds them.',
  'Le grand troc est terminé. La Loupe d’Orven fait briller les coquillages chantants de loin.':
    'The great trade is complete. Orven’s Loupe makes singing shells shine from afar.',
  // Terres des extensions absentes de ce build (fermées, sous la brume) et coopératif entre builds différents.
  'Brumes impénétrables': 'Impenetrable Mists',
  'Une brume épaisse recouvre ces terres. Nul ne sait ce qu’elle cache.':
    'A thick mist covers these lands. No one knows what it hides.',
  'Contenu différent : l’hôte et l’invité doivent avoir les mêmes extensions du jeu.':
    'Different content: the host and the guest must have the same game extensions.',
  // ------------------------------------------------------------ Arène : artéfacts gagnés (scripts/arena.js)
  '{nom} (rang maximum) : +{n} or': '{nom} (maximum rank): +{n} gold',
  'Artéfact obtenu : {nom} !': 'Artifact obtained: {nom}!',
  '{nom} passe au rang {n} !': '{nom} reaches rank {n}!',
  '{nom} est vaincu ! Son artéfact pour chaque héros de l’arène.':
    '{nom} is defeated! Its artifact for every hero in the arena.',
  'Tentative terminée : {n} vague(s) réussie(s), {m} artéfact(s) gagné(s).':
    'Attempt over: {n} wave(s) cleared, {m} artifact(s) won.',
  '[E] au portail de l’antichambre pour quitter avec tes artéfacts':
    '[E] at the antechamber portal to leave with your artifacts',
  'RANG MAXIMUM': 'MAXIMUM RANK',
  '+{n} OR': '+{n} GOLD',
  'ARTÉFACT OBTENU': 'ARTIFACT OBTAINED',
  'ARTÉFACT': 'ARTIFACT',
  'RANG {n} !': 'RANK {n}!',
  'Rang {n} / {m}': 'Rank {n} / {m}',
  'Artéfacts obtenus': 'Artifacts obtained',
  'Chaque boss vaincu donne son artéfact ; un doublon le fait monter de rang (5 au plus).':
    'Each boss defeated gives its artifact; a duplicate raises its rank (up to 5).',
  'Équipement et artéfacts se préparent avant d’entrer.': 'Gear and artifacts are prepared before entering.',
  'Abandon possible entre les vagues ; la mort met fin à la tentative. Les artéfacts gagnés sont conservés.':
    'You can give up between waves; death ends the attempt. Artifacts won are kept.',
  'Préparer mes artéfacts': 'Prepare my artifacts',
  'Les artéfacts de l’Arène renferment une vieille magie.': 'The Arena’s artifacts hold an old magic.',
  'Les objets portés et les artéfacts restent sur toi.': 'Worn items and artifacts stay on you.',
  'Choisis une pièce d’équipement.': 'Choose a piece of gear.',
  // Succès des artéfacts (scripts/achievements.js).
  'Magie, artéfacts & progression': 'Magic, artifacts & progression',
  'Résilience du Souverain': 'Sovereign’s resilience',
  'Survivre à un coup fatal grâce à la Couronne du Souverain.':
    'Survive a fatal blow thanks to the Sovereign’s Crown.',
  'Premier artéfact': 'First artifact',
  'Équiper ton premier artéfact de l’Arène.': 'Equip your first Arena artifact.',
  'Collectionneur d’artéfacts': 'Artifact collector',
  'Posséder 6 artéfacts différents.': 'Own 6 different artifacts.',
  'Maître des artéfacts': 'Artifact master',
  'Posséder les 12 artéfacts de l’Arène.': 'Own all 12 Arena artifacts.',
  'Le Maître des artéfacts': 'The Artifact Master',
  'Artéfact parfait': 'Perfect artifact',
  'Faire monter un artéfact au rang 5.': 'Raise an artifact to rank 5.',
  'Quatre reliques': 'Four relics',
  'Remplir tes quatre emplacements d’artéfacts.': 'Fill your four artifact slots.',
  'Arsenal du Souverain': 'Sovereign’s arsenal',
  'Faire monter quatre artéfacts au rang 5.': 'Raise four artifacts to rank 5.',
  'Immortalité du Souverain': 'Sovereign’s immortality',
  'Être sauvé par la Couronne du Souverain en plein combat de boss.':
    'Be saved by the Sovereign’s Crown in the middle of a boss fight.',
  'Porter huit pièces enchantées.': 'Wear eight enchanted pieces.',
  'Porter huit pièces Épiques ou mieux.': 'Wear eight Epic or better pieces.',
  'Porter huit pièces Mythiques.': 'Wear eight Mythic pieces.',

  // ------------------------------------------------------------ Montures
  'Monture': 'Mount',
  'Montures': 'Mounts',
  'Ménagerie de l’Aurore': 'Dawn Menagerie',
  'La Ménagerie de l’Aurore — Oriane': 'The Dawn Menagerie — Oriane',
  'Oriane, Ménagerie du Camp de l’Aurore': 'Oriane, Menagerie of the Dawn Camp',
  'Oriane, dresseuse de montures': 'Oriane, mount trainer',
  'Voir les montures': 'See the mounts',
  'Parle à Oriane, à la Ménagerie du Camp de l’Aurore, pour acheter une monture.':
    'Talk to Oriane at the Menagerie of the Dawn Camp to buy a mount.',
  '« Poil, plume, carapace… ou balai : j’ai de quoi faire courir tout Canaan ! Laquelle t’emmène ? » Touche de la monture : {touche}.':
    '“Fur, feather, shell… or broom: I’ve got enough here to keep all of Canaan running! Which one will carry you?” Mount key: {touche}.',
  'Tu n’as pas encore de monture : Oriane en vend, à la Ménagerie du Camp de l’Aurore.':
    'You don’t have a mount yet: Oriane sells them at the Menagerie of the Dawn Camp.',
  'Les montures ne servent que dans le monde ouvert.': 'Mounts can only be used in the open world.',
  'Impossible d’appeler ta monture en plein combat.': 'You can’t call your mount in the middle of a fight.',
  '{nom} : en selle !': '{nom}: in the saddle!',
  'Ta monture repart se reposer.': 'Your mount goes off to rest.',
  'Cette monture est déjà à toi.': 'This mount is already yours.',
  '{nom} rejoint tes montures (touche {touche}).': '{nom} joins your mounts (key {touche}).',
  'MONTURE TROUVÉE : {nom} !': 'MOUNT FOUND: {nom}!',
  'Tu sautes de ta monture pour combattre.': 'You leap off your mount to fight.',
  '✔ Déjà à toi': '✔ Already yours',
  '✔ Monture choisie': '✔ Chosen mount',
  '+{n} % de vitesse': '+{n}% speed',
  'Ton or': 'Your gold',
  'Touche {touche} : appeler ou renvoyer ta monture, dans le monde ouvert et hors combat. On descend de selle en combattant.':
    'Key {touche}: call or dismiss your mount, in the open world and out of combat. You dismount when you fight.',
  '🐾 En selle : {nom}': '🐾 Riding: {nom}',
  'Montures obtenues': 'Mounts collected',
  '{or} or': '{or} gold',
  'Choisir': 'Choose',
  'Appeler ({touche})': 'Summon ({touche})',
  'Renvoyer ({touche})': 'Dismiss ({touche})',
  'Coffres secrets et boss cachés': 'Secret chests and hidden bosses',
  'Poney des Prés': 'Meadow Pony',
  'Court sur pattes, gourmand et têtu : la première monture de bien des aventuriers.':
    'Short-legged, greedy and stubborn: many an adventurer’s first mount.',
  'Sanglier Trotteur': 'Trotting Boar',
  'Il fonce droit devant. Pour tourner, il faut négocier.':
    'It charges straight ahead. Turning is up for negotiation.',
  'Varan des Dunes': 'Dune Monitor',
  'Il court sur le sable brûlant sans jamais s’y enfoncer, et dort au soleil tout le reste du temps.':
    'It runs over burning sand without ever sinking, and sleeps in the sun the rest of the time.',
  'Chameau des Caravanes': 'Caravan Camel',
  'Deux bosses, une place confortable au milieu, et un avis sur tout.':
    'Two humps, a comfy seat in between, and an opinion on everything.',
  'Grand Cerf des Bois': 'Great Woodland Stag',
  'Le roi de la Forêt ancienne accepte parfois un cavalier, s’il sait se taire.':
    'The king of the Ancient Forest sometimes accepts a rider, if they know how to keep quiet.',
  'Rainette du Marais': 'Marsh Tree Frog',
  'Grosse comme un bœuf. Elle ne court pas : elle bondit, et toi avec.':
    'Big as an ox. It doesn’t run: it leaps, and you leap with it.',
  'Loup des Neiges': 'Snow Wolf',
  'Descendu des montagnes un soir de tempête, il n’a plus quitté le camp.':
    'It came down from the mountains one stormy night and never left the camp.',
  'Casoar des Sables': 'Sand Cassowary',
  'Deux pattes infatigables, un casque d’os et un très mauvais caractère.':
    'Two tireless legs, a bone helmet and a truly foul temper.',
  'Tortue Moussue': 'Mossy Tortoise',
  'Un vrai jardin pousse sur sa carapace. Étonnamment rapide, quand on lui promet une salade.':
    'A whole garden grows on its shell. Surprisingly fast when promised a lettuce.',
  'Ours des Cavernes': 'Cave Bear',
  'Chaud, large et moelleux. Ne le réveille pas en hiver.': 'Warm, wide and soft. Don’t wake it in winter.',
  'Scarabée Royal': 'Royal Scarab',
  'Sa carapace change de couleur au soleil ; les anciens rois du Désert en ornaient leurs couronnes.':
    'Its shell shifts colour in the sun; the old Desert kings set it in their crowns.',
  'Tigre des Brumes': 'Mist Tiger',
  'On ne l’entend pas venir. On ne le voit pas partir non plus.':
    'You don’t hear it coming. You don’t see it leave, either.',
  'Tisse-Nuit': 'Nightweaver',
  'Huit pattes, huit yeux et un cœur tendre. Les autres voyageurs te laissent volontiers passer.':
    'Eight legs, eight eyes and a tender heart. Other travellers gladly let you through.',
  'Tapis Volant': 'Flying Carpet',
  'Tissé dans les caravanes du Désert oublié. Merci de t’essuyer les bottes avant de monter.':
    'Woven in the caravans of the Forgotten Desert. Please wipe your boots before boarding.',
  'Balai de Sorcière': 'Witch’s Broom',
  'Il balaie la concurrence. Chapeau pointu non fourni.':
    'It sweeps away the competition. Pointy hat not included.',
  'Renard Boréal': 'Boreal Fox',
  'Ses trois queues dansent comme les aurores de la Forêt enchantée.':
    'Its three tails dance like the auroras of the Enchanted Forest.',
  'Cauchemar de Braise': 'Ember Nightmare',
  'Crins de flammes, sabots de braise : il galope dans les rêves de ceux qui ont vu un raid de trop près.':
    'Mane of flames, hooves of embers: it gallops through the dreams of those who saw a raid too closely.',
  'Drake Écarlate': 'Scarlet Drake',
  'Trop jeune pour t’emporter dans le ciel, assez grand pour croire qu’il vole.':
    'Too young to carry you into the sky, big enough to believe it flies.',
  'Petit Nuage': 'Little Cloud',
  'Un nuage tombé du ciel et resté par amitié. Il pleut un peu quand il est triste.':
    'A cloud that fell from the sky and stayed out of friendship. It rains a little when it’s sad.',
  // ------------------------------------------------------------ Travail du cuir et selles
  'Travail du cuir': 'Leatherworking',
  '⟦prof_leather⟧ Travail du cuir': '⟦prof_leather⟧ Leatherworking',
  'Peau brute': 'Raw hide',
  'Cuir tanné': 'Tanned leather',
  'Cuir': 'Leather',
  'Donnée par le gibier chassé. Le travail du cuir la tanne en cuir (panneau P).':
    'Dropped by hunted game. Leatherworking tans it into leather (panel P).',
  'Pour coudre les selles de monture, au travail du cuir (panneau P).':
    'For stitching mount saddles, in leatherworking (panel P).',
  '🧵 Le travail du cuir se fait à l’établi d’Oriane, à la Ménagerie du Camp de l’Aurore.':
    '🧵 Leatherworking is done at Oriane’s workbench, in the Menagerie of the Dawn Camp.',
  'Travail du cuir niveau {n} requis.': 'Leatherworking level {n} required.',
  'Il faut {n} peaux brutes de cette qualité.': 'You need {n} raw hides of this quality.',
  '🎒 Plus de place parmi les matériaux.': '🎒 No room left among your materials.',
  '{n} cuir(s) tanné(s)': '{n} leather tanned',
  '🧵 Tu as déjà cette selle.': '🧵 You already have this saddle.',
  'Il faut {n} cuirs tannés de cette qualité ou meilleurs.':
    'You need {n} tanned leathers of this quality or better.',
  'Il faut {or} or.': 'You need {or} gold.',
  'Selle {qualite} cousue : +{n} % de vitesse en selle (touche V).':
    '{qualite} saddle stitched: +{n}% speed when riding (key V).',
  '🧵 À l’établi d’Oriane : tu peux travailler.': '🧵 At Oriane’s workbench: you can work.',
  '🏹 Gibier chassé → peau': '🏹 Hunted game → hide',
  'peaux = 1 cuir': 'hides = 1 leather',
  '🐾 Selles : vitesse des montures': '🐾 Saddles: mount speed',
  'Chaque animal chassé donne une peau brute, de qualité selon ton niveau de travail du cuir. Tanne-les en cuir à l’établi d’Oriane, à la Ménagerie du Camp de l’Aurore, puis couds les selles de monture : une par qualité.':
    'Every hunted animal gives a raw hide whose quality follows your leatherworking level. Tan them into leather at Oriane’s workbench, in the Menagerie of the Dawn Camp, then stitch mount saddles: one per quality.',
  'Une selle s’équipe dans l’onglet Montures (touche V) et donne sa vitesse à toutes tes montures. Chaque qualité demande son niveau de métier. Tanner et coudre prennent quelques secondes : reste immobile.':
    'A saddle is equipped in the Mounts tab (key V) and gives its speed to all your mounts. Each quality needs its profession level. Tanning and stitching take a few seconds: stay still.',
  'Tanner les peaux': 'Tan hides',
  'Tanner': 'Tan',
  'Tout tanner': 'Tan all',
  'Aucune peau pour l’instant : chasse le gibier de l’île.': 'No hides yet: hunt the island’s game.',
  'Selles de monture': 'Mount saddles',
  'Peaux : {p} · cuirs : {c}': 'Hides: {p} · leathers: {c}',
  'Selle {qualite}': '{qualite} saddle',
  '{c} / {n} cuirs ({qualite} ou mieux)': '{c} / {n} leathers ({qualite} or better)',
  '✔ Dans ta sellerie': '✔ In your tack room',
  'Coudre': 'Stitch',
  'Selle': 'Saddle',
  'Sans selle': 'No saddle',
  'À coudre au travail du cuir (panneau P)': 'To stitch in leatherworking (panel P)',
  // Suivi : prochaine quête à prendre
  'Nouvelle quête': 'New quest',
  'Suite de l’histoire': 'Story continues',
  'Parler à {nom} pour une nouvelle quête': 'Talk to {nom} for a new quest',
  // Guide du joueur : conseils de Lumi, pastilles, repère du sac (guide.js)
  'Astuce': 'Tip',
  'Compétence {n} · {arme} · {genre}': 'Skill {n} · {arme} · {genre}',
  'invocation': 'summon',
  'offensive': 'offensive',
  'utilitaire': 'utility',
  '{n} dégâts par seconde': '{n} damage per second',
  '{n} dégâts par coup': '{n} damage per hit',
  '{n} dégâts par cible': '{n} damage per target',
  '(avec {n} charge(s))': '(with {n} charge(s))',
  '{n} % de ta Puissance ({m})': '{n}% of your Power ({m})',
  '{n} % de ta Puissance magique ({m})': '{n}% of your magic Power ({m})',
  'Recharge {n} s · {m} PV': 'Cooldown {n} s · {m} HP',
  'Recharge {n} s · Mana {m}': 'Cooldown {n} s · Mana {m}',
  // Textes relevés en jeu, en anglais, restés en français
  'Marchand Lira': 'Merchant Lira',
  'niveau {n} à {m}': 'level {n} to {m}',
  'Arme 1 · active': 'Weapon 1 · active',
  'Arme 2 · réserve': 'Weapon 2 · reserve',
  'réserve': 'reserve',
  'Bienvenue, voyageur !': 'Welcome, traveler!',
  'ESQUIVE !': 'DODGE!',
  '{nom} est à terre.': '{nom} is down.',
  'Tu es à terre… Un allié peut te relever (3 s à côté de toi).':
    'You are down… An ally can revive you (3 s next to you).',
  'Tu es à terre… Tu te relèves dans 10 secondes près de l’hôte.':
    'You are down… You get back up in 10 seconds near the host.',
  'Tu sors.': 'You step out.',
  'Tout le groupe est tombé… Résurrection au camp.': 'The whole group has fallen… Resurrection at camp.',
  'Niveau {n} ! Niveau maximum atteint.': 'Level {n}! Maximum level reached.',
  'Niveau {n} !': 'Level {n}!',
  'Interface réinitialisée': 'Interface reset',
  'Terminer placement': 'Finish placement',
  'Collections (V)': 'Collections (V)',
  'Tu n’as que {n} or.': 'You only have {n} gold.',
  'Libère {n} place(s) dans ton sac : tes armes y seront rangées.':
    'Free {n} slot(s) in your bag: your weapons will be stored there.',
  'Le Grimoire retourne aux ombres. Il reviendra si tu redeviens Invocateur.':
    'The Grimoire returns to the shadows. It will come back if you become a Summoner again.',
  'Ton Grimoire grandit : {nom} !': 'Your Grimoire grows: {nom}!',
  'Ta Grande hache grandit : {nom} !': 'Your Great axe grows: {nom}!',
  '{nom} : ton arme liée, de qualité Relique. Elle grandira avec toi.':
    '{nom}: your bound weapon, of Relic quality. It will grow with you.',
  'ABOMINATION': 'ABOMINATION',
  'Bonus prêt : {nom}': 'Bonus ready: {nom}',
  'Aventure importée': 'Imported adventure',
  'CONCENTRATION +40 %': 'FOCUS +40%',
  'RIPOSTE !': 'RIPOSTE!',
  'ÉLAN : VITESSE +30 %': 'MOMENTUM: SPEED +30%',
  'COMBO !': 'COMBO!',
  'BERSERKER +25 %': 'BERSERKER +25%',
  'PROCHAIN COUP +60 %': 'NEXT HIT +60%',
  'TIR PUISSANT RENFORCÉ': 'EMPOWERED POWER SHOT',
  'SOL CONSACRÉ': 'CONSECRATED GROUND',
  'SERMENT DU GARDIEN': 'GUARDIAN’S OATH',
  'Suivant ▸': 'Next ▸',
  'Compris': 'Got it',
  'Fermer': 'Close',
  '✨ Conseils de Lumi': '✨ Lumi’s tips',
  'Mieux que ce que tu portes': 'Better than what you wear',
  'Bienvenue à Canaan ! Déplace-toi avec {h} {g} {b} {d} (ou les flèches), attaque avec le clic gauche et parle aux habitants avec {e}.':
    'Welcome to Canaan! Move with {h} {g} {b} {d} (or the arrow keys), attack with left click and talk to people with {e}.',
  'L’encadré à droite, sous la mini-carte, te montre toujours où aller : suis sa flèche jusqu’au personnage marqué d’un « ! » doré.':
    'The box on the right, under the minimap, always shows where to go: follow its arrow to the character marked with a golden “!”.',
  'Quête acceptée ! Sa prochaine étape est dans l’encadré à droite. Le journal ({l}) raconte toutes tes quêtes et permet d’en suivre une autre.':
    'Quest accepted! Its next step is in the box on the right. The journal ({l}) tells all your quests and lets you track another one.',
  'Coucou, c’est Lumi ! Je reste avec toi : je vole toujours du côté où tu dois aller, et je te soufflerai des conseils en chemin.':
    'Hi, I’m Lumi! I’m staying with you: I always fly towards where you need to go, and I’ll whisper tips along the way.',
  'Tu as trouvé un équipement meilleur que le tien ! Ouvre ton sac ({i}) et clique dessus pour l’équiper : le ▲ vert marque ce qui est mieux que ce que tu portes.':
    'You found gear better than yours! Open your bag ({i}) and click it to equip it: the green ▲ marks what beats what you wear.',
  'Tu as un talent à choisir ! Ouvre Classe et talents ({t}) : le bouton garde un point doré tant qu’une case est libre.':
    'You have a talent to choose! Open Class and talents ({t}): the button keeps a golden dot while a slot is free.',
  'Ton sac se remplit ({n} / {max}) ! Lira rachète ton butin à l’Échoppe du Camp de l’Aurore (la bourse 💰 sur la carte, {m}). Tu peux aussi démanteler une pièce (clic droit).':
    'Your bag is filling up ({n} / {max})! Lira buys your loot at her stall in Dawn Camp (the 💰 purse on the map, {m}). You can also salvage an item (right click).',
  'Voici l’Échoppe de Lira, la marchande du camp : entre ({e}) pour vendre ton butin, acheter des potions et agrandir ton sac.':
    'Here is Lira’s Stall, the camp merchant: go in ({e}) to sell your loot, buy potions and enlarge your bag.',
  'Un donjon est à ta portée : {nom} (niveau {n}). Son portail est sur la carte ({m}). Le meilleur butin s’y trouve : emmène des compagnons ou des amis !':
    'A dungeon is within reach: {nom} (level {n}). Its portal is on the map ({m}). The best loot is there: bring companions or friends!',

  // ------------------------------------------------------------ Armes de classe, Chasseur, Guerrier, nouveaux talents et artéfacts
  'Vaincre 200 ennemis avec l’arme Arc long.': 'Defeat 200 enemies with the Longbow.',
  'Vaincre 200 ennemis avec l’arme Dagues jumelles.': 'Defeat 200 enemies with the Twin daggers.',
  'Vaincre 200 ennemis avec l’arme Épées jumelles.': 'Defeat 200 enemies with the Twin swords.',
  'Vaincre 200 ennemis avec l’arme Masse et égide.': 'Defeat 200 enemies with the Mace and aegis.',
  'Vaincre 200 ennemis avec l’arme Bâton élémentaire.': 'Defeat 200 enemies with the Elemental staff.',
  'Vaincre 200 ennemis avec l’arme': 'Defeat 200 enemies with the weapon',
  'Vaincre 50 ennemis avec l’arme de chacune des neuf classes.':
    'Defeat 50 enemies with the weapon of each of the nine classes.',
  'Rempart inébranlable': 'Unshakable rampart',
  '⚙️ ONDE DE FER': '⚙️ IRON WAVE',
  'Dégâts subis −': 'Damage taken −',
  'Brume guérisseuse.': 'Healing mist.',
  'Dégâts +25 %.': 'Damage +25%.',
  'Écorce de fer': 'Ironbark',
  'Les ennemis qui te frappent subissent 30 % de leurs dégâts.':
    'Enemies that hit you take 30% of their damage.',
  'Équilibre sauvage': 'Wild balance',
  'Dégâts +10 %.': 'Damage +10%.',
  'Exaltation': 'Exaltation',
  'Compétences à moitié prix, dégâts +15 %.': 'Skills at half cost, damage +15%.',
  'Invulnérable.': 'Invulnerable.',
  'Vitesse +15 %, dégâts +8 %.': 'Speed +15%, damage +8%.',
  'Attaques de base 15 % plus rapides.': 'Basic attacks 15% faster.',
  'Œil du faucon': 'Hawk eye',
  'Dégâts +20 %, critique +10, attaques de base 30 % plus rapides.':
    'Damage +20%, crit +10, basic attacks 30% faster.',
  'Vitesse +30 %, dégâts reçus −20 %.': 'Speed +30%, damage taken −20%.',
  'Dégâts reçus −30 %, dégâts +15 %.': 'Damage taken −30%, damage +15%.',
  'Cri de ralliement': 'Rallying cry',
  'Second souffle': 'Second wind',
  '5 % des PV max rendus chaque seconde.': '5% of max HP restored every second.',
  'Dégâts et soins +': 'Damage and healing +',
  '%, attaques de base': '%, basic attacks',
  '% plus rapides.': '% faster.',
  'Prochaine compétence offensive +40 %, sans Énergie.': 'Next offensive skill +40%, no Energy cost.',
  'Fusion élémentaire': 'Elemental fusion',
  'Prochaine compétence +50 %, sans mana.': 'Next skill +50%, no mana cost.',
  'Rugissement sauvage': 'Savage roar',
  'Attaques de base 30 % plus rapides et +15 % de dégâts.': 'Basic attacks 30% faster and +15% damage.',
  'Exécution croisée renforcée.': 'Cross execution empowered.',
  'Ton prochain coup est renforcé et critique.': 'Your next hit is empowered and critical.',
  'Rempart sacré': 'Holy rampart',
  'Marque du chasseur': 'Hunter’s mark',
  'Ta proie subit plus de dégâts.': 'Your prey takes more damage.',
  'Floraison': 'Bloom',
  'Ta fleur de vie soigne ton groupe.': 'Your flower of life heals your group.',
  'Fauconnier': 'Falconer',
  'Ton faucon chasse à tes côtés.': 'Your falcon hunts at your side.',
  'Ta prochaine flèche fait +60 %.': 'Your next arrow deals +60%.',
  '🌑 ASSASSINAT': '🌑 ASSASSINATION',
  '⚔️ ÉLAN ×5': '⚔️ MOMENTUM ×5',
  '🌈 FUSION +50 %': '🌈 FUSION +50%',
  '🌈 FUSION PRÊTE': '🌈 FUSION READY',
  '🗡️ OMBRE MEURTRIÈRE PRÊTE': '🗡️ MURDEROUS SHADOW READY',
  '❄️ BRISÉ': '❄️ SHATTERED',
  '⚡ FOUDRE CÉLESTE': '⚡ CELESTIAL LIGHTNING',
  '☀️ LUMIÈRE VENGERESSE': '☀️ AVENGING LIGHT',
  '🌿 ÉQUILIBRE SAUVAGE': '🌿 WILD BALANCE',
  '🌿 ÉQUILIBRE SAUVAGE +25 %': '🌿 WILD BALANCE +25%',
  '🦅 ŒIL DU FAUCON': '🦅 HAWK EYE',
  '🛡️ VOLONTÉ DE FER': '🛡️ IRON WILL',
  '🌳 ÉCORCE DE FER': '🌳 IRONBARK',
  '☀️ EXALTATION': '☀️ EXALTATION',
  '💨 Second souffle !': '💨 Second wind!',
  '🐾 Instinct de survie !': '🐾 Survival instinct!',
  '⚔️ PARADE': '⚔️ PARRY',
  '✨ INTERVENTION DIVINE': '✨ DIVINE INTERVENTION',
  '🌸 FLORAISON': '🌸 BLOOM',
  '🐆 RUGISSEMENT': '🐆 ROAR',
  '☀️ CROISADE': '☀️ CRUSADE',
  '🏰 REMPART SACRÉ': '🏰 HOLY RAMPART',
  'PROCHAIN COUP +100 %': 'NEXT HIT +100%',
  'Aucune proie en vue': 'No prey in sight',
  '🎯 PROIE MARQUÉE': '🎯 PREY MARKED',
  '⚔️ COUP DE GRÂCE': '⚔️ COUP DE GRÂCE',
  '🎶 GRAND FINAL': '🎶 GRAND FINALE',
  '🏰 Bouclier': '🏰 Shield',
  'Sans classe : choisis une classe au camp pour recevoir son arme et ses compétences.':
    'No class: choose a class at camp to receive its weapon and skills.',
  '🐆 Forme féline : tes coups critiques font saigner (25 % du coup sur 4 s).':
    '🐆 Cat form: your critical hits cause bleeding (25% of the hit over 4 s).',
  '🐆 Forme féline : tes soins sont réduits de 30 %.': '🐆 Cat form: your healing is reduced by 30%.',
  '🏹 Chasseur : +1 % de dégâts par case de distance (15 % au plus) ; chaque coup rend 5 de Concentration.':
    '🏹 Hunter: +1% damage per tile of distance (up to 15%); each hit restores 5 Focus.',
  '🏹 Chasseur : ta proie subit plus de dégâts de toi et de ton groupe.':
    '🏹 Hunter: your prey takes more damage from you and your group.',
  '⚔️ Guerrier : chaque coup qui touche te donne un Élan (+3 % de dégâts et attaques de base 4 % plus rapides, 5 au maximum).':
    '⚔️ Warrior: each hit that lands grants Momentum (+3% damage and basic attacks 4% faster, up to 5).',
  'Arme de classe ·': 'Class weapon ·',
  'Arme de classe': 'Class weapon',
  '{nom} est l’arme de ta classe : aucune autre arme.': '{nom} is your class weapon: no other weapon.',
  'Ton arme vient de ta classe (T).': 'Your weapon comes from your class (T).',
  '⟦slot_weapon⟧ Arme de classe': '⟦slot_weapon⟧ Class weapon',
  '{nom} : l’arme de ta classe. Elle grandira avec toi.': '{nom}: your class weapon. It will grow with you.',
  'Ton arme grandit : {nom} ({qualite}) !': 'Your weapon grows: {nom} ({qualite})!',
  ' · arme de classe, elle grandit avec toi': ' · class weapon, it grows with you',
  '· arme de classe, elle grandit avec toi': '· class weapon, it grows with you',
  '/9 équipés': '/9 equipped',
  'Elle prend ton niveau et grandit avec toi ; aucune autre arme ne peut s’équiper.':
    'It takes your level and grows with you; no other weapon can be equipped.',
  'Elle prend ton niveau et monte de qualité avec les essences des boss de donjon et de raid.':
    'It takes your level and gains quality with essences from dungeon and raid bosses.',
  'Arme de classe ({classe}) : elle prend ton niveau et grandit avec toi. Impossible à retirer, vendre ou échanger.':
    'Class weapon ({classe}): it takes your level and grows with you. Cannot be removed, sold or traded.',
  'Arme de classe ({classe}) : elle prend ton niveau, et sa qualité monte avec les essences des boss (panneau T). Impossible à retirer, vendre ou échanger.':
    'Class weapon ({classe}): it takes your level, and its quality rises with boss essences (T panel). Cannot be removed, sold or traded.',
  'Chaque classe a désormais sa propre arme : {n} ancienne(s) arme(s) échangée(s) contre {or} or.':
    'Each class now has its own weapon: {n} old weapon(s) exchanged for {or} gold.',
  'Impossible d’améliorer ton arme en combat.': 'You can’t upgrade your weapon in combat.',
  'Il te manque : {liste}.': 'You are missing: {liste}.',
  'Arme Relique : elle grandit avec toi, de Rare au niveau 1 à Légendaire au niveau 60.':
    'Relic weapon: it grows with you, from Rare at level 1 to Legendary at level 60.',
  'Qualité maximale atteinte.': 'Maximum quality reached.',
  'Les boss de donjon donnent des Éclats des profondeurs, ceux des raids des Sceaux des conquérants, et ceux du Jugement de Célestia en héroïque des Fragments d’Aurore.':
    'Dungeon bosses drop Shards of the Depths, raid bosses Conqueror’s Seals, and the Judgement of Celestia bosses in heroic drop Dawn Fragments.',
  'Prochaine qualité : {q} · niveau {lv} · {n} × {essence} · {or} or':
    'Next quality: {q} · level {lv} · {n} × {essence} · {or} gold',
  'Améliorer en {q}': 'Upgrade to {q}',
  'Arme de classe · ': 'Class weapon · ',
  'Griffes du félin': 'Feline claws',
  'Sauvage': 'Wild',
  'Acier': 'Steel',
  'Concentration insuffisante': 'Not enough Focus',
  'Rage insuffisante': 'Not enough Rage',
  '100 points qui se rechargent vite, même en combat ; chaque attaque de base qui touche en rend un peu plus.':
    '100 points that recharge quickly, even in combat; each basic attack that lands restores a bit more.',
  'Part de zéro : monte quand tu frappes et quand tu es frappé ; retombe hors combat.':
    'Starts at zero: rises when you hit and when you are hit; drains out of combat.',
  'Sorts de nature, soins et forme féline au corps à corps': 'Nature spells, healing and a melee cat form',
  'Nature, poison, soins, et une panthère qui déchire ses proies':
    'Nature, poison, healing, and a panther that tears its prey apart',
  'Tes compétences offensives empoisonnent (25 % des dégâts en plus sur 4 s) et soignent ton groupe proche de 5 % des dégâts ; tes compétences utilitaires soignent ton groupe proche de 8 % des PV max. En forme féline, tes coups critiques font saigner (25 % du coup sur 4 s) au lieu de soigner.':
    'Your offensive skills poison (25% extra damage over 4 s) and heal your nearby group for 5% of the damage; your utility skills heal your nearby group for 8% of max HP. In cat form, your critical hits cause bleeding (25% of the hit over 4 s) instead of healing.',
  'Transformation (F pour entrer ou sortir) : tes compétences deviennent celles du félin (Lacération, Bond du prédateur, Rugissement sauvage, Morsure féroce), +15 % de dégâts, +20 % de vitesse, +8 points de critique et attaques de base 20 % plus rapides. En forme féline, tes soins sont réduits de 30 %.':
    'Shapeshift (F to enter or leave): your skills become the cat’s (Laceration, Predator’s leap, Savage roar, Ferocious bite), +15% damage, +20% speed, +8 crit and basic attacks 20% faster. In cat form, your healing is reduced by 30%.',
  'Ronces vivaces': 'Living brambles',
  'Fouet de ronces immobilise les monstres 1,5 s (au lieu de les ralentir) et les fait saigner d’épines : 40 % des dégâts, en plus, sur 4 s.':
    'Bramble lash roots monsters for 1.5 s (instead of slowing them) and makes them bleed thorns: 40% extra damage over 4 s.',
  'Floraison éternelle': 'Eternal bloom',
  'Floraison dure 4 s de plus et soigne 50 % de plus ; en se fanant, elle éclôt une dernière fois : 10 % des PV max aux héros proches.':
    'Bloom lasts 4 s longer and heals 50% more; as it withers, it blossoms one last time: 10% of max HP to nearby heroes.',
  'Spores virulentes': 'Virulent spores',
  'Le nuage de Spores toxiques est 30 % plus grand et ralentit de 40 % ; un ennemi qui y meurt libère un nouveau nuage de 3 s.':
    'The Toxic spores cloud is 30% larger and slows by 40%; an enemy that dies in it releases a new 3 s cloud.',
  'Colère des anciens': 'Wrath of the ancients',
  'Courroux de la forêt lance une quatrième vague de racines et inflige 25 % de dégâts en plus aux ennemis empoisonnés.':
    'Forest’s wrath sends a fourth wave of roots and deals 25% more damage to poisoned enemies.',
  'Instinct du fauve': 'Feral instinct',
  'Changer de forme ne coûte rien et se recharge en 0,5 s ; entrer en forme féline rend ta prochaine compétence féline critique.':
    'Shapeshifting costs nothing and recharges in 0.5 s; entering cat form makes your next cat skill a critical hit.',
  'Griffes sanglantes': 'Bloody claws',
  'Tes saignements de forme féline infligent 40 % de plus ; Morsure féroce consume les saignements de sa cible : 150 % de ce qu’il leur restait à faire, d’un coup.':
    'Your cat form bleeds deal 40% more; Ferocious bite consumes its target’s bleeds: 150% of what they had left to deal, at once.',
  'Cœur du prédateur': 'Predator’s heart',
  'En forme féline, chaque coup critique te soigne de 2 % de tes PV max et réduit d’1 s la recharge du Bond du prédateur. Bond du prédateur fait aussi saigner ses cibles à l’arrivée pour 45 % de ta Puissance par seconde pendant 4 s.':
    'In cat form, each critical hit heals you for 2% of your max HP and reduces Predator’s leap cooldown by 1 s. Predator’s leap also bleeds targets on landing for 45% of your Power per second over 4 s.',
  'Soigner un allié te rend 25 % du soin et lui donne +10 % de dégâts pendant 4 s.':
    'Healing an ally gives you 25% of the heal and grants them +10% damage for 4 s.',
  'Après 3 compétences de nature, entrer en forme féline donne +25 % de dégâts pendant 8 s ; après 3 compétences félines, reprendre forme normale soigne ton groupe proche de 15 % des PV max.':
    'After 3 nature skills, entering cat form grants +25% damage for 8 s; after 3 cat skills, returning to normal form heals your nearby group for 15% of max HP.',
  'Masse et bouclier : défense, protection des alliés et lumière sacrée':
    'Mace and shield: defence, protection of allies and holy light',
  'Le rempart du groupe : boucliers, sols consacrés et jugement':
    'The group’s rampart: shields, consecrated ground and judgement',
  'Chaque compétence offensive te donne un bouclier de 5 % des PV max, chaque compétence utilitaire un bouclier de 10 % à ton groupe proche. Tes soins sur toi-même soignent aussi tes alliés à moins de 6 cases, à 50 %.':
    'Each offensive skill grants you a shield of 5% of max HP, each utility skill a 10% shield to your nearby group. Your self-heals also heal allies within 6 tiles, at 50%.',
  'Croisade': 'Crusade',
  'Toutes les trois Frappes du croisé, tu libères une onde de lumière qui inflige des dégâts sacrés égaux à 200 % de ton Attaque aux ennemis à moins de 3 cases et te rend 6 % de tes PV max au lieu de 3 %.':
    'Every three Crusader strikes, you release a wave of light that deals holy damage equal to 200% of your Attack to enemies within 3 tiles and restores 6% of your max HP instead of 3%.',
  'Bastion': 'Bastion',
  'Rempart sacré dure 2 s de plus ; pendant ce temps, 40 % des dégâts que tu évites sont renvoyés à l’attaquant en lumière sacrée.':
    'Holy rampart lasts 2 s longer; meanwhile, 40% of the damage you avoid is sent back to the attacker as holy light.',
  'Sceau rayonnant': 'Radiant seal',
  'Sentence': 'Sentence',
  'Terre sainte': 'Holy ground',
  'Tes sols consacrés durent 3 s de plus et réduisent de 15 % les dégâts subis par les héros qui s’y tiennent.':
    'Your consecrated ground lasts 3 s longer and reduces damage taken by heroes standing in it by 15%.',
  'Ferveur ardente': 'Burning fervour',
  'Chaque coup reçu te donne 4 Ferveur de plus ; à 100 de Ferveur, tu entres en Exaltation : compétences à moitié prix et +15 % de dégâts pendant 6 s. Recharge : 20 s.':
    'Each hit taken grants 4 more Fervour; at 100 Fervour, you enter Exaltation: skills at half cost and +15% damage for 6 s. Cooldown: 20 s.',
  'Rempart tournoyant': 'Whirling rampart',
  'Rempart sacré fait tournoyer 3 boucliers autour de toi pendant 6 s. Toutes les secondes, les ennemis à moins de 3 cases subissent des dégâts sacrés égaux à 90 % de ta Puissance (540 % sur 6 s).':
    'Holy rampart spins 3 shields around you for 6 s. Each second, enemies within 3 tiles take holy damage equal to 90% of your Power (540% over 6 s).',
  'Martyr': 'Martyr',
  'Tes alliés à moins de 6 cases subissent 20 % de dégâts en moins : tu en encaisses la moitié à leur place.':
    'Your allies within 6 tiles take 20% less damage: you take half of it in their place.',
  'Lumière vengeresse': 'Avenging light',
  'Quand ton bouclier se brise, il explose : 120 % de l’Attaque aux ennemis à moins de 3 cases. Recharge : 6 s.':
    'When your shield breaks, it explodes: 120% of Attack to enemies within 3 tiles. Cooldown: 6 s.',
  'Une fois par combat, un coup fatal te laisse à 1 PV : 3 s d’invulnérabilité, un bouclier de 25 % de tes PV max et 15 % des PV max rendus à ton groupe proche.':
    'Once per combat, a fatal blow leaves you at 1 HP: 3 s of invulnerability, a shield of 25% of your max HP and 15% of max HP restored to your nearby group.',
  'Dagues jumelles : critiques, saignements et mobilité': 'Twin daggers: crits, bleeds and mobility',
  'Critiques, saignements, téléportations et exécution': 'Crits, bleeds, teleports and execution',
  'Tes compétences frappent avec l’ombre : +12 % de dégâts, +30 % de plus pour la compétence 4 contre une cible sous 50 % de PV ; une compétence utilitaire renforce la suivante de 25 %. +5 % de vitesse de déplacement et +10 % de dégâts critiques.':
    'Your skills strike with shadow: +12% damage, +30% more for skill 4 against a target below 50% HP; a utility skill empowers the next one by 25%. +5% movement speed and +10% critical damage.',
  'Venin mortel': 'Deadly venom',
  'Tes saignements infligent 40 % de dégâts en plus et réduisent de 10 % les dégâts de leur cible.':
    'Your bleeds deal 40% more damage and reduce their target’s damage by 10%.',
  'Lames jumelles': 'Twin blades',
  'Assassinat': 'Assassination',
  'Le coup qui suit Pas de l’ombre fait +100 % au lieu de +60 % ; si sa cible meurt dans les 3 s, Pas de l’ombre est aussitôt rechargé.':
    'The hit after Shadow step deals +100% instead of +60%; if its target dies within 3 s, Shadow step is recharged at once.',
  'Tes coups critiques font saigner : 35 % des dégâts du coup sur 4 s.':
    'Your critical hits cause bleeding: 35% of the hit’s damage over 4 s.',
  '+10 points de critique et +20 % de dégâts critiques.': '+10 crit and +20% critical damage.',
  'Après une roulade, tu deviens invisible 1,5 s (comme le Voile d’ombre) et ton prochain coup est critique.':
    'After a dodge roll, you turn invisible for 1.5 s (like Shadow veil) and your next hit is critical.',
  'Un double d’ombre accompagne Entaille et Mille coupures : il répète leurs coups à 40 %.':
    'A shadow double accompanies Gash and Thousand cuts: it repeats their hits at 40%.',
  'Venin paralysant': 'Crippling venom',
  'Entaille et Éventail de lames ralentissent les ennemis touchés de 40 % pendant 3 s. Tu infliges 12 % de dégâts en plus aux ennemis que tu as ralentis.':
    'Gash and Fan of blades slow enemies hit by 40% for 3 s. You deal 12% more damage to enemies you have slowed.',
  'Après 3 coups critiques, ta prochaine compétence offensive fait +40 % et ne coûte pas d’Énergie. Recharge : 12 s.':
    'After 3 critical hits, your next offensive skill deals +40% and costs no Energy. Cooldown: 12 s.',
  'Boule de feu, nova de givre, chaîne d’éclairs et météore':
    'Fireball, frost nova, chain lightning and meteor',
  'Tes sorts sont élémentaires : le feu brûle (30 % des dégâts en plus sur 4 s), la glace ralentit de 30 % pendant 2,5 s, la foudre rebondit sur 2 ennemis proches (35 %).':
    'Your spells are elemental: fire burns (30% extra damage over 4 s), ice slows by 30% for 2.5 s, lightning bounces to 2 nearby enemies (35%).',
  'Combustion': 'Combustion',
  'Météore jumeau': 'Twin meteor',
  'Un second météore tombe 0,6 s après le premier, à côté de lui (60 % des dégâts).':
    'A second meteor falls 0.6 s after the first, next to it (60% of the damage).',
  'Hiver éternel': 'Eternal winter',
  'Nova de givre gèle 2,5 s et laisse un sol de glace 4 s qui ralentit les ennemis de 50 %.':
    'Frost nova freezes for 2.5 s and leaves icy ground for 4 s that slows enemies by 50%.',
  'Éclats de glace': 'Ice shards',
  'Un ennemi gelé ou ralenti par ta glace qui subit du feu ou de la foudre se brise : +50 % de dégâts, et des éclats (60 % de l’Attaque) frappent les ennemis à 2 cases. Une fois par gel.':
    'An enemy frozen or slowed by your ice that takes fire or lightning shatters: +50% damage, and shards (60% of Attack) hit enemies within 2 tiles. Once per freeze.',
  'Conducteur': 'Conductor',
  'Chaîne d’éclairs rebondit 3 fois de plus et garde tous ses dégâts à chaque rebond. Un éclair supplémentaire frappe la première cible pour 150 % de ta Puissance magique en dégâts de foudre.':
    'Chain lightning bounces 3 more times and retains full damage on each bounce. A bonus bolt strikes the first target for 150% of your Spell Power as lightning damage.',
  'Électricité statique': 'Static electricity',
  'Chaque coup de foudre pose une charge statique ; à 5 charges, la cible est frappée par la foudre céleste : 300 % de l’Attaque.':
    'Each lightning hit applies a static charge; at 5 charges, the target is struck by celestial lightning: 300% of Attack.',
  'Un ennemi brûlé qui meurt explose : 80 % de l’Attaque aux ennemis à moins de 3 cases, et sa brûlure se propage à eux.':
    'A burning enemy that dies explodes: 80% of Attack to enemies within 3 tiles, and its burn spreads to them.',
  'Avatar primordial': 'Primordial avatar',
  'Ton Avatar élémentaire dure 4 s de plus ; pendant l’Avatar, chaque compétence libère aussi une décharge des deux autres éléments (60 % de l’Attaque autour de la cible).':
    'Your Elemental avatar lasts 4 s longer; during the Avatar, each skill also releases a discharge of the two other elements (60% of Attack around the target).',
  'Chaque compétence offensive soigne l’allié le plus blessé à moins de 8 cases (toi compris) de 20 % des dégâts infligés ; chaque compétence utilitaire soigne ton groupe proche de 10 % de ses PV max. Tes soins sont augmentés de 10 %.':
    'Each offensive skill heals the most wounded ally within 8 tiles (you included) for 20% of the damage dealt; each utility skill heals your nearby group for 10% of their max HP. Your healing is increased by 10%.',
  'Chaque compétence offensive augmente tes dégâts et tes soins de 4 %, jusqu’à 20 %, pendant 8 secondes.':
    'Each offensive skill increases your damage and healing by 4%, up to 20%, for 8 seconds.',
  'Tes soins sont augmentés de 20 %. Chant de guérison dure 3 s de plus et se termine par une pulsation qui rend 6 % de leurs PV max aux héros du groupe à moins de 6 cases.':
    'Your healing is increased by 20%. Healing song lasts 3 s longer and ends with a pulse that restores 6% of max HP to party members within 6 tiles.',
  'Tes soins donnent à leur cible (toi compris) +15 % de vitesse et +8 % de dégâts pendant 5 s.':
    'Your heals grant their target (you included) +15% speed and +8% damage for 5 s.',
  'Les ennemis touchés par tes compétences offensives subissent 10 % de dégâts en plus, de toi et de ton groupe, pendant 6 s.':
    'Enemies hit by your offensive skills take 10% more damage from you and your group for 6 s.',
  'Ton Écho mélodieux soigne deux alliés au lieu d’un, et rend 25 % des dégâts au lieu de 20 %.':
    'Your Melodic echo heals two allies instead of one, and returns 25% of the damage instead of 20%.',
  'Note éclatante traverse tous les ennemis sur sa ligne, et l’allié le plus blessé récupère 6 % de ses PV max au lieu de 4 %.':
    'Bright note pierces every enemy on its line, and the most wounded ally recovers 6% of max HP instead of 4%.',
  'Tempo': 'Tempo',
  'Chaque fois que tu dépenses 20 de Rythme, les recharges de tes compétences baissent d’1 s.':
    'Every time you spend 20 Rhythm, your skill cooldowns drop by 1 s.',
  'Les soins qui dépassent les PV maximum deviennent un bouclier, jusqu’à 15 % des PV maximum de la cible pendant 6 secondes.':
    'Healing beyond max HP becomes a shield, up to 15% of the target’s max HP for 6 seconds.',
  'Tuer un ennemi réduit de 3 s les recharges de tes compétences, et tes attaques de base sont 15 % plus rapides pendant 5 s.':
    'Killing an enemy reduces your skill cooldowns by 3 s, and your basic attacks are 15% faster for 5 s.',
  'Tes compétences offensives font saigner leurs cibles pour 40 % des dégâts infligés sur 4 s. Hurlement sanguinaire fait aussi saigner les ennemis à moins de 4 cases pour 40 % de ta Puissance par seconde pendant 4 s.':
    'Your offensive skills bleed their targets for 40% of their damage over 4 s. Bloodthirsty roar also bleeds enemies within 4 tiles for 40% of your Power per second over 4 s.',
  'Tu infliges 20 % de dégâts en plus aux ennemis qui saignent ; Châtiment du sang consume leurs saignements (150 % de ce qu’il leur restait à faire).':
    'You deal 20% more damage to bleeding enemies; Blood punishment consumes their bleeds (150% of what they had left to deal).',
  'Chaque fois que tu as dépensé 20 % de tes PV maximum pour tes compétences, ton sang explose : 200 % de l’Attaque aux ennemis à moins de 3 cases.':
    'Every time you have spent 20% of your max HP on skills, your blood explodes: 200% of Attack to enemies within 3 tiles.',
  'Boucherie': 'Butchery',
  'Bond du boucher se recharge aussitôt s’il tue un ennemi, et laisse une mare de sang 4 s (60 % de l’Attaque par seconde aux ennemis dedans).':
    'Butcher’s leap recharges at once if it kills an enemy, and leaves a pool of blood for 4 s (60% of Attack per second to enemies in it).',
  'Tuer un ennemi te soigne de 6 % de tes PV maximum et prolonge ta Rage écarlate de 2 s.':
    'Killing an enemy heals you for 6% of max HP and extends your Scarlet rage by 2 s.',
  'Arc long : tirs perçants, marque de proie et faucon spectral':
    'Longbow: piercing shots, prey mark and spectral falcon',
  'Le tireur d’élite : il frappe de loin, marque sa proie et lâche son faucon':
    'The marksman: strikes from afar, marks his prey and unleashes his falcon',
  'Instinct du traqueur': 'Tracker’s instinct',
  'Plus ta cible est loin, plus tu frappes fort : +1 % de dégâts par case de distance, jusqu’à +15 %. Chaque compétence offensive qui touche te rend 5 de Concentration.':
    'The farther your target, the harder you hit: +1% damage per tile of distance, up to +15%. Each offensive skill that lands restores 5 Focus.',
  'Pendant 10 secondes : +20 % de dégâts, +10 points de critique et attaques de base 30 % plus rapides.':
    'For 10 seconds: +20% damage, +10 crit and basic attacks 30% faster.',
  'Tir de précision': 'Precision shot',
  'Tir perçant fait +40 % contre une cible marquée, et il est toujours critique contre une cible à plus de 8 cases.':
    'Piercing shot deals +40% to a marked target, and is always critical against a target more than 8 tiles away.',
  'Pluie torrentielle': 'Torrential rain',
  'Volée de flèches tire 6 salves au lieu de 4. Chaque salve ralentit les ennemis touchés de 40 %. La dernière salve inflige des dégâts égaux à 200 % de ta Puissance au lieu de 90 %.':
    'Arrow volley fires 6 volleys instead of 4. Each volley slows enemies hit by 40%. The final volley deals damage equal to 200% of your Power, up from 90%.',
  'Proie désignée': 'Designated prey',
  'Ta Marque fait subir 25 % de dégâts en plus au lieu de 15 % ; quand sa cible meurt, la Marque saute sur l’ennemi le plus proche.':
    'Your Mark makes its target take 25% more damage instead of 15%; when its target dies, the Mark jumps to the nearest enemy.',
  'Ta roulade se recharge 30 % plus vite, et la flèche qui la suit (attaque de base ou compétence) fait +60 %.':
    'Your dodge roll recharges 30% faster, and the arrow that follows it (basic attack or skill) deals +60%.',
  'Flèches barbelées': 'Barbed arrows',
  'Tes attaques de base font saigner : 25 % des dégâts du coup sur 4 s.':
    'Your basic attacks cause bleeding: 25% of the hit’s damage over 4 s.',
  'Multitir': 'Multishot',
  'Ton tir lourd décoche 7 flèches au lieu de 5, et ton tir rapide a 25 % de chance de partir en double.':
    'Your heavy shot looses 7 arrows instead of 5, and your quick shot has a 25% chance to fire twice.',
  'Piège de givre': 'Frost trap',
  'Quand un ennemi arrive à moins de 2 cases de toi, un piège de givre le gèle 2 s (un boss est ralenti). Recharge : 15 s.':
    'When an enemy comes within 2 tiles of you, a frost trap freezes it for 2 s (a boss is slowed). Cooldown: 15 s.',
  'Maître de la traque': 'Master of the hunt',
  'Œil du faucon dure 5 s de plus ; pendant l’Œil, chaque ennemi tué réduit toutes tes recharges de 2 s.':
    'Hawk eye lasts 5 s longer; during the Eye, each enemy killed reduces all your cooldowns by 2 s.',
  'Guerrier': 'Warrior',
  'Épées jumelles : combos rapides, tempête d’acier et charges':
    'Twin swords: fast combos, steel storm and charges',
  'Le maître d’armes : il enchaîne les coups et accumule l’Élan':
    'The weapon master: he chains blows and builds Momentum',
  'Chaque coup de tes lames qui touche te donne un Élan (5 au maximum, 4 s, durée renouvelée) : +3 % de dégâts et des attaques de base 4 % plus rapides par Élan.':
    'Each hit of your blades that lands grants Momentum (up to 5, 4 s, duration refreshed): +3% damage and basic attacks 4% faster per Momentum.',
  'Pendant 8 secondes : tu subis 30 % de dégâts en moins et infliges 15 % de dégâts en plus. Tu gagnes aussitôt 30 de Rage.':
    'For 8 seconds: you take 30% less damage and deal 15% more damage. You instantly gain 30 Rage.',
  'Lames affûtées': 'Honed blades',
  'Rafale de lames frappe 6 fois au lieu de 4 et fait saigner : 30 % des dégâts sur 4 s.':
    'Blade flurry strikes 6 times instead of 4 and causes bleeding: 30% of the damage over 4 s.',
  'Œil du cyclone': 'Eye of the cyclone',
  'Tempête d’acier dure 50 % plus longtemps et attire les monstres (pas les boss) vers toi.':
    'Steel storm lasts 50% longer and pulls monsters (not bosses) towards you.',
  'Élan imparable': 'Unstoppable momentum',
  'Charge héroïque étourdit 1,5 s les monstres touchés (un boss est affaibli) et te donne 5 Élans d’un coup.':
    'Heroic charge stuns monsters hit for 1.5 s (a boss is weakened) and grants you 5 Momentum at once.',
  'Coup de grâce': 'Coup de grâce',
  'Exécution croisée réduit sa recharge de 4 s quand elle touche en combo. Si elle tue un ennemi, sa recharge est remise à zéro.':
    'Cross execution reduces its cooldown by 4 s when it lands with the combo active. Killing an enemy resets its cooldown.',
  'Ambidextrie': 'Ambidexterity',
  'Tes attaques de base frappent deux fois : la seconde lame fait 40 % de la première.':
    'Your basic attacks strike twice: the second blade deals 40% of the first.',
  'Fureur martiale': 'Martial fury',
  'À 5 Élans, tes compétences coûtent 30 % de Rage en moins et tes coups critiques font +25 % de dégâts.':
    'At 5 Momentum, your skills cost 30% less Rage and your critical hits deal +25% damage.',
  'Riposte': 'Riposte',
  'Tu as 15 % de chance de parer un coup ennemi (aucun dégât) et de riposter : 150 % de l’Attaque à l’attaquant.':
    'You have a 15% chance to parry an enemy hit (no damage) and riposte: 150% of Attack to the attacker.',
  'Volonté de fer protège aussi tes alliés à moins de 6 cases (15 % de dégâts en moins) et te donne 30 de Rage de plus.':
    'Iron will also protects your allies within 6 tiles (15% less damage) and grants you 30 more Rage.',
  'Seigneur de guerre': 'Warlord',
  'Bâton sylvestre': 'Sylvan staff',
  'Nature : lianes, spores, fleur de vie et racines géantes.':
    'Nature: vines, spores, flower of life and giant roots.',
  'Fouet de ronces': 'Bramble lash',
  'Spores toxiques': 'Toxic spores',
  'Courroux de la forêt': 'Forest’s wrath',
  'Forme féline : griffures, bonds et morsures qui font saigner.':
    'Cat form: scratches, leaps and bites that cause bleeding.',
  'Lacération': 'Laceration',
  'Bond du prédateur': 'Predator’s leap',
  'Morsure féroce': 'Ferocious bite',
  'Masse et égide': 'Mace and aegis',
  'Masse sacrée et bouclier : frappes qui soignent, sceau de lumière, rempart et marteau du jugement.':
    'Holy mace and shield: healing strikes, seal of light, rampart and hammer of judgement.',
  'Frappe du croisé': 'Crusader strike',
  'Sceau de lumière': 'Seal of light',
  'Aucune cible à portée': 'No target in range',
  'En combat': 'In combat',
  'Hors combat': 'Out of combat',
  'Marteau du Jugement': 'Hammer of judgement',
  'Dagues jumelles': 'Twin daggers',
  'Saignement : fais saigner, disparais dans l’ombre, puis consume les saignements.':
    'Bleeding: make them bleed, vanish into the shadows, then consume the bleeds.',
  'Entaille': 'Gash',
  'Éventail de lames': 'Fan of blades',
  'Bâton élémentaire': 'Elemental staff',
  'Éléments : boule de feu, nova de givre, chaîne d’éclairs et météore.':
    'Elements: fireball, frost nova, chain lightning and meteor.',
  'Boule de feu': 'Fireball',
  'Nova de givre': 'Frost nova',
  'Météore': 'Meteor',
  'Arc long': 'Longbow',
  'Distance : flèches perçantes, marque de proie, volées et faucon spectral.':
    'Range: piercing arrows, prey mark, volleys and spectral falcon.',
  'Tir perçant': 'Piercing shot',
  'Volée de flèches': 'Arrow volley',
  'Assaut du faucon': 'Falcon assault',
  'Épées jumelles': 'Twin swords',
  'Combos : rafales, tempête d’acier, charge et exécution croisée.':
    'Combos: flurries, steel storm, charge and cross execution.',
  'Charge héroïque': 'Heroic charge',
  'Exécution croisée': 'Cross execution',
  'Éclat des profondeurs': 'Shard of the Depths',
  'Sceau des conquérants': 'Conqueror’s Seal',
  'Fragment d’Aurore': 'Dawn Fragment',
  'Boss du Jugement de Célestia en héroïque': 'Judgement of Celestia boss in heroic',
  'Bâton de saule': 'Willow staff',
  'Bâton des ronces': 'Bramble staff',
  'Crosse du cerf blanc': 'White stag crook',
  'Sceptre des chênes anciens': 'Sceptre of the ancient oaks',
  'Bâton du Grand Sylve': 'Staff of the Great Sylvan',
  'Cœur-de-Forêt': 'Forestheart',
  'Masse et écu de l’écuyer': 'Squire’s mace and buckler',
  'Masse bénie et pavois': 'Blessed mace and pavise',
  'Marteau-écu de l’Aube': 'Dawn hammer-shield',
  'Masse et rempart du croisé': 'Crusader’s mace and rampart',
  'Lumière du Bastion': 'Light of the Bastion',
  'Jugement de l’Aurore': 'Judgement of the Dawn',
  'Dagues du coupe-jarret': 'Cutthroat’s daggers',
  'Crocs du crépuscule': 'Twilight fangs',
  'Lames de la nuit': 'Blades of the night',
  'Murmures d’ombre': 'Shadow whispers',
  'Dagues du Néant': 'Daggers of the Void',
  'Éclipse jumelle': 'Twin eclipse',
  'Bâton de l’apprenti': 'Apprentice’s staff',
  'Bâton des braises': 'Ember staff',
  'Sceptre des trois vents': 'Sceptre of the three winds',
  'Bâton de l’orage': 'Storm staff',
  'Sceptre des Primordiaux': 'Sceptre of the Primordials',
  'Cœur des Éléments': 'Heart of the Elements',
  'Luth de l’Aurore chantante': 'Lute of the singing Dawn',
  'Arc de chasse': 'Hunting bow',
  'Arc du pisteur': 'Tracker’s bow',
  'Arc des sentiers': 'Bow of the trails',
  'Arc du faucon': 'Falcon bow',
  'Arc des vents sauvages': 'Bow of the wild winds',
  'Arc de la Traque éternelle': 'Bow of the eternal Hunt',
  'Épées du mercenaire': 'Mercenary’s swords',
  'Lames du duelliste': 'Duellist’s blades',
  'Épées du champion': 'Champion’s swords',
  'Lames de la tempête d’acier': 'Blades of the steel storm',
  'Épées du seigneur de guerre': 'Warlord’s swords',
  'Lames de l’Aurore': 'Blades of the Dawn',
  'Chaque coup subi forge une plaque de fer (5 au plus, 6 s) : −{n} % de dégâts subis par plaque. À 5 plaques, ton prochain coup libère une onde de choc ({m} % de ton Attaque autour de toi) et brise les plaques.':
    'Each hit taken forges an iron plate (up to 5, 6 s): −{n}% damage taken per plate. At 5 plates, your next hit releases a shockwave ({m}% of your Attack around you) and breaks the plates.',
  'Chance critique +{n} points ; tes critiques déchirent ({m} % du coup en saignement sur 4 s), et achever un ennemi qui saigne te rend 4 % de tes PV maximum.':
    'Critical chance +{n}; your crits tear flesh ({m}% of the hit as bleeding over 4 s), and finishing off a bleeding enemy restores 4% of your max HP.',
  'PV maximum +{n} % ; toutes les 8 s, ta peau de pierre réduit de {m} % le prochain coup reçu.':
    'Max HP +{n}%; every 8 s, your stone skin reduces the next hit taken by {m}%.',
  'Soins reçus +{n} % ; sous 35 % de PV, une brume guérisseuse te rend {m} % de tes PV maximum en 5 s (recharge 45 s).':
    'Healing taken +{n}%; below 35% HP, a healing mist restores {m}% of your max HP over 5 s (cooldown 45 s).',
  '{n} % de chances de parer un coup (aucun dégât) et de riposter ({m} % de ton Attaque) ; ta compétence suivante fait +30 %.':
    '{n}% chance to parry a hit (no damage) and riposte ({m}% of your Attack); your next skill deals +30%.',
  'Tes compétences réveillent l’Hydre : trois têtes de feu crachent sur ta cible et les ennemis proches ({n} % des dégâts chacune). Tes coups brûlent ({m} % des dégâts en 4 s).':
    'Your skills awaken the Hydra: three fiery heads spit at your target and nearby enemies ({n}% of the damage each). Your hits burn ({m}% of the damage over 4 s).',
  'Tous les 5 coups, la foudre tombe sur ta cible et rebondit sur 3 ennemis proches : {n} % de ton Attaque, et ils sont ralentis de {m} % pendant 2 s.':
    'Every 5 hits, lightning strikes your target and bounces to 3 nearby enemies: {n}% of your Attack, and they are slowed by {m}% for 2 s.',
  '+{n} % de dégâts contre les ennemis sous 35 % de leurs PV ; achever un ennemi réduit toutes tes recharges de {m} s.':
    '+{n}% damage against enemies below 35% HP; finishing off an enemy reduces all your cooldowns by {m} s.',
  'Toutes les 15 s, un bouclier de cristal absorbe {n} % de tes PV maximum ; quand il se brise, il éclate ({m} % de ton Attaque autour de toi).':
    'Every 15 s, a crystal shield absorbs {n}% of your max HP; when it breaks, it bursts ({m}% of your Attack around you).',
  'Compétences +{n} % de dégâts et recharges −{m} % ; tes compétences offensives embrasent le sol sous leur cible (30 % de ton Attaque par seconde pendant 3 s).':
    'Skills +{n}% damage and cooldowns −{m}%; your offensive skills set the ground under their target ablaze (30% of your Attack per second for 3 s).',
  'Recharge de la roulade −{n} % ; chaque roulade laisse un écho du Néant qui explose 1 s plus tard ({m} % de ton Attaque autour de lui) et te donne +25 % de dégâts pendant 3 s.':
    'Dodge roll cooldown −{n}%; each roll leaves a Void echo that explodes 1 s later ({m}% of your Attack around it) and grants you +25% damage for 3 s.',
  'Attaque, Défense et PV maximum +{n} % ; une fois toutes les 90 s, un coup fatal te rend {m} % de tes PV et 2 s d’invulnérabilité.':
    'Attack, Defence and max HP +{n}%; once every 90 s, a fatal blow restores {m}% of your HP and grants 2 s of invulnerability.',
  'Dégâts de nature en ligne · ralentissement': 'Nature damage in a line · slow',
  'Frappe les ennemis sur une ligne de 6 cases dans la direction visée. Inflige à chacun des dégâts de nature égaux à 240 % de ta Puissance magique et le ralentit de 40 % pendant 2 s.':
    'Hits enemies in a 6-tile line in the aimed direction. Deals nature damage equal to 240% of your Spell Power to each and slows them by 40% for 2 s.',
  'Zone de soin · 3 % des PV max par seconde': 'Healing area · 3% of max HP per second',
  'Fais éclore une fleur au point visé pendant 8 s. Chaque seconde, les membres du groupe à moins de 3 cases de la fleur récupèrent 3 % de leurs PV max.':
    'Grows a flower at the aimed point for 8 s. Each second, party members within 3 tiles of the flower recover 3% of their max HP.',
  'Nuage de nature · dégâts sur 5 s · ralentissement': 'Nature cloud · damage over 5 s · slow',
  'Crée un nuage de 2,5 cases de rayon au point visé pendant 5 s. Chaque seconde, les ennemis dans le nuage subissent des dégâts de nature égaux à 70 % de ta Puissance magique et sont ralentis de 20 %.':
    'Creates a cloud with a 2.5-tile radius at the aimed point for 5 s. Each second, enemies in it take nature damage equal to 70% of your Spell Power and are slowed by 20%.',
  '3 vagues de dégâts de nature · immobilisation': '3 waves of nature damage · root',
  'Trois vagues de racines jaillissent de plus en plus loin dans la direction visée. Chaque vague inflige des dégâts de nature égaux à 170 % de ta Puissance magique. Les monstres touchés sont immobilisés 1,5 s. Les boss sont ralentis de 40 % à la place.':
    'Three waves of roots erupt progressively farther in the aimed direction. Each deals nature damage equal to 170% of your Spell Power. Monsters hit are rooted for 1.5 s. Bosses are slowed by 40% instead.',
  '2 griffures · saignement sur 5 s': '2 claw strikes · bleed over 5 s',
  'Griffe deux fois en cône dans la direction visée. Chaque griffure inflige des dégâts égaux à 120 % de ta Puissance. La seconde fait saigner la cible et lui inflige 30 % de ta Puissance en dégâts par seconde pendant 5 s.':
    'Claws twice in a cone in the aimed direction. Each strike deals damage equal to 120% of your Power. The second applies a bleed that deals 30% of your Power as damage per second for 5 s.',
  'Bond de 5 cases au plus · dégâts à l’arrivée': 'Leap up to 5 tiles · landing damage',
  'Bondis jusqu’à 5 cases vers le point visé. À l’arrivée, tu infliges l’équivalent de 220 % de ta Puissance en dégâts aux ennemis à moins de 1,8 case. Les monstres touchés sont étourdis 1 s. Les boss infligent 5 % de dégâts en moins pendant 4 s à la place.':
    'Leaps up to 5 tiles toward the aimed point. On landing, deals damage equal to 220% of your Power to enemies within 1.8 tiles. Monsters hit are stunned for 1 s. Bosses deal 5% less damage for 4 s instead.',
  'Soin personnel · renforce les attaques de base': 'Self-heal · empowers basic attacks',
  'Récupère 8 % de tes PV max en soin de base. Pendant 6 s, tes attaques de base infligent 15 % de dégâts en plus et leur délai est réduit de 30 %.':
    'Restores 8% of your max HP as base healing. For 6 s, your basic attacks deal 15% more damage and their delay is reduced by 30%.',
  'Dégâts en cône · plus forte sur une cible qui saigne': 'Cone damage · stronger against bleeding targets',
  'Mords les ennemis en cône dans la direction visée. La morsure leur inflige des dégâts égaux à 450 % de ta Puissance, ou 650 % si la cible saigne.':
    'Bites enemies in a cone in the aimed direction. The bite deals damage equal to 450% of your Power, or 650% if the target is bleeding.',
  'Dégâts sacrés en cône · soin personnel': 'Holy cone damage · self-heal',
  'Frappe les ennemis en cône dans la direction visée et inflige des dégâts sacrés égaux à 280 % de ta Puissance à chacun. Tu récupères 3 % de tes PV max.':
    'Strikes enemies in a cone in the aimed direction and deals holy damage equal to 280% of your Power to each. Restores 3% of your max HP.',
  'Marque de 6 s · 3 % de tes PV max rendus par coup': '6 s mark · heals for 3% of your max HP per hit',
  'Marque l’ennemi le plus proche du point visé parmi ceux à 6 cases ou moins de toi. Pendant 6 s, chaque attaque de base ou impact direct de tes compétences sur cette cible te rend 3 % de tes PV max. Tu peux marquer un seul ennemi à la fois.':
    'Marks the enemy closest to the aimed point among those within 6 tiles of you. For 6 s, each basic attack or direct skill hit against that target restores 3% of your max HP. You can mark one enemy at a time.',
  'Réduit les dégâts reçus · bouclier de groupe': 'Reduces damage taken · party shield',
  'Tu subis 35 % de dégâts en moins pendant 6 s. Toi et tes alliés à moins de 6 cases gagnez chacun un bouclier qui absorbe l’équivalent de 12 % de vos PV max pendant 6 s.':
    'You take 35% less damage for 6 s. You and allies within 6 tiles each gain a shield that absorbs damage equal to 12% of your max HP for 6 s.',
  'Impact sacré · sol qui blesse et soigne': 'Holy impact · ground damage and healing',
  'Un marteau frappe au point visé. Il inflige des dégâts sacrés égaux à 500 % de ta Puissance aux ennemis à moins de 2,5 cases. Pendant 5 s, le sol inflige 50 % de ta Puissance en dégâts sacrés par seconde aux ennemis et rend aux alliés dans la zone 3 % de leurs PV max par seconde.':
    'A hammer strikes the aimed point. It deals holy damage equal to 500% of your Power to enemies within 2.5 tiles. For 5 s, the ground deals 50% of your Power as holy damage per second to enemies and restores 3% of max HP per second to allies in the area.',
  '2 coups de dague · saignement sur 5 s': '2 dagger strikes · bleed over 5 s',
  'Entaille deux fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 120 % de ta Puissance. Le second fait saigner la cible et lui inflige 35 % de ta Puissance en dégâts par seconde pendant 5 s.':
    'Slashes twice in a cone in the aimed direction. Each hit deals damage equal to 120% of your Power. The second applies a bleed that deals 35% of your Power as damage per second for 5 s.',
  'Téléportation · prochain coup critique et renforcé': 'Teleport · next hit is critical and empowered',
  'Téléporte-toi derrière l’ennemi le plus proche du point visé parmi ceux à 6 cases ou moins de toi. Si tu ne peux pas te téléporter, fais une ruée de 5 cases dans la direction visée. Ton prochain coup dans les 4 s est critique et inflige 60 % de dégâts en plus.':
    'Teleports you behind the enemy closest to the aimed point among those within 6 tiles of you. If you cannot teleport, dash 5 tiles in the aimed direction. Your next hit within 4 s is critical and deals 60% more damage.',
  '5 dagues en éventail · saignement sur 4 s': '5 daggers in a fan · bleed over 4 s',
  'Lance 5 dagues en éventail dans la direction visée. Chaque dague inflige des dégâts égaux à 90 % de ta Puissance au premier ennemi touché et lui inflige un saignement de 20 % de ta Puissance par seconde pendant 4 s.':
    'Throws 5 daggers in a fan in the aimed direction. Each dagger deals damage equal to 90% of your Power to the first enemy hit and applies a bleed for 20% of your Power per second for 4 s.',
  '5 coups en cône · consume les saignements d’arme': '5 cone strikes · consumes weapon bleeds',
  'Frappe 5 fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 85 % de ta Puissance. Un saignement d’arme sur une cible touchée est consumé et inflige aussitôt 150 % des dégâts qu’il lui restait à infliger.':
    'Strikes 5 times in a cone in the aimed direction. Each hit deals damage equal to 85% of your Power. A weapon bleed on an enemy hit is consumed and instantly deals 150% of its remaining damage.',
  'Projectile de feu · explosion à l’impact': 'Fire projectile · explodes on impact',
  'Lance une boule de feu dans la direction visée. Elle inflige des dégâts de feu égaux à 260 % de ta Puissance magique au premier ennemi touché et à 130 % aux autres ennemis à moins de 1,5 case de l’impact.':
    'Launches a fireball in the aimed direction. It deals fire damage equal to 260% of your Spell Power to the first enemy hit and 130% to other enemies within 1.5 tiles of impact.',
  'Dégâts de glace autour de toi · gel': 'Frost damage around you · freeze',
  'Inflige des dégâts de glace égaux à 190 % de ta Puissance magique aux ennemis à moins de 3 cases de toi. Les monstres sont gelés 1,5 s. Les boss sont ralentis de 40 % à la place.':
    'Deals frost damage equal to 190% of your Spell Power to enemies within 3 tiles of you. Monsters are frozen for 1.5 s. Bosses are slowed by 40% instead.',
  'Dégâts de foudre · jusqu’à 4 rebonds': 'Lightning damage · up to 4 bounces',
  'Frappe l’ennemi le plus proche du point visé parmi ceux à 9 cases ou moins de toi. Le premier éclair inflige des dégâts de foudre égaux à 260 % de ta Puissance magique. Il peut rebondir sur 4 autres ennemis et perd 15 % de ses dégâts à chaque rebond.':
    'Strikes the enemy closest to the aimed point among those within 9 tiles of you. The first bolt deals lightning damage equal to 260% of your Spell Power. It can bounce to 4 more enemies, losing 15% of its damage per bounce.',
  'Impact de feu · sol brûlant sur 4 s': 'Fire impact · burning ground over 4 s',
  'Après 0,8 s, un météore frappe au point visé. Il inflige des dégâts de feu égaux à 600 % de ta Puissance magique aux ennemis à moins de 2,5 cases. Le sol brûle ensuite pendant 4 s et inflige 40 % de ta Puissance magique en dégâts de feu par seconde aux ennemis dans la zone brûlante.':
    'After 0.8 s, a meteor strikes the aimed point. It deals fire damage equal to 600% of your Spell Power to enemies within 2.5 tiles. The ground then burns for 4 s, dealing 40% of your Spell Power as fire damage per second to enemies standing in it.',
  'Projectile d’harmonie · soin d’un allié': 'Harmony projectile · single ally heal',
  'Lance une note dans la direction visée. Elle inflige des dégâts d’harmonie égaux à 240 % de ta Puissance magique au premier ennemi touché. Au lancement, le membre du groupe le plus blessé dans un rayon de 8 cases récupère 4 % de ses PV max. Tu peux recevoir ce soin.':
    'Launches a note in the aimed direction. It deals harmony damage equal to 240% of your Spell Power to the first enemy hit. On cast, the most wounded party member within 8 tiles recovers 4% of their max HP. You can receive this heal.',
  'Dégâts d’harmonie autour de toi · repoussement': 'Harmony damage around you · knockback',
  'Inflige aux ennemis proches des dégâts d’harmonie égaux à 190 % de ta Puissance magique et repousse les monstres. Les boss subissent les dégâts mais restent en place.':
    'Deals harmony damage equal to 190% of your Spell Power to nearby enemies and knocks monsters back. Bosses take the damage but stay in place.',
  'Soin de groupe immédiat puis sur 5 s': 'Immediate party heal then healing over 5 s',
  'Toi et tes alliés à moins de 6 cases récupérez 12 % de vos PV max immédiatement, puis 2 % de vos PV max à chaque pulsation du chant pendant 5 s.':
    'You and allies within 6 tiles immediately recover 12% of your max HP, then 2% of your max HP with each pulse of the song over 5 s.',
  '5 ondes · dégâts et soins de zone': '5 waves · area damage and healing',
  'Fais résonner 5 ondes autour du point visé dans un rayon de 3 cases. Chaque onde inflige des dégâts d’harmonie égaux à 100 % de ta Puissance magique à chaque ennemi dans la zone et rend à chaque allié dans la zone 2 % de ses PV max.':
    'Sends 5 waves around the aimed point in a 3-tile radius. Each wave deals harmony damage equal to 100% of your Spell Power to each enemy in the area and restores 2% of max HP to each ally in the area.',
  'Flèche qui traverse les ennemis · portée de 14 cases': 'Piercing arrow · 14-tile range',
  'Décoche une flèche dans la direction visée jusqu’à 14 cases. Elle traverse les ennemis et inflige à chacun des dégâts égaux à 300 % de ta Puissance.':
    'Fires an arrow up to 14 tiles in the aimed direction. It pierces enemies and deals damage equal to 300% of your Power to each.',
  'Marque de 12 s · augmente les dégâts reçus par la cible':
    '12 s mark · increases damage taken by the target',
  'Marque pendant 12 s l’ennemi le plus proche du point visé parmi ceux à 14 cases ou moins de toi. La cible subit 15 % de dégâts en plus de tout le groupe. Tes flèches lui infligent 20 % de dégâts supplémentaires.':
    'Marks for 12 s the enemy closest to the aimed point among those within 14 tiles of you. The target takes 15% more damage from the party. Your arrows deal an additional 20% damage to it.',
  '4 salves de dégâts de zone': '4 volleys of area damage',
  'Tire 4 salves au point visé, espacées de 0,5 s. Chaque salve inflige des dégâts égaux à 90 % de ta Puissance à chaque ennemi dans la zone.':
    'Fires 4 volleys at the aimed point, 0.5 s apart. Each volley deals damage equal to 90% of your Power to every enemy in the area.',
  'Faucon spectral · 5 coups de serre': 'Spectral falcon · 5 talon strikes',
  'Ton faucon attaque l’ennemi le plus proche du point visé parmi ceux à 14 cases ou moins de toi. Chaque coup de serre inflige des dégâts égaux à 100 % de ta Puissance. Si la cible tombe, le faucon cherche un autre ennemi à portée pour les coups restants.':
    'Your falcon attacks the enemy closest to the aimed point among those within 14 tiles of you. Each talon strike deals damage equal to 100% of your Power. If the target falls, the falcon seeks another enemy in range for the remaining strikes.',
  '4 coups en cône · active le combo': '4 cone strikes · activates the combo',
  'Frappe 4 fois en cône dans la direction visée. Chaque coup inflige des dégâts égaux à 80 % de ta Puissance. Active pendant 4 s le combo qui renforce Exécution croisée.':
    'Strikes 4 times in a cone in the aimed direction. Each hit deals damage equal to 80% of your Power. Activates the combo that empowers Cross execution for 4 s.',
  '6 frappes autour de toi · active le combo': '6 strikes around you · activates the combo',
  'Tournoie 1,5 s et touche les ennemis proches 6 fois. Chaque frappe inflige des dégâts égaux à 60 % de ta Puissance. Tu peux te déplacer pendant la tempête. Active pendant 4 s le combo qui renforce Exécution croisée.':
    'Spins for 1.5 s and hits nearby enemies 6 times. Each strike deals damage equal to 60% of your Power. You can move during the storm. Activates the combo that empowers Cross execution for 4 s.',
  'Ruée de 5 cases · dégâts sur le trajet · +20 Rage': '5-tile charge · damage along the path · +20 Rage',
  'Charge jusqu’à 5 cases dans la direction visée. Inflige des dégâts égaux à 200 % de ta Puissance à chaque ennemi sur ta trajectoire et te donne 20 points de Rage.':
    'Charges up to 5 tiles in the aimed direction. Deals damage equal to 200% of your Power to each enemy in your path and grants you 20 Rage.',
  'Dégâts en cône · renforcée par le combo': 'Cone damage · empowered by the combo',
  'Frappe les ennemis en cône dans la direction visée. Les dégâts valent 500 % de ta Puissance, ou 600 % si le combo de Rafale de lames ou de Tempête d’acier est actif. Les dégâts sont multipliés par 1,5 si la cible a moins de 35 % de ses PV max.':
    'Strikes enemies in a cone in the aimed direction. Deals damage equal to 500% of your Power, or 600% with the combo from Blade flurry or Steel storm active. Damage is multiplied by 1.5 if the target has less than 35% of its max HP.',
  'Invocation de 30 s · dégâts de poison par coup': '30 s summon · poison damage per hit',
  'Lève un squelette près de toi pendant 30 s. Il attaque toutes les 1,2 s et chaque coup inflige des dégâts de poison égaux à 60 % de ta Puissance magique. Chaque lancer ajoute un squelette sans limite de nombre.':
    'Raises a skeleton near you for 30 s. It attacks every 1.2 s, dealing poison damage equal to 60% of your Spell Power per hit. Each cast adds a skeleton with no cap on their number.',
  '4 invocations de 8 s · dégâts de poison par bec': '4 summons for 8 s · poison damage per peck',
  'Envoie 4 corbeaux vers le point visé par-dessus les obstacles. Ils chassent pendant 8 s. Chaque corbeau attaque toutes les 0,6 s et inflige des dégâts de poison égaux à 45 % de ta Puissance magique par coup de bec.':
    'Sends 4 crows toward the aimed point over obstacles. They hunt for 8 s. Each crow attacks every 0.6 s, dealing poison damage equal to 45% of your Spell Power per peck.',
  'Totem de 10 s · poison de zone · invoque des rats': '10 s totem · area poison damage · summons rats',
  'Au point visé (portée 8 cases), pose un totem pour 10 s. Il inflige chaque seconde 50 % de ta Puissance magique en dégâts de poison aux ennemis à 3 cases. Toutes les 2,5 s, un rat apparaît. Ses dégâts de poison valent 35 % de ta Puissance magique par morsure (0,6 s) et 90 % à son explosion (après 6 s). Un seul totem, qui accélère les attaques des invocations proches de 25 %.':
    'Place one totem for 10 s at the aimed point (8-tile range). Each second it deals 50% of your Spell Power as poison damage to enemies within 3 tiles. A rat appears every 2.5 s. Its poison damage is 35% of your Spell Power per bite (every 0.6 s) and 90% when it explodes after 6 s. Nearby summons attack 25% faster.',
  'Invocation de 15 s · dégâts de poison de zone': '15 s summon · area poison damage',
  'Lève une abomination pendant 15 s. Toutes les 1,6 s, elle écrase les ennemis dans un rayon de 2 cases autour d’elle et leur inflige des dégâts de poison égaux à 160 % de ta Puissance magique. Tu peux avoir une seule abomination à la fois.':
    'Raises an abomination for 15 s. Every 1.6 s, it crushes enemies in a 2-tile radius around itself and deals poison damage equal to 160% of your Spell Power to each. You can have one abomination at a time.',
  'Dégâts dans un large cône': 'Damage in a wide cone',
  'Frappe tous les ennemis dans un large cône dans la direction visée et inflige à chacun des dégâts égaux à 300 % de ta Puissance.':
    'Strikes every enemy in a wide cone in the aimed direction, dealing damage equal to 300% of your Power to each.',
  'Bond d’environ 4 cases · dégâts à l’arrivée': 'Leap about 4 tiles · landing damage',
  'Bondis d’environ 4 cases au plus vers le point visé. À l’arrivée, tu infliges l’équivalent de 240 % de ta Puissance en dégâts aux ennemis proches. Les monstres touchés sont étourdis 1 s. Les boss infligent 5 % de dégâts en moins pendant 4 s à la place.':
    'Leaps up to about 4 tiles toward the aimed point. On landing, deals damage equal to 240% of your Power to nearby enemies. Monsters hit are stunned for 1 s. Bosses deal 5% less damage for 4 s instead.',
  'Plus de dégâts infligés et reçus · affaiblit les ennemis': 'More damage dealt and taken · weakens enemies',
  'Pendant 6 s, tes coups infligent 25 % de dégâts en plus et tu subis 15 % de dégâts en plus. Les ennemis à moins de 4 cases de toi infligent 5 % de dégâts en moins pendant 4 s.':
    'For 6 s, your hits deal 25% more damage and you take 15% more damage. Enemies within 4 tiles of you deal 5% less damage for 4 s.',
  'Dégâts en cône · renforcé par Hurlement sanguinaire': 'Cone damage · empowered by Bloodthirsty roar',
  'Frappe les ennemis en cône dans la direction visée. Les dégâts de base valent 450 % de ta Puissance, ou 600 % pendant Hurlement sanguinaire avant ses autres bonus de dégâts.':
    'Strikes enemies in a cone in the aimed direction. Base damage is 450% of your Power, or 600% during Bloodthirsty roar before its other damage bonuses.',
  'Floraison ou Rugissement sauvage te donne un bouclier de 20 % de tes PV max pendant 6 s. Durant cette période, les ennemis qui te frappent subissent 30 % des dégâts de leur coup. Recharge du talent de 20 s.':
    'Bloom or Savage roar gives you a shield for 20% of your max HP for 6 s. During that time, enemies that hit you take 30% of the damage from their hit. Talent cooldown is 20 s.',
  'Pendant Rempart sacré, l’impact de Marteau du Jugement inflige 60 % de dégâts sacrés en plus, soit 800 % de ta Puissance au total.':
    'During Holy rampart, Hammer of judgement’s impact deals 60% more holy damage, for a total of 800% of your Power.',
  'Lames déchirantes': 'Rending blades',
  'Tes compétences offensives infligent 25 % de dégâts en plus aux cibles qui saignent. Mille coupures libère 200 % des dégâts restants des saignements d’arme qu’il consume, au lieu de 150 %.':
    'Your offensive skills deal 25% more damage to bleeding targets. Thousand cuts releases 200% of the remaining damage of weapon bleeds it consumes, up from 150%.',
  'Nova de givre te donne un bouclier qui absorbe l’équivalent de 20 % de tes PV max pendant 6 s. Si tu lances un sort de feu dans ce délai, il inflige 40 % de dégâts en plus.':
    'Frost nova gives you a shield that absorbs damage equal to 20% of your max HP for 6 s. If you cast a fire spell within that time, it deals 40% more damage.',
  'Accord dissonant protège aussi ton groupe. Toi et tes alliés à moins de 6 cases gagnez chacun un bouclier de 15 % de vos PV max pendant 5 s.':
    'Dissonant chord also protects your party. You and allies within 6 tiles each gain a shield for 15% of your max HP for 5 s.',
  'Il paie ses compétences avec ses PV et les récupère en frappant':
    'Spends HP to use skills and recovers it by attacking',
  'Tes compétences coûtent des PV et ne peuvent pas te tuer. Tes compétences offensives te rendent 15 % des dégâts infligés. Après Hurlement sanguinaire, ta prochaine compétence offensive inflige 20 % de dégâts en plus et te rend 30 % des dégâts infligés. Tu ne manies que ta Grande hache, qui grandit avec toi.':
    'Your skills cost HP and cannot kill you. Your offensive skills heal you for 15% of the damage dealt. After Bloodthirsty roar, your next offensive skill deals 20% more damage and heals you for 30% of the damage dealt. You wield only your Great axe, which grows with you.',
  'Tes attaques de base et compétences offensives te donnent une Cicatrice en touchant, ou 3 sur un critique, au plus toutes les 0,25 s. Chaque Cicatrice donne 3 % de dégâts en plus pendant 6 s, jusqu’à 10 charges. Chaque nouvelle charge renouvelle la durée.':
    'Your basic attacks and offensive skills grant a Scar on hit, or 3 on a critical hit, at most every 0.25 s. Each Scar grants 3% more damage for 6 s, up to 10 stacks. Each new stack refreshes the duration.',
  'Hurlement sanguinaire te donne aussi 20 points de Garde pendant 6 s. La compétence offensive qui suit te rend 50 % des dégâts infligés au lieu de 30 %.':
    'Bloodthirsty roar also grants 20 Guard for 6 s. Your next offensive skill heals you for 50% of the damage dealt instead of 30%.',
  'Gagne 10 points de Garde en permanence. Tes compétences coûtent 20 % de PV en moins.':
    'Permanently gain 10 Guard. Your skills cost 20% less HP.',
  'Ta roulade te donne 30 % de vitesse de déplacement et 20 points de Garde pendant 5 s. Recharge du talent de 15 s.':
    'Your dodge roll grants 30% movement speed and 20 Guard for 5 s. Talent cooldown is 15 s.',
  'Volonté de fer te donne aussi un bouclier de 15 % de tes PV max et te rend 5 % de tes PV max par seconde pendant 5 s.':
    'Iron will also grants a shield for 15% of your max HP and restores 5% of your max HP per second for 5 s.',
  'Tous les 3 coups qui déclenchent le soin de ton Sceau de lumière, il libère une onde sacrée. Elle inflige 150 % de ton Attaque en dégâts sacrés à la cible et aux ennemis à moins de 3 cases d’elle.':
    'Every 3 hits that trigger healing from your Seal of light release a holy wave. It deals holy damage equal to 150% of your Attack to the target and enemies within 3 tiles of it.',
  'Éventail de lames lance 8 dagues. Au retour, une dague qui a touché frappe de nouveau pour la moitié de ses dégâts de base à l’aller.':
    'Fan of blades throws 8 daggers. On its way back, a dagger that hit strikes again for half its base outgoing damage.',
  'À l’impact, Boule de feu libère jusqu’à 3 flammèches vers les ennemis proches. Chacune inflige des dégâts de feu égaux à 60 % de ta Puissance magique. Tes brûlures infligent 30 % de dégâts en plus.':
    'On impact, Fireball releases up to 3 embers toward nearby enemies. Each deals fire damage equal to 60% of your Spell Power. Your burns deal 30% more damage.',
  'Lance un sort de feu, de glace et de foudre en moins de 8 s. Ton prochain sort inflige 50 % de dégâts en plus et ne coûte pas de mana.':
    'Cast a fire, frost and lightning spell within 8 s. Your next spell deals 50% more damage and costs no mana.',
  'Symphonie se termine par un accord qui inflige des dégâts d’harmonie égaux à 300 % de ta Puissance magique aux ennemis dans la zone et rend à ton groupe proche 15 % de ses PV max.':
    'Symphony ends with a chord that deals harmony damage equal to 300% of your Spell Power to enemies in the area and restores 15% of max HP to your nearby party.',
  'Après son assaut, le faucon reste à tes côtés pendant 8 s. Toutes les 0,8 s, il attaque la cible de ta Marque ou l’ennemi le plus proche et inflige des dégâts égaux à 60 % de ta Puissance par coup de serre.':
    'After its assault, the falcon stays at your side for 8 s. Every 0.8 s, it attacks your marked target or the nearest enemy and deals damage equal to 60% of your Power per talon strike.',
  'Chaque Élan donne aussi 2 points de critique. À 5 Élans, tes attaques de base libèrent une onde qui inflige 60 % de ton Attaque en dégâts d’acier aux autres ennemis à moins de 2 cases de la cible.':
    'Each Momentum also grants 2 critical chance points. At 5 Momentum, your basic attacks release a wave that deals 60% of your Attack as steel damage to other enemies within 2 tiles of the target.',
  'Berserker : se paie en PV ; ta prochaine compétence offensive inflige 20 % de dégâts en plus et te rend 30 % des dégâts infligés.':
    'Berserker: paid with HP. Your next offensive skill deals 20% more damage and heals you for 30% of the damage dealt.',
  '💀 CHÂTIMENT RENFORCÉ': '💀 EMPOWERED PUNISHMENT',
  '🩸 SOIF DE SANG': '🩸 BLOODTHIRST',
  'Prochain sort de feu : +40 % de dégâts.': 'Next fire spell: +40% damage.',
  'Vitesse +30 %, Garde +20.': 'Speed +30%, Guard +20.',
  'Prochaine compétence offensive : +20 % de dégâts et 50 % des dégâts infligés rendus en PV.':
    'Next offensive skill: +20% damage and 50% of damage dealt restored as HP.',
  'Prochaine compétence offensive : +20 % de dégâts et 30 % des dégâts infligés rendus en PV.':
    'Next offensive skill: +20% damage and 30% of damage dealt restored as HP.',
  '{n} dégâts de base par cible': '{n} base damage per target',
  '{n} dégâts de base si tous les coups touchent': '{n} base damage if every hit lands',
  '{n} dégâts de base sur toute la durée': '{n} base damage over the full duration',
  '{n} dégâts de base par dague': '{n} base damage per dagger',
  '{n} dégâts de base sur la cible principale': '{n} base damage to the primary target',
  'Ton prochain coup est critique.': 'Your next hit is a critical hit.',
  'Tes coups sur la cible te soignent.': 'Your hits on the target heal you.',
  'Prochaine compétence offensive : +25 % de dégâts.': 'Your next offensive skill deals 25% more damage.',
  'Prochaine compétence offensive : +30 % de dégâts.': 'Your next offensive skill deals 30% more damage.',
  'Ta prochaine compétence féline est critique.': 'Your next cat skill is a critical hit.',
  'Invulnérable pendant la roulade.': 'Invulnerable during the dodge roll.',
  'Trois boucliers infligent des dégâts sacrés autour de toi.': 'Three shields deal holy damage around you.'
};
