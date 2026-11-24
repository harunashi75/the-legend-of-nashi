// Transport réseau local (quelqu'un chez toi) : le relais s'ouvre aux appareils de la maison (192.168.x.x), comme
// « Ouvrir au réseau local » dans d'autres jeux. L'hôte s'y branche par 127.0.0.1 ; ses amis, par l'adresse de son PC.
'use strict';
const os = require('node:os');
const { isTailscaleIp } = require('./tailscale.cjs');

// Adresses IPv4 de cet ordinateur sur le réseau local, les adresses privées (box, Wi-Fi) en premier. Les adresses
// Tailscale n'en font pas partie : elles ont leur propre transport.
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
// Commandes pour ouvrir le port du relais dans chaque pare-feu actif (Linux).
function firewallCommands(firewalls, port) {
  return firewalls.map(name =>
    name === 'firewalld'
      ? 'sudo firewall-cmd --permanent --add-port=' + port + '/tcp && sudo firewall-cmd --reload'
      : 'sudo ufw allow ' + port + '/tcp'
  );
}

/**
 * Transport pour online/hosting.cjs : où ouvrir le relais, puis ce qu'il faut montrer à l'hôte.
 * @param {() => string[]} [addresses] adresses du PC sur le réseau local (remplacées dans les tests)
 */
function lanTransport(addresses = () => lanAddresses()) {
  return {
    kind: 'lan',
    prepare: () => ({ host: '0.0.0.0' }),
    opened({ port, firewalls }) {
      const list = addresses(),
        local = 'ws://127.0.0.1:' + port;
      if (!list.length)
        return {
          state: 'error',
          local,
          relay: null,
          addresses: [],
          message: 'Aucun réseau local trouvé : vérifie le Wi-Fi ou le câble.'
        };
      return {
        state: 'online',
        local,
        relay: 'ws://' + list[0] + ':' + port,
        addresses: list.map(ip => 'ws://' + ip + ':' + port),
        firewall: firewallCommands(firewalls, port),
        message: 'Relais ouvert sur ton réseau local (port ' + port + ').'
      };
    }
  };
}

module.exports = { lanTransport, lanAddresses, firewallCommands };
