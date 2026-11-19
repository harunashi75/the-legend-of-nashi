// Hauts-fonds autour de l'île : la mer s'assombrit en s'éloignant de la côte, d'un turquoise clair au pied de la plage
// jusqu'au bleu nuit du large. Les héros (et les monstres qui les poursuivent) entrent dans l'eau tant qu'elle reste
// peu profonde ; au-delà de WADE cases du rivage, elle est trop profonde.
// - Profondeur : distance (chanfrein 8 voisins, en cases) entre chaque case de mer et la terre ferme la plus proche.
//   Seule la mer reliée au bord de la carte compte (les lacs gardent leur rendu et restent infranchissables) ; les
//   pilotis du quai sont de l'eau.
// - Chenal : entre l'île et la terre du sud-ouest, le fond reste guéable d'un rivage à l'autre.
// - Palissade : là où la palissade entre la région de départ et la Forêt enchantée plonge dans la mer, une fosse
//   profonde la prolonge ; on ne la contourne pas à gué.
// - Rendu : une image d'un pixel par case (teinte et opacité selon la profondeur), agrandie avec lissage par-dessus
//   l'eau animée et sous le sol : un dégradé continu, sans aucune case visible.
(() => {
  'use strict';
  // Profondeur (en cases) jusqu'à laquelle on avance dans l'eau.
  const WADE = 3.2;
  // Fosse au pied de la palissade : profondeur ajoutée près d'un tronc, décroissante sur PIT cases.
  const PIT = 7;
  // Fond du chenal qui sépare l'île de la terre du sud-ouest : toujours guéable.
  const STRAIT = 2.6;
  const SQ2 = Math.SQRT2;
  let depthFor = null,
    depthBridges = -1,
    depth = null,
    coast = null,
    overlay = null;

  // Distance de chanfrein (deux passes) depuis les cases où src est vrai ; Infinity ailleurs au départ.
  function chamfer(src) {
    const d = new Float32Array(MAPW * MAPH);
    for (let i = 0; i < d.length; i++) d[i] = src[i] ? 0 : Infinity;
    const relax = (i, j, w) => {
      if (d[j] + w < d[i]) d[i] = d[j] + w;
    };
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++) {
        const i = y * MAPW + x;
        if (x > 0) relax(i, i - 1, 1);
        if (y > 0) {
          relax(i, i - MAPW, 1);
          if (x > 0) relax(i, i - MAPW - 1, SQ2);
          if (x < MAPW - 1) relax(i, i - MAPW + 1, SQ2);
        }
      }
    for (let y = MAPH - 1; y >= 0; y--)
      for (let x = MAPW - 1; x >= 0; x--) {
        const i = y * MAPW + x;
        if (x < MAPW - 1) relax(i, i + 1, 1);
        if (y < MAPH - 1) {
          relax(i, i + MAPW, 1);
          if (x < MAPW - 1) relax(i, i + MAPW + 1, SQ2);
          if (x > 0) relax(i, i + MAPW - 1, SQ2);
        }
      }
    return d;
  }

  // Une des 8 voisines de la case i est dans le masque.
  function touches(mask, i) {
    const x = i % MAPW,
      y = (i - x) / MAPW;
    for (let j = -1; j <= 1; j++)
      for (let k = -1; k <= 1; k++) {
        const nx = x + k,
          ny = y + j;
        if (nx >= 0 && ny >= 0 && nx < MAPW && ny < MAPH && mask[ny * MAPW + nx]) return true;
      }
    return false;
  }
  function compute() {
    const world = game.world.overworld;
    if (!world) return null;
    if (depth && depthFor === world && depthBridges === BRIDGE_TILES.size) return depth;
    depthFor = world;
    depthBridges = BRIDGE_TILES.size;
    overlay = null;
    const N = MAPW * MAPH,
      wet = new Uint8Array(N),
      sea = new Uint8Array(N),
      wood = new Uint8Array(N),
      queue = [];
    for (let y = 0; y < MAPH; y++)
      for (let x = 0; x < MAPW; x++) {
        const i = y * MAPW + x,
          t = world[y][x];
        wet[i] = t === 0 || BRIDGE_TILES.has(i) ? 1 : 0;
        wood[i] = t === CANAAN_WOOD_TILE ? 1 : 0;
      }
    // Mer : l'eau reliée au bord de la carte.
    const seed = i => {
      if (wet[i] && !sea[i]) {
        sea[i] = 1;
        queue.push(i);
      }
    };
    for (let x = 0; x < MAPW; x++) {
      seed(x);
      seed((MAPH - 1) * MAPW + x);
    }
    for (let y = 0; y < MAPH; y++) {
      seed(y * MAPW);
      seed(y * MAPW + MAPW - 1);
    }
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k],
        x = i % MAPW;
      if (x > 0) seed(i - 1);
      if (x < MAPW - 1) seed(i + 1);
      if (i >= MAPW) seed(i - MAPW);
      if (i < N - MAPW) seed(i + MAPW);
    }
    const land = new Uint8Array(N);
    for (let i = 0; i < N; i++) land[i] = sea[i] ? 0 : 1;
    const toLand = chamfer(land),
      toWood = chamfer(wood);
    depth = new Float32Array(N);
    // Terre au bord de la mer : sa teinte sert au lissage du dégradé jusque sous la plage.
    coast = new Uint8Array(N);
    for (let i = 0; i < N; i++) coast[i] = !sea[i] && touches(sea, i) ? 1 : 0;
    for (let i = 0; i < N; i++) depth[i] = sea[i] ? toLand[i] + Math.max(0, PIT - toWood[i]) * 1.2 : 0;
    // Chenal de la terre du sud-ouest : guéable d'un rivage à l'autre (au plus STRAIT cases de fond), le fond
    // redescend peu à peu vers le large pour garder un dégradé continu.
    for (let i = 0; i < N; i++) {
      if (!sea[i] || depth[i] <= STRAIT) continue;
      const x = i % MAPW,
        s = canaanValleyStrait(x, (i - x) / MAPW);
      depth[i] = Math.min(depth[i], STRAIT + Math.max(0, s - 10) * 0.45);
    }
    return depth;
  }

  // Sur l'île (ni donjon, ni Tréfonds, ni maison).
  function onIsland() {
    return !game.world.instance && game.world.tiles === game.world.overworld && game.world.overworld;
  }
  // Profondeur de la case (0 : terre, lac ou hors de l'île).
  function depthAt(tx, ty) {
    if (!onIsland() || tx < 0 || ty < 0 || tx >= MAPW || ty >= MAPH) return 0;
    const d = compute();
    return d ? d[ty * MAPW + tx] : 0;
  }
  // Case de mer (sans pilotis) assez peu profonde pour y marcher.
  function wadeable(tx, ty) {
    const d = depthAt(tx, ty);
    return d > 0 && d <= WADE && game.world.tiles[ty][tx] === 0;
  }
  // Profondeur lissée à une position du monde (pixels), interpolée entre les centres des cases.
  function depthAtPoint(x, y) {
    if (!onIsland()) return 0;
    const fx = x / TS - 0.5,
      fy = y / TS - 0.5,
      x0 = Math.floor(fx),
      y0 = Math.floor(fy),
      u = fx - x0,
      v = fy - y0;
    const a = depthAt(x0, y0),
      b = depthAt(x0 + 1, y0),
      c = depthAt(x0, y0 + 1),
      e = depthAt(x0 + 1, y0 + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
  }
  // Pixels du héros sous l'eau (0 sur la terre ferme) : de 6 au bord jusqu'à 18 à la limite.
  function sink(x, y) {
    if (!wadeable(Math.floor(x / TS), Math.floor(y / TS))) return 0;
    const d = Math.max(0, depthAtPoint(x, y));
    return Math.round(6 + Math.min(1, d / WADE) * 12);
  }
  // Vitesse dans l'eau : on avance moins vite à mesure qu'elle monte.
  function speedAt(x, y) {
    if (!wadeable(Math.floor(x / TS), Math.floor(y / TS))) return 1;
    return 0.82 - 0.14 * Math.min(1, depthAtPoint(x, y) / WADE);
  }

  // Teinte selon la profondeur : turquoise sableux près du bord, transparent au milieu, bleu nuit au large.
  const SHALLOW = [70, 196, 196],
    DEEP = [6, 20, 52];
  function tint(d, shore) {
    if (d <= 0) return shore ? [...SHALLOW, 0.62] : [...SHALLOW, 0];
    if (d <= WADE + 1.3) {
      const k = Math.min(1, d / (WADE + 1.3));
      // Le turquoise s'efface vers le bleu de l'eau animée.
      return [SHALLOW[0], SHALLOW[1], SHALLOW[2], 0.62 * (1 - k) * (1 - k * 0.3)];
    }
    const k = Math.min(1, (d - WADE - 1.3) / 7);
    return [...DEEP, 0.5 * k];
  }
  function overlayImage() {
    if (overlay !== null) return overlay;
    overlay = false;
    const d = compute();
    if (!d || typeof document === 'undefined') return overlay;
    const cv = document.createElement('canvas');
    cv.width = MAPW;
    cv.height = MAPH;
    const g = cv.getContext?.('2d'),
      img = g?.createImageData?.(MAPW, MAPH),
      px = img?.data;
    if (!px || px.length !== MAPW * MAPH * 4) return overlay;
    for (let i = 0; i < MAPW * MAPH; i++) {
      const [r, gr, b, a] = tint(d[i], coast[i]);
      px[i * 4] = r;
      px[i * 4 + 1] = gr;
      px[i * 4 + 2] = b;
      px[i * 4 + 3] = Math.round(a * 255);
    }
    g.putImageData(img, 0, 0);
    cv.addEventListener?.('contextlost', () => (overlay = null));
    overlay = cv;
    return overlay;
  }
  // Dégradé de profondeur sur les cases visibles (x0..x1, y0..y1), après l'eau animée et avant le sol.
  function draw(c, x0, x1, y0, y1) {
    if (!onIsland()) return;
    const img = overlayImage();
    if (!img) return;
    // Une case de marge : le lissage interpole avec les voisines hors de l'écran.
    const sx = Math.max(0, x0 - 1),
      sy = Math.max(0, y0 - 1),
      ex = Math.min(MAPW, x1 + 1),
      ey = Math.min(MAPH, y1 + 1);
    if (ex <= sx || ey <= sy) return;
    const smooth = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in c) c.imageSmoothingQuality = 'high';
    // Le centre de chaque pixel de l'image tombe au centre de sa case.
    c.drawImage(img, sx, sy, ex - sx, ey - sy, sx * TS, sy * TS, (ex - sx) * TS, (ey - sy) * TS);
    c.imageSmoothingEnabled = smooth;
  }

  // Héros dans l'eau : le bas du sprite est voilé par l'eau, une ride fait le tour de sa taille.
  function drawWading(c, x, y, sinkPx, drawSprite) {
    const wl = Math.round(y + 18 - sinkPx);
    c.save();
    c.beginPath();
    c.rect(x - 200, wl - 400, 400, 400);
    c.clip();
    drawSprite();
    c.restore();
    c.save();
    c.beginPath();
    c.rect(x - 200, wl, 400, 200);
    c.clip();
    c.globalAlpha *= 0.28;
    drawSprite();
    c.restore();
    const t = typeof time === 'number' ? time : 0,
      w = 15 + Math.sin(t * 0.08) * 1.5;
    c.save();
    c.globalAlpha *= 0.7;
    c.strokeStyle = '#d8f4f0';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, wl, w, 4, 0, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha *= 0.5;
    c.beginPath();
    c.ellipse(x, wl + 1, w + 6 + ((t * 0.3) % 8), 6, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  window.CANAAN_SHALLOWS = { WADE, depthAt, wadeable, sink, speedAt, draw, drawWading };
})();
