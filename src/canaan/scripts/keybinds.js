// Raccourcis clavier réglables (Paramètres → Clavier) : chaque action du jeu a deux touches au plus.
// Le jeu demande l'action d'une touche (actionOf) au lieu de comparer des lettres ; la manette envoie l'action
// elle-même, si bien qu'un changement de touche ne la dérègle jamais. Les flèches déplacent toujours le héros.
// Les touches choisies sont gardées dans les préférences de l'appareil ; les actions absentes reprennent leur défaut.
(() => {
  'use strict';
  // [id, nom affiché, touches par défaut, groupe]. « house » : la touche ne sert qu'en décorant la maison.
  const ACTIONS = [
    ['moveUp', 'Avancer', ['w', 'z'], 'Déplacement'],
    ['moveDown', 'Reculer', ['s'], 'Déplacement'],
    ['moveLeft', 'Aller à gauche', ['a'], 'Déplacement'],
    ['moveRight', 'Aller à droite', ['d'], 'Déplacement'],
    ['dodge', 'Roulade', [' ', 'shift'], 'Déplacement'],
    ['skill1', 'Compétence 1', ['1'], 'Combat'],
    ['skill2', 'Compétence 2', ['2'], 'Combat'],
    ['skill3', 'Compétence 3', ['3'], 'Combat'],
    ['skill4', 'Compétence 4', ['4'], 'Combat'],
    ['special', 'Sort de classe', ['f'], 'Combat'],
    ['switchWeapon', 'Changer d’arme', ['q'], 'Combat'],
    ['interact', 'Interagir', ['e'], 'Combat'],
    ['talents', 'Classe et talents', ['t'], 'Menus'],
    ['inventory', 'Inventaire', ['i'], 'Menus'],
    ['character', 'Personnage', ['c'], 'Menus'],
    ['map', 'Carte du monde', ['m'], 'Menus'],
    ['group', 'Groupe', ['g'], 'Menus'],
    ['trade', 'Échange', ['j'], 'Menus'],
    ['professions', 'Métiers', ['p'], 'Menus'],
    ['journal', 'Journal de quêtes', ['l'], 'Menus'],
    ['achievements', 'Succès et collections', ['y'], 'Menus'],
    ['wardrobe', 'Garde-robe', ['v'], 'Menus'],
    ['housing', 'Décorer la maison', ['h'], 'Menus'],
    ['chat', 'Écrire dans la discussion', ['enter'], 'Menus'],
    ['houseRotate', 'Tourner le meuble', ['r'], 'Maison', 'house']
  ].map(([id, name, defaults, group, context = 'game']) => ({ id, name, defaults, group, context }));
  const BY_ID = Object.fromEntries(ACTIONS.map(a => [a.id, a]));
  const SLOTS = 2;
  // Touches qu'on ne peut pas attribuer : Échap (pause, retour) et les flèches (toujours le déplacement).
  const RESERVED = new Set([
    'escape',
    'arrowup',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'f11',
    'f12',
    'tab'
  ]);
  const NAMES = {
    ' ': 'Espace',
    shift: 'Maj',
    control: 'Ctrl',
    alt: 'Alt',
    altgraph: 'Alt Gr',
    meta: 'Méta',
    enter: 'Entrée',
    backspace: 'Retour',
    delete: 'Suppr',
    insert: 'Inser',
    home: 'Début',
    end: 'Fin',
    pageup: 'Pg préc.',
    pagedown: 'Pg suiv.',
    capslock: 'Verr. maj',
    contextmenu: 'Menu'
  };
  let binds = {};
  let byKey = new Map();
  const listeners = [];

  const norm = key => (typeof key === 'string' ? key.toLowerCase() : '');
  function defaults() {
    return Object.fromEntries(ACTIONS.map(a => [a.id, padded(a.defaults)]));
  }
  function padded(list) {
    const out = list.slice(0, SLOTS);
    while (out.length < SLOTS) out.push('');
    return out;
  }
  function index() {
    const base = defaults();
    customized = ACTIONS.some(a => binds[a.id].join('|') !== base[a.id].join('|'));
    byKey = new Map();
    for (const a of ACTIONS) for (const k of binds[a.id]) if (k) byKey.set(a.context + ':' + k, a.id);
  }
  function load() {
    const saved = CANAAN_PREFERENCES.read('keybinds', {});
    binds = defaults();
    for (const a of ACTIONS) {
      const list = saved[a.id];
      if (Array.isArray(list) && list.every(k => typeof k === 'string' && !RESERVED.has(k)))
        binds[a.id] = padded(list.map(norm));
    }
    index();
  }
  function save() {
    CANAAN_PREFERENCES.write('keybinds', binds);
    index();
    for (const fn of listeners) fn();
  }

  // Action d'un événement clavier (ou d'une touche) : celle envoyée par la manette, sinon celle de la touche.
  function actionOf(eventOrKey, context = 'game') {
    if (eventOrKey && typeof eventOrKey === 'object') {
      if (eventOrKey.canaanAction) return eventOrKey.canaanAction;
      eventOrKey = eventOrKey.key;
    }
    return byKey.get(context + ':' + norm(eventOrKey)) || null;
  }
  const is = (event, id) => actionOf(event, BY_ID[id]?.context) === id;
  const keysOf = id => (binds[id] || []).filter(Boolean);
  const primary = id => keysOf(id)[0] || '';
  // Une action est-elle tenue ? (lu dans la table des touches enfoncées du jeu)
  const held = (pressed, id) => keysOf(id).some(k => pressed[k]);
  function label(key) {
    const k = norm(key);
    if (!k) return '—';
    if (NAMES[k]) return NAMES[k];
    return k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
  }
  const labelOf = id => label(primary(id));
  // Textes du jeu écrits avec la touche par défaut (« [E] Entrer », « touche T ») : l'étiquette de la touche choisie.
  // null si la lettre n'est la touche par défaut d'aucune action ; customized() : au moins une touche a changé.
  function fromDefault(key) {
    const k = norm(key);
    const action = ACTIONS.find(a => a.defaults[0] === k);
    return action ? labelOf(action.id) : null;
  }
  let customized = false;

  // Attribuer une touche : si une autre action de la même situation l'utilise, les deux échangent leurs touches.
  function bind(id, slot, key) {
    const action = BY_ID[id];
    const k = norm(key);
    if (!action || !(slot >= 0 && slot < SLOTS) || RESERVED.has(k)) return false;
    const old = binds[id][slot];
    for (const other of ACTIONS) {
      if (other.context !== action.context) continue;
      const list = binds[other.id];
      for (let s = 0; s < SLOTS; s++)
        if (list[s] === k && !(other.id === id && s === slot)) list[s] = other.id === id ? '' : old;
    }
    binds[id][slot] = k;
    save();
    return true;
  }
  function clear(id, slot) {
    if (!BY_ID[id] || !(slot >= 0 && slot < SLOTS)) return false;
    binds[id][slot] = '';
    save();
    return true;
  }
  function reset() {
    binds = defaults();
    save();
  }
  const onChange = fn => listeners.push(fn);

  // ---------------------------------------------------------------- Écran des Paramètres (onglet Clavier)
  let listening = null; // { id, slot }
  const escapeHtml = s =>
    String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function render() {
    const box = document.getElementById('setKeybinds');
    if (!box) return;
    let html = '',
      group = null;
    for (const a of ACTIONS) {
      if (a.group !== group) {
        if (group !== null) html += '</div>';
        group = a.group;
        html += '<h4>' + escapeHtml(group) + '</h4><div class="keybind-list">';
      }
      html +=
        '<div class="settings-row keybind-row"><span>' +
        escapeHtml(a.name) +
        '</span><div class="keybind-keys">';
      for (let s = 0; s < SLOTS; s++) {
        const wait = listening && listening.id === a.id && listening.slot === s;
        const k = binds[a.id][s];
        html +=
          '<button type="button" class="keybind' +
          (wait ? ' listening' : '') +
          (k ? '' : ' empty') +
          '" data-action="keybindCapture" data-bind="' +
          a.id +
          '" data-slot="' +
          s +
          '">' +
          (wait ? 'Appuie sur une touche…' : escapeHtml(k ? label(k) : '—')) +
          '</button>';
      }
      html += '</div></div>';
    }
    box.innerHTML = html + '</div>';
  }
  function capture(id, slot) {
    if (!BY_ID[id]) return;
    listening = listening && listening.id === id && listening.slot === slot ? null : { id, slot };
    render();
  }
  function stopCapture() {
    if (!listening) return;
    listening = null;
    render();
  }
  // Pendant l'attente d'une touche, elle est prise ici avant le jeu et les Paramètres :
  // Échap annule, Retour arrière ou Suppr vident la case.
  addEventListener(
    'keydown',
    e => {
      if (!listening) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      const k = norm(e.key);
      const { id, slot } = listening;
      listening = null;
      if (k === 'escape') return render();
      if (k === 'backspace' || k === 'delete') clear(id, slot);
      else if (RESERVED.has(k)) toast('Cette touche est réservée (Échap, flèches, Tab, F11, F12).');
      else bind(id, slot, k);
      render();
    },
    true
  );
  // Un clic ailleurs que sur une case annule l'attente.
  addEventListener(
    'mousedown',
    e => {
      if (listening && !e.target?.closest?.('[data-action="keybindCapture"]')) stopCapture();
    },
    true
  );
  function resetAll() {
    listening = null;
    reset();
    render();
    toast('⌨️ Touches par défaut rétablies.');
  }

  // ---------------------------------------------------------------- Étiquettes des touches dans l'interface
  // Boutons des menus (data-action → action) et barre des compétences.
  const MENU_BUTTONS = {
    toggleTalents: 'talents',
    toggleInventory: 'inventory',
    toggleCharacter: 'character',
    toggleMap: 'map',
    toggleGroup: 'group',
    toggleTrade: 'trade',
    toggleProfessions: 'professions',
    toggleJournal: 'journal',
    toggleAchievements: 'achievements',
    toggleHousing: 'housing'
  };
  function refreshLabels() {
    for (const [action, id] of Object.entries(MENU_BUTTONS)) {
      const button = document.querySelector('#menuButtons [data-action="' + action + '"]');
      if (!button) continue;
      const text = labelOf(id);
      const tag = button.querySelector('.menu-shortcut');
      if (tag) tag.textContent = text;
      for (const attr of ['title', 'aria-label']) {
        const v = button.getAttribute(attr);
        if (v) button.setAttribute(attr, v.replace(/\(([^,)]*)(,[^)]*)?\)\s*$/, '(' + text + '$2)'));
      }
    }
    for (let i = 0; i < 4; i++) {
      const key = document.querySelector('#skills [data-skill="' + i + '"] .key');
      if (key) key.textContent = labelOf('skill' + (i + 1));
    }
    const special = document.querySelector('#specialSkill .key');
    if (special) special.textContent = labelOf('special');
  }

  load();
  onChange(refreshLabels);
  refreshLabels();
  window.CANAAN_KEYS = Object.freeze({
    ACTIONS: Object.freeze(
      ACTIONS.map(a => Object.freeze({ ...a, defaults: Object.freeze(a.defaults.slice()) }))
    ),
    actionOf,
    is,
    keysOf,
    primary,
    held,
    label,
    labelOf,
    fromDefault,
    customized: () => customized,
    bind,
    clear,
    reset,
    onChange,
    render,
    refreshLabels,
    stopCapture,
    listening: () => (listening ? { ...listening } : null)
  });
  Object.assign(window, {
    keybindCapture: capture,
    keybindReset: resetAll
  });
})();
