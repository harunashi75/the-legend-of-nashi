// Dessin des donjons, des raids et de l'Arène : textures et cases en pixel art, décor, objets de l'exploration
// (portes, leviers, braseros, stèles…), portail de sortie, gradins de l'Arène, entrées sur l'île et ambiance. Aucune
// règle ici : les plans, les énigmes et les boss sont dans scripts/dungeons/dungeons.js ; la structure, les créatures
// et la palette de chaque instance (sols, murs, lumière, flammes, runes, bannières…) dans sa fiche de
// shared/data/dungeons/.
// dungeons.js appelle CANAAN_DUNGEON_RENDER.create(scène) une fois : la scène lui donne les cases, les plans,
// l'état de l'exploration et les sorties (lus au moment du dessin, jamais modifiés ici).
(() => {
  'use strict';
  function create(scene) {
    const {
      WALL,
      GATE,
      FLOOR,
      ACCENT,
      HAZARD,
      SECRET,
      WALKABLE,
      SIGILS,
      exitSpot,
      exitNear,
      planFor,
      dunState,
      reachable,
      beamPath,
      trapPhase,
      trapZones,
      secretOpen,
      hostTime
    } = scene;

    // Thème complet d'une instance : plan, créatures et apparence de sa fiche (shared/data/dungeons/).
    const theme = (layout, actors, palette) => ({
      ...layout,
      ...actors,
      ...palette,
      hazard: { ...layout.hazard, ...palette.hazard },
      accent: { ...layout.accent, ...palette.accent }
    });
    const THEMES = DUNGEON_LAYOUTS.map((layout, i) => theme(layout, DUNGEON_ACTORS[i], DUNGEON_PALETTES[i]));
    THEMES.arena = theme(DUNGEON_ARENA_LAYOUT, { mobs: [], bosses: [] }, DUNGEON_ARENA_PALETTE);
    // Gradins du colisée : rangées de grès et public animé, sur l'anneau de murs autour de la piste.
    const CROWD = ['#7a1424', '#2a4a7a', '#c8a050', '#3a6a3a', '#6a3a7a', '#a85a2a', '#d8d0c0', '#4a4a52'];
    function drawArenaStands(c) {
      const { cx, cy, r } = DUNGEON_ARENA,
        cheer = CANAAN_ARENA.cheer();
      for (let y = cy - 20; y <= cy + 15; y++)
        for (let x = cx - 20; x <= cx + 20; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d < r + 0.6 || d > r + 7 || game.world.tiles[y]?.[x] !== WALL) continue;
          if (game.world.tiles[y + 1]?.[x] !== WALL) continue;
          const X = x * TS,
            Y = y * TS;
          if (X < camX - TS || X > camX + W || Y < camY - TS || Y > camY + H) continue;
          const band = Math.floor(d - r);
          R(c, X, Y, TS, TS, band % 2 ? '#7a6248' : '#8a7052');
          R(c, X, Y, TS, 4, band % 2 ? '#a08462' : '#b0946e');
          R(c, X, Y + 26, TS, 3, '#5a4632');
          if (band > 5) continue;
          for (let k = 0; k < 3; k++) {
            const hsh = hash(x, y, k);
            if (hsh < 0.18) continue;
            const px = X + 6 + k * 14,
              jump =
                cheer > 0 && hash(x, k, y) < 0.7 ? Math.abs(Math.sin(time * 0.35 + hsh * 9)) * 6 * cheer : 0,
              py = Y + 6 + (hsh > 0.6 ? 18 : 0) - jump;
            R(c, px, py + 7, 10, 9, CROWD[Math.floor(hsh * 97) % CROWD.length]);
            R(c, px + 2, py, 6, 7, hsh > 0.5 ? '#e0b48a' : '#a87a5a');
            if (jump > 2) R(c, px - 2, py + 2, 2, 6, '#e0b48a');
          }
        }
    }
    // Portail de retour en pixels : anneau de pierre runique et tourbillon à la couleur de l'instance.
    function drawExitPortal(c, th) {
      const inst = game.world.instance;
      if (!inst || inst.arena || !inst.cleared) return;
      const e = exitSpot(inst.index);
      if (!e) return;
      const x = e.x * TS + 24,
        y = e.y * TS + 24,
        U = 3,
        R2 = (px, py, w, h, col) => {
          c.fillStyle = col;
          c.fillRect(Math.round(x + px * U), Math.round(y + py * U), w * U, h * U);
        };
      // Ombre et socle.
      c.save();
      c.globalAlpha = 0.35;
      c.fillStyle = '#05040a';
      c.beginPath();
      c.ellipse(x, y + 22, 30, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      R2(-9, 6, 18, 2, '#1a1210');
      R2(-8, 5, 16, 2, th.pillar[1]);
      R2(-8, 5, 16, 1, th.pillar[2]);
      // Anneau de pierre cerclé d'encre et ses runes qui tournent.
      c.save();
      for (const [rx, ry, col] of [
        [11, 14, '#1a1210'],
        [10, 13, th.pillar[0]],
        [8, 11, '#06040a']
      ]) {
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(x, y - 14, rx * U, ry * U, 0, 0, Math.PI * 2);
        c.fill();
      }
      // Tourbillon : bandes de la couleur des runes, qui tournent.
      c.globalAlpha = 0.9;
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = k === 1 ? '#ffffff' : th.rune;
        c.lineWidth = U * 2;
        const a = time * 0.06 + (k * Math.PI * 2) / 3;
        c.beginPath();
        c.ellipse(x, y - 14, (7 - k * 2) * U, (10 - k * 2.5) * U, 0, a, a + 2.2);
        c.stroke();
      }
      c.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.08);
      c.fillStyle = th.rune;
      c.beginPath();
      c.ellipse(x, y - 14, 3 * U, 4 * U, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + time * 0.02;
        R2(Math.cos(a) * 9.5 - 0.5, Math.sin(a) * 12.5 - 5, 1, 1, k % 2 ? th.rune : '#ffffff');
      }
      // Étincelles qui montent.
      for (let k = 0; k < 5; k++) {
        const ph = (time * 0.01 + k / 5) % 1;
        c.globalAlpha = 1 - ph;
        R2(Math.sin(k * 2.1 + time * 0.03) * 6, 2 - ph * 22, 1, 1, th.rune);
      }
      c.globalAlpha = 1;
      canaanLight(x, y - 14, 190, th.rune);
      const near = exitNear(P);
      c.save();
      c.textAlign = 'center';
      c.font = 'bold 13px Palatino Linotype, Georgia, serif';
      c.lineWidth = 3;
      c.strokeStyle = '#1a1008';
      const text = near ? '[E] Sortir de l’instance' : '🌀 Portail de retour';
      c.strokeText(text, x, y - 62);
      c.fillStyle = '#f6dc98';
      c.fillText(text, x, y - 62);
      c.restore();
    }
    // ---------------------------------------------------------------- Textures des cases
    function canvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    const ART = [];
    function rect(g, x, y, w, h, col) {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function specks(g, n, cols, seed, size = 3) {
      for (let k = 0; k < n; k++) {
        const x = Math.floor(hash(k, seed, 3) * 16) * 3,
          y = Math.floor(hash(seed, k, 5) * 16) * 3;
        g.globalAlpha = 0.25 + hash(k, seed, 9) * 0.5;
        rect(g, x, y, size * (k % 3 === 0 ? 2 : 1), size - 1, cols[k % cols.length]);
      }
      g.globalAlpha = 1;
    }
    function paintFloor(g, p, v, style) {
      rect(g, 0, 0, 48, 48, p.a);
      const s = v * 31 + 7;
      if (style === 'dirt' || style === 'gravel') {
        specks(g, 46, [p.b, p.c, p.b], s);
        for (let k = 0; k < (style === 'gravel' ? 9 : 3); k++) {
          const x = 4 + hash(k, s, 1) * 38,
            y = 4 + hash(s, k, 2) * 38;
          rect(g, x, y + 2, 6, 2, p.b);
          rect(g, x, y, 6, 3, p.c);
        }
      } else if (style === 'stone') {
        for (let k = 0; k < 6; k++) {
          g.globalAlpha = 0.45;
          rect(
            g,
            hash(k, s, 4) * 36,
            hash(s, k, 6) * 36,
            9 + hash(k, s) * 9,
            6 + hash(s, k) * 8,
            k % 2 ? p.b : p.c
          );
        }
        g.globalAlpha = 1;
        specks(g, 26, [p.b, p.c], s);
        rect(g, 6 + v * 7, 30, 14, 1, p.b);
        rect(g, 19 + v * 7, 31, 1, 6, p.b);
      } else if (style === 'tiles' || style === 'marble' || style === 'basalt' || style === 'arcane') {
        for (let ty = 0; ty < 2; ty++)
          for (let tx = 0; tx < 2; tx++) {
            const shade = hash(tx + v * 2, ty, 11);
            g.globalAlpha = 0.18;
            rect(g, tx * 24, ty * 24, 24, 24, shade > 0.5 ? p.c : p.b);
            g.globalAlpha = 1;
          }
        if (style === 'marble') {
          g.strokeStyle = p.b;
          g.globalAlpha = 0.55;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(0, 10 + v * 6);
          g.lineTo(18, 20 + v * 3);
          g.lineTo(34, 14 + v * 5);
          g.lineTo(48, 26 - v * 2);
          g.stroke();
          g.globalAlpha = 1;
          rect(g, 0, 0, 48, 1, p.c);
          rect(g, 0, 0, 1, 48, p.c);
          rect(g, 23, 23, 2, 2, p.c);
        } else {
          rect(g, 0, 23, 48, 2, p.b);
          rect(g, 23, 0, 2, 48, p.b);
          rect(g, 0, 0, 48, 1, p.b);
          rect(g, 0, 0, 1, 48, p.b);
          rect(g, 1, 1, 22, 1, p.c);
          rect(g, 25, 25, 22, 1, p.c);
        }
        if (style === 'basalt' && v === 3) {
          rect(g, 6, 12, 10, 1, '#ff7a2a');
          rect(g, 15, 12, 1, 7, '#ff7a2a');
          rect(g, 15, 18, 12, 1, '#ffb14a');
        }
        if (style === 'arcane' && v % 2 === 0) {
          g.globalAlpha = 0.7;
          rect(g, 8, 11, 8, 1, p.glow);
          rect(g, 32, 35, 8, 1, p.glow);
          rect(g, 11, 8, 1, 7, p.glow);
          rect(g, 36, 32, 1, 7, p.glow);
          g.globalAlpha = 1;
        }
        if (style === 'tiles' && v === 3) {
          rect(g, 4, 6, 9, 1, p.b);
          rect(g, 12, 6, 1, 8, p.b);
        }
      } else if (style === 'flagstone') {
        for (let row = 0; row < 3; row++) {
          let x = -((v * 7 + row * 11) % 18);
          while (x < 48) {
            const w = 15 + Math.floor(hash(x, row, v) * 10);
            g.globalAlpha = 0.25;
            rect(g, x, row * 16, w, 16, hash(row, x, v + 3) > 0.5 ? p.c : p.b);
            g.globalAlpha = 1;
            rect(g, x, row * 16, 2, 16, p.b);
            rect(g, x + 2, row * 16 + 1, w - 3, 1, p.c);
            x += w;
          }
          rect(g, 0, row * 16, 48, 2, p.b);
        }
      } else if (style === 'planks' || style === 'logs') {
        // Plancher (intérieurs) : lames ou rondins, arête claire, joint sombre, raccords cloués et nœuds.
        const n = style === 'logs' ? 3 : 4,
          hgt = 48 / n;
        for (let row = 0; row < n; row++) {
          const y = row * hgt,
            seam = 4 + Math.floor(hash(row, v, 17) * 38);
          g.globalAlpha = 0.25;
          rect(g, 0, y, 48, hgt, hash(row, v, 13) > 0.5 ? p.c : p.b);
          g.globalAlpha = 1;
          rect(g, 0, y, 48, 1, p.c);
          rect(g, 0, y + hgt - 2, 48, 2, p.b);
          rect(g, seam, y, 2, hgt - 2, p.b);
          rect(g, seam + 2, y + 1, 1, hgt - 3, p.c);
          rect(g, seam - 4, y + hgt / 2 - 1, 2, 2, p.b);
          rect(g, seam + 5, y + hgt / 2 - 1, 2, 2, p.b);
          if (hash(v, row, 19) > 0.55) {
            const kx = 6 + hash(row, v, 21) * 32;
            rect(g, kx, y + hgt / 2 - 2, 6, 3, p.b);
            rect(g, kx + 1, y + hgt / 2 - 1, 3, 1, p.c);
          }
        }
        specks(g, 12, [p.b, p.c], s, 2);
      } else if (style === 'starstone') {
        specks(g, 18, [p.b], s, 4);
        for (let k = 0; k < 7; k++) {
          g.globalAlpha = 0.35 + hash(k, s) * 0.6;
          rect(g, hash(k, s, 2) * 47, hash(s, k, 8) * 47, 1, 1, p.c);
        }
        if (v === 0) {
          g.globalAlpha = 0.25;
          g.strokeStyle = p.c;
          g.beginPath();
          g.moveTo(8 + v * 3, 10);
          g.lineTo(22, 18 + v * 2);
          g.lineTo(36 - v * 2, 12);
          g.stroke();
          g.globalAlpha = 1;
        }
        rect(g, 0, 0, 48, 1, '#2e3670');
        rect(g, 0, 0, 1, 48, '#2e3670');
      }
    }
    function paintAccent(g, p, floor, v) {
      const style = p.style;
      if (style === 'gravel') return paintFloor(g, p, v, 'gravel');
      if (style === 'rails') return paintFloor(g, floor, v, floor.style);
      if (style === 'carpet') {
        rect(g, 0, 0, 48, 48, p.a);
        g.globalAlpha = 0.5;
        for (let k = 0; k < 2; k++) {
          g.fillStyle = p.b;
          g.beginPath();
          g.moveTo(24, k * 24 + 4);
          g.lineTo(34, k * 24 + 12);
          g.lineTo(24, k * 24 + 20);
          g.lineTo(14, k * 24 + 12);
          g.fill();
        }
        g.globalAlpha = 0.28;
        rect(g, 22, 10, 4, 4, p.c);
        rect(g, 22, 34, 4, 4, p.c);
        g.globalAlpha = 1;
        return;
      }
      if (style === 'grate') {
        rect(g, 0, 0, 48, 48, p.c);
        g.globalAlpha = 0.55;
        rect(g, 0, 0, 48, 48, '#200800');
        g.globalAlpha = 1;
        for (let k = 0; k < 48; k += 8) {
          rect(g, k, 0, 3, 48, p.a);
          rect(g, 0, k, 48, 3, p.a);
        }
        rect(g, 0, 0, 48, 2, p.b);
        return;
      }
      // Runes : dalles sombres gravées d'un glyphe lumineux.
      rect(g, 0, 0, 48, 48, p.a);
      rect(g, 0, 0, 48, 2, p.b);
      rect(g, 0, 0, 2, 48, p.b);
      rect(g, 3, 3, 42, 1, p.b);
      g.strokeStyle = p.c;
      g.globalAlpha = 0.75;
      g.lineWidth = 2;
      g.beginPath();
      if (v === 0) {
        g.arc(24, 24, 9, 0, Math.PI * 2);
        g.moveTo(24, 12);
        g.lineTo(24, 36);
      } else if (v === 1) {
        g.moveTo(15, 32);
        g.lineTo(24, 14);
        g.lineTo(33, 32);
        g.closePath();
      } else if (v === 2) {
        g.moveTo(14, 24);
        g.lineTo(34, 24);
        g.moveTo(18, 16);
        g.lineTo(30, 32);
      } else {
        g.arc(24, 24, 5, 0, Math.PI * 2);
      }
      g.stroke();
      g.globalAlpha = 1;
    }
    function paintFace(g, w, v) {
      rect(g, 0, 0, 48, 48, w.face);
      if (w.style === 'brick') {
        for (let row = 0; row < 4; row++) {
          const y = 10 + row * 10,
            off = row % 2 ? 0 : 8;
          rect(g, 0, y, 48, 2, w.dark);
          for (let x = -off; x < 48; x += 16) {
            rect(g, x, y, 2, 10, w.dark);
            rect(g, x + 2, y + 2, 12, 1, w.light);
            if (hash(x, row, v) > 0.7) {
              g.globalAlpha = 0.3;
              rect(g, x + 3, y + 3, 11, 6, w.dark);
              g.globalAlpha = 1;
            }
          }
        }
      } else if (w.style === 'marble') {
        rect(g, 4, 12, 40, 32, w.light);
        rect(g, 6, 14, 36, 28, w.face);
        rect(g, 0, 10, 48, 2, '#d4aa3a');
        rect(g, 22, 18, 4, 20, w.dark);
      } else {
        for (let k = 0; k < 7; k++) {
          const y = 10 + k * 5 + Math.floor(hash(k, v, 2) * 3),
            x = Math.floor(hash(v, k, 4) * 30);
          rect(g, x, y, 10 + hash(k, v) * 16, 3, k % 2 ? w.dark : w.light);
        }
        specks(g, 16, [w.dark, w.light], v + 50);
      }
      // Couronnement du mur et pied ombré.
      rect(g, 0, 0, 48, 10, w.top);
      rect(g, 0, 9, 48, 2, w.light);
      g.globalAlpha = 0.45;
      rect(g, 0, 43, 48, 5, '#000');
      g.globalAlpha = 1;
    }
    function paintHazard(g, h, v) {
      rect(g, 0, 0, 48, 48, h.a);
      const wrap = (x, y, w, hh, col) => {
        rect(g, x, y, w, hh, col);
        if (x + w > 48) rect(g, x - 48, y, w, hh, col);
      };
      if (h.style === 'water') {
        for (let k = 0; k < 7; k++) wrap(hash(k, v, 1) * 48, 4 + k * 6, 9, 2, k % 2 ? h.c : h.b);
      } else if (h.style === 'lava') {
        for (let k = 0; k < 9; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 5) * 46, 8 + hash(k, k) * 10, 3, h.b);
        for (let k = 0; k < 5; k++) wrap(hash(k, v, 7) * 48, hash(v, k, 9) * 46, 4, 2, h.c);
        g.globalAlpha = 0.5;
        for (let k = 0; k < 3; k++) wrap(hash(k, v, 11) * 48, hash(v, k, 13) * 44, 10, 5, '#5a1806');
        g.globalAlpha = 1;
      } else if (h.style === 'stars' || h.style === 'void') {
        g.globalAlpha = 0.35;
        for (let k = 0; k < 4; k++) wrap(hash(k, v, 2) * 48, hash(v, k, 4) * 40, 16, 8, h.b);
        g.globalAlpha = 1;
        for (let k = 0; k < 9; k++)
          wrap(hash(k, v, 6) * 48, hash(v, k, 8) * 48, k % 4 ? 1 : 2, k % 4 ? 1 : 2, h.c);
      } else if (h.style === 'clouds') {
        for (let k = 0; k < 6; k++) {
          const x = hash(k, v, 1) * 48,
            y = hash(v, k, 2) * 44,
            r = 6 + hash(k, v) * 7;
          for (const dx of [0, -48]) {
            g.fillStyle = k % 2 ? h.b : h.c;
            g.globalAlpha = 0.6;
            g.beginPath();
            g.arc(x + dx, y, r, 0, Math.PI * 2);
            g.fill();
          }
        }
        g.globalAlpha = 1;
      } else if (h.style === 'blood') {
        for (let k = 0; k < 5; k++) wrap(hash(k, v, 1) * 48, hash(v, k, 2) * 46, 7, 2, h.b);
        for (let k = 0; k < 3; k++) wrap(hash(k, v, 3) * 48, hash(v, k, 4) * 46, 3, 1, h.c);
      } else {
        specks(g, 10, [h.b, h.c], v + 90, 2);
      }
    }
    // ---------------------------------------------------------------- Cases en pixel art
    // Même facture que les bâtiments, les routes et le sol de l'île : gros pixels de 3 px (16 × 16 par case), aplats de
    // 3 à 4 tons, joints sombres, reflet en haut à gauche de chaque dalle ou pierre, pied des murs ombré.
    const PXU = 3;
    const toRgb = h => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)
    ];
    const mixHex = (a, b, t) => {
      const A = toRgb(a),
        B = toRgb(b);
      return (
        '#' +
        A.map((v, k) =>
          Math.round(v + (B[k] - v) * t)
            .toString(16)
            .padStart(2, '0')
        ).join('')
      );
    };
    function pxDot(g, x, y, col, w = 1, h = 1) {
      g.fillStyle = col;
      g.fillRect(x * PXU, y * PXU, w * PXU, h * PXU);
    }
    // Dalle : aplat, reflet en haut et à gauche, ombre en bas et à droite, quelques grains et parfois une fissure.
    function pxSlab(g, x, y, w, h, base, p, seed) {
      pxDot(g, x, y, base, w, h);
      pxDot(g, x, y, mixHex(base, '#ffffff', 0.14), w, 1);
      pxDot(g, x, y, mixHex(base, '#ffffff', 0.08), 1, h);
      pxDot(g, x, y + h - 1, mixHex(base, p.b, 0.45), w, 1);
      pxDot(g, x + w - 1, y, mixHex(base, p.b, 0.3), 1, h);
      if (hash(seed, x, y) > 0.55)
        pxDot(
          g,
          x + 1 + Math.floor(hash(x, seed, y) * (w - 2)),
          y + 1 + Math.floor(hash(y, x, seed) * (h - 2)),
          mixHex(base, p.b, 0.5)
        );
      if (hash(x, y, seed + 7) > 0.86 && w > 4) {
        const cx = x + 2 + Math.floor(hash(seed, y, 3) * (w - 4));
        pxDot(g, cx, y + 1, mixHex(base, p.b, 0.7));
        pxDot(g, cx + 1, y + 2, mixHex(base, p.b, 0.7));
      }
    }
    function slabTone(p, k) {
      return [p.a, mixHex(p.a, p.c, 0.35), mixHex(p.a, p.b, 0.3), p.a][Math.floor(k * 4)];
    }
    function pxFloor(g, p, v, style) {
      const joint = mixHex(p.b, '#000000', 0.25),
        seed = v * 31 + 7;
      pxDot(g, 0, 0, joint, 16, 16);
      if (style === 'dirt' || style === 'gravel') {
        // Terre battue : taches de tons par bruit doux, cailloux éclairés en haut.
        for (let y = 0; y < 16; y++)
          for (let x = 0; x < 16; x++) {
            const n = field(x / 5 + v * 3, y / 5, 2.2, 91) + (hash(x, y, seed) - 0.5) * 0.18;
            pxDot(g, x, y, n > 0.62 ? mixHex(p.a, p.c, 0.45) : n < 0.36 ? mixHex(p.a, p.b, 0.4) : p.a);
          }
        for (let k = 0; k < (style === 'gravel' ? 6 : 3); k++) {
          const x = 1 + Math.floor(hash(k, seed, 1) * 13),
            y = 1 + Math.floor(hash(seed, k, 2) * 13);
          pxDot(g, x, y + 1, mixHex(p.b, '#000000', 0.2), 2, 1);
          pxDot(g, x, y, p.c, 2, 1);
        }
        return;
      }
      if (style === 'planks' || style === 'logs') {
        for (let row = 0; row < 4; row++) {
          const seam = 2 + Math.floor(hash(row, v, 17) * 12);
          pxSlab(g, 0, row * 4, seam, 3, slabTone(p, hash(row, v, 3)), p, seed + row);
          pxSlab(g, seam + 1, row * 4, 15 - seam, 3, slabTone(p, hash(row, v, 5)), p, seed + row + 9);
        }
        return;
      }
      if (style === 'flagstone' || style === 'stone') {
        // Dalles irrégulières en rangées décalées.
        const rows = style === 'stone' ? [5, 5, 6] : [8, 8];
        let y = 0;
        rows.forEach((hgt, row) => {
          let x = -Math.floor(hash(row, v, 23) * 5);
          while (x < 16) {
            const w = (style === 'stone' ? 4 : 5) + Math.floor(hash(x + 9, row, v) * 5),
              x0 = Math.max(0, x),
              x1 = Math.min(16, x + w);
            if (x1 - x0 > 1)
              pxSlab(g, x0, y, x1 - x0 - 1, hgt - 1, slabTone(p, hash(x, row, v + 3)), p, seed + x * 3 + row);
            x += w;
          }
          y += hgt;
        });
        return;
      }
      // Carreaux carrés (temples, marbre, basalte, arcanes, pierre d'étoiles).
      for (let ty = 0; ty < 2; ty++)
        for (let tx = 0; tx < 2; tx++)
          pxSlab(g, tx * 8, ty * 8, 7, 7, slabTone(p, hash(tx + v * 2, ty, 11)), p, seed + tx * 5 + ty);
      if (style === 'marble') {
        for (let k = 0; k < 6; k++) pxDot(g, 2 + k * 2, 3 + ((k * 3 + v) % 4), mixHex(p.a, p.b, 0.5));
        pxDot(g, 7, 7, p.c, 2, 2);
      }
      if (style === 'basalt' && v === 3) {
        pxDot(g, 2, 4, '#ff7a2a', 3, 1);
        pxDot(g, 4, 5, '#ffb14a', 1, 2);
        pxDot(g, 5, 6, '#ff7a2a', 3, 1);
      }
      if (style === 'arcane' && v % 2 === 0) {
        pxDot(g, 3, 3, p.glow, 2, 1);
        pxDot(g, 3, 3, p.glow, 1, 2);
        pxDot(g, 11, 11, p.glow, 2, 1);
        pxDot(g, 12, 11, p.glow, 1, 2);
      }
      if (style === 'starstone')
        for (let k = 0; k < 4; k++)
          pxDot(g, Math.floor(hash(k, seed, 2) * 15), Math.floor(hash(seed, k, 8) * 15), p.c);
    }
    // Chemin principal : tapis à motif, rails, dalles runiques ou grille au-dessus des braises.
    function pxAccent(g, p, floor, v) {
      if (p.style === 'gravel') return pxFloor(g, p, v, 'gravel');
      if (p.style === 'rails') return pxFloor(g, floor, v, floor.style);
      if (p.style === 'carpet') {
        pxDot(g, 0, 0, p.a, 16, 16);
        for (let k = 0; k < 16; k += 4) pxDot(g, k, 0, mixHex(p.a, p.b, 0.4), 2, 16);
        for (const [x, y] of [
          [7, 2],
          [6, 3],
          [8, 3],
          [5, 4],
          [9, 4],
          [6, 5],
          [8, 5],
          [7, 6]
        ])
          pxDot(g, x, y, p.c);
        for (const [x, y] of [
          [7, 10],
          [6, 11],
          [8, 11],
          [7, 12]
        ])
          pxDot(g, x, y, p.b);
        return;
      }
      if (p.style === 'grate') {
        pxDot(g, 0, 0, '#3a1206', 16, 16);
        for (let k = 0; k < 16; k += 3) {
          pxDot(g, k, 0, p.a, 1, 16);
          pxDot(g, 0, k, p.a, 16, 1);
        }
        if (v % 2) pxDot(g, 4, 4, p.c);
        return;
      }
      // Dalle runique : carreau sombre et glyphe lumineux en pixels.
      pxDot(g, 0, 0, mixHex(p.b, '#000000', 0.3), 16, 16);
      pxSlab(g, 0, 0, 15, 15, p.a, p, v + 3);
      const glyphs = [
        [
          [7, 3],
          [7, 4],
          [7, 5],
          [7, 6],
          [7, 7],
          [7, 8],
          [7, 9],
          [7, 10],
          [7, 11],
          [5, 5],
          [9, 5],
          [4, 7],
          [10, 7],
          [5, 9],
          [9, 9]
        ],
        [
          [7, 3],
          [6, 5],
          [8, 5],
          [5, 7],
          [9, 7],
          [4, 9],
          [10, 9],
          [4, 11],
          [5, 11],
          [6, 11],
          [7, 11],
          [8, 11],
          [9, 11],
          [10, 11]
        ],
        [
          [4, 7],
          [5, 7],
          [6, 7],
          [7, 7],
          [8, 7],
          [9, 7],
          [10, 7],
          [5, 4],
          [6, 5],
          [8, 9],
          [9, 10]
        ],
        [
          [6, 6],
          [7, 6],
          [8, 6],
          [6, 7],
          [8, 7],
          [6, 8],
          [7, 8],
          [8, 8]
        ]
      ];
      for (const [x, y] of glyphs[v]) pxDot(g, x, y, p.c);
    }
    // Face d'un mur : couronnement clair cerné d'encre, pierres ou briques, pied ombré.
    function pxFace(g, w, v) {
      const joint = mixHex(w.dark, '#000000', 0.3),
        seed = v * 17 + 3;
      pxDot(g, 0, 0, joint, 16, 16);
      if (w.style === 'brick') {
        for (let row = 0; row < 3; row++) {
          const y = 4 + row * 3,
            off = row % 2 ? 0 : 3;
          for (let x = -off; x < 16; x += 6) {
            const x0 = Math.max(0, x),
              x1 = Math.min(16, x + 5);
            if (x1 > x0)
              pxSlab(
                g,
                x0,
                y,
                x1 - x0,
                2,
                [w.face, mixHex(w.face, w.light, 0.3), mixHex(w.face, w.dark, 0.3), w.face][
                  Math.floor(hash(x, row, v) * 4)
                ],
                { b: w.dark },
                seed + x + row
              );
          }
        }
      } else if (w.style === 'marble') {
        pxDot(g, 0, 3, '#d4aa3a', 16, 1);
        pxSlab(g, 1, 4, 6, 9, w.face, { b: w.dark }, seed);
        pxSlab(g, 9, 4, 6, 9, w.face, { b: w.dark }, seed + 5);
        pxDot(g, 7, 5, w.dark, 2, 7);
      } else {
        // Roche : blocs de tailles variées aux coins arrondis.
        let y = 4;
        for (let row = 0; y < 13; row++) {
          const hgt = 2 + Math.floor(hash(row, v, 4) * 2);
          let x = -Math.floor(hash(v, row, 9) * 3);
          while (x < 16) {
            const bw = 3 + Math.floor(hash(x + 5, row, v) * 4),
              x0 = Math.max(0, x),
              x1 = Math.min(16, x + bw),
              h = Math.min(hgt, 13 - y);
            if (x1 - x0 > 1 && h > 0) {
              pxSlab(
                g,
                x0,
                y,
                x1 - x0 - 1,
                h,
                [w.face, mixHex(w.face, w.light, 0.35), mixHex(w.face, w.dark, 0.35)][
                  Math.floor(hash(x, row, v + 1) * 3)
                ],
                { b: w.dark },
                seed + x * 7 + row
              );
              pxDot(g, x0, y, joint);
              pxDot(g, x1 - 2, y + h - 1, joint);
            }
            x += bw;
          }
          y += hgt + 0;
        }
      }
      // Couronnement : liseré d'encre, arête claire, puis pied ombré.
      pxDot(g, 0, 0, mixHex(w.top, '#000000', 0.3), 16, 1);
      pxDot(g, 0, 1, w.light, 16, 1);
      pxDot(g, 0, 2, mixHex(w.light, w.face, 0.5), 16, 1);
      pxDot(g, 0, 3, joint, 16, 1);
      pxDot(g, 0, 13, mixHex(w.dark, '#000000', 0.35), 16, 1);
      pxDot(g, 0, 14, mixHex(w.dark, '#000000', 0.5), 16, 2);
    }
    // Dessus des murs : aplat sombre tramé.
    function pxTop(g, w) {
      pxDot(g, 0, 0, w.top, 16, 16);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++)
          if ((x + y * 3) % 7 === 0 && hash(x, y, 77) > 0.4) pxDot(g, x, y, w.dark);
    }
    function themeArt(i) {
      if (ART[i]) return ART[i];
      const th = THEMES[i],
        mk = fn =>
          [0, 1, 2, 3].map(v => {
            const c = canvas(48, 48),
              g = c.getContext('2d');
            fn(g, v);
            return c;
          });
      const art = {
        floor: mk((g, v) => pxFloor(g, th.floor, v, th.floor.style)),
        accent: mk((g, v) => pxAccent(g, th.accent, th.floor, v)),
        face: mk((g, v) => pxFace(g, th.wall, v)),
        hazard: mk((g, v) => paintHazard(g, th.hazard, v))
      };
      const top = canvas(48, 48);
      pxTop(top.getContext('2d'), th.wall);
      art.top = top;
      ART[i] = art;
      return art;
    }
    const shadowTile = (() => {
      let c = null;
      return () => {
        if (c) return c;
        c = canvas(48, 48);
        const g = c.getContext('2d'),
          grad = g.createLinearGradient(0, 0, 0, 18);
        grad.addColorStop(0, 'rgba(0,0,0,.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 48, 18);
        return c;
      };
    })();
    function drawScrolled(c, img, x, y, off) {
      off = ((Math.floor(off) % 48) + 48) % 48;
      if (!off) return c.drawImage(img, x, y);
      c.drawImage(img, off, 0, 48 - off, 48, x, y, 48 - off, 48);
      c.drawImage(img, 0, 0, off, 48, x + 48 - off, y, off, 48);
    }
    // Dessin d'une case d'instance, appelé par la boucle de rendu à la place des tuiles du monde.
    function drawDungeonTile(c, x, y, t) {
      if (t === SECRET) {
        // Passage secret fermé : un mur comme les autres. Celui qu'on ouvre en l'examinant porte une fine lézarde et
        // un filet de poussière, qu'on ne voit qu'en s'en approchant ; les autres s'ouvrent par une torche ou une statue.
        drawDungeonTile(c, x, y, WALL);
        const plan = planFor(game.world.instance.index),
          wall = plan.secretWalls.find(w => w.cells.some(([cx, cy]) => cx === x && cy === y));
        if (!wall || wall.kind !== 'wall') return;
        const d = Math.hypot(P.x / TS - (x + 0.5), P.y / TS - (y + 0.5));
        if (d > 3.2) return;
        const X = x * TS,
          Y = y * TS;
        c.globalAlpha = Math.min(1, (3.2 - d) / 1.6) * 0.75;
        c.fillStyle = 'rgba(10,8,6,1)';
        for (const [px, py, w, h] of [
          [22, 16, 2, 7],
          [20, 23, 2, 6],
          [23, 29, 2, 5],
          [16, 33, 5, 2]
        ])
          c.fillRect(X + px, Y + py, w, h);
        c.globalAlpha = 1;
        if (Math.floor(time / 9 + x * 3) % 9 === 0) {
          c.fillStyle = 'rgba(220,200,170,.5)';
          c.fillRect(X + 21, Y + 36 + ((time * 0.5) % 10), 2, 2);
        }
        return;
      }
      const i = game.world.instance.index,
        th = THEMES[i],
        art = themeArt(i),
        plan = planFor(i),
        X = x * TS,
        Y = y * TS,
        v = (x * 7 + y * 13) & 3,
        at = (xx, yy) => {
          const n = tileAt(xx, yy);
          return plan.solid.has(yy * MAPW + xx) ? FLOOR : n === SECRET ? WALL : n;
        };
      if (t === WALL && !plan.solid.has(y * MAPW + x)) {
        const below = at(x, y + 1);
        if (WALKABLE(below) || below === GATE || below === HAZARD) {
          c.drawImage(art.face[v], X, Y);
          return;
        }
        const open = n => WALKABLE(n) || n === HAZARD || n === GATE,
          near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x - 1, y + 1), at(x + 1, y + 1), at(x, y + 2)];
        if (!near.some(open)) {
          // Roche pleine, loin des salles : presque noire.
          c.drawImage(art.top, X, Y);
          c.globalAlpha = 0.55;
          c.fillStyle = '#000';
          c.fillRect(X, Y, TS, TS);
          c.globalAlpha = 1;
          return;
        }
        // Sommet du mur au bord d'une salle : pierre visible et arête claire côté sol.
        c.fillStyle = th.wall.dark;
        c.fillRect(X, Y, TS, TS);
        c.globalAlpha = 0.5;
        c.drawImage(art.top, X, Y);
        c.globalAlpha = 1;
        c.fillStyle = th.wall.light;
        if (open(near[0])) c.fillRect(X, Y, 4, TS);
        if (open(near[1])) c.fillRect(X + TS - 4, Y, 4, TS);
        if (open(near[2])) c.fillRect(X, Y, TS, 4);
        return;
      }
      if (t === HAZARD) {
        const h = th.hazard,
          speed = h.style === 'lava' ? 0.12 : h.style === 'water' ? 0.25 : h.style === 'clouds' ? 0.18 : 0.03;
        drawScrolled(c, art.hazard[v], X, Y, time * speed + y * 9);
        if (h.style === 'lava' || h.style === 'stars') {
          const tw = hash(x, y, Math.floor(time / 20));
          if (tw > 0.85) {
            c.fillStyle = h.c;
            c.fillRect(X + tw * 40, Y + ((tw * 977) % 40), 3, 3);
          }
        }
        // Rebord : falaise sous un sol (gouffre, vide) ou margelle de pierre (liquides).
        const above = at(x, y - 1);
        if (WALKABLE(above) || above === GATE) {
          const deep =
            h.style === 'chasm' || h.style === 'void' || h.style === 'stars' || h.style === 'clouds';
          c.fillStyle = deep ? th.floor.b : th.wall.dark;
          c.fillRect(X, Y, TS, deep ? 14 : 5);
          if (deep) {
            c.globalAlpha = 0.5;
            c.fillStyle = '#000';
            c.fillRect(X, Y + 14, TS, 6);
            c.globalAlpha = 1;
          }
        }
        return;
      }
      // Sols, chemins et herses (dessinées ensuite par le décor).
      const accent =
        t === ACCENT ||
        (t === GATE &&
          plan.gates.some(g => g.cells.some(([gx, gy], k) => gx === x && gy === y && g.under[k] === ACCENT)));
      c.drawImage(accent ? art.accent[v] : art.floor[v], X, Y);
      if (accent) {
        const ac = th.accent,
          same = (xx, yy) => {
            const n = tileAt(xx, yy);
            return n === ACCENT || n === GATE;
          };
        if (ac.style === 'rails') {
          const horizontal = same(x - 1, y) || same(x + 1, y),
            vertical = same(x, y - 1) || same(x, y + 1);
          c.fillStyle = ac.b;
          if (vertical || !horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + 8, Y + k, 32, 5);
          if (horizontal) for (let k = 4; k < 48; k += 11) c.fillRect(X + k, Y + 8, 5, 32);
          c.fillStyle = ac.c;
          if (vertical || !horizontal) {
            c.fillRect(X + 12, Y, 3, 48);
            c.fillRect(X + 33, Y, 3, 48);
          }
          if (horizontal) {
            c.fillRect(X, Y + 12, 48, 3);
            c.fillRect(X, Y + 33, 48, 3);
          }
        } else if (ac.style === 'carpet') {
          c.fillStyle = ac.c;
          if (!same(x - 1, y)) c.fillRect(X, Y, 4, TS);
          if (!same(x + 1, y)) c.fillRect(X + TS - 4, Y, 4, TS);
          if (!same(x, y - 1)) c.fillRect(X, Y, TS, 4);
          if (!same(x, y + 1)) c.fillRect(X, Y + TS - 4, TS, 4);
        }
      }
      const up = at(x, y - 1);
      if (up === WALL) c.drawImage(shadowTile(), X, Y);
    }

    // ---------------------------------------------------------------- Décor
    function R(c, x, y, w, h, col) {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function flame(c, x, y, s, cols, seed = 0) {
      const f = Math.round(Math.sin(time * 0.23 + seed) * 2 * s),
        l = Math.round(Math.sin(time * 0.31 + seed * 2) * s);
      R(c, x - 5 * s, y - 8 * s + l, 10 * s, 9 * s, cols[0]);
      R(c, x - 3.5 * s, y - 14 * s + f, 7 * s, 9 * s, cols[1]);
      R(c, x - 2 * s, y - 18 * s + f, 4 * s, 6 * s, cols[1]);
      R(c, x - 2 * s, y - 7 * s, 4 * s, 6 * s, cols[2]);
    }
    function drawWallProp(c, p, th) {
      const X = p.x * TS,
        Y = p.y * TS,
        cx = X + 24,
        seed = p.x * 3 + p.y;
      switch (p.kind) {
        case 'torch':
        case 'sconce':
          R(c, cx - 2, Y + 24, 4, 14, '#4a3324');
          R(c, cx - 6, Y + 20, 12, 5, p.kind === 'sconce' ? th.pillar[1] : '#6f5137');
          flame(c, cx, Y + 20, 1, th.flame, seed);
          canaanLight(cx, Y + 30, 190, th.flame[1]);
          break;
        case 'lantern':
          R(c, cx - 1, Y + 6, 2, 14, '#2a2a2e');
          R(c, cx - 7, Y + 20, 14, 16, '#3a3a40');
          R(c, cx - 5, Y + 22, 10, 12, '#ffcf6a');
          R(c, cx - 2, Y + 25, 4, 6, '#fff6c5');
          canaanLight(cx, Y + 32, 170, '#ffcf6a');
          break;
        case 'banner':
          R(c, X + 8, Y + 10, 32, 3, '#3a2a1c');
          R(c, X + 11, Y + 13, 26, 28, th.banner[0]);
          R(c, X + 11, Y + 41, 8, 5, th.banner[0]);
          R(c, X + 29, Y + 41, 8, 5, th.banner[0]);
          R(c, X + 20, Y + 18, 8, 12, th.banner[1]);
          R(c, X + 17, Y + 22, 14, 4, th.banner[1]);
          R(c, X + 11, Y + 13, 26, 2, th.banner[1]);
          break;
        case 'roots':
          for (let k = 0; k < 4; k++) {
            const rx = X + 6 + k * 11,
              len = 14 + ((seed + k * 7) % 20);
            R(c, rx, Y + 10, 3, len, '#3b2a1a');
            R(c, rx + 2, Y + 10 + len - 6, 3, 6, '#2e2014');
          }
          break;
        case 'beam':
          R(c, X + 4, Y + 8, 7, 40, '#5e4430');
          R(c, X + 37, Y + 8, 7, 40, '#5e4430');
          R(c, X + 2, Y + 8, 44, 7, '#7a5a3e');
          R(c, X + 2, Y + 8, 44, 2, '#9a7a56');
          break;
        case 'mithril': {
          const glow = 0.6 + Math.sin(time * 0.05 + seed) * 0.25;
          c.globalAlpha = glow;
          R(c, X + 12, Y + 22, 6, 10, '#7de0ff');
          R(c, X + 20, Y + 16, 5, 16, '#c8f7ff');
          R(c, X + 27, Y + 24, 7, 8, '#7de0ff');
          R(c, X + 21, Y + 18, 2, 6, '#ffffff');
          c.globalAlpha = 1;
          canaanLight(cx, Y + 30, 120, '#7de0ff');
          break;
        }
        case 'chains':
          for (const ox of [12, 32])
            for (let k = 0; k < 5; k++) R(c, X + ox + (k % 2), Y + 10 + k * 6, 4 - (k % 2) * 2, 5, '#6a6a72');
          R(c, X + 10, Y + 40, 8, 4, '#4a4a52');
          R(c, X + 30, Y + 40, 8, 4, '#4a4a52');
          break;
        case 'skulls':
          R(c, X + 6, Y + 18, 36, 20, '#1a1214');
          for (const ox of [10, 22, 34]) {
            R(c, X + ox - 3, Y + 24, 8, 7, '#d8d0b8');
            R(c, X + ox - 2, Y + 26, 2, 2, '#1a1214');
            R(c, X + ox + 2, Y + 26, 2, 2, '#1a1214');
          }
          break;
        case 'furnace': {
          R(c, X + 4, Y + 12, 40, 36, '#2a1a14');
          R(c, X + 10, Y + 22, 28, 26, '#140806');
          const f = 0.75 + Math.sin(time * 0.12 + seed) * 0.2;
          c.globalAlpha = f;
          R(c, X + 12, Y + 30, 24, 18, '#e5522e');
          R(c, X + 16, Y + 34, 16, 14, '#f9a640');
          R(c, X + 20, Y + 38, 8, 10, '#fff1b5');
          c.globalAlpha = 1;
          canaanLight(cx, Y + 42, 230, '#ff7a2a');
          break;
        }
      }
    }
    function drawFloorProp(c, p, th) {
      const cx = p.x * TS + 24,
        by = p.y * TS + 40,
        seed = p.x * 5 + p.y * 3;
      const [pc, pd, pl] = th.pillar;
      switch (p.kind) {
        case 'pillar':
          R(c, cx - 22, by - 8, 44, 10, pd);
          R(c, cx - 17, by - 70, 34, 64, pc);
          R(c, cx - 17, by - 70, 6, 64, pl);
          R(c, cx + 9, by - 70, 8, 64, pd);
          R(c, cx - 22, by - 80, 44, 12, pl);
          R(c, cx - 20, by - 70, 40, 3, pd);
          break;
        case 'pillarlight': {
          R(c, cx - 20, by - 8, 40, 10, pd);
          const a = 0.35 + Math.sin(time * 0.04 + seed) * 0.12;
          c.globalAlpha = a;
          R(c, cx - 12, by - 130, 24, 124, th.flame[1]);
          R(c, cx - 5, by - 130, 10, 124, '#ffffff');
          c.globalAlpha = 1;
          canaanLight(cx, by - 30, 180, th.flame[1]);
          break;
        }
        case 'statue':
        case 'angelstatue':
          R(c, cx - 20, by - 12, 40, 14, pd);
          R(c, cx - 16, by - 16, 32, 6, pl);
          R(c, cx - 10, by - 60, 20, 46, pc);
          R(c, cx - 7, by - 74, 14, 14, pc);
          R(c, cx - 7, by - 74, 4, 14, pl);
          R(c, cx - 14, by - 54, 6, 24, pc);
          R(c, cx + 8, by - 54, 6, 24, pd);
          if (p.kind === 'angelstatue') {
            R(c, cx - 30, by - 66, 16, 34, pl);
            R(c, cx + 14, by - 66, 16, 34, pl);
            R(c, cx - 8, by - 80, 16, 3, '#d4aa3a');
          }
          break;
        case 'brazier':
          R(c, cx - 14, by - 4, 4, 8, '#2a2a2e');
          R(c, cx + 10, by - 4, 4, 8, '#2a2a2e');
          R(c, cx - 4, by - 12, 8, 14, '#3a3a40');
          R(c, cx - 18, by - 22, 36, 10, '#4a4a52');
          R(c, cx - 18, by - 22, 36, 3, '#6a6a72');
          flame(c, cx, by - 22, 1.6, th.flame, seed);
          canaanLight(cx, by - 30, 220, th.flame[1]);
          break;
        case 'candles':
          for (let k = 0; k < 4; k++) {
            const x = cx - 16 + k * 10,
              h = 10 + ((seed + k * 5) % 10);
            R(c, x, by - h, 5, h, '#e8dcc0');
            flame(c, x + 2.5, by - h, 0.45, th.flame, seed + k);
          }
          canaanLight(cx, by - 10, 100, th.flame[1]);
          break;
        case 'bones':
          R(c, cx - 16, by - 4, 18, 4, '#d8d0b8');
          R(c, cx - 18, by - 6, 4, 8, '#e8e0c8');
          R(c, cx + 2, by - 6, 4, 8, '#e8e0c8');
          R(c, cx + 6, by - 12, 10, 8, '#e0d8c0');
          R(c, cx + 8, by - 10, 2, 2, '#2a2420');
          R(c, cx + 12, by - 10, 2, 2, '#2a2420');
          break;
        case 'bonepile':
          for (let k = 0; k < 6; k++) {
            const x = cx - 20 + (k % 3) * 14,
              y = by - 10 - Math.floor(k / 3) * 9;
            R(c, x, y, 12, 9, k % 2 ? '#d8d0b8' : '#c8bea4');
            R(c, x + 2, y + 3, 2, 2, '#2a2420');
            R(c, x + 7, y + 3, 2, 2, '#2a2420');
          }
          break;
        case 'mushroom': {
          const g = 0.7 + Math.sin(time * 0.04 + seed) * 0.25;
          for (let k = 0; k < 3; k++) {
            const x = cx - 14 + k * 12,
              h = 8 + k * 4;
            R(c, x + 2, by - h, 4, h, '#e8dcc0');
            c.globalAlpha = g;
            R(c, x - 3, by - h - 6, 14, 6, '#4fd8c0');
            R(c, x - 1, by - h - 8, 10, 3, '#9ff8e8');
            c.globalAlpha = 1;
          }
          canaanLight(cx, by - 10, 90, '#4fd8c0');
          break;
        }
        case 'burrow':
          R(c, cx - 20, by - 12, 40, 16, '#7a6248');
          R(c, cx - 16, by - 10, 32, 12, '#120c08');
          R(c, cx - 12, by - 12, 24, 3, '#2a1e14');
          break;
        case 'crate':
          R(c, cx - 20, by - 22, 22, 22, '#7a5536');
          R(c, cx - 20, by - 22, 22, 3, '#a37a4d');
          R(c, cx - 20, by - 12, 22, 2, '#5d4330');
          R(c, cx + 4, by - 26, 16, 26, '#6a4a30');
          R(c, cx + 4, by - 26, 16, 3, '#8a6a46');
          R(c, cx + 4, by - 18, 16, 2, '#3e3a3a');
          R(c, cx + 4, by - 8, 16, 2, '#3e3a3a');
          break;
        case 'rubble':
          R(c, cx - 18, by - 8, 14, 10, th.wall.face);
          R(c, cx - 2, by - 12, 16, 14, th.wall.light);
          R(c, cx + 10, by - 6, 10, 8, th.wall.dark);
          break;
        case 'minecart':
          R(c, cx - 22, by - 26, 44, 22, '#4a4a52');
          R(c, cx - 22, by - 26, 44, 3, '#7a7a84');
          R(c, cx - 18, by - 32, 36, 8, '#5a5a62');
          R(c, cx - 12, by - 36, 8, 6, '#9fb6c9');
          R(c, cx + 2, by - 38, 8, 8, '#7de0ff');
          R(c, cx - 16, by - 4, 8, 8, '#1c1c20');
          R(c, cx + 8, by - 4, 8, 8, '#1c1c20');
          canaanLight(cx, by - 30, 70, '#7de0ff');
          break;
        case 'ore':
          R(c, cx - 18, by - 12, 36, 14, '#4a4a52');
          R(c, cx - 12, by - 18, 22, 8, '#5d6673');
          R(c, cx - 8, by - 16, 4, 4, '#7de0ff');
          R(c, cx + 4, by - 10, 4, 4, '#c8f7ff');
          R(c, cx - 14, by - 6, 3, 3, '#7de0ff');
          break;
        case 'pickaxe':
          R(c, cx - 2, by - 30, 4, 30, '#6a4a30');
          R(c, cx - 14, by - 32, 28, 5, '#8a8a94');
          R(c, cx - 16, by - 30, 4, 4, '#c0c0c8');
          R(c, cx + 12, by - 30, 4, 4, '#c0c0c8');
          break;
        case 'cage':
          R(c, cx - 18, by - 48, 36, 4, '#3a3a40');
          R(c, cx - 18, by - 4, 36, 4, '#3a3a40');
          for (let k = 0; k < 5; k++) R(c, cx - 18 + k * 8, by - 46, 3, 44, '#4a4a52');
          R(c, cx - 8, by - 12, 14, 8, '#d8d0b8');
          R(c, cx - 1, by - 66, 2, 18, '#4a4a52');
          break;
        case 'spikes':
          for (let k = 0; k < 4; k++) {
            c.fillStyle = '#8a8a94';
            c.beginPath();
            c.moveTo(cx - 18 + k * 11, by);
            c.lineTo(cx - 13 + k * 11, by - 16);
            c.lineTo(cx - 8 + k * 11, by);
            c.fill();
          }
          R(c, cx - 20, by - 2, 40, 4, '#3a3a40');
          break;
        case 'rack':
          R(c, cx - 22, by - 34, 4, 34, '#5e4430');
          R(c, cx + 18, by - 34, 4, 34, '#5e4430');
          R(c, cx - 22, by - 34, 44, 4, '#7a5a3e');
          for (let k = 0; k < 3; k++) {
            R(c, cx - 12 + k * 11, by - 44, 3, 40, '#c0c0c8');
            R(c, cx - 15 + k * 11, by - 12, 9, 3, '#8a6a46');
          }
          break;
        case 'anvil':
          R(c, cx - 12, by - 14, 24, 16, '#5e4430');
          R(c, cx - 8, by - 22, 16, 8, '#2a2a2e');
          R(c, cx - 20, by - 30, 40, 9, '#3a3a40');
          R(c, cx - 20, by - 30, 40, 2, '#6a6a72');
          R(c, cx + 20, by - 28, 6, 5, '#3a3a40');
          R(c, cx - 2, by - 44, 4, 14, '#6a4a30');
          R(c, cx - 8, by - 46, 16, 6, '#6a6a72');
          break;
        case 'ingots': {
          const g = 0.65 + Math.sin(time * 0.06 + seed) * 0.25;
          c.globalAlpha = g;
          for (let k = 0; k < 3; k++) R(c, cx - 16 + k * 11, by - 8, 10, 6, '#ff9a3c');
          R(c, cx - 10, by - 14, 10, 6, '#ffd36b');
          R(c, cx + 1, by - 14, 10, 6, '#ffb14a');
          c.globalAlpha = 1;
          canaanLight(cx, by - 10, 80, '#ff8a3c');
          break;
        }
        case 'dragonskull':
          R(c, cx - 22, by - 24, 44, 22, '#d8d0b8');
          R(c, cx - 18, by - 4, 36, 6, '#c8bea4');
          R(c, cx - 14, by - 18, 8, 7, '#1a1214');
          R(c, cx + 6, by - 18, 8, 7, '#1a1214');
          R(c, cx - 30, by - 36, 8, 18, '#e8e0c8');
          R(c, cx + 22, by - 36, 8, 18, '#e8e0c8');
          for (let k = 0; k < 4; k++) R(c, cx - 14 + k * 8, by - 4, 3, 6, '#fff8e0');
          break;
        case 'pike':
          R(c, cx - 2, by - 56, 4, 56, '#5e4430');
          R(c, cx - 8, by - 66, 16, 13, '#d8d0b8');
          R(c, cx - 5, by - 61, 3, 3, '#1a1214');
          R(c, cx + 2, by - 61, 3, 3, '#1a1214');
          R(c, cx - 6, by - 52, 12, 3, '#8a1420');
          break;
        case 'gear': {
          const a = time * 0.02 * (seed % 2 ? 1 : -1);
          c.save();
          c.translate(cx, by - 30);
          c.rotate(a);
          c.fillStyle = pc;
          for (let k = 0; k < 8; k++) {
            c.rotate(Math.PI / 4);
            c.fillRect(-4, -28, 8, 10);
          }
          c.beginPath();
          c.arc(0, 0, 21, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = pd;
          c.beginPath();
          c.arc(0, 0, 9, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = pl;
          c.fillRect(-2, -20, 4, 10);
          c.restore();
          break;
        }
        case 'hourglass': {
          R(c, cx - 16, by - 6, 32, 6, pc);
          R(c, cx - 16, by - 58, 32, 6, pc);
          R(c, cx - 14, by - 52, 3, 46, pd);
          R(c, cx + 11, by - 52, 3, 46, pd);
          c.globalAlpha = 0.45;
          R(c, cx - 10, by - 52, 20, 46, '#bfe8ff');
          c.globalAlpha = 1;
          const sand = (time * 0.2) % 20;
          R(c, cx - 8, by - 50, 16, 18 - sand * 0.8, '#e0c070');
          R(c, cx - 1, by - 32, 2, 18, '#e0c070');
          R(c, cx - 8, by - 6 - sand, 16, sand, '#e0c070');
          break;
        }
        case 'crystal': {
          const bob = Math.sin(time * 0.05 + seed) * 4;
          c.globalAlpha = 0.85;
          c.fillStyle = th.flame[1];
          c.beginPath();
          c.moveTo(cx, by - 54 + bob);
          c.lineTo(cx + 10, by - 34 + bob);
          c.lineTo(cx, by - 14 + bob);
          c.lineTo(cx - 10, by - 34 + bob);
          c.fill();
          c.fillStyle = '#ffffff';
          c.fillRect(cx - 2, by - 46 + bob, 3, 14);
          c.globalAlpha = 0.3;
          R(c, cx - 12, by - 2, 24, 4, '#000');
          c.globalAlpha = 1;
          canaanLight(cx, by - 34, 140, th.flame[1]);
          break;
        }
        case 'orb': {
          const bob = Math.sin(time * 0.04 + seed) * 5;
          c.globalAlpha = 0.9;
          c.fillStyle = th.flame[1];
          c.beginPath();
          c.arc(cx, by - 40 + bob, 12, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(cx - 3, by - 43 + bob, 4, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          canaanLight(cx, by - 40, 150, th.flame[1]);
          break;
        }
        case 'feathers':
          for (let k = 0; k < 4; k++) {
            const x = cx - 16 + k * 10,
              y = by - 6 - (k % 2) * 6;
            R(c, x, y, 9, 3, '#ffffff');
            R(c, x + 3, y - 2, 2, 7, '#e8dcc0');
          }
          break;
      }
    }
    function drawCenterpiece(c, p, th) {
      const cx = p.x * TS + 24,
        by = p.y * TS + 44,
        [pc, pd, pl] = th.pillar;
      switch (p.kind) {
        case 'bonethrone':
          R(c, cx - 40, by - 20, 80, 22, '#c8bea4');
          R(c, cx - 30, by - 90, 60, 72, '#d8d0b8');
          for (let k = 0; k < 5; k++) {
            R(c, cx - 34 + k * 14, by - 104, 12, 12, '#e8e0c8');
            R(c, cx - 31 + k * 14, by - 100, 2, 3, '#1a1214');
            R(c, cx - 26 + k * 14, by - 100, 2, 3, '#1a1214');
          }
          R(c, cx - 20, by - 70, 40, 40, '#9a917a');
          R(c, cx - 48, by - 50, 14, 50, '#d8d0b8');
          R(c, cx + 34, by - 50, 14, 50, '#d8d0b8');
          break;
        case 'mithrilcluster': {
          const g = 0.75 + Math.sin(time * 0.04) * 0.2;
          c.globalAlpha = g;
          const shard = (x, h, w, col) => {
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(cx + x - w, by);
            c.lineTo(cx + x, by - h);
            c.lineTo(cx + x + w, by);
            c.fill();
          };
          shard(-30, 60, 14, '#5cb8e0');
          shard(28, 70, 14, '#5cb8e0');
          shard(-8, 110, 20, '#7de0ff');
          shard(12, 84, 16, '#c8f7ff');
          c.globalAlpha = 1;
          R(c, cx - 50, by - 6, 100, 10, '#3d434d');
          canaanLight(cx, by - 50, 260, '#7de0ff');
          break;
        }
        case 'altar': {
          R(c, cx - 44, by - 30, 88, 32, pd);
          R(c, cx - 48, by - 36, 96, 8, pl);
          R(c, cx - 30, by - 28, 60, 22, pc);
          flame(c, cx - 34, by - 36, 0.8, th.flame, 1);
          flame(c, cx + 34, by - 36, 0.8, th.flame, 2);
          // Disque d'éclipse : un soleil masqué par la lune.
          const y = by - 90 + Math.sin(time * 0.03) * 3;
          c.fillStyle = '#ffcc55';
          c.globalAlpha = 0.35;
          c.beginPath();
          c.arc(cx, y, 34, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          c.beginPath();
          c.arc(cx, y, 24, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#120a1c';
          c.beginPath();
          c.arc(cx + 8, y - 3, 22, 0, Math.PI * 2);
          c.fill();
          canaanLight(cx, y, 260, th.flame[1]);
          break;
        }
        case 'greatforge': {
          R(c, cx - 56, by - 80, 112, 84, '#2a1a14');
          R(c, cx - 56, by - 80, 112, 8, '#4a302a');
          R(c, cx - 36, by - 56, 72, 60, '#140806');
          const f = 0.75 + Math.sin(time * 0.1) * 0.2;
          c.globalAlpha = f;
          R(c, cx - 32, by - 34, 64, 38, '#e5522e');
          R(c, cx - 22, by - 26, 44, 30, '#f9a640');
          R(c, cx - 10, by - 18, 20, 22, '#fff1b5');
          c.globalAlpha = 1;
          R(c, cx - 20, by - 116, 40, 38, '#3a2a26');
          canaanLight(cx, by - 20, 320, '#ff6a1f');
          break;
        }
        case 'block':
          R(c, cx - 30, by - 26, 60, 28, '#3a2a26');
          R(c, cx - 30, by - 26, 60, 4, '#5a4038');
          R(c, cx - 12, by - 30, 24, 6, '#6a1a1a');
          for (const ox of [-38, 34])
            for (let k = 0; k < 8; k++) R(c, cx + ox + (k % 2), by - 100 + k * 9, 4, 7, '#6a6a72');
          R(c, cx - 44, by - 108, 88, 8, '#2a2026');
          break;
        case 'throne': {
          const gold = th.key === 'seraphin';
          R(c, cx - 50, by - 12, 100, 14, gold ? '#d4aa3a' : '#3a1414');
          R(c, cx - 30, by - 110, 60, 100, gold ? '#fff4d8' : '#5a1010');
          R(c, cx - 30, by - 110, 60, 6, gold ? '#d4aa3a' : '#d4a44a');
          R(c, cx - 22, by - 100, 44, 70, gold ? '#d4aa3a' : '#8a1420');
          R(c, cx - 42, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
          R(c, cx + 28, by - 50, 14, 40, gold ? '#d4aa3a' : '#d4a44a');
          for (let k = 0; k < 3; k++) R(c, cx - 22 + k * 18, by - 124, 8, 14, gold ? '#ffe680' : '#d4a44a');
          if (gold) {
            R(c, cx - 70, by - 96, 26, 60, '#ffffff');
            R(c, cx + 44, by - 96, 26, 60, '#ffffff');
            canaanLight(cx, by - 60, 240, '#ffe680');
          }
          break;
        }
        case 'orrery': {
          R(c, cx - 10, by - 50, 20, 52, pc);
          R(c, cx - 26, by - 6, 52, 8, pd);
          c.strokeStyle = pl;
          c.lineWidth = 3;
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.ellipse(cx, by - 80, 30 + k * 16, 10 + k * 6, 0, 0, Math.PI * 2);
            c.stroke();
            const a = time * (0.02 + k * 0.012) + k * 2;
            c.fillStyle = ['#7de0ff', '#ff7fa7', '#ffd36d'][k];
            c.beginPath();
            c.arc(cx + Math.cos(a) * (30 + k * 16), by - 80 + Math.sin(a) * (10 + k * 6), 7, 0, Math.PI * 2);
            c.fill();
          }
          c.fillStyle = '#fff6c0';
          c.beginPath();
          c.arc(cx, by - 80, 12, 0, Math.PI * 2);
          c.fill();
          canaanLight(cx, by - 80, 240, '#9fd8ff');
          break;
        }
        case 'scales': {
          R(c, cx - 30, by - 8, 60, 10, '#8a6a1a');
          R(c, cx - 5, by - 120, 10, 114, '#d4aa3a');
          const tilt = Math.sin(time * 0.02) * 8;
          c.save();
          c.translate(cx, by - 116);
          c.rotate((tilt * Math.PI) / 180);
          R(c, -70, -3, 140, 6, '#ffe680');
          c.restore();
          for (const s of [-1, 1]) {
            const px = cx + s * 66,
              py = by - 116 + s * tilt * 1.1;
            R(c, px - 1, py, 2, 36, '#d4aa3a');
            R(c, px - 22, py + 36, 44, 6, '#ffe680');
            R(c, px - 16, py + 42, 32, 4, '#d4aa3a');
          }
          R(c, cx - 10, by - 132, 20, 14, '#fff0a8');
          canaanLight(cx, by - 80, 280, '#fff0a8');
          break;
        }
      }
    }
    function drawDecal(c, dcl, th) {
      const x = dcl.x * TS + 24,
        y = dcl.y * TS + 24;
      if (dcl.kind === 'portal') {
        const r = 34 + Math.sin(time * 0.05) * 3;
        c.save();
        c.globalAlpha = 0.85;
        c.strokeStyle = th.rune;
        c.lineWidth = 6;
        c.beginPath();
        c.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 0.35;
        c.fillStyle = th.rune;
        c.beginPath();
        c.ellipse(x, y, r * 0.8, r * 0.42, 0, 0, Math.PI * 2);
        c.fill();
        for (let k = 0; k < 6; k++) {
          const a = time * 0.04 + k;
          c.globalAlpha = 0.8;
          c.fillRect(x + Math.cos(a) * r - 2, y + Math.sin(a) * r * 0.55 - 2, 4, 4);
        }
        c.restore();
        canaanLight(x, y, 170, th.rune);
      } else if (dcl.kind === 'runecircle' || dcl.kind === 'eclipse') {
        const r = 110;
        c.save();
        c.globalAlpha = 0.5;
        c.strokeStyle = th.rune;
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
        c.stroke();
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(x, y, r * 0.78, r * 0.47, 0, 0, Math.PI * 2);
        c.stroke();
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2 + time * 0.004;
          c.fillStyle = th.rune;
          c.fillRect(x + Math.cos(a) * r * 0.89 - 3, y + Math.sin(a) * r * 0.535 - 3, 6, 6);
        }
        if (dcl.kind === 'eclipse') {
          c.globalAlpha = 0.55;
          c.fillStyle = '#e0b04a';
          c.beginPath();
          c.ellipse(x, y, 52, 31, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#120a1c';
          c.beginPath();
          c.ellipse(x + 14, y - 4, 48, 29, 0, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      } else if (dcl.kind === 'splat') {
        c.save();
        c.globalAlpha = 0.5;
        c.fillStyle = th.hazard.style === 'blood' ? '#5a0a10' : '#2a1030';
        c.beginPath();
        c.ellipse(x, y, 16, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.fillRect(x + 12, y - 2, 10, 4);
        c.fillRect(x - 20, y + 4, 6, 3);
        c.restore();
      }
    }
    function drawGate(c, g, th) {
      const xs = g.cells.map(cl => cl[0]),
        ys = g.cells.map(cl => cl[1]),
        X = Math.min(...xs) * TS,
        Y = Math.min(...ys) * TS,
        w = (Math.max(...xs) - Math.min(...xs) + 1) * TS,
        h = (Math.max(...ys) - Math.min(...ys) + 1) * TS;
      if (th.gate === 'barrier') {
        const a = 0.45 + Math.sin(time * 0.08) * 0.15;
        c.save();
        c.globalAlpha = a;
        c.fillStyle = th.rune;
        c.fillRect(X, Y, w, h);
        c.globalAlpha = 0.9;
        c.fillStyle = '#ffffff';
        for (let k = 0; k < 6; k++) {
          const t = (time * 0.6 + k * 23) % 48;
          if (w > h) c.fillRect(X + ((k * 29 + time) % w), Y + t, 3, 6);
          else c.fillRect(X + t, Y + ((k * 29 + time) % h), 6, 3);
        }
        c.restore();
        canaanLight(X + w / 2, Y + h / 2, 160, th.rune);
        return;
      }
      // Herse de fer.
      c.fillStyle = '#1c1c20';
      c.fillRect(X, Y, w, h);
      c.fillStyle = '#5a5a62';
      if (w >= h) {
        for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y, 5, h);
        for (let y = Y + 8; y < Y + h; y += 16) c.fillRect(X, y, w, 4);
      } else {
        for (let y = Y + 4; y < Y + h; y += 12) c.fillRect(X, y, w, 5);
        for (let x = X + 8; x < X + w; x += 16) c.fillRect(x, Y, 4, h);
      }
      c.fillStyle = '#8a8a94';
      if (w >= h) for (let x = X + 4; x < X + w; x += 12) c.fillRect(x, Y + h - 6, 5, 6);
    }
    // ---------------------------------------------------------------- Objets de l'exploration
    // Dessinés en gros pixels de 3 px, aplats de 3 tons et contour sombre, comme les bâtiments de l'île.
    const INK = '#1a1210';
    function px3(c, x, y, w, h, col) {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), w * 3, h * 3);
    }
    // Rectangle de pixels cerné d'encre.
    function block(c, x, y, w, h, col) {
      px3(c, x - 3, y - 3, w + 2, h + 2, INK);
      px3(c, x, y, w, h, col);
    }
    function sigil(c, id, x, y, lit, size = 14) {
      const sg = SIGILS[id];
      c.save();
      c.font = 'bold ' + size + 'px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = INK;
      c.fillText(sg.sym, x + 1, y + 1);
      c.fillStyle = lit ? sg.col : '#8a8070';
      c.fillText(sg.sym, x, y);
      c.restore();
      if (lit) canaanLight(x, y, 70, sg.col);
    }
    function drawLever(c, p, th, down) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      block(c, X + 3, Y + 27, 8, 4, th.pillar[1]);
      px3(c, X + 3, Y + 27, 8, 1, th.pillar[2]);
      // Manche : relevé (vers le haut à gauche) ou abaissé (vers le bas à droite), pommeau coloré.
      const pts = down
        ? [
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3]
          ]
        : [
            [0, 0],
            [-1, -1],
            [-2, -2],
            [-3, -3]
          ];
      for (const [dx, dy] of pts) px3(c, X + 15 + dx * 3, Y + 21 + dy * 3 + (down ? 0 : 0), 1, 1, '#6a4a30');
      const [ex, ey] = pts[3];
      block(c, X + 15 + ex * 3 - 1, Y + 21 + ey * 3 - 3, 2, 2, down ? SIGILS[p.id].col : '#c84a3a');
      sigil(c, p.id, X + 15, Y - 6, down);
    }
    function drawBrazierOff(c, p, th, lit) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      for (const dx of [1, 8]) block(c, X + dx * 3, Y + 21, 1, 6, '#3a3a40');
      block(c, X + 3, Y + 15, 8, 3, '#4a4a52');
      px3(c, X + 3, Y + 15, 8, 1, '#6a6a72');
      px3(c, X + 6, Y + 12, 2, 1, lit ? '#3a2014' : '#2a2a2e');
      if (lit) {
        flame(c, p.x * TS + 24, Y + 14, 1.1, th.flame, p.x + p.y);
        canaanLight(p.x * TS + 24, Y + 6, 150, th.flame[1]);
      } else {
        // Braises froides et filet de fumée.
        px3(c, X + 9, Y + 12, 1, 1, '#5a4a40');
        c.fillStyle = 'rgba(150,140,140,.35)';
        c.fillRect(X + 22, Y + 4 - ((time * 0.3) % 12), 3, 3);
      }
    }
    function drawStele(c, p, th, lock) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 6;
      block(c, X, Y + 6, 8, 12, th.pillar[0]);
      px3(c, X, Y + 6, 8, 1, th.pillar[2]);
      px3(c, X + 21, Y + 6, 1, 12, th.pillar[1]);
      px3(c, X - 3, Y + 39, 10, 2, th.pillar[1]);
      for (let k = 0; k < 4; k++) px3(c, X + 3, Y + 15 + k * 6, 6, 1, th.pillar[1]);
      // Symboles de la séquence (leviers, dalles) ou flamme gravée (braseros) au fronton.
      if (lock.type !== 'braziers') {
        c.fillStyle = th.rune;
        c.globalAlpha = 0.5 + 0.3 * Math.sin(time * 0.06 + p.x);
        c.fillRect(X + 9, Y + 9, 6, 3);
        c.globalAlpha = 1;
      }
      canaanLight(X + 12, Y + 18, 60, th.rune);
    }
    function drawPlate(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS;
      c.fillStyle = INK;
      c.fillRect(X + 3, Y + 3, 42, 42);
      c.fillStyle = lit ? SIGILS[p.id].col : th.pillar[1];
      c.fillRect(X + 6, Y + 6, 36, 36);
      c.fillStyle = lit ? '#ffffff' : th.pillar[0];
      c.fillRect(X + 6, Y + 6, 36, 3);
      c.fillStyle = INK;
      c.fillRect(X + 9, Y + 39, 30, 3);
      sigil(c, p.id, X + 24, Y + 25, lit, 18);
    }
    function drawTreasure(c, p) {
      const X = p.x * TS + 3,
        Y = p.y * TS + 12;
      // Tas de pièces d'or, gemmes et un calice.
      block(c, X + 3, Y + 18, 12, 4, '#c8961e');
      block(c, X + 9, Y + 12, 6, 3, '#e8b830');
      px3(c, X + 6, Y + 18, 2, 1, '#fff0a0');
      px3(c, X + 21, Y + 12, 1, 1, '#fff0a0');
      px3(c, X + 30, Y + 21, 1, 1, '#ff5070');
      px3(c, X + 9, Y + 21, 1, 1, '#7de0ff');
      block(c, X + 27, Y + 6, 2, 3, '#d8a838');
      px3(c, X + 24, Y + 3, 4, 1, '#ffd36d');
      if (Math.floor(time / 12 + p.x) % 5 === 0) px3(c, X + 15, Y + 9, 1, 1, '#ffffff');
      canaanLight(X + 21, Y + 18, 90, '#ffd36d');
    }
    // Porte scellée : dalle de pierre cerclée de fer, sceau lumineux du mécanisme qui la tient.
    function drawDoor(c, g, th, lock) {
      const xs = g.cells.map(cl => cl[0]),
        ys = g.cells.map(cl => cl[1]),
        X = Math.min(...xs) * TS,
        Y = Math.min(...ys) * TS,
        w = (Math.max(...xs) - Math.min(...xs) + 1) * TS,
        h = (Math.max(...ys) - Math.min(...ys) + 1) * TS;
      c.fillStyle = INK;
      c.fillRect(X, Y, w, h);
      c.fillStyle = th.pillar[1];
      c.fillRect(X + 3, Y + 3, w - 6, h - 6);
      c.fillStyle = th.pillar[0];
      for (let k = 0; k < (w > h ? w : h); k += 24)
        w > h ? c.fillRect(X + k + 3, Y + 6, 18, h - 15) : c.fillRect(X + 6, Y + k + 3, w - 15, 18);
      c.fillStyle = '#3a3a40';
      if (w > h) c.fillRect(X, Y + h / 2 - 3, w, 6);
      else c.fillRect(X + w / 2 - 3, Y, 6, h);
      const cx = X + w / 2,
        cy = Y + h / 2,
        pulse = 0.6 + 0.4 * Math.sin(time * 0.07);
      c.fillStyle = INK;
      c.fillRect(cx - 15, cy - 15, 30, 30);
      c.fillStyle = th.pillar[2];
      c.fillRect(cx - 12, cy - 12, 24, 24);
      c.globalAlpha = pulse;
      c.fillStyle = th.rune;
      c.fillRect(cx - 6, cy - 6, 12, 12);
      c.globalAlpha = 1;
      c.font = 'bold 14px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = INK;
      c.fillText(
        {
          braziers: '🔥',
          levers: '⚙',
          runes: '✦',
          guardian: '⚔',
          mirrors: '◈',
          memory: '♪',
          toggles: '⭐',
          search: '💠',
          ambush: '☠'
        }[lock.type],
        cx,
        cy + 1
      );
      c.textBaseline = 'alphabetic';
      canaanLight(cx, cy, 120, th.rune);
    }
    // Miroir sur pivot : une plaque d'argent inclinée en « / » ou en « \ ».
    function drawMirror(c, p, th, slash) {
      const X = p.x * TS,
        Y = p.y * TS;
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath();
      c.ellipse(X + 24, Y + 40, 15, 5, 0, 0, Math.PI * 2);
      c.fill();
      block(c, X + 15, Y + 33, 6, 3, th.pillar[1]);
      px3(c, X + 15, Y + 33, 6, 1, th.pillar[2]);
      c.save();
      c.translate(X + 24, Y + 20);
      c.rotate(slash ? Math.PI / 4 : -Math.PI / 4);
      c.fillStyle = INK;
      c.fillRect(-19, -6, 38, 12);
      c.fillStyle = '#b8c8d8';
      c.fillRect(-16, -3, 32, 6);
      c.fillStyle = '#ffffff';
      c.fillRect(-16, -3, 32, 2);
      c.restore();
    }
    function drawEmitter(c, p, th) {
      const X = p.x * TS,
        Y = p.y * TS,
        [dx, dy] = p.dir;
      block(c, X + 9, Y + 18, 10, 8, th.pillar[1]);
      px3(c, X + 9, Y + 18, 10, 1, th.pillar[2]);
      c.fillStyle = '#fff6c8';
      c.beginPath();
      c.arc(X + 24 + dx * 10, Y + 24 + dy * 10, 7 + Math.sin(time * 0.15), 0, Math.PI * 2);
      c.fill();
      canaanLight(X + 24, Y + 24, 140, '#fff0b0');
    }
    function drawMirrorTarget(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS;
      block(c, X + 12, Y + 33, 8, 3, th.pillar[1]);
      c.fillStyle = INK;
      c.beginPath();
      c.moveTo(X + 24, Y - 4);
      c.lineTo(X + 38, Y + 18);
      c.lineTo(X + 24, Y + 38);
      c.lineTo(X + 10, Y + 18);
      c.fill();
      c.fillStyle = lit ? '#fff6c8' : th.rune;
      c.globalAlpha = lit ? 1 : 0.55;
      c.beginPath();
      c.moveTo(X + 24, Y + 1);
      c.lineTo(X + 34, Y + 18);
      c.lineTo(X + 24, Y + 33);
      c.lineTo(X + 14, Y + 18);
      c.fill();
      c.globalAlpha = 1;
      canaanLight(X + 24, Y + 18, lit ? 220 : 80, lit ? '#fff6c8' : th.rune);
    }
    // Rayon de lumière : de l'émetteur, rebondissant sur les miroirs, jusqu'au mur ou au cristal.
    function drawBeam(c, pts, lit) {
      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (const [w, col, a] of [
        [14, lit ? '#fff2a0' : '#ffe08a', 0.25],
        [6, '#fff6c8', 0.8],
        [2, '#ffffff', 1]
      ]) {
        c.globalAlpha = a * (0.85 + 0.15 * Math.sin(time * 0.2));
        c.strokeStyle = col;
        c.lineWidth = w;
        c.beginPath();
        pts.forEach(([x, y], k) => (k ? c.lineTo : c.moveTo).call(c, x * TS + 24, y * TS + 20));
        c.stroke();
      }
      c.restore();
    }
    // Pierre d'écho : une cloche de pierre qui vibre quand elle chante.
    function drawEchoStone(c, p, th, singing) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 4;
      block(c, X, Y + 18, 8, 8, th.pillar[0]);
      px3(c, X, Y + 18, 8, 1, th.pillar[2]);
      block(c, X + 6, Y + 6, 4, 4, th.pillar[1]);
      px3(c, X - 3, Y + 42, 10, 2, th.pillar[1]);
      if (singing)
        for (let k = 0; k < 3; k++) {
          c.globalAlpha = 0.6 - k * 0.18;
          c.strokeStyle = th.rune;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(X + 12, Y + 14, 12 + k * 9 + ((time * 0.6) % 9), 0, Math.PI * 2);
          c.stroke();
        }
      c.globalAlpha = 1;
      canaanLight(X + 12, Y + 18, singing ? 140 : 60, th.rune);
    }
    function drawEchoCrystal(c, p, th, lit) {
      const X = p.x * TS,
        Y = p.y * TS,
        col = SIGILS[p.id].col;
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath();
      c.ellipse(X + 24, Y + 40, 13, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = INK;
      c.beginPath();
      c.moveTo(X + 24, Y - 6);
      c.lineTo(X + 35, Y + 22);
      c.lineTo(X + 24, Y + 40);
      c.lineTo(X + 13, Y + 22);
      c.fill();
      c.fillStyle = col;
      c.globalAlpha = lit ? 1 : 0.42;
      c.beginPath();
      c.moveTo(X + 24, Y - 1);
      c.lineTo(X + 31, Y + 22);
      c.lineTo(X + 24, Y + 35);
      c.lineTo(X + 17, Y + 22);
      c.fill();
      c.globalAlpha = 1;
      sigil(c, p.id, X + 24, Y + 18, lit, 13);
      if (lit) canaanLight(X + 24, Y + 18, 200, col);
    }
    function drawTogglePillar(c, p, th, lit) {
      const X = p.x * TS + 12,
        Y = p.y * TS - 18;
      block(c, X, Y + 6, 8, 18, lit ? th.pillar[2] : th.pillar[1]);
      px3(c, X, Y + 6, 8, 1, th.pillar[2]);
      px3(c, X + 21, Y + 6, 1, 18, th.pillar[1]);
      px3(c, X - 3, Y + 57, 10, 2, INK);
      c.fillStyle = lit ? th.rune : '#3a3640';
      c.fillRect(X + 6, Y + 18, 12, 12);
      if (lit) {
        c.fillStyle = '#ffffff';
        c.fillRect(X + 9, Y + 21, 6, 6);
        canaanLight(X + 12, Y + 24, 150, th.rune);
      }
    }
    // Urne de terre : intacte (un éclat luit à peine quand elle cache un fragment) ou brisée.
    function drawUrn(c, p, th, broken, shard) {
      const X = p.x * TS + 9,
        Y = p.y * TS + 6;
      if (broken) {
        for (const [dx, dy] of [
          [0, 30],
          [12, 33],
          [21, 27],
          [6, 24]
        ])
          block(c, X + dx, Y + dy, 3, 2, '#8a5a3a');
        return;
      }
      block(c, X + 6, Y + 12, 6, 2, '#6a4028');
      block(c, X + 3, Y + 18, 12, 12, '#9a6440');
      px3(c, X + 3, Y + 18, 3, 12, '#b8805a');
      px3(c, X + 3, Y + 24, 12, 1, '#6a4028');
      if (shard && Math.floor(time / 7 + p.id * 5) % 23 === 0) {
        px3(c, X + 15, Y + 21, 1, 1, '#ffffff');
        canaanLight(X + 18, Y + 24, 50, th.rune);
      }
    }
    // Torche secrète : comme les autres, mais sa flamme n'a pas la couleur du thème.
    function drawSecretTorch(c, p, th, done) {
      const cx = p.x * TS + 24,
        Y = p.y * TS,
        cols = done ? th.flame : ['#2a8a6a', '#5ae0b0', '#d8fff0'];
      R(c, cx - 2, Y + (done ? 30 : 24), 4, 14, '#4a3324');
      R(c, cx - 6, Y + (done ? 26 : 20), 12, 5, '#6f5137');
      flame(c, cx, Y + (done ? 26 : 20), 1, cols, p.x * 3 + p.y);
      canaanLight(cx, Y + 30, 170, cols[1]);
    }
    // Statue de travers : elle regarde ailleurs que ses sœurs (et se redresse une fois tournée).
    function drawSecretStatue(c, p, th, done) {
      const ax = p.x * TS + 24,
        ay = p.y * TS + 42;
      c.save();
      if (!done) {
        c.translate(ax, ay);
        c.rotate(0.14);
        c.translate(-ax, -ay);
      }
      drawFloorProp(c, { ...p, kind: 'statue' }, th);
      c.restore();
    }
    function drawPuffball(c, p) {
      const X = p.x * TS + 24,
        Y = p.y * TS + 30,
        swell = 1 + 0.12 * Math.sin(((hostTime() + p.phase) % 300) * 0.02);
      c.fillStyle = '#4a6a2a';
      c.fillRect(X - 3, Y, 6, 10);
      c.fillStyle = INK;
      c.beginPath();
      c.ellipse(X, Y - 2, 15 * swell, 12 * swell, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#9ac050';
      c.beginPath();
      c.ellipse(X, Y - 3, 12 * swell, 9 * swell, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#d8f0a0';
      c.fillRect(X - 6, Y - 9, 4, 3);
      canaanLight(X, Y, 70, '#a8e060');
    }
    // Pièges en bandes : plaques au repos, qui tremblent quand elles s'arment, puis pointes, flammes ou runes.
    function drawTraps(c, plan, th, view) {
      const kind = th.trap;
      if (plan.traps.length)
        for (const trap of plan.traps) {
          const ph = trapPhase(trap);
          for (const [x, y] of trap.cells) {
            if (!view(x, y)) continue;
            const X = x * TS,
              Y = y * TS,
              jit = ph === 1 ? Math.round(Math.sin(time * 1.3 + x) * 1.5) : 0;
            c.fillStyle = 'rgba(0,0,0,.35)';
            c.fillRect(X + 4, Y + 4, 40, 40);
            c.fillStyle = kind === 'pulse' ? th.floor.b : '#3a3638';
            c.fillRect(X + 6 + jit, Y + 6, 36, 36);
            if (kind === 'pulse') {
              c.globalAlpha = ph === 2 ? 0.95 : ph === 1 ? 0.35 + 0.3 * Math.sin(time * 0.6) : 0.18;
              c.strokeStyle = th.rune;
              c.lineWidth = 3;
              c.strokeRect(X + 12, Y + 12, 24, 24);
              c.beginPath();
              c.moveTo(X + 24, Y + 8);
              c.lineTo(X + 24, Y + 40);
              c.moveTo(X + 8, Y + 24);
              c.lineTo(X + 40, Y + 24);
              c.stroke();
              c.globalAlpha = 1;
              if (ph === 2) canaanLight(X + 24, Y + 24, 90, th.rune);
              continue;
            }
            // Trous des pointes ou buses des jets.
            c.fillStyle = INK;
            for (const [hx, hy] of [
              [12, 12],
              [30, 12],
              [21, 21],
              [12, 30],
              [30, 30]
            ])
              c.fillRect(X + hx + jit, Y + hy, 6, 6);
            if (ph !== 2) continue;
            if (kind === 'jets') {
              flame(c, X + 24, Y + 34, 1.5, th.flame, x + y);
              canaanLight(X + 24, Y + 20, 120, th.flame[1]);
            } else
              for (const [hx, hy] of [
                [12, 12],
                [30, 12],
                [21, 21],
                [12, 30],
                [30, 30]
              ]) {
                c.fillStyle = '#c8c8d0';
                c.beginPath();
                c.moveTo(X + hx, Y + hy + 6);
                c.lineTo(X + hx + 3, Y + hy - 10);
                c.lineTo(X + hx + 6, Y + hy + 6);
                c.fill();
              }
          }
        }
      for (const p of plan.puffs) if (view(p.x, p.y)) drawPuffball(c, p);
      // Éboulements et spores annoncés.
      for (const z of trapZones()) {
        const k = Math.min(1, Math.max(0, (time - z.start) / Math.max(1, z.at - z.start)));
        c.globalAlpha = 0.18 + 0.3 * k;
        c.fillStyle = z.kind === 'spore' ? '#8ad040' : '#a0603a';
        c.beginPath();
        c.arc(z.x, z.y, z.r * k, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 0.8;
        c.strokeStyle = z.kind === 'spore' ? '#c8f080' : '#ffb070';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
        if (z.kind === 'rock') {
          // La pierre tombe du plafond.
          const h = (1 - k) * 160;
          block(c, z.x - 9, z.y - 12 - h, 6, 5, '#7a6a5a');
        }
      }
    }
    // Écho joué par la pierre : quel cristal brille à cet instant (ou -1).
    function echoLit(lock, ls) {
      if (ls.a > 0 && time - ls.t < 26) return ls.a - 1;
      if (ls.a !== 0 || !ls.t || time < ls.t) return -1;
      const k = Math.floor((time - ls.t) / 42);
      return k < lock.order.length && (time - ls.t) % 42 < 30 ? lock.order[k] : -1;
    }
    function drawExplore(c, plan, th, view) {
      const st = dunState();
      if (!st) return;
      for (const p of plan.plates)
        if (view(p.x, p.y))
          drawPlate(c, p, th, !!(st.locks[p.lock].prog & (1 << p.id)) || !!st.locks[p.lock].done);
      // Rayons des miroirs.
      plan.locks.forEach((lock, s) => {
        if (lock.type !== 'mirrors' || !view(lock.emitter.x, lock.emitter.y, 12)) return;
        const ls = st.locks[s],
          beam = ls.done ? { pts: [], lit: true } : beamPath(plan, s, ls.prog);
        if (!ls.done) drawBeam(c, beam.pts, beam.lit);
      });
      // Piliers liés : un fil de runes relie chaque pilier à ses voisins.
      plan.locks.forEach((lock, s) => {
        if (lock.type !== 'toggles' || !view(lock.items[0].x, lock.items[0].y, 12)) return;
        c.save();
        c.globalAlpha = 0.28;
        c.strokeStyle = th.rune;
        c.lineWidth = 2;
        c.setLineDash?.([6, 6]);
        c.beginPath();
        lock.items.forEach((it, k) => (k ? c.lineTo : c.moveTo).call(c, it.x * TS + 24, it.y * TS + 30));
        c.closePath();
        c.stroke();
        c.restore();
      });
      for (const p of plan.props) {
        if (!view(p.x, p.y, 4)) continue;
        if (p.hidden !== undefined && !secretOpen(p.hidden)) continue;
        if (p.kind === 'treasure') drawTreasure(c, p);
        if (p.secretTrigger !== undefined) {
          const done = secretOpen(p.secretTrigger);
          if (p.kind === 'secrettorch') drawSecretTorch(c, p, th, done);
          else drawSecretStatue(c, p, th, done);
          continue;
        }
        if (p.lock === undefined) continue;
        const lock = plan.locks[p.lock],
          ls = st.locks[p.lock],
          on = !!ls.done || !!(ls.prog & (1 << p.id));
        // Agrandis d'un tiers autour du pied (pixels de 4 px) : bien lisibles à côté du héros.
        const ax = p.x * TS + 24,
          ay = p.y * TS + 42;
        c.save();
        c.translate(ax, ay);
        c.scale(4 / 3, 4 / 3);
        c.translate(-ax, -ay);
        if (p.kind === 'lever') drawLever(c, p, th, on);
        else if (p.kind === 'brazier_off') drawBrazierOff(c, p, th, on);
        else if (p.kind === 'stele') drawStele(c, p, th, lock);
        else if (p.kind === 'mirror') drawMirror(c, p, th, (ls.prog >> p.id) & 1);
        else if (p.kind === 'emitter') drawEmitter(c, { ...p, dir: lock.emitter.dir }, th);
        else if (p.kind === 'mtarget') drawMirrorTarget(c, p, th, !!ls.done);
        else if (p.kind === 'echostone') drawEchoStone(c, p, th, echoLit(lock, ls) >= 0 && ls.a === 0);
        else if (p.kind === 'echocrystal') drawEchoCrystal(c, p, th, !!ls.done || echoLit(lock, ls) === p.id);
        else if (p.kind === 'togglepillar') drawTogglePillar(c, p, th, on);
        else if (p.kind === 'urn') drawUrn(c, p, th, !!(ls.prog & (1 << p.id)), lock.shards.includes(p.id));
        c.restore();
      }
      plan.doors.forEach(
        (g, s) =>
          g && game.world.tiles[g.cells[0][1]]?.[g.cells[0][0]] === GATE && drawDoor(c, g, th, plan.locks[s])
      );
      // Embuscade : les issues de la salle se ferment comme des herses.
      plan.locks.forEach(lock => {
        if (lock.seals)
          for (const sl of lock.seals)
            if (sl.cells.length && game.world.tiles[sl.cells[0][1]]?.[sl.cells[0][0]] === GATE)
              drawGate(c, sl, th);
      });
      // Braseros minutés : les secondes qui restent, au-dessus de la porte.
      plan.locks.forEach((lock, s) => {
        const ls = st.locks[s];
        if (lock.type !== 'braziers' || ls.done || !ls.prog || !ls.t) return;
        const left = Math.max(0, Math.ceil((ls.t - time) / 60)),
          g = plan.doors[s],
          [x, y] = g.cells[Math.floor(g.cells.length / 2)];
        c.save();
        c.font = 'bold 18px monospace';
        c.textAlign = 'center';
        c.lineWidth = 4;
        c.strokeStyle = '#1a1008';
        c.fillStyle = left <= 5 ? '#ff6a4a' : '#ffd36d';
        c.strokeText('⏳ ' + left, x * TS + 24, y * TS - 22);
        c.fillText('⏳ ' + left, x * TS + 24, y * TS - 22);
        c.restore();
      });
      // Invitation à agir sur ce qui est à portée de main.
      const what = reachable(P);
      if (!what) return;
      let at = null,
        text = '';
      if (what.kind === 'secret') {
        const w = plan.secretWalls[what.k];
        if (w.kind === 'wall') {
          at = w.cells[1] || w.cells[0];
          text = '[E] Examiner la lézarde';
        } else {
          at = [w.trigger.x, w.trigger.y + (w.trigger.wall ? 1 : 0)];
          text = w.kind === 'torch' ? '[E] Tirer la torche' : '[E] Tourner la statue';
        }
      } else if (what.kind === 'door') {
        const g = plan.doors[what.s];
        at = g.cells[Math.floor(g.cells.length / 2)];
        text = '🔒 [E] Porte scellée';
      } else if (what.kind === 'stele') {
        const lock = plan.locks[what.s];
        at = [lock.stele.x, lock.stele.y];
        text = lock.type === 'memory' ? '[E] Écouter la pierre d’écho' : '[E] Lire la stèle';
      } else {
        const it = plan.locks[what.s].items[what.id];
        at = [it.x, it.y];
        text = {
          braziers: '[E] Allumer le brasero',
          levers: '[E] Actionner le levier',
          mirrors: '[E] Tourner le miroir',
          memory: '[E] Frapper le cristal',
          toggles: '[E] Toucher le pilier',
          search: '[E] Fouiller l’urne'
        }[what.kind];
      }
      c.save();
      c.font = 'bold 13px Palatino Linotype, Georgia, serif';
      c.textAlign = 'center';
      c.lineWidth = 3;
      c.strokeStyle = '#1a1008';
      const label = translateText(text);
      c.strokeText(label, at[0] * TS + 24, at[1] * TS - 18);
      c.fillStyle = '#f6dc98';
      c.fillText(label, at[0] * TS + 24, at[1] * TS - 18);
      c.restore();
    }
    // Objets au sol en gros pixels cernés d'encre, comme le décor de l'île : peints une fois (leurs lumières notées),
    // réduits au tiers sans lissage, contourés, puis réutilisés. Les objets animés restent dessinés à chaque image.
    const LIVE_PROPS = new Set([
      'brazier',
      'candles',
      'gear',
      'hourglass',
      'orb',
      'furnace',
      'pillarlight',
      'crystal'
    ]);
    let propCache = { key: null, map: new Map() };
    function pixelProp(c, p, th, i) {
      if (LIVE_PROPS.has(p.kind) || typeof window.canaanOutline !== 'function')
        return drawFloorProp(c, p, th);
      if (propCache.key !== i) propCache = { key: i, map: new Map() };
      const id = p.x + ',' + p.y;
      let e = propCache.map.get(id);
      if (!e) {
        const big = canvas(144, 144),
          g = big.getContext('2d'),
          lights = [],
          keep = window.canaanLight;
        if (!g || !g.drawImage) return drawFloorProp(c, p, th);
        window.canaanLight = (x, y, r, col) => lights.push([x - p.x * TS, y - p.y * TS, r, col]);
        try {
          g.translate(48 - p.x * TS, 48 - p.y * TS);
          drawFloorProp(g, p, th);
        } finally {
          window.canaanLight = keep;
        }
        const small = canvas(48, 48),
          sg = small.getContext('2d');
        sg.imageSmoothingEnabled = false;
        sg.drawImage(big, 0, 0, 48, 48);
        e = { img: canaanOutline(small, 1), lights };
        propCache.map.set(id, e);
      }
      c.imageSmoothingEnabled = false;
      c.drawImage(e.img, p.x * TS - 51, p.y * TS - 51, e.img.width * 3, e.img.height * 3);
      for (const [x, y, r, col] of e.lights) canaanLight(p.x * TS + x, p.y * TS + y, r, col);
    }
    // Décor de l'instance : sols spéciaux, objets, pièce maîtresse, herses et titre.
    function drawDungeonDecor(c) {
      if (!game.world.instance) return;
      const i = game.world.instance.index,
        th = THEMES[i],
        plan = planFor(i),
        view = (x, y, m = 3) =>
          x * TS > camX - m * TS &&
          x * TS < camX + W + m * TS &&
          y * TS > camY - m * TS &&
          y * TS < camY + H + m * TS;
      const hid = o => o.hidden !== undefined && !secretOpen(o.hidden);
      for (const l of plan.lights)
        if (view(l.x, l.y) && !hid(l))
          canaanLight(l.x * TS, l.y * TS, l.r * (0.9 + Math.sin(time * 0.06 + l.x) * 0.1), l.col);
      c.save();
      if (plan.arena) drawArenaStands(c);
      if (!plan.arena) drawTraps(c, plan, th, view);
      for (const dcl of plan.decals) if (view(dcl.x, dcl.y, 4) && !hid(dcl)) drawDecal(c, dcl, th);
      for (const p of plan.props)
        if (
          view(p.x, p.y, 4) &&
          p.lock === undefined &&
          p.kind !== 'treasure' &&
          p.secretTrigger === undefined &&
          p.kind !== 'puffball' &&
          !hid(p)
        ) {
          if (p.wall) drawWallProp(c, p, th);
          else if (p.center) drawCenterpiece(c, p, th);
          else if (plan.arena) drawFloorProp(c, p, th);
          else pixelProp(c, p, th, i);
        }
      for (const g of plan.gates)
        if (g && game.world.tiles[g.cells[0][1]][g.cells[0][0]] === GATE) drawGate(c, g, th);
      if (!plan.arena) {
        drawExplore(c, plan, th, view);
        drawExitPortal(c, th);
      }
      const d = instances[i],
        mode = instanceDifficulty();
      if (plan.title && view(plan.title.x, plan.title.y, 6)) {
        c.textAlign = 'center';
        c.font = 'bold 18px monospace';
        c.lineWidth = 4;
        c.strokeStyle = '#0b0a10';
        const name = plan.arena ? CANAAN_ARENA_NAME : d.name,
          title =
            '✦ ' +
            translateText(name).toUpperCase() +
            (mode ? ' · ' + mode.icon + ' ' + mode.label : '') +
            ' ✦';
        c.strokeText(title, plan.title.x * TS + 24, plan.title.y * TS);
        c.fillStyle = th.rune;
        c.fillText(title, plan.title.x * TS + 24, plan.title.y * TS);
      }
      c.textAlign = 'center';
      c.font = 'bold 13px monospace';
      c.fillStyle = '#fff2cb';
      c.fillText('↟ SORTIE [E] ↟', instanceEntrance.x, instanceEntrance.y + 62);
      c.restore();
    }

    // ---------------------------------------------------------------- Entrées sur l'île
    // Ouverture du portail : un tourbillon de la couleur du thème.
    function membrane(c, x, y, rx, ry, col) {
      c.save();
      c.fillStyle = '#07060c';
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.55;
      const g = c.createRadialGradient(x, y, 2, x, y, Math.max(rx, ry));
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.85;
      c.strokeStyle = col;
      c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const a = time * 0.04 + k * 2.1;
        c.beginPath();
        c.ellipse(x, y, rx * (0.35 + k * 0.2), ry * (0.35 + k * 0.2), 0, a, a + 2.2);
        c.stroke();
      }
      c.restore();
      canaanLight(x, y, 170, col);
    }
    function drawDungeonEntrance(c, i, x, y) {
      const th = THEMES[i],
        d = instances[i],
        w = th.wall,
        [pc, pd, pl] = th.pillar,
        oy = y - 34;
      c.save();
      c.fillStyle = 'rgba(8,10,16,.4)';
      c.beginPath();
      c.ellipse(x, y + 26, 84, 22, 0, 0, Math.PI * 2);
      c.fill();
      switch (th.entrance || th.key) {
        case 'arene': {
          // Façade de colisée : deux étages d'arcades en grès, grande arche centrale, braseros et bannières.
          const sand = '#c8a878',
            sandDark = '#8a6a4a',
            sandLight = '#ecd2a2';
          c.fillStyle = sandDark;
          c.beginPath();
          c.ellipse(x, y + 8, 104, 116, 0, Math.PI, 0);
          c.fill();
          c.fillStyle = sand;
          c.beginPath();
          c.ellipse(x, y + 8, 98, 110, 0, Math.PI, 0);
          c.fill();
          R(c, x - 104, y + 2, 208, 10, sandDark);
          R(c, x - 98, y - 50, 196, 5, sandLight);
          R(c, x - 76, y - 92, 152, 4, sandLight);
          // Arcades sombres sur deux étages.
          for (let k = -3; k <= 3; k++) {
            if (Math.abs(k) <= 1) continue;
            const ax = x + k * 25;
            R(c, ax - 8, y - 38, 16, 38, '#2a1a10');
            c.fillStyle = '#2a1a10';
            c.beginPath();
            c.arc(ax, y - 38, 8, Math.PI, 0);
            c.fill();
            R(c, ax - 8, y - 38, 2, 38, sandLight);
          }
          for (let k = -2; k <= 2; k++) {
            const ax = x + k * 27;
            R(c, ax - 6, y - 84, 12, 26, '#3a2414');
            c.fillStyle = '#3a2414';
            c.beginPath();
            c.arc(ax, y - 84, 6, Math.PI, 0);
            c.fill();
          }
          // Grande arche centrale : portail pourpre et or.
          R(c, x - 36, y - 62, 72, 66, sandDark);
          c.fillStyle = sandLight;
          c.beginPath();
          c.arc(x, y - 30, 36, Math.PI, 0);
          c.fill();
          membrane(c, x, y - 16, 28, 40, th.rune);
          R(c, x - 4, y - 72, 8, 8, '#ffd36d');
          R(c, x - 2, y - 70, 4, 4, '#fff6c5');
          // Épées croisées et laurier au fronton.
          c.save();
          c.translate(x, y - 108);
          for (const s of [-1, 1]) {
            c.save();
            c.rotate(s * 0.7);
            R(c, -2, -22, 4, 34, '#dfe6ee');
            R(c, -2, -22, 1, 34, '#ffffff');
            R(c, -7, 8, 14, 3, '#d4aa3a');
            R(c, -2, 11, 4, 8, '#6a4a2a');
            c.restore();
          }
          c.restore();
          for (const s of [-1, 1])
            for (let k = 0; k < 5; k++) R(c, x + s * (14 + k * 5), y - 100 + k * 4, 5, 3, '#6aa04a');
          // Bannières et braseros de part et d'autre.
          for (const s of [-1, 1]) {
            const bx = x + s * 52;
            R(c, bx - 9, y - 58, 18, 3, '#3a2a1c');
            R(c, bx - 7, y - 55, 14, 30, th.banner[0]);
            R(c, bx - 7, y - 25, 5, 5, th.banner[0]);
            R(c, bx + 2, y - 25, 5, 5, th.banner[0]);
            R(c, bx - 2, y - 50, 4, 12, th.banner[1]);
            R(c, bx - 5, y - 46, 10, 3, th.banner[1]);
            const fx = x + s * 86;
            R(c, fx - 3, y - 18, 6, 30, '#3a3a40');
            R(c, fx - 12, y - 24, 24, 8, '#4a4a52');
            R(c, fx - 12, y - 24, 24, 2, '#6a6a72');
            flame(c, fx, y - 24, 1.3, th.flame, s + 3);
            canaanLight(fx, y - 34, 170, th.flame[1]);
          }
          break;
        }
        case 'terriers': {
          // Butte de terre et de roche, bouche de grotte, racines et torches.
          c.fillStyle = '#5b4733';
          c.beginPath();
          c.ellipse(x, y + 4, 86, 70, 0, Math.PI, 0);
          c.fill();
          c.fillStyle = '#7d6449';
          c.beginPath();
          c.ellipse(x - 10, y - 20, 60, 42, 0, Math.PI, 0);
          c.fill();
          R(c, x - 70, y - 4, 26, 18, w.light);
          R(c, x + 44, y - 10, 30, 22, w.face);
          R(c, x + 50, y - 14, 18, 6, w.light);
          membrane(c, x, oy + 14, 30, 36, th.rune);
          for (let k = 0; k < 5; k++)
            R(c, x - 30 + k * 14, y - 64 + (k % 2) * 6, 3, 14 + (k % 3) * 6, '#3b2a1a');
          flame(c, x - 52, y - 30, 1, th.flame, 1);
          flame(c, x + 52, y - 30, 1, th.flame, 2);
          R(c, x - 54, y - 30, 4, 34, '#4a3324');
          R(c, x + 50, y - 30, 4, 34, '#4a3324');
          canaanLight(x - 52, y - 40, 150, th.flame[1]);
          canaanLight(x + 52, y - 40, 150, th.flame[1]);
          break;
        }
        case 'mine': {
          c.fillStyle = w.face;
          c.beginPath();
          c.moveTo(x - 92, y + 12);
          c.lineTo(x - 50, y - 70);
          c.lineTo(x + 10, y - 92);
          c.lineTo(x + 70, y - 60);
          c.lineTo(x + 94, y + 12);
          c.fill();
          R(c, x - 40, y - 74, 30, 10, w.light);
          R(c, x + 30, y - 60, 24, 8, w.light);
          membrane(c, x, oy + 10, 30, 40, th.rune);
          R(c, x - 40, y - 82, 12, 96, '#6a4a30');
          R(c, x + 28, y - 82, 12, 96, '#6a4a30');
          R(c, x - 48, y - 92, 96, 14, '#8a6a46');
          R(c, x - 48, y - 92, 96, 3, '#b08a5e');
          for (let k = 0; k < 4; k++) R(c, x - 26, y + 6 + k * 9, 52, 4, '#5e4430');
          R(c, x - 18, y + 4, 4, 40, '#a7aab4');
          R(c, x + 14, y + 4, 4, 40, '#a7aab4');
          R(c, x + 50, y - 6, 34, 20, '#4a4a52');
          R(c, x + 54, y - 12, 10, 8, '#7de0ff');
          R(c, x + 66, y - 14, 10, 10, '#c8f7ff');
          R(c, x - 62, y - 70, 2, 14, '#2a2a2e');
          R(c, x - 68, y - 56, 14, 16, '#ffcf6a');
          canaanLight(x - 61, y - 48, 150, '#ffcf6a');
          canaanLight(x + 64, y - 10, 90, '#7de0ff');
          break;
        }
        case 'eclipse':
        case 'seraphin':
        case 'penitents':
        case 'bastion': {
          // Portail bâti : marches, deux tours ou colonnes, linteau et ornements du thème.
          const tower = th.key === 'penitents' || th.key === 'bastion';
          R(c, x - 70, y + 4, 140, 10, pd);
          R(c, x - 60, y - 2, 120, 8, pl);
          for (const s of [-1, 1]) {
            const tx = x + s * 52;
            if (tower) {
              R(c, tx - 20, y - 104, 40, 108, w.face);
              R(c, tx - 20, y - 104, 8, 108, w.light);
              for (let k = 0; k < 3; k++) R(c, tx - 20 + k * 15, y - 114, 10, 10, w.face);
              for (let k = 0; k < 5; k++) R(c, tx - 20, y - 90 + k * 18, 40, 2, w.dark);
              R(c, tx - 4, y - 80, 8, 14, '#ffcf6a');
              canaanLight(tx, y - 72, 90, '#ffcf6a');
            } else {
              R(c, tx - 12, y - 96, 24, 98, pc);
              R(c, tx - 12, y - 96, 6, 98, pl);
              R(c, tx + 6, y - 96, 6, 98, pd);
              R(c, tx - 16, y - 104, 32, 10, pl);
            }
          }
          R(c, x - 40, y - 92, 80, 92, tower ? w.dark : pd);
          membrane(c, x, oy, 30, 44, th.rune);
          if (tower) {
            // Herse à demi levée et bannières.
            c.fillStyle = '#2a2a30';
            for (let k = 0; k < 6; k++) c.fillRect(x - 30 + k * 12, y - 84, 4, 22);
            c.fillRect(x - 32, y - 66, 64, 4);
            for (const s of [-1, 1]) {
              R(c, x + s * 52 - 10, y - 66, 20, 34, th.banner[0]);
              R(c, x + s * 52 - 4, y - 58, 8, 12, th.banner[1]);
            }
            R(c, x - 46, y - 100, 92, 10, w.face);
            if (th.key === 'bastion')
              for (const s of [-1, 1]) {
                R(c, x + s * 86 - 2, y - 60, 4, 66, '#5e4430');
                R(c, x + s * 86 - 8, y - 72, 16, 13, '#d8d0b8');
                R(c, x + s * 86 - 5, y - 67, 3, 3, '#1a1214');
                R(c, x + s * 86 + 2, y - 67, 3, 3, '#1a1214');
              }
          } else {
            c.fillStyle = pl;
            c.beginPath();
            c.moveTo(x - 72, y - 102);
            c.lineTo(x, y - 136);
            c.lineTo(x + 72, y - 102);
            c.fill();
            R(c, x - 72, y - 104, 144, 6, pd);
            if (th.key === 'eclipse') {
              c.fillStyle = '#ffcc55';
              c.beginPath();
              c.arc(x, y - 116, 12, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = '#120a1c';
              c.beginPath();
              c.arc(x + 5, y - 118, 11, 0, Math.PI * 2);
              c.fill();
            } else {
              for (const s of [-1, 1]) {
                R(c, x + s * 30 - 14, y - 128, 28, 8, '#ffffff');
                R(c, x + s * 38 - 10, y - 120, 20, 6, '#ffffff');
              }
              R(c, x - 6, y - 128, 12, 12, '#d4aa3a');
            }
            flame(c, x - 84, y - 8, 1.2, th.flame, 3);
            flame(c, x + 84, y - 8, 1.2, th.flame, 4);
            R(c, x - 92, y - 8, 16, 12, '#4a4a52');
            R(c, x + 76, y - 8, 16, 12, '#4a4a52');
            canaanLight(x - 84, y - 20, 140, th.flame[1]);
            canaanLight(x + 84, y - 20, 140, th.flame[1]);
          }
          break;
        }
        case 'forge': {
          c.fillStyle = w.face;
          c.beginPath();
          c.moveTo(x - 94, y + 12);
          c.lineTo(x - 44, y - 84);
          c.lineTo(x + 40, y - 96);
          c.lineTo(x + 94, y + 12);
          c.fill();
          R(c, x + 24, y - 132, 26, 44, w.dark);
          for (let k = 0; k < 3; k++) {
            c.fillStyle = 'rgba(120,110,110,' + (0.35 - k * 0.1) + ')';
            c.beginPath();
            c.arc(
              x + 37 + Math.sin(time * 0.02 + k) * 6,
              y - 144 - k * 16 - ((time * 0.3) % 16),
              9 + k * 3,
              0,
              Math.PI * 2
            );
            c.fill();
          }
          R(c, x - 40, y - 86, 80, 96, '#140806');
          membrane(c, x, oy, 30, 42, th.hazard.b);
          R(c, x - 44, y - 90, 88, 8, '#4a302a');
          for (const s of [-1, 1]) {
            c.fillStyle = th.hazard.a;
            c.fillRect(x + s * 52 - 6, y - 40, 12, 56);
            c.fillStyle = th.hazard.c;
            c.fillRect(x + s * 52 - 2, y - 40 + ((time * 0.5) % 50), 4, 6);
            canaanLight(x + s * 52, y - 10, 140, th.hazard.b);
          }
          R(c, x + 60, y - 14, 30, 10, '#3a3a40');
          R(c, x + 68, y - 4, 14, 14, '#2a2a2e');
          break;
        }
        case 'fosse': {
          // Puits sombre cerclé de pierre : des chaînes plongent dans une lueur violette.
          c.fillStyle = pd;
          c.beginPath();
          c.ellipse(x, y - 6, 72, 34, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = pc;
          c.beginPath();
          c.ellipse(x, y - 10, 64, 28, 0, 0, Math.PI * 2);
          c.fill();
          membrane(c, x, y - 10, 52, 21, th.rune);
          for (const s of [-1, 1]) {
            R(c, x + s * 66 - 4, y - 92, 8, 90, '#3a3a40');
            R(c, x + s * 66 - 12, y - 96, 24, 6, '#4a4a52');
            for (let k = 0; k < 7; k++) R(c, x + s * 40 + (k % 2), y - 90 + k * 10, 4, 8, '#6a6a72');
          }
          R(c, x - 70, y - 98, 140, 6, '#2a2026');
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            c.fillStyle = '#8a8a94';
            c.beginPath();
            c.moveTo(x + Math.cos(a) * 80 - 5, y - 6 + Math.sin(a) * 38);
            c.lineTo(x + Math.cos(a) * 80, y - 22 + Math.sin(a) * 38);
            c.lineTo(x + Math.cos(a) * 80 + 5, y - 6 + Math.sin(a) * 38);
            c.fill();
          }
          break;
        }
        default: {
          // Anneau flottant (Continuum) ou porte d'étoiles (Célestia).
          const bob = Math.sin(time * 0.04 + i) * 4;
          c.fillStyle = th.floor.b;
          c.beginPath();
          c.ellipse(x, y + 6, 70, 20, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = th.floor.a;
          c.beginPath();
          c.ellipse(x, y + 2, 62, 16, 0, 0, Math.PI * 2);
          c.fill();
          membrane(c, x, oy + bob, 36, 50, th.rune);
          c.strokeStyle = pl;
          c.lineWidth = 9;
          c.beginPath();
          c.ellipse(x, oy + bob, 42, 56, 0, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = pc;
          c.lineWidth = 3;
          c.stroke();
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + time * 0.01;
            R(
              c,
              x + Math.cos(a) * 42 - 4,
              oy + bob + Math.sin(a) * 56 - 4,
              8,
              8,
              th.key === 'celestia' ? '#fff0a8' : '#7de0ff'
            );
          }
          if (th.key === 'celestia') {
            for (const s of [-1, 1]) {
              c.globalAlpha = 0.4;
              R(c, x + s * 74 - 8, y - 120, 16, 124, '#fff0a8');
              c.globalAlpha = 1;
              canaanLight(x + s * 74, y - 50, 150, '#fff0a8');
            }
            R(c, x - 3, oy - 78 + bob, 6, 20, '#d4aa3a');
            R(c, x - 26, oy - 78 + bob, 52, 4, '#ffe680');
          } else
            for (const s of [-1, 1]) {
              const gx = x + s * 70,
                gy = y - 70;
              c.save();
              c.translate(gx, gy);
              c.rotate(time * 0.02 * s);
              c.fillStyle = pc;
              for (let k = 0; k < 8; k++) {
                c.rotate(Math.PI / 4);
                c.fillRect(-3, -20, 6, 8);
              }
              c.beginPath();
              c.arc(0, 0, 14, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = pd;
              c.beginPath();
              c.arc(0, 0, 6, 0, Math.PI * 2);
              c.fill();
              c.restore();
            }
        }
      }
      c.font = 'bold 12px system-ui';
      c.textAlign = 'center';
      c.lineWidth = 3;
      c.strokeStyle = '#101522';
      const label = i === 'arena' ? '✦ ARÈNE ✦' : d.raid ? '✦ RAID ✦' : '✦ DONJON ✦';
      c.strokeText(label, x, y - 146);
      c.fillStyle = th.rune;
      c.fillText(label, x, y - 146);
      c.restore();
    }
    // Ambiance de l'instance pour l'éclairage commun (canaan-sprite-kit).
    function dungeonAmbience() {
      const th = THEMES[game.world.instance.index],
        col = {
          dust: '#d8c8a8',
          embers: '#ffb14a',
          motes: th.rune,
          sparks: th.hazard.c,
          feathers: '#ffffff'
        }[th.particles];
      // Pénombre adoucie : on voit le pixel art des salles, les torches gardent leur halo.
      const arena = game.world.instance.arena;
      return {
        dark: arena ? th.light.dark : Math.min(0.92, th.light.dark * 0.62 * (th.dark || 1)),
        tint: th.light.tint,
        particles: th.particles,
        color: col
      };
    }
    function dungeonMinimapColor(t) {
      if (!game.world.instance) return BIOME_COLORS[t];
      const th = THEMES[game.world.instance.index];
      if (t === FLOOR) return th.floor.c;
      if (t === ACCENT) return th.accent.c;
      if (t === HAZARD) return th.shape === 'void' ? '#0c0c1c' : th.hazard.b;
      if (t === GATE) return th.rune;
      return '#08080e';
    }
    return Object.freeze({
      THEMES,
      drawDungeonTile,
      drawDungeonDecor,
      dungeonAmbience,
      drawDungeonEntrance,
      dungeonMinimapColor,
      canvas,
      rect,
      specks,
      paintFloor,
      paintFace,
      paintHazard,
      flame,
      shadowTile,
      drawFloorProp,
      drawWallProp
    });
  }
  window.CANAAN_DUNGEON_RENDER = Object.freeze({ create });
})();
