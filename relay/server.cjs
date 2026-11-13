#!/usr/bin/env node
// Relais du coopératif : met en relation l'hôte et ses invités par un code de salon. Il ne simule rien,
// ne stocke aucune sauvegarde et ne lit pas le contenu du jeu : il transmet les messages, en limitant
// leur taille et leur fréquence. Lancer : npm run relay (port 8787, ou la variable PORT).
'use strict';
const { WebSocketServer } = require('ws');
const {
  MESSAGE_LIMIT,
  RATE_LIMIT,
  ROOM_GUESTS,
  GUEST_TYPES,
  makeRoomCode,
  normalizeRoomCode,
  parseMessage
} = require('../src/canaan/shared/net/messages.js');

// rate : messages par seconde permis à un invité ; l'hôte, qui écrit à tous ses invités, en a quatre fois plus.
function createRelay({ port = 8787, host = undefined, log = () => {}, rate = RATE_LIMIT } = {}) {
  const rooms = new Map();
  let peerCounter = 0;
  const wss = new WebSocketServer({ port, host, maxPayload: MESSAGE_LIMIT });
  const send = (socket, message) => {
    if (socket && socket.readyState === 1) socket.send(typeof message === 'string' ? message : JSON.stringify(message));
  };
  function newCode() {
    let code;
    do code = makeRoomCode(Math.random);
    while (rooms.has(code));
    return code;
  }
  function closeRoom(code) {
    const room = rooms.get(code);
    if (!room) return;
    rooms.delete(code);
    for (const guest of room.guests.values()) {
      send(guest, { t: 'closed', reason: 'L’hôte a fermé sa partie.' });
      guest.meta.role = null;
      guest.close(1000, 'salon fermé');
    }
    log('salon fermé ' + code);
  }
  wss.on('connection', socket => {
    socket.meta = { role: null, code: null, peer: null, window: 0, count: 0, alive: true };
    socket.on('pong', () => (socket.meta.alive = true));
    socket.on('message', (buffer, isBinary) => {
      const meta = socket.meta,
        now = Date.now();
      // Fréquence limitée : au-delà, les messages sont ignorés ; très au-delà, la connexion est fermée.
      if (now - meta.window >= 1000) {
        meta.window = now;
        meta.count = 0;
      }
      const limit = meta.role === 'host' ? rate * 4 : rate;
      if (++meta.count > limit * 3) return socket.close(1008, 'trop de messages');
      if (meta.count > limit || isBinary) return;
      const message = parseMessage(buffer.toString('utf8'));
      if (!message) return;
      if (!meta.role) {
        if (message.t === 'host') {
          const code = newCode();
          rooms.set(code, { host: socket, guests: new Map() });
          Object.assign(meta, { role: 'host', code });
          send(socket, { t: 'room', code });
          log('salon ouvert ' + code);
        } else if (message.t === 'join') {
          const code = normalizeRoomCode(message.code),
            room = code && rooms.get(code);
          if (!room) return send(socket, { t: 'error', reason: 'Salon introuvable : vérifie le code.' });
          if (room.guests.size >= ROOM_GUESTS) return send(socket, { t: 'error', reason: 'Salon complet (trois invités).' });
          const peer = 'p' + ++peerCounter;
          Object.assign(meta, { role: 'guest', code, peer });
          room.guests.set(peer, socket);
          send(room.host, { ...message, t: 'join', peer });
        }
        return;
      }
      const room = rooms.get(meta.code);
      if (!room) return;
      if (meta.role === 'host') {
        // L'hôte s'adresse à un invité (peer) ou à tous.
        const targets = message.peer ? [room.guests.get(message.peer)].filter(Boolean) : [...room.guests.values()];
        const text = JSON.stringify(message);
        for (const guest of targets) {
          send(guest, text);
          if (message.t === 'refuse' || message.t === 'kick') {
            room.guests.delete(guest.meta.peer);
            guest.meta.role = null;
            guest.close(1000, 'refusé');
          }
        }
      } else if (GUEST_TYPES.includes(message.t)) {
        // Un invité ne parle qu'à l'hôte ; le relais indique de quel invité vient le message.
        send(room.host, { ...message, peer: meta.peer });
      }
    });
    socket.on('close', () => {
      const meta = socket.meta,
        room = rooms.get(meta.code);
      if (!room) return;
      if (meta.role === 'host') closeRoom(meta.code);
      else if (meta.role === 'guest' && room.guests.get(meta.peer) === socket) {
        room.guests.delete(meta.peer);
        send(room.host, { t: 'left', peer: meta.peer });
      }
    });
  });
  // Connexions mortes : un ping toutes les 30 secondes.
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.meta.alive) socket.terminate();
      else {
        socket.meta.alive = false;
        socket.ping();
      }
    }
  }, 30000);
  heartbeat.unref?.();
  return {
    wss,
    rooms,
    get port() {
      return wss.address().port;
    },
    // Prêt quand le port écoute ; une erreur d'ouverture (port déjà pris…) rejette la promesse.
    ready: new Promise((resolve, reject) => {
      wss.once('listening', resolve);
      wss.once('error', reject);
    }),
    close: () =>
      new Promise(resolve => {
        clearInterval(heartbeat);
        for (const socket of wss.clients) socket.terminate();
        wss.close(() => resolve());
      })
  };
}

module.exports = { createRelay };

if (require.main === module) {
  const port = Number(process.env.PORT) || 8787;
  const relay = createRelay({ port, log: text => console.log('[relais] ' + text) });
  relay.ready.then(() => console.log('[relais] Canaan Online : relais prêt sur ws://localhost:' + relay.port));
}
