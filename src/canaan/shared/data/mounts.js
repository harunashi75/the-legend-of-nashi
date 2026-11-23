// @ts-check
// Montures du jeu de base. Chaque monture : espèce (species : sa silhouette, scripts/mount-art.js), qualité, couleurs
// et, selon d'où elle vient :
//   shop + price : vendue par un marchand de montures, une fois par personnage, contre de l'or ;
//   drop : { sources, chance } : trouvée (mêmes sources que la garde-robe), jamais deux fois.
// coat : [clair, base, ombre, profond] · mane : crins, crinière ou second ton [clair, sombre] · sock : pattes, bec ou
// détail clair · blanket : tapis de selle · glow : lueur (facultative) · hover : flotte au-dessus du sol.
import { deepFreeze } from '../freeze.js';

// Vitesse en selle (%, dans le monde ouvert) : la même pour toutes les montures, selon la selle équipée (indice de
// qualité dans GEAR_RARITIES : 0 sans selle, 1 Peu commun … 5 Mythique). Les selles se cousent au travail du cuir.
export const MOUNT_SADDLE_SPEED = deepFreeze([40, 50, 60, 70, 80, 100]);

// Marchands de montures du jeu de base : nom, lieu (onglet Montures) et phrase d'accueil.
export const MOUNT_SHOPS = deepFreeze({
  menagerie: {
    title: 'La Ménagerie de l’Aurore — Oriane',
    source: 'Oriane, Ménagerie du Camp de l’Aurore',
    far: 'Parle à Oriane, à la Ménagerie du Camp de l’Aurore, pour acheter une monture.',
    quote:
      '« Poil, plume, carapace… ou balai : j’ai de quoi faire courir tout Canaan ! Laquelle t’emmène ? » Touche de la monture : {touche}.'
  }
});

export const BASE_MOUNTS = deepFreeze([
  {
    id: 'poney',
    name: 'Poney des Prés',
    species: 'horse',
    rarity: 'Peu commun',
    shop: 'menagerie',
    price: 1200,
    coat: ['#e8c088', '#c89458', '#9a6a38', '#5e3e1e'],
    mane: ['#fff2d8', '#e0c8a0'],
    sock: '#fff6e4',
    blanket: '#4a8a4a',
    desc: 'Court sur pattes, gourmand et têtu : la première monture de bien des aventuriers.'
  },
  {
    id: 'sanglier',
    name: 'Sanglier Trotteur',
    species: 'boar',
    rarity: 'Peu commun',
    shop: 'menagerie',
    price: 1800,
    coat: ['#8a6a50', '#664a36', '#4a3426', '#2c1e16'],
    mane: ['#3e2c22', '#241812'],
    sock: '#f0e6cc',
    blanket: '#a8442a',
    desc: 'Il fonce droit devant. Pour tourner, il faut négocier.'
  },
  {
    id: 'lezard',
    name: 'Varan des Dunes',
    species: 'lizard',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 3500,
    coat: ['#e8d088', '#c8a450', '#967430', '#5a441a'],
    mane: ['#e8743a', '#a8442a'],
    sock: '#f4e8b8',
    blanket: '#2e7a8a',
    desc: 'Il court sur le sable brûlant sans jamais s’y enfoncer, et dort au soleil tout le reste du temps.'
  },
  {
    id: 'chameau',
    name: 'Chameau des Caravanes',
    species: 'camel',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 4000,
    coat: ['#ecc894', '#cc9c62', '#9c7040', '#624222'],
    mane: ['#a87444', '#7a5230'],
    sock: '#e0b880',
    blanket: '#b8323a',
    desc: 'Deux bosses, une place confortable au milieu, et un avis sur tout.'
  },
  {
    id: 'cerf',
    name: 'Grand Cerf des Bois',
    species: 'stag',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 4500,
    coat: ['#c8925a', '#a06a3c', '#744a28', '#462c16'],
    mane: ['#f0dcb8', '#c8a878'],
    sock: '#5e3c22',
    blanket: '#3e7a3e',
    desc: 'Le roi de la Forêt ancienne accepte parfois un cavalier, s’il sait se taire.'
  },
  {
    id: 'grenouille',
    name: 'Rainette du Marais',
    species: 'frog',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 5000,
    coat: ['#a8e060', '#68b03c', '#428028', '#24501a'],
    mane: ['#f4f0a8', '#d8c860'],
    sock: '#f08a3a',
    blanket: '#7a4aa8',
    desc: 'Grosse comme un bœuf. Elle ne court pas : elle bondit, et toi avec.'
  },
  {
    id: 'loup',
    name: 'Loup des Neiges',
    species: 'wolf',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 5500,
    coat: ['#f2f6fa', '#c8d2de', '#94a2b4', '#5a6678'],
    mane: ['#ffffff', '#aab6c6'],
    sock: '#eef4fa',
    blanket: '#2a5a9a',
    desc: 'Descendu des montagnes un soir de tempête, il n’a plus quitté le camp.'
  },
  {
    id: 'casoar',
    name: 'Casoar des Sables',
    species: 'bird',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 6000,
    coat: ['#4a5a78', '#2e3a54', '#1e2638', '#121722'],
    mane: ['#3ac0e0', '#1a7aa8'],
    sock: '#c8a878',
    crest: '#e8b040',
    blanket: '#d8742a',
    desc: 'Deux pattes infatigables, un casque d’os et un très mauvais caractère.'
  },
  {
    id: 'tortue',
    name: 'Tortue Moussue',
    species: 'turtle',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 6500,
    coat: ['#b8d080', '#86a452', '#5c7836', '#344a1e'],
    mane: ['#b08858', '#7a5634'],
    sock: '#8ac84a',
    blanket: '#8a5a2a',
    desc: 'Un vrai jardin pousse sur sa carapace. Étonnamment rapide, quand on lui promet une salade.'
  },
  {
    id: 'ours',
    name: 'Ours des Cavernes',
    species: 'bear',
    rarity: 'Rare',
    shop: 'menagerie',
    price: 8000,
    coat: ['#9a6a44', '#744a2c', '#52321c', '#301c0e'],
    mane: ['#c89a6a', '#8a5e38'],
    sock: '#402816',
    blanket: '#2e6a5a',
    desc: 'Chaud, large et moelleux. Ne le réveille pas en hiver.'
  },
  {
    id: 'scarabee',
    name: 'Scarabée Royal',
    species: 'beetle',
    rarity: 'Épique',
    shop: 'menagerie',
    price: 15000,
    coat: ['#7af0d0', '#2aa88a', '#1a6e6a', '#0e3e44'],
    mane: ['#f0d060', '#b88a28'],
    sock: '#1e3036',
    blanket: '#6a2a7a',
    desc: 'Sa carapace change de couleur au soleil ; les anciens rois du Désert en ornaient leurs couronnes.'
  },
  {
    id: 'tigre',
    name: 'Tigre des Brumes',
    species: 'tiger',
    rarity: 'Épique',
    shop: 'menagerie',
    price: 18000,
    coat: ['#ffb85a', '#e88a30', '#b05e1c', '#6a3410'],
    mane: ['#fff4e0', '#e8d8c0'],
    stripe: '#2e1a10',
    sock: '#fff0d8',
    blanket: '#1e4a5a',
    desc: 'On ne l’entend pas venir. On ne le voit pas partir non plus.'
  },
  {
    id: 'araignee',
    name: 'Tisse-Nuit',
    species: 'spider',
    rarity: 'Épique',
    shop: 'menagerie',
    price: 20000,
    coat: ['#6a5a8a', '#443860', '#2c2440', '#181224'],
    mane: ['#c87af0', '#8a3ac8'],
    sock: '#241c36',
    eye: '#ff5ac8',
    blanket: '#2a8a6a',
    glow: '#c87af0',
    desc: 'Huit pattes, huit yeux et un cœur tendre. Les autres voyageurs te laissent volontiers passer.'
  },
  {
    id: 'tapis',
    name: 'Tapis Volant',
    species: 'carpet',
    rarity: 'Épique',
    shop: 'menagerie',
    price: 25000,
    hover: true,
    coat: ['#e8485a', '#b82a44', '#841a34', '#4e0e20'],
    mane: ['#ffe08a', '#d8a040'],
    sock: '#3a6ac8',
    blanket: '#3a6ac8',
    desc: 'Tissé dans les caravanes du Désert oublié. Merci de t’essuyer les bottes avant de monter.'
  },
  {
    id: 'balai',
    name: 'Balai de Sorcière',
    species: 'broom',
    rarity: 'Épique',
    shop: 'menagerie',
    price: 28000,
    hover: true,
    coat: ['#b07a48', '#80542e', '#58381e', '#341e0e'],
    mane: ['#f0c860', '#b88a30'],
    sock: '#8a3ac8',
    blanket: '#8a3ac8',
    glow: '#b8f07a',
    desc: 'Il balaie la concurrence. Chapeau pointu non fourni.'
  },
  {
    id: 'renard',
    name: 'Renard Boréal',
    species: 'fox',
    rarity: 'Légendaire',
    shop: 'menagerie',
    price: 60000,
    coat: ['#e0faff', '#8ad8f0', '#4a9ac8', '#285a8a'],
    mane: ['#ffffff', '#b8a0ff'],
    sock: '#f4ffff',
    blanket: '#5a3aa8',
    glow: '#8ae0ff',
    desc: 'Ses trois queues dansent comme les aurores de la Forêt enchantée.'
  },
  {
    id: 'cauchemar',
    name: 'Cauchemar de Braise',
    species: 'nightmare',
    rarity: 'Légendaire',
    drop: { sources: ['raid'], chance: 0.02 },
    source: 'Boss de raid',
    coat: ['#4a3a3e', '#2c2226', '#1c1518', '#0e0a0c'],
    mane: ['#ffd25a', '#f0581e'],
    sock: '#f0581e',
    blanket: '#5a1218',
    glow: '#ff7a2a',
    desc: 'Crins de flammes, sabots de braise : il galope dans les rêves de ceux qui ont vu un raid de trop près.'
  },
  {
    id: 'drake',
    name: 'Drake Écarlate',
    species: 'dragon',
    rarity: 'Légendaire',
    drop: { sources: ['worldBoss'], chance: 0.02 },
    source: 'Boss mondiaux',
    coat: ['#f0684a', '#c03a2e', '#8a2222', '#501216'],
    mane: ['#ffd88a', '#e09a40'],
    sock: '#f0e0c0',
    blanket: '#2a2a44',
    desc: 'Trop jeune pour t’emporter dans le ciel, assez grand pour croire qu’il vole.'
  },
  {
    id: 'nuage',
    name: 'Petit Nuage',
    species: 'cloud',
    rarity: 'Légendaire',
    drop: { sources: ['secretChest', 'secretBoss'], chance: 0.04 },
    source: 'Coffres secrets et boss cachés',
    hover: true,
    coat: ['#ffffff', '#eaf2fc', '#c4d6ee', '#94aed0'],
    mane: ['#ffe8a0', '#f0c0e0'],
    sock: '#ffffff',
    blanket: '#8ac0f0',
    glow: '#dceaff',
    desc: 'Un nuage tombé du ciel et resté par amitié. Il pleut un peu quand il est triste.'
  }
]);
