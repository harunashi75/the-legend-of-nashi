// Pare-feux actifs sous Linux (firewalld, ufw) : ils bloquent par défaut les connexions entrantes du réseau. Chaque
// transport en déduit les commandes à proposer à l'hôte pour laisser entrer ses amis.
'use strict';
const { execFileSync } = require('node:child_process');

// Lecture seule (systemctl is-active), sans droits administrateur. Ailleurs que sous Linux : liste vide.
function linuxFirewalls(run = execFileSync) {
  if (process.platform !== 'linux') return [];
  const active = [];
  for (const name of ['firewalld', 'ufw'])
    try {
      if (
        String(
          run('systemctl', ['is-active', name], {
            encoding: 'utf8',
            timeout: 2000,
            stdio: ['ignore', 'pipe', 'ignore']
          })
        ).trim() === 'active'
      )
        active.push(name);
    } catch {
      // Service absent ou inactif : rien à faire.
    }
  return active;
}

module.exports = { linuxFirewalls };
