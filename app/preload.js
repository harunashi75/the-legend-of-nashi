// Pont minimal entre la fenêtre et Electron : le jeu reçoit seulement les opérations de sauvegarde,
// jamais Node.js ni le système de fichiers. Les appels sont synchrones, comme l'ancien stockage du navigateur.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

function call(op, ...args) {
  const result = ipcRenderer.sendSync('saves:' + op, ...args);
  if (!result || !result.ok) throw new Error((result && result.error) || 'Sauvegarde indisponible');
  return result.value;
}
contextBridge.exposeInMainWorld(
  'canaanDesktop',
  Object.freeze({
    list: () => call('list'),
    read: slot => call('read', slot),
    write: (slot, text) => call('write', slot, text),
    backup: (slot, reason) => call('backup', slot, reason),
    backupText: (prefix, reason, text) => call('backupText', prefix, reason, text),
    remove: slot => call('remove', slot),
    openFolder: () => ipcRenderer.send('saves:open-folder'),
    // Affichage (menu Paramètres) : plein écran, taille de la zone de jeu, échelle, VSync (relance du jeu).
    display: Object.freeze({
      get: () => ipcRenderer.invoke('display:get'),
      set: options => ipcRenderer.invoke('display:set', options),
      relaunch: () => ipcRenderer.send('display:relaunch'),
      onChange: callback => ipcRenderer.on('display:changed', (_event, state) => callback(state))
    }),
    // Jouer à plusieurs : relais de l'hôte sur Tailscale ou sur le réseau local, état reçu à chaque changement.
    hosting: Object.freeze({
      startTailscale: () => ipcRenderer.invoke('net:host-tailscale'),
      startLan: () => ipcRenderer.invoke('net:host-lan'),
      stop: () => ipcRenderer.invoke('net:host-stop'),
      status: () => ipcRenderer.invoke('net:host-status'),
      onStatus: callback => ipcRenderer.on('net:host-status', (_event, status) => callback(status)),
      copy: text => ipcRenderer.send('net:copy', String(text))
    })
  })
);
