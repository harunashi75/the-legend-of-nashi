// @ts-check
// Arène des Épreuves : colisée de sable chaud, sans monstres ni boss d'exploration (scripts/arena.js).
// Même forme que les fiches des donjons, sans règles ni créatures.
// Module partagé pur (shared/data) : aucune dépendance au navigateur, au réseau ni aux autres couches.

export default {
  key: 'arene',
  layout: {
    shape: 'hall',
    accent: { width: 0 },
    hazard: { style: 'chasm', pools: 0 },
    wallProps: ['banner', 'torch'],
    floorProps: [],
    centerpiece: null,
    gate: 'portcullis'
  },
  palette: {
    floor: { style: 'dirt', a: '#c2a272', b: '#a5865a', c: '#dcc095' },
    accent: { style: 'gravel', a: '#9a7c52', b: '#7a6040', c: '#b8986a' },
    wall: { style: 'brick', top: '#24180e', face: '#9a7a54', dark: '#5a4430', light: '#c8a676' },
    hazard: { a: '#050506', b: '#101014', c: '#26262c' },
    light: { dark: 0.16, tint: '34,18,6' },
    flame: ['#e5522e', '#f9a640', '#fff1b5'],
    rune: '#ffc65a',
    banner: ['#7a1424', '#ffd36d'],
    pillar: ['#d4bc94', '#8e7658', '#f2e4c4'],
    particles: 'embers'
  }
};
