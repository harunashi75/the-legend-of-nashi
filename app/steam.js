// Steam (Steamworks, bibliothèque steamworks.js) : succès Steam du joueur. Steam n'est utilisé que si le jeu est lancé
// par Steam (le client fournit SteamAppId / SteamGameId) ou si NASHI_STEAM_APPID est défini pour un essai (480 :
// Spacewar, le jeu de test de Valve). Sans Steam (navigateur, itch.io, npm start, Steam fermé), le jeu tourne
// normalement : rien n'est envoyé et aucune erreur n'est montrée au joueur.
//
// Les sauvegardes passent par Steam Cloud en mode Auto-Cloud (réglé sur le site Steamworks, sans code : voir
// docs/STEAM.md), qui synchronise le dossier des sauvegardes.
'use strict';

// Identifiant d'un succès du jeu (c1, e12…) → nom d'API du succès sur Steam (ACH_C1, ACH_E12…).
const steamName = id => 'ACH_' + String(id).toUpperCase();
const VALID_ID = /^[a-z0-9_]{1,40}$/i;
const RETRY_MS = 15000;

/**
 * Steam du processus principal.
 * @param {object} o
 * @param {NodeJS.ProcessEnv} [o.env] variables d'environnement (SteamAppId fourni par le client Steam)
 * @param {() => any} [o.load] chargement de steamworks.js (remplacé dans les tests)
 * @param {(message: string) => void} [o.log]
 */
function createSteam({ env = process.env, load = () => require('steamworks.js'), log = () => {} } = {}) {
  const appId = Number(env.SteamAppId || env.SteamGameId || env.NASHI_STEAM_APPID) || 0;
  let lib = null,
    client = null,
    reason = '';
  try {
    lib = load();
  } catch (error) {
    reason = 'bibliothèque Steam indisponible : ' + error.message;
  }
  if (lib && !appId) reason = 'jeu lancé hors de Steam';
  else if (lib)
    try {
      client = lib.init(appId);
    } catch (error) {
      reason = 'Steam injoignable (client fermé ?) : ' + error.message;
    }
  log('[steam] ' + (client ? 'connecté, application ' + appId : reason));

  // Succès voulus par le jeu mais pas encore confirmés par Steam : renvoyés jusqu'à confirmation.
  const pending = new Set();
  let timer = null;
  function flush() {
    if (!client) return 0;
    let sent = 0;
    for (const name of [...pending])
      try {
        if (client.achievement.isActivated(name) || client.achievement.activate(name)) {
          pending.delete(name);
          sent++;
        }
      } catch (error) {
        log('[steam] succès ' + name + ' refusé : ' + error.message);
      }
    if (pending.size && !timer) {
      timer = setTimeout(() => ((timer = null), flush()), RETRY_MS);
      timer.unref?.();
    }
    return sent;
  }
  // Le jeu envoie la liste complète des succès du héros : seuls les nouveaux partent vers Steam.
  function unlock(ids) {
    if (!client || !Array.isArray(ids)) return 0;
    for (const id of ids.slice(0, 500))
      if (typeof id === 'string' && VALID_ID.test(id)) pending.add(steamName(id));
    return flush();
  }
  function status() {
    let user = null;
    if (client)
      try {
        user = client.localplayer.getName();
      } catch {}
    return {
      loaded: !!lib,
      available: !!client,
      appId: client ? appId : null,
      user,
      reason: client ? '' : reason
    };
  }
  // Superposition Steam (Maj+Tab) dans la fenêtre Electron : seulement quand Steam est là.
  function enableOverlay() {
    if (!client || env.NASHI_STEAM_OVERLAY === '0') return false;
    try {
      lib.electronEnableSteamOverlay();
      return true;
    } catch (error) {
      log('[steam] superposition indisponible : ' + error.message);
      return false;
    }
  }
  return { unlock, status, enableOverlay, pending: () => [...pending] };
}

module.exports = { createSteam, steamName };
