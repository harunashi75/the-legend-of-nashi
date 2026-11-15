// Les quatre classes : élément de leurs compétences d'armes, passif de classe, sort spécial (touche F) et dix talents.
// Le joueur équipe 5 talents au plus parmi les 10 de sa classe (un emplacement aux niveaux 1, 10, 20, 30 et 40).
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
  lightning: { name: 'Foudre', icon: '⟦el_lightning⟧', color: '#f4f07a' }
});
export const CLASSES = deepFreeze([
  {
    id: 'druide',
    icon: '⟦cls_druide⟧',
    name: 'Druide',
    style: 'Polyvalence, soins, poison et régénération',
    spec: 'Nature, poison, régénération et soutien',
    color: '#7ee36a',
    // Élément de chaque compétence d'arme (1 à 4).
    elements: ['nature', 'nature', 'nature', 'nature'],
    passive: {
      name: 'Sève vitale',
      desc: 'Tes compétences d’armes frappent avec la nature : elles empoisonnent (25 % des dégâts en plus sur 4 s) et soignent ton groupe proche de 5 % des dégâts. Tes compétences utilitaires soignent ton groupe proche de 8 % des PV max.'
    },
    special: {
      id: 'feral',
      icon: '🐆',
      name: 'Forme féline',
      desc: 'Transformation (F pour entrer ou sortir) : +15 % de dégâts, +20 % de vitesse de déplacement, +8 points de critique et attaques de base 20 % plus rapides. En forme féline, la Sève vitale ne soigne plus et tes soins sont réduits de 30 %.',
      mana: 15,
      cooldown: 1.5
    },
    talents: [
      ['Ronces sauvages', 'Les compétences offensives ont 20 % de chance d’infliger 30 % de leurs dégâts en dégâts de nature sur 5 secondes.'],
      ['Régénération naturelle', 'Restaure 1 % des PV maximum toutes les 5 secondes en combat.'],
      ['Écorce protectrice', 'Sous 40 % de PV, réduit les dégâts reçus de 15 % pendant 6 secondes. Recharge : 40 s.'],
      ['Toucher de vie', 'Augmente les soins effectués de 15 %.'],
      ['Poison rampant', 'Les coups critiques ont 25 % de chance d’infliger un poison causant 40 % des dégâts du coup sur 6 secondes.'],
      ['Bénédiction forestière', 'Soigner un allié lui accorde un bouclier de 8 % de ses PV maximum pendant 5 secondes. Recharge : 12 s par allié.'],
      ['Racines profondes', 'Les compétences offensives ont 15 % de chance de ralentir la cible de 30 % pendant 3 secondes.'],
      ['Symbiose', 'Soigner un allié restaure également au Druide 25 % des PV réellement soignés.'],
      ['Fureur sauvage', 'Inflige 12 % de dégâts supplémentaires aux ennemis affectés par ses poisons ou effets de nature.'],
      ['Avatar de la nature', 'Toutes les 45 s en combat, gagne +15 % de dégâts et +50 % de régénération naturelle pendant 8 secondes.']
    ]
  },
  {
    id: 'paladin',
    icon: '⟦cls_paladin⟧',
    name: 'Paladin',
    style: 'Défense, protection des alliés et dégâts sacrés',
    spec: 'Protection, boucliers, soins et lumière sacrée',
    color: '#ffd76a',
    elements: ['holy', 'holy', 'holy', 'holy'],
    passive: {
      name: 'Lumière sacrée',
      desc: 'Tes compétences d’armes frappent avec la lumière : chaque compétence offensive te donne un bouclier de 5 % des PV max, chaque compétence utilitaire un bouclier de 10 % à ton groupe proche. Tes soins soignent aussi tes alliés à moins de 6 cases, à 50 %.'
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
      ['Frappe sacrée', 'Les attaques normales ont 20 % de chance d’infliger 35 % de dégâts sacrés supplémentaires.'],
      ['Armure bénie', 'Augmente la Défense totale de 12 %.'],
      ['Foi inébranlable', 'Sous 35 % de PV, réduit les dégâts reçus de 20 % pendant 5 secondes. Recharge : 45 s.'],
      ['Lumière guérisseuse', 'Augmente les soins effectués de 12 % et les soins reçus de 8 %.'],
      ['Consécration', 'Après 3 compétences offensives, crée une zone sacrée pendant 5 s infligeant 15 % de l’Attaque par seconde. Recharge : 15 s.'],
      ['Gardien divin', 'Soigner un allié lui accorde un bouclier de 10 % de ses PV maximum pendant 5 secondes. Recharge : 15 s par allié.'],
      ['Jugement', 'Inflige 15 % de dégâts supplémentaires aux ennemis sous 30 % de PV.'],
      ['Aura protectrice', 'Les alliés à moins de 6 cases subissent 5 % de dégâts en moins. Effet non cumulable.'],
      ['Volonté sacrée', 'Subir un coup critique restaure 5 % des PV maximum. Recharge : 20 s.'],
      ['Intervention divine', 'Une fois par combat, un coup fatal laisse le Paladin à 1 PV et lui accorde un bouclier de 25 % des PV maximum pendant 5 secondes.']
    ]
  },
  {
    id: 'assassin',
    icon: '⟦cls_assassin⟧',
    name: 'Assassin',
    style: 'Dégâts critiques, saignements et mobilité',
    spec: 'Critiques, saignements, mobilité et exécution',
    color: '#c48cff',
    elements: ['shadow', 'shadow', 'shadow', 'shadow'],
    passive: {
      name: 'Pas de l’ombre',
      desc: 'Tes compétences d’armes frappent avec l’ombre : +12 % de dégâts, +30 % de plus pour la compétence 4 contre une cible sous 50 % de PV ; une compétence utilitaire renforce la suivante de 25 %. +5 % de vitesse de déplacement et +10 % de dégâts critiques.'
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
      ['Lames empoisonnées', 'Les attaques normales ont 20 % de chance d’infliger un poison causant 35 % des dégâts du coup sur 5 secondes.'],
      ['Précision mortelle', 'Augmente les chances de coup critique de 8 points de pourcentage.'],
      ['Danse des ombres', 'Après une esquive, augmente la vitesse de déplacement de 20 % pendant 3 secondes.'],
      ['Hémorragie', 'Les coups critiques infligent un saignement causant 30 % des dégâts du coup sur 4 secondes.'],
      ['Exécuteur', 'Inflige 20 % de dégâts supplémentaires aux ennemis sous 25 % de PV.'],
      ['Assaut implacable', 'Chaque attaque consécutive sur la même cible augmente les dégâts de 2 %, jusqu’à 10 %. Réinitialisation après 4 s sans toucher la cible.'],
      ['Instinct de survie', 'Sous 35 % de PV, gagne +20 % de vitesse de déplacement et 10 % de réduction des dégâts pendant 5 secondes. Recharge : 40 s.'],
      ['Lame fantôme', 'Les compétences offensives ont 15 % de chance de déclencher une frappe supplémentaire infligeant 40 % des dégâts initiaux.'],
      ['Prédateur solitaire', 'Inflige 12 % de dégâts supplémentaires lorsqu’un seul ennemi se trouve dans un rayon de 5 cases.'],
      ['Ombre meurtrière', 'Après 3 coups critiques, la prochaine compétence offensive inflige 30 % de dégâts supplémentaires. Recharge : 15 s.']
    ]
  },
  {
    id: 'elementaliste',
    icon: '⟦cls_elementaliste⟧',
    name: 'Élémentaliste',
    style: 'Magie élémentaire, contrôle et dégâts de zone',
    spec: 'Feu, glace, foudre et dégâts de zone',
    color: '#ff8a3d',
    // Compétence 1 : feu · 2 : glace · 3 : foudre · 4 : feu.
    elements: ['fire', 'ice', 'lightning', 'fire'],
    passive: {
      name: 'Maîtrise des éléments',
      desc: 'Tes compétences d’armes deviennent élémentaires : 1 et 4 de feu (brûlure de 30 % des dégâts sur 4 s), 2 de glace (ralentit de 30 % pendant 2,5 s), 3 de foudre (rebondit sur 2 ennemis à 35 %). Une compétence utilitaire libère une décharge autour de toi.'
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
      ['Flammes persistantes', 'Les compétences offensives ont 20 % de chance d’infliger une brûlure causant 35 % des dégâts initiaux sur 5 secondes.'],
      ['Cœur de glace', 'Les compétences offensives ont 20 % de chance de ralentir la cible de 30 % pendant 3 secondes.'],
      ['Surcharge électrique', 'Les coups critiques ont 20 % de chance de déclencher un éclair supplémentaire infligeant 40 % des dégâts du coup.'],
      ['Affinité élémentaire', 'Augmente les dégâts des effets de feu, glace et foudre de 15 %.'],
      ['Explosion ardente', 'Lorsqu’un ennemi brûlé meurt, il explose et inflige 50 % de l’Attaque aux ennemis dans un rayon de 3 cases.'],
      ['Barrière de givre', 'Sous 40 % de PV, gagne un bouclier de 15 % des PV maximum pendant 5 secondes. Recharge : 40 s.'],
      ['Chaîne d’éclairs', 'Les compétences offensives ont 15 % de chance de propager un éclair à 2 ennemis proches, infligeant 25 % des dégâts initiaux à chacun.'],
      ['Gel profond', 'Inflige 15 % de dégâts supplémentaires aux ennemis ralentis par ses effets de glace.'],
      ['Concentration arcanique', 'Chaque troisième compétence offensive coûte 50 % de mana en moins.'],
      ['Tempête élémentaire', 'Toutes les 5 compétences offensives, déclenche une explosion infligeant 80 % de l’Attaque aux ennemis dans un rayon de 4 cases. Recharge : 12 s.']
    ]
  }
]);
export const CLASS_IDS = Object.freeze(CLASSES.map(c => c.id));
// Compétences d'armes qui n'infligent pas de dégâts (postures, ruées, concentration) : elles ne comptent pas
// comme « compétences offensives » pour les talents. Clé : famille d'arme et numéro (0 à 3).
export const UTILITY_SKILLS = Object.freeze(['sword:2', 'dualsword:2', 'axe:2', 'dualdagger:2', 'staff:2', 'shield:3']);
