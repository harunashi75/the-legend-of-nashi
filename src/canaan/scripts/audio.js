// CANAAN AUDIO — musique d'ambiance, sons d'ambiance et bruitages, entièrement synthétisés (Web Audio, aucun fichier).
// Musique : chaque biome, les villages, chaque donjon, chaque raid et l'Arène ont leur pièce (mode, tempo,
// instruments, percussions), composée une fois par lieu à partir d'une graine : 32 mesures avec introduction,
// thème, variation, pont et reprise, jouées en boucle, avec un fondu enchaîné d'un lieu à l'autre.
// Ambiance : vent (lié au vent visible des arbres), feuillage, eau proche, oiseaux, grillons, grenouilles,
// gouttes et grondements des donjons, mouettes près de la mer, enclume, poules et chien au village.
// Bruitages : un son propre à chaque arme (rapide et lourd), impacts, coups reçus, pas selon le sol,
// éclaboussures, roulade, pièces, butin, coffres, fenêtres et sorts ; voix babillées des personnages.
// Chaque famille a son curseur de volume (Paramètres → Audio). Le moteur observe l'état du jeu à chaque image,
// ce qui marche aussi chez un invité en ligne ; quelques points d'accroche signalent les nombres de dégâts,
// les effets de sorts, la roulade et les répliques des personnages (window.CANAAN_SOUND).
(() => {
  'use strict';
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const toggle = document.getElementById('soundToggle');
  // Un curseur par famille de sons (Paramètres → Audio). fx garde son nom d'origine : c'est le volume du combat.
  // Les familles ajoutées après coup reprennent l'ancien volume des effets d'une sauvegarde qui ne les connaît pas.
  const saved = CANAAN_PREFERENCES.read('audio', {}),
    oldFx = Number.isFinite(saved.fx) ? saved.fx : 45;
  const settings = Object.assign(
    {
      on: false,
      master: 100,
      music: 25,
      fx: 45,
      ui: oldFx,
      steps: oldFx,
      voice: 55,
      wind: 30,
      water: 30,
      nature: oldFx
    },
    saved
  );
  const SLIDERS = {
    master: 'masterVolume',
    music: 'musicVolume',
    fx: 'sfxVolume',
    ui: 'uiVolume',
    steps: 'stepsVolume',
    voice: 'voiceVolume',
    wind: 'windVolume',
    water: 'waterVolume',
    nature: 'natureVolume'
  };
  const saveAudio = () => CANAAN_PREFERENCES.write('audio', settings);

  // ---------------------------------------------------------------- Graphe audio
  // Bus : musique ; combat (fxBus), interface et butin, pas, voix ; ambiance : vent, eau, nature (ambBus).
  let ac = null,
    master = null,
    out = null,
    musicBus = null,
    fxBus = null,
    uiBus = null,
    stepBus = null,
    voiceBus = null,
    windBus = null,
    waterBus = null,
    ambBus = null,
    reverb = null,
    noiseBuffer = null,
    meter = null;
  function impulse(seconds, decay) {
    const rate = ac.sampleRate,
      len = Math.floor(rate * seconds),
      buf = ac.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function initAudio() {
    if (!AudioCtx) return false;
    try {
      if (!ac) {
        ac = new AudioCtx();
        master = ac.createDynamicsCompressor();
        master.threshold.value = -14;
        master.ratio.value = 3;
        master.connect(ac.destination);
        // Niveau de sortie (pour vérifier que le son joue).
        meter = ac.createAnalyser();
        meter.fftSize = 2048;
        master.connect(meter);
        // Volume général, avant le compresseur.
        out = ac.createGain();
        out.connect(master);
        reverb = ac.createConvolver();
        reverb.buffer = impulse(3.2, 2.6);
        const wet = ac.createGain();
        wet.gain.value = 0.32;
        reverb.connect(wet);
        wet.connect(out);
        musicBus = ac.createGain();
        fxBus = ac.createGain();
        uiBus = ac.createGain();
        stepBus = ac.createGain();
        voiceBus = ac.createGain();
        windBus = ac.createGain();
        waterBus = ac.createGain();
        ambBus = ac.createGain();
        // Envois vers la réverbération : beaucoup pour la musique, un peu pour les bruitages.
        for (const [bus, amount] of [
          [musicBus, 0.55],
          [fxBus, 0.18],
          [uiBus, 0.1],
          [stepBus, 0.05],
          [voiceBus, 0.12],
          [windBus, 0.2],
          [waterBus, 0.25],
          [ambBus, 0.25]
        ]) {
          bus.connect(out);
          const g = ac.createGain();
          g.gain.value = amount;
          bus.connect(g);
          g.connect(reverb);
        }
        noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuffer.getChannelData(0);
        // Bruit rosé (plus doux que le bruit blanc).
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
        }
        startAmbience();
      }
      if (ac.state === 'suspended') ac.resume();
      applyVolumes();
      return true;
    } catch (_) {
      return false;
    }
  }
  function applyVolumes() {
    if (!ac) return;
    const t = ac.currentTime,
      quiet = paused ? 0.35 : 1,
      on = settings.on ? 1 : 0;
    const level = key => Math.max(0, Math.min(100, Number(settings[key]) || 0)) / 100,
      set = (bus, value, tau) => bus.gain.setTargetAtTime(on * value, t, tau),
      live = paused ? 0 : 1,
      dim = paused ? 0.3 : 1;
    out.gain.setTargetAtTime(level('master'), t, 0.05);
    set(musicBus, quiet * level('music') * 0.55, 0.2);
    set(fxBus, live * level('fx') * 0.9, 0.05);
    set(uiBus, level('ui') * 0.9, 0.05);
    set(stepBus, live * level('steps') * 0.9, 0.05);
    set(voiceBus, live * level('voice') * 0.9, 0.05);
    set(windBus, dim * level('wind') * 0.7, 0.3);
    set(waterBus, dim * level('water') * 0.7, 0.3);
    set(ambBus, dim * level('nature') * 0.7, 0.3);
  }
  const midi = midiFrequency;
  // Enveloppe : attaque, maintien, relâchement.
  function envelope(param, t, attack, peak, hold, release, floor = 0.0001) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(floor, t);
    param.linearRampToValueAtTime(peak, t + attack);
    param.setValueAtTime(peak, t + attack + hold);
    param.exponentialRampToValueAtTime(floor, t + attack + hold + release);
  }
  function noiseSource(t, dur, offset = Math.random() * 1.5) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuffer;
    s.loop = true;
    s.start(t, offset);
    s.stop(t + dur + 0.05);
    return s;
  }
  function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[nodes.length - 1];
  }
  function filter(type, freq, q = 0.7) {
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }
  function gain(v = 1) {
    const g = ac.createGain();
    g.gain.value = v;
    return g;
  }
  function panner(x) {
    if (!ac.createStereoPanner) return gain(1);
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, x));
    return p;
  }

  // ---------------------------------------------------------------- Instruments
  // Corde pincée (Karplus-Strong) : harpe, guitare, oud. Les sons calculés sont gardés en cache.
  const plucks = new Map();
  function pluckBuffer(freq, bright) {
    const key = Math.round(freq * 10) + ':' + bright;
    if (plucks.has(key)) return plucks.get(key);
    const rate = ac.sampleRate,
      len = Math.floor(rate * 2.2),
      buf = ac.createBuffer(1, len, rate),
      d = buf.getChannelData(0),
      period = Math.max(2, Math.round(rate / freq)),
      ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    const damp = 0.496 + bright * 0.0035;
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const k = i % period,
        v = ring[k];
      d[i] = v;
      const next = ring[(k + 1) % period];
      ring[k] = (v + next) * damp + (bright > 0.5 ? 0 : (prev - v) * 0.02);
      prev = v;
    }
    if (plucks.size > 160) plucks.clear();
    plucks.set(key, buf);
    return buf;
  }
  function pluck(dest, freq, t, dur, vol, bright = 0.3) {
    const s = ac.createBufferSource(),
      g = gain(0),
      f = filter('lowpass', 1800 + bright * 4000);
    s.buffer = pluckBuffer(freq, bright);
    g.gain.setValueAtTime(vol, t);
    g.gain.setTargetAtTime(0.0001, t + Math.max(0.2, dur), 0.35);
    chain(s, f, g, dest);
    s.start(t);
    s.stop(t + Math.max(0.2, dur) + 1.6);
  }
  // Nappe : oscillateurs désaccordés, filtre doux, attaque et relâchement lents.
  function pad(dest, freqs, t, dur, vol, type = 'sawtooth', cutoff = 900) {
    const g = gain(0),
      f = filter('lowpass', cutoff, 0.4);
    chain(f, g, dest);
    for (const fr of freqs)
      for (const det of [-7, 6]) {
        const o = ac.createOscillator();
        o.type = type;
        o.frequency.value = fr;
        o.detune.value = det;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 2.6);
      }
    const per = vol / Math.sqrt(freqs.length * 2);
    envelope(g.gain, t, Math.min(1.6, dur * 0.4), per, Math.max(0, dur - 1.6), 2.4);
  }
  // Flûte : sinus et vibrato qui s'installe, souffle filtré.
  function flute(dest, freq, t, dur, vol) {
    const o = ac.createOscillator(),
      o2 = ac.createOscillator(),
      g = gain(0),
      vib = ac.createOscillator(),
      vibG = gain(0);
    o.type = 'sine';
    o2.type = 'triangle';
    o.frequency.value = freq;
    o2.frequency.value = freq;
    vib.frequency.value = 5.2;
    vibG.gain.setValueAtTime(0, t);
    vibG.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.5, dur * 0.6));
    chain(vib, vibG);
    vibG.connect(o.frequency);
    vibG.connect(o2.frequency);
    const mix = gain(1),
      tri = gain(0.18);
    o.connect(mix);
    chain(o2, tri, mix);
    chain(mix, g, dest);
    envelope(g.gain, t, 0.07, vol, Math.max(0.02, dur - 0.12), 0.22);
    const breath = noiseSource(t, dur + 0.2),
      bf = filter('bandpass', freq * 2, 2),
      bg = gain(0);
    chain(breath, bf, bg, dest);
    envelope(bg.gain, t, 0.04, vol * 0.18, 0.05, 0.15);
    for (const n of [o, o2, vib]) {
      n.start(t);
      n.stop(t + dur + 0.4);
    }
  }
  // Cloche ou célesta : partiels inharmoniques qui s'éteignent.
  function bell(dest, freq, t, dur, vol) {
    for (const [ratio, amp, decay] of [
      [1, 1, 1],
      [2.76, 0.42, 0.55],
      [5.4, 0.2, 0.3],
      [8.9, 0.08, 0.18]
    ]) {
      const o = ac.createOscillator(),
        g = gain(0);
      o.type = 'sine';
      o.frequency.value = freq * ratio;
      chain(o, g, dest);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (0.4 + dur) * decay * 2);
      o.start(t);
      o.stop(t + (0.4 + dur) * decay * 2 + 0.05);
    }
  }
  // Cordes : ensemble de dents de scie désaccordées, archet lent.
  function strings(dest, freq, t, dur, vol, attack = 0.25) {
    const g = gain(0),
      f = filter('lowpass', Math.min(4000, freq * 6), 0.5);
    chain(f, g, dest);
    for (const det of [-9, 0, 8]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.8);
    }
    envelope(g.gain, t, attack, vol / 2.2, Math.max(0.02, dur - attack - 0.1), 0.5);
  }
  // Chœur : dents de scie à travers trois formants de la voyelle « a ».
  function choir(dest, freqs, t, dur, vol) {
    const g = gain(0),
      out = gain(1);
    chain(out, g, dest);
    const formants = [
      [800, 1, 6],
      [1150, 0.6, 7],
      [2900, 0.25, 9]
    ].map(([fr, a, q]) => {
      const f = filter('bandpass', fr, q),
        fg = gain(a * 3);
      chain(f, fg, out);
      return f;
    });
    for (const fr of freqs)
      for (const det of [-11, 10]) {
        const o = ac.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = fr;
        o.detune.value = det;
        for (const f of formants) o.connect(f);
        o.start(t);
        o.stop(t + dur + 2.6);
      }
    envelope(g.gain, t, 1.2, vol / Math.sqrt(freqs.length), Math.max(0, dur - 1.2), 2);
  }
  // Cuivres : dent de scie dont le filtre s'ouvre à l'attaque.
  function brass(dest, freq, t, dur, vol) {
    const o = ac.createOscillator(),
      o2 = ac.createOscillator(),
      f = filter('lowpass', freq * 1.5, 1.2),
      g = gain(0);
    o.type = o2.type = 'sawtooth';
    o.frequency.value = freq;
    o2.frequency.value = freq;
    o2.detune.value = 7;
    o.connect(f);
    o2.connect(f);
    chain(f, g, dest);
    f.frequency.setValueAtTime(freq * 1.2, t);
    f.frequency.linearRampToValueAtTime(freq * 5, t + 0.08);
    f.frequency.exponentialRampToValueAtTime(freq * 2.6, t + 0.4);
    envelope(g.gain, t, 0.06, vol / 1.6, Math.max(0.02, dur - 0.12), 0.25);
    for (const n of [o, o2]) {
      n.start(t);
      n.stop(t + dur + 0.4);
    }
  }
  function bass(dest, freq, t, dur, vol) {
    const o = ac.createOscillator(),
      o2 = ac.createOscillator(),
      g = gain(0),
      f = filter('lowpass', 420);
    o.type = 'sine';
    o2.type = 'triangle';
    o.frequency.value = freq;
    o2.frequency.value = freq;
    o.connect(f);
    o2.connect(f);
    chain(f, g, dest);
    envelope(g.gain, t, 0.03, vol, Math.max(0.05, dur - 0.2), 0.3);
    for (const n of [o, o2]) {
      n.start(t);
      n.stop(t + dur + 0.4);
    }
  }
  // Percussions : grand tambour (taiko), tambour sur cadre, tom, hochet.
  function drum(dest, kind, t, vol) {
    if (kind === 'taiko' || kind === 'tom' || kind === 'frame') {
      const o = ac.createOscillator(),
        g = gain(0),
        top = kind === 'taiko' ? 110 : kind === 'tom' ? 160 : 210,
        low = kind === 'taiko' ? 42 : kind === 'tom' ? 80 : 120;
      o.type = 'sine';
      o.frequency.setValueAtTime(top, t);
      o.frequency.exponentialRampToValueAtTime(low, t + 0.25);
      chain(o, g, dest);
      envelope(g.gain, t, 0.004, vol, 0.02, kind === 'taiko' ? 0.9 : 0.35);
      o.start(t);
      o.stop(t + 1.2);
      const n = noiseSource(t, 0.2),
        f = filter(kind === 'frame' ? 'bandpass' : 'lowpass', kind === 'frame' ? 2400 : 900, 0.8),
        ng = gain(0);
      chain(n, f, ng, dest);
      envelope(ng.gain, t, 0.002, vol * (kind === 'frame' ? 0.5 : 0.35), 0.01, 0.12);
    } else {
      const n = noiseSource(t, 0.15),
        f = filter('highpass', 6000, 0.7),
        g = gain(0);
      chain(n, f, g, dest);
      envelope(g.gain, t, 0.01, vol, 0.02, 0.06);
    }
  }

  // ---------------------------------------------------------------- Compositeur (client/audio/music.js)
  // Thèmes : tonalité, tempo, enchaînement d'accords (degrés), instruments et percussions.
  const THEMES = MUSIC_THEMES;
  const BIOME_THEMES = MUSIC_BIOME_THEMES;
  // Sections de la pièce (8 × 4 mesures) : qui joue dans chacune.
  const FORM = MUSIC_FORM;
  // Compose la pièce d'un lieu : liste d'événements { beat, kind, … } sur 32 mesures de 4 temps.
  const compose = composeMusic;
  // Joue un événement de la pièce.
  function play(theme, e, t, beatSec, dest) {
    const dur = e.len * beatSec;
    switch (e.kind) {
      case 'pad': {
        const freqs = e.notes.map(midi);
        if (theme.pad === 'choir') choir(dest, freqs, t, dur, 0.09);
        else if (theme.pad === 'shimmer')
          pad(dest, freqs.concat(freqs.map(f => f * 2)), t, dur, 0.11, 'triangle', 2600);
        else if (theme.pad === 'dark') pad(dest, freqs, t, dur, 0.09, 'sawtooth', 520);
        else if (theme.pad === 'drone') pad(dest, [freqs[0]], t, dur, 0.06, 'sawtooth', 700);
        else if (theme.pad === 'soft') pad(dest, freqs, t, dur, 0.08, 'triangle', 1100);
        else pad(dest, freqs, t, dur, 0.08, 'sawtooth', 950);
        break;
      }
      case 'bass':
        bass(dest, midi(e.note), t, dur, 0.13);
        break;
      case 'drone':
        pad(dest, [midi(e.note), midi(e.note + 7)], t, dur, 0.07, 'sawtooth', 380);
        break;
      case 'arp':
        if (theme.arp === 'ostinato') strings(dest, midi(e.note), t, dur * 0.9, 0.06, 0.02);
        else
          pluck(
            dest,
            midi(e.note + 12),
            t,
            dur * 2,
            theme.arp === 'guitar' ? 0.13 : 0.11,
            theme.arp === 'guitar' ? 0.25 : theme.arp === 'low' ? 0.1 : 0.55
          );
        break;
      case 'lead': {
        const f = midi(e.note + (theme.lead === 'strings' ? 0 : 12));
        if (theme.lead === 'flute') flute(dest, f, t, dur, 0.1);
        else if (theme.lead === 'bell') bell(dest, f, t, dur, 0.1);
        else if (theme.lead === 'oud') pluck(dest, f, t, dur * 1.5, 0.16, 0.8);
        else if (theme.lead === 'brass') brass(dest, f / 2, t, dur, 0.09);
        else strings(dest, f, t, dur, 0.07, 0.3);
        break;
      }
      case 'drum':
        drum(dest, e.drum, t, e.vol * 0.32);
        break;
    }
  }
  // Lecteur : programme les notes un peu en avance, et enchaîne d'un lieu à l'autre en fondu.
  const music = { current: null, timer: null };
  function startTheme(key) {
    const parts = key.split(':'),
      base = THEMES[parts[0]];
    if (!base) return;
    // Chaque donjon et chaque raid : sa tonalité et son tempo, à partir du même caractère.
    const shift = parts[1] ? [0, 3, -2, 5, 1, -4, 2, -3, 4, -1][Number(parts[1]) % 10] : 0;
    const theme = {
      ...base,
      root: base.root + shift,
      bpm: base.bpm + (parts[1] ? (Number(parts[1]) % 4) * 3 : 0)
    };
    const bus = gain(0);
    bus.connect(musicBus);
    bus.gain.setValueAtTime(0.0001, ac.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ac.currentTime + 2.5);
    const old = music.current;
    if (old) {
      old.bus.gain.cancelScheduledValues(ac.currentTime);
      old.bus.gain.setValueAtTime(old.bus.gain.value || 0.0001, ac.currentTime);
      old.bus.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 3);
      setTimeout(() => old.bus.disconnect(), 4000);
    }
    music.current = {
      key,
      theme,
      events: compose(theme, key),
      bus,
      start: ac.currentTime + 0.2,
      next: 0,
      loop: 0
    };
  }
  function schedule() {
    const m = music.current;
    if (!m || !ac) return;
    const beatSec = 60 / m.theme.bpm,
      length = FORM.length * 16,
      horizon = ac.currentTime + 0.35;
    for (;;) {
      const e = m.events[m.next];
      if (!e) {
        m.next = 0;
        m.loop++;
        continue;
      }
      const t = m.start + (m.loop * length + e.beat) * beatSec;
      if (t > horizon) break;
      if (t > ac.currentTime - 0.05) play(m.theme, e, Math.max(t, ac.currentTime), beatSec, m.bus);
      m.next++;
      if (m.next >= m.events.length) {
        m.next = 0;
        m.loop++;
      }
    }
  }
  // Lieu actuel → pièce à jouer.
  function themeKey() {
    const inst = game.world.instance;
    if (inst?.arena) return 'arene';
    if (inst) return (instances[inst.index]?.raid ? 'raid:' : 'donjon:') + inst.index;
    if (canaanUnder()) return CANAAN_UNDER.themeKey();
    if (canaanInHouse(P.x / TS, P.y / TS)) return 'maison';
    const x = P.x / TS,
      y = P.y / TS;
    if (canaanInCamp(x, y, 1)) return 'village';
    return BIOME_THEMES[canaanSurfaceZoneAt(x, y)];
  }

  // ---------------------------------------------------------------- Ambiance
  const amb = {};
  function loopNoise(dest, type, freq, q) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuffer;
    s.loop = true;
    const f = filter(type, freq, q),
      g = gain(0);
    chain(s, f, g, dest);
    s.start();
    return { f, g };
  }
  function startAmbience() {
    amb.wind = loopNoise(windBus, 'bandpass', 500, 0.8);
    amb.leaves = loopNoise(windBus, 'highpass', 4200, 0.5);
    amb.water = loopNoise(waterBus, 'lowpass', 700, 0.6);
    amb.rumble = loopNoise(ambBus, 'lowpass', 120, 0.8);
  }
  // Voisinage du héros (recalculé quelques fois par seconde) : eau, arbres et nature du sol.
  const near = { water: 0, sea: 0, trees: 0, at: -99 };
  function survey() {
    if (time - near.at < 20) return near;
    near.at = time;
    if (game.world.instance || canaanUnder()) {
      near.water = near.sea = near.trees = 0;
      return near;
    }
    const cx = Math.floor(P.x / TS),
      cy = Math.floor(P.y / TS);
    let water = 0,
      sea = 0,
      trees = 0;
    for (let dy = -6; dy <= 6; dy++)
      for (let dx = -6; dx <= 6; dx++) {
        const t = game.world.tiles[cy + dy]?.[cx + dx],
          d = game.world.decor[cy + dy]?.[cx + dx],
          w = 1 / (1 + Math.hypot(dx, dy) * 0.6);
        if (t === 0) sea += w;
        else if (t === 15 || t === 18) water += w;
        if (d && /tree|pine|palm|autumn|twisted|bush/.test(d)) trees += w;
      }
    near.water = Math.min(1, water / 6);
    near.sea = Math.min(1, sea / 8);
    near.trees = Math.min(1, trees / 10);
    return near;
  }
  const BIOME_AMB = [
    { wind: 0.5, leaves: 0.5, birds: 0.5, crickets: 0, frogs: 0, chimes: 0 },
    { wind: 0.35, leaves: 0.8, birds: 0.6, crickets: 0.05, frogs: 0, chimes: 0, owl: 0.02 },
    { wind: 0.25, leaves: 0.3, birds: 0.08, crickets: 0.5, frogs: 0.5, chimes: 0 },
    { wind: 0.55, leaves: 0.9, birds: 0.3, crickets: 0, frogs: 0, chimes: 0, crow: 0.04 },
    { wind: 0.9, leaves: 0, birds: 0, crickets: 0.12, frogs: 0, chimes: 0 },
    { wind: 0.3, leaves: 0.5, birds: 0.2, crickets: 0.3, frogs: 0, chimes: 0.35 }
  ];
  let lastAmbient = 0;
  function updateAmbience() {
    const t = ac.currentTime,
      inst = game.world.instance;
    // Les Tréfonds sonnent comme une caverne : gouttes, grondements lointains, peu de vent.
    if (inst || canaanUnder()) {
      amb.wind.g.gain.setTargetAtTime(0.05, t, 0.5);
      amb.leaves.g.gain.setTargetAtTime(0, t, 0.5);
      amb.water.g.gain.setTargetAtTime(0, t, 0.5);
      amb.rumble.g.gain.setTargetAtTime(
        inst && (instances[inst.index]?.raid || inst.arena) ? 0.5 : 0.32,
        t,
        1
      );
      // Gouttes d'eau, chaînes lointaines, grondements.
      if (t - lastAmbient > 0.25) {
        lastAmbient = t;
        if (Math.random() < 0.18) drip();
        if (Math.random() < 0.025) growl();
      }
      return;
    }
    // Dans la maison : pas de vent ni d'eau ; le feu crépite s'il y a une cheminée ou une cuisinière.
    if (canaanInHouse(P.x / TS, P.y / TS)) {
      for (const k of ['wind', 'leaves', 'water', 'rumble']) amb[k].g.gain.setTargetAtTime(0, t, 0.4);
      if (t - lastAmbient > 0.12) {
        lastAmbient = t;
        if (CANAAN_HOUSE.hasFire() && Math.random() < 0.35) crackle();
      }
      return;
    }
    const zone = canaanSurfaceZoneAt(P.x / TS, P.y / TS),
      a = BIOME_AMB[zone],
      w = typeof windAt === 'function' ? windAt(P.x, P.y) : 0.6,
      n = survey();
    amb.rumble.g.gain.setTargetAtTime(0, t, 1);
    amb.wind.g.gain.setTargetAtTime(a.wind * (0.15 + w * 0.5), t, 0.4);
    amb.wind.f.frequency.setTargetAtTime(380 + w * 380, t, 0.6);
    amb.leaves.g.gain.setTargetAtTime(a.leaves * n.trees * w * w * 0.16, t, 0.3);
    // Ressac de la mer (houle lente) et clapotis des marais.
    const swell = 0.6 + 0.4 * Math.sin(t * 0.9);
    amb.water.g.gain.setTargetAtTime(n.sea * 0.28 * swell + n.water * 0.08, t, 0.3);
    amb.water.f.frequency.setTargetAtTime(n.sea > n.water ? 500 + swell * 500 : 900, t, 0.4);
    if (t - lastAmbient > 0.25) {
      lastAmbient = t;
      if (Math.random() < a.birds * 0.09) bird();
      if (Math.random() < a.crickets * 0.2) cricket();
      if (Math.random() < a.frogs * 0.07) frog();
      if (Math.random() < a.chimes * 0.08) chime();
      if (a.owl && Math.random() < a.owl * 0.2) owl();
      if (a.crow && Math.random() < a.crow * 0.2) crow();
      if (n.water > 0.2 && Math.random() < 0.08) plop();
      if (n.sea > 0.3 && Math.random() < n.sea * 0.035) gull();
      // Village : enclume du forgeron, poules, chien au loin.
      if (music.current?.key === 'village') {
        if (Math.random() < 0.035) anvil();
        if (Math.random() < 0.025) hen();
        if (Math.random() < 0.008) dog();
      }
    }
  }
  const spot = () => panner(Math.random() * 1.6 - 0.8);
  function bird() {
    const t = ac.currentTime,
      dest = chain(gain(1), spot(), ambBus),
      base = 2200 + Math.random() * 1800,
      notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const o = ac.createOscillator(),
        g = gain(0),
        s = t + i * (0.08 + Math.random() * 0.06);
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (1 + Math.random() * 0.2), s);
      o.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.7), s + 0.07);
      chain(o, g, dest);
      envelope(g.gain, s, 0.01, 0.035, 0.03, 0.04);
      o.start(s);
      o.stop(s + 0.12);
    }
  }
  function cricket() {
    const t = ac.currentTime,
      dest = chain(gain(1), spot(), ambBus),
      f = 4200 + Math.random() * 600;
    for (let i = 0; i < 3; i++) {
      const o = ac.createOscillator(),
        g = gain(0),
        s = t + i * 0.06;
      o.frequency.value = f;
      chain(o, g, dest);
      envelope(g.gain, s, 0.005, 0.012, 0.025, 0.01);
      o.start(s);
      o.stop(s + 0.05);
    }
  }
  function frog() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      f = filter('lowpass', 500, 4),
      g = gain(0);
    o.type = 'square';
    o.frequency.setValueAtTime(110 + Math.random() * 60, t);
    o.frequency.linearRampToValueAtTime(80, t + 0.18);
    chain(o, f, g, spot(), ambBus);
    envelope(g.gain, t, 0.02, 0.05, 0.08, 0.08);
    o.start(t);
    o.stop(t + 0.25);
  }
  function chime() {
    const t = ac.currentTime,
      dest = chain(gain(1), spot(), ambBus),
      scale = [0, 2, 4, 6, 7, 9, 11];
    for (let i = 0; i < 3; i++)
      bell(dest, midi(84 + scale[Math.floor(Math.random() * 7)]), t + i * 0.12, 0.6, 0.018);
  }
  function owl() {
    const t = ac.currentTime;
    for (const [s, f0] of [
      [0, 420],
      [0.5, 400],
      [0.75, 390]
    ]) {
      const o = ac.createOscillator(),
        g = gain(0);
      o.frequency.setValueAtTime(f0, t + s);
      o.frequency.linearRampToValueAtTime(f0 * 0.92, t + s + 0.25);
      chain(o, g, ambBus);
      envelope(g.gain, t + s, 0.05, 0.025, 0.1, 0.12);
      o.start(t + s);
      o.stop(t + s + 0.35);
    }
  }
  function crow() {
    const t = ac.currentTime,
      n = noiseSource(t, 0.4),
      f = filter('bandpass', 1100, 5),
      o = ac.createOscillator(),
      g = gain(0);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, t);
    o.frequency.linearRampToValueAtTime(420, t + 0.3);
    o.connect(f);
    chain(n, f, g, spot(), ambBus);
    envelope(g.gain, t, 0.02, 0.04, 0.12, 0.15);
    o.start(t);
    o.stop(t + 0.4);
  }
  // Mouette : deux ou trois cris qui glissent vers le grave, nasillards.
  function gull() {
    const t = ac.currentTime,
      dest = chain(gain(1), spot(), ambBus),
      cries = 2 + Math.floor(Math.random() * 2),
      top = 1300 + Math.random() * 400;
    for (let i = 0; i < cries; i++) {
      const s = t + i * (0.22 + Math.random() * 0.08),
        o = ac.createOscillator(),
        f = filter('bandpass', 1600, 3),
        g = gain(0);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(top * (i ? 0.92 : 1), s);
      o.frequency.exponentialRampToValueAtTime(top * 0.55, s + 0.18);
      chain(o, f, g, dest);
      envelope(g.gain, s, 0.02, 0.022, 0.06, 0.1);
      o.start(s);
      o.stop(s + 0.25);
    }
  }
  // Enclume lointaine : deux ou trois coups de marteau métalliques, assourdis.
  function anvil() {
    const t = ac.currentTime,
      dest = chain(gain(1), filter('lowpass', 3200), spot(), ambBus),
      hits = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < hits; i++) metal(dest, t + i * 0.42, 1250 + Math.random() * 60, 0.35, 0.03);
  }
  function hen() {
    const t = ac.currentTime,
      dest = chain(gain(1), spot(), ambBus),
      clucks = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < clucks; i++) {
      const s = t + i * 0.13,
        o = ac.createOscillator(),
        f = filter('bandpass', 900, 4),
        g = gain(0);
      o.type = 'square';
      o.frequency.setValueAtTime(420 + Math.random() * 40, s);
      o.frequency.linearRampToValueAtTime(330, s + 0.06);
      chain(o, f, g, dest);
      envelope(g.gain, s, 0.005, 0.02, 0.02, 0.04);
      o.start(s);
      o.stop(s + 0.1);
    }
  }
  function dog() {
    const t = ac.currentTime,
      dest = chain(gain(1), filter('lowpass', 1800), spot(), ambBus);
    for (const s of [0, 0.32]) {
      const o = ac.createOscillator(),
        n = noiseSource(t + s, 0.15),
        f = filter('bandpass', 700, 2),
        g = gain(0);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(380, t + s);
      o.frequency.exponentialRampToValueAtTime(230, t + s + 0.1);
      o.connect(f);
      chain(n, f, g, dest);
      envelope(g.gain, t + s, 0.01, 0.025, 0.03, 0.08);
      o.start(t + s);
      o.stop(t + s + 0.16);
    }
  }
  function plop() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      g = gain(0);
    o.frequency.setValueAtTime(900 + Math.random() * 500, t);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.08);
    chain(o, g, spot(), waterBus);
    envelope(g.gain, t, 0.003, 0.03, 0.01, 0.07);
    o.start(t);
    o.stop(t + 0.12);
  }
  function crackle() {
    const t = ac.currentTime,
      n = noiseSource(t, 0.05),
      f = filter('bandpass', 1500 + Math.random() * 2500, 2),
      g = gain(0);
    chain(n, f, g, ambBus);
    envelope(g.gain, t, 0.002, 0.05 + Math.random() * 0.06, 0.004, 0.03);
  }
  function drip() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      g = gain(0),
      f = 1400 + Math.random() * 1600;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.06);
    chain(o, g, spot(), ambBus);
    envelope(g.gain, t, 0.002, 0.05, 0.005, 0.09);
    o.start(t);
    o.stop(t + 0.12);
  }
  function growl() {
    const t = ac.currentTime,
      n = noiseSource(t, 2.2),
      f = filter('lowpass', 160, 3),
      g = gain(0);
    f.frequency.setValueAtTime(90, t);
    f.frequency.linearRampToValueAtTime(220, t + 0.8);
    f.frequency.linearRampToValueAtTime(70, t + 2);
    chain(n, f, g, spot(), ambBus);
    envelope(g.gain, t, 0.6, 0.35, 0.4, 1.1);
  }

  // ---------------------------------------------------------------- Bruitages
  // Volume et panoramique selon la position dans le monde (le héros entend ce qui est proche).
  function placed(x, y, vol, bus = fxBus) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { dest: bus, vol };
    const d = Math.hypot(x - P.x, y - P.y),
      k = Math.max(0, 1 - d / 900);
    return { dest: chain(panner((x - P.x) / 600), bus), vol: vol * k * k };
  }
  function whoosh(dest, t, from, to, dur, vol, q = 1.2) {
    const n = noiseSource(t, dur + 0.1),
      f = filter('bandpass', from, q),
      g = gain(0);
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur * 0.7);
    chain(n, f, g, dest);
    envelope(g.gain, t, dur * 0.3, vol, dur * 0.1, dur * 0.6);
  }
  function thump(dest, t, top, low, dur, vol) {
    const o = ac.createOscillator(),
      g = gain(0);
    o.frequency.setValueAtTime(top, t);
    o.frequency.exponentialRampToValueAtTime(low, t + dur);
    chain(o, g, dest);
    envelope(g.gain, t, 0.003, vol, 0.01, dur);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
  // Note brève dont la hauteur glisse (tension d'une corde, souffle magique, choc).
  function tone(dest, t, type, from, to, dur, vol, attack = 0.003) {
    const o = ac.createOscillator(),
      g = gain(0);
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    chain(o, g, dest);
    envelope(g.gain, t, attack, vol, 0.005, dur);
    o.start(t);
    o.stop(t + attack + dur + 0.1);
    return o;
  }
  // Rafale de bruit filtré, sans glissement (claquement, froissement, éclaboussure).
  function burst(dest, t, type, freq, q, dur, vol, attack = 0.002) {
    const n = noiseSource(t, dur + 0.05),
      f = filter(type, freq, q),
      g = gain(0);
    chain(n, f, g, dest);
    envelope(g.gain, t, attack, vol, 0.004, dur);
    return f;
  }
  // Résonance métallique courte : partiels inharmoniques qui s'éteignent vite (lame, enclume, bouclier).
  function metal(dest, t, freq, dur, vol) {
    for (const [ratio, amp] of [
      [1, 1],
      [1.47, 0.6],
      [2.09, 0.45],
      [2.56, 0.3],
      [3.37, 0.18]
    ]) {
      const o = ac.createOscillator(),
        g = gain(0);
      o.frequency.value = freq * ratio * (1 + (Math.random() - 0.5) * 0.01);
      chain(o, g, dest);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / ratio + 0.03);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
    burst(dest, t, 'highpass', 4500, 0.7, 0.03, vol * 2.2);
  }
  // Légère variation à chaque coup, pour que deux attaques ne sonnent jamais pareil.
  const vary = (v, amount = 0.08) => v * (1 + (Math.random() * 2 - 1) * amount);
  // Sifflement d'une lame ou d'un manche (from → to : le filtre balaie l'air).
  function swing(dest, t, from, to, dur, vol, q = 1.2) {
    whoosh(dest, t, vary(from), vary(to), vary(dur, 0.05), vol, q);
  }
  // Corde d'arc qui se détend : claquement, vibration grave et brève, puis la flèche qui siffle.
  function bowShot(dest, t, v) {
    burst(dest, t, 'bandpass', 2600, 1.2, 0.02, 0.4 * v);
    const o = ac.createOscillator(),
      f = filter('lowpass', 1100, 1.5),
      g = gain(0);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(vary(150), t);
    o.frequency.exponentialRampToValueAtTime(95, t + 0.1);
    chain(o, f, g, dest);
    envelope(g.gain, t, 0.002, 0.22 * v, 0.01, 0.09);
    o.start(t);
    o.stop(t + 0.18);
    whoosh(dest, t + 0.02, vary(3600), 1700, 0.22, 0.13 * v, 6);
  }
  // Trait arcanique : un souffle qui monte, une note modulée qui grimpe et un sourd « woum » de départ.
  function arcaneBolt(dest, t, v, big) {
    const len = big ? 0.6 : 0.3;
    whoosh(dest, t, big ? 250 : 450, big ? 1400 : 2600, len, (big ? 0.34 : 0.24) * v, 3);
    tone(dest, t, 'sine', big ? 85 : 110, big ? 40 : 55, big ? 0.45 : 0.2, 0.3 * v, 0.01);
    const o = ac.createOscillator(),
      mod = ac.createOscillator(),
      depth = gain(big ? 140 : 220),
      f = filter('lowpass', 2200, 0.8),
      g = gain(0);
    o.type = 'triangle';
    mod.frequency.value = big ? 23 : 37;
    o.frequency.setValueAtTime(vary(big ? 180 : 300), t);
    o.frequency.exponentialRampToValueAtTime(big ? 420 : 760, t + len * 0.8);
    chain(mod, depth);
    depth.connect(o.frequency);
    chain(o, f, g, dest);
    envelope(g.gain, t, 0.03, 0.09 * v, len * 0.3, len * 0.6);
    for (const n of [o, mod]) {
      n.start(t);
      n.stop(t + len + 0.2);
    }
    if (big) burst(dest, t, 'lowpass', 600, 0.7, 0.5, 0.25 * v, 0.08);
  }
  // Grimoire : pages feuilletées, murmure sombre et grave grondement nécrotique.
  function grimoireCast(dest, t, v) {
    for (let i = 0; i < 3; i++) burst(dest, t + i * 0.025, 'highpass', vary(3800, 0.2), 0.8, 0.018, 0.16 * v);
    const whisper = burst(dest, t + 0.03, 'bandpass', 700, 7, 0.28, 0.4 * v, 0.06);
    whisper.frequency.setValueAtTime(vary(600), t + 0.03);
    whisper.frequency.linearRampToValueAtTime(vary(1100), t + 0.18);
    whisper.frequency.linearRampToValueAtTime(500, t + 0.32);
    const f = filter('lowpass', 320, 2),
      g = gain(0);
    chain(f, g, dest);
    for (const fr of [vary(62), 66.5]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(fr, t);
      o.frequency.linearRampToValueAtTime(fr * 0.85, t + 0.35);
      o.connect(f);
      o.start(t);
      o.stop(t + 0.5);
    }
    envelope(g.gain, t, 0.04, 0.2 * v, 0.1, 0.25);
  }
  // Crachat de peste : giclée humide et bulle qui éclate.
  function plagueSpit(dest, t, v) {
    const f = burst(dest, t, 'lowpass', 1400, 2, 0.12, 0.3 * v);
    f.frequency.setValueAtTime(vary(1500), t);
    f.frequency.exponentialRampToValueAtTime(260, t + 0.12);
    tone(dest, t + 0.01, 'sine', vary(340), 110, 0.07, 0.18 * v);
  }
  // Luth : une corde pincée sur la gamme pentatonique (l'arme est un instrument : la note est voulue).
  const LUTE_NOTES = [57, 60, 62, 64, 67, 69, 72];
  // Bruitage de chaque famille d'arme, rapide ou lourd. Les salves (arc, dagues, grimoire, luth) jouent
  // chaque coup de la rafale.
  const WEAPON_SOUNDS = {
    sword(d, t, v, heavy) {
      if (heavy) {
        swing(d, t, 600, 2800, 0.3, 0.55 * v);
        tone(d, t, 'sine', 150, 70, 0.25, 0.14 * v, 0.03);
        metal(d, t + 0.05, vary(2400, 0.04), 0.18, 0.018 * v);
        swing(d, t + 0.16, 900, 3400, 0.22, 0.45 * v);
      } else {
        swing(d, t, 900, 3600, 0.2, 0.5 * v);
        metal(d, t + 0.03, vary(2600, 0.05), 0.14, 0.014 * v);
      }
    },
    dualsword(d, t, v, heavy) {
      if (heavy)
        for (let i = 0; i < 4; i++) swing(d, t + i * 0.09, 700 + i * 150, 3000 + i * 300, 0.16, 0.4 * v);
      else {
        swing(d, t, 1200, 4200, 0.14, 0.4 * v);
        swing(d, t + 0.07, 1400, 4600, 0.13, 0.34 * v);
        metal(d, t + 0.05, vary(2900, 0.05), 0.1, 0.01 * v);
      }
    },
    dualdagger(d, t, v, heavy) {
      const stab = s => {
        swing(d, s, 1700, 5200, 0.09, 0.46 * v, 1.6);
        burst(d, s + 0.02, 'highpass', 6000, 0.8, 0.025, 0.16 * v);
      };
      if (heavy) for (let i = 0; i < 3; i++) stab(t + i * 0.08);
      else {
        stab(t);
        stab(t + 0.06);
      }
    },
    // Grande hache : souffle lourd et grave, choc sourd ; le moulinet (lourd) frappe le sol.
    greataxe(d, t, v, heavy) {
      swing(d, t, 220, 1000, heavy ? 0.5 : 0.4, (heavy ? 0.75 : 0.65) * v, 0.9);
      burst(d, t + 0.05, 'bandpass', 420, 4, 0.1, 0.14 * v, 0.02);
      tone(d, t, 'sine', 95, 45, 0.35, 0.16 * v, 0.06);
      if (heavy) slam(d, t + 0.3, v);
    },
    axe(d, t, v, heavy) {
      swing(d, t, 300, 1300, heavy ? 0.42 : 0.32, (heavy ? 0.7 : 0.6) * v, 1);
      burst(d, t, 'bandpass', 520, 5, 0.08, 0.12 * v, 0.02);
      tone(d, t, 'sine', 120, 60, 0.3, 0.12 * v, 0.05);
      if (heavy) slam(d, t + 0.24, v);
    },
    mace(d, t, v, heavy) {
      swing(d, t, 260, 1100, heavy ? 0.42 : 0.34, (heavy ? 0.7 : 0.62) * v, 0.9);
      tone(d, t, 'sine', 100, 55, 0.3, 0.14 * v, 0.06);
      if (heavy) slam(d, t + 0.26, v);
    },
    shield(d, t, v, heavy) {
      swing(d, t, 350, 1300, 0.28, 0.5 * v, 1);
      metal(d, t + 0.04, vary(520, 0.04), 0.35, 0.02 * v);
      if (heavy) {
        slam(d, t + 0.24, v);
        metal(d, t + 0.24, 780, 0.6, 0.016 * v);
      }
    },
    spear(d, t, v, heavy) {
      tone(d, t, 'triangle', 420, 200, 0.04, 0.12 * v);
      swing(d, t, 500, heavy ? 3400 : 3000, heavy ? 0.22 : 0.14, (heavy ? 0.6 : 0.5) * v, 2);
      if (heavy) burst(d, t + 0.12, 'lowpass', 900, 0.8, 0.3, 0.2 * v, 0.02);
    },
    bow(d, t, v, heavy) {
      if (heavy) for (let i = 0; i < 5; i++) bowShot(d, t + i * 0.06, v * (i ? 0.7 : 1));
      else bowShot(d, t, v);
    },
    staff(d, t, v, heavy) {
      arcaneBolt(d, t, v * 0.8, heavy);
    },
    grimoire(d, t, v, heavy) {
      grimoireCast(d, t, (heavy ? 0.6 : 0.8) * v);
      if (heavy) for (let i = 0; i < 5; i++) plagueSpit(d, t + 0.05 + i * 0.06, v);
    },
    lute(d, t, v, heavy) {
      const pick = () => LUTE_NOTES[Math.floor(Math.random() * LUTE_NOTES.length)];
      burst(d, t, 'bandpass', 3000, 1, 0.012, 0.1 * v);
      if (heavy) {
        const root = pick();
        [0, 4, 7].forEach((k, i) => pluck(d, midi(root + k), t + i * 0.025, 0.5, 0.2 * v, 0.7));
      } else pluck(d, midi(pick()), t, 0.4, 0.24 * v, 0.7);
    }
  };
  // Fracas au sol : choc sourd, gravats.
  function slam(dest, t, v) {
    thump(dest, t, 110, 38, 0.4, 0.5 * v);
    burst(dest, t, 'lowpass', 1200, 0.7, 0.25, 0.3 * v);
    for (let i = 0; i < 4; i++)
      burst(dest, t + 0.05 + Math.random() * 0.2, 'bandpass', vary(2200, 0.3), 3, 0.02, 0.08 * v);
  }
  function attackSound(type, heavy, x, y, vol = 1) {
    const t = ac.currentTime,
      { dest, vol: v } = placed(x, y, vol);
    if (v < 0.01) return;
    (WEAPON_SOUNDS[type] || WEAPON_SOUNDS.sword)(dest, t, v, heavy);
  }
  let hitBudget = 0,
    hitClock = 0;
  function hitSound(x, y, crit) {
    const t = ac.currentTime;
    if (t - hitClock > 0.1) {
      hitClock = t;
      hitBudget = 0;
    }
    if (++hitBudget > 3) return;
    const { dest, vol } = placed(x, y, 1);
    if (vol < 0.01) return;
    thump(dest, t, vary(150, 0.15), 55, 0.12, 0.45 * vol);
    burst(dest, t, 'bandpass', vary(1800, 0.2), 1, 0.05, 0.3 * vol);
    // Coup critique : claquement sec et choc plus lourd, sans note.
    if (crit) {
      burst(dest, t, 'highpass', 3200, 0.8, 0.04, 0.35 * vol);
      thump(dest, t + 0.01, 90, 40, 0.22, 0.4 * vol);
    }
  }
  function hurtSound() {
    const t = ac.currentTime;
    thump(fxBus, t, 110, 45, 0.18, 0.55);
    whoosh(fxBus, t, 500, 300, 0.15, 0.25, 2);
  }
  function deathSound(x, y) {
    const t = ac.currentTime,
      { dest, vol } = placed(x, y, 1);
    if (vol < 0.01) return;
    whoosh(dest, t, 1200, 180, 0.45, 0.35 * vol, 0.8);
    thump(dest, t, 90, 35, 0.35, 0.35 * vol);
  }
  function dodgeSound() {
    const t = ac.currentTime;
    whoosh(fxBus, t, 400, 1800, 0.28, 0.35, 0.9);
  }
  // Montée de niveau : petite fanfare ascendante.
  function levelUpSound() {
    const t = ac.currentTime;
    [67, 72, 76, 79, 84].forEach((n, i) => bell(uiBus, midi(n + 12), t + i * 0.09, 0.4, 0.06));
    bell(uiBus, midi(91), t + 0.5, 0.9, 0.05);
  }
  function coinSound() {
    const t = ac.currentTime;
    bell(uiBus, 1568, t, 0.05, 0.05);
    bell(uiBus, 2093, t + 0.07, 0.08, 0.05);
  }
  function lootSound() {
    const t = ac.currentTime;
    [72, 76, 79, 84].forEach((n, i) => bell(uiBus, midi(n + 12), t + i * 0.07, 0.25, 0.045));
  }
  function chestSound() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      f = filter('bandpass', 700, 6),
      g = gain(0);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(130, t + 0.35);
    chain(o, f, g, uiBus);
    envelope(g.gain, t, 0.05, 0.25, 0.2, 0.15);
    o.start(t);
    o.stop(t + 0.5);
    [79, 83, 86, 91].forEach((n, i) => bell(uiBus, midi(n + 12), t + 0.35 + i * 0.06, 0.4, 0.04));
  }
  function healSound(x, y) {
    const { dest, vol } = placed(x, y, 1);
    if (vol < 0.01) return;
    const t = ac.currentTime;
    [76, 83, 88].forEach((n, i) => bell(dest, midi(n + 12), t + i * 0.05, 0.3, 0.025 * vol));
  }
  // Sorts : le son suit la couleur de l'effet (feu, glace, nature, foudre, arcane, lumière).
  function hue(hex) {
    if (typeof hex !== 'string' || !/^#[0-9a-f]{6}/i.test(hex)) return -1;
    const r = parseInt(hex.slice(1, 3), 16) / 255,
      g = parseInt(hex.slice(3, 5), 16) / 255,
      b = parseInt(hex.slice(5, 7), 16) / 255,
      max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (max - min < 0.12) return -1;
    let h =
      max === r ? (g - b) / (max - min) : max === g ? 2 + (b - r) / (max - min) : 4 + (r - g) / (max - min);
    return (h * 60 + 360) % 360;
  }
  let lastSpell = 0;
  function spellSound(shape, x, y, c, r, w) {
    // Trait de départ d'un projectile (65 px de long) : l'attaque de l'arme a déjà son propre son.
    if (shape === 'beam' && r === 65 && w === 7) return;
    const t = ac.currentTime;
    if (t - lastSpell < 0.06) return;
    lastSpell = t;
    const { dest, vol } = placed(x, y, 1);
    if (vol < 0.01) return;
    const h = hue(c);
    if (shape === 'beam' && (h < 0 || (h > 40 && h < 70))) {
      // Foudre : craquement aigu.
      const n = noiseSource(t, 0.3),
        f = filter('highpass', 2500, 0.7),
        g = gain(0);
      chain(n, f, g, dest);
      for (let i = 0; i < 4; i++) g.gain.setValueAtTime((i % 2 ? 0.05 : 0.35) * vol, t + i * 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      return;
    }
    if (h >= 0 && (h < 35 || h > 340)) whoosh(dest, t, 300, 1400, 0.4, 0.4 * vol, 0.7);
    else if (h >= 170 && h < 230)
      [88, 95, 91].forEach((n, i) => bell(dest, midi(n), t + i * 0.04, 0.2, 0.035 * vol));
    else if (h >= 80 && h < 170) healSound(x, y);
    else if (h >= 230 && h <= 340) {
      whoosh(dest, t, 800, 2400, 0.35, 0.22 * vol, 4);
      bell(dest, midi(81), t, 0.3, 0.03 * vol);
    } else whoosh(dest, t, 700, 2000, 0.3, 0.25 * vol, 2);
  }
  // Pas : le son dépend du sol sous les pieds.
  function footstep(x, y) {
    const t = ac.currentTime,
      tile =
        game.world.instance || canaanUnder()
          ? 'stone'
          : (() => {
              const v = game.world.tiles[Math.floor(y / TS)]?.[Math.floor(x / TS)];
              return v === 15 || v === 18
                ? 'water'
                : v === 3
                  ? 'sand'
                  : v === 4
                    ? 'stone'
                    : v === 2 || v === 16
                      ? 'dirt'
                      : 'grass';
            })();
    const vol = 0.16;
    if (tile === 'water') {
      whoosh(stepBus, t, 1600, 500, 0.22, vol * 1.4, 1.5);
      return;
    }
    const n = noiseSource(t, 0.12),
      f = filter(
        tile === 'stone' ? 'bandpass' : 'lowpass',
        tile === 'grass' ? 900 : tile === 'sand' ? 2200 : tile === 'dirt' ? 1200 : 1600,
        tile === 'stone' ? 2 : 0.8
      ),
      g = gain(0);
    chain(n, f, g, stepBus);
    envelope(g.gain, t, 0.004, vol * (tile === 'grass' ? 1.1 : 1), 0.01, tile === 'sand' ? 0.09 : 0.06);
    if (tile === 'stone' || tile === 'dirt') thump(stepBus, t, 130, 70, 0.05, vol * 0.6);
  }

  // ---------------------------------------------------------------- Voix des personnages
  // Un babillage sans paroles : des syllabes chantées à travers les formants d'une voyelle. Le nom du personnage
  // fixe sa hauteur et son timbre, si bien qu'un même habitant garde toujours la même voix.
  const VOWELS = [
    [730, 1090],
    [530, 1840],
    [390, 1990],
    [570, 840],
    [440, 1020],
    [300, 870]
  ];
  function hashOf(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  let voiceUntil = 0;
  function speak(seed, text, x, y, kind) {
    const t0 = ac.currentTime;
    // Une seule réplique à la fois : la suivante attend que la précédente soit dite.
    if (t0 < voiceUntil) return;
    const { dest, vol } = placed(x, y, 1, voiceBus);
    if (vol < 0.02) return;
    const h = hashOf(seed),
      sex = kind || (h & 1 ? 'f' : 'm'),
      base = sex === 'dwarf' ? 95 + (h % 30) : sex === 'f' ? 210 + (h % 70) : 120 + (h % 50),
      speed = 0.085 + ((h >> 3) % 5) * 0.01,
      bright = sex === 'f' ? 1.15 : sex === 'dwarf' ? 0.85 : 1,
      words = text.replace(/[^\p{L}\s]/gu, '').trim(),
      count = Math.max(2, Math.min(9, Math.round(words.length / 7))),
      ask = /\?\s*»?\s*$/.test(text);
    let rnd = h;
    const next = () => ((rnd = Math.imul(rnd ^ (rnd >>> 15), 2246822507) >>> 0) % 1000) / 1000;
    let t = t0;
    for (let i = 0; i < count; i++) {
      const len = speed * (0.7 + next() * 0.6),
        last = i === count - 1,
        // Intonation : la phrase descend, ou remonte à la fin d'une question.
        pitch = base * (1 + (next() - 0.5) * 0.25) * (last ? (ask ? 1.25 : 0.85) : 1),
        [f1, f2] = VOWELS[Math.floor(next() * VOWELS.length)],
        o = ac.createOscillator(),
        g = gain(0),
        mix = gain(1);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(pitch, t);
      o.frequency.linearRampToValueAtTime(pitch * (last && ask ? 1.15 : 0.94), t + len);
      for (const [fr, amp, q] of [
        [f1 * bright, 1, 6],
        [f2 * bright, 0.5, 8]
      ]) {
        const f = filter('bandpass', fr, q),
          fg = gain(amp * 2.4);
        o.connect(f);
        chain(f, fg, mix);
      }
      chain(mix, g, dest);
      envelope(g.gain, t, 0.012, 0.09 * vol, len * 0.5, len * 0.5);
      o.start(t);
      o.stop(t + len + 0.1);
      t += len + 0.02 + next() * 0.05 + (next() < 0.15 ? 0.1 : 0);
    }
    voiceUntil = t + 0.15;
  }
  // Fenêtres : froissement de parchemin à l'ouverture, son plus bref à la fermeture.
  function panelSound(open) {
    const t = ac.currentTime,
      f = burst(uiBus, t, 'bandpass', open ? 1800 : 2600, 1.4, open ? 0.12 : 0.07, open ? 0.12 : 0.08, 0.02);
    f.frequency.setValueAtTime(open ? 1200 : 3000, t);
    f.frequency.exponentialRampToValueAtTime(open ? 3200 : 1400, t + (open ? 0.12 : 0.07));
    thump(uiBus, t, open ? 260 : 200, 120, 0.05, 0.07);
  }

  // ---------------------------------------------------------------- Observation de l'état du jeu
  const watch = {
    hp: null,
    gold: null,
    bag: null,
    atk: new WeakMap(),
    step: 0,
    chests: 0,
    monsters: new Map(),
    dodgeAt: 0
  };
  function observe() {
    if (!ac || !settings.on || !started || paused || document.hidden) return;
    // Pièce du lieu.
    const key = themeKey();
    if (!music.current || music.current.key !== key) startTheme(key);
    schedule();
    updateAmbience();
    // Fenêtres du jeu (sac, carte, quêtes, marchand…) : ouverture et fermeture.
    const panel = typeof modalOpen === 'function' && modalOpen();
    if (watch.panel !== undefined && panel !== watch.panel) panelSound(panel);
    watch.panel = panel;
    // Coups reçus, or et butin du héros.
    if (watch.hp !== null && P.hp < watch.hp - 1 && !P.dead) hurtSound();
    watch.hp = P.hp;
    if (watch.gold !== null && P.gold > watch.gold) coinSound();
    watch.gold = P.gold;
    const bag = game.hero.inventory?.length || 0;
    if (watch.bag !== null && bag > watch.bag) lootSound();
    watch.bag = bag;
    const opened =
      (game.world.openedChests?.length || 0) + (game.world.chests || []).filter(c => c.opened).length;
    if (opened > watch.chests && watch.chestsSeen) chestSound();
    watch.chests = opened;
    watch.chestsSeen = true;
    // Attaques de chaque héros visible (début du mouvement d'arme).
    for (const hero of game.heroes) {
      const p = hero.player,
        before = watch.atk.get(p) || 0;
      if ((p.atk || 0) > before + 0.1 && (p.atk || 0) > 0.2) {
        const type = hero.equipment?.weapon?.weaponType || 'sword',
          heavy = hero === game.hero ? game.hero.intent?.attack === 'heavy' : hero.intent?.attack === 'heavy';
        attackSound(type, heavy, p.x, p.y, hero === game.hero ? 1 : 0.6);
      }
      watch.atk.set(p, p.atk || 0);
    }
    // Pas du héros : un pas tous les 46 pixels parcourus (environ 4 par seconde en marchant, plus vite en courant).
    const moved = watch.lastX === undefined ? 0 : Math.hypot(P.x - watch.lastX, P.y - watch.lastY);
    watch.lastX = P.x;
    watch.lastY = P.y;
    if (!P.dead && moved > 0.5 && moved < 120) {
      watch.step += moved;
      if (watch.step >= 46) {
        watch.step = 0;
        footstep(P.x, P.y + 16);
      }
    } else if (moved < 0.5) watch.step = 30;
    // Pêche : plouf du bouchon au lancer, éclaboussure quand ça mord, carillon pour une prise.
    const line = CANAAN_PROF.myLive().fishing,
      caught = Object.values(game.hero.prof?.fish || {}).reduce((a, b) => a + b, 0);
    if (line && !watch.line) whoosh(waterBus, ac.currentTime, 1800, 500, 0.25, 0.35, 1.5);
    if (line?.bite && !watch.line?.bite) {
      whoosh(waterBus, ac.currentTime, 2400, 700, 0.3, 0.6, 1.2);
      bell(uiBus, 1318, ac.currentTime, 0.1, 0.05);
    }
    if (watch.caught !== undefined && caught > watch.caught)
      [84, 88, 91].forEach((n, i) => bell(uiBus, midi(n), ac.currentTime + i * 0.06, 0.2, 0.04));
    watch.line = line;
    watch.caught = caught;
    // Monstres disparus après avoir été bien entamés : chute.
    const seen = new Map();
    for (const m of game.world.monsters) seen.set(m, m.hp / (m.mhp || 1));
    for (const [m, ratio] of watch.monsters)
      if (!seen.has(m) && ratio < 0.4 && Math.hypot(m.x - P.x, m.y - P.y) < 900) deathSound(m.x, m.y);
    watch.monsters = seen;
  }
  setInterval(observe, 50);

  // Points d'accroche appelés par le jeu (nombres flottants, effets de sorts, roulade).
  window.CANAAN_SOUND = Object.freeze({
    floatText(x, y, txt, c) {
      if (!ac || !settings.on || !started || paused) return;
      const s = String(txt);
      if (/^\+\s?\d/.test(s)) return;
      if (/^-?\d[\d\s]*!?$/.test(s) || /^\d+\s?(💥|!)/.test(s))
        hitSound(x, y, /!|💥/.test(s) || c === '#ffd54a');
    },
    effect(shape, x, y, c, r, w) {
      if (!ac || !settings.on || !started || paused) return;
      if (shape === 'arc' || shape === 'spark') return;
      spellSound(shape, x, y, c, r, w);
    },
    // Un personnage parle : seed (son nom) fixe sa voix ; kind : 'f', 'm' ou 'dwarf' (sinon tiré du nom).
    voice(seed, text, x, y, kind) {
      if (!ac || !settings.on || !started || paused) return;
      speak(String(seed || ''), String(text || ''), x, y, kind);
    },
    cue(name) {
      if (!ac || !settings.on || !started || paused) return;
      if (name === 'dodge') dodgeSound();
      else if (name === 'levelup') levelUpSound();
      // Quêtes : notes des pierres musicales (note1 à note4), énigme résolue, erreur, coffre.
      else if (/^note[1-4]$/.test(name))
        bell(uiBus, midi([60, 64, 67, 72][Number(name[4]) - 1] + 12), ac.currentTime, 0.7, 0.07);
      else if (name === 'puzzle') lootSound();
      // Fanfare « objet obtenu » : un arpège qui monte puis un accord tenu.
      else if (name === 'fanfare') {
        const t0 = ac.currentTime;
        [67, 71, 74, 79].forEach((n, i) => bell(uiBus, midi(n), t0 + i * 0.09, 0.5, 0.06));
        for (const n of [79, 83, 86]) bell(uiBus, midi(n), t0 + 0.42, 1.3, 0.045);
      } else if (name === 'chest') chestSound();
      else if (name === 'wrong') bell(uiBus, midi(43), ac.currentTime, 0.35, 0.05);
      // Coup de pelle : la lame qui entre dans la terre, puis la motte qui retombe.
      else if (name === 'dig') {
        const t0 = ac.currentTime;
        thump(uiBus, t0, 180, 60, 0.12, 0.3);
        whoosh(uiBus, t0 + 0.05, 900, 300, 0.18, 0.12, 0.7);
      }
    },
    state() {
      let level = 0;
      if (meter) {
        const d = new Float32Array(meter.fftSize);
        meter.getFloatTimeDomainData(d);
        level = Math.sqrt(d.reduce((a, v) => a + v * v, 0) / d.length);
      }
      return { on: settings.on, theme: music.current?.key || null, ready: !!ac, level };
    }
  });

  // ---------------------------------------------------------------- Interface et cycle de vie
  function restartMusic() {
    if (!settings.on) return;
    if (initAudio()) {
      // Le changement de lieu est détecté par l'observation ; on relance seulement la pièce actuelle.
      if (music.current && music.current.key !== themeKey()) startTheme(themeKey());
    }
  }
  function stopMusic() {
    if (music.current && ac) {
      const old = music.current;
      old.bus.gain.cancelScheduledValues(ac.currentTime);
      old.bus.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4);
      setTimeout(() => old.bus.disconnect(), 2500);
    }
    music.current = null;
    if (ac) {
      for (const k of ['wind', 'leaves', 'water', 'rumble'])
        amb[k]?.g.gain.setTargetAtTime(0, ac.currentTime, 0.3);
    }
  }
  toggle.addEventListener('click', () => {
    settings.on = !settings.on;
    saveAudio();
    toggle.textContent = settings.on ? '🔊 Son' : '🔇 Son';
    if (settings.on) {
      initAudio();
      if (ac) bell(uiBus, 1047, ac.currentTime, 0.2, 0.06);
    } else {
      applyVolumes();
      stopMusic();
    }
  });
  toggle.textContent = settings.on ? '🔊 Son' : '🔇 Son';
  // Curseurs de volume : la valeur s'affiche à côté (« 45 % ») et s'applique aussitôt.
  for (const [key, id] of Object.entries(SLIDERS)) {
    const slider = document.getElementById(id);
    if (!slider) continue;
    const label = slider.parentElement?.querySelector('.volume-value');
    const show = () => label && (label.textContent = slider.value + ' %');
    slider.value = settings[key];
    show();
    slider.addEventListener('input', () => {
      settings[key] = +slider.value;
      show();
      saveAudio();
      applyVolumes();
    });
  }
  // La pause baisse la musique et coupe les bruitages.
  let wasPaused = false;
  setInterval(() => {
    if (paused !== wasPaused) {
      wasPaused = paused;
      applyVolumes();
    }
  }, 200);
  // Le navigateur exige un geste de l'utilisateur pour démarrer l'audio : premier clic ou touche.
  const unlock = () => {
    if (settings.on && started) initAudio();
  };
  addEventListener('pointerdown', unlock);
  addEventListener('keydown', unlock);
  CanaanStages.restartMusic = restartMusic;
  CanaanStages.stopMusic = stopMusic;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ac) ac.suspend();
    else if (settings.on && ac) ac.resume();
  });
})();
