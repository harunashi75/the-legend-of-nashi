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
function drawCoastDetail(c, x, y, t, part = 0) {
  const still = part !== 2,
    live = part !== 1;
  const px = x * TS,
    py = y * TS,
    phase = time * 0.028,
    h = coastHash;
  if (t === 0) {
    if (!live) return;
    const keepWidth = c.lineWidth;
    c.fillStyle = 'rgba(17,92,144,.18)';
    c.fillRect(px, py, TS, TS);
    let near = false;
    for (let i = 0; i < 4 && !near; i++) {
      const xx = x + COAST_DX[i],
        yy = y + COAST_DY[i];
      near = xx >= 0 && yy >= 0 && xx < MAPW && yy < MAPH && game.world.tiles[yy][xx] !== 0 && !BRIDGE_TILES.has(yy * MAPW + xx);
    }
    if (near) {
      c.strokeStyle = 'rgba(161,244,238,' + (0.3 + 0.2 * Math.sin(phase + x * 0.8 + y * 0.5)) + ')';
      c.lineWidth = 3;
      for (let j = 0; j < 2; j++) {
        let yy = py + 12 + j * 19 + Math.sin(phase + j + x) * 3;
        c.beginPath();
        c.moveTo(px + 5, yy);
        c.quadraticCurveTo(px + 23, yy - 5, px + 43, yy);
        c.stroke();
      }
    } else if (h(x, y, 4) > 0.77) {
      c.strokeStyle = 'rgba(131,214,241,' + (0.14 + 0.11 * Math.sin(phase * 0.7 + x)) + ')';
      c.lineWidth = 1.7;
      c.beginPath();
      let a = py + 15 + Math.sin(phase + x) * 4;
      c.moveTo(px + 7, a);
      c.quadraticCurveTo(px + 20, a - 4, px + 34, a);
      c.stroke();
    }
    c.lineWidth = keepWidth;
    return;
  }
  if (BRIDGE_TILES.has(y * MAPW + x)) return;
  // Eau peu profonde du marais et lacs scintillants de la Forêt enchantée.
  if (t === 15 || t === 18) {
    if (!live) return;
    const keepWidth = c.lineWidth;
    if (t === 15) {
      c.strokeStyle = 'rgba(205,240,226,' + (0.18 + 0.12 * Math.sin(phase + x * 0.7 + y)) + ')';
      c.lineWidth = 2;
      c.beginPath();
      const yy = py + 16 + h(x, y, 2) * 16 + Math.sin(phase + x) * 2;
      c.moveTo(px + 8, yy);
      c.quadraticCurveTo(px + 22, yy - 4, px + 38, yy);
      c.stroke();
    } else {
      for (let k = 0; k < 3; k++) {
        const twinkle = Math.sin(time * 0.06 + h(x, y, k) * 40);
        if (twinkle < 0.35) continue;
        c.fillStyle = 'rgba(232,250,255,' + (twinkle - 0.3) + ')';
        c.fillRect(px + 6 + h(x, y, k + 3) * 34, py + 6 + h(x, y, k + 6) * 34, 3, 3);
      }
    }
    c.lineWidth = keepWidth;
    return;
  }
  const id = ZONES.indexOf(regionAt(x, y));
  // Côtés qui touchent la mer : un bit par côté.
  let sea = 0;
  for (let i = 0; i < 4; i++) {
    const xx = x + COAST_DX[i],
      yy = y + COAST_DY[i];
    if (xx >= 0 && yy >= 0 && xx < MAPW && yy < MAPH && game.world.tiles[yy][xx] === 0) sea |= 1 << i;
  }
  const keepWidth = c.lineWidth;
  // Bord de mer : une écume qui ondule, continue d'une case à l'autre (plus d'ovales posés sur la rive).
  if (sea && live) {
    c.strokeStyle = 'rgba(225,247,233,' + (0.35 + 0.2 * Math.sin(phase + x * 0.3 + y * 0.4)) + ')';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      if (!(sea & (1 << i))) continue;
      const dx = COAST_DX[i],
        dy = COAST_DY[i];
      c.beginPath();
      for (let k = 0; k <= 48; k += 4) {
        const w = 3 + 1.5 * Math.sin(((dx ? py : px) + k) * 0.13 + phase * 2);
        const qx = dx ? px + (dx > 0 ? 48 - w : w) : px + k,
          qy = dx ? py + k : py + (dy > 0 ? 48 - w : w);
        if (k) c.lineTo(qx, qy);
        else c.moveTo(qx, qy);
      }
      c.stroke();
    }
  }
  const r = h(x, y, 7),
    s = h(x, y, 8);
  // Chaque biome possède ses propres textures naturelles.
  if (t !== 2 && t !== 4 && t !== 9) {
    if (id === 0 && r > 0.58) {
      // Plaines : touffes d'herbe claire.
      if (!still) return void (c.lineWidth = keepWidth);
      c.fillStyle = t === 1 ? '#3b8a4e' : '#c9a868';
      for (let j = 0; j < 3; j++) {
        c.fillRect(px + 7 + j * 11 + s * 8, py + 25 + Math.sin(j * 4 + x) * 9, 3, 5);
      }
    } else if (id === 1 && r > 0.5) {
      // Forêt ancienne : ombre du sous-bois et feuilles mortes.
      if (!still) return void (c.lineWidth = keepWidth);
      c.fillStyle = 'rgba(10,30,18,.22)';
      c.fillRect(px, py, TS, TS);
      c.fillStyle = '#5b4a2c';
      c.fillRect(px + 10 + s * 24, py + 30, 4, 3);
    } else if (id === 2) {
      // Marais : brume qui dérive lentement.
      if (!live) return void (c.lineWidth = keepWidth);
      const mist = Math.sin(time * 0.01 + x * 0.35 + y * 0.2);
      if (mist > 0.2) {
        c.fillStyle = 'rgba(214,228,224,' + (mist - 0.2) * 0.22 + ')';
        c.fillRect(px - 6, py + 8 + s * 12, TS + 12, 14);
      }
    } else if (id === 3 && r > 0.45) {
      // Forêt automnale : feuilles qui tombent et tapis de feuilles.
      c.fillStyle = ['#d9542f', '#e98a2c', '#efc145'][Math.floor(s * 3)];
      const fall = (time * 0.35 + h(x, y, 9) * 200) % 60;
      if (live) c.fillRect(px + 8 + s * 30 + Math.sin(time * 0.04 + x) * 4, py - 6 + fall, 4, 3);
      if (still) c.fillRect(px + 30 - s * 20, py + 36, 5, 3);
    } else if (id === 4 && r > 0.55 && t === 3) {
      // Désert : ondulations des dunes.
      if (!still) return void (c.lineWidth = keepWidth);
      c.strokeStyle = 'rgba(160,120,62,.35)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px + 4, py + 18 + s * 12);
      c.quadraticCurveTo(px + 24, py + 12 + s * 12, px + 44, py + 18 + s * 12);
      c.stroke();
    } else if (id === 5 && r > 0.6) {
      // Forêt enchantée : lucioles et spores lumineuses.
      if (!live) return void (c.lineWidth = keepWidth);
      const glow = Math.sin(time * 0.05 + h(x, y, 11) * 30);
      if (glow > 0) {
        c.fillStyle = 'rgba(178,255,236,' + glow * 0.7 + ')';
        c.fillRect(px + 8 + s * 30, py + 10 + Math.sin(time * 0.03 + x) * 6, 3, 3);
        c.fillStyle = 'rgba(232,180,255,' + glow * 0.5 + ')';
        c.fillRect(px + 34 - s * 20, py + 30, 2, 2);
      }
    }
  }
  c.lineWidth = keepWidth;
}
