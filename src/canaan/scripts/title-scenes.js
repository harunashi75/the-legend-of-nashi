// Décors peints de l'écran titre, en pixel art : chaque race a un biome de l'île (Plaines verdoyantes et Camp de
// l'Aurore, Bois d'automne, Forêt enchantée, Désert oublié, Forêt ancienne de nuit) et le Marais brumeux s'affiche
// sans héros. Le canevas est en basse résolution (environ 360 pixels de haut) et agrandi sans lissage. Les plans du
// fond sont dessinés une fois par scène et par taille et glissent un peu avec la souris (parallaxe) ; le sol, avec le
// chemin du biome, est dessiné sous les pieds du héros (repérés sur son aperçu) et ne bouge pas. Par-dessus : nuages,
// fumées, feu de camp, moutons, feuilles qui tombent, caravane, aurore, lucioles, hibou, feux follets…
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
  // Une scène par race, dans un biome de l'île : Plaines verdoyantes et Camp de l'Aurore (Humain), Bois d'automne
  // (Orc), Forêt enchantée (Elfe), Désert oublié (Minotaure), Forêt ancienne de nuit (Vargar), Marais brumeux
  // (sans héros). Chaque scène donne :
  //  - back : les plans du fond (canevas, profondeur de parallaxe, animation éventuelle) ;
  //  - ground(fx, fy) : le sol où se tient le héros (ses pieds en fx, fy), avec le chemin du biome, sans parallaxe ;
  //  - front : les plans du premier plan, sur les côtés ;
  //  - fx : les effets par-dessus tout.
  // W, H : taille visible ; M : marge de chaque côté pour la parallaxe. Les plans font W + 2M de large.
  const SCENES = {};

  // ---------------------------------------------------------------- Effets partagés
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
  function clouds(r, W, n, yMin, yMax, cols, light, speed) {
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
  // Particules : init(p, premier) les place, step(dt, fn) les fait vivre et les replace à la fin de leur vie.
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
  // Fumée d'une cheminée ou d'un feu : volutes grises qui montent, grossissent et s'effacent.
  function smoke(r, n) {
    return particles(n, p => Object.assign(p, { k: r(), life: 2 + r() * 2.5, max: 4.5, ph: r() * 6 }));
  }
  function drawSmoke(g, list, dt, t, x, y, col = [200, 200, 210]) {
    list.step(dt, p => {
      const age = 1 - p.life / p.max;
      const px = x + Math.sin(t * 0.8 + p.ph) * 2 + age * 8,
        py = y - age * 30,
        a = clamp(0.5 * (1 - age));
      g.fillStyle = css(col, a);
      disc(g, px, py, 1 + age * 3);
    });
  }
  function drawWater(g, x0, y0, w, h, t, glint, speed = 1) {
    for (let k = 0; k < (w * h) / 220; k++) {
      const x = x0 + ((k * 73.13) % w),
        y = y0 + ((k * 31.7) % h),
        a = 0.5 + 0.5 * Math.sin(t * 2 * speed + k);
      if (a > 0.6) rect(g, css(glint, (a - 0.6) * 1.5), x + Math.sin(t + k) * 2, y, 2 + (k % 3), 1);
    }
  }

  // ---------------------------------------------------------------- Éléments de décor
  // Canopée : arbres feuillus serrés le long d'une ligne (bois lointains ou lisière).
  function canopy(g, r, hs, x0, x1, step, rMin, rMax, palettes, light = 1, trunk = null) {
    const trees = [];
    for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8))
      trees.push({
        x,
        rad: rMin + r() * (rMax - rMin),
        p: palettes[Math.floor(r() * palettes.length)],
        dy: r() * 3
      });
    for (const k of trees) {
      const base = hs[Math.max(0, Math.min(hs.length - 1, Math.round(k.x)))] + k.dy;
      if (trunk) rect(g, trunk, k.x - 1, base - k.rad * 0.6, 2, k.rad * 0.9);
      g.fillStyle = k.p[0];
      disc(g, k.x, base - k.rad, k.rad);
    }
    for (const k of trees) {
      const base = hs[Math.max(0, Math.min(hs.length - 1, Math.round(k.x)))] + k.dy;
      g.fillStyle = k.p[1];
      disc(g, k.x + light * k.rad * 0.22, base - k.rad * 1.18, k.rad * 0.68);
      g.fillStyle = k.p[2];
      disc(g, k.x + light * k.rad * 0.38, base - k.rad * 1.4, k.rad * 0.3);
    }
  }
  // Grand arbre : tronc large aux racines évasées, couronne en grappes, reflets du côté de la lumière.
  function bigTree(g, r, x, y, s, { bark, barkLit, leaves }, light = 1) {
    const tw = Math.max(3, Math.round(s * 0.18));
    for (let i = 0; i < s; i++) {
      const flare = i < s * 0.15 ? Math.round((1 - i / (s * 0.15)) * tw * 0.9) : 0;
      rect(g, bark, x - tw / 2 - flare, y - i, tw + flare * 2, 1);
      rect(g, barkLit, light > 0 ? x + tw / 2 - 1 + flare : x - tw / 2 - flare, y - i, 1, 1);
    }
    for (let k = 0; k < s / 6; k++)
      rect(g, barkLit, x - tw / 2 + 1 + ((k * 3) % Math.max(1, tw - 2)), y - s * 0.2 - k * 5, 1, 3);
    const blobs = [];
    for (let k = 0; k < 7; k++)
      blobs.push([x + (r() - 0.5) * s * 0.9, y - s - (r() - 0.3) * s * 0.45, s * (0.22 + r() * 0.16)]);
    g.fillStyle = leaves[0];
    for (const [bx, by, br] of blobs) disc(g, bx, by, br);
    g.fillStyle = leaves[1];
    for (const [bx, by, br] of blobs) disc(g, bx + light * br * 0.25, by - br * 0.2, br * 0.7);
    g.fillStyle = leaves[2];
    for (const [bx, by, br] of blobs.slice(0, 4)) disc(g, bx + light * br * 0.4, by - br * 0.4, br * 0.32);
  }
  // Arbre tordu du marais : tronc qui penche, branches nues, mousse qui pend.
  function twistedTree(g, r, x, y, s, bark, moss, dir = 1) {
    let cx = x;
    for (let i = 0; i < s; i++) {
      cx += dir * (i > s * 0.4 ? 0.35 : 0.1);
      rect(g, bark, cx - (i < s * 0.2 ? 2 : 1), y - i, i < s * 0.2 ? 4 : 2, 1);
    }
    const top = y - s;
    for (const [len, ang] of [
      [s * 0.5, -2.6],
      [s * 0.45, -0.5],
      [s * 0.35, -1.6],
      [s * 0.3, -2.2]
    ]) {
      for (let k = 0; k < len; k++)
        rect(g, bark, cx + Math.cos(ang) * k * dir, top + Math.sin(ang) * k * 0.6, 1, 1);
      const ex = cx + Math.cos(ang) * len * dir,
        ey = top + Math.sin(ang) * len * 0.6;
      for (let m = 0; m < 3; m++) rect(g, moss, ex - m * 2 * dir, ey, 1, 3 + Math.floor(r() * 6));
    }
  }
  function palm(g, x, y, h, trunk, trunkLit, frond, frondLit, lean = 1) {
    let cx = x;
    for (let i = 0; i < h; i++) {
      cx += lean * (i / h) * 0.5;
      rect(g, i % 3 ? trunk : trunkLit, cx, y - i, 2, 1);
    }
    const top = y - h;
    for (const [dx, dy, len] of [
      [-1, 0.25, 9],
      [1, 0.25, 9],
      [-1, 0.7, 7],
      [1, 0.7, 7],
      [-0.4, -0.6, 5],
      [0.4, -0.6, 5]
    ])
      for (let k = 0; k < len; k++) {
        const fx = cx + 1 + dx * k,
          fy = top + dy * k + (k * k) / (len * 1.6);
        rect(g, frond, fx, fy, 1, 2);
        if (k % 2) rect(g, frondLit, fx, fy - 1, 1, 1);
      }
    rect(g, '#6a4a28', cx, top, 3, 2);
  }
  function cactus(g, x, y, h, dark, lit) {
    rect(g, dark, x, y - h, 3, h);
    rect(g, lit, x, y - h, 1, h);
    rect(g, dark, x - 3, y - h * 0.6, 3, 2);
    rect(g, dark, x - 3, y - h * 0.6 - 4, 2, 4);
    rect(g, dark, x + 3, y - h * 0.45, 3, 2);
    rect(g, dark, x + 4, y - h * 0.45 - 5, 2, 5);
    rect(g, lit, x - 3, y - h * 0.6 - 4, 1, 4);
  }
  // Toit à quatre pans en escalier de pixels (croupes à l'ombre, faîtage clair).
  function hipRoof(g, x, y, w, h, { roof, lit, shade, edge }) {
    for (let k = 0; k < h; k++) {
      const inset = Math.round(((h - 1 - k) / h) * (w * 0.32)),
        rx = x - 2 + inset,
        rw = w + 4 - inset * 2;
      rect(g, roof, rx, y - h + k, rw, 1);
      rect(g, lit, rx, y - h + k, Math.max(1, Math.round(rw * 0.18)), 1);
      rect(
        g,
        shade,
        rx + rw - Math.max(1, Math.round(rw * 0.2)),
        y - h + k,
        Math.max(1, Math.round(rw * 0.2)),
        1
      );
    }
    rect(g, edge, x - 2, y, w + 4, 1);
  }
  // Maison à colombages (Plaines, Bois d'automne) : murs clairs, poutres sombres en croix, toit, cheminée,
  // porte en arc, fenêtres éclairées, jardinière. Renvoie la position de la cheminée (pour la fumée).
  function timberHouse(g, x, gy, w, h, c) {
    rect(g, c.wall, x, gy - h, w, h);
    rect(g, c.wallShade, x + w - 2, gy - h, 2, h);
    rect(g, c.beam, x, gy - h, w, 1);
    rect(g, c.beam, x, gy - Math.round(h / 2), w, 1);
    for (const px of [0, Math.round(w / 2) - 1, w - 1]) rect(g, c.beam, x + px, gy - h, 1, h);
    for (const [px, pw] of [
      [1, Math.round(w / 2) - 2],
      [Math.round(w / 2), Math.round(w / 2) - 1]
    ])
      for (let k = 0; k < Math.round(h / 2) - 1; k++) {
        const t = k / (Math.round(h / 2) - 1);
        rect(g, c.beam, x + px + Math.round(t * (pw - 1)), gy - h + 1 + k, 1, 1);
        rect(g, c.beam, x + px + Math.round((1 - t) * (pw - 1)), gy - h + 1 + k, 1, 1);
      }
    const dx = x + Math.round(w * 0.3);
    rect(g, c.door, dx, gy - 6, 4, 6);
    rect(g, c.door, dx + 1, gy - 7, 2, 1);
    rect(g, c.beam, dx + 3, gy - 3, 1, 1);
    const wx = x + Math.round(w * 0.68);
    rect(g, c.beam, wx - 1, gy - 6, 5, 4);
    rect(g, c.window, wx, gy - 5, 3, 2);
    rect(g, c.flowers[0], wx - 1, gy - 2, 2, 1);
    rect(g, c.flowers[1], wx + 1, gy - 2, 2, 1);
    rect(g, '#4a6a2a', wx - 1, gy - 1, 5, 1);
    hipRoof(g, x, gy - h, w, Math.round(w * 0.55), c.roof);
    const cx = x + Math.round(w * 0.72),
      cy = gy - h - Math.round(w * 0.42);
    rect(g, c.chimney, cx, cy, 3, 6);
    rect(g, c.wallShade, cx, cy, 3, 1);
    return { cx: cx + 1, cy: cy - 1 };
  }
  function logCabin(g, x, gy, w, h, light) {
    for (let k = 0; k < h; k += 2) {
      rect(g, k % 4 ? '#4a3018' : '#5a3a20', x, gy - h + k, w, 2);
      rect(g, '#8a6a48', x - 1, gy - h + k, 2, 2);
      rect(g, '#8a6a48', x + w - 1, gy - h + k, 2, 2);
      rect(g, '#5a4028', x - 1, gy - h + k + 1, 1, 1);
    }
    rect(g, '#2a1a10', x + 3, gy - 7, 4, 7);
    rect(g, '#2a1a10', x + w - 9, gy - 7, 5, 4);
    rect(g, light, x + w - 8, gy - 6, 3, 2);
    hipRoof(g, x, gy - h, w, Math.round(w * 0.5), {
      roof: '#3a3a26',
      lit: '#5a6a34',
      shade: '#22241a',
      edge: '#1a1a12'
    });
    for (let k = 0; k < w; k += 3) rect(g, '#4a6a2a', x + k, gy - h - 1 - (k % 2), 2, 1);
    const cx = x + Math.round(w * 0.75),
      cy = gy - h - Math.round(w * 0.38);
    rect(g, '#4a4a4a', cx, cy, 3, 6);
    // Bois empilé contre le mur.
    for (let k = 0; k < 3; k++)
      for (let i = 0; i < 4 - k; i++) rect(g, '#8a6a48', x + w + 2 + i * 2 + k, gy - 2 - k * 2, 2, 2);
    return { cx: cx + 1, cy: cy - 1 };
  }
  function adobeHouse(g, x, gy, w, h) {
    const wall = '#c89a62',
      lit = '#e0b47a',
      shade = '#a07a4a';
    rect(g, wall, x, gy - h, w, h);
    rect(g, lit, x, gy - h, 2, h);
    rect(g, shade, x + w - 2, gy - h, 2, h);
    rect(g, lit, x - 1, gy - h - 2, w + 2, 2);
    for (let k = 2; k < w - 2; k += 4) rect(g, '#5a3a20', x + k, gy - h + 2, 1, 1);
    rect(g, '#3a2414', x + 4, gy - 7, 4, 7);
    rect(g, '#3a2414', x + 5, gy - 8, 2, 1);
    // Moucharabieh : fenêtre en grille.
    rect(g, '#5a3a20', x + w - 9, gy - h + 5, 5, 5);
    for (let i = 0; i < 5; i += 2)
      for (let j = 0; j < 5; j += 2) rect(g, '#ffd890', x + w - 9 + i, gy - h + 5 + j, 1, 1);
    // Tour carrée crénelée coiffée d'un dôme blanchi.
    const tx = x + w - 2;
    rect(g, wall, tx, gy - h - 12, 8, h + 12);
    rect(g, shade, tx + 6, gy - h - 12, 2, h + 12);
    for (let k = 0; k < 8; k += 2) rect(g, wall, tx + k, gy - h - 14, 1, 2);
    g.fillStyle = '#f4f0e6';
    disc(g, tx + 4, gy - h - 15, 4);
    rect(g, '#d8d0c0', tx + 6, gy - h - 17, 2, 3);
    rect(g, '#c8a040', tx + 4, gy - h - 21, 1, 3);
    rect(g, '#3a2414', tx + 3, gy - h - 6, 2, 3);
    // Jarres.
    for (const [jx, col] of [
      [-3, '#b8683a'],
      [-6, '#a85a30']
    ]) {
      g.fillStyle = col;
      disc(g, x + jx, gy - 2, 2);
      rect(g, col, x + jx - 1, gy - 5, 2, 1);
    }
  }
  function lilacHouse(g, x, gy, w, h, sparkle) {
    rect(g, '#b8a0d8', x, gy - h, w, h);
    for (let k = 0; k < h; k += 3)
      for (let i = (k / 3) % 2 ? 0 : 3; i < w; i += 6) rect(g, '#8a70b0', x + i, gy - h + k, 1, 3);
    for (let k = 0; k < h; k += 3) rect(g, '#9a82c0', x, gy - h + k, w, 1);
    rect(g, '#d8c8f0', x, gy - h, 1, h);
    rect(g, '#6a50a0', x + w - 1, gy - h, 1, h);
    rect(g, '#3a2a5a', x + 4, gy - 8, 4, 8);
    rect(g, '#3a2a5a', x + 5, gy - 9, 2, 1);
    rect(g, '#3a2a5a', x + w - 9, gy - h + 4, 5, 5);
    rect(g, '#aef8ff', x + w - 8, gy - h + 5, 3, 3);
    hipRoof(g, x, gy - h, w, Math.round(w * 0.55), {
      roof: '#5a3a9a',
      lit: '#7a5ac8',
      shade: '#3a2470',
      edge: '#2a1a50'
    });
    for (let k = 0; k < 6; k++)
      rect(g, sparkle, x + 2 + ((k * 7) % (w - 2)), gy - h - 2 - ((k * 5) % Math.round(w * 0.45)), 1, 1);
  }
  function stiltHut(g, x, gy, w, h, light) {
    for (const px of [1, w - 3, Math.round(w / 2)]) rect(g, '#3a2a1a', x + px, gy - 2, 2, 12);
    rect(g, '#5a4028', x - 3, gy - 2, w + 6, 2);
    for (let k = 0; k < w; k += 3) rect(g, k % 2 ? '#5a4a38' : '#4a3a2a', x + k, gy - 2 - h, 3, h);
    rect(g, '#2a1e14', x + 3, gy - 9, 4, 7);
    rect(g, '#2a1e14', x + w - 8, gy - h + 2, 4, 4);
    rect(g, light, x + w - 7, gy - h + 3, 2, 2);
    // Toit de roseaux à longue frange.
    for (let k = 0; k < 9; k++) {
      const inset = Math.round((8 - k) * 1.3);
      rect(g, k % 2 ? '#8a7a4a' : '#7a6a3e', x - 4 + inset, gy - 2 - h - 9 + k, w + 8 - inset * 2, 1);
    }
    for (let k = -4; k < w + 4; k += 2) rect(g, '#6a5a34', x + k, gy - 2 - h, 1, 2 + (k % 3));
    // Échelle jusqu'à l'eau.
    rect(g, '#6a5034', x - 2, gy - 2, 1, 10);
    rect(g, '#6a5034', x + 1, gy - 2, 1, 10);
    for (let k = 0; k < 10; k += 3) rect(g, '#6a5034', x - 2, gy + k, 4, 1);
  }
  function sheep(g, x, y, bob) {
    rect(g, '#3a3030', x + 1, y - 1, 1, 2);
    rect(g, '#3a3030', x + 5, y - 1, 1, 2);
    g.fillStyle = '#f4f0e8';
    disc(g, x + 3, y - 4, 3);
    rect(g, '#d8d0c8', x, y - 3, 7, 2);
    rect(g, '#3a3030', x - 2, y - 5 + bob, 3, 3);
  }
  function camel(g, x, y, t, col) {
    const step = Math.sin(t * 4 + x) > 0 ? 1 : 0;
    rect(g, col, x, y - 7, 9, 3);
    rect(g, col, x + 2, y - 9, 4, 2);
    rect(g, col, x + 3, y - 10, 2, 1);
    rect(g, col, x + 8, y - 11, 1, 5);
    rect(g, col, x + 8, y - 12, 3, 2);
    for (const [lx, o] of [
      [1, step],
      [2, 1 - step],
      [6, 1 - step],
      [7, step]
    ])
      rect(g, col, x + lx + o - 0.5, y - 4, 1, 4);
    rect(g, col, x + 3, y - 13, 2, 3);
  }

  // ---------------------------------------------------------------- Sol du héros
  // Plan de sol en perspective : du bord du terrain (y0) au bas de l'écran, ton lointain plus clair et brumeux,
  // ton proche plus sombre. Le chemin du biome passe sous les pieds du héros (fx, fy) et s'éloigne vers l'horizon.
  // style(g, xl, xr, y, p, row) peint une rangée du chemin ; details(put) sème herbes, fleurs, cailloux…
  function groundLayer(r, W, H, M, fx, fy, { far, near, edge, path, details, lean = 0.45, width = 0.12 }) {
    const LW = W + 2 * M,
      c = layer(LW, H),
      g = c.getContext('2d'),
      y0 = Math.round(Math.max(H * 0.52, fy - H * 0.1)),
      n = noise(r),
      edgeY = x => y0 + Math.round((n(x / 9, 3) - 0.5) * 5),
      img = g.createImageData(LW, H),
      px = img.data,
      [cf, cn] = [rgb(far), rgb(near)];
    for (let x = 0; x < LW; x++)
      for (let y = Math.max(0, edgeY(x)); y < H; y++) {
        const p = (y - y0) / (H - y0),
          col = mix(cf, cn, clamp(Math.floor(p * 6 + dither(x, y) * 0.9 + 0.5) / 6)),
          o = (y * LW + x) * 4;
        px[o] = col[0];
        px[o + 1] = col[1];
        px[o + 2] = col[2];
        px[o + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    // Chemin : centre qui passe par les pieds, largeur qui croît vers le bas.
    const cxAt = y => fx + M + (fy - y) * lean,
      hwAt = y => 2 + ((y - y0) / (H - y0)) * W * width;
    let row = 0;
    for (let y = y0 + 1; y < H; y++, row++) {
      const p = (y - y0) / (H - y0),
        cx = cxAt(y),
        hw = hwAt(y);
      path(g, Math.round(cx - hw), Math.round(cx + hw), y, p, row);
    }
    const onPath = (x, y) => Math.abs(x - cxAt(y)) < hwAt(y) + 1;
    // Lisière : touffes et buissons sur le bord du terrain, pour fondre le sol dans le décor.
    if (edge) for (let x = 0; x < LW; x += 1 + Math.floor(r() * 3)) edge(g, x, edgeY(x), r);
    details((count, fn, allowPath = false) => {
      for (let k = 0; k < count; k++) {
        const p = Math.pow(r(), 0.85),
          y = Math.round(y0 + 3 + p * (H - y0 - 3)),
          x = Math.round(r() * LW);
        if (!allowPath && onPath(x, y)) continue;
        fn(g, x, y, 0.5 + p * 1.8, p, r);
      }
    });
    return { c, y0, onPath, cxAt, hwAt };
  }
  // Styles de chemin.
  const dirtPath = (base, dark, lit) => {
    [base, dark, lit] = [base, dark, lit].map(rgb);
    return (g, xl, xr, y, p) => {
      for (let x = xl; x <= xr; x++) {
        const edge = x - xl < 1 + p * 2 || xr - x < 1 + p * 2,
          rut =
            Math.abs(x - (xl + xr) / 2) > (xr - xl) * 0.18 && Math.abs(x - (xl + xr) / 2) < (xr - xl) * 0.26;
        const col = edge ? dark : rut ? mix(base, dark, 0.45) : dither(x, y) > 0.35 ? lit : base;
        g.fillStyle = css(col);
        g.fillRect(x, y, 1, 1);
      }
    };
  };
  const slabPath = (a, b, joint, edgeCol) => (g, xl, xr, y, p, row) => {
    const sh = Math.max(2, Math.round(2 + p * 7)),
      band = Math.floor(row / sh),
      sw = Math.max(3, Math.round(4 + p * 16)),
      off = band % 2 ? sw / 2 : 0;
    const top = row % sh === 0;
    for (let x = xl; x <= xr; x++) {
      const vj = Math.floor((x - xl + off) % sw) === 0;
      let col = top || vj ? joint : (Math.floor((x - xl + off) / sw) + band) % 3 ? a : b;
      if (x - xl < 1 || xr - x < 1) col = edgeCol;
      rect(g, col, x, y, 1, 1);
    }
  };
  const plankPath = (a, b, gap, post) => (g, xl, xr, y, p, row) => {
    const ph = Math.max(2, Math.round(2 + p * 5));
    const isGap = row % ph === 0;
    rect(g, isGap ? gap : Math.floor(row / ph) % 2 ? a : b, xl, y, xr - xl + 1, 1);
    if (!isGap && row % ph === 1) {
      rect(g, post, xl + 2, y, 1, 1);
      rect(g, post, xr - 2, y, 1, 1);
    }
    rect(g, post, xl - 1, y, Math.max(1, Math.round(p * 2)), 1);
    rect(g, post, xr, y, Math.max(1, Math.round(p * 2)), 1);
  };
  // Petits éléments du sol.
  const tuft = (dark, lit) => (g, x, y, s) => {
    const h = Math.max(2, Math.round(1 + s * 2));
    rect(g, dark, x, y - h, 1, h);
    rect(g, lit, x + 1, y - h - 1, 1, h + 1);
    rect(g, dark, x + 2, y - h + 1, 1, h - 1);
  };
  const flower = cols => (g, x, y, s, p, r) => {
    const c = cols[Math.floor(r() * cols.length)];
    rect(g, '#3d7234', x, y - 1 - Math.round(s), 1, 1 + Math.round(s));
    rect(g, c, x - (s > 1.4 ? 1 : 0), y - 2 - Math.round(s), s > 1.4 ? 3 : 1, s > 1.4 ? 2 : 1);
    if (s > 1.4) rect(g, '#e6a33e', x, y - 2 - Math.round(s), 1, 1);
  };
  const pebble = (dark, lit) => (g, x, y, s) => {
    g.fillStyle = dark;
    disc(g, x, y, Math.max(0, s * 0.7));
    rect(g, lit, x - Math.round(s * 0.4), y - Math.round(s * 0.5), Math.max(1, Math.round(s * 0.6)), 1);
  };
  const leaf = cols => (g, x, y, s, p, r) => {
    const c = cols[Math.floor(r() * cols.length)],
      w = Math.max(1, Math.round(s * 1.2));
    rect(g, c, x, y, w, 1);
    if (s > 1) rect(g, c, x + 1, y - 1, w, 1);
  };
  const mushroom = (cap, dots) => (g, x, y, s) => {
    const w = Math.max(2, Math.round(s * 2));
    rect(g, '#e8dcc8', x, y - w, 1, w);
    rect(g, cap, x - Math.floor(w / 2), y - w - 1, w + 1, Math.max(1, Math.round(s)));
    if (s > 1.2) rect(g, dots, x - 1, y - w - 1, 1, 1);
  };
  const reed = (stem, top) => (g, x, y, s) => {
    const h = Math.round(4 + s * 6);
    rect(g, stem, x, y - h, 1, h);
    rect(g, stem, x + 2, y - h + 2, 1, h - 2);
    rect(g, top, x, y - h - 2, 1, 3);
  };
  const crystal = (col, lit) => (g, x, y, s) => {
    const h = Math.round(2 + s * 3);
    for (let k = 0; k < h; k++) {
      const half = Math.round((k < h * 0.3 ? k / (h * 0.3) : 1) * Math.max(1, s));
      rect(g, col, x - half, y - h + k, half * 2 + 1, 1);
    }
    rect(g, lit, x, y - h, 1, h);
  };

  // ---------------------------------------------------------------- Humain : Plaines verdoyantes, Camp de l'Aurore
  SCENES.humain = (W, H, M) => {
    const r = rng(11),
      LW = W + 2 * M,
      light = 1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#3466b4'],
      [0.35, '#6a9ad8'],
      [0.56, '#a8d0ec'],
      [0.66, '#f2e6b8']
    ]);
    sun(skyC.getContext('2d'), W * 0.66 + M, H * 0.16, H * 0.045, '#fffbe8', '#fff0b0', '#fff4c0');
    // La mer à l'horizon : l'île est entourée d'eau.
    const sea = layer(LW, H),
      gs = sea.getContext('2d');
    rect(gs, '#3a7fae', 0, Math.round(H * 0.55), LW, Math.round(H * 0.06));
    rect(gs, '#7cc0dc', 0, Math.round(H * 0.55), LW, 1);
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.6, amp: H * 0.07, scale: 110, octaves: 3 }),
      mountainPaint({ lit: '#88b0a8', shade: '#6a90a0', haze: '#a8cad0', light, fade: H * 0.08, bands: 4 })
    );
    const hillsHs = ridge(r, LW, { base: H * 0.66, amp: H * 0.05, scale: 120, octaves: 3 });
    const hills = layer(LW, H);
    terrain(hills, hillsHs, (x, y, d, slope) =>
      mix(
        slope * light > 0.2 ? [140, 192, 96] : [106, 160, 74],
        [84, 136, 60],
        clamp(Math.floor((d / 30) * 3 + dither(x, y) + 0.5) / 3)
      )
    );
    const gh = hills.getContext('2d'),
      greens = [
        ['#3d7234', '#4f8a42', '#9cc46a'],
        ['#33603a', '#467a46', '#6aa552']
      ];
    for (let k = 0; k < 7; k++) {
      const x0 = Math.round(r() * LW);
      canopy(gh, r, hillsHs, x0, x0 + 10 + r() * 30, 4, 3, 6, greens, light, '#4a3a2a');
    }
    // Camp de l'Aurore : chaumières à colombages, feu de camp, barrière, moutons.
    const camp = layer(LW, H),
      campHs = ridge(r, LW, { base: H * 0.71, amp: H * 0.02, scale: 80, octaves: 2 });
    terrain(camp, campHs, (x, y, d) =>
      mix([110, 166, 78], [70, 120, 54], clamp(Math.floor((d / 26) * 3 + dither(x, y) + 0.5) / 3))
    );
    const gc = camp.getContext('2d'),
      thatch = { roof: '#c8a050', lit: '#e8c878', shade: '#9a7a38', edge: '#6a5228' },
      tiles = { roof: '#a84a3a', lit: '#c86a4a', shade: '#7a3028', edge: '#4a1e18' },
      house = (x, w, h, roof) =>
        timberHouse(gc, Math.round(x), Math.round(campHs[Math.round(x + w / 2)]) + 1, w, h, {
          wall: '#ecdfc0',
          wallShade: '#c8b896',
          beam: '#5a3a2a',
          door: '#5a3420',
          window: '#ffd27a',
          flowers: ['#e84a6a', '#f8d96a'],
          chimney: '#7a7270',
          roof
        });
    const chimneys = [
      house(M + W * 0.6, 26, 15, thatch),
      house(M + W * 0.7, 22, 13, tiles),
      house(M + W * 0.3, 24, 14, tiles)
    ];
    for (let x = Math.round(M + W * 0.52); x < M + W * 0.59; x += 3) {
      const y = Math.round(campHs[x]);
      rect(gc, '#8a6a48', x, y - 4, 1, 4);
      rect(gc, '#a8845a', x - 1, y - 3, 4, 1);
    }
    const fireX = Math.round(M + W * 0.66),
      fireY = Math.round(campHs[fireX]) + 4;
    for (let k = 0; k < 5; k++) rect(gc, '#7a7270', fireX - 4 + k * 2, fireY, 2, 1);
    rect(gc, '#5a3a20', fireX - 3, fireY - 1, 7, 1);
    rect(gc, '#6a4a28', fireX + 5, fireY - 2, 6, 2);
    for (let x = 4; x < LW - 4; x += 10 + Math.floor(r() * 18)) {
      if (Math.abs(x - (M + W * 0.5)) < W * 0.25) continue;
      leafy(
        gc,
        x,
        Math.round(campHs[x]) + 2,
        6 + Math.floor(r() * 4),
        '#2e5a2a',
        '#4f8a42',
        '#9cc46a',
        light
      );
    }
    const flock = [0.4, 0.43, 0.77, 0.8].map((f, i) => ({ x: Math.round(M + W * f + i), y: 0 }));
    for (const s of flock) s.y = Math.round(campHs[s.x]) + 3;
    const smokes = chimneys.map(() => smoke(r, 10)),
      fireSmoke = smoke(r, 12);
    const cl = clouds(
      r,
      W,
      6,
      H * 0.06,
      H * 0.36,
      { base: '#f4f6fa', shade: '#b8c8e0', lit: '#ffffff' },
      light,
      3
    );
    const birds = Array.from({ length: 5 }, (_, i) => ({
      x: W * 0.2 + i * 9,
      y: H * 0.24 + (i % 3) * 5,
      ph: r() * 6
    }));
    const butterflies = particles(10, p =>
      Object.assign(p, {
        x: r() * W,
        y: H * (0.75 + r() * 0.2),
        ph: r() * 6,
        life: 5 + r() * 6,
        c: ['#ffffff', '#f8d96a', '#f6a5c2'][Math.floor(r() * 3)]
      })
    );
    return {
      back: [
        { c: skyC, depth: 0.02 },
        {
          c: sea,
          depth: 0.05,
          anim(g, t, x0) {
            drawWater(g, 0, H * 0.555, W, H * 0.05, t, [200, 240, 255]);
          }
        },
        { c: far, depth: 0.1 },
        { c: hills, depth: 0.25 },
        {
          c: camp,
          depth: 0.4,
          anim(g, t, x0, dt) {
            chimneys.forEach((ch, i) => drawSmoke(g, smokes[i], dt, t, ch.cx + x0, ch.cy));
            const f = Math.sin(t * 13) * Math.sin(t * 7.1);
            rect(g, '#ff7a2a', fireX + x0 - 2, fireY - 3, 5, 2);
            rect(g, '#ffd04a', fireX + x0 - 1, fireY - 5 - (f > 0 ? 1 : 0), 3, 3);
            rect(g, '#fff4c0', fireX + x0, fireY - 5, 1, 2);
            halo(g, fireX + x0, fireY - 3, 2, 9, '#ffb050', 0.18);
            drawSmoke(g, fireSmoke, dt, t, fireX + x0, fireY - 7, [180, 180, 190]);
            flock.forEach((s, i) => sheep(g, s.x + x0, s.y, Math.sin(t * 1.5 + i * 2) > 0.6 ? 1 : 0));
          }
        }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#86bc5c',
          near: '#2e5a28',
          path: dirtPath('#a88a62', '#7a6040', '#c4a67a'),
          edge: (g, x, y, rr) => {
            rect(g, '#5a9440', x, y - 1 - Math.floor(rr() * 2), 1, 2);
            if (rr() < 0.08)
              leafy(g, x, y + 1, 3 + Math.floor(rr() * 2), '#2e5a2a', '#4f8a42', '#9cc46a', light);
          },
          details: put => {
            put(260, tuft('#3d7234', '#9cc46a'));
            put(60, flower(['#ffffff', '#f8d96a', '#f6c5e2']));
            put(20, pebble('#8a8270', '#c8c0a8'), true);
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        drawClouds(g, cl, dt, W, ox);
        for (const b of birds) {
          b.x += dt * 7;
          if (b.x > W + 20) b.x = -20;
          const up = Math.sin(t * 6 + b.ph) > 0,
            x = Math.round(b.x + ox * 0.2),
            y = Math.round(b.y + Math.sin(t + b.ph) * 2);
          rect(g, '#2a3040', x, y, 1, 1);
          rect(g, '#2a3040', x - 2, y + (up ? -1 : 1), 2, 1);
          rect(g, '#2a3040', x + 1, y + (up ? -1 : 1), 2, 1);
        }
        butterflies.step(dt, p => {
          p.x += Math.sin(t * 0.7 + p.ph) * 10 * dt;
          p.y += Math.cos(t * 1.3 + p.ph) * 6 * dt;
          const open = Math.sin(t * 14 + p.ph) > 0;
          rect(g, css(rgb(p.c), clamp(p.life)), p.x - (open ? 1 : 0), p.y, open ? 3 : 1, 1);
        });
      }
    };
  };

  // ---------------------------------------------------------------- Orc : Bois d'automne
  SCENES.orc = (W, H, M) => {
    const r = rng(23),
      LW = W + 2 * M,
      light = 1,
      sunX = W * 0.62 + M,
      sunY = H * 0.5;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#3a2a5a'],
      [0.32, '#7a4068'],
      [0.52, '#d8704a'],
      [0.66, '#f8c070']
    ]);
    sun(skyC.getContext('2d'), sunX, sunY, H * 0.06, '#fff0c0', '#ffc070', '#ffb060', '#f0904a');
    const autumn = [
      ['#6a2020', '#a83a2a', '#e0603a'],
      ['#7a3a14', '#c0682a', '#f0a040'],
      ['#7a5a14', '#c8962a', '#f8d060']
    ];
    const far = layer(LW, H),
      farHs = ridge(r, LW, { base: H * 0.6, amp: H * 0.08, scale: 100, octaves: 3 });
    terrain(
      far,
      farHs,
      mountainPaint({ lit: '#b06a5a', shade: '#7a4a5a', haze: '#d89a7a', light, fade: H * 0.08, bands: 4 })
    );
    canopy(
      far.getContext('2d'),
      r,
      farHs,
      0,
      LW,
      4,
      3,
      5,
      [
        ['#8a4a4a', '#b0705a', '#d8a070'],
        ['#9a6040', '#c08a50', '#e0b070']
      ],
      light
    );
    // Petit lac qui reflète le couchant.
    const lake = layer(LW, H),
      gl = lake.getContext('2d'),
      ly = Math.round(H * 0.64),
      lh = Math.round(H * 0.07);
    for (let y = ly; y < ly + lh; y++)
      rect(gl, css(mix([216, 128, 96], [90, 50, 70], (y - ly) / lh)), 0, y, LW, 1);
    for (let k = 0; k < lh; k += 2)
      rect(gl, css([255, 220, 150], 0.6 - k * 0.04), sunX - 6 + (k % 4), ly + k, 12 - k / 2, 1);
    const mid = layer(LW, H),
      midHs = ridge(r, LW, { base: H * 0.72, amp: H * 0.03, scale: 60, octaves: 2 });
    terrain(mid, midHs, (x, y, d) =>
      mix([170, 106, 52], [100, 56, 28], clamp(Math.floor((d / 30) * 3 + dither(x, y) + 0.5) / 3))
    );
    const gm = mid.getContext('2d');
    for (let x = 0; x < LW; x += 9 + Math.floor(r() * 10)) {
      if (Math.abs(x - (M + W * 0.5)) < W * 0.12) continue;
      bigTree(
        gm,
        r,
        x,
        Math.round(midHs[x]) + 2,
        18 + Math.floor(r() * 12),
        { bark: '#3a2418', barkLit: '#6a4428', leaves: autumn[Math.floor(r() * 3)] },
        light
      );
    }
    // Maison aux bardeaux roux, citrouilles devant la porte.
    const hx = Math.round(M + W * 0.64),
      hgy = Math.round(midHs[hx + 12]) + 1;
    const chim = timberHouse(gm, hx, hgy, 26, 15, {
      wall: '#e6cfa6',
      wallShade: '#c0a47e',
      beam: '#5a3420',
      door: '#4a2814',
      window: '#ffcc6a',
      flowers: ['#e0603a', '#f8d060'],
      chimney: '#6a5a50',
      roof: { roof: '#c06a2a', lit: '#e08a3a', shade: '#8a4418', edge: '#5a2a10' }
    });
    for (let k = 0; k < 7; k++) rect(gm, autumn[k % 3][2], hx + 2 + k * 3, hgy - 15 - 6 - (k % 3) * 2, 1, 1);
    for (const px of [-4, -8, 28]) {
      g_pumpkin(gm, hx + px, hgy);
    }
    function g_pumpkin(g, x, y) {
      rect(g, '#d8701e', x - 2, y - 3, 5, 3);
      rect(g, '#f0902a', x - 1, y - 3, 1, 3);
      rect(g, '#a8501a', x + 1, y - 3, 1, 3);
      rect(g, '#4a6a2a', x, y - 4, 1, 1);
    }
    const sm = smoke(r, 10);
    const leaves = particles(46, p =>
      Object.assign(p, {
        x: r() * W * 1.2,
        y: -r() * H * 0.4,
        vx: -6 - r() * 8,
        vy: 8 + r() * 10,
        ph: r() * 6,
        life: 8 + r() * 6,
        c: rgb(autumn[Math.floor(r() * 3)][1 + Math.floor(r() * 2)])
      })
    );
    const motes = particles(30, p =>
      Object.assign(p, { x: r() * W, y: H * (0.4 + r() * 0.4), ph: r() * 6, life: 4 + r() * 4 })
    );
    return {
      back: [
        { c: skyC, depth: 0.02 },
        { c: far, depth: 0.12 },
        {
          c: lake,
          depth: 0.2,
          anim(g, t) {
            drawWater(g, 0, ly, W, lh, t, [255, 220, 170]);
          }
        },
        {
          c: mid,
          depth: 0.4,
          anim(g, t, x0, dt) {
            drawSmoke(g, sm, dt, t, chim.cx + x0, chim.cy);
          }
        }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#b88040',
          near: '#4a2a14',
          path: dirtPath('#8a6a48', '#5a4028', '#a88a62'),
          edge: (g, x, y, rr) => {
            rect(g, '#8a5a2a', x, y - 1, 1, 2);
            if (rr() < 0.25) rect(g, autumn[Math.floor(rr() * 3)][2], x, y - 1, 2, 1);
          },
          details: put => {
            put(320, leaf(['#c0682a', '#e0603a', '#f8d060', '#a83a2a', '#8a5a2a']), true);
            put(90, tuft('#6a4a1e', '#b89040'));
            put(12, (g, x, y, s) => {
              rect(
                g,
                '#d8701e',
                x - Math.round(s),
                y - Math.round(s * 1.6),
                Math.round(s * 2.4) + 1,
                Math.round(s * 1.6)
              );
              rect(g, '#f0902a', x - Math.round(s) + 1, y - Math.round(s * 1.6), 1, Math.round(s * 1.6));
              rect(g, '#4a6a2a', x, y - Math.round(s * 1.6) - 1, 1, 1);
            });
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        motes.step(dt, p => {
          p.y += Math.sin(t + p.ph) * 2 * dt;
          p.x += 2 * dt;
          rect(
            g,
            css([255, 230, 170], 0.5 * clamp(p.life / 2) * (0.5 + 0.5 * Math.sin(t * 3 + p.ph))),
            p.x + ox * 0.6,
            p.y,
            1,
            1
          );
        });
        leaves.step(dt, p => {
          p.x += (p.vx + Math.sin(t * 2 + p.ph) * 10) * dt;
          p.y += p.vy * dt;
          if (p.y > H) p.life = 0;
          const flip = Math.sin(t * 5 + p.ph) > 0;
          rect(g, css(p.c), p.x + ox * 0.9, p.y, flip ? 2 : 1, flip ? 1 : 2);
        });
      }
    };
  };

  // ---------------------------------------------------------------- Minotaure : Désert oublié
  SCENES.minotaure = (W, H, M) => {
    const r = rng(41),
      LW = W + 2 * M,
      light = 1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#2a68a8'],
      [0.4, '#6aa8d4'],
      [0.56, '#cfe0e0'],
      [0.64, '#f2dcb0']
    ]);
    sun(skyC.getContext('2d'), W * 0.64 + M, H * 0.14, H * 0.05, '#ffffff', '#fff8d8', '#fff0c0');
    const duneHaze = (lit, shade, haze, fade) => {
      [lit, shade, haze] = [lit, shade, haze].map(rgb);
      return (x, y, d, slope, top, span) => {
        const face = slope * light > 0.15 ? lit : shade,
          ripple = (y + Math.round(Math.sin(x * 0.08) * 2)) % 5 === 0 && d > 2,
          col = ripple ? mix(face, [255, 255, 255], 0.12) : face;
        return mix(
          col,
          haze,
          clamp(Math.floor(((y - span.min) / (span.max - span.min + fade)) * 4 + dither(x, y) + 0.5) / 4)
        );
      };
    };
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.58, amp: H * 0.05, scale: 90, ridged: true, octaves: 2 }),
      duneHaze('#ecd6a4', '#d4b484', '#f2e2c4', H * 0.06)
    );
    // Ruines lointaines : colonnes et arche à moitié ensablées.
    const gf = far.getContext('2d'),
      rx = Math.round(M + W * 0.34),
      ry = Math.round(H * 0.57);
    for (const [dx, h] of [
      [-12, 14],
      [-6, 9],
      [6, 16],
      [12, 6]
    ]) {
      rect(gf, '#d8c09a', rx + dx, ry - h, 3, h);
      rect(gf, '#e8d4b0', rx + dx, ry - h, 1, h);
      rect(gf, '#c8ac84', rx + dx - 1, ry - h - 1, 5, 1);
    }
    rect(gf, '#d8c09a', rx + 4, ry - 18, 12, 2);
    const duneHs = ridge(r, LW, { base: H * 0.66, amp: H * 0.07, scale: 70, ridged: true, octaves: 2 });
    const dunes = layer(LW, H);
    terrain(dunes, duneHs, duneHaze('#ead296', '#c4a266', '#e0c890', H * 0.08));
    // Oasis : bassin, palmiers, roseaux ; maison de terre crue à la tour blanchie.
    const oasis = layer(LW, H),
      oasisHs = ridge(r, LW, { base: H * 0.72, amp: H * 0.02, scale: 50, octaves: 2 });
    terrain(oasis, oasisHs, (x, y, d) =>
      mix([216, 187, 128], [176, 138, 80], clamp(Math.floor((d / 26) * 3 + dither(x, y) + 0.5) / 3))
    );
    const go = oasis.getContext('2d'),
      ox0 = Math.round(M + W * 0.7),
      oy = Math.round(oasisHs[ox0]) + 3;
    g_pool();
    function g_pool() {
      for (let k = 0; k < 6; k++) {
        const half = Math.round(16 * Math.sqrt(1 - Math.pow((k - 2.5) / 3, 2)));
        rect(go, k === 0 ? '#7cc0dc' : '#3a7fae', ox0 - half, oy + k, half * 2, 1);
      }
      for (let k = -18; k < 18; k += 3) rect(go, '#5a8a3a', ox0 + k, oy - 2 + (k % 2), 1, 3);
    }
    palm(go, ox0 - 18, oy + 1, 22, '#8a6a3a', '#a8844a', '#3e7a34', '#6aa552', 1);
    palm(go, ox0 + 14, oy + 1, 18, '#8a6a3a', '#a8844a', '#3e7a34', '#6aa552', -1);
    palm(go, ox0 + 22, oy, 26, '#8a6a3a', '#a8844a', '#33603a', '#5a9a46', -1);
    adobeHouse(go, Math.round(M + W * 0.58), Math.round(oasisHs[Math.round(M + W * 0.6)]) + 1, 22, 13);
    for (let k = 0; k < 8; k++) {
      const x = Math.round(r() * LW);
      if (Math.abs(x - (M + W * 0.5)) < W * 0.15) continue;
      cactus(go, x, Math.round(oasisHs[x]) + 2, 7 + Math.floor(r() * 6), '#3e6a34', '#6a9a4a');
    }
    const caravan = Array.from({ length: 4 }, (_, i) => ({ off: i * 16 }));
    let caravanX = W * 0.1;
    const sand = particles(60, p =>
      Object.assign(p, { x: r() * W, y: H * (0.55 + r() * 0.45), v: 20 + r() * 30, life: 2 + r() * 3 })
    );
    const vultures = [0, 2.1].map(ph => ({ ph }));
    return {
      back: [
        { c: skyC, depth: 0.02 },
        { c: far, depth: 0.1 },
        {
          c: dunes,
          depth: 0.25,
          anim(g, t, x0, dt) {
            caravanX += dt * 4;
            if (caravanX > W + 80) caravanX = -80;
            for (const c of caravan) {
              const x = Math.round(caravanX - c.off),
                lx = x - x0;
              if (lx < 0 || lx >= LW) continue;
              camel(g, x, Math.round(duneHs[lx]) + 1, t + c.off, '#6a4a30');
            }
          }
        },
        { c: oasis, depth: 0.4 }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#ead296',
          near: '#a8824c',
          lean: 0.3,
          path: slabPath('#d8bb80', '#ccae74', '#9a7a4a', '#8a6a40'),
          edge: (g, x, y, rr) => {
            if (rr() < 0.3) rect(g, '#f2dca6', x, y - 1, 2, 1);
          },
          details: put => {
            put(140, (g, x, y, s) => rect(g, '#f2dca6', x, y, Math.round(2 + s * 3), 1));
            put(40, (g, x, y, s) => rect(g, '#b8944e', x, y, Math.round(2 + s * 2), 1));
            put(30, pebble('#a08060', '#d8c0a0'));
            put(20, tuft('#8a7a3a', '#c8b060'));
            put(
              26,
              (g, x, y, s, p, rr) => {
                // Sable qui recouvre en partie les dalles du chemin.
                g.fillStyle = '#e4ca8e';
                disc(g, x, y, s * 1.6 * rr());
              },
              true
            );
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        for (const v of vultures) {
          const vx = W * 0.4 + Math.cos(t * 0.2 + v.ph) * W * 0.12 + ox * 0.2,
            vy = H * 0.2 + Math.sin(t * 0.2 + v.ph) * H * 0.04,
            flap = Math.sin(t * 2 + v.ph) > 0.8 ? -1 : 0;
          rect(g, '#3a2a24', vx - 1, vy, 3, 1);
          for (let k = 1; k < 5; k++) {
            rect(g, '#3a2a24', vx - 1 - k, vy - (k > 2 ? 1 + flap : flap), 1, 1);
            rect(g, '#3a2a24', vx + 1 + k, vy - (k > 2 ? 1 + flap : flap), 1, 1);
          }
        }
        sand.step(dt, p => {
          p.x += p.v * dt;
          if (p.x > W) p.x -= W;
          rect(
            g,
            css([240, 220, 170], 0.5 * clamp(p.life / 1.5)),
            p.x + ox * 0.9,
            p.y + Math.sin(t * 3 + p.x) * 1,
            2,
            1
          );
        });
      }
    };
  };

  // ---------------------------------------------------------------- Elfe : Forêt enchantée
  SCENES.elfe = (W, H, M) => {
    const r = rng(37),
      LW = W + 2 * M,
      light = 1;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#0c0a30'],
      [0.36, '#2a2470'],
      [0.56, '#5a3e98'],
      [0.68, '#a86ab0']
    ]);
    const stars = starField(r, W, H, 120, H * 0.5, ['#ffffff', '#d8f0ff', '#f0d8ff']);
    const far = layer(LW, H);
    terrain(
      far,
      ridge(r, LW, { base: H * 0.58, amp: H * 0.13, scale: 80, ridged: true }),
      mountainPaint({
        lit: '#7a6ac0',
        shade: '#4a3a8a',
        haze: '#8a6ab0',
        light,
        snow: '#d8d0ff',
        snowShade: '#9a8ad0',
        snowLine: H * 0.5,
        fade: H * 0.1
      })
    );
    // Sylvaëlle au loin : flèches blanches et pointe lumineuse.
    const gf = far.getContext('2d'),
      tx = Math.round(M + W * 0.36),
      ty = Math.round(H * 0.58);
    for (const [dx, hh] of [
      [0, 46],
      [-7, 28],
      [7, 32]
    ])
      for (let k = 0; k < hh; k++) {
        const half = Math.round(0.5 + (k / hh) * 2.5);
        rect(gf, '#c8c8f0', tx + dx - half, ty - hh + k, half * 2 + 1, 1);
        rect(gf, '#8a8ad0', tx + dx + half, ty - hh + k, 1, 1);
      }
    const enchanted = [
      ['#1e4a5a', '#2e7a7a', '#5fd0c0'],
      ['#3a2a6a', '#6a4aa0', '#b08ae0'],
      ['#22545a', '#40908a', '#9ff0e0']
    ];
    // Lac scintillant.
    const lake = layer(LW, H),
      gl = lake.getContext('2d'),
      ly = Math.round(H * 0.63),
      lh = Math.round(H * 0.08);
    for (let y = ly; y < ly + lh; y++)
      rect(gl, css(mix([90, 96, 200], [42, 44, 120], (y - ly) / lh)), 0, y, LW, 1);
    for (let k = 0; k < 20; k += 2) rect(gl, css([200, 210, 255], 0.4 - k * 0.018), tx - 1, ly + k, 3, 1);
    const mid = layer(LW, H),
      midHs = ridge(r, LW, { base: H * 0.72, amp: H * 0.025, scale: 60, octaves: 2 });
    terrain(mid, midHs, (x, y, d) =>
      mix([46, 110, 114], [24, 64, 72], clamp(Math.floor((d / 30) * 3 + dither(x, y) + 0.5) / 3))
    );
    const gm = mid.getContext('2d');
    for (let x = 0; x < LW; x += 8 + Math.floor(r() * 10)) {
      if (Math.abs(x - (M + W * 0.5)) < W * 0.12) continue;
      bigTree(
        gm,
        r,
        x,
        Math.round(midHs[x]) + 2,
        18 + Math.floor(r() * 14),
        { bark: '#2a2440', barkLit: '#5a4a80', leaves: enchanted[Math.floor(r() * 3)] },
        light
      );
    }
    for (let k = 0; k < 40; k++)
      rect(
        gm,
        ['#9ff0e0', '#d4b4ff', '#ffffff'][k % 3],
        Math.round(r() * LW),
        Math.round(H * 0.5 + r() * H * 0.2),
        1,
        1
      );
    const hx = Math.round(M + W * 0.64);
    lilacHouse(gm, hx, Math.round(midHs[hx + 12]) + 1, 24, 15, '#ffffff');
    const crystals = [];
    for (const dx of [-10, -6, 30, 34]) {
      const x = hx + dx,
        y = Math.round(midHs[x]) + 2;
      crystals.push({ x, y });
      crystal('#5fd0e0', '#d8ffff')(gm, x, y, 2);
    }
    const flies = particles(46, p =>
      Object.assign(p, {
        x: r() * W,
        y: H * (0.6 + r() * 0.38),
        ph: r() * 6,
        sp: 0.5 + r(),
        life: 6 + r() * 8,
        hue: r() < 0.5
      })
    );
    const strip = layer(1, 40),
      gs = strip.getContext('2d'),
      grad = gs.createLinearGradient(0, 0, 0, 40);
    grad.addColorStop(0, 'rgba(180,120,255,0)');
    grad.addColorStop(0.35, 'rgba(160,140,255,0.5)');
    grad.addColorStop(0.7, 'rgba(90,255,190,0.7)');
    grad.addColorStop(1, 'rgba(90,255,190,0)');
    gs.fillStyle = grad;
    gs.fillRect(0, 0, 1, 40);
    return {
      back: [
        {
          c: skyC,
          depth: 0.02,
          anim(g, t, x0) {
            drawStars(g, stars, t, x0);
            for (let x = 0; x < W; x += 2) {
              const y = H * 0.1 + Math.sin(x * 0.012 + t * 0.25) * 12 + Math.sin(x * 0.037 - t * 0.4) * 5,
                h = 30 + Math.sin(x * 0.02 + t * 0.3) * 10;
              g.globalAlpha = clamp(0.22 + 0.22 * Math.sin(x * 0.008 + t * 0.2));
              g.drawImage(strip, x, Math.round(y), 2, Math.round(h));
            }
            g.globalAlpha = 1;
          }
        },
        {
          c: far,
          depth: 0.1,
          anim(g, t, x0) {
            halo(g, tx + x0, ty - 48, 1, 7, '#aef8ff', 0.4 + 0.2 * Math.sin(t * 2));
            rect(g, '#ffffff', tx + x0, ty - 48, 1, 1);
          }
        },
        {
          c: lake,
          depth: 0.2,
          anim(g, t) {
            drawWater(g, 0, ly, W, lh, t, [210, 220, 255], 1.5);
          }
        },
        {
          c: mid,
          depth: 0.4,
          anim(g, t, x0) {
            for (const c of crystals)
              halo(g, c.x + x0, c.y - 4, 1, 6, '#9ff0ff', 0.25 + 0.15 * Math.sin(t * 2 + c.x));
          }
        }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#40908a',
          near: '#123034',
          lean: 0.35,
          path: slabPath('#e8e4f0', '#d4cce4', '#d8b050', '#a89060'),
          edge: (g, x, y, rr) => {
            rect(g, '#2e7a74', x, y - 1, 1, 2);
            if (rr() < 0.05) rect(g, '#d4b4ff', x, y - 2, 1, 1);
          },
          details: put => {
            put(220, tuft('#22545a', '#9ff0e0'));
            put(50, flower(['#d4b4ff', '#9ff0e0', '#ffffff']));
            put(14, crystal('#5fd0e0', '#d8ffff'));
            put(10, crystal('#b08ae0', '#f0e0ff'));
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        flies.step(dt, p => {
          p.x += Math.sin(t * p.sp + p.ph) * 8 * dt;
          p.y += Math.cos(t * p.sp * 0.8 + p.ph) * 5 * dt;
          const a = clamp(Math.sin(t * 2 * p.sp + p.ph) * 0.5 + 0.5) * clamp(p.life / 2),
            c = p.hue ? [160, 255, 220] : [220, 180, 255],
            x = p.x + ox * 0.9;
          rect(g, css(c, a * 0.35), x - 1, p.y - 1, 3, 3);
          rect(g, css(c, a), x, p.y, 1, 1);
        });
      }
    };
  };

  // ---------------------------------------------------------------- Vargar : Forêt ancienne, la nuit
  SCENES.vargar = (W, H, M) => {
    const r = rng(53),
      LW = W + 2 * M,
      light = -1,
      mx = W * 0.37 + M,
      my = H * 0.2,
      mr = H * 0.07;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#03050c'],
      [0.45, '#0c1630'],
      [0.7, '#1a2440']
    ]);
    moon(skyC.getContext('2d'), mx, my, mr, '#eef0ff', '#c8cce8', '#9ab0f0');
    const stars = starField(r, W, H, 90, H * 0.45);
    // Lisières de la forêt, de plus en plus proches et sombres ; un rocher où hurle un loup, devant la lune.
    const far = layer(LW, H),
      farHs = ridge(r, LW, {
        base: H * 0.56,
        amp: H * 0.04,
        scale: 60,
        bumps: [{ x: Math.round(mx), y: my + mr * 0.9, slope: 0.3, slopeR: 3, flat: 2 }]
      });
    terrain(far, farHs, (x, y, d, slope) =>
      mix(
        slope * light > 0.3 ? [44, 58, 96] : [24, 32, 56],
        [14, 18, 34],
        clamp(Math.floor((d / 40) * 3 + dither(x, y)) / 3)
      )
    );
    const gf = far.getContext('2d');
    for (let x = 0; x < LW; x += 3 + Math.floor(r() * 3)) {
      if (Math.abs(x - mx) < 10) continue;
      pine(gf, x, Math.round(farHs[x]) + 3, 10 + Math.floor(r() * 10), '#141c34', '#2a3a62', light);
    }
    sprite(gf, Math.round(mx) - 6, Math.round(my + mr * 0.9) - WOLF.length + 1, WOLF, { '#': '#05070e' });
    const mid = layer(LW, H),
      midHs = ridge(r, LW, { base: H * 0.71, amp: H * 0.02, scale: 50, octaves: 2 });
    terrain(mid, midHs, (x, y, d) =>
      mix([30, 50, 46], [10, 18, 16], clamp(Math.floor((d / 30) * 3 + dither(x, y) + 0.5) / 3))
    );
    const gm = mid.getContext('2d'),
      oaks = [
        ['#0c1a16', '#1a3028', '#2e4a5a'],
        ['#0e1c1a', '#1e3430', '#3a5070']
      ];
    for (let x = 0; x < LW; x += 12 + Math.floor(r() * 12)) {
      if (Math.abs(x - (M + W * 0.5)) < W * 0.13) continue;
      bigTree(
        gm,
        r,
        x,
        Math.round(midHs[x]) + 3,
        26 + Math.floor(r() * 16),
        { bark: '#141414', barkLit: '#3a4460', leaves: oaks[Math.floor(r() * 2)] },
        light
      );
    }
    // Cabane en rondins, fenêtre éclairée ; un hibou sur une branche.
    const hx = Math.round(M + W * 0.63),
      hgy = Math.round(midHs[hx + 12]) + 1,
      chim = logCabin(gm, hx, hgy, 24, 12, '#ffc860');
    const owl = { x: Math.round(M + W * 0.3), y: Math.round(midHs[Math.round(M + W * 0.3)] - 30) };
    rect(gm, '#141414', owl.x - 6, owl.y + 4, 14, 1);
    rect(gm, '#3a2e24', owl.x, owl.y, 3, 4);
    rect(gm, '#5a4a3a', owl.x, owl.y, 1, 4);
    rect(gm, '#3a2e24', owl.x, owl.y - 1, 1, 1);
    rect(gm, '#3a2e24', owl.x + 2, owl.y - 1, 1, 1);
    const sm = smoke(r, 10);
    const eyes = [];
    for (let k = 0; k < 8; k++) {
      const x = Math.floor(r() * LW),
        y = Math.round(midHs[x]) - 3 - Math.floor(r() * 6);
      if (Math.abs(x - hx) > 30 && Math.abs(x - (M + W * 0.5)) > W * 0.1) eyes.push({ x, y, ph: r() * 20 });
    }
    // Rais de lune entre les arbres.
    const shafts = layer(LW, H),
      gsh = shafts.getContext('2d');
    for (let k = 0; k < 5; k++) {
      const x = r() * LW;
      gsh.fillStyle = 'rgba(170,190,255,0.05)';
      gsh.beginPath();
      gsh.moveTo(x, 0);
      gsh.lineTo(x + 10, 0);
      gsh.lineTo(x + 50, H);
      gsh.lineTo(x + 26, H);
      gsh.fill();
    }
    const fog1 = fogStrip(r, LW, Math.round(H * 0.14), '#8a9ad0', 0.14);
    const flies = particles(30, p =>
      Object.assign(p, { x: r() * W, y: H * (0.6 + r() * 0.38), ph: r() * 6, life: 6 + r() * 8 })
    );
    const cl = clouds(
      r,
      W,
      4,
      H * 0.06,
      H * 0.3,
      { base: '#2a3458', shade: '#141a34', lit: '#8a9ad0' },
      1,
      3
    );
    return {
      back: [
        {
          c: skyC,
          depth: 0.02,
          anim(g, t, x0, dt) {
            drawStars(g, stars, t, x0);
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
          depth: 0.4,
          anim(g, t, x0, dt) {
            drawSmoke(g, sm, dt, t, chim.cx + x0, chim.cy, [140, 150, 180]);
            halo(g, hx + 24 - 7 + x0, hgy - 5, 1, 8, '#ffc860', 0.12 + 0.04 * Math.sin(t * 3));
            const blink = Math.sin(t * 0.9) > -0.95;
            if (blink) {
              rect(g, '#ffd23a', owl.x + x0, owl.y + 1, 1, 1);
              rect(g, '#ffd23a', owl.x + 2 + x0, owl.y + 1, 1, 1);
            }
            for (const e of eyes)
              if (Math.sin(t * 0.7 + e.ph) > 0.3) {
                rect(g, '#ffd23a', e.x + x0, e.y, 1, 1);
                rect(g, '#ffd23a', e.x + x0 + 3, e.y, 1, 1);
              }
          }
        },
        {
          c: shafts,
          depth: 0.4,
          anim() {}
        }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#2e4a3c',
          near: '#081210',
          lean: 0.4,
          path: dirtPath('#4a3e30', '#2a2218', '#6a5a46'),
          edge: (g, x, y, rr) => {
            rect(g, '#1e3428', x, y - 1, 1, 2);
            if (rr() < 0.1)
              for (let k = 0; k < 3; k++)
                (rect(g, '#22402e', x - k, y - k, 1, 1), rect(g, '#22402e', x + k, y - k, 1, 1));
          },
          details: put => {
            put(160, tuft('#1a3024', '#3a6a4a'));
            put(36, (g, x, y, s) => {
              for (let k = 0; k < 2 + s * 2; k++)
                (rect(g, '#22402e', x - k, y - k, 1, 1), rect(g, '#22402e', x + k, y - k, 1, 1));
            });
            put(18, mushroom('#c83a3a', '#ffffff'));
            put(8, mushroom('#3a8ad0', '#aef8ff'));
            put(40, leaf(['#3a2a1a', '#4a3a24', '#2a2416']), true);
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        flies.step(dt, p => {
          p.x += Math.sin(t * 0.8 + p.ph) * 8 * dt;
          p.y += Math.cos(t * 0.6 + p.ph) * 5 * dt;
          const a = clamp(Math.sin(t * 2 + p.ph) * 0.5 + 0.5) * clamp(p.life / 2),
            x = p.x + ox * 0.9;
          rect(g, css([220, 255, 140], a * 0.35), x - 1, p.y - 1, 3, 3);
          rect(g, css([220, 255, 140], a), x, p.y, 1, 1);
        });
      }
    };
  };

  // ---------------------------------------------------------------- Sans héros : Marais brumeux
  SCENES.nuit = (W, H, M) => {
    const r = rng(61),
      LW = W + 2 * M;
    const skyC = layer(LW, H);
    sky(skyC, [
      [0, '#141c24'],
      [0.4, '#2e3e44'],
      [0.6, '#5a6e64'],
      [0.7, '#8a9a80']
    ]);
    moon(skyC.getContext('2d'), W * 0.62 + M, H * 0.24, H * 0.05, '#e8f0d8', '#c0ccb0', '#a8c0a0');
    const stars = starField(r, W, H, 50, H * 0.4);
    const far = layer(LW, H),
      farHs = ridge(r, LW, { base: H * 0.6, amp: H * 0.03, scale: 50, octaves: 3 });
    terrain(far, farHs, () => [40, 56, 52]);
    const gf = far.getContext('2d');
    for (let x = 0; x < LW; x += 10 + Math.floor(r() * 14))
      twistedTree(
        gf,
        r,
        x,
        Math.round(farHs[x]) + 2,
        12 + Math.floor(r() * 8),
        '#2a3a36',
        '#3e5248',
        r() < 0.5 ? 1 : -1
      );
    // Eau du marais, îlots, roseaux, arbres tordus ; cabane sur pilotis et petit pont.
    const water = layer(LW, H),
      gw = water.getContext('2d'),
      wy = Math.round(H * 0.62);
    for (let y = wy; y < H; y++)
      rect(gw, css(mix([63, 138, 134], [20, 46, 46], clamp((y - wy) / (H * 0.3)))), 0, y, LW, 1);
    const mid = layer(LW, H),
      midHs = ridge(r, LW, { base: H * 0.68, amp: H * 0.04, scale: 30, octaves: 3 });
    terrain(mid, midHs, (x, y, d) =>
      d > 6 + Math.sin(x * 0.3) * 2 ? null : mix([62, 106, 88], [40, 70, 60], clamp(d / 6))
    );
    const gm = mid.getContext('2d');
    for (let x = 0; x < LW; x += 14 + Math.floor(r() * 16)) {
      if (Math.abs(x - (M + W * 0.5)) < W * 0.12) continue;
      twistedTree(
        gm,
        r,
        x,
        Math.round(midHs[x]) + 2,
        18 + Math.floor(r() * 10),
        '#1e2a26',
        '#5a7a52',
        r() < 0.5 ? 1 : -1
      );
    }
    for (let x = 0; x < LW; x += 2 + Math.floor(r() * 4))
      if (r() < 0.5) reed('#4a6a3a', '#6a4a2a')(gm, x, Math.round(midHs[x]) + 3, 0.6 + r());
    const hx = Math.round(M + W * 0.64),
      hgy = Math.round(midHs[hx + 10]) - 2;
    stiltHut(gm, hx, hgy, 20, 11, '#ffd27a');
    for (let k = 0; k < 18; k++)
      rect(
        gm,
        k % 3 ? '#5a4028' : '#3a2a1a',
        hx - 20 + k,
        hgy + 2 + Math.round(Math.sin((k / 18) * Math.PI) * -2),
        1,
        2
      );
    const wisps = particles(9, p =>
      Object.assign(p, { x: r() * W, y: H * (0.58 + r() * 0.3), ph: r() * 6, life: 6 + r() * 6 })
    );
    const fog1 = fogStrip(r, LW, Math.round(H * 0.16), '#c0d8c8', 0.16),
      fog2 = fogStrip(r, LW, Math.round(H * 0.12), '#d8e8d8', 0.12);
    return {
      back: [
        {
          c: skyC,
          depth: 0.02,
          anim(g, t, x0) {
            drawStars(g, stars, t, x0);
          }
        },
        { c: far, depth: 0.12 },
        {
          c: water,
          depth: 0.2,
          anim(g, t) {
            drawWater(g, 0, wy, W, H - wy, t, [200, 230, 210], 0.7);
          }
        },
        {
          c: mid,
          depth: 0.4,
          anim(g, t, x0) {
            drawFog(g, fog1, t, 3, H * 0.56, W, x0);
          }
        }
      ],
      ground: (fx, fy) =>
        groundLayer(r, W, H, M, fx, fy, {
          far: '#3f7a74',
          near: '#122a2a',
          lean: 0.25,
          width: 0.07,
          path: plankPath('#7a5a3a', '#6a4c30', '#2a1e14', '#3a2a1a'),
          edge: (g, x, y, rr) => {
            if (rr() < 0.4) rect(g, '#5a8a6a', x, y, 2, 1);
          },
          details: put => {
            put(60, (g, x, y, s) => {
              g.fillStyle = '#3a6a3a';
              disc(g, x, y, s);
              rect(
                g,
                '#5a9a4a',
                x - Math.round(s * 0.5),
                y - Math.round(s * 0.4),
                Math.max(1, Math.round(s)),
                1
              );
            });
            put(70, reed('#3a5a32', '#6a4a2a'));
            put(80, (g, x, y, s) => rect(g, '#6aa8a0', x, y, Math.round(2 + s * 3), 1));
          }
        }),
      front: [],
      fx(g, t, dt, ox) {
        drawFog(g, fog2, t, 6, H * 0.74, W, ox);
        wisps.step(dt, p => {
          p.x += Math.sin(t * 0.5 + p.ph) * 6 * dt;
          p.y += Math.cos(t * 0.7 + p.ph) * 4 * dt;
          const a = clamp(0.5 + 0.5 * Math.sin(t * 1.5 + p.ph)) * clamp(p.life / 2),
            x = p.x + ox * 0.7;
          halo(g, x, p.y, 1, 6, '#9ff0d0', a * 0.6);
          rect(g, css([220, 255, 240], a), x, p.y, 1, 1);
        });
      }
    };
  };

  // ---------------------------------------------------------------- Boucle
  const g = canvas.getContext('2d');
  let current = 'nuit',
    built = null,
    builtKey = '',
    groundKey = '',
    groundC = null,
    groundY0 = 0,
    running = false,
    last = 0,
    par = 0,
    target = 0,
    failed = false;
  const cache = new Map();
  function size() {
    const px = Math.max(2, Math.round((window.innerHeight || 720) / 360));
    return {
      px,
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
  // Pieds du héros à l'écran : bas de l'aperçu (création ou sélection), là où le sprite pose les pieds.
  function feet(px, W, H) {
    const el = document.getElementById('lookPreview') || document.getElementById('selectPreview'),
      box = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
    if (!box || !box.height) return { fx: Math.round(W / 2), fy: Math.round(H * 0.82) };
    return {
      fx: Math.round((box.left + box.width / 2) / px / 4) * 4,
      fy: Math.round((box.top + box.height * 0.9) / px)
    };
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
      const { px, W, H } = size(),
        key = current + ':' + W + 'x' + H;
      if (key !== builtKey) {
        built = build(current);
        builtKey = key;
        groundKey = '';
        canvas.width = W;
        canvas.height = H;
        title.classList.add('painted');
      }
      const s = built,
        { fx, fy } = feet(px, W, H),
        gk = key + ':' + fx + ':' + fy;
      if (gk !== groundKey) {
        const ground = s.ground(fx, fy);
        groundC = ground.c;
        groundY0 = ground.y0;
        groundKey = gk;
      }
      par += (target - par) * Math.min(1, dt * 3);
      const t = now / 1000;
      g.imageSmoothingEnabled = false;
      // Les plans du fond sont dessinés pour un sol qui commence vers 72 % de la hauteur ; quand les pieds du
      // héros sont plus haut (petite fenêtre), tout le fond remonte avec le sol pour ne pas être caché.
      const lift = Math.min(0, Math.round(groundY0 - H * 0.72));
      g.save();
      g.translate(0, lift);
      for (const l of s.back) {
        const x0 = Math.round(-s.M + par * l.depth * s.M);
        if (l.c.width > 1) g.drawImage(l.c, x0, 0);
        if (l.anim) l.anim(g, t, x0, dt);
      }
      g.restore();
      // Le sol ne glisse pas : le héros reste posé dessus.
      g.drawImage(groundC, -s.M, 0);
      for (const l of s.front) {
        const x0 = Math.round(-s.M + par * l.depth * s.M);
        g.drawImage(l.c, x0, 0);
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
    // Scène d'une race (inconnue ou vide : le Marais brumeux, sans héros).
    set(name) {
      current = Object.hasOwn(SCENES, name) ? name : 'nuit';
      schedule();
    },
    current: () => current
  });
  schedule();
})();
