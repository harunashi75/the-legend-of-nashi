// Portails de l'île en pixel art « cosy », dans la même facture que les bâtiments (building-art.js) : grille de gros
// pixels (1 pixel d'art = 2 pixels d'écran), aplats de 3 à 5 tons, contour sombre, agrandissement sans flou. Chaque
// donjon, raid et l'Arène garde son thème (terrier, mine, temple, château, forge, fosse, bastion, anneau, sanctuaire,
// porte d'étoiles, colisée) mais se pose dans son biome : socle de pierre ancré, ombre de contact tramée, mousse,
// feuilles, sable ou cristaux selon la région, base assombrie près du sol. L'ouverture est un tourbillon animé en
// pixels (images précalculées), les flammes, fumées, engrenages et anneaux flottants restent vivants.
(() => {
  'use strict';
  const U = 2,
    AW = 180,
    AH = 132,
    CX = 90,
    BASE = 112;
  // Thème de chaque portail, par clé de donjon (fiches de shared/data/dungeons/), île et Tréfonds.
  const THEME = {
    terriers: { rune: '#a3c7ff', flame: ['#e5522e', '#f9a640', '#fff1b5'], banner: ['#6b4a2e', '#c9a46e'] },
    mine: { rune: '#67d8ee', flame: ['#e5822e', '#f9c640', '#fff6c5'], banner: ['#3d4652', '#9fe8ff'] },
    eclipse: { rune: '#ff9955', flame: ['#7a3ad8', '#b47aff', '#f0e0ff'], banner: ['#2a1e40', '#e0b04a'] },
    penitents: { rune: '#b79cff', flame: ['#e5522e', '#f9a640', '#fff1b5'], banner: ['#5a161a', '#d6ccff'] },
    forge: { rune: '#ff7a2a', flame: ['#e5522e', '#f9a640', '#fff1b5'], banner: ['#3a1408', '#ff8a3c'] },
    fosse: { rune: '#e88aff', flame: ['#8a2ad8', '#c47aff', '#f4d0ff'], banner: ['#2a1420', '#e88aff'] },
    bastion: { rune: '#ffd36d', flame: ['#c4221a', '#f46a32', '#ffd3a0'], banner: ['#7a0e18', '#d4a44a'] },
    continuum: { rune: '#ff7fa7', flame: ['#3a8ad8', '#7ad0ff', '#e0f8ff'], banner: ['#262a40', '#7de0ff'] },
    seraphin: { rune: '#c4a0ff', flame: ['#f0b030', '#ffe070', '#ffffff'], banner: ['#f4f0e4', '#d4aa3a'] },
    celestia: { rune: '#fff0a8', flame: ['#d4aa3a', '#fff0a8', '#ffffff'], banner: ['#1a1c40', '#fff0a8'] },
    arena: { rune: '#ffc65a', flame: ['#e5522e', '#f9a640', '#fff1b5'], banner: ['#7a1424', '#ffd36d'] },
    // Donjons des Tréfonds (underground.js).
    durgrim: { rune: '#ffb060', flame: ['#e5822e', '#f9c640', '#fff6c5'], banner: ['#4a3420', '#e0a060'] },
    ombral: { rune: '#7ad0ff', flame: ['#3a8ad8', '#7ac8ff', '#e0f4ff'], banner: ['#1e3a5a', '#c9a24a'] },
    mille_tombes: {
      rune: '#7affb0',
      flame: ['#3ad87a', '#8affb0', '#e0fff0'],
      banner: ['#1a2a22', '#a8f0c0']
    },
    fongique: { rune: '#ff8ae8', flame: ['#d84ac0', '#ff8ae8', '#ffe0f8'], banner: ['#3a1a34', '#e870c0'] }
  };
  // Rampes locales : [reflet, clair, base, ombre, profond].
  const C = {
    earth: ['#b48a5e', '#957049', '#765639', '#573e28', '#3b2a1b'],
    grey: ['#c8c6c0', '#a4a29c', '#82807c', '#615f5c', '#43423f'],
    mossy: ['#b6bcae', '#94998c', '#73786c', '#555950', '#3a3d36'],
    violet: ['#c8bce0', '#a698c4', '#8476a4', '#625682', '#433a5e'],
    basalt: ['#8a6a5c', '#6c4f44', '#523a32', '#3a2722', '#241714'],
    redbrick: ['#e8a07c', '#c8765a', '#a05440', '#743828', '#4c2218'],
    sandstone: ['#fbe6bc', '#ecd09a', '#d4b078', '#b08a56', '#7e5e38'],
    marble: ['#ffffff', '#f2eee6', '#dcd6ca', '#b8b0a2', '#8a8274'],
    night: ['#7a82c8', '#5a62a8', '#3e4686', '#2a3064', '#1a1e44'],
    gold: ['#fff4b0', '#f8d468', '#d8a838', '#a87a22', '#6e4c12'],
    iron: ['#9aa0aa', '#767c88', '#565c68', '#3c4048', '#24272c'],
    wood: ['#d8a066', '#b47c46', '#8e5a30', '#663c1e', '#42260f'],
    slate: ['#9aa8c8', '#76849e', '#56647e', '#3c4860', '#262e40'],
    roofRed: ['#f4a070', '#e0704a', '#b84a32', '#86321f', '#561e14'],
    void: '#0e0a14'
  };
  // Habillage de chaque région (indice des ZONES) : herbe, détails au pied et sur les corniches.
  const DRESS = [
    {
      grass: ['#b4e27a', '#7cbc52', '#4e8c38', '#2f6426'],
      bits: ['#fff4d0', '#f6c5e2', '#f8d96a', '#d9c7ff'],
      moss: true
    },
    {
      grass: ['#8cc45c', '#5a9a3e', '#3a7430', '#24501e'],
      bits: ['#e85a48', '#fff1d8'],
      moss: true,
      shrooms: true
    },
    {
      grass: ['#9cbc78', '#6e9454', '#4a6c3c', '#30482a'],
      bits: ['#8a5a32', '#c8a070'],
      moss: true,
      reeds: true,
      stain: '#2c4a2a'
    },
    {
      grass: ['#b8b45a', '#8c8a3e', '#62622c', '#42421e'],
      bits: ['#f6c25a', '#ea8a36', '#c85a26', '#d9542f'],
      leaves: true
    },
    { grass: ['#fbe2b4', '#ecc88e', '#d2a86c', '#a8804c'], bits: ['#c8a06a', '#8a6a44'], sand: true },
    {
      grass: ['#8ae0c8', '#4eb4a0', '#2e8a80', '#1e5a5e'],
      bits: ['#c8fff4', '#b48aff', '#7ae8d8'],
      crystals: true,
      moss: true
    },
    // Tréfonds (6 à 9, comme le biome des donjons) : Galeries d'Argile, Khaz-Ombral, Nécropole, Fangeval.
    { grass: ['#b09a70', '#86704e', '#5e4c36', '#3a2e20'], bits: ['#8a7a6a', '#c8b8a0'], bones: true },
    {
      grass: ['#8ab8c8', '#5a8a9a', '#3a6070', '#22404a'],
      bits: ['#9fe8ff', '#e0f8ff'],
      crystals: true,
      puddles: true
    },
    {
      grass: ['#8a9a7a', '#62705a', '#44503e', '#2c3428'],
      bits: ['#e8e0c8', '#c8c0a8'],
      moss: true,
      bones: true
    },
    {
      grass: ['#9ad070', '#62a048', '#3e7030', '#24481e'],
      bits: ['#ff9ae8', '#a8fff0', '#fff0a0'],
      moss: true,
      shrooms: true,
      glowshrooms: true
    }
  ];
  const { bayer, brush, hashGrid: hash, makeCanvas, mix, outline, rgb } = CANAAN_PIXEL_KIT;

  // ---------------------------------------------------------------- Formes
  // Volume arrondi éclairé en haut à gauche (butte, rocher) ; cap : pelouse ou mousse sur le dessus.
  function blob(k, cx, cy, rx, ry, R, seed, o = {}) {
    const yMax = o.half ? 0 : Math.round(ry * (o.cut ?? 0.55)),
      L = [-0.45, -0.7, 0.55];
    for (let y = -ry; y <= yMax; y++)
      for (let x = -rx; x <= rx; x++) {
        const nx = x / rx,
          ny = y / ry,
          j = (hash(seed + (x >> 2) * 7, (y >> 2) + seed * 3) - 0.5) * (o.rough ?? 0.14),
          d = nx * nx + ny * ny;
        if (d > 1 + j) continue;
        const nz = Math.sqrt(Math.max(0, 1 - d)),
          f = o.facet ? (hash((x + rx) >> 3, (y + ry) >> 3) - 0.5) * 0.35 : 0,
          lit = L[0] * nx + L[1] * ny + L[2] * nz + f + (bayer(x, y) - 0.5) * 0.14;
        let ramp = R;
        if (o.cap) {
          const top = -ry * Math.sqrt(Math.max(0, 1 - nx * nx));
          if (y - top < (o.capD ?? 6) + Math.floor(hash(x + seed, 5) * 3)) ramp = o.cap;
        }
        const t = lit > 0.78 ? 0 : lit > 0.48 ? 1 : lit > 0.16 ? 2 : 3;
        k.px(cx + x, cy + y, ramp[t]);
      }
  }
  function rock(k, cx, cy, rx, ry, R, seed, cap) {
    blob(k, cx, cy, rx, ry, R.slice(1), seed, { facet: true, cut: 0.45, cap, capD: 3 });
  }
  // Maçonnerie : blocs décalés d'une demi-pierre, joints sombres, reflet en haut de chaque bloc.
  function masonry(k, x, y, w, h, R, bw = 8, bh = 5, seed = 1) {
    k.rect(x, y, w, h, R[3]);
    for (let ry = 0, row = 0; ry < h; ry += bh, row++) {
      const off = row % 2 ? Math.floor(bw / 2) : 0;
      for (let rx = -off; rx < w; rx += bw) {
        const x0 = Math.max(0, rx),
          x1 = Math.min(w, rx + bw - 1),
          y1 = Math.min(h, ry + bh - 1);
        if (x1 - x0 < 1 || y1 - ry < 1) continue;
        const v = hash(seed + row * 31, rx + 97),
          col = v < 0.2 ? R[0] : v > 0.82 ? R[2] : R[1];
        k.rect(x + x0, y + ry, x1 - x0, y1 - ry, col);
        k.rect(x + x0, y + ry, x1 - x0, 1, mix(col, '#ffffff', 0.2));
        if (v > 0.93 && x1 - x0 > 3) k.px(x + x0 + 2, y + ry + 2, R[3]);
      }
    }
    k.rect(x, y, 1, h, mix(R[0], '#ffffff', 0.15));
    k.rect(x + w - 1, y, 1, h, R[3]);
  }
  // Colonne : fût cannelé à modelé cylindrique, chapiteau et base.
  function pillar(k, x, y, w, h, R) {
    for (let i = 0; i < w; i++) {
      const t = i / (w - 1),
        col = t < 0.2 ? R[0] : t < 0.55 ? R[1] : t < 0.85 ? R[2] : R[3];
      k.rect(x + i, y, 1, h, col);
    }
    for (let i = 2; i < w - 1; i += 3) k.rect(x + i, y + 3, 1, h - 6, mix(R[2], R[1], 0.3));
    k.rect(x - 2, y - 3, w + 4, 3, R[1]);
    k.rect(x - 2, y - 3, w + 4, 1, R[0]);
    k.rect(x - 1, y, w + 2, 1, R[2]);
    k.rect(x - 2, y + h - 3, w + 4, 3, R[1]);
    k.rect(x - 2, y + h - 1, w + 4, 1, R[3]);
  }
  // Ouverture en plein cintre (bas, demi-largeur, hauteur totale).
  function archPts(cx, yb, hw, h) {
    const pts = [[cx - hw, yb]],
      yc = yb - h + hw;
    for (let a = 0; a <= 16; a++)
      pts.push([cx - Math.cos((a / 16) * Math.PI) * hw, yc - Math.sin((a / 16) * Math.PI) * hw]);
    pts.push([cx + hw, yb]);
    return pts;
  }
  // Arc de claveaux autour d'une ouverture, clé de voûte claire.
  function archFrame(k, cx, yb, hw, h, R, t = 4, key = null) {
    k.poly(archPts(cx, yb, hw + t, h + t), R[1]);
    const yc = yb - h + hw;
    for (let a = 1; a < 9; a++) {
      const ang = (a / 9) * Math.PI;
      k.line(
        cx - Math.cos(ang) * hw,
        yc - Math.sin(ang) * hw,
        cx - Math.cos(ang) * (hw + t),
        yc - Math.sin(ang) * (hw + t),
        R[3]
      );
    }
    for (let yy = yc; yy < yb; yy += 5) {
      k.rect(cx - hw - t, yy, t, 1, R[3]);
      k.rect(cx + hw, yy, t, 1, R[3]);
    }
    k.rect(cx - hw - t, yc, 1, yb - yc, R[0]);
    if (key) {
      k.rect(cx - 3, yb - h - t - 1, 6, t + 3, key[1]);
      k.rect(cx - 3, yb - h - t - 1, 6, 1, key[0]);
      k.rect(cx + 2, yb - h - t, 1, t + 2, key[3]);
    }
  }
  function voidArch(k, cx, yb, hw, h) {
    k.poly(archPts(cx, yb, hw, h), C.void);
    k.poly(archPts(cx, yb, hw - 2, h - 2), '#06040a');
  }
  // Marches de pierre (largeur du bas, nombre de marches) ; renvoie le dessus.
  function steps(k, cx, yb, w, n, R) {
    let y = yb;
    for (let i = 0; i < n; i++) {
      const ww = w - i * 8;
      y -= 3;
      k.rect(cx - ww / 2, y, ww, 3, R[2]);
      k.rect(cx - ww / 2, y, ww, 1, R[0]);
      k.rect(cx - ww / 2, y + 2, ww, 1, R[3]);
      for (let s = 6; s < ww - 2; s += 9 + (i % 2)) k.px(cx - ww / 2 + s, y + 1, R[3]);
    }
    return y;
  }
  // Créneaux au sommet d'un mur.
  function merlons(k, x, y, w, R, mw = 4, gap = 3) {
    for (let mx = x; mx + mw <= x + w; mx += mw + gap) {
      k.rect(mx, y - 4, mw, 4, R[1]);
      k.rect(mx, y - 4, mw, 1, R[0]);
      k.rect(mx + mw - 1, y - 3, 1, 3, R[3]);
    }
  }
  function banner(k, x, y, w, h, cols) {
    k.rect(x - 1, y - 1, w + 2, 2, C.wood[3]);
    k.rect(x, y + 1, w, h, cols[0]);
    k.rect(x, y + 1, 1, h, mix(cols[0], '#ffffff', 0.2));
    k.rect(x + w - 1, y + 1, 1, h, mix(cols[0], '#000000', 0.3));
    for (let i = 0; i < w; i++) {
      const d = Math.abs(i - (w - 1) / 2);
      k.rect(x + i, y + 1 + h, 1, Math.max(0, 3 - d), cols[0]);
    }
    k.rect(x + Math.floor(w / 2) - 1, y + 4, 2, h - 6, cols[1]);
    k.rect(x + Math.floor(w / 2) - 2, y + 6, 4, 2, cols[1]);
  }
  // Cône de toit en ardoises (tour).
  function cone(k, cx, yb, hw, h, R) {
    for (let y = 0; y < h; y++) {
      const w = Math.round(hw * (y / h)),
        row = Math.floor((h - y) / 3);
      for (let x = -w; x <= w; x++) {
        const t = (x + w) / (2 * w + 1),
          base = t < 0.3 ? 1 : t < 0.65 ? 2 : 3,
          edge = (y + 1) % 3 === 0 ? 1 : 0,
          scal = (x + w + (row % 2) * 2) % 4 === 0 ? 1 : 0;
        k.px(cx + x, yb - h + y, R[Math.min(4, base + edge + scal)]);
      }
    }
    k.rect(cx - hw - 1, yb, hw * 2 + 3, 2, R[3]);
    k.rect(cx, yb - h - 4, 1, 4, C.iron[2]);
  }
  function crystal(k, x, y, h, R, lean = 0) {
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.round(2.5 * Math.min(1, (h - i) / 4))),
        xx = x + Math.round((lean * i) / h);
      k.rect(xx - w + 1, y - i, w, 1, R[1]);
      k.rect(xx + 1, y - i, w, 1, R[2]);
      if (i > 1 && i < h - 2) k.px(xx, y - i, R[0]);
    }
  }
  function tuft(k, x, y, G) {
    k.rect(x - 2, y - 1, 5, 1, G[2]);
    k.px(x - 2, y - 2, G[1]);
    k.px(x - 1, y - 2, G[1]);
    k.px(x + 1, y - 2, G[1]);
    k.px(x + 2, y - 3, G[0]);
    k.px(x, y - 3, G[1]);
    k.px(x - 1, y - 4, G[0]);
  }
  function torchPost(k, e, x, yb, h, cols, seed) {
    k.rect(x - 1, yb - h, 3, h, C.wood[2]);
    k.rect(x - 1, yb - h, 1, h, C.wood[1]);
    k.rect(x - 3, yb - h - 2, 7, 3, C.iron[2]);
    k.rect(x - 3, yb - h - 2, 7, 1, C.iron[1]);
    e.flame(x, yb - h - 2, 1, cols, seed);
  }
  function brazier(k, e, x, yb, cols, seed, big = 1) {
    k.rect(x - 1, yb - 12 * big, 3, 12 * big, C.iron[2]);
    k.rect(x - 4, yb - 2, 9, 2, C.iron[3]);
    k.rect(x - 6, yb - 12 * big - 4, 13, 4, C.iron[2]);
    k.rect(x - 6, yb - 12 * big - 4, 13, 1, C.iron[0]);
    k.rect(x - 5, yb - 12 * big, 11, 1, C.iron[3]);
    e.flame(x, yb - 12 * big - 4, 1.2 * big, cols, seed);
  }

  // ---------------------------------------------------------------- Modèles (centre CX, sol BASE)
  const MODELS = {
    terriers(k, e, th) {
      const b = BASE,
        G = e.dress.grass;
      blob(k, CX, b, 58, 44, C.earth, 11, { half: true, cap: G, capD: 9 });
      voidArch(k, CX, b, 17, 40);
      e.portal(CX, b - 19, 14, 18);
      // Gros blocs de roche en arc autour de la bouche.
      rock(k, CX - 25, b - 5, 11, 9, C.mossy, 3);
      rock(k, CX + 26, b - 5, 12, 9, C.mossy, 4);
      rock(k, CX - 23, b - 25, 8, 8, C.mossy, 5, G);
      rock(k, CX + 23, b - 26, 9, 8, C.mossy, 6, G);
      rock(k, CX, b - 42, 16, 7, C.grey, 7, G);
      // Racines qui pendent du linteau.
      for (const [rx, len] of [
        [-8, 7],
        [-3, 4],
        [4, 8],
        [9, 5]
      ]) {
        k.rect(CX + rx, b - 37, 1, len, C.wood[3]);
        k.px(CX + rx + 1, b - 37 + len - 1, C.wood[3]);
      }
      // Petite porte de planches entrouverte à gauche.
      k.rect(CX - 16, b - 18, 3, 18, C.wood[2]);
      for (let y = b - 16; y < b; y += 4) k.rect(CX - 16, y, 3, 1, C.wood[3]);
      torchPost(k, e, CX - 40, b, 22, th.flame, 1);
      torchPost(k, e, CX + 40, b, 22, th.flame, 2);
      e.light(CX - 40, b - 30, 120, th.flame[1]);
      e.light(CX + 40, b - 30, 120, th.flame[1]);
      // Panneau planté.
      k.rect(CX + 49, b - 14, 2, 14, C.wood[3]);
      k.rect(CX + 44, b - 18, 12, 6, C.wood[1]);
      k.rect(CX + 44, b - 13, 12, 1, C.wood[3]);
      k.rect(CX + 46, b - 16, 8, 1, C.wood[3]);
      e.foot(CX - 56, CX + 56);
      return b - 46;
    },
    mine(k, e, th) {
      const b = BASE,
        moss = e.dress.moss ? e.dress.grass : null;
      rock(k, CX - 34, b - 16, 28, 26, C.grey, 21, moss);
      rock(k, CX + 34, b - 18, 30, 30, C.grey, 22, moss);
      rock(k, CX, b - 38, 34, 22, C.grey, 23, moss);
      rock(k, CX - 50, b - 2, 12, 8, C.grey, 24);
      rock(k, CX + 54, b - 2, 10, 7, C.grey, 25);
      k.rect(CX - 16, b - 44, 32, 44, C.void);
      k.rect(CX - 14, b - 42, 28, 42, '#06040a');
      e.portal(CX, b - 21, 12, 19);
      // Boisage : deux montants, un linteau et des jambes de force.
      for (const s of [-1, 1]) {
        const x = CX + s * 18 - (s < 0 ? 3 : 0);
        k.rect(x, b - 48, 4, 48, C.wood[2]);
        k.rect(x, b - 48, 1, 48, C.wood[1]);
        k.rect(x + 3, b - 48, 1, 48, C.wood[3]);
        k.line(CX + s * 15, b - 42, CX + s * 9, b - 46, C.wood[3], 2);
      }
      k.rect(CX - 25, b - 54, 50, 6, C.wood[2]);
      k.rect(CX - 25, b - 54, 50, 1, C.wood[0]);
      k.rect(CX - 25, b - 49, 50, 1, C.wood[4]);
      for (const s of [-1, 1]) {
        k.rect(CX + s * 25 - (s > 0 ? 3 : 0), b - 54, 3, 6, C.wood[1]);
        k.px(CX + s * 24 - (s > 0 ? 1 : 0), b - 52, C.wood[3]);
      }
      // Lanterne suspendue.
      k.rect(CX - 24, b - 48, 1, 6, C.iron[3]);
      k.rect(CX - 27, b - 42, 7, 8, C.iron[2]);
      k.rect(CX - 26, b - 41, 5, 6, '#ffd36d');
      k.rect(CX - 25, b - 40, 3, 3, '#fff6c5');
      e.light(CX - 24, b - 38, 110, '#ffcf6a');
      e.glint(CX - 24, b - 38, 6, '#ffcf6a');
      // Wagonnet de minerai bleu.
      const wx = CX + 40;
      k.rect(wx - 11, b - 13, 22, 9, C.iron[2]);
      k.rect(wx - 11, b - 13, 22, 2, C.iron[0]);
      k.rect(wx - 11, b - 6, 22, 1, C.iron[3]);
      for (const ox of [-8, 6]) {
        k.disc(wx + ox, b - 3, 2, C.iron[3]);
        k.px(wx + ox, b - 3, C.iron[1]);
      }
      for (const [ox, h] of [
        [-7, 4],
        [-3, 6],
        [1, 5],
        [5, 4]
      ])
        crystal(k, wx + ox, b - 14, h, ['#e0fbff', '#7de0ff', '#3a9ac8']);
      e.glint(wx - 1, b - 17, 10, '#7de0ff');
      e.light(wx, b - 16, 70, '#7de0ff');
      // Pioche posée contre la roche.
      k.line(CX - 42, b - 1, CX - 34, b - 15, C.wood[2], 1);
      k.line(CX - 38, b - 17, CX - 31, b - 13, C.iron[1], 1);
      e.rails = true;
      e.foot(CX - 62, CX + 64);
      return b - 62;
    },
    eclipse(k, e, th) {
      const b = BASE,
        R = C.violet,
        top = steps(k, CX, b, 96, 3, R);
      masonry(k, CX - 18, top - 52, 36, 52, R, 7, 5, 31);
      voidArch(k, CX, top, 13, 44);
      e.portal(CX, top - 21, 11, 19);
      for (const px of [-40, -28, 20, 32]) {
        pillar(k, CX + px, top - 52, 8, 52, R);
        e.wall(CX + px, top - 48, top - 6);
      }
      // Entablement, frise et fronton.
      const et = top - 62;
      k.rect(CX - 46, et, 92, 9, R[2]);
      k.rect(CX - 46, et, 92, 1, R[0]);
      k.rect(CX - 46, et + 8, 92, 1, R[4]);
      for (let x = CX - 42; x < CX + 42; x += 6) k.rect(x, et + 3, 3, 3, R[3]);
      k.poly(
        [
          [CX - 48, et],
          [CX, et - 24],
          [CX + 48, et]
        ],
        R[1]
      );
      k.poly(
        [
          [CX - 40, et - 2],
          [CX, et - 19],
          [CX + 40, et - 2]
        ],
        R[3]
      );
      k.line(CX - 48, et, CX, et - 24, R[0]);
      k.disc(CX, et - 9, 6, '#ffcc55');
      k.disc(CX + 3, et - 10, 5, '#160c22');
      e.glint(CX, et - 9, 9, '#ffcc55');
      e.ledge(CX - 46, CX + 46, et);
      brazier(k, e, CX - 56, b - 2, th.flame, 3);
      brazier(k, e, CX + 56, b - 2, th.flame, 4);
      e.light(CX - 56, b - 22, 120, th.flame[1]);
      e.light(CX + 56, b - 22, 120, th.flame[1]);
      e.foot(CX - 60, CX + 60);
      return et - 26;
    },
    penitents(k, e, th) {
      return keep(k, e, th, C.mossy, C.slate, false);
    },
    bastion(k, e, th) {
      return keep(k, e, th, C.redbrick, null, true);
    },
    forge(k, e, th) {
      const b = BASE,
        R = C.basalt;
      blob(k, CX, b, 62, 58, R, 41, { half: true, facet: true, rough: 0.3 });
      // Coulées de lave dans les fissures.
      for (const s of [-1, 1]) {
        let x = CX + s * 30,
          y = b - 44;
        for (let i = 0; i < 9; i++) {
          k.rect(x, y, 2, 5, '#ff7a2a');
          k.px(x, y + 1, '#ffd36d');
          x += s * (i % 2 ? 2 : 1);
          y += 5;
        }
        e.lava(CX + s * 34, b - 40, 40, s);
      }
      // Cheminée de briques et sa fumée.
      masonry(k, CX + 20, b - 92, 14, 40, C.redbrick, 6, 4, 43);
      k.rect(CX + 18, b - 94, 18, 4, C.iron[2]);
      k.rect(CX + 18, b - 94, 18, 1, C.iron[0]);
      e.smoke(CX + 27, b - 96);
      // Grande porte de fer rivetée.
      k.rect(CX - 22, b - 50, 44, 50, C.iron[2]);
      k.rect(CX - 22, b - 50, 44, 2, C.iron[0]);
      k.rect(CX - 22, b - 50, 2, 50, C.iron[1]);
      k.rect(CX + 20, b - 50, 2, 50, C.iron[3]);
      for (let y = b - 44; y < b; y += 8)
        for (const s of [-1, 1]) k.px(CX + s * 19 - (s > 0 ? 1 : 0), y, C.iron[0]);
      k.rect(CX - 17, b - 44, 34, 44, '#1a0806');
      k.rect(CX - 15, b - 42, 30, 42, '#0c0404');
      e.portal(CX, b - 22, 13, 20, '#ff6a1f');
      // Enclume emblème sur le linteau.
      k.rect(CX - 6, b - 58, 12, 3, C.iron[1]);
      k.rect(CX - 3, b - 55, 6, 3, C.iron[2]);
      k.rect(CX - 5, b - 52, 10, 2, C.iron[3]);
      // Enclume et billot à droite, seau de charbon à gauche.
      const ax = CX + 48;
      k.rect(ax - 5, b - 8, 10, 8, C.wood[2]);
      k.rect(ax - 5, b - 8, 10, 1, C.wood[0]);
      k.rect(ax - 7, b - 13, 14, 3, C.iron[1]);
      k.rect(ax - 9, b - 13, 3, 2, C.iron[1]);
      k.rect(ax - 3, b - 10, 6, 2, C.iron[3]);
      const cx2 = CX - 46;
      k.rect(cx2 - 5, b - 7, 10, 7, C.iron[2]);
      k.rect(cx2 - 5, b - 7, 10, 1, C.iron[0]);
      for (let i = 0; i < 4; i++) k.rect(cx2 - 4 + i * 2, b - 9 + (i % 2), 2, 2, '#2a2420');
      e.glint(cx2, b - 8, 5, '#ff7a2a');
      for (const s of [-1, 1]) e.light(CX + s * 34, b - 20, 130, '#ff6a1f');
      e.ledge(CX - 40, CX + 14, b - 54);
      e.foot(CX - 62, CX + 62);
      return b - 100;
    },
    fosse(k, e, th, f) {
      const b = BASE,
        R = C.grey,
        cy = b - 12;
      // Potence de fer et chaînes.
      for (const s of [-1, 1]) {
        k.rect(CX + s * 46 - 2, b - 66, 4, 58, C.iron[2]);
        k.rect(CX + s * 46 - 2, b - 66, 1, 58, C.iron[0]);
      }
      k.rect(CX - 52, b - 70, 104, 5, C.iron[2]);
      k.rect(CX - 52, b - 70, 104, 1, C.iron[0]);
      k.rect(CX - 52, b - 66, 104, 1, C.iron[4]);
      // Menhirs du fond.
      for (const [ox, h] of [
        [-30, 22],
        [30, 20],
        [0, 16]
      ]) {
        masonry(k, CX + ox - 5, cy - 8 - h, 10, h, C.mossy, 10, 6, 50 + ox);
        k.rect(CX + ox - 4, cy - 9 - h, 8, 1, C.mossy[1]);
      }
      // Margelle arrière.
      ring(k, CX, cy, 42, 16, 33, 11, R, -1);
      k.g.fillStyle = C.void;
      fillEllipse(k, CX, cy, 33, 11);
      e.portal(CX, cy, 31, 10);
      // Premier plan : margelle avant et chaînes qui plongent.
      ring(f, CX, cy, 42, 16, 33, 11, R, 1);
      for (const ox of [-16, 16])
        for (let y = b - 64; y < cy + 2; y += 3)
          f.rect(CX + ox + ((y >> 2) % 2), y, 2, 2, C.iron[(y >> 1) % 2 ? 1 : 2]);
      for (const s of [-1, 1]) {
        torchPost(f, e, CX + s * 58, b + 6, 20, th.flame, s + 5);
        e.light(CX + s * 58, b - 18, 110, th.flame[1]);
      }
      e.beam(CX, cy - 4, 40, 70, th.rune);
      e.ledge(CX - 52, CX + 52, b - 70);
      e.foot(CX - 64, CX + 64);
      return b - 74;
    },
    continuum(k, e, th, f) {
      const b = BASE,
        R = C.sandstone;
      // Dais circulaire à demi ensablé.
      k.g.fillStyle = R[3];
      fillEllipse(k, CX, b - 4, 50, 10);
      k.g.fillStyle = R[2];
      fillEllipse(k, CX, b - 8, 48, 9);
      k.g.fillStyle = R[1];
      fillEllipse(k, CX, b - 10, 44, 7);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        k.rect(CX + Math.cos(a) * 36, b - 10 + Math.sin(a) * 5, 2, 1, i % 2 ? C.gold[1] : '#7de0ff');
      }
      // Socles des engrenages.
      for (const s of [-1, 1]) {
        masonry(k, CX + s * 58 - 6, b - 28, 12, 26, R, 6, 5, 60 + s);
        k.rect(CX + s * 58 - 8, b - 30, 16, 3, R[1]);
        k.rect(CX + s * 58 - 8, b - 30, 16, 1, R[0]);
        e.gear(CX + s * 58, b - 42, s);
      }
      e.ring(CX, b - 50, 27, 33, C.gold, '#7de0ff');
      e.portal(CX, b - 50, 20, 26);
      e.foot(CX - 64, CX + 64);
      return b - 92;
    },
    seraphin(k, e, th) {
      const b = BASE,
        R = C.marble,
        top = steps(k, CX, b, 92, 3, R);
      masonry(k, CX - 22, top - 56, 44, 56, R, 8, 5, 71);
      archFrame(k, CX, top, 16, 50, R, 5, C.gold);
      voidArch(k, CX, top, 16, 50);
      e.portal(CX, top - 24, 13, 22);
      for (const s of [-1, 1]) pillar(k, CX + s * 30 - 5, top - 60, 10, 60, R);
      // Ailes sculptées au-dessus de l'arc.
      for (const s of [-1, 1])
        for (let r = 2; r >= 0; r--)
          for (let j = 0; j < 6 - r; j++) {
            const x = CX + s * (9 + j * 5),
              y = top - 74 - j * 3 + r * 6 + Math.round(j * j * 0.25),
              h = 10 - r * 2 + (j === 5 - r ? 3 : 0);
            k.poly(
              [
                [x - 2, y],
                [x + 3, y],
                [x + 3, y + h - 2],
                [x + 0.5, y + h],
                [x - 2, y + h - 2]
              ],
              R[r]
            );
            k.rect(x + (s > 0 ? 2 : -2), y + 1, 1, h - 3, R[Math.min(4, r + 2)]);
            k.px(x, y + 1, '#ffffff');
          }
      k.disc(CX, top - 68, 6, C.gold[2]);
      k.disc(CX, top - 68, 3, '#fff8e0');
      e.glint(CX, top - 68, 10, '#ffe070');
      for (const s of [-1, 1]) {
        brazier(k, e, CX + s * 54, b - 2, th.flame, s + 7);
        e.light(CX + s * 54, b - 22, 120, th.flame[1]);
      }
      e.motes(CX, top - 40, 30, '#ffffff');
      e.ledge(CX - 32, CX + 32, top - 63);
      e.foot(CX - 58, CX + 58);
      return top - 78;
    },
    celestia(k, e, th) {
      const b = BASE,
        R = C.night,
        top = steps(k, CX, b, 92, 2, R),
        cy = top - 40;
      for (const s of [-1, 1])
        k.poly(
          [
            [CX + s * 20, top],
            [CX + s * 40, top],
            [CX + s * 34, top - 14],
            [CX + s * 26, top - 14]
          ],
          R[2]
        );
      ring(k, CX, cy, 38, 42, 29, 33, R, 0);
      k.g.fillStyle = C.void;
      fillEllipse(k, CX, cy, 29, 33);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i / 9) * Math.PI * 2,
          x = CX + Math.cos(a) * 34,
          y = cy + Math.sin(a) * 38;
        k.rect(x - 2, y - 2, 4, 4, C.gold[3]);
        k.rect(x - 1, y - 1, 2, 2, '#fff0a8');
        e.glint(x, y, 5, '#fff0a8');
      }
      e.portal(CX, cy, 27, 31);
      k.poly(
        [
          [CX - 8, cy - 44],
          [CX, cy - 52],
          [CX + 8, cy - 44],
          [CX, cy - 47]
        ],
        C.gold[1]
      );
      for (const s of [-1, 1]) {
        const px = CX + s * 56;
        crystal(k, px - 3, b - 1, 9, ['#fff8d0', '#fff0a8', '#c8a838'], -2);
        crystal(k, px + 2, b - 1, 12, ['#fff8d0', '#fff0a8', '#c8a838'], 1);
        e.beam(px, b - 6, 10, 96, '#fff0a8');
        e.light(px, b - 40, 140, '#fff0a8');
      }
      e.ledge(CX - 40, CX + 40, top);
      e.foot(CX - 62, CX + 62);
      return cy - 56;
    },
    // Mine Effondrée de Durgrim : porte naine taillée dans la paroi, boisage effondré, éboulis et wagonnet renversé.
    durgrim(k, e, th) {
      const b = BASE,
        S = C.grey;
      blob(k, CX, b, 72, 60, C.earth, 51, { half: true, facet: true, rough: 0.28 });
      masonry(k, CX - 24, b - 50, 48, 50, S, 8, 5, 52);
      // Linteau à degrés et plaque de runes dorées.
      k.rect(CX - 30, b - 56, 60, 6, S[1]);
      k.rect(CX - 30, b - 56, 60, 1, S[0]);
      k.rect(CX - 30, b - 51, 60, 1, S[3]);
      k.rect(CX - 22, b - 62, 44, 6, S[2]);
      k.rect(CX - 22, b - 62, 44, 1, S[0]);
      k.rect(CX - 9, b - 61, 18, 4, C.gold[2]);
      k.rect(CX - 9, b - 61, 18, 1, C.gold[0]);
      for (const rx of [-6, -2, 2, 6]) k.rect(CX + rx, b - 60, 1, 2, C.gold[4]);
      e.glint(CX, b - 59, 9, '#ffd36d');
      k.rect(CX - 15, b - 42, 30, 42, C.void);
      k.rect(CX - 13, b - 40, 26, 40, '#06040a');
      e.portal(CX, b - 20, 12, 18, th.rune);
      // Boisage : montant gauche debout, montant droit penché, linteau tombé en biais.
      k.rect(CX - 19, b - 46, 4, 46, C.wood[2]);
      k.rect(CX - 19, b - 46, 1, 46, C.wood[1]);
      k.rect(CX - 16, b - 46, 1, 46, C.wood[3]);
      k.line(CX + 17, b, CX + 24, b - 40, C.wood[2], 3);
      k.line(CX + 17, b, CX + 24, b - 40, C.wood[1], 1);
      k.line(CX - 22, b - 47, CX + 26, b - 36, C.wood[2], 4);
      k.line(CX - 22, b - 47, CX + 26, b - 36, C.wood[1], 1);
      // Lanterne pendue au montant.
      k.rect(CX - 24, b - 44, 1, 5, C.iron[3]);
      k.rect(CX - 27, b - 39, 7, 8, C.iron[2]);
      k.rect(CX - 26, b - 38, 5, 6, '#ffd36d');
      k.rect(CX - 25, b - 37, 3, 3, '#fff6c5');
      e.light(CX - 24, b - 35, 120, '#ffcf6a');
      e.glint(CX - 24, b - 35, 6, '#ffcf6a');
      // Éboulis au pied, à droite.
      rock(k, CX + 30, b - 5, 10, 8, C.grey, 53);
      rock(k, CX + 42, b - 3, 8, 6, C.earth, 54);
      rock(k, CX + 22, b - 2, 5, 4, C.grey, 55);
      rock(k, CX + 36, b - 12, 6, 5, C.grey, 57);
      // Wagonnet renversé à gauche, minerai répandu.
      const wx = CX - 44;
      k.poly(
        [
          [wx - 12, b - 4],
          [wx + 6, b - 16],
          [wx + 12, b - 8],
          [wx - 6, b + 2]
        ],
        C.iron[2]
      );
      k.line(wx - 12, b - 4, wx + 6, b - 16, C.iron[0]);
      k.disc(wx + 9, b - 15, 2, C.iron[3]);
      k.disc(wx + 13, b - 9, 2, C.iron[3]);
      for (const [ox, oy] of [
        [-16, -1],
        [-19, 0],
        [-14, 1]
      ])
        k.rect(wx + ox, b + oy - 2, 3, 2, '#c8a060');
      torchPost(k, e, CX + 56, b, 20, th.flame, 5);
      e.light(CX + 56, b - 26, 120, th.flame[1]);
      e.rails = true;
      e.ledge(CX - 30, CX + 30, b - 56);
      e.wall(CX - 25, b - 48, b - 4);
      e.wall(CX + 24, b - 48, b - 4);
      e.foot(CX - 62, CX + 62);
      return b - 64;
    },
    // Halls Engloutis de Khaz-Ombral : façade naine bleu-gris, porte à linteau en degrés, deux statues de gardiens
    // barbus, frise de runes dorées et brasiers bleus ; l'eau noire déborde au pied.
    ombral(k, e, th) {
      const b = BASE,
        R = C.slate,
        top = steps(k, CX, b, 104, 2, C.iron);
      masonry(k, CX - 44, top - 58, 88, 58, R, 9, 6, 61);
      k.rect(CX - 47, top - 63, 94, 5, R[1]);
      k.rect(CX - 47, top - 63, 94, 1, R[0]);
      k.rect(CX - 47, top - 59, 94, 1, R[4]);
      for (let x = CX - 42; x < CX + 42; x += 7) {
        k.rect(x, top - 56, 3, 2, C.gold[1]);
        k.px(x + 1, top - 57, C.gold[0]);
      }
      e.ledge(CX - 47, CX + 47, top - 63);
      // Porte : cadre épais, linteau en trois degrés.
      const hw = 15,
        h = 42;
      k.rect(CX - hw - 6, top - h - 5, (hw + 6) * 2, h + 5, R[1]);
      k.rect(CX - hw - 6, top - h - 5, 1, h + 5, R[0]);
      for (let i = 0; i < 3; i++) {
        const w = hw + 8 - i * 5,
          y = top - h - 5 - (i + 1) * 4;
        k.rect(CX - w, y, w * 2, 4, i % 2 ? R[2] : R[1]);
        k.rect(CX - w, y, w * 2, 1, R[0]);
      }
      k.rect(CX - 3, top - h - 15, 6, 6, C.gold[2]);
      k.rect(CX - 2, top - h - 14, 4, 4, '#7ad0ff');
      e.glint(CX, top - h - 12, 8, '#7ad0ff');
      k.rect(CX - hw, top - h, hw * 2, h, C.void);
      k.rect(CX - hw + 2, top - h + 2, hw * 2 - 4, h - 2, '#06040a');
      e.portal(CX, top - 21, 12, 19, th.rune);
      // Gardiens de pierre : socle, corps, casque à cornes, longue barbe, hache contre l'épaule.
      for (const sx of [-1, 1]) {
        const x = CX + sx * 33,
          y = top;
        k.rect(x - 7, y - 6, 14, 6, R[2]);
        k.rect(x - 7, y - 6, 14, 1, R[0]);
        k.poly(
          [
            [x - 7, y - 6],
            [x - 5, y - 30],
            [x + 5, y - 30],
            [x + 7, y - 6]
          ],
          R[1]
        );
        k.rect(x - 5, y - 30, 2, 24, R[0]);
        k.rect(x - 5, y - 38, 10, 8, R[2]);
        k.rect(x - 6, y - 40, 12, 3, R[1]);
        k.rect(x - 6, y - 40, 12, 1, R[0]);
        k.rect(x - 9, y - 43, 3, 4, R[0]);
        k.rect(x + 6, y - 43, 3, 4, R[0]);
        k.rect(x - 3, y - 35, 2, 1, '#7ad0ff');
        k.rect(x + 1, y - 35, 2, 1, '#7ad0ff');
        k.poly(
          [
            [x - 4, y - 32],
            [x + 4, y - 32],
            [x + 2, y - 16],
            [x, y - 13],
            [x - 2, y - 16]
          ],
          R[0]
        );
        for (let yy = y - 30; yy < y - 16; yy += 3) k.rect(x - 1, yy, 2, 1, R[2]);
        k.rect(x + sx * 8, y - 36, 1, 30, C.wood[3]);
        k.rect(x + sx * 8 - (sx > 0 ? 0 : 3), y - 38, 4, 6, C.iron[1]);
        e.wall(x - 6, y - 30, y - 6);
      }
      brazier(k, e, CX - 58, b - 2, th.flame, 6);
      brazier(k, e, CX + 58, b - 2, th.flame, 7);
      e.light(CX - 58, b - 22, 130, th.flame[1]);
      e.light(CX + 58, b - 22, 130, th.flame[1]);
      e.foot(CX - 62, CX + 62);
      return top - 80;
    },
    // Crypte des Mille Tombes : crypte de pierre moussue à pignon, arche brisée, grille de fer entrouverte, niches à
    // crânes, rosace verte, bougies sur les marches, croix et stèle de part et d'autre.
    mille_tombes(k, e, th) {
      const b = BASE,
        R = C.mossy,
        top = steps(k, CX, b, 86, 2, R);
      masonry(k, CX - 30, top - 50, 60, 50, R, 7, 5, 71);
      k.poly(
        [
          [CX - 35, top - 49],
          [CX, top - 80],
          [CX + 35, top - 49]
        ],
        R[1]
      );
      k.poly(
        [
          [CX - 28, top - 51],
          [CX, top - 74],
          [CX + 28, top - 51]
        ],
        R[3]
      );
      k.line(CX - 35, top - 49, CX, top - 80, R[0]);
      k.rect(CX - 1, top - 86, 2, 8, R[1]);
      k.rect(CX - 4, top - 83, 8, 2, R[1]);
      e.ledge(CX - 35, CX + 35, top - 49);
      // Rosace verte au pignon.
      k.disc(CX, top - 61, 5, R[4]);
      k.disc(CX, top - 61, 4, '#1a3a26');
      k.rect(CX - 3, top - 61, 7, 1, '#7affb0');
      k.rect(CX, top - 64, 1, 7, '#7affb0');
      e.glint(CX, top - 61, 8, '#7affb0');
      // Arche brisée (ogive) et son ouverture.
      const ogive = (hw, h) => {
        const pts = [[CX - hw, top]];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push([
            CX - hw + hw * Math.sin((t * Math.PI) / 2),
            top - h * 0.55 - h * 0.45 * Math.sin((t * Math.PI) / 2)
          ]);
        }
        for (let i = 8; i >= 0; i--) {
          const t = i / 8;
          pts.push([
            CX + hw - hw * Math.sin((t * Math.PI) / 2),
            top - h * 0.55 - h * 0.45 * Math.sin((t * Math.PI) / 2)
          ]);
        }
        pts.push([CX + hw, top]);
        return pts;
      };
      k.poly(ogive(17, 48), R[1]);
      k.poly(ogive(13, 44), C.void);
      k.poly(ogive(11, 42), '#06040a');
      e.portal(CX, top - 19, 10, 17, th.rune);
      // Grille de fer ouverte sur la gauche.
      for (let x = CX - 24; x <= CX - 15; x += 3) k.rect(x, top - 34, 1, 34, C.iron[2]);
      k.rect(CX - 25, top - 30, 11, 1, C.iron[1]);
      k.rect(CX - 25, top - 12, 11, 1, C.iron[1]);
      for (let x = CX - 24; x <= CX - 15; x += 3) k.px(x, top - 35, C.iron[0]);
      // Niches à crânes de chaque côté.
      for (const sx of [-1, 1])
        for (let row = 0; row < 2; row++) {
          const nx = CX + sx * 23 - 4,
            ny = top - 40 + row * 14;
          k.rect(nx, ny, 9, 9, R[4]);
          k.rect(nx + 2, ny + 3, 5, 4, '#e8e0c8');
          k.rect(nx + 3, ny + 4, 1, 1, '#1a1410');
          k.rect(nx + 5, ny + 4, 1, 1, '#1a1410');
          k.rect(nx + 3, ny + 7, 3, 1, '#c8c0a8');
        }
      // Bougies aux flammes vertes sur les marches.
      for (const [bx, bh] of [
        [-30, 5],
        [-26, 3],
        [24, 4],
        [29, 6]
      ]) {
        k.rect(CX + bx, b - 4 - bh, 2, bh, '#e8e0c8');
        e.flame(CX + bx + 1, b - 4 - bh, 0.5, th.flame, bx);
      }
      e.light(CX, b - 10, 110, th.flame[1]);
      // Croix penchée à gauche, stèle à droite.
      k.rect(CX - 52, b - 26, 3, 26, C.grey[2]);
      k.rect(CX - 58, b - 20, 15, 3, C.grey[2]);
      k.rect(CX - 52, b - 26, 1, 26, C.grey[0]);
      k.rect(CX + 46, b - 18, 12, 18, C.grey[2]);
      k.disc(CX + 52, b - 18, 6, C.grey[2]);
      k.rect(CX + 46, b - 22, 2, 22, C.grey[0]);
      k.rect(CX + 49, b - 14, 6, 1, C.grey[3]);
      k.rect(CX + 49, b - 11, 6, 1, C.grey[3]);
      e.wall(CX - 30, top - 48, top - 4);
      e.wall(CX + 29, top - 48, top - 4);
      e.foot(CX - 60, CX + 60);
      return top - 88;
    },
    // Tréfonds Fongiques : deux pieds de champignons géants qui se courbent en arche sous un immense chapeau tacheté,
    // petits champignons luisants et filaments de mycélium au pied.
    fongique(k, e, th) {
      const b = BASE,
        stem = ['#fff6e4', '#efe0c4', '#d4c09c', '#a89270'],
        cap = ['#ffc0e4', '#f07ab8', '#c8488e', '#8a2860', '#561638'];
      voidArch(k, CX, b, 15, 46);
      e.portal(CX, b - 21, 12, 19, th.rune);
      // Pieds courbés : disques empilés le long d'une courbe, éclairés à gauche.
      for (const sx of [-1, 1]) {
        const pts = CANAAN_PIXEL_KIT.bez(
          [CX + sx * 26, b],
          [CX + sx * 26, b - 30],
          [CX + sx * 10, b - 54],
          24
        );
        for (const [x, y] of pts) {
          const r = 6 - Math.round(((b - y) / 54) * 2);
          k.disc(x, y, r, stem[3]);
          k.disc(x - 1, y, r - 1, stem[2]);
          k.disc(x - 2, y, Math.max(1, r - 3), stem[1]);
          k.px(x - r + 1, y, stem[0]);
        }
        // Anneau du pied.
        k.rect(CX + sx * 22 - 6, b - 32, 12, 3, stem[3]);
        k.rect(CX + sx * 22 - 6, b - 32, 12, 1, stem[0]);
        e.wall(CX + sx * 26, b - 30, b - 4);
      }
      // Chapeau : dôme modelé, lamelles dessous, taches claires.
      blob(k, CX, b - 62, 50, 24, cap.slice(0, 4), 81, { cut: 0.2, rough: 0.08 });
      for (let x = CX - 44; x <= CX + 44; x += 3) k.rect(x, b - 58, 1, 3, cap[4]);
      k.rect(CX - 48, b - 58, 96, 1, cap[4]);
      for (const [sx, sy, r] of [
        [-30, -70, 4],
        [-12, -78, 5],
        [8, -74, 3],
        [24, -80, 4],
        [36, -68, 3],
        [-38, -64, 2],
        [0, -66, 3]
      ]) {
        k.disc(CX + sx, b + sy, r, '#fff0f8');
        k.px(CX + sx - 1, b + sy - 1, '#ffffff');
      }
      e.ledge(CX - 46, CX + 46, b - 84);
      e.glint(CX - 12, b - 78, 10, '#ffd0f0');
      // Petits champignons luisants en grappes.
      for (const [x, h, col] of [
        [-48, 9, '#7affe8'],
        [-42, 6, '#ff8ae8'],
        [-54, 5, '#fff08a'],
        [44, 8, '#ff8ae8'],
        [51, 11, '#7affe8'],
        [57, 6, '#fff08a']
      ]) {
        k.rect(CX + x, b - h, 2, h, stem[1]);
        k.rect(CX + x - 3, b - h - 3, 8, 3, col);
        k.rect(CX + x - 2, b - h - 4, 6, 1, col);
        k.px(CX + x - 2, b - h - 3, '#ffffff');
        e.glint(CX + x + 1, b - h - 2, 5, col);
      }
      e.light(CX - 48, b - 12, 90, '#7affe8');
      e.light(CX + 50, b - 14, 90, '#ff8ae8');
      // Filaments de mycélium sur le sol.
      for (const sx of [-1, 1])
        for (let i = 0; i < 3; i++)
          k.line(CX + sx * 30, b - 1, CX + sx * (40 + i * 8), b + 2 + i, '#e8dcc0', 1);
      e.foot(CX - 60, CX + 60);
      return b - 88;
    },
    arena(k, e, th) {
      const b = BASE,
        R = C.sandstone;
      // Façade courbe à deux étages d'arcades et attique.
      masonry(k, CX - 76, b - 42, 152, 42, R, 9, 6, 81);
      masonry(k, CX - 66, b - 72, 132, 30, R, 9, 6, 82);
      masonry(k, CX - 54, b - 82, 108, 10, R, 9, 5, 83);
      k.rect(CX - 78, b - 44, 156, 3, R[1]);
      k.rect(CX - 78, b - 44, 156, 1, R[0]);
      k.rect(CX - 68, b - 74, 136, 3, R[1]);
      k.rect(CX - 68, b - 74, 136, 1, R[0]);
      for (let i = -3; i <= 3; i++) {
        if (Math.abs(i) <= 1) continue;
        const x = CX + i * 20;
        voidArch(k, x, b - 3, 6, 28);
        k.rect(x - 7, b - 3, 14, 3, R[2]);
      }
      for (let i = -2; i <= 2; i++) {
        const x = CX + i * 24;
        k.poly(archPts(x, b - 47, 5, 20), '#3a2414');
        k.poly(archPts(x, b - 47, 3, 18), '#1e120a');
      }
      archFrame(k, CX, b, 20, 52, R, 6, C.gold);
      voidArch(k, CX, b, 20, 52);
      e.portal(CX, b - 25, 16, 24);
      // Bannières pourpres et or, épées croisées au fronton.
      for (const s of [-1, 1]) {
        banner(k, CX + s * 40 - 6, b - 70, 12, 22, th.banner);
        k.line(CX + s * 8, b - 98, CX - s * 6, b - 84, '#dfe6ee', 2);
        k.px(CX - s * 6, b - 83, C.gold[1]);
        for (let i = 0; i < 5; i++)
          k.rect(CX + s * (10 + i * 4), b - 84 - i * 2, 4, 2, i % 2 ? '#6aa04a' : '#4e8a3a');
      }
      k.disc(CX, b - 88, 4, C.gold[2]);
      k.px(CX - 1, b - 89, C.gold[0]);
      // Assombrit les bords pour suggérer la courbe.
      shadeSides(k, CX, 78, b - 84, b);
      for (const s of [-1, 1]) {
        brazier(k, e, CX + s * 84, b - 1, th.flame, s + 9, 1.3);
        e.light(CX + s * 84, b - 26, 170, th.flame[1]);
      }
      for (const x of [CX - 50, CX, CX + 50]) {
        k.rect(x, b - 100 + (x === CX ? -8 : 0), 1, 18 + (x === CX ? 8 : 0), C.iron[2]);
        e.flag(x + 1, b - 100 + (x === CX ? -8 : 0), x === CX ? th.banner[1] : th.banner[0], 9);
      }
      e.ledge(CX - 54, CX + 54, b - 82);
      e.foot(CX - 80, CX + 80);
      return b - 110;
    }
  };
  // Châteaux : deux tours crénelées (toit conique d'ardoises en option), corps de garde, herse et bannières.
  function keep(k, e, th, R, roof, desert) {
    const b = BASE;
    for (const s of [-1, 1]) {
      const tx = CX + s * 36 - 13;
      masonry(k, tx, b - 76, 26, 76, R, 7, 5, 91 + s);
      merlons(k, tx - 1, b - 76, 28, R, 4, 4);
      if (roof) cone(k, CX + s * 36, b - 80, 16, 26, roof);
      k.rect(CX + s * 36 - 2, b - 62, 4, 9, '#2a1e1a');
      k.rect(CX + s * 36 - 1, b - 61, 2, 7, '#ffcf6a');
      e.glint(CX + s * 36, b - 58, 5, '#ffcf6a');
      e.light(CX + s * 36, b - 58, 70, '#ffcf6a');
      banner(k, CX + s * 36 - 6, b - 46, 12, 22, th.banner);
      e.wall(CX + s * 36 + (s < 0 ? -10 : 8), b - 70, b - 6);
    }
    masonry(k, CX - 23, b - 60, 46, 60, R, 7, 5, 95);
    merlons(k, CX - 23, b - 60, 46, R, 4, 3);
    archFrame(k, CX, b, 14, 42, R, 4, R);
    voidArch(k, CX, b, 14, 42);
    e.portal(CX, b - 20, 12, 19);
    // Herse à demi levée, au premier plan.
    const f = e.front;
    for (let x = CX - 12; x <= CX + 11; x += 5) f.rect(x, b - 40, 2, 12, C.iron[3]);
    f.rect(CX - 13, b - 29, 26, 2, C.iron[2]);
    f.rect(CX - 13, b - 34, 26, 1, C.iron[3]);
    for (let x = CX - 12; x <= CX + 11; x += 5) f.px(x, b - 27, C.iron[1]);
    if (desert)
      for (const s of [-1, 1]) {
        const px = CX + s * 60;
        k.rect(px, b - 30, 2, 30, C.wood[3]);
        k.rect(px - 3, b - 37, 8, 7, '#ece0c4');
        k.rect(px - 3, b - 31, 8, 1, '#b8a888');
        k.px(px - 1, b - 35, '#2a1810');
        k.px(px + 2, b - 35, '#2a1810');
        brazier(k, e, CX + s * 50, b - 1, th.flame, s + 11);
        e.light(CX + s * 50, b - 20, 120, th.flame[1]);
      }
    else
      for (const s of [-1, 1]) {
        torchPost(k, e, CX + s * 54, b, 20, th.flame, s + 13);
        e.light(CX + s * 54, b - 26, 110, th.flame[1]);
      }
    e.ledge(CX - 49, CX + 49, b - 76);
    e.foot(CX - 64, CX + 64);
    return b - (roof ? 112 : 82);
  }
  function fillEllipse(k, cx, cy, rx, ry) {
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      k.g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
    }
  }
  // Anneau de pierre en ellipse ; part : -1 moitié arrière, 1 moitié avant, 0 tout.
  function ring(k, cx, cy, rx, ry, ix, iy, R, part) {
    for (let y = -ry; y <= ry; y++) {
      if ((part < 0 && y > 0) || (part > 0 && y <= 0)) continue;
      for (let x = -rx; x <= rx; x++) {
        const o = (x * x) / (rx * rx) + (y * y) / (ry * ry),
          i = (x * x) / (ix * ix) + (y * y) / (iy * iy);
        if (o > 1 || i < 1) continue;
        const a = Math.atan2(y / ry, x / rx),
          seg = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 18),
          joint = Math.abs(((a + Math.PI) / (Math.PI * 2)) * 18 - seg - 0.5) > 0.44,
          lit = -Math.cos(a + 0.8) * 0.5 + (o > 0.88 ? -0.3 : 0.15) + (bayer(x, y) - 0.5) * 0.2;
        k.px(cx + x, cy + y, joint ? R[3] : lit > 0.35 ? R[0] : lit > -0.05 ? R[1] : R[2]);
      }
    }
  }
  function shadeSides(k, cx, hw, y0, y1) {
    const g = k.g;
    g.save();
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(60,30,20,' + 0.07 * (4 - i) + ')';
      g.fillRect(cx - hw - 2 + i * 6, y0, 6, y1 - y0);
      g.fillRect(cx + hw + 2 - (i + 1) * 6, y0, 6, y1 - y0);
    }
    g.restore();
  }
  // ---------------------------------------------------------------- Habillage selon la région
  function dress(k, f, gk, zone, marks, seed) {
    const D = DRESS[zone] || DRESS[0],
      G = D.grass,
      g = k.g;
    // Pied des murs assombri (occlusion au sol) et taches d'eau dans le marais.
    g.save();
    g.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(28,20,30,' + (0.06 + i * 0.05) + ')';
      g.fillRect(0, BASE - 8 + i * 2, AW, 2);
    }
    if (D.stain) {
      g.fillStyle = D.stain;
      g.globalAlpha = 0.35;
      for (let x = 0; x < AW; x++) g.fillRect(x, BASE - 10 - Math.floor(hash(x, seed) * 4), 1, 12);
    }
    g.restore();
    // Lierre grimpant.
    if (D.moss)
      for (const [x, y0, y1] of marks.walls) {
        let xx = x;
        for (let y = y1; y > y0 + (y1 - y0) * hash(x, seed + 1) * 0.6; y--) {
          xx += hash(y, x + seed) > 0.7 ? 1 : hash(y, x + seed) < 0.3 ? -1 : 0;
          k.px(xx, y, G[2]);
          if (y % 3 === 0) k.px(xx + (y % 2 ? 1 : -1), y, G[1]);
          if (y % 5 === 0) k.px(xx, y, G[0]);
        }
      }
    // Corniches : mousse, feuilles mortes, sable ou petits cristaux.
    for (const [x0, x1, y] of marks.ledges)
      for (let x = x0; x < x1; x++) {
        const h = hash(x, seed + 7);
        if (D.moss && h > 0.55) {
          k.px(x, y - 1, G[1]);
          if (h > 0.8) k.rect(x, y, 1, 1 + Math.floor(h * 3), G[2]);
        } else if (D.leaves && h > 0.7) k.px(x, y - 1, D.bits[Math.floor(h * 13) % D.bits.length]);
        else if (D.sand && h > 0.5) k.rect(x, y - 1 - (h > 0.85 ? 1 : 0), 1, 1 + (h > 0.85 ? 1 : 0), G[1]);
        else if (D.crystals && h > 0.94)
          crystal(k, x, y - 1, 3 + Math.floor(h * 3), ['#e8fffa', '#7ae8d8', '#2e8a80']);
      }
    // Pied : touffes, fleurs, roseaux, feuilles, congères de sable, cristaux — au premier plan, contourés.
    for (const [x0, x1] of marks.feet) {
      for (let x = x0; x <= x1; x += 3) {
        const h = hash(x, seed + 3),
          y = BASE + 1 + Math.floor(hash(x, seed + 4) * 4);
        if (D.sand) {
          if (h > 0.55)
            for (let i = -4; i <= 4; i++)
              f.rect(x + i, BASE + 2 - Math.round(3 * Math.cos((i / 4) * 1.5)), 1, 4, i < 0 ? G[1] : G[2]);
        } else if (D.crystals && h > 0.82) {
          crystal(f, x, y, 5 + Math.floor(h * 6), ['#e8fffa', '#b48aff', '#6a4ab0'], h > 0.9 ? 2 : -1);
        } else if (D.reeds && h > 0.72) {
          for (const dx of [-1, 1, 2])
            f.rect(x + dx, y - 9 - (dx & 1) * 2, 1, 9 + (dx & 1) * 2, G[1 + (dx & 1)]);
          f.rect(x + 1, y - 13, 2, 4, '#7a4a28');
        } else if (D.leaves && h > 0.5) {
          for (let i = 0; i < 4; i++)
            f.px(
              x + Math.floor(hash(i, x) * 6) - 3,
              y - Math.floor(hash(x, i) * 2),
              D.bits[(i + x) % D.bits.length]
            );
        } else if (D.bones && h > 0.8) {
          f.rect(x - 2, y - 1, 5, 1, '#e8e0c8');
          f.px(x - 2, y - 2, '#e8e0c8');
          f.px(x + 2, y - 2, '#c8c0a8');
        } else if (D.glowshrooms && h > 0.7) {
          const cap = D.bits[Math.floor(h * 31) % D.bits.length];
          f.rect(x, y - 3, 1, 3, '#f0e8d0');
          f.rect(x - 1, y - 5, 3, 2, cap);
          f.px(x - 1, y - 5, '#ffffff');
        } else if (h > 0.62) {
          tuft(f, x, y, G);
          if (D.shrooms && h > 0.93) {
            f.rect(x + 3, y - 3, 1, 3, '#fff1d8');
            f.rect(x + 2, y - 5, 3, 2, '#e85a48');
            f.px(x + 3, y - 5, '#fff1d8');
          } else if (D.bits && h > 0.85) f.px(x, y - 5, D.bits[Math.floor(h * 97) % D.bits.length]);
        }
      }
      // Cailloux posés au sol, sur le calque du sol.
      for (let i = 0; i < 9; i++) {
        const x = x0 - 8 + Math.floor(hash(i, seed + 9) * (x1 - x0 + 16)),
          y = BASE + 3 + Math.floor(hash(seed + 9, i) * 12),
          r = hash(i, i + seed) > 0.6 ? 2 : 1;
        gk.g.fillStyle = 'rgba(30,22,28,.3)';
        gk.g.fillRect(x - r + 1, y + 1, r * 2 + 1, 1);
        gk.rect(x - r, y - r + 1, r * 2, r, '#8e8a82');
        gk.rect(x - r, y - r + 1, r * 2 - 1, 1, '#b2aea4');
      }
    }
  }
  // Sol : ombre de contact tramée, usure du passage, rails, flaques ou ondulations du sable.
  function ground(gk, zone, marks, extra, seed) {
    const D = DRESS[zone] || DRESS[0],
      [x0, x1] = marks.feet[0] || [CX - 50, CX + 50],
      rx = (x1 - x0) / 2 + 6,
      cx = (x0 + x1) / 2;
    for (let y = -10; y <= 10; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / 100;
        if (d > 1) continue;
        const a =
          d < 0.45
            ? 0.3
            : d < 0.75
              ? bayer(x, y) > (d - 0.45) / 0.3
                ? 0.3
                : 0.16
              : bayer(x, y) > (d - 0.75) / 0.25
                ? 0.16
                : 0;
        if (!a) continue;
        gk.g.fillStyle = 'rgba(22,16,28,' + a + ')';
        gk.g.fillRect(Math.round(cx + x), BASE + 1 + y, 1, 1);
      }
    // Passage tassé devant l'ouverture.
    for (let y = 2; y < 18; y++)
      for (let x = -14; x <= 14; x++)
        if (bayer(x, y) < 0.35 - y * 0.015 && Math.abs(x) < 14 - y * 0.4) {
          gk.g.fillStyle = 'rgba(40,28,22,.16)';
          gk.g.fillRect(CX + x, BASE + y, 1, 1);
        }
    if (extra.rails) {
      for (let y = BASE; y < AH - 2; y++) {
        gk.rect(CX - 8, y, 1, 1, C.iron[1]);
        gk.rect(CX + 7, y, 1, 1, C.iron[1]);
        if ((y - BASE) % 4 === 1) gk.rect(CX - 10, y, 20, 2, C.wood[3]);
      }
    }
    if (D.reeds || D.puddles)
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(hash(i, seed + 21) * (AW - 40)) + 20,
          y = BASE + 6 + Math.floor(hash(seed + 21, i) * 12);
        if (Math.abs(x - CX) < 20) continue;
        gk.g.fillStyle = D.puddles ? 'rgba(14,34,48,.7)' : 'rgba(70,96,110,.55)';
        fillEllipse(gk, x, y, 6 + i, 2);
        gk.rect(x - 3, y - 1, 3, 1, 'rgba(200,226,236,.5)');
      }
    if (D.sand)
      for (let y = BASE + 4; y < AH; y += 5)
        for (let x = 0; x < AW; x++)
          if (bayer(x, y) < 0.12 && Math.abs(Math.sin(x * 0.18 + y)) > 0.6)
            gk.rect(x, y, 2, 1, 'rgba(255,240,200,.35)');
  }

  // ---------------------------------------------------------------- Tourbillon, engrenages, anneau
  const tones = col => [
    mix(col, '#05030a', 0.78),
    mix(col, '#05030a', 0.5),
    col,
    mix(col, '#ffffff', 0.5),
    mix(col, '#ffffff', 0.85)
  ];
  function swirl(rx, ry, col) {
    const T = tones(col),
      frames = [],
      w = rx * 2 + 1,
      h = ry * 2 + 1,
      N = 12,
      P = T.map(rgb);
    for (let f = 0; f < N; f++) {
      const cv = makeCanvas(w, h),
        g = cv.getContext('2d'),
        img = g.createImageData && g.createImageData(w, h);
      if (!img || !img.data) return null;
      const d = img.data,
        ph = (f / N) * Math.PI * 2;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const nx = (x - rx) / rx,
            ny = (y - ry) / ry,
            r = Math.hypot(nx, ny);
          if (r > 1) continue;
          const a = Math.atan2(ny, nx),
            v = 0.5 + 0.5 * Math.sin(3 * a + 9 * r - ph);
          let t = v * 0.5 + (1 - r) * 0.7 - 0.05 + (bayer(x, y) - 0.5) * 0.25;
          if (r > 0.9) t = 0.72;
          else if (r > 0.8) t = Math.max(t, 0.5);
          let idx = Math.max(0, Math.min(4, Math.floor(t * 5)));
          if (r < 0.8 && hash(x * 7 + f, y * 13) > 0.988) idx = 4;
          const c = P[idx],
            o = (y * w + x) * 4;
          d[o] = c[0];
          d[o + 1] = c[1];
          d[o + 2] = c[2];
          d[o + 3] = 255;
        }
      g.putImageData(img, 0, 0);
      frames.push(cv);
    }
    return frames;
  }
  function gearFrames() {
    const out = [],
      R = C.gold;
    for (let f = 0; f < 6; f++) {
      const k = brush(23, 23);
      for (let y = -11; y <= 11; y++)
        for (let x = -11; x <= 11; x++) {
          const r = Math.hypot(x, y),
            a = Math.atan2(y, x) + (f / 6) * (Math.PI / 4),
            tooth = Math.cos(a * 8) > 0.2;
          if (r > (tooth ? 9.5 : 7.2) || r < 2.2) continue;
          const lit = (-x - y) / 14 + (bayer(x, y) - 0.5) * 0.3;
          k.px(11 + x, 11 + y, r < 4.5 ? R[3] : lit > 0.3 ? R[0] : lit > -0.2 ? R[1] : R[2]);
        }
      outline(k);
      out.push(k.cv);
    }
    return out;
  }
  function ringSprite(rx, ry, R, gem) {
    const k = brush(rx * 2 + 5, ry * 2 + 5);
    ring(k, rx + 2, ry + 2, rx, ry, rx - 5, ry - 5, R, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        x = rx + 2 + Math.cos(a) * (rx - 2.5),
        y = ry + 2 + Math.sin(a) * (ry - 2.5);
      k.rect(x - 1, y - 1, 3, 3, gem);
      k.px(x - 1, y - 1, '#ffffff');
    }
    outline(k);
    return k.cv;
  }

  // ---------------------------------------------------------------- Cuisson et cache
  const CACHE = new Map();
  let GEARS = null;
  function zoneAt(x, y) {
    try {
      return Math.max(0, ZONES.indexOf(regionAt(x / TS, y / TS)));
    } catch {
      return 0;
    }
  }
  function bake(key, wx, wy, i) {
    if (typeof document === 'undefined') return null;
    const model = MODELS[key],
      th = THEME[key];
    if (!model || !th) return null;
    const k = brush(AW, AH),
      f = brush(AW, AH),
      gk = brush(AW, AH);
    if (!k.g?.getImageData || !f.g?.getImageData) return null;
    const cx = wx + 24,
      by = wy + 34,
      d = Number.isInteger(i) ? instances[i] : null,
      zone = d?.under ? d.biome : zoneAt(cx, by),
      x0 = cx - CX * U,
      y0 = by - BASE * U,
      W = (ax, ay) => [x0 + ax * U, y0 + ay * U],
      fx = [],
      marks = { ledges: [], feet: [], walls: [] },
      extra = {},
      seed = Math.floor(wx / TS) * 7 + Math.floor(wy / TS) * 13;
    let open = null,
      ringFx = null;
    const e = {
      dress: DRESS[zone] || DRESS[0],
      front: f,
      portal: (ax, ay, rx, ry, col) => (open = { ax, ay, rx, ry, col: col || th.rune }),
      flame: (ax, ay, s, cols, sd) => fx.push(['flame', ...W(ax, ay), s, cols, sd]),
      light: (ax, ay, r, col) => fx.push(['light', ...W(ax, ay), r, col]),
      glint: (ax, ay, r, col) => fx.push(['glint', ...W(ax, ay), r, col, ax]),
      smoke: (ax, ay) => fx.push(['smoke', ...W(ax, ay)]),
      lava: (ax, ay, len, s) => fx.push(['lava', ...W(ax, ay), len * U, s]),
      beam: (ax, ay, w, h, col) => fx.push(['beam', ...W(ax, ay), w * U, h * U, col]),
      motes: (ax, ay, r, col) => fx.push(['motes', ...W(ax, ay), r * U, col]),
      gear: (ax, ay, s) => fx.push(['gear', ...W(ax, ay), s]),
      flag: (ax, ay, col, len) => fx.push(['flag', ...W(ax, ay), col, len * U]),
      ring: (ax, ay, rx, ry, R, gem) => (ringFx = { img: ringSprite(rx, ry, R, gem), ax, ay, rx, ry }),
      ledge: (a, b, y) => marks.ledges.push([a, b, y]),
      foot: (a, b) => marks.feet.push([a, b]),
      wall: (x, a, b) => marks.walls.push([x, a, b]),
      set rails(v) {
        extra.rails = v;
      }
    };
    const top = model(k, e, th, f);
    dress(k, f, gk, zone, marks, seed);
    ground(gk, zone, marks, extra, seed);
    outline(k);
    outline(f);
    if (!open) return null;
    // Colonnes pleines au pied de l'entrée : elles bloquent le passage (murs, socle, margelle, torches).
    const cols = new Uint8Array(AW);
    for (const layer of [k, f]) {
      const img = layer.g.getImageData(0, BASE - 6, AW, 6),
        d = img && img.data;
      if (d)
        for (let x = 0; x < AW; x++)
          for (let y = 0; y < 6; y++) if (d[(y * AW + x) * 4 + 3] > 128) cols[x] = 1;
    }
    const P = {
      under: !!d?.under,
      cols,
      key,
      wx,
      wy,
      x0,
      y0,
      body: k.cv,
      front: f.cv,
      ground: gk.cv,
      fx,
      top: y0 + top * U,
      base: by,
      left: x0 + (marks.feet[0]?.[0] ?? 20) * U,
      right: x0 + (marks.feet[0]?.[1] ?? AW - 20) * U,
      open: { x: x0 + open.ax * U, y: y0 + open.ay * U, rx: open.rx, ry: open.ry, col: open.col },
      swirl: swirl(open.rx, open.ry, open.col),
      ring: ringFx && {
        img: ringFx.img,
        x: x0 + (ringFx.ax - ringFx.rx - 2) * U,
        y: y0 + (ringFx.ay - ringFx.ry - 2) * U
      },
      glow: glowSprite(open.col)
    };
    if (fx.some(v => v[0] === 'gear')) GEARS = GEARS || gearFrames();
    return P;
  }
  const GLOWS = {};
  function glowSprite(col) {
    if (GLOWS[col]) return GLOWS[col];
    const k = brush(64, 20);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 64; x++) {
        const d = ((x - 32) / 32) ** 2 + ((y - 10) / 10) ** 2;
        if (d < 1 && bayer(x, y) > d) k.px(x, y, col);
      }
    return (GLOWS[col] = k.cv);
  }
  function keyOf(i) {
    return i === 'arena' ? 'arena' : DUNGEON_LAYOUTS[i]?.key;
  }
  // Un portail sur l'île : l'Arène et chaque instance dont la clé a un thème.
  function has(i) {
    return i === 'arena' || (Number.isInteger(i) && !!THEME[keyOf(i)]);
  }
  function get(i, wx, wy) {
    const id = String(i),
      P = CACHE.get(id);
    if (P && P.wx === wx && P.wy === wy) return P;
    const N = bake(keyOf(i), wx, wy, i);
    if (N) CACHE.set(id, N);
    return N;
  }
  // Cuisson à l'avance, une entrée par tranche de temps libre, pour ne jamais saccader en approchant.
  let warming = false;
  function warm() {
    if (warming || typeof requestIdleCallback !== 'function' || typeof instances === 'undefined') return;
    warming = true;
    const todo = instances.map((d, i) => [i, d]).filter(([, d]) => !d.under && Number.isFinite(d.x));
    if (typeof CANAAN_ARENA_PORTAL !== 'undefined') todo.push(['arena', CANAAN_ARENA_PORTAL]);
    const step = () => {
      const next = todo.shift();
      if (!next) return void (warming = false);
      const [i, d] = next;
      if (has(i)) get(i, d.x * TS, d.y * TS);
      requestIdleCallback(step, { timeout: 2000 });
    };
    requestIdleCallback(step, { timeout: 2000 });
  }

  // ---------------------------------------------------------------- Rendu
  function R(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function flame(c, x, y, s, cols, seed) {
    const q = U * s,
      f = Math.round(Math.sin(time * 0.23 + seed) * 1.2) * U,
      l = Math.round(Math.sin(time * 0.31 + seed * 2)) * U;
    R(c, x - 3 * q, y - 3 * q, 6 * q, 3 * q, cols[0]);
    R(c, x - 2 * q, y - 6 * q + l, 4 * q, 4 * q, cols[0]);
    R(c, x - 1.5 * q, y - 7 * q + f, 3 * q, 5 * q, cols[1]);
    R(c, x - 0.5 * q, y - 9 * q + f, q, 3 * q, cols[1]);
    R(c, x - q, y - 4 * q, 2 * q, 3 * q, cols[2]);
  }
  function bobOf(P) {
    return P.ring ? Math.round(Math.sin(time * 0.04) * 2) * U : 0;
  }
  function drawFx(c, P, lights) {
    const bob = bobOf(P);
    for (const v of P.fx) {
      switch (v[0]) {
        case 'flame':
          flame(c, v[1], v[2], v[3], v[4], v[5]);
          break;
        case 'light':
          if (lights) canaanLight(v[1], v[2], v[3], v[4]);
          break;
        case 'glint': {
          const a = 0.35 + 0.25 * Math.sin(time * 0.06 + v[5]);
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = a;
          R(c, v[1] - U, v[2] - U, U * 2, U * 2, v[4]);
          c.globalAlpha = a * 0.4;
          R(c, v[1] - v[3], v[2] - U, v[3] * 2, U * 2, v[4]);
          R(c, v[1] - U, v[2] - v[3], U * 2, v[3] * 2, v[4]);
          c.restore();
          break;
        }
        case 'smoke':
          for (let i = 0; i < 4; i++) {
            const t = (time * 0.006 + i / 4) % 1,
              s = Math.round((3 + t * 6) / 1) * U;
            c.fillStyle = 'rgba(110,100,104,' + (0.42 * (1 - t)).toFixed(3) + ')';
            c.fillRect(
              Math.round((v[1] + Math.sin(t * 6 + i) * 8 - s / 2) / U) * U,
              Math.round((v[2] - t * 90 - s / 2) / U) * U,
              s,
              s
            );
          }
          break;
        case 'lava':
          for (let i = 0; i < 3; i++) {
            const t = (time * 0.008 + i / 3) % 1;
            R(c, v[1] + v[4] * t * 10, v[2] + t * v[3], U * 2, U * 2, t < 0.5 ? '#ffd36d' : '#ff7a2a');
          }
          break;
        case 'beam': {
          c.save();
          c.globalCompositeOperation = 'lighter';
          const a = 0.1 + 0.05 * Math.sin(time * 0.05 + v[1]);
          for (let i = 0; i < 3; i++) {
            c.globalAlpha = a * (1 - i * 0.3);
            const w = v[3] * (1 - i * 0.3);
            R(c, v[1] - w / 2, v[2] - v[4], w, v[4], v[5]);
          }
          c.restore();
          break;
        }
        case 'motes':
        case 'gear':
          break;
        case 'flag':
          for (let i = 0; i < v[4]; i += U) {
            const dy = Math.round(Math.sin(time * 0.12 - i * 0.25) * (i / v[4]) * 1.5) * U;
            R(c, v[1] + i, v[2] + dy, U, U * 5 - (i > v[4] - U * 2 ? U * 2 : 0), v[3]);
            R(c, v[1] + i, v[2] + dy + U * 4, U, U, mix(v[3], '#000000', 0.3));
          }
          break;
      }
      if (v[0] === 'gear' && GEARS) {
        const fr = GEARS[(Math.floor(time * 0.12) * (v[3] > 0 ? 1 : 5)) % 6];
        c.drawImage(fr, Math.round(v[1] - 11 * U), Math.round(v[2] - 11 * U), 23 * U, 23 * U);
      }
    }
    // Motes qui montent du portail.
    const o = P.open,
      col = mix(o.col, '#ffffff', 0.55);
    c.fillStyle = col;
    for (let i = 0; i < 6; i++) {
      const t = (time * 0.006 + i / 6) % 1,
        x = o.x + Math.sin(i * 2.3 + time * 0.02) * o.rx * U * 0.7,
        y = o.y + bob + o.ry * U * 0.6 - t * o.ry * U * 2.6;
      c.globalAlpha = 1 - t;
      c.fillRect(Math.round(x / U) * U, Math.round(y / U) * U, U, U);
    }
    c.globalAlpha = 1;
  }
  function layers(c, P, lights) {
    c.imageSmoothingEnabled = false;
    c.drawImage(P.body, P.x0, P.y0, AW * U, AH * U);
    const bob = bobOf(P),
      o = P.open;
    if (P.swirl) {
      const fr = P.swirl[Math.floor(time * 0.22) % P.swirl.length];
      c.drawImage(fr, o.x - o.rx * U, o.y - o.ry * U + bob, fr.width * U, fr.height * U);
    }
    if (P.ring)
      c.drawImage(P.ring.img, P.ring.x, P.ring.y + bob, P.ring.img.width * U, P.ring.img.height * U);
    c.drawImage(P.front, P.x0, P.y0, AW * U, AH * U);
    drawFx(c, P, lights);
  }
  // Dessine l'entrée i (indice d'instance ou 'arena') posée à (x, y) ; false si le module ne peut pas la dessiner.
  function draw(c, i, x, y) {
    warm();
    const P = get(i, x, y);
    if (!P) return false;
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(P.ground, P.x0, P.y0, AW * U, AH * U);
    const o = P.open;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.16 + 0.06 * Math.sin(time * 0.05);
    c.drawImage(P.glow, o.x - 64, P.base - 14, 128, 40);
    c.restore();
    layers(c, P, true);
    canaanLight(o.x, o.y + bobOf(P), 170, o.col);
    const d = i === 'arena' ? null : instances[i],
      label = i === 'arena' ? '✦ ARÈNE ✦' : d && d.raid ? '✦ RAID ✦' : '✦ DONJON ✦';
    c.font = 'bold 12px system-ui';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = '#101522';
    c.strokeText(label, o.x, P.top - 20);
    c.fillStyle = o.col;
    c.fillText(label, o.x, P.top - 20);
    c.restore();
    return true;
  }
  // Hauteur du libellé « [E] Entrer » au-dessus d'une entrée (monde), null si inconnue.
  function labelAt(i) {
    const P = CACHE.get(String(i));
    return P ? { x: P.open.x, y: P.top - 4 } : null;
  }
  // Grands objets à redessiner devant les personnages qui passent derrière (passe de profondeur, world-look.js).
  function occluders() {
    const out = [];
    const under = game.world.layer === 'under';
    for (const P of CACHE.values()) {
      if (P.under !== under) continue;
      if (P.right < camX - 40 || P.left > camX + W + 40 || P.top > camY + H + 40 || P.base < camY - 40)
        continue;
      out.push({
        x0: P.left,
        x1: P.right,
        y0: P.top,
        base: P.base - 8,
        // Tout le dessin de l'entrée (torches, sol) : les arbres plantés devant y sont repeints (world-look.js).
        box: [P.x0, P.y0, P.x0 + AW * U, P.y0 + AH * U],
        draw: g => layers(g, P, false)
      });
    }
    return out;
  }
  // Passage bloqué par une entrée : une bande de 30 pixels au-dessus de son pied, là où elle est pleine (la boîte de
  // collision du héros s'étend 12 pixels au-dessus et au-dessous de lui) : il s'arrête le pied sur le socle, ou passe
  // derrière, caché.
  function blocked(px, py) {
    const under = game.world.layer === 'under';
    for (const P of CACHE.values()) {
      if (P.under !== under) continue;
      if (py < P.base - 60 || py > P.base - 30 || px < P.x0 || px >= P.x0 + AW * U) continue;
      if (P.cols[Math.floor((px - P.x0) / U)]) return true;
    }
    return false;
  }
  window.CANAAN_PORTAL_ART = Object.freeze({
    draw,
    labelAt,
    occluders,
    blocked,
    has
  });
})();
