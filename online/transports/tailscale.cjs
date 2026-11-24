// Transport Tailscale (amis loin) : les deux joueurs sont dans le même réseau privé Tailscale ; le relais n'écoute que
// sur l'adresse Tailscale de ce PC (100.x.y.z), invisible depuis Internet et depuis le réseau de la maison. L'hôte s'y
// branche lui aussi, par la même adresse.
'use strict';
const { execFileSync } = require('node:child_process');
const os = require('node:os');

// Adresses Tailscale : plage 100.64.0.0/10 (100.64.x.x à 100.127.x.x).
function isTailscaleIp(ip) {
  const m = /^100\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(String(ip));
  return !!m && +m[1] >= 64 && +m[1] <= 127;
}
// Commande tailscale : dans le PATH, ou à son emplacement habituel sous Windows et macOS.
function tailscaleCommands() {
  const list = ['tailscale'];
  if (process.platform === 'win32') list.push('C:\\Program Files\\Tailscale\\tailscale.exe');
  if (process.platform === 'darwin') list.push('/Applications/Tailscale.app/Contents/MacOS/Tailscale');
  return list;
}
// Adresse Tailscale de ce PC et son nom (MagicDNS), ou { ip: null, why } si Tailscale n'est pas prêt.
// Lecture seule : l'interface réseau d'abord, puis « tailscale status --json » pour le nom et l'état.
function tailscaleInfo({
  interfaces = os.networkInterfaces(),
  run = execFileSync,
  commands = tailscaleCommands()
} = {}) {
  let ip = null;
  for (const [name, list] of Object.entries(interfaces))
    for (const a of list || [])
      if (
        (a.family === 'IPv4' || a.family === 4) &&
        isTailscaleIp(a.address) &&
        (!ip || /tailscale|utun/i.test(name))
      )
        ip = a.address;
  let name = '',
    state = '',
    found = false;
  for (const cmd of commands) {
    try {
      const st = JSON.parse(
        String(
          run(cmd, ['status', '--json'], {
            encoding: 'utf8',
            timeout: 3000,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'ignore']
          })
        )
      );
      found = true;
      state = String(st.BackendState || '');
      name = String(st.Self?.DNSName || '').replace(/\.$/, '');
      const own = (st.Self?.TailscaleIPs || st.TailscaleIPs || []).find(isTailscaleIp);
      if (!ip && own && state === 'Running') ip = own;
      break;
    } catch (error) {
      // « tailscale status » répond aussi en erreur quand Tailscale est arrêté : la sortie reste lisible.
      if (error && error.code !== 'ENOENT' && error.stdout) {
        found = true;
        try {
          state = String(JSON.parse(String(error.stdout)).BackendState || 'Stopped');
        } catch {
          state = 'Stopped';
        }
        break;
      }
    }
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(name)) name = '';
  if (ip && (!state || state === 'Running')) return { ip, name };
  const why =
    !found && !ip
      ? 'Tailscale n’est pas installé sur ce PC : installe-le (tailscale.com/download) et connecte-toi.'
      : state === 'NeedsLogin'
        ? 'Tailscale attend que tu te connectes : ouvre Tailscale et connecte-toi à ton compte.'
        : 'Tailscale est arrêté : ouvre Tailscale et active la connexion (« Connect »).';
  return { ip: null, name: '', why };
}
// Commandes pour laisser passer les amis Tailscale dans les pare-feux actifs (Linux).
function tailscaleFirewallCommands(firewalls, port) {
  return firewalls.map(name =>
    name === 'firewalld'
      ? 'sudo firewall-cmd --permanent --zone=trusted --add-interface=tailscale0 && sudo firewall-cmd --reload'
      : 'sudo ufw allow in on tailscale0 to any port ' + port + ' proto tcp'
  );
}

/**
 * Transport pour online/hosting.cjs : où ouvrir le relais, puis ce qu'il faut montrer à l'hôte.
 * @param {() => { ip: string | null, name?: string, why?: string }} [info] adresse Tailscale (remplacée dans les tests)
 */
function tailscaleTransport(info = () => tailscaleInfo()) {
  return {
    kind: 'tailscale',
    // Avant d'ouvrir le relais : l'adresse Tailscale, ou pourquoi il n'y en a pas.
    prepare() {
      const found = info();
      return found.ip ? { host: found.ip, info: found } : { error: found.why };
    },
    // Relais ouvert sur `port`.
    opened({ port, info: found, firewalls }) {
      const url = 'ws://' + found.ip + ':' + port;
      return {
        state: 'online',
        local: url,
        relay: url,
        addresses: found.name ? ['ws://' + found.name + ':' + port] : [],
        firewall: tailscaleFirewallCommands(firewalls, port),
        message: 'Relais ouvert sur ton réseau Tailscale (' + found.ip + ', port ' + port + ').'
      };
    }
  };
}

module.exports = {
  tailscaleTransport,
  tailscaleInfo,
  isTailscaleIp,
  tailscaleFirewallCommands
};
