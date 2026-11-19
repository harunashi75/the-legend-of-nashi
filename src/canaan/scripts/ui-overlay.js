// Fenêtres du jeu à la place de celles du navigateur :
// - bulle d'aide (#uiTip) : chaque attribut title posé dans l'interface devient data-tip, si bien que l'infobulle
//   blanche du système n'apparaît plus ; la bulle du jeu s'affiche au survol à la souris, près du pointeur ;
// - confirmation (#uiConfirm) : canaanConfirm(message, siOui, options) ouvre une fenêtre Oui / Non
//   (Entrée : oui, Échap : non) et appelle siOui seulement après un clic sur Oui.
(() => {
  'use strict';
  // Les cases qui ont déjà leur info-bulle détaillée (objets, Rubis, compétences…) n'affichent pas la bulle simple.
  const RICH =
    '[data-tooltip-index],[data-tooltip-slot],[data-tooltip-rubis],[data-tooltip-skill],[data-tooltip-stack],[data-tooltip-shop],[data-tooltip-trade],[data-tooltip-bank],[data-tooltip-satchel]';
  const DELAY = 280;

  // ---------------------------------------------------------------- title → data-tip
  function adopt(el) {
    if (!el || el.nodeType !== 1 || !el.hasAttribute('title')) return;
    const text = el.getAttribute('title');
    el.removeAttribute('title');
    if (!text) return;
    el.setAttribute('data-tip', text);
    if (!el.hasAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', text);
  }
  function adoptTree(root) {
    if (!root || root.nodeType !== 1) return;
    adopt(root);
    for (const el of root.querySelectorAll('[title]')) adopt(el);
  }
  adoptTree(document.body);
  if (typeof MutationObserver === 'function')
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'attributes') adopt(m.target);
        else for (const n of m.addedNodes) adoptTree(n);
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['title']
    });

  // ---------------------------------------------------------------- Bulle d'aide
  const tip = document.createElement('div');
  tip.id = 'uiTip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  let target = null,
    timer = 0,
    lastX = 0,
    lastY = 0;
  function place() {
    const margin = 12,
      w = tip.offsetWidth,
      h = tip.offsetHeight;
    let x = lastX + 16,
      y = lastY + 20;
    if (x + w > innerWidth - margin) x = lastX - w - 12;
    if (y + h > innerHeight - margin) y = lastY - h - 12;
    tip.style.left = Math.max(margin, x) + 'px';
    tip.style.top = Math.max(margin, y) + 'px';
  }
  function hide() {
    clearTimeout(timer);
    target = null;
    tip.classList.remove('on');
  }
  function show() {
    if (!target || !target.isConnected) return hide();
    const text = target.getAttribute('data-tip');
    if (!text) return hide();
    tip.textContent = text;
    tip.classList.add('on');
    place();
  }
  document.addEventListener('pointerover', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const el = event.target?.closest?.('[data-tip]');
    if (el === target) return;
    hide();
    if (!el || el.closest(RICH)) return;
    target = el;
    lastX = event.clientX;
    lastY = event.clientY;
    timer = setTimeout(show, DELAY);
  });
  document.addEventListener('pointermove', event => {
    lastX = event.clientX;
    lastY = event.clientY;
    if (target && !target.contains(event.target)) hide();
    else if (tip.classList.contains('on')) place();
  });
  document.addEventListener('pointerout', event => {
    if (target && !(event.relatedTarget && target.contains(event.relatedTarget))) hide();
  });
  for (const name of ['pointerdown', 'wheel', 'keydown']) document.addEventListener(name, hide, true);
  addEventListener('blur', hide);
  // Un panneau redessiné retire la case survolée : la bulle ne reste pas orpheline.
  setInterval(() => {
    if (target && !target.isConnected) hide();
  }, 300);

  // ---------------------------------------------------------------- Gantelet : appui et onde de clic
  // Tant qu'un bouton de la souris est enfoncé, le gantelet plie l'index (classe cursor-press sur <html>, au moins
  // 120 ms pour qu'un clic bref se voie) ; chaque clic laisse une onde dorée sous le doigt. Rien à la manette.
  const root = document.documentElement;
  let pressedAt = 0,
    releaseTimer = 0;
  function release() {
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(
      () => root.classList.remove('cursor-press'),
      Math.max(0, 120 - (Date.now() - pressedAt))
    );
  }
  document.addEventListener(
    'pointerdown',
    event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      clearTimeout(releaseTimer);
      pressedAt = Date.now();
      root.classList.add('cursor-press');
      const ring = document.createElement('div');
      ring.className = 'cursor-ripple';
      ring.style.left = event.clientX + 'px';
      ring.style.top = event.clientY + 'px';
      ring.addEventListener('animationend', () => ring.remove());
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 800);
    },
    true
  );
  for (const name of ['pointerup', 'pointercancel']) document.addEventListener(name, release, true);
  addEventListener('blur', release);

  // ---------------------------------------------------------------- Confirmation
  const box = document.createElement('div');
  box.id = 'uiConfirm';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML =
    '<div class="ui-confirm-box"><h3></h3><p></p><div class="ui-confirm-actions">' +
    '<button type="button" class="ui-confirm-no"></button><button type="button" class="ui-confirm-yes"></button></div></div>';
  document.body.appendChild(box);
  const head = box.querySelector('h3'),
    body = box.querySelector('p'),
    yesButton = box.querySelector('.ui-confirm-yes'),
    noButton = box.querySelector('.ui-confirm-no');
  let pending = null;
  function close(ok) {
    if (!pending) return;
    const done = pending;
    pending = null;
    box.classList.remove('on');
    if (ok) done();
  }
  function canaanConfirm(message, onYes, { title = 'Confirmer', yes = 'Oui', no = 'Annuler' } = {}) {
    hide();
    hideGearTooltip();
    pending = typeof onYes === 'function' ? onYes : () => {};
    head.textContent = title;
    body.textContent = message;
    yesButton.textContent = yes;
    noButton.textContent = no;
    box.classList.add('on');
    yesButton.focus();
    return false;
  }
  yesButton.addEventListener('click', () => close(true));
  noButton.addEventListener('click', () => close(false));
  box.addEventListener('pointerdown', event => {
    if (event.target === box) close(false);
  });
  // Tant que la fenêtre est ouverte, le clavier ne joue pas : Entrée confirme, Échap annule.
  addEventListener(
    'keydown',
    event => {
      if (!pending) return;
      if (event.key === 'Enter' && document.activeElement !== noButton) close(true);
      else if (event.key === 'Escape') close(false);
      else if (event.key !== 'Tab' && event.key !== 'Enter') event.preventDefault();
      if (event.key !== 'Tab') event.stopImmediatePropagation();
    },
    true
  );

  window.canaanConfirm = canaanConfirm;
  window.CANAAN_UI_OVERLAY = Object.freeze({
    confirm: canaanConfirm,
    isConfirmOpen: () => !!pending,
    accept: () => close(true),
    cancel: () => close(false),
    hideTip: hide
  });
})();
