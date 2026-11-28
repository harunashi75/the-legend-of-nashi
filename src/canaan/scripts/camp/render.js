// Dessin du Camp de l'Aurore : objets posés (avec leur ombre et ce qui cache un héros passé derrière), clôtures,
// lanternes, fontaine, quai et navire draconique, guirlandes et pétales. Les sprites sont dans client/art/camp-sprites.js,
// le sol dans scripts/camp/ground.js. Aucune règle ici : le plan est dans shared/data/camp.js, la pose, les collisions
// et les zones calmes dans scripts/camp/camp-life.js.
// camp-life.js appelle CANAAN_CAMP_RENDER.create(scène) une fois, puis use(pose) après chaque pose : sol, objets et
// origine du camp (lus à chaque image, jamais modifiés ici).
(() => {
  'use strict';
  function create({ key, hash }) {
    const T = TS;
    const OUT = '#22160e';
    // Pose courante (layout() de camp-life.js).
    let items = [],
      origin = { x: 0, y: 0 };

    // ---------------------------------------------------------------- Outils de dessin
    // Sprites des objets (client/art/camp-sprites.js).
    const {
      sprite,
      barnSprite,
      siloSprite,
      coopSprite,
      haySprite,
      cartSprite,
      appleSprite,
      crateSprite,
      basketSprite,
      logsSprite,
      woodpileSprite,
      chopSprite,
      forgeSprite,
      barberSprite,
      fountainSprite,
      pillarSprite,
      planterSprite,
      stallSprite,
      boardSprite,
      signpostSprite,
      benchSprite,
      birdbathSprite,
      springSprite,
      troughSprite,
      archSprite,
      scarecrowSprite,
      fenceSprite,
      fencePost,
      gateSprite
    } = CANAAN_CAMP_SPRITES;
    // Hauteur des objets du camp qui cachent un personnage passé derrière eux (pixels au-dessus de leur pied).
    const TALL_ITEMS = {
      barn: 270,
      silo: 220,
      coop: 150,
      wagon: 190,
      apple: 190,
      forge: 150,
      barber: 150,
      fountain: 160,
      stall: 110,
      board: 100,
      signpost: 112,
      lantern: 100,
      scarecrow: 90,
      woodpile: 60,
      hay: 60,
      cart: 60,
      birdbath: 70,
      bench: 50,
      planter: 46
    };
    let redrawing = false;
    function occluders() {
      if (game.world.instance || !items.length || canaanInHouse(P.x / TS, P.y / TS)) return [];
      const out = [];
      for (const it of items) {
        const hgt = TALL_ITEMS[it.kind];
        if (!hgt || it.part) continue;
        // Salon de coiffure : seul le mobilier (rangée du haut) cache ; le tapis devant reste au sol.
        const bottom = it.y + (it.kind === 'barber' ? 1 : it.h) * T;
        if (
          it.x + it.w * T < camX - 200 ||
          it.x > camX + W + 200 ||
          bottom < camY - 60 ||
          bottom - hgt > camY + H + 60
        )
          continue;
        out.push({
          x0: it.x - 30,
          x1: it.x + it.w * T + 30,
          y0: bottom - hgt,
          base: bottom - 8,
          draw: c => {
            redrawing = true;
            c.imageSmoothingEnabled = false;
            drawItem(c, it);
            redrawing = false;
          }
        });
      }
      return out;
    }
    function shadow(c, x, y, rx, ry, a = 0.3) {
      if (redrawing) return;
      c.globalAlpha = a;
      c.fillStyle = '#0a0806';
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
    }
    // Pose un sprite : son bas au point donné, centré.
    function put(c, s, x, y) {
      c.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height));
    }
    const rectOf = c => (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };

    // Sol (scripts/camp/ground.js).
    const GROUND = CANAAN_CAMP_GROUND.create({ key, hash, rectOf });

    // ---------------------------------------------------------------- Dessin des objets
    function drawFence(c, it) {
      const garden = it.kind === 'garden',
        rail = fenceSprite(garden),
        post = fencePost(garden),
        R = rectOf(c),
        [l, m, d] = garden ? ['#ffffff', '#ece6d8', '#9a9282'] : ['#b08858', '#8a6440', '#5e4430'],
        X = it.x,
        Y = it.y,
        w = it.w * T,
        h = it.h * T;
      // Fond : traverse du haut, puis les deux côtés (poteaux et longue traverse) ; devant : la traverse du bas.
      if (it.part === 'back') {
        for (let k = 0; k < it.w; k++) c.drawImage(rail, X + k * T, Y + 2, T, 44);
        for (const sx of [X + 20, X + w - 26]) {
          R(sx - 1, Y + 20, 8, h - T, OUT);
          R(sx, Y + 20, 6, h - T, m);
          R(sx, Y + 20, 2, h - T, l);
          R(sx + 5, Y + 20, 1, h - T, d);
          for (let k = 1; k < it.h; k++) c.drawImage(post, sx - 5, Y + k * T - 8, 16, 52);
        }
        return;
      }
      const by = Y + h - T,
        gate = it.mounts ? [] : garden ? it.gate.map(g => g + origin.x - it.tx) : [it.w - 3, it.w - 2];
      for (let k = 0; k < it.w; k++) if (!gate.includes(k)) c.drawImage(rail, X + k * T, by + 2, T, 44);
      if (gate.length && !garden) c.drawImage(gateSprite(), X + gate[0] * T, by - 4);
      for (const sx of [X + 20, X + w - 26]) c.drawImage(post, sx - 5, by - 8, 16, 52);
    }
    function drawLantern(c, x, y) {
      const R = rectOf(c);
      shadow(c, x, y + 4, 10, 4);
      R(x - 4, y - 46, 8, 50, OUT);
      R(x - 3, y - 45, 6, 48, '#5d4330');
      R(x - 3, y - 45, 2, 48, '#7a5a40');
      R(x + 1, y - 45, 2, 48, '#3e2c1e');
      R(x - 3, y - 48, 16, 4, OUT);
      R(x - 2, y - 47, 14, 2, '#4a4a52');
      R(x + 5, y - 46, 12, 18, OUT);
      R(x + 6, y - 45, 10, 16, '#4a4a52');
      const glow = 0.85 + Math.sin(time * 0.13 + x) * 0.15;
      c.globalAlpha = glow;
      R(x + 7, y - 42, 8, 11, '#ffd36b');
      R(x + 8, y - 41, 3, 6, '#fff1b5');
      c.globalAlpha = 1;
      R(x + 5, y - 49, 12, 4, '#3a3a40');
      canaanLight(x + 11, y - 36, 140, '#ffcf6a');
    }
    function drawFountainWater(c, x, y) {
      const R = rectOf(c);
      // Eau du bassin : reflets qui bougent et ronds sous la chute.
      c.save();
      c.beginPath();
      c.ellipse(x, y, 58, 28, 0, 0, Math.PI * 2);
      c.clip();
      for (let k = 0; k < 6; k++) {
        const s = (time * 0.5 + k * 23) % 140,
          ax = x - 56 + ((k * 37 + s) % 112),
          ay = y - 20 + ((k * 13) % 40);
        c.globalAlpha = 0.5;
        R(ax, ay, 10, 2, '#9fd8ec');
      }
      for (let k = 0; k < 2; k++) {
        const s = (time * 0.6 + k * 30) % 60;
        c.globalAlpha = (1 - s / 60) * 0.7;
        c.strokeStyle = '#cfefff';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(x, y + 2, 14 + s * 0.6, 6 + s * 0.25, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
    function drawSpout(c, x, top, bowl) {
      const R = rectOf(c);
      // Jet : des filets qui montent de la colonne et retombent dans la vasque, puis débordent dans le bassin.
      for (let k = 0; k < 16; k++) {
        const t = (time * 0.022 + k / 16) % 1,
          dir = [-1, 1, -0.5, 0.5][k % 4],
          dx = dir * 24 * t,
          dy = -14 * t + (bowl - top + 14) * t * t;
        c.globalAlpha = 0.95 - t * 0.4;
        R(x + dx - 1, top + dy, 3, 3, t < 0.15 ? '#ffffff' : '#bfe8f8');
      }
      for (let k = 0; k < 8; k++) {
        const t = (time * 0.03 + k / 8) % 1,
          side = k % 2 ? 1 : -1;
        c.globalAlpha = 0.8 - t * 0.5;
        R(x + side * (24 + t * 6), bowl + 2 + t * 34, 2, 4, '#bfe8f8');
      }
      c.globalAlpha = 1;
    }
    // ---------------------------------------------------------------- Quai et navire draconique
    // Quai peint d'une pièce en pixels de 2 : planches en travers en trois tons (reflet à gauche, joint sombre,
    // nœuds, clous, planches blanchies par le sel), longerons sur les deux bords, poteaux d'amarrage cerclés de
    // cordage au nord, pilotis couverts d'algues au sud, échelle et rouleau de corde au bout.
    const PIER_TOP = 14,
      PIER_BELOW = 16;
    let pierCanvas = null,
      pierKey = '';
    function pierArt(it) {
      const id = it.tx + ',' + it.ty;
      if (pierKey === id) return pierCanvas;
      pierKey = id;
      pierCanvas = null;
      if (typeof document === 'undefined') return null;
      const fw = it.w * 24,
        fh = it.h * 24,
        cv = document.createElement('canvas');
      cv.width = fw;
      cv.height = PIER_TOP + fh + PIER_BELOW;
      const g = cv.getContext('2d');
      if (!g || !g.fillRect) return null;
      const px = (x, y, col, w = 1, h = 1) => {
          g.fillStyle = col;
          g.fillRect(Math.round(x), Math.round(y), w, h);
        },
        top = PIER_TOP,
        bot = PIER_TOP + fh;
      // Ombre du tablier sur l'eau.
      px(0, bot, 'rgba(6,14,24,.45)', fw, 6);
      px(0, bot + 6, 'rgba(6,14,24,.2)', fw, 3);
      // Pilotis du bord sud : bois mouillé, bande d'algues à la ligne d'eau.
      for (let x = 4; x < fw; x += 24) {
        px(x - 1, bot - 1, OUT, 7, 13);
        px(x, bot, '#4a3020', 5, 11);
        px(x, bot, '#6e4c2e', 1, 11);
        px(x, bot + 7, '#2e5a44', 5, 2);
        px(x + 1, bot + 7, '#4a8a5a', 2, 1);
        px(x, bot + 9, '#22303a', 5, 2);
      }
      // Planches en travers.
      px(0, top, '#2a1a10', fw, fh);
      for (let x = 0, k = 0; x < fw; x += 6, k++) {
        const n = hash(it.tx * 31 + k, it.ty, 90),
          base = n < 0.12 ? '#b8a07e' : n < 0.45 ? '#8a5e38' : n < 0.78 ? '#9a6c42' : '#a87a4c',
          cut = hash(k, it.ty, 91) < 0.25 ? Math.floor(hash(k, it.ty, 92) * (fh - 8)) + top + 4 : -1;
        px(x, top + 3, base, 5, fh - 6);
        px(x, top + 3, n < 0.12 ? '#d8c4a0' : '#c39463', 1, fh - 6);
        px(x + 4, top + 3, '#6a4628', 1, fh - 6);
        // Joint d'about (deux planches bout à bout), nœuds et veinage.
        if (cut > 0) px(x, cut, '#2a1a10', 5, 1);
        if (hash(k, 3, 93) < 0.4) {
          const ky = top + 6 + hash(k, 4, 93) * (fh - 14);
          px(x + 2, ky, '#5a3a22', 2, 2);
          px(x + 2, ky, '#7a5232');
        }
        for (let v = 0; v < 2; v++) px(x + 1 + v * 2, top + 6 + hash(k, v, 94) * (fh - 16), '#b08458', 1, 4);
        // Clous au-dessus des longerons et des traverses.
        for (const ny of [top + 4, top + fh / 2, bot - 5]) {
          px(x + 2, ny, '#2e2a30');
          px(x + 2, ny - 1, '#9a9aa4');
        }
      }
      // Longerons nord et sud.
      px(0, top, '#5a3a24', fw, 3);
      px(0, top, '#8a6440', fw, 1);
      px(0, bot - 3, '#4a3020', fw, 3);
      px(0, bot - 3, '#7a5434', fw, 1);
      px(0, bot - 1, '#2a1a10', fw, 1);
      // Bout du quai : poutre de rive et échelle qui descend dans l'eau.
      px(0, top, '#4a3020', 3, fh);
      px(0, top, '#7a5434', 1, fh);
      for (let r = 0; r < 4; r++) {
        px(6, bot + r * 3, '#4a3020', 1, 3);
        px(12, bot + r * 3, '#4a3020', 1, 3);
        px(6, bot + r * 3 + 1, '#8a6440', 7, 1);
      }
      // Rouleau de corde près du bout.
      for (let r = 5; r >= 1; r -= 2) {
        for (let a = 0; a < Math.PI * 2; a += 0.35)
          px(
            18 + Math.cos(a) * r,
            top + 34 + Math.sin(a) * r * 0.6,
            r % 4 === 1 ? '#c8a86a' : '#8a6a3a',
            2,
            1
          );
      }
      // Filet de pêche replié vers la plage : ballot cerné d'encre, mailles en croisillons, flotteurs orange.
      {
        const nx = fw - 46,
          ny = top + 7;
        px(nx + 1, ny - 1, OUT, 18, 12);
        px(nx, ny, OUT, 20, 10);
        px(nx + 1, ny, '#4e5e50', 18, 9);
        px(nx + 2, ny + 1, '#5e705e', 16, 4);
        for (let k = 0; k < 18; k += 3) {
          for (let d = 0; d < 8; d++) {
            if (k + d < 18) px(nx + 1 + k + d, ny + 1 + d, '#8a9a7a');
            if (k - d >= 0) px(nx + 1 + k - d, ny + 1 + d, '#7a8a6c');
          }
        }
        for (const [fx, fy] of [
          [nx + 3, ny + 2],
          [nx + 11, ny + 5],
          [nx + 16, ny + 1]
        ]) {
          px(fx - 1, fy - 1, OUT, 4, 4);
          px(fx, fy, '#e0703a', 2, 2);
          px(fx, fy, '#ffb080');
        }
      }
      // Poteaux d'amarrage du bord nord, cerclés de cordage.
      for (let x = 16; x < fw - 8; x += 48) {
        px(x - 1, top - 12, OUT, 8, 17);
        px(x, top - 11, '#5a3a24', 6, 15);
        px(x, top - 11, '#8a6440', 2, 15);
        px(x + 5, top - 11, '#3a2618', 1, 15);
        px(x, top - 12, '#a87a4c', 6, 2);
        px(x - 1, top - 7, '#c8a86a', 8, 2);
        px(x - 1, top - 4, '#a88a52', 8, 2);
        px(x - 1, top - 6, '#8a6a3a', 8, 1);
      }
      pierCanvas = cv;
      return cv;
    }
    function drawPier(c, it) {
      const art = pierArt(it),
        R = rectOf(c);
      if (art) c.drawImage(art, it.x, it.y - PIER_TOP * 2, art.width * 2, art.height * 2);
      // Ronds dans l'eau autour des pilotis du bord sud.
      const by = it.y + it.h * T;
      for (let x = it.x + 8; x < it.x + it.w * T; x += 48) {
        const t = (time * 0.02 + x * 0.013) % 1;
        c.globalAlpha = (1 - t) * 0.55;
        R(x - 6 - t * 8, by + 18, 8, 2, '#cfefff');
        R(x + 12 + t * 8, by + 18, 8, 2, '#cfefff');
      }
      c.globalAlpha = 1;
    }
    // Le Souffle du Dragon, navire du capitaine Kaelor (pixels de 2, proue à gauche) : coque d'écailles d'obsidienne cerclée d'or et de pourpre,
    // boucliers le long du plat-bord, figure de proue en tête de dragon cornue (œil de braise, gueule ouverte), queue
    // relevée en poupe, château arrière éclairé, mât et voile pourpre frappée d'une éclipse aux ailes de dragon.
    const SHIP_W = 236,
      SHIP_H = 160,
      SHIP_WL = 156;
    const shipTop = x => 122 - 22 * Math.pow(Math.min(1, Math.abs(x - 120) / 80), 2.4),
      shipBottom = x => SHIP_WL - Math.max(0, Math.abs(x - 120) - 48) * 0.85;
    function shipSprite() {
      return sprite('navire-draconique', SHIP_W, SHIP_H, (R, D, E, L) => {
        // Polygone plein (règle pair-impair), case par case.
        const poly = (pts, col) => {
          const ys = pts.map(p => p[1]);
          for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
            for (
              let x = Math.floor(Math.min(...pts.map(p => p[0])));
              x <= Math.max(...pts.map(p => p[0]));
              x++
            ) {
              let inside = false;
              for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
                const [ax, ay] = pts[i],
                  [bx, by] = pts[j];
                if (ay > y + 0.5 !== by > y + 0.5 && x + 0.5 < ((bx - ax) * (y + 0.5 - ay)) / (by - ay) + ax)
                  inside = !inside;
              }
              if (inside) R(x, y, 1, 1, col);
            }
        };
        const bez = (a, b, d, n) => {
          const out = [];
          for (let i = 0; i <= n; i++) {
            const t = i / n,
              u = 1 - t;
            out.push([
              u * u * a[0] + 2 * u * t * b[0] + t * t * d[0],
              u * u * a[1] + 2 * u * t * b[1] + t * t * d[1]
            ]);
          }
          return out;
        };
        // Mât et vergue (derrière la voile et la coque).
        R(117, 4, 5, 120, '#4a3020');
        R(117, 4, 2, 120, '#7a5434');
        R(115, 2, 9, 4, '#c8902a');
        R(70, 16, 98, 4, '#4a3020');
        R(70, 16, 98, 1, '#7a5434');
        R(68, 15, 4, 6, '#c8902a');
        R(166, 15, 4, 6, '#c8902a');
        // Voile gonflée : lés pourpres, reflet à gauche, ombre en bas à droite, ourlet d'or.
        for (let y = 20; y <= 100; y++) {
          const b = Math.sin((Math.PI * (y - 20)) / 80) * 4,
            x0 = Math.round(76 - b),
            x1 = Math.round(162 + b);
          for (let x = x0; x <= x1; x++) {
            const bottom = 96 + Math.sin((Math.PI * (x - 76)) / 86) * 5;
            if (y > bottom) continue;
            const seam = (x - 76) % 14 === 0,
              edge = x <= x0 + 1 || x >= x1 - 1 || y >= bottom - 2,
              shade = (x - 76) / 86 + (y - 20) / 160;
            R(
              x,
              y,
              1,
              1,
              edge
                ? y >= bottom - 1
                  ? '#8a5a1a'
                  : '#e0a83a'
                : seam
                  ? '#6a1018'
                  : shade < 0.35
                    ? '#c03038'
                    : shade < 0.85
                      ? '#9a1e28'
                      : '#7a1620'
            );
          }
        }
        // Éclipse : couronne de feu, disque noir, liseré de lumière, et le dragon qui l'enlace de ses ailes.
        D(119, 54, 19, '#e06a20');
        D(119, 54, 17, '#ffc040');
        D(119, 54, 15, '#ffe8a0');
        D(119, 54, 14, '#140c16');
        for (let a = -1.2; a < 0.2; a += 0.08)
          R(119 + Math.cos(a) * 14, 54 + Math.sin(a) * 14, 1, 1, '#fff4c8');
        const wing = side => {
          const m = p => [119 + (p[0] - 119) * side, p[1]];
          poly(
            [
              [117, 56],
              [100, 36],
              [84, 28],
              [88, 40],
              [79, 42],
              [89, 50],
              [80, 56],
              [93, 60],
              [86, 68],
              [104, 66],
              [116, 64]
            ].map(m),
            '#140c16'
          );
          for (const [a, b] of [
            [
              [117, 56],
              [84, 28]
            ],
            [
              [116, 58],
              [79, 42]
            ],
            [
              [116, 61],
              [80, 56]
            ]
          ])
            L(...m(a), ...m(b), '#5a1018');
        };
        wing(1);
        wing(-1);
        E(119, 62, 3, 9, '#140c16');
        D(119, 49, 3, '#140c16');
        L(117, 47, 114, 42, '#140c16');
        L(121, 47, 124, 42, '#140c16');
        L(119, 70, 122, 80, '#140c16', 2);
        L(122, 80, 117, 88, '#140c16', 2);
        R(118, 49, 1, 1, '#ff6a20');
        R(120, 49, 1, 1, '#ff6a20');
        // Château arrière (au-dessus du plat-bord) : planches sombres, fenêtre éclairée.
        R(166, 92, 32, 20, '#3a2632');
        R(166, 92, 32, 3, '#c8902a');
        R(166, 92, 32, 1, '#ffd86a');
        R(166, 95, 2, 17, '#56405a');
        R(178, 99, 7, 7, '#1a1016');
        R(179, 100, 5, 5, '#ffb030');
        R(179, 100, 2, 2, '#fff0a0');
        // Coque : plat-bord d'or, bande pourpre, écailles d'obsidienne en quinconce, préceinte, ligne d'eau mouillée.
        for (let x = 40; x <= 200; x++) {
          const t = Math.round(shipTop(x)),
            b = Math.round(shipBottom(x));
          for (let y = t; y <= b; y++) {
            const r = y - t,
              end = Math.abs(x - 120) / 80;
            let col;
            if (r === 0) col = '#ffd86a';
            else if (r <= 2) col = '#c8902a';
            else if (r === 3) col = '#7a4a14';
            else if (r <= 5) col = '#8a1a24';
            else if (r === 17) col = '#d8343a';
            else if (r === 18) col = '#a01e2a';
            else if (r === 19) col = '#5a0e16';
            else if (y >= b - 3) col = (x * 7 + y) % 5 === 0 ? '#2e5a44' : '#1c2628';
            else {
              const row = Math.floor((r - 6) / 5),
                cy0 = (r - 6) % 5,
                cx0 = (x + (row % 2) * 3) % 6;
              col =
                cx0 === 0 || cy0 === 4
                  ? '#150e18'
                  : cy0 === 0
                    ? end > 0.75
                      ? '#3a2c40'
                      : '#55405c'
                    : end > 0.8 || cy0 === 3
                      ? '#221828'
                      : '#2e2236';
            }
            R(x, y, 1, 1, col);
          }
        }
        // Boucliers le long du plat-bord, pourpre et noir, umbo d'or.
        for (let x = 56, k = 0; x <= 160; x += 13, k++) {
          if (x > 108 && x < 130) continue;
          const y = Math.round(shipTop(x)) + 8;
          D(x, y, 5, '#e0a83a');
          D(x, y, 4, k % 2 ? '#a01e2a' : '#2a1d2e');
          R(x - 4, y, 9, 1, k % 2 ? '#7a1620' : '#140c16');
          D(x, y, 1.5, '#ffd86a');
          R(x - 2, y - 3, 2, 1, k % 2 ? '#e05058' : '#56405a');
        }
        // Queue relevée en poupe, enroulée, pointe en fer de lance.
        const tail = bez([196, 104], [222, 92], [212, 52], 26);
        tail.forEach(([x, y], i) => {
          const r = 6 - (i / tail.length) * 3.5;
          D(x, y, r, '#2e2236');
          D(x - r * 0.4, y - r * 0.3, r * 0.5, '#4a3a52');
        });
        tail.forEach(([x, y], i) => {
          if (i % 4 === 1 && i < 24)
            poly(
              [
                [x + 2, y - 2],
                [x + 9, y - 4],
                [x + 3, y + 3]
              ],
              '#a01e2a'
            );
        });
        poly(
          [
            [212, 52],
            [202, 44],
            [210, 30],
            [218, 44]
          ],
          '#a01e2a'
        );
        L(210, 32, 210, 48, '#d8343a');
        // Figure de proue : cou en S aux écailles de ventre dorées, tête cornue, gueule ouverte, crocs, œil de braise.
        const neck = bez([46, 112], [14, 92], [30, 54], 30);
        neck.forEach(([x, y], i) => {
          const r = 8 - (i / neck.length) * 3;
          D(x, y, r, '#2e2236');
        });
        neck.forEach(([x, y], i) => {
          const r = 8 - (i / neck.length) * 3;
          D(x - r * 0.45, y - r * 0.2, r * 0.45, '#4e3a56');
          if (i % 2 === 0) R(x + r * 0.5, y - 1, 3, 2, i % 4 ? '#c8902a' : '#8a5a1a');
          if (i % 5 === 2 && i > 3)
            poly(
              [
                [x - r + 1, y - 2],
                [x - r - 6, y - 4],
                [x - r + 1, y + 3]
              ],
              '#a01e2a'
            );
        });
        E(30, 49, 11, 8, '#2e2236');
        E(27, 46, 7, 4, '#4e3a56');
        poly(
          [
            [24, 42],
            [4, 46],
            [2, 50],
            [22, 52]
          ],
          '#2e2236'
        );
        R(4, 46, 16, 1, '#4e3a56');
        // Mâchoire basse ouverte : gueule pourpre, crocs.
        poly(
          [
            [26, 55],
            [8, 58],
            [6, 61],
            [28, 60]
          ],
          '#2e2236'
        );
        poly(
          [
            [22, 52],
            [3, 51],
            [7, 57],
            [26, 56]
          ],
          '#8a1a24'
        );
        for (const fx of [6, 11, 16]) {
          R(fx, 51, 1, 3, '#f0e8d8');
          R(fx + 2, 55, 1, 2, '#f0e8d8');
        }
        R(3, 47, 2, 1, '#140c16');
        // Cornes recourbées vers l'arrière, en os clair.
        L(30, 42, 40, 32, '#d8ccb0', 2);
        L(40, 32, 50, 28, '#b8a888', 1);
        L(34, 45, 46, 38, '#b8a888', 2);
        L(46, 38, 54, 37, '#8a7a60', 1);
        R(30, 42, 2, 1, '#f4ecd8');
        // Œil.
        R(20, 44, 5, 3, '#140c16');
        R(21, 44, 3, 2, '#ffb030');
        R(22, 44, 1, 1, '#fff0a0');
        // Crête de piquants le long de la tête.
        for (const [x, y] of [
          [36, 42],
          [40, 46],
          [42, 50]
        ])
          poly(
            [
              [x, y],
              [x + 6, y - 3],
              [x + 2, y + 3]
            ],
            '#a01e2a'
          );
        // Défenses de bois (pare-battages) pendues contre la coque, côté quai.
        for (const x of [76, 138, 172]) {
          const y = Math.round(shipTop(x)) + 20;
          L(x, Math.round(shipTop(x)) + 2, x, y, '#c8a86a');
          E(x, y + 4, 2.5, 4, '#8a6440');
          R(x - 1, y + 1, 1, 5, '#b08458');
        }
      });
    }
    function drawShip(c, it) {
      const s = shipSprite(),
        bob = Math.round(Math.sin(time * 0.035) * 2),
        cx = it.x + (it.w * T) / 2,
        wl = it.y + it.h * T - 4,
        // Le sprite (contour de 2 pixels compris) : sa ligne d'eau tombe sur wl.
        left = Math.round(cx - s.width / 2),
        top = wl - SHIP_WL * 2 - 2 + bob,
        at = (ax, ay) => [left + 2 + ax * 2, top + 2 + ay * 2],
        R = rectOf(c);
      // Reflet sombre de la coque sur l'eau.
      if (!redrawing) {
        c.globalAlpha = 0.28;
        c.fillStyle = '#060a14';
        c.beginPath();
        c.ellipse(cx, wl + 2, 172, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
      }
      // Haubans et étai : du haut du mât à la proue et à la poupe (derrière la voile, donc dessinés avant).
      const [mx, my] = at(119, 5),
        [bx, by] = at(46, 108),
        [sx, sy] = at(196, 100);
      c.strokeStyle = 'rgba(26,18,16,.85)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(mx, my);
      c.lineTo(bx, by);
      c.moveTo(mx, my);
      c.lineTo(sx, sy);
      c.moveTo(mx, my + 20);
      c.lineTo(...at(60, 104));
      c.moveTo(mx, my + 20);
      c.lineTo(...at(180, 96));
      c.stroke();
      c.drawImage(s, left, top);
      // Flamme au sommet du mât, qui claque au vent.
      const wind = typeof windAt === 'function' ? windAt(mx, my) : 0;
      c.fillStyle = OUT;
      c.beginPath();
      c.moveTo(mx, my - 6);
      for (let k = 0; k <= 6; k++)
        c.lineTo(mx + 6 + k * 7, my - 4 + k * 0.9 + Math.sin(time * 0.15 + k) * (2 + wind));
      for (let k = 6; k >= 0; k--)
        c.lineTo(mx + 6 + k * 7, my + 6 - k * 0.9 + Math.sin(time * 0.15 + k) * (2 + wind));
      c.closePath();
      c.fill();
      c.fillStyle = '#a01e2a';
      c.beginPath();
      c.moveTo(mx + 2, my - 4);
      for (let k = 0; k <= 6; k++)
        c.lineTo(mx + 6 + k * 7, my - 2 + k * 0.8 + Math.sin(time * 0.15 + k) * (2 + wind));
      for (let k = 6; k >= 0; k--)
        c.lineTo(mx + 6 + k * 7, my + 4 - k * 0.8 + Math.sin(time * 0.15 + k) * (2 + wind));
      c.closePath();
      c.fill();
      // Écume le long de la ligne d'eau.
      const x0 = left + 2 + 52 * 2,
        len = 136 * 2;
      for (let k = 0; k < 12; k++) {
        const u = (time * 0.35 + k * 23) % len;
        c.globalAlpha = 0.6 * Math.sin((Math.PI * u) / len);
        R(x0 + u, wl - 1 + (k % 2) * 3, 8, 2, '#dff4ff');
      }
      c.globalAlpha = 1;
      // Amarres : du plat-bord aux poteaux du quai.
      if (!redrawing) {
        c.strokeStyle = '#c8a86a';
        c.lineWidth = 2;
        for (const [ax, px] of [
          [62, it.x + 16 * 2 + 6],
          [184, it.x + (16 + 48 * 4) * 2 + 6]
        ]) {
          const [hx, hy] = at(ax, shipTop(ax) + 1),
            py = it.y + it.h * T - 4 * 2 - 6;
          c.beginPath();
          c.moveTo(hx, hy);
          c.quadraticCurveTo((hx + px) / 2, Math.max(hy, py) + 16, px, py);
          c.stroke();
        }
      }
      // Lueurs : œil du dragon, fenêtre du château arrière, braise de l'éclipse.
      const [ex, ey] = at(22, 45),
        [wx, wy] = at(181, 102);
      canaanLight(ex, ey, 60, '#ff9a30');
      canaanLight(wx, wy, 70, '#ffb040');
      canaanLight(...at(119, 54), 90, '#ff7a30');
      if (!redrawing && Math.hypot(P.x - cx, P.y - wl) < 420) {
        drawCanaanName(c, '🐉 ' + tt('Le Souffle du Dragon'), cx, top - 14, '#ffc890');
      }
    }
    const BIG = { barn: barnSprite, silo: siloSprite, coop: coopSprite, hay: haySprite, cart: cartSprite };
    function drawItem(c, it) {
      const X = it.x,
        Y = it.y,
        w = it.w * T,
        cx = X + w / 2,
        bottom = Y + it.h * T;
      switch (it.kind) {
        case 'barn':
        case 'silo':
        case 'coop':
        case 'hay':
        case 'cart':
          shadow(c, cx, bottom - 4, w * 0.5, 12);
          {
            // Grange, silo et poulailler : modèles en pixel art des maisons (building-art.js).
            const art =
              (it.kind === 'barn' || it.kind === 'silo' || it.kind === 'coop') &&
              CANAAN_BUILDING_ART.farm(it.kind, w);
            if (art)
              c.drawImage(
                art.canvas,
                Math.round(cx - art.canvas.width),
                Math.round(bottom + 4 - art.canvas.height * 2),
                art.canvas.width * 2,
                art.canvas.height * 2
              );
            else put(c, BIG[it.kind](), cx, bottom + (it.kind === 'barn' ? 2 : 0));
          }
          if (it.kind === 'barn') {
            canaanLight(X + 44, bottom - 70, 70, '#ffd36b');
            canaanLight(X + w - 44, bottom - 70, 70, '#ffd36b');
            if (Math.hypot(P.x - cx, P.y - bottom) < 360) {
              drawCanaanName(c, '🌾 ' + tt('Ferme de l’Aurore'), cx, Y - 74);
            }
          }
          if (it.kind === 'coop') {
            // Une plume qui volette devant la porte.
            const t = (time * 0.4) % 120;
            if (t < 50) rectOf(c)(cx + 10 + Math.sin(t * 0.2) * 6, bottom - 10 - t * 0.4, 3, 2, '#f4f0e8');
          }
          break;
        case 'wagon': {
          // Roulotte de la Ménagerie (mount-art.js) : son bas dépasse d'un peu les roues ; lanterne de la porte.
          const art = CANAAN_MOUNT_ART.wagon();
          shadow(c, cx, bottom - 6, w * 0.52, 10);
          if (art) c.drawImage(art, Math.round(cx - art.width / 2), Math.round(bottom - 2 - art.height + 8));
          canaanLight(cx - 20, bottom - 90, 90, '#ffd36b');
          if (Math.hypot(P.x - cx, P.y - bottom) < 360)
            drawCanaanName(c, '🐾 ' + tt('Ménagerie de l’Aurore'), cx, bottom - 194);
          break;
        }
        case 'pen':
        case 'garden':
          drawFence(c, it);
          break;
        case 'pier':
          drawPier(c, it);
          break;
        case 'ship':
          drawShip(c, it);
          break;
        case 'trough':
          shadow(c, cx, bottom - 8, 26, 6);
          put(c, troughSprite(), cx, bottom - 6);
          break;
        case 'scarecrow': {
          shadow(c, cx, bottom - 8, 16, 5);
          const s = scarecrowSprite(),
            bend = Math.sin(time * 0.03 + it.tx) * 0.04;
          c.save();
          c.translate(cx, bottom - 6);
          c.transform(1, 0, -bend, 1, 0, 0);
          c.drawImage(s, -s.width / 2, -s.height);
          c.restore();
          break;
        }
        case 'lantern':
          drawLantern(c, cx - 6, bottom - 8);
          break;
        case 'apple': {
          shadow(c, cx, bottom - 6, 36, 10);
          const s = appleSprite((it.tx + it.ty) % 3),
            bend =
              (typeof windAt === 'function' ? windAt(X, Y) * 0.03 : 0) + Math.sin(time * 0.04 + it.tx) * 0.02;
          c.save();
          c.translate(cx, bottom - 2);
          c.transform(1, 0, -bend, 1, 0, 0);
          // Pommier agrandi (une fois et demie : ses pixels de 2 deviennent des pixels de 3, nets), comme les arbres.
          c.drawImage(
            s,
            Math.round(-s.width * 0.75),
            Math.round(-s.height * 1.5),
            Math.round(s.width * 1.5),
            Math.round(s.height * 1.5)
          );
          c.restore();
          break;
        }
        case 'crates':
          for (let k = 0; k < it.h; k++) {
            shadow(c, cx, Y + (k + 1) * T - 6, 22, 5);
            put(c, crateSprite(), cx, Y + (k + 1) * T - 4);
          }
          break;
        case 'basket':
          shadow(c, cx, bottom - 8, 18, 5);
          put(c, basketSprite(), cx, bottom - 6);
          break;
        case 'logs':
          shadow(c, cx, bottom - 6, w * 0.5, 7);
          put(c, logsSprite(), cx, bottom - 2);
          break;
        case 'woodpile':
          shadow(c, cx, bottom - 6, w * 0.5, 8);
          put(c, woodpileSprite(), cx, bottom - 2);
          break;
        case 'forge': {
          shadow(c, cx, bottom - 8, w * 0.55, 10);
          const fs = forgeSprite(),
            k = fs.width / 100;
          put(c, fs, cx, bottom - 2);
          // Feu dans la gueule du fourneau (sprite dessiné à l'échelle k) : flammes qui dansent et lueur.
          const fx = cx - fs.width / 2 + 26 * k,
            fy = bottom - 2 - fs.height + 58 * k,
            f = Math.sin(time * 0.3) * 2;
          c.save();
          c.globalCompositeOperation = 'lighter';
          const g = c.createRadialGradient(fx, fy, 2, fx, fy, 34);
          g.addColorStop(0, 'rgba(255,170,60,.55)');
          g.addColorStop(1, 'rgba(255,90,20,0)');
          c.fillStyle = g;
          c.beginPath();
          c.arc(fx, fy, 34, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ff7a2a';
          c.fillRect(fx - 18, fy - 6 + f, 36, 14);
          c.fillStyle = '#ffd060';
          c.fillRect(fx - 10, fy - 2 - f, 20, 10);
          c.restore();
          if (typeof canaanLight === 'function') canaanLight(fx, fy, 90, '#ff9a40', 0.5);
          break;
        }
        case 'chop':
          shadow(c, cx, bottom - 8, 18, 5);
          put(c, chopSprite(), cx, bottom - 4);
          break;
        case 'fountain': {
          // Bassin (centre de l'eau à 72 pixels sous le haut de l'emprise), colonne et vasque, jets d'eau.
          const my = Y + 72;
          shadow(c, cx, bottom - 18, 76, 18);
          put(c, fountainSprite(), cx, bottom - 6);
          drawFountainWater(c, cx, my);
          put(c, pillarSprite(), cx, my + 16);
          drawSpout(c, cx, my - 72, my - 44);
          canaanLight(cx, my - 30, 100, '#9fd8ec');
          break;
        }
        case 'bench':
          shadow(c, cx, bottom - 10, 44, 6);
          put(c, benchSprite(), cx, bottom - 8);
          break;
        case 'planter':
          shadow(c, cx, bottom - 8, 20, 5);
          put(c, planterSprite((it.tx * 3 + it.ty) % 3), cx, bottom - 6);
          break;
        case 'barber': {
          const top = bottom - T;
          shadow(c, cx, top - 6, w * 0.52, 9);
          put(c, barberSprite(Math.floor(time / 12) % 4), cx, bottom - 4);
          if (Math.hypot(P.x - cx, P.y - bottom) < 360)
            drawCanaanName(c, '✂️ ' + tt('Salon de coiffure'), cx, bottom - 172);
          break;
        }
        case 'stall':
          shadow(c, cx, bottom - 8, w * 0.5, 8);
          put(c, stallSprite(), cx, bottom - 4);
          break;
        case 'board':
          shadow(c, cx, bottom - 8, 40, 6);
          put(c, boardSprite(), cx, bottom - 4);
          break;
        case 'signpost':
          shadow(c, cx, bottom - 8, 16, 5);
          put(c, signpostSprite(), cx, bottom - 4);
          break;
        case 'birdbath':
          shadow(c, cx, bottom - 10, 16, 5);
          put(c, birdbathSprite(), cx, bottom - 6);
          break;
        case 'arch':
          put(c, archSprite(), cx, bottom + 6);
          break;
        case 'spring': {
          put(c, springSprite(), X, Y + 30);
          const R = rectOf(c);
          for (let k = 0; k < 4; k++) {
            const t = (time * 0.05 + k / 4) % 1;
            c.globalAlpha = 1 - t;
            R(X - 6 + k * 3, Y + 20 + t * 22, 3, 4, '#cfefff');
          }
          c.globalAlpha = 1;
          break;
        }
      }
    }
    function draw(c) {
      if (game.world.instance || !items.length || canaanInHouse(P.x / TS, P.y / TS)) return;
      c.save();
      c.imageSmoothingEnabled = false;
      for (const it of items) {
        if (
          it.x + it.w * T < camX - 200 ||
          it.x > camX + W + 200 ||
          it.y + it.h * T < camY - 60 ||
          it.y > camY + H + 220
        )
          continue;
        drawItem(c, it);
      }
      drawGarlands(c);
      drawPetals(c);
      c.restore();
    }
    // Guirlandes de fanions tendues d'une maison du camp à l'autre, qui flottent au vent.
    const BUNTING = ['#e8483a', '#ffd060', '#56a648', '#4a84cc', '#f06a8a', '#fff4dc'];
    function garlandAnchors() {
      const ids = ['aubepines', 'marmite', 'echoppe'],
        list = ids.map(id => CANAAN_HOUSE.buildings().find(b => b.id === id)).filter(Boolean),
        pairs = [];
      for (let i = 0; i + 1 < list.length; i++) {
        const a = list[i],
          b = list[i + 1];
        pairs.push([(a.x + a.w) * TS - 10, (a.y + a.h) * TS - 70, b.x * TS + 10, (b.y + b.h) * TS - 70]);
      }
      return pairs;
    }
    let garlands = null,
      garlandsFor = null;
    function drawGarlands(c) {
      if (garlandsFor !== items) {
        garlands = garlandAnchors();
        garlandsFor = items;
      }
      for (const [x0, y0, x1, y1] of garlands) {
        if (
          Math.max(x0, x1) < camX - 100 ||
          Math.min(x0, x1) > camX + W + 100 ||
          Math.max(y0, y1) < camY - 100 ||
          Math.min(y0, y1) > camY + H + 100
        )
          continue;
        const len = Math.hypot(x1 - x0, y1 - y0),
          sag = 18 + len * 0.06,
          at = t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag];
        c.strokeStyle = '#3a2a1e';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x0, y0);
        c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1);
        c.stroke();
        const n = Math.max(3, Math.floor(len / 22));
        for (let k = 1; k < n; k++) {
          const t = k / n,
            [fx, fy] = at(t),
            sway = Math.sin(time * 0.09 + k * 1.3 + x0) * 3;
          c.fillStyle = '#22160e';
          c.beginPath();
          c.moveTo(fx - 7, fy);
          c.lineTo(fx + 7, fy);
          c.lineTo(fx + sway, fy + 15);
          c.closePath();
          c.fill();
          c.fillStyle = BUNTING[k % BUNTING.length];
          c.beginPath();
          c.moveTo(fx - 5, fy + 1);
          c.lineTo(fx + 5, fy + 1);
          c.lineTo(fx + sway, fy + 12);
          c.closePath();
          c.fill();
        }
      }
    }
    // Pétales qui volent au-dessus de la place et du jardin.
    function drawPetals(c) {
      const ox = (origin.x + 0.5) * T,
        oy = (origin.y - 4) * T;
      if (Math.abs(ox - camX - W / 2) > W + 400 || Math.abs(oy - camY - H / 2) > H + 400) return;
      const cols = ['#ffd0e0', '#ffffff', '#f6b0c8', '#fff0a0'];
      for (let k = 0; k < 18; k++) {
        const life = (time * 0.0025 + k * 0.137) % 1,
          x = ox - 520 + ((k * 211) % 1040) + life * 260 + Math.sin(time * 0.03 + k) * 18,
          y = oy - 300 + ((k * 137) % 600) + life * 120 + Math.cos(time * 0.025 + k * 2) * 12;
        c.globalAlpha = Math.sin(life * Math.PI) * 0.9;
        c.fillStyle = cols[k % cols.length];
        c.fillRect(Math.round(x), Math.round(y), 3, 2);
        c.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
      }
      c.globalAlpha = 1;
    }

    return Object.freeze({
      // Nouvelle pose : les images du sol gardées sont refaites.
      use(next) {
        ({ items, origin } = next);
        GROUND.use(next);
      },
      occluders,
      drawGround: GROUND.drawGround,
      drawFence,
      draw
    });
  }
  window.CANAAN_CAMP_RENDER = Object.freeze({ create });
})();
