// Manette (Xbox, PlayStation, Steam Deck, Switch Pro… en disposition standard) : jouer et naviguer dans les menus sans
// clavier ni souris. Les règles de lecture (zone morte, directions, voisin dans l'interface) sont dans
// client/input/gamepad.js ; ce script les branche sur le jeu.
//
// En jeu : stick gauche pour se déplacer, stick droit pour viser (sinon visée automatique du monstre le plus
// proche), RT attaque rapide et LT attaque lourde (maintenues), A interagir, B roulade, X / Y / LB / RB compétences
// 1 à 4, croix : ↑ sort de classe, ↓ changer d'arme, ← carte, → sac ; Start pause ; View ouvre la barre des menus.
// Dans les menus : croix ou stick gauche pour choisir, A valider, B retour, stick droit pour faire défiler.
//
// Les boutons du jeu passent par les mêmes événements que le clavier (keydown / keyup) et nomment leur action
// (CANAAN_KEYS) : chaque action garde une seule implémentation, et changer les touches du clavier ne dérègle pas la
// manette. La manette prend la main dès qu'on la touche ; la souris ou le clavier la reprennent dès
// qu'on s'en sert.
(() => {
  'use strict';
  const B = PAD_BUTTONS;
  // Boutons de jeu → action du clavier (Paramètres → Clavier) ; Start fait Échap.
  const BUTTON_KEYS = {
    [B.A]: 'interact',
    [B.B]: 'dodge',
    [B.X]: 'skill1',
    [B.Y]: 'skill2',
    [B.LB]: 'skill3',
    [B.RB]: 'skill4',
    [B.UP]: 'special',
    [B.DOWN]: 'switchWeapon',
    [B.LEFT]: 'map',
    [B.RIGHT]: 'inventory',
    [B.START]: 'escape'
  };
  const ATTACKS = { [B.RT]: 0, [B.LT]: 2 }; // bouton de souris équivalent : gauche rapide, droit lourde
  const MOVE_KEYS = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
  const AIM_RANGE = 160,
    AUTO_AIM_RANGE = 420,
    AIM_MEMORY_MS = 800;
  // Éléments qu'on peut atteindre dans les menus.
  const FOCUSABLE =
    'button, [data-action], input:not([type="hidden"]), select, textarea, a[href], [data-tooltip-index], [data-tooltip-slot], [data-tooltip-stack], [data-tooltip-rubis], [data-tooltip-shop], [data-tooltip-trade], [data-tooltip-bank], [data-skill], [tabindex]:not([tabindex="-1"])';
  // Action principale d'un écran (Créer l'aventure, Reprendre…), choisie en premier quand l'écran change.
  const PRIMARY = '.slot-primary, [autofocus], [data-action="resume"]';
  const BACK =
    '[data-action="closePanels"], [data-action="closeSettings"], [data-action="resume"], [data-action="cancelSlotMenu"]';

  let prev = null,
    active = false,
    menuBar = false,
    focus = null,
    focusSig = null,
    focusCenter = null,
    scopeEl = null,
    moving = new Set(),
    lastMove = null,
    lastAim = null,
    lastAimAt = -Infinity,
    lastShake = 0,
    editing = null,
    lastHp = null,
    gameMode = false;
  const held = new Set(),
    repeat = {};

  // ---------------------------------------------------------------- Appareil actif
  function setActive(on) {
    if (active === on) return;
    active = on;
    document.body?.classList?.toggle('pad-active', on);
    if (!on) setFocus(null);
  }
  addEventListener('mousemove', e => {
    if (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) > 2) setActive(false);
  });
  addEventListener('mousedown', () => setActive(false));
  addEventListener('keydown', e => {
    if (e.isTrusted) setActive(false);
  });
  addEventListener('gamepadconnected', () => toast('🎮 Manette connectée'));
  addEventListener('gamepaddisconnected', () => {
    toast('🎮 Manette déconnectée');
    releaseGame();
  });

  // ---------------------------------------------------------------- Touches simulées
  // key : 'escape' ou une action de CANAAN_KEYS (envoyée avec la touche qui lui est attribuée, s'il y en a une).
  function send(type, key) {
    const action = key === 'escape' ? null : key;
    const event = new KeyboardEvent(type, {
      key: action ? CANAAN_KEYS.primary(action) || 'Unidentified' : 'Escape',
      bubbles: true,
      cancelable: true
    });
    if (action) event.canaanAction = action;
    document.dispatchEvent(event);
  }
  function keyDown(key) {
    held.add(key);
    send('keydown', key);
  }
  function keyUp(key) {
    if (!held.delete(key)) return;
    send('keyup', key);
  }
  function setMove([dx, dy]) {
    const want = new Set();
    if (dx < 0) want.add('arrowleft');
    if (dx > 0) want.add('arrowright');
    if (dy < 0) want.add('arrowup');
    if (dy > 0) want.add('arrowdown');
    for (const k of moving) if (!want.has(k)) keys[k] = false;
    for (const k of want) keys[k] = true;
    moving = want;
    if (dx || dy) lastMove = [dx, dy];
  }
  // Tout relâcher (menu ouvert, manette débranchée) : le héros ne garde ni direction, ni attaque, ni touche.
  function releaseGame() {
    if (!gameMode && !moving.size && !held.size) return;
    setMove([0, 0]);
    for (const button of Object.keys(ATTACKS)) canaanHoldBasicAttack(ATTACKS[button], false);
    for (const key of [...held]) keyUp(key);
    gameMode = false;
  }

  // ---------------------------------------------------------------- En jeu
  function nearestMonster(range) {
    let best = null,
      bestD = range;
    for (const m of game.world.monsters) {
      if (!(m.hp > 0)) continue;
      const d = Math.hypot(m.x - P.x, m.y - P.y);
      if (d < bestD) {
        best = m;
        bestD = d;
      }
    }
    return best;
  }
  function aim(cur, now) {
    if (!active || P.dead) return;
    const s = padStick(cur.rx, cur.ry);
    let tx, ty;
    if (s.mag) {
      lastAim = [s.x / s.mag, s.y / s.mag];
      lastAimAt = now;
    }
    if (lastAim && now - lastAimAt < AIM_MEMORY_MS) {
      tx = P.x + lastAim[0] * AIM_RANGE;
      ty = P.y + lastAim[1] * AIM_RANGE;
    } else {
      const m = nearestMonster(AUTO_AIM_RANGE);
      const d = lastMove ? lastMove : [P.face < 0 ? -1 : 1, 0];
      const l = Math.hypot(d[0], d[1]) || 1;
      tx = m ? m.x : P.x + (d[0] / l) * AIM_RANGE;
      ty = m ? m.y : P.y + (d[1] / l) * AIM_RANGE;
    }
    CANAAN_BASIC_ATTACK.aimAt(tx - camX, ty - camY);
  }
  function gameStep(cur, edges, now) {
    gameMode = true;
    setFocus(null);
    scopeEl = null;
    setMove(padDirection8(cur.lx, cur.ly));
    aim(cur, now);
    // Vibrations : une secousse de l'écran (coup de boss, explosion…) vibre fort, un coup reçu vibre un peu.
    if (shake > lastShake + 0.5) rumble(Math.min(1, shake / 18), 90 + shake * 8);
    else if (lastHp !== null && P.hp < lastHp - 0.5) rumble(0.3, 90);
    lastShake = shake;
    lastHp = P.hp;
    for (const b of edges.down) {
      if (b === B.VIEW) {
        menuBar = true;
        releaseGame();
        return;
      }
      if (Object.hasOwn(ATTACKS, b)) {
        if (!P.dead) canaanHoldBasicAttack(ATTACKS[b], true);
      } else if (Object.hasOwn(BUTTON_KEYS, b)) keyDown(BUTTON_KEYS[b]);
    }
    for (const b of edges.up) {
      if (Object.hasOwn(ATTACKS, b)) canaanHoldBasicAttack(ATTACKS[b], false);
      else if (Object.hasOwn(BUTTON_KEYS, b)) keyUp(BUTTON_KEYS[b]);
    }
  }

  // ---------------------------------------------------------------- Menus
  const shown = el => !!el && !el.hidden && !!el.getClientRects?.().length;
  // Fenêtre au premier plan, ou null en jeu.
  function menuScope() {
    const recovery = document.getElementById('saveRecovery');
    if (shown(recovery)) return recovery;
    const settings = document.getElementById('settingsScreen');
    if (settings?.classList.contains('visible')) return settings;
    if (modalOpen()) return document.getElementById('window');
    const dialog = document.getElementById('dialog');
    if (dialog?.style.display === 'block') return dialog;
    const pause = document.getElementById('pauseScreen');
    if (pause?.classList.contains('visible')) return pause;
    if (!started) return document.getElementById('title');
    if (menuBar) return document.getElementById('menuButtons');
    return null;
  }
  function candidates(scope) {
    const all = [...scope.querySelectorAll(FOCUSABLE)].filter(
      el => !el.disabled && shown(el) && getComputedStyle(el).visibility !== 'hidden'
    );
    // Le plus intérieur : une carte cliquable cède la place aux boutons qu'elle contient.
    return all.filter(el => !all.some(o => o !== el && el.contains(o)));
  }
  const rectOf = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const signature = el =>
    [el.id, el.tagName, JSON.stringify(el.dataset || {}), (el.textContent || '').trim().slice(0, 40)].join(
      '|'
    );
  function hover(el, enter) {
    if (typeof PointerEvent !== 'function' || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    el.dispatchEvent(
      new PointerEvent(enter ? 'pointerover' : 'pointerout', {
        bubbles: true,
        clientX: r.right,
        clientY: r.top + r.height / 2
      })
    );
  }
  function setFocus(el) {
    if (focus === el) return;
    if (focus) {
      focus.classList.remove('pad-focus');
      hover(focus, false);
    }
    focus = el;
    if (!el) return;
    el.classList.add('pad-focus');
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const r = rectOf(el);
    focusCenter = [r.x + r.w / 2, r.y + r.h / 2];
    focusSig = signature(el);
    hover(el, true);
  }
  // Après un nouveau rendu (panneau redessiné, nouvel écran), garder un élément choisi au même endroit.
  function ensureFocus(list) {
    if (focus && list.includes(focus)) return;
    if (focus) focus.classList.remove('pad-focus');
    focus = null;
    // Même élément (panneau redessiné) ; sinon, nouvel écran : son action principale ; sinon le plus proche.
    let pick =
      (focusSig && list.find(el => signature(el) === focusSig)) || list.find(el => el.matches(PRIMARY));
    if (!pick && focusCenter) {
      let best = Infinity;
      for (const el of list) {
        const r = rectOf(el),
          d = Math.hypot(r.x + r.w / 2 - focusCenter[0], r.y + r.h / 2 - focusCenter[1]);
        if (d < best) {
          best = d;
          pick = el;
        }
      }
    }
    setFocus(pick || list[0] || null);
  }
  function step(list, dir) {
    if (!focus) return;
    const rects = list.map(rectOf),
      from = rectOf(focus);
    let i = padNeighbor(from, rects, dir);
    // Diagonale sans voisin : essayer chaque axe.
    if (i < 0 && dir[0] && dir[1]) i = padNeighbor(from, rects, [dir[0], 0]);
    if (i < 0 && dir[0] && dir[1]) i = padNeighbor(from, rects, [0, dir[1]]);
    if (i >= 0) setFocus(list[i]);
  }
  function activate(el) {
    if (el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'))
      el.focus();
    else el.click();
  }
  function back(scope) {
    if (scope.id === 'menuButtons') {
      menuBar = false;
      return;
    }
    const button = [...scope.querySelectorAll(BACK)].find(shown);
    if (button) button.click();
    else {
      send('keydown', 'escape');
      send('keyup', 'escape');
    }
  }
  function scrollerOf(el) {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
    }
    return null;
  }
  function menuStep(scope, cur, edges, now) {
    releaseGame();
    if (scope !== scopeEl) {
      scopeEl = scope;
      focusSig = focusCenter = null;
      setFocus(null);
    }
    const list = active ? candidates(scope) : [];
    if (active) ensureFocus(list);
    const dpad = [
      (cur.buttons[B.RIGHT] ? 1 : 0) - (cur.buttons[B.LEFT] ? 1 : 0),
      (cur.buttons[B.DOWN] ? 1 : 0) - (cur.buttons[B.UP] ? 1 : 0)
    ];
    const dir = dpad[0] || dpad[1] ? dpad : padDirection8(cur.lx, cur.ly);
    if (padRepeat(repeat, dir, now)) step(list, dir);
    const rs = padStick(cur.rx, cur.ry);
    if (rs.mag) scrollerOf(focus || scope)?.scrollBy(0, rs.y * 24);
    for (const b of edges.down) {
      if (b === B.A && focus) activate(focus);
      else if (b === B.B) back(scope);
      // LB / RB : onglet précédent ou suivant (Paramètres).
      else if ((b === B.LB || b === B.RB) && scope.querySelector?.('.settings-tabs'))
        settingsTabStep(b === B.RB ? 1 : -1);
      else if (b === B.START) {
        if (scope.id === 'menuButtons') menuBar = false;
        else {
          send('keydown', 'escape');
          send('keyup', 'escape');
        }
      } else if (b === B.VIEW && scope.id === 'menuButtons') menuBar = false;
    }
  }

  // ---------------------------------------------------------------- Lecture
  function firstPad() {
    const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean);
    return pads.find(gp => gp.mapping === 'standard') || pads[0] || null;
  }
  // Une lecture de la manette : appelée à chaque image (et directement par les tests).
  function poll(now = performance.now()) {
    const gp = firstPad();
    if (!gp) {
      if (prev) releaseGame();
      prev = null;
      return;
    }
    const cur = padRead(gp),
      edges = padEdges(prev, cur);
    prev = cur;
    if (edges.down.length || padStick(cur.lx, cur.ly).mag || padStick(cur.rx, cur.ry).mag) setActive(true);
    // Champ de texte choisi avec A (nom d'aventure, pseudo) : il garde le clavier jusqu'à A ou B. Un champ qui prend le
    // focus tout seul (nom proposé à la création) ne bloque pas la manette.
    if (editing && document.activeElement === editing) {
      if (edges.down.includes(B.A) || edges.down.includes(B.B)) {
        editing.blur();
        editing = null;
      }
      return;
    }
    editing = null;
    const scope = menuScope();
    if (scope) menuStep(scope, cur, edges, now);
    else if (active || gameMode) gameStep(cur, edges, now);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    poll(now);
  }
  if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function')
    requestAnimationFrame(frame);

  // ---------------------------------------------------------------- Vibrations et libellés
  // Vibration, seulement quand on joue à la manette et si elle est activée dans les Paramètres.
  function rumble(strength = 0.5, ms = 120) {
    if (!active || !canaanDisplay.rumble) return;
    firstPad()?.vibrationActuator?.playEffect?.('dual-rumble', {
      duration: ms,
      strongMagnitude: strength,
      weakMagnitude: Math.min(1, strength * 1.4)
    });
  }
  // Texte d'aide avec le bouton de la manette à la place de la touche : « [E] Entrer » → « [A] Entrer ».
  // Au clavier, la touche choisie dans les Paramètres → Clavier : « [E] Entrer » → « [R] Entrer ».
  function keyText(text) {
    if (!active && !CANAAN_KEYS.customized()) return text;
    const swap = key => (active ? padLabel(key.toLowerCase()) : CANAAN_KEYS.fromDefault(key)) || key;
    return String(text)
      .replace(/\[([A-Za-z0-9])\]/g, (_, k) => '[' + swap(k) + ']')
      .replace(/\(([A-Z])\)/g, (_, k) => '(' + swap(k) + ')')
      .replace(/(appuie sur |touche )([A-Z])\b/g, (_, w, k) => w + swap(k));
  }
  // Partout où le jeu écrit une touche (libellés « [E] Entrer » sur le canevas, messages, chat), la manette affiche son
  // bouton et le clavier la touche choisie : un seul point de passage au lieu de chaque libellé (comme les icônes à
  // la place des émojis).
  const mayHaveKey = text =>
    (active || CANAAN_KEYS.customized()) &&
    typeof text === 'string' &&
    (text.includes('[') || text.includes('(') || text.includes(' E'));
  if (typeof CanvasRenderingContext2D === 'function') {
    const proto = CanvasRenderingContext2D.prototype;
    for (const name of ['fillText', 'strokeText', 'measureText']) {
      const original = proto[name];
      proto[name] = function (text, ...rest) {
        return original.call(this, mayHaveKey(text) ? keyText(text) : text, ...rest);
      };
    }
  }
  for (const name of ['notify', 'chat']) {
    const show = game.view[name];
    game.view[name] = (...args) => show(...args.map(a => (mayHaveKey(a) ? keyText(a) : a)));
  }
  window.CANAAN_GAMEPAD = Object.freeze({
    poll,
    rumble,
    keyText,
    active: () => active,
    menuBar: () => menuBar
  });
})();
