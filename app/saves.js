// Sauvegardes en fichiers : trois slots d'aventure et un dossier de copies de secours.
// Module Node pur (aucune dépendance à Electron) : testé directement avec un dossier temporaire.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Format des sauvegardes : source unique partagée avec le jeu (shared/save/schema.js, module ES chargé par require).
const { SAVE_SCHEMA, SLOT_COUNT, isValidSave } = require('../src/canaan/shared/save/schema.js');
const SLOTS = Object.freeze(Array.from({ length: SLOT_COUNT }, (_, i) => i + 1));
// Une aventure pèse quelques dizaines de ko ; au-delà de 8 Mo, l'écriture est refusée.
const MAX_BYTES = 8 * 1024 * 1024;
// Copies « session » (une par lancement d'une aventure) gardées par slot. Les copies d'importation,
// de suppression ou de sauvegarde illisible ne sont jamais effacées automatiquement.
const KEEP_SESSION = 5;

function createSaveStore(dir) {
  const backups = path.join(dir, 'backups');
  const file = slot => path.join(dir, 'slot-' + slot + '.json');
  function checkSlot(slot) {
    if (!SLOTS.includes(slot)) throw new Error('Slot invalide : ' + slot);
  }
  function checkText(text) {
    if (typeof text !== 'string') throw new Error('Contenu de sauvegarde invalide');
    if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) throw new Error('Sauvegarde trop volumineuse');
  }
  // Écriture sûre : fichier temporaire écrit et synchronisé sur le disque, puis renommé.
  // Une coupure laisse soit l'ancien fichier, soit le nouveau, jamais un fichier à moitié écrit.
  function atomicWrite(target, text) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = target + '.tmp';
    const fd = fs.openSync(tmp, 'w');
    try {
      fs.writeSync(fd, text);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, target);
  }
  function read(slot) {
    checkSlot(slot);
    try {
      return fs.readFileSync(file(slot), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
  function write(slot, text) {
    checkSlot(slot);
    checkText(text);
    if (!isValidSave(JSON.parse(text))) throw new Error('Schéma de sauvegarde refusé');
    atomicWrite(file(slot), text);
    return true;
  }
  function stamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
  // Copie de secours vérifiée : relue après écriture. Renvoie le nom du fichier créé.
  function backupText(prefix, reason, text) {
    checkText(text);
    if (!/^[a-z0-9-]{1,40}$/.test(prefix) || !/^[a-z0-9-]{1,30}$/.test(reason))
      throw new Error('Nom de copie invalide');
    let name = prefix + '-' + stamp() + '-' + reason + '.json',
      index = 0;
    while (fs.existsSync(path.join(backups, name)))
      name = prefix + '-' + stamp() + '-' + reason + '-' + ++index + '.json';
    const target = path.join(backups, name);
    atomicWrite(target, text);
    if (fs.readFileSync(target, 'utf8') !== text)
      throw new Error('La copie de secours n’a pas pu être vérifiée.');
    prune(prefix);
    return name;
  }
  function prune(prefix) {
    const sessions = fs
      .readdirSync(backups)
      .filter(name => name.startsWith(prefix + '-') && /-session(-\d+)?\.json$/.test(name))
      .sort();
    for (const name of sessions.slice(0, Math.max(0, sessions.length - KEEP_SESSION)))
      fs.unlinkSync(path.join(backups, name));
  }
  function backup(slot, reason) {
    const text = read(slot);
    return text === null ? null : backupText('slot-' + slot, reason, text);
  }
  // Supprimer un slot : une copie « suppression » est toujours gardée dans backups/.
  function remove(slot) {
    const name = backup(slot, 'suppression');
    try {
      fs.unlinkSync(file(slot));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return name;
  }
  function list() {
    return SLOTS.map(slot => ({ slot, text: read(slot) }));
  }
  return Object.freeze({ dir, backupsDir: backups, read, write, backup, backupText, remove, list });
}

module.exports = { createSaveStore, SAVE_SCHEMA, SLOTS, MAX_BYTES, KEEP_SESSION };
