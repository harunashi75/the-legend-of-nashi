// Vie aquatique, en pixel art dans la facture des décors de l'île (grille de gros pixels, contour sombre, petites
// animations) : chaque eau a sa faune.
// - Mer : bancs de sardines (poissons tropicaux au large du désert), groupes de dauphins qui sautent chacun leur tour,
//   baleines qui remontent souffler puis plongent queue levée, tortues de mer, méduses près des côtes, raies manta.
// - Lacs, selon le biome : truites, perches, silures, carpes dorées, koïs ; un poisson saute de temps en temps ;
//   feuilles mortes qui dérivent sur les lacs d'automne.
// - Lacs lumineux de la Forêt enchantée : poissons-esprits et méduses qui luisent, poussières de lumière.
// - Marais : têtards, gerris qui patinent, bulles qui remontent. Libellules au-dessus des lacs et du marais.
// Sous la surface, une créature prend la teinte de l'eau et devient translucide ; celles qui en sortent (saut, dos de
// la baleine, libellules, feuilles) sont nettes. Les sprites sont tournés au pixel près dans 16 directions, cuits à la
// première vue. Décoratif, calculé chez chaque joueur, seulement autour de l'écran ; l'eau de la surface seulement.
(() => {
  'use strict';
  const creatures = [];
  const fx = [];
  const tileAt = (x, y) => game.world.overworld?.[Math.floor(y / TS)]?.[Math.floor(x / TS)];
  // Eau d'un point (pixels) : 'sea' (pleine mer, autour de l'île), 'lake', 'glow' (lacs lumineux), 'marsh' (eau peu
  // profonde) ou null.
  function waterAt(x, y) {
    const t = tileAt(x, y);
    if (t === 18) return 'glow';
    if (t === 15) return 'marsh';
    if (t !== 0) return null;
    return Math.hypot(x / TS - 200, y / TS - 200) > 146 ? 'sea' : 'lake';
  }
  // Même eau tout autour (rayon en cases).
  function open(x, y, radius, kind) {
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) if (waterAt(x + dx * TS, y + dy * TS) !== kind) return false;
    return true;
  }
  // Rive à moins de r cases.
  function shore(x, y, r) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) if (!waterAt(x + dx * TS, y + dy * TS)) return true;
    return false;
  }
  const visible = (x, y, margin) =>
    Math.abs(x - camX - W / 2) < W / 2 + margin && Math.abs(y - camY - H / 2) < H / 2 + margin;
  const zoneAt = (x, y) => canaanSurfaceZoneAt(Math.floor(x / TS), Math.floor(y / TS));

  // ---------------------------------------------------------------- Sprites (vus de dessus, tête vers la droite)
  // Palettes des poissons : [corps, dos, flancs clairs, taches].
  const FISH = {
    sardine: ['#a8bccc', '#5a7490', '#e0eaf2', null],
    tropical: ['#f0c838', '#c8901a', '#fff0a0', '#2a5ac8'],
    trout: ['#8a9a5a', '#4e5e34', '#c8cc90', '#3a2a1a'],
    perch: ['#a8a84a', '#4a5a2a', '#e0d890', '#3a4a1a'],
    catfish: ['#6a6a52', '#3a3a2c', '#9a9a7a', null],
    carp: ['#d8a040', '#9a6a1a', '#f4d488', null],
    koi: ['#f08a3a', '#c8501a', '#fff4e8', '#fff4e8'],
    spirit: ['#9af0ff', '#4ab8e8', '#ffffff', '#e0c8ff']
  };
  const JELLY = { sea: ['#f0a0c8', '#c8608a', '#ffe0f0'], glow: ['#a8e8ff', '#5ab0e8', '#ffffff'] };
  // body : corps fuselé de x0 à x1 autour de la ligne cy, demi-largeur h, dos sombre au milieu (vue de dessus).
  function body(k, x0, x1, cy, h, P) {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0),
        w = Math.max(0.6, h * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)));
      const y0 = Math.round(cy - w),
        y1 = Math.round(cy + w);
      k.rect(x, y0, 1, y1 - y0 + 1, P[0]);
      k.px(x, y0, P[2]);
      if (y1 - y0 >= 3) k.rect(x, Math.round(cy) - (h > 3 ? 1 : 0), 1, h > 3 ? 2 : 1, P[1]);
    }
  }
  const ART = {
    fish: {
      w: 15,
      h: 7,
      frames: 2,
      draw(k, f, P) {
        body(k, 3, 14, 3, 2.7, P);
        // Queue fourchue qui bat, nageoires, yeux, taches.
        k.rect(0, f ? 1 : 0, 3, 2, P[1]);
        k.rect(0, f ? 5 : 4, 3, 2, P[1]);
        k.rect(2, 3, 2, 1, P[1]);
        k.rect(8, 0, 2, 1, P[1]);
        k.rect(8, 6, 2, 1, P[1]);
        k.px(12, 1, '#101418');
        k.px(12, 5, '#101418');
        if (P[3]) {
          k.rect(5, 2, 2, 1, P[3]);
          k.rect(8, 4, 2, 1, P[3]);
          k.px(10, 2, P[3]);
        }
      }
    },
    tadpole: {
      w: 6,
      h: 3,
      frames: 2,
      draw(k, f) {
        k.rect(3, 0, 3, 3, '#2a2a20');
        k.px(4, 0, '#4a4a3a');
        k.rect(0, f ? 0 : 2, 1, 1, '#3a3a2c');
        k.rect(1, 1, 2, 1, '#3a3a2c');
      }
    },
    dolphin: {
      w: 26,
      h: 9,
      frames: 2,
      draw(k, f) {
        const P = ['#7a98b4', '#46647e', '#b0c6d8'];
        body(k, 3, 23, 4, 3.4, P);
        k.rect(23, 4, 2, 1, P[0]);
        k.rect(11, 3, 5, 3, '#3a566e');
        k.px(16, 0, P[1]);
        k.px(16, 8, P[1]);
        k.rect(0, f ? 1 : 0, 3, 2, P[1]);
        k.rect(0, f ? 7 : 6, 3, 2, P[1]);
        k.px(20, 2, '#101418');
        k.px(20, 6, '#101418');
      }
    },
    // Dauphin de profil, pour les sauts.
    dolphinSide: {
      w: 26,
      h: 11,
      frames: 1,
      draw(k) {
        for (let x = 3; x <= 23; x++) {
          const t = (x - 3) / 20,
            w = 3.6 * Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95));
          const y0 = Math.round(6 - w),
            y1 = Math.round(6 + w * 0.9);
          k.rect(x, y0, 1, y1 - y0 + 1, '#6a88a4');
          k.px(x, y0, '#9ab4cc');
          k.rect(x, Math.round(6 + w * 0.2), 1, Math.max(1, y1 - Math.round(6 + w * 0.2)), '#d8e4ec');
        }
        k.poly(
          [
            [11, 3],
            [14, -0.5],
            [16, 3]
          ],
          '#4e6c88'
        );
        k.rect(23, 6, 3, 1, '#6a88a4');
        k.poly(
          [
            [4, 6],
            [0, 2],
            [1, 6],
            [0, 10]
          ],
          '#4e6c88'
        );
        k.px(20, 5, '#101418');
        k.px(17, 8, '#4e6c88');
      }
    },
    whale: {
      w: 62,
      h: 21,
      frames: 1,
      draw(k) {
        const P = ['#3e5468', '#2a3a4c', '#5a7088'];
        body(k, 6, 60, 10, 9, P);
        k.rect(0, 2, 7, 4, P[1]);
        k.rect(0, 15, 7, 4, P[1]);
        k.rect(5, 8, 3, 5, P[1]);
        // Bernacles, évents, nageoires.
        for (const [x, y] of [
          [44, 6],
          [47, 13],
          [38, 7],
          [52, 9],
          [30, 13]
        ])
          k.rect(x, y, 2, 1, '#8a9aaa');
        k.px(48, 9, '#101418');
        k.px(48, 11, '#101418');
        k.rect(36, 0, 6, 2, P[1]);
        k.rect(36, 19, 6, 2, P[1]);
      }
    },
    // Queue de la baleine qui se lève avant la plongée (vue de dos).
    whaleTail: {
      w: 32,
      h: 15,
      frames: 1,
      draw(k) {
        k.rect(14, 8, 4, 7, '#2e4052');
        k.poly(
          [
            [16, 9],
            [2, 1],
            [0, 4],
            [6, 9],
            [14, 11]
          ],
          '#3e5468'
        );
        k.poly(
          [
            [16, 9],
            [30, 1],
            [32, 4],
            [26, 9],
            [18, 11]
          ],
          '#34495c'
        );
        k.rect(2, 2, 10, 1, '#6a8098');
        k.rect(20, 2, 10, 1, '#5a7088');
        for (const x of [4, 10, 22, 28]) k.px(x, 9 + (x % 3), '#d8eef8');
      }
    },
    turtle: {
      w: 15,
      h: 13,
      frames: 2,
      draw(k, f) {
        k.rect(f ? 9 : 8, f ? 1 : 0, 3, 2, '#6a8a5a');
        k.rect(f ? 9 : 8, f ? 10 : 11, 3, 2, '#6a8a5a');
        k.rect(2, 2, 2, 2, '#6a8a5a');
        k.rect(2, 9, 2, 2, '#6a8a5a');
        k.disc(7, 6, 4, '#3e6a46');
        k.disc(7, 6, 3, '#5a8a5a');
        for (const [x, y] of [
          [6, 4],
          [8, 4],
          [5, 6],
          [7, 6],
          [9, 6],
          [6, 8],
          [8, 8]
        ])
          k.px(x, y, '#8ab878');
        k.rect(11, 5, 3, 3, '#8a9a6a');
        k.px(13, 5, '#101418');
        k.px(13, 7, '#101418');
      }
    },
    jelly: {
      w: 11,
      h: 14,
      frames: 3,
      draw(k, f, P) {
        const s = [0, 1, 0][f];
        for (const x of [2, 4, 6, 8]) {
          for (let y = 7; y < 13 - (x % 4 ? 1 : 0); y++) k.px(x + (((y + f + x) >> 1) % 2), y, P[1]);
        }
        for (let y = -3; y <= 2; y++) {
          const w = Math.round((4 + s) * Math.sqrt(Math.max(0, 1 - (y * y) / 10)));
          k.rect(5 - w, 4 + y, w * 2 + 1, 1, P[0]);
        }
        k.rect(3 - s, 6, 5 + s * 2, 1, P[1]);
        k.rect(3, 2, 3, 1, P[2]);
        k.px(4, 1, P[2]);
        k.px(5, 4, P[1]);
        k.px(7, 3, P[1]);
      }
    },
    manta: {
      w: 28,
      h: 19,
      frames: 2,
      draw(k, f) {
        k.poly(
          [
            [25, 9.5],
            [13, f ? 1 : 0],
            [7, 9.5],
            [13, f ? 18 : 19]
          ],
          '#3a4a5e'
        );
        k.poly(
          [
            [25, 9.5],
            [15, 6],
            [9, 9.5],
            [15, 13]
          ],
          '#2a3646'
        );
        k.rect(0, 9, 8, 1, '#2a3646');
        k.rect(24, 7, 3, 1, '#2a3646');
        k.rect(24, 12, 3, 1, '#2a3646');
        for (const [x, y] of [
          [16, 4],
          [16, 15],
          [12, 7]
        ])
          k.px(x, y, '#6a7a90');
      }
    },
    // Poisson de profil, pour les sauts.
    leaper: {
      w: 12,
      h: 6,
      frames: 1,
      draw(k, f, P) {
        for (let x = 2; x <= 10; x++) {
          const w = 2.2 * Math.sin(Math.PI * Math.min(1, 0.12 + ((x - 2) / 8) * 0.95));
          const y0 = Math.round(3 - w),
            y1 = Math.round(3 + w * 0.8);
          k.rect(x, y0, 1, y1 - y0 + 1, P[0]);
          k.px(x, y0, P[1]);
          k.px(x, y1, P[2]);
        }
        k.poly(
          [
            [3, 3],
            [0, 0],
            [1, 3],
            [0, 6]
          ],
          P[1]
        );
        k.px(6, 0, P[1]);
        k.px(9, 2, '#101418');
        if (P[3]) k.px(5, 2, P[3]);
      }
    },
    dragonfly: {
      w: 12,
      h: 11,
      frames: 2,
      draw(k, f, P) {
        // Ailes fines et nervurées, corps épais et coloré.
        k.rect(f ? 4 : 5, 0, 1, 4, '#e8f4ff');
        k.rect(f ? 4 : 5, 7, 1, 4, '#e8f4ff');
        k.rect(f ? 7 : 6, 1, 1, 3, '#d8ecff');
        k.rect(f ? 7 : 6, 7, 1, 3, '#d8ecff');
        k.rect(0, 5, 9, 1, P[0]);
        k.rect(3, 4, 6, 3, P[0]);
        k.rect(4, 4, 4, 1, P[1]);
        k.rect(9, 4, 3, 3, P[1]);
        k.px(11, 4, '#101418');
        k.px(11, 6, '#101418');
      }
    },
    leaf: {
      w: 6,
      h: 5,
      frames: 1,
      draw(k, f, P) {
        k.rect(1, 1, 4, 3, P[0]);
        k.px(0, 2, P[0]);
        k.px(5, 2, P[1]);
        k.rect(1, 2, 4, 1, P[1]);
        k.px(2, 0, P[0]);
        k.px(3, 4, P[0]);
      }
    },
    strider: {
      w: 9,
      h: 9,
      frames: 1,
      draw(k) {
        k.line(1, 1, 3, 3, '#2a2420');
        k.line(1, 7, 3, 5, '#2a2420');
        k.line(8, 0, 5, 3, '#2a2420');
        k.line(8, 8, 5, 5, '#2a2420');
        k.rect(3, 4, 3, 1, '#3a3028');
        k.px(6, 4, '#4a3e34');
      }
    }
  };
  const LEAVES = [
    ['#d84a2a', '#8a2a1a'],
    ['#e88a2a', '#a8541a'],
    ['#e8c03a', '#a8801a']
  ];
  const DRAGONFLY = [
    ['#3a8ad8', '#2a5aa8'],
    ['#4ab86a', '#2a7a4a'],
    ['#c84a4a', '#8a2a2a']
  ];
  // Teinte de l'eau où plonge une créature : [couleur, part du mélange, opacité].
  // Sous l'eau, pas de contour d'encre : le bord prend une teinte d'eau profonde (edge), la créature se fond dans l'eau.
  const TINT = {
    sub: { to: '#123f63', mix: 0.42, alpha: 0.62, edge: '#0a2842' },
    deep: { to: '#0e3352', mix: 0.56, alpha: 0.52, edge: '#08223a' },
    marsh: { to: '#2a6662', mix: 0.42, alpha: 0.64, edge: '#1a4a46' },
    jelly: { to: '#1d5f8e', mix: 0.3, alpha: 0.6, edge: '#2a5a86' },
    glow: { to: '#2d3184', mix: 0.12, alpha: 0.8, edge: '#4a68c8' }
  };
  const DIRS = 16;
  const cache = new Map();
  const kit = () =>
    typeof CANAAN_PIXEL_KIT !== 'undefined' && typeof document !== 'undefined' ? CANAAN_PIXEL_KIT : null;
  // Sprite cuit : dessin sur la grille d'art, tourné au pixel près (sans lissage), cerné, plongé dans l'eau, agrandi ×2.
  function sprite(kind, pal, frame, dir, mode = 'dry', flip = false) {
    const key = kind + '|' + pal + '|' + frame + '|' + dir + '|' + mode + '|' + (flip ? 1 : 0);
    if (cache.has(key)) return cache.get(key);
    const K = kit();
    let out = null;
    if (K) {
      const art = ART[kind],
        P = pal == null ? null : ({ leaf: LEAVES, dragonfly: DRAGONFLY, jelly: JELLY }[kind] || FISH)[pal],
        k = K.brush(art.w, art.h);
      if (k.g?.getImageData) {
        art.draw(k, frame, P);
        const D = Math.ceil(Math.hypot(art.w, art.h)) + 2,
          r = K.brush(D, D);
        r.g.imageSmoothingEnabled = false;
        r.g.translate(D / 2, D / 2);
        r.g.rotate((dir / DIRS) * Math.PI * 2);
        if (flip) r.g.scale(1, -1);
        r.g.drawImage(k.cv, -Math.round(art.w / 2), -Math.round(art.h / 2));
        // Rotation sans lissage : pixels francs, puis contour d'encre.
        const img = r.g.getImageData(0, 0, D, D),
          d = img.data;
        for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
        r.g.putImageData(img, 0, 0);
        K.outline(r);
        const tint = TINT[mode];
        if (tint) {
          const im = r.g.getImageData(0, 0, D, D),
            dd = im.data,
            to = K.rgb(tint.to),
            edge = K.rgb(tint.edge);
          for (let i = 0; i < dd.length; i += 4) {
            if (!dd[i + 3]) continue;
            // Encre du contour (#2a1810) : remplacée par l'eau profonde, plus transparente que le corps.
            if (dd[i] === 42 && dd[i + 1] === 24 && dd[i + 2] === 16) {
              for (let q = 0; q < 3; q++) dd[i + q] = edge[q];
              dd[i + 3] = Math.round(255 * tint.alpha * 0.55);
              continue;
            }
            for (let q = 0; q < 3; q++) dd[i + q] = Math.round(dd[i + q] + (to[q] - dd[i + q]) * tint.mix);
            dd[i + 3] = Math.round(255 * tint.alpha);
          }
          r.g.putImageData(im, 0, 0);
        }
        out = K.makeCanvas(D * 2, D * 2);
        const g = out.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(r.cv, 0, 0, D * 2, D * 2);
      }
    }
    cache.set(key, out);
    return out;
  }
  const dirOf = a => ((Math.round((a / (Math.PI * 2)) * DIRS) % DIRS) + DIRS) % DIRS;
  const snap = v => Math.round(v / 2) * 2;
  function put(g, cv, x, y) {
    if (cv) g.drawImage(cv, snap(x - cv.width / 2), snap(y - cv.height / 2));
  }

  // ---------------------------------------------------------------- Effets d'eau (gros pixels)
  // Anneau de remous qui s'élargit.
  function ring(g, x, y, r, alpha, col = '#e0f4ff') {
    g.globalAlpha = alpha;
    g.fillStyle = col;
    const n = Math.max(8, Math.round(r * 1.1));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      g.fillRect(snap(x + Math.cos(a) * r), snap(y + Math.sin(a) * r * 0.42), 2, 2);
    }
    g.globalAlpha = 1;
  }
  function splash(x, y, n = 8, col = '#ffffff') {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI * (0.1 + 0.8 * (k / (n - 1)));
      fx.push({
        kind: 'drop',
        x,
        y,
        vx: Math.cos(a) * (1 + Math.random()),
        vy: Math.sin(a) * (1.6 + Math.random()),
        t: 0,
        col
      });
    }
    fx.push({ kind: 'ring', x, y, t: 0, life: 48, s: 1 });
  }
  function stepFx() {
    for (let i = fx.length - 1; i >= 0; i--) {
      const e = fx[i];
      e.t++;
      if (e.kind === 'drop') {
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.16;
        if (e.t > 22) fx.splice(i, 1);
      } else if (e.kind === 'bubble') {
        e.y -= 0.15;
        if (e.t > e.life) {
          fx.splice(i, 1);
          fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, life: 24, s: 0.5 });
        }
      } else if (e.t > e.life) fx.splice(i, 1);
    }
  }
  function drawFx(g) {
    for (const e of fx) {
      if (!visible(e.x, e.y, 60)) continue;
      if (e.kind === 'drop') {
        g.globalAlpha = 1 - e.t / 22;
        g.fillStyle = e.col;
        g.fillRect(snap(e.x), snap(e.y), 2, 2);
      } else if (e.kind === 'ring') ring(g, e.x, e.y, (5 + e.t * 0.5) * e.s, (1 - e.t / e.life) * 0.6);
      else if (e.kind === 'bubble') {
        g.globalAlpha = 0.75;
        g.fillStyle = e.col || '#d8f0e8';
        g.fillRect(snap(e.x) - 2, snap(e.y), 2, 2);
        g.fillRect(snap(e.x) + 2, snap(e.y), 2, 2);
        g.fillRect(snap(e.x), snap(e.y) - 2, 2, 2);
        g.fillRect(snap(e.x), snap(e.y) + 2, 2, 2);
      } else if (e.kind === 'mote') {
        const a = Math.sin((e.t / e.life) * Math.PI);
        g.globalAlpha = a * 0.9;
        g.fillStyle = e.t % 20 < 10 ? '#ffffff' : '#c8f0ff';
        g.fillRect(snap(e.x), snap(e.y - e.t * 0.25), 2, 2);
        if (a > 0.6) canaanLight(e.x, e.y - e.t * 0.25, 22, '#a8e8ff');
      }
    }
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- Peuplement
  // Combien de chaque créature autour de l'écran, et où elle peut naître.
  const KINDS = {
    school: { n: 10, where: (x, y, w) => (w === 'sea' || w === 'lake' || w === 'glow') && open(x, y, 1, w) },
    tadpoles: { n: 4, where: (x, y, w) => w === 'marsh' && zoneAt(x, y) === 2 },
    pod: { n: 2, where: (x, y, w) => w === 'sea' && open(x, y, 4, w) },
    whale: { n: 1, rare: 0.25, where: (x, y, w) => w === 'sea' && open(x, y, 7, w) },
    turtle: { n: 2, where: (x, y, w) => w === 'sea' && open(x, y, 2, w) },
    jelly: { n: 6, where: (x, y, w) => (w === 'sea' && shore(x, y, 7)) || w === 'glow' },
    manta: { n: 1, rare: 0.3, where: (x, y, w) => w === 'sea' && open(x, y, 4, w) },
    dragonfly: {
      n: 6,
      where: (x, y, w) => (w === 'lake' || w === 'marsh' || w === 'glow') && shore(x, y, 2)
    },
    leaf: { n: 10, where: (x, y, w) => w === 'lake' && zoneAt(x, y) === 3 },
    strider: { n: 5, where: (x, y, w) => w === 'marsh' }
  };
  const LAKE_FISH = ['trout', 'perch', 'catfish', 'carp', 'koi', 'koi'];
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function born(kind, x, y, w) {
    const a = Math.random() * Math.PI * 2,
      c = { kind, x, y, a, w, t: Math.floor(Math.random() * 600) };
    if (kind === 'school' || kind === 'tadpoles') {
      c.pal =
        kind === 'tadpoles'
          ? null
          : w === 'glow'
            ? 'spirit'
            : w === 'sea'
              ? zoneAt(x, y) === 4 && Math.random() < 0.7
                ? 'tropical'
                : 'sardine'
              : LAKE_FISH[zoneAt(x, y)] || 'trout';
      // Petit banc de 4 ou 5 poissons : chaque poisson à bonne distance des autres, dans un ovale étiré dans le sens de la nage.
      const n = kind === 'tadpoles' ? 6 : 4 + Math.floor(Math.random() * 2),
        gap = kind === 'tadpoles' ? 9 : 18;
      c.members = [];
      for (let tries = 0; c.members.length < n && tries < 200; tries++) {
        const back = Math.random() * (kind === 'tadpoles' ? 24 : 42),
          side = (Math.random() - 0.5) * (kind === 'tadpoles' ? 18 : 34);
        if (c.members.some(m => Math.hypot(m.back - back, m.side - side) < gap)) continue;
        c.members.push({ back, side, phase: Math.random() * 6.28, i: c.members.length });
      }
      c.speed = kind === 'tadpoles' ? 0.35 : 0.6 + Math.random() * 0.3;
    } else if (kind === 'pod') {
      c.members = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, i) => ({
        back: i * 34,
        side: (i % 2 ? 1 : -1) * (i ? 22 : 0),
        cycle: 260 + i * 70 + Math.floor(Math.random() * 60),
        i
      }));
      c.speed = 1.3;
    } else if (kind === 'jelly') {
      c.pal = w === 'glow' ? 'glow' : 'sea';
      c.speed = 0.12;
    } else if (kind === 'dragonfly') {
      c.pal = Math.floor(Math.random() * DRAGONFLY.length);
      c.hover = 0;
      c.speed = 0;
    } else if (kind === 'leaf') {
      c.pal = Math.floor(Math.random() * LEAVES.length);
      c.speed = 0.08;
      c.spin = (Math.random() - 0.5) * 0.004;
    } else c.speed = { whale: 0.35, turtle: 0.45, manta: 0.55, strider: 0 }[kind];
    creatures.push(c);
  }
  function spawn() {
    for (const [kind, def] of Object.entries(KINDS)) {
      if (creatures.filter(c => c.kind === kind).length >= def.n) continue;
      if (def.rare && Math.random() > def.rare) continue;
      for (let tries = 0; tries < 10; tries++) {
        const x = camX - 200 + Math.random() * (W + 400),
          y = camY - 200 + Math.random() * (H + 400),
          w = waterAt(x, y);
        if (!w || !def.where(x, y, w)) continue;
        born(kind, x, y, w);
        break;
      }
    }
  }
  // Une créature reste dans son eau (les plus grandes, au large).
  function stays(c, x, y) {
    if (c.kind === 'pod') return open(x, y, 1, 'sea');
    if (c.kind === 'whale') return open(x, y, 3, 'sea');
    if (c.kind === 'manta' || c.kind === 'turtle') return open(x, y, 1, 'sea');
    return waterAt(x, y) === c.w;
  }
  function step(c) {
    c.t++;
    if (c.kind === 'dragonfly') {
      // Vol par bonds : file vers un point au-dessus de l'eau, puis fait du surplace.
      if (!c.to || (c.hover > 0 && --c.hover === 0)) {
        for (let k = 0; k < 6; k++) {
          const tx = c.x + (Math.random() - 0.5) * 180,
            ty = c.y + (Math.random() - 0.5) * 120;
          if (waterAt(tx, ty)) {
            c.to = { x: tx, y: ty };
            break;
          }
        }
        c.hover = 0;
      }
      if (c.to && !c.hover) {
        const dx = c.to.x - c.x,
          dy = c.to.y - c.y,
          d = Math.hypot(dx, dy);
        if (d < 3) c.hover = 30 + Math.floor(Math.random() * 90);
        else {
          c.a = Math.atan2(dy, dx);
          c.x += (dx / d) * Math.min(d, 3.2);
          c.y += (dy / d) * Math.min(d, 3.2);
        }
      }
      return;
    }
    if (c.kind === 'strider') {
      // Gerris : petite glissade, arrêt, remous.
      if (c.t % 70 === 0) {
        c.a = Math.random() * Math.PI * 2;
        c.slide = 18;
        fx.push({ kind: 'ring', x: c.x, y: c.y, t: 0, life: 30, s: 0.45 });
      }
      if (c.slide > 0) {
        c.slide--;
        const nx = c.x + Math.cos(c.a) * 1.6,
          ny = c.y + Math.sin(c.a) * 1.6;
        if (stays(c, nx, ny)) [c.x, c.y] = [nx, ny];
      }
      return;
    }
    // Nage : léger changement de cap, demi-tour devant la rive.
    c.a += Math.sin(c.t * 0.013 + c.x * 0.001) * 0.01 + (c.spin || 0);
    const nx = c.x + Math.cos(c.a) * c.speed,
      ny = c.y + Math.sin(c.a) * c.speed,
      ahead = c.kind === 'whale' ? 90 : c.kind === 'pod' ? 60 : 34;
    if (!stays(c, nx + Math.cos(c.a) * ahead, ny + Math.sin(c.a) * ahead))
      c.a += Math.PI * (0.6 + Math.random() * 0.4);
    else [c.x, c.y] = [nx, ny];
  }
  let clock = 0,
    last = null;
  function update() {
    const ticks = last === null ? 1 : Math.max(0, Math.min(5, time - last));
    last = time;
    if (!ticks) return;
    for (let k = 0; k < ticks; k++) {
      if (++clock % 20 === 0) spawn();
      for (let i = creatures.length - 1; i >= 0; i--) {
        const c = creatures[i];
        if (!visible(c.x, c.y, 650)) {
          creatures.splice(i, 1);
          continue;
        }
        step(c);
      }
      stepFx();
      ambient();
    }
  }
  // Petits événements : un poisson qui saute d'un banc, des bulles au marais, des poussières de lumière.
  function ambient() {
    if (clock % 50 === 0) {
      const schools = creatures.filter(c => c.kind === 'school' && visible(c.x, c.y, 0));
      if (schools.length && Math.random() < 0.45) {
        const s = pick(schools),
          dir = Math.cos(s.a) >= 0 ? 1 : -1;
        fx.push({ kind: 'leap', x: s.x, y: s.y, dir, pal: s.pal, t: 0, life: 34 });
        splash(s.x - dir * 14, s.y, 6);
      }
    }
    if (clock % 12 === 0)
      for (let tries = 0; tries < 3; tries++) {
        const x = camX + Math.random() * W,
          y = camY + Math.random() * H,
          w = waterAt(x, y);
        if (w === 'marsh' || (w === 'lake' && Math.random() < 0.3))
          fx.push({
            kind: 'bubble',
            x,
            y,
            t: 0,
            life: 30 + Math.random() * 30,
            col: w === 'marsh' ? '#c8e0c0' : '#d8f0ff'
          });
        else if (w === 'glow') fx.push({ kind: 'mote', x, y, t: 0, life: 90 + Math.random() * 60 });
        else continue;
        break;
      }
  }

  // ---------------------------------------------------------------- Dessin
  function draw(g) {
    if (game.world.instance || canaanInHouse(P.x / TS, P.y / TS)) return;
    update();
    g.save();
    g.imageSmoothingEnabled = false;
    for (const c of creatures) {
      if (!visible(c.x, c.y, 140)) continue;
      const mode = c.w === 'glow' ? 'glow' : c.w === 'marsh' ? 'marsh' : 'sub';
      if (c.kind === 'school' || c.kind === 'tadpoles') {
        // Le banc nage dans la même direction, chacun ondule un peu à sa façon.
        const ux = Math.cos(c.a),
          uy = Math.sin(c.a);
        for (const m of c.members) {
          const wob = Math.sin(c.t * 0.05 + m.phase),
            x = c.x - ux * m.back - uy * (m.side + wob * 2),
            y = c.y - uy * m.back + ux * (m.side + wob * 2);
          if (!waterAt(x, y)) continue;
          put(
            g,
            sprite(
              c.kind === 'school' ? 'fish' : 'tadpole',
              c.pal,
              Math.floor((c.t + m.i * 5) / 7) % 2,
              dirOf(c.a + wob * 0.12),
              mode
            ),
            x,
            y
          );
          if (c.pal === 'spirit' && m.i % 2 === 0) canaanLight(x, y, 30, '#9af0ff');
        }
      } else if (c.kind === 'pod') {
        const ux = Math.cos(c.a),
          uy = Math.sin(c.a);
        for (const m of c.members) {
          const bx = c.x - ux * m.back - uy * m.side,
            by = c.y - uy * m.back + ux * m.side,
            cyc = (c.t + m.i * 97) % m.cycle,
            jump = cyc > m.cycle - 56;
          if (!jump) {
            put(g, sprite('dolphin', null, Math.floor(c.t / 12) % 2, dirOf(c.a), 'sub'), bx, by);
            continue;
          }
          // Saut : de profil, en arc au-dessus de l'eau, éclaboussures au départ et à l'arrivée.
          const t = (cyc - (m.cycle - 56)) / 56,
            dir = ux >= 0 ? 1 : -1,
            x = bx + dir * (t - 0.5) * 80,
            y = by - Math.sin(t * Math.PI) * 50,
            tilt = -Math.cos(t * Math.PI) * 0.9 * dir;
          if (cyc === m.cycle - 55) splash(bx - dir * 40, by, 8);
          if (cyc === m.cycle - 2) splash(bx + dir * 40, by, 9);
          put(
            g,
            sprite('dolphinSide', null, 0, dirOf(dir > 0 ? tilt : Math.PI + tilt), 'dry', dir < 0),
            x,
            y
          );
        }
      } else if (c.kind === 'whale') {
        // Grande ombre ; elle remonte souffler (dos hors de l'eau), puis plonge en levant la queue.
        const cyc = c.t % 900;
        const surf = cyc > 600 && cyc < 820,
          rise = surf ? Math.sin(Math.min(1, ((cyc - 600) / 220) * 1.4) * Math.PI) : 0;
        put(g, sprite('whale', null, 0, dirOf(c.a), rise > 0.35 ? 'sub' : 'deep'), c.x, c.y);
        if (surf && rise > 0.35) {
          g.globalAlpha = Math.min(1, (rise - 0.35) * 2.5);
          put(g, sprite('whale', null, 0, dirOf(c.a), 'dry'), c.x, c.y);
          g.globalAlpha = 1;
          const t = (cyc - 600) / 220;
          if (t > 0.2 && t < 0.6 && cyc % 2 === 0) {
            const hx = c.x + Math.cos(c.a) * 34,
              hy = c.y + Math.sin(c.a) * 34;
            fx.push({
              kind: 'drop',
              x: hx + (Math.random() - 0.5) * 6,
              y: hy - 6,
              vx: (Math.random() - 0.5) * 1.4,
              vy: -3.6 - Math.random() * 1.6,
              t: 0,
              col: '#ffffff'
            });
          }
          if (cyc % 30 === 0) fx.push({ kind: 'ring', x: c.x, y: c.y, t: 0, life: 48, s: 2.2 });
        } else if (cyc >= 820 && cyc < 880) {
          const t = (cyc - 820) / 60,
            tx = c.x - Math.cos(c.a) * 50,
            ty = c.y - Math.sin(c.a) * 50;
          put(g, sprite('whaleTail', null, 0, 0, 'dry'), tx, ty - Math.sin(t * Math.PI) * 30);
          if (cyc === 878) splash(tx, ty, 12);
        }
      } else if (c.kind === 'turtle')
        put(g, sprite('turtle', null, Math.floor(c.t / 20) % 2, dirOf(c.a), 'sub'), c.x, c.y);
      else if (c.kind === 'manta')
        put(g, sprite('manta', null, Math.floor(c.t / 26) % 2, dirOf(c.a), 'deep'), c.x, c.y);
      else if (c.kind === 'jelly') {
        put(
          g,
          sprite('jelly', c.pal, Math.floor(c.t / 14) % 3, 0, c.pal === 'glow' ? 'glow' : 'jelly'),
          c.x,
          c.y
        );
        if (c.pal === 'glow') canaanLight(c.x, c.y, 46, '#a8e8ff');
      } else if (c.kind === 'dragonfly') {
        // Petite ombre sur l'eau sous la libellule.
        g.globalAlpha = 0.25;
        g.fillStyle = '#0a1a24';
        g.fillRect(snap(c.x - 4), snap(c.y + 18), 8, 2);
        g.globalAlpha = 1;
        put(
          g,
          sprite('dragonfly', c.pal, Math.floor(c.t / 2) % 2, dirOf(c.a), 'dry'),
          c.x,
          c.y + Math.sin(c.t * 0.2) * 2
        );
      } else if (c.kind === 'leaf') put(g, sprite('leaf', c.pal, 0, dirOf(c.a), 'dry'), c.x, c.y);
      else if (c.kind === 'strider') put(g, sprite('strider', null, 0, dirOf(c.a), 'dry'), c.x, c.y);
    }
    // Poissons qui sautent.
    for (const e of fx)
      if (e.kind === 'leap' && visible(e.x, e.y, 60)) {
        const t = e.t / e.life,
          x = e.x + e.dir * (t - 0.5) * 30,
          y = e.y - Math.sin(t * Math.PI) * 22,
          tilt = -Math.cos(t * Math.PI) * 1.0 * e.dir;
        put(
          g,
          sprite('leaper', e.pal || 'trout', 0, dirOf(e.dir > 0 ? tilt : Math.PI + tilt), 'dry', e.dir < 0),
          x,
          y
        );
        if (e.t === e.life - 1) splash(e.x + e.dir * 15, e.y, 6);
      }
    drawFx(g);
    g.restore();
  }

  // Remous d'un banc de pêche (professions.js) : anneaux de gros pixels, bulles, et un poisson de son eau qui saute.
  function spotFx(g, s, i) {
    const pal =
      s.kind === 'sea' ? 'sardine' : s.kind === 'glow' ? 'spirit' : LAKE_FISH[zoneAt(s.x, s.y)] || 'trout';
    g.save();
    g.imageSmoothingEnabled = false;
    for (let k = 0; k < 3; k++) {
      const age = ((time + k * 30 + i * 17) % 90) / 90;
      ring(g, s.x, s.y, 6 + age * 22, (1 - age) * 0.6, s.kind === 'glow' ? '#c8f0ff' : '#e8f6ff');
    }
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.8;
    for (let k = 0; k < 3; k++)
      g.fillRect(snap(s.x - 8 + ((i * 7 + k * 9) % 16)), snap(s.y - 4 - ((time * 0.4 + k * 13) % 10)), 2, 2);
    g.globalAlpha = 1;
    const jump = (time + i * 97) % 300;
    if (jump < 30) {
      const t = jump / 30,
        tilt = -Math.cos(t * Math.PI);
      put(
        g,
        sprite('leaper', pal, 0, dirOf(tilt), 'dry'),
        s.x - 12 + t * 24,
        s.y - Math.sin(t * Math.PI) * 20
      );
    }
    g.restore();
  }
  window.CANAAN_SEA = Object.freeze({ draw, spotFx, creatures: () => creatures, update, waterAt });
})();
