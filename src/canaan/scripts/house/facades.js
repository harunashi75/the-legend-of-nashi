// Façades des bâtiments de l'île en pixel art et leurs architectures (colombages des Plaines, rondins de la Forêt,
// pilotis du marais, terre crue du désert, bâtiments du camp…) : murs, toits, fenêtres animées, cheminées, enseignes,
// effets notés pour être rejoués à chaque image (lueurs, fumée, clapotis). Les abords et la finition restent dans
// scripts/house/render.js, qui appelle CANAAN_HOUSE_FACADES.create(outils) une fois.
(() => {
  'use strict';
  function create(scene) {
    const { R } = scene;
    // État de render.js relu à chaque usage (variables réassignées ou posées plus tard).
    const LIVE = scene.state;

    // ---------------------------------------------------------------- Dessin : façades en pixel art
    // Même facture que l'île, les donjons et les raids : volumes en blocs de pixels, contour sombre, lumière venant du
    // haut à gauche (reflets à gauche, ombres à droite et sous le toit), textures tirées au hasard mais fixes.
    // Chaque style suit son biome : colombages et chaume des Plaines, rondins moussus de la Forêt ancienne, cabane sur
    // pilotis du marais, bardeaux roux de l'automne, terre crue à toit plat du désert, pierre lilas et cristaux de la
    // Forêt enchantée. Les bâtiments du camp ont chacun leur caractère (échoppe, auberge, demeures).
    const OUT = '#22160e';
    const LOOKS = {
      chaume: {
        wall: 'timber',
        face: ['#f2e6ca', '#e2d2b0', '#c9b690'],
        beam: ['#6e4628', '#4a2e1a'],
        roof: 'thatch',
        tones: ['#e6c062', '#d0a64a', '#b28a38', '#86662a'],
        ground: 'plaines',
        chimney: 'stone',
        flowers: '#e05a7a'
      },
      echoppe: {
        wall: 'timber',
        face: ['#f4e4c0', '#e4d0a6', '#c9b48a'],
        beam: ['#5e3c22', '#3c2614'],
        roof: 'tiles',
        tones: ['#de6c4e', '#c2543c', '#9e402e', '#70281e'],
        ground: 'plaines',
        awning: true,
        crates: true
      },
      auberge: {
        wall: 'stone',
        face: ['#cac4b4', '#b0aa9a', '#8e887a'],
        beam: ['#5e3c22', '#3c2614'],
        roof: 'slate',
        tones: ['#7a8aaa', '#627294', '#4c5a7c', '#343e5a'],
        ground: 'plaines',
        chimney: 'brick',
        barrels: true
      },
      demeure: {
        wall: 'timber',
        face: ['#f6ecd8', '#e6dac2', '#cdbea2'],
        beam: ['#7e4c2c', '#56321c'],
        roof: 'tiles',
        tones: ['#cc7a50', '#ae623e', '#8c4c30', '#64341e'],
        ground: 'plaines',
        chimney: 'brick',
        flowers: '#f0c040'
      },
      demeure_bleue: {
        wall: 'timber',
        face: ['#eee8f2', '#ddd5e4', '#c2b8cc'],
        beam: ['#5e4c6c', '#3e3048'],
        roof: 'slate',
        tones: ['#6496bc', '#4e7ea2', '#3c6686', '#2a4a66'],
        ground: 'plaines',
        chimney: 'stone',
        flowers: '#9a7ae0'
      },
      foret: {
        wall: 'logs',
        face: ['#946a42', '#7a5634', '#5c3e24'],
        beam: ['#4e3420', '#33210f'],
        roof: 'shingles',
        tones: ['#806040', '#6a4e32', '#543c26', '#38281a'],
        ground: 'foret',
        chimney: 'stone',
        moss: true,
        wood: true
      },
      marais: {
        wall: 'planks',
        face: ['#7a6446', '#64503a', '#4a3a28'],
        beam: ['#3e2e1e', '#2a1e12'],
        roof: 'reeds',
        tones: ['#b0a262', '#968850', '#7a6e40', '#585030'],
        ground: 'marais',
        stilts: true
      },
      automne: {
        wall: 'timber',
        face: ['#f0dcc0', '#dcc4a4', '#c0a684'],
        beam: ['#6a3e22', '#462614'],
        roof: 'shingles',
        tones: ['#d8803c', '#be662e', '#9e5024', '#723818'],
        ground: 'automne',
        chimney: 'stone',
        leaves: true
      },
      desert: {
        wall: 'adobe',
        face: ['#ecc690', '#d8ae76', '#ba905c'],
        beam: ['#7a4e2c', '#54321a'],
        roof: 'flat',
        tones: ['#f2d6a2', '#dcbc88', '#c2a06c', '#946e44'],
        ground: 'desert',
        awning: 'toile'
      },
      enchantee: {
        wall: 'stone',
        face: ['#bdb4d8', '#a198bc', '#81789c'],
        beam: ['#4a3a6a', '#2e2448'],
        roof: 'shingles',
        tones: ['#8a64c4', '#7250a8', '#5a3e8a', '#3e2a64'],
        ground: 'enchantee',
        chimney: 'stone',
        glow: true
      }
    };
    const visible = (x, y, m) =>
      Math.abs(x - camX - W / 2) < W / 2 + m && Math.abs(y - camY - H / 2) < H / 2 + m;
    // Tirage fixe par position (textures qui ne scintillent pas).
    const rnd = (a, b) => {
      let h = (a * 374761393 + b * 668265263) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const pick = (list, a, b) => list[Math.floor(rnd(a, b) * list.length)];
    function light(x, y, r, col) {
      if (LIVE.FX) LIVE.FX.push([0, x, y, r, col]);
      else canaanLight(x, y, r, col);
    }
    // Fumée : volutes rondes en dégradé qui grossissent, pâlissent et dérivent avec le vent.
    function smoke(c, x, y) {
      if (LIVE.FX) return void LIVE.FX.push([1, x, y]);
      const wind = typeof windAt === 'function' ? windAt(x, y) : 0.5;
      for (let k = 0; k < 7; k++) {
        const s = (time * 0.35 + k * 15) % 105,
          life = s / 105,
          px = x + Math.sin((s + k * 30) * 0.05) * 6 + s * (0.18 + wind * 0.25),
          py = y - s * 0.85,
          r = 5 + life * 14;
        if (!c.createRadialGradient) {
          c.globalAlpha = 0.5 * (1 - life);
          R(c, px - r / 2, py - r / 2, r, r, '#e4e4e4');
          continue;
        }
        const g = c.createRadialGradient(px, py, 0, px, py, r);
        const shade = 225 - Math.round(life * 40);
        g.addColorStop(
          0,
          'rgba(' + shade + ',' + shade + ',' + (shade + 6) + ',' + (0.5 * (1 - life)).toFixed(3) + ')'
        );
        g.addColorStop(1, 'rgba(' + shade + ',' + shade + ',' + (shade + 6) + ',0)');
        c.fillStyle = g;
        c.fillRect(px - r, py - r, r * 2, r * 2);
      }
      c.globalAlpha = 1;
    }
    // Fenêtre vivante : la flamme vacille derrière la vitre (plus fort dans les biomes sombres), et de temps en temps
    // une silhouette passe.
    function windowLife(c, x, y, w, h, seed) {
      const amb = typeof worldAmbience === 'function' ? worldAmbience().dark || 0 : 0,
        flick = 0.5 + 0.3 * Math.sin(time * 0.21 + seed) + 0.2 * Math.sin(time * 0.53 + seed * 2);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (0.1 + amb * 0.35) * flick;
      c.fillStyle = '#ffb040';
      c.fillRect(x, y, w, h);
      c.restore();
      const cycle = (time + seed * 997) % 1100;
      if (cycle < 140) {
        const t = cycle / 140,
          sx = x - 8 + t * (w + 16);
        c.save();
        c.beginPath();
        c.rect(x, y, w, h);
        c.clip();
        c.globalAlpha = 0.55;
        c.fillStyle = '#2a1a10';
        c.fillRect(Math.round(sx - 4), y + h - 12, 8, 12);
        c.fillRect(Math.round(sx - 3), y + h - 18, 6, 6);
        c.restore();
      }
    }
    function flag(c, x, y, col, len) {
      R(c, x - 1, y, 2, 18, '#4a3020');
      for (let k = 0; k < len; k += 2) {
        const wave = Math.round(Math.sin(time * 0.15 - k * 0.5) * 2 * (k / len));
        R(c, x + 1 + k, y + 1 + wave, 2, Math.max(2, 8 - (k * 6) / len), col);
      }
    }
    function laundry(c, x1, x2, y) {
      c.strokeStyle = '#d8d0c0';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x1, y);
      c.quadraticCurveTo((x1 + x2) / 2, y + 6, x2, y);
      c.stroke();
      /** @type {[string, number, number][]} */ ([
        ['#e8e4dc', 12, 14],
        ['#c85a4a', 10, 12],
        ['#5a8ac0', 14, 10],
        ['#f0d070', 8, 12]
      ]).forEach(([col, w, h], k) => {
        const cx = x1 + ((k + 1) * (x2 - x1)) / 5,
          sway = Math.sin(time * 0.08 + k * 1.3) * 2.5;
        c.save();
        c.translate(cx, y + 4);
        c.transform(1, 0, sway * 0.06, 1, 0, 0);
        R(c, -w / 2 - 1, -1, w + 2, h + 2, '#22160e');
        R(c, -w / 2, 0, w, h, col);
        R(c, -w / 2, 0, w, 2, '#ffffff55');
        c.restore();
      });
    }
    function leaves(c, x, y, w, h, cols, seed) {
      for (let k = 0; k < 7; k++) {
        const fall = (time * (0.35 + (k % 3) * 0.1) + k * 37 + seed) % h,
          px = x + ((k * 53 + seed) % w) + Math.sin(time * 0.05 + k * 2) * 10,
          py = y + fall;
        c.globalAlpha = Math.min(1, (h - fall) / 30);
        R(c, px, py, 3, 2, cols[k % cols.length]);
      }
      c.globalAlpha = 1;
    }
    function campfire(c, x, y) {
      const f = Math.sin(time * 0.3) * 2;
      R(c, x - 6, y - 10 + f, 12, 10 - f, '#e5522e');
      R(c, x - 4, y - 14 + f, 8, 10, '#f9a640');
      R(c, x - 2, y - 10, 4, 6, '#fff1b5');
      canaanLight(x, y - 8, 110 + Math.sin(time * 0.4) * 10, '#ffb050');
    }
    function ripple(c, x, y, w) {
      c.globalAlpha = 0.5;
      R(c, x + ((time * 0.3) % w), y, 10, 2, '#cfe8e0');
      c.globalAlpha = 1;
    }
    function spark(c, x, y, col, k) {
      c.globalAlpha = 0.5 + Math.sin(time * 0.08 + k) * 0.4;
      R(c, x, y, 3, 3, col);
      c.globalAlpha = 1;
    }
    // Façade : enduit et colombages, pierres taillées, rondins, planches ou terre crue.
    function drawWall(c, L, X, top, Wd, bot, seed) {
      const [f0, f1, f2] = L.face,
        [b0, b1] = L.beam,
        h = bot - top;
      R(c, X + 2, top - 2, Wd - 4, h + 4, OUT);
      R(c, X + 4, top, Wd - 8, h, f0);
      if (L.wall === 'timber') {
        // Enduit taché, poutres sombres, croix de Saint-André sur les côtés.
        for (let k = 0; k < 18; k++)
          R(c, X + 8 + rnd(seed, k) * (Wd - 20), top + 4 + rnd(k, seed) * (h - 12), 4, 2, f1);
        R(c, X + 4, top, Wd - 8, 5, b0);
        R(c, X + 4, top + 34, Wd - 8, 4, b0);
        R(c, X + 4, top + 34, Wd - 8, 1, f1);
        for (const fx of [4, Wd - 10]) R(c, X + fx, top, 6, h, b0);
        for (const s of [0, 1]) {
          const bx = s ? X + Wd - 26 : X + 10;
          for (let k = 0; k < 8; k++) {
            R(c, bx + k * 2, top + 6 + k * 3.5, 3, 4, b0);
            R(c, bx + 14 - k * 2, top + 6 + k * 3.5, 3, 4, b0);
          }
        }
      } else if (L.wall === 'stone') {
        // Pierres de taille irrégulières, joints sombres, quelques pierres claires.
        for (let row = 0; row * 12 < h; row++) {
          let x = X + 4 - (row % 2) * 10;
          while (x < X + Wd - 4) {
            const w = 14 + Math.floor(rnd(x, row + seed) * 12),
              x0 = Math.max(X + 4, x),
              x1 = Math.min(X + Wd - 4, x + w);
            R(c, x0, top + row * 12, x1 - x0 - 1, 11, pick([f0, f0, f1, f2], x, row * 7 + seed));
            R(c, x0, top + row * 12, x1 - x0 - 1, 1, '#ffffff22');
            x += w;
          }
        }
      } else if (L.wall === 'logs') {
        // Rondins empilés : dessus clair, nœuds, bouts ronds qui dépassent aux angles.
        for (let k = 0; top + k * 10 < bot; k++) {
          const y = top + k * 10;
          R(c, X + 4, y, Wd - 8, 10, k % 2 ? f0 : f1);
          R(c, X + 4, y + 1, Wd - 8, 2, '#b08458');
          R(c, X + 4, y + 9, Wd - 8, 1, b1);
          R(c, X + 14 + rnd(k, seed) * (Wd - 40), y + 4, 4, 3, f2);
          for (const ex of [X - 2, X + Wd - 6]) {
            R(c, ex - 1, y, 10, 10, OUT);
            R(c, ex, y + 1, 8, 8, '#c8a070');
            R(c, ex + 2, y + 3, 4, 4, '#a07a50');
          }
        }
      } else if (L.wall === 'planks') {
        // Planches verticales usées et sombres, traces d'humidité en bas.
        for (let x = X + 4, k = 0; x < X + Wd - 4; x += 12, k++) {
          R(c, x, top, Math.min(11, X + Wd - 4 - x), h, pick([f0, f1, f0], k, seed));
          R(c, x + 11, top, 1, h, b1);
          R(c, x + 2, top + 4 + rnd(k, seed) * 20, 2, 2, b1);
        }
        c.globalAlpha = 0.35;
        R(c, X + 4, bot - 16, Wd - 8, 16, '#3a4a2a');
        c.globalAlpha = 1;
      } else {
        // Terre crue lissée, fissures et coins arrondis.
        for (let k = 0; k < 10; k++) {
          const cx = X + 14 + rnd(k, seed) * (Wd - 30),
            cy = top + 10 + rnd(seed, k) * (h - 20);
          R(c, cx, cy, 6, 1, f2);
          R(c, cx + 5, cy + 1, 1, 4, f2);
        }
        R(c, X + 4, top, Wd - 8, 3, f1);
      }
      // Volume en dégradés : lumière sur la gauche, ombre vers la droite, ombre portée de l'avant-toit en haut et
      // occlusion au pied du mur.
      if (c.createLinearGradient) {
        c.save();
        c.beginPath();
        c.rect(X + 4, top, Wd - 8, h);
        c.clip();
        const side = c.createLinearGradient(X + 4, 0, X + Wd - 4, 0);
        side.addColorStop(0, 'rgba(255,248,226,.22)');
        side.addColorStop(0.35, 'rgba(255,248,226,0)');
        side.addColorStop(0.7, 'rgba(10,8,20,0)');
        side.addColorStop(1, 'rgba(10,8,20,.34)');
        c.fillStyle = side;
        c.fillRect(X + 4, top, Wd - 8, h);
        const eave = c.createLinearGradient(0, top, 0, top + 22);
        eave.addColorStop(0, 'rgba(8,6,14,.5)');
        eave.addColorStop(1, 'rgba(8,6,14,0)');
        c.fillStyle = eave;
        c.fillRect(X + 4, top, Wd - 8, 22);
        const foot = c.createLinearGradient(0, bot - 16, 0, bot);
        foot.addColorStop(0, 'rgba(30,22,10,0)');
        foot.addColorStop(1, 'rgba(30,22,10,.32)');
        c.fillStyle = foot;
        c.fillRect(X + 4, bot - 16, Wd - 8, 16);
        c.restore();
      } else {
        c.globalAlpha = 0.18;
        R(c, X + 4, top, 3, h, '#ffffff');
        c.globalAlpha = 0.28;
        R(c, X + Wd - 14, top, 10, h, '#000000');
        R(c, X + 4, top, Wd - 8, 8, '#000000');
        c.globalAlpha = 1;
      }
    }
    // Halo chaud autour d'une fenêtre ou d'une lanterne, peint dans l'image (en plus de la lumière dynamique).
    function halo(c, x, y, r, col = '255,210,130') {
      if (!c.createRadialGradient) return;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + col + ',.38)');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
      c.restore();
    }
    // Soubassement de pierres (ou pilotis du marais).
    function drawBase(c, L, X, Wd, bot, seed) {
      if (L.stilts) return;
      const stones =
        L.ground === 'desert'
          ? ['#b89a70', '#a2865e', '#c8aa80']
          : L.ground === 'enchantee'
            ? ['#8a84a4', '#746e90', '#9e98b8']
            : ['#8e8a84', '#76726c', '#a4a09a'];
      R(c, X + 2, bot - 10, Wd - 4, 12, OUT);
      for (let x = X + 4; x < X + Wd - 4;) {
        const w = 12 + Math.floor(rnd(x, seed) * 10),
          x1 = Math.min(X + Wd - 4, x + w);
        R(c, x, bot - 9, x1 - x - 1, 9, pick(stones, x, seed + 3));
        R(c, x, bot - 9, x1 - x - 1, 2, '#ffffff33');
        x += w;
      }
    }
    function drawStilts(c, L, X, Wd, bot, lift, mid) {
      for (const px of [X + 6, X + Wd / 3, X + (Wd * 2) / 3 - 6, X + Wd - 14]) {
        R(c, px - 1, bot - 2, 10, lift + 4, OUT);
        R(c, px, bot - 2, 8, lift + 2, L.beam[0]);
        R(c, px, bot - 2, 2, lift + 2, '#7a6446');
      }
      R(c, X - 2, bot - 4, Wd + 4, 8, OUT);
      R(c, X, bot - 3, Wd, 6, L.face[1]);
      for (let x = X; x < X + Wd; x += 14) R(c, x, bot - 3, 1, 6, L.beam[1]);
      // Échelle jusqu'au ponton.
      R(c, mid - 15, bot, 30, lift + 2, OUT);
      for (let k = 0; k < 3; k++) R(c, mid - 13, bot + 2 + k * 5, 26, 3, L.face[0]);
      // Eau qui clapote au pied des pilotis.
      c.globalAlpha = 0.5;
      R(c, X - 6, bot + lift - 2, Wd + 12, 4, '#4a7a6a');
      c.globalAlpha = 1;
      if (LIVE.FX) LIVE.FX.push([2, X, bot + lift - 2, Wd]);
      else ripple(c, X, bot + lift - 2, Wd);
    }
    // Toit à quatre pans en escalier de pixels : pan avant texturé, croupes plus sombres sur les côtés, faîtage.
    function drawRoof(c, L, X, Wd, top, eave, seed) {
      const T = L.tones,
        rx = X - 12,
        rw = Wd + 24,
        H = eave - top,
        ridge = top + Math.round(H * 0.28),
        STEP = 6;
      if (L.roof === 'flat') return drawFlatRoof(c, L, X, Wd, top, eave, seed);
      const rows = [];
      for (let y = top; y < eave; y += STEP) {
        const t = (y - top) / H,
          inset = Math.round(((1 - t) * 34) / 2) * 2;
        rows.push({
          y,
          x0: rx + inset,
          x1: rx + rw - inset,
          hip: Math.round(inset * 0.6 + 6),
          back: y < ridge
        });
      }
      for (const r of rows) R(c, r.x0 - 2, r.y - 2, r.x1 - r.x0 + 4, STEP + 4, OUT);
      rows.forEach((r, i) => {
        const w = r.x1 - r.x0;
        if (r.back) {
          R(c, r.x0, r.y, w, STEP, T[0]);
          R(c, r.x0, r.y + STEP - 1, w, 1, T[1]);
        } else {
          R(c, r.x0, r.y, w, STEP, T[1]);
          // Texture du pan avant.
          if (L.roof === 'thatch' || L.roof === 'reeds') {
            for (let x = r.x0 + (i % 2) * 2; x < r.x1 - 1; x += 4)
              R(c, x, r.y + (rnd(x, i) < 0.5 ? 1 : 0), 1, STEP - 1, rnd(i, x) < 0.5 ? T[2] : T[0]);
          } else {
            const tile = L.roof === 'tiles' ? 12 : L.roof === 'slate' ? 10 : 9;
            for (let x = r.x0 + (i % 2 ? tile / 2 : 0); x < r.x1; x += tile) {
              R(c, Math.max(r.x0, x), r.y, 1, STEP, T[2]);
              if (rnd(x, i + seed) < 0.22)
                R(
                  c,
                  Math.max(r.x0, x + 1),
                  r.y,
                  Math.min(tile - 1, r.x1 - x - 1),
                  STEP - 1,
                  rnd(i, x) < 0.5 ? T[0] : T[2]
                );
            }
            R(c, r.x0, r.y + STEP - 1, w, 1, T[2]);
            if (L.roof === 'tiles') R(c, r.x0, r.y, w, 1, T[0]);
          }
          // Croupes : les côtés du toit, à l'ombre à droite.
          R(c, r.x0, r.y, r.hip, STEP, T[2]);
          R(c, r.x1 - r.hip, r.y, r.hip, STEP, T[3]);
          R(c, r.x0 + r.hip, r.y, 1, STEP, T[3]);
          R(c, r.x1 - r.hip - 1, r.y, 1, STEP, T[3]);
        }
      });
      // Faîtage.
      const rr = rows.find(r => !r.back) || rows[0];
      R(c, rr.x0 + rr.hip - 2, ridge - 3, rr.x1 - rr.x0 - rr.hip * 2 + 4, 5, T[3]);
      R(c, rr.x0 + rr.hip - 2, ridge - 3, rr.x1 - rr.x0 - rr.hip * 2 + 4, 1, T[0]);
      // Avant-toit et frange (chaume, roseaux).
      R(c, rx, eave - 3, rw, 3, T[3]);
      if (L.roof === 'thatch' || L.roof === 'reeds')
        for (let x = rx; x < rx + rw; x += 4)
          R(c, x, eave - 2, 3, 3 + Math.floor(rnd(x, seed) * (L.roof === 'reeds' ? 7 : 4)), T[2]);
      // Mousse, feuilles mortes ou éclats de magie sur le toit.
      if (L.moss || L.leaves || L.glow)
        for (let k = 0; k < 14; k++) {
          const r = rows[Math.floor(rnd(k, seed) * rows.length)],
            x = r.x0 + 6 + rnd(seed, k) * (r.x1 - r.x0 - 16);
          if (L.moss) {
            R(c, x, r.y + 1, 8, 4, '#4e7434');
            R(c, x + 2, r.y, 4, 2, '#6e9a48');
          } else if (L.leaves) R(c, x, r.y + 2, 3, 3, pick(['#e8a040', '#c84a2a', '#f0c040'], k, seed));
          else if (LIVE.FX)
            LIVE.FX.push([3, x, r.y + 2, pick(['#9af0ff', '#ff9af0', '#ffffff'], k, seed), k]);
          else spark(c, x, r.y + 2, pick(['#9af0ff', '#ff9af0', '#ffffff'], k, seed), k);
        }
    }
    // Toit plat du désert : terrasse bordée d'un parapet (tapis et jarres), tour carrée coiffée d'un dôme blanchi,
    // poutres (vigas) qui dépassent sous le parapet.
    function drawFlatRoof(c, L, X, Wd, top, eave, seed) {
      const T = L.tones,
        [f0, f1, f2] = L.face,
        y0 = top + 34;
      // Terrasse.
      R(c, X - 2, y0 - 2, Wd + 4, eave - y0 + 4, OUT);
      R(c, X, y0, Wd, eave - y0, T[1]);
      R(c, X, y0, Wd, 2, T[0]);
      R(c, X + 7, y0 + 7, Wd - 14, eave - y0 - 16, T[2]);
      R(c, X + 7, y0 + 7, Wd - 14, 2, T[3]);
      for (let k = 0; k < 5; k++)
        R(c, X + 76 + rnd(k, seed) * (Wd - 100), y0 + 12 + rnd(seed, k) * 12, 6, 1, T[3]);
      // Tapis étendu et jarres.
      const tx = X + Wd - 96;
      R(c, tx - 1, y0 + 11, 46, 18, OUT);
      R(c, tx, y0 + 12, 44, 16, '#a8343a');
      R(c, tx + 3, y0 + 15, 38, 10, '#c8584a');
      R(c, tx + 3, y0 + 15, 38, 1, '#e0c060');
      R(c, tx + 3, y0 + 24, 38, 1, '#e0c060');
      for (let k = 0; k < 4; k++) R(c, tx + 8 + k * 9, y0 + 18, 4, 4, '#3a4a8a');
      for (const [jx, jh] of [
        [X + Wd - 40, 16],
        [X + Wd - 24, 12]
      ]) {
        R(c, jx - 1, eave - 10 - jh, 12, jh + 2, OUT);
        R(c, jx, eave - 9 - jh, 10, jh, '#c8783a');
        R(c, jx + 2, eave - 12 - jh, 6, 4, '#a8602c');
        R(c, jx + 2, eave - 7 - jh, 2, jh - 6, '#e09a5a');
      }
      // Parapet avant et poutres.
      R(c, X - 2, eave - 9, Wd + 4, 11, OUT);
      R(c, X, eave - 8, Wd, 8, f1);
      R(c, X, eave - 8, Wd, 2, f0);
      for (let x = X + 14; x < X + Wd - 10; x += 26) {
        R(c, x - 1, eave + 2, 8, 6, OUT);
        R(c, x, eave + 3, 6, 4, L.beam[0]);
      }
      // Tour carrée à gauche, plus haute que la terrasse.
      const tx0 = X + 10,
        tw = 58,
        ty0 = top - 12;
      R(c, tx0 - 2, ty0 - 2, tw + 4, eave - ty0 + 2, OUT);
      R(c, tx0, ty0, tw, eave - ty0 - 2, f0);
      R(c, tx0, ty0, 3, eave - ty0 - 2, '#fff2d8');
      R(c, tx0 + tw - 9, ty0, 9, eave - ty0 - 2, f2);
      for (let k = 0; k < 6; k++)
        R(c, tx0 + 8 + rnd(k, seed + 9) * 36, ty0 + 10 + rnd(seed + 9, k) * 30, 5, 1, f2);
      // Créneaux de la tour.
      for (let k = 0; k < 4; k++) {
        R(c, tx0 + k * 16 - 1, ty0 - 9, 11, 10, OUT);
        R(c, tx0 + k * 16, ty0 - 8, 9, 8, f0);
        R(c, tx0 + k * 16, ty0 - 8, 9, 2, '#fff2d8');
      }
      // Fenêtre en arc éclairée.
      const wx = tx0 + tw / 2 - 6;
      R(c, wx - 2, ty0 + 14, 16, 22, OUT);
      R(c, wx, ty0 + 16, 12, 18, '#ffd890');
      R(c, wx, ty0 + 14, 12, 3, OUT);
      R(c, wx + 2, ty0 + 13, 8, 2, OUT);
      R(c, wx + 5, ty0 + 16, 2, 18, L.beam[0]);
      light(wx + 6, ty0 + 24, 60, '#ffd890');
      // Ombre de la tour sur la terrasse.
      c.globalAlpha = 0.25;
      R(c, tx0 + tw, y0 + 2, 18, eave - y0 - 10, '#000000');
      c.globalAlpha = 1;
      // Dôme blanchi à la chaux, pointe dorée.
      const dx = tx0 + tw / 2,
        dy = ty0 - 8,
        HW = [6, 11, 15, 18, 20, 22, 23];
      HW.forEach((hw, k) => R(c, dx - hw - 2, dy - 28 + k * 4 - 2, hw * 2 + 4, 8, OUT));
      HW.forEach((hw, k) => {
        R(c, dx - hw, dy - 28 + k * 4, hw * 2, 4, '#f6eedc');
        R(c, dx - hw, dy - 28 + k * 4, Math.max(3, hw / 2), 4, '#ffffff');
        R(c, dx + hw - Math.max(4, hw / 2.5), dy - 28 + k * 4, Math.max(4, hw / 2.5), 4, '#d8c8a8');
      });
      R(c, dx - 2, dy - 38, 4, 10, '#c9a24a');
      R(c, dx - 3, dy - 42, 6, 5, '#f0d070');
    }
    function windowAt(c, L, x, y, round) {
      const [b0, b1] = L.beam;
      R(c, x - 4, y - 4, 30, 28, OUT);
      R(c, x - 3, y - 3, 28, 26, b0);
      R(c, x, y, 22, 20, '#ffd890');
      R(c, x, y, 22, 5, '#fff0c0');
      R(c, x + 14, y + 6, 6, 12, '#f0c070');
      if (round) {
        // Fenêtre en arc du désert : moucharabieh de bois.
        R(c, x - 3, y - 3, 5, 5, L.face[0]);
        R(c, x + 20, y - 3, 5, 5, L.face[0]);
        for (let k = 0; k < 4; k++) R(c, x + 2 + k * 5, y, 1, 20, b1);
        for (let k = 0; k < 3; k++) R(c, x, y + 4 + k * 6, 22, 1, b1);
      } else {
        R(c, x + 10, y, 2, 20, b0);
        R(c, x, y + 9, 22, 2, b0);
        // Volets ouverts.
        for (const sx of [x - 12, x + 25]) {
          R(c, sx - 1, y - 3, 11, 26, OUT);
          R(c, sx, y - 2, 9, 24, b0);
          for (let k = 0; k < 4; k++) R(c, sx + 1, y + k * 6, 7, 1, b1);
        }
      }
      R(c, x - 5, y + 21, 32, 4, b1);
      halo(c, x + 11, y + 10, 26);
      if (LIVE.FX) LIVE.FX.push([4, x, y, 22, 20, x * 7 + y]);
      if (L.flowers) {
        R(c, x - 4, y + 23, 30, 6, '#8a5a34');
        R(c, x - 4, y + 23, 30, 1, '#a87444');
        for (let k = 0; k < 6; k++)
          R(c, x - 3 + k * 5, y + 17 + (k % 2), 4, 4, k % 2 ? L.flowers : '#ffffff');
        R(c, x - 3, y + 20, 28, 3, '#4f8a42');
      }
    }
    function doorAt(c, L, mid, bot) {
      const [b0, b1] = L.beam,
        top = bot - 52;
      R(c, mid - 21, top - 6, 42, 58, OUT);
      R(c, mid - 19, top - 4, 38, 56, b1);
      // Arc de la porte.
      R(c, mid - 15, top + 2, 30, 48, '#8a5a34');
      R(c, mid - 11, top - 1, 22, 3, '#8a5a34');
      R(c, mid - 15, top + 2, 30, 2, '#a87444');
      for (const dx of [-8, 0, 8]) R(c, mid + dx - 1, top + 2, 1, 48, '#5e3c22');
      R(c, mid - 15, top + 12, 30, 3, '#3a3a40');
      R(c, mid - 15, top + 36, 30, 3, '#3a3a40');
      R(c, mid + 8, top + 24, 4, 4, '#e0c060');
      R(c, mid + 8, top + 24, 2, 2, '#fff2a0');
      // Marche de pierre.
      R(c, mid - 25, bot - 1, 50, 7, OUT);
      R(c, mid - 24, bot, 48, 5, '#9a9aa0');
      R(c, mid - 24, bot, 48, 2, '#c4c4ca');
      // Lanterne à côté de la porte.
      const lx = mid - 30,
        ly = top + 4;
      R(c, lx - 1, ly - 1, 8, 13, OUT);
      R(c, lx, ly, 6, 11, '#ffcf6a');
      R(c, lx + 1, ly + 1, 4, 3, '#fff2b0');
      light(lx + 3, ly + 6, 80, '#ffcf6a');
    }
    // Pignon au-dessus de la porte : petit toit avancé avec un œil-de-bœuf, pour donner du relief.
    function gableAt(c, L, mid, eave) {
      if (L.roof === 'flat') return;
      const rows = 7;
      for (let k = 0; k < rows; k++)
        R(c, mid - (8 + k * 4) - 3, eave - 30 + k * 4 - 2, (8 + k * 4) * 2 + 6, 6, OUT);
      for (let k = 0; k < rows; k++) {
        const hw = 8 + k * 4,
          y = eave - 30 + k * 4;
        R(
          c,
          mid - hw + 3,
          y,
          hw * 2 - 6,
          4,
          L.wall === 'logs'
            ? L.face[k % 2]
            : L.wall === 'stone'
              ? L.face[1]
              : L.wall === 'planks'
                ? L.face[1]
                : L.face[0]
        );
        R(c, mid - hw, y, 4, 4, L.tones[2]);
        R(c, mid + hw - 4, y, 4, 4, L.tones[3]);
      }
      R(c, mid - 5, eave - 18, 10, 10, OUT);
      R(c, mid - 4, eave - 17, 8, 8, '#ffd890');
      R(c, mid - 1, eave - 17, 2, 8, L.beam[0]);
    }
    function chimneyAt(c, L, x, top) {
      const brick = L.chimney === 'brick';
      R(c, x - 2, top - 16, 22, 36, OUT);
      R(c, x, top - 14, 18, 32, brick ? '#9a5a44' : '#8a8680');
      for (let k = 0; k < 4; k++) {
        R(c, x, top - 14 + k * 8 + 7, 18, 1, brick ? '#6a3a2c' : '#64605a');
        R(c, x + (k % 2 ? 4 : 11), top - 14 + k * 8, 1, 7, brick ? '#6a3a2c' : '#64605a');
      }
      R(c, x, top - 14, 3, 32, '#ffffff22');
      R(c, x - 3, top - 19, 24, 6, OUT);
      R(c, x - 2, top - 18, 22, 4, '#5a5a62');
      smoke(c, x + 9, top - 22);
    }
    function signAt(c, x, y, kind) {
      R(c, x, y, 20, 3, '#3a2a1e');
      R(c, x + 3, y + 3, 2, 6, '#3a2a1e');
      R(c, x + 15, y + 3, 2, 6, '#3a2a1e');
      R(c, x - 3, y + 8, 26, 24, OUT);
      R(c, x - 2, y + 9, 24, 22, '#7a5230');
      R(c, x, y + 11, 20, 18, '#b08250');
      if (kind === 'guilde') {
        // Écu bleu à bordure d'or et deux épées croisées.
        R(c, x + 4, y + 13, 12, 10, '#d8b040');
        R(c, x + 5, y + 14, 10, 9, '#3c4c8c');
        R(c, x + 6, y + 23, 8, 2, '#d8b040');
        R(c, x + 8, y + 25, 4, 2, '#d8b040');
        for (let k = 0; k < 6; k++) {
          R(c, x + 6 + k, y + 15 + k, 1, 1, '#eef2f8');
          R(c, x + 13 - k, y + 15 + k, 1, 1, '#eef2f8');
        }
      } else if (kind === 'or') {
        R(c, x + 5, y + 16, 10, 10, '#c8a050');
        R(c, x + 7, y + 14, 6, 3, '#8a6a30');
        R(c, x + 8, y + 19, 4, 4, '#ffe080');
      } else {
        R(c, x + 3, y + 20, 14, 6, '#e8e0d0');
        R(c, x + 5, y + 26, 10, 2, '#c8c0b0');
        R(c, x + 4, y + 19, 12, 2, '#e08a3a');
        R(c, x + 7, y + 13, 2, 4, '#ffffff');
        R(c, x + 11, y + 12, 2, 4, '#ffffff');
      }
    }
    // Abords : ce qui pousse ou traîne au pied de la maison, selon le biome.
    function groundAt(c, L, X, Wd, bot, seed) {
      const spots = [X - 16, X + Wd + 4];
      for (const [i, x] of spots.entries()) {
        const y = bot - 4;
        switch (L.ground) {
          case 'plaines':
            R(c, x - 1, y - 13, 18, 15, OUT);
            R(c, x, y - 12, 16, 13, '#4f8a42');
            R(c, x + 2, y - 12, 8, 4, '#6aa852');
            R(c, x + 3, y - 9, 3, 3, i ? '#f0c040' : '#e05a7a');
            R(c, x + 10, y - 6, 3, 3, '#ffffff');
            break;
          case 'foret':
            R(c, x + 2, y - 8, 4, 8, '#e8dcc0');
            R(c, x - 1, y - 14, 11, 7, OUT);
            R(c, x, y - 13, 9, 5, '#c83a2a');
            R(c, x + 2, y - 12, 2, 2, '#ffffff');
            R(c, x + 10, y - 10, 2, 10, '#3e6a2e');
            R(c, x + 12, y - 12, 5, 2, '#4e8a3a');
            R(c, x + 8, y - 8, 4, 2, '#4e8a3a');
            break;
          case 'marais':
            for (let k = 0; k < 4; k++) R(c, x + k * 4, y - 14 + (k % 2) * 4, 2, 14 - (k % 2) * 4, '#6a8a3a');
            R(c, x + 2, y - 18, 3, 6, '#6a4a2a');
            break;
          case 'automne':
            R(c, x - 1, y - 12, 18, 13, OUT);
            R(c, x, y - 11, 16, 11, '#e07a28');
            R(c, x + 5, y - 11, 1, 11, '#b05a1a');
            R(c, x + 10, y - 11, 1, 11, '#b05a1a');
            R(c, x + 7, y - 15, 3, 4, '#4e6a2a');
            break;
          case 'desert':
            R(c, x - 1, y - 21, 16, 22, OUT);
            R(c, x, y - 20, 14, 20, '#c8783a');
            R(c, x + 3, y - 24, 8, 5, '#a8602c');
            R(c, x + 2, y - 16, 3, 12, '#e09a5a');
            break;
          default: {
            const p = 0.6 + Math.sin(time * 0.06 + i) * 0.3;
            R(c, x + 2, y - 18, 7, 18, OUT);
            R(c, x + 3, y - 17, 5, 17, '#9ae0ff');
            R(c, x + 3, y - 17, 2, 17, '#e0f8ff');
            R(c, x + 9, y - 10, 5, 10, '#c89aff');
            light(x + 6, y - 10, 60 * p, '#9ae0ff');
          }
        }
      }
    }
    // ---------------------------------------------------------------- Architectures
    // Chaque biome a plusieurs silhouettes (form) : maison à quatre pans, maison à étage à colombages, chalet au
    // grand pignon, grange à toit brisé, hutte ronde au toit conique, maison à dôme, tour ronde, maison-champignon,
    // terrasse du désert. La porte reste au milieu du bas (même emprise, mêmes collisions).
    const STONE_LOOK = L => ({
      ...L,
      wall: 'stone',
      face:
        L.ground === 'desert'
          ? ['#d8b47e', '#c49e6a', '#a8844f']
          : L.ground === 'enchantee'
            ? ['#a49cc0', '#8c84aa', '#6e668e']
            : ['#b4ae9e', '#9c9686', '#7e786a']
    });
    // Rangées d'un triangle (toit conique ou pignon) : demi-largeur de la pointe à la base, par pas de 4 px.
    function cone(c, L, mid, apex, base, half, seed, fringe) {
      const T = L.tones,
        rows = [];
      for (let y = apex; y < base; y += 4)
        rows.push([y, Math.max(3, Math.round((((y - apex + 4) / (base - apex)) * half) / 2) * 2)]);
      for (const [y, hw] of rows) R(c, mid - hw - 2, y - 2, hw * 2 + 4, 8, OUT);
      rows.forEach(([y, hw], i) => {
        R(c, mid - hw, y, hw * 2, 4, T[1]);
        R(c, mid - hw, y, Math.max(2, Math.round(hw * 0.45)), 4, T[0]);
        R(c, mid + hw - Math.max(2, Math.round(hw * 0.4)), y, Math.max(2, Math.round(hw * 0.4)), 4, T[2]);
        for (let x = mid - hw + (i % 2) * 3; x < mid + hw - 2; x += 6) R(c, x, y + 3, 3, 1, T[3]);
        if (rnd(i, seed) < 0.4)
          R(c, mid - hw + 4 + rnd(seed, i) * Math.max(1, hw * 2 - 10), y + 1, 4, 2, T[i % 2 ? 0 : 2]);
      });
      R(c, mid - half / 2 - 2, base - 2, half + 4, 4, T[3]);
      if (fringe)
        for (let x = mid - half / 2; x < mid + half / 2; x += 4)
          R(c, x, base, 3, 2 + Math.floor(rnd(x, seed) * 6), T[2]);
    }
    // Mur arrondi (hutte, tour) : bandes verticales plus sombres vers les bords pour le volume.
    function roundWall(c, L, x0, w, top, bot, seed) {
      R(c, x0 - 2, top - 2, w + 4, bot - top + 4, OUT);
      const [f0, f1, f2] = L.face;
      for (let x = 0; x < w; x += 4) {
        const t = x / w,
          col = t < 0.15 ? f1 : t > 0.78 ? f2 : t < 0.35 ? f0 : rnd(x, seed) < 0.5 ? f0 : f1;
        R(c, x0 + x, top, Math.min(4, w - x), bot - top, col);
        if (L.wall === 'stone')
          for (let y = top + ((x / 4) % 2) * 6; y < bot; y += 12) R(c, x0 + x, y, 4, 1, f2);
        else R(c, x0 + x + 3, top, 1, bot - top, L.beam[1]);
      }
      R(c, x0 + 2, top, 3, bot - top, '#ffffff30');
    }
    function paintForm(c, b, L, g) {
      const { X, Wd, bot, mid, seed, base } = g;
      let top = bot - 66,
        roofTop = b.y * TS - 34;
      const form = b.form || 'house';
      const windows = (y, round, spread = 21 + 26) => {
        windowAt(c, L, mid - 22 - spread, y, round);
        windowAt(c, L, mid + spread, y, round);
        light(mid - spread - 11, y + 10, 70, '#ffd890');
        light(mid + spread + 11, y + 10, 70, '#ffd890');
      };
      if (form === 'storey') {
        // Rez-de-chaussée de pierre, étage à colombages en encorbellement, toit à quatre pans.
        const mid1 = bot - 56;
        top = bot - 116;
        drawWall(c, STONE_LOOK(L), X, mid1, Wd, bot, seed + 1);
        drawWall(c, L, X - 6, top, Wd + 12, mid1, seed);
        R(c, X - 10, mid1 - 3, Wd + 20, 8, OUT);
        R(c, X - 8, mid1 - 2, Wd + 16, 5, L.beam[0]);
        for (const bx of [X + 2, X + Wd - 10]) {
          R(c, bx - 1, mid1 + 3, 10, 12, OUT);
          R(c, bx, mid1 + 3, 8, 10, L.beam[1]);
        }
        drawBase(c, L, X, Wd, bot, seed);
        doorAt(c, L, mid, bot);
        windows(top + 14, false, 34);
        windowAt(c, L, mid - 11, top + 14, false);
        windowAt(c, L, mid - 22 - 47, mid1 + 12, false);
        roofTop = top - 46;
        drawRoof(c, L, X - 6, Wd + 12, roofTop, top + 10, seed);
        if (L.chimney) chimneyAt(c, L, X + Wd - 50, roofTop + 4);
        return roofTop;
      }
      if (form === 'gable') {
        // Chalet : murs bas, grand pignon de face entre deux pans de toit qui descendent presque au sol, balcon.
        top = bot - 52;
        drawWall(c, L, X, top, Wd, bot, seed);
        drawBase(c, L, X, Wd, bot, seed);
        doorAt(c, L, mid, bot);
        windows(top + 12, false);
        const apex = top - 96,
          baseY = top + 14,
          half = Wd / 2 + 18;
        for (let y = apex; y < baseY; y += 4) {
          const hw = Math.round(((y - apex + 4) / (baseY - apex)) * half);
          R(c, mid - hw - 2, y - 2, hw * 2 + 4, 8, OUT);
        }
        for (let y = apex, i = 0; y < baseY; y += 4, i++) {
          const hw = Math.round(((y - apex + 4) / (baseY - apex)) * half),
            band = Math.min(hw, 26);
          // Pignon (bois) au centre, pans de toit de chaque côté.
          R(c, mid - hw, y, hw * 2, 4, L.wall === 'logs' ? L.face[i % 3 === 0 ? 1 : 0] : L.face[0]);
          if (L.wall !== 'logs')
            for (let x = mid - hw + band; x < mid + hw - band; x += 10) R(c, x, y, 1, 4, L.face[2]);
          R(c, mid - hw, y, band, 4, L.tones[i % 2 ? 0 : 1]);
          R(c, mid + hw - band, y, band, 4, L.tones[i % 2 ? 2 : 3]);
          R(c, mid - hw + band - 2, y, 2, 4, L.tones[3]);
          R(c, mid + hw - band, y, 2, 4, OUT);
        }
        // Balcon et fenêtre du pignon.
        R(c, mid - 44, top - 6, 88, 8, OUT);
        R(c, mid - 42, top - 5, 84, 5, L.beam[0]);
        for (let x = mid - 40; x < mid + 40; x += 8) R(c, x, top - 18, 3, 13, L.beam[0]);
        R(c, mid - 42, top - 20, 84, 4, L.beam[0]);
        windowAt(c, L, mid - 11, top - 56, false);
        light(mid, top - 46, 70, '#ffd890');
        if (L.chimney) chimneyAt(c, L, X + Wd - 40, top - 52);
        return apex - 10;
      }
      if (form === 'gambrel') {
        // Grange : planches, toit brisé en deux pans (bas raide et sombre, haut plus clair), lucarne à foin.
        top = bot - 62;
        drawWall(c, { ...L, wall: 'planks' }, X, top, Wd, bot, seed);
        for (const x of [X + 16, X + Wd - 40]) {
          R(c, x, top + 14, 24, 30, L.beam[0]);
          for (let k = 0; k < 12; k++) {
            R(c, x + k * 2, top + 14 + k * 2.5, 3, 3, L.beam[1]);
            R(c, x + 22 - k * 2, top + 14 + k * 2.5, 3, 3, L.beam[1]);
          }
        }
        drawBase(c, L, X, Wd, bot, seed);
        doorAt(c, L, mid, bot);
        const T = L.tones,
          lowTop = top - 30,
          upTop = lowTop - 34;
        // Contour rangée par rangée (le pan haut est plus étroit : pas de coins noirs).
        R(c, X - 14, lowTop - 2, Wd + 28, top + 12 - lowTop, OUT);
        for (let y = upTop; y < lowTop; y += 5) {
          const inset = Math.round(((lowTop - y) / 34) * 22);
          R(c, X - 14 + inset, y - 2, Wd + 28 - inset * 2, 9, OUT);
        }
        for (let y = lowTop, i = 0; y < top + 10; y += 5, i++) {
          R(c, X - 12, y, Wd + 24, 5, T[i % 2 ? 2 : 1]);
          for (let x = X - 12 + (i % 2) * 7; x < X + Wd + 12; x += 14) R(c, x, y, 1, 5, T[3]);
        }
        for (let y = upTop, i = 0; y < lowTop; y += 5, i++) {
          const inset = Math.round(((lowTop - y) / 34) * 22);
          R(c, X - 12 + inset, y, Wd + 24 - inset * 2, 5, T[i % 2 ? 0 : 1]);
          for (let x = X - 12 + inset + (i % 2) * 7; x < X + Wd + 12 - inset; x += 14) R(c, x, y, 1, 5, T[2]);
        }
        R(c, X - 12, lowTop - 2, Wd + 24, 3, T[3]);
        R(c, X + 10, upTop - 4, Wd - 20, 4, T[3]);
        // Lucarne à foin.
        R(c, mid - 16, lowTop - 22, 32, 30, OUT);
        R(c, mid - 14, lowTop - 20, 28, 26, L.face[1]);
        R(c, mid - 10, lowTop - 16, 20, 20, '#3a2414');
        R(c, mid - 10, lowTop - 4, 20, 8, '#e0c060');
        R(c, mid - 1, lowTop - 30, 2, 12, L.beam[1]);
        if (L.leaves)
          for (let k = 0; k < 10; k++)
            R(
              c,
              X + rnd(k, seed) * Wd,
              lowTop + rnd(seed, k) * 34,
              3,
              3,
              pick(['#e8a040', '#c84a2a', '#f0c040'], k, seed)
            );
        return upTop - 8;
      }
      if (form === 'round') {
        // Hutte ronde (roseaux) au toit conique frangé ; sur pilotis au marais.
        const x0 = X + 24,
          w = Wd - 48;
        top = bot - 58;
        roundWall(c, L, x0, w, top, bot, seed);
        if (!L.stilts) drawBase(c, L, x0, w, bot, seed);
        doorAt(c, L, mid, bot);
        windowAt(c, L, x0 + 6, top + 12, true);
        light(x0 + 17, top + 22, 60, '#ffd890');
        const apex = top - 118;
        cone(c, L, mid, apex, top + 16, w + 26, seed, true);
        R(c, mid - 2, apex - 10, 4, 12, L.beam[0]);
        R(c, mid - 5, apex - 14, 10, 5, L.tones[3]);
        return apex - 12;
      }
      if (form === 'dome') {
        // Maison à dôme blanchi à la chaux : murs bas de terre, dôme, petite tour à vent et arcades.
        top = bot - 46;
        drawWall(c, L, X, top, Wd, bot, seed);
        drawBase(c, L, X, Wd, bot, seed);
        doorAt(c, L, mid, bot);
        windows(top + 10, true);
        const R0 = Wd / 2 - 8,
          cy = top + 6,
          rows = [];
        for (let y = cy - Math.round(R0 * 0.82); y < cy; y += 4) {
          const t = (cy - y) / (R0 * 0.82);
          rows.push([y, Math.round((Math.sqrt(Math.max(0, 1 - t * t)) * R0) / 2) * 2]);
        }
        for (const [y, hw] of rows) R(c, mid - hw - 2, y - 2, hw * 2 + 4, 8, OUT);
        rows.forEach(([y, hw]) => {
          R(c, mid - hw, y, hw * 2, 4, '#f4ecda');
          R(c, mid - hw, y, Math.max(3, Math.round(hw * 0.35)), 4, '#ffffff');
          R(
            c,
            mid + hw - Math.max(4, Math.round(hw * 0.38)),
            y,
            Math.max(4, Math.round(hw * 0.38)),
            4,
            '#d6c6a4'
          );
        });
        for (let k = 0; k < 6; k++) R(c, mid - R0 * 0.6 + k * R0 * 0.24, cy - 18, 6, 9, '#3a3a5a');
        const ty = cy - Math.round(R0 * 0.82);
        R(c, mid - 2, ty - 16, 4, 16, '#c9a24a');
        R(c, mid - 4, ty - 21, 8, 6, '#f0d070');
        R(c, X + Wd - 40, top - 40, 26, 44, OUT);
        R(c, X + Wd - 38, top - 38, 22, 40, L.face[0]);
        R(c, X + Wd - 34, top - 32, 14, 8, '#3a2414');
        R(c, X + Wd - 38, top - 38, 22, 3, '#fff2d8');
        return ty - 22;
      }
      if (form === 'tower') {
        // Tour ronde de pierre au toit conique, appentis à gauche, fenêtres superposées.
        const tw = 104,
          x0 = mid - tw / 2;
        top = bot - 132;
        drawWall(c, STONE_LOOK(L), X, bot - 56, 52, bot, seed + 3);
        R(c, X - 6, bot - 66, 60, 12, OUT);
        for (let y = bot - 64, i = 0; y < bot - 56; y += 4, i++)
          R(c, X - 4 + i * 2, y, 56 - i * 2, 4, L.tones[i % 2 ? 1 : 2]);
        roundWall(c, STONE_LOOK(L), x0, tw, top, bot, seed);
        drawBase(c, L, x0, tw, bot, seed);
        doorAt(c, L, mid, bot);
        windowAt(c, L, mid - 11, top + 18, true);
        windowAt(c, L, mid - 11, top + 62, true);
        light(mid, top + 28, 70, '#c8b0ff');
        light(mid, top + 72, 70, '#c8b0ff');
        const apex = top - 96;
        cone(c, L, mid, apex, top + 12, tw + 28, seed, false);
        R(c, mid - 2, apex - 16, 4, 18, '#c9a24a');
        R(c, mid - 6, apex - 22, 12, 8, L.glow ? '#9af0ff' : '#f0d070');
        if (L.glow) {
          light(mid, apex - 18, 50, '#9af0ff');
          // Cristaux qui poussent au pied et contre la tour, avec leur halo.
          for (const [cx, ch, cw, col] of [
            [x0 - 14, 46, 12, '#9af0ff'],
            [x0 - 2, 30, 9, '#c89aff'],
            [x0 + tw + 4, 52, 13, '#9af0ff'],
            [x0 + tw + 18, 28, 9, '#ffb0f0'],
            [X + 6, 24, 8, '#c89aff']
          ]) {
            for (let k = 0; k < ch; k += 4) {
              const hw = Math.max(1, Math.round((cw / 2) * Math.min(1, (k + 6) / 14)));
              R(c, cx - hw - 1, bot - ch + k - 1, hw * 2 + 2, 6, OUT);
            }
            for (let k = 0; k < ch; k += 4) {
              const hw = Math.max(1, Math.round((cw / 2) * Math.min(1, (k + 6) / 14)));
              R(c, cx - hw, bot - ch + k, hw * 2, 4, col);
              R(c, cx - hw, bot - ch + k, Math.max(1, hw - 1), 4, '#ffffff');
            }
            halo(c, cx, bot - ch / 2, 30, '160,240,255');
            if (LIVE.FX) LIVE.FX.push([8, cx, bot - ch / 2, 60, col, cx]);
            else light(cx, bot - ch / 2, 50, col);
          }
        }
        return apex - 24;
      }
      if (form === 'tree') {
        // Maison dans le tronc d'un chêne géant : écorce, racines, porte et fenêtres creusées, ramure pour toit.
        const tw = Wd - 36,
          x0 = mid - tw / 2;
        top = bot - 86;
        R(c, x0 - 2, top - 2, tw + 4, bot - top + 4, OUT);
        for (let x = 0; x < tw; x += 4) {
          const t = x / tw,
            col = t < 0.18 ? '#7a5434' : t > 0.75 ? '#3e2a18' : rnd(x, seed) < 0.5 ? '#5e3e24' : '#664428';
          R(c, x0 + x, top, 4, bot - top, col);
          for (let y = top + Math.floor(rnd(seed, x) * 10); y < bot; y += 14 + Math.floor(rnd(x, y) * 8))
            R(c, x0 + x, y, 4, 2, '#2e1e10');
        }
        for (const [rx, rw] of [
          [x0 - 22, 30],
          [x0 + tw - 8, 30],
          [x0 + 20, 18]
        ]) {
          R(c, rx - 1, bot - 13, rw + 2, 15, OUT);
          R(c, rx, bot - 12, rw, 12, '#5e3e24');
          R(c, rx, bot - 12, rw, 3, '#7a5434');
        }
        doorAt(c, L, mid, bot);
        for (const [wx, wy] of [
          [x0 + 10, top + 14],
          [x0 + tw - 32, top + 30]
        ]) {
          R(c, wx - 3, wy - 3, 28, 28, OUT);
          R(c, wx, wy, 22, 22, '#ffd890');
          R(c, wx + 10, wy, 2, 22, '#5e3e24');
          R(c, wx, wy + 10, 22, 2, '#5e3e24');
          halo(c, wx + 11, wy + 11, 26);
          light(wx + 11, wy + 11, 70, '#ffd890');
          if (LIVE.FX) LIVE.FX.push([4, wx, wy, 22, 22, wx + wy]);
        }
        // Ramure : grosses touffes de feuilles en trois tons, éclairées en haut à gauche.
        const blobs = [];
        for (let k = 0; k < 14; k++)
          blobs.push([
            mid + (rnd(k, seed) - 0.5) * (Wd + 60),
            top - 24 - rnd(seed, k) * 74,
            26 + rnd(k + 3, seed) * 16
          ]);
        blobs.sort((a, b) => a[1] - b[1]);
        const leaf =
          L.ground === 'automne' ? ['#e08a3a', '#c0602a', '#8a4020'] : ['#5a9a44', '#3e7a34', '#2a5426'];
        for (const [bx, by, br] of blobs) {
          for (let y = -br; y < br; y += 4) {
            const hw = Math.round(Math.sqrt(Math.max(0, br * br - y * y)) / 2) * 2;
            R(c, bx - hw - 2, by + y - 2, hw * 2 + 4, 8, OUT);
          }
        }
        for (const [bx, by, br] of blobs)
          for (let y = -br; y < br; y += 4) {
            const hw = Math.round(Math.sqrt(Math.max(0, br * br - y * y)) / 2) * 2;
            R(c, bx - hw, by + y, hw * 2, 4, leaf[1]);
            if (y < 0) R(c, bx - hw, by + y, Math.round(hw * 0.9), 4, leaf[0]);
            if (y > br * 0.3) R(c, bx - hw, by + y, hw * 2, 4, leaf[2]);
            for (let x = bx - hw + ((y / 4) % 2) * 4; x < bx + hw - 2; x += 8)
              R(c, x, by + y + 1, 2, 2, y < 0 ? '#8ac860' : leaf[2]);
          }
        return top - 110;
      }
      if (form === 'tent') {
        // Grande tente de nomades : toile rayée tendue entre mâts, pans relevés à l'entrée, cordages et piquets, tapis.
        top = bot - 70;
        const apex = top - 46,
          half = Wd / 2 + 16,
          stripes = ['#e8dcc0', '#b8423a', '#e8dcc0', '#3a6a9a'];
        for (let y = apex; y < bot; y += 4) {
          const t = (y - apex) / (bot - apex),
            hw = Math.round((0.18 + t * 0.82) * half);
          R(c, mid - hw - 2, y - 2, hw * 2 + 4, 8, OUT);
        }
        for (let y = apex; y < bot; y += 4) {
          const t = (y - apex) / (bot - apex),
            hw = Math.round((0.18 + t * 0.82) * half);
          for (let x = -hw; x < hw; x += 4) {
            const band = Math.floor(((x / hw) * 0.5 + 0.5) * 9);
            R(c, mid + x, y, 4, 4, stripes[band % stripes.length]);
          }
          // Plis de la toile entre les cordes.
          if ((y - apex) % 24 < 4) R(c, mid - hw, y, hw * 2, 2, '#00000022');
        }
        // Entrée : pans relevés, ombre de l'intérieur.
        for (let y = bot - 58; y < bot; y += 4) {
          const hw = Math.round(((y - (bot - 58)) / 58) * 30) + 8;
          R(c, mid - hw, y, hw * 2, 4, '#3a2418');
        }
        R(c, mid - 30, bot - 60, 14, 22, '#c8a878');
        R(c, mid + 16, bot - 60, 14, 22, '#c8a878');
        doorAt(c, { ...L, beam: ['#6a4a2a', '#3a2418'] }, mid, bot);
        R(c, mid - 2, apex - 18, 4, 20, '#6a4a2a');
        R(c, mid - 7, apex - 22, 14, 6, '#c9a24a');
        for (const sx of [-1, 1]) {
          R(c, mid + sx * (half - 4) - 2, bot - 40, 4, 40, '#6a4a2a');
          for (let k = 0; k < 10; k++)
            R(c, mid + sx * (half + 4 + k * 3), apex + 20 + k * 9, 2, 2, '#d8c8a0');
          R(c, mid + sx * (half + 34) - 2, bot - 4, 5, 6, '#4a3020');
        }
        // Tapis devant l'entrée.
        R(c, mid - 34, bot + 2, 68, 10, OUT);
        R(c, mid - 33, bot + 3, 66, 8, '#a8343a');
        R(c, mid - 30, bot + 5, 60, 4, '#d8a040');
        halo(c, mid, bot - 24, 40);
        light(mid, bot - 24, 90, '#ffcf6a');
        return apex - 26;
      }
      if (form === 'mushroom') {
        // Maison-champignon : pied crème aux fenêtres rondes, grand chapeau tacheté.
        const w = Wd - 56,
          x0 = mid - w / 2;
        top = bot - 60;
        roundWall(
          c,
          { ...L, wall: 'cream', face: ['#f2e8d0', '#e0d2b2', '#c4b28e'], beam: ['#8a6a4a', '#6a4e34'] },
          x0,
          w,
          top,
          bot,
          seed
        );
        doorAt(c, L, mid, bot);
        for (const wx of [x0 + 8, x0 + w - 26]) {
          R(c, wx - 2, top + 12, 22, 22, OUT);
          R(c, wx, top + 14, 18, 18, '#ffd890');
          R(c, wx + 8, top + 14, 2, 18, '#8a6a4a');
          light(wx + 9, top + 23, 55, '#ffd890');
          if (LIVE.FX) LIVE.FX.push([4, wx, top + 14, 18, 18, wx]);
        }
        const cy = top + 10,
          rx = Wd / 2 + 22,
          ry = 66,
          T = L.tones;
        for (let y = cy - ry; y < cy + 8; y += 4) {
          const t = Math.min(1, (cy - y) / ry),
            hw = Math.round((Math.sqrt(Math.max(0, 1 - t * t)) * rx) / 2) * 2;
          R(c, mid - hw - 2, y - 2, hw * 2 + 4, 8, OUT);
        }
        for (let y = cy - ry, i = 0; y < cy + 8; y += 4, i++) {
          const t = Math.min(1, (cy - y) / ry),
            hw = Math.round((Math.sqrt(Math.max(0, 1 - t * t)) * rx) / 2) * 2;
          R(c, mid - hw, y, hw * 2, 4, y > cy ? T[3] : T[1]);
          R(c, mid - hw, y, Math.round(hw * 0.4), 4, y > cy ? T[3] : T[0]);
          R(c, mid + hw - Math.round(hw * 0.35), y, Math.round(hw * 0.35), 4, T[2]);
        }
        for (let k = 0; k < 9; k++) {
          const a = rnd(k, seed) * Math.PI - Math.PI,
            r = 0.35 + rnd(seed, k) * 0.55,
            sx = mid + Math.cos(a) * rx * r,
            sy = cy + Math.sin(a) * ry * r * 0.9,
            sz = 6 + Math.floor(rnd(k + 9, seed) * 3) * 2;
          R(c, sx - sz / 2 - 1, sy - sz / 2 - 1, sz + 2, sz + 2, T[3]);
          R(c, sx - sz / 2, sy - sz / 2, sz, sz, '#f6f0ff');
          R(c, sx - sz / 2, sy - sz / 2, sz / 2, 2, '#ffffff');
        }
        return cy - ry - 6;
      }
      // Maison à quatre pans (ou terrasse du désert) : la forme d'origine.
      const lift = L.stilts ? 16 : 0;
      if (L.stilts) drawStilts(c, L, X, Wd, bot, lift, mid);
      drawWall(c, L, X, top, Wd, bot, seed);
      drawBase(c, L, X, Wd, bot, seed);
      doorAt(c, L, mid, bot);
      windows(top + 16, L.wall === 'adobe');
      // Auvent : rayé rouge et crème à l'échoppe, toile tendue sur perches dans le désert.
      if (L.awning === true) {
        R(c, mid - 30, top - 2, 60, 16, OUT);
        for (let k = 0; k < 6; k++) R(c, mid - 29 + k * 10, top - 1, 10, 12, k % 2 ? '#f2e2c0' : '#c4553f');
        for (let k = 0; k < 6; k++) R(c, mid - 29 + k * 10, top + 11, 10, 3, k % 2 ? '#d9c7a1' : '#9f4434');
      } else if (L.awning) {
        R(c, mid - 34, top + 2, 68, 12, OUT);
        R(c, mid - 33, top + 3, 66, 10, '#3a7a9a');
        for (let k = 0; k < 4; k++) R(c, mid - 33 + k * 18, top + 3, 8, 10, '#e8dcc0');
        R(c, mid - 33, top + 12, 3, 30, L.beam[0]);
        R(c, mid + 30, top + 12, 3, 30, L.beam[0]);
      }
      drawRoof(c, L, X, Wd, roofTop, top + 10, seed);
      if (L.roof !== 'flat') gableAt(c, L, mid, top + 10);
      if (L.chimney) chimneyAt(c, L, X + Wd - 56, roofTop + 4);
      return L.roof === 'flat' ? roofTop - 50 : roofTop - (L.chimney ? 18 : 0);
    }

    return Object.freeze({
      OUT,
      LOOKS,
      visible,
      rnd,
      light,
      smoke,
      windowLife,
      flag,
      laundry,
      leaves,
      campfire,
      ripple,
      spark,
      halo,
      drawStilts,
      signAt,
      groundAt,
      paintForm
    });
  }
  window.CANAAN_HOUSE_FACADES = Object.freeze({ create });
})();
