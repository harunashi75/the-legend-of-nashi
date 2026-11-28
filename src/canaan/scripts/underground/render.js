// Dessin des Tréfonds de Canaan : nains (sprites, bulles), bâtiments des quatre biomes et de la forteresse, décor,
// sols et liquides, entrées (sur l'île et dans les Tréfonds), repaires des boss. Aucune règle ici : les données sont
// dans shared/data/underground.js, la génération, les nains et les règles dans scripts/underground/underground.js.
// underground.js appelle CANAAN_UNDER_RENDER.create(scène) une fois : la scène lui donne la carte, les bâtiments, les
// entrées, les nains et les repaires (lus à chaque image, jamais modifiés ici).
(() => {
  'use strict';
  function create(scene) {
    const {
      OPEN,
      WET,
      themeOf,
      ENTRANCES,
      bridges,
      structures,
      deco,
      at,
      biomeAt,
      stepDwarves,
      dwarves,
      lairs
    } = scene;
    const { T, BIOMES, STRUCT } = UNDER_DATA;
    const K = () => CANAAN_TILE_KIT;
    const R = (c, x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const DWARF_SPRITES = new Map();
    function dwarfSprite(v, frame) {
      const key = v.name + frame;
      if (DWARF_SPRITES.has(key)) return DWARF_SPRITES.get(key);
      const cv = K().canvas(16 * 3 + 6, 19 * 3 + 6),
        g = cv.getContext('2d'),
        r = (x, y, w, h, col) => {
          g.fillStyle = col;
          g.fillRect(3 + x * 3, 3 + y * 3, w * 3, h * 3);
        },
        skin = v.skin,
        beard = v.beard,
        boot = '#3a2a1e',
        pants = '#4a3a2e',
        metal = '#b8c0c8',
        wood = '#7a5232';
      // Jambes (pas alternés), bottes ; les naines portent une jupe longue bordée d'or.
      if (v.fem) {
        r(frame ? 4 : 5, 17, 3, 2, boot);
        r(frame ? 10 : 9, 17, 3, 2, boot);
        r(3, 13, 10, 4, v.tunic);
        r(2, 15, 12, 2, v.tunic);
        r(2, 16, 12, 1, '#e0b040');
      } else {
        r(4, 14, 3, 3, pants);
        r(9, 14, 3, 3, pants);
        r(frame ? 3 : 4, 17, 4, 2, boot);
        r(frame ? 10 : 9, 17, 4, 2, boot);
      }
      // Tunique trapue, ceinture et boucle.
      r(3, 8, 10, 7, v.tunic);
      r(2, 9, 12, 5, v.tunic);
      r(3, 12, 10, 1, '#2a1e14');
      r(7, 12, 2, 1, '#e0b040');
      // Bras et mains.
      r(0, 9, 2, 4, v.tunic);
      r(14, 9, 2, 4, v.tunic);
      r(0, 13, 2, 1, skin);
      r(14, 13, 2, 1, skin);
      // Tête, yeux, nez.
      r(4, 3, 8, 5, skin);
      r(5, 5, 2, 1, '#1a1418');
      r(9, 5, 2, 1, '#1a1418');
      r(7, 6, 2, 1, '#c98e62');
      // Naines : pas de barbe, mais de longues tresses (couleur de cheveux : beard) à anneaux d'or, cils, joues et lèvres.
      if (v.fem) {
        const hair = beard || '#8a5a2a';
        r(3, 3, 1, 4, hair);
        r(12, 3, 1, 4, hair);
        r(4, 3, 8, 1, hair);
        r(2, 5, 2, 9, hair);
        r(12, 5, 2, 9, hair);
        r(2, 8, 2, 1, '#e0b040');
        r(12, 8, 2, 1, '#e0b040');
        r(2, 12, 2, 1, '#e0b040');
        r(12, 12, 2, 1, '#e0b040');
        r(5, 4, 2, 1, '#1a1418');
        r(9, 4, 2, 1, '#1a1418');
        r(4, 6, 1, 1, '#f0a0a0');
        r(11, 6, 1, 1, '#f0a0a0');
        r(7, 7, 2, 1, '#c8505a');
        r(6, 8, 4, 1, '#e0b040');
      }
      // Barbe des nains (sauf les enfants) : longue, tressée, avec moustache.
      else if (beard) {
        r(4, 6, 8, 2, beard);
        r(3, 7, 10, 3, beard);
        r(4, 10, 8, 2, beard);
        r(6, 12, 4, 2, beard);
        r(5, 6, 6, 1, beard);
        r(7, 14, 2, 1, beard);
        r(6, 13, 1, 1, '#e0b040');
        r(9, 13, 1, 1, '#e0b040');
      }
      // Casque (ou couronne).
      r(3, 1, 10, 3, v.helm);
      r(2, 3, 12, 1, '#2a2420');
      r(7, 0, 2, 1, v.helm);
      if (v.crown) {
        r(3, 0, 1, 1, '#ffe080');
        r(6, 0, 1, 1, '#ffe080');
        r(9, 0, 1, 1, '#ffe080');
        r(12, 0, 1, 1, '#ffe080');
        r(7, 2, 2, 1, '#e04040');
      } else if (v.role === 'garde') {
        r(1, 1, 2, 2, '#e8dcc0');
        r(13, 1, 2, 2, '#e8dcc0');
      }
      // Outil.
      if (v.tool === 'pick') {
        r(14, 4, 1, 10, wood);
        r(11, 3, 6, 1, metal);
        r(11, 4, 1, 1, metal);
      } else if (v.tool === 'axe') {
        r(14, 3, 1, 11, wood);
        r(15, 3, 1, 4, metal);
        r(12, 3, 2, 3, metal);
      } else if (v.tool === 'hammer') {
        r(14, 6, 1, 8, wood);
        r(13, 4, 3, 2, '#5a5e66');
      } else if (v.tool === 'staff') {
        r(15, 1, 1, 15, wood);
        r(14, 0, 3, 2, '#9ad8ff');
      } else if (v.tool === 'lantern') {
        r(0, 13, 2, 1, '#2a2420');
        r(-0.3, 14, 2.6, 3, '#ffd36d');
      } else if (v.tool === 'mug') {
        r(14, 11, 2, 3, '#c8a060');
        r(14, 11, 2, 1, '#fff6d8');
      }
      const out = canaanOutline(cv, 2);
      DWARF_SPRITES.set(key, out);
      return out;
    }
    // Un nain isolé (prisonnier, escorte, personnage de quête), pieds à (x, y + 18).
    function dwarfArt(c, v, x, y, face = 1) {
      const spr = dwarfSprite({ skin: '#e8b48a', ...v }, 0),
        s = (v.scale || 1) * 0.9;
      const a = c.globalAlpha;
      c.globalAlpha = 0.32 * a;
      c.fillStyle = '#0a0806';
      c.beginPath();
      c.ellipse(x, y + 16, 16 * s, 5 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = a;
      c.save();
      c.translate(Math.round(x), Math.round(y + 18));
      if (face < 0 || face === 3) c.scale(-1, 1);
      c.drawImage(
        spr,
        Math.round((-spr.width * s) / 2),
        Math.round(-spr.height * s),
        Math.round(spr.width * s),
        Math.round(spr.height * s)
      );
      c.restore();
      if (v.tool === 'lantern') canaanLight(x - 18, y - 4, 120, '#ffd36d');
    }
    function drawDwarves(c) {
      c.save();
      c.imageSmoothingEnabled = false;
      for (const v of dwarves()) {
        if (Math.abs(v.x - P.x) > W || Math.abs(v.y - P.y) > H) continue;
        const moving = v.wait <= 0 && Math.hypot(v.tx - v.x, v.ty - v.y) > 2,
          spr = dwarfSprite(v, moving ? Math.floor(v.step / 8) % 2 : 0),
          s = (v.scale || 1) * 0.9;
        c.globalAlpha = 0.32;
        c.fillStyle = '#0a0806';
        c.beginPath();
        c.ellipse(v.x, v.y + 16, 16 * s, 5 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
        c.save();
        c.translate(Math.round(v.x), Math.round(v.y + 18));
        if (v.face < 0) c.scale(-1, 1);
        c.drawImage(
          spr,
          Math.round((-spr.width * s) / 2),
          Math.round(-spr.height * s),
          Math.round(spr.width * s),
          Math.round(spr.height * s)
        );
        c.restore();
        if (v.tool === 'lantern') canaanLight(v.x - 18, v.y - 4, 120, '#ffd36d');
        const near = Math.hypot(P.x - v.x, P.y - v.y);
        if (near < 190) {
          drawCanaanName(c, v.name, v.x, v.y - 48 * s, v.type ? '#ffe08a' : '#f6e2b1');
          if (near < 95)
            drawCanaanPrompt(
              c,
              v.type === 'shop' ? '[E] Commercer' : v.type === 'bank' ? '[E] Banque' : '[E] Parler',
              v.x,
              v.y - 62 * s
            );
        }
        if (v.bubble) bubble(c, v.x, v.y - 70 * s, v.bubble.text);
      }
      c.restore();
    }
    function bubble(c, x, y, text) {
      c.save();
      c.font = canaanFont(12, '');
      // Traduite entière avant d'être coupée en lignes (une ligne seule ne serait pas reconnue).
      const words = translateText(text).split(' '),
        lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (c.measureText(t).width > 230 && cur) {
          lines.push(cur);
          cur = w;
        } else cur = t;
      }
      if (cur) lines.push(cur);
      const w = Math.max(...lines.map(l => c.measureText(l).width)) + 18,
        h = lines.length * 15 + 12;
      c.fillStyle = 'rgba(28,20,12,.92)';
      c.strokeStyle = '#e8c878';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect?.(x - w / 2, y - h, w, h, 6);
      if (!c.roundRect) c.rect(x - w / 2, y - h, w, h);
      c.fill();
      c.stroke();
      c.fillStyle = '#fff4d8';
      c.textAlign = 'center';
      lines.forEach((l, k) => c.fillText(l, x, y - h + 18 + k * 15));
      c.restore();
    }

    // ---------------------------------------------------------------- Bâtiments (dessin et emprise)
    // Une façade de pierre : murs, pierres claires et sombres, joints.
    function stoneWall(c, x, y, w, h, wall, seed) {
      R(c, x, y, w, h, wall.face);
      for (let row = 0; row * 10 < h; row++)
        for (let k = (row % 2) * -9; k < w; k += 18) {
          R(c, x + k, y + row * 10, 1.5, 10, wall.dark);
          if (hash(k, row, seed) > 0.6) R(c, x + k + 3, y + row * 10 + 2, 12, 2, wall.light);
        }
      for (let row = 1; row * 10 < h; row++) R(c, x, y + row * 10, w, 1.5, wall.dark);
    }
    function door(c, x, y, w, h, col = '#120c08') {
      R(c, x - 3, y - 3, w + 6, h + 3, '#2a2420');
      R(c, x, y, w, h, col);
      R(c, x, y, w, 4, 'rgba(0,0,0,.4)');
    }
    // Bâtiments de la forteresse peints par dwarf-art.js (pixels de 2), avec leurs feux, fumées et lueurs animés.
    function drawFortArt(c, s, cx, by, flameCols) {
      const img = CANAAN_DWARF_ART.art(s.kind);
      if (!img) return false;
      const u = CANAAN_DWARF_ART.U,
        x0 = Math.round(cx - (img.width * u) / 2),
        y0 = Math.round(by + 4 - img.height * u),
        at = (ax, ay) => [x0 + ax * u, y0 + ay * u],
        smokeAt = (ax, ay) => {
          const [sx, sy] = at(ax, ay);
          for (let k = 0; k < 3; k++) {
            c.globalAlpha = 0.25 - k * 0.07;
            c.fillStyle = '#c8c0b0';
            c.beginPath();
            c.arc(
              sx + Math.sin(time * 0.02 + k) * 4,
              sy - 10 - k * 14 - ((time * 0.3) % 14),
              6 + k * 2,
              0,
              Math.PI * 2
            );
            c.fill();
          }
          c.globalAlpha = 1;
        };
      c.imageSmoothingEnabled = false;
      c.drawImage(img, x0, y0, img.width * u, img.height * u);
      const W = img.width;
      if (s.kind === 'dwarfhall')
        for (const ax of [22, W - 22]) {
          const [fx, fy] = at(ax, 64);
          K().flame(c, fx, fy, 1, flameCols, ax < W / 2 ? -1 : 1);
          canaanLight(fx, fy - 8, 200, flameCols[1]);
        }
      else if (s.kind === 'forge') {
        const [hx, hy] = at(18, 78),
          [ax, ay] = at(36, 76),
          glow = 0.7 + Math.sin(time * 0.15) * 0.3;
        // Feu du foyer, découpé à la forme de l'arc.
        c.save();
        c.beginPath();
        c.rect(hx, ay, 72, 64);
        c.arc(ax, ay, 36, Math.PI, 0);
        c.clip();
        c.globalAlpha = glow;
        c.fillStyle = '#ff6a1f';
        c.fillRect(hx, hy + 16, 72, 48);
        c.fillStyle = '#ffd36b';
        c.fillRect(hx + 14, hy + 30, 44, 34);
        c.restore();
        canaanLight(hx + 36, hy + 30, 240, '#ff8a3c');
        if (hash(Math.floor(time / 12), 1, 2) > 0.7)
          for (let k = 0; k < 4; k++)
            R(c, hx + 10 + Math.random() * 50, hy - Math.random() * 30, 2, 2, '#ffd36b');
        smokeAt(W - 20, 2);
      } else if (s.kind === 'tavern') {
        for (const [ax, ay] of [
          [29, 56],
          [W - 29, 56],
          [27, 88],
          [W - 27, 88]
        ]) {
          const [lx, ly] = at(ax, ay);
          canaanLight(lx, ly, 100, '#ffb84a');
        }
      } else if (s.kind === 'dwarfhouse') {
        const [wx, wy] = at(20, 64),
          [lx, ly] = at(W - 23, 67);
        canaanLight(wx, wy, 90, '#ffb84a');
        canaanLight(lx, ly, 70, '#ffd36d');
        smokeAt(W - 22, 2);
      } else if (s.kind === 'kingstatue') canaanLight(cx, by - 40, 60, '#ffd36d');
      // Bâtiments des biomes : lueurs des fenêtres, lanternes, appliques, bougies et champignons.
      else if (s.kind === 'shack') {
        const [lx, ly] = at(59, 60);
        canaanLight(lx, ly, 90, '#ffb84a');
      } else if (s.kind === 'minehead') {
        const [lx, ly] = at(22, 66);
        canaanLight(lx, ly, 110, '#ffc860');
      } else if (s.kind === 'ruintower') {
        const [fx, fy] = at(24, 92);
        K().flame(c, fx, fy, 0.8, flameCols, s.tx);
        canaanLight(fx, fy - 6, 130, flameCols[1]);
      } else if (s.kind === 'mausoleum') {
        for (const ax of [14, W - 14]) {
          const [fx, fy] = at(ax, 98);
          K().flame(c, fx, fy, 0.5, flameCols, ax + s.ty);
          canaanLight(fx, fy - 4, 90, flameCols[1]);
        }
      } else if (s.kind === 'crypt') {
        const [lx, ly] = at(44, 70);
        canaanLight(lx, ly, 70, flameCols[1]);
      } else if (s.kind === 'mycohut') {
        const [hx, hy] = at(58, 66),
          [gx, gy] = at(44, 30);
        canaanLight(hx, hy, 90, '#ffb0e8');
        canaanLight(gx, gy, 150, '#ff8ae8');
      }
      return true;
    }
    function drawStructure(c, s) {
      const cx = (s.tx + 0.5) * TS,
        by = (s.ty + 1) * TS - 4,
        th = themeOf(s.biome),
        wall = th.wall,
        S = STRUCT[s.kind],
        w = S.w * TS,
        left = cx - w / 2,
        flameCols = th.th.flame;
      c.save();
      c.fillStyle = 'rgba(0,0,0,.32)';
      c.beginPath();
      c.ellipse(cx, by, w * 0.55, 14, 0, 0, Math.PI * 2);
      c.fill();
      if (window.CANAAN_DWARF_ART && CANAAN_DWARF_ART.has(s.kind) && drawFortArt(c, s, cx, by, flameCols)) {
        c.restore();
        return;
      }
      switch (s.kind) {
        case 'shack': {
          // Cabane de mineur effondrée : planches, toit crevé, poutre tombée.
          R(c, left + 6, by - 92, w - 12, 92, '#5a3e26');
          for (let k = 0; k < w - 12; k += 12) R(c, left + 6 + k, by - 92, 2, 92, '#3a2816');
          door(c, cx - 14, by - 46, 28, 46, '#0e0a06');
          c.fillStyle = '#3a2816';
          c.beginPath();
          c.moveTo(left - 4, by - 88);
          c.lineTo(cx + 8, by - 128);
          c.lineTo(left + w + 4, by - 96);
          c.lineTo(left + w - 20, by - 82);
          c.fill();
          R(c, cx + 10, by - 124, 22, 30, '#14100a');
          R(c, left + 10, by - 60, 16, 12, '#ffd36d33');
          R(c, cx + 30, by - 30, 50, 8, '#6a4a2c');
          break;
        }
        case 'minehead': {
          // Puits de mine abandonné : chevalement de bois, roue, rails qui plongent.
          R(c, cx - 40, by - 30, 80, 30, '#2a1e14');
          R(c, cx - 30, by - 24, 60, 22, '#060404');
          for (const sx of [-34, 30]) R(c, cx + sx, by - 170, 6, 145, '#6a4a2c');
          R(c, cx - 40, by - 170, 82, 8, '#5a3e26');
          c.strokeStyle = '#3a2816';
          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(cx - 34, by - 30);
          c.lineTo(cx + 30, by - 160);
          c.moveTo(cx + 34, by - 30);
          c.lineTo(cx - 30, by - 160);
          c.stroke();
          c.beginPath();
          c.arc(cx, by - 182, 18, 0, Math.PI * 2);
          c.strokeStyle = '#8a8e96';
          c.lineWidth = 4;
          c.stroke();
          R(c, cx - 1, by - 182, 2, 160, '#2a2420');
          R(c, cx - 26, by - 6, 52, 3, '#a8a2a0');
          break;
        }
        case 'ruinhouse': {
          // Maison naine abandonnée : murs de pierre écroulés d'un côté, porte noire, fenêtre, poutres.
          const hgt = 104,
            cut = 20 + hash(s.tx, s.ty, 3) * 30;
          // Mur écroulé en biseau d'un côté : la façade est découpée avant d'être peinte.
          c.save();
          c.beginPath();
          c.moveTo(left + 6, by);
          c.lineTo(left + 6, by - hgt);
          c.lineTo(left + w - 6 - cut * 2, by - hgt);
          c.lineTo(left + w - 6, by - hgt + cut * 1.6);
          c.lineTo(left + w - 6, by);
          c.clip();
          stoneWall(c, left + 6, by - hgt, w - 12, hgt, wall, s.seed);
          c.restore();
          R(c, left + 2, by - hgt - 8, w - cut * 2 - 6, 10, wall.light);
          door(c, cx - 16, by - 58, 32, 58);
          R(c, cx - 16, by - 64, 32, 6, th.th.pillar[2]);
          R(c, left + 18, by - 80, 16, 16, '#0a0c10');
          R(c, left + 18, by - 73, 16, 2, wall.dark);
          R(c, left + w - 30, by - 84, 10, 40, '#4a3a2a');
          for (let k = 0; k < 6; k++)
            R(c, left + hash(k, s.tx, 5) * w, by - 10 + hash(s.ty, k, 6) * 10, 10, 6, wall.light);
          break;
        }
        case 'ruintower': {
          // Tour effondrée : fût de pierre brisé en biseau, meurtrières, éboulis au pied.
          const hgt = 200;
          // Fût brisé en biseau : la tour est découpée avant d'être peinte.
          c.save();
          c.beginPath();
          c.moveTo(cx - 50, by);
          c.lineTo(cx - 50, by - hgt + 40);
          c.lineTo(cx - 10, by - hgt + 60);
          c.lineTo(cx + 50, by - hgt + 100);
          c.lineTo(cx + 50, by);
          c.clip();
          stoneWall(c, cx - 50, by - hgt + 40, 100, hgt - 40, wall, s.seed);
          c.restore();
          R(c, cx - 4, by - 120, 8, 22, '#0a0c10');
          R(c, cx - 30, by - 70, 6, 16, '#0a0c10');
          door(c, cx - 14, by - 52, 28, 52);
          for (let k = 0; k < 8; k++)
            R(c, cx - 60 + hash(k, 1, s.seed) * 120, by - 12 + hash(k, 2, s.seed) * 10, 12, 8, wall.light);
          break;
        }
        case 'mausoleum': {
          // Mausolée : socle, colonnes, fronton, porte de fer, cierges verts.
          R(c, left, by - 18, w, 18, wall.dark);
          R(c, left + 8, by - 110, w - 16, 92, wall.face);
          for (const k of [0, 1, 2, 3]) {
            const px = left + 14 + (k * (w - 40)) / 3;
            R(c, px, by - 110, 12, 92, th.th.pillar[0]);
            R(c, px, by - 110, 3, 92, th.th.pillar[2]);
          }
          c.fillStyle = wall.light;
          c.beginPath();
          c.moveTo(left - 2, by - 108);
          c.lineTo(cx, by - 150);
          c.lineTo(left + w + 2, by - 108);
          c.fill();
          c.fillStyle = wall.dark;
          c.beginPath();
          c.moveTo(left + 14, by - 112);
          c.lineTo(cx, by - 140);
          c.lineTo(left + w - 14, by - 112);
          c.fill();
          door(c, cx - 15, by - 70, 30, 52, '#1a2420');
          for (let k = 0; k < 4; k++) R(c, cx - 12 + k * 7, by - 70, 2, 52, '#4a5a52');
          R(c, cx - 4, by - 132, 8, 14, th.th.rune);
          for (const sx of [-1, 1]) {
            R(c, cx + sx * 34 - 2, by - 30, 4, 12, '#e8e0c8');
            K().flame(c, cx + sx * 34, by - 30, 0.55, flameCols, s.seed + sx);
            canaanLight(cx + sx * 34, by - 36, 110, flameCols[1]);
          }
          break;
        }
        case 'crypt': {
          // Petite crypte : toit à deux pans, croix, escalier qui descend dans le noir.
          R(c, left + 10, by - 70, w - 20, 70, wall.face);
          c.fillStyle = wall.dark;
          c.beginPath();
          c.moveTo(left + 2, by - 66);
          c.lineTo(cx, by - 104);
          c.lineTo(left + w - 2, by - 66);
          c.fill();
          R(c, cx - 3, by - 126, 6, 26, wall.light);
          R(c, cx - 11, by - 118, 22, 5, wall.light);
          door(c, cx - 14, by - 44, 28, 44, '#060807');
          for (let k = 0; k < 3; k++) R(c, cx - 12 + k * 2, by - 14 + k * 4, 24 - k * 4, 3, wall.dark);
          break;
        }
        case 'mycohut': {
          // Hutte envahie par les champignons : murs de terre, chapeaux géants luisants sur le toit.
          R(c, left + 10, by - 70, w - 20, 70, '#4a3e30');
          door(c, cx - 12, by - 42, 24, 42, '#0c0a08');
          for (const [dx, dy, r, col] of [
            [-30, -86, 34, '#c8508a'],
            [28, -96, 26, '#5ac8b8'],
            [0, -112, 22, '#d870d0']
          ]) {
            R(c, cx + dx - 4, by + dy, 8, -dy - 40, '#e8dcc0');
            c.fillStyle = col;
            c.beginPath();
            c.ellipse(cx + dx, by + dy, r, r * 0.5, 0, Math.PI, 0);
            c.fill();
            for (let k = 0; k < 4; k++)
              R(c, cx + dx - r * 0.6 + k * r * 0.35, by + dy - r * 0.3, 4, 4, '#fff0f8');
            canaanLight(cx + dx, by + dy, 90, col);
          }
          break;
        }
        case 'dwarfhall': {
          // Grand hall du roi : façade monumentale, colonnes, grande porte, bannières rouges et or.
          R(c, left - 6, by - 20, w + 12, 20, wall.dark);
          stoneWall(c, left, by - 200, w, 182, wall, s.seed);
          c.fillStyle = wall.light;
          c.beginPath();
          c.moveTo(left - 14, by - 196);
          c.lineTo(cx, by - 250);
          c.lineTo(left + w + 14, by - 196);
          c.fill();
          c.fillStyle = wall.dark;
          c.beginPath();
          c.moveTo(left + 20, by - 200);
          c.lineTo(cx, by - 236);
          c.lineTo(left + w - 20, by - 200);
          c.fill();
          R(c, cx - 14, by - 228, 28, 22, '#e0b040');
          R(c, cx - 8, by - 222, 16, 10, '#7a1a14');
          for (const k of [-3, -2, 2, 3]) {
            const px = cx + k * 46 - 10;
            R(c, px, by - 196, 20, 178, th.th.pillar[0]);
            R(c, px, by - 196, 5, 178, th.th.pillar[2]);
            R(c, px - 4, by - 200, 28, 8, th.th.pillar[2]);
          }
          door(c, cx - 34, by - 110, 68, 92, '#2a1608');
          R(c, cx - 2, by - 110, 4, 92, '#120804');
          R(c, cx - 26, by - 66, 8, 8, '#e0b040');
          R(c, cx + 18, by - 66, 8, 8, '#e0b040');
          for (const sx of [-1, 1]) {
            R(c, cx + sx * 70 - 12, by - 180, 24, 70, th.th.banner[0]);
            R(c, cx + sx * 70 - 12, by - 180, 24, 6, th.th.banner[1]);
            R(c, cx + sx * 70 - 4, by - 160, 8, 20, th.th.banner[1]);
            R(c, cx + sx * 112 - 2, by - 120, 4, 20, '#4a3324');
            K().flame(c, cx + sx * 112, by - 122, 1, flameCols, sx);
            canaanLight(cx + sx * 112, by - 130, 200, flameCols[1]);
          }
          break;
        }
        case 'forge': {
          // Forge naine : grand foyer rougeoyant, cheminée, enclume, soufflet.
          stoneWall(c, left + 4, by - 120, w - 8, 120, wall, s.seed);
          R(c, cx + 30, by - 190, 30, 80, wall.dark);
          R(c, cx + 30, by - 196, 30, 8, wall.light);
          const glow = 0.7 + Math.sin(time * 0.15) * 0.3;
          R(c, cx - 50, by - 80, 70, 56, '#1a0c06');
          c.globalAlpha = glow;
          R(c, cx - 44, by - 62, 58, 38, '#ff6a1f');
          R(c, cx - 36, by - 50, 42, 22, '#ffd36b');
          c.globalAlpha = 1;
          canaanLight(cx - 15, by - 50, 240, '#ff8a3c');
          R(c, cx + 18, by - 34, 34, 12, '#4a4e56');
          R(c, cx + 24, by - 22, 22, 18, '#3a3e46');
          R(c, cx + 14, by - 38, 44, 6, '#6a6e78');
          if (hash(Math.floor(time / 12), 1, 2) > 0.7)
            for (let k = 0; k < 4; k++)
              R(c, cx - 30 + Math.random() * 40, by - 100 - Math.random() * 40, 2, 2, '#ffd36b');
          break;
        }
        case 'tavern': {
          // Taverne de Dorn : murs de pierre, toit de bardeaux, enseigne à la chope, fenêtres chaudes, âtre.
          stoneWall(c, left + 4, by - 110, w - 8, 110, wall, s.seed);
          c.fillStyle = '#5a2e1e';
          c.beginPath();
          c.moveTo(left - 8, by - 106);
          c.lineTo(cx, by - 160);
          c.lineTo(left + w + 8, by - 106);
          c.fill();
          for (let k = 0; k < 4; k++)
            R(c, left + 4 + k * 14, by - 116 - k * 10, w - 8 - k * 28, 3, '#3a1e14');
          door(c, cx - 16, by - 60, 32, 60, '#3a2010');
          for (const sx of [-1, 1]) {
            R(c, cx + sx * 54 - 14, by - 82, 28, 22, '#ffb84a');
            R(c, cx + sx * 54 - 1, by - 82, 2, 22, '#5a3a20');
            canaanLight(cx + sx * 54, by - 70, 120, '#ffb84a');
          }
          R(c, left + w - 30, by - 104, 4, 24, '#4a3324');
          R(c, left + w - 44, by - 82, 32, 22, '#7a5232');
          R(c, left + w - 34, by - 78, 12, 14, '#e0b040');
          break;
        }
        case 'vault': {
          // Coffre-fort de Gimra : pierre sombre, porte ronde de fer à rivets.
          stoneWall(c, left + 4, by - 100, w - 8, 100, wall, s.seed);
          R(c, left, by - 108, w, 10, wall.light);
          c.fillStyle = '#5a5e66';
          c.beginPath();
          c.arc(cx, by - 44, 32, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#8a8e96';
          c.beginPath();
          c.arc(cx, by - 44, 24, 0, Math.PI * 2);
          c.fill();
          for (let k = 0; k < 8; k++)
            R(c, cx + Math.cos(k * 0.785) * 28 - 2, by - 44 + Math.sin(k * 0.785) * 28 - 2, 4, 4, '#3a3e46');
          R(c, cx - 3, by - 60, 6, 32, '#3a3e46');
          R(c, cx - 16, by - 47, 32, 6, '#3a3e46');
          break;
        }
        case 'stall': {
          // Étal du marchand : comptoir, auvent rayé, caisses et lingots.
          R(c, left + 6, by - 40, w - 12, 36, '#6a4a2c');
          R(c, left + 6, by - 44, w - 12, 6, '#8a6a40');
          for (const sx of [left + 8, left + w - 14]) R(c, sx, by - 110, 6, 72, '#4a3324');
          for (let k = 0; k < 6; k++)
            R(c, left + k * (w / 6), by - 118, w / 6, 22, k % 2 ? '#e0b040' : '#2a4a6a');
          R(c, left + 20, by - 56, 18, 10, '#e0b040');
          R(c, left + 44, by - 54, 14, 8, '#b8c0c8');
          R(c, left + w - 44, by - 60, 22, 16, '#7a5232');
          break;
        }
        case 'dwarfhouse': {
          // Maison naine : porte ronde, toit de pierre, cheminée qui fume, lanterne.
          stoneWall(c, left + 6, by - 84, w - 12, 84, wall, s.seed);
          c.fillStyle = wall.dark;
          c.beginPath();
          c.moveTo(left - 4, by - 80);
          c.lineTo(cx, by - 122);
          c.lineTo(left + w + 4, by - 80);
          c.fill();
          R(c, cx + 18, by - 128, 14, 34, wall.dark);
          c.fillStyle = '#3a2010';
          c.beginPath();
          c.arc(cx, by - 30, 16, Math.PI, 0);
          c.fill();
          R(c, cx - 16, by - 30, 32, 30, '#3a2010');
          R(c, cx + 8, by - 18, 4, 4, '#e0b040');
          R(c, left + 14, by - 64, 14, 14, '#ffb84a');
          canaanLight(left + 21, by - 57, 90, '#ffb84a');
          for (let k = 0; k < 3; k++) {
            c.globalAlpha = 0.25 - k * 0.07;
            c.fillStyle = '#c8c0b0';
            c.beginPath();
            c.arc(
              cx + 25 + Math.sin(time * 0.02 + k) * 4,
              by - 140 - k * 14 - ((time * 0.3) % 14),
              6 + k * 2,
              0,
              Math.PI * 2
            );
            c.fill();
          }
          c.globalAlpha = 1;
          break;
        }
        case 'kingstatue': {
          // Statue du premier roi de Durgrim : socle, nain de pierre à la hache, runes dorées.
          R(c, cx - 34, by - 30, 68, 30, wall.dark);
          R(c, cx - 30, by - 34, 60, 6, wall.light);
          R(c, cx - 8, by - 26, 16, 6, '#e0b040');
          const st = '#9a948a',
            sd = '#6a645c';
          R(c, cx - 22, by - 120, 44, 86, st);
          R(c, cx - 26, by - 106, 52, 50, st);
          R(c, cx - 18, by - 150, 36, 32, st);
          R(c, cx - 22, by - 160, 44, 14, sd);
          R(c, cx - 24, by - 128, 48, 40, '#b0aaa0');
          R(c, cx - 16, by - 88, 32, 18, '#b0aaa0');
          R(c, cx + 28, by - 170, 6, 130, sd);
          R(c, cx + 20, by - 172, 24, 18, st);
          R(c, cx - 10, by - 140, 4, 4, '#2a2420');
          R(c, cx + 6, by - 140, 4, 4, '#2a2420');
          break;
        }
      }
      c.restore();
    }

    // ---------------------------------------------------------------- Décor (dessin)
    // Décor en pixel art (under-art.js), aux couleurs du biome.
    function drawDecor(c, d, x, y, b) {
      CANAAN_UNDER_ART.draw(c, d, x, y, b, themeOf(b));
    }

    // ---------------------------------------------------------------- Sols (dessin)
    const ART = new Map();
    const mk = fn =>
      [0, 1, 2, 3].map(v => {
        const cv = K().canvas(48, 48),
          g = cv.getContext('2d');
        fn(g, v);
        return cv;
      });
    function paintMud(g, m, v) {
      K().rect(g, 0, 0, 48, 48, m.a);
      for (let k = 0; k < 6; k++) {
        g.fillStyle = m.b;
        g.beginPath();
        g.ellipse(
          hash(k, v, 31) * 48,
          hash(v, k, 32) * 48,
          6 + hash(k, k, v) * 6,
          3 + hash(v, v, k) * 3,
          0,
          0,
          Math.PI * 2
        );
        g.fill();
      }
      K().specks(g, 12, [m.c], v + 60, 2);
    }
    function paintFlow(g, m, v) {
      K().rect(g, 0, 0, 48, 48, m.a);
      for (let k = 0; k < 8; k++) {
        const x = hash(k, v, 41) * 48,
          y = 3 + k * 6;
        for (const dx of [0, -48]) {
          K().rect(g, x + dx, y, 12, 2, k % 2 ? m.c : m.b);
          K().rect(g, x + dx + 14, y + 1, 5, 1, m.b);
        }
      }
    }
    function artOf(b, t) {
      const key = b + ':' + t;
      if (ART.has(key)) return ART.get(key);
      const th = themeOf(b),
        bio = b === 4 ? BIOMES[0] : BIOMES[b];
      let art;
      if (t === 'face') art = mk((g, v) => K().paintFace(g, th.wall, v));
      else if (t === 'top') {
        const cv = K().canvas(48, 48),
          g = cv.getContext('2d');
        K().rect(g, 0, 0, 48, 48, th.wall.top);
        K().specks(g, 10, [th.wall.dark], 77 + b);
        art = [cv];
      } else if (t === T.MUD) art = mk((g, v) => paintMud(g, bio.mud, v));
      else if (t === T.RIVER) art = mk((g, v) => paintFlow(g, bio.river, v));
      else if (t === T.LAKE) art = mk((g, v) => paintFlow(g, bio.lake, v));
      else if (t === T.CHASM)
        art = mk((g, v) =>
          K().paintHazard(g, { style: 'chasm', a: '#030304', b: '#0c0c10', c: '#22222a' }, v)
        );
      else {
        const p = th.floors[t] || th.floors[bio.floor] || th.floors[T.STONE] || Object.values(th.floors)[0];
        art = mk((g, v) => K().paintFloor(g, p, v, p.style));
      }
      ART.set(key, art);
      return art;
    }
    function scrolled(c, img, x, y, off) {
      off = ((Math.floor(off) % 48) + 48) % 48;
      if (!off) return c.drawImage(img, x, y);
      c.drawImage(img, off, 0, 48 - off, 48, x, y, 48 - off, 48);
      c.drawImage(img, 0, 0, off, 48, x + 48 - off, y, off, 48);
    }
    function drawLiquid(c, t, b, x, y, X, Y, v) {
      const art = artOf(b, t)[v],
        speed = t === T.RIVER ? 0.35 : t === T.LAKE ? 0.08 : 0.02;
      if (t === T.CHASM) c.drawImage(art, X, Y);
      else scrolled(c, art, X, Y, time * speed + y * 9);
      const above = at(x, y - 1);
      if (OPEN(above) && above !== T.MUD) {
        const deep = t === T.CHASM;
        c.fillStyle = deep ? themeOf(b).wall.dark : themeOf(b).wall.face;
        c.fillRect(X, Y, TS, deep ? 14 : 6);
        if (deep) {
          c.globalAlpha = 0.5;
          c.fillStyle = '#000';
          c.fillRect(X, Y + 14, TS, 6);
          c.globalAlpha = 1;
        }
      }
      // Bulles qui crèvent à la surface de la boue, reflets sur les lacs.
      if (t === T.RIVER || t === T.LAKE) {
        const tw = hash(x, y, Math.floor(time / 24));
        if (tw > 0.86) {
          c.fillStyle = BIOMES[b % 4][t === T.RIVER ? 'river' : 'lake'].c;
          c.fillRect(X + tw * 36, Y + ((tw * 977) % 36), 4, 3);
        }
      }
    }
    // Sol peint pixel par pixel comme l'île (under-look.js) ; dans une pièce de la forteresse, ou sans canevas, le
    // dessin case par case ci-dessous.
    let LOOK = null;
    const look = () =>
      LOOK ||
      (LOOK = CANAAN_UNDER_LOOK.create({
        T,
        at,
        biomeAt,
        bridges,
        themeOf,
        BIOMES,
        WET,
        isRoom: (x, y) => at(x, y) < T.FLOOR || at(x, y) > T.CHASM,
        houseTile: (g, x, y) => CANAAN_HOUSE.drawTile(g, x, y, at(x, y))
      }));
    function drawGround(c, x0, x1, y0, y1) {
      if (!canaanInHouse(P.x / TS, P.y / TS) && look().drawGround(c, x0, x1, y0, y1)) return;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          // Pièce d'un bâtiment nain (house.js) : son sol et ses murs ; le reste dans le noir quand on y est.
          if (window.CANAAN_HOUSE && CANAAN_HOUSE.drawTile(c, x, y, at(x, y))) continue;
          const t = at(x, y),
            b = biomeAt(x, y),
            X = x * TS,
            Y = y * TS,
            v = (x * 7 + y * 13) & 3;
          if (t === T.WALL) {
            const th = themeOf(b),
              below = at(x, y + 1);
            if (OPEN(below) || WET.has(below)) {
              c.drawImage(artOf(b, 'face')[v], X, Y);
              continue;
            }
            const open = n => OPEN(n) || WET.has(n),
              near = [
                at(x - 1, y),
                at(x + 1, y),
                at(x, y - 1),
                at(x - 1, y + 1),
                at(x + 1, y + 1),
                at(x, y + 2)
              ];
            if (!near.some(open)) {
              c.drawImage(artOf(b, 'top')[0], X, Y);
              c.globalAlpha = 0.6;
              c.fillStyle = '#000';
              c.fillRect(X, Y, TS, TS);
              c.globalAlpha = 1;
              continue;
            }
            c.fillStyle = th.wall.dark;
            c.fillRect(X, Y, TS, TS);
            c.globalAlpha = 0.5;
            c.drawImage(artOf(b, 'top')[0], X, Y);
            c.globalAlpha = 1;
            c.fillStyle = th.wall.light;
            if (open(near[0])) c.fillRect(X, Y, 4, TS);
            if (open(near[1])) c.fillRect(X + TS - 4, Y, 4, TS);
            if (open(near[2])) c.fillRect(X, Y, TS, 4);
            continue;
          }
          if (WET.has(t)) {
            drawLiquid(c, t, b, x, y, X, Y, v);
            continue;
          }
          const under = bridges.get(y * MAPW + x);
          if (under !== undefined) {
            drawLiquid(c, under, b, x, y, X, Y, v);
            // Pont de planches, dans le sens du passage.
            const across = !OPEN(at(x - 1, y)) || !OPEN(at(x + 1, y)) || WET.has(at(x - 1, y));
            c.fillStyle = '#6a4a2c';
            if (across) for (let k = 2; k < 48; k += 9) c.fillRect(X + k, Y, 7, 48);
            else for (let k = 2; k < 48; k += 9) c.fillRect(X, Y + k, 48, 7);
            c.fillStyle = '#4a3420';
            if (across) {
              c.fillRect(X, Y + 4, 48, 3);
              c.fillRect(X, Y + 41, 48, 3);
            } else {
              c.fillRect(X + 4, Y, 3, 48);
              c.fillRect(X + 41, Y, 3, 48);
            }
            continue;
          }
          c.drawImage(artOf(b, t)[v], X, Y);
          if (t === T.MUD && hash(x, y, Math.floor(time / 30)) > 0.9) {
            c.strokeStyle = BIOMES[b % 4].mud.c;
            c.lineWidth = 2;
            c.beginPath();
            c.arc(
              X + 10 + hash(y, x, 3) * 28,
              Y + 10 + hash(x, y, 4) * 28,
              3 + (time % 30) / 8,
              0,
              Math.PI * 2
            );
            c.stroke();
          }
          if (at(x, y - 1) === T.WALL) c.drawImage(K().shadowTile(), X, Y);
        }
    }

    // ---------------------------------------------------------------- Entrées (dessin, île et Tréfonds)
    // À la surface : gouffre en pixel art (under-art.js), habillé de l'herbe de la région.
    function drawHole(c, e, x, y) {
      CANAAN_UNDER_ART.hole(c, x, y, Math.max(0, ZONES.indexOf(regionAt(e.x, e.y))));
    }
    function drawShaft(c, e, x, y) {
      // Dans les Tréfonds : rai de lumière du jour qui tombe du trou, échelle de corde, éboulis.
      c.save();
      const g = c.createLinearGradient(x, y - 260, x, y + 20);
      g.addColorStop(0, 'rgba(255,248,220,0.55)');
      g.addColorStop(1, 'rgba(255,248,220,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x - 22, y - 260);
      c.lineTo(x + 22, y - 260);
      c.lineTo(x + 46, y + 18);
      c.lineTo(x - 46, y + 18);
      c.fill();
      canaanLight(x, y - 10, 230, '#fff2c8');
      R(c, x - 7, y - 200, 2, 196, '#a89060');
      R(c, x + 5, y - 200, 2, 196, '#a89060');
      for (let k = 0; k < 18; k++) R(c, x - 7, y - 196 + k * 11, 14, 2, '#c8b890');
      for (let k = 0; k < 7; k++)
        R(c, x - 40 + hash(k, e.id, 3) * 80, y + 4 + hash(e.id, k, 4) * 12, 10, 7, '#7a7470');
      c.restore();
    }
    function drawLabel(c, x, y, text, sub) {
      canaanText(c, text, x, y, 13, '#ffe8a8');
      if (sub) drawCanaanPrompt(c, sub, x, y + 17);
    }
    const inView = (x, y, m = 200) => x > camX - m && x < camX + W + m && y > camY - m && y < camY + H + m;
    // Entrées vues de l'île (appelé par la boucle de rendu, à la surface).
    function drawSurface(c) {
      // Les blocs de sol des Tréfonds ne servent plus à la surface : ils sont oubliés (repeints en redescendant).
      LOOK?.release();
      for (const e of ENTRANCES) {
        const x = (e.x + 0.5) * TS,
          y = (e.y + 0.5) * TS;
        if (!inView(x, y)) continue;
        drawHole(c, e, x, y);
        if (Math.hypot(P.x - x, P.y - y) < 170)
          drawLabel(
            c,
            x,
            y - 96,
            '✦ ' + translateText(e.name).toUpperCase() + ' ✦',
            Math.hypot(P.x - x, P.y - y) < 95 ? '[E] Descendre dans les Tréfonds' : null
          );
      }
    }

    // ---------------------------------------------------------------- Rendu des Tréfonds
    function draw(c) {
      const x0 = Math.max(0, Math.floor(camX / TS) - 2),
        x1 = Math.min(MAPW, Math.ceil((camX + W) / TS) + 3),
        y0 = Math.max(0, Math.floor(camY / TS) - 2),
        y1 = Math.min(MAPH, Math.ceil((camY + H) / TS) + 4);
      stepDwarves();
      c.save();
      // Décor, ligne par ligne, puis bâtiments, portails des donjons, entrées, nains et faune.
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const d = deco()[y]?.[x];
          if (d) drawDecor(c, d, x, y, biomeAt(x, y));
        }
      for (const s of structures
        .filter(s => inView((s.tx + 0.5) * TS, s.ty * TS, 320))
        .sort((a, b) => a.ty - b.ty))
        drawStructure(c, s);
      instances.forEach((d, i) => {
        if (!d.under) return;
        const x = d.x * TS,
          y = d.y * TS;
        // Entrée en pixel art habillée du biome souterrain (portal-art.js).
        if (inView(x, y)) CANAAN_PORTAL_ART.draw(c, i, x, y);
      });
      for (const e of ENTRANCES) {
        const x = (e.x + 0.5) * TS,
          y = (e.y + 0.5) * TS;
        if (!inView(x, y, 300)) continue;
        drawShaft(c, e, x, y);
        if (Math.hypot(P.x - x, P.y - y) < 170)
          drawLabel(
            c,
            x,
            y - 70,
            '✦ ' + translateText(e.name).toUpperCase() + ' ✦',
            Math.hypot(P.x - x, P.y - y) < 95 ? '[E] Remonter à la surface' : null
          );
      }
      for (const l of lairs()) {
        const x = l.x * TS,
          y = l.y * TS;
        if (!inView(x, y, 100)) continue;
        // Repaire : cercle de runes au sol, de la couleur du boss.
        c.strokeStyle = l.boss.color;
        c.globalAlpha = 0.35 + Math.sin(time * 0.05) * 0.1;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(x, y, 5 * TS, 2.4 * TS, 0, 0, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
      }
      drawDwarves(c);
      c.restore();
    }

    return Object.freeze({ dwarfArt, drawGround, drawSurface, draw });
  }
  window.CANAAN_UNDER_RENDER = Object.freeze({ create });
})();
