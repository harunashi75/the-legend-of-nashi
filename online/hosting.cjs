// Héberger une partie depuis l'application de bureau : l'hôte lance le relais (relay.cjs) chez lui, sans aucun
// service extérieur. Un transport (transports/) dit où l'ouvrir et ce qu'il faut montrer à l'hôte ; ce module ouvre
// le relais (avec des ports de repli), le referme, et tient l'état renvoyé au jeu.
'use strict';
const { createRelay } = require('./relay.cjs');
const { linuxFirewalls } = require('./firewall.cjs');
const { lanTransport } = require('./transports/lan.cjs');
const { tailscaleTransport } = require('./transports/tailscale.cjs');

// Port habituel du relais, et quelques ports de repli s'il est déjà pris.
const RELAY_PORTS = [8787, 8788, 8789, 8790, 8791];

/**
 * @param {object} [o]
 * @param {(status: object) => void} [o.onStatus] état envoyé au jeu à chaque changement
 * @param {(text: string) => void} [o.log]
 * @param {() => { ip: string | null, name?: string, why?: string }} [o.tailscale] adresse Tailscale (tests)
 * @param {() => string[]} [o.firewalls] pare-feux actifs (tests)
 */
function createHosting({
  onStatus = () => {},
  log = () => {},
  tailscale = undefined,
  firewalls = () => linuxFirewalls()
} = {}) {
  const transports = { lan: lanTransport(), tailscale: tailscaleTransport(tailscale) };
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
  async function stopRelay() {
    if (relay) await relay.close();
    relay = null;
    relayHost = null;
  }
  // Ouvre le relais pour un transport ; toute erreur devient un état « error » avec un message pour l'hôte.
  async function start(kind) {
    const transport = transports[kind];
    const fail = message => {
      emit({ state: 'error', kind, local: null, relay: null, addresses: [], message });
      return { ...status };
    };
    const plan = transport.prepare();
    if (plan.error) {
      await stopRelay();
      return fail(plan.error);
    }
    try {
      await startRelay(plan.host, RELAY_PORTS);
    } catch (error) {
      return fail(error.message);
    }
    emit({
      kind,
      platform: process.platform,
      firewall: [],
      ...transport.opened({ ...plan, port: relay.port, firewalls: firewalls() })
    });
    return { ...status };
  }
  async function stop() {
    await stopRelay();
    emit({ state: 'off', kind: null, local: null, relay: null, addresses: [], firewall: [], message: '' });
  }
  return {
    startTailscale: () => start('tailscale'),
    startLan: () => start('lan'),
    stop,
    status: () => ({ ...status })
  };
}

module.exports = { createHosting, RELAY_PORTS };
