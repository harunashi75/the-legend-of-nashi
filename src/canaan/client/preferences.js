// Préférences propres à l'appareil : son et disposition des panneaux.
// Elles restent distinctes de la sauvegarde de partie, gérée par canaan-persistence.
// Un stockage indisponible ou une valeur illisible ne bloque jamais le jeu : la valeur par défaut est utilisée.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).

// network : identifiant d'invité (créé une fois), pseudo et adresse du relais du coopératif.
// settings : réglages d'affichage du menu Paramètres (secousses de l'écran).
// keybinds : touches du clavier choisies pour chaque action (Paramètres → Clavier).
const keys = Object.freeze({
  audio: 'canaan_audio_v1729',
  layout: 'canaan_layout_v1729',
  keybinds: 'canaan_keybinds_v1',
  network: 'canaan_network_v1',
  settings: 'canaan_settings_v1'
});
function keyOf(name) {
  if (!Object.hasOwn(keys, name)) throw new Error('Préférence inconnue : ' + name);
  return keys[name];
}
export const CANAAN_PREFERENCES = Object.freeze({
  keys,
  // Renvoie l'objet enregistré, ou fallback si l'entrée est absente, illisible ou n'est pas un objet.
  read(name, fallback) {
    const key = keyOf(name);
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  },
  // Renvoie false si le stockage refuse l'écriture.
  write(name, value) {
    const key = keyOf(name);
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }
});
