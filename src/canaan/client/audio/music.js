// Compositeur de la musique du jeu : modes, thèmes de chaque lieu (tonalité, tempo, accords, instruments,
// percussions), forme des pièces, rythmes, et composition d'une pièce à partir d'une graine (la même pièce revient
// toujours au même lieu). Aucun son ici : scripts/audio.js joue les événements avec Web Audio.
// Module ES (src/canaan/client/) : exposé aux scripts classiques par le pont (bridge.js).

export const midiFrequency = n => 440 * Math.pow(2, (n - 69) / 12);
// ---------------------------------------------------------------- Compositeur
// Graine : la même pièce revient toujours au même lieu.
export function musicSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let r = Math.imul(h ^ (h >>> 15), 1 | h);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export const MUSIC_MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10]
};
// Thèmes : tonalité, tempo, enchaînement d'accords (degrés), instruments et percussions.
export const MUSIC_THEMES = {
  plaines: {
    root: 62,
    mode: 'major',
    bpm: 84,
    prog: [0, 4, 5, 3],
    lead: 'flute',
    arp: 'harp',
    pad: 'warm',
    perc: null,
    bass: true
  },
  foret: {
    root: 52,
    mode: 'dorian',
    bpm: 70,
    prog: [0, 6, 3, 0],
    lead: 'flute',
    arp: 'harp',
    pad: 'soft',
    perc: 'shaker',
    bass: true
  },
  marais: {
    root: 57,
    mode: 'phrygian',
    bpm: 56,
    prog: [0, 1, 5, 0],
    lead: 'bell',
    arp: null,
    pad: 'dark',
    perc: null,
    drone: true
  },
  automne: {
    root: 59,
    mode: 'aeolian',
    bpm: 76,
    prog: [0, 5, 2, 6],
    lead: 'flute',
    arp: 'guitar',
    pad: 'warm',
    perc: null,
    bass: true
  },
  desert: {
    root: 62,
    mode: 'hijaz',
    bpm: 92,
    prog: [0, 0, 6, 0],
    lead: 'oud',
    arp: null,
    pad: 'drone',
    perc: 'frame',
    drone: true
  },
  enchantee: {
    root: 65,
    mode: 'lydian',
    bpm: 64,
    prog: [0, 1, 4, 0],
    lead: 'bell',
    arp: 'harp',
    pad: 'shimmer',
    perc: null,
    bass: false
  },
  maison: {
    root: 65,
    mode: 'major',
    bpm: 70,
    prog: [0, 5, 3, 4],
    lead: 'bell',
    arp: 'harp',
    pad: 'soft',
    perc: null,
    bass: true
  },
  village: {
    root: 67,
    mode: 'major',
    bpm: 100,
    prog: [0, 3, 4, 0],
    lead: 'flute',
    arp: 'guitar',
    pad: 'warm',
    perc: 'frame-light',
    bass: true
  },
  donjon: {
    root: 48,
    mode: 'harmonic',
    bpm: 66,
    prog: [0, 5, 3, 4],
    lead: 'strings',
    arp: 'low',
    pad: 'dark',
    perc: 'taiko-slow',
    drone: true
  },
  raid: {
    root: 50,
    mode: 'harmonic',
    bpm: 100,
    prog: [0, 5, 6, 4],
    lead: 'brass',
    arp: 'ostinato',
    pad: 'choir',
    perc: 'taiko',
    bass: true
  },
  arene: {
    root: 52,
    mode: 'phrygian',
    bpm: 124,
    prog: [0, 1, 0, 6],
    lead: 'brass',
    arp: 'ostinato',
    pad: 'choir',
    perc: 'battle',
    bass: true
  },
  // Les Tréfonds : un caractère par biome, et la forteresse naine.
  galeries: {
    root: 45,
    mode: 'dorian',
    bpm: 62,
    prog: [0, 6, 3, 4],
    lead: 'oud',
    arp: 'low',
    pad: 'dark',
    perc: 'taiko-slow',
    drone: true
  },
  ombral: {
    root: 50,
    mode: 'aeolian',
    bpm: 58,
    prog: [0, 5, 3, 6],
    lead: 'bell',
    arp: 'harp',
    pad: 'choir',
    perc: null,
    drone: true
  },
  necropole: {
    root: 46,
    mode: 'phrygian',
    bpm: 50,
    prog: [0, 1, 0, 6],
    lead: 'strings',
    arp: null,
    pad: 'dark',
    perc: null,
    drone: true
  },
  fangeval: {
    root: 53,
    mode: 'lydian',
    bpm: 60,
    prog: [0, 1, 4, 0],
    lead: 'bell',
    arp: 'harp',
    pad: 'shimmer',
    perc: 'shaker',
    drone: true
  },
  durgrim: {
    root: 55,
    mode: 'dorian',
    bpm: 96,
    prog: [0, 3, 4, 0],
    lead: 'brass',
    arp: 'guitar',
    pad: 'warm',
    perc: 'frame-light',
    bass: true
  }
};
export const MUSIC_BIOME_THEMES = ['plaines', 'foret', 'marais', 'automne', 'desert', 'enchantee'];
// Sections de la pièce (8 × 4 mesures) : qui joue dans chacune.
export const MUSIC_FORM = [
  { lead: 0, arp: 1, pad: 1, perc: 0, motif: 'A' },
  { lead: 1, arp: 1, pad: 1, perc: 1, motif: 'A' },
  { lead: 1, arp: 1, pad: 1, perc: 1, motif: 'B' },
  { lead: 1, arp: 1, pad: 1, perc: 1, motif: "A'" },
  { lead: 0.5, arp: 0, pad: 1, perc: 0, motif: 'C' },
  { lead: 1, arp: 1, pad: 1, perc: 1, motif: 'A' },
  { lead: 1, arp: 1, pad: 1, perc: 1, motif: 'B' },
  { lead: 0, arp: 1, pad: 1, perc: 0, motif: 'A' }
];
// Rythmes de mélodie par mesure (en croches ; 0 = silence).
export const MUSIC_RHYTHMS = [
  [2, 2, 4],
  [4, 2, 2],
  [3, 1, 2, 2],
  [2, 1, 1, 4],
  [6, 2],
  [2, 2, 2, 2],
  [4, -2, 2],
  [1, 1, 2, 4],
  [8],
  [-4, 2, 2]
];
// Compose la pièce d'un lieu : liste d'événements { beat, kind, … } sur 32 mesures de 4 temps.
export function composeMusic(theme, seedText) {
  const rng = musicSeed(seedText),
    scale = MUSIC_MODES[theme.mode],
    deg = (d, oct = 0) => {
      const n = scale.length,
        k = ((d % n) + n) % n;
      return theme.root + scale[k] + 12 * (oct + Math.floor(d / n));
    },
    chordOf = d => [deg(d), deg(d + 2), deg(d + 4)],
    events = [];
  // Motifs : une mélodie par lettre, sur 4 mesures (un accord par mesure).
  const motifs = {};
  const makeMotif = (start, lively) => {
    const notes = [];
    let pos = start;
    for (let bar = 0; bar < 4; bar++) {
      const rhythm = MUSIC_RHYTHMS[Math.floor(rng() * (lively ? MUSIC_RHYTHMS.length : 6))],
        chord = theme.prog[bar % theme.prog.length];
      let beat = 0;
      for (const r of rhythm) {
        const len = Math.abs(r) / 2;
        if (r > 0) {
          // Temps fort : une note de l'accord ; sinon pas conjoint.
          if (beat === 0 || beat === 2) {
            const tones = [chord, chord + 2, chord + 4, chord + 7];
            pos =
              tones.reduce((best, d) => (Math.abs(d - pos) < Math.abs(best - pos) ? d : best), tones[0]) +
              (rng() < 0.25 ? 7 * (rng() < 0.5 ? -1 : 1) : 0);
          } else pos += rng() < 0.5 ? 1 : -1;
          pos = Math.max(-2, Math.min(11, pos));
          notes.push({ bar, beat, len, d: pos });
        }
        beat += len;
      }
    }
    return notes;
  };
  motifs.A = makeMotif(4, false);
  motifs.B = makeMotif(6, true);
  motifs.C = makeMotif(2, false).filter((_, i) => i % 2 === 0);
  // A' : le thème avec une fin changée.
  motifs["A'"] = motifs.A.filter(n => n.bar < 3).concat(makeMotif(4, true).filter(n => n.bar === 3));
  MUSIC_FORM.forEach((section, s) => {
    const base = s * 16;
    for (let bar = 0; bar < 4; bar++) {
      const chord = theme.prog[bar % theme.prog.length],
        beat = base + bar * 4;
      if (section.pad) events.push({ beat, kind: 'pad', notes: chordOf(chord).map(n => n - 12), len: 4 });
      if (theme.bass && section.arp) events.push({ beat, kind: 'bass', note: deg(chord, -2), len: 3.5 });
      if (theme.drone && bar === 0) events.push({ beat, kind: 'drone', note: deg(0, -2), len: 16 });
      if (section.arp && theme.arp) {
        const tones = chordOf(chord);
        const pattern =
          theme.arp === 'ostinato'
            ? [0, 1, 2, 1, 0, 1, 2, 1]
            : theme.arp === 'low'
              ? [0, -1, 1, -1]
              : [0, 1, 2, 3, 2, 1];
        const step = 4 / pattern.length;
        pattern.forEach((p, i) => {
          if (p < 0) return;
          const n = p === 3 ? tones[0] + 12 : tones[p];
          events.push({
            beat: beat + i * step,
            kind: 'arp',
            note: n + (theme.arp === 'low' ? -12 : 0),
            len: step
          });
        });
      }
      if (section.perc && theme.perc) {
        const P = {
          shaker: [
            [0.5, 'shaker', 0.3],
            [1.5, 'shaker', 0.25],
            [2.5, 'shaker', 0.3],
            [3.5, 'shaker', 0.25]
          ],
          frame: [
            [0, 'frame', 0.7],
            [1.5, 'frame', 0.45],
            [2, 'frame', 0.6],
            [3, 'frame', 0.45],
            [3.5, 'frame', 0.35]
          ],
          'frame-light': [
            [0, 'frame', 0.45],
            [2, 'frame', 0.35],
            [3, 'shaker', 0.2]
          ],
          'taiko-slow':
            bar % 2 === 0
              ? [[0, 'taiko', 0.9]]
              : [
                  [0, 'taiko', 0.6],
                  [2.5, 'tom', 0.4]
                ],
          taiko: [
            [0, 'taiko', 1],
            [1.5, 'tom', 0.5],
            [2, 'taiko', 0.8],
            [3, 'tom', 0.5],
            [3.5, 'tom', 0.45]
          ],
          battle: [
            [0, 'taiko', 1],
            [0.5, 'tom', 0.4],
            [1, 'taiko', 0.7],
            [2, 'taiko', 1],
            [2.5, 'tom', 0.4],
            [3, 'taiko', 0.7],
            [3.5, 'tom', 0.6]
          ]
        }[theme.perc];
        for (const [b, kind, v] of P) events.push({ beat: beat + b, kind: 'drum', drum: kind, vol: v });
      }
    }
    if (section.lead)
      for (const n of motifs[section.motif]) {
        if (section.lead < 1 && rng() < 0.4) continue;
        events.push({ beat: base + n.bar * 4 + n.beat, kind: 'lead', note: deg(n.d), len: n.len });
      }
  });
  return events.sort((a, b) => a.beat - b.beat);
}
