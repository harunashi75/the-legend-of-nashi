// Jouer à plusieurs depuis l'application de bureau : l'hôte lance le relais chez lui, sans aucun service extérieur.
// - Tailscale (amis loin) : les deux joueurs sont dans le même réseau privé Tailscale ; le relais n'écoute que sur
//   l'adresse Tailscale de ce PC (100.x.y.z), invisible depuis Internet et depuis le réseau de la maison.
// - Réseau local (quelqu'un chez toi) : le relais s'ouvre aux appareils de la maison (192.168.x.x).
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const { createRelay } = require('../relay/server.cjs');

// Réseau local : port habituel du relais, et quelques ports de repli s'il est déjà pris.
const LAN_PORTS = [8787, 8788, 8789, 8790, 8791];
// Adresses IPv4 de cet ordinateur sur le réseau local, les adresses privées (box, Wi-Fi) en premier.
function lanAddresses(interfaces = os.networkInterfaces()) {
  const out = [];
  for (const list of Object.values(interfaces))
    for (const a of list || [])
      if ((a.family === 'IPv4' || a.family === 4) && !a.internal && !isTailscaleIp(a.address))
        out.push(a.address);
  const rank = ip =>
    /^192\.168\./.test(ip) ? 0 : /^10\./.test(ip) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
  return [...new Set(out)].sort((x, y) => rank(x) - rank(y));
}
// Pare-feux actifs sous Linux (firewalld, ufw) : ils bloquent par défaut les connexions entrantes du réseau.
// Lecture seule (systemctl is-active), sans droits administrateur. Ailleurs : liste vide.
function linuxFirewalls(run = require('node:child_process').execFileSync) {
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
// Commandes pour ouvrir le port du relais dans chaque pare-feu actif.
function firewallCommands(firewalls, port) {
  return firewalls.map(name =>
    name === 'firewalld'
      ? 'sudo firewall-cmd --permanent --add-port=' + port + '/tcp && sudo firewall-cmd --reload'
      : 'sudo ufw allow ' + port + '/tcp'
  );
}
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

function createHosting({
  onStatus = () => {},
  log = () => {},
  tailscale = () => tailscaleInfo(),
  firewalls = () => linuxFirewalls()
} = {}) {
  let relay = null,
    relayHost = null,
    status = { state: 'off' };
  const emit = changes => {
    status = { ...status, ...changes };
    onStatus({ ...status });
  };
  async function startRelay(host, ports) {
    if (relay && relayHost === host) return relay;
    if (relay) await relay.close();
    relay = null;
    relayHost = null;
    let lastError = null;
    for (const port of ports) {
      const candidate = createRelay({ port, host, log });
      try {
        await candidate.ready;
        relay = candidate;
        relayHost = host;
        return relay;
      } catch (error) {
        lastError = error;
        await candidate.close().catch(() => {});
      }
    }
    throw new Error(
      'Impossible d’ouvrir le relais : ' +
        (lastError?.code === 'EADDRINUSE'
          ? 'ports ' + ports.join(', ') + ' déjà utilisés.'
          : lastError?.message)
    );
  }
  // Tailscale : relais sur l'adresse Tailscale de ce PC ; l'hôte s'y branche lui aussi (même adresse).
  async function startTailscale() {
    const info = tailscale();
    if (!info.ip) {
      await stopRelay();
      emit({ state: 'error', kind: 'tailscale', local: null, relay: null, addresses: [], message: info.why });
      return { ...status };
    }
    try {
      await startRelay(info.ip, LAN_PORTS);
    } catch (error) {
      emit({
        state: 'error',
        kind: 'tailscale',
        local: null,
        relay: null,
        addresses: [],
        message: error.message
      });
      return { ...status };
    }
    const port = relay.port,
      url = 'ws://' + info.ip + ':' + port;
    emit({
      state: 'online',
      kind: 'tailscale',
      local: url,
      relay: url,
      addresses: info.name ? ['ws://' + info.name + ':' + port] : [],
      platform: process.platform,
      firewall: tailscaleFirewallCommands(firewalls(), port),
      message: 'Relais ouvert sur ton réseau Tailscale (' + info.ip + ', port ' + port + ').'
    });
    return { ...status };
  }
  // Réseau local : relais ouvert aux appareils de la maison ; l'adresse à donner est celle de ce PC (ws://192.168.x.x).
  async function startLan() {
    await startRelay('0.0.0.0', LAN_PORTS);
    const addresses = lanAddresses(),
      port = relay.port,
      local = 'ws://127.0.0.1:' + port;
    if (!addresses.length) {
      emit({
        state: 'error',
        kind: 'lan',
        local,
        relay: null,
        addresses: [],
        message: 'Aucun réseau local trouvé : vérifie le Wi-Fi ou le câble.'
      });
      return { ...status };
    }
    emit({
      state: 'online',
      kind: 'lan',
      local,
      relay: 'ws://' + addresses[0] + ':' + port,
      addresses: addresses.map(ip => 'ws://' + ip + ':' + port),
      platform: process.platform,
      firewall: firewallCommands(firewalls(), port),
      message: 'Relais ouvert sur ton réseau local (port ' + port + ').'
    });
    return { ...status };
  }
  async function stopRelay() {
    if (relay) await relay.close();
    relay = null;
    relayHost = null;
  }
  async function stop() {
    await stopRelay();
    emit({ state: 'off', kind: null, local: null, relay: null, addresses: [], firewall: [], message: '' });
  }
  return { startTailscale, startLan, stop, status: () => ({ ...status }) };
}

module.exports = {
  createHosting,
  tailscaleInfo,
  isTailscaleIp,
  tailscaleFirewallCommands,
  lanAddresses,
  linuxFirewalls,
  firewallCommands,
  LAN_PORTS
};
