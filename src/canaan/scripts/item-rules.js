// Tirage libre d'une qualité (règle partagée : shared/rules/items.js).
function rarityRoll(level) {
  return rollRarity(rnd);
}

let playerStun = 0,
  bossStunImmunity = 0;

// weapon est toujours l'arme active; weapon2 reste équipée mais ne fournit aucun bonus.
gearSlots.weapon = '⟦slot_weapon⟧ Arme 1 · active';
gearSlots.weapon2 = '⟦w_dualsword⟧ Arme 2 · réserve';
itemIcon.weapon2 = '⟦w_dualsword⟧';
// Deux bagues : la seconde reçoit aussi un objet d'emplacement « ring » et compte comme la première.
gearSlots.ring = '⟦slot_ring⟧ Bague 1';
gearSlots.ring2 = '⟦slot_ring⟧ Bague 2';
itemIcon.ring2 = '⟦slot_ring⟧';
if (!Object.prototype.hasOwnProperty.call(game.hero.equipment, 'weapon2')) game.hero.equipment.weapon2 = null;
