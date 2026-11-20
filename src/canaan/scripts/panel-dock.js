// Fenêtres du jeu façon MMO : elles ne bloquent plus le héros et ne sont plus figées au centre de l'écran.
// - Le jeu continue derrière une fenêtre ouverte (sac, fiche, carte…) : on se déplace, on frappe et on lance ses
//   compétences ; les touches des fenêtres et Échap gardent leur rôle. Le voile sombre plein écran disparaît.
// - Une fenêtre ouverte par sa touche ou son bouton de la barre des menus s'ouvre juste au-dessus de ce bouton (le sac
//   au-dessus de I, la fiche au-dessus de C…), même quand la barre a été déplacée ; les autres (marchand, banque,
//   portail…) s'ouvrent au centre.
// - On la déplace en la saisissant par son en-tête ; sa place est retenue pour la prochaine fois (préférence
//   « layout », clé windows). Un double-clic sur l'en-tête la remet à sa place d'origine.
// - Une fenêtre à taille fixe (sac, fiche, talents, quêtes, marchand…) se redimensionne par ses poignées de coin (en bas
//   à droite, en bas à gauche, en haut à droite : en haut à gauche se trouve la croix). Sa taille est retenue ; un
//   double-clic sur une poignée lui rend sa taille d'origine.
// - Une fenêtre ouverte en parlant à quelqu'un ou en touchant un objet du monde (marchand, banque, portail…) se ferme
//   quand le héros s'en éloigne.
(() => {
  'use strict';
  const overlay = document.getElementById('overlay'),
    win = document.getElementById('window');
  if (!overlay || !win) return;
  const MARGIN = 8,
    GAP = 10,
    MIN_W = 340,
    MIN_H = 280,
    GRIPS = ['br', 'bl', 'tr'],
    LEASH = 260,
    INTERACTIVE =
      'button, input, select, textarea, a, label, canvas, [data-action], [data-tab], [draggable="true"], [data-tooltip-index], [data-tooltip-slot], [contenteditable="true"]';
  let owner = null, // toggleInventory, toggleCharacter… ou free:<classe du contenu>
    shown = '', // classe du contenu affiché
    leash = null, // { x, y } : lieu d'ouverture d'une fenêtre liée au monde
    fromWorld = false,
    drag = null;

  const isOpen = () => overlay.style.display === 'flex';
  const savedAll = () => CANAAN_PREFERENCES.read('layout', {}).windows || {};
  // Place et taille retenues d'une fenêtre : { x, y } (déplacée) et { w, h } (redimensionnée), chacune facultative.
  function writeSaved(key, changes) {
    const obj = CANAAN_PREFERENCES.read('layout', {}),
      windows = { ...(obj.windows || {}) },
      next = { ...(windows[key] || {}), ...changes };
    for (const k of Object.keys(next)) if (next[k] == null) delete next[k];
    if (Object.keys(next).length) windows[key] = next;
    else delete windows[key];
    obj.windows = windows;
    CANAAN_PREFERENCES.write('layout', obj);
  }
  // Nom stable d'une fenêtre sans bouton : la première classe en « -panel » de son contenu (shop-panel, bank-panel…),
  // même après un en-tête commun ; sinon la première classe propre à son contenu.
  const GENERIC = /^(rpg-head|rpg-paper|rpg-modern|panel-fill|panel-scroll|ui-tabs|muted)$/;
  function signature(html) {
    const classes = [...html.slice(0, 2000).matchAll(/class="([^"]+)"/g)].flatMap(m =>
      m[1].trim().split(/\s+/)
    );
    return classes.find(c => /-panel$/.test(c)) || classes.find(c => !GENERIC.test(c)) || 'panel';
  }
  function buttonRect() {
    if (!owner || owner.startsWith('free:')) return null;
    const btn = document.querySelector('#menuButtons button[data-action="' + owner + '"]');
    const r = btn?.getBoundingClientRect?.();
    return r && r.width > 0 ? r : null;
  }

  // ---------------------------------------------------------------- Placement
  const fit = (v, size, view) =>
    Math.round(Math.max(MARGIN, Math.min((view || 0) - (size || 0) - MARGIN, v || 0)));
  function setPos(x, y) {
    x = fit(x, win.offsetWidth, innerWidth);
    y = fit(y, win.offsetHeight, innerHeight);
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    return { x, y };
  }
  // Taille choisie par le joueur : elle remplace celle de data-size (styles/panel-sizes.css), toujours bornée à l'écran.
  function applySize(saved) {
    if (win.dataset.size && saved.w && saved.h) {
      win.style.setProperty('--panel-w', saved.w + 'px');
      win.style.setProperty('--panel-h', saved.h + 'px');
    } else {
      win.style.removeProperty('--panel-w');
      win.style.removeProperty('--panel-h');
    }
  }
  function place() {
    if (!isOpen() || drag) return;
    const saved = (owner && savedAll()[owner]) || {},
      moved = Number.isFinite(saved.x) && Number.isFinite(saved.y);
    applySize(saved);
    const r = !moved && buttonRect();
    // Au-dessus du bouton : la fenêtre ne descend jamais sur la barre des menus (sa hauteur s'adapte).
    if (r) {
      win.style.setProperty('--dock-max-h', Math.max(240, r.top - GAP - MARGIN) + 'px');
      setPos(r.right - (win.offsetWidth || 0), r.top - GAP - (win.offsetHeight || 0));
      return;
    }
    win.style.removeProperty('--dock-max-h');
    if (moved) setPos(saved.x, saved.y);
    else
      setPos(
        ((innerWidth || 0) - (win.offsetWidth || 0)) / 2,
        ((innerHeight || 0) - (win.offsetHeight || 0)) / 2
      );
  }

  // ---------------------------------------------------------------- Ouverture et fermeture
  const show = window.showPanel,
    close = window.closePanels;
  window.showPanel = function (...args) {
    const was = isOpen(),
      opening = typeof canaanPanelOpening !== 'undefined' ? canaanPanelOpening : null,
      r = show.apply(this, args);
    const sig = signature(String(args[0] || '')),
      same = was && sig === shown;
    shown = sig;
    // Nouvelle fenêtre : ouverte par sa touche / son bouton, depuis le monde, ou fenêtre fermée jusque-là.
    // Sinon c'est la fenêtre affichée qui se redessine (onglet, objet équipé, butin ramassé…) : elle garde sa place.
    if (opening) {
      owner = opening;
      leash = null;
    } else if (!was || (fromWorld && !same)) {
      owner = 'free:' + sig;
      leash = fromWorld ? { x: P.x, y: P.y } : null;
    }
    // Poignées de redimensionnement (fenêtres à taille fixe), remises à chaque dessin.
    if (win.dataset.size && win.insertAdjacentHTML)
      win.insertAdjacentHTML(
        'beforeend',
        GRIPS.map(
          edge =>
            '<div class="dock-grip" data-edge="' +
            edge +
            '" title="Redimensionner · double-clic : taille d’origine"></div>'
        ).join('')
      );
    place();
    return r;
  };
  window.closePanels = function (...args) {
    owner = null;
    shown = '';
    leash = null;
    drag = null;
    win.classList.remove('dock-dragging');
    return close.apply(this, args);
  };
  // Ce que le héros ouvre en interagissant (touche E, dialogue d'un PNJ) est lié à ce lieu.
  const interact = window.interact;
  if (typeof interact === 'function')
    window.interact = function (...args) {
      fromWorld = true;
      try {
        return interact.apply(this, args);
      } finally {
        fromWorld = false;
      }
    };
  const dialog = document.getElementById('dialog');
  dialog?.addEventListener(
    'click',
    () => {
      fromWorld = true;
      setTimeout(() => (fromWorld = false), 0);
    },
    true
  );
  // Les fenêtres des touches doivent être connues pour s'ouvrir au-dessus de leur bouton.
  if (typeof canaanTrackPanels === 'function') canaanTrackPanels();

  // Le héros s'éloigne du marchand, de la banque ou du portail : la fenêtre se ferme.
  function tick() {
    if (!leash || !isOpen() || typeof P === 'undefined') return;
    if (Math.hypot(P.x - leash.x, P.y - leash.y) > LEASH) window.closePanels();
  }
  setInterval(tick, 250);

  // La fenêtre change de taille (onglet, contenu) ou l'écran aussi : elle reste à sa place, entière à l'écran.
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => place()).observe(win);
  addEventListener('resize', () => place());

  // ---------------------------------------------------------------- Déplacement à la souris
  function handle(e) {
    const t = e.target;
    if (!t || !t.closest || t.closest(INTERACTIVE + ', .dock-grip')) return false;
    if (t === win || t.closest('.rpg-head, h2')) return true;
    // La bande du haut de la fenêtre sert aussi de poignée.
    return e.clientY - win.getBoundingClientRect().top < 34;
  }
  win.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const grip = e.target?.closest?.('.dock-grip'),
      r = win.getBoundingClientRect();
    if (grip) {
      e.preventDefault();
      drag = {
        mode: 'resize',
        edge: grip.dataset.edge,
        sx: e.clientX,
        sy: e.clientY,
        x: r.left,
        y: r.top,
        w: r.width,
        h: r.height,
        id: e.pointerId,
        moved: false
      };
    } else {
      if ((e.pointerType && e.pointerType !== 'mouse') || !handle(e)) return;
      e.preventDefault();
      drag = { mode: 'move', dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId, moved: false };
    }
    win.setPointerCapture(e.pointerId);
    win.classList.add('dock-dragging');
  });
  // Redimensionner par un coin : le bord opposé reste en place ; la fenêtre reste entre sa taille minimale et l'écran.
  function resizeTo(e) {
    const d = drag,
      dx = e.clientX - d.sx,
      dy = e.clientY - d.sy,
      maxW = innerWidth - 2 * MARGIN,
      maxH = innerHeight - 2 * MARGIN,
      left = d.edge.includes('l'),
      top = d.edge.includes('t');
    const w = Math.round(Math.max(MIN_W, Math.min(maxW, d.w + (left ? -dx : dx)))),
      h = Math.round(Math.max(MIN_H, Math.min(maxH, d.h + (top ? -dy : dy))));
    d.nw = w;
    d.nh = h;
    win.style.setProperty('--panel-w', w + 'px');
    win.style.setProperty('--panel-h', h + 'px');
    setPos(left ? d.x + d.w - w : d.x, top ? d.y + d.h - h : d.y);
  }
  win.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.moved = true;
    win.style.removeProperty('--dock-max-h');
    if (drag.mode === 'resize') resizeTo(e);
    else setPos(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const drop = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, mode, nw, nh } = drag;
    drag = null;
    win.classList.remove('dock-dragging');
    if (!moved || !owner) return;
    const pos = { x: parseInt(win.style.left, 10), y: parseInt(win.style.top, 10) };
    // Redimensionnée, la fenêtre garde aussi sa place (elle ne se recolle pas au-dessus de son bouton).
    writeSaved(owner, mode === 'resize' ? { ...pos, w: nw, h: nh } : pos);
  };
  win.addEventListener('pointerup', drop);
  win.addEventListener('pointercancel', drop);
  // Double-clic : sur une poignée, la taille d'origine ; sur l'en-tête, la place d'origine.
  win.addEventListener('dblclick', e => {
    if (!owner) return;
    if (e.target?.closest?.('.dock-grip')) writeSaved(owner, { w: null, h: null });
    else if (handle(e)) writeSaved(owner, { x: null, y: null });
    else return;
    place();
  });
  // Après un clic dans la fenêtre, le bouton cliqué rend le clavier au jeu : Espace (roulade) ou Entrée ne le
  // re-cliquent pas. La navigation à la manette (focus) n'est pas concernée : seul un vrai clic de souris compte.
  win.addEventListener('click', e => {
    if (!e.detail) return;
    const el = document.activeElement;
    if (el && el !== document.body && win.contains(el) && !el.matches('input, textarea, select')) el.blur();
  });
  // Réinitialiser l'interface (Paramètres) remet aussi les fenêtres à leur place d'origine.
  document.getElementById('layoutReset')?.addEventListener('click', () => {
    const obj = CANAAN_PREFERENCES.read('layout', {});
    delete obj.windows;
    CANAAN_PREFERENCES.write('layout', obj);
    place();
  });

  window.CANAAN_DOCK = Object.freeze({ place, tick, owner: () => owner });
})();
