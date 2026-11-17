// @ts-check
// Gel profond des catalogues partagés : une donnée de référence ne peut pas être modifiée par erreur.
// Module partagé pur : aucune dépendance au navigateur, au réseau ni aux autres couches.
/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(/** @type {Record<string, unknown>} */ (value)[key]);
  }
  return value;
}
