// @ts-check
// Types communs de shared/, en JSDoc : ils documentent les formes échangées entre les règles, le jeu et le réseau,
// et servent à la vérification des types (npm run typecheck). Ce fichier n'exécute aucun code.
// Module partagé pur : aucune dépendance au navigateur, au réseau ni aux autres couches.

/**
 * Générateur aléatoire : renvoie un nombre dans [0, 1[ (Math.random ou un générateur à graine pour les tests).
 * @typedef {() => number} Rng
 */

/**
 * Valeurs par nom de statistique (principales : attack, defense, vitality ; secondaires : crit, power, haste…).
 * @typedef {Record<string, number>} StatMap
 */

/**
 * Objet d'équipement, tel qu'il est sauvegardé et envoyé aux invités.
 * @typedef {object} Item
 * @property {string | number} [id]
 * @property {string} [slot] emplacement (helm, armor, weapon, ring…)
 * @property {number} [level] niveau de l'objet (1 à 60)
 * @property {string} [rarity] qualité (Commun à Mythique)
 * @property {string} [weaponType] famille d'arme
 * @property {string} [name]
 * @property {StatMap} [sec] deux statistiques secondaires tirées une fois
 * @property {{ stat: string, value: number }} [ench] enchantement (troisième secondaire)
 * @property {number} [ilvl] ancien iLvl (sauvegardes du schéma 9)
 * @property {string} [origin] donjon, raid…
 * @property {string} [bound] classe à laquelle l'objet est lié (arme liée, qualité Relique)
 */

/**
 * Statistiques d'un objet : principales calculées, secondaires enregistrées (enchantement compris).
 * @typedef {object} ItemStats
 * @property {StatMap} primary
 * @property {StatMap} secondary
 * @property {{ stat: string, value: number } | null} enchant
 */

/**
 * Progression d'un héros (niveau et XP dans le niveau).
 * @typedef {object} XpState
 * @property {number} level
 * @property {number} exp
 */

/**
 * Pièce intérieure (CANAAN_ROOMS) : taille en cases.
 * @typedef {object} Room
 * @property {number} w
 * @property {number} h
 * @property {string} [id]
 */

/**
 * Meuble du catalogue des pièces intérieures (sans son dessin).
 * @typedef {object} Furniture
 * @property {string} name
 * @property {'floor' | 'rug' | 'wall' | 'curtain'} layer
 * @property {number} w largeur en cases
 * @property {number} h hauteur en cases
 * @property {boolean | 'self'} [turn] quart de tour, quatre orientations dessinées, ou miroir (absent)
 * @property {boolean} [back] contre le mur du fond
 * @property {boolean} [fire] on y cuisine
 * @property {boolean} [light]
 */

/**
 * Meuble posé dans une pièce, en cases de la pièce, avec son orientation.
 * @typedef {object} PlacedItem
 * @property {string} k clé du meuble dans le catalogue
 * @property {number} x
 * @property {number} y
 * @property {number} r
 */

/**
 * Apparence d'un personnage (création du héros, garde-robe).
 * @typedef {object} Look
 * @property {string} sex
 * @property {string} race
 * @property {string} skin
 * @property {string} hairStyle
 * @property {string} hair
 * @property {string} eyes
 * @property {string} outfit
 * @property {string} [wear] tenue de la garde-robe portée par-dessus
 */

export {};
