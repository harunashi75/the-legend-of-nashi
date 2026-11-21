// Décors peints de l'écran titre : une scène par race (et une nuit de pleine lune sans héros), en pixel art.
// Le canevas est en basse résolution (environ 360 pixels de haut) et agrandi sans lissage. Les plans fixes (ciel,
// montagnes, forêts, bâtiments) sont dessinés une fois par scène et par taille ; ils glissent un peu avec la souris
// (parallaxe). Par-dessus : étoiles qui scintillent, nuages et brume qui dérivent, et les effets de chaque scène
// (oiseaux, moulin, braises, aurore, lucioles, aigle, neige, chauves-souris, yeux dans la forêt…).
// Sans canevas utilisable, le fond CSS de styles/slot-menu.css reste affiché.
(() => {
  'use strict';
  const title = document.getElementById('title');
  const canvas = document.createElement('canvas');
  if (!title || !canvas || typeof canvas.getContext !== 'function') return;
  canvas.id = 'titleScene';
  canvas.setAttribute('aria-hidden', 'true');
  title.insertBefore(canvas, title.firstChild || null);

  // ---------------------------------------------------------------- Outils
  // Hasard déterministe : une même scène se redessine toujours à l'identique.
  const rng = seed => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = (c, a = 1) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // Tramage ordonné 4 × 4 : les dégradés deviennent des bandes de pixels, comme en pixel art.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.5);
  const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  function layer(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  // Couleur d'un dégradé à plusieurs arrêts ([position, '#hex']…).
  function sample(stops, t) {
    for (let i = 1; i < stops.length; i++)
      if (t <= stops[i][0]) {
        const [p0, c0] = stops[i - 1],
          [p1, c1] = stops[i];
        return mix(c0, c1, clamp((t - p0) / (p1 - p0 || 1)));
      }
    return stops[stops.length - 1][1];
  }
  // Bruit 1D lissé, plusieurs octaves ; ridged : crêtes vives (montagnes) au lieu de bosses (collines).
  function noise(r) {
    const lat = Array.from({ length: 4096 }, r);
    const n = x => {
      const i = Math.floor(x),
        f = x - i,
        u = f * f * (3 - 2 * f);
      return lat[i & 4095] * (1 - u) + lat[(i + 1) & 4095] * u;
    };
    return (x, octaves = 4, ridged = false) => {
      let v = 0,
        a = 1,
        tot = 0,
        fr = 1;
      for (let o = 0; o < octaves; o++) {
        let s = n(x * fr + o * 131.7);
        if (ridged) s = 1 - Math.abs(2 * s - 1);
        v += s * a;
        tot += a;
        a *= 0.5;
        fr *= 2;
      }
      return v / tot;
    };
  }
  // Ligne d'horizon : hauteur (y de la surface) par colonne. bumps : bosses imposées (butte du château, rocher
  // du loup…) : { x, y, slope } garantit un sommet en (x, y) avec des flancs de pente slope.
  function ridge(r, w, { base, amp, scale, octaves = 4, ridged = false, bumps = [] }) {
    const n = noise(r),
      hs = new Float32Array(w);
    for (let x = 0; x < w; x++) hs[x] = base - n(x / scale, octaves, ridged) * amp;
    for (const b of bumps)
      for (let x = 0; x < w; x++) {
        // slopeR : pente du flanc droit, quand elle diffère du gauche (falaise).
        const d = Math.abs(x - b.x),
          k = x > b.x && b.slopeR !== undefined ? b.slopeR : b.slope,
          y = b.y + (b.flat && d < b.flat ? 0 : Math.pow(Math.max(0, d - (b.flat || 0)), b.pow || 1) * k);
        if (y < hs[x]) hs[x] = b.blend ? hs[x] + (y - hs[x]) * b.blend : y;
      }
    return hs;
  }
  // Remplit un plan sous la ligne d'horizon, pixel par pixel : paint(x, y, profondeur, pente, sommet) → couleur ou null.
  function terrain(c, hs, paint) {
    const g = c.getContext('2d'),
      w = c.width,
      h = c.height,
      img = g.createImageData(w, h),
      px = img.data,
      // Sommet le plus haut et le plus bas de l'horizon : la brume se mesure en hauteur absolue.
      span = { min: Math.min(...hs), max: Math.max(...hs) };
    for (let x = 0; x < w; x++) {
      const top = Math.max(0, Math.round(hs[x])),
        // Pente moyenne sur sept colonnes : les faces éclairées forment des pans, pas des rayures.
        slope = (hs[Math.min(w - 1, x + 3)] - hs[Math.max(0, x - 3)]) / 3;
      for (let y = top; y < h; y++) {
        const col = paint(x, y, y - hs[x], slope, hs[x], span);
        if (!col) continue;
        const o = (y * w + x) * 4;
        px[o] = col[0];
        px[o + 1] = col[1];
        px[o + 2] = col[2];
        px[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  // Peinture de montagnes : face éclairée ou à l'ombre selon la pente, neige au-dessus de snowLine, brume en bas.
  function mountainPaint({
    lit,
    shade,
    haze,
    light = 1,
    snow,
    snowShade,
    snowLine = -1,
    fade = 80,
    bands = 5
  }) {
    [lit, shade, haze] = [lit, shade, haze].map(rgb);
    if (snow) [snow, snowShade] = [snow, snowShade || snow].map(rgb);
    return (x, y, d, slope, top, span) => {
      // Face éclairée ou à l'ombre près de la crête, qui se fond dans un ton moyen en descendant.
      const s = slope * light,
        mid = mix(shade, lit, 0.45),
        face = mix(
          s > 0.4 ? lit : s < -0.4 ? shade : mid,
          mid,
          clamp(Math.floor((d / 36) * 3 + dither(x, y) + 0.5) / 3)
        );
      // Neige : une calotte sur les sommets au-dessus de snowLine, plus courte sur les flancs à l'ombre.
      if (
        snow &&
        top < snowLine &&
        d < Math.min(16, (snowLine - top) * 0.45) * (s > 0 ? 1 : 0.6) + dither(x, y) * 3
      )
        return s > 0 ? snow : snowShade;
      // Brume au sol : selon la hauteur absolue (pas la profondeur sous chaque sommet, qui ferait des rayures).
      const t = clamp(
        Math.floor(((y - span.min) / (span.max - span.min + fade)) * bands + dither(x, y) + 0.5) / bands
      );
      return mix(face, haze, t);
    };
  }
  const rect = (g, col, x, y, w, h) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  function disc(g, cx, cy, r) {
    r = Math.max(0, Math.round(r));
    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      g.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1);
    }
  }
  // Sapin : étages en dents de scie, flanc éclairé du côté de la lumière.
  function pine(g, x, y, h, dark, lit, light = 1) {
    rect(g, dark, x, y - 2, 1, 3);
    const tiers = h > 16 ? 4 : 3;
    for (let i = 0; i < h; i++) {
      const t = i / h,
        tier = ((i * tiers) / h) % 1,
        half = Math.round((0.12 + t * 0.88) * h * 0.27 * (0.55 + tier * 0.55)),
        yy = y - 2 - h + i;
      rect(g, dark, x - half, yy, half * 2 + 1, 1);
      if (lit && half > 0) {
        const lw = Math.max(1, Math.round(half * 0.55));
        rect(g, lit, light > 0 ? x + half - lw + 1 : x - half, yy, lw, 1);
      }
    }
  }
  // Arbre feuillu : tronc, couronne de disques, reflets du côté de la lumière.
  function leafy(g, x, y, s, dark, mid, lit, light = 1) {
    rect(g, dark, x, y - s, s > 12 ? 2 : 1, s + 1);
    const blobs = [
      [0, -s, 0.5],
      [-0.4, -s * 0.8, 0.38],
      [0.4, -s * 0.85, 0.4],
      [0, -s * 1.3, 0.36]
    ];
    g.fillStyle = dark;
    for (const [dx, dy, r] of blobs) disc(g, x + dx * s, y + dy, r * s);
    g.fillStyle = mid;
    for (const [dx, dy, r] of blobs) disc(g, x + dx * s + light * s * 0.08, y + dy - s * 0.06, r * s * 0.75);
    g.fillStyle = lit;
    for (const [dx, dy, r] of blobs.slice(0, 3))
      disc(g, x + dx * s + light * s * 0.16, y + dy - s * 0.14, r * s * 0.38);
  }
  // Grand arbre elfique : tronc fin et haut, couronne effilée, feuilles lumineuses.
  function elfTree(g, x, y, h, dark, mid, glow, r) {
    for (let i = 0; i < h * 0.55; i++)
      rect(g, dark, x + Math.round(Math.sin(i * 0.12) * 1.5), y - i, i < 6 ? 3 : 2, 1);
    const top = y - h;
    for (let i = 0; i < h * 0.7; i++) {
      const t = i / (h * 0.7),
        half = Math.round(Math.sin(Math.PI * Math.pow(t, 0.7)) * h * 0.13 + 1);
      rect(g, dark, x - half, top + i, half * 2 + 2, 1);
      if (half > 1) rect(g, mid, x - half + 1, top + i, Math.max(1, half - 1), 1);
    }
    g.fillStyle = glow;
    for (let k = 0; k < h / 4; k++) g.fillRect(x - h * 0.1 + r() * h * 0.22, top + 2 + r() * h * 0.6, 1, 1);
  }
  // Ciel tramé, de haut en bas.
  function sky(c, stops) {
    const g = c.getContext('2d'),
      w = c.width,
      h = c.height,
      img = g.createImageData(w, h),
      px = img.data,
      cols = stops.map(([p, hex]) => [p, rgb(hex)]),
      bands = 22;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const t = clamp(Math.floor((y / h) * bands + dither(x, y) + 0.5) / bands),
          col = sample(cols, t),
          o = (y * w + x) * 4;
        px[o] = col[0];
        px[o + 1] = col[1];
        px[o + 2] = col[2];
        px[o + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  }
  // Halo : anneaux tramés autour d'un astre.
  function halo(g, cx, cy, r0, r1, col, alpha) {
    const c = rgb(col);
    for (let r = r1; r > r0; r -= 2) {
      g.fillStyle = css(c, alpha * Math.pow(1 - (r - r0) / (r1 - r0), 2));
      disc(g, cx, cy, r);
    }
  }
  function moon(g, cx, cy, r, light, dark, glow) {
    halo(g, cx, cy, r, r * 3.2, glow, 0.16);
    g.fillStyle = light;
    disc(g, cx, cy, r);
    // Mers et cratères, un croissant d'ombre en bas à gauche.
    g.fillStyle = dark;
    disc(g, cx - r * 0.3, cy - r * 0.2, r * 0.28);
    disc(g, cx + r * 0.25, cy + r * 0.3, r * 0.2);
    disc(g, cx + r * 0.35, cy - r * 0.35, r * 0.12);
    disc(g, cx - r * 0.1, cy + r * 0.5, r * 0.1);
    g.save();
    g.beginPath();
    g.rect(cx - r - 1, cy - r - 1, r * 2 + 3, r * 2 + 3);
    g.clip();
    g.globalAlpha = 0.18;
    g.fillStyle = '#1a2040';
    disc(g, cx - r * 0.35, cy + r * 0.25, r);
    g.restore();
  }
  function sun(g, cx, cy, r, core, rim, glow, horizon) {
    halo(g, cx, cy, r, r * 4, glow, 0.22);
    g.fillStyle = rim;
    disc(g, cx, cy, r + 1);
    g.fillStyle = core;
    disc(g, cx, cy, r);
    // Bandes du couchant en bas du disque.
    if (horizon)
      for (let k = 0; k < 4; k++)
        rect(g, horizon, cx - r - 1, cy + r * 0.25 + k * r * 0.2, r * 2 + 3, 1 + (k >> 1));
  }
  // Nuage : disques fusionnés, base plate, ombre dessous et lumière dessus.
  function cloud(r, w, h, { base, shade, lit }, light = 1) {
    const c = layer(w, h),
      g = c.getContext('2d'),
      blobs = [];
    for (let i = 0; i < 7; i++)
      blobs.push([w * (0.15 + r() * 0.7), h * (0.55 - r() * 0.25), h * (0.18 + r() * 0.2)]);
    g.fillStyle = shade;
    for (const [x, y, rad] of blobs) disc(g, x, y + 2, rad);
    g.fillStyle = base;
    for (const [x, y, rad] of blobs) disc(g, x, y, rad);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lit;
    for (const [x, y, rad] of blobs) disc(g, x + light * rad * 0.35, y - rad * 0.35, rad * 0.7);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, Math.round(h * 0.78), w, h);
    return c;
  }
  // Bande de brume douce qui dérive (dessinée deux fois pour boucler).
  function fogStrip(r, w, h, col, alpha) {
    const c = layer(w, h),
      g = c.getContext('2d'),
      base = rgb(col);
    for (let i = 0; i < w / 6; i++) {
      const x = r() * w,
        y = h * (0.3 + r() * 0.4),
        rad = h * (0.25 + r() * 0.35),
        grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, css(base, alpha));
      grad.addColorStop(1, css(base, 0));
      g.fillStyle = grad;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      // Bord droit recopié à gauche : la bande boucle sans couture.
      if (x + rad > w) {
        g.save();
        g.translate(-w, 0);
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        g.restore();
      }
    }
    return c;
  }
  // Sprite en caractères (# : silhouette, + : lumière, o : œil).
  function sprite(g, x, y, rows, cols) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (cols[row[i]]) rect(g, cols[row[i]], x + i, y + j, 1, 1);
    });
  }
  const WOLF = [
    '...##...........',
    '..###...........',
    '.####...........',
    '..####..........',
    '...#####........',
    '....#####.......',
    '....######......',
    '.....#######....',
    '.....########...',
    '......#########.',
    '......##########',
    '.....###########',
    '.....####..#####',
    '.....##.....##.#',
    '.....##.....##..'
  ];

  // ---------------------------------------------------------------- Scènes
  // Chaque scène construit ses plans (canevas, profondeur de parallaxe, animation éventuelle) et ses effets.
  // W, H : taille visible ; M : marge de chaque côté pour la parallaxe. Les plans font W + 2M de large.
  const SCENES = {};

  // Effets partagés.
  function starField(r, W, H, count, maxY, cols = ['#ffffff', '#cfe0ff', '#ffe8c0']) {
    return Array.from({ length: count }, () => ({
      x: r() * W,
      y: Math.pow(r(), 1.4) * maxY,
      c: rgb(cols[Math.floor(r() * cols.length)]),
      big: r() < 0.08,
      ph: r() * 6.28,
      sp: 0.8 + r() * 2
    }));
  }
  function drawStars(g, stars, t, ox) {
    for (const s of stars) {
      const a = 0.45 + 0.55 * Math.sin(t * s.sp + s.ph) ** 2,
        x = Math.round(s.x + ox * 0.05);
      rect(g, css(s.c, a), x, s.y, 1, 1);
      if (s.big && a > 0.7) {
        rect(g, css(s.c, a * 0.5), x - 1, s.y, 3, 1);
        rect(g, css(s.c, a * 0.5), x, s.y - 1, 1, 3);
      }
    }
  }
  function clouds(r, W, H, n, yMin, yMax, cols, light, speed) {
    return Array.from({ length: n }, () => {
      const w = 40 + r() * 70,
        h = 14 + r() * 14;
      return {
        c: cloud(r, Math.round(w), Math.round(h), cols, light),
        x: r() * (W + 120) - 60,
        y: yMin + r() * (yMax - yMin),
        v: speed * (0.6 + r() * 0.8)
      };
    });
  }
  function drawClouds(g, list, dt, W, ox, depth = 0.12) {
    for (const k of list) {
      k.x += k.v * dt;
      if (k.x > W + 80) k.x = -k.c.width - 40;
      g.drawImage(k.c, Math.round(k.x + ox * depth), Math.round(k.y));
    }
  }
  function drawFog(g, strip, t, speed, y, W, ox, alpha = 1) {
    const w = strip.width,
      x = Math.round(((((t * speed + ox * 0.9) % w) + w) % w) - w);
    g.globalAlpha = alpha;
    for (let k = x; k < W; k += w) g.drawImage(strip, k, Math.round(y));
    g.globalAlpha = 1;
  }
  // Particules : position, vitesse, durée de vie ; init(p) les place, step(p, dt) les fait évoluer.
  function particles(n, init) {
    const list = Array.from({ length: n }, () => init({}, true));
    return {
      list,
      step(dt, fn) {
        for (const p of list) {
          p.life -= dt;
          if (p.life <= 0) init(p, false);
          fn(p, dt);
        }
      }
    };
  }

  // Plaines de Canaan au couchant : château sur sa butte, moulin, champs, rivière dorée, oiseaux.
  SCENES.humain = (W, H, M) => {
    const r = rng(11),
      LW = W + 2 * M,
      light = -1,
      sunX = W * 0.37 + M,
      sunY = H * 0.5;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#1b2350'],
      [0.32, '#4a3a6e'],
      [0.52, '#b0607a'],
      [0.66, '#e88a5a'],
      [0.76, '#f6c26a']
    ]);
    sun(skyC.getContext('2d'), sunX, sunY, H * 0.07, '#fff2c0', '#ffd27a', '#ffb070', '#f08a5a');
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.62, amp: H * 0.16, scale: 90, ridged: true }),
      mountainPaint({ lit: '#b07a8a', shade: '#6a4a72', haze: '#d8907a', light, fade: H * 0.12 })
    );
    const hillsHs = ridge(r, LW, {
      base: H * 0.7,
      amp: H * 0.07,
      scale: 140,
      octaves: 3,
      bumps: [
        { x: W * 0.64 + M, y: H * 0.6, slope: 0.012, pow: 2, flat: 18 },
        { x: W * 0.35 + M, y: H * 0.66, slope: 0.01, pow: 2, flat: 6 }
      ]
    });
    const hills = layer(LW, H);
    terrain(hills, hillsHs, (x, y, d, slope) => {
      const lit = slope * light > 0.2,
        stripe = Math.floor((y + Math.sin(x * 0.05) * 4) / 3) % 4 === 0;
      const base = lit ? [86, 106, 58] : [54, 74, 44];
      return mix(stripe ? mix(base, [140, 120, 60], 0.35) : base, [40, 34, 46], clamp(d / (H * 0.3)));
    });
    // Château : murailles, donjon, tours aux toits coniques, fenêtres éclairées, bannières.
    const gh = hills.getContext('2d'),
      cx = Math.round(W * 0.64 + M),
      gy = Math.round(H * 0.6) + 1,
      stone = '#3a3446',
      stoneLit = '#7a5a6a',
      roof = '#5a2a3a',
      win = '#ffd27a';
    const block = (x, y, w, h) => {
      rect(gh, stone, cx + x, gy + y, w, h);
      rect(gh, stoneLit, cx + x, gy + y, 1, h);
      for (let i = 0; i < w; i += 3) rect(gh, stone, cx + x + i, gy + y - 2, 2, 2);
    };
    const cone = (x, y, w, h) => {
      for (let k = 0; k < h; k++) {
        const ww = Math.max(1, Math.round((k / h) * (w + 2)));
        rect(gh, roof, cx + x + Math.round((w - ww) / 2), gy + y - h + k, ww, 1);
        rect(gh, '#8a4a5a', cx + x + Math.round((w - ww) / 2), gy + y - h + k, 1, 1);
      }
      rect(gh, stone, cx + x + Math.round(w / 2), gy + y - h - 5, 1, 5);
      rect(gh, '#c84a4a', cx + x + Math.round(w / 2) + 1, gy + y - h - 5, 3, 2);
    };
    block(-26, -12, 52, 12);
    block(-8, -32, 16, 20);
    block(-30, -22, 7, 22);
    block(23, -22, 7, 22);
    block(-3, -42, 6, 10);
    cone(-31, -22, 9, 10);
    cone(22, -22, 9, 10);
    cone(-4, -42, 8, 9);
    for (const [x, y] of [
      [-5, -26],
      [2, -26],
      [-2, -38],
      [-28, -16],
      [25, -16],
      [-16, -8],
      [12, -8]
    ])
      rect(gh, win, cx + x, gy + y, 1, 2);
    rect(gh, '#1a1620', cx - 3, gy - 6, 6, 6);
    // Moulin (ailes animées) sur la petite butte.
    const mx = Math.round(W * 0.35 + M),
      my = Math.round(H * 0.66);
    for (let k = 0; k < 16; k++) {
      const half = Math.round(3 + k * 0.2);
      rect(gh, k < 2 ? '#5a3a3a' : '#4a3c4a', mx - half, my - 16 + k, half * 2 + 1, 1);
      rect(gh, '#8a6a6a', mx - half, my - 16 + k, 1, 1);
    }
    rect(gh, win, mx, my - 8, 1, 2);
    // Arbres le long des collines.
    for (let x = 4; x < LW - 4; x += 6 + Math.floor(r() * 12)) {
      if (Math.abs(x - cx) < 40 || Math.abs(x - mx) < 10) continue;
      leafy(
        gh,
        x,
        Math.round(hillsHs[x]) + 2,
        5 + Math.floor(r() * 4),
        '#2a3a2a',
        '#3e5a34',
        '#7a8a4a',
        light
      );
    }
    // Premier plan : prairie sombre aux fleurs des champs, grands arbres sur les côtés.
    const near = layer(LW, H),
      nearHs = ridge(r, LW, { base: H * 0.84, amp: H * 0.05, scale: 60, octaves: 3 });
    terrain(near, nearHs, (x, y, d) => {
      return mix([42, 54, 36], [14, 14, 20], clamp(Math.floor((d / 40) * 4 + dither(x, y)) / 4));
    });
    const gn = near.getContext('2d');
    for (let x = 0; x < LW; x += 2 + Math.floor(r() * 3)) {
      const y = Math.round(nearHs[x]);
      rect(gn, '#3e5030', x, y - 1 - Math.floor(r() * 3), 1, 3);
      if (r() < 0.12)
        rect(
          gn,
          ['#e8c060', '#d86a7a', '#f0e0d0'][Math.floor(r() * 3)],
          x,
          y + 2 + Math.floor(r() * 10),
          1,
          1
        );
    }
    for (const x of [M + W * 0.06, M + W * 0.14, M + W * 0.86, M + W * 0.95])
      leafy(
        gn,
        Math.round(x),
        Math.round(H * 0.9),
        26 + Math.floor(r() * 8),
        '#141a14',
        '#202a1c',
        '#3a4a2a',
        light
      );
    const birds = Array.from({ length: 6 }, (_, i) => ({
      x: W * 0.2 + i * 9 + r() * 6,
      y: H * 0.28 + (i % 3) * 5 + r() * 4,
      ph: r() * 6
    }));
    const pollen = particles(40, p =>
      Object.assign(p, {
        x: r() * W,
        y: H * (0.55 + r() * 0.45),
        vx: 2 + r() * 4,
        vy: -1 - r() * 2,
        life: 4 + r() * 6,
        ph: r() * 6
      })
    );
    const cl = clouds(
      r,
      W,
      H,
      6,
      H * 0.08,
      H * 0.38,
      { base: '#c87a8a', shade: '#7a4a6e', lit: '#ffd0a0' },
      light,
      2
    );
    return {
      layers: [
        { c: skyC, depth: 0.02 },
        { c: far, depth: 0.15 },
        {
          c: hills,
          depth: 0.4,
          anim(g, t, x0) {
            const a = t * 0.8,
              hx = mx + x0,
              hy = my - 15;
            for (let k = 0; k < 4; k++) {
              const ang = a + (k * Math.PI) / 2,
                ca = Math.cos(ang),
                sa = Math.sin(ang);
              for (let s = 1; s < 11; s++) {
                rect(g, '#2a2030', hx + ca * s, hy + sa * s, 1, 1);
                if (s > 3) rect(g, '#d8c0a0', hx + ca * s - sa * 1.5, hy + sa * s + ca * 1.5, 1, 1);
              }
            }
            rect(g, '#2a2030', hx - 1, hy - 1, 3, 3);
          }
        },
        { c: near, depth: 0.85 }
      ],
      fx(g, t, dt, ox) {
        drawClouds(g, cl, dt, W, ox);
        for (const b of birds) {
          b.x += dt * 6;
          if (b.x > W + 20) b.x = -20;
          const up = Math.sin(t * 6 + b.ph) > 0,
            x = Math.round(b.x + ox * 0.2),
            y = Math.round(b.y + Math.sin(t + b.ph) * 2);
          rect(g, '#2a1a2a', x, y, 1, 1);
          rect(g, '#2a1a2a', x - 2, y + (up ? -1 : 1), 2, 1);
          rect(g, '#2a1a2a', x + 1, y + (up ? -1 : 1), 2, 1);
        }
        pollen.step(dt, p => {
          p.x += p.vx * dt;
          p.y += (p.vy + Math.sin(t * 2 + p.ph) * 2) * dt;
          rect(g, css([255, 220, 150], clamp(p.life / 2) * 0.8), p.x + ox * 0.9, p.y, 1, 1);
        });
      }
    };
  };

  // Terres arides : soleil rouge, mesas striées, forteresse de pieux et tour de guet, bannières, braises.
  SCENES.orc = (W, H, M) => {
    const r = rng(23),
      LW = W + 2 * M,
      light = 1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#2a0c10'],
      [0.35, '#6a1e18'],
      [0.58, '#b8421e'],
      [0.74, '#ec8a34'],
      [0.82, '#f8c060']
    ]);
    sun(skyC.getContext('2d'), W * 0.62 + M, H * 0.5, H * 0.11, '#ffd890', '#ff9a4a', '#ff7a3a', '#e8602a');
    const mesa = (base, top, thr, scale, wall) => {
      const n = noise(r),
        hs = new Float32Array(LW);
      for (let x = 0; x < LW; x++)
        hs[x] = n(x / scale, 3) > thr ? top + n(x / 7, 2) * 3 : base + n(x / 20, 2) * 8;
      for (let x = 1; x < LW; x++) hs[x] = Math.max(hs[x], hs[x - 1] - wall);
      for (let x = LW - 2; x >= 0; x--) hs[x] = Math.max(hs[x], hs[x + 1] - wall);
      return hs;
    };
    const strata = (lit, shade, haze, fade) => {
      [lit, shade, haze] = [lit, shade, haze].map(rgb);
      const n = noise(r);
      return (x, y, d, slope) => {
        const face = slope * light > 1 ? lit : slope * light < -1 ? shade : mix(lit, shade, 0.45),
          band = Math.floor((y + n(x / 30) * 6) / 5) % 4,
          c = band === 0 ? mix(face, [255, 200, 140], 0.15) : band === 2 ? mix(face, [0, 0, 0], 0.18) : face;
        return mix(c, haze, clamp(Math.floor((d / fade) * 4 + dither(x, y) + 0.5) / 4));
      };
    };
    const far = layer(LW, H);
    terrain(far, mesa(H * 0.66, H * 0.48, 0.55, 70, 6), strata('#b0563a', '#7a3424', '#d8784a', H * 0.18));
    const mid = layer(LW, H),
      midHs = mesa(H * 0.74, H * 0.56, 0.6, 50, 8);
    // Butte de la forteresse.
    const fx0 = Math.round(W * 0.36 + M);
    for (let x = fx0 - 34; x < fx0 + 34; x++)
      midHs[x] = Math.min(midHs[x], H * 0.64 + Math.max(0, Math.abs(x - fx0) - 22) * 1.5);
    terrain(mid, midHs, strata('#7a3424', '#4a1e18', '#a04a30', H * 0.2));
    const gm = mid.getContext('2d'),
      fy = Math.round(H * 0.64);
    // Palissade de pieux, tour de guet, cornes, bannières.
    for (let x = -24; x <= 24; x += 2) {
      const h = 9 + ((x * 7) & 3);
      rect(gm, '#2a120c', fx0 + x, fy - h, 2, h);
      rect(gm, '#2a120c', fx0 + x, fy - h - 1, 1, 1);
      rect(gm, '#6a3020', fx0 + x + 1, fy - h + 1, 1, h - 2);
    }
    rect(gm, '#2a120c', fx0 - 4, fy - 30, 9, 21);
    rect(gm, '#5a2a1c', fx0 - 3, fy - 29, 1, 19);
    rect(gm, '#2a120c', fx0 - 7, fy - 33, 15, 3);
    for (const s of [-1, 1])
      for (let k = 0; k < 5; k++) rect(gm, '#e8d8b0', fx0 + s * (8 + k), fy - 34 - k + (k > 3 ? 1 : 0), 1, 1);
    rect(gm, '#ffb04a', fx0 - 1, fy - 24, 3, 3);
    const banners = [fx0 - 20, fx0 + 18];
    for (const bx of banners) rect(gm, '#1e0c08', bx, fy - 24, 1, 15);
    // Flèches de roche au premier plan, os blanchis.
    const near = layer(LW, H),
      nearHs = ridge(r, LW, {
        base: H * 0.86,
        amp: H * 0.06,
        scale: 40,
        bumps: [
          { x: M + W * 0.08, y: H * 0.5, slope: 0.06, pow: 1.6 },
          { x: M + W * 0.93, y: H * 0.46, slope: 0.05, pow: 1.6 }
        ]
      });
    terrain(near, nearHs, (x, y, d, slope) =>
      mix(
        slope > 0.5 ? [70, 30, 20] : [40, 16, 12],
        [14, 6, 6],
        clamp(Math.floor((d / 50) * 4 + dither(x, y)) / 4)
      )
    );
    const gn = near.getContext('2d');
    for (let x = 0; x < LW; x += 9 + Math.floor(r() * 20)) {
      const y = Math.round(nearHs[x]);
      for (let k = 0; k < 4; k++) rect(gn, '#2a1410', x + (k % 2 ? 1 : -1) * k, y - 2 - k, 1, 3);
    }
    const embers = particles(70, p =>
      Object.assign(p, {
        x: r() * W,
        y: H * (0.7 + r() * 0.35),
        vy: -6 - r() * 10,
        ph: r() * 6,
        life: 3 + r() * 5,
        hot: r() < 0.3
      })
    );
    const dust = fogStrip(r, LW, Math.round(H * 0.14), '#e88a4a', 0.12);
    return {
      layers: [
        { c: skyC, depth: 0.02 },
        { c: far, depth: 0.15 },
        {
          c: mid,
          depth: 0.4,
          anim(g, t, x0) {
            // Bannières qui claquent et feu de la tour.
            for (const bx of banners)
              for (let i = 0; i < 6; i++) {
                const wave = Math.round(Math.sin(t * 5 + i * 0.9 + bx) * 1);
                rect(
                  g,
                  i % 3 === 2 ? '#e8c060' : '#a01e14',
                  bx + x0 + 1 + i,
                  fy - 24 + wave,
                  1,
                  6 - (i >> 1)
                );
              }
            const f = 0.6 + 0.4 * Math.sin(t * 13) * Math.sin(t * 7.3);
            rect(g, css([255, 200, 90], f), fx0 + x0 - 1, fy - 37, 3, 3);
            rect(g, css([255, 120, 40], f * 0.6), fx0 + x0 - 2, fy - 39, 5, 2);
          }
        },
        { c: near, depth: 0.85 }
      ],
      fx(g, t, dt, ox) {
        drawFog(g, dust, t, 6, H * 0.6, W, ox * 0.5);
        embers.step(dt, p => {
          p.y += p.vy * dt;
          p.x += Math.sin(t * 2 + p.ph) * 6 * dt;
          const a = clamp(p.life / 2);
          rect(g, p.hot ? css([255, 230, 140], a) : css([255, 120, 50], a * 0.8), p.x + ox * 0.9, p.y, 1, 1);
        });
      }
    };
  };

  // Forêt d'étoiles : aurore mouvante, montagnes bleues, tour elfique, grands arbres lumineux, lac, lucioles.
  SCENES.elfe = (W, H, M) => {
    const r = rng(37),
      LW = W + 2 * M,
      light = 1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#05061c'],
      [0.4, '#121e4e'],
      [0.7, '#1a3a5e'],
      [0.85, '#1e5a62']
    ]);
    const stars = starField(r, W, H, 160, H * 0.6, ['#ffffff', '#d8f0ff', '#f0d8ff']);
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.6, amp: H * 0.2, scale: 80, ridged: true }),
      mountainPaint({
        lit: '#4a6a9a',
        shade: '#2a3a6a',
        haze: '#2a5a6a',
        light,
        snow: '#c8e0ff',
        snowShade: '#7a9ac8',
        snowLine: H * 0.47,
        fade: H * 0.14
      })
    );
    // Tour elfique : fût blanc effilé, balcons, pointe lumineuse.
    const gf = far.getContext('2d'),
      tx = Math.round(W * 0.63 + M),
      ty = Math.round(H * 0.6);
    for (let k = 0; k < 70; k++) {
      const half = Math.round(1 + (k / 70) * 4);
      rect(gf, '#b8c8e8', tx - half, ty - 70 + k, half * 2 + 1, 1);
      rect(gf, '#6a7ab0', tx + half, ty - 70 + k, 1, 1);
    }
    for (const k of [20, 38, 54]) rect(gf, '#8a9ad0', tx - 5, ty - 70 + k, 11, 1);
    for (const k of [14, 30, 46]) rect(gf, '#aef8ff', tx, ty - 70 + k, 1, 2);
    const mid = layer(LW, H),
      midHs = ridge(r, LW, { base: H * 0.72, amp: H * 0.05, scale: 60, octaves: 3 });
    terrain(mid, midHs, (x, y, d) =>
      mix([20, 50, 60], [6, 14, 22], clamp(Math.floor((d / 40) * 4 + dither(x, y)) / 4))
    );
    const gm = mid.getContext('2d');
    for (let x = 2; x < LW; x += 7 + Math.floor(r() * 9))
      elfTree(gm, x, Math.round(midHs[x]) + 2, 28 + Math.floor(r() * 26), '#0c2228', '#1a4048', '#8affe0', r);
    // Lac : reflets des étoiles et de la tour.
    const lake = layer(LW, H),
      gl = lake.getContext('2d'),
      ly = Math.round(H * 0.8);
    for (let y = ly; y < H; y++) {
      const t = (y - ly) / (H - ly);
      rect(gl, css(mix([20, 60, 90], [4, 10, 20], t)), 0, y, LW, 1);
      for (let x = 0; x < LW; x += 1)
        if (r() < 0.012) rect(gl, css([170, 240, 255], 0.5 * (1 - t)), x, y, 2 + Math.floor(r() * 4), 1);
    }
    for (let k = 0; k < 24; k += 2)
      rect(gl, css([200, 230, 255], 0.35 - k * 0.012), tx - 1 + ((k * 3) % 3), ly + k, 3, 1);
    const near = layer(LW, H),
      nearHs = ridge(r, LW, { base: H * 0.93, amp: H * 0.04, scale: 30, octaves: 3 });
    terrain(near, nearHs, () => [4, 10, 14]);
    const gn = near.getContext('2d');
    for (const x of [M + W * 0.04, M + W * 0.12, M + W * 0.89, M + W * 0.97])
      elfTree(
        gn,
        Math.round(x),
        Math.round(H * 0.97),
        90 + Math.floor(r() * 30),
        '#040c10',
        '#0c1e24',
        '#6affd0',
        r
      );
    // Fougères et champignons lumineux.
    for (let x = 0; x < LW; x += 3 + Math.floor(r() * 6)) {
      const y = Math.round(nearHs[x]);
      for (let k = 0; k < 4; k++)
        (rect(gn, '#0a1a1e', x - k, y - k, 1, 1), rect(gn, '#0a1a1e', x + k, y - k, 1, 1));
      if (r() < 0.25) (rect(gn, '#7af0ff', x + 2, y - 2, 2, 1), rect(gn, '#2a6a7a', x + 2, y - 1, 1, 2));
    }
    const strip = layer(1, 40),
      gs = strip.getContext('2d'),
      grad = gs.createLinearGradient(0, 0, 0, 40);
    grad.addColorStop(0, 'rgba(180,120,255,0)');
    grad.addColorStop(0.35, 'rgba(160,140,255,0.55)');
    grad.addColorStop(0.7, 'rgba(90,255,190,0.8)');
    grad.addColorStop(1, 'rgba(90,255,190,0)');
    gs.fillStyle = grad;
    gs.fillRect(0, 0, 1, 40);
    const flies = particles(46, p =>
      Object.assign(p, {
        x: r() * W,
        y: H * (0.62 + r() * 0.36),
        ph: r() * 6,
        sp: 0.5 + r(),
        life: 6 + r() * 8,
        hue: r() < 0.5
      })
    );
    let shoot = null;
    return {
      layers: [
        {
          c: skyC,
          depth: 0.02,
          anim(g, t, x0) {
            drawStars(g, stars, t, x0);
            // Aurore : rubans qui ondulent.
            for (let x = 0; x < W; x += 2) {
              const y = H * 0.12 + Math.sin(x * 0.012 + t * 0.25) * 14 + Math.sin(x * 0.037 - t * 0.4) * 6,
                h = 34 + Math.sin(x * 0.02 + t * 0.3) * 12,
                a = 0.25 + 0.25 * Math.sin(x * 0.008 + t * 0.2);
              g.globalAlpha = clamp(a);
              g.drawImage(strip, x, Math.round(y), 2, Math.round(h));
            }
            g.globalAlpha = 1;
            // Étoile filante de temps en temps.
            if (!shoot && Math.random() < 0.004)
              shoot = { x: Math.random() * W, y: Math.random() * H * 0.3, life: 0.8 };
            if (shoot) {
              for (let k = 0; k < 10; k++)
                rect(
                  g,
                  css([255, 255, 255], (shoot.life / 0.8) * (1 - k / 10)),
                  shoot.x - k * 2,
                  shoot.y - k,
                  2,
                  1
                );
              shoot.x += 4;
              shoot.y += 2;
              shoot.life -= 1 / 30;
              if (shoot.life <= 0) shoot = null;
            }
          }
        },
        { c: far, depth: 0.15 },
        {
          c: mid,
          depth: 0.4,
          anim(g, t, x0) {
            const a = 0.6 + 0.4 * Math.sin(t * 2);
            halo(g, tx + x0, ty - 72, 1, 8, '#aef8ff', 0.5 * a);
            rect(g, '#ffffff', tx + x0, ty - 72, 1, 1);
          }
        },
        { c: lake, depth: 0.5 },
        { c: near, depth: 0.85 }
      ],
      fx(g, t, dt, ox) {
        flies.step(dt, p => {
          p.x += Math.sin(t * p.sp + p.ph) * 8 * dt;
          p.y += Math.cos(t * p.sp * 0.8 + p.ph) * 5 * dt;
          const a = clamp(Math.sin(t * 2 * p.sp + p.ph) * 0.5 + 0.5) * clamp(p.life / 2),
            c = p.hue ? [160, 255, 200] : [220, 255, 140],
            x = p.x + ox * 0.9;
          rect(g, css(c, a * 0.35), x - 1, p.y - 1, 3, 3);
          rect(g, css(c, a), x, p.y, 1, 1);
        });
      }
    };
  };

  // Hauts plateaux à l'aube : sommets enneigés, mer de nuages, cercle de pierres levées, aigle, flocons.
  SCENES.minotaure = (W, H, M) => {
    const r = rng(41),
      LW = W + 2 * M,
      light = -1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#1e2040'],
      [0.35, '#4e4478'],
      [0.6, '#b08098'],
      [0.75, '#eab8a0'],
      [0.85, '#f8dcb0']
    ]);
    sun(skyC.getContext('2d'), W * 0.38 + M, H * 0.6, H * 0.06, '#fff8e0', '#ffe0a0', '#ffd0a0');
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.58, amp: H * 0.36, scale: 70, ridged: true }),
      mountainPaint({
        lit: '#c89aa8',
        shade: '#5a4a78',
        haze: '#e8b8b0',
        light,
        snow: '#fff4f0',
        snowShade: '#a8a0d0',
        snowLine: H * 0.4,
        fade: H * 0.2
      })
    );
    const seaClouds = fogStrip(r, LW, Math.round(H * 0.12), '#fbe0d8', 0.35);
    const mid = layer(LW, H),
      cx = Math.round(W * 0.63 + M),
      midHs = ridge(r, LW, {
        base: H * 0.76,
        amp: H * 0.12,
        scale: 60,
        ridged: true,
        bumps: [{ x: cx, y: H * 0.66, slope: 0.4, flat: 30, blend: 1 }]
      });
    terrain(
      mid,
      midHs,
      mountainPaint({
        lit: '#8a6a7a',
        shade: '#3a2e4a',
        haze: '#5a4a6a',
        light,
        snow: '#e8e0f0',
        snowShade: '#9890b8',
        snowLine: H * 0.62,
        fade: H * 0.2
      })
    );
    // Cercle de pierres levées et trilithe sur le plateau.
    const gm = mid.getContext('2d'),
      py = Math.round(H * 0.66);
    const stoneAt = (x, h, w = 4) => {
      rect(gm, '#2e2638', cx + x, py - h, w, h);
      rect(gm, '#2e2638', cx + x + 1, py - h - 1, w - 2, 1);
      rect(gm, '#9a7a8a', cx + x, py - h, 1, h);
    };
    for (const [x, h] of [
      [-26, 9],
      [-18, 12],
      [14, 12],
      [22, 9]
    ])
      stoneAt(x, h);
    stoneAt(-7, 18, 4);
    stoneAt(4, 18, 4);
    rect(gm, '#2e2638', cx - 9, py - 21, 19, 3);
    rect(gm, '#9a7a8a', cx - 9, py - 21, 19, 1);
    const near = layer(LW, H),
      nearHs = ridge(r, LW, {
        base: H * 0.88,
        amp: H * 0.07,
        scale: 50,
        octaves: 3,
        bumps: [{ x: M + W * 0.05, y: H * 0.62, slope: 0.15, pow: 1.4 }]
      });
    terrain(near, nearHs, (x, y, d, slope) =>
      mix(
        slope * light > 0.3 ? [60, 46, 60] : [34, 26, 40],
        [12, 10, 16],
        clamp(Math.floor((d / 40) * 4 + dither(x, y)) / 4)
      )
    );
    const gn = near.getContext('2d');
    for (let x = 0; x < LW; x += 2 + Math.floor(r() * 4)) {
      const y = Math.round(nearHs[x]);
      rect(gn, '#4a3a4a', x, y - 2, 1, 2);
      if (r() < 0.3) rect(gn, '#6a5a5a', x + 1, y - 3, 1, 3);
    }
    const snow = particles(90, p =>
      Object.assign(p, {
        x: r() * W,
        y: r() * H,
        vx: -10 - r() * 10,
        vy: 8 + r() * 10,
        ph: r() * 6,
        life: 6 + r() * 6
      })
    );
    const cl = clouds(
      r,
      W,
      H,
      5,
      H * 0.06,
      H * 0.3,
      { base: '#e8b0b8', shade: '#8a6a98', lit: '#fff0d8' },
      light,
      3
    );
    return {
      layers: [
        { c: skyC, depth: 0.02 },
        { c: far, depth: 0.12 },
        {
          c: layer(1, 1),
          depth: 0.25,
          anim(g, t, x0) {
            drawFog(g, seaClouds, t, 4, H * 0.6, W, x0);
          }
        },
        { c: mid, depth: 0.4 },
        { c: near, depth: 0.85 }
      ],
      fx(g, t, dt, ox) {
        drawClouds(g, cl, dt, W, ox);
        // Aigle qui plane en grands cercles.
        const ex = W * 0.5 + Math.cos(t * 0.15) * W * 0.18 + ox * 0.3,
          ey = H * 0.24 + Math.sin(t * 0.15) * H * 0.05,
          flap = Math.sin(t * 3) > 0.7 ? -1 : 0;
        rect(g, '#2a1e2e', ex - 1, ey, 3, 1);
        for (let k = 1; k < 5; k++) {
          rect(g, '#2a1e2e', ex - 1 - k, ey - (k > 2 ? 1 + flap : flap), 1, 1);
          rect(g, '#2a1e2e', ex + 1 + k, ey - (k > 2 ? 1 + flap : flap), 1, 1);
        }
        snow.step(dt, p => {
          p.x += (p.vx + Math.sin(t + p.ph) * 4) * dt;
          p.y += p.vy * dt;
          if (p.x < -2) p.x += W;
          if (p.y > H) p.y -= H;
          rect(g, css([255, 250, 255], 0.7 * clamp(p.life / 2)), p.x + ox * 0.9, p.y, 1, 1);
        });
      }
    };
  };

  // Forêt sous la pleine lune : nuages qui passent, manoir en ruine, loup qui hurle sur son rocher, brume,
  // yeux qui brillent dans les sapins, chauves-souris.
  SCENES.vargar = (W, H, M) => scene_night(W, H, M, true);
  // Nuit de pleine lune sur les montagnes : sans héros choisi.
  SCENES.nuit = (W, H, M) => scene_night(W, H, M, false);
  function scene_night(W, H, M, wild) {
    const r = rng(wild ? 53 : 61),
      LW = W + 2 * M,
      light = -1,
      mx = W * (wild ? 0.37 : 0.62) + M,
      my = H * 0.25,
      mr = H * (wild ? 0.085 : 0.06);
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#03050c'],
      [0.45, '#0c1630'],
      [0.75, '#1a2440'],
      [0.9, '#26283c']
    ]);
    moon(skyC.getContext('2d'), mx, my, mr, '#eef0ff', '#c8cce8', '#9ab0f0');
    const stars = starField(r, W, H, 110, H * 0.55);
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.6, amp: H * 0.22, scale: 75, ridged: true }),
      mountainPaint({
        lit: '#4a5a8a',
        shade: '#1e2848',
        haze: '#1a2440',
        light,
        snow: '#c8d4f8',
        snowShade: '#5a6a9a',
        snowLine: H * 0.46,
        fade: H * 0.14
      })
    );
    const mid = layer(LW, H),
      wx = Math.round(mx),
      midHs = ridge(r, LW, {
        base: H * 0.72,
        amp: H * 0.06,
        scale: 50,
        bumps: wild
          ? [
              { x: wx, y: my + mr * 0.85, slope: 0.32, slopeR: 3, flat: 2 },
              { x: W * 0.64 + M, y: H * 0.6, slope: 0.02, pow: 2, flat: 14 }
            ]
          : []
      });
    terrain(mid, midHs, (x, y, d, slope) =>
      mix(
        slope * light > 0.3 ? [40, 52, 84] : [20, 26, 46],
        [8, 10, 20],
        clamp(Math.floor((d / 50) * 4 + dither(x, y)) / 4)
      )
    );
    const gm = mid.getContext('2d');
    for (let x = 1; x < LW; x += 3 + Math.floor(r() * 4)) {
      if (wild && Math.abs(x - wx) < 12) continue;
      if (wild && Math.abs(x - (W * 0.64 + M)) < 26) continue;
      pine(gm, x, Math.round(midHs[x]) + 3, 12 + Math.floor(r() * 14), '#0e1426', '#2a3a62', light);
    }
    const eyes = [];
    if (wild) {
      // Loup qui hurle sur la pointe du rocher, devant la lune.
      sprite(gm, wx - 6, Math.round(my + mr * 0.85) - WOLF.length + 1, WOLF, { '#': '#05070e' });
      // Manoir en ruine : pignons, flèche, fenêtres éclairées.
      const hx = Math.round(W * 0.64 + M),
        hy = Math.round(H * 0.6);
      rect(gm, '#0a0e1a', hx - 18, hy - 14, 36, 14);
      for (let k = 0; k < 8; k++) rect(gm, '#0a0e1a', hx - 18 + k, hy - 22 + k, 16 - k * 2, 1);
      for (let k = 0; k < 8; k++) rect(gm, '#0a0e1a', hx + 2 + k, hy - 22 + k, 16 - k * 2, 1);
      rect(gm, '#0a0e1a', hx - 2, hy - 30, 5, 16);
      for (let k = 0; k < 12; k++)
        rect(
          gm,
          '#0a0e1a',
          hx + 1 - Math.floor((12 - k) / 5),
          hy - 42 + k,
          1 + Math.floor((12 - k) / 5) * 2 - (k < 2 ? 1 : 0),
          1
        );
      rect(gm, '#2a3460', hx - 18, hy - 14, 1, 14);
      for (let k = 0; k < 16; k += 4) rect(gm, '#0a0e1a', hx + 18, hy - 10 + k / 2, 2, 10 - k / 2);
      for (let k = 0; k < 10; k++) {
        const x = Math.floor(r() * LW),
          y = Math.round(midHs[x]) - 2 - Math.floor(r() * 6);
        if (Math.abs(x - wx) > 14 && Math.abs(x - hx) > 30) eyes.push({ x, y, ph: r() * 20 });
      }
    }
    const near = layer(LW, H),
      nearHs = ridge(r, LW, { base: H * 0.86, amp: H * 0.06, scale: 40 });
    terrain(near, nearHs, () => [4, 6, 12]);
    const gn = near.getContext('2d');
    for (let x = 0; x < LW; x += 4 + Math.floor(r() * 5))
      pine(gn, x, Math.round(nearHs[x]) + 4, 20 + Math.floor(r() * 26), '#04060c', '#141c34', light);
    for (const x of [M + W * 0.05, M + W * 0.95])
      pine(gn, Math.round(x), H + 6, 110, '#020306', '#0c1222', light);
    const fog1 = fogStrip(r, LW, Math.round(H * 0.16), '#8a9ad0', 0.16),
      fog2 = fogStrip(r, LW, Math.round(H * 0.12), '#a8b8e8', 0.12);
    const cl = clouds(
      r,
      W,
      H,
      5,
      H * 0.08,
      H * 0.36,
      { base: '#2a3458', shade: '#141a34', lit: '#8a9ad0' },
      1,
      3
    );
    const bats = Array.from({ length: wild ? 4 : 0 }, () => ({
      x: r() * W,
      y: H * (0.15 + r() * 0.25),
      ph: r() * 6,
      v: 10 + r() * 8
    }));
    let shoot = null;
    return {
      layers: [
        {
          c: skyC,
          depth: 0.02,
          anim(g, t, x0) {
            drawStars(g, stars, t, x0);
            if (!wild && !shoot && Math.random() < 0.003)
              shoot = { x: Math.random() * W, y: Math.random() * H * 0.3, life: 0.8 };
            if (shoot) {
              for (let k = 0; k < 10; k++)
                rect(
                  g,
                  css([255, 255, 255], (shoot.life / 0.8) * (1 - k / 10)),
                  shoot.x - k * 2,
                  shoot.y - k,
                  2,
                  1
                );
              shoot.x += 4;
              shoot.y += 2;
              shoot.life -= 1 / 30;
              if (shoot.life <= 0) shoot = null;
            }
          }
        },
        {
          c: layer(1, 1),
          depth: 0.06,
          anim(g, t, x0, dt) {
            drawClouds(g, cl, dt, W, x0, 0);
          }
        },
        { c: far, depth: 0.15 },
        {
          c: layer(1, 1),
          depth: 0.3,
          anim(g, t, x0) {
            drawFog(g, fog1, t, 3, H * 0.6, W, x0);
          }
        },
        {
          c: mid,
          depth: 0.45,
          anim(g, t, x0) {
            for (const e of eyes) {
              const open = Math.sin(t * 0.7 + e.ph) > 0.2 && Math.sin(t * 5 + e.ph) > -0.95;
              if (!open) continue;
              rect(g, '#ffd23a', e.x + x0, e.y, 1, 1);
              rect(g, '#ffd23a', e.x + x0 + 3, e.y, 1, 1);
            }
            if (wild) {
              const f = 0.7 + 0.3 * Math.sin(t * 3) * Math.sin(t * 1.7),
                hx = Math.round(W * 0.64 + M) + x0,
                hy = Math.round(H * 0.6);
              for (const [x, y] of [
                [-12, -9],
                [-6, -9],
                [8, -9],
                [0, -24]
              ])
                rect(g, css([255, 190, 90], f), hx + x, hy + y, 2, 2);
            }
          }
        },
        { c: near, depth: 0.85 }
      ],
      fx(g, t, dt, ox) {
        drawFog(g, fog2, t, 7, H * 0.78, W, ox);
        for (const b of bats) {
          b.x += b.v * dt;
          if (b.x > W + 10) b.x = -10;
          const x = Math.round(b.x + ox * 0.3),
            y = Math.round(b.y + Math.sin(t * 3 + b.ph) * 6),
            up = Math.sin(t * 18 + b.ph) > 0;
          rect(g, '#05060c', x, y, 2, 1);
          rect(g, '#05060c', x - 2, y + (up ? -1 : 1), 2, 1);
          rect(g, '#05060c', x + 2, y + (up ? -1 : 1), 2, 1);
        }
      }
    };
  }

  // ---------------------------------------------------------------- Boucle
  const g = canvas.getContext('2d');
  let current = 'nuit',
    built = null,
    builtKey = '',
    running = false,
    last = 0,
    par = 0,
    target = 0,
    failed = false;
  const cache = new Map();
  function size() {
    const px = Math.max(2, Math.round((window.innerHeight || 720) / 360));
    return {
      W: Math.ceil((window.innerWidth || 1280) / px),
      H: Math.ceil((window.innerHeight || 720) / px),
      M: 18
    };
  }
  function build(name) {
    const { W, H, M } = size(),
      key = name + ':' + W + 'x' + H;
    if (cache.has(key)) return cache.get(key);
    const s = Object.assign(SCENES[name](W, H, M), { W, H, M });
    if (cache.size >= 6) cache.delete(cache.keys().next().value);
    cache.set(key, s);
    return s;
  }
  function frame(now) {
    running = false;
    if (failed || (typeof started !== 'undefined' && started)) return;
    if (document.hidden || title.style.display === 'none') {
      schedule();
      return;
    }
    // Environ 30 images par seconde suffisent à ces mouvements lents.
    if (now - last < 32) {
      schedule();
      return;
    }
    const dt = Math.min(0.1, (now - last) / 1000 || 0.03);
    last = now;
    try {
      const { W, H } = size(),
        key = current + ':' + W + 'x' + H;
      if (key !== builtKey) {
        built = build(current);
        builtKey = key;
        canvas.width = W;
        canvas.height = H;
        title.classList.add('painted');
      }
      par += (target - par) * Math.min(1, dt * 3);
      const t = now / 1000,
        s = built;
      g.imageSmoothingEnabled = false;
      for (const l of s.layers) {
        const x0 = Math.round(-s.M + par * l.depth * s.M);
        if (l.c.width > 1) g.drawImage(l.c, x0, 0);
        if (l.anim) l.anim(g, t, x0, dt);
      }
      s.fx(g, t, dt, Math.round(par * s.M));
    } catch (error) {
      failed = true;
      title.classList.remove('painted');
      console.error('[CANAAN] Décor de l’écran titre impossible', error);
      return;
    }
    schedule();
  }
  function schedule() {
    if (running || typeof requestAnimationFrame !== 'function') return;
    running = true;
    requestAnimationFrame(frame);
  }
  // Parallaxe : le décor suit doucement la souris.
  window.addEventListener('pointermove', event => {
    target = clamp(((event.clientX || 0) / (window.innerWidth || 1)) * 2 - 1, -1, 1);
  });
  window.CANAAN_TITLE_SCENE = Object.freeze({
    names: Object.freeze(Object.keys(SCENES)),
    // Scène d'une race (inconnue ou vide : la nuit de pleine lune).
    set(name) {
      current = Object.hasOwn(SCENES, name) ? name : 'nuit';
      schedule();
    },
    current: () => current
  });
  schedule();
})();
