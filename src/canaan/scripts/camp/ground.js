// @ts-nocheck
// Sol du Camp de l'Aurore : ruisseau et mare, fleurs, place pavée, champs (blé, légumes, fruits) et jardin fleuri,
// peints case par case puis gardés en images. Aucune règle ici : la pose est dans scripts/camp/camp-life.js.
// render.js appelle CANAAN_CAMP_GROUND.create(outils) une fois, puis use(pose) après chaque pose.
(() => {
  'use strict';
  function create({ key, hash, rectOf }) {
    const T = TS;
    const OUT = '#22160e';
    const { sprite } = CANAAN_CAMP_SPRITES;
    // Pose courante (layout() de camp-life.js).
    let ground = new Map(),
      items = [],
      origin = { x: 0, y: 0 };

    // ---------------------------------------------------------------- Dessin du sol
    const WATER = ['#2a6f98', '#3d8fb8', '#9fd8ec'];
    function drawWaterTile(c, x, y, g, R) {
      const X = x * T,
        Y = y * T;
      const wet = (dx, dy) => {
        const n = ground.get(key(x + dx, y + dy));
        return (
          (n && (n.type === 'stream' || n.type === 'pond')) ||
          BRIDGE_TILES.has(key(x + dx, y + dy)) ||
          game.world.overworld[y + dy]?.[x + dx] === 0
        );
      };
      R(X, Y, T, T, WATER[1]);
      // Reflets qui descendent le courant ; ronds lents sur la mare.
      if (g.type === 'stream') {
        const t = time * 0.55;
        for (let k = 0; k < 3; k++) {
          const s = (t + k * 16 + hash(x, y, k) * 48) % 48,
            ax = X + 8 + hash(x, y, k + 3) * 30 + g.fx * (s - 24),
            ay = Y + 8 + hash(x, y, k + 6) * 30 + g.fy * (s - 24);
          c.globalAlpha = Math.sin((s / 48) * Math.PI) * 0.8;
          R(
            ax,
            ay,
            Math.abs(g.fx) > Math.abs(g.fy) ? 8 : 2,
            Math.abs(g.fx) > Math.abs(g.fy) ? 2 : 8,
            WATER[2]
          );
        }
        c.globalAlpha = 1;
      } else {
        const s = (time * 0.4 + hash(x, y, 1) * 200) % 200;
        if (s < 60) {
          c.globalAlpha = (1 - s / 60) * 0.5;
          c.strokeStyle = WATER[2];
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(X + 24, Y + 24, 4 + s * 0.3, 2 + s * 0.12, 0, 0, Math.PI * 2);
          c.stroke();
          c.globalAlpha = 1;
        }
      }
      if (hash(x, y, Math.floor(time / 40)) < 0.15)
        R(X + hash(x, y, 2) * 40, Y + hash(x, y, 4) * 40, 3, 3, '#e8f8ff');
      // Berges : terre, galets en trois tons et herbe qui déborde.
      const sides = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
      ];
      sides.forEach(([dx, dy], i) => {
        if (wet(dx, dy)) return;
        const hor = dy !== 0,
          bx = dx === 1 ? X + T - 8 : X,
          by = dy === 1 ? Y + T - 8 : Y;
        R(hor ? X : bx, hor ? by : Y, hor ? T : 8, hor ? 8 : T, '#6b5a3a');
        R(
          hor ? X : dx === 1 ? bx - 3 : bx + 8,
          hor ? (dy === 1 ? by - 3 : by + 8) : Y,
          hor ? T : 3,
          hor ? 3 : T,
          WATER[0]
        );
        for (let k = 0; k < 3; k++) {
          const o = 4 + k * 15 + hash(x, y, i * 3 + k) * 8,
            px = hor ? X + o : bx + 1,
            py = hor ? by + 1 : Y + o,
            w = 6 + hash(x, y, i + k) * 3;
          R(px - 1, py - 1, w + 2, 7, OUT);
          R(px, py, w, 5, k % 2 ? '#8a8a84' : '#9e9a90');
          R(px, py, w, 1, '#c4c0b4');
          R(px + w - 2, py + 1, 2, 4, '#5e5e5a');
        }
        for (let k = 0; k < 4; k++) {
          const o = 3 + k * 12 + hash(x, y, i + k + 9) * 6,
            px = hor ? X + o : dx === 1 ? X + T - 3 : X,
            py = hor ? (dy === 1 ? Y + T - 3 : Y) : Y + o;
          R(px, py, hor ? 3 : 3, hor ? 3 : 3, k % 2 ? '#5f9a3a' : '#7cb84a');
        }
      });
      // Nénuphars sur la mare.
      if (g.type === 'pond' && hash(x, y, 14) < 0.4) {
        const lx = X + 10 + hash(x, y, 15) * 22,
          ly = Y + 12 + hash(x, y, 16) * 20 + Math.sin(time * 0.03 + x) * 1.5;
        R(lx - 2, ly - 2, 20, 13, OUT);
        R(lx, ly, 16, 9, '#4f9a3a');
        R(lx, ly, 16, 3, '#78c050');
        R(lx + 13, ly + 6, 3, 3, '#2e6a26');
        R(lx + 7, ly, 3, 4, WATER[1]);
        if (hash(x, y, 17) < 0.5) {
          R(lx + 2, ly - 4, 8, 6, '#f6c0d8');
          R(lx + 3, ly - 6, 6, 3, '#ffffff');
          R(lx + 5, ly - 2, 2, 2, '#f0c040');
        }
      }
    }
    // Fleurs : tige, feuilles et pétales de chaque espèce.
    const PETALS = {
      tulipe: [
        ['#e0303a', '#ff7a7a'],
        ['#f0c030', '#fff08a'],
        ['#e86ab0', '#ffb0d8']
      ],
      marguerite: [['#ffffff', '#ffffff']],
      lavande: [['#9a6ad8', '#c8a8f0']],
      rose: [
        ['#c8203a', '#f05a70'],
        ['#f0a0b8', '#ffd0dc']
      ],
      bleuet: [['#3a6ae0', '#8ab0ff']],
      tournesol: [['#f0c020', '#ffe070']]
    };
    // Fleur à l'échelle des décors (pixels de 2) : tige, feuille, corolle cernée de sombre.
    function flower(R, kind, x, y, v, sway) {
      const [main, light] = PETALS[kind][v % PETALS[kind].length],
        S = (dx, dy, w, h, col) => R(x + dx * 2, y + dy * 2, w * 2, h * 2, col);
      if (kind === 'tournesol') {
        S(0, -14, 1, 14, '#4a8a2e');
        S(-3, -8, 3, 1, '#5aa83a');
        S(1, -6, 3, 1, '#3e7a2a');
        S(-3 + sway, -20, 8, 7, OUT);
        S(-2 + sway, -19, 6, 5, main);
        S(-2 + sway, -19, 6, 1, light);
        S(-1 + sway, -18, 3, 3, '#6a3a1a');
        return;
      }
      S(0, -5, 1, 5, '#4a8a2e');
      S(-2, -3, 2, 1, '#5aa83a');
      S(1, -2, 2, 1, '#3e7a2a');
      if (kind === 'lavande') {
        for (let k = 0; k < 4; k++) S(-1 + sway, -6 - k * 1.5, 3, 2, k % 2 ? main : light);
        return;
      }
      S(-2 + sway, -9, 5, 5, OUT);
      S(-1 + sway, -8, 3, 3, main);
      S(-1 + sway, -8, 2, 1, light);
      if (kind === 'marguerite' || kind === 'bleuet') S(sway, -7, 1, 1, '#f0c030');
      if (kind === 'tulipe') S(sway, -9, 1, 1, main);
    }
    function drawFieldTile(c, x, y, g, R, sway) {
      const X = x * T,
        Y = y * T;
      // La terre, la bordure et l'herbe autour sont peintes d'une pièce (fieldArt) ; la case ne pose que ses plantes.
      const same = (dx, dy) => {
        const n = ground.get(key(x + dx, y + dy));
        return n && n.type === 'field' && n.crop === g.crop;
      };
      if (g.crop === 'wheat') {
        // Épis en quatre rangs décalés : pied des tiges plus sombre (le volume du champ), épis en trois tons et barbes ;
        // au bord du champ, les épis sont plus clairsemés et plus bas.
        const edge = !same(0, -1) || !same(0, 1) || !same(-1, 0) || !same(1, 0);
        for (let r = 0; r < 4; r++)
          for (let k = 0; k < 6; k++) {
            const n = hash(x * 7 + k, y * 5 + r, 2);
            if (edge && n < 0.3) continue;
            const sx = X + 2 + k * 8 + (r % 2) * 4 + Math.floor(n * 3),
              base = Y + 16 + r * 10,
              hgt = 15 + Math.floor(hash(x + k, y + r, 3) * 9) - (edge ? 4 : 0),
              sw = sway + (n < 0.3 ? 1 : 0),
              top = base - hgt;
            R(sx, top + 2, 2, hgt - 2, r % 2 ? '#b8963c' : '#c8a446');
            R(sx + 1, top + hgt * 0.5, 1, hgt * 0.5, '#7a5e26');
            R(sx - 1 + sw, top - 7, 4, 9, '#7a5a22');
            R(sx + sw, top - 6, 3, 7, n < 0.5 ? '#e6c058' : '#f0cc66');
            R(sx + sw, top - 6, 1, 6, '#fde8a2');
            R(sx + 2 + sw, top - 3, 1, 4, '#b88e36');
            R(sx + 1 + sw, top - 10, 1, 4, '#d8b456');
            if (n > 0.6) R(sx - 1 + sw, top - 9, 1, 3, '#d8b456');
          }
        return;
      }
      // Plantes sur la butte ; chaque rang a son espèce.
      const kinds =
          g.crop === 'veg'
            ? ['carotte', 'chou', 'tomate', 'courge', 'salade']
            : ['fraise', 'melon', 'framboisier', 'pasteque', 'myrtille'],
        kind = kinds[g.row % 5];
      // Petites plantes deux par case ; les grosses une seule, décalée d'un rang à l'autre (la terre se voit entre elles).
      const small = ['carotte', 'salade', 'fraise'].includes(kind),
        spots = small ? [13, 35] : [(x + g.row) % 2 ? 18 : 30];
      for (let k = 0; k < spots.length; k++) {
        // Pas de plante collée à la bordure tressée.
        if ((!same(-1, 0) && spots[k] < 16) || (!same(1, 0) && spots[k] > 32)) continue;
        const s = plantSprite(kind, Math.floor(hash(x, y, k) * 2)),
          px = X + spots[k],
          py = Y + 40,
          tall = kind === 'tomate' || kind === 'framboisier' || kind === 'carotte';
        c.globalAlpha = 0.3;
        c.fillStyle = '#1a0e06';
        c.beginPath();
        c.ellipse(px, py - 2, s.width * 0.36, 4, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
        if (tall) {
          c.save();
          c.translate(px, py);
          c.transform(1, 0, -sway * 0.03, 1, 0, 0);
          c.drawImage(s, -Math.round(s.width / 2), -s.height);
          c.restore();
        } else c.drawImage(s, Math.round(px - s.width / 2), py - s.height);
      }
    }
    // ---------------------------------------------------------------- Champs (sol peint d'une pièce)
    // Pixels de 2, comme le jardin : terre aux coins arrondis, buttes en trois tons (reflet en haut, ombre en bas)
    // séparées par des sillons humides, mottes, cailloux et paille ; bordure tressée (plessis) tenue par des piquets,
    // touffes d'herbe qui débordent, panneau planté au coin et arrosoir. Le blé pousse sur un chaume doré, sans plessis.
    const FIELD_PAD = { x: 8, top: 18, bottom: 10 };
    const FIELD_ART = new Map();
    function fieldArt(it) {
      const id = it.tx + ',' + it.ty + ',' + it.crop;
      if (FIELD_ART.has(id)) return FIELD_ART.get(id);
      FIELD_ART.set(id, null);
      if (typeof document === 'undefined') return null;
      const fw = it.w * 24,
        fh = it.h * 24,
        ox = FIELD_PAD.x,
        oy = FIELD_PAD.top,
        cv = document.createElement('canvas');
      cv.width = fw + ox * 2;
      cv.height = fh + oy + FIELD_PAD.bottom;
      const g = cv.getContext('2d');
      if (!g || !g.fillRect) return null;
      const wheat = it.crop === 'wheat',
        seed = it.tx * 3 + it.ty,
        px = (x, y, col, w = 1, h = 1) => {
          g.fillStyle = col;
          g.fillRect(Math.round(x), Math.round(y), w, h);
        },
        // Rectangle aux coins arrondis (rayon r), agrandi de grow pixels ; le bord ondule un peu.
        inside = (x, y, grow = 0) => {
          const r = 7 + grow,
            lx = x - ox,
            ly = y - oy,
            wob = (hash(Math.floor(lx / 3), Math.floor(ly / 3), seed + 80) - 0.5) * 1.2;
          if (lx < -grow - wob || ly < -grow - wob || lx >= fw + grow + wob || ly >= fh + grow + wob)
            return false;
          const dx = Math.max(0, r - grow - lx, lx - (fw - 1 - r + grow)),
            dy = Math.max(0, r - grow - ly, ly - (fh - 1 - r + grow));
          return dx * dx + dy * dy <= r * r + wob * 4;
        },
        pick = (x, y, k, tones) => {
          const n = hash(x, y, seed + k);
          return n < 0.62 ? tones[0] : n < 0.82 ? tones[1] : tones[2];
        };
      // Ombre portée et lèvre de terre sombre tout autour.
      for (let y = 0; y < cv.height; y++)
        for (let x = 0; x < cv.width; x++) {
          if (inside(x, y)) continue;
          if (inside(x - 2, y - 3, 3)) px(x, y, 'rgba(10,8,6,.22)');
          if (inside(x, y, 2)) px(x, y, wheat ? '#5e4a22' : '#3e2a1a');
        }
      // Terre : sillon, reflet du haut de la butte, butte, ombre du bas ; chaque ton tramé de deux voisins.
      const SOIL = wheat
        ? {
            furrow: ['#7a5e2a', '#6a5024', '#86682e'],
            top: ['#b8984e', '#c8a85a', '#a88a44'],
            body: ['#9a7c3a', '#a88a44', '#8a6e32'],
            low: ['#7e6230', '#8a6e36', '#6e5428']
          }
        : {
            furrow: ['#4a3220', '#3e2a1a', '#56402a'],
            top: ['#a07448', '#b08456', '#946a42'],
            body: ['#7a5634', '#86603a', '#6e4c2e'],
            low: ['#5e4128', '#664830', '#523822']
          };
      for (let y = oy - 3; y < oy + fh + 3; y++)
        for (let x = ox - 3; x < ox + fw + 3; x++) {
          if (!inside(x, y)) continue;
          const yy = (((y - oy) % 24) + 24) % 24,
            part = yy <= 6 || yy === 23 ? 'furrow' : yy <= 8 ? 'top' : yy <= 18 ? 'body' : 'low';
          px(x, y, pick(x, y, 1, SOIL[part]));
        }
      // Mottes et cailloux sur les buttes, paille, flaques et cailloux dans les sillons.
      for (let i = 0; i < it.w * it.h * 14; i++) {
        const x = ox + hash(i, seed, 81) * fw,
          y = oy + hash(seed, i, 82) * fh,
          yy = Math.floor(y - oy) % 24;
        if (!inside(x, y) || !inside(x + 3, y + 2)) continue;
        const furrow = yy <= 5;
        if (wheat) {
          px(x, y, i % 2 ? '#d8b866' : '#6a5024', 2, 1);
          continue;
        }
        if (!furrow) {
          px(x, y, i % 3 ? '#8e6840' : '#5a3e26', 2, 2);
          px(x, y, i % 3 ? '#b88c5c' : '#7a5634');
        } else if (i % 5 === 0) {
          px(x, y + 1, '#3a4a50', 4, 2);
          px(x + 1, y + 1, '#7a98a4', 2, 1);
        } else if (i % 3 === 0) {
          px(x, y + 2, '#5e5a52', 2, 2);
          px(x, y + 2, '#b0a898');
        } else px(x, y + 2, '#c8a860', 3, 1);
      }
      // Plessis : osier tressé tout autour (trois tons qui se croisent, contour sombre), piquets en haut et en bas.
      if (!wheat) {
        for (let y = 0; y < cv.height; y++)
          for (let x = 0; x < cv.width; x++) {
            if (inside(x, y)) continue;
            if (inside(x, y, 2)) {
              const w = Math.floor((x + y * 2) / 2) % 3;
              px(x, y, ['#a8824c', '#80603a', '#5e4428'][w]);
            } else if (inside(x, y, 3)) px(x, y, OUT);
          }
        const stake = (x, y) => {
          px(x - 1, y - 6, OUT, 4, 9);
          px(x, y - 5, '#7a5634', 2, 8);
          px(x, y - 5, '#a8824c', 1, 7);
          px(x, y - 6, '#c8a06a', 2, 1);
        };
        for (let x = ox + 10; x < ox + fw - 8; x += 18) {
          stake(x, oy - 1);
          stake(x, oy + fh + 1);
        }
      }
      // Touffes d'herbe qui débordent sur la bordure.
      for (let i = 0; i < (fw + fh) * 0.9; i++) {
        const side = i % 4,
          t = hash(i, seed, 83),
          x =
            side < 2
              ? ox + t * fw
              : side === 2
                ? ox - 2 - hash(seed, i, 84) * 3
                : ox + fw + 1 + hash(seed, i, 84) * 3,
          y =
            side === 0
              ? oy - 2 - hash(seed, i, 84) * 3
              : side === 1
                ? oy + fh + 3 + hash(seed, i, 84) * 3
                : oy + t * fh;
        if (hash(i, seed, 85) < 0.45) continue;
        px(x, y - 2, '#5aa848', 1, 3);
        px(x + 1, y - 3, '#7ac85a', 1, 3);
        px(x - 1, y - 1, '#3e8a36', 1, 2);
      }
      if (!wheat) {
        // Panneau planté au coin haut-gauche : planche, piquet et la plante du champ peinte dessus.
        const sx = ox + 2,
          sy = oy - 4;
        px(sx + 4, sy - 6, OUT, 4, 12);
        px(sx + 5, sy - 6, '#6e4c2e', 2, 11);
        px(sx - 1, sy - 16, OUT, 14, 11);
        px(sx, sy - 15, '#b08456', 12, 9);
        px(sx, sy - 15, '#d0a676', 12, 1);
        px(sx, sy - 7, '#7a5634', 12, 1);
        if (it.crop === 'veg') {
          px(sx + 4, sy - 13, '#4a9a36', 1, 2);
          px(sx + 6, sy - 13, '#78c050', 1, 2);
          px(sx + 4, sy - 11, '#e8822a', 3, 2);
          px(sx + 5, sy - 9, '#c8601a', 1, 1);
        } else {
          px(sx + 5, sy - 13, '#4a9a36', 2, 1);
          px(sx + 4, sy - 12, '#d8303a', 4, 2);
          px(sx + 5, sy - 10, '#b81e2a', 2, 1);
          px(sx + 4, sy - 12, '#ff8a8a');
        }
        // Arrosoir posé au coin bas-droit.
        const ax = ox + fw + 1,
          ay = oy + fh + 6;
        px(ax - 1, ay - 7, OUT, 9, 8);
        px(ax, ay - 6, '#6a8a9a', 7, 6);
        px(ax, ay - 6, '#a8c8d4', 7, 1);
        px(ax + 5, ay - 6, '#4a6a7a', 2, 6);
        px(ax - 4, ay - 8, OUT, 4, 2);
        px(ax - 3, ay - 8, '#6a8a9a', 3, 1);
        px(ax + 1, ay - 10, OUT, 5, 4);
        px(ax + 2, ay - 9, '#6a8a9a', 3, 1);
      }
      FIELD_ART.set(id, cv);
      return cv;
    }
    function drawFields(c) {
      for (const it of items) {
        if (it.kind !== 'field') continue;
        const X = it.tx * T - FIELD_PAD.x * 2,
          Y = it.ty * T - FIELD_PAD.top * 2;
        if (X > camX + W || Y > camY + H || X + it.w * T + 40 < camX || Y + it.h * T + 70 < camY) continue;
        const art = fieldArt(it);
        if (art) c.drawImage(art, X, Y, art.width * 2, art.height * 2);
      }
    }
    // Légumes et fruits : sprites en trois tons, grain et contour (deux variantes par espèce).
    function plantSprite(kind, v) {
      const P = PLANTS[kind];
      return sprite('plante-' + kind + v, P.w, P.h, (R, D, E, L) => P.draw(R, D, E, L, v));
    }
    const LEAF = ['#2e6a26', '#4a9a36', '#78c050'];
    const PLANTS = {
      carotte: {
        w: 14,
        h: 14,
        draw(R, D, E, L, v) {
          // Fanes plumeuses, puis le haut orange de la racine qui dépasse de la terre.
          for (const [x1, y1, c] of [
            [2, 2, 0],
            [5, 0, 1],
            [7, 1, 2],
            [9, 0, 1],
            [12, 3, 0]
          ]) {
            L(7, 10, x1, y1, LEAF[c]);
            D(x1, y1 + 1, 1.6, LEAF[c]);
            D(x1 + (x1 < 7 ? 1 : -1), y1 + 3, 1.3, LEAF[(c + 1) % 3]);
          }
          E(7, 11.5, 4, 2.5, '#c8601a');
          E(6.5, 11, 3.5, 2, '#e8822a');
          R(5, 10, 3, 1, '#f8b060');
          R(4 + v, 12, 6, 1, '#a84a10');
        }
      },
      chou: {
        w: 16,
        h: 13,
        draw(R, D, E, L, v) {
          E(8, 8, 8, 5, '#2e6a26');
          E(8, 7.5, 7, 4.5, v ? '#4a8a3a' : '#5a9a6a');
          E(8, 6.5, 5, 3.5, v ? '#78b85a' : '#8ac0a0');
          E(8, 6, 3, 2.2, v ? '#b8e090' : '#c8e8d8');
          L(8, 6, 3, 10, '#2e6a26');
          L(8, 6, 13, 10, '#2e6a26');
          L(8, 6, 8, 11, '#2e6a26');
          R(6, 4, 2, 1, '#e8f8d0');
        }
      },
      tomate: {
        w: 14,
        h: 24,
        draw(R, D, E, L, v) {
          // Tuteur, tiges feuillues et grappes de tomates.
          R(6, 0, 2, 24, '#8a6440');
          R(6, 0, 1, 24, '#b08858');
          for (const [x, y, r] of [
            [4, 5, 3.5],
            [10, 8, 3.5],
            [3, 13, 3.5],
            [10, 16, 3.5],
            [6, 19, 3]
          ]) {
            D(x, y, r, LEAF[0]);
            D(x - 0.5, y - 0.5, r - 1, LEAF[1]);
            R(x - 1, y - 2, 2, 1, LEAF[2]);
          }
          for (const [x, y] of v
            ? [
                [3, 8],
                [11, 11],
                [4, 16],
                [9, 19]
              ]
            : [
                [10, 5],
                [4, 11],
                [11, 15],
                [5, 19]
              ]) {
            D(x, y, 2, '#b81a14');
            D(x - 0.3, y - 0.3, 1.5, '#e8382a');
            R(x - 1, y - 1, 1, 1, '#ffa090');
            R(x, y - 2, 1, 1, '#3a7a2a');
          }
        }
      },
      courge: {
        w: 18,
        h: 14,
        draw(R, D, E, L, v) {
          // Grande feuille derrière, courge côtelée, tige et vrille.
          E(4, 5, 4, 3, LEAF[0]);
          E(3.5, 4.5, 3, 2, LEAF[1]);
          E(14, 4, 3.5, 2.5, LEAF[1]);
          E(9, 9, 8, 5, v ? '#a8401a' : '#c0661a');
          E(9, 8.5, 7, 4.3, v ? '#d0601e' : '#e8902a');
          for (const x of [5, 9, 13]) R(x, 5, 1, 8, v ? '#a8401a' : '#c06a1a');
          E(6, 7, 1.5, 2.5, '#f8b860');
          R(8, 2, 2, 3, '#5a6a2a');
          R(8, 2, 1, 3, '#7a8a3a');
          L(10, 3, 13, 1, '#5a8a2e');
          R(13, 0, 2, 1, '#5a8a2e');
        }
      },
      salade: {
        w: 14,
        h: 11,
        draw(R, D, E, L, v) {
          E(7, 7, 7, 4, '#3e8a32');
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * Math.PI * 2;
            D(7 + Math.cos(a) * 5, 6.5 + Math.sin(a) * 2.8, 1.8, k % 2 ? '#78c050' : '#5aa83a');
          }
          E(7, 6, 3.5, 2.3, v ? '#a8dc78' : '#c86a8a');
          E(7, 5.5, 2, 1.3, v ? '#d8f4b0' : '#e8a0b8');
        }
      },
      fraise: {
        w: 16,
        h: 11,
        draw(R, D, E, L, v) {
          // Feuilles en trèfle, fraises en cœur avec leurs graines, une fleur blanche.
          for (const [x, y] of [
            [3, 4],
            [7, 2],
            [11, 3],
            [13, 6],
            [5, 7]
          ]) {
            D(x, y, 2.4, LEAF[0]);
            D(x - 0.4, y - 0.4, 1.8, LEAF[1]);
            R(x - 1, y - 1, 1, 1, LEAF[2]);
          }
          for (const [x, y] of v
            ? [
                [4, 8],
                [10, 8],
                [13, 9]
              ]
            : [
                [6, 8],
                [11, 7],
                [2, 9]
              ]) {
            R(x - 1, y - 1, 4, 3, '#c81a24');
            R(x, y + 2, 2, 1, '#c81a24');
            R(x - 1, y - 1, 2, 1, '#ff6a6a');
            R(x, y, 1, 1, '#f8e070');
            R(x + 2, y + 1, 1, 1, '#f8e070');
            R(x, y - 2, 2, 1, '#3a8a2a');
          }
          D(9, 4, 1.6, '#ffffff');
          R(9, 4, 1, 1, '#f0c030');
        }
      },
      melon: {
        w: 16,
        h: 12,
        draw(R, D, E, L, v) {
          E(3, 4, 3, 2, LEAF[1]);
          E(8, 7, 7.5, 4.8, '#9a9040');
          E(8, 6.6, 6.8, 4.3, '#c8b860');
          for (let k = 0; k < 5; k++) L(3 + k * 2.5, 3, 2 + k * 3, 11, '#e8dca0');
          L(2, 6, 14, 6, '#e8dca0');
          E(5.5, 5, 2, 1.5, '#f0e8b8');
          R(12, 2, 2, 2, '#5a7a2a');
        }
      },
      framboisier: {
        w: 16,
        h: 24,
        draw(R, D, E, L, v) {
          // Cannes sur un treillis, feuillage dentelé, framboises en grappes.
          R(1, 4, 1, 20, '#8a6440');
          R(14, 4, 1, 20, '#8a6440');
          R(1, 8, 14, 1, '#a07850');
          R(1, 15, 14, 1, '#a07850');
          for (const [x, y, r] of [
            [5, 6, 4],
            [11, 7, 4],
            [8, 12, 4.5],
            [4, 16, 4],
            [12, 17, 4],
            [8, 20, 3.5]
          ]) {
            D(x, y, r, LEAF[0]);
            D(x - 0.5, y - 0.6, r - 1.2, LEAF[1]);
            R(x - 2, y - 3, 2, 1, LEAF[2]);
          }
          for (const [x, y] of v
            ? [
                [4, 9],
                [11, 10],
                [7, 15],
                [12, 19],
                [3, 19]
              ]
            : [
                [6, 8],
                [12, 12],
                [4, 13],
                [9, 18],
                [13, 16]
              ]) {
            D(x, y, 1.6, '#a8102a');
            R(x - 1, y - 1, 1, 1, '#f0506a');
            R(x, y, 1, 1, '#d8203a');
          }
        }
      },
      pasteque: {
        w: 18,
        h: 12,
        draw(R, D, E, L, v) {
          E(15, 3, 3, 2, LEAF[1]);
          E(9, 7, 8.5, 5, '#1e4a1e');
          E(9, 6.6, 8, 4.5, '#2e6a2e');
          for (let k = -2; k <= 2; k++)
            for (let y = 3; y <= 10; y++)
              R(9 + k * 3 + Math.round(Math.sin((y - 6.5) * 0.5) * (k * 0.6)), y, 1, 1, '#5aa04a');
          E(6, 5, 2.5, 1.5, '#8ad07a');
          if (v) {
            // Une tranche ouverte posée devant.
            E(14, 10, 3, 1.6, '#2e6a2e');
            E(14, 9.6, 2.6, 1.2, '#e84a5a');
            R(13, 9, 1, 1, '#2a1a1a');
            R(15, 10, 1, 1, '#2a1a1a');
          }
        }
      },
      myrtille: {
        w: 16,
        h: 15,
        draw(R, D, E, L, v) {
          for (const [x, y, r] of [
            [8, 8, 6.5],
            [4, 10, 4],
            [12, 10, 4]
          ])
            D(x, y, r, '#2a5a2a');
          for (const [x, y, r] of [
            [7.5, 7, 5],
            [4, 9, 3],
            [12, 9, 3]
          ])
            D(x, y, r, '#3e7a36');
          D(6, 5, 2.5, '#5a9a46');
          for (let k = 0; k < 9; k++) {
            const x = 3 + ((k * 5 + v * 3) % 11),
              y = 5 + ((k * 3 + v) % 8);
            D(x + 0.5, y + 0.5, 1.2, '#3a4ab0');
            R(x, y, 1, 1, '#8a9af0');
          }
        }
      }
    };
    // Une case du sol du camp, dessinée dans c (le canevas du jeu, ou l'image gardée de la case).
    function paintGround(c, R, x, y, g, sway) {
      const X = x * T,
        Y = y * T;
      switch (g.type) {
        case 'stream':
        case 'pond':
          drawWaterTile(c, x, y, g, R);
          break;
        case 'plaza': {
          // Pavés en quinconce : joint sombre, pierre en trois tons.
          R(X, Y, T, T, '#5d564d');
          for (let r = 0; r < 2; r++) {
            const off = (y * 2 + r) % 2 ? 12 : 0;
            for (let k = -1; k < 2; k++) {
              const sx = Math.max(X + 1, X + k * 24 + off + 1),
                ex = Math.min(X + T - 1, X + k * 24 + off + 23),
                sy = Y + r * 24 + 1;
              if (ex - sx < 3) continue;
              R(sx, sy, ex - sx, 22, hash(x * 5 + k, y * 3 + r, 1) < 0.5 ? '#a39a8c' : '#958c7e');
              R(sx, sy, ex - sx, 3, '#c4bcae');
              R(sx, sy, 2, 22, '#b4ac9e');
              R(sx, sy + 19, ex - sx, 3, '#6e675d');
            }
          }
          if (g.edge) {
            c.globalAlpha = 0.35;
            R(X, Y, T, 2, '#2a241e');
            R(X, Y + T - 2, T, 2, '#2a241e');
            c.globalAlpha = 1;
          }
          break;
        }
        case 'field':
          drawFieldTile(c, x, y, g, R, sway);
          break;
        case 'mud': {
          // Flaque de boue aux bords arrondis, reflet d'eau qui luit.
          const left = ground.get(key(x - 1, y))?.type === 'mud',
            right = ground.get(key(x + 1, y))?.type === 'mud';
          c.fillStyle = '#4e3420';
          c.beginPath();
          c.ellipse(
            X + T / 2 + (left ? -6 : 0) + (right ? 6 : 0),
            Y + 26,
            left || right ? 30 : 20,
            13,
            0,
            0,
            Math.PI * 2
          );
          c.fill();
          c.fillStyle = '#6b4a2e';
          c.beginPath();
          c.ellipse(X + T / 2 - 4, Y + 23, 12, 6, 0, 0, Math.PI * 2);
          c.fill();
          R(X + 14 + Math.sin(time * 0.04 + x) * 2, Y + 30, 8, 2, '#9a8a6a');
          break;
        }
        case 'lawn':
          break;
        case 'gpath': {
          if (g.hidden) break;
          // Allée de terre battue et pas japonais ronds, aux couleurs des chemins.
          R(X, Y, T, T, '#b8925e');
          for (let k = 0; k < 10; k++)
            R(X + hash(x, y, k + 5) * 44, Y + hash(y, x, k + 6) * 44, 2, 2, k % 2 ? '#a07c4a' : '#cca674');
          for (let k = 0; k < 2; k++) {
            const sx = X + 8 + k * 18 + hash(x, y, k) * 4,
              sy = Y + 8 + k * 16 + hash(x, y, k + 2) * 4;
            R(sx - 1, sy + 1, 18, 12, OUT);
            R(sx + 1, sy - 1, 14, 16, OUT);
            R(sx, sy + 2, 16, 10, '#c8c0b0');
            R(sx + 2, sy, 12, 14, '#c8c0b0');
            R(sx + 2, sy + 1, 10, 3, '#e8e2d6');
            R(sx + 12, sy + 4, 3, 8, '#9a9284');
          }
          break;
        }
        case 'bed':
          R(X + 2, Y + 4, T - 4, T - 6, '#5a3e28');
          R(X + 2, Y + 4, T - 4, 2, '#8a6440');
          for (let k = 0; k < 6; k++)
            flower(R, g.flower, X + 9 + (k % 3) * 14, Y + 24 + Math.floor(k / 3) * 18, k + x, sway);
          break;
        case 'flowers':
          for (let k = 0; k < g.n; k++)
            flower(
              R,
              g.flower,
              X + 8 + hash(x, y, k + 20) * 30,
              Y + 22 + hash(x, y, k + 30) * 22,
              Math.floor(hash(x, y, k + 40) * 3),
              sway
            );
          break;
        case 'reeds':
          for (let k = 0; k < 4; k++) {
            const rx = X + 6 + k * 11 + hash(x, y, k) * 4,
              h = 16 + hash(x, y, k + 5) * 12,
              sw = Math.round(sway * (h / 14));
            R(rx, Y + 44 - h, 2, h, k % 2 ? '#5a8a3a' : '#7aa84a');
            if (k % 2 === 0) {
              R(rx - 1 + sw, Y + 40 - h, 4, 8, OUT);
              R(rx + sw, Y + 41 - h, 2, 6, '#6e4428');
            }
          }
          break;
      }
    }
    // Cases fixes (pavés, champs, allées, parterres, fleurs, roseaux) : une image par case et par position du vent,
    // gardée ; le camp ne redessine plus des milliers de petits rectangles à chaque image (épis de blé, plantes…).
    const OVER = 24;
    const STILL = new Set(['plaza', 'field', 'gpath', 'bed', 'flowers', 'reeds']);
    let groundImages = new Map();
    function groundImage(x, y, g, sway) {
      const id = key(x, y) * 16 + sway + 8;
      let img = groundImages.get(id);
      if (img) return img;
      img = document.createElement('canvas');
      img.width = T;
      img.height = T + OVER;
      const gc = img.getContext('2d');
      if (!gc?.translate) return null;
      gc.imageSmoothingEnabled = false;
      gc.translate(-x * T, -y * T + OVER);
      paintGround(gc, rectOf(gc), x, y, g, sway);
      groundImages.set(id, img);
      return img;
    }
    // ---------------------------------------------------------------- Jardin fleuri (sol peint d'une pièce)
    // Pixels de 2, comme les décors : allée de gravier courbe depuis l'arche, placette ronde pavée autour de la vasque,
    // embranchement vers le banc, pas japonais ronds, massifs aux bords arrondis cernés de galets, pleins de fleurs
    // mêlées (roses, tulipes, lavande, marguerites, bleuets, tournesols), touffes d'herbe qui débordent sur l'allée.
    let gardenCanvas = null,
      gardenKey = '';
    function gardenArt(gd) {
      const cw = (gd.w - 2) * 24,
        ch = (gd.h - 1) * 24,
        id = gd.tx + ',' + gd.ty;
      if (gardenKey === id) return gardenCanvas;
      gardenKey = id;
      gardenCanvas = null;
      if (typeof document === 'undefined') return null;
      const cv = document.createElement('canvas');
      cv.width = cw;
      cv.height = ch;
      const g = cv.getContext('2d');
      if (!g || !g.fillRect) return null;
      const px = (x, y, col, w = 1, h = 1) => {
          g.fillStyle = col;
          g.fillRect(Math.round(x), Math.round(y), w, h);
        },
        disc = (cx0, cy0, r, col, sq = 1) => {
          g.fillStyle = col;
          for (let y = -r; y <= r; y++) {
            const hw = Math.round(Math.sqrt(Math.max(0, r * r - y * y)) / sq);
            g.fillRect(
              Math.round(cx0 - hw),
              Math.round(cy0 + y * sq),
              hw * 2 + 1,
              Math.max(1, Math.round(sq))
            );
          }
        },
        // Case du jardin (depuis le camp) → centre en pixels d'art.
        at = (dx, dy) => [(origin.x + dx - gd.tx - 1) * 24 + 12, (origin.y + dy - gd.ty - 1) * 24 + 12],
        blob = (cx0, cy0, rx, ry, seed) => {
          const pts = [];
          for (let i = 0; i < 32; i++) {
            const a = (i / 32) * Math.PI * 2,
              k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 5 + seed * 2);
            pts.push([cx0 + Math.cos(a) * rx * k, cy0 + Math.sin(a) * ry * k]);
          }
          return pts;
        },
        inside = (pts, x, y) => {
          let c = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [ax, ay] = pts[i],
              [bx, by] = pts[j];
            if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
          }
          return c;
        };
      // Allée : courbe de Bézier depuis la porte, jusqu'à la placette de la vasque.
      const [gx] = at(-6, -14),
        gate = [gx + 12, ch + 4],
        [bx, by] = at(-1, -17),
        bench = at(-3, -18),
        path = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40,
          u = 1 - t;
        path.push([
          u * u * gate[0] + 2 * u * t * (gate[0] + 6) + t * t * (bx - 18),
          u * u * gate[1] + 2 * u * t * (by + 20) + t * t * (by + 6)
        ]);
      }
      const spur = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        spur.push([
          bx - 14 + (bench[0] + 12 - (bx - 14)) * t,
          by - 2 + (bench[1] + 16 - (by - 2)) * t - Math.sin(t * Math.PI) * 4
        ]);
      }
      const stroke = (pts, r, col) => pts.forEach(([x, y]) => disc(x, y, r, col));
      stroke(path, 10, '#8a6a42');
      stroke(spur, 7, '#8a6a42');
      disc(bx, by + 2, 24, '#8a6a42', 0.62);
      stroke(path, 8, '#c8a878');
      stroke(spur, 5, '#c8a878');
      // Placette ronde : pavés en anneaux autour de la vasque.
      disc(bx, by + 2, 22, '#d8d0c0', 0.62);
      for (let r = 6; r <= 20; r += 7)
        for (let a = 0; a < Math.PI * 2; a += 0.6 / (r / 8)) {
          const x = bx + Math.cos(a) * r,
            y = by + 2 + Math.sin(a) * r * 0.62;
          px(x, y, '#a8a090', 3, 1);
          px(x, y - 1, '#f0ebe0', 2, 1);
        }
      // Gravier et pas japonais ronds le long de l'allée.
      for (let i = 0; i < 260; i++) {
        const p = path[Math.floor(hash(i, 1, 61) * path.length)];
        px(
          p[0] + (hash(i, 2, 61) - 0.5) * 14,
          p[1] + (hash(i, 3, 61) - 0.5) * 14,
          i % 3 ? '#b0905e' : '#e0c896'
        );
      }
      for (let i = 4; i < path.length - 3; i += 6) {
        const [x, y] = path[i];
        disc(x + 1, y + 1, 4, '#6a6258', 0.7);
        disc(x, y, 4, '#c8c0b0', 0.7);
        px(x - 2, y - 2, '#ece6da', 3, 1);
      }
      // Massifs arrondis : terre, feuillage serré, fleurs mêlées, bordure de galets.
      const FL = {
        rose: [
          ['#c8203a', '#f05a70'],
          ['#f0a0b8', '#ffd0dc'],
          ['#ffffff', '#ffe8ec']
        ],
        tulipe: [
          ['#e0303a', '#ff7a7a'],
          ['#f0c030', '#fff08a'],
          ['#e86ab0', '#ffb0d8']
        ],
        lavande: [
          ['#9a6ad8', '#c8a8f0'],
          ['#7a5ac8', '#b098f0']
        ],
        champetre: [
          ['#ffffff', '#ffffff'],
          ['#3a6ae0', '#8ab0ff'],
          ['#f0c030', '#fff08a'],
          ['#e86ab0', '#ffb0d8']
        ]
      };
      const [l1x, l1y] = at(-3, -15),
        [r1x, r1y] = at(1, -16),
        [t1x, t1y] = at(-4, -18),
        [t2x, t2y] = at(0, -18);
      const beds = [
        [l1x + 6, l1y + 2, 40, 13, 'rose', 1],
        [r1x - 4, r1y + 8, 16, 22, 'champetre', 2],
        [t1x - 4, t1y + 4, 18, 9, 'tulipe', 3],
        [t2x + 2, t2y + 6, 12, 9, 'lavande', 4]
      ];
      for (const [cx0, cy0, rx, ry, kind, seed] of beds) {
        const pts = blob(cx0, cy0, rx, ry, seed);
        for (let y = Math.floor(cy0 - ry * 1.3); y <= cy0 + ry * 1.3; y++)
          for (let x = Math.floor(cx0 - rx * 1.3); x <= cx0 + rx * 1.3; x++)
            if (inside(pts, x + 0.5, y + 0.5)) px(x, y, hash(x, y, 62) > 0.5 ? '#4a3420' : '#5a3e28');
        // Feuillage.
        for (let i = 0; i < rx * ry * 0.9; i++) {
          const x = cx0 + (hash(i, seed, 63) - 0.5) * rx * 2,
            y = cy0 + (hash(seed, i, 64) - 0.5) * ry * 2;
          if (inside(pts, x, y)) px(x, y, ['#2e6a2a', '#3e8a36', '#5aa848'][i % 3], 2, 2);
        }
        // Fleurs : corolle en croix, cœur, tiges ; les tournesols et la lavande se dressent au fond.
        const pal = FL[kind];
        for (let i = 0; i < rx * ry * 0.22; i++) {
          const x = cx0 + (hash(i, seed, 65) - 0.5) * rx * 1.8,
            y = cy0 + (hash(seed, i, 66) - 0.5) * ry * 1.8;
          if (!inside(pts, x, y)) continue;
          const [m, l] = pal[Math.floor(hash(i, seed, 67) * pal.length)];
          if (kind === 'lavande') {
            for (let k = 0; k < 4; k++) px(x, y - k * 2, k % 2 ? m : l, 2, 2);
            continue;
          }
          px(x - 1, y, m, 3, 1);
          px(x, y - 1, m, 1, 3);
          px(x, y - 1, l);
          px(x, y, kind === 'champetre' && m === '#ffffff' ? '#f0c030' : l);
        }
        if (kind === 'champetre')
          for (let k = 0; k < 3; k++) {
            const x = cx0 - 6 + k * 6,
              y = cy0 - ry + 4;
            px(x, y, '#4a8a2e', 1, 10);
            disc(x, y - 1, 3, '#f0c020');
            disc(x, y - 1, 1, '#6a3a1a');
          }
        // Bordure de galets.
        for (let i = 0; i < pts.length; i++) {
          const [x, y] = pts[i],
            [nx, ny] = pts[(i + 1) % pts.length];
          for (let t = 0; t < 1; t += 0.5) {
            const sx = x + (nx - x) * t,
              sy = y + (ny - y) * t;
            px(sx - 1, sy, '#6a6258', 4, 3);
            px(sx - 1, sy - 1, hash(i, t * 10, 68) > 0.5 ? '#d8d0c4' : '#bab2a4', 3, 2);
          }
        }
      }
      // Touffes d'herbe qui débordent sur l'allée et la placette.
      for (let i = 0; i < path.length; i += 2) {
        const [x, y] = path[i];
        for (const side of [-1, 1]) {
          const tx = x + side * (8 + hash(i, side, 69) * 2),
            ty = y + (hash(side, i, 70) - 0.5) * 4;
          px(tx, ty - 2, '#5aa848', 1, 3);
          px(tx + 1, ty - 3, '#7ac85a', 1, 3);
          px(tx - 1, ty - 1, '#3e8a36', 1, 2);
        }
      }
      gardenCanvas = cv;
      return cv;
    }
    function drawGarden(c) {
      const gd = items.find(it => it.kind === 'garden');
      if (!gd) return;
      const mx = (gd.tx + gd.w / 2) * T,
        my = (gd.ty + gd.h / 2) * T;
      if (mx < camX - 500 || mx > camX + W + 500 || my < camY - 500 || my > camY + H + 500) return;
      const art = gardenArt(gd);
      if (art) c.drawImage(art, (gd.tx + 1) * T, (gd.ty + 1) * T, art.width * 2, art.height * 2);
    }
    const fieldSway = (x, y) =>
      Math.round(
        Math.sin(time * 0.05 + x * 0.9 + y * 0.4) * 1.5 +
          (typeof windAt === 'function' ? windAt(x * T, y * T) * 2 : 0)
      );
    function drawGround(c) {
      if (game.world.instance || !ground.size || canaanInHouse(P.x / TS, P.y / TS)) return;
      const x0 = Math.max(0, Math.floor(camX / T) - 1),
        x1 = Math.min(MAPW - 1, Math.ceil((camX + W) / T) + 1),
        y0 = Math.max(0, Math.floor(camY / T) - 1),
        y1 = Math.min(MAPH - 1, Math.ceil((camY + H) / T) + 1);
      if (x1 < origin.x - 32 || x0 > origin.x + 14 || y1 < origin.y - 24 || y0 > origin.y + 24) return;
      const R = rectOf(c);
      c.save();
      c.imageSmoothingEnabled = false;
      drawFields(c);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const g = ground.get(key(x, y));
          if (!g) continue;
          const X = x * T,
            Y = y * T,
            sway = Math.round(Math.sin(time * 0.05 + x * 1.3 + y * 0.7) * 1.2);
          const s =
            g.type === 'field' ? fieldSway(x, y) : g.type === 'plaza' || g.type === 'gpath' ? 0 : sway;
          if (STILL.has(g.type)) {
            const img = groundImage(x, y, g, s);
            if (img) {
              c.drawImage(img, X, Y - OVER);
              continue;
            }
          }
          paintGround(c, R, x, y, g, s);
        }
      drawGarden(c);
      // Pommes tombées sous les arbres du verger.
      for (const it of items) {
        if (it.kind !== 'apple') continue;
        for (let k = 0; k < 4; k++) {
          const ax = it.x + 24 + (hash(it.tx, it.ty, k) - 0.5) * 70,
            ay = it.y + 34 + hash(it.tx, it.ty, k + 4) * 14;
          R(ax - 1, ay - 1, 6, 6, OUT);
          R(ax, ay, 4, 4, '#c8281e');
          R(ax, ay, 1, 1, '#ff9a8a');
        }
      }
      c.restore();
    }

    return Object.freeze({
      // Nouvelle pose : les images du sol gardées sont refaites.
      use(next) {
        ({ ground, items, origin } = next);
        groundImages = new Map();
      },
      drawGround
    });
  }
  window.CANAAN_CAMP_GROUND = Object.freeze({ create });
})();
