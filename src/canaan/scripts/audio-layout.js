(() => {
  const panels = ['hud', 'minimap', 'skills', 'chat', 'menuButtons', 'help'];
  const edit = document.getElementById('layoutEdit'),
    reset = document.getElementById('layoutReset');
  let editing = false,
    drag = null;
  const load = () => CANAAN_PREFERENCES.read('layout', {});
  const persist = () => {
    let obj = load();
    obj[innerWidth + 'x' + innerHeight] = Object.fromEntries(
      panels
        .map(id => {
          const el = document.getElementById(id);
          return [id, el.dataset.position ? JSON.parse(el.dataset.position) : null];
        })
        .filter(v => v[1])
    );
    CANAAN_PREFERENCES.write('layout', obj);
  };
  function apply() {
    const obj = load(),
      saved = obj[innerWidth + 'x' + innerHeight] || {};
    for (const id of panels) {
      const el = document.getElementById(id);
      if (!el) continue;
      const v = saved[id];
      if (v) {
        el.style.setProperty('left', Math.max(0, Math.min(innerWidth - el.offsetWidth, v.x)) + 'px', 'important');
        el.style.setProperty('top', Math.max(0, Math.min(innerHeight - el.offsetHeight, v.y)) + 'px', 'important');
        el.style.setProperty('right', 'auto', 'important');
        el.style.setProperty('bottom', 'auto', 'important');
        el.style.setProperty('transform', 'none', 'important');
        el.dataset.position = JSON.stringify(v);
      }
    }
  }
  function clearPositions() {
    for (const id of panels) {
      const el = document.getElementById(id);
      if (!el) continue;
      for (const prop of ['left', 'top', 'right', 'bottom', 'transform']) el.style.removeProperty(prop);
      delete el.dataset.position;
    }
  }
  for (const id of panels) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.dataset.movable = '1';
    el.addEventListener('pointerdown', e => {
      if (!editing || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      drag = { el, dx: e.clientX - r.left, dy: e.clientY - r.top };
      el.setPointerCapture(e.pointerId);
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('bottom', 'auto', 'important');
    });
    el.addEventListener('pointermove', e => {
      if (!drag || drag.el !== el) return;
      const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, e.clientX - drag.dx)),
        y = Math.max(0, Math.min(innerHeight - el.offsetHeight, e.clientY - drag.dy));
      el.style.setProperty('left', x + 'px', 'important');
      el.style.setProperty('top', y + 'px', 'important');
      el.dataset.position = JSON.stringify({ x, y });
    });
    const done = () => {
      if (drag?.el === el) {
        drag = null;
        persist();
      }
    };
    el.addEventListener('pointerup', done);
    el.addEventListener('pointercancel', done);
  }
  edit.addEventListener('click', () => {
    editing = !editing;
    document.body.classList.toggle('layout-edit', editing);
    edit.classList.toggle('active', editing);
    edit.textContent = editing ? '✓ Terminer placement' : '⠿ Déplacer l’interface';
  });
  reset.addEventListener('click', () => {
    clearPositions();
    const obj = load();
    delete obj[innerWidth + 'x' + innerHeight];
    CANAAN_PREFERENCES.write('layout', obj);
    if (editing) edit.click();
    toast('Interface réinitialisée');
  });
  addEventListener('resize', () => {
    clearPositions();
    apply();
  });
  requestAnimationFrame(apply);
  // La musique, l'ambiance et les bruitages sont dans audio.js.
})();
