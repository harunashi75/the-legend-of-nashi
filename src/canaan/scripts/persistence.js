// CANAAN CORE — sauvegarde par slot d'aventure (schéma 10 : monde, héros de l'hôte, héros invités).
// Seul le schéma courant est lu ; toute autre sauvegarde est préservée et propose « Repartir à neuf ».
// Schéma, validation et format des aventures : shared/save/schema.js.
window.CANAAN_SAVE_SCHEMA = SAVE_SCHEMA;
const CANAAN_SLOT_COUNT = SLOT_COUNT;
// Ancienne clé unique du navigateur (schéma 9) : lue une seule fois, pour l'importer dans le slot 1.
const CANAAN_LEGACY_SAVE_KEY = 'canaan_dev_18999_state';
const CANAAN_PENDING_SLOT_KEY = 'canaan_pending_slot';
// Stockage des slots : fichiers dans l'application de bureau, sinon stockage local (build HTML de test).
// Les deux offrent la même interface synchrone.
window.CANAAN_SAVE_STORE = (() => {
  const key = slot => 'canaan_slot_' + slot;
  const desktop = window.canaanDesktop;
  if (desktop)
    return Object.freeze({
      kind: 'fichiers',
      key,
      read: slot => desktop.read(slot),
      write: (slot, text) => desktop.write(slot, text),
      backup: (slot, reason) => desktop.backup(slot, reason),
      backupText: (prefix, reason, text) => desktop.backupText(prefix, reason, text),
      remove: slot => desktop.remove(slot),
      openFolder: () => desktop.openFolder()
    });
  function backupText(prefix, reason, text) {
    const base = prefix + '_backup_' + Date.now();
    let name = base,
      index = 0;
    while (localStorage.getItem(name) !== null) name = base + '_' + ++index;
    localStorage.setItem(name, text);
    if (localStorage.getItem(name) !== text) throw new Error('La copie de secours n’a pas pu être vérifiée.');
    return name;
  }
  function backup(slot, reason) {
    const text = localStorage.getItem(key(slot));
    return text === null ? null : backupText(key(slot), reason, text);
  }
  return Object.freeze({
    kind: 'navigateur',
    key,
    read: slot => localStorage.getItem(key(slot)),
    write(slot, text) {
      // setItem est atomique : un échec d'écriture conserve la valeur précédente.
      localStorage.setItem(key(slot), text);
      if (localStorage.getItem(key(slot)) !== text) throw new Error('Écriture non vérifiée');
      return true;
    },
    backup,
    backupText,
    remove(slot) {
      const name = backup(slot, 'suppression');
      localStorage.removeItem(key(slot));
      return name;
    },
    openFolder: null
  });
})();
// Normaliser transforme uniquement l'identité, les métadonnées et les points Ratings52.
// Cette passe complète est réservée au chargement ou à une actualisation explicite.
window.CANAAN_GEAR = {
  normalize(item) {
    return window.CANAAN_GEAR_ENGINE.normalize(item);
  },
  normalizeAll() {
    for (const item of [...game.hero.inventory, ...Object.values(game.hero.equipment)]) this.normalize(item);
  },
  grant(level, source = 'normal', rarity = null, hero = game.hero) {
    return window.CANAAN_GEAR_ENGINE.grant(level, source, rarity, hero);
  },
  refresh() {
    this.normalizeAll();
    recomputeStats();
    refreshWeaponBar();
  }
};
window.CANAAN_LOOT = {
  grant(level, source = 'normal', rarity = null, hero = game.hero) {
    return window.CANAAN_GEAR_ENGINE.grant(level, source, rarity, hero);
  },
  instance(index) {
    return dropTierGear(index);
  }
};
window.CANAAN_PERSISTENCE = {
  slot: 1,
  meta: { nom: 'Aventure 1', created: 0 },
  _timer: null,
  _loadFailed: false,
  _failedRaw: null,
  lastBackupKey: null,
  get key() {
    return CANAAN_SAVE_STORE.key(this.slot);
  },
  validSlot(slot) {
    return isValidSlot(slot);
  },
  selectSlot(slot) {
    if (!this.validSlot(slot)) throw new Error('Slot invalide : ' + slot);
    this.slot = slot;
    this.meta = { nom: 'Aventure ' + slot, created: 0 };
    this._loadFailed = false;
    this._failedRaw = null;
  },
  cleanName(name, slot) {
    return cleanAdventureName(name, slot);
  },
  // Slot à ouvrir après le rechargement de la page (choisi dans le menu des aventures).
  setPending(slot) {
    try {
      sessionStorage.setItem(CANAAN_PENDING_SLOT_KEY, String(slot));
      return true;
    } catch {
      return false;
    }
  },
  takePending() {
    try {
      const slot = Number(sessionStorage.getItem(CANAAN_PENDING_SLOT_KEY));
      sessionStorage.removeItem(CANAAN_PENDING_SLOT_KEY);
      return this.validSlot(slot) ? slot : null;
    } catch {
      return null;
    }
  },
  showRecovery(message = '') {
    document.getElementById('saveRecovery').hidden = !this._loadFailed;
    document.getElementById('saveRecoveryStatus').textContent = message;
  },
  requestSave(delay = 1200) {
    if (this._timer !== null) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      if (started) this.save();
    }, delay);
  },
  // Héros de l'hôte au format de sauvegarde (les talents, Rubis et records ne gèrent encore que l'hôte).
  heroSnapshot(position, hero = game.hero) {
    const p = hero.player;
    return {
      look: sanitizeLook(hero.look),
      // Garde-robe : apparences trouvées (la tenue portée est dans l'apparence).
      skins: { owned: [...(hero.skins?.owned || [])] },
      // Bénédiction du Grand Arbre (jour et fin).
      ...(hero.blessing ? { blessing: { day: hero.blessing.day, until: hero.blessing.until } } : {}),
      // Clés des secrets : gardées seulement quand le héros en a.
      player: {
        x: position.x,
        y: position.y,
        hp: p.hp,
        mp: p.mp,
        gold: p.gold,
        ...(p.keys > 0 ? { keys: Math.floor(p.keys) } : {})
      },
      level: clampLevel(hero.level),
      exp: Math.max(0, Math.floor(hero.exp || 0)),
      kills: hero.kills,
      inventory: hero.inventory,
      equipment: hero.equipment,
      bank: CANAAN_BANK.export(hero),
      bagLevel: window.CANAAN_BAG_STATE.export(),
      classe: window.CANAAN_CLASS_STATE.export(),
      rubis: window.CANAAN_RUBIS_STATE.export(),
      arena: window.CANAAN_ARENA_STATE.export(),
      prof: CANAAN_PROF.sanitize(hero.prof),
      // Succès et bestiaire.
      succes: CANAAN_ACHIEVEMENTS.export(hero),
      // Quêtes : actives, terminées, secrets débloqués, décorations et choix narratifs.
      quetes: sanitizeQuests(hero.quetes)
    };
  },
  snapshot() {
    // Les combats d'instance ne sont pas persistés : reprendre à l'entrée extérieure.
    const position = P.dead ? CANAAN_SPAWN : game.world.instance ? game.world.returnPos || CANAAN_SPAWN : P;
    return {
      schema: CANAAN_SAVE_SCHEMA,
      version: window.CANAAN_VERSION,
      nom: this.meta.nom,
      created: this.meta.created || Date.now(),
      updated: Date.now(),
      // Résumé affiché par le menu des aventures sans recharger tout le héros.
      resume: { level: clampLevel(game.hero.level), gold: P.gold, classe: game.hero.classe.id },
      // couche : l'île ou les Tréfonds (en instance, celle d'où l'on est entré : on y reprend devant le portail).
      monde: {
        openedChests: game.world.openedChests,
        worldBossTimers: game.world.worldBossTimers,
        quetes: CANAAN_QUESTS.exportWorld(),
        couche:
          (game.world.instance ? game.world.returnLayer : game.world.layer) === 'under' ? 'under' : 'surface'
      },
      // Invités : position du groupe comme l'hôte (entrée de l'instance, ou camp après une chute de l'hôte).
      heros: { hote: this.heroSnapshot(position), invites: CANAAN_GROUP.exportGuests(() => position) }
    };
  },
  freshSnapshot(nom = this.meta.nom, look = null, classe = null) {
    return freshSave({
      nom,
      look,
      classe,
      slot: this.slot,
      version: window.CANAAN_VERSION,
      now: Date.now(),
      spawn: CANAAN_SPAWN,
      baseMana: CANAAN_BASE_MANA
    });
  },
  validSave(d) {
    return isValidSave(d);
  },
  // Résumé d'un slot pour le menu : vide, illisible, ou aventure (nom, niveau, classe, or, pseudos des invités).
  summary(slot) {
    try {
      return summarizeSave(CANAAN_SAVE_STORE.read(slot), slot);
    } catch {
      return { slot, state: 'illisible' };
    }
  },
  // Nouvelle aventure dans un slot vide. Un slot occupé n'est jamais remplacé.
  createSlot(slot, nom, look = null, classe = null) {
    if (!this.validSlot(slot) || CANAAN_SAVE_STORE.read(slot) !== null) return false;
    const previous = this.slot;
    this.slot = slot;
    const data = this.freshSnapshot(nom, look, classe);
    this.slot = previous;
    return CANAAN_SAVE_STORE.write(slot, JSON.stringify(data)) === true;
  },
  // Supprimer une aventure : une copie de secours est gardée avant l'effacement.
  deleteSlot(slot) {
    if (!this.validSlot(slot)) return false;
    CANAAN_SAVE_STORE.remove(slot);
    return CANAAN_SAVE_STORE.read(slot) === null;
  },
  // Copie « session » au lancement d'une aventure : quelques copies récentes par slot.
  sessionBackup() {
    try {
      return CANAAN_SAVE_STORE.backup(this.slot, 'session');
    } catch (error) {
      console.error('[CANAAN] Copie de session impossible', error);
      return null;
    }
  },
  // Importation unique de l'ancienne partie du navigateur (schéma 9) vers le slot 1.
  // Elle n'a lieu que si aucun slot n'existe ; la source est archivée avant d'être retirée.
  convertLegacy(d) {
    return convertLegacySave(d, { version: window.CANAAN_VERSION, now: Date.now() });
  },
  importLegacy() {
    try {
      const raw = localStorage.getItem(CANAAN_LEGACY_SAVE_KEY);
      if (raw === null) return false;
      for (let slot = 1; slot <= CANAAN_SLOT_COUNT; slot++)
        if (CANAAN_SAVE_STORE.read(slot) !== null) return false;
      const d = JSON.parse(raw);
      if (!d || d.schema !== 9) return false;
      const encoded = JSON.stringify(this.convertLegacy(d));
      // Archiver d'abord la source exacte, écrire le slot, le relire, puis seulement retirer l'ancienne clé.
      CANAAN_SAVE_STORE.backupText('import-navigateur', 'schema9', raw);
      CANAAN_SAVE_STORE.write(1, encoded);
      if (CANAAN_SAVE_STORE.read(1) !== encoded) throw new Error('Slot 1 non vérifié après importation');
      localStorage.removeItem(CANAAN_LEGACY_SAVE_KEY);
      return true;
    } catch (error) {
      console.error('[CANAAN] Importation de l’ancienne partie impossible', error);
      return false;
    }
  },
  restartFresh() {
    if (!this._loadFailed) return false;
    try {
      const raw = CANAAN_SAVE_STORE.read(this.slot);
      if (raw === null || raw !== this._failedRaw)
        throw new Error('La sauvegarde a changé. Recharge la page avant de réessayer.');
      const fresh = JSON.stringify(this.freshSnapshot('Aventure ' + this.slot));
      this.lastBackupKey = CANAAN_SAVE_STORE.backupText(
        CANAAN_SAVE_STORE.kind === 'fichiers' ? 'slot-' + this.slot : this.key,
        'illisible',
        raw
      );
      if (CANAAN_SAVE_STORE.read(this.slot) !== raw)
        throw new Error('La sauvegarde a changé. Recharge la page.');
      CANAAN_SAVE_STORE.write(this.slot, fresh);
    } catch (error) {
      console.error('[CANAAN] Réinitialisation impossible', error);
      this.showRecovery(
        'Impossible de repartir à neuf : ' + error.message + ' La sauvegarde originale est conservée.'
      );
      return false;
    }
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._loadFailed = false;
    this._failedRaw = null;
    started = false;
    paused = true;
    this.showRecovery();
    this.setPending(this.slot);
    window.location.reload();
    return true;
  },
  save() {
    // Un invité ne sauvegarde rien : son héros est rangé dans la sauvegarde de l'hôte.
    if (game.mode === 'guest') return false;
    // Préserver une sauvegarde illisible plutôt que l'écraser lors d'une sauvegarde automatique.
    if (this._loadFailed) {
      this.showRecovery(
        'Sauvegarde bloquée : utilise « Repartir à neuf » pour créer une copie de secours et recommencer.'
      );
      return false;
    }
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    try {
      return CANAAN_SAVE_STORE.write(this.slot, JSON.stringify(this.snapshot())) === true;
    } catch (e) {
      console.error('[CANAAN] Échec de sauvegarde', e);
      return false;
    }
  },
  load() {
    let d, raw;
    try {
      raw = CANAAN_SAVE_STORE.read(this.slot);
      d = JSON.parse(raw || 'null');
      if (raw !== null && !this.validSave(d)) throw new Error('Format de sauvegarde non pris en charge');
    } catch (e) {
      this._loadFailed = true;
      this._failedRaw = raw;
      this.showRecovery();
      console.error('[CANAAN] Sauvegarde illisible', e);
      return false;
    }
    this._loadFailed = false;
    this._failedRaw = null;
    this.showRecovery();
    const nonnegative = v => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
    if (!d) return false;
    const h = d.heros.hote,
      monde = d.monde || {};
    this.meta = { nom: this.cleanName(d.nom, this.slot), created: Number(d.created) || Date.now() };
    const p = h.player || {};
    const savedHp = Number.isFinite(p.hp) ? p.hp : P.hp,
      savedMp = Number.isFinite(p.mp) ? p.mp : P.mp;
    // Toujours interpréter les coordonnées sauvegardées dans le monde extérieur.
    game.world.instance = null;
    game.world.returnPos = null;
    game.world.layer = 'surface';
    game.world.tiles = game.world.overworld;
    game.world.decor = game.world.overdecor;
    game.world.chests = [];
    game.world.projectiles = [];
    // Monde des quêtes : pont, lanternes, sanctuaires ouverts et énigmes résolues.
    CANAAN_QUESTS.importWorld(monde.quetes);
    P.x = Number.isFinite(p.x) ? p.x : CANAAN_SPAWN.x;
    P.y = Number.isFinite(p.y) ? p.y : CANAAN_SPAWN.y;
    // Partie sauvegardée dans les Tréfonds : on y reprend (à la forteresse si la place n'est plus praticable).
    if (monde.couche === 'under') CANAAN_UNDER.setLayer('under');
    const home = canaanUnder() ? CANAAN_UNDER.spawnPoint() : CANAAN_SPAWN;
    if (P.x < 0 || P.y < 0 || P.x / TS >= MAPW || P.y / TS >= MAPH || !canWalk(P.x, P.y)) {
      P.x = home.x;
      P.y = home.y;
    }
    P.gold = nonnegative(p.gold);
    P.keys = nonnegative(p.keys);
    game.hero.kills = nonnegative(h.kills);
    // Apparence (les aventures d'avant la création de personnage gardent le héros d'origine).
    game.hero.look = sanitizeLook(h.look);
    // Garde-robe : seulement des apparences connues ; la tenue portée doit en faire partie.
    game.hero.skins = {
      owned: [
        ...new Set((Array.isArray(h.skins?.owned) ? h.skins.owned : []).filter(id => SKIN_IDS.includes(id)))
      ]
    };
    if (!game.hero.skins.owned.includes(game.hero.look.wear)) delete game.hero.look.wear;
    game.hero.blessing =
      typeof h.blessing?.day === 'string' && Number.isFinite(Number(h.blessing.until))
        ? { day: h.blessing.day.slice(0, 10), until: Number(h.blessing.until) }
        : null;
    // Métiers (les aventures d'avant les métiers commencent au niveau 1).
    game.hero.prof = CANAAN_PROF.sanitize(h.prof);
    game.hero.succes = CANAAN_ACHIEVEMENTS.sanitize(h.succes);
    game.hero.quetes = sanitizeQuests(h.quetes);
    const validItem = it =>
      it &&
      typeof it === 'object' &&
      !Array.isArray(it) &&
      Object.hasOwn(gearSlots, it.slot) &&
      it.slot !== 'weapon2' &&
      Number.isFinite(Number(it.level ?? it.ilvl ?? 1)) &&
      Number(it.level ?? it.ilvl ?? 1) > 0;
    game.hero.inventory = Array.isArray(h.inventory) ? h.inventory.filter(validItem) : [];
    game.hero.bank = CANAAN_BANK.sanitize(h.bank);
    game.hero.equipment = Object.fromEntries(
      Object.keys(gearSlots).map(slot => {
        const it = h.equipment?.[slot];
        return [slot, validItem(it) && it.slot === (slot === 'weapon2' ? 'weapon' : slot) ? it : null];
      })
    );
    game.world.openedChests = Array.isArray(monde.openedChests)
      ? [...new Set(monde.openedChests.filter(id => typeof id === 'string' || Number.isFinite(id)))]
      : [];
    game.world.worldBossTimers = {};
    if (monde.worldBossTimers && typeof monde.worldBossTimers === 'object') {
      for (const [id, expiry] of Object.entries(monde.worldBossTimers))
        if (Number.isFinite(expiry)) game.world.worldBossTimers[id] = expiry;
    }
    // Anciens matériaux de forge (supprimés avec l'artisanat) : rendus en or, une seule fois (la sauvegarde
    // suivante ne les contient plus).
    const refund = legacyMaterialGold(h.materials, LEGACY_MATERIAL_GOLD);
    if (refund) {
      P.gold += refund;
      chat(
        'Système',
        'L’artisanat a disparu : tes anciens matériaux de forge ont été échangés contre ' + refund + ' or.'
      );
    }
    window.CANAAN_BAG_STATE.import(h.bagLevel);
    window.CANAAN_GEAR.normalizeAll();
    // Niveau et XP. Ancienne aventure (avant les niveaux) : l'iLvl des objets devient leur niveau, et le héros prend
    // le niveau de sa meilleure pièce portée, pour pouvoir garder son équipement.
    const legacy = !Number.isFinite(Number(h.level));
    game.hero.level = clampLevel(
      legacy ? Math.max(1, ...Object.values(game.hero.equipment).filter(Boolean).map(itemLevel)) : h.level
    );
    game.hero.exp = Math.min(nonnegative(h.exp), Math.max(0, xpToNext(game.hero.level) - 1));
    if (legacy && game.hero.level > 1)
      chat(
        'Système',
        'Les niveaux arrivent : ton héros commence au niveau ' +
          game.hero.level +
          ', celui de ton meilleur équipement.'
      );
    // Classe et talents ; une aventure d'avant les classes (anciennes voies) choisit sa classe en arrivant.
    window.CANAAN_CLASS_STATE.import(h.classe);
    if (h.ways && !h.classe)
      chat('Système', 'Les voies sont remplacées par les classes : choisis ta classe et tes talents (T).');
    window.CANAAN_RUBIS_STATE.import(CANAAN_BANK.withBankedRubis(h.bank, h.rubis));
    window.CANAAN_ARENA_STATE.import(h.arena);
    CANAAN_GROUP.importGuests(d.heros.invites);
    P.dead = false;
    recomputeStats();
    // recomputeStats peut augmenter les PV lors d'un équipement : restaurer les valeurs sauvées après.
    P.hp = Math.max(1, Math.min(P.mhp, savedHp));
    P.mp = Math.max(0, Math.min(P.mmp, savedMp));
    refreshWeaponBar();
    return true;
  }
};
// Entrées publiques uniques de sauvegarde.
function saveGame() {
  return CANAAN_PERSISTENCE.save();
}
function loadGame() {
  const loaded = CANAAN_PERSISTENCE.load();
  if (loaded) toast('Partie retrouvée !');
  else if (CANAAN_PERSISTENCE._loadFailed)
    toast('Sauvegarde illisible : utilise le bouton « Repartir à neuf ».');
  return loaded;
}
