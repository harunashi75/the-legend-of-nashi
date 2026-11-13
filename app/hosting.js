// Jouer sur Internet : l'application de l'hôte lance le relais chez elle (127.0.0.1 seulement, jamais visible du
// réseau) et ouvre un tunnel Pinggy avec le client ssh du système (présent sur Windows 10/11, Linux et macOS).
// Pinggy donne une adresse publique (wss://…pinggy.link) que les amis collent dans « Relais ».
// Gratuit : le tunnel se ferme au bout de 60 minutes et l'adresse change à chaque ouverture. Avec un jeton
// Pinggy Pro, l'adresse est fixe et le tunnel n'expire pas.
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRelay } = require('../relay/server.cjs');

// Serveur Pinggy : celui que montre le tableau de bord (free.pinggy.io en gratuit). Un abonné peut en donner un
// autre (pro.pinggy.io…) en collant la commande de son tableau de bord ; seuls les serveurs *.pinggy.io sont acceptés.
const PINGGY_HOST = 'free.pinggy.io';
const PINGGY_SERVER = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.pinggy\.io$/i;
const FREE_MINUTES = 60;
// Jeton Pinggy : lettres, chiffres, tirets et soulignés (il sert de nom d'utilisateur ssh).
const TOKEN = /^[A-Za-z0-9_-]{4,128}$/;

// Réseau local : port habituel du relais, et quelques ports de repli s'il est déjà pris.
const LAN_PORTS = [8787, 8788, 8789, 8790, 8791];
// Adresses IPv4 de cet ordinateur sur le réseau local, les adresses privées (box, Wi-Fi) en premier.
function lanAddresses(interfaces = os.networkInterfaces()) {
  const out = [];
  for (const list of Object.values(interfaces))
    for (const a of list || []) if ((a.family === 'IPv4' || a.family === 4) && !a.internal) out.push(a.address);
  const rank = ip => (/^192\.168\./.test(ip) ? 0 : /^10\./.test(ip) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3);
  return [...new Set(out)].sort((x, y) => rank(x) - rank(y));
}
// Pare-feux actifs sous Linux (firewalld, ufw) : ils bloquent par défaut les connexions entrantes du réseau.
// Lecture seule (systemctl is-active), sans droits administrateur. Ailleurs : liste vide.
function linuxFirewalls(run = require('node:child_process').execFileSync) {
  if (process.platform !== 'linux') return [];
  const active = [];
  for (const name of ['firewalld', 'ufw'])
    try {
      if (String(run('systemctl', ['is-active', name], { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] })).trim() === 'active') active.push(name);
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
// Sortie de Pinggy nettoyée : codes de couleur et de positionnement du terminal retirés, retours chariot en lignes.
const ANSI = /\x1b\[[0-?]*[ -\/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g;
function cleanOutput(text) {
  return String(text).replace(ANSI, '').replace(/\r\n?/g, '\n');
}
// Liens du site de Pinggy (tableau de bord, documentation, offre Pro) : jamais l'adresse du tunnel.
const PINGGY_SITE = /(^|\.)pinggy\.io$/i;
// Autres liens qui ne sont jamais un tunnel (avertissements de ssh : « See https://openssh.com/pq.html »).
const NOT_TUNNEL = /(^|\.)(openssh\.com|openssh\.org|openbsd\.org)$/i;
// Lignes d'avertissement de ssh : ignorées entièrement.
const SSH_NOISE = /^\s*(\*\*|warning:|debug\d?:)|post-quantum|known hosts/i;
// Lit la sortie de Pinggy : adresse publique du tunnel (https pour un tunnel HTTP, tcp pour un tunnel TCP)
// et limite gratuite. N'importe quel nom de domaine de tunnel est accepté, sauf ceux du site de Pinggy.
function parsePinggy(text) {
  const out = {},
    clean = cleanOutput(text);
  const useful = clean
    .split('\n')
    .filter(line => !SSH_NOISE.test(line))
    .join('\n');
  const links = [...useful.matchAll(/\b(https|tcp):\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::(\d{2,5}))?/gi)].filter(
    m => !PINGGY_SITE.test(m[2]) && !NOT_TUNNEL.test(m[2])
  );
  const https = links.find(m => m[1].toLowerCase() === 'https'),
    tcp = links.find(m => m[1].toLowerCase() === 'tcp' && m[3]);
  if (https) out.relay = 'wss://' + https[2].toLowerCase();
  else if (tcp) out.relay = 'ws://' + tcp[2].toLowerCase() + ':' + tcp[3];
  if (/expire|not authenticated|free/i.test(clean)) out.free = true;
  return out;
}

// Commande copiée du tableau de bord Pinggy (« ssh -p 443 -R0:localhost:80 … JETON@free.pinggy.io ») ou jeton seul :
// renvoie { token, host } (host vide si non précisé), ou null si rien n'est reconnu.
function parsePinggyLogin(text) {
  const clean = String(text || '').trim();
  if (!clean) return { token: '', host: '' };
  if (TOKEN.test(clean)) return { token: clean, host: '' };
  const m = clean.match(/(?:^|[\s"'])(?:([A-Za-z0-9_-]{4,128})(?:\+[a-z+]+)?@)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.pinggy\.io)\b/i);
  if (!m) return null;
  const user = m[1] && !/^(tcp|tls|http|https|qr|auth|tlstcp|udp)$/i.test(m[1]) ? m[1] : '';
  return { token: user, host: m[2].toLowerCase() };
}

// Adresse d'un tunnel Pinggy (…free.pinggy.net, …pinggy-free.link, …pinggy.link, …pinggy.online…).
// Pinggy gratuit montre une page d'avertissement aux navigateurs avant de les laisser passer ; le jeu est un
// navigateur (Electron), et sa connexion au relais recevrait cette page au lieu du relais. L'en-tête
// X-Pinggy-No-Screen saute cette page : il est ajouté à toutes les requêtes vers ces adresses (voir main.js).
function isPinggyTunnel(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|[.-])pinggy([.-]|$)/.test(host) && !PINGGY_SITE.test(host);
  } catch {
    return false;
  }
}

// Arguments ssh du tunnel : port distant 0 (Pinggy choisit), relais local, connexion maintenue.
// tty : '-T' (sans terminal) ou '-tt' (terminal simulé, si Pinggy n'affiche l'adresse qu'avec un terminal).
function sshArguments({ port, token = '', mode = 'http', knownHosts, tty = '-T', host = PINGGY_HOST }) {
  if (!PINGGY_SERVER.test(host)) host = PINGGY_HOST;
  const user = token ? token + (mode === 'tcp' ? '+tcp' : '') : mode === 'tcp' ? 'tcp' : '';
  return [
    '-p',
    '443',
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    'UserKnownHostsFile=' + knownHosts,
    '-o',
    'ServerAliveInterval=30',
    '-o',
    'ServerAliveCountMax=3',
    '-o',
    'ExitOnForwardFailure=yes',
    tty === '-tt' ? '-tt' : '-T',
    '-R',
    '0:127.0.0.1:' + port,
    (user ? user + '@' : '') + host.toLowerCase()
  ];
}

// Pinggy gratuit ne demande pas de mot de passe ; si ssh en réclame un, une réponse vide est donnée
// par SSH_ASKPASS (aucune saisie possible : l'application n'a pas de terminal).
function askpassScript(dir) {
  const windows = process.platform === 'win32',
    file = path.join(dir, windows ? 'pinggy-askpass.cmd' : 'pinggy-askpass.sh');
  if (!fs.existsSync(file)) fs.writeFileSync(file, windows ? '@echo.\r\n' : '#!/bin/sh\necho\n', { mode: 0o700 });
  return file;
}

// waits : délais des deux essais (sans terminal, puis terminal simulé), en millisecondes.
function createHosting({ dataDir, onStatus = () => {}, sshPath = process.env.CANAAN_SSH || 'ssh', log = () => {}, waits = [12000, 13000] }) {
  let relay = null,
    relayHost = null,
    tunnel = null,
    status = { state: 'off' };
  const emit = changes => {
    status = { ...status, ...changes };
    onStatus({ ...status });
  };
  // Relais de l'hôte : sur 127.0.0.1 pour Pinggy (le tunnel s'y branche), ou ouvert au réseau local.
  async function startRelay(host = '127.0.0.1', ports = [0]) {
    if (relay && relayHost === host) return relay;
    if (relay) await relay.close();
    relay = null;
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
    throw new Error('Impossible d’ouvrir le relais : ' + (lastError?.code === 'EADDRINUSE' ? 'ports ' + ports.join(', ') + ' déjà utilisés.' : lastError?.message));
  }
  // Jouer en réseau local : relais ouvert aux appareils de la maison, sans tunnel ; l'adresse à donner est celle
  // de cet ordinateur sur le réseau (ws://192.168.x.x:8787).
  async function startLan() {
    stopTunnel();
    await startRelay('0.0.0.0', LAN_PORTS);
    const addresses = lanAddresses(),
      port = relay.port,
      local = 'ws://127.0.0.1:' + port;
    if (!addresses.length) {
      emit({ state: 'error', kind: 'lan', local, relay: null, addresses: [], message: 'Aucun réseau local trouvé : vérifie le Wi-Fi ou le câble.' });
      return { ...status };
    }
    emit({
      state: 'online',
      kind: 'lan',
      local,
      relay: 'ws://' + addresses[0] + ':' + port,
      addresses: addresses.map(ip => 'ws://' + ip + ':' + port),
      platform: process.platform,
      firewall: firewallCommands(linuxFirewalls(), port),
      free: false,
      expiresAt: null,
      message: 'Relais ouvert sur ton réseau local (port ' + port + ').'
    });
    return { ...status };
  }
  // Ouvre (ou rouvre) le tunnel ; le relais local reste le même, donc le salon et son code aussi.
  async function start({ token = '', mode = 'http', host = PINGGY_HOST } = {}) {
    if (token && !TOKEN.test(token)) throw new Error('Jeton Pinggy invalide.');
    mode = mode === 'tcp' ? 'tcp' : 'http';
    host = PINGGY_SERVER.test(host || '') ? host.toLowerCase() : PINGGY_HOST;
    await startRelay();
    stopTunnel();
    fs.mkdirSync(dataDir, { recursive: true });
    try {
      fs.writeFileSync(logFile(), '');
    } catch {
      // Journal facultatif.
    }
    const local = 'ws://127.0.0.1:' + relay.port;
    emit({ state: 'starting', kind: 'internet', local, relay: null, addresses: [], free: !token, expiresAt: null, message: 'Ouverture du tunnel Pinggy…' });
    // Premier essai sans terminal ; sans adresse au bout de 12 s, second essai avec un terminal simulé.
    for (const [tty, wait] of [
      ['-T', waits[0]],
      ['-tt', waits[1]]
    ]) {
      const result = await attempt({ token, mode, host, tty, wait, last: tty === '-tt' });
      if (result) return result;
    }
    return { ...status };
  }
  // Journal de la dernière réponse de Pinggy (pour comprendre un échec).
  const logFile = () => path.join(dataDir, 'pinggy-derniere-reponse.txt');
  // Chaque essai ajoute sa réponse (le fichier est vidé à chaque ouverture du tunnel). Le jeton n'y figure jamais.
  function writeLog(tty, host, why, text) {
    try {
      fs.appendFileSync(logFile(), '=== ssh ' + tty + ' ' + host + ' — ' + new Date().toISOString() + ' — ' + why + '\n' + (cleanOutput(text).trim() || '(aucune réponse)') + '\n\n');
    } catch {
      // Journal facultatif.
    }
  }
  const lastLines = text =>
    cleanOutput(text)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(-3)
      .join(' · ')
      .slice(0, 240);
  // Un essai de tunnel : renvoie l'état final (en ligne ou en erreur), ou null pour passer à l'essai suivant.
  function attempt({ token, mode, host, tty, wait, last }) {
    const child = spawn(sshPath, sshArguments({ port: relay.port, token, mode, host, knownHosts: path.join(dataDir, 'pinggy_known_hosts'), tty }), {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, SSH_ASKPASS: askpassScript(dataDir), SSH_ASKPASS_REQUIRE: 'force', DISPLAY: process.env.DISPLAY || ':0' }
    });
    tunnel = child;
    let seen = '';
    return new Promise(resolve => {
      const done = value => {
        resolve(value);
        resolve = () => {};
      };
      const read = chunk => {
        seen = (seen + chunk.toString('utf8')).slice(-16000);
        const info = parsePinggy(seen);
        if (info.relay && status.relay !== info.relay && tunnel === child) {
          writeLog(tty, host, 'adresse reçue', seen);
          const free = !token;
          emit({
            state: 'online',
            relay: info.relay,
            free,
            expiresAt: free ? Date.now() + FREE_MINUTES * 60000 : null,
            message: free ? 'Tunnel ouvert (gratuit : 60 minutes).' : 'Tunnel ouvert.'
          });
          done({ ...status });
        }
      };
      child.stdout.on('data', read);
      child.stderr.on('data', read);
      child.on('error', error => {
        if (tunnel !== child) return;
        writeLog(tty, host, 'erreur ' + (error.code || error.message), seen);
        tunnel = null;
        const message =
          error.code === 'ENOENT'
            ? 'Client ssh introuvable : installe OpenSSH (déjà présent sur Windows 10/11, Linux et macOS).'
            : 'Tunnel impossible : ' + error.message;
        emit({ state: 'error', relay: null, message });
        done({ ...status });
      });
      child.on('exit', code => {
        if (tunnel !== child) return;
        tunnel = null;
        writeLog(tty, host, 'ssh terminé (code ' + code + ')', seen);
        const wasOnline = status.state === 'online';
        if (!wasOnline && !last) return done(null);
        emit({
          state: wasOnline ? 'closed' : 'error',
          relay: null,
          message: wasOnline
            ? status.free
              ? 'Tunnel Pinggy fermé (limite de 60 minutes en gratuit). Rouvre-le : le lien change.'
              : 'Tunnel Pinggy fermé. Rouvre-le pour continuer.'
            : 'Le tunnel n’a pas pu s’ouvrir' + (code !== null ? ' (code ' + code + ')' : '') + (lastLines(seen) ? ' : ' + lastLines(seen) : '.')
        });
        done({ ...status });
      });
      // Pas d'adresse dans le délai : essai suivant, ou abandon avec la fin de la réponse de Pinggy.
      setTimeout(() => {
        if (tunnel !== child || status.state !== 'starting') return;
        writeLog(tty, host, 'aucune adresse après ' + Math.round(wait / 1000) + ' s', seen);
        stopTunnel();
        if (!last) return done(null);
        const reply = lastLines(seen);
        emit({
          state: 'error',
          relay: null,
          message: reply
            ? 'Pinggy a répondu sans donner d’adresse de tunnel : « ' + reply + ' ». Réponse complète : ' + logFile()
            : 'Pinggy (' + host + ') ne donne aucune réponse. Détails : ' + logFile()
        });
        done({ ...status });
      }, wait).unref?.();
    });
  }
  function stopTunnel() {
    const child = tunnel;
    tunnel = null;
    if (child && child.exitCode === null) child.kill();
  }
  async function stop() {
    stopTunnel();
    if (relay) await relay.close();
    relay = null;
    relayHost = null;
    emit({ state: 'off', kind: null, local: null, relay: null, addresses: [], expiresAt: null, message: '' });
  }
  return { start, startLan, stop, status: () => ({ ...status }) };
}

module.exports = { createHosting, isPinggyTunnel, parsePinggy, parsePinggyLogin, PINGGY_HOST, cleanOutput, sshArguments, lanAddresses, linuxFirewalls, firewallCommands, LAN_PORTS, TOKEN };
