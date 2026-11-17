// Camp de l'Aurore : seule zone sûre de l'île. Décor en pixel art autour du feu (souches, banc, torches), peint comme
// les objets des donjons et des raids : volumes en trois tons (reflet à gauche, ombre à droite), contour sombre,
// ombre au sol et la même flamme que les torches des donjons (CANAAN_TILE_KIT). Chaque objet a une emprise au sol
// qui bloque le passage (canaanCampBlocked, utilisé par canWalk via house.js) : héros, habitants et animaux en font
// le tour. Les bâtiments du camp (échoppe, cuisine, demeures) sont dans house.js.
(() => {
  const OUT = '#22160e',
    FLAME = ['#e5522e', '#f9a640', '#fff1b5'];
  // Objets autour du feu : position (pixels, depuis le centre du camp) et emprise au sol [x, y, largeur, hauteur].
  // canWalk ne teste que les quatre coins du personnage (à ±12 pixels) : chaque emprise fait au moins 26 pixels.
  // Le feu de camp et ses rondins ont laissé la place à la fontaine (camp-life.js) ; restent les torches.
  const PROPS = [
    { kind: 'torch', dx: -230, dy: 40, box: [-13, -12, 26, 26] },
    { kind: 'torch', dx: 230, dy: 40, box: [-13, -12, 26, 26] }
  ];
  const center = v => ({ x: (v.x + 0.5) * TS, y: (v.y + 0.5) * TS });
  function canaanCampBlocked(wx, wy) {
    // En donjon, la carte de l'instance réutilise les mêmes coordonnées.
    if (game.world.instance) return false;
    // Ferme, enclos, verger, jardin et fontaine (camp-life.js).
    if (canaanCampLife.blocked(wx, wy)) return true;
    for (const v of villages) {
      const o = center(v);
      if (Math.abs(wx - o.x) > 300 || Math.abs(wy - o.y) > 160) continue;
      for (const p of PROPS) {
        const [bx, by, bw, bh] = p.box,
          x = wx - o.x - p.dx,
          y = wy - o.y - p.dy;
        if (x >= bx && x < bx + bw && y >= by && y < by + bh) return true;
      }
    }
    return false;
  }
  function shadow(c, x, y, rx, ry) {
    c.globalAlpha = 0.3;
    c.fillStyle = '#0a0806';
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
  // Pierre du cercle du feu : trois tons et contour.
  function stone(R, x, y, w, h, k) {
    R(x - 1, y - 1, w + 2, h + 2, OUT);
    R(x, y, w, h, k % 3 ? '#8a8a84' : '#9e9a90');
    R(x, y, w, 2, '#c4c0b4');
    R(x, y, 2, h, '#b0aca0');
    R(x + w - 3, y + 2, 3, h - 2, '#5e5e5a');
  }
  // Bûche couchée : écorce, reflet sur le dessus, dessous à l'ombre, bout coupé avec ses cernes.
  function log(R, x, y, w, h, endLeft = true, endRight = true) {
    R(x - 2, y - 2, w + 4, h + 4, OUT);
    R(x, y, w, h, '#6e4c32');
    R(x, y, w, 2, '#9a7248');
    R(x, y + h - 3, w, 3, '#43301f');
    for (let k = 6; k < w - 6; k += 11) R(x + k, y + 3, 6, 1, '#563b28');
    for (const [on, ex] of [
      [endLeft, x - 2],
      [endRight, x + w - 6]
    ])
      if (on) {
        R(ex, y, 8, h, '#c9a06c');
        R(ex + 1, y + 1, 6, h - 2, '#e0bc88');
        R(ex + 2, y + Math.floor(h / 2) - 2, 4, 4, '#a87c4c');
        R(ex + 3, y + Math.floor(h / 2) - 1, 2, 2, '#c9a06c');
      }
  }
  // Feu de camp : lit de braises, cercle de pierres, bûches croisées, flamme des donjons, étincelles et lueur.
  function campFire(c, x, y) {
    const R = (dx, dy, w, h, col) => {
        c.fillStyle = col;
        c.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
      },
      K = CANAAN_TILE_KIT;
    shadow(c, x, y + 8, 36, 14);
    c.fillStyle = '#2a1c14';
    c.beginPath();
    c.ellipse(x, y + 5, 24, 10, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 6; k++)
      R(-16 + k * 6, 3 + (k % 2) * 3, 4, 2, (time + k * 7) % 30 < 15 ? '#ff7a2a' : '#c84a1a');
    // Pierres du fond, bûches, flammes, puis pierres de devant (devant les bûches).
    const stones = Array.from({ length: 12 }, (_, k) => {
      const a = (k * Math.PI * 2) / 12;
      return { k, sx: Math.cos(a) * 28 - 6, sy: Math.sin(a) * 13 + 2, back: Math.sin(a) < 0 };
    });
    for (const s of stones) if (s.back) stone(R, s.sx, s.sy, 12, 9, s.k);
    log(R, -22, -2, 44, 9);
    log(R, -14, 3, 30, 8, true, false);
    K.flame(c, x, y + 2, 1.9, FLAME, 0);
    K.flame(c, x - 10, y + 4, 1.1, FLAME, 3);
    K.flame(c, x + 10, y + 4, 1.2, FLAME, 6);
    for (let k = 0; k < 4; k++) {
      const rise = (time * 0.7 + k * 19) % 70;
      c.globalAlpha = 1 - rise / 70;
      R(Math.sin(time * 0.05 + k * 2) * 10 - 1, -38 - rise, 3, 3, k % 2 ? '#ffd36b' : '#ff9a40');
    }
    c.globalAlpha = 1;
    for (const s of stones) if (!s.back) stone(R, s.sx, s.sy, 12, 9, s.k);
    canaanLight(x, y - 14, 280 + Math.sin(time * 0.21) * 18, '#ffa040');
  }
  // Souche : cylindre en trois tons, écorce rainurée, dessus coupé avec ses cernes, racines.
  function campStump(c, x, y) {
    const R = (dx, dy, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    };
    shadow(c, x + 2, y + 12, 20, 6);
    R(-17, 6, 34, 8, OUT);
    R(-16, 7, 8, 5, '#5a3e28');
    R(8, 7, 8, 5, '#4a3220');
    R(-15, -16, 30, 28, OUT);
    R(-13, -10, 26, 20, '#6e4c32');
    R(-13, -10, 5, 20, '#8a6440');
    R(6, -10, 7, 20, '#4a3220');
    for (const gx of [-6, 0, 4]) R(gx, -8, 1, 16, '#563b28');
    R(-13, -14, 26, 7, '#c9a06c');
    R(-11, -13, 22, 5, '#e0bc88');
    R(-7, -12, 14, 3, '#b8905f');
    R(-3, -11, 6, 1, '#d8b585');
  }
  // Banc : une grosse bûche posée sur deux cales.
  function campBench(c, x, y) {
    const R = (dx, dy, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    };
    shadow(c, x, y + 12, 56, 8);
    for (const sx of [-40, 30]) {
      R(sx - 1, 3, 12, 12, OUT);
      R(sx, 4, 10, 10, '#4c3627');
      R(sx, 4, 3, 10, '#6a4a32');
    }
    log(R, -48, -12, 96, 18);
  }
  // Torche sur poteau : poteau en trois tons, collier de fer, flamme des donjons.
  function campTorch(c, x, y) {
    const R = (dx, dy, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    };
    shadow(c, x, y + 8, 10, 4);
    R(-5, -32, 10, 44, OUT);
    R(-4, -31, 8, 42, '#5d4330');
    R(-4, -31, 2, 42, '#7a5a40');
    R(2, -31, 2, 42, '#3e2c1e');
    R(-8, -38, 16, 9, OUT);
    R(-7, -37, 14, 7, '#4a4a52');
    R(-7, -37, 14, 2, '#6a6a72');
    CANAAN_TILE_KIT.flame(c, x, y - 37, 1.1, FLAME, x);
    canaanLight(x, y - 46, 170, '#ffcf6a');
  }
  const DRAW = { fire: campFire, stump: campStump, bench: campBench, torch: campTorch };
  function drawCampAurore(c) {
    if (game.world.instance) return;
    for (const v of villages) {
      const { x, y } = center(v);
      if (x < camX - 400 || x > camX + W + 400 || y < camY - 400 || y > camY + H + 400) continue;
      c.save();
      c.imageSmoothingEnabled = false;
      // Du fond vers l'avant, pour que les objets proches passent devant.
      for (const p of [...PROPS].sort((a, b) => a.dy - b.dy)) DRAW[p.kind](c, x + p.dx, y + p.dy);
      c.textAlign = 'center';
      c.font = 'bold 16px monospace';
      c.lineWidth = 4;
      c.strokeStyle = '#131b24';
      c.strokeText('✦ ' + v.name.toUpperCase() + ' ✦', x, y - 200);
      c.fillStyle = '#ffd98a';
      c.fillText('✦ ' + v.name.toUpperCase() + ' ✦', x, y - 200);
      c.restore();
    }
  }
  // Noms publics du module ; tout le reste est privé.
  Object.assign(window, { drawCampAurore, canaanCampBlocked });
})();
