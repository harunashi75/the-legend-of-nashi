// @ts-check
// Guilde des Aventuriers de l'Aurore : rangs (F à S), titres, renommée et contrats.
// Les contrats sont des quêtes rejouables (QUESTS, champ `contract` : le rang), toutes au niveau du héros (`scaled`) :
//  - les demandes des habitants de l'île (anciennes quêtes secondaires, CONTRACT_RANKS), rendues à leur client ;
//  - les avis de la guilde (GUILD_CONTRACTS, PNJ « guilde »), rendus à la maîtresse de guilde.
// Le tableau propose trois contrats du rang du héros, renouvelés toutes les quinze minutes ; un seul à la fois.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

export const GUILD_NAME = 'Guilde des Aventuriers de l’Aurore';
export const GUILD_MASTER = 'Maîtresse Ysolde';
// Contrats affichés au tableau, et durée d'un tableau (ms) : tous les héros changent de tableau en même temps
// (à l'heure pile, et 15, 30, 45 minutes après).
export const GUILD_BOARD_SIZE = 3;
export const GUILD_REFRESH_MS = 15 * 60 * 1000;
// Rangs : titre, genre de contrats, renommée qu'il faut avoir réunie, renommée d'un contrat de ce rang, part d'un
// niveau d'XP, multiplicateur d'or, qualité de l'équipement offert (et chance d'un cran au-dessus), couleur.
export const GUILD_RANKS = deepFreeze([
  {
    id: 'F',
    title: 'Recrue',
    tier: 'Simples',
    fame: 0,
    gain: 10,
    xpShare: 0.3,
    gold: 1,
    item: 'Peu commun',
    color: '#b8b0a4'
  },
  {
    id: 'E',
    title: 'Aventurier',
    tier: 'Standards',
    fame: 50,
    gain: 15,
    xpShare: 0.33,
    gold: 1.15,
    item: 'Peu commun',
    color: '#7ec46a'
  },
  {
    id: 'D',
    title: 'Explorateur',
    tier: 'Plus variés',
    fame: 170,
    gain: 20,
    xpShare: 0.36,
    gold: 1.3,
    item: 'Rare',
    color: '#5ab0e8'
  },
  {
    id: 'C',
    title: 'Vétéran',
    tier: 'Élites',
    fame: 370,
    gain: 30,
    xpShare: 0.39,
    gold: 1.45,
    item: 'Rare',
    color: '#b07ef0'
  },
  {
    id: 'B',
    title: 'Champion',
    tier: 'Difficiles',
    fame: 730,
    gain: 40,
    xpShare: 0.42,
    gold: 1.6,
    item: 'Épique',
    color: '#f0a040'
  },
  {
    id: 'A',
    title: 'Héros',
    tier: 'Exceptionnels',
    fame: 1290,
    gain: 50,
    xpShare: 0.45,
    gold: 1.75,
    item: 'Épique',
    color: '#f05a4a'
  },
  {
    id: 'S',
    title: 'Légende',
    tier: 'Prestigieux',
    fame: 2090,
    gain: 60,
    xpShare: 0.5,
    gold: 2,
    item: 'Épique',
    better: 0.25,
    color: '#ffd860'
  }
]);
// Demandes des habitants : rang de chaque ancienne quête secondaire (surface et Tréfonds).
export const CONTRACT_RANKS = deepFreeze({
  3: 'F',
  4: 'F',
  5: 'F',
  8: 'E',
  9: 'E',
  10: 'E',
  13: 'D',
  14: 'D',
  15: 'D',
  37: 'D',
  38: 'D',
  18: 'C',
  19: 'C',
  20: 'C',
  40: 'C',
  45: 'C',
  23: 'B',
  24: 'B',
  25: 'B',
  41: 'B',
  46: 'B',
  28: 'A',
  29: 'A',
  30: 'A',
  39: 'A',
  42: 'A',
  43: 'S',
  44: 'S'
});
// Avis de la guilde : objectifs qui se font n'importe où sur l'île, toujours à la mesure du héros.
//  - kill / loot, mobs: '*' : créatures de l'île d'au plus 5 niveaux de moins que le héros ; elite : seulement des
//    élites ; boss : un boss mondial d'au plus 10 niveaux de moins ;
//  - work : pêche (fish), herbes (herb), minerai (ore) ou repas cuisinés (cook) ;
//  - clear, instance: '*' : un donjon à sa mesure (au plus 6 niveaux de moins, ou un donjon des Tréfonds) ;
//    raid : un raid ; under : un donjon des Tréfonds.
// min : niveau à partir duquel l'avis peut être affiché (raids, boss mondiaux).
/**
 * @param {number} id
 * @param {string} contract
 * @param {string} title
 * @param {string} summary
 * @param {object[]} steps
 * @param {object} [extra]
 */
const notice = (id, contract, title, summary, steps, extra = {}) => ({
  id,
  chapter: 0,
  main: false,
  contract,
  scaled: true,
  title,
  npc: 'guilde',
  site: null,
  level: 1,
  summary,
  steps,
  reward: { text: 'Récompense de la guilde' },
  ...extra
});
export const GUILD_CONTRACTS = deepFreeze([
  // ---------------------------------------------------------------- F · Simples
  notice(
    101,
    'F',
    'Des bêtes trop près des routes',
    'Les marchands se plaignent : les bêtes sauvages s’approchent des chemins. La guilde paie pour les éloigner.',
    [
      {
        k: 'kill',
        n: 8,
        mobs: '*',
        what: 'Créature vaincue',
        text: 'Vaincre 8 créatures sauvages de ton niveau'
      }
    ]
  ),
  notice(
    102,
    'F',
    'Des herbes pour les blessés',
    'Les guérisseurs du camp manquent d’herbes pour leurs onguents. N’importe quelle plante fera l’affaire.',
    [{ k: 'work', job: 'herb', n: 6, text: 'Cueillir 6 herbes sur l’île' }]
  ),
  notice(
    103,
    'F',
    'Du poisson pour la Marmite',
    'Le cuisinier de la Marmite dorée doit nourrir tout le camp ce soir. Il lui faut du poisson frais.',
    [{ k: 'work', job: 'fish', n: 5, text: 'Pêcher 5 poissons, dans n’importe quelle eau' }]
  ),
  notice(
    104,
    'F',
    'Du minerai pour la forge',
    'Le forgeron a promis des fers neufs à la ferme et son stock de minerai est vide.',
    [{ k: 'work', job: 'ore', n: 6, text: 'Miner 6 minerais sur l’île' }]
  ),
  // ---------------------------------------------------------------- E · Standards
  notice(
    105,
    'E',
    'Trophées pour le tanneur',
    'Le tanneur du camp achète crocs, cornes et peaux. La guilde lui a promis une livraison.',
    [
      {
        k: 'loot',
        n: 6,
        mobs: '*',
        icon: '🍖',
        item: 'Trophée de chasse',
        text: 'Prendre 6 trophées sur des créatures de ton niveau'
      }
    ]
  ),
  notice(
    106,
    'E',
    'Patrouille des chemins',
    'Une caravane part demain. La guilde veut des chemins sûrs du camp jusqu’à la prochaine région.',
    [{ k: 'kill', n: 14, mobs: '*', what: 'Créature vaincue', text: 'Vaincre 14 créatures de ton niveau' }]
  ),
  notice(
    107,
    'E',
    'Le banquet des recrues',
    'La guilde fête ses nouvelles recrues. Il faut du poisson, et quelqu’un pour le cuisiner.',
    [
      { k: 'work', job: 'fish', n: 4, text: 'Pêcher 4 poissons' },
      { k: 'work', job: 'cook', n: 2, text: 'Cuisiner 2 repas (cuisinière, marmite ou cheminée)' }
    ]
  ),
  notice(
    108,
    'E',
    'La réserve de l’apothicaire',
    'L’apothicaire prépare des potions pour la saison des tempêtes : des herbes, puis du minerai pour ses fioles.',
    [
      { k: 'work', job: 'herb', n: 5, text: 'Cueillir 5 herbes' },
      { k: 'work', job: 'ore', n: 4, text: 'Miner 4 minerais' }
    ]
  ),
  // ---------------------------------------------------------------- D · Plus variés
  notice(
    109,
    'D',
    'Crocs et racines',
    'Un alchimiste de passage cherche des trophées de bêtes et des herbes fraîches pour un remède rare.',
    [
      {
        k: 'loot',
        n: 5,
        mobs: '*',
        icon: '🍖',
        item: 'Trophée de chasse',
        text: 'Prendre 5 trophées sur des créatures de ton niveau'
      },
      { k: 'work', job: 'herb', n: 4, text: 'Cueillir 4 herbes' }
    ]
  ),
  notice(
    110,
    'D',
    'Les chefs de meute',
    'Des créatures plus grosses que les autres mènent les meutes. Sans elles, les meutes se dispersent.',
    [
      {
        k: 'kill',
        n: 2,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 2 élites de ton niveau'
      }
    ]
  ),
  // ---------------------------------------------------------------- C · Élites
  notice(
    111,
    'C',
    'Prime sur les élites',
    'La guilde affiche une prime : chaque élite abattue rend les routes plus sûres pour tout le monde.',
    [
      {
        k: 'kill',
        n: 4,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 4 élites de ton niveau'
      }
    ]
  ),
  notice(
    112,
    'C',
    'Un donjon à nettoyer',
    'Des monstres sortent d’un donjon la nuit. La guilde veut qu’on aille jusqu’à son dernier boss.',
    [{ k: 'clear', instance: '*', text: 'Terminer un donjon à ta mesure (coffre du dernier boss)' }]
  ),
  notice(
    113,
    'C',
    'Élites et trophées',
    'Un collectionneur paie très cher les trophées pris sur des élites. La guilde prend sa part, toi la tienne.',
    [
      {
        k: 'kill',
        n: 3,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 3 élites de ton niveau'
      },
      {
        k: 'loot',
        n: 4,
        mobs: '*',
        icon: '🍖',
        item: 'Trophée de chasse',
        text: 'Prendre 4 trophées sur des créatures de ton niveau'
      }
    ]
  ),
  // ---------------------------------------------------------------- B · Difficiles
  notice(
    114,
    'B',
    'Un colosse sur l’île',
    'Un boss mondial terrorise sa région. La guilde n’envoie que ses meilleurs, et tu en fais partie.',
    [
      { k: 'kill', n: 1, mobs: '*', boss: true, what: 'Boss mondial vaincu', text: 'Vaincre un boss mondial' }
    ],
    { min: 10 }
  ),
  notice(
    115,
    'B',
    'Expédition double',
    'Deux donjons se sont réveillés en même temps. La guilde manque de bras : elle te confie les deux.',
    [{ k: 'clear', instance: '*', n: 2, text: 'Terminer 2 donjons à ta mesure' }]
  ),
  notice(
    116,
    'B',
    'La grande battue',
    'Les bêtes sont trop nombreuses cette saison. La guilde organise une battue et compte sur toi.',
    [
      { k: 'kill', n: 20, mobs: '*', what: 'Créature vaincue', text: 'Vaincre 20 créatures de ton niveau' },
      {
        k: 'kill',
        n: 4,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 4 élites de ton niveau'
      }
    ]
  ),
  // ---------------------------------------------------------------- A · Exceptionnels
  notice(
    117,
    'A',
    'L’assaut du raid',
    'Un raid entier menace l’île. La guilde réunit ses héros : terminer le raid, et revenir vivant.',
    [{ k: 'clear', instance: '*', raid: true, text: 'Terminer un raid' }],
    { min: 46 }
  ),
  notice(
    118,
    'A',
    'Sous nos pieds',
    'Les nains de Durgrim demandent de l’aide : un donjon des Tréfonds déborde de monstres.',
    [
      { k: 'clear', instance: '*', under: true, text: 'Terminer un donjon des Tréfonds' },
      {
        k: 'kill',
        n: 3,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 3 élites de ton niveau, à la surface'
      }
    ]
  ),
  notice(
    119,
    'A',
    'Deux colosses',
    'Deux boss mondiaux ont été aperçus. La guilde veut qu’ils tombent avant la fin de la saison.',
    [
      { k: 'kill', n: 2, mobs: '*', boss: true, what: 'Boss mondial vaincu', text: 'Vaincre 2 boss mondiaux' }
    ],
    { min: 10 }
  ),
  // ---------------------------------------------------------------- S · Prestigieux
  notice(
    120,
    'S',
    'La gloire de l’Aurore',
    'Le conseil de la guilde veut une victoire dont on parlera longtemps : un raid, puis un colosse.',
    [
      { k: 'clear', instance: '*', raid: true, text: 'Terminer un raid' },
      { k: 'kill', n: 1, mobs: '*', boss: true, what: 'Boss mondial vaincu', text: 'Vaincre un boss mondial' }
    ],
    { min: 46 }
  ),
  notice(
    121,
    'S',
    'La tournée des donjons',
    'Trois donjons, trois boss, une seule légende. Les bardes du camp attendent ton retour.',
    [{ k: 'clear', instance: '*', n: 3, text: 'Terminer 3 donjons à ta mesure' }]
  ),
  notice(
    122,
    'S',
    'Le festin des Légendes',
    'Une fois par saison, la guilde offre un festin à toute l’île. Il faut tout : la pêche, la cuisine et le gibier.',
    [
      { k: 'work', job: 'fish', n: 8, text: 'Pêcher 8 poissons' },
      { k: 'work', job: 'cook', n: 4, text: 'Cuisiner 4 repas' },
      {
        k: 'kill',
        n: 3,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 3 élites pour le gibier du festin'
      }
    ]
  ),
  notice(
    123,
    'S',
    'La chasse légendaire',
    'Les plus grands chasseurs de l’île ont laissé leur nom sur le mur de la guilde. Le tien y a sa place.',
    [
      {
        k: 'kill',
        n: 6,
        mobs: '*',
        elite: true,
        what: 'Élite vaincue',
        text: 'Vaincre 6 élites de ton niveau'
      },
      { k: 'kill', n: 1, mobs: '*', boss: true, what: 'Boss mondial vaincu', text: 'Vaincre un boss mondial' }
    ],
    { min: 10 }
  )
]);
