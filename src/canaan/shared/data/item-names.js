// Noms officiels des objets (rareté × arme ou emplacement) et passifs des trois artéfacts.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
// Noms officiels extraits du tableau fourni : rareté × famille d'arme.
export const WEAPON_NAMES = {
  'Commun': {
    'sword': 'Épée émoussée',
    'axe': 'Hachettes rouillées',
    'staff': 'Bâton en bois mort',
    'mace': 'Masse de chantier',
    'spear': 'Pique en bois taillé',
    'dualdagger': 'Couteaux ébréchés',
    'bow': 'Arc de foire tordu',
    'shield': 'Rondache en bois vermoulu',
    'dualsword': 'Glaives rouillés'
  },
  'Peu commun': {
    'sword': "Lame d'acier trempé",
    'axe': 'Haches de bûcheron',
    'staff': 'Bâton de disciple',
    'mace': "Masse d'armes ferrée",
    'spear': 'Hallebarde de milicien',
    'dualdagger': 'Poignards de maraudeur',
    'bow': 'Arc composite de frondeur',
    'shield': 'Pavois de milice',
    'dualsword': "Lames jumelles d'acier"
  },
  'Rare': {
    'sword': 'Trancheuse de mithril',
    'axe': 'Fendeuses des gelées',
    'staff': 'Sceptre des marées',
    'mace': 'Marteau de cristal',
    'spear': 'Javelot des abysses',
    'dualdagger': 'Crocs de givre',
    'bow': 'Arc long de saphir',
    'shield': 'Écu de mithril étincelant',
    'dualsword': 'Sabres de cristal marin'
  },
  'Épique': {
    'sword': "Lame d'éclipse",
    'axe': 'Haches du massacreur',
    'staff': 'Sceptre du vide',
    'mace': 'Marteau des tempêtes',
    'spear': 'Pique du gardien ténébreux',
    'dualdagger': "Lames de l'assassin",
    'bow': "Grand arc de l'ombre",
    'shield': "Mur de l'éclipse",
    'dualsword': 'Épées jumelles du crépuscule'
  },
  'Légendaire': {
    'sword': "Lame de l'étincelle",
    'axe': 'Dévoreuses de chair',
    'staff': "Sceptre de l'apocalypse",
    'mace': 'Marteau du wyrm',
    'spear': 'Trident du drakôn',
    'dualdagger': 'Griffes de braise',
    'bow': 'Traverseur de flammes',
    'shield': 'Égide de écaille-ardente',
    'dualsword': 'Trancheuses du désert ardent'
  },
  'Mythique': {
    'sword': 'Lame du continuum',
    'axe': 'Trancheuses astrales',
    'staff': 'Sceptre des constellations',
    'mace': 'Masse de la singularité',
    'spear': 'Lance du continuum',
    'dualdagger': 'Dagues de phase',
    'bow': 'Arc des constellations',
    'shield': 'Barrière de singularité',
    'dualsword': 'Lames stellaires doubles'
  }
};
export const GEAR_NAMES = {
  'Commun': {
    'weapon': {
      'sword': 'Épée émoussée',
      'dualaxe': 'Hachettes rouillées',
      'staff': 'Bâton en bois mort',
      'mace': 'Masse de chantier'
    },
    'helm': 'Capuche trouée',
    'shoulders': 'Épaulières usées',
    'armor': 'Tunique en lin',
    'gloves': 'Gants râpés',
    'boots': 'Bottes trouées',
    'neck': 'Pendentif en pierre',
    'ring': 'Anneau en tôle',
    'artifact': ['Grimoire déchiré', "Tesson d'argile", 'Branche séchée']
  },
  'Peu commun': {
    'weapon': {
      'sword': "Lame d'acier trempé",
      'dualaxe': 'Haches de bûcheron',
      'staff': 'Bâton de disciple',
      'mace': "Masse d'armes ferrée"
    },
    'helm': 'Casque de la garde',
    'shoulders': 'Spallières en cuir',
    'armor': 'Cuirasse renforcée',
    'gloves': 'Gants en cuir ajustés',
    'boots': 'Bottes de patrouille',
    'neck': 'Amulette en os gravé',
    'ring': 'Bague de cuivre poli',
    'artifact': ['Relique de disciple', 'Totem gravé', 'Pierre de foyer']
  },
  'Rare': {
    'weapon': {
      'sword': 'Trancheuse de mithril',
      'dualaxe': 'Fendeuses des gelées',
      'staff': 'Sceptre des marées',
      'mace': 'Marteau de cristal'
    },
    'helm': 'Heaume de mithril',
    'shoulders': 'Épaulières du traqueur',
    'armor': 'Plastron de givre',
    'gloves': 'Gants arcaniques',
    'boots': 'Bottes du marcheur',
    'neck': 'Pendentif de la brume',
    'ring': 'Anneau de saphir pur',
    'artifact': ['Orbe des marées', 'Boussole des brumes', "Rune d'eau vive"]
  },
  'Épique': {
    'weapon': {
      'sword': "Lame d'éclipse",
      'dualaxe': 'Haches du massacreur',
      'staff': 'Sceptre du vide',
      'mace': 'Marteau des tempêtes'
    },
    'helm': 'Casque de maître',
    'shoulders': 'Spallières du conquérant',
    'armor': 'Cuirasse du jugement',
    'gloves': "Gants d'ombre-pas",
    'boots': "Bottes d'ombre-pas",
    'neck': 'Amulette du cœur nocturne',
    'ring': 'Sceau du souverain',
    'artifact': ['Talisman du vide', "Sceau d'ombre", "Sablier de l'éclipse"]
  },
  'Légendaire': {
    'weapon': {
      'sword': "Lame de l'étincelle",
      'dualaxe': 'Dévoreuses de chair',
      'staff': "Sceptre de l'apocalypse",
      'mace': 'Marteau du wyrm'
    },
    'helm': 'Masque du drakôn',
    'shoulders': 'Spallières de la fureur',
    'armor': 'Carapace de volcan',
    'gloves': 'Gants de brasier',
    'boots': 'Bottes de marche-flamme',
    'neck': 'Amulette de la résurgence',
    'ring': 'Anneau du pacte draconique',
    'artifact': ['Cœur de brasier', 'Idole du drakôn', "Prisme d'étincelles"]
  },
  'Mythique': {
    'weapon': {
      'sword': 'Lame du continuum',
      'dualaxe': 'Trancheuses astrales',
      'staff': 'Sceptre des constellations',
      'mace': 'Masse de la singularité'
    },
    'helm': 'Visage du cosmos',
    'shoulders': "Spallières d'éther",
    'armor': 'Carapace de starlight',
    'gloves': 'Gants du vide',
    'boots': 'Bottes de marche-vide',
    'neck': "Pendentif de l'éternité",
    'ring': 'Anneau de la singularité',
    'artifact': ['Orbe du néant', 'Chronomètre astral', 'Prisme de singularité']
  }
};
// Passifs des trois artéfacts.
export const ARTIFACT_BUFFS = [
  {
    name: 'Ardeur',
    icon: '⟦art_ardeur⟧',
    description: 'Augmente les dégâts et les soins',
    stat: 'attack',
    percent: 6
  },
  {
    name: 'Bastion',
    icon: '⟦art_bastion⟧',
    description: 'Augmente les points de vie et l’armure',
    stat: 'defense',
    percent: 8
  },
  {
    name: 'Instinct',
    icon: '⟦art_instinct⟧',
    description: 'Augmente les chances de critique et la vitesse de déplacement',
    stat: 'crit',
    percent: 7
  }
];
