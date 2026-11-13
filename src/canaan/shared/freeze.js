// Gel profond des catalogues partagés : une donnée de référence ne peut pas être modifiée par erreur.
// Module partagé pur : aucune dépendance au navigateur, au réseau ni aux autres couches.
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}
