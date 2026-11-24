// Tirage libre d'une qualité (règle partagée : shared/rules/items.js).
function rarityRoll(level) {
  return rollRarity(rnd);
}

let playerStun = 0,
  bossStunImmunity = 0;

// Une seule arme : celle de la classe (plus d'arme de réserve).
gearSlots.weapon = '⟦slot_weapon⟧ Arme de classe';
// Deux bagues : la seconde reçoit aussi un objet d'emplacement « ring » et compte comme la première.
gearSlots.ring = '⟦slot_ring⟧ Bague 1';
gearSlots.ring2 = '⟦slot_ring⟧ Bague 2';
itemIcon.ring2 = '⟦slot_ring⟧';
