// Reliefs, côtes et détails animés des biomes, sans modifier les collisions ni les ponts.
// Hasard fixe par case, et les quatre voisins (constantes : rien n'est créé à chaque image).
function coastHash(a, b, k = 0) {
  const n = Math.sin(a * 127.1 + b * 311.7 + k * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
const COAST_DX = [0, 1, 0, -1],
  COAST_DY = [-1, 0, 1, 0];
// Seule l'épaisseur du trait est remise en place après chaque case (pas de save/restore complet, coûteux par case).
// part : 0 tout, 1 seulement le fixe (gardé dans les blocs du sol), 2 seulement l'animé (redessiné à chaque image).
// Détails animés : le genre de chaque case est calculé une fois pour toute l'île (biome, côtés au bord de la mer,
// hasard), puis chaque image ne fait que lire un octet ; les transparences passent par globalAlpha (aucune chaîne de
// couleur créée à chaque image).
const COAST_LIVE = { codes: null, tiles: null, bridges: -1 };
function coastCode(x, y) {
  const t = game.world.tiles[y][x],
    h = coastHash;
  if (t === 0) {
    for (let i = 0; i < 4; i++) {
      const xx = x + COAST_DX[i],
        yy = y + COAST_DY[i];
      if (xx >= 0 && yy >= 0 && xx < MAPW && yy < MAPH && game.world.tiles[yy][xx] !== 0 && !BRIDGE_TILES.has(yy * MAPW + xx)) return h(x, y, 4) > 0.45 ? 2 : 0;
    }
    return h(x, y, 4) > 0.77 ? 2 : 0;
  }
  if (BRIDGE_TILES.has(y * MAPW + x)) return 0;
  if (t === 15) return 4;
  if (t === 18) return 5;
  let sea = 0;
  for (let i = 0; i < 4; i++) {
    const xx = x + COAST_DX[i],
      yy = y + COAST_DY[i];
    if (xx >= 0 && yy >= 0 && xx < MAPW && yy < MAPH && game.world.tiles[yy][xx] === 0) sea |= 1 << i;
  }
  let kind = 0;
  if (t !== 2 && t !== 4 && t !== 9) {
    const id = ZONES.indexOf(regionAt(x, y)),
      r = h(x, y, 7);
    if (id === 2) kind = h(x, y, 13) < 0.36 ? 6 : 0;
    else if (id === 3 && r > 0.45) kind = 7;
    else if (id === 5 && r > 0.6) kind = 8;
  }
  return kind | (sea << 4);
}
// pass : 0 tout, 1 seulement l'eau (dessinée sous le sol quand les transitions sont organiques), 2 seulement la terre.
function coastLive(c, x, y, pass = 0) {
  if (COAST_LIVE.tiles !== game.world.tiles || COAST_LIVE.bridges !== BRIDGE_TILES.size) {
    COAST_LIVE.codes = new Uint8Array(MAPW * MAPH).fill(255);
    COAST_LIVE.tiles = game.world.tiles;
    COAST_LIVE.bridges = BRIDGE_TILES.size;
  }
  const k = y * MAPW + x;
  let code = COAST_LIVE.codes[k];
  if (code === 255) code = COAST_LIVE.codes[k] = coastCode(x, y);
  if (!code) return;
  const px = x * TS,
    py = y * TS,
    phase = time * 0.028,
    h = coastHash,
    kind = code & 15,
    wet = kind === 1 || kind === 2 || kind === 4 || kind === 5,
    // Écume au bord des cases de terre : remplacée par le liseré des rivages organiques (world-blend.js).
    sea = pass === 2 ? 0 : code >> 4,
    keepWidth = c.lineWidth;
  if ((pass === 1 && !wet) || (pass === 2 && wet) || (!kind && !sea)) return;
  if (kind === 1) {
    c.globalAlpha = 0.3 + 0.2 * Math.sin(phase + x * 0.8 + y * 0.5);
    c.strokeStyle = '#a1f4ee';
    c.lineWidth = 3;
    c.beginPath();
    for (let j = 0; j < 2; j++) {
      const yy = py + 12 + j * 19 + Math.sin(phase + j + x) * 3;
      c.moveTo(px + 5, yy);
      c.quadraticCurveTo(px + 23, yy - 5, px + 43, yy);
    }
    c.stroke();
  } else if (kind === 2) {
    c.globalAlpha = 0.14 + 0.11 * Math.sin(phase * 0.7 + x);
    c.strokeStyle = '#83d6f1';
    c.lineWidth = 1.7;
    c.beginPath();
    // Position tirée au hasard dans la case : aucun alignement d'une case à l'autre.
    const a = py + 8 + h(x, y, 14) * 30 + Math.sin(phase + x) * 4,
      b = px + h(y, x, 15) * 18;
    c.moveTo(b, a);
    c.quadraticCurveTo(b + 13, a - 4, b + 27, a);
    c.stroke();
  } else if (kind === 4) {
    c.globalAlpha = 0.18 + 0.12 * Math.sin(phase + x * 0.7 + y);
    c.strokeStyle = '#cdf0e2';
    c.lineWidth = 2;
    c.beginPath();
    const yy = py + 16 + h(x, y, 2) * 16 + Math.sin(phase + x) * 2;
    c.moveTo(px + 8, yy);
    c.quadraticCurveTo(px + 22, yy - 4, px + 38, yy);
    c.stroke();
  } else if (kind === 5) {
    c.fillStyle = '#e8faff';
    for (let j = 0; j < 3; j++) {
      const twinkle = Math.sin(time * 0.06 + h(x, y, j) * 40);
      if (twinkle < 0.35) continue;
      c.globalAlpha = twinkle - 0.3;
      c.fillRect(px + 6 + h(x, y, j + 3) * 34, py + 6 + h(x, y, j + 6) * 34, 3, 3);
    }
  } else if (kind === 6) {
    // Brume : nappes rondes et floues qui dérivent lentement (une case sur trois environ).
    const mist = Math.sin(time * 0.01 + x * 0.35 + y * 0.2),
      sprite = coastMist();
    if (mist > 0.2 && sprite) {
      c.globalAlpha = (mist - 0.2) * 0.3;
      c.drawImage(sprite, px - 51 + Math.sin(time * 0.004 + y) * 14, py - 6 + h(x, y, 8) * 12);
    } else if (mist > 0.2) {
      c.globalAlpha = (mist - 0.2) * 0.22;
      c.fillStyle = '#d6e4e0';
      c.fillRect(px - 6, py + 8 + h(x, y, 8) * 12, TS + 12, 14);
    }
  } else if (kind === 7) {
    const s = h(x, y, 8),
      fall = (time * 0.35 + h(x, y, 9) * 200) % 60;
    c.fillStyle = ['#d9542f', '#e98a2c', '#efc145'][Math.floor(s * 3)];
    c.fillRect(px + 8 + s * 30 + Math.sin(time * 0.04 + x) * 4, py - 6 + fall, 4, 3);
  } else if (kind === 8) {
    const s = h(x, y, 8),
      glow = Math.sin(time * 0.05 + h(x, y, 11) * 30);
    if (glow > 0) {
      c.globalAlpha = glow * 0.7;
      c.fillStyle = '#b2ffec';
      c.fillRect(px + 8 + s * 30, py + 10 + Math.sin(time * 0.03 + x) * 6, 3, 3);
      c.globalAlpha = glow * 0.5;
      c.fillStyle = '#e8b4ff';
      c.fillRect(px + 34 - s * 20, py + 30, 2, 2);
    }
  }
  // Bord de mer : une écume qui ondule, continue d'une case à l'autre.
  if (sea) {
    c.globalAlpha = 0.35 + 0.2 * Math.sin(phase + x * 0.3 + y * 0.4);
    c.strokeStyle = '#e1f7e9';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      if (!(sea & (1 << i))) continue;
      const dx = COAST_DX[i],
        dy = COAST_DY[i];
      for (let k = 0; k <= 48; k += 4) {
        const w = 3 + 1.5 * Math.sin(((dx ? py : px) + k) * 0.13 + phase * 2);
        const qx = dx ? px + (dx > 0 ? 48 - w : w) : px + k,
          qy = dx ? py + k : py + (dy > 0 ? 48 - w : w);
        if (k) c.lineTo(qx, qy);
        else c.moveTo(qx, qy);
      }
    }
    c.stroke();
  }
  c.globalAlpha = 1;
  c.lineWidth = keepWidth;
}
// Sols où se posent les détails fixes (pas l'eau, les routes, la roche ni les bâtiments).
const COAST_LAND = new Set([1, 3, 5, 10, 11, 16, 17]);
// Taches douces (dégradés radiaux peints une fois) : ombre du sous-bois et nappe de brume.
let COAST_BLOB, COAST_MIST;
function coastSprite(w, h, stops) {
  const cv = typeof document !== 'undefined' && document.createElement('canvas');
  const g = cv?.getContext?.('2d');
  if (!g?.createRadialGradient) return null;
  cv.width = w;
  cv.height = h;
  g.translate(w / 2, h / 2);
  g.scale(1, h / w);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(-w / 2, -w / 2, w, w);
  return cv;
}
function coastBlob() {
  if (COAST_BLOB === undefined) COAST_BLOB = coastSprite(112, 112, [[0, 'rgba(8,26,14,.34)'], [0.55, 'rgba(8,26,14,.2)'], [1, 'rgba(8,26,14,0)']]);
  return COAST_BLOB;
}
function coastMist() {
  if (COAST_MIST === undefined) COAST_MIST = coastSprite(150, 54, [[0, 'rgba(220,234,230,1)'], [0.5, 'rgba(220,234,230,.55)'], [1, 'rgba(220,234,230,0)']]);
  return COAST_MIST;
}
function drawCoastLive(c, x, y, pass) {
  coastLive(c, x, y, pass);
}
function drawCoastDetail(c, x, y, t, part = 0) {
  if (part !== 1) coastLive(c, x, y);
  if (part === 2) return;
  // Partie fixe (gardée dans les blocs du sol) : textures naturelles propres à chaque biome.
  if (!COAST_LAND.has(t) || BRIDGE_TILES.has(y * MAPW + x)) return;
  const px = x * TS,
    py = y * TS,
    h = coastHash,
    id = ZONES.indexOf(regionAt(x, y)),
    r = h(x, y, 7),
    s = h(x, y, 8);
  if (id === 0 && r > 0.58) {
    // Plaines : touffes d'herbe claire.
    c.fillStyle = t === 1 ? '#3b8a4e' : '#c9a868';
    for (let j = 0; j < 3; j++) c.fillRect(px + 7 + j * 11 + s * 8, py + 25 + Math.sin(j * 4 + x) * 9, 3, 5);
  } else if (id === 1 && r > 0.5) {
    // Forêt ancienne : ombre douce du sous-bois (tache ronde et floue qui déborde sur les voisines) et feuilles mortes.
    const blob = coastBlob();
    if (blob) c.drawImage(blob, px + 24 - 56 + (s - 0.5) * 20, py + 24 - 56 + (h(x, y, 12) - 0.5) * 20);
    else {
      c.fillStyle = 'rgba(10,30,18,.22)';
      c.fillRect(px, py, TS, TS);
    }
    c.fillStyle = '#5b4a2c';
    c.fillRect(px + 10 + s * 24, py + 30, 4, 3);
  } else if (id === 3 && r > 0.45) {
    // Forêt automnale : tapis de feuilles (les feuilles qui tombent sont dans coastLive).
    c.fillStyle = ['#d9542f', '#e98a2c', '#efc145'][Math.floor(s * 3)];
    c.fillRect(px + 30 - s * 20, py + 36, 5, 3);
  } else if (id === 4 && r > 0.55 && t === 3) {
    // Désert : ondulations des dunes.
    const keepWidth = c.lineWidth;
    c.strokeStyle = 'rgba(160,120,62,.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px + 4, py + 18 + s * 12);
    c.quadraticCurveTo(px + 24, py + 12 + s * 12, px + 44, py + 18 + s * 12);
    c.stroke();
    c.lineWidth = keepWidth;
  }
}
