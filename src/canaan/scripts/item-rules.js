// Tirage libre d'une qualité (règle partagée : shared/rules/items.js).
function rarityRoll(level) {
  return rollRarity(rnd);
}

function artifactPower(item) {
  return Math.max(
    1,
    Math.round(ARTIFACT_BUFFS[item.artifactVariant].percent * (1 + itemLevel(item) / 57))
  );
}

let playerStun = 0,
  bossStunImmunity = 0;

// weapon est toujours l'arme active; weapon2 reste équipée mais ne fournit aucun bonus.
gearSlots.weapon = '⟦slot_weapon⟧ Arme 1 · active';
gearSlots.weapon2 = '⟦w_dualsword⟧ Arme 2 · réserve';
itemIcon.weapon2 = '⟦w_dualsword⟧';
if (!Object.prototype.hasOwnProperty.call(game.hero.equipment, 'weapon2')) game.hero.equipment.weapon2 = null;
