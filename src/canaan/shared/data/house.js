// @ts-check
// Pièces intérieures : catalogue des meubles (sans leur dessin), meubles fixes et habitants de chaque pièce. Le dessin des meubles est dans scripts/house/render.js.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.
import { deepFreeze } from '../freeze.js';

// Meubles : nom, couche (floor, rug, wall, curtain), taille en cases (w × h),
// turn (true : quart de tour, la place au sol pivote ; 'self' : quatre orientations dessinées ; sinon miroir),
// back (contre le mur du fond), fire (on y cuisine), light (éclaire la pièce).
export const HOUSE_FURNITURE = deepFreeze({
  lit: {
    name: 'Lit',
    layer: 'floor',
    w: 1,
    h: 2,
    turn: true
  },
  lit_double: {
    name: 'Grand lit',
    layer: 'floor',
    w: 2,
    h: 2,
    turn: true
  },
  table: {
    name: 'Table',
    layer: 'floor',
    w: 2,
    h: 1,
    turn: true
  },
  table_ronde: {
    name: 'Table ronde',
    layer: 'floor',
    w: 1,
    h: 1
  },
  chaise: {
    name: 'Chaise',
    layer: 'floor',
    w: 1,
    h: 1,
    // Quatre orientations dessinées à la main : de face, de profil (gauche, droite) et de dos.
    turn: 'self'
  },
  banc: {
    name: 'Banc',
    layer: 'floor',
    w: 2,
    h: 1,
    turn: true
  },
  armoire: {
    name: 'Armoire',
    layer: 'floor',
    w: 1,
    h: 1
  },
  bibliotheque: {
    name: 'Bibliothèque',
    layer: 'floor',
    w: 2,
    h: 1,
    back: true
  },
  coffre: {
    name: 'Coffre',
    layer: 'floor',
    w: 1,
    h: 1,
    turn: true
  },
  commode: {
    name: 'Commode',
    layer: 'floor',
    w: 1,
    h: 1
  },
  cuisiniere: {
    name: 'Cuisinière',
    layer: 'floor',
    w: 1,
    h: 1,
    fire: true
  },
  cheminee: {
    name: 'Cheminée',
    layer: 'floor',
    w: 2,
    h: 1,
    back: true,
    fire: true
  },
  tonneau: {
    name: 'Tonneau',
    layer: 'floor',
    w: 1,
    h: 1
  },
  plante: {
    name: 'Grande plante',
    layer: 'floor',
    w: 1,
    h: 1
  },
  pot_fleurs: {
    name: 'Pot de fleurs',
    layer: 'floor',
    w: 1,
    h: 1
  },
  lampe: {
    name: 'Lampe',
    layer: 'floor',
    w: 1,
    h: 1,
    light: '#ffd890'
  },
  aquarium: {
    name: 'Aquarium',
    layer: 'floor',
    w: 1,
    h: 1
  },
  // Tapis : sous les meubles, on marche dessus.
  tapis: {
    name: 'Tapis rouge',
    layer: 'rug',
    w: 2,
    h: 2,
    turn: true
  },
  tapis_rond: {
    name: 'Tapis rond',
    layer: 'rug',
    w: 2,
    h: 2
  },
  tapis_long: {
    name: 'Tapis long',
    layer: 'rug',
    w: 3,
    h: 1,
    turn: true
  },
  // Bibelots et souvenirs.
  mouton: {
    name: 'Petit mouton',
    layer: 'floor',
    w: 1,
    h: 1
  },
  figurine: {
    name: 'Le petit voleur',
    layer: 'floor',
    w: 1,
    h: 1
  },
  lanterne: {
    name: 'Lueur d’Ilian',
    layer: 'floor',
    w: 1,
    h: 1,
    light: '#bfe8ff'
  },
  tableau: {
    name: 'L’oiseau d’ombre',
    layer: 'wall',
    w: 1,
    h: 2
  },
  feuille: {
    name: 'Feuille éternelle',
    layer: 'floor',
    w: 1,
    h: 1,
    light: '#ffd84a'
  },
  bouteille: {
    name: 'Bouteille de vent',
    layer: 'floor',
    w: 1,
    h: 1
  },
  dragon: {
    name: 'Petit dragon',
    layer: 'floor',
    w: 1,
    h: 1
  },
  // Décoration murale : sur le mur du fond.
  fenetre: {
    name: 'Fenêtre',
    layer: 'wall',
    w: 1,
    h: 2,
    light: '#e8f4ff'
  },
  grande_fenetre: {
    name: 'Grande fenêtre',
    layer: 'wall',
    w: 2,
    h: 2,
    light: '#e8f4ff'
  },
  cadre: {
    name: 'Cadre',
    layer: 'wall',
    w: 1,
    h: 2
  },
  grand_tableau: {
    name: 'Grand tableau',
    layer: 'wall',
    w: 2,
    h: 2
  },
  horloge: {
    name: 'Horloge',
    layer: 'wall',
    w: 1,
    h: 2
  },
  etagere: {
    name: 'Étagère',
    layer: 'wall',
    w: 2,
    h: 2
  },
  trophee: {
    name: 'Trophée de chasse',
    layer: 'wall',
    w: 1,
    h: 2
  },
  miroir: {
    name: 'Miroir',
    layer: 'wall',
    w: 1,
    h: 2
  },
  rideaux: {
    name: 'Rideaux rouges',
    layer: 'curtain',
    w: 1,
    h: 2
  },
  rideaux_bleus: {
    name: 'Rideaux bleus',
    layer: 'curtain',
    w: 1,
    h: 2
  },
  comptoir: {
    name: 'Comptoir',
    layer: 'floor',
    w: 3,
    h: 1,
    turn: true
  },
  presentoir: {
    name: 'Présentoir à potions',
    layer: 'floor',
    w: 2,
    h: 1,
    back: true
  },
  caisse: {
    name: 'Caisse de marchandises',
    layer: 'floor',
    w: 1,
    h: 1,
    turn: true
  },
  marmite: {
    name: 'Grande marmite',
    layer: 'floor',
    w: 1,
    h: 1,
    fire: true
  },
  sacs: {
    name: 'Sacs de grain',
    layer: 'floor',
    w: 1,
    h: 1
  },
  casseroles: {
    name: 'Casseroles suspendues',
    layer: 'wall',
    w: 2,
    h: 2
  },
  herbes: {
    name: 'Herbes et jambons',
    layer: 'wall',
    w: 1,
    h: 2
  },
  // ---- Meubles des elfes, des nains et de la ferme (intérieurs de Sylvaëlle, de Durgrim et de la grange).
  trone: {
    name: 'Trône de la Reine',
    layer: 'floor',
    w: 1,
    h: 1
  },
  harpe: {
    name: 'Harpe elfique',
    layer: 'floor',
    w: 1,
    h: 1
  },
  telescope: {
    name: 'Télescope',
    layer: 'floor',
    w: 1,
    h: 1
  },
  autel: {
    name: 'Autel de la Lune',
    layer: 'floor',
    w: 2,
    h: 1,
    light: '#d8e4ff'
  },
  metier: {
    name: 'Métier à tisser',
    layer: 'floor',
    w: 2,
    h: 1
  },
  mannequin: {
    name: 'Mannequin de couture',
    layer: 'floor',
    w: 1,
    h: 1
  },
  rack_armes: {
    name: 'Râtelier d’armes',
    layer: 'wall',
    w: 1,
    h: 2
  },
  banniere_elfe: {
    name: 'Bannière de Sylvaëlle',
    layer: 'wall',
    w: 1,
    h: 2
  },
  banniere_naine: {
    name: 'Bannière de Durgrim',
    layer: 'wall',
    w: 1,
    h: 2
  },
  enclume: {
    name: 'Enclume',
    layer: 'floor',
    w: 1,
    h: 1
  },
  lingots: {
    name: 'Pile de lingots d’or',
    layer: 'floor',
    w: 1,
    h: 1
  },
  foin: {
    name: 'Botte de foin',
    layer: 'floor',
    w: 1,
    h: 1
  },
  nichoir_poules: {
    name: 'Nichoirs à poules',
    layer: 'floor',
    w: 2,
    h: 1
  },
  statue_elfe: {
    name: 'Statue elfique',
    layer: 'floor',
    w: 1,
    h: 1,
    light: '#bfffee'
  },
  tableau_contrats: {
    name: 'Tableau des contrats',
    layer: 'wall',
    w: 3,
    h: 2
  },
  banniere_guilde: {
    name: 'Bannière de la guilde',
    layer: 'wall',
    w: 1,
    h: 2
  },
  pilier_nain: {
    name: 'Pilier de pierre runique',
    layer: 'floor',
    w: 1,
    h: 1,
    light: '#ffb060'
  }
});
// Agencements communs des refuges : cabane en rondins et maison de terre crue (désert).
const CABIN = [
  ['lit', 1, 2],
  ['coffre', 2, 2],
  ['cheminee', 4, 2],
  ['tonneau', 8, 2],
  ['sacs', 9, 2],
  ['trophee', 2, 0],
  ['fenetre', 7, 0],
  ['herbes', 9, 0],
  ['tapis', 3, 4],
  ['table', 3, 5],
  ['chaise', 2, 5, 3],
  ['chaise', 5, 5, 1],
  ['banc', 7, 6],
  ['lampe', 9, 5]
];
const ADOBE = [
  ['lit', 1, 2],
  ['pot_fleurs', 2, 2],
  ['cuisiniere', 4, 2],
  ['marmite', 5, 2],
  ['tonneau', 8, 2],
  ['sacs', 9, 2],
  ['fenetre', 2, 0],
  ['herbes', 7, 0],
  ['cadre', 9, 0],
  ['tapis_rond', 3, 4],
  ['table_ronde', 4, 5],
  ['chaise', 3, 5, 3],
  ['chaise', 5, 5, 1],
  ['plante', 9, 7],
  ['lampe', 1, 6]
];
// Meubles fixes de chaque pièce : [meuble, x, y, orientation] en cases de la pièce.
export const HOUSE_ROOM_FURNITURE = deepFreeze({
  // Chaumière des Glycines : la tisserande et son petit-fils (grand lit, lit d'enfant, cheminée, métier à tisser).
  maison: [
    ['lit_double', 1, 2],
    ['commode', 3, 2],
    ['cheminee', 5, 2],
    ['bibliotheque', 9, 2],
    ['armoire', 12, 2],
    ['lit', 13, 2],
    ['coffre', 13, 4],
    ['fenetre', 2, 0],
    ['rideaux', 2, 0],
    ['herbes', 4, 0],
    ['cadre', 8, 0],
    ['fenetre', 10, 0],
    ['rideaux', 10, 0],
    ['horloge', 12, 0],
    ['tapis_rond', 3, 5],
    ['table_ronde', 4, 6],
    ['chaise', 3, 6, 3],
    ['chaise', 5, 6, 1],
    ['metier', 10, 5],
    ['lampe', 12, 5],
    ['tonneau', 1, 6],
    ['plante', 1, 8],
    ['tapis_long', 6, 8],
    ['mouton', 12, 8],
    ['pot_fleurs', 13, 8]
  ],
  echoppe: [
    ['presentoir', 1, 2],
    ['presentoir', 10, 2],
    ['etagere', 5, 0],
    ['fenetre', 3, 0],
    ['fenetre', 8, 0],
    ['horloge', 9, 0],
    ['comptoir', 5, 4],
    ['pot_fleurs', 4, 2],
    ['caisse', 8, 2],
    ['tonneau', 1, 6],
    ['sacs', 2, 7],
    ['caisse', 11, 6],
    ['coffre', 10, 7],
    ['tapis_long', 5, 6],
    ['lampe', 11, 4]
  ],
  marmite: [
    ['cheminee', 1, 2],
    ['cuisiniere', 4, 2],
    ['cuisiniere', 5, 2],
    ['marmite', 7, 2],
    ['tonneau', 10, 2],
    ['tonneau', 11, 2],
    ['sacs', 11, 3],
    ['casseroles', 4, 0],
    ['herbes', 7, 0],
    ['fenetre', 9, 0],
    ['herbes', 11, 0],
    ['table', 3, 5],
    ['chaise', 2, 5, 3],
    ['chaise', 5, 5, 1],
    ['table', 8, 5],
    ['chaise', 7, 5, 3],
    ['chaise', 10, 5, 1],
    ['pot_fleurs', 1, 7],
    ['lampe', 11, 7]
  ],
  aubepines: [
    ['lit', 1, 2],
    ['commode', 2, 2],
    ['bibliotheque', 6, 2],
    ['armoire', 9, 2],
    ['fenetre', 3, 0],
    ['rideaux', 3, 0],
    ['cadre', 5, 0],
    ['horloge', 8, 0],
    ['tapis_rond', 3, 4],
    ['table_ronde', 4, 5],
    ['chaise', 3, 5, 3],
    ['chaise', 5, 5, 1],
    ['plante', 1, 7],
    ['pot_fleurs', 9, 7],
    ['lampe', 9, 5]
  ],
  puits: [
    ['lit_double', 1, 2],
    ['commode', 3, 2],
    ['cuisiniere', 8, 2],
    ['tonneau', 9, 2],
    ['grande_fenetre', 4, 0],
    ['rideaux_bleus', 4, 0],
    ['rideaux_bleus', 5, 0],
    ['grand_tableau', 6, 0],
    ['tapis', 5, 4],
    ['table', 5, 5],
    ['chaise', 4, 5, 3],
    ['chaise', 7, 5, 1],
    ['coffre', 1, 6],
    ['plante', 9, 7],
    ['aquarium', 1, 7]
  ],
  chene: CABIN,
  clairieres: CABIN,
  oasis: ADOBE,
  dunes: ADOBE,
  pilotis: [
    ['lit', 1, 2],
    ['tonneau', 2, 2],
    ['cheminee', 4, 2],
    ['aquarium', 8, 2],
    ['sacs', 9, 2],
    ['fenetre', 2, 0],
    ['herbes', 7, 0],
    ['trophee', 9, 0],
    ['tapis', 3, 4],
    ['table', 3, 5],
    ['chaise', 2, 5, 3],
    ['chaise', 5, 5, 1],
    ['banc', 7, 6],
    ['lampe', 9, 5]
  ],
  rousses: [
    ['lit', 1, 2],
    ['commode', 2, 2],
    ['cheminee', 4, 2],
    ['tonneau', 8, 2],
    ['sacs', 9, 2],
    ['fenetre', 7, 0],
    ['cadre', 2, 0],
    ['herbes', 9, 0],
    ['tapis_rond', 3, 4],
    ['table_ronde', 4, 5],
    ['chaise', 3, 5, 3],
    ['chaise', 5, 5, 1],
    ['plante', 9, 7],
    ['lampe', 1, 6]
  ],
  // Sylvaëlle.
  sylv_palais: [
    ['grande_fenetre', 2, 0],
    ['rideaux', 2, 0],
    ['banniere_elfe', 5, 0],
    ['miroir', 7, 0],
    ['banniere_elfe', 11, 0],
    ['grande_fenetre', 13, 0],
    ['rideaux', 14, 0],
    ['trone', 8, 2],
    ['statue_elfe', 6, 2],
    ['statue_elfe', 10, 2],
    ['harpe', 4, 2],
    ['plante', 1, 2],
    ['plante', 15, 2],
    ['bibliotheque', 13, 2],
    ['tapis_long', 8, 4],
    ['tapis_long', 8, 6],
    ['table', 12, 6],
    ['chaise', 11, 6, 3],
    ['chaise', 14, 6, 1],
    ['coffre', 1, 6],
    ['pot_fleurs', 1, 9],
    ['pot_fleurs', 15, 9],
    ['lampe', 4, 8],
    ['lampe', 12, 8],
    ['statue_elfe', 2, 4]
  ],
  sylv_taverne: [
    ['fenetre', 2, 0],
    ['etagere', 5, 0],
    ['banniere_elfe', 8, 0],
    ['fenetre', 10, 0],
    ['tonneau', 1, 2],
    ['tonneau', 2, 2],
    ['comptoir', 4, 3],
    ['cheminee', 8, 2],
    ['tonneau', 11, 2],
    ['harpe', 10, 2],
    ['table_ronde', 2, 5],
    ['chaise', 1, 5, 3],
    ['chaise', 3, 5, 1],
    ['table_ronde', 9, 5],
    ['chaise', 8, 5, 3],
    ['chaise', 10, 5, 1],
    ['plante', 11, 7],
    ['lampe', 1, 7],
    ['tapis_rond', 6, 5]
  ],
  sylv_armurerie: [
    ['rack_armes', 2, 0],
    ['rack_armes', 4, 0],
    ['fenetre', 6, 0],
    ['rack_armes', 8, 0],
    ['rack_armes', 10, 0],
    ['enclume', 2, 3],
    ['presentoir', 9, 2],
    ['presentoir', 10, 2],
    ['tonneau', 1, 2],
    ['comptoir', 5, 3],
    ['caisse', 1, 6],
    ['coffre', 11, 6],
    ['tapis_long', 6, 5],
    ['lampe', 11, 4],
    ['plante', 1, 7]
  ],
  sylv_couture: [
    ['fenetre', 3, 0],
    ['rideaux', 3, 0],
    ['cadre', 6, 0],
    ['banniere_elfe', 9, 0],
    ['metier', 2, 2],
    ['mannequin', 5, 2],
    ['mannequin', 6, 2],
    ['mannequin', 7, 2],
    ['armoire', 10, 2],
    ['table', 3, 5],
    ['chaise', 2, 5, 3],
    ['tapis_rond', 7, 4],
    ['sacs', 11, 5],
    ['pot_fleurs', 1, 7],
    ['lampe', 11, 7]
  ],
  sylv_tour: [
    ['grand_tableau', 2, 0],
    ['grande_fenetre', 5, 0],
    ['grande_fenetre', 8, 0],
    ['bibliotheque', 1, 2],
    ['bibliotheque', 2, 2],
    ['telescope', 6, 2],
    ['coffre', 10, 2],
    ['lampe', 11, 2],
    ['table', 9, 4],
    ['chaise', 8, 4, 3],
    ['lit', 1, 5],
    ['tapis_rond', 5, 5],
    ['plante', 11, 7]
  ],
  sylv_temple: [
    ['banniere_elfe', 2, 0],
    ['grande_fenetre', 5, 0],
    ['banniere_elfe', 10, 0],
    ['statue_elfe', 2, 2],
    ['autel', 5, 2],
    ['statue_elfe', 10, 2],
    ['tapis_long', 6, 4],
    ['banc', 2, 5],
    ['banc', 9, 5],
    ['plante', 1, 7],
    ['plante', 11, 7],
    ['lampe', 4, 3],
    ['lampe', 8, 3]
  ],
  sylv_maison: [
    ['fenetre', 2, 0],
    ['rideaux', 2, 0],
    ['cadre', 5, 0],
    ['fenetre', 9, 0],
    ['lit', 1, 2],
    ['commode', 2, 2],
    ['cheminee', 5, 2],
    ['bibliotheque', 9, 2],
    ['harpe', 11, 2],
    ['tapis_rond', 4, 4],
    ['table_ronde', 5, 5],
    ['chaise', 4, 5, 3],
    ['chaise', 6, 5, 1],
    ['plante', 1, 7],
    ['pot_fleurs', 11, 7],
    ['lampe', 9, 6]
  ],
  sylv_racines: [
    ['herbes', 2, 0],
    ['fenetre', 5, 0],
    ['herbes', 9, 0],
    ['lit', 1, 2],
    ['plante', 3, 2],
    ['cuisiniere', 6, 2],
    ['marmite', 7, 2],
    ['tonneau', 10, 2],
    ['tapis', 4, 4],
    ['table', 4, 5],
    ['chaise', 3, 5, 3],
    ['chaise', 6, 5, 1],
    ['plante', 11, 5],
    ['pot_fleurs', 1, 7],
    ['plante', 11, 7],
    ['lampe', 9, 6]
  ],
  // Ferme du camp.
  // Maison de la Guilde : le tableau des contrats au-dessus du comptoir de la maîtresse, bannières, cheminée,
  // bibliothèque des registres et deux tables pour les aventuriers.
  guilde: [
    ['fenetre', 1, 0],
    ['trophee', 2, 0],
    ['banniere_guilde', 4, 0],
    ['tableau_contrats', 6, 0],
    ['banniere_guilde', 10, 0],
    ['rack_armes', 12, 0],
    ['fenetre', 13, 0],
    ['cheminee', 1, 2],
    ['bibliotheque', 12, 2],
    ['comptoir', 6, 4],
    ['plante', 1, 4],
    ['tonneau', 13, 4],
    ['table', 2, 6],
    ['chaise', 1, 6, 3],
    ['chaise', 4, 6, 1],
    ['table', 11, 6],
    ['chaise', 10, 6, 3],
    ['chaise', 13, 6, 1],
    ['tapis_long', 6, 6],
    ['lampe', 1, 8],
    ['lampe', 13, 8]
  ],
  grange: [
    ['trophee', 3, 0],
    ['herbes', 6, 0],
    ['fenetre', 9, 0],
    ['foin', 1, 2],
    ['foin', 2, 2],
    ['foin', 1, 3],
    ['sacs', 4, 2],
    ['tonneau', 10, 2],
    ['caisse', 11, 2],
    ['foin', 12, 2],
    ['foin', 13, 2],
    ['foin', 13, 3],
    ['banc', 3, 6],
    ['foin', 11, 6],
    ['coffre', 1, 7],
    ['lampe', 13, 7]
  ],
  poulailler: [
    ['fenetre', 5, 0],
    ['herbes', 8, 0],
    ['nichoir_poules', 1, 2],
    ['foin', 4, 2],
    ['nichoir_poules', 7, 2],
    ['sacs', 1, 6],
    ['foin', 9, 6],
    ['tonneau', 9, 4],
    ['lampe', 1, 4]
  ],
  // Forteresse naine de Durgrim.
  dur_hall: [
    ['banniere_naine', 3, 0],
    ['trophee', 6, 0],
    ['banniere_naine', 8, 0],
    ['trophee', 10, 0],
    ['banniere_naine', 13, 0],
    ['trone', 8, 2],
    ['pilier_nain', 3, 3],
    ['pilier_nain', 13, 3],
    ['pilier_nain', 3, 7],
    ['pilier_nain', 13, 7],
    ['tonneau', 1, 2],
    ['tonneau', 15, 2],
    ['lingots', 10, 2],
    ['coffre', 6, 2],
    ['tapis_long', 8, 4],
    ['tapis_long', 8, 6],
    ['table', 5, 6],
    ['chaise', 4, 6, 3],
    ['table', 10, 6],
    ['chaise', 12, 6, 1],
    ['lampe', 1, 9],
    ['lampe', 15, 9]
  ],
  dur_forge: [
    ['banniere_naine', 1, 0],
    ['rack_armes', 6, 0],
    ['rack_armes', 9, 0],
    ['cheminee', 2, 2],
    ['enclume', 4, 3],
    ['enclume', 8, 3],
    ['tonneau', 10, 2],
    ['caisse', 11, 2],
    ['lingots', 11, 4],
    ['sacs', 1, 6],
    ['coffre', 11, 6],
    ['lampe', 1, 4]
  ],
  dur_taverne: [
    ['banniere_naine', 2, 0],
    ['etagere', 5, 0],
    ['banniere_naine', 9, 0],
    ['tonneau', 1, 2],
    ['tonneau', 2, 2],
    ['comptoir', 4, 3],
    ['cheminee', 8, 2],
    ['tonneau', 10, 2],
    ['tonneau', 11, 2],
    ['table', 2, 5],
    ['chaise', 1, 5, 3],
    ['table', 9, 5],
    ['chaise', 8, 5, 3],
    ['chaise', 11, 5, 1],
    ['lampe', 11, 7],
    ['sacs', 1, 7]
  ],
  dur_coffre: [
    ['banniere_naine', 2, 0],
    ['banniere_naine', 8, 0],
    ['lingots', 1, 2],
    ['lingots', 2, 2],
    ['coffre', 4, 2],
    ['coffre', 6, 2],
    ['lingots', 8, 2],
    ['lingots', 9, 2],
    ['comptoir', 4, 4],
    ['caisse', 1, 6],
    ['caisse', 9, 6],
    ['lampe', 9, 4]
  ],
  dur_maison1: [
    ['banniere_naine', 2, 0],
    ['cadre', 5, 0],
    ['herbes', 8, 0],
    ['lit', 1, 2],
    ['cheminee', 4, 2],
    ['tonneau', 8, 2],
    ['coffre', 9, 2],
    ['tapis', 3, 4],
    ['table', 3, 5],
    ['chaise', 2, 5, 3],
    ['chaise', 5, 5, 1],
    ['lit', 9, 5],
    ['lampe', 1, 6]
  ],
  dur_maison2: [
    ['cadre', 2, 0],
    ['banniere_naine', 5, 0],
    ['etagere', 8, 0],
    ['lit_double', 1, 2],
    ['cheminee', 5, 2],
    ['marmite', 6, 2],
    ['tonneau', 9, 2],
    ['tapis_rond', 4, 4],
    ['table_ronde', 4, 5],
    ['chaise', 3, 5, 3],
    ['chaise', 6, 5, 1],
    ['coffre', 9, 6],
    ['lampe', 1, 6]
  ],
  cristaux: [
    ['lit', 1, 2],
    ['bibliotheque', 3, 2],
    ['cuisiniere', 6, 2],
    ['marmite', 7, 2],
    ['armoire', 9, 2],
    ['fenetre', 5, 0],
    ['cadre', 2, 0],
    ['horloge', 8, 0],
    ['tapis', 3, 4],
    ['table', 3, 5],
    ['chaise', 2, 5, 3],
    ['chaise', 5, 5, 1],
    ['plante', 9, 7],
    ['lampe', 9, 5]
  ]
});
// Habitants de chaque pièce : [rôle, x, y] en cases de la pièce.
export const HOUSE_ROOM_RESIDENTS = deepFreeze({
  maison: [
    ['ancien', 10.5, 6.6],
    ['enfant', 11.5, 8.4]
  ],
  echoppe: [['villageois', 2.5, 4.5]],
  marmite: [
    ['cuisinier', 6, 3.7],
    ['villageois', 9, 6.6]
  ],
  aubepines: [
    ['ancien', 6.5, 4.6],
    ['enfant', 2.5, 6.4]
  ],
  puits: [['villageois', 3.5, 4.6]],
  chene: [['villageois', 6.5, 4.6]],
  clairieres: [['villageois', 6.5, 4.6]],
  oasis: [['voyageur', 6.5, 4.6]],
  dunes: [['voyageur', 6.5, 4.6]],
  pilotis: [['pecheur', 6.5, 4.6]],
  rousses: [['villageois', 6.5, 4.6]],
  cristaux: [['ermite', 6.5, 4.6]],
  grange: [['villageois', 7.5, 4.6]],
  guilde: [
    ['voyageur', 3.5, 7.4],
    ['villageois', 11.5, 7.4]
  ]
});
