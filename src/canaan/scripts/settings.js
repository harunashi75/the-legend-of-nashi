// Paramètres (écran d'accueil, menu pause, barre du haut) : son (bouton et volumes, gérés par audio.js), affichage
// (plein écran, résolution de la fenêtre, échelle, synchronisation verticale, limite et compteur d'images par seconde),
// graphismes et confort (lueurs, particules et vent, secousses de l'écran, chiffres de dégâts), et Quitter le jeu.
// Dans l'application de bureau, la fenêtre est réglée par Electron (canaanDesktop.display) ; dans un navigateur, seul
// le plein écran est possible. Les réglages du jeu sont gardés dans les préférences de l'appareil.
(() => {
  'use strict';
  const screen = document.getElementById('settingsScreen');
  const desktop = window.canaanDesktop?.display || null;
  const FPS_CAPS = [0, 30, 60, 90, 120, 144, 165, 240];
  const TOGGLES = ['shake', 'glow', 'particles', 'damage', 'fps'];
  const prefs = () => CANAAN_PREFERENCES.read('settings', {});
  let shown = false,
    state = null;
  const isOpen = () => shown;
  const $ = id => document.getElementById(id);
  const setText = (id, text, on) => {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    if (on !== undefined) el.classList.toggle('on', !!on);
  };
  const onOff = (v, yes = '✓ Activé', no = 'Désactivé') => (v ? yes : no);
  // Réglages du jeu : lus au démarrage, écrits à chaque changement.
  function load() {
    const p = prefs();
    for (const k of TOGGLES) if (typeof p[k] === 'boolean') canaanDisplay[k] = p[k];
    if (FPS_CAPS.includes(p.fpsCap)) canaanDisplay.fpsCap = p.fpsCap;
  }
  function save() {
    const out = {};
    for (const k of TOGGLES) out[k] = canaanDisplay[k];
    out.fpsCap = canaanDisplay.fpsCap;
    CANAAN_PREFERENCES.write('settings', out);
  }
  function refresh() {
    const full = state ? state.fullscreen : !!document.fullscreenElement;
    setText('setFullscreen', onOff(full), full);
    setText('setResolution', state ? state.width + ' × ' + state.height + (full ? ' (plein écran)' : '') : '—');
    setText('setZoom', state ? Math.round(state.zoom * 100) + ' %' : '—');
    setText('setVsync', state ? onOff(state.vsync, '✓ Activée', 'Désactivée') : '—', state?.vsync);
    const restart = $('setRestartRow');
    if (restart) restart.hidden = !state || state.vsync === state.vsyncActive;
    setText('setFpsCap', canaanDisplay.fpsCap ? canaanDisplay.fpsCap + ' images/s' : state && !state.vsyncActive ? 'Illimitée' : 'Selon l’écran');
    setText('setFps', onOff(canaanDisplay.fps), canaanDisplay.fps);
    setText('setGlow', onOff(canaanDisplay.glow, '✓ Activées', 'Désactivées'), canaanDisplay.glow);
    setText('setParticles', onOff(canaanDisplay.particles), canaanDisplay.particles);
    setText('setShake', onOff(canaanDisplay.shake, '✓ Activées', 'Désactivées'), canaanDisplay.shake);
    setText('setDamage', onOff(canaanDisplay.damage, '✓ Affichés', 'Masqués'), canaanDisplay.damage);
    // Hors application de bureau : résolution, échelle et VSync indisponibles.
    for (const id of ['setResolutionRow', 'setZoomRow', 'setVsyncRow']) $(id)?.classList.toggle('disabled', !desktop);
    const note = $('setDesktopNote');
    if (note) note.hidden = !!desktop;
    const el = $('fpsCounter');
    if (el) el.hidden = !canaanDisplay.fps;
  }
  async function pull() {
    if (!desktop) return refresh();
    try {
      state = await desktop.get();
    } catch {
      state = null;
    }
    refresh();
  }
  async function push(options) {
    if (!desktop) return;
    try {
      state = (await desktop.set(options)) || state;
    } catch {
      toast('Réglage d’affichage indisponible.');
    }
    refresh();
  }
  function openSettings() {
    if (!screen) return;
    shown = true;
    screen.classList.add('visible');
    refresh();
    pull();
  }
  function closeSettings() {
    shown = false;
    screen?.classList.remove('visible');
  }
  function settingsToggle(key) {
    if (key === 'fullscreen') {
      if (desktop) return push({ fullscreen: !(state && state.fullscreen) });
      const done = () => setTimeout(refresh, 120);
      if (document.fullscreenElement) document.exitFullscreen?.().then(done, done);
      else document.documentElement.requestFullscreen?.().then(done, () => toast('Plein écran indisponible ici : essaie F11.'));
      return;
    }
    if (key === 'vsync') return desktop && push({ vsync: !(state && state.vsync) });
    if (!TOGGLES.includes(key)) return;
    canaanDisplay[key] = !canaanDisplay[key];
    save();
    refresh();
  }
  function settingsStep(key, step) {
    const dir = step > 0 ? 1 : -1;
    if (key === 'fpscap') {
      const i = FPS_CAPS.indexOf(canaanDisplay.fpsCap);
      canaanDisplay.fpsCap = FPS_CAPS[(i + dir + FPS_CAPS.length) % FPS_CAPS.length];
      save();
      return refresh();
    }
    if (!desktop || !state) return;
    if (key === 'zoom') {
      const i = state.zooms.indexOf(state.zoom);
      return push({ zoom: state.zooms[Math.max(0, Math.min(state.zooms.length - 1, i + dir))] });
    }
    if (key === 'resolution' && state.sizes.length) {
      // La taille la plus proche de l'actuelle, puis la suivante ou la précédente.
      let i = state.sizes.findIndex(([w, h]) => w === state.width && h === state.height);
      if (i < 0) i = state.sizes.reduce((best, [w], k) => (Math.abs(w - state.width) < Math.abs(state.sizes[best][0] - state.width) ? k : best), 0) - (dir > 0 ? 1 : 0);
      const next = state.sizes[Math.max(0, Math.min(state.sizes.length - 1, i + dir))];
      return push({ size: next });
    }
  }
  // VSync changée : la partie est sauvegardée, puis le jeu redémarre pour l'appliquer.
  function settingsRestart() {
    if (!desktop) return;
    if (started) saveGame();
    desktop.relaunch();
  }
  // Quitter : la partie en cours est sauvegardée, puis la fenêtre du jeu se ferme.
  function quitGame() {
    if (started) saveGame();
    if (window.canaanDesktop) window.close();
    else toast('Pour quitter, ferme simplement cet onglet : ta partie est sauvegardée.');
  }
  load();
  refresh();
  document.addEventListener('fullscreenchange', refresh);
  desktop?.onChange(next => {
    state = next;
    refresh();
  });
  // Échap ferme les paramètres (sur l'écran d'accueil comme en jeu), avant tout autre usage de la touche.
  addEventListener(
    'keydown',
    e => {
      if (e.key !== 'Escape' || !isOpen()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeSettings();
    },
    true
  );
  Object.assign(window, {
    openSettings,
    closeSettings,
    settingsToggle,
    settingsStep,
    settingsRestart,
    quitGame,
    CANAAN_SETTINGS: Object.freeze({ isOpen, refresh, state: () => state })
  });
})();
