# Référence des catalogues 13e

`catalogs-13e.json` provient de l’exécution du HTML autonome 1.8.99.13e, avant le nettoyage v3. Les champs sans lecteur (`weight`, multiplicateurs historiques des types d’armes) sont omis volontairement.

La référence conserve les instances après placement, les qualités, les armures, les neuf armes, leurs 36 compétences, les catalogues de forge, 45 prix de vente et 162 scénarios de butin avec et sans sac plein. Les scénarios fixent l’aléatoire à 0,5. Elle vérifie les valeurs finales indépendamment de la nouvelle organisation des sources ; elle ne doit pas être régénérée automatiquement depuis l’implémentation actuelle.

## Passage aux niveaux (1 à 60)

Avec la suppression de l’iLvl et de Ratings52, les parties `instances`, `rarities`, `sales`, `fullBag` et `loot` ont été reprises une fois, volontairement, depuis le jeu : instances avec leur niveau requis, le niveau de leurs ennemis et le niveau de leur récompense ; qualités sans palier d’iLvl ; prix de vente selon le niveau de l’objet ; butins décrits par leur niveau. Les armes, les compétences et `craft` gardent les valeurs d’origine de la 13e.

## Tréfonds réorganisés

Les Tréfonds sont devenus des cavernes reliées par des galeries : les quatre portails des donjons souterrains (`under`) ont changé de place. Seuls leurs `x` et `y` ont été repris depuis le jeu.

## Armes de classe

Les armes ne se trouvent plus au butin ni chez les marchands : chaque classe a la sienne. Les parties `weapons`, `craft` (vide) et `spells` ont été reprises une fois, volontairement, depuis le jeu : les dix jeux de compétences des armes de classe (dont les griffes de la forme féline du Druide).
