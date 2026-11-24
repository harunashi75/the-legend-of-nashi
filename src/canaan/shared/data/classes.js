// @ts-check
// Les neuf classes : élément de leurs compétences, passif de classe, sort spécial (touche F) et dix talents.
// Le joueur équipe 5 talents au plus parmi les 10 de sa classe (un emplacement aux niveaux 1, 10, 20, 30 et 40).
// Chaque classe a son arme (weapon) : elle la reçoit en la choisissant et n'en manie aucune autre. L'arme prend le
// niveau du héros ; weaponStats donne ses deux statistiques secondaires fixes. L'Invocateur et le Berserker ont une
// arme de qualité Relique (relic) ; celle des autres classes monte de qualité avec les essences des boss
// (CLASS_WEAPON_UPGRADES, shared/data/equipment.js).
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Un emplacement de talent s'ouvre à chacun de ces niveaux (5 au maximum).
export const TALENT_SLOT_LEVELS = Object.freeze([1, 10, 20, 30, 40]);
export const TALENTS_PER_CLASS = 10;
// Éléments des dégâts : couleur des effets et icône sur les compétences.
export const ELEMENTS = deepFreeze({
  nature: { name: 'Nature', icon: '⟦el_nature⟧', color: '#7ee36a' },
  holy: { name: 'Sacré', icon: '⟦el_holy⟧', color: '#ffd76a' },
  shadow: { name: 'Ombre', icon: '⟦el_shadow⟧', color: '#c48cff' },
  fire: { name: 'Feu', icon: '⟦el_fire⟧', color: '#ff8a3d' },
  ice: { name: 'Glace', icon: '⟦el_ice⟧', color: '#8fdcff' },
  lightning: { name: 'Foudre', icon: '⟦el_lightning⟧', color: '#f4f07a' },
  poison: { name: 'Poison', icon: '⟦el_poison⟧', color: '#a4e83c' },
  harmony: { name: 'Harmonie', icon: '⟦el_harmony⟧', color: '#ff9ad5' },
  blood: { name: 'Sang', icon: '⟦el_blood⟧', color: '#e0404f' },
  wild: { name: 'Sauvage', icon: '⟦el_wild⟧', color: '#e8b65a' },
  steel: { name: 'Acier', icon: '⟦el_steel⟧', color: '#cfdcea' }
});
// Ressources des classes : ce que chaque classe dépense pour ses compétences (règles : shared/rules/resources.js).
// Le mana grandit avec le niveau et se régénère ; l'Énergie et la Concentration (100) se rechargent vite, même en
// combat ; la Ferveur, le Rythme et la Rage (100) partent de zéro, montent en combat et retombent ensuite ; le
// Berserker paie en PV (pas de barre).
export const RESOURCES = deepFreeze({
  mana: {
    name: 'Mana',
    icon: '💧',
    color: '#4a8ae8',
    lack: 'Mana insuffisant',
    desc: 'Grandit avec ton niveau et se régénère tout seul, plus lentement en combat.'
  },
  energy: {
    name: 'Énergie',
    icon: '⚡',
    color: '#f2d24a',
    lack: 'Énergie insuffisante',
    desc: '100 points qui se rechargent très vite, même en plein combat.'
  },
  fervor: {
    name: 'Ferveur',
    icon: '✨',
    color: '#ff9f3a',
    lack: 'Ferveur insuffisante',
    desc: 'Part de zéro : monte quand tu frappes, et surtout quand tu es frappé ; retombe hors combat.'
  },
  rhythm: {
    name: 'Rythme',
    icon: '🎵',
    color: '#ff7ac8',
    lack: 'Rythme insuffisant',
    desc: 'Part de zéro : chaque attaque de base qui touche est une note qui le fait monter ; retombe hors combat.'
  },
  focus: {
    name: 'Concentration',
    icon: '🎯',
    color: '#7fd7a0',
    lack: 'Concentration insuffisante',
    desc: '100 points qui se rechargent vite, même en combat ; chaque attaque de base qui touche en rend un peu plus.'
  },
  rage: {
    name: 'Rage',
    icon: '💢',
    color: '#e8643a',
    lack: 'Rage insuffisante',
    desc: 'Part de zéro : monte quand tu frappes et quand tu es frappé ; retombe hors combat.'
  },
  blood: {
    name: 'PV',
    icon: '🩸',
    color: '#e0404f',
    lack: 'PV insuffisants',
    desc: 'Tes compétences coûtent des PV, de plus en plus cher avec ton niveau : pas de barre de mana.'
  }
});
export const CLASSES = deepFreeze([
  {
    id: 'druide',
    // Ressource qui paie ses compétences (RESOURCES).
    resource: 'mana',
    icon: '⟦cls_druide⟧',
    name: 'Druide',
    style: 'Sorts de nature, soins et forme féline au corps à corps',
    spec: 'Nature, poison, soins, et une panthère qui déchire ses proies',
    color: '#7ee36a',
    // Arme de la classe, et ses deux statistiques secondaires fixes.
    weapon: 'wildstaff',
    weaponStats: ['healing', 'mastery'],
    // Élément de chaque compétence (1 à 4).
    elements: ['nature', 'nature', 'nature', 'nature'],
    passive: {
      name: 'Sève vitale',
      desc: 'Tes compétences offensives empoisonnent (25 % des dégâts en plus sur 4 s) et soignent ton groupe proche de 5 % des dégâts ; tes compétences utilitaires soignent ton groupe proche de 8 % des PV max. En forme féline, tes coups critiques font saigner (25 % du coup sur 4 s) au lieu de soigner.'
    },
    special: {
      id: 'feral',
      icon: '🐆',
      name: 'Forme féline',
      desc: 'Transformation (F pour entrer ou sortir) : tes compétences deviennent celles du félin (Lacération, Bond du prédateur, Rugissement sauvage, Morsure féroce), +15 % de dégâts, +20 % de vitesse, +8 points de critique et attaques de base 20 % plus rapides. En forme féline, tes soins sont réduits de 30 %.',
      mana: 15,
      cooldown: 1.5
    },
    talents: [
      [
        'Ronces vivaces',
        'Fouet de ronces immobilise les monstres 1,5 s (au lieu de les ralentir) et les fait saigner d’épines : 40 % des dégâts, en plus, sur 4 s.'
      ],
      [
        'Floraison éternelle',
        'Floraison dure 4 s de plus et soigne 50 % de plus ; en se fanant, elle éclôt une dernière fois : 10 % des PV max aux héros proches.'
      ],
      [
        'Spores virulentes',
        'Le nuage de Spores toxiques est 30 % plus grand et ralentit de 40 % ; un ennemi qui y meurt libère un nouveau nuage de 3 s.'
      ],
      [
        'Colère des anciens',
        'Courroux de la forêt lance une quatrième vague de racines et inflige 25 % de dégâts en plus aux ennemis empoisonnés.'
      ],
      [
        'Instinct du fauve',
        'Changer de forme ne coûte rien et se recharge en 0,5 s ; entrer en forme féline rend ta prochaine compétence féline critique.'
      ],
      [
        'Griffes sanglantes',
        'Tes saignements de forme féline infligent 40 % de plus ; Morsure féroce consume les saignements de sa cible : 150 % de ce qu’il leur restait à faire, d’un coup.'
      ],
      [
        'Cœur du prédateur',
        'En forme féline, chaque coup critique te soigne de 2 % de tes PV max et réduit d’1 s la recharge du Bond du prédateur.'
      ],
      ['Symbiose', 'Soigner un allié te rend 25 % du soin et lui donne +10 % de dégâts pendant 4 s.'],
      [
        'Écorce de fer',
        'Sous 40 % de PV, une écorce t’entoure : bouclier de 20 % de tes PV max pendant 6 s, et les ennemis qui te frappent subissent 30 % de leurs dégâts. Recharge : 40 s.'
      ],
      [
        'Équilibre sauvage',
        'Après 3 compétences de nature, entrer en forme féline donne +25 % de dégâts pendant 8 s ; après 3 compétences félines, reprendre forme normale soigne ton groupe proche de 15 % des PV max.'
      ]
    ]
  },
  {
    id: 'paladin',
    resource: 'fervor',
    icon: '⟦cls_paladin⟧',
    name: 'Paladin',
    style: 'Masse et bouclier : défense, protection des alliés et lumière sacrée',
    spec: 'Le rempart du groupe : boucliers, sols consacrés et jugement',
    color: '#ffd76a',
    weapon: 'aegis',
    weaponStats: ['resist', 'healing'],
    elements: ['holy', 'holy', 'holy', 'holy'],
    passive: {
      name: 'Lumière sacrée',
      desc: 'Chaque compétence offensive te donne un bouclier de 5 % des PV max, chaque compétence utilitaire un bouclier de 10 % à ton groupe proche. Tes soins sur toi-même soignent aussi tes alliés à moins de 6 cases, à 50 %.'
    },
    special: {
      id: 'divine',
      icon: '✨',
      name: 'Lumière divine',
      desc: 'Soigne toi et tes alliés à moins de 6 cases de 20 % de leurs PV maximum et réduit leurs dégâts reçus de 20 % pendant 6 secondes.',
      mana: 25,
      cooldown: 45
    },
    talents: [
      [
        'Croisade',
        'Trois Frappes du croisé en 10 s : la troisième libère une onde de lumière (200 % de l’Attaque aux ennemis à moins de 3 cases) et te soigne de 6 % au lieu de 3 %.'
      ],
      [
        'Bastion',
        'Rempart sacré dure 2 s de plus ; pendant ce temps, 40 % des dégâts que tu évites sont renvoyés à l’attaquant en lumière sacrée.'
      ],
      [
        'Bouclier vengeur',
        'Après la Charge du bouclier, ton égide rebondit sur 3 ennemis proches : 150 % à chacun.'
      ],
      [
        'Sentence',
        'Marteau du Jugement inflige 60 % de plus aux ennemis sous 35 % de leurs PV et achève les monstres (pas les boss) sous 10 %.'
      ],
      [
        'Terre sainte',
        'Tes sols consacrés durent 3 s de plus et réduisent de 15 % les dégâts subis par les héros qui s’y tiennent.'
      ],
      [
        'Ferveur ardente',
        'Chaque coup reçu te donne 4 Ferveur de plus ; à 100 de Ferveur, tu entres en Exaltation : compétences à moitié prix et +15 % de dégâts pendant 6 s. Recharge : 20 s.'
      ],
      [
        'Aura de dévotion',
        'Toi et tes alliés à moins de 6 cases subissez 8 % de dégâts en moins et récupérez 1 % des PV max toutes les 2 s en combat. Non cumulable.'
      ],
      [
        'Martyr',
        'Tes alliés à moins de 6 cases subissent 20 % de dégâts en moins : tu en encaisses la moitié à leur place.'
      ],
      [
        'Lumière vengeresse',
        'Quand ton bouclier se brise, il explose : 120 % de l’Attaque aux ennemis à moins de 3 cases. Recharge : 6 s.'
      ],
      [
        'Intervention divine',
        'Une fois par combat, un coup fatal te laisse à 1 PV : 3 s d’invulnérabilité, un bouclier de 25 % de tes PV max et 15 % des PV max rendus à ton groupe proche.'
      ]
    ]
  },
  {
    id: 'assassin',
    resource: 'energy',
    icon: '⟦cls_assassin⟧',
    name: 'Assassin',
    style: 'Dagues jumelles : critiques, saignements et mobilité',
    spec: 'Critiques, saignements, téléportations et exécution',
    color: '#c48cff',
    weapon: 'dualdagger',
    weaponStats: ['crit', 'haste'],
    elements: ['shadow', 'shadow', 'shadow', 'shadow'],
    passive: {
      name: 'Pas de l’ombre',
      desc: 'Tes compétences frappent avec l’ombre : +12 % de dégâts, +30 % de plus pour la compétence 4 contre une cible sous 50 % de PV ; une compétence utilitaire renforce la suivante de 25 %. +5 % de vitesse de déplacement et +10 % de dégâts critiques.'
    },
    special: {
      id: 'veil',
      icon: '🌑',
      name: 'Voile d’ombre',
      desc: 'Invisible pendant 4 secondes : les monstres t’ignorent (pas les boss ni les boss mondiaux) et tu gagnes +30 % de vitesse. Ta prochaine compétence offensive inflige +40 % de dégâts et met fin au voile.',
      mana: 20,
      cooldown: 30
    },
    talents: [
      [
        'Venin mortel',
        'Tes saignements infligent 40 % de dégâts en plus et réduisent de 10 % les dégâts de leur cible.'
      ],
      [
        'Lames jumelles',
        'Éventail de lames lance 8 dagues, et chacune revient vers toi en frappant une seconde fois (50 %).'
      ],
      [
        'Assassinat',
        'Le coup qui suit Pas de l’ombre fait +100 % au lieu de +60 % ; si sa cible meurt dans les 3 s, Pas de l’ombre est aussitôt rechargé.'
      ],
      ['Hémorragie', 'Tes coups critiques font saigner : 35 % des dégâts du coup sur 4 s.'],
      [
        'Exécuteur',
        'Tu infliges 25 % de dégâts en plus aux ennemis sous 30 % de leurs PV ; Mille coupures achève les monstres (pas les boss) sous 15 %.'
      ],
      ['Précision mortelle', '+10 points de critique et +20 % de dégâts critiques.'],
      [
        'Danse des ombres',
        'Après une roulade, tu deviens invisible 1,5 s (comme le Voile d’ombre) et ton prochain coup est critique.'
      ],
      [
        'Lame fantôme',
        'Un double d’ombre accompagne Entaille et Mille coupures : il répète leurs coups à 40 %.'
      ],
      [
        'Venin paralysant',
        'Entaille ralentit de 40 % pendant 3 s ; les ennemis ralentis subissent 12 % de dégâts en plus de ta part.'
      ],
      [
        'Ombre meurtrière',
        'Après 3 coups critiques, ta prochaine compétence offensive fait +40 % et ne coûte pas d’Énergie. Recharge : 12 s.'
      ]
    ]
  },
  {
    id: 'elementaliste',
    resource: 'mana',
    icon: '⟦cls_elementaliste⟧',
    name: 'Élémentaliste',
    style: 'Magie élémentaire, contrôle et dégâts de zone',
    spec: 'Boule de feu, nova de givre, chaîne d’éclairs et météore',
    color: '#ff8a3d',
    weapon: 'staff',
    weaponStats: ['mastery', 'crit'],
    // Compétence 1 : feu · 2 : glace · 3 : foudre · 4 : feu.
    elements: ['fire', 'ice', 'lightning', 'fire'],
    passive: {
      name: 'Maîtrise des éléments',
      desc: 'Tes sorts sont élémentaires : le feu brûle (30 % des dégâts en plus sur 4 s), la glace ralentit de 30 % pendant 2,5 s, la foudre rebondit sur 2 ennemis proches (35 %).'
    },
    special: {
      id: 'avatar',
      icon: '🌋',
      name: 'Avatar élémentaire',
      desc: 'Pendant 10 secondes : +20 % de dégâts et compétences 30 % moins chères en mana.',
      mana: 30,
      cooldown: 60
    },
    talents: [
      [
        'Combustion',
        'Boule de feu se divise à l’impact en 3 flammèches (60 % chacune) qui filent vers les ennemis proches ; tes brûlures infligent 30 % de plus.'
      ],
      ['Météore jumeau', 'Un second météore tombe 0,6 s après le premier, à côté de lui (60 % des dégâts).'],
      [
        'Hiver éternel',
        'Nova de givre gèle 2,5 s et laisse un sol de glace 4 s qui ralentit les ennemis de 50 %.'
      ],
      [
        'Éclats de glace',
        'Un ennemi gelé ou ralenti par ta glace qui subit du feu ou de la foudre se brise : +50 % de dégâts, et des éclats (60 % de l’Attaque) frappent les ennemis à 2 cases. Une fois par gel.'
      ],
      ['Conducteur', 'Chaîne d’éclairs rebondit 3 fois de plus et ne perd plus de dégâts à chaque rebond.'],
      [
        'Électricité statique',
        'Chaque coup de foudre pose une charge statique ; à 5 charges, la cible est frappée par la foudre céleste : 300 % de l’Attaque.'
      ],
      [
        'Fusion élémentaire',
        'Lancer du feu, de la glace et de la foudre en moins de 8 s : ta prochaine compétence fait +50 % et ne coûte pas de mana.'
      ],
      [
        'Barrière de givre',
        'Sous 40 % de PV : bouclier de 20 % de tes PV max pendant 6 s, et les ennemis à moins de 3 cases sont gelés 2 s (pas les boss). Recharge : 40 s.'
      ],
      [
        'Explosion ardente',
        'Un ennemi brûlé qui meurt explose : 80 % de l’Attaque aux ennemis à moins de 3 cases, et sa brûlure se propage à eux.'
      ],
      [
        'Avatar primordial',
        'Ton Avatar élémentaire dure 4 s de plus ; pendant l’Avatar, chaque compétence libère aussi une décharge des deux autres éléments (60 % de l’Attaque autour de la cible).'
      ]
    ]
  },
  {
    id: 'invocateur',
    resource: 'mana',
    icon: '⟦cls_invocateur⟧',
    name: 'Invocateur',
    style: 'Invocations, peste et nécromancie',
    spec: 'Morts-vivants, poison qui s’accumule et armée d’os',
    color: '#a4e83c',
    // Arme de qualité Relique : le Grimoire ; ses quatre compétences sont des invocations.
    weapon: 'grimoire',
    weaponStats: ['mastery', 'haste'],
    relic: true,
    elements: ['poison', 'poison', 'poison', 'poison'],
    passive: {
      name: 'Peste noire',
      desc: 'Tes attaques et chaque coup de tes invocations posent une charge de Peste (8 au maximum, 5 s, durée renouvelée à chaque charge) : chaque charge inflige 8 % de ton Attaque par seconde. Tu ne manies que ton Grimoire, qui grandit avec toi.'
    },
    special: {
      id: 'contagion',
      icon: '☣️',
      name: 'Contagion',
      desc: 'Une vague de peste : les ennemis à moins de 7 cases reçoivent 4 charges de Peste et, pendant 8 secondes, tes invocations frappent 30 % plus vite.',
      mana: 30,
      cooldown: 40
    },
    talents: [
      ['Virulence', 'La Peste monte jusqu’à 12 charges et dure 2 secondes de plus.'],
      [
        'Nécrose',
        'Toi et tes invocations infligez 2 % de dégâts supplémentaires par charge de Peste sur la cible.'
      ],
      ['Os éternels', 'Tes invocations durent 30 % plus longtemps.'],
      [
        'Légion',
        'Tes squelettes frappent 20 % plus vite ; tes invocations infligent 10 % de dégâts supplémentaires.'
      ],
      [
        'Cadavres explosifs',
        'Une invocation qui disparaît explose : 60 % de l’Attaque et 3 charges de Peste aux ennemis à moins de 2,5 cases.'
      ],
      ['Siphon pestilentiel', 'Les dégâts de ta Peste te soignent de 10 % de leur montant.'],
      ['Carapace d’os', 'Avec au moins 2 invocations en jeu, tu subis 10 % de dégâts en moins.'],
      [
        'Pandémie',
        'Un ennemi qui meurt sous ta Peste la transmet : la moitié de ses charges passe aux ennemis à moins de 3 cases.'
      ],
      [
        'Pacte de sang',
        'Sous 35 % de PV, sacrifie ta plus ancienne invocation pour récupérer 15 % de tes PV maximum. Recharge : 40 s.'
      ],
      [
        'Moisson d’âmes',
        'Toutes les 12 charges de Peste posées, un squelette se lève gratuitement à tes côtés. Recharge : 10 s.'
      ]
    ]
  },
  {
    id: 'barde',
    resource: 'rhythm',
    icon: '⟦cls_barde⟧',
    name: 'Barde',
    style: 'Soins de groupe, chants de soutien et ondes sonores',
    spec: 'Le soigneur du groupe : il soigne en frappant et renforce ses alliés',
    color: '#ff9ad5',
    weapon: 'lute',
    weaponStats: ['healing', 'haste'],
    elements: ['harmony', 'harmony', 'harmony', 'harmony'],
    passive: {
      name: 'Écho mélodieux',
      desc: 'Chaque compétence offensive soigne l’allié le plus blessé à moins de 8 cases (toi compris) de 20 % des dégâts infligés ; chaque compétence utilitaire soigne ton groupe proche de 10 % de ses PV max. Tes soins sont augmentés de 10 %.'
    },
    special: {
      id: 'hymn',
      icon: '🎶',
      name: 'Hymne de l’Aurore',
      desc: 'Soigne toi et tes alliés à moins de 8 cases de 15 % de leurs PV maximum, puis de 3 % par seconde pendant 6 secondes ; pendant ce temps, ils infligent 10 % de dégâts en plus.',
      mana: 30,
      cooldown: 40
    },
    talents: [
      [
        'Crescendo',
        'Chaque compétence offensive augmente tes dégâts et tes soins de 4 %, jusqu’à 20 %, pendant 8 secondes.'
      ],
      ['Ballade réparatrice', 'Tes soins sont augmentés de 20 % et Chant de guérison dure 3 s de plus.'],
      [
        'Contre-chant',
        'Sous 40 % de PV, tu récupères 15 % de tes PV max et gagnes un bouclier de 15 % pendant 5 s. Recharge : 40 s.'
      ],
      [
        'Mélodie vivifiante',
        'Tes soins donnent à leur cible (toi compris) +15 % de vitesse et +8 % de dégâts pendant 5 s.'
      ],
      [
        'Dissonance',
        'Les ennemis touchés par tes compétences offensives subissent 10 % de dégâts en plus, de toi et de ton groupe, pendant 6 s.'
      ],
      [
        'Chœur',
        'Ton Écho mélodieux soigne deux alliés au lieu d’un, et rend 25 % des dégâts au lieu de 20 %.'
      ],
      [
        'Note perçante',
        'Note éclatante traverse tous les ennemis sur sa ligne, et l’allié le plus blessé récupère 6 % de ses PV max au lieu de 4 %.'
      ],
      ['Tempo', 'Chaque fois que tu dépenses 20 de Rythme, les recharges de tes compétences baissent d’1 s.'],
      [
        'Ritournelle',
        'Les soins qui dépassent les PV maximum deviennent un bouclier, jusqu’à 15 % des PV maximum de la cible pendant 6 secondes.'
      ],
      [
        'Grand final',
        'Symphonie se termine par un accord final : 300 % aux ennemis de la zone, et 15 % des PV max à ton groupe proche.'
      ]
    ]
  },
  {
    id: 'berserker',
    resource: 'blood',
    icon: '⟦cls_berserker⟧',
    name: 'Berserker',
    style: 'Corps à corps sauvage, sang versé et vol de vie',
    spec: 'Il paie ses compétences avec ses PV : plus il est blessé, plus il frappe fort',
    color: '#e0404f',
    // Arme de qualité Relique : la Grande hache.
    weapon: 'greataxe',
    weaponStats: ['mastery', 'haste'],
    relic: true,
    elements: ['blood', 'blood', 'blood', 'blood'],
    passive: {
      name: 'Soif de sang',
      desc: 'Tes compétences coûtent des PV au lieu du mana, sans jamais pouvoir te tuer. +1 % de dégâts par tranche de 2 % de PV perdus (jusqu’à +50 %). Tes compétences offensives te rendent 15 % des dégâts infligés ; une compétence utilitaire double ce vol de vie pour ta compétence offensive suivante. Tu ne manies que ta Grande hache, qui grandit avec toi.'
    },
    special: {
      id: 'rage',
      icon: '🩸',
      name: 'Rage écarlate',
      desc: 'Pendant 8 secondes, tu ne peux pas descendre sous 1 PV, tes attaques de base sont 25 % plus rapides et tes soins sont doublés. À la fin, tu perds 20 % de tes PV maximum (sans pouvoir en mourir).',
      mana: 0,
      cooldown: 60
    },
    talents: [
      [
        'Frénésie',
        'Tuer un ennemi réduit de 3 s les recharges de tes compétences, et tes attaques de base sont 15 % plus rapides pendant 5 s.'
      ],
      [
        'Cicatrices',
        'Chaque coup subi te donne une Cicatrice : +3 % de dégâts par Cicatrice, 10 au maximum, pendant 6 secondes (durée renouvelée). Un coup critique ennemi en donne 3.'
      ],
      [
        'Dernier carré',
        'Sous 20 % de PV, ta Soif de sang te rend 50 % des dégâts infligés et tu subis 20 % de dégâts en moins.'
      ],
      ['Peau de fer', 'Tu subis 1 % de dégâts en moins par tranche de 4 % de PV perdus (jusqu’à 25 %).'],
      [
        'Saignée',
        'Tes compétences offensives font saigner leurs cibles : 40 % des dégâts infligés, en plus, sur 4 secondes.'
      ],
      [
        'Curée',
        'Tu infliges 20 % de dégâts en plus aux ennemis qui saignent ; Châtiment du sang consume leurs saignements (150 % de ce qu’il leur restait à faire).'
      ],
      [
        'Sang bouillant',
        'Chaque fois que tu as dépensé 20 % de tes PV maximum pour tes compétences, ton sang explose : 200 % de l’Attaque aux ennemis à moins de 3 cases.'
      ],
      [
        'Boucherie',
        'Bond du boucher se recharge aussitôt s’il tue un ennemi, et laisse une mare de sang 4 s (60 % de l’Attaque par seconde aux ennemis dedans).'
      ],
      ['Carnage', 'Tuer un ennemi te soigne de 6 % de tes PV maximum et prolonge ta Rage écarlate de 2 s.'],
      [
        'Immortel',
        'Une fois toutes les 90 s, un coup fatal te laisse à 1 PV et déclenche une Rage écarlate de 4 secondes, sans perte de PV à la fin.'
      ]
    ]
  },
  {
    id: 'chasseur',
    resource: 'focus',
    icon: '⟦cls_chasseur⟧',
    name: 'Chasseur',
    style: 'Arc long : tirs perçants, marque de proie et faucon spectral',
    spec: 'Le tireur d’élite : il frappe de loin, marque sa proie et lâche son faucon',
    color: '#e8b65a',
    weapon: 'bow',
    weaponStats: ['crit', 'mastery'],
    elements: ['wild', 'wild', 'wild', 'wild'],
    passive: {
      name: 'Instinct du traqueur',
      desc: 'Plus ta cible est loin, plus tu frappes fort : +1 % de dégâts par case de distance, jusqu’à +15 %. Chaque compétence offensive qui touche te rend 5 de Concentration.'
    },
    special: {
      id: 'hawkeye',
      icon: '🦅',
      name: 'Œil du faucon',
      desc: 'Pendant 10 secondes : +20 % de dégâts, +10 points de critique et attaques de base 30 % plus rapides.',
      mana: 25,
      cooldown: 50
    },
    talents: [
      [
        'Tir de précision',
        'Tir perçant fait +40 % contre une cible marquée, et il est toujours critique contre une cible à plus de 8 cases.'
      ],
      [
        'Pluie torrentielle',
        'Volée de flèches tire 6 salves au lieu de 4, et ralentit les ennemis touchés de 40 %.'
      ],
      [
        'Fauconnier',
        'Après son assaut, le faucon reste 8 s à tes côtés : il fond sur la cible de ta Marque (ou l’ennemi le plus proche) toutes les 0,8 s, 60 % par serre.'
      ],
      [
        'Proie désignée',
        'Ta Marque fait subir 25 % de dégâts en plus au lieu de 15 % ; quand sa cible meurt, la Marque saute sur l’ennemi le plus proche.'
      ],
      [
        'Repli tactique',
        'Ta roulade se recharge 30 % plus vite, et la flèche qui la suit (attaque de base ou compétence) fait +60 %.'
      ],
      ['Flèches barbelées', 'Tes attaques de base font saigner : 25 % des dégâts du coup sur 4 s.'],
      [
        'Multitir',
        'Ton tir lourd décoche 7 flèches au lieu de 5, et ton tir rapide a 25 % de chance de partir en double.'
      ],
      [
        'Piège de givre',
        'Quand un ennemi arrive à moins de 2 cases de toi, un piège de givre le gèle 2 s (un boss est ralenti). Recharge : 15 s.'
      ],
      [
        'Instinct de survie',
        'Sous 35 % de PV, tu gagnes +30 % de vitesse et subis 20 % de dégâts en moins pendant 5 s. Recharge : 40 s.'
      ],
      [
        'Maître de la traque',
        'Œil du faucon dure 5 s de plus ; pendant l’Œil, chaque ennemi tué réduit toutes tes recharges de 2 s.'
      ]
    ]
  },
  {
    id: 'guerrier',
    resource: 'rage',
    icon: '⟦cls_guerrier⟧',
    name: 'Guerrier',
    style: 'Épées jumelles : combos rapides, tempête d’acier et charges',
    spec: 'Le maître d’armes : il enchaîne les coups et accumule l’Élan',
    color: '#cfdcea',
    weapon: 'dualsword',
    weaponStats: ['haste', 'power'],
    elements: ['steel', 'steel', 'steel', 'steel'],
    passive: {
      name: 'Maître d’armes',
      desc: 'Chaque coup de tes lames qui touche te donne un Élan (5 au maximum, 4 s, durée renouvelée) : +3 % de dégâts et des attaques de base 4 % plus rapides par Élan.'
    },
    special: {
      id: 'ironwill',
      icon: '🛡️',
      name: 'Volonté de fer',
      desc: 'Pendant 8 secondes : tu subis 30 % de dégâts en moins et infliges 15 % de dégâts en plus. Tu gagnes aussitôt 30 de Rage.',
      mana: 0,
      cooldown: 45
    },
    talents: [
      [
        'Lames affûtées',
        'Rafale de lames frappe 6 fois au lieu de 4 et fait saigner : 30 % des dégâts sur 4 s.'
      ],
      [
        'Œil du cyclone',
        'Tempête d’acier dure 50 % plus longtemps et attire les monstres (pas les boss) vers toi.'
      ],
      [
        'Élan imparable',
        'Charge héroïque étourdit 1,5 s les monstres touchés (un boss est affaibli) et te donne 5 Élans d’un coup.'
      ],
      ['Coup de grâce', 'Si Exécution croisée tue un ennemi, sa recharge est aussitôt remise à zéro.'],
      ['Ambidextrie', 'Tes attaques de base frappent deux fois : la seconde lame fait 40 % de la première.'],
      ['Second souffle', 'Sous 35 % de PV, tu récupères 25 % de tes PV max en 5 s. Recharge : 45 s.'],
      [
        'Fureur martiale',
        'À 5 Élans, tes compétences coûtent 30 % de Rage en moins et tes coups critiques font +25 % de dégâts.'
      ],
      [
        'Riposte',
        'Tu as 15 % de chance de parer un coup ennemi (aucun dégât) et de riposter : 150 % de l’Attaque à l’attaquant.'
      ],
      [
        'Cri de ralliement',
        'Volonté de fer protège aussi tes alliés à moins de 6 cases (15 % de dégâts en moins) et te donne 30 de Rage de plus.'
      ],
      [
        'Seigneur de guerre',
        'Chaque Élan donne aussi +2 points de critique ; à 5 Élans, tes attaques de base libèrent une onde d’acier (60 % autour de la cible, 2 cases).'
      ]
    ]
  }
]);
export const CLASS_IDS = Object.freeze(CLASSES.map(c => c.id));
// Compétences qui n'infligent pas de dégâts (postures, soins, marques) : elles ne comptent pas comme « compétences
// offensives » pour les talents. Clé : famille d'arme et numéro (0 à 3).
export const UTILITY_SKILLS = Object.freeze([
  'wildstaff:1',
  'feline:2',
  'aegis:2',
  'dualdagger:1',
  'lute:2',
  'greataxe:2',
  'bow:1'
]);
