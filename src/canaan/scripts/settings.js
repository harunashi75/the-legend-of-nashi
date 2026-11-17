// Paramètres (écran d'accueil, menu pause, barre du haut), rangés en onglets : Audio (bouton et volumes, gérés par
// audio.js), Affichage (plein écran, résolution de la fenêtre, échelle, synchronisation verticale), Graphismes (lueurs,
// particules et vent, limite et compteur d'images par seconde), Interface (taille des textes, chiffres de dégâts,
// secousses de l'écran), Clavier (touches réglables, keybinds.js), Manette (commandes, vibrations), et Quitter le jeu.
// Dans l'application de bureau, la fenêtre est réglée par Electron (canaanDesktop.display) ; dans un navigateur, seul
// le plein écran est possible. Les réglages du jeu sont gardés dans les préférences de l'appareil.
(() => {
  'use strict';
  const screen = document.getElementById('settingsScreen');
  const desktop = window.canaanDesktop?.display || null;
  const FPS_CAPS = [0, 30, 60, 90, 120, 144, 165, 240];
  const TOGGLES = ['shake', 'glow', 'particles', 'damage', 'fps', 'rumble'];
  // Taille des textes (polices des menus, barres, info-bulles et textes du jeu ; l'interface garde sa taille).
  const TEXT_SCALES = [1, 1.1, 1.25, 1.4, 1.6];
  let textScale = 1.25;
  const prefs = () => CANAAN_PREFERENCES.read('settings', {});
  const TABS = ['audio', 'display', 'graphics', 'interface', 'keyboard', 'gamepad'];
  let shown = false,
    state = null,
    tab = 'audio';
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
    if (TEXT_SCALES.includes(p.textScale)) textScale = p.textScale;
    canaanSetTextScale(textScale);
  }
  function save() {
    const out = {};
    for (const k of TOGGLES) out[k] = canaanDisplay[k];
    out.fpsCap = canaanDisplay.fpsCap;
    out.textScale = textScale;
    CANAAN_PREFERENCES.write('settings', out);
  }
  function refresh() {
    const full = state ? state.fullscreen : !!document.fullscreenElement;
    setText('setFullscreen', onOff(full), full);
    setText(
      'setResolution',
      state ? state.width + ' × ' + state.height + (full ? ' (plein écran)' : '') : '—'
    );
    setText('setZoom', state ? Math.round(state.zoom * 100) + ' %' : '—');
    setText('setTextScale', Math.round(textScale * 100) + ' %');
    setText('setVsync', state ? onOff(state.vsync, '✓ Activée', 'Désactivée') : '—', state?.vsync);
    const restart = $('setRestartRow');
    if (restart) restart.hidden = !state || state.vsync === state.vsyncActive;
    setText(
      'setFpsCap',
      canaanDisplay.fpsCap
        ? canaanDisplay.fpsCap + ' images/s'
        : state && !state.vsyncActive
          ? 'Illimitée'
          : 'Selon l’écran'
    );
    setText('setFps', onOff(canaanDisplay.fps), canaanDisplay.fps);
    setText('setGlow', onOff(canaanDisplay.glow, '✓ Activées', 'Désactivées'), canaanDisplay.glow);
    setText('setParticles', onOff(canaanDisplay.particles), canaanDisplay.particles);
    setText('setShake', onOff(canaanDisplay.shake, '✓ Activées', 'Désactivées'), canaanDisplay.shake);
    setText('setDamage', onOff(canaanDisplay.damage, '✓ Affichés', 'Masqués'), canaanDisplay.damage);
    setText('setRumble', onOff(canaanDisplay.rumble, '✓ Activées', 'Désactivées'), canaanDisplay.rumble);
    // Hors application de bureau : résolution, échelle et VSync indisponibles.
    for (const id of ['setResolutionRow', 'setZoomRow', 'setVsyncRow'])
      $(id)?.classList.toggle('disabled', !desktop);
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
  // Onglets : un seul panneau visible ; le dernier onglet ouvert est gardé jusqu'à la fermeture du jeu.
  function settingsTab(name) {
    if (!TABS.includes(name)) return;
    tab = name;
    CANAAN_KEYS.stopCapture();
    for (const button of document.querySelectorAll('#settingsCard .settings-tab')) {
      const on = button.dataset.tab === name;
      button.classList.toggle('active', on);
      button.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const pane of document.querySelectorAll('#settingsCard .settings-pane'))
      pane.hidden = pane.dataset.pane !== name;
    if (name === 'keyboard') CANAAN_KEYS.render();
  }
  function settingsTabStep(dir) {
    const i = TABS.indexOf(tab);
    settingsTab(TABS[(i + (dir > 0 ? 1 : -1) + TABS.length) % TABS.length]);
  }
  function openSettings() {
    if (!screen) return;
    shown = true;
    screen.classList.add('visible');
    settingsTab(tab);
    refresh();
    pull();
  }
  function closeSettings() {
    shown = false;
    CANAAN_KEYS.stopCapture();
    screen?.classList.remove('visible');
  }
  function settingsToggle(key) {
    if (key === 'fullscreen') {
      if (desktop) return push({ fullscreen: !(state && state.fullscreen) });
      const done = () => setTimeout(refresh, 120);
      if (document.fullscreenElement) document.exitFullscreen?.().then(done, done);
      else
        document.documentElement
          .requestFullscreen?.()
          .then(done, () => toast('Plein écran indisponible ici : essaie F11.'));
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
    if (key === 'textscale') {
      const i = TEXT_SCALES.indexOf(textScale);
      textScale = TEXT_SCALES[Math.max(0, Math.min(TEXT_SCALES.length - 1, (i < 0 ? 2 : i) + dir))];
      canaanSetTextScale(textScale);
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
      if (i < 0)
        i =
          state.sizes.reduce(
            (best, [w], k) =>
              Math.abs(w - state.width) < Math.abs(state.sizes[best][0] - state.width) ? k : best,
            0
          ) - (dir > 0 ? 1 : 0);
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
  // Échap ferme les paramètres (sur l'écran d'accueil comme en jeu), avant tout autre usage de la touche ;
  // Q et E changent d'onglet.
  addEventListener(
    'keydown',
    e => {
      if (!isOpen() || e.target?.closest?.('input:not([type="range"]), textarea')) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') closeSettings();
      else if ((k === 'q' || k === 'e') && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey)
        settingsTabStep(k === 'e' ? 1 : -1);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );
  Object.assign(window, {
    openSettings,
    closeSettings,
    settingsToggle,
    settingsStep,
    settingsRestart,
    settingsTab,
    settingsTabStep,
    quitGame,
    CANAAN_SETTINGS: Object.freeze({ isOpen, refresh, state: () => state, tab: () => tab })
  });
})();
