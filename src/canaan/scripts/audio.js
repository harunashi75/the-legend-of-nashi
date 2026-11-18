// CANAAN AUDIO — musique d'ambiance, sons d'ambiance et bruitages, entièrement synthétisés (Web Audio, aucun fichier).
// Musique : chaque biome, les villages, chaque donjon, chaque raid et l'Arène ont leur pièce (mode, tempo,
// instruments, percussions), composée une fois par lieu à partir d'une graine : 32 mesures avec introduction,
// thème, variation, pont et reprise, jouées en boucle, avec un fondu enchaîné d'un lieu à l'autre.
// Ambiance : vent (lié au vent visible des arbres), feuillage, eau proche, oiseaux, grillons, grenouilles,
// gouttes et grondements des donjons. Bruitages : attaques selon l'arme, impacts, coups reçus, pas selon le sol,
// éclaboussures, roulade, pièces, butin, coffres et sorts. Le moteur observe l'état du jeu à chaque image,
// ce qui marche aussi chez un invité en ligne ; quelques points d'accroche signalent les nombres de dégâts,
// les effets de sorts et la roulade (window.CANAAN_SOUND).
(() => {
  'use strict';
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const toggle = document.getElementById('soundToggle'),
    musicSlider = document.getElementById('musicVolume'),
    fxSlider = document.getElementById('sfxVolume');
  const settings = Object.assign({ on: false, music: 25, fx: 45 }, CANAAN_PREFERENCES.read('audio', {}));
  musicSlider.value = settings.music;
  fxSlider.value = settings.fx;
  const saveAudio = () => CANAAN_PREFERENCES.write('audio', settings);

  // ---------------------------------------------------------------- Graphe audio
  let ac = null,
    master = null,
    musicBus = null,
    fxBus = null,
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
        reverb = ac.createConvolver();
        reverb.buffer = impulse(3.2, 2.6);
        const wet = ac.createGain();
        wet.gain.value = 0.32;
        reverb.connect(wet);
        wet.connect(master);
        musicBus = ac.createGain();
        fxBus = ac.createGain();
        ambBus = ac.createGain();
        for (const bus of [musicBus, fxBus, ambBus]) bus.connect(master);
        // Envois vers la réverbération : beaucoup pour la musique, un peu pour les bruitages.
        const send = (bus, amount) => {
          const g = ac.createGain();
          g.gain.value = amount;
          bus.connect(g);
          g.connect(reverb);
        };
        send(musicBus, 0.55);
        send(fxBus, 0.18);
        send(ambBus, 0.25);
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
    musicBus.gain.setTargetAtTime(on * quiet * (settings.music / 100) * 0.55, t, 0.2);
    fxBus.gain.setTargetAtTime(on * (paused ? 0 : 1) * (settings.fx / 100) * 0.9, t, 0.05);
    ambBus.gain.setTargetAtTime(on * (paused ? 0.3 : 1) * (settings.fx / 100) * 0.7, t, 0.3);
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
    if (villages.some(v => Math.hypot(x - v.x, y - v.y) < v.r + 3)) return 'village';
    const zone = ZONES.indexOf(regionAt(x, y));
    return BIOME_THEMES[Math.max(0, zone)];
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
    amb.wind = loopNoise(ambBus, 'bandpass', 500, 0.8);
    amb.leaves = loopNoise(ambBus, 'highpass', 4200, 0.5);
    amb.water = loopNoise(ambBus, 'lowpass', 700, 0.6);
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
    const zone = Math.max(0, ZONES.indexOf(regionAt(P.x / TS, P.y / TS))),
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
  function plop() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      g = gain(0);
    o.frequency.setValueAtTime(900 + Math.random() * 500, t);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.08);
    chain(o, g, spot(), ambBus);
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
  function placed(x, y, vol) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { dest: fxBus, vol };
    const d = Math.hypot(x - P.x, y - P.y),
      k = Math.max(0, 1 - d / 900);
    const out = chain(panner((x - P.x) / 600), fxBus);
    return { dest: out, vol: vol * k * k };
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
  const SWINGS = {
    sword: [900, 3600, 0.2, 0.5],
    dualsword: [1200, 4200, 0.14, 0.42],
    dagger: [1400, 4800, 0.12, 0.38],
    axe: [400, 1500, 0.3, 0.6],
    mace: [300, 1200, 0.32, 0.62],
    hammer: [260, 1000, 0.34, 0.65],
    shield: [350, 1300, 0.28, 0.55],
    spear: [700, 2600, 0.18, 0.5]
  };
  function attackSound(type, heavy, x, y, vol = 1) {
    const t = ac.currentTime,
      { dest, vol: v } = placed(x, y, vol);
    if (v < 0.01) return;
    if (type === 'bow') {
      pluck(dest, 196, t, 0.25, 0.35 * v, 0.9);
      whoosh(dest, t + 0.02, 2500, 5000, 0.18, 0.25 * v, 2);
      return;
    }
    if (type === 'staff') {
      whoosh(dest, t, 600, 2400, 0.3, 0.3 * v, 3);
      const o = ac.createOscillator(),
        g = gain(0);
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(1300, t + 0.25);
      chain(o, g, dest);
      envelope(g.gain, t, 0.02, 0.07 * v, 0.08, 0.2);
      o.start(t);
      o.stop(t + 0.4);
      return;
    }
    const [from, to, dur, loud] = SWINGS[type] || SWINGS.sword;
    whoosh(
      dest,
      t,
      heavy ? from * 0.7 : from,
      heavy ? to * 0.8 : to,
      heavy ? dur * 1.4 : dur,
      loud * v * (heavy ? 1.15 : 1)
    );
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
    thump(dest, t, 150, 55, 0.12, 0.45 * vol);
    const n = noiseSource(t, 0.08),
      f = filter('bandpass', 1800, 1),
      g = gain(0);
    chain(n, f, g, dest);
    envelope(g.gain, t, 0.002, 0.3 * vol, 0.01, 0.05);
    if (crit) bell(dest, 1760, t, 0.05, 0.05 * vol);
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
    [67, 72, 76, 79, 84].forEach((n, i) => bell(fxBus, midi(n + 12), t + i * 0.09, 0.4, 0.06));
    bell(fxBus, midi(91), t + 0.5, 0.9, 0.05);
  }
  function coinSound() {
    const t = ac.currentTime;
    bell(fxBus, 1568, t, 0.05, 0.05);
    bell(fxBus, 2093, t + 0.07, 0.08, 0.05);
  }
  function lootSound() {
    const t = ac.currentTime;
    [72, 76, 79, 84].forEach((n, i) => bell(fxBus, midi(n + 12), t + i * 0.07, 0.25, 0.045));
  }
  function chestSound() {
    const t = ac.currentTime,
      o = ac.createOscillator(),
      f = filter('bandpass', 700, 6),
      g = gain(0);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    o.frequency.linearRampToValueAtTime(130, t + 0.35);
    chain(o, f, g, fxBus);
    envelope(g.gain, t, 0.05, 0.25, 0.2, 0.15);
    o.start(t);
    o.stop(t + 0.5);
    [79, 83, 86, 91].forEach((n, i) => bell(fxBus, midi(n + 12), t + 0.35 + i * 0.06, 0.4, 0.04));
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
  function spellSound(shape, x, y, c) {
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
      whoosh(fxBus, t, 1600, 500, 0.22, vol * 1.4, 1.5);
      return;
    }
    const n = noiseSource(t, 0.12),
      f = filter(
        tile === 'stone' ? 'bandpass' : 'lowpass',
        tile === 'grass' ? 900 : tile === 'sand' ? 2200 : tile === 'dirt' ? 1200 : 1600,
        tile === 'stone' ? 2 : 0.8
      ),
      g = gain(0);
    chain(n, f, g, fxBus);
    envelope(g.gain, t, 0.004, vol * (tile === 'grass' ? 1.1 : 1), 0.01, tile === 'sand' ? 0.09 : 0.06);
    if (tile === 'stone' || tile === 'dirt') thump(fxBus, t, 130, 70, 0.05, vol * 0.6);
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
    if (line && !watch.line) whoosh(fxBus, ac.currentTime, 1800, 500, 0.25, 0.25, 1.5);
    if (line?.bite && !watch.line?.bite) {
      whoosh(fxBus, ac.currentTime, 2400, 700, 0.3, 0.45, 1.2);
      bell(fxBus, 1318, ac.currentTime, 0.1, 0.05);
    }
    if (watch.caught !== undefined && caught > watch.caught)
      [84, 88, 91].forEach((n, i) => bell(fxBus, midi(n), ac.currentTime + i * 0.06, 0.2, 0.04));
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
    effect(shape, x, y, c) {
      if (!ac || !settings.on || !started || paused) return;
      if (shape === 'arc' || shape === 'spark') return;
      spellSound(shape, x, y, c);
    },
    cue(name) {
      if (!ac || !settings.on || !started || paused) return;
      if (name === 'dodge') dodgeSound();
      else if (name === 'levelup') levelUpSound();
      // Quêtes : notes des pierres musicales (note1 à note4), énigme résolue, erreur, coffre.
      else if (/^note[1-4]$/.test(name))
        bell(fxBus, midi([60, 64, 67, 72][Number(name[4]) - 1] + 12), ac.currentTime, 0.7, 0.07);
      else if (name === 'puzzle') lootSound();
      // Fanfare « objet obtenu » : un arpège qui monte puis un accord tenu.
      else if (name === 'fanfare') {
        const t0 = ac.currentTime;
        [67, 71, 74, 79].forEach((n, i) => bell(fxBus, midi(n), t0 + i * 0.09, 0.5, 0.06));
        for (const n of [79, 83, 86]) bell(fxBus, midi(n), t0 + 0.42, 1.3, 0.045);
      } else if (name === 'chest') chestSound();
      else if (name === 'wrong') bell(fxBus, midi(43), ac.currentTime, 0.35, 0.05);
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
      if (ac) bell(fxBus, 1047, ac.currentTime, 0.2, 0.06);
    } else {
      applyVolumes();
      stopMusic();
    }
  });
  toggle.textContent = settings.on ? '🔊 Son' : '🔇 Son';
  musicSlider.addEventListener('input', () => {
    settings.music = +musicSlider.value;
    saveAudio();
    applyVolumes();
  });
  fxSlider.addEventListener('input', () => {
    settings.fx = +fxSlider.value;
    saveAudio();
    applyVolumes();
  });
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
